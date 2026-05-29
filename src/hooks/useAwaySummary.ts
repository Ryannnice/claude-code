// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getTerminalFocusState,
  subscribeTerminalFocus,
} from '../ink/terminal-focus-state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 generateAwaySummary 服务层能力，把外部通信或共享状态交给 ../services/awaySummary.js 处理。
import { generateAwaySummary } from '../services/awaySummary.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 复用 createAwaySummaryMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createAwaySummaryMessage } from '../utils/messages.js'

// BLUR_DELAY_MS 集合保存`5 * 60_000`，供后续判断或组装使用。
const BLUR_DELAY_MS = 5 * 60_000

// SetMessages 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SetMessages = (updater: (prev: Message[]) => Message[]) => void

// hasSummarySinceLastUserTurn 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasSummarySinceLastUserTurn(messages: readonly Message[]): boolean {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // m保存`messages[i]!`，供React hook use Away S...后续判断或输出使用。
    const m = messages[i]!
    // 组合条件 `m.type === 'user' && !m.isMeta && !m.isCompactSummary` 成立时，React hook 状态流才启用这条专门路径。
    if (m.type === 'user' && !m.isMeta && !m.isCompactSummary) return false
    // 当 `m.type` 匹配 `'system' && m.subtype === '...` 时，React hook执行对应分支。
    if (m.type === 'system' && m.subtype === 'away_summary') return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Appends a "while you were away" summary message after the terminal has been
 * blurred for 5 minutes. Fires only when (a) 5min since blur, (b) no turn in
 * progress, and (c) no existing away_summary since the last user message.
 *
 * Focus state 'unknown' (terminal doesn't support DECSET 1004) is a no-op.
 */
// useAwaySummary 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAwaySummary(
  messages: readonly Message[],
  setMessages: SetMessages,
  isLoading: boolean,
): void {
  // timerRef 引用保存 hook 状态，让React hook use Away S...跨渲染复用同一个容器。
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // abortRef 引用保存 hook 状态，让React hook use Away S...跨渲染复用同一个容器。
  const abortRef = useRef<AbortController | null>(null)
  // messagesRef 引用保存`useRef`，供React hook后续处理使用。
  const messagesRef = useRef(messages)
  // isLoadingRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isLoadingRef = useRef(isLoading)
  // pendingRef 引用保存`useRef`，供React hook后续处理使用。
  const pendingRef = useRef(false)
  // generateRef 引用保存 hook 状态，让React hook use Away S...跨渲染复用同一个容器。
  const generateRef = useRef<(() => Promise<void>) | null>(null)

  // current更新为 `messages`，确保useAwaySummary后续读取最新状态。
  messagesRef.current = messages
  // current更新为 `isLoading`，确保useAwaySummary后续读取最新状态。
  isLoadingRef.current = isLoading

  // 3P default: false
  // gbEnabled读取`getFeatureValue_CACHED_MAY_BE_STALE`，供React hook后续处理使用。
  const gbEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_sedge_lantern',
    false,
  )

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `!feature('AWAY_SUMMARY')` 时，React hook执行该分支。
    if (!feature('AWAY_SUMMARY')) return
    // gbEnabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!gbEnabled) return

    // clearTimer 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function clearTimer(): void {
      // `timerRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (timerRef.current !== null) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(timerRef.current)
        // current更新为 `null`，确保useAwaySummary后续读取最新状态。
        timerRef.current = null
      }
    }

    // abortInFlight 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function abortInFlight(): void {
      // 调用 abortRef.current?.abort()，完成这一处局部操作。
      abortRef.current?.abort()
      // current更新为 `null`，确保useAwaySummary后续读取最新状态。
      abortRef.current = null
    }

    // generate 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function generate(): Promise<void> {
      // current更新为 `false`，确保useAwaySummary后续读取最新状态。
      pendingRef.current = false
      // 满足 `hasSummarySinceLastUserTurn(messagesRef.current)` 时，React hook执行该分支。
      if (hasSummarySinceLastUserTurn(messagesRef.current)) return
      // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
      abortInFlight()
      // controller保存`AbortController`，供React hook后续处理使用。
      const controller = new AbortController()
      // current更新为 `controller`，确保useAwaySummary后续读取最新状态。
      abortRef.current = controller
      // 文本保存`generateAwaySummary`，供React hook后续处理使用。
      const text = await generateAwaySummary(
        messagesRef.current,
        controller.signal,
      )
      // 组合条件 `controller.signal.aborted || text === null` 成立时，React hook 状态流才启用这条专门路径。
      if (controller.signal.aborted || text === null) return
      // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMessages(prev => [...prev, createAwaySummaryMessage(text)])
    }

    // onBlurTimerFire 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function onBlurTimerFire(): void {
      // current更新为 `null`，确保useAwaySummary后续读取最新状态。
      timerRef.current = null
      // 满足 `isLoadingRef.current` 时，React hook执行该分支。
      if (isLoadingRef.current) {
        // current更新为 `true`，确保useAwaySummary后续读取最新状态。
        pendingRef.current = true
        // React hook use Away Summary在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 显式忽略 `generate()` 的返回值，只保留它触发的副作用。
      void generate()
    }

    // onFocusChange 封装useAwaySummary的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function onFocusChange(): void {
      // 状态读取`getTerminalFocusState`，供React hook后续处理使用。
      const state = getTerminalFocusState()
      // 当 `state` 匹配 `'blurred'` 时，React hook执行对应分支。
      if (state === 'blurred') {
        // 调用 clearTimer，触发React hook此处需要的副作用。
        clearTimer()
        // current更新为 `setTimeout(onBlurTimerFire, BLUR_DELAY_MS)`，确保useAwaySummary后续读取最新状态。
        timerRef.current = setTimeout(onBlurTimerFire, BLUR_DELAY_MS)
      // React hook use Away Summary在这里处理 `} else if (state === 'focused') {`，完成这一小步状态转换。
      } else if (state === 'focused') {
        // 调用 clearTimer，触发React hook此处需要的副作用。
        clearTimer()
        // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
        abortInFlight()
        // current更新为 `false`，确保useAwaySummary后续读取最新状态。
        pendingRef.current = false
      }
      // 'unknown' → no-op
    }

    // unsubscribe保存`subscribeTerminalFocus`，供React hook后续处理使用。
    const unsubscribe = subscribeTerminalFocus(onFocusChange)
    // Handle the case where we're already blurred when the effect mounts
    // 调用 onFocusChange，触发React hook此处需要的副作用。
    onFocusChange()
    // current更新为 `generate`，确保useAwaySummary后续读取最新状态。
    generateRef.current = generate

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 调用 unsubscribe，触发React hook此处需要的副作用。
      unsubscribe()
      // 调用 clearTimer，触发React hook此处需要的副作用。
      clearTimer()
      // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
      abortInFlight()
      // current更新为 `null`，确保useAwaySummary后续读取最新状态。
      generateRef.current = null
    }
  }, [gbEnabled, setMessages])

  // Timer fired mid-turn → fire when turn ends (if still blurred)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `isLoading` 时，React hook执行该分支。
    if (isLoading) return
    // pendingRef.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!pendingRef.current) return
    // `getTerminalFocusState()` 与 `'blurred'` 不一致时刷新派生状态，避免使用过期结果。
    if (getTerminalFocusState() !== 'blurred') return
    // 显式忽略 `generateRef.current?.()` 的返回值，只保留它触发的副作用。
    void generateRef.current?.()
  }, [isLoading])
}
