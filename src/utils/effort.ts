// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 isUltrathinkEnabled，将 ./thinking.js 中已经封装好的能力接到本文件流程里。
import { isUltrathinkEnabled } from './thinking.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'
// 引入 isProSubscriber、isMaxSubscriber、isTeamSubscriber，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { isProSubscriber, isMaxSubscriber, isTeamSubscriber } from './auth.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 引入 getAPIProvider，将 ./model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './model/providers.js'
// 引入 get3PModelCapabilityOverride，将 ./model/modelSupportOverrides.js 中已经封装好的能力接到本文件流程里。
import { get3PModelCapabilityOverride } from './model/modelSupportOverrides.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 类型依赖 { EffortLevel } 来自 src/entrypoints/sdk/runtimeTypes.js，用于校准共享工具的数据契约。
import type { EffortLevel } from 'src/entrypoints/sdk/runtimeTypes.js'

// 导出类型定义，让其他模块沿用共享工具 effort的数据契约。
export type { EffortLevel }

// EFFORT_LEVELS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const EFFORT_LEVELS = [
  'low',
  'medium',
  'high',
  'max',
] as const satisfies readonly EffortLevel[]

// EffortValue 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EffortValue = EffortLevel | number

// @[MODEL LAUNCH]: Add the new model to the allowlist if it supports the effort parameter.
// modelSupportsEffort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsEffort(model: string): boolean {
  // m保存`model.toLowerCase`，供共享工具后续处理使用。
  const m = model.toLowerCase()
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_ALWAYS_ENABLE_EFFORT)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // supported3P读取`get3PModelCapabilityOverride`，供共享工具后续处理使用。
  const supported3P = get3PModelCapabilityOverride(model, 'effort')
  // `supported3P` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (supported3P !== undefined) {
    // 返回 `supported3P`，作为共享工具这次计算的结果。
    return supported3P
  }
  // Supported by a subset of Claude 4 models
  // 只有 `m.includes('opus-4-6') || m.includes('sonnet-4-6')` 满足时，共享工具才执行该分支。
  if (m.includes('opus-4-6') || m.includes('sonnet-4-6')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Exclude any other known legacy models (haiku, older opus/sonnet variants)
  // 只有 `m.includes('haiku') || m.includes('sonnet') || m.includes('opus')` 满足时，共享工具才执行该分支。
  if (m.includes('haiku') || m.includes('sonnet') || m.includes('opus')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // IMPORTANT: Do not change the default effort support without notifying
  // the model launch DRI and research. This is a sensitive setting that can
  // greatly affect model quality and bashing.

  // Default to true for unknown model strings on 1P.
  // Do not default to true for 3P as they have different formats for their
  // model strings (ex. anthropics/claude-code#30795)
  // 返回 `getAPIProvider() === 'firstParty'`，作为共享工具这次计算的结果。
  return getAPIProvider() === 'firstParty'
}

// @[MODEL LAUNCH]: Add the new model to the allowlist if it supports 'max' effort.
// Per API docs, 'max' is Opus 4.6 only for public models — other models return an error.
// modelSupportsMaxEffort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsMaxEffort(model: string): boolean {
  // supported3P读取`get3PModelCapabilityOverride`，供共享工具后续处理使用。
  const supported3P = get3PModelCapabilityOverride(model, 'max_effort')
  // `supported3P` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (supported3P !== undefined) {
    // 返回 `supported3P`，作为共享工具这次计算的结果。
    return supported3P
  }
  // 满足 `model.toLowerCase().includes('opus-4-6')` 时，共享工具执行该分支。
  if (model.toLowerCase().includes('opus-4-6')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 只有 `process.env.USER_TYPE === 'ant' && resolveAntModel(model)` 满足时，共享工具才执行该分支。
  if (process.env.USER_TYPE === 'ant' && resolveAntModel(model)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isEffortLevel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEffortLevel(value: string): value is EffortLevel {
  // 返回 `(EFFORT_LEVELS as readonly string[]).includes(value)`，作为共享工具这次计算的结果。
  return (EFFORT_LEVELS as readonly string[]).includes(value)
}

// parseEffortValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseEffortValue(value: unknown): EffortValue | undefined {
  // 只有 `value === undefined || value === null || value ==` 满足时，共享工具才执行该分支。
  if (value === undefined || value === null || value === '') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 只有 `typeof value === 'number' && isValidNumericEffort(value)` 满足时，共享工具才执行该分支。
  if (typeof value === 'number' && isValidNumericEffort(value)) {
    // 返回 `value`，作为共享工具这次计算的结果。
    return value
  }
  // str保存`String`，供共享工具后续处理使用。
  const str = String(value).toLowerCase()
  // 满足 `isEffortLevel(str)` 时，共享工具执行该分支。
  if (isEffortLevel(str)) {
    // 返回 `str`，作为共享工具这次计算的结果。
    return str
  }
  // numericValue解析`parseInt`，供共享工具后续处理使用。
  const numericValue = parseInt(str, 10)
  // 只有 `!isNaN(numericValue) && isValidNumericEffort(numericValue)` 满足时，共享工具才执行该分支。
  if (!isNaN(numericValue) && isValidNumericEffort(numericValue)) {
    // 返回 `numericValue`，作为共享工具这次计算的结果。
    return numericValue
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Numeric values are model-default only and not persisted.
 * 'max' is session-scoped for external users (ants can persist it).
 * Write sites call this before saving to settings so the Zod schema
 * (which only accepts string levels) never rejects a write.
 */
// toPersistableEffort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toPersistableEffort(
  value: EffortValue | undefined,
): EffortLevel | undefined {
  // 只有 `value === 'low' || value === 'medium' || value ==` 满足时，共享工具才执行该分支。
  if (value === 'low' || value === 'medium' || value === 'high') {
    // 返回 `value`，作为共享工具这次计算的结果。
    return value
  }
  // 当 `value` 匹配 `'max' && process.env.USER_T...` 时，共享工具执行对应分支。
  if (value === 'max' && process.env.USER_TYPE === 'ant') {
    // 返回 `value`，作为共享工具这次计算的结果。
    return value
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// getInitialEffortSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitialEffortSetting(): EffortLevel | undefined {
  // toPersistableEffort filters 'max' for non-ants on read, so a manually
  // edited settings.json doesn't leak session-scoped max into a fresh session.
  // 返回 `toPersistableEffort(getInitialSettings().effortLevel)`，作为共享工具这次计算的结果。
  return toPersistableEffort(getInitialSettings().effortLevel)
}

/**
 * Decide what effort level (if any) to persist when the user selects a model
 * in ModelPicker. Keeps an explicit prior /effort choice sticky even when it
 * matches the picked model's default, while letting purely-default and
 * session-ephemeral effort (CLI --effort, EffortCallout default) fall through
 * to undefined so it follows future model-default changes.
 *
 * priorPersisted must come from userSettings on disk
 * (getSettingsForSource('userSettings')?.effortLevel), NOT merged settings
 * (project/policy layers would leak into the user's global settings.json)
 * and NOT AppState.effortValue (includes session-scoped sources that
 * deliberately do not write to settings.json).
 */
// resolvePickerEffortPersistence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolvePickerEffortPersistence(
  picked: EffortLevel | undefined,
  modelDefault: EffortLevel,
  priorPersisted: EffortLevel | undefined,
  toggledInPicker: boolean,
): EffortLevel | undefined {
  // hadExplicit标记共享工具 effort是否启用对应路径。
  const hadExplicit = priorPersisted !== undefined || toggledInPicker
  // 返回 `hadExplicit || picked !== modelDefault ? picked : undefined`，作为共享工具这次计算的结果。
  return hadExplicit || picked !== modelDefault ? picked : undefined
}

// getEffortEnvOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffortEnvOverride(): EffortValue | null | undefined {
  // envOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envOverride = process.env.CLAUDE_CODE_EFFORT_LEVEL
  // 返回 `envOverride?.toLowerCase() === 'unset' ||`，作为共享工具这次计算的结果。
  return envOverride?.toLowerCase() === 'unset' ||
    envOverride?.toLowerCase() === 'auto'
    ? null
    : parseEffortValue(envOverride)
}

/**
 * Resolve the effort value that will actually be sent to the API for a given
 * model, following the full precedence chain:
 *   env CLAUDE_CODE_EFFORT_LEVEL → appState.effortValue → model default
 *
 * Returns undefined when no effort parameter should be sent (env set to
 * 'unset', or no default exists for the model).
 */
// resolveAppliedEffort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveAppliedEffort(
  model: string,
  appStateEffortValue: EffortValue | undefined,
): EffortValue | undefined {
  // envOverride读取`getEffortEnvOverride`，供共享工具后续处理使用。
  const envOverride = getEffortEnvOverride()
  // 满足 `envOverride === null` 时，共享工具执行该分支。
  if (envOverride === null) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // resolved 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const resolved =
    envOverride ?? appStateEffortValue ?? getDefaultEffortForModel(model)
  // API rejects 'max' on non-Opus-4.6 models — downgrade to 'high'.
  // 只有 `resolved === 'max' && !modelSupportsMaxEffort(model)` 满足时，共享工具才执行该分支。
  if (resolved === 'max' && !modelSupportsMaxEffort(model)) {
    // 返回 `'high'`，作为共享工具这次计算的结果。
    return 'high'
  }
  // 返回 `resolved`，作为共享工具这次计算的结果。
  return resolved
}

