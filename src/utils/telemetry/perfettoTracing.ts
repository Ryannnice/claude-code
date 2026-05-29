/**
 * Perfetto Tracing for Claude Code (Ant-only)
 *
 * This module generates traces in the Chrome Trace Event format that can be
 * viewed in ui.perfetto.dev or Chrome's chrome://tracing.
 *
 * NOTE: This feature is ant-only and eliminated from external builds.
 *
 * The trace file includes:
 * - Agent hierarchy (parent-child relationships in a swarm)
 * - API requests with TTFT, TTLT, prompt length, cache stats, msg ID, speculative flag
 * - Tool executions with name, duration, and token usage
 * - User input waiting time
 *
 * Usage:
 * 1. Enable via CLAUDE_CODE_PERFETTO_TRACE=1 or CLAUDE_CODE_PERFETTO_TRACE=<path>
 * 2. Optionally set CLAUDE_CODE_PERFETTO_WRITE_INTERVAL_S=<positive integer> to write the
 *    trace file periodically (default: write only on exit).
 * 3. Run Claude Code normally
 * 4. Trace file is written to ~/.claude/traces/trace-<session-id>.json
 *    or to the specified path
 * 5. Open in ui.perfetto.dev to visualize
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { mkdirSync, writeFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getClaudeConfigHomeDir,
  isEnvDefinedFalsy,
  isEnvTruthy,
} from '../envUtils.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 djb2Hash，将 ../hash.js 中已经封装好的能力接到本文件流程里。
import { djb2Hash } from '../hash.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 getAgentId、getAgentName、getParentSessionId，将 ../teammate.js 中已经封装好的能力接到本文件流程里。
import { getAgentId, getAgentName, getParentSessionId } from '../teammate.js'

/**
 * Chrome Trace Event format types
 * See: https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
 */

// TraceEventPhase 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TraceEventPhase =
  | 'B' // Begin duration event
  | 'E' // End duration event
  | 'X' // Complete event (with duration)
  | 'i' // Instant event
  | 'C' // Counter event
  | 'b' // Async begin
  | 'n' // Async instant
  | 'e' // Async end
  | 'M' // Metadata event

// TraceEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TraceEvent = {
  name: string
  cat: string
  ph: TraceEventPhase
  ts: number // Timestamp in microseconds
  pid: number // Process ID (we use 1 for main, agent IDs for subagents)
  tid: number // Thread ID (we use numeric hash of agent name or 1 for main)
  dur?: number // Duration in microseconds (for 'X' events)
  args?: Record<string, unknown>
  id?: string // For async events
  scope?: string
}

/**
 * Agent info for tracking hierarchy
 */
// AgentInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentInfo = {
  agentId: string
  agentName: string
  parentAgentId?: string
  processId: number
  threadId: number
}

/**
 * Pending span for tracking begin/end pairs
 */
// PendingSpan 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type PendingSpan = {
  name: string
  category: string
  startTime: number
  agentInfo: AgentInfo
  args: Record<string, unknown>
}

// Global state for the Perfetto tracer
// isEnabled标记共享工具 perfetto Tracing是否启用对应路径。
let isEnabled = false
// tracePath 路径数据保存`null`，作为后续空值处理的输入。
let tracePath: string | null = null
// Metadata events (ph: 'M' — process/thread names, parent links) are kept
// separate so they survive eviction — Perfetto UI needs them to label
// tracks. Bounded by agent count (~3 events per agent).
// metadataEvents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const metadataEvents: TraceEvent[] = []
// events 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const events: TraceEvent[] = []
// events[] cap. Cron-driven sessions run for days; 22 push sites × many
// turns would otherwise grow unboundedly (periodicWrite flushes to disk but
// does not truncate — it writes the full snapshot). At ~300B/event this is
// ~30MB, enough trace history for any debugging session. Eviction drops the
// oldest half when hit, amortized O(1).
// MAX_EVENTS 集合 命名 `100_000`，让后续代码直接表达这个值的用途。
const MAX_EVENTS = 100_000
// pendingSpans 集合构建`new Map<string, PendingSpan>()`，供后续判断或组装使用。
const pendingSpans = new Map<string, PendingSpan>()
// agentRegistry 命名 `new Map<string, AgentInfo>()`，让后续代码直接表达这个值的用途。
const agentRegistry = new Map<string, AgentInfo>()
// totalAgentCount 数量保存`0`，供后续判断或组装使用。
let totalAgentCount = 0
// startTimeMs 集合保存`0`，供共享工具 perfetto Tracing后续判断或输出使用。
let startTimeMs = 0
// spanIdCounter 数量保存`0`，供后续判断或组装使用。
let spanIdCounter = 0
// traceWritten保存`false // Flag to avoid double writes`，供共享工具 perfetto Tracing后续判断或输出使用。
let traceWritten = false // Flag to avoid double writes

// Map agent IDs to numeric process IDs (Perfetto requires numeric IDs)
// processIdCounter 数量保存`1`，供后续判断或组装使用。
let processIdCounter = 1
// agentIdToProcessId 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
const agentIdToProcessId = new Map<string, number>()

// Periodic write interval handle
// writeIntervalId保存`null`，作为后续空值处理的输入。
let writeIntervalId: ReturnType<typeof setInterval> | null = null

// STALE_SPAN_TTL_MS 集合保存`30 * 60 * 1000 // 30 minutes`，供共享工具 perfetto Tracing后续判断或输出使用。
const STALE_SPAN_TTL_MS = 30 * 60 * 1000 // 30 minutes
// STALE_SPAN_CLEANUP_INTERVAL_MS 集合 命名 `60 * 1000 // 1 minute`，让后续代码直接表达这个值的用途。
const STALE_SPAN_CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
// staleSpanCleanupId保存`null`，作为后续空值处理的输入。
let staleSpanCleanupId: ReturnType<typeof setInterval> | null = null

