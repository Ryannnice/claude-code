// TriggerPosition 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TriggerPosition = { word: string; start: number; end: number }

// OPEN_TO_CLOSE 集中保存共享工具 keyword要一起传递的字段。
const OPEN_TO_CLOSE: Record<string, string> = {
  '`': '`',
  '"': '"',
  '<': '>',
  '{': '}',
  '[': ']',
  '(': ')',
  "'": "'",
}

/**
 * Find keyword positions, skipping occurrences that are clearly not a
 * launch directive:
 *
 * - Inside paired delimiters: backticks, double quotes, angle brackets
 *   (tag-like only, so `n < 5 ultraplan n > 10` is not a phantom range),
 *   curly braces, square brackets (innermost — preExpansionInput has
 *   `[Pasted text #N]` placeholders), parentheses. Single quotes are
 *   delimiters only when not an apostrophe — the opening quote must be
 *   preceded by a non-word char (or start) and the closing quote must be
 *   followed by a non-word char (or end), so "let's ultraplan it's"
 *   still triggers.
 *
 * - Path/identifier-like context: immediately preceded or followed by
 *   `/`, `\`, or `-`, or followed by `.` + word char (file extension).
 *   `\b` sees a boundary at `-`, so `ultraplan-s` would otherwise
 *   match. This keeps `src/ultraplan/foo.ts`, `ultraplan.tsx`, and
 *   `--ultraplan-mode` from triggering while `ultraplan.` at a sentence
 *   end still does.
 *
 * - Followed by `?`: a question about the feature shouldn't invoke it.
 *   Other sentence punctuation (`.`, `,`, `!`) still triggers.
 *
 * - Slash command input: text starting with `/` is a slash command
 *   invocation (processUserInput.ts routes it to processSlashCommand,
 *   not keyword detection), so `/rename ultraplan foo` never triggers.
 *   Without this, PromptInput would rainbow-highlight the word and show
 *   the "will launch ultraplan" notification even though submitting the
 *   input runs /rename, not /ultraplan.
 *
 * Shape matches findThinkingTriggerPositions (thinking.ts) so
 * PromptInput treats both trigger types uniformly.
 */
// findKeywordTriggerPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findKeywordTriggerPositions(
  text: string,
  keyword: string,
): TriggerPosition[] {
  // re匹配`RegExp`，供共享工具后续处理使用。
  const re = new RegExp(keyword, 'i')
  // 满足 `!re.test(text)` 时，共享工具执行该分支。
  if (!re.test(text)) return []
  // 满足 `text.startsWith('/')` 时，共享工具执行该分支。
  if (text.startsWith('/')) return []
  // quotedRanges 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const quotedRanges: Array<{ start: number; end: number }> = []
  // openQuote保存`null`，作为后续空值处理的输入。
  let openQuote: string | null = null
  // openAt 命名 `0`，让后续代码直接表达这个值的用途。
  let openAt = 0
  // isWord记录 `u.test` 是否成立，共享工具随后按该结果分支。
  const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}_]/u.test(ch)
  // 按索引扫描 `text.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < text.length; i++) {
    // ch读取 `text[i]!` 对应条目，后续围绕该成员继续处理。
    const ch = text[i]!
    // 满足 `openQuote` 时，共享工具执行该分支。
    if (openQuote) {
      // 当 `openQuote` 匹配 `'[' && ch === '['` 时，共享工具执行对应分支。
      if (openQuote === '[' && ch === '[') {
        // openAt更新为 `i`，确保共享工具后续读取最新状态。
        openAt = i
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // `ch` 与 `OPEN_TO_CLOSE[openQuote]` 不一致时刷新派生状态，避免使用过期结果。
      if (ch !== OPEN_TO_CLOSE[openQuote]) continue
      // 只有 `openQuote === "'" && isWord(text[i + 1])` 满足时，共享工具才执行该分支。
      if (openQuote === "'" && isWord(text[i + 1])) continue
      // quotedRanges 集合追加新条目，保持收集顺序与输入顺序一致。
      quotedRanges.push({ start: openAt, end: i + 1 })
      // openQuote更新为 `null`，确保共享工具后续读取最新状态。
      openQuote = null
    // 共享工具 keyword在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      (ch === '<' && i + 1 < text.length && /[a-zA-Z/]/.test(text[i + 1]!)) ||
      (ch === "'" && !isWord(text[i - 1])) ||
      (ch !== '<' && ch !== "'" && ch in OPEN_TO_CLOSE)
    ) {
      // openQuote更新为 `ch`，确保共享工具后续读取最新状态。
      openQuote = ch
      // openAt更新为 `i`，确保共享工具后续读取最新状态。
      openAt = i
    }
  }

  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: TriggerPosition[] = []
  // wordRe匹配`RegExp`，供共享工具后续处理使用。
  const wordRe = new RegExp(`\\b${keyword}\\b`, 'gi')
  // matches 集合保存`text.matchAll`，供共享工具后续处理使用。
  const matches = text.matchAll(wordRe)
  // 按顺序遍历 `matches` 中的match，逐个交给共享工具处理。
  for (const match of matches) {
    // 满足 `match.index === undefined` 时，共享工具执行该分支。
    if (match.index === undefined) continue
    // start 命名 `match.index`，让后续代码直接表达这个值的用途。
    const start = match.index
    // end保存 `start + match[0].length` 的判断结果，供共享工具 keyword后续分支直接复用。
    const end = start + match[0].length
    // 只有 `quotedRanges.some(r => start >= r.start && start < r.end)` 满足时，共享工具才执行该分支。
    if (quotedRanges.some(r => start >= r.start && start < r.end)) continue
    // before读取 `text[start - 1]` 对应条目，后续围绕该成员继续处理。
    const before = text[start - 1]
    // after 命名 `text[end]`，让后续代码直接表达这个值的用途。
    const after = text[end]
    // 当 `before` 匹配 `'/' || before === '\\' || b...` 时，共享工具执行对应分支。
    if (before === '/' || before === '\\' || before === '-') continue
    // 当 `after` 匹配 `'/' || after === '\\' || af...` 时，共享工具执行对应分支。
    if (after === '/' || after === '\\' || after === '-' || after === '?')
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    // 只有 `after === '.' && isWord(text[end + 1])` 满足时，共享工具才执行该分支。
    if (after === '.' && isWord(text[end + 1])) continue
    // positions 集合追加新条目，保持收集顺序与输入顺序一致。
    positions.push({ word: match[0], start, end })
  }
  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// findUltraplanTriggerPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findUltraplanTriggerPositions(text: string): TriggerPosition[] {
  // 返回 `findKeywordTriggerPositions(text, 'ultraplan')`，作为共享工具这次计算的结果。
  return findKeywordTriggerPositions(text, 'ultraplan')
}

// findUltrareviewTriggerPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findUltrareviewTriggerPositions(
  text: string,
): TriggerPosition[] {
  // 返回 `findKeywordTriggerPositions(text, 'ultrareview')`，作为共享工具这次计算的结果。
  return findKeywordTriggerPositions(text, 'ultrareview')
}

// hasUltraplanKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasUltraplanKeyword(text: string): boolean {
  // 返回 `findUltraplanTriggerPositions(text).length > 0`，作为共享工具这次计算的结果。
  return findUltraplanTriggerPositions(text).length > 0
}

// hasUltrareviewKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasUltrareviewKeyword(text: string): boolean {
  // 返回 `findUltrareviewTriggerPositions(text).length > 0`，作为共享工具这次计算的结果。
  return findUltrareviewTriggerPositions(text).length > 0
}

/**
 * Replace the first triggerable "ultraplan" with "plan" so the forwarded
 * prompt stays grammatical ("please ultraplan this" → "please plan this").
 * Preserves the user's casing of the "plan" suffix.
 */
// replaceUltraplanKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function replaceUltraplanKeyword(text: string): string {
  // 从 `findUltraplanTriggerPositions(text)` 按位置拆出 trigger，让共享工具 keyword分别处理这些返回值。
  const [trigger] = findUltraplanTriggerPositions(text)
  // trigger缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trigger) return text
  // before格式化`text.slice`，供共享工具后续处理使用。
  const before = text.slice(0, trigger.start)
  // after格式化`text.slice`，供共享工具后续处理使用。
  const after = text.slice(trigger.end)
  // 满足 `!(before + after).trim()` 时，共享工具执行该分支。
  if (!(before + after).trim()) return ''
  // 返回 `before + trigger.word.slice('ultra'.length) + after`，作为共享工具这次计算的结果。
  return before + trigger.word.slice('ultra'.length) + after
}
