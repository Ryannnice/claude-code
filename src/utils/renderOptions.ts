// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { openSync } from 'fs'
// 引入 ReadStream，将 tty 中已经封装好的能力接到本文件流程里。
import { ReadStream } from 'tty'
// 类型依赖 { RenderOptions } 来自 ../ink.js，用于校准共享工具的数据契约。
import type { RenderOptions } from '../ink.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// Cached stdin override - computed once per process
// cachedStdinOverride 缓存保存`null`，作为后续空值处理的输入。
let cachedStdinOverride: ReadStream | undefined | null = null

/**
 * Gets a ReadStream for /dev/tty when stdin is piped.
 * This allows interactive Ink rendering even when stdin is a pipe.
 * Result is cached for the lifetime of the process.
 */
// getStdinOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStdinOverride(): ReadStream | undefined {
  // Return cached result if already computed
  // `cachedStdinOverride` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (cachedStdinOverride !== null) {
    // 返回 `cachedStdinOverride`，作为共享工具这次计算的结果。
    return cachedStdinOverride
  }

  // No override needed if stdin is already a TTY
  // 满足 `process.stdin.isTTY` 时，共享工具执行该分支。
  if (process.stdin.isTTY) {
    // cachedStdinOverride 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
    cachedStdinOverride = undefined
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Skip in CI environments
  // 满足 `isEnvTruthy(process.env.CI)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CI)) {
    // cachedStdinOverride 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
    cachedStdinOverride = undefined
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Skip if running MCP (input hijacking breaks MCP)
  // 满足 `process.argv.includes('mcp')` 时，共享工具执行该分支。
  if (process.argv.includes('mcp')) {
    // cachedStdinOverride 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
    cachedStdinOverride = undefined
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // No /dev/tty on Windows
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // cachedStdinOverride 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
    cachedStdinOverride = undefined
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Try to open /dev/tty as an alternative input source
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // ttyFd保存`openSync`，供共享工具后续处理使用。
    const ttyFd = openSync('/dev/tty', 'r')
    // ttyStream保存`ReadStream`，供共享工具后续处理使用。
    const ttyStream = new ReadStream(ttyFd)
    // Explicitly set isTTY to true since we know /dev/tty is a TTY.
    // This is needed because some runtimes (like Bun's compiled binaries)
    // may not correctly detect isTTY on ReadStream created from a file descriptor.
    // isTTY更新为 `true`，确保共享工具后续读取最新状态。
    ttyStream.isTTY = true
    // cachedStdinOverride 缓存更新为 `ttyStream`，确保共享工具后续读取最新状态。
    cachedStdinOverride = ttyStream
    // 返回 `cachedStdinOverride`，作为共享工具这次计算的结果。
    return cachedStdinOverride
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err as Error)
    // cachedStdinOverride 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
    cachedStdinOverride = undefined
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Returns base render options for Ink, including stdin override when needed.
 * Use this for all render() calls to ensure piped input works correctly.
 *
 * @param exitOnCtrlC - Whether to exit on Ctrl+C (usually false for dialogs)
 */
// getBaseRenderOptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBaseRenderOptions(
  exitOnCtrlC: boolean = false,
): RenderOptions {
  // stdin读取`getStdinOverride`，供共享工具后续处理使用。
  const stdin = getStdinOverride()
  // 选项 集中保存共享工具 render Options要一起传递的字段。
  const options: RenderOptions = { exitOnCtrlC }
  // 满足 `stdin` 时，共享工具执行该分支。
  if (stdin) {
    // stdin更新为 `stdin`，确保共享工具后续读取最新状态。
    options.stdin = stdin
  }
  // 返回 `options`，作为共享工具这次计算的结果。
  return options
}
