/**
 * CSI (Control Sequence Introducer) Types
 *
 * Enums and types for CSI command parameters.
 */

// 引入 ESC、ESC_TYPE、SEP，将 ./ansi.js 中已经封装好的能力接到本文件流程里。
import { ESC, ESC_TYPE, SEP } from './ansi.js'

// CSI_PREFIX保存`String.fromCharCode`，供终端渲染后续处理使用。
export const CSI_PREFIX = ESC + String.fromCharCode(ESC_TYPE.CSI)

/**
 * CSI parameter byte ranges
 */
// CSI_RANGE 集中保存Ink 渲染层 csi要一起传递的字段。
export const CSI_RANGE = {
  PARAM_START: 0x30,
  PARAM_END: 0x3f,
  INTERMEDIATE_START: 0x20,
  INTERMEDIATE_END: 0x2f,
  FINAL_START: 0x40,
  FINAL_END: 0x7e,
} as const

/** Check if a byte is a CSI parameter byte */
// isCSIParam 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCSIParam(byte: number): boolean {
  // 返回 `byte >= CSI_RANGE.PARAM_START && byte <= CSI_RANGE.PARAM_END`，作为终端渲染这次计算的结果。
  return byte >= CSI_RANGE.PARAM_START && byte <= CSI_RANGE.PARAM_END
}

/** Check if a byte is a CSI intermediate byte */
// isCSIIntermediate 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCSIIntermediate(byte: number): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    byte >= CSI_RANGE.INTERMEDIATE_START && byte <= CSI_RANGE.INTERMEDIATE_END
  )
}

/** Check if a byte is a CSI final byte (@ through ~) */
// isCSIFinal 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCSIFinal(byte: number): boolean {
  // 返回 `byte >= CSI_RANGE.FINAL_START && byte <= CSI_RANGE.FINAL_END`，作为终端渲染这次计算的结果。
  return byte >= CSI_RANGE.FINAL_START && byte <= CSI_RANGE.FINAL_END
}

/**
 * Generate a CSI sequence: ESC [ p1;p2;...;pN final
 * Single arg: treated as raw body
 * Multiple args: last is final byte, rest are params joined by ;
 */
// csi 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function csi(...args: (string | number)[]): string {
  // 参数列表为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (args.length === 0) return CSI_PREFIX
  // 满足 `args.length === 1` 时，终端渲染执行该分支。
  if (args.length === 1) return `${CSI_PREFIX}${args[0]}`
  // params 集合格式化`args.slice`，供终端渲染后续处理使用。
  const params = args.slice(0, -1)
  // final记录 `args[args.length - 1]` 是否成立，下一步按该结果分支。
  const final = args[args.length - 1]
  // 返回 ``${CSI_PREFIX}${params.join(SEP)}${final}``，作为终端渲染这次计算的结果。
  return `${CSI_PREFIX}${params.join(SEP)}${final}`
}

/**
 * CSI final bytes - the command identifier
 */
