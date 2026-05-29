// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { env } from '../utils/env.js'

// The former is better vertically aligned, but isn't usually supported on Windows/Linux
// BLACK_CIRCLE标记figures是否启用对应路径。
export const BLACK_CIRCLE = env.platform === 'darwin' ? '⏺' : '●'
// BULLET_OPERATOR保存`'∙'`，作为后续固定文本处理的输入。
export const BULLET_OPERATOR = '∙'
// TEARDROP_ASTERISK保存`'✻'`，作为后续固定文本处理的输入。
export const TEARDROP_ASTERISK = '✻'
// UP_ARROW固定为 `'\u2191' // ↑ - used for opus 1m merge notice`，作为figures后续展示或比较的基准。
export const UP_ARROW = '\u2191' // ↑ - used for opus 1m merge notice
// DOWN_ARROW 命名 `'\u2193' // ↓ - used for scroll hint`，让后续代码直接表达这个值的用途。
export const DOWN_ARROW = '\u2193' // ↓ - used for scroll hint
// LIGHTNING_BOLT 命名 `'↯' // \u21af - used for fast mode indicator`，让后续代码直接表达这个值的用途。
export const LIGHTNING_BOLT = '↯' // \u21af - used for fast mode indicator
// EFFORT_LOW保存`'○' // \u25cb - effort level: low`，作为后续固定文本处理的输入。
export const EFFORT_LOW = '○' // \u25cb - effort level: low
// EFFORT_MEDIUM保存`'◐' // \u25d0 - effort level: medium`，作为后续固定文本处理的输入。
export const EFFORT_MEDIUM = '◐' // \u25d0 - effort level: medium
// EFFORT_HIGH 命名 `'●' // \u25cf - effort level: high`，让后续代码直接表达这个值的用途。
export const EFFORT_HIGH = '●' // \u25cf - effort level: high
// EFFORT_MAX保存`max`，供figures后续处理使用。
export const EFFORT_MAX = '◉' // \u25c9 - effort level: max (Opus 4.6 only)

// Media/trigger status indicators
// PLAY_ICON固定为 `'\u25b6' // ▶`，作为figures后续展示或比较的基准。
export const PLAY_ICON = '\u25b6' // ▶
// PAUSE_ICON保存`'\u23f8' // ⏸`，作为后续固定文本处理的输入。
export const PAUSE_ICON = '\u23f8' // ⏸

// MCP subscription indicators
// REFRESH_ARROW 命名 `'\u21bb' // ↻ - used for resource update indicator`，让后续代码直接表达这个值的用途。
export const REFRESH_ARROW = '\u21bb' // ↻ - used for resource update indicator
// CHANNEL_ARROW 命名 `'\u2190' // ← - inbound channel message indicator`，让后续代码直接表达这个值的用途。
export const CHANNEL_ARROW = '\u2190' // ← - inbound channel message indicator
// INJECTED_ARROW 命名 `'\u2192' // → - cross-session injected message indicator`，让后续代码直接表达这个值的用途。
export const INJECTED_ARROW = '\u2192' // → - cross-session injected message indicator
// FORK_GLYPH保存`'\u2442' // ⑂ - fork directive indicator`，作为后续固定文本处理的输入。
export const FORK_GLYPH = '\u2442' // ⑂ - fork directive indicator

// Review status indicators (ultrareview diamond states)
// DIAMOND_OPEN保存`'\u25c7' // ◇ - running`，作为后续固定文本处理的输入。
export const DIAMOND_OPEN = '\u25c7' // ◇ - running
// DIAMOND_FILLED保存`'\u25c6' // ◆ - completed/failed`，作为后续固定文本处理的输入。
export const DIAMOND_FILLED = '\u25c6' // ◆ - completed/failed
// REFERENCE_MARK 命名 `'\u203b' // ※ - komejirushi, away-summary recap marker`，让后续代码直接表达这个值的用途。
export const REFERENCE_MARK = '\u203b' // ※ - komejirushi, away-summary recap marker

// Issue flag indicator
// FLAG_ICON 命名 `'\u2691' // ⚑ - used for issue flag banner`，让后续代码直接表达这个值的用途。
export const FLAG_ICON = '\u2691' // ⚑ - used for issue flag banner

// Blockquote indicator
// BLOCKQUOTE_BAR保存`'\u258e' // ▎ - left one-quarter block, used as blockquot...`，作为后续固定文本处理的输入。
export const BLOCKQUOTE_BAR = '\u258e' // ▎ - left one-quarter block, used as blockquote line prefix
// HEAVY_HORIZONTAL 命名 `'\u2501' // ━ - heavy box-drawing horizontal`，让后续代码直接表达这个值的用途。
export const HEAVY_HORIZONTAL = '\u2501' // ━ - heavy box-drawing horizontal

// Bridge status indicators
// BRIDGE_SPINNER_FRAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const BRIDGE_SPINNER_FRAMES = [
  '\u00b7|\u00b7',
  '\u00b7/\u00b7',
  '\u00b7\u2014\u00b7',
  '\u00b7\\\u00b7',
]
// BRIDGE_READY_INDICATOR 命名 `'\u00b7\u2714\ufe0e\u00b7'`，让后续代码直接表达这个值的用途。
export const BRIDGE_READY_INDICATOR = '\u00b7\u2714\ufe0e\u00b7'
// BRIDGE_FAILED_INDICATOR保存`'\u00d7'`，作为后续固定文本处理的输入。
export const BRIDGE_FAILED_INDICATOR = '\u00d7'
