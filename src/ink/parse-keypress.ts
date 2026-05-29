/**
 * Keyboard input parser - converts terminal input to key events
 *
 * Uses the termio tokenizer for escape sequence boundary detection,
 * then interprets sequences as keypresses.
 */
// 引入 Buffer，将 buffer 中已经封装好的能力接到本文件流程里。
import { Buffer } from 'buffer'
// 引入 PASTE_END、PASTE_START，将 ./termio/csi.js 中已经封装好的能力接到本文件流程里。
import { PASTE_END, PASTE_START } from './termio/csi.js'
// 引入 createTokenizer、Tokenizer，将 ./termio/tokenize.js 中已经封装好的能力接到本文件流程里。
import { createTokenizer, type Tokenizer } from './termio/tokenize.js'

// eslint-disable-next-line no-control-regex
// META_KEY_CODE_RE 命名 `/^(?:\x1b)([a-zA-Z0-9])$/`，让后续代码直接表达这个值的用途。
const META_KEY_CODE_RE = /^(?:\x1b)([a-zA-Z0-9])$/

// eslint-disable-next-line no-control-regex
// FN_KEY_RE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const FN_KEY_RE =
  // eslint-disable-next-line no-control-regex
  /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/

// CSI u (kitty keyboard protocol): ESC [ codepoint [; modifier] u
// Example: ESC[13;2u = Shift+Enter, ESC[27u = Escape (no modifiers)
// Modifier is optional - when absent, defaults to 1 (no modifiers)
// eslint-disable-next-line no-control-regex
// CSI_U_RE保存`/^\x1b\[(\d+)(?:;(\d+))?u/`，供Ink 渲染层 parse keypress后续判断或输出使用。
const CSI_U_RE = /^\x1b\[(\d+)(?:;(\d+))?u/

// xterm modifyOtherKeys: ESC [ 27 ; modifier ; keycode ~
// Example: ESC[27;2;13~ = Shift+Enter. Emitted by Ghostty/tmux/xterm when
// modifyOtherKeys=2 is active or via user keybinds, typically over SSH where
// TERM sniffing misses Ghostty and we never push Kitty keyboard mode.
// Note param order is reversed vs CSI u (modifier first, keycode second).
// eslint-disable-next-line no-control-regex
// MODIFY_OTHER_KEYS_RE保存`/^\x1b\[27;(\d+);(\d+)~/`，供Ink 渲染层 parse keypress后续判断或输出使用。
const MODIFY_OTHER_KEYS_RE = /^\x1b\[27;(\d+);(\d+)~/

// -- Terminal response patterns (inbound sequences from the terminal itself) --
// DECRPM: CSI ? Ps ; Pm $ y  — response to DECRQM (request mode)
// eslint-disable-next-line no-control-regex
// DECRPM_RE保存`/^\x1b\[\?(\d+);(\d+)\$y$/`，供后续判断或组装使用。
const DECRPM_RE = /^\x1b\[\?(\d+);(\d+)\$y$/
// DA1: CSI ? Ps ; ... c  — primary device attributes response
// eslint-disable-next-line no-control-regex
// DA1_RE读取 `/^\x1b\[\?([\d;]*)c$/` 对应条目，后续围绕该成员继续处理。
const DA1_RE = /^\x1b\[\?([\d;]*)c$/
// DA2: CSI > Ps ; ... c  — secondary device attributes response
// eslint-disable-next-line no-control-regex
// DA2_RE 命名 `/^\x1b\[>([\d;]*)c$/`，让后续代码直接表达这个值的用途。
const DA2_RE = /^\x1b\[>([\d;]*)c$/
// Kitty keyboard flags: CSI ? flags u  — response to CSI ? u query
// (private ? marker distinguishes from CSI u key events)
// eslint-disable-next-line no-control-regex
// KITTY_FLAGS_RE 命名 `/^\x1b\[\?(\d+)u$/`，让后续代码直接表达这个值的用途。
const KITTY_FLAGS_RE = /^\x1b\[\?(\d+)u$/
// DECXCPR cursor position: CSI ? row ; col R
// The ? marker disambiguates from modified F3 keys (Shift+F3 = CSI 1;2 R,
// Ctrl+F3 = CSI 1;5 R, etc.) — plain CSI row;col R is genuinely ambiguous.
// eslint-disable-next-line no-control-regex
// CURSOR_POSITION_RE保存`/^\x1b\[\?(\d+);(\d+)R$/`，供后续判断或组装使用。
const CURSOR_POSITION_RE = /^\x1b\[\?(\d+);(\d+)R$/
// OSC response: OSC code ; data (BEL|ST)
// eslint-disable-next-line no-control-regex
// OSC_RESPONSE_RE 响应数据 命名 `/^\x1b\](\d+);(.*?)(?:\x07|\x1b\\)$/s`，让后续代码直接表达这个值的用途。
const OSC_RESPONSE_RE = /^\x1b\](\d+);(.*?)(?:\x07|\x1b\\)$/s
// XTVERSION: DCS > | name ST  — terminal name/version string (answer to CSI > 0 q).
// xterm.js replies "xterm.js(X.Y.Z)"; Ghostty, kitty, iTerm2, etc. reply with
// their own name. Unlike TERM_PROGRAM, this survives SSH since the query/reply
// goes through the pty, not the environment.
// eslint-disable-next-line no-control-regex
// XTVERSION_RE 命名 `/^\x1bP>\|(.*?)(?:\x07|\x1b\\)$/s`，让后续代码直接表达这个值的用途。
const XTVERSION_RE = /^\x1bP>\|(.*?)(?:\x07|\x1b\\)$/s
// SGR mouse event: CSI < button ; col ; row M (press) or m (release)
// Button codes: 64=wheel-up, 65=wheel-down (0x40 | wheel-bit).
// Button 32=left-drag (0x20 | motion-bit). Plain 0/1/2 = left/mid/right click.
// eslint-disable-next-line no-control-regex
// SGR_MOUSE_RE 命名 `/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/`，让后续代码直接表达这个值的用途。
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/

// createPasteKey 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createPasteKey(content: string): ParsedKey {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    kind: 'key',
    name: '',
    fn: false,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    super: false,
    sequence: content,
    raw: content,
    isPasted: true,
  }
}

/** DECRPM status values (response to DECRQM) */
// DECRPM_STATUS 集合 集中保存Ink 渲染层 parse keypress要一起传递的字段。
export const DECRPM_STATUS = {
  NOT_RECOGNIZED: 0,
  SET: 1,
  RESET: 2,
  PERMANENTLY_SET: 3,
  PERMANENTLY_RESET: 4,
} as const

/**
 * A response sequence received from the terminal (not a keypress).
 * Emitted in answer to queries like DECRQM, DA1, OSC 11, etc.
 */
// TerminalResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalResponse =
  /** DECRPM: answer to DECRQM (request DEC private mode status) */
  | { type: 'decrpm'; mode: number; status: number }
  /** DA1: primary device attributes (used as a universal sentinel) */
  | { type: 'da1'; params: number[] }
  /** DA2: secondary device attributes (terminal version info) */
  | { type: 'da2'; params: number[] }
  /** Kitty keyboard protocol: current flags (answer to CSI ? u) */
  | { type: 'kittyKeyboard'; flags: number }
  /** DSR: cursor position report (answer to CSI 6 n) */
  | { type: 'cursorPosition'; row: number; col: number }
  /** OSC response: generic operating-system-command reply (e.g. OSC 11 bg color) */
  | { type: 'osc'; code: number; data: string }
  /** XTVERSION: terminal name/version string (answer to CSI > 0 q).
   *  Example values: "xterm.js(5.5.0)", "ghostty 1.2.0", "iTerm2 3.6". */
  | { type: 'xtversion'; name: string }

/**
 * Try to recognize a sequence token as a terminal response.
 * Returns null if the sequence is not a known response pattern
 * (i.e. it should be treated as a keypress).
 *
 * These patterns are syntactically distinguishable from keyboard input —
 * no physical key produces CSI ? ... c or CSI ? ... $ y, so they can be
 * safely parsed out of the input stream at any time.
 */
// parseTerminalResponse 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTerminalResponse(s: string): TerminalResponse | null {
  // CSI-prefixed responses
  // 满足 `s.startsWith('\x1b[')` 时，终端渲染执行该分支。
  if (s.startsWith('\x1b[')) {
    // m 先占位，稍后的条件分支会根据实际输入补齐它。
    let m: RegExpExecArray | null

    // 满足 `(m = DECRPM_RE.exec(s))` 时，终端渲染执行该分支。
    if ((m = DECRPM_RE.exec(s))) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'decrpm',
        mode: parseInt(m[1]!, 10),
        status: parseInt(m[2]!, 10),
      }
    }

    // 满足 `(m = DA1_RE.exec(s))` 时，终端渲染执行该分支。
    if ((m = DA1_RE.exec(s))) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'da1', params: splitNumericParams(m[1]!) }
    }

    // 满足 `(m = DA2_RE.exec(s))` 时，终端渲染执行该分支。
    if ((m = DA2_RE.exec(s))) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'da2', params: splitNumericParams(m[1]!) }
    }

    // 满足 `(m = KITTY_FLAGS_RE.exec(s))` 时，终端渲染执行该分支。
    if ((m = KITTY_FLAGS_RE.exec(s))) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'kittyKeyboard', flags: parseInt(m[1]!, 10) }
    }

    // 满足 `(m = CURSOR_POSITION_RE.exec(s))` 时，终端渲染执行该分支。
    if ((m = CURSOR_POSITION_RE.exec(s))) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        type: 'cursorPosition',
        row: parseInt(m[1]!, 10),
        col: parseInt(m[2]!, 10),
      }
    }

    // 返回 `null`，作为终端渲染这次计算的结果。
    return null
  }

  // OSC responses (e.g. OSC 11 ; rgb:... for bg color query)
  // 满足 `s.startsWith('\x1b]')` 时，终端渲染执行该分支。
  if (s.startsWith('\x1b]')) {
    // m保存`OSC_RESPONSE_RE.exec`，供终端渲染后续处理使用。
    const m = OSC_RESPONSE_RE.exec(s)
    // 满足 `m` 时，终端渲染执行该分支。
    if (m) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'osc', code: parseInt(m[1]!, 10), data: m[2]! }
    }
  }

  // DCS responses (e.g. XTVERSION: DCS > | name ST)
  // 满足 `s.startsWith('\x1bP')` 时，终端渲染执行该分支。
  if (s.startsWith('\x1bP')) {
    // m保存`XTVERSION_RE.exec`，供终端渲染后续处理使用。
    const m = XTVERSION_RE.exec(s)
    // 满足 `m` 时，终端渲染执行该分支。
    if (m) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'xtversion', name: m[1]! }
    }
  }

  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// splitNumericParams 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function splitNumericParams(params: string): number[] {
  // params 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!params) return []
  // 返回 `params.split(';').map(p => parseInt(p, 10))`，作为终端渲染这次计算的结果。
  return params.split(';').map(p => parseInt(p, 10))
}

