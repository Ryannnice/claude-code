// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'
// 类型依赖 { HookResultMessage, Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { HookResultMessage, Message } from '../types/message.js'

/**
 * Manages deferred SessionStart hook messages so the REPL can render
 * immediately instead of blocking on hook execution (~500ms).
 *
 * Hook messages are injected asynchronously when the promise resolves.
 * Returns a callback that onSubmit should call before the first API
 * request to ensure the model always sees hook context.
 */
// useDeferredHookMessages 封装useDeferredHookMessages的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDeferredHookMessages(
  pendingHookMessages: Promise<HookResultMessage[]> | undefined,
  // 这个回调绑定到 setMessages: (action: React.SetStateAction<Message[]>) => void,，负责React hook 状态流在该局部场景下的响应。
  setMessages: (action: React.SetStateAction<Message[]>) => void,
): () => Promise<void> {
  // pendingRef 引用保存`useRef`，供React hook后续处理使用。
  const pendingRef = useRef(pendingHookMessages ?? null)
  // resolvedRef 引用保存`useRef`，供React hook后续处理使用。
  const resolvedRef = useRef(!pendingHookMessages)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // promise 异步任务保存`pendingRef.current`，供React hook use Deferr...后续判断或输出使用。
    const promise = pendingRef.current
    // promise 异步任务缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!promise) return
    // cancelled标记React hook use Deferr...是否启用对应路径。
    let cancelled = false
    // 调用 promise.then，触发React hook此处需要的副作用。
    promise.then(msgs => {
      // 满足 `cancelled` 时，React hook执行该分支。
      if (cancelled) return
      // current更新为 `true`，确保useDeferredHookMessages后续读取最新状态。
      resolvedRef.current = true
      // current更新为 `null`，确保useDeferredHookMessages后续读取最新状态。
      pendingRef.current = null
      // 满足 `msgs.length > 0` 时，React hook执行该分支。
      if (msgs.length > 0) {
        // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
        setMessages(prev => [...msgs, ...prev])
      }
    })
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保useDeferredHookMessages后续读取最新状态。
      cancelled = true
    }
  }, [setMessages])

  // 返回 `useCallback(async () => {`，作为React hook 状态流这次计算的结果。
  return useCallback(async () => {
    // 组合条件 `resolvedRef.current || !pendingRef.current` 成立时，React hook 状态流才启用这条专门路径。
    if (resolvedRef.current || !pendingRef.current) return
    // msgs 集合 等待 `pendingRef.current`，确保继续执行前已有结果。
    const msgs = await pendingRef.current
    // 满足 `resolvedRef.current` 时，React hook执行该分支。
    if (resolvedRef.current) return
    // current更新为 `true`，确保useDeferredHookMessages后续读取最新状态。
    resolvedRef.current = true
    // current更新为 `null`，确保useDeferredHookMessages后续读取最新状态。
    pendingRef.current = null
    // 满足 `msgs.length > 0` 时，React hook执行该分支。
    if (msgs.length > 0) {
      // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMessages(prev => [...msgs, ...prev])
    }
  }, [setMessages])
}
