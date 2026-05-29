// 引入 lineWidth，将 ./line-width-cache.js 中已经封装好的能力接到本文件流程里。
import { lineWidth } from './line-width-cache.js'

// widestLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function widestLine(string: string): number {
  // maxWidth 命名 `0`，让后续代码直接表达这个值的用途。
  let maxWidth = 0
  // start保存`0`，供Ink 渲染层 widest line后续判断或输出使用。
  let start = 0

  // while 使用 start <= string.length 完成终端渲染里的对应操作。
  while (start <= string.length) {
    // end保存`string.indexOf`，供终端渲染后续处理使用。
    const end = string.indexOf('\n', start)
    // line 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const line =
      end === -1 ? string.substring(start) : string.substring(start, end)

    // maxWidth更新为 `Math.max(maxWidth, lineWidth(line))`，确保Ink 渲染层后续读取最新状态。
    maxWidth = Math.max(maxWidth, lineWidth(line))

    // 满足 `end === -1` 时，终端渲染执行该分支。
    if (end === -1) break
    // start更新为 `end + 1`，确保Ink 渲染层后续读取最新状态。
    start = end + 1
  }

  // 返回 `maxWidth`，作为终端渲染这次计算的结果。
  return maxWidth
}
