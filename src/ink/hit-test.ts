// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'
// 引入 ClickEvent，将 ./events/click-event.js 中已经封装好的能力接到本文件流程里。
import { ClickEvent } from './events/click-event.js'
// 类型依赖 { EventHandlerProps } 来自 ./events/event-handlers.js，用于校准终端渲染的数据契约。
import type { EventHandlerProps } from './events/event-handlers.js'
// 引入 nodeCache，将 ./node-cache.js 中已经封装好的能力接到本文件流程里。
import { nodeCache } from './node-cache.js'

/**
 * Find the deepest DOM element whose rendered rect contains (col, row).
 *
 * Uses the nodeCache populated by renderNodeToOutput — rects are in screen
 * coordinates with all offsets (including scrollTop translation) already
 * applied. Children are traversed in reverse so later siblings (painted on
 * top) win. Nodes not in nodeCache (not rendered this frame, or lacking a
 * yogaNode) are skipped along with their subtrees.
 *
 * Returns the hit node even if it has no onClick — dispatchClick walks up
 * via parentNode to find handlers.
 */
// hitTest 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hitTest(
  node: DOMElement,
  col: number,
  row: number,
): DOMElement | null {
  // rect读取`nodeCache.get`，供终端渲染后续处理使用。
  const rect = nodeCache.get(node)
  // rect缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!rect) return null
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    col < rect.x ||
    col >= rect.x + rect.width ||
    row < rect.y ||
    row >= rect.y + rect.height
  ) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null
  }
  // Later siblings paint on top; reversed traversal returns topmost hit.
  // 循环处理 `let i = node.childNodes.length - 1; i >= 0; i--`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    // child保存`node.childNodes[i]!`，供Ink 渲染层 hit test后续判断或输出使用。
    const child = node.childNodes[i]!
    // 当 `child.nodeName` 匹配 `'#text'` 时，终端渲染执行对应分支。
    if (child.nodeName === '#text') continue
    // hit保存`hitTest`，供终端渲染后续处理使用。
    const hit = hitTest(child, col, row)
    // 满足 `hit` 时，终端渲染执行该分支。
    if (hit) return hit
  }
  // 返回 `node`，作为终端渲染这次计算的结果。
  return node
}

/**
 * Hit-test the root at (col, row) and bubble a ClickEvent from the deepest
 * containing node up through parentNode. Only nodes with an onClick handler
 * fire. Stops when a handler calls stopImmediatePropagation(). Returns
 * true if at least one onClick handler fired.
 */
// dispatchClick 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dispatchClick(
  root: DOMElement,
  col: number,
  row: number,
  cellIsBlank = false,
): boolean {
  // target 命名 `hitTest(root, col, row) ?? undefined`，让后续代码直接表达这个值的用途。
  let target: DOMElement | undefined = hitTest(root, col, row) ?? undefined
  // target缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!target) return false

  // Click-to-focus: find the closest focusable ancestor and focus it.
  // root is always ink-root, which owns the FocusManager.
  // 满足 `root.focusManager` 时，终端渲染执行该分支。
  if (root.focusManager) {
    // focusTarget读取`target` 整理出中间结果，供Ink 渲染层 hit test后续步骤使用。
    let focusTarget: DOMElement | undefined = target
    // while 使用 focusTarget 完成终端渲染里的对应操作。
    while (focusTarget) {
      // 满足 `typeof focusTarget.attributes['tabIndex'] === 'nu` 时，终端渲染执行该分支。
      if (typeof focusTarget.attributes['tabIndex'] === 'number') {
        // 调用 root.focusManager.handleClickFocus，触发终端渲染此处需要的副作用。
        root.focusManager.handleClickFocus(focusTarget)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      }
      // focusTarget更新为 `focusTarget.parentNode`，确保Ink 渲染层后续读取最新状态。
      focusTarget = focusTarget.parentNode
    }
  }
  // event保存`ClickEvent`，供终端渲染后续处理使用。
  const event = new ClickEvent(col, row, cellIsBlank)
  // handled标记Ink 渲染层 hit test是否启用对应路径。
  let handled = false
  // while 使用 target 完成终端渲染里的对应操作。
  while (target) {
    // handler读取`target._eventHandlers?.onClick as` 整理出中间结果，供Ink 渲染层 hit test后续步骤使用。
    const handler = target._eventHandlers?.onClick as
      // 这个回调绑定到 | ((event: ClickEvent) => void)，负责终端渲染在该局部场景下的响应。
      | ((event: ClickEvent) => void)
      | undefined
    // 满足 `handler` 时，终端渲染执行该分支。
    if (handler) {
      // handled更新为 `true`，确保Ink 渲染层后续读取最新状态。
      handled = true
      // rect读取`nodeCache.get`，供终端渲染后续处理使用。
      const rect = nodeCache.get(target)
      // 满足 `rect` 时，终端渲染执行该分支。
      if (rect) {
        // localCol更新为 `col - rect.x`，确保Ink 渲染层后续读取最新状态。
        event.localCol = col - rect.x
        // localRow更新为 `row - rect.y`，确保Ink 渲染层后续读取最新状态。
        event.localRow = row - rect.y
      }
      // 调用 handler，触发终端渲染此处需要的副作用。
      handler(event)
      // 满足 `event.didStopImmediatePropagation()` 时，终端渲染执行该分支。
      if (event.didStopImmediatePropagation()) return true
    }
    // target更新为 `target.parentNode`，确保Ink 渲染层后续读取最新状态。
    target = target.parentNode
  }
  // 返回 `handled`，作为终端渲染这次计算的结果。
  return handled
}

