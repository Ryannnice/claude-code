/**
 * Tool Search utilities for dynamically discovering deferred tools.
 *
 * When enabled, deferred tools (MCP and shouldDefer tools) are sent with
 * defer_loading: true and discovered via ToolSearchTool rather than being
 * loaded upfront.
 */

// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { Tool } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tool } from '../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ToolPermissionContext,
  type Tools,
  toolMatchesName,
} from '../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  formatDeferredToolLine,
  isDeferredTool,
  TOOL_SEARCH_TOOL_NAME,
} from '../tools/ToolSearchTool/prompt.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  countToolDefinitionTokens,
  TOOL_TOKEN_COUNT_OVERHEAD,
} from './analyzeContext.js'
// 引入 count，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { count } from './array.js'
// 引入 getMergedBetas，将 ./betas.js 中已经封装好的能力接到本文件流程里。
import { getMergedBetas } from './betas.js'
// 引入 getContextWindowForModel，将 ./context.js 中已经封装好的能力接到本文件流程里。
import { getContextWindowForModel } from './context.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from './model/providers.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'
// 引入 zodToJsonSchema，将 ./zodToJsonSchema.js 中已经封装好的能力接到本文件流程里。
import { zodToJsonSchema } from './zodToJsonSchema.js'

/**
 * Default percentage of context window at which to auto-enable tool search.
 * When MCP tool descriptions exceed this percentage (in tokens), tool search is enabled.
 * Can be overridden via ENABLE_TOOL_SEARCH=auto:N where N is 0-100.
 */
// DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE保存`10 // 10%`，供共享工具 tool Search后续判断或输出使用。
const DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE = 10 // 10%

/**
 * Parse auto:N syntax from ENABLE_TOOL_SEARCH env var.
 * Returns the percentage clamped to 0-100, or null if not auto:N format or not a number.
 */
