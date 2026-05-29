// Types extracted to src/types/permissions.ts to break import cycles
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionAllowDecision,
  PermissionAskDecision,
  PermissionDecision,
  PermissionDecisionReason,
  PermissionDenyDecision,
  PermissionMetadata,
  PermissionResult,
} from '../../types/permissions.js'

// Re-export for backwards compatibility
// 导出类型定义，让其他模块沿用权限工具 Permission Result的数据契约。
export type {
  PermissionAllowDecision,
  PermissionAskDecision,
  PermissionDecision,
  PermissionDecisionReason,
  PermissionDenyDecision,
  PermissionMetadata,
  PermissionResult,
}

// Helper function to get the appropriate prose description for rule behavior
// getRuleBehaviorDescription 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRuleBehaviorDescription(
  permissionResult: PermissionResult['behavior'],
): string {
  // 按照 permissionResult 的取值选择权限判定的具体处理分支。
  switch (permissionResult) {
    case 'allow':
      // 返回 `'allowed'`，作为权限判定这次计算的结果。
      return 'allowed'
    case 'deny':
      // 返回 `'denied'`，作为权限判定这次计算的结果。
      return 'denied'
    default:
      // 返回 `'asked for confirmation for'`，作为权限判定这次计算的结果。
      return 'asked for confirmation for'
  }
}