/**
 * Resolve the effort level to show the user. Wraps resolveAppliedEffort
 * with the 'high' fallback (what the API uses when no effort param is sent).
 * Single source of truth for the status bar and /effort output (CC-1088).
 */
// getDisplayedEffortLevel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDisplayedEffortLevel(
  model: string,
  appStateEffort: EffortValue | undefined,
): EffortLevel {
  // resolved读取`resolveAppliedEffort`，供共享工具后续处理使用。
  const resolved = resolveAppliedEffort(model, appStateEffort) ?? 'high'
  // 返回 `convertEffortValueToLevel(resolved)`，作为共享工具这次计算的结果。
  return convertEffortValueToLevel(resolved)
}

/**
 * Build the ` with {level} effort` suffix shown in Logo/Spinner.
 * Returns empty string if the user hasn't explicitly set an effort value.
 * Delegates to resolveAppliedEffort() so the displayed level matches what
 * the API actually receives (including max→high clamp for non-Opus models).
 */
// getEffortSuffix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffortSuffix(
  model: string,
  effortValue: EffortValue | undefined,
): string {
  // 满足 `effortValue === undefined` 时，共享工具执行该分支。
  if (effortValue === undefined) return ''
  // resolved读取`resolveAppliedEffort`，供共享工具后续处理使用。
  const resolved = resolveAppliedEffort(model, effortValue)
  // 满足 `resolved === undefined` 时，共享工具执行该分支。
  if (resolved === undefined) return ''
  // 返回 `` with ${convertEffortValueToLevel(resolved)} effort``，作为共享工具这次计算的结果。
  return ` with ${convertEffortValueToLevel(resolved)} effort`
}

