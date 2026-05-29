// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react'
// 类型依赖 { InputEvent } 来自 ../ink/events/input-event.js，用于校准use Keybinding的数据契约。
import type { InputEvent } from '../ink/events/input-event.js'
// 引入 Key、useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { type Key, useInput } from '../ink.js'
// 引入 useOptionalKeybindingContext，将 ./KeybindingContext.js 中已经封装好的能力接到本文件流程里。
import { useOptionalKeybindingContext } from './KeybindingContext.js'
// 类型依赖 { KeybindingContextName } 来自 ./types.js，用于校准use Keybinding的数据契约。
import type { KeybindingContextName } from './types.js'

// Options 固化use Keybinding里传递的数据形状，帮助调用方按同一结构读写字段。
type Options = {
  /** Which context this binding belongs to (default: 'Global') */
  context?: KeybindingContextName
  /** Only handle when active (like useInput's isActive) */
  isActive?: boolean
}

/**
 * Ink-native hook for handling a keybinding.
 *
 * The handler stays in the component (React way).
 * The binding (keystroke → action) comes from config.
 *
 * Supports chord sequences (e.g., "ctrl+k ctrl+s"). When a chord is started,
 * the hook will manage the pending state automatically.
 *
 * Uses stopImmediatePropagation() to prevent other handlers from firing
 * once this binding is handled.
 *
 * @example
 * ```tsx
 * useKeybinding('app:toggleTodos', () => {
 *   setShowTodos(prev => !prev)
 * }, { context: 'Global' })
 * ```
 */
// useKeybinding 封装useKeybinding的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useKeybinding(
  action: string,
  // 这个回调绑定到 handler: () => void | false | Promise<void>,，负责use Keybinding在该局部场景下的响应。
  handler: () => void | false | Promise<void>,
  options: Options = {},
): void {
  // 从 `options` 解构 context = 'Global'、isActive = true，减少use Keybinding对同一对象的重复访问。
  const { context = 'Global', isActive = true } = options
  // keybindingContext保存`useOptionalKeybindingContext`，供use Keybinding后续处理使用。
  const keybindingContext = useOptionalKeybindingContext()

  // Register handler with the context for ChordInterceptor to invoke
  // 调用 useEffect，触发use Keybinding此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!keybindingContext || !isActive` 成立时，use Keybinding才启用这条专门路径。
    if (!keybindingContext || !isActive) return
    // 返回 `keybindingContext.registerHandler({ action, context, handler })`，作为use Keybinding这次计算的结果。
    return keybindingContext.registerHandler({ action, context, handler })
  }, [action, context, handler, keybindingContext, isActive])

  // handleInput保存`useCallback`，供use Keybinding后续处理使用。
  const handleInput = useCallback(
    (input: string, key: Key, event: InputEvent) => {
      // If no keybinding context available, skip resolution
      // keybindingContext缺失时提前走兜底路径，避免use Keybinding继续依赖无效输入。
      if (!keybindingContext) return

      // Build context list: registered active contexts + this context + Global
      // More specific contexts (registered ones) take precedence over Global
      // contextsToCheck 聚合成有序列表，保持后续遍历顺序稳定。
      const contextsToCheck: KeybindingContextName[] = [
        ...keybindingContext.activeContexts,
        context,
        'Global',
      ]
      // Deduplicate while preserving order (first occurrence wins for priority)
      // uniqueContexts 集合保存`Set`，供use Keybinding后续处理使用。
      const uniqueContexts = [...new Set(contextsToCheck)]

      // 结果读取`keybindingContext.resolve`，供use Keybinding后续处理使用。
      const result = keybindingContext.resolve(input, key, uniqueContexts)

      // 按照 result.type 的取值选择use Keybinding的具体处理分支。
      switch (result.type) {
        case 'match':
          // Chord completed (if any) - clear pending state
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 满足 `result.action === action` 时，use Keybinding执行该分支。
          if (result.action === action) {
            // `handler()` 与 `false` 不一致时刷新派生状态，避免使用过期结果。
            if (handler() !== false) {
              // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
              event.stopImmediatePropagation()
            }
          }
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'chord_started':
          // User started a chord sequence - update pending state
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(result.pending)
          // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
          event.stopImmediatePropagation()
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'chord_cancelled':
          // Chord was cancelled (escape or invalid key)
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'unbound':
          // Explicitly unbound - clear any pending chord
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
          event.stopImmediatePropagation()
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'none':
          // No match - let other handlers try
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
      }
    },
    [action, context, handler, keybindingContext],
  )

  // 调用 useInput，触发use Keybinding此处需要的副作用。
  useInput(handleInput, { isActive })
}

/**
 * Handle multiple keybindings in one hook (reduces useInput calls).
 *
 * Supports chord sequences. When a chord is started, the hook will
 * manage the pending state automatically.
 *
 * @example
 * ```tsx
 * useKeybindings({
 *   'chat:submit': () => handleSubmit(),
 *   'chat:cancel': () => handleCancel(),
 * }, { context: 'Chat' })
 * ```
 */
