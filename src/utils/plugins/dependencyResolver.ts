/**
 * Plugin dependency resolution — pure functions, no I/O.
 *
 * Semantics are `apt`-style: a dependency is a *presence guarantee*, not a
 * module graph. Plugin A depending on Plugin B means "B's namespaced
 * components (MCP servers, commands, agents) must be available when A runs."
 *
 * Two entry points:
 *  - `resolveDependencyClosure` — install-time DFS walk, cycle detection
 *  - `verifyAndDemote` — load-time fixed-point check, demotes plugins with
 *    unsatisfied deps (session-local, does NOT write settings)
 */

// 类型依赖 { LoadedPlugin, PluginError } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { LoadedPlugin, PluginError } from '../../types/plugin.js'
// 类型依赖 { EditableSettingSource } 来自 ../settings/constants.js，用于校准插件管理的数据契约。
import type { EditableSettingSource } from '../settings/constants.js'
// 引入 getSettingsForSource，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from '../settings/settings.js'
// 引入 parsePluginIdentifier，将 ./pluginIdentifier.js 中已经封装好的能力接到本文件流程里。
import { parsePluginIdentifier } from './pluginIdentifier.js'
// 类型依赖 { PluginId } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { PluginId } from './schemas.js'

/**
 * Synthetic marketplace sentinel for `--plugin-dir` plugins (pluginLoader.ts
 * sets `source = "{name}@inline"`). Not a real marketplace — bare deps from
 * these plugins cannot meaningfully inherit it.
 */
// INLINE_MARKETPLACE 市场数据保存`'inline'`，作为后续固定文本处理的输入。
const INLINE_MARKETPLACE = 'inline'

/**
 * Normalize a dependency reference to fully-qualified "name@marketplace" form.
 * Bare names (no @) inherit the marketplace of the plugin declaring them —
 * cross-marketplace deps are blocked anyway, so the @-suffix is boilerplate
 * in the common case.
 *
 * EXCEPTION: if the declaring plugin is @inline (loaded via --plugin-dir),
 * bare deps are returned unchanged. `inline` is a synthetic sentinel, not a
 * real marketplace — fabricating "dep@inline" would never match anything.
 * verifyAndDemote handles bare deps via name-only matching.
 */
// qualifyDependency 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function qualifyDependency(
  dep: string,
  declaringPluginId: string,
): string {
  // 满足 `parsePluginIdentifier(dep).marketplace` 时，插件管理执行该分支。
  if (parsePluginIdentifier(dep).marketplace) return dep
  // mkt解析`parsePluginIdentifier`，供插件管理后续处理使用。
  const mkt = parsePluginIdentifier(declaringPluginId).marketplace
  // 只有 `!mkt || mkt === INLINE_MARKETPLACE` 满足时，插件管理才执行该分支。
  if (!mkt || mkt === INLINE_MARKETPLACE) return dep
  // 返回 ``${dep}@${mkt}``，作为插件管理这次计算的结果。
  return `${dep}@${mkt}`
}

/**
 * Minimal shape the resolver needs from a marketplace lookup. Keeping this
 * narrow means the resolver stays testable without constructing full
 * PluginMarketplaceEntry objects.
 */
// DependencyLookupResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type DependencyLookupResult = {
  // Entries may be bare names; qualifyDependency normalizes them.
  dependencies?: string[]
}

// ResolutionResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolutionResult =
  | { ok: true; closure: PluginId[] }
  | { ok: false; reason: 'cycle'; chain: PluginId[] }
  | { ok: false; reason: 'not-found'; missing: PluginId; requiredBy: PluginId }
  | {
      ok: false
      reason: 'cross-marketplace'
      dependency: PluginId
      requiredBy: PluginId
    }

/**
 * Walk the transitive dependency closure of `rootId` via DFS.
 *
 * The returned `closure` ALWAYS contains `rootId`, plus every transitive
 * dependency that is NOT in `alreadyEnabled`. Already-enabled deps are
 * skipped (not recursed into) — this avoids surprise settings writes when a
 * dep is already installed at a different scope. The root is never skipped,
 * even if already enabled, so re-installing a plugin always re-caches it.
 *
 * Cross-marketplace dependencies are BLOCKED by default: a plugin in
 * marketplace A cannot auto-install a plugin from marketplace B. This is
 * a security boundary — installing from a trusted marketplace shouldn't
 * silently pull from an untrusted one. Two escapes: (1) install the
 * cross-mkt dep yourself first (already-enabled deps are skipped, so the
 * closure won't touch it), or (2) the ROOT marketplace's
 * `allowCrossMarketplaceDependenciesOn` allowlist — only the root's list
 * applies for the whole walk (no transitive trust: if A allows B, B's
 * plugin depending on C is still blocked unless A also allows C).
 *
 * @param rootId Root plugin to resolve from (format: "name@marketplace")
 * @param lookup Async lookup returning `{dependencies}` or `null` if not found
 * @param alreadyEnabled Plugin IDs to skip (deps only, root is never skipped)
 * @param allowedCrossMarketplaces Marketplace names the root trusts for
 *   auto-install (from the root marketplace's manifest)
 * @returns Closure to install, or a cycle/not-found/cross-marketplace error
 */
