// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'

// This ensures you get the LOCAL date in ISO format
// getLocalISODate 封装common的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLocalISODate(): string {
  // Check for ant-only date override
  // 满足 `process.env.CLAUDE_CODE_OVERRIDE_DATE` 时，common执行该分支。
  if (process.env.CLAUDE_CODE_OVERRIDE_DATE) {
    // 返回 `process.env.CLAUDE_CODE_OVERRIDE_DATE`，作为common这次计算的结果。
    return process.env.CLAUDE_CODE_OVERRIDE_DATE
  }

  // now记录时间`Date`，供common后续处理使用。
  const now = new Date()
  // year读取`now.getFullYear`，供common后续处理使用。
  const year = now.getFullYear()
  // month保存`String`，供common后续处理使用。
  const month = String(now.getMonth() + 1).padStart(2, '0')
  // day保存`String`，供common后续处理使用。
  const day = String(now.getDate()).padStart(2, '0')
  // 返回 ``${year}-${month}-${day}``，作为common这次计算的结果。
  return `${year}-${month}-${day}`
}

// Memoized for prompt-cache stability — captures the date once at session start.
// The main interactive path gets this behavior via memoize(getUserContext) in
// context.ts; simple mode (--bare) calls getSystemPrompt per-request and needs
// an explicit memoized date to avoid busting the cached prefix at midnight.
// When midnight rolls over, getDateChangeAttachments appends the new date at
// the tail (though simple mode disables attachments, so the trade-off there is:
// stale date after midnight vs. ~entire-conversation cache bust — stale wins).
// getSessionStartDate 会话数据保存`memoize`，供common后续处理使用。
export const getSessionStartDate = memoize(getLocalISODate)

// Returns "Month YYYY" (e.g. "February 2026") in the user's local timezone.
// Changes monthly, not daily — used in tool prompts to minimize cache busting.
// getLocalMonthYear 封装common的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLocalMonthYear(): string {
  // date 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const date = process.env.CLAUDE_CODE_OVERRIDE_DATE
    ? new Date(process.env.CLAUDE_CODE_OVERRIDE_DATE)
    : new Date()
  // 返回 `date.toLocaleString('en-US', { month: 'long', year: 'numeric' })`，作为common这次计算的结果。
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
