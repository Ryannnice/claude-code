// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * Ensure that any model codenames introduced here are also added to
 * scripts/excluded-strings.txt to avoid leaking them. Wrap any codename string
 * literals with process.env.USER_TYPE === 'ant' for Bun to remove the codenames
 * during dead code elimination
 */
// 引入 getMainLoopModelOverride，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModelOverride } from '../../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSubscriptionType,
  isClaudeAISubscriber,
  isMaxSubscriber,
  isProSubscriber,
  isTeamPremiumSubscriber,
} from '../auth.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  has1mContext,
  is1mContextDisabled,
  modelSupports1M,
} from '../context.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 getModelStrings、resolveOverriddenModel，将 ./modelStrings.js 中已经封装好的能力接到本文件流程里。
import { getModelStrings, resolveOverriddenModel } from './modelStrings.js'
// 引入 formatModelPricing、getOpus46CostTier，将 ../modelCost.js 中已经封装好的能力接到本文件流程里。
import { formatModelPricing, getOpus46CostTier } from '../modelCost.js'
// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'
// 类型依赖 { PermissionMode } 来自 ../permissions/PermissionMode.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../permissions/PermissionMode.js'
// 引入 getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './providers.js'
// 引入 LIGHTNING_BOLT，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { LIGHTNING_BOLT } from '../../constants/figures.js'
// 引入 isModelAllowed，将 ./modelAllowlist.js 中已经封装好的能力接到本文件流程里。
import { isModelAllowed } from './modelAllowlist.js'
// 引入 ModelAlias、isModelAlias，将 ./aliases.js 中已经封装好的能力接到本文件流程里。
import { type ModelAlias, isModelAlias } from './aliases.js'
// 引入 capitalize，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { capitalize } from '../stringUtils.js'

// ModelShortName 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelShortName = string
// ModelName 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelName = string
// ModelSetting 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelSetting = ModelName | ModelAlias | null

// getSmallFastModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSmallFastModel(): ModelName {
  // 返回 `process.env.ANTHROPIC_SMALL_FAST_MODEL || getDefaultHaikuModel()`，作为共享工具这次计算的结果。
  return process.env.ANTHROPIC_SMALL_FAST_MODEL || getDefaultHaikuModel()
}

// isNonCustomOpusModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isNonCustomOpusModel(model: ModelName): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    model === getModelStrings().opus40 ||
    model === getModelStrings().opus41 ||
    model === getModelStrings().opus45 ||
    model === getModelStrings().opus46
  )
}

/**
 * Helper to get the model from /model (including via /config), the --model flag, environment variable,
 * or the saved settings. The returned value can be a model alias if that's what the user specified.
 * Undefined if the user didn't configure anything, in which case we fall back to
 * the default (null).
 *
 * Priority order within this function:
 * 1. Model override during session (from /model command) - highest priority
 * 2. Model override at startup (from --model flag)
 * 3. ANTHROPIC_MODEL environment variable
 * 4. Settings (from user's saved settings)
 */
// getUserSpecifiedModelSetting 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserSpecifiedModelSetting(): ModelSetting | undefined {
  // specifiedModel 先占位，稍后的条件分支会根据实际输入补齐它。
  let specifiedModel: ModelSetting | undefined

  // modelOverride读取`getMainLoopModelOverride`，供共享工具后续处理使用。
  const modelOverride = getMainLoopModelOverride()
  // `modelOverride` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (modelOverride !== undefined) {
    // specifiedModel更新为 `modelOverride`，确保模型工具后续读取最新状态。
    specifiedModel = modelOverride
  } else {
    // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
    const settings = getSettings_DEPRECATED() || {}
    // specifiedModel更新为 `process.env.ANTHROPIC_MODEL || settings.model || undefined`，确保模型工具后续读取最新状态。
    specifiedModel = process.env.ANTHROPIC_MODEL || settings.model || undefined
  }

  // Ignore the user-specified model if it's not in the availableModels allowlist.
  // 只有 `specifiedModel && !isModelAllowed(specifiedModel)` 满足时，共享工具才执行该分支。
  if (specifiedModel && !isModelAllowed(specifiedModel)) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回 `specifiedModel`，作为共享工具这次计算的结果。
  return specifiedModel
}

/**
 * Get the main loop model to use for the current session.
 *
 * Model Selection Priority Order:
 * 1. Model override during session (from /model command) - highest priority
 * 2. Model override at startup (from --model flag)
 * 3. ANTHROPIC_MODEL environment variable
 * 4. Settings (from user's saved settings)
 * 5. Built-in default
 *
 * @returns The resolved model name to use
 */
// getMainLoopModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMainLoopModel(): ModelName {
  // 模型名称读取`getUserSpecifiedModelSetting`，供共享工具后续处理使用。
  const model = getUserSpecifiedModelSetting()
  // `model` 与 `undefined && model !== null` 不一致时刷新派生状态，避免使用过期结果。
  if (model !== undefined && model !== null) {
    // 返回 `parseUserSpecifiedModel(model)`，作为共享工具这次计算的结果。
    return parseUserSpecifiedModel(model)
  }
  // 返回 `getDefaultMainLoopModel()`，作为共享工具这次计算的结果。
  return getDefaultMainLoopModel()
}

// getBestModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBestModel(): ModelName {
  // 返回 `getDefaultOpusModel()`，作为共享工具这次计算的结果。
  return getDefaultOpusModel()
}

// @[MODEL LAUNCH]: Update the default Opus model (3P providers may lag so keep defaults unchanged).
// getDefaultOpusModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultOpusModel(): ModelName {
  // 满足 `process.env.ANTHROPIC_DEFAULT_OPUS_MODEL` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL) {
    // 返回 `process.env.ANTHROPIC_DEFAULT_OPUS_MODEL`，作为共享工具这次计算的结果。
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  }
  // 3P providers (Bedrock, Vertex, Foundry) — kept as a separate branch
  // even when values match, since 3P availability lags firstParty and
  // these will diverge again at the next model launch.
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 返回 `getModelStrings().opus46`，作为共享工具这次计算的结果。
    return getModelStrings().opus46
  }
  // 返回 `getModelStrings().opus46`，作为共享工具这次计算的结果。
  return getModelStrings().opus46
}

// @[MODEL LAUNCH]: Update the default Sonnet model (3P providers may lag so keep defaults unchanged).
// getDefaultSonnetModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultSonnetModel(): ModelName {
  // 满足 `process.env.ANTHROPIC_DEFAULT_SONNET_MODEL` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_DEFAULT_SONNET_MODEL) {
    // 返回 `process.env.ANTHROPIC_DEFAULT_SONNET_MODEL`，作为共享工具这次计算的结果。
    return process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  }
  // Default to Sonnet 4.5 for 3P since they may not have 4.6 yet
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 返回 `getModelStrings().sonnet45`，作为共享工具这次计算的结果。
    return getModelStrings().sonnet45
  }
  // 返回 `getModelStrings().sonnet46`，作为共享工具这次计算的结果。
  return getModelStrings().sonnet46
}

// @[MODEL LAUNCH]: Update the default Haiku model (3P providers may lag so keep defaults unchanged).
// getDefaultHaikuModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultHaikuModel(): ModelName {
  // 满足 `process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
    // 返回 `process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL`，作为共享工具这次计算的结果。
    return process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  }

  // Haiku 4.5 is available on all platforms (first-party, Foundry, Bedrock, Vertex)
  // 返回 `getModelStrings().haiku45`，作为共享工具这次计算的结果。
  return getModelStrings().haiku45
}

/**
 * Get the model to use for runtime, depending on the runtime context.
 * @param params Subset of the runtime context to determine the model to use.
 * @returns The model to use
 */
// getRuntimeMainLoopModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRuntimeMainLoopModel(params: {
  permissionMode: PermissionMode
  mainLoopModel: string
  exceeds200kTokens?: boolean
}): ModelName {
  // 从 `params` 解构 permissionMode、mainLoopModel、exceeds200kTokens = false，减少模型工具 model对同一对象的重复访问。
  const { permissionMode, mainLoopModel, exceeds200kTokens = false } = params

  // opusplan uses Opus in plan mode without [1m] suffix.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getUserSpecifiedModelSetting() === 'opusplan' &&
    permissionMode === 'plan' &&
    !exceeds200kTokens
  ) {
    // 返回 `getDefaultOpusModel()`，作为共享工具这次计算的结果。
    return getDefaultOpusModel()
  }

  // sonnetplan by default
  // 当 `getUserSpecifiedModelSetting()` 匹配 `'haiku' && permissionMode =...` 时，共享工具执行对应分支。
  if (getUserSpecifiedModelSetting() === 'haiku' && permissionMode === 'plan') {
    // 返回 `getDefaultSonnetModel()`，作为共享工具这次计算的结果。
    return getDefaultSonnetModel()
  }

  // 返回 `mainLoopModel`，作为共享工具这次计算的结果。
  return mainLoopModel
}

/**
 * Get the default main loop model setting.
 *
 * This handles the built-in default:
 * - Opus for Max and Team Premium users
 * - Sonnet 4.6 for all other users (including Team Standard, Pro, Enterprise)
 *
 * @returns The default model setting to use
 */
// getDefaultMainLoopModelSetting 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  // Ants default to defaultModel from flag config, or Opus 1M if not configured
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      getAntModelOverrideConfig()?.defaultModel ??
      getDefaultOpusModel() + '[1m]'
    )
  }

  // Max users get Opus as default
  // 满足 `isMaxSubscriber()` 时，共享工具执行该分支。
  if (isMaxSubscriber()) {
    // 返回 `getDefaultOpusModel() + (isOpus1mMergeEnabled() ? '[1m]' : '')`，作为共享工具这次计算的结果。
    return getDefaultOpusModel() + (isOpus1mMergeEnabled() ? '[1m]' : '')
  }

  // Team Premium gets Opus (same as Max)
  // 满足 `isTeamPremiumSubscriber()` 时，共享工具执行该分支。
  if (isTeamPremiumSubscriber()) {
    // 返回 `getDefaultOpusModel() + (isOpus1mMergeEnabled() ? '[1m]' : '')`，作为共享工具这次计算的结果。
    return getDefaultOpusModel() + (isOpus1mMergeEnabled() ? '[1m]' : '')
  }

  // PAYG (1P and 3P), Enterprise, Team Standard, and Pro get Sonnet as default
  // Note that PAYG (3P) may default to an older Sonnet model
  // 返回 `getDefaultSonnetModel()`，作为共享工具这次计算的结果。
  return getDefaultSonnetModel()
}

