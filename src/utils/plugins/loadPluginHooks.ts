// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准插件管理的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  clearRegisteredPluginHooks,
  getRegisteredHooks,
  registerHookCallbacks,
} from '../../bootstrap/state.js'
// 类型依赖 { LoadedPlugin } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { LoadedPlugin } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 settingsChangeDetector，将 ../settings/changeDetector.js 中已经封装好的能力接到本文件流程里。
import { settingsChangeDetector } from '../settings/changeDetector.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from '../settings/settings.js'
// 类型依赖 { PluginHookMatcher } 来自 ../settings/types.js，用于校准插件管理的数据契约。
import type { PluginHookMatcher } from '../settings/types.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 clearPluginCache、loadAllPluginsCacheOnly，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCache, loadAllPluginsCacheOnly } from './pluginLoader.js'

// Track if hot reload subscription is set up
// hotReloadSubscribed标记插件工具 load Plugin Hooks是否启用对应路径。
let hotReloadSubscribed = false

// Snapshot of enabledPlugins for change detection in hot reload
// lastPluginSettingsSnapshot 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
let lastPluginSettingsSnapshot: string | undefined

/**
 * Convert plugin hooks configuration to native matchers with plugin context
 */
// convertPluginHooksToMatchers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertPluginHooksToMatchers(
  plugin: LoadedPlugin,
): Record<HookEvent, PluginHookMatcher[]> {
  // pluginMatchers 插件数据 集中保存插件工具 load Plugin Hooks要一起传递的字段。
  const pluginMatchers: Record<HookEvent, PluginHookMatcher[]> = {
    PreToolUse: [],
    PostToolUse: [],
    PostToolUseFailure: [],
    PermissionDenied: [],
    Notification: [],
    UserPromptSubmit: [],
    SessionStart: [],
    SessionEnd: [],
    Stop: [],
    StopFailure: [],
    SubagentStart: [],
    SubagentStop: [],
    PreCompact: [],
    PostCompact: [],
    PermissionRequest: [],
    Setup: [],
    TeammateIdle: [],
    TaskCreated: [],
    TaskCompleted: [],
    Elicitation: [],
    ElicitationResult: [],
    ConfigChange: [],
    WorktreeCreate: [],
    WorktreeRemove: [],
    InstructionsLoaded: [],
    CwdChanged: [],
    FileChanged: [],
  }

  // plugin.hooksConfig 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!plugin.hooksConfig) {
    // 返回 `pluginMatchers`，作为插件管理这次计算的结果。
    return pluginMatchers
  }

  // Process each hook event - pass through all hook types with plugin context
  // 循环处理 `const [event, matchers] of Object.entries(plugin.hooksConfig)`，让插件管理把同类条目按顺序走完。
  for (const [event, matchers] of Object.entries(plugin.hooksConfig)) {
    // hookEvent保存`event as HookEvent`，供后续判断或组装使用。
    const hookEvent = event as HookEvent
    // 满足 `!pluginMatchers[hookEvent]` 时，插件管理执行该分支。
    if (!pluginMatchers[hookEvent]) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // 按顺序遍历 `matchers` 中的matcher，逐个交给插件管理处理。
    for (const matcher of matchers) {
      // 满足 `matcher.hooks.length > 0` 时，插件管理执行该分支。
      if (matcher.hooks.length > 0) {
        // 插件工具 load Plugin Hooks在这里处理 `pluginMatchers[hookEvent].push({`，完成这一小步状态转换。
        pluginMatchers[hookEvent].push({
          matcher: matcher.matcher,
          hooks: matcher.hooks,
          pluginRoot: plugin.path,
          pluginName: plugin.name,
          pluginId: plugin.source,
        })
      }
    }
  }

  // 返回 `pluginMatchers`，作为插件管理这次计算的结果。
  return pluginMatchers
}

/**
 * Load and register hooks from all enabled plugins
 */
