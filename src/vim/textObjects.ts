/**
 * Vim Text Object Finding
 *
 * Functions for finding text object boundaries (iw, aw, i", a(, etc.)
 */

// 整理这一组导入，让text Objects后续逻辑可以直接复用这些外部能力。
import {
  isVimPunctuation,
  isVimWhitespace,
  isVimWordChar,
} from '../utils/Cursor.js'
// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../utils/intl.js'

// TextObjectRange 固化text Objects里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextObjectRange = { start: number; end: number } | null

/**
 * Delimiter pairs for text objects.
 */
// PAIRS 集合 集中保存text Objects要一起传递的字段。
const PAIRS: Record<string, [string, string]> = {
  '(': ['(', ')'],
  ')': ['(', ')'],
  b: ['(', ')'],
  '[': ['[', ']'],
  ']': ['[', ']'],
  '{': ['{', '}'],
  '}': ['{', '}'],
  B: ['{', '}'],
  '<': ['<', '>'],
  '>': ['<', '>'],
  '"': ['"', '"'],
  "'": ["'", "'"],
  '`': ['`', '`'],
}

/**
 * Find a text object at the given position.
 */
// findTextObject 封装textObjects的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findTextObject(
  text: string,
  offset: number,
  objectType: string,
  isInner: boolean,
): TextObjectRange {
  // 当 `objectType` 匹配 `'w'` 时，text Objects执行对应分支。
  if (objectType === 'w')
    // 返回 `findWordObject(text, offset, isInner, isVimWordChar)`，作为text Objects这次计算的结果。
    return findWordObject(text, offset, isInner, isVimWordChar)
  // 当 `objectType` 匹配 `'W'` 时，text Objects执行对应分支。
  if (objectType === 'W')
    // 返回 `findWordObject(text, offset, isInner, ch => !isVimWhitespace(ch))`，作为text Objects这次计算的结果。
    return findWordObject(text, offset, isInner, ch => !isVimWhitespace(ch))

  // pair读取 `PAIRS[objectType]` 对应条目，后续围绕该成员继续处理。
  const pair = PAIRS[objectType]
  // 满足 `pair` 时，text Objects执行该分支。
  if (pair) {
    // 从 `pair` 按位置拆出 open、close，让text Objects分别处理这些返回值。
    const [open, close] = pair
    // 返回 `open === close`，作为text Objects这次计算的结果。
    return open === close
      ? findQuoteObject(text, offset, open, isInner)
      : findBracketObject(text, offset, open, close, isInner)
  }

  // 返回 `null`，作为text Objects这次计算的结果。
  return null
}

