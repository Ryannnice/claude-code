/**
 * Utility for inserting a block into a content array relative to tool_result
 * blocks. Used by the API layer to position supplementary content (e.g.,
 * cache editing directives) correctly within user messages.
 *
 * Placement rules:
 * - If tool_result blocks exist: insert after the last one
 * - Otherwise: insert before the last block
 * - If the inserted block would be the final element, a text continuation
 *   block is appended (some APIs require the prompt not to end with
 *   non-text content)
 */

/**
 * Inserts a block into the content array after the last tool_result block.
 * Mutates the array in place.
 *
 * @param content - The content array to modify
 * @param block - The block to insert
 */
// insertBlockAfterToolResults 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function insertBlockAfterToolResults(
  content: unknown[],
  block: unknown,
): void {
  // Find position after the last tool_result block
  // lastToolResultIndex 索引保存`-1`，供共享工具 content Array后续判断或输出使用。
  let lastToolResultIndex = -1
  // 按索引扫描 `content.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < content.length; i++) {
    // item保存`content[i]`，供共享工具 content Array后续判断或输出使用。
    const item = content[i]
    // 共享工具在这里按实际状态进入对应分支。
    if (
      item &&
      typeof item === 'object' &&
      'type' in item &&
      (item as { type: string }).type === 'tool_result'
    ) {
      // lastToolResultIndex 索引更新为 `i`，确保共享工具后续读取最新状态。
      lastToolResultIndex = i
    }
  }

  // 满足 `lastToolResultIndex >= 0` 时，共享工具执行该分支。
  if (lastToolResultIndex >= 0) {
    // insertPos 集合 命名 `lastToolResultIndex + 1`，让后续代码直接表达这个值的用途。
    const insertPos = lastToolResultIndex + 1
    // 调用 content.splice，触发共享工具此处需要的副作用。
    content.splice(insertPos, 0, block)
    // Append a text continuation if the inserted block is now last
    // 满足 `insertPos === content.length - 1` 时，共享工具执行该分支。
    if (insertPos === content.length - 1) {
      // 文本内容追加新条目，保持收集顺序与输入顺序一致。
      content.push({ type: 'text', text: '.' })
    }
  } else {
    // No tool_result blocks — insert before the last block
    // insertIndex 索引保存`Math.max`，供共享工具后续处理使用。
    const insertIndex = Math.max(0, content.length - 1)
    // 调用 content.splice，触发共享工具此处需要的副作用。
    content.splice(insertIndex, 0, block)
  }
}
