// Shorthand (+500k) anchored to start/end to avoid false positives in natural language.
// Verbose (use/spend 2M tokens) matches anywhere.
// SHORTHAND_START_RE 命名 `/^\s*\+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i`，让后续代码直接表达这个值的用途。
const SHORTHAND_START_RE = /^\s*\+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i
// Lookbehind (?<=\s) is avoided — it defeats YARR JIT in JSC, and the
// interpreter scans O(n) even with the $ anchor. Capture the whitespace
// instead; callers offset match.index by 1 where position matters.
// SHORTHAND_END_RE保存`/\s\+(\d+(?:\.\d+)?)\s*(k|m|b)\s*[.!?]?\s*$/i`，供共享工具 token Budget后续判断或输出使用。
const SHORTHAND_END_RE = /\s\+(\d+(?:\.\d+)?)\s*(k|m|b)\s*[.!?]?\s*$/i
// VERBOSE_RE保存`b`，供共享工具后续处理使用。
const VERBOSE_RE = /\b(?:use|spend)\s+(\d+(?:\.\d+)?)\s*(k|m|b)\s*tokens?\b/i
// VERBOSE_RE_G匹配`RegExp`，供共享工具后续处理使用。
const VERBOSE_RE_G = new RegExp(VERBOSE_RE.source, 'gi')

// MULTIPLIERS 集合 集中保存共享工具 token Budget要一起传递的字段。
const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
}

// parseBudgetMatch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseBudgetMatch(value: string, suffix: string): number {
  // 返回 `parseFloat(value) * MULTIPLIERS[suffix.toLowerCase()]!`，作为共享工具这次计算的结果。
  return parseFloat(value) * MULTIPLIERS[suffix.toLowerCase()]!
}

// parseTokenBudget 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseTokenBudget(text: string): number | null {
  // startMatch匹配`text.match`，供共享工具后续处理使用。
  const startMatch = text.match(SHORTHAND_START_RE)
  // 满足 `startMatch) return parseBudgetMatch(startMatch[1]!, startMatch[2]!` 时，共享工具执行该分支。
  if (startMatch) return parseBudgetMatch(startMatch[1]!, startMatch[2]!)
  // endMatch匹配`text.match`，供共享工具后续处理使用。
  const endMatch = text.match(SHORTHAND_END_RE)
  // 满足 `endMatch) return parseBudgetMatch(endMatch[1]!, endMatch[2]!` 时，共享工具执行该分支。
  if (endMatch) return parseBudgetMatch(endMatch[1]!, endMatch[2]!)
  // verboseMatch匹配`text.match`，供共享工具后续处理使用。
  const verboseMatch = text.match(VERBOSE_RE)
  // 满足 `verboseMatch) return parseBudgetMatch(verboseMatch[1]!, verboseMatch[2]!` 时，共享工具执行该分支。
  if (verboseMatch) return parseBudgetMatch(verboseMatch[1]!, verboseMatch[2]!)
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// findTokenBudgetPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findTokenBudgetPositions(
  text: string,
): Array<{ start: number; end: number }> {
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: Array<{ start: number; end: number }> = []
  // startMatch匹配`text.match`，供共享工具后续处理使用。
  const startMatch = text.match(SHORTHAND_START_RE)
  // 满足 `startMatch` 时，共享工具执行该分支。
  if (startMatch) {
    // offset 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const offset =
      startMatch.index! +
      startMatch[0].length -
      startMatch[0].trimStart().length
    // positions 集合追加新条目，保持收集顺序与输入顺序一致。
    positions.push({
      start: offset,
      end: startMatch.index! + startMatch[0].length,
    })
  }
  // endMatch匹配`text.match`，供共享工具后续处理使用。
  const endMatch = text.match(SHORTHAND_END_RE)
  // 满足 `endMatch` 时，共享工具执行该分支。
  if (endMatch) {
    // Avoid double-counting when input is just "+500k"
    // endStart匹配`endMatch.index! + 1 // +1: regex includes leading \s`，供后续判断或组装使用。
    const endStart = endMatch.index! + 1 // +1: regex includes leading \s
    // alreadyCovered筛选`positions.some`，供共享工具后续处理使用。
    const alreadyCovered = positions.some(
      // p更新为 `> endStart >= p.start && endStart < p.end`，确保共享工具后续读取最新状态。
      p => endStart >= p.start && endStart < p.end,
    )
    // alreadyCovered缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!alreadyCovered) {
      // positions 集合追加新条目，保持收集顺序与输入顺序一致。
      positions.push({
        start: endStart,
        end: endMatch.index! + endMatch[0].length,
      })
    }
  }
  // 逐项读取 `text.matchAll(VERBOSE_RE_G)` 中的match，按输入顺序推进共享工具。
  for (const match of text.matchAll(VERBOSE_RE_G)) {
    // positions 集合追加新条目，保持收集顺序与输入顺序一致。
    positions.push({ start: match.index, end: match.index + match[0].length })
  }
  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// getBudgetContinuationMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBudgetContinuationMessage(
  pct: number,
  turnTokens: number,
  budget: number,
): string {
  // fmt保存`Intl.NumberFormat`，供共享工具后续处理使用。
  const fmt = (n: number): string => new Intl.NumberFormat('en-US').format(n)
  // 返回 ``Stopped at ${pct}% of token target (${fmt(turnTokens)} / ${fmt(budget)...`，作为共享工具这次计算的结果。
  return `Stopped at ${pct}% of token target (${fmt(turnTokens)} / ${fmt(budget)}). Keep working \u2014 do not summarize.`
}
