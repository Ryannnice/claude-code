// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ImageBlockParam,
  TextBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 接入 formatOutput 工具实现，后续工具池会按权限和开关决定是否暴露。
import { formatOutput } from '../tools/BashTool/utils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  NotebookCell,
  NotebookCellOutput,
  NotebookCellSource,
  NotebookCellSourceOutput,
  NotebookContent,
  NotebookOutputImage,
} from '../types/notebook.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 expandPath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from './path.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

// LARGE_OUTPUT_THRESHOLD保存`10000`，供共享工具 notebook后续判断或输出使用。
const LARGE_OUTPUT_THRESHOLD = 10000

// isLargeOutputs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLargeOutputs(
  outputs: (NotebookCellSourceOutput | undefined)[],
): boolean {
  // size保存`0`，供共享工具 notebook后续判断或输出使用。
  let size = 0
  // 按顺序遍历 `outputs` 中的o，逐个交给共享工具处理。
  for (const o of outputs) {
    // o缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!o) continue
    // 共享工具 notebook在这里处理 `size += (o.text?.length ?? 0) + (o.image?.image_data.length ?? 0)`，完成这一小步状态转换。
    size += (o.text?.length ?? 0) + (o.image?.image_data.length ?? 0)
    // 满足 `size > LARGE_OUTPUT_THRESHOLD` 时，共享工具执行该分支。
    if (size > LARGE_OUTPUT_THRESHOLD) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// processOutputText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processOutputText(text: string | string[] | undefined): string {
  // 文本缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!text) return ''
  // rawText保存`Array.isArray`，供共享工具后续处理使用。
  const rawText = Array.isArray(text) ? text.join('') : text
  // 从 `formatOutput(rawText)` 解构 truncatedContent，减少共享工具 notebook对同一对象的重复访问。
  const { truncatedContent } = formatOutput(rawText)
  // 返回 `truncatedContent`，作为共享工具这次计算的结果。
  return truncatedContent
}

// extractImage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractImage(
  data: Record<string, unknown>,
): NotebookOutputImage | undefined {
  // 当 `typeof data['image/png']` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof data['image/png'] === 'string') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      image_data: data['image/png'].replace(/\s/g, ''),
      media_type: 'image/png',
    }
  }
  // 当 `typeof data['image/jpeg']` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof data['image/jpeg'] === 'string') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      image_data: data['image/jpeg'].replace(/\s/g, ''),
      media_type: 'image/jpeg',
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// processOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processOutput(output: NotebookCellOutput) {
  // 按照 output.output_type 的取值选择共享工具的具体处理分支。
  switch (output.output_type) {
    case 'stream':
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        output_type: output.output_type,
        text: processOutputText(output.text),
      }
    case 'execute_result':
    case 'display_data':
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        output_type: output.output_type,
        text: processOutputText(output.data?.['text/plain']),
        image: output.data && extractImage(output.data),
      }
    case 'error':
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        output_type: output.output_type,
        text: processOutputText(
          `${output.ename}: ${output.evalue}\n${output.traceback.join('\n')}`,
        ),
      }
  }
}

// processCell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processCell(
  cell: NotebookCell,
  index: number,
  codeLanguage: string,
  includeLargeOutputs: boolean,
): NotebookCellSource {
  // cellId保存`cell.id ?? `cell-${index}``，供后续判断或组装使用。
  const cellId = cell.id ?? `cell-${index}`
  // cellData 集中保存共享工具 notebook要一起传递的字段。
  const cellData: NotebookCellSource = {
    cellType: cell.cell_type,
    source: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
    execution_count:
      cell.cell_type === 'code' ? cell.execution_count || undefined : undefined,
    cell_id: cellId,
  }
  // Avoid giving text cells the code language.
  // 当 `cell.cell_type` 匹配 `'code'` 时，共享工具执行对应分支。
  if (cell.cell_type === 'code') {
    // language更新为 `codeLanguage`，确保共享工具后续读取最新状态。
    cellData.language = codeLanguage
  }

  // 只有 `cell.cell_type === 'code' && cell.outputs?.length` 满足时，共享工具才执行该分支。
  if (cell.cell_type === 'code' && cell.outputs?.length) {
    // outputs 集合派生`outputs.map`，供共享工具后续处理使用。
    const outputs = cell.outputs.map(processOutput)
    // 只有 `!includeLargeOutputs && isLargeOutputs(outputs)` 满足时，共享工具才执行该分支。
    if (!includeLargeOutputs && isLargeOutputs(outputs)) {
      // outputs 集合更新为 `[`，确保共享工具后续读取最新状态。
      cellData.outputs = [
        {
          output_type: 'stream',
          text: `Outputs are too large to include. Use ${BASH_TOOL_NAME} with: cat <notebook_path> | jq '.cells[${index}].outputs'`,
        },
      ]
    } else {
      // outputs 集合更新为 `outputs`，确保共享工具后续读取最新状态。
      cellData.outputs = outputs
    }
  }

  // 返回 `cellData`，作为共享工具这次计算的结果。
  return cellData
}

// cellContentToToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cellContentToToolResult(cell: NotebookCellSource): TextBlockParam {
  // metadata 从空数组开始收集，后续循环会按处理顺序追加条目。
  const metadata = []
  // `cell.cellType` 与 `'code'` 不一致时刷新派生状态，避免使用过期结果。
  if (cell.cellType !== 'code') {
    // metadata追加新条目，保持收集顺序与输入顺序一致。
    metadata.push(`<cell_type>${cell.cellType}</cell_type>`)
  }
  // `cell.language` 与 `'python' && cell.cellType === '` 不一致时刷新派生状态，避免使用过期结果。
  if (cell.language !== 'python' && cell.cellType === 'code') {
    // metadata追加新条目，保持收集顺序与输入顺序一致。
    metadata.push(`<language>${cell.language}</language>`)
  }
  // cellContent格式化`metadata.join`，供共享工具后续处理使用。
  const cellContent = `<cell id="${cell.cell_id}">${metadata.join('')}${cell.source}</cell id="${cell.cell_id}">`
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    text: cellContent,
    type: 'text',
  }
}

// cellOutputToToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cellOutputToToolResult(output: NotebookCellSourceOutput) {
  // outputs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const outputs: (TextBlockParam | ImageBlockParam)[] = []
  // 满足 `output.text` 时，共享工具执行该分支。
  if (output.text) {
    // outputs 集合追加新条目，保持收集顺序与输入顺序一致。
    outputs.push({
      text: `\n${output.text}`,
      type: 'text',
    })
  }
  // 满足 `output.image` 时，共享工具执行该分支。
  if (output.image) {
    // outputs 集合追加新条目，保持收集顺序与输入顺序一致。
    outputs.push({
      type: 'image',
      source: {
        data: output.image.image_data,
        media_type: output.image.media_type,
        type: 'base64',
      },
    })
  }
  // 返回 `outputs`，作为共享工具这次计算的结果。
  return outputs
}

// getToolResultFromCell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolResultFromCell(cell: NotebookCellSource) {
  // contentResult保存`cellContentToToolResult`，供共享工具后续处理使用。
  const contentResult = cellContentToToolResult(cell)
  // outputResults 集合派生`flatMap`，供共享工具后续处理使用。
  const outputResults = cell.outputs?.flatMap(cellOutputToToolResult)
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [contentResult, ...(outputResults ?? [])]
}

/**
 * Reads and parses a Jupyter notebook file into processed cell data
 */
// readNotebook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readNotebook(
  notebookPath: string,
  cellId?: string,
): Promise<NotebookCellSource[]> {
  // fullPath 路径数据保存`expandPath`，供共享工具后续处理使用。
  const fullPath = expandPath(notebookPath)
  // buffer读取`getFsImplementation`，供共享工具后续处理使用。
  const buffer = await getFsImplementation().readFileBytes(fullPath)
  // 文本内容格式化`buffer.toString`，供共享工具后续处理使用。
  const content = buffer.toString('utf-8')
  // notebook解析`jsonParse`，供共享工具后续处理使用。
  const notebook = jsonParse(content) as NotebookContent
  // language保存`notebook.metadata.language_info?.name ?? 'python'`，供后续判断或组装使用。
  const language = notebook.metadata.language_info?.name ?? 'python'
  // 满足 `cellId` 时，共享工具执行该分支。
  if (cellId) {
    // cell筛选`cells.find`，供共享工具后续处理使用。
    const cell = notebook.cells.find(c => c.id === cellId)
    // cell缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cell) {
      // 抛出 new Error(`Cell with ID "${cellId}" not found in notebook`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Cell with ID "${cellId}" not found in notebook`)
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [processCell(cell, notebook.cells.indexOf(cell), language, true)]
  }
  // 返回 `notebook.cells.map((cell, index) =>`，作为共享工具这次计算的结果。
  return notebook.cells.map((cell, index) =>
    processCell(cell, index, language, false),
  )
}

/**
 * Maps notebook cell data to tool result block parameters with sophisticated text block merging
 */
// mapNotebookCellsToToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mapNotebookCellsToToolResult(
  data: NotebookCellSource[],
  toolUseID: string,
): ToolResultBlockParam {
  // allResults 集合派生`data.flatMap`，供共享工具后续处理使用。
  const allResults = data.flatMap(getToolResultFromCell)

  // Merge adjacent text blocks
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    tool_use_id: toolUseID,
    type: 'tool_result' as const,
    content: allResults.reduce<(TextBlockParam | ImageBlockParam)[]>(
      // 这个回调绑定到 (acc, curr) => {，负责共享工具在该局部场景下的响应。
      (acc, curr) => {
        // acc为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
        if (acc.length === 0) return [curr]

        // prev记录 `acc[acc.length - 1]` 是否成立，下一步按该结果分支。
        const prev = acc[acc.length - 1]
        // 只有 `prev && prev.type === 'text' && curr.type === 'te` 满足时，共享工具才执行该分支。
        if (prev && prev.type === 'text' && curr.type === 'text') {
          // Merge the text blocks
          // 共享工具 notebook在这里处理 `prev.text += '\n' + curr.text`，完成这一小步状态转换。
          prev.text += '\n' + curr.text
          // 返回 `acc`，作为共享工具这次计算的结果。
          return acc
        }

        // acc追加新条目，保持收集顺序与输入顺序一致。
        acc.push(curr)
        // 返回 `acc`，作为共享工具这次计算的结果。
        return acc
      },
      [],
    ),
  }
}

// parseCellId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseCellId(cellId: string): number | undefined {
  // match匹配`cellId.match`，供共享工具后续处理使用。
  const match = cellId.match(/^cell-(\d+)$/)
  // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
  if (match && match[1]) {
    // index 索引解析`parseInt`，供共享工具后续处理使用。
    const index = parseInt(match[1], 10)
    // 返回 `isNaN(index) ? undefined : index`，作为共享工具这次计算的结果。
    return isNaN(index) ? undefined : index
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}
