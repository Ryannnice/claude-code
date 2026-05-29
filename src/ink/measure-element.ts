// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'

// Output 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Output = {
  /**
   * Element width.
   */
  width: number

  /**
   * Element height.
   */
  height: number
}

/**
 * Measure the dimensions of a particular `<Box>` element.
 */
// measureElement封装成回调，供Ink 渲染层 measure element在事件触发或异步步骤中调用。
const measureElement = (node: DOMElement): Output => ({
  width: node.yogaNode?.getComputedWidth() ?? 0,
  height: node.yogaNode?.getComputedHeight() ?? 0,
})

export default measureElement
