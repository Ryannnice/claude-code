/**
 * Query profiling utility for measuring and reporting time spent in the query
 * pipeline from user input to first token arrival. Enable by setting CLAUDE_CODE_PROFILE_QUERY=1
 *
 * Uses Node.js built-in performance hooks API for standard timing measurement.
 * Tracks each query session with detailed checkpoints for identifying bottlenecks.
 *
 * Checkpoints tracked (in order):
 * - query_user_input_received: Start of profiling
 * - query_context_loading_start/end: Loading system prompts and contexts
 * - query_query_start: Entry to query call from REPL
 * - query_fn_entry: Entry to query() function
 * - query_microcompact_start/end: Microcompaction of messages
 * - query_autocompact_start/end: Autocompaction check
 * - query_setup_start/end: StreamingToolExecutor and model setup
 * - query_api_loop_start: Start of API retry loop
 * - query_api_streaming_start: Start of streaming API call
 * - query_tool_schema_build_start/end: Building tool schemas
 * - query_message_normalization_start/end: Normalizing messages
 * - query_client_creation_start/end: Creating Anthropic client
 * - query_api_request_sent: HTTP request dispatched (before await, inside retry body)
 * - query_response_headers_received: .withResponse() resolved (headers arrived)
 * - query_first_chunk_received: First streaming chunk received (TTFT)
 * - query_api_streaming_end: Streaming complete
 * - query_tool_execution_start/end: Tool execution
 * - query_recursive_call: Before recursive query call
 * - query_end: End of query
 */

// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 formatMs、formatTimelineLine、getPerformance，将 ./profilerBase.js 中已经封装好的能力接到本文件流程里。
import { formatMs, formatTimelineLine, getPerformance } from './profilerBase.js'

// Module-level state - initialized once when the module loads
// eslint-disable-next-line custom-rules/no-process-env-top-level
// ENABLED保存`isEnvTruthy`，供共享工具后续处理使用。
const ENABLED = isEnvTruthy(process.env.CLAUDE_CODE_PROFILE_QUERY)

// Track memory snapshots separately (perf_hooks doesn't track memory)
// memorySnapshots 集合构建`new Map<string, NodeJS.MemoryUsage>()` 整理出中间结果，供共享工具 query Profiler后续步骤使用。
const memorySnapshots = new Map<string, NodeJS.MemoryUsage>()

// Track query count for reporting
// queryCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
let queryCount = 0

// Track first token received time separately for summary
// firstTokenTime保存`null`，作为后续空值处理的输入。
let firstTokenTime: number | null = null

/**
 * Start profiling a new query session
 */
// startQueryProfile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startQueryProfile(): void {
  // ENABLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ENABLED) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()

  // Clear previous marks and memory snapshots
  // 调用 perf.clearMarks，触发共享工具此处需要的副作用。
  perf.clearMarks()
  // 调用 memorySnapshots.clear，触发共享工具此处需要的副作用。
  memorySnapshots.clear()
  // firstTokenTime更新为 `null`，确保共享工具后续读取最新状态。
  firstTokenTime = null

  // 共享工具 query Profiler在这里处理 `queryCount++`，完成这一小步状态转换。
  queryCount++

  // Record the start checkpoint
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_user_input_received')
}

/**
 * Record a checkpoint with the given name
 */
// queryCheckpoint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function queryCheckpoint(name: string): void {
  // ENABLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ENABLED) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // 调用 perf.mark，触发共享工具此处需要的副作用。
  perf.mark(name)
  // memorySnapshots.set 写入新的状态值，使共享工具后续读取保持一致。
  memorySnapshots.set(name, process.memoryUsage())

  // Track first token specially
  // 只有 `name === 'query_first_chunk_received' && firstTok` 满足时，共享工具才执行该分支。
  if (name === 'query_first_chunk_received' && firstTokenTime === null) {
    // marks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
    const marks = perf.getEntriesByType('mark')
    // 满足 `marks.length > 0` 时，共享工具执行该分支。
    if (marks.length > 0) {
      // lastMark 命名 `marks[marks.length - 1]`，让后续代码直接表达这个值的用途。
      const lastMark = marks[marks.length - 1]
      // firstTokenTime更新为 `lastMark?.startTime ?? 0`，确保共享工具后续读取最新状态。
      firstTokenTime = lastMark?.startTime ?? 0
    }
  }
}

/**
 * End the current query profiling session
 */
// endQueryProfile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function endQueryProfile(): void {
  // ENABLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ENABLED) return

  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_profile_end')
}

/**
 * Identify slow operations (> 100ms delta)
 */
