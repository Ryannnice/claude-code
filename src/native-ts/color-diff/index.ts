/**
 * Pure TypeScript port of vendor/color-diff-src.
 *
 * The Rust version uses syntect+bat for syntax highlighting and the similar
 * crate for word diffing. This port uses highlight.js (already a dep via
 * cli-highlight) and the diff npm package's diffArrays.
 *
 * API matches vendor/color-diff-src/index.d.ts exactly so callers don't change.
 *
 * Key semantic differences from the native module:
 * - Syntax highlighting uses highlight.js. Scope colors were measured from
 *   syntect's output so most tokens match, but hljs's grammar has gaps:
 *   plain identifiers and operators like `=` `:` aren't scoped, so they
 *   render in default fg instead of white/pink. Output structure (line
 *   numbers, markers, backgrounds, word-diff) is identical.
 * - BAT_THEME env support is a stub: highlight.js has no bat theme set, so
 *   getSyntaxTheme always returns the default for the given Claude theme.
 */

// 引入 diffArrays，将 diff 中已经封装好的能力接到本文件流程里。
import { diffArrays } from 'diff'
// 类型依赖 * as hljsNamespace 来自 highlight.js，用于校准index的数据契约。
import type * as hljsNamespace from 'highlight.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, extname } from 'path'

// Lazy: defers loading highlight.js until first render. The full bundle
// registers 190+ language grammars at require time (~50MB, 100-200ms on
// macOS, several× that on Windows). With a top-level import, any caller
// chunk that reaches this module — including test/preload.ts via
// StructuredDiff.tsx → colorDiff.ts — pays that cost at module-eval time
// and carries the heap for the rest of the process. On Windows CI this
// pushed later tests in the same shard into GC-pause territory and a
// beforeEach/afterEach hook timeout (officialRegistry.test.ts, PR #24150).
// Same lazy pattern the NAPI wrapper used for dlopen.
// HLJSApi 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type HLJSApi = typeof hljsNamespace
// cachedHljs 缓存保存`null`，作为后续空值处理的输入。
let cachedHljs: HLJSApi | null = null
// hljs 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hljs(): HLJSApi {
  // 满足 `cachedHljs` 时，index执行该分支。
  if (cachedHljs) return cachedHljs
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // mod保存`require`，供index后续处理使用。
  const mod = require('highlight.js')
  // highlight.js uses `export =` (CJS). Under bun/ESM the interop wraps it
  // in .default; under node CJS the module IS the API. Check at runtime.
  // cachedHljs 缓存更新为 `'default' in mod && mod.default ? mod.default : mod`，确保index后续读取最新状态。
  cachedHljs = 'default' in mod && mod.default ? mod.default : mod
  // 返回 `cachedHljs!`，作为index这次计算的结果。
  return cachedHljs!
}

// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'

// ---------------------------------------------------------------------------
// Public API types (match vendor/color-diff-src/index.d.ts)
// ---------------------------------------------------------------------------

// Hunk 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type Hunk = {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

// SyntaxTheme 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type SyntaxTheme = {
  theme: string
  source: string | null
}

// NativeModule 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type NativeModule = {
  ColorDiff: typeof ColorDiff
  ColorFile: typeof ColorFile
  // 这个回调绑定到 getSyntaxTheme: (themeName: string) => SyntaxTheme，负责index在该局部场景下的响应。
  getSyntaxTheme: (themeName: string) => SyntaxTheme
}

// ---------------------------------------------------------------------------
// Color / ANSI escape helpers
// ---------------------------------------------------------------------------

// Color 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Color = { r: number; g: number; b: number; a: number }
// Style 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Style = { foreground: Color; background: Color }
// Block 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Block = [Style, string]
// ColorMode 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type ColorMode = 'truecolor' | 'color256' | 'ansi'

// RESET固定为 `'\x1b[0m'`，作为index后续展示或比较的基准。
const RESET = '\x1b[0m'
// DIM 命名 `'\x1b[2m'`，让后续代码直接表达这个值的用途。
const DIM = '\x1b[2m'
// UNDIM保存`'\x1b[22m'`，作为后续固定文本处理的输入。
const UNDIM = '\x1b[22m'

// rgb 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rgb(r: number, g: number, b: number): Color {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { r, g, b, a: 255 }
}

// ansiIdx 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ansiIdx(index: number): Color {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { r: index, g: 0, b: 0, a: 0 }
}

// Sentinel: a=1 means "terminal default" (matches bat convention)
// DEFAULT_BG 集中保存index要一起传递的字段。
const DEFAULT_BG: Color = { r: 0, g: 0, b: 0, a: 1 }

// detectColorMode 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectColorMode(theme: string): ColorMode {
  // 满足 `theme.includes('ansi')` 时，index执行该分支。
  if (theme.includes('ansi')) return 'ansi'
  // ct 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const ct = process.env.COLORTERM ?? ''
  // 返回 `ct === 'truecolor' || ct === '24bit' ? 'truecolor' : 'color256'`，作为index这次计算的结果。
  return ct === 'truecolor' || ct === '24bit' ? 'truecolor' : 'color256'
}

// Port of ansi_colours::ansi256_from_rgb — approximates RGB to the xterm-256
// palette (6x6x6 cube + 24 greys). Picks the perceptually closest index by
// comparing cube vs grey-ramp candidates, like the Rust crate.
// CUBE_LEVELS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const CUBE_LEVELS = [0, 95, 135, 175, 215, 255]
// ansi256FromRgb 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ansi256FromRgb(r: number, g: number, b: number): number {
  // q封装成回调，供index在事件触发或异步步骤中调用。
  const q = (c: number) =>
    c < 48 ? 0 : c < 115 ? 1 : c < 155 ? 2 : c < 195 ? 3 : c < 235 ? 4 : 5
  // qr保存`q`，供index后续处理使用。
  const qr = q(r)
  // qg保存`q`，供index后续处理使用。
  const qg = q(g)
  // qb保存`q`，供index后续处理使用。
  const qb = q(b)
  // cubeIdx保存`16 + 36 * qr + 6 * qg + qb`，供后续判断或组装使用。
  const cubeIdx = 16 + 36 * qr + 6 * qg + qb
  // Grey ramp candidate (232-255, levels 8..238 step 10). Beyond the ramp's
  // range the cube corner is the only option — ansi_colours snaps 248,248,242
  // to 231 (cube white), not 255 (ramp top).
  // grey保存`Math.round`，供index后续处理使用。
  const grey = Math.round((r + g + b) / 3)
  // 满足 `grey < 5` 时，index执行该分支。
  if (grey < 5) return 16
  // 组合条件 `grey > 244 && qr === qg && qg === qb` 成立时，index才启用这条专门路径。
  if (grey > 244 && qr === qg && qg === qb) return cubeIdx
  // greyLevel保存`Math.max`，供index后续处理使用。
  const greyLevel = Math.max(0, Math.min(23, Math.round((grey - 8) / 10)))
  // greyIdx保存`232 + greyLevel`，供后续判断或组装使用。
  const greyIdx = 232 + greyLevel
  // greyRgb保存`8 + greyLevel * 10`，供后续判断或组装使用。
  const greyRgb = 8 + greyLevel * 10
  // cr 命名 `CUBE_LEVELS[qr]!`，让后续代码直接表达这个值的用途。
  const cr = CUBE_LEVELS[qr]!
  // cg保存`CUBE_LEVELS[qg]!`，供index后续判断或输出使用。
  const cg = CUBE_LEVELS[qg]!
  // cb读取 `CUBE_LEVELS[qb]!` 对应条目，后续围绕该成员继续处理。
  const cb = CUBE_LEVELS[qb]!
  // dCube 命名 `(r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2`，让后续代码直接表达这个值的用途。
  const dCube = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
  // dGrey 命名 `(r - greyRgb) ** 2 + (g - greyRgb) ** 2 + (b - greyRgb) *...`，让后续代码直接表达这个值的用途。
  const dGrey = (r - greyRgb) ** 2 + (g - greyRgb) ** 2 + (b - greyRgb) ** 2
  // 返回 `dGrey < dCube ? greyIdx : cubeIdx`，作为index这次计算的结果。
  return dGrey < dCube ? greyIdx : cubeIdx
}

