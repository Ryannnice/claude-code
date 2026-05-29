// Background task entry for auto-dream (memory consolidation subagent).
// Makes the otherwise-invisible forked agent visible in the footer pill and
// Shift+Down dialog. The dream agent itself is unchanged — this is pure UI
// surfacing via the existing task registry.

// 接入 rollbackConsolidationLock 服务层能力，把外部通信或共享状态交给 ../../services/autoDream/consolidationLock.js 处理。
import { rollbackConsolidationLock } from '../../services/autoDream/consolidationLock.js'
// 类型依赖 { SetAppState, Task, TaskStateBase } 来自 ../../Task.js，用于校准Dream Task的数据契约。
import type { SetAppState, Task, TaskStateBase } from '../../Task.js'
// 引入 createTaskStateBase、generateTaskId，将 ../../Task.js 中已经封装好的能力接到本文件流程里。
import { createTaskStateBase, generateTaskId } from '../../Task.js'
// 复用 registerTask、updateTaskState 工具函数，把通用处理留在 ../../utils/task/framework.js 中维护。
import { registerTask, updateTaskState } from '../../utils/task/framework.js'

// Keep only the N most recent turns for live display.
// MAX_TURNS 集合保存`30`，供后续判断或组装使用。
const MAX_TURNS = 30

// A single assistant turn from the dream agent, tool uses collapsed to a count.
// DreamTurn 固化Dream Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type DreamTurn = {
  text: string
  toolUseCount: number
}

// No phase detection — the dream prompt has a 4-stage structure
// (orient/gather/consolidate/prune) but we don't parse it. Just flip from
// 'starting' to 'updating' when the first Edit/Write tool_use lands.
// DreamPhase 固化Dream Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type DreamPhase = 'starting' | 'updating'

// DreamTaskState 固化Dream Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type DreamTaskState = TaskStateBase & {
  type: 'dream'
  phase: DreamPhase
  sessionsReviewing: number
  /**
   * Paths observed in Edit/Write tool_use blocks via onMessage. This is an
   * INCOMPLETE reflection of what the dream agent actually changed — it misses
   * any bash-mediated writes and only captures the tool calls we pattern-match.
   * Treat as "at least these were touched", not "only these were touched".
   */
  filesTouched: string[]
  /** Assistant text responses, tool uses collapsed. Prompt is NOT included. */
  turns: DreamTurn[]
  abortController?: AbortController
  /** Stashed so kill can rewind the lock mtime (same path as fork-failure). */
  priorMtime: number
}

// isDreamTask 封装DreamTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDreamTask(task: unknown): task is DreamTaskState {
  // 返回 `(`，作为Dream Task这次计算的结果。
  return (
    typeof task === 'object' &&
    task !== null &&
    'type' in task &&
    task.type === 'dream'
  )
}

// registerDreamTask 封装DreamTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerDreamTask(
  setAppState: SetAppState,
  opts: {
    sessionsReviewing: number
    priorMtime: number
    abortController: AbortController
  },
): string {
  // 标识符保存`generateTaskId`，供Dream Task后续处理使用。
  const id = generateTaskId('dream')
  // task 集中保存Dream Task要一起传递的字段。
  const task: DreamTaskState = {
    ...createTaskStateBase(id, 'dream', 'dreaming'),
    type: 'dream',
    status: 'running',
    phase: 'starting',
    sessionsReviewing: opts.sessionsReviewing,
    filesTouched: [],
    turns: [],
    abortController: opts.abortController,
    priorMtime: opts.priorMtime,
  }
  // 调用 registerTask，触发Dream Task此处需要的副作用。
  registerTask(task, setAppState)
  // 返回 `id`，作为Dream Task这次计算的结果。
  return id
}

