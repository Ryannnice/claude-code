/**
 * Plugin option storage and substitution.
 *
 * Plugins declare user-configurable options in `manifest.userConfig` — a record
 * of field schemas matching `McpbUserConfigurationOption`. At enable time the
 * user is prompted for values. Storage splits by `sensitive`:
 *   - `sensitive: true`  → secureStorage (keychain on macOS, .credentials.json elsewhere)
 *   - everything else    → settings.json `pluginConfigs[pluginId].options`
 *
 * `loadPluginOptions` reads and merges both. The substitution helpers are also
 * here (moved from mcpPluginIntegration.ts) so hooks/LSP/skills don't all
 * import from MCP-specific code.
 */

// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 类型依赖 { LoadedPlugin } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { LoadedPlugin } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getSecureStorage，将 ../secureStorage/index.js 中已经封装好的能力接到本文件流程里。
import { getSecureStorage } from '../secureStorage/index.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  updateSettingsForSource,
} from '../settings/settings.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type UserConfigSchema,
  type UserConfigValues,
  validateUserConfig,
} from './mcpbHandler.js'
// 引入 getPluginDataDir，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginDataDir } from './pluginDirectories.js'

// PluginOptionValues 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginOptionValues = UserConfigValues
// PluginOptionSchema 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginOptionSchema = UserConfigSchema

/**
 * Canonical storage key for a plugin's options in both `settings.pluginConfigs`
 * and `secureStorage.pluginSecrets`. Today this is `plugin.source` — always
 * `"${name}@${marketplace}"` (pluginLoader.ts:1400). `plugin.repository` is
 * a backward-compat alias that's set to the same string (1401); don't use it
 * for storage. UI code that manually constructs `` `${name}@${marketplace}` ``
 * produces the same key by convention — see PluginOptionsFlow, ManagePlugins.
 *
 * Exists so there's exactly one place to change if the key format ever drifts.
 */
// getPluginStorageId 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginStorageId(plugin: LoadedPlugin): string {
  // 返回 `plugin.source`，作为插件管理这次计算的结果。
  return plugin.source
}

/**
 * Load saved option values for a plugin, merging non-sensitive (from settings)
 * with sensitive (from secureStorage). SecureStorage wins on key collision.
 *
 * Memoized per-pluginId because hooks can fire per-tool-call and each call
 * would otherwise do a settings read + keychain spawn. Cache cleared via
 * `clearPluginOptionsCache` when settings change or plugins reload.
 */
// loadPluginOptions 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadPluginOptions = memoize(
  (pluginId: string): PluginOptionValues => {
    // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
    const settings = getSettings_DEPRECATED()
    // nonSensitive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const nonSensitive =
      settings.pluginConfigs?.[pluginId]?.options ?? ({} as PluginOptionValues)

    // NOTE: storage.read() spawns `security find-generic-password` on macOS
    // (~50-100ms, synchronous). Mitigated by the memoize above (per-pluginId,
    // session-lifetime) + keychain's own 30s TTL cache — so one blocking spawn
    // per session per plugin-with-options. /reload-plugins clears the memoize
    // and the next hook/MCP-load after that eats a fresh spawn.
    // storage读取`getSecureStorage`，供插件管理后续处理使用。
    const storage = getSecureStorage()
    // sensitive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const sensitive =
      storage.read()?.pluginSecrets?.[pluginId] ??
      ({} as Record<string, string>)

    // secureStorage wins on collision — schema determines destination so
    // collision shouldn't happen, but if a user hand-edits settings.json we
    // trust the more secure source.
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { ...nonSensitive, ...sensitive }
  },
)

// clearPluginOptionsCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginOptionsCache(): void {
  // 调用 loadPluginOptions.cache?.clear?.()，完成这一处局部操作。
  loadPluginOptions.cache?.clear?.()
}

/**
 * Save option values, splitting by `schema[key].sensitive`. Non-sensitive go
 * to userSettings; sensitive go to secureStorage. Writes are skipped if nothing
 * in that category is present.
 *
 * Clears the load cache on success so the next `loadPluginOptions` sees fresh.
 */
