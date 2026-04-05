import { getGlobalConfig } from '../utils/config.js'
import { getCompanion } from './companion.js'

type BuddyObserverMessage = {
  type?: string
  isMeta?: boolean
  message?: {
    content?: unknown
  }
}

function extractText(content: unknown): string | null {
  if (typeof content === 'string') {
    return content.trim() || null
  }
  if (!Array.isArray(content)) {
    return null
  }

  const text = content
    .filter(
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'text' &&
        'text' in block &&
        typeof block.text === 'string',
    )
    .map(block => block.text)
    .join('\n')
    .trim()

  return text || null
}

function getLatestUserText(messages: readonly BuddyObserverMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message || message.type !== 'user' || message.isMeta) continue
    const text = extractText(message.message?.content)
    if (text) return text
  }

  return null
}

export async function fireCompanionObserver(
  messages: readonly BuddyObserverMessage[],
  onReaction: (reaction: string) => void,
): Promise<void> {
  const companion = getCompanion()
  if (!companion || getGlobalConfig().companionMuted) return

  const latestUserText = getLatestUserText(messages)
  if (!latestUserText || /\/buddy\b/i.test(latestUserText)) return

  const lower = latestUserText.toLowerCase()
  if (!lower.includes(companion.name.toLowerCase())) return

  if (/\b(thanks|thank you)\b/i.test(latestUserText)) {
    onReaction('pleased chirp')
    return
  }
  if (/\b(hi|hello|hey)\b/i.test(latestUserText)) {
    onReaction('tiny wave')
    return
  }
  if (/\b(pet|pat|scritch|boop|good)\b/i.test(latestUserText)) {
    onReaction('leans in happily')
    return
  }
  if (latestUserText.includes('?')) {
    onReaction('tilts head')
    return
  }

  onReaction('is listening')
}
