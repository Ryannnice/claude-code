// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

export default {
  type: 'local-jsx',
  name: 'diff',
  description: 'View uncommitted changes and per-turn diffs',
  // 这个回调绑定到 load: () => import('./diff.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./diff.js'),
} satisfies Command
