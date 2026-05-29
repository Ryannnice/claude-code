// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// status 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const status = {
  type: 'local-jsx',
  name: 'status',
  description:
    'Show Claude Code status including version, model, account, API connectivity, and tool statuses',
  immediate: true,
  // 这个回调绑定到 load: () => import('./status.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./status.js'),
} satisfies Command

export default status
