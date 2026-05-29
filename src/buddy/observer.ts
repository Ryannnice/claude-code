// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 引入 getCompanion，将 ./companion.js 中已经封装好的能力接到本文件流程里。
import { getCompanion } from './companion.js'

// BuddyObserverMessage 固化observer里传递的数据形状，帮助调用方按同一结构读写字段。
type BuddyObserverMessage = {
  type?: string
  isMeta?: boolean
  message?: {
    content?: unknown
  }
}

// extractText 封装observer的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractText(content: unknown): string | null {
  // 当 `typeof content` 匹配 `'string'` 时，observer执行对应分支。
  if (typeof content === 'string') {
    // 返回 `content.trim() || null`，作为observer这次计算的结果。
    return content.trim() || null
  }
  // 满足 `!Array.isArray(content)` 时，observer执行该分支。
  if (!Array.isArray(content)) {
    // 返回 `null`，作为observer这次计算的结果。
    return null
  }

  // 文本 命名 `content`，让后续代码直接表达这个值的用途。
  const text = content
    .filter(
      // 这个回调绑定到 (block): block is { type: 'text'; text: string } =>，负责observer在该局部场景下的响应。
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'text' &&
        'text' in block &&
        typeof block.text === 'string',
    )
    // 链式调用 map，继续加工上一行在observer中产生的数据。
    .map(block => block.text)
    .join('\n')
    .trim()

  // 返回 `text || null`，作为observer这次计算的结果。
  return text || null
}

// getLatestUserText 封装observer的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLatestUserText(messages: readonly BuddyObserverMessage[]): string | null {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让observer逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息读取 `messages[i]` 对应条目，后续围绕该成员继续处理。
    const message = messages[i]
    // `!message || message.type` 与 `'user' || message.isMeta` 不一致时刷新派生状态，避免使用过期结果。
    if (!message || message.type !== 'user' || message.isMeta) continue
    // 文本保存`extractText`，供observer后续处理使用。
    const text = extractText(message.message?.content)
    // 满足 `text` 时，observer执行该分支。
    if (text) return text
  }

  // 返回 `null`，作为observer这次计算的结果。
  return null
}

// fireCompanionObserver 封装observer的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fireCompanionObserver(
  messages: readonly BuddyObserverMessage[],
  // 这个回调绑定到 onReaction: (reaction: string) => void,，负责observer在该局部场景下的响应。
  onReaction: (reaction: string) => void,
): Promise<void> {
  // companion读取`getCompanion`，供observer后续处理使用。
  const companion = getCompanion()
  // 组合条件 `!companion || getGlobalConfig().companionMuted` 成立时，observer才启用这条专门路径。
  if (!companion || getGlobalConfig().companionMuted) return

  // latestUserText读取`getLatestUserText`，供observer后续处理使用。
  const latestUserText = getLatestUserText(messages)
  // 组合条件 `!latestUserText || /\/buddy\b/i.test(latestUserText)` 成立时，observer才启用这条专门路径。
  if (!latestUserText || /\/buddy\b/i.test(latestUserText)) return

  // lower保存`latestUserText.toLowerCase`，供observer后续处理使用。
  const lower = latestUserText.toLowerCase()
  // 满足 `!lower.includes(companion.name.toLowerCase())` 时，observer执行该分支。
  if (!lower.includes(companion.name.toLowerCase())) return

  // 满足 `/\b(thanks|thank you)\b/i.test(latestUserText)` 时，observer执行该分支。
  if (/\b(thanks|thank you)\b/i.test(latestUserText)) {
    // 调用 onReaction，触发observer此处需要的副作用。
    onReaction('pleased chirp')
    // observer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `/\b(hi|hello|hey)\b/i.test(latestUserText)` 时，observer执行该分支。
  if (/\b(hi|hello|hey)\b/i.test(latestUserText)) {
    // 调用 onReaction，触发observer此处需要的副作用。
    onReaction('tiny wave')
    // observer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `/\b(pet|pat|scritch|boop|good)\b/i.test(latestUserText)` 时，observer执行该分支。
  if (/\b(pet|pat|scritch|boop|good)\b/i.test(latestUserText)) {
    // 调用 onReaction，触发observer此处需要的副作用。
    onReaction('leans in happily')
    // observer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `latestUserText.includes('?')` 时，observer执行该分支。
  if (latestUserText.includes('?')) {
    // 调用 onReaction，触发observer此处需要的副作用。
    onReaction('tilts head')
    // observer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 onReaction，触发observer此处需要的副作用。
  onReaction('is listening')
}
