// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 markPostCompaction，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { markPostCompaction } from 'src/bootstrap/state.js'
// 引入 getSdkBetas，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSdkBetas } from '../../bootstrap/state.js'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准服务层 auto Compact的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准服务层 auto Compact的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 auto Compact的数据契约。
import type { Message } from '../../types/message.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig } from '../../utils/config.js'
// 复用 getContextWindowForModel 工具函数，把通用处理留在 ../../utils/context.js 中维护。
import { getContextWindowForModel } from '../../utils/context.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 hasExactErrorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { hasExactErrorMessage } from '../../utils/errors.js'
// 类型依赖 { CacheSafeParams } 来自 ../../utils/forkedAgent.js，用于校准服务层 auto Compact的数据契约。
import type { CacheSafeParams } from '../../utils/forkedAgent.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 tokenCountWithEstimation 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { tokenCountWithEstimation } from '../../utils/tokens.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 引入 getMaxOutputTokensForModel，将 ../api/claude.js 中已经封装好的能力接到本文件流程里。
import { getMaxOutputTokensForModel } from '../api/claude.js'
// 引入 notifyCompaction，将 ../api/promptCacheBreakDetection.js 中已经封装好的能力接到本文件流程里。
import { notifyCompaction } from '../api/promptCacheBreakDetection.js'
// 引入 setLastSummarizedMessageId，将 ../SessionMemory/sessionMemoryUtils.js 中已经封装好的能力接到本文件流程里。
import { setLastSummarizedMessageId } from '../SessionMemory/sessionMemoryUtils.js'
// 整理这一组导入，让服务层 auto Compact后续逻辑可以直接复用这些外部能力。
import {
  type CompactionResult,
  compactConversation,
  ERROR_MESSAGE_USER_ABORT,
  type RecompactionInfo,
} from './compact.js'
// 引入 runPostCompactCleanup，将 ./postCompactCleanup.js 中已经封装好的能力接到本文件流程里。
import { runPostCompactCleanup } from './postCompactCleanup.js'
// 引入 trySessionMemoryCompaction，将 ./sessionMemoryCompact.js 中已经封装好的能力接到本文件流程里。
import { trySessionMemoryCompaction } from './sessionMemoryCompact.js'

// Reserve this many tokens for output during compaction
// Based on p99.99 of compact summary output being 17,387 tokens.
// MAX_OUTPUT_TOKENS_FOR_SUMMARY保存`20_000`，供服务层 auto Compact后续判断或输出使用。
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000

// Returns the context window size minus the max output tokens for the model
// getEffectiveContextWindowSize 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffectiveContextWindowSize(model: string): number {
  // reservedTokensForSummary保存`Math.min`，供服务层 auto Compact后续处理使用。
  const reservedTokensForSummary = Math.min(
    getMaxOutputTokensForModel(model),
    MAX_OUTPUT_TOKENS_FOR_SUMMARY,
  )
  // contextWindow读取`getContextWindowForModel`，供服务层 auto Compact后续处理使用。
  let contextWindow = getContextWindowForModel(model, getSdkBetas())

  // autoCompactWindow 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const autoCompactWindow = process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW
  // 满足 `autoCompactWindow` 时，服务层 auto Compact执行该分支。
  if (autoCompactWindow) {
    // 解析结果解析`parseInt`，供服务层 auto Compact后续处理使用。
    const parsed = parseInt(autoCompactWindow, 10)
    // 组合条件 `!isNaN(parsed) && parsed > 0` 成立时，服务层 auto Compact才启用这条专门路径。
    if (!isNaN(parsed) && parsed > 0) {
      // contextWindow更新为 `Math.min(contextWindow, parsed)`，确保服务层后续读取最新状态。
      contextWindow = Math.min(contextWindow, parsed)
    }
  }

  // 返回 `contextWindow - reservedTokensForSummary`，作为服务层 auto Compact这次计算的结果。
  return contextWindow - reservedTokensForSummary
}

// AutoCompactTrackingState 固化服务层 auto Compact里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoCompactTrackingState = {
  compacted: boolean
  turnCounter: number
  // Unique ID per turn
  turnId: string
  // Consecutive autocompact failures. Reset on success.
  // Used as a circuit breaker to stop retrying when the context is
  // irrecoverably over the limit (e.g., prompt_too_long).
  consecutiveFailures?: number
}

