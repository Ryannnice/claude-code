/**
 * PID-Based Version Locking
 *
 * This module provides PID-based locking for running Claude Code versions.
 * Unlike mtime-based locking (which can hold locks for 30 days after a crash),
 * PID-based locking can immediately detect when a process is no longer running.
 *
 * Lock files contain JSON with the PID and metadata, and staleness is determined
 * by checking if the process is still alive.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join } from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from '../envUtils.js'
// 引入 isENOENT、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT, toError } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 getProcessCommand，将 ../genericProcessUtils.js 中已经封装好的能力接到本文件流程里。
import { getProcessCommand } from '../genericProcessUtils.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  jsonParse,
  jsonStringify,
  writeFileSync_DEPRECATED,
} from '../slowOperations.js'

/**
 * Check if PID-based version locking is enabled.
 * When disabled, falls back to mtime-based locking (30-day timeout).
 *
 * Controlled by GrowthBook gate with local override:
 * - Set ENABLE_PID_BASED_VERSION_LOCKING=true to force-enable
 * - Set ENABLE_PID_BASED_VERSION_LOCKING=false to force-disable
 * - If unset, GrowthBook gate (tengu_pid_based_version_locking) controls rollout
 */
// isPidBasedLockingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPidBasedLockingEnabled(): boolean {
  // envVar 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envVar = process.env.ENABLE_PID_BASED_VERSION_LOCKING
  // If env var is explicitly set, respect it
  // 满足 `isEnvTruthy(envVar)` 时，共享工具执行该分支。
  if (isEnvTruthy(envVar)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `isEnvDefinedFalsy(envVar)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(envVar)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // GrowthBook controls gradual rollout (returns false for external users)
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(`，作为共享工具这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_pid_based_version_locking',
    false,
  )
}

/**
 * Content stored in a version lock file
 */
// VersionLockContent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type VersionLockContent = {
  pid: number
  version: string
  execPath: string
  acquiredAt: number // timestamp when lock was acquired
}

/**
 * Information about a lock for diagnostic purposes
 */
// LockInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LockInfo = {
  version: string
  pid: number
  isProcessRunning: boolean
  execPath: string
  acquiredAt: Date
  lockFilePath: string
}

// Fallback stale timeout (2 hours) - used when PID check is inconclusive
// This is much shorter than the previous 30-day timeout but still allows
// for edge cases like network filesystems where PID check might fail
// FALLBACK_STALE_MS 集合保存`2 * 60 * 60 * 1000`，供共享工具 pid Lock后续判断或输出使用。
const FALLBACK_STALE_MS = 2 * 60 * 60 * 1000

/**
 * Check if a process with the given PID is currently running
 * Uses signal 0 which doesn't actually send a signal but checks if we can
 */
// isProcessRunning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProcessRunning(pid: number): boolean {
  // PID 0 is special - it refers to the current process group, not a real process
  // PID 1 is init/systemd and is always running but shouldn't be considered for locks
  // 满足 `pid <= 1` 时，共享工具执行该分支。
  if (pid <= 1) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.kill，触发共享工具此处需要的副作用。
    process.kill(pid, 0)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Validate that a running process is actually a Claude process
 * This helps mitigate PID reuse issues
 */
// isClaudeProcess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isClaudeProcess(pid: number, expectedExecPath: string): boolean {
  // 满足 `!isProcessRunning(pid)` 时，共享工具执行该分支。
  if (!isProcessRunning(pid)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // If the PID matches our current process, we know it's valid
  // This handles test environments where the command might not contain 'claude'
  // 满足 `pid === process.pid` 时，共享工具执行该分支。
  if (pid === process.pid) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 命令读取`getProcessCommand`，供共享工具后续处理使用。
    const command = getProcessCommand(pid)
    // 命令缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!command) {
      // If we can't get the command, trust the PID check
      // This is conservative - we'd rather not delete a running version
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Check if the command contains 'claude' or the expected exec path
    // normalizedCommand 命令数据保存`command.toLowerCase`，供共享工具后续处理使用。
    const normalizedCommand = command.toLowerCase()
    // normalizedExecPath 路径数据保存`expectedExecPath.toLowerCase`，供共享工具后续处理使用。
    const normalizedExecPath = expectedExecPath.toLowerCase()

    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      normalizedCommand.includes('claude') ||
      normalizedCommand.includes(normalizedExecPath)
    )
  } catch {
    // If command check fails, trust the PID check
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
}

/**
 * Read and parse a lock file's content
 */
// readLockContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readLockContent(
  lockFilePath: string,
): VersionLockContent | null {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFileSync`，供共享工具后续处理使用。
    const content = fs.readFileSync(lockFilePath, { encoding: 'utf8' })
    // 只有 `!content || content.trim() === ''` 满足时，共享工具才执行该分支。
    if (!content || content.trim() === '') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(content) as VersionLockContent

    // Validate required fields
    // `typeof parsed.pid` 与 `'number' || !parsed.version` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof parsed.pid !== 'number' || !parsed.version || !parsed.execPath) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回 `parsed`，作为共享工具这次计算的结果。
    return parsed
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Check if a lock file represents an active lock (process still running)
 */
// isLockActive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLockActive(lockFilePath: string): boolean {
  // 文本内容读取`readLockContent`，供共享工具后续处理使用。
  const content = readLockContent(lockFilePath)

  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 从 `content` 解构 pid、execPath，减少共享工具 pid Lock对同一对象的重复访问。
  const { pid, execPath } = content

  // Primary check: is the process running?
  // 满足 `!isProcessRunning(pid)` 时，共享工具执行该分支。
  if (!isProcessRunning(pid)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Secondary validation: is it actually a Claude process?
  // This helps with PID reuse scenarios
  // 满足 `!isClaudeProcess(pid, execPath)` 时，共享工具执行该分支。
  if (!isClaudeProcess(pid, execPath)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Lock PID ${pid} is running but does not appear to be Claude - treating as stale`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Fallback: if the lock is very old (> 2 hours) and we can't validate
  // the command, be conservative and consider it potentially stale
  // This handles edge cases like network filesystems
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`fs.statSync`，供共享工具后续处理使用。
    const stats = fs.statSync(lockFilePath)
    // age记录时间`Date.now`，供共享工具后续处理使用。
    const age = Date.now() - stats.mtimeMs
    // 满足 `age > FALLBACK_STALE_MS` 时，共享工具执行该分支。
    if (age > FALLBACK_STALE_MS) {
      // Double-check that we can still see the process
      // 满足 `!isProcessRunning(pid)` 时，共享工具执行该分支。
      if (!isProcessRunning(pid)) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
  } catch {
    // If we can't stat the file, trust the PID check
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Write lock content to a file atomically
 */
// writeLockFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeLockFile(
  lockFilePath: string,
  content: VersionLockContent,
): void {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // tempPath 路径数据记录时间`Date.now`，供共享工具后续处理使用。
  const tempPath = `${lockFilePath}.tmp.${process.pid}.${Date.now()}`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
    writeFileSync_DEPRECATED(tempPath, jsonStringify(content, null, 2), {
      encoding: 'utf8',
      flush: true,
    })
    // 调用 fs.renameSync，触发共享工具此处需要的副作用。
    fs.renameSync(tempPath, lockFilePath)
  } catch (error) {
    // Clean up temp file on failure (best-effort)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
      fs.unlinkSync(tempPath)
    } catch {
      // Ignore cleanup errors (ENOENT expected if write failed before file creation)
    }
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

/**
 * Try to acquire a lock on a version file
 * Returns a release function if successful, null if the lock is already held
 */
// tryAcquireLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryAcquireLock(
  versionPath: string,
  lockFilePath: string,
): Promise<(() => void) | null> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // versionName保存`basename`，供共享工具后续处理使用。
  const versionName = basename(versionPath)

  // Check if there's an existing active lock (including by our own process)
  // Use isLockActive for consistency with cleanup - it checks both PID running AND
  // validates it's actually a Claude process (to handle PID reuse scenarios)
  // 满足 `isLockActive(lockFilePath)` 时，共享工具执行该分支。
  if (isLockActive(lockFilePath)) {
    // existingContent读取`readLockContent`，供共享工具后续处理使用。
    const existingContent = readLockContent(lockFilePath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cannot acquire lock for ${versionName} - held by PID ${existingContent?.pid}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Try to acquire the lock
  // lockContent 集中保存共享工具 pid Lock要一起传递的字段。
  const lockContent: VersionLockContent = {
    pid: process.pid,
    version: versionName,
    execPath: process.execPath,
    acquiredAt: Date.now(),
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 writeLockFile，触发共享工具此处需要的副作用。
    writeLockFile(lockFilePath, lockContent)

    // Verify we actually got the lock (race condition check)
    // verifyContent读取`readLockContent`，供共享工具后续处理使用。
    const verifyContent = readLockContent(lockFilePath)
    // `verifyContent?.pid` 与 `process.pid` 不一致时刷新派生状态，避免使用过期结果。
    if (verifyContent?.pid !== process.pid) {
      // Another process won the race
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Acquired PID lock for ${versionName} (PID ${process.pid})`)

    // Return release function
    // 返回 `() => {`，作为共享工具这次计算的结果。
    return () => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // Only release if we still own the lock
        // currentContent读取`readLockContent`，供共享工具后续处理使用。
        const currentContent = readLockContent(lockFilePath)
        // 满足 `currentContent?.pid === process.pid` 时，共享工具执行该分支。
        if (currentContent?.pid === process.pid) {
          // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
          fs.unlinkSync(lockFilePath)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Released PID lock for ${versionName}`)
        }
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to release lock for ${versionName}: ${error}`)
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to acquire lock for ${versionName}: ${error}`)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Acquire a lock and hold it for the lifetime of the process
 * This is used for locking the currently running version
 */
// acquireProcessLifetimeLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function acquireProcessLifetimeLock(
  versionPath: string,
  lockFilePath: string,
): Promise<boolean> {
  // release保存`tryAcquireLock`，供共享工具后续处理使用。
  const release = await tryAcquireLock(versionPath, lockFilePath)

  // release缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!release) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Register cleanup on process exit
  // cleanup封装成回调，供共享工具 pid Lock在事件触发或异步步骤中调用。
  const cleanup = () => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 release，触发共享工具此处需要的副作用。
      release()
    } catch {
      // Ignore errors during process exit
    }
  }

  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('exit', cleanup)
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('SIGINT', cleanup)
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('SIGTERM', cleanup)

  // Don't call release() - we want to hold the lock until process exits
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Execute a callback while holding a lock
 * Returns true if the callback executed, false if lock couldn't be acquired
 */
// withLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function withLock(
  versionPath: string,
  lockFilePath: string,
  // 这个回调绑定到 callback: () => void | Promise<void>,，负责共享工具在该局部场景下的响应。
  callback: () => void | Promise<void>,
): Promise<boolean> {
  // release保存`tryAcquireLock`，供共享工具后续处理使用。
  const release = await tryAcquireLock(versionPath, lockFilePath)

  // release缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!release) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `callback()` 完成，再继续共享工具 pid Lock的异步流程。
    await callback()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } finally {
    // 调用 release，触发共享工具此处需要的副作用。
    release()
  }
}

/**
 * Get information about all version locks for diagnostics
 */
// getAllLockInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllLockInfo(locksDir: string): LockInfo[] {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // lockInfos 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lockInfos: LockInfo[] = []

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockFiles 文件数据保存`fs`，供共享工具 pid Lock后续判断或输出使用。
    const lockFiles = fs
      .readdirStringSync(locksDir)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((f: string) => f.endsWith('.lock'))

    // 按顺序遍历 `lockFiles` 中的lockFile 文件数据，逐个交给共享工具处理。
    for (const lockFile of lockFiles) {
      // lockFilePath 路径数据格式化`join`，供共享工具后续处理使用。
      const lockFilePath = join(locksDir, lockFile)
      // 文本内容读取`readLockContent`，供共享工具后续处理使用。
      const content = readLockContent(lockFilePath)

      // 满足 `content` 时，共享工具执行该分支。
      if (content) {
        // lockInfos 集合追加新条目，保持收集顺序与输入顺序一致。
        lockInfos.push({
          version: content.version,
          pid: content.pid,
          isProcessRunning: isProcessRunning(content.pid),
          execPath: content.execPath,
          acquiredAt: new Date(content.acquiredAt),
          lockFilePath,
        })
      }
    }
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 返回 `lockInfos`，作为共享工具这次计算的结果。
      return lockInfos
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
  }

  // 返回 `lockInfos`，作为共享工具这次计算的结果。
  return lockInfos
}

/**
 * Clean up stale locks (locks where the process is no longer running)
 * Returns the number of locks cleaned up
 *
 * Handles both:
 * - PID-based locks (files containing JSON with PID)
 * - Legacy proper-lockfile locks (directories created by mtime-based locking)
 */
// cleanupStaleLocks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cleanupStaleLocks(locksDir: string): number {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // cleanedCount 数量保存`0`，供共享工具 pid Lock后续判断或输出使用。
  let cleanedCount = 0

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockEntries 集合保存`fs`，供共享工具 pid Lock后续判断或输出使用。
    const lockEntries = fs
      .readdirStringSync(locksDir)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((f: string) => f.endsWith('.lock'))

    // 按顺序遍历 `lockEntries` 中的lockEntry，逐个交给共享工具处理。
    for (const lockEntry of lockEntries) {
      // lockFilePath 路径数据格式化`join`，供共享工具后续处理使用。
      const lockFilePath = join(locksDir, lockEntry)

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // stats 集合保存`fs.lstatSync`，供共享工具后续处理使用。
        const stats = fs.lstatSync(lockFilePath)

        // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
        if (stats.isDirectory()) {
          // Legacy proper-lockfile directory lock - always remove when PID-based
          // locking is enabled since these are from a different locking mechanism
          // 调用 fs.rmSync，触发共享工具此处需要的副作用。
          fs.rmSync(lockFilePath, { recursive: true, force: true })
          // 共享工具 pid Lock在这里处理 `cleanedCount++`，完成这一小步状态转换。
          cleanedCount++
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleaned up legacy directory lock: ${lockEntry}`)
        // 共享工具 pid Lock在这里处理 `} else if (!isLockActive(lockFilePath)) {`，完成这一小步状态转换。
        } else if (!isLockActive(lockFilePath)) {
          // PID-based file lock with no running process
          // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
          fs.unlinkSync(lockFilePath)
          // 共享工具 pid Lock在这里处理 `cleanedCount++`，完成这一小步状态转换。
          cleanedCount++
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleaned up stale lock: ${lockEntry}`)
        }
      } catch {
        // Ignore individual cleanup errors
      }
    }
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 返回 `0`，作为共享工具这次计算的结果。
      return 0
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
  }

  // 返回 `cleanedCount`，作为共享工具这次计算的结果。
  return cleanedCount
}
