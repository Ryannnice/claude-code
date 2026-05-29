// 引入 AppState、useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { type AppState, useAppState } from '../state/AppState.js'

/**
 * Settings type as stored in AppState (DeepImmutable wrapped).
 * Use this type when you need to annotate variables that hold settings from useSettings().
 */
// ReadonlySettings 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReadonlySettings = AppState['settings']

/**
 * React hook to access current settings from AppState.
 * Settings automatically update when files change on disk via settingsChangeDetector.
 *
 * Use this instead of getSettings_DEPRECATED() in React components for reactive updates.
 */
// useSettings 封装useSettings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSettings(): ReadonlySettings {
  // 返回 `useAppState(s => s.settings)`，作为React hook 状态流这次计算的结果。
  return useAppState(s => s.settings)
}
