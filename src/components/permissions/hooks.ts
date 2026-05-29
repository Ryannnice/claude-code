// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 src/services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from 'src/services/analytics/metadata.js'
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from 'src/tools/BashTool/BashTool.js'
// 复用 splitCommand_DEPRECATED 工具函数，把通用处理留在 src/utils/bash/commands.js 中维护。
import { splitCommand_DEPRECATED } from 'src/utils/bash/commands.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecisionReason,
  PermissionResult,
} from 'src/utils/permissions/PermissionResult.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  extractRules,
  hasRules,
} from 'src/utils/permissions/PermissionUpdate.js'
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 src/utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from 'src/utils/permissions/permissionRuleParser.js'
// 复用 SandboxManager 工具函数，把通用处理留在 src/utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from 'src/utils/sandbox/sandbox-adapter.js'
// 类型依赖 { ToolUseConfirm } 来自 ../../components/permissions/PermissionRequest.js，用于校准终端渲染的数据契约。
import type { ToolUseConfirm } from '../../components/permissions/PermissionRequest.js'
// 引入 useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from '../../state/AppState.js'
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 CompletionType、logUnaryEvent 工具函数，把通用处理留在 ../../utils/unaryLogging.js 中维护。
import { type CompletionType, logUnaryEvent } from '../../utils/unaryLogging.js'

// UnaryEvent 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UnaryEvent = {
  completion_type: CompletionType
  language_name: string | Promise<string>
}

// permissionResultToLog 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function permissionResultToLog(permissionResult: PermissionResult): string {
  // 按照 permissionResult.behavior 的取值选择终端渲染的具体处理分支。
  switch (permissionResult.behavior) {
    case 'allow':
      // 返回 `'allow'`，作为终端渲染这次计算的结果。
      return 'allow'
    case 'ask': {
      // rules 集合保存`extractRules`，供终端渲染后续处理使用。
      const rules = extractRules(permissionResult.suggestions)
      // suggestions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const suggestions =
        rules.length > 0
          // 这个回调绑定到 ? rules.map(r => permissionRuleValueToString(r)).join(', ')，负责终端渲染在该局部场景下的响应。
          ? rules.map(r => permissionRuleValueToString(r)).join(', ')
          : 'none'
      // 返回 ``ask: ${permissionResult.message}`，作为终端渲染这次计算的结果。
      return `ask: ${permissionResult.message}, 
suggestions: ${suggestions}
reason: ${decisionReasonToString(permissionResult.decisionReason)}`
    }
    case 'deny':
      // 返回 ``deny: ${permissionResult.message}`，作为终端渲染这次计算的结果。
      return `deny: ${permissionResult.message},
reason: ${decisionReasonToString(permissionResult.decisionReason)}`
    case 'passthrough': {
      // rules 集合保存`extractRules`，供终端渲染后续处理使用。
      const rules = extractRules(permissionResult.suggestions)
      // suggestions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const suggestions =
        rules.length > 0
          // 这个回调绑定到 ? rules.map(r => permissionRuleValueToString(r)).join(', ')，负责终端渲染在该局部场景下的响应。
          ? rules.map(r => permissionRuleValueToString(r)).join(', ')
          : 'none'
      // 返回 ``passthrough: ${permissionResult.message}`，作为终端渲染这次计算的结果。
      return `passthrough: ${permissionResult.message},
suggestions: ${suggestions}
reason: ${decisionReasonToString(permissionResult.decisionReason)}`
    }
  }
}

// decisionReasonToString 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function decisionReasonToString(
  decisionReason: PermissionDecisionReason | undefined,
): string {
  // 决策原因缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!decisionReason) {
    // 返回 `'No decision reason'`，作为终端渲染这次计算的结果。
    return 'No decision reason'
  }
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    (feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) &&
    decisionReason.type === 'classifier'
  ) {
    // 返回 ``Classifier: ${decisionReason.classifier}, Reason: ${decisionReason.rea...`，作为终端渲染这次计算的结果。
    return `Classifier: ${decisionReason.classifier}, Reason: ${decisionReason.reason}`
  }
  // 按照 decisionReason.type 的取值选择终端渲染的具体处理分支。
  switch (decisionReason.type) {
    case 'rule':
      // 返回 ``Rule: ${permissionRuleValueToString(decisionReason.rule.ruleValue)}``，作为终端渲染这次计算的结果。
      return `Rule: ${permissionRuleValueToString(decisionReason.rule.ruleValue)}`
    case 'mode':
      // 返回 ``Mode: ${decisionReason.mode}``，作为终端渲染这次计算的结果。
      return `Mode: ${decisionReason.mode}`
    case 'subcommandResults':
      // 返回 ``Subcommand Results: ${Array.from(decisionReason.reasons.entries())`，作为终端渲染这次计算的结果。
      return `Subcommand Results: ${Array.from(decisionReason.reasons.entries())
        .map(([key, value]) => `${key}: ${permissionResultToLog(value)}`)
        .join(', \n')}`
    case 'permissionPromptTool':
      // 返回 ``Permission Tool: ${decisionReason.permissionPromptToolName}, Result: $...`，作为终端渲染这次计算的结果。
      return `Permission Tool: ${decisionReason.permissionPromptToolName}, Result: ${jsonStringify(decisionReason.toolResult)}`
    case 'hook':
      // 返回 ``Hook: ${decisionReason.hookName}${decisionReason.reason ? `, Reason: $...`，作为终端渲染这次计算的结果。
      return `Hook: ${decisionReason.hookName}${decisionReason.reason ? `, Reason: ${decisionReason.reason}` : ''}`
    case 'workingDir':
      // 返回 ``Working Directory: ${decisionReason.reason}``，作为终端渲染这次计算的结果。
      return `Working Directory: ${decisionReason.reason}`
    case 'safetyCheck':
      // 返回 ``Safety check: ${decisionReason.reason}``，作为终端渲染这次计算的结果。
      return `Safety check: ${decisionReason.reason}`
    case 'other':
      // 返回 ``Other: ${decisionReason.reason}``，作为终端渲染这次计算的结果。
      return `Other: ${decisionReason.reason}`
    default:
      // 返回 `jsonStringify(decisionReason, null, 2)`，作为终端渲染这次计算的结果。
      return jsonStringify(decisionReason, null, 2)
  }
}

