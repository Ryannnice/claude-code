// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  NoEventPriority,
} from 'react-reconciler/constants.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 引入 HANDLER_FOR_EVENT，将 ./event-handlers.js 中已经封装好的能力接到本文件流程里。
import { HANDLER_FOR_EVENT } from './event-handlers.js'
// 类型依赖 { EventTarget, TerminalEvent } 来自 ./terminal-event.js，用于校准终端渲染的数据契约。
import type { EventTarget, TerminalEvent } from './terminal-event.js'

// --

// DispatchListener 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DispatchListener = {
  node: EventTarget
  // 这个回调绑定到 handler: (event: TerminalEvent) => void，负责终端渲染在该局部场景下的响应。
  handler: (event: TerminalEvent) => void
  phase: 'capturing' | 'at_target' | 'bubbling'
}

// getHandler 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHandler(
  node: EventTarget,
  eventType: string,
  capture: boolean,
): ((event: TerminalEvent) => void) | undefined {
  // handlers 集合保存`node._eventHandlers`，供Ink 渲染层 dispatcher后续判断或输出使用。
  const handlers = node._eventHandlers
  // handlers 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!handlers) return undefined

  // mapping 命名 `HANDLER_FOR_EVENT[eventType]`，让后续代码直接表达这个值的用途。
  const mapping = HANDLER_FOR_EVENT[eventType]
  // mapping缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!mapping) return undefined

  // propName派生`capture ? mapping.capture : mapping.bubble`，供后续判断或组装使用。
  const propName = capture ? mapping.capture : mapping.bubble
  // propName缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!propName) return undefined

  // 返回 `handlers[propName] as ((event: TerminalEvent) => void) | undefined`，作为终端渲染这次计算的结果。
  return handlers[propName] as ((event: TerminalEvent) => void) | undefined
}

/**
 * Collect all listeners for an event in dispatch order.
 *
 * Uses react-dom's two-phase accumulation pattern:
 * - Walk from target to root
 * - Capture handlers are prepended (unshift) → root-first
 * - Bubble handlers are appended (push) → target-first
 *
 * Result: [root-cap, ..., parent-cap, target-cap, target-bub, parent-bub, ..., root-bub]
 */
// collectListeners 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectListeners(
  target: EventTarget,
  event: TerminalEvent,
): DispatchListener[] {
  // listeners 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const listeners: DispatchListener[] = []

  // node读取`target` 整理出中间结果，供Ink 渲染层 dispatcher后续步骤使用。
  let node: EventTarget | undefined = target
  // while 使用 node 完成终端渲染里的对应操作。
  while (node) {
    // isTarget标记Ink 渲染层 dispatcher是否启用对应路径。
    const isTarget = node === target

    // captureHandler读取`getHandler`，供终端渲染后续处理使用。
    const captureHandler = getHandler(node, event.type, true)
    // bubbleHandler读取`getHandler`，供终端渲染后续处理使用。
    const bubbleHandler = getHandler(node, event.type, false)

    // 满足 `captureHandler` 时，终端渲染执行该分支。
    if (captureHandler) {
      // 调用 listeners.unshift，触发终端渲染此处需要的副作用。
      listeners.unshift({
        node,
        handler: captureHandler,
        phase: isTarget ? 'at_target' : 'capturing',
      })
    }

    // 只有 `bubbleHandler && (event.bubbles || isTarget)` 满足时，终端渲染才执行该分支。
    if (bubbleHandler && (event.bubbles || isTarget)) {
      // listeners 集合追加新条目，保持收集顺序与输入顺序一致。
      listeners.push({
        node,
        handler: bubbleHandler,
        phase: isTarget ? 'at_target' : 'bubbling',
      })
    }

    // node更新为 `node.parentNode`，确保Ink 渲染层后续读取最新状态。
    node = node.parentNode
  }

  // 返回 `listeners`，作为终端渲染这次计算的结果。
  return listeners
}

