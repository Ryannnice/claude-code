/**
 * Helper for running forked agent query loops with usage tracking.
 *
 * This utility ensures forked agents:
 * 1. Share identical cache-critical params with the parent to guarantee prompt cache hits
 * 2. Track full usage metrics across the entire query loop
 * 3. Log metrics via the tengu_fork_agent_query event when complete
 * 4. Isolate mutable state to prevent interference with the main agent loop
 */

// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { PromptCommand } 来自 ../commands.js，用于校准共享工具的数据契约。
import type { PromptCommand } from '../commands.js'
// 类型依赖 { QuerySource } 来自 ../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../constants/querySource.js'
// 类型依赖 { CanUseToolFn } 来自 ../hooks/useCanUseTool.js，用于校准共享工具的数据契约。
import type { CanUseToolFn } from '../hooks/useCanUseTool.js'
// 引入 query，将 ../query.js 中已经封装好的能力接到本文件流程里。
import { query } from '../query.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 accumulateUsage、updateUsage 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { accumulateUsage, updateUsage } from '../services/api/claude.js'
// 接入 EMPTY_USAGE、NonNullableUsage 服务层能力，把外部通信或共享状态交给 ../services/api/logging.js 处理。
import { EMPTY_USAGE, type NonNullableUsage } from '../services/api/logging.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { AgentId } 来自 ../types/ids.js，用于校准共享工具的数据契约。
import type { AgentId } from '../types/ids.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 createChildAbortController，将 ./abortController.js 中已经封装好的能力接到本文件流程里。
import { createChildAbortController } from './abortController.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 cloneFileStateCache，将 ./fileStateCache.js 中已经封装好的能力接到本文件流程里。
import { cloneFileStateCache } from './fileStateCache.js'
// 类型依赖 { REPLHookContext } 来自 ./hooks/postSamplingHooks.js，用于校准共享工具的数据契约。
import type { REPLHookContext } from './hooks/postSamplingHooks.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  extractTextContent,
  getLastAssistantMessage,
} from './messages.js'
// 引入 createDenialTrackingState，将 ./permissions/denialTracking.js 中已经封装好的能力接到本文件流程里。
import { createDenialTrackingState } from './permissions/denialTracking.js'
// 引入 parseToolListFromCLI，将 ./permissions/permissionSetup.js 中已经封装好的能力接到本文件流程里。
import { parseToolListFromCLI } from './permissions/permissionSetup.js'
// 引入 recordSidechainTranscript，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { recordSidechainTranscript } from './sessionStorage.js'
// 类型依赖 { SystemPrompt } 来自 ./systemPromptType.js，用于校准共享工具的数据契约。
import type { SystemPrompt } from './systemPromptType.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ContentReplacementState,
  cloneContentReplacementState,
} from './toolResultStorage.js'
// 引入 createAgentId，将 ./uuid.js 中已经封装好的能力接到本文件流程里。
import { createAgentId } from './uuid.js'

/**
 * Parameters that must be identical between the fork and parent API requests
 * to share the parent's prompt cache. The Anthropic API cache key is composed of:
 * system prompt, tools, model, messages (prefix), and thinking config.
 *
 * CacheSafeParams carries the first five. Thinking config is derived from the
 * inherited toolUseContext.options.thinkingConfig — but can be inadvertently
 * changed if the fork sets maxOutputTokens, which clamps budget_tokens in
 * claude.ts (but only for older models that do not use adaptive thinking).
 * See the maxOutputTokens doc on ForkedAgentParams.
 */
// CacheSafeParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CacheSafeParams = {
  /** System prompt - must match parent for cache hits */
  systemPrompt: SystemPrompt
  /** User context - prepended to messages, affects cache */
  userContext: { [k: string]: string }
  /** System context - appended to system prompt, affects cache */
  systemContext: { [k: string]: string }
  /** Tool use context containing tools, model, and other options */
  toolUseContext: ToolUseContext
  /** Parent context messages for prompt cache sharing */
  forkContextMessages: Message[]
}

// Slot written by handleStopHooks after each turn so post-turn forks
// (promptSuggestion, postTurnSummary, /btw) can share the main loop's
// prompt cache without each caller threading params through.
// lastCacheSafeParams 缓存初始化为空值，后续分支会在有数据时补齐。
let lastCacheSafeParams: CacheSafeParams | null = null