// resolveDependencyClosure 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveDependencyClosure(
  rootId: PluginId,
  // 这个回调绑定到 lookup: (id: PluginId) => Promise<DependencyLookupResult | null>,，负责插件管理在该局部场景下的响应。
  lookup: (id: PluginId) => Promise<DependencyLookupResult | null>,
  alreadyEnabled: ReadonlySet<PluginId>,
  allowedCrossMarketplaces: ReadonlySet<string> = new Set(),
): Promise<ResolutionResult> {
  // rootMarketplace 市场数据解析`parsePluginIdentifier`，供插件管理后续处理使用。
  const rootMarketplace = parsePluginIdentifier(rootId).marketplace
  // closure 从空数组开始收集，后续循环会按处理顺序追加条目。
  const closure: PluginId[] = []
  // visited构建`new Set<PluginId>()`，供后续判断或组装使用。
  const visited = new Set<PluginId>()
  // stack 从空数组开始收集，后续循环会按处理顺序追加条目。
  const stack: PluginId[] = []

  // walk 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function walk(
    id: PluginId,
    requiredBy: PluginId,
  ): Promise<ResolutionResult | null> {
    // Skip already-enabled DEPENDENCIES (avoids surprise settings writes),
    // but NEVER skip the root: installing an already-enabled plugin must
    // still cache/register it. Without this guard, re-installing a plugin
    // that's in settings but missing from disk (e.g., cache cleared,
    // installed_plugins.json stale) would return an empty closure and
    // `cacheAndRegisterPlugin` would never fire — user sees
    // "✔ Successfully installed" but nothing materializes.
    // `id` 与 `rootId && alreadyEnabled.has(id)` 不一致时刷新派生状态，避免使用过期结果。
    if (id !== rootId && alreadyEnabled.has(id)) return null
    // Security: block auto-install across marketplace boundaries. Runs AFTER
    // the alreadyEnabled check — if the user manually installed a cross-mkt
    // dep, it's in alreadyEnabled and we never reach this.
    // idMarketplace 市场数据解析`parsePluginIdentifier`，供插件管理后续处理使用。
    const idMarketplace = parsePluginIdentifier(id).marketplace
    // 插件管理在这里按实际状态进入对应分支。
    if (
      idMarketplace !== rootMarketplace &&
      !(idMarketplace && allowedCrossMarketplaces.has(idMarketplace))
    ) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ok: false,
        reason: 'cross-marketplace',
        dependency: id,
        requiredBy,
      }
    }
    // 满足 `stack.includes(id)` 时，插件管理执行该分支。
    if (stack.includes(id)) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { ok: false, reason: 'cycle', chain: [...stack, id] }
    }
    // 满足 `visited.has(id)` 时，插件管理执行该分支。
    if (visited.has(id)) return null
    // 调用 visited.add，触发插件管理此处需要的副作用。
    visited.add(id)

    // entry读取`lookup`，供插件管理后续处理使用。
    const entry = await lookup(id)
    // entry缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!entry) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { ok: false, reason: 'not-found', missing: id, requiredBy }
    }

    // stack追加新条目，保持收集顺序与输入顺序一致。
    stack.push(id)
    // 按顺序遍历 `entry.dependencies ?? []` 中的rawDep，逐个交给插件管理处理。
    for (const rawDep of entry.dependencies ?? []) {
      // dep保存`qualifyDependency`，供插件管理后续处理使用。
      const dep = qualifyDependency(rawDep, id)
      // err保存`walk`，供插件管理后续处理使用。
      const err = await walk(dep, id)
      // 满足 `err` 时，插件管理执行该分支。
      if (err) return err
    }
    // 调用 stack.pop，触发插件管理此处需要的副作用。
    stack.pop()

    // closure追加新条目，保持收集顺序与输入顺序一致。
    closure.push(id)
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // err保存`walk`，供插件管理后续处理使用。
  const err = await walk(rootId, rootId)
  // 满足 `err` 时，插件管理执行该分支。
  if (err) return err
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { ok: true, closure }
}