// findWordObject 封装textObjects的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findWordObject(
  text: string,
  offset: number,
  isInner: boolean,
  // 这个回调绑定到 isWordChar: (ch: string) => boolean,，负责text Objects在该局部场景下的响应。
  isWordChar: (ch: string) => boolean,
): TextObjectRange {
  // Pre-segment into graphemes for grapheme-safe iteration
  // graphemes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const graphemes: Array<{ segment: string; index: number }> = []
  // 循环处理 `const { segment, index } of getGraphemeSegmenter().segment(text)`，让text Objects把同类条目按顺序走完。
  for (const { segment, index } of getGraphemeSegmenter().segment(text)) {
    // graphemes 集合追加新条目，保持收集顺序与输入顺序一致。
    graphemes.push({ segment, index })
  }

  // Find which grapheme index the offset falls in
  // graphemeIdx保存 `graphemes.length - 1` 的判断结果，供text Objects后续分支直接复用。
  let graphemeIdx = graphemes.length - 1
  // 按索引扫描 `graphemes.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < graphemes.length; i++) {
    // g 命名 `graphemes[i]!`，让后续代码直接表达这个值的用途。
    const g = graphemes[i]!
    // nextStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const nextStart =
      i + 1 < graphemes.length ? graphemes[i + 1]!.index : text.length
    // 组合条件 `offset >= g.index && offset < nextStart` 成立时，text Objects才启用这条专门路径。
    if (offset >= g.index && offset < nextStart) {
      // graphemeIdx更新为 `i`，确保textObjects后续读取最新状态。
      graphemeIdx = i
      // 结束这个分支或循环，避免text Objects继续落入后续路径。
      break
    }
  }

  // graphemeAt封装成回调，供text Objects在事件触发或异步步骤中调用。
  const graphemeAt = (idx: number): string => graphemes[idx]?.segment ?? ''
  // offsetAt封装成回调，供text Objects在事件触发或异步步骤中调用。
  const offsetAt = (idx: number): number =>
    idx < graphemes.length ? graphemes[idx]!.index : text.length
  // isWs 集合记录 `isVimWhitespace` 是否成立，text Objects随后按该结果分支。
  const isWs = (idx: number): boolean => isVimWhitespace(graphemeAt(idx))
  // isWord记录 `isWordChar` 是否成立，text Objects随后按该结果分支。
  const isWord = (idx: number): boolean => isWordChar(graphemeAt(idx))
  // isPunct记录 `isVimPunctuation` 是否成立，text Objects随后按该结果分支。
  const isPunct = (idx: number): boolean => isVimPunctuation(graphemeAt(idx))

  // startIdx保存`graphemeIdx`，供text Objects后续判断或输出使用。
  let startIdx = graphemeIdx
  // endIdx保存`graphemeIdx`，供text Objects后续判断或输出使用。
  let endIdx = graphemeIdx

  // 满足 `isWord(graphemeIdx)` 时，text Objects执行该分支。
  if (isWord(graphemeIdx)) {
    // 只要 startIdx > 0 && isWord(startIdx - 1) 成立，就持续推进text Objects中的循环处理。
    while (startIdx > 0 && isWord(startIdx - 1)) startIdx--
    // 只要 endIdx < graphemes.length && isWord(endIdx) 成立，就持续推进text Objects中的循环处理。
    while (endIdx < graphemes.length && isWord(endIdx)) endIdx++
  // text Objects在这里处理 `} else if (isWs(graphemeIdx)) {`，完成这一小步状态转换。
  } else if (isWs(graphemeIdx)) {
    // 只要 startIdx > 0 && isWs(startIdx - 1) 成立，就持续推进text Objects中的循环处理。
    while (startIdx > 0 && isWs(startIdx - 1)) startIdx--
    // 只要 endIdx < graphemes.length && isWs(endIdx) 成立，就持续推进text Objects中的循环处理。
    while (endIdx < graphemes.length && isWs(endIdx)) endIdx++
    // 返回结构化结果，集中表达text Objects已经整理出的状态。
    return { start: offsetAt(startIdx), end: offsetAt(endIdx) }
  // text Objects在这里处理 `} else if (isPunct(graphemeIdx)) {`，完成这一小步状态转换。
  } else if (isPunct(graphemeIdx)) {
    // 只要 startIdx > 0 && isPunct(startIdx - 1) 成立，就持续推进text Objects中的循环处理。
    while (startIdx > 0 && isPunct(startIdx - 1)) startIdx--
    // 只要 endIdx < graphemes.length && isPunct(endIdx) 成立，就持续推进text Objects中的循环处理。
    while (endIdx < graphemes.length && isPunct(endIdx)) endIdx++
  }

  // isInner缺失时提前走兜底路径，避免text Objects继续依赖无效输入。
  if (!isInner) {
    // Include surrounding whitespace
    // 组合条件 `endIdx < graphemes.length && isWs(endIdx)` 成立时，text Objects才启用这条专门路径。
    if (endIdx < graphemes.length && isWs(endIdx)) {
      // 只要 endIdx < graphemes.length && isWs(endIdx) 成立，就持续推进text Objects中的循环处理。
      while (endIdx < graphemes.length && isWs(endIdx)) endIdx++
    // text Objects在这里处理 `} else if (startIdx > 0 && isWs(startIdx - 1)) {`，完成这一小步状态转换。
    } else if (startIdx > 0 && isWs(startIdx - 1)) {
      // 只要 startIdx > 0 && isWs(startIdx - 1) 成立，就持续推进text Objects中的循环处理。
      while (startIdx > 0 && isWs(startIdx - 1)) startIdx--
    }
  }

  // 返回结构化结果，集中表达text Objects已经整理出的状态。
  return { start: offsetAt(startIdx), end: offsetAt(endIdx) }
}

