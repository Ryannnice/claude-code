/**
 * Service for heap dump capture.
 * Used by the /heapdump command.
 */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { createWriteStream, writeFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 pipeline，将 stream/promises 中已经封装好的能力接到本文件流程里。
import { pipeline } from 'stream/promises'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getHeapSnapshot,
  getHeapSpaceStatistics,
  getHeapStatistics,
  type HeapSpaceInfo,
} from 'v8'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 getDesktopPath，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getDesktopPath } from './file.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// HeapDumpResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HeapDumpResult = {
  success: boolean
  heapPath?: string
  diagPath?: string
  error?: string
}

/**
 * Memory diagnostics captured alongside heap dump.
 * Helps identify if leak is in V8 heap (captured in snapshot) or native memory (not captured).
 */
// MemoryDiagnostics 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryDiagnostics = {
  timestamp: string
  sessionId: string
  trigger: 'manual' | 'auto-1.5GB'
  dumpNumber: number // 1st, 2nd, etc. auto dump in this session (0 for manual)
  uptimeSeconds: number
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
    rss: number
  }
  memoryGrowthRate: {
    bytesPerSecond: number
    mbPerHour: number
  }
  v8HeapStats: {
    heapSizeLimit: number // Max heap size allowed
    mallocedMemory: number // Memory allocated outside V8 heap
    peakMallocedMemory: number // Peak native memory
    detachedContexts: number // Leaked contexts - key leak indicator!
    nativeContexts: number // Active contexts
  }
  v8HeapSpaces?: Array<{
    name: string
    size: number
    used: number
    available: number
  }>
  resourceUsage: {
    maxRSS: number // Peak RSS in bytes
    userCPUTime: number
    systemCPUTime: number
  }
  activeHandles: number // Leaked timers, sockets, file handles
  activeRequests: number // Pending async operations
  openFileDescriptors?: number // Linux/macOS - indicates resource leaks
  analysis: {
    potentialLeaks: string[]
    recommendation: string
  }
  smapsRollup?: string // Linux only - detailed memory breakdown
  platform: string
  nodeVersion: string
  ccVersion: string
}

/**
 * Capture memory diagnostics.
 * This helps identify if the leak is in V8 heap (captured) or native memory (not captured).
 */