// CSI 集中保存Ink 渲染层 csi要一起传递的字段。
export const CSI = {
  // Cursor movement
  CUU: 0x41, // A - Cursor Up
  CUD: 0x42, // B - Cursor Down
  CUF: 0x43, // C - Cursor Forward
  CUB: 0x44, // D - Cursor Back
  CNL: 0x45, // E - Cursor Next Line
  CPL: 0x46, // F - Cursor Previous Line
  CHA: 0x47, // G - Cursor Horizontal Absolute
  CUP: 0x48, // H - Cursor Position
  CHT: 0x49, // I - Cursor Horizontal Tab
  VPA: 0x64, // d - Vertical Position Absolute
  HVP: 0x66, // f - Horizontal Vertical Position

  // Erase
  ED: 0x4a, // J - Erase in Display
  EL: 0x4b, // K - Erase in Line
  ECH: 0x58, // X - Erase Character

  // Insert/Delete
  IL: 0x4c, // L - Insert Lines
  DL: 0x4d, // M - Delete Lines
  ICH: 0x40, // @ - Insert Characters
  DCH: 0x50, // P - Delete Characters

  // Scroll
  SU: 0x53, // S - Scroll Up
  SD: 0x54, // T - Scroll Down

  // Modes
  SM: 0x68, // h - Set Mode
  RM: 0x6c, // l - Reset Mode

  // SGR
  SGR: 0x6d, // m - Select Graphic Rendition

  // Other
  DSR: 0x6e, // n - Device Status Report
  DECSCUSR: 0x71, // q - Set Cursor Style (with space intermediate)
  DECSTBM: 0x72, // r - Set Top and Bottom Margins
  SCOSC: 0x73, // s - Save Cursor Position
  SCORC: 0x75, // u - Restore Cursor Position
  CBT: 0x5a, // Z - Cursor Backward Tabulation
} as const

/**
 * Erase in Display regions (ED command parameter)
 */
// ERASE_DISPLAY 聚合成有序列表，保持后续遍历顺序稳定。
export const ERASE_DISPLAY = ['toEnd', 'toStart', 'all', 'scrollback'] as const

/**
 * Erase in Line regions (EL command parameter)
 */
// ERASE_LINE_REGION 聚合成有序列表，保持后续遍历顺序稳定。
export const ERASE_LINE_REGION = ['toEnd', 'toStart', 'all'] as const

/**
 * Cursor styles (DECSCUSR)
 */
// CursorStyle 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CursorStyle = 'block' | 'underline' | 'bar'

// CURSOR_STYLES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const CURSOR_STYLES: Array<{ style: CursorStyle; blinking: boolean }> = [
  { style: 'block', blinking: true }, // 0 - default
  { style: 'block', blinking: true }, // 1
  { style: 'block', blinking: false }, // 2
  { style: 'underline', blinking: true }, // 3
  { style: 'underline', blinking: false }, // 4
  { style: 'bar', blinking: true }, // 5
  { style: 'bar', blinking: false }, // 6
]

// Cursor movement generators

/** Move cursor up n lines (CSI n A) */
// cursorUp 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorUp(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'A')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'A')
}

/** Move cursor down n lines (CSI n B) */
// cursorDown 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorDown(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'B')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'B')
}

/** Move cursor forward n columns (CSI n C) */
// cursorForward 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorForward(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'C')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'C')
}

/** Move cursor back n columns (CSI n D) */
// cursorBack 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorBack(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'D')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'D')
}

/** Move cursor to column n (1-indexed) (CSI n G) */
// cursorTo 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorTo(col: number): string {
  // 返回 `csi(col, 'G')`，作为终端渲染这次计算的结果。
  return csi(col, 'G')
}

/** Move cursor to column 1 (CSI G) */
// CURSOR_LEFT保存`csi`，供终端渲染后续处理使用。
export const CURSOR_LEFT = csi('G')

/** Move cursor to row, col (1-indexed) (CSI row ; col H) */
// cursorPosition 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorPosition(row: number, col: number): string {
  // 返回 `csi(row, col, 'H')`，作为终端渲染这次计算的结果。
  return csi(row, col, 'H')
}

/** Move cursor to home position (CSI H) */
// CURSOR_HOME保存`csi`，供终端渲染后续处理使用。
export const CURSOR_HOME = csi('H')

/**
 * Move cursor relative to current position
 * Positive x = right, negative x = left
 * Positive y = down, negative y = up
 */
