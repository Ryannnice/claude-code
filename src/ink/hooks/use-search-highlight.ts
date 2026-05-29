// 引入 useContext、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useMemo } from 'react'
// 复用 StdinContext 终端界面组件，避免在这里重复拼装显示逻辑。
import StdinContext from '../components/StdinContext.js'
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js'
// 引入 instances，将 ../instances.js 中已经封装好的能力接到本文件流程里。
import instances from '../instances.js'
// 类型依赖 { MatchPosition } 来自 ../render-to-screen.js，用于校准终端渲染的数据契约。
import type { MatchPosition } from '../render-to-screen.js'

/**
 * Set the search highlight query on the Ink instance. Non-empty → all
 * visible occurrences are inverted on the next frame (SGR 7, screen-buffer
 * overlay, same damage machinery as selection). Empty → clears.
 *
 * This is a screen-space highlight — it matches the RENDERED text, not the
 * source message text. Works for anything visible (bash output, file paths,
 * error messages) regardless of where it came from in the message tree. A
 * query that matched in source but got truncated/ellipsized in rendering
 * won't highlight; that's acceptable — we highlight what you see.
 */
// useSearchHighlight 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSearchHighlight(): {
  // 这个回调绑定到 setQuery: (query: string) => void，负责终端渲染在该局部场景下的响应。
  setQuery: (query: string) => void
  /** Paint an existing DOM subtree (from the MAIN tree) to a fresh
   *  Screen at its natural height, scan. Element-relative positions
   *  (row 0 = element top). Zero context duplication — the element
   *  IS the one built with all real providers. */
  // 这个回调绑定到 scanElement: (el: DOMElement) => MatchPosition[]，负责终端渲染在该局部场景下的响应。
  scanElement: (el: DOMElement) => MatchPosition[]
  /** Position-based CURRENT highlight. Every frame writes yellow at
   *  positions[currentIdx] + rowOffset. The scan-highlight (inverse on
   *  all matches) still runs — this overlays on top. rowOffset tracks
   *  scroll; positions stay stable (message-relative). null clears. */
  // Ink 渲染层 use search highlight在这里处理 `setPositions: (`，完成这一小步状态转换。
  setPositions: (
    state: {
      positions: MatchPosition[]
      rowOffset: number
      currentIdx: number
    } | null,
  ) => void
} {
  // 调用 useContext，触发终端渲染此处需要的副作用。
  useContext(StdinContext) // anchor to App subtree for hook rules
  // ink读取`instances.get`，供终端渲染后续处理使用。
  const ink = instances.get(process.stdout)
  // 返回 `useMemo(() => {`，作为终端渲染这次计算的结果。
  return useMemo(() => {
    // ink缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!ink) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        // 这个回调绑定到 setQuery: () => {},，负责终端渲染在该局部场景下的响应。
        setQuery: () => {},
        // 这个回调绑定到 scanElement: () => [],，负责终端渲染在该局部场景下的响应。
        scanElement: () => [],
        // 这个回调绑定到 setPositions: () => {},，负责终端渲染在该局部场景下的响应。
        setPositions: () => {},
      }
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      // 这个回调绑定到 setQuery: (query: string) => ink.setSearchHighlight(query),，负责终端渲染在该局部场景下的响应。
      setQuery: (query: string) => ink.setSearchHighlight(query),
      // 这个回调绑定到 scanElement: (el: DOMElement) => ink.scanElementSubtree(el),，负责终端渲染在该局部场景下的响应。
      scanElement: (el: DOMElement) => ink.scanElementSubtree(el),
      // 这个回调绑定到 setPositions: state => ink.setSearchPositions(state),，负责终端渲染在该局部场景下的响应。
      setPositions: state => ink.setSearchPositions(state),
    }
  }, [ink])
}
