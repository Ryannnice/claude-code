/**
 * Hook for managing session backgrounding (Ctrl+B to background/foreground sessions).
 *
 * Handles:
 * - Calling onBackgroundQuery to spawn a background task for the current query
 * - Re-backgrounding foregrounded tasks
 * - Syncing foregrounded task messages/state to main view
 */

// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'

// UseSessionBackgroundingProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSessionBackgroundingProps = {
  // 这个回调绑定到 setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void，负责React hook 状态流在该局部场景下的响应。
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  // 这个回调绑定到 setIsLoading: (loading: boolean) => void，负责React hook 状态流在该局部场景下的响应。
  setIsLoading: (loading: boolean) => void
  // 这个回调绑定到 resetLoadingState: () => void，负责React hook 状态流在该局部场景下的响应。
  resetLoadingState: () => void
  // 这个回调绑定到 setAbortController: (controller: AbortController | null) => void，负责React hook 状态流在该局部场景下的响应。
  setAbortController: (controller: AbortController | null) => void
  // 这个回调绑定到 onBackgroundQuery: () => void，负责React hook 状态流在该局部场景下的响应。
  onBackgroundQuery: () => void
}

// UseSessionBackgroundingResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSessionBackgroundingResult = {
  /** Call when user wants to background (Ctrl+B) */
  // 这个回调绑定到 handleBackgroundSession: () => void，负责React hook 状态流在该局部场景下的响应。
  handleBackgroundSession: () => void
}

