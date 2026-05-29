// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { PermissionMode } 来自 ./PermissionMode.js，用于校准权限判定的数据契约。
import type { PermissionMode } from './PermissionMode.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getAutoModeUnavailableReason,
  isAutoModeGateEnabled,
  transitionPermissionMode,
} from './permissionSetup.js'

// Checks both the cached isAutoModeAvailable (set at startup by
// verifyAutoModeGateAccess) and the live isAutoModeGateEnabled() — these can
// diverge if the circuit breaker or settings change mid-session. The
// live check prevents transitionPermissionMode from throwing
// (permissionSetup.ts:~559), which would silently crash the shift+tab handler
// and leave the user stuck at the current mode.
// canCycleToAuto 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function canCycleToAuto(ctx: ToolPermissionContext): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // gateEnabled保存`isAutoModeGateEnabled`，供权限判定后续处理使用。
    const gateEnabled = isAutoModeGateEnabled()
    // can标记权限判定权限工具 get Next Permission Mode是否启用对应路径。
    const can = !!ctx.isAutoModeAvailable && gateEnabled
    // can缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!can) {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[auto-mode] canCycleToAuto=false: ctx.isAutoModeAvailable=${ctx.isAutoModeAvailable} isAutoModeGateEnabled=${gateEnabled} reason=${getAutoModeUnavailableReason()}`,
      )
    }
    // 返回 `can`，作为权限判定这次计算的结果。
    return can
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Determines the next permission mode when cycling through modes with Shift+Tab.
 */
// getNextPermissionMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNextPermissionMode(
  toolPermissionContext: ToolPermissionContext,
  _teamContext?: { leadAgentId: string },
): PermissionMode {
  // 按照 toolPermissionContext.mode 的取值选择权限判定的具体处理分支。
  switch (toolPermissionContext.mode) {
    case 'default':
      // Ants skip acceptEdits and plan — auto mode replaces them
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，权限判定执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 满足 `toolPermissionContext.isBypassPermissionsModeAvai` 时，权限判定执行该分支。
        if (toolPermissionContext.isBypassPermissionsModeAvailable) {
          // 返回 `'bypassPermissions'`，作为权限判定这次计算的结果。
          return 'bypassPermissions'
        }
        // 满足 `canCycleToAuto(toolPermissionContext)` 时，权限判定执行该分支。
        if (canCycleToAuto(toolPermissionContext)) {
          // 返回 `'auto'`，作为权限判定这次计算的结果。
          return 'auto'
        }
        // 返回 `'default'`，作为权限判定这次计算的结果。
        return 'default'
      }
      // 返回 `'acceptEdits'`，作为权限判定这次计算的结果。
      return 'acceptEdits'

    case 'acceptEdits':
      // 返回 `'plan'`，作为权限判定这次计算的结果。
      return 'plan'

    case 'plan':
      // 满足 `toolPermissionContext.isBypassPermissionsModeAvai` 时，权限判定执行该分支。
      if (toolPermissionContext.isBypassPermissionsModeAvailable) {
        // 返回 `'bypassPermissions'`，作为权限判定这次计算的结果。
        return 'bypassPermissions'
      }
      // 满足 `canCycleToAuto(toolPermissionContext)` 时，权限判定执行该分支。
      if (canCycleToAuto(toolPermissionContext)) {
        // 返回 `'auto'`，作为权限判定这次计算的结果。
        return 'auto'
      }
      // 返回 `'default'`，作为权限判定这次计算的结果。
      return 'default'

    case 'bypassPermissions':
      // 满足 `canCycleToAuto(toolPermissionContext)` 时，权限判定执行该分支。
      if (canCycleToAuto(toolPermissionContext)) {
        // 返回 `'auto'`，作为权限判定这次计算的结果。
        return 'auto'
      }
      // 返回 `'default'`，作为权限判定这次计算的结果。
      return 'default'

    case 'dontAsk':
      // Not exposed in UI cycle yet, but return default if somehow reached
      // 返回 `'default'`，作为权限判定这次计算的结果。
      return 'default'


    default:
      // Covers auto (when TRANSCRIPT_CLASSIFIER is enabled) and any future modes — always fall back to default
      // 返回 `'default'`，作为权限判定这次计算的结果。
      return 'default'
  }
}

/**
 * Computes the next permission mode and prepares the context for it.
 * Handles any context cleanup needed for the target mode (e.g., stripping
 * dangerous permissions when entering auto mode).
 *
 * @returns The next mode and the context to use (with dangerous permissions stripped if needed)
 */
// cyclePermissionMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cyclePermissionMode(
  toolPermissionContext: ToolPermissionContext,
  teamContext?: { leadAgentId: string },
): { nextMode: PermissionMode; context: ToolPermissionContext } {
  // nextMode读取`getNextPermissionMode`，供权限判定后续处理使用。
  const nextMode = getNextPermissionMode(toolPermissionContext, teamContext)
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    nextMode,
    context: transitionPermissionMode(
      toolPermissionContext.mode,
      nextMode,
      toolPermissionContext,
    ),
  }
}