// KeyParseState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type KeyParseState = {
  mode: 'NORMAL' | 'IN_PASTE'
  incomplete: string
  pasteBuffer: string
  // Internal tokenizer instance
  _tokenizer?: Tokenizer
}

// INITIAL_STATE 状态 集中保存Ink 渲染层 parse keypress要一起传递的字段。
export const INITIAL_STATE: KeyParseState = {
  mode: 'NORMAL',
  incomplete: '',
  pasteBuffer: '',
}

// inputToString 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function inputToString(input: Buffer | string): string {
  // 满足 `Buffer.isBuffer(input)` 时，终端渲染执行该分支。
  if (Buffer.isBuffer(input)) {
    // 只有 `input[0]! > 127 && input[1] === undefined` 满足时，终端渲染才执行该分支。
    if (input[0]! > 127 && input[1] === undefined) {
      // Ink 渲染层 parse keypress在这里处理 `;(input[0] as unknown as number) -= 128`，完成这一小步状态转换。
      ;(input[0] as unknown as number) -= 128
      // 返回 `'\x1b' + String(input)`，作为终端渲染这次计算的结果。
      return '\x1b' + String(input)
    } else {
      // 返回 `String(input)`，作为终端渲染这次计算的结果。
      return String(input)
    }
  // Ink 渲染层 parse keypress在这里处理 `} else if (input !== undefined && typeof input !== 'string') {`，完成这一小步状态转换。
  } else if (input !== undefined && typeof input !== 'string') {
    // 返回 `String(input)`，作为终端渲染这次计算的结果。
    return String(input)
  // Ink 渲染层 parse keypress在这里处理 `} else if (!input) {`，完成这一小步状态转换。
  } else if (!input) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  } else {
    // 返回 `input`，作为终端渲染这次计算的结果。
    return input
  }
}

