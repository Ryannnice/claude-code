// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnsiCode,
  ansiCodesToString,
  diffAnsiCodes,
} from '@alcalzone/ansi-tokenize'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type Point,
  type Rectangle,
  type Size,
  unionRect,
} from './layout/geometry.js'
// 引入 BEL、ESC、SEP，将 ./termio/ansi.js 中已经封装好的能力接到本文件流程里。
import { BEL, ESC, SEP } from './termio/ansi.js'
// 引入 * as warn，将 ./warn.js 中已经封装好的能力接到本文件流程里。
import * as warn from './warn.js'

// --- Shared Pools (interning for memory efficiency) ---

// Character string pool shared across all screens.
// With a shared pool, interned char IDs are valid across screens,
// so blitRegion can copy IDs directly (no re-interning) and
// diffEach can compare IDs as integers (no string lookup).
// CharPool 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class CharPool {
  private strings: string[] = [' ', ''] // Index 0 = space, 1 = empty (spacer)
  private stringMap = new Map<string, number>([
    [' ', 0],
    ['', 1],
  ])
  private ascii: Int32Array = initCharAscii() // charCode → index, -1 = not interned

  // intern 使用 char: string 完成终端渲染里的对应操作。
  intern(char: string): number {
    // ASCII fast-path: direct array lookup instead of Map.get
    // 满足 `char.length === 1` 时，终端渲染执行该分支。
    if (char.length === 1) {
      // code保存`char.charCodeAt`，供终端渲染后续处理使用。
      const code = char.charCodeAt(0)
      // 满足 `code < 128` 时，终端渲染执行该分支。
      if (code < 128) {
        // cached 缓存读取 `this.ascii[code]!` 对应条目，后续围绕该成员继续处理。
        const cached = this.ascii[code]!
        // `cached` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
        if (cached !== -1) return cached
        // index 索引保存 `this.strings.length` 的判断结果，供Ink 渲染层 screen后续分支直接复用。
        const index = this.strings.length
        // strings 集合追加新条目，保持收集顺序与输入顺序一致。
        this.strings.push(char)
        // ascii[code更新为 `index`，确保Ink 渲染层 screen后续读取最新状态。
        this.ascii[code] = index
        // 返回 `index`，作为终端渲染这次计算的结果。
        return index
      }
    }
    // existing读取`stringMap.get`，供终端渲染后续处理使用。
    const existing = this.stringMap.get(char)
    // `existing` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (existing !== undefined) return existing
    // index 索引保存 `this.strings.length` 的判断结果，供Ink 渲染层 screen后续分支直接复用。
    const index = this.strings.length
    // strings 集合追加新条目，保持收集顺序与输入顺序一致。
    this.strings.push(char)
    // this.stringMap.set 写入新的状态值，使终端渲染后续读取保持一致。
    this.stringMap.set(char, index)
    // 返回 `index`，作为终端渲染这次计算的结果。
    return index
  }

  // get 根据 index: number 读取或计算终端渲染需要的结果。
  get(index: number): string {
    // 返回 `this.strings[index] ?? ' '`，作为终端渲染这次计算的结果。
    return this.strings[index] ?? ' '
  }
}

// Hyperlink string pool shared across all screens.
// Index 0 = no hyperlink.
// HyperlinkPool 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class HyperlinkPool {
  private strings: string[] = [''] // Index 0 = no hyperlink
  private stringMap = new Map<string, number>()

  // intern 使用 hyperlink: string | undefined 完成终端渲染里的对应操作。
  intern(hyperlink: string | undefined): number {
    // hyperlink缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!hyperlink) return 0
    // 标识符读取`stringMap.get`，供终端渲染后续处理使用。
    let id = this.stringMap.get(hyperlink)
    // 满足 `id === undefined` 时，终端渲染执行该分支。
    if (id === undefined) {
      // 标识符更新为 `this.strings.length`，确保Ink 渲染层后续读取最新状态。
      id = this.strings.length
      // strings 集合追加新条目，保持收集顺序与输入顺序一致。
      this.strings.push(hyperlink)
      // this.stringMap.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.stringMap.set(hyperlink, id)
    }
    // 返回 `id`，作为终端渲染这次计算的结果。
    return id
  }

  // get 根据 id: number 读取或计算终端渲染需要的结果。
  get(id: number): string | undefined {
    // 返回 `id === 0 ? undefined : this.strings[id]`，作为终端渲染这次计算的结果。
    return id === 0 ? undefined : this.strings[id]
  }
}

// SGR 7 (inverse) as an AnsiCode. endCode '\x1b[27m' flags VISIBLE_ON_SPACE
// so bit 0 of the resulting styleId is set → renderer won't skip inverted
// spaces as invisible.
// INVERSE_CODE 集中保存Ink 渲染层 screen要一起传递的字段。
const INVERSE_CODE: AnsiCode = {
  type: 'ansi',
  code: '\x1b[7m',
  endCode: '\x1b[27m',
}
// Bold (SGR 1) — stacks cleanly, no reflow in monospace. endCode 22
// also cancels dim (SGR 2); harmless here since we never add dim.
// BOLD_CODE 集中保存Ink 渲染层 screen要一起传递的字段。
const BOLD_CODE: AnsiCode = {
  type: 'ansi',
  code: '\x1b[1m',
  endCode: '\x1b[22m',
}
// Underline (SGR 4). Kept alongside yellow+bold — the underline is the
// unambiguous visible-on-any-theme marker. Yellow-bg-via-inverse can
// clash with existing bg colors (user-prompt style, tool chrome, syntax
// bg). If you see underline but no yellow, the yellow is being lost in
// the existing cell styling — the overlay IS finding the match.
// UNDERLINE_CODE 集中保存Ink 渲染层 screen要一起传递的字段。
const UNDERLINE_CODE: AnsiCode = {
  type: 'ansi',
  code: '\x1b[4m',
  endCode: '\x1b[24m',
}
// fg→yellow (SGR 33). With inverse already in the stack, the terminal
// swaps fg↔bg at render — so yellow-fg becomes yellow-BG. Original bg
// becomes fg (readable on most themes: dark-bg → dark-text on yellow).
// endCode 39 is 'default fg' — cancels any prior fg color cleanly.
// YELLOW_FG_CODE 集中保存Ink 渲染层 screen要一起传递的字段。
const YELLOW_FG_CODE: AnsiCode = {
  type: 'ansi',
  code: '\x1b[33m',
  endCode: '\x1b[39m',
}

// StylePool 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class StylePool {
  private ids = new Map<string, number>()
  private styles: AnsiCode[][] = []
  private transitionCache = new Map<number, string>()
  readonly none: number

  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 更新实例字段 none 为 this.intern([])，同步终端渲染的内部状态。
    this.none = this.intern([])
  }

  /**
   * Intern a style and return its ID. Bit 0 of the ID encodes whether the
   * style has a visible effect on space characters (background, inverse,
   * underline, etc.). Foreground-only styles get even IDs; styles visible
   * on spaces get odd IDs. This lets the renderer skip invisible spaces
   * with a single bitmask check on the packed word.
   */
  // intern 使用 styles: AnsiCode[] 完成终端渲染里的对应操作。
  intern(styles: AnsiCode[]): number {
    // 按键派生`styles.map`，供终端渲染后续处理使用。
    const key = styles.length === 0 ? '' : styles.map(s => s.code).join('\0')
    // 标识符读取`ids.get`，供终端渲染后续处理使用。
    let id = this.ids.get(key)
    // 满足 `id === undefined` 时，终端渲染执行该分支。
    if (id === undefined) {
      // rawId 命名 `this.styles.length`，让后续代码直接表达这个值的用途。
      const rawId = this.styles.length
      // styles 集合追加新条目，保持收集顺序与输入顺序一致。
      this.styles.push(styles.length === 0 ? [] : styles)
      // Ink 渲染层 screen在这里处理 `id =`，完成这一小步状态转换。
      id =
        (rawId << 1) |
        (styles.length > 0 && hasVisibleSpaceEffect(styles) ? 1 : 0)
      // this.ids.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.ids.set(key, id)
    }
    // 返回 `id`，作为终端渲染这次计算的结果。
    return id
  }

  /** Recover styles from an encoded ID. Strips the bit-0 flag via >>> 1. */
  // get 根据 id: number 读取或计算终端渲染需要的结果。
  get(id: number): AnsiCode[] {
    // 返回 `this.styles[id >>> 1] ?? []`，作为终端渲染这次计算的结果。
    return this.styles[id >>> 1] ?? []
  }

  /**
   * Returns the pre-serialized ANSI string to transition from one style to
   * another. Cached by (fromId, toId) — zero allocations after first call
   * for a given pair.
   */
  // transition 使用 fromId: number, toId: number 完成终端渲染里的对应操作。
  transition(fromId: number, toId: number): string {
    // 满足 `fromId === toId` 时，终端渲染执行该分支。
    if (fromId === toId) return ''
    // key保存`fromId * 0x100000 + toId`，供Ink 渲染层 screen后续判断或输出使用。
    const key = fromId * 0x100000 + toId
    // str读取`transitionCache.get`，供终端渲染后续处理使用。
    let str = this.transitionCache.get(key)
    // 满足 `str === undefined` 时，终端渲染执行该分支。
    if (str === undefined) {
      // str更新为 `ansiCodesToString(diffAnsiCodes(this.get(fromId), this.ge...`，确保Ink 渲染层后续读取最新状态。
      str = ansiCodesToString(diffAnsiCodes(this.get(fromId), this.get(toId)))
      // this.transitionCache.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.transitionCache.set(key, str)
    }
    // 返回 `str`，作为终端渲染这次计算的结果。
    return str
  }

  /**
   * Intern a style that is `base + inverse`. Cached by base ID so
   * repeated calls for the same underlying style don't re-scan the
   * AnsiCode[] array. Used by the selection overlay.
   */
  private inverseCache = new Map<number, number>()
  // withInverse 使用 baseId: number 完成终端渲染里的对应操作。
  withInverse(baseId: number): number {
    // 标识符读取`inverseCache.get`，供终端渲染后续处理使用。
    let id = this.inverseCache.get(baseId)
    // 满足 `id === undefined` 时，终端渲染执行该分支。
    if (id === undefined) {
      // baseCodes 集合读取`this.get`，供终端渲染后续处理使用。
      const baseCodes = this.get(baseId)
      // If already inverted, use as-is (avoids SGR 7 stacking)
      // hasInverse记录 `baseCodes.some` 是否成立，终端渲染随后按该结果分支。
      const hasInverse = baseCodes.some(c => c.endCode === '\x1b[27m')
      // 标识符更新为 `hasInverse ? baseId : this.intern([...baseCodes, INVERSE_...`，确保Ink 渲染层后续读取最新状态。
      id = hasInverse ? baseId : this.intern([...baseCodes, INVERSE_CODE])
      // this.inverseCache.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.inverseCache.set(baseId, id)
    }
    // 返回 `id`，作为终端渲染这次计算的结果。
    return id
  }

  /** Inverse + bold + yellow-bg-via-fg-swap for the CURRENT search match.
   *  OTHER matches are plain inverse — bg inherits from the theme. Current
   *  gets a distinct yellow bg (via fg-then-inverse swap) plus bold weight
   *  so it stands out in a sea of inverse. Underline was too subtle. Zero
   *  reflow risk: all pure SGR overlays, per-cell, post-layout. The yellow
   *  overrides any existing fg (syntax highlighting) on those cells — fine,
   *  the "you are here" signal IS the point, syntax color can yield. */
  private currentMatchCache = new Map<number, number>()
  // withCurrentMatch 使用 baseId: number 完成终端渲染里的对应操作。
  withCurrentMatch(baseId: number): number {
    // 标识符读取`currentMatchCache.get`，供终端渲染后续处理使用。
    let id = this.currentMatchCache.get(baseId)
    // 满足 `id === undefined` 时，终端渲染执行该分支。
    if (id === undefined) {
      // baseCodes 集合读取`this.get`，供终端渲染后续处理使用。
      const baseCodes = this.get(baseId)
      // Filter BOTH fg + bg so yellow-via-inverse is unambiguous.
      // User-prompt cells have an explicit bg (grey box); with that bg
      // still set, inverse swaps yellow-fg↔grey-bg → grey-on-yellow on
      // SOME terminals, yellow-on-grey on others (inverse semantics vary
      // when both colors are explicit). Filtering both gives clean
      // yellow-bg + terminal-default-fg everywhere. Bold/dim/italic
      // coexist — keep those.
      // codes 集合筛选`baseCodes.filter`，供终端渲染后续处理使用。
      const codes = baseCodes.filter(
        // c更新为 `> c.endCode !== '\x1b[39m' && c.endCode !== '\x1b[49m'`，确保Ink 渲染层后续读取最新状态。
        c => c.endCode !== '\x1b[39m' && c.endCode !== '\x1b[49m',
      )
      // fg-yellow FIRST so inverse swaps it to bg. Bold after inverse is
      // fine — SGR 1 is fg-attribute-only, order-independent vs 7.
      // codes 集合追加新条目，保持收集顺序与输入顺序一致。
      codes.push(YELLOW_FG_CODE)
      // 满足 `!baseCodes.some(c => c.endCode === '\x1b[27m')` 时，终端渲染执行该分支。
      if (!baseCodes.some(c => c.endCode === '\x1b[27m'))
        // codes 集合追加新条目，保持收集顺序与输入顺序一致。
        codes.push(INVERSE_CODE)
      // 满足 `!baseCodes.some(c => c.endCode === '\x1b[22m')) codes.push(BOLD_CODE` 时，终端渲染执行该分支。
      if (!baseCodes.some(c => c.endCode === '\x1b[22m')) codes.push(BOLD_CODE)
      // Underline as the unambiguous marker — yellow-bg can clash with
      // existing bg styling (user-prompt bg, syntax bg). If you see
      // underline but no yellow on a match, the overlay IS finding it;
      // the yellow is just losing a styling fight.
      // 满足 `!baseCodes.some(c => c.endCode === '\x1b[24m')` 时，终端渲染执行该分支。
      if (!baseCodes.some(c => c.endCode === '\x1b[24m'))
        // codes 集合追加新条目，保持收集顺序与输入顺序一致。
        codes.push(UNDERLINE_CODE)
      // 标识符更新为 `this.intern(codes)`，确保Ink 渲染层后续读取最新状态。
      id = this.intern(codes)
      // this.currentMatchCache.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.currentMatchCache.set(baseId, id)
    }
    // 返回 `id`，作为终端渲染这次计算的结果。
    return id
  }

  /**
   * Selection overlay: REPLACE the cell's background with a solid color
   * while preserving its foreground (color, bold, italic, dim, underline).
   * Matches native terminal selection — a dedicated bg color, not SGR-7
   * inverse. Inverse swaps fg/bg per-cell, which fragments visually over
   * syntax-highlighted text (every fg color becomes a different bg stripe).
   *
   * Strips any existing bg (endCode 49m — REPLACES, so diff-added green
   * etc. don't bleed through) and any existing inverse (endCode 27m —
   * inverse on top of a solid bg would re-swap and look wrong).
   *
   * bg is set via setSelectionBg(); null → fallback to withInverse() so the
   * overlay still works before theme wiring sets a color (tests, first frame).
   * Cache is keyed by baseId only — setSelectionBg() clears it on change.
   */
  private selectionBgCode: AnsiCode | null = null
  private selectionBgCache = new Map<number, number>()
  // setSelectionBg 根据 bg: AnsiCode | null 更新终端渲染的状态。
  setSelectionBg(bg: AnsiCode | null): void {
    // 满足 `this.selectionBgCode?.code === bg?.code` 时，终端渲染执行该分支。
    if (this.selectionBgCode?.code === bg?.code) return
    // 更新实例字段 selectionBgCode 为 bg，同步终端渲染的内部状态。
    this.selectionBgCode = bg
    // 调用 this.selectionBgCache.clear，触发终端渲染此处需要的副作用。
    this.selectionBgCache.clear()
  }
  // withSelectionBg 使用 baseId: number 完成终端渲染里的对应操作。
  withSelectionBg(baseId: number): number {
    // bg保存`this.selectionBgCode`，供Ink 渲染层 screen后续判断或输出使用。
    const bg = this.selectionBgCode
    // 满足 `bg === null) return this.withInverse(baseId` 时，终端渲染执行该分支。
    if (bg === null) return this.withInverse(baseId)
    // 标识符读取`selectionBgCache.get`，供终端渲染后续处理使用。
    let id = this.selectionBgCache.get(baseId)
    // 满足 `id === undefined` 时，终端渲染执行该分支。
    if (id === undefined) {
      // Keep everything except bg (49m) and inverse (27m). Fg, bold, dim,
      // italic, underline, strikethrough all preserved.
      // kept读取`this.get`，供终端渲染后续处理使用。
      const kept = this.get(baseId).filter(
        // c更新为 `> c.endCode !== '\x1b[49m' && c.endCode !== '\x1b[27m'`，确保Ink 渲染层后续读取最新状态。
        c => c.endCode !== '\x1b[49m' && c.endCode !== '\x1b[27m',
      )
      // kept追加新条目，保持收集顺序与输入顺序一致。
      kept.push(bg)
      // 标识符更新为 `this.intern(kept)`，确保Ink 渲染层后续读取最新状态。
      id = this.intern(kept)
      // this.selectionBgCache.set 写入新的状态值，使终端渲染后续读取保持一致。
      this.selectionBgCache.set(baseId, id)
    }
    // 返回 `id`，作为终端渲染这次计算的结果。
    return id
  }
}