/**
 * Convert a string to a numeric hash for use as thread ID
 */
// stringToNumericHash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stringToNumericHash(str: string): number {
  // 返回 `Math.abs(djb2Hash(str)) || 1 // Ensure non-zero`，作为共享工具这次计算的结果。
  return Math.abs(djb2Hash(str)) || 1 // Ensure non-zero
}

/**
 * Get or create a numeric process ID for an agent
 */
// getProcessIdForAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getProcessIdForAgent(agentId: string): number {
  // existing读取`agentIdToProcessId.get`，供共享工具后续处理使用。
  const existing = agentIdToProcessId.get(agentId)
  // `existing` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (existing !== undefined) return existing

  // 共享工具 perfetto Tracing在这里处理 `processIdCounter++`，完成这一小步状态转换。
  processIdCounter++
  // agentIdToProcessId.set 写入新的状态值，使共享工具后续读取保持一致。
  agentIdToProcessId.set(agentId, processIdCounter)
  // 返回 `processIdCounter`，作为共享工具这次计算的结果。
  return processIdCounter
}

/**
 * Get current agent info
 */
// getCurrentAgentInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCurrentAgentInfo(): AgentInfo {
  // agentId读取`getAgentId`，供共享工具后续处理使用。
  const agentId = getAgentId() ?? getSessionId()
  // agentName读取`getAgentName`，供共享工具后续处理使用。
  const agentName = getAgentName() ?? 'main'
  // parentSessionId 会话数据读取`getParentSessionId`，供共享工具后续处理使用。
  const parentSessionId = getParentSessionId()

  // Check if we've already registered this agent
  // existing读取`agentRegistry.get`，供共享工具后续处理使用。
  const existing = agentRegistry.get(agentId)
  // 满足 `existing` 时，共享工具执行该分支。
  if (existing) return existing

  // info 集中保存共享工具 perfetto Tracing要一起传递的字段。
  const info: AgentInfo = {
    agentId,
    agentName,
    parentAgentId: parentSessionId,
    processId: agentId === getSessionId() ? 1 : getProcessIdForAgent(agentId),
    threadId: stringToNumericHash(agentName),
  }

  // agentRegistry.set 写入新的状态值，使共享工具后续读取保持一致。
  agentRegistry.set(agentId, info)
  // 共享工具 perfetto Tracing在这里处理 `totalAgentCount++`，完成这一小步状态转换。
  totalAgentCount++
  // 返回 `info`，作为共享工具这次计算的结果。
  return info
}

/**
 * Get timestamp in microseconds relative to trace start
 */
// getTimestamp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTimestamp(): number {
  // 返回 `(Date.now() - startTimeMs) * 1000`，作为共享工具这次计算的结果。
  return (Date.now() - startTimeMs) * 1000
}

/**
 * Generate a unique span ID
 */
// generateSpanId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateSpanId(): string {
  // 返回 ``span_${++spanIdCounter}``，作为共享工具这次计算的结果。
  return `span_${++spanIdCounter}`
}

/**
 * Evict pending spans older than STALE_SPAN_TTL_MS.
 * Mirrors the TTL cleanup pattern in sessionTracing.ts.
 */
// evictStaleSpans 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function evictStaleSpans(): void {
  // now读取`getTimestamp`，供共享工具后续处理使用。
  const now = getTimestamp()
  // ttlUs 集合保存`STALE_SPAN_TTL_MS * 1000 // Convert ms to microseconds`，供共享工具 perfetto Tracing后续判断或输出使用。
  const ttlUs = STALE_SPAN_TTL_MS * 1000 // Convert ms to microseconds
  // 循环处理 `const [spanId, span] of pendingSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [spanId, span] of pendingSpans) {
    // 满足 `now - span.startTime > ttlUs` 时，共享工具执行该分支。
    if (now - span.startTime > ttlUs) {
      // Emit an end event so the span shows up in the trace as incomplete
      // events 集合追加新条目，保持收集顺序与输入顺序一致。
      events.push({
        name: span.name,
        cat: span.category,
        ph: 'E',
        ts: now,
        pid: span.agentInfo.processId,
        tid: span.agentInfo.threadId,
        args: {
          ...span.args,
          evicted: true,
          duration_ms: (now - span.startTime) / 1000,
        },
      })
      // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
      pendingSpans.delete(spanId)
    }
  }
}

/**
 * Build the full trace document (Chrome Trace JSON format).
 */
// buildTraceDocument 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildTraceDocument(): string {
  // 返回 `jsonStringify({`，作为共享工具这次计算的结果。
  return jsonStringify({
    traceEvents: [...metadataEvents, ...events],
    metadata: {
      session_id: getSessionId(),
      trace_start_time: new Date(startTimeMs).toISOString(),
      agent_count: totalAgentCount,
      total_event_count: metadataEvents.length + events.length,
    },
  })
}

/**
 * Drop the oldest half of events[] when over MAX_EVENTS. Called from the
 * stale-span cleanup interval (60s). The half-batch splice keeps this
 * amortized O(1) — we don't pay splice cost per-push. A synthetic marker
 * is inserted so the gap is visible in ui.perfetto.dev.
 */
