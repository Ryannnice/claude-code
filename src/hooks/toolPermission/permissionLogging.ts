// Centralized analytics/telemetry logging for tool permission decisions.
// All permission approve/reject events flow through logPermissionDecision(),
// which fans out to Statsig analytics, OTel telemetry, and code-edit metrics.
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 src/services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from 'src/services/analytics/metadata.js'
// 引入 getCodeEditToolDecisionCounter，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getCodeEditToolDecisionCounter } from '../../bootstrap/state.js'
// 类型依赖 { Tool as ToolType, ToolUseContext } 来自 ../../Tool.js，用于校准React hook 状态流的数据契约。
import type { Tool as ToolType, ToolUseContext } from '../../Tool.js'
// 复用 getLanguageName 工具函数，把通用处理留在 ../../utils/cliHighlight.js 中维护。
import { getLanguageName } from '../../utils/cliHighlight.js'
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js'
// 复用 logOTelEvent 工具函数，把通用处理留在 ../../utils/telemetry/events.js 中维护。
import { logOTelEvent } from '../../utils/telemetry/events.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  PermissionApprovalSource,
  PermissionRejectionSource,
} from './PermissionContext.js'

// PermissionLogContext 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionLogContext = {
  tool: ToolType
  input: unknown
  toolUseContext: ToolUseContext
  messageId: string
  toolUseID: string
}

// Discriminated union: 'accept' pairs with approval sources, 'reject' with rejection sources
// PermissionDecisionArgs 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionDecisionArgs =
  | { decision: 'accept'; source: PermissionApprovalSource | 'config' }
  | { decision: 'reject'; source: PermissionRejectionSource | 'config' }

// CODE_EDITING_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const CODE_EDITING_TOOLS = ['Edit', 'Write', 'NotebookEdit']

// isCodeEditingTool 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCodeEditingTool(toolName: string): boolean {
  // 返回 `CODE_EDITING_TOOLS.includes(toolName)`，作为React hook 状态流这次计算的结果。
  return CODE_EDITING_TOOLS.includes(toolName)
}

// Builds OTel counter attributes for code editing tools, enriching with
// language when the tool's target file path can be extracted from input
// buildCodeEditToolAttributes 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildCodeEditToolAttributes(
  tool: ToolType,
  input: unknown,
  decision: 'accept' | 'reject',
  source: string,
): Promise<Record<string, string>> {
  // Derive language from file path if the tool exposes one (e.g., Edit, Write)
  // language 先占位，稍后的条件分支会根据实际输入补齐它。
  let language: string | undefined
  // 组合条件 `tool.getPath && input` 成立时，React hook 状态流才启用这条专门路径。
  if (tool.getPath && input) {
    // parseResult保存`inputSchema.safeParse`，供React hook后续处理使用。
    const parseResult = tool.inputSchema.safeParse(input)
    // 满足 `parseResult.success` 时，React hook执行该分支。
    if (parseResult.success) {
      // 文件路径读取`tool.getPath`，供React hook后续处理使用。
      const filePath = tool.getPath(parseResult.data)
      // 满足 `filePath` 时，React hook执行该分支。
      if (filePath) {
        // language更新为 `await getLanguageName(filePath)`，确保permissionLogging后续读取最新状态。
        language = await getLanguageName(filePath)
      }
    }
  }

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    decision,
    source,
    tool_name: tool.name,
    ...(language && { language }),
  }
}

// Flattens structured source into a string label for analytics/OTel events
// sourceToString 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sourceToString(
  source: PermissionApprovalSource | PermissionRejectionSource,
): string {
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) &&
    source.type === 'classifier'
  ) {
    // 返回 `'classifier'`，作为React hook 状态流这次计算的结果。
    return 'classifier'
  }
  // 按照 source.type 的取值选择React hook 状态流的具体处理分支。
  switch (source.type) {
    case 'hook':
      // 返回 `'hook'`，作为React hook 状态流这次计算的结果。
      return 'hook'
    case 'user':
      // 返回 `source.permanent ? 'user_permanent' : 'user_temporary'`，作为React hook 状态流这次计算的结果。
      return source.permanent ? 'user_permanent' : 'user_temporary'
    case 'user_abort':
      // 返回 `'user_abort'`，作为React hook 状态流这次计算的结果。
      return 'user_abort'
    case 'user_reject':
      // 返回 `'user_reject'`，作为React hook 状态流这次计算的结果。
      return 'user_reject'
    default:
      // 返回 `'unknown'`，作为React hook 状态流这次计算的结果。
      return 'unknown'
  }
}

// baseMetadata 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function baseMetadata(
  messageId: string,
  toolName: string,
  waitMs: number | undefined,
): { [key: string]: boolean | number | undefined } {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    messageID:
      messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    toolName: sanitizeToolNameForAnalytics(toolName),
    sandboxEnabled: SandboxManager.isSandboxingEnabled(),
    // Only include wait time when the user was actually prompted (not auto-approved)
    ...(waitMs !== undefined && { waiting_for_user_permission_ms: waitMs }),
  }
}

