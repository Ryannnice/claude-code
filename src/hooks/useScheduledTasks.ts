// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 useAppStateStore、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppStateStore, useSetAppState } from '../state/AppState.js'
// 引入 isTerminalTaskStatus，将 ../Task.js 中已经封装好的能力接到本文件流程里。
import { isTerminalTaskStatus } from '../Task.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  findTeammateTaskByAgentId,
  injectUserMessageToTeammate,
} from '../tasks/InProcessTeammateTask/InProcessTeammateTask.js'
// 接入 isKairosCronEnabled 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isKairosCronEnabled } from '../tools/ScheduleCronTool/prompt.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 复用 getCronJitterConfig 工具函数，把通用处理留在 ../utils/cronJitterConfig.js 中维护。
import { getCronJitterConfig } from '../utils/cronJitterConfig.js'
// 复用 createCronScheduler 工具函数，把通用处理留在 ../utils/cronScheduler.js 中维护。
import { createCronScheduler } from '../utils/cronScheduler.js'
// 复用 removeCronTasks 工具函数，把通用处理留在 ../utils/cronTasks.js 中维护。
import { removeCronTasks } from '../utils/cronTasks.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 enqueuePendingNotification 工具函数，把通用处理留在 ../utils/messageQueueManager.js 中维护。
import { enqueuePendingNotification } from '../utils/messageQueueManager.js'
// 复用 createScheduledTaskFireMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createScheduledTaskFireMessage } from '../utils/messages.js'
// 复用 WORKLOAD_CRON 工具函数，把通用处理留在 ../utils/workloadContext.js 中维护。
import { WORKLOAD_CRON } from '../utils/workloadContext.js'

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isLoading: boolean
  /**
   * When true, bypasses the isLoading gate so tasks can enqueue while a
   * query is streaming rather than deferring to the next 1s check tick
   * after the turn ends. Assistant mode no longer forces --proactive
   * (#20425) so isLoading drops between turns like a normal REPL — this
   * bypass is now a latency nicety, not a starvation fix. The prompt is
   * enqueued at 'later' priority either way and drains between turns.
   */
  assistantMode?: boolean
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

/**
 * REPL wrapper for the cron scheduler. Mounts the scheduler once and tears
 * it down on unmount. Fired prompts go into the command queue as 'later'
 * priority, which the REPL drains via useCommandQueue between turns.
 *
 * Scheduler core (timer, file watcher, fire logic) lives in cronScheduler.ts
 * so SDK/-p mode can share it — see print.ts for the headless wiring.
 */
