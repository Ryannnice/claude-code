// 引入 setMainLoopModelOverride，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setMainLoopModelOverride } from '../bootstrap/state.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import {
  clearApiKeyHelperCache,
  clearAwsCredentialsCache,
  clearGcpCredentialsCache,
} from '../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { toError } from '../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 applyConfigEnvironmentVariables 工具函数，把通用处理留在 ../utils/managedEnv.js 中维护。
import { applyConfigEnvironmentVariables } from '../utils/managedEnv.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import {
  permissionModeFromString,
  toExternalPermissionMode,
} from '../utils/permissions/PermissionMode.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import {
  notifyPermissionModeChanged,
  notifySessionMetadataChanged,
  type SessionExternalMetadata,
} from '../utils/sessionState.js'
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js'
// 类型依赖 { AppState } 来自 ./AppStateStore.js，用于校准应用状态管理的数据契约。
import type { AppState } from './AppStateStore.js'

// Inverse of the push below — restore on worker restart.
// externalMetadataToAppState 封装onChangeAppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function externalMetadataToAppState(
  metadata: SessionExternalMetadata,
): (prev: AppState) => AppState {
  // 返回 `prev => ({`，作为应用状态管理这次计算的结果。
  return prev => ({
    ...prev,
    ...(typeof metadata.permission_mode === 'string'
      ? {
          toolPermissionContext: {
            ...prev.toolPermissionContext,
            mode: permissionModeFromString(metadata.permission_mode),
          },
        }
      : {}),
    ...(typeof metadata.is_ultraplan_mode === 'boolean'
      ? { isUltraplanMode: metadata.is_ultraplan_mode }
      : {}),
  })
}

