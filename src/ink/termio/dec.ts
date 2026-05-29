/**
 * DEC (Digital Equipment Corporation) Private Mode Sequences
 *
 * DEC private modes use CSI ? N h (set) and CSI ? N l (reset) format.
 * These are terminal-specific extensions to the ANSI standard.
 */

// 引入 csi，将 ./csi.js 中已经封装好的能力接到本文件流程里。
import { csi } from './csi.js'

/**
 * DEC private mode numbers
 */
// DEC 集中保存Ink 渲染层 dec要一起传递的字段。
export const DEC = {
  CURSOR_VISIBLE: 25,
  ALT_SCREEN: 47,
  ALT_SCREEN_CLEAR: 1049,
  MOUSE_NORMAL: 1000,
  MOUSE_BUTTON: 1002,
  MOUSE_ANY: 1003,
  MOUSE_SGR: 1006,
  FOCUS_EVENTS: 1004,
  BRACKETED_PASTE: 2004,
  SYNCHRONIZED_UPDATE: 2026,
} as const

/** Generate CSI ? N h sequence (set mode) */
// decset 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decset(mode: number): string {
  // 返回 `csi(`?${mode}h`)`，作为终端渲染这次计算的结果。
  return csi(`?${mode}h`)
}

/** Generate CSI ? N l sequence (reset mode) */
// decreset 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decreset(mode: number): string {
  // 返回 `csi(`?${mode}l`)`，作为终端渲染这次计算的结果。
  return csi(`?${mode}l`)
}

// Pre-generated sequences for common modes
// BSU保存`decset`，供终端渲染后续处理使用。
export const BSU = decset(DEC.SYNCHRONIZED_UPDATE)
// ESU保存`decreset`，供终端渲染后续处理使用。
export const ESU = decreset(DEC.SYNCHRONIZED_UPDATE)
// EBP保存`decset`，供终端渲染后续处理使用。
export const EBP = decset(DEC.BRACKETED_PASTE)
// DBP保存`decreset`，供终端渲染后续处理使用。
export const DBP = decreset(DEC.BRACKETED_PASTE)
// EFE保存`decset`，供终端渲染后续处理使用。
export const EFE = decset(DEC.FOCUS_EVENTS)
// DFE保存`decreset`，供终端渲染后续处理使用。
export const DFE = decreset(DEC.FOCUS_EVENTS)
// SHOW_CURSOR保存`decset`，供终端渲染后续处理使用。
export const SHOW_CURSOR = decset(DEC.CURSOR_VISIBLE)
// HIDE_CURSOR保存`decreset`，供终端渲染后续处理使用。
export const HIDE_CURSOR = decreset(DEC.CURSOR_VISIBLE)
// ENTER_ALT_SCREEN保存`decset`，供终端渲染后续处理使用。
export const ENTER_ALT_SCREEN = decset(DEC.ALT_SCREEN_CLEAR)
// EXIT_ALT_SCREEN保存`decreset`，供终端渲染后续处理使用。
export const EXIT_ALT_SCREEN = decreset(DEC.ALT_SCREEN_CLEAR)
// Mouse tracking: 1000 reports button press/release/wheel, 1002 adds drag
// events (button-motion), 1003 adds all-motion (no button held — for
// hover), 1006 uses SGR format (CSI < btn;col;row M/m) instead of legacy
// X10 bytes. Combined: wheel + click/drag for selection + hover.
// ENABLE_MOUSE_TRACKING 先占位，稍后的条件分支会根据实际输入补齐它。
export const ENABLE_MOUSE_TRACKING =
  decset(DEC.MOUSE_NORMAL) +
  decset(DEC.MOUSE_BUTTON) +
  decset(DEC.MOUSE_ANY) +
  decset(DEC.MOUSE_SGR)
// DISABLE_MOUSE_TRACKING 先占位，稍后的条件分支会根据实际输入补齐它。
export const DISABLE_MOUSE_TRACKING =
  decreset(DEC.MOUSE_SGR) +
  decreset(DEC.MOUSE_ANY) +
  decreset(DEC.MOUSE_BUTTON) +
  decreset(DEC.MOUSE_NORMAL)
