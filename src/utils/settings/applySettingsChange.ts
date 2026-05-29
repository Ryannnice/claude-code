// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 updateHooksConfigSnapshot，将 ../hooks/hooksConfigSnapshot.js 中已经封装好的能力接到本文件流程里。
import { updateHooksConfigSnapshot } from '../hooks/hooksConfigSnapshot.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createDisabledBypassPermissionsContext,
  findOverlyBroadBashPermissions,
  isBypassPermissionsModeDisabled,
  removeDangerousPermissions,
  transitionPlanAutoMode,
} from '../permissions/permissionSetup.js'
// 引入 syncPermissionRulesFromDisk，将 ../permissions/permissions.js 中已经封装好的能力接到本文件流程里。
import { syncPermissionRulesFromDisk } from '../permissions/permissions.js'
// 引入 loadAllPermissionRulesFromDisk，将 ../permissions/permissionsLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPermissionRulesFromDisk } from '../permissions/permissionsLoader.js'
// 类型依赖 { SettingSource } 来自 ./constants.js，用于校准共享工具的数据契约。
import type { SettingSource } from './constants.js'
// 引入 getInitialSettings，将 ./settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings.js'

/**
 * Apply a settings change to app state. Re-reads settings from disk,
 * reloads permissions and hooks, and pushes the new state.
 *
 * Used by both the interactive path (AppState.tsx via useSettingsChange) and
 * the headless/SDK path (print.ts direct subscribe) so that managed-settings
 * / policy changes are fully applied in both modes.
 *
 * The settings cache is reset by the notifier (changeDetector.fanOut) before
 * listeners are iterated, so getInitialSettings() here reads fresh disk
 * state. Previously this function reset the cache itself, which — combined
 * with useSettingsChange's own reset — caused N disk reloads per notification
 * for N subscribers.
 *
 * Side-effects like clearing auth caches and applying env vars are handled by
 * `onChangeAppState` which fires when `settings` changes in state.
 */
// applySettingsChange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySettingsChange(
  source: SettingSource,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
): void {
  // newSettings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const newSettings = getInitialSettings()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Settings changed from ${source}, updating app state`)

  // updatedRules 集合读取`loadAllPermissionRulesFromDisk`，供共享工具后续处理使用。
  const updatedRules = loadAllPermissionRulesFromDisk()
  // 调用 updateHooksConfigSnapshot，触发共享工具此处需要的副作用。
  updateHooksConfigSnapshot()

  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // newContext保存`syncPermissionRulesFromDisk`，供共享工具后续处理使用。
    let newContext = syncPermissionRulesFromDisk(
      prev.toolPermissionContext,
      updatedRules,
    )

    // Ant-only: re-strip overly broad Bash allow rules after settings sync
    // 共享工具在这里按实际状态进入对应分支。
    if (
      process.env.USER_TYPE === 'ant' &&
      process.env.CLAUDE_CODE_ENTRYPOINT !== 'local-agent'
    ) {
      // overlyBroad筛选`findOverlyBroadBashPermissions`，供共享工具后续处理使用。
      const overlyBroad = findOverlyBroadBashPermissions(updatedRules, [])
      // 满足 `overlyBroad.length > 0` 时，共享工具执行该分支。
      if (overlyBroad.length > 0) {
        // newContext更新为 `removeDangerousPermissions(newContext, overlyBroad)`，确保共享工具后续读取最新状态。
        newContext = removeDangerousPermissions(newContext, overlyBroad)
      }
    }

    // 共享工具在这里按实际状态进入对应分支。
    if (
      newContext.isBypassPermissionsModeAvailable &&
      isBypassPermissionsModeDisabled()
    ) {
      // newContext更新为 `createDisabledBypassPermissionsContext(newContext)`，确保共享工具后续读取最新状态。
      newContext = createDisabledBypassPermissionsContext(newContext)
    }

    // newContext更新为 `transitionPlanAutoMode(newContext)`，确保共享工具后续读取最新状态。
    newContext = transitionPlanAutoMode(newContext)

    // Sync effortLevel from settings to top-level AppState when it changes
    // (e.g. via applyFlagSettings from IDE). Only propagate if the setting
    // itself changed — otherwise unrelated settings churn (e.g. tips dismissal
    // on startup) would clobber a --effort CLI flag value held in AppState.
    // prevEffort保存`prev.settings.effortLevel`，供共享工具 apply Settings Change后续判断或输出使用。
    const prevEffort = prev.settings.effortLevel
    // newEffort 命名 `newSettings.effortLevel`，让后续代码直接表达这个值的用途。
    const newEffort = newSettings.effortLevel
    // effortChanged标记共享工具 apply Settings Change是否启用对应路径。
    const effortChanged = prevEffort !== newEffort

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...prev,
      settings: newSettings,
      toolPermissionContext: newContext,
      // Only propagate a defined new value — when the disk key is absent
      // (e.g. /effort max for non-ants writes undefined; --effort CLI flag),
      // prev.settings.effortLevel can be stale (internal writes suppress the
      // watcher that would resync AppState.settings), so effortChanged would
      // be true and we'd wipe a session-scoped value held in effortValue.
      ...(effortChanged && newEffort !== undefined
        ? { effortValue: newEffort }
        : {}),
    }
  })
}
