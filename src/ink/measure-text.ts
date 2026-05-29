// 引入 lineWidth，将 ./line-width-cache.js 中已经封装好的能力接到本文件流程里。
import { lineWidth } from './line-width-cache.js'

// Output 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Output = {
  width: number
  height: number
}

// Single-pass measurement: computes both width and height in one
// iteration instead of two (widestLine + countVisualLines).
// Uses indexOf to avoid array allocation from split('\n').
// measureText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function measureText(text: string, maxWidth: number): Output {
  // 文本为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (text.length === 0) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      width: 0,
      height: 0,
    }
  }

  // Infinite or non-positive width means no wrapping — each line is one visual line.
  // Must check before the loop since Math.ceil(w / Infinity) = 0.
  // noWrap保存`Number.isFinite`，供终端渲染后续处理使用。
  const noWrap = maxWidth <= 0 || !Number.isFinite(maxWidth)

  // height 命名 `0`，让后续代码直接表达这个值的用途。
  let height = 0
  // width保存`0`，供Ink 渲染层 measure text后续判断或输出使用。
  let width = 0
  // start保存`0`，供Ink 渲染层 measure text后续判断或输出使用。
  let start = 0

  // while 使用 start <= text.length 完成终端渲染里的对应操作。
  while (start <= text.length) {
    // end保存`text.indexOf`，供终端渲染后续处理使用。
    const end = text.indexOf('\n', start)
    // line格式化`text.substring`，供终端渲染后续处理使用。
    const line = end === -1 ? text.substring(start) : text.substring(start, end)

    // w保存`lineWidth`，供终端渲染后续处理使用。
    const w = lineWidth(line)
    // width更新为 `Math.max(width, w)`，确保Ink 渲染层后续读取最新状态。
    width = Math.max(width, w)

    // 满足 `noWrap` 时，终端渲染执行该分支。
    if (noWrap) {
      // Ink 渲染层 measure text在这里处理 `height++`，完成这一小步状态转换。
      height++
    } else {
      // Ink 渲染层 measure text在这里处理 `height += w === 0 ? 1 : Math.ceil(w / maxWidth)`，完成这一小步状态转换。
      height += w === 0 ? 1 : Math.ceil(w / maxWidth)
    }

    // 满足 `end === -1` 时，终端渲染执行该分支。
    if (end === -1) break
    // start更新为 `end + 1`，确保Ink 渲染层后续读取最新状态。
    start = end + 1
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { width, height }
}

export default measureText
