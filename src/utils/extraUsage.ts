// 引入 isClaudeAISubscriber，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { isClaudeAISubscriber } from './auth.js'
// 引入 has1mContext，将 ./context.js 中已经封装好的能力接到本文件流程里。
import { has1mContext } from './context.js'

// isBilledAsExtraUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBilledAsExtraUsage(
  model: string | null,
  isFastMode: boolean,
  isOpus1mMerged: boolean,
): boolean {
  // 满足 `!isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (!isClaudeAISubscriber()) return false
  // 满足 `isFastMode` 时，共享工具执行该分支。
  if (isFastMode) return true
  // 只有 `model === null || !has1mContext(model)` 满足时，共享工具才执行该分支。
  if (model === null || !has1mContext(model)) return false

  // m保存`model`，供共享工具 extra Usage后续判断或输出使用。
  const m = model
    .toLowerCase()
    .replace(/\[1m\]$/, '')
    .trim()
  // isOpus46记录 `m.includes` 是否成立，共享工具随后按该结果分支。
  const isOpus46 = m === 'opus' || m.includes('opus-4-6')
  // isSonnet46记录 `m.includes` 是否成立，共享工具随后按该结果分支。
  const isSonnet46 = m === 'sonnet' || m.includes('sonnet-4-6')

  // 只有 `isOpus46 && isOpus1mMerged` 满足时，共享工具才执行该分支。
  if (isOpus46 && isOpus1mMerged) return false

  // 返回 `isOpus46 || isSonnet46`，作为共享工具这次计算的结果。
  return isOpus46 || isSonnet46
}
