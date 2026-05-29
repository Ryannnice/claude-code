/**
 * Hook event system for broadcasting hook execution events.
 *
 * This module provides a generic event system that is separate from the
 * main message stream. Handlers can register to receive events and decide
 * what to do with them (e.g., convert to SDK messages, log, etc.).
 */

// 引入 HOOK_EVENTS，将 src/entrypoints/sdk/coreTypes.js 中已经封装好的能力接到本文件流程里。
import { HOOK_EVENTS } from 'src/entrypoints/sdk/coreTypes.js'

// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'

/**
 * Hook events that are always emitted regardless of the includeHookEvents
 * option. These are low-noise lifecycle events that were in the original
 * allowlist and are backwards-compatible.
 */
// ALWAYS_EMITTED_HOOK_EVENTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALWAYS_EMITTED_HOOK_EVENTS = ['SessionStart', 'Setup'] as const

// MAX_PENDING_EVENTS 集合保存`100`，供后续判断或组装使用。
const MAX_PENDING_EVENTS = 100

// HookStartedEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookStartedEvent = {
  type: 'started'
  hookId: string
  hookName: string
  hookEvent: string
}

// HookProgressEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookProgressEvent = {
  type: 'progress'
  hookId: string
  hookName: string
  hookEvent: string
  stdout: string
  stderr: string
  output: string
}

// HookResponseEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookResponseEvent = {
  type: 'response'
  hookId: string
  hookName: string
  hookEvent: string
  output: string
  stdout: string
  stderr: string
  exitCode?: number
  outcome: 'success' | 'error' | 'cancelled'
}

// HookExecutionEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookExecutionEvent =
  | HookStartedEvent
  | HookProgressEvent
  | HookResponseEvent
// HookEventHandler 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookEventHandler = (event: HookExecutionEvent) => void

// pendingEvents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const pendingEvents: HookExecutionEvent[] = []
// eventHandler初始化为空值，后续分支会在有数据时补齐。
let eventHandler: HookEventHandler | null = null
// allHookEventsEnabled标记共享工具React hook hook Events是否启用对应路径。
let allHookEventsEnabled = false

// registerHookEventHandler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerHookEventHandler(
  handler: HookEventHandler | null,
): void {
  // eventHandler更新为 `handler`，确保共享工具后续读取最新状态。
  eventHandler = handler
  // 只有 `handler && pendingEvents.length > 0` 满足时，共享工具才执行该分支。
  if (handler && pendingEvents.length > 0) {
    // 逐项读取 `pendingEvents.splice(0)` 中的event，按输入顺序推进共享工具。
    for (const event of pendingEvents.splice(0)) {
      // 调用 handler，触发共享工具此处需要的副作用。
      handler(event)
    }
  }
}

// emit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function emit(event: HookExecutionEvent): void {
  // 满足 `eventHandler` 时，共享工具执行该分支。
  if (eventHandler) {
    // 调用 eventHandler，触发共享工具此处需要的副作用。
    eventHandler(event)
  } else {
    // pendingEvents 集合追加新条目，保持收集顺序与输入顺序一致。
    pendingEvents.push(event)
    // 满足 `pendingEvents.length > MAX_PENDING_EVENTS` 时，共享工具执行该分支。
    if (pendingEvents.length > MAX_PENDING_EVENTS) {
      // 调用 pendingEvents.shift，触发共享工具此处需要的副作用。
      pendingEvents.shift()
    }
  }
}

// shouldEmit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldEmit(hookEvent: string): boolean {
  // 满足 `(ALWAYS_EMITTED_HOOK_EVENTS as readonly string[]).includes(hookEvent)` 时，共享工具执行该分支。
  if ((ALWAYS_EMITTED_HOOK_EVENTS as readonly string[]).includes(hookEvent)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    allHookEventsEnabled &&
    (HOOK_EVENTS as readonly string[]).includes(hookEvent)
  )
}

// emitHookStarted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitHookStarted(
  hookId: string,
  hookName: string,
  hookEvent: string,
): void {
  // 满足 `!shouldEmit(hookEvent)` 时，共享工具执行该分支。
  if (!shouldEmit(hookEvent)) return

  // 调用 emit，触发共享工具此处需要的副作用。
  emit({
    type: 'started',
    hookId,
    hookName,
    hookEvent,
  })
}