// parseMultipleKeypresses 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseMultipleKeypresses(
  prevState: KeyParseState,
  input: Buffer | string | null = '',
): [ParsedInput[], KeyParseState] {
  // isFlush标记Ink 渲染层 parse keypress是否启用对应路径。
  const isFlush = input === null
  // inputString保存`inputToString`，供终端渲染后续处理使用。
  const inputString = isFlush ? '' : inputToString(input)

  // Get or create tokenizer
  // tokenizer构建`createTokenizer`，供终端渲染后续处理使用。
  const tokenizer = prevState._tokenizer ?? createTokenizer({ x10Mouse: true })

  // Tokenize the input
  // token 列表保存`tokenizer.flush`，供终端渲染后续处理使用。
  const tokens = isFlush ? tokenizer.flush() : tokenizer.feed(inputString)

  // Convert tokens to parsed keys, handling paste mode
  // keys 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const keys: ParsedInput[] = []
  // inPaste标记Ink 渲染层 parse keypress是否启用对应路径。
  let inPaste = prevState.mode === 'IN_PASTE'
  // pasteBuffer 命名 `prevState.pasteBuffer`，让后续代码直接表达这个值的用途。
  let pasteBuffer = prevState.pasteBuffer

  // 按顺序遍历 `tokens` 中的token，逐个交给终端渲染处理。
  for (const token of tokens) {
    // 当 `token.type` 匹配 `'sequence'` 时，终端渲染执行对应分支。
    if (token.type === 'sequence') {
      // 满足 `token.value === PASTE_START` 时，终端渲染执行该分支。
      if (token.value === PASTE_START) {
        // inPaste更新为 `true`，确保Ink 渲染层后续读取最新状态。
        inPaste = true
        // pasteBuffer更新为 `''`，确保Ink 渲染层后续读取最新状态。
        pasteBuffer = ''
      // Ink 渲染层 parse keypress在这里处理 `} else if (token.value === PASTE_END) {`，完成这一小步状态转换。
      } else if (token.value === PASTE_END) {
        // Always emit a paste key, even for empty pastes. This allows
        // downstream handlers to detect empty pastes (e.g., for clipboard
        // image handling on macOS). The paste content may be empty string.
        // keys 集合追加新条目，保持收集顺序与输入顺序一致。
        keys.push(createPasteKey(pasteBuffer))
        // inPaste更新为 `false`，确保Ink 渲染层后续读取最新状态。
        inPaste = false
        // pasteBuffer更新为 `''`，确保Ink 渲染层后续读取最新状态。
        pasteBuffer = ''
      // Ink 渲染层 parse keypress在这里处理 `} else if (inPaste) {`，完成这一小步状态转换。
      } else if (inPaste) {
        // Sequences inside paste are treated as literal text
        // Ink 渲染层 parse keypress在这里处理 `pasteBuffer += token.value`，完成这一小步状态转换。
        pasteBuffer += token.value
      } else {
        // 接口响应解析`parseTerminalResponse`，供终端渲染后续处理使用。
        const response = parseTerminalResponse(token.value)
        // 满足 `response` 时，终端渲染执行该分支。
        if (response) {
          // keys 集合追加新条目，保持收集顺序与输入顺序一致。
          keys.push({ kind: 'response', sequence: token.value, response })
        } else {
          // mouse解析`parseMouseEvent`，供终端渲染后续处理使用。
          const mouse = parseMouseEvent(token.value)
          // 满足 `mouse` 时，终端渲染执行该分支。
          if (mouse) {
            // keys 集合追加新条目，保持收集顺序与输入顺序一致。
            keys.push(mouse)
          } else {
            // keys 集合追加新条目，保持收集顺序与输入顺序一致。
            keys.push(parseKeypress(token.value))
          }
        }
      }
    // Ink 渲染层 parse keypress在这里处理 `} else if (token.type === 'text') {`，完成这一小步状态转换。
    } else if (token.type === 'text') {
      // 满足 `inPaste` 时，终端渲染执行该分支。
      if (inPaste) {
        // Ink 渲染层 parse keypress在这里处理 `pasteBuffer += token.value`，完成这一小步状态转换。
        pasteBuffer += token.value
      // Ink 渲染层 parse keypress在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        /^\[<\d+;\d+;\d+[Mm]$/.test(token.value) ||
        /^\[M[\x60-\x7f][\x20-\uffff]{2}$/.test(token.value)
      ) {
        // Orphaned SGR/X10 mouse tail (fullscreen only — mouse tracking is off
        // otherwise). A heavy render blocked the event loop past App's 50ms
        // flush timer, so the buffered ESC was flushed as a lone Escape and
        // the continuation `[<btn;col;rowM` arrived as text. Re-synthesize
        // with the ESC prefix so the scroll event still fires instead of
        // leaking into the prompt. The spurious Escape is gone; App.tsx's
        // readableLength check prevents it. The X10 Cb slot is narrowed to
        // the wheel range [\x60-\x7f] (0x40|modifiers + 32) — a full [\x20-]
        // range would match typed input like `[MAX]` batched into one read
        // and silently drop it as a phantom click. Click/drag orphans leak
        // as visible garbage instead; deletable garbage beats silent loss.
        // resynthesized保存`'\x1b' + token.value`，作为后续固定文本处理的输入。
        const resynthesized = '\x1b' + token.value
        // mouse解析`parseMouseEvent`，供终端渲染后续处理使用。
        const mouse = parseMouseEvent(resynthesized)
        // keys 集合追加新条目，保持收集顺序与输入顺序一致。
        keys.push(mouse ?? parseKeypress(resynthesized))
      } else {
        // keys 集合追加新条目，保持收集顺序与输入顺序一致。
        keys.push(parseKeypress(token.value))
      }
    }
  }

  // If flushing and still in paste mode, emit what we have
  // 只有 `isFlush && inPaste && pasteBuffer` 满足时，终端渲染才执行该分支。
  if (isFlush && inPaste && pasteBuffer) {
    // keys 集合追加新条目，保持收集顺序与输入顺序一致。
    keys.push(createPasteKey(pasteBuffer))
    // inPaste更新为 `false`，确保Ink 渲染层后续读取最新状态。
    inPaste = false
    // pasteBuffer更新为 `''`，确保Ink 渲染层后续读取最新状态。
    pasteBuffer = ''
  }

  // Build new state
  // newState 状态 集中保存Ink 渲染层 parse keypress要一起传递的字段。
  const newState: KeyParseState = {
    mode: inPaste ? 'IN_PASTE' : 'NORMAL',
    incomplete: tokenizer.buffer(),
    pasteBuffer,
    _tokenizer: tokenizer,
  }

  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [keys, newState]
}

// keyName 集中保存Ink 渲染层 parse keypress要一起传递的字段。
const keyName: Record<string, string> = {
  /* xterm/gnome ESC O letter */
  OP: 'f1',
  OQ: 'f2',
  OR: 'f3',
  OS: 'f4',
  /* Application keypad mode (numpad digits 0-9) */
  Op: '0',
  Oq: '1',
  Or: '2',
  Os: '3',
  Ot: '4',
  Ou: '5',
  Ov: '6',
  Ow: '7',
  Ox: '8',
  Oy: '9',
  /* Application keypad mode (numpad operators) */
  Oj: '*',
  Ok: '+',
  Ol: ',',
  Om: '-',
  On: '.',
  Oo: '/',
  OM: 'return',
  /* xterm/rxvt ESC [ number ~ */
  '[11~': 'f1',
  '[12~': 'f2',
  '[13~': 'f3',
  '[14~': 'f4',
  /* from Cygwin and used in libuv */
  '[[A': 'f1',
  '[[B': 'f2',
  '[[C': 'f3',
  '[[D': 'f4',
  '[[E': 'f5',
  /* common */
  '[15~': 'f5',
  '[17~': 'f6',
  '[18~': 'f7',
  '[19~': 'f8',
  '[20~': 'f9',
  '[21~': 'f10',
  '[23~': 'f11',
  '[24~': 'f12',
  /* xterm ESC [ letter */
  '[A': 'up',
  '[B': 'down',
  '[C': 'right',
  '[D': 'left',
  '[E': 'clear',
  '[F': 'end',
  '[H': 'home',
  /* xterm/gnome ESC O letter */
  OA: 'up',
  OB: 'down',
  OC: 'right',
  OD: 'left',
  OE: 'clear',
  OF: 'end',
  OH: 'home',
  /* xterm/rxvt ESC [ number ~ */
  '[1~': 'home',
  '[2~': 'insert',
  '[3~': 'delete',
  '[4~': 'end',
  '[5~': 'pageup',
  '[6~': 'pagedown',
  /* putty */
  '[[5~': 'pageup',
  '[[6~': 'pagedown',
  /* rxvt */
  '[7~': 'home',
  '[8~': 'end',
  /* rxvt keys with modifiers */
  '[a': 'up',
  '[b': 'down',
  '[c': 'right',
  '[d': 'left',
  '[e': 'clear',

  '[2$': 'insert',
  '[3$': 'delete',
  '[5$': 'pageup',
  '[6$': 'pagedown',
  '[7$': 'home',
  '[8$': 'end',

  Oa: 'up',
  Ob: 'down',
  Oc: 'right',
  Od: 'left',
  Oe: 'clear',

  '[2^': 'insert',
  '[3^': 'delete',
  '[5^': 'pageup',
  '[6^': 'pagedown',
  '[7^': 'home',
  '[8^': 'end',
  /* misc. */
  '[Z': 'tab',
}

// nonAlphanumericKeys 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const nonAlphanumericKeys = [
  // Filter out single-character values (digits, operators from numpad) since
  // those are printable characters that should produce input
  // 链式调用 链式方法，继续加工上一行在终端渲染中产生的数据。
  ...Object.values(keyName).filter(v => v.length > 1),
  // escape and backspace are assigned directly in parseKeypress (not via the
  // keyName map), so the spread above misses them. Without these, ctrl+escape
  // via Kitty/modifyOtherKeys leaks the literal word "escape" as input text
  // (input-event.ts:58 assigns keypress.name when ctrl is set).
  'escape',
  'backspace',
  'wheelup',
  'wheeldown',
  'mouse',
]