// colorToEscape 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function colorToEscape(c: Color, fg: boolean, mode: ColorMode): string {
  // alpha=0: palette index encoded in .r (bat's ansi-theme convention)
  // 满足 `c.a === 0` 时，index执行该分支。
  if (c.a === 0) {
    // idx 命名 `c.r`，让后续代码直接表达这个值的用途。
    const idx = c.r
    // 满足 `idx < 8) return `\x1b[${(fg ? 30 : 40` 时，index执行该分支。
    if (idx < 8) return `\x1b[${(fg ? 30 : 40) + idx}m`
    // 满足 `idx < 16) return `\x1b[${(fg ? 90 : 100) + (idx - 8` 时，index执行该分支。
    if (idx < 16) return `\x1b[${(fg ? 90 : 100) + (idx - 8)}m`
    // 返回 ``\x1b[${fg ? 38 : 48};5;${idx}m``，作为index这次计算的结果。
    return `\x1b[${fg ? 38 : 48};5;${idx}m`
  }
  // alpha=1: terminal default
  // 满足 `c.a === 1` 时，index执行该分支。
  if (c.a === 1) return fg ? '\x1b[39m' : '\x1b[49m'

  // codeType 命名 `fg ? 38 : 48`，让后续代码直接表达这个值的用途。
  const codeType = fg ? 38 : 48
  // 当 `mode` 匹配 `'truecolor'` 时，index执行对应分支。
  if (mode === 'truecolor') {
    // 返回 ``\x1b[${codeType};2;${c.r};${c.g};${c.b}m``，作为index这次计算的结果。
    return `\x1b[${codeType};2;${c.r};${c.g};${c.b}m`
  }
  // 返回 ``\x1b[${codeType};5;${ansi256FromRgb(c.r, c.g, c.b)}m``，作为index这次计算的结果。
  return `\x1b[${codeType};5;${ansi256FromRgb(c.r, c.g, c.b)}m`
}

// asTerminalEscaped 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function asTerminalEscaped(
  blocks: readonly Block[],
  mode: ColorMode,
  skipBackground: boolean,
  dim: boolean,
): string {
  // out 命名 `dim ? RESET + DIM : RESET`，让后续代码直接表达这个值的用途。
  let out = dim ? RESET + DIM : RESET
  // 循环处理 `const [style, text] of blocks`，让index逐项把同类条目按顺序走完。
  for (const [style, text] of blocks) {
    // index在这里处理 `out += colorToEscape(style.foreground, true, mode)`，完成这一小步状态转换。
    out += colorToEscape(style.foreground, true, mode)
    // skipBackground缺失时提前走兜底路径，避免index继续依赖无效输入。
    if (!skipBackground) {
      // index在这里处理 `out += colorToEscape(style.background, false, mode)`，完成这一小步状态转换。
      out += colorToEscape(style.background, false, mode)
    }
    // index在这里处理 `out += text`，完成这一小步状态转换。
    out += text
  }
  // 返回 `out + RESET`，作为index这次计算的结果。
  return out + RESET
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

// Marker 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Marker = '+' | '-' | ' '

// Theme 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Theme = {
  addLine: Color
  addWord: Color
  addDecoration: Color
  deleteLine: Color
  deleteWord: Color
  deleteDecoration: Color
  foreground: Color
  background: Color
  scopes: Record<string, Color>
}

// defaultSyntaxThemeName 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function defaultSyntaxThemeName(themeName: string): string {
  // 满足 `themeName.includes('ansi')` 时，index执行该分支。
  if (themeName.includes('ansi')) return 'ansi'
  // 满足 `themeName.includes('dark')` 时，index执行该分支。
  if (themeName.includes('dark')) return 'Monokai Extended'
  // 返回 `'GitHub'`，作为index这次计算的结果。
  return 'GitHub'
}

// highlight.js scope → syntect Monokai Extended foreground (measured from the
// Rust module's output so colors match the original exactly)
// MONOKAI_SCOPES 集合 集中保存index要一起传递的字段。
const MONOKAI_SCOPES: Record<string, Color> = {
  keyword: rgb(249, 38, 114),
  _storage: rgb(102, 217, 239),
  built_in: rgb(166, 226, 46),
  type: rgb(166, 226, 46),
  literal: rgb(190, 132, 255),
  number: rgb(190, 132, 255),
  string: rgb(230, 219, 116),
  title: rgb(166, 226, 46),
  'title.function': rgb(166, 226, 46),
  'title.class': rgb(166, 226, 46),
  'title.class.inherited': rgb(166, 226, 46),
  params: rgb(253, 151, 31),
  comment: rgb(117, 113, 94),
  meta: rgb(117, 113, 94),
  attr: rgb(166, 226, 46),
  attribute: rgb(166, 226, 46),
  variable: rgb(255, 255, 255),
  'variable.language': rgb(255, 255, 255),
  property: rgb(255, 255, 255),
  operator: rgb(249, 38, 114),
  punctuation: rgb(248, 248, 242),
  symbol: rgb(190, 132, 255),
  regexp: rgb(230, 219, 116),
  subst: rgb(248, 248, 242),
}

// highlight.js scope → syntect GitHub-light foreground (measured from Rust)
// GITHUB_SCOPES 集合 集中保存index要一起传递的字段。
const GITHUB_SCOPES: Record<string, Color> = {
  keyword: rgb(167, 29, 93),
  _storage: rgb(167, 29, 93),
  built_in: rgb(0, 134, 179),
  type: rgb(0, 134, 179),
  literal: rgb(0, 134, 179),
  number: rgb(0, 134, 179),
  string: rgb(24, 54, 145),
  title: rgb(121, 93, 163),
  'title.function': rgb(121, 93, 163),
  'title.class': rgb(0, 0, 0),
  'title.class.inherited': rgb(0, 0, 0),
  params: rgb(0, 134, 179),
  comment: rgb(150, 152, 150),
  meta: rgb(150, 152, 150),
  attr: rgb(0, 134, 179),
  attribute: rgb(0, 134, 179),
  variable: rgb(0, 134, 179),
  'variable.language': rgb(0, 134, 179),
  property: rgb(0, 134, 179),
  operator: rgb(167, 29, 93),
  punctuation: rgb(51, 51, 51),
  symbol: rgb(0, 134, 179),
  regexp: rgb(24, 54, 145),
  subst: rgb(51, 51, 51),
}

// Keywords that syntect scopes as storage.type rather than keyword.control.
// highlight.js lumps these under "keyword"; we re-split so const/function/etc.
// get the cyan storage color instead of pink.
// STORAGE_KEYWORDS 集合保存`Set`，供index后续处理使用。
const STORAGE_KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'class',
  'type',
  'interface',
  'enum',
  'namespace',
  'module',
  'def',
  'fn',
  'func',
  'struct',
  'trait',
  'impl',
])