// useScheduledTasks 封装useScheduledTasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useScheduledTasks({
  isLoading,
  assistantMode = false,
  setMessages,
}: Props): void {
  // Latest-value ref so the scheduler's isLoading() getter doesn't capture
  // a stale closure. The effect mounts once; isLoading changes every turn.
  // isLoadingRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isLoadingRef = useRef(isLoading)
  // current更新为 `isLoading`，确保useScheduledTasks后续读取最新状态。
  isLoadingRef.current = isLoading

  // store保存`useAppStateStore`，供React hook后续处理使用。
  const store = useAppStateStore()
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Runtime gate checked here (not at the hook call site) so the hook
    // stays unconditionally mounted — rules-of-hooks forbid wrapping the
    // call in a dynamic condition. getFeatureValue_CACHED_WITH_REFRESH
    // reads from disk; the 5-min TTL fires a background refetch but the
    // effect won't re-run on value flip (assistantMode is the only dep),
    // so this guard alone is launch-grain. The mid-session killswitch is
    // the isKilled option below — check() polls it every tick.
    // 满足 `!isKairosCronEnabled()` 时，React hook执行该分支。
    if (!isKairosCronEnabled()) return

    // System-generated — hidden from queue preview and transcript UI.
    // In brief mode, executeForkedSlashCommand runs as a background
    // subagent and returns no visible messages. In normal mode,
    // isMeta is only propagated for plain-text prompts (via
    // processTextPrompt); slash commands like /context:fork do not
    // forward isMeta, so their messages remain visible in the
    // transcript. This is acceptable since normal mode is not the
    // primary use case for scheduled tasks.
    // enqueueForLead封装成回调，供React hook use Schedu...在事件触发或异步步骤中调用。
    const enqueueForLead = (prompt: string) =>
      enqueuePendingNotification({
        value: prompt,
        mode: 'prompt',
        priority: 'later',
        isMeta: true,
        // Threaded through to cc_workload= in the billing-header
        // attribution block so the API can serve cron-initiated requests
        // at lower QoS when capacity is tight. No human is actively
        // waiting on this response.
        workload: WORKLOAD_CRON,
      })

    // scheduler构建`createCronScheduler`，供React hook后续处理使用。
    const scheduler = createCronScheduler({
      // Missed-task surfacing (onFire fallback). Teammate crons are always
      // session-only (durable:false) so they never appear in the missed list,
      // which is populated from disk at scheduler startup — this path only
      // handles team-lead durable crons.
      onFire: enqueueForLead,
      // Normal fires receive the full CronTask so we can route by agentId.
      // 这个回调绑定到 onFireTask: task => {，负责React hook 状态流在该局部场景下的响应。
      onFireTask: task => {
        // 满足 `task.agentId` 时，React hook执行该分支。
        if (task.agentId) {
          // teammate筛选`findTeammateTaskByAgentId`，供React hook后续处理使用。
          const teammate = findTeammateTaskByAgentId(
            task.agentId,
            store.getState().tasks,
          )
          // 组合条件 `teammate && !isTerminalTaskStatus(teammate.status)` 成立时，React hook 状态流才启用这条专门路径。
          if (teammate && !isTerminalTaskStatus(teammate.status)) {
            // 调用 injectUserMessageToTeammate，触发React hook此处需要的副作用。
            injectUserMessageToTeammate(teammate.id, task.prompt, setAppState)
            // React hook use Scheduled Tasks在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // Teammate is gone — clean up the orphaned cron so it doesn't keep
          // firing into nowhere every tick. One-shots would auto-delete on
          // fire anyway, but recurring crons would loop until auto-expiry.
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[ScheduledTasks] teammate ${task.agentId} gone, removing orphaned cron ${task.id}`,
          )
          // 显式忽略 `removeCronTasks([task.id])` 的返回值，只保留它触发的副作用。
          void removeCronTasks([task.id])
          // React hook use Scheduled Tasks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 消息构建`createScheduledTaskFireMessage`，供React hook后续处理使用。
        const msg = createScheduledTaskFireMessage(
          `Running scheduled task (${formatCronFireTime(new Date())})`,
        )
        // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
        setMessages(prev => [...prev, msg])
        // 调用 enqueueForLead，触发React hook此处需要的副作用。
        enqueueForLead(task.prompt)
      },
      // 这个回调绑定到 isLoading: () => isLoadingRef.current,，负责React hook 状态流在该局部场景下的响应。
      isLoading: () => isLoadingRef.current,
      assistantMode,
      getJitterConfig: getCronJitterConfig,
      // 这个回调绑定到 isKilled: () => !isKairosCronEnabled(),，负责React hook 状态流在该局部场景下的响应。
      isKilled: () => !isKairosCronEnabled(),
    })
    // 调用 scheduler.start，触发React hook此处需要的副作用。
    scheduler.start()
    // 返回 `() => scheduler.stop()`，作为React hook 状态流这次计算的结果。
    return () => scheduler.stop()
    // assistantMode is stable for the session lifetime; store/setAppState are
    // stable refs from useSyncExternalStore; setMessages is a stable useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantMode])
}

// formatCronFireTime 封装useScheduledTasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatCronFireTime(d: Date): string {
  // 返回 `d`，作为React hook 状态流这次计算的结果。
  return d
    .toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(/,? at |, /, ' ')
    // 链式调用 replace，继续加工上一行在React hook 状态流中产生的数据。
    .replace(/ ([AP]M)/, (_, ampm) => ampm.toLowerCase())
}