// getSlowWarning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSlowWarning(deltaMs: number, name: string): string {
  // Don't flag the first checkpoint as slow - it measures time from process start,
  // not actual processing overhead
  // 当 `name` 匹配 `'query_user_input_received'` 时，共享工具执行对应分支。
  if (name === 'query_user_input_received') {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 满足 `deltaMs > 1000` 时，共享工具执行该分支。
  if (deltaMs > 1000) {
    // 返回 `` ⚠️ VERY SLOW``，作为共享工具这次计算的结果。
    return ` ⚠️  VERY SLOW`
  }
  // 满足 `deltaMs > 100` 时，共享工具执行该分支。
  if (deltaMs > 100) {
    // 返回 `` ⚠️ SLOW``，作为共享工具这次计算的结果。
    return ` ⚠️  SLOW`
  }

  // Specific warnings for known bottlenecks
  // 只有 `name.includes('git_status') && deltaMs > 50` 满足时，共享工具才执行该分支。
  if (name.includes('git_status') && deltaMs > 50) {
    // 返回 `' ⚠️ git status'`，作为共享工具这次计算的结果。
    return ' ⚠️  git status'
  }
  // 只有 `name.includes('tool_schema') && deltaMs > 50` 满足时，共享工具才执行该分支。
  if (name.includes('tool_schema') && deltaMs > 50) {
    // 返回 `' ⚠️ tool schemas'`，作为共享工具这次计算的结果。
    return ' ⚠️  tool schemas'
  }
  // 只有 `name.includes('client_creation') && deltaMs > 50` 满足时，共享工具才执行该分支。
  if (name.includes('client_creation') && deltaMs > 50) {
    // 返回 `' ⚠️ client creation'`，作为共享工具这次计算的结果。
    return ' ⚠️  client creation'
  }

  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Get a formatted report of all checkpoints for the current/last query
 */
// getQueryProfileReport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getQueryProfileReport(): string {
  // ENABLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ENABLED) {
    // 返回 `'Query profiling not enabled (set CLAUDE_CODE_PROFILE_QUERY=1)'`，作为共享工具这次计算的结果。
    return 'Query profiling not enabled (set CLAUDE_CODE_PROFILE_QUERY=1)'
  }

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // marks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
  const marks = perf.getEntriesByType('mark')
  // marks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (marks.length === 0) {
    // 返回 `'No query profiling checkpoints recorded'`，作为共享工具这次计算的结果。
    return 'No query profiling checkpoints recorded'
  }

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`QUERY PROFILING REPORT - Query #${queryCount}`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')

  // Use first mark as baseline (query start time) to show relative times
  // baselineTime 命名 `marks[0]?.startTime ?? 0`，让后续代码直接表达这个值的用途。
  const baselineTime = marks[0]?.startTime ?? 0
  // prevTime保存`baselineTime`，供共享工具 query Profiler后续判断或输出使用。
  let prevTime = baselineTime
  // apiRequestSentTime 请求数据保存`0`，供后续判断或组装使用。
  let apiRequestSentTime = 0
  // firstChunkTime保存`0`，供共享工具 query Profiler后续判断或输出使用。
  let firstChunkTime = 0

  // 按顺序遍历 `marks` 中的mark，逐个交给共享工具处理。
  for (const mark of marks) {
    // relativeTime 命名 `mark.startTime - baselineTime`，让后续代码直接表达这个值的用途。
    const relativeTime = mark.startTime - baselineTime
    // deltaMs 集合保存`mark.startTime - prevTime`，供后续判断或组装使用。
    const deltaMs = mark.startTime - prevTime
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      formatTimelineLine(
        relativeTime,
        deltaMs,
        mark.name,
        memorySnapshots.get(mark.name),
        10,
        9,
        getSlowWarning(deltaMs, mark.name),
      ),
    )

    // Track key milestones for summary (use relative times)
    // 当 `mark.name` 匹配 `'query_api_request_sent'` 时，共享工具执行对应分支。
    if (mark.name === 'query_api_request_sent') {
      // apiRequestSentTime 请求数据更新为 `relativeTime`，确保共享工具后续读取最新状态。
      apiRequestSentTime = relativeTime
    }
    // 当 `mark.name` 匹配 `'query_first_chunk_received'` 时，共享工具执行对应分支。
    if (mark.name === 'query_first_chunk_received') {
      // firstChunkTime更新为 `relativeTime`，确保共享工具后续读取最新状态。
      firstChunkTime = relativeTime
    }

    // prevTime更新为 `mark.startTime`，确保共享工具后续读取最新状态。
    prevTime = mark.startTime
  }

  // Calculate summary statistics (relative to baseline)
  // lastMark 命名 `marks[marks.length - 1]`，让后续代码直接表达这个值的用途。
  const lastMark = marks[marks.length - 1]
  // totalTime保存`lastMark ? lastMark.startTime - baselineTime : 0`，供共享工具 query Profiler后续判断或输出使用。
  const totalTime = lastMark ? lastMark.startTime - baselineTime : 0

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('-'.repeat(80))

  // 满足 `firstChunkTime > 0` 时，共享工具执行该分支。
  if (firstChunkTime > 0) {
    // preRequestOverhead 请求数据 命名 `apiRequestSentTime`，让后续代码直接表达这个值的用途。
    const preRequestOverhead = apiRequestSentTime
    // networkLatency保存`firstChunkTime - apiRequestSentTime`，供后续判断或组装使用。
    const networkLatency = firstChunkTime - apiRequestSentTime
    // preRequestPercent 请求数据保存`(`，供后续判断或组装使用。
    const preRequestPercent = (
      (preRequestOverhead / firstChunkTime) *
      100
    ).toFixed(1)
    // networkPercent保存`toFixed`，供共享工具后续处理使用。
    const networkPercent = ((networkLatency / firstChunkTime) * 100).toFixed(1)

    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`Total TTFT: ${formatMs(firstChunkTime)}ms`)
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `  - Pre-request overhead: ${formatMs(preRequestOverhead)}ms (${preRequestPercent}%)`,
    )
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `  - Network latency: ${formatMs(networkLatency)}ms (${networkPercent}%)`,
    )
  } else {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`Total time: ${formatMs(totalTime)}ms`)
  }

  // Add phase summary
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(getPhaseSummary(marks, baselineTime))

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))

  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}

