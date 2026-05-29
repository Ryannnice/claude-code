/**
 * Terminal dark/light mode detection for the 'auto' theme setting.
 *
 * Detection is based on the terminal's actual background color (queried via
 * OSC 11 by systemThemeWatcher.ts) rather than the OS appearance setting —
 * a dark terminal on a light-mode OS should still resolve to 'dark'.
 *
 * The detected theme is cached module-level so callers can resolve 'auto'
 * without awaiting the async OSC round-trip. The cache is seeded from
 * $COLORFGBG (synchronous, set by some terminals at launch) and then
 * updated by the watcher once the OSC 11 response arrives.
 */

// 类型依赖 { ThemeName, ThemeSetting } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { ThemeName, ThemeSetting } from './theme.js'

// SystemTheme 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SystemTheme = 'dark' | 'light'

// cachedSystemTheme 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let cachedSystemTheme: SystemTheme | undefined

/**
 * Get the current terminal theme. Cached after first detection; the watcher
 * updates the cache on live changes.
 */
// getSystemThemeName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSystemThemeName(): SystemTheme {
  // 满足 `cachedSystemTheme === undefined` 时，共享工具执行该分支。
  if (cachedSystemTheme === undefined) {
    // cachedSystemTheme 缓存更新为 `detectFromColorFgBg() ?? 'dark'`，确保共享工具后续读取最新状态。
    cachedSystemTheme = detectFromColorFgBg() ?? 'dark'
  }
  // 返回 `cachedSystemTheme`，作为共享工具这次计算的结果。
  return cachedSystemTheme
}

/**
 * Update the cached terminal theme. Called by the watcher when the OSC 11
 * query returns so non-React call sites stay in sync.
 */
// setCachedSystemTheme 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCachedSystemTheme(theme: SystemTheme): void {
  // cachedSystemTheme 缓存更新为 `theme`，确保共享工具后续读取最新状态。
  cachedSystemTheme = theme
}

/**
 * Resolve a ThemeSetting (which may be 'auto') to a concrete ThemeName.
 */
// resolveThemeSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveThemeSetting(setting: ThemeSetting): ThemeName {
  // 当 `setting` 匹配 `'auto'` 时，共享工具执行对应分支。
  if (setting === 'auto') {
    // 返回 `getSystemThemeName()`，作为共享工具这次计算的结果。
    return getSystemThemeName()
  }
  // 返回 `setting`，作为共享工具这次计算的结果。
  return setting
}

/**
 * Parse an OSC color response data string into a theme.
 *
 * Accepts XParseColor formats returned by OSC 10/11 queries:
 * - `rgb:R/G/B` where each component is 1–4 hex digits (each scaled to
 *   [0, 16^n - 1] for n digits). This is what xterm, iTerm2, Terminal.app,
 *   Ghostty, kitty, Alacritty, etc. return.
 * - `#RRGGBB` / `#RRRRGGGGBBBB` (rare, but cheap to accept).
 *
 * Returns undefined for unrecognized formats so callers can fall back.
 */
// themeFromOscColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function themeFromOscColor(data: string): SystemTheme | undefined {
  // rgb解析`parseOscRgb`，供共享工具后续处理使用。
  const rgb = parseOscRgb(data)
  // rgb缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!rgb) return undefined
  // ITU-R BT.709 relative luminance. Midpoint split: > 0.5 is light.
  // luminance保存`0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b`，供共享工具 system Theme后续判断或输出使用。
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
  // 返回 `luminance > 0.5 ? 'light' : 'dark'`，作为共享工具这次计算的结果。
  return luminance > 0.5 ? 'light' : 'dark'
}

// Rgb 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Rgb = { r: number; g: number; b: number }

// parseOscRgb 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseOscRgb(data: string): Rgb | undefined {
  // rgb:RRRR/GGGG/BBBB — each component is 1–4 hex digits.
  // Some terminals append an alpha component (rgba:…/…/…/…); ignore it.
  // rgbMatch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rgbMatch =
    /^rgba?:([0-9a-f]{1,4})\/([0-9a-f]{1,4})\/([0-9a-f]{1,4})/i.exec(data)
  // 满足 `rgbMatch` 时，共享工具执行该分支。
  if (rgbMatch) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      r: hexComponent(rgbMatch[1]!),
      g: hexComponent(rgbMatch[2]!),
      b: hexComponent(rgbMatch[3]!),
    }
  }
  // #RRGGBB or #RRRRGGGGBBBB — split into three equal hex runs.
  // hashMatch保存`i.exec`，供共享工具后续处理使用。
  const hashMatch = /^#([0-9a-f]+)$/i.exec(data)
  // 只有 `hashMatch && hashMatch[1]!.length % 3 === 0` 满足时，共享工具才执行该分支。
  if (hashMatch && hashMatch[1]!.length % 3 === 0) {
    // hex读取 `hashMatch[1]!` 对应条目，后续围绕该成员继续处理。
    const hex = hashMatch[1]!
    // n保存 `hex.length / 3` 的判断结果，供共享工具 system Theme后续分支直接复用。
    const n = hex.length / 3
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      r: hexComponent(hex.slice(0, n)),
      g: hexComponent(hex.slice(n, 2 * n)),
      b: hexComponent(hex.slice(2 * n)),
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/** Normalize a 1–4 digit hex component to [0, 1]. */
// hexComponent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hexComponent(hex: string): number {
  // max记录 `16 ** hex.length - 1` 是否成立，下一步按该结果分支。
  const max = 16 ** hex.length - 1
  // 返回 `parseInt(hex, 16) / max`，作为共享工具这次计算的结果。
  return parseInt(hex, 16) / max
}

/**
 * Read $COLORFGBG for a synchronous initial guess before the OSC 11
 * round-trip completes. Format is `fg;bg` (or `fg;other;bg`) where values
 * are ANSI color indices. rxvt convention: bg 0–6 or 8 are dark; bg 7
 * and 9–15 are light. Only set by some terminals (rxvt-family, Konsole,
 * iTerm2 with the option enabled), so this is a best-effort hint.
 */
// detectFromColorFgBg 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectFromColorFgBg(): SystemTheme | undefined {
  // colorfgbg读取 `process.env['COLORFGBG']` 对应条目，后续围绕该成员继续处理。
  const colorfgbg = process.env['COLORFGBG']
  // colorfgbg缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!colorfgbg) return undefined
  // 片段列表格式化`colorfgbg.split`，供共享工具后续处理使用。
  const parts = colorfgbg.split(';')
  // bg保存 `parts[parts.length - 1]` 的判断结果，供共享工具 system Theme后续分支直接复用。
  const bg = parts[parts.length - 1]
  // 只有 `bg === undefined || bg === ''` 满足时，共享工具才执行该分支。
  if (bg === undefined || bg === '') return undefined
  // bgNum保存`Number`，供共享工具后续处理使用。
  const bgNum = Number(bg)
  // 只有 `!Number.isInteger(bgNum) || bgNum < 0 || bgNum > 15` 满足时，共享工具才执行该分支。
  if (!Number.isInteger(bgNum) || bgNum < 0 || bgNum > 15) return undefined
  // 0–6 and 8 are dark ANSI colors; 7 (white) and 9–15 (bright) are light.
  // 返回 `bgNum <= 6 || bgNum === 8 ? 'dark' : 'light'`，作为共享工具这次计算的结果。
  return bgNum <= 6 || bgNum === 8 ? 'dark' : 'light'
}