// Emits a distinct analytics event name per approval source for funnel analysis
// logApprovalEvent 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logApprovalEvent(
  tool: ToolType,
  messageId: string,
  source: PermissionApprovalSource | 'config',
  waitMs: number | undefined,
): void {
  // 当 `source` 匹配 `'config'` 时，React hook执行对应分支。
  if (source === 'config') {
    // Auto-approved by allowlist in settings -- no user wait time
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent(
      'tengu_tool_use_granted_in_config',
      baseMetadata(messageId, tool.name, undefined),
    )
    // React hook permission Logging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) &&
    source.type === 'classifier'
  ) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent(
      'tengu_tool_use_granted_by_classifier',
      baseMetadata(messageId, tool.name, waitMs),
    )
    // React hook permission Logging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 按照 source.type 的取值选择React hook 状态流的具体处理分支。
  switch (source.type) {
    case 'user':
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent(
        source.permanent
          ? 'tengu_tool_use_granted_in_prompt_permanent'
          : 'tengu_tool_use_granted_in_prompt_temporary',
        baseMetadata(messageId, tool.name, waitMs),
      )
      // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
      break
    case 'hook':
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_granted_by_permission_hook', {
        ...baseMetadata(messageId, tool.name, waitMs),
        permanent: source.permanent ?? false,
      })
      // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
      break
    default:
      // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
      break
  }
}

// Rejections share a single event name, differentiated by metadata fields
// logRejectionEvent 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logRejectionEvent(
  tool: ToolType,
  messageId: string,
  source: PermissionRejectionSource | 'config',
  waitMs: number | undefined,
): void {
  // 当 `source` 匹配 `'config'` 时，React hook执行对应分支。
  if (source === 'config') {
    // Denied by denylist in settings
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent(
      'tengu_tool_use_denied_in_config',
      baseMetadata(messageId, tool.name, undefined),
    )
    // React hook permission Logging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_tool_use_rejected_in_prompt', {
    ...baseMetadata(messageId, tool.name, waitMs),
    // Distinguish hook rejections from user rejections via separate fields
    ...(source.type === 'hook'
      ? { isHook: true }
      : {
          hasFeedback:
            source.type === 'user_reject' ? source.hasFeedback : false,
        }),
  })
}

// Single entry point for all permission decision logging. Called by permission
// handlers after every approve/reject. Fans out to: analytics events, OTel
// telemetry, code-edit OTel counters, and toolUseContext decision storage.
// logPermissionDecision 封装permissionLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logPermissionDecision(
  ctx: PermissionLogContext,
  args: PermissionDecisionArgs,
  permissionPromptStartTimeMs?: number,
): void {
  // 从 `ctx` 解构 tool、input、toolUseContext、messageId，减少React hook permission Logging对同一对象的重复访问。
  const { tool, input, toolUseContext, messageId, toolUseID } = ctx
  // 从 `args` 解构 decision、source，减少React hook permission Logging对同一对象的重复访问。
  const { decision, source } = args

  // waiting_for_user_permission_ms 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const waiting_for_user_permission_ms =
    permissionPromptStartTimeMs !== undefined
      ? Date.now() - permissionPromptStartTimeMs
      : undefined

  // Log the analytics event
  // 当 `args.decision` 匹配 `'accept'` 时，React hook执行对应分支。
  if (args.decision === 'accept') {
    // 调用 logApprovalEvent，触发React hook此处需要的副作用。
    logApprovalEvent(
      tool,
      messageId,
      args.source,
      waiting_for_user_permission_ms,
    )
  } else {
    // 调用 logRejectionEvent，触发React hook此处需要的副作用。
    logRejectionEvent(
      tool,
      messageId,
      args.source,
      waiting_for_user_permission_ms,
    )
  }

  // sourceString保存`sourceToString`，供React hook后续处理使用。
  const sourceString = source === 'config' ? 'config' : sourceToString(source)

  // Track code editing tool metrics
  // 满足 `isCodeEditingTool(tool.name)` 时，React hook执行该分支。
  if (isCodeEditingTool(tool.name)) {
    // 显式忽略 `buildCodeEditToolAttributes(tool, input, decision, sourceString...` 的返回值，只保留它触发的副作用。
    void buildCodeEditToolAttributes(tool, input, decision, sourceString).then(
      // attributes 集合更新为 `> getCodeEditToolDecisionCounter()?.add(1, attributes)`，确保permissionLogging后续读取最新状态。
      attributes => getCodeEditToolDecisionCounter()?.add(1, attributes),
    )
  }

  // Persist decision on the context so downstream code can inspect what happened
  // toolUseContext.toolDecisions 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!toolUseContext.toolDecisions) {
    // toolDecisions 集合更新为 `new Map()`，确保permissionLogging后续读取最新状态。
    toolUseContext.toolDecisions = new Map()
  }
  // toolUseContext.toolDecisions.set 写入新的状态值，使React hook 状态流后续读取保持一致。
  toolUseContext.toolDecisions.set(toolUseID, {
    source: sourceString,
    decision,
    timestamp: Date.now(),
  })

  // 显式忽略 `logOTelEvent('tool_decision', {` 的返回值，只保留它触发的副作用。
  void logOTelEvent('tool_decision', {
    decision,
    source: sourceString,
    tool_name: sanitizeToolNameForAnalytics(tool.name),
  })
}

// 重新导出这一组成员，让React hook 状态流的公共 API 保持集中入口。
export { isCodeEditingTool, buildCodeEditToolAttributes, logPermissionDecision }
// 导出类型定义，让其他模块沿用React hook permission Logging的数据契约。
export type { PermissionLogContext, PermissionDecisionArgs }
