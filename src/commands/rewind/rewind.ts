// 类型依赖 { LocalCommandResult } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../commands.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  _args: string,
  context: ToolUseContext,
): Promise<LocalCommandResult> {
  // 满足 `context.openMessageSelector` 时，命令处理执行该分支。
  if (context.openMessageSelector) {
    // 调用 context.openMessageSelector，触发命令处理此处需要的副作用。
    context.openMessageSelector()
  }
  // Return a skip message to not append any messages.
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'skip' }
}
