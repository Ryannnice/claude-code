// 类型依赖 { ClickEvent } 来自 ./click-event.js，用于校准终端渲染的数据契约。
import type { ClickEvent } from './click-event.js'
// 类型依赖 { FocusEvent } 来自 ./focus-event.js，用于校准终端渲染的数据契约。
import type { FocusEvent } from './focus-event.js'
// 类型依赖 { KeyboardEvent } 来自 ./keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from './keyboard-event.js'
// 类型依赖 { PasteEvent } 来自 ./paste-event.js，用于校准终端渲染的数据契约。
import type { PasteEvent } from './paste-event.js'
// 类型依赖 { ResizeEvent } 来自 ./resize-event.js，用于校准终端渲染的数据契约。
import type { ResizeEvent } from './resize-event.js'

// KeyboardEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type KeyboardEventHandler = (event: KeyboardEvent) => void
// FocusEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FocusEventHandler = (event: FocusEvent) => void
// PasteEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PasteEventHandler = (event: PasteEvent) => void
// ResizeEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ResizeEventHandler = (event: ResizeEvent) => void
// ClickEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ClickEventHandler = (event: ClickEvent) => void
// HoverEventHandler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type HoverEventHandler = () => void

/**
 * Props for event handlers on Box and other host components.
 *
 * Follows the React/DOM naming convention:
 * - onEventName: handler for bubble phase
 * - onEventNameCapture: handler for capture phase
 */
// EventHandlerProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type EventHandlerProps = {
  onKeyDown?: KeyboardEventHandler
  onKeyDownCapture?: KeyboardEventHandler

  onFocus?: FocusEventHandler
  onFocusCapture?: FocusEventHandler
  onBlur?: FocusEventHandler
  onBlurCapture?: FocusEventHandler

  onPaste?: PasteEventHandler
  onPasteCapture?: PasteEventHandler

  onResize?: ResizeEventHandler

  onClick?: ClickEventHandler
  onMouseEnter?: HoverEventHandler
  onMouseLeave?: HoverEventHandler
}

/**
 * Reverse lookup: event type string → handler prop names.
 * Used by the dispatcher for O(1) handler lookup per node.
 */
// HANDLER_FOR_EVENT 先占位，稍后的条件分支会根据实际输入补齐它。
export const HANDLER_FOR_EVENT: Record<
  string,
  { bubble?: keyof EventHandlerProps; capture?: keyof EventHandlerProps }
> = {
  keydown: { bubble: 'onKeyDown', capture: 'onKeyDownCapture' },
  focus: { bubble: 'onFocus', capture: 'onFocusCapture' },
  blur: { bubble: 'onBlur', capture: 'onBlurCapture' },
  paste: { bubble: 'onPaste', capture: 'onPasteCapture' },
  resize: { bubble: 'onResize' },
  click: { bubble: 'onClick' },
}

/**
 * Set of all event handler prop names, for the reconciler to detect
 * event props and store them in _eventHandlers instead of attributes.
 */
// EVENT_HANDLER_PROPS 集合 命名 `new Set<string>([`，让后续代码直接表达这个值的用途。
export const EVENT_HANDLER_PROPS = new Set<string>([
  'onKeyDown',
  'onKeyDownCapture',
  'onFocus',
  'onFocusCapture',
  'onBlur',
  'onBlurCapture',
  'onPaste',
  'onPasteCapture',
  'onResize',
  'onClick',
  'onMouseEnter',
  'onMouseLeave',
])
