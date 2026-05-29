// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { writeFile } from 'fs/promises'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAllowedChannels,
  hasExitedPlanModeInSession,
  setHasExitedPlanMode,
  setNeedsAutoModeExitAttachment,
  setNeedsPlanModeExitAttachment,
} from '../../bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/metadata.js，用于校准工具调用的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/metadata.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildTool,
  type Tool,
  type ToolDef,
  toolMatchesName,
} from '../../Tool.js'
// 复用 formatAgentId、generateRequestId 工具函数，把通用处理留在 ../../utils/agentId.js 中维护。
import { formatAgentId, generateRequestId } from '../../utils/agentId.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  findInProcessTeammateTaskId,
  setAwaitingPlanApproval,
} from '../../utils/inProcessTeammateHelpers.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getPlan,
  getPlanFilePath,
  persistFileSnapshotIfRemote,
} from '../../utils/plans.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAgentName,
  getTeamName,
  isPlanModeRequired,
  isTeammate,
} from '../../utils/teammate.js'
// 复用 writeToMailbox 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { writeToMailbox } from '../../utils/teammateMailbox.js'
// 引入 AGENT_TOOL_NAME，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
// 引入 TEAM_CREATE_TOOL_NAME，将 ../TeamCreateTool/constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_CREATE_TOOL_NAME } from '../TeamCreateTool/constants.js'
// 引入 EXIT_PLAN_MODE_V2_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from './constants.js'
// 引入 EXIT_PLAN_MODE_V2_TOOL_PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { EXIT_PLAN_MODE_V2_TOOL_PROMPT } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
} from './UI.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// autoModeStateModule 状态保存`feature`，供工具调用后续处理使用。
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('../../utils/permissions/autoModeState.js') as typeof import('../../utils/permissions/autoModeState.js'))
  : null
