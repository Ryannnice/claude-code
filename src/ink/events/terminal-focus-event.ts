// 引入 Event，将 ./event.js 中已经封装好的能力接到本文件流程里。
import { Event } from './event.js'

// TerminalFocusEventType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalFocusEventType = 'terminalfocus' | 'terminalblur'

/**
 * Event fired when the terminal window gains or loses focus.
 *
 * Uses DECSET 1004 focus reporting - the terminal sends:
 * - CSI I (\x1b[I) when the terminal gains focus
 * - CSI O (\x1b[O) when the terminal loses focus
 */
// TerminalFocusEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class TerminalFocusEvent extends Event {
  readonly type: TerminalFocusEventType

  // 构造函数接收 type: TerminalFocusEventType，把外部输入整理成实例可复用的内部状态。
  constructor(type: TerminalFocusEventType) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super()
    // 更新实例字段 type 为 type，同步终端渲染的内部状态。
    this.type = type
  }
}
