/**
 * ANSI Parser - Semantic Types
 *
 * These types represent the semantic meaning of ANSI escape sequences,
 * not their string representation. Inspired by ghostty's action-based design.
 */

// =============================================================================
// Colors
// =============================================================================

/** Named colors from the 16-color palette */
// NamedColor 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type NamedColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite'

/** Color specification - can be named, indexed (256), or RGB */
// Color 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Color =
  | { type: 'named'; name: NamedColor }
  | { type: 'indexed'; index: number } // 0-255
  | { type: 'rgb'; r: number; g: number; b: number }
  | { type: 'default' }

// =============================================================================
// Text Styles
// =============================================================================

/** Underline style variants */
// UnderlineStyle 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UnderlineStyle =
  | 'none'
  | 'single'
  | 'double'
  | 'curly'
  | 'dotted'
  | 'dashed'

/** Text style attributes - represents current styling state */
// TextStyle 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextStyle = {
  bold: boolean
  dim: boolean
  italic: boolean
  underline: UnderlineStyle
  blink: boolean
  inverse: boolean
  hidden: boolean
  strikethrough: boolean
  overline: boolean
  fg: Color
  bg: Color
  underlineColor: Color
}

/** Create a default (reset) text style */
// defaultStyle 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function defaultStyle(): TextStyle {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    bold: false,
    dim: false,
    italic: false,
    underline: 'none',
    blink: false,
    inverse: false,
    hidden: false,
    strikethrough: false,
    overline: false,
    fg: { type: 'default' },
    bg: { type: 'default' },
    underlineColor: { type: 'default' },
  }
}

/** Check if two styles are equal */
// stylesEqual 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stylesEqual(a: TextStyle, b: TextStyle): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    a.bold === b.bold &&
    a.dim === b.dim &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.blink === b.blink &&
    a.inverse === b.inverse &&
    a.hidden === b.hidden &&
    a.strikethrough === b.strikethrough &&
    a.overline === b.overline &&
    colorsEqual(a.fg, b.fg) &&
    colorsEqual(a.bg, b.bg) &&
    colorsEqual(a.underlineColor, b.underlineColor)
  )
}

/** Check if two colors are equal */
// colorsEqual 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function colorsEqual(a: Color, b: Color): boolean {
  // `a.type` 与 `b.type` 不一致时刷新派生状态，避免使用过期结果。
  if (a.type !== b.type) return false
  // 按照 a.type 的取值选择终端渲染的具体处理分支。
  switch (a.type) {
    case 'named':
      // 返回 `a.name === (b as typeof a).name`，作为终端渲染这次计算的结果。
      return a.name === (b as typeof a).name
    case 'indexed':
      // 返回 `a.index === (b as typeof a).index`，作为终端渲染这次计算的结果。
      return a.index === (b as typeof a).index
    case 'rgb':
      // 返回 `(`，作为终端渲染这次计算的结果。
      return (
        a.r === (b as typeof a).r &&
        a.g === (b as typeof a).g &&
        a.b === (b as typeof a).b
      )
    case 'default':
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
  }
}

// =============================================================================
// Cursor Actions
// =============================================================================

// CursorDirection 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CursorDirection = 'up' | 'down' | 'forward' | 'back'

// CursorAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CursorAction =
  | { type: 'move'; direction: CursorDirection; count: number }
  | { type: 'position'; row: number; col: number }
  | { type: 'column'; col: number }
  | { type: 'row'; row: number }
  | { type: 'save' }
  | { type: 'restore' }
  | { type: 'show' }
  | { type: 'hide' }
  | {
      type: 'style'
      style: 'block' | 'underline' | 'bar'
      blinking: boolean
    }
  | { type: 'nextLine'; count: number }
  | { type: 'prevLine'; count: number }

// =============================================================================
// Erase Actions
// =============================================================================

// EraseAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type EraseAction =
  | { type: 'display'; region: 'toEnd' | 'toStart' | 'all' | 'scrollback' }
  | { type: 'line'; region: 'toEnd' | 'toStart' | 'all' }
  | { type: 'chars'; count: number }

// =============================================================================
// Scroll Actions
// =============================================================================

// ScrollAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScrollAction =
  | { type: 'up'; count: number }
  | { type: 'down'; count: number }
  | { type: 'setRegion'; top: number; bottom: number }

// =============================================================================
// Mode Actions
// =============================================================================

// ModeAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModeAction =
  | { type: 'alternateScreen'; enabled: boolean }
  | { type: 'bracketedPaste'; enabled: boolean }
  | { type: 'mouseTracking'; mode: 'off' | 'normal' | 'button' | 'any' }
  | { type: 'focusEvents'; enabled: boolean }

// =============================================================================
// Link Actions (OSC 8)
// =============================================================================

// LinkAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LinkAction =
  | { type: 'start'; url: string; params?: Record<string, string> }
  | { type: 'end' }

// =============================================================================
// Title Actions (OSC 0/1/2)
// =============================================================================

// TitleAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TitleAction =
  | { type: 'windowTitle'; title: string }
  | { type: 'iconName'; name: string }
  | { type: 'both'; title: string }

// =============================================================================
// Tab Status Action (OSC 21337)
// =============================================================================

/**
 * Per-tab chrome metadata. Tristate for each field:
 *  - property absent → not mentioned in sequence, no change
 *  - null → explicitly cleared (bare key or key= with empty value)
 *  - value → set to this
 */
// TabStatusAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TabStatusAction = {
  indicator?: Color | null
  status?: string | null
  statusColor?: Color | null
}

// =============================================================================
// Parsed Segments - The output of the parser
// =============================================================================

/** A segment of styled text */
// TextSegment 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextSegment = {
  type: 'text'
  text: string
  style: TextStyle
}

/** A grapheme (visual character unit) with width info */
// Grapheme 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Grapheme = {
  value: string
  width: 1 | 2 // Display width in columns
}

/** All possible parsed actions */
// Action 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Action =
  | { type: 'text'; graphemes: Grapheme[]; style: TextStyle }
  | { type: 'cursor'; action: CursorAction }
  | { type: 'erase'; action: EraseAction }
  | { type: 'scroll'; action: ScrollAction }
  | { type: 'mode'; action: ModeAction }
  | { type: 'link'; action: LinkAction }
  | { type: 'title'; action: TitleAction }
  | { type: 'tabStatus'; action: TabStatusAction }
  | { type: 'sgr'; params: string } // Select Graphic Rendition (style change)
  | { type: 'bell' }
  | { type: 'reset' } // Full terminal reset (ESC c)
  | { type: 'unknown'; sequence: string } // Unrecognized sequence
