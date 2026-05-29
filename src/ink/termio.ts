// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * ANSI Parser Module
 *
 * A semantic ANSI escape sequence parser inspired by ghostty, tmux, and iTerm2.
 *
 * Key features:
 * - Semantic output: produces structured actions, not string tokens
 * - Streaming: can parse input incrementally via Parser class
 * - Style tracking: maintains text style state across parse calls
 * - Comprehensive: supports SGR, CSI, OSC, ESC sequences
 *
 * Usage:
 *
 * ```typescript
 * import { Parser } from './termio.js'
 *
 * const parser = new Parser()
 * const actions = parser.feed('\x1b[31mred\x1b[0m')
 * // => [{ type: 'text', graphemes: [...], style: { fg: { type: 'named', name: 'red' }, ... } }]
 * ```
 */

// Parser
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { Parser } from './termio/parser.js'
// Types
// 导出类型定义，让其他模块沿用Ink 渲染层 termio的数据契约。
export type {
  Action,
  Color,
  CursorAction,
  CursorDirection,
  EraseAction,
  Grapheme,
  LinkAction,
  ModeAction,
  NamedColor,
  ScrollAction,
  TextSegment,
  TextStyle,
  TitleAction,
  UnderlineStyle,
} from './termio/types.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { colorsEqual, defaultStyle, stylesEqual } from './termio/types.js'
