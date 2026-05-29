// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 复用 ctrlOToExpand 终端界面组件，避免在这里重复拼装显示逻辑。
import { ctrlOToExpand } from '../components/CtrlOToExpand.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 引入 sliceAnsi，将 ./sliceAnsi.js 中已经封装好的能力接到本文件流程里。
import sliceAnsi from './sliceAnsi.js'

// Text rendering utilities for terminal display
// MAX_LINES_TO_SHOW保存`3`，供后续判断或组装使用。
const MAX_LINES_TO_SHOW = 3
// Account for MessageResponse prefix ("  ⎿ " = 5 chars) + parent width
// reduction (columns - 5 in tool result rendering)
// PADDING_TO_PREVENT_OVERFLOW保存`10`，供共享工具 terminal后续判断或输出使用。
const PADDING_TO_PREVENT_OVERFLOW = 10

/**
 * Inserts newlines in a string to wrap it at the specified width.
 * Uses ANSI-aware slicing to avoid splitting escape sequences.
 * @param text The text to wrap.
 * @param wrapWidth The width at which to wrap lines (in visible characters).
 * @returns The wrapped text.
 */
// wrapText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wrapText(
  text: string,
  wrapWidth: number,
): { aboveTheFold: string; remainingLines: number } {
  // 文本行格式化`text.split`，供共享工具后续处理使用。
  const lines = text.split('\n')
  // wrappedLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const wrappedLines: string[] = []

  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // visibleWidth保存`stringWidth`，供共享工具后续处理使用。
    const visibleWidth = stringWidth(line)
    // 满足 `visibleWidth <= wrapWidth` 时，共享工具执行该分支。
    if (visibleWidth <= wrapWidth) {
      // wrappedLines 集合追加新条目，保持收集顺序与输入顺序一致。
      wrappedLines.push(line.trimEnd())
    } else {
      // Break long lines into chunks of wrapWidth visible characters
      // using ANSI-aware slicing to preserve escape sequences
      // position保存`0`，供后续判断或组装使用。
      let position = 0
      // while 使用 position < visibleWidth 完成共享工具里的对应操作。
      while (position < visibleWidth) {
        // chunk格式化`sliceAnsi`，供共享工具后续处理使用。
        const chunk = sliceAnsi(line, position, position + wrapWidth)
        // wrappedLines 集合追加新条目，保持收集顺序与输入顺序一致。
        wrappedLines.push(chunk.trimEnd())
        // 共享工具 terminal在这里处理 `position += wrapWidth`，完成这一小步状态转换。
        position += wrapWidth
      }
    }
  }

  // remainingLines 集合 命名 `wrappedLines.length - MAX_LINES_TO_SHOW`，让后续代码直接表达这个值的用途。
  const remainingLines = wrappedLines.length - MAX_LINES_TO_SHOW

  // If there's only 1 line after the fold, show it directly
  // instead of showing "... +1 line (ctrl+o to expand)"
  // 满足 `remainingLines === 1` 时，共享工具执行该分支。
  if (remainingLines === 1) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      aboveTheFold: wrappedLines
        .slice(0, MAX_LINES_TO_SHOW + 1)
        .join('\n')
        .trimEnd(),
      remainingLines: 0, // All lines are shown, nothing remaining
    }
  }

  // Otherwise show the standard MAX_LINES_TO_SHOW
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    aboveTheFold: wrappedLines.slice(0, MAX_LINES_TO_SHOW).join('\n').trimEnd(),
    remainingLines: Math.max(0, remainingLines),
  }
}

/**
 * Renders the content with line-based truncation for terminal display.
 * If the content exceeds the maximum number of lines, it truncates the content
 * and adds a message indicating the number of additional lines.
 * @param content The content to render.
 * @param terminalWidth Terminal width for wrapping lines.
 * @returns The rendered content with truncation if needed.
 */
// renderTruncatedContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderTruncatedContent(
  content: string,
  terminalWidth: number,
  suppressExpandHint = false,
): string {
  // trimmedContent格式化`content.trimEnd`，供共享工具后续处理使用。
  const trimmedContent = content.trimEnd()
  // trimmedContent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmedContent) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // wrapWidth保存`Math.max`，供共享工具后续处理使用。
  const wrapWidth = Math.max(terminalWidth - PADDING_TO_PREVENT_OVERFLOW, 10)

  // Only process enough content for the visible lines. Avoids O(n) wrapping
  // on huge outputs (e.g. 64MB binary dumps that cause 382K-row screens).
  // maxChars 集合保存`MAX_LINES_TO_SHOW * wrapWidth * 4`，供后续判断或组装使用。
  const maxChars = MAX_LINES_TO_SHOW * wrapWidth * 4
  // preTruncated保存 `trimmedContent.length > maxChars` 的判断结果，供共享工具 terminal后续分支直接复用。
  const preTruncated = trimmedContent.length > maxChars
  // contentForWrapping保存`preTruncated`，供共享工具 terminal后续判断或输出使用。
  const contentForWrapping = preTruncated
    ? trimmedContent.slice(0, maxChars)
    : trimmedContent

  // 从 `wrapText(` 解构 aboveTheFold、remainingLines，减少共享工具 terminal对同一对象的重复访问。
  const { aboveTheFold, remainingLines } = wrapText(
    contentForWrapping,
    wrapWidth,
  )

  // estimatedRemaining保存`preTruncated`，供共享工具 terminal后续判断或输出使用。
  const estimatedRemaining = preTruncated
    ? Math.max(
        remainingLines,
        Math.ceil(trimmedContent.length / wrapWidth) - MAX_LINES_TO_SHOW,
      )
    : remainingLines

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    aboveTheFold,
    estimatedRemaining > 0
      ? chalk.dim(
          `… +${estimatedRemaining} lines${suppressExpandHint ? '' : ` ${ctrlOToExpand()}`}`,
        )
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Fast check: would OutputLine truncate this content? Counts raw newlines
 *  only (ignores terminal-width wrapping), so it may return false for a single
 *  very long line that wraps past 3 visual rows — acceptable, since the common
 *  case is multi-line output. */
// isOutputLineTruncated 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOutputLineTruncated(content: string): boolean {
  // pos 集合保存`0`，供后续判断或组装使用。
  let pos = 0
  // Need more than MAX_LINES_TO_SHOW newlines (content fills > 3 lines).
  // The +1 accounts for wrapText showing an extra line when remainingLines==1.
  // 按索引扫描 `= MAX_LINES_TO_SHOW`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i <= MAX_LINES_TO_SHOW; i++) {
    // pos 集合更新为 `content.indexOf('\n', pos)`，确保共享工具后续读取最新状态。
    pos = content.indexOf('\n', pos)
    // 满足 `pos === -1` 时，共享工具执行该分支。
    if (pos === -1) return false
    // 共享工具 terminal在这里处理 `pos++`，完成这一小步状态转换。
    pos++
  }
  // A trailing newline is a terminator, not a new line — match
  // renderTruncatedContent's trimEnd() behavior.
  // 返回 `pos < content.length`，作为共享工具这次计算的结果。
  return pos < content.length
}
