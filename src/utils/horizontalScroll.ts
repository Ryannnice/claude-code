// HorizontalScrollWindow 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HorizontalScrollWindow = {
  startIndex: number
  endIndex: number
  showLeftArrow: boolean
  showRightArrow: boolean
}

/**
 * Calculate the visible window of items that fit within available width,
 * ensuring the selected item is always visible. Uses edge-based scrolling:
 * the window only scrolls when the selected item would be outside the visible
 * range, and positions the selected item at the edge (not centered).
 *
 * @param itemWidths - Array of item widths (each width should include separator if applicable)
 * @param availableWidth - Total available width for items
 * @param arrowWidth - Width of scroll indicator arrow (including space)
 * @param selectedIdx - Index of selected item (must stay visible)
 * @param firstItemHasSeparator - Whether first item's width includes a separator that should be ignored
 * @returns Visible window bounds and whether to show scroll arrows
 */
// calculateHorizontalScrollWindow 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateHorizontalScrollWindow(
  itemWidths: number[],
  availableWidth: number,
  arrowWidth: number,
  selectedIdx: number,
  firstItemHasSeparator = true,
): HorizontalScrollWindow {
  // totalItems 集合保存 `itemWidths.length` 的判断结果，供共享工具 horizontal Scroll后续分支直接复用。
  const totalItems = itemWidths.length

  // 满足 `totalItems === 0` 时，共享工具执行该分支。
  if (totalItems === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      startIndex: 0,
      endIndex: 0,
      showLeftArrow: false,
      showRightArrow: false,
    }
  }

  // Clamp selectedIdx to valid range
  // clampedSelected保存`Math.max`，供共享工具后续处理使用。
  const clampedSelected = Math.max(0, Math.min(selectedIdx, totalItems - 1))

  // If all items fit, show them all
  // totalWidth派生`itemWidths.reduce`，供共享工具后续处理使用。
  const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0)
  // 满足 `totalWidth <= availableWidth` 时，共享工具执行该分支。
  if (totalWidth <= availableWidth) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      startIndex: 0,
      endIndex: totalItems,
      showLeftArrow: false,
      showRightArrow: false,
    }
  }

  // Calculate cumulative widths for efficient range calculations
  // cumulativeWidths 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const cumulativeWidths: number[] = [0]
  // 按索引扫描 `totalItems`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < totalItems; i++) {
    // cumulativeWidths 集合追加新条目，保持收集顺序与输入顺序一致。
    cumulativeWidths.push(cumulativeWidths[i]! + itemWidths[i]!)
  }

  // Helper to get width of range [start, end)
  // rangeWidth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function rangeWidth(start: number, end: number): number {
    // baseWidth读取 `cumulativeWidths[end]! - cumulativeWidths[start]!` 对应条目，后续围绕该成员继续处理。
    const baseWidth = cumulativeWidths[end]! - cumulativeWidths[start]!
    // When starting after index 0 and first item has separator baked in,
    // subtract 1 because we don't render leading separator on first visible item
    // 只有 `firstItemHasSeparator && start > 0` 满足时，共享工具才执行该分支。
    if (firstItemHasSeparator && start > 0) {
      // 返回 `baseWidth - 1`，作为共享工具这次计算的结果。
      return baseWidth - 1
    }
    // 返回 `baseWidth`，作为共享工具这次计算的结果。
    return baseWidth
  }

  // Calculate effective available width based on whether we'll show arrows
  // getEffectiveWidth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getEffectiveWidth(start: number, end: number): number {
    // width 命名 `availableWidth`，让后续代码直接表达这个值的用途。
    let width = availableWidth
    // 满足 `start > 0` 时，共享工具执行该分支。
    if (start > 0) width -= arrowWidth // left arrow
    // 满足 `end < totalItems` 时，共享工具执行该分支。
    if (end < totalItems) width -= arrowWidth // right arrow
    // 返回 `width`，作为共享工具这次计算的结果。
    return width
  }

  // Edge-based scrolling: Start from the beginning and only scroll when necessary
  // First, calculate how many items fit starting from index 0
  // startIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
  let startIndex = 0
  // endIndex 索引 命名 `1`，让后续代码直接表达这个值的用途。
  let endIndex = 1

  // Expand from start as much as possible
  // 调用 while，触发共享工具此处需要的副作用。
  while (
    endIndex < totalItems &&
    rangeWidth(startIndex, endIndex + 1) <=
      getEffectiveWidth(startIndex, endIndex + 1)
  ) {
    // 共享工具 horizontal Scroll在这里处理 `endIndex++`，完成这一小步状态转换。
    endIndex++
  }

  // If selected is within visible range, we're done
  // 只有 `clampedSelected >= startIndex && clampedSelected` 满足时，共享工具才执行该分支。
  if (clampedSelected >= startIndex && clampedSelected < endIndex) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      startIndex,
      endIndex,
      showLeftArrow: startIndex > 0,
      showRightArrow: endIndex < totalItems,
    }
  }

  // Selected is outside visible range - need to scroll
  // 满足 `clampedSelected >= endIndex` 时，共享工具执行该分支。
  if (clampedSelected >= endIndex) {
    // Selected is to the right - scroll so selected is at the right edge
    // endIndex 索引更新为 `clampedSelected + 1`，确保共享工具后续读取最新状态。
    endIndex = clampedSelected + 1
    // startIndex 索引更新为 `clampedSelected`，确保共享工具后续读取最新状态。
    startIndex = clampedSelected

    // Expand left as much as possible (selected stays at right edge)
    // 调用 while，触发共享工具此处需要的副作用。
    while (
      startIndex > 0 &&
      rangeWidth(startIndex - 1, endIndex) <=
        getEffectiveWidth(startIndex - 1, endIndex)
    ) {
      // 共享工具 horizontal Scroll在这里处理 `startIndex--`，完成这一小步状态转换。
      startIndex--
    }
  } else {
    // Selected is to the left - scroll so selected is at the left edge
    // startIndex 索引更新为 `clampedSelected`，确保共享工具后续读取最新状态。
    startIndex = clampedSelected
    // endIndex 索引更新为 `clampedSelected + 1`，确保共享工具后续读取最新状态。
    endIndex = clampedSelected + 1

    // Expand right as much as possible (selected stays at left edge)
    // 调用 while，触发共享工具此处需要的副作用。
    while (
      endIndex < totalItems &&
      rangeWidth(startIndex, endIndex + 1) <=
        getEffectiveWidth(startIndex, endIndex + 1)
    ) {
      // 共享工具 horizontal Scroll在这里处理 `endIndex++`，完成这一小步状态转换。
      endIndex++
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    startIndex,
    endIndex,
    showLeftArrow: startIndex > 0,
    showRightArrow: endIndex < totalItems,
  }
}
