// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type Notification,
  useNotifications,
} from '../../context/notifications.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'

// Result 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Result = Notification | Notification[] | null

/**
 * Fires notification(s) once on mount. Encapsulates the remote-mode gate and
 * once-per-session ref guard that was hand-rolled across 10+ notifs/ hooks.
 *
 * The compute fn runs exactly once on first effect. Return null to skip,
 * a Notification to fire one, or an array to fire several. Sync or async.
 * Rejections are routed to logError.
 */
// useStartupNotification 封装useStartupNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useStartupNotification(
  // 这个回调绑定到 compute: () => Result | Promise<Result>,，负责React hook 状态流在该局部场景下的响应。
  compute: () => Result | Promise<Result>,
): void {
  // 从 `useNotifications()` 解构 addNotification，减少React hook use Startup Notification对同一对象的重复访问。
  const { addNotification } = useNotifications()
  // hasRunRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasRunRef = useRef(false)
  // computeRef 引用保存`useRef`，供React hook后续处理使用。
  const computeRef = useRef(compute)
  // current更新为 `compute`，确保useStartupNotification后续读取最新状态。
  computeRef.current = compute

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `getIsRemoteMode() || hasRunRef.current` 成立时，React hook 状态流才启用这条专门路径。
    if (getIsRemoteMode() || hasRunRef.current) return
    // current更新为 `true`，确保useStartupNotification后续读取最新状态。
    hasRunRef.current = true

    // 显式忽略 `Promise.resolve()` 的返回值，只保留它触发的副作用。
    void Promise.resolve()
      // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
      .then(() => computeRef.current())
      // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
      .then(result => {
        // 结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!result) return
        // 逐项读取 `Array.isArray(result) ? result : [result]` 中的n，按输入顺序推进React hook 状态流。
        for (const n of Array.isArray(result) ? result : [result]) {
          // 调用 addNotification，触发React hook此处需要的副作用。
          addNotification(n)
        }
      })
      .catch(logError)
  }, [addNotification])
}
