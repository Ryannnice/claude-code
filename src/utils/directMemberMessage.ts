// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'

/**
 * Parse `@agent-name message` syntax for direct team member messaging.
 */
// parseDirectMemberMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseDirectMemberMessage(input: string): {
  recipientName: string
  message: string
} | null {
  // match匹配`input.match`，供共享工具后续处理使用。
  const match = input.match(/^@([\w-]+)\s+(.+)$/s)
  // match缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!match) return null

  // 从 `match` 按位置拆出 recipientName、message，让共享工具 direct Member Message分别处理这些返回值。
  const [, recipientName, message] = match
  // 只有 `!recipientName || !message` 满足时，共享工具才执行该分支。
  if (!recipientName || !message) return null

  // trimmedMessage 消息数据格式化`message.trim`，供共享工具后续处理使用。
  const trimmedMessage = message.trim()
  // trimmedMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmedMessage) return null

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { recipientName, message: trimmedMessage }
}

// DirectMessageResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DirectMessageResult =
  | { success: true; recipientName: string }
  | {
      success: false
      error: 'no_team_context' | 'unknown_recipient'
      recipientName?: string
    }

// WriteToMailboxFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WriteToMailboxFn = (
  recipientName: string,
  message: { from: string; text: string; timestamp: string },
  teamName: string,
) => Promise<void>

/**
 * Send a direct message to a team member, bypassing the model.
 */
// sendDirectMemberMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendDirectMemberMessage(
  recipientName: string,
  message: string,
  teamContext: AppState['teamContext'],
  writeToMailbox?: WriteToMailboxFn,
): Promise<DirectMessageResult> {
  // 只有 `!teamContext || !writeToMailbox` 满足时，共享工具才执行该分支。
  if (!teamContext || !writeToMailbox) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, error: 'no_team_context' }
  }

  // Find team member by name
  // member派生`Object.values`，供共享工具后续处理使用。
  const member = Object.values(teamContext.teammates ?? {}).find(
    // t更新为 `> t.name === recipientName`，确保共享工具后续读取最新状态。
    t => t.name === recipientName,
  )

  // member缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!member) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, error: 'unknown_recipient', recipientName }
  }

  // 等待 `writeToMailbox(` 完成，再继续共享工具 direct Member Message的异步流程。
  await writeToMailbox(
    recipientName,
    {
      from: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    },
    teamContext.teamName,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { success: true, recipientName }
}
