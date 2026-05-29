// 引入 fileURLToPath，将 url 中已经封装好的能力接到本文件流程里。
import { fileURLToPath } from 'url'
// 类型依赖 { PublishDiagnosticsParams } 来自 vscode-languageserver-protocol，用于校准服务层 passive Feedback的数据契约。
import type { PublishDiagnosticsParams } from 'vscode-languageserver-protocol'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 类型依赖 { DiagnosticFile } 来自 ../diagnosticTracking.js，用于校准服务层 passive Feedback的数据契约。
import type { DiagnosticFile } from '../diagnosticTracking.js'
// 引入 registerPendingLSPDiagnostic，将 ./LSPDiagnosticRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerPendingLSPDiagnostic } from './LSPDiagnosticRegistry.js'
// 类型依赖 { LSPServerManager } 来自 ./LSPServerManager.js，用于校准服务层 passive Feedback的数据契约。
import type { LSPServerManager } from './LSPServerManager.js'

/**
 * Map LSP severity to Claude diagnostic severity
 *
 * Maps LSP severity numbers to Claude diagnostic severity strings.
 * Accepts numeric severity values (1=Error, 2=Warning, 3=Information, 4=Hint)
 * or undefined, defaulting to 'Error' for invalid/missing values.
 */
// mapLSPSeverity 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapLSPSeverity(
  lspSeverity: number | undefined,
): 'Error' | 'Warning' | 'Info' | 'Hint' {
  // LSP DiagnosticSeverity enum:
  // 1 = Error, 2 = Warning, 3 = Information, 4 = Hint
  // 按照 lspSeverity 的取值选择服务层 passive Feedback的具体处理分支。
  switch (lspSeverity) {
    case 1:
      // 返回 `'Error'`，作为服务层 passive Feedback这次计算的结果。
      return 'Error'
    case 2:
      // 返回 `'Warning'`，作为服务层 passive Feedback这次计算的结果。
      return 'Warning'
    case 3:
      // 返回 `'Info'`，作为服务层 passive Feedback这次计算的结果。
      return 'Info'
    case 4:
      // 返回 `'Hint'`，作为服务层 passive Feedback这次计算的结果。
      return 'Hint'
    default:
      // 返回 `'Error'`，作为服务层 passive Feedback这次计算的结果。
      return 'Error'
  }
}

/**
 * Convert LSP diagnostics to Claude diagnostic format
 *
 * Converts LSP PublishDiagnosticsParams to DiagnosticFile[] format
 * used by Claude's attachment system.
 */
// formatDiagnosticsForAttachment 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDiagnosticsForAttachment(
  params: PublishDiagnosticsParams,
): DiagnosticFile[] {
  // Parse URI (may be file:// or plain path) and normalize to file system path
  // uri 先占位，稍后的条件分支会根据实际输入补齐它。
  let uri: string
  // 保护这一段可能失败的服务层 passive Feedback操作，确保异常能进入相邻错误处理。
  try {
    // Handle both file:// URIs and plain paths
    // uri更新为 `params.uri.startsWith('file://')`，确保服务层后续读取最新状态。
    uri = params.uri.startsWith('file://')
      ? fileURLToPath(params.uri)
      : params.uri
  } catch (error) {
    // err保存`toError`，供服务层 passive Feedback后续处理使用。
    const err = toError(error)
    // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to convert URI to file path: ${params.uri}. Error: ${err.message}. Using original URI as fallback.`,
    )
    // Gracefully fallback to original URI - LSP servers may send malformed URIs
    // uri更新为 `params.uri`，确保服务层后续读取最新状态。
    uri = params.uri
  }

  // diagnostics 集合派生`diagnostics.map`，供服务层 passive Feedback后续处理使用。
  const diagnostics = params.diagnostics.map(
    // 服务层 passive Feedback在这里处理 `(diag: {`，完成这一小步状态转换。
    (diag: {
      message: string
      severity?: number
      range: {
        start: { line: number; character: number }
        end: { line: number; character: number }
      }
      source?: string
      code?: string | number
    }) => ({
      message: diag.message,
      severity: mapLSPSeverity(diag.severity),
      range: {
        start: {
          line: diag.range.start.line,
          character: diag.range.start.character,
        },
        end: {
          line: diag.range.end.line,
          character: diag.range.end.character,
        },
      },
      source: diag.source,
      code:
        diag.code !== undefined && diag.code !== null
          ? String(diag.code)
          : undefined,
    }),
  )

  // 返回列表结果，保留服务层 passive Feedback已经排好的条目顺序。
  return [
    {
      uri,
      diagnostics,
    },
  ]
}

/**
 * Handler registration result with tracking data
 */
// HandlerRegistrationResult 固化服务层 passive Feedback里传递的数据形状，帮助调用方按同一结构读写字段。
export type HandlerRegistrationResult = {
  /** Total number of servers */
  totalServers: number
  /** Number of successful registrations */
  successCount: number
  /** Registration errors per server */
  registrationErrors: Array<{ serverName: string; error: string }>
  /** Runtime failure tracking (shared across all handler invocations) */
  diagnosticFailures: Map<string, { count: number; lastError: string }>
}

