// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 引入 execSync_DEPRECATED，将 ./execSyncWrapper.js 中已经封装好的能力接到本文件流程里。
import { execSync_DEPRECATED } from './execSyncWrapper.js'

// whichNodeAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function whichNodeAsync(command: string): Promise<string | null> {
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // On Windows, use where.exe and return the first result
    // 结果保存`execa`，供共享工具后续处理使用。
    const result = await execa(`where.exe ${command}`, {
      shell: true,
      stderr: 'ignore',
      reject: false,
    })
    // `result.exitCode` 与 `0 || !result.stdout` 不一致时刷新派生状态，避免使用过期结果。
    if (result.exitCode !== 0 || !result.stdout) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // where.exe returns multiple paths separated by newlines, return the first
    // 返回 `result.stdout.trim().split(/\r?\n/)[0] || null`，作为共享工具这次计算的结果。
    return result.stdout.trim().split(/\r?\n/)[0] || null
  }

  // On POSIX systems (macOS, Linux, WSL), use which
  // Cross-platform safe: Windows is handled above
  // eslint-disable-next-line custom-rules/no-cross-platform-process-issues
  // 结果保存`execa`，供共享工具后续处理使用。
  const result = await execa(`which ${command}`, {
    shell: true,
    stderr: 'ignore',
    reject: false,
  })
  // `result.exitCode` 与 `0 || !result.stdout` 不一致时刷新派生状态，避免使用过期结果。
  if (result.exitCode !== 0 || !result.stdout) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `result.stdout.trim()`，作为共享工具这次计算的结果。
  return result.stdout.trim()
}

// whichNodeSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function whichNodeSync(command: string): string | null {
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`execSync_DEPRECATED`，供共享工具后续处理使用。
      const result = execSync_DEPRECATED(`where.exe ${command}`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      // output格式化`result.toString`，供共享工具后续处理使用。
      const output = result.toString().trim()
      // 返回 `output.split(/\r?\n/)[0] || null`，作为共享工具这次计算的结果。
      return output.split(/\r?\n/)[0] || null
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execSync_DEPRECATED`，供共享工具后续处理使用。
    const result = execSync_DEPRECATED(`which ${command}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    // 返回 `result.toString().trim() || null`，作为共享工具这次计算的结果。
    return result.toString().trim() || null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// bunWhich 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const bunWhich =
  typeof Bun !== 'undefined' && typeof Bun.which === 'function'
    ? Bun.which
    : null

/**
 * Finds the full path to a command executable.
 * Uses Bun.which when running in Bun (fast, no process spawn),
 * otherwise spawns the platform-appropriate command.
 *
 * @param command - The command name to look up
 * @returns The full path to the command, or null if not found
 */
// 这个回调绑定到 export const which: (command: string) => Promise<string | null> = bunWhich，负责共享工具在该局部场景下的响应。
export const which: (command: string) => Promise<string | null> = bunWhich
  // 这个回调绑定到 ? async command => bunWhich(command)，负责共享工具在该局部场景下的响应。
  ? async command => bunWhich(command)
  : whichNodeAsync

/**
 * Synchronous version of `which`.
 *
 * @param command - The command name to look up
 * @returns The full path to the command, or null if not found
 */
// 这个回调绑定到 export const whichSync: (command: string) => string | null =，负责共享工具在该局部场景下的响应。
export const whichSync: (command: string) => string | null =
  bunWhich ?? whichNodeSync