// endCodes that produce visible effects on space characters
// VISIBLE_ON_SPACE保存`Set`，供终端渲染后续处理使用。
const VISIBLE_ON_SPACE = new Set([
  '\x1b[49m', // background color
  '\x1b[27m', // inverse
  '\x1b[24m', // underline
  '\x1b[29m', // strikethrough
  '\x1b[55m', // overline
])

// hasVisibleSpaceEffect 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasVisibleSpaceEffect(styles: AnsiCode[]): boolean {
  // 按顺序遍历 `styles` 中的style，逐个交给终端渲染处理。
  for (const style of styles) {
    // 满足 `VISIBLE_ON_SPACE.has(style.endCode)` 时，终端渲染执行该分支。
    if (VISIBLE_ON_SPACE.has(style.endCode)) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Cell width classification for handling double-wide characters (CJK, emoji,
 * etc.)
 *
 * We use explicit spacer cells rather than inferring width at render time. This
 * makes the data structure self-describing and simplifies cursor positioning
 * logic.
 *
 * @see https://mitchellh.com/writing/grapheme-clusters-in-terminals
 */
// const enum is inlined at compile time - no runtime object, no property access
export const enum CellWidth {
  // Not a wide character, cell width 1
  Narrow = 0,
  // Wide character, cell width 2. This cell contains the actual character.
  Wide = 1,
  // Spacer occupying the second visual column of a wide character. Do not render.
  SpacerTail = 2,
  // Spacer at the end of a soft-wrapped line indicating that a wide character
  // continues on the next line. Used for preserving wide character semantics
  // across line breaks during soft wrapping.
  SpacerHead = 3,
}

// Hyperlink 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Hyperlink = string | undefined

/**
 * Cell is a view type returned by cellAt(). Cells are stored as packed typed
 * arrays internally to avoid GC pressure from allocating objects per cell.
 */
// Cell 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Cell = {
  char: string
  styleId: number
  width: CellWidth
  hyperlink: Hyperlink
}

// Constants for empty/spacer cells to enable fast comparisons
// These are indices into the charStrings table, not codepoints
// EMPTY_CHAR_INDEX 索引保存`0 // ' ' (space)`，供后续判断或组装使用。
const EMPTY_CHAR_INDEX = 0 // ' ' (space)
// SPACER_CHAR_INDEX 索引保存`1 // '' (empty string for spacer cells)`，供后续判断或组装使用。
const SPACER_CHAR_INDEX = 1 // '' (empty string for spacer cells)
// Unwritten cells are [EMPTY_CHAR_INDEX=0, packWord1(emptyStyleId=0,0,0)=0].
// Since StylePool.none is always 0 (first intern), unwritten cells are
// indistinguishable from explicitly-cleared cells in the packed array.
// This is intentional: diffEach can compare raw ints with zero normalization.
// isEmptyCellByIndex checks if both words are 0 to identify "never visually written" cells.

// initCharAscii 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function initCharAscii(): Int32Array {
  // table保存`Int32Array`，供终端渲染后续处理使用。
  const table = new Int32Array(128)
  // 调用 table.fill，触发终端渲染此处需要的副作用。
  table.fill(-1)
  // table[32更新为 `EMPTY_CHAR_INDEX // ' ' (space)`，确保Ink 渲染层 screen后续读取最新状态。
  table[32] = EMPTY_CHAR_INDEX // ' ' (space)
  // 返回 `table`，作为终端渲染这次计算的结果。
  return table
}

// --- Packed cell layout ---
// Each cell is 2 consecutive Int32 elements in the cells array:
//   word0 (cells[ci]):     charId (full 32 bits)
//   word1 (cells[ci + 1]): styleId[31:17] | hyperlinkId[16:2] | width[1:0]
// STYLE_SHIFT 命名 `17`，让后续代码直接表达这个值的用途。
const STYLE_SHIFT = 17
// HYPERLINK_SHIFT 命名 `2`，让后续代码直接表达这个值的用途。
const HYPERLINK_SHIFT = 2
// HYPERLINK_MASK保存`0x7fff // 15 bits`，供后续判断或组装使用。
const HYPERLINK_MASK = 0x7fff // 15 bits
// WIDTH_MASK保存`3 // 2 bits`，供Ink 渲染层 screen后续判断或输出使用。
const WIDTH_MASK = 3 // 2 bits

// Pack styleId, hyperlinkId, and width into a single Int32
// packWord1 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function packWord1(
  styleId: number,
  hyperlinkId: number,
  width: number,
): number {
  // 返回 `(styleId << STYLE_SHIFT) | (hyperlinkId << HYPERLINK_SHIFT) | width`，作为终端渲染这次计算的结果。
  return (styleId << STYLE_SHIFT) | (hyperlinkId << HYPERLINK_SHIFT) | width
}

// Unwritten cell as BigInt64 — both words are 0, so the 64-bit value is 0n.
// Used by BigInt64Array.fill() for bulk clears (resetScreen, clearRegion).
// Not used for comparison — BigInt element reads cause heap allocation.
// EMPTY_CELL_VALUE 命名 `0n`，让后续代码直接表达这个值的用途。
const EMPTY_CELL_VALUE = 0n

/**
 * Screen uses a packed Int32Array instead of Cell objects to eliminate GC
 * pressure. For a 200x120 screen, this avoids allocating 24,000 objects.
 *
 * Cell data is stored as 2 Int32s per cell in a single contiguous array:
 *   word0: charId (full 32 bits — index into CharPool)
 *   word1: styleId[31:17] | hyperlinkId[16:2] | width[1:0]
 *
 * This layout halves memory accesses in diffEach (2 int loads vs 4) and
 * enables future SIMD comparison via Bun.indexOfFirstDifference.
 */
// Screen 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Screen = Size & {
  // Packed cell data — 2 Int32s per cell: [charId, packed(styleId|hyperlinkId|width)]
  // cells and cells64 are views over the same ArrayBuffer.
  cells: Int32Array
  cells64: BigInt64Array // 1 BigInt64 per cell — used for bulk fill in resetScreen/clearRegion

  // Shared pools — IDs are valid across all screens using the same pools
  charPool: CharPool
  hyperlinkPool: HyperlinkPool

  // Empty style ID for comparisons
  emptyStyleId: number

  /**
   * Bounding box of cells that were written to (not blitted) during rendering.
   * Used by diff() to limit iteration to only the region that could have changed.
   */
  damage: Rectangle | undefined

  /**
   * Per-cell noSelect bitmap — 1 byte per cell, 1 = exclude from text
   * selection (copy + highlight). Used by <NoSelect> to mark gutters
   * (line numbers, diff sigils) so click-drag over a diff yields clean
   * copyable code. Fully reset each frame in resetScreen; blitRegion
   * copies it alongside cells so the blit optimization preserves marks.
   */
  noSelect: Uint8Array

  /**
   * Per-ROW soft-wrap continuation marker. softWrap[r]=N>0 means row r
   * is a word-wrap continuation of row r-1 (the `\n` before it was
   * inserted by wrapAnsi, not in the source), and row r-1's written
   * content ends at absolute column N (exclusive — cells [0..N) are the
   * fragment, past N is unwritten padding). 0 means row r is NOT a
   * continuation (hard newline or first row). Selection copy checks
   * softWrap[r]>0 to join row r onto row r-1 without a newline, and
   * reads softWrap[r+1] to know row r's content end when row r+1
   * continues from it. The content-end column is needed because an
   * unwritten cell and a written-unstyled-space are indistinguishable in
   * the packed typed array (both all-zero) — without it we'd either drop
   * the word-separator space (trim) or include trailing padding (no
   * trim). This encoding (continuation-on-self, prev-content-end-here)
   * is chosen so shiftRows preserves the is-continuation semantics: when
   * row r scrolls off the top and row r+1 shifts to row r, sw[r] gets
   * old sw[r+1] — which correctly says the new row r is a continuation
   * of what's now in scrolledOffAbove. Reset each frame; copied by
   * blitRegion/shiftRows.
   */
  softWrap: Int32Array
}

