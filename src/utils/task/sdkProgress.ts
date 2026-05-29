// 类型依赖 { SdkWorkflowProgress } 来自 ../../types/tools.js，用于校准共享工具的数据契约。
import type { SdkWorkflowProgress } from '../../types/tools.js'
// 引入 enqueueSdkEvent，将 ../sdkEventQueue.js 中已经封装好的能力接到本文件流程里。
import { enqueueSdkEvent } from '../sdkEventQueue.js'

/**
 * Emit a `task_progress` SDK event. Shared by background agents (per tool_use
 * in runAsyncAgentLifecycle) and workflows (per flushProgress batch). Accepts
 * already-computed primitives so callers can derive them from their own state
 * shapes (ProgressTracker for agents, LocalWorkflowTaskState for workflows).
 */
// emitTaskProgress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitTaskProgress(params: {
  taskId: string
  toolUseId: string | undefined
  description: string
  startTime: number
  totalTokens: number
  toolUses: number
  lastToolName?: string
  summary?: string
  workflowProgress?: SdkWorkflowProgress[]
}): void {
  // 调用 enqueueSdkEvent，触发共享工具此处需要的副作用。
  enqueueSdkEvent({
    type: 'system',
    subtype: 'task_progress',
    task_id: params.taskId,
    tool_use_id: params.toolUseId,
    description: params.description,
    usage: {
      total_tokens: params.totalTokens,
      tool_uses: params.toolUses,
      duration_ms: Date.now() - params.startTime,
    },
    last_tool_name: params.lastToolName,
    summary: params.summary,
    workflow_progress: params.workflowProgress,
  })
}
