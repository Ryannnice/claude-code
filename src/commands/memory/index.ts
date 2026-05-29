// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// memory 集中保存斜杠命令 index要一起传递的字段。
const memory: Command = {
  type: 'local-jsx',
  name: 'memory',
  description: 'Edit Claude memory files',
  // 这个回调绑定到 load: () => import('./memory.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./memory.js'),
}

export default memory