// evictOldestEvents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function evictOldestEvents(): void {
  // 满足 `events.length < MAX_EVENTS` 时，共享工具执行该分支。
  if (events.length < MAX_EVENTS) return
  // dropped保存`events.splice`，供共享工具后续处理使用。
  const dropped = events.splice(0, MAX_EVENTS / 2)
  // 调用 events.unshift，触发共享工具此处需要的副作用。
  events.unshift({
    name: 'trace_truncated',
    cat: '__metadata',
    ph: 'i',
    ts: dropped[dropped.length - 1]?.ts ?? 0,
    pid: 1,
    tid: 0,
    args: { dropped_events: dropped.length },
  })
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Perfetto] Evicted ${dropped.length} oldest events (cap ${MAX_EVENTS})`,
  )
}

/**
 * Initialize Perfetto tracing
 * Call this early in the application lifecycle
 */
// initializePerfettoTracing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializePerfettoTracing(): void {
  // envValue 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envValue = process.env.CLAUDE_CODE_PERFETTO_TRACE
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Perfetto] initializePerfettoTracing called, env value: ${envValue}`,
  )

  // Wrap in feature() for dead code elimination - entire block removed from external builds
  // 满足 `feature('PERFETTO_TRACING')` 时，共享工具执行该分支。
  if (feature('PERFETTO_TRACING')) {
    // 只有 `!envValue || isEnvDefinedFalsy(envValue)` 满足时，共享工具才执行该分支。
    if (!envValue || isEnvDefinedFalsy(envValue)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[Perfetto] Tracing disabled (env var not set or disabled)',
      )
      // 共享工具 perfetto Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // isEnabled更新为 `true`，确保共享工具后续读取最新状态。
    isEnabled = true
    // startTimeMs 集合更新为 `Date.now()`，确保共享工具后续读取最新状态。
    startTimeMs = Date.now()

    // Determine trace file path
    // 满足 `isEnvTruthy(envValue)` 时，共享工具执行该分支。
    if (isEnvTruthy(envValue)) {
      // tracesDir格式化`join`，供共享工具后续处理使用。
      const tracesDir = join(getClaudeConfigHomeDir(), 'traces')
      // tracePath 路径数据更新为 `join(tracesDir, `trace-${getSessionId()}.json`)`，确保共享工具后续读取最新状态。
      tracePath = join(tracesDir, `trace-${getSessionId()}.json`)
    } else {
      // Use the provided path
      // tracePath 路径数据更新为 `envValue`，确保共享工具后续读取最新状态。
      tracePath = envValue
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Tracing enabled, will write to: ${tracePath}, isEnabled=${isEnabled}`,
    )

    // Start periodic full-trace write if CLAUDE_CODE_PERFETTO_WRITE_INTERVAL_S is a positive integer
    // intervalSec解析`parseInt`，供共享工具后续处理使用。
    const intervalSec = parseInt(
      process.env.CLAUDE_CODE_PERFETTO_WRITE_INTERVAL_S ?? '',
      10,
    )
    // 满足 `intervalSec > 0` 时，共享工具执行该分支。
    if (intervalSec > 0) {
      // writeIntervalId更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
      writeIntervalId = setInterval(() => {
        // 显式忽略 `periodicWrite()` 的返回值，只保留它触发的副作用。
        void periodicWrite()
      }, intervalSec * 1000)
      // Don't let the interval keep the process alive on its own
      // 满足 `writeIntervalId.unref) writeIntervalId.unref(` 时，共享工具执行该分支。
      if (writeIntervalId.unref) writeIntervalId.unref()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Perfetto] Periodic write enabled, interval: ${intervalSec}s`,
      )
    }

    // Start stale span cleanup interval
    // staleSpanCleanupId更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
    staleSpanCleanupId = setInterval(() => {
      // 调用 evictStaleSpans，触发共享工具此处需要的副作用。
      evictStaleSpans()
      // 调用 evictOldestEvents，触发共享工具此处需要的副作用。
      evictOldestEvents()
    }, STALE_SPAN_CLEANUP_INTERVAL_MS)
    // 满足 `staleSpanCleanupId.unref) staleSpanCleanupId.unref(` 时，共享工具执行该分支。
    if (staleSpanCleanupId.unref) staleSpanCleanupId.unref()

    // Register cleanup to write final trace on exit
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[Perfetto] Cleanup callback invoked')
      // 等待 `writePerfettoTrace()` 完成，再继续共享工具 perfetto Tracing的异步流程。
      await writePerfettoTrace()
    })

    // Also register a beforeExit handler as a fallback
    // This ensures the trace is written even if cleanup registry is not called
    // 调用 process.on，触发共享工具此处需要的副作用。
    process.on('beforeExit', () => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[Perfetto] beforeExit handler invoked')
      // 显式忽略 `writePerfettoTrace()` 的返回值，只保留它触发的副作用。
      void writePerfettoTrace()
    })

    // Register a synchronous exit handler as a last resort
    // This is the final fallback to ensure trace is written before process exits
    // 调用 process.on，触发共享工具此处需要的副作用。
    process.on('exit', () => {
      // traceWritten缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!traceWritten) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[Perfetto] exit handler invoked, writing trace synchronously',
        )
        // 调用 writePerfettoTraceSync，触发共享工具此处需要的副作用。
        writePerfettoTraceSync()
      }
    })

    // Emit process metadata events for main process
    // mainAgent读取`getCurrentAgentInfo`，供共享工具后续处理使用。
    const mainAgent = getCurrentAgentInfo()
    // 调用 emitProcessMetadata，触发共享工具此处需要的副作用。
    emitProcessMetadata(mainAgent)
  }
}

/**
 * Emit metadata events for a process/agent
 */
// emitProcessMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function emitProcessMetadata(agentInfo: AgentInfo): void {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return

  // Process name
  // metadataEvents 集合追加新条目，保持收集顺序与输入顺序一致。
  metadataEvents.push({
    name: 'process_name',
    cat: '__metadata',
    ph: 'M',
    ts: 0,
    pid: agentInfo.processId,
    tid: 0,
    args: { name: agentInfo.agentName },
  })

  // Thread name (same as process for now)
  // metadataEvents 集合追加新条目，保持收集顺序与输入顺序一致。
  metadataEvents.push({
    name: 'thread_name',
    cat: '__metadata',
    ph: 'M',
    ts: 0,
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: { name: agentInfo.agentName },
  })

  // Add parent info if available
  // 满足 `agentInfo.parentAgentId` 时，共享工具执行该分支。
  if (agentInfo.parentAgentId) {
    // metadataEvents 集合追加新条目，保持收集顺序与输入顺序一致。
    metadataEvents.push({
      name: 'parent_agent',
      cat: '__metadata',
      ph: 'M',
      ts: 0,
      pid: agentInfo.processId,
      tid: 0,
      args: {
        parent_agent_id: agentInfo.parentAgentId,
      },
    })
  }
}

/**
 * Check if Perfetto tracing is enabled
 */
// isPerfettoTracingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPerfettoTracingEnabled(): boolean {
  // 返回 `isEnabled`，作为共享工具这次计算的结果。
  return isEnabled
}

/**
 * Register a new agent in the trace
 * Call this when a subagent/teammate is spawned
 */
// registerAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerAgent(
  agentId: string,
  agentName: string,
  parentAgentId?: string,
): void {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return

  // info 集中保存共享工具 perfetto Tracing要一起传递的字段。
  const info: AgentInfo = {
    agentId,
    agentName,
    parentAgentId,
    processId: getProcessIdForAgent(agentId),
    threadId: stringToNumericHash(agentName),
  }

  // agentRegistry.set 写入新的状态值，使共享工具后续读取保持一致。
  agentRegistry.set(agentId, info)
  // 共享工具 perfetto Tracing在这里处理 `totalAgentCount++`，完成这一小步状态转换。
  totalAgentCount++
  // 调用 emitProcessMetadata，触发共享工具此处需要的副作用。
  emitProcessMetadata(info)
}

/**
 * Unregister an agent from the trace.
 * Call this when an agent completes, fails, or is aborted to free memory.
 */
// unregisterAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterAgent(agentId: string): void {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return
  // 调用 agentRegistry.delete，触发共享工具此处需要的副作用。
  agentRegistry.delete(agentId)
  // 调用 agentIdToProcessId.delete，触发共享工具此处需要的副作用。
  agentIdToProcessId.delete(agentId)
}

/**
 * Start an API call span
 */
// startLLMRequestPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startLLMRequestPerfettoSpan(args: {
  model: string
  promptTokens?: number
  messageId?: string
  isSpeculative?: boolean
  querySource?: string
}): string {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return ''

  // spanId保存`generateSpanId`，供共享工具后续处理使用。
  const spanId = generateSpanId()
  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // pendingSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingSpans.set(spanId, {
    name: 'API Call',
    category: 'api',
    startTime: getTimestamp(),
    agentInfo,
    args: {
      model: args.model,
      prompt_tokens: args.promptTokens,
      message_id: args.messageId,
      is_speculative: args.isSpeculative ?? false,
      query_source: args.querySource,
    },
  })

  // Emit begin event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: 'API Call',
    cat: 'api',
    ph: 'B',
    ts: pendingSpans.get(spanId)!.startTime,
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: pendingSpans.get(spanId)!.args,
  })

  // 返回 `spanId`，作为共享工具这次计算的结果。
  return spanId
}

/**
 * End an API call span with response metadata
 */
// endLLMRequestPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endLLMRequestPerfettoSpan(
  spanId: string,
  metadata: {
    ttftMs?: number
    ttltMs?: number
    promptTokens?: number
    outputTokens?: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    messageId?: string
    success?: boolean
    error?: string
    /** Time spent in pre-request setup (client creation, retries) before the successful attempt */
    requestSetupMs?: number
    /** Timestamps (Date.now()) of each attempt start — used to emit retry sub-spans */
    attemptStartTimes?: number[]
  },
): void {
  // 只有 `!isEnabled || !spanId` 满足时，共享工具才执行该分支。
  if (!isEnabled || !spanId) return

  // pending读取`pendingSpans.get`，供共享工具后续处理使用。
  const pending = pendingSpans.get(spanId)
  // pending缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!pending) return

  // endTime读取`getTimestamp`，供共享工具后续处理使用。
  const endTime = getTimestamp()
  // duration 命名 `endTime - pending.startTime`，让后续代码直接表达这个值的用途。
  const duration = endTime - pending.startTime

  // promptTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const promptTokens =
    metadata.promptTokens ?? (pending.args.prompt_tokens as number | undefined)
  // ttftMs 集合保存`metadata.ttftMs`，供共享工具 perfetto Tracing后续判断或输出使用。
  const ttftMs = metadata.ttftMs
  // ttltMs 集合 命名 `metadata.ttltMs`，让后续代码直接表达这个值的用途。
  const ttltMs = metadata.ttltMs
  // outputTokens 集合保存`metadata.outputTokens`，供共享工具 perfetto Tracing后续判断或输出使用。
  const outputTokens = metadata.outputTokens
  // cacheReadTokens 缓存保存`metadata.cacheReadTokens`，供后续判断或组装使用。
  const cacheReadTokens = metadata.cacheReadTokens

  // Compute derived metrics
  // ITPS: input tokens per second (prompt processing speed)
  // itps 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const itps =
    ttftMs !== undefined && promptTokens !== undefined && ttftMs > 0
      ? Math.round((promptTokens / (ttftMs / 1000)) * 100) / 100
      : undefined

  // OTPS: output tokens per second (sampling speed)
  // samplingMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const samplingMs =
    ttltMs !== undefined && ttftMs !== undefined ? ttltMs - ttftMs : undefined
  // otps 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const otps =
    samplingMs !== undefined && outputTokens !== undefined && samplingMs > 0
      ? Math.round((outputTokens / (samplingMs / 1000)) * 100) / 100
      : undefined

  // Cache hit rate: percentage of prompt tokens from cache
  // cacheHitRate 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cacheHitRate =
    cacheReadTokens !== undefined &&
    promptTokens !== undefined &&
    promptTokens > 0
      ? Math.round((cacheReadTokens / promptTokens) * 10000) / 100
      : undefined

  // requestSetupMs 请求数据保存`metadata.requestSetupMs`，供共享工具 perfetto Tracing后续判断或输出使用。
  const requestSetupMs = metadata.requestSetupMs
  // attemptStartTimes 集合保存`metadata.attemptStartTimes`，供后续判断或组装使用。
  const attemptStartTimes = metadata.attemptStartTimes

  // Merge metadata with original args
  // 参数列表集中保存共享工具 perfetto Tracing要一起传递的字段。
  const args = {
    ...pending.args,
    ttft_ms: ttftMs,
    ttlt_ms: ttltMs,
    prompt_tokens: promptTokens,
    output_tokens: outputTokens,
    cache_read_tokens: cacheReadTokens,
    cache_creation_tokens: metadata.cacheCreationTokens,
    message_id: metadata.messageId ?? pending.args.message_id,
    success: metadata.success ?? true,
    error: metadata.error,
    duration_ms: duration / 1000,
    request_setup_ms: requestSetupMs,
    // Derived metrics
    itps,
    otps,
    cache_hit_rate_pct: cacheHitRate,
  }

  // Emit Request Setup sub-span when there was measurable setup time
  // (client creation, param building, retries before the successful attempt)
  // setupUs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const setupUs =
    requestSetupMs !== undefined && requestSetupMs > 0
      ? requestSetupMs * 1000
      : 0
  // 满足 `setupUs > 0` 时，共享工具执行该分支。
  if (setupUs > 0) {
    // setupEndTs 集合保存`pending.startTime + setupUs`，供共享工具 perfetto Tracing后续判断或输出使用。
    const setupEndTs = pending.startTime + setupUs

    // events 集合追加新条目，保持收集顺序与输入顺序一致。
    events.push({
      name: 'Request Setup',
      cat: 'api,setup',
      ph: 'B',
      ts: pending.startTime,
      pid: pending.agentInfo.processId,
      tid: pending.agentInfo.threadId,
      args: {
        request_setup_ms: requestSetupMs,
        attempt_count: attemptStartTimes?.length ?? 1,
      },
    })

    // Emit retry attempt sub-spans within Request Setup.
    // Each failed attempt runs from its start to the next attempt's start.
    // 只有 `attemptStartTimes && attemptStartTimes.length > 1` 满足时，共享工具才执行该分支。
    if (attemptStartTimes && attemptStartTimes.length > 1) {
      // attemptStartTimes[0] is the reference point (first attempt).
      // Convert wall-clock deltas into Perfetto-relative microseconds.
      // baseWallMs 集合读取 `attemptStartTimes[0]!` 对应条目，后续围绕该成员继续处理。
      const baseWallMs = attemptStartTimes[0]!
      // 按索引扫描 `attemptStartTimes.length - 1`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < attemptStartTimes.length - 1; i++) {
        // attemptStartUs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const attemptStartUs =
          pending.startTime + (attemptStartTimes[i]! - baseWallMs) * 1000
        // attemptEndUs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const attemptEndUs =
          pending.startTime + (attemptStartTimes[i + 1]! - baseWallMs) * 1000

        // events 集合追加新条目，保持收集顺序与输入顺序一致。
        events.push({
          name: `Attempt ${i + 1} (retry)`,
          cat: 'api,retry',
          ph: 'B',
          ts: attemptStartUs,
          pid: pending.agentInfo.processId,
          tid: pending.agentInfo.threadId,
          args: { attempt: i + 1 },
        })
        // events 集合追加新条目，保持收集顺序与输入顺序一致。
        events.push({
          name: `Attempt ${i + 1} (retry)`,
          cat: 'api,retry',
          ph: 'E',
          ts: attemptEndUs,
          pid: pending.agentInfo.processId,
          tid: pending.agentInfo.threadId,
        })
      }
    }

    // events 集合追加新条目，保持收集顺序与输入顺序一致。
    events.push({
      name: 'Request Setup',
      cat: 'api,setup',
      ph: 'E',
      ts: setupEndTs,
      pid: pending.agentInfo.processId,
      tid: pending.agentInfo.threadId,
    })
  }

  // Emit sub-spans for First Token and Sampling phases (before API Call end)
  // Using B/E pairs in proper nesting order for correct Perfetto visualization
  // `ttftMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (ttftMs !== undefined) {
    // First Token starts after request setup (if any)
    // firstTokenStartTs 集合保存`pending.startTime + setupUs`，供共享工具 perfetto Tracing后续判断或输出使用。
    const firstTokenStartTs = pending.startTime + setupUs
    // firstTokenEndTs 集合保存`firstTokenStartTs + ttftMs * 1000`，供后续判断或组装使用。
    const firstTokenEndTs = firstTokenStartTs + ttftMs * 1000

    // First Token phase: from successful attempt start to first token
    // events 集合追加新条目，保持收集顺序与输入顺序一致。
    events.push({
      name: 'First Token',
      cat: 'api,ttft',
      ph: 'B',
      ts: firstTokenStartTs,
      pid: pending.agentInfo.processId,
      tid: pending.agentInfo.threadId,
      args: {
        ttft_ms: ttftMs,
        prompt_tokens: promptTokens,
        itps,
        cache_hit_rate_pct: cacheHitRate,
      },
    })
    // events 集合追加新条目，保持收集顺序与输入顺序一致。
    events.push({
      name: 'First Token',
      cat: 'api,ttft',
      ph: 'E',
      ts: firstTokenEndTs,
      pid: pending.agentInfo.processId,
      tid: pending.agentInfo.threadId,
    })

    // Sampling phase: from first token to last token
    // Note: samplingMs = ttltMs - ttftMs still includes setup time in ttltMs,
    // so we compute the actual sampling duration for the span as the time from
    // first token to API call end (endTime), not samplingMs directly.
    // actualSamplingMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const actualSamplingMs =
      ttltMs !== undefined ? ttltMs - ttftMs - setupUs / 1000 : undefined
    // `actualSamplingMs` 与 `undefined && actualSamplingM` 不一致时刷新派生状态，避免使用过期结果。
    if (actualSamplingMs !== undefined && actualSamplingMs > 0) {
      // events 集合追加新条目，保持收集顺序与输入顺序一致。
      events.push({
        name: 'Sampling',
        cat: 'api,sampling',
        ph: 'B',
        ts: firstTokenEndTs,
        pid: pending.agentInfo.processId,
        tid: pending.agentInfo.threadId,
        args: {
          sampling_ms: actualSamplingMs,
          output_tokens: outputTokens,
          otps,
        },
      })
      // events 集合追加新条目，保持收集顺序与输入顺序一致。
      events.push({
        name: 'Sampling',
        cat: 'api,sampling',
        ph: 'E',
        ts: firstTokenEndTs + actualSamplingMs * 1000,
        pid: pending.agentInfo.processId,
        tid: pending.agentInfo.threadId,
      })
    }
  }

  // Emit API Call end event (after sub-spans)
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: pending.name,
    cat: pending.category,
    ph: 'E',
    ts: endTime,
    pid: pending.agentInfo.processId,
    tid: pending.agentInfo.threadId,
    args,
  })

  // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
  pendingSpans.delete(spanId)
}

