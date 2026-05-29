/**
 * Plugin-hint recommendations.
 *
 * Companion to lspRecommendation.ts: where LSP recommendations are triggered
 * by file edits, plugin hints are triggered by CLIs/SDKs emitting a
 * `<claude-code-hint />` tag to stderr (detected by the Bash/PowerShell tools).
 *
 * State persists in GlobalConfig.claudeCodeHints — a show-once record per
 * plugin and a disabled flag (user picked "don't show again"). Official-
 * marketplace filtering is hardcoded for v1.
 */

// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type ClaudeCodeHint,
  hasShownHintThisSession,
  setPendingHint,
} from '../claudeCodeHints.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isPluginInstalled，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { isPluginInstalled } from './installedPluginsManager.js'
// 引入 getPluginById，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { getPluginById } from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isOfficialMarketplaceName,
  parsePluginIdentifier,
} from './pluginIdentifier.js'
// 引入 isPluginBlockedByPolicy，将 ./pluginPolicy.js 中已经封装好的能力接到本文件流程里。
import { isPluginBlockedByPolicy } from './pluginPolicy.js'

/**
 * Hard cap on `claudeCodeHints.plugin[]` — bounds config growth. Each shown
 * plugin appends one slug; past this point we stop prompting (and stop
 * appending) rather than let the config grow without limit.
 */
// MAX_SHOWN_PLUGINS 插件数据 命名 `100`，让后续代码直接表达这个值的用途。
const MAX_SHOWN_PLUGINS = 100

// PluginHintRecommendation 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginHintRecommendation = {
  pluginId: string
  pluginName: string
  marketplaceName: string
  pluginDescription?: string
  sourceCommand: string
}

/**
 * Pre-store gate called by shell tools when a `type="plugin"` hint is detected.
 * Drops the hint if:
 *
 *  - a dialog has already been shown this session
 *  - user has disabled hints
 *  - the shown-plugins list has hit the config-growth cap
 *  - plugin slug doesn't parse as `name@marketplace`
 *  - marketplace isn't official (hardcoded for v1)
 *  - plugin is already installed
 *  - plugin was already shown in a prior session
 *
 * Synchronous on purpose — shell tools shouldn't await a marketplace lookup
 * just to strip a stderr line. The async marketplace-cache check happens
 * later in resolvePluginHint (hook side).
 */
// maybeRecordPluginHint 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybeRecordPluginHint(hint: ClaudeCodeHint): void {
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_lapis_finch', false)` 时，插件管理执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_lapis_finch', false)) return
  // 满足 `hasShownHintThisSession()` 时，插件管理执行该分支。
  if (hasShownHintThisSession()) return

  // 状态读取`getGlobalConfig`，供插件管理后续处理使用。
  const state = getGlobalConfig().claudeCodeHints
  // 满足 `state?.disabled` 时，插件管理执行该分支。
  if (state?.disabled) return

  // shown保存`state?.plugin ?? []`，供后续判断或组装使用。
  const shown = state?.plugin ?? []
  // 满足 `shown.length >= MAX_SHOWN_PLUGINS` 时，插件管理执行该分支。
  if (shown.length >= MAX_SHOWN_PLUGINS) return

  // pluginId 插件数据保存`hint.value`，供插件工具 hint Recommendation后续判断或输出使用。
  const pluginId = hint.value
  // 从 `parsePluginIdentifier(pluginId)` 解构 name、marketplace，减少插件工具 hint Recommendation对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(pluginId)
  // 只有 `!name || !marketplace` 满足时，插件管理才执行该分支。
  if (!name || !marketplace) return
  // 满足 `!isOfficialMarketplaceName(marketplace)` 时，插件管理执行该分支。
  if (!isOfficialMarketplaceName(marketplace)) return
  // 满足 `shown.includes(pluginId)` 时，插件管理执行该分支。
  if (shown.includes(pluginId)) return
  // 满足 `isPluginInstalled(pluginId)` 时，插件管理执行该分支。
  if (isPluginInstalled(pluginId)) return
  // 满足 `isPluginBlockedByPolicy(pluginId)` 时，插件管理执行该分支。
  if (isPluginBlockedByPolicy(pluginId)) return

  // Bound repeat lookups on the same slug — a CLI that emits on every
  // invocation shouldn't trigger N resolve cycles for the same plugin.
  // 满足 `triedThisSession.has(pluginId)` 时，插件管理执行该分支。
  if (triedThisSession.has(pluginId)) return
  // 调用 triedThisSession.add，触发插件管理此处需要的副作用。
  triedThisSession.add(pluginId)

  // setPendingHint 写入新的状态值，使插件管理后续读取保持一致。
  setPendingHint(hint)
}

// triedThisSession 会话数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
const triedThisSession = new Set<string>()

/** Test-only reset. */
// _resetHintRecommendationForTesting 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetHintRecommendationForTesting(): void {
  // 调用 triedThisSession.clear，触发插件管理此处需要的副作用。
  triedThisSession.clear()
}

/**
 * Resolve the pending hint to a renderable recommendation. Runs the async
 * marketplace lookup that the sync pre-store gate skipped. Returns null if
 * the plugin isn't in the marketplace cache — the hint is discarded.
 */
// resolvePluginHint 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolvePluginHint(
  hint: ClaudeCodeHint,
): Promise<PluginHintRecommendation | null> {
  // pluginId 插件数据保存`hint.value`，供插件工具 hint Recommendation后续判断或输出使用。
  const pluginId = hint.value
  // 从 `parsePluginIdentifier(pluginId)` 解构 name、marketplace，减少插件工具 hint Recommendation对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(pluginId)

  // pluginData 插件数据读取`getPluginById`，供插件管理后续处理使用。
  const pluginData = await getPluginById(pluginId)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_hint_detected', {
    _PROTO_plugin_name: (name ??
      '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    _PROTO_marketplace_name: (marketplace ??
      '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    result: (pluginData
      ? 'passed'
      : 'not_in_cache') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // pluginData 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!pluginData) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[hintRecommendation] ${pluginId} not found in marketplace cache`,
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    pluginId,
    pluginName: pluginData.entry.name,
    marketplaceName: marketplace ?? '',
    pluginDescription: pluginData.entry.description,
    sourceCommand: hint.sourceCommand,
  }
}

/**
 * Record that a prompt for this plugin was surfaced. Called regardless of
 * the user's yes/no response — show-once semantics.
 */
// markHintPluginShown 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markHintPluginShown(pluginId: string): void {
  // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
  saveGlobalConfig(current => {
    // existing 命名 `current.claudeCodeHints?.plugin ?? []`，让后续代码直接表达这个值的用途。
    const existing = current.claudeCodeHints?.plugin ?? []
    // 满足 `existing.includes(pluginId)` 时，插件管理执行该分支。
    if (existing.includes(pluginId)) return current
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...current,
      claudeCodeHints: {
        ...current.claudeCodeHints,
        plugin: [...existing, pluginId],
      },
    }
  })
}

/** Called when the user picks "don't show plugin installation hints again". */
// disableHintRecommendations 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function disableHintRecommendations(): void {
  // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
  saveGlobalConfig(current => {
    // 满足 `current.claudeCodeHints?.disabled` 时，插件管理执行该分支。
    if (current.claudeCodeHints?.disabled) return current
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...current,
      claudeCodeHints: { ...current.claudeCodeHints, disabled: true },
    }
  })
}
