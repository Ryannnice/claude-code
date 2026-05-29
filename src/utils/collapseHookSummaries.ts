// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  RenderableMessage,
  SystemStopHookSummaryMessage,
} from '../types/message.js'

// isLabeledHookSummary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLabeledHookSummary(
  msg: RenderableMessage,
): msg is SystemStopHookSummaryMessage {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    msg.type === 'system' &&
    msg.subtype === 'stop_hook_summary' &&
    msg.hookLabel !== undefined
  )
}

/**
 * Collapses consecutive hook summary messages with the same hookLabel
 * (e.g. PostToolUse) into a single summary. This happens when parallel
 * tool calls each emit their own hook summary.
 */
// collapseHookSummaries 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collapseHookSummaries(
  messages: RenderableMessage[],
): RenderableMessage[] {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: RenderableMessage[] = []
  // i保存`0`，供共享工具 collapse Hook Summaries后续判断或输出使用。
  let i = 0

  // while 使用 i < messages.length 完成共享工具里的对应操作。
  while (i < messages.length) {
    // 消息读取 `messages[i]!` 对应条目，后续围绕该成员继续处理。
    const msg = messages[i]!
    // 满足 `isLabeledHookSummary(msg)` 时，共享工具执行该分支。
    if (isLabeledHookSummary(msg)) {
      // label保存`msg.hookLabel`，供共享工具 collapse Hook Summaries后续判断或输出使用。
      const label = msg.hookLabel
      // group 从空数组开始收集，后续循环会按处理顺序追加条目。
      const group: SystemStopHookSummaryMessage[] = []
      // while 使用 i < messages.length 完成共享工具里的对应操作。
      while (i < messages.length) {
        // next读取 `messages[i]!` 对应条目，后续围绕该成员继续处理。
        const next = messages[i]!
        // `!isLabeledHookSummary(next) || next.hookLab...` 与 `label` 不一致时刷新派生状态，避免使用过期结果。
        if (!isLabeledHookSummary(next) || next.hookLabel !== label) break
        // group追加新条目，保持收集顺序与输入顺序一致。
        group.push(next)
        // 共享工具 collapse Hook Summaries在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
      // 满足 `group.length === 1` 时，共享工具执行该分支。
      if (group.length === 1) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(msg)
      } else {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({
          ...msg,
          // 这个回调绑定到 hookCount: group.reduce((sum, m) => sum + m.hookCount, 0),，负责共享工具在该局部场景下的响应。
          hookCount: group.reduce((sum, m) => sum + m.hookCount, 0),
          // 这个回调绑定到 hookInfos: group.flatMap(m => m.hookInfos),，负责共享工具在该局部场景下的响应。
          hookInfos: group.flatMap(m => m.hookInfos),
          // 这个回调绑定到 hookErrors: group.flatMap(m => m.hookErrors),，负责共享工具在该局部场景下的响应。
          hookErrors: group.flatMap(m => m.hookErrors),
          // 这个回调绑定到 preventedContinuation: group.some(m => m.preventedContinuation),，负责共享工具在该局部场景下的响应。
          preventedContinuation: group.some(m => m.preventedContinuation),
          // 这个回调绑定到 hasOutput: group.some(m => m.hasOutput),，负责共享工具在该局部场景下的响应。
          hasOutput: group.some(m => m.hasOutput),
          // Parallel tool calls' hooks overlap; max is closest to wall-clock.
          // 这个回调绑定到 totalDurationMs: Math.max(...group.map(m => m.totalDurationMs ?? 0)),，负责共享工具在该局部场景下的响应。
          totalDurationMs: Math.max(...group.map(m => m.totalDurationMs ?? 0)),
        })
      }
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
      // 共享工具 collapse Hook Summaries在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
