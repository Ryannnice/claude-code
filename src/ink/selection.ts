/**
 * Text selection state for fullscreen mode.
 *
 * Tracks a linear selection in screen-buffer coordinates (0-indexed col/row).
 * Selection is line-based: cells from (startCol, startRow) through
 * (endCol, endRow) inclusive, wrapping across line boundaries. This matches
 * terminal-native selection behavior (not rectangular/block).
 *
 * The selection is stored as ANCHOR (where the drag started) + FOCUS (where
 * the cursor is now). The rendered highlight normalizes to start ≤ end.
 */

// 引入 clamp，将 ./layout/geometry.js 中已经封装好的能力接到本文件流程里。
import { clamp } from './layout/geometry.js'
// 类型依赖 { Screen, StylePool } 来自 ./screen.js，用于校准终端渲染的数据契约。
import type { Screen, StylePool } from './screen.js'
// 引入 CellWidth、cellAt、cellAtIndex、setCellStyleId，将 ./screen.js 中已经封装好的能力接到本文件流程里。
import { CellWidth, cellAt, cellAtIndex, setCellStyleId } from './screen.js'

// Point 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Point = { col: number; row: number }

// SelectionState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SelectionState = {
  /** Where the mouse-down occurred. Null when no selection. */
  anchor: Point | null
  /** Current drag position (updated on mouse-move while dragging). */
  focus: Point | null
  /** True between mouse-down and mouse-up. */
  isDragging: boolean
  /** For word/line mode: the initial word/line bounds from the first
   *  multi-click. Drag extends from this span to the word/line at the
   *  current mouse position so the original word/line stays selected
   *  even when dragging backward past it. Null ⇔ char mode. The kind
   *  tells extendSelection whether to snap to word or line boundaries. */
  anchorSpan: { lo: Point; hi: Point; kind: 'word' | 'line' } | null
  /** Text from rows that scrolled out ABOVE the viewport during
   *  drag-to-scroll. The screen buffer only holds the current viewport,
   *  so without this accumulator, dragging down past the bottom edge
   *  loses the top of the selection once the anchor clamps. Prepended
   *  to the on-screen text by getSelectedText. Reset on start/clear. */
  scrolledOffAbove: string[]
  /** Symmetric: rows scrolled out BELOW when dragging up. Appended. */
  scrolledOffBelow: string[]
  /** Soft-wrap bits parallel to scrolledOffAbove — true means the row
   *  is a continuation of the one before it (the `\n` was inserted by
   *  word-wrap, not in the source). Captured alongside the text at
   *  scroll time since the screen's softWrap bitmap shifts with content.
   *  getSelectedText uses these to join wrapped rows back into logical
   *  lines. */
  scrolledOffAboveSW: boolean[]
  /** Parallel to scrolledOffBelow. */
  scrolledOffBelowSW: boolean[]
  /** Pre-clamp anchor row. Set when shiftSelection clamps anchor so a
   *  reverse scroll can restore the true position and pop accumulators.
   *  Without this, PgDn (clamps anchor) → PgUp leaves anchor at the wrong
   *  row AND scrolledOffAbove stale — highlight ≠ copy. Undefined when
   *  anchor is in-bounds (no clamp debt). Cleared on start/clear. */
  virtualAnchorRow?: number
  /** Same for focus. */
  virtualFocusRow?: number
  /** True if the mouse-down that started this selection had the alt
   *  modifier set (SGR button bit 0x08). On macOS xterm.js this is a
   *  signal that VS Code's macOptionClickForcesSelection is OFF — if it
   *  were on, xterm.js would have consumed the event for native selection
   *  and we'd never receive it. Used by the footer to show the right hint. */
  lastPressHadAlt: boolean
}

// createSelectionState 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSelectionState(): SelectionState {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    anchor: null,
    focus: null,
    isDragging: false,
    anchorSpan: null,
    scrolledOffAbove: [],
    scrolledOffBelow: [],
    scrolledOffAboveSW: [],
    scrolledOffBelowSW: [],
    lastPressHadAlt: false,
  }
}

// startSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startSelection(
  s: SelectionState,
  col: number,
  row: number,
): void {
  // anchor更新为 `{ col, row }`，确保Ink 渲染层后续读取最新状态。
  s.anchor = { col, row }
  // Focus is not set until the first drag motion. A click-release with no
  // drag leaves focus null → hasSelection/selectionBounds return false/null
  // via the `!s.focus` check, so a bare click never highlights a cell.
  // focus 集合更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.focus = null
  // isDragging更新为 `true`，确保Ink 渲染层后续读取最新状态。
  s.isDragging = true
  // anchorSpan更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.anchorSpan = null
  // scrolledOffAbove更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffAbove = []
  // scrolledOffBelow更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffBelow = []
  // scrolledOffAboveSW更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffAboveSW = []
  // scrolledOffBelowSW更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffBelowSW = []
  // virtualAnchorRow更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualAnchorRow = undefined
  // virtualFocusRow更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualFocusRow = undefined
  // lastPressHadAlt更新为 `false`，确保Ink 渲染层后续读取最新状态。
  s.lastPressHadAlt = false
}

// updateSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateSelection(
  s: SelectionState,
  col: number,
  row: number,
): void {
  // s.isDragging缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!s.isDragging) return
  // First motion at the same cell as anchor is a no-op. Terminals in mode
  // 1002 can fire a drag event at the anchor cell (sub-pixel tremor, or a
  // motion-release pair). Setting focus here would turn a bare click into
  // a 1-cell selection and clobber the clipboard via useCopyOnSelect. Once
  // focus is set (real drag), we track normally including back to anchor.
  // 只有 `!s.focus && s.anchor && s.anchor.col === col && s.anchor.row === row` 满足时，终端渲染才执行该分支。
  if (!s.focus && s.anchor && s.anchor.col === col && s.anchor.row === row)
    // Ink 渲染层 selection在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  // focus 集合更新为 `{ col, row }`，确保Ink 渲染层后续读取最新状态。
  s.focus = { col, row }
}

// finishSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function finishSelection(s: SelectionState): void {
  // isDragging更新为 `false`，确保Ink 渲染层后续读取最新状态。
  s.isDragging = false
  // Keep anchor/focus so highlight stays visible and text can be copied.
  // Clear via clearSelection() on Esc or after copy.
}

// clearSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSelection(s: SelectionState): void {
  // anchor更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.anchor = null
  // focus 集合更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.focus = null
  // isDragging更新为 `false`，确保Ink 渲染层后续读取最新状态。
  s.isDragging = false
  // anchorSpan更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.anchorSpan = null
  // scrolledOffAbove更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffAbove = []
  // scrolledOffBelow更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffBelow = []
  // scrolledOffAboveSW更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffAboveSW = []
  // scrolledOffBelowSW更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  s.scrolledOffBelowSW = []
  // virtualAnchorRow更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualAnchorRow = undefined
  // virtualFocusRow更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualFocusRow = undefined
  // lastPressHadAlt更新为 `false`，确保Ink 渲染层后续读取最新状态。
  s.lastPressHadAlt = false
}

// Unicode-aware word character matcher: letters (any script), digits,
// and the punctuation set iTerm2 treats as word-part by default.
// Matching iTerm2's default means double-clicking a path like
// `/usr/bin/bash` or `~/.claude/config.json` selects the whole thing,
// which is the muscle memory most macOS terminal users have.
// iTerm2 default "characters considered part of a word": /-+\~_.
// WORD_CHAR读取 `/[\p{L}\p{N}_/.\-+~\\]/u` 对应条目，后续围绕该成员继续处理。
const WORD_CHAR = /[\p{L}\p{N}_/.\-+~\\]/u

