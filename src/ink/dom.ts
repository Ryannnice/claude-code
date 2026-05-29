// 类型依赖 { FocusManager } 来自 ./focus.js，用于校准终端渲染的数据契约。
import type { FocusManager } from './focus.js'
// 引入 createLayoutNode，将 ./layout/engine.js 中已经封装好的能力接到本文件流程里。
import { createLayoutNode } from './layout/engine.js'
// 类型依赖 { LayoutNode } 来自 ./layout/node.js，用于校准终端渲染的数据契约。
import type { LayoutNode } from './layout/node.js'
// 引入 LayoutDisplay、LayoutMeasureMode，将 ./layout/node.js 中已经封装好的能力接到本文件流程里。
import { LayoutDisplay, LayoutMeasureMode } from './layout/node.js'
// 引入 measureText，将 ./measure-text.js 中已经封装好的能力接到本文件流程里。
import measureText from './measure-text.js'
// 引入 addPendingClear、nodeCache，将 ./node-cache.js 中已经封装好的能力接到本文件流程里。
import { addPendingClear, nodeCache } from './node-cache.js'
// 引入 squashTextNodes，将 ./squash-text-nodes.js 中已经封装好的能力接到本文件流程里。
import squashTextNodes from './squash-text-nodes.js'
// 类型依赖 { Styles, TextStyles } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Styles, TextStyles } from './styles.js'
// 引入 expandTabs，将 ./tabstops.js 中已经封装好的能力接到本文件流程里。
import { expandTabs } from './tabstops.js'
// 引入 wrapText，将 ./wrap-text.js 中已经封装好的能力接到本文件流程里。
import wrapText from './wrap-text.js'

// InkNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type InkNode = {
  parentNode: DOMElement | undefined
  yogaNode?: LayoutNode
  style: Styles
}

// TextName 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextName = '#text'
// ElementNames 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElementNames =
  | 'ink-root'
  | 'ink-box'
  | 'ink-text'
  | 'ink-virtual-text'
  | 'ink-link'
  | 'ink-progress'
  | 'ink-raw-ansi'

// NodeNames 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type NodeNames = ElementNames | TextName

// eslint-disable-next-line @typescript-eslint/naming-convention
// DOMElement 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type DOMElement = {
  nodeName: ElementNames
  attributes: Record<string, DOMNodeAttribute>
  childNodes: DOMNode[]
  textStyles?: TextStyles

  // Internal properties
  // 这个回调绑定到 onComputeLayout?: () => void，负责终端渲染在该局部场景下的响应。
  onComputeLayout?: () => void
  // 这个回调绑定到 onRender?: () => void，负责终端渲染在该局部场景下的响应。
  onRender?: () => void
  // 这个回调绑定到 onImmediateRender?: () => void，负责终端渲染在该局部场景下的响应。
  onImmediateRender?: () => void
  // Used to skip empty renders during React 19's effect double-invoke in test mode
  hasRenderedContent?: boolean

  // When true, this node needs re-rendering
  dirty: boolean
  // Set by the reconciler's hideInstance/unhideInstance; survives style updates.
  isHidden?: boolean
  // Event handlers set by the reconciler for the capture/bubble dispatcher.
  // Stored separately from attributes so handler identity changes don't
  // mark dirty and defeat the blit optimization.
  _eventHandlers?: Record<string, unknown>

  // Scroll state for overflow: 'scroll' boxes. scrollTop is the number of
  // rows the content is scrolled down by. scrollHeight/scrollViewportHeight
  // are computed at render time and stored for imperative access. stickyScroll
  // auto-pins scrollTop to the bottom when content grows.
  scrollTop?: number
  // Accumulated scroll delta not yet applied to scrollTop. The renderer
  // drains this at SCROLL_MAX_PER_FRAME rows/frame so fast flicks show
  // intermediate frames instead of one big jump. Direction reversal
  // naturally cancels (pure accumulator, no target tracking).
  pendingScrollDelta?: number
  // Render-time clamp bounds for virtual scroll. useVirtualScroll writes
  // the currently-mounted children's coverage span; render-node-to-output
  // clamps scrollTop to stay within it. Prevents blank screen when
  // scrollTo's direct write races past React's async re-render — instead
  // of painting spacer (blank), the renderer holds at the edge of mounted
  // content until React catches up (next commit updates these bounds and
  // the clamp releases). Undefined = no clamp (sticky-scroll, cold start).
  scrollClampMin?: number
  scrollClampMax?: number
  scrollHeight?: number
  scrollViewportHeight?: number
  scrollViewportTop?: number
  stickyScroll?: boolean
  // Set by ScrollBox.scrollToElement; render-node-to-output reads
  // el.yogaNode.getComputedTop() (FRESH — same Yoga pass as scrollHeight)
  // and sets scrollTop = top + offset, then clears this. Unlike an
  // imperative scrollTo(N) which bakes in a number that's stale by the
  // time the throttled render fires, the element ref defers the position
  // read to paint time. One-shot.
  scrollAnchor?: { el: DOMElement; offset: number }
  // Only set on ink-root. The document owns focus — any node can
  // reach it by walking parentNode, like browser getRootNode().
  focusManager?: FocusManager
  // React component stack captured at createInstance time (reconciler.ts),
  // e.g. ['ToolUseLoader', 'Messages', 'REPL']. Only populated when
  // CLAUDE_CODE_DEBUG_REPAINTS is set. Used by findOwnerChainAtRow to
  // attribute scrollback-diff full-resets to the component that caused them.
  debugOwnerChain?: string[]
} & InkNode

// TextNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextNode = {
  nodeName: TextName
  nodeValue: string
} & InkNode

// eslint-disable-next-line @typescript-eslint/naming-convention
// DOMNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type DOMNode<T = { nodeName: NodeNames }> = T extends {
  nodeName: infer U
}
  ? U extends '#text'
    ? TextNode
    : DOMElement
  : never

// eslint-disable-next-line @typescript-eslint/naming-convention
// DOMNodeAttribute 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type DOMNodeAttribute = boolean | string | number

// createNode封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const createNode = (nodeName: ElementNames): DOMElement => {
  // needsYogaNode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const needsYogaNode =
    nodeName !== 'ink-virtual-text' &&
    nodeName !== 'ink-link' &&
    nodeName !== 'ink-progress'
  // node 集中保存Ink 渲染层 dom要一起传递的字段。
  const node: DOMElement = {
    nodeName,
    style: {},
    attributes: {},
    childNodes: [],
    parentNode: undefined,
    yogaNode: needsYogaNode ? createLayoutNode() : undefined,
    dirty: false,
  }

  // 当 `nodeName` 匹配 `'ink-text'` 时，终端渲染执行对应分支。
  if (nodeName === 'ink-text') {
    // 调用 node.yogaNode?.setMeasureFunc(measureTextNode.bind(null, node))，完成这一处局部操作。
    node.yogaNode?.setMeasureFunc(measureTextNode.bind(null, node))
  // Ink 渲染层 dom在这里处理 `} else if (nodeName === 'ink-raw-ansi') {`，完成这一小步状态转换。
  } else if (nodeName === 'ink-raw-ansi') {
    // 调用 node.yogaNode?.setMeasureFunc(measureRawAnsiNode.bind(null, node))，完成这一处局部操作。
    node.yogaNode?.setMeasureFunc(measureRawAnsiNode.bind(null, node))
  }

  // 返回 `node`，作为终端渲染这次计算的结果。
  return node
}

