// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 类型依赖 { Theme } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { Theme } from './theme.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 引入 getCanonicalName，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getCanonicalName } from './model/model.js'
// 引入 get3PModelCapabilityOverride，将 ./model/modelSupportOverrides.js 中已经封装好的能力接到本文件流程里。
import { get3PModelCapabilityOverride } from './model/modelSupportOverrides.js'
// 引入 getAPIProvider，将 ./model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './model/providers.js'
// 引入 getSettingsWithErrors，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsWithErrors } from './settings/settings.js'

// ThinkingConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ThinkingConfig =
  | { type: 'adaptive' }
  | { type: 'enabled'; budgetTokens: number }
  | { type: 'disabled' }

/**
 * Build-time gate (feature) + runtime gate (GrowthBook). The build flag
 * controls code inclusion in external builds; the GB flag controls rollout.
 */
// isUltrathinkEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isUltrathinkEnabled(): boolean {
  // 满足 `!feature('ULTRATHINK')` 时，共享工具执行该分支。
  if (!feature('ULTRATHINK')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_turtle_carbon', true)`，作为共享工具这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_turtle_carbon', true)
}

/**
 * Check if text contains the "ultrathink" keyword.
 */
// hasUltrathinkKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasUltrathinkKeyword(text: string): boolean {
  // 返回 `/\bultrathink\b/i.test(text)`，作为共享工具这次计算的结果。
  return /\bultrathink\b/i.test(text)
}

/**
 * Find positions of "ultrathink" keyword in text (for UI highlighting/notification)
 */
// findThinkingTriggerPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findThinkingTriggerPositions(text: string): Array<{
  word: string
  start: number
  end: number
}> {
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: Array<{ word: string; start: number; end: number }> = []
  // Fresh /g literal each call — String.prototype.matchAll copies lastIndex
  // from the source regex, so a shared instance would leak state from
  // hasUltrathinkKeyword's .test() into this call on the next render.
  // matches 集合保存`text.matchAll`，供共享工具后续处理使用。
  const matches = text.matchAll(/\bultrathink\b/gi)

  // 按顺序遍历 `matches` 中的match，逐个交给共享工具处理。
  for (const match of matches) {
    // `match.index` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (match.index !== undefined) {
      // positions 集合追加新条目，保持收集顺序与输入顺序一致。
      positions.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  }

  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// RAINBOW_COLORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const RAINBOW_COLORS: Array<keyof Theme> = [
  'rainbow_red',
  'rainbow_orange',
  'rainbow_yellow',
  'rainbow_green',
  'rainbow_blue',
  'rainbow_indigo',
  'rainbow_violet',
]

// RAINBOW_SHIMMER_COLORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const RAINBOW_SHIMMER_COLORS: Array<keyof Theme> = [
  'rainbow_red_shimmer',
  'rainbow_orange_shimmer',
  'rainbow_yellow_shimmer',
  'rainbow_green_shimmer',
  'rainbow_blue_shimmer',
  'rainbow_indigo_shimmer',
  'rainbow_violet_shimmer',
]

// getRainbowColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRainbowColor(
  charIndex: number,
  shimmer: boolean = false,
): keyof Theme {
  // colors 集合保存`shimmer ? RAINBOW_SHIMMER_COLORS : RAINBOW_COLORS`，供后续判断或组装使用。
  const colors = shimmer ? RAINBOW_SHIMMER_COLORS : RAINBOW_COLORS
  // 返回 `colors[charIndex % colors.length]!`，作为共享工具这次计算的结果。
  return colors[charIndex % colors.length]!
}

// TODO(inigo): add support for probing unknown models via API error detection
// Provider-aware thinking support detection (aligns with modelSupportsISP in betas.ts)
// modelSupportsThinking 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsThinking(model: string): boolean {
  // supported3P读取`get3PModelCapabilityOverride`，供共享工具后续处理使用。
  const supported3P = get3PModelCapabilityOverride(model, 'thinking')
  // `supported3P` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (supported3P !== undefined) {
    // 返回 `supported3P`，作为共享工具这次计算的结果。
    return supported3P
  }
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 满足 `resolveAntModel(model.toLowerCase())` 时，共享工具执行该分支。
    if (resolveAntModel(model.toLowerCase())) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // IMPORTANT: Do not change thinking support without notifying the model
  // launch DRI and research. This can greatly affect model quality and bashing.
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // 1P and Foundry: all Claude 4+ models (including Haiku 4.5)
  // 只有 `provider === 'foundry' || provider === 'firstPart` 满足时，共享工具才执行该分支。
  if (provider === 'foundry' || provider === 'firstParty') {
    // 返回 `!canonical.includes('claude-3-')`，作为共享工具这次计算的结果。
    return !canonical.includes('claude-3-')
  }
  // 3P (Bedrock/Vertex): only Opus 4+ and Sonnet 4+
  // 返回 `canonical.includes('sonnet-4') || canonical.includes('opus-4')`，作为共享工具这次计算的结果。
  return canonical.includes('sonnet-4') || canonical.includes('opus-4')
}

// @[MODEL LAUNCH]: Add the new model to the allowlist if it supports adaptive thinking.
// modelSupportsAdaptiveThinking 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsAdaptiveThinking(model: string): boolean {
  // supported3P读取`get3PModelCapabilityOverride`，供共享工具后续处理使用。
  const supported3P = get3PModelCapabilityOverride(model, 'adaptive_thinking')
  // `supported3P` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (supported3P !== undefined) {
    // 返回 `supported3P`，作为共享工具这次计算的结果。
    return supported3P
  }
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // Supported by a subset of Claude 4 models
  // 只有 `canonical.includes('opus-4-6') || canonical.includes('sonnet-4-6')` 满足时，共享工具才执行该分支。
  if (canonical.includes('opus-4-6') || canonical.includes('sonnet-4-6')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Exclude any other known legacy models (allowlist above catches 4-6 variants first)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    canonical.includes('opus') ||
    canonical.includes('sonnet') ||
    canonical.includes('haiku')
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // IMPORTANT: Do not change adaptive thinking support without notifying the
  // model launch DRI and research. This can greatly affect model quality and
  // bashing.

  // Newer models (4.6+) are all trained on adaptive thinking and MUST have it
  // enabled for model testing. DO NOT default to false for first party, otherwise
  // we may silently degrade model quality.

  // Default to true for unknown model strings on 1P and Foundry (because Foundry
  // is a proxy). Do not default to true for other 3P as they have different formats
  // for their model strings.
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // 返回 `provider === 'firstParty' || provider === 'foundry'`，作为共享工具这次计算的结果。
  return provider === 'firstParty' || provider === 'foundry'
}

// shouldEnableThinkingByDefault 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldEnableThinkingByDefault(): boolean {
  // 满足 `process.env.MAX_THINKING_TOKENS` 时，共享工具执行该分支。
  if (process.env.MAX_THINKING_TOKENS) {
    // 返回 `parseInt(process.env.MAX_THINKING_TOKENS, 10) > 0`，作为共享工具这次计算的结果。
    return parseInt(process.env.MAX_THINKING_TOKENS, 10) > 0
  }

  // 从 `getSettingsWithErrors()` 解构 settings，减少共享工具 thinking对同一对象的重复访问。
  const { settings } = getSettingsWithErrors()
  // 满足 `settings.alwaysThinkingEnabled === false` 时，共享工具执行该分支。
  if (settings.alwaysThinkingEnabled === false) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // IMPORTANT: Do not change default thinking enabled value without notifying
  // the model launch DRI and research. This can greatly affect model quality and
  // bashing.

  // Enable thinking by default unless explicitly disabled.
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