/**
 * Character class for double-click word-expansion. Cells with the same
 * class as the clicked cell are included in the selection; a class change
 * is a boundary. Matches typical terminal-emulator behavior (iTerm2 etc.):
 * double-click on `foo` selects `foo`, on `->` selects `->`, on spaces
 * selects the whitespace run.
 */
// charClass 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function charClass(c: string): 0 | 1 | 2 {
  // 当 `c` 匹配 `' ' || c === ''` 时，终端渲染执行对应分支。
  if (c === ' ' || c === '') return 0
  // 满足 `WORD_CHAR.test(c)` 时，终端渲染执行该分支。
  if (WORD_CHAR.test(c)) return 1
  // 返回 `2`，作为终端渲染这次计算的结果。
  return 2
}

/**
 * Find the bounds of the same-class character run at (col, row). Returns
 * null if the click is out of bounds or lands on a noSelect cell. Used by
 * selectWordAt (initial double-click) and extendWordSelection (drag).
 */
// wordBoundsAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wordBoundsAt(
  screen: Screen,
  col: number,
  row: number,
): { lo: number; hi: number } | null {
  // 只有 `row < 0 || row >= screen.height` 满足时，终端渲染才执行该分支。
  if (row < 0 || row >= screen.height) return null
  // width保存`screen.width`，供后续判断或组装使用。
  const width = screen.width
  // noSelect保存`screen.noSelect`，供后续判断或组装使用。
  const noSelect = screen.noSelect
  // rowOff保存`row * width`，供Ink 渲染层 selection后续判断或输出使用。
  const rowOff = row * width

  // If the click landed on the spacer tail of a wide char, step back to
  // the head so the class check sees the actual grapheme.
  // c保存`col`，供Ink 渲染层 selection后续判断或输出使用。
  let c = col
  // 满足 `c > 0` 时，终端渲染执行该分支。
  if (c > 0) {
    // cell保存`cellAt`，供终端渲染后续处理使用。
    const cell = cellAt(screen, c, row)
    // 只有 `cell && cell.width === CellWidth.SpacerTail` 满足时，终端渲染才执行该分支。
    if (cell && cell.width === CellWidth.SpacerTail) c -= 1
  }
  // 只有 `c < 0 || c >= width || noSelect[rowOff + c] === 1` 满足时，终端渲染才执行该分支。
  if (c < 0 || c >= width || noSelect[rowOff + c] === 1) return null

  // startCell保存`cellAt`，供终端渲染后续处理使用。
  const startCell = cellAt(screen, c, row)
  // startCell缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!startCell) return null
  // cls 集合保存`charClass`，供终端渲染后续处理使用。
  const cls = charClass(startCell.char)

  // Expand left: include cells of the same class, stop at noSelect or
  // class change. SpacerTail cells are stepped over (the wide-char head
  // at the preceding column determines the class).
  // lo保存`c`，供Ink 渲染层 selection后续判断或输出使用。
  let lo = c
  // while 使用 lo > 0 完成终端渲染里的对应操作。
  while (lo > 0) {
    // prev保存`lo - 1`，供后续判断或组装使用。
    const prev = lo - 1
    // 满足 `noSelect[rowOff + prev] === 1` 时，终端渲染执行该分支。
    if (noSelect[rowOff + prev] === 1) break
    // pc保存`cellAt`，供终端渲染后续处理使用。
    const pc = cellAt(screen, prev, row)
    // pc缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!pc) break
    // 满足 `pc.width === CellWidth.SpacerTail` 时，终端渲染执行该分支。
    if (pc.width === CellWidth.SpacerTail) {
      // Step over the spacer to the wide-char head
      // 只有 `prev === 0 || noSelect[rowOff + prev - 1] === 1` 满足时，终端渲染才执行该分支。
      if (prev === 0 || noSelect[rowOff + prev - 1] === 1) break
      // head保存`cellAt`，供终端渲染后续处理使用。
      const head = cellAt(screen, prev - 1, row)
      // `!head || charClass(head.char)` 与 `cls` 不一致时刷新派生状态，避免使用过期结果。
      if (!head || charClass(head.char) !== cls) break
      // lo更新为 `prev - 1`，确保Ink 渲染层后续读取最新状态。
      lo = prev - 1
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // `charClass(pc.char)` 与 `cls` 不一致时刷新派生状态，避免使用过期结果。
    if (charClass(pc.char) !== cls) break
    // lo更新为 `prev`，确保Ink 渲染层后续读取最新状态。
    lo = prev
  }

  // Expand right: same logic, skipping spacer tails.
  // hi保存`c`，供Ink 渲染层 selection后续判断或输出使用。
  let hi = c
  // while 使用 hi < width - 1 完成终端渲染里的对应操作。
  while (hi < width - 1) {
    // next保存`hi + 1`，供Ink 渲染层 selection后续判断或输出使用。
    const next = hi + 1
    // 满足 `noSelect[rowOff + next] === 1` 时，终端渲染执行该分支。
    if (noSelect[rowOff + next] === 1) break
    // nc保存`cellAt`，供终端渲染后续处理使用。
    const nc = cellAt(screen, next, row)
    // nc缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!nc) break
    // 满足 `nc.width === CellWidth.SpacerTail` 时，终端渲染执行该分支。
    if (nc.width === CellWidth.SpacerTail) {
      // Include the spacer tail in the selection range (it belongs to
      // the wide char at hi) and continue past it.
      // hi更新为 `next`，确保Ink 渲染层后续读取最新状态。
      hi = next
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // `charClass(nc.char)` 与 `cls` 不一致时刷新派生状态，避免使用过期结果。
    if (charClass(nc.char) !== cls) break
    // hi更新为 `next`，确保Ink 渲染层后续读取最新状态。
    hi = next
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { lo, hi }
}

/** -1 if a < b, 1 if a > b, 0 if equal (reading order: row then col). */
// comparePoints 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function comparePoints(a: Point, b: Point): number {
  // `a.row` 与 `b.row` 不一致时刷新派生状态，避免使用过期结果。
  if (a.row !== b.row) return a.row < b.row ? -1 : 1
  // `a.col` 与 `b.col` 不一致时刷新派生状态，避免使用过期结果。
  if (a.col !== b.col) return a.col < b.col ? -1 : 1
  // 返回 `0`，作为终端渲染这次计算的结果。
  return 0
}

/**
 * Select the word at (col, row) by scanning the screen buffer for the
 * bounds of the same-class character run. Mutates the selection in place.
 * No-op if the click is out of bounds or lands on a noSelect cell.
 * Sets isDragging=true and anchorSpan so a subsequent drag extends the
 * selection word-by-word (native macOS behavior).
 */
// selectWordAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function selectWordAt(
  s: SelectionState,
  screen: Screen,
  col: number,
  row: number,
): void {
  // b保存`wordBoundsAt`，供终端渲染后续处理使用。
  const b = wordBoundsAt(screen, col, row)
  // b缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!b) return
  // lo 集中保存Ink 渲染层 selection要一起传递的字段。
  const lo = { col: b.lo, row }
  // hi 集中保存Ink 渲染层 selection要一起传递的字段。
  const hi = { col: b.hi, row }
  // anchor更新为 `lo`，确保Ink 渲染层后续读取最新状态。
  s.anchor = lo
  // focus 集合更新为 `hi`，确保Ink 渲染层后续读取最新状态。
  s.focus = hi
  // isDragging更新为 `true`，确保Ink 渲染层后续读取最新状态。
  s.isDragging = true
  // anchorSpan更新为 `{ lo, hi, kind: 'word' }`，确保Ink 渲染层后续读取最新状态。
  s.anchorSpan = { lo, hi, kind: 'word' }
}

// Printable ASCII minus terminal URL delimiters. Restricting to single-
// codeunit ASCII keeps cell-count === string-index, so the column-span
// check below is exact (no wide-char/grapheme drift).
// URL_BOUNDARY保存`Set`，供终端渲染后续处理使用。
const URL_BOUNDARY = new Set([...'<>"\'` '])
// isUrlChar 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUrlChar(c: string): boolean {
  // `c.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (c.length !== 1) return false
  // code保存`c.charCodeAt`，供终端渲染后续处理使用。
  const code = c.charCodeAt(0)
  // 返回 `code >= 0x21 && code <= 0x7e && !URL_BOUNDARY.has(c)`，作为终端渲染这次计算的结果。
  return code >= 0x21 && code <= 0x7e && !URL_BOUNDARY.has(c)
}

