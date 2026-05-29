// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准共享工具的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 类型依赖 { Permutations } 来自 src/types/utils.js，用于校准共享工具的数据契约。
import type { Permutations } from 'src/types/utils.js'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  QueueOperation,
  QueueOperationMessage,
} from '../types/messageQueueTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  EditablePromptInputMode,
  PromptInputMode,
  QueuedCommand,
  QueuePriority,
} from '../types/textInputTypes.js'
// 类型依赖 { PastedContent } 来自 ./config.js，用于校准共享工具的数据契约。
import type { PastedContent } from './config.js'
// 引入 extractTextContent，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { extractTextContent } from './messages.js'
// 引入 objectGroupBy，将 ./objectGroupBy.js 中已经封装好的能力接到本文件流程里。
import { objectGroupBy } from './objectGroupBy.js'
// 引入 recordQueueOperation，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { recordQueueOperation } from './sessionStorage.js'
// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// SetAppState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetAppState = (f: (prev: AppState) => AppState) => void

// ============================================================================
// Logging helper
// ============================================================================

// logOperation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logOperation(operation: QueueOperation, content?: string): void {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // queueOp 集中保存共享工具 message Queue Manager要一起传递的字段。
  const queueOp: QueueOperationMessage = {
    type: 'queue-operation',
    operation,
    timestamp: new Date().toISOString(),
    sessionId,
    ...(content !== undefined && { content }),
  }
  // 显式忽略 `recordQueueOperation(queueOp)` 的返回值，只保留它触发的副作用。
  void recordQueueOperation(queueOp)
}

// ============================================================================
// Unified command queue (module-level, independent of React state)
//
// All commands — user input, task notifications, orphaned permissions — go
// through this single queue. React components subscribe via
// useSyncExternalStore (subscribeToCommandQueue / getCommandQueueSnapshot).
// Non-React code (print.ts streaming loop) reads directly via
// getCommandQueue() / getCommandQueueLength().
//
// Priority determines dequeue order: 'now' > 'next' > 'later'.
// Within the same priority, commands are processed FIFO.
// ============================================================================

// commandQueue 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const commandQueue: QueuedCommand[] = []
/** Frozen snapshot — recreated on every mutation for useSyncExternalStore. */
// snapshot保存`Object.freeze([])`，供后续判断或组装使用。
let snapshot: readonly QueuedCommand[] = Object.freeze([])
// queueChanged构建`createSignal`，供共享工具后续处理使用。
const queueChanged = createSignal()

// notifySubscribers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function notifySubscribers(): void {
  // snapshot更新为 `Object.freeze([...commandQueue])`，确保共享工具后续读取最新状态。
  snapshot = Object.freeze([...commandQueue])
  // 调用 queueChanged.emit，触发共享工具此处需要的副作用。
  queueChanged.emit()
}

// ============================================================================
// useSyncExternalStore interface
// ============================================================================

/**
 * Subscribe to command queue changes.
 * Compatible with React's useSyncExternalStore.
 */
// subscribeToCommandQueue 命令数据 命名 `queueChanged.subscribe`，让后续代码直接表达这个值的用途。
export const subscribeToCommandQueue = queueChanged.subscribe

/**
 * Get current snapshot of the command queue.
 * Compatible with React's useSyncExternalStore.
 * Returns a frozen array that only changes reference on mutation.
 */
// getCommandQueueSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommandQueueSnapshot(): readonly QueuedCommand[] {
  // 返回 `snapshot`，作为共享工具这次计算的结果。
  return snapshot
}

// ============================================================================
// Read operations (for non-React code)
// ============================================================================

/**
 * Get a mutable copy of the current queue.
 * Use for one-off reads where you need the actual commands.
 */
// getCommandQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommandQueue(): QueuedCommand[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...commandQueue]
}

/**
 * Get the current queue length without copying.
 */
// getCommandQueueLength 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommandQueueLength(): number {
  // 返回 `commandQueue.length`，作为共享工具这次计算的结果。
  return commandQueue.length
}

/**
 * Check if there are commands in the queue.
 */
// hasCommandsInQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCommandsInQueue(): boolean {
  // 返回 `commandQueue.length > 0`，作为共享工具这次计算的结果。
  return commandQueue.length > 0
}

/**
 * Trigger a re-check by notifying subscribers.
 * Use after async processing completes to ensure remaining commands
 * are picked up by useSyncExternalStore consumers.
 */
// recheckCommandQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recheckCommandQueue(): void {
  // 满足 `commandQueue.length > 0` 时，共享工具执行该分支。
  if (commandQueue.length > 0) {
    // 调用 notifySubscribers，触发共享工具此处需要的副作用。
    notifySubscribers()
  }
}

// ============================================================================
// Write operations
// ============================================================================

/**
 * Add a command to the queue.
 * Used for user-initiated commands (prompt, bash, orphaned-permission).
 * Defaults priority to 'next' (processed before task notifications).
 */
// enqueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enqueue(command: QueuedCommand): void {
  // commandQueue 命令数据追加新条目，保持收集顺序与输入顺序一致。
  commandQueue.push({ ...command, priority: command.priority ?? 'next' })
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()
  // 调用 logOperation，触发共享工具此处需要的副作用。
  logOperation(
    'enqueue',
    typeof command.value === 'string' ? command.value : undefined,
  )
}

/**
 * Add a task notification to the queue.
 * Convenience wrapper that defaults priority to 'later' so user input
 * is never starved by system messages.
 */
// enqueuePendingNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enqueuePendingNotification(command: QueuedCommand): void {
  // commandQueue 命令数据追加新条目，保持收集顺序与输入顺序一致。
  commandQueue.push({ ...command, priority: command.priority ?? 'later' })
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()
  // 调用 logOperation，触发共享工具此处需要的副作用。
  logOperation(
    'enqueue',
    typeof command.value === 'string' ? command.value : undefined,
  )
}

// PRIORITY_ORDER 集中保存共享工具 message Queue Manager要一起传递的字段。
const PRIORITY_ORDER: Record<QueuePriority, number> = {
  now: 0,
  next: 1,
  later: 2,
}

/**
 * Remove and return the highest-priority command, or undefined if empty.
 * Within the same priority level, commands are dequeued FIFO.
 *
 * An optional `filter` narrows the candidates: only commands for which the
 * predicate returns `true` are considered. Non-matching commands stay in the
 * queue untouched. This lets between-turn drains (SDK, REPL) restrict to
 * main-thread commands (`cmd.agentId === undefined`) without restructuring
 * the existing while-loop patterns.
 */
// dequeue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dequeue(
  filter?: (cmd: QueuedCommand) => boolean,
): QueuedCommand | undefined {
  // commandQueue 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandQueue.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Find the first command with the highest priority (respecting filter)
  // bestIdx保存`-1`，供后续判断或组装使用。
  let bestIdx = -1
  // bestPriority保存`Infinity`，供共享工具 message Queue Manager后续判断或输出使用。
  let bestPriority = Infinity
  // 按索引扫描 `commandQueue.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < commandQueue.length; i++) {
    // cmd 命令数据读取 `commandQueue[i]!` 对应条目，后续围绕该成员继续处理。
    const cmd = commandQueue[i]!
    // 只有 `filter && !filter(cmd)` 满足时，共享工具才执行该分支。
    if (filter && !filter(cmd)) continue
    // priority保存`PRIORITY_ORDER[cmd.priority ?? 'next']`，供共享工具 message Queue Manager后续判断或输出使用。
    const priority = PRIORITY_ORDER[cmd.priority ?? 'next']
    // 满足 `priority < bestPriority` 时，共享工具执行该分支。
    if (priority < bestPriority) {
      // bestIdx更新为 `i`，确保共享工具后续读取最新状态。
      bestIdx = i
      // bestPriority更新为 `priority`，确保共享工具后续读取最新状态。
      bestPriority = priority
    }
  }

  // 满足 `bestIdx === -1` 时，共享工具执行该分支。
  if (bestIdx === -1) return undefined

  // 从 `commandQueue.splice(bestIdx, 1)` 按位置拆出 dequeued，让共享工具 message Queue Manager分别处理这些返回值。
  const [dequeued] = commandQueue.splice(bestIdx, 1)
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()
  // 调用 logOperation，触发共享工具此处需要的副作用。
  logOperation('dequeue')
  // 返回 `dequeued`，作为共享工具这次计算的结果。
  return dequeued
}

/**
 * Remove and return all commands from the queue.
 * Logs a dequeue operation for each command.
 */
// dequeueAll 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dequeueAll(): QueuedCommand[] {
  // commandQueue 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandQueue.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // commands 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
  const commands = [...commandQueue]
  // commandQueue 命令数据被清空，共享工具从干净状态继续。
  commandQueue.length = 0
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()

  // 按顺序遍历 `commands` 中的_cmd 命令数据，逐个交给共享工具处理。
  for (const _cmd of commands) {
    // 调用 logOperation，触发共享工具此处需要的副作用。
    logOperation('dequeue')
  }

  // 返回 `commands`，作为共享工具这次计算的结果。
  return commands
}