// isEmptyCellByIndex 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEmptyCellByIndex(screen: Screen, index: number): boolean {
  // An empty/unwritten cell has both words === 0:
  // word0 = EMPTY_CHAR_INDEX (0), word1 = packWord1(emptyStyleId=0, 0, 0) = 0.
  // ci保存`index << 1`，供后续判断或组装使用。
  const ci = index << 1
  // 返回 `screen.cells[ci] === 0 && screen.cells[ci | 1] === 0`，作为终端渲染这次计算的结果。
  return screen.cells[ci] === 0 && screen.cells[ci | 1] === 0
}

// isEmptyCellAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEmptyCellAt(screen: Screen, x: number, y: number): boolean {
  // 只有 `x < 0 || y < 0 || x >= screen.width || y >= screen.height` 满足时，终端渲染才执行该分支。
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height) return true
  // 返回 `isEmptyCellByIndex(screen, y * screen.width + x)`，作为终端渲染这次计算的结果。
  return isEmptyCellByIndex(screen, y * screen.width + x)
}

/**
 * Check if a Cell (view object) represents an empty cell.
 */
// isCellEmpty 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCellEmpty(screen: Screen, cell: Cell): boolean {
  // Check if cell looks like an empty cell (space, empty style, narrow, no link).
  // Note: After cellAt mapping, unwritten cells have emptyStyleId, so this
  // returns true for both unwritten AND cleared cells. Use isEmptyCellAt
  // for the internal distinction.
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    cell.char === ' ' &&
    cell.styleId === screen.emptyStyleId &&
    cell.width === CellWidth.Narrow &&
    !cell.hyperlink
  )
}
// Intern a hyperlink string and return its ID (0 = no hyperlink)
// internHyperlink 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function internHyperlink(screen: Screen, hyperlink: Hyperlink): number {
  // 返回 `screen.hyperlinkPool.intern(hyperlink)`，作为终端渲染这次计算的结果。
  return screen.hyperlinkPool.intern(hyperlink)
}

// ---

// createScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createScreen(
  width: number,
  height: number,
  styles: StylePool,
  charPool: CharPool,
  hyperlinkPool: HyperlinkPool,
): Screen {
  // Warn if dimensions are not valid integers (likely bad yoga layout output)
  // 调用 warn.ifNotInteger，触发终端渲染此处需要的副作用。
  warn.ifNotInteger(width, 'createScreen width')
  // 调用 warn.ifNotInteger，触发终端渲染此处需要的副作用。
  warn.ifNotInteger(height, 'createScreen height')

  // Ensure width and height are valid integers to prevent crashes
  // 只有 `!Number.isInteger(width) || width < 0` 满足时，终端渲染才执行该分支。
  if (!Number.isInteger(width) || width < 0) {
    // width更新为 `Math.max(0, Math.floor(width) || 0)`，确保Ink 渲染层后续读取最新状态。
    width = Math.max(0, Math.floor(width) || 0)
  }
  // 只有 `!Number.isInteger(height) || height < 0` 满足时，终端渲染才执行该分支。
  if (!Number.isInteger(height) || height < 0) {
    // height更新为 `Math.max(0, Math.floor(height) || 0)`，确保Ink 渲染层后续读取最新状态。
    height = Math.max(0, Math.floor(height) || 0)
  }

  // size保存`width * height`，供Ink 渲染层 screen后续判断或输出使用。
  const size = width * height

  // Allocate one buffer, two views: Int32Array for per-word access,
  // BigInt64Array for bulk fill in resetScreen/clearRegion.
  // ArrayBuffer is zero-filled, which is exactly the empty cell value:
  // [EMPTY_CHAR_INDEX=0, packWord1(emptyStyleId=0,0,0)=0].
  // buf保存`ArrayBuffer`，供终端渲染后续处理使用。
  const buf = new ArrayBuffer(size << 3) // 8 bytes per cell
  // cells 集合保存`Int32Array`，供终端渲染后续处理使用。
  const cells = new Int32Array(buf)
  // cells64保存`BigInt64Array`，供终端渲染后续处理使用。
  const cells64 = new BigInt64Array(buf)

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    width,
    height,
    cells,
    cells64,
    charPool,
    hyperlinkPool,
    emptyStyleId: styles.none,
    damage: undefined,
    noSelect: new Uint8Array(size),
    softWrap: new Int32Array(height),
  }
}

/**
 * Reset an existing screen for reuse, avoiding allocation of new typed arrays.
 * Resizes if needed and clears all cells to empty/unwritten state.
 *
 * For double-buffering, this allows swapping between front and back buffers
 * without allocating new Screen objects each frame.
 */
// resetScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetScreen(
  screen: Screen,
  width: number,
  height: number,
): void {
  // Warn if dimensions are not valid integers
  // 调用 warn.ifNotInteger，触发终端渲染此处需要的副作用。
  warn.ifNotInteger(width, 'resetScreen width')
  // 调用 warn.ifNotInteger，触发终端渲染此处需要的副作用。
  warn.ifNotInteger(height, 'resetScreen height')

  // Ensure width and height are valid integers to prevent crashes
  // 只有 `!Number.isInteger(width) || width < 0` 满足时，终端渲染才执行该分支。
  if (!Number.isInteger(width) || width < 0) {
    // width更新为 `Math.max(0, Math.floor(width) || 0)`，确保Ink 渲染层后续读取最新状态。
    width = Math.max(0, Math.floor(width) || 0)
  }
  // 只有 `!Number.isInteger(height) || height < 0` 满足时，终端渲染才执行该分支。
  if (!Number.isInteger(height) || height < 0) {
    // height更新为 `Math.max(0, Math.floor(height) || 0)`，确保Ink 渲染层后续读取最新状态。
    height = Math.max(0, Math.floor(height) || 0)
  }

  // size保存`width * height`，供Ink 渲染层 screen后续判断或输出使用。
  const size = width * height

  // Resize if needed (only grow, to avoid reallocations)
  // 满足 `screen.cells64.length < size` 时，终端渲染执行该分支。
  if (screen.cells64.length < size) {
    // buf保存`ArrayBuffer`，供终端渲染后续处理使用。
    const buf = new ArrayBuffer(size << 3)
    // cells 集合更新为 `new Int32Array(buf)`，确保Ink 渲染层后续读取最新状态。
    screen.cells = new Int32Array(buf)
    // cells64更新为 `new BigInt64Array(buf)`，确保Ink 渲染层后续读取最新状态。
    screen.cells64 = new BigInt64Array(buf)
    // noSelect更新为 `new Uint8Array(size)`，确保Ink 渲染层后续读取最新状态。
    screen.noSelect = new Uint8Array(size)
  }
  // 满足 `screen.softWrap.length < height` 时，终端渲染执行该分支。
  if (screen.softWrap.length < height) {
    // softWrap更新为 `new Int32Array(height)`，确保Ink 渲染层后续读取最新状态。
    screen.softWrap = new Int32Array(height)
  }

  // Reset all cells — single fill call, no loop
  // 调用 screen.cells64.fill，触发终端渲染此处需要的副作用。
  screen.cells64.fill(EMPTY_CELL_VALUE, 0, size)
  // 调用 screen.noSelect.fill，触发终端渲染此处需要的副作用。
  screen.noSelect.fill(0, 0, size)
  // 调用 screen.softWrap.fill，触发终端渲染此处需要的副作用。
  screen.softWrap.fill(0, 0, height)

  // Update dimensions
  // width更新为 `width`，确保Ink 渲染层后续读取最新状态。
  screen.width = width
  // height更新为 `height`，确保Ink 渲染层后续读取最新状态。
  screen.height = height

  // Shared pools accumulate — no clearing needed. Unique char/hyperlink sets are bounded.

  // Clear damage tracking
  // damage更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  screen.damage = undefined
}

/**
 * Re-intern a screen's char and hyperlink IDs into new pools.
 * Used for generational pool reset — after migrating, the screen's
 * typed arrays contain valid IDs for the new pools, and the old pools
 * can be GC'd.
 *
 * O(width * height) but only called occasionally (e.g., between conversation turns).
 */
// migrateScreenPools 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateScreenPools(
  screen: Screen,
  charPool: CharPool,
  hyperlinkPool: HyperlinkPool,
): void {
  // oldCharPool 命名 `screen.charPool`，让后续代码直接表达这个值的用途。
  const oldCharPool = screen.charPool
  // oldHyperlinkPool保存`screen.hyperlinkPool`，供后续判断或组装使用。
  const oldHyperlinkPool = screen.hyperlinkPool
  // 只有 `oldCharPool === charPool && oldHyperlinkPool === hyperlinkPool` 满足时，终端渲染才执行该分支。
  if (oldCharPool === charPool && oldHyperlinkPool === hyperlinkPool) return

  // size保存`screen.width * screen.height`，供后续判断或组装使用。
  const size = screen.width * screen.height
  // cells 集合 命名 `screen.cells`，让后续代码直接表达这个值的用途。
  const cells = screen.cells

  // Re-intern chars and hyperlinks in a single pass, stride by 2
  // 循环处理 `let ci = 0; ci < size << 1; ci += 2`，让终端渲染逐项把同类条目按顺序走完。
  for (let ci = 0; ci < size << 1; ci += 2) {
    // Re-intern charId (word0)
    // oldCharId 命名 `cells[ci]!`，让后续代码直接表达这个值的用途。
    const oldCharId = cells[ci]!
    // cells[ci更新为 `charPool.intern(oldCharPool.get(oldCharId))`，确保Ink 渲染层 screen后续读取最新状态。
    cells[ci] = charPool.intern(oldCharPool.get(oldCharId))

    // Re-intern hyperlinkId (packed in word1)
    // word1 命名 `cells[ci + 1]!`，让后续代码直接表达这个值的用途。
    const word1 = cells[ci + 1]!
    // oldHyperlinkId保存`(word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK`，供后续判断或组装使用。
    const oldHyperlinkId = (word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK
    // `oldHyperlinkId` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (oldHyperlinkId !== 0) {
      // oldStr读取`oldHyperlinkPool.get`，供终端渲染后续处理使用。
      const oldStr = oldHyperlinkPool.get(oldHyperlinkId)
      // newHyperlinkId保存`hyperlinkPool.intern`，供终端渲染后续处理使用。
      const newHyperlinkId = hyperlinkPool.intern(oldStr)
      // Repack word1 with new hyperlinkId, preserving styleId and width
      // styleId保存`word1 >>> STYLE_SHIFT`，供后续判断或组装使用。
      const styleId = word1 >>> STYLE_SHIFT
      // width保存`word1 & WIDTH_MASK`，供Ink 渲染层 screen后续判断或输出使用。
      const width = word1 & WIDTH_MASK
      // cells[ci + 1更新为 `packWord1(styleId, newHyperlinkId, width)`，确保Ink 渲染层 screen后续读取最新状态。
      cells[ci + 1] = packWord1(styleId, newHyperlinkId, width)
    }
  }

  // charPool更新为 `charPool`，确保Ink 渲染层后续读取最新状态。
  screen.charPool = charPool
  // hyperlinkPool更新为 `hyperlinkPool`，确保Ink 渲染层后续读取最新状态。
  screen.hyperlinkPool = hyperlinkPool
}

