// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 整理这一组导入，让use Shortcut Display后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 引入 useOptionalKeybindingContext，将 ./KeybindingContext.js 中已经封装好的能力接到本文件流程里。
import { useOptionalKeybindingContext } from './KeybindingContext.js'
// 类型依赖 { KeybindingContextName } 来自 ./types.js，用于校准use Shortcut Display的数据契约。
import type { KeybindingContextName } from './types.js'

// TODO(keybindings-migration): Remove fallback parameter after migration is complete
// and we've confirmed no 'keybinding_fallback_used' events are being logged.
// The fallback exists as a safety net during migration - if bindings fail to load
// or an action isn't found, we fall back to hardcoded values. Once stable, callers
// should be able to trust that getBindingDisplayText always returns a value for
// known actions, and we can remove this defensive pattern.

/**
 * Hook to get the display text for a configured shortcut.
 * Returns the configured binding or a fallback if unavailable.
 *
 * @param action - The action name (e.g., 'app:toggleTranscript')
 * @param context - The keybinding context (e.g., 'Global')
 * @param fallback - Fallback text if keybinding context unavailable
 * @returns The configured shortcut display text
 *
 * @example
 * const expandShortcut = useShortcutDisplay('app:toggleTranscript', 'Global', 'ctrl+o')
 * // Returns the user's configured binding, or 'ctrl+o' as default
 */
// useShortcutDisplay 封装useShortcutDisplay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShortcutDisplay(
  action: string,
  context: KeybindingContextName,
  fallback: string,
): string {
  // keybindingContext保存`useOptionalKeybindingContext`，供use Shortcut Display后续处理使用。
  const keybindingContext = useOptionalKeybindingContext()
  // resolved读取`getDisplayText`，供use Shortcut Display后续处理使用。
  const resolved = keybindingContext?.getDisplayText(action, context)
  // isFallback标记use Shortcut Display是否启用对应路径。
  const isFallback = resolved === undefined
  // reason 命名 `keybindingContext ? 'action_not_found' : 'no_context'`，让后续代码直接表达这个值的用途。
  const reason = keybindingContext ? 'action_not_found' : 'no_context'

  // Log fallback usage once per mount (not on every render) to avoid
  // flooding analytics with events from frequent re-renders.
  // hasLoggedRef 引用记录 `useRef` 是否成立，use Shortcut Display随后按该结果分支。
  const hasLoggedRef = useRef(false)
  // 调用 useEffect，触发use Shortcut Display此处需要的副作用。
  useEffect(() => {
    // 组合条件 `isFallback && !hasLoggedRef.current` 成立时，use Shortcut Display才启用这条专门路径。
    if (isFallback && !hasLoggedRef.current) {
      // current更新为 `true`，确保useShortcutDisplay后续读取最新状态。
      hasLoggedRef.current = true
      // 记录use Shortcut Display运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_keybinding_fallback_used', {
        action:
          action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        context:
          context as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback:
          fallback as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        reason:
          reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }
  }, [isFallback, action, context, fallback, reason])

  // 返回 `isFallback ? fallback : resolved`，作为use Shortcut Display这次计算的结果。
  return isFallback ? fallback : resolved
}