// isShiftKey封装成回调，供Ink 渲染层 parse keypress在事件触发或异步步骤中调用。
const isShiftKey = (code: string): boolean => {
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [
    '[a',
    '[b',
    '[c',
    '[d',
    '[e',
    '[2$',
    '[3$',
    '[5$',
    '[6$',
    '[7$',
    '[8$',
    '[Z',
  ].includes(code)
}

// isCtrlKey封装成回调，供Ink 渲染层 parse keypress在事件触发或异步步骤中调用。
const isCtrlKey = (code: string): boolean => {
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [
    'Oa',
    'Ob',
    'Oc',
    'Od',
    'Oe',
    '[2^',
    '[3^',
    '[5^',
    '[6^',
    '[7^',
    '[8^',
  ].includes(code)
}

/**
 * Decode XTerm-style modifier value to individual flags.
 * Modifier encoding: 1 + (shift ? 1 : 0) + (alt ? 2 : 0) + (ctrl ? 4 : 0) + (super ? 8 : 0)
 *
 * Note: `meta` here means Alt/Option (bit 2). `super` is a distinct
 * modifier (bit 8, i.e. Cmd on macOS / Win key). Most legacy terminal
 * sequences can't express super — it only arrives via kitty keyboard
 * protocol (CSI u) or xterm modifyOtherKeys.
 */
