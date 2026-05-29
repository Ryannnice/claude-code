// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { promises as fsp } from 'fs'
// 引入 getSdkAgentProgressSummariesEnabled，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSdkAgentProgressSummariesEnabled } from '../../bootstrap/state.js'
// 引入 getSystemPrompt，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../../constants/prompts.js'
// 引入 isCoordinatorMode，将 ../../coordinator/coordinatorMode.js 中已经封装好的能力接到本文件流程里。
import { isCoordinatorMode } from '../../coordinator/coordinatorMode.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 registerAsyncAgent，将 ../../tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { registerAsyncAgent } from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 引入 assembleToolPool，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { assembleToolPool } from '../../tools.js'
// 引入 asAgentId，将 ../../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asAgentId } from '../../types/ids.js'
// 复用 runWithAgentContext 工具函数，把通用处理留在 ../../utils/agentContext.js 中维护。
import { runWithAgentContext } from '../../utils/agentContext.js'
// 复用 runWithCwdOverride 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { runWithCwdOverride } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  filterOrphanedThinkingOnlyMessages,
  filterUnresolvedToolUses,
  filterWhitespaceOnlyAssistantMessages,
} from '../../utils/messages.js'
// 复用 getAgentModel 工具函数，把通用处理留在 ../../utils/model/agent.js 中维护。
import { getAgentModel } from '../../utils/model/agent.js'
// 复用 getQuerySourceForAgent 工具函数，把通用处理留在 ../../utils/promptCategory.js 中维护。
import { getQuerySourceForAgent } from '../../utils/promptCategory.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAgentTranscript,
  readAgentMetadata,
} from '../../utils/sessionStorage.js'
// 复用 buildEffectiveSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPrompt.js 中维护。
import { buildEffectiveSystemPrompt } from '../../utils/systemPrompt.js'
// 类型依赖 { SystemPrompt } 来自 ../../utils/systemPromptType.js，用于校准工具调用的数据契约。
import type { SystemPrompt } from '../../utils/systemPromptType.js'
// 复用 getTaskOutputPath 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { getTaskOutputPath } from '../../utils/task/diskOutput.js'
// 复用 getParentSessionId 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { getParentSessionId } from '../../utils/teammate.js'
// 复用 reconstructForSubagentResume 工具函数，把通用处理留在 ../../utils/toolResultStorage.js 中维护。
import { reconstructForSubagentResume } from '../../utils/toolResultStorage.js'
// 引入 runAsyncAgentLifecycle，将 ./agentToolUtils.js 中已经封装好的能力接到本文件流程里。
import { runAsyncAgentLifecycle } from './agentToolUtils.js'
// 引入 GENERAL_PURPOSE_AGENT，将 ./built-in/generalPurposeAgent.js 中已经封装好的能力接到本文件流程里。
import { GENERAL_PURPOSE_AGENT } from './built-in/generalPurposeAgent.js'
// 引入 FORK_AGENT、isForkSubagentEnabled，将 ./forkSubagent.js 中已经封装好的能力接到本文件流程里。
import { FORK_AGENT, isForkSubagentEnabled } from './forkSubagent.js'
// 类型依赖 { AgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { AgentDefinition } from './loadAgentsDir.js'
// 引入 isBuiltInAgent，将 ./loadAgentsDir.js 中已经封装好的能力接到本文件流程里。
import { isBuiltInAgent } from './loadAgentsDir.js'
// 引入 runAgent，将 ./runAgent.js 中已经封装好的能力接到本文件流程里。
import { runAgent } from './runAgent.js'

// ResumeAgentResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResumeAgentResult = {
  agentId: string
  description: string
  outputFile: string
}
// resumeAgentBackground 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resumeAgentBackground({
  agentId,
  prompt,
  toolUseContext,
  canUseTool,
  invokingRequestId,
}: {
  agentId: string
  prompt: string
  toolUseContext: ToolUseContext
  canUseTool: CanUseToolFn
  invokingRequestId?: string
}): Promise<ResumeAgentResult> {
  // startTime记录时间`Date.now`，供工具调用后续处理使用。
  const startTime = Date.now()
  // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
  const appState = toolUseContext.getAppState()
  // In-process teammates get a no-op setAppState; setAppStateForTasks
  // reaches the root store so task registration/progress/kill stay visible.
  // rootSetAppState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rootSetAppState =
    toolUseContext.setAppStateForTasks ?? toolUseContext.setAppState
  // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供工具调用Agent 工具 resume Agent后续判断或输出使用。
  const permissionMode = appState.toolPermissionContext.mode

  // 并行获取 transcript、meta，缩短Agent 工具 resume Agent等待多个独立异步任务的时间。
  const [transcript, meta] = await Promise.all([
    getAgentTranscript(asAgentId(agentId)),
    readAgentMetadata(asAgentId(agentId)),
  ])
  // transcript缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!transcript) {
    // 抛出 new Error(`No transcript found for agent ID: ${agentId}`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`No transcript found for agent ID: ${agentId}`)
  }
  // resumedMessages 消息数据筛选`filterWhitespaceOnlyAssistantMessages`，供工具调用后续处理使用。
  const resumedMessages = filterWhitespaceOnlyAssistantMessages(
    filterOrphanedThinkingOnlyMessages(
      filterUnresolvedToolUses(transcript.messages),
    ),
  )
  // resumedReplacementState 状态保存`reconstructForSubagentResume`，供工具调用后续处理使用。
  const resumedReplacementState = reconstructForSubagentResume(
    toolUseContext.contentReplacementState,
    resumedMessages,
    transcript.contentReplacements,
  )
  // Best-effort: if the original worktree was removed externally, fall back
  // to parent cwd rather than crashing on chdir later.
  // resumedWorktreePath 路径数据保存`meta?.worktreePath`，供后续判断或组装使用。
  const resumedWorktreePath = meta?.worktreePath
    ? await fsp.stat(meta.worktreePath).then(
        // s 集合更新为 `> (s.isDirectory() ? meta.worktreePath : undefined)`，确保Agent 工具后续读取最新状态。
        s => (s.isDirectory() ? meta.worktreePath : undefined),
        // 这个回调绑定到 () => {，负责工具调用在该局部场景下的响应。
        () => {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Resumed worktree ${meta.worktreePath} no longer exists; falling back to parent cwd`,
          )
          // 返回 `undefined`，作为工具调用这次计算的结果。
          return undefined
        },
      )
    : undefined
  // 满足 `resumedWorktreePath` 时，工具调用执行该分支。
  if (resumedWorktreePath) {
    // Bump mtime so stale-worktree cleanup doesn't delete a just-resumed worktree (#22355)
    // now记录时间`Date`，供工具调用后续处理使用。
    const now = new Date()
    // 等待 `fsp.utimes(resumedWorktreePath, now, now)` 完成，再继续Agent 工具 resume Agent的异步流程。
    await fsp.utimes(resumedWorktreePath, now, now)
  }

  // Skip filterDeniedAgents re-gating — original spawn already passed permission checks
  // selectedAgent 先占位，稍后的条件分支会根据实际输入补齐它。
  let selectedAgent: AgentDefinition
  // isResumedFork标记工具调用Agent 工具 resume Agent是否启用对应路径。
  let isResumedFork = false
  // 满足 `meta?.agentType === FORK_AGENT.agentType` 时，工具调用执行该分支。
  if (meta?.agentType === FORK_AGENT.agentType) {
    // selectedAgent更新为 `FORK_AGENT`，确保Agent 工具后续读取最新状态。
    selectedAgent = FORK_AGENT
    // isResumedFork更新为 `true`，确保Agent 工具后续读取最新状态。
    isResumedFork = true
  // Agent 工具 resume Agent在这里处理 `} else if (meta?.agentType) {`，完成这一小步状态转换。
  } else if (meta?.agentType) {
    // found筛选`activeAgents.find`，供工具调用后续处理使用。
    const found = toolUseContext.options.agentDefinitions.activeAgents.find(
      // a更新为 `> a.agentType === meta.agentType`，确保Agent 工具后续读取最新状态。
      a => a.agentType === meta.agentType,
    )
    // selectedAgent更新为 `found ?? GENERAL_PURPOSE_AGENT`，确保Agent 工具后续读取最新状态。
    selectedAgent = found ?? GENERAL_PURPOSE_AGENT
  } else {
    // selectedAgent更新为 `GENERAL_PURPOSE_AGENT`，确保Agent 工具后续读取最新状态。
    selectedAgent = GENERAL_PURPOSE_AGENT
  }

  // uiDescription 命名 `meta?.description ?? '(resumed)'`，让后续代码直接表达这个值的用途。
  const uiDescription = meta?.description ?? '(resumed)'

  // forkParentSystemPrompt 先占位，稍后的条件分支会根据实际输入补齐它。
  let forkParentSystemPrompt: SystemPrompt | undefined
  // 满足 `isResumedFork` 时，工具调用执行该分支。
  if (isResumedFork) {
    // 满足 `toolUseContext.renderedSystemPrompt` 时，工具调用执行该分支。
    if (toolUseContext.renderedSystemPrompt) {
      // forkParentSystemPrompt更新为 `toolUseContext.renderedSystemPrompt`，确保Agent 工具后续读取最新状态。
      forkParentSystemPrompt = toolUseContext.renderedSystemPrompt
    } else {
      // mainThreadAgentDefinition 命名 `appState.agent`，让后续代码直接表达这个值的用途。
      const mainThreadAgentDefinition = appState.agent
        ? appState.agentDefinitions.activeAgents.find(
            // a更新为 `> a.agentType === appState.agent`，确保Agent 工具后续读取最新状态。
            a => a.agentType === appState.agent,
          )
        : undefined
      // additionalWorkingDirectories 集合保存`Array.from`，供工具调用后续处理使用。
      const additionalWorkingDirectories = Array.from(
        appState.toolPermissionContext.additionalWorkingDirectories.keys(),
      )
      // defaultSystemPrompt读取`getSystemPrompt`，供工具调用后续处理使用。
      const defaultSystemPrompt = await getSystemPrompt(
        toolUseContext.options.tools,
        toolUseContext.options.mainLoopModel,
        additionalWorkingDirectories,
        toolUseContext.options.mcpClients,
      )
      // forkParentSystemPrompt更新为 `buildEffectiveSystemPrompt({`，确保Agent 工具后续读取最新状态。
      forkParentSystemPrompt = buildEffectiveSystemPrompt({
        mainThreadAgentDefinition,
        toolUseContext,
        customSystemPrompt: toolUseContext.options.customSystemPrompt,
        defaultSystemPrompt,
        appendSystemPrompt: toolUseContext.options.appendSystemPrompt,
      })
    }
    // forkParentSystemPrompt缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!forkParentSystemPrompt) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        'Cannot resume fork agent: unable to reconstruct parent system prompt',
      )
    }
  }

  // Resolve model for analytics metadata (runAgent resolves its own internally)
  // resolvedAgentModel读取`getAgentModel`，供工具调用后续处理使用。
  const resolvedAgentModel = getAgentModel(
    selectedAgent.model,
    toolUseContext.options.mainLoopModel,
    undefined,
    permissionMode,
  )

  // workerPermissionContext 权限数据 集中保存工具调用Agent 工具 resume Agent要一起传递的字段。
  const workerPermissionContext = {
    ...appState.toolPermissionContext,
    mode: selectedAgent.permissionMode ?? 'acceptEdits',
  }
  // workerTools 集合保存`isResumedFork`，供后续判断或组装使用。
  const workerTools = isResumedFork
    ? toolUseContext.options.tools
    : assembleToolPool(workerPermissionContext, appState.mcp.tools)

  // runAgentParams 集合 集中保存Agent 工具 resume Agent要一起传递的字段。
  const runAgentParams: Parameters<typeof runAgent>[0] = {
    agentDefinition: selectedAgent,
    promptMessages: [
      ...resumedMessages,
      createUserMessage({ content: prompt }),
    ],
    toolUseContext,
    canUseTool,
    isAsync: true,
    querySource: getQuerySourceForAgent(
      selectedAgent.agentType,
      isBuiltInAgent(selectedAgent),
    ),
    model: undefined,
    // Fork resume: pass parent's system prompt (cache-identical prefix).
    // Non-fork: undefined → runAgent recomputes under wrapWithCwd so
    // getCwd() sees resumedWorktreePath.
    override: isResumedFork
      ? { systemPrompt: forkParentSystemPrompt }
      : undefined,
    availableTools: workerTools,
    // Transcript already contains the parent context slice from the
    // original fork. Re-supplying it would cause duplicate tool_use IDs.
    forkContextMessages: undefined,
    ...(isResumedFork && { useExactTools: true }),
    // Re-persist so metadata survives runAgent's writeAgentMetadata overwrite
    worktreePath: resumedWorktreePath,
    description: meta?.description,
    contentReplacementState: resumedReplacementState,
  }

  // Skip name-registry write — original entry persists from the initial spawn
  // agentBackgroundTask保存`registerAsyncAgent`，供工具调用后续处理使用。
  const agentBackgroundTask = registerAsyncAgent({
    agentId,
    description: uiDescription,
    prompt,
    selectedAgent,
    setAppState: rootSetAppState,
    toolUseId: toolUseContext.toolUseId,
  })

  // metadata 集中保存工具调用Agent 工具 resume Agent要一起传递的字段。
  const metadata = {
    prompt,
    resolvedAgentModel,
    isBuiltInAgent: isBuiltInAgent(selectedAgent),
    startTime,
    agentType: selectedAgent.agentType,
    isAsync: true,
  }

  // asyncAgentContext 集中保存工具调用Agent 工具 resume Agent要一起传递的字段。
  const asyncAgentContext = {
    agentId,
    parentSessionId: getParentSessionId(),
    agentType: 'subagent' as const,
    subagentName: selectedAgent.agentType,
    isBuiltIn: isBuiltInAgent(selectedAgent),
    invokingRequestId,
    invocationKind: 'resume' as const,
    invocationEmitted: false,
  }

  // wrapWithCwd封装成回调，供工具调用Agent 工具 resume Agent在事件触发或异步步骤中调用。
  const wrapWithCwd = <T>(fn: () => T): T =>
    resumedWorktreePath ? runWithCwdOverride(resumedWorktreePath, fn) : fn()

  // 这个回调绑定到 void runWithAgentContext(asyncAgentContext, () =>，负责工具调用在该局部场景下的响应。
  void runWithAgentContext(asyncAgentContext, () =>
    // 调用 wrapWithCwd，触发工具调用此处需要的副作用。
    wrapWithCwd(() =>
      runAsyncAgentLifecycle({
        taskId: agentBackgroundTask.agentId,
        abortController: agentBackgroundTask.abortController!,
        // 这个回调绑定到 makeStream: onCacheSafeParams =>，负责工具调用在该局部场景下的响应。
        makeStream: onCacheSafeParams =>
          runAgent({
            ...runAgentParams,
            override: {
              ...runAgentParams.override,
              agentId: asAgentId(agentBackgroundTask.agentId),
              abortController: agentBackgroundTask.abortController!,
            },
            onCacheSafeParams,
          }),
        metadata,
        description: uiDescription,
        toolUseContext,
        rootSetAppState,
        agentIdForCleanup: agentId,
        enableSummarization:
          isCoordinatorMode() ||
          isForkSubagentEnabled() ||
          getSdkAgentProgressSummariesEnabled(),
        // 这个回调绑定到 getWorktreeResult: async () =>，负责工具调用在该局部场景下的响应。
        getWorktreeResult: async () =>
          resumedWorktreePath ? { worktreePath: resumedWorktreePath } : {},
      }),
    ),
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    agentId,
    description: uiDescription,
    outputFile: getTaskOutputPath(agentId),
  }
}