// savePluginOptions 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function savePluginOptions(
  pluginId: string,
  values: PluginOptionValues,
  schema: PluginOptionSchema,
): void {
  // nonSensitive 从空对象开始收集键值，后续按名称补齐内容。
  const nonSensitive: PluginOptionValues = {}
  // sensitive 从空对象开始收集键值，后续按名称补齐内容。
  const sensitive: Record<string, string> = {}

  // 循环处理 `const [key, value] of Object.entries(values)`，让插件管理把同类条目按顺序走完。
  for (const [key, value] of Object.entries(values)) {
    // 满足 `schema[key]?.sensitive === true` 时，插件管理执行该分支。
    if (schema[key]?.sensitive === true) {
      // sensitive[key更新为 `String(value)`，确保插件工具 plugin Options Storage后续读取最新状态。
      sensitive[key] = String(value)
    } else {
      // nonSensitive[key更新为 `value`，确保插件工具 plugin Options Storage后续读取最新状态。
      nonSensitive[key] = value
    }
  }

  // Scrub sets — see saveMcpServerUserConfig (mcpbHandler.ts) for the
  // rationale. Only keys in THIS save are scrubbed from the other store,
  // so partial reconfigures don't lose data.
  // sensitiveKeysInThisSave保存`Set`，供插件管理后续处理使用。
  const sensitiveKeysInThisSave = new Set(Object.keys(sensitive))
  // nonSensitiveKeysInThisSave保存`Set`，供插件管理后续处理使用。
  const nonSensitiveKeysInThisSave = new Set(Object.keys(nonSensitive))

  // secureStorage FIRST — if keychain fails, throw before touching
  // settings.json so old plaintext (if any) stays as fallback.
  // storage读取`getSecureStorage`，供插件管理后续处理使用。
  const storage = getSecureStorage()
  // existingInSecureStorage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const existingInSecureStorage =
    storage.read()?.pluginSecrets?.[pluginId] ?? undefined
  // secureScrubbed 命名 `existingInSecureStorage`，让后续代码直接表达这个值的用途。
  const secureScrubbed = existingInSecureStorage
    ? Object.fromEntries(
        Object.entries(existingInSecureStorage).filter(
          // 这个回调绑定到 ([k]) => !nonSensitiveKeysInThisSave.has(k),，负责插件管理在该局部场景下的响应。
          ([k]) => !nonSensitiveKeysInThisSave.has(k),
        ),
      )
    : undefined
  // needSecureScrub 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const needSecureScrub =
    secureScrubbed &&
    existingInSecureStorage &&
    Object.keys(secureScrubbed).length !==
      Object.keys(existingInSecureStorage).length
  // 只有 `Object.keys(sensitive).length > 0 || needSecureScrub` 满足时，插件管理才执行该分支。
  if (Object.keys(sensitive).length > 0 || needSecureScrub) {
    // existing读取`storage.read`，供插件管理后续处理使用。
    const existing = storage.read() ?? {}
    // existing.pluginSecrets 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!existing.pluginSecrets) {
      // pluginSecrets 插件数据更新为 `{}`，确保插件工具后续读取最新状态。
      existing.pluginSecrets = {}
    }
    // pluginSecrets[pluginId 插件数据更新为 `{`，确保插件工具 plugin Options Storage后续读取最新状态。
    existing.pluginSecrets[pluginId] = {
      ...secureScrubbed,
      ...sensitive,
    }
    // 结果保存`storage.update`，供插件管理后续处理使用。
    const result = storage.update(existing)
    // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!result.success) {
      // err保存`Error`，供插件管理后续处理使用。
      const err = new Error(
        `Failed to save sensitive plugin options for ${pluginId} to secure storage`,
      )
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // 抛出 err，阻止插件管理在无效状态下继续运行。
      throw err
    }
    // 满足 `result.warning` 时，插件管理执行该分支。
    if (result.warning) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Plugin secrets save warning: ${result.warning}`, {
        level: 'warn',
      })
    }
  }

  // settings.json AFTER secureStorage — scrub sensitive keys via explicit
  // undefined (mergeWith deletion pattern).
  //
  // TODO: getSettings_DEPRECATED returns MERGED settings across all scopes.
  // Mutating that and writing to userSettings can leak project-scope
  // pluginConfigs into ~/.claude/settings.json. Same pattern exists in
  // saveMcpServerUserConfig. Safe today since pluginConfigs is only ever
  // written here (user-scope), but will bite if we add project-scoped
  // plugin options.
  // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
  const settings = getSettings_DEPRECATED()
  // existingInSettings 集合 命名 `settings.pluginConfigs?.[pluginId]?.options ?? {}`，让后续代码直接表达这个值的用途。
  const existingInSettings = settings.pluginConfigs?.[pluginId]?.options ?? {}
  // keysToScrubFromSettings 集合派生`Object.keys`，供插件管理后续处理使用。
  const keysToScrubFromSettings = Object.keys(existingInSettings).filter(k =>
    sensitiveKeysInThisSave.has(k),
  )
  // 插件管理在这里按实际状态进入对应分支。
  if (
    Object.keys(nonSensitive).length > 0 ||
    keysToScrubFromSettings.length > 0
  ) {
    // settings.pluginConfigs 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!settings.pluginConfigs) {
      // pluginConfigs 插件数据更新为 `{}`，确保插件工具后续读取最新状态。
      settings.pluginConfigs = {}
    }
    // 满足 `!settings.pluginConfigs[pluginId]` 时，插件管理执行该分支。
    if (!settings.pluginConfigs[pluginId]) {
      // pluginConfigs[pluginId 插件数据更新为 `{}`，确保插件工具 plugin Options Storage后续读取最新状态。
      settings.pluginConfigs[pluginId] = {}
    }
    // scrubbed保存`Object.fromEntries`，供插件管理后续处理使用。
    const scrubbed = Object.fromEntries(
      // 调用 keysToScrubFromSettings.map，触发插件管理此处需要的副作用。
      keysToScrubFromSettings.map(k => [k, undefined]),
    ) as Record<string, undefined>
    // 选项更新为 `{`，确保插件工具 plugin Options Storage后续读取最新状态。
    settings.pluginConfigs[pluginId].options = {
      ...nonSensitive,
      ...scrubbed,
    } as PluginOptionValues
    // 结果保存`updateSettingsForSource`，供插件管理后续处理使用。
    const result = updateSettingsForSource('userSettings', settings)
    // 满足 `result.error` 时，插件管理执行该分支。
    if (result.error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(result.error)
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Failed to save plugin options for ${pluginId}: ${result.error.message}`,
      )
    }
  }

  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginOptionsCache()
}