// onChangeAppState 封装onChangeAppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function onChangeAppState({
  newState,
  oldState,
}: {
  newState: AppState
  oldState: AppState
}) {
  // toolPermissionContext.mode — single choke point for CCR/SDK mode sync.
  //
  // Prior to this block, mode changes were relayed to CCR by only 2 of 8+
  // mutation paths: a bespoke setAppState wrapper in print.ts (headless/SDK
  // mode only) and a manual notify in the set_permission_mode handler.
  // Every other path — Shift+Tab cycling, ExitPlanModePermissionRequest
  // dialog options, the /plan slash command, rewind, the REPL bridge's
  // onSetPermissionMode — mutated AppState without telling
  // CCR, leaving external_metadata.permission_mode stale and the web UI out
  // of sync with the CLI's actual mode.
  //
  // Hooking the diff here means ANY setAppState call that changes the mode
  // notifies CCR (via notifySessionMetadataChanged → ccrClient.reportMetadata)
  // and the SDK status stream (via notifyPermissionModeChanged → registered
  // in print.ts). The scattered callsites above need zero changes.
  // prevMode 命名 `oldState.toolPermissionContext.mode`，让后续代码直接表达这个值的用途。
  const prevMode = oldState.toolPermissionContext.mode
  // newMode 命名 `newState.toolPermissionContext.mode`，让后续代码直接表达这个值的用途。
  const newMode = newState.toolPermissionContext.mode
  // `prevMode` 与 `newMode` 不一致时刷新派生状态，避免使用过期结果。
  if (prevMode !== newMode) {
    // CCR external_metadata must not receive internal-only mode names
    // (bubble, ungated auto). Externalize first — and skip
    // the CCR notify if the EXTERNAL mode didn't change (e.g.,
    // default→bubble→default is noise from CCR's POV since both
    // externalize to 'default'). The SDK channel (notifyPermissionModeChanged)
    // passes raw mode; its listener in print.ts applies its own filter.
    // prevExternal保存`toExternalPermissionMode`，供应用状态管理后续处理使用。
    const prevExternal = toExternalPermissionMode(prevMode)
    // newExternal保存`toExternalPermissionMode`，供应用状态管理后续处理使用。
    const newExternal = toExternalPermissionMode(newMode)
    // `prevExternal` 与 `newExternal` 不一致时刷新派生状态，避免使用过期结果。
    if (prevExternal !== newExternal) {
      // Ultraplan = first plan cycle only. The initial control_request
      // sets mode and isUltraplanMode atomically, so the flag's
      // transition gates it. null per RFC 7396 (removes the key).
      // isUltraplan 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isUltraplan =
        newExternal === 'plan' &&
        newState.isUltraplanMode &&
        !oldState.isUltraplanMode
          ? true
          : null
      // 调用 notifySessionMetadataChanged，触发应用状态管理此处需要的副作用。
      notifySessionMetadataChanged({
        permission_mode: newExternal,
        is_ultraplan_mode: isUltraplan,
      })
    }
    // 调用 notifyPermissionModeChanged，触发应用状态管理此处需要的副作用。
    notifyPermissionModeChanged(newMode)
  }

  // mainLoopModel: remove it from settings?
  // 应用状态管理在这里进入条件判断，后续代码按实际状态分流。
  if (
    newState.mainLoopModel !== oldState.mainLoopModel &&
    newState.mainLoopModel === null
  ) {
    // Remove from settings
    // 调用 updateSettingsForSource，触发应用状态管理此处需要的副作用。
    updateSettingsForSource('userSettings', { model: undefined })
    // setMainLoopModelOverride 写入新的状态值，使应用状态管理后续读取保持一致。
    setMainLoopModelOverride(null)
  }

  // mainLoopModel: add it to settings?
  // 应用状态管理在这里进入条件判断，后续代码按实际状态分流。
  if (
    newState.mainLoopModel !== oldState.mainLoopModel &&
    newState.mainLoopModel !== null
  ) {
    // Save to settings
    // 调用 updateSettingsForSource，触发应用状态管理此处需要的副作用。
    updateSettingsForSource('userSettings', { model: newState.mainLoopModel })
    // setMainLoopModelOverride 写入新的状态值，使应用状态管理后续读取保持一致。
    setMainLoopModelOverride(newState.mainLoopModel)
  }

  // expandedView → persist as showExpandedTodos + showSpinnerTree for backwards compat
  // `newState.expandedView` 与 `oldState.expandedView` 不一致时刷新派生状态，避免使用过期结果。
  if (newState.expandedView !== oldState.expandedView) {
    // showExpandedTodos 集合标记应用状态管理状态管理 on Change App State是否启用对应路径。
    const showExpandedTodos = newState.expandedView === 'tasks'
    // showSpinnerTree标记应用状态管理状态管理 on Change App State是否启用对应路径。
    const showSpinnerTree = newState.expandedView === 'teammates'
    // 应用状态管理在这里进入条件判断，后续代码按实际状态分流。
    if (
      getGlobalConfig().showExpandedTodos !== showExpandedTodos ||
      getGlobalConfig().showSpinnerTree !== showSpinnerTree
    ) {
      // 调用 saveGlobalConfig，触发应用状态管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        showExpandedTodos,
        showSpinnerTree,
      }))
    }
  }

  // verbose
  // 应用状态管理在这里进入条件判断，后续代码按实际状态分流。
  if (
    newState.verbose !== oldState.verbose &&
    getGlobalConfig().verbose !== newState.verbose
  ) {
    // verbose 命名 `newState.verbose`，让后续代码直接表达这个值的用途。
    const verbose = newState.verbose
    // 调用 saveGlobalConfig，触发应用状态管理此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      verbose,
    }))
  }

  // tungstenPanelVisible (ant-only tmux panel sticky toggle)
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，应用状态管理执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 应用状态管理在这里进入条件判断，后续代码按实际状态分流。
    if (
      newState.tungstenPanelVisible !== oldState.tungstenPanelVisible &&
      newState.tungstenPanelVisible !== undefined &&
      getGlobalConfig().tungstenPanelVisible !== newState.tungstenPanelVisible
    ) {
      // tungstenPanelVisible 命名 `newState.tungstenPanelVisible`，让后续代码直接表达这个值的用途。
      const tungstenPanelVisible = newState.tungstenPanelVisible
      // 调用 saveGlobalConfig，触发应用状态管理此处需要的副作用。
      saveGlobalConfig(current => ({ ...current, tungstenPanelVisible }))
    }
  }

  // settings: clear auth-related caches when settings change
  // This ensures apiKeyHelper and AWS/GCP credential changes take effect immediately
  // `newState.settings` 与 `oldState.settings` 不一致时刷新派生状态，避免使用过期结果。
  if (newState.settings !== oldState.settings) {
    // 保护这一段可能失败的应用状态管理操作，确保异常能进入相邻错误处理。
    try {
      // 清理相关缓存，确保应用状态管理下一次读取时重新加载最新数据。
      clearApiKeyHelperCache()
      // 清理相关缓存，确保应用状态管理下一次读取时重新加载最新数据。
      clearAwsCredentialsCache()
      // 清理相关缓存，确保应用状态管理下一次读取时重新加载最新数据。
      clearGcpCredentialsCache()

      // Re-apply environment variables when settings.env changes
      // This is additive-only: new vars are added, existing may be overwritten, nothing is deleted
      // `newState.settings.env` 与 `oldState.settings.env` 不一致时刷新派生状态，避免使用过期结果。
      if (newState.settings.env !== oldState.settings.env) {
        // 调用 applyConfigEnvironmentVariables，触发应用状态管理此处需要的副作用。
        applyConfigEnvironmentVariables()
      }
    } catch (error) {
      // 记录应用状态管理运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
    }
  }
}
