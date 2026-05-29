/**
 * Plugin telemetry helpers — shared field builders for plugin lifecycle events.
 *
 * Implements the twin-column privacy pattern: every user-defined-name field
 * emits both a raw value (routed to PII-tagged _PROTO_* BQ columns) and a
 * redacted twin (real name iff marketplace ∈ allowlist, else 'third-party').
 *
 * plugin_id_hash provides an opaque per-plugin aggregation key with no privacy
 * dependency — sha256(name@marketplace + FIXED_SALT) truncated to 16 chars.
 * This answers distinct-count and per-plugin-trend questions that the
 * redacted column can't, without exposing user-defined names.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { sep } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  LoadedPlugin,
  PluginError,
  PluginManifest,
} from '../../types/plugin.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isOfficialMarketplaceName,
  parsePluginIdentifier,
} from '../plugins/pluginIdentifier.js'

// builtinPlugins.ts:BUILTIN_MARKETPLACE_NAME — inlined to avoid the cycle
// through commands.js. Marketplace schemas.ts enforces 'builtin' is reserved.
// BUILTIN_MARKETPLACE_NAME 市场数据保存`'builtin'`，作为后续固定文本处理的输入。
const BUILTIN_MARKETPLACE_NAME = 'builtin'

// Fixed salt for plugin_id_hash. Same constant across all repos and emission
// sites. Not per-org, not rotated — per-org salt would defeat cross-org
// distinct-count, rotation would break trend lines. Customers can compute the
// same hash on their known plugin names to reverse-match their own telemetry.
// PLUGIN_ID_HASH_SALT 插件数据保存`'claude-plugin-telemetry-v1'`，作为后续固定文本处理的输入。
const PLUGIN_ID_HASH_SALT = 'claude-plugin-telemetry-v1'

/**
 * Opaque per-plugin aggregation key. Input is the name@marketplace string as
 * it appears in enabledPlugins keys, lowercased on the marketplace suffix for
 * reproducibility. 16-char truncation keeps BQ GROUP BY cardinality manageable
 * while making collisions negligible at projected 10k-plugin scale. Name case
 * is preserved in both branches (enabledPlugins keys are case-sensitive).
 */
// hashPluginId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashPluginId(name: string, marketplace?: string): string {
  // 按键保存`marketplace.toLowerCase`，供共享工具后续处理使用。
  const key = marketplace ? `${name}@${marketplace.toLowerCase()}` : name
  // 返回 `createHash('sha256')`，作为共享工具这次计算的结果。
  return createHash('sha256')
    .update(key + PLUGIN_ID_HASH_SALT)
    .digest('hex')
    .slice(0, 16)
}

/**
 * 4-value scope enum for plugin origin. Distinct from PluginScope
 * (managed/user/project/local) which is installation-target — this is
 * marketplace-origin.
 *
 * - official: from an allowlisted Anthropic marketplace
 * - default-bundle: ships with product (@builtin), auto-enabled
 * - org: enterprise admin-pushed via managed settings (policySettings)
 * - user-local: user added marketplace or local plugin
 */
// TelemetryPluginScope 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TelemetryPluginScope =
  | 'official'
  | 'org'
  | 'user-local'
  | 'default-bundle'

// getTelemetryPluginScope 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTelemetryPluginScope(
  name: string,
  marketplace: string | undefined,
  managedNames: Set<string> | null,
): TelemetryPluginScope {
  // 满足 `marketplace === BUILTIN_MARKETPLACE_NAME` 时，共享工具执行该分支。
  if (marketplace === BUILTIN_MARKETPLACE_NAME) return 'default-bundle'
  // 满足 `isOfficialMarketplaceName(marketplace)` 时，共享工具执行该分支。
  if (isOfficialMarketplaceName(marketplace)) return 'official'
  // 满足 `managedNames?.has(name)` 时，共享工具执行该分支。
  if (managedNames?.has(name)) return 'org'
  // 返回 `'user-local'`，作为共享工具这次计算的结果。
  return 'user-local'
}

/**
 * How a plugin arrived in the session. Splits self-selected from org-pushed
 * — plugin_scope alone doesn't (an official plugin can be user-installed OR
 * org-pushed; both are scope='official').
 */
// EnabledVia 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnabledVia =
  | 'user-install'
  | 'org-policy'
  | 'default-enable'
  | 'seed-mount'

