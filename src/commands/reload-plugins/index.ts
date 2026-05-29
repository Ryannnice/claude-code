/**
 * /reload-plugins — Layer-3 refresh. Applies pending plugin changes to the
 * running session. Implementation lazy-loaded.
 */
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// reloadPlugins 插件数据 集中保存命令处理斜杠命令 index要一起传递的字段。
const reloadPlugins = {
  type: 'local',
  name: 'reload-plugins',
  description: 'Activate pending plugin changes in the current session',
  // SDK callers use query.reloadPlugins() (control request) instead of
  // sending this as a text prompt — that returns structured data
  // (commands, agents, plugins, mcpServers) for UI updates.
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => import('./reload-plugins.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./reload-plugins.js'),
} satisfies Command

export default reloadPlugins
