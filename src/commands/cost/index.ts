/**
 * Cost command - minimal metadata only.
 * Implementation is lazy-loaded from cost.ts to reduce startup time.
 */
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js'

// cost 集中保存命令处理斜杠命令 index要一起传递的字段。
const cost = {
  type: 'local',
  name: 'cost',
  description: 'Show the total cost and duration of the current session',
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // Keep visible for Ants even if they're subscribers (they see cost breakdowns)
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 `isClaudeAISubscriber()`，作为命令处理这次计算的结果。
    return isClaudeAISubscriber()
  },
  supportsNonInteractive: true,
  // 这个回调绑定到 load: () => import('./cost.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./cost.js'),
} satisfies Command

export default cost
