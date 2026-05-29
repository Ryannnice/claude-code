// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 接入 callIdeRpc 服务层能力，把外部通信或共享状态交给 ../services/mcp/client.js 处理。
import { callIdeRpc } from '../services/mcp/client.js'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准服务层 diagnostic Tracking的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'
// 复用 ClaudeError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { ClaudeError } from '../utils/errors.js'
// 复用 normalizePathForComparison、pathsEqual 工具函数，把通用处理留在 ../utils/file.js 中维护。
import { normalizePathForComparison, pathsEqual } from '../utils/file.js'
// 复用 getConnectedIdeClient 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { getConnectedIdeClient } from '../utils/ide.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'

// DiagnosticsTrackingError 聚合服务层 diagnostic Tracking相关状态与操作，把同一职责的行为收束到类实例中。
class DiagnosticsTrackingError extends ClaudeError {}

// MAX_DIAGNOSTICS_SUMMARY_CHARS 集合保存`4000`，供后续判断或组装使用。
const MAX_DIAGNOSTICS_SUMMARY_CHARS = 4000

// Diagnostic 描述服务层 diagnostic Tracking需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface Diagnostic {
  message: string
  severity: 'Error' | 'Warning' | 'Info' | 'Hint'
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  source?: string
  code?: string
}

// DiagnosticFile 描述服务层 diagnostic Tracking需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface DiagnosticFile {
  uri: string
  diagnostics: Diagnostic[]
}

// DiagnosticTrackingService 聚合服务层 diagnostic Tracking相关状态与操作，把同一职责的行为收束到类实例中。
export class DiagnosticTrackingService {
  private static instance: DiagnosticTrackingService | undefined
  private baseline: Map<string, Diagnostic[]> = new Map()

  private initialized = false
  private mcpClient: MCPServerConnection | undefined

  // Track when files were last processed/fetched
  private lastProcessedTimestamps: Map<string, number> = new Map()

  // Track which files have received right file diagnostics and if they've changed
  // Map<normalizedPath, lastClaudeFsRightDiagnostics>
  private rightFileDiagnosticsState: Map<string, Diagnostic[]> = new Map()

  // 服务层 diagnostic Tracking在这里处理 `static getInstance(): DiagnosticTrackingService {`，完成这一小步状态转换。
  static getInstance(): DiagnosticTrackingService {
    // DiagnosticTrackingService.instance缺失时提前走兜底路径，避免服务层 diagnostic Tracking继续依赖无效输入。
    if (!DiagnosticTrackingService.instance) {
      // instance更新为 `new DiagnosticTrackingService()`，确保服务层后续读取最新状态。
      DiagnosticTrackingService.instance = new DiagnosticTrackingService()
    }
    // 返回 `DiagnosticTrackingService.instance`，作为服务层 diagnostic Tracking这次计算的结果。
    return DiagnosticTrackingService.instance
  }

