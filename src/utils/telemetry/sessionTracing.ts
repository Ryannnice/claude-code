/**
 * Session Tracing for Claude Code using OpenTelemetry (BETA)
 *
 * This module provides a high-level API for creating and managing spans
 * to trace Claude Code workflows. Each user interaction creates a root
 * interaction span, which contains operation spans (LLM requests, tool calls, etc.).
 *
 * Requirements:
 * - Enhanced telemetry is enabled via feature('ENHANCED_TELEMETRY_BETA')
 * - Configure OTEL_TRACES_EXPORTER (console, otlp, etc.)
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 context as otelContext、Span、trace，将 @opentelemetry/api 中已经封装好的能力接到本文件流程里。
import { context as otelContext, type Span, trace } from '@opentelemetry/api'
// 引入 AsyncLocalStorage，将 async_hooks 中已经封装好的能力接到本文件流程里。
import { AsyncLocalStorage } from 'async_hooks'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 类型依赖 { AssistantMessage, UserMessage } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { AssistantMessage, UserMessage } from '../../types/message.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from '../envUtils.js'
// 引入 getTelemetryAttributes，将 ../telemetryAttributes.js 中已经封装好的能力接到本文件流程里。
import { getTelemetryAttributes } from '../telemetryAttributes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  addBetaInteractionAttributes,
  addBetaLLMRequestAttributes,
  addBetaLLMResponseAttributes,
  addBetaToolInputAttributes,
  addBetaToolResultAttributes,
  isBetaTracingEnabled,
  type LLMRequestNewContext,
  truncateContent,
} from './betaSessionTracing.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  endInteractionPerfettoSpan,
  endLLMRequestPerfettoSpan,
  endToolPerfettoSpan,
  endUserInputPerfettoSpan,
  isPerfettoTracingEnabled,
  startInteractionPerfettoSpan,
  startLLMRequestPerfettoSpan,
  startToolPerfettoSpan,
  startUserInputPerfettoSpan,
} from './perfettoTracing.js'

// Re-export for callers
// 导出类型定义，让其他模块沿用共享工具 session Tracing的数据契约。
export type { Span }
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { isBetaTracingEnabled, type LLMRequestNewContext }

// Message type for API calls (UserMessage or AssistantMessage)
// APIMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type APIMessage = UserMessage | AssistantMessage

// SpanType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SpanType =
  | 'interaction'
  | 'llm_request'
  | 'tool'
  | 'tool.blocked_on_user'
  | 'tool.execution'
  | 'hook'

// SpanContext 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface SpanContext {
  span: Span
  startTime: number
  attributes: Record<string, string | number | boolean>
  ended?: boolean
  perfettoSpanId?: string
}

// ALS stores SpanContext directly so it holds a strong reference while a span
// is active. With that, activeSpans can use WeakRef — when ALS is cleared
// (enterWith(undefined)) and no other code holds the SpanContext, GC can collect
// it and the WeakRef goes stale.
// interactionContext构建`new AsyncLocalStorage<SpanContext | undefined>()` 整理出中间结果，供共享工具 session Tracing后续步骤使用。
const interactionContext = new AsyncLocalStorage<SpanContext | undefined>()
// toolContext构建`new AsyncLocalStorage<SpanContext | undefined>()`，供后续判断或组装使用。
const toolContext = new AsyncLocalStorage<SpanContext | undefined>()
// activeSpans 集合构建`new Map<string, WeakRef<SpanContext>>()`，供后续判断或组装使用。
const activeSpans = new Map<string, WeakRef<SpanContext>>()
// Spans not stored in ALS (LLM request, blocked-on-user, tool execution, hook)
// need a strong reference to prevent GC from collecting the SpanContext before
// the corresponding end* function retrieves it.
// strongSpans 集合 命名 `new Map<string, SpanContext>()`，让后续代码直接表达这个值的用途。
const strongSpans = new Map<string, SpanContext>()
// interactionSequence保存`0`，供后续判断或组装使用。
let interactionSequence = 0
// _cleanupIntervalStarted标记共享工具 session Tracing是否启用对应路径。
let _cleanupIntervalStarted = false

// SPAN_TTL_MS 集合保存`30 * 60 * 1000 // 30 minutes`，供共享工具 session Tracing后续判断或输出使用。
const SPAN_TTL_MS = 30 * 60 * 1000 // 30 minutes

// getSpanId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSpanId(span: Span): string {
  // 返回 `span.spanContext().spanId || ''`，作为共享工具这次计算的结果。
  return span.spanContext().spanId || ''
}

/**
 * Lazily start a background interval that evicts orphaned spans from activeSpans.
 *
 * Normal teardown calls endInteractionSpan / endToolSpan, which delete spans
 * immediately. This interval is a safety net for spans that were never ended
 * (e.g. aborted streams, uncaught exceptions mid-query) — without it they
 * accumulate in activeSpans indefinitely, holding references to Span objects
 * and the OpenTelemetry context chain.
 *
 * Initialized on the first startInteractionSpan call (not at module load) to
 * avoid triggering the no-top-level-side-effects lint rule and to keep the
 * interval from running in processes that never start a span.
 * unref() prevents the timer from keeping the process alive after all other
 * work is done.
 */
