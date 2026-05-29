// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 类型依赖 { AppState } 来自 ./state/AppState.js，用于校准Task的数据契约。
import type { AppState } from './state/AppState.js'
// 类型依赖 { AgentId } 来自 ./types/ids.js，用于校准Task的数据契约。
import type { AgentId } from './types/ids.js'
// 复用 getTaskOutputPath 工具函数，把通用处理留在 ./utils/task/diskOutput.js 中维护。
import { getTaskOutputPath } from './utils/task/diskOutput.js'

// TaskType 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskType =
  | 'local_bash'
  | 'local_agent'
  | 'remote_agent'
  | 'in_process_teammate'
  | 'local_workflow'
  | 'monitor_mcp'
  | 'dream'

// TaskStatus 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'killed'

/**
 * True when a task is in a terminal state and will not transition further.
 * Used to guard against injecting messages into dead teammates, evicting
 * finished tasks from AppState, and orphan-cleanup paths.
 */
// isTerminalTaskStatus 封装Task的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  // 返回 `status === 'completed' || status === 'failed' || status === 'killed'`，作为Task这次计算的结果。
  return status === 'completed' || status === 'failed' || status === 'killed'
}

// TaskHandle 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskHandle = {
  taskId: string
  cleanup?: () => void
}

// SetAppState 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetAppState = (f: (prev: AppState) => AppState) => void

// TaskContext 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskContext = {
  abortController: AbortController
  // 这个回调绑定到 getAppState: () => AppState，负责Task在该局部场景下的响应。
  getAppState: () => AppState
  setAppState: SetAppState
}

// Base fields shared by all task states
// TaskStateBase 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskStateBase = {
  id: string
  type: TaskType
  status: TaskStatus
  description: string
  toolUseId?: string
  startTime: number
  endTime?: number
  totalPausedMs?: number
  outputFile: string
  outputOffset: number
  notified: boolean
}

// LocalShellSpawnInput 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type LocalShellSpawnInput = {
  command: string
  description: string
  timeout?: number
  toolUseId?: string
  agentId?: AgentId
  /** UI display variant: description-as-label, dialog title, status bar pill. */
  kind?: 'bash' | 'monitor'
}

// What getTaskByType dispatches for: kill. spawn/render were never
// called polymorphically (removed in #22546). All six kill implementations
// use only setAppState — getAppState/abortController were dead weight.
// Task 固化Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type Task = {
  name: string
  type: TaskType
  kill(taskId: string, setAppState: SetAppState): Promise<void>
}

// Task ID prefixes
// TASK_ID_PREFIXES 集合 集中保存Task要一起传递的字段。
const TASK_ID_PREFIXES: Record<string, string> = {
  local_bash: 'b', // Keep as 'b' for backward compatibility
  local_agent: 'a',
  remote_agent: 'r',
  in_process_teammate: 't',
  local_workflow: 'w',
  monitor_mcp: 'm',
  dream: 'd',
}

// Get task ID prefix
// getTaskIdPrefix 封装Task的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTaskIdPrefix(type: TaskType): string {
  // 返回 `TASK_ID_PREFIXES[type] ?? 'x'`，作为Task这次计算的结果。
  return TASK_ID_PREFIXES[type] ?? 'x'
}

// Case-insensitive-safe alphabet (digits + lowercase) for task IDs.
// 36^8 ≈ 2.8 trillion combinations, sufficient to resist brute-force symlink attacks.
// TASK_ID_ALPHABET保存`'0123456789abcdefghijklmnopqrstuvwxyz'`，作为后续固定文本处理的输入。
const TASK_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

// generateTaskId 封装Task的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateTaskId(type: TaskType): string {
  // prefix读取`getTaskIdPrefix`，供Task后续处理使用。
  const prefix = getTaskIdPrefix(type)
  // bytes 集合保存`randomBytes`，供Task后续处理使用。
  const bytes = randomBytes(8)
  // 标识符保存`prefix`，供Task后续判断或输出使用。
  let id = prefix
  // 按索引扫描 `8`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 8; i++) {
    // Task在这里处理 `id += TASK_ID_ALPHABET[bytes[i]! % TASK_ID_ALPHABET.length]`，完成这一小步状态转换。
    id += TASK_ID_ALPHABET[bytes[i]! % TASK_ID_ALPHABET.length]
  }
  // 返回 `id`，作为Task这次计算的结果。
  return id
}

// createTaskStateBase 封装Task的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createTaskStateBase(
  id: string,
  type: TaskType,
  description: string,
  toolUseId?: string,
): TaskStateBase {
  // 返回结构化结果，集中表达Task已经整理出的状态。
  return {
    id,
    type,
    status: 'pending',
    description,
    toolUseId,
    startTime: Date.now(),
    outputFile: getTaskOutputPath(id),
    outputOffset: 0,
    notified: false,
  }
}