/**
 * Return the highest-priority command without removing it, or undefined if empty.
 * Accepts an optional `filter` — only commands passing the predicate are considered.
 */
// peek 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function peek(
  filter?: (cmd: QueuedCommand) => boolean,
): QueuedCommand | undefined {
  // commandQueue 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandQueue.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // bestIdx保存`-1`，供后续判断或组装使用。
  let bestIdx = -1
  // bestPriority保存`Infinity`，供共享工具 message Queue Manager后续判断或输出使用。
  let bestPriority = Infinity
  // 按索引扫描 `commandQueue.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < commandQueue.length; i++) {
    // cmd 命令数据读取 `commandQueue[i]!` 对应条目，后续围绕该成员继续处理。
    const cmd = commandQueue[i]!
    // 只有 `filter && !filter(cmd)` 满足时，共享工具才执行该分支。
    if (filter && !filter(cmd)) continue
    // priority保存`PRIORITY_ORDER[cmd.priority ?? 'next']`，供共享工具 message Queue Manager后续判断或输出使用。
    const priority = PRIORITY_ORDER[cmd.priority ?? 'next']
    // 满足 `priority < bestPriority` 时，共享工具执行该分支。
    if (priority < bestPriority) {
      // bestIdx更新为 `i`，确保共享工具后续读取最新状态。
      bestIdx = i
      // bestPriority更新为 `priority`，确保共享工具后续读取最新状态。
      bestPriority = priority
    }
  }
  // 满足 `bestIdx === -1` 时，共享工具执行该分支。
  if (bestIdx === -1) return undefined
  // 返回 `commandQueue[bestIdx]`，作为共享工具这次计算的结果。
  return commandQueue[bestIdx]
}

/**
 * Remove and return all commands matching a predicate, preserving priority order.
 * Non-matching commands stay in the queue.
 */
// dequeueAllMatching 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dequeueAllMatching(
  // 这个回调绑定到 predicate: (cmd: QueuedCommand) => boolean,，负责共享工具在该局部场景下的响应。
  predicate: (cmd: QueuedCommand) => boolean,
): QueuedCommand[] {
  // matched 从空数组开始收集，后续循环会按处理顺序追加条目。
  const matched: QueuedCommand[] = []
  // remaining 从空数组开始收集，后续循环会按处理顺序追加条目。
  const remaining: QueuedCommand[] = []
  // 按顺序遍历 `commandQueue` 中的cmd 命令数据，逐个交给共享工具处理。
  for (const cmd of commandQueue) {
    // 满足 `predicate(cmd)` 时，共享工具执行该分支。
    if (predicate(cmd)) {
      // matched追加新条目，保持收集顺序与输入顺序一致。
      matched.push(cmd)
    } else {
      // remaining追加新条目，保持收集顺序与输入顺序一致。
      remaining.push(cmd)
    }
  }
  // matched为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (matched.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // commandQueue 命令数据被清空，共享工具从干净状态继续。
  commandQueue.length = 0
  // commandQueue 命令数据追加新条目，保持收集顺序与输入顺序一致。
  commandQueue.push(...remaining)
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()
  // 按顺序遍历 `matched` 中的_cmd 命令数据，逐个交给共享工具处理。
  for (const _cmd of matched) {
    // 调用 logOperation，触发共享工具此处需要的副作用。
    logOperation('dequeue')
  }
  // 返回 `matched`，作为共享工具这次计算的结果。
  return matched
}

/**
 * Remove specific commands from the queue by reference identity.
 * Callers must pass the same object references that are in the queue
 * (e.g. from getCommandsByMaxPriority). Logs a 'remove' operation for each.
 */
// remove 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function remove(commandsToRemove: QueuedCommand[]): void {
  // commandsToRemove 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandsToRemove.length === 0) {
    // 共享工具 message Queue Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // before 命名 `commandQueue.length`，让后续代码直接表达这个值的用途。
  const before = commandQueue.length
  // 循环处理 `let i = commandQueue.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = commandQueue.length - 1; i >= 0; i--) {
    // 满足 `commandsToRemove.includes(commandQueue[i]!)` 时，共享工具执行该分支。
    if (commandsToRemove.includes(commandQueue[i]!)) {
      // 调用 commandQueue.splice，触发共享工具此处需要的副作用。
      commandQueue.splice(i, 1)
    }
  }

  // `commandQueue.length` 与 `before` 不一致时刷新派生状态，避免使用过期结果。
  if (commandQueue.length !== before) {
    // 调用 notifySubscribers，触发共享工具此处需要的副作用。
    notifySubscribers()
  }

  // 按顺序遍历 `commandsToRemove` 中的_cmd 命令数据，逐个交给共享工具处理。
  for (const _cmd of commandsToRemove) {
    // 调用 logOperation，触发共享工具此处需要的副作用。
    logOperation('remove')
  }
}

