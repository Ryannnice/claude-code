// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * Hooks are user-defined shell commands that can be executed at various points
 * in Claude Code's lifecycle.
 */
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
// 引入 pathExists，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from './file.js'
// 引入 wrapSpawn，将 ./ShellCommand.js 中已经封装好的能力接到本文件流程里。
import { wrapSpawn } from './ShellCommand.js'
// 引入 TaskOutput，将 ./task/TaskOutput.js 中已经封装好的能力接到本文件流程里。
import { TaskOutput } from './task/TaskOutput.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 formatShellPrefixCommand，将 ./bash/shellPrefix.js 中已经封装好的能力接到本文件流程里。
import { formatShellPrefixCommand } from './bash/shellPrefix.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getHookEnvFilePath,
  invalidateSessionEnvCache,
} from './sessionEnvironment.js'
// 引入 subprocessEnv，将 ./subprocessEnv.js 中已经封装好的能力接到本文件流程里。
import { subprocessEnv } from './subprocessEnv.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 findGitBashPath、windowsPathToPosixPath，将 ./windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { findGitBashPath, windowsPathToPosixPath } from './windowsPaths.js'
// 引入 getCachedPowerShellPath，将 ./shell/powershellDetection.js 中已经封装好的能力接到本文件流程里。
import { getCachedPowerShellPath } from './shell/powershellDetection.js'
// 引入 DEFAULT_HOOK_SHELL，将 ./shell/shellProvider.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_HOOK_SHELL } from './shell/shellProvider.js'
// 引入 buildPowerShellArgs，将 ./shell/powershellProvider.js 中已经封装好的能力接到本文件流程里。
import { buildPowerShellArgs } from './shell/powershellProvider.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  loadPluginOptions,
  substituteUserConfigVariables,
} from './plugins/pluginOptionsStorage.js'
// 引入 getPluginDataDir，将 ./plugins/pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginDataDir } from './plugins/pluginDirectories.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSessionId,
  getProjectRoot,
  getIsNonInteractiveSession,
  getRegisteredHooks,
  getStatsStore,
  addToTurnHookDuration,
  getOriginalCwd,
  getMainThreadAgentType,
} from '../bootstrap/state.js'
// 引入 checkHasTrustDialogAccepted，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { checkHasTrustDialogAccepted } from './config.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getHooksConfigFromSnapshot,
  shouldAllowManagedHooksOnly,
  shouldDisableAllHooksIncludingManaged,
} from './hooks/hooksConfigSnapshot.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getTranscriptPathForSession,
  getAgentTranscriptPath,
} from './sessionStorage.js'
// 类型依赖 { AgentId } 来自 ../types/ids.js，用于校准共享工具的数据契约。
import type { AgentId } from '../types/ids.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from './settings/settings.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from 'src/services/analytics/index.js'
// 引入 logOTelEvent，将 ./telemetry/events.js 中已经封装好的能力接到本文件流程里。
import { logOTelEvent } from './telemetry/events.js'
// 引入 ALLOWED_OFFICIAL_MARKETPLACE_NAMES，将 ./plugins/schemas.js 中已经封装好的能力接到本文件流程里。
import { ALLOWED_OFFICIAL_MARKETPLACE_NAMES } from './plugins/schemas.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  startHookSpan,
  endHookSpan,
  isBetaTracingEnabled,
} from './telemetry/sessionTracing.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  hookJSONOutputSchema,
  promptRequestSchema,
  type HookCallback,
  type HookCallbackMatcher,
  type PromptRequest,
  type PromptResponse,
  isAsyncHookJSONOutput,
  isSyncHookJSONOutput,
  type PermissionRequestResult,
} from '../types/hooks.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  HookEvent,
  HookInput,
  HookJSONOutput,
  NotificationHookInput,
  PostToolUseHookInput,
  PostToolUseFailureHookInput,
  PermissionDeniedHookInput,
  PreCompactHookInput,
  PostCompactHookInput,
  PreToolUseHookInput,
  SessionStartHookInput,
  SessionEndHookInput,
  SetupHookInput,
  StopHookInput,
  StopFailureHookInput,
  SubagentStartHookInput,
  SubagentStopHookInput,
  TeammateIdleHookInput,
  TaskCreatedHookInput,
  TaskCompletedHookInput,
  ConfigChangeHookInput,
  CwdChangedHookInput,
  FileChangedHookInput,
  InstructionsLoadedHookInput,
  UserPromptSubmitHookInput,
  PermissionRequestHookInput,
  ElicitationHookInput,
  ElicitationResultHookInput,
  PermissionUpdate,
  ExitReason,
  SyncHookJSONOutput,
  AsyncHookJSONOutput,
} from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { StatusLineCommandInput } 来自 ../types/statusLine.js，用于校准共享工具的数据契约。
import type { StatusLineCommandInput } from '../types/statusLine.js'
// 类型依赖 { ElicitResult } 来自 @modelcontextprotocol/sdk/types.js，用于校准共享工具的数据契约。
import type { ElicitResult } from '@modelcontextprotocol/sdk/types.js'
// 类型依赖 { FileSuggestionCommandInput } 来自 ../types/fileSuggestion.js，用于校准共享工具的数据契约。
import type { FileSuggestionCommandInput } from '../types/fileSuggestion.js'
// 类型依赖 { HookResultMessage } 来自 src/types/message.js，用于校准共享工具的数据契约。
import type { HookResultMessage } from 'src/types/message.js'
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  HookMatcher,
  HookCommand,
  PluginHookMatcher,
  SkillHookMatcher,
} from './settings/types.js'
// 引入 getHookDisplayText，将 ./hooks/hooksSettings.js 中已经封装好的能力接到本文件流程里。
import { getHookDisplayText } from './hooks/hooksSettings.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 firstLineOf，将 ./stringUtils.js 中已经封装好的能力接到本文件流程里。
import { firstLineOf } from './stringUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  normalizeLegacyToolName,
  getLegacyToolNames,
  permissionRuleValueFromString,
} from './permissions/permissionRuleParser.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 createCombinedAbortSignal，将 ./combinedAbortSignal.js 中已经封装好的能力接到本文件流程里。
import { createCombinedAbortSignal } from './combinedAbortSignal.js'
// 类型依赖 { PermissionResult } 来自 ./permissions/PermissionResult.js，用于校准共享工具的数据契约。
import type { PermissionResult } from './permissions/PermissionResult.js'
// 引入 registerPendingAsyncHook，将 ./hooks/AsyncHookRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerPendingAsyncHook } from './hooks/AsyncHookRegistry.js'
// 引入 enqueuePendingNotification，将 ./messageQueueManager.js 中已经封装好的能力接到本文件流程里。
import { enqueuePendingNotification } from './messageQueueManager.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  extractTextContent,
  getLastAssistantMessage,
  wrapInSystemReminder,
} from './messages.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  emitHookStarted,
  emitHookResponse,
  startHookProgressInterval,
} from './hooks/hookEvents.js'
// 引入 createAttachmentMessage，将 ./attachments.js 中已经封装好的能力接到本文件流程里。
import { createAttachmentMessage } from './attachments.js'
// 引入 all，将 ./generators.js 中已经封装好的能力接到本文件流程里。
import { all } from './generators.js'
// 引入 findToolByName、Tools、ToolUseContext，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tools, type ToolUseContext } from '../Tool.js'
// 引入 execPromptHook，将 ./hooks/execPromptHook.js 中已经封装好的能力接到本文件流程里。
import { execPromptHook } from './hooks/execPromptHook.js'
// 类型依赖 { Message, AssistantMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message, AssistantMessage } from '../types/message.js'
// 引入 execAgentHook，将 ./hooks/execAgentHook.js 中已经封装好的能力接到本文件流程里。
import { execAgentHook } from './hooks/execAgentHook.js'
// 引入 execHttpHook，将 ./hooks/execHttpHook.js 中已经封装好的能力接到本文件流程里。
import { execHttpHook } from './hooks/execHttpHook.js'
// 类型依赖 { ShellCommand } 来自 ./ShellCommand.js，用于校准共享工具的数据契约。
import type { ShellCommand } from './ShellCommand.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSessionHooks,
  getSessionFunctionHooks,
  getSessionHookCallback,
  clearSessionHooks,
  type SessionDerivedHookMatcher,
  type FunctionHook,
} from './hooks/sessionHooks.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 引入 jsonStringify、jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify, jsonParse } from './slowOperations.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 errorMessage、getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from './errors.js'

// TOOL_HOOK_EXECUTION_TIMEOUT_MS 集合 命名 `10 * 60 * 1000`，让后续代码直接表达这个值的用途。
const TOOL_HOOK_EXECUTION_TIMEOUT_MS = 10 * 60 * 1000

/**
 * SessionEnd hooks run during shutdown/clear and need a much tighter bound
 * than TOOL_HOOK_EXECUTION_TIMEOUT_MS. This value is used by callers as both
 * the per-hook default timeout AND the overall AbortSignal cap (hooks run in
 * parallel, so one value suffices). Overridable via env var for users whose
 * teardown scripts need more time.
 */
// SESSION_END_HOOK_TIMEOUT_MS_DEFAULT 会话数据 命名 `1500`，让后续代码直接表达这个值的用途。
const SESSION_END_HOOK_TIMEOUT_MS_DEFAULT = 1500
// getSessionEndHookTimeoutMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionEndHookTimeoutMs(): number {
  // 原始文本 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const raw = process.env.CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS
  // 解析结果解析`parseInt`，供共享工具后续处理使用。
  const parsed = raw ? parseInt(raw, 10) : NaN
  // 返回 `Number.isFinite(parsed) && parsed > 0`，作为共享工具这次计算的结果。
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : SESSION_END_HOOK_TIMEOUT_MS_DEFAULT
}

// executeInBackground 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function executeInBackground({
  processId,
  hookId,
  shellCommand,
  asyncResponse,
  hookEvent,
  hookName,
  command,
  asyncRewake,
  pluginId,
}: {
  processId: string
  hookId: string
  shellCommand: ShellCommand
  asyncResponse: AsyncHookJSONOutput
  hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
  hookName: string
  command: string
  asyncRewake?: boolean
  pluginId?: string
}): boolean {
  // 满足 `asyncRewake` 时，共享工具执行该分支。
  if (asyncRewake) {
    // asyncRewake hooks bypass the registry entirely. On completion, if exit
    // code 2 (blocking error), enqueue as a task-notification so it wakes the
    // model via useQueueProcessor (idle) or gets injected mid-query via
    // queued_command attachments (busy).
    //
    // NOTE: We deliberately do NOT call shellCommand.background() here, because
    // it calls taskOutput.spillToDisk() which breaks in-memory stdout/stderr
    // capture (getStderr() returns '' in disk mode). The StreamWrappers stay
    // attached and pipe data into the in-memory TaskOutput buffers. The abort
    // handler already no-ops on 'interrupt' reason (user submitted a new
    // message), so the hook survives new prompts. A hard cancel (Escape) WILL
    // kill the hook via the abort handler, which is the desired behavior.
    // 这个回调绑定到 void shellCommand.result.then(async result => {，负责共享工具在该局部场景下的响应。
    void shellCommand.result.then(async result => {
      // result resolves on 'exit', but stdio 'data' events may still be
      // pending. Yield to I/O so the StreamWrapper data handlers drain into
      // TaskOutput before we read it.
      // 这个回调绑定到 await new Promise(resolve => setImmediate(resolve))，负责共享工具在该局部场景下的响应。
      await new Promise(resolve => setImmediate(resolve))
      // stdout读取`taskOutput.getStdout`，供共享工具后续处理使用。
      const stdout = await shellCommand.taskOutput.getStdout()
      // stderr读取`taskOutput.getStderr`，供共享工具后续处理使用。
      const stderr = shellCommand.taskOutput.getStderr()
      // 调用 shellCommand.cleanup，触发共享工具此处需要的副作用。
      shellCommand.cleanup()
      // 调用 emitHookResponse，触发共享工具此处需要的副作用。
      emitHookResponse({
        hookId,
        hookName,
        hookEvent,
        output: stdout + stderr,
        stdout,
        stderr,
        exitCode: result.code,
        outcome: result.code === 0 ? 'success' : 'error',
      })
      // 满足 `result.code === 2` 时，共享工具执行该分支。
      if (result.code === 2) {
        // 调用 enqueuePendingNotification，触发共享工具此处需要的副作用。
        enqueuePendingNotification({
          value: wrapInSystemReminder(
            `Stop hook blocking error from command "${hookName}": ${stderr || stdout}`,
          ),
          mode: 'task-notification',
        })
      }
    })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // TaskOutput on the ShellCommand accumulates data — no stream listeners needed
  // 满足 `!shellCommand.background(processId)` 时，共享工具执行该分支。
  if (!shellCommand.background(processId)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 调用 registerPendingAsyncHook，触发共享工具此处需要的副作用。
  registerPendingAsyncHook({
    processId,
    hookId,
    asyncResponse,
    hookEvent,
    hookName,
    command,
    shellCommand,
    pluginId,
  })

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Checks if a hook should be skipped due to lack of workspace trust.
 *
 * ALL hooks require workspace trust because they execute arbitrary commands from
 * .claude/settings.json. This is a defense-in-depth security measure.
 *
 * Context: Hooks are captured via captureHooksConfigSnapshot() before the trust
 * dialog is shown. While most hooks won't execute until after trust is established
 * through normal program flow, enforcing trust for ALL hooks prevents:
 * - Future bugs where a hook might accidentally execute before trust
 * - Any codepath that might trigger hooks before trust dialog
 * - Security issues from hook execution in untrusted workspaces
 *
 * Historical vulnerabilities that prompted this check:
 * - SessionEnd hooks executing when user declines trust dialog
 * - SubagentStop hooks executing when subagent completes before trust
 *
 * @returns true if hook should be skipped, false if it should execute
 */
// shouldSkipHookDueToTrust 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldSkipHookDueToTrust(): boolean {
  // In non-interactive mode (SDK), trust is implicit - always execute
  // isInteractive记录 `getIsNonInteractiveSession` 是否成立，共享工具随后按该结果分支。
  const isInteractive = !getIsNonInteractiveSession()
  // isInteractive缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isInteractive) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // In interactive mode, ALL hooks require trust
  // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
  const hasTrust = checkHasTrustDialogAccepted()
  // 返回 `!hasTrust`，作为共享工具这次计算的结果。
  return !hasTrust
}

/**
 * Creates the base hook input that's common to all hook types
 */
// createBaseHookInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createBaseHookInput(
  permissionMode?: string,
  sessionId?: string,
  // Typed narrowly (not ToolUseContext) so callers can pass toolUseContext
  // directly via structural typing without this function depending on Tool.ts.
  agentInfo?: { agentId?: string; agentType?: string },
): {
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string
  agent_id?: string
  agent_type?: string
} {
  // resolvedSessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const resolvedSessionId = sessionId ?? getSessionId()
  // agent_type: subagent's type (from toolUseContext) takes precedence over
  // the session's --agent flag. Hooks use agent_id presence to distinguish
  // subagent calls from main-thread calls in a --agent session.
  // resolvedAgentType读取`getMainThreadAgentType`，供共享工具后续处理使用。
  const resolvedAgentType = agentInfo?.agentType ?? getMainThreadAgentType()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    session_id: resolvedSessionId,
    transcript_path: getTranscriptPathForSession(resolvedSessionId),
    cwd: getCwd(),
    permission_mode: permissionMode,
    agent_id: agentInfo?.agentId,
    agent_type: resolvedAgentType,
  }
}

// HookBlockingError 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface HookBlockingError {
  blockingError: string
  command: string
}

/** Re-export ElicitResult from MCP SDK as ElicitationResponse for backward compat. */
// ElicitationResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElicitationResponse = ElicitResult

// HookResult 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface HookResult {
  message?: HookResultMessage
  systemMessage?: string
  blockingError?: HookBlockingError
  outcome: 'success' | 'blocking' | 'non_blocking_error' | 'cancelled'
  preventContinuation?: boolean
  stopReason?: string
  permissionBehavior?: 'ask' | 'deny' | 'allow' | 'passthrough'
  hookPermissionDecisionReason?: string
  additionalContext?: string
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  elicitationResponse?: ElicitationResponse
  watchPaths?: string[]
  elicitationResultResponse?: ElicitationResponse
  retry?: boolean
  hook: HookCommand | HookCallback | FunctionHook
}

// AggregatedHookResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AggregatedHookResult = {
  message?: HookResultMessage
  blockingError?: HookBlockingError
  preventContinuation?: boolean
  stopReason?: string
  hookPermissionDecisionReason?: string
  hookSource?: string
  permissionBehavior?: PermissionResult['behavior']
  additionalContexts?: string[]
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  watchPaths?: string[]
  elicitationResponse?: ElicitationResponse
  elicitationResultResponse?: ElicitationResponse
  retry?: boolean
}

/**
 * Parse and validate a JSON string against the hook output Zod schema.
 * Returns the validated output or formatted validation errors.
 */
// validateHookJson 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateHookJson(
  jsonString: string,
): { json: HookJSONOutput } | { validationError: string } {
  // 解析结果解析`jsonParse`，供共享工具后续处理使用。
  const parsed = jsonParse(jsonString)
  // validation保存`hookJSONOutputSchema`，供共享工具后续处理使用。
  const validation = hookJSONOutputSchema().safeParse(parsed)
  // 满足 `validation.success` 时，共享工具执行该分支。
  if (validation.success) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Successfully parsed and validated hook JSON output')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { json: validation.data }
  }
  // 错误列表 命名 `validation.error.issues`，让后续代码直接表达这个值的用途。
  const errors = validation.error.issues
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(err => `  - ${err.path.join('.')}: ${err.message}`)
    .join('\n')
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    validationError: `Hook JSON output validation failed:\n${errors}\n\nThe hook's output was: ${jsonStringify(parsed, null, 2)}`,
  }
}

// parseHookOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseHookOutput(stdout: string): {
  json?: HookJSONOutput
  plainText?: string
  validationError?: string
} {
  // trimmed格式化`stdout.trim`，供共享工具后续处理使用。
  const trimmed = stdout.trim()
  // 满足 `!trimmed.startsWith('{')` 时，共享工具执行该分支。
  if (!trimmed.startsWith('{')) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Hook output does not start with {, treating as plain text')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { plainText: stdout }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`validateHookJson`，供共享工具后续处理使用。
    const result = validateHookJson(trimmed)
    // 满足 `'json' in result` 时，共享工具执行该分支。
    if ('json' in result) {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }
    // For command hooks, include the schema hint in the error message
    // errorMessage 消息数据保存`jsonStringify`，供共享工具后续处理使用。
    const errorMessage = `${result.validationError}\n\nExpected schema:\n${jsonStringify(
      {
        continue: 'boolean (optional)',
        suppressOutput: 'boolean (optional)',
        stopReason: 'string (optional)',
        decision: '"approve" | "block" (optional)',
        reason: 'string (optional)',
        systemMessage: 'string (optional)',
        permissionDecision: '"allow" | "deny" | "ask" (optional)',
        hookSpecificOutput: {
          'for PreToolUse': {
            hookEventName: '"PreToolUse"',
            permissionDecision: '"allow" | "deny" | "ask" (optional)',
            permissionDecisionReason: 'string (optional)',
            updatedInput: 'object (optional) - Modified tool input to use',
          },
          'for UserPromptSubmit': {
            hookEventName: '"UserPromptSubmit"',
            additionalContext: 'string (required)',
          },
          'for PostToolUse': {
            hookEventName: '"PostToolUse"',
            additionalContext: 'string (optional)',
          },
        },
      },
      null,
      2,
    )}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(errorMessage)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { plainText: stdout, validationError: errorMessage }
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to parse hook output as JSON: ${e}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { plainText: stdout }
  }
}

// parseHttpHookOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseHttpHookOutput(body: string): {
  json?: HookJSONOutput
  validationError?: string
} {
  // trimmed格式化`body.trim`，供共享工具后续处理使用。
  const trimmed = body.trim()

  // 满足 `trimmed === ''` 时，共享工具执行该分支。
  if (trimmed === '') {
    // validation保存`hookJSONOutputSchema`，供共享工具后续处理使用。
    const validation = hookJSONOutputSchema().safeParse({})
    // 满足 `validation.success` 时，共享工具执行该分支。
    if (validation.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'HTTP hook returned empty body, treating as empty JSON object',
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { json: validation.data }
    }
  }

  // 满足 `!trimmed.startsWith('{')` 时，共享工具执行该分支。
  if (!trimmed.startsWith('{')) {
    // validationError 错误信息格式化`trimmed.slice`，供共享工具后续处理使用。
    const validationError = `HTTP hook must return JSON, but got non-JSON response body: ${trimmed.length > 200 ? trimmed.slice(0, 200) + '\u2026' : trimmed}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(validationError)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { validationError }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`validateHookJson`，供共享工具后续处理使用。
    const result = validateHookJson(trimmed)
    // 满足 `'json' in result` 时，共享工具执行该分支。
    if ('json' in result) {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(result.validationError)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (e) {
    // validationError 错误信息 命名 ``HTTP hook must return valid JSON, but parsing failed: ${...`，让后续代码直接表达这个值的用途。
    const validationError = `HTTP hook must return valid JSON, but parsing failed: ${e}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(validationError)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { validationError }
  }
}

// processHookJSONOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processHookJSONOutput({
  json,
  command,
  hookName,
  toolUseID,
  hookEvent,
  expectedHookEvent,
  stdout,
  stderr,
  exitCode,
  durationMs,
}: {
  json: SyncHookJSONOutput
  command: string
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
  expectedHookEvent?: HookEvent
  stdout?: string
  stderr?: string
  exitCode?: number
  durationMs?: number
}): Partial<HookResult> {
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: Partial<HookResult> = {}

  // At this point we know it's a sync response
  // syncJson 命名 `json`，让后续代码直接表达这个值的用途。
  const syncJson = json

  // Handle common elements
  // 满足 `syncJson.continue === false` 时，共享工具执行该分支。
  if (syncJson.continue === false) {
    // preventContinuation更新为 `true`，确保共享工具后续读取最新状态。
    result.preventContinuation = true
    // 满足 `syncJson.stopReason` 时，共享工具执行该分支。
    if (syncJson.stopReason) {
      // stopReason更新为 `syncJson.stopReason`，确保共享工具后续读取最新状态。
      result.stopReason = syncJson.stopReason
    }
  }

  // 满足 `json.decision` 时，共享工具执行该分支。
  if (json.decision) {
    // 按照 json.decision 的取值选择共享工具的具体处理分支。
    switch (json.decision) {
      case 'approve':
        // permissionBehavior 权限数据更新为 `'allow'`，确保共享工具后续读取最新状态。
        result.permissionBehavior = 'allow'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'block':
        // permissionBehavior 权限数据更新为 `'deny'`，确保共享工具后续读取最新状态。
        result.permissionBehavior = 'deny'
        // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
        result.blockingError = {
          blockingError: json.reason || 'Blocked by hook',
          command,
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // Handle unknown decision types as errors
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Unknown hook decision type: ${json.decision}. Valid types are: approve, block`,
        )
    }
  }

  // Handle systemMessage field
  // 满足 `json.systemMessage` 时，共享工具执行该分支。
  if (json.systemMessage) {
    // systemMessage 消息数据更新为 `json.systemMessage`，确保共享工具后续读取最新状态。
    result.systemMessage = json.systemMessage
  }

  // Handle PreToolUse specific
  // 共享工具在这里按实际状态进入对应分支。
  if (
    json.hookSpecificOutput?.hookEventName === 'PreToolUse' &&
    json.hookSpecificOutput.permissionDecision
  ) {
    // 按照 json.hookSpecificOutput.permissionDecision 的取值选择共享工具的具体处理分支。
    switch (json.hookSpecificOutput.permissionDecision) {
      case 'allow':
        // permissionBehavior 权限数据更新为 `'allow'`，确保共享工具后续读取最新状态。
        result.permissionBehavior = 'allow'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'deny':
        // permissionBehavior 权限数据更新为 `'deny'`，确保共享工具后续读取最新状态。
        result.permissionBehavior = 'deny'
        // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
        result.blockingError = {
          blockingError: json.reason || 'Blocked by hook',
          command,
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'ask':
        // permissionBehavior 权限数据更新为 `'ask'`，确保共享工具后续读取最新状态。
        result.permissionBehavior = 'ask'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // Handle unknown decision types as errors
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Unknown hook permissionDecision type: ${json.hookSpecificOutput.permissionDecision}. Valid types are: allow, deny, ask`,
        )
    }
  }
  // `result.permissionBehavior` 与 `undefined && json.r` 不一致时刷新派生状态，避免使用过期结果。
  if (result.permissionBehavior !== undefined && json.reason !== undefined) {
    // hookPermissionDecisionReason 权限数据更新为 `json.reason`，确保共享工具后续读取最新状态。
    result.hookPermissionDecisionReason = json.reason
  }

  // Handle hookSpecificOutput
  // 满足 `json.hookSpecificOutput` 时，共享工具执行该分支。
  if (json.hookSpecificOutput) {
    // Validate hook event name matches expected if provided
    // 共享工具在这里按实际状态进入对应分支。
    if (
      expectedHookEvent &&
      json.hookSpecificOutput.hookEventName !== expectedHookEvent
    ) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Hook returned incorrect event name: expected '${expectedHookEvent}' but got '${json.hookSpecificOutput.hookEventName}'. Full stdout: ${jsonStringify(json, null, 2)}`,
      )
    }

    // 按照 json.hookSpecificOutput.hookEventName 的取值选择共享工具的具体处理分支。
    switch (json.hookSpecificOutput.hookEventName) {
      case 'PreToolUse':
        // Override with more specific permission decision if provided
        // 满足 `json.hookSpecificOutput.permissionDecision` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.permissionDecision) {
          // 按照 json.hookSpecificOutput.permissionDecision 的取值选择共享工具的具体处理分支。
          switch (json.hookSpecificOutput.permissionDecision) {
            case 'allow':
              // permissionBehavior 权限数据更新为 `'allow'`，确保共享工具后续读取最新状态。
              result.permissionBehavior = 'allow'
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            case 'deny':
              // permissionBehavior 权限数据更新为 `'deny'`，确保共享工具后续读取最新状态。
              result.permissionBehavior = 'deny'
              // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
              result.blockingError = {
                blockingError:
                  json.hookSpecificOutput.permissionDecisionReason ||
                  json.reason ||
                  'Blocked by hook',
                command,
              }
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            case 'ask':
              // permissionBehavior 权限数据更新为 `'ask'`，确保共享工具后续读取最新状态。
              result.permissionBehavior = 'ask'
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
          }
        }
        // 共享工具 hooks在这里处理 `result.hookPermissionDecisionReason =`，完成这一小步状态转换。
        result.hookPermissionDecisionReason =
          json.hookSpecificOutput.permissionDecisionReason
        // Extract updatedInput if provided
        // 满足 `json.hookSpecificOutput.updatedInput` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.updatedInput) {
          // updatedInput更新为 `json.hookSpecificOutput.updatedInput`，确保共享工具后续读取最新状态。
          result.updatedInput = json.hookSpecificOutput.updatedInput
        }
        // Extract additionalContext if provided
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'UserPromptSubmit':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SessionStart':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // initialUserMessage 消息数据更新为 `json.hookSpecificOutput.initialUserMessage`，确保共享工具后续读取最新状态。
        result.initialUserMessage = json.hookSpecificOutput.initialUserMessage
        // 共享工具在这里按实际状态进入对应分支。
        if (
          'watchPaths' in json.hookSpecificOutput &&
          json.hookSpecificOutput.watchPaths
        ) {
          // watchPaths 路径数据更新为 `json.hookSpecificOutput.watchPaths`，确保共享工具后续读取最新状态。
          result.watchPaths = json.hookSpecificOutput.watchPaths
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'Setup':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SubagentStart':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'PostToolUse':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // Extract updatedMCPToolOutput if provided
        // 满足 `json.hookSpecificOutput.updatedMCPToolOutput` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.updatedMCPToolOutput) {
          // 共享工具 hooks在这里处理 `result.updatedMCPToolOutput =`，完成这一小步状态转换。
          result.updatedMCPToolOutput =
            json.hookSpecificOutput.updatedMCPToolOutput
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'PostToolUseFailure':
        // additionalContext更新为 `json.hookSpecificOutput.additionalContext`，确保共享工具后续读取最新状态。
        result.additionalContext = json.hookSpecificOutput.additionalContext
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'PermissionDenied':
        // retry更新为 `json.hookSpecificOutput.retry`，确保共享工具后续读取最新状态。
        result.retry = json.hookSpecificOutput.retry
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'PermissionRequest':
        // Extract the permission request decision
        // 满足 `json.hookSpecificOutput.decision` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.decision) {
          // permissionRequestResult 权限数据更新为 `json.hookSpecificOutput.decision`，确保共享工具后续读取最新状态。
          result.permissionRequestResult = json.hookSpecificOutput.decision
          // Also update permissionBehavior for consistency
          // 共享工具 hooks在这里处理 `result.permissionBehavior =`，完成这一小步状态转换。
          result.permissionBehavior =
            json.hookSpecificOutput.decision.behavior === 'allow'
              ? 'allow'
              : 'deny'
          // 共享工具在这里按实际状态进入对应分支。
          if (
            json.hookSpecificOutput.decision.behavior === 'allow' &&
            json.hookSpecificOutput.decision.updatedInput
          ) {
            // updatedInput更新为 `json.hookSpecificOutput.decision.updatedInput`，确保共享工具后续读取最新状态。
            result.updatedInput = json.hookSpecificOutput.decision.updatedInput
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'Elicitation':
        // 满足 `json.hookSpecificOutput.action` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.action) {
          // elicitationResponse 响应数据更新为 `{`，确保共享工具后续读取最新状态。
          result.elicitationResponse = {
            action: json.hookSpecificOutput.action,
            content: json.hookSpecificOutput.content as
              | ElicitationResponse['content']
              | undefined,
          }
          // 当 `json.hookSpecificOutput.action` 匹配 `'decline'` 时，共享工具执行对应分支。
          if (json.hookSpecificOutput.action === 'decline') {
            // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
            result.blockingError = {
              blockingError: json.reason || 'Elicitation denied by hook',
              command,
            }
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'ElicitationResult':
        // 满足 `json.hookSpecificOutput.action` 时，共享工具执行该分支。
        if (json.hookSpecificOutput.action) {
          // elicitationResultResponse 响应数据更新为 `{`，确保共享工具后续读取最新状态。
          result.elicitationResultResponse = {
            action: json.hookSpecificOutput.action,
            content: json.hookSpecificOutput.content as
              | ElicitationResponse['content']
              | undefined,
          }
          // 当 `json.hookSpecificOutput.action` 匹配 `'decline'` 时，共享工具执行对应分支。
          if (json.hookSpecificOutput.action === 'decline') {
            // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
            result.blockingError = {
              blockingError:
                json.reason || 'Elicitation result blocked by hook',
              command,
            }
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...result,
    message: result.blockingError
      ? createAttachmentMessage({
          type: 'hook_blocking_error',
          hookName,
          toolUseID,
          hookEvent,
          blockingError: result.blockingError,
        })
      : createAttachmentMessage({
          type: 'hook_success',
          hookName,
          toolUseID,
          hookEvent,
          // JSON-output hooks inject context via additionalContext →
          // hook_additional_context, not this field. Empty content suppresses
          // the trivial "X hook success: Success" system-reminder that
          // otherwise pollutes every turn (messages.ts:3577 skips on '').
          content: '',
          stdout,
          stderr,
          exitCode,
          command,
          durationMs,
        }),
  }
}

/**
 * Execute a command-based hook using bash or PowerShell.
 *
 * Shell resolution: hook.shell → 'bash'. PowerShell hooks spawn pwsh
 * with -NoProfile -NonInteractive -Command and skip bash-specific prep
 * (POSIX path conversion, .sh auto-prepend, CLAUDE_CODE_SHELL_PREFIX).
 * See docs/design/ps-shell-selection.md §5.1.
 */
// execCommandHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function execCommandHook(
  hook: HookCommand & { type: 'command' },
  hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion',
  hookName: string,
  jsonInput: string,
  signal: AbortSignal,
  hookId: string,
  hookIndex?: number,
  pluginRoot?: string,
  pluginId?: string,
  skillRoot?: string,
  forceSyncExecution?: boolean,
  // 这个回调绑定到 requestPrompt?: (request: PromptRequest) => Promise<PromptResponse>,，负责共享工具在该局部场景下的响应。
  requestPrompt?: (request: PromptRequest) => Promise<PromptResponse>,
): Promise<{
  stdout: string
  stderr: string
  output: string
  status: number
  aborted?: boolean
  backgrounded?: boolean
}> {
  // Gated to once-per-session events to keep diag_log volume bounded.
  // started/completed live inside the try/finally so setup-path throws
  // don't orphan a started marker — that'd be indistinguishable from a hang.
  // shouldEmitDiag 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldEmitDiag =
    hookEvent === 'SessionStart' ||
    hookEvent === 'Setup' ||
    hookEvent === 'SessionEnd'
  // diagStartMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const diagStartMs = Date.now()
  // diagExitCode 先占位，稍后的条件分支会根据实际输入补齐它。
  let diagExitCode: number | undefined
  // diagAborted标记共享工具 hooks是否启用对应路径。
  let diagAborted = false

  // isWindows 集合记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
  const isWindows = getPlatform() === 'windows'

  // --
  // Per-hook shell selection (phase 1 of docs/design/ps-shell-selection.md).
  // Resolution order: hook.shell → DEFAULT_HOOK_SHELL. The defaultShell
  // fallback (settings.defaultShell) is phase 2 — not wired yet.
  //
  // The bash path is the historical default and stays unchanged. The
  // PowerShell path deliberately skips the Windows-specific bash
  // accommodations (cygpath conversion, .sh auto-prepend, POSIX-quoted
  // SHELL_PREFIX).
  // shellType保存`hook.shell ?? DEFAULT_HOOK_SHELL`，供共享工具 hooks后续判断或输出使用。
  const shellType = hook.shell ?? DEFAULT_HOOK_SHELL

  // isPowerShell标记共享工具 hooks是否启用对应路径。
  const isPowerShell = shellType === 'powershell'

  // --
  // Windows bash path: hooks run via Git Bash (Cygwin), NOT cmd.exe.
  //
  // This means every path we put into env vars or substitute into the command
  // string MUST be a POSIX path (/c/Users/foo), not a Windows path
  // (C:\Users\foo or C:/Users/foo). Git Bash cannot resolve Windows paths.
  //
  // windowsPathToPosixPath() is pure-JS regex conversion (no cygpath shell-out):
  // C:\Users\foo -> /c/Users/foo, UNC preserved, slashes flipped. Memoized
  // (LRU-500) so repeated calls are cheap.
  //
  // PowerShell path: use native paths — skip the conversion entirely.
  // PowerShell expects Windows paths on Windows (and native paths on
  // Unix where pwsh is also available).
  // toHookPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const toHookPath =
    isWindows && !isPowerShell
      // 这个回调绑定到 ? (p: string) => windowsPathToPosixPath(p)，负责共享工具在该局部场景下的响应。
      ? (p: string) => windowsPathToPosixPath(p)
      // 这个回调绑定到 : (p: string) => p，负责共享工具在该局部场景下的响应。
      : (p: string) => p

  // Set CLAUDE_PROJECT_DIR to the stable project root (not the worktree path).
  // getProjectRoot() is never updated when entering a worktree, so hooks that
  // reference $CLAUDE_PROJECT_DIR always resolve relative to the real repo root.
  // projectDir读取`getProjectRoot`，供共享工具后续处理使用。
  const projectDir = getProjectRoot()

  // Substitute ${CLAUDE_PLUGIN_ROOT} and ${user_config.X} in the command string.
  // Order matches MCP/LSP (plugin vars FIRST, then user config) so a user-
  // entered value containing the literal text ${CLAUDE_PLUGIN_ROOT} is treated
  // as opaque — not re-interpreted as a template.
  // 命令 命名 `hook.command`，让后续代码直接表达这个值的用途。
  let command = hook.command
  // pluginOpts 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginOpts: ReturnType<typeof loadPluginOptions> | undefined
  // 满足 `pluginRoot` 时，共享工具执行该分支。
  if (pluginRoot) {
    // Plugin directory gone (orphan GC race, concurrent session deleted it):
    // throw so callers yield a non-blocking error. Running would fail — and
    // `python3 <missing>.py` exits 2, the hook protocol's "block" code, which
    // bricks UserPromptSubmit/Stop until restart. The pre-check is necessary
    // because exit-2-from-missing-script is indistinguishable from an
    // intentional block after spawn.
    // 满足 `!(await pathExists(pluginRoot))` 时，共享工具执行该分支。
    if (!(await pathExists(pluginRoot))) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Plugin directory does not exist: ${pluginRoot}` +
          (pluginId ? ` (${pluginId} — run /plugin to reinstall)` : ''),
      )
    }
    // Inline both ROOT and DATA substitution instead of calling
    // substitutePluginVariables(). That helper normalizes \ → / on Windows
    // unconditionally — correct for bash (toHookPath already produced /c/...
    // so it's a no-op) but wrong for PS where toHookPath is identity and we
    // want native C:\... backslashes. Inlining also lets us use the function-
    // form .replace() so paths containing $ aren't mangled by $-pattern
    // interpretation (rare but possible: \\server\c$\plugin).
    // rootPath 路径数据保存`toHookPath`，供共享工具后续处理使用。
    const rootPath = toHookPath(pluginRoot)
    // 命令更新为 `command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, () => rootPa...`，确保共享工具后续读取最新状态。
    command = command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, () => rootPath)
    // 满足 `pluginId` 时，共享工具执行该分支。
    if (pluginId) {
      // dataPath 路径数据保存`toHookPath`，供共享工具后续处理使用。
      const dataPath = toHookPath(getPluginDataDir(pluginId))
      // 命令更新为 `command.replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, () => dataPa...`，确保共享工具后续读取最新状态。
      command = command.replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, () => dataPath)
    }
    // 满足 `pluginId` 时，共享工具执行该分支。
    if (pluginId) {
      // pluginOpts 插件数据更新为 `loadPluginOptions(pluginId)`，确保共享工具后续读取最新状态。
      pluginOpts = loadPluginOptions(pluginId)
      // Throws if a referenced key is missing — that means the hook uses a key
      // that's either not declared in manifest.userConfig or not yet configured.
      // Caught upstream like any other hook exec failure.
      // 命令更新为 `substituteUserConfigVariables(command, pluginOpts)`，确保共享工具后续读取最新状态。
      command = substituteUserConfigVariables(command, pluginOpts)
    }
  }

  // On Windows (bash only), auto-prepend `bash` for .sh scripts so they
  // execute instead of opening in the default file handler. PowerShell
  // runs .ps1 files natively — no prepend needed.
  // 只有 `isWindows && !isPowerShell && command.trim().match(/\.sh(\s|$|")/)` 满足时，共享工具才执行该分支。
  if (isWindows && !isPowerShell && command.trim().match(/\.sh(\s|$|")/)) {
    // 判断 !command.trim().startsWith('bash ')，将共享工具分流到只适用于该条件的处理路径。
    if (!command.trim().startsWith('bash ')) {
      // command 命令数据更新为 ``bash ${command}``，确保共享工具后续读取最新状态。
      command = `bash ${command}`
    }
  }

  // CLAUDE_CODE_SHELL_PREFIX wraps the command via POSIX quoting
  // (formatShellPrefixCommand uses shell-quote). This makes no sense for
  // PowerShell — see design §8.1. For now PS hooks ignore the prefix;
  // a CLAUDE_CODE_PS_SHELL_PREFIX (or shell-aware prefix) is a follow-up.
  // finalCommand 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const finalCommand =
    !isPowerShell && process.env.CLAUDE_CODE_SHELL_PREFIX
      ? formatShellPrefixCommand(process.env.CLAUDE_CODE_SHELL_PREFIX, command)
      : command

  // hookTimeoutMs 集合保存`hook.timeout`，供共享工具 hooks后续步骤使用。
  const hookTimeoutMs = hook.timeout
    ? hook.timeout * 1000
    : TOOL_HOOK_EXECUTION_TIMEOUT_MS

  // Build env vars — all paths go through toHookPath for Windows POSIX conversion
  // envVars 集合集中保存共享工具 hooks要一起传递的字段。
  const envVars: NodeJS.ProcessEnv = {
    ...subprocessEnv(),
    CLAUDE_PROJECT_DIR: toHookPath(projectDir),
  }

  // Plugin and skill hooks both set CLAUDE_PLUGIN_ROOT (skills use the same
  // name for consistency — skills can migrate to plugins without code changes)
  // 满足 `pluginRoot` 时，共享工具执行该分支。
  if (pluginRoot) {
    // CLAUDE_PLUGIN_ROOT更新为 `toHookPath(pluginRoot)`，确保共享工具后续读取最新状态。
    envVars.CLAUDE_PLUGIN_ROOT = toHookPath(pluginRoot)
    // 满足 `pluginId` 时，共享工具执行该分支。
    if (pluginId) {
      // CLAUDE_PLUGIN_DATA更新为 `toHookPath(getPluginDataDir(pluginId))`，确保共享工具后续读取最新状态。
      envVars.CLAUDE_PLUGIN_DATA = toHookPath(getPluginDataDir(pluginId))
    }
  }
  // Expose plugin options as env vars too, so hooks can read them without
  // ${user_config.X} in the command string. Sensitive values included — hooks
  // run the user's own code, same trust boundary as reading keychain directly.
  // 满足 `pluginOpts` 时，共享工具执行该分支。
  if (pluginOpts) {
    // 遍历 const [key, value] of Object.entries(pluginOpts)，按顺序处理共享工具中的批量条目。
    for (const [key, value] of Object.entries(pluginOpts)) {
      // Sanitize non-identifier chars (bash can't ref $FOO-BAR). The schema
      // at schemas.ts:611 now constrains keys to /^[A-Za-z_]\w*$/ so this is
      // belt-and-suspenders, but cheap insurance if someone bypasses the schema.
      // envKey格式化`key.replace`，供共享工具后续处理使用。
      const envKey = key.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase()
      // envVars[`CLAUDE_PLUGIN_OPTION_${envKey}`更新为 `String(value)`，确保共享工具 hooks后续读取最新状态。
      envVars[`CLAUDE_PLUGIN_OPTION_${envKey}`] = String(value)
    }
  }
  // 满足 `skillRoot` 时，共享工具执行该分支。
  if (skillRoot) {
    // CLAUDE_PLUGIN_ROOT更新为 `toHookPath(skillRoot)`，确保共享工具后续读取最新状态。
    envVars.CLAUDE_PLUGIN_ROOT = toHookPath(skillRoot)
  }

  // CLAUDE_ENV_FILE points to a .sh file that the hook writes env var
  // definitions into; getSessionEnvironmentScript() concatenates them and
  // bashProvider injects the content into bash commands. A PS hook would
  // naturally write PS syntax ($env:FOO = 'bar'), which bash can't parse.
  // Skip for PS — consistent with how .sh prepend and SHELL_PREFIX are
  // already bash-only above.
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    !isPowerShell &&
    (hookEvent === 'SessionStart' ||
      hookEvent === 'Setup' ||
      hookEvent === 'CwdChanged' ||
      hookEvent === 'FileChanged') &&
    hookIndex !== undefined
  ) {
    // CLAUDE_ENV_FILE 文件数据更新为 `await getHookEnvFilePath(hookEvent, hookIndex)`，确保共享工具后续读取最新状态。
    envVars.CLAUDE_ENV_FILE = await getHookEnvFilePath(hookEvent, hookIndex)
  }

  // When agent worktrees are removed, getCwd() may return a deleted path via
  // AsyncLocalStorage. Validate before spawning since spawn() emits async
  // 'error' events for missing cwd rather than throwing synchronously.
  // hookCwd读取`getCwd`，供共享工具后续处理使用。
  const hookCwd = getCwd()
  // safeCwd保存`pathExists`，供共享工具后续处理使用。
  const safeCwd = (await pathExists(hookCwd)) ? hookCwd : getOriginalCwd()
  // `safeCwd` 与 `hookCwd` 不一致时刷新派生状态。
  if (safeCwd !== hookCwd) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: cwd ${hookCwd} not found, falling back to original cwd`,
      { level: 'warn' },
    )
  }

  // --
  // Spawn. Two completely separate paths:
  //
  //   Bash: spawn(cmd, [], { shell: <gitBashPath | true> }) — the shell
  //   option makes Node pass the whole string to the shell for parsing.
  //
  //   PowerShell: spawn(pwshPath, ['-NoProfile', '-NonInteractive',
  //   '-Command', cmd]) — explicit argv, no shell option. -NoProfile
  //   skips user profile scripts (faster, deterministic).
  //   -NonInteractive fails fast instead of prompting.
  //
  // The Git Bash hard-exit in findGitBashPath() is still in place for
  // bash hooks. PowerShell hooks never call it, so a Windows user with
  // only pwsh and shell: 'powershell' on every hook could in theory run
  // without Git Bash — but init.ts still calls setShellIfWindows() on
  // startup, which will exit first. Relaxing that is phase 1 of the
  // design's implementation order (separate PR).
  // child先声明占位，稍后的分支会根据实际输入补齐。
  let child: ChildProcessWithoutNullStreams
  // `shellType` 命中特定值 `'powershell'` 时，进入共享工具对应处理。
  if (shellType === 'powershell') {
    // pwshPath 文件数据读取`getCachedPowerShellPath`，供共享工具后续处理使用。
    const pwshPath = await getCachedPowerShellPath()
    // pwshPath 文件数据缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!pwshPath) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Hook "${hook.command}" has shell: 'powershell' but no PowerShell ` +
          `executable (pwsh or powershell) was found on PATH. Install ` +
          `PowerShell, or remove "shell": "powershell" to use bash.`,
      )
    }
    // child更新为 `spawn(pwshPath, buildPowerShellArgs(finalCommand), {`，确保共享工具后续读取最新状态。
    child = spawn(pwshPath, buildPowerShellArgs(finalCommand), {
      env: envVars,
      cwd: safeCwd,
      // Prevent visible console window on Windows (no-op on other platforms)
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
  } else {
    // On Windows, use Git Bash explicitly (cmd.exe can't run bash syntax).
    // On other platforms, shell: true uses /bin/sh.
    // shell筛选`findGitBashPath`，供共享工具后续处理使用。
    const shell = isWindows ? findGitBashPath() : true
    // child更新为 `spawn(finalCommand, [], {`，确保共享工具后续读取最新状态。
    child = spawn(finalCommand, [], {
      env: envVars,
      cwd: safeCwd,
      shell,
      // Prevent visible console window on Windows (no-op on other platforms)
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
  }

  // Hooks use pipe mode — stdout must be streamed into JS so we can parse
  // the first response line to detect async hooks ({"async": true}).
  // hookTaskOutput保存`TaskOutput`，供共享工具后续处理使用。
  const hookTaskOutput = new TaskOutput(`hook_${child.pid}`, null)
  // shellCommand 命令数据保存`wrapSpawn`，供共享工具后续处理使用。
  const shellCommand = wrapSpawn(child, signal, hookTimeoutMs, hookTaskOutput)
  // Track whether shellCommand ownership was transferred (e.g., to async hook registry)
  // shellCommandTransferred 命令数据记录当前扫描状态，共享工具 hooks随后按该状态分支。
  let shellCommandTransferred = false
  // Track whether stdin has already been written (to avoid "write after end" errors)
  // stdinWritten记录当前扫描状态，共享工具 hooks随后按该状态分支。
  let stdinWritten = false

  // 判断 (hook.async || hook.asyncRewake) && !forceSyncExecution，将共享工具分流到只适用于该条件的处理路径。
  if ((hook.async || hook.asyncRewake) && !forceSyncExecution) {
    // processId保存``async_hook_${child.pid}``，供共享工具 hooks后续步骤使用。
    const processId = `async_hook_${child.pid}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Config-based async hook, backgrounding process ${processId}`,
    )

    // Write stdin before backgrounding so the hook receives its input.
    // The trailing newline matches the sync path (L1000). Without it,
    // bash `read -r line` returns exit 1 (EOF before delimiter) — the
    // variable IS populated but `if read -r line; then ...` skips the
    // branch. See gh-30509 / CC-161.
    // child.stdin.write执行共享工具在此处需要的副作用或外部交互。
    child.stdin.write(jsonInput + '\n', 'utf8')
    // child.stdin.end执行共享工具在此处需要的副作用或外部交互。
    child.stdin.end()
    // stdinWritten更新为 `true`，确保共享工具后续读取最新状态。
    stdinWritten = true

    // backgrounded保存`executeInBackground`，供共享工具后续处理使用。
    const backgrounded = executeInBackground({
      processId,
      hookId,
      shellCommand,
      asyncResponse: { async: true, asyncTimeout: hookTimeoutMs },
      hookEvent,
      hookName,
      command: hook.command,
      asyncRewake: hook.asyncRewake,
      pluginId,
    })
    // 满足 `backgrounded` 时，共享工具执行该分支。
    if (backgrounded) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        stdout: '',
        stderr: '',
        output: '',
        status: 0,
        backgrounded: true,
      }
    }
  }

  // stdout保存`''`，供共享工具 hooks后续步骤使用。
  let stdout = ''
  // stderr保存`''`，供共享工具 hooks后续步骤使用。
  let stderr = ''
  // output保存`''`，供共享工具 hooks后续步骤使用。
  let output = ''

  // Set up output data collection with explicit UTF-8 encoding
  // child.stdout.setEncoding写入新的状态值，使共享工具后续读取保持一致。
  child.stdout.setEncoding('utf8')
  // child.stderr.setEncoding写入新的状态值，使共享工具后续读取保持一致。
  child.stderr.setEncoding('utf8')

  // initialResponseChecked记录当前扫描状态，共享工具 hooks随后按该状态分支。
  let initialResponseChecked = false

  // 共享工具 hooks先整理这一处局部数据，后续分支可以直接读取。
  let asyncResolve:
    // 共享工具 hooks处理 `| ((result: {`，完成这一小步状态转换。
    | ((result: {
        stdout: string
        stderr: string
        output: string
        status: number
      }) => void)
    | null = null
  // childIsAsyncPromise构建`new Promise<{`，供共享工具 hooks后续步骤使用。
  const childIsAsyncPromise = new Promise<{
    stdout: string
    stderr: string
    output: string
    status: number
    aborted?: boolean
  // 这个回调绑定到 }>(resolve => {，负责共享工具在该局部场景下的响应。
  }>(resolve => {
    // asyncResolve更新为 `resolve`，确保共享工具后续读取最新状态。
    asyncResolve = resolve
  })

  // Track trimmed prompt-request lines we processed so we can strip them
  // from final stdout by content match (no index tracking → no index drift)
  // processedPromptLines 集合构建`new Set<string>()`，供共享工具 hooks后续步骤使用。
  const processedPromptLines = new Set<string>()
  // Serialize async prompt handling so responses are sent in order
  // promptChain读取`Promise.resolve`，供共享工具后续处理使用。
  let promptChain = Promise.resolve()
  // Line buffer for detecting prompt requests in streaming output
  // lineBuffer保存`''`，供共享工具 hooks后续步骤使用。
  let lineBuffer = ''

  // child.stdout.on执行共享工具在此处需要的副作用或外部交互。
  child.stdout.on('data', data => {
    // 共享工具 hooks处理 `stdout += data`，完成这一小步状态转换。
    stdout += data
    // 共享工具 hooks处理 `output += data`，完成这一小步状态转换。
    output += data

    // When requestPrompt is provided, parse stdout line-by-line for prompt requests
    // 满足 `requestPrompt` 时，共享工具执行该分支。
    if (requestPrompt) {
      // 共享工具 hooks处理 `lineBuffer += data`，完成这一小步状态转换。
      lineBuffer += data
      // 文本行格式化`lineBuffer.split`，供共享工具后续处理使用。
      const lines = lineBuffer.split('\n')
      // lineBuffer更新为 `lines.pop() ?? '' // last element is an incomplete line`，确保共享工具后续读取最新状态。
      lineBuffer = lines.pop() ?? '' // last element is an incomplete line

      // 遍历 const line of lines，让共享工具逐项完成同一类处理。
      for (const line of lines) {
        // trimmed格式化`line.trim`，供共享工具后续处理使用。
        const trimmed = line.trim()
        // 判断 !trimmed，将共享工具分流到只适用于该条件的处理路径。
        if (!trimmed) continue

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // parsed解析`jsonParse`，供共享工具后续处理使用。
          const parsed = jsonParse(trimmed)
          // validation保存`promptRequestSchema`，供共享工具后续处理使用。
          const validation = promptRequestSchema().safeParse(parsed)
          // 满足 `validation.success` 时，共享工具执行该分支。
          if (validation.success) {
            // processedPromptLines.add执行共享工具在此处需要的副作用或外部交互。
            processedPromptLines.add(trimmed)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Hooks: Detected prompt request from hook: ${trimmed}`,
            )
            // Chain the async handling to serialize prompt responses
            // promptReq保存`validation.data`，供共享工具 hooks后续步骤使用。
            const promptReq = validation.data
            // reqPrompt保存`requestPrompt`，供共享工具 hooks后续步骤使用。
            const reqPrompt = requestPrompt
            // promptChain更新为 `promptChain.then(async () => {`，确保共享工具后续读取最新状态。
            promptChain = promptChain.then(async () => {
              // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
              try {
                // response保存`reqPrompt`，供共享工具后续处理使用。
                const response = await reqPrompt(promptReq)
                // child.stdin.write执行共享工具在此处需要的副作用或外部交互。
                child.stdin.write(jsonStringify(response) + '\n', 'utf8')
              } catch (err) {
                // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                logForDebugging(`Hooks: Prompt request handling failed: ${err}`)
                // User cancelled or prompt failed — close stdin so the hook
                // process doesn't hang waiting for input
                // child.stdin.destroy执行共享工具在此处需要的副作用或外部交互。
                child.stdin.destroy()
              }
            })
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
        } catch {
          // Not JSON, just a normal line
        }
      }
    }

    // Check for async response on first line of output. The async protocol is:
    // hook emits {"async":true,...} as its FIRST line, then its normal output.
    // We must parse ONLY the first line — if the process is fast and writes more
    // before this 'data' event fires, parsing the full accumulated stdout fails
    // and an async hook blocks for its full duration instead of backgrounding.
    // initialResponseChecked缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!initialResponseChecked) {
      // firstLine保存`firstLineOf`，供共享工具后续处理使用。
      const firstLine = firstLineOf(stdout).trim()
      // 判断 !firstLine.includes('}')，将共享工具分流到只适用于该条件的处理路径。
      if (!firstLine.includes('}')) return
      // initialResponseChecked更新为 `true`，确保共享工具后续读取最新状态。
      initialResponseChecked = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Checking first line for async: ${firstLine}`)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // parsed解析`jsonParse`，供共享工具后续处理使用。
        const parsed = jsonParse(firstLine)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Parsed initial response: ${jsonStringify(parsed)}`,
        )
        // 判断 isAsyncHookJSONOutput(parsed) && !forceSyncExecution，将共享工具分流到只适用于该条件的处理路径。
        if (isAsyncHookJSONOutput(parsed) && !forceSyncExecution) {
          // processId保存``async_hook_${child.pid}``，供共享工具 hooks后续步骤使用。
          const processId = `async_hook_${child.pid}`
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks: Detected async hook, backgrounding process ${processId}`,
          )

          // backgrounded保存`executeInBackground`，供共享工具后续处理使用。
          const backgrounded = executeInBackground({
            processId,
            hookId,
            shellCommand,
            asyncResponse: parsed,
            hookEvent,
            hookName,
            command: hook.command,
            pluginId,
          })
          // 满足 `backgrounded` 时，共享工具执行该分支。
          if (backgrounded) {
            // shellCommandTransferred 命令数据更新为 `true`，确保共享工具后续读取最新状态。
            shellCommandTransferred = true
            // 调用 asyncResolve?.({，完成这一处局部操作。
            asyncResolve?.({
              stdout,
              stderr,
              output,
              status: 0,
            })
          }
        // `isAsyncHookJSONOutput(parsed) && forceSyncExecution` 成立时，共享工具 hooks切换到这个 else-if 分支。
        } else if (isAsyncHookJSONOutput(parsed) && forceSyncExecution) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks: Detected async hook but forceSyncExecution is true, waiting for completion`,
          )
        } else {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks: Initial response is not async, continuing normal processing`,
          )
        }
      } catch (e) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Hooks: Failed to parse initial response as JSON: ${e}`)
      }
    }
  })

  // child.stderr.on执行共享工具在此处需要的副作用或外部交互。
  child.stderr.on('data', data => {
    // 共享工具 hooks处理 `stderr += data`，完成这一小步状态转换。
    stderr += data
    // 共享工具 hooks处理 `output += data`，完成这一小步状态转换。
    output += data
  })

  // stopProgressInterval保存`startHookProgressInterval`，供共享工具后续处理使用。
  const stopProgressInterval = startHookProgressInterval({
    hookId,
    hookName,
    hookEvent,
    // 这个回调绑定到 getOutput: async () => ({ stdout, stderr, output }),，负责共享工具在该局部场景下的响应。
    getOutput: async () => ({ stdout, stderr, output }),
  })

  // Wait for stdout and stderr streams to finish before considering output complete
  // This prevents a race condition where 'close' fires before all 'data' events are processed
  // stdoutEndPromise读取`new Promise<void>(resolve => {`，供共享工具 hooks后续步骤使用。
  const stdoutEndPromise = new Promise<void>(resolve => {
    // child.stdout.on执行共享工具在此处需要的副作用或外部交互。
    child.stdout.on('end', () => resolve())
  })

  // stderrEndPromise读取`new Promise<void>(resolve => {`，供共享工具 hooks后续步骤使用。
  const stderrEndPromise = new Promise<void>(resolve => {
    // child.stderr.on执行共享工具在此处需要的副作用或外部交互。
    child.stderr.on('end', () => resolve())
  })

  // Write to stdin, making sure to handle EPIPE errors that can happen when
  // the hook command exits before reading all input.
  // Note: EPIPE handling is difficult to set up in testing since Bun and Node
  // have different behaviors.
  // TODO: Add tests for EPIPE handling.
  // Skip if stdin was already written (e.g., by config-based async hook path)
  // stdinWritePromise保存`stdinWritten`，供共享工具 hooks后续步骤使用。
  const stdinWritePromise = stdinWritten
    ? Promise.resolve()
    // 这个回调绑定到 : new Promise<void>((resolve, reject) => {，负责共享工具在该局部场景下的响应。
    : new Promise<void>((resolve, reject) => {
        // child.stdin.on执行共享工具在此处需要的副作用或外部交互。
        child.stdin.on('error', err => {
          // When requestPrompt is provided, stdin stays open for prompt responses.
          // EPIPE errors from later writes (after process exits) are expected -- suppress them.
          // requestPrompt缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
          if (!requestPrompt) {
            // reject执行共享工具在此处需要的副作用或外部交互。
            reject(err)
          } else {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Hooks: stdin error during prompt flow (likely process exited): ${err}`,
            )
          }
        })
        // Explicitly specify UTF-8 encoding to ensure proper handling of Unicode characters
        // child.stdin.write执行共享工具在此处需要的副作用或外部交互。
        child.stdin.write(jsonInput + '\n', 'utf8')
        // When requestPrompt is provided, keep stdin open for prompt responses
        // requestPrompt缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
        if (!requestPrompt) {
          // child.stdin.end执行共享工具在此处需要的副作用或外部交互。
          child.stdin.end()
        }
        // resolve执行共享工具在此处需要的副作用或外部交互。
        resolve()
      })

  // Create promise for child process error
  // childErrorPromise 错误信息构建`new Promise<never>((_, reject) => {`，供共享工具 hooks后续步骤使用。
  const childErrorPromise = new Promise<never>((_, reject) => {
    // child.on执行共享工具在此处需要的副作用或外部交互。
    child.on('error', reject)
  })

  // Create promise for child process close - but only resolve after streams end
  // to ensure all output has been collected
  // childClosePromise构建`new Promise<{`，供共享工具 hooks后续步骤使用。
  const childClosePromise = new Promise<{
    stdout: string
    stderr: string
    output: string
    status: number
    aborted?: boolean
  // 这个回调绑定到 }>(resolve => {，负责共享工具在该局部场景下的响应。
  }>(resolve => {
    // exitCode保存`null`，供共享工具 hooks后续步骤使用。
    let exitCode: number | null = null

    // child.on执行共享工具在此处需要的副作用或外部交互。
    child.on('close', code => {
      // exitCode更新为 `code ?? 1`，确保共享工具后续读取最新状态。
      exitCode = code ?? 1

      // Wait for both streams to end before resolving with the final output
      // 这个回调绑定到 void Promise.all([stdoutEndPromise, stderrEndPromise]).then(() => {，负责共享工具在该局部场景下的响应。
      void Promise.all([stdoutEndPromise, stderrEndPromise]).then(() => {
        // Strip lines we processed as prompt requests so parseHookOutput
        // only sees the final hook result. Content-matching against the set
        // of actually-processed lines means prompt JSON can never leak
        // through (fail-closed), regardless of line positioning.
        // finalStdout 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const finalStdout =
          processedPromptLines.size === 0
            ? stdout
            : stdout
                .split('\n')
                // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
                .filter(line => !processedPromptLines.has(line.trim()))
                .join('\n')

        // resolve执行共享工具在此处需要的副作用或外部交互。
        resolve({
          stdout: finalStdout,
          stderr,
          output,
          status: exitCode!,
          aborted: signal.aborted,
        })
      })
    })
  })

  // Race between stdin write, async detection, and process completion
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `shouldEmitDiag` 时，共享工具执行该分支。
    if (shouldEmitDiag) {
      // logForDiagnosticsNoPII执行共享工具在此处需要的副作用或外部交互。
      logForDiagnosticsNoPII('info', 'hook_spawn_started', {
        hook_event_name: hookEvent,
        index: hookIndex,
      })
    }
    // 等待 `Promise.race([stdinWritePromise, childErrorPromise])` 完成，再继续共享工具 hooks的异步流程。
    await Promise.race([stdinWritePromise, childErrorPromise])

    // Wait for any pending prompt responses before resolving
    // 结果保存`Promise.race`，供共享工具后续处理使用。
    const result = await Promise.race([
      childIsAsyncPromise,
      childClosePromise,
      childErrorPromise,
    ])
    // Ensure all queued prompt responses have been sent
    // 等待 `promptChain` 完成，再继续共享工具 hooks的异步流程。
    await promptChain
    // diagExitCode更新为 `result.status`，确保共享工具后续读取最新状态。
    diagExitCode = result.status
    // diagAborted更新为 `result.aborted ?? false`，确保共享工具后续读取最新状态。
    diagAborted = result.aborted ?? false
    // 返回 result，把共享工具这个分支的结果交还调用方。
    return result
  } catch (error) {
    // Handle errors from stdin write or child process
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // diagExitCode更新为 `1`，确保共享工具后续读取最新状态。
    diagExitCode = 1

    // `code` 命中特定值 `'EPIPE'` 时，进入共享工具对应处理。
    if (code === 'EPIPE') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'EPIPE error while writing to hook stdin (hook command likely closed early)',
      )
      // errMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errMsg =
        'Hook command closed stdin before hook input was fully written (EPIPE)'
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        stdout: '',
        stderr: errMsg,
        output: errMsg,
        status: 1,
      }
    // `code === 'ABORT_ERR'` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (code === 'ABORT_ERR') {
      // diagAborted更新为 `true`，确保共享工具后续读取最新状态。
      diagAborted = true
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        stdout: '',
        stderr: 'Hook cancelled',
        output: 'Hook cancelled',
        status: 1,
        aborted: true,
      }
    } else {
      // errorMsg 错误信息保存`errorMessage`，供共享工具后续处理使用。
      const errorMsg = errorMessage(error)
      // errOutput保存``Error occurred while executing hook command: ${errorMsg}``，供共享工具 hooks后续步骤使用。
      const errOutput = `Error occurred while executing hook command: ${errorMsg}`
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        stdout: '',
        stderr: errOutput,
        output: errOutput,
        status: 1,
      }
    }
  } finally {
    // 满足 `shouldEmitDiag` 时，共享工具执行该分支。
    if (shouldEmitDiag) {
      // logForDiagnosticsNoPII执行共享工具在此处需要的副作用或外部交互。
      logForDiagnosticsNoPII('info', 'hook_spawn_completed', {
        hook_event_name: hookEvent,
        index: hookIndex,
        duration_ms: Date.now() - diagStartMs,
        exit_code: diagExitCode,
        aborted: diagAborted,
      })
    }
    // stopProgressInterval执行共享工具在此处需要的副作用或外部交互。
    stopProgressInterval()
    // Clean up stream resources unless ownership was transferred (e.g., to async hook registry)
    // shellCommandTransferred 命令数据缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!shellCommandTransferred) {
      // shellCommand.cleanup执行共享工具在此处需要的副作用或外部交互。
      shellCommand.cleanup()
    }
  }
}