/**
 * Scan the screen buffer for a plain-text URL at (col, row). Mirrors the
 * terminal's native Cmd+Click URL detection, which fullscreen mode's mouse
 * tracking intercepts. Called from getHyperlinkAt as a fallback when the
 * cell has no OSC 8 hyperlink.
 */
// findPlainTextUrlAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findPlainTextUrlAt(
  screen: Screen,
  col: number,
  row: number,
): string | undefined {
  // 只有 `row < 0 || row >= screen.height` 满足时，终端渲染才执行该分支。
  if (row < 0 || row >= screen.height) return undefined
  // width保存`screen.width`，供后续判断或组装使用。
  const width = screen.width
  // noSelect保存`screen.noSelect`，供后续判断或组装使用。
  const noSelect = screen.noSelect
  // rowOff保存`row * width`，供Ink 渲染层 selection后续判断或输出使用。
  const rowOff = row * width

  // c保存`col`，供Ink 渲染层 selection后续判断或输出使用。
  let c = col
  // 满足 `c > 0` 时，终端渲染执行该分支。
  if (c > 0) {
    // cell保存`cellAt`，供终端渲染后续处理使用。
    const cell = cellAt(screen, c, row)
    // 只有 `cell && cell.width === CellWidth.SpacerTail` 满足时，终端渲染才执行该分支。
    if (cell && cell.width === CellWidth.SpacerTail) c -= 1
  }
  // 只有 `c < 0 || c >= width || noSelect[rowOff + c] === 1` 满足时，终端渲染才执行该分支。
  if (c < 0 || c >= width || noSelect[rowOff + c] === 1) return undefined

  // startCell保存`cellAt`，供终端渲染后续处理使用。
  const startCell = cellAt(screen, c, row)
  // 只有 `!startCell || !isUrlChar(startCell.char)` 满足时，终端渲染才执行该分支。
  if (!startCell || !isUrlChar(startCell.char)) return undefined

  // Expand left/right to the bounds of the URL-char run. URLs are ASCII
  // (CellWidth.Narrow, 1 codeunit), so hitting a non-ASCII/wide/spacer
  // cell is a boundary — no need to step over spacers like wordBoundsAt.
  // lo保存`c`，供Ink 渲染层 selection后续判断或输出使用。
  let lo = c
  // while 使用 lo > 0 完成终端渲染里的对应操作。
  while (lo > 0) {
    // prev保存`lo - 1`，供后续判断或组装使用。
    const prev = lo - 1
    // 满足 `noSelect[rowOff + prev] === 1` 时，终端渲染执行该分支。
    if (noSelect[rowOff + prev] === 1) break
    // pc保存`cellAt`，供终端渲染后续处理使用。
    const pc = cellAt(screen, prev, row)
    // `!pc || pc.width` 与 `CellWidth.Narrow || !isUrlChar(...` 不一致时刷新派生状态，避免使用过期结果。
    if (!pc || pc.width !== CellWidth.Narrow || !isUrlChar(pc.char)) break
    // lo更新为 `prev`，确保Ink 渲染层后续读取最新状态。
    lo = prev
  }
  // hi保存`c`，供Ink 渲染层 selection后续判断或输出使用。
  let hi = c
  // while 使用 hi < width - 1 完成终端渲染里的对应操作。
  while (hi < width - 1) {
    // next保存`hi + 1`，供Ink 渲染层 selection后续判断或输出使用。
    const next = hi + 1
    // 满足 `noSelect[rowOff + next] === 1` 时，终端渲染执行该分支。
    if (noSelect[rowOff + next] === 1) break
    // nc保存`cellAt`，供终端渲染后续处理使用。
    const nc = cellAt(screen, next, row)
    // `!nc || nc.width` 与 `CellWidth.Narrow || !isUrlChar(...` 不一致时刷新派生状态，避免使用过期结果。
    if (!nc || nc.width !== CellWidth.Narrow || !isUrlChar(nc.char)) break
    // hi更新为 `next`，确保Ink 渲染层后续读取最新状态。
    hi = next
  }

  // token固定为 `''`，作为Ink 渲染层 selection后续展示或比较的基准。
  let token = ''
  // 循环处理 `let i = lo; i <= hi; i++) token += cellAt(screen, i, row`，让终端渲染把同类条目按顺序走完。
  for (let i = lo; i <= hi; i++) token += cellAt(screen, i, row)!.char

  // 1 cell = 1 char across [lo, hi] (ASCII-only run), so string index =
  // column offset. Find the last scheme anchor at or before the click —
  // a run like `https://a.com,https://b.com` has two, and clicking the
  // second should return the second URL, not the greedy match of both.
  // clickIdx保存`c - lo`，供后续判断或组装使用。
  const clickIdx = c - lo
  // schemeRe 命名 `/(?:https?|file):\/\//g`，让后续代码直接表达这个值的用途。
  const schemeRe = /(?:https?|file):\/\//g
  // urlStart 命名 `-1`，让后续代码直接表达这个值的用途。
  let urlStart = -1
  // urlEnd 命名 `token.length`，让后续代码直接表达这个值的用途。
  let urlEnd = token.length
  // 循环处理 `let m; (m = schemeRe.exec(token))`，让终端渲染把同类条目按顺序走完。
  for (let m; (m = schemeRe.exec(token)); ) {
    // 满足 `m.index > clickIdx` 时，终端渲染执行该分支。
    if (m.index > clickIdx) {
      // urlEnd更新为 `m.index`，确保Ink 渲染层后续读取最新状态。
      urlEnd = m.index
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break
    }
    // urlStart更新为 `m.index`，确保Ink 渲染层后续读取最新状态。
    urlStart = m.index
  }
  // 满足 `urlStart < 0` 时，终端渲染执行该分支。
  if (urlStart < 0) return undefined
  // URL格式化`token.slice`，供终端渲染后续处理使用。
  let url = token.slice(urlStart, urlEnd)

  // Strip trailing sentence punctuation. For closers () ] }, only strip
  // if unbalanced — `/wiki/Foo_(bar)` keeps `)`, `/arr[0]` keeps `]`.
  // OPENER 集中保存Ink 渲染层 selection要一起传递的字段。
  const OPENER: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  // while 使用 url.length > 0 完成终端渲染里的对应操作。
  while (url.length > 0) {
    // last保存`url.at`，供终端渲染后续处理使用。
    const last = url.at(-1)!
    // 满足 `'.,;:!?'.includes(last)` 时，终端渲染执行该分支。
    if ('.,;:!?'.includes(last)) {
      // URL更新为 `url.slice(0, -1)`，确保Ink 渲染层后续读取最新状态。
      url = url.slice(0, -1)
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // opener读取 `OPENER[last]` 对应条目，后续围绕该成员继续处理。
    const opener = OPENER[last]
    // opener缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!opener) break
    // opens 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let opens = 0
    // closes 集合保存`0`，供Ink 渲染层 selection后续判断或输出使用。
    let closes = 0
    // 按索引扫描 `url.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < url.length; i++) {
      // ch保存`url.charAt`，供终端渲染后续处理使用。
      const ch = url.charAt(i)
      // 满足 `ch === opener` 时，终端渲染执行该分支。
      if (ch === opener) opens++
      else if (ch === last) closes++
    }
    // 满足 `closes > opens) url = url.slice(0, -1` 时，终端渲染执行该分支。
    if (closes > opens) url = url.slice(0, -1)
    else break
  }

  // urlStart already guarantees click >= URL start; check right edge.
  // 满足 `clickIdx >= urlStart + url.length` 时，终端渲染执行该分支。
  if (clickIdx >= urlStart + url.length) return undefined

  // 返回 `url`，作为终端渲染这次计算的结果。
  return url
}

