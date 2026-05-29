// 类型依赖 { BetaUsage as Usage } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaUsage as Usage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 src/services/analytics/index.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from 'src/services/analytics/index.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 setHasUnknownModelCost，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setHasUnknownModelCost } from '../bootstrap/state.js'
// 引入 isFastModeEnabled，将 ./fastMode.js 中已经封装好的能力接到本文件流程里。
import { isFastModeEnabled } from './fastMode.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_3_5_HAIKU_CONFIG,
  CLAUDE_3_5_V2_SONNET_CONFIG,
  CLAUDE_3_7_SONNET_CONFIG,
  CLAUDE_HAIKU_4_5_CONFIG,
  CLAUDE_OPUS_4_1_CONFIG,
  CLAUDE_OPUS_4_5_CONFIG,
  CLAUDE_OPUS_4_6_CONFIG,
  CLAUDE_OPUS_4_CONFIG,
  CLAUDE_SONNET_4_5_CONFIG,
  CLAUDE_SONNET_4_6_CONFIG,
  CLAUDE_SONNET_4_CONFIG,
} from './model/configs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  firstPartyNameToCanonical,
  getCanonicalName,
  getDefaultMainLoopModelSetting,
  type ModelShortName,
} from './model/model.js'

// @see https://platform.claude.com/docs/en/about-claude/pricing
// ModelCosts 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelCosts = {
  inputTokens: number
  outputTokens: number
  promptCacheWriteTokens: number
  promptCacheReadTokens: number
  webSearchRequests: number
}

