// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 useNotifications，将 ../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../context/notifications.js'
// 引入 getShortcutDisplay，将 ../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../keybindings/shortcutFormat.js'
// 复用 hasImageInClipboard 工具函数，把通用处理留在 ../utils/imagePaste.js 中维护。
import { hasImageInClipboard } from '../utils/imagePaste.js'

// NOTIFICATION_KEY保存`'clipboard-image-hint'`，作为后续固定文本处理的输入。
const NOTIFICATION_KEY = 'clipboard-image-hint'
// Small debounce to batch rapid focus changes
// FOCUS_CHECK_DEBOUNCE_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const FOCUS_CHECK_DEBOUNCE_MS = 1000
// Don't show the hint more than once per this interval
// HINT_COOLDOWN_MS 集合保存`30000`，供后续判断或组装使用。
const HINT_COOLDOWN_MS = 30000

/**
 * Hook that shows a notification when the terminal regains focus
 * and the clipboard contains an image.
 *
 * @param isFocused - Whether the terminal is currently focused
 * @param enabled - Whether image paste is enabled (onImagePaste is defined)
 */
// useClipboardImageHint 封装useClipboardImageHint的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useClipboardImageHint(
  isFocused: boolean,
  enabled: boolean,
): void {
  // 从 `useNotifications()` 解构 addNotification，减少React hook use Clipboard Image Hint对同一对象的重复访问。
  const { addNotification } = useNotifications()
  // lastFocusedRef 引用保存`useRef`，供React hook后续处理使用。
  const lastFocusedRef = useRef(isFocused)
  // lastHintTimeRef 引用保存`useRef`，供React hook后续处理使用。
  const lastHintTimeRef = useRef(0)
  // checkTimeoutRef 引用保存 hook 状态，让React hook use Clipbo...跨渲染复用同一个容器。
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Only trigger on focus regain (was unfocused, now focused)
    // wasFocused 命名 `lastFocusedRef.current`，让后续代码直接表达这个值的用途。
    const wasFocused = lastFocusedRef.current
    // current更新为 `isFocused`，确保useClipboardImageHint后续读取最新状态。
    lastFocusedRef.current = isFocused

    // 组合条件 `!enabled || !isFocused || wasFocused` 成立时，React hook 状态流才启用这条专门路径。
    if (!enabled || !isFocused || wasFocused) {
      // React hook use Clipboard Image Hint在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Clear any pending check
    // 满足 `checkTimeoutRef.current` 时，React hook执行该分支。
    if (checkTimeoutRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(checkTimeoutRef.current)
    }

    // Small debounce to batch rapid focus changes
    // current更新为 `setTimeout(`，确保useClipboardImageHint后续读取最新状态。
    checkTimeoutRef.current = setTimeout(
      // 调用 async，触发React hook此处需要的副作用。
      async (checkTimeoutRef, lastHintTimeRef, addNotification) => {
        // current更新为 `null`，确保useClipboardImageHint后续读取最新状态。
        checkTimeoutRef.current = null

        // Check cooldown to avoid spamming the user
        // now记录时间`Date.now`，供React hook后续处理使用。
        const now = Date.now()
        // 满足 `now - lastHintTimeRef.current < HINT_COOLDOWN_MS` 时，React hook执行该分支。
        if (now - lastHintTimeRef.current < HINT_COOLDOWN_MS) {
          // React hook use Clipboard Image Hint在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Check if clipboard has an image (async osascript call)
        // 满足 `await hasImageInClipboard()` 时，React hook执行该分支。
        if (await hasImageInClipboard()) {
          // current更新为 `now`，确保useClipboardImageHint后续读取最新状态。
          lastHintTimeRef.current = now
          // 调用 addNotification，触发React hook此处需要的副作用。
          addNotification({
            key: NOTIFICATION_KEY,
            text: `Image in clipboard · ${getShortcutDisplay('chat:imagePaste', 'Chat', 'ctrl+v')} to paste`,
            priority: 'immediate',
            timeoutMs: 8000,
          })
        }
      },
      FOCUS_CHECK_DEBOUNCE_MS,
      checkTimeoutRef,
      lastHintTimeRef,
      addNotification,
    )

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 满足 `checkTimeoutRef.current` 时，React hook执行该分支。
      if (checkTimeoutRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(checkTimeoutRef.current)
        // current更新为 `null`，确保useClipboardImageHint后续读取最新状态。
        checkTimeoutRef.current = null
      }
    }
  }, [isFocused, enabled, addNotification])
}