/**
 * Load-time safety net: for each enabled plugin, verify all manifest
 * dependencies are also in the enabled set. Demote any that fail.
 *
 * Fixed-point loop: demoting plugin A may break plugin B that depends on A,
 * so we iterate until nothing changes.
 *
 * The `reason` field distinguishes:
 *  - `'not-enabled'` — dep exists in the loaded set but is disabled
 *  - `'not-found'` — dep is entirely absent (not in any marketplace)
 *
 * Does NOT mutate input. Returns the set of plugin IDs (sources) to demote.
 *
 * @param plugins All loaded plugins (enabled + disabled)
 * @returns Set of pluginIds to demote, plus errors for `/doctor`
 */
// verifyAndDemote 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function verifyAndDemote(plugins: readonly LoadedPlugin[]): {
  demoted: Set<string>
  errors: PluginError[]
} {
  // known保存`Set`，供插件管理后续处理使用。
  const known = new Set(plugins.map(p => p.source))
  // enabled保存`Set`，供插件管理后续处理使用。
  const enabled = new Set(plugins.filter(p => p.enabled).map(p => p.source))
  // Name-only indexes for bare deps from --plugin-dir (@inline) plugins:
  // the real marketplace is unknown, so match "B" against any enabled "B@*".
  // enabledByName is a multiset: if B@epic AND B@other are both enabled,
  // demoting one mustn't make "B" disappear from the index.
  // knownByName保存`Set`，供插件管理后续处理使用。
  const knownByName = new Set(
    // 调用 plugins.map，触发插件管理此处需要的副作用。
    plugins.map(p => parsePluginIdentifier(p.source).name),
  )
  // enabledByName构建`new Map<string, number>()`，供后续判断或组装使用。
  const enabledByName = new Map<string, number>()
  // 按顺序遍历 `enabled` 中的标识符，逐个交给插件管理处理。
  for (const id of enabled) {
    // n解析`parsePluginIdentifier`，供插件管理后续处理使用。
    const n = parsePluginIdentifier(id).name
    // enabledByName.set 写入新的状态值，使插件管理后续读取保持一致。
    enabledByName.set(n, (enabledByName.get(n) ?? 0) + 1)
  }
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []

  // changed标记插件工具 dependency Resolver是否启用对应路径。
  let changed = true
  // while 使用 changed 完成插件管理里的对应操作。
  while (changed) {
    // changed更新为 `false`，确保插件工具后续读取最新状态。
    changed = false
    // 按顺序遍历 `plugins` 中的p，逐个交给插件管理处理。
    for (const p of plugins) {
      // 满足 `!enabled.has(p.source)` 时，插件管理执行该分支。
      if (!enabled.has(p.source)) continue
      // 按顺序遍历 `p.manifest.dependencies ?? []` 中的rawDep，逐个交给插件管理处理。
      for (const rawDep of p.manifest.dependencies ?? []) {
        // dep保存`qualifyDependency`，供插件管理后续处理使用。
        const dep = qualifyDependency(rawDep, p.source)
        // Bare dep ← @inline plugin: match by name only (see enabledByName)
        // isBare记录 `parsePluginIdentifier` 是否成立，插件管理随后按该结果分支。
        const isBare = !parsePluginIdentifier(dep).marketplace
        // satisfied保存`isBare`，供后续判断或组装使用。
        const satisfied = isBare
          ? (enabledByName.get(dep) ?? 0) > 0
          : enabled.has(dep)
        // satisfied缺失时直接走兜底路径，避免插件管理使用无效输入。
        if (!satisfied) {
          // 调用 enabled.delete，触发插件管理此处需要的副作用。
          enabled.delete(p.source)
          // 计数读取`enabledByName.get`，供插件管理后续处理使用。
          const count = enabledByName.get(p.name) ?? 0
          // 满足 `count <= 1) enabledByName.delete(p.name` 时，插件管理执行该分支。
          if (count <= 1) enabledByName.delete(p.name)
          else enabledByName.set(p.name, count - 1)
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'dependency-unsatisfied',
            source: p.source,
            plugin: p.name,
            dependency: dep,
            reason: (isBare ? knownByName.has(dep) : known.has(dep))
              ? 'not-enabled'
              : 'not-found',
          })
          // changed更新为 `true`，确保插件工具后续读取最新状态。
          changed = true
          // 结束这个分支或循环，避免插件管理继续落入后续路径。
          break
        }
      }
    }
  }

  // demoted保存`Set`，供插件管理后续处理使用。
  const demoted = new Set(
    // 调用 plugins.filter，触发插件管理此处需要的副作用。
    plugins.filter(p => p.enabled && !enabled.has(p.source)).map(p => p.source),
  )
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { demoted, errors }
}

