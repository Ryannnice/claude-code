// 类型依赖 { BetaTool } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaTool } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'

// Session-scoped cache of rendered tool schemas. Tool schemas render at server
// position 2 (before system prompt), so any byte-level change busts the entire
// ~11K-token tool block AND everything downstream. GrowthBook gate flips
// (tengu_tool_pear, tengu_fgts), MCP reconnects, or dynamic content in
// tool.prompt() all cause this churn. Memoizing per-session locks the schema
// bytes at first render — mid-session GB refreshes no longer bust the cache.
//
// Lives in a leaf module so auth.ts can clear it without importing api.ts
// (which would create a cycle via plans→settings→file→growthbook→config→
// bridgeEnabled→auth).
// CachedSchema 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedSchema = BetaTool & {
  strict?: boolean
  eager_input_streaming?: boolean
}

// TOOL_SCHEMA_CACHE 缓存构建`new Map<string, CachedSchema>()` 整理出中间结果，供共享工具 tool Schema Cache后续步骤使用。
const TOOL_SCHEMA_CACHE = new Map<string, CachedSchema>()

// getToolSchemaCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolSchemaCache(): Map<string, CachedSchema> {
  // 返回 `TOOL_SCHEMA_CACHE`，作为共享工具这次计算的结果。
  return TOOL_SCHEMA_CACHE
}

// clearToolSchemaCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearToolSchemaCache(): void {
  // 调用 TOOL_SCHEMA_CACHE.clear，触发共享工具此处需要的副作用。
  TOOL_SCHEMA_CACHE.clear()
}
