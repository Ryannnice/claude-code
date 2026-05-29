// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 LRUCache，将 lru-cache 中已经封装好的能力接到本文件流程里。
import { LRUCache } from 'lru-cache'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 类型依赖 { DiagnosticFile } 来自 ../diagnosticTracking.js，用于校准服务层 LSPDiagnostic Registry的数据契约。
import type { DiagnosticFile } from '../diagnosticTracking.js'

/**
 * Pending LSP diagnostic notification
 */
// PendingLSPDiagnostic 固化服务层 LSPDiagnostic Registry里传递的数据形状，帮助调用方按同一结构读写字段。
export type PendingLSPDiagnostic = {
  /** Server that sent the diagnostic */
  serverName: string
  /** Diagnostic files */
  files: DiagnosticFile[]
  /** When diagnostic was received */
  timestamp: number
  /** Whether attachment was already sent to conversation */
  attachmentSent: boolean
}

/**
 * LSP Diagnostic Registry
 *
 * Stores LSP diagnostics received asynchronously from LSP servers via
 * textDocument/publishDiagnostics notifications. Follows the same pattern
 * as AsyncHookRegistry for consistent async attachment delivery.
 *
 * Pattern:
 * 1. LSP server sends publishDiagnostics notification
 * 2. registerPendingLSPDiagnostic() stores diagnostic
 * 3. checkForLSPDiagnostics() retrieves pending diagnostics
 * 4. getLSPDiagnosticAttachments() converts to Attachment[]
 * 5. getAttachments() delivers to conversation automatically
 *
 * Similar to AsyncHookRegistry but simpler since diagnostics arrive
 * synchronously (no need to accumulate output over time).
 */

// Volume limiting constants
// MAX_DIAGNOSTICS_PER_FILE 文件数据 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_DIAGNOSTICS_PER_FILE = 10
// MAX_TOTAL_DIAGNOSTICS 集合保存`30`，供后续判断或组装使用。
const MAX_TOTAL_DIAGNOSTICS = 30

// Max files to track for deduplication - prevents unbounded memory growth
// MAX_DELIVERED_FILES 文件数据保存`500`，供服务层 LSPDiagnostic Registry后续判断或输出使用。
const MAX_DELIVERED_FILES = 500

// Global registry state
// pendingDiagnostics 集合构建`new Map<string, PendingLSPDiagnostic>()`，供后续判断或组装使用。
const pendingDiagnostics = new Map<string, PendingLSPDiagnostic>()

// Cross-turn deduplication: tracks diagnostics that have been delivered
// Maps file URI to a set of diagnostic keys (hash of message+severity+range)
// Using LRUCache to prevent unbounded growth in long sessions
// deliveredDiagnostics 集合构建`new LRUCache<string, Set<string>>({`，供后续判断或组装使用。
const deliveredDiagnostics = new LRUCache<string, Set<string>>({
  max: MAX_DELIVERED_FILES,
})

/**
 * Register LSP diagnostics received from a server.
 * These will be delivered as attachments in the next query.
 *
 * @param serverName - Name of LSP server that sent diagnostics
 * @param files - Diagnostic files to deliver
 */
// registerPendingLSPDiagnostic 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerPendingLSPDiagnostic({
  serverName,
  files,
}: {
  serverName: string
  files: DiagnosticFile[]
}): void {
  // Use UUID for guaranteed uniqueness (handles rapid registrations)
  // diagnosticId保存`randomUUID`，供服务层 LSPDiagnostic Registry后续处理使用。
  const diagnosticId = randomUUID()

  // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `LSP Diagnostics: Registering ${files.length} diagnostic file(s) from ${serverName} (ID: ${diagnosticId})`,
  )

  // pendingDiagnostics.set 写入新的状态值，使服务层 LSPDiagnostic Registry后续读取保持一致。
  pendingDiagnostics.set(diagnosticId, {
    serverName,
    files,
    timestamp: Date.now(),
    attachmentSent: false,
  })
}