/**
 * Get phase-based summary showing time spent in each major phase
 */
// getPhaseSummary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPhaseSummary(
  marks: Array<{ name: string; startTime: number }>,
  baselineTime: number,
): string {
  // phases 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const phases: Array<{ name: string; start: string; end: string }> = [
    {
      name: 'Context loading',
      start: 'query_context_loading_start',
      end: 'query_context_loading_end',
    },
    {
      name: 'Microcompact',
      start: 'query_microcompact_start',
      end: 'query_microcompact_end',
    },
    {
      name: 'Autocompact',
      start: 'query_autocompact_start',
      end: 'query_autocompact_end',
    },
    { name: 'Query setup', start: 'query_setup_start', end: 'query_setup_end' },
    {
      name: 'Tool schemas',
      start: 'query_tool_schema_build_start',
      end: 'query_tool_schema_build_end',
    },
    {
      name: 'Message normalization',
      start: 'query_message_normalization_start',
      end: 'query_message_normalization_end',
    },
    {
      name: 'Client creation',
      start: 'query_client_creation_start',
      end: 'query_client_creation_end',
    },
    {
      name: 'Network TTFB',
      start: 'query_api_request_sent',
      end: 'query_first_chunk_received',
    },
    {
      name: 'Tool execution',
      start: 'query_tool_execution_start',
      end: 'query_tool_execution_end',
    },
  ]

  // markMap保存`Map`，供共享工具后续处理使用。
  const markMap = new Map(marks.map(m => [m.name, m.startTime - baselineTime]))

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('PHASE BREAKDOWN:')

  // 按顺序遍历 `phases` 中的phase，逐个交给共享工具处理。
  for (const phase of phases) {
    // startTime读取`markMap.get`，供共享工具后续处理使用。
    const startTime = markMap.get(phase.start)
    // endTime读取`markMap.get`，供共享工具后续处理使用。
    const endTime = markMap.get(phase.end)

    // `startTime` 与 `undefined && endTime !== undefi...` 不一致时刷新派生状态，避免使用过期结果。
    if (startTime !== undefined && endTime !== undefined) {
      // duration保存`endTime - startTime`，供共享工具 query Profiler后续判断或输出使用。
      const duration = endTime - startTime
      // bar保存`repeat`，供共享工具后续处理使用。
      const bar = '█'.repeat(Math.min(Math.ceil(duration / 10), 50)) // 1 block per 10ms, max 50
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(
        `  ${phase.name.padEnd(22)} ${formatMs(duration).padStart(10)}ms ${bar}`,
      )
    }
  }

  // Calculate pre-API overhead (everything before api_request_sent)
  // apiRequestSent 请求数据读取`markMap.get`，供共享工具后续处理使用。
  const apiRequestSent = markMap.get('query_api_request_sent')
  // `apiRequestSent` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (apiRequestSent !== undefined) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push('')
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `  ${'Total pre-API overhead'.padEnd(22)} ${formatMs(apiRequestSent).padStart(10)}ms`,
    )
  }

  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}

/**
 * Log the query profile report to debug output
 */
// logQueryProfileReport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logQueryProfileReport(): void {
  // ENABLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ENABLED) return
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(getQueryProfileReport())
}
