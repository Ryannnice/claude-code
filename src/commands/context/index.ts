// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// context 集中保存斜杠命令 index要一起传递的字段。
export const context: Command = {
  name: 'context',
  description: 'Visualize current context usage as a colored grid',
  // 这个回调绑定到 isEnabled: () => !getIsNonInteractiveSession(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local-jsx',
  // 这个回调绑定到 load: () => import('./context.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./context.js'),
}

// contextNonInteractive 集中保存斜杠命令 index要一起传递的字段。
export const contextNonInteractive: Command = {
  type: 'local',
  name: 'context',
  supportsNonInteractive: true,
  description: 'Show current context usage',
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!getIsNonInteractiveSession()`，作为命令处理这次计算的结果。
    return !getIsNonInteractiveSession()
  },
  // isEnabled 用 无 判断命令处理是否满足条件。
  isEnabled() {
    // 返回 `getIsNonInteractiveSession()`，作为命令处理这次计算的结果。
    return getIsNonInteractiveSession()
  },
  // 这个回调绑定到 load: () => import('./context-noninteractive.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./context-noninteractive.js'),
}
