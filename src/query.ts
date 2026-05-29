// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 类型依赖 { CanUseToolFn } 来自 ./hooks/useCanUseTool.js，用于校准query的数据契约。
import type { CanUseToolFn } from './hooks/useCanUseTool.js'
// 接入 FallbackTriggeredError 服务层能力，把外部通信或共享状态交给 ./services/api/withRetry.js 处理。
import { FallbackTriggeredError } from './services/api/withRetry.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  calculateTokenWarningState,
  isAutoCompactEnabled,
  type AutoCompactTrackingState,
} from './services/compact/autoCompact.js'
// 接入 buildPostCompactMessages 服务层能力，把外部通信或共享状态交给 ./services/compact/compact.js 处理。
import { buildPostCompactMessages } from './services/compact/compact.js'
/* eslint-disable @typescript-eslint/no-require-imports */
// reactiveCompact保存`feature`，供query后续处理使用。
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? (require('./services/compact/reactiveCompact.js') as typeof import('./services/compact/reactiveCompact.js'))
  : null
// contextCollapse保存`feature`，供query后续处理使用。
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? (require('./services/contextCollapse/index.js') as typeof import('./services/contextCollapse/index.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from 'src/services/analytics/index.js'
// 复用 ImageSizeError 工具函数，把通用处理留在 ./utils/imageValidation.js 中维护。
import { ImageSizeError } from './utils/imageValidation.js'
// 复用 ImageResizeError 工具函数，把通用处理留在 ./utils/imageResizer.js 中维护。
import { ImageResizeError } from './utils/imageResizer.js'
// 引入 findToolByName、ToolUseContext，将 ./Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type ToolUseContext } from './Tool.js'
// 复用 asSystemPrompt、SystemPrompt 工具函数，把通用处理留在 ./utils/systemPromptType.js 中维护。
import { asSystemPrompt, type SystemPrompt } from './utils/systemPromptType.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  RequestStartEvent,
  StreamEvent,
  ToolUseSummaryMessage,
  UserMessage,
  TombstoneMessage,
} from './types/message.js'
// 复用 logError 工具函数，把通用处理留在 ./utils/log.js 中维护。
import { logError } from './utils/log.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  PROMPT_TOO_LONG_ERROR_MESSAGE,
  isPromptTooLongMessage,
} from './services/api/errors.js'
// 复用 logAntError、logForDebugging 工具函数，把通用处理留在 ./utils/debug.js 中维护。
import { logAntError, logForDebugging } from './utils/debug.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  createUserInterruptionMessage,
  normalizeMessagesForAPI,
  createSystemMessage,
  createAssistantAPIErrorMessage,
  getMessagesAfterCompactBoundary,
  createToolUseSummaryMessage,
  createMicrocompactBoundaryMessage,
  stripSignatureBlocks,
} from './utils/messages.js'
// 接入 generateToolUseSummary 服务层能力，把外部通信或共享状态交给 ./services/toolUseSummary/toolUseSummaryGenerator.js 处理。
import { generateToolUseSummary } from './services/toolUseSummary/toolUseSummaryGenerator.js'
// 复用 prependUserContext、appendSystemContext 工具函数，把通用处理留在 ./utils/api.js 中维护。
import { prependUserContext, appendSystemContext } from './utils/api.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  createAttachmentMessage,
  filterDuplicateMemoryAttachments,
  getAttachmentMessages,
  startRelevantMemoryPrefetch,
} from './utils/attachments.js'
/* eslint-disable @typescript-eslint/no-require-imports */
// skillPrefetch保存`feature`，供query后续处理使用。
const skillPrefetch = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? (require('./services/skillSearch/prefetch.js') as typeof import('./services/skillSearch/prefetch.js'))
  : null
// jobClassifier保存`feature`，供query后续处理使用。
const jobClassifier = feature('TEMPLATES')
  ? (require('./jobs/classifier.js') as typeof import('./jobs/classifier.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  remove as removeFromQueue,
  getCommandsByMaxPriority,
  isSlashCommand,
} from './utils/messageQueueManager.js'
// 复用 notifyCommandLifecycle 工具函数，把通用处理留在 ./utils/commandLifecycle.js 中维护。
import { notifyCommandLifecycle } from './utils/commandLifecycle.js'
// 复用 headlessProfilerCheckpoint 工具函数，把通用处理留在 ./utils/headlessProfiler.js 中维护。
import { headlessProfilerCheckpoint } from './utils/headlessProfiler.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  getRuntimeMainLoopModel,
  renderModelName,
} from './utils/model/model.js'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  doesMostRecentAssistantMessageExceed200k,
  finalContextTokensFromLastResponse,
  tokenCountWithEstimation,
} from './utils/tokens.js'
// 复用 ESCALATED_MAX_TOKENS 工具函数，把通用处理留在 ./utils/context.js 中维护。
import { ESCALATED_MAX_TOKENS } from './utils/context.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ./services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from './services/analytics/growthbook.js'
// 接入 SLEEP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SLEEP_TOOL_NAME } from './tools/SleepTool/prompt.js'
// 复用 executePostSamplingHooks 工具函数，把通用处理留在 ./utils/hooks/postSamplingHooks.js 中维护。
import { executePostSamplingHooks } from './utils/hooks/postSamplingHooks.js'
// 复用 executeStopFailureHooks 工具函数，把通用处理留在 ./utils/hooks.js 中维护。
import { executeStopFailureHooks } from './utils/hooks.js'
// 类型依赖 { QuerySource } 来自 ./constants/querySource.js，用于校准query的数据契约。
import type { QuerySource } from './constants/querySource.js'
// 接入 createDumpPromptsFetch 服务层能力，把外部通信或共享状态交给 ./services/api/dumpPrompts.js 处理。
import { createDumpPromptsFetch } from './services/api/dumpPrompts.js'
// 接入 StreamingToolExecutor 工具实现，后续工具池会按权限和开关决定是否暴露。
import { StreamingToolExecutor } from './services/tools/StreamingToolExecutor.js'
// 复用 queryCheckpoint 工具函数，把通用处理留在 ./utils/queryProfiler.js 中维护。
import { queryCheckpoint } from './utils/queryProfiler.js'
// 接入 runTools 工具实现，后续工具池会按权限和开关决定是否暴露。
import { runTools } from './services/tools/toolOrchestration.js'
// 复用 applyToolResultBudget 工具函数，把通用处理留在 ./utils/toolResultStorage.js 中维护。
import { applyToolResultBudget } from './utils/toolResultStorage.js'
// 复用 recordContentReplacement 工具函数，把通用处理留在 ./utils/sessionStorage.js 中维护。
import { recordContentReplacement } from './utils/sessionStorage.js'
// 引入 handleStopHooks，将 ./query/stopHooks.js 中已经封装好的能力接到本文件流程里。
import { handleStopHooks } from './query/stopHooks.js'
// 引入 buildQueryConfig，将 ./query/config.js 中已经封装好的能力接到本文件流程里。
import { buildQueryConfig } from './query/config.js'
// 引入 productionDeps、QueryDeps，将 ./query/deps.js 中已经封装好的能力接到本文件流程里。
import { productionDeps, type QueryDeps } from './query/deps.js'
// 类型依赖 { Terminal, Continue } 来自 ./query/transitions.js，用于校准query的数据契约。
import type { Terminal, Continue } from './query/transitions.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让query后续逻辑可以直接复用这些外部能力。
import {
  getCurrentTurnTokenBudget,
  getTurnOutputTokens,
  incrementBudgetContinuationCount,
} from './bootstrap/state.js'
// 引入 createBudgetTracker、checkTokenBudget，将 ./query/tokenBudget.js 中已经封装好的能力接到本文件流程里。
import { createBudgetTracker, checkTokenBudget } from './query/tokenBudget.js'
// 复用 count 工具函数，把通用处理留在 ./utils/array.js 中维护。
import { count } from './utils/array.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// snipModule保存`feature`，供query后续处理使用。
const snipModule = feature('HISTORY_SNIP')
  ? (require('./services/compact/snipCompact.js') as typeof import('./services/compact/snipCompact.js'))
  : null
// taskSummaryModule保存`feature`，供query后续处理使用。
const taskSummaryModule = feature('BG_SESSIONS')
  ? (require('./utils/taskSummary.js') as typeof import('./utils/taskSummary.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// query在这里处理 `function* yieldMissingToolResultBlocks(`，完成这一小步状态转换。
function* yieldMissingToolResultBlocks(
  assistantMessages: AssistantMessage[],
  errorMessage: string,
) {
  // 按顺序遍历 `assistantMessages` 中的assistantMessage 消息数据，逐个交给query处理。
  for (const assistantMessage of assistantMessages) {
    // Extract all tool use blocks from this assistant message
    // toolUseBlocks 集合筛选`content.filter`，供query后续处理使用。
    const toolUseBlocks = assistantMessage.message.content.filter(
      // 文本内容更新为 `> content.type === 'tool_use'`，确保query后续读取最新状态。
      content => content.type === 'tool_use',
    ) as ToolUseBlock[]

    // Emit an interruption message for each tool use
    // 按顺序遍历 `toolUseBlocks` 中的toolUse，逐个交给query处理。
    for (const toolUse of toolUseBlocks) {
      // 生成器产出 `createUserMessage({`，把阶段性结果交给上层消费。
      yield createUserMessage({
        content: [
          {
            type: 'tool_result',
            content: errorMessage,
            is_error: true,
            tool_use_id: toolUse.id,
          },
        ],
        toolUseResult: errorMessage,
        sourceToolAssistantUUID: assistantMessage.uuid,
      })
    }
  }
}

/**
 * The rules of thinking are lengthy and fortuitous. They require plenty of thinking
 * of most long duration and deep meditation for a wizard to wrap one's noggin around.
 *
 * The rules follow:
 * 1. A message that contains a thinking or redacted_thinking block must be part of a query whose max_thinking_length > 0
 * 2. A thinking block may not be the last message in a block
 * 3. Thinking blocks must be preserved for the duration of an assistant trajectory (a single turn, or if that turn includes a tool_use block then also its subsequent tool_result and the following assistant message)
 *
 * Heed these rules well, young wizard. For they are the rules of thinking, and
 * the rules of thinking are the rules of the universe. If ye does not heed these
 * rules, ye will be punished with an entire day of debugging and hair pulling.
 */
// MAX_OUTPUT_TOKENS_RECOVERY_LIMIT 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3

/**
 * Is this a max_output_tokens error message? If so, the streaming loop should
 * withhold it from SDK callers until we know whether the recovery loop can
 * continue. Yielding early leaks an intermediate error to SDK callers (e.g.
 * cowork/desktop) that terminate the session on any `error` field — the
 * recovery loop keeps running but nobody is listening.
 *
 * Mirrors reactiveCompact.isWithheldPromptTooLong.
 */
// isWithheldMaxOutputTokens 封装query的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWithheldMaxOutputTokens(
  msg: Message | StreamEvent | undefined,
): msg is AssistantMessage {
  // 返回 `msg?.type === 'assistant' && msg.apiError === 'max_output_tokens'`，作为query这次计算的结果。
  return msg?.type === 'assistant' && msg.apiError === 'max_output_tokens'
}

// QueryParams 固化query里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueryParams = {
  messages: Message[]
  systemPrompt: SystemPrompt
  userContext: { [k: string]: string }
  systemContext: { [k: string]: string }
  canUseTool: CanUseToolFn
  toolUseContext: ToolUseContext
  fallbackModel?: string
  querySource: QuerySource
  maxOutputTokensOverride?: number
  maxTurns?: number
  skipCacheWrite?: boolean
  // API task_budget (output_config.task_budget, beta task-budgets-2026-03-13).
  // Distinct from the tokenBudget +500k auto-continue feature. `total` is the
  // budget for the whole agentic turn; `remaining` is computed per iteration
  // from cumulative API usage. See configureTaskBudgetParams in claude.ts.
  taskBudget?: { total: number }
  deps?: QueryDeps
}