/**
 * Maps severity string to numeric value for sorting.
 * Error=1, Warning=2, Info=3, Hint=4
 */
// severityToNumber 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function severityToNumber(severity: string | undefined): number {
  // 按照 severity 的取值选择服务层 LSPDiagnostic Registry的具体处理分支。
  switch (severity) {
    case 'Error':
      // 返回 `1`，作为服务层 LSPDiagnostic Registry这次计算的结果。
      return 1
    case 'Warning':
      // 返回 `2`，作为服务层 LSPDiagnostic Registry这次计算的结果。
      return 2
    case 'Info':
      // 返回 `3`，作为服务层 LSPDiagnostic Registry这次计算的结果。
      return 3
    case 'Hint':
      // 返回 `4`，作为服务层 LSPDiagnostic Registry这次计算的结果。
      return 4
    default:
      // 返回 `4`，作为服务层 LSPDiagnostic Registry这次计算的结果。
      return 4
  }
}

/**
 * Creates a unique key for a diagnostic based on its content.
 * Used for both within-batch and cross-turn deduplication.
 */
// createDiagnosticKey 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createDiagnosticKey(diag: {
  message: string
  severity?: string
  range?: unknown
  source?: string
  code?: unknown
}): string {
  // 返回 `jsonStringify({`，作为服务层 LSPDiagnostic Registry这次计算的结果。
  return jsonStringify({
    message: diag.message,
    severity: diag.severity,
    range: diag.range,
    source: diag.source || null,
    code: diag.code || null,
  })
}

/**
 * Deduplicates diagnostics by file URI and diagnostic content.
 * Also filters out diagnostics that were already delivered in previous turns.
 * Two diagnostics are considered duplicates if they have the same:
 * - File URI
 * - Range (start/end line and character)
 * - Message
 * - Severity
 * - Source and code (if present)
 */
// deduplicateDiagnosticFiles 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function deduplicateDiagnosticFiles(
  allFiles: DiagnosticFile[],
): DiagnosticFile[] {
  // Group diagnostics by file URI
  // fileMap 文件数据构建`new Map<string, Set<string>>()`，供后续判断或组装使用。
  const fileMap = new Map<string, Set<string>>()
  // dedupedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const dedupedFiles: DiagnosticFile[] = []

  // 按顺序遍历 `allFiles` 中的file 文件数据，逐个交给服务层 LSPDiagnostic Registry处理。
  for (const file of allFiles) {
    // 满足 `!fileMap.has(file.uri)` 时，服务层 LSPDiagnostic Registry执行该分支。
    if (!fileMap.has(file.uri)) {
      // fileMap.set 写入新的状态值，使服务层 LSPDiagnostic Registry后续读取保持一致。
      fileMap.set(file.uri, new Set())
      // dedupedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      dedupedFiles.push({ uri: file.uri, diagnostics: [] })
    }

    // seenDiagnostics 集合读取`fileMap.get`，供服务层 LSPDiagnostic Registry后续处理使用。
    const seenDiagnostics = fileMap.get(file.uri)!
    // dedupedFile 文件数据筛选`dedupedFiles.find`，供服务层 LSPDiagnostic Registry后续处理使用。
    const dedupedFile = dedupedFiles.find(f => f.uri === file.uri)!

    // Get previously delivered diagnostics for this file (for cross-turn dedup)
    // previouslyDelivered读取`deliveredDiagnostics.get`，供服务层 LSPDiagnostic Registry后续处理使用。
    const previouslyDelivered = deliveredDiagnostics.get(file.uri) || new Set()

    // 按顺序遍历 `file.diagnostics` 中的diag，逐个交给服务层 LSPDiagnostic Registry处理。
    for (const diag of file.diagnostics) {
      // 保护这一段可能失败的服务层 LSPDiagnostic Registry操作，确保异常能进入相邻错误处理。
      try {
        // key构建`createDiagnosticKey`，供服务层 LSPDiagnostic Registry后续处理使用。
        const key = createDiagnosticKey(diag)

        // Skip if already seen in this batch OR already delivered in previous turns
        // 组合条件 `seenDiagnostics.has(key) || previouslyDelivered.has(key)` 成立时，服务层 LSPDiagnostic Registry才启用这条专门路径。
        if (seenDiagnostics.has(key) || previouslyDelivered.has(key)) {
          // 跳过当前项，继续处理服务层 LSPDiagnostic Registry中的下一轮循环。
          continue
        }

        // 调用 seenDiagnostics.add，触发服务层 LSPDiagnostic Registry此处需要的副作用。
        seenDiagnostics.add(key)
        // diagnostics 集合追加新条目，保持收集顺序与输入顺序一致。
        dedupedFile.diagnostics.push(diag)
      } catch (error: unknown) {
        // err保存`toError`，供服务层 LSPDiagnostic Registry后续处理使用。
        const err = toError(error)
        // truncatedMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const truncatedMessage =
          diag.message?.substring(0, 100) || '<no message>'
        // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Failed to deduplicate diagnostic in ${file.uri}: ${err.message}. ` +
              `Diagnostic message: ${truncatedMessage}`,
          ),
        )
        // Include the diagnostic anyway to avoid losing information
        // diagnostics 集合追加新条目，保持收集顺序与输入顺序一致。
        dedupedFile.diagnostics.push(diag)
      }
    }
  }

  // Filter out files with no diagnostics after deduplication
  // 返回 `dedupedFiles.filter(f => f.diagnostics.length > 0)`，作为服务层 LSPDiagnostic Registry这次计算的结果。
  return dedupedFiles.filter(f => f.diagnostics.length > 0)
}