// ensureCleanupInterval 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ensureCleanupInterval(): void {
  // 满足 `_cleanupIntervalStarted` 时，共享工具执行该分支。
  if (_cleanupIntervalStarted) return
  // _cleanupIntervalStarted更新为 `true`，确保共享工具后续读取最新状态。
  _cleanupIntervalStarted = true
  // interval保存`setInterval`，供共享工具后续处理使用。
  const interval = setInterval(() => {
    // cutoff记录时间`Date.now`，供共享工具后续处理使用。
    const cutoff = Date.now() - SPAN_TTL_MS
    // 循环处理 `const [spanId, weakRef] of activeSpans`，让共享工具逐项把同类条目按顺序走完。
    for (const [spanId, weakRef] of activeSpans) {
      // ctx保存`weakRef.deref`，供共享工具后续处理使用。
      const ctx = weakRef.deref()
      // 满足 `ctx === undefined` 时，共享工具执行该分支。
      if (ctx === undefined) {
        // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
        activeSpans.delete(spanId)
        // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
        strongSpans.delete(spanId)
      // 共享工具 session Tracing在这里处理 `} else if (ctx.startTime < cutoff) {`，完成这一小步状态转换。
      } else if (ctx.startTime < cutoff) {
        // 满足 `!ctx.ended) ctx.span.end(` 时，共享工具执行该分支。
        if (!ctx.ended) ctx.span.end() // flush any recorded attributes to the exporter
        // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
        activeSpans.delete(spanId)
        // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
        strongSpans.delete(spanId)
      }
    }
  }, 60_000)
  // 当 `typeof interval.unref` 匹配 `'function'` 时，共享工具执行对应分支。
  if (typeof interval.unref === 'function') {
    // 调用 interval.unref，触发共享工具此处需要的副作用。
    interval.unref() // Node.js / Bun: don't block process exit
  }
}

/**
 * Check if enhanced telemetry is enabled.
 * Priority: env var override > ant build > GrowthBook gate
 */
// isEnhancedTelemetryEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEnhancedTelemetryEnabled(): boolean {
  // 满足 `feature('ENHANCED_TELEMETRY_BETA')` 时，共享工具执行该分支。
  if (feature('ENHANCED_TELEMETRY_BETA')) {
    // env 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const env =
      process.env.CLAUDE_CODE_ENHANCED_TELEMETRY_BETA ??
      process.env.ENABLE_ENHANCED_TELEMETRY_BETA
    // 满足 `isEnvTruthy(env)` 时，共享工具执行该分支。
    if (isEnvTruthy(env)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 满足 `isEnvDefinedFalsy(env)` 时，共享工具执行该分支。
    if (isEnvDefinedFalsy(env)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      process.env.USER_TYPE === 'ant' ||
      getFeatureValue_CACHED_MAY_BE_STALE('enhanced_telemetry_beta', false)
    )
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if any tracing is enabled (either standard enhanced telemetry OR beta tracing)
 */
// isAnyTracingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAnyTracingEnabled(): boolean {
  // 返回 `isEnhancedTelemetryEnabled() || isBetaTracingEnabled()`，作为共享工具这次计算的结果。
  return isEnhancedTelemetryEnabled() || isBetaTracingEnabled()
}

// getTracer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTracer() {
  // 返回 `trace.getTracer('com.anthropic.claude_code.tracing', '1.0.0')`，作为共享工具这次计算的结果。
  return trace.getTracer('com.anthropic.claude_code.tracing', '1.0.0')
}

// createSpanAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createSpanAttributes(
  spanType: SpanType,
  customAttributes: Record<string, string | number | boolean> = {},
): Record<string, string | number | boolean> {
  // baseAttributes 集合读取`getTelemetryAttributes`，供共享工具后续处理使用。
  const baseAttributes = getTelemetryAttributes()

  // attributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const attributes: Record<string, string | number | boolean> = {
    ...baseAttributes,
    'span.type': spanType,
    ...customAttributes,
  }

  // 返回 `attributes`，作为共享工具这次计算的结果。
  return attributes
}

/**
 * Start an interaction span. This wraps a user request -> Claude response cycle.
 * This is now a root span that includes all session-level attributes.
 * Sets the interaction context for all subsequent operations.
 */
// startInteractionSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startInteractionSpan(userPrompt: string): Span {
  // 调用 ensureCleanupInterval，触发共享工具此处需要的副作用。
  ensureCleanupInterval()

  // Start Perfetto span regardless of OTel tracing state
  // perfettoSpanId保存`isPerfettoTracingEnabled`，供共享工具后续处理使用。
  const perfettoSpanId = isPerfettoTracingEnabled()
    ? startInteractionPerfettoSpan(userPrompt)
    : undefined

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // Still track Perfetto span even if OTel is disabled
    // 满足 `perfettoSpanId` 时，共享工具执行该分支。
    if (perfettoSpanId) {
      // dummySpan读取`trace.getActiveSpan`，供共享工具后续处理使用。
      const dummySpan = trace.getActiveSpan() || getTracer().startSpan('dummy')
      // spanId读取`getSpanId`，供共享工具后续处理使用。
      const spanId = getSpanId(dummySpan)
      // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
      const spanContextObj: SpanContext = {
        span: dummySpan,
        startTime: Date.now(),
        attributes: {},
        perfettoSpanId,
      }
      // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      activeSpans.set(spanId, new WeakRef(spanContextObj))
      // 调用 interactionContext.enterWith，触发共享工具此处需要的副作用。
      interactionContext.enterWith(spanContextObj)
      // 返回 `dummySpan`，作为共享工具这次计算的结果。
      return dummySpan
    }
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // isUserPromptLoggingEnabled记录 `isEnvTruthy` 是否成立，共享工具随后按该结果分支。
  const isUserPromptLoggingEnabled = isEnvTruthy(
    process.env.OTEL_LOG_USER_PROMPTS,
  )
  // promptToLog 命名 `isUserPromptLoggingEnabled ? userPrompt : '<REDACTED>'`，让后续代码直接表达这个值的用途。
  const promptToLog = isUserPromptLoggingEnabled ? userPrompt : '<REDACTED>'

  // 共享工具 session Tracing在这里处理 `interactionSequence++`，完成这一小步状态转换。
  interactionSequence++

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('interaction', {
    user_prompt: promptToLog,
    user_prompt_length: userPrompt.length,
    'interaction.sequence': interactionSequence,
  })

  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan('claude_code.interaction', {
    attributes,
  })

  // Add experimental attributes (new_context)
  // 调用 addBetaInteractionAttributes，触发共享工具此处需要的副作用。
  addBetaInteractionAttributes(span, userPrompt)

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
    perfettoSpanId,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))

  // 调用 interactionContext.enterWith，触发共享工具此处需要的副作用。
  interactionContext.enterWith(spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

// endInteractionSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endInteractionSpan(): void {
  // spanContext读取`interactionContext.getStore`，供共享工具后续处理使用。
  const spanContext = interactionContext.getStore()
  // spanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!spanContext) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `spanContext.ended` 时，共享工具执行该分支。
  if (spanContext.ended) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // End Perfetto span
  // 满足 `spanContext.perfettoSpanId` 时，共享工具执行该分支。
  if (spanContext.perfettoSpanId) {
    // 调用 endInteractionPerfettoSpan，触发共享工具此处需要的副作用。
    endInteractionPerfettoSpan(spanContext.perfettoSpanId)
  }

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // ended更新为 `true`，确保共享工具后续读取最新状态。
    spanContext.ended = true
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(getSpanId(spanContext.span))
    // Clear the store so async continuations created after this point (timers,
    // promise callbacks, I/O) do not inherit a reference to the ended span.
    // enterWith(undefined) is intentional: exit(() => {}) is a no-op because it
    // only suppresses the store inside the callback and returns immediately.
    // 调用 interactionContext.enterWith，触发共享工具此处需要的副作用。
    interactionContext.enterWith(undefined)
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - spanContext.startTime
  // spanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  spanContext.span.setAttributes({
    'interaction.duration_ms': duration,
  })

  // 调用 spanContext.span.end，触发共享工具此处需要的副作用。
  spanContext.span.end()
  // ended更新为 `true`，确保共享工具后续读取最新状态。
  spanContext.ended = true
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(getSpanId(spanContext.span))
  // 调用 interactionContext.enterWith，触发共享工具此处需要的副作用。
  interactionContext.enterWith(undefined)
}

// startLLMRequestSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startLLMRequestSpan(
  model: string,
  newContext?: LLMRequestNewContext,
  messagesForAPI?: APIMessage[],
  fastMode?: boolean,
): Span {
  // Start Perfetto span regardless of OTel tracing state
  // perfettoSpanId保存`isPerfettoTracingEnabled`，供共享工具后续处理使用。
  const perfettoSpanId = isPerfettoTracingEnabled()
    ? startLLMRequestPerfettoSpan({
        model,
        querySource: newContext?.querySource,
        messageId: undefined, // Will be set in endLLMRequestSpan
      })
    : undefined

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // Still track Perfetto span even if OTel is disabled
    // 满足 `perfettoSpanId` 时，共享工具执行该分支。
    if (perfettoSpanId) {
      // dummySpan读取`trace.getActiveSpan`，供共享工具后续处理使用。
      const dummySpan = trace.getActiveSpan() || getTracer().startSpan('dummy')
      // spanId读取`getSpanId`，供共享工具后续处理使用。
      const spanId = getSpanId(dummySpan)
      // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
      const spanContextObj: SpanContext = {
        span: dummySpan,
        startTime: Date.now(),
        attributes: { model },
        perfettoSpanId,
      }
      // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      activeSpans.set(spanId, new WeakRef(spanContextObj))
      // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      strongSpans.set(spanId, spanContextObj)
      // 返回 `dummySpan`，作为共享工具这次计算的结果。
      return dummySpan
    }
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`interactionContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = interactionContext.getStore()

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('llm_request', {
    model: model,
    'llm_request.context': parentSpanCtx ? 'interaction' : 'standalone',
    speed: fastMode ? 'fast' : 'normal',
  })

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan('claude_code.llm_request', { attributes }, ctx)

  // Add query_source (agent name) if provided
  // 满足 `newContext?.querySource` 时，共享工具执行该分支。
  if (newContext?.querySource) {
    // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
    span.setAttribute('query_source', newContext.querySource)
  }

  // Add experimental attributes (system prompt, new_context)
  // 调用 addBetaLLMRequestAttributes，触发共享工具此处需要的副作用。
  addBetaLLMRequestAttributes(span, newContext, messagesForAPI)

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
    perfettoSpanId,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))
  // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  strongSpans.set(spanId, spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

/**
 * End an LLM request span and attach response metadata.
 *
 * @param span - Optional. The exact span returned by startLLMRequestSpan().
 *   IMPORTANT: When multiple LLM requests run in parallel (e.g., warmup requests,
 *   topic classifier, file path extractor, main thread), you MUST pass the specific span
 *   to ensure responses are attached to the correct request. Without it, responses may be
 *   incorrectly attached to whichever span happens to be "last" in the activeSpans map.
 *
 *   If not provided, falls back to finding the most recent llm_request span (legacy behavior).
 */
// endLLMRequestSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endLLMRequestSpan(
  span?: Span,
  metadata?: {
    inputTokens?: number
    outputTokens?: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    success?: boolean
    statusCode?: number
    error?: string
    attempt?: number
    modelResponse?: string
    /** Text output from the model (non-thinking content) */
    modelOutput?: string
    /** Thinking/reasoning output from the model */
    thinkingOutput?: string
    /** Whether the output included tool calls (look at tool spans for details) */
    hasToolCall?: boolean
    /** Time to first token in milliseconds */
    ttftMs?: number
    /** Time spent in pre-request setup before the successful attempt */
    requestSetupMs?: number
    /** Timestamps (Date.now()) of each attempt start — used to emit retry sub-spans */
    attemptStartTimes?: number[]
  },
): void {
  // llmSpanContext 先占位，稍后的条件分支会根据实际输入补齐它。
  let llmSpanContext: SpanContext | undefined

  // 满足 `span` 时，共享工具执行该分支。
  if (span) {
    // Use the provided span directly - this is the correct approach for parallel requests
    // spanId读取`getSpanId`，供共享工具后续处理使用。
    const spanId = getSpanId(span)
    // llmSpanContext更新为 `activeSpans.get(spanId)?.deref()`，确保共享工具后续读取最新状态。
    llmSpanContext = activeSpans.get(spanId)?.deref()
  } else {
    // Legacy fallback: find the most recent llm_request span
    // WARNING: This can cause mismatched responses when multiple requests are in flight
    // llmSpanContext更新为 `Array.from(activeSpans.values())`，确保共享工具后续读取最新状态。
    llmSpanContext = Array.from(activeSpans.values())
      // 链式调用 findLast，继续加工上一行在共享工具中产生的数据。
      .findLast(r => {
        // ctx保存`r.deref`，供共享工具后续处理使用。
        const ctx = r.deref()
        // 返回 `(`，作为共享工具这次计算的结果。
        return (
          ctx?.attributes['span.type'] === 'llm_request' ||
          ctx?.attributes['model']
        )
      })
      ?.deref()
  }

  // llmSpanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!llmSpanContext) {
    // Span was already ended or never tracked
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - llmSpanContext.startTime

  // End Perfetto span with full metadata
  // 满足 `llmSpanContext.perfettoSpanId` 时，共享工具执行该分支。
  if (llmSpanContext.perfettoSpanId) {
    // 调用 endLLMRequestPerfettoSpan，触发共享工具此处需要的副作用。
    endLLMRequestPerfettoSpan(llmSpanContext.perfettoSpanId, {
      ttftMs: metadata?.ttftMs,
      ttltMs: duration, // Time to last token is the total duration
      promptTokens: metadata?.inputTokens,
      outputTokens: metadata?.outputTokens,
      cacheReadTokens: metadata?.cacheReadTokens,
      cacheCreationTokens: metadata?.cacheCreationTokens,
      success: metadata?.success,
      error: metadata?.error,
      requestSetupMs: metadata?.requestSetupMs,
      attemptStartTimes: metadata?.attemptStartTimes,
    })
  }

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // spanId读取`getSpanId`，供共享工具后续处理使用。
    const spanId = getSpanId(llmSpanContext.span)
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(spanId)
    // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
    strongSpans.delete(spanId)
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // endAttributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const endAttributes: Record<string, string | number | boolean> = {
    duration_ms: duration,
  }

  // 满足 `metadata` 时，共享工具执行该分支。
  if (metadata) {
    // `metadata.inputTokens` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.inputTokens !== undefined)
      // endAttributes['input_tokens'更新为 `metadata.inputTokens`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['input_tokens'] = metadata.inputTokens
    // `metadata.outputTokens` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.outputTokens !== undefined)
      // endAttributes['output_tokens'更新为 `metadata.outputTokens`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['output_tokens'] = metadata.outputTokens
    // `metadata.cacheReadTokens` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.cacheReadTokens !== undefined)
      // endAttributes['cache_read_tokens' 缓存更新为 `metadata.cacheReadTokens`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['cache_read_tokens'] = metadata.cacheReadTokens
    // `metadata.cacheCreationTokens` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.cacheCreationTokens !== undefined)
      // endAttributes['cache_creation_tokens' 缓存更新为 `metadata.cacheCreationTokens`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['cache_creation_tokens'] = metadata.cacheCreationTokens
    // `metadata.success` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.success !== undefined)
      // endAttributes['success'更新为 `metadata.success`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['success'] = metadata.success
    // `metadata.statusCode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.statusCode !== undefined)
      // endAttributes['status_code'更新为 `metadata.statusCode`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['status_code'] = metadata.statusCode
    // `metadata.error` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.error !== undefined) endAttributes['error'] = metadata.error
    // `metadata.attempt` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.attempt !== undefined)
      // endAttributes['attempt'更新为 `metadata.attempt`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['attempt'] = metadata.attempt
    // `metadata.hasToolCall` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.hasToolCall !== undefined)
      // has_tool_call'更新为 `metadata.hasToolCall`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['response.has_tool_call'] = metadata.hasToolCall
    // `metadata.ttftMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.ttftMs !== undefined)
      // endAttributes['ttft_ms'更新为 `metadata.ttftMs`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['ttft_ms'] = metadata.ttftMs

    // Add experimental response attributes (model_output, thinking_output)
    // 调用 addBetaLLMResponseAttributes，触发共享工具此处需要的副作用。
    addBetaLLMResponseAttributes(endAttributes, metadata)
  }

  // llmSpanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  llmSpanContext.span.setAttributes(endAttributes)
  // 调用 llmSpanContext.span.end，触发共享工具此处需要的副作用。
  llmSpanContext.span.end()

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(llmSpanContext.span)
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(spanId)
  // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
  strongSpans.delete(spanId)
}

// startToolSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startToolSpan(
  toolName: string,
  toolAttributes?: Record<string, string | number | boolean>,
  toolInput?: string,
): Span {
  // Start Perfetto span regardless of OTel tracing state
  // perfettoSpanId保存`isPerfettoTracingEnabled`，供共享工具后续处理使用。
  const perfettoSpanId = isPerfettoTracingEnabled()
    ? startToolPerfettoSpan(toolName, toolAttributes)
    : undefined

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // Still track Perfetto span even if OTel is disabled
    // 满足 `perfettoSpanId` 时，共享工具执行该分支。
    if (perfettoSpanId) {
      // dummySpan读取`trace.getActiveSpan`，供共享工具后续处理使用。
      const dummySpan = trace.getActiveSpan() || getTracer().startSpan('dummy')
      // spanId读取`getSpanId`，供共享工具后续处理使用。
      const spanId = getSpanId(dummySpan)
      // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
      const spanContextObj: SpanContext = {
        span: dummySpan,
        startTime: Date.now(),
        attributes: { 'span.type': 'tool', tool_name: toolName },
        perfettoSpanId,
      }
      // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      activeSpans.set(spanId, new WeakRef(spanContextObj))
      // 调用 toolContext.enterWith，触发共享工具此处需要的副作用。
      toolContext.enterWith(spanContextObj)
      // 返回 `dummySpan`，作为共享工具这次计算的结果。
      return dummySpan
    }
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`interactionContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = interactionContext.getStore()

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('tool', {
    tool_name: toolName,
    ...toolAttributes,
  })

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan('claude_code.tool', { attributes }, ctx)

  // Add experimental tool input attributes
  // 满足 `toolInput` 时，共享工具执行该分支。
  if (toolInput) {
    // 调用 addBetaToolInputAttributes，触发共享工具此处需要的副作用。
    addBetaToolInputAttributes(span, toolName, toolInput)
  }

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
    perfettoSpanId,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))

  // 调用 toolContext.enterWith，触发共享工具此处需要的副作用。
  toolContext.enterWith(spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

// startToolBlockedOnUserSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startToolBlockedOnUserSpan(): Span {
  // Start Perfetto span regardless of OTel tracing state
  // perfettoSpanId保存`isPerfettoTracingEnabled`，供共享工具后续处理使用。
  const perfettoSpanId = isPerfettoTracingEnabled()
    ? startUserInputPerfettoSpan('tool_permission')
    : undefined

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // Still track Perfetto span even if OTel is disabled
    // 满足 `perfettoSpanId` 时，共享工具执行该分支。
    if (perfettoSpanId) {
      // dummySpan读取`trace.getActiveSpan`，供共享工具后续处理使用。
      const dummySpan = trace.getActiveSpan() || getTracer().startSpan('dummy')
      // spanId读取`getSpanId`，供共享工具后续处理使用。
      const spanId = getSpanId(dummySpan)
      // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
      const spanContextObj: SpanContext = {
        span: dummySpan,
        startTime: Date.now(),
        attributes: { 'span.type': 'tool.blocked_on_user' },
        perfettoSpanId,
      }
      // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      activeSpans.set(spanId, new WeakRef(spanContextObj))
      // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
      strongSpans.set(spanId, spanContextObj)
      // 返回 `dummySpan`，作为共享工具这次计算的结果。
      return dummySpan
    }
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`toolContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = toolContext.getStore()

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('tool.blocked_on_user')

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan(
    'claude_code.tool.blocked_on_user',
    { attributes },
    ctx,
  )

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
    perfettoSpanId,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))
  // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  strongSpans.set(spanId, spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

// endToolBlockedOnUserSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endToolBlockedOnUserSpan(
  decision?: string,
  source?: string,
): void {
  // blockedSpanContext保存`Array.from`，供共享工具后续处理使用。
  const blockedSpanContext = Array.from(activeSpans.values())
    .findLast(
      // r更新为 `> r.deref()?.attributes['span.type'] === 'tool.blocked_on...`，确保共享工具后续读取最新状态。
      r => r.deref()?.attributes['span.type'] === 'tool.blocked_on_user',
    )
    ?.deref()

  // blockedSpanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!blockedSpanContext) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // End Perfetto span
  // 满足 `blockedSpanContext.perfettoSpanId` 时，共享工具执行该分支。
  if (blockedSpanContext.perfettoSpanId) {
    // 调用 endUserInputPerfettoSpan，触发共享工具此处需要的副作用。
    endUserInputPerfettoSpan(blockedSpanContext.perfettoSpanId, {
      decision,
      source,
    })
  }

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // spanId读取`getSpanId`，供共享工具后续处理使用。
    const spanId = getSpanId(blockedSpanContext.span)
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(spanId)
    // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
    strongSpans.delete(spanId)
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - blockedSpanContext.startTime
  // attributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const attributes: Record<string, string | number | boolean> = {
    duration_ms: duration,
  }

  // 满足 `decision` 时，共享工具执行该分支。
  if (decision) {
    // attributes['decision'更新为 `decision`，确保共享工具 session Tracing后续读取最新状态。
    attributes['decision'] = decision
  }
  // 满足 `source` 时，共享工具执行该分支。
  if (source) {
    // attributes['source'更新为 `source`，确保共享工具 session Tracing后续读取最新状态。
    attributes['source'] = source
  }

  // blockedSpanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  blockedSpanContext.span.setAttributes(attributes)
  // 调用 blockedSpanContext.span.end，触发共享工具此处需要的副作用。
  blockedSpanContext.span.end()

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(blockedSpanContext.span)
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(spanId)
  // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
  strongSpans.delete(spanId)
}

// startToolExecutionSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startToolExecutionSpan(): Span {
  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`toolContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = toolContext.getStore()

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('tool.execution')

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan(
    'claude_code.tool.execution',
    { attributes },
    ctx,
  )

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))
  // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  strongSpans.set(spanId, spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

// endToolExecutionSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endToolExecutionSpan(metadata?: {
  success?: boolean
  error?: string
}): void {
  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // executionSpanContext保存`Array.from`，供共享工具后续处理使用。
  const executionSpanContext = Array.from(activeSpans.values())
    // 链式调用 findLast，继续加工上一行在共享工具中产生的数据。
    .findLast(r => r.deref()?.attributes['span.type'] === 'tool.execution')
    ?.deref()

  // executionSpanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!executionSpanContext) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - executionSpanContext.startTime
  // attributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const attributes: Record<string, string | number | boolean> = {
    duration_ms: duration,
  }

  // 满足 `metadata` 时，共享工具执行该分支。
  if (metadata) {
    // `metadata.success` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.success !== undefined) attributes['success'] = metadata.success
    // `metadata.error` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.error !== undefined) attributes['error'] = metadata.error
  }

  // executionSpanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  executionSpanContext.span.setAttributes(attributes)
  // 调用 executionSpanContext.span.end，触发共享工具此处需要的副作用。
  executionSpanContext.span.end()

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(executionSpanContext.span)
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(spanId)
  // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
  strongSpans.delete(spanId)
}

// endToolSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endToolSpan(toolResult?: string, resultTokens?: number): void {
  // toolSpanContext读取`toolContext.getStore`，供共享工具后续处理使用。
  const toolSpanContext = toolContext.getStore()

  // toolSpanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!toolSpanContext) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // End Perfetto span
  // 满足 `toolSpanContext.perfettoSpanId` 时，共享工具执行该分支。
  if (toolSpanContext.perfettoSpanId) {
    // 调用 endToolPerfettoSpan，触发共享工具此处需要的副作用。
    endToolPerfettoSpan(toolSpanContext.perfettoSpanId, {
      success: true,
      resultTokens,
    })
  }

  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // spanId读取`getSpanId`，供共享工具后续处理使用。
    const spanId = getSpanId(toolSpanContext.span)
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(spanId)
    // Same reasoning as interactionContext above: clear so subsequent async
    // work doesn't hold a stale reference to the ended tool span.
    // 调用 toolContext.enterWith，触发共享工具此处需要的副作用。
    toolContext.enterWith(undefined)
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - toolSpanContext.startTime
  // endAttributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const endAttributes: Record<string, string | number | boolean> = {
    duration_ms: duration,
  }

  // Add experimental tool result attributes (new_context)
  // 满足 `toolResult` 时，共享工具执行该分支。
  if (toolResult) {
    // toolName标记共享工具 session Tracing是否启用对应路径。
    const toolName = toolSpanContext.attributes['tool_name'] || 'unknown'
    // 调用 addBetaToolResultAttributes，触发共享工具此处需要的副作用。
    addBetaToolResultAttributes(endAttributes, toolName, toolResult)
  }

  // `resultTokens` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (resultTokens !== undefined) {
    // endAttributes['result_tokens'更新为 `resultTokens`，确保共享工具 session Tracing后续读取最新状态。
    endAttributes['result_tokens'] = resultTokens
  }

  // toolSpanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  toolSpanContext.span.setAttributes(endAttributes)
  // 调用 toolSpanContext.span.end，触发共享工具此处需要的副作用。
  toolSpanContext.span.end()

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(toolSpanContext.span)
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(spanId)
  // 调用 toolContext.enterWith，触发共享工具此处需要的副作用。
  toolContext.enterWith(undefined)
}

// isToolContentLoggingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolContentLoggingEnabled(): boolean {
  // 返回 `isEnvTruthy(process.env.OTEL_LOG_TOOL_CONTENT)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.OTEL_LOG_TOOL_CONTENT)
}

