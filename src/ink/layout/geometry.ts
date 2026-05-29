// Point 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Point = {
  x: number
  y: number
}

// Size 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Size = {
  width: number
  height: number
}

// Rectangle 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Rectangle = Point & Size

/** Edge insets (padding, margin, border) */
// Edges 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Edges = {
  top: number
  right: number
  bottom: number
  left: number
}

/** Create uniform edges */
// edges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function edges(all: number): Edges
// edges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function edges(vertical: number, horizontal: number): Edges
// edges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function edges(
  top: number,
  right: number,
  bottom: number,
  left: number,
): Edges
// edges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function edges(a: number, b?: number, c?: number, d?: number): Edges {
  // 满足 `b === undefined` 时，终端渲染执行该分支。
  if (b === undefined) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { top: a, right: a, bottom: a, left: a }
  }
  // 满足 `c === undefined` 时，终端渲染执行该分支。
  if (c === undefined) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { top: a, right: b, bottom: a, left: b }
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { top: a, right: b, bottom: c, left: d! }
}

/** Add two edge values */
// addEdges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addEdges(a: Edges, b: Edges): Edges {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    top: a.top + b.top,
    right: a.right + b.right,
    bottom: a.bottom + b.bottom,
    left: a.left + b.left,
  }
}

/** Zero edges constant */
// ZERO_EDGES 集合 集中保存Ink 渲染层 geometry要一起传递的字段。
export const ZERO_EDGES: Edges = { top: 0, right: 0, bottom: 0, left: 0 }

/** Convert partial edges to full edges with defaults */
// resolveEdges 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveEdges(partial?: Partial<Edges>): Edges {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    top: partial?.top ?? 0,
    right: partial?.right ?? 0,
    bottom: partial?.bottom ?? 0,
    left: partial?.left ?? 0,
  }
}

// unionRect 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unionRect(a: Rectangle, b: Rectangle): Rectangle {
  // minX保存`Math.min`，供终端渲染后续处理使用。
  const minX = Math.min(a.x, b.x)
  // minY保存`Math.min`，供终端渲染后续处理使用。
  const minY = Math.min(a.y, b.y)
  // maxX保存`Math.max`，供终端渲染后续处理使用。
  const maxX = Math.max(a.x + a.width, b.x + b.width)
  // maxY保存`Math.max`，供终端渲染后续处理使用。
  const maxY = Math.max(a.y + a.height, b.y + b.height)
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

// clampRect 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clampRect(rect: Rectangle, size: Size): Rectangle {
  // minX保存`Math.max`，供终端渲染后续处理使用。
  const minX = Math.max(0, rect.x)
  // minY保存`Math.max`，供终端渲染后续处理使用。
  const minY = Math.max(0, rect.y)
  // maxX保存`Math.min`，供终端渲染后续处理使用。
  const maxX = Math.min(size.width - 1, rect.x + rect.width - 1)
  // maxY保存`Math.min`，供终端渲染后续处理使用。
  const maxY = Math.min(size.height - 1, rect.y + rect.height - 1)
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX + 1),
    height: Math.max(0, maxY - minY + 1),
  }
}

// withinBounds 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function withinBounds(size: Size, point: Point): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < size.width &&
    point.y < size.height
  )
}

// clamp 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clamp(value: number, min?: number, max?: number): number {
  // `min` 与 `undefined && value < min` 不一致时刷新派生状态，避免使用过期结果。
  if (min !== undefined && value < min) return min
  // `max` 与 `undefined && value > max` 不一致时刷新派生状态，避免使用过期结果。
  if (max !== undefined && value > max) return max
  // 返回 `value`，作为终端渲染这次计算的结果。
  return value
}