/**
 * Get a Cell view at the given position. Returns a new object each call -
 * this is intentional as cells are stored packed, not as objects.
 */
// cellAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cellAt(screen: Screen, x: number, y: number): Cell | undefined {
  // 只有 `x < 0 || y < 0 || x >= screen.width || y >= screen.height` 满足时，终端渲染才执行该分支。
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    // 返回 `undefined`，作为终端渲染这次计算的结果。
    return undefined
  // 返回 `cellAtIndex(screen, y * screen.width + x)`，作为终端渲染这次计算的结果。
  return cellAtIndex(screen, y * screen.width + x)
}
/**
 * Get a Cell view by pre-computed array index. Skips bounds checks and
 * index computation — caller must ensure index is valid.
 */
// cellAtIndex 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cellAtIndex(screen: Screen, index: number): Cell {
  // ci保存`index << 1`，供后续判断或组装使用。
  const ci = index << 1
  // word1保存`screen.cells[ci + 1]!`，供Ink 渲染层 screen后续判断或输出使用。
  const word1 = screen.cells[ci + 1]!
  // hid 命名 `(word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK`，让后续代码直接表达这个值的用途。
  const hid = (word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    // Unwritten cells have charIndex=0 (EMPTY_CHAR_INDEX); charPool.get(0) returns ' '
    char: screen.charPool.get(screen.cells[ci]!),
    styleId: word1 >>> STYLE_SHIFT,
    width: word1 & WIDTH_MASK,
    hyperlink: hid === 0 ? undefined : screen.hyperlinkPool.get(hid),
  }
}

/**
 * Get a Cell at the given index, or undefined if it has no visible content.
 * Returns undefined for spacer cells (charId 1), empty unstyled spaces, and
 * fg-only styled spaces that match lastRenderedStyleId (cursor-forward
 * produces an identical visual result, avoiding a Cell allocation).
 *
 * @param lastRenderedStyleId - styleId of the last rendered cell on this
 *   line, or -1 if none yet.
 */
// visibleCellAtIndex 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function visibleCellAtIndex(
  cells: Int32Array,
  charPool: CharPool,
  hyperlinkPool: HyperlinkPool,
  index: number,
  lastRenderedStyleId: number,
): Cell | undefined {
  // ci保存`index << 1`，供后续判断或组装使用。
  const ci = index << 1
  // charId 命名 `cells[ci]!`，让后续代码直接表达这个值的用途。
  const charId = cells[ci]!
  // 满足 `charId === 1` 时，终端渲染执行该分支。
  if (charId === 1) return undefined // spacer
  // word1 命名 `cells[ci + 1]!`，让后续代码直接表达这个值的用途。
  const word1 = cells[ci + 1]!
  // For spaces: 0x3fffc masks bits 2-17 (hyperlinkId + styleId visibility
  // bit). If zero, the space has no hyperlink and at most a fg-only style.
  // Then word1 >>> STYLE_SHIFT is the foreground style — skip if it's zero
  // (truly invisible) or matches the last rendered style on this line.
  // 只有 `charId === 0 && (word1 & 0x3fffc) === 0` 满足时，终端渲染才执行该分支。
  if (charId === 0 && (word1 & 0x3fffc) === 0) {
    // fgStyle保存`word1 >>> STYLE_SHIFT`，供Ink 渲染层 screen后续判断或输出使用。
    const fgStyle = word1 >>> STYLE_SHIFT
    // 只有 `fgStyle === 0 || fgStyle === lastRenderedStyleId` 满足时，终端渲染才执行该分支。
    if (fgStyle === 0 || fgStyle === lastRenderedStyleId) return undefined
  }
  // hid 命名 `(word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK`，让后续代码直接表达这个值的用途。
  const hid = (word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    char: charPool.get(charId),
    styleId: word1 >>> STYLE_SHIFT,
    width: word1 & WIDTH_MASK,
    hyperlink: hid === 0 ? undefined : hyperlinkPool.get(hid),
  }
}

/**
 * Write cell data into an existing Cell object to avoid allocation.
 * Caller must ensure index is valid.
 */
// cellAtCI 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cellAtCI(screen: Screen, ci: number, out: Cell): void {
  // w1保存`ci | 1`，供后续判断或组装使用。
  const w1 = ci | 1
  // word1保存`screen.cells[w1]!`，供Ink 渲染层 screen后续判断或输出使用。
  const word1 = screen.cells[w1]!
  // char更新为 `screen.charPool.get(screen.cells[ci]!)`，确保Ink 渲染层后续读取最新状态。
  out.char = screen.charPool.get(screen.cells[ci]!)
  // styleId更新为 `word1 >>> STYLE_SHIFT`，确保Ink 渲染层后续读取最新状态。
  out.styleId = word1 >>> STYLE_SHIFT
  // width更新为 `word1 & WIDTH_MASK`，确保Ink 渲染层后续读取最新状态。
  out.width = word1 & WIDTH_MASK
  // hid 命名 `(word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK`，让后续代码直接表达这个值的用途。
  const hid = (word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK
  // hyperlink更新为 `hid === 0 ? undefined : screen.hyperlinkPool.get(hid)`，确保Ink 渲染层后续读取最新状态。
  out.hyperlink = hid === 0 ? undefined : screen.hyperlinkPool.get(hid)
}

// charInCellAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function charInCellAt(
  screen: Screen,
  x: number,
  y: number,
): string | undefined {
  // 只有 `x < 0 || y < 0 || x >= screen.width || y >= screen.height` 满足时，终端渲染才执行该分支。
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height)
    // 返回 `undefined`，作为终端渲染这次计算的结果。
    return undefined
  // ci 命名 `(y * screen.width + x) << 1`，让后续代码直接表达这个值的用途。
  const ci = (y * screen.width + x) << 1
  // 返回 `screen.charPool.get(screen.cells[ci]!)`，作为终端渲染这次计算的结果。
  return screen.charPool.get(screen.cells[ci]!)
}
/**
 * Set a cell, optionally creating a spacer for wide characters.
 *
 * Wide characters (CJK, emoji) occupy 2 cells in the buffer:
 * 1. First cell: Contains the actual character with width = Wide
 * 2. Second cell: Spacer cell with width = SpacerTail (empty, not rendered)
 *
 * If the cell has width = Wide, this function automatically creates the
 * corresponding SpacerTail in the next column. This two-cell model keeps
 * the buffer aligned to visual columns, making cursor positioning
 * straightforward.
 *
 * TODO: When soft-wrapping is implemented, SpacerHead cells will be explicitly
 * placed by the wrapping logic at line-end positions where wide characters
 * wrap to the next line. This function doesn't need to handle SpacerHead
 * automatically - it will be set directly by the wrapping code.
 */
// setCellAt 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCellAt(
  screen: Screen,
  x: number,
  y: number,
  cell: Cell,
): void {
  // 只有 `x < 0 || y < 0 || x >= screen.width || y >= screen.height` 满足时，终端渲染才执行该分支。
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height) return
  // ci 命名 `(y * screen.width + x) << 1`，让后续代码直接表达这个值的用途。
  const ci = (y * screen.width + x) << 1
  // cells 集合 命名 `screen.cells`，让后续代码直接表达这个值的用途。
  const cells = screen.cells

  // When a Wide char is overwritten by a Narrow char, its SpacerTail remains
  // as a ghost cell that the diff/render pipeline skips, causing stale content
  // to leak through from previous frames.
  // prevWidth读取 `cells[ci + 1]! & WIDTH_MASK` 对应条目，后续围绕该成员继续处理。
  const prevWidth = cells[ci + 1]! & WIDTH_MASK
  // `prevWidth === CellWidth.Wide && cell.width` 与 `Ce` 不一致时刷新派生状态，避免使用过期结果。
  if (prevWidth === CellWidth.Wide && cell.width !== CellWidth.Wide) {
    // spacerX保存`x + 1`，供后续判断或组装使用。
    const spacerX = x + 1
    // 满足 `spacerX < screen.width` 时，终端渲染执行该分支。
    if (spacerX < screen.width) {
      // spacerCI保存`ci + 2`，供后续判断或组装使用。
      const spacerCI = ci + 2
      // 满足 `(cells[spacerCI + 1]! & WIDTH_MASK) === CellWidth.SpacerTail` 时，终端渲染执行该分支。
      if ((cells[spacerCI + 1]! & WIDTH_MASK) === CellWidth.SpacerTail) {
        // cells[spacerCI更新为 `EMPTY_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
        cells[spacerCI] = EMPTY_CHAR_INDEX
        // cells[spacerCI + 1更新为 `packWord1(`，确保Ink 渲染层 screen后续读取最新状态。
        cells[spacerCI + 1] = packWord1(
          screen.emptyStyleId,
          0,
          CellWidth.Narrow,
        )
      }
    }
  }
  // Track cleared Wide position for damage expansion below
  // clearedWideX 命名 `-1`，让后续代码直接表达这个值的用途。
  let clearedWideX = -1
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    prevWidth === CellWidth.SpacerTail &&
    cell.width !== CellWidth.SpacerTail
  ) {
    // Overwriting a SpacerTail: clear the orphaned Wide char at (x-1).
    // Keeping the wide character with Narrow width would cause the terminal
    // to still render it with width 2, desyncing the cursor model.
    // 满足 `x > 0` 时，终端渲染执行该分支。
    if (x > 0) {
      // wideCI保存`ci - 2`，供后续判断或组装使用。
      const wideCI = ci - 2
      // 满足 `(cells[wideCI + 1]! & WIDTH_MASK) === CellWidth.Wide` 时，终端渲染执行该分支。
      if ((cells[wideCI + 1]! & WIDTH_MASK) === CellWidth.Wide) {
        // cells[wideCI更新为 `EMPTY_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
        cells[wideCI] = EMPTY_CHAR_INDEX
        // cells[wideCI + 1更新为 `packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)`，确保Ink 渲染层 screen后续读取最新状态。
        cells[wideCI + 1] = packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)
        // clearedWideX更新为 `x - 1`，确保Ink 渲染层后续读取最新状态。
        clearedWideX = x - 1
      }
    }
  }

  // Pack cell data into cells array
  // cells[ci更新为 `internCharString(screen, cell.char)`，确保Ink 渲染层 screen后续读取最新状态。
  cells[ci] = internCharString(screen, cell.char)
  // cells[ci + 1更新为 `packWord1(`，确保Ink 渲染层 screen后续读取最新状态。
  cells[ci + 1] = packWord1(
    cell.styleId,
    internHyperlink(screen, cell.hyperlink),
    cell.width,
  )

  // Track damage - expand bounds in place instead of allocating new objects
  // Include the main cell position and any cleared orphan cells
  // minX保存`Math.min`，供终端渲染后续处理使用。
  const minX = clearedWideX >= 0 ? Math.min(x, clearedWideX) : x
  // damage保存`screen.damage`，供Ink 渲染层 screen后续判断或输出使用。
  const damage = screen.damage
  // 满足 `damage` 时，终端渲染执行该分支。
  if (damage) {
    // right 命名 `damage.x + damage.width`，让后续代码直接表达这个值的用途。
    const right = damage.x + damage.width
    // bottom保存`damage.y + damage.height`，供后续判断或组装使用。
    const bottom = damage.y + damage.height
    // 满足 `minX < damage.x` 时，终端渲染执行该分支。
    if (minX < damage.x) {
      // Ink 渲染层 screen在这里处理 `damage.width += damage.x - minX`，完成这一小步状态转换。
      damage.width += damage.x - minX
      // x更新为 `minX`，确保Ink 渲染层后续读取最新状态。
      damage.x = minX
    // Ink 渲染层 screen在这里处理 `} else if (x >= right) {`，完成这一小步状态转换。
    } else if (x >= right) {
      // width更新为 `x - damage.x + 1`，确保Ink 渲染层后续读取最新状态。
      damage.width = x - damage.x + 1
    }
    // 满足 `y < damage.y` 时，终端渲染执行该分支。
    if (y < damage.y) {
      // Ink 渲染层 screen在这里处理 `damage.height += damage.y - y`，完成这一小步状态转换。
      damage.height += damage.y - y
      // y更新为 `y`，确保Ink 渲染层后续读取最新状态。
      damage.y = y
    // Ink 渲染层 screen在这里处理 `} else if (y >= bottom) {`，完成这一小步状态转换。
    } else if (y >= bottom) {
      // height更新为 `y - damage.y + 1`，确保Ink 渲染层后续读取最新状态。
      damage.height = y - damage.y + 1
    }
  } else {
    // damage更新为 `{ x: minX, y, width: x - minX + 1, height: 1 }`，确保Ink 渲染层后续读取最新状态。
    screen.damage = { x: minX, y, width: x - minX + 1, height: 1 }
  }

  // If this is a wide character, create a spacer in the next column
  // 满足 `cell.width === CellWidth.Wide` 时，终端渲染执行该分支。
  if (cell.width === CellWidth.Wide) {
    // spacerX保存`x + 1`，供后续判断或组装使用。
    const spacerX = x + 1
    // 满足 `spacerX < screen.width` 时，终端渲染执行该分支。
    if (spacerX < screen.width) {
      // spacerCI保存`ci + 2`，供后续判断或组装使用。
      const spacerCI = ci + 2
      // If the cell we're overwriting with our SpacerTail is itself Wide,
      // clear ITS SpacerTail at x+2 too. Otherwise the orphan SpacerTail
      // makes diffEach report it as `added` and log-update's skip-spacer
      // rule prevents clearing whatever prev content was at that column.
      // Scenario: [a, 💻, spacer] → [本, spacer, ORPHAN spacer] when
      // yoga squishes a💻 to height 0 and 本 renders at the same y.
      if ((cells[spacerCI + 1]! & WIDTH_MASK) === CellWidth.Wide) {
        // orphanCI保存`spacerCI + 2`，供后续判断或组装使用。
        const orphanCI = spacerCI + 2
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          spacerX + 1 < screen.width &&
          (cells[orphanCI + 1]! & WIDTH_MASK) === CellWidth.SpacerTail
        ) {
          // cells[orphanCI更新为 `EMPTY_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
          cells[orphanCI] = EMPTY_CHAR_INDEX
          // cells[orphanCI + 1更新为 `packWord1(`，确保Ink 渲染层 screen后续读取最新状态。
          cells[orphanCI + 1] = packWord1(
            screen.emptyStyleId,
            0,
            CellWidth.Narrow,
          )
        }
      }
      // cells[spacerCI更新为 `SPACER_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
      cells[spacerCI] = SPACER_CHAR_INDEX
      // cells[spacerCI + 1更新为 `packWord1(`，确保Ink 渲染层 screen后续读取最新状态。
      cells[spacerCI + 1] = packWord1(
        screen.emptyStyleId,
        0,
        CellWidth.SpacerTail,
      )

      // Expand damage to include SpacerTail so diff() scans it
      // d 命名 `screen.damage`，让后续代码直接表达这个值的用途。
      const d = screen.damage
      // 只有 `d && spacerX >= d.x + d.width` 满足时，终端渲染才执行该分支。
      if (d && spacerX >= d.x + d.width) {
        // width更新为 `spacerX - d.x + 1`，确保Ink 渲染层后续读取最新状态。
        d.width = spacerX - d.x + 1
      }
    }
  }
}

