// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  STATUS_TAG,
  SUMMARY_TAG,
  TASK_NOTIFICATION_TAG,
} from '../constants/xml.js'
// 引入 BACKGROUND_BASH_SUMMARY_PREFIX，将 ../tasks/LocalShellTask/LocalShellTask.js 中已经封装好的能力接到本文件流程里。
import { BACKGROUND_BASH_SUMMARY_PREFIX } from '../tasks/LocalShellTask/LocalShellTask.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  NormalizedUserMessage,
  RenderableMessage,
} from '../types/message.js'
// 引入 isFullscreenEnvEnabled，将 ./fullscreen.js 中已经封装好的能力接到本文件流程里。
import { isFullscreenEnvEnabled } from './fullscreen.js'
// 引入 extractTag，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { extractTag } from './messages.js'

// isCompletedBackgroundBash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCompletedBackgroundBash(
  msg: RenderableMessage,
): msg is NormalizedUserMessage {
  // `msg.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (msg.type !== 'user') return false
  // 文本内容读取 `msg.message.content[0]` 对应条目，后续围绕该成员继续处理。
  const content = msg.message.content[0]
  // `content?.type` 与 `'text'` 不一致时刷新派生状态，避免使用过期结果。
  if (content?.type !== 'text') return false
  // 满足 `!content.text.includes(`<${TASK_NOTIFICATION_TAG}`)` 时，共享工具执行该分支。
  if (!content.text.includes(`<${TASK_NOTIFICATION_TAG}`)) return false
  // Only collapse successful completions — failed/killed stay visible individually.
  // `extractTag(content.text, STATUS_TAG)` 与 `'completed'` 不一致时刷新派生状态，避免使用过期结果。
  if (extractTag(content.text, STATUS_TAG) !== 'completed') return false
  // The prefix constant distinguishes bash-kind LocalShellTask completions from
  // agent/workflow/monitor notifications. Monitor-kind completions have their
  // own summary wording and deliberately don't collapse here.
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    extractTag(content.text, SUMMARY_TAG)?.startsWith(
      BACKGROUND_BASH_SUMMARY_PREFIX,
    ) ?? false
  )
}

/**
 * Collapses consecutive completed-background-bash task-notifications into a
 * single synthetic "N background commands completed" notification. Failed/killed
 * tasks and agent/workflow notifications are left alone. Monitor stream
 * events (enqueueStreamEvent) have no <status> tag and never match.
 *
 * Pass-through in verbose mode so ctrl+O shows each completion.
 */
// collapseBackgroundBashNotifications 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collapseBackgroundBashNotifications(
  messages: RenderableMessage[],
  verbose: boolean,
): RenderableMessage[] {
  // 满足 `!isFullscreenEnvEnabled()` 时，共享工具执行该分支。
  if (!isFullscreenEnvEnabled()) return messages
  // 满足 `verbose` 时，共享工具执行该分支。
  if (verbose) return messages

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: RenderableMessage[] = []
  // i保存`0`，供共享工具 collapse Background Bash...后续判断或输出使用。
  let i = 0

  // while 使用 i < messages.length 完成共享工具里的对应操作。
  while (i < messages.length) {
    // 消息保存`messages[i]!`，供共享工具 collapse Background Bash...后续判断或输出使用。
    const msg = messages[i]!
    // 满足 `isCompletedBackgroundBash(msg)` 时，共享工具执行该分支。
    if (isCompletedBackgroundBash(msg)) {
      // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let count = 0
      // 只要 i < messages.length && isCompletedBackgroundBash(messages[i]!) 成立，就持续推进共享工具中的循环处理。
      while (i < messages.length && isCompletedBackgroundBash(messages[i]!)) {
        // 共享工具 collapse Background Bash Notif...在这里处理 `count++`，完成这一小步状态转换。
        count++
        // 共享工具 collapse Background Bash Notif...在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
      // 满足 `count === 1` 时，共享工具执行该分支。
      if (count === 1) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(msg)
      } else {
        // Synthesize a task-notification that UserAgentNotificationMessage
        // already knows how to render — no new renderer needed.
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({
          ...msg,
          message: {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `<${TASK_NOTIFICATION_TAG}><${STATUS_TAG}>completed</${STATUS_TAG}><${SUMMARY_TAG}>${count} background commands completed</${SUMMARY_TAG}></${TASK_NOTIFICATION_TAG}>`,
              },
            ],
          },
        })
      }
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
      // 共享工具 collapse Background Bash Notif...在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