// -- query loop state

// Mutable state carried between loop iterations
// State 固化query里传递的数据形状，帮助调用方按同一结构读写字段。
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<ToolUseSummaryMessage | null> | undefined
  stopHookActive: boolean | undefined
  turnCount: number
  // Why the previous iteration continued. Undefined on first iteration.
  // Lets tests assert recovery paths fired without inspecting message contents.
  transition: Continue | undefined
}

// query在这里处理 `export async function* query(`，完成这一小步状态转换。
export async function* query(
  params: QueryParams,
): AsyncGenerator<
  | StreamEvent
  | RequestStartEvent
  | Message
  | TombstoneMessage
  | ToolUseSummaryMessage,
  Terminal
> {
  // consumedCommandUuids 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const consumedCommandUuids: string[] = []
  // terminal保存`queryLoop`，供query后续处理使用。
  const terminal = yield* queryLoop(params, consumedCommandUuids)
  // Only reached if queryLoop returned normally. Skipped on throw (error
  // propagates through yield*) and on .return() (Return completion closes
  // both generators). This gives the same asymmetric started-without-completed
  // signal as print.ts's drainCommandQueue when the turn fails.
  // 按顺序遍历 `consumedCommandUuids` 中的uuid，逐个交给query处理。
  for (const uuid of consumedCommandUuids) {
    // 调用 notifyCommandLifecycle，触发query此处需要的副作用。
    notifyCommandLifecycle(uuid, 'completed')
  }
  // 返回 `terminal`，作为query这次计算的结果。
  return terminal
}

// query在这里处理 `async function* queryLoop(`，完成这一小步状态转换。
async function* queryLoop(
  params: QueryParams,
  consumedCommandUuids: string[],
): AsyncGenerator<
  | StreamEvent
  | RequestStartEvent
  | Message
  | TombstoneMessage
  | ToolUseSummaryMessage,
  Terminal
