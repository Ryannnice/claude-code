// 引入 Event，将 ./event.js 中已经封装好的能力接到本文件流程里。
import { Event } from './event.js'

// EventPhase 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type EventPhase = 'none' | 'capturing' | 'at_target' | 'bubbling'

// TerminalEventInit 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TerminalEventInit = {
  bubbles?: boolean
  cancelable?: boolean
}

/**
 * Base class for all terminal events with DOM-style propagation.
 *
 * Extends Event so existing event types (ClickEvent, InputEvent,
 * TerminalFocusEvent) share a common ancestor and can migrate later.
 *
 * Mirrors the browser's Event API: target, currentTarget, eventPhase,
 * stopPropagation(), preventDefault(), timeStamp.
 */
// TerminalEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class TerminalEvent extends Event {
  readonly type: string
  readonly timeStamp: number
  readonly bubbles: boolean
  readonly cancelable: boolean

  private _target: EventTarget | null = null
  private _currentTarget: EventTarget | null = null
  private _eventPhase: EventPhase = 'none'
  private _propagationStopped = false
  private _defaultPrevented = false

  // 构造函数接收 type: string, init?: TerminalEventInit，把外部输入整理成实例可复用的内部状态。
  constructor(type: string, init?: TerminalEventInit) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super()
    // 更新实例字段 type 为 type，同步终端渲染的内部状态。
    this.type = type
    // 更新实例字段 timeStamp 为 performance.now()，同步终端渲染的内部状态。
    this.timeStamp = performance.now()
    // 更新实例字段 bubbles 为 init?.bubbles ?? true，同步终端渲染的内部状态。
    this.bubbles = init?.bubbles ?? true
    // 更新实例字段 cancelable 为 init?.cancelable ?? true，同步终端渲染的内部状态。
    this.cancelable = init?.cancelable ?? true
  }

  // Ink 渲染层 terminal event在这里处理 `get target(): EventTarget | null {`，完成这一小步状态转换。
  get target(): EventTarget | null {
    // 返回 `this._target`，作为终端渲染这次计算的结果。
    return this._target
  }

  // Ink 渲染层 terminal event在这里处理 `get currentTarget(): EventTarget | null {`，完成这一小步状态转换。
  get currentTarget(): EventTarget | null {
    // 返回 `this._currentTarget`，作为终端渲染这次计算的结果。
    return this._currentTarget
  }

  // Ink 渲染层 terminal event在这里处理 `get eventPhase(): EventPhase {`，完成这一小步状态转换。
  get eventPhase(): EventPhase {
    // 返回 `this._eventPhase`，作为终端渲染这次计算的结果。
    return this._eventPhase
  }

  // Ink 渲染层 terminal event在这里处理 `get defaultPrevented(): boolean {`，完成这一小步状态转换。
  get defaultPrevented(): boolean {
    // 返回 `this._defaultPrevented`，作为终端渲染这次计算的结果。
    return this._defaultPrevented
  }

  // stopPropagation 使用 无 完成终端渲染里的对应操作。
  stopPropagation(): void {
    // 更新实例字段 _propagationStopped 为 true，同步终端渲染的内部状态。
    this._propagationStopped = true
  }

  // Ink 渲染层 terminal event在这里处理 `override stopImmediatePropagation(): void {`，完成这一小步状态转换。
  override stopImmediatePropagation(): void {
    // 调用 super.stopImmediatePropagation，触发终端渲染此处需要的副作用。
    super.stopImmediatePropagation()
    // 更新实例字段 _propagationStopped 为 true，同步终端渲染的内部状态。
    this._propagationStopped = true
  }

  // preventDefault 使用 无 完成终端渲染里的对应操作。
  preventDefault(): void {
    // 满足 `this.cancelable` 时，终端渲染执行该分支。
    if (this.cancelable) {
      // 更新实例字段 _defaultPrevented 为 true，同步终端渲染的内部状态。
      this._defaultPrevented = true
    }
  }

  // -- Internal setters used by the Dispatcher

  /** @internal */
  // _setTarget 使用 target: EventTarget 完成终端渲染里的对应操作。
  _setTarget(target: EventTarget): void {
    // 更新实例字段 _target 为 target，同步终端渲染的内部状态。
    this._target = target
  }

  /** @internal */
  // _setCurrentTarget 使用 target: EventTarget | null 完成终端渲染里的对应操作。
  _setCurrentTarget(target: EventTarget | null): void {
    // 更新实例字段 _currentTarget 为 target，同步终端渲染的内部状态。
    this._currentTarget = target
  }

  /** @internal */
  // _setEventPhase 使用 phase: EventPhase 完成终端渲染里的对应操作。
  _setEventPhase(phase: EventPhase): void {
    // 更新实例字段 _eventPhase 为 phase，同步终端渲染的内部状态。
    this._eventPhase = phase
  }

  /** @internal */
  // _isPropagationStopped 使用 无 完成终端渲染里的对应操作。
  _isPropagationStopped(): boolean {
    // 返回 `this._propagationStopped`，作为终端渲染这次计算的结果。
    return this._propagationStopped
  }

  /** @internal */
  // _isImmediatePropagationStopped 使用 无 完成终端渲染里的对应操作。
  _isImmediatePropagationStopped(): boolean {
    // 返回 `this.didStopImmediatePropagation()`，作为终端渲染这次计算的结果。
    return this.didStopImmediatePropagation()
  }

  /**
   * Hook for subclasses to do per-node setup before each handler fires.
   * Default is a no-op.
   */
  // _prepareForTarget 使用 _target: EventTarget 完成终端渲染里的对应操作。
  _prepareForTarget(_target: EventTarget): void {}
}

// EventTarget 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type EventTarget = {
  parentNode: EventTarget | undefined
  _eventHandlers?: Record<string, unknown>
}