/**
 * Synchronous operation to get the default main loop model to use
 * (bypassing any user-specified values).
 */
// getDefaultMainLoopModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultMainLoopModel(): ModelName {
  // 返回 `parseUserSpecifiedModel(getDefaultMainLoopModelSetting())`，作为共享工具这次计算的结果。
  return parseUserSpecifiedModel(getDefaultMainLoopModelSetting())
}

// @[MODEL LAUNCH]: Add a canonical name mapping for the new model below.
/**
 * Pure string-match that strips date/provider suffixes from a first-party model
 * name. Input must already be a 1P-format ID (e.g. 'claude-3-7-sonnet-20250219',
 * 'us.anthropic.claude-opus-4-6-v1:0'). Does not touch settings, so safe at
 * module top-level (see MODEL_COSTS in modelCost.ts).
 */
// firstPartyNameToCanonical 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function firstPartyNameToCanonical(name: ModelName): ModelShortName {
  // 名称更新为 `name.toLowerCase()`，确保模型工具后续读取最新状态。
  name = name.toLowerCase()
  // Special cases for Claude 4+ models to differentiate versions
  // Order matters: check more specific versions first (4-5 before 4)
  // 满足 `name.includes('claude-opus-4-6')` 时，共享工具执行该分支。
  if (name.includes('claude-opus-4-6')) {
    // 返回 `'claude-opus-4-6'`，作为共享工具这次计算的结果。
    return 'claude-opus-4-6'
  }
  // 满足 `name.includes('claude-opus-4-5')` 时，共享工具执行该分支。
  if (name.includes('claude-opus-4-5')) {
    // 返回 `'claude-opus-4-5'`，作为共享工具这次计算的结果。
    return 'claude-opus-4-5'
  }
  // 满足 `name.includes('claude-opus-4-1')` 时，共享工具执行该分支。
  if (name.includes('claude-opus-4-1')) {
    // 返回 `'claude-opus-4-1'`，作为共享工具这次计算的结果。
    return 'claude-opus-4-1'
  }
  // 满足 `name.includes('claude-opus-4')` 时，共享工具执行该分支。
  if (name.includes('claude-opus-4')) {
    // 返回 `'claude-opus-4'`，作为共享工具这次计算的结果。
    return 'claude-opus-4'
  }
  // 满足 `name.includes('claude-sonnet-4-6')` 时，共享工具执行该分支。
  if (name.includes('claude-sonnet-4-6')) {
    // 返回 `'claude-sonnet-4-6'`，作为共享工具这次计算的结果。
    return 'claude-sonnet-4-6'
  }
  // 满足 `name.includes('claude-sonnet-4-5')` 时，共享工具执行该分支。
  if (name.includes('claude-sonnet-4-5')) {
    // 返回 `'claude-sonnet-4-5'`，作为共享工具这次计算的结果。
    return 'claude-sonnet-4-5'
  }
  // 满足 `name.includes('claude-sonnet-4')` 时，共享工具执行该分支。
  if (name.includes('claude-sonnet-4')) {
    // 返回 `'claude-sonnet-4'`，作为共享工具这次计算的结果。
    return 'claude-sonnet-4'
  }
  // 满足 `name.includes('claude-haiku-4-5')` 时，共享工具执行该分支。
  if (name.includes('claude-haiku-4-5')) {
    // 返回 `'claude-haiku-4-5'`，作为共享工具这次计算的结果。
    return 'claude-haiku-4-5'
  }
  // Claude 3.x models use a different naming scheme (claude-3-{family})
  // 满足 `name.includes('claude-3-7-sonnet')` 时，共享工具执行该分支。
  if (name.includes('claude-3-7-sonnet')) {
    // 返回 `'claude-3-7-sonnet'`，作为共享工具这次计算的结果。
    return 'claude-3-7-sonnet'
  }
  // 满足 `name.includes('claude-3-5-sonnet')` 时，共享工具执行该分支。
  if (name.includes('claude-3-5-sonnet')) {
    // 返回 `'claude-3-5-sonnet'`，作为共享工具这次计算的结果。
    return 'claude-3-5-sonnet'
  }
  // 满足 `name.includes('claude-3-5-haiku')` 时，共享工具执行该分支。
  if (name.includes('claude-3-5-haiku')) {
    // 返回 `'claude-3-5-haiku'`，作为共享工具这次计算的结果。
    return 'claude-3-5-haiku'
  }
  // 满足 `name.includes('claude-3-opus')` 时，共享工具执行该分支。
  if (name.includes('claude-3-opus')) {
    // 返回 `'claude-3-opus'`，作为共享工具这次计算的结果。
    return 'claude-3-opus'
  }
  // 满足 `name.includes('claude-3-sonnet')` 时，共享工具执行该分支。
  if (name.includes('claude-3-sonnet')) {
    // 返回 `'claude-3-sonnet'`，作为共享工具这次计算的结果。
    return 'claude-3-sonnet'
  }
  // 满足 `name.includes('claude-3-haiku')` 时，共享工具执行该分支。
  if (name.includes('claude-3-haiku')) {
    // 返回 `'claude-3-haiku'`，作为共享工具这次计算的结果。
    return 'claude-3-haiku'
  }
  // match匹配`name.match`，供共享工具后续处理使用。
  const match = name.match(/(claude-(\d+-\d+-)?\w+)/)
  // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
  if (match && match[1]) {
    // 返回 `match[1]`，作为共享工具这次计算的结果。
    return match[1]
  }
  // Fall back to the original name if no pattern matches
  // 返回 `name`，作为共享工具这次计算的结果。
  return name
}