// decodeModifier 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function decodeModifier(modifier: number): {
  shift: boolean
  meta: boolean
  ctrl: boolean
  super: boolean
} {
  // m 命名 `modifier - 1`，让后续代码直接表达这个值的用途。
  const m = modifier - 1
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    shift: !!(m & 1),
    meta: !!(m & 2),
    ctrl: !!(m & 4),
    super: !!(m & 8),
  }
}

/**
 * Map keycode to key name for modifyOtherKeys/CSI u sequences.
 * Handles both ASCII keycodes and Kitty keyboard protocol functional keys.
 *
 * Numpad codepoints are from Unicode Private Use Area, defined at:
 * https://sw.kovidgoyal.net/kitty/keyboard-protocol/#functional-key-definitions
 */
// keycodeToName 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function keycodeToName(keycode: number): string | undefined {
  // 按照 keycode 的取值选择终端渲染的具体处理分支。
  switch (keycode) {
    case 9:
      // 返回 `'tab'`，作为终端渲染这次计算的结果。
      return 'tab'
    case 13:
      // 返回 `'return'`，作为终端渲染这次计算的结果。
      return 'return'
    case 27:
      // 返回 `'escape'`，作为终端渲染这次计算的结果。
      return 'escape'
    case 32:
      // 返回 `'space'`，作为终端渲染这次计算的结果。
      return 'space'
    case 127:
      // 返回 `'backspace'`，作为终端渲染这次计算的结果。
      return 'backspace'
    // Kitty keyboard protocol numpad keys (KP_0 through KP_9)
    case 57399:
      // 返回 `'0'`，作为终端渲染这次计算的结果。
      return '0'
    case 57400:
      // 返回 `'1'`，作为终端渲染这次计算的结果。
      return '1'
    case 57401:
      // 返回 `'2'`，作为终端渲染这次计算的结果。
      return '2'
    case 57402:
      // 返回 `'3'`，作为终端渲染这次计算的结果。
      return '3'
    case 57403:
      // 返回 `'4'`，作为终端渲染这次计算的结果。
      return '4'
    case 57404:
      // 返回 `'5'`，作为终端渲染这次计算的结果。
      return '5'
    case 57405:
      // 返回 `'6'`，作为终端渲染这次计算的结果。
      return '6'
    case 57406:
      // 返回 `'7'`，作为终端渲染这次计算的结果。
      return '7'
    case 57407:
      // 返回 `'8'`，作为终端渲染这次计算的结果。
      return '8'
    case 57408:
      // 返回 `'9'`，作为终端渲染这次计算的结果。
      return '9'
    case 57409: // KP_DECIMAL
      // 返回 `'.'`，作为终端渲染这次计算的结果。
      return '.'
    case 57410: // KP_DIVIDE
      // 返回 `'/'`，作为终端渲染这次计算的结果。
      return '/'
    case 57411: // KP_MULTIPLY
      // 返回 `'*'`，作为终端渲染这次计算的结果。
      return '*'
    case 57412: // KP_SUBTRACT
      // 返回 `'-'`，作为终端渲染这次计算的结果。
      return '-'
    case 57413: // KP_ADD
      // 返回 `'+'`，作为终端渲染这次计算的结果。
      return '+'
    case 57414: // KP_ENTER
      // 返回 `'return'`，作为终端渲染这次计算的结果。
      return 'return'
    case 57415: // KP_EQUAL
      // 返回 `'='`，作为终端渲染这次计算的结果。
      return '='
    default:
      // Printable ASCII characters
      // 只有 `keycode >= 32 && keycode <= 126` 满足时，终端渲染才执行该分支。
      if (keycode >= 32 && keycode <= 126) {
        // 返回 `String.fromCharCode(keycode).toLowerCase()`，作为终端渲染这次计算的结果。
        return String.fromCharCode(keycode).toLowerCase()
      }
      // 返回 `undefined`，作为终端渲染这次计算的结果。
      return undefined
  }
}