// isValidNumericEffort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidNumericEffort(value: number): boolean {
  // 返回 `Number.isInteger(value)`，作为共享工具这次计算的结果。
  return Number.isInteger(value)
}

// convertEffortValueToLevel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function convertEffortValueToLevel(value: EffortValue): EffortLevel {
  // 当 `typeof value` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof value === 'string') {
    // Runtime guard: value may come from remote config (GrowthBook) where
    // TypeScript types can't help us. Coerce unknown strings to 'high'
    // rather than passing them through unchecked.
    // 返回 `isEffortLevel(value) ? value : 'high'`，作为共享工具这次计算的结果。
    return isEffortLevel(value) ? value : 'high'
  }
  // 只有 `process.env.USER_TYPE === 'ant' && typeof value =` 满足时，共享工具才执行该分支。
  if (process.env.USER_TYPE === 'ant' && typeof value === 'number') {
    // 满足 `value <= 50` 时，共享工具执行该分支。
    if (value <= 50) return 'low'
    // 满足 `value <= 85` 时，共享工具执行该分支。
    if (value <= 85) return 'medium'
    // 满足 `value <= 100` 时，共享工具执行该分支。
    if (value <= 100) return 'high'
    // 返回 `'max'`，作为共享工具这次计算的结果。
    return 'max'
  }
  // 返回 `'high'`，作为共享工具这次计算的结果。
  return 'high'
}

/**
 * Get user-facing description for effort levels
 *
 * @param level The effort level to describe
 * @returns Human-readable description
 */
// getEffortLevelDescription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffortLevelDescription(level: EffortLevel): string {
  // 按照 level 的取值选择共享工具的具体处理分支。
  switch (level) {
    case 'low':
      // 返回 `'Quick, straightforward implementation with minimal overhead'`，作为共享工具这次计算的结果。
      return 'Quick, straightforward implementation with minimal overhead'
    case 'medium':
      // 返回 `'Balanced approach with standard implementation and testing'`，作为共享工具这次计算的结果。
      return 'Balanced approach with standard implementation and testing'
    case 'high':
      // 返回 `'Comprehensive implementation with extensive testing and documentation'`，作为共享工具这次计算的结果。
      return 'Comprehensive implementation with extensive testing and documentation'
    case 'max':
      // 返回 `'Maximum capability with deepest reasoning (Opus 4.6 only)'`，作为共享工具这次计算的结果。
      return 'Maximum capability with deepest reasoning (Opus 4.6 only)'
  }
}

/**
 * Get user-facing description for effort values (both string and numeric)
 *
 * @param value The effort value to describe
 * @returns Human-readable description
 */
