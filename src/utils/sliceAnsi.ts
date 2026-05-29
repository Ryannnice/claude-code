// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnsiCode,
  ansiCodesToString,
  reduceAnsiCodes,
  tokenize,
  undoAnsiCodes,
} from '@alcalzone/ansi-tokenize'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'

// A code is an "end code" if its code equals its endCode (e.g., hyperlink close)
// isEndCode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEndCode(code: AnsiCode): boolean {
  // 返回 `code.code === code.endCode`，作为共享工具这次计算的结果。
  return code.code === code.endCode
}

// Filter to only include "start codes" (not end codes)
// filterStartCodes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterStartCodes(codes: AnsiCode[]): AnsiCode[] {
  // 返回 `codes.filter(c => !isEndCode(c))`，作为共享工具这次计算的结果。
  return codes.filter(c => !isEndCode(c))
}

/**
 * Slice a string containing ANSI escape codes.
 *
 * Unlike the slice-ansi package, this properly handles OSC 8 hyperlink
 * sequences because @alcalzone/ansi-tokenize tokenizes them correctly.
 */
// 共享工具 slice Ansi在这里处理 `export default function sliceAnsi(`，完成这一小步状态转换。
export default function sliceAnsi(
  str: string,
  start: number,
  end?: number,
): string {
  // Don't pass `end` to tokenize — it counts code units, not display cells,
  // so it drops tokens early for text with zero-width combining marks.
  // token 列表保存`tokenize`，供共享工具后续处理使用。
  const tokens = tokenize(str)
  // activeCodes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let activeCodes: AnsiCode[] = []
  // position保存`0`，供后续判断或组装使用。
  let position = 0
  // 结果保存`''`，作为后续固定文本处理的输入。
  let result = ''
  // include标记共享工具 slice Ansi是否启用对应路径。
  let include = false

  // 按顺序遍历 `tokens` 中的token，逐个交给共享工具处理。
  for (const token of tokens) {
    // Advance by display width, not code units. Combining marks (Devanagari
    // matras, virama, diacritics) are width 0 — counting them via .length
    // advanced position past `end` early and truncated the slice. Callers
    // pass start/end in display cells (via stringWidth), so position must
    // track the same units.
    // width 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const width =
      token.type === 'ansi' ? 0 : token.fullWidth ? 2 : stringWidth(token.value)

    // Break AFTER trailing zero-width marks — a combining mark attaches to
    // the preceding base char, so "भा" (भ + ा, 1 display cell) sliced at
    // end=1 must include the ा. Breaking on position >= end BEFORE the
    // zero-width check would drop it and render भ bare. ANSI codes are
    // width 0 but must NOT be included past end (they open new style runs
    // that leak into the undo sequence), so gate on char type too. The
    // !include guard ensures empty slices (start===end) stay empty even
    // when the string starts with a zero-width char (BOM, ZWJ).
    // `end` 与 `undefined && position >= end` 不一致时刷新派生状态，避免使用过期结果。
    if (end !== undefined && position >= end) {
      // 只有 `token.type === 'ansi' || width > 0 || !include` 满足时，共享工具才执行该分支。
      if (token.type === 'ansi' || width > 0 || !include) break
    }

    // 当 `token.type` 匹配 `'ansi'` 时，共享工具执行对应分支。
    if (token.type === 'ansi') {
      // activeCodes 集合追加新条目，保持收集顺序与输入顺序一致。
      activeCodes.push(token)
      // 满足 `include` 时，共享工具执行该分支。
      if (include) {
        // Emit all ANSI codes during the slice
        // 共享工具 slice Ansi在这里处理 `result += token.code`，完成这一小步状态转换。
        result += token.code
      }
    } else {
      // 只有 `!include && position >= start` 满足时，共享工具才执行该分支。
      if (!include && position >= start) {
        // Skip leading zero-width marks at the start boundary — they belong
        // to the preceding base char in the left half. Without this, the
        // mark appears in BOTH halves: left+right ≠ original. Only applies
        // when start > 0 (otherwise there's no preceding char to own it).
        // 只有 `start > 0 && width === 0` 满足时，共享工具才执行该分支。
        if (start > 0 && width === 0) continue
        // include更新为 `true`，确保共享工具后续读取最新状态。
        include = true
        // Reduce and filter to only active start codes
        // activeCodes 集合更新为 `filterStartCodes(reduceAnsiCodes(activeCodes))`，确保共享工具后续读取最新状态。
        activeCodes = filterStartCodes(reduceAnsiCodes(activeCodes))
        // 结果更新为 `ansiCodesToString(activeCodes)`，确保共享工具后续读取最新状态。
        result = ansiCodesToString(activeCodes)
      }

      // 满足 `include` 时，共享工具执行该分支。
      if (include) {
        // 共享工具 slice Ansi在这里处理 `result += token.value`，完成这一小步状态转换。
        result += token.value
      }

      // 共享工具 slice Ansi在这里处理 `position += width`，完成这一小步状态转换。
      position += width
    }
  }

  // Only undo start codes that are still active
  // activeStartCodes 集合筛选`filterStartCodes`，供共享工具后续处理使用。
  const activeStartCodes = filterStartCodes(reduceAnsiCodes(activeCodes))
  // 共享工具 slice Ansi在这里处理 `result += ansiCodesToString(undoAnsiCodes(activeStartCodes))`，完成这一小步状态转换。
  result += ansiCodesToString(undoAnsiCodes(activeStartCodes))
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
