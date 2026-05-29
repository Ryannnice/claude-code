// 复用 sliceAnsi 工具函数，把通用处理留在 ../utils/sliceAnsi.js 中维护。
import sliceAnsi from '../utils/sliceAnsi.js'
// 引入 stringWidth，将 ./stringWidth.js 中已经封装好的能力接到本文件流程里。
import { stringWidth } from './stringWidth.js'
// 类型依赖 { Styles } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Styles } from './styles.js'
// 引入 wrapAnsi，将 ./wrapAnsi.js 中已经封装好的能力接到本文件流程里。
import { wrapAnsi } from './wrapAnsi.js'

// ELLIPSIS 集合固定为 `'…'`，作为Ink 渲染层 wrap text后续展示或比较的基准。
const ELLIPSIS = '…'

// sliceAnsi may include a boundary-spanning wide char (e.g. CJK at position
// end-1 with width 2 overshoots by 1). Retry with a tighter bound once.
// sliceFit 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sliceFit(text: string, start: number, end: number): string {
  // s 集合格式化`sliceAnsi`，供终端渲染后续处理使用。
  const s = sliceAnsi(text, start, end)
  // 返回 `stringWidth(s) > end - start ? sliceAnsi(text, start, end - 1) : s`，作为终端渲染这次计算的结果。
  return stringWidth(s) > end - start ? sliceAnsi(text, start, end - 1) : s
}

// truncate 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncate(
  text: string,
  columns: number,
  position: 'start' | 'middle' | 'end',
): string {
  // 满足 `columns < 1` 时，终端渲染执行该分支。
  if (columns < 1) return ''
  // 满足 `columns === 1` 时，终端渲染执行该分支。
  if (columns === 1) return ELLIPSIS

  // length 数量保存`stringWidth`，供终端渲染后续处理使用。
  const length = stringWidth(text)
  // 满足 `length <= columns` 时，终端渲染执行该分支。
  if (length <= columns) return text

  // 当 `position` 匹配 `'start'` 时，终端渲染执行对应分支。
  if (position === 'start') {
    // 返回 `ELLIPSIS + sliceFit(text, length - columns + 1, length)`，作为终端渲染这次计算的结果。
    return ELLIPSIS + sliceFit(text, length - columns + 1, length)
  }
  // 当 `position` 匹配 `'middle'` 时，终端渲染执行对应分支。
  if (position === 'middle') {
    // half保存`Math.floor`，供终端渲染后续处理使用。
    const half = Math.floor(columns / 2)
    // 返回 `(`，作为终端渲染这次计算的结果。
    return (
      sliceFit(text, 0, half) +
      ELLIPSIS +
      sliceFit(text, length - (columns - half) + 1, length)
    )
  }
  // 返回 `sliceFit(text, 0, columns - 1) + ELLIPSIS`，作为终端渲染这次计算的结果。
  return sliceFit(text, 0, columns - 1) + ELLIPSIS
}

// Ink 渲染层 wrap text在这里处理 `export default function wrapText(`，完成这一小步状态转换。
export default function wrapText(
  text: string,
  maxWidth: number,
  wrapType: Styles['textWrap'],
): string {
  // 当 `wrapType` 匹配 `'wrap'` 时，终端渲染执行对应分支。
  if (wrapType === 'wrap') {
    // 返回 `wrapAnsi(text, maxWidth, {`，作为终端渲染这次计算的结果。
    return wrapAnsi(text, maxWidth, {
      trim: false,
      hard: true,
    })
  }

  // 当 `wrapType` 匹配 `'wrap-trim'` 时，终端渲染执行对应分支。
  if (wrapType === 'wrap-trim') {
    // 返回 `wrapAnsi(text, maxWidth, {`，作为终端渲染这次计算的结果。
    return wrapAnsi(text, maxWidth, {
      trim: true,
      hard: true,
    })
  }

  // 满足 `wrapType!.startsWith('truncate')` 时，终端渲染执行该分支。
  if (wrapType!.startsWith('truncate')) {
    // position保存`'end'`，作为后续固定文本处理的输入。
    let position: 'end' | 'middle' | 'start' = 'end'

    // 当 `wrapType` 匹配 `'truncate-middle'` 时，终端渲染执行对应分支。
    if (wrapType === 'truncate-middle') {
      // position更新为 `'middle'`，确保Ink 渲染层后续读取最新状态。
      position = 'middle'
    }

    // 当 `wrapType` 匹配 `'truncate-start'` 时，终端渲染执行对应分支。
    if (wrapType === 'truncate-start') {
      // position更新为 `'start'`，确保Ink 渲染层后续读取最新状态。
      position = 'start'
    }

    // 返回 `truncate(text, maxWidth, position)`，作为终端渲染这次计算的结果。
    return truncate(text, maxWidth, position)
  }

  // 返回 `text`，作为终端渲染这次计算的结果。
  return text
}
