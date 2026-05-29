// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'
// 引入 FocusEvent，将 ./events/focus-event.js 中已经封装好的能力接到本文件流程里。
import { FocusEvent } from './events/focus-event.js'

// MAX_FOCUS_STACK保存`32`，供Ink 渲染层 focus后续判断或输出使用。
const MAX_FOCUS_STACK = 32

/**
 * DOM-like focus manager for the Ink terminal UI.
 *
 * Pure state — tracks activeElement and a focus stack. Has no reference
 * to the tree; callers pass the root when tree walks are needed.
 *
 * Stored on the root DOMElement so any node can reach it by walking
 * parentNode (like browser's `node.ownerDocument`).
 */
// FocusManager 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class FocusManager {
  activeElement: DOMElement | null = null
  private dispatchFocusEvent: (target: DOMElement, event: FocusEvent) => boolean
  private enabled = true
  private focusStack: DOMElement[] = []

  // 构造函数初始化实例状态，确保终端渲染后续方法读取到完整配置。
  constructor(
    // 这个回调绑定到 dispatchFocusEvent: (target: DOMElement, event: FocusEvent) => boolean,，负责终端渲染在该局部场景下的响应。
    dispatchFocusEvent: (target: DOMElement, event: FocusEvent) => boolean,
  ) {
    // 更新实例字段 dispatchFocusEvent 为 dispatchFocusEvent，同步终端渲染的内部状态。
    this.dispatchFocusEvent = dispatchFocusEvent
  }

  // focus 使用 node: DOMElement 完成终端渲染里的对应操作。
  focus(node: DOMElement): void {
    // 满足 `node === this.activeElement` 时，终端渲染执行该分支。
    if (node === this.activeElement) return
    // this.enabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.enabled) return

    // previous 集合保存`this.activeElement`，供后续判断或组装使用。
    const previous = this.activeElement
    // 满足 `previous` 时，终端渲染执行该分支。
    if (previous) {
      // Deduplicate before pushing to prevent unbounded growth from Tab cycling
      // idx保存`focusStack.indexOf`，供终端渲染后续处理使用。
      const idx = this.focusStack.indexOf(previous)
      // `idx` 与 `-1) this.focusStack.splice(idx,...` 不一致时刷新派生状态，避免使用过期结果。
      if (idx !== -1) this.focusStack.splice(idx, 1)
      // focusStack追加新条目，保持收集顺序与输入顺序一致。
      this.focusStack.push(previous)
      // 满足 `this.focusStack.length > MAX_FOCUS_STACK) this.focusStack.shift(` 时，终端渲染执行该分支。
      if (this.focusStack.length > MAX_FOCUS_STACK) this.focusStack.shift()
      // 调用 this.dispatchFocusEvent，触发终端渲染此处需要的副作用。
      this.dispatchFocusEvent(previous, new FocusEvent('blur', node))
    }
    // 更新实例字段 activeElement 为 node，同步终端渲染的内部状态。
    this.activeElement = node
    // 调用 this.dispatchFocusEvent，触发终端渲染此处需要的副作用。
    this.dispatchFocusEvent(node, new FocusEvent('focus', previous))
  }

  // blur 使用 无 完成终端渲染里的对应操作。
  blur(): void {
    // this.activeElement缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.activeElement) return

    // previous 集合保存`this.activeElement`，供后续判断或组装使用。
    const previous = this.activeElement
    // 更新实例字段 activeElement 为 null，同步终端渲染的内部状态。
    this.activeElement = null
    // 调用 this.dispatchFocusEvent，触发终端渲染此处需要的副作用。
    this.dispatchFocusEvent(previous, new FocusEvent('blur', null))
  }

  /**
   * Called by the reconciler when a node is removed from the tree.
   * Handles both the exact node and any focused descendant within
   * the removed subtree. Dispatches blur and restores focus from stack.
   */
  // handleNodeRemoved 使用 node: DOMElement, root: DOMElement 完成终端渲染里的对应操作。
  handleNodeRemoved(node: DOMElement, root: DOMElement): void {
    // Remove the node and any descendants from the stack
    // 更新实例字段 focusStack 为 this.focusStack.filter(，同步终端渲染的内部状态。
    this.focusStack = this.focusStack.filter(
      n => n !== node && isInTree(n, root),
    )

    // Check if activeElement is the removed node OR a descendant
    // this.activeElement缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.activeElement) return
    // `this.activeElement` 与 `node && isInTree(this.activeEle...` 不一致时刷新派生状态，避免使用过期结果。
    if (this.activeElement !== node && isInTree(this.activeElement, root)) {
      // Ink 渲染层 focus在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // removed保存`this.activeElement`，供Ink 渲染层 focus后续判断或输出使用。
    const removed = this.activeElement
    // 更新实例字段 activeElement 为 null，同步终端渲染的内部状态。
    this.activeElement = null
    // 调用 this.dispatchFocusEvent，触发终端渲染此处需要的副作用。
    this.dispatchFocusEvent(removed, new FocusEvent('blur', null))

    // Restore focus to the most recent still-mounted element
    // while 使用 this.focusStack.length > 0 完成终端渲染里的对应操作。
    while (this.focusStack.length > 0) {
      // candidate保存`focusStack.pop`，供终端渲染后续处理使用。
      const candidate = this.focusStack.pop()!
      // 满足 `isInTree(candidate, root)` 时，终端渲染执行该分支。
      if (isInTree(candidate, root)) {
        // 更新实例字段 activeElement 为 candidate，同步终端渲染的内部状态。
        this.activeElement = candidate
        // 调用 this.dispatchFocusEvent，触发终端渲染此处需要的副作用。
        this.dispatchFocusEvent(candidate, new FocusEvent('focus', removed))
        // Ink 渲染层 focus在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
  }

  // handleAutoFocus 使用 node: DOMElement 完成终端渲染里的对应操作。
  handleAutoFocus(node: DOMElement): void {
    // 调用 this.focus，触发终端渲染此处需要的副作用。
    this.focus(node)
  }

  // handleClickFocus 使用 node: DOMElement 完成终端渲染里的对应操作。
  handleClickFocus(node: DOMElement): void {
    // tabIndex 索引读取 `node.attributes['tabIndex']` 对应条目，后续围绕该成员继续处理。
    const tabIndex = node.attributes['tabIndex']
    // `typeof tabIndex` 与 `'number'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof tabIndex !== 'number') return
    // 调用 this.focus，触发终端渲染此处需要的副作用。
    this.focus(node)
  }

  // enable 使用 无 完成终端渲染里的对应操作。
  enable(): void {
    // 更新实例字段 enabled 为 true，同步终端渲染的内部状态。
    this.enabled = true
  }

  // disable 使用 无 完成终端渲染里的对应操作。
  disable(): void {
    // 更新实例字段 enabled 为 false，同步终端渲染的内部状态。
    this.enabled = false
  }

  // focusNext 使用 root: DOMElement 完成终端渲染里的对应操作。
  focusNext(root: DOMElement): void {
    // 调用 this.moveFocus，触发终端渲染此处需要的副作用。
    this.moveFocus(1, root)
  }

  // focusPrevious 使用 root: DOMElement 完成终端渲染里的对应操作。
  focusPrevious(root: DOMElement): void {
    // 调用 this.moveFocus，触发终端渲染此处需要的副作用。
    this.moveFocus(-1, root)
  }

  // Ink 渲染层 focus在这里处理 `private moveFocus(direction: 1 | -1, root: DOMElement): void {`，完成这一小步状态转换。
  private moveFocus(direction: 1 | -1, root: DOMElement): void {
    // this.enabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.enabled) return

    // tabbable保存`collectTabbable`，供终端渲染后续处理使用。
    const tabbable = collectTabbable(root)
    // tabbable为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (tabbable.length === 0) return

    // currentIndex 索引保存`this.activeElement`，供Ink 渲染层 focus后续判断或输出使用。
    const currentIndex = this.activeElement
      ? tabbable.indexOf(this.activeElement)
      : -1

    // nextIndex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : tabbable.length - 1
        : (currentIndex + direction + tabbable.length) % tabbable.length

    // next 命名 `tabbable[nextIndex]`，让后续代码直接表达这个值的用途。
    const next = tabbable[nextIndex]
    // 满足 `next` 时，终端渲染执行该分支。
    if (next) {
      // 调用 this.focus，触发终端渲染此处需要的副作用。
      this.focus(next)
    }
  }
}

// collectTabbable 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectTabbable(root: DOMElement): DOMElement[] {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: DOMElement[] = []
  // 调用 walkTree，触发终端渲染此处需要的副作用。
  walkTree(root, result)
  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

// walkTree 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkTree(node: DOMElement, result: DOMElement[]): void {
  // tabIndex 索引读取 `node.attributes['tabIndex']` 对应条目，后续围绕该成员继续处理。
  const tabIndex = node.attributes['tabIndex']
  // 只有 `typeof tabIndex === 'number' && tabIndex >= 0` 满足时，终端渲染才执行该分支。
  if (typeof tabIndex === 'number' && tabIndex >= 0) {
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(node)
  }

  // 按顺序遍历 `node.childNodes` 中的child，逐个交给终端渲染处理。
  for (const child of node.childNodes) {
    // `child.nodeName` 与 `'#text'` 不一致时刷新派生状态，避免使用过期结果。
    if (child.nodeName !== '#text') {
      // 调用 walkTree，触发终端渲染此处需要的副作用。
      walkTree(child, result)
    }
  }
}

// isInTree 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInTree(node: DOMElement, root: DOMElement): boolean {
  // current保存`node`，供Ink 渲染层 focus后续判断或输出使用。
  let current: DOMElement | undefined = node
  // while 使用 current 完成终端渲染里的对应操作。
  while (current) {
    // 满足 `current === root` 时，终端渲染执行该分支。
    if (current === root) return true
    // current更新为 `current.parentNode`，确保Ink 渲染层后续读取最新状态。
    current = current.parentNode
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Walk up to root and return it. The root is the node that holds
 * the FocusManager — like browser's `node.getRootNode()`.
 */
// getRootNode 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRootNode(node: DOMElement): DOMElement {
  // current保存`node`，供Ink 渲染层 focus后续判断或输出使用。
  let current: DOMElement | undefined = node
  // while 使用 current 完成终端渲染里的对应操作。
  while (current) {
    // 满足 `current.focusManager` 时，终端渲染执行该分支。
    if (current.focusManager) return current
    // current更新为 `current.parentNode`，确保Ink 渲染层后续读取最新状态。
    current = current.parentNode
  }
  // 抛出 new Error('Node is not in a tree with a FocusManager')，阻止终端渲染在无效状态下继续运行。
  throw new Error('Node is not in a tree with a FocusManager')
}

/**
 * Walk up to root and return its FocusManager.
 * Like browser's `node.ownerDocument` — focus belongs to the root.
 */
// getFocusManager 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFocusManager(node: DOMElement): FocusManager {
  // 返回 `getRootNode(node).focusManager!`，作为终端渲染这次计算的结果。
  return getRootNode(node).focusManager!
}
