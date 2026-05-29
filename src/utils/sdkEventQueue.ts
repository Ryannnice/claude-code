// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 getIsNonInteractiveSession、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession, getSessionId } from '../bootstrap/state.js'
// 类型依赖 { SdkWorkflowProgress } 来自 ../types/tools.js，用于校准共享工具的数据契约。
import type { SdkWorkflowProgress } from '../types/tools.js'

// TaskStartedEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskStartedEvent = {
  type: 'system'
  subtype: 'task_started'
  task_id: string
  tool_use_id?: string
  description: string
  task_type?: string
  workflow_name?: string
  prompt?: string
}

// TaskProgressEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskProgressEvent = {
  type: 'system'
  subtype: 'task_progress'
  task_id: string
  tool_use_id?: string
  description: string
  usage: {
    total_tokens: number
    tool_uses: number
    duration_ms: number
  }
  last_tool_name?: string
  summary?: string
  // Delta batch of workflow state changes. Clients upsert by
  // `${type}:${index}` then group by phaseIndex to rebuild the phase tree,
  // same fold as collectFromEvents + groupByPhase in PhaseProgress.tsx.
  workflow_progress?: SdkWorkflowProgress[]
}

// Emitted when a foreground agent completes without being backgrounded.
// Drained by drainSdkEvents() directly into the output stream — does NOT
// go through the print.ts XML task_notification parser and does NOT trigger
// the LLM loop. Consumers (e.g. VS Code session.ts) use this to remove the
// task from the subagent panel.
// TaskNotificationSdkEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskNotificationSdkEvent = {
  type: 'system'
  subtype: 'task_notification'
  task_id: string
  tool_use_id?: string
  status: 'completed' | 'failed' | 'stopped'
  output_file: string
  summary: string
  usage?: {
    total_tokens: number
    tool_uses: number
    duration_ms: number
  }
}

// Mirrors notifySessionStateChanged. The CCR bridge already receives this
// via its own listener; SDK consumers (scmuxd, VS Code) need the same signal
// to know when the main turn's generator is idle vs actively producing.
// The 'idle' transition fires AFTER heldBackResult flushes and the bg-agent
// do-while loop exits — so SDK consumers can trust it as the authoritative
// "turn is over" signal even when result was withheld for background agents.
// SessionStateChangedEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionStateChangedEvent = {
  type: 'system'
  subtype: 'session_state_changed'
  state: 'idle' | 'running' | 'requires_action'
}

// SdkEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SdkEvent =
  | TaskStartedEvent
  | TaskProgressEvent
  | TaskNotificationSdkEvent
  | SessionStateChangedEvent

// MAX_QUEUE_SIZE 命名 `1000`，让后续代码直接表达这个值的用途。
const MAX_QUEUE_SIZE = 1000
// queue 从空数组开始收集，后续循环会按处理顺序追加条目。
const queue: SdkEvent[] = []

// enqueueSdkEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enqueueSdkEvent(event: SdkEvent): void {
  // SDK events are only consumed (drained) in headless/streaming mode.
  // In TUI mode they would accumulate up to the cap and never be read.
  // 满足 `!getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (!getIsNonInteractiveSession()) {
    // 共享工具 sdk Event Queue在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `queue.length >= MAX_QUEUE_SIZE` 时，共享工具执行该分支。
  if (queue.length >= MAX_QUEUE_SIZE) {
    // 调用 queue.shift，触发共享工具此处需要的副作用。
    queue.shift()
  }
  // queue追加新条目，保持收集顺序与输入顺序一致。
  queue.push(event)
}

// drainSdkEvents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function drainSdkEvents(): Array<
  SdkEvent & { uuid: UUID; session_id: string }
> {
  // queue为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (queue.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // events 集合保存`queue.splice`，供共享工具后续处理使用。
  const events = queue.splice(0)
  // 返回 `events.map(e => ({`，作为共享工具这次计算的结果。
  return events.map(e => ({
    ...e,
    uuid: randomUUID(),
    session_id: getSessionId(),
  }))
}

/**
 * Emit a task_notification SDK event for a task reaching a terminal state.
 *
 * registerTask() always emits task_started; this is the closing bookend.
 * Call this from any exit path that sets a task terminal WITHOUT going
 * through enqueuePendingNotification-with-<task-id> (print.ts parses that
 * XML into the same SDK event, so paths that do both would double-emit).
 * Paths that suppress the XML notification (notified:true pre-set, kill
 * paths, abort branches) must call this directly so SDK consumers
 * (Scuttle's bg-task dot, VS Code subagent panel) see the task close.
 */
// emitTaskTerminatedSdk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitTaskTerminatedSdk(
  taskId: string,
  status: 'completed' | 'failed' | 'stopped',
  opts?: {
    toolUseId?: string
    summary?: string
    outputFile?: string
    usage?: { total_tokens: number; tool_uses: number; duration_ms: number }
  },
): void {
  // 调用 enqueueSdkEvent，触发共享工具此处需要的副作用。
  enqueueSdkEvent({
    type: 'system',
    subtype: 'task_notification',
    task_id: taskId,
    tool_use_id: opts?.toolUseId,
    status,
    output_file: opts?.outputFile ?? '',
    summary: opts?.summary ?? '',
    usage: opts?.usage,
  })
}