// appendChildNode 命名 `(`，让后续代码直接表达这个值的用途。
export const appendChildNode = (
  node: DOMElement,
  childNode: DOMElement,
): void => {
  // 满足 `childNode.parentNode` 时，终端渲染执行该分支。
  if (childNode.parentNode) {
    // 调用 removeChildNode，触发终端渲染此处需要的副作用。
    removeChildNode(childNode.parentNode, childNode)
  }

  // parentNode更新为 `node`，确保Ink 渲染层后续读取最新状态。
  childNode.parentNode = node
  // childNodes 集合追加新条目，保持收集顺序与输入顺序一致。
  node.childNodes.push(childNode)

  // 满足 `childNode.yogaNode` 时，终端渲染执行该分支。
  if (childNode.yogaNode) {
    // Ink 渲染层 dom在这里处理 `node.yogaNode?.insertChild(`，完成这一小步状态转换。
    node.yogaNode?.insertChild(
      childNode.yogaNode,
      node.yogaNode.getChildCount(),
    )
  }

  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// insertBeforeNode 命名 `(`，让后续代码直接表达这个值的用途。
export const insertBeforeNode = (
  node: DOMElement,
  newChildNode: DOMNode,
  beforeChildNode: DOMNode,
): void => {
  // 满足 `newChildNode.parentNode` 时，终端渲染执行该分支。
  if (newChildNode.parentNode) {
    // 调用 removeChildNode，触发终端渲染此处需要的副作用。
    removeChildNode(newChildNode.parentNode, newChildNode)
  }

  // parentNode更新为 `node`，确保Ink 渲染层后续读取最新状态。
  newChildNode.parentNode = node

  // index 索引保存`childNodes.indexOf`，供终端渲染后续处理使用。
  const index = node.childNodes.indexOf(beforeChildNode)

  // 满足 `index >= 0` 时，终端渲染执行该分支。
  if (index >= 0) {
    // Calculate yoga index BEFORE modifying childNodes.
    // We can't use DOM index directly because some children (like ink-progress,
    // ink-link, ink-virtual-text) don't have yogaNodes, so DOM indices don't
    // match yoga indices.
    // yogaIndex 索引保存`0`，供Ink 渲染层 dom后续判断或输出使用。
    let yogaIndex = 0
    // 只有 `newChildNode.yogaNode && node.yogaNode` 满足时，终端渲染才执行该分支。
    if (newChildNode.yogaNode && node.yogaNode) {
      // 按索引扫描 `index`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < index; i++) {
        // 满足 `node.childNodes[i]?.yogaNode` 时，终端渲染执行该分支。
        if (node.childNodes[i]?.yogaNode) {
          // Ink 渲染层 dom在这里处理 `yogaIndex++`，完成这一小步状态转换。
          yogaIndex++
        }
      }
    }

    // 调用 node.childNodes.splice，触发终端渲染此处需要的副作用。
    node.childNodes.splice(index, 0, newChildNode)

    // 只有 `newChildNode.yogaNode && node.yogaNode` 满足时，终端渲染才执行该分支。
    if (newChildNode.yogaNode && node.yogaNode) {
      // 调用 node.yogaNode.insertChild，触发终端渲染此处需要的副作用。
      node.yogaNode.insertChild(newChildNode.yogaNode, yogaIndex)
    }

    // 调用 markDirty，触发终端渲染此处需要的副作用。
    markDirty(node)
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // childNodes 集合追加新条目，保持收集顺序与输入顺序一致。
  node.childNodes.push(newChildNode)

  // 满足 `newChildNode.yogaNode` 时，终端渲染执行该分支。
  if (newChildNode.yogaNode) {
    // Ink 渲染层 dom在这里处理 `node.yogaNode?.insertChild(`，完成这一小步状态转换。
    node.yogaNode?.insertChild(
      newChildNode.yogaNode,
      node.yogaNode.getChildCount(),
    )
  }

  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// removeChildNode保存`(`，供后续判断或组装使用。
export const removeChildNode = (
  node: DOMElement,
  removeNode: DOMNode,
): void => {
  // 满足 `removeNode.yogaNode` 时，终端渲染执行该分支。
  if (removeNode.yogaNode) {
    // 调用 removeNode.parentNode?.yogaNode?.removeChild(removeNode.yogaNode)，完成这一处局部操作。
    removeNode.parentNode?.yogaNode?.removeChild(removeNode.yogaNode)
  }

  // Collect cached rects from the removed subtree so they can be cleared
  // 调用 collectRemovedRects，触发终端渲染此处需要的副作用。
  collectRemovedRects(node, removeNode)

  // parentNode更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  removeNode.parentNode = undefined

  // index 索引保存`childNodes.indexOf`，供终端渲染后续处理使用。
  const index = node.childNodes.indexOf(removeNode)
  // 满足 `index >= 0` 时，终端渲染执行该分支。
  if (index >= 0) {
    // 调用 node.childNodes.splice，触发终端渲染此处需要的副作用。
    node.childNodes.splice(index, 1)
  }

  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// collectRemovedRects 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectRemovedRects(
  parent: DOMElement,
  removed: DOMNode,
  underAbsolute = false,
): void {
  // 当 `removed.nodeName` 匹配 `'#text'` 时，终端渲染执行对应分支。
  if (removed.nodeName === '#text') return
  // elem保存`removed as DOMElement`，供后续判断或组装使用。
  const elem = removed as DOMElement
  // If this node or any ancestor in the removed subtree was absolute,
  // its painted pixels may overlap non-siblings — flag for global blit
  // disable. Normal-flow removals only affect direct siblings, which
  // hasRemovedChild already handles.
  // isAbsolute标记Ink 渲染层 dom是否启用对应路径。
  const isAbsolute = underAbsolute || elem.style.position === 'absolute'
  // cached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
  const cached = nodeCache.get(elem)
  // 满足 `cached` 时，终端渲染执行该分支。
  if (cached) {
    // 调用 addPendingClear，触发终端渲染此处需要的副作用。
    addPendingClear(parent, cached, isAbsolute)
    // 调用 nodeCache.delete，触发终端渲染此处需要的副作用。
    nodeCache.delete(elem)
  }
  // 按顺序遍历 `elem.childNodes` 中的child，逐个交给终端渲染处理。
  for (const child of elem.childNodes) {
    // 调用 collectRemovedRects，触发终端渲染此处需要的副作用。
    collectRemovedRects(parent, child, isAbsolute)
  }
}

// setAttribute保存`(`，供后续判断或组装使用。
export const setAttribute = (
  node: DOMElement,
  key: string,
  value: DOMNodeAttribute,
): void => {
  // Skip 'children' - React handles children via appendChild/removeChild,
  // not attributes. React always passes a new children reference, so
  // tracking it as an attribute would mark everything dirty every render.
  // 当 `key` 匹配 `'children'` 时，终端渲染执行对应分支。
  if (key === 'children') {
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Skip if unchanged
  // 满足 `node.attributes[key] === value` 时，终端渲染执行该分支。
  if (node.attributes[key] === value) {
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // attributes[key更新为 `value`，确保Ink 渲染层 dom后续读取最新状态。
  node.attributes[key] = value
  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// setStyle封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const setStyle = (node: DOMNode, style: Styles): void => {
  // Compare style properties to avoid marking dirty unnecessarily.
  // React creates new style objects on every render even when unchanged.
  // 满足 `stylesEqual(node.style, style)` 时，终端渲染执行该分支。
  if (stylesEqual(node.style, style)) {
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // style更新为 `style`，确保Ink 渲染层后续读取最新状态。
  node.style = style
  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// setTextStyles 集合保存`(`，供后续判断或组装使用。
export const setTextStyles = (
  node: DOMElement,
  textStyles: TextStyles,
): void => {
  // Same dirty-check guard as setStyle: React (and buildTextStyles in Text.tsx)
  // allocate a new textStyles object on every render even when values are
  // unchanged, so compare by value to avoid markDirty -> yoga re-measurement
  // on every Text re-render.
  // 满足 `shallowEqual(node.textStyles, textStyles)` 时，终端渲染执行该分支。
  if (shallowEqual(node.textStyles, textStyles)) {
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // textStyles 集合更新为 `textStyles`，确保Ink 渲染层后续读取最新状态。
  node.textStyles = textStyles
  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// stylesEqual 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stylesEqual(a: Styles, b: Styles): boolean {
  // 返回 `shallowEqual(a, b)`，作为终端渲染这次计算的结果。
  return shallowEqual(a, b)
}

function shallowEqual<T extends object>(
  a: T | undefined,
  b: T | undefined,
): boolean {
  // Fast path: same object reference (or both undefined)
  // 满足 `a === b` 时，终端渲染执行该分支。
  if (a === b) return true
  // 只有 `a === undefined || b === undefined` 满足时，终端渲染才执行该分支。
  if (a === undefined || b === undefined) return false

  // Get all keys from both objects
  // aKeys 集合派生`Object.keys`，供终端渲染后续处理使用。
  const aKeys = Object.keys(a) as (keyof T)[]
  // bKeys 集合派生`Object.keys`，供终端渲染后续处理使用。
  const bKeys = Object.keys(b) as (keyof T)[]

  // Different number of properties
  // `aKeys.length` 与 `bKeys.length` 不一致时刷新派生状态，避免使用过期结果。
  if (aKeys.length !== bKeys.length) return false

  // Compare each property
  // 按顺序遍历 `aKeys` 中的key，逐个交给终端渲染处理。
  for (const key of aKeys) {
    // `a[key]` 与 `b[key]` 不一致时刷新派生状态，避免使用过期结果。
    if (a[key] !== b[key]) return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// createTextNode封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const createTextNode = (text: string): TextNode => {
  // node 集中保存Ink 渲染层 dom要一起传递的字段。
  const node: TextNode = {
    nodeName: '#text',
    nodeValue: text,
    yogaNode: undefined,
    parentNode: undefined,
    style: {},
  }

  // setTextNodeValue 写入新的状态值，使终端渲染后续读取保持一致。
  setTextNodeValue(node, text)

  // 返回 `node`，作为终端渲染这次计算的结果。
  return node
}

// measureTextNode保存`function`，供终端渲染后续处理使用。
const measureTextNode = function (
  node: DOMNode,
  width: number,
  widthMode: LayoutMeasureMode,
): { width: number; height: number } {
  // rawText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rawText =
    node.nodeName === '#text' ? node.nodeValue : squashTextNodes(node)

  // Expand tabs for measurement (worst case: 8 spaces each).
  // Actual tab expansion happens in output.ts based on screen position.
  // 文本保存`expandTabs`，供终端渲染后续处理使用。
  const text = expandTabs(rawText)

  // dimensions 集合保存`measureText`，供终端渲染后续处理使用。
  const dimensions = measureText(text, width)

  // Text fits into container, no need to wrap
  // 满足 `dimensions.width <= width` 时，终端渲染执行该分支。
  if (dimensions.width <= width) {
    // 返回 `dimensions`，作为终端渲染这次计算的结果。
    return dimensions
  }

  // This is happening when <Box> is shrinking child nodes and layout asks
  // if we can fit this text node in a <1px space, so we just say "no"
  // 只有 `dimensions.width >= 1 && width > 0 && width < 1` 满足时，终端渲染才执行该分支。
  if (dimensions.width >= 1 && width > 0 && width < 1) {
    // 返回 `dimensions`，作为终端渲染这次计算的结果。
    return dimensions
  }

  // For text with embedded newlines (pre-wrapped content), avoid re-wrapping
  // at measurement width when layout is asking for intrinsic size (Undefined mode).
  // This prevents height inflation during min/max size checks.
  //
  // However, when layout provides an actual constraint (Exactly or AtMost mode),
  // we must respect it and measure at that width. Otherwise, if the actual
  // rendering width is smaller than the natural width, the text will wrap to
  // more lines than layout expects, causing content to be truncated.
  // 只有 `text.includes('\n') && widthMode === LayoutMeasureMode.Undefined` 满足时，终端渲染才执行该分支。
  if (text.includes('\n') && widthMode === LayoutMeasureMode.Undefined) {
    // effectiveWidth保存`Math.max`，供终端渲染后续处理使用。
    const effectiveWidth = Math.max(width, dimensions.width)
    // 返回 `measureText(text, effectiveWidth)`，作为终端渲染这次计算的结果。
    return measureText(text, effectiveWidth)
  }

  // textWrap保存`node.style?.textWrap ?? 'wrap'`，供Ink 渲染层 dom后续判断或输出使用。
  const textWrap = node.style?.textWrap ?? 'wrap'
  // wrappedText保存`wrapText`，供终端渲染后续处理使用。
  const wrappedText = wrapText(text, width, textWrap)

  // 返回 `measureText(wrappedText, width)`，作为终端渲染这次计算的结果。
  return measureText(wrappedText, width)
}

// ink-raw-ansi nodes hold pre-rendered ANSI strings with known dimensions.
// No stringWidth, no wrapping, no tab expansion — the producer (e.g. ColorDiff)
// already wrapped to the target width and each line is exactly one terminal row.
// measureRawAnsiNode保存`function`，供终端渲染后续处理使用。
const measureRawAnsiNode = function (node: DOMElement): {
  width: number
  height: number
} {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    width: node.attributes['rawWidth'] as number,
    height: node.attributes['rawHeight'] as number,
  }
}

/**
 * Mark a node and all its ancestors as dirty for re-rendering.
 * Also marks yoga dirty for text remeasurement if this is a text node.
 */
// markDirty封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const markDirty = (node?: DOMNode): void => {
  // current保存`node`，供后续判断或组装使用。
  let current: DOMNode | undefined = node
  // markedYoga标记Ink 渲染层 dom是否启用对应路径。
  let markedYoga = false

  // while 使用 current 完成终端渲染里的对应操作。
  while (current) {
    // `current.nodeName` 与 `'#text'` 不一致时刷新派生状态，避免使用过期结果。
    if (current.nodeName !== '#text') {
      // Ink 渲染层 dom在这里处理 `;(current as DOMElement).dirty = true`，完成这一小步状态转换。
      ;(current as DOMElement).dirty = true
      // Only mark yoga dirty on leaf nodes that have measure functions
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        !markedYoga &&
        (current.nodeName === 'ink-text' ||
          current.nodeName === 'ink-raw-ansi') &&
        current.yogaNode
      ) {
        // 调用 current.yogaNode.markDirty，触发终端渲染此处需要的副作用。
        current.yogaNode.markDirty()
        // markedYoga更新为 `true`，确保Ink 渲染层后续读取最新状态。
        markedYoga = true
      }
    }
    // current更新为 `current.parentNode`，确保Ink 渲染层后续读取最新状态。
    current = current.parentNode
  }
}

// Walk to root and call its onRender (the throttled scheduleRender). Use for
// DOM-level mutations (scrollTop changes) that should trigger an Ink frame
// without going through React's reconciler. Pair with markDirty() so the
// renderer knows which subtree to re-evaluate.
// scheduleRenderFrom封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const scheduleRenderFrom = (node?: DOMNode): void => {
  // cur保存`node`，供后续判断或组装使用。
  let cur: DOMNode | undefined = node
  // 只要 cur?.parentNode 成立，就持续推进终端渲染中的循环处理。
  while (cur?.parentNode) cur = cur.parentNode
  // `cur && cur.nodeName` 与 `'#text') (cur as DOMElement).on...` 不一致时刷新派生状态，避免使用过期结果。
  if (cur && cur.nodeName !== '#text') (cur as DOMElement).onRender?.()
}

// setTextNodeValue封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const setTextNodeValue = (node: TextNode, text: string): void => {
  // `typeof text` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof text !== 'string') {
    // 文本更新为 `String(text)`，确保Ink 渲染层后续读取最新状态。
    text = String(text)
  }

  // Skip if unchanged
  // 满足 `node.nodeValue === text` 时，终端渲染执行该分支。
  if (node.nodeValue === text) {
    // Ink 渲染层 dom在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // nodeValue更新为 `text`，确保Ink 渲染层后续读取最新状态。
  node.nodeValue = text
  // 调用 markDirty，触发终端渲染此处需要的副作用。
  markDirty(node)
}

// isDOMElement 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDOMElement(node: DOMElement | TextNode): node is DOMElement {
  // 返回 `node.nodeName !== '#text'`，作为终端渲染这次计算的结果。
  return node.nodeName !== '#text'
}

// Clear yogaNode references recursively before freeing.
// freeRecursive() frees the node and ALL its children, so we must clear
// all yogaNode references to prevent dangling pointers.
// clearYogaNodeReferences 集合封装成回调，供Ink 渲染层 dom在事件触发或异步步骤中调用。
export const clearYogaNodeReferences = (node: DOMElement | TextNode): void => {
  // 满足 `'childNodes' in node` 时，终端渲染执行该分支。
  if ('childNodes' in node) {
    // 按顺序遍历 `node.childNodes` 中的child，逐个交给终端渲染处理。
    for (const child of node.childNodes) {
      // 调用 clearYogaNodeReferences，触发终端渲染此处需要的副作用。
      clearYogaNodeReferences(child)
    }
  }
  // yogaNode更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  node.yogaNode = undefined
}

/**
 * Find the React component stack responsible for content at screen row `y`.
 *
 * DFS the DOM tree accumulating yoga offsets. Returns the debugOwnerChain of
 * the deepest node whose bounding box contains `y`. Called from ink.tsx when
 * log-update triggers a full reset, to attribute the flicker to its source.
 *
 * Only useful when CLAUDE_CODE_DEBUG_REPAINTS is set (otherwise chains are
 * undefined and this returns []).
 */
// findOwnerChainAtRow 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findOwnerChainAtRow(root: DOMElement, y: number): string[] {
  // best 从空数组开始收集，后续循环会按处理顺序追加条目。
  let best: string[] = []
  // 调用 walk，触发终端渲染此处需要的副作用。
  walk(root, 0)
  // 返回 `best`，作为终端渲染这次计算的结果。
  return best

  // walk 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function walk(node: DOMElement, offsetY: number): void {
    // yoga保存`node.yogaNode`，供Ink 渲染层 dom后续判断或输出使用。
    const yoga = node.yogaNode
    // 只有 `!yoga || yoga.getDisplay() === LayoutDisplay.None` 满足时，终端渲染才执行该分支。
    if (!yoga || yoga.getDisplay() === LayoutDisplay.None) return

    // top读取`yoga.getComputedTop`，供终端渲染后续处理使用。
    const top = offsetY + yoga.getComputedTop()
    // height读取`yoga.getComputedHeight`，供终端渲染后续处理使用。
    const height = yoga.getComputedHeight()
    // 只有 `y < top || y >= top + height` 满足时，终端渲染才执行该分支。
    if (y < top || y >= top + height) return

    // 满足 `node.debugOwnerChain` 时，终端渲染执行该分支。
    if (node.debugOwnerChain) best = node.debugOwnerChain

    // 按顺序遍历 `node.childNodes` 中的child，逐个交给终端渲染处理。
    for (const child of node.childNodes) {
      // 满足 `isDOMElement(child)) walk(child, top` 时，终端渲染执行该分支。
      if (isDOMElement(child)) walk(child, top)
    }
  }
}
