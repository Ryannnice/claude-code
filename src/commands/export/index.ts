// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// exportCommand 命令数据 集中保存命令处理斜杠命令 index要一起传递的字段。
const exportCommand = {
  type: 'local-jsx',
  name: 'export',
  description: 'Export the current conversation to a file or clipboard',
  argumentHint: '[filename]',
  // 这个回调绑定到 load: () => import('./export.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./export.js'),
} satisfies Command

export default exportCommand
