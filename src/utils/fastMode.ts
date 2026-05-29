// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig、OAUTH_BETA_HEADER，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig, OAUTH_BETA_HEADER } from 'src/constants/oauth.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getKairosActive,
  preferThirdPartyAuthentication,
} from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKey,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
  hasProfileScope,
} from './auth.js'
// 引入 isInBundledMode，将 ./bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from './bundledMode.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModelSetting,
  isOpus1mMergeEnabled,
  type ModelSetting,
  parseUserSpecifiedModel,
} from './model/model.js'
// 引入 getAPIProvider，将 ./model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './model/providers.js'
// 引入 isEssentialTrafficOnly，将 ./privacyLevel.js 中已经封装好的能力接到本文件流程里。
import { isEssentialTrafficOnly } from './privacyLevel.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettingsForSource,
  updateSettingsForSource,
} from './settings/settings.js'
// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// isFastModeEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFastModeEnabled(): boolean {
  // 返回 `!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FAST_MODE)`，作为共享工具这次计算的结果。
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FAST_MODE)
}

// isFastModeAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFastModeAvailable(): boolean {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getFastModeUnavailableReason() === null`，作为共享工具这次计算的结果。
  return getFastModeUnavailableReason() === null
}

// AuthType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AuthType = 'oauth' | 'api-key'

// getDisabledReasonMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDisabledReasonMessage(
  disabledReason: FastModeDisabledReason,
  authType: AuthType,
): string {
  // 按照 disabledReason 的取值选择共享工具的具体处理分支。
  switch (disabledReason) {
    case 'free':
      // 返回 `authType === 'oauth'`，作为共享工具这次计算的结果。
      return authType === 'oauth'
        ? 'Fast mode requires a paid subscription'
        : 'Fast mode unavailable during evaluation. Please purchase credits.'
    case 'preference':
      // 返回 `'Fast mode has been disabled by your organization'`，作为共享工具这次计算的结果。
      return 'Fast mode has been disabled by your organization'
    case 'extra_usage_disabled':
      // Only OAuth users can have extra_usage_disabled; console users don't have this concept
      // 返回 `'Fast mode requires extra usage billing · /extra-usage to enable'`，作为共享工具这次计算的结果。
      return 'Fast mode requires extra usage billing · /extra-usage to enable'
    case 'network_error':
      // 返回 `'Fast mode unavailable due to network connectivity issues'`，作为共享工具这次计算的结果。
      return 'Fast mode unavailable due to network connectivity issues'
    case 'unknown':
      // 返回 `'Fast mode is currently unavailable'`，作为共享工具这次计算的结果。
      return 'Fast mode is currently unavailable'
  }
}

// getFastModeUnavailableReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastModeUnavailableReason(): string | null {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 返回 `'Fast mode is not available'`，作为共享工具这次计算的结果。
    return 'Fast mode is not available'
  }

  // statigReason读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
  const statigReason = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_penguins_off',
    null,
  )
  // Statsig reason has priority over other reasons.
  // `statigReason` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (statigReason !== null) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Fast mode unavailable: ${statigReason}`)
    // 返回 `statigReason`，作为共享工具这次计算的结果。
    return statigReason
  }

  // Previously, fast mode required the native binary (bun build). This is no
  // longer necessary, but we keep this option behind a flag just in case.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !isInBundledMode() &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_marble_sandcastle', false)
  ) {
    // 返回 `'Fast mode requires the native binary · Install from: https://claude.co...`，作为共享工具这次计算的结果。
    return 'Fast mode requires the native binary · Install from: https://claude.com/product/claude-code'
  }

  // Not available in the SDK unless explicitly opted in via --settings.
  // Assistant daemon mode is exempt — it's first-party orchestration, and
  // kairosActive is set before this check runs (main.tsx:~1626 vs ~3249).
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getIsNonInteractiveSession() &&
    preferThirdPartyAuthentication() &&
    !getKairosActive()
  ) {
    // flagFastMode读取`getSettingsForSource`，供共享工具后续处理使用。
    const flagFastMode = getSettingsForSource('flagSettings')?.fastMode
    // flagFastMode缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!flagFastMode) {
      // reason保存`'Fast mode is not available in the Agent SDK'`，作为后续固定文本处理的输入。
      const reason = 'Fast mode is not available in the Agent SDK'
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Fast mode unavailable: ${reason}`)
      // 返回 `reason`，作为共享工具这次计算的结果。
      return reason
    }
  }

  // Only available for 1P (not Bedrock/Vertex/Foundry)
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // reason固定为 `'Fast mode is not available on Bedrock, Vertex, or Foundr...`，作为共享工具 fast Mode后续展示或比较的基准。
    const reason = 'Fast mode is not available on Bedrock, Vertex, or Foundry'
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Fast mode unavailable: ${reason}`)
    // 返回 `reason`，作为共享工具这次计算的结果。
    return reason
  }

  // 当 `orgStatus.status` 匹配 `'disabled'` 时，共享工具执行对应分支。
  if (orgStatus.status === 'disabled') {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      orgStatus.reason === 'network_error' ||
      orgStatus.reason === 'unknown'
    ) {
      // The org check can fail behind corporate proxies that block the
      // endpoint. We add CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS=1 to
      // bypass this check in the CC binary. This is OK since we have
      // another check in the API to error out when disabled by org.
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS)` 时，共享工具执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS)) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }
    // authType 先占位，稍后的条件分支会根据实际输入补齐它。
    const authType: AuthType =
      getClaudeAIOAuthTokens() !== null ? 'oauth' : 'api-key'
    // reason读取`getDisabledReasonMessage`，供共享工具后续处理使用。
    const reason = getDisabledReasonMessage(orgStatus.reason, authType)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Fast mode unavailable: ${reason}`)
    // 返回 `reason`，作为共享工具这次计算的结果。
    return reason
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// @[MODEL LAUNCH]: Update supported Fast Mode models.
// FAST_MODE_MODEL_DISPLAY 命名 `'Opus 4.6'`，让后续代码直接表达这个值的用途。
export const FAST_MODE_MODEL_DISPLAY = 'Opus 4.6'

// getFastModeModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastModeModel(): string {
  // 返回 `'opus' + (isOpus1mMergeEnabled() ? '[1m]' : '')`，作为共享工具这次计算的结果。
  return 'opus' + (isOpus1mMergeEnabled() ? '[1m]' : '')
}

// getInitialFastModeSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitialFastModeSetting(model: ModelSetting): boolean {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `!isFastModeAvailable()` 时，共享工具执行该分支。
  if (!isFastModeAvailable()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `!isFastModeSupportedByModel(model)` 时，共享工具执行该分支。
  if (!isFastModeSupportedByModel(model)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()
  // If per-session opt-in is required, fast mode starts off each session
  // 满足 `settings.fastModePerSessionOptIn` 时，共享工具执行该分支。
  if (settings.fastModePerSessionOptIn) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `settings.fastMode === true`，作为共享工具这次计算的结果。
  return settings.fastMode === true
}

// isFastModeSupportedByModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFastModeSupportedByModel(
  modelSetting: ModelSetting,
): boolean {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 模型名称读取`getDefaultMainLoopModelSetting`，供共享工具后续处理使用。
  const model = modelSetting ?? getDefaultMainLoopModelSetting()
  // parsedModel解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
  const parsedModel = parseUserSpecifiedModel(model)
  // 返回 `parsedModel.toLowerCase().includes('opus-4-6')`，作为共享工具这次计算的结果。
  return parsedModel.toLowerCase().includes('opus-4-6')
}

// --- Fast mode runtime state ---
// Separate from user preference (settings.fastMode). This tracks the actual
// operational state: whether we're actively sending fast speed or in cooldown
// after a rate limit.

// FastModeRuntimeState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FastModeRuntimeState =
  | { status: 'active' }
  | { status: 'cooldown'; resetAt: number; reason: CooldownReason }

// runtimeState 状态 集中保存共享工具 fast Mode要一起传递的字段。
let runtimeState: FastModeRuntimeState = { status: 'active' }
// hasLoggedCooldownExpiry标记共享工具 fast Mode是否启用对应路径。
let hasLoggedCooldownExpiry = false

// --- Cooldown event listeners ---
// CooldownReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CooldownReason = 'rate_limit' | 'overloaded'

// cooldownTriggered 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const cooldownTriggered =
  createSignal<[resetAt: number, reason: CooldownReason]>()
// cooldownExpired构建`createSignal`，供共享工具后续处理使用。
const cooldownExpired = createSignal()
// onCooldownTriggered保存`cooldownTriggered.subscribe`，供后续判断或组装使用。
export const onCooldownTriggered = cooldownTriggered.subscribe
// onCooldownExpired保存`cooldownExpired.subscribe`，供后续判断或组装使用。
export const onCooldownExpired = cooldownExpired.subscribe

// getFastModeRuntimeState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastModeRuntimeState(): FastModeRuntimeState {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    runtimeState.status === 'cooldown' &&
    Date.now() >= runtimeState.resetAt
  ) {
    // 只有 `isFastModeEnabled() && !hasLoggedCooldownExpiry` 满足时，共享工具才执行该分支。
    if (isFastModeEnabled() && !hasLoggedCooldownExpiry) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Fast mode cooldown expired, re-enabling fast mode')
      // hasLoggedCooldownExpiry更新为 `true`，确保共享工具后续读取最新状态。
      hasLoggedCooldownExpiry = true
      // 调用 cooldownExpired.emit，触发共享工具此处需要的副作用。
      cooldownExpired.emit()
    }
    // runtimeState 状态更新为 `{ status: 'active' }`，确保共享工具后续读取最新状态。
    runtimeState = { status: 'active' }
  }
  // 返回 `runtimeState`，作为共享工具这次计算的结果。
  return runtimeState
}

// triggerFastModeCooldown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function triggerFastModeCooldown(
  resetTimestamp: number,
  reason: CooldownReason,
): void {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // runtimeState 状态更新为 `{ status: 'cooldown', resetAt: resetTimestamp, reason }`，确保共享工具后续读取最新状态。
  runtimeState = { status: 'cooldown', resetAt: resetTimestamp, reason }
  // hasLoggedCooldownExpiry更新为 `false`，确保共享工具后续读取最新状态。
  hasLoggedCooldownExpiry = false
  // cooldownDurationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const cooldownDurationMs = resetTimestamp - Date.now()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Fast mode cooldown triggered (${reason}), duration ${Math.round(cooldownDurationMs / 1000)}s`,
  )
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_fast_mode_fallback_triggered', {
    cooldown_duration_ms: cooldownDurationMs,
    cooldown_reason:
      reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
  // 调用 cooldownTriggered.emit，触发共享工具此处需要的副作用。
  cooldownTriggered.emit(resetTimestamp, reason)
}