// Standard pricing tier for Sonnet models: $3 input / $15 output per Mtok
// COST_TIER_3_15集中保存共享工具 model Cost要一起传递的字段。
export const COST_TIER_3_15 = {
  inputTokens: 3,
  outputTokens: 15,
  promptCacheWriteTokens: 3.75,
  promptCacheReadTokens: 0.3,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// Pricing tier for Opus 4/4.1: $15 input / $75 output per Mtok
// COST_TIER_15_75集中保存共享工具 model Cost要一起传递的字段。
export const COST_TIER_15_75 = {
  inputTokens: 15,
  outputTokens: 75,
  promptCacheWriteTokens: 18.75,
  promptCacheReadTokens: 1.5,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// Pricing tier for Opus 4.5: $5 input / $25 output per Mtok
// COST_TIER_5_25集中保存共享工具 model Cost要一起传递的字段。
export const COST_TIER_5_25 = {
  inputTokens: 5,
  outputTokens: 25,
  promptCacheWriteTokens: 6.25,
  promptCacheReadTokens: 0.5,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// Fast mode pricing for Opus 4.6: $30 input / $150 output per Mtok
// COST_TIER_30_150集中保存共享工具 model Cost要一起传递的字段。
export const COST_TIER_30_150 = {
  inputTokens: 30,
  outputTokens: 150,
  promptCacheWriteTokens: 37.5,
  promptCacheReadTokens: 3,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// Pricing for Haiku 3.5: $0.80 input / $4 output per Mtok
// COST_HAIKU_35集中保存共享工具 model Cost要一起传递的字段。
export const COST_HAIKU_35 = {
  inputTokens: 0.8,
  outputTokens: 4,
  promptCacheWriteTokens: 1,
  promptCacheReadTokens: 0.08,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// Pricing for Haiku 4.5: $1 input / $5 output per Mtok
// COST_HAIKU_45集中保存共享工具 model Cost要一起传递的字段。
export const COST_HAIKU_45 = {
  inputTokens: 1,
  outputTokens: 5,
  promptCacheWriteTokens: 1.25,
  promptCacheReadTokens: 0.1,
  webSearchRequests: 0.01,
} as const satisfies ModelCosts

// DEFAULT_UNKNOWN_MODEL_COST保存`COST_TIER_5_25`，供共享工具 model Cost后续判断或输出使用。
const DEFAULT_UNKNOWN_MODEL_COST = COST_TIER_5_25

/**
 * Get the cost tier for Opus 4.6 based on fast mode.
 */
// getOpus46CostTier 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOpus46CostTier(fastMode: boolean): ModelCosts {
  // 只有 `isFastModeEnabled() && fastMode` 满足时，共享工具才执行该分支。
  if (isFastModeEnabled() && fastMode) {
    // 返回 `COST_TIER_30_150`，作为共享工具这次计算的结果。
    return COST_TIER_30_150
  }
  // 返回 `COST_TIER_5_25`，作为共享工具这次计算的结果。
  return COST_TIER_5_25
}

// @[MODEL LAUNCH]: Add a pricing entry for the new model below.
// Costs from https://platform.claude.com/docs/en/about-claude/pricing
// Web search cost: $10 per 1000 requests = $0.01 per request
// MODEL_COSTS 集合 集中保存共享工具 model Cost要一起传递的字段。
export const MODEL_COSTS: Record<ModelShortName, ModelCosts> = {
  [firstPartyNameToCanonical(CLAUDE_3_5_HAIKU_CONFIG.firstParty)]:
    COST_HAIKU_35,
  [firstPartyNameToCanonical(CLAUDE_HAIKU_4_5_CONFIG.firstParty)]:
    COST_HAIKU_45,
  [firstPartyNameToCanonical(CLAUDE_3_5_V2_SONNET_CONFIG.firstParty)]:
    COST_TIER_3_15,
  [firstPartyNameToCanonical(CLAUDE_3_7_SONNET_CONFIG.firstParty)]:
    COST_TIER_3_15,
  [firstPartyNameToCanonical(CLAUDE_SONNET_4_CONFIG.firstParty)]:
    COST_TIER_3_15,
  [firstPartyNameToCanonical(CLAUDE_SONNET_4_5_CONFIG.firstParty)]:
    COST_TIER_3_15,
  [firstPartyNameToCanonical(CLAUDE_SONNET_4_6_CONFIG.firstParty)]:
    COST_TIER_3_15,
  [firstPartyNameToCanonical(CLAUDE_OPUS_4_CONFIG.firstParty)]: COST_TIER_15_75,
  [firstPartyNameToCanonical(CLAUDE_OPUS_4_1_CONFIG.firstParty)]:
    COST_TIER_15_75,
  [firstPartyNameToCanonical(CLAUDE_OPUS_4_5_CONFIG.firstParty)]:
    COST_TIER_5_25,
  [firstPartyNameToCanonical(CLAUDE_OPUS_4_6_CONFIG.firstParty)]:
    COST_TIER_5_25,
}

/**
 * Calculates the USD cost based on token usage and model cost configuration
 */
// tokensToUSDCost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tokensToUSDCost(modelCosts: ModelCosts, usage: Usage): number {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    (usage.input_tokens / 1_000_000) * modelCosts.inputTokens +
    (usage.output_tokens / 1_000_000) * modelCosts.outputTokens +
    ((usage.cache_read_input_tokens ?? 0) / 1_000_000) *
      modelCosts.promptCacheReadTokens +
    ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) *
      modelCosts.promptCacheWriteTokens +
    (usage.server_tool_use?.web_search_requests ?? 0) *
      modelCosts.webSearchRequests
  )
}

// getModelCosts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelCosts(model: string, usage: Usage): ModelCosts {
  // shortName读取`getCanonicalName`，供共享工具后续处理使用。
  const shortName = getCanonicalName(model)

  // Check if this is an Opus 4.6 model with fast mode active.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    shortName === firstPartyNameToCanonical(CLAUDE_OPUS_4_6_CONFIG.firstParty)
  ) {
    // isFastMode标记共享工具 model Cost是否启用对应路径。
    const isFastMode = usage.speed === 'fast'
    // 返回 `getOpus46CostTier(isFastMode)`，作为共享工具这次计算的结果。
    return getOpus46CostTier(isFastMode)
  }

  // costs 集合 命名 `MODEL_COSTS[shortName]`，让后续代码直接表达这个值的用途。
  const costs = MODEL_COSTS[shortName]
  // costs 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!costs) {
    // 调用 trackUnknownModelCost，触发共享工具此处需要的副作用。
    trackUnknownModelCost(model, shortName)
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      MODEL_COSTS[getCanonicalName(getDefaultMainLoopModelSetting())] ??
      DEFAULT_UNKNOWN_MODEL_COST
    )
  }
  // 返回 `costs`，作为共享工具这次计算的结果。
  return costs
}