// emitHookProgress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitHookProgress(data: {
  hookId: string
  hookName: string
  hookEvent: string
  stdout: string
  stderr: string
  output: string
}): void {
  // 满足 `!shouldEmit(data.hookEvent)` 时，共享工具执行该分支。
  if (!shouldEmit(data.hookEvent)) return

  // 调用 emit，触发共享工具此处需要的副作用。
  emit({
    type: 'progress',
    ...data,
  })
}

// startHookProgressInterval 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startHookProgressInterval(params: {
  hookId: string
  hookName: string
  hookEvent: string
  // 这个回调绑定到 getOutput: () => Promise<{ stdout: string; stderr: string; output: string }>，负责共享工具在该局部场景下的响应。
  getOutput: () => Promise<{ stdout: string; stderr: string; output: string }>
  intervalMs?: number
}): () => void {
  // 满足 `!shouldEmit(params.hookEvent)) return (` 时，共享工具执行该分支。
  if (!shouldEmit(params.hookEvent)) return () => {}

  // lastEmittedOutput固定为 `''`，作为共享工具React hook hook Events后续展示或比较的基准。
  let lastEmittedOutput = ''
  // interval保存`setInterval`，供共享工具后续处理使用。
  const interval = setInterval(() => {
    // 这个回调绑定到 void params.getOutput().then(({ stdout, stderr, output }) => {，负责共享工具在该局部场景下的响应。
    void params.getOutput().then(({ stdout, stderr, output }) => {
      // 满足 `output === lastEmittedOutput` 时，共享工具执行该分支。
      if (output === lastEmittedOutput) return
      // lastEmittedOutput更新为 `output`，确保共享工具后续读取最新状态。
      lastEmittedOutput = output
      // 调用 emitHookProgress，触发共享工具此处需要的副作用。
      emitHookProgress({
        hookId: params.hookId,
        hookName: params.hookName,
        hookEvent: params.hookEvent,
        stdout,
        stderr,
        output,
      })
    })
  }, params.intervalMs ?? 1000)
  // 调用 interval.unref，触发共享工具此处需要的副作用。
  interval.unref()

  // 返回 `() => clearInterval(interval)`，作为共享工具这次计算的结果。
  return () => clearInterval(interval)
}

// emitHookResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitHookResponse(data: {
  hookId: string
  hookName: string
  hookEvent: string
  output: string
  stdout: string
  stderr: string
  exitCode?: number
  outcome: 'success' | 'error' | 'cancelled'
}): void {
  // Always log full hook output to debug log for verbose mode debugging
  // outputToLog标记共享工具React hook hook Events是否启用对应路径。
  const outputToLog = data.stdout || data.stderr || data.output
  // 满足 `outputToLog` 时，共享工具执行该分支。
  if (outputToLog) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hook ${data.hookName} (${data.hookEvent}) ${data.outcome}:\n${outputToLog}`,
    )
  }

  // 满足 `!shouldEmit(data.hookEvent)` 时，共享工具执行该分支。
  if (!shouldEmit(data.hookEvent)) return

  // 调用 emit，触发共享工具此处需要的副作用。
  emit({
    type: 'response',
    ...data,
  })
}

/**
 * Enable emission of all hook event types (beyond SessionStart and Setup).
 * Called when the SDK `includeHookEvents` option is set or when running
 * in CLAUDE_CODE_REMOTE mode.
 */
// setAllHookEventsEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAllHookEventsEnabled(enabled: boolean): void {
  // allHookEventsEnabled更新为 `enabled`，确保共享工具后续读取最新状态。
  allHookEventsEnabled = enabled
}

// clearHookEventState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearHookEventState(): void {
  // eventHandler更新为 `null`，确保共享工具后续读取最新状态。
  eventHandler = null
  // pendingEvents 集合被清空，共享工具从干净状态继续。
  pendingEvents.length = 0
  // allHookEventsEnabled更新为 `false`，确保共享工具后续读取最新状态。
  allHookEventsEnabled = false
}
