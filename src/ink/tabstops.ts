// Tab expansion, inspired by Ghostty's Tabstops.zig
// Uses 8-column intervals (POSIX default, hardcoded in terminals like Ghostty)

// 引入 stringWidth，将 ./stringWidth.js 中已经封装好的能力接到本文件流程里。
import { stringWidth } from './stringWidth.js'
// 引入 createTokenizer，将 ./termio/tokenize.js 中已经封装好的能力接到本文件流程里。
import { createTokenizer } from './termio/tokenize.js'

// DEFAULT_TAB_INTERVAL保存`8`，供后续判断或组装使用。
const DEFAULT_TAB_INTERVAL = 8

// expandTabs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandTabs(
  text: string,
  interval = DEFAULT_TAB_INTERVAL,
): string {
  // 满足 `!text.includes('\t')` 时，终端渲染执行该分支。
  if (!text.includes('\t')) {
    // 返回 `text`，作为终端渲染这次计算的结果。
    return text
  }

  // tokenizer构建`createTokenizer`，供终端渲染后续处理使用。
  const tokenizer = createTokenizer()
  // token 列表保存`tokenizer.feed`，供终端渲染后续处理使用。
  const tokens = tokenizer.feed(text)
  // token 列表追加新条目，保持收集顺序与输入顺序一致。
  tokens.push(...tokenizer.flush())

  // 结果保存`''`，作为后续固定文本处理的输入。
  let result = ''
  // column保存`0`，供Ink 渲染层 tabstops后续判断或输出使用。
  let column = 0

  // 按顺序遍历 `tokens` 中的token，逐个交给终端渲染处理。
  for (const token of tokens) {
    // 当 `token.type` 匹配 `'sequence'` 时，终端渲染执行对应分支。
    if (token.type === 'sequence') {
      // Ink 渲染层 tabstops在这里处理 `result += token.value`，完成这一小步状态转换。
      result += token.value
    } else {
      // 片段列表格式化`value.split`，供终端渲染后续处理使用。
      const parts = token.value.split(/(\t|\n)/)
      // 按顺序遍历 `parts` 中的part，逐个交给终端渲染处理。
      for (const part of parts) {
        // 当 `part` 匹配 `'\t'` 时，终端渲染执行对应分支。
        if (part === '\t') {
          // spaces 集合保存`interval - (column % interval)`，供Ink 渲染层 tabstops后续判断或输出使用。
          const spaces = interval - (column % interval)
          // Ink 渲染层 tabstops在这里处理 `result += ' '.repeat(spaces)`，完成这一小步状态转换。
          result += ' '.repeat(spaces)
          // Ink 渲染层 tabstops在这里处理 `column += spaces`，完成这一小步状态转换。
          column += spaces
        // Ink 渲染层 tabstops在这里处理 `} else if (part === '\n') {`，完成这一小步状态转换。
        } else if (part === '\n') {
          // Ink 渲染层 tabstops在这里处理 `result += part`，完成这一小步状态转换。
          result += part
          // column更新为 `0`，确保Ink 渲染层后续读取最新状态。
          column = 0
        } else {
          // Ink 渲染层 tabstops在这里处理 `result += part`，完成这一小步状态转换。
          result += part
          // Ink 渲染层 tabstops在这里处理 `column += stringWidth(part)`，完成这一小步状态转换。
          column += stringWidth(part)
        }
      }
    }
  }

  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}