/**
 * Execute collected listeners with propagation control.
 *
 * Before each handler, calls event._prepareForTarget(node) so event
 * subclasses can do per-node setup.
 */
// processDispatchQueue 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processDispatchQueue(
  listeners: DispatchListener[],
  event: TerminalEvent,
): void {
  // previousNode 先占位，稍后的条件分支会根据实际输入补齐它。
  let previousNode: EventTarget | undefined

  // 循环处理 `const { node, handler, phase } of listeners`，让终端渲染逐项把同类条目按顺序走完。
  for (const { node, handler, phase } of listeners) {
    // 满足 `event._isImmediatePropagationStopped()` 时，终端渲染执行该分支。
    if (event._isImmediatePropagationStopped()) {
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break
    }

    // `event._isPropagationStopped() && node` 与 `previousNode` 不一致时刷新派生状态，避免使用过期结果。
    if (event._isPropagationStopped() && node !== previousNode) {
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break
    }

    // 调用 event._setEventPhase，触发终端渲染此处需要的副作用。
    event._setEventPhase(phase)
    // 调用 event._setCurrentTarget，触发终端渲染此处需要的副作用。
    event._setCurrentTarget(node)
    // 调用 event._prepareForTarget，触发终端渲染此处需要的副作用。
    event._prepareForTarget(node)

    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 调用 handler，触发终端渲染此处需要的副作用。
      handler(event)
    } catch (error) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }

    // previousNode更新为 `node`，确保Ink 渲染层后续读取最新状态。
    previousNode = node
  }
}

// --

/**
 * Map terminal event types to React scheduling priorities.
 * Mirrors react-dom's getEventPriority() switch.
 */
// getEventPriority 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEventPriority(eventType: string): number {
  // 按照 eventType 的取值选择终端渲染的具体处理分支。
  switch (eventType) {
    case 'keydown':
    case 'keyup':
    case 'click':
    case 'focus':
    case 'blur':
    case 'paste':
      // 返回 `DiscreteEventPriority as number`，作为终端渲染这次计算的结果。
      return DiscreteEventPriority as number
    case 'resize':
    case 'scroll':
    case 'mousemove':
      // 返回 `ContinuousEventPriority as number`，作为终端渲染这次计算的结果。
      return ContinuousEventPriority as number
    default:
      // 返回 `DefaultEventPriority as number`，作为终端渲染这次计算的结果。
      return DefaultEventPriority as number
  }
}

// --

// DiscreteUpdates 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DiscreteUpdates = <A, B>(
  // 这个回调绑定到 fn: (a: A, b: B) => boolean,，负责终端渲染在该局部场景下的响应。
  fn: (a: A, b: B) => boolean,
  a: A,
  b: B,
  c: undefined,
  d: undefined,
) => boolean

/**
 * Owns event dispatch state and the capture/bubble dispatch loop.
 *
 * The reconciler host config reads currentEvent and currentUpdatePriority
 * to implement resolveUpdatePriority, resolveEventType, and
 * resolveEventTimeStamp — mirroring how react-dom's host config reads
 * ReactDOMSharedInternals and window.event.
 *
 * discreteUpdates is injected after construction (by InkReconciler)
 * to break the import cycle.
 */
