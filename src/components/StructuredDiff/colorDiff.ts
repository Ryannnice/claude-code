// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  ColorDiff,
  ColorFile,
  getSyntaxTheme as nativeGetSyntaxTheme,
  type SyntaxTheme,
} from 'color-diff-napi'
// 复用 isEnvDefinedFalsy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy } from '../../utils/envUtils.js'

// ColorModuleUnavailableReason 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ColorModuleUnavailableReason = 'env'

/**
 * Returns a static reason why the color-diff module is unavailable, or null if available.
 * 'env' = disabled via CLAUDE_CODE_SYNTAX_HIGHLIGHT
 *
 * The TS port of color-diff works in all build modes, so the only way to
 * disable it is via the env var.
 */
// getColorModuleUnavailableReason 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getColorModuleUnavailableReason(): ColorModuleUnavailableReason | null {
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT)` 时，终端渲染执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT)) {
    // 返回 `'env'`，作为终端渲染这次计算的结果。
    return 'env'
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// expectColorDiff 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expectColorDiff(): typeof ColorDiff | null {
  // 返回 `getColorModuleUnavailableReason() === null ? ColorDiff : null`，作为终端渲染这次计算的结果。
  return getColorModuleUnavailableReason() === null ? ColorDiff : null
}

// expectColorFile 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expectColorFile(): typeof ColorFile | null {
  // 返回 `getColorModuleUnavailableReason() === null ? ColorFile : null`，作为终端渲染这次计算的结果。
  return getColorModuleUnavailableReason() === null ? ColorFile : null
}

// getSyntaxTheme 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSyntaxTheme(themeName: string): SyntaxTheme | null {
  // 返回 `getColorModuleUnavailableReason() === null`，作为终端渲染这次计算的结果。
  return getColorModuleUnavailableReason() === null
    ? nativeGetSyntaxTheme(themeName)
    : null
}