/**
 * Remove commands matching a predicate.
 * Returns the removed commands.
 */
// removeByFilter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeByFilter(
  // 这个回调绑定到 predicate: (cmd: QueuedCommand) => boolean,，负责共享工具在该局部场景下的响应。
  predicate: (cmd: QueuedCommand) => boolean,
): QueuedCommand[] {
  // removed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removed: QueuedCommand[] = []
  // 循环处理 `let i = commandQueue.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = commandQueue.length - 1; i >= 0; i--) {
    // 满足 `predicate(commandQueue[i]!)` 时，共享工具执行该分支。
    if (predicate(commandQueue[i]!)) {
      // 调用 removed.unshift，触发共享工具此处需要的副作用。
      removed.unshift(commandQueue.splice(i, 1)[0]!)
    }
  }

  // 满足 `removed.length > 0` 时，共享工具执行该分支。
  if (removed.length > 0) {
    // 调用 notifySubscribers，触发共享工具此处需要的副作用。
    notifySubscribers()
    // 按顺序遍历 `removed` 中的_cmd 命令数据，逐个交给共享工具处理。
    for (const _cmd of removed) {
      // 调用 logOperation，触发共享工具此处需要的副作用。
      logOperation('remove')
    }
  }

  // 返回 `removed`，作为共享工具这次计算的结果。
  return removed
}

/**
 * Clear all commands from the queue.
 * Used by ESC cancellation to discard queued notifications.
 */
// clearCommandQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCommandQueue(): void {
  // commandQueue 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandQueue.length === 0) {
    // 共享工具 message Queue Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // commandQueue 命令数据被清空，共享工具从干净状态继续。
  commandQueue.length = 0
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()
}

/**
 * Clear all commands and reset snapshot.
 * Used for test cleanup.
 */
// resetCommandQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetCommandQueue(): void {
  // commandQueue 命令数据被清空，共享工具从干净状态继续。
  commandQueue.length = 0
  // snapshot更新为 `Object.freeze([])`，确保共享工具后续读取最新状态。
  snapshot = Object.freeze([])
}

// ============================================================================
// Editable mode helpers
// ============================================================================

// NON_EDITABLE_MODES 集合构建`new Set<PromptInputMode>([` 整理出中间结果，供共享工具 message Queue Manager后续步骤使用。
const NON_EDITABLE_MODES = new Set<PromptInputMode>([
  'task-notification',
] satisfies Permutations<Exclude<PromptInputMode, EditablePromptInputMode>>)

// isPromptInputModeEditable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPromptInputModeEditable(
  mode: PromptInputMode,
): mode is EditablePromptInputMode {
  // 返回 `!NON_EDITABLE_MODES.has(mode)`，作为共享工具这次计算的结果。
  return !NON_EDITABLE_MODES.has(mode)
}

/**
 * Whether this queued command can be pulled into the input buffer via UP/ESC.
 * System-generated commands (proactive ticks, scheduled tasks, plan
 * verification, channel messages) contain raw XML and must not leak into
 * the user's input.
 */
// isQueuedCommandEditable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isQueuedCommandEditable(cmd: QueuedCommand): boolean {
  // 返回 `isPromptInputModeEditable(cmd.mode) && !cmd.isMeta`，作为共享工具这次计算的结果。
  return isPromptInputModeEditable(cmd.mode) && !cmd.isMeta
}

/**
 * Whether this queued command should render in the queue preview under the
 * prompt. Superset of editable — channel messages show (so the keyboard user
 * sees what arrived) but stay non-editable (raw XML).
 */
// isQueuedCommandVisible 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isQueuedCommandVisible(cmd: QueuedCommand): boolean {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
    cmd.origin?.kind === 'channel'
  )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  // 返回 `isQueuedCommandEditable(cmd)`，作为共享工具这次计算的结果。
  return isQueuedCommandEditable(cmd)
}

/**
 * Extract text from a queued command value.
 * For strings, returns the string.
 * For ContentBlockParam[], extracts text from text blocks.
 */
// extractTextFromValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractTextFromValue(value: string | ContentBlockParam[]): string {
  // 返回 `typeof value === 'string' ? value : extractTextContent(value, '\n')`，作为共享工具这次计算的结果。
  return typeof value === 'string' ? value : extractTextContent(value, '\n')
}

/**
 * Extract images from ContentBlockParam[] and convert to PastedContent format.
 * Returns empty array for string values or if no images found.
 */
// extractImagesFromValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractImagesFromValue(
  value: string | ContentBlockParam[],
  startId: number,
): PastedContent[] {
  // 当 `typeof value` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof value === 'string') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // images 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const images: PastedContent[] = []
  // imageIndex 索引保存`0`，供共享工具 message Queue Manager后续判断或输出使用。
  let imageIndex = 0
  // 按顺序遍历 `value` 中的block，逐个交给共享工具处理。
  for (const block of value) {
    // 当 `block.type` 匹配 `'image' && block.source.typ...` 时，共享工具执行对应分支。
    if (block.type === 'image' && block.source.type === 'base64') {
      // images 集合追加新条目，保持收集顺序与输入顺序一致。
      images.push({
        id: startId + imageIndex,
        type: 'image',
        content: block.source.data,
        mediaType: block.source.media_type,
        filename: `image${imageIndex + 1}`,
      })
      // 共享工具 message Queue Manager在这里处理 `imageIndex++`，完成这一小步状态转换。
      imageIndex++
    }
  }
  // 返回 `images`，作为共享工具这次计算的结果。
  return images
}

// PopAllEditableResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PopAllEditableResult = {
  text: string
  cursorOffset: number
  images: PastedContent[]
}

/**
 * Pop all editable commands and combine them with current input for editing.
 * Notification modes (task-notification) are left in the queue
 * to be auto-processed later.
 * Returns object with combined text, cursor offset, and images to restore.
 * Returns undefined if no editable commands in queue.
 */
// popAllEditable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function popAllEditable(
  currentInput: string,
  currentCursorOffset: number,
): PopAllEditableResult | undefined {
  // commandQueue 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commandQueue.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 从 `objectGroupBy(` 解构 editable = []、nonEditable = []，减少共享工具 message Queue Manager对同一对象的重复访问。
  const { editable = [], nonEditable = [] } = objectGroupBy(
    [...commandQueue],
    // cmd 命令数据更新为 `> (isQueuedCommandEditable(cmd) ? 'editable' : 'nonEditab...`，确保共享工具后续读取最新状态。
    cmd => (isQueuedCommandEditable(cmd) ? 'editable' : 'nonEditable'),
  )

  // editable为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (editable.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Extract text from queued commands (handles both strings and ContentBlockParam[])
  // queuedTexts 集合派生`editable.map`，供共享工具后续处理使用。
  const queuedTexts = editable.map(cmd => extractTextFromValue(cmd.value))
  // newInput筛选`filter`，供共享工具后续处理使用。
  const newInput = [...queuedTexts, currentInput].filter(Boolean).join('\n')

  // Calculate cursor offset: length of joined queued commands + 1 + current cursor offset
  // 光标偏移格式化`queuedTexts.join`，供共享工具后续处理使用。
  const cursorOffset = queuedTexts.join('\n').length + 1 + currentCursorOffset

  // Extract images from queued commands
  // images 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const images: PastedContent[] = []
  // nextImageId记录时间`Date.now`，供共享工具后续处理使用。
  let nextImageId = Date.now() // Use timestamp as base for unique IDs
  // 按顺序遍历 `editable` 中的cmd 命令数据，逐个交给共享工具处理。
  for (const cmd of editable) {
    // handlePromptSubmit queues images in pastedContents (value is a string).
    // Preserve the original PastedContent id so imageStore lookups still work.
    // 满足 `cmd.pastedContents` 时，共享工具执行该分支。
    if (cmd.pastedContents) {
      // 逐项读取 `Object.values(cmd.pastedContents)` 中的文本内容，按输入顺序推进共享工具。
      for (const content of Object.values(cmd.pastedContents)) {
        // 当 `content.type` 匹配 `'image'` 时，共享工具执行对应分支。
        if (content.type === 'image') {
          // images 集合追加新条目，保持收集顺序与输入顺序一致。
          images.push(content)
        }
      }
    }
    // Bridge/remote commands may embed images directly in ContentBlockParam[].
    // cmdImages 命令数据保存`extractImagesFromValue`，供共享工具后续处理使用。
    const cmdImages = extractImagesFromValue(cmd.value, nextImageId)
    // images 集合追加新条目，保持收集顺序与输入顺序一致。
    images.push(...cmdImages)
    // 共享工具 message Queue Manager在这里处理 `nextImageId += cmdImages.length`，完成这一小步状态转换。
    nextImageId += cmdImages.length
  }

  // 按顺序遍历 `editable` 中的命令，逐个交给共享工具处理。
  for (const command of editable) {
    // 调用 logOperation，触发共享工具此处需要的副作用。
    logOperation(
      'popAll',
      typeof command.value === 'string' ? command.value : undefined,
    )
  }

  // Replace queue contents with only the non-editable commands
  // commandQueue 命令数据被清空，共享工具从干净状态继续。
  commandQueue.length = 0
  // commandQueue 命令数据追加新条目，保持收集顺序与输入顺序一致。
  commandQueue.push(...nonEditable)
  // 调用 notifySubscribers，触发共享工具此处需要的副作用。
  notifySubscribers()

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { text: newInput, cursorOffset, images }
}

