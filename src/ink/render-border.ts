// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 引入 cliBoxes、Boxes、BoxStyle，将 cli-boxes 中已经封装好的能力接到本文件流程里。
import cliBoxes, { type Boxes, type BoxStyle } from 'cli-boxes'
// 引入 applyColor，将 ./colorize.js 中已经封装好的能力接到本文件流程里。
import { applyColor } from './colorize.js'
// 类型依赖 { DOMNode } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMNode } from './dom.js'
// 类型依赖 Output 来自 ./output.js，用于校准终端渲染的数据契约。
import type Output from './output.js'
// 引入 stringWidth，将 ./stringWidth.js 中已经封装好的能力接到本文件流程里。
import { stringWidth } from './stringWidth.js'
// 类型依赖 { Color } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Color } from './styles.js'

// BorderTextOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type BorderTextOptions = {
  content: string // Pre-rendered string with ANSI color codes
  position: 'top' | 'bottom'
  align: 'start' | 'end' | 'center'
  offset?: number // Only used with 'start' or 'end' alignment. Number of characters from the edge.
}

// CUSTOM_BORDER_STYLES 集合 集中保存Ink 渲染层 render border要一起传递的字段。
export const CUSTOM_BORDER_STYLES = {
  dashed: {
    top: '╌',
    left: '╎',
    right: '╎',
    bottom: '╌',
    // there aren't any line-drawing characters for dashes unfortunately
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
  },
} as const

// BorderStyle 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type BorderStyle =
  | keyof Boxes
  | keyof typeof CUSTOM_BORDER_STYLES
  | BoxStyle

// embedTextInBorder 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function embedTextInBorder(
  borderLine: string,
  text: string,
  align: 'start' | 'end' | 'center',
  offset: number = 0,
  borderChar: string,
): [before: string, text: string, after: string] {
  // textLength 数量保存`stringWidth`，供终端渲染后续处理使用。
  const textLength = stringWidth(text)
  // borderLength 数量 命名 `borderLine.length`，让后续代码直接表达这个值的用途。
  const borderLength = borderLine.length

  // 满足 `textLength >= borderLength - 2` 时，终端渲染执行该分支。
  if (textLength >= borderLength - 2) {
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return ['', text.substring(0, borderLength), '']
  }

  // position 先占位，稍后的条件分支会根据实际输入补齐它。
  let position: number
  // 当 `align` 匹配 `'center'` 时，终端渲染执行对应分支。
  if (align === 'center') {
    // position更新为 `Math.floor((borderLength - textLength) / 2)`，确保Ink 渲染层后续读取最新状态。
    position = Math.floor((borderLength - textLength) / 2)
  // Ink 渲染层 render border在这里处理 `} else if (align === 'start') {`，完成这一小步状态转换。
  } else if (align === 'start') {
    // position更新为 `offset + 1 // +1 to account for corner character`，确保Ink 渲染层后续读取最新状态。
    position = offset + 1 // +1 to account for corner character
  } else {
    // align === 'end'
    // position更新为 `borderLength - textLength - offset - 1 // -1 for corner c...`，确保Ink 渲染层后续读取最新状态。
    position = borderLength - textLength - offset - 1 // -1 for corner character
  }

  // Ensure position is valid
  // position更新为 `Math.max(1, Math.min(position, borderLength - textLength ...`，确保Ink 渲染层后续读取最新状态。
  position = Math.max(1, Math.min(position, borderLength - textLength - 1))

  // before格式化`borderLine.substring`，供终端渲染后续处理使用。
  const before = borderLine.substring(0, 1) + borderChar.repeat(position - 1)
  // after 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const after =
    borderChar.repeat(borderLength - position - textLength - 1) +
    borderLine.substring(borderLength - 1)

  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [before, text, after]
}

// styleBorderLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function styleBorderLine(
  line: string,
  color: Color | undefined,
  dim: boolean | undefined,
): string {
  // styled保存`applyColor`，供终端渲染后续处理使用。
  let styled = applyColor(line, color)
  // 满足 `dim` 时，终端渲染执行该分支。
  if (dim) {
    // styled更新为 `chalk.dim(styled)`，确保Ink 渲染层后续读取最新状态。
    styled = chalk.dim(styled)
  }
  // 返回 `styled`，作为终端渲染这次计算的结果。
  return styled
}