// trackUnknownModelCost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function trackUnknownModelCost(model: string, shortName: ModelShortName): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_unknown_model_cost', {
    model: model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    shortName:
      shortName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
  // setHasUnknownModelCost 写入新的状态值，使共享工具后续读取保持一致。
  setHasUnknownModelCost()
}

// Calculate the cost of a query in US dollars.
// If the model's costs are not found, use the default model's costs.
// calculateUSDCost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateUSDCost(resolvedModel: string, usage: Usage): number {
  // modelCosts 集合读取`getModelCosts`，供共享工具后续处理使用。
  const modelCosts = getModelCosts(resolvedModel, usage)
  // 返回 `tokensToUSDCost(modelCosts, usage)`，作为共享工具这次计算的结果。
  return tokensToUSDCost(modelCosts, usage)
}

/**
 * Calculate cost from raw token counts without requiring a full BetaUsage object.
 * Useful for side queries (e.g. classifier) that track token counts independently.
 */
// calculateCostFromTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateCostFromTokens(
  model: string,
  tokens: {
    inputTokens: number
    outputTokens: number
    cacheReadInputTokens: number
    cacheCreationInputTokens: number
  },
): number {
  // usage 集中保存共享工具 model Cost要一起传递的字段。
  const usage: Usage = {
    input_tokens: tokens.inputTokens,
    output_tokens: tokens.outputTokens,
    cache_read_input_tokens: tokens.cacheReadInputTokens,
    cache_creation_input_tokens: tokens.cacheCreationInputTokens,
  } as Usage
  // 返回 `calculateUSDCost(model, usage)`，作为共享工具这次计算的结果。
  return calculateUSDCost(model, usage)
}

// formatPrice 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatPrice(price: number): string {
  // Format price: integers without decimals, others with 2 decimal places
  // e.g., 3 -> "$3", 0.8 -> "$0.80", 22.5 -> "$22.50"
  // 满足 `Number.isInteger(price)` 时，共享工具执行该分支。
  if (Number.isInteger(price)) {
    // 返回 ``$${price}``，作为共享工具这次计算的结果。
    return `$${price}`
  }
  // 返回 ``$${price.toFixed(2)}``，作为共享工具这次计算的结果。
  return `$${price.toFixed(2)}`
}

/**
 * Format model costs as a pricing string for display
 * e.g., "$3/$15 per Mtok"
 */
// formatModelPricing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatModelPricing(costs: ModelCosts): string {
  // 返回 ``${formatPrice(costs.inputTokens)}/${formatPrice(costs.outputTokens)} p...`，作为共享工具这次计算的结果。
  return `${formatPrice(costs.inputTokens)}/${formatPrice(costs.outputTokens)} per Mtok`
}

/**
 * Get formatted pricing string for a model
 * Accepts either a short name or full model name
 * Returns undefined if model is not found
 */
// getModelPricingString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelPricingString(model: string): string | undefined {
  // shortName读取`getCanonicalName`，供共享工具后续处理使用。
  const shortName = getCanonicalName(model)
  // costs 集合 命名 `MODEL_COSTS[shortName]`，让后续代码直接表达这个值的用途。
  const costs = MODEL_COSTS[shortName]
  // costs 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!costs) return undefined
  // 返回 `formatModelPricing(costs)`，作为共享工具这次计算的结果。
  return formatModelPricing(costs)
}
