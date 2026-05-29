// 类型依赖 { AttachmentMessage, RenderableMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { AttachmentMessage, RenderableMessage } from '../types/message.js'

// isTeammateShutdownAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTeammateShutdownAttachment(
  msg: RenderableMessage,
): msg is AttachmentMessage {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    msg.type === 'attachment' &&
    msg.attachment.type === 'task_status' &&
    msg.attachment.taskType === 'in_process_teammate' &&
    msg.attachment.status === 'completed'
  )
}

/**
 * Collapses consecutive in-process teammate shutdown task_status attachments
 * into a single `teammate_shutdown_batch` attachment with a count.
 */
// collapseTeammateShutdowns 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collapseTeammateShutdowns(
  messages: RenderableMessage[],
): RenderableMessage[] {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: RenderableMessage[] = []
  // i保存`0`，供后续判断或组装使用。
  let i = 0

  // while 使用 i < messages.length 完成共享工具里的对应操作。
  while (i < messages.length) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // 满足 `isTeammateShutdownAttachment(msg)` 时，共享工具执行该分支。
    if (isTeammateShutdownAttachment(msg)) {
      // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let count = 0
      // 调用 while，触发共享工具此处需要的副作用。
      while (
        i < messages.length &&
        isTeammateShutdownAttachment(messages[i]!)
      ) {
        // 共享工具 collapse Teammate Shutdowns在这里处理 `count++`，完成这一小步状态转换。
        count++
        // 共享工具 collapse Teammate Shutdowns在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
      // 满足 `count === 1` 时，共享工具执行该分支。
      if (count === 1) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(msg)
      } else {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({
          type: 'attachment',
          uuid: msg.uuid,
          timestamp: msg.timestamp,
          attachment: {
            type: 'teammate_shutdown_batch',
            count,
          },
        })
      }
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
      // 共享工具 collapse Teammate Shutdowns在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