/**
 * Maps a full model string to a shorter canonical version that's unified across 1P and 3P providers.
 * For example, 'claude-3-5-haiku-20241022' and 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
 * would both be mapped to 'claude-3-5-haiku'.
 * @param fullModelName The full model name (e.g., 'claude-3-5-haiku-20241022')
 * @returns The short name (e.g., 'claude-3-5-haiku') if found, or the original name if no mapping exists
 */
// getCanonicalName 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCanonicalName(fullModelName: ModelName): ModelShortName {
  // Resolve overridden model IDs (e.g. Bedrock ARNs) back to canonical names.
  // resolved is always a 1P-format ID, so firstPartyNameToCanonical can handle it.
  // 返回 `firstPartyNameToCanonical(resolveOverriddenModel(fullModelName))`，作为共享工具这次计算的结果。
  return firstPartyNameToCanonical(resolveOverriddenModel(fullModelName))
}

// @[MODEL LAUNCH]: Update the default model description strings shown to users.
// getClaudeAiUserDefaultModelDescription 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeAiUserDefaultModelDescription(
  fastMode = false,
): string {
  // 只有 `isMaxSubscriber() || isTeamPremiumSubscriber()` 满足时，共享工具才执行该分支。
  if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
    // 满足 `isOpus1mMergeEnabled()` 时，共享工具执行该分支。
    if (isOpus1mMergeEnabled()) {
      // 返回 ``Opus 4.6 with 1M context · Most capable for complex work${fastMode ? g...`，作为共享工具这次计算的结果。
      return `Opus 4.6 with 1M context · Most capable for complex work${fastMode ? getOpus46PricingSuffix(true) : ''}`
    }
    // 返回 ``Opus 4.6 · Most capable for complex work${fastMode ? getOpus46PricingS...`，作为共享工具这次计算的结果。
    return `Opus 4.6 · Most capable for complex work${fastMode ? getOpus46PricingSuffix(true) : ''}`
  }
  // 返回 `'Sonnet 4.6 · Best for everyday tasks'`，作为共享工具这次计算的结果。
  return 'Sonnet 4.6 · Best for everyday tasks'
}

// renderDefaultModelSetting 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderDefaultModelSetting(
  setting: ModelName | ModelAlias,
): string {
  // 当 `setting` 匹配 `'opusplan'` 时，共享工具执行对应分支。
  if (setting === 'opusplan') {
    // 返回 `'Opus 4.6 in plan mode, else Sonnet 4.6'`，作为共享工具这次计算的结果。
    return 'Opus 4.6 in plan mode, else Sonnet 4.6'
  }
  // 返回 `renderModelName(parseUserSpecifiedModel(setting))`，作为共享工具这次计算的结果。
  return renderModelName(parseUserSpecifiedModel(setting))
}

// getOpus46PricingSuffix 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOpus46PricingSuffix(fastMode: boolean): string {
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') return ''
  // pricing格式化`formatModelPricing`，供共享工具后续处理使用。
  const pricing = formatModelPricing(getOpus46CostTier(fastMode))
  // fastModeIndicator保存`fastMode ? ` (${LIGHTNING_BOLT})` : ''`，供后续判断或组装使用。
  const fastModeIndicator = fastMode ? ` (${LIGHTNING_BOLT})` : ''
  // 返回 `` ·${fastModeIndicator} ${pricing}``，作为共享工具这次计算的结果。
  return ` ·${fastModeIndicator} ${pricing}`
}

