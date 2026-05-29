// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 复用 color 终端界面组件，避免在这里重复拼装显示逻辑。
import { color } from '../components/design-system/color.js'
// 类型依赖 { Theme, ThemeName } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { Theme, ThemeName } from './theme.js'

// TreeNode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TreeNode = {
  [key: string]: TreeNode | string | undefined
}

// TreeifyOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TreeifyOptions = {
  showValues?: boolean
  hideFunctions?: boolean
  useColors?: boolean
  themeName?: ThemeName
  treeCharColors?: {
    treeChar?: keyof Theme // Color for tree characters (├ └ │)
    key?: keyof Theme // Color for property names
    value?: keyof Theme // Color for values
  }
}

// TreeCharacters 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TreeCharacters = {
  branch: string
  lastBranch: string
  line: string
  empty: string
}

// DEFAULT_TREE_CHARS 集合 集中保存共享工具 treeify要一起传递的字段。
const DEFAULT_TREE_CHARS: TreeCharacters = {
  branch: figures.lineUpDownRight, // '├'
  lastBranch: figures.lineUpRight, // '└'
  line: figures.lineVertical, // '│'
  empty: ' ',
}

/**
 * Custom treeify implementation with Ink theme color support
 * Based on https://github.com/notatestuser/treeify
 */
