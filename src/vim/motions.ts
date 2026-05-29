/**
 * Vim Motion Functions
 *
 * Pure functions for resolving vim motions to cursor positions.
 */

// 类型依赖 { Cursor } 来自 ../utils/Cursor.js，用于校准motions的数据契约。
import type { Cursor } from '../utils/Cursor.js'

/**
 * Resolve a motion to a target cursor position.
 * Does not modify anything - pure calculation.
 */
// resolveMotion 封装motions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveMotion(
  key: string,
  cursor: Cursor,
  count: number,
): Cursor {
  // 结果保存`cursor`，供后续判断或组装使用。
  let result = cursor
  // 按索引扫描 `count`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < count; i++) {
    // next保存`applySingleMotion`，供motions后续处理使用。
    const next = applySingleMotion(key, result)
    // 满足 `next.equals(result)` 时，motions执行该分支。
    if (next.equals(result)) break
    // 结果更新为 `next`，确保motions后续读取最新状态。
    result = next
  }
  // 返回 `result`，作为motions这次计算的结果。
  return result
}

/**
 * Apply a single motion step.
 */
// applySingleMotion 封装motions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applySingleMotion(key: string, cursor: Cursor): Cursor {
  // 按照 key 的取值选择motions的具体处理分支。
  switch (key) {
    case 'h':
      // 返回 `cursor.left()`，作为motions这次计算的结果。
      return cursor.left()
    case 'l':
      // 返回 `cursor.right()`，作为motions这次计算的结果。
      return cursor.right()
    case 'j':
      // 返回 `cursor.downLogicalLine()`，作为motions这次计算的结果。
      return cursor.downLogicalLine()
    case 'k':
      // 返回 `cursor.upLogicalLine()`，作为motions这次计算的结果。
      return cursor.upLogicalLine()
    case 'gj':
      // 返回 `cursor.down()`，作为motions这次计算的结果。
      return cursor.down()
    case 'gk':
      // 返回 `cursor.up()`，作为motions这次计算的结果。
      return cursor.up()
    case 'w':
      // 返回 `cursor.nextVimWord()`，作为motions这次计算的结果。
      return cursor.nextVimWord()
    case 'b':
      // 返回 `cursor.prevVimWord()`，作为motions这次计算的结果。
      return cursor.prevVimWord()
    case 'e':
      // 返回 `cursor.endOfVimWord()`，作为motions这次计算的结果。
      return cursor.endOfVimWord()
    case 'W':
      // 返回 `cursor.nextWORD()`，作为motions这次计算的结果。
      return cursor.nextWORD()
    case 'B':
      // 返回 `cursor.prevWORD()`，作为motions这次计算的结果。
      return cursor.prevWORD()
    case 'E':
      // 返回 `cursor.endOfWORD()`，作为motions这次计算的结果。
      return cursor.endOfWORD()
    case '0':
      // 返回 `cursor.startOfLogicalLine()`，作为motions这次计算的结果。
      return cursor.startOfLogicalLine()
    case '^':
      // 返回 `cursor.firstNonBlankInLogicalLine()`，作为motions这次计算的结果。
      return cursor.firstNonBlankInLogicalLine()
    case '$':
      // 返回 `cursor.endOfLogicalLine()`，作为motions这次计算的结果。
      return cursor.endOfLogicalLine()
    case 'G':
      // 返回 `cursor.startOfLastLine()`，作为motions这次计算的结果。
      return cursor.startOfLastLine()
    default:
      // 返回 `cursor`，作为motions这次计算的结果。
      return cursor
  }
}

/**
 * Check if a motion is inclusive (includes character at destination).
 */
// isInclusiveMotion 封装motions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInclusiveMotion(key: string): boolean {
  // 返回 `'eE$'.includes(key)`，作为motions这次计算的结果。
  return 'eE$'.includes(key)
}

/**
 * Check if a motion is linewise (operates on full lines when used with operators).
 * Note: gj/gk are characterwise exclusive per `:help gj`, not linewise.
 */
// isLinewiseMotion 封装motions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLinewiseMotion(key: string): boolean {
  // 返回 `'jkG'.includes(key) || key === 'gg'`，作为motions这次计算的结果。
  return 'jkG'.includes(key) || key === 'gg'
}