/**
 * Replace the styleId of a cell in-place without disturbing char, width,
 * or hyperlink. Preserves empty cells as-is (char stays ' '). Tracks damage
 * for the cell so diffEach picks up the change.
 */
// setCellStyleId 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCellStyleId(
  screen: Screen,
  x: number,
  y: number,
  styleId: number,
): void {
  // 只有 `x < 0 || y < 0 || x >= screen.width || y >= screen.height` 满足时，终端渲染才执行该分支。
  if (x < 0 || y < 0 || x >= screen.width || y >= screen.height) return
  // ci 命名 `(y * screen.width + x) << 1`，让后续代码直接表达这个值的用途。
  const ci = (y * screen.width + x) << 1
  // cells 集合 命名 `screen.cells`，让后续代码直接表达这个值的用途。
  const cells = screen.cells
  // word1 命名 `cells[ci + 1]!`，让后续代码直接表达这个值的用途。
  const word1 = cells[ci + 1]!
  // width保存`word1 & WIDTH_MASK`，供Ink 渲染层 screen后续判断或输出使用。
  const width = word1 & WIDTH_MASK
  // Skip spacer cells — inverse on the head cell visually covers both columns
  // 只有 `width === CellWidth.SpacerTail || width === CellWidth.SpacerHead` 满足时，终端渲染才执行该分支。
  if (width === CellWidth.SpacerTail || width === CellWidth.SpacerHead) return
  // hid 命名 `(word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK`，让后续代码直接表达这个值的用途。
  const hid = (word1 >>> HYPERLINK_SHIFT) & HYPERLINK_MASK
  // cells[ci + 1更新为 `packWord1(styleId, hid, width)`，确保Ink 渲染层 screen后续读取最新状态。
  cells[ci + 1] = packWord1(styleId, hid, width)
  // Expand damage so diffEach scans this cell
  // d 命名 `screen.damage`，让后续代码直接表达这个值的用途。
  const d = screen.damage
  // 满足 `d` 时，终端渲染执行该分支。
  if (d) {
    // damage更新为 `unionRect(d, { x, y, width: 1, height: 1 })`，确保Ink 渲染层后续读取最新状态。
    screen.damage = unionRect(d, { x, y, width: 1, height: 1 })
  } else {
    // damage更新为 `{ x, y, width: 1, height: 1 }`，确保Ink 渲染层后续读取最新状态。
    screen.damage = { x, y, width: 1, height: 1 }
  }
}

/**
 * Intern a character string via the screen's shared CharPool.
 * Supports grapheme clusters like family emoji.
 */
// internCharString 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function internCharString(screen: Screen, char: string): number {
  // 返回 `screen.charPool.intern(char)`，作为终端渲染这次计算的结果。
  return screen.charPool.intern(char)
}

/**
 * Bulk-copy a rectangular region from src to dst using TypedArray.set().
 * Single cells.set() call per row (or one call for contiguous blocks).
 * Damage is computed once for the whole region.
 *
 * Clamps negative regionX/regionY to 0 (matching clearRegion) — absolute-
 * positioned overlays in tiny terminals can compute negative screen coords.
 * maxX/maxY should already be clamped to both screen bounds by the caller.
 */
// blitRegion 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function blitRegion(
  dst: Screen,
  src: Screen,
  regionX: number,
  regionY: number,
  maxX: number,
  maxY: number,
): void {
  // regionX更新为 `Math.max(0, regionX)`，确保Ink 渲染层后续读取最新状态。
  regionX = Math.max(0, regionX)
  // regionY更新为 `Math.max(0, regionY)`，确保Ink 渲染层后续读取最新状态。
  regionY = Math.max(0, regionY)
  // 只有 `regionX >= maxX || regionY >= maxY` 满足时，终端渲染才执行该分支。
  if (regionX >= maxX || regionY >= maxY) return

  // rowLen 命名 `maxX - regionX`，让后续代码直接表达这个值的用途。
  const rowLen = maxX - regionX
  // srcStride保存`src.width << 1`，供Ink 渲染层 screen后续判断或输出使用。
  const srcStride = src.width << 1
  // dstStride保存`dst.width << 1`，供Ink 渲染层 screen后续判断或输出使用。
  const dstStride = dst.width << 1
  // rowBytes 集合保存`rowLen << 1 // 2 Int32s per cell`，供Ink 渲染层 screen后续判断或输出使用。
  const rowBytes = rowLen << 1 // 2 Int32s per cell
  // srcCells 集合 命名 `src.cells`，让后续代码直接表达这个值的用途。
  const srcCells = src.cells
  // dstCells 集合保存`dst.cells`，供后续判断或组装使用。
  const dstCells = dst.cells
  // srcNoSel保存`src.noSelect`，供后续判断或组装使用。
  const srcNoSel = src.noSelect
  // dstNoSel保存`dst.noSelect`，供后续判断或组装使用。
  const dstNoSel = dst.noSelect

  // softWrap is per-row — copy the row range regardless of stride/width.
  // Partial-width blits still carry the row's wrap provenance since the
  // blitted content (a cached ink-text node) is what set the bit.
  // dst.softWrap.set 写入新的状态值，使终端渲染后续读取保持一致。
  dst.softWrap.set(src.softWrap.subarray(regionY, maxY), regionY)

  // Fast path: contiguous memory when copying full-width rows at same stride
  // 只有 `regionX === 0 && maxX === src.width && src.width` 满足时，终端渲染才执行该分支。
  if (regionX === 0 && maxX === src.width && src.width === dst.width) {
    // srcStart保存`regionY * srcStride`，供后续判断或组装使用。
    const srcStart = regionY * srcStride
    // totalBytes 集合 命名 `(maxY - regionY) * srcStride`，让后续代码直接表达这个值的用途。
    const totalBytes = (maxY - regionY) * srcStride
    // dstCells.set 写入新的状态值，使终端渲染后续读取保持一致。
    dstCells.set(
      srcCells.subarray(srcStart, srcStart + totalBytes),
      srcStart, // srcStart === dstStart when strides match and regionX === 0
    )
    // noSelect is 1 byte/cell vs cells' 8 — same region, different scale
    // nsStart保存`regionY * src.width`，供Ink 渲染层 screen后续判断或输出使用。
    const nsStart = regionY * src.width
    // nsLen保存`(maxY - regionY) * src.width`，供Ink 渲染层 screen后续判断或输出使用。
    const nsLen = (maxY - regionY) * src.width
    // dstNoSel.set 写入新的状态值，使终端渲染后续读取保持一致。
    dstNoSel.set(srcNoSel.subarray(nsStart, nsStart + nsLen), nsStart)
  } else {
    // Per-row copy for partial-width or mismatched-stride regions
    // srcRowCI保存`regionY * srcStride + (regionX << 1)`，供后续判断或组装使用。
    let srcRowCI = regionY * srcStride + (regionX << 1)
    // dstRowCI保存`regionY * dstStride + (regionX << 1)`，供后续判断或组装使用。
    let dstRowCI = regionY * dstStride + (regionX << 1)
    // srcRowNS 集合保存`regionY * src.width + regionX`，供后续判断或组装使用。
    let srcRowNS = regionY * src.width + regionX
    // dstRowNS 集合保存`regionY * dst.width + regionX`，供Ink 渲染层 screen后续判断或输出使用。
    let dstRowNS = regionY * dst.width + regionX
    // 循环处理 `let y = regionY; y < maxY; y++`，让终端渲染逐项把同类条目按顺序走完。
    for (let y = regionY; y < maxY; y++) {
      // dstCells.set 写入新的状态值，使终端渲染后续读取保持一致。
      dstCells.set(srcCells.subarray(srcRowCI, srcRowCI + rowBytes), dstRowCI)
      // dstNoSel.set 写入新的状态值，使终端渲染后续读取保持一致。
      dstNoSel.set(srcNoSel.subarray(srcRowNS, srcRowNS + rowLen), dstRowNS)
      // Ink 渲染层 screen在这里处理 `srcRowCI += srcStride`，完成这一小步状态转换。
      srcRowCI += srcStride
      // Ink 渲染层 screen在这里处理 `dstRowCI += dstStride`，完成这一小步状态转换。
      dstRowCI += dstStride
      // Ink 渲染层 screen在这里处理 `srcRowNS += src.width`，完成这一小步状态转换。
      srcRowNS += src.width
      // Ink 渲染层 screen在这里处理 `dstRowNS += dst.width`，完成这一小步状态转换。
      dstRowNS += dst.width
    }
  }

  // Compute damage once for the whole region
  // regionRect 集中保存Ink 渲染层 screen要一起传递的字段。
  const regionRect = {
    x: regionX,
    y: regionY,
    width: rowLen,
    height: maxY - regionY,
  }
  // 满足 `dst.damage` 时，终端渲染执行该分支。
  if (dst.damage) {
    // damage更新为 `unionRect(dst.damage, regionRect)`，确保Ink 渲染层后续读取最新状态。
    dst.damage = unionRect(dst.damage, regionRect)
  } else {
    // damage更新为 `regionRect`，确保Ink 渲染层后续读取最新状态。
    dst.damage = regionRect
  }

  // Handle wide char at right edge: spacer might be outside blit region
  // but still within dst bounds. Per-row check only at the boundary column.
  // 满足 `maxX < dst.width` 时，终端渲染执行该分支。
  if (maxX < dst.width) {
    // srcLastCI保存`(regionY * src.width + (maxX - 1)) << 1`，供Ink 渲染层 screen后续判断或输出使用。
    let srcLastCI = (regionY * src.width + (maxX - 1)) << 1
    // dstSpacerCI 命名 `(regionY * dst.width + maxX) << 1`，让后续代码直接表达这个值的用途。
    let dstSpacerCI = (regionY * dst.width + maxX) << 1
    // wroteSpacerOutsideRegion标记Ink 渲染层 screen是否启用对应路径。
    let wroteSpacerOutsideRegion = false
    // 循环处理 `let y = regionY; y < maxY; y++`，让终端渲染逐项把同类条目按顺序走完。
    for (let y = regionY; y < maxY; y++) {
      // 满足 `(srcCells[srcLastCI + 1]! & WIDTH_MASK) === CellWidth.Wide` 时，终端渲染执行该分支。
      if ((srcCells[srcLastCI + 1]! & WIDTH_MASK) === CellWidth.Wide) {
        // dstCells[dstSpacerCI更新为 `SPACER_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
        dstCells[dstSpacerCI] = SPACER_CHAR_INDEX
        // dstCells[dstSpacerCI + 1更新为 `packWord1(`，确保Ink 渲染层 screen后续读取最新状态。
        dstCells[dstSpacerCI + 1] = packWord1(
          dst.emptyStyleId,
          0,
          CellWidth.SpacerTail,
        )
        // wroteSpacerOutsideRegion更新为 `true`，确保Ink 渲染层后续读取最新状态。
        wroteSpacerOutsideRegion = true
      }
      // Ink 渲染层 screen在这里处理 `srcLastCI += srcStride`，完成这一小步状态转换。
      srcLastCI += srcStride
      // Ink 渲染层 screen在这里处理 `dstSpacerCI += dstStride`，完成这一小步状态转换。
      dstSpacerCI += dstStride
    }
    // Expand damage to include SpacerTail column if we wrote any
    // 只有 `wroteSpacerOutsideRegion && dst.damage` 满足时，终端渲染才执行该分支。
    if (wroteSpacerOutsideRegion && dst.damage) {
      // rightEdge保存`dst.damage.x + dst.damage.width`，供后续判断或组装使用。
      const rightEdge = dst.damage.x + dst.damage.width
      // 满足 `rightEdge === maxX` 时，终端渲染执行该分支。
      if (rightEdge === maxX) {
        // damage更新为 `{ ...dst.damage, width: dst.damage.width + 1 }`，确保Ink 渲染层后续读取最新状态。
        dst.damage = { ...dst.damage, width: dst.damage.width + 1 }
      }
    }
  }
}