/**
 * Check if a match query matches a hook matcher pattern
 * @param matchQuery The query to match (e.g., 'Write', 'Edit', 'Bash')
 * @param matcher The matcher pattern - can be:
 *   - Simple string for exact match (e.g., 'Write')
 *   - Pipe-separated list for multiple exact matches (e.g., 'Write|Edit')
 *   - Regex pattern (e.g., '^Write.*', '.*', '^(Write|Edit)$')
 * @returns true if the query matches the pattern
 */
// matchesPattern 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function matchesPattern(matchQuery: string, matcher: string): boolean {
  // `!matcher || matcher` 命中特定值 `'*'` 时，进入共享工具对应处理。
  if (!matcher || matcher === '*') {
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }
  // Check if it's a simple string or pipe-separated list (no regex special chars except |)
  // 判断 /^[a-zA-Z0-9_|]+$/.test(matcher)，将共享工具分流到只适用于该条件的处理路径。
  if (/^[a-zA-Z0-9_|]+$/.test(matcher)) {
    // Handle pipe-separated exact matches
    // 判断 matcher.includes('|')，将共享工具分流到只适用于该条件的处理路径。
    if (matcher.includes('|')) {
      // patterns 集合保存`matcher`，供共享工具 hooks后续步骤使用。
      const patterns = matcher
        .split('|')
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(p => normalizeLegacyToolName(p.trim()))
      // 返回 patterns.includes(matchQuery)，把共享工具这个分支的结果交还调用方。
      return patterns.includes(matchQuery)
    }
    // Simple exact match
    // 返回 matchQuery === normalizeLegacyToolName(matcher)，把共享工具这个分支的结果交还调用方。
    return matchQuery === normalizeLegacyToolName(matcher)
  }

  // Otherwise treat as regex
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // regex匹配`RegExp`，供共享工具后续处理使用。
    const regex = new RegExp(matcher)
    // 判断 regex.test(matchQuery)，将共享工具分流到只适用于该条件的处理路径。
    if (regex.test(matchQuery)) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
    // Also test against legacy names so patterns like "^Task$" still match
    // 遍历 const legacyName of getLegacyToolNames(matchQuery)，按顺序处理共享工具中的批量条目。
    for (const legacyName of getLegacyToolNames(matchQuery)) {
      // 判断 regex.test(legacyName)，将共享工具分流到只适用于该条件的处理路径。
      if (regex.test(legacyName)) {
        // 返回 true，把共享工具这个分支的结果交还调用方。
        return true
      }
    }
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  } catch {
    // If the regex is invalid, log error and return false
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Invalid regex pattern in hook matcher: ${matcher}`)
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }
}

// IfConditionMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type IfConditionMatcher = (ifCondition: string) => boolean

/**
 * Prepare a matcher for hook `if` conditions. Expensive work (tool lookup,
 * Zod validation, tree-sitter parsing for Bash) happens once here; the
 * returned closure is called per hook. Returns undefined for non-tool events.
 */
// prepareIfConditionMatcher 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
async function prepareIfConditionMatcher(
  hookInput: HookInput,
  tools: Tools | undefined,
): Promise<IfConditionMatcher | undefined> {
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    hookInput.hook_event_name !== 'PreToolUse' &&
    hookInput.hook_event_name !== 'PostToolUse' &&
    hookInput.hook_event_name !== 'PostToolUseFailure' &&
    hookInput.hook_event_name !== 'PermissionRequest'
  ) {
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }

  // toolName保存`normalizeLegacyToolName`，供共享工具后续处理使用。
  const toolName = normalizeLegacyToolName(hookInput.tool_name)
  // tool筛选`findToolByName`，供共享工具后续处理使用。
  const tool = tools && findToolByName(tools, hookInput.tool_name)
  // input保存`inputSchema.safeParse`，供共享工具后续处理使用。
  const input = tool?.inputSchema.safeParse(hookInput.tool_input)
  // patternMatcher 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const patternMatcher =
    input?.success && tool?.preparePermissionMatcher
      ? await tool.preparePermissionMatcher(input.data)
      : undefined

  // 返回 ifCondition => {，把共享工具这个分支的结果交还调用方。
  return ifCondition => {
    // parsed保存`permissionRuleValueFromString`，供共享工具后续处理使用。
    const parsed = permissionRuleValueFromString(ifCondition)
    // 判断 normalizeLegacyToolName(parsed.toolName) !== toolName，将共享工具分流到只适用于该条件的处理路径。
    if (normalizeLegacyToolName(parsed.toolName) !== toolName) {
      // 返回 false，把共享工具这个分支的结果交还调用方。
      return false
    }
    // parsed.ruleContent缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!parsed.ruleContent) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
    // 返回 patternMatcher ? patternMatcher(parsed.ruleContent) : false，把共享工具这个分支的结果交还调用方。
    return patternMatcher ? patternMatcher(parsed.ruleContent) : false
  }
}

// FunctionHookMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FunctionHookMatcher = {
  matcher: string
  hooks: FunctionHook[]
}

/**
 * A hook paired with optional plugin context.
 * Used when returning matched hooks so we can apply plugin env vars at execution time.
 */
// MatchedHook 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MatchedHook = {
  hook: HookCommand | HookCallback | FunctionHook
  pluginRoot?: string
  pluginId?: string
  skillRoot?: string
  hookSource?: string
}

// isInternalHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function isInternalHook(matched: MatchedHook): boolean {
  // 返回 matched.hook.type === 'callback' && matched.hook.internal === true，把共享工具这个分支的结果交还调用方。
  return matched.hook.type === 'callback' && matched.hook.internal === true
}

/**
 * Build a dedup key for a matched hook, namespaced by source context.
 *
 * Settings-file hooks (no pluginRoot/skillRoot) share the '' prefix so the
 * same command defined in user/project/local still collapses to one — the
 * original intent of the dedup. Plugin/skill hooks get their root as the
 * prefix, so two plugins sharing an unexpanded `${CLAUDE_PLUGIN_ROOT}/hook.sh`
 * template don't collapse: after expansion they point to different files.
 */
// hookDedupKey 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function hookDedupKey(m: MatchedHook, payload: string): string {
  // 返回 `${m.pluginRoot ?? m.skillRoot ?? ''}\0${payload}`，把共享工具这个分支的结果交还调用方。
  return `${m.pluginRoot ?? m.skillRoot ?? ''}\0${payload}`
}

/**
 * Build a map of {sanitizedPluginName: hookCount} from matched hooks.
 * Only logs actual names for official marketplace plugins; others become 'third-party'.
 */
// getPluginHookCounts 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function getPluginHookCounts(
  hooks: MatchedHook[],
): Record<string, number> | undefined {
  // pluginHooks 集合筛选`hooks.filter`，供共享工具后续处理使用。
  const pluginHooks = hooks.filter(h => h.pluginId)
  // pluginHooks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (pluginHooks.length === 0) {
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }
  // counts 集合从空对象开始收集键值，后续按名称补齐内容。
  const counts: Record<string, number> = {}
  // 遍历 const h of pluginHooks，让共享工具逐项完成同一类处理。
  for (const h of pluginHooks) {
    // atIndex 索引保存`lastIndexOf`，供共享工具后续处理使用。
    const atIndex = h.pluginId!.lastIndexOf('@')
    // isOfficial 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isOfficial =
      atIndex > 0 &&
      ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(h.pluginId!.slice(atIndex + 1))
    // 按键保存`isOfficial ? h.pluginId! : 'third-party'`，供共享工具 hooks后续步骤使用。
    const key = isOfficial ? h.pluginId! : 'third-party'
    // counts[key更新为 `(counts[key] || 0) + 1`，确保共享工具 hooks后续读取最新状态。
    counts[key] = (counts[key] || 0) + 1
  }
  // 返回 counts，把共享工具这个分支的结果交还调用方。
  return counts
}


/**
 * Build a map of {hookType: count} from matched hooks.
 */
// getHookTypeCounts 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function getHookTypeCounts(hooks: MatchedHook[]): Record<string, number> {
  // counts 集合从空对象开始收集键值，后续按名称补齐内容。
  const counts: Record<string, number> = {}
  // 遍历 const h of hooks，让共享工具逐项完成同一类处理。
  for (const h of hooks) {
    // type更新为 `(counts[h.hook.type] || 0) + 1`，确保共享工具 hooks后续读取最新状态。
    counts[h.hook.type] = (counts[h.hook.type] || 0) + 1
  }
  // 返回 counts，把共享工具这个分支的结果交还调用方。
  return counts
}

// getHooksConfig 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function getHooksConfig(
  appState: AppState | undefined,
  sessionId: string,
  hookEvent: HookEvent,
): Array<
  | HookMatcher
  | HookCallbackMatcher
  | FunctionHookMatcher
  | PluginHookMatcher
  | SkillHookMatcher
  | SessionDerivedHookMatcher
> {
  // HookMatcher is a zod-stripped {matcher, hooks} so snapshot matchers can be
  // pushed directly without re-wrapping.
  // hooks 集合先声明占位，稍后的分支会根据实际输入补齐。
  const hooks: Array<
    | HookMatcher
    | HookCallbackMatcher
    | FunctionHookMatcher
    | PluginHookMatcher
    | SkillHookMatcher
    | SessionDerivedHookMatcher
  > = [...(getHooksConfigFromSnapshot()?.[hookEvent] ?? [])]

  // Check if only managed hooks should run (used for both registered and session hooks)
  // managedOnly保存`shouldAllowManagedHooksOnly`，供共享工具后续处理使用。
  const managedOnly = shouldAllowManagedHooksOnly()

  // Process registered hooks (SDK callbacks and plugin native hooks)
  // registeredHooks 集合读取`getRegisteredHooks`，供共享工具后续处理使用。
  const registeredHooks = getRegisteredHooks()?.[hookEvent]
  // 满足 `registeredHooks` 时，共享工具执行该分支。
  if (registeredHooks) {
    // 遍历 const matcher of registeredHooks，让共享工具逐项完成同一类处理。
    for (const matcher of registeredHooks) {
      // Skip plugin hooks when restricted to managed hooks only
      // Plugin hooks have pluginRoot set, SDK callbacks do not
      // 组合条件 `managedOnly && 'pluginRoot' in matcher` 成立时，共享工具才启用这条专门路径。
      if (managedOnly && 'pluginRoot' in matcher) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // hooks 集合追加新条目，保持收集顺序与输入顺序一致。
      hooks.push(matcher)
    }
  }

  // Merge session hooks for the current session only
  // Function hooks (like structured output enforcement) must be scoped to their session
  // to prevent hooks from one agent leaking to another (e.g., verification agent to main agent)
  // Skip session hooks entirely when allowManagedHooksOnly is set —
  // this prevents frontmatter hooks from agents/skills from bypassing the policy.
  // strictPluginOnlyCustomization does NOT block here — it gates at the
  // REGISTRATION sites (runAgent.ts:526 for agent frontmatter hooks) where
  // agentDefinition.source is known. A blanket block here would also kill
  // plugin-provided agents' frontmatter hooks, which is too broad.
  // Also skip if appState not provided (for backwards compatibility)
  // `!managedOnly && appState` 与 `undefined` 不一致时刷新派生状态。
  if (!managedOnly && appState !== undefined) {
    // sessionHooks 集合读取`getSessionHooks`，供共享工具后续处理使用。
    const sessionHooks = getSessionHooks(appState, sessionId, hookEvent).get(
      hookEvent,
    )
    // 满足 `sessionHooks` 时，共享工具执行该分支。
    if (sessionHooks) {
      // SessionDerivedHookMatcher already includes optional skillRoot
      // 遍历 const matcher of sessionHooks，让共享工具逐项完成同一类处理。
      for (const matcher of sessionHooks) {
        // hooks 集合追加新条目，保持收集顺序与输入顺序一致。
        hooks.push(matcher)
      }
    }

    // Merge session function hooks separately (can't be persisted to HookMatcher format)
    // sessionFunctionHooks 集合读取`getSessionFunctionHooks`，供共享工具后续处理使用。
    const sessionFunctionHooks = getSessionFunctionHooks(
      appState,
      sessionId,
      hookEvent,
    ).get(hookEvent)
    // 满足 `sessionFunctionHooks` 时，共享工具执行该分支。
    if (sessionFunctionHooks) {
      // 遍历 const matcher of sessionFunctionHooks，让共享工具逐项完成同一类处理。
      for (const matcher of sessionFunctionHooks) {
        // hooks 集合追加新条目，保持收集顺序与输入顺序一致。
        hooks.push(matcher)
      }
    }
  }

  // 返回 hooks，把共享工具这个分支的结果交还调用方。
  return hooks
}

/**
 * Lightweight existence check for hooks on a given event. Mirrors the sources
 * assembled by getHooksConfig() but stops at the first hit without building
 * the full merged config.
 *
 * Intentionally over-approximates: returns true if any matcher exists for the
 * event, even if managed-only filtering or pattern matching would later
 * discard it. A false positive just means we proceed to the full matching
 * path; a false negative would skip a hook, so we err on the side of true.
 *
 * Used to skip createBaseHookInput (getTranscriptPathForSession path joins)
 * and getMatchingHooks on hot paths where hooks are typically unconfigured.
 * See hasInstructionsLoadedHook / hasWorktreeCreateHook for the same pattern.
 */
// hasHookForEvent 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function hasHookForEvent(
  hookEvent: HookEvent,
  appState: AppState | undefined,
  sessionId: string,
): boolean {
  // snap读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const snap = getHooksConfigFromSnapshot()?.[hookEvent]
  // 判断 snap && snap.length > 0，将共享工具分流到只适用于该条件的处理路径。
  if (snap && snap.length > 0) return true
  // reg读取`getRegisteredHooks`，供共享工具后续处理使用。
  const reg = getRegisteredHooks()?.[hookEvent]
  // 判断 reg && reg.length > 0，将共享工具分流到只适用于该条件的处理路径。
  if (reg && reg.length > 0) return true
  // 判断 appState?.sessionHooks.get(sessionId)?.hooks[hookEvent]，将共享工具分流到只适用于该条件的处理路径。
  if (appState?.sessionHooks.get(sessionId)?.hooks[hookEvent]) return true
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Get hook commands that match the given query
 * @param appState The current app state (optional for backwards compatibility)
 * @param sessionId The current session ID (main session or agent ID)
 * @param hookEvent The hook event
 * @param hookInput The hook input for matching
 * @returns Array of matched hooks with optional plugin context
 */
// getMatchingHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function getMatchingHooks(
  appState: AppState | undefined,
  sessionId: string,
  hookEvent: HookEvent,
  hookInput: HookInput,
  tools?: Tools,
): Promise<MatchedHook[]> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // hookMatchers 集合读取`getHooksConfig`，供共享工具后续处理使用。
    const hookMatchers = getHooksConfig(appState, sessionId, hookEvent)

    // If you change the criteria below, then you must change
    // src/utils/hooks/hooksConfigManager.ts as well.
    // matchQuery保存`undefined`，供共享工具 hooks后续步骤使用。
    let matchQuery: string | undefined = undefined
    // 按照 hookInput.hook_event_name 的取值选择共享工具的具体处理分支。
    switch (hookInput.hook_event_name) {
      case 'PreToolUse':
      case 'PostToolUse':
      case 'PostToolUseFailure':
      case 'PermissionRequest':
      case 'PermissionDenied':
        // matchQuery更新为 `hookInput.tool_name`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.tool_name
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SessionStart':
        // matchQuery更新为 `hookInput.source`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.source
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'Setup':
        // matchQuery更新为 `hookInput.trigger`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.trigger
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'PreCompact':
      case 'PostCompact':
        // matchQuery更新为 `hookInput.trigger`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.trigger
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'Notification':
        // matchQuery更新为 `hookInput.notification_type`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.notification_type
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SessionEnd':
        // matchQuery更新为 `hookInput.reason`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.reason
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'StopFailure':
        // matchQuery更新为 `hookInput.error`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.error
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SubagentStart':
        // matchQuery更新为 `hookInput.agent_type`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.agent_type
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'SubagentStop':
        // matchQuery更新为 `hookInput.agent_type`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.agent_type
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'TeammateIdle':
      case 'TaskCreated':
      case 'TaskCompleted':
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'Elicitation':
        // matchQuery更新为 `hookInput.mcp_server_name`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.mcp_server_name
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'ElicitationResult':
        // matchQuery更新为 `hookInput.mcp_server_name`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.mcp_server_name
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'ConfigChange':
        // matchQuery更新为 `hookInput.source`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.source
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'InstructionsLoaded':
        // matchQuery更新为 `hookInput.load_reason`，确保共享工具后续读取最新状态。
        matchQuery = hookInput.load_reason
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'FileChanged':
        // matchQuery更新为 `basename(hookInput.file_path)`，确保共享工具后续读取最新状态。
        matchQuery = basename(hookInput.file_path)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Getting matching hook commands for ${hookEvent} with query: ${matchQuery}`,
      { level: 'verbose' },
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Found ${hookMatchers.length} hook matchers in settings`, {
      level: 'verbose',
    })

    // Extract hooks with their plugin context (if any)
    // filteredMatchers 集合保存`matchQuery`，供共享工具 hooks后续步骤使用。
    const filteredMatchers = matchQuery
      ? hookMatchers.filter(
          // matcher更新为 `>`，确保共享工具后续读取最新状态。
          matcher =>
            !matcher.matcher || matchesPattern(matchQuery, matcher.matcher),
        )
      : hookMatchers

    // 这个回调绑定到 const matchedHooks: MatchedHook[] = filteredMatchers.flatMap(matcher => {，负责共享工具在该局部场景下的响应。
    const matchedHooks: MatchedHook[] = filteredMatchers.flatMap(matcher => {
      // Check if this is a PluginHookMatcher (has pluginRoot) or SkillHookMatcher (has skillRoot)
      // pluginRoot 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const pluginRoot =
        'pluginRoot' in matcher ? matcher.pluginRoot : undefined
      // pluginId保存`'pluginId' in matcher ? matcher.pluginId : undefined`，供共享工具 hooks后续步骤使用。
      const pluginId = 'pluginId' in matcher ? matcher.pluginId : undefined
      // skillRoot保存`'skillRoot' in matcher ? matcher.skillRoot : undefined`，供共享工具 hooks后续步骤使用。
      const skillRoot = 'skillRoot' in matcher ? matcher.skillRoot : undefined
      // hookSource保存`pluginRoot`，供共享工具 hooks后续步骤使用。
      const hookSource = pluginRoot
        ? 'pluginName' in matcher
          ? `plugin:${matcher.pluginName}`
          : 'plugin'
        : skillRoot
          ? 'skillName' in matcher
            ? `skill:${matcher.skillName}`
            : 'skill'
          : 'settings'
      // 返回 matcher.hooks.map(hook => ({，把共享工具这个分支的结果交还调用方。
      return matcher.hooks.map(hook => ({
        hook,
        pluginRoot,
        pluginId,
        skillRoot,
        hookSource,
      }))
    })

    // Deduplicate hooks by command/prompt/url within the same source context.
    // Key is namespaced by pluginRoot/skillRoot (see hookDedupKey above) so
    // cross-plugin template collisions don't drop hooks (gh-29724).
    //
    // Note: new Map(entries) keeps the LAST entry on key collision, not first.
    // For settings hooks this means the last-merged scope wins; for
    // same-plugin duplicates the pluginRoot is identical so it doesn't matter.
    // Fast-path: callback/function hooks don't need dedup (each is unique).
    // Skip the 6-pass filter + 4×Map + 4×Array.from below when all hooks are
    // callback/function — the common case for internal hooks like
    // sessionFileAccessHooks/attributionHooks (44x faster in microbench).
    // 共享工具在这里进入条件判断，后续代码按实际状态分流。
    if (
      matchedHooks.every(
        // m更新为 `> m.hook.type === 'callback' || m.hook.type === 'function'`，确保共享工具后续读取最新状态。
        m => m.hook.type === 'callback' || m.hook.type === 'function',
      )
    ) {
      // 返回 matchedHooks，把共享工具这个分支的结果交还调用方。
      return matchedHooks
    }

    // Helper to extract the `if` condition from a hook for dedup keys.
    // Hooks with different `if` conditions are distinct even if otherwise identical.
    // getIfCondition保存`(hook: { if?: string }): string => hook.if ?? ''`，供共享工具 hooks后续步骤使用。
    const getIfCondition = (hook: { if?: string }): string => hook.if ?? ''

    // uniqueCommandHooks 命令数据保存`Array.from`，供共享工具后续处理使用。
    const uniqueCommandHooks = Array.from(
      new Map(
        matchedHooks
          .filter(
            // 共享工具 hooks处理 `(`，完成这一小步状态转换。
            (
              m,
            ): m is MatchedHook & { hook: HookCommand & { type: 'command' } } =>
              m.hook.type === 'command',
          )
          // shell is part of identity: {command:'echo x', shell:'bash'}
          // and {command:'echo x', shell:'powershell'} are distinct hooks,
          // not duplicates. Default to 'bash' so legacy configs (no shell
          // field) still dedup against explicit shell:'bash'.
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(m => [
            hookDedupKey(
              m,
              `${m.hook.shell ?? DEFAULT_HOOK_SHELL}\0${m.hook.command}\0${getIfCondition(m.hook)}`,
            ),
            m,
          ]),
      ).values(),
    )
    // uniquePromptHooks 集合保存`Array.from`，供共享工具后续处理使用。
    const uniquePromptHooks = Array.from(
      new Map(
        matchedHooks
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter(m => m.hook.type === 'prompt')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(m => [
            hookDedupKey(
              m,
              `${(m.hook as { prompt: string }).prompt}\0${getIfCondition(m.hook as { if?: string })}`,
            ),
            m,
          ]),
      ).values(),
    )
    // uniqueAgentHooks 集合保存`Array.from`，供共享工具后续处理使用。
    const uniqueAgentHooks = Array.from(
      new Map(
        matchedHooks
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter(m => m.hook.type === 'agent')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(m => [
            hookDedupKey(
              m,
              `${(m.hook as { prompt: string }).prompt}\0${getIfCondition(m.hook as { if?: string })}`,
            ),
            m,
          ]),
      ).values(),
    )
    // uniqueHttpHooks 集合保存`Array.from`，供共享工具后续处理使用。
    const uniqueHttpHooks = Array.from(
      new Map(
        matchedHooks
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter(m => m.hook.type === 'http')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(m => [
            hookDedupKey(
              m,
              `${(m.hook as { url: string }).url}\0${getIfCondition(m.hook as { if?: string })}`,
            ),
            m,
          ]),
      ).values(),
    )
    // callbackHooks 集合筛选`matchedHooks.filter`，供共享工具后续处理使用。
    const callbackHooks = matchedHooks.filter(m => m.hook.type === 'callback')
    // Function hooks don't need deduplication - each callback is unique
    // functionHooks 集合筛选`matchedHooks.filter`，供共享工具后续处理使用。
    const functionHooks = matchedHooks.filter(m => m.hook.type === 'function')
    // uniqueHooks 集合聚合成有序列表，保持后续遍历顺序稳定。
    const uniqueHooks = [
      ...uniqueCommandHooks,
      ...uniquePromptHooks,
      ...uniqueAgentHooks,
      ...uniqueHttpHooks,
      ...callbackHooks,
      ...functionHooks,
    ]

    // Filter hooks based on their `if` condition. This allows hooks to specify
    // conditions like "Bash(git *)" to only run for git commands, avoiding
    // process spawning overhead for non-matching commands.
    // hasIfCondition筛选`uniqueHooks.some`，供共享工具后续处理使用。
    const hasIfCondition = uniqueHooks.some(
      // h更新为 `>`，确保共享工具后续读取最新状态。
      h =>
        (h.hook.type === 'command' ||
          h.hook.type === 'prompt' ||
          h.hook.type === 'agent' ||
          h.hook.type === 'http') &&
        (h.hook as { if?: string }).if,
    )
    // ifMatcher保存`hasIfCondition`，供共享工具 hooks后续步骤使用。
    const ifMatcher = hasIfCondition
      ? await prepareIfConditionMatcher(hookInput, tools)
      : undefined
    // ifFilteredHooks 集合筛选`uniqueHooks.filter`，供共享工具后续处理使用。
    const ifFilteredHooks = uniqueHooks.filter(h => {
      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        h.hook.type !== 'command' &&
        h.hook.type !== 'prompt' &&
        h.hook.type !== 'agent' &&
        h.hook.type !== 'http'
      ) {
        // 返回 true，把共享工具这个分支的结果交还调用方。
        return true
      }
      // ifCondition保存`(h.hook as { if?: string }).if`，供共享工具 hooks后续步骤使用。
      const ifCondition = (h.hook as { if?: string }).if
      // ifCondition缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!ifCondition) {
        // 返回 true，把共享工具这个分支的结果交还调用方。
        return true
      }
      // ifMatcher缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!ifMatcher) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hook if condition "${ifCondition}" cannot be evaluated for non-tool event ${hookInput.hook_event_name}`,
        )
        // 返回 false，把共享工具这个分支的结果交还调用方。
        return false
      }
      // 判断 ifMatcher(ifCondition)，将共享工具分流到只适用于该条件的处理路径。
      if (ifMatcher(ifCondition)) {
        // 返回 true，把共享工具这个分支的结果交还调用方。
        return true
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Skipping hook due to if condition "${ifCondition}" not matching`,
      )
      // 返回 false，把共享工具这个分支的结果交还调用方。
      return false
    })

    // HTTP hooks are not supported for SessionStart/Setup events. In headless
    // mode the sandbox ask callback deadlocks because the structuredInput
    // consumer hasn't started yet when these hooks fire.
    // filteredHooks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const filteredHooks =
      hookEvent === 'SessionStart' || hookEvent === 'Setup'
        // 这个回调绑定到 ? ifFilteredHooks.filter(h => {，负责共享工具在该局部场景下的响应。
        ? ifFilteredHooks.filter(h => {
            // `h.hook.type` 命中特定值 `'http'` 时，进入共享工具对应处理。
            if (h.hook.type === 'http') {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Skipping HTTP hook ${(h.hook as { url: string }).url} — HTTP hooks are not supported for ${hookEvent}`,
              )
              // 返回 false，把共享工具这个分支的结果交还调用方。
              return false
            }
            // 返回 true，把共享工具这个分支的结果交还调用方。
            return true
          })
        : ifFilteredHooks

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Matched ${filteredHooks.length} unique hooks for query "${matchQuery || 'no match query'}" (${matchedHooks.length} before deduplication)`,
      { level: 'verbose' },
    )
    // 返回 filteredHooks，把共享工具这个分支的结果交还调用方。
    return filteredHooks
  } catch {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }
}

/**
 * Format a list of blocking errors from a PreTool hook's configured commands.
 * @param hookName The name of the hook (e.g., 'PreToolUse:Write', 'PreToolUse:Edit', 'PreToolUse:Bash')
 * @param blockingErrors Array of blocking errors from hooks
 * @returns Formatted blocking message
 */
// getPreToolHookBlockingMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getPreToolHookBlockingMessage(
  hookName: string,
  blockingError: HookBlockingError,
): string {
  // 返回 `${hookName} hook error: ${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `${hookName} hook error: ${blockingError.blockingError}`
}

