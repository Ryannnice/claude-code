// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'
// 类型依赖 { TextStyles } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { TextStyles } from './styles.js'

/**
 * A segment of text with its associated styles.
 * Used for structured rendering without ANSI string transforms.
 */
// StyledSegment 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type StyledSegment = {
  text: string
  styles: TextStyles
  hyperlink?: string
}

/**
 * Squash text nodes into styled segments, propagating styles down through the tree.
 * This allows structured styling without relying on ANSI string transforms.
 */
// squashTextNodesToSegments 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function squashTextNodesToSegments(
  node: DOMElement,
  inheritedStyles: TextStyles = {},
  inheritedHyperlink?: string,
  out: StyledSegment[] = [],
): StyledSegment[] {
  // mergedStyles 集合 命名 `node.textStyles`，让后续代码直接表达这个值的用途。
  const mergedStyles = node.textStyles
    ? { ...inheritedStyles, ...node.textStyles }
    : inheritedStyles

  // 按顺序遍历 `node.childNodes` 中的childNode，逐个交给终端渲染处理。
  for (const childNode of node.childNodes) {
    // 满足 `childNode === undefined` 时，终端渲染执行该分支。
    if (childNode === undefined) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // 当 `childNode.nodeName` 匹配 `'#text'` 时，终端渲染执行对应分支。
    if (childNode.nodeName === '#text') {
      // 满足 `childNode.nodeValue.length > 0` 时，终端渲染执行该分支。
      if (childNode.nodeValue.length > 0) {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push({
          text: childNode.nodeValue,
          styles: mergedStyles,
          hyperlink: inheritedHyperlink,
        })
      }
    // Ink 渲染层 squash text nodes在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      childNode.nodeName === 'ink-text' ||
      childNode.nodeName === 'ink-virtual-text'
    ) {
      // 调用 squashTextNodesToSegments，触发终端渲染此处需要的副作用。
      squashTextNodesToSegments(
        childNode,
        mergedStyles,
        inheritedHyperlink,
        out,
      )
    // Ink 渲染层 squash text nodes在这里处理 `} else if (childNode.nodeName === 'ink-link') {`，完成这一小步状态转换。
    } else if (childNode.nodeName === 'ink-link') {
      // href 引用保存`childNode.attributes['href'] as string | undefined`，供Ink 渲染层 squash text nodes后续判断或输出使用。
      const href = childNode.attributes['href'] as string | undefined
      // 调用 squashTextNodesToSegments，触发终端渲染此处需要的副作用。
      squashTextNodesToSegments(
        childNode,
        mergedStyles,
        href || inheritedHyperlink,
        out,
      )
    }
  }

  // 返回 `out`，作为终端渲染这次计算的结果。
  return out
}

/**
 * Squash text nodes into a plain string (without styles).
 * Used for text measurement in layout calculations.
 */
// squashTextNodes 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function squashTextNodes(node: DOMElement): string {
  // 文本 命名 `''`，让后续代码直接表达这个值的用途。
  let text = ''

  // 按顺序遍历 `node.childNodes` 中的childNode，逐个交给终端渲染处理。
  for (const childNode of node.childNodes) {
    // 满足 `childNode === undefined` 时，终端渲染执行该分支。
    if (childNode === undefined) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // 当 `childNode.nodeName` 匹配 `'#text'` 时，终端渲染执行对应分支。
    if (childNode.nodeName === '#text') {
      // Ink 渲染层 squash text nodes在这里处理 `text += childNode.nodeValue`，完成这一小步状态转换。
      text += childNode.nodeValue
    // Ink 渲染层 squash text nodes在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      childNode.nodeName === 'ink-text' ||
      childNode.nodeName === 'ink-virtual-text'
    ) {
      // Ink 渲染层 squash text nodes在这里处理 `text += squashTextNodes(childNode)`，完成这一小步状态转换。
      text += squashTextNodes(childNode)
    // Ink 渲染层 squash text nodes在这里处理 `} else if (childNode.nodeName === 'ink-link') {`，完成这一小步状态转换。
    } else if (childNode.nodeName === 'ink-link') {
      // Ink 渲染层 squash text nodes在这里处理 `text += squashTextNodes(childNode)`，完成这一小步状态转换。
      text += squashTextNodes(childNode)
    }
  }

  // 返回 `text`，作为终端渲染这次计算的结果。
  return text
}

export default squashTextNodes
