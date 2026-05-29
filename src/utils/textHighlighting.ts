// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnsiCode,
  ansiCodesToString,
  reduceAnsiCodes,
  type Token,
  tokenize,
  undoAnsiCodes,
} from '@alcalzone/ansi-tokenize'
// 类型依赖 { Theme } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { Theme } from './theme.js'

// TextHighlight 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextHighlight = {
  start: number
  end: number
  color: keyof Theme | undefined
  dimColor?: boolean
  inverse?: boolean
  shimmerColor?: keyof Theme
  priority: number
}

// TextSegment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextSegment = {
  text: string
  start: number
  highlight?: TextHighlight
}

// segmentTextByHighlights 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function segmentTextByHighlights(
  text: string,
  highlights: TextHighlight[],
): TextSegment[] {
  // highlights 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (highlights.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [{ text, start: 0 }]
  }

  // sortedHighlights 集合保存`sort`，供共享工具后续处理使用。
  const sortedHighlights = [...highlights].sort((a, b) => {
    // `a.start` 与 `b.start` 不一致时刷新派生状态，避免使用过期结果。
    if (a.start !== b.start) return a.start - b.start
    // 返回 `b.priority - a.priority`，作为共享工具这次计算的结果。
    return b.priority - a.priority
  })

  // resolvedHighlights 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const resolvedHighlights: TextHighlight[] = []
  // usedRanges 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const usedRanges: Array<{ start: number; end: number }> = []

  // 按顺序遍历 `sortedHighlights` 中的highlight，逐个交给共享工具处理。
  for (const highlight of sortedHighlights) {
    // 满足 `highlight.start === highlight.end` 时，共享工具执行该分支。
    if (highlight.start === highlight.end) continue

    // overlaps 集合筛选`usedRanges.some`，供共享工具后续处理使用。
    const overlaps = usedRanges.some(
      // range更新为 `>`，确保共享工具后续读取最新状态。
      range =>
        (highlight.start >= range.start && highlight.start < range.end) ||
        (highlight.end > range.start && highlight.end <= range.end) ||
        (highlight.start <= range.start && highlight.end >= range.end),
    )

    // overlaps 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!overlaps) {
      // resolvedHighlights 集合追加新条目，保持收集顺序与输入顺序一致。
      resolvedHighlights.push(highlight)
      // usedRanges 集合追加新条目，保持收集顺序与输入顺序一致。
      usedRanges.push({ start: highlight.start, end: highlight.end })
    }
  }

  // 返回 `new HighlightSegmenter(text).segment(resolvedHighlights)`，作为共享工具这次计算的结果。
  return new HighlightSegmenter(text).segment(resolvedHighlights)
}

