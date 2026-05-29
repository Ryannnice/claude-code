// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 复用 wrapAnsi 终端界面组件，避免在这里重复拼装显示逻辑。
import { wrapAnsi } from '../ink/wrapAnsi.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  firstGrapheme,
  getGraphemeSegmenter,
  getWordSegmenter,
} from './intl.js'

/**
 * Kill ring for storing killed (cut) text that can be yanked (pasted) with Ctrl+Y.
 * This is global state that shares one kill ring across all input fields.
 *
 * Consecutive kills accumulate in the kill ring until the user types some
 * other key. Alt+Y cycles through previous kills after a yank.
 */
// KILL_RING_MAX_SIZE 命名 `10`，让后续代码直接表达这个值的用途。
const KILL_RING_MAX_SIZE = 10
// killRing 从空数组开始收集，后续循环会按处理顺序追加条目。
let killRing: string[] = []
// killRingIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
let killRingIndex = 0
// lastActionWasKill标记共享工具 Cursor是否启用对应路径。
let lastActionWasKill = false

// Track yank state for yank-pop (alt-y)
// lastYankStart 命名 `0`，让后续代码直接表达这个值的用途。
let lastYankStart = 0
// lastYankLength 数量保存`0`，供共享工具 Cursor后续判断或输出使用。
let lastYankLength = 0
// lastActionWasYank标记共享工具 Cursor是否启用对应路径。
let lastActionWasYank = false

// pushToKillRing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pushToKillRing(
  text: string,
  direction: 'prepend' | 'append' = 'append',
): void {
  // 满足 `text.length > 0` 时，共享工具执行该分支。
  if (text.length > 0) {
    // 只有 `lastActionWasKill && killRing.length > 0` 满足时，共享工具才执行该分支。
    if (lastActionWasKill && killRing.length > 0) {
      // Accumulate with the most recent kill
      // 当 `direction` 匹配 `'prepend'` 时，共享工具执行对应分支。
      if (direction === 'prepend') {
        // killRing[0更新为 `text + killRing[0]`，确保共享工具 Cursor后续读取最新状态。
        killRing[0] = text + killRing[0]
      } else {
        // killRing[0更新为 `killRing[0] + text`，确保共享工具 Cursor后续读取最新状态。
        killRing[0] = killRing[0] + text
      }
    } else {
      // Add new entry to front of ring
      // 调用 killRing.unshift，触发共享工具此处需要的副作用。
      killRing.unshift(text)
      // 满足 `killRing.length > KILL_RING_MAX_SIZE` 时，共享工具执行该分支。
      if (killRing.length > KILL_RING_MAX_SIZE) {
        // 调用 killRing.pop，触发共享工具此处需要的副作用。
        killRing.pop()
      }
    }
    // lastActionWasKill更新为 `true`，确保共享工具后续读取最新状态。
    lastActionWasKill = true
    // Reset yank state when killing new text
    // lastActionWasYank更新为 `false`，确保共享工具后续读取最新状态。
    lastActionWasYank = false
  }
}

// getLastKill 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastKill(): string {
  // 返回 `killRing[0] ?? ''`，作为共享工具这次计算的结果。
  return killRing[0] ?? ''
}

// getKillRingItem 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKillRingItem(index: number): string {
  // killRing为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (killRing.length === 0) return ''
  // normalizedIndex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const normalizedIndex =
    ((index % killRing.length) + killRing.length) % killRing.length
  // 返回 `killRing[normalizedIndex] ?? ''`，作为共享工具这次计算的结果。
  return killRing[normalizedIndex] ?? ''
}

// getKillRingSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKillRingSize(): number {
  // 返回 `killRing.length`，作为共享工具这次计算的结果。
  return killRing.length
}

// clearKillRing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearKillRing(): void {
  // killRing更新为 `[]`，确保共享工具后续读取最新状态。
  killRing = []
  // killRingIndex 索引更新为 `0`，确保共享工具后续读取最新状态。
  killRingIndex = 0
  // lastActionWasKill更新为 `false`，确保共享工具后续读取最新状态。
  lastActionWasKill = false
  // lastActionWasYank更新为 `false`，确保共享工具后续读取最新状态。
  lastActionWasYank = false
  // lastYankStart更新为 `0`，确保共享工具后续读取最新状态。
  lastYankStart = 0
  // lastYankLength 数量更新为 `0`，确保共享工具后续读取最新状态。
  lastYankLength = 0
}

// resetKillAccumulation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetKillAccumulation(): void {
  // lastActionWasKill更新为 `false`，确保共享工具后续读取最新状态。
  lastActionWasKill = false
}

// Yank tracking for yank-pop
// recordYank 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordYank(start: number, length: number): void {
  // lastYankStart更新为 `start`，确保共享工具后续读取最新状态。
  lastYankStart = start
  // lastYankLength 数量更新为 `length`，确保共享工具后续读取最新状态。
  lastYankLength = length
  // lastActionWasYank更新为 `true`，确保共享工具后续读取最新状态。
  lastActionWasYank = true
  // killRingIndex 索引更新为 `0`，确保共享工具后续读取最新状态。
  killRingIndex = 0
}

// canYankPop 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function canYankPop(): boolean {
  // 返回 `lastActionWasYank && killRing.length > 1`，作为共享工具这次计算的结果。
  return lastActionWasYank && killRing.length > 1
}

// yankPop 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function yankPop(): {
  text: string
  start: number
  length: number
} | null {
  // 只有 `!lastActionWasYank || killRing.length <= 1` 满足时，共享工具才执行该分支。
  if (!lastActionWasYank || killRing.length <= 1) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // Cycle to next item in kill ring
  // killRingIndex 索引更新为 `(killRingIndex + 1) % killRing.length`，确保共享工具后续读取最新状态。
  killRingIndex = (killRingIndex + 1) % killRing.length
  // 文本内容读取 `killRing[killRingIndex] ?? ''` 对应条目，后续围绕该成员继续处理。
  const text = killRing[killRingIndex] ?? ''
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { text, start: lastYankStart, length: lastYankLength }
}

// updateYankLength 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateYankLength(length: number): void {
  // lastYankLength 数量更新为 `length`，确保共享工具后续读取最新状态。
  lastYankLength = length
}

// resetYankState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetYankState(): void {
  // lastActionWasYank更新为 `false`，确保共享工具后续读取最新状态。
  lastActionWasYank = false
}

/**
 * Text Processing Flow for Unicode Normalization:
 *
 * User Input (raw text, potentially mixed NFD/NFC)
 *     ↓
 * MeasuredText (normalizes to NFC + builds grapheme info)
 *     ↓
 * All cursor operations use normalized text/offsets
 *     ↓
 * Display uses normalized text from wrappedLines
 *
 * This flow ensures consistent Unicode handling:
 * - NFD/NFC normalization differences don't break cursor movement
 * - Grapheme clusters (like 👨‍👩‍👧‍👦) are treated as single units
 * - Display width calculations are accurate for CJK characters
 *
 * RULE: Once text enters MeasuredText, all operations
 * work on the normalized version.
 */

// Pre-compiled regex patterns for Vim word detection (avoid creating in hot loops)
// VIM_WORD_CHAR_REGEX 命名 `/^[\p{L}\p{N}\p{M}_]$/u`，让后续代码直接表达这个值的用途。
export const VIM_WORD_CHAR_REGEX = /^[\p{L}\p{N}\p{M}_]$/u
// WHITESPACE_REGEX保存`/\s/`，供后续判断或组装使用。
export const WHITESPACE_REGEX = /\s/

// Exported helper functions for Vim character classification
// isVimWordChar封装成回调，供共享工具 Cursor在事件触发或异步步骤中调用。
export const isVimWordChar = (ch: string): boolean =>
  VIM_WORD_CHAR_REGEX.test(ch)
// isVimWhitespace封装成回调，供共享工具 Cursor在事件触发或异步步骤中调用。
export const isVimWhitespace = (ch: string): boolean =>
  WHITESPACE_REGEX.test(ch)
// isVimPunctuation封装成回调，供共享工具 Cursor在事件触发或异步步骤中调用。
export const isVimPunctuation = (ch: string): boolean =>
  ch.length > 0 && !isVimWhitespace(ch) && !isVimWordChar(ch)

// WrappedText 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WrappedText = string[]
// Position 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Position = {
  line: number
  column: number
}