/**
 * Delete all stored option values for a plugin — both the non-sensitive
 * `settings.pluginConfigs[pluginId]` entry and the sensitive
 * `secureStorage.pluginSecrets[pluginId]` entry.
 *
 * Call this when the LAST installation of a plugin is uninstalled (i.e.,
 * alongside `markPluginVersionOrphaned`). Don't call on every uninstall —
 * a plugin can be installed in multiple scopes and the user's config should
 * survive removing it from one scope while it remains in another.
 *
 * Best-effort: keychain write failure is logged but doesn't throw, since
 * the uninstall itself succeeded and we don't want to surface a confusing
 * "uninstall failed" message for a cleanup side-effect.
 */
// deletePluginOptions 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deletePluginOptions(pluginId: string): void {
  // Settings side — also wipes the legacy mcpServers sub-key (same story:
  // orphaned on uninstall, never cleaned up before this PR).
  //
  // Use `undefined` (not `delete`) because `updateSettingsForSource` merges
  // via `mergeWith` — absent keys are ignored, only `undefined` triggers
  // removal. Cast is deliberate (CLAUDE.md's 10% case): adding z.undefined()
  // to the schema instead (like enabledPlugins:466 does) leaks
  // `| {[k: string]: unknown}` into the public SDK type, which subsumes the
  // real object arm and kills excess-property checks for SDK consumers. The
  // mergeWith-deletion contract is internal plumbing — it shouldn't shape
  // the Zod schema. enabledPlugins gets away with it only because its other
  // arms (string[] | boolean) are non-objects that stay distinct.
  // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
  const settings = getSettings_DEPRECATED()
  // PluginConfigs 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
  type PluginConfigs = NonNullable<typeof settings.pluginConfigs>
  // 满足 `settings.pluginConfigs?.[pluginId]` 时，插件管理执行该分支。
  if (settings.pluginConfigs?.[pluginId]) {
    // Partial<Record<K,V>> = Record<K, V | undefined> — gives us the widening
    // for the undefined value, and Partial-of-X overlaps with X so the cast
    // is a narrowing TS accepts (same approach as marketplaceManager.ts:1795).
    // pluginConfigs 插件数据 集中保存插件工具 plugin Options Storage要一起传递的字段。
    const pluginConfigs: Partial<PluginConfigs> = { [pluginId]: undefined }
    // 从 `updateSettingsForSource('userSettings', {` 解构 error，减少插件工具 plugin Options Storage对同一对象的重复访问。
    const { error } = updateSettingsForSource('userSettings', {
      pluginConfigs: pluginConfigs as PluginConfigs,
    })
    // 满足 `error` 时，插件管理执行该分支。
    if (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `deletePluginOptions: failed to clear settings.pluginConfigs[${pluginId}]: ${error.message}`,
        { level: 'warn' },
      )
    }
  }

  // Secure storage side — delete both the top-level pluginSecrets[pluginId]
  // and any per-server composite keys `${pluginId}/${server}` (from
  // saveMcpServerUserConfig's sensitive split). `/` prefix match is safe:
  // plugin IDs are `name@marketplace`, never contain `/`, so
  // startsWith(`${id}/`) can't false-positive on a different plugin.
  // storage读取`getSecureStorage`，供插件管理后续处理使用。
  const storage = getSecureStorage()
  // existing读取`storage.read`，供插件管理后续处理使用。
  const existing = storage.read()
  // 满足 `existing?.pluginSecrets` 时，插件管理执行该分支。
  if (existing?.pluginSecrets) {
    // prefix 命名 ``${pluginId}/``，让后续代码直接表达这个值的用途。
    const prefix = `${pluginId}/`
    // survivingEntries 集合派生`Object.entries`，供插件管理后续处理使用。
    const survivingEntries = Object.entries(existing.pluginSecrets).filter(
      // 这个回调绑定到 ([k]) => k !== pluginId && !k.startsWith(prefix),，负责插件管理在该局部场景下的响应。
      ([k]) => k !== pluginId && !k.startsWith(prefix),
    )
    // 插件管理在这里按实际状态进入对应分支。
    if (
      survivingEntries.length !== Object.keys(existing.pluginSecrets).length
    ) {
      // 结果保存`storage.update`，供插件管理后续处理使用。
      const result = storage.update({
        ...existing,
        pluginSecrets:
          survivingEntries.length > 0
            ? Object.fromEntries(survivingEntries)
            : undefined,
      })
      // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!result.success) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `deletePluginOptions: failed to clear pluginSecrets for ${pluginId} from keychain`,
          { level: 'warn' },
        )
      }
    }
  }

  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginOptionsCache()
}

