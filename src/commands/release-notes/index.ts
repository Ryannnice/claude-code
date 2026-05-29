// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// releaseNotes 集合 集中保存斜杠命令 index要一起传递的字段。
const releaseNotes: Command = {
  description: 'View release notes',
  name: 'release-notes',
  type: 'local',
  supportsNonInteractive: true,
  // 这个回调绑定到 load: () => import('./release-notes.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./release-notes.js'),
}

export default releaseNotes