/**
 * Find all enabled plugins that declare `pluginId` as a dependency.
 * Used to warn on uninstall/disable ("required by: X, Y").
 *
 * @param pluginId The plugin being removed/disabled
 * @param plugins All loaded plugins (only enabled ones are checked)
 * @returns Names of plugins that will break if `pluginId` goes away
 */
// findReverseDependents 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findReverseDependents(
  pluginId: PluginId,
  plugins: readonly LoadedPlugin[],
): string[] {
  // 从 `parsePluginIdentifier(pluginId)` 解构 name，减少插件工具 dependency Resolver对同一对象的重复访问。
  const { name: targetName } = parsePluginIdentifier(pluginId)
  // 返回 `plugins`，作为插件管理这次计算的结果。
  return plugins
    .filter(
      // p更新为 `>`，确保插件工具后续读取最新状态。
      p =>
        p.enabled &&
        p.source !== pluginId &&
        // 这个回调绑定到 (p.manifest.dependencies ?? []).some(d => {，负责插件管理在该局部场景下的响应。
        (p.manifest.dependencies ?? []).some(d => {
          // qualified保存`qualifyDependency`，供插件管理后续处理使用。
          const qualified = qualifyDependency(d, p.source)
          // Bare dep (from @inline plugin): match by name only
          // 返回 `parsePluginIdentifier(qualified).marketplace`，作为插件管理这次计算的结果。
          return parsePluginIdentifier(qualified).marketplace
            ? qualified === pluginId
            : qualified === targetName
        }),
    )
    // 链式调用 map，继续加工上一行在插件管理中产生的数据。
    .map(p => p.name)
}

/**
 * Build the set of plugin IDs currently enabled at a given settings scope.
 * Used by install-time resolution to skip already-enabled deps and avoid
 * surprise settings writes.
 *
 * Matches `true` (plain enable) AND array values (version constraints per
 * settings/types.ts:455-463 — a plugin at `"foo@bar": ["^1.0.0"]` IS enabled).
 * Without the array check, a version-pinned dep would be re-added to the
 * closure and the settings write would clobber the constraint with `true`.
 */
// getEnabledPluginIdsForScope 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnabledPluginIdsForScope(
  settingSource: EditableSettingSource,
): Set<PluginId> {
  // 返回 `new Set(`，作为插件管理这次计算的结果。
  return new Set(
    Object.entries(getSettingsForSource(settingSource)?.enabledPlugins ?? {})
      // 链式调用 filter，继续加工上一行在插件管理中产生的数据。
      .filter(([, v]) => v === true || Array.isArray(v))
      // 链式调用 map，继续加工上一行在插件管理中产生的数据。
      .map(([k]) => k),
  )
}

/**
 * Format the "(+ N dependencies)" suffix for install success messages.
 * Returns empty string when `installedDeps` is empty.
 */
// formatDependencyCountSuffix 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDependencyCountSuffix(installedDeps: string[]): string {
  // installedDeps 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (installedDeps.length === 0) return ''
  // n 命名 `installedDeps.length`，让后续代码直接表达这个值的用途。
  const n = installedDeps.length
  // 返回 `` (+ ${n} ${n === 1 ? 'dependency' : 'dependencies'})``，作为插件管理这次计算的结果。
  return ` (+ ${n} ${n === 1 ? 'dependency' : 'dependencies'})`
}

/**
 * Format the "warning: required by X, Y" suffix for uninstall/disable
 * results. Em-dash style for CLI result messages (not the middot style
 * used in the notification UI). Returns empty string when no dependents.
 */
// formatReverseDependentsSuffix 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatReverseDependentsSuffix(
  rdeps: string[] | undefined,
): string {
  // !rdeps || rdeps 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!rdeps || rdeps.length === 0) return ''
  // 返回 `` — warning: required by ${rdeps.join(', ')}``，作为插件管理这次计算的结果。
  return ` — warning: required by ${rdeps.join(', ')}`
}
