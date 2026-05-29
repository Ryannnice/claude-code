// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, rename } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join } from 'path'
// 引入 getOriginalCwd、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../bootstrap/state.js'
// 引入 createBufferedWriter，将 ./bufferedWriter.js 中已经封装好的能力接到本文件流程里。
import { createBufferedWriter } from './bufferedWriter.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 sanitizePath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { sanitizePath } from './path.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// Mutable recording state — filePath is updated when session ID changes (e.g., --resume)
// recordingState 状态 集中保存共享工具 asciicast要一起传递的字段。
const recordingState: { filePath: string | null; timestamp: number } = {
  filePath: null,
  timestamp: 0,
}

/**
 * Get the asciicast recording file path.
 * For ants with CLAUDE_CODE_TERMINAL_RECORDING=1: returns a path.
 * Otherwise: returns null.
 * The path is computed once and cached in recordingState.
 */
// getRecordFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRecordFilePath(): string | null {
  // `recordingState.filePath` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (recordingState.filePath !== null) {
    // 返回 `recordingState.filePath`，作为共享工具这次计算的结果。
    return recordingState.filePath
  }
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_TERMINAL_RECORDING)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_TERMINAL_RECORDING)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // Record alongside the transcript.
  // Each launch gets its own file so --continue produces multiple recordings.
  // projectsDir格式化`join`，供共享工具后续处理使用。
  const projectsDir = join(getClaudeConfigHomeDir(), 'projects')
  // projectDir格式化`join`，供共享工具后续处理使用。
  const projectDir = join(projectsDir, sanitizePath(getOriginalCwd()))
  // timestamp更新为 `Date.now()`，确保共享工具后续读取最新状态。
  recordingState.timestamp = Date.now()
  // 文件路径更新为 `join(`，确保共享工具后续读取最新状态。
  recordingState.filePath = join(
    projectDir,
    `${getSessionId()}-${recordingState.timestamp}.cast`,
  )
  // 返回 `recordingState.filePath`，作为共享工具这次计算的结果。
  return recordingState.filePath
}

// _resetRecordingStateForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetRecordingStateForTesting(): void {
  // 文件路径更新为 `null`，确保共享工具后续读取最新状态。
  recordingState.filePath = null
  // timestamp更新为 `0`，确保共享工具后续读取最新状态。
  recordingState.timestamp = 0
}

/**
 * Find all .cast files for the current session.
 * Returns paths sorted by filename (chronological by timestamp suffix).
 */
// getSessionRecordingPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionRecordingPaths(): string[] {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // projectsDir格式化`join`，供共享工具后续处理使用。
  const projectsDir = join(getClaudeConfigHomeDir(), 'projects')
  // projectDir格式化`join`，供共享工具后续处理使用。
  const projectDir = join(projectsDir, sanitizePath(getOriginalCwd()))
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- called during /share before upload, not in hot path
    // entries 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const entries = getFsImplementation().readdirSync(projectDir)
    // names 集合保存`(`，供共享工具 asciicast后续判断或输出使用。
    const names = (
      typeof entries[0] === 'string'
        ? entries
        // 这个回调绑定到 : (entries as { name: string }[]).map(e => e.name)，负责共享工具在该局部场景下的响应。
        : (entries as { name: string }[]).map(e => e.name)
    ) as string[]
    // files 文件数据保存`names`，供后续判断或组装使用。
    const files = names
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(f => f.startsWith(sessionId) && f.endsWith('.cast'))
      .sort()
    // 返回 `files.map(f => join(projectDir, f))`，作为共享工具这次计算的结果。
    return files.map(f => join(projectDir, f))
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Rename the recording file to match the current session ID.
 * Called after --resume/--continue changes the session ID via switchSession().
 * The recorder was installed with the initial (random) session ID; this renames
 * the file so getSessionRecordingPaths() can find it by the resumed session ID.
 */
// renameRecordingForSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function renameRecordingForSession(): Promise<void> {
  // oldPath 路径数据保存`recordingState.filePath`，供后续判断或组装使用。
  const oldPath = recordingState.filePath
  // 只有 `!oldPath || recordingState.timestamp === 0` 满足时，共享工具才执行该分支。
  if (!oldPath || recordingState.timestamp === 0) {
    // 共享工具 asciicast在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // projectsDir格式化`join`，供共享工具后续处理使用。
  const projectsDir = join(getClaudeConfigHomeDir(), 'projects')
  // projectDir格式化`join`，供共享工具后续处理使用。
  const projectDir = join(projectsDir, sanitizePath(getOriginalCwd()))
  // newPath 路径数据格式化`join`，供共享工具后续处理使用。
  const newPath = join(
    projectDir,
    `${getSessionId()}-${recordingState.timestamp}.cast`,
  )
  // 满足 `oldPath === newPath` 时，共享工具执行该分支。
  if (oldPath === newPath) {
    // 共享工具 asciicast在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Flush pending writes before renaming
  // 等待 `recorder?.flush()` 完成，再继续共享工具 asciicast的异步流程。
  await recorder?.flush()
  // oldName保存`basename`，供共享工具后续处理使用。
  const oldName = basename(oldPath)
  // newName保存`basename`，供共享工具后续处理使用。
  const newName = basename(newPath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rename(oldPath, newPath)` 完成，再继续共享工具 asciicast的异步流程。
    await rename(oldPath, newPath)
    // 文件路径更新为 `newPath`，确保共享工具后续读取最新状态。
    recordingState.filePath = newPath
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[asciicast] Renamed recording: ${oldName} → ${newName}`)
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[asciicast] Failed to rename recording from ${oldName} to ${newName}`,
    )
  }
}

// AsciicastRecorder 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AsciicastRecorder = {
  flush(): Promise<void>
  dispose(): Promise<void>
}

// recorder保存`null`，作为后续空值处理的输入。
let recorder: AsciicastRecorder | null = null

// getTerminalSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTerminalSize(): { cols: number; rows: number } {
  // Direct access to stdout dimensions — not in a React component
  // eslint-disable-next-line custom-rules/prefer-use-terminal-size
  // cols 集合标记共享工具 asciicast是否启用对应路径。
  const cols = process.stdout.columns || 80
  // eslint-disable-next-line custom-rules/prefer-use-terminal-size
  // rows 集合标记共享工具 asciicast是否启用对应路径。
  const rows = process.stdout.rows || 24
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { cols, rows }
}

/**
 * Flush pending recording data to disk.
 * Call before reading the .cast file (e.g., during /share).
 */
// flushAsciicastRecorder 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function flushAsciicastRecorder(): Promise<void> {
  // 等待 `recorder?.flush()` 完成，再继续共享工具 asciicast的异步流程。
  await recorder?.flush()
}

/**
 * Install the asciicast recorder.
 * Wraps process.stdout.write to capture all terminal output with timestamps.
 * Must be called before Ink mounts.
 */
// installAsciicastRecorder 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function installAsciicastRecorder(): void {
  // 文件路径读取`getRecordFilePath`，供共享工具后续处理使用。
  const filePath = getRecordFilePath()
  // 文件路径缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!filePath) {
    // 共享工具 asciicast在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 从 `getTerminalSize()` 解构 cols、rows，减少共享工具 asciicast对同一对象的重复访问。
  const { cols, rows } = getTerminalSize()
  // startTime记录时间`performance.now`，供共享工具后续处理使用。
  const startTime = performance.now()

  // Write the asciicast v2 header
  // header保存`jsonStringify`，供共享工具后续处理使用。
  const header = jsonStringify({
    version: 2,
    width: cols,
    height: rows,
    timestamp: Math.floor(Date.now() / 1000),
    env: {
      SHELL: process.env.SHELL || '',
      TERM: process.env.TERM || '',
    },
  })

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- one-time init before Ink mounts
    // 调用 getFsImplementation，触发共享工具此处需要的副作用。
    getFsImplementation().mkdirSync(dirname(filePath))
  } catch {
    // Directory may already exist
  }
  // eslint-disable-next-line custom-rules/no-sync-fs -- one-time init before Ink mounts
  // 调用 getFsImplementation，触发共享工具此处需要的副作用。
  getFsImplementation().appendFileSync(filePath, header + '\n', { mode: 0o600 })

  // pendingWrite读取`Promise.resolve()`，供后续判断或组装使用。
  let pendingWrite: Promise<void> = Promise.resolve()

  // writer构建`createBufferedWriter`，供共享工具后续处理使用。
  const writer = createBufferedWriter({
    // writeFn 使用 content: string 完成共享工具里的对应操作。
    writeFn(content: string) {
      // Use recordingState.filePath (mutable) so writes follow renames from --resume
      // currentPath 路径数据保存`recordingState.filePath`，供后续判断或组装使用。
      const currentPath = recordingState.filePath
      // currentPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!currentPath) {
        // 共享工具 asciicast在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // pendingWrite更新为 `pendingWrite`，确保共享工具后续读取最新状态。
      pendingWrite = pendingWrite
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(() => appendFile(currentPath, content))
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(() => {
          // Silently ignore write errors — don't break the session
        })
    },
    flushIntervalMs: 500,
    maxBufferSize: 50,
    maxBufferBytes: 10 * 1024 * 1024, // 10MB
  })

  // Wrap process.stdout.write to capture output
  // originalWrite保存`write.bind`，供共享工具后续处理使用。
  const originalWrite = process.stdout.write.bind(
    process.stdout,
  ) as typeof process.stdout.write
  // write更新为 `function (`，确保共享工具后续读取最新状态。
  process.stdout.write = function (
    chunk: string | Uint8Array,
    // 这个回调绑定到 encodingOrCb?: BufferEncoding | ((err?: Error) => void),，负责共享工具在该局部场景下的响应。
    encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    // 这个回调绑定到 cb?: (err?: Error) => void,，负责共享工具在该局部场景下的响应。
    cb?: (err?: Error) => void,
  ): boolean {
    // Record the output event
    // elapsed记录时间`performance.now`，供共享工具后续处理使用。
    const elapsed = (performance.now() - startTime) / 1000
    // text 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const text =
      typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8')
    // 调用 writer.write，触发共享工具此处需要的副作用。
    writer.write(jsonStringify([elapsed, 'o', text]) + '\n')

    // Pass through to the real stdout
    // 当 `typeof encodingOrCb` 匹配 `'function'` 时，共享工具执行对应分支。
    if (typeof encodingOrCb === 'function') {
      // 返回 `originalWrite(chunk, encodingOrCb)`，作为共享工具这次计算的结果。
      return originalWrite(chunk, encodingOrCb)
    }
    // 返回 `originalWrite(chunk, encodingOrCb, cb)`，作为共享工具这次计算的结果。
    return originalWrite(chunk, encodingOrCb, cb)
  } as typeof process.stdout.write

  // Handle terminal resize events
  // onResize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onResize(): void {
    // elapsed记录时间`performance.now`，供共享工具后续处理使用。
    const elapsed = (performance.now() - startTime) / 1000
    // 从 `getTerminalSize()` 解构 cols、rows，减少共享工具 asciicast对同一对象的重复访问。
    const { cols: newCols, rows: newRows } = getTerminalSize()
    // 调用 writer.write，触发共享工具此处需要的副作用。
    writer.write(jsonStringify([elapsed, 'r', `${newCols}x${newRows}`]) + '\n')
  }
  // 调用 process.stdout.on，触发共享工具此处需要的副作用。
  process.stdout.on('resize', onResize)

  // recorder更新为 `{`，确保共享工具后续读取最新状态。
  recorder = {
    // flush 使用 无 完成共享工具里的对应操作。
    async flush(): Promise<void> {
      // 调用 writer.flush，触发共享工具此处需要的副作用。
      writer.flush()
      // 等待 `pendingWrite` 完成，再继续共享工具 asciicast的异步流程。
      await pendingWrite
    },
    // dispose 使用 无 完成共享工具里的对应操作。
    async dispose(): Promise<void> {
      // 调用 writer.dispose，触发共享工具此处需要的副作用。
      writer.dispose()
      // 等待 `pendingWrite` 完成，再继续共享工具 asciicast的异步流程。
      await pendingWrite
      // 调用 process.stdout.removeListener，触发共享工具此处需要的副作用。
      process.stdout.removeListener('resize', onResize)
      // write更新为 `originalWrite`，确保共享工具后续读取最新状态。
      process.stdout.write = originalWrite
    },
  }

  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(async () => {
    // 等待 `recorder?.dispose()` 完成，再继续共享工具 asciicast的异步流程。
    await recorder?.dispose()
    // recorder更新为 `null`，确保共享工具后续读取最新状态。
    recorder = null
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[asciicast] Recording to ${filePath}`)
}