// saveCacheSafeParams 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveCacheSafeParams(params: CacheSafeParams | null): void {
  // lastCacheSafeParams 缓存更新为 `params`，确保共享工具后续读取最新状态。
  lastCacheSafeParams = params
}

// getLastCacheSafeParams 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastCacheSafeParams(): CacheSafeParams | null {
  // 返回 `lastCacheSafeParams`，作为共享工具这次计算的结果。
  return lastCacheSafeParams
}

// ForkedAgentParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ForkedAgentParams = {
  /** Messages to start the forked query loop with */
  promptMessages: Message[]
  /** Cache-safe parameters that must match the parent query */
  cacheSafeParams: CacheSafeParams
  /** Permission check function for the forked agent */
  canUseTool: CanUseToolFn
  /** Source identifier for tracking */
  querySource: QuerySource
  /** Label for analytics (e.g., 'session_memory', 'supervisor') */
  forkLabel: string
  /** Optional overrides for the subagent context (e.g., readFileState from setup phase) */
  overrides?: SubagentContextOverrides
  /**
   * Optional cap on output tokens. CAUTION: setting this changes both max_tokens
   * AND budget_tokens (via clamping in claude.ts). If the fork uses cacheSafeParams
   * to share the parent's prompt cache, a different budget_tokens will invalidate
   * the cache — thinking config is part of the cache key. Only set this when cache
   * sharing is not a goal (e.g., compact summaries).
   */
  maxOutputTokens?: number
  /** Optional cap on number of turns (API round-trips) */
  maxTurns?: number
  /** Optional callback invoked for each message as it arrives (for streaming UI) */
  // 这个回调绑定到 onMessage?: (message: Message) => void，负责共享工具在该局部场景下的响应。
  onMessage?: (message: Message) => void
  /** Skip sidechain transcript recording (e.g., for ephemeral work like speculation) */
  skipTranscript?: boolean
  /** Skip writing new prompt cache entries on the last message. For
   *  fire-and-forget forks where no future request will read from this prefix. */
  skipCacheWrite?: boolean
}

// ForkedAgentResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ForkedAgentResult = {
  /** All messages yielded during the query loop */
  messages: Message[]
  /** Accumulated usage across all API calls in the loop */
  totalUsage: NonNullableUsage
}

/**
 * Creates CacheSafeParams from REPLHookContext.
 * Use this helper when forking from a post-sampling hook context.
 *
 * To override specific fields (e.g., toolUseContext with cloned file state),
 * spread the result and override: `{ ...createCacheSafeParams(context), toolUseContext: clonedContext }`
 *
 * @param context - The REPLHookContext from the post-sampling hook
 */
// createCacheSafeParams 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCacheSafeParams(
  context: REPLHookContext,
): CacheSafeParams {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    systemPrompt: context.systemPrompt,
    userContext: context.userContext,
    systemContext: context.systemContext,
    toolUseContext: context.toolUseContext,
    forkContextMessages: context.messages,
  }
}

/**
 * Creates a modified getAppState that adds allowed tools to the permission context.
 * This is used by forked skill/command execution to grant tool permissions.
 */
// createGetAppStateWithAllowedTools 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createGetAppStateWithAllowedTools(
  baseGetAppState: ToolUseContext['getAppState'],
  allowedTools: string[],
): ToolUseContext['getAppState'] {
  // allowedTools 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (allowedTools.length === 0) return baseGetAppState
  // 返回 `() => {`，作为共享工具这次计算的结果。
  return () => {
    // appState 状态保存`baseGetAppState`，供共享工具后续处理使用。
    const appState = baseGetAppState()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...appState,
      toolPermissionContext: {
        ...appState.toolPermissionContext,
        alwaysAllowRules: {
          ...appState.toolPermissionContext.alwaysAllowRules,
          command: [
            ...new Set([
              ...(appState.toolPermissionContext.alwaysAllowRules.command ||
                []),
              ...allowedTools,
            ]),
          ],
        },
      },
    }
  }
}

/**
 * Result from preparing a forked command context.
 */
// PreparedForkedContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PreparedForkedContext = {
  /** Skill content with args replaced */
  skillContent: string
  /** Modified getAppState with allowed tools */
  modifiedGetAppState: ToolUseContext['getAppState']
  /** The general-purpose agent to use */
  baseAgent: AgentDefinition
  /** Initial prompt messages */
  promptMessages: Message[]
}

/**
 * Prepares the context for executing a forked command/skill.
 * This handles the common setup that both SkillTool and slash commands need.
 */
// prepareForkedCommandContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function prepareForkedCommandContext(
  command: PromptCommand,
  args: string,
  context: ToolUseContext,
): Promise<PreparedForkedContext> {
  // Get skill content with $ARGUMENTS replaced
  // skillPrompt读取`command.getPromptForCommand`，供共享工具后续处理使用。
  const skillPrompt = await command.getPromptForCommand(args, context)
  // skillContent保存`skillPrompt`，供后续判断或组装使用。
  const skillContent = skillPrompt
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(block => (block.type === 'text' ? block.text : ''))
    .join('\n')

  // Parse and prepare allowed tools
  // allowedTools 集合解析`parseToolListFromCLI`，供共享工具后续处理使用。
  const allowedTools = parseToolListFromCLI(command.allowedTools ?? [])

  // Create modified context with allowed tools
  // modifiedGetAppState 状态构建`createGetAppStateWithAllowedTools`，供共享工具后续处理使用。
  const modifiedGetAppState = createGetAppStateWithAllowedTools(
    context.getAppState,
    allowedTools,
  )

  // Use command.agent if specified, otherwise 'general-purpose'
  // agentTypeName保存`command.agent ?? 'general-purpose'`，供后续判断或组装使用。
  const agentTypeName = command.agent ?? 'general-purpose'
  // agents 集合保存`context.options.agentDefinitions.activeAgents`，供共享工具 forked Agent后续判断或输出使用。
  const agents = context.options.agentDefinitions.activeAgents
  // baseAgent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseAgent =
    // 调用 agents.find，触发共享工具此处需要的副作用。
    agents.find(a => a.agentType === agentTypeName) ??
    // 调用 agents.find，触发共享工具此处需要的副作用。
    agents.find(a => a.agentType === 'general-purpose') ??
    agents[0]

  // baseAgent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!baseAgent) {
    // 抛出 new Error('No agent available for forked execution')，阻止共享工具在无效状态下继续运行。
    throw new Error('No agent available for forked execution')
  }

  // Prepare prompt messages
  // promptMessages 消息数据构建`createUserMessage`，供共享工具后续处理使用。
  const promptMessages = [createUserMessage({ content: skillContent })]

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    skillContent,
    modifiedGetAppState,
    baseAgent,
    promptMessages,
  }
}

/**
 * Extracts result text from agent messages.
 */
// extractResultText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractResultText(
  agentMessages: Message[],
  defaultText = 'Execution completed',
): string {
  // lastAssistantMessage 消息数据读取`getLastAssistantMessage`，供共享工具后续处理使用。
  const lastAssistantMessage = getLastAssistantMessage(agentMessages)
  // lastAssistantMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastAssistantMessage) return defaultText

  // textContent保存`extractTextContent`，供共享工具后续处理使用。
  const textContent = extractTextContent(
    lastAssistantMessage.message.content,
    '\n',
  )

  // 返回 `textContent || defaultText`，作为共享工具这次计算的结果。
  return textContent || defaultText
}

/**
 * Options for creating a subagent context.
 *
 * By default, all mutable state is isolated to prevent interference with the parent.
 * Use these options to:
 * - Override specific fields (e.g., custom options, agentId, messages)
 * - Explicitly opt-in to sharing specific callbacks (for interactive subagents)
 */
