// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'

// SKILL_USAGE_DEBOUNCE_MS 集合保存`60_000`，供共享工具 skill Usage Tracking后续判断或输出使用。
const SKILL_USAGE_DEBOUNCE_MS = 60_000

// Process-lifetime debounce cache — avoids lock + read + parse on debounced
// calls. Same pattern as lastConfigStatTime / globalConfigWriteCount in config.ts.
// lastWriteBySkill 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
const lastWriteBySkill = new Map<string, number>()

/**
 * Records a skill usage for ranking purposes.
 * Updates both usage count and last used timestamp.
 */
// recordSkillUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordSkillUsage(skillName: string): void {
  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()
  // lastWrite读取`lastWriteBySkill.get`，供共享工具后续处理使用。
  const lastWrite = lastWriteBySkill.get(skillName)
  // The ranking algorithm uses a 7-day half-life, so sub-minute granularity
  // is irrelevant. Bail out before saveGlobalConfig to avoid lock + file I/O.
  // `lastWrite` 与 `undefined && now - lastWrite < ...` 不一致时刷新派生状态，避免使用过期结果。
  if (lastWrite !== undefined && now - lastWrite < SKILL_USAGE_DEBOUNCE_MS) {
    // 共享工具 skill Usage Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // lastWriteBySkill.set 写入新的状态值，使共享工具后续读取保持一致。
  lastWriteBySkill.set(skillName, now)
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => {
    // existing保存`current.skillUsage?.[skillName]`，供共享工具 skill Usage Tracking后续判断或输出使用。
    const existing = current.skillUsage?.[skillName]
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...current,
      skillUsage: {
        ...current.skillUsage,
        [skillName]: {
          usageCount: (existing?.usageCount ?? 0) + 1,
          lastUsedAt: now,
        },
      },
    }
  })
}

/**
 * Calculates a usage score for a skill based on frequency and recency.
 * Higher scores indicate more frequently and recently used skills.
 *
 * The score uses exponential decay with a half-life of 7 days,
 * meaning usage from 7 days ago is worth half as much as usage today.
 */
// getSkillUsageScore 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSkillUsageScore(skillName: string): number {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // usage读取 `config.skillUsage?.[skillName]` 对应条目，后续围绕该成员继续处理。
  const usage = config.skillUsage?.[skillName]
  // usage缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!usage) return 0

  // Recency decay: halve score every 7 days
  // daysSinceUse记录时间`Date.now`，供共享工具后续处理使用。
  const daysSinceUse = (Date.now() - usage.lastUsedAt) / (1000 * 60 * 60 * 24)
  // recencyFactor保存`Math.pow`，供共享工具后续处理使用。
  const recencyFactor = Math.pow(0.5, daysSinceUse / 7)

  // Minimum recency factor of 0.1 to avoid completely dropping old but heavily used skills
  // 返回 `usage.usageCount * Math.max(recencyFactor, 0.1)`，作为共享工具这次计算的结果。
  return usage.usageCount * Math.max(recencyFactor, 0.1)
}