/**
 * Format a list of blocking errors from a Stop hook's configured commands.
 * @param blockingErrors Array of blocking errors from hooks
 * @returns Formatted message to give feedback to the model
 */
// getStopHookMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getStopHookMessage(blockingError: HookBlockingError): string {
  // 返回 `Stop hook feedback:\n${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `Stop hook feedback:\n${blockingError.blockingError}`
}

/**
 * Format a blocking error from a TeammateIdle hook.
 * @param blockingError The blocking error from the hook
 * @returns Formatted message to give feedback to the model
 */
// getTeammateIdleHookMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getTeammateIdleHookMessage(
  blockingError: HookBlockingError,
): string {
  // 返回 `TeammateIdle hook feedback:\n${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `TeammateIdle hook feedback:\n${blockingError.blockingError}`
}

/**
 * Format a blocking error from a TaskCreated hook.
 * @param blockingError The blocking error from the hook
 * @returns Formatted message to give feedback to the model
 */
// getTaskCreatedHookMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getTaskCreatedHookMessage(
  blockingError: HookBlockingError,
): string {
  // 返回 `TaskCreated hook feedback:\n${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `TaskCreated hook feedback:\n${blockingError.blockingError}`
}

/**
 * Format a blocking error from a TaskCompleted hook.
 * @param blockingError The blocking error from the hook
 * @returns Formatted message to give feedback to the model
 */
// getTaskCompletedHookMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getTaskCompletedHookMessage(
  blockingError: HookBlockingError,
): string {
  // 返回 `TaskCompleted hook feedback:\n${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `TaskCompleted hook feedback:\n${blockingError.blockingError}`
}

/**
 * Format a list of blocking errors from a UserPromptSubmit hook's configured commands.
 * @param blockingErrors Array of blocking errors from hooks
 * @returns Formatted blocking message
 */
// getUserPromptSubmitHookBlockingMessage 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function getUserPromptSubmitHookBlockingMessage(
  blockingError: HookBlockingError,
): string {
  // 返回 `UserPromptSubmit operation blocked by hook:\n${blockingError.blockingError}`，把共享工具这个分支的结果交还调用方。
  return `UserPromptSubmit operation blocked by hook:\n${blockingError.blockingError}`
}
/**
 * Common logic for executing hooks
 * @param hookInput The structured hook input that will be validated and converted to JSON
 * @param toolUseID The ID for tracking this hook execution
 * @param matchQuery The query to match against hook matchers
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @param toolUseContext Optional ToolUseContext for prompt-based hooks (required if using prompt hooks)
 * @param messages Optional conversation history for prompt/function hooks
 * @returns Async generator that yields progress messages and hook results
 */