// SubagentContextOverrides 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SubagentContextOverrides = {
  /** Override the options object (e.g., custom tools, model) */
  options?: ToolUseContext['options']
  /** Override the agentId (for subagents with their own ID) */
  agentId?: AgentId
  /** Override the agentType (for subagents with a specific type) */
  agentType?: string
  /** Override the messages array */
  messages?: Message[]
  /** Override the readFileState (e.g., fresh cache instead of clone) */
  readFileState?: ToolUseContext['readFileState']
  /** Override the abortController */
  abortController?: AbortController
  /** Override the getAppState function */
  getAppState?: ToolUseContext['getAppState']

  /**
   * Explicit opt-in to share parent's setAppState callback.
   * Use for interactive subagents that need to update shared state.
   * @default false (isolated no-op)
   */
  shareSetAppState?: boolean
  /**
   * Explicit opt-in to share parent's setResponseLength callback.
   * Use for subagents that contribute to parent's response metrics.
   * @default false (isolated no-op)
   */
  shareSetResponseLength?: boolean
  /**
   * Explicit opt-in to share parent's abortController.
   * Use for interactive subagents that should abort with parent.
   * Note: Only applies if abortController override is not provided.
   * @default false (new controller linked to parent)
   */
  shareAbortController?: boolean
  /** Critical system reminder to re-inject at every user turn */
  criticalSystemReminder_EXPERIMENTAL?: string
  /** When true, canUseTool must always be called even when hooks auto-approve.
   *  Used by speculation for overlay file path rewriting. */
  requireCanUseTool?: boolean
  /** Override replacement state — used by resumeAgentBackground to thread
   * state reconstructed from the resumed sidechain so the same results
   * are re-replaced (prompt cache stability). */
  contentReplacementState?: ContentReplacementState
}

/**
 * Creates an isolated ToolUseContext for subagents.
 *
 * By default, ALL mutable state is isolated to prevent interference:
 * - readFileState: cloned from parent
 * - abortController: new controller linked to parent (parent abort propagates)
 * - getAppState: wrapped to set shouldAvoidPermissionPrompts
 * - All mutation callbacks (setAppState, etc.): no-op
 * - Fresh collections: nestedMemoryAttachmentTriggers, toolDecisions
 *
 * Callers can:
 * - Override specific fields via the overrides parameter
 * - Explicitly opt-in to sharing specific callbacks (shareSetAppState, etc.)
 *
 * @param parentContext - The parent's ToolUseContext to create subagent context from
 * @param overrides - Optional overrides and sharing options
 *
 * @example
 * // Full isolation (for background agents like session memory)
 * const ctx = createSubagentContext(parentContext)
 *
 * @example
 * // Custom options and agentId (for AgentTool async agents)
 * const ctx = createSubagentContext(parentContext, {
 *   options: customOptions,
 *   agentId: newAgentId,
 *   messages: initialMessages,
 * })
 *
 * @example
 * // Interactive subagent that shares some state
 * const ctx = createSubagentContext(parentContext, {
 *   options: customOptions,
 *   agentId: newAgentId,
 *   shareSetAppState: true,
 *   shareSetResponseLength: true,
 *   shareAbortController: true,
 * })
 */
// createSubagentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSubagentContext(
  parentContext: ToolUseContext,
  overrides?: SubagentContextOverrides,
): ToolUseContext {
  // Determine abortController: explicit override > share parent's > new child
  // abortController 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const abortController =
    overrides?.abortController ??
    (overrides?.shareAbortController
      ? parentContext.abortController
      : createChildAbortController(parentContext.abortController))

  // Determine getAppState - wrap to set shouldAvoidPermissionPrompts unless sharing abortController
  // (if sharing abortController, it's an interactive agent that CAN show UI)
  // getAppState 状态 命名 `overrides?.getAppState`，让后续代码直接表达这个值的用途。
  const getAppState: ToolUseContext['getAppState'] = overrides?.getAppState
    ? overrides.getAppState
    : overrides?.shareAbortController
      ? parentContext.getAppState
      // 这个回调绑定到 : () => {，负责共享工具在该局部场景下的响应。
      : () => {
          // 状态读取`parentContext.getAppState`，供共享工具后续处理使用。
          const state = parentContext.getAppState()
          // 满足 `state.toolPermissionContext.shouldAvoidPermission` 时，共享工具执行该分支。
          if (state.toolPermissionContext.shouldAvoidPermissionPrompts) {
            // 返回 `state`，作为共享工具这次计算的结果。
            return state
          }
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            ...state,
            toolPermissionContext: {
              ...state.toolPermissionContext,
              shouldAvoidPermissionPrompts: true,
            },
          }
        }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // Mutable state - cloned by default to maintain isolation
    // Clone overrides.readFileState if provided, otherwise clone from parent
    readFileState: cloneFileStateCache(
      overrides?.readFileState ?? parentContext.readFileState,
    ),
    nestedMemoryAttachmentTriggers: new Set<string>(),
    loadedNestedMemoryPaths: new Set<string>(),
    dynamicSkillDirTriggers: new Set<string>(),
    // Per-subagent: tracks skills surfaced by discovery for was_discovered telemetry (SkillTool.ts:116)
    discoveredSkillNames: new Set<string>(),
    toolDecisions: undefined,
    // Budget decisions: override > clone of parent > undefined (feature off).
    //
    // Clone by default (not fresh): cache-sharing forks process parent
    // messages containing parent tool_use_ids. A fresh state would see
    // them as unseen and make divergent replacement decisions → wire
    // prefix differs → cache miss. A clone makes identical decisions →
    // cache hit. For non-forking subagents the parent UUIDs never match
    // — clone is a harmless no-op.
    //
    // Override: AgentTool resume (reconstructed from sidechain records)
    // and inProcessRunner (per-teammate persistent loop state).
    contentReplacementState:
      overrides?.contentReplacementState ??
      (parentContext.contentReplacementState
        ? cloneContentReplacementState(parentContext.contentReplacementState)
        : undefined),

    // AbortController
    abortController,

    // AppState access
    getAppState,
    setAppState: overrides?.shareSetAppState
      ? parentContext.setAppState
      // 这个回调绑定到 : () => {},，负责共享工具在该局部场景下的响应。
      : () => {},
    // Task registration/kill must always reach the root store, even when
    // setAppState is a no-op — otherwise async agents' background bash tasks
    // are never registered and never killed (PPID=1 zombie).
    setAppStateForTasks:
      parentContext.setAppStateForTasks ?? parentContext.setAppState,
    // Async subagents whose setAppState is a no-op need local denial tracking
    // so the denial counter actually accumulates across retries.
    localDenialTracking: overrides?.shareSetAppState
      ? parentContext.localDenialTracking
      : createDenialTrackingState(),

    // Mutation callbacks - no-op by default
    // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责共享工具在该局部场景下的响应。
    setInProgressToolUseIDs: () => {},
    setResponseLength: overrides?.shareSetResponseLength
      ? parentContext.setResponseLength
      : () => {},
    pushApiMetricsEntry: overrides?.shareSetResponseLength
      ? parentContext.pushApiMetricsEntry
      : undefined,
    // 这个回调绑定到 updateFileHistoryState: () => {},，负责共享工具在该局部场景下的响应。
    updateFileHistoryState: () => {},
    // Attribution is scoped and functional (prev => next) — safe to share even
    // when setAppState is stubbed. Concurrent calls compose via React's state queue.
    updateAttributionState: parentContext.updateAttributionState,

    // UI callbacks - undefined for subagents (can't control parent UI)
    addNotification: undefined,
    setToolJSX: undefined,
    setStreamMode: undefined,
    setSDKStatus: undefined,
    openMessageSelector: undefined,

    // Fields that can be overridden or copied from parent
    options: overrides?.options ?? parentContext.options,
    messages: overrides?.messages ?? parentContext.messages,
    // Generate new agentId for subagents (each subagent should have its own ID)
    agentId: overrides?.agentId ?? createAgentId(),
    agentType: overrides?.agentType,

    // Create new query tracking chain for subagent with incremented depth
    queryTracking: {
      chainId: randomUUID(),
      depth: (parentContext.queryTracking?.depth ?? -1) + 1,
    },
    fileReadingLimits: parentContext.fileReadingLimits,
    userModified: parentContext.userModified,
    criticalSystemReminder_EXPERIMENTAL:
      overrides?.criticalSystemReminder_EXPERIMENTAL,
    requireCanUseTool: overrides?.requireCanUseTool,
  }
}

/**
 * Runs a forked agent query loop and tracks cache hit metrics.
 *
 * This function:
 * 1. Uses identical cache-safe params from parent to enable prompt caching
 * 2. Accumulates usage across all query iterations
 * 3. Logs tengu_fork_agent_query with full usage when complete
 *
 * @example
 * ```typescript
 * const result = await runForkedAgent({
 *   promptMessages: [createUserMessage({ content: userPrompt })],
 *   cacheSafeParams: {
 *     systemPrompt,
 *     userContext,
 *     systemContext,
 *     toolUseContext: clonedToolUseContext,
 *     forkContextMessages: messages,
 *   },
 *   canUseTool,
 *   querySource: 'session_memory',
 *   forkLabel: 'session_memory',
 * })
 * ```
 */
// runForkedAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runForkedAgent({
  promptMessages,
  cacheSafeParams,
  canUseTool,
  querySource,
  forkLabel,
  overrides,
  maxOutputTokens,
  maxTurns,
  onMessage,
  skipTranscript,
  skipCacheWrite,
}: ForkedAgentParams): Promise<ForkedAgentResult> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // outputMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const outputMessages: Message[] = []
  // totalUsage 集中保存共享工具 forked Agent要一起传递的字段。
  let totalUsage: NonNullableUsage = { ...EMPTY_USAGE }

  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    forkContextMessages,
  } = cacheSafeParams

  // Create isolated context to prevent mutation of parent state
  // isolatedToolUseContext构建`createSubagentContext`，供共享工具后续处理使用。
  const isolatedToolUseContext = createSubagentContext(
    toolUseContext,
    overrides,
  )

  // Do NOT filterIncompleteToolCalls here — it drops the whole assistant on
  // partial tool batches, orphaning the paired results (API 400). Dangling
  // tool_uses are repaired downstream by ensureToolResultPairing in claude.ts,
  // same as the main thread — identical post-repair prefix keeps the cache hit.
  // initialMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
  const initialMessages: Message[] = [...forkContextMessages, ...promptMessages]

  // Generate agent ID and record initial messages for transcript
  // When skipTranscript is set, skip agent ID creation and all transcript I/O
  // agentId构建`createAgentId`，供共享工具后续处理使用。
  const agentId = skipTranscript ? undefined : createAgentId(forkLabel)
  // lastRecordedUuid 命名 `null`，让后续代码直接表达这个值的用途。
  let lastRecordedUuid: UUID | null = null
  // 满足 `agentId` 时，共享工具执行该分支。
  if (agentId) {
    // 这个回调绑定到 await recordSidechainTranscript(initialMessages, agentId).catch(err =>，负责共享工具在该局部场景下的响应。
    await recordSidechainTranscript(initialMessages, agentId).catch(err =>
      logForDebugging(
        `Forked agent [${forkLabel}] failed to record initial transcript: ${err}`,
      ),
    )
    // Track the last recorded message UUID for parent chain continuity
    // 共享工具 forked Agent在这里处理 `lastRecordedUuid =`，完成这一小步状态转换。
    lastRecordedUuid =
      initialMessages.length > 0
        ? initialMessages[initialMessages.length - 1]!.uuid
        : null
  }

  // Run the query loop with isolated context (cache-safe params preserved)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 逐项读取 `query({` 中的消息，按输入顺序推进共享工具 forked Agent。
    for await (const message of query({
      messages: initialMessages,
      systemPrompt,
      userContext,
      systemContext,
      canUseTool,
      toolUseContext: isolatedToolUseContext,
      querySource,
      maxOutputTokensOverride: maxOutputTokens,
      maxTurns,
      skipCacheWrite,
    })) {
      // Extract real usage from message_delta stream events (final usage per API call)
      // 当 `message.type` 匹配 `'stream_event'` 时，共享工具执行对应分支。
      if (message.type === 'stream_event') {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          'event' in message &&
          message.event?.type === 'message_delta' &&
          message.event.usage
        ) {
          // turnUsage保存`updateUsage`，供共享工具后续处理使用。
          const turnUsage = updateUsage({ ...EMPTY_USAGE }, message.event.usage)
          // totalUsage更新为 `accumulateUsage(totalUsage, turnUsage)`，确保共享工具后续读取最新状态。
          totalUsage = accumulateUsage(totalUsage, turnUsage)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `message.type` 匹配 `'stream_request_start'` 时，共享工具执行对应分支。
      if (message.type === 'stream_request_start') {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Forked agent [${forkLabel}] received message: type=${message.type}`,
      )

      // outputMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      outputMessages.push(message as Message)
      // 调用 onMessage?.(message as Message)，完成这一处局部操作。
      onMessage?.(message as Message)

      // Record transcript for recordable message types (same pattern as runAgent.ts)
      // 消息保存`message as Message`，供后续判断或组装使用。
      const msg = message as Message
      // 共享工具在这里按实际状态进入对应分支。
      if (
        agentId &&
        (msg.type === 'assistant' ||
          msg.type === 'user' ||
          msg.type === 'progress')
      ) {
        // 等待 `recordSidechainTranscript([msg], agentId, lastRecordedUuid).catch(` 完成，再继续共享工具 forked Agent的异步流程。
        await recordSidechainTranscript([msg], agentId, lastRecordedUuid).catch(
          // err更新为 `>`，确保共享工具后续读取最新状态。
          err =>
            logForDebugging(
              `Forked agent [${forkLabel}] failed to record transcript: ${err}`,
            ),
        )
        // `msg.type` 与 `'progress'` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.type !== 'progress') {
          // lastRecordedUuid更新为 `msg.uuid`，确保共享工具后续读取最新状态。
          lastRecordedUuid = msg.uuid
        }
      }
    }
  } finally {
    // Release cloned file state cache memory (same pattern as runAgent.ts)
    // 调用 isolatedToolUseContext.readFileState.clear，触发共享工具此处需要的副作用。
    isolatedToolUseContext.readFileState.clear()
    // Release the cloned fork context messages
    // initialMessages 消息数据被清空，共享工具从干净状态继续。
    initialMessages.length = 0
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    // 这个回调绑定到 `Forked agent [${forkLabel}] finished: ${outputMessages.length} messages, types=[${o…，负责共享工具在该局部场景下的响应。
    `Forked agent [${forkLabel}] finished: ${outputMessages.length} messages, types=[${outputMessages.map(m => m.type).join(', ')}], totalUsage: input=${totalUsage.input_tokens} output=${totalUsage.output_tokens} cacheRead=${totalUsage.cache_read_input_tokens} cacheCreate=${totalUsage.cache_creation_input_tokens}`,
  )

  // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const durationMs = Date.now() - startTime

  // Log the fork query metrics with full NonNullableUsage
  // 调用 logForkAgentQueryEvent，触发共享工具此处需要的副作用。
  logForkAgentQueryEvent({
    forkLabel,
    querySource,
    durationMs,
    messageCount: outputMessages.length,
    totalUsage,
    queryTracking: toolUseContext.queryTracking,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: outputMessages,
    totalUsage,
  }
}

/**
 * Logs the tengu_fork_agent_query event with full NonNullableUsage fields.
 */
// logForkAgentQueryEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logForkAgentQueryEvent({
  forkLabel,
  querySource,
  durationMs,
  messageCount,
  totalUsage,
  queryTracking,
}: {
  forkLabel: string
  querySource: QuerySource
  durationMs: number
  messageCount: number
  totalUsage: NonNullableUsage
  queryTracking?: { chainId: string; depth: number }
}): void {
  // Calculate cache hit rate
  // totalInputTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalInputTokens =
    totalUsage.input_tokens +
    totalUsage.cache_creation_input_tokens +
    totalUsage.cache_read_input_tokens
  // cacheHitRate 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cacheHitRate =
    totalInputTokens > 0
      ? totalUsage.cache_read_input_tokens / totalInputTokens
      : 0

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_fork_agent_query', {
    // Metadata
    forkLabel:
      forkLabel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    querySource:
      querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    durationMs,
    messageCount,

    // NonNullableUsage fields
    inputTokens: totalUsage.input_tokens,
    outputTokens: totalUsage.output_tokens,
    cacheReadInputTokens: totalUsage.cache_read_input_tokens,
    cacheCreationInputTokens: totalUsage.cache_creation_input_tokens,
    serviceTier:
      totalUsage.service_tier as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    cacheCreationEphemeral1hTokens:
      totalUsage.cache_creation.ephemeral_1h_input_tokens,
    cacheCreationEphemeral5mTokens:
      totalUsage.cache_creation.ephemeral_5m_input_tokens,

    // Derived metrics
    cacheHitRate,

    // Query tracking
    ...(queryTracking
      ? {
          queryChainId:
            queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: queryTracking.depth,
        }
      : {}),
  })
}
