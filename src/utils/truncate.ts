// Width-aware truncation/wrapping — needs ink/stringWidth (not leaf-safe).

// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 引入 getGraphemeSegmenter，将 ./intl.js 中已经封装好的能力接到本文件流程里。
import { getGraphemeSegmenter } from './intl.js'

/**
 * Truncates a file path in the middle to preserve both directory context and filename.
 * Width-aware: uses stringWidth() for correct CJK/emoji measurement.
 * For example: "src/components/deeply/nested/folder/MyComponent.tsx" becomes
 * "src/components/…/MyComponent.tsx" when maxLength is 30.
 *
 * @param path The file path to truncate
 * @param maxLength Maximum display width of the result in terminal columns (must be > 0)
 * @returns The truncated path, or original if it fits within maxLength
 */
// truncatePathMiddle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncatePathMiddle(path: string, maxLength: number): string {
  // No truncation needed
  // 满足 `stringWidth(path) <= maxLength` 时，共享工具执行该分支。
  if (stringWidth(path) <= maxLength) {
    // 返回 `path`，作为共享工具这次计算的结果。
    return path
  }

  // Handle edge case of very small or non-positive maxLength
  // 满足 `maxLength <= 0` 时，共享工具执行该分支。
  if (maxLength <= 0) {
    // 返回 `'…'`，作为共享工具这次计算的结果。
    return '…'
  }

  // Need at least room for "…" + something meaningful
  // 满足 `maxLength < 5` 时，共享工具执行该分支。
  if (maxLength < 5) {
    // 返回 `truncateToWidth(path, maxLength)`，作为共享工具这次计算的结果。
    return truncateToWidth(path, maxLength)
  }

  // Find the filename (last path segment)
  // lastSlash保存`path.lastIndexOf`，供共享工具后续处理使用。
  const lastSlash = path.lastIndexOf('/')
  // Include the leading slash in filename for display
  // 文件名格式化`path.slice`，供共享工具后续处理使用。
  const filename = lastSlash >= 0 ? path.slice(lastSlash) : path
  // directory格式化`path.slice`，供共享工具后续处理使用。
  const directory = lastSlash >= 0 ? path.slice(0, lastSlash) : ''
  // filenameWidth 文件数据保存`stringWidth`，供共享工具后续处理使用。
  const filenameWidth = stringWidth(filename)

  // If filename alone is too long, truncate from start
  // 满足 `filenameWidth >= maxLength - 1` 时，共享工具执行该分支。
  if (filenameWidth >= maxLength - 1) {
    // 返回 `truncateStartToWidth(path, maxLength)`，作为共享工具这次计算的结果。
    return truncateStartToWidth(path, maxLength)
  }

  // Calculate space available for directory prefix
  // Result format: directory + "…" + filename
  // availableForDir保存`maxLength - 1 - filenameWidth // -1 for ellipsis`，供后续判断或组装使用。
  const availableForDir = maxLength - 1 - filenameWidth // -1 for ellipsis

  // 满足 `availableForDir <= 0` 时，共享工具执行该分支。
  if (availableForDir <= 0) {
    // No room for directory, just show filename (truncated if needed)
    // 返回 `truncateStartToWidth(filename, maxLength)`，作为共享工具这次计算的结果。
    return truncateStartToWidth(filename, maxLength)
  }

  // Truncate directory and combine
  // truncatedDir保存`truncateToWidthNoEllipsis`，供共享工具后续处理使用。
  const truncatedDir = truncateToWidthNoEllipsis(directory, availableForDir)
  // 返回 `truncatedDir + '…' + filename`，作为共享工具这次计算的结果。
  return truncatedDir + '…' + filename
}

/**
 * Truncates a string to fit within a maximum display width, measured in terminal columns.
 * Splits on grapheme boundaries to avoid breaking emoji or surrogate pairs.
 * Appends '…' when truncation occurs.
 */
// truncateToWidth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateToWidth(text: string, maxWidth: number): string {
  // 满足 `stringWidth(text) <= maxWidth` 时，共享工具执行该分支。
  if (stringWidth(text) <= maxWidth) return text
  // 满足 `maxWidth <= 1` 时，共享工具执行该分支。
  if (maxWidth <= 1) return '…'
  // width 命名 `0`，让后续代码直接表达这个值的用途。
  let width = 0
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(text)`，让共享工具把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    // segWidth保存`stringWidth`，供共享工具后续处理使用。
    const segWidth = stringWidth(segment)
    // 满足 `width + segWidth > maxWidth - 1` 时，共享工具执行该分支。
    if (width + segWidth > maxWidth - 1) break
    // 共享工具 truncate在这里处理 `result += segment`，完成这一小步状态转换。
    result += segment
    // 共享工具 truncate在这里处理 `width += segWidth`，完成这一小步状态转换。
    width += segWidth
  }
  // 返回 `result + '…'`，作为共享工具这次计算的结果。
  return result + '…'
}

/**
 * Truncates from the start of a string, keeping the tail end.
 * Prepends '…' when truncation occurs.
 * Width-aware and grapheme-safe.
 */
// truncateStartToWidth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateStartToWidth(text: string, maxWidth: number): string {
  // 满足 `stringWidth(text) <= maxWidth` 时，共享工具执行该分支。
  if (stringWidth(text) <= maxWidth) return text
  // 满足 `maxWidth <= 1` 时，共享工具执行该分支。
  if (maxWidth <= 1) return '…'
  // segments 集合读取`getGraphemeSegmenter`，供共享工具后续处理使用。
  const segments = [...getGraphemeSegmenter().segment(text)]
  // width 命名 `0`，让后续代码直接表达这个值的用途。
  let width = 0
  // startIdx 命名 `segments.length`，让后续代码直接表达这个值的用途。
  let startIdx = segments.length
  // 循环处理 `let i = segments.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = segments.length - 1; i >= 0; i--) {
    // segWidth保存`stringWidth`，供共享工具后续处理使用。
    const segWidth = stringWidth(segments[i]!.segment)
    // 满足 `width + segWidth > maxWidth - 1` 时，共享工具执行该分支。
    if (width + segWidth > maxWidth - 1) break // -1 for '…'
    // 共享工具 truncate在这里处理 `width += segWidth`，完成这一小步状态转换。
    width += segWidth
    // startIdx更新为 `i`，确保共享工具后续读取最新状态。
    startIdx = i
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    '…' +
    segments
      .slice(startIdx)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(s => s.segment)
      .join('')
  )
}