// 共享工具 hooks处理 `async function* executeHooks({`，完成这一小步状态转换。
async function* executeHooks({
  hookInput,
  toolUseID,
  matchQuery,
  signal,
  timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  toolUseContext,
  messages,
  forceSyncExecution,
  requestPrompt,
  toolInputSummary,
}: {
  hookInput: HookInput
  toolUseID: string
  matchQuery?: string
  signal?: AbortSignal
  timeoutMs?: number
  toolUseContext?: ToolUseContext
  messages?: Message[]
  forceSyncExecution?: boolean
  // 共享工具 hooks处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>，负责共享工具在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>
  toolInputSummary?: string | null
}): AsyncGenerator<AggregatedHookResult> {
  // 判断 shouldDisableAllHooksIncludingManaged()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldDisableAllHooksIncludingManaged()) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 判断 isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)，将共享工具分流到只适用于该条件的处理路径。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // hookEvent保存`hookInput.hook_event_name`，供共享工具 hooks后续步骤使用。
  const hookEvent = hookInput.hook_event_name
  // hookName保存`matchQuery ? `${hookEvent}:${matchQuery}` : hookEvent`，供共享工具 hooks后续步骤使用。
  const hookName = matchQuery ? `${hookEvent}:${matchQuery}` : hookEvent

  // Bind the prompt callback to this hook's name and tool input summary so the UI can display context
  // boundRequestPrompt保存`requestPrompt?.(hookName, toolInputSummary)`，供共享工具 hooks后续步骤使用。
  const boundRequestPrompt = requestPrompt?.(hookName, toolInputSummary)

  // SECURITY: ALL hooks require workspace trust in interactive mode
  // This centralized check prevents RCE vulnerabilities for all current and future hooks
  // 判断 shouldSkipHookDueToTrust()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldSkipHookDueToTrust()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping ${hookName} hook execution - workspace trust not accepted`,
    )
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext ? toolUseContext.getAppState() : undefined
  // Use the agent's session ID if available, otherwise fall back to main session
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext?.agentId ?? getSessionId()
  // matchingHooks 集合读取`getMatchingHooks`，供共享工具后续处理使用。
  const matchingHooks = await getMatchingHooks(
    appState,
    sessionId,
    hookEvent,
    hookInput,
    toolUseContext?.options?.tools,
  )
  // matchingHooks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (matchingHooks.length === 0) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `signal?.aborted` 时，共享工具执行该分支。
  if (signal?.aborted) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // userHooks 集合筛选`matchingHooks.filter`，供共享工具后续处理使用。
  const userHooks = matchingHooks.filter(h => !isInternalHook(h))
  // 满足 `userHooks.length > 0` 时，共享工具执行该分支。
  if (userHooks.length > 0) {
    // pluginHookCounts 集合读取`getPluginHookCounts`，供共享工具后续处理使用。
    const pluginHookCounts = getPluginHookCounts(userHooks)
    // hookTypeCounts 集合读取`getHookTypeCounts`，供共享工具后续处理使用。
    const hookTypeCounts = getHookTypeCounts(userHooks)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(`tengu_run_hook`, {
      hookName:
        hookName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      numCommands: userHooks.length,
      hookTypeCounts: jsonStringify(
        hookTypeCounts,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(pluginHookCounts && {
        pluginHookCounts: jsonStringify(
          pluginHookCounts,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
  } else {
    // Fast-path: all hooks are internal callbacks (sessionFileAccessHooks,
    // attributionHooks). These return {} and don't use the abort signal, so we
    // can skip span/progress/abortSignal/processHookJSONOutput/resultLoop.
    // Measured: 6.01µs → ~1.8µs per PostToolUse hit (-70%).
    // batchStartTime记录时间`Date.now`，供共享工具后续处理使用。
    const batchStartTime = Date.now()
    // 上下文保存`toolUseContext`，供共享工具 hooks后续步骤使用。
    const context = toolUseContext
      ? {
          getAppState: toolUseContext.getAppState,
          updateAttributionState: toolUseContext.updateAttributionState,
        }
      : undefined
    // 遍历 const [i, { hook }] of matchingHooks.entries()，按顺序处理共享工具中的批量条目。
    for (const [i, { hook }] of matchingHooks.entries()) {
      // `hook.type` 命中特定值 `'callback'` 时，进入共享工具对应处理。
      if (hook.type === 'callback') {
        // 等待 `hook.callback(hookInput, toolUseID, signal, i, context)` 完成，再继续共享工具 hooks的异步流程。
        await hook.callback(hookInput, toolUseID, signal, i, context)
      }
    }
    // totalDurationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const totalDurationMs = Date.now() - batchStartTime
    // getStatsStore执行共享工具在此处需要的副作用或外部交互。
    getStatsStore()?.observe('hook_duration_ms', totalDurationMs)
    // addToTurnHookDuration执行共享工具在此处需要的副作用或外部交互。
    addToTurnHookDuration(totalDurationMs)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(`tengu_repl_hook_finished`, {
      hookName:
        hookName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      numCommands: matchingHooks.length,
      numSuccess: matchingHooks.length,
      numBlocking: 0,
      numNonBlockingError: 0,
      numCancelled: 0,
      totalDurationMs,
    })
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Collect hook definitions for beta tracing telemetry
  // hookDefinitionsJson保存`isBetaTracingEnabled`，供共享工具后续处理使用。
  const hookDefinitionsJson = isBetaTracingEnabled()
    ? jsonStringify(getHookDefinitionsForTelemetry(matchingHooks))
    : '[]'

  // Log hook execution start to OTEL (only for beta tracing)
  // 判断 isBetaTracingEnabled()，将共享工具分流到只适用于该条件的处理路径。
  if (isBetaTracingEnabled()) {
    // 显式忽略 `logOTelEvent('hook_execution_start', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('hook_execution_start', {
      hook_event: hookEvent,
      hook_name: hookName,
      num_hooks: String(matchingHooks.length),
      managed_only: String(shouldAllowManagedHooksOnly()),
      hook_definitions: hookDefinitionsJson,
      hook_source: shouldAllowManagedHooksOnly() ? 'policySettings' : 'merged',
    })
  }

  // Start hook span for beta tracing
  // hookSpan保存`startHookSpan`，供共享工具后续处理使用。
  const hookSpan = startHookSpan(
    hookEvent,
    hookName,
    matchingHooks.length,
    hookDefinitionsJson,
  )

  // Yield progress messages for each hook before execution
  // 遍历 const { hook } of matchingHooks，让共享工具逐项完成同一类处理。
  for (const { hook } of matchingHooks) {
    // 生成器产出 `{`，把阶段性结果交给上层消费。
    yield {
      message: {
        type: 'progress',
        data: {
          type: 'hook_progress',
          hookEvent,
          hookName,
          command: getHookDisplayText(hook),
          ...(hook.type === 'prompt' && { promptText: hook.prompt }),
          ...('statusMessage' in hook &&
            hook.statusMessage != null && {
              statusMessage: hook.statusMessage,
            }),
        },
        parentToolUseID: toolUseID,
        toolUseID,
        timestamp: new Date().toISOString(),
        uuid: randomUUID(),
      },
    }
  }

  // Track wall-clock time for the entire hook batch
  // batchStartTime记录时间`Date.now`，供共享工具后续处理使用。
  const batchStartTime = Date.now()

  // Lazy-once stringify of hookInput. Shared across all command/prompt/agent/http
  // hooks in this batch (hookInput is never mutated). Callback/function hooks
  // return before reaching this, so batches with only those pay no stringify cost.
  // 共享工具 hooks先整理这一处局部数据，后续分支可以直接读取。
  let jsonInputResult:
    | { ok: true; value: string }
    | { ok: false; error: unknown }
    | undefined
  // getJsonInput 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
  function getJsonInput() {
    // `jsonInputResult` 与 `undefined` 不一致时刷新派生状态。
    if (jsonInputResult !== undefined) {
      // 返回 jsonInputResult，把共享工具这个分支的结果交还调用方。
      return jsonInputResult
    }
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 返回 (jsonInputResult = { ok: true, value: jsonStringify(hookInput) })，把共享工具这个分支的结果交还调用方。
      return (jsonInputResult = { ok: true, value: jsonStringify(hookInput) })
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        Error(`Failed to stringify hook ${hookName} input`, { cause: error }),
      )
      // 返回 (jsonInputResult = { ok: false, error })，把共享工具这个分支的结果交还调用方。
      return (jsonInputResult = { ok: false, error })
    }
  }

  // Run all hooks in parallel with individual timeouts
  // hookPromises 集合派生`matchingHooks.map`，供共享工具后续处理使用。
  const hookPromises = matchingHooks.map(async function* (
    { hook, pluginRoot, pluginId, skillRoot },
    hookIndex,
  ): AsyncGenerator<HookResult> {
    // `hook.type` 命中特定值 `'callback'` 时，进入共享工具对应处理。
    if (hook.type === 'callback') {
      // callbackTimeoutMs 集合保存`hook.timeout ? hook.timeout * 1000 : timeoutMs`，供共享工具 hooks后续步骤使用。
      const callbackTimeoutMs = hook.timeout ? hook.timeout * 1000 : timeoutMs
      // 从 `createCombinedAbortSignal(` 解构 signal、cleanup，减少共享工具 hooks对同一对象的重复访问。
      const { signal: abortSignal, cleanup } = createCombinedAbortSignal(
        signal,
        { timeoutMs: callbackTimeoutMs },
      )
      // 生成器产出 `executeHookCallback({`，把阶段性结果交给上层消费。
      yield executeHookCallback({
        toolUseID,
        hook,
        hookEvent,
        hookInput,
        signal: abortSignal,
        hookIndex,
        toolUseContext,
      }).finally(cleanup)
      // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `hook.type` 命中特定值 `'function'` 时，进入共享工具对应处理。
    if (hook.type === 'function') {
      // messages 集合缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!messages) {
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_error_during_execution',
            hookName,
            toolUseID,
            hookEvent,
            content: 'Messages not provided for function hook',
          }),
          outcome: 'non_blocking_error',
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Function hooks only come from session storage with callback embedded
      // 生成器产出 `executeFunctionHook({`，把阶段性结果交给上层消费。
      yield executeFunctionHook({
        hook,
        messages,
        hookName,
        toolUseID,
        hookEvent,
        timeoutMs,
        signal,
      })
      // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Command and prompt hooks need jsonInput
    // commandTimeoutMs 命令数据保存`hook.timeout ? hook.timeout * 1000 : timeoutMs`，供共享工具 hooks后续步骤使用。
    const commandTimeoutMs = hook.timeout ? hook.timeout * 1000 : timeoutMs
    // 从 `createCombinedAbortSignal(signal, {` 解构 signal、cleanup，减少共享工具 hooks对同一对象的重复访问。
    const { signal: abortSignal, cleanup } = createCombinedAbortSignal(signal, {
      timeoutMs: commandTimeoutMs,
    })
    // hookId保存`randomUUID`，供共享工具后续处理使用。
    const hookId = randomUUID()
    // hookStartMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const hookStartMs = Date.now()
    // hookCommand 命令数据读取`getHookDisplayText`，供共享工具后续处理使用。
    const hookCommand = getHookDisplayText(hook)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // jsonInputRes 集合读取`getJsonInput`，供共享工具后续处理使用。
      const jsonInputRes = getJsonInput()
      // jsonInputRes.ok缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!jsonInputRes.ok) {
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_error_during_execution',
            hookName,
            toolUseID,
            hookEvent,
            content: `Failed to prepare hook input: ${errorMessage(jsonInputRes.error)}`,
            command: hookCommand,
            durationMs: Date.now() - hookStartMs,
          }),
          outcome: 'non_blocking_error',
          hook,
        }
        // cleanup执行共享工具在此处需要的副作用或外部交互。
        cleanup()
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // jsonInput保存`jsonInputRes.value`，供共享工具 hooks后续步骤使用。
      const jsonInput = jsonInputRes.value

      // `hook.type` 命中特定值 `'prompt'` 时，进入共享工具对应处理。
      if (hook.type === 'prompt') {
        // toolUseContext缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
        if (!toolUseContext) {
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            'ToolUseContext is required for prompt hooks. This is a bug.',
          )
        }
        // promptResult保存`execPromptHook`，供共享工具后续处理使用。
        const promptResult = await execPromptHook(
          hook,
          hookName,
          hookEvent,
          jsonInput,
          abortSignal,
          toolUseContext,
          messages,
          toolUseID,
        )
        // Inject timing fields for hook visibility
        // `promptResult.message?.type` 命中特定值 `'attachment'` 时，进入共享工具对应处理。
        if (promptResult.message?.type === 'attachment') {
          // att保存`promptResult.message.attachment`，供共享工具 hooks后续步骤使用。
          const att = promptResult.message.attachment
          // 共享工具在这里进入条件判断，后续代码按实际状态分流。
          if (
            att.type === 'hook_success' ||
            att.type === 'hook_non_blocking_error'
          ) {
            // command 命令数据更新为 `hookCommand`，确保共享工具后续读取最新状态。
            att.command = hookCommand
            // durationMs 集合更新为 `Date.now() - hookStartMs`，确保共享工具后续读取最新状态。
            att.durationMs = Date.now() - hookStartMs
          }
        }
        // 生成器产出 `promptResult`，把阶段性结果交给上层消费。
        yield promptResult
        // 调用 cleanup?.()，完成这一处局部操作。
        cleanup?.()
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // `hook.type` 命中特定值 `'agent'` 时，进入共享工具对应处理。
      if (hook.type === 'agent') {
        // toolUseContext缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
        if (!toolUseContext) {
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            'ToolUseContext is required for agent hooks. This is a bug.',
          )
        }
        // messages 集合缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
        if (!messages) {
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            'Messages are required for agent hooks. This is a bug.',
          )
        }
        // agentResult保存`execAgentHook`，供共享工具后续处理使用。
        const agentResult = await execAgentHook(
          hook,
          hookName,
          hookEvent,
          jsonInput,
          abortSignal,
          toolUseContext,
          toolUseID,
          messages,
          'agent_type' in hookInput
            ? (hookInput.agent_type as string)
            : undefined,
        )
        // Inject timing fields for hook visibility
        // `agentResult.message?.type` 命中特定值 `'attachment'` 时，进入共享工具对应处理。
        if (agentResult.message?.type === 'attachment') {
          // att保存`agentResult.message.attachment`，供共享工具 hooks后续步骤使用。
          const att = agentResult.message.attachment
          // 共享工具在这里进入条件判断，后续代码按实际状态分流。
          if (
            att.type === 'hook_success' ||
            att.type === 'hook_non_blocking_error'
          ) {
            // command 命令数据更新为 `hookCommand`，确保共享工具后续读取最新状态。
            att.command = hookCommand
            // durationMs 集合更新为 `Date.now() - hookStartMs`，确保共享工具后续读取最新状态。
            att.durationMs = Date.now() - hookStartMs
          }
        }
        // 生成器产出 `agentResult`，把阶段性结果交给上层消费。
        yield agentResult
        // 调用 cleanup?.()，完成这一处局部操作。
        cleanup?.()
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // `hook.type` 命中特定值 `'http'` 时，进入共享工具对应处理。
      if (hook.type === 'http') {
        // emitHookStarted执行共享工具在此处需要的副作用或外部交互。
        emitHookStarted(hookId, hookName, hookEvent)

        // execHttpHook manages its own timeout internally via hook.timeout or
        // DEFAULT_HTTP_HOOK_TIMEOUT_MS, so pass the parent signal directly
        // to avoid double-stacking timeouts with abortSignal.
        // httpResult保存`execHttpHook`，供共享工具后续处理使用。
        const httpResult = await execHttpHook(
          hook,
          hookEvent,
          jsonInput,
          signal,
        )
        // 调用 cleanup?.()，完成这一处局部操作。
        cleanup?.()

        // 满足 `httpResult.aborted` 时，共享工具执行该分支。
        if (httpResult.aborted) {
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: 'Hook cancelled',
            stdout: '',
            stderr: '',
            exitCode: undefined,
            outcome: 'cancelled',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_cancelled',
              hookName,
              toolUseID,
              hookEvent,
            }),
            outcome: 'cancelled' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 组合条件 `httpResult.error || !httpResult.ok` 成立时，共享工具才启用这条专门路径。
        if (httpResult.error || !httpResult.ok) {
          // stderr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const stderr =
            httpResult.error || `HTTP ${httpResult.statusCode} from ${hook.url}`
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: stderr,
            stdout: '',
            stderr,
            exitCode: httpResult.statusCode,
            outcome: 'error',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_non_blocking_error',
              hookName,
              toolUseID,
              hookEvent,
              stderr,
              stdout: '',
              exitCode: httpResult.statusCode ?? 0,
            }),
            outcome: 'non_blocking_error' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // HTTP hooks must return JSON — parse and validate through Zod
        // 共享工具 hooks先整理这一处局部数据，后续分支可以直接读取。
        const { json: httpJson, validationError: httpValidationError } =
          parseHttpHookOutput(httpResult.body)

        // 满足 `httpValidationError` 时，共享工具执行该分支。
        if (httpValidationError) {
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: httpResult.body,
            stdout: httpResult.body,
            stderr: `JSON validation failed: ${httpValidationError}`,
            exitCode: httpResult.statusCode,
            outcome: 'error',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_non_blocking_error',
              hookName,
              toolUseID,
              hookEvent,
              stderr: `JSON validation failed: ${httpValidationError}`,
              stdout: httpResult.body,
              exitCode: httpResult.statusCode ?? 0,
            }),
            outcome: 'non_blocking_error' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 判断 httpJson && isAsyncHookJSONOutput(httpJson)，将共享工具分流到只适用于该条件的处理路径。
        if (httpJson && isAsyncHookJSONOutput(httpJson)) {
          // Async response: treat as success (no further processing)
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: httpResult.body,
            stdout: httpResult.body,
            stderr: '',
            exitCode: httpResult.statusCode,
            outcome: 'success',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            outcome: 'success' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 满足 `httpJson` 时，共享工具执行该分支。
        if (httpJson) {
          // processed保存`processHookJSONOutput`，供共享工具后续处理使用。
          const processed = processHookJSONOutput({
            json: httpJson,
            command: hook.url,
            hookName,
            toolUseID,
            hookEvent,
            expectedHookEvent: hookEvent,
            stdout: httpResult.body,
            stderr: '',
            exitCode: httpResult.statusCode,
          })
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: httpResult.body,
            stdout: httpResult.body,
            stderr: '',
            exitCode: httpResult.statusCode,
            outcome: 'success',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            ...processed,
            outcome: 'success' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // emitHookStarted执行共享工具在此处需要的副作用或外部交互。
      emitHookStarted(hookId, hookName, hookEvent)

      // 结果保存`execCommandHook`，供共享工具后续处理使用。
      const result = await execCommandHook(
        hook,
        hookEvent,
        hookName,
        jsonInput,
        abortSignal,
        hookId,
        hookIndex,
        pluginRoot,
        pluginId,
        skillRoot,
        forceSyncExecution,
        boundRequestPrompt,
      )
      // 调用 cleanup?.()，完成这一处局部操作。
      cleanup?.()
      // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
      const durationMs = Date.now() - hookStartMs

      // 满足 `result.backgrounded` 时，共享工具执行该分支。
      if (result.backgrounded) {
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          outcome: 'success' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `result.aborted` 时，共享工具执行该分支。
      if (result.aborted) {
        // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
        emitHookResponse({
          hookId,
          hookName,
          hookEvent,
          output: result.output,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.status,
          outcome: 'cancelled',
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_cancelled',
            hookName,
            toolUseID,
            hookEvent,
            command: hookCommand,
            durationMs,
          }),
          outcome: 'cancelled' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Try JSON parsing first
      // 从 `parseHookOutput(` 解构 json、plainText、validationError，减少共享工具 hooks对同一对象的重复访问。
      const { json, plainText, validationError } = parseHookOutput(
        result.stdout,
      )

      // 满足 `validationError` 时，共享工具执行该分支。
      if (validationError) {
        // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
        emitHookResponse({
          hookId,
          hookName,
          hookEvent,
          output: result.output,
          stdout: result.stdout,
          stderr: `JSON validation failed: ${validationError}`,
          exitCode: 1,
          outcome: 'error',
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_non_blocking_error',
            hookName,
            toolUseID,
            hookEvent,
            stderr: `JSON validation failed: ${validationError}`,
            stdout: result.stdout,
            exitCode: 1,
            command: hookCommand,
            durationMs,
          }),
          outcome: 'non_blocking_error' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `json` 时，共享工具执行该分支。
      if (json) {
        // Async responses were already backgrounded during execution
        // 判断 isAsyncHookJSONOutput(json)，将共享工具分流到只适用于该条件的处理路径。
        if (isAsyncHookJSONOutput(json)) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            outcome: 'success' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Process JSON output
        // processed保存`processHookJSONOutput`，供共享工具后续处理使用。
        const processed = processHookJSONOutput({
          json,
          command: hookCommand,
          hookName,
          toolUseID,
          hookEvent,
          expectedHookEvent: hookEvent,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.status,
          durationMs,
        })

        // Handle suppressOutput (skip for async responses)
        // 共享工具在这里进入条件判断，后续代码按实际状态分流。
        if (
          isSyncHookJSONOutput(json) &&
          !json.suppressOutput &&
          plainText &&
          result.status === 0
        ) {
          // Still show non-JSON output if not suppressed
          // content保存`chalk.bold`，供共享工具后续处理使用。
          const content = `${chalk.bold(hookName)} completed`
          // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
          emitHookResponse({
            hookId,
            hookName,
            hookEvent,
            output: result.output,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.status,
            outcome: 'success',
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            ...processed,
            message:
              processed.message ||
              createAttachmentMessage({
                type: 'hook_success',
                hookName,
                toolUseID,
                hookEvent,
                content,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.status,
                command: hookCommand,
                durationMs,
              }),
            outcome: 'success' as const,
            hook,
          }
          // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
        emitHookResponse({
          hookId,
          hookName,
          hookEvent,
          output: result.output,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.status,
          outcome: result.status === 0 ? 'success' : 'error',
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          ...processed,
          outcome: 'success' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Fall back to existing logic for non-JSON output
      // 满足 `result.status === 0` 时，共享工具执行该分支。
      if (result.status === 0) {
        // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
        emitHookResponse({
          hookId,
          hookName,
          hookEvent,
          output: result.output,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.status,
          outcome: 'success',
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_success',
            hookName,
            toolUseID,
            hookEvent,
            content: result.stdout.trim(),
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.status,
            command: hookCommand,
            durationMs,
          }),
          outcome: 'success' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Hooks with exit code 2 provide blocking feedback
      // 满足 `result.status === 2` 时，共享工具执行该分支。
      if (result.status === 2) {
        // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
        emitHookResponse({
          hookId,
          hookName,
          hookEvent,
          output: result.output,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.status,
          outcome: 'error',
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          blockingError: {
            blockingError: `[${hook.command}]: ${result.stderr || 'No stderr output'}`,
            command: hook.command,
          },
          outcome: 'blocking' as const,
          hook,
        }
        // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Any other non-zero exit code is a non-critical error that should just
      // be shown to the user.
      // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
      emitHookResponse({
        hookId,
        hookName,
        hookEvent,
        output: result.output,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.status,
        outcome: 'error',
      })
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        message: createAttachmentMessage({
          type: 'hook_non_blocking_error',
          hookName,
          toolUseID,
          hookEvent,
          stderr: `Failed with non-blocking status code: ${result.stderr.trim() || 'No stderr output'}`,
          stdout: result.stdout,
          exitCode: result.status,
          command: hookCommand,
          durationMs,
        }),
        outcome: 'non_blocking_error' as const,
        hook,
      }
      // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (error) {
      // Clean up on error
      // 调用 cleanup?.()，完成这一处局部操作。
      cleanup?.()

      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // emitHookResponse执行共享工具在此处需要的副作用或外部交互。
      emitHookResponse({
        hookId,
        hookName,
        hookEvent,
        output: `Failed to run: ${errorMessage}`,
        stdout: '',
        stderr: `Failed to run: ${errorMessage}`,
        exitCode: 1,
        outcome: 'error',
      })
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        message: createAttachmentMessage({
          type: 'hook_non_blocking_error',
          hookName,
          toolUseID,
          hookEvent,
          stderr: `Failed to run: ${errorMessage}`,
          stdout: '',
          exitCode: 1,
          command: hookCommand,
          durationMs: Date.now() - hookStartMs,
        }),
        outcome: 'non_blocking_error' as const,
        hook,
      }
      // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  })

  // Track outcomes for logging
  // outcomes 集合集中保存共享工具 hooks要一起传递的字段。
  const outcomes = {
    success: 0,
    blocking: 0,
    non_blocking_error: 0,
    cancelled: 0,
  }

  // permissionBehavior 权限数据先声明占位，稍后的分支会根据实际输入补齐。
  let permissionBehavior: PermissionResult['behavior'] | undefined

  // Run all hooks in parallel and wait for all to complete
  // 遍历 const result of all(hookPromises)，按顺序处理共享工具中的批量条目。
  for await (const result of all(hookPromises)) {
    // 共享工具 hooks处理 `outcomes[result.outcome]++`，完成这一小步状态转换。
    outcomes[result.outcome]++

    // Check for preventContinuation early
    // 满足 `result.preventContinuation` 时，共享工具执行该分支。
    if (result.preventContinuation) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) requested preventContinuation`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        preventContinuation: true,
        stopReason: result.stopReason,
      }
    }

    // Handle different result types
    // 满足 `result.blockingError` 时，共享工具执行该分支。
    if (result.blockingError) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        blockingError: result.blockingError,
      }
    }

    // 满足 `result.message` 时，共享工具执行该分支。
    if (result.message) {
      // 生成器产出 `{ message: result.message }`，把阶段性结果交给上层消费。
      yield { message: result.message }
    }

    // Yield system message separately if present
    // 满足 `result.systemMessage` 时，共享工具执行该分支。
    if (result.systemMessage) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        message: createAttachmentMessage({
          type: 'hook_system_message',
          content: result.systemMessage,
          hookName,
          toolUseID,
          hookEvent,
        }),
      }
    }

    // Collect additional context from hooks
    // 满足 `result.additionalContext` 时，共享工具执行该分支。
    if (result.additionalContext) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) provided additionalContext (${result.additionalContext.length} chars)`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        additionalContexts: [result.additionalContext],
      }
    }

    // 满足 `result.initialUserMessage` 时，共享工具执行该分支。
    if (result.initialUserMessage) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) provided initialUserMessage (${result.initialUserMessage.length} chars)`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        initialUserMessage: result.initialUserMessage,
      }
    }

    // 组合条件 `result.watchPaths && result.watchPaths.length > 0` 成立时，共享工具才启用这条专门路径。
    if (result.watchPaths && result.watchPaths.length > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) provided ${result.watchPaths.length} watchPaths`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        watchPaths: result.watchPaths,
      }
    }

    // Yield updatedMCPToolOutput if provided (from PostToolUse hooks)
    // 满足 `result.updatedMCPToolOutput` 时，共享工具执行该分支。
    if (result.updatedMCPToolOutput) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) replaced MCP tool output`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        updatedMCPToolOutput: result.updatedMCPToolOutput,
      }
    }

    // Check for permission behavior with precedence: deny > ask > allow
    // 满足 `result.permissionBehavior` 时，共享工具执行该分支。
    if (result.permissionBehavior) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) returned permissionDecision: ${result.permissionBehavior}${result.hookPermissionDecisionReason ? ` (reason: ${result.hookPermissionDecisionReason})` : ''}`,
      )
      // Apply precedence rules
      // 按照 result.permissionBehavior 的取值选择共享工具的具体处理分支。
      switch (result.permissionBehavior) {
        case 'deny':
          // deny always takes precedence
          // permissionBehavior 权限数据更新为 `'deny'`，确保共享工具后续读取最新状态。
          permissionBehavior = 'deny'
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'ask':
          // ask takes precedence over allow but not deny
          // `permissionBehavior` 与 `'deny'` 不一致时刷新派生状态。
          if (permissionBehavior !== 'deny') {
            // permissionBehavior 权限数据更新为 `'ask'`，确保共享工具后续读取最新状态。
            permissionBehavior = 'ask'
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'allow':
          // allow only if no other behavior set
          // permissionBehavior 权限数据缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
          if (!permissionBehavior) {
            // permissionBehavior 权限数据更新为 `'allow'`，确保共享工具后续读取最新状态。
            permissionBehavior = 'allow'
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'passthrough':
          // passthrough doesn't set permission behavior
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
      }
    }

    // Yield permission behavior and updatedInput if provided (from allow or ask behavior)
    // `permissionBehavior` 与 `undefined` 不一致时刷新派生状态。
    if (permissionBehavior !== undefined) {
      // updatedInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const updatedInput =
        result.updatedInput &&
        (result.permissionBehavior === 'allow' ||
          result.permissionBehavior === 'ask')
          ? result.updatedInput
          : undefined
      // 满足 `updatedInput` 时，共享工具执行该分支。
      if (updatedInput) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) modified tool input keys: [${Object.keys(updatedInput).join(', ')}]`,
        )
      }
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        permissionBehavior,
        hookPermissionDecisionReason: result.hookPermissionDecisionReason,
        // 这个回调绑定到 hookSource: matchingHooks.find(m => m.hook === result.hook)?.hookSource,，负责共享工具在该局部场景下的响应。
        hookSource: matchingHooks.find(m => m.hook === result.hook)?.hookSource,
        updatedInput,
      }
    }

    // Yield updatedInput separately for passthrough case (no permission decision)
    // This allows hooks to modify input without making a permission decision
    // Note: Check result.permissionBehavior (this hook's behavior), not the aggregated permissionBehavior
    // 组合条件 `result.updatedInput && result.permissionBehavior` 成立时，共享工具才启用这条专门路径。
    if (result.updatedInput && result.permissionBehavior === undefined) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook ${hookEvent} (${getHookDisplayText(result.hook)}) modified tool input keys: [${Object.keys(result.updatedInput).join(', ')}]`,
      )
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        updatedInput: result.updatedInput,
      }
    }
    // Yield permission request result if provided (from PermissionRequest hooks)
    // 满足 `result.permissionRequestResult` 时，共享工具执行该分支。
    if (result.permissionRequestResult) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        permissionRequestResult: result.permissionRequestResult,
      }
    }
    // Yield retry flag if provided (from PermissionDenied hooks)
    // 满足 `result.retry` 时，共享工具执行该分支。
    if (result.retry) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        retry: result.retry,
      }
    }
    // Yield elicitation response if provided (from Elicitation hooks)
    // 满足 `result.elicitationResponse` 时，共享工具执行该分支。
    if (result.elicitationResponse) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        elicitationResponse: result.elicitationResponse,
      }
    }
    // Yield elicitation result response if provided (from ElicitationResult hooks)
    // 满足 `result.elicitationResultResponse` 时，共享工具执行该分支。
    if (result.elicitationResultResponse) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        elicitationResultResponse: result.elicitationResultResponse,
      }
    }

    // Invoke session hook callback if this is a command/prompt/function hook (not a callback hook)
    // `appState && result.hook.type` 与 `'callback'` 不一致时刷新派生状态。
    if (appState && result.hook.type !== 'callback') {
      // sessionId读取`getSessionId`，供共享工具后续处理使用。
      const sessionId = getSessionId()
      // Use empty string as matcher when matchQuery is undefined (e.g., for Stop hooks)
      // matcher保存`matchQuery ?? ''`，供共享工具 hooks后续步骤使用。
      const matcher = matchQuery ?? ''
      // hookEntry读取`getSessionHookCallback`，供共享工具后续处理使用。
      const hookEntry = getSessionHookCallback(
        appState,
        sessionId,
        hookEvent,
        matcher,
        result.hook,
      )
      // Invoke onHookSuccess only on success outcome
      // 组合条件 `hookEntry?.onHookSuccess && result.outcome === 's` 成立时，共享工具才启用这条专门路径。
      if (hookEntry?.onHookSuccess && result.outcome === 'success') {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // hookEntry.onHookSuccess执行共享工具在此处需要的副作用或外部交互。
          hookEntry.onHookSuccess(result.hook, result as AggregatedHookResult)
        } catch (error) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(
            Error('Session hook success callback failed', { cause: error }),
          )
        }
      }
    }
  }

  // totalDurationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const totalDurationMs = Date.now() - batchStartTime
  // getStatsStore执行共享工具在此处需要的副作用或外部交互。
  getStatsStore()?.observe('hook_duration_ms', totalDurationMs)
  // addToTurnHookDuration执行共享工具在此处需要的副作用或外部交互。
  addToTurnHookDuration(totalDurationMs)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent(`tengu_repl_hook_finished`, {
    hookName:
      hookName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    numCommands: matchingHooks.length,
    numSuccess: outcomes.success,
    numBlocking: outcomes.blocking,
    numNonBlockingError: outcomes.non_blocking_error,
    numCancelled: outcomes.cancelled,
    totalDurationMs,
  })

  // Log hook execution completion to OTEL (only for beta tracing)
  // 判断 isBetaTracingEnabled()，将共享工具分流到只适用于该条件的处理路径。
  if (isBetaTracingEnabled()) {
    // hookDefinitionsComplete 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hookDefinitionsComplete =
      getHookDefinitionsForTelemetry(matchingHooks)

    // 显式忽略 `logOTelEvent('hook_execution_complete', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('hook_execution_complete', {
      hook_event: hookEvent,
      hook_name: hookName,
      num_hooks: String(matchingHooks.length),
      num_success: String(outcomes.success),
      num_blocking: String(outcomes.blocking),
      num_non_blocking_error: String(outcomes.non_blocking_error),
      num_cancelled: String(outcomes.cancelled),
      managed_only: String(shouldAllowManagedHooksOnly()),
      hook_definitions: jsonStringify(hookDefinitionsComplete),
      hook_source: shouldAllowManagedHooksOnly() ? 'policySettings' : 'merged',
    })
  }

  // End hook span for beta tracing
  // endHookSpan执行共享工具在此处需要的副作用或外部交互。
  endHookSpan(hookSpan, {
    numSuccess: outcomes.success,
    numBlocking: outcomes.blocking,
    numNonBlockingError: outcomes.non_blocking_error,
    numCancelled: outcomes.cancelled,
  })
}

// HookOutsideReplResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookOutsideReplResult = {
  command: string
  succeeded: boolean
  output: string
  blocked: boolean
  watchPaths?: string[]
  systemMessage?: string
}

// hasBlockingResult 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function hasBlockingResult(results: HookOutsideReplResult[]): boolean {
  // 返回 results.some(r => r.blocked)，把共享工具这个分支的结果交还调用方。
  return results.some(r => r.blocked)
}

/**
 * Execute hooks outside of the REPL (e.g. notifications, session end)
 *
 * Unlike executeHooks() which yields messages that are exposed to the model as
 * system messages, this function only logs errors via logForDebugging (visible
 * with --debug). Callers that need to surface errors to users should handle
 * the returned results appropriately (e.g. executeSessionEndHooks writes to
 * stderr during shutdown).
 *
 * @param getAppState Optional function to get the current app state (for session hooks)
 * @param hookInput The structured hook input that will be validated and converted to JSON
 * @param matchQuery The query to match against hook matchers
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Array of HookOutsideReplResult objects containing command, succeeded, and output
 */
// executeHooksOutsideREPL 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
async function executeHooksOutsideREPL({
  getAppState,
  hookInput,
  matchQuery,
  signal,
  timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
}: {
  // 这个回调绑定到 getAppState?: () => AppState，负责共享工具在该局部场景下的响应。
  getAppState?: () => AppState
  hookInput: HookInput
  matchQuery?: string
  signal?: AbortSignal
  timeoutMs: number
}): Promise<HookOutsideReplResult[]> {
  // 判断 isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)，将共享工具分流到只适用于该条件的处理路径。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // hookEvent保存`hookInput.hook_event_name`，供共享工具 hooks后续步骤使用。
  const hookEvent = hookInput.hook_event_name
  // hookName保存`matchQuery ? `${hookEvent}:${matchQuery}` : hookEvent`，供共享工具 hooks后续步骤使用。
  const hookName = matchQuery ? `${hookEvent}:${matchQuery}` : hookEvent
  // 判断 shouldDisableAllHooksIncludingManaged()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldDisableAllHooksIncludingManaged()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping hooks for ${hookName} due to 'disableAllHooks' managed setting`,
    )
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // SECURITY: ALL hooks require workspace trust in interactive mode
  // This centralized check prevents RCE vulnerabilities for all current and future hooks
  // 判断 shouldSkipHookDueToTrust()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldSkipHookDueToTrust()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping ${hookName} hook execution - workspace trust not accepted`,
    )
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // 应用状态读取`getAppState`，供共享工具后续处理使用。
  const appState = getAppState ? getAppState() : undefined
  // Use main session ID for outside-REPL hooks
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // matchingHooks 集合读取`getMatchingHooks`，供共享工具后续处理使用。
  const matchingHooks = await getMatchingHooks(
    appState,
    sessionId,
    hookEvent,
    hookInput,
  )
  // matchingHooks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (matchingHooks.length === 0) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // 满足 `signal?.aborted` 时，共享工具执行该分支。
  if (signal?.aborted) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // userHooks 集合筛选`matchingHooks.filter`，供共享工具后续处理使用。
  const userHooks = matchingHooks.filter(h => !isInternalHook(h))
  // 满足 `userHooks.length > 0` 时，共享工具执行该分支。
  if (userHooks.length > 0) {
    // pluginHookCounts 集合读取`getPluginHookCounts`，供共享工具后续处理使用。
    const pluginHookCounts = getPluginHookCounts(userHooks)
    // hookTypeCounts 集合读取`getHookTypeCounts`，供共享工具后续处理使用。
    const hookTypeCounts = getHookTypeCounts(userHooks)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(`tengu_run_hook`, {
      hookName:
        hookName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      numCommands: userHooks.length,
      hookTypeCounts: jsonStringify(
        hookTypeCounts,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(pluginHookCounts && {
        pluginHookCounts: jsonStringify(
          pluginHookCounts,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
  }

  // Validate and stringify the hook input
  // jsonInput先声明占位，稍后的分支会根据实际输入补齐。
  let jsonInput: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // jsonInput更新为 `jsonStringify(hookInput)`，确保共享工具后续读取最新状态。
    jsonInput = jsonStringify(hookInput)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // Run all hooks in parallel with individual timeouts
  // hookPromises 集合派生`matchingHooks.map`，供共享工具后续处理使用。
  const hookPromises = matchingHooks.map(
    // async执行共享工具在此处需要的副作用或外部交互。
    async ({ hook, pluginRoot, pluginId }, hookIndex) => {
      // Handle callback hooks
      // `hook.type` 命中特定值 `'callback'` 时，进入共享工具对应处理。
      if (hook.type === 'callback') {
        // callbackTimeoutMs 集合保存`hook.timeout ? hook.timeout * 1000 : timeoutMs`，供共享工具 hooks后续步骤使用。
        const callbackTimeoutMs = hook.timeout ? hook.timeout * 1000 : timeoutMs
        // 从 `createCombinedAbortSignal(` 解构 signal、cleanup，减少共享工具 hooks对同一对象的重复访问。
        const { signal: abortSignal, cleanup } = createCombinedAbortSignal(
          signal,
          { timeoutMs: callbackTimeoutMs },
        )

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // toolUseID保存`randomUUID`，供共享工具后续处理使用。
          const toolUseID = randomUUID()
          // json保存`hook.callback`，供共享工具后续处理使用。
          const json = await hook.callback(
            hookInput,
            toolUseID,
            abortSignal,
            hookIndex,
          )

          // 调用 cleanup?.()，完成这一处局部操作。
          cleanup?.()

          // 判断 isAsyncHookJSONOutput(json)，将共享工具分流到只适用于该条件的处理路径。
          if (isAsyncHookJSONOutput(json)) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `${hookName} [callback] returned async response, returning empty output`,
            )
            // 返回 {，把共享工具这个分支的结果交还调用方。
            return {
              command: 'callback',
              succeeded: true,
              output: '',
              blocked: false,
            }
          }

          // output 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const output =
            hookEvent === 'WorktreeCreate' &&
            isSyncHookJSONOutput(json) &&
            json.hookSpecificOutput?.hookEventName === 'WorktreeCreate'
              ? json.hookSpecificOutput.worktreePath
              : json.systemMessage || ''
          // blocked 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const blocked =
            isSyncHookJSONOutput(json) && json.decision === 'block'

          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`${hookName} [callback] completed successfully`)

          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            command: 'callback',
            succeeded: true,
            output,
            blocked,
          }
        } catch (error) {
          // 调用 cleanup?.()，完成这一处局部操作。
          cleanup?.()

          // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `${hookName} [callback] failed to run: ${errorMessage}`,
            { level: 'error' },
          )
          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            command: 'callback',
            succeeded: false,
            output: errorMessage,
            blocked: false,
          }
        }
      }

      // TODO: Implement prompt stop hooks outside REPL
      // `hook.type` 命中特定值 `'prompt'` 时，进入共享工具对应处理。
      if (hook.type === 'prompt') {
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          command: hook.prompt,
          succeeded: false,
          output: 'Prompt stop hooks are not yet supported outside REPL',
          blocked: false,
        }
      }

      // TODO: Implement agent stop hooks outside REPL
      // `hook.type` 命中特定值 `'agent'` 时，进入共享工具对应处理。
      if (hook.type === 'agent') {
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          command: hook.prompt,
          succeeded: false,
          output: 'Agent stop hooks are not yet supported outside REPL',
          blocked: false,
        }
      }

      // Function hooks require messages array (only available in REPL context)
      // For -p mode Stop hooks, use executeStopHooks which supports function hooks
      // `hook.type` 命中特定值 `'function'` 时，进入共享工具对应处理。
      if (hook.type === 'function') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Function hook reached executeHooksOutsideREPL for ${hookEvent}. Function hooks should only be used in REPL context (Stop hooks).`,
          ),
        )
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          command: 'function',
          succeeded: false,
          output: 'Internal error: function hook executed outside REPL context',
          blocked: false,
        }
      }

      // Handle HTTP hooks (no toolUseContext needed - just HTTP POST).
      // execHttpHook handles its own timeout internally via hook.timeout or
      // DEFAULT_HTTP_HOOK_TIMEOUT_MS, so we pass signal directly.
      // `hook.type` 命中特定值 `'http'` 时，进入共享工具对应处理。
      if (hook.type === 'http') {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // httpResult保存`execHttpHook`，供共享工具后续处理使用。
          const httpResult = await execHttpHook(
            hook,
            hookEvent,
            jsonInput,
            signal,
          )

          // 满足 `httpResult.aborted` 时，共享工具执行该分支。
          if (httpResult.aborted) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`${hookName} [${hook.url}] cancelled`)
            // 返回 {，把共享工具这个分支的结果交还调用方。
            return {
              command: hook.url,
              succeeded: false,
              output: 'Hook cancelled',
              blocked: false,
            }
          }

          // 组合条件 `httpResult.error || !httpResult.ok` 成立时，共享工具才启用这条专门路径。
          if (httpResult.error || !httpResult.ok) {
            // errMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const errMsg =
              httpResult.error ||
              `HTTP ${httpResult.statusCode} from ${hook.url}`
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`${hookName} [${hook.url}] failed: ${errMsg}`, {
              level: 'error',
            })
            // 返回 {，把共享工具这个分支的结果交还调用方。
            return {
              command: hook.url,
              succeeded: false,
              output: errMsg,
              blocked: false,
            }
          }

          // HTTP hooks must return JSON — parse and validate through Zod
          // 共享工具 hooks先整理这一处局部数据，后续分支可以直接读取。
          const { json: httpJson, validationError: httpValidationError } =
            parseHttpHookOutput(httpResult.body)
          // 满足 `httpValidationError` 时，共享工具执行该分支。
          if (httpValidationError) {
            // 抛出 new Error(httpValidationError)，阻止共享工具在无效状态下继续运行。
            throw new Error(httpValidationError)
          }
          // 判断 httpJson && !isAsyncHookJSONOutput(httpJson)，将共享工具分流到只适用于该条件的处理路径。
          if (httpJson && !isAsyncHookJSONOutput(httpJson)) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Parsed JSON output from HTTP hook: ${jsonStringify(httpJson)}`,
              { level: 'verbose' },
            )
          }
          // jsonBlocked 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const jsonBlocked =
            httpJson &&
            !isAsyncHookJSONOutput(httpJson) &&
            isSyncHookJSONOutput(httpJson) &&
            httpJson.decision === 'block'

          // WorktreeCreate's consumer reads `output` as the bare filesystem
          // path. Command hooks provide it via stdout; http hooks provide it
          // via hookSpecificOutput.worktreePath. Without worktreePath, emit ''
          // so the consumer's length filter skips it instead of treating the
          // raw '{}' body as a path.
          // output 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const output =
            hookEvent === 'WorktreeCreate'
              ? httpJson &&
                isSyncHookJSONOutput(httpJson) &&
                httpJson.hookSpecificOutput?.hookEventName === 'WorktreeCreate'
                ? httpJson.hookSpecificOutput.worktreePath
                : ''
              : httpResult.body

          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            command: hook.url,
            succeeded: true,
            output,
            blocked: !!jsonBlocked,
          }
        } catch (error) {
          // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `${hookName} [${hook.url}] failed to run: ${errorMessage}`,
            { level: 'error' },
          )
          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            command: hook.url,
            succeeded: false,
            output: errorMessage,
            blocked: false,
          }
        }
      }

      // Handle command hooks
      // commandTimeoutMs 命令数据保存`hook.timeout ? hook.timeout * 1000 : timeoutMs`，供共享工具 hooks后续步骤使用。
      const commandTimeoutMs = hook.timeout ? hook.timeout * 1000 : timeoutMs
      // 从 `createCombinedAbortSignal(` 解构 signal、cleanup，减少共享工具 hooks对同一对象的重复访问。
      const { signal: abortSignal, cleanup } = createCombinedAbortSignal(
        signal,
        { timeoutMs: commandTimeoutMs },
      )
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果保存`execCommandHook`，供共享工具后续处理使用。
        const result = await execCommandHook(
          hook,
          hookEvent,
          hookName,
          jsonInput,
          abortSignal,
          randomUUID(),
          hookIndex,
          pluginRoot,
          pluginId,
        )

        // Clear timeout if hook completes
        // 调用 cleanup?.()，完成这一处局部操作。
        cleanup?.()

        // 满足 `result.aborted` 时，共享工具执行该分支。
        if (result.aborted) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`${hookName} [${hook.command}] cancelled`)
          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            command: hook.command,
            succeeded: false,
            output: 'Hook cancelled',
            blocked: false,
          }
        }

        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `${hookName} [${hook.command}] completed with status ${result.status}`,
        )

        // Parse JSON for any messages to print out.
        // 从 `parseHookOutput(result.stdout)` 解构 json、validationError，减少共享工具 hooks对同一对象的重复访问。
        const { json, validationError } = parseHookOutput(result.stdout)
        // 满足 `validationError` 时，共享工具执行该分支。
        if (validationError) {
          // Validation error is logged via logForDebugging and returned in output
          // 抛出 new Error(validationError)，阻止共享工具在无效状态下继续运行。
          throw new Error(validationError)
        }
        // 判断 json && !isAsyncHookJSONOutput(json)，将共享工具分流到只适用于该条件的处理路径。
        if (json && !isAsyncHookJSONOutput(json)) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Parsed JSON output from hook: ${jsonStringify(json)}`,
            { level: 'verbose' },
          )
        }

        // Blocked if exit code 2 or JSON decision: 'block'
        // jsonBlocked 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const jsonBlocked =
          json &&
          !isAsyncHookJSONOutput(json) &&
          isSyncHookJSONOutput(json) &&
          json.decision === 'block'
        // blocked记录当前扫描状态，共享工具 hooks随后按该状态分支。
        const blocked = result.status === 2 || !!jsonBlocked

        // For successful hooks (exit code 0), use stdout; for failed hooks, use stderr
        // output 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const output =
          result.status === 0 ? result.stdout || '' : result.stderr || ''

        // watchPaths 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const watchPaths =
          json &&
          isSyncHookJSONOutput(json) &&
          json.hookSpecificOutput &&
          'watchPaths' in json.hookSpecificOutput
            ? json.hookSpecificOutput.watchPaths
            : undefined

        // systemMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const systemMessage =
          json && isSyncHookJSONOutput(json) ? json.systemMessage : undefined

        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          command: hook.command,
          succeeded: result.status === 0,
          output,
          blocked,
          watchPaths,
          systemMessage,
        }
      } catch (error) {
        // Clean up on error
        // 调用 cleanup?.()，完成这一处局部操作。
        cleanup?.()

        // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `${hookName} [${hook.command}] failed to run: ${errorMessage}`,
          { level: 'error' },
        )
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          command: hook.command,
          succeeded: false,
          output: errorMessage,
          blocked: false,
        }
      }
    },
  )

  // Wait for all hooks to complete and collect results
  // 返回 await Promise.all(hookPromises)，把共享工具这个分支的结果交还调用方。
  return await Promise.all(hookPromises)
}

/**
 * Execute pre-tool hooks if configured
 * @param toolName The name of the tool (e.g., 'Write', 'Edit', 'Bash')
 * @param toolUseID The ID of the tool use
 * @param toolInput The input that will be passed to the tool
 * @param permissionMode Optional permission mode from toolPermissionContext
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @param toolUseContext Optional ToolUseContext for prompt-based hooks
 * @returns Async generator that yields progress messages and returns blocking errors
 */
// 共享工具 hooks处理 `export async function* executePreToolHooks<ToolInput>(`，完成这一小步状态转换。
export async function* executePreToolHooks<ToolInput>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  toolUseContext: ToolUseContext,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  // 共享工具 hooks处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>,，负责共享工具在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>,
  toolInputSummary?: string | null,
): AsyncGenerator<AggregatedHookResult> {
  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext.agentId ?? getSessionId()
  // 判断 !hasHookForEvent('PreToolUse', appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent('PreToolUse', appState, sessionId)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`executePreToolHooks called for tool: ${toolName}`, {
    level: 'verbose',
  })

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PreToolUseHookInput = {
    ...createBaseHookInput(permissionMode, undefined, toolUseContext),
    hook_event_name: 'PreToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: toolUseID,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID,
    matchQuery: toolName,
    signal,
    timeoutMs,
    toolUseContext,
    requestPrompt,
    toolInputSummary,
  })
}

/**
 * Execute post-tool hooks if configured
 * @param toolName The name of the tool (e.g., 'Write', 'Edit', 'Bash')
 * @param toolUseID The ID of the tool use
 * @param toolInput The input that was passed to the tool
 * @param toolResponse The response from the tool
 * @param toolUseContext ToolUseContext for prompt-based hooks
 * @param permissionMode Optional permission mode from toolPermissionContext
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and blocking errors for automated feedback
 */
// 共享工具 hooks处理 `export async function* executePostToolHooks<ToolInput, ToolResponse>(`，完成这一小步状态转换。
export async function* executePostToolHooks<ToolInput, ToolResponse>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  toolResponse: ToolResponse,
  toolUseContext: ToolUseContext,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PostToolUseHookInput = {
    ...createBaseHookInput(permissionMode, undefined, toolUseContext),
    hook_event_name: 'PostToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    tool_response: toolResponse,
    tool_use_id: toolUseID,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID,
    matchQuery: toolName,
    signal,
    timeoutMs,
    toolUseContext,
  })
}

/**
 * Execute post-tool-use-failure hooks if configured
 * @param toolName The name of the tool (e.g., 'Write', 'Edit', 'Bash')
 * @param toolUseID The ID of the tool use
 * @param toolInput The input that was passed to the tool
 * @param error The error message from the failed tool call
 * @param toolUseContext ToolUseContext for prompt-based hooks
 * @param isInterrupt Whether the tool was interrupted by user
 * @param permissionMode Optional permission mode from toolPermissionContext
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and blocking errors
 */
// 共享工具 hooks处理 `export async function* executePostToolUseFailureHooks<ToolInput>(`，完成这一小步状态转换。
export async function* executePostToolUseFailureHooks<ToolInput>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  error: string,
  toolUseContext: ToolUseContext,
  isInterrupt?: boolean,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): AsyncGenerator<AggregatedHookResult> {
  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext.agentId ?? getSessionId()
  // 判断 !hasHookForEvent('PostToolUseFailure', appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent('PostToolUseFailure', appState, sessionId)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PostToolUseFailureHookInput = {
    ...createBaseHookInput(permissionMode, undefined, toolUseContext),
    hook_event_name: 'PostToolUseFailure',
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: toolUseID,
    error,
    is_interrupt: isInterrupt,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID,
    matchQuery: toolName,
    signal,
    timeoutMs,
    toolUseContext,
  })
}

// 共享工具 hooks处理 `export async function* executePermissionDeniedHooks<ToolInput>(`，完成这一小步状态转换。
export async function* executePermissionDeniedHooks<ToolInput>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  reason: string,
  toolUseContext: ToolUseContext,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): AsyncGenerator<AggregatedHookResult> {
  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext.agentId ?? getSessionId()
  // 判断 !hasHookForEvent('PermissionDenied', appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent('PermissionDenied', appState, sessionId)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PermissionDeniedHookInput = {
    ...createBaseHookInput(permissionMode, undefined, toolUseContext),
    hook_event_name: 'PermissionDenied',
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: toolUseID,
    reason,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID,
    matchQuery: toolName,
    signal,
    timeoutMs,
    toolUseContext,
  })
}

/**
 * Execute notification hooks if configured
 * @param notificationData The notification data to pass to hooks
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Promise that resolves when all hooks complete
 */
// executeNotificationHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeNotificationHooks(
  notificationData: {
    message: string
    title?: string
    notificationType: string
  },
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<void> {
  // 从 `notificationData` 解构 message、title、notificationType，减少共享工具 hooks对同一对象的重复访问。
  const { message, title, notificationType } = notificationData
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: NotificationHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'Notification',
    message,
    title,
    notification_type: notificationType,
  }

  // 等待 `executeHooksOutsideREPL({` 完成，再继续共享工具 hooks的异步流程。
  await executeHooksOutsideREPL({
    hookInput,
    timeoutMs,
    matchQuery: notificationType,
  })
}

// executeStopFailureHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeStopFailureHooks(
  lastMessage: AssistantMessage,
  toolUseContext?: ToolUseContext,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<void> {
  // 应用状态读取`getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext?.getAppState()
  // executeHooksOutsideREPL hardcodes main sessionId (:2738). Agent frontmatter
  // hooks (registerFrontmatterHooks) key by agentId; gating with agentId here
  // would pass the gate but fail execution. Align gate with execution.
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // 判断 !hasHookForEvent('StopFailure', appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent('StopFailure', appState, sessionId)) return

  // lastAssistantText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lastAssistantText =
    extractTextContent(lastMessage.message.content, '\n').trim() || undefined

  // Some createAssistantAPIErrorMessage call sites omit `error` (e.g.
  // image-size at errors.ts:431). Default to 'unknown' so matcher filtering
  // at getMatchingHooks:1525 always applies.
  // error 错误信息保存`lastMessage.error ?? 'unknown'`，供共享工具 hooks后续步骤使用。
  const error = lastMessage.error ?? 'unknown'
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: StopFailureHookInput = {
    ...createBaseHookInput(undefined, undefined, toolUseContext),
    hook_event_name: 'StopFailure',
    error,
    error_details: lastMessage.errorDetails,
    last_assistant_message: lastAssistantText,
  }

  // 等待 `executeHooksOutsideREPL({` 完成，再继续共享工具 hooks的异步流程。
  await executeHooksOutsideREPL({
    getAppState: toolUseContext?.getAppState,
    hookInput,
    timeoutMs,
    matchQuery: error,
  })
}

/**
 * Execute stop hooks if configured
 * @param toolUseContext ToolUseContext for prompt-based hooks
 * @param permissionMode permission mode from toolPermissionContext
 * @param signal AbortSignal to cancel hook execution
 * @param stopHookActive Whether this call is happening within another stop hook
 * @param isSubagent Whether the current execution context is a subagent
 * @param messages Optional conversation history for prompt/function hooks
 * @returns Async generator that yields progress messages and blocking errors
 */
// 共享工具 hooks处理 `export async function* executeStopHooks(`，完成这一小步状态转换。
export async function* executeStopHooks(
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  stopHookActive: boolean = false,
  subagentId?: AgentId,
  toolUseContext?: ToolUseContext,
  messages?: Message[],
  agentType?: string,
  // 共享工具 hooks处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>,，负责共享工具在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>,
): AsyncGenerator<AggregatedHookResult> {
  // hookEvent保存`subagentId ? 'SubagentStop' : 'Stop'`，供共享工具 hooks后续步骤使用。
  const hookEvent = subagentId ? 'SubagentStop' : 'Stop'
  // 应用状态读取`getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext?.getAppState()
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext?.agentId ?? getSessionId()
  // 判断 !hasHookForEvent(hookEvent, appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent(hookEvent, appState, sessionId)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Extract text content from the last assistant message so hooks can
  // inspect the final response without reading the transcript file.
  // lastAssistantMessage保存`messages`，供共享工具 hooks后续步骤使用。
  const lastAssistantMessage = messages
    ? getLastAssistantMessage(messages)
    : undefined
  // lastAssistantText保存`lastAssistantMessage`，供共享工具 hooks后续步骤使用。
  const lastAssistantText = lastAssistantMessage
    ? extractTextContent(lastAssistantMessage.message.content, '\n').trim() ||
      undefined
    : undefined

  // hookInput保存`subagentId`，供共享工具 hooks后续步骤使用。
  const hookInput: StopHookInput | SubagentStopHookInput = subagentId
    ? {
        ...createBaseHookInput(permissionMode),
        hook_event_name: 'SubagentStop',
        stop_hook_active: stopHookActive,
        agent_id: subagentId,
        agent_transcript_path: getAgentTranscriptPath(subagentId),
        agent_type: agentType ?? '',
        last_assistant_message: lastAssistantText,
      }
    : {
        ...createBaseHookInput(permissionMode),
        hook_event_name: 'Stop',
        stop_hook_active: stopHookActive,
        last_assistant_message: lastAssistantText,
      }

  // Trust check is now centralized in executeHooks()
  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    signal,
    timeoutMs,
    toolUseContext,
    messages,
    requestPrompt,
  })
}

/**
 * Execute TeammateIdle hooks when a teammate is about to go idle.
 * If a hook blocks (exit code 2), the teammate should continue working instead of going idle.
 * @param teammateName The name of the teammate going idle
 * @param teamName The team this teammate belongs to
 * @param permissionMode Optional permission mode
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and blocking errors
 */
// 共享工具 hooks处理 `export async function* executeTeammateIdleHooks(`，完成这一小步状态转换。
export async function* executeTeammateIdleHooks(
  teammateName: string,
  teamName: string,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: TeammateIdleHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'TeammateIdle',
    teammate_name: teammateName,
    team_name: teamName,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    signal,
    timeoutMs,
  })
}

/**
 * Execute TaskCreated hooks when a task is being created.
 * If a hook blocks (exit code 2), the task creation should be prevented and feedback returned.
 * @param taskId The ID of the task being created
 * @param taskSubject The subject/title of the task
 * @param taskDescription Optional description of the task
 * @param teammateName Optional name of the teammate creating the task
 * @param teamName Optional team name
 * @param permissionMode Optional permission mode
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @param toolUseContext Optional ToolUseContext for resolving appState and sessionId
 * @returns Async generator that yields progress messages and blocking errors
 */
// 共享工具 hooks处理 `export async function* executeTaskCreatedHooks(`，完成这一小步状态转换。
export async function* executeTaskCreatedHooks(
  taskId: string,
  taskSubject: string,
  taskDescription?: string,
  teammateName?: string,
  teamName?: string,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  toolUseContext?: ToolUseContext,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: TaskCreatedHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'TaskCreated',
    task_id: taskId,
    task_subject: taskSubject,
    task_description: taskDescription,
    teammate_name: teammateName,
    team_name: teamName,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    signal,
    timeoutMs,
    toolUseContext,
  })
}