// cursorMove 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorMove(x: number, y: number): string {
  // 结果固定为 `''`，作为Ink 渲染层 csi后续展示或比较的基准。
  let result = ''
  // Horizontal first (matches ansi-escapes behavior)
  // 满足 `x < 0` 时，终端渲染执行该分支。
  if (x < 0) {
    // Ink 渲染层 csi在这里处理 `result += cursorBack(-x)`，完成这一小步状态转换。
    result += cursorBack(-x)
  // Ink 渲染层 csi在这里处理 `} else if (x > 0) {`，完成这一小步状态转换。
  } else if (x > 0) {
    // Ink 渲染层 csi在这里处理 `result += cursorForward(x)`，完成这一小步状态转换。
    result += cursorForward(x)
  }
  // Then vertical
  // 满足 `y < 0` 时，终端渲染执行该分支。
  if (y < 0) {
    // Ink 渲染层 csi在这里处理 `result += cursorUp(-y)`，完成这一小步状态转换。
    result += cursorUp(-y)
  // Ink 渲染层 csi在这里处理 `} else if (y > 0) {`，完成这一小步状态转换。
  } else if (y > 0) {
    // Ink 渲染层 csi在这里处理 `result += cursorDown(y)`，完成这一小步状态转换。
    result += cursorDown(y)
  }
  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

// Save/restore cursor position

/** Save cursor position (CSI s) */
// CURSOR_SAVE保存`csi`，供终端渲染后续处理使用。
export const CURSOR_SAVE = csi('s')

/** Restore cursor position (CSI u) */
// CURSOR_RESTORE保存`csi`，供终端渲染后续处理使用。
export const CURSOR_RESTORE = csi('u')

// Erase generators

/** Erase from cursor to end of line (CSI K) */
// eraseToEndOfLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseToEndOfLine(): string {
  // 返回 `csi('K')`，作为终端渲染这次计算的结果。
  return csi('K')
}

/** Erase from cursor to start of line (CSI 1 K) */
// eraseToStartOfLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseToStartOfLine(): string {
  // 返回 `csi(1, 'K')`，作为终端渲染这次计算的结果。
  return csi(1, 'K')
}

/** Erase entire line (CSI 2 K) */
// eraseLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseLine(): string {
  // 返回 `csi(2, 'K')`，作为终端渲染这次计算的结果。
  return csi(2, 'K')
}

/** Erase entire line - constant form */
// ERASE_LINE保存`csi`，供终端渲染后续处理使用。
export const ERASE_LINE = csi(2, 'K')

/** Erase from cursor to end of screen (CSI J) */
// eraseToEndOfScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseToEndOfScreen(): string {
  // 返回 `csi('J')`，作为终端渲染这次计算的结果。
  return csi('J')
}

/** Erase from cursor to start of screen (CSI 1 J) */
// eraseToStartOfScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseToStartOfScreen(): string {
  // 返回 `csi(1, 'J')`，作为终端渲染这次计算的结果。
  return csi(1, 'J')
}

/** Erase entire screen (CSI 2 J) */
// eraseScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseScreen(): string {
  // 返回 `csi(2, 'J')`，作为终端渲染这次计算的结果。
  return csi(2, 'J')
}

/** Erase entire screen - constant form */
// ERASE_SCREEN保存`csi`，供终端渲染后续处理使用。
export const ERASE_SCREEN = csi(2, 'J')

/** Erase scrollback buffer (CSI 3 J) */
// ERASE_SCROLLBACK保存`csi`，供终端渲染后续处理使用。
export const ERASE_SCROLLBACK = csi(3, 'J')

/**
 * Erase n lines starting from cursor line, moving cursor up
 * This erases each line and moves up, ending at column 1
 */
// eraseLines 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eraseLines(n: number): string {
  // 满足 `n <= 0` 时，终端渲染执行该分支。
  if (n <= 0) return ''
  // 结果固定为 `''`，作为Ink 渲染层 csi后续展示或比较的基准。
  let result = ''
  // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < n; i++) {
    // Ink 渲染层 csi在这里处理 `result += ERASE_LINE`，完成这一小步状态转换。
    result += ERASE_LINE
    // 满足 `i < n - 1` 时，终端渲染执行该分支。
    if (i < n - 1) {
      // Ink 渲染层 csi在这里处理 `result += cursorUp(1)`，完成这一小步状态转换。
      result += cursorUp(1)
    }
  }
  // Ink 渲染层 csi在这里处理 `result += CURSOR_LEFT`，完成这一小步状态转换。
  result += CURSOR_LEFT
  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

