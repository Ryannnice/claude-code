// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 引入 marked、Token、Tokens，将 marked 中已经封装好的能力接到本文件流程里。
import { marked, type Token, type Tokens } from 'marked'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 复用 color 终端界面组件，避免在这里重复拼装显示逻辑。
import { color } from '../components/design-system/color.js'
// 引入 BLOCKQUOTE_BAR，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLOCKQUOTE_BAR } from '../constants/figures.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../ink/supports-hyperlinks.js'
// 类型依赖 { CliHighlight } 来自 ./cliHighlight.js，用于校准共享工具的数据契约。
import type { CliHighlight } from './cliHighlight.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 createHyperlink，将 ./hyperlink.js 中已经封装好的能力接到本文件流程里。
import { createHyperlink } from './hyperlink.js'
// 引入 stripPromptXMLTags，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { stripPromptXMLTags } from './messages.js'
// 类型依赖 { ThemeName } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { ThemeName } from './theme.js'

// Use \n unconditionally — os.EOL is \r\n on Windows, and the extra \r
// breaks the character-to-segment mapping in applyStylesToWrappedText,
// causing styled text to shift right.
// EOL固定为 `'\n'`，作为共享工具 markdown后续展示或比较的基准。
const EOL = '\n'

// markedConfigured 配置标记共享工具 markdown是否启用对应路径。
let markedConfigured = false

// configureMarked 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function configureMarked(): void {
  // 满足 `markedConfigured` 时，共享工具执行该分支。
  if (markedConfigured) return
  // markedConfigured 配置更新为 `true`，确保共享工具后续读取最新状态。
  markedConfigured = true

  // Disable strikethrough parsing - the model often uses ~ for "approximate"
  // (e.g., ~100) and rarely intends actual strikethrough formatting
  // 调用 marked.use，触发共享工具此处需要的副作用。
  marked.use({
    tokenizer: {
      // del 使用 无 完成共享工具里的对应操作。
      del() {
        // 返回 `undefined`，作为共享工具这次计算的结果。
        return undefined
      },
    },
  })
}

// applyMarkdown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyMarkdown(
  content: string,
  theme: ThemeName,
  highlight: CliHighlight | null = null,
): string {
  // 调用 configureMarked，触发共享工具此处需要的副作用。
  configureMarked()
  // 返回 `marked`，作为共享工具这次计算的结果。
  return marked
    .lexer(stripPromptXMLTags(content))
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(_ => formatToken(_, theme, 0, null, null, highlight))
    .join('')
    .trim()
}