/**
 * Add a span event with tool content/output data.
 * Only logs if OTEL_LOG_TOOL_CONTENT=1 is set.
 * Truncates content if it exceeds MAX_CONTENT_SIZE.
 */
// addToolContentEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToolContentEvent(
  eventName: string,
  attributes: Record<string, string | number | boolean>,
): void {
  // 只有 `!isAnyTracingEnabled() || !isToolContentLoggingEnabled()` 满足时，共享工具才执行该分支。
  if (!isAnyTracingEnabled() || !isToolContentLoggingEnabled()) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // currentSpanCtx读取`toolContext.getStore`，供共享工具后续处理使用。
  const currentSpanCtx = toolContext.getStore()
  // currentSpanCtx缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!currentSpanCtx) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Truncate string attributes that might be large
  // processedAttributes 集合 从空对象开始收集键值，后续按名称补齐内容。
  const processedAttributes: Record<string, string | number | boolean> = {}
  // 循环处理 `const [key, value] of Object.entries(attributes)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(attributes)) {
    // 当 `typeof value` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof value === 'string') {
      // 从 `truncateContent(value)` 解构 content、truncated，减少共享工具 session Tracing对同一对象的重复访问。
      const { content, truncated } = truncateContent(value)
      // processedAttributes[key更新为 `content`，确保共享工具 session Tracing后续读取最新状态。
      processedAttributes[key] = content
      // 满足 `truncated` 时，共享工具执行该分支。
      if (truncated) {
        // processedAttributes[`${key}_truncated`更新为 `true`，确保共享工具 session Tracing后续读取最新状态。
        processedAttributes[`${key}_truncated`] = true
        // processedAttributes[`${key}_original_length` 数量更新为 `value.length`，确保共享工具 session Tracing后续读取最新状态。
        processedAttributes[`${key}_original_length`] = value.length
      }
    } else {
      // processedAttributes[key更新为 `value`，确保共享工具 session Tracing后续读取最新状态。
      processedAttributes[key] = value
    }
  }

  // 调用 currentSpanCtx.span.addEvent，触发共享工具此处需要的副作用。
  currentSpanCtx.span.addEvent(eventName, processedAttributes)
}

// getCurrentSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentSpan(): Span | null {
  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    toolContext.getStore()?.span ?? interactionContext.getStore()?.span ?? null
  )
}

// executeInSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function executeInSpan<T>(
  spanName: string,
  // 这个回调绑定到 fn: (span: Span) => Promise<T>,，负责共享工具在该局部场景下的响应。
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  // 满足 `!isAnyTracingEnabled()` 时，共享工具执行该分支。
  if (!isAnyTracingEnabled()) {
    // 返回 `fn(trace.getActiveSpan() || getTracer().startSpan('dummy'))`，作为共享工具这次计算的结果。
    return fn(trace.getActiveSpan() || getTracer().startSpan('dummy'))
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`toolContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = toolContext.getStore() ?? interactionContext.getStore()

  // finalAttributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const finalAttributes = createSpanAttributes('tool', {
    ...attributes,
  })

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan(spanName, { attributes: finalAttributes }, ctx)

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes: finalAttributes,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))
  // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  strongSpans.set(spanId, spanContextObj)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`fn`，供共享工具后续处理使用。
    const result = await fn(span)
    // 调用 span.end，触发共享工具此处需要的副作用。
    span.end()
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(spanId)
    // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
    strongSpans.delete(spanId)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 满足 `error instanceof Error` 时，共享工具执行该分支。
    if (error instanceof Error) {
      // 调用 span.recordException，触发共享工具此处需要的副作用。
      span.recordException(error)
    }
    // 调用 span.end，触发共享工具此处需要的副作用。
    span.end()
    // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
    activeSpans.delete(spanId)
    // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
    strongSpans.delete(spanId)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

/**
 * Start a hook execution span.
 * Only creates a span when beta tracing is enabled.
 * @param hookEvent The hook event type (e.g., 'PreToolUse', 'PostToolUse')
 * @param hookName The full hook name (e.g., 'PreToolUse:Write')
 * @param numHooks The number of hooks being executed
 * @param hookDefinitions JSON string of hook definitions for tracing
 * @returns The span (or a dummy span if tracing is disabled)
 */
// startHookSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startHookSpan(
  hookEvent: string,
  hookName: string,
  numHooks: number,
  hookDefinitions: string,
): Span {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 返回 `trace.getActiveSpan() || getTracer().startSpan('dummy')`，作为共享工具这次计算的结果。
    return trace.getActiveSpan() || getTracer().startSpan('dummy')
  }

  // tracer读取`getTracer`，供共享工具后续处理使用。
  const tracer = getTracer()
  // parentSpanCtx读取`toolContext.getStore`，供共享工具后续处理使用。
  const parentSpanCtx = toolContext.getStore() ?? interactionContext.getStore()

  // attributes 集合构建`createSpanAttributes`，供共享工具后续处理使用。
  const attributes = createSpanAttributes('hook', {
    hook_event: hookEvent,
    hook_name: hookName,
    num_hooks: numHooks,
    hook_definitions: hookDefinitions,
  })

  // ctx保存`parentSpanCtx`，供后续判断或组装使用。
  const ctx = parentSpanCtx
    ? trace.setSpan(otelContext.active(), parentSpanCtx.span)
    : otelContext.active()
  // span保存`tracer.startSpan`，供共享工具后续处理使用。
  const span = tracer.startSpan('claude_code.hook', { attributes }, ctx)

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContextObj 集中保存共享工具 session Tracing要一起传递的字段。
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
  }
  // activeSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  activeSpans.set(spanId, new WeakRef(spanContextObj))
  // strongSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  strongSpans.set(spanId, spanContextObj)

  // 返回 `span`，作为共享工具这次计算的结果。
  return span
}

/**
 * End a hook execution span with outcome metadata.
 * Only does work when beta tracing is enabled.
 * @param span The span to end (returned from startHookSpan)
 * @param metadata The outcome metadata for the hook execution
 */
// endHookSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endHookSpan(
  span: Span,
  metadata?: {
    numSuccess?: number
    numBlocking?: number
    numNonBlockingError?: number
    numCancelled?: number
  },
): void {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // spanId读取`getSpanId`，供共享工具后续处理使用。
  const spanId = getSpanId(span)
  // spanContext读取`activeSpans.get`，供共享工具后续处理使用。
  const spanContext = activeSpans.get(spanId)?.deref()

  // spanContext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!spanContext) {
    // 共享工具 session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // duration记录时间`Date.now`，供共享工具后续处理使用。
  const duration = Date.now() - spanContext.startTime
  // endAttributes 集合 集中保存共享工具 session Tracing要一起传递的字段。
  const endAttributes: Record<string, string | number | boolean> = {
    duration_ms: duration,
  }

  // 满足 `metadata` 时，共享工具执行该分支。
  if (metadata) {
    // `metadata.numSuccess` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.numSuccess !== undefined)
      // endAttributes['num_success'更新为 `metadata.numSuccess`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['num_success'] = metadata.numSuccess
    // `metadata.numBlocking` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.numBlocking !== undefined)
      // endAttributes['num_blocking'更新为 `metadata.numBlocking`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['num_blocking'] = metadata.numBlocking
    // `metadata.numNonBlockingError` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.numNonBlockingError !== undefined)
      // endAttributes['num_non_blocking_error' 错误信息更新为 `metadata.numNonBlockingError`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['num_non_blocking_error'] = metadata.numNonBlockingError
    // `metadata.numCancelled` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata.numCancelled !== undefined)
      // endAttributes['num_cancelled'更新为 `metadata.numCancelled`，确保共享工具 session Tracing后续读取最新状态。
      endAttributes['num_cancelled'] = metadata.numCancelled
  }

  // spanContext.span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  spanContext.span.setAttributes(endAttributes)
  // 调用 spanContext.span.end，触发共享工具此处需要的副作用。
  spanContext.span.end()
  // 调用 activeSpans.delete，触发共享工具此处需要的副作用。
  activeSpans.delete(spanId)
  // 调用 strongSpans.delete，触发共享工具此处需要的副作用。
  strongSpans.delete(spanId)
}