  // initialize 使用 mcpClient: MCPServerConnection 完成服务层 diagnostic Tracking里的对应操作。
  initialize(mcpClient: MCPServerConnection) {
    // 满足 `this.initialized` 时，服务层 diagnostic Tracking执行该分支。
    if (this.initialized) {
      // 服务层 diagnostic Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // TODO: Do not cache the connected mcpClient since it can change.
    // 更新实例字段 mcpClient 为 mcpClient，同步服务层 diagnostic Tracking的内部状态。
    this.mcpClient = mcpClient
    // 更新实例字段 initialized 为 true，同步服务层 diagnostic Tracking的内部状态。
    this.initialized = true
  }

  // shutdown 使用 无 完成服务层 diagnostic Tracking里的对应操作。
  async shutdown(): Promise<void> {
    // 更新实例字段 initialized 为 false，同步服务层 diagnostic Tracking的内部状态。
    this.initialized = false
    // 调用 this.baseline.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.baseline.clear()
    // 调用 this.rightFileDiagnosticsState.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.rightFileDiagnosticsState.clear()
    // 调用 this.lastProcessedTimestamps.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.lastProcessedTimestamps.clear()
  }

  /**
   * Reset tracking state while keeping the service initialized.
   * This clears all tracked files and diagnostics.
   */
  // reset 使用 无 完成服务层 diagnostic Tracking里的对应操作。
  reset() {
    // 调用 this.baseline.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.baseline.clear()
    // 调用 this.rightFileDiagnosticsState.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.rightFileDiagnosticsState.clear()
    // 调用 this.lastProcessedTimestamps.clear，触发服务层 diagnostic Tracking此处需要的副作用。
    this.lastProcessedTimestamps.clear()
  }

  // 服务层 diagnostic Tracking在这里处理 `private normalizeFileUri(fileUri: string): string {`，完成这一小步状态转换。
  private normalizeFileUri(fileUri: string): string {
    // Remove our protocol prefixes
    // protocolPrefixes 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const protocolPrefixes = [
      'file://',
      '_claude_fs_right:',
      '_claude_fs_left:',
    ]

    // normalized 命名 `fileUri`，让后续代码直接表达这个值的用途。
    let normalized = fileUri
    // 按顺序遍历 `protocolPrefixes` 中的prefix，逐个交给服务层 diagnostic Tracking处理。
    for (const prefix of protocolPrefixes) {
      // 满足 `fileUri.startsWith(prefix)` 时，服务层 diagnostic Tracking执行该分支。
      if (fileUri.startsWith(prefix)) {
        // normalized更新为 `fileUri.slice(prefix.length)`，确保服务层后续读取最新状态。
        normalized = fileUri.slice(prefix.length)
        // 结束这个分支或循环，避免服务层 diagnostic Tracking继续落入后续路径。
        break
      }
    }

    // Use shared utility for platform-aware path normalization
    // (handles Windows case-insensitivity and path separators)
    // 返回 `normalizePathForComparison(normalized)`，作为服务层 diagnostic Tracking这次计算的结果。
    return normalizePathForComparison(normalized)
  }

