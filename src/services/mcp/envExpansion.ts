/**
 * Shared utilities for expanding environment variables in MCP server configurations
 */

/**
 * Expand environment variables in a string value
 * Handles ${VAR} and ${VAR:-default} syntax
 * @returns Object with expanded string and list of missing variables
 */
// expandEnvVarsInString 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandEnvVarsInString(value: string): {
  expanded: string
  missingVars: string[]
} {
  // missingVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const missingVars: string[] = []

  // expanded格式化`value.replace`，供MCP 服务后续处理使用。
  const expanded = value.replace(/\$\{([^}]+)\}/g, (match, varContent) => {
    // Split on :- to support default values (limit to 2 parts to preserve :- in defaults)
    // 从 `varContent.split(':-', 2)` 按位置拆出 varName、defaultValue，让MCP 服务 env Expansion分别处理这些返回值。
    const [varName, defaultValue] = varContent.split(':-', 2)
    // envValue读取 `process.env[varName]` 对应条目，后续围绕该成员继续处理。
    const envValue = process.env[varName]

    // `envValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (envValue !== undefined) {
      // 返回 `envValue`，作为MCP 服务这次计算的结果。
      return envValue
    }
    // `defaultValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (defaultValue !== undefined) {
      // 返回 `defaultValue`，作为MCP 服务这次计算的结果。
      return defaultValue
    }

    // Track missing variable for error reporting
    // missingVars 集合追加新条目，保持收集顺序与输入顺序一致。
    missingVars.push(varName)
    // Return original if not found (allows debugging but will be reported as error)
    // 返回 `match`，作为MCP 服务这次计算的结果。
    return match
  })

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    expanded,
    missingVars,
  }
}