// Cursor 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class Cursor {
  readonly offset: number
  constructor(
    readonly measuredText: MeasuredText,
    offset: number = 0,
    readonly selection: number = 0,
  ) {
    // it's ok for the cursor to be 1 char beyond the end of the string
    // 更新实例字段 offset 为 Math.max(0, Math.min(this.text.length, offset))，同步共享工具的内部状态。
    this.offset = Math.max(0, Math.min(this.text.length, offset))
  }

  // 共享工具 Cursor在这里处理 `static fromText(`，完成这一小步状态转换。
  static fromText(
    text: string,
    columns: number,
    offset: number = 0,
    selection: number = 0,
  ): Cursor {
    // make MeasuredText on less than columns width, to account for cursor
    // 返回 `new Cursor(new MeasuredText(text, columns - 1), offset, selection)`，作为共享工具这次计算的结果。
    return new Cursor(new MeasuredText(text, columns - 1), offset, selection)
  }

  // getViewportStartLine 根据 maxVisibleLines?: number 读取或计算共享工具需要的结果。
  getViewportStartLine(maxVisibleLines?: number): number {
    // 只有 `maxVisibleLines === undefined || maxVisibleLines <= 0` 满足时，共享工具才执行该分支。
    if (maxVisibleLines === undefined || maxVisibleLines <= 0) return 0
    // 从 `this.getPosition()` 解构 line，减少共享工具 Cursor对同一对象的重复访问。
    const { line } = this.getPosition()
    // allLines 集合读取`measuredText.getWrappedText`，供共享工具后续处理使用。
    const allLines = this.measuredText.getWrappedText()
    // 满足 `allLines.length <= maxVisibleLines` 时，共享工具执行该分支。
    if (allLines.length <= maxVisibleLines) return 0
    // half保存`Math.floor`，供共享工具后续处理使用。
    const half = Math.floor(maxVisibleLines / 2)
    // startLine保存`Math.max`，供共享工具后续处理使用。
    let startLine = Math.max(0, line - half)
    // endLine保存`Math.min`，供共享工具后续处理使用。
    const endLine = Math.min(allLines.length, startLine + maxVisibleLines)
    // 满足 `endLine - startLine < maxVisibleLines` 时，共享工具执行该分支。
    if (endLine - startLine < maxVisibleLines) {
      // startLine更新为 `Math.max(0, endLine - maxVisibleLines)`，确保共享工具后续读取最新状态。
      startLine = Math.max(0, endLine - maxVisibleLines)
    }
    // 返回 `startLine`，作为共享工具这次计算的结果。
    return startLine
  }

  // getViewportCharOffset 根据 maxVisibleLines?: number 读取或计算共享工具需要的结果。
  getViewportCharOffset(maxVisibleLines?: number): number {
    // startLine读取`this.getViewportStartLine`，供共享工具后续处理使用。
    const startLine = this.getViewportStartLine(maxVisibleLines)
    // 满足 `startLine === 0` 时，共享工具执行该分支。
    if (startLine === 0) return 0
    // wrappedLines 集合读取`measuredText.getWrappedLines`，供共享工具后续处理使用。
    const wrappedLines = this.measuredText.getWrappedLines()
    // 返回 `wrappedLines[startLine]?.startOffset ?? 0`，作为共享工具这次计算的结果。
    return wrappedLines[startLine]?.startOffset ?? 0
  }

  // getViewportCharEnd 根据 maxVisibleLines?: number 读取或计算共享工具需要的结果。
  getViewportCharEnd(maxVisibleLines?: number): number {
    // startLine读取`this.getViewportStartLine`，供共享工具后续处理使用。
    const startLine = this.getViewportStartLine(maxVisibleLines)
    // allLines 集合读取`measuredText.getWrappedLines`，供共享工具后续处理使用。
    const allLines = this.measuredText.getWrappedLines()
    // 只有 `maxVisibleLines === undefined || maxVisibleLines <= 0` 满足时，共享工具才执行该分支。
    if (maxVisibleLines === undefined || maxVisibleLines <= 0)
      // 返回 `this.text.length`，作为共享工具这次计算的结果。
      return this.text.length
    // endLine保存`Math.min`，供共享工具后续处理使用。
    const endLine = Math.min(allLines.length, startLine + maxVisibleLines)
    // 满足 `endLine >= allLines.length` 时，共享工具执行该分支。
    if (endLine >= allLines.length) return this.text.length
    // 返回 `allLines[endLine]?.startOffset ?? this.text.length`，作为共享工具这次计算的结果。
    return allLines[endLine]?.startOffset ?? this.text.length
  }

  // 调用 render，触发共享工具此处需要的副作用。
  render(
    cursorChar: string,
    mask: string,
    // 这个回调绑定到 invert: (text: string) => string,，负责共享工具在该局部场景下的响应。
    invert: (text: string) => string,
    ghostText?: { text: string; dim: (text: string) => string },
    maxVisibleLines?: number,
  ) {
    // 从 `this.getPosition()` 解构 line、column，减少共享工具 Cursor对同一对象的重复访问。
    const { line, column } = this.getPosition()
    // allLines 集合读取`measuredText.getWrappedText`，供共享工具后续处理使用。
    const allLines = this.measuredText.getWrappedText()

    // startLine读取`this.getViewportStartLine`，供共享工具后续处理使用。
    const startLine = this.getViewportStartLine(maxVisibleLines)
    // endLine 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const endLine =
      maxVisibleLines !== undefined && maxVisibleLines > 0
        ? Math.min(allLines.length, startLine + maxVisibleLines)
        : allLines.length

    // 返回 `allLines`，作为共享工具这次计算的结果。
    return allLines
      .slice(startLine, endLine)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map((text, i) => {
        // currentLine保存`i + startLine`，供后续判断或组装使用。
        const currentLine = i + startLine
        // displayText保存`text`，供共享工具 Cursor后续判断或输出使用。
        let displayText = text
        // 满足 `mask` 时，共享工具执行该分支。
        if (mask) {
          // graphemes 集合保存`Array.from`，供共享工具后续处理使用。
          const graphemes = Array.from(getGraphemeSegmenter().segment(text))
          // 满足 `currentLine === allLines.length - 1` 时，共享工具执行该分支。
          if (currentLine === allLines.length - 1) {
            // Last line: mask all but the trailing 6 chars so the user can
            // confirm they pasted the right thing without exposing the full token
            // visibleCount 数量保存`Math.min`，供共享工具后续处理使用。
            const visibleCount = Math.min(6, graphemes.length)
            // maskCount 数量 命名 `graphemes.length - visibleCount`，让后续代码直接表达这个值的用途。
            const maskCount = graphemes.length - visibleCount
            // splitOffset 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const splitOffset =
              graphemes.length > visibleCount ? graphemes[maskCount]!.index : 0
            // displayText更新为 `mask.repeat(maskCount) + text.slice(splitOffset)`，确保共享工具后续读取最新状态。
            displayText = mask.repeat(maskCount) + text.slice(splitOffset)
          } else {
            // Earlier wrapped lines: fully mask. Previously only the last line
            // was masked, leaking the start of the token on narrow terminals
            // where the pasted OAuth code wraps across multiple lines.
            // displayText更新为 `mask.repeat(graphemes.length)`，确保共享工具后续读取最新状态。
            displayText = mask.repeat(graphemes.length)
          }
        }
        // looking for the line with the cursor
        // `line` 与 `currentLine) return displayText...` 不一致时刷新派生状态，避免使用过期结果。
        if (line !== currentLine) return displayText.trimEnd()

        // Split the line into before/at/after cursor in a single pass over the
        // graphemes, accumulating display width until we reach the cursor column.
        // This replaces a two-pass approach (displayWidthToStringIndex + a second
        // segmenter pass) — the intermediate stringIndex from that approach is
        // always a grapheme boundary, so the "cursor in the middle of a
        // multi-codepoint character" branch was unreachable.
        // beforeCursor 命名 `''`，让后续代码直接表达这个值的用途。
        let beforeCursor = ''
        // atCursor保存`cursorChar`，供后续判断或组装使用。
        let atCursor = cursorChar
        // afterCursor保存`''`，作为后续固定文本处理的输入。
        let afterCursor = ''
        // currentWidth 命名 `0`，让后续代码直接表达这个值的用途。
        let currentWidth = 0
        // cursorFound标记共享工具 Cursor是否启用对应路径。
        let cursorFound = false

        // 循环处理 `const { segment } of getGraphemeSegmenter().segment(displayText)`，让共享工具把同类条目按顺序走完。
        for (const { segment } of getGraphemeSegmenter().segment(displayText)) {
          // 满足 `cursorFound` 时，共享工具执行该分支。
          if (cursorFound) {
            // 共享工具 Cursor在这里处理 `afterCursor += segment`，完成这一小步状态转换。
            afterCursor += segment
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // nextWidth保存`stringWidth`，供共享工具后续处理使用。
          const nextWidth = currentWidth + stringWidth(segment)
          // 满足 `nextWidth > column` 时，共享工具执行该分支。
          if (nextWidth > column) {
            // atCursor更新为 `segment`，确保共享工具后续读取最新状态。
            atCursor = segment
            // cursorFound更新为 `true`，确保共享工具后续读取最新状态。
            cursorFound = true
          } else {
            // currentWidth更新为 `nextWidth`，确保共享工具后续读取最新状态。
            currentWidth = nextWidth
            // 共享工具 Cursor在这里处理 `beforeCursor += segment`，完成这一小步状态转换。
            beforeCursor += segment
          }
        }

        // Only invert the cursor if we have a cursor character to show
        // When ghost text is present and cursor is at end, show first ghost char in cursor
        // renderedCursor 先占位，稍后的条件分支会根据实际输入补齐它。
        let renderedCursor: string
        // ghostSuffix 命名 `''`，让后续代码直接表达这个值的用途。
        let ghostSuffix = ''
        // 共享工具在这里按实际状态进入对应分支。
        if (
          ghostText &&
          currentLine === allLines.length - 1 &&
          this.isAtEnd() &&
          ghostText.text.length > 0
        ) {
          // First ghost character goes in the inverted cursor (grapheme-safe)
          // firstGhostChar 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const firstGhostChar =
            firstGrapheme(ghostText.text) || ghostText.text[0]!
          // renderedCursor更新为 `cursorChar ? invert(firstGhostChar) : firstGhostChar`，确保共享工具后续读取最新状态。
          renderedCursor = cursorChar ? invert(firstGhostChar) : firstGhostChar
          // Rest of ghost text is dimmed after cursor
          // ghostRest格式化`text.slice`，供共享工具后续处理使用。
          const ghostRest = ghostText.text.slice(firstGhostChar.length)
          // 满足 `ghostRest.length > 0` 时，共享工具执行该分支。
          if (ghostRest.length > 0) {
            // ghostSuffix更新为 `ghostText.dim(ghostRest)`，确保共享工具后续读取最新状态。
            ghostSuffix = ghostText.dim(ghostRest)
          }
        } else {
          // renderedCursor更新为 `cursorChar ? invert(atCursor) : atCursor`，确保共享工具后续读取最新状态。
          renderedCursor = cursorChar ? invert(atCursor) : atCursor
        }

        // 返回 `(`，作为共享工具这次计算的结果。
        return (
          beforeCursor + renderedCursor + ghostSuffix + afterCursor.trimEnd()
        )
      })
      .join('\n')
  }

  // left 使用 无 完成共享工具里的对应操作。
  left(): Cursor {
    // 满足 `this.offset === 0` 时，共享工具执行该分支。
    if (this.offset === 0) return this

    // chip保存`this.imageRefEndingAt`，供共享工具后续处理使用。
    const chip = this.imageRefEndingAt(this.offset)
    // 满足 `chip) return new Cursor(this.measuredText, chip.start` 时，共享工具执行该分支。
    if (chip) return new Cursor(this.measuredText, chip.start)

    // prevOffset保存`measuredText.prevOffset`，供共享工具后续处理使用。
    const prevOffset = this.measuredText.prevOffset(this.offset)
    // 返回 `new Cursor(this.measuredText, prevOffset)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, prevOffset)
  }

  // right 使用 无 完成共享工具里的对应操作。
  right(): Cursor {
    // 满足 `this.offset >= this.text.length` 时，共享工具执行该分支。
    if (this.offset >= this.text.length) return this

    // chip保存`this.imageRefStartingAt`，供共享工具后续处理使用。
    const chip = this.imageRefStartingAt(this.offset)
    // 满足 `chip) return new Cursor(this.measuredText, chip.end` 时，共享工具执行该分支。
    if (chip) return new Cursor(this.measuredText, chip.end)

    // nextOffset保存`measuredText.nextOffset`，供共享工具后续处理使用。
    const nextOffset = this.measuredText.nextOffset(this.offset)
    // 返回 `new Cursor(this.measuredText, Math.min(nextOffset, this.text.length))`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, Math.min(nextOffset, this.text.length))
  }

  /**
   * If an [Image #N] chip ends at `offset`, return its bounds. Used by left()
   * to hop the cursor over the chip instead of stepping into it.
   */
  // imageRefEndingAt 使用 offset: number 完成共享工具里的对应操作。
  imageRefEndingAt(offset: number): { start: number; end: number } | null {
    // m格式化`text.slice`，供共享工具后续处理使用。
    const m = this.text.slice(0, offset).match(/\[Image #\d+\]$/)
    // 返回 `m ? { start: offset - m[0].length, end: offset } : null`，作为共享工具这次计算的结果。
    return m ? { start: offset - m[0].length, end: offset } : null
  }

  // imageRefStartingAt 使用 offset: number 完成共享工具里的对应操作。
  imageRefStartingAt(offset: number): { start: number; end: number } | null {
    // m格式化`text.slice`，供共享工具后续处理使用。
    const m = this.text.slice(offset).match(/^\[Image #\d+\]/)
    // 返回 `m ? { start: offset, end: offset + m[0].length } : null`，作为共享工具这次计算的结果。
    return m ? { start: offset, end: offset + m[0].length } : null
  }

  /**
   * If offset lands strictly inside an [Image #N] chip, snap it to the given
   * boundary. Used by word-movement methods so Ctrl+W / Alt+D never leave a
   * partial chip.
   */
  // snapOutOfImageRef 使用 offset: number, toward: 'start' | 'end' 完成共享工具里的对应操作。
  snapOutOfImageRef(offset: number, toward: 'start' | 'end'): number {
    // re读取 `/\[Image #\d+\]/g` 对应条目，后续围绕该成员继续处理。
    const re = /\[Image #\d+\]/g
    // m 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let m
    // 只要 (m = re.exec(this.text)) !== null 成立，就持续推进共享工具中的循环处理。
    while ((m = re.exec(this.text)) !== null) {
      // start保存`m.index`，供共享工具 Cursor后续判断或输出使用。
      const start = m.index
      // end记录 `start + m[0].length` 是否成立，下一步按该结果分支。
      const end = start + m[0].length
      // 只有 `offset > start && offset < end` 满足时，共享工具才执行该分支。
      if (offset > start && offset < end) {
        // 返回 `toward === 'start' ? start : end`，作为共享工具这次计算的结果。
        return toward === 'start' ? start : end
      }
    }
    // 返回 `offset`，作为共享工具这次计算的结果。
    return offset
  }

  // up 使用 无 完成共享工具里的对应操作。
  up(): Cursor {
    // 从 `this.getPosition()` 解构 line、column，减少共享工具 Cursor对同一对象的重复访问。
    const { line, column } = this.getPosition()
    // 满足 `line === 0` 时，共享工具执行该分支。
    if (line === 0) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // prevLine读取`measuredText.getWrappedText`，供共享工具后续处理使用。
    const prevLine = this.measuredText.getWrappedText()[line - 1]
    // 满足 `prevLine === undefined` 时，共享工具执行该分支。
    if (prevLine === undefined) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // prevLineDisplayWidth保存`stringWidth`，供共享工具后续处理使用。
    const prevLineDisplayWidth = stringWidth(prevLine)
    // 满足 `column > prevLineDisplayWidth` 时，共享工具执行该分支。
    if (column > prevLineDisplayWidth) {
      // newOffset读取`this.getOffset`，供共享工具后续处理使用。
      const newOffset = this.getOffset({
        line: line - 1,
        column: prevLineDisplayWidth,
      })
      // 返回 `new Cursor(this.measuredText, newOffset, 0)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, newOffset, 0)
    }

    // newOffset读取`this.getOffset`，供共享工具后续处理使用。
    const newOffset = this.getOffset({ line: line - 1, column })
    // 返回 `new Cursor(this.measuredText, newOffset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, newOffset, 0)
  }

  // down 使用 无 完成共享工具里的对应操作。
  down(): Cursor {
    // 从 `this.getPosition()` 解构 line、column，减少共享工具 Cursor对同一对象的重复访问。
    const { line, column } = this.getPosition()
    // 满足 `line >= this.measuredText.lineCount - 1` 时，共享工具执行该分支。
    if (line >= this.measuredText.lineCount - 1) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // If there is no next line, stay on the current line,
    // and let the caller handle it (e.g. for prompt input,
    // we move to the next history entry)
    // nextLine读取`measuredText.getWrappedText`，供共享工具后续处理使用。
    const nextLine = this.measuredText.getWrappedText()[line + 1]
    // 满足 `nextLine === undefined` 时，共享工具执行该分支。
    if (nextLine === undefined) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // If the current column is past the end of the next line,
    // move to the end of the next line
    // nextLineDisplayWidth保存`stringWidth`，供共享工具后续处理使用。
    const nextLineDisplayWidth = stringWidth(nextLine)
    // 满足 `column > nextLineDisplayWidth` 时，共享工具执行该分支。
    if (column > nextLineDisplayWidth) {
      // newOffset读取`this.getOffset`，供共享工具后续处理使用。
      const newOffset = this.getOffset({
        line: line + 1,
        column: nextLineDisplayWidth,
      })
      // 返回 `new Cursor(this.measuredText, newOffset, 0)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, newOffset, 0)
    }

    // Otherwise, move to the same column on the next line
    // newOffset读取`this.getOffset`，供共享工具后续处理使用。
    const newOffset = this.getOffset({
      line: line + 1,
      column,
    })
    // 返回 `new Cursor(this.measuredText, newOffset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, newOffset, 0)
  }

  /**
   * Move to the start of the current line (column 0).
   * This is the raw version used internally by startOfLine.
   */
  // 共享工具 Cursor在这里处理 `private startOfCurrentLine(): Cursor {`，完成这一小步状态转换。
  private startOfCurrentLine(): Cursor {
    // 从 `this.getPosition()` 解构 line，减少共享工具 Cursor对同一对象的重复访问。
    const { line } = this.getPosition()
    // 返回 `new Cursor(`，作为共享工具这次计算的结果。
    return new Cursor(
      this.measuredText,
      this.getOffset({
        line,
        column: 0,
      }),
      0,
    )
  }

  // startOfLine 使用 无 完成共享工具里的对应操作。
  startOfLine(): Cursor {
    // 从 `this.getPosition()` 解构 line、column，减少共享工具 Cursor对同一对象的重复访问。
    const { line, column } = this.getPosition()

    // If already at start of line and not at first line, move to previous line
    // 只有 `column === 0 && line > 0` 满足时，共享工具才执行该分支。
    if (column === 0 && line > 0) {
      // 返回 `new Cursor(`，作为共享工具这次计算的结果。
      return new Cursor(
        this.measuredText,
        this.getOffset({
          line: line - 1,
          column: 0,
        }),
        0,
      )
    }

    // 返回 `this.startOfCurrentLine()`，作为共享工具这次计算的结果。
    return this.startOfCurrentLine()
  }

  // firstNonBlankInLine 使用 无 完成共享工具里的对应操作。
  firstNonBlankInLine(): Cursor {
    // 从 `this.getPosition()` 解构 line，减少共享工具 Cursor对同一对象的重复访问。
    const { line } = this.getPosition()
    // lineText读取`measuredText.getWrappedText`，供共享工具后续处理使用。
    const lineText = this.measuredText.getWrappedText()[line] || ''

    // match匹配`lineText.match`，供共享工具后续处理使用。
    const match = lineText.match(/^\s*\S/)
    // column保存 `match?.index ? match.index + match[0].length - 1 : 0` 的判断结果，供共享工具 Cursor后续分支直接复用。
    const column = match?.index ? match.index + match[0].length - 1 : 0
    // offset读取`this.getOffset`，供共享工具后续处理使用。
    const offset = this.getOffset({ line, column })

    // 返回 `new Cursor(this.measuredText, offset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, offset, 0)
  }

  // endOfLine 使用 无 完成共享工具里的对应操作。
  endOfLine(): Cursor {
    // 从 `this.getPosition()` 解构 line，减少共享工具 Cursor对同一对象的重复访问。
    const { line } = this.getPosition()
    // column读取`measuredText.getLineLength`，供共享工具后续处理使用。
    const column = this.measuredText.getLineLength(line)
    // offset读取`this.getOffset`，供共享工具后续处理使用。
    const offset = this.getOffset({ line, column })
    // 返回 `new Cursor(this.measuredText, offset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, offset, 0)
  }

  // Helper methods for finding logical line boundaries
  // 共享工具 Cursor在这里处理 `private findLogicalLineStart(fromOffset: number = this.offset): number {`，完成这一小步状态转换。
  private findLogicalLineStart(fromOffset: number = this.offset): number {
    // prevNewline保存`text.lastIndexOf`，供共享工具后续处理使用。
    const prevNewline = this.text.lastIndexOf('\n', fromOffset - 1)
    // 返回 `prevNewline === -1 ? 0 : prevNewline + 1`，作为共享工具这次计算的结果。
    return prevNewline === -1 ? 0 : prevNewline + 1
  }

  // 共享工具 Cursor在这里处理 `private findLogicalLineEnd(fromOffset: number = this.offset): number {`，完成这一小步状态转换。
  private findLogicalLineEnd(fromOffset: number = this.offset): number {
    // nextNewline保存`text.indexOf`，供共享工具后续处理使用。
    const nextNewline = this.text.indexOf('\n', fromOffset)
    // 返回 `nextNewline === -1 ? this.text.length : nextNewline`，作为共享工具这次计算的结果。
    return nextNewline === -1 ? this.text.length : nextNewline
  }

  // Helper to get logical line bounds for current position
  // 共享工具 Cursor在这里处理 `private getLogicalLineBounds(): { start: number; end: number } {`，完成这一小步状态转换。
  private getLogicalLineBounds(): { start: number; end: number } {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      start: this.findLogicalLineStart(),
      end: this.findLogicalLineEnd(),
    }
  }

  // Helper to create cursor with preserved column, clamped to line length
  // Snaps to grapheme boundary to avoid landing mid-grapheme
  // 共享工具 Cursor在这里处理 `private createCursorWithColumn(`，完成这一小步状态转换。
  private createCursorWithColumn(
    lineStart: number,
    lineEnd: number,
    targetColumn: number,
  ): Cursor {
    // lineLength 数量保存`lineEnd - lineStart`，供后续判断或组装使用。
    const lineLength = lineEnd - lineStart
    // clampedColumn保存`Math.min`，供共享工具后续处理使用。
    const clampedColumn = Math.min(targetColumn, lineLength)
    // rawOffset保存`lineStart + clampedColumn`，供共享工具 Cursor后续判断或输出使用。
    const rawOffset = lineStart + clampedColumn
    // offset保存`measuredText.snapToGraphemeBoundary`，供共享工具后续处理使用。
    const offset = this.measuredText.snapToGraphemeBoundary(rawOffset)
    // 返回 `new Cursor(this.measuredText, offset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, offset, 0)
  }

  // endOfLogicalLine 使用 无 完成共享工具里的对应操作。
  endOfLogicalLine(): Cursor {
    // 返回 `new Cursor(this.measuredText, this.findLogicalLineEnd(), 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, this.findLogicalLineEnd(), 0)
  }

  // startOfLogicalLine 使用 无 完成共享工具里的对应操作。
  startOfLogicalLine(): Cursor {
    // 返回 `new Cursor(this.measuredText, this.findLogicalLineStart(), 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, this.findLogicalLineStart(), 0)
  }

  // firstNonBlankInLogicalLine 使用 无 完成共享工具里的对应操作。
  firstNonBlankInLogicalLine(): Cursor {
    // 从 `this.getLogicalLineBounds()` 解构 start、end，减少共享工具 Cursor对同一对象的重复访问。
    const { start, end } = this.getLogicalLineBounds()
    // lineText格式化`text.slice`，供共享工具后续处理使用。
    const lineText = this.text.slice(start, end)
    // match匹配`lineText.match`，供共享工具后续处理使用。
    const match = lineText.match(/\S/)
    // offset保存`start + (match?.index ?? 0)`，供共享工具 Cursor后续判断或输出使用。
    const offset = start + (match?.index ?? 0)
    // 返回 `new Cursor(this.measuredText, offset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, offset, 0)
  }

  // upLogicalLine 使用 无 完成共享工具里的对应操作。
  upLogicalLine(): Cursor {
    // 从 `this.getLogicalLineBounds()` 解构 start，减少共享工具 Cursor对同一对象的重复访问。
    const { start: currentStart } = this.getLogicalLineBounds()

    // At first line - stay at beginning
    // 满足 `currentStart === 0` 时，共享工具执行该分支。
    if (currentStart === 0) {
      // 返回 `new Cursor(this.measuredText, 0, 0)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, 0, 0)
    }

    // Calculate target column position
    // currentColumn保存`this.offset - currentStart`，供共享工具 Cursor后续判断或输出使用。
    const currentColumn = this.offset - currentStart

    // Find previous line bounds
    // prevLineEnd 命名 `currentStart - 1`，让后续代码直接表达这个值的用途。
    const prevLineEnd = currentStart - 1
    // prevLineStart筛选`this.findLogicalLineStart`，供共享工具后续处理使用。
    const prevLineStart = this.findLogicalLineStart(prevLineEnd)

    // 返回 `this.createCursorWithColumn(`，作为共享工具这次计算的结果。
    return this.createCursorWithColumn(
      prevLineStart,
      prevLineEnd,
      currentColumn,
    )
  }

  // downLogicalLine 使用 无 完成共享工具里的对应操作。
  downLogicalLine(): Cursor {
    // 从 `this.getLogicalLineBounds()` 解构 start、end，减少共享工具 Cursor对同一对象的重复访问。
    const { start: currentStart, end: currentEnd } = this.getLogicalLineBounds()

    // At last line - stay at end
    // 满足 `currentEnd >= this.text.length` 时，共享工具执行该分支。
    if (currentEnd >= this.text.length) {
      // 返回 `new Cursor(this.measuredText, this.text.length, 0)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, this.text.length, 0)
    }

    // Calculate target column position
    // currentColumn保存`this.offset - currentStart`，供共享工具 Cursor后续判断或输出使用。
    const currentColumn = this.offset - currentStart

    // Find next line bounds
    // nextLineStart 命名 `currentEnd + 1`，让后续代码直接表达这个值的用途。
    const nextLineStart = currentEnd + 1
    // nextLineEnd筛选`this.findLogicalLineEnd`，供共享工具后续处理使用。
    const nextLineEnd = this.findLogicalLineEnd(nextLineStart)

    // 返回 `this.createCursorWithColumn(`，作为共享工具这次计算的结果。
    return this.createCursorWithColumn(
      nextLineStart,
      nextLineEnd,
      currentColumn,
    )
  }

  // Vim word vs WORD movements:
  // - word (lowercase w/b/e): sequences of letters, digits, and underscores
  // - WORD (uppercase W/B/E): sequences of non-whitespace characters
  // For example, in "hello-world!", word movements see 3 words: "hello", "world", and nothing
  // But WORD movements see 1 WORD: "hello-world!"

  // nextWord 使用 无 完成共享工具里的对应操作。
  nextWord(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // Use Intl.Segmenter for proper word boundary detection (including CJK)
    // wordBoundaries 集合读取`measuredText.getWordBoundaries`，供共享工具后续处理使用。
    const wordBoundaries = this.measuredText.getWordBoundaries()

    // Find the next word start boundary after current position
    // 按顺序遍历 `wordBoundaries` 中的boundary，逐个交给共享工具处理。
    for (const boundary of wordBoundaries) {
      // 只有 `boundary.isWordLike && boundary.start > this.offs` 满足时，共享工具才执行该分支。
      if (boundary.isWordLike && boundary.start > this.offset) {
        // 返回 `new Cursor(this.measuredText, boundary.start)`，作为共享工具这次计算的结果。
        return new Cursor(this.measuredText, boundary.start)
      }
    }

    // If no next word found, go to end
    // 返回 `new Cursor(this.measuredText, this.text.length)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, this.text.length)
  }

  // endOfWord 使用 无 完成共享工具里的对应操作。
  endOfWord(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // Use Intl.Segmenter for proper word boundary detection (including CJK)
    // wordBoundaries 集合读取`measuredText.getWordBoundaries`，供共享工具后续处理使用。
    const wordBoundaries = this.measuredText.getWordBoundaries()

    // Find the current word boundary we're in
    // 按顺序遍历 `wordBoundaries` 中的boundary，逐个交给共享工具处理。
    for (const boundary of wordBoundaries) {
      // boundary.isWordLike缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!boundary.isWordLike) continue

      // If we're inside this word but NOT at the last character
      // 只有 `this.offset >= boundary.start && this.offset < bo` 满足时，共享工具才执行该分支。
      if (this.offset >= boundary.start && this.offset < boundary.end - 1) {
        // Move to end of this word (last character position)
        // 返回 `new Cursor(this.measuredText, boundary.end - 1)`，作为共享工具这次计算的结果。
        return new Cursor(this.measuredText, boundary.end - 1)
      }

      // If we're at the last character of a word (end - 1), find the next word's end
      // 满足 `this.offset === boundary.end - 1` 时，共享工具执行该分支。
      if (this.offset === boundary.end - 1) {
        // Find next word
        // 按顺序遍历 `wordBoundaries` 中的nextBoundary，逐个交给共享工具处理。
        for (const nextBoundary of wordBoundaries) {
          // 只有 `nextBoundary.isWordLike && nextBoundary.start > t` 满足时，共享工具才执行该分支。
          if (nextBoundary.isWordLike && nextBoundary.start > this.offset) {
            // 返回 `new Cursor(this.measuredText, nextBoundary.end - 1)`，作为共享工具这次计算的结果。
            return new Cursor(this.measuredText, nextBoundary.end - 1)
          }
        }
        // 返回 `this`，作为共享工具这次计算的结果。
        return this
      }
    }

    // If not in a word, find the next word and go to its end
    // 按顺序遍历 `wordBoundaries` 中的boundary，逐个交给共享工具处理。
    for (const boundary of wordBoundaries) {
      // 只有 `boundary.isWordLike && boundary.start > this.offs` 满足时，共享工具才执行该分支。
      if (boundary.isWordLike && boundary.start > this.offset) {
        // 返回 `new Cursor(this.measuredText, boundary.end - 1)`，作为共享工具这次计算的结果。
        return new Cursor(this.measuredText, boundary.end - 1)
      }
    }

    // 返回 `this`，作为共享工具这次计算的结果。
    return this
  }

  // prevWord 使用 无 完成共享工具里的对应操作。
  prevWord(): Cursor {
    // 满足 `this.isAtStart()` 时，共享工具执行该分支。
    if (this.isAtStart()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // Use Intl.Segmenter for proper word boundary detection (including CJK)
    // wordBoundaries 集合读取`measuredText.getWordBoundaries`，供共享工具后续处理使用。
    const wordBoundaries = this.measuredText.getWordBoundaries()

    // Find the previous word start boundary before current position
    // We need to iterate in reverse to find the previous word
    // prevWordStart初始化为空值，后续分支会在有数据时补齐。
    let prevWordStart: number | null = null

    // 按顺序遍历 `wordBoundaries` 中的boundary，逐个交给共享工具处理。
    for (const boundary of wordBoundaries) {
      // boundary.isWordLike缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!boundary.isWordLike) continue

      // If we're at or after the start of this word, but this word starts before us
      // 满足 `boundary.start < this.offset` 时，共享工具执行该分支。
      if (boundary.start < this.offset) {
        // If we're inside this word (not at the start), go to its start
        // 只有 `this.offset > boundary.start && this.offset <= bo` 满足时，共享工具才执行该分支。
        if (this.offset > boundary.start && this.offset <= boundary.end) {
          // 返回 `new Cursor(this.measuredText, boundary.start)`，作为共享工具这次计算的结果。
          return new Cursor(this.measuredText, boundary.start)
        }
        // Otherwise, remember this as a candidate for previous word
        // prevWordStart更新为 `boundary.start`，确保共享工具后续读取最新状态。
        prevWordStart = boundary.start
      }
    }

    // `prevWordStart` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (prevWordStart !== null) {
      // 返回 `new Cursor(this.measuredText, prevWordStart)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, prevWordStart)
    }

    // 返回 `new Cursor(this.measuredText, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, 0)
  }

  // Vim-specific word methods
  // In Vim, a "word" is either:
  // 1. A sequence of word characters (letters, digits, underscore) - including Unicode
  // 2. A sequence of non-blank, non-word characters (punctuation/symbols)

  // nextVimWord 使用 无 完成共享工具里的对应操作。
  nextVimWord(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // pos 集合保存`this.offset`，供共享工具 Cursor后续判断或输出使用。
    let pos = this.offset
    // advance保存`measuredText.nextOffset`，供共享工具后续处理使用。
    const advance = (p: number): number => this.measuredText.nextOffset(p)

    // currentGrapheme保存`this.graphemeAt`，供共享工具后续处理使用。
    const currentGrapheme = this.graphemeAt(pos)
    // currentGrapheme缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!currentGrapheme) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // 满足 `isVimWordChar(currentGrapheme)` 时，共享工具执行该分支。
    if (isVimWordChar(currentGrapheme)) {
      // 只要 pos < this.text.length && isVimWordChar(this.graphemeAt(pos)) 成立，就持续推进共享工具中的循环处理。
      while (pos < this.text.length && isVimWordChar(this.graphemeAt(pos))) {
        // pos 集合更新为 `advance(pos)`，确保共享工具后续读取最新状态。
        pos = advance(pos)
      }
    // 共享工具 Cursor在这里处理 `} else if (isVimPunctuation(currentGrapheme)) {`，完成这一小步状态转换。
    } else if (isVimPunctuation(currentGrapheme)) {
      // 只要 pos < this.text.length && isVimPunctuation(this.graphemeAt(pos)) 成立，就持续推进共享工具中的循环处理。
      while (pos < this.text.length && isVimPunctuation(this.graphemeAt(pos))) {
        // pos 集合更新为 `advance(pos)`，确保共享工具后续读取最新状态。
        pos = advance(pos)
      }
    }

    // 调用 while，触发共享工具此处需要的副作用。
    while (
      pos < this.text.length &&
      WHITESPACE_REGEX.test(this.graphemeAt(pos))
    ) {
      // pos 集合更新为 `advance(pos)`，确保共享工具后续读取最新状态。
      pos = advance(pos)
    }

    // 返回 `new Cursor(this.measuredText, pos)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, pos)
  }

  // endOfVimWord 使用 无 完成共享工具里的对应操作。
  endOfVimWord(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // 文本内容保存`this.text`，供共享工具 Cursor后续判断或输出使用。
    const text = this.text
    // pos 集合保存`this.offset`，供共享工具 Cursor后续判断或输出使用。
    let pos = this.offset
    // advance保存`measuredText.nextOffset`，供共享工具后续处理使用。
    const advance = (p: number): number => this.measuredText.nextOffset(p)

    // 满足 `this.graphemeAt(pos) === ''` 时，共享工具执行该分支。
    if (this.graphemeAt(pos) === '') {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // pos 集合更新为 `advance(pos)`，确保共享工具后续读取最新状态。
    pos = advance(pos)

    // 只要 pos < text.length && WHITESPACE_REGEX.test(this.graphemeAt(pos)) 成立，就持续推进共享工具中的循环处理。
    while (pos < text.length && WHITESPACE_REGEX.test(this.graphemeAt(pos))) {
      // pos 集合更新为 `advance(pos)`，确保共享工具后续读取最新状态。
      pos = advance(pos)
    }

    // 满足 `pos >= text.length` 时，共享工具执行该分支。
    if (pos >= text.length) {
      // 返回 `new Cursor(this.measuredText, text.length)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, text.length)
    }

    // charAtPos 集合保存`this.graphemeAt`，供共享工具后续处理使用。
    const charAtPos = this.graphemeAt(pos)
    // 满足 `isVimWordChar(charAtPos)` 时，共享工具执行该分支。
    if (isVimWordChar(charAtPos)) {
      // while 使用 pos < text.length 完成共享工具里的对应操作。
      while (pos < text.length) {
        // nextPos 集合保存`advance`，供共享工具后续处理使用。
        const nextPos = advance(pos)
        // 只有 `nextPos >= text.length || !isVimWordChar(this.graphemeAt(nextPos))` 满足时，共享工具才执行该分支。
        if (nextPos >= text.length || !isVimWordChar(this.graphemeAt(nextPos)))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        // pos 集合更新为 `nextPos`，确保共享工具后续读取最新状态。
        pos = nextPos
      }
    // 共享工具 Cursor在这里处理 `} else if (isVimPunctuation(charAtPos)) {`，完成这一小步状态转换。
    } else if (isVimPunctuation(charAtPos)) {
      // while 使用 pos < text.length 完成共享工具里的对应操作。
      while (pos < text.length) {
        // nextPos 集合保存`advance`，供共享工具后续处理使用。
        const nextPos = advance(pos)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          nextPos >= text.length ||
          !isVimPunctuation(this.graphemeAt(nextPos))
        )
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        // pos 集合更新为 `nextPos`，确保共享工具后续读取最新状态。
        pos = nextPos
      }
    }

    // 返回 `new Cursor(this.measuredText, pos)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, pos)
  }

  // prevVimWord 使用 无 完成共享工具里的对应操作。
  prevVimWord(): Cursor {
    // 满足 `this.isAtStart()` 时，共享工具执行该分支。
    if (this.isAtStart()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // pos 集合保存`this.offset`，供共享工具 Cursor后续判断或输出使用。
    let pos = this.offset
    // retreat保存`measuredText.prevOffset`，供共享工具后续处理使用。
    const retreat = (p: number): number => this.measuredText.prevOffset(p)

    // pos 集合更新为 `retreat(pos)`，确保共享工具后续读取最新状态。
    pos = retreat(pos)

    // 只要 pos > 0 && WHITESPACE_REGEX.test(this.graphemeAt(pos)) 成立，就持续推进共享工具中的循环处理。
    while (pos > 0 && WHITESPACE_REGEX.test(this.graphemeAt(pos))) {
      // pos 集合更新为 `retreat(pos)`，确保共享工具后续读取最新状态。
      pos = retreat(pos)
    }

    // At position 0 with whitespace means no previous word exists, go to start
    // 只有 `pos === 0 && WHITESPACE_REGEX.test(this.graphemeAt(0))` 满足时，共享工具才执行该分支。
    if (pos === 0 && WHITESPACE_REGEX.test(this.graphemeAt(0))) {
      // 返回 `new Cursor(this.measuredText, 0)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, 0)
    }

    // charAtPos 集合保存`this.graphemeAt`，供共享工具后续处理使用。
    const charAtPos = this.graphemeAt(pos)
    // 满足 `isVimWordChar(charAtPos)` 时，共享工具执行该分支。
    if (isVimWordChar(charAtPos)) {
      // while 使用 pos > 0 完成共享工具里的对应操作。
      while (pos > 0) {
        // prevPos 集合保存`retreat`，供共享工具后续处理使用。
        const prevPos = retreat(pos)
        // 满足 `!isVimWordChar(this.graphemeAt(prevPos))` 时，共享工具执行该分支。
        if (!isVimWordChar(this.graphemeAt(prevPos))) break
        // pos 集合更新为 `prevPos`，确保共享工具后续读取最新状态。
        pos = prevPos
      }
    // 共享工具 Cursor在这里处理 `} else if (isVimPunctuation(charAtPos)) {`，完成这一小步状态转换。
    } else if (isVimPunctuation(charAtPos)) {
      // while 使用 pos > 0 完成共享工具里的对应操作。
      while (pos > 0) {
        // prevPos 集合保存`retreat`，供共享工具后续处理使用。
        const prevPos = retreat(pos)
        // 满足 `!isVimPunctuation(this.graphemeAt(prevPos))` 时，共享工具执行该分支。
        if (!isVimPunctuation(this.graphemeAt(prevPos))) break
        // pos 集合更新为 `prevPos`，确保共享工具后续读取最新状态。
        pos = prevPos
      }
    }

    // 返回 `new Cursor(this.measuredText, pos)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, pos)
  }

  // nextWORD 使用 无 完成共享工具里的对应操作。
  nextWORD(): Cursor {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    // nextCursor保存`this`，供共享工具 Cursor后续判断或输出使用。
    let nextCursor: Cursor = this
    // If we're on a non-whitespace character, move to the next whitespace
    // 只要 !nextCursor.isOverWhitespace() && !nextCursor.isAtEnd() 成立，就持续推进共享工具中的循环处理。
    while (!nextCursor.isOverWhitespace() && !nextCursor.isAtEnd()) {
      // nextCursor更新为 `nextCursor.right()`，确保共享工具后续读取最新状态。
      nextCursor = nextCursor.right()
    }
    // now move to the next non-whitespace character
    // 只要 nextCursor.isOverWhitespace() && !nextCursor.isAtEnd() 成立，就持续推进共享工具中的循环处理。
    while (nextCursor.isOverWhitespace() && !nextCursor.isAtEnd()) {
      // nextCursor更新为 `nextCursor.right()`，确保共享工具后续读取最新状态。
      nextCursor = nextCursor.right()
    }
    // 返回 `nextCursor`，作为共享工具这次计算的结果。
    return nextCursor
  }

  // endOfWORD 使用 无 完成共享工具里的对应操作。
  endOfWORD(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    // cursor保存`this`，供共享工具 Cursor后续判断或输出使用。
    let cursor: Cursor = this

    // Check if we're already at the end of a WORD
    // (current character is non-whitespace, but next character is whitespace or we're at the end)
    // atEndOfWORD 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const atEndOfWORD =
      !cursor.isOverWhitespace() &&
      (cursor.right().isOverWhitespace() || cursor.right().isAtEnd())

    // 满足 `atEndOfWORD` 时，共享工具执行该分支。
    if (atEndOfWORD) {
      // We're already at the end of a WORD, move to the next WORD
      // cursor更新为 `cursor.right()`，确保共享工具后续读取最新状态。
      cursor = cursor.right()
      // 返回 `cursor.endOfWORD()`，作为共享工具这次计算的结果。
      return cursor.endOfWORD()
    }

    // If we're on a whitespace character, find the next WORD
    // 满足 `cursor.isOverWhitespace()` 时，共享工具执行该分支。
    if (cursor.isOverWhitespace()) {
      // cursor更新为 `cursor.nextWORD()`，确保共享工具后续读取最新状态。
      cursor = cursor.nextWORD()
    }

    // Now move to the end of the current WORD
    // 只要 !cursor.right().isOverWhitespace() && !cursor.isAtEnd() 成立，就持续推进共享工具中的循环处理。
    while (!cursor.right().isOverWhitespace() && !cursor.isAtEnd()) {
      // cursor更新为 `cursor.right()`，确保共享工具后续读取最新状态。
      cursor = cursor.right()
    }

    // 返回 `cursor`，作为共享工具这次计算的结果。
    return cursor
  }

  // prevWORD 使用 无 完成共享工具里的对应操作。
  prevWORD(): Cursor {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    // cursor保存`this`，供共享工具 Cursor后续判断或输出使用。
    let cursor: Cursor = this

    // if we are already at the beginning of a WORD, step off it
    // 满足 `cursor.left().isOverWhitespace()` 时，共享工具执行该分支。
    if (cursor.left().isOverWhitespace()) {
      // cursor更新为 `cursor.left()`，确保共享工具后续读取最新状态。
      cursor = cursor.left()
    }

    // Move left over any whitespace characters
    // 只要 cursor.isOverWhitespace() && !cursor.isAtStart() 成立，就持续推进共享工具中的循环处理。
    while (cursor.isOverWhitespace() && !cursor.isAtStart()) {
      // cursor更新为 `cursor.left()`，确保共享工具后续读取最新状态。
      cursor = cursor.left()
    }

    // If we're over a non-whitespace character, move to the start of this WORD
    // 满足 `!cursor.isOverWhitespace()` 时，共享工具执行该分支。
    if (!cursor.isOverWhitespace()) {
      // 只要 !cursor.left().isOverWhitespace() && !cursor.isAtStart() 成立，就持续推进共享工具中的循环处理。
      while (!cursor.left().isOverWhitespace() && !cursor.isAtStart()) {
        // cursor更新为 `cursor.left()`，确保共享工具后续读取最新状态。
        cursor = cursor.left()
      }
    }

    // 返回 `cursor`，作为共享工具这次计算的结果。
    return cursor
  }

  // modifyText 使用 end: Cursor, insertString: string = '' 完成共享工具里的对应操作。
  modifyText(end: Cursor, insertString: string = ''): Cursor {
    // startOffset保存`this.offset`，供后续判断或组装使用。
    const startOffset = this.offset
    // endOffset保存`end.offset`，供共享工具 Cursor后续判断或输出使用。
    const endOffset = end.offset

    // newText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const newText =
      this.text.slice(0, startOffset) +
      insertString +
      this.text.slice(endOffset)

    // 返回 `Cursor.fromText(`，作为共享工具这次计算的结果。
    return Cursor.fromText(
      newText,
      this.columns,
      startOffset + insertString.normalize('NFC').length,
    )
  }

  // insert 使用 insertString: string 完成共享工具里的对应操作。
  insert(insertString: string): Cursor {
    // newCursor保存`this.modifyText`，供共享工具后续处理使用。
    const newCursor = this.modifyText(this, insertString)
    // 返回 `newCursor`，作为共享工具这次计算的结果。
    return newCursor
  }

  // del 使用 无 完成共享工具里的对应操作。
  del(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }
    // 返回 `this.modifyText(this.right())`，作为共享工具这次计算的结果。
    return this.modifyText(this.right())
  }

  // backspace 使用 无 完成共享工具里的对应操作。
  backspace(): Cursor {
    // 满足 `this.isAtStart()` 时，共享工具执行该分支。
    if (this.isAtStart()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }
    // 返回 `this.left().modifyText(this)`，作为共享工具这次计算的结果。
    return this.left().modifyText(this)
  }

  // deleteToLineStart 使用 无 完成共享工具里的对应操作。
  deleteToLineStart(): { cursor: Cursor; killed: string } {
    // If cursor is right after a newline (at start of line), delete just that
    // newline — symmetric with deleteToLineEnd's newline handling. This lets
    // repeated ctrl+u clear across lines.
    // 只有 `this.offset > 0 && this.text[this.offset - 1] ===` 满足时，共享工具才执行该分支。
    if (this.offset > 0 && this.text[this.offset - 1] === '\n') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { cursor: this.left().modifyText(this), killed: '\n' }
    }

    // Use startOfLine() so that at column 0 of a wrapped visual line,
    // the cursor moves to the previous visual line's start instead of
    // getting stuck.
    // startCursor保存`this.startOfLine`，供共享工具后续处理使用。
    const startCursor = this.startOfLine()
    // killed格式化`text.slice`，供共享工具后续处理使用。
    const killed = this.text.slice(startCursor.offset, this.offset)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { cursor: startCursor.modifyText(this), killed }
  }

  // deleteToLineEnd 使用 无 完成共享工具里的对应操作。
  deleteToLineEnd(): { cursor: Cursor; killed: string } {
    // If cursor is on a newline character, delete just that character
    // 当 `this.text[this.offset]` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (this.text[this.offset] === '\n') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { cursor: this.modifyText(this.right()), killed: '\n' }
    }

    // endCursor保存`this.endOfLine`，供共享工具后续处理使用。
    const endCursor = this.endOfLine()
    // killed格式化`text.slice`，供共享工具后续处理使用。
    const killed = this.text.slice(this.offset, endCursor.offset)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { cursor: this.modifyText(endCursor), killed }
  }

  // deleteToLogicalLineEnd 使用 无 完成共享工具里的对应操作。
  deleteToLogicalLineEnd(): Cursor {
    // If cursor is on a newline character, delete just that character
    // 当 `this.text[this.offset]` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (this.text[this.offset] === '\n') {
      // 返回 `this.modifyText(this.right())`，作为共享工具这次计算的结果。
      return this.modifyText(this.right())
    }

    // 返回 `this.modifyText(this.endOfLogicalLine())`，作为共享工具这次计算的结果。
    return this.modifyText(this.endOfLogicalLine())
  }

  // deleteWordBefore 使用 无 完成共享工具里的对应操作。
  deleteWordBefore(): { cursor: Cursor; killed: string } {
    // 满足 `this.isAtStart()` 时，共享工具执行该分支。
    if (this.isAtStart()) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { cursor: this, killed: '' }
    }
    // target保存`this.snapOutOfImageRef`，供共享工具后续处理使用。
    const target = this.snapOutOfImageRef(this.prevWord().offset, 'start')
    // prevWordCursor保存`Cursor`，供共享工具后续处理使用。
    const prevWordCursor = new Cursor(this.measuredText, target)
    // killed格式化`text.slice`，供共享工具后续处理使用。
    const killed = this.text.slice(prevWordCursor.offset, this.offset)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { cursor: prevWordCursor.modifyText(this), killed }
  }

  /**
   * Deletes a token before the cursor if one exists.
   * Supports pasted text refs: [Pasted text #1], [Pasted text #1 +10 lines],
   * [...Truncated text #1 +10 lines...]
   *
   * Note: @mentions are NOT tokenized since users may want to correct typos
   * in file paths. Use Ctrl/Cmd+backspace for word-deletion on mentions.
   *
   * Returns null if no token found at cursor position.
   * Only triggers when cursor is at end of token (followed by whitespace or EOL).
   */
  // deleteTokenBefore 使用 无 完成共享工具里的对应操作。
  deleteTokenBefore(): Cursor | null {
    // Cursor at chip.start is the "selected" state — backspace deletes the
    // chip forward, not the char before it.
    // chipAfter保存`this.imageRefStartingAt`，供共享工具后续处理使用。
    const chipAfter = this.imageRefStartingAt(this.offset)
    // 满足 `chipAfter` 时，共享工具执行该分支。
    if (chipAfter) {
      // end 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const end =
        this.text[chipAfter.end] === ' ' ? chipAfter.end + 1 : chipAfter.end
      // 返回 `this.modifyText(new Cursor(this.measuredText, end))`，作为共享工具这次计算的结果。
      return this.modifyText(new Cursor(this.measuredText, end))
    }

    // 满足 `this.isAtStart()` 时，共享工具执行该分支。
    if (this.isAtStart()) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Only trigger if cursor is at a word boundary (whitespace or end of string after cursor)
    // charAfter 命名 `this.text[this.offset]`，让后续代码直接表达这个值的用途。
    const charAfter = this.text[this.offset]
    // `charAfter` 与 `undefined && !/\s/.test(charAft...` 不一致时刷新派生状态，避免使用过期结果。
    if (charAfter !== undefined && !/\s/.test(charAfter)) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // textBefore格式化`text.slice`，供共享工具后续处理使用。
    const textBefore = this.text.slice(0, this.offset)

    // Check for pasted/truncated text refs: [Pasted text #1] or [...Truncated text #1 +50 lines...]
    // pasteMatch匹配`textBefore.match`，供共享工具后续处理使用。
    const pasteMatch = textBefore.match(
      /(^|\s)\[(Pasted text #\d+(?: \+\d+ lines)?|Image #\d+|\.\.\.Truncated text #\d+ \+\d+ lines\.\.\.)\]$/,
    )
    // 满足 `pasteMatch` 时，共享工具执行该分支。
    if (pasteMatch) {
      // matchStart记录 `pasteMatch.index! + pasteMatch[1]!.length` 是否成立，下一步按该结果分支。
      const matchStart = pasteMatch.index! + pasteMatch[1]!.length
      // 返回 `new Cursor(this.measuredText, matchStart).modifyText(this)`，作为共享工具这次计算的结果。
      return new Cursor(this.measuredText, matchStart).modifyText(this)
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // deleteWordAfter 使用 无 完成共享工具里的对应操作。
  deleteWordAfter(): Cursor {
    // 满足 `this.isAtEnd()` 时，共享工具执行该分支。
    if (this.isAtEnd()) {
      // 返回 `this`，作为共享工具这次计算的结果。
      return this
    }

    // target保存`this.snapOutOfImageRef`，供共享工具后续处理使用。
    const target = this.snapOutOfImageRef(this.nextWord().offset, 'end')
    // 返回 `this.modifyText(new Cursor(this.measuredText, target))`，作为共享工具这次计算的结果。
    return this.modifyText(new Cursor(this.measuredText, target))
  }

  // 共享工具 Cursor在这里处理 `private graphemeAt(pos: number): string {`，完成这一小步状态转换。
  private graphemeAt(pos: number): string {
    // 满足 `pos >= this.text.length` 时，共享工具执行该分支。
    if (pos >= this.text.length) return ''
    // nextOff保存`measuredText.nextOffset`，供共享工具后续处理使用。
    const nextOff = this.measuredText.nextOffset(pos)
    // 返回 `this.text.slice(pos, nextOff)`，作为共享工具这次计算的结果。
    return this.text.slice(pos, nextOff)
  }

  // 共享工具 Cursor在这里处理 `private isOverWhitespace(): boolean {`，完成这一小步状态转换。
  private isOverWhitespace(): boolean {
    // currentChar读取 `this.text[this.offset] ?? ''` 对应条目，后续围绕该成员继续处理。
    const currentChar = this.text[this.offset] ?? ''
    // 返回 `/\s/.test(currentChar)`，作为共享工具这次计算的结果。
    return /\s/.test(currentChar)
  }

  // equals 使用 other: Cursor 完成共享工具里的对应操作。
  equals(other: Cursor): boolean {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      this.offset === other.offset && this.measuredText === other.measuredText
    )
  }

  // isAtStart 用 无 判断共享工具是否满足条件。
  isAtStart(): boolean {
    // 返回 `this.offset === 0`，作为共享工具这次计算的结果。
    return this.offset === 0
  }
  // isAtEnd 用 无 判断共享工具是否满足条件。
  isAtEnd(): boolean {
    // 返回 `this.offset >= this.text.length`，作为共享工具这次计算的结果。
    return this.offset >= this.text.length
  }

  // startOfFirstLine 使用 无 完成共享工具里的对应操作。
  startOfFirstLine(): Cursor {
    // Go to the very beginning of the text (first character of first line)
    // 返回 `new Cursor(this.measuredText, 0, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, 0, 0)
  }

  // startOfLastLine 使用 无 完成共享工具里的对应操作。
  startOfLastLine(): Cursor {
    // Go to the beginning of the last line
    // lastNewlineIndex 索引保存`text.lastIndexOf`，供共享工具后续处理使用。
    const lastNewlineIndex = this.text.lastIndexOf('\n')

    // 满足 `lastNewlineIndex === -1` 时，共享工具执行该分支。
    if (lastNewlineIndex === -1) {
      // If there are no newlines, the text is a single line
      // 返回 `this.startOfLine()`，作为共享工具这次计算的结果。
      return this.startOfLine()
    }

    // Position after the last newline character
    // 返回 `new Cursor(this.measuredText, lastNewlineIndex + 1, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, lastNewlineIndex + 1, 0)
  }

  // goToLine 使用 lineNumber: number 完成共享工具里的对应操作。
  goToLine(lineNumber: number): Cursor {
    // Go to the beginning of the specified logical line (1-indexed, like vim)
    // Uses logical lines (separated by \n), not wrapped display lines
    // 文本行格式化`text.split`，供共享工具后续处理使用。
    const lines = this.text.split('\n')
    // targetLine保存`Math.min`，供共享工具后续处理使用。
    const targetLine = Math.min(Math.max(0, lineNumber - 1), lines.length - 1)
    // offset保存`0`，供后续判断或组装使用。
    let offset = 0
    // 按索引扫描 `targetLine`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < targetLine; i++) {
      // 共享工具 Cursor在这里处理 `offset += (lines[i]?.length ?? 0) + 1 // +1 for newline`，完成这一小步状态转换。
      offset += (lines[i]?.length ?? 0) + 1 // +1 for newline
    }
    // 返回 `new Cursor(this.measuredText, offset, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, offset, 0)
  }

  // endOfFile 使用 无 完成共享工具里的对应操作。
  endOfFile(): Cursor {
    // 返回 `new Cursor(this.measuredText, this.text.length, 0)`，作为共享工具这次计算的结果。
    return new Cursor(this.measuredText, this.text.length, 0)
  }

  // 共享工具 Cursor在这里处理 `public get text(): string {`，完成这一小步状态转换。
  public get text(): string {
    // 返回 `this.measuredText.text`，作为共享工具这次计算的结果。
    return this.measuredText.text
  }

  // 共享工具 Cursor在这里处理 `private get columns(): number {`，完成这一小步状态转换。
  private get columns(): number {
    // 返回 `this.measuredText.columns + 1`，作为共享工具这次计算的结果。
    return this.measuredText.columns + 1
  }

  // getPosition不依赖额外参数，直接计算共享工具需要的结果。
  getPosition(): Position {
    // 返回 `this.measuredText.getPositionFromOffset(this.offset)`，作为共享工具这次计算的结果。
    return this.measuredText.getPositionFromOffset(this.offset)
  }

  // 共享工具 Cursor在这里处理 `private getOffset(position: Position): number {`，完成这一小步状态转换。
  private getOffset(position: Position): number {
    // 返回 `this.measuredText.getOffsetFromPosition(position)`，作为共享工具这次计算的结果。
    return this.measuredText.getOffsetFromPosition(position)
  }

  /**
   * Find a character using vim f/F/t/T semantics.
   *
   * @param char - The character to find
   * @param type - 'f' (forward to), 'F' (backward to), 't' (forward till), 'T' (backward till)
   * @param count - Find the Nth occurrence
   * @returns The target offset, or null if not found
   */
  // 调用 findCharacter，触发共享工具此处需要的副作用。
  findCharacter(
    char: string,
    type: 'f' | 'F' | 't' | 'T',
    count: number = 1,
  ): number | null {
    // 文本内容保存`this.text`，供共享工具 Cursor后续判断或输出使用。
    const text = this.text
    // forward标记共享工具 Cursor是否启用对应路径。
    const forward = type === 'f' || type === 't'
    // till标记共享工具 Cursor是否启用对应路径。
    const till = type === 't' || type === 'T'
    // found 命名 `0`，让后续代码直接表达这个值的用途。
    let found = 0

    // 满足 `forward` 时，共享工具执行该分支。
    if (forward) {
      // pos 集合保存`measuredText.nextOffset`，供共享工具后续处理使用。
      let pos = this.measuredText.nextOffset(this.offset)
      // while 使用 pos < text.length 完成共享工具里的对应操作。
      while (pos < text.length) {
        // grapheme保存`this.graphemeAt`，供共享工具后续处理使用。
        const grapheme = this.graphemeAt(pos)
        // 满足 `grapheme === char` 时，共享工具执行该分支。
        if (grapheme === char) {
          // 共享工具 Cursor在这里处理 `found++`，完成这一小步状态转换。
          found++
          // 满足 `found === count` 时，共享工具执行该分支。
          if (found === count) {
            // 返回 `till`，作为共享工具这次计算的结果。
            return till
              ? Math.max(this.offset, this.measuredText.prevOffset(pos))
              : pos
          }
        }
        // pos 集合更新为 `this.measuredText.nextOffset(pos)`，确保共享工具后续读取最新状态。
        pos = this.measuredText.nextOffset(pos)
      }
    } else {
      // 满足 `this.offset === 0` 时，共享工具执行该分支。
      if (this.offset === 0) return null
      // pos 集合保存`measuredText.prevOffset`，供共享工具后续处理使用。
      let pos = this.measuredText.prevOffset(this.offset)
      // while 使用 pos >= 0 完成共享工具里的对应操作。
      while (pos >= 0) {
        // grapheme保存`this.graphemeAt`，供共享工具后续处理使用。
        const grapheme = this.graphemeAt(pos)
        // 满足 `grapheme === char` 时，共享工具执行该分支。
        if (grapheme === char) {
          // 共享工具 Cursor在这里处理 `found++`，完成这一小步状态转换。
          found++
          // 满足 `found === count` 时，共享工具执行该分支。
          if (found === count) {
            // 返回 `till`，作为共享工具这次计算的结果。
            return till
              ? Math.min(this.offset, this.measuredText.nextOffset(pos))
              : pos
          }
        }
        // 满足 `pos === 0` 时，共享工具执行该分支。
        if (pos === 0) break
        // pos 集合更新为 `this.measuredText.prevOffset(pos)`，确保共享工具后续读取最新状态。
        pos = this.measuredText.prevOffset(pos)
      }
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// WrappedLine 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class WrappedLine {
  constructor(
    public readonly text: string,
    public readonly startOffset: number,
    public readonly isPrecededByNewline: boolean,
    public readonly endsWithNewline: boolean = false,
  ) {}

  // equals 使用 other: WrappedLine 完成共享工具里的对应操作。
  equals(other: WrappedLine): boolean {
    // 返回 `this.text === other.text && this.startOffset === other.startOffset`，作为共享工具这次计算的结果。
    return this.text === other.text && this.startOffset === other.startOffset
  }

  // 共享工具 Cursor在这里处理 `get length(): number {`，完成这一小步状态转换。
  get length(): number {
    // 返回 `this.text.length + (this.endsWithNewline ? 1 : 0)`，作为共享工具这次计算的结果。
    return this.text.length + (this.endsWithNewline ? 1 : 0)
  }
}

// MeasuredText 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class MeasuredText {
  private _wrappedLines?: WrappedLine[]
  public readonly text: string
  private navigationCache: Map<string, number>
  private graphemeBoundaries?: number[]

  // 构造函数初始化实例状态，确保共享工具后续方法读取到完整配置。
  constructor(
    text: string,
    readonly columns: number,
  ) {
    // 更新实例字段 text 为 text.normalize('NFC')，同步共享工具的内部状态。
    this.text = text.normalize('NFC')
    // 更新实例字段 navigationCache 为 new Map()，同步共享工具的内部状态。
    this.navigationCache = new Map()
  }

  /**
   * Lazily computes and caches wrapped lines.
   * This expensive operation is deferred until actually needed.
   */
  // 共享工具 Cursor在这里处理 `private get wrappedLines(): WrappedLine[] {`，完成这一小步状态转换。
  private get wrappedLines(): WrappedLine[] {
    // this._wrappedLines 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this._wrappedLines) {
      // 更新实例字段 _wrappedLines 为 this.measureWrappedText()，同步共享工具的内部状态。
      this._wrappedLines = this.measureWrappedText()
    }
    // 返回 `this._wrappedLines`，作为共享工具这次计算的结果。
    return this._wrappedLines
  }

  // 共享工具 Cursor在这里处理 `private getGraphemeBoundaries(): number[] {`，完成这一小步状态转换。
  private getGraphemeBoundaries(): number[] {
    // this.graphemeBoundaries 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.graphemeBoundaries) {
      // 更新实例字段 graphemeBoundaries 为 []，同步共享工具的内部状态。
      this.graphemeBoundaries = []
      // 循环处理 `const { index } of getGraphemeSegmenter().segment(this.text)`，让共享工具把同类条目按顺序走完。
      for (const { index } of getGraphemeSegmenter().segment(this.text)) {
        // graphemeBoundaries 集合追加新条目，保持收集顺序与输入顺序一致。
        this.graphemeBoundaries.push(index)
      }
      // Add the end of text as a boundary
      // graphemeBoundaries 集合追加新条目，保持收集顺序与输入顺序一致。
      this.graphemeBoundaries.push(this.text.length)
    }
    // 返回 `this.graphemeBoundaries`，作为共享工具这次计算的结果。
    return this.graphemeBoundaries
  }

  private wordBoundariesCache?: Array<{
    start: number
    end: number
    isWordLike: boolean
  }>

  /**
   * Get word boundaries using Intl.Segmenter for proper Unicode word segmentation.
   * This correctly handles CJK (Chinese, Japanese, Korean) text where each character
   * is typically its own word, as well as scripts that use spaces between words.
   */
  // 共享工具 Cursor在这里处理 `public getWordBoundaries(): Array<{`，完成这一小步状态转换。
  public getWordBoundaries(): Array<{
    start: number
    end: number
    isWordLike: boolean
  }> {
    // this.wordBoundariesCache 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.wordBoundariesCache) {
      // 更新实例字段 wordBoundariesCache 为 []，同步共享工具的内部状态。
      this.wordBoundariesCache = []
      // 逐项读取 `getWordSegmenter().segment(this.text)` 中的segment，按输入顺序推进共享工具。
      for (const segment of getWordSegmenter().segment(this.text)) {
        // wordBoundariesCache 缓存追加新条目，保持收集顺序与输入顺序一致。
        this.wordBoundariesCache.push({
          start: segment.index,
          end: segment.index + segment.segment.length,
          isWordLike: segment.isWordLike ?? false,
        })
      }
    }
    // 返回 `this.wordBoundariesCache`，作为共享工具这次计算的结果。
    return this.wordBoundariesCache
  }

  /**
   * Binary search for boundaries.
   * @param boundaries: Sorted array of boundaries
   * @param target: Target offset
   * @param findNext: If true, finds first boundary > target. If false, finds last boundary < target.
   * @returns The found boundary index, or appropriate default
   */
  // 共享工具 Cursor在这里处理 `private binarySearchBoundary(`，完成这一小步状态转换。
  private binarySearchBoundary(
    boundaries: number[],
    target: number,
    findNext: boolean,
  ): number {
    // left保存`0`，供后续判断或组装使用。
    let left = 0
    // right 命名 `boundaries.length - 1`，让后续代码直接表达这个值的用途。
    let right = boundaries.length - 1
    // 结果 命名 `findNext ? this.text.length : 0`，让后续代码直接表达这个值的用途。
    let result = findNext ? this.text.length : 0

    // while 使用 left <= right 完成共享工具里的对应操作。
    while (left <= right) {
      // mid保存`Math.floor`，供共享工具后续处理使用。
      const mid = Math.floor((left + right) / 2)
      // boundary 命名 `boundaries[mid]`，让后续代码直接表达这个值的用途。
      const boundary = boundaries[mid]
      // 满足 `boundary === undefined` 时，共享工具执行该分支。
      if (boundary === undefined) break

      // 满足 `findNext` 时，共享工具执行该分支。
      if (findNext) {
        // 满足 `boundary > target` 时，共享工具执行该分支。
        if (boundary > target) {
          // 结果更新为 `boundary`，确保共享工具后续读取最新状态。
          result = boundary
          // right更新为 `mid - 1`，确保共享工具后续读取最新状态。
          right = mid - 1
        } else {
          // left更新为 `mid + 1`，确保共享工具后续读取最新状态。
          left = mid + 1
        }
      } else {
        // 满足 `boundary < target` 时，共享工具执行该分支。
        if (boundary < target) {
          // 结果更新为 `boundary`，确保共享工具后续读取最新状态。
          result = boundary
          // left更新为 `mid + 1`，确保共享工具后续读取最新状态。
          left = mid + 1
        } else {
          // right更新为 `mid - 1`，确保共享工具后续读取最新状态。
          right = mid - 1
        }
      }
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // Convert string index to display width
  // 共享工具 Cursor在这里处理 `public stringIndexToDisplayWidth(text: string, index: number): number {`，完成这一小步状态转换。
  public stringIndexToDisplayWidth(text: string, index: number): number {
    // 满足 `index <= 0` 时，共享工具执行该分支。
    if (index <= 0) return 0
    // 满足 `index >= text.length) return stringWidth(text` 时，共享工具执行该分支。
    if (index >= text.length) return stringWidth(text)
    // 返回 `stringWidth(text.substring(0, index))`，作为共享工具这次计算的结果。
    return stringWidth(text.substring(0, index))
  }

  // Convert display width to string index
  // 共享工具 Cursor在这里处理 `public displayWidthToStringIndex(text: string, targetWidth: number): nu...`，完成这一小步状态转换。
  public displayWidthToStringIndex(text: string, targetWidth: number): number {
    // 满足 `targetWidth <= 0` 时，共享工具执行该分支。
    if (targetWidth <= 0) return 0
    // 文本缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!text) return 0

    // If the text matches our text, use the precomputed graphemes
    // 满足 `text === this.text` 时，共享工具执行该分支。
    if (text === this.text) {
      // 返回 `this.offsetAtDisplayWidth(targetWidth)`，作为共享工具这次计算的结果。
      return this.offsetAtDisplayWidth(targetWidth)
    }

    // Otherwise compute on the fly
    // currentWidth 命名 `0`，让后续代码直接表达这个值的用途。
    let currentWidth = 0
    // currentOffset保存`0`，供共享工具 Cursor后续判断或输出使用。
    let currentOffset = 0

    // 循环处理 `const { segment, index } of getGraphemeSegmenter().segment(text)`，让共享工具把同类条目按顺序走完。
    for (const { segment, index } of getGraphemeSegmenter().segment(text)) {
      // segmentWidth保存`stringWidth`，供共享工具后续处理使用。
      const segmentWidth = stringWidth(segment)

      // 满足 `currentWidth + segmentWidth > targetWidth` 时，共享工具执行该分支。
      if (currentWidth + segmentWidth > targetWidth) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // 共享工具 Cursor在这里处理 `currentWidth += segmentWidth`，完成这一小步状态转换。
      currentWidth += segmentWidth
      // currentOffset更新为 `index + segment.length`，确保共享工具后续读取最新状态。
      currentOffset = index + segment.length
    }

    // 返回 `currentOffset`，作为共享工具这次计算的结果。
    return currentOffset
  }

  /**
   * Find the string offset that corresponds to a target display width.
   */
  // 共享工具 Cursor在这里处理 `private offsetAtDisplayWidth(targetWidth: number): number {`，完成这一小步状态转换。
  private offsetAtDisplayWidth(targetWidth: number): number {
    // 满足 `targetWidth <= 0` 时，共享工具执行该分支。
    if (targetWidth <= 0) return 0

    // currentWidth 命名 `0`，让后续代码直接表达这个值的用途。
    let currentWidth = 0
    // boundaries 集合读取`this.getGraphemeBoundaries`，供共享工具后续处理使用。
    const boundaries = this.getGraphemeBoundaries()

    // Iterate through grapheme boundaries
    // 按索引扫描 `boundaries.length - 1`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < boundaries.length - 1; i++) {
      // start读取 `boundaries[i]` 对应条目，后续围绕该成员继续处理。
      const start = boundaries[i]
      // end 命名 `boundaries[i + 1]`，让后续代码直接表达这个值的用途。
      const end = boundaries[i + 1]
      // 只有 `start === undefined || end === undefined` 满足时，共享工具才执行该分支。
      if (start === undefined || end === undefined) continue
      // segment格式化`text.substring`，供共享工具后续处理使用。
      const segment = this.text.substring(start, end)
      // segmentWidth保存`stringWidth`，供共享工具后续处理使用。
      const segmentWidth = stringWidth(segment)

      // 满足 `currentWidth + segmentWidth > targetWidth` 时，共享工具执行该分支。
      if (currentWidth + segmentWidth > targetWidth) {
        // 返回 `start`，作为共享工具这次计算的结果。
        return start
      }
      // 共享工具 Cursor在这里处理 `currentWidth += segmentWidth`，完成这一小步状态转换。
      currentWidth += segmentWidth
    }

    // 返回 `this.text.length`，作为共享工具这次计算的结果。
    return this.text.length
  }

  // 共享工具 Cursor在这里处理 `private measureWrappedText(): WrappedLine[] {`，完成这一小步状态转换。
  private measureWrappedText(): WrappedLine[] {
    // wrappedText保存`wrapAnsi`，供共享工具后续处理使用。
    const wrappedText = wrapAnsi(this.text, this.columns, {
      hard: true,
      trim: false,
    })

    // wrappedLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const wrappedLines: WrappedLine[] = []
    // searchOffset 命名 `0`，让后续代码直接表达这个值的用途。
    let searchOffset = 0
    // lastNewLinePos 集合保存`-1`，供共享工具 Cursor后续判断或输出使用。
    let lastNewLinePos = -1

    // 文本行格式化`wrappedText.split`，供共享工具后续处理使用。
    const lines = wrappedText.split('\n')
    // 按索引扫描 `lines.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < lines.length; i++) {
      // 文本内容保存`lines[i]!`，供共享工具 Cursor后续判断或输出使用。
      const text = lines[i]!
      // isPrecededByNewline封装成回调，供共享工具 Cursor在事件触发或异步步骤中调用。
      const isPrecededByNewline = (startOffset: number) =>
        i === 0 || (startOffset > 0 && this.text[startOffset - 1] === '\n')

      // 文本为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (text.length === 0) {
        // For blank lines, find the next newline character after the last one
        // lastNewLinePos 集合更新为 `this.text.indexOf('\n', lastNewLinePos + 1)`，确保共享工具后续读取最新状态。
        lastNewLinePos = this.text.indexOf('\n', lastNewLinePos + 1)

        // `lastNewLinePos` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
        if (lastNewLinePos !== -1) {
          // startOffset保存`lastNewLinePos`，供共享工具 Cursor后续判断或输出使用。
          const startOffset = lastNewLinePos
          // endsWithNewline标记共享工具 Cursor是否启用对应路径。
          const endsWithNewline = true

          // wrappedLines 集合追加新条目，保持收集顺序与输入顺序一致。
          wrappedLines.push(
            new WrappedLine(
              text,
              startOffset,
              isPrecededByNewline(startOffset),
              endsWithNewline,
            ),
          )
        } else {
          // If we can't find another newline, this must be the end of text
          // startOffset 命名 `this.text.length`，让后续代码直接表达这个值的用途。
          const startOffset = this.text.length
          // wrappedLines 集合追加新条目，保持收集顺序与输入顺序一致。
          wrappedLines.push(
            new WrappedLine(
              text,
              startOffset,
              isPrecededByNewline(startOffset),
              false,
            ),
          )
        }
      } else {
        // For non-blank lines, find the text in this.text
        // startOffset保存`text.indexOf`，供共享工具后续处理使用。
        const startOffset = this.text.indexOf(text, searchOffset)

        // 满足 `startOffset === -1` 时，共享工具执行该分支。
        if (startOffset === -1) {
          // 抛出 new Error('Failed to find wrapped line in text')，阻止共享工具在无效状态下继续运行。
          throw new Error('Failed to find wrapped line in text')
        }

        // searchOffset更新为 `startOffset + text.length`，确保共享工具后续读取最新状态。
        searchOffset = startOffset + text.length

        // Check if this line ends with a newline in this.text
        // potentialNewlinePos 集合记录 `startOffset + text.length` 是否成立，下一步按该结果分支。
        const potentialNewlinePos = startOffset + text.length
        // endsWithNewline 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const endsWithNewline =
          potentialNewlinePos < this.text.length &&
          this.text[potentialNewlinePos] === '\n'

        // 满足 `endsWithNewline` 时，共享工具执行该分支。
        if (endsWithNewline) {
          // lastNewLinePos 集合更新为 `potentialNewlinePos`，确保共享工具后续读取最新状态。
          lastNewLinePos = potentialNewlinePos
        }

        // wrappedLines 集合追加新条目，保持收集顺序与输入顺序一致。
        wrappedLines.push(
          new WrappedLine(
            text,
            startOffset,
            isPrecededByNewline(startOffset),
            endsWithNewline,
          ),
        )
      }
    }

    // 返回 `wrappedLines`，作为共享工具这次计算的结果。
    return wrappedLines
  }

  // 共享工具 Cursor在这里处理 `public getWrappedText(): WrappedText {`，完成这一小步状态转换。
  public getWrappedText(): WrappedText {
    // 返回 `this.wrappedLines.map(line =>`，作为共享工具这次计算的结果。
    return this.wrappedLines.map(line =>
      line.isPrecededByNewline ? line.text : line.text.trimStart(),
    )
  }

  // 共享工具 Cursor在这里处理 `public getWrappedLines(): WrappedLine[] {`，完成这一小步状态转换。
  public getWrappedLines(): WrappedLine[] {
    // 返回 `this.wrappedLines`，作为共享工具这次计算的结果。
    return this.wrappedLines
  }

  // 共享工具 Cursor在这里处理 `private getLine(line: number): WrappedLine {`，完成这一小步状态转换。
  private getLine(line: number): WrappedLine {
    // 文本行保存`this.wrappedLines`，供共享工具 Cursor后续判断或输出使用。
    const lines = this.wrappedLines
    // 返回 `lines[Math.max(0, Math.min(line, lines.length - 1))]!`，作为共享工具这次计算的结果。
    return lines[Math.max(0, Math.min(line, lines.length - 1))]!
  }

  // 共享工具 Cursor在这里处理 `public getOffsetFromPosition(position: Position): number {`，完成这一小步状态转换。
  public getOffsetFromPosition(position: Position): number {
    // wrappedLine读取`this.getLine`，供共享工具后续处理使用。
    const wrappedLine = this.getLine(position.line)

    // Handle blank lines specially
    // 只有 `wrappedLine.text.length === 0 && wrappedLine.ends` 满足时，共享工具才执行该分支。
    if (wrappedLine.text.length === 0 && wrappedLine.endsWithNewline) {
      // 返回 `wrappedLine.startOffset`，作为共享工具这次计算的结果。
      return wrappedLine.startOffset
    }

    // Account for leading whitespace
    // leadingWhitespace 命名 `wrappedLine.isPrecededByNewline`，让后续代码直接表达这个值的用途。
    const leadingWhitespace = wrappedLine.isPrecededByNewline
      ? 0
      : wrappedLine.text.length - wrappedLine.text.trimStart().length

    // Convert display column to string index
    // displayColumnWithLeading 命名 `position.column + leadingWhitespace`，让后续代码直接表达这个值的用途。
    const displayColumnWithLeading = position.column + leadingWhitespace
    // stringIndex 索引保存`this.displayWidthToStringIndex`，供共享工具后续处理使用。
    const stringIndex = this.displayWidthToStringIndex(
      wrappedLine.text,
      displayColumnWithLeading,
    )

    // Calculate the actual offset
    // offset 命名 `wrappedLine.startOffset + stringIndex`，让后续代码直接表达这个值的用途。
    const offset = wrappedLine.startOffset + stringIndex

    // For normal lines
    // lineEnd记录 `wrappedLine.startOffset + wrappedLine.text.length` 是否成立，下一步按该结果分支。
    const lineEnd = wrappedLine.startOffset + wrappedLine.text.length

    // Don't allow going past the end of the current line into the next line
    // unless we're at the very end of the text
    // maxOffset保存`lineEnd`，供后续判断或组装使用。
    let maxOffset = lineEnd
    // lineDisplayWidth保存`stringWidth`，供共享工具后续处理使用。
    const lineDisplayWidth = stringWidth(wrappedLine.text)
    // 只有 `wrappedLine.endsWithNewline && position.column >` 满足时，共享工具才执行该分支。
    if (wrappedLine.endsWithNewline && position.column > lineDisplayWidth) {
      // Allow positioning after the newline
      // maxOffset更新为 `lineEnd + 1`，确保共享工具后续读取最新状态。
      maxOffset = lineEnd + 1
    }

    // 返回 `Math.min(offset, maxOffset)`，作为共享工具这次计算的结果。
    return Math.min(offset, maxOffset)
  }

  // 共享工具 Cursor在这里处理 `public getLineLength(line: number): number {`，完成这一小步状态转换。
  public getLineLength(line: number): number {
    // wrappedLine读取`this.getLine`，供共享工具后续处理使用。
    const wrappedLine = this.getLine(line)
    // 返回 `stringWidth(wrappedLine.text)`，作为共享工具这次计算的结果。
    return stringWidth(wrappedLine.text)
  }

  // 共享工具 Cursor在这里处理 `public getPositionFromOffset(offset: number): Position {`，完成这一小步状态转换。
  public getPositionFromOffset(offset: number): Position {
    // 文本行保存`this.wrappedLines`，供共享工具 Cursor后续判断或输出使用。
    const lines = this.wrappedLines
    // 按索引扫描 `lines.length`，需要消费相邻参数时可以精确移动游标。
    for (let line = 0; line < lines.length; line++) {
      // currentLine保存`lines[line]!`，供共享工具 Cursor后续判断或输出使用。
      const currentLine = lines[line]!
      // nextLine 命名 `lines[line + 1]`，让后续代码直接表达这个值的用途。
      const nextLine = lines[line + 1]
      // 共享工具在这里按实际状态进入对应分支。
      if (
        offset >= currentLine.startOffset &&
        (!nextLine || offset < nextLine.startOffset)
      ) {
        // Calculate string position within the line
        // stringPosInLine 命名 `offset - currentLine.startOffset`，让后续代码直接表达这个值的用途。
        const stringPosInLine = offset - currentLine.startOffset

        // Handle leading whitespace for wrapped lines
        // displayColumn 先占位，稍后的条件分支会根据实际输入补齐它。
        let displayColumn: number
        // 满足 `currentLine.isPrecededByNewline` 时，共享工具执行该分支。
        if (currentLine.isPrecededByNewline) {
          // For lines preceded by newline, calculate display width directly
          // displayColumn更新为 `this.stringIndexToDisplayWidth(`，确保共享工具后续读取最新状态。
          displayColumn = this.stringIndexToDisplayWidth(
            currentLine.text,
            stringPosInLine,
          )
        } else {
          // For wrapped lines, we need to account for trimmed whitespace
          // leadingWhitespace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const leadingWhitespace =
            currentLine.text.length - currentLine.text.trimStart().length
          // 满足 `stringPosInLine < leadingWhitespace` 时，共享工具执行该分支。
          if (stringPosInLine < leadingWhitespace) {
            // Cursor is in the trimmed whitespace area, position at start
            // displayColumn更新为 `0`，确保共享工具后续读取最新状态。
            displayColumn = 0
          } else {
            // Calculate display width from the trimmed text
            // trimmedText格式化`text.trimStart`，供共享工具后续处理使用。
            const trimmedText = currentLine.text.trimStart()
            // posInTrimmed保存`stringPosInLine - leadingWhitespace`，供后续判断或组装使用。
            const posInTrimmed = stringPosInLine - leadingWhitespace
            // displayColumn更新为 `this.stringIndexToDisplayWidth(`，确保共享工具后续读取最新状态。
            displayColumn = this.stringIndexToDisplayWidth(
              trimmedText,
              posInTrimmed,
            )
          }
        }

        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          line,
          column: Math.max(0, displayColumn),
        }
      }
    }

    // If we're past the last character, return the end of the last line
    // line 命名 `lines.length - 1`，让后续代码直接表达这个值的用途。
    const line = lines.length - 1
    // lastLine保存`this.wrappedLines[line]!`，供共享工具 Cursor后续判断或输出使用。
    const lastLine = this.wrappedLines[line]!
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      line,
      column: stringWidth(lastLine.text),
    }
  }

  // 共享工具 Cursor在这里处理 `public get lineCount(): number {`，完成这一小步状态转换。
  public get lineCount(): number {
    // 返回 `this.wrappedLines.length`，作为共享工具这次计算的结果。
    return this.wrappedLines.length
  }

  // 这个回调绑定到 private withCache<T>(key: string, compute: () => T): T {，负责共享工具在该局部场景下的响应。
  private withCache<T>(key: string, compute: () => T): T {
    // cached 缓存读取`navigationCache.get`，供共享工具后续处理使用。
    const cached = this.navigationCache.get(key)
    // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (cached !== undefined) return cached as T

    // 结果保存`compute`，供共享工具后续处理使用。
    const result = compute()
    // this.navigationCache.set 写入新的状态值，使共享工具后续读取保持一致。
    this.navigationCache.set(key, result as number)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // nextOffset 使用 offset: number 完成共享工具里的对应操作。
  nextOffset(offset: number): number {
    // 返回 `this.withCache(`next:${offset}`, () => {`，作为共享工具这次计算的结果。
    return this.withCache(`next:${offset}`, () => {
      // boundaries 集合读取`this.getGraphemeBoundaries`，供共享工具后续处理使用。
      const boundaries = this.getGraphemeBoundaries()
      // 返回 `this.binarySearchBoundary(boundaries, offset, true)`，作为共享工具这次计算的结果。
      return this.binarySearchBoundary(boundaries, offset, true)
    })
  }

  // prevOffset 使用 offset: number 完成共享工具里的对应操作。
  prevOffset(offset: number): number {
    // 满足 `offset <= 0` 时，共享工具执行该分支。
    if (offset <= 0) return 0

    // 返回 `this.withCache(`prev:${offset}`, () => {`，作为共享工具这次计算的结果。
    return this.withCache(`prev:${offset}`, () => {
      // boundaries 集合读取`this.getGraphemeBoundaries`，供共享工具后续处理使用。
      const boundaries = this.getGraphemeBoundaries()
      // 返回 `this.binarySearchBoundary(boundaries, offset, false)`，作为共享工具这次计算的结果。
      return this.binarySearchBoundary(boundaries, offset, false)
    })
  }

  /**
   * Snap an arbitrary code-unit offset to the start of the containing grapheme.
   * If offset is already on a boundary, returns it unchanged.
   */
  // snapToGraphemeBoundary 使用 offset: number 完成共享工具里的对应操作。
  snapToGraphemeBoundary(offset: number): number {
    // 满足 `offset <= 0` 时，共享工具执行该分支。
    if (offset <= 0) return 0
    // 满足 `offset >= this.text.length` 时，共享工具执行该分支。
    if (offset >= this.text.length) return this.text.length
    // boundaries 集合读取`this.getGraphemeBoundaries`，供共享工具后续处理使用。
    const boundaries = this.getGraphemeBoundaries()
    // Binary search for largest boundary <= offset
    // lo 命名 `0`，让后续代码直接表达这个值的用途。
    let lo = 0
    // hi记录 `boundaries.length - 1` 是否成立，下一步按该结果分支。
    let hi = boundaries.length - 1
    // while 使用 lo < hi 完成共享工具里的对应操作。
    while (lo < hi) {
      // mid保存`(lo + hi + 1) >> 1`，供后续判断或组装使用。
      const mid = (lo + hi + 1) >> 1
      // 满足 `boundaries[mid]! <= offset` 时，共享工具执行该分支。
      if (boundaries[mid]! <= offset) lo = mid
      else hi = mid - 1
    }
    // 返回 `boundaries[lo]!`，作为共享工具这次计算的结果。
    return boundaries[lo]!
  }
}