/**
 * Get all pending LSP diagnostics that haven't been delivered yet.
 * Deduplicates diagnostics to prevent sending the same diagnostic multiple times.
 * Marks diagnostics as sent to prevent duplicate delivery.
 *
 * @returns Array of pending diagnostics ready for delivery (deduplicated)
 */
// checkForLSPDiagnostics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkForLSPDiagnostics(): Array<{
  serverName: string
  files: DiagnosticFile[]
}> {
  // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `LSP Diagnostics: Checking registry - ${pendingDiagnostics.size} pending`,
  )

  // Collect all diagnostic files from all pending notifications
  // allFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allFiles: DiagnosticFile[] = []
  // serverNames 集合构建`new Set<string>()` 整理出中间结果，供服务层 LSPDiagnostic Registry后续步骤使用。
  const serverNames = new Set<string>()
  // diagnosticsToMark 从空数组开始收集，后续循环会按处理顺序追加条目。
  const diagnosticsToMark: PendingLSPDiagnostic[] = []

  // 逐项读取 `pendingDiagnostics.values()` 中的diagnostic，按输入顺序推进服务层 LSPDiagnostic Registry。
  for (const diagnostic of pendingDiagnostics.values()) {
    // diagnostic.attachmentSent缺失时提前走兜底路径，避免服务层 LSPDiagnostic Registry继续依赖无效输入。
    if (!diagnostic.attachmentSent) {
      // allFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      allFiles.push(...diagnostic.files)
      // 调用 serverNames.add，触发服务层 LSPDiagnostic Registry此处需要的副作用。
      serverNames.add(diagnostic.serverName)
      // diagnosticsToMark追加新条目，保持收集顺序与输入顺序一致。
      diagnosticsToMark.push(diagnostic)
    }
  }

  // allFiles 文件数据为空时立即返回或跳过，避免服务层 LSPDiagnostic Registry把空集合当成可处理内容。
  if (allFiles.length === 0) {
    // 返回列表结果，保留服务层 LSPDiagnostic Registry已经排好的条目顺序。
    return []
  }

  // Deduplicate diagnostics across all files
  // dedupedFiles 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let dedupedFiles: DiagnosticFile[]
  // 保护这一段可能失败的服务层 LSPDiagnostic Registry操作，确保异常能进入相邻错误处理。
  try {
    // dedupedFiles 文件数据更新为 `deduplicateDiagnosticFiles(allFiles)`，确保服务层后续读取最新状态。
    dedupedFiles = deduplicateDiagnosticFiles(allFiles)
  } catch (error: unknown) {
    // err保存`toError`，供服务层 LSPDiagnostic Registry后续处理使用。
    const err = toError(error)
    // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to deduplicate LSP diagnostics: ${err.message}`))
    // Fall back to undedup'd files to avoid losing diagnostics
    // dedupedFiles 文件数据更新为 `allFiles`，确保服务层后续读取最新状态。
    dedupedFiles = allFiles
  }

  // Only mark as sent AFTER successful deduplication, then delete from map.
  // Entries are tracked in deliveredDiagnostics LRU for dedup, so we don't
  // need to keep them in pendingDiagnostics after delivery.
  // 按顺序遍历 `diagnosticsToMark` 中的diagnostic，逐个交给服务层 LSPDiagnostic Registry处理。
  for (const diagnostic of diagnosticsToMark) {
    // attachmentSent更新为 `true`，确保服务层后续读取最新状态。
    diagnostic.attachmentSent = true
  }
  // 循环处理 `const [id, diagnostic] of pendingDiagnostics`，让服务层 LSPDiagnostic Registry逐项把同类条目按顺序走完。
  for (const [id, diagnostic] of pendingDiagnostics) {
    // 满足 `diagnostic.attachmentSent` 时，服务层 LSPDiagnostic Registry执行该分支。
    if (diagnostic.attachmentSent) {
      // 调用 pendingDiagnostics.delete，触发服务层 LSPDiagnostic Registry此处需要的副作用。
      pendingDiagnostics.delete(id)
    }
  }

  // originalCount 数量派生`allFiles.reduce`，供服务层 LSPDiagnostic Registry后续处理使用。
  const originalCount = allFiles.reduce(
    // 这个回调绑定到 (sum, f) => sum + f.diagnostics.length,，负责服务层 LSPDiagnostic Registry在该局部场景下的响应。
    (sum, f) => sum + f.diagnostics.length,
    0,
  )
  // dedupedCount 数量派生`dedupedFiles.reduce`，供服务层 LSPDiagnostic Registry后续处理使用。
  const dedupedCount = dedupedFiles.reduce(
    // 这个回调绑定到 (sum, f) => sum + f.diagnostics.length,，负责服务层 LSPDiagnostic Registry在该局部场景下的响应。
    (sum, f) => sum + f.diagnostics.length,
    0,
  )

  // 满足 `originalCount > dedupedCount` 时，服务层 LSPDiagnostic Registry执行该分支。
  if (originalCount > dedupedCount) {
    // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: Deduplication removed ${originalCount - dedupedCount} duplicate diagnostic(s)`,
    )
  }

  // Apply volume limiting: cap per file and total
  // totalDiagnostics 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let totalDiagnostics = 0
  // truncatedCount 数量保存`0`，供后续判断或组装使用。
  let truncatedCount = 0
  // 按顺序遍历 `dedupedFiles` 中的file 文件数据，逐个交给服务层 LSPDiagnostic Registry处理。
  for (const file of dedupedFiles) {
    // Sort by severity (Error=1 < Warning=2 < Info=3 < Hint=4) to prioritize errors
    // 调用 file.diagnostics.sort，触发服务层 LSPDiagnostic Registry此处需要的副作用。
    file.diagnostics.sort(
      // 这个回调绑定到 (a, b) => severityToNumber(a.severity) - severityToNumber(b.severity),，负责服务层 LSPDiagnostic Registry在该局部场景下的响应。
      (a, b) => severityToNumber(a.severity) - severityToNumber(b.severity),
    )

    // Cap per file
    // 满足 `file.diagnostics.length > MAX_DIAGNOSTICS_PER_FILE` 时，服务层 LSPDiagnostic Registry执行该分支。
    if (file.diagnostics.length > MAX_DIAGNOSTICS_PER_FILE) {
      // 服务层 LSPDiagnostic Registry在这里处理 `truncatedCount += file.diagnostics.length - MAX_DIAGNOSTICS_PER_FILE`，完成这一小步状态转换。
      truncatedCount += file.diagnostics.length - MAX_DIAGNOSTICS_PER_FILE
      // diagnostics 集合更新为 `file.diagnostics.slice(0, MAX_DIAGNOSTICS_PER_FILE)`，确保服务层后续读取最新状态。
      file.diagnostics = file.diagnostics.slice(0, MAX_DIAGNOSTICS_PER_FILE)
    }

    // Cap total
    // remainingCapacity 命名 `MAX_TOTAL_DIAGNOSTICS - totalDiagnostics`，让后续代码直接表达这个值的用途。
    const remainingCapacity = MAX_TOTAL_DIAGNOSTICS - totalDiagnostics
    // 满足 `file.diagnostics.length > remainingCapacity` 时，服务层 LSPDiagnostic Registry执行该分支。
    if (file.diagnostics.length > remainingCapacity) {
      // 服务层 LSPDiagnostic Registry在这里处理 `truncatedCount += file.diagnostics.length - remainingCapacity`，完成这一小步状态转换。
      truncatedCount += file.diagnostics.length - remainingCapacity
      // diagnostics 集合更新为 `file.diagnostics.slice(0, remainingCapacity)`，确保服务层后续读取最新状态。
      file.diagnostics = file.diagnostics.slice(0, remainingCapacity)
    }

    // 服务层 LSPDiagnostic Registry在这里处理 `totalDiagnostics += file.diagnostics.length`，完成这一小步状态转换。
    totalDiagnostics += file.diagnostics.length
  }

  // Filter out files that ended up with no diagnostics after limiting
  // dedupedFiles 文件数据更新为 `dedupedFiles.filter(f => f.diagnostics.length > 0)`，确保服务层后续读取最新状态。
  dedupedFiles = dedupedFiles.filter(f => f.diagnostics.length > 0)

  // 满足 `truncatedCount > 0` 时，服务层 LSPDiagnostic Registry执行该分支。
  if (truncatedCount > 0) {
    // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: Volume limiting removed ${truncatedCount} diagnostic(s) (max ${MAX_DIAGNOSTICS_PER_FILE}/file, ${MAX_TOTAL_DIAGNOSTICS} total)`,
    )
  }

  // Track delivered diagnostics for cross-turn deduplication
  // 按顺序遍历 `dedupedFiles` 中的file 文件数据，逐个交给服务层 LSPDiagnostic Registry处理。
  for (const file of dedupedFiles) {
    // 满足 `!deliveredDiagnostics.has(file.uri)` 时，服务层 LSPDiagnostic Registry执行该分支。
    if (!deliveredDiagnostics.has(file.uri)) {
      // deliveredDiagnostics.set 写入新的状态值，使服务层 LSPDiagnostic Registry后续读取保持一致。
      deliveredDiagnostics.set(file.uri, new Set())
    }
    // delivered读取`deliveredDiagnostics.get`，供服务层 LSPDiagnostic Registry后续处理使用。
    const delivered = deliveredDiagnostics.get(file.uri)!
    // 按顺序遍历 `file.diagnostics` 中的diag，逐个交给服务层 LSPDiagnostic Registry处理。
    for (const diag of file.diagnostics) {
      // 保护这一段可能失败的服务层 LSPDiagnostic Registry操作，确保异常能进入相邻错误处理。
      try {
        // 调用 delivered.add，触发服务层 LSPDiagnostic Registry此处需要的副作用。
        delivered.add(createDiagnosticKey(diag))
      } catch (error: unknown) {
        // Log but continue - failure to track shouldn't prevent delivery
        // err保存`toError`，供服务层 LSPDiagnostic Registry后续处理使用。
        const err = toError(error)
        // truncatedMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const truncatedMessage =
          diag.message?.substring(0, 100) || '<no message>'
        // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Failed to track delivered diagnostic in ${file.uri}: ${err.message}. ` +
              `Diagnostic message: ${truncatedMessage}`,
          ),
        )
      }
    }
  }

  // finalCount 数量派生`dedupedFiles.reduce`，供服务层 LSPDiagnostic Registry后续处理使用。
  const finalCount = dedupedFiles.reduce(
    // 这个回调绑定到 (sum, f) => sum + f.diagnostics.length,，负责服务层 LSPDiagnostic Registry在该局部场景下的响应。
    (sum, f) => sum + f.diagnostics.length,
    0,
  )

  // Return empty if no diagnostics to deliver (all filtered by deduplication)
  // 满足 `finalCount === 0` 时，服务层 LSPDiagnostic Registry执行该分支。
  if (finalCount === 0) {
    // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: No new diagnostics to deliver (all filtered by deduplication)`,
    )
    // 返回列表结果，保留服务层 LSPDiagnostic Registry已经排好的条目顺序。
    return []
  }

  // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `LSP Diagnostics: Delivering ${dedupedFiles.length} file(s) with ${finalCount} diagnostic(s) from ${serverNames.size} server(s)`,
  )

  // Return single result with all deduplicated diagnostics
  // 返回列表结果，保留服务层 LSPDiagnostic Registry已经排好的条目顺序。
  return [
    {
      serverName: Array.from(serverNames).join(', '),
      files: dedupedFiles,
    },
  ]
}

