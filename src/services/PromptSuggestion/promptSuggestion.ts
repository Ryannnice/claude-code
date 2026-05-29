// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准服务层 prompt Suggestion的数据契约。
import type { AppState } from '../../state/AppState.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 prompt Suggestion的数据契约。
import type { Message } from '../../types/message.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 isEnvDefinedFalsy、isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy, isEnvTruthy } from '../../utils/envUtils.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 整理这一组导入，让服务层 prompt Suggestion后续逻辑可以直接复用这些外部能力。
import {
  type CacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 类型依赖 { REPLHookContext } 来自 ../../utils/hooks/postSamplingHooks.js，用于校准服务层 prompt Suggestion的数据契约。
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让服务层 prompt Suggestion后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  getLastAssistantMessage,
} from '../../utils/messages.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js'
// 复用 isTeammate 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { isTeammate } from '../../utils/teammate.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 整理这一组导入，让服务层 prompt Suggestion后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 引入 currentLimits，将 ../claudeAiLimits.js 中已经封装好的能力接到本文件流程里。
import { currentLimits } from '../claudeAiLimits.js'
// 引入 isSpeculationEnabled、startSpeculation，将 ./speculation.js 中已经封装好的能力接到本文件流程里。
import { isSpeculationEnabled, startSpeculation } from './speculation.js'

// currentAbortController保存`null`，作为后续空值处理的输入。
let currentAbortController: AbortController | null = null

// PromptVariant 固化服务层 prompt Suggestion里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptVariant = 'user_intent' | 'stated_intent'

// getPromptVariant 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptVariant(): PromptVariant {
  // 返回 `'user_intent'`，作为服务层 prompt Suggestion这次计算的结果。
  return 'user_intent'
}

// shouldEnablePromptSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldEnablePromptSuggestion(): boolean {
  // Env var overrides everything (for testing)
  // envOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envOverride = process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION
  // 满足 `isEnvDefinedFalsy(envOverride)` 时，服务层 prompt Suggestion执行该分支。
  if (isEnvDefinedFalsy(envOverride)) {
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_suggestion_init', {
      enabled: false,
      source:
        'env' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `isEnvTruthy(envOverride)` 时，服务层 prompt Suggestion执行该分支。
  if (isEnvTruthy(envOverride)) {
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_suggestion_init', {
      enabled: true,
      source:
        'env' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Keep default in sync with Config.tsx (settings toggle visibility)
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_chomp_inflection', false)` 时，服务层 prompt Suggestion执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_chomp_inflection', false)) {
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_suggestion_init', {
      enabled: false,
      source:
        'growthbook' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Disable in non-interactive mode (print mode, piped input, SDK)
  // 满足 `getIsNonInteractiveSession()` 时，服务层 prompt Suggestion执行该分支。
  if (getIsNonInteractiveSession()) {
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_suggestion_init', {
      enabled: false,
      source:
        'non_interactive' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Disable for swarm teammates (only leader should show suggestions)
  // 组合条件 `isAgentSwarmsEnabled() && isTeammate()` 成立时，服务层 prompt Suggestion才启用这条专门路径。
  if (isAgentSwarmsEnabled() && isTeammate()) {
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_suggestion_init', {
      enabled: false,
      source:
        'swarm_teammate' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // enabled读取`getInitialSettings`，供服务层 prompt Suggestion后续处理使用。
  const enabled = getInitialSettings()?.promptSuggestionEnabled !== false
  // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_prompt_suggestion_init', {
    enabled,
    source:
      'setting' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
  // 返回 `enabled`，作为服务层 prompt Suggestion这次计算的结果。
  return enabled
}

// abortPromptSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function abortPromptSuggestion(): void {
  // 满足 `currentAbortController` 时，服务层 prompt Suggestion执行该分支。
  if (currentAbortController) {
    // 触发取消信号，通知服务层 prompt Suggestion中仍在等待的异步任务尽快停止。
    currentAbortController.abort()
    // currentAbortController更新为 `null`，确保服务层后续读取最新状态。
    currentAbortController = null
  }
}

/**
 * Returns a suppression reason if suggestions should not be generated,
 * or null if generation is allowed. Shared by main and pipelined paths.
 */
// getSuggestionSuppressReason 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSuggestionSuppressReason(appState: AppState): string | null {
  // appState.promptSuggestionEnabled 状态缺失时提前走兜底路径，避免服务层 prompt Suggestion继续依赖无效输入。
  if (!appState.promptSuggestionEnabled) return 'disabled'
  // 组合条件 `appState.pendingWorkerRequest || appState.pendingSandboxRequest` 成立时，服务层 prompt Suggestion才启用这条专门路径。
  if (appState.pendingWorkerRequest || appState.pendingSandboxRequest)
    // 返回 `'pending_permission'`，作为服务层 prompt Suggestion这次计算的结果。
    return 'pending_permission'
  // 满足 `appState.elicitation.queue.length > 0` 时，服务层 prompt Suggestion执行该分支。
  if (appState.elicitation.queue.length > 0) return 'elicitation_active'
  // 当 `appState.toolPermissionContext.mode` 匹配 `'plan'` 时，服务层 prompt Suggestion执行对应分支。
  if (appState.toolPermissionContext.mode === 'plan') return 'plan_mode'
  // 服务层 prompt Suggestion在这里进入条件判断，后续代码按实际状态分流。
  if (
    process.env.USER_TYPE === 'external' &&
    currentLimits.status !== 'allowed'
  )
    // 返回 `'rate_limit'`，作为服务层 prompt Suggestion这次计算的结果。
    return 'rate_limit'
  // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
  return null
}