/** How a skill/command invocation was triggered. */
// InvocationTrigger 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InvocationTrigger =
  | 'user-slash'
  | 'claude-proactive'
  | 'nested-skill'

/** Where a skill invocation executes. */
// SkillExecutionContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SkillExecutionContext = 'fork' | 'inline' | 'remote'

/** How a plugin install was initiated. */
// InstallSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallSource =
  | 'cli-explicit'
  | 'ui-discover'
  | 'ui-suggestion'
  | 'deep-link'

// getEnabledVia 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnabledVia(
  plugin: LoadedPlugin,
  managedNames: Set<string> | null,
  seedDirs: string[],
): EnabledVia {
  // 满足 `plugin.isBuiltin` 时，共享工具执行该分支。
  if (plugin.isBuiltin) return 'default-enable'
  // 满足 `managedNames?.has(plugin.name)` 时，共享工具执行该分支。
  if (managedNames?.has(plugin.name)) return 'org-policy'
  // Trailing sep: /opt/plugins must not match /opt/plugins-extra
  // 共享工具在这里按实际状态进入对应分支。
  if (
    // 调用 seedDirs.some，触发共享工具此处需要的副作用。
    seedDirs.some(dir =>
      plugin.path.startsWith(dir.endsWith(sep) ? dir : dir + sep),
    )
  ) {
    // 返回 `'seed-mount'`，作为共享工具这次计算的结果。
    return 'seed-mount'
  }
  // 返回 `'user-install'`，作为共享工具这次计算的结果。
  return 'user-install'
}

/**
 * Common plugin telemetry fields keyed off name@marketplace. Returns the
 * hash, scope enum, and the redacted-twin columns. Callers add the raw
 * _PROTO_* fields separately (those require the PII-tagged marker type).
 */
