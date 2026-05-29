/**
 * Color command - minimal metadata only.
 * Implementation is lazy-loaded from color.ts to reduce startup time.
 */
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// color 集中保存命令处理斜杠命令 index要一起传递的字段。
const color = {
  type: 'local-jsx',
  name: 'color',
  description: 'Set the prompt bar color for this session',
  immediate: true,
  argumentHint: '<color|default>',
  // 这个回调绑定到 load: () => import('./color.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./color.js'),
} satisfies Command

export default color
