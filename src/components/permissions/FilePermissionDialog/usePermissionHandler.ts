// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../../services/analytics/metadata.js'
// 类型依赖 { ToolPermissionContext } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { ToolPermissionContext } from '../../../Tool.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_FOLDER_PERMISSION_PATTERN,
  FILE_EDIT_TOOL_NAME,
  GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN,
} from '../../../tools/FileEditTool/constants.js'
// 复用 env 工具函数，把通用处理留在 ../../../utils/env.js 中维护。
import { env } from '../../../utils/env.js'
// 复用 generateSuggestions 工具函数，把通用处理留在 ../../../utils/permissions/filesystem.js 中维护。
import { generateSuggestions } from '../../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type CompletionType,
  logUnaryEvent,
} from '../../../utils/unaryLogging.js'
// 类型依赖 { ToolUseConfirm } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { ToolUseConfirm } from '../PermissionRequest.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import type {
  FileOperationType,
  PermissionOption,
} from './permissionOptions.js'

// logPermissionEvent 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logPermissionEvent(
  event: 'accept' | 'reject',
  completionType: CompletionType,
  languageName: string | Promise<string>,
  messageId: string,
  hasFeedback?: boolean,
): void {
  // 显式忽略 `logUnaryEvent({` 的返回值，只保留它触发的副作用。
  void logUnaryEvent({
    completion_type: completionType,
    event,
    metadata: {
      language_name: languageName,
      message_id: messageId,
      platform: env.platform,
      hasFeedback: hasFeedback ?? false,
    },
  })
}

// PermissionHandlerParams 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionHandlerParams = {
  messageId: string
  path: string | null
  toolUseConfirm: ToolUseConfirm
  toolPermissionContext: ToolPermissionContext
  // 这个回调绑定到 onDone: () => void，负责终端渲染在该局部场景下的响应。
  onDone: () => void
  // 这个回调绑定到 onReject: () => void，负责终端渲染在该局部场景下的响应。
  onReject: () => void
  completionType: CompletionType
  languageName: string | Promise<string>
  operationType: FileOperationType
}

// PermissionHandlerOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionHandlerOptions = {
  hasFeedback?: boolean
  feedback?: string
  enteredFeedbackMode?: boolean
  scope?: 'claude-folder' | 'global-claude-folder'
}

// handleAcceptOnce 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleAcceptOnce(
  params: PermissionHandlerParams,
  options?: PermissionHandlerOptions,
): void {
  // 权限确认界面 use Permission Handler先整理这一处局部数据，后续分支可以直接读取。
  const { messageId, toolUseConfirm, onDone, completionType, languageName } =
    params

  // 调用 logPermissionEvent，触发终端渲染此处需要的副作用。
  logPermissionEvent('accept', completionType, languageName, messageId)

  // Log accept submission with feedback context
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_accept_submitted', {
    toolName: sanitizeToolNameForAnalytics(
      toolUseConfirm.tool.name,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    isMcp: toolUseConfirm.tool.isMcp ?? false,
    has_instructions: !!options?.feedback,
    instructions_length: options?.feedback?.length ?? 0,
    entered_feedback_mode: options?.enteredFeedbackMode ?? false,
  })

  // 调用 onDone，触发终端渲染此处需要的副作用。
  onDone()
  // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
  toolUseConfirm.onAllow(toolUseConfirm.input, [], options?.feedback)
}

// handleAcceptSession 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleAcceptSession(
  params: PermissionHandlerParams,
  options?: PermissionHandlerOptions,
): void {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messageId,
    path,
    toolUseConfirm,
    toolPermissionContext,
    onDone,
    completionType,
    languageName,
    operationType,
  } = params

  // 调用 logPermissionEvent，触发终端渲染此处需要的副作用。
  logPermissionEvent('accept', completionType, languageName, messageId)

  // For claude-folder scope, grant session-level access to all .claude/ files
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    options?.scope === 'claude-folder' ||
    options?.scope === 'global-claude-folder'
  ) {
    // pattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const pattern =
      options.scope === 'global-claude-folder'
        ? GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN
        : CLAUDE_FOLDER_PERMISSION_PATTERN
    // suggestions 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const suggestions: PermissionUpdate[] = [
      {
        type: 'addRules',
        rules: [
          {
            toolName: FILE_EDIT_TOOL_NAME,
            ruleContent: pattern,
          },
        ],
        behavior: 'allow',
        destination: 'session',
      },
    ]
    // 调用 onDone，触发终端渲染此处需要的副作用。
    onDone()
    // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
    toolUseConfirm.onAllow(toolUseConfirm.input, suggestions)
    // 权限确认界面 use Permission Handler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Generate permission updates if path is provided
  // suggestions 集合保存`path`，供后续判断或组装使用。
  const suggestions = path
    ? generateSuggestions(path, operationType, toolPermissionContext)
    : []

  // 调用 onDone，触发终端渲染此处需要的副作用。
  onDone()
  // Pass permission updates directly to onAllow
  // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
  toolUseConfirm.onAllow(toolUseConfirm.input, suggestions)
}

// handleReject 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleReject(
  params: PermissionHandlerParams,
  options?: PermissionHandlerOptions,
): void {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messageId,
    toolUseConfirm,
    onDone,
    onReject,
    completionType,
    languageName,
  } = params

  // 调用 logPermissionEvent，触发终端渲染此处需要的副作用。
  logPermissionEvent(
    'reject',
    completionType,
    languageName,
    messageId,
    options?.hasFeedback,
  )

  // Log reject submission with feedback context
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_reject_submitted', {
    toolName: sanitizeToolNameForAnalytics(
      toolUseConfirm.tool.name,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    isMcp: toolUseConfirm.tool.isMcp ?? false,
    has_instructions: !!options?.feedback,
    instructions_length: options?.feedback?.length ?? 0,
    entered_feedback_mode: options?.enteredFeedbackMode ?? false,
  })

  // 调用 onDone，触发终端渲染此处需要的副作用。
  onDone()
  // 调用 onReject，触发终端渲染此处需要的副作用。
  onReject()
  // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
  toolUseConfirm.onReject(options?.feedback)
}

// PERMISSION_HANDLERS 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const PERMISSION_HANDLERS: Record<
  PermissionOption['type'],
  // 这个回调绑定到 (params: PermissionHandlerParams, options?: PermissionHandlerOptions) => void，负责终端渲染在该局部场景下的响应。
  (params: PermissionHandlerParams, options?: PermissionHandlerOptions) => void
> = {
  'accept-once': handleAcceptOnce,
  'accept-session': handleAcceptSession,
  reject: handleReject,
}