// formatToken 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatToken(
  token: Token,
  theme: ThemeName,
  listDepth = 0,
  orderedListNumber: number | null = null,
  parent: Token | null = null,
  highlight: CliHighlight | null = null,
): string {
  // 按照 token.type 的取值选择共享工具的具体处理分支。
  switch (token.type) {
    case 'blockquote': {
      // inner保存`(token.tokens ?? [])`，供共享工具 markdown后续判断或输出使用。
      const inner = (token.tokens ?? [])
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(_ => formatToken(_, theme, 0, null, null, highlight))
        .join('')
      // Prefix each line with a dim vertical bar. Keep text italic but at
      // normal brightness — chalk.dim is nearly invisible on dark themes.
      // bar保存`chalk.dim`，供共享工具后续处理使用。
      const bar = chalk.dim(BLOCKQUOTE_BAR)
      // 返回 `inner`，作为共享工具这次计算的结果。
      return inner
        .split(EOL)
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(line =>
          stripAnsi(line).trim() ? `${bar} ${chalk.italic(line)}` : line,
        )
        .join(EOL)
    }
    case 'code': {
      // highlight缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!highlight) {
        // 返回 `token.text + EOL`，作为共享工具这次计算的结果。
        return token.text + EOL
      }
      // language 命名 `'plaintext'`，让后续代码直接表达这个值的用途。
      let language = 'plaintext'
      // 满足 `token.lang` 时，共享工具执行该分支。
      if (token.lang) {
        // 满足 `highlight.supportsLanguage(token.lang)` 时，共享工具执行该分支。
        if (highlight.supportsLanguage(token.lang)) {
          // language更新为 `token.lang`，确保共享工具后续读取最新状态。
          language = token.lang
        } else {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Language not supported while highlighting code, falling back to plaintext: ${token.lang}`,
          )
        }
      }
      // 返回 `highlight.highlight(token.text, { language }) + EOL`，作为共享工具这次计算的结果。
      return highlight.highlight(token.text, { language }) + EOL
    }
    case 'codespan': {
      // inline code
      // 返回 `color('permission', theme)(token.text)`，作为共享工具这次计算的结果。
      return color('permission', theme)(token.text)
    }
    case 'em':
      // 返回 `chalk.italic(`，作为共享工具这次计算的结果。
      return chalk.italic(
        (token.tokens ?? [])
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(_ => formatToken(_, theme, 0, null, parent, highlight))
          .join(''),
      )
    case 'strong':
      // 返回 `chalk.bold(`，作为共享工具这次计算的结果。
      return chalk.bold(
        (token.tokens ?? [])
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(_ => formatToken(_, theme, 0, null, parent, highlight))
          .join(''),
      )
    case 'heading':
      // 按照 token.depth 的取值选择共享工具的具体处理分支。
      switch (token.depth) {
        case 1: // h1
          // 返回 `(`，作为共享工具这次计算的结果。
          return (
            chalk.bold.italic.underline(
              (token.tokens ?? [])
                // 链式调用 map，继续加工上一行在共享工具中产生的数据。
                .map(_ => formatToken(_, theme, 0, null, null, highlight))
                .join(''),
            ) +
            EOL +
            EOL
          )
        case 2: // h2
          // 返回 `(`，作为共享工具这次计算的结果。
          return (
            chalk.bold(
              (token.tokens ?? [])
                // 链式调用 map，继续加工上一行在共享工具中产生的数据。
                .map(_ => formatToken(_, theme, 0, null, null, highlight))
                .join(''),
            ) +
            EOL +
            EOL
          )
        default: // h3+
          // 返回 `(`，作为共享工具这次计算的结果。
          return (
            chalk.bold(
              (token.tokens ?? [])
                // 链式调用 map，继续加工上一行在共享工具中产生的数据。
                .map(_ => formatToken(_, theme, 0, null, null, highlight))
                .join(''),
            ) +
            EOL +
            EOL
          )
      }
    case 'hr':
      // 返回 `'---'`，作为共享工具这次计算的结果。
      return '---'
    case 'image':
      // 返回 `token.href`，作为共享工具这次计算的结果。
      return token.href
    case 'link': {
      // Prevent mailto links from being displayed as clickable links
      // 满足 `token.href.startsWith('mailto:')` 时，共享工具执行该分支。
      if (token.href.startsWith('mailto:')) {
        // Extract email from mailto: link and display as plain text
        // email格式化`href.replace`，供共享工具后续处理使用。
        const email = token.href.replace(/^mailto:/, '')
        // 返回 `email`，作为共享工具这次计算的结果。
        return email
      }
      // Extract display text from the link's child tokens
      // linkText保存`(token.tokens ?? [])`，供后续判断或组装使用。
      const linkText = (token.tokens ?? [])
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(_ => formatToken(_, theme, 0, null, token, highlight))
        .join('')
      // plainLinkText保存`stripAnsi`，供共享工具后续处理使用。
      const plainLinkText = stripAnsi(linkText)
      // If the link has meaningful display text (different from the URL),
      // show it as a clickable hyperlink. In terminals that support OSC 8,
      // users see the text and can hover/click to see the URL.
      // `plainLinkText && plainLinkText` 与 `token.href` 不一致时刷新派生状态，避免使用过期结果。
      if (plainLinkText && plainLinkText !== token.href) {
        // 返回 `createHyperlink(token.href, linkText)`，作为共享工具这次计算的结果。
        return createHyperlink(token.href, linkText)
      }
      // When the display text matches the URL (or is empty), just show the URL
      // 返回 `createHyperlink(token.href)`，作为共享工具这次计算的结果。
      return createHyperlink(token.href)
    }
    case 'list': {
      // 返回 `token.items`，作为共享工具这次计算的结果。
      return token.items
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map((_: Token, index: number) =>
          formatToken(
            _,
            theme,
            listDepth,
            token.ordered ? token.start + index : null,
            token,
            highlight,
          ),
        )
        .join('')
    }
    case 'list_item':
      // 返回 `(token.tokens ?? [])`，作为共享工具这次计算的结果。
      return (token.tokens ?? [])
        .map(
          // _更新为 `>`，确保共享工具后续读取最新状态。
          _ =>
            `${'  '.repeat(listDepth)}${formatToken(_, theme, listDepth + 1, orderedListNumber, token, highlight)}`,
        )
        .join('')
    case 'paragraph':
      // 返回 `(`，作为共享工具这次计算的结果。
      return (
        (token.tokens ?? [])
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(_ => formatToken(_, theme, 0, null, null, highlight))
          .join('') + EOL
      )
    case 'space':
      // 返回 `EOL`，作为共享工具这次计算的结果。
      return EOL
    case 'br':
      // 返回 `EOL`，作为共享工具这次计算的结果。
      return EOL
    case 'text':
      // 当 `parent?.type` 匹配 `'link'` 时，共享工具执行对应分支。
      if (parent?.type === 'link') {
        // Already inside a markdown link — the link handler will wrap this
        // in an OSC 8 hyperlink. Linkifying here would nest a second OSC 8
        // sequence, and terminals honor the innermost one, overriding the
        // link's actual href.
        // 返回 `token.text`，作为共享工具这次计算的结果。
        return token.text
      }
      // 当 `parent?.type` 匹配 `'list_item'` 时，共享工具执行对应分支。
      if (parent?.type === 'list_item') {
        // 返回 ``${orderedListNumber === null ? '-' : getListNumber(listDepth, orderedL...`，作为共享工具这次计算的结果。
        return `${orderedListNumber === null ? '-' : getListNumber(listDepth, orderedListNumber) + '.'} ${token.tokens ? token.tokens.map(_ => formatToken(_, theme, listDepth, orderedListNumber, token, highlight)).join('') : linkifyIssueReferences(token.text)}${EOL}`
      }
      // 返回 `linkifyIssueReferences(token.text)`，作为共享工具这次计算的结果。
      return linkifyIssueReferences(token.text)
    case 'table': {
      // tableToken保存`token as Tokens.Table`，供共享工具 markdown后续判断或输出使用。
      const tableToken = token as Tokens.Table

      // Helper function to get the text content that will be displayed (after stripAnsi)
      // getDisplayText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
      function getDisplayText(tokens: Token[] | undefined): string {
        // 返回 `stripAnsi(`，作为共享工具这次计算的结果。
        return stripAnsi(
          tokens
            ?.map(_ => formatToken(_, theme, 0, null, null, highlight))
            .join('') ?? '',
        )
      }

      // Determine column widths based on displayed content (without formatting)
      // columnWidths 集合派生`header.map`，供共享工具后续处理使用。
      const columnWidths = tableToken.header.map((header, index) => {
        // maxWidth保存`stringWidth`，供共享工具后续处理使用。
        let maxWidth = stringWidth(getDisplayText(header.tokens))
        // 按顺序遍历 `tableToken.rows` 中的row，逐个交给共享工具处理。
        for (const row of tableToken.rows) {
          // cellLength 数量保存`stringWidth`，供共享工具后续处理使用。
          const cellLength = stringWidth(getDisplayText(row[index]?.tokens))
          // maxWidth更新为 `Math.max(maxWidth, cellLength)`，确保共享工具后续读取最新状态。
          maxWidth = Math.max(maxWidth, cellLength)
        }
        // 返回 `Math.max(maxWidth, 3) // Minimum width of 3`，作为共享工具这次计算的结果。
        return Math.max(maxWidth, 3) // Minimum width of 3
      })

      // Format header row
      // tableOutput保存`'| '`，作为后续固定文本处理的输入。
      let tableOutput = '| '
      // 调用 tableToken.header.forEach，触发共享工具此处需要的副作用。
      tableToken.header.forEach((header, index) => {
        // content 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const content =
          header.tokens
            // 这个回调绑定到 ?.map(_ => formatToken(_, theme, 0, null, null, highlight))，负责共享工具在该局部场景下的响应。
            ?.map(_ => formatToken(_, theme, 0, null, null, highlight))
            .join('') ?? ''
        // displayText读取`getDisplayText`，供共享工具后续处理使用。
        const displayText = getDisplayText(header.tokens)
        // width保存`columnWidths[index]!`，供共享工具 markdown后续判断或输出使用。
        const width = columnWidths[index]!
        // align保存`tableToken.align?.[index]`，供共享工具 markdown后续判断或输出使用。
        const align = tableToken.align?.[index]
        // 共享工具 markdown在这里处理 `tableOutput +=`，完成这一小步状态转换。
        tableOutput +=
          padAligned(content, stringWidth(displayText), width, align) + ' | '
      })
      // tableOutput更新为 `tableOutput.trimEnd() + EOL`，确保共享工具后续读取最新状态。
      tableOutput = tableOutput.trimEnd() + EOL

      // Add separator row
      // 共享工具 markdown在这里处理 `tableOutput += '|'`，完成这一小步状态转换。
      tableOutput += '|'
      // 调用 columnWidths.forEach，触发共享工具此处需要的副作用。
      columnWidths.forEach(width => {
        // Always use dashes, don't show alignment colons in the output
        // separator保存`repeat`，供共享工具后续处理使用。
        const separator = '-'.repeat(width + 2) // +2 for spaces on each side
        // 共享工具 markdown在这里处理 `tableOutput += separator + '|'`，完成这一小步状态转换。
        tableOutput += separator + '|'
      })
      // 共享工具 markdown在这里处理 `tableOutput += EOL`，完成这一小步状态转换。
      tableOutput += EOL

      // Format data rows
      // 调用 tableToken.rows.forEach，触发共享工具此处需要的副作用。
      tableToken.rows.forEach(row => {
        // 共享工具 markdown在这里处理 `tableOutput += '| '`，完成这一小步状态转换。
        tableOutput += '| '
        // 调用 row.forEach，触发共享工具此处需要的副作用。
        row.forEach((cell, index) => {
          // content 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const content =
            cell.tokens
              // 这个回调绑定到 ?.map(_ => formatToken(_, theme, 0, null, null, highlight))，负责共享工具在该局部场景下的响应。
              ?.map(_ => formatToken(_, theme, 0, null, null, highlight))
              .join('') ?? ''
          // displayText读取`getDisplayText`，供共享工具后续处理使用。
          const displayText = getDisplayText(cell.tokens)
          // width保存`columnWidths[index]!`，供共享工具 markdown后续判断或输出使用。
          const width = columnWidths[index]!
          // align保存`tableToken.align?.[index]`，供共享工具 markdown后续判断或输出使用。
          const align = tableToken.align?.[index]
          // 共享工具 markdown在这里处理 `tableOutput +=`，完成这一小步状态转换。
          tableOutput +=
            padAligned(content, stringWidth(displayText), width, align) + ' | '
        })
        // tableOutput更新为 `tableOutput.trimEnd() + EOL`，确保共享工具后续读取最新状态。
        tableOutput = tableOutput.trimEnd() + EOL
      })

      // 返回 `tableOutput + EOL`，作为共享工具这次计算的结果。
      return tableOutput + EOL
    }
    case 'escape':
      // Markdown escape: \) → ), \\ → \, etc.
      // 返回 `token.text`，作为共享工具这次计算的结果。
      return token.text
    case 'def':
    case 'del':
    case 'html':
      // These token types are not rendered
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
  }
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

// Matches owner/repo#NNN style GitHub issue/PR references. The qualified form
// is unambiguous — bare #NNN was removed because it guessed the current repo
// and was wrong whenever the assistant discussed a different one.
// Owner segment disallows dots (GitHub usernames are alphanumerics + hyphens
// only) so hostnames like docs.github.io/guide#42 don't false-positive. Repo
// segment allows dots (e.g. cc.kurs.web). Lookbehind is avoided — it defeats
// YARR JIT in JSC.
// ISSUE_REF_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const ISSUE_REF_PATTERN =
  /(^|[^\w./-])([A-Za-z0-9][\w-]*\/[A-Za-z0-9][\w.-]*)#(\d+)\b/g

/**
 * Replaces owner/repo#123 references with clickable hyperlinks to GitHub.
 */
// linkifyIssueReferences 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function linkifyIssueReferences(text: string): string {
  // 满足 `!supportsHyperlinks()` 时，共享工具执行该分支。
  if (!supportsHyperlinks()) {
    // 返回 `text`，作为共享工具这次计算的结果。
    return text
  }
  // 返回 `text.replace(`，作为共享工具这次计算的结果。
  return text.replace(
    ISSUE_REF_PATTERN,
    // 这个回调绑定到 (_match, prefix, repo, num) =>，负责共享工具在该局部场景下的响应。
    (_match, prefix, repo, num) =>
      prefix +
      createHyperlink(
        `https://github.com/${repo}/issues/${num}`,
        `${repo}#${num}`,
      ),
  )
}

// numberToLetter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function numberToLetter(n: number): string {
  // 结果固定为 `''`，作为共享工具 markdown后续展示或比较的基准。
  let result = ''
  // while 使用 n > 0 完成共享工具里的对应操作。
  while (n > 0) {
    // 共享工具 markdown在这里处理 `n--`，完成这一小步状态转换。
    n--
    // 结果更新为 `String.fromCharCode(97 + (n % 26)) + result`，确保共享工具后续读取最新状态。
    result = String.fromCharCode(97 + (n % 26)) + result
    // n更新为 `Math.floor(n / 26)`，确保共享工具后续读取最新状态。
    n = Math.floor(n / 26)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// ROMAN_VALUES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ROMAN_VALUES: ReadonlyArray<[number, string]> = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
]

// numberToRoman 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function numberToRoman(n: number): string {
  // 结果固定为 `''`，作为共享工具 markdown后续展示或比较的基准。
  let result = ''
  // 循环处理 `const [value, numeral] of ROMAN_VALUES`，让共享工具逐项把同类条目按顺序走完。
  for (const [value, numeral] of ROMAN_VALUES) {
    // while 使用 n >= value 完成共享工具里的对应操作。
    while (n >= value) {
      // 共享工具 markdown在这里处理 `result += numeral`，完成这一小步状态转换。
      result += numeral
      // 共享工具 markdown在这里处理 `n -= value`，完成这一小步状态转换。
      n -= value
    }
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// getListNumber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getListNumber(listDepth: number, orderedListNumber: number): string {
  // 按照 listDepth 的取值选择共享工具的具体处理分支。
  switch (listDepth) {
    case 0:
    case 1:
      // 返回 `orderedListNumber.toString()`，作为共享工具这次计算的结果。
      return orderedListNumber.toString()
    case 2:
      // 返回 `numberToLetter(orderedListNumber)`，作为共享工具这次计算的结果。
      return numberToLetter(orderedListNumber)
    case 3:
      // 返回 `numberToRoman(orderedListNumber)`，作为共享工具这次计算的结果。
      return numberToRoman(orderedListNumber)
    default:
      // 返回 `orderedListNumber.toString()`，作为共享工具这次计算的结果。
      return orderedListNumber.toString()
  }
}

/**
 * Pad `content` to `targetWidth` according to alignment. `displayWidth` is the
 * visible width of `content` (caller computes this, e.g. via stringWidth on
 * stripAnsi'd text, so ANSI codes in `content` don't affect padding).
 */
// padAligned 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function padAligned(
  content: string,
  displayWidth: number,
  targetWidth: number,
  align: 'left' | 'center' | 'right' | null | undefined,
): string {
  // padding保存`Math.max`，供共享工具后续处理使用。
  const padding = Math.max(0, targetWidth - displayWidth)
  // 当 `align` 匹配 `'center'` 时，共享工具执行对应分支。
  if (align === 'center') {
    // leftPad保存`Math.floor`，供共享工具后续处理使用。
    const leftPad = Math.floor(padding / 2)
    // 返回 `' '.repeat(leftPad) + content + ' '.repeat(padding - leftPad)`，作为共享工具这次计算的结果。
    return ' '.repeat(leftPad) + content + ' '.repeat(padding - leftPad)
  }
  // 当 `align` 匹配 `'right'` 时，共享工具执行对应分支。
  if (align === 'right') {
    // 返回 `' '.repeat(padding) + content`，作为共享工具这次计算的结果。
    return ' '.repeat(padding) + content
  }
  // 返回 `content + ' '.repeat(padding)`，作为共享工具这次计算的结果。
  return content + ' '.repeat(padding)
}