// ANSI_SCOPES 集合 集中保存index要一起传递的字段。
const ANSI_SCOPES: Record<string, Color> = {
  keyword: ansiIdx(13),
  _storage: ansiIdx(14),
  built_in: ansiIdx(14),
  type: ansiIdx(14),
  literal: ansiIdx(12),
  number: ansiIdx(12),
  string: ansiIdx(10),
  title: ansiIdx(11),
  'title.function': ansiIdx(11),
  'title.class': ansiIdx(11),
  comment: ansiIdx(8),
  meta: ansiIdx(8),
}

// buildTheme 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildTheme(themeName: string, mode: ColorMode): Theme {
  // isDark记录 `themeName.includes` 是否成立，index随后按该结果分支。
  const isDark = themeName.includes('dark')
  // isAnsi记录 `themeName.includes` 是否成立，index随后按该结果分支。
  const isAnsi = themeName.includes('ansi')
  // isDaltonized记录 `themeName.includes` 是否成立，index随后按该结果分支。
  const isDaltonized = themeName.includes('daltonized')
  // tc标记index是否启用对应路径。
  const tc = mode === 'truecolor'

  // 满足 `isAnsi` 时，index执行该分支。
  if (isAnsi) {
    // 返回结构化结果，集中表达index已经整理出的状态。
    return {
      addLine: DEFAULT_BG,
      addWord: DEFAULT_BG,
      addDecoration: ansiIdx(10),
      deleteLine: DEFAULT_BG,
      deleteWord: DEFAULT_BG,
      deleteDecoration: ansiIdx(9),
      foreground: ansiIdx(7),
      background: DEFAULT_BG,
      scopes: ANSI_SCOPES,
    }
  }

  // 满足 `isDark` 时，index执行该分支。
  if (isDark) {
    // fg保存`rgb`，供index后续处理使用。
    const fg = rgb(248, 248, 242)
    // deleteLine保存`rgb`，供index后续处理使用。
    const deleteLine = rgb(61, 1, 0)
    // deleteWord保存`rgb`，供index后续处理使用。
    const deleteWord = rgb(92, 2, 0)
    // deleteDecoration保存`rgb`，供index后续处理使用。
    const deleteDecoration = rgb(220, 90, 90)
    // 满足 `isDaltonized` 时，index执行该分支。
    if (isDaltonized) {
      // 返回结构化结果，集中表达index已经整理出的状态。
      return {
        addLine: tc ? rgb(0, 27, 41) : ansiIdx(17),
        addWord: tc ? rgb(0, 48, 71) : ansiIdx(24),
        addDecoration: rgb(81, 160, 200),
        deleteLine,
        deleteWord,
        deleteDecoration,
        foreground: fg,
        background: DEFAULT_BG,
        scopes: MONOKAI_SCOPES,
      }
    }
    // 返回结构化结果，集中表达index已经整理出的状态。
    return {
      addLine: tc ? rgb(2, 40, 0) : ansiIdx(22),
      addWord: tc ? rgb(4, 71, 0) : ansiIdx(28),
      addDecoration: rgb(80, 200, 80),
      deleteLine,
      deleteWord,
      deleteDecoration,
      foreground: fg,
      background: DEFAULT_BG,
      scopes: MONOKAI_SCOPES,
    }
  }

  // light
  // fg保存`rgb`，供index后续处理使用。
  const fg = rgb(51, 51, 51)
  // deleteLine保存`rgb`，供index后续处理使用。
  const deleteLine = rgb(255, 220, 220)
  // deleteWord保存`rgb`，供index后续处理使用。
  const deleteWord = rgb(255, 199, 199)
  // deleteDecoration保存`rgb`，供index后续处理使用。
  const deleteDecoration = rgb(207, 34, 46)
  // 满足 `isDaltonized` 时，index执行该分支。
  if (isDaltonized) {
    // 返回结构化结果，集中表达index已经整理出的状态。
    return {
      addLine: rgb(219, 237, 255),
      addWord: rgb(179, 217, 255),
      addDecoration: rgb(36, 87, 138),
      deleteLine,
      deleteWord,
      deleteDecoration,
      foreground: fg,
      background: DEFAULT_BG,
      scopes: GITHUB_SCOPES,
    }
  }
  // 返回结构化结果，集中表达index已经整理出的状态。
  return {
    addLine: rgb(220, 255, 220),
    addWord: rgb(178, 255, 178),
    addDecoration: rgb(36, 138, 61),
    deleteLine,
    deleteWord,
    deleteDecoration,
    foreground: fg,
    background: DEFAULT_BG,
    scopes: GITHUB_SCOPES,
  }
}

// defaultStyle 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function defaultStyle(theme: Theme): Style {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { foreground: theme.foreground, background: theme.background }
}

// lineBackground 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function lineBackground(marker: Marker, theme: Theme): Color {
  // 按照 marker 的取值选择index的具体处理分支。
  switch (marker) {
    case '+':
      // 返回 `theme.addLine`，作为index这次计算的结果。
      return theme.addLine
    case '-':
      // 返回 `theme.deleteLine`，作为index这次计算的结果。
      return theme.deleteLine
    case ' ':
      // 返回 `theme.background`，作为index这次计算的结果。
      return theme.background
  }
}

// wordBackground 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wordBackground(marker: Marker, theme: Theme): Color {
  // 按照 marker 的取值选择index的具体处理分支。
  switch (marker) {
    case '+':
      // 返回 `theme.addWord`，作为index这次计算的结果。
      return theme.addWord
    case '-':
      // 返回 `theme.deleteWord`，作为index这次计算的结果。
      return theme.deleteWord
    case ' ':
      // 返回 `theme.background`，作为index这次计算的结果。
      return theme.background
  }
}

// decorationColor 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function decorationColor(marker: Marker, theme: Theme): Color {
  // 按照 marker 的取值选择index的具体处理分支。
  switch (marker) {
    case '+':
      // 返回 `theme.addDecoration`，作为index这次计算的结果。
      return theme.addDecoration
    case '-':
      // 返回 `theme.deleteDecoration`，作为index这次计算的结果。
      return theme.deleteDecoration
    case ' ':
      // 返回 `theme.foreground`，作为index这次计算的结果。
      return theme.foreground
  }
}

// ---------------------------------------------------------------------------
// Syntax highlighting via highlight.js
// ---------------------------------------------------------------------------

// hljs 10.x uses `kind`; 11.x uses `scope`. Handle both.
// HljsNode 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type HljsNode = {
  scope?: string
  kind?: string
  children: (HljsNode | string)[]
}

// Filename-based and extension-based language detection (approximates bat's
// SyntaxMapping + syntect's find_syntax_by_extension)
// FILENAME_LANGS 文件数据 集中保存index要一起传递的字段。
const FILENAME_LANGS: Record<string, string> = {
  Dockerfile: 'dockerfile',
  Makefile: 'makefile',
  Rakefile: 'ruby',
  Gemfile: 'ruby',
  CMakeLists: 'cmake',
}