// treeify 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function treeify(obj: TreeNode, options: TreeifyOptions = {}): string {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    showValues = true,
    hideFunctions = false,
    themeName = 'dark',
    treeCharColors = {},
  } = options

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // visited 命名 `new WeakSet<object>()`，让后续代码直接表达这个值的用途。
  const visited = new WeakSet<object>()

  // colorize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function colorize(text: string, colorKey?: keyof Theme): string {
    // colorKey缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!colorKey) return text
    // 返回 `color(colorKey, themeName)(text)`，作为共享工具这次计算的结果。
    return color(colorKey, themeName)(text)
  }

  // growBranch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function growBranch(
    node: TreeNode | string,
    prefix: string,
    _isLast: boolean,
    depth: number = 0,
  ): void {
    // 当 `typeof node` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof node === 'string') {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(prefix + colorize(node, treeCharColors.value))
      // 共享工具 treeify在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `typeof node` 与 `'object' || node === null` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof node !== 'object' || node === null) {
      // 满足 `showValues` 时，共享工具执行该分支。
      if (showValues) {
        // valueStr保存`String`，供共享工具后续处理使用。
        const valueStr = String(node)
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(prefix + colorize(valueStr, treeCharColors.value))
      }
      // 共享工具 treeify在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check for circular references
    // 满足 `visited.has(node)` 时，共享工具执行该分支。
    if (visited.has(node)) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(prefix + colorize('[Circular]', treeCharColors.value))
      // 共享工具 treeify在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 visited.add，触发共享工具此处需要的副作用。
    visited.add(node)

    // keys 集合派生`Object.keys`，供共享工具后续处理使用。
    const keys = Object.keys(node).filter(key => {
      // 取值保存`node[key]`，供共享工具 treeify后续判断或输出使用。
      const value = node[key]
      // 当 `hideFunctions && typeof value` 匹配 `'function'` 时，共享工具执行对应分支。
      if (hideFunctions && typeof value === 'function') return false
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })

    // 调用 keys.forEach，触发共享工具此处需要的副作用。
    keys.forEach((key, index) => {
      // 取值保存`node[key]`，供共享工具 treeify后续判断或输出使用。
      const value = node[key]
      // isLastKey标记共享工具 treeify是否启用对应路径。
      const isLastKey = index === keys.length - 1
      // nodePrefix标记共享工具 treeify是否启用对应路径。
      const nodePrefix = depth === 0 && index === 0 ? '' : prefix

      // Determine which tree character to use
      // treeChar 命名 `isLastKey`，让后续代码直接表达这个值的用途。
      const treeChar = isLastKey
        ? DEFAULT_TREE_CHARS.lastBranch
        : DEFAULT_TREE_CHARS.branch
      // coloredTreeChar保存`colorize`，供共享工具后续处理使用。
      const coloredTreeChar = colorize(treeChar, treeCharColors.treeChar)
      // coloredKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const coloredKey =
        key.trim() === '' ? '' : colorize(key, treeCharColors.key)

      // line 先占位，稍后的条件分支会根据实际输入补齐它。
      let line =
        nodePrefix + coloredTreeChar + (coloredKey ? ' ' + coloredKey : '')

      // Check if we should add a colon (not for empty/whitespace keys)
      // shouldAddColon记录 `key.trim` 是否成立，共享工具随后按该结果分支。
      const shouldAddColon = key.trim() !== ''

      // Check for circular reference before recursing
      // 只有 `value && typeof value === 'object' && visited.has(value)` 满足时，共享工具才执行该分支。
      if (value && typeof value === 'object' && visited.has(value)) {
        // coloredValue保存`colorize`，供共享工具后续处理使用。
        const coloredValue = colorize('[Circular]', treeCharColors.value)
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(
          line + (shouldAddColon ? ': ' : line ? ' ' : '') + coloredValue,
        )
      // 共享工具 treeify在这里处理 `} else if (value && typeof value === 'object' && !Array.isArray(value))...`，完成这一小步状态转换。
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(line)
        // Calculate the continuation prefix for nested items
        // continuationChar保存`isLastKey`，供共享工具 treeify后续判断或输出使用。
        const continuationChar = isLastKey
          ? DEFAULT_TREE_CHARS.empty
          : DEFAULT_TREE_CHARS.line
        // coloredContinuation保存`colorize`，供共享工具后续处理使用。
        const coloredContinuation = colorize(
          continuationChar,
          treeCharColors.treeChar,
        )
        // nextPrefix保存`nodePrefix + coloredContinuation + ' '`，供共享工具 treeify后续判断或输出使用。
        const nextPrefix = nodePrefix + coloredContinuation + ' '
        // 调用 growBranch，触发共享工具此处需要的副作用。
        growBranch(value, nextPrefix, isLastKey, depth + 1)
      // 共享工具 treeify在这里处理 `} else if (Array.isArray(value)) {`，完成这一小步状态转换。
      } else if (Array.isArray(value)) {
        // Handle arrays
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(
          line +
            (shouldAddColon ? ': ' : line ? ' ' : '') +
            '[Array(' +
            value.length +
            ')]',
        )
      // 共享工具 treeify在这里处理 `} else if (showValues) {`，完成这一小步状态转换。
      } else if (showValues) {
        // Add value if showValues is true
        // valueStr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const valueStr =
          typeof value === 'function' ? '[Function]' : String(value)
        // coloredValue保存`colorize`，供共享工具后续处理使用。
        const coloredValue = colorize(valueStr, treeCharColors.value)
        // 共享工具 treeify在这里处理 `line += (shouldAddColon ? ': ' : line ? ' ' : '') + coloredValue`，完成这一小步状态转换。
        line += (shouldAddColon ? ': ' : line ? ' ' : '') + coloredValue
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(line)
      } else {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(line)
      }
    })
  }

  // Start growing the tree
  // keys 集合派生`Object.keys`，供共享工具后续处理使用。
  const keys = Object.keys(obj)
  // keys 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (keys.length === 0) {
    // 返回 `colorize('(empty)', treeCharColors.value)`，作为共享工具这次计算的结果。
    return colorize('(empty)', treeCharColors.value)
  }

  // Special case for single empty/whitespace string key
  // 共享工具在这里按实际状态进入对应分支。
  if (
    keys.length === 1 &&
    keys[0] !== undefined &&
    keys[0].trim() === '' &&
    typeof obj[keys[0]] === 'string'
  ) {
    // firstKey读取 `keys[0]` 对应条目，后续围绕该成员继续处理。
    const firstKey = keys[0]
    // coloredTreeChar保存`colorize`，供共享工具后续处理使用。
    const coloredTreeChar = colorize(
      DEFAULT_TREE_CHARS.lastBranch,
      treeCharColors.treeChar,
    )
    // coloredValue保存`colorize`，供共享工具后续处理使用。
    const coloredValue = colorize(obj[firstKey] as string, treeCharColors.value)
    // 返回 `coloredTreeChar + ' ' + coloredValue`，作为共享工具这次计算的结果。
    return coloredTreeChar + ' ' + coloredValue
  }

  // 调用 growBranch，触发共享工具此处需要的副作用。
  growBranch(obj, '', true)
  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}