/**
 * Shared guard + generation logic used by both CLI TUI and SDK push paths.
 * Returns the suggestion with metadata, or null if suppressed/filtered.
 */
// tryGenerateSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryGenerateSuggestion(
  abortController: AbortController,
  messages: Message[],
  // 这个回调绑定到 getAppState: () => AppState,，负责服务层 prompt Suggestion在该局部场景下的响应。
  getAppState: () => AppState,
  cacheSafeParams: CacheSafeParams,
  source?: 'cli' | 'sdk',
): Promise<{
  suggestion: string
  promptId: PromptVariant
  generationRequestId: string | null
} | null> {
  // 满足 `abortController.signal.aborted` 时，服务层 prompt Suggestion执行该分支。
  if (abortController.signal.aborted) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('aborted', undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }

  // assistantTurnCount 数量统计`count`，供服务层 prompt Suggestion后续处理使用。
  const assistantTurnCount = count(messages, m => m.type === 'assistant')
  // 满足 `assistantTurnCount < 2` 时，服务层 prompt Suggestion执行该分支。
  if (assistantTurnCount < 2) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('early_conversation', undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }

  // lastAssistantMessage 消息数据读取`getLastAssistantMessage`，供服务层 prompt Suggestion后续处理使用。
  const lastAssistantMessage = getLastAssistantMessage(messages)
  // 满足 `lastAssistantMessage?.isApiErrorMessage` 时，服务层 prompt Suggestion执行该分支。
  if (lastAssistantMessage?.isApiErrorMessage) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('last_response_error', undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }
  // cacheReason 缓存读取`getParentCacheSuppressReason`，供服务层 prompt Suggestion后续处理使用。
  const cacheReason = getParentCacheSuppressReason(lastAssistantMessage)
  // 满足 `cacheReason` 时，服务层 prompt Suggestion执行该分支。
  if (cacheReason) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed(cacheReason, undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }

  // appState 状态读取`getAppState`，供服务层 prompt Suggestion后续处理使用。
  const appState = getAppState()
  // suppressReason读取`getSuggestionSuppressReason`，供服务层 prompt Suggestion后续处理使用。
  const suppressReason = getSuggestionSuppressReason(appState)
  // 满足 `suppressReason` 时，服务层 prompt Suggestion执行该分支。
  if (suppressReason) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed(suppressReason, undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }

  // promptId读取`getPromptVariant`，供服务层 prompt Suggestion后续处理使用。
  const promptId = getPromptVariant()
  // 从 `await generateSuggestion(` 解构 suggestion、generationRequestId，减少服务层 prompt Suggestion对同一对象的重复访问。
  const { suggestion, generationRequestId } = await generateSuggestion(
    abortController,
    promptId,
    cacheSafeParams,
  )
  // 满足 `abortController.signal.aborted` 时，服务层 prompt Suggestion执行该分支。
  if (abortController.signal.aborted) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('aborted', undefined, undefined, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }
  // suggestion缺失时提前走兜底路径，避免服务层 prompt Suggestion继续依赖无效输入。
  if (!suggestion) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('empty', undefined, promptId, source)
    // 返回 `null`，作为服务层 prompt Suggestion这次计算的结果。
    return null
  }
  // 满足 `shouldFilterSuggestion(suggestion, promptId, source)` 时，服务层 prompt Suggestion执行该分支。
  if (shouldFilterSuggestion(suggestion, promptId, source)) return null

  // 返回结构化结果，集中表达服务层 prompt Suggestion已经整理出的状态。
  return { suggestion, promptId, generationRequestId }
}

// executePromptSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function executePromptSuggestion(
  context: REPLHookContext,
): Promise<void> {
  // `context.querySource` 与 `'repl_main_thread'` 不一致时刷新派生状态，避免使用过期结果。
  if (context.querySource !== 'repl_main_thread') return

  // currentAbortController更新为 `new AbortController()`，确保服务层后续读取最新状态。
  currentAbortController = new AbortController()
  // abortController保存`currentAbortController`，供后续判断或组装使用。
  const abortController = currentAbortController
  // cacheSafeParams 缓存构建`createCacheSafeParams`，供服务层 prompt Suggestion后续处理使用。
  const cacheSafeParams = createCacheSafeParams(context)

  // 保护这一段可能失败的服务层 prompt Suggestion操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`tryGenerateSuggestion`，供服务层 prompt Suggestion后续处理使用。
    const result = await tryGenerateSuggestion(
      abortController,
      context.messages,
      context.toolUseContext.getAppState,
      cacheSafeParams,
      'cli',
    )
    // 结果缺失时提前走兜底路径，避免服务层 prompt Suggestion继续依赖无效输入。
    if (!result) return

    // context.toolUseContext.setAppState 写入新的状态值，使服务层 prompt Suggestion后续读取保持一致。
    context.toolUseContext.setAppState(prev => ({
      ...prev,
      promptSuggestion: {
        text: result.suggestion,
        promptId: result.promptId,
        shownAt: 0,
        acceptedAt: 0,
        generationRequestId: result.generationRequestId,
      },
    }))

    // 组合条件 `isSpeculationEnabled() && result.suggestion` 成立时，服务层 prompt Suggestion才启用这条专门路径。
    if (isSpeculationEnabled() && result.suggestion) {
      // 显式忽略 `startSpeculation(` 的返回值，只保留它触发的副作用。
      void startSpeculation(
        result.suggestion,
        context,
        context.toolUseContext.setAppState,
        false,
        cacheSafeParams,
      )
    }
  } catch (error) {
    // 服务层 prompt Suggestion在这里进入条件判断，后续代码按实际状态分流。
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'APIUserAbortError')
    ) {
      // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
      logSuggestionSuppressed('aborted', undefined, undefined, 'cli')
      // 服务层 prompt Suggestion在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
  } finally {
    // 满足 `currentAbortController === abortController` 时，服务层 prompt Suggestion执行该分支。
    if (currentAbortController === abortController) {
      // currentAbortController更新为 `null`，确保服务层后续读取最新状态。
      currentAbortController = null
    }
  }
}

// MAX_PARENT_UNCACHED_TOKENS 缓存保存`10_000`，供后续判断或组装使用。
const MAX_PARENT_UNCACHED_TOKENS = 10_000

// getParentCacheSuppressReason 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getParentCacheSuppressReason(
  lastAssistantMessage: ReturnType<typeof getLastAssistantMessage>,
): string | null {
  // lastAssistantMessage 消息数据缺失时提前走兜底路径，避免服务层 prompt Suggestion继续依赖无效输入。
  if (!lastAssistantMessage) return null

  // usage保存`lastAssistantMessage.message.usage`，供服务层 prompt Suggestion后续判断或输出使用。
  const usage = lastAssistantMessage.message.usage
  // inputTokens 集合保存`usage.input_tokens ?? 0`，供服务层 prompt Suggestion后续判断或输出使用。
  const inputTokens = usage.input_tokens ?? 0
  // cacheWriteTokens 缓存保存`usage.cache_creation_input_tokens ?? 0`，供服务层 prompt Suggestion后续判断或输出使用。
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0
  // The fork re-processes the parent's output (never cached) plus its own prompt.
  // outputTokens 集合保存`usage.output_tokens ?? 0`，供服务层 prompt Suggestion后续判断或输出使用。
  const outputTokens = usage.output_tokens ?? 0

  // 返回 `inputTokens + cacheWriteTokens + outputTokens >`，作为服务层 prompt Suggestion这次计算的结果。
  return inputTokens + cacheWriteTokens + outputTokens >
    MAX_PARENT_UNCACHED_TOKENS
    ? 'cache_cold'
    : null
}

