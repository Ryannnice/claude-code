// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 引入 clearConversation，将 ./conversation.js 中已经封装好的能力接到本文件流程里。
import { clearConversation } from './conversation.js'

// 这个回调绑定到 export const call: LocalCommandCall = async (_, context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async (_, context) => {
  // 等待 `clearConversation(context)` 完成，再继续斜杠命令 clear的异步流程。
  await clearConversation(context)
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'text', value: '' }
}
