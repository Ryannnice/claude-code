// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 类型依赖 { AssistantMessage, UserMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { AssistantMessage, UserMessage } from '../types/message.js'

/**
 * Hardcoded salt from backend validation.
 * Must match exactly for fingerprint validation to pass.
 */
// FINGERPRINT_SALT保存`'59cf53e54c78'`，作为后续固定文本处理的输入。
export const FINGERPRINT_SALT = '59cf53e54c78'

/**
 * Extracts text content from the first user message.
 *
 * @param messages - Array of internal message types
 * @returns First text content, or empty string if not found
 */
// extractFirstMessageText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractFirstMessageText(
  messages: (UserMessage | AssistantMessage)[],
): string {
  // firstUserMessage 消息数据筛选`messages.find`，供共享工具后续处理使用。
  const firstUserMessage = messages.find(msg => msg.type === 'user')
  // firstUserMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!firstUserMessage) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 文本内容 命名 `firstUserMessage.message.content`，让后续代码直接表达这个值的用途。
  const content = firstUserMessage.message.content

  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  }

  // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
  if (Array.isArray(content)) {
    // textBlock筛选`content.find`，供共享工具后续处理使用。
    const textBlock = content.find(block => block.type === 'text')
    // 当 `textBlock && textBlock.type` 匹配 `'text'` 时，共享工具执行对应分支。
    if (textBlock && textBlock.type === 'text') {
      // 返回 `textBlock.text`，作为共享工具这次计算的结果。
      return textBlock.text
    }
  }

  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Computes 3-character fingerprint for Claude Code attribution.
 * Algorithm: SHA256(SALT + msg[4] + msg[7] + msg[20] + version)[:3]
 * IMPORTANT: Do not change this method without careful coordination with
 * 1P and 3P (Bedrock, Vertex, Azure) APIs.
 *
 * @param messageText - First user message text content
 * @param version - Version string (from MACRO.VERSION)
 * @returns 3-character hex fingerprint
 */
// computeFingerprint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeFingerprint(
  messageText: string,
  version: string,
): string {
  // Extract chars at indices [4, 7, 20], use "0" if index not found
  // indices 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const indices = [4, 7, 20]
  // chars 集合派生`indices.map`，供共享工具后续处理使用。
  const chars = indices.map(i => messageText[i] || '0').join('')

  // fingerprintInput 命名 ``${FINGERPRINT_SALT}${chars}${version}``，让后续代码直接表达这个值的用途。
  const fingerprintInput = `${FINGERPRINT_SALT}${chars}${version}`

  // SHA256 hash, return first 3 hex chars
  // hash构建`createHash`，供共享工具后续处理使用。
  const hash = createHash('sha256').update(fingerprintInput).digest('hex')
  // 返回 `hash.slice(0, 3)`，作为共享工具这次计算的结果。
  return hash.slice(0, 3)
}

/**
 * Computes fingerprint from the first user message.
 *
 * @param messages - Array of normalized messages
 * @returns 3-character hex fingerprint
 */
// computeFingerprintFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeFingerprintFromMessages(
  messages: (UserMessage | AssistantMessage)[],
): string {
  // firstMessageText 消息数据保存`extractFirstMessageText`，供共享工具后续处理使用。
  const firstMessageText = extractFirstMessageText(messages)
  // 返回 `computeFingerprint(firstMessageText, MACRO.VERSION)`，作为共享工具这次计算的结果。
  return computeFingerprint(firstMessageText, MACRO.VERSION)
}
