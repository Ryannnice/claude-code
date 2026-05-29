/**
 * Startup profiling utility for measuring and reporting time spent in various
 * initialization phases.
 *
 * Two modes:
 * 1. Sampled logging: 100% of ant users, 0.1% of external users - logs phases to Statsig
 * 2. Detailed profiling: CLAUDE_CODE_PROFILE_STARTUP=1 - full report with memory snapshots
 *
 * Uses Node.js built-in performance hooks API for standard timing measurement.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from 'src/bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 formatMs、formatTimelineLine、getPerformance，将 ./profilerBase.js 中已经封装好的能力接到本文件流程里。
import { formatMs, formatTimelineLine, getPerformance } from './profilerBase.js'
// 引入 writeFileSync_DEPRECATED，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { writeFileSync_DEPRECATED } from './slowOperations.js'

// Module-level state - decided once at module load
// eslint-disable-next-line custom-rules/no-process-env-top-level
// DETAILED_PROFILING保存`isEnvTruthy`，供共享工具后续处理使用。
const DETAILED_PROFILING = isEnvTruthy(process.env.CLAUDE_CODE_PROFILE_STARTUP)

// Sampling for Statsig logging: 100% ant, 0.5% external
// Decision made once at startup - non-sampled users pay no profiling cost
// STATSIG_SAMPLE_RATE保存`0.005`，供共享工具 startup Profiler后续判断或输出使用。
const STATSIG_SAMPLE_RATE = 0.005
// eslint-disable-next-line custom-rules/no-process-env-top-level
// STATSIG_LOGGING_SAMPLED 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const STATSIG_LOGGING_SAMPLED =
  process.env.USER_TYPE === 'ant' || Math.random() < STATSIG_SAMPLE_RATE

// Enable profiling if either detailed mode OR sampled for Statsig
// SHOULD_PROFILE 文件数据标记共享工具 startup Profiler是否启用对应路径。
const SHOULD_PROFILE = DETAILED_PROFILING || STATSIG_LOGGING_SAMPLED

// Track memory snapshots separately (perf_hooks doesn't track memory).
// Only used when DETAILED_PROFILING is enabled.
// Stored as an array that appends in the same order as perf.mark() calls, so
// memorySnapshots[i] corresponds to getEntriesByType('mark')[i]. Using a Map
// keyed by checkpoint name is wrong because some checkpoints fire more than
// once (e.g. loadSettingsFromDisk_start fires during init and again after
// plugins reset the settings cache), and the second call would overwrite the
// first's memory snapshot.
// memorySnapshots 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const memorySnapshots: NodeJS.MemoryUsage[] = []

// Phase definitions for Statsig logging: [startCheckpoint, endCheckpoint]
// PHASE_DEFINITIONS 集合集中保存共享工具 startup Profiler要一起传递的字段。
const PHASE_DEFINITIONS = {
  import_time: ['cli_entry', 'main_tsx_imports_loaded'],
  init_time: ['init_function_start', 'init_function_end'],
  settings_time: ['eagerLoadSettings_start', 'eagerLoadSettings_end'],
  total_time: ['cli_entry', 'main_after_run'],
} as const

// Record initial checkpoint if profiling is enabled
// 满足 `SHOULD_PROFILE` 时，共享工具执行该分支。
if (SHOULD_PROFILE) {
  // eslint-disable-next-line custom-rules/no-top-level-side-effects
  // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
  profileCheckpoint('profiler_initialized')
}

/**
 * Record a checkpoint with the given name
 */
// profileCheckpoint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function profileCheckpoint(name: string): void {
  // SHOULD_PROFILE 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!SHOULD_PROFILE) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // 调用 perf.mark，触发共享工具此处需要的副作用。
  perf.mark(name)

  // Only capture memory when detailed profiling enabled (env var)
  // 满足 `DETAILED_PROFILING` 时，共享工具执行该分支。
  if (DETAILED_PROFILING) {
    // memorySnapshots 集合追加新条目，保持收集顺序与输入顺序一致。
    memorySnapshots.push(process.memoryUsage())
  }
}

/**
 * Get a formatted report of all checkpoints
 * Only available when DETAILED_PROFILING is enabled
 */