// clearFastModeCooldown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearFastModeCooldown(): void {
  // runtimeState 状态更新为 `{ status: 'active' }`，确保共享工具后续读取最新状态。
  runtimeState = { status: 'active' }
}

/**
 * Called when the API rejects a fast mode request (e.g., 400 "Fast mode is
 * not enabled for your organization"). Permanently disables fast mode using
 * the same flow as when the prefetch discovers the org has it disabled.
 */
// handleFastModeRejectedByAPI 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleFastModeRejectedByAPI(): void {
  // 当 `orgStatus.status` 匹配 `'disabled'` 时，共享工具执行对应分支。
  if (orgStatus.status === 'disabled') {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // orgStatus 集合更新为 `{ status: 'disabled', reason: 'preference' }`，确保共享工具后续读取最新状态。
  orgStatus = { status: 'disabled', reason: 'preference' }
  // 调用 updateSettingsForSource，触发共享工具此处需要的副作用。
  updateSettingsForSource('userSettings', { fastMode: undefined })
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    penguinModeOrgEnabled: false,
  }))
  // 调用 orgFastModeChange.emit，触发共享工具此处需要的副作用。
  orgFastModeChange.emit(false)
}

// --- Overage rejection listeners ---
// Fired when a 429 indicates fast mode was rejected because extra usage
// (overage billing) is not available. Distinct from org-level disabling.
// overageRejection读取 `createSignal<[message: string]>()` 对应条目，后续围绕该成员继续处理。
const overageRejection = createSignal<[message: string]>()
// onFastModeOverageRejection保存`overageRejection.subscribe`，供后续判断或组装使用。
export const onFastModeOverageRejection = overageRejection.subscribe

// getOverageDisabledMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOverageDisabledMessage(reason: string | null): string {
  // 按照 reason 的取值选择共享工具的具体处理分支。
  switch (reason) {
    case 'out_of_credits':
      // 返回 `'Fast mode disabled · extra usage credits exhausted'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage credits exhausted'
    case 'org_level_disabled':
    case 'org_service_level_disabled':
      // 返回 `'Fast mode disabled · extra usage disabled by your organization'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage disabled by your organization'
    case 'org_level_disabled_until':
      // 返回 `'Fast mode disabled · extra usage spending cap reached'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage spending cap reached'
    case 'member_level_disabled':
      // 返回 `'Fast mode disabled · extra usage disabled for your account'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage disabled for your account'
    case 'seat_tier_level_disabled':
    case 'seat_tier_zero_credit_limit':
    case 'member_zero_credit_limit':
      // 返回 `'Fast mode disabled · extra usage not available for your plan'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage not available for your plan'
    case 'overage_not_provisioned':
    case 'no_limits_configured':
      // 返回 `'Fast mode requires extra usage billing · /extra-usage to enable'`，作为共享工具这次计算的结果。
      return 'Fast mode requires extra usage billing · /extra-usage to enable'
    default:
      // 返回 `'Fast mode disabled · extra usage not available'`，作为共享工具这次计算的结果。
      return 'Fast mode disabled · extra usage not available'
  }
}

// isOutOfCreditsReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOutOfCreditsReason(reason: string | null): boolean {
  // 返回 `reason === 'org_level_disabled_until' || reason === 'out_of_credits'`，作为共享工具这次计算的结果。
  return reason === 'org_level_disabled_until' || reason === 'out_of_credits'
}

/**
 * Called when a 429 indicates fast mode was rejected because extra usage
 * is not available. Permanently disables fast mode (unless the user has
 * ran out of credits) and notifies with a reason-specific message.
 */
// handleFastModeOverageRejection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleFastModeOverageRejection(reason: string | null): void {
  // 消息读取`getOverageDisabledMessage`，供共享工具后续处理使用。
  const message = getOverageDisabledMessage(reason)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Fast mode overage rejection: ${reason ?? 'unknown'} — ${message}`,
  )
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_fast_mode_overage_rejected', {
    overage_disabled_reason: (reason ??
      'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
  // Disable fast mode permanently unless the user has ran out of credits
  // 满足 `!isOutOfCreditsReason(reason)` 时，共享工具执行该分支。
  if (!isOutOfCreditsReason(reason)) {
    // 调用 updateSettingsForSource，触发共享工具此处需要的副作用。
    updateSettingsForSource('userSettings', { fastMode: undefined })
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      penguinModeOrgEnabled: false,
    }))
  }
  // 调用 overageRejection.emit，触发共享工具此处需要的副作用。
  overageRejection.emit(message)
}

// isFastModeCooldown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFastModeCooldown(): boolean {
  // 返回 `getFastModeRuntimeState().status === 'cooldown'`，作为共享工具这次计算的结果。
  return getFastModeRuntimeState().status === 'cooldown'
}

// getFastModeState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastModeState(
  model: ModelSetting,
  fastModeUserEnabled: boolean | undefined,
): 'off' | 'cooldown' | 'on' {
  // enabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const enabled =
    isFastModeEnabled() &&
    isFastModeAvailable() &&
    !!fastModeUserEnabled &&
    isFastModeSupportedByModel(model)
  // 只有 `enabled && isFastModeCooldown()` 满足时，共享工具才执行该分支。
  if (enabled && isFastModeCooldown()) {
    // 返回 `'cooldown'`，作为共享工具这次计算的结果。
    return 'cooldown'
  }
  // 满足 `enabled` 时，共享工具执行该分支。
  if (enabled) {
    // 返回 `'on'`，作为共享工具这次计算的结果。
    return 'on'
  }
  // 返回 `'off'`，作为共享工具这次计算的结果。
  return 'off'
}

// Disabled reason returned by the API. The API is the canonical source for why
// fast mode is disabled (free account, admin preference, extra usage not enabled).
// FastModeDisabledReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FastModeDisabledReason =
  | 'free'
  | 'preference'
  | 'extra_usage_disabled'
  | 'network_error'
  | 'unknown'

// In-memory cache of the fast mode status from the API.
// Distinct from the user's fastMode app state — this represents
// whether the org *allows* fast mode and why it may be disabled.
// Modeled as a discriminated union so the invalid state
// (disabled without a reason) is unrepresentable.
// FastModeOrgStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FastModeOrgStatus =
  | { status: 'pending' }
  | { status: 'enabled' }
  | { status: 'disabled'; reason: FastModeDisabledReason }

// orgStatus 集合 集中保存共享工具 fast Mode要一起传递的字段。
let orgStatus: FastModeOrgStatus = { status: 'pending' }

// Listeners notified when org-level fast mode status changes
// orgFastModeChange 命名 `createSignal<[orgEnabled: boolean]>()`，让后续代码直接表达这个值的用途。
const orgFastModeChange = createSignal<[orgEnabled: boolean]>()
// onOrgFastModeChanged保存`orgFastModeChange.subscribe`，供后续判断或组装使用。
export const onOrgFastModeChanged = orgFastModeChange.subscribe

// FastModeResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FastModeResponse = {
  enabled: boolean
  disabled_reason: FastModeDisabledReason | null
}

// fetchFastModeStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchFastModeStatus(
  auth: { accessToken: string } | { apiKey: string },
): Promise<FastModeResponse> {
  // endpoint读取`getOauthConfig`，供共享工具后续处理使用。
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_code_penguin_mode`
  // 请求头 先占位，稍后的条件分支会根据实际输入补齐它。
  const headers: Record<string, string> =
    'accessToken' in auth
      ? {
          Authorization: `Bearer ${auth.accessToken}`,
          'anthropic-beta': OAUTH_BETA_HEADER,
        }
      : { 'x-api-key': auth.apiKey }

  // 接口响应 等待 `axios.get<FastModeResponse>(endpoint, { headers })`，确保继续执行前已有结果。
  const response = await axios.get<FastModeResponse>(endpoint, { headers })
  // 返回 `response.data`，作为共享工具这次计算的结果。
  return response.data
}

