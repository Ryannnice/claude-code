// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// plan 集中保存命令处理斜杠命令 index要一起传递的字段。
const plan = {
  type: 'local-jsx',
  name: 'plan',
  description: 'Enable plan mode or view the current session plan',
  argumentHint: '[open|<description>]',
  // 这个回调绑定到 load: () => import('./plan.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./plan.js'),
} satisfies Command

export default plan
