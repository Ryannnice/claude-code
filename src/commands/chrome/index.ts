// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// 命令 集中保存斜杠命令 index要一起传递的字段。
const command: Command = {
  name: 'chrome',
  description: 'Claude in Chrome (Beta) settings',
  availability: ['claude-ai'],
  // 这个回调绑定到 isEnabled: () => !getIsNonInteractiveSession(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local-jsx',
  // 这个回调绑定到 load: () => import('./chrome.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./chrome.js'),
}

export default command
