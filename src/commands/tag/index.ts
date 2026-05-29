// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// tag 集中保存命令处理斜杠命令 index要一起传递的字段。
const tag = {
  type: 'local-jsx',
  name: 'tag',
  description: 'Toggle a searchable tag on the current session',
  // 这个回调绑定到 isEnabled: () => process.env.USER_TYPE === 'ant',，负责命令处理在该局部场景下的响应。
  isEnabled: () => process.env.USER_TYPE === 'ant',
  argumentHint: '<tag-name>',
  // 这个回调绑定到 load: () => import('./tag.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./tag.js'),
} satisfies Command

export default tag