// isOpus1mMergeEnabled 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOpus1mMergeEnabled(): boolean {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    is1mContextDisabled() ||
    isProSubscriber() ||
    getAPIProvider() !== 'firstParty'
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Fail closed when a subscriber's subscription type is unknown. The VS Code
  // config-loading subprocess can have OAuth tokens with valid scopes but no
  // subscriptionType field (stale or partial refresh). Without this guard,
  // isProSubscriber() returns false for such users and the merge leaks
  // opus[1m] into the model dropdown — the API then rejects it with a
  // misleading "rate limit reached" error.
  // 只有 `isClaudeAISubscriber() && getSubscriptionType() === null` 满足时，共享工具才执行该分支。
  if (isClaudeAISubscriber() && getSubscriptionType() === null) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// renderModelSetting 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderModelSetting(setting: ModelName | ModelAlias): string {
  // 当 `setting` 匹配 `'opusplan'` 时，共享工具执行对应分支。
  if (setting === 'opusplan') {
    // 返回 `'Opus Plan'`，作为共享工具这次计算的结果。
    return 'Opus Plan'
  }
  // 满足 `isModelAlias(setting)` 时，共享工具执行该分支。
  if (isModelAlias(setting)) {
    // 返回 `capitalize(setting)`，作为共享工具这次计算的结果。
    return capitalize(setting)
  }
  // 返回 `renderModelName(setting)`，作为共享工具这次计算的结果。
  return renderModelName(setting)
}

// @[MODEL LAUNCH]: Add display name cases for the new model (base + [1m] variant if applicable).
/**
 * Returns a human-readable display name for known public models, or null
 * if the model is not recognized as a public model.
 */
// getPublicModelDisplayName 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPublicModelDisplayName(model: ModelName): string | null {
  // 按照 model 的取值选择共享工具的具体处理分支。
  switch (model) {
    case getModelStrings().opus46:
      // 返回 `'Opus 4.6'`，作为共享工具这次计算的结果。
      return 'Opus 4.6'
    case getModelStrings().opus46 + '[1m]':
      // 返回 `'Opus 4.6 (1M context)'`，作为共享工具这次计算的结果。
      return 'Opus 4.6 (1M context)'
    case getModelStrings().opus45:
      // 返回 `'Opus 4.5'`，作为共享工具这次计算的结果。
      return 'Opus 4.5'
    case getModelStrings().opus41:
      // 返回 `'Opus 4.1'`，作为共享工具这次计算的结果。
      return 'Opus 4.1'
    case getModelStrings().opus40:
      // 返回 `'Opus 4'`，作为共享工具这次计算的结果。
      return 'Opus 4'
    case getModelStrings().sonnet46 + '[1m]':
      // 返回 `'Sonnet 4.6 (1M context)'`，作为共享工具这次计算的结果。
      return 'Sonnet 4.6 (1M context)'
    case getModelStrings().sonnet46:
      // 返回 `'Sonnet 4.6'`，作为共享工具这次计算的结果。
      return 'Sonnet 4.6'
    case getModelStrings().sonnet45 + '[1m]':
      // 返回 `'Sonnet 4.5 (1M context)'`，作为共享工具这次计算的结果。
      return 'Sonnet 4.5 (1M context)'
    case getModelStrings().sonnet45:
      // 返回 `'Sonnet 4.5'`，作为共享工具这次计算的结果。
      return 'Sonnet 4.5'
    case getModelStrings().sonnet40:
      // 返回 `'Sonnet 4'`，作为共享工具这次计算的结果。
      return 'Sonnet 4'
    case getModelStrings().sonnet40 + '[1m]':
      // 返回 `'Sonnet 4 (1M context)'`，作为共享工具这次计算的结果。
      return 'Sonnet 4 (1M context)'
    case getModelStrings().sonnet37:
      // 返回 `'Sonnet 3.7'`，作为共享工具这次计算的结果。
      return 'Sonnet 3.7'
    case getModelStrings().sonnet35:
      // 返回 `'Sonnet 3.5'`，作为共享工具这次计算的结果。
      return 'Sonnet 3.5'
    case getModelStrings().haiku45:
      // 返回 `'Haiku 4.5'`，作为共享工具这次计算的结果。
      return 'Haiku 4.5'
    case getModelStrings().haiku35:
      // 返回 `'Haiku 3.5'`，作为共享工具这次计算的结果。
      return 'Haiku 3.5'
    default:
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}

// maskModelCodename 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maskModelCodename(baseName: string): string {
  // Mask only the first dash-separated segment (the codename), preserve the rest
  // e.g. capybara-v2-fast → cap*****-v2-fast
  // 从 `baseName.split('-')` 按位置拆出 codename = ''、其余 rest，让模型工具 model分别处理这些返回值。
  const [codename = '', ...rest] = baseName.split('-')
  // masked 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const masked =
    codename.slice(0, 3) + '*'.repeat(Math.max(0, codename.length - 3))
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [masked, ...rest].join('-')
}