// AUTOCOMPACT_BUFFER_TOKENS 集合 命名 `13_000`，让后续代码直接表达这个值的用途。
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000
// WARNING_THRESHOLD_BUFFER_TOKENS 警告信息保存`20_000`，供服务层 auto Compact后续判断或输出使用。
export const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000
// ERROR_THRESHOLD_BUFFER_TOKENS 错误信息保存`20_000`，供服务层 auto Compact后续判断或输出使用。
export const ERROR_THRESHOLD_BUFFER_TOKENS = 20_000
// MANUAL_COMPACT_BUFFER_TOKENS 集合 命名 `3_000`，让后续代码直接表达这个值的用途。
export const MANUAL_COMPACT_BUFFER_TOKENS = 3_000

// Stop trying autocompact after this many consecutive failures.
// BQ 2026-03-10: 1,279 sessions had 50+ consecutive failures (up to 3,272)
// in a single session, wasting ~250K API calls/day globally.
// MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES 集合保存`3`，供后续判断或组装使用。
const MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3

// getAutoCompactThreshold 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoCompactThreshold(model: string): number {
  // effectiveContextWindow读取`getEffectiveContextWindowSize`，供服务层 auto Compact后续处理使用。
  const effectiveContextWindow = getEffectiveContextWindowSize(model)

  // autocompactThreshold 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const autocompactThreshold =
    effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS

  // Override for easier testing of autocompact
  // envPercent 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envPercent = process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
  // 满足 `envPercent` 时，服务层 auto Compact执行该分支。
  if (envPercent) {
    // 解析结果解析`parseFloat`，供服务层 auto Compact后续处理使用。
    const parsed = parseFloat(envPercent)
    // 组合条件 `!isNaN(parsed) && parsed > 0 && parsed <= 100` 成立时，服务层 auto Compact才启用这条专门路径。
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      // percentageThreshold保存`Math.floor`，供服务层 auto Compact后续处理使用。
      const percentageThreshold = Math.floor(
        effectiveContextWindow * (parsed / 100),
      )
      // 返回 `Math.min(percentageThreshold, autocompactThreshold)`，作为服务层 auto Compact这次计算的结果。
      return Math.min(percentageThreshold, autocompactThreshold)
    }
  }

  // 返回 `autocompactThreshold`，作为服务层 auto Compact这次计算的结果。
  return autocompactThreshold
}

// calculateTokenWarningState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateTokenWarningState(
  tokenUsage: number,
  model: string,
): {
  percentLeft: number
  isAboveWarningThreshold: boolean
  isAboveErrorThreshold: boolean
  isAboveAutoCompactThreshold: boolean
  isAtBlockingLimit: boolean
} {
  // autoCompactThreshold读取`getAutoCompactThreshold`，供服务层 auto Compact后续处理使用。
  const autoCompactThreshold = getAutoCompactThreshold(model)
  // threshold保存`isAutoCompactEnabled`，供服务层 auto Compact后续处理使用。
  const threshold = isAutoCompactEnabled()
    ? autoCompactThreshold
    : getEffectiveContextWindowSize(model)

  // percentLeft保存`Math.max`，供服务层 auto Compact后续处理使用。
  const percentLeft = Math.max(
    0,
    Math.round(((threshold - tokenUsage) / threshold) * 100),
  )

  // warningThreshold 警告信息保存`threshold - WARNING_THRESHOLD_BUFFER_TOKENS`，供后续判断或组装使用。
  const warningThreshold = threshold - WARNING_THRESHOLD_BUFFER_TOKENS
  // errorThreshold 错误信息保存`threshold - ERROR_THRESHOLD_BUFFER_TOKENS`，供后续判断或组装使用。
  const errorThreshold = threshold - ERROR_THRESHOLD_BUFFER_TOKENS

  // isAboveWarningThreshold 警告信息标记服务层 auto Compact是否启用对应路径。
  const isAboveWarningThreshold = tokenUsage >= warningThreshold
  // isAboveErrorThreshold 错误信息标记服务层 auto Compact是否启用对应路径。
  const isAboveErrorThreshold = tokenUsage >= errorThreshold

  // isAboveAutoCompactThreshold 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isAboveAutoCompactThreshold =
    isAutoCompactEnabled() && tokenUsage >= autoCompactThreshold

  // actualContextWindow读取`getEffectiveContextWindowSize`，供服务层 auto Compact后续处理使用。
  const actualContextWindow = getEffectiveContextWindowSize(model)
  // defaultBlockingLimit 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const defaultBlockingLimit =
    actualContextWindow - MANUAL_COMPACT_BUFFER_TOKENS

  // Allow override for testing
  // blockingLimitOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const blockingLimitOverride = process.env.CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE
  // parsedOverride保存`blockingLimitOverride`，供服务层 auto Compact后续判断或输出使用。
  const parsedOverride = blockingLimitOverride
    ? parseInt(blockingLimitOverride, 10)
    : NaN
  // blockingLimit 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const blockingLimit =
    !isNaN(parsedOverride) && parsedOverride > 0
      ? parsedOverride
      : defaultBlockingLimit

  // isAtBlockingLimit标记服务层 auto Compact是否启用对应路径。
  const isAtBlockingLimit = tokenUsage >= blockingLimit

  // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
  return {
    percentLeft,
    isAboveWarningThreshold,
    isAboveErrorThreshold,
    isAboveAutoCompactThreshold,
    isAtBlockingLimit,
  }
}

// isAutoCompactEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoCompactEnabled(): boolean {
  // 满足 `isEnvTruthy(process.env.DISABLE_COMPACT)` 时，服务层 auto Compact执行该分支。
  if (isEnvTruthy(process.env.DISABLE_COMPACT)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Allow disabling just auto-compact (keeps manual /compact working)
  // 满足 `isEnvTruthy(process.env.DISABLE_AUTO_COMPACT)` 时，服务层 auto Compact执行该分支。
  if (isEnvTruthy(process.env.DISABLE_AUTO_COMPACT)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Check if user has disabled auto-compact in their settings
  // userConfig 配置读取`getGlobalConfig`，供服务层 auto Compact后续处理使用。
  const userConfig = getGlobalConfig()
  // 返回 `userConfig.autoCompactEnabled`，作为服务层 auto Compact这次计算的结果。
  return userConfig.autoCompactEnabled
}

// shouldAutoCompact 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shouldAutoCompact(
  messages: Message[],
  model: string,
  querySource?: QuerySource,
  // Snip removes messages but the surviving assistant's usage still reflects
  // pre-snip context, so tokenCountWithEstimation can't see the savings.
  // Subtract the rough-delta that snip already computed.
  snipTokensFreed = 0,
): Promise<boolean> {
  // Recursion guards. session_memory and compact are forked agents that
  // would deadlock.
  // 组合条件 `querySource === 'session_memory' || querySource =` 成立时，服务层 auto Compact才启用这条专门路径。
  if (querySource === 'session_memory' || querySource === 'compact') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // marble_origami is the ctx-agent — if ITS context blows up and
  // autocompact fires, runPostCompactCleanup calls resetContextCollapse()
  // which destroys the MAIN thread's committed log (module-level state
  // shared across forks). Inside feature() so the string DCEs from
  // external builds (it's in excluded-strings.txt).
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，服务层 auto Compact执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    // 当 `querySource` 匹配 `'marble_origami'` 时，服务层 auto Compact执行对应分支。
    if (querySource === 'marble_origami') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 满足 `!isAutoCompactEnabled()` 时，服务层 auto Compact执行该分支。
  if (!isAutoCompactEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Reactive-only mode: suppress proactive autocompact, let reactive compact
  // catch the API's prompt-too-long. feature() wrapper keeps the flag string
  // out of external builds (REACTIVE_COMPACT is ant-only).
  // Note: returning false here also means autoCompactIfNeeded never reaches
  // trySessionMemoryCompaction in the query loop — the /compact call site
  // still tries session memory first. Revisit if reactive-only graduates.
  // 满足 `feature('REACTIVE_COMPACT')` 时，服务层 auto Compact执行该分支。
  if (feature('REACTIVE_COMPACT')) {
    // 满足 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_raccoon', false)` 时，服务层 auto Compact执行该分支。
    if (getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_raccoon', false)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // Context-collapse mode: same suppression. Collapse IS the context
  // management system when it's on — the 90% commit / 95% blocking-spawn
  // flow owns the headroom problem. Autocompact firing at effective-13k
  // (~93% of effective) sits right between collapse's commit-start (90%)
  // and blocking (95%), so it would race collapse and usually win, nuking
  // granular context that collapse was about to save. Gating here rather
  // than in isAutoCompactEnabled() keeps reactiveCompact alive as the 413
  // fallback (it consults isAutoCompactEnabled directly) and leaves
  // sessionMemory + manual /compact working.
  //
  // Consult isContextCollapseEnabled (not the raw gate) so the
  // CLAUDE_CONTEXT_COLLAPSE env override is honored here too. require()
  // inside the block breaks the init-time cycle (this file exports
  // getEffectiveContextWindowSize which collapse's index imports).
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，服务层 auto Compact执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 服务层 auto Compact先整理这一处局部数据，后续分支可以直接读取。
    const { isContextCollapseEnabled } =
      require('../contextCollapse/index.js') as typeof import('../contextCollapse/index.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 满足 `isContextCollapseEnabled()` 时，服务层 auto Compact执行该分支。
    if (isContextCollapseEnabled()) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // tokenCount 数量保存`tokenCountWithEstimation`，供服务层 auto Compact后续处理使用。
  const tokenCount = tokenCountWithEstimation(messages) - snipTokensFreed
  // threshold读取`getAutoCompactThreshold`，供服务层 auto Compact后续处理使用。
  const threshold = getAutoCompactThreshold(model)
  // effectiveWindow读取`getEffectiveContextWindowSize`，供服务层 auto Compact后续处理使用。
  const effectiveWindow = getEffectiveContextWindowSize(model)

  // 记录服务层 auto Compact运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `autocompact: tokens=${tokenCount} threshold=${threshold} effectiveWindow=${effectiveWindow}${snipTokensFreed > 0 ? ` snipFreed=${snipTokensFreed}` : ''}`,
  )

  // 从 `calculateTokenWarningState(` 解构 isAboveAutoCompactThreshold，减少服务层 auto Compact对同一对象的重复访问。
  const { isAboveAutoCompactThreshold } = calculateTokenWarningState(
    tokenCount,
    model,
  )

  // 返回 `isAboveAutoCompactThreshold`，作为服务层 auto Compact这次计算的结果。
  return isAboveAutoCompactThreshold
}

// autoCompactIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function autoCompactIfNeeded(
  messages: Message[],
  toolUseContext: ToolUseContext,
  cacheSafeParams: CacheSafeParams,
  querySource?: QuerySource,
  tracking?: AutoCompactTrackingState,
  snipTokensFreed?: number,
): Promise<{
  wasCompacted: boolean
  compactionResult?: CompactionResult
  consecutiveFailures?: number
}> {
  // 满足 `isEnvTruthy(process.env.DISABLE_COMPACT)` 时，服务层 auto Compact执行该分支。
  if (isEnvTruthy(process.env.DISABLE_COMPACT)) {
    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return { wasCompacted: false }
  }

  // Circuit breaker: stop retrying after N consecutive failures.
  // Without this, sessions where context is irrecoverably over the limit
  // hammer the API with doomed compaction attempts on every turn.
  // 服务层 auto Compact在这里进入条件判断，后续代码按实际状态分流。
  if (
    tracking?.consecutiveFailures !== undefined &&
    tracking.consecutiveFailures >= MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES
  ) {
    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return { wasCompacted: false }
  }

  // 模型名称保存`toolUseContext.options.mainLoopModel`，供后续判断或组装使用。
  const model = toolUseContext.options.mainLoopModel
  // shouldCompact记录 `shouldAutoCompact` 是否成立，服务层 auto Compact随后按该结果分支。
  const shouldCompact = await shouldAutoCompact(
    messages,
    model,
    querySource,
    snipTokensFreed,
  )

  // shouldCompact缺失时提前走兜底路径，避免服务层 auto Compact继续依赖无效输入。
  if (!shouldCompact) {
    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return { wasCompacted: false }
  }

  // recompactionInfo 集中保存服务层 auto Compact要一起传递的字段。
  const recompactionInfo: RecompactionInfo = {
    isRecompactionInChain: tracking?.compacted === true,
    turnsSincePreviousCompact: tracking?.turnCounter ?? -1,
    previousCompactTurnId: tracking?.turnId,
    autoCompactThreshold: getAutoCompactThreshold(model),
    querySource,
  }

  // EXPERIMENT: Try session memory compaction first
  // sessionMemoryResult 会话数据保存`trySessionMemoryCompaction`，供服务层 auto Compact后续处理使用。
  const sessionMemoryResult = await trySessionMemoryCompaction(
    messages,
    toolUseContext.agentId,
    recompactionInfo.autoCompactThreshold,
  )
  // 满足 `sessionMemoryResult` 时，服务层 auto Compact执行该分支。
  if (sessionMemoryResult) {
    // Reset lastSummarizedMessageId since session memory compaction prunes messages
    // and the old message UUID will no longer exist after the REPL replaces messages
    // setLastSummarizedMessageId 写入新的状态值，使服务层 auto Compact后续读取保持一致。
    setLastSummarizedMessageId(undefined)
    // 调用 runPostCompactCleanup，触发服务层 auto Compact此处需要的副作用。
    runPostCompactCleanup(querySource)
    // Reset cache read baseline so the post-compact drop isn't flagged as a
    // break. compactConversation does this internally; SM-compact doesn't.
    // BQ 2026-03-01: missing this made 20% of tengu_prompt_cache_break events
    // false positives (systemPromptChanged=true, timeSinceLastAssistantMsg=-1).
    // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，服务层 auto Compact执行该分支。
    if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
      // 调用 notifyCompaction，触发服务层 auto Compact此处需要的副作用。
      notifyCompaction(querySource ?? 'compact', toolUseContext.agentId)
    }
    // 调用 markPostCompaction，触发服务层 auto Compact此处需要的副作用。
    markPostCompaction()
    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return {
      wasCompacted: true,
      compactionResult: sessionMemoryResult,
    }
  }

  // 保护这一段可能失败的服务层 auto Compact操作，确保异常能进入相邻错误处理。
  try {
    // compactionResult保存`compactConversation`，供服务层 auto Compact后续处理使用。
    const compactionResult = await compactConversation(
      messages,
      toolUseContext,
      cacheSafeParams,
      true, // Suppress user questions for autocompact
      undefined, // No custom instructions for autocompact
      true, // isAutoCompact
      recompactionInfo,
    )

    // Reset lastSummarizedMessageId since legacy compaction replaces all messages
    // and the old message UUID will no longer exist in the new messages array
    // setLastSummarizedMessageId 写入新的状态值，使服务层 auto Compact后续读取保持一致。
    setLastSummarizedMessageId(undefined)
    // 调用 runPostCompactCleanup，触发服务层 auto Compact此处需要的副作用。
    runPostCompactCleanup(querySource)

    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return {
      wasCompacted: true,
      compactionResult,
      // Reset failure count on success
      consecutiveFailures: 0,
    }
  } catch (error) {
    // 满足 `!hasExactErrorMessage(error, ERROR_MESSAGE_USER_ABORT)` 时，服务层 auto Compact执行该分支。
    if (!hasExactErrorMessage(error, ERROR_MESSAGE_USER_ABORT)) {
      // 记录服务层 auto Compact运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // Increment consecutive failure count for circuit breaker.
    // The caller threads this through autoCompactTracking so the
    // next query loop iteration can skip futile retry attempts.
    // prevFailures 集合保存`tracking?.consecutiveFailures ?? 0`，供服务层 auto Compact后续判断或输出使用。
    const prevFailures = tracking?.consecutiveFailures ?? 0
    // nextFailures 集合保存`prevFailures + 1`，供服务层 auto Compact后续判断或输出使用。
    const nextFailures = prevFailures + 1
    // 满足 `nextFailures >= MAX_CONSECUTIVE_AUTOCOMPACT_FAILU` 时，服务层 auto Compact执行该分支。
    if (nextFailures >= MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES) {
      // 记录服务层 auto Compact运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `autocompact: circuit breaker tripped after ${nextFailures} consecutive failures — skipping future attempts this session`,
        { level: 'warn' },
      )
    }
    // 返回结构化结果，集中表达服务层 auto Compact已经整理出的状态。
    return { wasCompacted: false, consecutiveFailures: nextFailures }
  }
}