// detectLanguage 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectLanguage(
  filePath: string,
  firstLine: string | null,
): string | null {
  // base保存`basename`，供index后续处理使用。
  const base = basename(filePath)
  // ext保存`extname`，供index后续处理使用。
  const ext = extname(filePath).slice(1)

  // Filename-based lookup (handles Dockerfile, Makefile, CMakeLists.txt, etc.)
  // stem格式化`base.split`，供index后续处理使用。
  const stem = base.split('.')[0] ?? ''
  // byName读取 `FILENAME_LANGS[base] ?? FILENAME_LANGS[stem]` 对应条目，后续围绕该成员继续处理。
  const byName = FILENAME_LANGS[base] ?? FILENAME_LANGS[stem]
  // 组合条件 `byName && hljs().getLanguage(byName)` 成立时，index才启用这条专门路径。
  if (byName && hljs().getLanguage(byName)) return byName
  // 满足 `ext` 时，index执行该分支。
  if (ext) {
    // lang保存`hljs`，供index后续处理使用。
    const lang = hljs().getLanguage(ext)
    // 满足 `lang` 时，index执行该分支。
    if (lang) return ext
  }
  // Shebang / first-line detection (strip UTF-8 BOM)
  // 满足 `firstLine` 时，index执行该分支。
  if (firstLine) {
    // line保存`firstLine.startsWith`，供index后续处理使用。
    const line = firstLine.startsWith('\ufeff') ? firstLine.slice(1) : firstLine
    // 满足 `line.startsWith('#!')` 时，index执行该分支。
    if (line.startsWith('#!')) {
      // 组合条件 `line.includes('bash') || line.includes('/sh')` 成立时，index才启用这条专门路径。
      if (line.includes('bash') || line.includes('/sh')) return 'bash'
      // 满足 `line.includes('python')` 时，index执行该分支。
      if (line.includes('python')) return 'python'
      // 满足 `line.includes('node')` 时，index执行该分支。
      if (line.includes('node')) return 'javascript'
      // 满足 `line.includes('ruby')` 时，index执行该分支。
      if (line.includes('ruby')) return 'ruby'
      // 满足 `line.includes('perl')` 时，index执行该分支。
      if (line.includes('perl')) return 'perl'
    }
    // 满足 `line.startsWith('<?php')` 时，index执行该分支。
    if (line.startsWith('<?php')) return 'php'
    // 满足 `line.startsWith('<?xml')` 时，index执行该分支。
    if (line.startsWith('<?xml')) return 'xml'
  }
  // 返回 `null`，作为index这次计算的结果。
  return null
}

// scopeColor 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scopeColor(
  scope: string | undefined,
  text: string,
  theme: Theme,
): Color {
  // scope缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!scope) return theme.foreground
  // 组合条件 `scope === 'keyword' && STORAGE_KEYWORDS.has(text.trim())` 成立时，index才启用这条专门路径。
  if (scope === 'keyword' && STORAGE_KEYWORDS.has(text.trim())) {
    // 返回 `theme.scopes['_storage'] ?? theme.foreground`，作为index这次计算的结果。
    return theme.scopes['_storage'] ?? theme.foreground
  }
  // 返回 `(`，作为index这次计算的结果。
  return (
    theme.scopes[scope] ??
    theme.scopes[scope.split('.')[0]!] ??
    theme.foreground
  )
}

// flattenHljs 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flattenHljs(
  node: HljsNode | string,
  theme: Theme,
  parentScope: string | undefined,
  out: Block[],
): void {
  // 当 `typeof node` 匹配 `'string'` 时，index执行对应分支。
  if (typeof node === 'string') {
    // fg保存`scopeColor`，供index后续处理使用。
    const fg = scopeColor(parentScope, node, theme)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push([{ foreground: fg, background: theme.background }, node])
    // index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // scope 命名 `node.scope ?? node.kind ?? parentScope`，让后续代码直接表达这个值的用途。
  const scope = node.scope ?? node.kind ?? parentScope
  // 按顺序遍历 `node.children` 中的child，逐个交给index处理。
  for (const child of node.children) {
    // 调用 flattenHljs，触发index此处需要的副作用。
    flattenHljs(child, theme, scope, out)
  }
}

// result.emitter is in the public HighlightResult type, but rootNode is
// internal to TokenTreeEmitter. Type guard validates the shape once so we
// fail loudly (via logError) instead of a silent try/catch swallow — the
// prior `as unknown as` cast hid a version mismatch (_emitter vs emitter,
// scope vs kind) behind a silent gray fallback.
// hasRootNode 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasRootNode(emitter: unknown): emitter is { rootNode: HljsNode } {
  // 返回 `(`，作为index这次计算的结果。
  return (
    typeof emitter === 'object' &&
    emitter !== null &&
    'rootNode' in emitter &&
    typeof emitter.rootNode === 'object' &&
    emitter.rootNode !== null &&
    'children' in emitter.rootNode
  )
}

// loggedEmitterShapeError 错误信息标记index是否启用对应路径。
let loggedEmitterShapeError = false

// highlightLine 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function highlightLine(
  state: { lang: string | null; stack: unknown },
  line: string,
  theme: Theme,
): Block[] {
  // syntect-parity: feed a trailing \n so line comments terminate, then strip
  // code保存`line + '\n'`，供后续判断或组装使用。
  const code = line + '\n'
  // state.lang 状态缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!state.lang) {
    // 返回列表结果，保留index已经排好的条目顺序。
    return [[defaultStyle(theme), code]]
  }
  // result 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let result
  // 保护这一段可能失败的index操作，确保异常能进入相邻错误处理。
  try {
    // 结果更新为 `hljs().highlight(code, {`，确保index后续读取最新状态。
    result = hljs().highlight(code, {
      language: state.lang,
      ignoreIllegals: true,
    })
  } catch {
    // hljs throws on unknown language despite ignoreIllegals
    // 返回列表结果，保留index已经排好的条目顺序。
    return [[defaultStyle(theme), code]]
  }
  // 满足 `!hasRootNode(result.emitter)` 时，index执行该分支。
  if (!hasRootNode(result.emitter)) {
    // loggedEmitterShapeError 错误信息缺失时提前走兜底路径，避免index继续依赖无效输入。
    if (!loggedEmitterShapeError) {
      // loggedEmitterShapeError 错误信息更新为 `true`，确保index后续读取最新状态。
      loggedEmitterShapeError = true
      // 记录index运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `color-diff: hljs emitter shape mismatch (keys: ${Object.keys(result.emitter).join(',')}). Syntax highlighting disabled.`,
        ),
      )
    }
    // 返回列表结果，保留index已经排好的条目顺序。
    return [[defaultStyle(theme), code]]
  }
  // blocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const blocks: Block[] = []
  // 调用 flattenHljs，触发index此处需要的副作用。
  flattenHljs(result.emitter.rootNode, theme, undefined, blocks)
  // 返回 `blocks`，作为index这次计算的结果。
  return blocks
}

// ---------------------------------------------------------------------------
// Word diff
// ---------------------------------------------------------------------------

// Range 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Range = { start: number; end: number }

// CHANGE_THRESHOLD保存`0.4`，供后续判断或组装使用。
const CHANGE_THRESHOLD = 0.4

