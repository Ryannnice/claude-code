// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 复用 useTheme 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTheme } from '../components/design-system/ThemeProvider.js'
// 类型依赖 { useSelection } 来自 ../ink/hooks/use-selection.js，用于校准React hook 状态流的数据契约。
import type { useSelection } from '../ink/hooks/use-selection.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 复用 getTheme 工具函数，把通用处理留在 ../utils/theme.js 中维护。
import { getTheme } from '../utils/theme.js'

// Selection 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Selection = ReturnType<typeof useSelection>

/**
 * Auto-copy the selection to the clipboard when the user finishes dragging
 * (mouse-up with a non-empty selection) or multi-clicks to select a word/line.
 * Mirrors iTerm2's "Copy to pasteboard on selection" — the highlight is left
 * intact so the user can see what was copied. Only fires in alt-screen mode
 * (selection state is ink-instance-owned; outside alt-screen, the native
 * terminal handles selection and this hook is a no-op via the ink stub).
 *
 * selection.subscribe fires on every mutation (start/update/finish/clear/
 * multiclick). Both char drags and multi-clicks set isDragging=true while
 * pressed, so a selection appearing with isDragging=false is always a
 * drag-finish. copiedRef guards against double-firing on spurious notifies.
 *
 * onCopied is optional — when omitted, copy is silent (clipboard is written
 * but no toast/notification fires). FleetView uses this silent mode; the
 * fullscreen REPL passes showCopiedToast for user feedback.
 */
// useCopyOnSelect 封装useCopyOnSelect的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCopyOnSelect(
  selection: Selection,
  isActive: boolean,
  onCopied?: (text: string) => void,
): void {
  // Tracks whether the *previous* notification had a visible selection with
  // isDragging=false (i.e., we already auto-copied it). Without this, the
  // finish→clear transition would look like a fresh selection-gone-idle
  // event and we'd toast twice for a single drag.
  // copiedRef 引用保存`useRef`，供React hook后续处理使用。
  const copiedRef = useRef(false)
  // onCopied is a fresh closure each render; read through a ref so the
  // effect doesn't re-subscribe (which would reset copiedRef via unmount).
  // onCopiedRef 引用保存`useRef`，供React hook后续处理使用。
  const onCopiedRef = useRef(onCopied)
  // current更新为 `onCopied`，确保useCopyOnSelect后续读取最新状态。
  onCopiedRef.current = onCopied

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // isActive缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!isActive) return

    // unsubscribe保存`selection.subscribe`，供React hook后续处理使用。
    const unsubscribe = selection.subscribe(() => {
      // sel读取`selection.getState`，供React hook后续处理使用。
      const sel = selection.getState()
      // has 集合保存`selection.hasSelection`，供React hook后续处理使用。
      const has = selection.hasSelection()
      // Drag in progress — wait for finish. Reset copied flag so a new drag
      // that ends on the same range still triggers a fresh copy.
      // 满足 `sel?.isDragging` 时，React hook执行该分支。
      if (sel?.isDragging) {
        // current更新为 `false`，确保useCopyOnSelect后续读取最新状态。
        copiedRef.current = false
        // React hook use Copy On Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // No selection (cleared, or click-without-drag) — reset.
      // has 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!has) {
        // current更新为 `false`，确保useCopyOnSelect后续读取最新状态。
        copiedRef.current = false
        // React hook use Copy On Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // Selection settled (drag finished OR multi-click). Already copied
      // this one — the only way to get here again without going through
      // isDragging or !has is a spurious notify (shouldn't happen, but safe).
      // 满足 `copiedRef.current` 时，React hook执行该分支。
      if (copiedRef.current) return

      // Default true: macOS users expect cmd+c to work. It can't — the
      // terminal's Edit > Copy intercepts it before the pty sees it, and
      // finds no native selection (mouse tracking disabled it). Auto-copy
      // on mouse-up makes cmd+c a no-op that leaves the clipboard intact
      // with the right content, so paste works as expected.
      // enabled读取`getGlobalConfig`，供React hook后续处理使用。
      const enabled = getGlobalConfig().copyOnSelect ?? true
      // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!enabled) return

      // 文本保存`selection.copySelectionNoClear`，供React hook后续处理使用。
      const text = selection.copySelectionNoClear()
      // Whitespace-only (e.g., blank-line multi-click) — not worth a
      // clipboard write or toast. Still set copiedRef so we don't retry.
      // 组合条件 `!text || !text.trim()` 成立时，React hook 状态流才启用这条专门路径。
      if (!text || !text.trim()) {
        // current更新为 `true`，确保useCopyOnSelect后续读取最新状态。
        copiedRef.current = true
        // React hook use Copy On Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // current更新为 `true`，确保useCopyOnSelect后续读取最新状态。
      copiedRef.current = true
      // 调用 onCopiedRef.current?.(text)，完成这一处局部操作。
      onCopiedRef.current?.(text)
    })
    // 返回 `unsubscribe`，作为React hook 状态流这次计算的结果。
    return unsubscribe
  }, [isActive, selection])
}

/**
 * Pipe the theme's selectionBg color into the Ink StylePool so the
 * selection overlay renders a solid blue bg instead of SGR-7 inverse.
 * Ink is theme-agnostic (layering: colorize.ts "theme resolution happens
 * at component layer, not here") — this is the bridge. Fires on mount
 * (before any mouse input is possible) and again whenever /theme flips,
 * so the selection color tracks the theme live.
 */
// useSelectionBgColor 封装useCopyOnSelect的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSelectionBgColor(selection: Selection): void {
  // 从 `useTheme()` 按位置拆出 themeName，让React hook use Copy On Select分别处理这些返回值。
  const [themeName] = useTheme()
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // selection.setSelectionBgColor 写入新的状态值，使React hook 状态流后续读取保持一致。
    selection.setSelectionBgColor(getTheme(themeName).selectionBg)
  }, [selection, themeName])
}