/**
 * Bulk-clear a rectangular region of the screen.
 * Uses BigInt64Array.fill() for fast row clears.
 * Handles wide character boundary cleanup at region edges.
 */
// clearRegion 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearRegion(
  screen: Screen,
  regionX: number,
  regionY: number,
  regionWidth: number,
  regionHeight: number,
): void {
  // startX保存`Math.max`，供终端渲染后续处理使用。
  const startX = Math.max(0, regionX)
  // startY保存`Math.max`，供终端渲染后续处理使用。
  const startY = Math.max(0, regionY)
  // maxX保存`Math.min`，供终端渲染后续处理使用。
  const maxX = Math.min(regionX + regionWidth, screen.width)
  // maxY保存`Math.min`，供终端渲染后续处理使用。
  const maxY = Math.min(regionY + regionHeight, screen.height)
  // 只有 `startX >= maxX || startY >= maxY` 满足时，终端渲染才执行该分支。
  if (startX >= maxX || startY >= maxY) return

  // cells 集合 命名 `screen.cells`，让后续代码直接表达这个值的用途。
  const cells = screen.cells
  // cells64保存`screen.cells64`，供Ink 渲染层 screen后续判断或输出使用。
  const cells64 = screen.cells64
  // screenWidth保存`screen.width`，供Ink 渲染层 screen后续判断或输出使用。
  const screenWidth = screen.width
  // rowBase 命名 `startY * screenWidth`，让后续代码直接表达这个值的用途。
  const rowBase = startY * screenWidth
  // damageMinX 命名 `startX`，让后续代码直接表达这个值的用途。
  let damageMinX = startX
  // damageMaxX保存`maxX`，供Ink 渲染层 screen后续判断或输出使用。
  let damageMaxX = maxX

  // EMPTY_CELL_VALUE (0n) matches the zero-initialized state:
  // word0=EMPTY_CHAR_INDEX(0), word1=packWord1(0,0,0)=0
  // 只有 `startX === 0 && maxX === screenWidth` 满足时，终端渲染才执行该分支。
  if (startX === 0 && maxX === screenWidth) {
    // Full-width: single fill, no boundary checks needed
    // 调用 cells64.fill，触发终端渲染此处需要的副作用。
    cells64.fill(
      EMPTY_CELL_VALUE,
      rowBase,
      rowBase + (maxY - startY) * screenWidth,
    )
  } else {
    // Partial-width: single loop handles boundary cleanup and fill per row.
    // stride 命名 `screenWidth << 1 // 2 Int32s per cell`，让后续代码直接表达这个值的用途。
    const stride = screenWidth << 1 // 2 Int32s per cell
    // rowLen保存`maxX - startX`，供Ink 渲染层 screen后续判断或输出使用。
    const rowLen = maxX - startX
    // checkLeft保存`startX > 0`，供Ink 渲染层 screen后续判断或输出使用。
    const checkLeft = startX > 0
    // checkRight 命名 `maxX < screenWidth`，让后续代码直接表达这个值的用途。
    const checkRight = maxX < screenWidth
    // leftEdge 命名 `(rowBase + startX) << 1`，让后续代码直接表达这个值的用途。
    let leftEdge = (rowBase + startX) << 1
    // rightEdge保存`(rowBase + maxX - 1) << 1`，供后续判断或组装使用。
    let rightEdge = (rowBase + maxX - 1) << 1
    // fillStart保存`rowBase + startX`，供Ink 渲染层 screen后续判断或输出使用。
    let fillStart = rowBase + startX

    // 循环处理 `let y = startY; y < maxY; y++`，让终端渲染逐项把同类条目按顺序走完。
    for (let y = startY; y < maxY; y++) {
      // Left boundary: if cell at startX is a SpacerTail, the Wide char
      // at startX-1 (outside the region) will be orphaned. Clear it.
      // 满足 `checkLeft` 时，终端渲染执行该分支。
      if (checkLeft) {
        // leftEdge points to word0 of cell at startX; +1 is its word1
        // 满足 `(cells[leftEdge + 1]! & WIDTH_MASK) === CellWidth.SpacerTail` 时，终端渲染执行该分支。
        if ((cells[leftEdge + 1]! & WIDTH_MASK) === CellWidth.SpacerTail) {
          // word1 of cell at startX-1 is leftEdge-1; word0 is leftEdge-2
          // prevW1保存`leftEdge - 1`，供后续判断或组装使用。
          const prevW1 = leftEdge - 1
          // 满足 `(cells[prevW1]! & WIDTH_MASK) === CellWidth.Wide` 时，终端渲染执行该分支。
          if ((cells[prevW1]! & WIDTH_MASK) === CellWidth.Wide) {
            // cells[prevW1 - 1更新为 `EMPTY_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
            cells[prevW1 - 1] = EMPTY_CHAR_INDEX
            // cells[prevW1更新为 `packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)`，确保Ink 渲染层 screen后续读取最新状态。
            cells[prevW1] = packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)
            // damageMinX更新为 `startX - 1`，确保Ink 渲染层后续读取最新状态。
            damageMinX = startX - 1
          }
        }
      }

      // Right boundary: if cell at maxX-1 is Wide, its SpacerTail at maxX
      // (outside the region) will be orphaned. Clear it.
      // 满足 `checkRight` 时，终端渲染执行该分支。
      if (checkRight) {
        // rightEdge points to word0 of cell at maxX-1; +1 is its word1
        // 满足 `(cells[rightEdge + 1]! & WIDTH_MASK) === CellWidth.Wide` 时，终端渲染执行该分支。
        if ((cells[rightEdge + 1]! & WIDTH_MASK) === CellWidth.Wide) {
          // word1 of cell at maxX is rightEdge+3 (+2 to next word0, +1 to word1)
          // nextW1保存`rightEdge + 3`，供Ink 渲染层 screen后续判断或输出使用。
          const nextW1 = rightEdge + 3
          // 满足 `(cells[nextW1]! & WIDTH_MASK) === CellWidth.SpacerTail` 时，终端渲染执行该分支。
          if ((cells[nextW1]! & WIDTH_MASK) === CellWidth.SpacerTail) {
            // cells[nextW1 - 1更新为 `EMPTY_CHAR_INDEX`，确保Ink 渲染层 screen后续读取最新状态。
            cells[nextW1 - 1] = EMPTY_CHAR_INDEX
            // cells[nextW1更新为 `packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)`，确保Ink 渲染层 screen后续读取最新状态。
            cells[nextW1] = packWord1(screen.emptyStyleId, 0, CellWidth.Narrow)
            // damageMaxX更新为 `maxX + 1`，确保Ink 渲染层后续读取最新状态。
            damageMaxX = maxX + 1
          }
        }
      }

      // 调用 cells64.fill，触发终端渲染此处需要的副作用。
      cells64.fill(EMPTY_CELL_VALUE, fillStart, fillStart + rowLen)
      // Ink 渲染层 screen在这里处理 `leftEdge += stride`，完成这一小步状态转换。
      leftEdge += stride
      // Ink 渲染层 screen在这里处理 `rightEdge += stride`，完成这一小步状态转换。
      rightEdge += stride
      // Ink 渲染层 screen在这里处理 `fillStart += screenWidth`，完成这一小步状态转换。
      fillStart += screenWidth
    }
  }

  // Update damage once for the whole region
  // regionRect 集中保存Ink 渲染层 screen要一起传递的字段。
  const regionRect = {
    x: damageMinX,
    y: startY,
    width: damageMaxX - damageMinX,
    height: maxY - startY,
  }
  // 满足 `screen.damage` 时，终端渲染执行该分支。
  if (screen.damage) {
    // damage更新为 `unionRect(screen.damage, regionRect)`，确保Ink 渲染层后续读取最新状态。
    screen.damage = unionRect(screen.damage, regionRect)
  } else {
    // damage更新为 `regionRect`，确保Ink 渲染层后续读取最新状态。
    screen.damage = regionRect
  }
}

/**
 * Shift full-width rows within [top, bottom] (inclusive, 0-indexed) by n.
 * n > 0 shifts UP (simulating CSI n S); n < 0 shifts DOWN (CSI n T).
 * Vacated rows are cleared. Does NOT update damage. Both cells and the
 * noSelect bitmap are shifted so text-selection markers stay aligned when
 * this is applied to next.screen during scroll fast path.
 */
