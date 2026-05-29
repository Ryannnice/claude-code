// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'

// Local date, not UTC — 24h rolling wave across timezones. Sustained Twitter
// buzz instead of a single UTC-midnight spike, gentler on soul-gen load.
// Teaser window: April 1-7, 2026 only. Command stays live forever after.
// isBuddyTeaserWindow 封装availability的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBuddyTeaserWindow(): boolean {
  // 当 `'external'` 匹配 `'ant'` 时，availability执行对应分支。
  if ('external' === 'ant') return true
  // d记录时间`Date`，供availability后续处理使用。
  const d = new Date()
  // 返回 `d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7`，作为availability这次计算的结果。
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7
}

// isBuddyLive 封装availability的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBuddyLive(): boolean {
  // 当 `'external'` 匹配 `'ant'` 时，availability执行对应分支。
  if ('external' === 'ant') return true
  // d记录时间`Date`，供availability后续处理使用。
  const d = new Date()
  // 返回 `d.getFullYear() > 2026 || (d.getFullYear() === 2026 && d.getMonth() >= ...`，作为availability这次计算的结果。
  return d.getFullYear() > 2026 || (d.getFullYear() === 2026 && d.getMonth() >= 3)
}

// isBuddyEnabled 封装availability的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBuddyEnabled(): boolean {
  // 当 `process.env.CLAUDE_CODE_DISABLE_BUDDY` 匹配 `'1'` 时，availability执行对应分支。
  if (process.env.CLAUDE_CODE_DISABLE_BUDDY === '1') return false
  // 满足 `feature('BUDDY')` 时，availability执行该分支。
  if (feature('BUDDY')) return true
  // 当 `process.env.CLAUDE_CODE_ENABLE_BUDDY` 匹配 `'1'` 时，availability执行对应分支。
  if (process.env.CLAUDE_CODE_ENABLE_BUDDY === '1') return true
  // 返回 `isBuddyLive()`，作为availability这次计算的结果。
  return isBuddyLive()
}
