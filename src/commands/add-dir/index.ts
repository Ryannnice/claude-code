// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// addDir 集中保存命令处理斜杠命令 index要一起传递的字段。
const addDir = {
  type: 'local-jsx',
  name: 'add-dir',
  description: 'Add a new working directory',
  argumentHint: '<path>',
  // 这个回调绑定到 load: () => import('./add-dir.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./add-dir.js'),
} satisfies Command

export default addDir