// shiftRows 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shiftRows(
  screen: Screen,
  top: number,
  bottom: number,
  n: number,
): void {
  // 只有 `n === 0 || top < 0 || bottom >= screen.height || top > bottom` 满足时，终端渲染才执行该分支。
  if (n === 0 || top < 0 || bottom >= screen.height || top > bottom) return
  // w保存`screen.width`，供后续判断或组装使用。
  const w = screen.width
  // cells64保存`screen.cells64`，供Ink 渲染层 screen后续判断或输出使用。
  const cells64 = screen.cells64
  // noSel保存`screen.noSelect`，供后续判断或组装使用。
  const noSel = screen.noSelect
  // sw保存`screen.softWrap`，供Ink 渲染层 screen后续判断或输出使用。
  const sw = screen.softWrap
  // absN保存`Math.abs`，供终端渲染后续处理使用。
  const absN = Math.abs(n)
  // 满足 `absN > bottom - top` 时，终端渲染执行该分支。
  if (absN > bottom - top) {
    // 调用 cells64.fill，触发终端渲染此处需要的副作用。
    cells64.fill(EMPTY_CELL_VALUE, top * w, (bottom + 1) * w)
    // 调用 noSel.fill，触发终端渲染此处需要的副作用。
    noSel.fill(0, top * w, (bottom + 1) * w)
    // 调用 sw.fill，触发终端渲染此处需要的副作用。
    sw.fill(0, top, bottom + 1)
    // Ink 渲染层 screen在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `n > 0` 时，终端渲染执行该分支。
  if (n > 0) {
    // SU: row top+n..bottom → top..bottom-n; clear bottom-n+1..bottom
    // 调用 cells64.copyWithin，触发终端渲染此处需要的副作用。
    cells64.copyWithin(top * w, (top + n) * w, (bottom + 1) * w)
    // 调用 noSel.copyWithin，触发终端渲染此处需要的副作用。
    noSel.copyWithin(top * w, (top + n) * w, (bottom + 1) * w)
    // 调用 sw.copyWithin，触发终端渲染此处需要的副作用。
    sw.copyWithin(top, top + n, bottom + 1)
    // 调用 cells64.fill，触发终端渲染此处需要的副作用。
    cells64.fill(EMPTY_CELL_VALUE, (bottom - n + 1) * w, (bottom + 1) * w)
    // 调用 noSel.fill，触发终端渲染此处需要的副作用。
    noSel.fill(0, (bottom - n + 1) * w, (bottom + 1) * w)
    // 调用 sw.fill，触发终端渲染此处需要的副作用。
    sw.fill(0, bottom - n + 1, bottom + 1)
  } else {
    // SD: row top..bottom+n → top-n..bottom; clear top..top-n-1
    // 调用 cells64.copyWithin，触发终端渲染此处需要的副作用。
    cells64.copyWithin((top - n) * w, top * w, (bottom + n + 1) * w)
    // 调用 noSel.copyWithin，触发终端渲染此处需要的副作用。
    noSel.copyWithin((top - n) * w, top * w, (bottom + n + 1) * w)
    // 调用 sw.copyWithin，触发终端渲染此处需要的副作用。
    sw.copyWithin(top - n, top, bottom + n + 1)
    // 调用 cells64.fill，触发终端渲染此处需要的副作用。
    cells64.fill(EMPTY_CELL_VALUE, top * w, (top - n) * w)
    // 调用 noSel.fill，触发终端渲染此处需要的副作用。
    noSel.fill(0, top * w, (top - n) * w)
    // 调用 sw.fill，触发终端渲染此处需要的副作用。
    sw.fill(0, top, top - n)
  }
}

// Matches OSC 8 ; ; URI BEL
// OSC8_REGEX匹配`RegExp`，供终端渲染后续处理使用。
const OSC8_REGEX = new RegExp(`^${ESC}\\]8${SEP}${SEP}([^${BEL}]*)${BEL}$`)
// OSC8 prefix: ESC ] 8 ; — cheap check to skip regex for the vast majority of styles (SGR = ESC [)
// OSC8_PREFIX 命名 ``${ESC}]8${SEP}``，让后续代码直接表达这个值的用途。
export const OSC8_PREFIX = `${ESC}]8${SEP}`

// extractHyperlinkFromStyles 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractHyperlinkFromStyles(
  styles: AnsiCode[],
): Hyperlink | null {
  // 按顺序遍历 `styles` 中的style，逐个交给终端渲染处理。
  for (const style of styles) {
    // code保存`style.code`，供后续判断或组装使用。
    const code = style.code
    // 只有 `code.length < 5 || !code.startsWith(OSC8_PREFIX)` 满足时，终端渲染才执行该分支。
    if (code.length < 5 || !code.startsWith(OSC8_PREFIX)) continue
    // match匹配`code.match`，供终端渲染后续处理使用。
    const match = code.match(OSC8_REGEX)
    // 满足 `match` 时，终端渲染执行该分支。
    if (match) {
      // 返回 `match[1] || null`，作为终端渲染这次计算的结果。
      return match[1] || null
    }
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// filterOutHyperlinkStyles 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterOutHyperlinkStyles(styles: AnsiCode[]): AnsiCode[] {
  // 返回 `styles.filter(`，作为终端渲染这次计算的结果。
  return styles.filter(
    style =>
      !style.code.startsWith(OSC8_PREFIX) || !OSC8_REGEX.test(style.code),
  )
}

// ---

/**
 * Returns an array of all changes between two screens. Used by tests.
 * Production code should use diffEach() to avoid allocations.
 */
// diff 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function diff(
  prev: Screen,
  next: Screen,
): [point: Point, removed: Cell | undefined, added: Cell | undefined][] {
  // output 从空数组开始收集，后续循环会按处理顺序追加条目。
  const output: [Point, Cell | undefined, Cell | undefined][] = []
  // 调用 diffEach，触发终端渲染此处需要的副作用。
  diffEach(prev, next, (x, y, removed, added) => {
    // Copy cells since diffEach reuses the objects
    // output追加新条目，保持收集顺序与输入顺序一致。
    output.push([
      { x, y },
      removed ? { ...removed } : undefined,
      added ? { ...added } : undefined,
    ])
  })
  // 返回 `output`，作为终端渲染这次计算的结果。
  return output
}

// DiffCallback 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DiffCallback = (
  x: number,
  y: number,
  removed: Cell | undefined,
  added: Cell | undefined,
) => boolean | void

/**
 * Like diff(), but calls a callback for each change instead of building an array.
 * Reuses two Cell objects to avoid per-change allocations. The callback must not
 * retain references to the Cell objects — their contents are overwritten each call.
 *
 * Returns true if the callback ever returned true (early exit signal).
 */
// diffEach 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function diffEach(
  prev: Screen,
  next: Screen,
  cb: DiffCallback,
): boolean {
  // prevWidth保存`prev.width`，供Ink 渲染层 screen后续判断或输出使用。
  const prevWidth = prev.width
  // nextWidth保存`next.width`，供Ink 渲染层 screen后续判断或输出使用。
  const nextWidth = next.width
  // prevHeight 命名 `prev.height`，让后续代码直接表达这个值的用途。
  const prevHeight = prev.height
  // nextHeight 命名 `next.height`，让后续代码直接表达这个值的用途。
  const nextHeight = next.height

  // region 先占位，稍后的条件分支会根据实际输入补齐它。
  let region: Rectangle
  // 只有 `prevWidth === 0 && prevHeight === 0` 满足时，终端渲染才执行该分支。
  if (prevWidth === 0 && prevHeight === 0) {
    // region更新为 `{ x: 0, y: 0, width: nextWidth, height: nextHeight }`，确保Ink 渲染层后续读取最新状态。
    region = { x: 0, y: 0, width: nextWidth, height: nextHeight }
  // Ink 渲染层 screen在这里处理 `} else if (next.damage) {`，完成这一小步状态转换。
  } else if (next.damage) {
    // region更新为 `next.damage`，确保Ink 渲染层后续读取最新状态。
    region = next.damage
    // 满足 `prev.damage` 时，终端渲染执行该分支。
    if (prev.damage) {
      // region更新为 `unionRect(region, prev.damage)`，确保Ink 渲染层后续读取最新状态。
      region = unionRect(region, prev.damage)
    }
  // Ink 渲染层 screen在这里处理 `} else if (prev.damage) {`，完成这一小步状态转换。
  } else if (prev.damage) {
    // region更新为 `prev.damage`，确保Ink 渲染层后续读取最新状态。
    region = prev.damage
  } else {
    // region更新为 `{ x: 0, y: 0, width: 0, height: 0 }`，确保Ink 渲染层后续读取最新状态。
    region = { x: 0, y: 0, width: 0, height: 0 }
  }

  // 满足 `prevHeight > nextHeight` 时，终端渲染执行该分支。
  if (prevHeight > nextHeight) {
    // region更新为 `unionRect(region, {`，确保Ink 渲染层后续读取最新状态。
    region = unionRect(region, {
      x: 0,
      y: nextHeight,
      width: prevWidth,
      height: prevHeight - nextHeight,
    })
  }
  // 满足 `prevWidth > nextWidth` 时，终端渲染执行该分支。
  if (prevWidth > nextWidth) {
    // region更新为 `unionRect(region, {`，确保Ink 渲染层后续读取最新状态。
    region = unionRect(region, {
      x: nextWidth,
      y: 0,
      width: prevWidth - nextWidth,
      height: prevHeight,
    })
  }

  // maxHeight保存`Math.max`，供终端渲染后续处理使用。
  const maxHeight = Math.max(prevHeight, nextHeight)
  // maxWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxWidth = Math.max(prevWidth, nextWidth)
  // endY保存`Math.min`，供终端渲染后续处理使用。
  const endY = Math.min(region.y + region.height, maxHeight)
  // endX保存`Math.min`，供终端渲染后续处理使用。
  const endX = Math.min(region.x + region.width, maxWidth)

  // 满足 `prevWidth === nextWidth` 时，终端渲染执行该分支。
  if (prevWidth === nextWidth) {
    // 返回 `diffSameWidth(prev, next, region.x, endX, region.y, endY, cb)`，作为终端渲染这次计算的结果。
    return diffSameWidth(prev, next, region.x, endX, region.y, endY, cb)
  }
  // 返回 `diffDifferentWidth(prev, next, region.x, endX, region.y, endY, cb)`，作为终端渲染这次计算的结果。
  return diffDifferentWidth(prev, next, region.x, endX, region.y, endY, cb)
}

/**
 * Scan for the next cell that differs between two Int32Arrays.
 * Returns the number of matching cells before the first difference,
 * or `count` if all cells match. Tiny and pure for JIT inlining.
 */
// findNextDiff 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findNextDiff(
  a: Int32Array,
  b: Int32Array,
  w0: number,
  count: number,
): number {
  // 按索引扫描 `count`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < count; i++, w0 += 2) {
    // w1保存`w0 | 1`，供Ink 渲染层 screen后续判断或输出使用。
    const w1 = w0 | 1
    // `a[w0]` 与 `b[w0] || a[w1] !== b[w1]` 不一致时刷新派生状态，避免使用过期结果。
    if (a[w0] !== b[w0] || a[w1] !== b[w1]) return i
  }
  // 返回 `count`，作为终端渲染这次计算的结果。
  return count
}

/**
 * Diff one row where both screens are in bounds.
 * Scans for differences with findNextDiff, unpacks and calls cb for each.
 */