// renderModelName 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderModelName(model: ModelName): string {
  // publicName读取`getPublicModelDisplayName`，供共享工具后续处理使用。
  const publicName = getPublicModelDisplayName(model)
  // 满足 `publicName` 时，共享工具执行该分支。
  if (publicName) {
    // 返回 `publicName`，作为共享工具这次计算的结果。
    return publicName
  }
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // resolved解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
    const resolved = parseUserSpecifiedModel(model)
    // antModel读取`resolveAntModel`，供共享工具后续处理使用。
    const antModel = resolveAntModel(model)
    // 满足 `antModel` 时，共享工具执行该分支。
    if (antModel) {
      // baseName格式化`model.replace`，供共享工具后续处理使用。
      const baseName = antModel.model.replace(/\[1m\]$/i, '')
      // masked保存`maskModelCodename`，供共享工具后续处理使用。
      const masked = maskModelCodename(baseName)
      // suffix保存`has1mContext`，供共享工具后续处理使用。
      const suffix = has1mContext(resolved) ? '[1m]' : ''
      // 返回 `masked + suffix`，作为共享工具这次计算的结果。
      return masked + suffix
    }
    // `resolved` 与 `model` 不一致时刷新派生状态，避免使用过期结果。
    if (resolved !== model) {
      // 返回 ``${model} (${resolved})``，作为共享工具这次计算的结果。
      return `${model} (${resolved})`
    }
    // 返回 `resolved`，作为共享工具这次计算的结果。
    return resolved
  }
  // 返回 `model`，作为共享工具这次计算的结果。
  return model
}

/**
 * Returns a safe author name for public display (e.g., in git commit trailers).
 * Returns "Claude {ModelName}" for publicly known models, or "Claude ({model})"
 * for unknown/internal models so the exact model name is preserved.
 *
 * @param model The full model name
 * @returns "Claude {ModelName}" for public models, or "Claude ({model})" for non-public models
 */
// getPublicModelName 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPublicModelName(model: ModelName): string {
  // publicName读取`getPublicModelDisplayName`，供共享工具后续处理使用。
  const publicName = getPublicModelDisplayName(model)
  // 满足 `publicName` 时，共享工具执行该分支。
  if (publicName) {
    // 返回 ``Claude ${publicName}``，作为共享工具这次计算的结果。
    return `Claude ${publicName}`
  }
  // 返回 ``Claude (${model})``，作为共享工具这次计算的结果。
  return `Claude (${model})`
}

/**
 * Returns a full model name for use in this session, possibly after resolving
 * a model alias.
 *
 * This function intentionally does not support version numbers to align with
 * the model switcher.
 *
 * Supports [1m] suffix on any model alias (e.g., haiku[1m], sonnet[1m]) to enable
 * 1M context window without requiring each variant to be in MODEL_ALIASES.
 *
 * @param modelInput The model alias or name provided by the user.
 */
// parseUserSpecifiedModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseUserSpecifiedModel(
  modelInput: ModelName | ModelAlias,
): ModelName {
  // modelInputTrimmed格式化`modelInput.trim`，供共享工具后续处理使用。
  const modelInputTrimmed = modelInput.trim()
  // normalizedModel保存`modelInputTrimmed.toLowerCase`，供共享工具后续处理使用。
  const normalizedModel = modelInputTrimmed.toLowerCase()

  // has1mTag保存`has1mContext`，供共享工具后续处理使用。
  const has1mTag = has1mContext(normalizedModel)
  // modelString保存`has1mTag`，供后续判断或组装使用。
  const modelString = has1mTag
    ? normalizedModel.replace(/\[1m]$/i, '').trim()
    : normalizedModel

  // 满足 `isModelAlias(modelString)` 时，共享工具执行该分支。
  if (isModelAlias(modelString)) {
    // 按照 modelString 的取值选择共享工具的具体处理分支。
    switch (modelString) {
      case 'opusplan':
        // 返回 `getDefaultSonnetModel() + (has1mTag ? '[1m]' : '') // Sonnet is default...`，作为共享工具这次计算的结果。
        return getDefaultSonnetModel() + (has1mTag ? '[1m]' : '') // Sonnet is default, Opus in plan mode
      case 'sonnet':
        // 返回 `getDefaultSonnetModel() + (has1mTag ? '[1m]' : '')`，作为共享工具这次计算的结果。
        return getDefaultSonnetModel() + (has1mTag ? '[1m]' : '')
      case 'haiku':
        // 返回 `getDefaultHaikuModel() + (has1mTag ? '[1m]' : '')`，作为共享工具这次计算的结果。
        return getDefaultHaikuModel() + (has1mTag ? '[1m]' : '')
      case 'opus':
        // 返回 `getDefaultOpusModel() + (has1mTag ? '[1m]' : '')`，作为共享工具这次计算的结果。
        return getDefaultOpusModel() + (has1mTag ? '[1m]' : '')
      case 'best':
        // 返回 `getBestModel()`，作为共享工具这次计算的结果。
        return getBestModel()
      default:
    }
  }

  // Opus 4/4.1 are no longer available on the first-party API (same as
  // Claude.ai) — silently remap to the current Opus default. The 'opus'
  // alias already resolves to 4.6, so the only users on these explicit
  // strings pinned them in settings/env/--model/SDK before 4.5 launched.
  // 3P providers may not yet have 4.6 capacity, so pass through unchanged.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getAPIProvider() === 'firstParty' &&
    isLegacyOpusFirstParty(modelString) &&
    isLegacyModelRemapEnabled()
  ) {
    // 返回 `getDefaultOpusModel() + (has1mTag ? '[1m]' : '')`，作为共享工具这次计算的结果。
    return getDefaultOpusModel() + (has1mTag ? '[1m]' : '')
  }

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // has1mAntTag保存`has1mContext`，供共享工具后续处理使用。
    const has1mAntTag = has1mContext(normalizedModel)
    // baseAntModel格式化`normalizedModel.replace`，供共享工具后续处理使用。
    const baseAntModel = normalizedModel.replace(/\[1m]$/i, '').trim()

    // antModel读取`resolveAntModel`，供共享工具后续处理使用。
    const antModel = resolveAntModel(baseAntModel)
    // 满足 `antModel` 时，共享工具执行该分支。
    if (antModel) {
      // suffix保存`has1mAntTag ? '[1m]' : ''`，供共享工具模型工具 model后续判断或输出使用。
      const suffix = has1mAntTag ? '[1m]' : ''
      // 返回 `antModel.model + suffix`，作为共享工具这次计算的结果。
      return antModel.model + suffix
    }

    // Fall through to the alias string if we cannot load the config. The API calls
    // will fail with this string, but we should hear about it through feedback and
    // can tell the user to restart/wait for flag cache refresh to get the latest values.
  }

  // Preserve original case for custom model names (e.g., Azure Foundry deployment IDs)
  // Only strip [1m] suffix if present, maintaining case of the base model
  // 满足 `has1mTag` 时，共享工具执行该分支。
  if (has1mTag) {
    // 返回 `modelInputTrimmed.replace(/\[1m\]$/i, '').trim() + '[1m]'`，作为共享工具这次计算的结果。
    return modelInputTrimmed.replace(/\[1m\]$/i, '').trim() + '[1m]'
  }
  // 返回 `modelInputTrimmed`，作为共享工具这次计算的结果。
  return modelInputTrimmed
}