  /**
   * Ensure a file is opened in the IDE before processing.
   * This is important for language services like diagnostics to work properly.
   */
  // ensureFileOpened 使用 fileUri: string 完成服务层 diagnostic Tracking里的对应操作。
  async ensureFileOpened(fileUri: string): Promise<void> {
    // 服务层 diagnostic Tracking在这里进入条件判断，后续代码按实际状态分流。
    if (
      !this.initialized ||
      !this.mcpClient ||
      this.mcpClient.type !== 'connected'
    ) {
      // 服务层 diagnostic Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的服务层 diagnostic Tracking操作，确保异常能进入相邻错误处理。
    try {
      // Call the openFile tool to ensure the file is loaded
      // 等待 `callIdeRpc(` 完成，再继续服务层 diagnostic Tracking的异步流程。
      await callIdeRpc(
        'openFile',
        {
          filePath: fileUri,
          preview: false,
          startText: '',
          endText: '',
          selectToEndOfLine: false,
          makeFrontmost: false,
        },
        this.mcpClient,
      )
    } catch (error) {
      // 记录服务层 diagnostic Tracking运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
    }
  }

  /**
   * Capture baseline diagnostics for a specific file before editing.
   * This is called before editing a file to ensure we have a baseline to compare against.
   */
  // beforeFileEdited 使用 filePath: string 完成服务层 diagnostic Tracking里的对应操作。
  async beforeFileEdited(filePath: string): Promise<void> {
    // 服务层 diagnostic Tracking在这里进入条件判断，后续代码按实际状态分流。
    if (
      !this.initialized ||
      !this.mcpClient ||
      this.mcpClient.type !== 'connected'
    ) {
      // 服务层 diagnostic Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // timestamp记录时间`Date.now`，供服务层 diagnostic Tracking后续处理使用。
    const timestamp = Date.now()

    // 保护这一段可能失败的服务层 diagnostic Tracking操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`callIdeRpc`，供服务层 diagnostic Tracking后续处理使用。
      const result = await callIdeRpc(
        'getDiagnostics',
        { uri: `file://${filePath}` },
        this.mcpClient,
      )
      // diagnosticFile 文件数据解析`this.parseDiagnosticResult`，供服务层 diagnostic Tracking后续处理使用。
      const diagnosticFile = this.parseDiagnosticResult(result)[0]
      // 满足 `diagnosticFile` 时，服务层 diagnostic Tracking执行该分支。
      if (diagnosticFile) {
        // Compare normalized paths (handles protocol prefixes and Windows case-insensitivity)
        // 服务层 diagnostic Tracking在这里进入条件判断，后续代码按实际状态分流。
        if (
          !pathsEqual(
            this.normalizeFileUri(filePath),
            this.normalizeFileUri(diagnosticFile.uri),
          )
        ) {
          // 记录服务层 diagnostic Tracking运行诊断，方便排查异常路径或性能问题。
          logError(
            new DiagnosticsTrackingError(
              `Diagnostics file path mismatch: expected ${filePath}, got ${diagnosticFile.uri})`,
            ),
          )
          // 服务层 diagnostic Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Store with normalized path key for consistent lookups on Windows
        // normalizedPath 路径数据保存`this.normalizeFileUri`，供服务层 diagnostic Tracking后续处理使用。
        const normalizedPath = this.normalizeFileUri(filePath)
        // this.baseline.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        this.baseline.set(normalizedPath, diagnosticFile.diagnostics)
        // this.lastProcessedTimestamps.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        this.lastProcessedTimestamps.set(normalizedPath, timestamp)
      } else {
        // No diagnostic file returned, store an empty baseline
        // normalizedPath 路径数据保存`this.normalizeFileUri`，供服务层 diagnostic Tracking后续处理使用。
        const normalizedPath = this.normalizeFileUri(filePath)
        // this.baseline.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        this.baseline.set(normalizedPath, [])
        // this.lastProcessedTimestamps.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        this.lastProcessedTimestamps.set(normalizedPath, timestamp)
      }
    } catch (_error) {
      // Fail silently if IDE doesn't support diagnostics
    }
  }

  /**
   * Get new diagnostics from file://, _claude_fs_right, and _claude_fs_ URIs that aren't in the baseline.
   * Only processes diagnostics for files that have been edited.
   */
  // getNewDiagnostics不依赖额外参数，直接计算服务层 diagnostic Tracking需要的结果。
  async getNewDiagnostics(): Promise<DiagnosticFile[]> {
    // 服务层 diagnostic Tracking在这里进入条件判断，后续代码按实际状态分流。
    if (
      !this.initialized ||
      !this.mcpClient ||
      this.mcpClient.type !== 'connected'
    ) {
      // 返回列表结果，保留服务层 diagnostic Tracking已经排好的条目顺序。
      return []
    }

    // Check if we have any files with diagnostic changes
    // allDiagnosticFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    let allDiagnosticFiles: DiagnosticFile[] = []
    // 保护这一段可能失败的服务层 diagnostic Tracking操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`callIdeRpc`，供服务层 diagnostic Tracking后续处理使用。
      const result = await callIdeRpc(
        'getDiagnostics',
        {}, // Empty params fetches all diagnostics
        this.mcpClient,
      )
      // allDiagnosticFiles 文件数据更新为 `this.parseDiagnosticResult(result)`，确保服务层后续读取最新状态。
      allDiagnosticFiles = this.parseDiagnosticResult(result)
    } catch (_error) {
      // If fetching all diagnostics fails, return empty
      // 返回列表结果，保留服务层 diagnostic Tracking已经排好的条目顺序。
      return []
    }
    // diagnosticsForFileUrisWithBaselines 文件数据保存`allDiagnosticFiles`，供后续判断或组装使用。
    const diagnosticsForFileUrisWithBaselines = allDiagnosticFiles
      // 链式调用 filter，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
      .filter(file => this.baseline.has(this.normalizeFileUri(file.uri)))
      // 链式调用 filter，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
      .filter(file => file.uri.startsWith('file://'))

    // diagnosticsForClaudeFsRightUrisWithBaselinesMap构建`new Map<` 整理出中间结果，供服务层 diagnostic Tracking后续步骤使用。
    const diagnosticsForClaudeFsRightUrisWithBaselinesMap = new Map<
      string,
      DiagnosticFile
    >()
    // 服务层 diagnostic Tracking在这里处理 `allDiagnosticFiles`，完成这一小步状态转换。
    allDiagnosticFiles
      // 链式调用 filter，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
      .filter(file => this.baseline.has(this.normalizeFileUri(file.uri)))
      // 链式调用 filter，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
      .filter(file => file.uri.startsWith('_claude_fs_right:'))
      // 链式调用 forEach，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
      .forEach(file => {
        // diagnosticsForClaudeFsRightUrisWithBaselinesMap.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        diagnosticsForClaudeFsRightUrisWithBaselinesMap.set(
          this.normalizeFileUri(file.uri),
          file,
        )
      })

    // newDiagnosticFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const newDiagnosticFiles: DiagnosticFile[] = []

    // Process file:// protocol diagnostics
    // 按顺序遍历 `diagnosticsForFileUrisWithBaselines` 中的file 文件数据，逐个交给服务层 diagnostic Tracking处理。
    for (const file of diagnosticsForFileUrisWithBaselines) {
      // normalizedPath 路径数据保存`this.normalizeFileUri`，供服务层 diagnostic Tracking后续处理使用。
      const normalizedPath = this.normalizeFileUri(file.uri)
      // baselineDiagnostics 集合读取`baseline.get`，供服务层 diagnostic Tracking后续处理使用。
      const baselineDiagnostics = this.baseline.get(normalizedPath) || []

      // Get the _claude_fs_right file if it exists
      // claudeFsRightFile 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const claudeFsRightFile =
        diagnosticsForClaudeFsRightUrisWithBaselinesMap.get(normalizedPath)

      // Determine which file to use based on the state of right file diagnostics
      // fileToUse 文件数据保存`file`，供后续判断或组装使用。
      let fileToUse = file

      // 满足 `claudeFsRightFile` 时，服务层 diagnostic Tracking执行该分支。
      if (claudeFsRightFile) {
        // previousRightDiagnostics 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const previousRightDiagnostics =
          this.rightFileDiagnosticsState.get(normalizedPath)

        // Use _claude_fs_right if:
        // 1. We've never gotten right file diagnostics for this file (previousRightDiagnostics === undefined)
        // 2. OR the right file diagnostics have just changed
        // 服务层 diagnostic Tracking在这里进入条件判断，后续代码按实际状态分流。
        if (
          !previousRightDiagnostics ||
          !this.areDiagnosticArraysEqual(
            previousRightDiagnostics,
            claudeFsRightFile.diagnostics,
          )
        ) {
          // fileToUse 文件数据更新为 `claudeFsRightFile`，确保服务层后续读取最新状态。
          fileToUse = claudeFsRightFile
        }

        // Update our tracking of right file diagnostics
        // this.rightFileDiagnosticsState.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
        this.rightFileDiagnosticsState.set(
          normalizedPath,
          claudeFsRightFile.diagnostics,
        )
      }

      // Find new diagnostics that aren't in the baseline
      // newDiagnostics 集合筛选`diagnostics.filter`，供服务层 diagnostic Tracking后续处理使用。
      const newDiagnostics = fileToUse.diagnostics.filter(
        // d更新为 `> !baselineDiagnostics.some(b => this.areDiagnosticsEqual...`，确保服务层后续读取最新状态。
        d => !baselineDiagnostics.some(b => this.areDiagnosticsEqual(d, b)),
      )

      // 满足 `newDiagnostics.length > 0` 时，服务层 diagnostic Tracking执行该分支。
      if (newDiagnostics.length > 0) {
        // newDiagnosticFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
        newDiagnosticFiles.push({
          uri: file.uri,
          diagnostics: newDiagnostics,
        })
      }

      // Update baseline with current diagnostics
      // this.baseline.set 写入新的状态值，使服务层 diagnostic Tracking后续读取保持一致。
      this.baseline.set(normalizedPath, fileToUse.diagnostics)
    }

    // 返回 `newDiagnosticFiles`，作为服务层 diagnostic Tracking这次计算的结果。
    return newDiagnosticFiles
  }