/**
 * Clear all pending diagnostics.
 * Used during cleanup/shutdown or for testing.
 * Note: Does NOT clear deliveredDiagnostics - that's for cross-turn deduplication
 * and should only be cleared when files are edited or on session reset.
 */
// clearAllLSPDiagnostics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllLSPDiagnostics(): void {
  // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `LSP Diagnostics: Clearing ${pendingDiagnostics.size} pending diagnostic(s)`,
  )
  // 调用 pendingDiagnostics.clear，触发服务层 LSPDiagnostic Registry此处需要的副作用。
  pendingDiagnostics.clear()
}

/**
 * Reset all diagnostic state including cross-turn tracking.
 * Used on session reset or for testing.
 */
// resetAllLSPDiagnosticState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetAllLSPDiagnosticState(): void {
  // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `LSP Diagnostics: Resetting all state (${pendingDiagnostics.size} pending, ${deliveredDiagnostics.size} files tracked)`,
  )
  // 调用 pendingDiagnostics.clear，触发服务层 LSPDiagnostic Registry此处需要的副作用。
  pendingDiagnostics.clear()
  // 调用 deliveredDiagnostics.clear，触发服务层 LSPDiagnostic Registry此处需要的副作用。
  deliveredDiagnostics.clear()
}

/**
 * Clear delivered diagnostics for a specific file.
 * Should be called when a file is edited so that new diagnostics for that file
 * will be shown even if they match previously delivered ones.
 *
 * @param fileUri - URI of the file that was edited
 */
// clearDeliveredDiagnosticsForFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearDeliveredDiagnosticsForFile(fileUri: string): void {
  // 满足 `deliveredDiagnostics.has(fileUri)` 时，服务层 LSPDiagnostic Registry执行该分支。
  if (deliveredDiagnostics.has(fileUri)) {
    // 记录服务层 LSPDiagnostic Registry运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: Clearing delivered diagnostics for ${fileUri}`,
    )
    // 调用 deliveredDiagnostics.delete，触发服务层 LSPDiagnostic Registry此处需要的副作用。
    deliveredDiagnostics.delete(fileUri)
  }
}

/**
 * Get count of pending diagnostics (for monitoring)
 */
// getPendingLSPDiagnosticCount 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingLSPDiagnosticCount(): number {
  // 返回 `pendingDiagnostics.size`，作为服务层 LSPDiagnostic Registry这次计算的结果。
  return pendingDiagnostics.size
}
