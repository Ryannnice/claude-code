// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// rewind 集中保存命令处理斜杠命令 index要一起传递的字段。
const rewind = {
  description: `Restore the code and/or conversation to a previous point`,
  name: 'rewind',
  aliases: ['checkpoint'],
  argumentHint: '',
  type: 'local',
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => import('./rewind.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./rewind.js'),
} satisfies Command

export default rewind