/**
 * Start a tool execution span
 */
// startToolPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startToolPerfettoSpan(
  toolName: string,
  args?: Record<string, unknown>,
): string {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return ''

  // spanId保存`generateSpanId`，供共享工具后续处理使用。
  const spanId = generateSpanId()
  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // pendingSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingSpans.set(spanId, {
    name: `Tool: ${toolName}`,
    category: 'tool',
    startTime: getTimestamp(),
    agentInfo,
    args: {
      tool_name: toolName,
      ...args,
    },
  })

  // Emit begin event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: `Tool: ${toolName}`,
    cat: 'tool',
    ph: 'B',
    ts: pendingSpans.get(spanId)!.startTime,
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: pendingSpans.get(spanId)!.args,
  })

  // 返回 `spanId`，作为共享工具这次计算的结果。
  return spanId
}

/**
 * End a tool execution span
 */
// endToolPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endToolPerfettoSpan(
  spanId: string,
  metadata?: {
    success?: boolean
    error?: string
    resultTokens?: number
  },
): void {
  // 只有 `!isEnabled || !spanId` 满足时，共享工具才执行该分支。
  if (!isEnabled || !spanId) return

  // pending读取`pendingSpans.get`，供共享工具后续处理使用。
  const pending = pendingSpans.get(spanId)
  // pending缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!pending) return

  // endTime读取`getTimestamp`，供共享工具后续处理使用。
  const endTime = getTimestamp()
  // duration 命名 `endTime - pending.startTime`，让后续代码直接表达这个值的用途。
  const duration = endTime - pending.startTime

  // 参数列表集中保存共享工具 perfetto Tracing要一起传递的字段。
  const args = {
    ...pending.args,
    success: metadata?.success ?? true,
    error: metadata?.error,
    result_tokens: metadata?.resultTokens,
    duration_ms: duration / 1000,
  }

  // Emit end event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: pending.name,
    cat: pending.category,
    ph: 'E',
    ts: endTime,
    pid: pending.agentInfo.processId,
    tid: pending.agentInfo.threadId,
    args,
  })

  // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
  pendingSpans.delete(spanId)
}

/**
 * Start a user input waiting span
 */
// startUserInputPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startUserInputPerfettoSpan(context?: string): string {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return ''

  // spanId保存`generateSpanId`，供共享工具后续处理使用。
  const spanId = generateSpanId()
  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // pendingSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingSpans.set(spanId, {
    name: 'Waiting for User Input',
    category: 'user_input',
    startTime: getTimestamp(),
    agentInfo,
    args: {
      context,
    },
  })

  // Emit begin event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: 'Waiting for User Input',
    cat: 'user_input',
    ph: 'B',
    ts: pendingSpans.get(spanId)!.startTime,
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: pendingSpans.get(spanId)!.args,
  })

  // 返回 `spanId`，作为共享工具这次计算的结果。
  return spanId
}

/**
 * End a user input waiting span
 */
// endUserInputPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endUserInputPerfettoSpan(
  spanId: string,
  metadata?: {
    decision?: string
    source?: string
  },
): void {
  // 只有 `!isEnabled || !spanId` 满足时，共享工具才执行该分支。
  if (!isEnabled || !spanId) return

  // pending读取`pendingSpans.get`，供共享工具后续处理使用。
  const pending = pendingSpans.get(spanId)
  // pending缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!pending) return

  // endTime读取`getTimestamp`，供共享工具后续处理使用。
  const endTime = getTimestamp()
  // duration 命名 `endTime - pending.startTime`，让后续代码直接表达这个值的用途。
  const duration = endTime - pending.startTime

  // 参数列表集中保存共享工具 perfetto Tracing要一起传递的字段。
  const args = {
    ...pending.args,
    decision: metadata?.decision,
    source: metadata?.source,
    duration_ms: duration / 1000,
  }

  // Emit end event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: pending.name,
    cat: pending.category,
    ph: 'E',
    ts: endTime,
    pid: pending.agentInfo.processId,
    tid: pending.agentInfo.threadId,
    args,
  })

  // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
  pendingSpans.delete(spanId)
}