// SUGGESTION_PROMPT 命名 ``[SUGGESTION MODE: Suggest what the user might naturally ...`，让后续代码直接表达这个值的用途。
const SUGGESTION_PROMPT = `[SUGGESTION MODE: Suggest what the user might naturally type next into Claude Code.]

FIRST: Look at the user's recent messages and original request.

Your job is to predict what THEY would type - not what you think they should do.

THE TEST: Would they think "I was just about to type that"?

EXAMPLES:
User asked "fix the bug and run tests", bug is fixed → "run the tests"
After code written → "try it out"
Claude offers options → suggest the one the user would likely pick, based on conversation
Claude asks to continue → "yes" or "go ahead"
Task complete, obvious follow-up → "commit this" or "push it"
After error or misunderstanding → silence (let them assess/correct)

Be specific: "run the tests" beats "continue".

NEVER SUGGEST:
- Evaluative ("looks good", "thanks")
- Questions ("what about...?")
- Claude-voice ("Let me...", "I'll...", "Here's...")
- New ideas they didn't ask about
- Multiple sentences

Stay silent if the next step isn't obvious from what the user said.

Format: 2-12 words, match the user's style. Or nothing.

Reply with ONLY the suggestion, no quotes or explanation.`

// SUGGESTION_PROMPTS 集合 集中保存服务层 prompt Suggestion要一起传递的字段。
const SUGGESTION_PROMPTS: Record<PromptVariant, string> = {
  user_intent: SUGGESTION_PROMPT,
  stated_intent: SUGGESTION_PROMPT,
}

// generateSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateSuggestion(
  abortController: AbortController,
  promptId: PromptVariant,
  cacheSafeParams: CacheSafeParams,
): Promise<{ suggestion: string | null; generationRequestId: string | null }> {
  // 提示词读取 `SUGGESTION_PROMPTS[promptId]` 对应条目，后续围绕该成员继续处理。
  const prompt = SUGGESTION_PROMPTS[promptId]

  // Deny tools via callback, NOT by passing tools:[] - that busts cache (0% hit)
  // canUseTool记录 `async` 是否成立，服务层 prompt Suggestion随后按该结果分支。
  const canUseTool = async () => ({
    behavior: 'deny' as const,
    message: 'No tools needed for suggestion',
    decisionReason: { type: 'other' as const, reason: 'suggestion only' },
  })

  // DO NOT override any API parameter that differs from the parent request.
  // The fork piggybacks on the main thread's prompt cache by sending identical
  // cache-key params. The billing cache key includes more than just
  // system/tools/model/messages/thinking — empirically, setting effortValue
  // or maxOutputTokens on the fork (even via output_config or getAppState)
  // busts cache. PR #18143 tried effort:'low' and caused a 45x spike in cache
  // writes (92.7% → 61% hit rate). The only safe overrides are:
  //   - abortController (not sent to API)
  //   - skipTranscript (client-side only)
  //   - skipCacheWrite (controls cache_control markers, not the cache key)
  //   - canUseTool (client-side permission check)
  // 结果保存`runForkedAgent`，供服务层 prompt Suggestion后续处理使用。
  const result = await runForkedAgent({
    promptMessages: [createUserMessage({ content: prompt })],
    cacheSafeParams, // Don't override tools/thinking settings - busts cache
    canUseTool,
    querySource: 'prompt_suggestion',
    forkLabel: 'prompt_suggestion',
    overrides: {
      abortController,
    },
    skipTranscript: true,
    skipCacheWrite: true,
  })

  // Check ALL messages - model may loop (try tool → denied → text in next message)
  // Also extract the requestId from the first assistant message for RL dataset joins
  // firstAssistantMsg筛选`messages.find`，供服务层 prompt Suggestion后续处理使用。
  const firstAssistantMsg = result.messages.find(m => m.type === 'assistant')
  // generationRequestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const generationRequestId =
    firstAssistantMsg?.type === 'assistant'
      ? (firstAssistantMsg.requestId ?? null)
      : null

  // 按顺序遍历 `result.messages` 中的消息，逐个交给服务层 prompt Suggestion处理。
  for (const msg of result.messages) {
    // `msg.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'assistant') continue
    // textBlock筛选`content.find`，供服务层 prompt Suggestion后续处理使用。
    const textBlock = msg.message.content.find(b => b.type === 'text')
    // 当 `textBlock?.type` 匹配 `'text'` 时，服务层 prompt Suggestion执行对应分支。
    if (textBlock?.type === 'text') {
      // suggestion格式化`text.trim`，供服务层 prompt Suggestion后续处理使用。
      const suggestion = textBlock.text.trim()
      // 满足 `suggestion` 时，服务层 prompt Suggestion执行该分支。
      if (suggestion) {
        // 返回结构化结果，集中表达服务层 prompt Suggestion已经整理出的状态。
        return { suggestion, generationRequestId }
      }
    }
  }

  // 返回结构化结果，集中表达服务层 prompt Suggestion已经整理出的状态。
  return { suggestion: null, generationRequestId }
}

// shouldFilterSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldFilterSuggestion(
  suggestion: string | null,
  promptId: PromptVariant,
  source?: 'cli' | 'sdk',
): boolean {
  // suggestion缺失时提前走兜底路径，避免服务层 prompt Suggestion继续依赖无效输入。
  if (!suggestion) {
    // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
    logSuggestionSuppressed('empty', undefined, promptId, source)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // lower保存`suggestion.toLowerCase`，供服务层 prompt Suggestion后续处理使用。
  const lower = suggestion.toLowerCase()
  // wordCount 数量格式化`suggestion.trim`，供服务层 prompt Suggestion后续处理使用。
  const wordCount = suggestion.trim().split(/\s+/).length

  // 这个回调绑定到 const filters: Array<[string, () => boolean]> = [，负责服务层 prompt Suggestion在该局部场景下的响应。
  const filters: Array<[string, () => boolean]> = [
    // 这个回调绑定到 ['done', () => lower === 'done'],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['done', () => lower === 'done'],
    [
      'meta_text',
      // 这个回调绑定到 () =>，负责服务层 prompt Suggestion在该局部场景下的响应。
      () =>
        lower === 'nothing found' ||
        lower === 'nothing found.' ||
        lower.startsWith('nothing to suggest') ||
        lower.startsWith('no suggestion') ||
        // Model spells out the prompt's "stay silent" instruction
        /\bsilence is\b|\bstay(s|ing)? silent\b/.test(lower) ||
        // Model outputs bare "silence" wrapped in punctuation/whitespace
        /^\W*silence\W*$/.test(lower),
    ],
    [
      'meta_wrapped',
      // Model wraps meta-reasoning in parens/brackets: (silence — ...), [no suggestion]
      // 这个回调绑定到 () => /^\(.*\)$|^\[.*\]$/.test(suggestion),，负责服务层 prompt Suggestion在该局部场景下的响应。
      () => /^\(.*\)$|^\[.*\]$/.test(suggestion),
    ],
    [
      'error_message',
      // 这个回调绑定到 () =>，负责服务层 prompt Suggestion在该局部场景下的响应。
      () =>
        lower.startsWith('api error:') ||
        lower.startsWith('prompt is too long') ||
        lower.startsWith('request timed out') ||
        lower.startsWith('invalid api key') ||
        lower.startsWith('image was too large'),
    ],
    // 这个回调绑定到 ['prefixed_label', () => /^\w+:\s/.test(suggestion)],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['prefixed_label', () => /^\w+:\s/.test(suggestion)],
    [
      'too_few_words',
      // 这个回调绑定到 () => {，负责服务层 prompt Suggestion在该局部场景下的响应。
      () => {
        // 满足 `wordCount >= 2` 时，服务层 prompt Suggestion执行该分支。
        if (wordCount >= 2) return false
        // Allow slash commands — these are valid user commands
        // 满足 `suggestion.startsWith('/')` 时，服务层 prompt Suggestion执行该分支。
        if (suggestion.startsWith('/')) return false
        // Allow common single-word inputs that are valid user commands
        // ALLOWED_SINGLE_WORDS 集合保存`Set`，供服务层 prompt Suggestion后续处理使用。
        const ALLOWED_SINGLE_WORDS = new Set([
          // Affirmatives
          'yes',
          'yeah',
          'yep',
          'yea',
          'yup',
          'sure',
          'ok',
          'okay',
          // Actions
          'push',
          'commit',
          'deploy',
          'stop',
          'continue',
          'check',
          'exit',
          'quit',
          // Negation
          'no',
        ])
        // 返回 `!ALLOWED_SINGLE_WORDS.has(lower)`，作为服务层 prompt Suggestion这次计算的结果。
        return !ALLOWED_SINGLE_WORDS.has(lower)
      },
    ],
    // 这个回调绑定到 ['too_many_words', () => wordCount > 12],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['too_many_words', () => wordCount > 12],
    // 这个回调绑定到 ['too_long', () => suggestion.length >= 100],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['too_long', () => suggestion.length >= 100],
    // 这个回调绑定到 ['multiple_sentences', () => /[.!?]\s+[A-Z]/.test(suggestion)],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['multiple_sentences', () => /[.!?]\s+[A-Z]/.test(suggestion)],
    // 这个回调绑定到 ['has_formatting', () => /[\n*]|\*\*/.test(suggestion)],，负责服务层 prompt Suggestion在该局部场景下的响应。
    ['has_formatting', () => /[\n*]|\*\*/.test(suggestion)],
    [
      'evaluative',
      // 这个回调绑定到 () =>，负责服务层 prompt Suggestion在该局部场景下的响应。
      () =>
        /thanks|thank you|looks good|sounds good|that works|that worked|that's all|nice|great|perfect|makes sense|awesome|excellent/.test(
          lower,
        ),
    ],
    [
      'claude_voice',
      // 这个回调绑定到 () =>，负责服务层 prompt Suggestion在该局部场景下的响应。
      () =>
        /^(let me|i'll|i've|i'm|i can|i would|i think|i notice|here's|here is|here are|that's|this is|this will|you can|you should|you could|sure,|of course|certainly)/i.test(
          suggestion,
        ),
    ],
  ]

  // 循环处理 `const [reason, check] of filters`，让服务层 prompt Suggestion逐项把同类条目按顺序走完。
  for (const [reason, check] of filters) {
    // 满足 `check()` 时，服务层 prompt Suggestion执行该分支。
    if (check()) {
      // 调用 logSuggestionSuppressed，触发服务层 prompt Suggestion此处需要的副作用。
      logSuggestionSuppressed(reason, suggestion, promptId, source)
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Log acceptance/ignoring of a prompt suggestion. Used by the SDK push path
 * to track outcomes when the next user message arrives.
 */
// logSuggestionOutcome 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logSuggestionOutcome(
  suggestion: string,
  userInput: string,
  emittedAt: number,
  promptId: PromptVariant,
  generationRequestId: string | null,
): void {
  // similarity 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const similarity =
    Math.round((userInput.length / (suggestion.length || 1)) * 100) / 100
  // wasAccepted标记服务层 prompt Suggestion是否启用对应路径。
  const wasAccepted = userInput === suggestion
  // timeMs 集合保存`Math.max`，供服务层 prompt Suggestion后续处理使用。
  const timeMs = Math.max(0, Date.now() - emittedAt)

  // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_prompt_suggestion', {
    source: 'sdk' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    outcome: (wasAccepted
      ? 'accepted'
      : 'ignored') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    prompt_id:
      promptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(generationRequestId && {
      generationRequestId:
        generationRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(wasAccepted && {
      timeToAcceptMs: timeMs,
    }),
    ...(!wasAccepted && { timeToIgnoreMs: timeMs }),
    similarity,
    ...(process.env.USER_TYPE === 'ant' && {
      suggestion:
        suggestion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      userInput:
        userInput as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
  })
}

// logSuggestionSuppressed 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logSuggestionSuppressed(
  reason: string,
  suggestion?: string,
  promptId?: PromptVariant,
  source?: 'cli' | 'sdk',
): void {
  // resolvedPromptId读取`getPromptVariant`，供服务层 prompt Suggestion后续处理使用。
  const resolvedPromptId = promptId ?? getPromptVariant()
  // 记录服务层 prompt Suggestion运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_prompt_suggestion', {
    ...(source && {
      source:
        source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    outcome:
      'suppressed' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    reason:
      reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    prompt_id:
      resolvedPromptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(process.env.USER_TYPE === 'ant' &&
      suggestion && {
        suggestion:
          suggestion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
  })
}
