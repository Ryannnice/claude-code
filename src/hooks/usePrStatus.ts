// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react'
// 引入 getLastInteractionTime，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getLastInteractionTime } from '../bootstrap/state.js'
// 复用 fetchPrStatus、PrReviewState 工具函数，把通用处理留在 ../utils/ghPrStatus.js 中维护。
import { fetchPrStatus, type PrReviewState } from '../utils/ghPrStatus.js'

// POLL_INTERVAL_MS 集合保存`60_000`，供后续判断或组装使用。
const POLL_INTERVAL_MS = 60_000
// SLOW_GH_THRESHOLD_MS 集合 命名 `4_000`，让后续代码直接表达这个值的用途。
const SLOW_GH_THRESHOLD_MS = 4_000
// IDLE_STOP_MS 集合保存`60 * 60_000 // stop polling after 60 min idle`，供后续判断或组装使用。
const IDLE_STOP_MS = 60 * 60_000 // stop polling after 60 min idle

// PrStatusState 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type PrStatusState = {
  number: number | null
  url: string | null
  reviewState: PrReviewState | null
  lastUpdated: number
}

// INITIAL_STATE 状态 集中保存React hook use Pr Status要一起传递的字段。
const INITIAL_STATE: PrStatusState = {
  number: null,
  url: null,
  reviewState: null,
  lastUpdated: 0,
}

/**
 * Polls PR review status every 60s while the session is active.
 * When no interaction is detected for 60 minutes, the loop stops — no
 * timers remain. React re-runs the effect when isLoading changes
 * (turn starts/ends), restarting the loop. Effect setup schedules
 * the next poll relative to the last fetch time so turn boundaries
 * don't spawn `gh` more than once per interval. Disables permanently
 * if a fetch exceeds 4s.
 *
 * Pass `enabled: false` to skip polling entirely (hook still must be
 * called unconditionally to satisfy the rules of hooks).
 */
// usePrStatus 封装usePrStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePrStatus(isLoading: boolean, enabled = true): PrStatusState {
  // prStatus 集合 由 React state 持有，setPrStatus 会在用户操作或异步结果返回时触发刷新。
  const [prStatus, setPrStatus] = useState<PrStatusState>(INITIAL_STATE)
  // timeoutRef 引用保存 hook 状态，让React hook use Pr Sta...跨渲染复用同一个容器。
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // disabledRef 引用保存`useRef`，供React hook后续处理使用。
  const disabledRef = useRef(false)
  // lastFetchRef 引用保存`useRef`，供React hook后续处理使用。
  const lastFetchRef = useRef(0)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return
    // 满足 `disabledRef.current` 时，React hook执行该分支。
    if (disabledRef.current) return

    // cancelled标记React hook use Pr Sta...是否启用对应路径。
    let cancelled = false
    // lastSeenInteractionTime保存`-1`，供React hook use Pr Sta...后续判断或输出使用。
    let lastSeenInteractionTime = -1
    // lastActivityTimestamp记录时间`Date.now`，供React hook后续处理使用。
    let lastActivityTimestamp = Date.now()

    // poll 封装usePrStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function poll() {
      // 满足 `cancelled` 时，React hook执行该分支。
      if (cancelled) return

      // currentInteractionTime读取`getLastInteractionTime`，供React hook后续处理使用。
      const currentInteractionTime = getLastInteractionTime()
      // `lastSeenInteractionTime` 与 `currentInteractionTime` 不一致时刷新派生状态，避免使用过期结果。
      if (lastSeenInteractionTime !== currentInteractionTime) {
        // lastSeenInteractionTime更新为 `currentInteractionTime`，确保usePrStatus后续读取最新状态。
        lastSeenInteractionTime = currentInteractionTime
        // lastActivityTimestamp更新为 `Date.now()`，确保usePrStatus后续读取最新状态。
        lastActivityTimestamp = Date.now()
      // React hook use Pr Status在这里处理 `} else if (Date.now() - lastActivityTimestamp >= IDLE_STOP_MS) {`，完成这一小步状态转换。
      } else if (Date.now() - lastActivityTimestamp >= IDLE_STOP_MS) {
        // React hook use Pr Status在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // start记录时间`Date.now`，供React hook后续处理使用。
      const start = Date.now()
      // 结果读取`fetchPrStatus`，供React hook后续处理使用。
      const result = await fetchPrStatus()
      // 满足 `cancelled` 时，React hook执行该分支。
      if (cancelled) return
      // current更新为 `start`，确保usePrStatus后续读取最新状态。
      lastFetchRef.current = start

      // setPrStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPrStatus(prev => {
        // newNumber保存`result?.number ?? null`，供React hook use Pr Sta...后续判断或输出使用。
        const newNumber = result?.number ?? null
        // newReviewState 状态保存`result?.reviewState ?? null`，供React hook use Pr Sta...后续判断或输出使用。
        const newReviewState = result?.reviewState ?? null
        // 组合条件 `prev.number === newNumber && prev.reviewState ===` 成立时，React hook 状态流才启用这条专门路径。
        if (prev.number === newNumber && prev.reviewState === newReviewState) {
          // 返回 `prev`，作为React hook 状态流这次计算的结果。
          return prev
        }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          number: newNumber,
          url: result?.url ?? null,
          reviewState: newReviewState,
          lastUpdated: Date.now(),
        }
      })

      // 满足 `Date.now() - start > SLOW_GH_THRESHOLD_MS` 时，React hook执行该分支。
      if (Date.now() - start > SLOW_GH_THRESHOLD_MS) {
        // current更新为 `true`，确保usePrStatus后续读取最新状态。
        disabledRef.current = true
        // React hook use Pr Status在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // cancelled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!cancelled) {
        // current更新为 `setTimeout(poll, POLL_INTERVAL_MS)`，确保usePrStatus后续读取最新状态。
        timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    // elapsed记录时间`Date.now`，供React hook后续处理使用。
    const elapsed = Date.now() - lastFetchRef.current
    // 满足 `elapsed >= POLL_INTERVAL_MS` 时，React hook执行该分支。
    if (elapsed >= POLL_INTERVAL_MS) {
      // 显式忽略 `poll()` 的返回值，只保留它触发的副作用。
      void poll()
    } else {
      // current更新为 `setTimeout(poll, POLL_INTERVAL_MS - elapsed)`，确保usePrStatus后续读取最新状态。
      timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS - elapsed)
    }

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保usePrStatus后续读取最新状态。
      cancelled = true
      // 满足 `timeoutRef.current` 时，React hook执行该分支。
      if (timeoutRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(timeoutRef.current)
        // current更新为 `null`，确保usePrStatus后续读取最新状态。
        timeoutRef.current = null
      }
    }
  }, [isLoading, enabled])

  // 返回 `prStatus`，作为React hook 状态流这次计算的结果。
  return prStatus
}
