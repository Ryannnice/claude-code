// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type AppState,
  useAppState,
  useAppStateStore,
  useSetAppState,
} from 'src/state/AppState.js'
// 类型依赖 { ToolPermissionContext } 来自 src/Tool.js，用于校准权限判定的数据契约。
import type { ToolPermissionContext } from 'src/Tool.js'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  createDisabledBypassPermissionsContext,
  shouldDisableBypassPermissions,
  verifyAutoModeGateAccess,
} from './permissionSetup.js'

// bypassPermissionsCheckRan 权限数据标记权限判定权限工具 bypass Permissions Kills...是否启用对应路径。
let bypassPermissionsCheckRan = false

// checkAndDisableBypassPermissionsIfNeeded 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndDisableBypassPermissionsIfNeeded(
  toolPermissionContext: ToolPermissionContext,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责权限判定在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
): Promise<void> {
  // Check if bypassPermissions should be disabled based on Statsig gate
  // Do this only once, before the first query, to ensure we have the latest gate value
  // 满足 `bypassPermissionsCheckRan` 时，权限判定执行该分支。
  if (bypassPermissionsCheckRan) {
    // 权限工具 bypass Permissions Killswitch在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // bypassPermissionsCheckRan 权限数据更新为 `true`，确保权限工具后续读取最新状态。
  bypassPermissionsCheckRan = true

  // toolPermissionContext.isBypassPermissionsModeAva 权限数据缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!toolPermissionContext.isBypassPermissionsModeAvailable) {
    // 权限工具 bypass Permissions Killswitch在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // shouldDisable记录 `shouldDisableBypassPermissions` 是否成立，权限判定随后按该结果分支。
  const shouldDisable = await shouldDisableBypassPermissions()
  // shouldDisable缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!shouldDisable) {
    // 权限工具 bypass Permissions Killswitch在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // setAppState 写入新的状态值，使权限判定后续读取保持一致。
  setAppState(prev => {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      ...prev,
      toolPermissionContext: createDisabledBypassPermissionsContext(
        prev.toolPermissionContext,
      ),
    }
  })
}

/**
 * Reset the run-once flag for checkAndDisableBypassPermissionsIfNeeded.
 * Call this after /login so the gate check re-runs with the new org.
 */
// resetBypassPermissionsCheck 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetBypassPermissionsCheck(): void {
  // bypassPermissionsCheckRan 权限数据更新为 `false`，确保权限工具后续读取最新状态。
  bypassPermissionsCheckRan = false
}

