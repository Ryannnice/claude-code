// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js'

// rateLimitOptions 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const rateLimitOptions = {
  type: 'local-jsx',
  name: 'rate-limit-options',
  description: 'Show options when rate limit is reached',
  // 这个回调绑定到 isEnabled: () => {，负责命令处理在该局部场景下的响应。
  isEnabled: () => {
    // 满足 `!isClaudeAISubscriber()` 时，命令处理执行该分支。
    if (!isClaudeAISubscriber()) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  isHidden: true, // Hidden from help - only used internally
  // 这个回调绑定到 load: () => import('./rate-limit-options.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./rate-limit-options.js'),
} satisfies Command

export default rateLimitOptions
