/**
 * ANSI Parser - Semantic Action Generator
 *
 * A streaming parser for ANSI escape sequences that produces semantic actions.
 * Uses the tokenizer for escape sequence boundary detection, then interprets
 * each sequence to produce structured actions.
 *
 * Key design decisions:
 * - Streaming: can process input incrementally
 * - Semantic output: produces structured actions, not string tokens
 * - Style tracking: maintains current text style state
 */

// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../../utils/intl.js'
// 引入 C0，将 ./ansi.js 中已经封装好的能力接到本文件流程里。
import { C0 } from './ansi.js'
// 引入 CSI、CURSOR_STYLES、ERASE_DISPLAY、ERASE_LINE_REGION，将 ./csi.js 中已经封装好的能力接到本文件流程里。
import { CSI, CURSOR_STYLES, ERASE_DISPLAY, ERASE_LINE_REGION } from './csi.js'
// 引入 DEC，将 ./dec.js 中已经封装好的能力接到本文件流程里。
import { DEC } from './dec.js'
// 引入 parseEsc，将 ./esc.js 中已经封装好的能力接到本文件流程里。
import { parseEsc } from './esc.js'
// 引入 parseOSC，将 ./osc.js 中已经封装好的能力接到本文件流程里。
import { parseOSC } from './osc.js'
// 引入 applySGR，将 ./sgr.js 中已经封装好的能力接到本文件流程里。
import { applySGR } from './sgr.js'
// 引入 createTokenizer、Token、Tokenizer，将 ./tokenize.js 中已经封装好的能力接到本文件流程里。
import { createTokenizer, type Token, type Tokenizer } from './tokenize.js'
// 类型依赖 { Action, Grapheme, TextStyle } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { Action, Grapheme, TextStyle } from './types.js'
// 引入 defaultStyle，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { defaultStyle } from './types.js'

// =============================================================================
// Grapheme Utilities
// =============================================================================

// isEmoji 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEmoji(codePoint: number): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
    (codePoint >= 0x2700 && codePoint <= 0x27bf) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x1fa00 && codePoint <= 0x1faff) ||
    (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff)
  )
}

// isEastAsianWide 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEastAsianWide(codePoint: number): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x9fff) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe1f) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
    (codePoint >= 0x30000 && codePoint <= 0x3fffd)
  )
}

// hasMultipleCodepoints 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasMultipleCodepoints(str: string): boolean {
  // count 数量保存`0`，供后续判断或组装使用。
  let count = 0
  // 按顺序遍历 `str` 中的_，逐个交给终端渲染处理。
  for (const _ of str) {
    // Ink 渲染层 parser在这里处理 `count++`，完成这一小步状态转换。
    count++
    // 满足 `count > 1` 时，终端渲染执行该分支。
    if (count > 1) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// graphemeWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function graphemeWidth(grapheme: string): 1 | 2 {
  // 满足 `hasMultipleCodepoints(grapheme)` 时，终端渲染执行该分支。
  if (hasMultipleCodepoints(grapheme)) return 2
  // codePoint保存`grapheme.codePointAt`，供终端渲染后续处理使用。
  const codePoint = grapheme.codePointAt(0)
  // 满足 `codePoint === undefined` 时，终端渲染执行该分支。
  if (codePoint === undefined) return 1
  // 只有 `isEmoji(codePoint) || isEastAsianWide(codePoint)` 满足时，终端渲染才执行该分支。
  if (isEmoji(codePoint) || isEastAsianWide(codePoint)) return 2
  // 返回 `1`，作为终端渲染这次计算的结果。
  return 1
}

