// 整理这一组导入，让shortcut Format后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 引入 loadKeybindingsSync，将 ./loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { loadKeybindingsSync } from './loadUserBindings.js'
// 引入 getBindingDisplayText，将 ./resolver.js 中已经封装好的能力接到本文件流程里。
import { getBindingDisplayText } from './resolver.js'
// 类型依赖 { KeybindingContextName } 来自 ./types.js，用于校准shortcut Format的数据契约。
import type { KeybindingContextName } from './types.js'

// TODO(keybindings-migration): Remove fallback parameter after migration is
// complete and we've confirmed no 'keybinding_fallback_used' events are being
// logged. The fallback exists as a safety net during migration - if bindings
// fail to load or an action isn't found, we fall back to hardcoded values.
// Once stable, callers should be able to trust that getBindingDisplayText
// always returns a value for known actions, and we can remove this defensive
// pattern.

// Track which action+context pairs have already logged a fallback event
// to avoid duplicate events from repeated calls in non-React contexts.
// LOGGED_FALLBACKS 集合构建`new Set<string>()`，供后续判断或组装使用。
const LOGGED_FALLBACKS = new Set<string>()

/**
 * Get the display text for a configured shortcut without React hooks.
 * Use this in non-React contexts (commands, services, etc.).
 *
 * This lives in its own module (not useShortcutDisplay.ts) so that
 * non-React callers like query/stopHooks.ts don't pull React into their
 * module graph via the sibling hook.
 *
 * @param action - The action name (e.g., 'app:toggleTranscript')
 * @param context - The keybinding context (e.g., 'Global')
 * @param fallback - Fallback text if binding not found
 * @returns The configured shortcut display text
 *
 * @example
 * const expandShortcut = getShortcutDisplay('app:toggleTranscript', 'Global', 'ctrl+o')
 * // Returns the user's configured binding, or 'ctrl+o' as default
 */
// getShortcutDisplay 封装shortcutFormat的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getShortcutDisplay(
  action: string,
  context: KeybindingContextName,
  fallback: string,
): string {
  // bindings 集合读取`loadKeybindingsSync`，供shortcut Format后续处理使用。
  const bindings = loadKeybindingsSync()
  // resolved读取`getBindingDisplayText`，供shortcut Format后续处理使用。
  const resolved = getBindingDisplayText(action, context, bindings)
  // 满足 `resolved === undefined` 时，shortcut Format执行该分支。
  if (resolved === undefined) {
    // key保存``${action}:${context}``，作为后续固定文本处理的输入。
    const key = `${action}:${context}`
    // 满足 `!LOGGED_FALLBACKS.has(key)` 时，shortcut Format执行该分支。
    if (!LOGGED_FALLBACKS.has(key)) {
      // 调用 LOGGED_FALLBACKS.add，触发shortcut Format此处需要的副作用。
      LOGGED_FALLBACKS.add(key)
      // 记录shortcut Format运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_keybinding_fallback_used', {
        action:
          action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        context:
          context as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback:
          fallback as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        reason:
          'action_not_found' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }
    // 返回 `fallback`，作为shortcut Format这次计算的结果。
    return fallback
  }
  // 返回 `resolved`，作为shortcut Format这次计算的结果。
  return resolved
}