// diffRowBoth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function diffRowBoth(
  prevCells: Int32Array,
  nextCells: Int32Array,
  prev: Screen,
  next: Screen,
  ci: number,
  y: number,
  startX: number,
  endX: number,
  prevCell: Cell,
  nextCell: Cell,
  cb: DiffCallback,
): boolean {
  // x 命名 `startX`，让后续代码直接表达这个值的用途。
  let x = startX
  // while 使用 x < endX 完成终端渲染里的对应操作。
  while (x < endX) {
    // skip筛选`findNextDiff`，供终端渲染后续处理使用。
    const skip = findNextDiff(prevCells, nextCells, ci, endX - x)
    // Ink 渲染层 screen在这里处理 `x += skip`，完成这一小步状态转换。
    x += skip
    // Ink 渲染层 screen在这里处理 `ci += skip << 1`，完成这一小步状态转换。
    ci += skip << 1
    // 满足 `x >= endX` 时，终端渲染执行该分支。
    if (x >= endX) break
    // 调用 cellAtCI，触发终端渲染此处需要的副作用。
    cellAtCI(prev, ci, prevCell)
    // 调用 cellAtCI，触发终端渲染此处需要的副作用。
    cellAtCI(next, ci, nextCell)
    // 满足 `cb(x, y, prevCell, nextCell)` 时，终端渲染执行该分支。
    if (cb(x, y, prevCell, nextCell)) return true
    // Ink 渲染层 screen在这里处理 `x++`，完成这一小步状态转换。
    x++
    // Ink 渲染层 screen在这里处理 `ci += 2`，完成这一小步状态转换。
    ci += 2
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Emit removals for a row that only exists in prev (height shrank).
 * Cannot skip empty cells — the terminal still has content from the
 * previous frame that needs to be cleared.
 */
// diffRowRemoved 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function diffRowRemoved(
  prev: Screen,
  ci: number,
  y: number,
  startX: number,
  endX: number,
  prevCell: Cell,
  cb: DiffCallback,
): boolean {
  // 循环处理 `let x = startX; x < endX; x++, ci += 2`，让终端渲染逐项把同类条目按顺序走完。
  for (let x = startX; x < endX; x++, ci += 2) {
    // 调用 cellAtCI，触发终端渲染此处需要的副作用。
    cellAtCI(prev, ci, prevCell)
    // 满足 `cb(x, y, prevCell, undefined)` 时，终端渲染执行该分支。
    if (cb(x, y, prevCell, undefined)) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Emit additions for a row that only exists in next (height grew).
 * Skips empty/unwritten cells.
 */
// diffRowAdded 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function diffRowAdded(
  nextCells: Int32Array,
  next: Screen,
  ci: number,
  y: number,
  startX: number,
  endX: number,
  nextCell: Cell,
  cb: DiffCallback,
): boolean {
  // 循环处理 `let x = startX; x < endX; x++, ci += 2`，让终端渲染逐项把同类条目按顺序走完。
  for (let x = startX; x < endX; x++, ci += 2) {
    // 只有 `nextCells[ci] === 0 && nextCells[ci | 1] === 0` 满足时，终端渲染才执行该分支。
    if (nextCells[ci] === 0 && nextCells[ci | 1] === 0) continue
    // 调用 cellAtCI，触发终端渲染此处需要的副作用。
    cellAtCI(next, ci, nextCell)
    // 满足 `cb(x, y, undefined, nextCell)` 时，终端渲染执行该分支。
    if (cb(x, y, undefined, nextCell)) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Diff two screens with identical width.
 * Dispatches each row to a small, JIT-friendly function.
 */
// diffSameWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function diffSameWidth(
  prev: Screen,
  next: Screen,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  cb: DiffCallback,
): boolean {
  // prevCells 集合保存`prev.cells`，供后续判断或组装使用。
  const prevCells = prev.cells
  // nextCells 集合保存`next.cells`，供后续判断或组装使用。
  const nextCells = next.cells
  // width保存`prev.width`，供后续判断或组装使用。
  const width = prev.width
  // prevHeight 命名 `prev.height`，让后续代码直接表达这个值的用途。
  const prevHeight = prev.height
  // nextHeight 命名 `next.height`，让后续代码直接表达这个值的用途。
  const nextHeight = next.height
  // stride保存`width << 1`，供Ink 渲染层 screen后续判断或输出使用。
  const stride = width << 1

  // prevCell 集中保存Ink 渲染层 screen要一起传递的字段。
  const prevCell: Cell = {
    char: ' ',
    styleId: 0,
    width: CellWidth.Narrow,
    hyperlink: undefined,
  }
  // nextCell 集中保存Ink 渲染层 screen要一起传递的字段。
  const nextCell: Cell = {
    char: ' ',
    styleId: 0,
    width: CellWidth.Narrow,
    hyperlink: undefined,
  }

  // rowEndX保存`Math.min`，供终端渲染后续处理使用。
  const rowEndX = Math.min(endX, width)
  // rowCI保存`(startY * width + startX) << 1`，供后续判断或组装使用。
  let rowCI = (startY * width + startX) << 1

  // 循环处理 `let y = startY; y < endY; y++`，让终端渲染逐项把同类条目按顺序走完。
  for (let y = startY; y < endY; y++) {
    // prevIn保存`y < prevHeight`，供Ink 渲染层 screen后续判断或输出使用。
    const prevIn = y < prevHeight
    // nextIn 命名 `y < nextHeight`，让后续代码直接表达这个值的用途。
    const nextIn = y < nextHeight

    // 只有 `prevIn && nextIn` 满足时，终端渲染才执行该分支。
    if (prevIn && nextIn) {
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        diffRowBoth(
          prevCells,
          nextCells,
          prev,
          next,
          rowCI,
          y,
          startX,
          rowEndX,
          prevCell,
          nextCell,
          cb,
        )
      )
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
    // Ink 渲染层 screen在这里处理 `} else if (prevIn) {`，完成这一小步状态转换。
    } else if (prevIn) {
      // 满足 `diffRowRemoved(prev, rowCI, y, startX, rowEndX, prevCell, cb)` 时，终端渲染执行该分支。
      if (diffRowRemoved(prev, rowCI, y, startX, rowEndX, prevCell, cb))
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
    // Ink 渲染层 screen在这里处理 `} else if (nextIn) {`，完成这一小步状态转换。
    } else if (nextIn) {
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        diffRowAdded(nextCells, next, rowCI, y, startX, rowEndX, nextCell, cb)
      )
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
    }

    // Ink 渲染层 screen在这里处理 `rowCI += stride`，完成这一小步状态转换。
    rowCI += stride
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Fallback: diff two screens with different widths (resize).
 * Separate indices for prev and next cells arrays.
 */
// diffDifferentWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function diffDifferentWidth(
  prev: Screen,
  next: Screen,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  cb: DiffCallback,
): boolean {
  // prevWidth保存`prev.width`，供Ink 渲染层 screen后续判断或输出使用。
  const prevWidth = prev.width
  // nextWidth保存`next.width`，供Ink 渲染层 screen后续判断或输出使用。
  const nextWidth = next.width
  // prevCells 集合保存`prev.cells`，供后续判断或组装使用。
  const prevCells = prev.cells
  // nextCells 集合保存`next.cells`，供后续判断或组装使用。
  const nextCells = next.cells

  // prevCell 集中保存Ink 渲染层 screen要一起传递的字段。
  const prevCell: Cell = {
    char: ' ',
    styleId: 0,
    width: CellWidth.Narrow,
    hyperlink: undefined,
  }
  // nextCell 集中保存Ink 渲染层 screen要一起传递的字段。
  const nextCell: Cell = {
    char: ' ',
    styleId: 0,
    width: CellWidth.Narrow,
    hyperlink: undefined,
  }

  // prevStride 命名 `prevWidth << 1`，让后续代码直接表达这个值的用途。
  const prevStride = prevWidth << 1
  // nextStride保存`nextWidth << 1`，供后续判断或组装使用。
  const nextStride = nextWidth << 1
  // prevRowCI保存`(startY * prevWidth + startX) << 1`，供后续判断或组装使用。
  let prevRowCI = (startY * prevWidth + startX) << 1
  // nextRowCI保存`(startY * nextWidth + startX) << 1`，供Ink 渲染层 screen后续判断或输出使用。
  let nextRowCI = (startY * nextWidth + startX) << 1

  // 循环处理 `let y = startY; y < endY; y++`，让终端渲染逐项把同类条目按顺序走完。
  for (let y = startY; y < endY; y++) {
    // prevIn保存`y < prev.height`，供Ink 渲染层 screen后续判断或输出使用。
    const prevIn = y < prev.height
    // nextIn保存`y < next.height`，供Ink 渲染层 screen后续判断或输出使用。
    const nextIn = y < next.height
    // prevEndX保存`Math.min`，供终端渲染后续处理使用。
    const prevEndX = prevIn ? Math.min(endX, prevWidth) : startX
    // nextEndX保存`Math.min`，供终端渲染后续处理使用。
    const nextEndX = nextIn ? Math.min(endX, nextWidth) : startX
    // bothEndX保存`Math.min`，供终端渲染后续处理使用。
    const bothEndX = Math.min(prevEndX, nextEndX)

    // prevCI保存`prevRowCI`，供Ink 渲染层 screen后续判断或输出使用。
    let prevCI = prevRowCI
    // nextCI保存`nextRowCI`，供后续判断或组装使用。
    let nextCI = nextRowCI

    // 循环处理 `let x = startX; x < bothEndX; x++`，让终端渲染逐项把同类条目按顺序走完。
    for (let x = startX; x < bothEndX; x++) {
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        prevCells[prevCI] === nextCells[nextCI] &&
        prevCells[prevCI + 1] === nextCells[nextCI + 1]
      ) {
        // Ink 渲染层 screen在这里处理 `prevCI += 2`，完成这一小步状态转换。
        prevCI += 2
        // Ink 渲染层 screen在这里处理 `nextCI += 2`，完成这一小步状态转换。
        nextCI += 2
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
      // 调用 cellAtCI，触发终端渲染此处需要的副作用。
      cellAtCI(prev, prevCI, prevCell)
      // 调用 cellAtCI，触发终端渲染此处需要的副作用。
      cellAtCI(next, nextCI, nextCell)
      // Ink 渲染层 screen在这里处理 `prevCI += 2`，完成这一小步状态转换。
      prevCI += 2
      // Ink 渲染层 screen在这里处理 `nextCI += 2`，完成这一小步状态转换。
      nextCI += 2
      // 满足 `cb(x, y, prevCell, nextCell)` 时，终端渲染执行该分支。
      if (cb(x, y, prevCell, nextCell)) return true
    }

    // 满足 `prevEndX > bothEndX` 时，终端渲染执行该分支。
    if (prevEndX > bothEndX) {
      // prevCI更新为 `prevRowCI + ((bothEndX - startX) << 1)`，确保Ink 渲染层后续读取最新状态。
      prevCI = prevRowCI + ((bothEndX - startX) << 1)
      // 循环处理 `let x = bothEndX; x < prevEndX; x++`，让终端渲染逐项把同类条目按顺序走完。
      for (let x = bothEndX; x < prevEndX; x++) {
        // 调用 cellAtCI，触发终端渲染此处需要的副作用。
        cellAtCI(prev, prevCI, prevCell)
        // Ink 渲染层 screen在这里处理 `prevCI += 2`，完成这一小步状态转换。
        prevCI += 2
        // 满足 `cb(x, y, prevCell, undefined)` 时，终端渲染执行该分支。
        if (cb(x, y, prevCell, undefined)) return true
      }
    }

    // 满足 `nextEndX > bothEndX` 时，终端渲染执行该分支。
    if (nextEndX > bothEndX) {
      // nextCI更新为 `nextRowCI + ((bothEndX - startX) << 1)`，确保Ink 渲染层后续读取最新状态。
      nextCI = nextRowCI + ((bothEndX - startX) << 1)
      // 循环处理 `let x = bothEndX; x < nextEndX; x++`，让终端渲染逐项把同类条目按顺序走完。
      for (let x = bothEndX; x < nextEndX; x++) {
        // 只有 `nextCells[nextCI] === 0 && nextCells[nextCI | 1]` 满足时，终端渲染才执行该分支。
        if (nextCells[nextCI] === 0 && nextCells[nextCI | 1] === 0) {
          // Ink 渲染层 screen在这里处理 `nextCI += 2`，完成这一小步状态转换。
          nextCI += 2
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }
        // 调用 cellAtCI，触发终端渲染此处需要的副作用。
        cellAtCI(next, nextCI, nextCell)
        // Ink 渲染层 screen在这里处理 `nextCI += 2`，完成这一小步状态转换。
        nextCI += 2
        // 满足 `cb(x, y, undefined, nextCell)` 时，终端渲染执行该分支。
        if (cb(x, y, undefined, nextCell)) return true
      }
    }

    // Ink 渲染层 screen在这里处理 `prevRowCI += prevStride`，完成这一小步状态转换。
    prevRowCI += prevStride
    // Ink 渲染层 screen在这里处理 `nextRowCI += nextStride`，完成这一小步状态转换。
    nextRowCI += nextStride
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Mark a rectangular region as noSelect (exclude from text selection).
 * Clamps to screen bounds. Called from output.ts when a <NoSelect> box
 * renders. No damage tracking — noSelect doesn't affect terminal output,
 * only getSelectedText/applySelectionOverlay which read it directly.
 */
// markNoSelectRegion 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markNoSelectRegion(
  screen: Screen,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  // maxX保存`Math.min`，供终端渲染后续处理使用。
  const maxX = Math.min(x + width, screen.width)
  // maxY保存`Math.min`，供终端渲染后续处理使用。
  const maxY = Math.min(y + height, screen.height)
  // noSel保存`screen.noSelect`，供后续判断或组装使用。
  const noSel = screen.noSelect
  // stride 命名 `screen.width`，让后续代码直接表达这个值的用途。
  const stride = screen.width
  // 循环处理 `let row = Math.max(0, y); row < maxY; row++`，让终端渲染把同类条目按顺序走完。
  for (let row = Math.max(0, y); row < maxY; row++) {
    // rowStart保存`row * stride`，供后续判断或组装使用。
    const rowStart = row * stride
    // 调用 noSel.fill，触发终端渲染此处需要的副作用。
    noSel.fill(1, rowStart + Math.max(0, x), rowStart + maxX)
  }
}