// Tokenize into word runs, whitespace runs, and single punctuation chars —
// matches the Rust tokenize() which mirrors diffWordsWithSpace's splitting.
// tokenize 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tokenize(text: string): string[] {
  // token 列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const tokens: string[] = []
  // i保存`0`，供index后续判断或输出使用。
  let i = 0
  // while 使用 i < text.length 完成index里的对应操作。
  while (i < text.length) {
    // ch保存`text[i]!`，供index后续判断或输出使用。
    const ch = text[i]!
    // 满足 `/[\p{L}\p{N}_]/u.test(ch)` 时，index执行该分支。
    if (/[\p{L}\p{N}_]/u.test(ch)) {
      // j 命名 `i + 1`，让后续代码直接表达这个值的用途。
      let j = i + 1
      // 只要 j < text.length && /[\p{L}\p{N}_]/u.test(text[j]!) 成立，就持续推进index中的循环处理。
      while (j < text.length && /[\p{L}\p{N}_]/u.test(text[j]!)) j++
      // token 列表追加新条目，保持收集顺序与输入顺序一致。
      tokens.push(text.slice(i, j))
      // i更新为 `j`，确保index后续读取最新状态。
      i = j
    // index在这里处理 `} else if (/\s/.test(ch)) {`，完成这一小步状态转换。
    } else if (/\s/.test(ch)) {
      // j 命名 `i + 1`，让后续代码直接表达这个值的用途。
      let j = i + 1
      // 只要 j < text.length && /\s/.test(text[j]!) 成立，就持续推进index中的循环处理。
      while (j < text.length && /\s/.test(text[j]!)) j++
      // token 列表追加新条目，保持收集顺序与输入顺序一致。
      tokens.push(text.slice(i, j))
      // i更新为 `j`，确保index后续读取最新状态。
      i = j
    } else {
      // advance one codepoint (handle surrogate pairs)
      // cp保存`text.codePointAt`，供index后续处理使用。
      const cp = text.codePointAt(i)!
      // len保存`cp > 0xffff ? 2 : 1`，供后续判断或组装使用。
      const len = cp > 0xffff ? 2 : 1
      // token 列表追加新条目，保持收集顺序与输入顺序一致。
      tokens.push(text.slice(i, i + len))
      // index在这里处理 `i += len`，完成这一小步状态转换。
      i += len
    }
  }
  // 返回 `tokens`，作为index这次计算的结果。
  return tokens
}

// findAdjacentPairs 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findAdjacentPairs(markers: Marker[]): [number, number][] {
  // pairs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const pairs: [number, number][] = []
  // i保存`0`，供index后续判断或输出使用。
  let i = 0
  // while 使用 i < markers.length 完成index里的对应操作。
  while (i < markers.length) {
    // 当 `markers[i]` 匹配 `'-'` 时，index执行对应分支。
    if (markers[i] === '-') {
      // delStart保存`i`，供index后续判断或输出使用。
      const delStart = i
      // delEnd保存`i`，供index后续判断或输出使用。
      let delEnd = i
      // 只要 delEnd < markers.length && markers[delEnd] === '-' 成立，就持续推进index中的循环处理。
      while (delEnd < markers.length && markers[delEnd] === '-') delEnd++
      // addEnd 命名 `delEnd`，让后续代码直接表达这个值的用途。
      let addEnd = delEnd
      // 只要 addEnd < markers.length && markers[addEnd] === '+' 成立，就持续推进index中的循环处理。
      while (addEnd < markers.length && markers[addEnd] === '+') addEnd++
      // delCount 数量 命名 `delEnd - delStart`，让后续代码直接表达这个值的用途。
      const delCount = delEnd - delStart
      // addCount 数量 命名 `addEnd - delEnd`，让后续代码直接表达这个值的用途。
      const addCount = addEnd - delEnd
      // 组合条件 `delCount > 0 && addCount > 0` 成立时，index才启用这条专门路径。
      if (delCount > 0 && addCount > 0) {
        // n保存`Math.min`，供index后续处理使用。
        const n = Math.min(delCount, addCount)
        // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
        for (let k = 0; k < n; k++) {
          // pairs 集合追加新条目，保持收集顺序与输入顺序一致。
          pairs.push([delStart + k, delEnd + k])
        }
        // i更新为 `addEnd`，确保index后续读取最新状态。
        i = addEnd
      } else {
        // i更新为 `delEnd`，确保index后续读取最新状态。
        i = delEnd
      }
    } else {
      // index在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }
  // 返回 `pairs`，作为index这次计算的结果。
  return pairs
}

// wordDiffStrings 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wordDiffStrings(oldStr: string, newStr: string): [Range[], Range[]] {
  // oldTokens 集合保存`tokenize`，供index后续处理使用。
  const oldTokens = tokenize(oldStr)
  // newTokens 集合保存`tokenize`，供index后续处理使用。
  const newTokens = tokenize(newStr)
  // ops 集合保存`diffArrays`，供index后续处理使用。
  const ops = diffArrays(oldTokens, newTokens)

  // totalLen 命名 `oldStr.length + newStr.length`，让后续代码直接表达这个值的用途。
  const totalLen = oldStr.length + newStr.length
  // changedLen保存`0`，供后续判断或组装使用。
  let changedLen = 0
  // oldRanges 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const oldRanges: Range[] = []
  // newRanges 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newRanges: Range[] = []
  // oldOff 命名 `0`，让后续代码直接表达这个值的用途。
  let oldOff = 0
  // newOff保存`0`，供index后续判断或输出使用。
  let newOff = 0

  // 按顺序遍历 `ops` 中的op，逐个交给index处理。
  for (const op of ops) {
    // len派生`value.reduce`，供index后续处理使用。
    const len = op.value.reduce((s, t) => s + t.length, 0)
    // 满足 `op.removed` 时，index执行该分支。
    if (op.removed) {
      // index在这里处理 `changedLen += len`，完成这一小步状态转换。
      changedLen += len
      // oldRanges 集合追加新条目，保持收集顺序与输入顺序一致。
      oldRanges.push({ start: oldOff, end: oldOff + len })
      // index在这里处理 `oldOff += len`，完成这一小步状态转换。
      oldOff += len
    // index在这里处理 `} else if (op.added) {`，完成这一小步状态转换。
    } else if (op.added) {
      // index在这里处理 `changedLen += len`，完成这一小步状态转换。
      changedLen += len
      // newRanges 集合追加新条目，保持收集顺序与输入顺序一致。
      newRanges.push({ start: newOff, end: newOff + len })
      // index在这里处理 `newOff += len`，完成这一小步状态转换。
      newOff += len
    } else {
      // index在这里处理 `oldOff += len`，完成这一小步状态转换。
      oldOff += len
      // index在这里处理 `newOff += len`，完成这一小步状态转换。
      newOff += len
    }
  }

  // 组合条件 `totalLen > 0 && changedLen / totalLen > CHANGE_TH` 成立时，index才启用这条专门路径。
  if (totalLen > 0 && changedLen / totalLen > CHANGE_THRESHOLD) {
    // 返回列表结果，保留index已经排好的条目顺序。
    return [[], []]
  }
  // 返回列表结果，保留index已经排好的条目顺序。
  return [oldRanges, newRanges]
}

// ---------------------------------------------------------------------------
// Highlight (per-line transform pipeline)
// ---------------------------------------------------------------------------

// Highlight 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Highlight = {
  marker: Marker | null
  lineNumber: number
  lines: Block[][]
}

// removeNewlines 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeNewlines(h: Highlight): void {
  // 文本行更新为 `h.lines.map(line =>`，确保index后续读取最新状态。
  h.lines = h.lines.map(line =>
    line.flatMap(([style, text]) =>
      text
        .split('\n')
        // 链式调用 filter，继续加工上一行在index中产生的数据。
        .filter(p => p.length > 0)
        // 链式调用 map，继续加工上一行在index中产生的数据。
        .map((p): Block => [style, p]),
    ),
  )
}

// charWidth 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function charWidth(ch: string): number {
  // 返回 `stringWidth(ch)`，作为index这次计算的结果。
  return stringWidth(ch)
}

