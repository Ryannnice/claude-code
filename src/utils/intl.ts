/**
 * Shared Intl object instances with lazy initialization.
 *
 * Intl constructors are expensive (~0.05-0.1ms each), so we cache instances
 * for reuse across the codebase instead of creating new ones each time.
 * Lazy initialization ensures we only pay the cost when actually needed.
 */

// Segmenters for Unicode text processing (lazily initialized)
// graphemeSegmenter保存`null`，作为后续空值处理的输入。
let graphemeSegmenter: Intl.Segmenter | null = null
// wordSegmenter保存`null`，作为后续空值处理的输入。
let wordSegmenter: Intl.Segmenter | null = null

// getGraphemeSegmenter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGraphemeSegmenter(): Intl.Segmenter {
  // graphemeSegmenter缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!graphemeSegmenter) {
    // graphemeSegmenter更新为 `new Intl.Segmenter(undefined, {`，确保共享工具后续读取最新状态。
    graphemeSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    })
  }
  // 返回 `graphemeSegmenter`，作为共享工具这次计算的结果。
  return graphemeSegmenter
}

/**
 * Extract the first grapheme cluster from a string.
 * Returns '' for empty strings.
 */
// firstGrapheme 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function firstGrapheme(text: string): string {
  // 文本缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!text) return ''
  // segments 集合读取`getGraphemeSegmenter`，供共享工具后续处理使用。
  const segments = getGraphemeSegmenter().segment(text)
  // first保存`next`，供共享工具后续处理使用。
  const first = segments[Symbol.iterator]().next().value
  // 返回 `first?.segment ?? ''`，作为共享工具这次计算的结果。
  return first?.segment ?? ''
}

/**
 * Extract the last grapheme cluster from a string.
 * Returns '' for empty strings.
 */
// lastGrapheme 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lastGrapheme(text: string): string {
  // 文本缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!text) return ''
  // last保存`''`，作为后续固定文本处理的输入。
  let last = ''
  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(text)`，让共享工具把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    // last更新为 `segment`，确保共享工具后续读取最新状态。
    last = segment
  }
  // 返回 `last`，作为共享工具这次计算的结果。
  return last
}

// getWordSegmenter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWordSegmenter(): Intl.Segmenter {
  // wordSegmenter缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!wordSegmenter) {
    // wordSegmenter更新为 `new Intl.Segmenter(undefined, { granularity: 'word' })`，确保共享工具后续读取最新状态。
    wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  }
  // 返回 `wordSegmenter`，作为共享工具这次计算的结果。
  return wordSegmenter
}

// RelativeTimeFormat cache (keyed by style:numeric)
// rtfCache 缓存构建`new Map<string, Intl.RelativeTimeFormat>()` 整理出中间结果，供共享工具 intl后续步骤使用。
const rtfCache = new Map<string, Intl.RelativeTimeFormat>()

// getRelativeTimeFormat 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRelativeTimeFormat(
  style: 'long' | 'short' | 'narrow',
  numeric: 'always' | 'auto',
): Intl.RelativeTimeFormat {
  // key 命名 ``${style}:${numeric}``，让后续代码直接表达这个值的用途。
  const key = `${style}:${numeric}`
  // rtf读取`rtfCache.get`，供共享工具后续处理使用。
  let rtf = rtfCache.get(key)
  // rtf缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!rtf) {
    // rtf更新为 `new Intl.RelativeTimeFormat('en', { style, numeric })`，确保共享工具后续读取最新状态。
    rtf = new Intl.RelativeTimeFormat('en', { style, numeric })
    // rtfCache.set 写入新的状态值，使共享工具后续读取保持一致。
    rtfCache.set(key, rtf)
  }
  // 返回 `rtf`，作为共享工具这次计算的结果。
  return rtf
}

// Timezone is constant for the process lifetime
// cachedTimeZone 缓存保存`null`，作为后续空值处理的输入。
let cachedTimeZone: string | null = null

// getTimeZone 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTimeZone(): string {
  // cachedTimeZone 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cachedTimeZone) {
    // cachedTimeZone 缓存更新为 `Intl.DateTimeFormat().resolvedOptions().timeZone`，确保共享工具后续读取最新状态。
    cachedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  // 返回 `cachedTimeZone`，作为共享工具这次计算的结果。
  return cachedTimeZone
}

// System locale language subtag (e.g. 'en', 'ja') is constant for the process
// lifetime. null = not yet computed; undefined = computed but unavailable (so
// a stripped-ICU environment fails once instead of retrying on every call).
// cachedSystemLocaleLanguage 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedSystemLocaleLanguage: string | undefined | null = null

// getSystemLocaleLanguage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSystemLocaleLanguage(): string | undefined {
  // 满足 `cachedSystemLocaleLanguage === null` 时，共享工具执行该分支。
  if (cachedSystemLocaleLanguage === null) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // locale记录时间`Intl.DateTimeFormat`，供共享工具后续处理使用。
      const locale = Intl.DateTimeFormat().resolvedOptions().locale
      // cachedSystemLocaleLanguage 缓存更新为 `new Intl.Locale(locale).language`，确保共享工具后续读取最新状态。
      cachedSystemLocaleLanguage = new Intl.Locale(locale).language
    } catch {
      // cachedSystemLocaleLanguage 缓存更新为 `undefined`，确保共享工具后续读取最新状态。
      cachedSystemLocaleLanguage = undefined
    }
  }
  // 返回 `cachedSystemLocaleLanguage`，作为共享工具这次计算的结果。
  return cachedSystemLocaleLanguage
}
