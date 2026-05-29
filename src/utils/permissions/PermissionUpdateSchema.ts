// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Zod schemas for permission updates.
 *
 * This file is intentionally kept minimal with no complex dependencies
 * so it can be safely imported by src/types/hooks.ts without creating
 * circular dependencies.
 */
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import z from 'zod/v4'
// Types extracted to src/types/permissions.ts to break import cycles
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionUpdate,
  PermissionUpdateDestination,
} from '../../types/permissions.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 externalPermissionModeSchema，将 ./PermissionMode.js 中已经封装好的能力接到本文件流程里。
import { externalPermissionModeSchema } from './PermissionMode.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  permissionBehaviorSchema,
  permissionRuleValueSchema,
} from './PermissionRule.js'

// Re-export for backwards compatibility
// 导出类型定义，让其他模块沿用权限工具 Permission Update Schema的数据契约。
export type { PermissionUpdate, PermissionUpdateDestination }

/**
 * PermissionUpdateDestination is where a new permission rule should be saved to.
 */
// permissionUpdateDestinationSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const permissionUpdateDestinationSchema = lazySchema(() =>
  z.enum([
    // User settings (global)
    'userSettings',
    // Project settings (shared per-directory)
    'projectSettings',
    // Local settings (gitignored)
    'localSettings',
    // In-memory for the current session only
    'session',
    // From the command line arguments
    'cliArg',
  ]),
)

// permissionUpdateSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const permissionUpdateSchema = lazySchema(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('addRules'),
      rules: z.array(permissionRuleValueSchema()),
      behavior: permissionBehaviorSchema(),
      destination: permissionUpdateDestinationSchema(),
    }),
    z.object({
      type: z.literal('replaceRules'),
      rules: z.array(permissionRuleValueSchema()),
      behavior: permissionBehaviorSchema(),
      destination: permissionUpdateDestinationSchema(),
    }),
    z.object({
      type: z.literal('removeRules'),
      rules: z.array(permissionRuleValueSchema()),
      behavior: permissionBehaviorSchema(),
      destination: permissionUpdateDestinationSchema(),
    }),
    z.object({
      type: z.literal('setMode'),
      mode: externalPermissionModeSchema(),
      destination: permissionUpdateDestinationSchema(),
    }),
    z.object({
      type: z.literal('addDirectories'),
      directories: z.array(z.string()),
      destination: permissionUpdateDestinationSchema(),
    }),
    z.object({
      type: z.literal('removeDirectories'),
      directories: z.array(z.string()),
      destination: permissionUpdateDestinationSchema(),
    }),
  ]),
)
