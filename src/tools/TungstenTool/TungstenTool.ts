// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'

// inputSchema保存`z.object`，供工具调用后续处理使用。
const inputSchema = z.object({}).passthrough()

// TungstenTool集中保存工具实现 Tungsten Tool要一起传递的字段。
export const TungstenTool = {
  name: 'tungsten',
  aliases: [],
  maxResultSizeChars: 0,
  inputSchema,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Unavailable in this local recovery build.'`，作为工具调用这次计算的结果。
    return 'Unavailable in this local recovery build.'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `'TungstenTool is unavailable in this local recovery build.'`，作为工具调用这次计算的结果。
    return 'TungstenTool is unavailable in this local recovery build.'
  },
  // call 使用 无 完成工具调用里的对应操作。
  async call() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: false,
        error: 'TungstenTool is unavailable in this local recovery build.',
      },
    }
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // checkPermissions 使用 无 完成工具调用里的对应操作。
  async checkPermissions() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'deny' as const,
      message: 'TungstenTool is unavailable in this local recovery build.',
    }
  },
}

// clearSessionsWithTungstenUsage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionsWithTungstenUsage(): void {}

// resetInitializationState 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetInitializationState(): void {}
