// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { PendingClassifierCheck } 来自 ../../../types/permissions.js，用于校准React hook 状态流的数据契约。
import type { PendingClassifierCheck } from '../../../types/permissions.js'
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js'
// 类型依赖 { PermissionDecision } 来自 ../../../utils/permissions/PermissionResult.js，用于校准React hook 状态流的数据契约。
import type { PermissionDecision } from '../../../utils/permissions/PermissionResult.js'
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准React hook 状态流的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js'
// 类型依赖 { PermissionContext } 来自 ../PermissionContext.js，用于校准React hook 状态流的数据契约。
import type { PermissionContext } from '../PermissionContext.js'

// CoordinatorPermissionParams 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type CoordinatorPermissionParams = {
  ctx: PermissionContext
  pendingClassifierCheck?: PendingClassifierCheck | undefined
  updatedInput: Record<string, unknown> | undefined
  suggestions: PermissionUpdate[] | undefined
  permissionMode: string | undefined
}

/**
 * Handles the coordinator worker permission flow.
 *
 * For coordinator workers, automated checks (hooks and classifier) are
 * awaited sequentially before falling through to the interactive dialog.
 *
 * Returns a PermissionDecision if the automated checks resolved the
 * permission, or null if the caller should fall through to the
 * interactive dialog.
 */
// handleCoordinatorPermission 封装coordinatorHandler的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleCoordinatorPermission(
  params: CoordinatorPermissionParams,
): Promise<PermissionDecision | null> {
  // 从 `params` 解构 ctx、updatedInput、suggestions、permissionMode，减少React hook coordinator Handler对同一对象的重复访问。
  const { ctx, updatedInput, suggestions, permissionMode } = params

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // 1. Try permission hooks first (fast, local)
    // hookResult保存`ctx.runHooks`，供React hook后续处理使用。
    const hookResult = await ctx.runHooks(
      permissionMode,
      suggestions,
      updatedInput,
    )
    // 满足 `hookResult` 时，React hook执行该分支。
    if (hookResult) return hookResult

    // 2. Try classifier (slow, inference -- bash only)
    // classifierResult保存`feature`，供React hook后续处理使用。
    const classifierResult = feature('BASH_CLASSIFIER')
      ? await ctx.tryClassifier?.(params.pendingClassifierCheck, updatedInput)
      : null
    // 满足 `classifierResult` 时，React hook执行该分支。
    if (classifierResult) {
      // 返回 `classifierResult`，作为React hook 状态流这次计算的结果。
      return classifierResult
    }
  } catch (error) {
    // If automated checks fail unexpectedly, fall through to show the dialog
    // so the user can decide manually. Non-Error throws get a context prefix
    // so the log is traceable — intentionally NOT toError(), which would drop
    // the prefix.
    // 满足 `error instanceof Error` 时，React hook执行该分支。
    if (error instanceof Error) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(error)
    } else {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Automated permission check failed: ${String(error)}`))
    }
  }

  // 3. Neither resolved (or checks failed) -- fall through to dialog below.
  // Hooks already ran, classifier already consumed.
  // 返回 `null`，作为React hook 状态流这次计算的结果。
  return null
}

// 重新导出这一组成员，让React hook 状态流的公共 API 保持集中入口。
export { handleCoordinatorPermission }
// 导出类型定义，让其他模块沿用React hook coordinator Handler的数据契约。
export type { CoordinatorPermissionParams }