// PREFETCH_MIN_INTERVAL_MS 集合保存`30_000`，供后续判断或组装使用。
const PREFETCH_MIN_INTERVAL_MS = 30_000
// lastPrefetchAt 命名 `0`，让后续代码直接表达这个值的用途。
let lastPrefetchAt = 0
// inflightPrefetch保存`null`，作为后续空值处理的输入。
let inflightPrefetch: Promise<void> | null = null

/**
 * Resolve orgStatus from the persisted cache without making any API calls.
 * Used when startup prefetches are throttled to avoid hitting the network
 * while still making fast mode availability checks work.
 */
// resolveFastModeStatusFromCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveFastModeStatusFromCache(): void {
  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // `orgStatus.status` 与 `'pending'` 不一致时刷新派生状态，避免使用过期结果。
  if (orgStatus.status !== 'pending') {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // isAnt 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const isAnt = process.env.USER_TYPE === 'ant'
  // cachedEnabled 缓存读取`getGlobalConfig`，供共享工具后续处理使用。
  const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true
  // 共享工具 fast Mode在这里处理 `orgStatus =`，完成这一小步状态转换。
  orgStatus =
    isAnt || cachedEnabled
      ? { status: 'enabled' }
      : { status: 'disabled', reason: 'unknown' }
}

// prefetchFastModeStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function prefetchFastModeStatus(): Promise<void> {
  // Skip network requests if nonessential traffic is disabled
  // 满足 `isEssentialTrafficOnly()` 时，共享工具执行该分支。
  if (isEssentialTrafficOnly()) {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `!isFastModeEnabled()` 时，共享工具执行该分支。
  if (!isFastModeEnabled()) {
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `inflightPrefetch` 时，共享工具执行该分支。
  if (inflightPrefetch) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Fast mode prefetch in progress, returning in-flight promise',
    )
    // 返回 `inflightPrefetch`，作为共享工具这次计算的结果。
    return inflightPrefetch
  }

  // Service key OAuth sessions lack user:profile scope → endpoint 403s.
  // Resolve orgStatus from cache and bail before burning the throttle window.
  // API key auth is unaffected.
  // API key读取`getAnthropicApiKey`，供共享工具后续处理使用。
  const apiKey = getAnthropicApiKey()
  // hasUsableOAuth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasUsableOAuth =
    getClaudeAIOAuthTokens()?.accessToken && hasProfileScope()
  // 只有 `!hasUsableOAuth && !apiKey` 满足时，共享工具才执行该分支。
  if (!hasUsableOAuth && !apiKey) {
    // isAnt 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const isAnt = process.env.USER_TYPE === 'ant'
    // cachedEnabled 缓存读取`getGlobalConfig`，供共享工具后续处理使用。
    const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true
    // 共享工具 fast Mode在这里处理 `orgStatus =`，完成这一小步状态转换。
    orgStatus =
      isAnt || cachedEnabled
        ? { status: 'enabled' }
        : { status: 'disabled', reason: 'preference' }
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()
  // 满足 `now - lastPrefetchAt < PREFETCH_MIN_INTERVAL_MS` 时，共享工具执行该分支。
  if (now - lastPrefetchAt < PREFETCH_MIN_INTERVAL_MS) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Skipping fast mode prefetch, fetched recently')
    // 共享工具 fast Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // lastPrefetchAt更新为 `now`，确保共享工具后续读取最新状态。
  lastPrefetchAt = now

  // fetchWithCurrentAuth保存`async`，供共享工具后续处理使用。
  const fetchWithCurrentAuth = async (): Promise<FastModeResponse> => {
    // currentTokens 集合读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
    const currentTokens = getClaudeAIOAuthTokens()
    // auth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const auth =
      currentTokens?.accessToken && hasProfileScope()
        ? { accessToken: currentTokens.accessToken }
        : apiKey
          ? { apiKey }
          : null
    // auth缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!auth) {
      // 抛出 new Error('No auth available')，阻止共享工具在无效状态下继续运行。
      throw new Error('No auth available')
    }
    // 返回 `fetchFastModeStatus(auth)`，作为共享工具这次计算的结果。
    return fetchFastModeStatus(auth)
  }

  // doFetch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function doFetch(): Promise<void> {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // status 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let status: FastModeResponse
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // status 集合更新为 `await fetchWithCurrentAuth()`，确保共享工具后续读取最新状态。
        status = await fetchWithCurrentAuth()
      } catch (err) {
        // isAuthError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isAuthError =
          axios.isAxiosError(err) &&
          (err.response?.status === 401 ||
            (err.response?.status === 403 &&
              typeof err.response?.data === 'string' &&
              err.response.data.includes('OAuth token has been revoked')))
        // 满足 `isAuthError` 时，共享工具执行该分支。
        if (isAuthError) {
          // failedAccessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
          const failedAccessToken = getClaudeAIOAuthTokens()?.accessToken
          // 满足 `failedAccessToken` 时，共享工具执行该分支。
          if (failedAccessToken) {
            // 等待 `handleOAuth401Error(failedAccessToken)` 完成，再继续共享工具 fast Mode的异步流程。
            await handleOAuth401Error(failedAccessToken)
            // status 集合更新为 `await fetchWithCurrentAuth()`，确保共享工具后续读取最新状态。
            status = await fetchWithCurrentAuth()
          } else {
            // 抛出 err，阻止共享工具在无效状态下继续运行。
            throw err
          }
        } else {
          // 抛出 err，阻止共享工具在无效状态下继续运行。
          throw err
        }
      }

      // previousEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const previousEnabled =
        orgStatus.status !== 'pending'
          ? orgStatus.status === 'enabled'
          : getGlobalConfig().penguinModeOrgEnabled
      // orgStatus 集合更新为 `status.enabled`，确保共享工具后续读取最新状态。
      orgStatus = status.enabled
        ? { status: 'enabled' }
        : {
            status: 'disabled',
            reason: status.disabled_reason ?? 'preference',
          }
      // `previousEnabled` 与 `status.enabled` 不一致时刷新派生状态，避免使用过期结果。
      if (previousEnabled !== status.enabled) {
        // When org disables fast mode, permanently turn off the user's fast mode setting
        // status.enabled缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!status.enabled) {
          // 调用 updateSettingsForSource，触发共享工具此处需要的副作用。
          updateSettingsForSource('userSettings', { fastMode: undefined })
        }
        // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
        saveGlobalConfig(current => ({
          ...current,
          penguinModeOrgEnabled: status.enabled,
        }))
        // 调用 orgFastModeChange.emit，触发共享工具此处需要的副作用。
        orgFastModeChange.emit(status.enabled)
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Org fast mode: ${status.enabled ? 'enabled' : `disabled (${status.disabled_reason ?? 'preference'})`}`,
      )
    } catch (err) {
      // On failure: ants default to enabled (don't block internal users).
      // External users: fall back to the cached penguinModeOrgEnabled value;
      // if no positive cache, disable with network_error reason.
      // isAnt 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const isAnt = process.env.USER_TYPE === 'ant'
      // cachedEnabled 缓存读取`getGlobalConfig`，供共享工具后续处理使用。
      const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true
      // 共享工具 fast Mode在这里处理 `orgStatus =`，完成这一小步状态转换。
      orgStatus =
        isAnt || cachedEnabled
          ? { status: 'enabled' }
          : { status: 'disabled', reason: 'network_error' }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to fetch org fast mode status, defaulting to ${orgStatus.status === 'enabled' ? 'enabled (cached)' : 'disabled (network_error)'}: ${err}`,
        { level: 'error' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_org_penguin_mode_fetch_failed', {})
    } finally {
      // inflightPrefetch更新为 `null`，确保共享工具后续读取最新状态。
      inflightPrefetch = null
    }
  }

  // inflightPrefetch更新为 `doFetch()`，确保共享工具后续读取最新状态。
  inflightPrefetch = doFetch()
  // 返回 `inflightPrefetch`，作为共享工具这次计算的结果。
  return inflightPrefetch
}
