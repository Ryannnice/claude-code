// 类型依赖 { ParsedKey } 来自 ../parse-keypress.js，用于校准终端渲染的数据契约。
import type { ParsedKey } from '../parse-keypress.js'
// 引入 TerminalEvent，将 ./terminal-event.js 中已经封装好的能力接到本文件流程里。
import { TerminalEvent } from './terminal-event.js'

/**
 * Keyboard event dispatched through the DOM tree via capture/bubble.
 *
 * Follows browser KeyboardEvent semantics: `key` is the literal character
 * for printable keys ('a', '3', ' ', '/') and a multi-char name for
 * special keys ('down', 'return', 'escape', 'f1'). The idiomatic
 * printable-char check is `e.key.length === 1`.
 */
// KeyboardEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class KeyboardEvent extends TerminalEvent {
  readonly key: string
  readonly ctrl: boolean
  readonly shift: boolean
  readonly meta: boolean
  readonly superKey: boolean
  readonly fn: boolean

  // 构造函数接收 parsedKey: ParsedKey，把外部输入整理成实例可复用的内部状态。
  constructor(parsedKey: ParsedKey) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super('keydown', { bubbles: true, cancelable: true })

    // 更新实例字段 key 为 keyFromParsed(parsedKey)，同步终端渲染的内部状态。
    this.key = keyFromParsed(parsedKey)
    // 更新实例字段 ctrl 为 parsedKey.ctrl，同步终端渲染的内部状态。
    this.ctrl = parsedKey.ctrl
    // 更新实例字段 shift 为 parsedKey.shift，同步终端渲染的内部状态。
    this.shift = parsedKey.shift
    // 更新实例字段 meta 为 parsedKey.meta || parsedKey.option，同步终端渲染的内部状态。
    this.meta = parsedKey.meta || parsedKey.option
    // 更新实例字段 superKey 为 parsedKey.super，同步终端渲染的内部状态。
    this.superKey = parsedKey.super
    // 更新实例字段 fn 为 parsedKey.fn，同步终端渲染的内部状态。
    this.fn = parsedKey.fn
  }
}

// keyFromParsed 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function keyFromParsed(parsed: ParsedKey): string {
  // seq解析`parsed.sequence ?? ''`，供后续判断或组装使用。
  const seq = parsed.sequence ?? ''
  // 名称解析`parsed.name ?? ''`，供后续判断或组装使用。
  const name = parsed.name ?? ''

  // Ctrl combos: sequence is a control byte (\x03 for ctrl+c), name is the
  // letter. Browsers report e.key === 'c' with e.ctrlKey === true.
  // 满足 `parsed.ctrl` 时，终端渲染执行该分支。
  if (parsed.ctrl) return name

  // Single printable char (space through ~, plus anything above ASCII):
  // use the literal char. Browsers report e.key === '3', not 'Digit3'.
  // 满足 `seq.length === 1` 时，终端渲染执行该分支。
  if (seq.length === 1) {
    // code保存`seq.charCodeAt`，供终端渲染后续处理使用。
    const code = seq.charCodeAt(0)
    // `code >= 0x20 && code` 与 `0x7f` 不一致时刷新派生状态，避免使用过期结果。
    if (code >= 0x20 && code !== 0x7f) return seq
  }

  // Special keys (arrows, F-keys, return, tab, escape, etc.): sequence is
  // either an escape sequence (\x1b[B) or a control byte (\r, \t), so use
  // the parsed name. Browsers report e.key === 'ArrowDown'.
  // 返回 `name || seq`，作为终端渲染这次计算的结果。
  return name || seq
}