// ParsedKey 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedKey = {
  kind: 'key'
  fn: boolean
  name: string | undefined
  ctrl: boolean
  meta: boolean
  shift: boolean
  option: boolean
  super: boolean
  sequence: string | undefined
  raw: string | undefined
  code?: string
  isPasted: boolean
}

/** A terminal response sequence (DECRPM, DA1, OSC reply, etc.) parsed
 *  out of the input stream. Not user input — consumers should dispatch
 *  to a response handler. */
// ParsedResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedResponse = {
  kind: 'response'
  /** Raw escape sequence bytes, for debugging/logging */
  sequence: string
  response: TerminalResponse
}

/** SGR mouse event with coordinates. Emitted for clicks, drags, and
 *  releases (wheel events remain ParsedKey). col/row are 1-indexed
 *  from the terminal sequence (CSI < btn;col;row M/m). */
// ParsedMouse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedMouse = {
  kind: 'mouse'
  /** Raw SGR button code. Low 2 bits = button (0=left,1=mid,2=right),
   *  bit 5 (0x20) = drag/motion, bit 6 (0x40) = wheel. */
  button: number
  /** 'press' for M terminator, 'release' for m terminator */
  action: 'press' | 'release'
  /** 1-indexed column (from terminal) */
  col: number
  /** 1-indexed row (from terminal) */
  row: number
  sequence: string
}

/** Everything that can come out of the input parser: a user keypress/paste,
 *  a mouse click/drag event, or a terminal response to a query we sent. */
// ParsedInput 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedInput = ParsedKey | ParsedMouse | ParsedResponse

/**
 * Parse an SGR mouse event sequence into a ParsedMouse, or null if not a
 * mouse event or if it's a wheel event (wheel stays as ParsedKey for the
 * keybinding system). Button bit 0x40 = wheel, bit 0x20 = drag/motion.
 */
// parseMouseEvent 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseMouseEvent(s: string): ParsedMouse | null {
  // match保存`SGR_MOUSE_RE.exec`，供终端渲染后续处理使用。
  const match = SGR_MOUSE_RE.exec(s)
  // match缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!match) return null
  // button解析`parseInt`，供终端渲染后续处理使用。
  const button = parseInt(match[1]!, 10)
  // Wheel events (bit 6 set, low bits 0/1 for up/down) stay as ParsedKey
  // so the keybinding system can route them to scroll handlers.
  // `(button & 0x40)` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if ((button & 0x40) !== 0) return null
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    kind: 'mouse',
    button,
    action: match[4] === 'M' ? 'press' : 'release',
    col: parseInt(match[2]!, 10),
    row: parseInt(match[3]!, 10),
    sequence: s,
  }
}

