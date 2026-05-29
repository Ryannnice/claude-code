// 引入 useContext、useMemo、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useMemo, useSyncExternalStore } from 'react'
// 复用 StdinContext 终端界面组件，避免在这里重复拼装显示逻辑。
import StdinContext from '../components/StdinContext.js'
// 引入 instances，将 ../instances.js 中已经封装好的能力接到本文件流程里。
import instances from '../instances.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type FocusMove,
  type SelectionState,
  shiftAnchor,
} from '../selection.js'

/**
 * Access to text selection operations on the Ink instance (fullscreen only).
 * Returns no-op functions when fullscreen mode is disabled.
 */
// useSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSelection(): {
  // 这个回调绑定到 copySelection: () => string，负责终端渲染在该局部场景下的响应。
  copySelection: () => string
  /** Copy without clearing the highlight (for copy-on-select). */
  // 这个回调绑定到 copySelectionNoClear: () => string，负责终端渲染在该局部场景下的响应。
  copySelectionNoClear: () => string
  // 这个回调绑定到 clearSelection: () => void，负责终端渲染在该局部场景下的响应。
  clearSelection: () => void
  // 这个回调绑定到 hasSelection: () => boolean，负责终端渲染在该局部场景下的响应。
  hasSelection: () => boolean
  /** Read the raw mutable selection state (for drag-to-scroll). */
  // 这个回调绑定到 getState: () => SelectionState | null，负责终端渲染在该局部场景下的响应。
  getState: () => SelectionState | null
  /** Subscribe to selection mutations (start/update/finish/clear). */
  // 这个回调绑定到 subscribe: (cb: () => void) => () => void，负责终端渲染在该局部场景下的响应。
  subscribe: (cb: () => void) => () => void
  /** Shift the anchor row by dRow, clamped to [minRow, maxRow]. */
  // 这个回调绑定到 shiftAnchor: (dRow: number, minRow: number, maxRow: number) => void，负责终端渲染在该局部场景下的响应。
  shiftAnchor: (dRow: number, minRow: number, maxRow: number) => void
  /** Shift anchor AND focus by dRow (keyboard scroll: whole selection
   *  tracks content). Clamped points get col reset to the full-width edge
   *  since their content was captured by captureScrolledRows. Reads
   *  screen.width from the ink instance for the col-reset boundary. */
  // 这个回调绑定到 shiftSelection: (dRow: number, minRow: number, maxRow: number) => void，负责终端渲染在该局部场景下的响应。
  shiftSelection: (dRow: number, minRow: number, maxRow: number) => void
  /** Keyboard selection extension (shift+arrow): move focus, anchor fixed.
   *  Left/right wrap across rows; up/down clamp at viewport edges. */
  // 这个回调绑定到 moveFocus: (move: FocusMove) => void，负责终端渲染在该局部场景下的响应。
  moveFocus: (move: FocusMove) => void
  /** Capture text from rows about to scroll out of the viewport (call
   *  BEFORE scrollBy so the screen buffer still has the outgoing rows). */
  // Ink 渲染层 use selection在这里处理 `captureScrolledRows: (`，完成这一小步状态转换。
  captureScrolledRows: (
    firstRow: number,
    lastRow: number,
    side: 'above' | 'below',
  ) => void
  /** Set the selection highlight bg color (theme-piping; solid bg
   *  replaces the old SGR-7 inverse so syntax highlighting stays readable
   *  under selection). Call once on mount + whenever theme changes. */
  // 这个回调绑定到 setSelectionBgColor: (color: string) => void，负责终端渲染在该局部场景下的响应。
  setSelectionBgColor: (color: string) => void
} {
  // Look up the Ink instance via stdout — same pattern as instances map.
  // StdinContext is available (it's always provided), and the Ink instance
  // is keyed by stdout which we can get from process.stdout since there's
  // only one Ink instance per process in practice.
  // 调用 useContext，触发终端渲染此处需要的副作用。
  useContext(StdinContext) // anchor to App subtree for hook rules
  // ink读取`instances.get`，供终端渲染后续处理使用。
  const ink = instances.get(process.stdout)
  // Memoize so callers can safely use the return value in dependency arrays.
  // ink is a singleton per stdout — stable across renders.
  // 返回 `useMemo(() => {`，作为终端渲染这次计算的结果。
  return useMemo(() => {
    // ink缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!ink) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        // 这个回调绑定到 copySelection: () => '',，负责终端渲染在该局部场景下的响应。
        copySelection: () => '',
        // 这个回调绑定到 copySelectionNoClear: () => '',，负责终端渲染在该局部场景下的响应。
        copySelectionNoClear: () => '',
        // 这个回调绑定到 clearSelection: () => {},，负责终端渲染在该局部场景下的响应。
        clearSelection: () => {},
        // 这个回调绑定到 hasSelection: () => false,，负责终端渲染在该局部场景下的响应。
        hasSelection: () => false,
        // 这个回调绑定到 getState: () => null,，负责终端渲染在该局部场景下的响应。
        getState: () => null,
        // 这个回调绑定到 subscribe: () => () => {},，负责终端渲染在该局部场景下的响应。
        subscribe: () => () => {},
        // 这个回调绑定到 shiftAnchor: () => {},，负责终端渲染在该局部场景下的响应。
        shiftAnchor: () => {},
        // 这个回调绑定到 shiftSelection: () => {},，负责终端渲染在该局部场景下的响应。
        shiftSelection: () => {},
        // 这个回调绑定到 moveFocus: () => {},，负责终端渲染在该局部场景下的响应。
        moveFocus: () => {},
        // 这个回调绑定到 captureScrolledRows: () => {},，负责终端渲染在该局部场景下的响应。
        captureScrolledRows: () => {},
        // 这个回调绑定到 setSelectionBgColor: () => {},，负责终端渲染在该局部场景下的响应。
        setSelectionBgColor: () => {},
      }
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      // 这个回调绑定到 copySelection: () => ink.copySelection(),，负责终端渲染在该局部场景下的响应。
      copySelection: () => ink.copySelection(),
      // 这个回调绑定到 copySelectionNoClear: () => ink.copySelectionNoClear(),，负责终端渲染在该局部场景下的响应。
      copySelectionNoClear: () => ink.copySelectionNoClear(),
      // 这个回调绑定到 clearSelection: () => ink.clearTextSelection(),，负责终端渲染在该局部场景下的响应。
      clearSelection: () => ink.clearTextSelection(),
      // 这个回调绑定到 hasSelection: () => ink.hasTextSelection(),，负责终端渲染在该局部场景下的响应。
      hasSelection: () => ink.hasTextSelection(),
      // 这个回调绑定到 getState: () => ink.selection,，负责终端渲染在该局部场景下的响应。
      getState: () => ink.selection,
      // 这个回调绑定到 subscribe: (cb: () => void) => ink.subscribeToSelectionChange(cb),，负责终端渲染在该局部场景下的响应。
      subscribe: (cb: () => void) => ink.subscribeToSelectionChange(cb),
      // 这个回调绑定到 shiftAnchor: (dRow: number, minRow: number, maxRow: number) =>，负责终端渲染在该局部场景下的响应。
      shiftAnchor: (dRow: number, minRow: number, maxRow: number) =>
        shiftAnchor(ink.selection, dRow, minRow, maxRow),
      // 这个回调绑定到 shiftSelection: (dRow, minRow, maxRow) =>，负责终端渲染在该局部场景下的响应。
      shiftSelection: (dRow, minRow, maxRow) =>
        ink.shiftSelectionForScroll(dRow, minRow, maxRow),
      // 这个回调绑定到 moveFocus: (move: FocusMove) => ink.moveSelectionFocus(move),，负责终端渲染在该局部场景下的响应。
      moveFocus: (move: FocusMove) => ink.moveSelectionFocus(move),
      // 这个回调绑定到 captureScrolledRows: (firstRow, lastRow, side) =>，负责终端渲染在该局部场景下的响应。
      captureScrolledRows: (firstRow, lastRow, side) =>
        ink.captureScrolledRows(firstRow, lastRow, side),
      // 这个回调绑定到 setSelectionBgColor: (color: string) => ink.setSelectionBgColor(color),，负责终端渲染在该局部场景下的响应。
      setSelectionBgColor: (color: string) => ink.setSelectionBgColor(color),
    }
  }, [ink])
}

// NO_SUBSCRIBE封装成回调，供Ink 渲染层 use selection在事件触发或异步步骤中调用。
const NO_SUBSCRIBE = () => () => {}
// ALWAYS_FALSE封装成回调，供Ink 渲染层 use selection在事件触发或异步步骤中调用。
const ALWAYS_FALSE = () => false

/**
 * Reactive selection-exists state. Re-renders the caller when a text
 * selection is created or cleared. Always returns false outside
 * fullscreen mode (selection is only available in alt-screen).
 */
// useHasSelection 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useHasSelection(): boolean {
  // 调用 useContext，触发终端渲染此处需要的副作用。
  useContext(StdinContext)
  // ink读取`instances.get`，供终端渲染后续处理使用。
  const ink = instances.get(process.stdout)
  // 返回 `useSyncExternalStore(`，作为终端渲染这次计算的结果。
  return useSyncExternalStore(
    ink ? ink.subscribeToSelectionChange : NO_SUBSCRIBE,
    ink ? ink.hasTextSelection : ALWAYS_FALSE,
  )
}