// useKickOffCheckAndDisableBypassPermissionsIfNeeded 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useKickOffCheckAndDisableBypassPermissionsIfNeeded(): void {
  // toolPermissionContext 权限数据保存`useAppState`，供权限判定后续处理使用。
  const toolPermissionContext = useAppState(s => s.toolPermissionContext)
  // setAppState 状态保存`useSetAppState`，供权限判定后续处理使用。
  const setAppState = useSetAppState()

  // Run once, when the component mounts
  // 调用 useEffect，触发权限判定此处需要的副作用。
  useEffect(() => {
    // 满足 `getIsRemoteMode()` 时，权限判定执行该分支。
    if (getIsRemoteMode()) return
    // 显式忽略 `checkAndDisableBypassPermissionsIfNeeded(` 的返回值，只保留它触发的副作用。
    void checkAndDisableBypassPermissionsIfNeeded(
      toolPermissionContext,
      setAppState,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// autoModeCheckRan标记权限判定权限工具 bypass Permissions Kills...是否启用对应路径。
let autoModeCheckRan = false

// checkAndDisableAutoModeIfNeeded 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndDisableAutoModeIfNeeded(
  toolPermissionContext: ToolPermissionContext,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责权限判定在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  fastMode?: boolean,
): Promise<void> {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // 满足 `autoModeCheckRan` 时，权限判定执行该分支。
    if (autoModeCheckRan) {
      // 权限工具 bypass Permissions Killswitch在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // autoModeCheckRan更新为 `true`，确保权限工具后续读取最新状态。
    autoModeCheckRan = true

    // 从 `await verifyAutoModeGateAccess(` 解构 updateContext、notification，减少权限工具 bypass Permissions Killswitch对同一对象的重复访问。
    const { updateContext, notification } = await verifyAutoModeGateAccess(
      toolPermissionContext,
      fastMode,
    )
    // setAppState 写入新的状态值，使权限判定后续读取保持一致。
    setAppState(prev => {
      // Apply the transform to CURRENT context, not the stale snapshot we
      // passed to verifyAutoModeGateAccess. The async GrowthBook await inside
      // can be outrun by a mid-turn shift-tab; spreading a stale context here
      // would revert the user's mode change.
      // nextCtx保存`updateContext`，供权限判定后续处理使用。
      const nextCtx = updateContext(prev.toolPermissionContext)
      // newState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const newState =
        nextCtx === prev.toolPermissionContext
          ? prev
          : { ...prev, toolPermissionContext: nextCtx }
      // notification缺失时直接走兜底路径，避免权限判定使用无效输入。
      if (!notification) return newState
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...newState,
        notifications: {
          ...newState.notifications,
          queue: [
            ...newState.notifications.queue,
            {
              key: 'auto-mode-gate-notification',
              text: notification,
              color: 'warning' as const,
              priority: 'high' as const,
            },
          ],
        },
      }
    })
  }
}

/**
 * Reset the run-once flag for checkAndDisableAutoModeIfNeeded.
 * Call this after /login so the gate check re-runs with the new org.
 */
// resetAutoModeGateCheck 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetAutoModeGateCheck(): void {
  // autoModeCheckRan更新为 `false`，确保权限工具后续读取最新状态。
  autoModeCheckRan = false
}

// useKickOffCheckAndDisableAutoModeIfNeeded 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useKickOffCheckAndDisableAutoModeIfNeeded(): void {
  // mainLoopModel保存`useAppState`，供权限判定后续处理使用。
  const mainLoopModel = useAppState(s => s.mainLoopModel)
  // mainLoopModelForSession 会话数据保存`useAppState`，供权限判定后续处理使用。
  const mainLoopModelForSession = useAppState(s => s.mainLoopModelForSession)
  // fastMode保存`useAppState`，供权限判定后续处理使用。
  const fastMode = useAppState(s => s.fastMode)
  // setAppState 状态保存`useSetAppState`，供权限判定后续处理使用。
  const setAppState = useSetAppState()
  // store保存`useAppStateStore`，供权限判定后续处理使用。
  const store = useAppStateStore()
  // isFirstRunRef 引用记录 `useRef` 是否成立，权限判定随后按该结果分支。
  const isFirstRunRef = useRef(true)

  // Runs on mount (startup check) AND whenever the model or fast mode changes
  // (kick-out / carousel-restore). Watching both model fields covers /model,
  // Cmd+P picker, /config, and bridge onSetModel paths; fastMode covers
  // /fast on|off for the tengu_auto_mode_config.disableFastMode circuit
  // breaker. The print.ts headless paths are covered by the sync
  // isAutoModeGateEnabled() check.
  // 调用 useEffect，触发权限判定此处需要的副作用。
  useEffect(() => {
    // 满足 `getIsRemoteMode()` 时，权限判定执行该分支。
    if (getIsRemoteMode()) return
    // 满足 `isFirstRunRef.current` 时，权限判定执行该分支。
    if (isFirstRunRef.current) {
      // current更新为 `false`，确保权限工具后续读取最新状态。
      isFirstRunRef.current = false
    } else {
      // 调用 resetAutoModeGateCheck，触发权限判定此处需要的副作用。
      resetAutoModeGateCheck()
    }
    // 显式忽略 `checkAndDisableAutoModeIfNeeded(` 的返回值，只保留它触发的副作用。
    void checkAndDisableAutoModeIfNeeded(
      store.getState().toolPermissionContext,
      setAppState,
      fastMode,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainLoopModel, mainLoopModelForSession, fastMode])
}