// Ink 渲染层 parser在这里处理 `function* segmentGraphemes(str: string): Generator<Grapheme> {`，完成这一小步状态转换。
function* segmentGraphemes(str: string): Generator<Grapheme> {
  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(str)`，让终端渲染把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(str)) {
    // 生成器产出 `{ value: segment, width: graphemeWidth(segment) }`，把阶段性结果交给上层消费。
    yield { value: segment, width: graphemeWidth(segment) }
  }
}

// =============================================================================
// Sequence Parsing
// =============================================================================

// parseCSIParams 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCSIParams(paramStr: string): number[] {
  // 满足 `paramStr === ''` 时，终端渲染执行该分支。
  if (paramStr === '') return []
  // 返回 `paramStr.split(/[;:]/).map(s => (s === '' ? 0 : parseInt(s, 10)))`，作为终端渲染这次计算的结果。
  return paramStr.split(/[;:]/).map(s => (s === '' ? 0 : parseInt(s, 10)))
}

/** Parse a raw CSI sequence (e.g., "\x1b[31m") into an action */
// parseCSI 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCSI(rawSequence: string): Action | null {
  // inner格式化`rawSequence.slice`，供终端渲染后续处理使用。
  const inner = rawSequence.slice(2)
  // inner为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (inner.length === 0) return null

  // finalByte保存`inner.charCodeAt`，供终端渲染后续处理使用。
  const finalByte = inner.charCodeAt(inner.length - 1)
  // beforeFinal格式化`inner.slice`，供终端渲染后续处理使用。
  const beforeFinal = inner.slice(0, -1)

  // privateMode保存`''`，作为后续固定文本处理的输入。
  let privateMode = ''
  // paramStr保存`beforeFinal`，供后续判断或组装使用。
  let paramStr = beforeFinal
  // intermediate 命名 `''`，让后续代码直接表达这个值的用途。
  let intermediate = ''

  // 只有 `beforeFinal.length > 0 && '?>='.includes(beforeFinal[0]!)` 满足时，终端渲染才执行该分支。
  if (beforeFinal.length > 0 && '?>='.includes(beforeFinal[0]!)) {
    // privateMode更新为 `beforeFinal[0]!`，确保Ink 渲染层后续读取最新状态。
    privateMode = beforeFinal[0]!
    // paramStr更新为 `beforeFinal.slice(1)`，确保Ink 渲染层后续读取最新状态。
    paramStr = beforeFinal.slice(1)
  }

  // intermediateMatch匹配`paramStr.match`，供终端渲染后续处理使用。
  const intermediateMatch = paramStr.match(/([^0-9;:]+)$/)
  // 满足 `intermediateMatch` 时，终端渲染执行该分支。
  if (intermediateMatch) {
    // intermediate更新为 `intermediateMatch[1]!`，确保Ink 渲染层后续读取最新状态。
    intermediate = intermediateMatch[1]!
    // paramStr更新为 `paramStr.slice(0, -intermediate.length)`，确保Ink 渲染层后续读取最新状态。
    paramStr = paramStr.slice(0, -intermediate.length)
  }

  // params 集合解析`parseCSIParams`，供终端渲染后续处理使用。
  const params = parseCSIParams(paramStr)
  // p0读取 `params[0] ?? 1` 对应条目，后续围绕该成员继续处理。
  const p0 = params[0] ?? 1
  // p1读取 `params[1] ?? 1` 对应条目，后续围绕该成员继续处理。
  const p1 = params[1] ?? 1

  // SGR (Select Graphic Rendition)
  // 只有 `finalByte === CSI.SGR && privateMode === ''` 满足时，终端渲染才执行该分支。
  if (finalByte === CSI.SGR && privateMode === '') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'sgr', params: paramStr }
  }

  // Cursor movement
  // 满足 `finalByte === CSI.CUU` 时，终端渲染执行该分支。
  if (finalByte === CSI.CUU) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'up', count: p0 },
    }
  }
  // 满足 `finalByte === CSI.CUD` 时，终端渲染执行该分支。
  if (finalByte === CSI.CUD) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'down', count: p0 },
    }
  }
  // 满足 `finalByte === CSI.CUF` 时，终端渲染执行该分支。
  if (finalByte === CSI.CUF) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'forward', count: p0 },
    }
  }
  // 满足 `finalByte === CSI.CUB` 时，终端渲染执行该分支。
  if (finalByte === CSI.CUB) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'back', count: p0 },
    }
  }
  // 满足 `finalByte === CSI.CNL` 时，终端渲染执行该分支。
  if (finalByte === CSI.CNL) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'nextLine', count: p0 } }
  }
  // 满足 `finalByte === CSI.CPL` 时，终端渲染执行该分支。
  if (finalByte === CSI.CPL) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'prevLine', count: p0 } }
  }
  // 满足 `finalByte === CSI.CHA` 时，终端渲染执行该分支。
  if (finalByte === CSI.CHA) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'column', col: p0 } }
  }
  // 只有 `finalByte === CSI.CUP || finalByte === CSI.HVP` 满足时，终端渲染才执行该分支。
  if (finalByte === CSI.CUP || finalByte === CSI.HVP) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'position', row: p0, col: p1 } }
  }
  // 满足 `finalByte === CSI.VPA` 时，终端渲染执行该分支。
  if (finalByte === CSI.VPA) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'row', row: p0 } }
  }

  // Erase
  // 满足 `finalByte === CSI.ED` 时，终端渲染执行该分支。
  if (finalByte === CSI.ED) {
    // region 命名 `ERASE_DISPLAY[params[0] ?? 0] ?? 'toEnd'`，让后续代码直接表达这个值的用途。
    const region = ERASE_DISPLAY[params[0] ?? 0] ?? 'toEnd'
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'erase', action: { type: 'display', region } }
  }
  // 满足 `finalByte === CSI.EL` 时，终端渲染执行该分支。
  if (finalByte === CSI.EL) {
    // region读取 `ERASE_LINE_REGION[params[0] ?? 0] ?? 'toEnd'` 对应条目，后续围绕该成员继续处理。
    const region = ERASE_LINE_REGION[params[0] ?? 0] ?? 'toEnd'
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'erase', action: { type: 'line', region } }
  }
  // 满足 `finalByte === CSI.ECH` 时，终端渲染执行该分支。
  if (finalByte === CSI.ECH) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'erase', action: { type: 'chars', count: p0 } }
  }

  // Scroll
  // 满足 `finalByte === CSI.SU` 时，终端渲染执行该分支。
  if (finalByte === CSI.SU) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'scroll', action: { type: 'up', count: p0 } }
  }
  // 满足 `finalByte === CSI.SD` 时，终端渲染执行该分支。
  if (finalByte === CSI.SD) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'scroll', action: { type: 'down', count: p0 } }
  }
  // 满足 `finalByte === CSI.DECSTBM` 时，终端渲染执行该分支。
  if (finalByte === CSI.DECSTBM) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'scroll',
      action: { type: 'setRegion', top: p0, bottom: p1 },
    }
  }

  // Cursor save/restore
  // 满足 `finalByte === CSI.SCOSC` 时，终端渲染执行该分支。
  if (finalByte === CSI.SCOSC) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'save' } }
  }
  // 满足 `finalByte === CSI.SCORC` 时，终端渲染执行该分支。
  if (finalByte === CSI.SCORC) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'restore' } }
  }

  // Cursor style
  // 当 `finalByte === CSI.DECSCUSR && intermediate` 匹配 `' '` 时，终端渲染执行对应分支。
  if (finalByte === CSI.DECSCUSR && intermediate === ' ') {
    // styleInfo读取 `CURSOR_STYLES[p0] ?? CURSOR_STYLES[0]!` 对应条目，后续围绕该成员继续处理。
    const styleInfo = CURSOR_STYLES[p0] ?? CURSOR_STYLES[0]!
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'style', ...styleInfo } }
  }

  // Private modes
  // 只有 `privateMode === '?' && (finalByte === CSI.SM || finalByte === CSI.RM)` 满足时，终端渲染才执行该分支。
  if (privateMode === '?' && (finalByte === CSI.SM || finalByte === CSI.RM)) {
    // enabled标记Ink 渲染层 parser是否启用对应路径。
    const enabled = finalByte === CSI.SM

    // 满足 `p0 === DEC.CURSOR_VISIBLE` 时，终端渲染执行该分支。
    if (p0 === DEC.CURSOR_VISIBLE) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'cursor',
        action: enabled ? { type: 'show' } : { type: 'hide' },
      }
    }
    // 只有 `p0 === DEC.ALT_SCREEN_CLEAR || p0 === DEC.ALT_SCR` 满足时，终端渲染才执行该分支。
    if (p0 === DEC.ALT_SCREEN_CLEAR || p0 === DEC.ALT_SCREEN) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'mode', action: { type: 'alternateScreen', enabled } }
    }
    // 满足 `p0 === DEC.BRACKETED_PASTE` 时，终端渲染执行该分支。
    if (p0 === DEC.BRACKETED_PASTE) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'mode', action: { type: 'bracketedPaste', enabled } }
    }
    // 满足 `p0 === DEC.MOUSE_NORMAL` 时，终端渲染执行该分支。
    if (p0 === DEC.MOUSE_NORMAL) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'mode',
        action: { type: 'mouseTracking', mode: enabled ? 'normal' : 'off' },
      }
    }
    // 满足 `p0 === DEC.MOUSE_BUTTON` 时，终端渲染执行该分支。
    if (p0 === DEC.MOUSE_BUTTON) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'mode',
        action: { type: 'mouseTracking', mode: enabled ? 'button' : 'off' },
      }
    }
    // 满足 `p0 === DEC.MOUSE_ANY` 时，终端渲染执行该分支。
    if (p0 === DEC.MOUSE_ANY) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'mode',
        action: { type: 'mouseTracking', mode: enabled ? 'any' : 'off' },
      }
    }
    // 满足 `p0 === DEC.FOCUS_EVENTS` 时，终端渲染执行该分支。
    if (p0 === DEC.FOCUS_EVENTS) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'mode', action: { type: 'focusEvents', enabled } }
    }
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { type: 'unknown', sequence: rawSequence }
}

/**
 * Identify the type of escape sequence from its raw form.
 */
// identifySequence 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function identifySequence(
  seq: string,
): 'csi' | 'osc' | 'esc' | 'ss3' | 'unknown' {
  // 满足 `seq.length < 2` 时，终端渲染执行该分支。
  if (seq.length < 2) return 'unknown'
  // `seq.charCodeAt(0)` 与 `C0.ESC` 不一致时刷新派生状态，避免使用过期结果。
  if (seq.charCodeAt(0) !== C0.ESC) return 'unknown'

  // second保存`seq.charCodeAt`，供终端渲染后续处理使用。
  const second = seq.charCodeAt(1)
  // 满足 `second === 0x5b` 时，终端渲染执行该分支。
  if (second === 0x5b) return 'csi' // [
  // 满足 `second === 0x5d` 时，终端渲染执行该分支。
  if (second === 0x5d) return 'osc' // ]
  // 满足 `second === 0x4f` 时，终端渲染执行该分支。
  if (second === 0x4f) return 'ss3' // O
  // 返回 `'esc'`，作为终端渲染这次计算的结果。
  return 'esc'
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parser class - maintains state for streaming/incremental parsing
 *
 * Usage:
 * ```typescript
 * const parser = new Parser()
 * const actions1 = parser.feed('partial\x1b[')
 * const actions2 = parser.feed('31mred')  // state maintained internally
 * ```
 */
// Parser 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class Parser {
  private tokenizer: Tokenizer = createTokenizer()

  style: TextStyle = defaultStyle()
  inLink = false
  linkUrl: string | undefined

  // reset 使用 无 完成终端渲染里的对应操作。
  reset(): void {
    // 调用 this.tokenizer.reset，触发终端渲染此处需要的副作用。
    this.tokenizer.reset()
    // 更新实例字段 style 为 defaultStyle()，同步终端渲染的内部状态。
    this.style = defaultStyle()
    // 更新实例字段 inLink 为 false，同步终端渲染的内部状态。
    this.inLink = false
    // 更新实例字段 linkUrl 为 undefined，同步终端渲染的内部状态。
    this.linkUrl = undefined
  }

  /** Feed input and get resulting actions */
  // feed 使用 input: string 完成终端渲染里的对应操作。
  feed(input: string): Action[] {
    // token 列表保存`tokenizer.feed`，供终端渲染后续处理使用。
    const tokens = this.tokenizer.feed(input)
    // actions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const actions: Action[] = []

    // 按顺序遍历 `tokens` 中的token，逐个交给终端渲染处理。
    for (const token of tokens) {
      // tokenActions 集合保存`this.processToken`，供终端渲染后续处理使用。
      const tokenActions = this.processToken(token)
      // actions 集合追加新条目，保持收集顺序与输入顺序一致。
      actions.push(...tokenActions)
    }

    // 返回 `actions`，作为终端渲染这次计算的结果。
    return actions
  }

  // Ink 渲染层 parser在这里处理 `private processToken(token: Token): Action[] {`，完成这一小步状态转换。
  private processToken(token: Token): Action[] {
    // 按照 token.type 的取值选择终端渲染的具体处理分支。
    switch (token.type) {
      case 'text':
        // 返回 `this.processText(token.value)`，作为终端渲染这次计算的结果。
        return this.processText(token.value)

      case 'sequence':
        // 返回 `this.processSequence(token.value)`，作为终端渲染这次计算的结果。
        return this.processSequence(token.value)
    }
  }

  // Ink 渲染层 parser在这里处理 `private processText(text: string): Action[] {`，完成这一小步状态转换。
  private processText(text: string): Action[] {
    // Handle BEL characters embedded in text
    // actions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const actions: Action[] = []
    // current固定为 `''`，作为Ink 渲染层 parser后续展示或比较的基准。
    let current = ''

    // 按顺序遍历 `text` 中的char，逐个交给终端渲染处理。
    for (const char of text) {
      // 满足 `char.charCodeAt(0) === C0.BEL` 时，终端渲染执行该分支。
      if (char.charCodeAt(0) === C0.BEL) {
        // 满足 `current` 时，终端渲染执行该分支。
        if (current) {
          // graphemes 集合保存`segmentGraphemes`，供终端渲染后续处理使用。
          const graphemes = [...segmentGraphemes(current)]
          // 满足 `graphemes.length > 0` 时，终端渲染执行该分支。
          if (graphemes.length > 0) {
            // actions 集合追加新条目，保持收集顺序与输入顺序一致。
            actions.push({ type: 'text', graphemes, style: { ...this.style } })
          }
          // current更新为 `''`，确保Ink 渲染层后续读取最新状态。
          current = ''
        }
        // actions 集合追加新条目，保持收集顺序与输入顺序一致。
        actions.push({ type: 'bell' })
      } else {
        // Ink 渲染层 parser在这里处理 `current += char`，完成这一小步状态转换。
        current += char
      }
    }

    // 满足 `current` 时，终端渲染执行该分支。
    if (current) {
      // graphemes 集合保存`segmentGraphemes`，供终端渲染后续处理使用。
      const graphemes = [...segmentGraphemes(current)]
      // 满足 `graphemes.length > 0` 时，终端渲染执行该分支。
      if (graphemes.length > 0) {
        // actions 集合追加新条目，保持收集顺序与输入顺序一致。
        actions.push({ type: 'text', graphemes, style: { ...this.style } })
      }
    }

    // 返回 `actions`，作为终端渲染这次计算的结果。
    return actions
  }

  // Ink 渲染层 parser在这里处理 `private processSequence(seq: string): Action[] {`，完成这一小步状态转换。
  private processSequence(seq: string): Action[] {
    // seqType保存`identifySequence`，供终端渲染后续处理使用。
    const seqType = identifySequence(seq)

    // 按照 seqType 的取值选择终端渲染的具体处理分支。
    switch (seqType) {
      case 'csi': {
        // action解析`parseCSI`，供终端渲染后续处理使用。
        const action = parseCSI(seq)
        // action缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!action) return []
        // 当 `action.type` 匹配 `'sgr'` 时，终端渲染执行对应分支。
        if (action.type === 'sgr') {
          // 更新实例字段 style 为 applySGR(action.params, this.style)，同步终端渲染的内部状态。
          this.style = applySGR(action.params, this.style)
          // 返回列表结果，保留终端渲染已经排好的条目顺序。
          return []
        }
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [action]
      }

      case 'osc': {
        // Extract OSC content (between ESC ] and terminator)
        // 文本内容格式化`seq.slice`，供终端渲染后续处理使用。
        let content = seq.slice(2)
        // Remove terminator (BEL or ESC \)
        // 满足 `content.endsWith('\x07')` 时，终端渲染执行该分支。
        if (content.endsWith('\x07')) {
          // 文本内容更新为 `content.slice(0, -1)`，确保Ink 渲染层后续读取最新状态。
          content = content.slice(0, -1)
        // Ink 渲染层 parser在这里处理 `} else if (content.endsWith('\x1b\\')) {`，完成这一小步状态转换。
        } else if (content.endsWith('\x1b\\')) {
          // 文本内容更新为 `content.slice(0, -2)`，确保Ink 渲染层后续读取最新状态。
          content = content.slice(0, -2)
        }

        // action解析`parseOSC`，供终端渲染后续处理使用。
        const action = parseOSC(content)
        // 满足 `action` 时，终端渲染执行该分支。
        if (action) {
          // 当 `action.type` 匹配 `'link'` 时，终端渲染执行对应分支。
          if (action.type === 'link') {
            // 当 `action.action.type` 匹配 `'start'` 时，终端渲染执行对应分支。
            if (action.action.type === 'start') {
              // 更新实例字段 inLink 为 true，同步终端渲染的内部状态。
              this.inLink = true
              // 更新实例字段 linkUrl 为 action.action.url，同步终端渲染的内部状态。
              this.linkUrl = action.action.url
            } else {
              // 更新实例字段 inLink 为 false，同步终端渲染的内部状态。
              this.inLink = false
              // 更新实例字段 linkUrl 为 undefined，同步终端渲染的内部状态。
              this.linkUrl = undefined
            }
          }
          // 返回列表结果，保留终端渲染已经排好的条目顺序。
          return [action]
        }
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return []
      }

      case 'esc': {
        // escContent格式化`seq.slice`，供终端渲染后续处理使用。
        const escContent = seq.slice(1)
        // action解析`parseEsc`，供终端渲染后续处理使用。
        const action = parseEsc(escContent)
        // 返回 `action ? [action] : []`，作为终端渲染这次计算的结果。
        return action ? [action] : []
      }

      case 'ss3':
        // SS3 sequences are typically cursor keys in application mode
        // For output parsing, treat as unknown
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [{ type: 'unknown', sequence: seq }]

      default:
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [{ type: 'unknown', sequence: seq }]
    }
  }
}