// parseKeypress 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseKeypress(s: string = ''): ParsedKey {
  // parts 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let parts

  // key 集中保存Ink 渲染层 parse keypress要一起传递的字段。
  const key: ParsedKey = {
    kind: 'key',
    name: '',
    fn: false,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    super: false,
    sequence: s,
    raw: s,
    isPasted: false,
  }

  // sequence更新为 `key.sequence || s || key.name`，确保Ink 渲染层后续读取最新状态。
  key.sequence = key.sequence || s || key.name

  // Handle CSI u (kitty keyboard protocol): ESC [ codepoint [; modifier] u
  // Example: ESC[13;2u = Shift+Enter, ESC[27u = Escape (no modifiers)
  // match 先占位，稍后的条件分支会根据实际输入补齐它。
  let match: RegExpExecArray | null
  // 满足 `(match = CSI_U_RE.exec(s))` 时，终端渲染执行该分支。
  if ((match = CSI_U_RE.exec(s))) {
    // codepoint解析`parseInt`，供终端渲染后续处理使用。
    const codepoint = parseInt(match[1]!, 10)
    // Modifier defaults to 1 (no modifiers) when not present
    // modifier解析`parseInt`，供终端渲染后续处理使用。
    const modifier = match[2] ? parseInt(match[2], 10) : 1
    // mods 集合保存`decodeModifier`，供终端渲染后续处理使用。
    const mods = decodeModifier(modifier)
    // 名称保存`keycodeToName`，供终端渲染后续处理使用。
    const name = keycodeToName(codepoint)
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      kind: 'key',
      name,
      fn: false,
      ctrl: mods.ctrl,
      meta: mods.meta,
      shift: mods.shift,
      option: false,
      super: mods.super,
      sequence: s,
      raw: s,
      isPasted: false,
    }
  }

  // Handle xterm modifyOtherKeys: ESC [ 27 ; modifier ; keycode ~
  // Must run before FN_KEY_RE — FN_KEY_RE only allows 2 params before ~ and
  // would leave the tail as garbage if it partially matched.
  // 满足 `(match = MODIFY_OTHER_KEYS_RE.exec(s))` 时，终端渲染执行该分支。
  if ((match = MODIFY_OTHER_KEYS_RE.exec(s))) {
    // mods 集合保存`decodeModifier`，供终端渲染后续处理使用。
    const mods = decodeModifier(parseInt(match[1]!, 10))
    // 名称保存`keycodeToName`，供终端渲染后续处理使用。
    const name = keycodeToName(parseInt(match[2]!, 10))
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      kind: 'key',
      name,
      fn: false,
      ctrl: mods.ctrl,
      meta: mods.meta,
      shift: mods.shift,
      option: false,
      super: mods.super,
      sequence: s,
      raw: s,
      isPasted: false,
    }
  }

  // SGR mouse wheel events. Click/drag/release events are handled
  // earlier by parseMouseEvent and emitted as ParsedMouse, so they
  // never reach here. Mask with 0x43 (bits 6+1+0) to check wheel-flag
  // + direction while ignoring modifier bits (Shift=0x04, Meta=0x08,
  // Ctrl=0x10) — modified wheel events (e.g. Ctrl+scroll, button=80)
  // should still be recognized as wheelup/wheeldown.
  // 满足 `(match = SGR_MOUSE_RE.exec(s))` 时，终端渲染执行该分支。
  if ((match = SGR_MOUSE_RE.exec(s))) {
    // button解析`parseInt`，供终端渲染后续处理使用。
    const button = parseInt(match[1]!, 10)
    // 满足 `(button & 0x43) === 0x40) return createNavKey(s, 'wheelup', false` 时，终端渲染执行该分支。
    if ((button & 0x43) === 0x40) return createNavKey(s, 'wheelup', false)
    // 满足 `(button & 0x43) === 0x41) return createNavKey(s, 'wheeldown', false` 时，终端渲染执行该分支。
    if ((button & 0x43) === 0x41) return createNavKey(s, 'wheeldown', false)
    // Shouldn't reach here (parseMouseEvent catches non-wheel) but be safe
    // 返回 `createNavKey(s, 'mouse', false)`，作为终端渲染这次计算的结果。
    return createNavKey(s, 'mouse', false)
  }

  // X10 mouse: CSI M + 3 raw bytes (Cb+32, Cx+32, Cy+32). Terminals that
  // ignore DECSET 1006 (SGR) but honor 1000/1002 emit this legacy encoding.
  // Button bits match SGR: 0x40 = wheel, low bit = direction. Non-wheel
  // X10 events (clicks/drags) are swallowed here — we only enable mouse
  // tracking in alt-screen and only need wheel for ScrollBox.
  // 只有 `s.length === 6 && s.startsWith('\x1b[M')` 满足时，终端渲染才执行该分支。
  if (s.length === 6 && s.startsWith('\x1b[M')) {
    // button保存`s.charCodeAt`，供终端渲染后续处理使用。
    const button = s.charCodeAt(3) - 32
    // 满足 `(button & 0x43) === 0x40) return createNavKey(s, 'wheelup', false` 时，终端渲染执行该分支。
    if ((button & 0x43) === 0x40) return createNavKey(s, 'wheelup', false)
    // 满足 `(button & 0x43) === 0x41) return createNavKey(s, 'wheeldown', false` 时，终端渲染执行该分支。
    if ((button & 0x43) === 0x41) return createNavKey(s, 'wheeldown', false)
    // 返回 `createNavKey(s, 'mouse', false)`，作为终端渲染这次计算的结果。
    return createNavKey(s, 'mouse', false)
  }

  // 当 `s` 匹配 `'\r'` 时，终端渲染执行对应分支。
  if (s === '\r') {
    // 原始文本更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
    key.raw = undefined
    // 名称更新为 `'return'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'return'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\n') {`，完成这一小步状态转换。
  } else if (s === '\n') {
    // 名称更新为 `'enter'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'enter'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\t') {`，完成这一小步状态转换。
  } else if (s === '\t') {
    // 名称更新为 `'tab'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'tab'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\b' || s === '\x1b\b') {`，完成这一小步状态转换。
  } else if (s === '\b' || s === '\x1b\b') {
    // 名称更新为 `'backspace'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'backspace'
    // meta更新为 `s.charAt(0) === '\x1b'`，确保Ink 渲染层后续读取最新状态。
    key.meta = s.charAt(0) === '\x1b'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\x7f' || s === '\x1b\x7f') {`，完成这一小步状态转换。
  } else if (s === '\x7f' || s === '\x1b\x7f') {
    // 名称更新为 `'backspace'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'backspace'
    // meta更新为 `s.charAt(0) === '\x1b'`，确保Ink 渲染层后续读取最新状态。
    key.meta = s.charAt(0) === '\x1b'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\x1b' || s === '\x1b\x1b') {`，完成这一小步状态转换。
  } else if (s === '\x1b' || s === '\x1b\x1b') {
    // 名称更新为 `'escape'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'escape'
    // meta更新为 `s.length === 2`，确保Ink 渲染层后续读取最新状态。
    key.meta = s.length === 2
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === ' ' || s === '\x1b ') {`，完成这一小步状态转换。
  } else if (s === ' ' || s === '\x1b ') {
    // 名称更新为 `'space'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'space'
    // meta更新为 `s.length === 2`，确保Ink 渲染层后续读取最新状态。
    key.meta = s.length === 2
  // Ink 渲染层 parse keypress在这里处理 `} else if (s === '\x1f') {`，完成这一小步状态转换。
  } else if (s === '\x1f') {
    // 名称更新为 `'_'`，确保Ink 渲染层后续读取最新状态。
    key.name = '_'
    // ctrl更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.ctrl = true
  // Ink 渲染层 parse keypress在这里处理 `} else if (s <= '\x1a' && s.length === 1) {`，完成这一小步状态转换。
  } else if (s <= '\x1a' && s.length === 1) {
    // 名称更新为 `String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) -...`，确保Ink 渲染层后续读取最新状态。
    key.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1)
    // ctrl更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.ctrl = true
  // Ink 渲染层 parse keypress在这里处理 `} else if (s.length === 1 && s >= '0' && s <= '9') {`，完成这一小步状态转换。
  } else if (s.length === 1 && s >= '0' && s <= '9') {
    // 名称更新为 `'number'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'number'
  // Ink 渲染层 parse keypress在这里处理 `} else if (s.length === 1 && s >= 'a' && s <= 'z') {`，完成这一小步状态转换。
  } else if (s.length === 1 && s >= 'a' && s <= 'z') {
    // 名称更新为 `s`，确保Ink 渲染层后续读取最新状态。
    key.name = s
  // Ink 渲染层 parse keypress在这里处理 `} else if (s.length === 1 && s >= 'A' && s <= 'Z') {`，完成这一小步状态转换。
  } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
    // 名称更新为 `s.toLowerCase()`，确保Ink 渲染层后续读取最新状态。
    key.name = s.toLowerCase()
    // shift更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.shift = true
  // Ink 渲染层 parse keypress在这里处理 `} else if ((parts = META_KEY_CODE_RE.exec(s))) {`，完成这一小步状态转换。
  } else if ((parts = META_KEY_CODE_RE.exec(s))) {
    // meta更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.meta = true
    // shift更新为 `/^[A-Z]$/.test(parts[1]!)`，确保Ink 渲染层后续读取最新状态。
    key.shift = /^[A-Z]$/.test(parts[1]!)
  // Ink 渲染层 parse keypress在这里处理 `} else if ((parts = FN_KEY_RE.exec(s))) {`，完成这一小步状态转换。
  } else if ((parts = FN_KEY_RE.exec(s))) {
    // segs 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const segs = [...s]

    // 当 `segs[0]` 匹配 `'\u001b' && segs[1] === '\u...` 时，终端渲染执行对应分支。
    if (segs[0] === '\u001b' && segs[1] === '\u001b') {
      // option更新为 `true`，确保Ink 渲染层后续读取最新状态。
      key.option = true
    }

    // code 聚合成有序列表，保持后续遍历顺序稳定。
    const code = [parts[1], parts[2], parts[4], parts[6]]
      .filter(Boolean)
      .join('')

    // modifier标记Ink 渲染层 parse keypress是否启用对应路径。
    const modifier = ((parts[3] || parts[5] || 1) as number) - 1

    // ctrl更新为 `!!(modifier & 4)`，确保Ink 渲染层后续读取最新状态。
    key.ctrl = !!(modifier & 4)
    // meta更新为 `!!(modifier & 2)`，确保Ink 渲染层后续读取最新状态。
    key.meta = !!(modifier & 2)
    // super更新为 `!!(modifier & 8)`，确保Ink 渲染层后续读取最新状态。
    key.super = !!(modifier & 8)
    // shift更新为 `!!(modifier & 1)`，确保Ink 渲染层后续读取最新状态。
    key.shift = !!(modifier & 1)
    // code更新为 `code`，确保Ink 渲染层后续读取最新状态。
    key.code = code

    // 名称更新为 `keyName[code]`，确保Ink 渲染层后续读取最新状态。
    key.name = keyName[code]
    // shift更新为 `isShiftKey(code) || key.shift`，确保Ink 渲染层后续读取最新状态。
    key.shift = isShiftKey(code) || key.shift
    // ctrl更新为 `isCtrlKey(code) || key.ctrl`，确保Ink 渲染层后续读取最新状态。
    key.ctrl = isCtrlKey(code) || key.ctrl
  }

  // iTerm in natural text editing mode
  // 当 `key.raw` 匹配 `'\x1Bb'` 时，终端渲染执行对应分支。
  if (key.raw === '\x1Bb') {
    // meta更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.meta = true
    // 名称更新为 `'left'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'left'
  // Ink 渲染层 parse keypress在这里处理 `} else if (key.raw === '\x1Bf') {`，完成这一小步状态转换。
  } else if (key.raw === '\x1Bf') {
    // meta更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.meta = true
    // 名称更新为 `'right'`，确保Ink 渲染层后续读取最新状态。
    key.name = 'right'
  }

  // 按照 s 的取值选择终端渲染的具体处理分支。
  switch (s) {
    case '\u001b[1~':
      // 返回 `createNavKey(s, 'home', false)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'home', false)
    case '\u001b[4~':
      // 返回 `createNavKey(s, 'end', false)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'end', false)
    case '\u001b[5~':
      // 返回 `createNavKey(s, 'pageup', false)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'pageup', false)
    case '\u001b[6~':
      // 返回 `createNavKey(s, 'pagedown', false)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'pagedown', false)
    case '\u001b[1;5D':
      // 返回 `createNavKey(s, 'left', true)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'left', true)
    case '\u001b[1;5C':
      // 返回 `createNavKey(s, 'right', true)`，作为终端渲染这次计算的结果。
      return createNavKey(s, 'right', true)
  }

  // 返回 `key`，作为终端渲染这次计算的结果。
  return key
}

// createNavKey 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createNavKey(s: string, name: string, ctrl: boolean): ParsedKey {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    kind: 'key',
    name,
    ctrl,
    meta: false,
    shift: false,
    option: false,
    super: false,
    fn: false,
    sequence: s,
    raw: s,
    isPasted: false,
  }
}
