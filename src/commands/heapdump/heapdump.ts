// 复用 performHeapDump 工具函数，把通用处理留在 ../../utils/heapDumpService.js 中维护。
import { performHeapDump } from '../../utils/heapDumpService.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<{ type: 'text'; value: string }> {
  // 结果保存`performHeapDump`，供命令处理后续处理使用。
  const result = await performHeapDump()

  // result.success 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!result.success) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `Failed to create heap dump: ${result.error}`,
    }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: `${result.heapPath}\n${result.diagPath}`,
  }
}
