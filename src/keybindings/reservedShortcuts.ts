// 复用 getPlatform 工具函数，把通用处理留在 ../utils/platform.js 中维护。
import { getPlatform } from '../utils/platform.js'

/**
 * Shortcuts that are typically intercepted by the OS, terminal, or shell
 * and will likely never reach the application.
 */
// ReservedShortcut 固化reserved Shortcuts里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReservedShortcut = {
  key: string
  reason: string
  severity: 'error' | 'warning'
}

/**
 * Shortcuts that cannot be rebound - they are hardcoded in Claude Code.
 */
// NON_REBINDABLE 聚合成有序列表，保持后续遍历顺序稳定。
export const NON_REBINDABLE: ReservedShortcut[] = [
  {
    key: 'ctrl+c',
    reason: 'Cannot be rebound - used for interrupt/exit (hardcoded)',
    severity: 'error',
  },
  {
    key: 'ctrl+d',
    reason: 'Cannot be rebound - used for exit (hardcoded)',
    severity: 'error',
  },
  {
    key: 'ctrl+m',
    reason:
      'Cannot be rebound - identical to Enter in terminals (both send CR)',
    severity: 'error',
  },
]

/**
 * Terminal control shortcuts that are intercepted by the terminal/OS.
 * These will likely never reach the application.
 *
 * Note: ctrl+s (XOFF) and ctrl+q (XON) are NOT included here because:
 * - Most modern terminals disable flow control by default
 * - We use ctrl+s for the stash feature
 */
// TERMINAL_RESERVED 聚合成有序列表，保持后续遍历顺序稳定。
export const TERMINAL_RESERVED: ReservedShortcut[] = [
  {
    key: 'ctrl+z',
    reason: 'Unix process suspend (SIGTSTP)',
    severity: 'warning',
  },
  {
    key: 'ctrl+\\',
    reason: 'Terminal quit signal (SIGQUIT)',
    severity: 'error',
  },
]

/**
 * macOS-specific shortcuts that the OS intercepts.
 */
// MACOS_RESERVED 聚合成有序列表，保持后续遍历顺序稳定。
export const MACOS_RESERVED: ReservedShortcut[] = [
  { key: 'cmd+c', reason: 'macOS system copy', severity: 'error' },
  { key: 'cmd+v', reason: 'macOS system paste', severity: 'error' },
  { key: 'cmd+x', reason: 'macOS system cut', severity: 'error' },
  { key: 'cmd+q', reason: 'macOS quit application', severity: 'error' },
  { key: 'cmd+w', reason: 'macOS close window/tab', severity: 'error' },
  { key: 'cmd+tab', reason: 'macOS app switcher', severity: 'error' },
  { key: 'cmd+space', reason: 'macOS Spotlight', severity: 'error' },
]

/**
 * Get all reserved shortcuts for the current platform.
 * Includes non-rebindable shortcuts and terminal-reserved shortcuts.
 */
// getReservedShortcuts 封装reservedShortcuts的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getReservedShortcuts(): ReservedShortcut[] {
  // platform读取`getPlatform`，供reserved Shortcuts后续处理使用。
  const platform = getPlatform()
  // Non-rebindable shortcuts first (highest priority)
  // reserved 聚合成有序列表，保持后续遍历顺序稳定。
  const reserved = [...NON_REBINDABLE, ...TERMINAL_RESERVED]

  // 当 `platform` 匹配 `'macos'` 时，reserved Shortcuts执行对应分支。
  if (platform === 'macos') {
    // reserved追加新条目，保持收集顺序与输入顺序一致。
    reserved.push(...MACOS_RESERVED)
  }

  // 返回 `reserved`，作为reserved Shortcuts这次计算的结果。
  return reserved
}

/**
 * Normalize a key string for comparison (lowercase, sorted modifiers).
 * Chords (space-separated steps like "ctrl+x ctrl+b") are normalized
 * per-step — splitting on '+' first would mangle "x ctrl" into a mainKey
 * overwritten by the next step, collapsing the chord into its last key.
 */
// normalizeKeyForComparison 封装reservedShortcuts的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeKeyForComparison(key: string): string {
  // 返回 `key.trim().split(/\s+/).map(normalizeStep).join(' ')`，作为reserved Shortcuts这次计算的结果。
  return key.trim().split(/\s+/).map(normalizeStep).join(' ')
}

// normalizeStep 封装reservedShortcuts的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeStep(step: string): string {
  // 片段列表格式化`step.split`，供reserved Shortcuts后续处理使用。
  const parts = step.split('+')
  // modifiers 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const modifiers: string[] = []
  // mainKey 命名 `''`，让后续代码直接表达这个值的用途。
  let mainKey = ''

  // 按顺序遍历 `parts` 中的part，逐个交给reserved Shortcuts处理。
  for (const part of parts) {
    // lower格式化`part.trim`，供reserved Shortcuts后续处理使用。
    const lower = part.trim().toLowerCase()
    // reserved Shortcuts在这里进入条件判断，后续代码按实际状态分流。
    if (
      [
        'ctrl',
        'control',
        'alt',
        'opt',
        'option',
        'meta',
        'cmd',
        'command',
        'shift',
      ].includes(lower)
    ) {
      // Normalize modifier names
      // 当 `lower` 匹配 `'control') modifiers.push('...` 时，reserved Shortcuts执行对应分支。
      if (lower === 'control') modifiers.push('ctrl')
      else if (lower === 'option' || lower === 'opt') modifiers.push('alt')
      else if (lower === 'command' || lower === 'cmd') modifiers.push('cmd')
      else modifiers.push(lower)
    } else {
      // mainKey更新为 `lower`，确保reservedShortcuts后续读取最新状态。
      mainKey = lower
    }
  }

  // 调用 modifiers.sort，触发reserved Shortcuts此处需要的副作用。
  modifiers.sort()
  // 返回列表结果，保留reserved Shortcuts已经排好的条目顺序。
  return [...modifiers, mainKey].join('+')
}
