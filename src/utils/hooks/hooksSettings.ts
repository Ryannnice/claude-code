// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { resolve } from 'path'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 类型依赖 { EditableSettingSource } 来自 ../settings/constants.js，用于校准共享工具的数据契约。
import type { EditableSettingSource } from '../settings/constants.js'
// 引入 SOURCES，将 ../settings/constants.js 中已经封装好的能力接到本文件流程里。
import { SOURCES } from '../settings/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettingsFilePathForSource,
  getSettingsForSource,
} from '../settings/settings.js'
// 类型依赖 { HookCommand, HookMatcher } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HookCommand, HookMatcher } from '../settings/types.js'
// 引入 DEFAULT_HOOK_SHELL，将 ../shell/shellProvider.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_HOOK_SHELL } from '../shell/shellProvider.js'
// 引入 getSessionHooks，将 ./sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { getSessionHooks } from './sessionHooks.js'

// HookSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookSource =
  | EditableSettingSource
  | 'policySettings'
  | 'pluginHook'
  | 'sessionHook'
  | 'builtinHook'

// IndividualHookConfig 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IndividualHookConfig {
  event: HookEvent
  config: HookCommand
  matcher?: string
  source: HookSource
  pluginName?: string
}

/**
 * Check if two hooks are equal (comparing only command/prompt content, not timeout)
 */
// isHookEqual 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isHookEqual(
  a: HookCommand | { type: 'function'; timeout?: number },
  b: HookCommand | { type: 'function'; timeout?: number },
): boolean {
  // `a.type` 与 `b.type` 不一致时刷新派生状态，避免使用过期结果。
  if (a.type !== b.type) return false

  // Use switch for exhaustive type checking
  // Note: We only compare command/prompt content, not timeout
  // `if` is part of identity: same command with different `if` conditions
  // are distinct hooks (e.g., setup.sh if=Bash(git *) vs if=Bash(npm *)).
  // sameIf封装成回调，供共享工具React hook hooks Settings在事件触发或异步步骤中调用。
  const sameIf = (x: { if?: string }, y: { if?: string }) =>
    (x.if ?? '') === (y.if ?? '')
  // 按照 a.type 的取值选择共享工具的具体处理分支。
  switch (a.type) {
    case 'command':
      // shell is part of identity: same command string with different
      // shells are distinct hooks. Default 'bash' so undefined === 'bash'.
      // 返回 `(`，作为共享工具这次计算的结果。
      return (
        b.type === 'command' &&
        a.command === b.command &&
        (a.shell ?? DEFAULT_HOOK_SHELL) === (b.shell ?? DEFAULT_HOOK_SHELL) &&
        sameIf(a, b)
      )
    case 'prompt':
      // 返回 `b.type === 'prompt' && a.prompt === b.prompt && sameIf(a, b)`，作为共享工具这次计算的结果。
      return b.type === 'prompt' && a.prompt === b.prompt && sameIf(a, b)
    case 'agent':
      // 返回 `b.type === 'agent' && a.prompt === b.prompt && sameIf(a, b)`，作为共享工具这次计算的结果。
      return b.type === 'agent' && a.prompt === b.prompt && sameIf(a, b)
    case 'http':
      // 返回 `b.type === 'http' && a.url === b.url && sameIf(a, b)`，作为共享工具这次计算的结果。
      return b.type === 'http' && a.url === b.url && sameIf(a, b)
    case 'function':
      // Function hooks can't be compared (no stable identifier)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

/** Get the display text for a hook */
// getHookDisplayText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHookDisplayText(
  hook: HookCommand | { type: 'callback' | 'function'; statusMessage?: string },
): string {
  // Return custom status message if provided
  // 只有 `'statusMessage' in hook && hook.statusMessage` 满足时，共享工具才执行该分支。
  if ('statusMessage' in hook && hook.statusMessage) {
    // 返回 `hook.statusMessage`，作为共享工具这次计算的结果。
    return hook.statusMessage
  }

  // 按照 hook.type 的取值选择共享工具的具体处理分支。
  switch (hook.type) {
    case 'command':
      // 返回 `hook.command`，作为共享工具这次计算的结果。
      return hook.command
    case 'prompt':
      // 返回 `hook.prompt`，作为共享工具这次计算的结果。
      return hook.prompt
    case 'agent':
      // 返回 `hook.prompt`，作为共享工具这次计算的结果。
      return hook.prompt
    case 'http':
      // 返回 `hook.url`，作为共享工具这次计算的结果。
      return hook.url
    case 'callback':
      // 返回 `'callback'`，作为共享工具这次计算的结果。
      return 'callback'
    case 'function':
      // 返回 `'function'`，作为共享工具这次计算的结果。
      return 'function'
  }
}

// getAllHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllHooks(appState: AppState): IndividualHookConfig[] {
  // hooks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const hooks: IndividualHookConfig[] = []

  // Check if restricted to managed hooks only
  // policySettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const policySettings = getSettingsForSource('policySettings')
  // restrictedToManagedOnly标记共享工具React hook hooks Settings是否启用对应路径。
  const restrictedToManagedOnly = policySettings?.allowManagedHooksOnly === true

  // If allowManagedHooksOnly is set, don't show any hooks in the UI
  // (user/project/local are blocked, and managed hooks are intentionally hidden)
  // restrictedToManagedOnly缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!restrictedToManagedOnly) {
    // Get hooks from all editable sources
    // sources 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const sources = [
      'userSettings',
      'projectSettings',
      'localSettings',
    ] as EditableSettingSource[]

    // Track which settings files we've already processed to avoid duplicates
    // (e.g., when running from home directory, userSettings and projectSettings
    // both resolve to ~/.claude/settings.json)
    // seenFiles 文件数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const seenFiles = new Set<string>()

    // 按顺序遍历 `sources` 中的source，逐个交给共享工具处理。
    for (const source of sources) {
      // 文件路径读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
      const filePath = getSettingsFilePathForSource(source)
      // 满足 `filePath` 时，共享工具执行该分支。
      if (filePath) {
        // resolvedPath 路径数据读取`resolve`，供共享工具后续处理使用。
        const resolvedPath = resolve(filePath)
        // 满足 `seenFiles.has(resolvedPath)` 时，共享工具执行该分支。
        if (seenFiles.has(resolvedPath)) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 调用 seenFiles.add，触发共享工具此处需要的副作用。
        seenFiles.add(resolvedPath)
      }

      // sourceSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
      const sourceSettings = getSettingsForSource(source)
      // 满足 `!sourceSettings?.hooks` 时，共享工具执行该分支。
      if (!sourceSettings?.hooks) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 循环处理 `const [event, matchers] of Object.entries(sourceSettings.hooks)`，让共享工具把同类条目按顺序走完。
      for (const [event, matchers] of Object.entries(sourceSettings.hooks)) {
        // 按顺序遍历 `matchers as HookMatcher[]` 中的matcher，逐个交给共享工具处理。
        for (const matcher of matchers as HookMatcher[]) {
          // 按顺序遍历 `matcher.hooks` 中的hookCommand 命令数据，逐个交给共享工具处理。
          for (const hookCommand of matcher.hooks) {
            // hooks 集合追加新条目，保持收集顺序与输入顺序一致。
            hooks.push({
              event: event as HookEvent,
              config: hookCommand,
              matcher: matcher.matcher,
              source,
            })
          }
        }
      }
    }
  }

  // Get session hooks
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // sessionHooks 会话数据读取`getSessionHooks`，供共享工具后续处理使用。
  const sessionHooks = getSessionHooks(appState, sessionId)
  // 循环处理 `const [event, matchers] of sessionHooks.entries()`，让共享工具把同类条目按顺序走完。
  for (const [event, matchers] of sessionHooks.entries()) {
    // 按顺序遍历 `matchers` 中的matcher，逐个交给共享工具处理。
    for (const matcher of matchers) {
      // 按顺序遍历 `matcher.hooks` 中的hookCommand 命令数据，逐个交给共享工具处理。
      for (const hookCommand of matcher.hooks) {
        // hooks 集合追加新条目，保持收集顺序与输入顺序一致。
        hooks.push({
          event,
          config: hookCommand,
          matcher: matcher.matcher,
          source: 'sessionHook',
        })
      }
    }
  }

  // 返回 `hooks`，作为共享工具这次计算的结果。
  return hooks
}

// getHooksForEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHooksForEvent(
  appState: AppState,
  event: HookEvent,
): IndividualHookConfig[] {
  // 返回 `getAllHooks(appState).filter(hook => hook.event === event)`，作为共享工具这次计算的结果。
  return getAllHooks(appState).filter(hook => hook.event === event)
}

// hookSourceDescriptionDisplayString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hookSourceDescriptionDisplayString(source: HookSource): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'User settings (~/.claude/settings.json)'`，作为共享工具这次计算的结果。
      return 'User settings (~/.claude/settings.json)'
    case 'projectSettings':
      // 返回 `'Project settings (.claude/settings.json)'`，作为共享工具这次计算的结果。
      return 'Project settings (.claude/settings.json)'
    case 'localSettings':
      // 返回 `'Local settings (.claude/settings.local.json)'`，作为共享工具这次计算的结果。
      return 'Local settings (.claude/settings.local.json)'
    case 'pluginHook':
      // TODO: Get the actual plugin hook file paths instead of using glob pattern
      // We should capture the specific plugin paths during hook registration and display them here
      // e.g., "Plugin hooks (~/.claude/plugins/repos/source/example-plugin/example-plugin/hooks/hooks.json)"
      // 返回 `'Plugin hooks (~/.claude/plugins/*/hooks/hooks.json)'`，作为共享工具这次计算的结果。
      return 'Plugin hooks (~/.claude/plugins/*/hooks/hooks.json)'
    case 'sessionHook':
      // 返回 `'Session hooks (in-memory, temporary)'`，作为共享工具这次计算的结果。
      return 'Session hooks (in-memory, temporary)'
    case 'builtinHook':
      // 返回 `'Built-in hooks (registered internally by Claude Code)'`，作为共享工具这次计算的结果。
      return 'Built-in hooks (registered internally by Claude Code)'
    default:
      // 返回 `source as string`，作为共享工具这次计算的结果。
      return source as string
  }
}