// renderBorder 命名 `(`，让后续代码直接表达这个值的用途。
const renderBorder = (
  x: number,
  y: number,
  node: DOMNode,
  output: Output,
): void => {
  // 满足 `node.style.borderStyle` 时，终端渲染执行该分支。
  if (node.style.borderStyle) {
    // width保存`Math.floor`，供终端渲染后续处理使用。
    const width = Math.floor(node.yogaNode!.getComputedWidth())
    // height保存`Math.floor`，供终端渲染后续处理使用。
    const height = Math.floor(node.yogaNode!.getComputedHeight())
    // box 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const box =
      typeof node.style.borderStyle === 'string'
        ? (CUSTOM_BORDER_STYLES[
            node.style.borderStyle as keyof typeof CUSTOM_BORDER_STYLES
          ] ?? cliBoxes[node.style.borderStyle as keyof Boxes])
        : node.style.borderStyle

    // topBorderColor保存`node.style.borderTopColor ?? node.style.borderColor`，供后续判断或组装使用。
    const topBorderColor = node.style.borderTopColor ?? node.style.borderColor
    // bottomBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const bottomBorderColor =
      node.style.borderBottomColor ?? node.style.borderColor
    // leftBorderColor保存`node.style.borderLeftColor ?? node.style.borderColor`，供Ink 渲染层 render border后续判断或输出使用。
    const leftBorderColor = node.style.borderLeftColor ?? node.style.borderColor
    // rightBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const rightBorderColor =
      node.style.borderRightColor ?? node.style.borderColor

    // dimTopBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dimTopBorderColor =
      node.style.borderTopDimColor ?? node.style.borderDimColor

    // dimBottomBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dimBottomBorderColor =
      node.style.borderBottomDimColor ?? node.style.borderDimColor

    // dimLeftBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dimLeftBorderColor =
      node.style.borderLeftDimColor ?? node.style.borderDimColor

    // dimRightBorderColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dimRightBorderColor =
      node.style.borderRightDimColor ?? node.style.borderDimColor

    // showTopBorder标记Ink 渲染层 render border是否启用对应路径。
    const showTopBorder = node.style.borderTop !== false
    // showBottomBorder标记Ink 渲染层 render border是否启用对应路径。
    const showBottomBorder = node.style.borderBottom !== false
    // showLeftBorder标记Ink 渲染层 render border是否启用对应路径。
    const showLeftBorder = node.style.borderLeft !== false
    // showRightBorder标记Ink 渲染层 render border是否启用对应路径。
    const showRightBorder = node.style.borderRight !== false

    // contentWidth保存`Math.max`，供终端渲染后续处理使用。
    const contentWidth = Math.max(
      0,
      width - (showLeftBorder ? 1 : 0) - (showRightBorder ? 1 : 0),
    )

    // topBorderLine保存`showTopBorder`，供Ink 渲染层 render border后续判断或输出使用。
    const topBorderLine = showTopBorder
      ? (showLeftBorder ? box.topLeft : '') +
        box.top.repeat(contentWidth) +
        (showRightBorder ? box.topRight : '')
      : ''

    // Handle text in top border
    // topBorder 先占位，稍后的条件分支会根据实际输入补齐它。
    let topBorder: string | undefined
    // 只有 `showTopBorder && node.style.borderText?.position` 满足时，终端渲染才执行该分支。
    if (showTopBorder && node.style.borderText?.position === 'top') {
      // 从 `embedTextInBorder(` 按位置拆出 before、text、after，让Ink 渲染层 render border分别处理这些返回值。
      const [before, text, after] = embedTextInBorder(
        topBorderLine,
        node.style.borderText.content,
        node.style.borderText.align,
        node.style.borderText.offset,
        box.top,
      )
      // Ink 渲染层 render border在这里处理 `topBorder =`，完成这一小步状态转换。
      topBorder =
        styleBorderLine(before, topBorderColor, dimTopBorderColor) +
        text +
        styleBorderLine(after, topBorderColor, dimTopBorderColor)
    // Ink 渲染层 render border在这里处理 `} else if (showTopBorder) {`，完成这一小步状态转换。
    } else if (showTopBorder) {
      // topBorder更新为 `styleBorderLine(`，确保Ink 渲染层后续读取最新状态。
      topBorder = styleBorderLine(
        topBorderLine,
        topBorderColor,
        dimTopBorderColor,
      )
    }

    // verticalBorderHeight 命名 `height`，让后续代码直接表达这个值的用途。
    let verticalBorderHeight = height

    // 满足 `showTopBorder` 时，终端渲染执行该分支。
    if (showTopBorder) {
      // Ink 渲染层 render border在这里处理 `verticalBorderHeight -= 1`，完成这一小步状态转换。
      verticalBorderHeight -= 1
    }

    // 满足 `showBottomBorder` 时，终端渲染执行该分支。
    if (showBottomBorder) {
      // Ink 渲染层 render border在这里处理 `verticalBorderHeight -= 1`，完成这一小步状态转换。
      verticalBorderHeight -= 1
    }

    // verticalBorderHeight更新为 `Math.max(0, verticalBorderHeight)`，确保Ink 渲染层后续读取最新状态。
    verticalBorderHeight = Math.max(0, verticalBorderHeight)

    // leftBorder保存`applyColor`，供终端渲染后续处理使用。
    let leftBorder = (applyColor(box.left, leftBorderColor) + '\n').repeat(
      verticalBorderHeight,
    )

    // 满足 `dimLeftBorderColor` 时，终端渲染执行该分支。
    if (dimLeftBorderColor) {
      // leftBorder更新为 `chalk.dim(leftBorder)`，确保Ink 渲染层后续读取最新状态。
      leftBorder = chalk.dim(leftBorder)
    }

    // rightBorder保存`applyColor`，供终端渲染后续处理使用。
    let rightBorder = (applyColor(box.right, rightBorderColor) + '\n').repeat(
      verticalBorderHeight,
    )

    // 满足 `dimRightBorderColor` 时，终端渲染执行该分支。
    if (dimRightBorderColor) {
      // rightBorder更新为 `chalk.dim(rightBorder)`，确保Ink 渲染层后续读取最新状态。
      rightBorder = chalk.dim(rightBorder)
    }

    // bottomBorderLine保存`showBottomBorder`，供Ink 渲染层 render border后续判断或输出使用。
    const bottomBorderLine = showBottomBorder
      ? (showLeftBorder ? box.bottomLeft : '') +
        box.bottom.repeat(contentWidth) +
        (showRightBorder ? box.bottomRight : '')
      : ''

    // Handle text in bottom border
    // bottomBorder 先占位，稍后的条件分支会根据实际输入补齐它。
    let bottomBorder: string | undefined
    // 只有 `showBottomBorder && node.style.borderText?.positi` 满足时，终端渲染才执行该分支。
    if (showBottomBorder && node.style.borderText?.position === 'bottom') {
      // 从 `embedTextInBorder(` 按位置拆出 before、text、after，让Ink 渲染层 render border分别处理这些返回值。
      const [before, text, after] = embedTextInBorder(
        bottomBorderLine,
        node.style.borderText.content,
        node.style.borderText.align,
        node.style.borderText.offset,
        box.bottom,
      )
      // Ink 渲染层 render border在这里处理 `bottomBorder =`，完成这一小步状态转换。
      bottomBorder =
        styleBorderLine(before, bottomBorderColor, dimBottomBorderColor) +
        text +
        styleBorderLine(after, bottomBorderColor, dimBottomBorderColor)
    // Ink 渲染层 render border在这里处理 `} else if (showBottomBorder) {`，完成这一小步状态转换。
    } else if (showBottomBorder) {
      // bottomBorder更新为 `styleBorderLine(`，确保Ink 渲染层后续读取最新状态。
      bottomBorder = styleBorderLine(
        bottomBorderLine,
        bottomBorderColor,
        dimBottomBorderColor,
      )
    }

    // offsetY保存`showTopBorder ? 1 : 0`，供后续判断或组装使用。
    const offsetY = showTopBorder ? 1 : 0

    // 满足 `topBorder` 时，终端渲染执行该分支。
    if (topBorder) {
      // 调用 output.write，触发终端渲染此处需要的副作用。
      output.write(x, y, topBorder)
    }

    // 满足 `showLeftBorder` 时，终端渲染执行该分支。
    if (showLeftBorder) {
      // 调用 output.write，触发终端渲染此处需要的副作用。
      output.write(x, y + offsetY, leftBorder)
    }

    // 满足 `showRightBorder` 时，终端渲染执行该分支。
    if (showRightBorder) {
      // 调用 output.write，触发终端渲染此处需要的副作用。
      output.write(x + width - 1, y + offsetY, rightBorder)
    }

    // 满足 `bottomBorder` 时，终端渲染执行该分支。
    if (bottomBorder) {
      // 调用 output.write，触发终端渲染此处需要的副作用。
      output.write(x, y + height - 1, bottomBorder)
    }
  }
}

export default renderBorder
