/**
 * Combines settings validation errors with MCP configuration errors.
 *
 * This module exists to break a circular dependency:
 *   settings.ts → mcp/config.ts → settings.ts
 *
 * By moving the MCP error aggregation here (a leaf that imports both
 * settings.ts and mcp/config.ts, but is imported by neither), the cycle
 * is eliminated.
 */

// 接入 getMcpConfigsByScope 服务层能力，把外部通信或共享状态交给 ../../services/mcp/config.js 处理。
import { getMcpConfigsByScope } from '../../services/mcp/config.js'
// 引入 getSettingsWithErrors，将 ./settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsWithErrors } from './settings.js'
// 类型依赖 { SettingsWithErrors } 来自 ./validation.js，用于校准共享工具的数据契约。
import type { SettingsWithErrors } from './validation.js'

/**
 * Get merged settings with all validation errors, including MCP config errors.
 *
 * Use this instead of getSettingsWithErrors() when you need the full set of
 * errors (settings + MCP). The underlying getSettingsWithErrors() no longer
 * includes MCP errors to avoid the circular dependency.
 */
// getSettingsWithAllErrors 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsWithAllErrors(): SettingsWithErrors {
  // 结果读取`getSettingsWithErrors`，供共享工具后续处理使用。
  const result = getSettingsWithErrors()
  // 'dynamic' scope does not have errors returned; it throws and is set on cli startup
  // scopes 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const scopes = ['user', 'project', 'local'] as const
  // mcpErrors 错误信息派生`scopes.flatMap`，供共享工具后续处理使用。
  const mcpErrors = scopes.flatMap(scope => getMcpConfigsByScope(scope).errors)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    settings: result.settings,
    errors: [...result.errors, ...mcpErrors],
  }
}
