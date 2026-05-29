/**
 * Branded type for system prompt arrays.
 *
 * This module is intentionally dependency-free so it can be imported
 * from anywhere without risking circular initialization issues.
 */

// SystemPrompt 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SystemPrompt = readonly string[] & {
  readonly __brand: 'SystemPrompt'
}

// asSystemPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function asSystemPrompt(value: readonly string[]): SystemPrompt {
  // 返回 `value as SystemPrompt`，作为共享工具这次计算的结果。
  return value as SystemPrompt
}