// loadPluginHooks 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadPluginHooks = memoize(async (): Promise<void> => {
  // 从 `await loadAllPluginsCacheOnly()` 解构 enabled，减少插件工具 load Plugin Hooks对同一对象的重复访问。
  const { enabled } = await loadAllPluginsCacheOnly()
  // allPluginHooks 插件数据 集中保存插件工具 load Plugin Hooks要一起传递的字段。
  const allPluginHooks: Record<HookEvent, PluginHookMatcher[]> = {
    PreToolUse: [],
    PostToolUse: [],
    PostToolUseFailure: [],
    PermissionDenied: [],
    Notification: [],
    UserPromptSubmit: [],
    SessionStart: [],
    SessionEnd: [],
    Stop: [],
    StopFailure: [],
    SubagentStart: [],
    SubagentStop: [],
    PreCompact: [],
    PostCompact: [],
    PermissionRequest: [],
    Setup: [],
    TeammateIdle: [],
    TaskCreated: [],
    TaskCompleted: [],
    Elicitation: [],
    ElicitationResult: [],
    ConfigChange: [],
    WorktreeCreate: [],
    WorktreeRemove: [],
    InstructionsLoaded: [],
    CwdChanged: [],
    FileChanged: [],
  }

  // Process each enabled plugin
  // 按顺序遍历 `enabled` 中的plugin 插件数据，逐个交给插件管理处理。
  for (const plugin of enabled) {
    // plugin.hooksConfig 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!plugin.hooksConfig) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Loading hooks from plugin: ${plugin.name}`)
    // pluginMatchers 插件数据保存`convertPluginHooksToMatchers`，供插件管理后续处理使用。
    const pluginMatchers = convertPluginHooksToMatchers(plugin)

    // Merge plugin hooks into the main collection
    // 逐项读取 `Object.keys(pluginMatchers) as HookEvent[]` 中的event，按输入顺序推进插件管理。
    for (const event of Object.keys(pluginMatchers) as HookEvent[]) {
      // 插件工具 load Plugin Hooks在这里处理 `allPluginHooks[event].push(...pluginMatchers[event])`，完成这一小步状态转换。
      allPluginHooks[event].push(...pluginMatchers[event])
    }
  }

  // Clear-then-register as an atomic pair. Previously the clear lived in
  // clearPluginHookCache(), which meant any clearAllCaches() call (from
  // /plugins UI, pluginInstallationHelpers, thinkback, etc.) wiped plugin
  // hooks from STATE.registeredHooks and left them wiped until someone
  // happened to call loadPluginHooks() again. SessionStart explicitly awaits
  // loadPluginHooks() before firing so it always re-registered; Stop has no
  // such guard, so plugin Stop hooks silently never fired after any plugin
  // management operation (gh-29767). Doing the clear here makes the swap
  // atomic — old hooks stay valid until this point, new hooks take over.
  // 调用 clearRegisteredPluginHooks，触发插件管理此处需要的副作用。
  clearRegisteredPluginHooks()
  // 调用 registerHookCallbacks，触发插件管理此处需要的副作用。
  registerHookCallbacks(allPluginHooks)

  // totalHooks 集合派生`Object.values`，供插件管理后续处理使用。
  const totalHooks = Object.values(allPluginHooks).reduce(
    // 这个回调绑定到 (sum, matchers) => sum + matchers.reduce((s, m) => s + m.hooks.length, 0),，负责插件管理在该局部场景下的响应。
    (sum, matchers) => sum + matchers.reduce((s, m) => s + m.hooks.length, 0),
    0,
  )
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Registered ${totalHooks} hooks from ${enabled.length} plugins`,
  )
})

// clearPluginHookCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginHookCache(): void {
  // Only invalidate the memoize — do NOT wipe STATE.registeredHooks here.
  // Wiping here left plugin hooks dead between clearAllCaches() and the next
  // loadPluginHooks() call, which for Stop hooks might never happen
  // (gh-29767). The clear now lives inside loadPluginHooks() as an atomic
  // clear-then-register, so old hooks stay valid until the fresh load swaps
  // them out.
  // 调用 loadPluginHooks.cache?.clear?.()，完成这一处局部操作。
  loadPluginHooks.cache?.clear?.()
}

/**
 * Remove hooks from plugins no longer in the enabled set, without adding
 * hooks from newly-enabled plugins. Called from clearAllCaches() so
 * uninstalled/disabled plugins stop firing hooks immediately (gh-36995),
 * while newly-enabled plugins wait for /reload-plugins — consistent with
 * how commands/agents/MCP behave.
 *
 * The full swap (clear + register all) still happens via loadPluginHooks(),
 * which /reload-plugins awaits.
 */
// pruneRemovedPluginHooks 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pruneRemovedPluginHooks(): Promise<void> {
  // Early return when nothing to prune — avoids seeding the loadAllPluginsCacheOnly
  // memoize in test/preload.ts beforeEach (which clears registeredHooks).
  // 满足 `!getRegisteredHooks()` 时，插件管理执行该分支。
  if (!getRegisteredHooks()) return
  // 从 `await loadAllPluginsCacheOnly()` 解构 enabled，减少插件工具 load Plugin Hooks对同一对象的重复访问。
  const { enabled } = await loadAllPluginsCacheOnly()
  // enabledRoots 集合保存`Set`，供插件管理后续处理使用。
  const enabledRoots = new Set(enabled.map(p => p.path))

  // Re-read after the await: a concurrent loadPluginHooks() (hot-reload)
  // could have swapped STATE.registeredHooks during the gap. Holding the
  // pre-await reference would compute survivors from stale data.
  // current读取`getRegisteredHooks`，供插件管理后续处理使用。
  const current = getRegisteredHooks()
  // current缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!current) return

  // Collect plugin hooks whose pluginRoot is still enabled, then swap via
  // the existing clear+register pair (same atomic-pair pattern as
  // loadPluginHooks above). Callback hooks are preserved by
  // clearRegisteredPluginHooks; we only need to re-register survivors.
  // survivors 集合 从空对象开始收集键值，后续按名称补齐内容。
  const survivors: Partial<Record<HookEvent, PluginHookMatcher[]>> = {}
  // 循环处理 `const [event, matchers] of Object.entries(current)`，让插件管理把同类条目按顺序走完。
  for (const [event, matchers] of Object.entries(current)) {
    // kept筛选`matchers.filter`，供插件管理后续处理使用。
    const kept = matchers.filter(
      // 这个回调绑定到 (m): m is PluginHookMatcher =>，负责插件管理在该局部场景下的响应。
      (m): m is PluginHookMatcher =>
        'pluginRoot' in m && enabledRoots.has(m.pluginRoot),
    )
    // 满足 `kept.length > 0` 时，插件管理执行该分支。
    if (kept.length > 0) survivors[event as HookEvent] = kept
  }

  // 调用 clearRegisteredPluginHooks，触发插件管理此处需要的副作用。
  clearRegisteredPluginHooks()
  // 调用 registerHookCallbacks，触发插件管理此处需要的副作用。
  registerHookCallbacks(survivors)
}

/**
 * Reset hot reload subscription state. Only for testing.
 */
// resetHotReloadState 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetHotReloadState(): void {
  // hotReloadSubscribed更新为 `false`，确保插件工具后续读取最新状态。
  hotReloadSubscribed = false
  // lastPluginSettingsSnapshot 插件数据更新为 `undefined`，确保插件工具后续读取最新状态。
  lastPluginSettingsSnapshot = undefined
}

/**
 * Build a stable string snapshot of the settings that feed into
 * `loadAllPluginsCacheOnly()` for change detection. Sorts keys so comparison is
 * deterministic regardless of insertion order.
 *
 * Hashes FOUR fields — not just enabledPlugins — because the memoized
 * loadAllPluginsCacheOnly() also reads strictKnownMarketplaces, blockedMarketplaces
 * (pluginLoader.ts:1933 via getBlockedMarketplaces), and
 * extraKnownMarketplaces. If remote managed settings set only one of
 * these (no enabledPlugins), a snapshot keyed only on enabledPlugins
 * would never diff, the listener would skip, and the memoized result
 * would retain the pre-remote marketplace allow/blocklist.
 * See #23085 / #23152 poisoned-cache discussion (Slack C09N89L3VNJ).
 */
// Exported for testing — the listener at setupPluginHookHotReload uses this
// for change detection; tests verify it diffs on the fields that matter.
// getPluginAffectingSettingsSnapshot 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginAffectingSettingsSnapshot(): string {
  // merged读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
  const merged = getSettings_DEPRECATED()
  // policy读取`getSettingsForSource`，供插件管理后续处理使用。
  const policy = getSettingsForSource('policySettings')
  // Key-sort the two Record fields so insertion order doesn't flap the hash.
  // Array fields (strictKnownMarketplaces, blockedMarketplaces) have
  // schema-stable order.
  // sortKeys 集合封装成回调，供插件工具 load Plugin Hooks在事件触发或异步步骤中调用。
  const sortKeys = <T extends Record<string, unknown>>(o: T | undefined) =>
    o ? Object.fromEntries(Object.entries(o).sort()) : {}
  // 返回 `jsonStringify({`，作为插件管理这次计算的结果。
  return jsonStringify({
    enabledPlugins: sortKeys(merged.enabledPlugins),
    extraKnownMarketplaces: sortKeys(merged.extraKnownMarketplaces),
    strictKnownMarketplaces: policy?.strictKnownMarketplaces ?? [],
    blockedMarketplaces: policy?.blockedMarketplaces ?? [],
  })
}

/**
 * Set up hot reload for plugin hooks when remote settings change.
 * When policySettings changes (e.g., from remote managed settings),
 * compares the plugin-affecting settings snapshot and only reloads if it
 * actually changed.
 */
// setupPluginHookHotReload 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setupPluginHookHotReload(): void {
  // 满足 `hotReloadSubscribed` 时，插件管理执行该分支。
  if (hotReloadSubscribed) {
    // 插件工具 load Plugin Hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // hotReloadSubscribed更新为 `true`，确保插件工具后续读取最新状态。
  hotReloadSubscribed = true

  // Capture the initial snapshot so the first policySettings change can compare
  // lastPluginSettingsSnapshot 插件数据更新为 `getPluginAffectingSettingsSnapshot()`，确保插件工具后续读取最新状态。
  lastPluginSettingsSnapshot = getPluginAffectingSettingsSnapshot()

  // 调用 settingsChangeDetector.subscribe，触发插件管理此处需要的副作用。
  settingsChangeDetector.subscribe(source => {
    // 当 `source` 匹配 `'policySettings'` 时，插件管理执行对应分支。
    if (source === 'policySettings') {
      // newSnapshot读取`getPluginAffectingSettingsSnapshot`，供插件管理后续处理使用。
      const newSnapshot = getPluginAffectingSettingsSnapshot()
      // 满足 `newSnapshot === lastPluginSettingsSnapshot` 时，插件管理执行该分支。
      if (newSnapshot === lastPluginSettingsSnapshot) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Plugin hooks: skipping reload, plugin-affecting settings unchanged',
        )
        // 插件工具 load Plugin Hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // lastPluginSettingsSnapshot 插件数据更新为 `newSnapshot`，确保插件工具后续读取最新状态。
      lastPluginSettingsSnapshot = newSnapshot
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Plugin hooks: reloading due to plugin-affecting settings change',
      )

      // Clear all plugin-related caches
      // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
      clearPluginCache('loadPluginHooks: plugin-affecting settings changed')
      // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
      clearPluginHookCache()

      // Reload hooks (fire-and-forget, don't block)
      // 显式忽略 `loadPluginHooks()` 的返回值，只保留它触发的副作用。
      void loadPluginHooks()
    }
  })
}