/**
 * Emit an instant event (marker)
 */
// emitPerfettoInstant 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitPerfettoInstant(
  name: string,
  category: string,
  args?: Record<string, unknown>,
): void {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return

  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name,
    cat: category,
    ph: 'i',
    ts: getTimestamp(),
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args,
  })
}

/**
 * Emit a counter event for tracking metrics over time
 */
// emitPerfettoCounter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitPerfettoCounter(
  name: string,
  values: Record<string, number>,
): void {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return

  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name,
    cat: 'counter',
    ph: 'C',
    ts: getTimestamp(),
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: values,
  })
}

/**
 * Start an interaction span (wraps a full user request cycle)
 */
// startInteractionPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startInteractionPerfettoSpan(userPrompt?: string): string {
  // isEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isEnabled) return ''

  // spanId保存`generateSpanId`，供共享工具后续处理使用。
  const spanId = generateSpanId()
  // agentInfo读取`getCurrentAgentInfo`，供共享工具后续处理使用。
  const agentInfo = getCurrentAgentInfo()

  // pendingSpans.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingSpans.set(spanId, {
    name: 'Interaction',
    category: 'interaction',
    startTime: getTimestamp(),
    agentInfo,
    args: {
      user_prompt_length: userPrompt?.length,
    },
  })

  // Emit begin event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: 'Interaction',
    cat: 'interaction',
    ph: 'B',
    ts: pendingSpans.get(spanId)!.startTime,
    pid: agentInfo.processId,
    tid: agentInfo.threadId,
    args: pendingSpans.get(spanId)!.args,
  })

  // 返回 `spanId`，作为共享工具这次计算的结果。
  return spanId
}

/**
 * End an interaction span
 */
// endInteractionPerfettoSpan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endInteractionPerfettoSpan(spanId: string): void {
  // 只有 `!isEnabled || !spanId` 满足时，共享工具才执行该分支。
  if (!isEnabled || !spanId) return

  // pending读取`pendingSpans.get`，供共享工具后续处理使用。
  const pending = pendingSpans.get(spanId)
  // pending缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!pending) return

  // endTime读取`getTimestamp`，供共享工具后续处理使用。
  const endTime = getTimestamp()
  // duration 命名 `endTime - pending.startTime`，让后续代码直接表达这个值的用途。
  const duration = endTime - pending.startTime

  // Emit end event
  // events 集合追加新条目，保持收集顺序与输入顺序一致。
  events.push({
    name: pending.name,
    cat: pending.category,
    ph: 'E',
    ts: endTime,
    pid: pending.agentInfo.processId,
    tid: pending.agentInfo.threadId,
    args: {
      ...pending.args,
      duration_ms: duration / 1000,
    },
  })

  // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
  pendingSpans.delete(spanId)
}

// ---------------------------------------------------------------------------
// Periodic write helpers
// ---------------------------------------------------------------------------

/**
 * Stop the periodic write timer.
 */
// stopWriteInterval 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stopWriteInterval(): void {
  // 满足 `staleSpanCleanupId` 时，共享工具执行该分支。
  if (staleSpanCleanupId) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(staleSpanCleanupId)
    // staleSpanCleanupId更新为 `null`，确保共享工具后续读取最新状态。
    staleSpanCleanupId = null
  }
  // 满足 `writeIntervalId` 时，共享工具执行该分支。
  if (writeIntervalId) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(writeIntervalId)
    // writeIntervalId更新为 `null`，确保共享工具后续读取最新状态。
    writeIntervalId = null
  }
}

/**
 * Force-close any remaining open spans at session end.
 */
// closeOpenSpans 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function closeOpenSpans(): void {
  // 循环处理 `const [spanId, pending] of pendingSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [spanId, pending] of pendingSpans) {
    // endTime读取`getTimestamp`，供共享工具后续处理使用。
    const endTime = getTimestamp()
    // events 集合追加新条目，保持收集顺序与输入顺序一致。
    events.push({
      name: pending.name,
      cat: pending.category,
      ph: 'E',
      ts: endTime,
      pid: pending.agentInfo.processId,
      tid: pending.agentInfo.threadId,
      args: {
        ...pending.args,
        incomplete: true,
        duration_ms: (endTime - pending.startTime) / 1000,
      },
    })
    // 调用 pendingSpans.delete，触发共享工具此处需要的副作用。
    pendingSpans.delete(spanId)
  }
}

/**
 * Write the full trace to disk.  Errors are logged but swallowed so that a
 * transient I/O problem does not crash the session — the next periodic tick
 * (or the final exit write) will retry with a complete snapshot.
 */