// parseAutoPercentage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseAutoPercentage(value: string): number | null {
  // 满足 `!value.startsWith('auto:')` 时，共享工具执行该分支。
  if (!value.startsWith('auto:')) return null

  // percentStr格式化`value.slice`，供共享工具后续处理使用。
  const percentStr = value.slice(5)
  // percent解析`parseInt`，供共享工具后续处理使用。
  const percent = parseInt(percentStr, 10)

  // 满足 `isNaN(percent)` 时，共享工具执行该分支。
  if (isNaN(percent)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Invalid ENABLE_TOOL_SEARCH value "${value}": expected auto:N where N is a number.`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Clamp to valid range
  // 返回 `Math.max(0, Math.min(100, percent))`，作为共享工具这次计算的结果。
  return Math.max(0, Math.min(100, percent))
}

/**
 * Check if ENABLE_TOOL_SEARCH is set to auto mode (auto or auto:N).
 */
// isAutoToolSearchMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAutoToolSearchMode(value: string | undefined): boolean {
  // 取值缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!value) return false
  // 返回 `value === 'auto' || value.startsWith('auto:')`，作为共享工具这次计算的结果。
  return value === 'auto' || value.startsWith('auto:')
}

/**
 * Get the auto-enable percentage from env var or default.
 */
// getAutoToolSearchPercentage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoToolSearchPercentage(): number {
  // 取值 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const value = process.env.ENABLE_TOOL_SEARCH
  // 取值缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!value) return DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE

  // 当 `value` 匹配 `'auto'` 时，共享工具执行对应分支。
  if (value === 'auto') return DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE

  // 解析结果解析`parseAutoPercentage`，供共享工具后续处理使用。
  const parsed = parseAutoPercentage(value)
  // `parsed` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (parsed !== null) return parsed

  // 返回 `DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE`，作为共享工具这次计算的结果。
  return DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE
}

/**
 * Approximate chars per token for MCP tool definitions (name + description + input schema).
 * Used as fallback when the token counting API is unavailable.
 */
// CHARS_PER_TOKEN 命名 `2.5`，让后续代码直接表达这个值的用途。
const CHARS_PER_TOKEN = 2.5

/**
 * Get the token threshold for auto-enabling tool search for a given model.
 */
// getAutoToolSearchTokenThreshold 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoToolSearchTokenThreshold(model: string): number {
  // betas 集合读取`getMergedBetas`，供共享工具后续处理使用。
  const betas = getMergedBetas(model)
  // contextWindow读取`getContextWindowForModel`，供共享工具后续处理使用。
  const contextWindow = getContextWindowForModel(model, betas)
  // percentage读取`getAutoToolSearchPercentage`，供共享工具后续处理使用。
  const percentage = getAutoToolSearchPercentage() / 100
  // 返回 `Math.floor(contextWindow * percentage)`，作为共享工具这次计算的结果。
  return Math.floor(contextWindow * percentage)
}

/**
 * Get the character threshold for auto-enabling tool search for a given model.
 * Used as fallback when the token counting API is unavailable.
 */
// getAutoToolSearchCharThreshold 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoToolSearchCharThreshold(model: string): number {
  // 返回 `Math.floor(getAutoToolSearchTokenThreshold(model) * CHARS_PER_TOKEN)`，作为共享工具这次计算的结果。
  return Math.floor(getAutoToolSearchTokenThreshold(model) * CHARS_PER_TOKEN)
}

/**
 * Get the total token count for all deferred tools using the token counting API.
 * Memoized by deferred tool names — cache is invalidated when MCP servers connect/disconnect.
 * Returns null if the API is unavailable (caller should fall back to char heuristic).
 */
// getDeferredToolTokenCount 数量保存`memoize`，供共享工具后续处理使用。
const getDeferredToolTokenCount = memoize(
  async (
    tools: Tools,
    // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
    getToolPermissionContext: () => Promise<ToolPermissionContext>,
    agents: AgentDefinition[],
    model: string,
  ): Promise<number | null> => {
    // deferredTools 集合筛选`tools.filter`，供共享工具后续处理使用。
    const deferredTools = tools.filter(t => isDeferredTool(t))
    // deferredTools 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (deferredTools.length === 0) return 0

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // total统计`countToolDefinitionTokens`，供共享工具后续处理使用。
      const total = await countToolDefinitionTokens(
        deferredTools,
        getToolPermissionContext,
        { activeAgents: agents, allAgents: agents },
        model,
      )
      // 满足 `total === 0` 时，共享工具执行该分支。
      if (total === 0) return null // API unavailable
      // 返回 `Math.max(0, total - TOOL_TOKEN_COUNT_OVERHEAD)`，作为共享工具这次计算的结果。
      return Math.max(0, total - TOOL_TOKEN_COUNT_OVERHEAD)
    } catch {
      // 返回 `null // Fall back to char heuristic`，作为共享工具这次计算的结果。
      return null // Fall back to char heuristic
    }
  },
  // 这个回调绑定到 (tools: Tools) =>，负责共享工具在该局部场景下的响应。
  (tools: Tools) =>
    tools
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(t => isDeferredTool(t))
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(t => t.name)
      .join(','),
)

/**
 * Tool search mode. Determines how deferrable tools (MCP + shouldDefer) are
 * surfaced:
 *   - 'tst': Tool Search Tool — deferred tools discovered via ToolSearchTool (always enabled)
 *   - 'tst-auto': auto — tools deferred only when they exceed threshold
 *   - 'standard': tool search disabled — all tools exposed inline
 */
// ToolSearchMode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolSearchMode = 'tst' | 'tst-auto' | 'standard'

/**
 * Determines the tool search mode from ENABLE_TOOL_SEARCH.
 *
 *   ENABLE_TOOL_SEARCH    Mode
 *   auto / auto:1-99      tst-auto
 *   true / auto:0         tst
 *   false / auto:100      standard
 *   (unset)               tst (default: always defer MCP and shouldDefer tools)
 */
// getToolSearchMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolSearchMode(): ToolSearchMode {
  // CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS is a kill switch for beta API
  // features. Tool search emits defer_loading on tool definitions and
  // tool_reference content blocks — both require the API to accept a beta
  // header. When the kill switch is set, force 'standard' so no beta shapes
  // reach the wire, even if ENABLE_TOOL_SEARCH is also set. This is the
  // explicit escape hatch for proxy gateways that the heuristic in
  // isToolSearchEnabledOptimistic doesn't cover.
  // github.com/anthropics/claude-code/issues/20031
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)) {
    // 返回 `'standard'`，作为共享工具这次计算的结果。
    return 'standard'
  }

  // 取值 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const value = process.env.ENABLE_TOOL_SEARCH

  // Handle auto:N syntax - check edge cases first
  // autoPercent解析`parseAutoPercentage`，供共享工具后续处理使用。
  const autoPercent = value ? parseAutoPercentage(value) : null
  // 满足 `autoPercent === 0` 时，共享工具执行该分支。
  if (autoPercent === 0) return 'tst' // auto:0 = always enabled
  // 满足 `autoPercent === 100` 时，共享工具执行该分支。
  if (autoPercent === 100) return 'standard'
  // 满足 `isAutoToolSearchMode(value)` 时，共享工具执行该分支。
  if (isAutoToolSearchMode(value)) {
    // 返回 `'tst-auto' // auto or auto:1-99`，作为共享工具这次计算的结果。
    return 'tst-auto' // auto or auto:1-99
  }

  // 满足 `isEnvTruthy(value)` 时，共享工具执行该分支。
  if (isEnvTruthy(value)) return 'tst'
  // 满足 `isEnvDefinedFalsy(process.env.ENABLE_TOOL_SEARCH)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(process.env.ENABLE_TOOL_SEARCH)) return 'standard'
  // 返回 `'tst' // default: always defer MCP and shouldDefer tools`，作为共享工具这次计算的结果。
  return 'tst' // default: always defer MCP and shouldDefer tools
}

/**
 * Default patterns for models that do NOT support tool_reference.
 * New models are assumed to support tool_reference unless explicitly listed here.
 */
// DEFAULT_UNSUPPORTED_MODEL_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const DEFAULT_UNSUPPORTED_MODEL_PATTERNS = ['haiku']

/**
 * Get the list of model patterns that do NOT support tool_reference.
 * Can be configured via GrowthBook for live updates without code changes.
 */
// getUnsupportedToolReferencePatterns 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUnsupportedToolReferencePatterns(): string[] {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Try to get from GrowthBook for live configuration
    // patterns 集合 命名 `getFeatureValue_CACHED_MAY_BE_STALE<string[] | null>(`，让后续代码直接表达这个值的用途。
    const patterns = getFeatureValue_CACHED_MAY_BE_STALE<string[] | null>(
      'tengu_tool_search_unsupported_models',
      null,
    )
    // 只有 `patterns && Array.isArray(patterns) && patterns.length > 0` 满足时，共享工具才执行该分支。
    if (patterns && Array.isArray(patterns) && patterns.length > 0) {
      // 返回 `patterns`，作为共享工具这次计算的结果。
      return patterns
    }
  } catch {
    // GrowthBook not ready, use defaults
  }
  // 返回 `DEFAULT_UNSUPPORTED_MODEL_PATTERNS`，作为共享工具这次计算的结果。
  return DEFAULT_UNSUPPORTED_MODEL_PATTERNS
}

/**
 * Check if a model supports tool_reference blocks (required for tool search).
 *
 * This uses a negative test: models are assumed to support tool_reference
 * UNLESS they match a pattern in the unsupported list. This ensures new
 * models work by default without code changes.
 *
 * Currently, Haiku models do NOT support tool_reference. This can be
 * updated via GrowthBook feature 'tengu_tool_search_unsupported_models'.
 *
 * @param model The model name to check
 * @returns true if the model supports tool_reference, false otherwise
 */
