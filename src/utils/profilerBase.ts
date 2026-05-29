/**
 * Shared infrastructure for profiler modules (startupProfiler, queryProfiler,
 * headlessProfiler). All three use the same perf_hooks timeline and the same
 * line format for detailed reports.
 */

// 类型依赖 { performance as PerformanceType } 来自 perf_hooks，用于校准共享工具的数据契约。
import type { performance as PerformanceType } from 'perf_hooks'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'

// Lazy-load performance API only when profiling is enabled.
// Shared across all profilers — perf_hooks.performance is a process-wide singleton.
// performance 命名 `null`，让后续代码直接表达这个值的用途。
let performance: typeof PerformanceType | null = null

// getPerformance 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPerformance(): typeof PerformanceType {
  // performance缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!performance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // performance更新为 `require('perf_hooks').performance`，确保共享工具后续读取最新状态。
    performance = require('perf_hooks').performance
  }
  // 返回 `performance!`，作为共享工具这次计算的结果。
  return performance!
}

// formatMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatMs(ms: number): string {
  // 返回 `ms.toFixed(3)`，作为共享工具这次计算的结果。
  return ms.toFixed(3)
}

/**
 * Render a single timeline line in the shared profiler report format:
 *   [+  total.ms] (+  delta.ms) name [extra] [| RSS: .., Heap: ..]
 *
 * totalPad/deltaPad control the padStart width so callers can align columns
 * based on their expected magnitude (startup uses 8/7, query uses 10/9).
 */
// formatTimelineLine 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTimelineLine(
  totalMs: number,
  deltaMs: number,
  name: string,
  memory: NodeJS.MemoryUsage | undefined,
  totalPad: number,
  deltaPad: number,
  extra = '',
): string {
  // memInfo保存`memory`，供后续判断或组装使用。
  const memInfo = memory
    ? ` | RSS: ${formatFileSize(memory.rss)}, Heap: ${formatFileSize(memory.heapUsed)}`
    : ''
  // 返回 ``[+${formatMs(totalMs).padStart(totalPad)}ms] (+${formatMs(deltaMs).pad...`，作为共享工具这次计算的结果。
  return `[+${formatMs(totalMs).padStart(totalPad)}ms] (+${formatMs(deltaMs).padStart(deltaPad)}ms) ${name}${extra}${memInfo}`
}