// periodicWrite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function periodicWrite(): Promise<void> {
  // 只有 `!isEnabled || !tracePath || traceWritten` 满足时，共享工具才执行该分支。
  if (!isEnabled || !tracePath || traceWritten) return

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dirname(tracePath), { recursive: true })` 完成，再继续共享工具 perfetto Tracing的异步流程。
    await mkdir(dirname(tracePath), { recursive: true })
    // 等待 `writeFile(tracePath, buildTraceDocument())` 完成，再继续共享工具 perfetto Tracing的异步流程。
    await writeFile(tracePath, buildTraceDocument())
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Periodic write: ${events.length} events to ${tracePath}`,
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Periodic write failed: ${errorMessage(error)}`,
      { level: 'error' },
    )
  }
}

/**
 * Final async write: close open spans and write the complete trace.
 * Idempotent — sets `traceWritten` on success so subsequent calls are no-ops.
 */
// writePerfettoTrace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writePerfettoTrace(): Promise<void> {
  // 只有 `!isEnabled || !tracePath || traceWritten` 满足时，共享工具才执行该分支。
  if (!isEnabled || !tracePath || traceWritten) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Skipping final write: isEnabled=${isEnabled}, tracePath=${tracePath}, traceWritten=${traceWritten}`,
    )
    // 共享工具 perfetto Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 stopWriteInterval，触发共享工具此处需要的副作用。
  stopWriteInterval()
  // 调用 closeOpenSpans，触发共享工具此处需要的副作用。
  closeOpenSpans()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Perfetto] writePerfettoTrace called: events=${events.length}`,
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dirname(tracePath), { recursive: true })` 完成，再继续共享工具 perfetto Tracing的异步流程。
    await mkdir(dirname(tracePath), { recursive: true })
    // 等待 `writeFile(tracePath, buildTraceDocument())` 完成，再继续共享工具 perfetto Tracing的异步流程。
    await writeFile(tracePath, buildTraceDocument())
    // traceWritten更新为 `true`，确保共享工具后续读取最新状态。
    traceWritten = true
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[Perfetto] Trace finalized at: ${tracePath}`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Failed to write final trace: ${errorMessage(error)}`,
      { level: 'error' },
    )
  }
}

/**
 * Final synchronous write (fallback for process 'exit' handler where async is forbidden).
 */
// writePerfettoTraceSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writePerfettoTraceSync(): void {
  // 只有 `!isEnabled || !tracePath || traceWritten` 满足时，共享工具才执行该分支。
  if (!isEnabled || !tracePath || traceWritten) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Skipping final sync write: isEnabled=${isEnabled}, tracePath=${tracePath}, traceWritten=${traceWritten}`,
    )
    // 共享工具 perfetto Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 stopWriteInterval，触发共享工具此处需要的副作用。
  stopWriteInterval()
  // 调用 closeOpenSpans，触发共享工具此处需要的副作用。
  closeOpenSpans()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Perfetto] writePerfettoTraceSync called: events=${events.length}`,
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dir保存`dirname`，供共享工具后续处理使用。
    const dir = dirname(tracePath)
    // eslint-disable-next-line custom-rules/no-sync-fs -- Only called from process.on('exit') handler
    // 调用 mkdirSync，触发共享工具此处需要的副作用。
    mkdirSync(dir, { recursive: true })
    // eslint-disable-next-line custom-rules/no-sync-fs, eslint-plugin-n/no-sync -- Required for process 'exit' handler which doesn't support async
    // 调用 writeFileSync，触发共享工具此处需要的副作用。
    writeFileSync(tracePath, buildTraceDocument())
    // traceWritten更新为 `true`，确保共享工具后续读取最新状态。
    traceWritten = true
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[Perfetto] Trace finalized synchronously at: ${tracePath}`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Perfetto] Failed to write final trace synchronously: ${errorMessage(error)}`,
      { level: 'error' },
    )
  }
}

/**
 * Get all recorded events (for testing)
 */
// getPerfettoEvents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPerfettoEvents(): TraceEvent[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...metadataEvents, ...events]
}

/**
 * Reset the tracer state (for testing)
 */
// resetPerfettoTracer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetPerfettoTracer(): void {
  // 满足 `staleSpanCleanupId` 时，共享工具执行该分支。
  if (staleSpanCleanupId) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(staleSpanCleanupId)
    // staleSpanCleanupId更新为 `null`，确保共享工具后续读取最新状态。
    staleSpanCleanupId = null
  }
  // 调用 stopWriteInterval，触发共享工具此处需要的副作用。
  stopWriteInterval()
  // metadataEvents 集合被清空，共享工具从干净状态继续。
  metadataEvents.length = 0
  // events 集合被清空，共享工具从干净状态继续。
  events.length = 0
  // 调用 pendingSpans.clear，触发共享工具此处需要的副作用。
  pendingSpans.clear()
  // 调用 agentRegistry.clear，触发共享工具此处需要的副作用。
  agentRegistry.clear()
  // 调用 agentIdToProcessId.clear，触发共享工具此处需要的副作用。
  agentIdToProcessId.clear()
  // totalAgentCount 数量更新为 `0`，确保共享工具后续读取最新状态。
  totalAgentCount = 0
  // processIdCounter 数量更新为 `1`，确保共享工具后续读取最新状态。
  processIdCounter = 1
  // spanIdCounter 数量更新为 `0`，确保共享工具后续读取最新状态。
  spanIdCounter = 0
  // isEnabled更新为 `false`，确保共享工具后续读取最新状态。
  isEnabled = false
  // tracePath 路径数据更新为 `null`，确保共享工具后续读取最新状态。
  tracePath = null
  // startTimeMs 集合更新为 `0`，确保共享工具后续读取最新状态。
  startTimeMs = 0
  // traceWritten更新为 `false`，确保共享工具后续读取最新状态。
  traceWritten = false
}

/**
 * Trigger a periodic write immediately (for testing)
 */
// triggerPeriodicWriteForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function triggerPeriodicWriteForTesting(): Promise<void> {
  // 等待 `periodicWrite()` 完成，再继续共享工具 perfetto Tracing的异步流程。
  await periodicWrite()
}

/**
 * Evict stale spans immediately (for testing)
 */
// evictStaleSpansForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function evictStaleSpansForTesting(): void {
  // 调用 evictStaleSpans，触发共享工具此处需要的副作用。
  evictStaleSpans()
}

// MAX_EVENTS_FOR_TESTING保存`MAX_EVENTS`，供共享工具 perfetto Tracing后续判断或输出使用。
export const MAX_EVENTS_FOR_TESTING = MAX_EVENTS
// evictOldestEventsForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function evictOldestEventsForTesting(): void {
  // 调用 evictOldestEvents，触发共享工具此处需要的副作用。
  evictOldestEvents()
}