  // 服务层 diagnostic Tracking在这里处理 `private parseDiagnosticResult(result: unknown): DiagnosticFile[] {`，完成这一小步状态转换。
  private parseDiagnosticResult(result: unknown): DiagnosticFile[] {
    // 满足 `Array.isArray(result)` 时，服务层 diagnostic Tracking执行该分支。
    if (Array.isArray(result)) {
      // textBlock筛选`result.find`，供服务层 diagnostic Tracking后续处理使用。
      const textBlock = result.find(block => block.type === 'text')
      // 组合条件 `textBlock && 'text' in textBlock` 成立时，服务层 diagnostic Tracking才启用这条专门路径。
      if (textBlock && 'text' in textBlock) {
        // 解析结果解析`jsonParse`，供服务层 diagnostic Tracking后续处理使用。
        const parsed = jsonParse(textBlock.text)
        // 返回 `parsed`，作为服务层 diagnostic Tracking这次计算的结果。
        return parsed
      }
    }
    // 返回列表结果，保留服务层 diagnostic Tracking已经排好的条目顺序。
    return []
  }

  // 服务层 diagnostic Tracking在这里处理 `private areDiagnosticsEqual(a: Diagnostic, b: Diagnostic): boolean {`，完成这一小步状态转换。
  private areDiagnosticsEqual(a: Diagnostic, b: Diagnostic): boolean {
    // 返回 `(`，作为服务层 diagnostic Tracking这次计算的结果。
    return (
      a.message === b.message &&
      a.severity === b.severity &&
      a.source === b.source &&
      a.code === b.code &&
      a.range.start.line === b.range.start.line &&
      a.range.start.character === b.range.start.character &&
      a.range.end.line === b.range.end.line &&
      a.range.end.character === b.range.end.character
    )
  }