// useKeybindings 封装useKeybinding的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useKeybindings(
  // Handler returning `false` means "not consumed" — the event propagates
  // to later useInput/useKeybindings handlers. Useful for fall-through:
  // e.g. ScrollKeybindingHandler's scroll:line* returns false when the
  // ScrollBox content fits (scroll is a no-op), letting a child component's
  // handler take the wheel event for list navigation instead. Promise<void>
  // is allowed for fire-and-forget async handlers (the `!== false` check
  // only skips propagation for a sync `false`, not a pending Promise).
  // 这个回调绑定到 handlers: Record<string, () => void | false | Promise<void>>,，负责use Keybinding在该局部场景下的响应。
  handlers: Record<string, () => void | false | Promise<void>>,
  options: Options = {},
): void {
  // 从 `options` 解构 context = 'Global'、isActive = true，减少use Keybinding对同一对象的重复访问。
  const { context = 'Global', isActive = true } = options
  // keybindingContext保存`useOptionalKeybindingContext`，供use Keybinding后续处理使用。
  const keybindingContext = useOptionalKeybindingContext()

  // Register all handlers with the context for ChordInterceptor to invoke
  // 调用 useEffect，触发use Keybinding此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!keybindingContext || !isActive` 成立时，use Keybinding才启用这条专门路径。
    if (!keybindingContext || !isActive) return

    // 这个回调绑定到 const unregisterFns: Array<() => void> = []，负责use Keybinding在该局部场景下的响应。
    const unregisterFns: Array<() => void> = []
    // 循环处理 `const [action, handler] of Object.entries(handlers)`，让use Keybinding把同类条目按顺序走完。
    for (const [action, handler] of Object.entries(handlers)) {
      // unregisterFns 集合追加新条目，保持收集顺序与输入顺序一致。
      unregisterFns.push(
        keybindingContext.registerHandler({ action, context, handler }),
      )
    }

    // 返回 `() => {`，作为use Keybinding这次计算的结果。
    return () => {
      // 按顺序遍历 `unregisterFns` 中的unregister，逐个交给use Keybinding处理。
      for (const unregister of unregisterFns) {
        // 调用 unregister，触发use Keybinding此处需要的副作用。
        unregister()
      }
    }
  }, [context, handlers, keybindingContext, isActive])

  // handleInput保存`useCallback`，供use Keybinding后续处理使用。
  const handleInput = useCallback(
    (input: string, key: Key, event: InputEvent) => {
      // If no keybinding context available, skip resolution
      // keybindingContext缺失时提前走兜底路径，避免use Keybinding继续依赖无效输入。
      if (!keybindingContext) return

      // Build context list: registered active contexts + this context + Global
      // More specific contexts (registered ones) take precedence over Global
      // contextsToCheck 聚合成有序列表，保持后续遍历顺序稳定。
      const contextsToCheck: KeybindingContextName[] = [
        ...keybindingContext.activeContexts,
        context,
        'Global',
      ]
      // Deduplicate while preserving order (first occurrence wins for priority)
      // uniqueContexts 集合保存`Set`，供use Keybinding后续处理使用。
      const uniqueContexts = [...new Set(contextsToCheck)]

      // 结果读取`keybindingContext.resolve`，供use Keybinding后续处理使用。
      const result = keybindingContext.resolve(input, key, uniqueContexts)

      // 按照 result.type 的取值选择use Keybinding的具体处理分支。
      switch (result.type) {
        case 'match':
          // Chord completed (if any) - clear pending state
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 满足 `result.action in handlers` 时，use Keybinding执行该分支。
          if (result.action in handlers) {
            // handler读取 `handlers[result.action]` 对应条目，后续围绕该成员继续处理。
            const handler = handlers[result.action]
            // `handler && handler()` 与 `false` 不一致时刷新派生状态，避免使用过期结果。
            if (handler && handler() !== false) {
              // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
              event.stopImmediatePropagation()
            }
          }
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'chord_started':
          // User started a chord sequence - update pending state
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(result.pending)
          // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
          event.stopImmediatePropagation()
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'chord_cancelled':
          // Chord was cancelled (escape or invalid key)
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'unbound':
          // Explicitly unbound - clear any pending chord
          // keybindingContext.setPendingChord 写入新的状态值，使use Keybinding后续读取保持一致。
          keybindingContext.setPendingChord(null)
          // 调用 event.stopImmediatePropagation，触发use Keybinding此处需要的副作用。
          event.stopImmediatePropagation()
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
        case 'none':
          // No match - let other handlers try
          // 结束这个分支或循环，避免use Keybinding继续落入后续路径。
          break
      }
    },
    [context, handlers, keybindingContext],
  )

  // 调用 useInput，触发use Keybinding此处需要的副作用。
  useInput(handleInput, { isActive })
}
