// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type Notification,
  useNotifications,
} from '../../context/notifications.js'
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js'
// 引入 isInProcessTeammateTask，将 ../../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../../tasks/InProcessTeammateTask/types.js'

// parseCount 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCount(notif: Notification): number {
  // 满足 `!('text' in notif)` 时，React hook执行该分支。
  if (!('text' in notif)) {
    // 返回 `1`，作为React hook 状态流这次计算的结果。
    return 1
  }
  // match匹配`text.match`，供React hook后续处理使用。
  const match = notif.text.match(/^(\d+)/)
  // 返回 `match?.[1] ? parseInt(match[1], 10) : 1`，作为React hook 状态流这次计算的结果。
  return match?.[1] ? parseInt(match[1], 10) : 1
}

// foldSpawn 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function foldSpawn(acc: Notification, _incoming: Notification): Notification {
  // 返回 `makeSpawnNotif(parseCount(acc) + 1)`，作为React hook 状态流这次计算的结果。
  return makeSpawnNotif(parseCount(acc) + 1)
}

// makeSpawnNotif 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeSpawnNotif(count: number): Notification {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    key: 'teammate-spawn',
    text: count === 1 ? '1 agent spawned' : `${count} agents spawned`,
    priority: 'low',
    timeoutMs: 5000,
    fold: foldSpawn,
  }
}

// foldShutdown 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function foldShutdown(
  acc: Notification,
  _incoming: Notification,
): Notification {
  // 返回 `makeShutdownNotif(parseCount(acc) + 1)`，作为React hook 状态流这次计算的结果。
  return makeShutdownNotif(parseCount(acc) + 1)
}

// makeShutdownNotif 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeShutdownNotif(count: number): Notification {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    key: 'teammate-shutdown',
    text: count === 1 ? '1 agent shut down' : `${count} agents shut down`,
    priority: 'low',
    timeoutMs: 5000,
    fold: foldShutdown,
  }
}

/**
 * Fires batched notifications when in-process teammates spawn or shut down.
 * Uses fold() to combine repeated events into a single notification
 * like "3 agents spawned" or "2 agents shut down".
 */
// useTeammateLifecycleNotification 封装useTeammateShutdownNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTeammateLifecycleNotification(): void {
  // tasks 集合保存`useAppState`，供React hook后续处理使用。
  const tasks = useAppState(s => s.tasks)
  // 从 `useNotifications()` 解构 addNotification，减少React hook use Teammate Shutdown No...对同一对象的重复访问。
  const { addNotification } = useNotifications()
  // seenRunningRef 引用保存`Set`，供React hook后续处理使用。
  const seenRunningRef = useRef<Set<string>>(new Set())
  // seenCompletedRef 引用保存`Set`，供React hook后续处理使用。
  const seenCompletedRef = useRef<Set<string>>(new Set())

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
    if (getIsRemoteMode()) return
    // 循环处理 `const [id, task] of Object.entries(tasks)`，让React hook 状态流把同类条目按顺序走完。
    for (const [id, task] of Object.entries(tasks)) {
      // 满足 `!isInProcessTeammateTask(task)` 时，React hook执行该分支。
      if (!isInProcessTeammateTask(task)) {
        // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
        continue
      }

      // 组合条件 `task.status === 'running' && !seenRunningRef.current.has(id)` 成立时，React hook 状态流才启用这条专门路径。
      if (task.status === 'running' && !seenRunningRef.current.has(id)) {
        // 调用 seenRunningRef.current.add，触发React hook此处需要的副作用。
        seenRunningRef.current.add(id)
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification(makeSpawnNotif(1))
      }

      // 组合条件 `task.status === 'completed' && !seenCompletedRef.current.has(id)` 成立时，React hook 状态流才启用这条专门路径。
      if (task.status === 'completed' && !seenCompletedRef.current.has(id)) {
        // 调用 seenCompletedRef.current.add，触发React hook此处需要的副作用。
        seenCompletedRef.current.add(id)
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification(makeShutdownNotif(1))
      }
    }
  }, [tasks, addNotification])
}
