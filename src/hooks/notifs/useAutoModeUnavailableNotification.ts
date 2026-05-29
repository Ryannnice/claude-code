// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js'
// 类型依赖 { PermissionMode } 来自 ../../utils/permissions/PermissionMode.js，用于校准React hook 状态流的数据契约。
import type { PermissionMode } from '../../utils/permissions/PermissionMode.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getAutoModeUnavailableNotification,
  getAutoModeUnavailableReason,
} from '../../utils/permissions/permissionSetup.js'
// 复用 hasAutoModeOptIn 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { hasAutoModeOptIn } from '../../utils/settings/settings.js'

/**
 * Shows a one-shot notification when the shift-tab carousel wraps past where
 * auto mode would have been. Covers all reasons (settings, circuit-breaker,
 * org-allowlist). The startup case (defaultMode: auto silently downgraded) is
 * handled by verifyAutoModeGateAccess → checkAndDisableAutoModeIfNeeded.
 */
// useAutoModeUnavailableNotification 封装useAutoModeUnavailableNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAutoModeUnavailableNotification(): void {
  // 从 `useNotifications()` 解构 addNotification，减少React hook use Auto Mode Unavailabl...对同一对象的重复访问。
  const { addNotification } = useNotifications()
  // mode保存`useAppState`，供React hook后续处理使用。
  const mode = useAppState(s => s.toolPermissionContext.mode)
  // isAutoModeAvailable记录 `useAppState` 是否成立，React hook随后按该结果分支。
  const isAutoModeAvailable = useAppState(
    s => s.toolPermissionContext.isAutoModeAvailable,
  )
  // shownRef 引用保存`useRef`，供React hook后续处理使用。
  const shownRef = useRef(false)
  // prevModeRef 引用保存 hook 状态，让React hook use Auto M...跨渲染复用同一个容器。
  const prevModeRef = useRef<PermissionMode>(mode)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // prevMode 命名 `prevModeRef.current`，让后续代码直接表达这个值的用途。
    const prevMode = prevModeRef.current
    // current更新为 `mode`，确保useAutoModeUnavailableNotification后续读取最新状态。
    prevModeRef.current = mode

    // 满足 `!feature('TRANSCRIPT_CLASSIFIER')` 时，React hook执行该分支。
    if (!feature('TRANSCRIPT_CLASSIFIER')) return
    // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
    if (getIsRemoteMode()) return
    // 满足 `shownRef.current` 时，React hook执行该分支。
    if (shownRef.current) return

    // wrappedPastAutoSlot 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const wrappedPastAutoSlot =
      mode === 'default' &&
      prevMode !== 'default' &&
      prevMode !== 'auto' &&
      !isAutoModeAvailable &&
      hasAutoModeOptIn()

    // wrappedPastAutoSlot缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!wrappedPastAutoSlot) return

    // reason读取`getAutoModeUnavailableReason`，供React hook后续处理使用。
    const reason = getAutoModeUnavailableReason()
    // reason缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!reason) return

    // current更新为 `true`，确保useAutoModeUnavailableNotification后续读取最新状态。
    shownRef.current = true
    // 调用 addNotification，触发React hook此处需要的副作用。
    addNotification({
      key: 'auto-mode-unavailable',
      text: getAutoModeUnavailableNotification(reason),
      color: 'warning',
      priority: 'medium',
    })
  }, [mode, isAutoModeAvailable, addNotification])
}