// captureMemoryDiagnostics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function captureMemoryDiagnostics(
  trigger: 'manual' | 'auto-1.5GB',
  dumpNumber = 0,
): Promise<MemoryDiagnostics> {
  // usage保存`process.memoryUsage`，供共享工具后续处理使用。
  const usage = process.memoryUsage()
  // heapStats 集合读取`getHeapStatistics`，供共享工具后续处理使用。
  const heapStats = getHeapStatistics()
  // resourceUsage保存`process.resourceUsage`，供共享工具后续处理使用。
  const resourceUsage = process.resourceUsage()
  // uptimeSeconds 集合保存`process.uptime`，供共享工具后续处理使用。
  const uptimeSeconds = process.uptime()

  // getHeapSpaceStatistics() is not available in Bun
  // heapSpaceStats 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let heapSpaceStats: HeapSpaceInfo[] | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // heapSpaceStats 集合更新为 `getHeapSpaceStatistics()`，确保共享工具后续读取最新状态。
    heapSpaceStats = getHeapSpaceStatistics()
  } catch {
    // Not available in Bun runtime
  }

  // Get active handles/requests count (these are internal APIs but stable)
  // activeHandles 集合 命名 `(`，让后续代码直接表达这个值的用途。
  const activeHandles = (
    process as unknown as { _getActiveHandles: () => unknown[] }
  )._getActiveHandles().length
  // activeRequests 请求数据 命名 `(`，让后续代码直接表达这个值的用途。
  const activeRequests = (
    process as unknown as { _getActiveRequests: () => unknown[] }
  )._getActiveRequests().length

  // Try to count open file descriptors (Linux/macOS)
  // openFileDescriptors 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let openFileDescriptors: number | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // openFileDescriptors 文件数据更新为 `(await readdir('/proc/self/fd')).length`，确保共享工具后续读取最新状态。
    openFileDescriptors = (await readdir('/proc/self/fd')).length
  } catch {
    // Not on Linux - try macOS approach would require lsof, skip for now
  }

  // Try to read Linux smaps_rollup for detailed memory breakdown
  // smapsRollup 先占位，稍后的条件分支会根据实际输入补齐它。
  let smapsRollup: string | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // smapsRollup更新为 `await readFile('/proc/self/smaps_rollup', 'utf8')`，确保共享工具后续读取最新状态。
    smapsRollup = await readFile('/proc/self/smaps_rollup', 'utf8')
  } catch {
    // Not on Linux or no access - this is fine
  }

  // Calculate native memory (RSS - heap) and growth rate
  // nativeMemory 命名 `usage.rss - usage.heapUsed`，让后续代码直接表达这个值的用途。
  const nativeMemory = usage.rss - usage.heapUsed
  // bytesPerSecond保存`uptimeSeconds > 0 ? usage.rss / uptimeSeconds : 0`，供共享工具 heap Dump Service后续判断或输出使用。
  const bytesPerSecond = uptimeSeconds > 0 ? usage.rss / uptimeSeconds : 0
  // mbPerHour保存`(bytesPerSecond * 3600) / (1024 * 1024)`，供共享工具 heap Dump Service后续判断或输出使用。
  const mbPerHour = (bytesPerSecond * 3600) / (1024 * 1024)

  // Identify potential leaks
  // potentialLeaks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const potentialLeaks: string[] = []
  // 满足 `heapStats.number_of_detached_contexts > 0` 时，共享工具执行该分支。
  if (heapStats.number_of_detached_contexts > 0) {
    // potentialLeaks 集合追加新条目，保持收集顺序与输入顺序一致。
    potentialLeaks.push(
      `${heapStats.number_of_detached_contexts} detached context(s) - possible iframe/context leak`,
    )
  }
  // 满足 `activeHandles > 100` 时，共享工具执行该分支。
  if (activeHandles > 100) {
    // potentialLeaks 集合追加新条目，保持收集顺序与输入顺序一致。
    potentialLeaks.push(
      `${activeHandles} active handles - possible timer/socket leak`,
    )
  }
  // 满足 `nativeMemory > usage.heapUsed` 时，共享工具执行该分支。
  if (nativeMemory > usage.heapUsed) {
    // potentialLeaks 集合追加新条目，保持收集顺序与输入顺序一致。
    potentialLeaks.push(
      'Native memory > heap - leak may be in native addons (node-pty, sharp, etc.)',
    )
  }
  // 满足 `mbPerHour > 100` 时，共享工具执行该分支。
  if (mbPerHour > 100) {
    // potentialLeaks 集合追加新条目，保持收集顺序与输入顺序一致。
    potentialLeaks.push(
      `High memory growth rate: ${mbPerHour.toFixed(1)} MB/hour`,
    )
  }
  // 只有 `openFileDescriptors && openFileDescriptors > 500` 满足时，共享工具才执行该分支。
  if (openFileDescriptors && openFileDescriptors > 500) {
    // potentialLeaks 集合追加新条目，保持收集顺序与输入顺序一致。
    potentialLeaks.push(
      `${openFileDescriptors} open file descriptors - possible file/socket leak`,
    )
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    trigger,
    dumpNumber,
    uptimeSeconds,
    memoryUsage: {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      rss: usage.rss,
    },
    memoryGrowthRate: {
      bytesPerSecond,
      mbPerHour,
    },
    v8HeapStats: {
      heapSizeLimit: heapStats.heap_size_limit,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory,
      detachedContexts: heapStats.number_of_detached_contexts,
      nativeContexts: heapStats.number_of_native_contexts,
    },
    // 这个回调绑定到 v8HeapSpaces: heapSpaceStats?.map(space => ({，负责共享工具在该局部场景下的响应。
    v8HeapSpaces: heapSpaceStats?.map(space => ({
      name: space.space_name,
      size: space.space_size,
      used: space.space_used_size,
      available: space.space_available_size,
    })),
    resourceUsage: {
      maxRSS: resourceUsage.maxRSS * 1024, // Convert KB to bytes
      userCPUTime: resourceUsage.userCPUTime,
      systemCPUTime: resourceUsage.systemCPUTime,
    },
    activeHandles,
    activeRequests,
    openFileDescriptors,
    analysis: {
      potentialLeaks,
      recommendation:
        potentialLeaks.length > 0
          ? `WARNING: ${potentialLeaks.length} potential leak indicator(s) found. See potentialLeaks array.`
          : 'No obvious leak indicators. Check heap snapshot for retained objects.',
    },
    smapsRollup,
    platform: process.platform,
    nodeVersion: process.version,
    ccVersion: MACRO.VERSION,
  }
}

/**
 * Core heap dump function — captures heap snapshot + diagnostics to ~/Desktop.
 *
 * Diagnostics are written BEFORE the heap snapshot is captured, because the
 * V8 heap snapshot serialization can crash for very large heaps. By writing
 * diagnostics first, we still get useful memory info even if the snapshot fails.
 */
