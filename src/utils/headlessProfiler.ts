/**
 * Headless mode profiling utility for measuring per-turn latency in -p (print) mode.
 *
 * Tracks key timing phases per turn:
 * - Time to system message output (turn 0 only)
 * - Time to first query started
 * - Time to first API response (TTFT)
 *
 * Uses Node.js built-in performance hooks API for standard timing measurement.
 * Sampled logging: 100% of ant users, 5% of external users.
 *
 * Set CLAUDE_CODE_PROFILE_STARTUP=1 for detailed logging output.
 */

// 引入 getIsNonInteractiveSession，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getPerformance，将 ./profilerBase.js 中已经封装好的能力接到本文件流程里。
import { getPerformance } from './profilerBase.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// Detailed profiling mode - same env var as startupProfiler
// eslint-disable-next-line custom-rules/no-process-env-top-level
// DETAILED_PROFILING保存`isEnvTruthy`，供共享工具后续处理使用。
const DETAILED_PROFILING = isEnvTruthy(process.env.CLAUDE_CODE_PROFILE_STARTUP)

// Sampling for Statsig logging: 100% ant, 5% external
// Decision made once at module load - non-sampled users pay no profiling cost
// STATSIG_SAMPLE_RATE保存`0.05`，供共享工具 headless Profiler后续判断或输出使用。
const STATSIG_SAMPLE_RATE = 0.05
// eslint-disable-next-line custom-rules/no-process-env-top-level
// STATSIG_LOGGING_SAMPLED 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const STATSIG_LOGGING_SAMPLED =
  process.env.USER_TYPE === 'ant' || Math.random() < STATSIG_SAMPLE_RATE

// Enable profiling if either detailed mode OR sampled for Statsig
// SHOULD_PROFILE 文件数据标记共享工具 headless Profiler是否启用对应路径。
const SHOULD_PROFILE = DETAILED_PROFILING || STATSIG_LOGGING_SAMPLED

// Use a unique prefix to avoid conflicts with other profiler marks
// MARK_PREFIX保存`'headless_'`，作为后续固定文本处理的输入。
const MARK_PREFIX = 'headless_'

// Track current turn number (auto-incremented by headlessProfilerStartTurn)
// currentTurnNumber 命名 `-1`，让后续代码直接表达这个值的用途。
let currentTurnNumber = -1

/**
 * Clear all headless profiler marks from performance timeline
 */
// clearHeadlessMarks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function clearHeadlessMarks(): void {
  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // allMarks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
  const allMarks = perf.getEntriesByType('mark')
  // 按顺序遍历 `allMarks` 中的mark，逐个交给共享工具处理。
  for (const mark of allMarks) {
    // 满足 `mark.name.startsWith(MARK_PREFIX)` 时，共享工具执行该分支。
    if (mark.name.startsWith(MARK_PREFIX)) {
      // 调用 perf.clearMarks，触发共享工具此处需要的副作用。
      perf.clearMarks(mark.name)
    }
  }
}

/**
 * Start a new turn for profiling. Clears previous marks, increments turn number,
 * and records turn_start. Call this at the beginning of each user message processing.
 */