// ============================================================================
// Backward-compatible aliases (deprecated — prefer new names)
// ============================================================================

/** @deprecated Use subscribeToCommandQueue */
// subscribeToPendingNotifications 集合保存`subscribeToCommandQueue`，供后续判断或组装使用。
export const subscribeToPendingNotifications = subscribeToCommandQueue

/** @deprecated Use getCommandQueueSnapshot */
// getPendingNotificationsSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingNotificationsSnapshot(): readonly QueuedCommand[] {
  // 返回 `snapshot`，作为共享工具这次计算的结果。
  return snapshot
}

/** @deprecated Use hasCommandsInQueue */
// hasPendingNotifications 集合标记共享工具 message Queue Manager是否启用对应路径。
export const hasPendingNotifications = hasCommandsInQueue

/** @deprecated Use getCommandQueueLength */
// getPendingNotificationsCount 数量读取`getCommandQueueLength` 整理出中间结果，供共享工具 message Queue Manager后续步骤使用。
export const getPendingNotificationsCount = getCommandQueueLength

/** @deprecated Use recheckCommandQueue */
// recheckPendingNotifications 集合读取`recheckCommandQueue` 整理出中间结果，供共享工具 message Queue Manager后续步骤使用。
export const recheckPendingNotifications = recheckCommandQueue

/** @deprecated Use dequeue */
// dequeuePendingNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dequeuePendingNotification(): QueuedCommand | undefined {
  // 返回 `dequeue()`，作为共享工具这次计算的结果。
  return dequeue()
}

/** @deprecated Use resetCommandQueue */
// resetPendingNotifications 集合保存`resetCommandQueue`，供后续判断或组装使用。
export const resetPendingNotifications = resetCommandQueue

/** @deprecated Use clearCommandQueue */
// clearPendingNotifications 集合保存`clearCommandQueue`，供共享工具 message Queue Manager后续判断或输出使用。
export const clearPendingNotifications = clearCommandQueue

/**
 * Get commands at or above a given priority level without removing them.
 * Useful for mid-chain draining where only urgent items should be processed.
 *
 * Priority order: 'now' (0) > 'next' (1) > 'later' (2).
 * Passing 'now' returns only now-priority commands; 'later' returns everything.
 */
// getCommandsByMaxPriority 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommandsByMaxPriority(
  maxPriority: QueuePriority,
): QueuedCommand[] {
  // threshold读取 `PRIORITY_ORDER[maxPriority]` 对应条目，后续围绕该成员继续处理。
  const threshold = PRIORITY_ORDER[maxPriority]
  // 返回 `commandQueue.filter(`，作为共享工具这次计算的结果。
  return commandQueue.filter(
    // cmd 命令数据更新为 `> PRIORITY_ORDER[cmd.priority ?? 'next'] <= threshold`，确保共享工具后续读取最新状态。
    cmd => PRIORITY_ORDER[cmd.priority ?? 'next'] <= threshold,
  )
}

/**
 * Returns true if the command is a slash command that should be routed through
 * processSlashCommand rather than sent to the model as text.
 *
 * Commands with `skipSlashCommands` (e.g. bridge/CCR messages) are NOT treated
 * as slash commands — their text is meant for the model.
 */
// isSlashCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSlashCommand(cmd: QueuedCommand): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof cmd.value === 'string' &&
    cmd.value.trim().startsWith('/') &&
    !cmd.skipSlashCommands
  )
}