// getEffortValueDescription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffortValueDescription(value: EffortValue): string {
  // 只有 `process.env.USER_TYPE === 'ant' && typeof value =` 满足时，共享工具才执行该分支。
  if (process.env.USER_TYPE === 'ant' && typeof value === 'number') {
    // 返回 ``[ANT-ONLY] Numeric effort value of ${value}``，作为共享工具这次计算的结果。
    return `[ANT-ONLY] Numeric effort value of ${value}`
  }

  // 当 `typeof value` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof value === 'string') {
    // 返回 `getEffortLevelDescription(value)`，作为共享工具这次计算的结果。
    return getEffortLevelDescription(value)
  }
  // 返回 `'Balanced approach with standard implementation and testing'`，作为共享工具这次计算的结果。
  return 'Balanced approach with standard implementation and testing'
}

// OpusDefaultEffortConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OpusDefaultEffortConfig = {
  enabled: boolean
  dialogTitle: string
  dialogDescription: string
}

// OPUS_DEFAULT_EFFORT_CONFIG_DEFAULT 配置 集中保存共享工具 effort要一起传递的字段。
const OPUS_DEFAULT_EFFORT_CONFIG_DEFAULT: OpusDefaultEffortConfig = {
  enabled: true,
  dialogTitle: 'We recommend medium effort for Opus',
  dialogDescription:
    'Effort determines how long Claude thinks for when completing your task. We recommend medium effort for most tasks to balance speed and intelligence and maximize rate limits. Use ultrathink to trigger high effort when needed.',
}

// getOpusDefaultEffortConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOpusDefaultEffortConfig(): OpusDefaultEffortConfig {
  // 配置读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
  const config = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_grey_step2',
    OPUS_DEFAULT_EFFORT_CONFIG_DEFAULT,
  )
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...OPUS_DEFAULT_EFFORT_CONFIG_DEFAULT,
    ...config,
  }
}

// @[MODEL LAUNCH]: Update the default effort levels for new models
// getDefaultEffortForModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultEffortForModel(
  model: string,
): EffortValue | undefined {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 配置读取`getAntModelOverrideConfig`，供共享工具后续处理使用。
    const config = getAntModelOverrideConfig()
    // isDefaultModel 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isDefaultModel =
      config?.defaultModel !== undefined &&
      model.toLowerCase() === config.defaultModel.toLowerCase()
    // 只有 `isDefaultModel && config?.defaultModelEffortLevel` 满足时，共享工具才执行该分支。
    if (isDefaultModel && config?.defaultModelEffortLevel) {
      // 返回 `config.defaultModelEffortLevel`，作为共享工具这次计算的结果。
      return config.defaultModelEffortLevel
    }
    // antModel读取`resolveAntModel`，供共享工具后续处理使用。
    const antModel = resolveAntModel(model)
    // 满足 `antModel` 时，共享工具执行该分支。
    if (antModel) {
      // 满足 `antModel.defaultEffortLevel` 时，共享工具执行该分支。
      if (antModel.defaultEffortLevel) {
        // 返回 `antModel.defaultEffortLevel`，作为共享工具这次计算的结果。
        return antModel.defaultEffortLevel
      }
      // `antModel.defaultEffortValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (antModel.defaultEffortValue !== undefined) {
        // 返回 `antModel.defaultEffortValue`，作为共享工具这次计算的结果。
        return antModel.defaultEffortValue
      }
    }
    // Always default ants to undefined/high
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // IMPORTANT: Do not change the default effort level without notifying
  // the model launch DRI and research. Default effort is a sensitive setting
  // that can greatly affect model quality and bashing.

  // Default effort on Opus 4.6 to medium for Pro.
  // Max/Team also get medium when the tengu_grey_step2 config is enabled.
  // 满足 `model.toLowerCase().includes('opus-4-6')` 时，共享工具执行该分支。
  if (model.toLowerCase().includes('opus-4-6')) {
    // 满足 `isProSubscriber()` 时，共享工具执行该分支。
    if (isProSubscriber()) {
      // 返回 `'medium'`，作为共享工具这次计算的结果。
      return 'medium'
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      getOpusDefaultEffortConfig().enabled &&
      (isMaxSubscriber() || isTeamSubscriber())
    ) {
      // 返回 `'medium'`，作为共享工具这次计算的结果。
      return 'medium'
    }
  }

  // When ultrathink feature is on, default effort to medium (ultrathink bumps to high)
  // 只有 `isUltrathinkEnabled() && modelSupportsEffort(model)` 满足时，共享工具才执行该分支。
  if (isUltrathinkEnabled() && modelSupportsEffort(model)) {
    // 返回 `'medium'`，作为共享工具这次计算的结果。
    return 'medium'
  }

  // Fallback to undefined, which means we don't set an effort level. This
  // should resolve to high effort level in the API.
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}