// buildPluginTelemetryFields 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildPluginTelemetryFields(
  name: string,
  marketplace: string | undefined,
  managedNames: Set<string> | null = null,
): {
  plugin_id_hash: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  plugin_scope: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  plugin_name_redacted: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  marketplace_name_redacted: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  is_official_plugin: boolean
} {
  // scope读取`getTelemetryPluginScope`，供共享工具后续处理使用。
  const scope = getTelemetryPluginScope(name, marketplace, managedNames)
  // Both official marketplaces and builtin plugins are Anthropic-controlled
  // — safe to expose real names in the redacted columns.
  // isAnthropicControlled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isAnthropicControlled =
    scope === 'official' || scope === 'default-bundle'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    plugin_id_hash: hashPluginId(
      name,
      marketplace,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    plugin_scope:
      scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    plugin_name_redacted: (isAnthropicControlled
      ? name
      : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    marketplace_name_redacted: (isAnthropicControlled && marketplace
      ? marketplace
      : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    is_official_plugin: isAnthropicControlled,
  }
}

/**
 * Per-invocation callers (SkillTool, processSlashCommand) pass
 * managedNames=null — the session-level tengu_plugin_enabled_for_session
 * event carries the authoritative plugin_scope, and per-invocation rows can
 * join on plugin_id_hash to recover it. This keeps hot-path call sites free
 * of the extra settings read.
 */
// buildPluginCommandTelemetryFields 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildPluginCommandTelemetryFields(
  pluginInfo: { pluginManifest: PluginManifest; repository: string },
  managedNames: Set<string> | null = null,
): ReturnType<typeof buildPluginTelemetryFields> {
  // 从 `parsePluginIdentifier(pluginInfo.repository)` 解构 marketplace，减少共享工具 plugin Telemetry对同一对象的重复访问。
  const { marketplace } = parsePluginIdentifier(pluginInfo.repository)
  // 返回 `buildPluginTelemetryFields(`，作为共享工具这次计算的结果。
  return buildPluginTelemetryFields(
    pluginInfo.pluginManifest.name,
    marketplace,
    managedNames,
  )
}

/**
 * Emit tengu_plugin_enabled_for_session once per enabled plugin at session
 * start. Supplements tengu_skill_loaded (which still fires per-skill) — use
 * this for plugin-level aggregates instead of DISTINCT-on-prefix hacks.
 * A plugin with 5 skills emits 5 skill_loaded rows but 1 of these.
 */
// logPluginsEnabledForSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logPluginsEnabledForSession(
  plugins: LoadedPlugin[],
  managedNames: Set<string> | null,
  seedDirs: string[],
): void {
  // 按顺序遍历 `plugins` 中的plugin 插件数据，逐个交给共享工具处理。
  for (const plugin of plugins) {
    // 从 `parsePluginIdentifier(plugin.repository)` 解构 marketplace，减少共享工具 plugin Telemetry对同一对象的重复访问。
    const { marketplace } = parsePluginIdentifier(plugin.repository)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_enabled_for_session', {
      _PROTO_plugin_name:
        plugin.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      ...buildPluginTelemetryFields(plugin.name, marketplace, managedNames),
      enabled_via: getEnabledVia(
        plugin,
        managedNames,
        seedDirs,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_path_count:
        (plugin.skillsPath ? 1 : 0) + (plugin.skillsPaths?.length ?? 0),
      command_path_count:
        (plugin.commandsPath ? 1 : 0) + (plugin.commandsPaths?.length ?? 0),
      has_mcp: plugin.manifest.mcpServers !== undefined,
      has_hooks: plugin.hooksConfig !== undefined,
      ...(plugin.manifest.version && {
        version: plugin.manifest
          .version as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
  }
}

/**
 * Bounded-cardinality error bucket for CLI plugin operation failures.
 * Maps free-form error messages to 5 stable categories so dashboard
 * GROUP BY stays tractable.
 */
// PluginCommandErrorCategory 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginCommandErrorCategory =
  | 'network'
  | 'not-found'
  | 'permission'
  | 'validation'
  | 'unknown'

// classifyPluginCommandError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyPluginCommandError(
  error: unknown,
): PluginCommandErrorCategory {
  // 消息保存`String`，供共享工具后续处理使用。
  const msg = String((error as { message?: unknown })?.message ?? error)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|ECONNRESET|network|Could not resolve|Connection refused|timed out/i.test(
      msg,
    )
  ) {
    // 返回 `'network'`，作为共享工具这次计算的结果。
    return 'network'
  }
  // 满足 `/\b404\b|not found|does not exist|no such plugin/i.test(msg)` 时，共享工具执行该分支。
  if (/\b404\b|not found|does not exist|no such plugin/i.test(msg)) {
    // 返回 `'not-found'`，作为共享工具这次计算的结果。
    return 'not-found'
  }
  // 满足 `/\b40[13]\b|EACCES|EPERM|permission denied|unauthorized/i.test(msg)` 时，共享工具执行该分支。
  if (/\b40[13]\b|EACCES|EPERM|permission denied|unauthorized/i.test(msg)) {
    // 返回 `'permission'`，作为共享工具这次计算的结果。
    return 'permission'
  }
  // 满足 `/invalid|malformed|schema|validation|parse error/i.test(msg)` 时，共享工具执行该分支。
  if (/invalid|malformed|schema|validation|parse error/i.test(msg)) {
    // 返回 `'validation'`，作为共享工具这次计算的结果。
    return 'validation'
  }
  // 返回 `'unknown'`，作为共享工具这次计算的结果。
  return 'unknown'
}

/**
 * Emit tengu_plugin_load_failed once per error surfaced by session-start
 * plugin loading. Pairs with tengu_plugin_enabled_for_session so dashboards
 * can compute a load-success rate. PluginError.type is already a bounded
 * enum — use it directly as error_category.
 */
// logPluginLoadErrors 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logPluginLoadErrors(
  errors: PluginError[],
  managedNames: Set<string> | null,
): void {
  // 按顺序遍历 `errors` 中的err，逐个交给共享工具处理。
  for (const err of errors) {
    // 从 `parsePluginIdentifier(err.source)` 解构 name、marketplace，减少共享工具 plugin Telemetry对同一对象的重复访问。
    const { name, marketplace } = parsePluginIdentifier(err.source)
    // Not all PluginError variants carry a plugin name (some have pluginId,
    // some are marketplace-level). Use the 'plugin' property if present,
    // fall back to the name parsed from err.source.
    // pluginName 插件数据标记共享工具 plugin Telemetry是否启用对应路径。
    const pluginName = 'plugin' in err && err.plugin ? err.plugin : name
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_load_failed', {
      error_category:
        err.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      _PROTO_plugin_name:
        pluginName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      ...buildPluginTelemetryFields(pluginName, marketplace, managedNames),
    })
  }
}
