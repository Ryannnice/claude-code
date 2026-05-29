// 引入 useCallback、useContext、useLayoutEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useContext, useLayoutEffect, useRef } from 'react'
// 复用 CursorDeclarationContext 终端界面组件，避免在这里重复拼装显示逻辑。
import CursorDeclarationContext from '../components/CursorDeclarationContext.js'
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js'

/**
 * Declares where the terminal cursor should be parked after each frame.
 *
 * Terminal emulators render IME preedit text at the physical cursor
 * position, and screen readers / screen magnifiers track the native
 * cursor — so parking it at the text input's caret makes CJK input
 * appear inline and lets accessibility tools follow the input.
 *
 * Returns a ref callback to attach to the Box that contains the input.
 * The declared (line, column) is interpreted relative to that Box's
 * nodeCache rect (populated by renderNodeToOutput).
 *
 * Timing: Both ref attach and useLayoutEffect fire in React's layout
 * phase — after resetAfterCommit calls scheduleRender. scheduleRender
 * defers onRender via queueMicrotask, so onRender runs AFTER layout
 * effects commit and reads the fresh declaration on the first frame
 * (no one-keystroke lag). Test env uses onImmediateRender (synchronous,
 * no microtask), so tests compensate by calling ink.onRender()
 * explicitly after render.
 */
// useDeclaredCursor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDeclaredCursor({
  line,
  column,
  active,
}: {
  line: number
  column: number
  active: boolean
// 这个回调绑定到 }): (element: DOMElement | null) => void {，负责终端渲染在该局部场景下的响应。
}): (element: DOMElement | null) => void {
  // setCursorDeclaration保存`useContext`，供终端渲染后续处理使用。
  const setCursorDeclaration = useContext(CursorDeclarationContext)
  // nodeRef 引用保存 hook 状态，让Ink 渲染层 use declared cursor跨渲染复用同一个容器。
  const nodeRef = useRef<DOMElement | null>(null)

  // setNode保存`useCallback`，供终端渲染后续处理使用。
  const setNode = useCallback((node: DOMElement | null) => {
    // current更新为 `node`，确保Ink 渲染层后续读取最新状态。
    nodeRef.current = node
  }, [])

  // When active, set unconditionally. When inactive, clear conditionally
  // (only if the currently-declared node is ours). The node-identity check
  // handles two hazards:
  //   1. A memo()ized active instance elsewhere (e.g. the search input in
  //      a memo'd Footer) doesn't re-render this commit — an inactive
  //      instance re-rendering here must not clobber it.
  //   2. Sibling handoff (menu focus moving between list items) — when
  //      focus moves opposite to sibling order, the newly-inactive item's
  //      effect runs AFTER the newly-active item's set. Without the node
  //      check it would clobber.
  // No dep array: must re-declare every commit so the active instance
  // re-claims the declaration after another instance's unmount-cleanup or
  // sibling handoff nulls it.
  // 调用 useLayoutEffect，触发终端渲染此处需要的副作用。
  useLayoutEffect(() => {
    // node保存`nodeRef.current`，供Ink 渲染层 use declared cursor后续判断或输出使用。
    const node = nodeRef.current
    // 只有 `active && node` 满足时，终端渲染才执行该分支。
    if (active && node) {
      // setCursorDeclaration 写入新的状态值，使终端渲染后续读取保持一致。
      setCursorDeclaration({ relativeX: column, relativeY: line, node })
    } else {
      // setCursorDeclaration 写入新的状态值，使终端渲染后续读取保持一致。
      setCursorDeclaration(null, node)
    }
  })

  // Clear on unmount (conditionally — another instance may own by then).
  // Separate effect with empty deps so cleanup only fires once — not on
  // every line/column change, which would transiently null between commits.
  // 调用 useLayoutEffect，触发终端渲染此处需要的副作用。
  useLayoutEffect(() => {
    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // setCursorDeclaration 写入新的状态值，使终端渲染后续读取保持一致。
      setCursorDeclaration(null, nodeRef.current)
    }
  }, [setCursorDeclaration])

  // 返回 `setNode`，作为终端渲染这次计算的结果。
  return setNode
}