/**
 * Fire onMouseEnter/onMouseLeave as the pointer moves. Like DOM
 * mouseenter/mouseleave: does NOT bubble — moving between children does
 * not re-fire on the parent. Walks up from the hit node collecting every
 * ancestor with a hover handler; diffs against the previous hovered set;
 * fires leave on the nodes exited, enter on the nodes entered.
 *
 * Mutates `hovered` in place so the caller (App instance) can hold it
 * across calls. Clears the set when the hit is null (cursor moved into a
 * non-rendered gap or off the root rect).
 */
// dispatchHover 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dispatchHover(
  root: DOMElement,
  col: number,
  row: number,
  hovered: Set<DOMElement>,
): void {
  // next构建`new Set<DOMElement>()`，供后续判断或组装使用。
  const next = new Set<DOMElement>()
  // node 命名 `hitTest(root, col, row) ?? undefined`，让后续代码直接表达这个值的用途。
  let node: DOMElement | undefined = hitTest(root, col, row) ?? undefined
  // while 使用 node 完成终端渲染里的对应操作。
  while (node) {
    // h保存`node._eventHandlers as EventHandlerProps | undefined`，供后续判断或组装使用。
    const h = node._eventHandlers as EventHandlerProps | undefined
    // 只有 `h?.onMouseEnter || h?.onMouseLeave) next.add(node` 满足时，终端渲染才执行该分支。
    if (h?.onMouseEnter || h?.onMouseLeave) next.add(node)
    // node更新为 `node.parentNode`，确保Ink 渲染层后续读取最新状态。
    node = node.parentNode
  }
  // 按顺序遍历 `hovered` 中的old，逐个交给终端渲染处理。
  for (const old of hovered) {
    // 满足 `!next.has(old)` 时，终端渲染执行该分支。
    if (!next.has(old)) {
      // 调用 hovered.delete，触发终端渲染此处需要的副作用。
      hovered.delete(old)
      // Skip handlers on detached nodes (removed between mouse events)
      // 满足 `old.parentNode` 时，终端渲染执行该分支。
      if (old.parentNode) {
        // Ink 渲染层 hit test在这里处理 `;(old._eventHandlers as EventHandlerProps | undefined)?.onMouseLeave?.()`，完成这一小步状态转换。
        ;(old._eventHandlers as EventHandlerProps | undefined)?.onMouseLeave?.()
      }
    }
  }
  // 按顺序遍历 `next` 中的n，逐个交给终端渲染处理。
  for (const n of next) {
    // 满足 `!hovered.has(n)` 时，终端渲染执行该分支。
    if (!hovered.has(n)) {
      // 调用 hovered.add，触发终端渲染此处需要的副作用。
      hovered.add(n)
      // Ink 渲染层 hit test在这里处理 `;(n._eventHandlers as EventHandlerProps | undefined)?.onMouseEnter?.()`，完成这一小步状态转换。
      ;(n._eventHandlers as EventHandlerProps | undefined)?.onMouseEnter?.()
    }
  }
}