/**
 * Logs permission request events using analytics and unary logging.
 * Handles both the analytics event and the unary event logging.
 */
// usePermissionRequestLogging 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePermissionRequestLogging(
  toolUseConfirm: ToolUseConfirm,
  unaryEvent: UnaryEvent,
): void {
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState()
  // Guard against effect re-firing if toolUseConfirm's object reference
  // changes during a single dialog's lifetime (e.g., parent re-renders with a
  // fresh object). Without this, the unconditional setAppState below can
  // cascade into an infinite microtask loop — each re-fire does another
  // setAppState spread + (ant builds) splitCommand → shell-quote regex,
  // pegging CPU at 100% and leaking ~500MB/min in JSRopeString/RegExp allocs.
  // The component is keyed by toolUseID, so this ref resets on remount —
  // we only need to dedupe re-fires WITHIN one dialog instance.
  // loggedToolUseID读取 hook 状态，供终端渲染权限确认界面 hooks本轮渲染使用。
  const loggedToolUseID = useRef<string | null>(null)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `loggedToolUseID.current === toolUseConfirm.toolUs` 时，终端渲染执行该分支。
    if (loggedToolUseID.current === toolUseConfirm.toolUseID) {
      // 权限确认界面 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // current更新为 `toolUseConfirm.toolUseID`，确保权限确认界面后续读取最新状态。
    loggedToolUseID.current = toolUseConfirm.toolUseID

    // Increment permission prompt count for attribution tracking
    // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      attribution: {
        ...prev.attribution,
        permissionPromptCount: prev.attribution.permissionPromptCount + 1,
      },
    }))

    // Log analytics event
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_show_permission_request', {
      messageID: toolUseConfirm.assistantMessage.message
        .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizeToolNameForAnalytics(toolUseConfirm.tool.name),
      isMcp: toolUseConfirm.tool.isMcp ?? false,
      decisionReasonType: toolUseConfirm.permissionResult.decisionReason
        ?.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      sandboxEnabled: SandboxManager.isSandboxingEnabled(),
    })

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，终端渲染执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 权限判断结果保存`toolUseConfirm.permissionResult`，供后续判断或组装使用。
      const permissionResult = toolUseConfirm.permissionResult
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        toolUseConfirm.tool.name === BashTool.name &&
        permissionResult.behavior === 'ask' &&
        !hasRules(permissionResult.suggestions)
      ) {
        // Log if no rule suggestions ("always allow") are provided
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_internal_tool_use_permission_request_no_always_allow', {
          messageID: toolUseConfirm.assistantMessage.message
            .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toolName: sanitizeToolNameForAnalytics(toolUseConfirm.tool.name),
          isMcp: toolUseConfirm.tool.isMcp ?? false,
          decisionReasonType: (permissionResult.decisionReason?.type ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          sandboxEnabled: SandboxManager.isSandboxingEnabled(),

          // This DOES contain code/filepaths and should not be logged in the public build!
          decisionReasonDetails: decisionReasonToString(
            permissionResult.decisionReason,
          ) as never,
        })
      }
    }

    // [ANT-ONLY] Log bash tool calls, so we can categorize
    // & burn down calls that should have been allowed
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，终端渲染执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // parsedInput保存`inputSchema.safeParse`，供终端渲染后续处理使用。
      const parsedInput = BashTool.inputSchema.safeParse(toolUseConfirm.input)
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        toolUseConfirm.tool.name === BashTool.name &&
        toolUseConfirm.permissionResult.behavior === 'ask' &&
        parsedInput.success
      ) {
        // Note: All metadata fields in this event contain code/filepaths
        // split 聚合成有序列表，保持后续遍历顺序稳定。
        let split = [parsedInput.data.command]
        // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
        try {
          // split更新为 `splitCommand_DEPRECATED(parsedInput.data.command)`，确保权限确认界面后续读取最新状态。
          split = splitCommand_DEPRECATED(parsedInput.data.command)
        } catch {
          // Ignore parse errors here - just log the full command
        }
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_internal_bash_tool_use_permission_request', {
          parts: jsonStringify(
            split,
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          input: jsonStringify(
            toolUseConfirm.input,
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          decisionReasonType: toolUseConfirm.permissionResult.decisionReason
            ?.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          decisionReason: decisionReasonToString(
            toolUseConfirm.permissionResult.decisionReason,
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
      }
    }

    // 显式忽略 `logUnaryEvent({` 的返回值，只保留它触发的副作用。
    void logUnaryEvent({
      completion_type: unaryEvent.completion_type,
      event: 'response',
      metadata: {
        language_name: unaryEvent.language_name,
        message_id: toolUseConfirm.assistantMessage.message.id,
        platform: env.platform,
      },
    })
  }, [toolUseConfirm, unaryEvent, setAppState])
}