// Scroll

/** Scroll up n lines (CSI n S) */
// scrollUp 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function scrollUp(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'S')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'S')
}

/** Scroll down n lines (CSI n T) */
// scrollDown 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function scrollDown(n = 1): string {
  // 返回 `n === 0 ? '' : csi(n, 'T')`，作为终端渲染这次计算的结果。
  return n === 0 ? '' : csi(n, 'T')
}

/** Set scroll region (DECSTBM, CSI top;bottom r). 1-indexed, inclusive. */
// setScrollRegion 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setScrollRegion(top: number, bottom: number): string {
  // 返回 `csi(top, bottom, 'r')`，作为终端渲染这次计算的结果。
  return csi(top, bottom, 'r')
}

/** Reset scroll region to full screen (DECSTBM, CSI r). Homes the cursor. */
// RESET_SCROLL_REGION保存`csi`，供终端渲染后续处理使用。
export const RESET_SCROLL_REGION = csi('r')

// Bracketed paste markers (input from terminal, not output)
// These are sent by the terminal to delimit pasted content when
// bracketed paste mode is enabled (via DEC mode 2004)

/** Sent by terminal before pasted content (CSI 200 ~) */
// PASTE_START保存`csi`，供终端渲染后续处理使用。
export const PASTE_START = csi('200~')

/** Sent by terminal after pasted content (CSI 201 ~) */
// PASTE_END保存`csi`，供终端渲染后续处理使用。
export const PASTE_END = csi('201~')

// Focus event markers (input from terminal, not output)
// These are sent by the terminal when focus changes while
// focus events mode is enabled (via DEC mode 1004)

/** Sent by terminal when it gains focus (CSI I) */
// FOCUS_IN保存`csi`，供终端渲染后续处理使用。
export const FOCUS_IN = csi('I')

/** Sent by terminal when it loses focus (CSI O) */
// FOCUS_OUT保存`csi`，供终端渲染后续处理使用。
export const FOCUS_OUT = csi('O')

// Kitty keyboard protocol (CSI u)
// Enables enhanced key reporting with modifier information
// See: https://sw.kovidgoyal.net/kitty/keyboard-protocol/

/**
 * Enable Kitty keyboard protocol with basic modifier reporting
 * CSI > 1 u - pushes mode with flags=1 (disambiguate escape codes)
 * This makes Shift+Enter send CSI 13;2 u instead of just CR
 */
// ENABLE_KITTY_KEYBOARD保存`csi`，供终端渲染后续处理使用。
export const ENABLE_KITTY_KEYBOARD = csi('>1u')

/**
 * Disable Kitty keyboard protocol
 * CSI < u - pops the keyboard mode stack
 */
// DISABLE_KITTY_KEYBOARD保存`csi`，供终端渲染后续处理使用。
export const DISABLE_KITTY_KEYBOARD = csi('<u')

/**
 * Enable xterm modifyOtherKeys level 2.
 * tmux accepts this (not the kitty stack) to enable extended keys — when
 * extended-keys-format is csi-u, tmux then emits keys in kitty format.
 */
// ENABLE_MODIFY_OTHER_KEYS 集合保存`csi`，供终端渲染后续处理使用。
export const ENABLE_MODIFY_OTHER_KEYS = csi('>4;2m')

/**
 * Disable xterm modifyOtherKeys (reset to default).
 */
// DISABLE_MODIFY_OTHER_KEYS 集合保存`csi`，供终端渲染后续处理使用。
export const DISABLE_MODIFY_OTHER_KEYS = csi('>4m')