// permissionSetupModule 权限数据保存`feature`，供工具调用后续处理使用。
const permissionSetupModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('../../utils/permissions/permissionSetup.js') as typeof import('../../utils/permissions/permissionSetup.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Schema for prompt-based permission requests.
 * Used by Claude to request semantic permissions when exiting plan mode.
 */
// allowedPromptSchema保存`lazySchema`，供工具调用后续处理使用。
const allowedPromptSchema = lazySchema(() =>
  z.object({
    tool: z.enum(['Bash']).describe('The tool this prompt applies to'),
    prompt: z
      .string()
      .describe(
        'Semantic description of the action, e.g. "run tests", "install dependencies"',
      ),
  }),
)

// AllowedPrompt 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AllowedPrompt = z.infer<ReturnType<typeof allowedPromptSchema>>

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z
    .strictObject({
      // Prompt-based permissions requested by the plan
      allowedPrompts: z
        .array(allowedPromptSchema())
        .optional()
        .describe(
          'Prompt-based permissions needed to implement the plan. These describe categories of actions rather than specific commands.',
        ),
    })
    .passthrough(),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

/**
 * SDK-facing input schema - includes fields injected by normalizeToolInput.
 * The internal inputSchema doesn't have these fields because plan is read from disk,
 * but the SDK/hooks see the normalized version with plan and file path included.
 */
// _sdkInputSchema保存`lazySchema`，供工具调用后续处理使用。
export const _sdkInputSchema = lazySchema(() =>
  inputSchema().extend({
    plan: z
      .string()
      .optional()
      .describe('The plan content (injected by normalizeToolInput from disk)'),
    planFilePath: z
      .string()
      .optional()
      .describe('The plan file path (injected by normalizeToolInput)'),
  }),
)

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() =>
  z.object({
    plan: z
      .string()
      .nullable()
      .describe('The plan that was presented to the user'),
    isAgent: z.boolean(),
    filePath: z
      .string()
      .optional()
      .describe('The file path where the plan was saved'),
    hasTaskTool: z
      .boolean()
      .optional()
      .describe('Whether the Agent tool is available in the current context'),
    planWasEdited: z
      .boolean()
      .optional()
      .describe(
        'True when the user edited the plan (CCR web UI or Ctrl+G); determines whether the plan is echoed back in tool_result',
      ),
    awaitingLeaderApproval: z
      .boolean()
      .optional()
      .describe(
        'When true, the teammate has sent a plan approval request to the team leader',
      ),
    requestId: z
      .string()
      .optional()
      .describe('Unique identifier for the plan approval request'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// ExitPlanModeV2Tool 命名 `buildTool({`，让后续代码直接表达这个值的用途。
export const ExitPlanModeV2Tool: Tool<InputSchema, Output> = buildTool({
  name: EXIT_PLAN_MODE_V2_TOOL_NAME,
  searchHint: 'present plan for approval and start coding (plan mode only)',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Prompts the user to exit plan mode and start coding'`，作为工具调用这次计算的结果。
    return 'Prompts the user to exit plan mode and start coding'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `EXIT_PLAN_MODE_V2_TOOL_PROMPT`，作为工具调用这次计算的结果。
    return EXIT_PLAN_MODE_V2_TOOL_PROMPT
  },
  // 工具实现 Exit Plan Mode V2 Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Exit Plan Mode V2 Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  shouldDefer: true,
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // When --channels is active the user is likely on Telegram/Discord, not
    // watching the TUI. The plan-approval dialog would hang. Paired with the
    // same gate on EnterPlanMode so plan mode isn't a trap.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
      getAllowedChannels().length > 0
    ) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 `false // Now writes to disk`，作为工具调用这次计算的结果。
    return false // Now writes to disk
  },
  // requiresUserInteraction 使用 无 完成工具调用里的对应操作。
  requiresUserInteraction() {
    // For ALL teammates, no local user interaction needed:
    // - If isPlanModeRequired(): team lead approves via mailbox
    // - Otherwise: exits locally without approval (voluntary plan mode)
    // 满足 `isTeammate()` 时，工具调用执行该分支。
    if (isTeammate()) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // For non-teammates, require user confirmation to exit plan mode
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // validateInput 使用 _input, { getAppState, options } 完成工具调用里的对应操作。
  async validateInput(_input, { getAppState, options }) {
    // Teammate AppState may show leader's mode (runAgent.ts skips override in
    // acceptEdits/bypassPermissions/auto); isPlanModeRequired() is the real source
    // 满足 `isTeammate()` 时，工具调用执行该分支。
    if (isTeammate()) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }
    // The deferred-tool list announces this tool regardless of mode, so the
    // model can call it after plan approval (fresh delta on compact/clear).
    // Reject before checkPermissions to avoid showing the approval dialog.
    // mode读取`getAppState`，供工具调用后续处理使用。
    const mode = getAppState().toolPermissionContext.mode
    // `mode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
    if (mode !== 'plan') {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_exit_plan_mode_called_outside_plan', {
        model:
          options.mainLoopModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        hasExitedPlanModeInSession: hasExitedPlanModeInSession(),
      })
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'You are not in plan mode. This tool is only for exiting plan mode after writing a plan. If your plan was already approved, continue with implementation.',
        errorCode: 1,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context) {
    // For ALL teammates, bypass the permission UI to avoid sending permission_request
    // The call() method handles the appropriate behavior:
    // - If isPlanModeRequired(): sends plan_approval_request to leader
    // - Otherwise: exits plan mode locally (voluntary plan mode)
    // 满足 `isTeammate()` 时，工具调用执行该分支。
    if (isTeammate()) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'allow' as const,
        updatedInput: input,
      }
    }

    // For non-teammates, require user confirmation to exit plan mode
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask' as const,
      message: 'Exit plan mode?',
      updatedInput: input,
    }
  },
  renderToolUseMessage,
  renderToolResultMessage,
  renderToolUseRejectedMessage,
  // call 使用 input, context 完成工具调用里的对应操作。
  async call(input, context) {
    // isAgent标记工具实现 Exit Plan Mode V2 Tool是否启用对应路径。
    const isAgent = !!context.agentId

    // 文件路径读取`getPlanFilePath`，供工具调用后续处理使用。
    const filePath = getPlanFilePath(context.agentId)
    // CCR web UI may send an edited plan via permissionResult.updatedInput.
    // queryHelpers.ts full-replaces finalInput, so when CCR sends {} (no edit)
    // input.plan is undefined -> disk fallback. The internal inputSchema omits
    // `plan` (normally injected by normalizeToolInput), hence the narrowing.
    // inputPlan 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const inputPlan =
      'plan' in input && typeof input.plan === 'string' ? input.plan : undefined
    // plan读取`getPlan`，供工具调用后续处理使用。
    const plan = inputPlan ?? getPlan(context.agentId)

    // Sync disk so VerifyPlanExecution / Read see the edit. Re-snapshot
    // after: the only other persistFileSnapshotIfRemote call (api.ts) runs
    // in normalizeToolInput, pre-permission — it captured the old plan.
    // `inputPlan` 与 `undefined && filePath` 不一致时刷新派生状态，避免使用过期结果。
    if (inputPlan !== undefined && filePath) {
      // 这个回调绑定到 await writeFile(filePath, inputPlan, 'utf-8').catch(e => logError(e))，负责工具调用在该局部场景下的响应。
      await writeFile(filePath, inputPlan, 'utf-8').catch(e => logError(e))
      // 显式忽略 `persistFileSnapshotIfRemote()` 的返回值，只保留它触发的副作用。
      void persistFileSnapshotIfRemote()
    }

    // Check if this is a teammate that requires leader approval
    // 只有 `isTeammate() && isPlanModeRequired()` 满足时，工具调用才执行该分支。
    if (isTeammate() && isPlanModeRequired()) {
      // Plan is required for plan_mode_required teammates
      // plan缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!plan) {
        // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
        throw new Error(
          `No plan file found at ${filePath}. Please write your plan to this file before calling ExitPlanMode.`,
        )
      }
      // agentName读取`getAgentName`，供工具调用后续处理使用。
      const agentName = getAgentName() || 'unknown'
      // teamName读取`getTeamName`，供工具调用后续处理使用。
      const teamName = getTeamName()
      // requestId 请求数据保存`generateRequestId`，供工具调用后续处理使用。
      const requestId = generateRequestId(
        'plan_approval',
        formatAgentId(agentName, teamName || 'default'),
      )

      // approvalRequest 请求数据集中保存工具实现 Exit Plan Mode V2 Tool要一起传递的字段。
      const approvalRequest = {
        type: 'plan_approval_request',
        from: agentName,
        timestamp: new Date().toISOString(),
        planFilePath: filePath,
        planContent: plan,
        requestId,
      }

      // 等待 `writeToMailbox(` 完成，再继续工具实现 Exit Plan Mode V2 Tool的异步流程。
      await writeToMailbox(
        'team-lead',
        {
          from: agentName,
          text: jsonStringify(approvalRequest),
          timestamp: new Date().toISOString(),
        },
        teamName,
      )

      // Update task state to show awaiting approval (for in-process teammates)
      // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
      const appState = context.getAppState()
      // agentTaskId筛选`findInProcessTeammateTaskId`，供工具调用后续处理使用。
      const agentTaskId = findInProcessTeammateTaskId(agentName, appState)
      // 满足 `agentTaskId` 时，工具调用执行该分支。
      if (agentTaskId) {
        // setAwaitingPlanApproval 写入新的状态值，使工具调用后续读取保持一致。
        setAwaitingPlanApproval(agentTaskId, context.setAppState, true)
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          plan,
          isAgent: true,
          filePath,
          awaitingLeaderApproval: true,
          requestId,
        },
      }
    }

    // Note: Background verification hook is registered in REPL.tsx AFTER context clear
    // via registerPlanVerificationHook(). Registering here would be cleared during context clear.

    // Ensure mode is changed when exiting plan mode.
    // This handles cases where permission flow didn't set the mode
    // (e.g., when PermissionRequest hook auto-approves without providing updatedPermissions).
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // Compute gate-off fallback before setAppState so we can notify the user.
    // Circuit breaker defense: if prePlanMode was an auto-like mode but the
    // gate is now off (circuit breaker or settings disable), restore to
    // 'default' instead. Without this, ExitPlanMode would bypass the circuit
    // breaker by calling setAutoModeActive(true) directly.
    // gateFallbackNotification保存`null`，作为后续空值处理的输入。
    let gateFallbackNotification: string | null = null
    // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，工具调用执行该分支。
    if (feature('TRANSCRIPT_CLASSIFIER')) {
      // prePlanRaw保存`appState.toolPermissionContext.prePlanMode ?? 'default'`，供后续判断或组装使用。
      const prePlanRaw = appState.toolPermissionContext.prePlanMode ?? 'default'
      // 工具调用在这里按实际状态进入对应分支。
      if (
        prePlanRaw === 'auto' &&
        !(permissionSetupModule?.isAutoModeGateEnabled() ?? false)
      ) {
        // reason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const reason =
          permissionSetupModule?.getAutoModeUnavailableReason() ??
          'circuit-breaker'
        // 工具实现 Exit Plan Mode V2 Tool在这里处理 `gateFallbackNotification =`，完成这一小步状态转换。
        gateFallbackNotification =
          permissionSetupModule?.getAutoModeUnavailableNotification(reason) ??
          'auto mode unavailable'
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[auto-mode gate @ ExitPlanModeV2Tool] prePlanMode=${prePlanRaw} ` +
            `but gate is off (reason=${reason}) — falling back to default on plan exit`,
          { level: 'warn' },
        )
      }
    }
    // 满足 `gateFallbackNotification` 时，工具调用执行该分支。
    if (gateFallbackNotification) {
      // 调用 context.addNotification?.({，完成这一处局部操作。
      context.addNotification?.({
        key: 'auto-mode-gate-plan-exit-fallback',
        text: `plan exit → default · ${gateFallbackNotification}`,
        priority: 'immediate',
        color: 'warning',
        timeoutMs: 10000,
      })
    }

    // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
    context.setAppState(prev => {
      // `prev.toolPermissionContext.mode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
      if (prev.toolPermissionContext.mode !== 'plan') return prev
      // setHasExitedPlanMode 写入新的状态值，使工具调用后续读取保持一致。
      setHasExitedPlanMode(true)
      // setNeedsPlanModeExitAttachment 写入新的状态值，使工具调用后续读取保持一致。
      setNeedsPlanModeExitAttachment(true)
      // restoreMode保存`prev.toolPermissionContext.prePlanMode ?? 'default'`，供后续判断或组装使用。
      let restoreMode = prev.toolPermissionContext.prePlanMode ?? 'default'
      // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，工具调用执行该分支。
      if (feature('TRANSCRIPT_CLASSIFIER')) {
        // 工具调用在这里按实际状态进入对应分支。
        if (
          restoreMode === 'auto' &&
          !(permissionSetupModule?.isAutoModeGateEnabled() ?? false)
        ) {
          // restoreMode更新为 `'default'`，确保工具调用后续读取最新状态。
          restoreMode = 'default'
        }
        // finalRestoringAuto标记工具实现 Exit Plan Mode V2 Tool是否启用对应路径。
        const finalRestoringAuto = restoreMode === 'auto'
        // Capture pre-restore state — isAutoModeActive() is the authoritative
        // signal (prePlanMode/strippedDangerousRules are stale after
        // transitionPlanAutoMode deactivates mid-plan).
        // autoWasUsedDuringPlan 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const autoWasUsedDuringPlan =
          autoModeStateModule?.isAutoModeActive() ?? false
        // 调用 autoModeStateModule?.setAutoModeActive(finalRestoringAuto)，完成这一处局部操作。
        autoModeStateModule?.setAutoModeActive(finalRestoringAuto)
        // 只有 `autoWasUsedDuringPlan && !finalRestoringAuto` 满足时，工具调用才执行该分支。
        if (autoWasUsedDuringPlan && !finalRestoringAuto) {
          // setNeedsAutoModeExitAttachment 写入新的状态值，使工具调用后续读取保持一致。
          setNeedsAutoModeExitAttachment(true)
        }
      }
      // If restoring to a non-auto mode and permissions were stripped (either
      // from entering plan from auto, or from shouldPlanUseAutoMode),
      // restore them. If restoring to auto, keep them stripped.
      // restoringToAuto标记工具实现 Exit Plan Mode V2 Tool是否启用对应路径。
      const restoringToAuto = restoreMode === 'auto'
      // baseContext保存`prev.toolPermissionContext`，供后续判断或组装使用。
      let baseContext = prev.toolPermissionContext
      // 满足 `restoringToAuto` 时，工具调用执行该分支。
      if (restoringToAuto) {
        // 工具实现 Exit Plan Mode V2 Tool在这里处理 `baseContext =`，完成这一小步状态转换。
        baseContext =
          permissionSetupModule?.stripDangerousPermissionsForAutoMode(
            baseContext,
          ) ?? baseContext
      // 工具实现 Exit Plan Mode V2 Tool在这里处理 `} else if (prev.toolPermissionContext.strippedDangerousRules) {`，完成这一小步状态转换。
      } else if (prev.toolPermissionContext.strippedDangerousRules) {
        // 工具实现 Exit Plan Mode V2 Tool在这里处理 `baseContext =`，完成这一小步状态转换。
        baseContext =
          permissionSetupModule?.restoreDangerousPermissions(baseContext) ??
          baseContext
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        ...prev,
        toolPermissionContext: {
          ...baseContext,
          mode: restoreMode,
          prePlanMode: undefined,
        },
      }
    })

    // hasTaskTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasTaskTool =
      isAgentSwarmsEnabled() &&
      // 调用 context.options.tools.some，触发工具调用此处需要的副作用。
      context.options.tools.some(t => toolMatchesName(t, AGENT_TOOL_NAME))

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        plan,
        isAgent,
        filePath,
        hasTaskTool: hasTaskTool || undefined,
        planWasEdited: inputPlan !== undefined || undefined,
      },
    }
  },
  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam(
    {
      isAgent,
      plan,
      filePath,
      hasTaskTool,
      planWasEdited,
      awaitingLeaderApproval,
      requestId,
    },
    toolUseID,
  ) {
    // Handle teammate awaiting leader approval
    // 满足 `awaitingLeaderApproval` 时，工具调用执行该分支。
    if (awaitingLeaderApproval) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'tool_result',
        content: `Your plan has been submitted to the team lead for approval.

Plan file: ${filePath}

**What happens next:**
1. Wait for the team lead to review your plan
2. You will receive a message in your inbox with approval/rejection
3. If approved, you can proceed with implementation
4. If rejected, refine your plan based on the feedback

**Important:** Do NOT proceed until you receive approval. Check your inbox for response.

Request ID: ${requestId}`,
        tool_use_id: toolUseID,
      }
    }

    // 满足 `isAgent` 时，工具调用执行该分支。
    if (isAgent) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'tool_result',
        content:
          'User has approved the plan. There is nothing else needed from you now. Please respond with "ok"',
        tool_use_id: toolUseID,
      }
    }

    // Handle empty plan
    // 只有 `!plan || plan.trim() === ''` 满足时，工具调用才执行该分支。
    if (!plan || plan.trim() === '') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'tool_result',
        content: 'User has approved exiting plan mode. You can now proceed.',
        tool_use_id: toolUseID,
      }
    }

    // teamHint 命名 `hasTaskTool`，让后续代码直接表达这个值的用途。
    const teamHint = hasTaskTool
      ? `\n\nIf this plan can be broken down into multiple independent tasks, consider using the ${TEAM_CREATE_TOOL_NAME} tool to create a team and parallelize the work.`
      : ''

    // Always include the plan — extractApprovedPlan() in the Ultraplan CCR
    // flow parses the tool_result to retrieve the plan text for the local CLI.
    // Label edited plans so the model knows the user changed something.
    // planLabel 命名 `planWasEdited`，让后续代码直接表达这个值的用途。
    const planLabel = planWasEdited
      ? 'Approved Plan (edited by user)'
      : 'Approved Plan'

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      content: `User has approved your plan. You can now start coding. Start with updating your todo list if applicable

Your plan has been saved to: ${filePath}
You can refer back to it if needed during implementation.${teamHint}

## ${planLabel}:
${plan}`,
      tool_use_id: toolUseID,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
