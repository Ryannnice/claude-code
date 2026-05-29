// 类型依赖 { Diff } 来自 ./frame.js，用于校准终端渲染的数据契约。
import type { Diff } from './frame.js'

/**
 * Optimize a diff by applying all optimization rules in a single pass.
 * This reduces the number of patches that need to be written to the terminal.
 *
 * Rules applied:
 * - Remove empty stdout patches
 * - Merge consecutive cursorMove patches
 * - Remove no-op cursorMove (0,0) patches
 * - Concat adjacent style patches (transition diffs — can't drop either)
 * - Dedupe consecutive hyperlinks with same URI
 * - Cancel cursor hide/show pairs
 * - Remove clear patches with count 0
 */
// optimize 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function optimize(diff: Diff): Diff {
  // 满足 `diff.length <= 1` 时，终端渲染执行该分支。
  if (diff.length <= 1) {
    // 返回 `diff`，作为终端渲染这次计算的结果。
    return diff
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: Diff = []
  // len 命名 `0`，让后续代码直接表达这个值的用途。
  let len = 0

  // 按顺序遍历 `diff` 中的patch，逐个交给终端渲染处理。
  for (const patch of diff) {
    // type 命名 `patch.type`，让后续代码直接表达这个值的用途。
    const type = patch.type

    // Skip no-ops
    // 当 `type` 匹配 `'stdout'` 时，终端渲染执行对应分支。
    if (type === 'stdout') {
      // 满足 `patch.content === ''` 时，终端渲染执行该分支。
      if (patch.content === '') continue
    // Ink 渲染层 optimizer在这里处理 `} else if (type === 'cursorMove') {`，完成这一小步状态转换。
    } else if (type === 'cursorMove') {
      // 只有 `patch.x === 0 && patch.y === 0` 满足时，终端渲染才执行该分支。
      if (patch.x === 0 && patch.y === 0) continue
    // Ink 渲染层 optimizer在这里处理 `} else if (type === 'clear') {`，完成这一小步状态转换。
    } else if (type === 'clear') {
      // 满足 `patch.count === 0` 时，终端渲染执行该分支。
      if (patch.count === 0) continue
    }

    // Try to merge with previous patch
    // 满足 `len > 0` 时，终端渲染执行该分支。
    if (len > 0) {
      // lastIdx保存`len - 1`，供Ink 渲染层 optimizer后续判断或输出使用。
      const lastIdx = len - 1
      // last读取 `result[lastIdx]!` 对应条目，后续围绕该成员继续处理。
      const last = result[lastIdx]!
      // lastType保存`last.type`，供Ink 渲染层 optimizer后续判断或输出使用。
      const lastType = last.type

      // Merge consecutive cursorMove
      // 当 `type` 匹配 `'cursorMove' && lastType ==...` 时，终端渲染执行对应分支。
      if (type === 'cursorMove' && lastType === 'cursorMove') {
        // result[lastIdx更新为 `{`，确保Ink 渲染层 optimizer后续读取最新状态。
        result[lastIdx] = {
          type: 'cursorMove',
          x: last.x + patch.x,
          y: last.y + patch.y,
        }
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }

      // Collapse consecutive cursorTo (only the last one matters)
      // 当 `type` 匹配 `'cursorTo' && lastType === ...` 时，终端渲染执行对应分支。
      if (type === 'cursorTo' && lastType === 'cursorTo') {
        // result[lastIdx更新为 `patch`，确保Ink 渲染层 optimizer后续读取最新状态。
        result[lastIdx] = patch
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }

      // Concat adjacent style patches. styleStr is a transition diff
      // (computed by diffAnsiCodes(from, to)), not a setter — dropping
      // the first is only sound if its undo-codes are a subset of the
      // second's, which is NOT guaranteed. e.g. [\e[49m, \e[2m]: dropping
      // the bg reset leaks it into the next \e[2J/\e[2K via BCE.
      // 当 `type` 匹配 `'styleStr' && lastType === ...` 时，终端渲染执行对应分支。
      if (type === 'styleStr' && lastType === 'styleStr') {
        // result[lastIdx更新为 `{ type: 'styleStr', str: last.str + patch.str }`，确保Ink 渲染层 optimizer后续读取最新状态。
        result[lastIdx] = { type: 'styleStr', str: last.str + patch.str }
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }

      // Dedupe hyperlinks
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        type === 'hyperlink' &&
        lastType === 'hyperlink' &&
        patch.uri === last.uri
      ) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }

      // Cancel cursor hide/show pairs
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        (type === 'cursorShow' && lastType === 'cursorHide') ||
        (type === 'cursorHide' && lastType === 'cursorShow')
      ) {
        // 调用 result.pop，触发终端渲染此处需要的副作用。
        result.pop()
        // Ink 渲染层 optimizer在这里处理 `len--`，完成这一小步状态转换。
        len--
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
    }

    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(patch)
    // Ink 渲染层 optimizer在这里处理 `len++`，完成这一小步状态转换。
    len++
  }

  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}