// modelSupportsToolReference 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsToolReference(model: string): boolean {
  // normalizedModel保存`model.toLowerCase`，供共享工具后续处理使用。
  const normalizedModel = model.toLowerCase()
  // unsupportedPatterns 集合读取`getUnsupportedToolReferencePatterns`，供共享工具后续处理使用。
  const unsupportedPatterns = getUnsupportedToolReferencePatterns()

  // Check if model matches any unsupported pattern
  // 按顺序遍历 `unsupportedPatterns` 中的pattern，逐个交给共享工具处理。
  for (const pattern of unsupportedPatterns) {
    // 满足 `normalizedModel.includes(pattern.toLowerCase())` 时，共享工具执行该分支。
    if (normalizedModel.includes(pattern.toLowerCase())) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // New models are assumed to support tool_reference
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Check if tool search *might* be enabled (optimistic check).
 *
 * Returns true if tool search could potentially be enabled, without checking
 * dynamic factors like model support or threshold. Use this for:
 * - Including ToolSearchTool in base tools (so it's available if needed)
 * - Preserving tool_reference fields in messages (can be stripped later)
 * - Checking if ToolSearchTool should report itself as enabled
 *
 * Returns false only when tool search is definitively disabled (standard mode).
 *
 * For the definitive check that includes model support and threshold,
 * use isToolSearchEnabled().
 */
// loggedOptimistic标记共享工具 tool Search是否启用对应路径。
let loggedOptimistic = false

// isToolSearchEnabledOptimistic 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolSearchEnabledOptimistic(): boolean {
  // mode读取`getToolSearchMode`，供共享工具后续处理使用。
  const mode = getToolSearchMode()
  // 当 `mode` 匹配 `'standard'` 时，共享工具执行对应分支。
  if (mode === 'standard') {
    // loggedOptimistic缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!loggedOptimistic) {
      // loggedOptimistic更新为 `true`，确保共享工具后续读取最新状态。
      loggedOptimistic = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ToolSearch:optimistic] mode=${mode}, ENABLE_TOOL_SEARCH=${process.env.ENABLE_TOOL_SEARCH}, result=false`,
      )
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // tool_reference is a beta content type that third-party API gateways
  // (ANTHROPIC_BASE_URL proxies) typically don't support. When the provider
  // is 'firstParty' but the base URL points elsewhere, the proxy will reject
  // tool_reference blocks with a 400. Vertex/Bedrock/Foundry are unaffected —
  // they have their own endpoints and beta headers.
  // https://github.com/anthropics/claude-code/issues/30912
  //
  // HOWEVER: some proxies DO support tool_reference (LiteLLM passthrough,
  // Cloudflare AI Gateway, corp gateways that forward beta headers). The
  // blanket disable breaks defer_loading for those users — all MCP tools
  // loaded into main context instead of on-demand (gh-31936 / CC-457,
  // likely the real cause of CC-330 "v2.1.70 defer_loading regression").
  // This gate only applies when ENABLE_TOOL_SEARCH is unset/empty (default
  // behavior). Setting any non-empty value — 'true', 'auto', 'auto:N' —
  // means the user is explicitly configuring tool search and asserts their
  // setup supports it. The falsy check (rather than === undefined) aligns
  // with getToolSearchMode(), which also treats "" as unset.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !process.env.ENABLE_TOOL_SEARCH &&
    getAPIProvider() === 'firstParty' &&
    !isFirstPartyAnthropicBaseUrl()
  ) {
    // loggedOptimistic缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!loggedOptimistic) {
      // loggedOptimistic更新为 `true`，确保共享工具后续读取最新状态。
      loggedOptimistic = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ToolSearch:optimistic] disabled: ANTHROPIC_BASE_URL=${process.env.ANTHROPIC_BASE_URL} is not a first-party Anthropic host. Set ENABLE_TOOL_SEARCH=true (or auto / auto:N) if your proxy forwards tool_reference blocks.`,
      )
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // loggedOptimistic缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!loggedOptimistic) {
    // loggedOptimistic更新为 `true`，确保共享工具后续读取最新状态。
    loggedOptimistic = true
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ToolSearch:optimistic] mode=${mode}, ENABLE_TOOL_SEARCH=${process.env.ENABLE_TOOL_SEARCH}, result=true`,
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Check if ToolSearchTool is available in the provided tools list.
 * If ToolSearchTool is not available (e.g., disallowed via disallowedTools),
 * tool search cannot function and should be disabled.
 *
 * @param tools Array of tools with a 'name' property
 * @returns true if ToolSearchTool is in the tools list, false otherwise
 */
// isToolSearchToolAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolSearchToolAvailable(
  tools: readonly { name: string }[],
): boolean {
  // 返回 `tools.some(tool => toolMatchesName(tool, TOOL_SEARCH_TOOL_NAME))`，作为共享工具这次计算的结果。
  return tools.some(tool => toolMatchesName(tool, TOOL_SEARCH_TOOL_NAME))
}

/**
 * Calculate total deferred tool description size in characters.
 * Includes name, description text, and input schema to match what's actually sent to the API.
 */
// calculateDeferredToolDescriptionChars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function calculateDeferredToolDescriptionChars(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agents: AgentDefinition[],
): Promise<number> {
  // deferredTools 集合筛选`tools.filter`，供共享工具后续处理使用。
  const deferredTools = tools.filter(t => isDeferredTool(t))
  // deferredTools 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (deferredTools.length === 0) return 0

  // sizes 集合保存`Promise.all`，供共享工具后续处理使用。
  const sizes = await Promise.all(
    // 调用 deferredTools.map，触发共享工具此处需要的副作用。
    deferredTools.map(async tool => {
      // description保存`tool.prompt`，供共享工具后续处理使用。
      const description = await tool.prompt({
        getToolPermissionContext,
        tools,
        agents,
      })
      // inputSchema保存`tool.inputJSONSchema`，供后续判断或组装使用。
      const inputSchema = tool.inputJSONSchema
        ? jsonStringify(tool.inputJSONSchema)
        : tool.inputSchema
          ? jsonStringify(zodToJsonSchema(tool.inputSchema))
          : ''
      // 返回 `tool.name.length + description.length + inputSchema.length`，作为共享工具这次计算的结果。
      return tool.name.length + description.length + inputSchema.length
    }),
  )

  // 返回 `sizes.reduce((total, size) => total + size, 0)`，作为共享工具这次计算的结果。
  return sizes.reduce((total, size) => total + size, 0)
}

/**
 * Check if tool search (MCP tool deferral with tool_reference) is enabled for a specific request.
 *
 * This is the definitive check that includes:
 * - MCP mode (Tst, TstAuto, McpCli, Standard)
 * - Model compatibility (haiku doesn't support tool_reference)
 * - ToolSearchTool availability (must be in tools list)
 * - Threshold check for TstAuto mode
 *
 * Use this when making actual API calls where all context is available.
 *
 * @param model The model to check for tool_reference support
 * @param tools Array of available tools (including MCP tools)
 * @param getToolPermissionContext Function to get tool permission context
 * @param agents Array of agent definitions
 * @param source Optional identifier for the caller (for debugging)
 * @returns true if tool search should be enabled for this request
 */
// isToolSearchEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isToolSearchEnabled(
  model: string,
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agents: AgentDefinition[],
  source?: string,
): Promise<boolean> {
  // mcpToolCount 数量统计`count`，供共享工具后续处理使用。
  const mcpToolCount = count(tools, t => t.isMcp)

  // Helper to log the mode decision event
  // logModeDecision 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function logModeDecision(
    enabled: boolean,
    mode: ToolSearchMode,
    reason: string,
    extraProps?: Record<string, number>,
  ): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_search_mode_decision', {
      enabled,
      mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      reason:
        reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      // Log the actual model being checked, not the session's main model.
      // This is important for debugging subagent tool search decisions where
      // the subagent model (e.g., haiku) differs from the session model (e.g., opus).
      checkedModel:
        model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      mcpToolCount,
      userType: (process.env.USER_TYPE ??
        'external') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...extraProps,
    })
  }

  // Check if model supports tool_reference
  // 满足 `!modelSupportsToolReference(model)` 时，共享工具执行该分支。
  if (!modelSupportsToolReference(model)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Tool search disabled for model '${model}': model does not support tool_reference blocks. ` +
        `This feature is only available on Claude Sonnet 4+, Opus 4+, and newer models.`,
    )
    // 调用 logModeDecision，触发共享工具此处需要的副作用。
    logModeDecision(false, 'standard', 'model_unsupported')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if ToolSearchTool is available (respects disallowedTools)
  // 满足 `!isToolSearchToolAvailable(tools)` 时，共享工具执行该分支。
  if (!isToolSearchToolAvailable(tools)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Tool search disabled: ToolSearchTool is not available (may have been disallowed via disallowedTools).`,
    )
    // 调用 logModeDecision，触发共享工具此处需要的副作用。
    logModeDecision(false, 'standard', 'mcp_search_unavailable')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // mode读取`getToolSearchMode`，供共享工具后续处理使用。
  const mode = getToolSearchMode()

  // 按照 mode 的取值选择共享工具的具体处理分支。
  switch (mode) {
    case 'tst':
      // 调用 logModeDecision，触发共享工具此处需要的副作用。
      logModeDecision(true, mode, 'tst_enabled')
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true

    case 'tst-auto': {
      // 从 `await checkAutoThreshold(` 解构 enabled、debugDescription、metrics，减少共享工具 tool Search对同一对象的重复访问。
      const { enabled, debugDescription, metrics } = await checkAutoThreshold(
        tools,
        getToolPermissionContext,
        agents,
        model,
      )

      // 满足 `enabled` 时，共享工具执行该分支。
      if (enabled) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Auto tool search enabled: ${debugDescription}` +
            (source ? ` [source: ${source}]` : ''),
        )
        // 调用 logModeDecision，触发共享工具此处需要的副作用。
        logModeDecision(true, mode, 'auto_above_threshold', metrics)
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Auto tool search disabled: ${debugDescription}` +
          (source ? ` [source: ${source}]` : ''),
      )
      // 调用 logModeDecision，触发共享工具此处需要的副作用。
      logModeDecision(false, mode, 'auto_below_threshold', metrics)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    case 'standard':
      // 调用 logModeDecision，触发共享工具此处需要的副作用。
      logModeDecision(false, mode, 'standard_mode')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

/**
 * Check if an object is a tool_reference block.
 * tool_reference is a beta feature not in the SDK types, so we need runtime checks.
 */
// isToolReferenceBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolReferenceBlock(obj: unknown): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    (obj as { type: unknown }).type === 'tool_reference'
  )
}

/**
 * Type guard for tool_reference block with tool_name.
 */
// isToolReferenceWithName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolReferenceWithName(
  obj: unknown,
): obj is { type: 'tool_reference'; tool_name: string } {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isToolReferenceBlock(obj) &&
    'tool_name' in (obj as object) &&
    typeof (obj as { tool_name: unknown }).tool_name === 'string'
  )
}

/**
 * Type representing a tool_result block with array content.
 * Used for extracting tool_reference blocks from ToolSearchTool results.
 */
// ToolResultBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolResultBlock = {
  type: 'tool_result'
  content: unknown[]
}

/**
 * Type guard for tool_result blocks with array content.
 */
// isToolResultBlockWithContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolResultBlockWithContent(obj: unknown): obj is ToolResultBlock {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    (obj as { type: unknown }).type === 'tool_result' &&
    'content' in obj &&
    Array.isArray((obj as { content: unknown }).content)
  )
}

/**
 * Extract tool names from tool_reference blocks in message history.
 *
 * When dynamic tool loading is enabled, MCP tools are not predeclared in the
 * tools array. Instead, they are discovered via ToolSearchTool which returns
 * tool_reference blocks. This function scans the message history to find all
 * tool names that have been referenced, so we can include only those tools
 * in subsequent API requests.
 *
 * This approach:
 * - Eliminates the need to predeclare all MCP tools upfront
 * - Removes limits on total quantity of MCP tools
 *
 * Compaction replaces tool_reference-bearing messages with a summary, so it
 * snapshots the discovered set onto compactMetadata.preCompactDiscoveredTools
 * on the boundary marker; this scan reads it back. Snip instead protects the
 * tool_reference-carrying messages from removal.
 *
 * @param messages Array of messages that may contain tool_result blocks with tool_reference content
 * @returns Set of tool names that have been discovered via tool_reference blocks
 */
// extractDiscoveredToolNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractDiscoveredToolNames(messages: Message[]): Set<string> {
  // discoveredTools 集合构建`new Set<string>()` 整理出中间结果，供共享工具 tool Search后续步骤使用。
  const discoveredTools = new Set<string>()
  // carriedFromBoundary保存`0`，供后续判断或组装使用。
  let carriedFromBoundary = 0

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // Compact boundary carries the pre-compact discovered set. Inline type
    // check rather than isCompactBoundaryMessage — utils/messages.ts imports
    // from this file, so importing back would be circular.
    // 只有 `msg.type === 'system' && msg.subtype === 'compact` 满足时，共享工具才执行该分支。
    if (msg.type === 'system' && msg.subtype === 'compact_boundary') {
      // carried保存`msg.compactMetadata?.preCompactDiscoveredTools`，供共享工具 tool Search后续判断或输出使用。
      const carried = msg.compactMetadata?.preCompactDiscoveredTools
      // 满足 `carried` 时，共享工具执行该分支。
      if (carried) {
        // 逐项读取 `carried) discoveredTools.add(name` 中的名称，按输入顺序推进共享工具。
        for (const name of carried) discoveredTools.add(name)
        // 共享工具 tool Search在这里处理 `carriedFromBoundary += carried.length`，完成这一小步状态转换。
        carriedFromBoundary += carried.length
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Only user messages contain tool_result blocks (responses to tool_use)
    // `msg.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'user') continue

    // 文本内容 命名 `msg.message?.content`，让后续代码直接表达这个值的用途。
    const content = msg.message?.content
    // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
    if (!Array.isArray(content)) continue

    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // tool_reference blocks only appear inside tool_result content, specifically
      // in results from ToolSearchTool. The API expands these references into full
      // tool definitions in the model's context.
      // 满足 `isToolResultBlockWithContent(block)` 时，共享工具执行该分支。
      if (isToolResultBlockWithContent(block)) {
        // 按顺序遍历 `block.content` 中的item，逐个交给共享工具处理。
        for (const item of block.content) {
          // 满足 `isToolReferenceWithName(item)` 时，共享工具执行该分支。
          if (isToolReferenceWithName(item)) {
            // 调用 discoveredTools.add，触发共享工具此处需要的副作用。
            discoveredTools.add(item.tool_name)
          }
        }
      }
    }
  }

  // 满足 `discoveredTools.size > 0` 时，共享工具执行该分支。
  if (discoveredTools.size > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Dynamic tool loading: found ${discoveredTools.size} discovered tools in message history` +
        (carriedFromBoundary > 0
          ? ` (${carriedFromBoundary} carried from compact boundary)`
          : ''),
    )
  }

  // 返回 `discoveredTools`，作为共享工具这次计算的结果。
  return discoveredTools
}

// DeferredToolsDelta 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeferredToolsDelta = {
  addedNames: string[]
  /** Rendered lines for addedNames; the scan reconstructs from names. */
  addedLines: string[]
  removedNames: string[]
}

/**
 * Call-site discriminator for the tengu_deferred_tools_pool_change event.
 * The scan runs from several sites with different expected-prior semantics
 * (inc-4747):
 *   - attachments_main: main-thread getAttachments → prior=0 is a BUG on fire-2+
 *   - attachments_subagent: subagent getAttachments → prior=0 is EXPECTED
 *     (fresh conversation, initialMessages has no DTD)
 *   - compact_full: compact.ts passes [] → prior=0 is EXPECTED
 *   - compact_partial: compact.ts passes messagesToKeep → depends on what survived
 *   - reactive_compact: reactiveCompact.ts passes preservedMessages → same
 * Without this the 96%-prior=0 stat is dominated by EXPECTED buckets and
 * the real main-thread cross-turn bug (if any) is invisible in BQ.
 */
// DeferredToolsDeltaScanContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeferredToolsDeltaScanContext = {
  callSite:
    | 'attachments_main'
    | 'attachments_subagent'
    | 'compact_full'
    | 'compact_partial'
    | 'reactive_compact'
  querySource?: string
}

/**
 * True → announce deferred tools via persisted delta attachments.
 * False → claude.ts keeps its per-call <available-deferred-tools>
 * header prepend (the attachment does not fire).
 */
// isDeferredToolsDeltaEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDeferredToolsDeltaEnabled(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    process.env.USER_TYPE === 'ant' ||
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_glacier_2xr', false)
  )
}

/**
 * Diff the current deferred-tool pool against what's already been
 * announced in this conversation (reconstructed by scanning for prior
 * deferred_tools_delta attachments). Returns null if nothing changed.
 *
 * A name that was announced but has since stopped being deferred — yet
 * is still in the base pool — is NOT reported as removed. It's now
 * loaded directly, so telling the model "no longer available" would be
 * wrong.
 */
// getDeferredToolsDelta 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDeferredToolsDelta(
  tools: Tools,
  messages: Message[],
  scanContext?: DeferredToolsDeltaScanContext,
): DeferredToolsDelta | null {
  // announced 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const announced = new Set<string>()
  // attachmentCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let attachmentCount = 0
  // dtdCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let dtdCount = 0
  // attachmentTypesSeen构建`new Set<string>()`，供后续判断或组装使用。
  const attachmentTypesSeen = new Set<string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // `msg.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'attachment') continue
    // 共享工具 tool Search在这里处理 `attachmentCount++`，完成这一小步状态转换。
    attachmentCount++
    // 调用 attachmentTypesSeen.add，触发共享工具此处需要的副作用。
    attachmentTypesSeen.add(msg.attachment.type)
    // `msg.attachment.type` 与 `'deferred_tools_delta'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.attachment.type !== 'deferred_tools_delta') continue
    // 共享工具 tool Search在这里处理 `dtdCount++`，完成这一小步状态转换。
    dtdCount++
    // 逐项读取 `msg.attachment.addedNames) announced.add(n` 中的n，按输入顺序推进共享工具。
    for (const n of msg.attachment.addedNames) announced.add(n)
    // 逐项读取 `msg.attachment.removedNames) announced.delete(n` 中的n，按输入顺序推进共享工具。
    for (const n of msg.attachment.removedNames) announced.delete(n)
  }

  // deferred 命名 `tools.filter(isDeferredTool)`，让后续代码直接表达这个值的用途。
  const deferred: Tool[] = tools.filter(isDeferredTool)
  // deferredNames 集合保存`Set`，供共享工具后续处理使用。
  const deferredNames = new Set(deferred.map(t => t.name))
  // poolNames 集合保存`Set`，供共享工具后续处理使用。
  const poolNames = new Set(tools.map(t => t.name))

  // added筛选`deferred.filter`，供共享工具后续处理使用。
  const added = deferred.filter(t => !announced.has(t.name))
  // removed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removed: string[] = []
  // 按顺序遍历 `announced` 中的n，逐个交给共享工具处理。
  for (const n of announced) {
    // 满足 `deferredNames.has(n)` 时，共享工具执行该分支。
    if (deferredNames.has(n)) continue
    // 满足 `!poolNames.has(n)) removed.push(n` 时，共享工具执行该分支。
    if (!poolNames.has(n)) removed.push(n)
    // else: undeferred — silent
  }

  // added.length === 0 && removed 数量为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (added.length === 0 && removed.length === 0) return null

  // Diagnostic for the inc-4747 scan-finds-nothing bug. Round-1 fields
  // (messagesLength/attachmentCount/dtdCount from #23167) showed 45.6% of
  // events have attachments-but-no-DTD, but those numbers are confounded:
  // subagent first-fires and compact-path scans have EXPECTED prior=0 and
  // dominate the stat. callSite/querySource/attachmentTypesSeen split the
  // buckets so the real main-thread cross-turn failure is isolable in BQ.
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_deferred_tools_pool_change', {
    addedCount: added.length,
    removedCount: removed.length,
    priorAnnouncedCount: announced.size,
    messagesLength: messages.length,
    attachmentCount,
    dtdCount,
    callSite: (scanContext?.callSite ??
      'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    querySource: (scanContext?.querySource ??
      'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    attachmentTypesSeen: [...attachmentTypesSeen]
      .sort()
      .join(',') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // 这个回调绑定到 addedNames: added.map(t => t.name).sort(),，负责共享工具在该局部场景下的响应。
    addedNames: added.map(t => t.name).sort(),
    addedLines: added.map(formatDeferredToolLine).sort(),
    removedNames: removed.sort(),
  }
}

