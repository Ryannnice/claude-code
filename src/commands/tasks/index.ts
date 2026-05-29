// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// tasks 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const tasks = {
  type: 'local-jsx',
  name: 'tasks',
  aliases: ['bashes'],
  description: 'List and manage background tasks',
  // 这个回调绑定到 load: () => import('./tasks.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./tasks.js'),
} satisfies Command

export default tasks
