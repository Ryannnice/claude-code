// 复用 getHostPlatformForAnalytics 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { getHostPlatformForAnalytics } from '../../utils/env.js'
// 复用 CompletionType、logUnaryEvent 工具函数，把通用处理留在 ../../utils/unaryLogging.js 中维护。
import { type CompletionType, logUnaryEvent } from '../../utils/unaryLogging.js'
// 类型依赖 { ToolUseConfirm } 来自 ./PermissionRequest.js，用于校准终端渲染的数据契约。
import type { ToolUseConfirm } from './PermissionRequest.js'

// logUnaryPermissionEvent 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logUnaryPermissionEvent(
  completion_type: CompletionType,
  {
    assistantMessage: {
      message: { id: message_id },
    },
  }: ToolUseConfirm,
  event: 'accept' | 'reject',
  hasFeedback?: boolean,
): void {
  // 显式忽略 `logUnaryEvent({` 的返回值，只保留它触发的副作用。
  void logUnaryEvent({
    completion_type,
    event,
    metadata: {
      language_name: 'none',
      message_id,
      platform: getHostPlatformForAnalytics(),
      hasFeedback: hasFeedback ?? false,
    },
  })
}
