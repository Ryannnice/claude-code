/**
 * Built-in Plugin Registry
 *
 * Manages built-in plugins that ship with the CLI and can be enabled/disabled
 * by users via the /plugin UI.
 *
 * Built-in plugins differ from bundled skills (src/skills/bundled/) in that:
 * - They appear in the /plugin UI under a "Built-in" section
 * - Users can enable/disable them (persisted to user settings)
 * - They can provide multiple components (skills, hooks, MCP servers)
 *
 * Plugin IDs use the format `{name}@builtin` to distinguish them from
 * marketplace plugins (`{name}@{marketplace}`).
 */

// 类型依赖 { Command } 来自 ../commands.js，用于校准builtin Plugins的数据契约。
import type { Command } from '../commands.js'
// 类型依赖 { BundledSkillDefinition } 来自 ../skills/bundledSkills.js，用于校准builtin Plugins的数据契约。
import type { BundledSkillDefinition } from '../skills/bundledSkills.js'
// 类型依赖 { BuiltinPluginDefinition, LoadedPlugin } 来自 ../types/plugin.js，用于校准builtin Plugins的数据契约。
import type { BuiltinPluginDefinition, LoadedPlugin } from '../types/plugin.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'

// BUILTIN_PLUGINS 插件数据 用 Map 保存键值关系，方便builtin Plugins按 key 查找和复用。
const BUILTIN_PLUGINS: Map<string, BuiltinPluginDefinition> = new Map()

// BUILTIN_MARKETPLACE_NAME 市场数据保存`'builtin'`，作为后续固定文本处理的输入。
export const BUILTIN_MARKETPLACE_NAME = 'builtin'

/**
 * Register a built-in plugin. Call this from initBuiltinPlugins() at startup.
 */
// registerBuiltinPlugin 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerBuiltinPlugin(
  definition: BuiltinPluginDefinition,
): void {
  // BUILTIN_PLUGINS.set 写入新的状态值，使builtin Plugins后续读取保持一致。
  BUILTIN_PLUGINS.set(definition.name, definition)
}

/**
 * Check if a plugin ID represents a built-in plugin (ends with @builtin).
 */
// isBuiltinPluginId 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBuiltinPluginId(pluginId: string): boolean {
  // 返回 `pluginId.endsWith(`@${BUILTIN_MARKETPLACE_NAME}`)`，作为builtin Plugins这次计算的结果。
  return pluginId.endsWith(`@${BUILTIN_MARKETPLACE_NAME}`)
}

/**
 * Get a specific built-in plugin definition by name.
 * Useful for the /plugin UI to show the skills/hooks/MCP list without
 * a marketplace lookup.
 */
// getBuiltinPluginDefinition 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBuiltinPluginDefinition(
  name: string,
): BuiltinPluginDefinition | undefined {
  // 返回 `BUILTIN_PLUGINS.get(name)`，作为builtin Plugins这次计算的结果。
  return BUILTIN_PLUGINS.get(name)
}

/**
 * Get all registered built-in plugins as LoadedPlugin objects, split into
 * enabled/disabled based on user settings (with defaultEnabled as fallback).
 * Plugins whose isAvailable() returns false are omitted entirely.
 */
