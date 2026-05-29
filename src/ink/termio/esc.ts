/**
 * ESC Sequence Parser
 *
 * Handles simple escape sequences: ESC + one or two characters
 */

// 类型依赖 { Action } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { Action } from './types.js'

/**
 * Parse a simple ESC sequence
 *
 * @param chars - Characters after ESC (not including ESC itself)
 */
// parseEsc 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseEsc(chars: string): Action | null {
  // chars 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (chars.length === 0) return null

  // first读取 `chars[0]!` 对应条目，后续围绕该成员继续处理。
  const first = chars[0]!

  // Full reset (RIS)
  // 当 `first` 匹配 `'c'` 时，终端渲染执行对应分支。
  if (first === 'c') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'reset' }
  }

  // Cursor save (DECSC)
  // 当 `first` 匹配 `'7'` 时，终端渲染执行对应分支。
  if (first === '7') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'save' } }
  }

  // Cursor restore (DECRC)
  // 当 `first` 匹配 `'8'` 时，终端渲染执行对应分支。
  if (first === '8') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'restore' } }
  }

  // Index - move cursor down (IND)
  // 当 `first` 匹配 `'D'` 时，终端渲染执行对应分支。
  if (first === 'D') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'down', count: 1 },
    }
  }

  // Reverse index - move cursor up (RI)
  // 当 `first` 匹配 `'M'` 时，终端渲染执行对应分支。
  if (first === 'M') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'cursor',
      action: { type: 'move', direction: 'up', count: 1 },
    }
  }

  // Next line (NEL)
  // 当 `first` 匹配 `'E'` 时，终端渲染执行对应分支。
  if (first === 'E') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'cursor', action: { type: 'nextLine', count: 1 } }
  }

  // Horizontal tab set (HTS)
  // 当 `first` 匹配 `'H'` 时，终端渲染执行对应分支。
  if (first === 'H') {
    // 返回 `null // Tab stop, not commonly needed`，作为终端渲染这次计算的结果。
    return null // Tab stop, not commonly needed
  }

  // Charset selection (ESC ( X, ESC ) X, etc.) - silently ignore
  // 只有 `'()'.includes(first) && chars.length >= 2` 满足时，终端渲染才执行该分支。
  if ('()'.includes(first) && chars.length >= 2) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null
  }

  // Unknown
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { type: 'unknown', sequence: `\x1b${chars}` }
}
