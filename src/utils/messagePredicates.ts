// 类型依赖 { Message, UserMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message, UserMessage } from '../types/message.js'

// tool_result messages share type:'user' with human turns; the discriminant
// is the optional toolUseResult field. Four PRs (#23977, #24016, #24022,
// #24025) independently fixed miscounts from checking type==='user' alone.
// isHumanTurn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isHumanTurn(m: Message): m is UserMessage {
  // 返回 `m.type === 'user' && !m.isMeta && m.toolUseResult === undefined`，作为共享工具这次计算的结果。
  return m.type === 'user' && !m.isMeta && m.toolUseResult === undefined
}
