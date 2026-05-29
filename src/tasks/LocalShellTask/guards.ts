// Pure type + type guard for LocalShellTask state.
// Extracted from LocalShellTask.tsx so non-React consumers (stopTask.ts via
// print.ts) don't pull React/ink into the module graph.

// 类型依赖 { TaskStateBase } 来自 ../../Task.js，用于校准guards的数据契约。
import type { TaskStateBase } from '../../Task.js'
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准guards的数据契约。
import type { AgentId } from '../../types/ids.js'
// 类型依赖 { ShellCommand } 来自 ../../utils/ShellCommand.js，用于校准guards的数据契约。
import type { ShellCommand } from '../../utils/ShellCommand.js'

// BashTaskKind 固化guards里传递的数据形状，帮助调用方按同一结构读写字段。
export type BashTaskKind = 'bash' | 'monitor'

// LocalShellTaskState 固化guards里传递的数据形状，帮助调用方按同一结构读写字段。
export type LocalShellTaskState = TaskStateBase & {
  type: 'local_bash' // Keep as 'local_bash' for backward compatibility with persisted session state
  command: string
  result?: {
    code: number
    interrupted: boolean
  }
  completionStatusSentInAttachment: boolean
  shellCommand: ShellCommand | null
  // 这个回调绑定到 unregisterCleanup?: () => void，负责guards在该局部场景下的响应。
  unregisterCleanup?: () => void
  cleanupTimeoutId?: NodeJS.Timeout
  // Track what we last reported for computing deltas (total lines from TaskOutput)
  lastReportedTotalLines: number
  // Whether the task has been backgrounded (false = foreground running, true = backgrounded)
  isBackgrounded: boolean
  // Agent that spawned this task. Used to kill orphaned bash tasks when the
  // agent exits (see killShellTasksForAgent). Undefined = main thread.
  agentId?: AgentId
  // UI display variant. 'monitor' → shows description instead of command,
  // 'Monitor details' dialog title, distinct status bar pill.
  kind?: BashTaskKind
}

// isLocalShellTask 封装guards的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLocalShellTask(task: unknown): task is LocalShellTaskState {
  // 返回 `(`，作为guards这次计算的结果。
  return (
    typeof task === 'object' &&
    task !== null &&
    'type' in task &&
    task.type === 'local_bash'
  )
}
