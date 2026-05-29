// 类型依赖 { LayoutNode } 来自 ./node.js，用于校准终端渲染的数据契约。
import type { LayoutNode } from './node.js'
// 引入 createYogaLayoutNode，将 ./yoga.js 中已经封装好的能力接到本文件流程里。
import { createYogaLayoutNode } from './yoga.js'

// createLayoutNode 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createLayoutNode(): LayoutNode {
  // 返回 `createYogaLayoutNode()`，作为终端渲染这次计算的结果。
  return createYogaLayoutNode()
}