// addDreamTurn 封装DreamTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addDreamTurn(
  taskId: string,
  turn: DreamTurn,
  touchedPaths: string[],
  setAppState: SetAppState,
): void {
  // 这个回调绑定到 updateTaskState<DreamTaskState>(taskId, setAppState, task => {，负责Dream Task在该局部场景下的响应。
  updateTaskState<DreamTaskState>(taskId, setAppState, task => {
    // seen保存`Set`，供Dream Task后续处理使用。
    const seen = new Set(task.filesTouched)
    // newTouched筛选`touchedPaths.filter`，供Dream Task后续处理使用。
    const newTouched = touchedPaths.filter(p => !seen.has(p) && seen.add(p))
    // Skip the update entirely if the turn is empty AND nothing new was
    // touched. Avoids re-rendering on pure no-ops.
    // Dream Task在这里进入条件判断，后续代码按实际状态分流。
    if (
      turn.text === '' &&
      turn.toolUseCount === 0 &&
      newTouched.length === 0
    ) {
      // 返回 `task`，作为Dream Task这次计算的结果。
      return task
    }
    // 返回结构化结果，集中表达Dream Task已经整理出的状态。
    return {
      ...task,
      phase: newTouched.length > 0 ? 'updating' : task.phase,
      filesTouched:
        newTouched.length > 0
          ? [...task.filesTouched, ...newTouched]
          : task.filesTouched,
      turns: task.turns.slice(-(MAX_TURNS - 1)).concat(turn),
    }
  })
}

// completeDreamTask 封装DreamTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function completeDreamTask(
  taskId: string,
  setAppState: SetAppState,
): void {
  // notified: true immediately — dream has no model-facing notification path
  // (it's UI-only), and eviction requires terminal + notified. The inline
  // appendSystemMessage completion note IS the user surface.
  // 这个回调绑定到 updateTaskState<DreamTaskState>(taskId, setAppState, task => ({，负责Dream Task在该局部场景下的响应。
  updateTaskState<DreamTaskState>(taskId, setAppState, task => ({
    ...task,
    status: 'completed',
    endTime: Date.now(),
    notified: true,
    abortController: undefined,
  }))
}

// failDreamTask 封装DreamTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function failDreamTask(taskId: string, setAppState: SetAppState): void {
  // 这个回调绑定到 updateTaskState<DreamTaskState>(taskId, setAppState, task => ({，负责Dream Task在该局部场景下的响应。
  updateTaskState<DreamTaskState>(taskId, setAppState, task => ({
    ...task,
    status: 'failed',
    endTime: Date.now(),
    notified: true,
    abortController: undefined,
  }))
}

// DreamTask 集中保存Dream Task要一起传递的字段。
export const DreamTask: Task = {
  name: 'DreamTask',
  type: 'dream',

  // kill 使用 taskId, setAppState 完成Dream Task里的对应操作。
  async kill(taskId, setAppState) {
    // priorMtime 先占位，稍后的条件分支会根据实际输入补齐它。
    let priorMtime: number | undefined
    // 这个回调绑定到 updateTaskState<DreamTaskState>(taskId, setAppState, task => {，负责Dream Task在该局部场景下的响应。
    updateTaskState<DreamTaskState>(taskId, setAppState, task => {
      // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
      if (task.status !== 'running') return task
      // 调用 task.abortController?.abort()，完成这一处局部操作。
      task.abortController?.abort()
      // priorMtime更新为 `task.priorMtime`，确保DreamTask后续读取最新状态。
      priorMtime = task.priorMtime
      // 返回结构化结果，集中表达Dream Task已经整理出的状态。
      return {
        ...task,
        status: 'killed',
        endTime: Date.now(),
        notified: true,
        abortController: undefined,
      }
    })
    // Rewind the lock mtime so the next session can retry. Same path as the
    // fork-failure catch in autoDream.ts. If updateTaskState was a no-op
    // (already terminal), priorMtime stays undefined and we skip.
    // `priorMtime` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (priorMtime !== undefined) {
      // 等待 `rollbackConsolidationLock(priorMtime)` 完成，再继续Dream Task的异步流程。
      await rollbackConsolidationLock(priorMtime)
    }
  },
}