/**
 * Resolves a skill's `model:` frontmatter against the current model, carrying
 * the `[1m]` suffix over when the target family supports it.
 *
 * A skill author writing `model: opus` means "use opus-class reasoning" — not
 * "downgrade to 200K". If the user is on opus[1m] at 230K tokens and invokes a
 * skill with `model: opus`, passing the bare alias through drops the effective
 * context window from 1M to 200K, which trips autocompact at 23% apparent usage
 * and surfaces "Context limit reached" even though nothing overflowed.
 *
 * We only carry [1m] when the target actually supports it (sonnet/opus). A skill
 * with `model: haiku` on a 1M session still downgrades — haiku has no 1M variant,
 * so the autocompact that follows is correct. Skills that already specify [1m]
 * are left untouched.
 */
// resolveSkillModelOverride 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveSkillModelOverride(
  skillModel: string,
  currentModel: string,
): string {
  // 只有 `has1mContext(skillModel) || !has1mContext(currentModel)` 满足时，共享工具才执行该分支。
  if (has1mContext(skillModel) || !has1mContext(currentModel)) {
    // 返回 `skillModel`，作为共享工具这次计算的结果。
    return skillModel
  }
  // modelSupports1M matches on canonical IDs ('claude-opus-4-6', 'claude-sonnet-4');
  // a bare 'opus' alias falls through getCanonicalName unmatched. Resolve first.
  // 满足 `modelSupports1M(parseUserSpecifiedModel(skillModel))` 时，共享工具执行该分支。
  if (modelSupports1M(parseUserSpecifiedModel(skillModel))) {
    // 返回 `skillModel + '[1m]'`，作为共享工具这次计算的结果。
    return skillModel + '[1m]'
  }
  // 返回 `skillModel`，作为共享工具这次计算的结果。
  return skillModel
}

// LEGACY_OPUS_FIRSTPARTY 聚合成有序列表，保持后续遍历顺序稳定。
const LEGACY_OPUS_FIRSTPARTY = [
  'claude-opus-4-20250514',
  'claude-opus-4-1-20250805',
  'claude-opus-4-0',
  'claude-opus-4-1',
]

// isLegacyOpusFirstParty 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLegacyOpusFirstParty(model: string): boolean {
  // 返回 `LEGACY_OPUS_FIRSTPARTY.includes(model)`，作为共享工具这次计算的结果。
  return LEGACY_OPUS_FIRSTPARTY.includes(model)
}

/**
 * Opt-out for the legacy Opus 4.0/4.1 → current Opus remap.
 */
// isLegacyModelRemapEnabled 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLegacyModelRemapEnabled(): boolean {
  // 返回 `!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP)`，作为共享工具这次计算的结果。
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP)
}