/**
 * Check whether deferred tools exceed the auto-threshold for enabling TST.
 * Tries exact token count first; falls back to character-based heuristic.
 */
// checkAutoThreshold 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkAutoThreshold(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agents: AgentDefinition[],
  model: string,
): Promise<{
  enabled: boolean
  debugDescription: string
  metrics: Record<string, number>
}> {
  // Try exact token count first (cached, one API call per toolset change)
  // deferredToolTokens 集合读取`getDeferredToolTokenCount`，供共享工具后续处理使用。
  const deferredToolTokens = await getDeferredToolTokenCount(
    tools,
    getToolPermissionContext,
    agents,
    model,
  )

  // `deferredToolTokens` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (deferredToolTokens !== null) {
    // threshold读取`getAutoToolSearchTokenThreshold`，供共享工具后续处理使用。
    const threshold = getAutoToolSearchTokenThreshold(model)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      enabled: deferredToolTokens >= threshold,
      debugDescription:
        `${deferredToolTokens} tokens (threshold: ${threshold}, ` +
        `${getAutoToolSearchPercentage()}% of context)`,
      metrics: { deferredToolTokens, threshold },
    }
  }

  // Fallback: character-based heuristic when token API is unavailable
  // deferredToolDescriptionChars 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const deferredToolDescriptionChars =
    await calculateDeferredToolDescriptionChars(
      tools,
      getToolPermissionContext,
      agents,
    )
  // charThreshold读取`getAutoToolSearchCharThreshold`，供共享工具后续处理使用。
  const charThreshold = getAutoToolSearchCharThreshold(model)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    enabled: deferredToolDescriptionChars >= charThreshold,
    debugDescription:
      `${deferredToolDescriptionChars} chars (threshold: ${charThreshold}, ` +
      `${getAutoToolSearchPercentage()}% of context) (char fallback)`,
    metrics: { deferredToolDescriptionChars, charThreshold },
  }
}
