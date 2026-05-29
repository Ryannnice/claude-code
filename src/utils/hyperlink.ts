// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../ink/supports-hyperlinks.js'

// OSC 8 hyperlink escape sequences
// Format: \e]8;;URL\e\\TEXT\e]8;;\e\\
// Using \x07 (BEL) as terminator which is more widely supported
// OSC8_START 命名 `'\x1b]8;;'`，让后续代码直接表达这个值的用途。
export const OSC8_START = '\x1b]8;;'
// OSC8_END保存`'\x07'`，作为后续固定文本处理的输入。
export const OSC8_END = '\x07'

// HyperlinkOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type HyperlinkOptions = {
  supportsHyperlinks?: boolean
}

/**
 * Create a clickable hyperlink using OSC 8 escape sequences.
 * Falls back to plain text if the terminal doesn't support hyperlinks.
 *
 * @param url - The URL to link to
 * @param content - Optional content to display as the link text (only when hyperlinks are supported).
 *                  If provided and hyperlinks are supported, this text is shown as a clickable link.
 *                  If hyperlinks are not supported, content is ignored and only the URL is shown.
 * @param options - Optional overrides for testing (supportsHyperlinks)
 */
// createHyperlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createHyperlink(
  url: string,
  content?: string,
  options?: HyperlinkOptions,
): string {
  // hasSupport记录 `supportsHyperlinks` 是否成立，共享工具随后按该结果分支。
  const hasSupport = options?.supportsHyperlinks ?? supportsHyperlinks()
  // hasSupport缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!hasSupport) {
    // 返回 `url`，作为共享工具这次计算的结果。
    return url
  }

  // Apply basic ANSI blue color - wrap-ansi preserves this across line breaks
  // RGB colors (like theme colors) are NOT preserved by wrap-ansi with OSC 8
  // displayText 命名 `content ?? url`，让后续代码直接表达这个值的用途。
  const displayText = content ?? url
  // coloredText保存`chalk.blue`，供共享工具后续处理使用。
  const coloredText = chalk.blue(displayText)
  // 返回 ``${OSC8_START}${url}${OSC8_END}${coloredText}${OSC8_START}${OSC8_END}``，作为共享工具这次计算的结果。
  return `${OSC8_START}${url}${OSC8_END}${coloredText}${OSC8_START}${OSC8_END}`
}
