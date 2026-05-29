/**
 * Copy command - minimal metadata only.
 * Implementation is lazy-loaded from copy.tsx to reduce startup time.
 */
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// copy 集中保存命令处理斜杠命令 index要一起传递的字段。
const copy = {
  type: 'local-jsx',
  name: 'copy',
  description:
    "Copy Claude's last response to clipboard (or /copy N for the Nth-latest)",
  // 这个回调绑定到 load: () => import('./copy.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./copy.js'),
} satisfies Command

export default copy