/**
 * Select the entire row. Sets isDragging=true and anchorSpan so a
 * subsequent drag extends the selection line-by-line. The anchor/focus
 * span from col 0 to width-1; getSelectedText handles noSelect skipping
 * and trailing-whitespace trimming so the copied text is just the visible
 * line content.
 */
// selectLineAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function selectLineAt(
  s: SelectionState,
  screen: Screen,
  row: number,
): void {
  // 只有 `row < 0 || row >= screen.height` 满足时，终端渲染才执行该分支。
  if (row < 0 || row >= screen.height) return
  // lo 集中保存Ink 渲染层 selection要一起传递的字段。
  const lo = { col: 0, row }
  // hi 集中保存Ink 渲染层 selection要一起传递的字段。
  const hi = { col: screen.width - 1, row }
  // anchor更新为 `lo`，确保Ink 渲染层后续读取最新状态。
  s.anchor = lo
  // focus 集合更新为 `hi`，确保Ink 渲染层后续读取最新状态。
  s.focus = hi
  // isDragging更新为 `true`，确保Ink 渲染层后续读取最新状态。
  s.isDragging = true
  // anchorSpan更新为 `{ lo, hi, kind: 'line' }`，确保Ink 渲染层后续读取最新状态。
  s.anchorSpan = { lo, hi, kind: 'line' }
}

/**
 * Extend a word/line-mode selection to the word/line at (col, row). The
 * anchor span (the original multi-clicked word/line) stays selected; the
 * selection grows from that span to the word/line at the current mouse
 * position. Word mode falls back to the raw cell when the mouse is over a
 * noSelect cell or out of bounds, so dragging into gutters still extends.
 */
// extendSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extendSelection(
  s: SelectionState,
  screen: Screen,
  col: number,
  row: number,
): void {
  // 只有 `!s.isDragging || !s.anchorSpan` 满足时，终端渲染才执行该分支。
  if (!s.isDragging || !s.anchorSpan) return
  // span 命名 `s.anchorSpan`，让后续代码直接表达这个值的用途。
  const span = s.anchorSpan
  // mLo 先占位，稍后的条件分支会根据实际输入补齐它。
  let mLo: Point
  // mHi 先占位，稍后的条件分支会根据实际输入补齐它。
  let mHi: Point
  // 当 `span.kind` 匹配 `'word'` 时，终端渲染执行对应分支。
  if (span.kind === 'word') {
    // b保存`wordBoundsAt`，供终端渲染后续处理使用。
    const b = wordBoundsAt(screen, col, row)
    // mLo更新为 `{ col: b ? b.lo : col, row }`，确保Ink 渲染层后续读取最新状态。
    mLo = { col: b ? b.lo : col, row }
    // mHi更新为 `{ col: b ? b.hi : col, row }`，确保Ink 渲染层后续读取最新状态。
    mHi = { col: b ? b.hi : col, row }
  } else {
    // r保存`clamp`，供终端渲染后续处理使用。
    const r = clamp(row, 0, screen.height - 1)
    // mLo更新为 `{ col: 0, row: r }`，确保Ink 渲染层后续读取最新状态。
    mLo = { col: 0, row: r }
    // mHi更新为 `{ col: screen.width - 1, row: r }`，确保Ink 渲染层后续读取最新状态。
    mHi = { col: screen.width - 1, row: r }
  }
  // 满足 `comparePoints(mHi, span.lo) < 0` 时，终端渲染执行该分支。
  if (comparePoints(mHi, span.lo) < 0) {
    // Mouse target ends before anchor span: extend backward.
    // anchor更新为 `span.hi`，确保Ink 渲染层后续读取最新状态。
    s.anchor = span.hi
    // focus 集合更新为 `mLo`，确保Ink 渲染层后续读取最新状态。
    s.focus = mLo
  // Ink 渲染层 selection在这里处理 `} else if (comparePoints(mLo, span.hi) > 0) {`，完成这一小步状态转换。
  } else if (comparePoints(mLo, span.hi) > 0) {
    // Mouse target starts after anchor span: extend forward.
    // anchor更新为 `span.lo`，确保Ink 渲染层后续读取最新状态。
    s.anchor = span.lo
    // focus 集合更新为 `mHi`，确保Ink 渲染层后续读取最新状态。
    s.focus = mHi
  } else {
    // Mouse overlaps the anchor span: just select the anchor span.
    // anchor更新为 `span.lo`，确保Ink 渲染层后续读取最新状态。
    s.anchor = span.lo
    // focus 集合更新为 `span.hi`，确保Ink 渲染层后续读取最新状态。
    s.focus = span.hi
  }
}

/** Semantic keyboard focus moves. See moveSelectionFocus in ink.tsx for
 *  how screen bounds + row-wrap are applied. */
// FocusMove 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FocusMove =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'lineStart'
  | 'lineEnd'

/**
 * Set focus to (col, row) for keyboard selection extension (shift+arrow).
 * Anchor stays fixed; selection grows or shrinks depending on where focus
 * moves relative to anchor. Drops to char mode (clears anchorSpan) —
 * native macOS does this too: shift+arrow after a double-click word-select
 * extends char-by-char from the word edge, not word-by-word. Scrolled-off
 * accumulators are preserved: keyboard-extending a drag-scrolled selection
 * keeps the off-screen rows. Caller supplies coords already clamped/wrapped.
 */
// moveFocus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function moveFocus(s: SelectionState, col: number, row: number): void {
  // s.focus 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!s.focus) return
  // anchorSpan更新为 `null`，确保Ink 渲染层后续读取最新状态。
  s.anchorSpan = null
  // focus 集合更新为 `{ col, row }`，确保Ink 渲染层后续读取最新状态。
  s.focus = { col, row }
  // Explicit user repositioning — any stale virtual focus (from a prior
  // shiftSelection clamp) no longer reflects intent. Anchor stays put so
  // virtualAnchorRow is still valid for its own round-trip.
  // virtualFocusRow更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualFocusRow = undefined
}

/**
 * Shift anchor AND focus by dRow, clamped to [minRow, maxRow]. Used for
 * keyboard scroll (PgUp/PgDn/ctrl+u/d/b/f): the whole selection must track
 * the content, unlike drag-to-scroll where focus stays at the mouse. Any
 * point that hits a clamp bound gets its col reset to the full-width edge —
 * its original content scrolled off-screen and was captured by
 * captureScrolledRows, so the col constraint was already consumed. Keeping
 * it would truncate the NEW content now at that screen row. Clamp col is 0
 * for dRow<0 (scrolling down, top leaves, 'above' semantics) or width-1 for
 * dRow>0 (scrolling up, bottom leaves, 'below' semantics).
 *
 * If both ends overshoot the SAME viewport edge (select text → Home/End/g/G
 * jumps far enough that both are out of view), clear — otherwise both clamp
 * to the same corner cell and a ghost 1-cell highlight lingers, and
 * getSelectedText returns one unrelated char from that corner. Symmetric
 * with shiftSelectionForFollow's top-edge check, but bidirectional: keyboard
 * scroll can jump either way.
 */
// shiftSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shiftSelection(
  s: SelectionState,
  dRow: number,
  minRow: number,
  maxRow: number,
  width: number,
): void {
  // 只有 `!s.anchor || !s.focus` 满足时，终端渲染才执行该分支。
  if (!s.anchor || !s.focus) return
  // Virtual rows track pre-clamp positions so reverse scrolls restore
  // correctly. Without this, clamp(5→0) + shift(+10) = 10, not the true 5,
  // and scrolledOffAbove stays stale (highlight ≠ copy).
  // vAnchor保存`(s.virtualAnchorRow ?? s.anchor.row) + dRow`，供后续判断或组装使用。
  const vAnchor = (s.virtualAnchorRow ?? s.anchor.row) + dRow
  // vFocus 集合保存`(s.virtualFocusRow ?? s.focus.row) + dRow`，供Ink 渲染层 selection后续判断或输出使用。
  const vFocus = (s.virtualFocusRow ?? s.focus.row) + dRow
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (vAnchor < minRow && vFocus < minRow) ||
    (vAnchor > maxRow && vFocus > maxRow)
  ) {
    // 调用 clearSelection，触发终端渲染此处需要的副作用。
    clearSelection(s)
    // Ink 渲染层 selection在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Debt = how far the nearer endpoint overshoots each edge. When debt
  // shrinks (reverse scroll), those rows are back on-screen — pop from
  // the accumulator so getSelectedText doesn't double-count them.
  // oldMin保存`Math.min`，供终端渲染后续处理使用。
  const oldMin = Math.min(
    s.virtualAnchorRow ?? s.anchor.row,
    s.virtualFocusRow ?? s.focus.row,
  )
  // oldMax保存`Math.max`，供终端渲染后续处理使用。
  const oldMax = Math.max(
    s.virtualAnchorRow ?? s.anchor.row,
    s.virtualFocusRow ?? s.focus.row,
  )
  // oldAboveDebt保存`Math.max`，供终端渲染后续处理使用。
  const oldAboveDebt = Math.max(0, minRow - oldMin)
  // oldBelowDebt保存`Math.max`，供终端渲染后续处理使用。
  const oldBelowDebt = Math.max(0, oldMax - maxRow)
  // newAboveDebt保存`Math.max`，供终端渲染后续处理使用。
  const newAboveDebt = Math.max(0, minRow - Math.min(vAnchor, vFocus))
  // newBelowDebt保存`Math.max`，供终端渲染后续处理使用。
  const newBelowDebt = Math.max(0, Math.max(vAnchor, vFocus) - maxRow)
  // 满足 `newAboveDebt < oldAboveDebt` 时，终端渲染执行该分支。
  if (newAboveDebt < oldAboveDebt) {
    // scrolledOffAbove pushes newest at the end (closest to on-screen).
    // drop保存`oldAboveDebt - newAboveDebt`，供后续判断或组装使用。
    const drop = oldAboveDebt - newAboveDebt
    // Ink 渲染层 selection在这里处理 `s.scrolledOffAbove.length -= drop`，完成这一小步状态转换。
    s.scrolledOffAbove.length -= drop
    // length 数量更新为 `s.scrolledOffAbove.length`，确保Ink 渲染层后续读取最新状态。
    s.scrolledOffAboveSW.length = s.scrolledOffAbove.length
  }
  // 满足 `newBelowDebt < oldBelowDebt` 时，终端渲染执行该分支。
  if (newBelowDebt < oldBelowDebt) {
    // scrolledOffBelow unshifts newest at the front (closest to on-screen).
    // drop保存`oldBelowDebt - newBelowDebt`，供Ink 渲染层 selection后续判断或输出使用。
    const drop = oldBelowDebt - newBelowDebt
    // 调用 s.scrolledOffBelow.splice，触发终端渲染此处需要的副作用。
    s.scrolledOffBelow.splice(0, drop)
    // 调用 s.scrolledOffBelowSW.splice，触发终端渲染此处需要的副作用。
    s.scrolledOffBelowSW.splice(0, drop)
  }
  // Invariant: accumulator length ≤ debt. If the accumulator exceeds debt,
  // the excess is stale — e.g., moveFocus cleared virtualFocusRow without
  // trimming the accumulator, orphaning entries the pop above can never
  // reach because oldDebt was ALREADY 0. Truncate to debt (keeping the
  // newest = closest-to-on-screen entries). Check newDebt (not oldDebt):
  // captureScrolledRows runs BEFORE this shift in the real flow (ink.tsx),
  // so at entry the accumulator is populated but oldDebt is still 0 —
  // that's the normal establish-debt path, not stale.
  // 满足 `s.scrolledOffAbove.length > newAboveDebt` 时，终端渲染执行该分支。
  if (s.scrolledOffAbove.length > newAboveDebt) {
    // Above pushes newest at END → keep END.
    // Ink 渲染层 selection在这里处理 `s.scrolledOffAbove =`，完成这一小步状态转换。
    s.scrolledOffAbove =
      newAboveDebt > 0 ? s.scrolledOffAbove.slice(-newAboveDebt) : []
    // Ink 渲染层 selection在这里处理 `s.scrolledOffAboveSW =`，完成这一小步状态转换。
    s.scrolledOffAboveSW =
      newAboveDebt > 0 ? s.scrolledOffAboveSW.slice(-newAboveDebt) : []
  }
  // 满足 `s.scrolledOffBelow.length > newBelowDebt` 时，终端渲染执行该分支。
  if (s.scrolledOffBelow.length > newBelowDebt) {
    // Below unshifts newest at FRONT → keep FRONT.
    // scrolledOffBelow更新为 `s.scrolledOffBelow.slice(0, newBelowDebt)`，确保Ink 渲染层后续读取最新状态。
    s.scrolledOffBelow = s.scrolledOffBelow.slice(0, newBelowDebt)
    // scrolledOffBelowSW更新为 `s.scrolledOffBelowSW.slice(0, newBelowDebt)`，确保Ink 渲染层后续读取最新状态。
    s.scrolledOffBelowSW = s.scrolledOffBelowSW.slice(0, newBelowDebt)
  }
  // Clamp col depends on which EDGE (not dRow direction): virtual tracking
  // means a top-clamped point can stay top-clamped during a dRow>0 reverse
  // shift — dRow-based clampCol would give it the bottom col.
  // shift封装成回调，供Ink 渲染层 selection在事件触发或异步步骤中调用。
  const shift = (p: Point, vRow: number): Point => {
    // 满足 `vRow < minRow` 时，终端渲染执行该分支。
    if (vRow < minRow) return { col: 0, row: minRow }
    // 满足 `vRow > maxRow` 时，终端渲染执行该分支。
    if (vRow > maxRow) return { col: width - 1, row: maxRow }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { col: p.col, row: vRow }
  }
  // anchor更新为 `shift(s.anchor, vAnchor)`，确保Ink 渲染层后续读取最新状态。
  s.anchor = shift(s.anchor, vAnchor)
  // focus 集合更新为 `shift(s.focus, vFocus)`，确保Ink 渲染层后续读取最新状态。
  s.focus = shift(s.focus, vFocus)
  // Ink 渲染层 selection在这里处理 `s.virtualAnchorRow =`，完成这一小步状态转换。
  s.virtualAnchorRow =
    vAnchor < minRow || vAnchor > maxRow ? vAnchor : undefined
  // virtualFocusRow更新为 `vFocus < minRow || vFocus > maxRow ? vFocus : undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualFocusRow = vFocus < minRow || vFocus > maxRow ? vFocus : undefined
  // anchorSpan not virtual-tracked: it's for word/line extend-on-drag,
  // irrelevant to the keyboard-scroll round-trip case.
  // 满足 `s.anchorSpan` 时，终端渲染执行该分支。
  if (s.anchorSpan) {
    // sp封装成回调，供Ink 渲染层 selection在事件触发或异步步骤中调用。
    const sp = (p: Point): Point => {
      // r 命名 `p.row + dRow`，让后续代码直接表达这个值的用途。
      const r = p.row + dRow
      // 满足 `r < minRow` 时，终端渲染执行该分支。
      if (r < minRow) return { col: 0, row: minRow }
      // 满足 `r > maxRow` 时，终端渲染执行该分支。
      if (r > maxRow) return { col: width - 1, row: maxRow }
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { col: p.col, row: r }
    }
    // anchorSpan更新为 `{`，确保Ink 渲染层后续读取最新状态。
    s.anchorSpan = {
      lo: sp(s.anchorSpan.lo),
      hi: sp(s.anchorSpan.hi),
      kind: s.anchorSpan.kind,
    }
  }
}