// getReport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getReport(): string {
  // DETAILED_PROFILING缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!DETAILED_PROFILING) {
    // 返回 `'Startup profiling not enabled'`，作为共享工具这次计算的结果。
    return 'Startup profiling not enabled'
  }

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // marks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
  const marks = perf.getEntriesByType('mark')
  // marks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (marks.length === 0) {
    // 返回 `'No profiling checkpoints recorded'`，作为共享工具这次计算的结果。
    return 'No profiling checkpoints recorded'
  }

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('STARTUP PROFILING REPORT')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')

  // prevTime保存`0`，供共享工具 startup Profiler后续判断或输出使用。
  let prevTime = 0
  // 循环处理 `const [i, mark] of marks.entries()`，让共享工具把同类条目按顺序走完。
  for (const [i, mark] of marks.entries()) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      formatTimelineLine(
        mark.startTime,
        mark.startTime - prevTime,
        mark.name,
        memorySnapshots[i],
        8,
        7,
      ),
    )
    // prevTime更新为 `mark.startTime`，确保共享工具后续读取最新状态。
    prevTime = mark.startTime
  }

  // lastMark 命名 `marks[marks.length - 1]`，让后续代码直接表达这个值的用途。
  const lastMark = marks[marks.length - 1]
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`Total startup time: ${formatMs(lastMark?.startTime ?? 0)}ms`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('='.repeat(80))

  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}

// reported标记共享工具 startup Profiler是否启用对应路径。
let reported = false

// profileReport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function profileReport(): void {
  // 满足 `reported` 时，共享工具执行该分支。
  if (reported) return
  // reported更新为 `true`，确保共享工具后续读取最新状态。
  reported = true

  // Log to Statsig (sampled: 100% ant, 0.1% external)
  // 调用 logStartupPerf，触发共享工具此处需要的副作用。
  logStartupPerf()

  // Output detailed report if CLAUDE_CODE_PROFILE_STARTUP=1
  // 满足 `DETAILED_PROFILING` 时，共享工具执行该分支。
  if (DETAILED_PROFILING) {
    // Write to file
    // 路径读取`getStartupPerfLogPath`，供共享工具后续处理使用。
    const path = getStartupPerfLogPath()
    // dir保存`dirname`，供共享工具后续处理使用。
    const dir = dirname(path)
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
    fs.mkdirSync(dir)
    // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
    writeFileSync_DEPRECATED(path, getReport(), {
      encoding: 'utf8',
      flush: true,
    })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Startup profiling report:')
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(getReport())
  }
}

// isDetailedProfilingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDetailedProfilingEnabled(): boolean {
  // 返回 `DETAILED_PROFILING`，作为共享工具这次计算的结果。
  return DETAILED_PROFILING
}

// getStartupPerfLogPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStartupPerfLogPath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'startup-perf', `${getSessionId()}.txt`)`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'startup-perf', `${getSessionId()}.txt`)
}

/**
 * Log startup performance phases to Statsig.
 * Only logs if this session was sampled at startup.
 */
// logStartupPerf 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logStartupPerf(): void {
  // Only log if we were sampled (decision made at module load)
  // STATSIG_LOGGING_SAMPLED缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!STATSIG_LOGGING_SAMPLED) return

  // perf读取`getPerformance`，供共享工具后续处理使用。
  const perf = getPerformance()
  // marks 集合读取`perf.getEntriesByType`，供共享工具后续处理使用。
  const marks = perf.getEntriesByType('mark')
  // marks 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (marks.length === 0) return

  // Build checkpoint lookup
  // checkpointTimes 集合构建`new Map<string, number>()`，供后续判断或组装使用。
  const checkpointTimes = new Map<string, number>()
  // 按顺序遍历 `marks` 中的mark，逐个交给共享工具处理。
  for (const mark of marks) {
    // checkpointTimes.set 写入新的状态值，使共享工具后续读取保持一致。
    checkpointTimes.set(mark.name, mark.startTime)
  }

  // Compute phase durations
  // metadata 从空对象开始收集键值，后续按名称补齐内容。
  const metadata: Record<string, number | undefined> = {}

  // 调用 for，触发共享工具此处需要的副作用。
  for (const [phaseName, [startCheckpoint, endCheckpoint]] of Object.entries(
    PHASE_DEFINITIONS,
  )) {
    // startTime读取`checkpointTimes.get`，供共享工具后续处理使用。
    const startTime = checkpointTimes.get(startCheckpoint)
    // endTime读取`checkpointTimes.get`，供共享工具后续处理使用。
    const endTime = checkpointTimes.get(endCheckpoint)

    // `startTime` 与 `undefined && endTime !== undefi...` 不一致时刷新派生状态，避免使用过期结果。
    if (startTime !== undefined && endTime !== undefined) {
      // metadata[`${phaseName}_ms`更新为 `Math.round(endTime - startTime)`，确保共享工具 startup Profiler后续读取最新状态。
      metadata[`${phaseName}_ms`] = Math.round(endTime - startTime)
    }
  }

  // Add checkpoint count for debugging
  // checkpoint_count 数量更新为 `marks.length`，确保共享工具后续读取最新状态。
  metadata.checkpoint_count = marks.length

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent(
    'tengu_startup_perf',
    metadata as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  )
}
