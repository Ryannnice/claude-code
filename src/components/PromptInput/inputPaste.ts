// 引入 getPastedTextRefNumLines，将 src/history.js 中已经封装好的能力接到本文件流程里。
import { getPastedTextRefNumLines } from 'src/history.js'
// 类型依赖 { PastedContent } 来自 src/utils/config.js，用于校准终端渲染的数据契约。
import type { PastedContent } from 'src/utils/config.js'

// TRUNCATION_THRESHOLD保存`10000 // Characters before we truncate`，供后续判断或组装使用。
const TRUNCATION_THRESHOLD = 10000 // Characters before we truncate
// PREVIEW_LENGTH 数量保存`1000 // Characters to show at start and end`，供后续判断或组装使用。
const PREVIEW_LENGTH = 1000 // Characters to show at start and end

// TruncatedMessage 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TruncatedMessage = {
  truncatedText: string
  placeholderContent: string
}

/**
 * Determines whether the input text should be truncated. If so, it adds a
 * truncated text placeholder and neturns
 *
 * @param text The input text
 * @param nextPasteId The reference id to use
 * @returns The new text to display and separate placeholder content if applicable.
 */
// maybeTruncateMessageForInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybeTruncateMessageForInput(
  text: string,
  nextPasteId: number,
): TruncatedMessage {
  // If the text is short enough, return it as-is
  // 满足 `text.length <= TRUNCATION_THRESHOLD` 时，终端渲染执行该分支。
  if (text.length <= TRUNCATION_THRESHOLD) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      truncatedText: text,
      placeholderContent: '',
    }
  }

  // Calculate how much text to keep from start and end
  // startLength 数量保存`Math.floor`，供终端渲染后续处理使用。
  const startLength = Math.floor(PREVIEW_LENGTH / 2)
  // endLength 数量保存`Math.floor`，供终端渲染后续处理使用。
  const endLength = Math.floor(PREVIEW_LENGTH / 2)

  // Extract the portions we'll keep
  // startText格式化`text.slice`，供终端渲染后续处理使用。
  const startText = text.slice(0, startLength)
  // endText格式化`text.slice`，供终端渲染后续处理使用。
  const endText = text.slice(-endLength)

  // Calculate the number of lines that will be truncated
  // placeholderContent格式化`text.slice`，供终端渲染后续处理使用。
  const placeholderContent = text.slice(startLength, -endLength)
  // truncatedLines 集合读取`getPastedTextRefNumLines`，供终端渲染后续处理使用。
  const truncatedLines = getPastedTextRefNumLines(placeholderContent)

  // Create a placeholder reference similar to pasted text
  // placeholderId 命名 `nextPasteId`，让后续代码直接表达这个值的用途。
  const placeholderId = nextPasteId
  // placeholderRef 引用格式化`formatTruncatedTextRef`，供终端渲染后续处理使用。
  const placeholderRef = formatTruncatedTextRef(placeholderId, truncatedLines)

  // Combine the parts with the placeholder
  // truncatedText 命名 `startText + placeholderRef + endText`，让后续代码直接表达这个值的用途。
  const truncatedText = startText + placeholderRef + endText

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    truncatedText,
    placeholderContent,
  }
}

// formatTruncatedTextRef 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTruncatedTextRef(id: number, numLines: number): string {
  // 返回 ``[...Truncated text #${id} +${numLines} lines...]``，作为终端渲染这次计算的结果。
  return `[...Truncated text #${id} +${numLines} lines...]`
}

// maybeTruncateInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybeTruncateInput(
  input: string,
  pastedContents: Record<number, PastedContent>,
): { newInput: string; newPastedContents: Record<number, PastedContent> } {
  // Get the next available ID for the truncated content
  // existingIds 集合派生`Object.keys`，供终端渲染后续处理使用。
  const existingIds = Object.keys(pastedContents).map(Number)
  // nextPasteId保存`Math.max`，供终端渲染后续处理使用。
  const nextPasteId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

  // Apply truncation
  // 从 `maybeTruncateMessageForInput(` 解构 truncatedText、placeholderContent，减少提示输入组件 input Paste对同一对象的重复访问。
  const { truncatedText, placeholderContent } = maybeTruncateMessageForInput(
    input,
    nextPasteId,
  )

  // placeholderContent缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!placeholderContent) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { newInput: input, newPastedContents: pastedContents }
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    newInput: truncatedText,
    newPastedContents: {
      ...pastedContents,
      [nextPasteId]: {
        id: nextPasteId,
        type: 'text',
        content: placeholderContent,
      },
    },
  }
}
