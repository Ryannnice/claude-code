// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// mobile 集中保存命令处理斜杠命令 index要一起传递的字段。
const mobile = {
  type: 'local-jsx',
  name: 'mobile',
  aliases: ['ios', 'android'],
  description: 'Show QR code to download the Claude mobile app',
  // 这个回调绑定到 load: () => import('./mobile.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./mobile.js'),
} satisfies Command

export default mobile