// hookSourceHeaderDisplayString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hookSourceHeaderDisplayString(source: HookSource): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'User Settings'`，作为共享工具这次计算的结果。
      return 'User Settings'
    case 'projectSettings':
      // 返回 `'Project Settings'`，作为共享工具这次计算的结果。
      return 'Project Settings'
    case 'localSettings':
      // 返回 `'Local Settings'`，作为共享工具这次计算的结果。
      return 'Local Settings'
    case 'pluginHook':
      // 返回 `'Plugin Hooks'`，作为共享工具这次计算的结果。
      return 'Plugin Hooks'
    case 'sessionHook':
      // 返回 `'Session Hooks'`，作为共享工具这次计算的结果。
      return 'Session Hooks'
    case 'builtinHook':
      // 返回 `'Built-in Hooks'`，作为共享工具这次计算的结果。
      return 'Built-in Hooks'
    default:
      // 返回 `source as string`，作为共享工具这次计算的结果。
      return source as string
  }
}

// hookSourceInlineDisplayString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hookSourceInlineDisplayString(source: HookSource): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'User'`，作为共享工具这次计算的结果。
      return 'User'
    case 'projectSettings':
      // 返回 `'Project'`，作为共享工具这次计算的结果。
      return 'Project'
    case 'localSettings':
      // 返回 `'Local'`，作为共享工具这次计算的结果。
      return 'Local'
    case 'pluginHook':
      // 返回 `'Plugin'`，作为共享工具这次计算的结果。
      return 'Plugin'
    case 'sessionHook':
      // 返回 `'Session'`，作为共享工具这次计算的结果。
      return 'Session'
    case 'builtinHook':
      // 返回 `'Built-in'`，作为共享工具这次计算的结果。
      return 'Built-in'
    default:
      // 返回 `source as string`，作为共享工具这次计算的结果。
      return source as string
  }
}

// sortMatchersByPriority 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sortMatchersByPriority(
  matchers: string[],
  hooksByEventAndMatcher: Record<
    string,
    Record<string, IndividualHookConfig[]>
  >,
  selectedEvent: HookEvent,
): string[] {
  // Create a priority map based on SOURCES order (lower index = higher priority)
  // sourcePriority派生`SOURCES.reduce`，供共享工具后续处理使用。
  const sourcePriority = SOURCES.reduce(
    // 这个回调绑定到 (acc, source, index) => {，负责共享工具在该局部场景下的响应。
    (acc, source, index) => {
      // acc[source更新为 `index`，确保React hook hooks Settings后续读取最新状态。
      acc[source] = index
      // 返回 `acc`，作为共享工具这次计算的结果。
      return acc
    },
    {} as Record<EditableSettingSource, number>,
  )

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...matchers].sort((a, b) => {
    // aHooks 集合标记共享工具React hook hooks Settings是否启用对应路径。
    const aHooks = hooksByEventAndMatcher[selectedEvent]?.[a] || []
    // bHooks 集合标记共享工具React hook hooks Settings是否启用对应路径。
    const bHooks = hooksByEventAndMatcher[selectedEvent]?.[b] || []

    // aSources 集合保存`Array.from`，供共享工具后续处理使用。
    const aSources = Array.from(new Set(aHooks.map(h => h.source)))
    // bSources 集合保存`Array.from`，供共享工具后续处理使用。
    const bSources = Array.from(new Set(bHooks.map(h => h.source)))

    // Sort by highest priority source first (lowest priority number)
    // Plugin hooks get lowest priority (highest number)
    // getSourcePriority封装成回调，供共享工具React hook hooks Settings在事件触发或异步步骤中调用。
    const getSourcePriority = (source: HookSource) =>
      source === 'pluginHook' || source === 'builtinHook'
        ? 999
        : sourcePriority[source as EditableSettingSource]

    // aHighestPriority保存`Math.min`，供共享工具后续处理使用。
    const aHighestPriority = Math.min(...aSources.map(getSourcePriority))
    // bHighestPriority保存`Math.min`，供共享工具后续处理使用。
    const bHighestPriority = Math.min(...bSources.map(getSourcePriority))

    // `aHighestPriority` 与 `bHighestPriority` 不一致时刷新派生状态，避免使用过期结果。
    if (aHighestPriority !== bHighestPriority) {
      // 返回 `aHighestPriority - bHighestPriority`，作为共享工具这次计算的结果。
      return aHighestPriority - bHighestPriority
    }

    // If same priority, sort by matcher name
    // 返回 `a.localeCompare(b)`，作为共享工具这次计算的结果。
    return a.localeCompare(b)
  })
}
