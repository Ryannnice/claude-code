// ModifierKey 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModifierKey = 'shift' | 'command' | 'control' | 'option'

// prewarmed标记共享工具 modifiers是否启用对应路径。
let prewarmed = false

/**
 * Pre-warm the native module by loading it in advance.
 * Call this early to avoid delay on first use.
 */
// prewarmModifiers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prewarmModifiers(): void {
  // `prewarmed || process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (prewarmed || process.platform !== 'darwin') {
    // 共享工具 modifiers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // prewarmed更新为 `true`，确保共享工具后续读取最新状态。
  prewarmed = true
  // Load module in background
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // 这个回调绑定到 const { prewarm } = require('modifiers-napi') as { prewarm: () => void }，负责共享工具在该局部场景下的响应。
    const { prewarm } = require('modifiers-napi') as { prewarm: () => void }
    // 调用 prewarm，触发共享工具此处需要的副作用。
    prewarm()
  } catch {
    // Ignore errors during prewarm
  }
}

/**
 * Check if a specific modifier key is currently pressed (synchronous).
 */
// isModifierPressed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isModifierPressed(modifier: ModifierKey): boolean {
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Dynamic import to avoid loading native module at top level
    // 共享工具 modifiers先整理这一处局部数据，后续分支可以直接读取。
    const { isModifierPressed: nativeIsModifierPressed } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // 调用 require，触发共享工具此处需要的副作用。
      require('modifiers-napi') as { isModifierPressed: (m: string) => boolean }
    // 返回 `nativeIsModifierPressed(modifier)`，作为共享工具这次计算的结果。
    return nativeIsModifierPressed(modifier)
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
