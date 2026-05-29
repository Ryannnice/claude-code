// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// resume 集中保存斜杠命令 index要一起传递的字段。
const resume: Command = {
  type: 'local-jsx',
  name: 'resume',
  description: 'Resume a previous conversation',
  aliases: ['continue'],
  argumentHint: '[conversation id or search term]',
  // 这个回调绑定到 load: () => import('./resume.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./resume.js'),
}

export default resume
