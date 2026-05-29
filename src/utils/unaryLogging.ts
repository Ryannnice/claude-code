// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'

// CompletionType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompletionType =
  | 'str_replace_single'
  | 'str_replace_multi'
  | 'write_file_single'
  | 'tool_use_single'

// LogEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LogEvent = {
  completion_type: CompletionType
  event: 'accept' | 'reject' | 'response'
  metadata: {
    language_name: string | Promise<string>
    message_id: string
    platform: string
    hasFeedback?: boolean
  }
}

// logUnaryEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logUnaryEvent(event: LogEvent): Promise<void> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_unary_event', {
    event:
      event.event as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    completion_type:
      event.completion_type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    language_name: (await event.metadata
      .language_name) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    message_id: event.metadata
      .message_id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    platform: event.metadata
      .platform as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(event.metadata.hasFeedback !== undefined && {
      hasFeedback: event.metadata.hasFeedback,
    }),
  })
}