// getBuiltinPlugins 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBuiltinPlugins(): {
  enabled: LoadedPlugin[]
  disabled: LoadedPlugin[]
} {
  // settings 集合读取`getSettings_DEPRECATED`，供builtin Plugins后续处理使用。
  const settings = getSettings_DEPRECATED()
  // enabled 从空数组开始收集，后续循环会按处理顺序追加条目。
  const enabled: LoadedPlugin[] = []
  // disabled 从空数组开始收集，后续循环会按处理顺序追加条目。
  const disabled: LoadedPlugin[] = []

  // 循环处理 `const [name, definition] of BUILTIN_PLUGINS`，让builtin Plugins逐项把同类条目按顺序走完。
  for (const [name, definition] of BUILTIN_PLUGINS) {
    // 组合条件 `definition.isAvailable && !definition.isAvailable()` 成立时，builtin Plugins才启用这条专门路径。
    if (definition.isAvailable && !definition.isAvailable()) {
      // 跳过当前项，继续处理builtin Plugins中的下一轮循环。
      continue
    }

    // pluginId 插件数据保存``${name}@${BUILTIN_MARKETPLACE_NAME}``，作为后续固定文本处理的输入。
    const pluginId = `${name}@${BUILTIN_MARKETPLACE_NAME}`
    // userSetting读取 `settings?.enabledPlugins?.[pluginId]` 对应条目，后续围绕该成员继续处理。
    const userSetting = settings?.enabledPlugins?.[pluginId]
    // Enabled state: user preference > plugin default > true
    // isEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isEnabled =
      userSetting !== undefined
        ? userSetting === true
        : (definition.defaultEnabled ?? true)

    // plugin 插件数据 集中保存builtin Plugins要一起传递的字段。
    const plugin: LoadedPlugin = {
      name,
      manifest: {
        name,
        description: definition.description,
        version: definition.version,
      },
      path: BUILTIN_MARKETPLACE_NAME, // sentinel — no filesystem path
      source: pluginId,
      repository: pluginId,
      enabled: isEnabled,
      isBuiltin: true,
      hooksConfig: definition.hooks,
      mcpServers: definition.mcpServers,
    }

    // 满足 `isEnabled` 时，builtin Plugins执行该分支。
    if (isEnabled) {
      // enabled追加新条目，保持收集顺序与输入顺序一致。
      enabled.push(plugin)
    } else {
      // disabled追加新条目，保持收集顺序与输入顺序一致。
      disabled.push(plugin)
    }
  }

  // 返回结构化结果，集中表达builtin Plugins已经整理出的状态。
  return { enabled, disabled }
}

/**
 * Get skills from enabled built-in plugins as Command objects.
 * Skills from disabled plugins are not returned.
 */
// getBuiltinPluginSkillCommands 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBuiltinPluginSkillCommands(): Command[] {
  // 从 `getBuiltinPlugins()` 解构 enabled，减少builtin Plugins对同一对象的重复访问。
  const { enabled } = getBuiltinPlugins()
  // commands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const commands: Command[] = []

  // 按顺序遍历 `enabled` 中的plugin 插件数据，逐个交给builtin Plugins处理。
  for (const plugin of enabled) {
    // definition读取`BUILTIN_PLUGINS.get`，供builtin Plugins后续处理使用。
    const definition = BUILTIN_PLUGINS.get(plugin.name)
    // 满足 `!definition?.skills` 时，builtin Plugins执行该分支。
    if (!definition?.skills) continue
    // 按顺序遍历 `definition.skills` 中的skill，逐个交给builtin Plugins处理。
    for (const skill of definition.skills) {
      // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commands.push(skillDefinitionToCommand(skill))
    }
  }

  // 返回 `commands`，作为builtin Plugins这次计算的结果。
  return commands
}

/**
 * Clear built-in plugins registry (for testing).
 */
// clearBuiltinPlugins 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBuiltinPlugins(): void {
  // 调用 BUILTIN_PLUGINS.clear，触发builtin Plugins此处需要的副作用。
  BUILTIN_PLUGINS.clear()
}

// --

// skillDefinitionToCommand 封装builtinPlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function skillDefinitionToCommand(definition: BundledSkillDefinition): Command {
  // 返回结构化结果，集中表达builtin Plugins已经整理出的状态。
  return {
    type: 'prompt',
    name: definition.name,
    description: definition.description,
    hasUserSpecifiedDescription: true,
    allowedTools: definition.allowedTools ?? [],
    argumentHint: definition.argumentHint,
    whenToUse: definition.whenToUse,
    model: definition.model,
    disableModelInvocation: definition.disableModelInvocation ?? false,
    userInvocable: definition.userInvocable ?? true,
    contentLength: 0,
    // 'bundled' not 'builtin' — 'builtin' in Command.source means hardcoded
    // slash commands (/help, /clear). Using 'bundled' keeps these skills in
    // the Skill tool's listing, analytics name logging, and prompt-truncation
    // exemption. The user-toggleable aspect is tracked on LoadedPlugin.isBuiltin.
    source: 'bundled',
    loadedFrom: 'bundled',
    hooks: definition.hooks,
    context: definition.context,
    agent: definition.agent,
    // 这个回调绑定到 isEnabled: definition.isEnabled ?? (() => true),，负责builtin Plugins在该局部场景下的响应。
    isEnabled: definition.isEnabled ?? (() => true),
    isHidden: !(definition.userInvocable ?? true),
    progressMessage: 'running',
    getPromptForCommand: definition.getPromptForCommand,
  }
}