// findQuoteObject 封装textObjects的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findQuoteObject(
  text: string,
  offset: number,
  quote: string,
  isInner: boolean,
): TextObjectRange {
  // lineStart保存`text.lastIndexOf`，供text Objects后续处理使用。
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  // lineEnd保存`text.indexOf`，供text Objects后续处理使用。
  const lineEnd = text.indexOf('\n', offset)
  // effectiveEnd标记text Objects是否启用对应路径。
  const effectiveEnd = lineEnd === -1 ? text.length : lineEnd
  // line格式化`text.slice`，供text Objects后续处理使用。
  const line = text.slice(lineStart, effectiveEnd)
  // posInLine保存`offset - lineStart`，供text Objects后续判断或输出使用。
  const posInLine = offset - lineStart

  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: number[] = []
  // 按索引扫描 `line.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < line.length; i++) {
    // 满足 `line[i] === quote) positions.push(i` 时，text Objects执行该分支。
    if (line[i] === quote) positions.push(i)
  }

  // Pair quotes correctly: 0-1, 2-3, 4-5, etc.
  // 循环处理 `let i = 0; i < positions.length - 1; i += 2`，让text Objects逐项把同类条目按顺序走完。
  for (let i = 0; i < positions.length - 1; i += 2) {
    // qs 集合保存`positions[i]!`，供text Objects后续判断或输出使用。
    const qs = positions[i]!
    // qe读取 `positions[i + 1]!` 对应条目，后续围绕该成员继续处理。
    const qe = positions[i + 1]!
    // 组合条件 `qs <= posInLine && posInLine <= qe` 成立时，text Objects才启用这条专门路径。
    if (qs <= posInLine && posInLine <= qe) {
      // 返回 `isInner`，作为text Objects这次计算的结果。
      return isInner
        ? { start: lineStart + qs + 1, end: lineStart + qe }
        : { start: lineStart + qs, end: lineStart + qe + 1 }
    }
  }

  // 返回 `null`，作为text Objects这次计算的结果。
  return null
}

// findBracketObject 封装textObjects的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findBracketObject(
  text: string,
  offset: number,
  open: string,
  close: string,
  isInner: boolean,
): TextObjectRange {
  // depth保存`0`，供text Objects后续判断或输出使用。
  let depth = 0
  // start保存`-1`，供后续判断或组装使用。
  let start = -1

  // 循环处理 `let i = offset; i >= 0; i--`，让text Objects逐项把同类条目按顺序走完。
  for (let i = offset; i >= 0; i--) {
    // `text[i] === close && i` 与 `offset` 不一致时刷新派生状态，避免使用过期结果。
    if (text[i] === close && i !== offset) depth++
    else if (text[i] === open) {
      // 满足 `depth === 0` 时，text Objects执行该分支。
      if (depth === 0) {
        // start更新为 `i`，确保textObjects后续读取最新状态。
        start = i
        // 结束这个分支或循环，避免text Objects继续落入后续路径。
        break
      }
      // text Objects在这里处理 `depth--`，完成这一小步状态转换。
      depth--
    }
  }
  // 满足 `start === -1` 时，text Objects执行该分支。
  if (start === -1) return null

  // depth更新为 `0`，确保textObjects后续读取最新状态。
  depth = 0
  // end 命名 `-1`，让后续代码直接表达这个值的用途。
  let end = -1
  // 循环处理 `let i = start + 1; i < text.length; i++`，让text Objects逐项把同类条目按顺序走完。
  for (let i = start + 1; i < text.length; i++) {
    // 满足 `text[i] === open` 时，text Objects执行该分支。
    if (text[i] === open) depth++
    else if (text[i] === close) {
      // 满足 `depth === 0` 时，text Objects执行该分支。
      if (depth === 0) {
        // end更新为 `i`，确保textObjects后续读取最新状态。
        end = i
        // 结束这个分支或循环，避免text Objects继续落入后续路径。
        break
      }
      // text Objects在这里处理 `depth--`，完成这一小步状态转换。
      depth--
    }
  }
  // 满足 `end === -1` 时，text Objects执行该分支。
  if (end === -1) return null

  // 返回 `isInner ? { start: start + 1, end } : { start, end: end + 1 }`，作为text Objects这次计算的结果。
  return isInner ? { start: start + 1, end } : { start, end: end + 1 }
}