/**
 * Find option keys whose saved values don't satisfy the schema — i.e., what to
 * prompt for. Returns the schema slice for those keys, or empty if everything
 * validates. Empty manifest.userConfig → empty result.
 *
 * Used by PluginOptionsFlow to decide whether to show the prompt after enable.
 */
// getUnconfiguredOptions 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUnconfiguredOptions(
  plugin: LoadedPlugin,
): PluginOptionSchema {
  // manifestSchema保存`plugin.manifest.userConfig`，供插件工具 plugin Options Storage后续判断或输出使用。
  const manifestSchema = plugin.manifest.userConfig
  // !manifestSchema || Object.keys(...为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!manifestSchema || Object.keys(manifestSchema).length === 0) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }

  // saved读取`loadPluginOptions`，供插件管理后续处理使用。
  const saved = loadPluginOptions(getPluginStorageId(plugin))
  // validation读取`validateUserConfig`，供插件管理后续处理使用。
  const validation = validateUserConfig(saved, manifestSchema)
  // 满足 `validation.valid` 时，插件管理执行该分支。
  if (validation.valid) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }

  // Return only the fields that failed. validateUserConfig reports errors as
  // strings keyed by title/key — simpler to just re-check each field here than
  // parse error strings.
  // unconfigured 配置 从空对象开始收集键值，后续按名称补齐内容。
  const unconfigured: PluginOptionSchema = {}
  // 循环处理 `const [key, fieldSchema] of Object.entries(manifestSchema)`，让插件管理把同类条目按顺序走完。
  for (const [key, fieldSchema] of Object.entries(manifestSchema)) {
    // single读取`validateUserConfig`，供插件管理后续处理使用。
    const single = validateUserConfig(
      { [key]: saved[key] } as PluginOptionValues,
      { [key]: fieldSchema },
    )
    // single.valid缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!single.valid) {
      // unconfigured[key 配置更新为 `fieldSchema`，确保插件工具 plugin Options Storage后续读取最新状态。
      unconfigured[key] = fieldSchema
    }
  }
  // 返回 `unconfigured`，作为插件管理这次计算的结果。
  return unconfigured
}

