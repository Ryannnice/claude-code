// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import z from 'zod/v4'
// Types extracted to src/types/permissions.ts to break import cycles
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionBehavior,
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
} from '../../types/permissions.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'

// Re-export for backwards compatibility
// 导出类型定义，让其他模块沿用权限工具 Permission Rule的数据契约。
export type {
  PermissionBehavior,
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
}

/**
 * ToolPermissionBehavior is the behavior associated with a permission rule.
 * 'allow' means the rule allows the tool to run.
 * 'deny' means the rule denies the tool from running.
 * 'ask' means the rule forces a prompt to be shown to the user.
 */
// permissionBehaviorSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const permissionBehaviorSchema = lazySchema(() =>
  z.enum(['allow', 'deny', 'ask']),
)

/**
 * PermissionRuleValue is the content of a permission rule.
 * @param toolName - The name of the tool this rule applies to
 * @param ruleContent - The optional content of the rule.
 *   Each tool may implement custom handling in `checkPermissions()`
 */
// permissionRuleValueSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const permissionRuleValueSchema = lazySchema(() =>
  z.object({
    toolName: z.string(),
    ruleContent: z.string().optional(),
  }),
)
