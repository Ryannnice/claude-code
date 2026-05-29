// Constants for timeout values
// DEFAULT_TIMEOUT_MS 集合保存`120_000 // 2 minutes`，供后续判断或组装使用。
const DEFAULT_TIMEOUT_MS = 120_000 // 2 minutes
// MAX_TIMEOUT_MS 集合保存`600_000 // 10 minutes`，供共享工具 timeouts后续判断或输出使用。
const MAX_TIMEOUT_MS = 600_000 // 10 minutes

// EnvLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

/**
 * Get the default timeout for bash operations in milliseconds
 * Checks BASH_DEFAULT_TIMEOUT_MS environment variable or returns 2 minutes default
 * @param env Environment variables to check (defaults to process.env for production use)
 */
// getDefaultBashTimeoutMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultBashTimeoutMs(env: EnvLike = process.env): number {
  // envValue保存`env.BASH_DEFAULT_TIMEOUT_MS`，供共享工具 timeouts后续判断或输出使用。
  const envValue = env.BASH_DEFAULT_TIMEOUT_MS
  // 满足 `envValue` 时，共享工具执行该分支。
  if (envValue) {
    // 解析结果解析`parseInt`，供共享工具后续处理使用。
    const parsed = parseInt(envValue, 10)
    // 只有 `!isNaN(parsed) && parsed > 0` 满足时，共享工具才执行该分支。
    if (!isNaN(parsed) && parsed > 0) {
      // 返回 `parsed`，作为共享工具这次计算的结果。
      return parsed
    }
  }
  // 返回 `DEFAULT_TIMEOUT_MS`，作为共享工具这次计算的结果。
  return DEFAULT_TIMEOUT_MS
}

/**
 * Get the maximum timeout for bash operations in milliseconds
 * Checks BASH_MAX_TIMEOUT_MS environment variable or returns 10 minutes default
 * @param env Environment variables to check (defaults to process.env for production use)
 */
// getMaxBashTimeoutMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxBashTimeoutMs(env: EnvLike = process.env): number {
  // envValue保存`env.BASH_MAX_TIMEOUT_MS`，供共享工具 timeouts后续判断或输出使用。
  const envValue = env.BASH_MAX_TIMEOUT_MS
  // 满足 `envValue` 时，共享工具执行该分支。
  if (envValue) {
    // 解析结果解析`parseInt`，供共享工具后续处理使用。
    const parsed = parseInt(envValue, 10)
    // 只有 `!isNaN(parsed) && parsed > 0` 满足时，共享工具才执行该分支。
    if (!isNaN(parsed) && parsed > 0) {
      // Ensure max is at least as large as default
      // 返回 `Math.max(parsed, getDefaultBashTimeoutMs(env))`，作为共享工具这次计算的结果。
      return Math.max(parsed, getDefaultBashTimeoutMs(env))
    }
  }
  // Always ensure max is at least as large as default
  // 返回 `Math.max(MAX_TIMEOUT_MS, getDefaultBashTimeoutMs(env))`，作为共享工具这次计算的结果。
  return Math.max(MAX_TIMEOUT_MS, getDefaultBashTimeoutMs(env))
}