// wrapText 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wrapText(h: Highlight, width: number, theme: Theme): void {
  // newLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newLines: Block[][] = []
  // 按顺序遍历 `h.lines` 中的line，逐个交给index处理。
  for (const line of h.lines) {
    // queue格式化`line.slice()` 整理出中间结果，供index后续步骤使用。
    const queue: Block[] = line.slice()
    // cur 从空数组开始收集，后续循环会按处理顺序追加条目。
    let cur: Block[] = []
    // curW 命名 `0`，让后续代码直接表达这个值的用途。
    let curW = 0
    // while 使用 queue.length > 0 完成index里的对应操作。
    while (queue.length > 0) {
      // 从 `queue.shift()!` 按位置拆出 style、text，让index分别处理这些返回值。
      const [style, text] = queue.shift()!
      // tw保存`stringWidth`，供index后续处理使用。
      const tw = stringWidth(text)
      // 满足 `curW + tw <= width` 时，index执行该分支。
      if (curW + tw <= width) {
        // cur追加新条目，保持收集顺序与输入顺序一致。
        cur.push([style, text])
        // index在这里处理 `curW += tw`，完成这一小步状态转换。
        curW += tw
      } else {
        // remaining保存`width - curW`，供index后续判断或输出使用。
        const remaining = width - curW
        // bytePos 集合保存`0`，供后续判断或组装使用。
        let bytePos = 0
        // accW保存`0`，供index后续判断或输出使用。
        let accW = 0
        // iterate by codepoint
        // 按顺序遍历 `text` 中的ch，逐个交给index处理。
        for (const ch of text) {
          // cw保存`charWidth`，供index后续处理使用。
          const cw = charWidth(ch)
          // 满足 `accW + cw > remaining` 时，index执行该分支。
          if (accW + cw > remaining) break
          // index在这里处理 `accW += cw`，完成这一小步状态转换。
          accW += cw
          // index在这里处理 `bytePos += ch.length`，完成这一小步状态转换。
          bytePos += ch.length
        }
        // 满足 `bytePos === 0` 时，index执行该分支。
        if (bytePos === 0) {
          // 满足 `curW === 0` 时，index执行该分支。
          if (curW === 0) {
            // Fresh line and first char still doesn't fit — force one codepoint
            // to guarantee forward progress (overflows, but prevents infinite loop)
            // firstCp保存`text.codePointAt`，供index后续处理使用。
            const firstCp = text.codePointAt(0)!
            // bytePos 集合更新为 `firstCp > 0xffff ? 2 : 1`，确保index后续读取最新状态。
            bytePos = firstCp > 0xffff ? 2 : 1
          } else {
            // Line has content and next char doesn't fit — finish this line,
            // re-queue the whole block for a fresh line
            // newLines 集合追加新条目，保持收集顺序与输入顺序一致。
            newLines.push(cur)
            // 调用 queue.unshift，触发index此处需要的副作用。
            queue.unshift([style, text])
            // cur更新为 `[]`，确保index后续读取最新状态。
            cur = []
            // curW更新为 `0`，确保index后续读取最新状态。
            curW = 0
            // 跳过当前项，继续处理index中的下一轮循环。
            continue
          }
        }
        // cur追加新条目，保持收集顺序与输入顺序一致。
        cur.push([style, text.slice(0, bytePos)])
        // newLines 集合追加新条目，保持收集顺序与输入顺序一致。
        newLines.push(cur)
        // 调用 queue.unshift，触发index此处需要的副作用。
        queue.unshift([style, text.slice(bytePos)])
        // cur更新为 `[]`，确保index后续读取最新状态。
        cur = []
        // curW更新为 `0`，确保index后续读取最新状态。
        curW = 0
      }
    }
    // newLines 集合追加新条目，保持收集顺序与输入顺序一致。
    newLines.push(cur)
  }
  // 文本行更新为 `newLines`，确保index后续读取最新状态。
  h.lines = newLines

  // Pad changed lines so background extends to edge
  // `h.marker && h.marker` 与 `' '` 不一致时刷新派生状态，避免使用过期结果。
  if (h.marker && h.marker !== ' ') {
    // bg保存`lineBackground`，供index后续处理使用。
    const bg = lineBackground(h.marker, theme)
    // padStyle 集中保存index要一起传递的字段。
    const padStyle: Style = { foreground: theme.foreground, background: bg }
    // 按顺序遍历 `h.lines` 中的line，逐个交给index处理。
    for (const line of h.lines) {
      // curW派生`line.reduce`，供index后续处理使用。
      const curW = line.reduce((s, [, t]) => s + stringWidth(t), 0)
      // 满足 `curW < width` 时，index执行该分支。
      if (curW < width) {
        // line追加新条目，保持收集顺序与输入顺序一致。
        line.push([padStyle, ' '.repeat(width - curW)])
      }
    }
  }
}

// addLineNumber 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addLineNumber(
  h: Highlight,
  theme: Theme,
  maxDigits: number,
  fullDim: boolean,
): void {
  // style 集中保存index要一起传递的字段。
  const style: Style = {
    foreground: h.marker ? decorationColor(h.marker, theme) : theme.foreground,
    background: h.marker ? lineBackground(h.marker, theme) : theme.background,
  }
  // shouldDim标记index是否启用对应路径。
  const shouldDim = h.marker === null || h.marker === ' '
  // 按索引扫描 `h.lines.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < h.lines.length; i++) {
    // prefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const prefix =
      i === 0
        ? ` ${String(h.lineNumber).padStart(maxDigits)} `
        : ' '.repeat(maxDigits + 2)
    // wrapped标记index是否启用对应路径。
    const wrapped = shouldDim && !fullDim ? `${DIM}${prefix}${UNDIM}` : prefix
    // index在这里处理 `h.lines[i]!.unshift([style, wrapped])`，完成这一小步状态转换。
    h.lines[i]!.unshift([style, wrapped])
  }
}

// addMarker 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addMarker(h: Highlight, theme: Theme): void {
  // h.marker缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!h.marker) return
  // style 集中保存index要一起传递的字段。
  const style: Style = {
    foreground: decorationColor(h.marker, theme),
    background: lineBackground(h.marker, theme),
  }
  // 按顺序遍历 `h.lines` 中的line，逐个交给index处理。
  for (const line of h.lines) {
    // 调用 line.unshift，触发index此处需要的副作用。
    line.unshift([style, h.marker])
  }
}

// dimContent 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dimContent(h: Highlight): void {
  // 按顺序遍历 `h.lines` 中的line，逐个交给index处理。
  for (const line of h.lines) {
    // 满足 `line.length > 0` 时，index执行该分支。
    if (line.length > 0) {
      // index在这里处理 `line[0]![1] = DIM + line[0]![1]`，完成这一小步状态转换。
      line[0]![1] = DIM + line[0]![1]
      // last保存 `line.length - 1` 的判断结果，供index后续分支直接复用。
      const last = line.length - 1
      // index在这里处理 `line[last]![1] = line[last]![1] + UNDIM`，完成这一小步状态转换。
      line[last]![1] = line[last]![1] + UNDIM
    }
  }
}

