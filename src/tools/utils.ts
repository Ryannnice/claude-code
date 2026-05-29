// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  SystemMessage,
  UserMessage,
} from 'src/types/message.js'

/**
 * Tags user messages with a sourceToolUseID so they stay transient until the tool resolves.
 * This prevents the "is running" message from being duplicated in the UI.
 */
// tagMessagesWithToolUseID 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tagMessagesWithToolUseID(
  messages: (UserMessage | AttachmentMessage | SystemMessage)[],
  toolUseID: string | undefined,
): (UserMessage | AttachmentMessage | SystemMessage)[] {
  // toolUseID缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!toolUseID) {
    // 返回 `messages`，作为工具调用这次计算的结果。
    return messages
  }
  // 返回 `messages.map(m => {`，作为工具调用这次计算的结果。
  return messages.map(m => {
    // 当 `m.type` 匹配 `'user'` 时，工具调用执行对应分支。
    if (m.type === 'user') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { ...m, sourceToolUseID: toolUseID }
    }
    // 返回 `m`，作为工具调用这次计算的结果。
    return m
  })
}

/**
 * Extracts the tool use ID from a parent message for a given tool name.
 */
// getToolUseIDFromParentMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseIDFromParentMessage(
  parentMessage: AssistantMessage,
  toolName: string,
): string | undefined {
  // toolUseBlock筛选`content.find`，供工具调用后续处理使用。
  const toolUseBlock = parentMessage.message.content.find(
    // block更新为 `> block.type === 'tool_use' && block.name === toolName`，确保工具调用后续读取最新状态。
    block => block.type === 'tool_use' && block.name === toolName,
  )
  // 返回 `toolUseBlock && toolUseBlock.type === 'tool_use'`，作为工具调用这次计算的结果。
  return toolUseBlock && toolUseBlock.type === 'tool_use'
    ? toolUseBlock.id
    : undefined
}
