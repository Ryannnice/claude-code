// 接入 initializeAnalyticsSink 服务层能力，把外部通信或共享状态交给 ../services/analytics/sink.js 处理。
import { initializeAnalyticsSink } from '../services/analytics/sink.js'
// 引入 initializeErrorLogSink，将 ./errorLogSink.js 中已经封装好的能力接到本文件流程里。
import { initializeErrorLogSink } from './errorLogSink.js'

/**
 * Attach error log and analytics sinks, draining any events queued before
 * attachment. Both inits are idempotent. Called from setup() for the default
 * command; other entrypoints (subcommands, daemon, bridge) call this directly
 * since they bypass setup().
 *
 * Leaf module — kept out of setup.ts to avoid the setup → commands → bridge
 * → setup import cycle.
 */
// initSinks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initSinks(): void {
  // 调用 initializeErrorLogSink，触发共享工具此处需要的副作用。
  initializeErrorLogSink()
  // 调用 initializeAnalyticsSink，触发共享工具此处需要的副作用。
  initializeAnalyticsSink()
}
