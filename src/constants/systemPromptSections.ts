// 整理这一组导入，让system Prompt Sections后续逻辑可以直接复用这些外部能力。
import {
  clearBetaHeaderLatches,
  clearSystemPromptSectionState,
  getSystemPromptSectionCache,
  setSystemPromptSectionCacheEntry,
} from '../bootstrap/state.js'

// ComputeFn 固化system Prompt Sections里传递的数据形状，帮助调用方按同一结构读写字段。
type ComputeFn = () => string | null | Promise<string | null>

// SystemPromptSection 固化system Prompt Sections里传递的数据形状，帮助调用方按同一结构读写字段。
type SystemPromptSection = {
  name: string
  compute: ComputeFn
  cacheBreak: boolean
}

/**
 * Create a memoized system prompt section.
 * Computed once, cached until /clear or /compact.
 */
// systemPromptSection 封装systemPromptSections的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function systemPromptSection(
  name: string,
  compute: ComputeFn,
): SystemPromptSection {
  // 返回结构化结果，集中表达system Prompt Sections已经整理出的状态。
  return { name, compute, cacheBreak: false }
}

/**
 * Create a volatile system prompt section that recomputes every turn.
 * This WILL break the prompt cache when the value changes.
 * Requires a reason explaining why cache-breaking is necessary.
 */
// DANGEROUS_uncachedSystemPromptSection 封装systemPromptSections的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DANGEROUS_uncachedSystemPromptSection(
  name: string,
  compute: ComputeFn,
  _reason: string,
): SystemPromptSection {
  // 返回结构化结果，集中表达system Prompt Sections已经整理出的状态。
  return { name, compute, cacheBreak: true }
}

/**
 * Resolve all system prompt sections, returning prompt strings.
 */
// resolveSystemPromptSections 封装systemPromptSections的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveSystemPromptSections(
  sections: SystemPromptSection[],
): Promise<(string | null)[]> {
  // cache 缓存读取`getSystemPromptSectionCache`，供system Prompt Sections后续处理使用。
  const cache = getSystemPromptSectionCache()

  // 返回 `Promise.all(`，作为system Prompt Sections这次计算的结果。
  return Promise.all(
    // 调用 sections.map，触发system Prompt Sections此处需要的副作用。
    sections.map(async s => {
      // 组合条件 `!s.cacheBreak && cache.has(s.name)` 成立时，system Prompt Sections才启用这条专门路径。
      if (!s.cacheBreak && cache.has(s.name)) {
        // 返回 `cache.get(s.name) ?? null`，作为system Prompt Sections这次计算的结果。
        return cache.get(s.name) ?? null
      }
      // 取值保存`s.compute`，供system Prompt Sections后续处理使用。
      const value = await s.compute()
      // setSystemPromptSectionCacheEntry 写入新的状态值，使system Prompt Sections后续读取保持一致。
      setSystemPromptSectionCacheEntry(s.name, value)
      // 返回 `value`，作为system Prompt Sections这次计算的结果。
      return value
    }),
  )
}

/**
 * Clear all system prompt section state. Called on /clear and /compact.
 * Also resets beta header latches so a fresh conversation gets fresh
 * evaluation of AFK/fast-mode/cache-editing headers.
 */
// clearSystemPromptSections 封装systemPromptSections的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSystemPromptSections(): void {
  // 调用 clearSystemPromptSectionState，触发system Prompt Sections此处需要的副作用。
  clearSystemPromptSectionState()
  // 调用 clearBetaHeaderLatches，触发system Prompt Sections此处需要的副作用。
  clearBetaHeaderLatches()
}