> {
  // Immutable params — never reassigned during the query loop.
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    systemPrompt,
    userContext,
    systemContext,
    canUseTool,
    fallbackModel,
    querySource,
    maxTurns,
    skipCacheWrite,
  } = params
  // deps 集合保存`productionDeps`，供query后续处理使用。
  const deps = params.deps ?? productionDeps()

  // Mutable cross-iteration state. The loop body destructures this at the top
  // of each iteration so reads stay bare-name (`messages`, `toolUseContext`).
  // Continue sites write `state = { ... }` instead of 9 separate assignments.
  // 状态 集中保存query要一起传递的字段。
  let state: State = {
    messages: params.messages,
    toolUseContext: params.toolUseContext,
    maxOutputTokensOverride: params.maxOutputTokensOverride,
    autoCompactTracking: undefined,
    stopHookActive: undefined,
    maxOutputTokensRecoveryCount: 0,
    hasAttemptedReactiveCompact: false,
    turnCount: 1,
    pendingToolUseSummary: undefined,
    transition: undefined,
  }
  // budgetTracker保存`feature`，供query后续处理使用。
  const budgetTracker = feature('TOKEN_BUDGET') ? createBudgetTracker() : null

  // task_budget.remaining tracking across compaction boundaries. Undefined
  // until first compact fires — while context is uncompacted the server can
  // see the full history and handles the countdown from {total} itself (see
  // api/api/sampling/prompt/renderer.py:292). After a compact, the server sees
  // only the summary and would under-count spend; remaining tells it the
  // pre-compact final window that got summarized away. Cumulative across
  // multiple compacts: each subtracts the final context at that compact's
  // trigger point. Loop-local (not on State) to avoid touching the 7 continue
  // sites.
  // taskBudgetRemaining初始化为未定义值，后续分支会在有数据时补齐。
  let taskBudgetRemaining: number | undefined = undefined

  // Snapshot immutable env/statsig/session state once at entry. See QueryConfig
  // for what's included and why feature() gates are intentionally excluded.
  // 配置构建`buildQueryConfig`，供query后续处理使用。
  const config = buildQueryConfig()

  // Fired once per user turn — the prompt is invariant across loop iterations,
  // so per-iteration firing would ask sideQuery the same question N times.
  // Consume point polls settledAt (never blocks). `using` disposes on all
  // generator exit paths — see MemoryPrefetch for dispose/telemetry semantics.
  // query在这里处理 `using pendingMemoryPrefetch = startRelevantMemoryPrefetch(`，完成这一小步状态转换。
  using pendingMemoryPrefetch = startRelevantMemoryPrefetch(
    state.messages,
    state.toolUseContext,
  )

  // eslint-disable-next-line no-constant-condition
  // while 使用 true 完成query里的对应操作。
  while (true) {
    // Destructure state at the top of each iteration. toolUseContext alone
    // is reassigned within an iteration (queryTracking, messages updates);
    // the rest are read-only between continue sites.
    // 从 `state` 解构 toolUseContext，减少query对同一对象的重复访问。
    let { toolUseContext } = state
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      messages,
      autoCompactTracking,
      maxOutputTokensRecoveryCount,
      hasAttemptedReactiveCompact,
      maxOutputTokensOverride,
      pendingToolUseSummary,
      stopHookActive,
      turnCount,
    } = state

    // Skill discovery prefetch — per-iteration (uses findWritePivot guard
    // that returns early on non-write iterations). Discovery runs while the
    // model streams and tools execute; awaited post-tools alongside the
    // memory prefetch consume. Replaces the blocking assistant_turn path
    // that ran inside getAttachmentMessages (97% of those calls found
    // nothing in prod). Turn-0 user-input discovery still blocks in
    // userInputAttachments — that's the one signal where there's no prior
    // work to hide under.
    // pendingSkillPrefetch读取`startSkillDiscoveryPrefetch`，供query后续处理使用。
    const pendingSkillPrefetch = skillPrefetch?.startSkillDiscoveryPrefetch(
      null,
      messages,
      toolUseContext,
    )

    // 生成器产出 `{ type: 'stream_request_start' }`，把阶段性结果交给上层消费。
    yield { type: 'stream_request_start' }

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_fn_entry')

    // Record query start for headless latency tracking (skip for subagents)
    // toolUseContext.agentId缺失时提前走兜底路径，避免query继续依赖无效输入。
    if (!toolUseContext.agentId) {
      // 调用 headlessProfilerCheckpoint，触发query此处需要的副作用。
      headlessProfilerCheckpoint('query_started')
    }

    // Initialize or increment query chain tracking
    // queryTracking保存`toolUseContext.queryTracking`，供后续判断或组装使用。
    const queryTracking = toolUseContext.queryTracking
      ? {
          chainId: toolUseContext.queryTracking.chainId,
          depth: toolUseContext.queryTracking.depth + 1,
        }
      : {
          chainId: deps.uuid(),
          depth: 0,
        }

    // queryChainIdForAnalytics 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const queryChainIdForAnalytics =
      queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS

    // toolUseContext更新为 `{`，确保query后续读取最新状态。
    toolUseContext = {
      ...toolUseContext,
      queryTracking,
    }

    // messagesForQuery 消息数据读取`getMessagesAfterCompactBoundary`，供query后续处理使用。
    let messagesForQuery = [...getMessagesAfterCompactBoundary(messages)]

    // tracking 命名 `autoCompactTracking`，让后续代码直接表达这个值的用途。
    let tracking = autoCompactTracking

    // Enforce per-message budget on aggregate tool result size. Runs BEFORE
    // microcompact — cached MC operates purely by tool_use_id (never inspects
    // content), so content replacement is invisible to it and the two compose
    // cleanly. No-ops when contentReplacementState is undefined (feature off).
    // Persist only for querySources that read records back on resume: agentId
    // routes to sidechain file (AgentTool resume) or session file (/resume).
    // Ephemeral runForkedAgent callers (agent_summary etc.) don't persist.
    // persistReplacements 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const persistReplacements =
      querySource.startsWith('agent:') ||
      querySource.startsWith('repl_main_thread')
    // messagesForQuery 消息数据更新为 `await applyToolResultBudget(`，确保query后续读取最新状态。
    messagesForQuery = await applyToolResultBudget(
      messagesForQuery,
      toolUseContext.contentReplacementState,
      persistReplacements
        // 这个回调绑定到 ? records =>，负责query在该局部场景下的响应。
        ? records =>
            void recordContentReplacement(
              records,
              toolUseContext.agentId,
            ).catch(logError)
        : undefined,
      new Set(
        toolUseContext.options.tools
          // 链式调用 filter，继续加工上一行在query中产生的数据。
          .filter(t => !Number.isFinite(t.maxResultSizeChars))
          // 链式调用 map，继续加工上一行在query中产生的数据。
          .map(t => t.name),
      ),
    )

    // Apply snip before microcompact (both may run — they are not mutually exclusive).
    // snipTokensFreed is plumbed to autocompact so its threshold check reflects
    // what snip removed; tokenCountWithEstimation alone can't see it (reads usage
    // from the protected-tail assistant, which survives snip unchanged).
    // snipTokensFreed 命名 `0`，让后续代码直接表达这个值的用途。
    let snipTokensFreed = 0
    // 满足 `feature('HISTORY_SNIP')` 时，query执行该分支。
    if (feature('HISTORY_SNIP')) {
      // 调用 queryCheckpoint，触发query此处需要的副作用。
      queryCheckpoint('query_snip_start')
      // snipResult保存`snipCompactIfNeeded`，供query后续处理使用。
      const snipResult = snipModule!.snipCompactIfNeeded(messagesForQuery)
      // messagesForQuery 消息数据更新为 `snipResult.messages`，确保query后续读取最新状态。
      messagesForQuery = snipResult.messages
      // snipTokensFreed更新为 `snipResult.tokensFreed`，确保query后续读取最新状态。
      snipTokensFreed = snipResult.tokensFreed
      // 满足 `snipResult.boundaryMessage` 时，query执行该分支。
      if (snipResult.boundaryMessage) {
        // 生成器产出 `snipResult.boundaryMessage`，把阶段性结果交给上层消费。
        yield snipResult.boundaryMessage
      }
      // 调用 queryCheckpoint，触发query此处需要的副作用。
      queryCheckpoint('query_snip_end')
    }

    // Apply microcompact before autocompact
    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_microcompact_start')
    // microcompactResult保存`deps.microcompact`，供query后续处理使用。
    const microcompactResult = await deps.microcompact(
      messagesForQuery,
      toolUseContext,
      querySource,
    )
    // messagesForQuery 消息数据更新为 `microcompactResult.messages`，确保query后续读取最新状态。
    messagesForQuery = microcompactResult.messages
    // For cached microcompact (cache editing), defer boundary message until after
    // the API response so we can use actual cache_deleted_input_tokens.
    // Gated behind feature() so the string is eliminated from external builds.
    // pendingCacheEdits 缓存保存`feature`，供query后续处理使用。
    const pendingCacheEdits = feature('CACHED_MICROCOMPACT')
      ? microcompactResult.compactionInfo?.pendingCacheEdits
      : undefined
    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_microcompact_end')

    // Project the collapsed context view and maybe commit more collapses.
    // Runs BEFORE autocompact so that if collapse gets us under the
    // autocompact threshold, autocompact is a no-op and we keep granular
    // context instead of a single summary.
    //
    // Nothing is yielded — the collapsed view is a read-time projection
    // over the REPL's full history. Summary messages live in the collapse
    // store, not the REPL array. This is what makes collapses persist
    // across turns: projectView() replays the commit log on every entry.
    // Within a turn, the view flows forward via state.messages at the
    // continue site (query.ts:1192), and the next projectView() no-ops
    // because the archived messages are already gone from its input.
    // 组合条件 `feature('CONTEXT_COLLAPSE') && contextCollapse` 成立时，query才启用这条专门路径。
    if (feature('CONTEXT_COLLAPSE') && contextCollapse) {
      // collapseResult保存`contextCollapse.applyCollapsesIfNeeded`，供query后续处理使用。
      const collapseResult = await contextCollapse.applyCollapsesIfNeeded(
        messagesForQuery,
        toolUseContext,
        querySource,
      )
      // messagesForQuery 消息数据更新为 `collapseResult.messages`，确保query后续读取最新状态。
      messagesForQuery = collapseResult.messages
    }

    // fullSystemPrompt保存`asSystemPrompt`，供query后续处理使用。
    const fullSystemPrompt = asSystemPrompt(
      appendSystemContext(systemPrompt, systemContext),
    )

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_autocompact_start')
    // 从 `await deps.autocompact(` 解构 compactionResult、consecutiveFailures，减少query对同一对象的重复访问。
    const { compactionResult, consecutiveFailures } = await deps.autocompact(
      messagesForQuery,
      toolUseContext,
      {
        systemPrompt,
        userContext,
        systemContext,
        toolUseContext,
        forkContextMessages: messagesForQuery,
      },
      querySource,
      tracking,
      snipTokensFreed,
    )
    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_autocompact_end')

    // 满足 `compactionResult` 时，query执行该分支。
    if (compactionResult) {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        preCompactTokenCount,
        postCompactTokenCount,
        truePostCompactTokenCount,
        compactionUsage,
      } = compactionResult

      // 记录query运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_auto_compact_succeeded', {
        originalMessageCount: messages.length,
        compactedMessageCount:
          compactionResult.summaryMessages.length +
          compactionResult.attachments.length +
          compactionResult.hookResults.length,
        preCompactTokenCount,
        postCompactTokenCount,
        truePostCompactTokenCount,
        compactionInputTokens: compactionUsage?.input_tokens,
        compactionOutputTokens: compactionUsage?.output_tokens,
        compactionCacheReadTokens:
          compactionUsage?.cache_read_input_tokens ?? 0,
        compactionCacheCreationTokens:
          compactionUsage?.cache_creation_input_tokens ?? 0,
        compactionTotalTokens: compactionUsage
          ? compactionUsage.input_tokens +
            (compactionUsage.cache_creation_input_tokens ?? 0) +
            (compactionUsage.cache_read_input_tokens ?? 0) +
            compactionUsage.output_tokens
          : 0,

        queryChainId: queryChainIdForAnalytics,
        queryDepth: queryTracking.depth,
      })

      // task_budget: capture pre-compact final context window before
      // messagesForQuery is replaced with postCompactMessages below.
      // iterations[-1] is the authoritative final window (post server tool
      // loops); see #304930.
      // 满足 `params.taskBudget` 时，query执行该分支。
      if (params.taskBudget) {
        // preCompactContext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const preCompactContext =
          finalContextTokensFromLastResponse(messagesForQuery)
        // taskBudgetRemaining更新为 `Math.max(`，确保query后续读取最新状态。
        taskBudgetRemaining = Math.max(
          0,
          (taskBudgetRemaining ?? params.taskBudget.total) - preCompactContext,
        )
      }

      // Reset on every compact so turnCounter/turnId reflect the MOST RECENT
      // compact. recompactionInfo (autoCompact.ts:190) already captured the
      // old values for turnsSincePreviousCompact/previousCompactTurnId before
      // the call, so this reset doesn't lose those.
      // tracking更新为 `{`，确保query后续读取最新状态。
      tracking = {
        compacted: true,
        turnId: deps.uuid(),
        turnCounter: 0,
        consecutiveFailures: 0,
      }

      // postCompactMessages 消息数据构建`buildPostCompactMessages`，供query后续处理使用。
      const postCompactMessages = buildPostCompactMessages(compactionResult)

      // 按顺序遍历 `postCompactMessages` 中的消息，逐个交给query处理。
      for (const message of postCompactMessages) {
        // 生成器产出 `message`，把阶段性结果交给上层消费。
        yield message
      }

      // Continue on with the current query call using the post compact messages
      // messagesForQuery 消息数据更新为 `postCompactMessages`，确保query后续读取最新状态。
      messagesForQuery = postCompactMessages
    // query在这里处理 `} else if (consecutiveFailures !== undefined) {`，完成这一小步状态转换。
    } else if (consecutiveFailures !== undefined) {
      // Autocompact failed — propagate failure count so the circuit breaker
      // can stop retrying on the next iteration.
      // tracking更新为 `{`，确保query后续读取最新状态。
      tracking = {
        ...(tracking ?? { compacted: false, turnId: '', turnCounter: 0 }),
        consecutiveFailures,
      }
    }

    //TODO: no need to set toolUseContext.messages during set-up since it is updated here
    // toolUseContext更新为 `{`，确保query后续读取最新状态。
    toolUseContext = {
      ...toolUseContext,
      messages: messagesForQuery,
    }

    // assistantMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const assistantMessages: AssistantMessage[] = []
    // toolResults 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const toolResults: (UserMessage | AttachmentMessage)[] = []
    // @see https://docs.claude.com/en/docs/build-with-claude/tool-use
    // Note: stop_reason === 'tool_use' is unreliable -- it's not always set correctly.
    // Set during streaming whenever a tool_use block arrives — the sole
    // loop-exit signal. If false after streaming, we're done (modulo stop-hook retry).
    // toolUseBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const toolUseBlocks: ToolUseBlock[] = []
    // needsFollowUp标记query是否启用对应路径。
    let needsFollowUp = false

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_setup_start')
    // useStreamingToolExecution保存`config.gates.streamingToolExecution`，供query后续判断或输出使用。
    const useStreamingToolExecution = config.gates.streamingToolExecution
    // streamingToolExecutor读取 hook 状态，供query本轮渲染使用。
    let streamingToolExecutor = useStreamingToolExecution
      ? new StreamingToolExecutor(
          toolUseContext.options.tools,
          canUseTool,
          toolUseContext,
        )
      : null

    // appState 状态读取`toolUseContext.getAppState`，供query后续处理使用。
    const appState = toolUseContext.getAppState()
    // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供query后续判断或输出使用。
    const permissionMode = appState.toolPermissionContext.mode
    // currentModel读取`getRuntimeMainLoopModel`，供query后续处理使用。
    let currentModel = getRuntimeMainLoopModel({
      permissionMode,
      mainLoopModel: toolUseContext.options.mainLoopModel,
      exceeds200kTokens:
        permissionMode === 'plan' &&
        doesMostRecentAssistantMessageExceed200k(messagesForQuery),
    })

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_setup_end')

    // Create fetch wrapper once per query session to avoid memory retention.
    // Each call to createDumpPromptsFetch creates a closure that captures the request body.
    // Creating it once means only the latest request body is retained (~700KB),
    // instead of all request bodies from the session (~500MB for long sessions).
    // Note: agentId is effectively constant during a query() call - it only changes
    // between queries (e.g., /clear command or session resume).
    // dumpPromptsFetch保存`config.gates.isAnt`，供后续判断或组装使用。
    const dumpPromptsFetch = config.gates.isAnt
      ? createDumpPromptsFetch(toolUseContext.agentId ?? config.sessionId)
      : undefined

    // Block if we've hit the hard blocking limit (only applies when auto-compact is OFF)
    // This reserves space so users can still run /compact manually
    // Skip this check if compaction just happened - the compaction result is already
    // validated to be under the threshold, and tokenCountWithEstimation would use
    // stale input_tokens from kept messages that reflect pre-compaction context size.
    // Same staleness applies to snip: subtract snipTokensFreed (otherwise we'd
    // falsely block in the window where snip brought us under autocompact threshold
    // but the stale usage is still above blocking limit — before this PR that
    // window never existed because autocompact always fired on the stale count).
    // Also skip for compact/session_memory queries — these are forked agents that
    // inherit the full conversation and would deadlock if blocked here (the compact
    // agent needs to run to REDUCE the token count).
    // Also skip when reactive compact is enabled and automatic compaction is
    // allowed — the preempt's synthetic error returns before the API call,
    // so reactive compact would never see a prompt-too-long to react to.
    // Widened to walrus so RC can act as fallback when proactive fails.
    //
    // Same skip for context-collapse: its recoverFromOverflow drains
    // staged collapses on a REAL API 413, then falls through to
    // reactiveCompact. A synthetic preempt here would return before the
    // API call and starve both recovery paths. The isAutoCompactEnabled()
    // conjunct preserves the user's explicit "no automatic anything"
    // config — if they set DISABLE_AUTO_COMPACT, they get the preempt.
    // collapseOwnsIt标记query是否启用对应路径。
    let collapseOwnsIt = false
    // 满足 `feature('CONTEXT_COLLAPSE')` 时，query执行该分支。
    if (feature('CONTEXT_COLLAPSE')) {
      // query在这里处理 `collapseOwnsIt =`，完成这一小步状态转换。
      collapseOwnsIt =
        (contextCollapse?.isContextCollapseEnabled() ?? false) &&
        isAutoCompactEnabled()
    }
    // Hoist media-recovery gate once per turn. Withholding (inside the
    // stream loop) and recovery (after) must agree; CACHED_MAY_BE_STALE can
    // flip during the 5-30s stream, and withhold-without-recover would eat
    // the message. PTL doesn't hoist because its withholding is ungated —
    // it predates the experiment and is already the control-arm baseline.
    // mediaRecoveryEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const mediaRecoveryEnabled =
      reactiveCompact?.isReactiveCompactEnabled() ?? false
    // query在这里进入条件判断，后续代码按实际状态分流。
    if (
      !compactionResult &&
      querySource !== 'compact' &&
      querySource !== 'session_memory' &&
      !(
        reactiveCompact?.isReactiveCompactEnabled() && isAutoCompactEnabled()
      ) &&
      !collapseOwnsIt
    ) {
      // 从 `calculateTokenWarningState(` 解构 isAtBlockingLimit，减少query对同一对象的重复访问。
      const { isAtBlockingLimit } = calculateTokenWarningState(
        tokenCountWithEstimation(messagesForQuery) - snipTokensFreed,
        toolUseContext.options.mainLoopModel,
      )
      // 满足 `isAtBlockingLimit` 时，query执行该分支。
      if (isAtBlockingLimit) {
        // 生成器产出 `createAssistantAPIErrorMessage({`，把阶段性结果交给上层消费。
        yield createAssistantAPIErrorMessage({
          content: PROMPT_TOO_LONG_ERROR_MESSAGE,
          error: 'invalid_request',
        })
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: 'blocking_limit' }
      }
    }

    // attemptWithFallback标记query是否启用对应路径。
    let attemptWithFallback = true

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_api_loop_start')
    // 保护这一段可能失败的query操作，确保异常能进入相邻错误处理。
    try {
      // while 使用 attemptWithFallback 完成query里的对应操作。
      while (attemptWithFallback) {
        // attemptWithFallback更新为 `false`，确保query后续读取最新状态。
        attemptWithFallback = false
        // 保护这一段可能失败的query操作，确保异常能进入相邻错误处理。
        try {
          // streamingFallbackOccured标记query是否启用对应路径。
          let streamingFallbackOccured = false
          // 调用 queryCheckpoint，触发query此处需要的副作用。
          queryCheckpoint('query_api_streaming_start')
          // 逐项读取 `deps.callModel({` 中的消息，按输入顺序推进query。
          for await (const message of deps.callModel({
            messages: prependUserContext(messagesForQuery, userContext),
            systemPrompt: fullSystemPrompt,
            thinkingConfig: toolUseContext.options.thinkingConfig,
            tools: toolUseContext.options.tools,
            signal: toolUseContext.abortController.signal,
            options: {
              // getToolPermissionContext不依赖额外参数，直接计算query需要的结果。
              async getToolPermissionContext() {
                // appState 状态读取`toolUseContext.getAppState`，供query后续处理使用。
                const appState = toolUseContext.getAppState()
                // 返回 `appState.toolPermissionContext`，作为query这次计算的结果。
                return appState.toolPermissionContext
              },
              model: currentModel,
              ...(config.gates.fastModeEnabled && {
                fastMode: appState.fastMode,
              }),
              toolChoice: undefined,
              isNonInteractiveSession:
                toolUseContext.options.isNonInteractiveSession,
              fallbackModel,
              // 这个回调绑定到 onStreamingFallback: () => {，负责query在该局部场景下的响应。
              onStreamingFallback: () => {
                // streamingFallbackOccured更新为 `true`，确保query后续读取最新状态。
                streamingFallbackOccured = true
              },
              querySource,
              agents: toolUseContext.options.agentDefinitions.activeAgents,
              allowedAgentTypes:
                toolUseContext.options.agentDefinitions.allowedAgentTypes,
              hasAppendSystemPrompt:
                !!toolUseContext.options.appendSystemPrompt,
              maxOutputTokensOverride,
              fetchOverride: dumpPromptsFetch,
              mcpTools: appState.mcp.tools,
              hasPendingMcpServers: appState.mcp.clients.some(
                // c更新为 `> c.type === 'pending'`，确保query后续读取最新状态。
                c => c.type === 'pending',
              ),
              queryTracking,
              effortValue: appState.effortValue,
              advisorModel: appState.advisorModel,
              skipCacheWrite,
              agentId: toolUseContext.agentId,
              addNotification: toolUseContext.addNotification,
              ...(params.taskBudget && {
                taskBudget: {
                  total: params.taskBudget.total,
                  ...(taskBudgetRemaining !== undefined && {
                    remaining: taskBudgetRemaining,
                  }),
                },
              }),
            },
          })) {
            // We won't use the tool_calls from the first attempt
            // We could.. but then we'd have to merge assistant messages
            // with different ids and double up on full the tool_results
            // 满足 `streamingFallbackOccured` 时，query执行该分支。
            if (streamingFallbackOccured) {
              // Yield tombstones for orphaned messages so they're removed from UI and transcript.
              // These partial messages (especially thinking blocks) have invalid signatures
              // that would cause "thinking blocks cannot be modified" API errors.
              // 按顺序遍历 `assistantMessages` 中的消息，逐个交给query处理。
              for (const msg of assistantMessages) {
                // 生成器产出 `{ type: 'tombstone' as const, message: msg }`，把阶段性结果交给上层消费。
                yield { type: 'tombstone' as const, message: msg }
              }
              // 记录query运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_orphaned_messages_tombstoned', {
                orphanedMessageCount: assistantMessages.length,
                queryChainId: queryChainIdForAnalytics,
                queryDepth: queryTracking.depth,
              })

              // assistantMessages 消息数据被清空，query从干净状态继续。
              assistantMessages.length = 0
              // toolResults 集合被清空，query从干净状态继续。
              toolResults.length = 0
              // toolUseBlocks 集合被清空，query从干净状态继续。
              toolUseBlocks.length = 0
              // needsFollowUp更新为 `false`，确保query后续读取最新状态。
              needsFollowUp = false

              // Discard pending results from the failed streaming attempt and create
              // a fresh executor. This prevents orphan tool_results (with old tool_use_ids)
              // from being yielded after the fallback response arrives.
              // 满足 `streamingToolExecutor` 时，query执行该分支。
              if (streamingToolExecutor) {
                // 调用 streamingToolExecutor.discard，触发query此处需要的副作用。
                streamingToolExecutor.discard()
                // streamingToolExecutor更新为 `new StreamingToolExecutor(`，确保query后续读取最新状态。
                streamingToolExecutor = new StreamingToolExecutor(
                  toolUseContext.options.tools,
                  canUseTool,
                  toolUseContext,
                )
              }
            }
            // Backfill tool_use inputs on a cloned message before yield so
            // SDK stream output and transcript serialization see legacy/derived
            // fields. The original `message` is left untouched for
            // assistantMessages.push below — it flows back to the API and
            // mutating it would break prompt caching (byte mismatch).
            // yieldMessage 消息数据 命名 `message`，让后续代码直接表达这个值的用途。
            let yieldMessage: typeof message = message
            // 当 `message.type` 匹配 `'assistant'` 时，query执行对应分支。
            if (message.type === 'assistant') {
              // clonedContent 先占位，稍后的条件分支会根据实际输入补齐它。
              let clonedContent: typeof message.message.content | undefined
              // 按索引扫描 `message.message.content.length`，需要消费相邻参数时可以精确移动游标。
              for (let i = 0; i < message.message.content.length; i++) {
                // block 命名 `message.message.content[i]!`，让后续代码直接表达这个值的用途。
                const block = message.message.content[i]!
                // query在这里进入条件判断，后续代码按实际状态分流。
                if (
                  block.type === 'tool_use' &&
                  typeof block.input === 'object' &&
                  block.input !== null
                ) {
                  // 工具筛选`findToolByName`，供query后续处理使用。
                  const tool = findToolByName(
                    toolUseContext.options.tools,
                    block.name,
                  )
                  // 满足 `tool?.backfillObservableInput` 时，query执行该分支。
                  if (tool?.backfillObservableInput) {
                    // originalInput保存`block.input as Record<string, unknown>`，供query后续判断或输出使用。
                    const originalInput = block.input as Record<string, unknown>
                    // inputCopy 集中保存query要一起传递的字段。
                    const inputCopy = { ...originalInput }
                    // 调用 tool.backfillObservableInput，触发query此处需要的副作用。
                    tool.backfillObservableInput(inputCopy)
                    // Only yield a clone when backfill ADDED fields; skip if
                    // it only OVERWROTE existing ones (e.g. file tools
                    // expanding file_path). Overwrites change the serialized
                    // transcript and break VCR fixture hashes on resume,
                    // while adding nothing the SDK stream needs — hooks get
                    // the expanded path via toolExecution.ts separately.
                    // addedFields 集合派生`Object.keys`，供query后续处理使用。
                    const addedFields = Object.keys(inputCopy).some(
                      // k更新为 `> !(k in originalInput)`，确保query后续读取最新状态。
                      k => !(k in originalInput),
                    )
                    // 满足 `addedFields` 时，query执行该分支。
                    if (addedFields) {
                      // query在这里处理 `clonedContent ??= [...message.message.content]`，完成这一小步状态转换。
                      clonedContent ??= [...message.message.content]
                      // clonedContent[i更新为 `{ ...block, input: inputCopy }`，确保query后续读取最新状态。
                      clonedContent[i] = { ...block, input: inputCopy }
                    }
                  }
                }
              }
              // 满足 `clonedContent` 时，query执行该分支。
              if (clonedContent) {
                // yieldMessage 消息数据更新为 `{`，确保query后续读取最新状态。
                yieldMessage = {
                  ...message,
                  message: { ...message.message, content: clonedContent },
                }
              }
            }
            // Withhold recoverable errors (prompt-too-long, max-output-tokens)
            // until we know whether recovery (collapse drain / reactive
            // compact / truncation retry) can succeed. Still pushed to
            // assistantMessages so the recovery checks below find them.
            // Either subsystem's withhold is sufficient — they're
            // independent so turning one off doesn't break the other's
            // recovery path.
            //
            // feature() only works in if/ternary conditions (bun:bundle
            // tree-shaking constraint), so the collapse check is nested
            // rather than composed.
            // withheld标记query是否启用对应路径。
            let withheld = false
            // 满足 `feature('CONTEXT_COLLAPSE')` 时，query执行该分支。
            if (feature('CONTEXT_COLLAPSE')) {
              // query在这里进入条件判断，后续代码按实际状态分流。
              if (
                contextCollapse?.isWithheldPromptTooLong(
                  message,
                  isPromptTooLongMessage,
                  querySource,
                )
              ) {
                // withheld更新为 `true`，确保query后续读取最新状态。
                withheld = true
              }
            }
            // 满足 `reactiveCompact?.isWithheldPromptTooLong(message)` 时，query执行该分支。
            if (reactiveCompact?.isWithheldPromptTooLong(message)) {
              // withheld更新为 `true`，确保query后续读取最新状态。
              withheld = true
            }
            // query在这里进入条件判断，后续代码按实际状态分流。
            if (
              mediaRecoveryEnabled &&
              reactiveCompact?.isWithheldMediaSizeError(message)
            ) {
              // withheld更新为 `true`，确保query后续读取最新状态。
              withheld = true
            }
            // 满足 `isWithheldMaxOutputTokens(message)` 时，query执行该分支。
            if (isWithheldMaxOutputTokens(message)) {
              // withheld更新为 `true`，确保query后续读取最新状态。
              withheld = true
            }
            // withheld缺失时提前走兜底路径，避免query继续依赖无效输入。
            if (!withheld) {
              // 生成器产出 `yieldMessage`，把阶段性结果交给上层消费。
              yield yieldMessage
            }
            // 当 `message.type` 匹配 `'assistant'` 时，query执行对应分支。
            if (message.type === 'assistant') {
              // assistantMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
              assistantMessages.push(message)

              // msgToolUseBlocks 集合筛选`content.filter`，供query后续处理使用。
              const msgToolUseBlocks = message.message.content.filter(
                // 文本内容更新为 `> content.type === 'tool_use'`，确保query后续读取最新状态。
                content => content.type === 'tool_use',
              ) as ToolUseBlock[]
              // 满足 `msgToolUseBlocks.length > 0` 时，query执行该分支。
              if (msgToolUseBlocks.length > 0) {
                // toolUseBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
                toolUseBlocks.push(...msgToolUseBlocks)
                // needsFollowUp更新为 `true`，确保query后续读取最新状态。
                needsFollowUp = true
              }

              // query在这里进入条件判断，后续代码按实际状态分流。
              if (
                streamingToolExecutor &&
                !toolUseContext.abortController.signal.aborted
              ) {
                // 按顺序遍历 `msgToolUseBlocks` 中的toolBlock，逐个交给query处理。
                for (const toolBlock of msgToolUseBlocks) {
                  // 调用 streamingToolExecutor.addTool，触发query此处需要的副作用。
                  streamingToolExecutor.addTool(toolBlock, message)
                }
              }
            }

            // query在这里进入条件判断，后续代码按实际状态分流。
            if (
              streamingToolExecutor &&
              !toolUseContext.abortController.signal.aborted
            ) {
              // 逐项读取 `streamingToolExecutor.getCompletedResults()` 中的结果，按输入顺序推进query。
              for (const result of streamingToolExecutor.getCompletedResults()) {
                // 满足 `result.message` 时，query执行该分支。
                if (result.message) {
                  // 生成器产出 `result.message`，把阶段性结果交给上层消费。
                  yield result.message
                  // toolResults 集合追加新条目，保持收集顺序与输入顺序一致。
                  toolResults.push(
                    ...normalizeMessagesForAPI(
                      [result.message],
                      toolUseContext.options.tools,
                    // 这个回调绑定到 ).filter(_ => _.type === 'user'),，负责query在该局部场景下的响应。
                    ).filter(_ => _.type === 'user'),
                  )
                }
              }
            }
          }
          // 调用 queryCheckpoint，触发query此处需要的副作用。
          queryCheckpoint('query_api_streaming_end')

          // Yield deferred microcompact boundary message using actual API-reported
          // token deletion count instead of client-side estimates.
          // Entire block gated behind feature() so the excluded string
          // is eliminated from external builds.
          // 组合条件 `feature('CACHED_MICROCOMPACT') && pendingCacheEdits` 成立时，query才启用这条专门路径。
          if (feature('CACHED_MICROCOMPACT') && pendingCacheEdits) {
            // lastAssistant保存`assistantMessages.at`，供query后续处理使用。
            const lastAssistant = assistantMessages.at(-1)
            // The API field is cumulative/sticky across requests, so we
            // subtract the baseline captured before this request to get the delta.
            // usage保存`lastAssistant?.message.usage`，供query后续判断或输出使用。
            const usage = lastAssistant?.message.usage
            // cumulativeDeleted保存`usage`，供query后续判断或输出使用。
            const cumulativeDeleted = usage
              ? ((usage as unknown as Record<string, number>)
                  .cache_deleted_input_tokens ?? 0)
              : 0
            // deletedTokens 集合保存`Math.max`，供query后续处理使用。
            const deletedTokens = Math.max(
              0,
              cumulativeDeleted - pendingCacheEdits.baselineCacheDeletedTokens,
            )
            // 满足 `deletedTokens > 0` 时，query执行该分支。
            if (deletedTokens > 0) {
              // 生成器产出 `createMicrocompactBoundaryMessage(`，把阶段性结果交给上层消费。
              yield createMicrocompactBoundaryMessage(
                pendingCacheEdits.trigger,
                0,
                deletedTokens,
                pendingCacheEdits.deletedToolIds,
                [],
              )
            }
          }
        } catch (innerError) {
          // 组合条件 `innerError instanceof FallbackTriggeredError && f` 成立时，query才启用这条专门路径。
          if (innerError instanceof FallbackTriggeredError && fallbackModel) {
            // Fallback was triggered - switch model and retry
            // currentModel更新为 `fallbackModel`，确保query后续读取最新状态。
            currentModel = fallbackModel
            // attemptWithFallback更新为 `true`，确保query后续读取最新状态。
            attemptWithFallback = true

            // Clear assistant messages since we'll retry the entire request
            // 生成器产出 `yield* yieldMissingToolResultBlocks(`，把阶段性结果交给上层消费。
            yield* yieldMissingToolResultBlocks(
              assistantMessages,
              'Model fallback triggered',
            )
            // assistantMessages 消息数据被清空，query从干净状态继续。
            assistantMessages.length = 0
            // toolResults 集合被清空，query从干净状态继续。
            toolResults.length = 0
            // toolUseBlocks 集合被清空，query从干净状态继续。
            toolUseBlocks.length = 0
            // needsFollowUp更新为 `false`，确保query后续读取最新状态。
            needsFollowUp = false

            // Discard pending results from the failed attempt and create a
            // fresh executor. This prevents orphan tool_results (with old
            // tool_use_ids) from leaking into the retry.
            // 满足 `streamingToolExecutor` 时，query执行该分支。
            if (streamingToolExecutor) {
              // 调用 streamingToolExecutor.discard，触发query此处需要的副作用。
              streamingToolExecutor.discard()
              // streamingToolExecutor更新为 `new StreamingToolExecutor(`，确保query后续读取最新状态。
              streamingToolExecutor = new StreamingToolExecutor(
                toolUseContext.options.tools,
                canUseTool,
                toolUseContext,
              )
            }

            // Update tool use context with new model
            // mainLoopModel更新为 `fallbackModel`，确保query后续读取最新状态。
            toolUseContext.options.mainLoopModel = fallbackModel

            // Thinking signatures are model-bound: replaying a protected-thinking
            // block (e.g. capybara) to an unprotected fallback (e.g. opus) 400s.
            // Strip before retry so the fallback model gets clean history.
            // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，query执行对应分支。
            if (process.env.USER_TYPE === 'ant') {
              // messagesForQuery 消息数据更新为 `stripSignatureBlocks(messagesForQuery)`，确保query后续读取最新状态。
              messagesForQuery = stripSignatureBlocks(messagesForQuery)
            }

            // Log the fallback event
            // 记录query运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_model_fallback_triggered', {
              original_model:
                innerError.originalModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              fallback_model:
                fallbackModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              entrypoint:
                'cli' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              queryChainId: queryChainIdForAnalytics,
              queryDepth: queryTracking.depth,
            })

            // Yield system message about fallback — use 'warning' level so
            // users see the notification without needing verbose mode
            // 生成器产出 `createSystemMessage(`，把阶段性结果交给上层消费。
            yield createSystemMessage(
              `Switched to ${renderModelName(innerError.fallbackModel)} due to high demand for ${renderModelName(innerError.originalModel)}`,
              'warning',
            )

            // 跳过当前项，继续处理query中的下一轮循环。
            continue
          }
          // 抛出 innerError，阻止query在无效状态下继续运行。
          throw innerError
        }
      }
    } catch (error) {
      // 记录query运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录query运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_query_error', {
        assistantMessages: assistantMessages.length,
        // 这个回调绑定到 toolUses: assistantMessages.flatMap(_ =>，负责query在该局部场景下的响应。
        toolUses: assistantMessages.flatMap(_ =>
          // 调用 _.message.content.filter，触发query此处需要的副作用。
          _.message.content.filter(content => content.type === 'tool_use'),
        ).length,

        queryChainId: queryChainIdForAnalytics,
        queryDepth: queryTracking.depth,
      })

      // Handle image size/resize errors with user-friendly messages
      // query在这里进入条件判断，后续代码按实际状态分流。
      if (
        error instanceof ImageSizeError ||
        error instanceof ImageResizeError
      ) {
        // 生成器产出 `createAssistantAPIErrorMessage({`，把阶段性结果交给上层消费。
        yield createAssistantAPIErrorMessage({
          content: error.message,
        })
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: 'image_error' }
      }

      // Generally queryModelWithStreaming should not throw errors but instead
      // yield them as synthetic assistant messages. However if it does throw
      // due to a bug, we may end up in a state where we have already emitted
      // a tool_use block but will stop before emitting the tool_result.
      // 生成器产出 `yield* yieldMissingToolResultBlocks(assistantMessages, errorMessage)`，把阶段性结果交给上层消费。
      yield* yieldMissingToolResultBlocks(assistantMessages, errorMessage)

      // Surface the real error instead of a misleading "[Request interrupted
      // by user]" — this path is a model/runtime failure, not a user action.
      // SDK consumers were seeing phantom interrupts on e.g. Node 18's missing
      // Array.prototype.with(), masking the actual cause.
      // 生成器产出 `createAssistantAPIErrorMessage({`，把阶段性结果交给上层消费。
      yield createAssistantAPIErrorMessage({
        content: errorMessage,
      })

      // To help track down bugs, log loudly for ants
      // 调用 logAntError，触发query此处需要的副作用。
      logAntError('Query error', error)
      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'model_error', error }
    }

    // Execute post-sampling hooks after model response is complete
    // 满足 `assistantMessages.length > 0` 时，query执行该分支。
    if (assistantMessages.length > 0) {
      // 显式忽略 `executePostSamplingHooks(` 的返回值，只保留它触发的副作用。
      void executePostSamplingHooks(
        [...messagesForQuery, ...assistantMessages],
        systemPrompt,
        userContext,
        systemContext,
        toolUseContext,
        querySource,
      )
    }

    // We need to handle a streaming abort before anything else.
    // When using streamingToolExecutor, we must consume getRemainingResults() so the
    // executor can generate synthetic tool_result blocks for queued/in-progress tools.
    // Without this, tool_use blocks would lack matching tool_result blocks.
    // 满足 `toolUseContext.abortController.signal.aborted` 时，query执行该分支。
    if (toolUseContext.abortController.signal.aborted) {
      // 满足 `streamingToolExecutor` 时，query执行该分支。
      if (streamingToolExecutor) {
        // Consume remaining results - executor generates synthetic tool_results for
        // aborted tools since it checks the abort signal in executeTool()
        // 逐项读取 `streamingToolExecutor.getRemainingResults()` 中的update，按输入顺序推进query。
        for await (const update of streamingToolExecutor.getRemainingResults()) {
          // 满足 `update.message` 时，query执行该分支。
          if (update.message) {
            // 生成器产出 `update.message`，把阶段性结果交给上层消费。
            yield update.message
          }
        }
      } else {
        // 生成器产出 `yield* yieldMissingToolResultBlocks(`，把阶段性结果交给上层消费。
        yield* yieldMissingToolResultBlocks(
          assistantMessages,
          'Interrupted by user',
        )
      }
      // chicago MCP: auto-unhide + lock release on interrupt. Same cleanup
      // as the natural turn-end path in stopHooks.ts. Main thread only —
      // see stopHooks.ts for the subagent-releasing-main's-lock rationale.
      // 组合条件 `feature('CHICAGO_MCP') && !toolUseContext.agentId` 成立时，query才启用这条专门路径。
      if (feature('CHICAGO_MCP') && !toolUseContext.agentId) {
        // 保护这一段可能失败的query操作，确保异常能进入相邻错误处理。
        try {
          // 从 `await import(` 解构 cleanupComputerUseAfterTurn，减少query对同一对象的重复访问。
          const { cleanupComputerUseAfterTurn } = await import(
            './utils/computerUse/cleanup.js'
          )
          // 等待 `cleanupComputerUseAfterTurn(toolUseContext)` 完成，再继续query的异步流程。
          await cleanupComputerUseAfterTurn(toolUseContext)
        } catch {
          // Failures are silent — this is dogfooding cleanup, not critical path
        }
      }

      // Skip the interruption message for submit-interrupts — the queued
      // user message that follows provides sufficient context.
      // 满足 `toolUseContext.abortController.signal.reason !==` 时，query执行该分支。
      if (toolUseContext.abortController.signal.reason !== 'interrupt') {
        // 生成器产出 `createUserInterruptionMessage({`，把阶段性结果交给上层消费。
        yield createUserInterruptionMessage({
          toolUse: false,
        })
      }
      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'aborted_streaming' }
    }

    // Yield tool use summary from previous turn — haiku (~1s) resolved during model streaming (5-30s)
    // 满足 `pendingToolUseSummary` 时，query执行该分支。
    if (pendingToolUseSummary) {
      // summary 等待 `pendingToolUseSummary`，确保继续执行前已有结果。
      const summary = await pendingToolUseSummary
      // 满足 `summary` 时，query执行该分支。
      if (summary) {
        // 生成器产出 `summary`，把阶段性结果交给上层消费。
        yield summary
      }
    }

    // needsFollowUp缺失时提前走兜底路径，避免query继续依赖无效输入。
    if (!needsFollowUp) {
      // lastMessage 消息数据保存`assistantMessages.at`，供query后续处理使用。
      const lastMessage = assistantMessages.at(-1)

      // Prompt-too-long recovery: the streaming loop withheld the error
      // (see withheldByCollapse / withheldByReactive above). Try collapse
      // drain first (cheap, keeps granular context), then reactive compact
      // (full summary). Single-shot on each — if a retry still 413's,
      // the next stage handles it or the error surfaces.
      // isWithheld413 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isWithheld413 =
        lastMessage?.type === 'assistant' &&
        lastMessage.isApiErrorMessage &&
        isPromptTooLongMessage(lastMessage)
      // Media-size rejections (image/PDF/many-image) are recoverable via
      // reactive compact's strip-retry. Unlike PTL, media errors skip the
      // collapse drain — collapse doesn't strip images. mediaRecoveryEnabled
      // is the hoisted gate from before the stream loop (same value as the
      // withholding check — these two must agree or a withheld message is
      // lost). If the oversized media is in the preserved tail, the
      // post-compact turn will media-error again; hasAttemptedReactiveCompact
      // prevents a spiral and the error surfaces.
      // isWithheldMedia 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isWithheldMedia =
        mediaRecoveryEnabled &&
        reactiveCompact?.isWithheldMediaSizeError(lastMessage)
      // 满足 `isWithheld413` 时，query执行该分支。
      if (isWithheld413) {
        // First: drain all staged context-collapses. Gated on the PREVIOUS
        // transition not being collapse_drain_retry — if we already drained
        // and the retry still 413'd, fall through to reactive compact.
        // query在这里进入条件判断，后续代码按实际状态分流。
        if (
          feature('CONTEXT_COLLAPSE') &&
          contextCollapse &&
          state.transition?.reason !== 'collapse_drain_retry'
        ) {
          // drained保存`contextCollapse.recoverFromOverflow`，供query后续处理使用。
          const drained = contextCollapse.recoverFromOverflow(
            messagesForQuery,
            querySource,
          )
          // 满足 `drained.committed > 0` 时，query执行该分支。
          if (drained.committed > 0) {
            // next 集中保存query要一起传递的字段。
            const next: State = {
              messages: drained.messages,
              toolUseContext,
              autoCompactTracking: tracking,
              maxOutputTokensRecoveryCount,
              hasAttemptedReactiveCompact,
              maxOutputTokensOverride: undefined,
              pendingToolUseSummary: undefined,
              stopHookActive: undefined,
              turnCount,
              transition: {
                reason: 'collapse_drain_retry',
                committed: drained.committed,
              },
            }
            // 状态更新为 `next`，确保query后续读取最新状态。
            state = next
            // 跳过当前项，继续处理query中的下一轮循环。
            continue
          }
        }
      }
      // 组合条件 `(isWithheld413 || isWithheldMedia) && reactiveCompact` 成立时，query才启用这条专门路径。
      if ((isWithheld413 || isWithheldMedia) && reactiveCompact) {
        // compacted保存`reactiveCompact.tryReactiveCompact`，供query后续处理使用。
        const compacted = await reactiveCompact.tryReactiveCompact({
          hasAttempted: hasAttemptedReactiveCompact,
          querySource,
          aborted: toolUseContext.abortController.signal.aborted,
          messages: messagesForQuery,
          cacheSafeParams: {
            systemPrompt,
            userContext,
            systemContext,
            toolUseContext,
            forkContextMessages: messagesForQuery,
          },
        })

        // 满足 `compacted` 时，query执行该分支。
        if (compacted) {
          // task_budget: same carryover as the proactive path above.
          // messagesForQuery still holds the pre-compact array here (the
          // 413-failed attempt's input).
          // 满足 `params.taskBudget` 时，query执行该分支。
          if (params.taskBudget) {
            // preCompactContext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const preCompactContext =
              finalContextTokensFromLastResponse(messagesForQuery)
            // taskBudgetRemaining更新为 `Math.max(`，确保query后续读取最新状态。
            taskBudgetRemaining = Math.max(
              0,
              (taskBudgetRemaining ?? params.taskBudget.total) -
                preCompactContext,
            )
          }

          // postCompactMessages 消息数据构建`buildPostCompactMessages`，供query后续处理使用。
          const postCompactMessages = buildPostCompactMessages(compacted)
          // 按顺序遍历 `postCompactMessages` 中的消息，逐个交给query处理。
          for (const msg of postCompactMessages) {
            // 生成器产出 `msg`，把阶段性结果交给上层消费。
            yield msg
          }
          // next 集中保存query要一起传递的字段。
          const next: State = {
            messages: postCompactMessages,
            toolUseContext,
            autoCompactTracking: undefined,
            maxOutputTokensRecoveryCount,
            hasAttemptedReactiveCompact: true,
            maxOutputTokensOverride: undefined,
            pendingToolUseSummary: undefined,
            stopHookActive: undefined,
            turnCount,
            transition: { reason: 'reactive_compact_retry' },
          }
          // 状态更新为 `next`，确保query后续读取最新状态。
          state = next
          // 跳过当前项，继续处理query中的下一轮循环。
          continue
        }

        // No recovery — surface the withheld error and exit. Do NOT fall
        // through to stop hooks: the model never produced a valid response,
        // so hooks have nothing meaningful to evaluate. Running stop hooks
        // on prompt-too-long creates a death spiral: error → hook blocking
        // → retry → error → … (the hook injects more tokens each cycle).
        // 生成器产出 `lastMessage`，把阶段性结果交给上层消费。
        yield lastMessage
        // 显式忽略 `executeStopFailureHooks(lastMessage, toolUseContext)` 的返回值，只保留它触发的副作用。
        void executeStopFailureHooks(lastMessage, toolUseContext)
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: isWithheldMedia ? 'image_error' : 'prompt_too_long' }
      // query在这里处理 `} else if (feature('CONTEXT_COLLAPSE') && isWithheld413) {`，完成这一小步状态转换。
      } else if (feature('CONTEXT_COLLAPSE') && isWithheld413) {
        // reactiveCompact compiled out but contextCollapse withheld and
        // couldn't recover (staged queue empty/stale). Surface. Same
        // early-return rationale — don't fall through to stop hooks.
        // 生成器产出 `lastMessage`，把阶段性结果交给上层消费。
        yield lastMessage
        // 显式忽略 `executeStopFailureHooks(lastMessage, toolUseContext)` 的返回值，只保留它触发的副作用。
        void executeStopFailureHooks(lastMessage, toolUseContext)
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: 'prompt_too_long' }
      }

      // Check for max_output_tokens and inject recovery message. The error
      // was withheld from the stream above; only surface it if recovery
      // exhausts.
      // 满足 `isWithheldMaxOutputTokens(lastMessage)` 时，query执行该分支。
      if (isWithheldMaxOutputTokens(lastMessage)) {
        // Escalating retry: if we used the capped 8k default and hit the
        // limit, retry the SAME request at 64k — no meta message, no
        // multi-turn dance. This fires once per turn (guarded by the
        // override check), then falls through to multi-turn recovery if
        // 64k also hits the cap.
        // 3P default: false (not validated on Bedrock/Vertex)
        // capEnabled读取`getFeatureValue_CACHED_MAY_BE_STALE`，供query后续处理使用。
        const capEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_otk_slot_v1',
          false,
        )
        // query在这里进入条件判断，后续代码按实际状态分流。
        if (
          capEnabled &&
          maxOutputTokensOverride === undefined &&
          !process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS
        ) {
          // 记录query运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_max_tokens_escalate', {
            escalatedTo: ESCALATED_MAX_TOKENS,
          })
          // next 集中保存query要一起传递的字段。
          const next: State = {
            messages: messagesForQuery,
            toolUseContext,
            autoCompactTracking: tracking,
            maxOutputTokensRecoveryCount,
            hasAttemptedReactiveCompact,
            maxOutputTokensOverride: ESCALATED_MAX_TOKENS,
            pendingToolUseSummary: undefined,
            stopHookActive: undefined,
            turnCount,
            transition: { reason: 'max_output_tokens_escalate' },
          }
          // 状态更新为 `next`，确保query后续读取最新状态。
          state = next
          // 跳过当前项，继续处理query中的下一轮循环。
          continue
        }

        // 满足 `maxOutputTokensRecoveryCount < MAX_OUTPUT_TOKENS_` 时，query执行该分支。
        if (maxOutputTokensRecoveryCount < MAX_OUTPUT_TOKENS_RECOVERY_LIMIT) {
          // recoveryMessage 消息数据构建`createUserMessage`，供query后续处理使用。
          const recoveryMessage = createUserMessage({
            content:
              `Output token limit hit. Resume directly — no apology, no recap of what you were doing. ` +
              `Pick up mid-thought if that is where the cut happened. Break remaining work into smaller pieces.`,
            isMeta: true,
          })

          // next 集中保存query要一起传递的字段。
          const next: State = {
            messages: [
              ...messagesForQuery,
              ...assistantMessages,
              recoveryMessage,
            ],
            toolUseContext,
            autoCompactTracking: tracking,
            maxOutputTokensRecoveryCount: maxOutputTokensRecoveryCount + 1,
            hasAttemptedReactiveCompact,
            maxOutputTokensOverride: undefined,
            pendingToolUseSummary: undefined,
            stopHookActive: undefined,
            turnCount,
            transition: {
              reason: 'max_output_tokens_recovery',
              attempt: maxOutputTokensRecoveryCount + 1,
            },
          }
          // 状态更新为 `next`，确保query后续读取最新状态。
          state = next
          // 跳过当前项，继续处理query中的下一轮循环。
          continue
        }

        // Recovery exhausted — surface the withheld error now.
        // 生成器产出 `lastMessage`，把阶段性结果交给上层消费。
        yield lastMessage
      }

      // Skip stop hooks when the last message is an API error (rate limit,
      // prompt-too-long, auth failure, etc.). The model never produced a
      // real response — hooks evaluating it create a death spiral:
      // error → hook blocking → retry → error → …
      // 满足 `lastMessage?.isApiErrorMessage` 时，query执行该分支。
      if (lastMessage?.isApiErrorMessage) {
        // 显式忽略 `executeStopFailureHooks(lastMessage, toolUseContext)` 的返回值，只保留它触发的副作用。
        void executeStopFailureHooks(lastMessage, toolUseContext)
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: 'completed' }
      }

      // stopHookResult保存`handleStopHooks`，供query后续处理使用。
      const stopHookResult = yield* handleStopHooks(
        messagesForQuery,
        assistantMessages,
        systemPrompt,
        userContext,
        systemContext,
        toolUseContext,
        querySource,
        stopHookActive,
      )

      // 满足 `stopHookResult.preventContinuation` 时，query执行该分支。
      if (stopHookResult.preventContinuation) {
        // 返回结构化结果，集中表达query已经整理出的状态。
        return { reason: 'stop_hook_prevented' }
      }

      // 满足 `stopHookResult.blockingErrors.length > 0` 时，query执行该分支。
      if (stopHookResult.blockingErrors.length > 0) {
        // next 集中保存query要一起传递的字段。
        const next: State = {
          messages: [
            ...messagesForQuery,
            ...assistantMessages,
            ...stopHookResult.blockingErrors,
          ],
          toolUseContext,
          autoCompactTracking: tracking,
          maxOutputTokensRecoveryCount: 0,
          // Preserve the reactive compact guard — if compact already ran and
          // couldn't recover from prompt-too-long, retrying after a stop-hook
          // blocking error will produce the same result. Resetting to false
          // here caused an infinite loop: compact → still too long → error →
          // stop hook blocking → compact → … burning thousands of API calls.
          hasAttemptedReactiveCompact,
          maxOutputTokensOverride: undefined,
          pendingToolUseSummary: undefined,
          stopHookActive: true,
          turnCount,
          transition: { reason: 'stop_hook_blocking' },
        }
        // 状态更新为 `next`，确保query后续读取最新状态。
        state = next
        // 跳过当前项，继续处理query中的下一轮循环。
        continue
      }

      // 满足 `feature('TOKEN_BUDGET')` 时，query执行该分支。
      if (feature('TOKEN_BUDGET')) {
        // decision读取`checkTokenBudget`，供query后续处理使用。
        const decision = checkTokenBudget(
          budgetTracker!,
          toolUseContext.agentId,
          getCurrentTurnTokenBudget(),
          getTurnOutputTokens(),
        )

        // 当 `decision.action` 匹配 `'continue'` 时，query执行对应分支。
        if (decision.action === 'continue') {
          // 调用 incrementBudgetContinuationCount，触发query此处需要的副作用。
          incrementBudgetContinuationCount()
          // 记录query运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Token budget continuation #${decision.continuationCount}: ${decision.pct}% (${decision.turnTokens.toLocaleString()} / ${decision.budget.toLocaleString()})`,
          )
          // 状态更新为 `{`，确保query后续读取最新状态。
          state = {
            messages: [
              ...messagesForQuery,
              ...assistantMessages,
              createUserMessage({
                content: decision.nudgeMessage,
                isMeta: true,
              }),
            ],
            toolUseContext,
            autoCompactTracking: tracking,
            maxOutputTokensRecoveryCount: 0,
            hasAttemptedReactiveCompact: false,
            maxOutputTokensOverride: undefined,
            pendingToolUseSummary: undefined,
            stopHookActive: undefined,
            turnCount,
            transition: { reason: 'token_budget_continuation' },
          }
          // 跳过当前项，继续处理query中的下一轮循环。
          continue
        }

        // 满足 `decision.completionEvent` 时，query执行该分支。
        if (decision.completionEvent) {
          // 满足 `decision.completionEvent.diminishingReturns` 时，query执行该分支。
          if (decision.completionEvent.diminishingReturns) {
            // 记录query运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Token budget early stop: diminishing returns at ${decision.completionEvent.pct}%`,
            )
          }
          // 记录query运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_token_budget_completed', {
            ...decision.completionEvent,
            queryChainId: queryChainIdForAnalytics,
            queryDepth: queryTracking.depth,
          })
        }
      }

      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'completed' }
    }

    // shouldPreventContinuation标记query是否启用对应路径。
    let shouldPreventContinuation = false
    // updatedToolUseContext保存`toolUseContext`，供后续判断或组装使用。
    let updatedToolUseContext = toolUseContext

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_tool_execution_start')


    // 满足 `streamingToolExecutor` 时，query执行该分支。
    if (streamingToolExecutor) {
      // 记录query运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_streaming_tool_execution_used', {
        tool_count: toolUseBlocks.length,
        queryChainId: queryChainIdForAnalytics,
        queryDepth: queryTracking.depth,
      })
    } else {
      // 记录query运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_streaming_tool_execution_not_used', {
        tool_count: toolUseBlocks.length,
        queryChainId: queryChainIdForAnalytics,
        queryDepth: queryTracking.depth,
      })
    }

    // toolUpdates 集合保存`streamingToolExecutor`，供后续判断或组装使用。
    const toolUpdates = streamingToolExecutor
      ? streamingToolExecutor.getRemainingResults()
      : runTools(toolUseBlocks, assistantMessages, canUseTool, toolUseContext)

    // 逐项读取 `toolUpdates` 中的update，按输入顺序推进query。
    for await (const update of toolUpdates) {
      // 满足 `update.message` 时，query执行该分支。
      if (update.message) {
        // 生成器产出 `update.message`，把阶段性结果交给上层消费。
        yield update.message

        // query在这里进入条件判断，后续代码按实际状态分流。
        if (
          update.message.type === 'attachment' &&
          update.message.attachment.type === 'hook_stopped_continuation'
        ) {
          // shouldPreventContinuation更新为 `true`，确保query后续读取最新状态。
          shouldPreventContinuation = true
        }

        // toolResults 集合追加新条目，保持收集顺序与输入顺序一致。
        toolResults.push(
          ...normalizeMessagesForAPI(
            [update.message],
            toolUseContext.options.tools,
          // 这个回调绑定到 ).filter(_ => _.type === 'user'),，负责query在该局部场景下的响应。
          ).filter(_ => _.type === 'user'),
        )
      }
      // 满足 `update.newContext` 时，query执行该分支。
      if (update.newContext) {
        // updatedToolUseContext更新为 `{`，确保query后续读取最新状态。
        updatedToolUseContext = {
          ...update.newContext,
          queryTracking,
        }
      }
    }
    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_tool_execution_end')

    // Generate tool use summary after tool batch completes — passed to next recursive call
    // query先整理这一处局部数据，后续分支可以直接读取。
    let nextPendingToolUseSummary:
      | Promise<ToolUseSummaryMessage | null>
      | undefined
    // query在这里进入条件判断，后续代码按实际状态分流。
    if (
      config.gates.emitToolUseSummaries &&
      toolUseBlocks.length > 0 &&
      !toolUseContext.abortController.signal.aborted &&
      !toolUseContext.agentId // subagents don't surface in mobile UI — skip the Haiku call
    ) {
      // Extract the last assistant text block for context
      // lastAssistantMessage 消息数据保存`assistantMessages.at`，供query后续处理使用。
      const lastAssistantMessage = assistantMessages.at(-1)
      // lastAssistantText 先占位，稍后的条件分支会根据实际输入补齐它。
      let lastAssistantText: string | undefined
      // 满足 `lastAssistantMessage` 时，query执行该分支。
      if (lastAssistantMessage) {
        // textBlocks 集合筛选`content.filter`，供query后续处理使用。
        const textBlocks = lastAssistantMessage.message.content.filter(
          // block更新为 `> block.type === 'text'`，确保query后续读取最新状态。
          block => block.type === 'text',
        )
        // 满足 `textBlocks.length > 0` 时，query执行该分支。
        if (textBlocks.length > 0) {
          // lastTextBlock保存`textBlocks.at`，供query后续处理使用。
          const lastTextBlock = textBlocks.at(-1)
          // 组合条件 `lastTextBlock && 'text' in lastTextBlock` 成立时，query才启用这条专门路径。
          if (lastTextBlock && 'text' in lastTextBlock) {
            // lastAssistantText更新为 `lastTextBlock.text`，确保query后续读取最新状态。
            lastAssistantText = lastTextBlock.text
          }
        }
      }

      // Collect tool info for summary generation
      // toolUseIds 集合派生`toolUseBlocks.map`，供query后续处理使用。
      const toolUseIds = toolUseBlocks.map(block => block.id)
      // toolInfoForSummary派生`toolUseBlocks.map`，供query后续处理使用。
      const toolInfoForSummary = toolUseBlocks.map(block => {
        // Find the corresponding tool result
        // toolResult筛选`toolResults.find`，供query后续处理使用。
        const toolResult = toolResults.find(
          // 结果更新为 `>`，确保query后续读取最新状态。
          result =>
            result.type === 'user' &&
            Array.isArray(result.message.content) &&
            result.message.content.some(
              // 文本内容更新为 `>`，确保query后续读取最新状态。
              content =>
                content.type === 'tool_result' &&
                content.tool_use_id === block.id,
            ),
        )
        // resultContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const resultContent =
          toolResult?.type === 'user' &&
          Array.isArray(toolResult.message.content)
            ? toolResult.message.content.find(
                // 这个回调绑定到 (c): c is ToolResultBlockParam =>，负责query在该局部场景下的响应。
                (c): c is ToolResultBlockParam =>
                  c.type === 'tool_result' && c.tool_use_id === block.id,
              )
            : undefined
        // 返回结构化结果，集中表达query已经整理出的状态。
        return {
          name: block.name,
          input: block.input,
          output:
            resultContent && 'content' in resultContent
              ? resultContent.content
              : null,
        }
      })

      // Fire off summary generation without blocking the next API call
      // nextPendingToolUseSummary更新为 `generateToolUseSummary({`，确保query后续读取最新状态。
      nextPendingToolUseSummary = generateToolUseSummary({
        tools: toolInfoForSummary,
        signal: toolUseContext.abortController.signal,
        isNonInteractiveSession: toolUseContext.options.isNonInteractiveSession,
        lastAssistantText,
      })
        // 链式调用 then，继续加工上一行在query中产生的数据。
        .then(summary => {
          // 满足 `summary` 时，query执行该分支。
          if (summary) {
            // 返回 `createToolUseSummaryMessage(summary, toolUseIds)`，作为query这次计算的结果。
            return createToolUseSummaryMessage(summary, toolUseIds)
          }
          // 返回 `null`，作为query这次计算的结果。
          return null
        })
        // 链式调用 catch，继续加工上一行在query中产生的数据。
        .catch(() => null)
    }

    // We were aborted during tool calls
    // 满足 `toolUseContext.abortController.signal.aborted` 时，query执行该分支。
    if (toolUseContext.abortController.signal.aborted) {
      // chicago MCP: auto-unhide + lock release when aborted mid-tool-call.
      // This is the most likely Ctrl+C path for CU (e.g. slow screenshot).
      // Main thread only — see stopHooks.ts for the subagent rationale.
      // 组合条件 `feature('CHICAGO_MCP') && !toolUseContext.agentId` 成立时，query才启用这条专门路径。
      if (feature('CHICAGO_MCP') && !toolUseContext.agentId) {
        // 保护这一段可能失败的query操作，确保异常能进入相邻错误处理。
        try {
          // 从 `await import(` 解构 cleanupComputerUseAfterTurn，减少query对同一对象的重复访问。
          const { cleanupComputerUseAfterTurn } = await import(
            './utils/computerUse/cleanup.js'
          )
          // 等待 `cleanupComputerUseAfterTurn(toolUseContext)` 完成，再继续query的异步流程。
          await cleanupComputerUseAfterTurn(toolUseContext)
        } catch {
          // Failures are silent — this is dogfooding cleanup, not critical path
        }
      }
      // Skip the interruption message for submit-interrupts — the queued
      // user message that follows provides sufficient context.
      // 满足 `toolUseContext.abortController.signal.reason !==` 时，query执行该分支。
      if (toolUseContext.abortController.signal.reason !== 'interrupt') {
        // 生成器产出 `createUserInterruptionMessage({`，把阶段性结果交给上层消费。
        yield createUserInterruptionMessage({
          toolUse: true,
        })
      }
      // Check maxTurns before returning when aborted
      // nextTurnCountOnAbort 数量保存`turnCount + 1`，供后续判断或组装使用。
      const nextTurnCountOnAbort = turnCount + 1
      // 组合条件 `maxTurns && nextTurnCountOnAbort > maxTurns` 成立时，query才启用这条专门路径。
      if (maxTurns && nextTurnCountOnAbort > maxTurns) {
        // 生成器产出 `createAttachmentMessage({`，把阶段性结果交给上层消费。
        yield createAttachmentMessage({
          type: 'max_turns_reached',
          maxTurns,
          turnCount: nextTurnCountOnAbort,
        })
      }
      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'aborted_tools' }
    }

    // If a hook indicated to prevent continuation, stop here
    // 满足 `shouldPreventContinuation` 时，query执行该分支。
    if (shouldPreventContinuation) {
      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'hook_stopped' }
    }

    // 满足 `tracking?.compacted` 时，query执行该分支。
    if (tracking?.compacted) {
      // query在这里处理 `tracking.turnCounter++`，完成这一小步状态转换。
      tracking.turnCounter++
      // 记录query运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_post_autocompact_turn', {
        turnId:
          tracking.turnId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        turnCounter: tracking.turnCounter,

        queryChainId: queryChainIdForAnalytics,
        queryDepth: queryTracking.depth,
      })
    }

    // Be careful to do this after tool calls are done, because the API
    // will error if we interleave tool_result messages with regular user messages.

    // Instrumentation: Track message count before attachments
    // 记录query运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_query_before_attachments', {
      messagesForQueryCount: messagesForQuery.length,
      assistantMessagesCount: assistantMessages.length,
      toolResultsCount: toolResults.length,
      queryChainId: queryChainIdForAnalytics,
      queryDepth: queryTracking.depth,
    })

    // Get queued commands snapshot before processing attachments.
    // These will be sent as attachments so Claude can respond to them in the current turn.
    //
    // Drain pending notifications. LocalShellTask completions are 'next'
    // (when MONITOR_TOOL is on) and drain without Sleep. Other task types
    // (agent/workflow/framework) still default to 'later' — the Sleep flush
    // covers those. If all task types move to 'next', this branch could go.
    //
    // Slash commands are excluded from mid-turn drain — they must go through
    // processSlashCommand after the turn ends (via useQueueProcessor), not be
    // sent to the model as text. Bash-mode commands are already excluded by
    // INLINE_NOTIFICATION_MODES in getQueuedCommandAttachments.
    //
    // Agent scoping: the queue is a process-global singleton shared by the
    // coordinator and all in-process subagents. Each loop drains only what's
    // addressed to it — main thread drains agentId===undefined, subagents
    // drain their own agentId. User prompts (mode:'prompt') still go to main
    // only; subagents never see the prompt stream.
    // eslint-disable-next-line custom-rules/require-tool-match-name -- ToolUseBlock.name has no aliases
    // sleepRan筛选`toolUseBlocks.some`，供query后续处理使用。
    const sleepRan = toolUseBlocks.some(b => b.name === SLEEP_TOOL_NAME)
    // isMainThread 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isMainThread =
      querySource.startsWith('repl_main_thread') || querySource === 'sdk'
    // currentAgentId保存`toolUseContext.agentId`，供query后续判断或输出使用。
    const currentAgentId = toolUseContext.agentId
    // queuedCommandsSnapshot 命令数据读取`getCommandsByMaxPriority`，供query后续处理使用。
    const queuedCommandsSnapshot = getCommandsByMaxPriority(
      sleepRan ? 'later' : 'next',
    // 这个回调绑定到 ).filter(cmd => {，负责query在该局部场景下的响应。
    ).filter(cmd => {
      // 满足 `isSlashCommand(cmd)` 时，query执行该分支。
      if (isSlashCommand(cmd)) return false
      // 满足 `isMainThread` 时，query执行该分支。
      if (isMainThread) return cmd.agentId === undefined
      // Subagents only drain task-notifications addressed to them — never
      // user prompts, even if someone stamps an agentId on one.
      // 返回 `cmd.mode === 'task-notification' && cmd.agentId === currentAgentId`，作为query这次计算的结果。
      return cmd.mode === 'task-notification' && cmd.agentId === currentAgentId
    })

    // 逐项读取 `getAttachmentMessages(` 中的attachment，按输入顺序推进query。
    for await (const attachment of getAttachmentMessages(
      null,
      updatedToolUseContext,
      null,
      queuedCommandsSnapshot,
      [...messagesForQuery, ...assistantMessages, ...toolResults],
      querySource,
    )) {
      // 生成器产出 `attachment`，把阶段性结果交给上层消费。
      yield attachment
      // toolResults 集合追加新条目，保持收集顺序与输入顺序一致。
      toolResults.push(attachment)
    }

    // Memory prefetch consume: only if settled and not already consumed on
    // an earlier iteration. If not settled yet, skip (zero-wait) and retry
    // next iteration — the prefetch gets as many chances as there are loop
    // iterations before the turn ends. readFileState (cumulative across
    // iterations) filters out memories the model already Read/Wrote/Edited
    // — including in earlier iterations, which the per-iteration
    // toolUseBlocks array would miss.
    // query在这里进入条件判断，后续代码按实际状态分流。
    if (
      pendingMemoryPrefetch &&
      pendingMemoryPrefetch.settledAt !== null &&
      pendingMemoryPrefetch.consumedOnIteration === -1
    ) {
      // memoryAttachments 集合筛选`filterDuplicateMemoryAttachments`，供query后续处理使用。
      const memoryAttachments = filterDuplicateMemoryAttachments(
        await pendingMemoryPrefetch.promise,
        toolUseContext.readFileState,
      )
      // 按顺序遍历 `memoryAttachments` 中的memAttachment，逐个交给query处理。
      for (const memAttachment of memoryAttachments) {
        // 消息构建`createAttachmentMessage`，供query后续处理使用。
        const msg = createAttachmentMessage(memAttachment)
        // 生成器产出 `msg`，把阶段性结果交给上层消费。
        yield msg
        // toolResults 集合追加新条目，保持收集顺序与输入顺序一致。
        toolResults.push(msg)
      }
      // consumedOnIteration更新为 `turnCount - 1`，确保query后续读取最新状态。
      pendingMemoryPrefetch.consumedOnIteration = turnCount - 1
    }


    // Inject prefetched skill discovery. collectSkillDiscoveryPrefetch emits
    // hidden_by_main_turn — true when the prefetch resolved before this point
    // (should be >98% at AKI@250ms / Haiku@573ms vs turn durations of 2-30s).
    // 组合条件 `skillPrefetch && pendingSkillPrefetch` 成立时，query才启用这条专门路径。
    if (skillPrefetch && pendingSkillPrefetch) {
      // skillAttachments 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const skillAttachments =
        await skillPrefetch.collectSkillDiscoveryPrefetch(pendingSkillPrefetch)
      // 按顺序遍历 `skillAttachments` 中的att，逐个交给query处理。
      for (const att of skillAttachments) {
        // 消息构建`createAttachmentMessage`，供query后续处理使用。
        const msg = createAttachmentMessage(att)
        // 生成器产出 `msg`，把阶段性结果交给上层消费。
        yield msg
        // toolResults 集合追加新条目，保持收集顺序与输入顺序一致。
        toolResults.push(msg)
      }
    }

    // Remove only commands that were actually consumed as attachments.
    // Prompt and task-notification commands are converted to attachments above.
    // consumedCommands 命令数据筛选`queuedCommandsSnapshot.filter`，供query后续处理使用。
    const consumedCommands = queuedCommandsSnapshot.filter(
      // cmd 命令数据更新为 `> cmd.mode === 'prompt' || cmd.mode === 'task-notificatio...`，确保query后续读取最新状态。
      cmd => cmd.mode === 'prompt' || cmd.mode === 'task-notification',
    )
    // 满足 `consumedCommands.length > 0` 时，query执行该分支。
    if (consumedCommands.length > 0) {
      // 按顺序遍历 `consumedCommands` 中的cmd 命令数据，逐个交给query处理。
      for (const cmd of consumedCommands) {
        // 满足 `cmd.uuid` 时，query执行该分支。
        if (cmd.uuid) {
          // consumedCommandUuids 命令数据追加新条目，保持收集顺序与输入顺序一致。
          consumedCommandUuids.push(cmd.uuid)
          // 调用 notifyCommandLifecycle，触发query此处需要的副作用。
          notifyCommandLifecycle(cmd.uuid, 'started')
        }
      }
      // 调用 removeFromQueue，触发query此处需要的副作用。
      removeFromQueue(consumedCommands)
    }

    // Instrumentation: Track file change attachments after they're added
    // fileChangeAttachmentCount 文件数据统计`count`，供query后续处理使用。
    const fileChangeAttachmentCount = count(
      toolResults,
      // tr更新为 `>`，确保query后续读取最新状态。
      tr =>
        tr.type === 'attachment' && tr.attachment.type === 'edited_text_file',
    )

    // 记录query运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_query_after_attachments', {
      totalToolResultsCount: toolResults.length,
      fileChangeAttachmentCount,
      queryChainId: queryChainIdForAnalytics,
      queryDepth: queryTracking.depth,
    })

    // Refresh tools between turns so newly-connected MCP servers become available
    // 满足 `updatedToolUseContext.options.refreshTools` 时，query执行该分支。
    if (updatedToolUseContext.options.refreshTools) {
      // refreshedTools 集合保存`options.refreshTools`，供query后续处理使用。
      const refreshedTools = updatedToolUseContext.options.refreshTools()
      // `refreshedTools` 与 `updatedToolUseContext.options.` 不一致时刷新派生状态，避免使用过期结果。
      if (refreshedTools !== updatedToolUseContext.options.tools) {
        // updatedToolUseContext更新为 `{`，确保query后续读取最新状态。
        updatedToolUseContext = {
          ...updatedToolUseContext,
          options: {
            ...updatedToolUseContext.options,
            tools: refreshedTools,
          },
        }
      }
    }

    // toolUseContextWithQueryTracking 集中保存query要一起传递的字段。
    const toolUseContextWithQueryTracking = {
      ...updatedToolUseContext,
      queryTracking,
    }

    // Each time we have tool results and are about to recurse, that's a turn
    // nextTurnCount 数量保存`turnCount + 1`，供后续判断或组装使用。
    const nextTurnCount = turnCount + 1

    // Periodic task summary for `claude ps` — fires mid-turn so a
    // long-running agent still refreshes what it's working on. Gated
    // only on !agentId so every top-level conversation (REPL, SDK, HFI,
    // remote) generates summaries; subagents/forks don't.
    // 满足 `feature('BG_SESSIONS')` 时，query执行该分支。
    if (feature('BG_SESSIONS')) {
      // query在这里进入条件判断，后续代码按实际状态分流。
      if (
        !toolUseContext.agentId &&
        taskSummaryModule!.shouldGenerateTaskSummary()
      ) {
        // query在这里处理 `taskSummaryModule!.maybeGenerateTaskSummary({`，完成这一小步状态转换。
        taskSummaryModule!.maybeGenerateTaskSummary({
          systemPrompt,
          userContext,
          systemContext,
          toolUseContext,
          forkContextMessages: [
            ...messagesForQuery,
            ...assistantMessages,
            ...toolResults,
          ],
        })
      }
    }

    // Check if we've reached the max turns limit
    // 组合条件 `maxTurns && nextTurnCount > maxTurns` 成立时，query才启用这条专门路径。
    if (maxTurns && nextTurnCount > maxTurns) {
      // 生成器产出 `createAttachmentMessage({`，把阶段性结果交给上层消费。
      yield createAttachmentMessage({
        type: 'max_turns_reached',
        maxTurns,
        turnCount: nextTurnCount,
      })
      // 返回结构化结果，集中表达query已经整理出的状态。
      return { reason: 'max_turns', turnCount: nextTurnCount }
    }

    // 调用 queryCheckpoint，触发query此处需要的副作用。
    queryCheckpoint('query_recursive_call')
    // next 集中保存query要一起传递的字段。
    const next: State = {
      messages: [...messagesForQuery, ...assistantMessages, ...toolResults],
      toolUseContext: toolUseContextWithQueryTracking,
      autoCompactTracking: tracking,
      turnCount: nextTurnCount,
      maxOutputTokensRecoveryCount: 0,
      hasAttemptedReactiveCompact: false,
      pendingToolUseSummary: nextPendingToolUseSummary,
      maxOutputTokensOverride: undefined,
      stopHookActive,
      transition: { reason: 'next_turn' },
    }
    // 状态更新为 `next`，确保query后续读取最新状态。
    state = next
  } // while (true)
}