  // 服务层 diagnostic Tracking在这里处理 `private areDiagnosticArraysEqual(a: Diagnostic[], b: Diagnostic[]): boo...`，完成这一小步状态转换。
  private areDiagnosticArraysEqual(a: Diagnostic[], b: Diagnostic[]): boolean {
    // `a.length` 与 `b.length` 不一致时刷新派生状态，避免使用过期结果。
    if (a.length !== b.length) return false

    // Check if every diagnostic in 'a' exists in 'b'
    // 返回 `(`，作为服务层 diagnostic Tracking这次计算的结果。
    return (
      // 调用 a.every，触发服务层 diagnostic Tracking此处需要的副作用。
      a.every(diagA =>
        // 调用 b.some，触发服务层 diagnostic Tracking此处需要的副作用。
        b.some(diagB => this.areDiagnosticsEqual(diagA, diagB)),
      ) &&
      // 调用 b.every，触发服务层 diagnostic Tracking此处需要的副作用。
      b.every(diagB => a.some(diagA => this.areDiagnosticsEqual(diagA, diagB)))
    )
  }

  /**
   * Handle the start of a new query. This method:
   * - Initializes the diagnostic tracker if not already initialized
   * - Resets the tracker if already initialized (for new query loops)
   * - Automatically finds the IDE client from the provided clients list
   *
   * @param clients Array of MCP clients that may include an IDE client
   * @param shouldQuery Whether a query is actually being made (not just a command)
   */
  // handleQueryStart 使用 clients: MCPServerConnection[] 完成服务层 diagnostic Tracking里的对应操作。
  async handleQueryStart(clients: MCPServerConnection[]): Promise<void> {
    // Only proceed if we should query and have clients
    // this.initialized缺失时提前走兜底路径，避免服务层 diagnostic Tracking继续依赖无效输入。
    if (!this.initialized) {
      // Find the connected IDE client
      // connectedIdeClient读取`getConnectedIdeClient`，供服务层 diagnostic Tracking后续处理使用。
      const connectedIdeClient = getConnectedIdeClient(clients)

      // 满足 `connectedIdeClient` 时，服务层 diagnostic Tracking执行该分支。
      if (connectedIdeClient) {
        // 调用 this.initialize，触发服务层 diagnostic Tracking此处需要的副作用。
        this.initialize(connectedIdeClient)
      }
    } else {
      // Reset diagnostic tracking for new query loops
      // 调用 this.reset，触发服务层 diagnostic Tracking此处需要的副作用。
      this.reset()
    }
  }