// useSessionBackgrounding 封装useSessionBackgrounding的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSessionBackgrounding({
  setMessages,
  setIsLoading,
  resetLoadingState,
  setAbortController,
  onBackgroundQuery,
}: UseSessionBackgroundingProps): UseSessionBackgroundingResult {
  // foregroundedTaskId保存`useAppState`，供React hook后续处理使用。
  const foregroundedTaskId = useAppState(s => s.foregroundedTaskId)
  // foregroundedTask保存`useAppState`，供React hook后续处理使用。
  const foregroundedTask = useAppState(s =>
    s.foregroundedTaskId ? s.tasks[s.foregroundedTaskId] : undefined,
  )
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // lastSyncedMessagesLengthRef 引用保存 hook 状态，让React hook use Sessio...跨渲染复用同一个容器。
  const lastSyncedMessagesLengthRef = useRef<number>(0)

  // handleBackgroundSession 会话数据保存`useCallback`，供React hook后续处理使用。
  const handleBackgroundSession = useCallback(() => {
    // 满足 `foregroundedTaskId` 时，React hook执行该分支。
    if (foregroundedTaskId) {
      // Re-background the foregrounded task
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => {
        // taskId保存`prev.foregroundedTaskId`，供后续判断或组装使用。
        const taskId = prev.foregroundedTaskId
        // taskId缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!taskId) return prev
        // task 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
        const task = prev.tasks[taskId]
        // task缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!task) {
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return { ...prev, foregroundedTaskId: undefined }
        }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          foregroundedTaskId: undefined,
          tasks: {
            ...prev.tasks,
            [taskId]: { ...task, isBackgrounded: true },
          },
        }
      })
      // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMessages([])
      // 调用 resetLoadingState，触发React hook此处需要的副作用。
      resetLoadingState()
      // setAbortController 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAbortController(null)
      // React hook use Session Backgrounding在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 onBackgroundQuery，触发React hook此处需要的副作用。
    onBackgroundQuery()
  }, [
    foregroundedTaskId,
    setAppState,
    setMessages,
    resetLoadingState,
    setAbortController,
    onBackgroundQuery,
  ])

  // Sync foregrounded task's messages and loading state to the main view
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // foregroundedTaskId缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!foregroundedTaskId) {
      // Reset when no foregrounded task
      // current更新为 `0`，确保useSessionBackgrounding后续读取最新状态。
      lastSyncedMessagesLengthRef.current = 0
      // React hook use Session Backgrounding在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `!foregroundedTask || foregroundedTask.type` 与 `'l` 不一致时刷新派生状态，避免使用过期结果。
    if (!foregroundedTask || foregroundedTask.type !== 'local_agent') {
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => ({ ...prev, foregroundedTaskId: undefined }))
      // 调用 resetLoadingState，触发React hook此处需要的副作用。
      resetLoadingState()
      // current更新为 `0`，确保useSessionBackgrounding后续读取最新状态。
      lastSyncedMessagesLengthRef.current = 0
      // React hook use Session Backgrounding在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Sync messages from background task to main view
    // Only update if messages have actually changed to avoid redundant renders
    // taskMessages 消息数据保存`foregroundedTask.messages ?? []`，供后续判断或组装使用。
    const taskMessages = foregroundedTask.messages ?? []
    // `taskMessages.length` 与 `lastSyncedMessagesLengthR` 不一致时刷新派生状态，避免使用过期结果。
    if (taskMessages.length !== lastSyncedMessagesLengthRef.current) {
      // current更新为 `taskMessages.length`，确保useSessionBackgrounding后续读取最新状态。
      lastSyncedMessagesLengthRef.current = taskMessages.length
      // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMessages([...taskMessages])
    }

    // 当 `foregroundedTask.status` 匹配 `'running'` 时，React hook执行对应分支。
    if (foregroundedTask.status === 'running') {
      // Check if the task was aborted (user pressed Escape)
      // taskAbortController 命名 `foregroundedTask.abortController`，让后续代码直接表达这个值的用途。
      const taskAbortController = foregroundedTask.abortController
      // 满足 `taskAbortController?.signal.aborted` 时，React hook执行该分支。
      if (taskAbortController?.signal.aborted) {
        // Task was aborted - clear foregrounded state immediately
        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(prev => {
          // prev.foregroundedTaskId缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
          if (!prev.foregroundedTaskId) return prev
          // task读取 `prev.tasks[prev.foregroundedTaskId]` 对应条目，后续围绕该成员继续处理。
          const task = prev.tasks[prev.foregroundedTaskId]
          // task缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
          if (!task) return { ...prev, foregroundedTaskId: undefined }
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return {
            ...prev,
            foregroundedTaskId: undefined,
            tasks: {
              ...prev.tasks,
              [prev.foregroundedTaskId]: { ...task, isBackgrounded: true },
            },
          }
        })
        // 调用 resetLoadingState，触发React hook此处需要的副作用。
        resetLoadingState()
        // setAbortController 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAbortController(null)
        // current更新为 `0`，确保useSessionBackgrounding后续读取最新状态。
        lastSyncedMessagesLengthRef.current = 0
        // React hook use Session Backgrounding在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsLoading(true)
      // Set abort controller to the foregrounded task's controller for Escape handling
      // 满足 `taskAbortController` 时，React hook执行该分支。
      if (taskAbortController) {
        // setAbortController 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAbortController(taskAbortController)
      }
    } else {
      // Task completed - restore to background and clear foregrounded view
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => {
        // taskId保存`prev.foregroundedTaskId`，供后续判断或组装使用。
        const taskId = prev.foregroundedTaskId
        // taskId缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!taskId) return prev
        // task 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
        const task = prev.tasks[taskId]
        // task缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!task) return { ...prev, foregroundedTaskId: undefined }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          foregroundedTaskId: undefined,
          tasks: { ...prev.tasks, [taskId]: { ...task, isBackgrounded: true } },
        }
      })
      // 调用 resetLoadingState，触发React hook此处需要的副作用。
      resetLoadingState()
      // setAbortController 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAbortController(null)
      // current更新为 `0`，确保useSessionBackgrounding后续读取最新状态。
      lastSyncedMessagesLengthRef.current = 0
    }
  }, [
    foregroundedTaskId,
    foregroundedTask,
    setAppState,
    setMessages,
    setIsLoading,
    resetLoadingState,
    setAbortController,
  ])

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    handleBackgroundSession,
  }
}