/**
 * Shift the anchor row by dRow, clamped to [minRow, maxRow]. Used during
 * drag-to-scroll: when the ScrollBox scrolls by N rows, the content that
 * was under the anchor is now at a different viewport row, so the anchor
 * must follow it. Focus is left unchanged (it stays at the mouse position).
 */
// shiftAnchor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shiftAnchor(
  s: SelectionState,
  dRow: number,
  minRow: number,
  maxRow: number,
): void {
  // s.anchor缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!s.anchor) return
  // Same virtual-row tracking as shiftSelection/shiftSelectionForFollow: the
  // drag→follow transition hands off to shiftSelectionForFollow, which reads
  // (virtualAnchorRow ?? anchor.row). Without this, drag-phase clamping
  // leaves virtual undefined → follow initializes from the already-clamped
  // row, under-counting total drift → shiftSelection's invariant-restore
  // prematurely clears valid drag-phase accumulator entries.
  // 原始文本保存`(s.virtualAnchorRow ?? s.anchor.row) + dRow`，供后续判断或组装使用。
  const raw = (s.virtualAnchorRow ?? s.anchor.row) + dRow
  // anchor更新为 `{ col: s.anchor.col, row: clamp(raw, minRow, maxRow) }`，确保Ink 渲染层后续读取最新状态。
  s.anchor = { col: s.anchor.col, row: clamp(raw, minRow, maxRow) }
  // virtualAnchorRow更新为 `raw < minRow || raw > maxRow ? raw : undefined`，确保Ink 渲染层后续读取最新状态。
  s.virtualAnchorRow = raw < minRow || raw > maxRow ? raw : undefined
  // anchorSpan not virtual-tracked (word/line extend, irrelevant to
  // keyboard-scroll round-trip) — plain clamp from current row.
  // 满足 `s.anchorSpan` 时，终端渲染执行该分支。
  if (s.anchorSpan) {
    // shift封装成回调，供Ink 渲染层 selection在事件触发或异步步骤中调用。
    const shift = (p: Point): Point => ({
      col: p.col,
      row: clamp(p.row + dRow, minRow, maxRow),
    })
    // anchorSpan更新为 `{`，确保Ink 渲染层后续读取最新状态。
    s.anchorSpan = {
      lo: shift(s.anchorSpan.lo),
      hi: shift(s.anchorSpan.hi),
      kind: s.anchorSpan.kind,
    }
  }
}

/**
 * Shift the whole selection (anchor + focus + anchorSpan) by dRow, clamped
 * to [minRow, maxRow]. Used when sticky/auto-follow scrolls the ScrollBox
 * while a selection is active — native terminal behavior is for the
 * highlight to walk up the screen with the text (not stay at the same
 * screen position).
 *
 * Differs from shiftAnchor: during drag-to-scroll, focus tracks the live
 * mouse position and only anchor follows the text. During streaming-follow,
 * the selection is text-anchored at both ends — both must move. The
 * isDragging check in ink.tsx picks which shift to apply.
 *
 * If both ends would shift strictly BELOW minRow (unclamped), the selected
 * text has scrolled entirely off the top. Clear it — otherwise a single
 * inverted cell lingers at the viewport top as a ghost (native terminals
 * drop the selection when it leaves scrollback). Landing AT minRow is
 * still valid: that cell holds the correct text. Returns true if the
 * selection was cleared so the caller can notify React-land subscribers
 * (useHasSelection) — the caller is inside onRender so it can't use
 * notifySelectionChange (recursion), must fire listeners directly.
 */