// applyBackground 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyBackground(h: Highlight, theme: Theme, ranges: Range[]): void {
  // h.marker缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!h.marker) return
  // lineBg保存`lineBackground`，供index后续处理使用。
  const lineBg = lineBackground(h.marker, theme)
  // wordBg保存`wordBackground`，供index后续处理使用。
  const wordBg = wordBackground(h.marker, theme)

  // rangeIdx 命名 `0`，让后续代码直接表达这个值的用途。
  let rangeIdx = 0
  // byteOff保存`0`，供index后续判断或输出使用。
  let byteOff = 0
  // 按索引扫描 `h.lines.length`，需要消费相邻参数时可以精确移动游标。
  for (let li = 0; li < h.lines.length; li++) {
    // newLine 从空数组开始收集，后续循环会按处理顺序追加条目。
    const newLine: Block[] = []
    // 循环处理 `const [style, text] of h.lines[li]!`，让index逐项把同类条目按顺序走完。
    for (const [style, text] of h.lines[li]!) {
      // textStart保存`byteOff`，供后续判断或组装使用。
      const textStart = byteOff
      // textEnd 命名 `byteOff + text.length`，让后续代码直接表达这个值的用途。
      const textEnd = byteOff + text.length

      // while 使用 rangeIdx < ranges.length && ranges[rangeIdx]!.end… 完成index里的对应操作。
      while (rangeIdx < ranges.length && ranges[rangeIdx]!.end <= textStart) {
        // index在这里处理 `rangeIdx++`，完成这一小步状态转换。
        rangeIdx++
      }
      // 满足 `rangeIdx >= ranges.length` 时，index执行该分支。
      if (rangeIdx >= ranges.length) {
        // newLine追加新条目，保持收集顺序与输入顺序一致。
        newLine.push([{ ...style, background: lineBg }, text])
        // byteOff更新为 `textEnd`，确保index后续读取最新状态。
        byteOff = textEnd
        // 跳过当前项，继续处理index中的下一轮循环。
        continue
      }

      // remaining 命名 `text`，让后续代码直接表达这个值的用途。
      let remaining = text
      // pos 集合 命名 `textStart`，让后续代码直接表达这个值的用途。
      let pos = textStart
      // while 使用 remaining.length > 0 && rangeIdx < ranges.length 完成index里的对应操作。
      while (remaining.length > 0 && rangeIdx < ranges.length) {
        // r保存`ranges[rangeIdx]!`，供index后续判断或输出使用。
        const r = ranges[rangeIdx]!
        // inRange标记index是否启用对应路径。
        const inRange = pos >= r.start && pos < r.end
        // next 先占位，稍后的条件分支会根据实际输入补齐它。
        let next: number
        // 满足 `inRange` 时，index执行该分支。
        if (inRange) {
          // next更新为 `Math.min(r.end, textEnd)`，确保index后续读取最新状态。
          next = Math.min(r.end, textEnd)
        // index在这里处理 `} else if (r.start > pos && r.start < textEnd) {`，完成这一小步状态转换。
        } else if (r.start > pos && r.start < textEnd) {
          // next更新为 `r.start`，确保index后续读取最新状态。
          next = r.start
        } else {
          // next更新为 `textEnd`，确保index后续读取最新状态。
          next = textEnd
        }
        // segLen保存`next - pos`，供后续判断或组装使用。
        const segLen = next - pos
        // seg格式化`remaining.slice`，供index后续处理使用。
        const seg = remaining.slice(0, segLen)
        // newLine追加新条目，保持收集顺序与输入顺序一致。
        newLine.push([{ ...style, background: inRange ? wordBg : lineBg }, seg])
        // remaining更新为 `remaining.slice(segLen)`，确保index后续读取最新状态。
        remaining = remaining.slice(segLen)
        // pos 集合更新为 `next`，确保index后续读取最新状态。
        pos = next
        // 满足 `pos >= r.end` 时，index执行该分支。
        if (pos >= r.end) rangeIdx++
      }
      // 满足 `remaining.length > 0` 时，index执行该分支。
      if (remaining.length > 0) {
        // newLine追加新条目，保持收集顺序与输入顺序一致。
        newLine.push([{ ...style, background: lineBg }, remaining])
      }
      // byteOff更新为 `textEnd`，确保index后续读取最新状态。
      byteOff = textEnd
    }
    // lines[li更新为 `newLine`，确保index后续读取最新状态。
    h.lines[li] = newLine
  }
}

// intoLines 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function intoLines(
  h: Highlight,
  dim: boolean,
  skipBg: boolean,
  mode: ColorMode,
): string[] {
  // 返回 `h.lines.map(line => asTerminalEscaped(line, mode, skipBg, dim))`，作为index这次计算的结果。
  return h.lines.map(line => asTerminalEscaped(line, mode, skipBg, dim))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// maxLineNumber 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maxLineNumber(hunk: Hunk): number {
  // oldEnd保存`Math.max`，供index后续处理使用。
  const oldEnd = Math.max(0, hunk.oldStart + hunk.oldLines - 1)
  // newEnd保存`Math.max`，供index后续处理使用。
  const newEnd = Math.max(0, hunk.newStart + hunk.newLines - 1)
  // 返回 `Math.max(oldEnd, newEnd)`，作为index这次计算的结果。
  return Math.max(oldEnd, newEnd)
}

// parseMarker 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseMarker(s: string): Marker {
  // 返回 `s === '+' || s === '-' ? s : ' '`，作为index这次计算的结果。
  return s === '+' || s === '-' ? s : ' '
}

// ColorDiff 聚合index相关状态与操作，把同一职责的行为收束到类实例中。
export class ColorDiff {
  private hunk: Hunk
  private filePath: string
  private firstLine: string | null
  private prefixContent: string | null

  // 构造函数初始化实例状态，确保index后续方法读取到完整配置。
  constructor(
    hunk: Hunk,
    firstLine: string | null,
    filePath: string,
    prefixContent?: string | null,
  ) {
    // 更新实例字段 hunk 为 hunk，同步index的内部状态。
    this.hunk = hunk
    // 更新实例字段 filePath 为 filePath，同步index的内部状态。
    this.filePath = filePath
    // 更新实例字段 firstLine 为 firstLine，同步index的内部状态。
    this.firstLine = firstLine
    // 更新实例字段 prefixContent 为 prefixContent ?? null，同步index的内部状态。
    this.prefixContent = prefixContent ?? null
  }