/**
 * Substitute ${CLAUDE_PLUGIN_ROOT} and ${CLAUDE_PLUGIN_DATA} with their paths.
 * On Windows, normalizes backslashes to forward slashes so shell commands
 * don't interpret them as escape characters.
 *
 * ${CLAUDE_PLUGIN_ROOT} — version-scoped install dir (recreated on update)
 * ${CLAUDE_PLUGIN_DATA} — persistent state dir (survives updates)
 *
 * Both patterns use the function-replacement form of .replace(): ROOT so
 * `$`-patterns in NTFS paths ($$, $', $`, $&) aren't interpreted; DATA so
 * getPluginDataDir (which lazily mkdirs) only runs when actually present.
 *
 * Used in MCP/LSP server command/args/env, hook commands, skill/agent content.
 */
// substitutePluginVariables 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function substitutePluginVariables(
  value: string,
  plugin: { path: string; source?: string },
): string {
  // normalize封装成回调，供插件工具 plugin Options Storage在事件触发或异步步骤中调用。
  const normalize = (p: string) =>
    process.platform === 'win32' ? p.replace(/\\/g, '/') : p
  // out格式化`value.replace`，供插件管理后续处理使用。
  let out = value.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, () =>
    normalize(plugin.path),
  )
  // source can be absent (e.g. hooks where pluginRoot is a skill root without
  // a plugin context). In that case ${CLAUDE_PLUGIN_DATA} is left literal.
  // 满足 `plugin.source` 时，插件管理执行该分支。
  if (plugin.source) {
    // source保存`plugin.source`，供插件工具 plugin Options Storage后续判断或输出使用。
    const source = plugin.source
    // out更新为 `out.replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, () =>`，确保插件工具后续读取最新状态。
    out = out.replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, () =>
      normalize(getPluginDataDir(source)),
    )
  }
  // 返回 `out`，作为插件管理这次计算的结果。
  return out
}

/**
 * Substitute ${user_config.KEY} with saved option values.
 *
 * Throws on missing keys — callers pass this only after `validateUserConfig`
 * succeeded, so a miss here means a plugin references a key it never declared
 * in its schema. That's a plugin authoring bug; failing loud surfaces it.
 *
 * Use `substituteUserConfigInContent` for skill/agent prose — it handles
 * missing keys and sensitive-filtering instead of throwing.
 */
// substituteUserConfigVariables 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function substituteUserConfigVariables(
  value: string,
  userConfig: PluginOptionValues,
): string {
  // 返回 `value.replace(/\$\{user_config\.([^}]+)\}/g, (_match, key) => {`，作为插件管理这次计算的结果。
  return value.replace(/\$\{user_config\.([^}]+)\}/g, (_match, key) => {
    // configValue 配置 命名 `userConfig[key]`，让后续代码直接表达这个值的用途。
    const configValue = userConfig[key]
    // 满足 `configValue === undefined` 时，插件管理执行该分支。
    if (configValue === undefined) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Missing required user configuration value: ${key}. ` +
          `This should have been validated before variable substitution.`,
      )
    }
    // 返回 `String(configValue)`，作为插件管理这次计算的结果。
    return String(configValue)
  })
}

/**
 * Content-safe variant for skill/agent prose. Differences from
 * `substituteUserConfigVariables`:
 *
 *   - Sensitive-marked keys substitute to a descriptive placeholder instead of
 *     the actual value — skill/agent content goes to the model prompt, and
 *     we don't put secrets in the model's context.
 *   - Unknown keys stay literal (no throw) — matches how `${VAR}` env refs
 *     behave today when the var is unset.
 *
 * A ref to a sensitive key produces obvious-looking output so plugin authors
 * notice and move the ref into a hook/MCP env instead.
 */
// substituteUserConfigInContent 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function substituteUserConfigInContent(
  content: string,
  options: PluginOptionValues,
  schema: PluginOptionSchema,
): string {
  // 返回 `content.replace(/\$\{user_config\.([^}]+)\}/g, (match, key) => {`，作为插件管理这次计算的结果。
  return content.replace(/\$\{user_config\.([^}]+)\}/g, (match, key) => {
    // 满足 `schema[key]?.sensitive === true` 时，插件管理执行该分支。
    if (schema[key]?.sensitive === true) {
      // 返回 ``[sensitive option '${key}' not available in skill content]``，作为插件管理这次计算的结果。
      return `[sensitive option '${key}' not available in skill content]`
    }
    // 取值读取 `options[key]` 对应条目，后续围绕该成员继续处理。
    const value = options[key]
    // 满足 `value === undefined` 时，插件管理执行该分支。
    if (value === undefined) {
      // 返回 `match`，作为插件管理这次计算的结果。
      return match
    }
    // 返回 `String(value)`，作为插件管理这次计算的结果。
    return String(value)
  })
}
