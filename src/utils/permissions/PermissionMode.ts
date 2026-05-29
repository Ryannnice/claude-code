// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import z from 'zod/v4'
// 引入 PAUSE_ICON，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { PAUSE_ICON } from '../../constants/figures.js'
// Types extracted to src/types/permissions.ts to break import cycles
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  EXTERNAL_PERMISSION_MODES,
  type ExternalPermissionMode,
  PERMISSION_MODES,
  type PermissionMode,
} from '../../types/permissions.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'

// Re-export for backwards compatibility
// 重新导出这一组成员，让权限判定的公共 API 保持集中入口。
export {
  EXTERNAL_PERMISSION_MODES,
  PERMISSION_MODES,
  type ExternalPermissionMode,
  type PermissionMode,
}

// permissionModeSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const permissionModeSchema = lazySchema(() => z.enum(PERMISSION_MODES))
// externalPermissionModeSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
export const externalPermissionModeSchema = lazySchema(() =>
  z.enum(EXTERNAL_PERMISSION_MODES),
)

// ModeColorKey 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
type ModeColorKey =
  | 'text'
  | 'planMode'
  | 'permission'
  | 'autoAccept'
  | 'error'
  | 'warning'

// PermissionModeConfig 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionModeConfig = {
  title: string
  shortTitle: string
  symbol: string
  color: ModeColorKey
  external: ExternalPermissionMode
}

// PERMISSION_MODE_CONFIG 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
const PERMISSION_MODE_CONFIG: Partial<
  Record<PermissionMode, PermissionModeConfig>
> = {
  default: {
    title: 'Default',
    shortTitle: 'Default',
    symbol: '',
    color: 'text',
    external: 'default',
  },
  plan: {
    title: 'Plan Mode',
    shortTitle: 'Plan',
    symbol: PAUSE_ICON,
    color: 'planMode',
    external: 'plan',
  },
  acceptEdits: {
    title: 'Accept edits',
    shortTitle: 'Accept',
    symbol: '⏵⏵',
    color: 'autoAccept',
    external: 'acceptEdits',
  },
  bypassPermissions: {
    title: 'Bypass Permissions',
    shortTitle: 'Bypass',
    symbol: '⏵⏵',
    color: 'error',
    external: 'bypassPermissions',
  },
  dontAsk: {
    title: "Don't Ask",
    shortTitle: 'DontAsk',
    symbol: '⏵⏵',
    color: 'error',
    external: 'dontAsk',
  },
  ...(feature('TRANSCRIPT_CLASSIFIER')
    ? {
        auto: {
          title: 'Auto mode',
          shortTitle: 'Auto',
          symbol: '⏵⏵',
          color: 'warning' as ModeColorKey,
          external: 'default' as ExternalPermissionMode,
        },
      }
    : {}),
}

/**
 * Type guard to check if a PermissionMode is an ExternalPermissionMode.
 * auto is ant-only and excluded from external modes.
 */
// isExternalPermissionMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isExternalPermissionMode(
  mode: PermissionMode,
): mode is ExternalPermissionMode {
  // External users can't have auto, so always true for them
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 `mode !== 'auto' && mode !== 'bubble'`，作为权限判定这次计算的结果。
  return mode !== 'auto' && mode !== 'bubble'
}

// getModeConfig 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getModeConfig(mode: PermissionMode): PermissionModeConfig {
  // 返回 `PERMISSION_MODE_CONFIG[mode] ?? PERMISSION_MODE_CONFIG.default!`，作为权限判定这次计算的结果。
  return PERMISSION_MODE_CONFIG[mode] ?? PERMISSION_MODE_CONFIG.default!
}

// toExternalPermissionMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toExternalPermissionMode(
  mode: PermissionMode,
): ExternalPermissionMode {
  // 返回 `getModeConfig(mode).external`，作为权限判定这次计算的结果。
  return getModeConfig(mode).external
}

// permissionModeFromString 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionModeFromString(str: string): PermissionMode {
  // 返回 `(PERMISSION_MODES as readonly string[]).includes(str)`，作为权限判定这次计算的结果。
  return (PERMISSION_MODES as readonly string[]).includes(str)
    ? (str as PermissionMode)
    : 'default'
}

// permissionModeTitle 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionModeTitle(mode: PermissionMode): string {
  // 返回 `getModeConfig(mode).title`，作为权限判定这次计算的结果。
  return getModeConfig(mode).title
}

// isDefaultMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDefaultMode(mode: PermissionMode | undefined): boolean {
  // 返回 `mode === 'default' || mode === undefined`，作为权限判定这次计算的结果。
  return mode === 'default' || mode === undefined
}

// permissionModeShortTitle 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionModeShortTitle(mode: PermissionMode): string {
  // 返回 `getModeConfig(mode).shortTitle`，作为权限判定这次计算的结果。
  return getModeConfig(mode).shortTitle
}

// permissionModeSymbol 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionModeSymbol(mode: PermissionMode): string {
  // 返回 `getModeConfig(mode).symbol`，作为权限判定这次计算的结果。
  return getModeConfig(mode).symbol
}

// getModeColor 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModeColor(mode: PermissionMode): ModeColorKey {
  // 返回 `getModeConfig(mode).color`，作为权限判定这次计算的结果。
  return getModeConfig(mode).color
}
