/**
 * Turn-scoped workload tag via AsyncLocalStorage.
 *
 * WHY a separate module from bootstrap/state.ts:
 * bootstrap is transitively imported by src/entrypoints/browser-sdk.ts, and
 * the browser bundle cannot import Node's async_hooks. This module is only
 * imported from CLI/SDK code paths that never end up in the browser build.
 *
 * WHY AsyncLocalStorage (not a global mutable slot):
 * void-detached background agents (executeForkedSlashCommand, AgentTool)
 * yield at their first await. The parent turn's synchronous continuation —
 * including any `finally` block — runs to completion BEFORE the detached
 * closure resumes. A global setWorkload('cron') at the top of the closure
 * is deterministically clobbered. ALS captures context at invocation time
 * and survives every await in that chain, isolated from the parent. Same
 * pattern as agentContext.ts.
 */

// 引入 AsyncLocalStorage，将 async_hooks 中已经封装好的能力接到本文件流程里。
import { AsyncLocalStorage } from 'async_hooks'

/**
 * Server-side sanitizer (_sanitize_entrypoint in claude_code.py) accepts
 * only lowercase [a-z0-9_-]{0,32}. Uppercase stops parsing at char 0.
 */
// Workload 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Workload = 'cron'
// WORKLOAD_CRON 命名 `'cron'`，让后续代码直接表达这个值的用途。
export const WORKLOAD_CRON: Workload = 'cron'

// workloadStorage 命名 `new AsyncLocalStorage<{`，让后续代码直接表达这个值的用途。
const workloadStorage = new AsyncLocalStorage<{
  workload: string | undefined
}>()

// getWorkload 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWorkload(): string | undefined {
  // 返回 `workloadStorage.getStore()?.workload`，作为共享工具这次计算的结果。
  return workloadStorage.getStore()?.workload
}

/**
 * Wrap `fn` in a workload ALS context. ALWAYS establishes a new context
 * boundary, even when `workload` is undefined.
 *
 * The previous implementation short-circuited on `undefined` with
 * `return fn()` — but that's a pass-through, not a boundary. If the caller
 * is already inside a leaked cron context (REPL: queryGuard.end() →
 * _notify() → React subscriber → scheduled re-render captures ALS at
 * scheduling time → useQueueProcessor effect → executeQueuedInput → here),
 * a pass-through lets `getWorkload()` inside `fn` return the leaked tag.
 * Once leaked, it's sticky forever: every turn's end-notify re-propagates
 * the ambient context to the next turn's scheduling chain.
 *
 * Always calling `.run()` guarantees `getWorkload()` inside `fn` returns
 * exactly what the caller passed — including `undefined`.
 */
// runWithWorkload 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function runWithWorkload<T>(
  workload: string | undefined,
  // 这个回调绑定到 fn: () => T,，负责共享工具在该局部场景下的响应。
  fn: () => T,
): T {
  // 返回 `workloadStorage.run({ workload }, fn)`，作为共享工具这次计算的结果。
  return workloadStorage.run({ workload }, fn)
}
