// 引入 formatTotalCost，将 ../../cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { formatTotalCost } from '../../cost-tracker.js'
// 接入 currentLimits 服务层能力，把外部通信或共享状态交给 ../../services/claudeAiLimits.js 处理。
import { currentLimits } from '../../services/claudeAiLimits.js'
// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js'

// 这个回调绑定到 export const call: LocalCommandCall = async () => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async () => {
  // 满足 `isClaudeAISubscriber()` 时，命令处理执行该分支。
  if (isClaudeAISubscriber()) {
    // 取值 先占位，稍后的条件分支会根据实际输入补齐它。
    let value: string

    // 满足 `currentLimits.isUsingOverage` 时，命令处理执行该分支。
    if (currentLimits.isUsingOverage) {
      // 斜杠命令 cost在这里处理 `value =`，完成这一小步状态转换。
      value =
        'You are currently using your overages to power your Claude Code usage. We will automatically switch you back to your subscription rate limits when they reset'
    } else {
      // 斜杠命令 cost在这里处理 `value =`，完成这一小步状态转换。
      value =
        'You are currently using your subscription to power your Claude Code usage'
    }

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 斜杠命令 cost在这里处理 `value += `\n\n[ANT-ONLY] Showing cost anyway:\n ${formatTotalCost()}``，完成这一小步状态转换。
      value += `\n\n[ANT-ONLY] Showing cost anyway:\n ${formatTotalCost()}`
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text', value }
  }
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'text', value: formatTotalCost() }
}