// Dispatcher 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class Dispatcher {
  currentEvent: TerminalEvent | null = null
  currentUpdatePriority: number = DefaultEventPriority as number
  discreteUpdates: DiscreteUpdates | null = null

  /**
   * Infer event priority from the currently-dispatching event.
   * Called by the reconciler host config's resolveUpdatePriority
   * when no explicit priority has been set.
   */
  // resolveEventPriority 使用 无 完成终端渲染里的对应操作。
  resolveEventPriority(): number {
    // `this.currentUpdatePriority` 与 `(NoEventPriority as number)` 不一致时刷新派生状态，避免使用过期结果。
    if (this.currentUpdatePriority !== (NoEventPriority as number)) {
      // 返回 `this.currentUpdatePriority`，作为终端渲染这次计算的结果。
      return this.currentUpdatePriority
    }
    // 满足 `this.currentEvent` 时，终端渲染执行该分支。
    if (this.currentEvent) {
      // 返回 `getEventPriority(this.currentEvent.type)`，作为终端渲染这次计算的结果。
      return getEventPriority(this.currentEvent.type)
    }
    // 返回 `DefaultEventPriority as number`，作为终端渲染这次计算的结果。
    return DefaultEventPriority as number
  }

  /**
   * Dispatch an event through capture and bubble phases.
   * Returns true if preventDefault() was NOT called.
   */
  // dispatch 使用 target: EventTarget, event: TerminalEvent 完成终端渲染里的对应操作。
  dispatch(target: EventTarget, event: TerminalEvent): boolean {
    // previousEvent保存`this.currentEvent`，供Ink 渲染层 dispatcher后续判断或输出使用。
    const previousEvent = this.currentEvent
    // 更新实例字段 currentEvent 为 event，同步终端渲染的内部状态。
    this.currentEvent = event
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 调用 event._setTarget，触发终端渲染此处需要的副作用。
      event._setTarget(target)

      // listeners 集合保存`collectListeners`，供终端渲染后续处理使用。
      const listeners = collectListeners(target, event)
      // 调用 processDispatchQueue，触发终端渲染此处需要的副作用。
      processDispatchQueue(listeners, event)

      // 调用 event._setEventPhase，触发终端渲染此处需要的副作用。
      event._setEventPhase('none')
      // 调用 event._setCurrentTarget，触发终端渲染此处需要的副作用。
      event._setCurrentTarget(null)

      // 返回 `!event.defaultPrevented`，作为终端渲染这次计算的结果。
      return !event.defaultPrevented
    } finally {
      // 更新实例字段 currentEvent 为 previousEvent，同步终端渲染的内部状态。
      this.currentEvent = previousEvent
    }
  }

  /**
   * Dispatch with discrete (sync) priority.
   * For user-initiated events: keyboard, click, focus, paste.
   */
  // dispatchDiscrete 使用 target: EventTarget, event: TerminalEvent 完成终端渲染里的对应操作。
  dispatchDiscrete(target: EventTarget, event: TerminalEvent): boolean {
    // this.discreteUpdates 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.discreteUpdates) {
      // 返回 `this.dispatch(target, event)`，作为终端渲染这次计算的结果。
      return this.dispatch(target, event)
    }
    // 返回 `this.discreteUpdates(`，作为终端渲染这次计算的结果。
    return this.discreteUpdates(
      // 这个回调绑定到 (t, e) => this.dispatch(t, e),，负责终端渲染在该局部场景下的响应。
      (t, e) => this.dispatch(t, e),
      target,
      event,
      undefined,
      undefined,
    )
  }

  /**
   * Dispatch with continuous priority.
   * For high-frequency events: resize, scroll, mouse move.
   */
  // dispatchContinuous 使用 target: EventTarget, event: TerminalEvent 完成终端渲染里的对应操作。
  dispatchContinuous(target: EventTarget, event: TerminalEvent): boolean {
    // previousPriority保存`this.currentUpdatePriority`，供Ink 渲染层 dispatcher后续判断或输出使用。
    const previousPriority = this.currentUpdatePriority
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 更新实例字段 currentUpdatePriority 为 ContinuousEventPriority as number，同步终端渲染的内部状态。
      this.currentUpdatePriority = ContinuousEventPriority as number
      // 返回 `this.dispatch(target, event)`，作为终端渲染这次计算的结果。
      return this.dispatch(target, event)
    } finally {
      // 更新实例字段 currentUpdatePriority 为 previousPriority，同步终端渲染的内部状态。
      this.currentUpdatePriority = previousPriority
    }
  }
}
