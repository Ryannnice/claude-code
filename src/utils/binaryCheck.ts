// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 which，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { which } from './which.js'

// Session cache to avoid repeated checks
// binaryCache 缓存构建`new Map<string, boolean>()` 整理出中间结果，供共享工具 binary Check后续步骤使用。
const binaryCache = new Map<string, boolean>()

/**
 * Check if a binary/command is installed and available on the system.
 * Uses 'which' on Unix systems (macOS, Linux, WSL) and 'where' on Windows.
 *
 * @param command - The command name to check (e.g., 'gopls', 'rust-analyzer')
 * @returns Promise<boolean> - true if the command exists, false otherwise
 */
// isBinaryInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isBinaryInstalled(command: string): Promise<boolean> {
  // Edge case: empty or whitespace-only command
  // 只有 `!command || !command.trim()` 满足时，共享工具才执行该分支。
  if (!command || !command.trim()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[binaryCheck] Empty command provided, returning false')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Trim the command to handle whitespace
  // trimmedCommand 命令数据格式化`command.trim`，供共享工具后续处理使用。
  const trimmedCommand = command.trim()

  // Check cache first
  // cached 缓存读取`binaryCache.get`，供共享工具后续处理使用。
  const cached = binaryCache.get(trimmedCommand)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[binaryCheck] Cache hit for '${trimmedCommand}': ${cached}`,
    )
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // exists 集合标记共享工具 binary Check是否启用对应路径。
  let exists = false
  // 满足 `await which(trimmedCommand).catch(() => null)` 时，共享工具执行该分支。
  if (await which(trimmedCommand).catch(() => null)) {
    // exists 集合更新为 `true`，确保共享工具后续读取最新状态。
    exists = true
  }

  // Cache the result
  // binaryCache.set 写入新的状态值，使共享工具后续读取保持一致。
  binaryCache.set(trimmedCommand, exists)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[binaryCheck] Binary '${trimmedCommand}' ${exists ? 'found' : 'not found'}`,
  )

  // 返回 `exists`，作为共享工具这次计算的结果。
  return exists
}

/**
 * Clear the binary check cache (useful for testing)
 */
// clearBinaryCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBinaryCache(): void {
  // 调用 binaryCache.clear，触发共享工具此处需要的副作用。
  binaryCache.clear()
}
