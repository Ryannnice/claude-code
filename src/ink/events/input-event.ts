// 引入 nonAlphanumericKeys、ParsedKey，将 ../parse-keypress.js 中已经封装好的能力接到本文件流程里。
import { nonAlphanumericKeys, type ParsedKey } from '../parse-keypress.js'
// 引入 Event，将 ./event.js 中已经封装好的能力接到本文件流程里。
import { Event } from './event.js'

// Key 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Key = {
  upArrow: boolean
  downArrow: boolean
  leftArrow: boolean
  rightArrow: boolean
  pageDown: boolean
  pageUp: boolean
  wheelUp: boolean
  wheelDown: boolean
  home: boolean
  end: boolean
  return: boolean
  escape: boolean
  ctrl: boolean
  shift: boolean
  fn: boolean
  tab: boolean
  backspace: boolean
  delete: boolean
  meta: boolean
  super: boolean
}

// parseKey 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseKey(keypress: ParsedKey): [Key, string] {
  // key 集中保存Ink 渲染层 input event要一起传递的字段。
  const key: Key = {
    upArrow: keypress.name === 'up',
    downArrow: keypress.name === 'down',
    leftArrow: keypress.name === 'left',
    rightArrow: keypress.name === 'right',
    pageDown: keypress.name === 'pagedown',
    pageUp: keypress.name === 'pageup',
    wheelUp: keypress.name === 'wheelup',
    wheelDown: keypress.name === 'wheeldown',
    home: keypress.name === 'home',
    end: keypress.name === 'end',
    return: keypress.name === 'return',
    escape: keypress.name === 'escape',
    fn: keypress.fn,
    ctrl: keypress.ctrl,
    shift: keypress.shift,
    tab: keypress.name === 'tab',
    backspace: keypress.name === 'backspace',
    delete: keypress.name === 'delete',
    // `parseKeypress` parses \u001B\u001B[A (meta + up arrow) as meta = false
    // but with option = true, so we need to take this into account here
    // to avoid breaking changes in Ink.
    // TODO(vadimdemedes): consider removing this in the next major version.
    meta: keypress.meta || keypress.name === 'escape' || keypress.option,
    // Super (Cmd on macOS / Win key) — only arrives via kitty keyboard
    // protocol CSI u sequences. Distinct from meta (Alt/Option) so
    // bindings like cmd+c can be expressed separately from opt+c.
    super: keypress.super,
  }

  // 用户输入 命名 `keypress.ctrl ? keypress.name : keypress.sequence`，让后续代码直接表达这个值的用途。
  let input = keypress.ctrl ? keypress.name : keypress.sequence

  // Handle undefined input case
  // 满足 `input === undefined` 时，终端渲染执行该分支。
  if (input === undefined) {
    // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
    input = ''
  }

  // When ctrl is set, keypress.name for space is the literal word "space".
  // Convert to actual space character for consistency with the CSI u branch
  // (which maps 'space' → ' '). Without this, ctrl+space leaks the literal
  // word "space" into text input.
  // 当 `keypress.ctrl && input` 匹配 `'space'` 时，终端渲染执行对应分支。
  if (keypress.ctrl && input === 'space') {
    // 用户输入更新为 `' '`，确保Ink 渲染层后续读取最新状态。
    input = ' '
  }

  // Suppress unrecognized escape sequences that were parsed as function keys
  // (matched by FN_KEY_RE) but have no name in the keyName map.
  // Examples: ESC[25~ (F13/Right Alt on Windows), ESC[26~ (F14), etc.
  // Without this, the ESC prefix is stripped below and the remainder (e.g.,
  // "[25~") leaks into the input as literal text.
  // 只有 `keypress.code && !keypress.name` 满足时，终端渲染才执行该分支。
  if (keypress.code && !keypress.name) {
    // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
    input = ''
  }

  // Suppress ESC-less SGR mouse fragments. When a heavy React commit blocks
  // the event loop past App's 50ms NORMAL_TIMEOUT flush, a CSI split across
  // stdin chunks gets its buffered ESC flushed as a lone Escape key, and the
  // continuation arrives as a text token with name='' — which falls through
  // all of parseKeypress's ESC-anchored regexes and the nonAlphanumericKeys
  // clear below (name is falsy). The fragment then leaks into the prompt as
  // literal `[<64;74;16M`. This is the same defensive sink as the F13 guard
  // above; the underlying tokenizer-flush race is upstream of this layer.
  // 只有 `!keypress.name && /^\[<\d+;\d+;\d+[Mm]/.test(input)` 满足时，终端渲染才执行该分支。
  if (!keypress.name && /^\[<\d+;\d+;\d+[Mm]/.test(input)) {
    // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
    input = ''
  }

  // Strip meta if it's still remaining after `parseKeypress`
  // TODO(vadimdemedes): remove this in the next major version.
  // 满足 `input.startsWith('\u001B')` 时，终端渲染执行该分支。
  if (input.startsWith('\u001B')) {
    // 用户输入更新为 `input.slice(1)`，确保Ink 渲染层后续读取最新状态。
    input = input.slice(1)
  }

  // Track whether we've already processed this as a special sequence
  // that converted input to the key name (CSI u or application keypad mode).
  // For these, we don't want to clear input with nonAlphanumericKeys check.
  // processedAsSpecialSequence标记Ink 渲染层 input event是否启用对应路径。
  let processedAsSpecialSequence = false

  // Handle CSI u sequences (Kitty keyboard protocol): after stripping ESC,
  // we're left with "[codepoint;modifieru" (e.g., "[98;3u" for Alt+b).
  // Use the parsed key name instead for input handling. Require a digit
  // after [ — real CSI u is always [<digits>…u, and a bare startsWith('[')
  // false-matches X10 mouse at row 85 (Cy = 85+32 = 'u'), leaking the
  // literal text "mouse" into the prompt via processedAsSpecialSequence.
  // 只有 `/^\[\d/.test(input) && input.endsWith('u')` 满足时，终端渲染才执行该分支。
  if (/^\[\d/.test(input) && input.endsWith('u')) {
    // keypress.name缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!keypress.name) {
      // Unmapped Kitty functional key (Caps Lock 57358, F13–F35, KP nav,
      // bare modifiers, etc.) — keycodeToName() returned undefined. Swallow
      // so the raw "[57358u" doesn't leak into the prompt. See #38781.
      // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
      input = ''
    } else {
      // 'space' → ' '; 'escape' → '' (key.escape carries it;
      // processedAsSpecialSequence bypasses the nonAlphanumericKeys
      // clear below, so we must handle it explicitly here);
      // otherwise use key name.
      // Ink 渲染层 input event在这里处理 `input =`，完成这一小步状态转换。
      input =
        keypress.name === 'space'
          ? ' '
          : keypress.name === 'escape'
            ? ''
            : keypress.name
    }
    // processedAsSpecialSequence更新为 `true`，确保Ink 渲染层后续读取最新状态。
    processedAsSpecialSequence = true
  }

  // Handle xterm modifyOtherKeys sequences: after stripping ESC, we're left
  // with "[27;modifier;keycode~" (e.g., "[27;3;98~" for Alt+b). Same
  // extraction as CSI u — without this, printable-char keycodes (single-letter
  // names) skip the nonAlphanumericKeys clear and leak "[27;..." as input.
  // 只有 `input.startsWith('[27;') && input.endsWith('~')` 满足时，终端渲染才执行该分支。
  if (input.startsWith('[27;') && input.endsWith('~')) {
    // keypress.name缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!keypress.name) {
      // Unmapped modifyOtherKeys keycode — swallow for consistency with
      // the CSI u handler above. Practically untriggerable today (xterm
      // modifyOtherKeys only sends ASCII keycodes, all mapped), but
      // guards against future terminal behavior.
      // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
      input = ''
    } else {
      // Ink 渲染层 input event在这里处理 `input =`，完成这一小步状态转换。
      input =
        keypress.name === 'space'
          ? ' '
          : keypress.name === 'escape'
            ? ''
            : keypress.name
    }
    // processedAsSpecialSequence更新为 `true`，确保Ink 渲染层后续读取最新状态。
    processedAsSpecialSequence = true
  }

  // Handle application keypad mode sequences: after stripping ESC,
  // we're left with "O<letter>" (e.g., "Op" for numpad 0, "Oy" for numpad 9).
  // Use the parsed key name (the digit character) for input handling.
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    input.startsWith('O') &&
    input.length === 2 &&
    keypress.name &&
    keypress.name.length === 1
  ) {
    // 用户输入更新为 `keypress.name`，确保Ink 渲染层后续读取最新状态。
    input = keypress.name
    // processedAsSpecialSequence更新为 `true`，确保Ink 渲染层后续读取最新状态。
    processedAsSpecialSequence = true
  }

  // Clear input for non-alphanumeric keys (arrows, function keys, etc.)
  // Skip this for CSI u and application keypad mode sequences since
  // those were already converted to their proper input characters.
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    !processedAsSpecialSequence &&
    keypress.name &&
    nonAlphanumericKeys.includes(keypress.name)
  ) {
    // 用户输入更新为 `''`，确保Ink 渲染层后续读取最新状态。
    input = ''
  }

  // Set shift=true for uppercase letters (A-Z)
  // Must check it's actually a letter, not just any char unchanged by toUpperCase
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    input.length === 1 &&
    typeof input[0] === 'string' &&
    input[0] >= 'A' &&
    input[0] <= 'Z'
  ) {
    // shift更新为 `true`，确保Ink 渲染层后续读取最新状态。
    key.shift = true
  }

  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [key, input]
}

// InputEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class InputEvent extends Event {
  readonly keypress: ParsedKey
  readonly key: Key
  readonly input: string

  // 构造函数接收 keypress: ParsedKey，把外部输入整理成实例可复用的内部状态。
  constructor(keypress: ParsedKey) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super()
    // 从 `parseKey(keypress)` 按位置拆出 key、input，让Ink 渲染层 input event分别处理这些返回值。
    const [key, input] = parseKey(keypress)

    // 更新实例字段 keypress 为 keypress，同步终端渲染的内部状态。
    this.keypress = keypress
    // 更新实例字段 key 为 key，同步终端渲染的内部状态。
    this.key = key
    // 更新实例字段 input 为 input，同步终端渲染的内部状态。
    this.input = input
  }
}
