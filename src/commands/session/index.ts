// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// session 会话数据 集中保存命令处理斜杠命令 index要一起传递的字段。
const session = {
  type: 'local-jsx',
  name: 'session',
  aliases: ['remote'],
  description: 'Show remote session URL and QR code',
  // 这个回调绑定到 isEnabled: () => getIsRemoteMode(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => getIsRemoteMode(),
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!getIsRemoteMode()`，作为命令处理这次计算的结果。
    return !getIsRemoteMode()
  },
  // 这个回调绑定到 load: () => import('./session.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./session.js'),
} satisfies Command

export default session
