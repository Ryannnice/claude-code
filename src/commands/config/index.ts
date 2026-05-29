// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// 配置 集中保存命令处理斜杠命令 index要一起传递的字段。
const config = {
  aliases: ['settings'],
  type: 'local-jsx',
  name: 'config',
  description: 'Open config panel',
  // 这个回调绑定到 load: () => import('./config.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./config.js'),
} satisfies Command

export default config