// shiftSelectionForFollow 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shiftSelectionForFollow(
  s: SelectionState,
  dRow: number,
  minRow: number,
  maxRow: number,
): boolean {
  // s.anchor缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!s.anchor) return false
  // Mirror shiftSelection: compute raw (unclamped) positions from virtual
  // if set, else current. This handles BOTH the update path (virtual already
  // set from a prior keyboard scroll) AND the initialize path (first clamp
  // happens HERE via follow-scroll, no prior keyboard scroll). Without the
  // initialize path, follow-scroll-first leaves virtual undefined even
  // though the clamp below occurred → a later PgUp computes debt from the
  // clamped row instead of the true pre-clamp row and never pops the
  // accumulator — getSelectedText double-counts the off-screen rows.
  // rawAnchor 命名 `(s.virtualAnchorRow ?? s.anchor.row) + dRow`，让后续代码直接表达这个值的用途。
  const rawAnchor = (s.virtualAnchorRow ?? s.anchor.row) + dRow
  // rawFocus 集合保存`s.focus`，供Ink 渲染层 selection后续判断或输出使用。
  const rawFocus = s.focus
    ? (s.virtualFocusRow ?? s.focus.row) + dRow
    : undefined
  // `rawAnchor < minRow && rawFocus` 与 `undefined && r` 不一致时刷新派生状态，避免使用过期结果。
  if (rawAnchor < minRow && rawFocus !== undefined && rawFocus < minRow) {
    // 调用 clearSelection，触发终端渲染此处需要的副作用。
    clearSelection(s)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Clamp from raw, not p.row+dRow — so a virtual position coming back
  // in-bounds lands at the TRUE position, not the stale clamped one.
  // anchor更新为 `{ col: s.anchor.col, row: clamp(rawAnchor, minRow, maxRow...`，确保Ink 渲染层后续读取最新状态。
  s.anchor = { col: s.anchor.col, row: clamp(rawAnchor, minRow, maxRow) }
  // `s.focus && rawFocus` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (s.focus && rawFocus !== undefined) {
    // focus 集合更新为 `{ col: s.focus.col, row: clamp(rawFocus, minRow, maxRow) }`，确保Ink 渲染层后续读取最新状态。
    s.focus = { col: s.focus.col, row: clamp(rawFocus, minRow, maxRow) }
  }
  // Ink 渲染层 selection在这里处理 `s.virtualAnchorRow =`，完成这一小步状态转换。
  s.virtualAnchorRow =
    rawAnchor < minRow || rawAnchor > maxRow ? rawAnchor : undefined
  // Ink 渲染层 selection在这里处理 `s.virtualFocusRow =`，完成这一小步状态转换。
  s.virtualFocusRow =
    rawFocus !== undefined && (rawFocus < minRow || rawFocus > maxRow)
      ? rawFocus
      : undefined
  // anchorSpan not virtual-tracked (word/line extend, irrelevant to
  // keyboard-scroll round-trip) — plain clamp from current row.
  // 满足 `s.anchorSpan` 时，终端渲染执行该分支。
  if (s.anchorSpan) {
    // shift封装成回调，供Ink 渲染层 selection在事件触发或异步步骤中调用。
    const shift = (p: Point): Point => ({
      col: p.col,
      row: clamp(p.row + dRow, minRow, maxRow),
    })
    // anchorSpan更新为 `{`，确保Ink 渲染层后续读取最新状态。
    s.anchorSpan = {
      lo: shift(s.anchorSpan.lo),
      hi: shift(s.anchorSpan.hi),
      kind: s.anchorSpan.kind,
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// hasSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasSelection(s: SelectionState): boolean {
  // 返回 `s.anchor !== null && s.focus !== null`，作为终端渲染这次计算的结果。
  return s.anchor !== null && s.focus !== null
}

/**
 * Normalized selection bounds: start is always before end in reading order.
 * Returns null if no active selection.
 */
// selectionBounds 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function selectionBounds(s: SelectionState): {
  start: { col: number; row: number }
  end: { col: number; row: number }
} | null {
  // 只有 `!s.anchor || !s.focus` 满足时，终端渲染才执行该分支。
  if (!s.anchor || !s.focus) return null
  // 返回 `comparePoints(s.anchor, s.focus) <= 0`，作为终端渲染这次计算的结果。
  return comparePoints(s.anchor, s.focus) <= 0
    ? { start: s.anchor, end: s.focus }
    : { start: s.focus, end: s.anchor }
}

/**
 * Check if a cell at (col, row) is within the current selection range.
 * Used by the renderer to apply inverse style.
 */
// isCellSelected 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCellSelected(
  s: SelectionState,
  col: number,
  row: number,
): boolean {
  // b保存`selectionBounds`，供终端渲染后续处理使用。
  const b = selectionBounds(s)
  // b缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!b) return false
  // 从 `b` 解构 start、end，减少Ink 渲染层 selection对同一对象的重复访问。
  const { start, end } = b
  // 只有 `row < start.row || row > end.row` 满足时，终端渲染才执行该分支。
  if (row < start.row || row > end.row) return false
  // 只有 `row === start.row && col < start.col` 满足时，终端渲染才执行该分支。
  if (row === start.row && col < start.col) return false
  // 只有 `row === end.row && col > end.col` 满足时，终端渲染才执行该分支。
  if (row === end.row && col > end.col) return false
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/** Extract text from one screen row. When the next row is a soft-wrap
 *  continuation (screen.softWrap[row+1]>0), clamp to that content-end
 *  column and skip the trailing trim so the word-separator space survives
 *  the join. See Screen.softWrap for why the clamp is necessary. */
// extractRowText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractRowText(
  screen: Screen,
  row: number,
  colStart: number,
  colEnd: number,
): string {
  // noSelect保存`screen.noSelect`，供后续判断或组装使用。
  const noSelect = screen.noSelect
  // rowOff保存`row * screen.width`，供Ink 渲染层 selection后续判断或输出使用。
  const rowOff = row * screen.width
  // contentEnd 命名 `row + 1 < screen.height ? screen.softWrap[row + 1]! : 0`，让后续代码直接表达这个值的用途。
  const contentEnd = row + 1 < screen.height ? screen.softWrap[row + 1]! : 0
  // lastCol保存`Math.min`，供终端渲染后续处理使用。
  const lastCol = contentEnd > 0 ? Math.min(colEnd, contentEnd - 1) : colEnd
  // line保存`''`，作为后续固定文本处理的输入。
  let line = ''
  // 循环处理 `let col = colStart; col <= lastCol; col++`，让终端渲染逐项把同类条目按顺序走完。
  for (let col = colStart; col <= lastCol; col++) {
    // Skip cells marked noSelect (gutters, line numbers, diff sigils).
    // Check before cellAt to avoid the decode cost for excluded cells.
    // 满足 `noSelect[rowOff + col] === 1` 时，终端渲染执行该分支。
    if (noSelect[rowOff + col] === 1) continue
    // cell保存`cellAt`，供终端渲染后续处理使用。
    const cell = cellAt(screen, col, row)
    // cell缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!cell) continue
    // Skip spacer tails (second half of wide chars) — the head already
    // contains the full grapheme. SpacerHead is a blank at line-end.
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      cell.width === CellWidth.SpacerTail ||
      cell.width === CellWidth.SpacerHead
    ) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // Ink 渲染层 selection在这里处理 `line += cell.char`，完成这一小步状态转换。
    line += cell.char
  }
  // 返回 `contentEnd > 0 ? line : line.replace(/\s+$/, '')`，作为终端渲染这次计算的结果。
  return contentEnd > 0 ? line : line.replace(/\s+$/, '')
}

/** Accumulator for selected text that merges soft-wrapped rows back
 *  into logical lines. push(text, sw) appends a newline before text
 *  only when sw=false (i.e. the row starts a new logical line). Rows
 *  with sw=true are concatenated onto the previous row. */
// joinRows 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function joinRows(
  lines: string[],
  text: string,
  sw: boolean | undefined,
): void {
  // 只有 `sw && lines.length > 0` 满足时，终端渲染才执行该分支。
  if (sw && lines.length > 0) {
    // Ink 渲染层 selection在这里处理 `lines[lines.length - 1] += text`，完成这一小步状态转换。
    lines[lines.length - 1] += text
  } else {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(text)
  }
}

/**
 * Extract text from the screen buffer within the selection range.
 * Rows are joined with newlines unless the screen's softWrap bitmap
 * marks a row as a word-wrap continuation — those rows are concatenated
 * onto the previous row so the copied text matches the logical source
 * line, not the visual wrapped layout. Trailing whitespace on the last
 * fragment of each logical line is trimmed. Wide-char spacer cells are
 * skipped. Rows that scrolled out of the viewport during drag-to-scroll
 * are joined back in from the scrolledOffAbove/Below accumulators along
 * with their captured softWrap bits.
 */
// getSelectedText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSelectedText(s: SelectionState, screen: Screen): string {
  // b保存`selectionBounds`，供终端渲染后续处理使用。
  const b = selectionBounds(s)
  // b缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!b) return ''
  // 从 `b` 解构 start、end，减少Ink 渲染层 selection对同一对象的重复访问。
  const { start, end } = b
  // sw保存`screen.softWrap`，供后续判断或组装使用。
  const sw = screen.softWrap
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []

  // 按索引扫描 `s.scrolledOffAbove.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < s.scrolledOffAbove.length; i++) {
    // 调用 joinRows，触发终端渲染此处需要的副作用。
    joinRows(lines, s.scrolledOffAbove[i]!, s.scrolledOffAboveSW[i])
  }

  // 循环处理 `let row = start.row; row <= end.row; row++`，让终端渲染逐项把同类条目按顺序走完。
  for (let row = start.row; row <= end.row; row++) {
    // rowStart标记Ink 渲染层 selection是否启用对应路径。
    const rowStart = row === start.row ? start.col : 0
    // rowEnd标记Ink 渲染层 selection是否启用对应路径。
    const rowEnd = row === end.row ? end.col : screen.width - 1
    // 调用 joinRows，触发终端渲染此处需要的副作用。
    joinRows(lines, extractRowText(screen, row, rowStart, rowEnd), sw[row]! > 0)
  }

  // 按索引扫描 `s.scrolledOffBelow.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < s.scrolledOffBelow.length; i++) {
    // 调用 joinRows，触发终端渲染此处需要的副作用。
    joinRows(lines, s.scrolledOffBelow[i]!, s.scrolledOffBelowSW[i])
  }

  // 返回 `lines.join('\n')`，作为终端渲染这次计算的结果。
  return lines.join('\n')
}

/**
 * Capture text from rows about to scroll out of the viewport during
 * drag-to-scroll, BEFORE scrollBy overwrites them. Only the rows that
 * intersect the selection are captured, using the selection's col bounds
 * for the anchor-side boundary row. After capturing the anchor row, the
 * anchor.col AND anchorSpan cols are reset to the full-width boundary so
 * subsequent captures and the final getSelectedText don't re-apply a stale
 * col constraint to content that's no longer under the original anchor.
 * Both span cols are reset (not just the near side): after a blocked
 * reversal the drag can flip direction, and extendSelection then reads the
 * OPPOSITE span side — which would otherwise still hold the original word
 * boundary and truncate one subsequently-captured row.
 *
 * side='above': rows scrolling out the top (dragging down, anchor=start).
 * side='below': rows scrolling out the bottom (dragging up, anchor=end).
 */
