// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'

// PlaceholderRendererProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PlaceholderRendererProps = {
  placeholder?: string
  value: string
  showCursor?: boolean
  focus?: boolean
  terminalFocus: boolean
  // 这个回调绑定到 invert?: (text: string) => string，负责React hook 状态流在该局部场景下的响应。
  invert?: (text: string) => string
  hidePlaceholderText?: boolean
}

// renderPlaceholder 封装renderPlaceholder的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderPlaceholder({
  placeholder,
  value,
  showCursor,
  focus,
  terminalFocus = true,
  invert = chalk.inverse,
  hidePlaceholderText = false,
}: PlaceholderRendererProps): {
  renderedPlaceholder: string | undefined
  showPlaceholder: boolean
} {
  // renderedPlaceholder保存`undefined`，作为后续未定义值处理的输入。
  let renderedPlaceholder: string | undefined = undefined

  // 满足 `placeholder` 时，React hook执行该分支。
  if (placeholder) {
    // 满足 `hidePlaceholderText` 时，React hook执行该分支。
    if (hidePlaceholderText) {
      // Voice recording: show only the cursor, no placeholder text
      // React hook render Placeholder在这里处理 `renderedPlaceholder =`，完成这一小步状态转换。
      renderedPlaceholder =
        showCursor && focus && terminalFocus ? invert(' ') : ''
    } else {
      // renderedPlaceholder更新为 `chalk.dim(placeholder)`，确保renderPlaceholder后续读取最新状态。
      renderedPlaceholder = chalk.dim(placeholder)

      // Show inverse cursor only when both input and terminal are focused
      // 组合条件 `showCursor && focus && terminalFocus` 成立时，React hook 状态流才启用这条专门路径。
      if (showCursor && focus && terminalFocus) {
        // React hook render Placeholder在这里处理 `renderedPlaceholder =`，完成这一小步状态转换。
        renderedPlaceholder =
          placeholder.length > 0
            ? invert(placeholder[0]!) + chalk.dim(placeholder.slice(1))
            : invert(' ')
      }
    }
  }

  // showPlaceholder保存`Boolean`，供React hook后续处理使用。
  const showPlaceholder = value.length === 0 && Boolean(placeholder)

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    renderedPlaceholder,
    showPlaceholder,
  }
}
