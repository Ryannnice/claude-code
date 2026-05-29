// 引入 runExtraUsage，将 ./extra-usage-core.js 中已经封装好的能力接到本文件流程里。
import { runExtraUsage } from './extra-usage-core.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<{ type: 'text'; value: string }> {
  // 结果保存`runExtraUsage`，供命令处理后续处理使用。
  const result = await runExtraUsage()

  // 当 `result.type` 匹配 `'message'` 时，命令处理执行对应分支。
  if (result.type === 'message') {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text', value: result.value }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: result.opened
      ? `Browser opened to manage extra usage. If it didn't open, visit: ${result.url}`
      : `Please visit ${result.url} to manage extra usage.`,
  }
}
