// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  CallHierarchyIncomingCall,
  CallHierarchyItem,
  CallHierarchyOutgoingCall,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  SymbolInformation,
} from 'vscode-languageserver-types'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getInitializationStatus,
  getLspServerManager,
  isLspConnected,
  waitForInitialization,
} from '../../services/lsp/manager.js'
// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 uniq 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { uniq } from '../../utils/array.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isENOENT、toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT, toError } from '../../utils/errors.js'
// 复用 execFileNoThrowWithCwd 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrowWithCwd } from '../../utils/execFileNoThrow.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'
// 复用 checkReadPermissionForTool 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { checkReadPermissionForTool } from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  formatDocumentSymbolResult,
  formatFindReferencesResult,
  formatGoToDefinitionResult,
  formatHoverResult,
  formatIncomingCallsResult,
  formatOutgoingCallsResult,
  formatPrepareCallHierarchyResult,
  formatWorkspaceSymbolResult,
} from './formatters.js'
// 引入 DESCRIPTION、LSP_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, LSP_TOOL_NAME } from './prompt.js'
// 引入 lspToolInputSchema，将 ./schemas.js 中已经封装好的能力接到本文件流程里。
import { lspToolInputSchema } from './schemas.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  userFacingName,
} from './UI.js'

// MAX_LSP_FILE_SIZE_BYTES 文件数据保存`10_000_000`，供工具实现 LSPTool后续判断或输出使用。
const MAX_LSP_FILE_SIZE_BYTES = 10_000_000