  // render 根据 themeName: string, width: number, dim: boolean 生成这一段界面或文本输出。
  render(themeName: string, width: number, dim: boolean): string[] | null {
    // mode读取`detectColorMode`，供index后续处理使用。
    const mode = detectColorMode(themeName)
    // 主题构建`buildTheme`，供index后续处理使用。
    const theme = buildTheme(themeName, mode)
    // lang读取`detectLanguage`，供index后续处理使用。
    const lang = detectLanguage(this.filePath, this.firstLine)
    // hlState 状态 集中保存index要一起传递的字段。
    const hlState = { lang, stack: null }

    // Warm highlighter with prefix lines (highlight.js is stateless per call,
    // so this is a no-op for now — preserved for API parity)
    // 显式忽略 `this.prefixContent` 的返回值，只保留它触发的副作用。
    void this.prefixContent

    // maxDigits 集合保存`String`，供index后续处理使用。
    const maxDigits = String(maxLineNumber(this.hunk)).length
    // oldLine保存`this.hunk.oldStart`，供index后续判断或输出使用。
    let oldLine = this.hunk.oldStart
    // newLine保存`this.hunk.newStart`，供后续判断或组装使用。
    let newLine = this.hunk.newStart
    // effectiveWidth保存`Math.max`，供index后续处理使用。
    const effectiveWidth = Math.max(1, width - maxDigits - 2 - 1)

    // First pass: assign markers + line numbers
    // Entry 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
    type Entry = { lineNumber: number; marker: Marker; code: string }
    // 这个回调绑定到 const entries: Entry[] = this.hunk.lines.map(rawLine => {，负责index在该局部场景下的响应。
    const entries: Entry[] = this.hunk.lines.map(rawLine => {
      // marker解析`parseMarker`，供index后续处理使用。
      const marker = parseMarker(rawLine.slice(0, 1))
      // code格式化`rawLine.slice`，供index后续处理使用。
      const code = rawLine.slice(1)
      // lineNumber 先占位，稍后的条件分支会根据实际输入补齐它。
      let lineNumber: number
      // 按照 marker 的取值选择index的具体处理分支。
      switch (marker) {
        case '+':
          // lineNumber更新为 `newLine++`，确保index后续读取最新状态。
          lineNumber = newLine++
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case '-':
          // lineNumber更新为 `oldLine++`，确保index后续读取最新状态。
          lineNumber = oldLine++
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case ' ':
          // lineNumber更新为 `newLine`，确保index后续读取最新状态。
          lineNumber = newLine
          // index在这里处理 `oldLine++`，完成这一小步状态转换。
          oldLine++
          // index在这里处理 `newLine++`，完成这一小步状态转换。
          newLine++
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
      }
      // 返回结构化结果，集中表达index已经整理出的状态。
      return { lineNumber, marker, code }
    })

    // Word-diff ranges (skip when dim — too loud)
    // 这个回调绑定到 const ranges: Range[][] = entries.map(() => [])，负责index在该局部场景下的响应。
    const ranges: Range[][] = entries.map(() => [])
    // dim缺失时提前走兜底路径，避免index继续依赖无效输入。
    if (!dim) {
      // markers 集合派生`entries.map`，供index后续处理使用。
      const markers = entries.map(e => e.marker)
      // 循环处理 `const [delIdx, addIdx] of findAdjacentPairs(markers)`，让index把同类条目按顺序走完。
      for (const [delIdx, addIdx] of findAdjacentPairs(markers)) {
        // 从 `wordDiffStrings(` 按位置拆出 delR、addR，让index分别处理这些返回值。
        const [delR, addR] = wordDiffStrings(
          entries[delIdx]!.code,
          entries[addIdx]!.code,
        )
        // ranges[delIdx更新为 `delR`，确保index后续读取最新状态。
        ranges[delIdx] = delR
        // ranges[addIdx更新为 `addR`，确保index后续读取最新状态。
        ranges[addIdx] = addR
      }
    }

    // Second pass: highlight + transform pipeline
    // out 从空数组开始收集，后续循环会按处理顺序追加条目。
    const out: string[] = []
    // 按索引扫描 `entries.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < entries.length; i++) {
      // 从 `entries[i]!` 解构 lineNumber、marker、code，减少index对同一对象的重复访问。
      const { lineNumber, marker, code } = entries[i]!
      // token 列表 先占位，稍后的条件分支会根据实际输入补齐它。
      const tokens: Block[] =
        marker === '-'
          ? [[defaultStyle(theme), code]]
          : highlightLine(hlState, code, theme)

      // h 集中保存index要一起传递的字段。
      const h: Highlight = { marker, lineNumber, lines: [tokens] }
      // 调用 removeNewlines，触发index此处需要的副作用。
      removeNewlines(h)
      // 调用 applyBackground，触发index此处需要的副作用。
      applyBackground(h, theme, ranges[i]!)
      // 调用 wrapText，触发index此处需要的副作用。
      wrapText(h, effectiveWidth, theme)
      // 当 `mode` 匹配 `'ansi' && marker === '-'` 时，index执行对应分支。
      if (mode === 'ansi' && marker === '-') {
        // 调用 dimContent，触发index此处需要的副作用。
        dimContent(h)
      }
      // 调用 addMarker，触发index此处需要的副作用。
      addMarker(h, theme)
      // 调用 addLineNumber，触发index此处需要的副作用。
      addLineNumber(h, theme, maxDigits, dim)
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(...intoLines(h, dim, false, mode))
    }
    // 返回 `out`，作为index这次计算的结果。
    return out
  }
}

// ColorFile 聚合index相关状态与操作，把同一职责的行为收束到类实例中。
export class ColorFile {
  private code: string
  private filePath: string

  // 构造函数接收 code: string, filePath: string，把外部输入整理成实例可复用的内部状态。
  constructor(code: string, filePath: string) {
    // 更新实例字段 code 为 code，同步index的内部状态。
    this.code = code
    // 更新实例字段 filePath 为 filePath，同步index的内部状态。
    this.filePath = filePath
  }

  // render 根据 themeName: string, width: number, dim: boolean 生成这一段界面或文本输出。
  render(themeName: string, width: number, dim: boolean): string[] | null {
    // mode读取`detectColorMode`，供index后续处理使用。
    const mode = detectColorMode(themeName)
    // 主题构建`buildTheme`，供index后续处理使用。
    const theme = buildTheme(themeName, mode)
    // 文本行格式化`code.split`，供index后续处理使用。
    const lines = this.code.split('\n')
    // Rust .lines() drops trailing empty line from trailing \n
    // 组合条件 `lines.length > 0 && lines[lines.length - 1] === '') lines.pop(` 成立时，index才启用这条专门路径。
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
    // firstLine保存`lines[0] ?? null`，供index后续判断或输出使用。
    const firstLine = lines[0] ?? null
    // lang读取`detectLanguage`，供index后续处理使用。
    const lang = detectLanguage(this.filePath, firstLine)
    // hlState 状态 集中保存index要一起传递的字段。
    const hlState = { lang, stack: null }

    // maxDigits 集合保存`String`，供index后续处理使用。
    const maxDigits = String(lines.length).length
    // effectiveWidth保存`Math.max`，供index后续处理使用。
    const effectiveWidth = Math.max(1, width - maxDigits - 2)

    // out 从空数组开始收集，后续循环会按处理顺序追加条目。
    const out: string[] = []
    // 按索引扫描 `lines.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < lines.length; i++) {
      // token 列表保存`highlightLine`，供index后续处理使用。
      const tokens = highlightLine(hlState, lines[i]!, theme)
      // h 集中保存index要一起传递的字段。
      const h: Highlight = { marker: null, lineNumber: i + 1, lines: [tokens] }
      // 调用 removeNewlines，触发index此处需要的副作用。
      removeNewlines(h)
      // 调用 wrapText，触发index此处需要的副作用。
      wrapText(h, effectiveWidth, theme)
      // 调用 addLineNumber，触发index此处需要的副作用。
      addLineNumber(h, theme, maxDigits, dim)
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(...intoLines(h, dim, true, mode))
    }
    // 返回 `out`，作为index这次计算的结果。
    return out
  }
}

// getSyntaxTheme 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSyntaxTheme(themeName: string): SyntaxTheme {
  // highlight.js has no bat theme set, so env vars can't select alternate
  // syntect themes. We still report the env var if set, for diagnostics.
  // envTheme 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const envTheme =
    process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT ?? process.env.BAT_THEME
  // 显式忽略 `envTheme` 的返回值，只保留它触发的副作用。
  void envTheme
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { theme: defaultSyntaxThemeName(themeName), source: null }
}

// Lazy loader to match vendor/color-diff-src/index.ts API
// cachedModule 缓存保存`null`，作为后续空值处理的输入。
let cachedModule: NativeModule | null = null

// getNativeModule 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNativeModule(): NativeModule | null {
  // 满足 `cachedModule` 时，index执行该分支。
  if (cachedModule) return cachedModule
  // cachedModule 缓存更新为 `{ ColorDiff, ColorFile, getSyntaxTheme }`，确保index后续读取最新状态。
  cachedModule = { ColorDiff, ColorFile, getSyntaxTheme }
  // 返回 `cachedModule`，作为index这次计算的结果。
  return cachedModule
}

// 导出类型定义，让其他模块沿用index的数据契约。
export type { ColorDiff as ColorDiffClass, ColorFile as ColorFileClass }

// Exported for testing
// __test 集中保存index要一起传递的字段。
export const __test = {
  tokenize,
  findAdjacentPairs,
  wordDiffStrings,
  ansi256FromRgb,
  colorToEscape,
  detectColorMode,
  detectLanguage,
}
