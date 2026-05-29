/**
 * Global registry for cleanup functions that should run during graceful shutdown.
 * This module is separate from gracefulShutdown.ts to avoid circular dependencies.
 */

// Global registry for cleanup functions
// cleanupFunctions 集合封装成回调，供共享工具 cleanup Registry在事件触发或异步步骤中调用。
const cleanupFunctions = new Set<() => Promise<void>>()

/**
 * Register a cleanup function to run during graceful shutdown.
 * @param cleanupFn - Function to run during cleanup (can be sync or async)
 * @returns Unregister function that removes the cleanup handler
 */
// registerCleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerCleanup(cleanupFn: () => Promise<void>): () => void {
  // 调用 cleanupFunctions.add，触发共享工具此处需要的副作用。
  cleanupFunctions.add(cleanupFn)
  // 返回 `() => cleanupFunctions.delete(cleanupFn) // Return unregister function`，作为共享工具这次计算的结果。
  return () => cleanupFunctions.delete(cleanupFn) // Return unregister function
}

/**
 * Run all registered cleanup functions.
 * Used internally by gracefulShutdown.
 */
// runCleanupFunctions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runCleanupFunctions(): Promise<void> {
  // 这个回调绑定到 await Promise.all(Array.from(cleanupFunctions).map(fn => fn()))，负责共享工具在该局部场景下的响应。
  await Promise.all(Array.from(cleanupFunctions).map(fn => fn()))
}
