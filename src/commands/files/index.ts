// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// files 文件数据 集中保存命令处理斜杠命令 index要一起传递的字段。
const files = {
  type: 'local',
  name: 'files',
  description: 'List all files currently in context',
  // 这个回调绑定到 isEnabled: () => process.env.USER_TYPE === 'ant',，负责命令处理在该局部场景下的响应。
  isEnabled: () => process.env.USER_TYPE === 'ant',
  supportsNonInteractive: true,
  // 这个回调绑定到 load: () => import('./files.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./files.js'),
} satisfies Command

export default files