/**
 * Execute TaskCompleted hooks when a task is being marked as completed.
 * If a hook blocks (exit code 2), the task completion should be prevented and feedback returned.
 * @param taskId The ID of the task being completed
 * @param taskSubject The subject/title of the task
 * @param taskDescription Optional description of the task
 * @param teammateName Optional name of the teammate completing the task
 * @param teamName Optional team name
 * @param permissionMode Optional permission mode
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @param toolUseContext Optional ToolUseContext for resolving appState and sessionId
 * @returns Async generator that yields progress messages and blocking errors
 */
// 共享工具 hooks处理 `export async function* executeTaskCompletedHooks(`，完成这一小步状态转换。
export async function* executeTaskCompletedHooks(
  taskId: string,
  taskSubject: string,
  taskDescription?: string,
  teammateName?: string,
  teamName?: string,
  permissionMode?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  toolUseContext?: ToolUseContext,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: TaskCompletedHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'TaskCompleted',
    task_id: taskId,
    task_subject: taskSubject,
    task_description: taskDescription,
    teammate_name: teammateName,
    team_name: teamName,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    signal,
    timeoutMs,
    toolUseContext,
  })
}

/**
 * Execute start hooks if configured
 * @param prompt The user prompt that will be passed to the tool
 * @param permissionMode Permission mode from toolPermissionContext
 * @param toolUseContext ToolUseContext for prompt-based hooks
 * @returns Async generator that yields progress messages and hook results
 */
// 共享工具 hooks处理 `export async function* executeUserPromptSubmitHooks(`，完成这一小步状态转换。
export async function* executeUserPromptSubmitHooks(
  prompt: string,
  permissionMode: string,
  toolUseContext: ToolUseContext,
  // 共享工具 hooks处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>,，负责共享工具在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>,
): AsyncGenerator<AggregatedHookResult> {
  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // sessionId读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = toolUseContext.agentId ?? getSessionId()
  // 判断 !hasHookForEvent('UserPromptSubmit', appState, sessionId)，将共享工具分流到只适用于该条件的处理路径。
  if (!hasHookForEvent('UserPromptSubmit', appState, sessionId)) {
    // 共享工具 hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: UserPromptSubmitHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'UserPromptSubmit',
    prompt,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    signal: toolUseContext.abortController.signal,
    timeoutMs: TOOL_HOOK_EXECUTION_TIMEOUT_MS,
    toolUseContext,
    requestPrompt,
  })
}

/**
 * Execute session start hooks if configured
 * @param source The source of the session start (startup, resume, clear)
 * @param sessionId Optional The session id to use as hook input
 * @param agentType Optional The agent type (from --agent flag) running this session
 * @param model Optional The model being used for this session
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and hook results
 */
// 共享工具 hooks处理 `export async function* executeSessionStartHooks(`，完成这一小步状态转换。
export async function* executeSessionStartHooks(
  source: 'startup' | 'resume' | 'clear' | 'compact',
  sessionId?: string,
  agentType?: string,
  model?: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  forceSyncExecution?: boolean,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: SessionStartHookInput = {
    ...createBaseHookInput(undefined, sessionId),
    hook_event_name: 'SessionStart',
    source,
    agent_type: agentType,
    model,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    matchQuery: source,
    signal,
    timeoutMs,
    forceSyncExecution,
  })
}

/**
 * Execute setup hooks if configured
 * @param trigger The trigger type ('init' or 'maintenance')
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @param forceSyncExecution If true, async hooks will not be backgrounded
 * @returns Async generator that yields progress messages and hook results
 */
// 共享工具 hooks处理 `export async function* executeSetupHooks(`，完成这一小步状态转换。
export async function* executeSetupHooks(
  trigger: 'init' | 'maintenance',
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  forceSyncExecution?: boolean,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: SetupHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'Setup',
    trigger,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    matchQuery: trigger,
    signal,
    timeoutMs,
    forceSyncExecution,
  })
}

/**
 * Execute subagent start hooks if configured
 * @param agentId The unique identifier for the subagent
 * @param agentType The type/name of the subagent being started
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and hook results
 */
// 共享工具 hooks处理 `export async function* executeSubagentStartHooks(`，完成这一小步状态转换。
export async function* executeSubagentStartHooks(
  agentId: string,
  agentType: string,
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): AsyncGenerator<AggregatedHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: SubagentStartHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'SubagentStart',
    agent_id: agentId,
    agent_type: agentType,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID: randomUUID(),
    matchQuery: agentType,
    signal,
    timeoutMs,
  })
}

/**
 * Execute pre-compact hooks if configured
 * @param compactData The compact data to pass to hooks
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Object with optional newCustomInstructions and userDisplayMessage
 */
// executePreCompactHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executePreCompactHooks(
  compactData: {
    trigger: 'manual' | 'auto'
    customInstructions: string | null
  },
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<{
  newCustomInstructions?: string
  userDisplayMessage?: string
}> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PreCompactHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'PreCompact',
    trigger: compactData.trigger,
    custom_instructions: compactData.customInstructions,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    matchQuery: compactData.trigger,
    signal,
    timeoutMs,
  })

  // results 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (results.length === 0) {
    // 返回 {}，把共享工具这个分支的结果交还调用方。
    return {}
  }

  // Extract custom instructions from successful hooks with non-empty output
  // successfulOutputs 集合保存`results`，供共享工具 hooks后续步骤使用。
  const successfulOutputs = results
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(result => result.succeeded && result.output.trim().length > 0)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(result => result.output.trim())

  // Build user display messages with command info
  // displayMessages 集合从空数组开始收集，后续按处理顺序追加条目。
  const displayMessages: string[] = []
  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // 满足 `result.succeeded` 时，共享工具执行该分支。
    if (result.succeeded) {
      // 判断 result.output.trim()，将共享工具分流到只适用于该条件的处理路径。
      if (result.output.trim()) {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PreCompact [${result.command}] completed successfully: ${result.output.trim()}`,
        )
      } else {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PreCompact [${result.command}] completed successfully`,
        )
      }
    } else {
      // 判断 result.output.trim()，将共享工具分流到只适用于该条件的处理路径。
      if (result.output.trim()) {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PreCompact [${result.command}] failed: ${result.output.trim()}`,
        )
      } else {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(`PreCompact [${result.command}] failed`)
      }
    }
  }

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    newCustomInstructions:
      successfulOutputs.length > 0 ? successfulOutputs.join('\n\n') : undefined,
    userDisplayMessage:
      displayMessages.length > 0 ? displayMessages.join('\n') : undefined,
  }
}

/**
 * Execute post-compact hooks if configured
 * @param compactData The compact data to pass to hooks, including the summary
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Object with optional userDisplayMessage
 */
// executePostCompactHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executePostCompactHooks(
  compactData: {
    trigger: 'manual' | 'auto'
    compactSummary: string
  },
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<{
  userDisplayMessage?: string
}> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PostCompactHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'PostCompact',
    trigger: compactData.trigger,
    compact_summary: compactData.compactSummary,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    matchQuery: compactData.trigger,
    signal,
    timeoutMs,
  })

  // results 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (results.length === 0) {
    // 返回 {}，把共享工具这个分支的结果交还调用方。
    return {}
  }

  // displayMessages 集合从空数组开始收集，后续按处理顺序追加条目。
  const displayMessages: string[] = []
  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // 满足 `result.succeeded` 时，共享工具执行该分支。
    if (result.succeeded) {
      // 判断 result.output.trim()，将共享工具分流到只适用于该条件的处理路径。
      if (result.output.trim()) {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PostCompact [${result.command}] completed successfully: ${result.output.trim()}`,
        )
      } else {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PostCompact [${result.command}] completed successfully`,
        )
      }
    } else {
      // 判断 result.output.trim()，将共享工具分流到只适用于该条件的处理路径。
      if (result.output.trim()) {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(
          `PostCompact [${result.command}] failed: ${result.output.trim()}`,
        )
      } else {
        // displayMessages 集合追加新条目，保持收集顺序与输入顺序一致。
        displayMessages.push(`PostCompact [${result.command}] failed`)
      }
    }
  }

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    userDisplayMessage:
      displayMessages.length > 0 ? displayMessages.join('\n') : undefined,
  }
}

/**
 * Execute session end hooks if configured
 * @param reason The reason for ending the session
 * @param options Optional parameters including app state functions and signal
 * @returns Promise that resolves when all hooks complete
 */
// executeSessionEndHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeSessionEndHooks(
  reason: ExitReason,
  options?: {
    getAppState?: () => AppState
    setAppState?: (updater: (prev: AppState) => AppState) => void
    signal?: AbortSignal
    timeoutMs?: number
  },
): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    getAppState,
    setAppState,
    signal,
    timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  } = options || {}

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: SessionEndHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'SessionEnd',
    reason,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    getAppState,
    hookInput,
    matchQuery: reason,
    signal,
    timeoutMs,
  })

  // During shutdown, Ink is unmounted so we can write directly to stderr
  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // 组合条件 `!result.succeeded && result.output` 成立时，共享工具才启用这条专门路径。
    if (!result.succeeded && result.output) {
      // process.stderr.write执行共享工具在此处需要的副作用或外部交互。
      process.stderr.write(
        `SessionEnd hook [${result.command}] failed: ${result.output}\n`,
      )
    }
  }

  // Clear session hooks after execution
  // 满足 `setAppState` 时，共享工具执行该分支。
  if (setAppState) {
    // sessionId读取`getSessionId`，供共享工具后续处理使用。
    const sessionId = getSessionId()
    // clearSessionHooks执行共享工具在此处需要的副作用或外部交互。
    clearSessionHooks(setAppState, sessionId)
  }
}

/**
 * Execute permission request hooks if configured
 * These hooks are called when a permission dialog would be displayed to the user.
 * Hooks can approve or deny the permission request programmatically.
 * @param toolName The name of the tool requesting permission
 * @param toolUseID The ID of the tool use
 * @param toolInput The input that would be passed to the tool
 * @param toolUseContext ToolUseContext for the request
 * @param permissionMode Optional permission mode from toolPermissionContext
 * @param permissionSuggestions Optional permission suggestions (the "always allow" options)
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Async generator that yields progress messages and returns aggregated result
 */
// 共享工具 hooks处理 `export async function* executePermissionRequestHooks<ToolInput>(`，完成这一小步状态转换。
export async function* executePermissionRequestHooks<ToolInput>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  toolUseContext: ToolUseContext,
  permissionMode?: string,
  permissionSuggestions?: PermissionUpdate[],
  signal?: AbortSignal,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  // 共享工具 hooks处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>,，负责共享工具在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>,
  toolInputSummary?: string | null,
): AsyncGenerator<AggregatedHookResult> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`executePermissionRequestHooks called for tool: ${toolName}`)

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: PermissionRequestHookInput = {
    ...createBaseHookInput(permissionMode, undefined, toolUseContext),
    hook_event_name: 'PermissionRequest',
    tool_name: toolName,
    tool_input: toolInput,
    permission_suggestions: permissionSuggestions,
  }

  // 把 `executeHooks({` 继续产出给调用方。
  yield* executeHooks({
    hookInput,
    toolUseID,
    matchQuery: toolName,
    signal,
    timeoutMs,
    toolUseContext,
    requestPrompt,
    toolInputSummary,
  })
}

// ConfigChangeSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConfigChangeSource =
  | 'user_settings'
  | 'project_settings'
  | 'local_settings'
  | 'policy_settings'
  | 'skills'

/**
 * Execute config change hooks when configuration files change during a session.
 * Fired by file watchers when settings, skills, or commands change on disk.
 * Enables enterprise admins to audit/log configuration changes for security.
 *
 * Policy settings are enterprise-managed and must never be blockable by hooks.
 * Hooks still fire (for audit logging) but blocking results are ignored — callers
 * will always see an empty result for policy sources.
 *
 * @param source The type of config that changed
 * @param filePath Optional path to the changed file
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 */
// executeConfigChangeHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeConfigChangeHooks(
  source: ConfigChangeSource,
  filePath?: string,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<HookOutsideReplResult[]> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: ConfigChangeHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'ConfigChange',
    source,
    file_path: filePath,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    timeoutMs,
    matchQuery: source,
  })

  // Policy settings are enterprise-managed — hooks fire for audit logging
  // but must never block policy changes from being applied
  // `source` 命中特定值 `'policy_settings'` 时，进入共享工具对应处理。
  if (source === 'policy_settings') {
    // 返回 results.map(r => ({ ...r, blocked: false }))，把共享工具这个分支的结果交还调用方。
    return results.map(r => ({ ...r, blocked: false }))
  }

  // 返回 results，把共享工具这个分支的结果交还调用方。
  return results
}

// executeEnvHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
async function executeEnvHooks(
  hookInput: HookInput,
  timeoutMs: number,
): Promise<{
  results: HookOutsideReplResult[]
  watchPaths: string[]
  systemMessages: string[]
}> {
  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({ hookInput, timeoutMs })
  // 满足 `results.length > 0` 时，共享工具执行该分支。
  if (results.length > 0) {
    // invalidateSessionEnvCache执行共享工具在此处需要的副作用或外部交互。
    invalidateSessionEnvCache()
  }
  // watchPaths 文件数据派生`results.flatMap`，供共享工具后续处理使用。
  const watchPaths = results.flatMap(r => r.watchPaths ?? [])
  // systemMessages 集合保存`results`，供共享工具 hooks后续步骤使用。
  const systemMessages = results
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(r => r.systemMessage)
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter((m): m is string => !!m)
  // 返回 { results, watchPaths, systemMessages }，把共享工具这个分支的结果交还调用方。
  return { results, watchPaths, systemMessages }
}

// executeCwdChangedHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function executeCwdChangedHooks(
  oldCwd: string,
  newCwd: string,
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<{
  results: HookOutsideReplResult[]
  watchPaths: string[]
  systemMessages: string[]
}> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: CwdChangedHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'CwdChanged',
    old_cwd: oldCwd,
    new_cwd: newCwd,
  }
  // 返回 executeEnvHooks(hookInput, timeoutMs)，把共享工具这个分支的结果交还调用方。
  return executeEnvHooks(hookInput, timeoutMs)
}

// executeFileChangedHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function executeFileChangedHooks(
  filePath: string,
  event: 'change' | 'add' | 'unlink',
  timeoutMs: number = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
): Promise<{
  results: HookOutsideReplResult[]
  watchPaths: string[]
  systemMessages: string[]
}> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: FileChangedHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'FileChanged',
    file_path: filePath,
    event,
  }
  // 返回 executeEnvHooks(hookInput, timeoutMs)，把共享工具这个分支的结果交还调用方。
  return executeEnvHooks(hookInput, timeoutMs)
}

// InstructionsLoadReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstructionsLoadReason =
  | 'session_start'
  | 'nested_traversal'
  | 'path_glob_match'
  | 'include'
  | 'compact'

// InstructionsMemoryType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstructionsMemoryType = 'User' | 'Project' | 'Local' | 'Managed'

/**
 * Check if InstructionsLoaded hooks are configured (without executing them).
 * Callers should check this before invoking executeInstructionsLoadedHooks to avoid
 * building hook inputs for every instruction file when no hook is configured.
 *
 * Checks both settings-file hooks (getHooksConfigFromSnapshot) and registered
 * hooks (plugin hooks + SDK callback hooks via registerHookCallbacks). Session-
 * derived hooks (structured output enforcement etc.) are internal and not checked.
 */
// hasInstructionsLoadedHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function hasInstructionsLoadedHook(): boolean {
  // snapshotHooks 集合读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const snapshotHooks = getHooksConfigFromSnapshot()?.['InstructionsLoaded']
  // 判断 snapshotHooks && snapshotHooks.length > 0，将共享工具分流到只适用于该条件的处理路径。
  if (snapshotHooks && snapshotHooks.length > 0) return true
  // registeredHooks 集合读取`getRegisteredHooks`，供共享工具后续处理使用。
  const registeredHooks = getRegisteredHooks()?.['InstructionsLoaded']
  // 判断 registeredHooks && registeredHooks.length > 0，将共享工具分流到只适用于该条件的处理路径。
  if (registeredHooks && registeredHooks.length > 0) return true
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Execute InstructionsLoaded hooks when an instruction file (CLAUDE.md or
 * .claude/rules/*.md) is loaded into context. Fire-and-forget — this hook is
 * for observability/audit only and does not support blocking.
 *
 * Dispatch sites:
 * - Eager load at session start (getMemoryFiles in claudemd.ts)
 * - Eager reload after compaction (getMemoryFiles cache cleared by
 *   runPostCompactCleanup; next call reports load_reason: 'compact')
 * - Lazy load when Claude touches a file that triggers nested CLAUDE.md or
 *   conditional rules with paths: frontmatter (memoryFilesToAttachments in
 *   attachments.ts)
 */
// executeInstructionsLoadedHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeInstructionsLoadedHooks(
  filePath: string,
  memoryType: InstructionsMemoryType,
  loadReason: InstructionsLoadReason,
  options?: {
    globs?: string[]
    triggerFilePath?: string
    parentFilePath?: string
    timeoutMs?: number
  },
): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    globs,
    triggerFilePath,
    parentFilePath,
    timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  } = options ?? {}

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: InstructionsLoadedHookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'InstructionsLoaded',
    file_path: filePath,
    memory_type: memoryType,
    load_reason: loadReason,
    globs,
    trigger_file_path: triggerFilePath,
    parent_file_path: parentFilePath,
  }

  // 等待 `executeHooksOutsideREPL({` 完成，再继续共享工具 hooks的异步流程。
  await executeHooksOutsideREPL({
    hookInput,
    timeoutMs,
    matchQuery: loadReason,
  })
}

/** Result of an elicitation hook execution (non-REPL path). */
// ElicitationHookResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElicitationHookResult = {
  elicitationResponse?: ElicitationResponse
  blockingError?: HookBlockingError
}

/** Result of an elicitation-result hook execution (non-REPL path). */
// ElicitationResultHookResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElicitationResultHookResult = {
  elicitationResultResponse?: ElicitationResponse
  blockingError?: HookBlockingError
}

/**
 * Parse elicitation-specific fields from a HookOutsideReplResult.
 * Mirrors the relevant branches of processHookJSONOutput for Elicitation
 * and ElicitationResult hook events.
 */
// parseElicitationHookOutput 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function parseElicitationHookOutput(
  result: HookOutsideReplResult,
  expectedEventName: 'Elicitation' | 'ElicitationResult',
): {
  response?: ElicitationResponse
  blockingError?: HookBlockingError
} {
  // Exit code 2 = blocking (same as executeHooks path)
  // 组合条件 `result.blocked && !result.succeeded` 成立时，共享工具才启用这条专门路径。
  if (result.blocked && !result.succeeded) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      blockingError: {
        blockingError: result.output || `Elicitation blocked by hook`,
        command: result.command,
      },
    }
  }

  // 判断 !result.output.trim()，将共享工具分流到只适用于该条件的处理路径。
  if (!result.output.trim()) {
    // 返回 {}，把共享工具这个分支的结果交还调用方。
    return {}
  }

  // Try to parse JSON output for structured elicitation response
  // trimmed格式化`output.trim`，供共享工具后续处理使用。
  const trimmed = result.output.trim()
  // 判断 !trimmed.startsWith('{')，将共享工具分流到只适用于该条件的处理路径。
  if (!trimmed.startsWith('{')) {
    // 返回 {}，把共享工具这个分支的结果交还调用方。
    return {}
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // parsed保存`hookJSONOutputSchema`，供共享工具后续处理使用。
    const parsed = hookJSONOutputSchema().parse(JSON.parse(trimmed))
    // 判断 isAsyncHookJSONOutput(parsed)，将共享工具分流到只适用于该条件的处理路径。
    if (isAsyncHookJSONOutput(parsed)) {
      // 返回 {}，把共享工具这个分支的结果交还调用方。
      return {}
    }
    // 判断 !isSyncHookJSONOutput(parsed)，将共享工具分流到只适用于该条件的处理路径。
    if (!isSyncHookJSONOutput(parsed)) {
      // 返回 {}，把共享工具这个分支的结果交还调用方。
      return {}
    }

    // Check for top-level decision: 'block' (exit code 0 + JSON block)
    // 组合条件 `parsed.decision === 'block' || result.blocked` 成立时，共享工具才启用这条专门路径。
    if (parsed.decision === 'block' || result.blocked) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        blockingError: {
          blockingError: parsed.reason || 'Elicitation blocked by hook',
          command: result.command,
        },
      }
    }

    // specific解析`parsed.hookSpecificOutput`，供共享工具 hooks后续步骤使用。
    const specific = parsed.hookSpecificOutput
    // `!specific || specific.hookEventName` 与 `expectedE` 不一致时刷新派生状态。
    if (!specific || specific.hookEventName !== expectedEventName) {
      // 返回 {}，把共享工具这个分支的结果交还调用方。
      return {}
    }

    // specific.action缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!specific.action) {
      // 返回 {}，把共享工具这个分支的结果交还调用方。
      return {}
    }

    // response集中保存共享工具 hooks要一起传递的字段。
    const response: ElicitationResponse = {
      action: specific.action,
      content: specific.content as ElicitationResponse['content'] | undefined,
    }

    // out先声明占位，稍后的分支会根据实际输入补齐。
    const out: {
      response?: ElicitationResponse
      blockingError?: HookBlockingError
    } = { response }

    // `specific.action` 命中特定值 `'decline'` 时，进入共享工具对应处理。
    if (specific.action === 'decline') {
      // blockingError 错误信息更新为 `{`，确保共享工具后续读取最新状态。
      out.blockingError = {
        blockingError:
          parsed.reason ||
          (expectedEventName === 'Elicitation'
            ? 'Elicitation denied by hook'
            : 'Elicitation result blocked by hook'),
        command: result.command,
      }
    }

    // 返回 out，把共享工具这个分支的结果交还调用方。
    return out
  } catch {
    // 返回 {}，把共享工具这个分支的结果交还调用方。
    return {}
  }
}

// executeElicitationHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeElicitationHooks({
  serverName,
  message,
  requestedSchema,
  permissionMode,
  signal,
  timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  mode,
  url,
  elicitationId,
}: {
  serverName: string
  message: string
  requestedSchema?: Record<string, unknown>
  permissionMode?: string
  signal?: AbortSignal
  timeoutMs?: number
  mode?: 'form' | 'url'
  url?: string
  elicitationId?: string
}): Promise<ElicitationHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: ElicitationHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'Elicitation',
    mcp_server_name: serverName,
    message,
    mode,
    url,
    elicitation_id: elicitationId,
    requested_schema: requestedSchema,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    matchQuery: serverName,
    signal,
    timeoutMs,
  })

  // elicitationResponse先声明占位，稍后的分支会根据实际输入补齐。
  let elicitationResponse: ElicitationResponse | undefined
  // blockingError 错误信息先声明占位，稍后的分支会根据实际输入补齐。
  let blockingError: HookBlockingError | undefined

  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // parsed解析`parseElicitationHookOutput`，供共享工具后续处理使用。
    const parsed = parseElicitationHookOutput(result, 'Elicitation')
    // 满足 `parsed.blockingError` 时，共享工具执行该分支。
    if (parsed.blockingError) {
      // blockingError 错误信息更新为 `parsed.blockingError`，确保共享工具后续读取最新状态。
      blockingError = parsed.blockingError
    }
    // 满足 `parsed.response` 时，共享工具执行该分支。
    if (parsed.response) {
      // elicitationResponse更新为 `parsed.response`，确保共享工具后续读取最新状态。
      elicitationResponse = parsed.response
    }
  }

  // 返回 { elicitationResponse, blockingError }，把共享工具这个分支的结果交还调用方。
  return { elicitationResponse, blockingError }
}

// executeElicitationResultHooks 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeElicitationResultHooks({
  serverName,
  action,
  content,
  permissionMode,
  signal,
  timeoutMs = TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  mode,
  elicitationId,
}: {
  serverName: string
  action: 'accept' | 'decline' | 'cancel'
  content?: Record<string, unknown>
  permissionMode?: string
  signal?: AbortSignal
  timeoutMs?: number
  mode?: 'form' | 'url'
  elicitationId?: string
}): Promise<ElicitationResultHookResult> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput: ElicitationResultHookInput = {
    ...createBaseHookInput(permissionMode),
    hook_event_name: 'ElicitationResult',
    mcp_server_name: serverName,
    elicitation_id: elicitationId,
    mode,
    action,
    content,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    matchQuery: serverName,
    signal,
    timeoutMs,
  })

  // elicitationResultResponse先声明占位，稍后的分支会根据实际输入补齐。
  let elicitationResultResponse: ElicitationResponse | undefined
  // blockingError 错误信息先声明占位，稍后的分支会根据实际输入补齐。
  let blockingError: HookBlockingError | undefined

  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // parsed解析`parseElicitationHookOutput`，供共享工具后续处理使用。
    const parsed = parseElicitationHookOutput(result, 'ElicitationResult')
    // 满足 `parsed.blockingError` 时，共享工具执行该分支。
    if (parsed.blockingError) {
      // blockingError 错误信息更新为 `parsed.blockingError`，确保共享工具后续读取最新状态。
      blockingError = parsed.blockingError
    }
    // 满足 `parsed.response` 时，共享工具执行该分支。
    if (parsed.response) {
      // elicitationResultResponse更新为 `parsed.response`，确保共享工具后续读取最新状态。
      elicitationResultResponse = parsed.response
    }
  }

  // 返回 { elicitationResultResponse, blockingError }，把共享工具这个分支的结果交还调用方。
  return { elicitationResultResponse, blockingError }
}

/**
 * Execute status line command if configured
 * @param statusLineInput The structured status input that will be converted to JSON
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns The status line text to display, or undefined if no command configured
 */
// executeStatusLineCommand 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeStatusLineCommand(
  statusLineInput: StatusLineCommandInput,
  signal?: AbortSignal,
  timeoutMs: number = 5000, // Short timeout for status line
  logResult: boolean = false,
): Promise<string | undefined> {
  // Check if all hooks (including statusLine) are disabled by managed settings
  // 判断 shouldDisableAllHooksIncludingManaged()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldDisableAllHooksIncludingManaged()) {
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }

  // SECURITY: ALL hooks require workspace trust in interactive mode
  // This centralized check prevents RCE vulnerabilities for all current and future hooks
  // 判断 shouldSkipHookDueToTrust()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldSkipHookDueToTrust()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping StatusLine command execution - workspace trust not accepted`,
    )
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }

  // When disableAllHooks is set in non-managed settings, only managed statusLine runs
  // (non-managed settings cannot disable managed commands, but non-managed commands are disabled)
  // statusLine 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let statusLine
  // 判断 shouldAllowManagedHooksOnly()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldAllowManagedHooksOnly()) {
    // statusLine更新为 `getSettingsForSource('policySettings')?.statusLine`，确保共享工具后续读取最新状态。
    statusLine = getSettingsForSource('policySettings')?.statusLine
  } else {
    // statusLine更新为 `getSettings_DEPRECATED()?.statusLine`，确保共享工具后续读取最新状态。
    statusLine = getSettings_DEPRECATED()?.statusLine
  }

  // `!statusLine || statusLine.type` 与 `'command'` 不一致时刷新派生状态。
  if (!statusLine || statusLine.type !== 'command') {
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }

  // Use provided signal or create a default one
  // abortSignal保存`AbortSignal.timeout`，供共享工具后续处理使用。
  const abortSignal = signal || AbortSignal.timeout(timeoutMs)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Convert status input to JSON
    // jsonInput保存`jsonStringify`，供共享工具后续处理使用。
    const jsonInput = jsonStringify(statusLineInput)

    // 结果保存`execCommandHook`，供共享工具后续处理使用。
    const result = await execCommandHook(
      statusLine,
      'StatusLine',
      'statusLine',
      jsonInput,
      abortSignal,
      randomUUID(),
    )

    // 满足 `result.aborted` 时，共享工具执行该分支。
    if (result.aborted) {
      // 返回 undefined，把共享工具这个分支的结果交还调用方。
      return undefined
    }

    // For successful hooks (exit code 0), use stdout
    // 满足 `result.status === 0` 时，共享工具执行该分支。
    if (result.status === 0) {
      // Trim and split output into lines, then join with newlines
      // output保存`result.stdout`，供共享工具 hooks后续步骤使用。
      const output = result.stdout
        .trim()
        .split('\n')
        // 链式调用 flatMap，继续加工上一行在共享工具中产生的数据。
        .flatMap(line => line.trim() || [])
        .join('\n')

      // 满足 `output` 时，共享工具执行该分支。
      if (output) {
        // 满足 `logResult` 时，共享工具执行该分支。
        if (logResult) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `StatusLine [${statusLine.command}] completed with status ${result.status}`,
          )
        }
        // 返回 output，把共享工具这个分支的结果交还调用方。
        return output
      }
    // `logResult` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (logResult) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `StatusLine [${statusLine.command}] completed with status ${result.status}`,
        { level: 'warn' },
      )
    }

    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Status hook failed: ${error}`, { level: 'error' })
    // 返回 undefined，把共享工具这个分支的结果交还调用方。
    return undefined
  }
}

/**
 * Execute file suggestion command if configured
 * @param fileSuggestionInput The structured input that will be converted to JSON
 * @param signal Optional AbortSignal to cancel hook execution
 * @param timeoutMs Optional timeout in milliseconds for hook execution
 * @returns Array of file paths, or empty array if no command configured
 */
// executeFileSuggestionCommand 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeFileSuggestionCommand(
  fileSuggestionInput: FileSuggestionCommandInput,
  signal?: AbortSignal,
  timeoutMs: number = 5000, // Short timeout for typeahead suggestions
): Promise<string[]> {
  // Check if all hooks are disabled by managed settings
  // 判断 shouldDisableAllHooksIncludingManaged()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldDisableAllHooksIncludingManaged()) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // SECURITY: ALL hooks require workspace trust in interactive mode
  // This centralized check prevents RCE vulnerabilities for all current and future hooks
  // 判断 shouldSkipHookDueToTrust()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldSkipHookDueToTrust()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping FileSuggestion command execution - workspace trust not accepted`,
    )
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // When disableAllHooks is set in non-managed settings, only managed fileSuggestion runs
  // (non-managed settings cannot disable managed commands, but non-managed commands are disabled)
  // fileSuggestion 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let fileSuggestion
  // 判断 shouldAllowManagedHooksOnly()，将共享工具分流到只适用于该条件的处理路径。
  if (shouldAllowManagedHooksOnly()) {
    // fileSuggestion 文件数据更新为 `getSettingsForSource('policySettings')?.fileSuggestion`，确保共享工具后续读取最新状态。
    fileSuggestion = getSettingsForSource('policySettings')?.fileSuggestion
  } else {
    // fileSuggestion 文件数据更新为 `getSettings_DEPRECATED()?.fileSuggestion`，确保共享工具后续读取最新状态。
    fileSuggestion = getSettings_DEPRECATED()?.fileSuggestion
  }

  // `!fileSuggestion || fileSuggestion.type` 与 `'comma` 不一致时刷新派生状态。
  if (!fileSuggestion || fileSuggestion.type !== 'command') {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // Use provided signal or create a default one
  // abortSignal保存`AbortSignal.timeout`，供共享工具后续处理使用。
  const abortSignal = signal || AbortSignal.timeout(timeoutMs)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // jsonInput保存`jsonStringify`，供共享工具后续处理使用。
    const jsonInput = jsonStringify(fileSuggestionInput)

    // hook集中保存共享工具 hooks要一起传递的字段。
    const hook = { type: 'command' as const, command: fileSuggestion.command }

    // 结果保存`execCommandHook`，供共享工具后续处理使用。
    const result = await execCommandHook(
      hook,
      'FileSuggestion',
      'FileSuggestion',
      jsonInput,
      abortSignal,
      randomUUID(),
    )

    // `result.aborted || result.status` 与 `0` 不一致时刷新派生状态。
    if (result.aborted || result.status !== 0) {
      // 返回 []，把共享工具这个分支的结果交还调用方。
      return []
    }

    // 返回 result.stdout，把共享工具这个分支的结果交还调用方。
    return result.stdout
      .split('\n')
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(line => line.trim())
      .filter(Boolean)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`File suggestion helper failed: ${error}`, {
      level: 'error',
    })
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }
}

// executeFunctionHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
async function executeFunctionHook({
  hook,
  messages,
  hookName,
  toolUseID,
  hookEvent,
  timeoutMs,
  signal,
}: {
  hook: FunctionHook
  messages: Message[]
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
  timeoutMs: number
  signal?: AbortSignal
}): Promise<HookResult> {
  // callbackTimeoutMs 集合保存`hook.timeout ?? timeoutMs`，供共享工具 hooks后续步骤使用。
  const callbackTimeoutMs = hook.timeout ?? timeoutMs
  // 从 `createCombinedAbortSignal(signal, {` 解构 signal、cleanup，减少共享工具 hooks对同一对象的重复访问。
  const { signal: abortSignal, cleanup } = createCombinedAbortSignal(signal, {
    timeoutMs: callbackTimeoutMs,
  })

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check if already aborted
    // 满足 `abortSignal.aborted` 时，共享工具执行该分支。
    if (abortSignal.aborted) {
      // cleanup执行共享工具在此处需要的副作用或外部交互。
      cleanup()
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        outcome: 'cancelled',
        hook,
      }
    }

    // Execute callback with abort signal
    // passed等待 `new Promise<boolean>((resolve, reject) => {`，确保继续执行前已有结果。
    const passed = await new Promise<boolean>((resolve, reject) => {
      // Handle abort signal
      // onAbort保存`reject`，供共享工具后续处理使用。
      const onAbort = () => reject(new Error('Function hook cancelled'))
      // abortSignal.addEventListener执行共享工具在此处需要的副作用或外部交互。
      abortSignal.addEventListener('abort', onAbort)

      // Execute callback
      // Promise.resolve执行共享工具在此处需要的副作用或外部交互。
      Promise.resolve(hook.callback(messages, abortSignal))
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(result => {
          // abortSignal.removeEventListener执行共享工具在此处需要的副作用或外部交互。
          abortSignal.removeEventListener('abort', onAbort)
          // resolve执行共享工具在此处需要的副作用或外部交互。
          resolve(result)
        })
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(error => {
          // abortSignal.removeEventListener执行共享工具在此处需要的副作用或外部交互。
          abortSignal.removeEventListener('abort', onAbort)
          // reject执行共享工具在此处需要的副作用或外部交互。
          reject(error)
        })
    })

    // cleanup执行共享工具在此处需要的副作用或外部交互。
    cleanup()

    // 满足 `passed` 时，共享工具执行该分支。
    if (passed) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        outcome: 'success',
        hook,
      }
    }
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      blockingError: {
        blockingError: hook.errorMessage,
        command: 'function',
      },
      outcome: 'blocking',
      hook,
    }
  } catch (error) {
    // cleanup执行共享工具在此处需要的副作用或外部交互。
    cleanup()

    // Handle cancellation
    // 共享工具在这里进入条件判断，后续代码按实际状态分流。
    if (
      error instanceof Error &&
      (error.message === 'Function hook cancelled' ||
        error.name === 'AbortError')
    ) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        outcome: 'cancelled',
        hook,
      }
    }

    // Log for monitoring
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      message: createAttachmentMessage({
        type: 'hook_error_during_execution',
        hookName,
        toolUseID,
        hookEvent,
        content:
          error instanceof Error
            ? error.message
            : 'Function hook execution error',
      }),
      outcome: 'non_blocking_error',
      hook,
    }
  }
}

// executeHookCallback 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
async function executeHookCallback({
  toolUseID,
  hook,
  hookEvent,
  hookInput,
  signal,
  hookIndex,
  toolUseContext,
}: {
  toolUseID: string
  hook: HookCallback
  hookEvent: HookEvent
  hookInput: HookInput
  signal: AbortSignal
  hookIndex?: number
  toolUseContext?: ToolUseContext
}): Promise<HookResult> {
  // Create context for callbacks that need state access
  // 上下文保存`toolUseContext`，供共享工具 hooks后续步骤使用。
  const context = toolUseContext
    ? {
        getAppState: toolUseContext.getAppState,
        updateAttributionState: toolUseContext.updateAttributionState,
      }
    : undefined
  // json保存`hook.callback`，供共享工具后续处理使用。
  const json = await hook.callback(
    hookInput,
    toolUseID,
    signal,
    hookIndex,
    context,
  )
  // 判断 isAsyncHookJSONOutput(json)，将共享工具分流到只适用于该条件的处理路径。
  if (isAsyncHookJSONOutput(json)) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      outcome: 'success',
      hook,
    }
  }

  // processed保存`processHookJSONOutput`，供共享工具后续处理使用。
  const processed = processHookJSONOutput({
    json,
    command: 'callback',
    // TODO: If the hook came from a plugin, use the full path to the plugin for easier debugging
    hookName: `${hookEvent}:Callback`,
    toolUseID,
    hookEvent,
    expectedHookEvent: hookEvent,
    // Callbacks don't have stdout/stderr/exitCode
    stdout: undefined,
    stderr: undefined,
    exitCode: undefined,
  })
  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    ...processed,
    outcome: 'success',
    hook,
  }
}

/**
 * Check if WorktreeCreate hooks are configured (without executing them).
 *
 * Checks both settings-file hooks (getHooksConfigFromSnapshot) and registered
 * hooks (plugin hooks + SDK callback hooks via registerHookCallbacks).
 *
 * Must mirror the managedOnly filtering in getHooksConfig() — when
 * shouldAllowManagedHooksOnly() is true, plugin hooks (pluginRoot set) are
 * skipped at execution, so we must also skip them here. Otherwise this returns
 * true but executeWorktreeCreateHook() finds no matching hooks and throws,
 * blocking the git-worktree fallback.
 */
// hasWorktreeCreateHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export function hasWorktreeCreateHook(): boolean {
  // snapshotHooks 集合读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const snapshotHooks = getHooksConfigFromSnapshot()?.['WorktreeCreate']
  // 判断 snapshotHooks && snapshotHooks.length > 0，将共享工具分流到只适用于该条件的处理路径。
  if (snapshotHooks && snapshotHooks.length > 0) return true
  // registeredHooks 集合读取`getRegisteredHooks`，供共享工具后续处理使用。
  const registeredHooks = getRegisteredHooks()?.['WorktreeCreate']
  // 判断 !registeredHooks || registeredHooks.length === 0，将共享工具分流到只适用于该条件的处理路径。
  if (!registeredHooks || registeredHooks.length === 0) return false
  // Mirror getHooksConfig(): skip plugin hooks in managed-only mode
  // managedOnly保存`shouldAllowManagedHooksOnly`，供共享工具后续处理使用。
  const managedOnly = shouldAllowManagedHooksOnly()
  // 返回 registeredHooks.some(，把共享工具这个分支的结果交还调用方。
  return registeredHooks.some(
    // matcher更新为 `> !(managedOnly && 'pluginRoot' in matcher)`，确保共享工具后续读取最新状态。
    matcher => !(managedOnly && 'pluginRoot' in matcher),
  )
}

/**
 * Execute WorktreeCreate hooks.
 * Returns the worktree path from hook stdout.
 * Throws if hooks fail or produce no output.
 * Callers should check hasWorktreeCreateHook() before calling this.
 */
// executeWorktreeCreateHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeWorktreeCreateHook(
  name: string,
): Promise<{ worktreePath: string }> {
  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'WorktreeCreate' as const,
    name,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    timeoutMs: TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  })

  // Find the first successful result with non-empty output
  // successfulResult筛选`results.find`，供共享工具后续处理使用。
  const successfulResult = results.find(
    // r更新为 `> r.succeeded && r.output.trim().length > 0`，确保共享工具后续读取最新状态。
    r => r.succeeded && r.output.trim().length > 0,
  )

  // successfulResult缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
  if (!successfulResult) {
    // failedOutputs 集合保存`results`，供共享工具 hooks后续步骤使用。
    const failedOutputs = results
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(r => !r.succeeded)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(r => `${r.command}: ${r.output.trim() || 'no output'}`)
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `WorktreeCreate hook failed: ${failedOutputs.join('; ') || 'no successful output'}`,
    )
  }

  // worktreePath 文件数据格式化`output.trim`，供共享工具后续处理使用。
  const worktreePath = successfulResult.output.trim()
  // 返回 { worktreePath }，把共享工具这个分支的结果交还调用方。
  return { worktreePath }
}

/**
 * Execute WorktreeRemove hooks if configured.
 * Returns true if hooks were configured and ran, false if no hooks are configured.
 *
 * Checks both settings-file hooks (getHooksConfigFromSnapshot) and registered
 * hooks (plugin hooks + SDK callback hooks via registerHookCallbacks).
 */
// executeWorktreeRemoveHook 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
export async function executeWorktreeRemoveHook(
  worktreePath: string,
): Promise<boolean> {
  // snapshotHooks 集合读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const snapshotHooks = getHooksConfigFromSnapshot()?.['WorktreeRemove']
  // registeredHooks 集合读取`getRegisteredHooks`，供共享工具后续处理使用。
  const registeredHooks = getRegisteredHooks()?.['WorktreeRemove']
  // hasSnapshotHooks 集合记录当前扫描状态，共享工具 hooks随后按该状态分支。
  const hasSnapshotHooks = snapshotHooks && snapshotHooks.length > 0
  // hasRegisteredHooks 集合记录当前扫描状态，共享工具 hooks随后按该状态分支。
  const hasRegisteredHooks = registeredHooks && registeredHooks.length > 0
  // 组合条件 `!hasSnapshotHooks && !hasRegisteredHooks` 成立时，共享工具才启用这条专门路径。
  if (!hasSnapshotHooks && !hasRegisteredHooks) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // hookInput集中保存共享工具 hooks要一起传递的字段。
  const hookInput = {
    ...createBaseHookInput(undefined),
    hook_event_name: 'WorktreeRemove' as const,
    worktree_path: worktreePath,
  }

  // results 集合保存`executeHooksOutsideREPL`，供共享工具后续处理使用。
  const results = await executeHooksOutsideREPL({
    hookInput,
    timeoutMs: TOOL_HOOK_EXECUTION_TIMEOUT_MS,
  })

  // results 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (results.length === 0) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // 遍历 const result of results，让共享工具逐项完成同一类处理。
  for (const result of results) {
    // result.succeeded缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!result.succeeded) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WorktreeRemove hook failed [${result.command}]: ${result.output.trim()}`,
        { level: 'error' },
      )
    }
  }

  // 返回 true，把共享工具这个分支的结果交还调用方。
  return true
}

// getHookDefinitionsForTelemetry 承担共享工具中的独立步骤，串起共享工具 hooks需要的输入整理、状态更新和结果输出。
function getHookDefinitionsForTelemetry(
  matchedHooks: MatchedHook[],
): Array<{ type: string; command?: string; prompt?: string; name?: string }> {
  // 返回 matchedHooks.map(({ hook }) => {，把共享工具这个分支的结果交还调用方。
  return matchedHooks.map(({ hook }) => {
    // `hook.type` 命中特定值 `'command'` 时，进入共享工具对应处理。
    if (hook.type === 'command') {
      // 返回 { type: 'command', command: hook.command }，把共享工具这个分支的结果交还调用方。
      return { type: 'command', command: hook.command }
    // `hook.type === 'prompt'` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (hook.type === 'prompt') {
      // 返回 { type: 'prompt', prompt: hook.prompt }，把共享工具这个分支的结果交还调用方。
      return { type: 'prompt', prompt: hook.prompt }
    // `hook.type === 'http'` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (hook.type === 'http') {
      // 返回 { type: 'http', command: hook.url }，把共享工具这个分支的结果交还调用方。
      return { type: 'http', command: hook.url }
    // `hook.type === 'function'` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (hook.type === 'function') {
      // 返回 { type: 'function', name: 'function' }，把共享工具这个分支的结果交还调用方。
      return { type: 'function', name: 'function' }
    // `hook.type === 'callback'` 成立时，共享工具 hooks切换到这个 else-if 分支。
    } else if (hook.type === 'callback') {
      // 返回 { type: 'callback', name: 'callback' }，把共享工具这个分支的结果交还调用方。
      return { type: 'callback', name: 'callback' }
    }
    // 返回 { type: 'unknown' }，把共享工具这个分支的结果交还调用方。
    return { type: 'unknown' }
  })
}
