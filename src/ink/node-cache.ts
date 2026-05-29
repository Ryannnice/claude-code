// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'
// 类型依赖 { Rectangle } 来自 ./layout/geometry.js，用于校准终端渲染的数据契约。
import type { Rectangle } from './layout/geometry.js'

/**
 * Cached layout bounds for each rendered node (used for blit + clearing).
 * `top` is the yoga-local getComputedTop() — stored so ScrollBox viewport
 * culling can skip yoga reads for clean children whose position hasn't
 * shifted (O(dirty) instead of O(mounted) first-pass).
 */
// CachedLayout 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CachedLayout = {
  x: number
  y: number
  width: number
  height: number
  top?: number
}

// nodeCache 缓存构建`new WeakMap<DOMElement, CachedLayout>()` 整理出中间结果，供Ink 渲染层 node cache后续步骤使用。
export const nodeCache = new WeakMap<DOMElement, CachedLayout>()

/** Rects of removed children that need clearing on next render */
// pendingClears 集合构建`new WeakMap<DOMElement, Rectangle[]>()`，供后续判断或组装使用。
export const pendingClears = new WeakMap<DOMElement, Rectangle[]>()

/**
 * Set when a pendingClear is added for an absolute-positioned node.
 * Signals renderer to disable blit for the next frame: the removed node
 * may have painted over non-siblings (e.g. an overlay over a ScrollBox
 * earlier in tree order), so their blits from prevScreen would restore
 * the overlay's pixels. Normal-flow removals are already handled by
 * hasRemovedChild at the parent level; only absolute positioning paints
 * cross-subtree. Reset at the start of each render.
 */
// absoluteNodeRemoved标记Ink 渲染层 node cache是否启用对应路径。
let absoluteNodeRemoved = false

// addPendingClear 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addPendingClear(
  parent: DOMElement,
  rect: Rectangle,
  isAbsolute: boolean,
): void {
  // existing读取`pendingClears.get`，供终端渲染后续处理使用。
  const existing = pendingClears.get(parent)
  // 满足 `existing` 时，终端渲染执行该分支。
  if (existing) {
    // existing追加新条目，保持收集顺序与输入顺序一致。
    existing.push(rect)
  } else {
    // pendingClears.set 写入新的状态值，使终端渲染后续读取保持一致。
    pendingClears.set(parent, [rect])
  }
  // 满足 `isAbsolute` 时，终端渲染执行该分支。
  if (isAbsolute) {
    // absoluteNodeRemoved更新为 `true`，确保Ink 渲染层后续读取最新状态。
    absoluteNodeRemoved = true
  }
}

// consumeAbsoluteRemovedFlag 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumeAbsoluteRemovedFlag(): boolean {
  // had 命名 `absoluteNodeRemoved`，让后续代码直接表达这个值的用途。
  const had = absoluteNodeRemoved
  // absoluteNodeRemoved更新为 `false`，确保Ink 渲染层后续读取最新状态。
  absoluteNodeRemoved = false
  // 返回 `had`，作为终端渲染这次计算的结果。
  return had
}
