// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// agents 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const agents = {
  type: 'local-jsx',
  name: 'agents',
  description: 'Manage agent configurations',
  // 这个回调绑定到 load: () => import('./agents.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./agents.js'),
} satisfies Command

export default agents
