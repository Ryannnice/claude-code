// 类型依赖 { Message } 来自 ../types/message.js，用于校准prompt的数据契约。
import type { Message } from '../types/message.js'
// 类型依赖 { Attachment } 来自 ../utils/attachments.js，用于校准prompt的数据契约。
import type { Attachment } from '../utils/attachments.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 引入 isBuddyEnabled，将 ./availability.js 中已经封装好的能力接到本文件流程里。
import { isBuddyEnabled } from './availability.js'
// 引入 getCompanion，将 ./companion.js 中已经封装好的能力接到本文件流程里。
import { getCompanion } from './companion.js'

// companionIntroText 封装prompt的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function companionIntroText(name: string, species: string): string {
  // 返回 ``# Companion`，作为prompt这次计算的结果。
  return `# Companion

A small ${species} named ${name} sits beside the user's input box and occasionally comments in a speech bubble. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`
}

// getCompanionIntroAttachment 封装prompt的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCompanionIntroAttachment(
  messages: Message[] | undefined,
): Attachment[] {
  // 满足 `!isBuddyEnabled()` 时，prompt执行该分支。
  if (!isBuddyEnabled()) return []
  // companion读取`getCompanion`，供prompt后续处理使用。
  const companion = getCompanion()
  // 组合条件 `!companion || getGlobalConfig().companionMuted` 成立时，prompt才启用这条专门路径。
  if (!companion || getGlobalConfig().companionMuted) return []

  // Skip if already announced for this companion.
  // 按顺序遍历 `messages ?? []` 中的消息，逐个交给prompt处理。
  for (const msg of messages ?? []) {
    // `msg.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'attachment') continue
    // `msg.attachment.type` 与 `'companion_intro'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.attachment.type !== 'companion_intro') continue
    // 满足 `msg.attachment.name === companion.name` 时，prompt执行该分支。
    if (msg.attachment.name === companion.name) return []
  }

  // 返回列表结果，保留prompt已经排好的条目顺序。
  return [
    {
      type: 'companion_intro',
      name: companion.name,
      species: companion.species,
    },
  ]
}