// modelDisplayString 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelDisplayString(model: ModelSetting): string {
  // 满足 `model === null` 时，共享工具执行该分支。
  if (model === null) {
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 返回 ``Default for Ants (${renderDefaultModelSetting(getDefaultMainLoopModelS...`，作为共享工具这次计算的结果。
      return `Default for Ants (${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})`
    // 模型工具 model在这里处理 `} else if (isClaudeAISubscriber()) {`，完成这一小步状态转换。
    } else if (isClaudeAISubscriber()) {
      // 返回 ``Default (${getClaudeAiUserDefaultModelDescription()})``，作为共享工具这次计算的结果。
      return `Default (${getClaudeAiUserDefaultModelDescription()})`
    }
    // 返回 ``Default (${getDefaultMainLoopModel()})``，作为共享工具这次计算的结果。
    return `Default (${getDefaultMainLoopModel()})`
  }
  // resolvedModel解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
  const resolvedModel = parseUserSpecifiedModel(model)
  // 返回 `model === resolvedModel ? resolvedModel : `${model} (${resolvedModel})``，作为共享工具这次计算的结果。
  return model === resolvedModel ? resolvedModel : `${model} (${resolvedModel})`
}

// @[MODEL LAUNCH]: Add a marketing name mapping for the new model below.
// getMarketingNameForModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMarketingNameForModel(modelId: string): string | undefined {
  // 当 `getAPIProvider()` 匹配 `'foundry'` 时，共享工具执行对应分支。
  if (getAPIProvider() === 'foundry') {
    // deployment ID is user-defined in Foundry, so it may have no relation to the actual model
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // has1m保存`modelId.toLowerCase`，供共享工具后续处理使用。
  const has1m = modelId.toLowerCase().includes('[1m]')
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(modelId)

  // 满足 `canonical.includes('claude-opus-4-6')` 时，共享工具执行该分支。
  if (canonical.includes('claude-opus-4-6')) {
    // 返回 `has1m ? 'Opus 4.6 (with 1M context)' : 'Opus 4.6'`，作为共享工具这次计算的结果。
    return has1m ? 'Opus 4.6 (with 1M context)' : 'Opus 4.6'
  }
  // 满足 `canonical.includes('claude-opus-4-5')` 时，共享工具执行该分支。
  if (canonical.includes('claude-opus-4-5')) {
    // 返回 `'Opus 4.5'`，作为共享工具这次计算的结果。
    return 'Opus 4.5'
  }
  // 满足 `canonical.includes('claude-opus-4-1')` 时，共享工具执行该分支。
  if (canonical.includes('claude-opus-4-1')) {
    // 返回 `'Opus 4.1'`，作为共享工具这次计算的结果。
    return 'Opus 4.1'
  }
  // 满足 `canonical.includes('claude-opus-4')` 时，共享工具执行该分支。
  if (canonical.includes('claude-opus-4')) {
    // 返回 `'Opus 4'`，作为共享工具这次计算的结果。
    return 'Opus 4'
  }
  // 满足 `canonical.includes('claude-sonnet-4-6')` 时，共享工具执行该分支。
  if (canonical.includes('claude-sonnet-4-6')) {
    // 返回 `has1m ? 'Sonnet 4.6 (with 1M context)' : 'Sonnet 4.6'`，作为共享工具这次计算的结果。
    return has1m ? 'Sonnet 4.6 (with 1M context)' : 'Sonnet 4.6'
  }
  // 满足 `canonical.includes('claude-sonnet-4-5')` 时，共享工具执行该分支。
  if (canonical.includes('claude-sonnet-4-5')) {
    // 返回 `has1m ? 'Sonnet 4.5 (with 1M context)' : 'Sonnet 4.5'`，作为共享工具这次计算的结果。
    return has1m ? 'Sonnet 4.5 (with 1M context)' : 'Sonnet 4.5'
  }
  // 满足 `canonical.includes('claude-sonnet-4')` 时，共享工具执行该分支。
  if (canonical.includes('claude-sonnet-4')) {
    // 返回 `has1m ? 'Sonnet 4 (with 1M context)' : 'Sonnet 4'`，作为共享工具这次计算的结果。
    return has1m ? 'Sonnet 4 (with 1M context)' : 'Sonnet 4'
  }
  // 满足 `canonical.includes('claude-3-7-sonnet')` 时，共享工具执行该分支。
  if (canonical.includes('claude-3-7-sonnet')) {
    // 返回 `'Claude 3.7 Sonnet'`，作为共享工具这次计算的结果。
    return 'Claude 3.7 Sonnet'
  }
  // 满足 `canonical.includes('claude-3-5-sonnet')` 时，共享工具执行该分支。
  if (canonical.includes('claude-3-5-sonnet')) {
    // 返回 `'Claude 3.5 Sonnet'`，作为共享工具这次计算的结果。
    return 'Claude 3.5 Sonnet'
  }
  // 满足 `canonical.includes('claude-haiku-4-5')` 时，共享工具执行该分支。
  if (canonical.includes('claude-haiku-4-5')) {
    // 返回 `'Haiku 4.5'`，作为共享工具这次计算的结果。
    return 'Haiku 4.5'
  }
  // 满足 `canonical.includes('claude-3-5-haiku')` 时，共享工具执行该分支。
  if (canonical.includes('claude-3-5-haiku')) {
    // 返回 `'Claude 3.5 Haiku'`，作为共享工具这次计算的结果。
    return 'Claude 3.5 Haiku'
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// normalizeModelStringForAPI 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeModelStringForAPI(model: string): string {
  // 返回 `model.replace(/\[(1|2)m\]/gi, '')`，作为共享工具这次计算的结果。
  return model.replace(/\[(1|2)m\]/gi, '')
}
