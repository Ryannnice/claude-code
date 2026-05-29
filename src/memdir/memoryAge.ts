/**
 * Days elapsed since mtime.  Floor-rounded — 0 for today, 1 for
 * yesterday, 2+ for older.  Negative inputs (future mtime, clock skew)
 * clamp to 0.
 */
// memoryAgeDays 封装memoryAge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryAgeDays(mtimeMs: number): number {
  // 返回 `Math.max(0, Math.floor((Date.now() - mtimeMs) / 86_400_000))`，作为memory Age这次计算的结果。
  return Math.max(0, Math.floor((Date.now() - mtimeMs) / 86_400_000))
}

/**
 * Human-readable age string.  Models are poor at date arithmetic —
 * a raw ISO timestamp doesn't trigger staleness reasoning the way
 * "47 days ago" does.
 */
// memoryAge 封装memoryAge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryAge(mtimeMs: number): string {
  // d保存`memoryAgeDays`，供memory Age后续处理使用。
  const d = memoryAgeDays(mtimeMs)
  // 满足 `d === 0` 时，memory Age执行该分支。
  if (d === 0) return 'today'
  // 满足 `d === 1` 时，memory Age执行该分支。
  if (d === 1) return 'yesterday'
  // 返回 ``${d} days ago``，作为memory Age这次计算的结果。
  return `${d} days ago`
}

/**
 * Plain-text staleness caveat for memories >1 day old.  Returns ''
 * for fresh (today/yesterday) memories — warning there is noise.
 *
 * Use this when the consumer already provides its own wrapping
 * (e.g. messages.ts relevant_memories → wrapMessagesInSystemReminder).
 *
 * Motivated by user reports of stale code-state memories (file:line
 * citations to code that has since changed) being asserted as fact —
 * the citation makes the stale claim sound more authoritative, not less.
 */
// memoryFreshnessText 封装memoryAge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryFreshnessText(mtimeMs: number): string {
  // d保存`memoryAgeDays`，供memory Age后续处理使用。
  const d = memoryAgeDays(mtimeMs)
  // 满足 `d <= 1` 时，memory Age执行该分支。
  if (d <= 1) return ''
  // 返回 `(`，作为memory Age这次计算的结果。
  return (
    `This memory is ${d} days old. ` +
    `Memories are point-in-time observations, not live state — ` +
    `claims about code behavior or file:line citations may be outdated. ` +
    `Verify against current code before asserting as fact.`
  )
}

/**
 * Per-memory staleness note wrapped in <system-reminder> tags.
 * Returns '' for memories ≤ 1 day old.  Use this for callers that
 * don't add their own system-reminder wrapper (e.g. FileReadTool output).
 */
// memoryFreshnessNote 封装memoryAge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryFreshnessNote(mtimeMs: number): string {
  // 文本保存`memoryFreshnessText`，供memory Age后续处理使用。
  const text = memoryFreshnessText(mtimeMs)
  // 文本缺失时提前走兜底路径，避免memory Age继续依赖无效输入。
  if (!text) return ''
  // 返回 ``<system-reminder>${text}</system-reminder>\n``，作为memory Age这次计算的结果。
  return `<system-reminder>${text}</system-reminder>\n`
}