// HighlightSegmenter 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class HighlightSegmenter {
  private readonly tokens: Token[]
  // Two position systems: "visible" (what the user sees, excluding ANSI codes)
  // and "string" (raw positions including ANSI codes for substring extraction)
  private visiblePos = 0
  private stringPos = 0
  private tokenIdx = 0
  private charIdx = 0 // offset within current text token (for partial consumption)
  private codes: AnsiCode[] = []

  // 构造函数接收 private readonly text: string，把外部输入整理成实例可复用的内部状态。
  constructor(private readonly text: string) {
    // 更新实例字段 tokens 为 tokenize(text)，同步共享工具的内部状态。
    this.tokens = tokenize(text)
  }

  // segment 使用 highlights: TextHighlight[] 完成共享工具里的对应操作。
  segment(highlights: TextHighlight[]): TextSegment[] {
    // segments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const segments: TextSegment[] = []

    // 按顺序遍历 `highlights` 中的highlight，逐个交给共享工具处理。
    for (const highlight of highlights) {
      // before保存`this.segmentTo`，供共享工具后续处理使用。
      const before = this.segmentTo(highlight.start)
      // 满足 `before) segments.push(before` 时，共享工具执行该分支。
      if (before) segments.push(before)

      // highlighted保存`this.segmentTo`，供共享工具后续处理使用。
      const highlighted = this.segmentTo(highlight.end)
      // 满足 `highlighted` 时，共享工具执行该分支。
      if (highlighted) {
        // highlight更新为 `highlight`，确保共享工具后续读取最新状态。
        highlighted.highlight = highlight
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(highlighted)
      }
    }

    // after保存`this.segmentTo`，供共享工具后续处理使用。
    const after = this.segmentTo(Infinity)
    // 满足 `after) segments.push(after` 时，共享工具执行该分支。
    if (after) segments.push(after)

    // 返回 `segments`，作为共享工具这次计算的结果。
    return segments
  }

  // 共享工具 text Highlighting在这里处理 `private segmentTo(targetVisiblePos: number): TextSegment | null {`，完成这一小步状态转换。
  private segmentTo(targetVisiblePos: number): TextSegment | null {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.tokenIdx >= this.tokens.length ||
      targetVisiblePos <= this.visiblePos
    ) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // visibleStart 命名 `this.visiblePos`，让后续代码直接表达这个值的用途。
    const visibleStart = this.visiblePos

    // Consume leading ANSI codes before first visible char
    // while 使用 this.tokenIdx < this.tokens.length 完成共享工具里的对应操作。
    while (this.tokenIdx < this.tokens.length) {
      // token读取 `this.tokens[this.tokenIdx]!` 对应条目，后续围绕该成员继续处理。
      const token = this.tokens[this.tokenIdx]!
      // `token.type` 与 `'ansi'` 不一致时刷新派生状态，避免使用过期结果。
      if (token.type !== 'ansi') break
      // codes 集合追加新条目，保持收集顺序与输入顺序一致。
      this.codes.push(token)
      // 共享工具 text Highlighting在这里处理 `this.stringPos += token.code.length`，完成这一小步状态转换。
      this.stringPos += token.code.length
      // 共享工具 text Highlighting在这里处理 `this.tokenIdx++`，完成这一小步状态转换。
      this.tokenIdx++
    }

    // stringStart保存`this.stringPos`，供共享工具 text Highlighting后续判断或输出使用。
    const stringStart = this.stringPos
    // codesStart 聚合成有序列表，保持后续遍历顺序稳定。
    const codesStart = [...this.codes]

    // Advance through tokens until we reach target
    // 调用 while，触发共享工具此处需要的副作用。
    while (
      this.visiblePos < targetVisiblePos &&
      this.tokenIdx < this.tokens.length
    ) {
      // token读取 `this.tokens[this.tokenIdx]!` 对应条目，后续围绕该成员继续处理。
      const token = this.tokens[this.tokenIdx]!

      // 当 `token.type` 匹配 `'ansi'` 时，共享工具执行对应分支。
      if (token.type === 'ansi') {
        // codes 集合追加新条目，保持收集顺序与输入顺序一致。
        this.codes.push(token)
        // 共享工具 text Highlighting在这里处理 `this.stringPos += token.code.length`，完成这一小步状态转换。
        this.stringPos += token.code.length
        // 共享工具 text Highlighting在这里处理 `this.tokenIdx++`，完成这一小步状态转换。
        this.tokenIdx++
      } else {
        // charsNeeded读取`targetVisiblePos - this.visiblePos` 整理出中间结果，供共享工具 text Highlighting后续步骤使用。
        const charsNeeded = targetVisiblePos - this.visiblePos
        // charsAvailable 命名 `token.value.length - this.charIdx`，让后续代码直接表达这个值的用途。
        const charsAvailable = token.value.length - this.charIdx
        // charsToTake保存`Math.min`，供共享工具后续处理使用。
        const charsToTake = Math.min(charsNeeded, charsAvailable)

        // 共享工具 text Highlighting在这里处理 `this.stringPos += charsToTake`，完成这一小步状态转换。
        this.stringPos += charsToTake
        // 共享工具 text Highlighting在这里处理 `this.visiblePos += charsToTake`，完成这一小步状态转换。
        this.visiblePos += charsToTake
        // 共享工具 text Highlighting在这里处理 `this.charIdx += charsToTake`，完成这一小步状态转换。
        this.charIdx += charsToTake

        // 满足 `this.charIdx >= token.value.length` 时，共享工具执行该分支。
        if (this.charIdx >= token.value.length) {
          // 共享工具 text Highlighting在这里处理 `this.tokenIdx++`，完成这一小步状态转换。
          this.tokenIdx++
          // 更新实例字段 charIdx 为 0，同步共享工具的内部状态。
          this.charIdx = 0
        }
      }
    }

    // Empty segment (can occur when only trailing ANSI codes remain)
    // 满足 `this.stringPos === stringStart` 时，共享工具执行该分支。
    if (this.stringPos === stringStart) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // prefixCodes 集合派生`reduceCodes`，供共享工具后续处理使用。
    const prefixCodes = reduceCodes(codesStart)
    // suffixCodes 集合派生`reduceCodes`，供共享工具后续处理使用。
    const suffixCodes = reduceCodes(this.codes)
    // 更新实例字段 codes 为 suffixCodes，同步共享工具的内部状态。
    this.codes = suffixCodes

    // prefix保存`ansiCodesToString`，供共享工具后续处理使用。
    const prefix = ansiCodesToString(prefixCodes)
    // suffix保存`ansiCodesToString`，供共享工具后续处理使用。
    const suffix = ansiCodesToString(undoAnsiCodes(suffixCodes))

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      text: prefix + this.text.substring(stringStart, this.stringPos) + suffix,
      start: visibleStart,
    }
  }
}

// reduceCodes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reduceCodes(codes: AnsiCode[]): AnsiCode[] {
  // 返回 `reduceAnsiCodes(codes).filter(c => c.code !== c.endCode)`，作为共享工具这次计算的结果。
  return reduceAnsiCodes(codes).filter(c => c.code !== c.endCode)
}