  /**
   * Format diagnostics into a human-readable summary string.
   * This is useful for displaying diagnostics in messages or logs.
   *
   * @param files Array of diagnostic files to format
   * @returns Formatted string representation of the diagnostics
   */
  // 服务层 diagnostic Tracking在这里处理 `static formatDiagnosticsSummary(files: DiagnosticFile[]): string {`，完成这一小步状态转换。
  static formatDiagnosticsSummary(files: DiagnosticFile[]): string {
    // truncationMarker 命名 `'…[truncated]'`，让后续代码直接表达这个值的用途。
    const truncationMarker = '…[truncated]'
    // 结果 命名 `files`，让后续代码直接表达这个值的用途。
    const result = files
      .map(file => {
        // filename 文件数据格式化`uri.split`，供服务层 diagnostic Tracking后续处理使用。
        const filename = file.uri.split('/').pop() || file.uri
        // diagnostics 集合 命名 `file.diagnostics`，让后续代码直接表达这个值的用途。
        const diagnostics = file.diagnostics
          // 链式调用 map，继续加工上一行在服务层 diagnostic Tracking中产生的数据。
          .map(d => {
            // severitySymbol读取`DiagnosticTrackingService.getSeveritySymbol`，供服务层 diagnostic Tracking后续处理使用。
            const severitySymbol = DiagnosticTrackingService.getSeveritySymbol(
              d.severity,
            )

            // 返回 `` ${severitySymbol} [Line ${d.range.start.line + 1}:${d.range.start.cha...`，作为服务层 diagnostic Tracking这次计算的结果。
            return `  ${severitySymbol} [Line ${d.range.start.line + 1}:${d.range.start.character + 1}] ${d.message}${d.code ? ` [${d.code}]` : ''}${d.source ? ` (${d.source})` : ''}`
          })
          .join('\n')

        // 返回 ``${filename}:\n${diagnostics}``，作为服务层 diagnostic Tracking这次计算的结果。
        return `${filename}:\n${diagnostics}`
      })
      .join('\n\n')

    // 满足 `result.length > MAX_DIAGNOSTICS_SUMMARY_CHARS` 时，服务层 diagnostic Tracking执行该分支。
    if (result.length > MAX_DIAGNOSTICS_SUMMARY_CHARS) {
      // 返回 `(`，作为服务层 diagnostic Tracking这次计算的结果。
      return (
        result.slice(
          0,
          MAX_DIAGNOSTICS_SUMMARY_CHARS - truncationMarker.length,
        ) + truncationMarker
      )
    }
    // 返回 `result`，作为服务层 diagnostic Tracking这次计算的结果。
    return result
  }

  /**
   * Get the severity symbol for a diagnostic
   */
  // 服务层 diagnostic Tracking在这里处理 `static getSeveritySymbol(severity: Diagnostic['severity']): string {`，完成这一小步状态转换。
  static getSeveritySymbol(severity: Diagnostic['severity']): string {
    // 返回 `(`，作为服务层 diagnostic Tracking这次计算的结果。
    return (
      {
        Error: figures.cross,
        Warning: figures.warning,
        Info: figures.info,
        Hint: figures.star,
      }[severity] || figures.bullet
    )
  }
}

// diagnosticTracker读取`DiagnosticTrackingService.getInstance`，供服务层 diagnostic Tracking后续处理使用。
export const diagnosticTracker = DiagnosticTrackingService.getInstance()