// captureScrolledRows 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function captureScrolledRows(
  s: SelectionState,
  screen: Screen,
  firstRow: number,
  lastRow: number,
  side: 'above' | 'below',
): void {
  // b保存`selectionBounds`，供终端渲染后续处理使用。
  const b = selectionBounds(s)
  // 只有 `!b || firstRow > lastRow` 满足时，终端渲染才执行该分支。
  if (!b || firstRow > lastRow) return
  // 从 `b` 解构 start、end，减少Ink 渲染层 selection对同一对象的重复访问。
  const { start, end } = b
  // Intersect [firstRow, lastRow] with [start.row, end.row]. Rows outside
  // the selection aren't captured — they weren't selected.
  // lo保存`Math.max`，供终端渲染后续处理使用。
  const lo = Math.max(firstRow, start.row)
  // hi保存`Math.min`，供终端渲染后续处理使用。
  const hi = Math.min(lastRow, end.row)
  // 满足 `lo > hi` 时，终端渲染执行该分支。
  if (lo > hi) return

  // width保存`screen.width`，供后续判断或组装使用。
  const width = screen.width
  // sw保存`screen.softWrap`，供后续判断或组装使用。
  const sw = screen.softWrap
  // captured 从空数组开始收集，后续循环会按处理顺序追加条目。
  const captured: string[] = []
  // capturedSW 从空数组开始收集，后续循环会按处理顺序追加条目。
  const capturedSW: boolean[] = []
  // 循环处理 `let row = lo; row <= hi; row++`，让终端渲染逐项把同类条目按顺序走完。
  for (let row = lo; row <= hi; row++) {
    // colStart标记Ink 渲染层 selection是否启用对应路径。
    const colStart = row === start.row ? start.col : 0
    // colEnd标记Ink 渲染层 selection是否启用对应路径。
    const colEnd = row === end.row ? end.col : width - 1
    // captured追加新条目，保持收集顺序与输入顺序一致。
    captured.push(extractRowText(screen, row, colStart, colEnd))
    // capturedSW追加新条目，保持收集顺序与输入顺序一致。
    capturedSW.push(sw[row]! > 0)
  }

  // 当 `side` 匹配 `'above'` 时，终端渲染执行对应分支。
  if (side === 'above') {
    // Newest rows go at the bottom of the above-accumulator (closest to
    // the on-screen content in reading order).
    // scrolledOffAbove追加新条目，保持收集顺序与输入顺序一致。
    s.scrolledOffAbove.push(...captured)
    // scrolledOffAboveSW追加新条目，保持收集顺序与输入顺序一致。
    s.scrolledOffAboveSW.push(...capturedSW)
    // We just captured the top of the selection. The anchor (=start when
    // dragging down) is now pointing at content that will scroll out; its
    // col constraint was applied to the captured row. Reset to col 0 so
    // the NEXT tick and the final getSelectedText read the full row.
    // 只有 `s.anchor && s.anchor.row === start.row && lo ===` 满足时，终端渲染才执行该分支。
    if (s.anchor && s.anchor.row === start.row && lo === start.row) {
      // anchor更新为 `{ col: 0, row: s.anchor.row }`，确保Ink 渲染层后续读取最新状态。
      s.anchor = { col: 0, row: s.anchor.row }
      // 满足 `s.anchorSpan` 时，终端渲染执行该分支。
      if (s.anchorSpan) {
        // anchorSpan更新为 `{`，确保Ink 渲染层后续读取最新状态。
        s.anchorSpan = {
          kind: s.anchorSpan.kind,
          lo: { col: 0, row: s.anchorSpan.lo.row },
          hi: { col: width - 1, row: s.anchorSpan.hi.row },
        }
      }
    }
  } else {
    // Newest rows go at the TOP of the below-accumulator — they're
    // closest to the on-screen content.
    // 调用 s.scrolledOffBelow.unshift，触发终端渲染此处需要的副作用。
    s.scrolledOffBelow.unshift(...captured)
    // 调用 s.scrolledOffBelowSW.unshift，触发终端渲染此处需要的副作用。
    s.scrolledOffBelowSW.unshift(...capturedSW)
    // 只有 `s.anchor && s.anchor.row === end.row && hi === en` 满足时，终端渲染才执行该分支。
    if (s.anchor && s.anchor.row === end.row && hi === end.row) {
      // anchor更新为 `{ col: width - 1, row: s.anchor.row }`，确保Ink 渲染层后续读取最新状态。
      s.anchor = { col: width - 1, row: s.anchor.row }
      // 满足 `s.anchorSpan` 时，终端渲染执行该分支。
      if (s.anchorSpan) {
        // anchorSpan更新为 `{`，确保Ink 渲染层后续读取最新状态。
        s.anchorSpan = {
          kind: s.anchorSpan.kind,
          lo: { col: 0, row: s.anchorSpan.lo.row },
          hi: { col: width - 1, row: s.anchorSpan.hi.row },
        }
      }
    }
  }
}

/**
 * Apply the selection overlay directly to the screen buffer by changing
 * the style of every cell in the selection range. Called after the
 * renderer produces the Frame but before the diff — the normal diffEach
 * then picks up the restyled cells as ordinary changes, so LogUpdate
 * stays a pure diff engine with no selection awareness.
 *
 * Uses a SOLID selection background (theme-provided via StylePool.
 * setSelectionBg) that REPLACES each cell's bg while PRESERVING its fg —
 * matches native terminal selection. Previously SGR-7 inverse (swapped
 * fg/bg per cell), which fragmented badly over syntax-highlighted text:
 * every distinct fg color became a different bg stripe.
 *
 * Uses StylePool caches so on drag the only work per cell is a Map
 * lookup + packed-int write.
 */
// applySelectionOverlay 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySelectionOverlay(
  screen: Screen,
  selection: SelectionState,
  stylePool: StylePool,
): void {
  // b保存`selectionBounds`，供终端渲染后续处理使用。
  const b = selectionBounds(selection)
  // b缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!b) return
  // 从 `b` 解构 start、end，减少Ink 渲染层 selection对同一对象的重复访问。
  const { start, end } = b
  // width保存`screen.width`，供后续判断或组装使用。
  const width = screen.width
  // noSelect保存`screen.noSelect`，供后续判断或组装使用。
  const noSelect = screen.noSelect
  // 循环处理 `let row = start.row; row <= end.row && row < scre`，让终端渲染逐项把同类条目按顺序走完。
  for (let row = start.row; row <= end.row && row < screen.height; row++) {
    // colStart标记Ink 渲染层 selection是否启用对应路径。
    const colStart = row === start.row ? start.col : 0
    // colEnd保存`Math.min`，供终端渲染后续处理使用。
    const colEnd = row === end.row ? Math.min(end.col, width - 1) : width - 1
    // rowOff保存`row * width`，供Ink 渲染层 selection后续判断或输出使用。
    const rowOff = row * width
    // 循环处理 `let col = colStart; col <= colEnd; col++`，让终端渲染逐项把同类条目按顺序走完。
    for (let col = colStart; col <= colEnd; col++) {
      // idx 命名 `rowOff + col`，让后续代码直接表达这个值的用途。
      const idx = rowOff + col
      // Skip noSelect cells — gutters stay visually unchanged so it's
      // clear they're not part of the copy. Surrounding selectable cells
      // still highlight so the selection extent remains visible.
      // 满足 `noSelect[idx] === 1` 时，终端渲染执行该分支。
      if (noSelect[idx] === 1) continue
      // cell保存`cellAtIndex`，供终端渲染后续处理使用。
      const cell = cellAtIndex(screen, idx)
      // setCellStyleId 写入新的状态值，使终端渲染后续读取保持一致。
      setCellStyleId(screen, col, row, stylePool.withSelectionBg(cell.styleId))
    }
  }
}