// performHeapDump 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function performHeapDump(
  trigger: 'manual' | 'auto-1.5GB' = 'manual',
  dumpNumber = 0,
): Promise<HeapDumpResult> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
    const sessionId = getSessionId()

    // Capture diagnostics before any other async I/O —
    // the heap dump itself allocates memory and would skew the numbers.
    // diagnostics 集合保存`captureMemoryDiagnostics`，供共享工具后续处理使用。
    const diagnostics = await captureMemoryDiagnostics(trigger, dumpNumber)

    // toGB封装成回调，供共享工具 heap Dump Service在事件触发或异步步骤中调用。
    const toGB = (bytes: number): string =>
      (bytes / 1024 / 1024 / 1024).toFixed(3)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[HeapDump] Memory state:
  heapUsed: ${toGB(diagnostics.memoryUsage.heapUsed)} GB (in snapshot)
  external: ${toGB(diagnostics.memoryUsage.external)} GB (NOT in snapshot)
  rss: ${toGB(diagnostics.memoryUsage.rss)} GB (total process)
  ${diagnostics.analysis.recommendation}`)

    // dumpDir读取`getDesktopPath`，供共享工具后续处理使用。
    const dumpDir = getDesktopPath()
    // 等待 `getFsImplementation().mkdir(dumpDir)` 完成，再继续共享工具 heap Dump Service的异步流程。
    await getFsImplementation().mkdir(dumpDir)

    // suffix保存`dumpNumber > 0 ? `-dump${dumpNumber}` : ''`，供共享工具 heap Dump Service后续判断或输出使用。
    const suffix = dumpNumber > 0 ? `-dump${dumpNumber}` : ''
    // heapFilename 文件数据 命名 ``${sessionId}${suffix}.heapsnapshot``，让后续代码直接表达这个值的用途。
    const heapFilename = `${sessionId}${suffix}.heapsnapshot`
    // diagFilename 文件数据固定为 ``${sessionId}${suffix}-diagnostics.json``，作为共享工具 heap Dump Service后续展示或比较的基准。
    const diagFilename = `${sessionId}${suffix}-diagnostics.json`
    // heapPath 路径数据格式化`join`，供共享工具后续处理使用。
    const heapPath = join(dumpDir, heapFilename)
    // diagPath 路径数据格式化`join`，供共享工具后续处理使用。
    const diagPath = join(dumpDir, diagFilename)

    // Write diagnostics first (cheap, unlikely to fail)
    // 等待 `writeFile(diagPath, jsonStringify(diagnostics, null, 2), {` 完成，再继续共享工具 heap Dump Service的异步流程。
    await writeFile(diagPath, jsonStringify(diagnostics, null, 2), {
      mode: 0o600,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[HeapDump] Diagnostics written to ${diagPath}`)

    // Write heap snapshot (this can crash for very large heaps)
    // 等待 `writeHeapSnapshot(heapPath)` 完成，再继续共享工具 heap Dump Service的异步流程。
    await writeHeapSnapshot(heapPath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[HeapDump] Heap dump written to ${heapPath}`)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_heap_dump', {
      triggerManual: trigger === 'manual',
      triggerAuto15GB: trigger === 'auto-1.5GB',
      dumpNumber,
      success: true,
    })

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, heapPath, diagPath }
  } catch (err) {
    // 错误保存`toError`，供共享工具后续处理使用。
    const error = toError(err)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_heap_dump', {
      triggerManual: trigger === 'manual',
      triggerAuto15GB: trigger === 'auto-1.5GB',
      dumpNumber,
      success: false,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, error: error.message }
  }
}

/**
 * Write heap snapshot to a file.
 * Uses pipeline() which handles stream cleanup automatically on errors.
 */
// writeHeapSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeHeapSnapshot(filepath: string): Promise<void> {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // In Bun, heapsnapshots are currently not streaming.
    // Use synchronous I/O despite potentially large filesize so that we avoid cloning the string for cross-thread usage.
    //
    /* eslint-disable custom-rules/no-sync-fs -- intentionally sync to avoid cloning large heap snapshot string for cross-thread usage */
    // @ts-expect-error 2nd argument is in the next version of Bun
    // 调用 writeFileSync，触发共享工具此处需要的副作用。
    writeFileSync(filepath, Bun.generateHeapSnapshot('v8', 'arraybuffer'), {
      mode: 0o600,
    })
    /* eslint-enable custom-rules/no-sync-fs */

    // Force GC to try to free that heap snapshot sooner.
    // 调用 Bun.gc，触发共享工具此处需要的副作用。
    Bun.gc(true)
    // 共享工具 heap Dump Service在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // writeStream构建`createWriteStream`，供共享工具后续处理使用。
  const writeStream = createWriteStream(filepath, { mode: 0o600 })
  // heapSnapshotStream读取`getHeapSnapshot`，供共享工具后续处理使用。
  const heapSnapshotStream = getHeapSnapshot()
  // 等待 `pipeline(heapSnapshotStream, writeStream)` 完成，再继续共享工具 heap Dump Service的异步流程。
  await pipeline(heapSnapshotStream, writeStream)
}
