// 引入 emojiRegex，将 emoji-regex 中已经封装好的能力接到本文件流程里。
import emojiRegex from 'emoji-regex'
// 引入 eastAsianWidth，将 get-east-asian-width 中已经封装好的能力接到本文件流程里。
import { eastAsianWidth } from 'get-east-asian-width'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../utils/intl.js'

// EMOJI_REGEX匹配`emojiRegex`，供终端渲染后续处理使用。
const EMOJI_REGEX = emojiRegex()

/**
 * Fallback JavaScript implementation of stringWidth when Bun.stringWidth is not available.
 *
 * Get the display width of a string as it would appear in a terminal.
 *
 * This is a more accurate alternative to the string-width package that correctly handles
 * characters like ⚠ (U+26A0) which string-width incorrectly reports as width 2.
 *
 * The implementation uses eastAsianWidth directly with ambiguousAsWide: false,
 * which correctly treats ambiguous-width characters as narrow (width 1) as
 * recommended by the Unicode standard for Western contexts.
 */
// stringWidthJavaScript 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stringWidthJavaScript(str: string): number {
  // typeof str !== 'string' || str为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (typeof str !== 'string' || str.length === 0) {
    // 返回 `0`，作为终端渲染这次计算的结果。
    return 0
  }

  // Fast path: pure ASCII string (no ANSI codes, no wide chars)
  // isPureAscii标记Ink 渲染层 string Width是否启用对应路径。
  let isPureAscii = true
  // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length; i++) {
    // code保存`str.charCodeAt`，供终端渲染后续处理使用。
    const code = str.charCodeAt(i)
    // Check for non-ASCII or ANSI escape (0x1b)
    // 只有 `code >= 127 || code === 0x1b` 满足时，终端渲染才执行该分支。
    if (code >= 127 || code === 0x1b) {
      // isPureAscii更新为 `false`，确保Ink 渲染层后续读取最新状态。
      isPureAscii = false
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break
    }
  }
  // 满足 `isPureAscii` 时，终端渲染执行该分支。
  if (isPureAscii) {
    // Count printable characters (exclude control chars)
    // width保存`0`，供后续判断或组装使用。
    let width = 0
    // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < str.length; i++) {
      // code保存`str.charCodeAt`，供终端渲染后续处理使用。
      const code = str.charCodeAt(i)
      // 满足 `code > 0x1f` 时，终端渲染执行该分支。
      if (code > 0x1f) {
        // Ink 渲染层 string Width在这里处理 `width++`，完成这一小步状态转换。
        width++
      }
    }
    // 返回 `width`，作为终端渲染这次计算的结果。
    return width
  }

  // Strip ANSI if escape character is present
  // 满足 `str.includes('\x1b')` 时，终端渲染执行该分支。
  if (str.includes('\x1b')) {
    // str更新为 `stripAnsi(str)`，确保Ink 渲染层后续读取最新状态。
    str = stripAnsi(str)
    // str为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (str.length === 0) {
      // 返回 `0`，作为终端渲染这次计算的结果。
      return 0
    }
  }

  // Fast path: simple Unicode (no emoji, variation selectors, or joiners)
  // 满足 `!needsSegmentation(str)` 时，终端渲染执行该分支。
  if (!needsSegmentation(str)) {
    // width保存`0`，供后续判断或组装使用。
    let width = 0
    // 按顺序遍历 `str` 中的char，逐个交给终端渲染处理。
    for (const char of str) {
      // codePoint保存`char.codePointAt`，供终端渲染后续处理使用。
      const codePoint = char.codePointAt(0)!
      // 满足 `!isZeroWidth(codePoint)` 时，终端渲染执行该分支。
      if (!isZeroWidth(codePoint)) {
        // Ink 渲染层 string Width在这里处理 `width += eastAsianWidth(codePoint, { ambiguousAsWide: false })`，完成这一小步状态转换。
        width += eastAsianWidth(codePoint, { ambiguousAsWide: false })
      }
    }
    // 返回 `width`，作为终端渲染这次计算的结果。
    return width
  }

  // width保存`0`，供后续判断或组装使用。
  let width = 0

  // 循环处理 `const { segment: grapheme } of getGraphemeSegmenter().segment(str)`，让终端渲染把同类条目按顺序走完。
  for (const { segment: grapheme } of getGraphemeSegmenter().segment(str)) {
    // Check for emoji first (most emoji sequences are width 2)
    // lastIndex 索引更新为 `0`，确保Ink 渲染层后续读取最新状态。
    EMOJI_REGEX.lastIndex = 0
    // 满足 `EMOJI_REGEX.test(grapheme)` 时，终端渲染执行该分支。
    if (EMOJI_REGEX.test(grapheme)) {
      // Ink 渲染层 string Width在这里处理 `width += getEmojiWidth(grapheme)`，完成这一小步状态转换。
      width += getEmojiWidth(grapheme)
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // Calculate width for non-emoji graphemes
    // For grapheme clusters (like Devanagari conjuncts with virama+ZWJ), only count
    // the first non-zero-width character's width since the cluster renders as one glyph
    // 按顺序遍历 `grapheme` 中的char，逐个交给终端渲染处理。
    for (const char of grapheme) {
      // codePoint保存`char.codePointAt`，供终端渲染后续处理使用。
      const codePoint = char.codePointAt(0)!
      // 满足 `!isZeroWidth(codePoint)` 时，终端渲染执行该分支。
      if (!isZeroWidth(codePoint)) {
        // Ink 渲染层 string Width在这里处理 `width += eastAsianWidth(codePoint, { ambiguousAsWide: false })`，完成这一小步状态转换。
        width += eastAsianWidth(codePoint, { ambiguousAsWide: false })
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      }
    }
  }

  // 返回 `width`，作为终端渲染这次计算的结果。
  return width
}