/**
 * Tool-compatible input schema (regular ZodObject instead of discriminated union)
 * We validate against the discriminated union in validateInput for better error messages
 */
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    operation: z
      .enum([
        'goToDefinition',
        'findReferences',
        'hover',
        'documentSymbol',
        'workspaceSymbol',
        'goToImplementation',
        'prepareCallHierarchy',
        'incomingCalls',
        'outgoingCalls',
      ])
      .describe('The LSP operation to perform'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    operation: z
      .enum([
        'goToDefinition',
        'findReferences',
        'hover',
        'documentSymbol',
        'workspaceSymbol',
        'goToImplementation',
        'prepareCallHierarchy',
        'incomingCalls',
        'outgoingCalls',
      ])
      .describe('The LSP operation that was performed'),
    result: z.string().describe('The formatted result of the LSP operation'),
    filePath: z
      .string()
      .describe('The file path the operation was performed on'),
    resultCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of results (definitions, references, symbols)'),
    fileCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of files containing results'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>
// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

// LSPTool构建`buildTool`，供工具调用后续处理使用。
export const LSPTool = buildTool({
  name: LSP_TOOL_NAME,
  searchHint: 'code intelligence (definitions, references, symbols, hover)',
  maxResultSizeChars: 100_000,
  isLsp: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  userFacingName,
  shouldDefer: true,
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isLspConnected()`，作为工具调用这次计算的结果。
    return isLspConnected()
  },
  // 工具实现 LSPTool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 LSPTool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // getPath 根据 { filePath } 读取或计算工具调用需要的结果。
  getPath({ filePath }): string {
    // 返回 `expandPath(filePath)`，作为工具调用这次计算的结果。
    return expandPath(filePath)
  },
  // validateInput 使用 input: Input 完成工具调用里的对应操作。
  async validateInput(input: Input): Promise<ValidationResult> {
    // First validate against the discriminated union for better type safety
    // parseResult保存`lspToolInputSchema`，供工具调用后续处理使用。
    const parseResult = lspToolInputSchema().safeParse(input)
    // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!parseResult.success) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Invalid input: ${parseResult.error.message}`,
        errorCode: 3,
      }
    }

    // Validate file exists and is a regular file
    // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const fs = getFsImplementation()
    // absolutePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const absolutePath = expandPath(input.filePath)

    // SECURITY: Skip filesystem operations for UNC paths to prevent NTLM credential leaks.
    // 只有 `absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')` 满足时，工具调用才执行该分支。
    if (absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }

    // stats 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let stats
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合更新为 `await fs.stat(absolutePath)`，确保工具调用后续读取最新状态。
      stats = await fs.stat(absolutePath)
    } catch (error) {
      // 满足 `isENOENT(error)` 时，工具调用执行该分支。
      if (isENOENT(error)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `File does not exist: ${input.filePath}`,
          errorCode: 1,
        }
      }
      // err保存`toError`，供工具调用后续处理使用。
      const err = toError(error)
      // Log filesystem access errors for tracking
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Failed to access file stats for LSP operation on ${input.filePath}: ${err.message}`,
        ),
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Cannot access file: ${input.filePath}. ${err.message}`,
        errorCode: 4,
      }
    }

    // 满足 `!stats.isFile()` 时，工具调用执行该分支。
    if (!stats.isFile()) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Path is not a file: ${input.filePath}`,
        errorCode: 2,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context): Promise<PermissionDecision> {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // 返回 `checkReadPermissionForTool(`，作为工具调用这次计算的结果。
    return checkReadPermissionForTool(
      LSPTool,
      input,
      appState.toolPermissionContext,
    )
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  renderToolUseMessage,
  renderToolUseErrorMessage,
  renderToolResultMessage,
  // call 使用 input: Input, _context 完成工具调用里的对应操作。
  async call(input: Input, _context) {
    // absolutePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const absolutePath = expandPath(input.filePath)
    // cwd读取`getCwd`，供工具调用后续处理使用。
    const cwd = getCwd()

    // Wait for initialization if it's still pending
    // This prevents returning "no server available" before init completes
    // status 集合读取`getInitializationStatus`，供工具调用后续处理使用。
    const status = getInitializationStatus()
    // 当 `status.status` 匹配 `'pending'` 时，工具调用执行对应分支。
    if (status.status === 'pending') {
      // 等待 `waitForInitialization()` 完成，再继续工具实现 LSPTool的异步流程。
      await waitForInitialization()
    }

    // Get the LSP server manager
    // manager读取`getLspServerManager`，供工具调用后续处理使用。
    const manager = getLspServerManager()
    // manager缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!manager) {
      // Log this system-level failure for tracking
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error('LSP server manager not initialized when tool was called'),
      )

      // output 集中保存工具实现 LSPTool要一起传递的字段。
      const output: Output = {
        operation: input.operation,
        result:
          'LSP server manager not initialized. This may indicate a startup issue.',
        filePath: input.filePath,
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: output,
      }
    }

    // Map operation to LSP method and prepare params
    // 从 `getMethodAndParams(input, absolutePath)` 解构 method、params，减少工具实现 LSPTool对同一对象的重复访问。
    const { method, params } = getMethodAndParams(input, absolutePath)

    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // Ensure file is open in LSP server before making requests
      // Most LSP servers require textDocument/didOpen before operations
      // Only read the file if it's not already open to avoid unnecessary I/O
      // 满足 `!manager.isFileOpen(absolutePath)` 时，工具调用执行该分支。
      if (!manager.isFileOpen(absolutePath)) {
        // handle保存`open`，供工具调用后续处理使用。
        const handle = await open(absolutePath, 'r')
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // stats 集合保存`handle.stat`，供工具调用后续处理使用。
          const stats = await handle.stat()
          // 满足 `stats.size > MAX_LSP_FILE_SIZE_BYTES` 时，工具调用执行该分支。
          if (stats.size > MAX_LSP_FILE_SIZE_BYTES) {
            // output 集中保存工具实现 LSPTool要一起传递的字段。
            const output: Output = {
              operation: input.operation,
              result: `File too large for LSP analysis (${Math.ceil(stats.size / 1_000_000)}MB exceeds 10MB limit)`,
              filePath: input.filePath,
            }
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return { data: output }
          }
          // fileContent 文件数据读取`handle.readFile`，供工具调用后续处理使用。
          const fileContent = await handle.readFile({ encoding: 'utf-8' })
          // 等待 `manager.openFile(absolutePath, fileContent)` 完成，再继续工具实现 LSPTool的异步流程。
          await manager.openFile(absolutePath, fileContent)
        } finally {
          // 等待 `handle.close()` 完成，再继续工具实现 LSPTool的异步流程。
          await handle.close()
        }
      }

      // Send request to LSP server
      // 结果保存`manager.sendRequest`，供工具调用后续处理使用。
      let result = await manager.sendRequest(absolutePath, method, params)

      // 满足 `result === undefined` 时，工具调用执行该分支。
      if (result === undefined) {
        // Log for diagnostic purposes - helps track usage patterns and potential bugs
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `No LSP server available for file type ${path.extname(absolutePath)} for operation ${input.operation} on file ${input.filePath}`,
        )

        // output 集中保存工具实现 LSPTool要一起传递的字段。
        const output: Output = {
          operation: input.operation,
          result: `No LSP server available for file type: ${path.extname(absolutePath)}`,
          filePath: input.filePath,
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: output,
        }
      }

      // For incomingCalls and outgoingCalls, we need a two-step process:
      // 1. First get CallHierarchyItem(s) from prepareCallHierarchy
      // 2. Then request the actual calls using that item
      // 工具调用在这里按实际状态进入对应分支。
      if (
        input.operation === 'incomingCalls' ||
        input.operation === 'outgoingCalls'
      ) {
        // callItems 集合 命名 `result as CallHierarchyItem[]`，让后续代码直接表达这个值的用途。
        const callItems = result as CallHierarchyItem[]
        // !callItems || callItems 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
        if (!callItems || callItems.length === 0) {
          // output 集中保存工具实现 LSPTool要一起传递的字段。
          const output: Output = {
            operation: input.operation,
            result: 'No call hierarchy item found at this position',
            filePath: input.filePath,
            resultCount: 0,
            fileCount: 0,
          }
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return { data: output }
        }

        // Use the first call hierarchy item to request calls
        // callMethod 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const callMethod =
          input.operation === 'incomingCalls'
            ? 'callHierarchy/incomingCalls'
            : 'callHierarchy/outgoingCalls'

        // 结果更新为 `await manager.sendRequest(absolutePath, callMethod, {`，确保工具调用后续读取最新状态。
        result = await manager.sendRequest(absolutePath, callMethod, {
          item: callItems[0],
        })

        // 满足 `result === undefined` 时，工具调用执行该分支。
        if (result === undefined) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `LSP server returned undefined for ${callMethod} on ${input.filePath}`,
          )
          // Continue to formatter which will handle empty/null gracefully
        }
      }

      // Filter out gitignored files from location-based results
      // 工具调用在这里按实际状态进入对应分支。
      if (
        result &&
        Array.isArray(result) &&
        (input.operation === 'findReferences' ||
          input.operation === 'goToDefinition' ||
          input.operation === 'goToImplementation' ||
          input.operation === 'workspaceSymbol')
      ) {
        // 当 `input.operation` 匹配 `'workspaceSymbol'` 时，工具调用执行对应分支。
        if (input.operation === 'workspaceSymbol') {
          // SymbolInformation has location.uri — filter by extracting locations
          // symbols 集合 命名 `result as SymbolInformation[]`，让后续代码直接表达这个值的用途。
          const symbols = result as SymbolInformation[]
          // locations 集合 命名 `symbols`，让后续代码直接表达这个值的用途。
          const locations = symbols
            // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
            .filter(s => s?.location?.uri)
            // 链式调用 map，继续加工上一行在工具调用中产生的数据。
            .map(s => s.location)
          // filteredLocations 集合筛选`filterGitIgnoredLocations`，供工具调用后续处理使用。
          const filteredLocations = await filterGitIgnoredLocations(
            locations,
            cwd,
          )
          // filteredUris 集合保存`Set`，供工具调用后续处理使用。
          const filteredUris = new Set(filteredLocations.map(l => l.uri))
          // 结果更新为 `symbols.filter(`，确保工具调用后续读取最新状态。
          result = symbols.filter(
            // s 集合更新为 `> !s?.location?.uri || filteredUris.has(s.location.uri)`，确保工具调用后续读取最新状态。
            s => !s?.location?.uri || filteredUris.has(s.location.uri),
          )
        } else {
          // Location[] or (Location | LocationLink)[]
          // locations 集合保存`as`，供工具调用后续处理使用。
          const locations = (result as (Location | LocationLink)[]).map(
            toLocation,
          )
          // filteredLocations 集合筛选`filterGitIgnoredLocations`，供工具调用后续处理使用。
          const filteredLocations = await filterGitIgnoredLocations(
            locations,
            cwd,
          )
          // filteredUris 集合保存`Set`，供工具调用后续处理使用。
          const filteredUris = new Set(filteredLocations.map(l => l.uri))
          // 结果更新为 `(result as (Location | LocationLink)[]).filter(item => {`，确保工具调用后续读取最新状态。
          result = (result as (Location | LocationLink)[]).filter(item => {
            // loc保存`toLocation`，供工具调用后续处理使用。
            const loc = toLocation(item)
            // 返回 `!loc.uri || filteredUris.has(loc.uri)`，作为工具调用这次计算的结果。
            return !loc.uri || filteredUris.has(loc.uri)
          })
        }
      }

      // Format the result based on operation type
      // 从 `formatResult(` 解构 formatted、resultCount、fileCount，减少工具实现 LSPTool对同一对象的重复访问。
      const { formatted, resultCount, fileCount } = formatResult(
        input.operation,
        result,
        cwd,
      )

      // output 集中保存工具实现 LSPTool要一起传递的字段。
      const output: Output = {
        operation: input.operation,
        result: formatted,
        filePath: input.filePath,
        resultCount,
        fileCount,
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: output,
      }
    } catch (error) {
      // err保存`toError`，供工具调用后续处理使用。
      const err = toError(error)
      // errorMessage 消息数据 命名 `err.message`，让后续代码直接表达这个值的用途。
      const errorMessage = err.message

      // Log error for tracking
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `LSP tool request failed for ${input.operation} on ${input.filePath}: ${errorMessage}`,
        ),
      )

      // output 集中保存工具实现 LSPTool要一起传递的字段。
      const output: Output = {
        operation: input.operation,
        result: `Error performing ${input.operation}: ${errorMessage}`,
        filePath: input.filePath,
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: output,
      }
    }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: output.result,
    }
  },
} satisfies ToolDef<InputSchema, Output>)

/**
 * Maps LSPTool operation to LSP method and params
 */
// getMethodAndParams 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMethodAndParams(
  input: Input,
  absolutePath: string,
): { method: string; params: unknown } {
  // uri保存`pathToFileURL`，供工具调用后续处理使用。
  const uri = pathToFileURL(absolutePath).href
  // Convert from 1-based (user-friendly) to 0-based (LSP protocol)
  // position集中保存工具实现 LSPTool要一起传递的字段。
  const position = {
    line: input.line - 1,
    character: input.character - 1,
  }

  // 按照 input.operation 的取值选择工具调用的具体处理分支。
  switch (input.operation) {
    case 'goToDefinition':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/definition',
        params: {
          textDocument: { uri },
          position,
        },
      }
    case 'findReferences':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/references',
        params: {
          textDocument: { uri },
          position,
          context: { includeDeclaration: true },
        },
      }
    case 'hover':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/hover',
        params: {
          textDocument: { uri },
          position,
        },
      }
    case 'documentSymbol':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/documentSymbol',
        params: {
          textDocument: { uri },
        },
      }
    case 'workspaceSymbol':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'workspace/symbol',
        params: {
          query: '', // Empty query returns all symbols
        },
      }
    case 'goToImplementation':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/implementation',
        params: {
          textDocument: { uri },
          position,
        },
      }
    case 'prepareCallHierarchy':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/prepareCallHierarchy',
        params: {
          textDocument: { uri },
          position,
        },
      }
    case 'incomingCalls':
      // For incoming/outgoing calls, we first need to prepare the call hierarchy
      // The LSP server will return CallHierarchyItem(s) that we pass to the calls request
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/prepareCallHierarchy',
        params: {
          textDocument: { uri },
          position,
        },
      }
    case 'outgoingCalls':
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        method: 'textDocument/prepareCallHierarchy',
        params: {
          textDocument: { uri },
          position,
        },
      }
  }
}

/**
 * Counts the total number of symbols including nested children
 */
// countSymbols 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countSymbols(symbols: DocumentSymbol[]): number {
  // count 数量记录 `symbols.length` 是否成立，下一步按该结果分支。
  let count = symbols.length
  // 按顺序遍历 `symbols` 中的symbol，逐个交给工具调用处理。
  for (const symbol of symbols) {
    // 只有 `symbol.children && symbol.children.length > 0` 满足时，工具调用才执行该分支。
    if (symbol.children && symbol.children.length > 0) {
      // 工具实现 LSPTool在这里处理 `count += countSymbols(symbol.children)`，完成这一小步状态转换。
      count += countSymbols(symbol.children)
    }
  }
  // 返回 `count`，作为工具调用这次计算的结果。
  return count
}

/**
 * Counts unique files from an array of locations
 */
// countUniqueFiles 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUniqueFiles(locations: Location[]): number {
  // 返回 `new Set(locations.map(loc => loc.uri)).size`，作为工具调用这次计算的结果。
  return new Set(locations.map(loc => loc.uri)).size
}

/**
 * Extracts a file path from a file:// URI, decoding percent-encoded characters.
 */
// uriToFilePath 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function uriToFilePath(uri: string): string {
  // 文件路径格式化`uri.replace`，供工具调用后续处理使用。
  let filePath = uri.replace(/^file:\/\//, '')
  // On Windows, file:///C:/path becomes /C:/path — strip the leading slash
  // 满足 `/^\/[A-Za-z]:/.test(filePath)` 时，工具调用执行该分支。
  if (/^\/[A-Za-z]:/.test(filePath)) {
    // 文件路径更新为 `filePath.slice(1)`，确保工具调用后续读取最新状态。
    filePath = filePath.slice(1)
  }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 文件路径更新为 `decodeURIComponent(filePath)`，确保工具调用后续读取最新状态。
    filePath = decodeURIComponent(filePath)
  } catch {
    // Use un-decoded path if malformed
  }
  // 返回 `filePath`，作为工具调用这次计算的结果。
  return filePath
}

/**
 * Filters out locations whose file paths are gitignored.
 * Uses `git check-ignore` with batched path arguments for efficiency.
 */
// filterGitIgnoredLocations 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function filterGitIgnoredLocations<T extends Location>(
  locations: T[],
  cwd: string,
): Promise<T[]> {
  // locations 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (locations.length === 0) {
    // 返回 `locations`，作为工具调用这次计算的结果。
    return locations
  }

  // Collect unique file paths from URIs
  // uriToPath 路径数据构建`new Map<string, string>()` 整理出中间结果，供工具实现 LSPTool后续步骤使用。
  const uriToPath = new Map<string, string>()
  // 按顺序遍历 `locations` 中的loc，逐个交给工具调用处理。
  for (const loc of locations) {
    // 只有 `loc.uri && !uriToPath.has(loc.uri)` 满足时，工具调用才执行该分支。
    if (loc.uri && !uriToPath.has(loc.uri)) {
      // uriToPath.set 写入新的状态值，使工具调用后续读取保持一致。
      uriToPath.set(loc.uri, uriToFilePath(loc.uri))
    }
  }

  // uniquePaths 路径数据保存`uniq`，供工具调用后续处理使用。
  const uniquePaths = uniq(uriToPath.values())
  // uniquePaths 路径数据为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (uniquePaths.length === 0) {
    // 返回 `locations`，作为工具调用这次计算的结果。
    return locations
  }

  // Batch check paths with git check-ignore
  // Exit code 0 = at least one path is ignored, 1 = none ignored, 128 = not a git repo
  // ignoredPaths 路径数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const ignoredPaths = new Set<string>()
  // BATCH_SIZE保存`50`，供后续判断或组装使用。
  const BATCH_SIZE = 50
  // 循环处理 `let i = 0; i < uniquePaths.length; i += BATCH_SIZE`，让工具调用逐项把同类条目按顺序走完。
  for (let i = 0; i < uniquePaths.length; i += BATCH_SIZE) {
    // batch格式化`uniquePaths.slice`，供工具调用后续处理使用。
    const batch = uniquePaths.slice(i, i + BATCH_SIZE)
    // 结果保存`execFileNoThrowWithCwd`，供工具调用后续处理使用。
    const result = await execFileNoThrowWithCwd(
      'git',
      ['check-ignore', ...batch],
      {
        cwd,
        preserveOutputOnError: false,
        timeout: 5_000,
      },
    )

    // 只有 `result.code === 0 && result.stdout` 满足时，工具调用才执行该分支。
    if (result.code === 0 && result.stdout) {
      // 逐项读取 `result.stdout.split('\n')` 中的line，按输入顺序推进工具调用。
      for (const line of result.stdout.split('\n')) {
        // trimmed格式化`line.trim`，供工具调用后续处理使用。
        const trimmed = line.trim()
        // 满足 `trimmed` 时，工具调用执行该分支。
        if (trimmed) {
          // 调用 ignoredPaths.add，触发工具调用此处需要的副作用。
          ignoredPaths.add(trimmed)
        }
      }
    }
  }

  // 满足 `ignoredPaths.size === 0` 时，工具调用执行该分支。
  if (ignoredPaths.size === 0) {
    // 返回 `locations`，作为工具调用这次计算的结果。
    return locations
  }

  // 返回 `locations.filter(loc => {`，作为工具调用这次计算的结果。
  return locations.filter(loc => {
    // 文件路径读取`uriToPath.get`，供工具调用后续处理使用。
    const filePath = uriToPath.get(loc.uri)
    // 返回 `!filePath || !ignoredPaths.has(filePath)`，作为工具调用这次计算的结果。
    return !filePath || !ignoredPaths.has(filePath)
  })
}

/**
 * Checks if item is LocationLink (has targetUri) vs Location (has uri)
 */
// isLocationLink 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocationLink(item: Location | LocationLink): item is LocationLink {
  // 返回 `'targetUri' in item`，作为工具调用这次计算的结果。
  return 'targetUri' in item
}

/**
 * Converts LocationLink to Location format for uniform handling
 */
// toLocation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toLocation(item: Location | LocationLink): Location {
  // 满足 `isLocationLink(item)` 时，工具调用执行该分支。
  if (isLocationLink(item)) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      uri: item.targetUri,
      range: item.targetSelectionRange || item.targetRange,
    }
  }
  // 返回 `item`，作为工具调用这次计算的结果。
  return item
}

/**
 * Formats LSP result based on operation type and extracts summary counts
 */
// formatResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatResult(
  operation: Input['operation'],
  result: unknown,
  cwd: string,
): { formatted: string; resultCount: number; fileCount: number } {
  // 按照 operation 的取值选择工具调用的具体处理分支。
  switch (operation) {
    case 'goToDefinition': {
      // Handle both Location and LocationLink formats
      // rawResults 集合保存`Array.isArray`，供工具调用后续处理使用。
      const rawResults = Array.isArray(result)
        ? result
        : result
          ? [result as Location | LocationLink]
          : []

      // Convert LocationLinks to Locations for uniform handling
      // locations 集合派生`rawResults.map`，供工具调用后续处理使用。
      const locations = rawResults.map(toLocation)

      // Log and filter out locations with undefined uris
      // invalidLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const invalidLocations = locations.filter(loc => !loc || !loc.uri)
      // 满足 `invalidLocations.length > 0` 时，工具调用执行该分支。
      if (invalidLocations.length > 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server returned ${invalidLocations.length} location(s) with undefined URI for goToDefinition on ${cwd}. ` +
              `This indicates malformed data from the LSP server.`,
          ),
        )
      }

      // validLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const validLocations = locations.filter(loc => loc && loc.uri)
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatGoToDefinitionResult(
          result as
            | Location
            | Location[]
            | LocationLink
            | LocationLink[]
            | null,
          cwd,
        ),
        resultCount: validLocations.length,
        fileCount: countUniqueFiles(validLocations),
      }
    }
    case 'findReferences': {
      // locations 集合标记工具实现 LSPTool是否启用对应路径。
      const locations = (result as Location[]) || []

      // Log and filter out locations with undefined uris
      // invalidLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const invalidLocations = locations.filter(loc => !loc || !loc.uri)
      // 满足 `invalidLocations.length > 0` 时，工具调用执行该分支。
      if (invalidLocations.length > 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server returned ${invalidLocations.length} location(s) with undefined URI for findReferences on ${cwd}. ` +
              `This indicates malformed data from the LSP server.`,
          ),
        )
      }

      // validLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const validLocations = locations.filter(loc => loc && loc.uri)
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatFindReferencesResult(result as Location[] | null, cwd),
        resultCount: validLocations.length,
        fileCount: countUniqueFiles(validLocations),
      }
    }
    case 'hover': {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatHoverResult(result as Hover | null, cwd),
        resultCount: result ? 1 : 0,
        fileCount: result ? 1 : 0,
      }
    }
    case 'documentSymbol': {
      // LSP allows documentSymbol to return either DocumentSymbol[] or SymbolInformation[]
      // symbols 集合保存`as`，供工具调用后续处理使用。
      const symbols = (result as (DocumentSymbol | SymbolInformation)[]) || []
      // Detect format: DocumentSymbol has 'range', SymbolInformation has 'location'
      // isDocumentSymbol 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isDocumentSymbol =
        symbols.length > 0 && symbols[0] && 'range' in symbols[0]
      // Count symbols - DocumentSymbol can have nested children, SymbolInformation is flat
      // count 数量保存`isDocumentSymbol`，供工具实现 LSPTool后续判断或输出使用。
      const count = isDocumentSymbol
        ? countSymbols(symbols as DocumentSymbol[])
        : symbols.length
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatDocumentSymbolResult(
          result as (DocumentSymbol[] | SymbolInformation[]) | null,
          cwd,
        ),
        resultCount: count,
        fileCount: symbols.length > 0 ? 1 : 0,
      }
    }
    case 'workspaceSymbol': {
      // symbols 集合标记工具实现 LSPTool是否启用对应路径。
      const symbols = (result as SymbolInformation[]) || []

      // Log and filter out symbols with undefined location.uri
      // invalidSymbols 集合筛选`symbols.filter`，供工具调用后续处理使用。
      const invalidSymbols = symbols.filter(
        // sym更新为 `> !sym || !sym.location || !sym.location.uri`，确保工具调用后续读取最新状态。
        sym => !sym || !sym.location || !sym.location.uri,
      )
      // 满足 `invalidSymbols.length > 0` 时，工具调用执行该分支。
      if (invalidSymbols.length > 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server returned ${invalidSymbols.length} symbol(s) with undefined location URI for workspaceSymbol on ${cwd}. ` +
              `This indicates malformed data from the LSP server.`,
          ),
        )
      }

      // validSymbols 集合筛选`symbols.filter`，供工具调用后续处理使用。
      const validSymbols = symbols.filter(
        // sym更新为 `> sym && sym.location && sym.location.uri`，确保工具调用后续读取最新状态。
        sym => sym && sym.location && sym.location.uri,
      )
      // locations 集合派生`validSymbols.map`，供工具调用后续处理使用。
      const locations = validSymbols.map(s => s.location)
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatWorkspaceSymbolResult(
          result as SymbolInformation[] | null,
          cwd,
        ),
        resultCount: validSymbols.length,
        fileCount: countUniqueFiles(locations),
      }
    }
    case 'goToImplementation': {
      // Handle both Location and LocationLink formats (same as goToDefinition)
      // rawResults 集合保存`Array.isArray`，供工具调用后续处理使用。
      const rawResults = Array.isArray(result)
        ? result
        : result
          ? [result as Location | LocationLink]
          : []

      // Convert LocationLinks to Locations for uniform handling
      // locations 集合派生`rawResults.map`，供工具调用后续处理使用。
      const locations = rawResults.map(toLocation)

      // Log and filter out locations with undefined uris
      // invalidLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const invalidLocations = locations.filter(loc => !loc || !loc.uri)
      // 满足 `invalidLocations.length > 0` 时，工具调用执行该分支。
      if (invalidLocations.length > 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server returned ${invalidLocations.length} location(s) with undefined URI for goToImplementation on ${cwd}. ` +
              `This indicates malformed data from the LSP server.`,
          ),
        )
      }

      // validLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
      const validLocations = locations.filter(loc => loc && loc.uri)
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        // Reuse goToDefinition formatter since the result format is identical
        formatted: formatGoToDefinitionResult(
          result as
            | Location
            | Location[]
            | LocationLink
            | LocationLink[]
            | null,
          cwd,
        ),
        resultCount: validLocations.length,
        fileCount: countUniqueFiles(validLocations),
      }
    }
    case 'prepareCallHierarchy': {
      // items 集合标记工具实现 LSPTool是否启用对应路径。
      const items = (result as CallHierarchyItem[]) || []
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatPrepareCallHierarchyResult(
          result as CallHierarchyItem[] | null,
          cwd,
        ),
        resultCount: items.length,
        fileCount: items.length > 0 ? countUniqueFilesFromCallItems(items) : 0,
      }
    }
    case 'incomingCalls': {
      // calls 集合标记工具实现 LSPTool是否启用对应路径。
      const calls = (result as CallHierarchyIncomingCall[]) || []
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatIncomingCallsResult(
          result as CallHierarchyIncomingCall[] | null,
          cwd,
        ),
        resultCount: calls.length,
        fileCount:
          calls.length > 0 ? countUniqueFilesFromIncomingCalls(calls) : 0,
      }
    }
    case 'outgoingCalls': {
      // calls 集合标记工具实现 LSPTool是否启用对应路径。
      const calls = (result as CallHierarchyOutgoingCall[]) || []
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        formatted: formatOutgoingCallsResult(
          result as CallHierarchyOutgoingCall[] | null,
          cwd,
        ),
        resultCount: calls.length,
        fileCount:
          calls.length > 0 ? countUniqueFilesFromOutgoingCalls(calls) : 0,
      }
    }
  }
}

/**
 * Counts unique files from CallHierarchyItem array
 * Filters out items with undefined URIs
 */
// countUniqueFilesFromCallItems 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUniqueFilesFromCallItems(items: CallHierarchyItem[]): number {
  // validUris 集合派生`items.map`，供工具调用后续处理使用。
  const validUris = items.map(item => item.uri).filter(uri => uri)
  // 返回 `new Set(validUris).size`，作为工具调用这次计算的结果。
  return new Set(validUris).size
}

/**
 * Counts unique files from CallHierarchyIncomingCall array
 * Filters out calls with undefined URIs
 */
// countUniqueFilesFromIncomingCalls 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUniqueFilesFromIncomingCalls(
  calls: CallHierarchyIncomingCall[],
): number {
  // validUris 集合派生`calls.map`，供工具调用后续处理使用。
  const validUris = calls.map(call => call.from?.uri).filter(uri => uri)
  // 返回 `new Set(validUris).size`，作为工具调用这次计算的结果。
  return new Set(validUris).size
}

/**
 * Counts unique files from CallHierarchyOutgoingCall array
 * Filters out calls with undefined URIs
 */
// countUniqueFilesFromOutgoingCalls 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUniqueFilesFromOutgoingCalls(
  calls: CallHierarchyOutgoingCall[],
): number {
  // validUris 集合派生`calls.map`，供工具调用后续处理使用。
  const validUris = calls.map(call => call.to?.uri).filter(uri => uri)
  // 返回 `new Set(validUris).size`，作为工具调用这次计算的结果。
  return new Set(validUris).size
}
