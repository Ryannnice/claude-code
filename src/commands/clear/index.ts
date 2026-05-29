/**
 * Clear command - minimal metadata only.
 * Implementation is lazy-loaded from clear.ts to reduce startup time.
 * Utility functions:
 * - clearSessionCaches: import from './clear/caches.js'
 * - clearConversation: import from './clear/conversation.js'
 */
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// clear 集中保存命令处理斜杠命令 index要一起传递的字段。
const clear = {
  type: 'local',
  name: 'clear',
  description: 'Clear conversation history and free up context',
  aliases: ['reset', 'new'],
  supportsNonInteractive: false, // Should just create a new session
  // 这个回调绑定到 load: () => import('./clear.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./clear.js'),
} satisfies Command

export default clear