/**
 * Register LSP notification handlers on all servers
 *
 * Sets up handlers to listen for textDocument/publishDiagnostics notifications
 * from all LSP servers and routes them to Claude's diagnostic system.
 * Uses public getAllServers() API for clean access to server instances.
 *
 * @returns Tracking data for registration status and runtime failures
 */
// registerLSPNotificationHandlers 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerLSPNotificationHandlers(
  manager: LSPServerManager,
): HandlerRegistrationResult {
  // Register handlers on all configured servers to capture diagnostics from any language
  // servers 集合读取`manager.getAllServers`，供服务层 passive Feedback后续处理使用。
  const servers = manager.getAllServers()

  // Track partial failures - allow successful server registrations even if some fail
  // registrationErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const registrationErrors: Array<{ serverName: string; error: string }> = []
  // successCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let successCount = 0

  // Track consecutive failures per server to warn users after 3+ failures
  // diagnosticFailures 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const diagnosticFailures: Map<string, { count: number; lastError: string }> =
    new Map()

  // 循环处理 `const [serverName, serverInstance] of servers.entries()`，让服务层 passive Feedback把同类条目按顺序走完。
  for (const [serverName, serverInstance] of servers.entries()) {
    // 保护这一段可能失败的服务层 passive Feedback操作，确保异常能进入相邻错误处理。
    try {
      // Validate server instance has onNotification method
      // 服务层 passive Feedback在这里进入条件判断，后续代码按实际状态分流。
      if (
        !serverInstance ||
        typeof serverInstance.onNotification !== 'function'
      ) {
        // errorMsg 错误信息标记服务层 passive Feedback是否启用对应路径。
        const errorMsg = !serverInstance
          ? 'Server instance is null/undefined'
          : 'Server instance has no onNotification method'

        // registrationErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
        registrationErrors.push({ serverName, error: errorMsg })

        // err保存`Error`，供服务层 passive Feedback后续处理使用。
        const err = new Error(`${errorMsg} for ${serverName}`)
        // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
        logError(err)
        // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping handler registration for ${serverName}: ${errorMsg}`,
        )
        // 跳过当前项，继续处理服务层 passive Feedback中的下一轮循环。
        continue // Skip this server but track the failure
      }

      // Errors are isolated to avoid breaking other servers
      // 调用 serverInstance.onNotification，触发服务层 passive Feedback此处需要的副作用。
      serverInstance.onNotification(
        'textDocument/publishDiagnostics',
        // 这个回调绑定到 (params: unknown) => {，负责服务层 passive Feedback在该局部场景下的响应。
        (params: unknown) => {
          // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[PASSIVE DIAGNOSTICS] Handler invoked for ${serverName}! Params type: ${typeof params}`,
          )
          // 保护这一段可能失败的服务层 passive Feedback操作，确保异常能进入相邻错误处理。
          try {
            // Validate params structure before casting
            // 服务层 passive Feedback在这里进入条件判断，后续代码按实际状态分流。
            if (
              !params ||
              typeof params !== 'object' ||
              !('uri' in params) ||
              !('diagnostics' in params)
            ) {
              // err保存`Error`，供服务层 passive Feedback后续处理使用。
              const err = new Error(
                `LSP server ${serverName} sent invalid diagnostic params (missing uri or diagnostics)`,
              )
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logError(err)
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Invalid diagnostic params from ${serverName}: ${jsonStringify(params)}`,
              )
              // 服务层 passive Feedback在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // diagnosticParams 集合保存`params as PublishDiagnosticsParams`，供后续判断或组装使用。
            const diagnosticParams = params as PublishDiagnosticsParams
            // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Received diagnostics from ${serverName}: ${diagnosticParams.diagnostics.length} diagnostic(s) for ${diagnosticParams.uri}`,
            )

            // Convert LSP diagnostics to Claude format (can throw on invalid URIs)
            // diagnosticFiles 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const diagnosticFiles =
              formatDiagnosticsForAttachment(diagnosticParams)

            // Only send notification if there are diagnostics
            // firstFile 文件数据保存`diagnosticFiles[0]`，供服务层 passive Feedback后续判断或输出使用。
            const firstFile = diagnosticFiles[0]
            // 服务层 passive Feedback在这里进入条件判断，后续代码按实际状态分流。
            if (
              !firstFile ||
              diagnosticFiles.length === 0 ||
              firstFile.diagnostics.length === 0
            ) {
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Skipping empty diagnostics from ${serverName} for ${diagnosticParams.uri}`,
              )
              // 服务层 passive Feedback在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // Register diagnostics for async delivery via attachment system
            // Follows same pattern as AsyncHookRegistry for consistent async attachment delivery
            // 保护这一段可能失败的服务层 passive Feedback操作，确保异常能进入相邻错误处理。
            try {
              // 调用 registerPendingLSPDiagnostic，触发服务层 passive Feedback此处需要的副作用。
              registerPendingLSPDiagnostic({
                serverName,
                files: diagnosticFiles,
              })

              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `LSP Diagnostics: Registered ${diagnosticFiles.length} diagnostic file(s) from ${serverName} for async delivery`,
              )

              // Success - reset failure counter for this server
              // 调用 diagnosticFailures.delete，触发服务层 passive Feedback此处需要的副作用。
              diagnosticFailures.delete(serverName)
            } catch (error) {
              // err保存`toError`，供服务层 passive Feedback后续处理使用。
              const err = toError(error)
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logError(err)
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Error registering LSP diagnostics from ${serverName}: ` +
                  `URI: ${diagnosticParams.uri}, ` +
                  `Diagnostic count: ${firstFile.diagnostics.length}, ` +
                  `Error: ${err.message}`,
              )

              // Track consecutive failures and warn after 3+
              // failures 集合读取`diagnosticFailures.get`，供服务层 passive Feedback后续处理使用。
              const failures = diagnosticFailures.get(serverName) || {
                count: 0,
                lastError: '',
              }
              // 服务层 passive Feedback在这里处理 `failures.count++`，完成这一小步状态转换。
              failures.count++
              // lastError 错误信息更新为 `err.message`，确保服务层后续读取最新状态。
              failures.lastError = err.message
              // diagnosticFailures.set 写入新的状态值，使服务层 passive Feedback后续读取保持一致。
              diagnosticFailures.set(serverName, failures)

              // 满足 `failures.count >= 3` 时，服务层 passive Feedback执行该分支。
              if (failures.count >= 3) {
                // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `WARNING: LSP diagnostic handler for ${serverName} has failed ${failures.count} times consecutively. ` +
                    `Last error: ${failures.lastError}. ` +
                    `This may indicate a problem with the LSP server or diagnostic processing. ` +
                    `Check logs for details.`,
                )
              }
            }
          } catch (error) {
            // Catch any unexpected errors from the entire handler to prevent breaking the notification loop
            // err保存`toError`，供服务层 passive Feedback后续处理使用。
            const err = toError(error)
            // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
            logError(err)
            // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Unexpected error processing diagnostics from ${serverName}: ${err.message}`,
            )

            // Track consecutive failures and warn after 3+
            // failures 集合读取`diagnosticFailures.get`，供服务层 passive Feedback后续处理使用。
            const failures = diagnosticFailures.get(serverName) || {
              count: 0,
              lastError: '',
            }
            // 服务层 passive Feedback在这里处理 `failures.count++`，完成这一小步状态转换。
            failures.count++
            // lastError 错误信息更新为 `err.message`，确保服务层后续读取最新状态。
            failures.lastError = err.message
            // diagnosticFailures.set 写入新的状态值，使服务层 passive Feedback后续读取保持一致。
            diagnosticFailures.set(serverName, failures)

            // 满足 `failures.count >= 3` 时，服务层 passive Feedback执行该分支。
            if (failures.count >= 3) {
              // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `WARNING: LSP diagnostic handler for ${serverName} has failed ${failures.count} times consecutively. ` +
                  `Last error: ${failures.lastError}. ` +
                  `This may indicate a problem with the LSP server or diagnostic processing. ` +
                  `Check logs for details.`,
              )
            }

            // Don't re-throw - isolate errors to this server only
          }
        },
      )

      // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Registered diagnostics handler for ${serverName}`)
      // 服务层 passive Feedback在这里处理 `successCount++`，完成这一小步状态转换。
      successCount++
    } catch (error) {
      // err保存`toError`，供服务层 passive Feedback后续处理使用。
      const err = toError(error)

      // registrationErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
      registrationErrors.push({
        serverName,
        error: err.message,
      })

      // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to register diagnostics handler for ${serverName}: ` +
          `Error: ${err.message}`,
      )
    }
  }

  // Report overall registration status
  // totalServers 集合统计`servers.size` 整理出中间结果，供服务层 passive Feedback后续步骤使用。
  const totalServers = servers.size
  // 满足 `registrationErrors.length > 0` 时，服务层 passive Feedback执行该分支。
  if (registrationErrors.length > 0) {
    // failedServers 集合保存`registrationErrors`，供后续判断或组装使用。
    const failedServers = registrationErrors
      // 链式调用 map，继续加工上一行在服务层 passive Feedback中产生的数据。
      .map(e => `${e.serverName} (${e.error})`)
      .join(', ')
    // Log aggregate failures for tracking
    // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Failed to register diagnostics for ${registrationErrors.length} LSP server(s): ${failedServers}`,
      ),
    )
    // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP notification handler registration: ${successCount}/${totalServers} succeeded. ` +
        `Failed servers: ${failedServers}. ` +
        `Diagnostics from failed servers will not be delivered.`,
    )
  } else {
    // 记录服务层 passive Feedback运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP notification handlers registered successfully for all ${totalServers} server(s)`,
    )
  }

  // Return tracking data for monitoring and testing
  // 返回结构化结果，集中表达服务层 passive Feedback已经整理出的状态。
  return {
    totalServers,
    successCount,
    registrationErrors,
    diagnosticFailures,
  }
}