// needsSegmentation 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function needsSegmentation(str: string): boolean {
  // 按顺序遍历 `str` 中的char，逐个交给终端渲染处理。
  for (const char of str) {
    // cp保存`char.codePointAt`，供终端渲染后续处理使用。
    const cp = char.codePointAt(0)!
    // Emoji ranges
    // 只有 `cp >= 0x1f300 && cp <= 0x1faff` 满足时，终端渲染才执行该分支。
    if (cp >= 0x1f300 && cp <= 0x1faff) return true
    // 只有 `cp >= 0x2600 && cp <= 0x27bf` 满足时，终端渲染才执行该分支。
    if (cp >= 0x2600 && cp <= 0x27bf) return true
    // 只有 `cp >= 0x1f1e6 && cp <= 0x1f1ff` 满足时，终端渲染才执行该分支。
    if (cp >= 0x1f1e6 && cp <= 0x1f1ff) return true
    // Variation selectors, ZWJ
    // 只有 `cp >= 0xfe00 && cp <= 0xfe0f` 满足时，终端渲染才执行该分支。
    if (cp >= 0xfe00 && cp <= 0xfe0f) return true
    // 满足 `cp === 0x200d` 时，终端渲染执行该分支。
    if (cp === 0x200d) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getEmojiWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEmojiWidth(grapheme: string): number {
  // Regional indicators: single = 1, pair = 2
  // first保存`grapheme.codePointAt`，供终端渲染后续处理使用。
  const first = grapheme.codePointAt(0)!
  // 只有 `first >= 0x1f1e6 && first <= 0x1f1ff` 满足时，终端渲染才执行该分支。
  if (first >= 0x1f1e6 && first <= 0x1f1ff) {
    // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let count = 0
    // 逐项读取 `grapheme` 中的_，按输入顺序推进终端渲染。
    for (const _ of grapheme) count++
    // 返回 `count === 1 ? 1 : 2`，作为终端渲染这次计算的结果。
    return count === 1 ? 1 : 2
  }

  // Incomplete keycap: digit/symbol + VS16 without U+20E3
  // 满足 `grapheme.length === 2` 时，终端渲染执行该分支。
  if (grapheme.length === 2) {
    // second保存`grapheme.codePointAt`，供终端渲染后续处理使用。
    const second = grapheme.codePointAt(1)
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      second === 0xfe0f &&
      ((first >= 0x30 && first <= 0x39) || first === 0x23 || first === 0x2a)
    ) {
      // 返回 `1`，作为终端渲染这次计算的结果。
      return 1
    }
  }

  // 返回 `2`，作为终端渲染这次计算的结果。
  return 2
}

// isZeroWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isZeroWidth(codePoint: number): boolean {
  // Fast path for common printable range
  // 只有 `codePoint >= 0x20 && codePoint < 0x7f` 满足时，终端渲染才执行该分支。
  if (codePoint >= 0x20 && codePoint < 0x7f) return false
  // 只有 `codePoint >= 0xa0 && codePoint < 0x0300` 满足时，终端渲染才执行该分支。
  if (codePoint >= 0xa0 && codePoint < 0x0300) return codePoint === 0x00ad

  // Control characters
  // 只有 `codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)` 满足时，终端渲染才执行该分支。
  if (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)) return true

  // Zero-width and invisible characters
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (codePoint >= 0x200b && codePoint <= 0x200d) || // ZW space/joiner
    codePoint === 0xfeff || // BOM
    (codePoint >= 0x2060 && codePoint <= 0x2064) // Word joiner etc.
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Variation selectors
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Combining diacritical marks
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Indic script combining marks (covers Devanagari through Malayalam)
  // 只有 `codePoint >= 0x0900 && codePoint <= 0x0d4f` 满足时，终端渲染才执行该分支。
  if (codePoint >= 0x0900 && codePoint <= 0x0d4f) {
    // Signs and vowel marks at start of each script block
    // offset保存`codePoint & 0x7f`，供Ink 渲染层 string Width后续判断或输出使用。
    const offset = codePoint & 0x7f
    // 满足 `offset <= 0x03` 时，终端渲染执行该分支。
    if (offset <= 0x03) return true // Signs at block start
    // 只有 `offset >= 0x3a && offset <= 0x4f` 满足时，终端渲染才执行该分支。
    if (offset >= 0x3a && offset <= 0x4f) return true // Vowel signs, virama
    // 只有 `offset >= 0x51 && offset <= 0x57` 满足时，终端渲染才执行该分支。
    if (offset >= 0x51 && offset <= 0x57) return true // Stress signs
    // 只有 `offset >= 0x62 && offset <= 0x63` 满足时，终端渲染才执行该分支。
    if (offset >= 0x62 && offset <= 0x63) return true // Vowel signs
  }

  // Thai/Lao combining marks
  // Note: U+0E32 (SARA AA), U+0E33 (SARA AM), U+0EB2, U+0EB3 are spacing vowels (width 1), not combining marks
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    codePoint === 0x0e31 || // Thai MAI HAN-AKAT
    (codePoint >= 0x0e34 && codePoint <= 0x0e3a) || // Thai vowel signs (skip U+0E32, U+0E33)
    (codePoint >= 0x0e47 && codePoint <= 0x0e4e) || // Thai vowel signs and marks
    codePoint === 0x0eb1 || // Lao MAI KAN
    (codePoint >= 0x0eb4 && codePoint <= 0x0ebc) || // Lao vowel signs (skip U+0EB2, U+0EB3)
    (codePoint >= 0x0ec8 && codePoint <= 0x0ecd) // Lao tone marks
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Arabic formatting
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (codePoint >= 0x0600 && codePoint <= 0x0605) ||
    codePoint === 0x06dd ||
    codePoint === 0x070f ||
    codePoint === 0x08e2
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Surrogates, tag characters
  // 只有 `codePoint >= 0xd800 && codePoint <= 0xdfff` 满足时，终端渲染才执行该分支。
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) return true
  // 只有 `codePoint >= 0xe0000 && codePoint <= 0xe007f` 满足时，终端渲染才执行该分支。
  if (codePoint >= 0xe0000 && codePoint <= 0xe007f) return true

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Note: complex-script graphemes like Devanagari क्ष (ka+virama+ZWJ+ssa) render
// as a single ligature glyph but occupy 2 terminal cells (wcwidth sums the base
// consonants). Bun.stringWidth=2 matches terminal cell allocation, which is what
// we need for cursor positioning — the JS fallback's grapheme-cluster width of 1
// would desync Ink's layout from the terminal.
//
// Bun.stringWidth is resolved once at module scope rather than checked on every
// call — typeof guards deopt property access and this is a hot path (~100k calls/frame).
// bunStringWidth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const bunStringWidth =
  typeof Bun !== 'undefined' && typeof Bun.stringWidth === 'function'
    ? Bun.stringWidth
    : null

// BUN_STRING_WIDTH_OPTS 集合 集中保存Ink 渲染层 string Width要一起传递的字段。
const BUN_STRING_WIDTH_OPTS = { ambiguousIsNarrow: true } as const

// 这个回调绑定到 export const stringWidth: (str: string) => number = bunStringWidth，负责终端渲染在该局部场景下的响应。
export const stringWidth: (str: string) => number = bunStringWidth
  // 这个回调绑定到 ? str => bunStringWidth(str, BUN_STRING_WIDTH_OPTS)，负责终端渲染在该局部场景下的响应。
  ? str => bunStringWidth(str, BUN_STRING_WIDTH_OPTS)
  : stringWidthJavaScript
