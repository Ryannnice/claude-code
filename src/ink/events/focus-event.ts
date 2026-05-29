// 引入 EventTarget、TerminalEvent，将 ./terminal-event.js 中已经封装好的能力接到本文件流程里。
import { type EventTarget, TerminalEvent } from './terminal-event.js'

/**
 * Focus event for component focus changes.
 *
 * Dispatched when focus moves between elements. 'focus' fires on the
 * newly focused element, 'blur' fires on the previously focused one.
 * Both bubble, matching react-dom's use of focusin/focusout semantics
 * so parent components can observe descendant focus changes.
 */
// FocusEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class FocusEvent extends TerminalEvent {
  readonly relatedTarget: EventTarget | null

  constructor(
    type: 'focus' | 'blur',
    relatedTarget: EventTarget | null = null,
  ) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super(type, { bubbles: true, cancelable: false })
    // 更新实例字段 relatedTarget 为 relatedTarget，同步终端渲染的内部状态。
    this.relatedTarget = relatedTarget
  }
}