/**
 * Truncates a string to fit within a maximum display width, without appending an ellipsis.
 * Useful when the caller adds its own separator (e.g. middle-truncation with '…' between parts).
 * Width-aware and grapheme-safe.
 */
// truncateToWidthNoEllipsis 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateToWidthNoEllipsis(
  text: string,
  maxWidth: number,
): string {
  // 满足 `stringWidth(text) <= maxWidth` 时，共享工具执行该分支。
  if (stringWidth(text) <= maxWidth) return text
  // 满足 `maxWidth <= 0` 时，共享工具执行该分支。
  if (maxWidth <= 0) return ''
  // width 命名 `0`，让后续代码直接表达这个值的用途。
  let width = 0
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(text)`，让共享工具把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    // segWidth保存`stringWidth`，供共享工具后续处理使用。
    const segWidth = stringWidth(segment)
    // 满足 `width + segWidth > maxWidth` 时，共享工具执行该分支。
    if (width + segWidth > maxWidth) break
    // 共享工具 truncate在这里处理 `result += segment`，完成这一小步状态转换。
    result += segment
    // 共享工具 truncate在这里处理 `width += segWidth`，完成这一小步状态转换。
    width += segWidth
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Truncates a string to fit within a maximum display width (terminal columns),
 * splitting on grapheme boundaries to avoid breaking emoji, CJK, or surrogate pairs.
 * Appends '…' when truncation occurs.
 * @param str The string to truncate
 * @param maxWidth Maximum display width in terminal columns
 * @param singleLine If true, also truncates at the first newline
 * @returns The truncated string with ellipsis if needed
 */
// truncate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncate(
  str: string,
  maxWidth: number,
  singleLine: boolean = false,
): string {
  // 结果 命名 `str`，让后续代码直接表达这个值的用途。
  let result = str

  // If singleLine is true, truncate at first newline
  // 满足 `singleLine` 时，共享工具执行该分支。
  if (singleLine) {
    // firstNewline保存`str.indexOf`，供共享工具后续处理使用。
    const firstNewline = str.indexOf('\n')
    // `firstNewline` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (firstNewline !== -1) {
      // 结果更新为 `str.substring(0, firstNewline)`，确保共享工具后续读取最新状态。
      result = str.substring(0, firstNewline)
      // Ensure total width including ellipsis doesn't exceed maxWidth
      // 满足 `stringWidth(result) + 1 > maxWidth` 时，共享工具执行该分支。
      if (stringWidth(result) + 1 > maxWidth) {
        // 返回 `truncateToWidth(result, maxWidth)`，作为共享工具这次计算的结果。
        return truncateToWidth(result, maxWidth)
      }
      // 返回 ``${result}…``，作为共享工具这次计算的结果。
      return `${result}…`
    }
  }

  // 满足 `stringWidth(result) <= maxWidth` 时，共享工具执行该分支。
  if (stringWidth(result) <= maxWidth) {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }
  // 返回 `truncateToWidth(result, maxWidth)`，作为共享工具这次计算的结果。
  return truncateToWidth(result, maxWidth)
}

// wrapText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapText(text: string, width: number): string[] {
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // currentLine保存`''`，作为后续固定文本处理的输入。
  let currentLine = ''
  // currentWidth 命名 `0`，让后续代码直接表达这个值的用途。
  let currentWidth = 0

  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(text)`，让共享工具把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    // segWidth保存`stringWidth`，供共享工具后续处理使用。
    const segWidth = stringWidth(segment)
    // 满足 `currentWidth + segWidth <= width` 时，共享工具执行该分支。
    if (currentWidth + segWidth <= width) {
      // 共享工具 truncate在这里处理 `currentLine += segment`，完成这一小步状态转换。
      currentLine += segment
      // 共享工具 truncate在这里处理 `currentWidth += segWidth`，完成这一小步状态转换。
      currentWidth += segWidth
    } else {
      // 满足 `currentLine) lines.push(currentLine` 时，共享工具执行该分支。
      if (currentLine) lines.push(currentLine)
      // currentLine更新为 `segment`，确保共享工具后续读取最新状态。
      currentLine = segment
      // currentWidth更新为 `segWidth`，确保共享工具后续读取最新状态。
      currentWidth = segWidth
    }
  }

  // 满足 `currentLine) lines.push(currentLine` 时，共享工具执行该分支。
  if (currentLine) lines.push(currentLine)
  // 返回 `lines`，作为共享工具这次计算的结果。
  return lines
}
