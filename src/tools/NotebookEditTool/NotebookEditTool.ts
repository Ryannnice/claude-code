// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname, isAbsolute, resolve } from 'path'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  fileHistoryEnabled,
  fileHistoryTrackEdit,
} from 'src/utils/fileHistory.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef、ToolUseContext，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef, type ToolUseContext } from '../../Tool.js'
// 类型依赖 { NotebookCell, NotebookContent } 来自 ../../types/notebook.js，用于校准工具调用的数据契约。
import type { NotebookCell, NotebookContent } from '../../types/notebook.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT } from '../../utils/errors.js'
// 复用 getFileModificationTime、writeTextContent 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getFileModificationTime, writeTextContent } from '../../utils/file.js'
// 复用 readFileSyncWithMetadata 工具函数，把通用处理留在 ../../utils/fileRead.js 中维护。
import { readFileSyncWithMetadata } from '../../utils/fileRead.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { safeParseJSON } from '../../utils/json.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 parseCellId 工具函数，把通用处理留在 ../../utils/notebook.js 中维护。
import { parseCellId } from '../../utils/notebook.js'
// 复用 checkWritePermissionForTool 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { checkWritePermissionForTool } from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 引入 NOTEBOOK_EDIT_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { NOTEBOOK_EDIT_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
export const inputSchema = lazySchema(() =>
  z.strictObject({
    notebook_path: z
      .string()
      .describe(
        'The absolute path to the Jupyter notebook file to edit (must be absolute, not relative)',
      ),
    cell_id: z
      .string()
      .optional()
      .describe(
        'The ID of the cell to edit. When inserting a new cell, the new cell will be inserted after the cell with this ID, or at the beginning if not specified.',
      ),
    new_source: z.string().describe('The new source for the cell'),
    cell_type: z
      .enum(['code', 'markdown'])
      .optional()
      .describe(
        'The type of the cell (code or markdown). If not specified, it defaults to the current cell type. If using edit_mode=insert, this is required.',
      ),
    edit_mode: z
      .enum(['replace', 'insert', 'delete'])
      .optional()
      .describe(
        'The type of edit to make (replace, insert, delete). Defaults to replace.',
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() =>
  z.object({
    new_source: z
      .string()
      .describe('The new source code that was written to the cell'),
    cell_id: z
      .string()
      .optional()
      .describe('The ID of the cell that was edited'),
    cell_type: z.enum(['code', 'markdown']).describe('The type of the cell'),
    language: z.string().describe('The programming language of the notebook'),
    edit_mode: z.string().describe('The edit mode that was used'),
    error: z
      .string()
      .optional()
      .describe('Error message if the operation failed'),
    // Fields for attribution tracking
    notebook_path: z.string().describe('The path to the notebook file'),
    original_file: z
      .string()
      .describe('The original notebook content before modification'),
    updated_file: z
      .string()
      .describe('The updated notebook content after modification'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// NotebookEditTool构建`buildTool`，供工具调用后续处理使用。
export const NotebookEditTool = buildTool({
  name: NOTEBOOK_EDIT_TOOL_NAME,
  searchHint: 'edit Jupyter notebook cells (.ipynb)',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `PROMPT`，作为工具调用这次计算的结果。
    return PROMPT
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Edit Notebook'`，作为工具调用这次计算的结果。
    return 'Edit Notebook'
  },
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Editing notebook ${summary}` : 'Editing notebook'`，作为工具调用这次计算的结果。
    return summary ? `Editing notebook ${summary}` : 'Editing notebook'
  },
  // 工具实现 Notebook Edit Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Notebook Edit Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，工具调用执行该分支。
    if (feature('TRANSCRIPT_CLASSIFIER')) {
      // mode格式化`input.edit_mode ?? 'replace'`，供后续判断或组装使用。
      const mode = input.edit_mode ?? 'replace'
      // 返回 ``${input.notebook_path} ${mode}: ${input.new_source}``，作为工具调用这次计算的结果。
      return `${input.notebook_path} ${mode}: ${input.new_source}`
    }
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  // getPath 根据 input 读取或计算工具调用需要的结果。
  getPath(input): string {
    // 返回 `input.notebook_path`，作为工具调用这次计算的结果。
    return input.notebook_path
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context): Promise<PermissionDecision> {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // 返回 `checkWritePermissionForTool(`，作为工具调用这次计算的结果。
    return checkWritePermissionForTool(
      NotebookEditTool,
      input,
      appState.toolPermissionContext,
    )
  },
  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam(
    { cell_id, edit_mode, new_source, error },
    toolUseID,
  ) {
    // 满足 `error` 时，工具调用执行该分支。
    if (error) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: error,
        is_error: true,
      }
    }
    // 按照 edit_mode 的取值选择工具调用的具体处理分支。
    switch (edit_mode) {
      case 'replace':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `Updated cell ${cell_id} with ${new_source}`,
        }
      case 'insert':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `Inserted cell ${cell_id} with ${new_source}`,
        }
      case 'delete':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `Deleted cell ${cell_id}`,
        }
      default:
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: 'Unknown edit mode',
        }
    }
  },
  renderToolUseMessage,
  renderToolUseRejectedMessage,
  renderToolUseErrorMessage,
  renderToolResultMessage,
  // 工具实现 Notebook Edit Tool在这里处理 `async validateInput(`，完成这一小步状态转换。
  async validateInput(
    { notebook_path, cell_type, cell_id, edit_mode = 'replace' },
    toolUseContext: ToolUseContext,
  ) {
    // fullPath 路径数据保存`isAbsolute`，供工具调用后续处理使用。
    const fullPath = isAbsolute(notebook_path)
      ? notebook_path
      : resolve(getCwd(), notebook_path)

    // SECURITY: Skip filesystem operations for UNC paths to prevent NTLM credential leaks.
    // 只有 `fullPath.startsWith('\\\\') || fullPath.startsWith('//')` 满足时，工具调用才执行该分支。
    if (fullPath.startsWith('\\\\') || fullPath.startsWith('//')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }

    // `extname(fullPath)` 与 `'.ipynb'` 不一致时刷新派生状态，避免使用过期结果。
    if (extname(fullPath) !== '.ipynb') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File must be a Jupyter notebook (.ipynb file). For editing other file types, use the FileEdit tool.',
        errorCode: 2,
      }
    }

    // 工具调用在这里按实际状态进入对应分支。
    if (
      edit_mode !== 'replace' &&
      edit_mode !== 'insert' &&
      edit_mode !== 'delete'
    ) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'Edit mode must be replace, insert, or delete.',
        errorCode: 4,
      }
    }

    // 只有 `edit_mode === 'insert' && !cell_type` 满足时，工具调用才执行该分支。
    if (edit_mode === 'insert' && !cell_type) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'Cell type is required when using edit_mode=insert.',
        errorCode: 5,
      }
    }

    // Require Read-before-Edit (matches FileEditTool/FileWriteTool). Without
    // this, the model could edit a notebook it never saw, or edit against a
    // stale view after an external change — silent data loss.
    // readTimestamp读取`readFileState.get`，供工具调用后续处理使用。
    const readTimestamp = toolUseContext.readFileState.get(fullPath)
    // readTimestamp缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!readTimestamp) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File has not been read yet. Read it first before writing to it.',
        errorCode: 9,
      }
    }
    // 满足 `getFileModificationTime(fullPath) > readTimestamp.timestamp` 时，工具调用执行该分支。
    if (getFileModificationTime(fullPath) > readTimestamp.timestamp) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.',
        errorCode: 10,
      }
    }

    // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let content: string
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容更新为 `readFileSyncWithMetadata(fullPath).content`，确保工具调用后续读取最新状态。
      content = readFileSyncWithMetadata(fullPath).content
    } catch (e) {
      // 满足 `isENOENT(e)` 时，工具调用执行该分支。
      if (isENOENT(e)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'Notebook file does not exist.',
          errorCode: 1,
        }
      }
      // 抛出 e，阻止工具调用在无效状态下继续运行。
      throw e
    }
    // notebook保存`safeParseJSON`，供工具调用后续处理使用。
    const notebook = safeParseJSON(content) as NotebookContent | null
    // notebook缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!notebook) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'Notebook is not valid JSON.',
        errorCode: 6,
      }
    }
    // cell_id缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!cell_id) {
      // `edit_mode` 与 `'insert'` 不一致时刷新派生状态，避免使用过期结果。
      if (edit_mode !== 'insert') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'Cell ID must be specified when not inserting a new cell.',
          errorCode: 7,
        }
      }
    } else {
      // First try to find the cell by its actual ID
      // cellIndex 索引筛选`cells.findIndex`，供工具调用后续处理使用。
      const cellIndex = notebook.cells.findIndex(cell => cell.id === cell_id)

      // 满足 `cellIndex === -1` 时，工具调用执行该分支。
      if (cellIndex === -1) {
        // If not found, try to parse as a numeric index (cell-N format)
        // parsedCellIndex 索引解析`parseCellId`，供工具调用后续处理使用。
        const parsedCellIndex = parseCellId(cell_id)
        // `parsedCellIndex` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (parsedCellIndex !== undefined) {
          // 满足 `!notebook.cells[parsedCellIndex]` 时，工具调用执行该分支。
          if (!notebook.cells[parsedCellIndex]) {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              result: false,
              message: `Cell with index ${parsedCellIndex} does not exist in notebook.`,
              errorCode: 7,
            }
          }
        } else {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message: `Cell with ID "${cell_id}" not found in notebook.`,
            errorCode: 8,
          }
        }
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // 工具实现 Notebook Edit Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    {
      notebook_path,
      new_source,
      cell_id,
      cell_type,
      edit_mode: originalEditMode,
    },
    { readFileState, updateFileHistoryState },
    _,
    parentMessage,
  ) {
    // fullPath 路径数据保存`isAbsolute`，供工具调用后续处理使用。
    const fullPath = isAbsolute(notebook_path)
      ? notebook_path
      : resolve(getCwd(), notebook_path)

    // 满足 `fileHistoryEnabled()` 时，工具调用执行该分支。
    if (fileHistoryEnabled()) {
      // 等待 `fileHistoryTrackEdit(` 完成，再继续工具实现 Notebook Edit Tool的异步流程。
      await fileHistoryTrackEdit(
        updateFileHistoryState,
        fullPath,
        parentMessage.uuid,
      )
    }

    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // readFileSyncWithMetadata gives content + encoding + line endings in
      // one safeResolvePath + readFileSync pass, replacing the previous
      // detectFileEncoding + readFile + detectLineEndings chain (each of
      // which redid safeResolvePath and/or a 4KB readSync).
      // 工具实现 Notebook Edit Tool先整理这一处局部数据，后续分支可以直接读取。
      const { content, encoding, lineEndings } =
        readFileSyncWithMetadata(fullPath)
      // Must use non-memoized jsonParse here: safeParseJSON caches by content
      // string and returns a shared object reference, but we mutate the
      // notebook in place below (cells.splice, targetCell.source = ...).
      // Using the memoized version poisons the cache for validateInput() and
      // any subsequent call() with the same file content.
      // notebook 先占位，稍后的条件分支会根据实际输入补齐它。
      let notebook: NotebookContent
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // notebook更新为 `jsonParse(content) as NotebookContent`，确保工具调用后续读取最新状态。
        notebook = jsonParse(content) as NotebookContent
      } catch {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            new_source,
            cell_type: cell_type ?? 'code',
            language: 'python',
            edit_mode: 'replace',
            error: 'Notebook is not valid JSON.',
            cell_id,
            notebook_path: fullPath,
            original_file: '',
            updated_file: '',
          },
        }
      }

      // cellIndex 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let cellIndex
      // cell_id缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!cell_id) {
        // cellIndex 索引更新为 `0 // Default to inserting at the beginning if no cell_id ...`，确保工具调用后续读取最新状态。
        cellIndex = 0 // Default to inserting at the beginning if no cell_id is provided
      } else {
        // First try to find the cell by its actual ID
        // cellIndex 索引更新为 `notebook.cells.findIndex(cell => cell.id === cell_id)`，确保工具调用后续读取最新状态。
        cellIndex = notebook.cells.findIndex(cell => cell.id === cell_id)

        // If not found, try to parse as a numeric index (cell-N format)
        // 满足 `cellIndex === -1` 时，工具调用执行该分支。
        if (cellIndex === -1) {
          // parsedCellIndex 索引解析`parseCellId`，供工具调用后续处理使用。
          const parsedCellIndex = parseCellId(cell_id)
          // `parsedCellIndex` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
          if (parsedCellIndex !== undefined) {
            // cellIndex 索引更新为 `parsedCellIndex`，确保工具调用后续读取最新状态。
            cellIndex = parsedCellIndex
          }
        }

        // 当 `originalEditMode` 匹配 `'insert'` 时，工具调用执行对应分支。
        if (originalEditMode === 'insert') {
          // 工具实现 Notebook Edit Tool在这里处理 `cellIndex += 1 // Insert after the cell with this ID`，完成这一小步状态转换。
          cellIndex += 1 // Insert after the cell with this ID
        }
      }

      // Convert replace to insert if trying to replace one past the end
      // edit_mode 命名 `originalEditMode`，让后续代码直接表达这个值的用途。
      let edit_mode = originalEditMode
      // 只有 `edit_mode === 'replace' && cellIndex === notebook` 满足时，工具调用才执行该分支。
      if (edit_mode === 'replace' && cellIndex === notebook.cells.length) {
        // edit_mode更新为 `'insert'`，确保工具调用后续读取最新状态。
        edit_mode = 'insert'
        // cell_type缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!cell_type) {
          // cell_type更新为 `'code' // Default to code if no cell_type specified`，确保工具调用后续读取最新状态。
          cell_type = 'code' // Default to code if no cell_type specified
        }
      }

      // language保存`notebook.metadata.language_info?.name ?? 'python'`，供后续判断或组装使用。
      const language = notebook.metadata.language_info?.name ?? 'python'
      // new_cell_id保存`undefined`，作为后续未定义值处理的输入。
      let new_cell_id = undefined
      // 工具调用在这里按实际状态进入对应分支。
      if (
        notebook.nbformat > 4 ||
        (notebook.nbformat === 4 && notebook.nbformat_minor >= 5)
      ) {
        // 当 `edit_mode` 匹配 `'insert'` 时，工具调用执行对应分支。
        if (edit_mode === 'insert') {
          // new_cell_id更新为 `Math.random().toString(36).substring(2, 15)`，确保工具调用后续读取最新状态。
          new_cell_id = Math.random().toString(36).substring(2, 15)
        // 工具实现 Notebook Edit Tool在这里处理 `} else if (cell_id !== null) {`，完成这一小步状态转换。
        } else if (cell_id !== null) {
          // new_cell_id更新为 `cell_id`，确保工具调用后续读取最新状态。
          new_cell_id = cell_id
        }
      }

      // 当 `edit_mode` 匹配 `'delete'` 时，工具调用执行对应分支。
      if (edit_mode === 'delete') {
        // Delete the specified cell
        // 调用 notebook.cells.splice，触发工具调用此处需要的副作用。
        notebook.cells.splice(cellIndex, 1)
      // 工具实现 Notebook Edit Tool在这里处理 `} else if (edit_mode === 'insert') {`，完成这一小步状态转换。
      } else if (edit_mode === 'insert') {
        // new_cell 先占位，稍后的条件分支会根据实际输入补齐它。
        let new_cell: NotebookCell
        // 当 `cell_type` 匹配 `'markdown'` 时，工具调用执行对应分支。
        if (cell_type === 'markdown') {
          // new_cell更新为 `{`，确保工具调用后续读取最新状态。
          new_cell = {
            cell_type: 'markdown',
            id: new_cell_id,
            source: new_source,
            metadata: {},
          }
        } else {
          // new_cell更新为 `{`，确保工具调用后续读取最新状态。
          new_cell = {
            cell_type: 'code',
            id: new_cell_id,
            source: new_source,
            metadata: {},
            execution_count: null,
            outputs: [],
          }
        }
        // Insert the new cell
        // 调用 notebook.cells.splice，触发工具调用此处需要的副作用。
        notebook.cells.splice(cellIndex, 0, new_cell)
      } else {
        // Find the specified cell
        // targetCell 命名 `notebook.cells[cellIndex]! // validateInput ensures cell_...`，让后续代码直接表达这个值的用途。
        const targetCell = notebook.cells[cellIndex]! // validateInput ensures cell_number is in bounds
        // source更新为 `new_source`，确保工具调用后续读取最新状态。
        targetCell.source = new_source
        // 当 `targetCell.cell_type` 匹配 `'code'` 时，工具调用执行对应分支。
        if (targetCell.cell_type === 'code') {
          // Reset execution count and clear outputs since cell was modified
          // execution_count 数量更新为 `null`，确保工具调用后续读取最新状态。
          targetCell.execution_count = null
          // outputs 集合更新为 `[]`，确保工具调用后续读取最新状态。
          targetCell.outputs = []
        }
        // `cell_type && cell_type` 与 `targetCell.cell_type` 不一致时刷新派生状态，避免使用过期结果。
        if (cell_type && cell_type !== targetCell.cell_type) {
          // cell_type更新为 `cell_type`，确保工具调用后续读取最新状态。
          targetCell.cell_type = cell_type
        }
      }
      // Write back to file
      // IPYNB_INDENT 命名 `1`，让后续代码直接表达这个值的用途。
      const IPYNB_INDENT = 1
      // updatedContent保存`jsonStringify`，供工具调用后续处理使用。
      const updatedContent = jsonStringify(notebook, null, IPYNB_INDENT)
      // 调用 writeTextContent，触发工具调用此处需要的副作用。
      writeTextContent(fullPath, updatedContent, encoding, lineEndings)
      // Update readFileState with post-write mtime (matches FileEditTool/
      // FileWriteTool). offset:undefined breaks FileReadTool's dedup match —
      // without this, Read→NotebookEdit→Read in the same millisecond would
      // return the file_unchanged stub against stale in-context content.
      // readFileState.set 写入新的状态值，使工具调用后续读取保持一致。
      readFileState.set(fullPath, {
        content: updatedContent,
        timestamp: getFileModificationTime(fullPath),
        offset: undefined,
        limit: undefined,
      })
      // data集中保存工具实现 Notebook Edit Tool要一起传递的字段。
      const data = {
        new_source,
        cell_type: cell_type ?? 'code',
        language,
        edit_mode: edit_mode ?? 'replace',
        cell_id: new_cell_id || undefined,
        error: '',
        notebook_path: fullPath,
        original_file: content,
        updated_file: updatedContent,
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data,
      }
    } catch (error) {
      // 满足 `error instanceof Error` 时，工具调用执行该分支。
      if (error instanceof Error) {
        // data集中保存工具实现 Notebook Edit Tool要一起传递的字段。
        const data = {
          new_source,
          cell_type: cell_type ?? 'code',
          language: 'python',
          edit_mode: 'replace',
          error: error.message,
          cell_id,
          notebook_path: fullPath,
          original_file: '',
          updated_file: '',
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data,
        }
      }
      // data集中保存工具实现 Notebook Edit Tool要一起传递的字段。
      const data = {
        new_source,
        cell_type: cell_type ?? 'code',
        language: 'python',
        edit_mode: 'replace',
        error: 'Unknown error occurred while editing notebook',
        cell_id,
        notebook_path: fullPath,
        original_file: '',
        updated_file: '',
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data,
      }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
