// 引入 useCallback、useContext、useLayoutEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useContext, useLayoutEffect, useRef } from 'react'
// 复用 TerminalSizeContext 终端界面组件，避免在这里重复拼装显示逻辑。
import { TerminalSizeContext } from '../components/TerminalSizeContext.js'
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js'

// ViewportEntry 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ViewportEntry = {
  /**
   * Whether the element is currently within the terminal viewport
   */
  isVisible: boolean
}

/**
 * Hook to detect if a component is within the terminal viewport.
 *
 * Returns a callback ref and a viewport entry object.
 * Attach the ref to the component you want to track.
 *
 * The entry is updated during the layout phase (useLayoutEffect) so callers
 * always read fresh values during render. Visibility changes do NOT trigger
 * re-renders on their own — callers that re-render for other reasons (e.g.
 * animation ticks, state changes) will pick up the latest value naturally.
 * This avoids infinite update loops when combined with other layout effects
 * that also call setState.
 *
 * @example
 * const [ref, entry] = useTerminalViewport()
 * return <Box ref={ref}><Animation enabled={entry.isVisible}>...</Animation></Box>
 */
// useTerminalViewport 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTerminalViewport(): [
  // 这个回调绑定到 ref: (element: DOMElement | null) => void,，负责终端渲染在该局部场景下的响应。
  ref: (element: DOMElement | null) => void,
  entry: ViewportEntry,
] {
  // terminalSize保存`useContext`，供终端渲染后续处理使用。
  const terminalSize = useContext(TerminalSizeContext)
  // elementRef 引用保存 hook 状态，让Ink 渲染层 use terminal viewport跨渲染复用同一个容器。
  const elementRef = useRef<DOMElement | null>(null)
  // entryRef 引用保存 hook 状态，让Ink 渲染层 use terminal viewport跨渲染复用同一个容器。
  const entryRef = useRef<ViewportEntry>({ isVisible: true })

  // setElement保存`useCallback`，供终端渲染后续处理使用。
  const setElement = useCallback((el: DOMElement | null) => {
    // current更新为 `el`，确保Ink 渲染层后续读取最新状态。
    elementRef.current = el
  }, [])

  // Runs on every render because yoga layout values can change
  // without React being aware. Only updates the ref — no setState
  // to avoid cascading re-renders during the commit phase.
  // Walks the DOM ancestor chain fresh each time to avoid holding stale
  // references after yoga tree rebuilds.
  // 调用 useLayoutEffect，触发终端渲染此处需要的副作用。
  useLayoutEffect(() => {
    // element 命名 `elementRef.current`，让后续代码直接表达这个值的用途。
    const element = elementRef.current
    // 只有 `!element?.yogaNode || !terminalSize` 满足时，终端渲染才执行该分支。
    if (!element?.yogaNode || !terminalSize) {
      // Ink 渲染层 use terminal viewport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // height读取`yogaNode.getComputedHeight`，供终端渲染后续处理使用。
    const height = element.yogaNode.getComputedHeight()
    // rows 集合保存`terminalSize.rows`，供Ink 渲染层 use terminal viewport后续判断或输出使用。
    const rows = terminalSize.rows

    // Walk the DOM parent chain (not yoga.getParent()) so we can detect
    // scroll containers and subtract their scrollTop. Yoga computes layout
    // positions without scroll offset — scrollTop is applied at render time.
    // Without this, an element inside a ScrollBox whose yoga position exceeds
    // terminalRows would be considered offscreen even when scrolled into view
    // (e.g., the spinner in fullscreen mode after enough messages accumulate).
    // absoluteTop读取`yogaNode.getComputedTop`，供终端渲染后续处理使用。
    let absoluteTop = element.yogaNode.getComputedTop()
    // parent 命名 `element.parentNode`，让后续代码直接表达这个值的用途。
    let parent: DOMElement | undefined = element.parentNode
    // root 命名 `element.yogaNode`，让后续代码直接表达这个值的用途。
    let root = element.yogaNode
    // while 使用 parent 完成终端渲染里的对应操作。
    while (parent) {
      // 满足 `parent.yogaNode` 时，终端渲染执行该分支。
      if (parent.yogaNode) {
        // Ink 渲染层 use terminal viewport在这里处理 `absoluteTop += parent.yogaNode.getComputedTop()`，完成这一小步状态转换。
        absoluteTop += parent.yogaNode.getComputedTop()
        // root更新为 `parent.yogaNode`，确保Ink 渲染层后续读取最新状态。
        root = parent.yogaNode
      }
      // scrollTop is only ever set on scroll containers (by ScrollBox + renderer).
      // Non-scroll nodes have undefined scrollTop → falsy fast-path.
      // 满足 `parent.scrollTop` 时，终端渲染执行该分支。
      if (parent.scrollTop) absoluteTop -= parent.scrollTop
      // parent更新为 `parent.parentNode`，确保Ink 渲染层后续读取最新状态。
      parent = parent.parentNode
    }

    // Only the root's height matters
    // screenHeight读取`root.getComputedHeight`，供终端渲染后续处理使用。
    const screenHeight = root.getComputedHeight()

    // bottom保存`absoluteTop + height`，供后续判断或组装使用。
    const bottom = absoluteTop + height
    // When content overflows the viewport (screenHeight > rows), the
    // cursor-restore at frame end scrolls one extra row into scrollback.
    // log-update.ts accounts for this with scrollbackRows = viewportY + 1.
    // We must match, otherwise an element at the boundary is considered
    // "visible" here (animation keeps ticking) but its row is treated as
    // scrollback by log-update (content change → full reset → flicker).
    // cursorRestoreScroll 命名 `screenHeight > rows ? 1 : 0`，让后续代码直接表达这个值的用途。
    const cursorRestoreScroll = screenHeight > rows ? 1 : 0
    // viewportY保存`Math.max`，供终端渲染后续处理使用。
    const viewportY = Math.max(0, screenHeight - rows) + cursorRestoreScroll
    // viewportBottom 命名 `viewportY + rows`，让后续代码直接表达这个值的用途。
    const viewportBottom = viewportY + rows
    // visible标记Ink 渲染层 use terminal viewport是否启用对应路径。
    const visible = bottom > viewportY && absoluteTop < viewportBottom

    // `visible` 与 `entryRef.current.isVisible` 不一致时刷新派生状态，避免使用过期结果。
    if (visible !== entryRef.current.isVisible) {
      // current更新为 `{ isVisible: visible }`，确保Ink 渲染层后续读取最新状态。
      entryRef.current = { isVisible: visible }
    }
  })

  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [setElement, entryRef.current]
}
