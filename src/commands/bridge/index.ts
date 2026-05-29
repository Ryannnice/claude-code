// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 isBridgeEnabled，将 ../../bridge/bridgeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isBridgeEnabled } from '../../bridge/bridgeEnabled.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// isEnabled 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEnabled(): boolean {
  // 满足 `!feature('BRIDGE_MODE')` 时，命令处理执行该分支。
  if (!feature('BRIDGE_MODE')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `isBridgeEnabled()`，作为命令处理这次计算的结果。
  return isBridgeEnabled()
}

// bridge 集中保存命令处理斜杠命令 index要一起传递的字段。
const bridge = {
  type: 'local-jsx',
  name: 'remote-control',
  aliases: ['rc'],
  description: 'Connect this terminal for remote-control sessions',
  argumentHint: '[name]',
  isEnabled,
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!isEnabled()`，作为命令处理这次计算的结果。
    return !isEnabled()
  },
  immediate: true,
  // 这个回调绑定到 load: () => import('./bridge.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./bridge.js'),
} satisfies Command

export default bridge