// headlessProfilerStartTurn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function headlessProfilerStartTurn(): void {
  // Only profile in headless/non-interactive mode
  // 满足 `!getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (!getIsNonInteractiveSession()) return
  // Only profile if enabled
  // SHOULD_PROFILE 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!SHOULD_PROFILE) return

  // 共享工具 headless Profiler在这里处理 `currentTurnNumber++`，完成这一小步状态转换。
  currentTurnNumber++
  // 调用 clearHeadlessMarks，触发共享工具此处需要的副作用。
  clearHeadlessMarks()

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // 调用 perf.mark，触发共享工具此处需要的副作用。
  perf.mark(`${MARK_PREFIX}turn_start`)

  // 满足 `DETAILED_PROFILING` 时，共享工具执行该分支。
  if (DETAILED_PROFILING) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[headlessProfiler] Started turn ${currentTurnNumber}`)
  }
}

/**
 * Record a checkpoint with the given name.
 * Only records if in headless mode and profiling is enabled.
 */
// headlessProfilerCheckpoint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function headlessProfilerCheckpoint(name: string): void {
  // Only profile in headless/non-interactive mode
  // 满足 `!getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (!getIsNonInteractiveSession()) return
  // Only profile if enabled
  // SHOULD_PROFILE 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!SHOULD_PROFILE) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // 调用 perf.mark，触发共享工具此处需要的副作用。
  perf.mark(`${MARK_PREFIX}${name}`)

  // 满足 `DETAILED_PROFILING` 时，共享工具执行该分支。
  if (DETAILED_PROFILING) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[headlessProfiler] Checkpoint: ${name} at ${perf.now().toFixed(1)}ms`,
    )
  }
}

/**
 * Log headless latency metrics for the current turn to Statsig.
 * Call this at the end of each turn (before processing next user message).
 */
// logHeadlessProfilerTurn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logHeadlessProfilerTurn(): void {
  // Only log in headless mode
  // 满足 `!getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (!getIsNonInteractiveSession()) return
  // Only log if enabled
  // SHOULD_PROFILE 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!SHOULD_PROFILE) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // allMarks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
  const allMarks = perf.getEntriesByType('mark')

  // Filter to only our headless marks
  // marks 集合筛选`allMarks.filter`，供共享工具后续处理使用。
  const marks = allMarks.filter(mark => mark.name.startsWith(MARK_PREFIX))
  // marks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (marks.length === 0) return

  // Build checkpoint lookup (strip prefix for easier access)
  // checkpointTimes 集合 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
  const checkpointTimes = new Map<string, number>()
  // 按顺序遍历 `marks` 中的mark，逐个交给共享工具处理。
  for (const mark of marks) {
    // 名称格式化`name.slice`，供共享工具后续处理使用。
    const name = mark.name.slice(MARK_PREFIX.length)
    // checkpointTimes.set 写入新的状态值，使共享工具后续读取保持一致。
    checkpointTimes.set(name, mark.startTime)
  }

  // turnStart读取`checkpointTimes.get`，供共享工具后续处理使用。
  const turnStart = checkpointTimes.get('turn_start')
  // 满足 `turnStart === undefined` 时，共享工具执行该分支。
  if (turnStart === undefined) return

  // Compute phase durations relative to turn_start
  // metadata 集中保存共享工具 headless Profiler要一起传递的字段。
  const metadata: Record<string, number | string | undefined> = {
    turn_number: currentTurnNumber,
  }

  // Time to system message from process start (only meaningful for turn 0)
  // Use absolute time since perf_hooks startTime is relative to process start
  // systemMessageTime 消息数据读取`checkpointTimes.get`，供共享工具后续处理使用。
  const systemMessageTime = checkpointTimes.get('system_message_yielded')
  // `systemMessageTime` 与 `undefined && currentTurnNum` 不一致时刷新派生状态，避免使用过期结果。
  if (systemMessageTime !== undefined && currentTurnNumber === 0) {
    // time_to_system_message_ms 消息数据更新为 `Math.round(systemMessageTime)`，确保共享工具后续读取最新状态。
    metadata.time_to_system_message_ms = Math.round(systemMessageTime)
  }

  // Time to query start
  // queryStartTime读取`checkpointTimes.get`，供共享工具后续处理使用。
  const queryStartTime = checkpointTimes.get('query_started')
  // `queryStartTime` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (queryStartTime !== undefined) {
    // time_to_query_start_ms 集合更新为 `Math.round(queryStartTime - turnStart)`，确保共享工具后续读取最新状态。
    metadata.time_to_query_start_ms = Math.round(queryStartTime - turnStart)
  }

  // Time to first response (first chunk from API)
  // firstChunkTime读取`checkpointTimes.get`，供共享工具后续处理使用。
  const firstChunkTime = checkpointTimes.get('first_chunk')
  // `firstChunkTime` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (firstChunkTime !== undefined) {
    // time_to_first_response_ms 响应数据更新为 `Math.round(firstChunkTime - turnStart)`，确保共享工具后续读取最新状态。
    metadata.time_to_first_response_ms = Math.round(firstChunkTime - turnStart)
  }

  // Query overhead (time between query start and API request sent)
  // apiRequestTime 请求数据读取`checkpointTimes.get`，供共享工具后续处理使用。
  const apiRequestTime = checkpointTimes.get('api_request_sent')
  // `queryStartTime` 与 `undefined && apiRequestTime !=` 不一致时刷新派生状态，避免使用过期结果。
  if (queryStartTime !== undefined && apiRequestTime !== undefined) {
    // query_overhead_ms 集合更新为 `Math.round(apiRequestTime - queryStartTime)`，确保共享工具后续读取最新状态。
    metadata.query_overhead_ms = Math.round(apiRequestTime - queryStartTime)
  }

  // Add checkpoint count for debugging
  // checkpoint_count 数量更新为 `marks.length`，确保共享工具后续读取最新状态。
  metadata.checkpoint_count = marks.length

  // Add entrypoint for segmentation (sdk-ts, sdk-py, sdk-cli, or undefined)
  // 满足 `process.env.CLAUDE_CODE_ENTRYPOINT` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_ENTRYPOINT) {
    // entrypoint更新为 `process.env.CLAUDE_CODE_ENTRYPOINT`，确保共享工具后续读取最新状态。
    metadata.entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT
  }

  // Log to Statsig if sampled
  // 满足 `STATSIG_LOGGING_SAMPLED` 时，共享工具执行该分支。
  if (STATSIG_LOGGING_SAMPLED) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(
      'tengu_headless_latency',
      metadata as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    )
  }

  // Log detailed output if CLAUDE_CODE_PROFILE_STARTUP=1
  // 满足 `DETAILED_PROFILING` 时，共享工具执行该分支。
  if (DETAILED_PROFILING) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[headlessProfiler] Turn ${currentTurnNumber} metrics: ${jsonStringify(metadata)}`,
    )
  }
}
