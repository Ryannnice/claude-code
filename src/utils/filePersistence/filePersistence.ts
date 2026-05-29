/**
 * File persistence orchestrator
 *
 * This module provides the main orchestration logic for persisting files
 * at the end of each turn:
 * - BYOC mode: Upload files to Files API and collect file IDs
 * - 1P/Cloud mode: Query Files API listDirectory for file IDs (rclone handles sync)
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, relative } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type FilesApiConfig,
  uploadSessionFiles,
} from '../../services/api/filesApi.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getSessionIngressAuthToken，将 ../sessionIngressAuth.js 中已经封装好的能力接到本文件流程里。
import { getSessionIngressAuthToken } from '../sessionIngressAuth.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findModifiedFiles,
  getEnvironmentKind,
  logDebug,
} from './outputsScanner.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_UPLOAD_CONCURRENCY,
  type FailedPersistence,
  FILE_COUNT_LIMIT,
  type FilesPersistedEventData,
  OUTPUTS_SUBDIR,
  type PersistedFile,
  type TurnStartTime,
} from './types.js'

/**
 * Execute file persistence for modified files in the outputs directory.
 *
 * Assembles all config internally:
 * - Checks environment kind (CLAUDE_CODE_ENVIRONMENT_KIND)
 * - Retrieves session access token
 * - Requires CLAUDE_CODE_REMOTE_SESSION_ID for session ID
 *
 * @param turnStartTime - The timestamp when the turn started
 * @param signal - Optional abort signal for cancellation
 * @returns Event data, or null if not enabled or no files to persist
 */
// runFilePersistence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runFilePersistence(
  turnStartTime: TurnStartTime,
  signal?: AbortSignal,
): Promise<FilesPersistedEventData | null> {
  // environmentKind读取`getEnvironmentKind`，供共享工具后续处理使用。
  const environmentKind = getEnvironmentKind()
  // `environmentKind` 与 `'byoc'` 不一致时刷新派生状态，避免使用过期结果。
  if (environmentKind !== 'byoc') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // sessionAccessToken 会话数据读取`getSessionIngressAuthToken`，供共享工具后续处理使用。
  const sessionAccessToken = getSessionIngressAuthToken()
  // sessionAccessToken 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sessionAccessToken) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // sessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const sessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
  // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sessionId) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        'File persistence enabled but CLAUDE_CODE_REMOTE_SESSION_ID is not set',
      ),
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 配置 集中保存共享工具 file Persistence要一起传递的字段。
  const config: FilesApiConfig = {
    oauthToken: sessionAccessToken,
    sessionId,
  }

  // outputsDir格式化`join`，供共享工具后续处理使用。
  const outputsDir = join(getCwd(), sessionId, OUTPUTS_SUBDIR)

  // Check if aborted
  // 满足 `signal?.aborted` 时，共享工具执行该分支。
  if (signal?.aborted) {
    // 调用 logDebug，触发共享工具此处需要的副作用。
    logDebug('Persistence aborted before processing')
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_file_persistence_started', {
    mode: environmentKind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
    let result: FilesPersistedEventData
    // 当 `environmentKind` 匹配 `'byoc'` 时，共享工具执行对应分支。
    if (environmentKind === 'byoc') {
      // 结果更新为 `await executeBYOCPersistence(`，确保共享工具后续读取最新状态。
      result = await executeBYOCPersistence(
        turnStartTime,
        config,
        outputsDir,
        signal,
      )
    } else {
      // 结果更新为 `await executeCloudPersistence()`，确保共享工具后续读取最新状态。
      result = await executeCloudPersistence()
    }

    // Nothing to report
    // 只有 `result.files.length === 0 && result.failed.length` 满足时，共享工具才执行该分支。
    if (result.files.length === 0 && result.failed.length === 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const durationMs = Date.now() - startTime
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_persistence_completed', {
      success_count: result.files.length,
      failure_count: result.failed.length,
      duration_ms: durationMs,
      mode: environmentKind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 调用 logDebug，触发共享工具此处需要的副作用。
    logDebug(`File persistence failed: ${error}`)

    // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const durationMs = Date.now() - startTime
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_persistence_completed', {
      success_count: 0,
      failure_count: 0,
      duration_ms: durationMs,
      mode: environmentKind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      error:
        'exception' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      files: [],
      failed: [
        {
          filename: outputsDir,
          error: errorMessage(error),
        },
      ],
    }
  }
}

/**
 * Execute BYOC mode persistence: scan local filesystem for modified files,
 * then upload to Files API.
 */
// executeBYOCPersistence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executeBYOCPersistence(
  turnStartTime: TurnStartTime,
  config: FilesApiConfig,
  outputsDir: string,
  signal?: AbortSignal,
): Promise<FilesPersistedEventData> {
  // Find modified files via local filesystem scan
  // Uses same directory structure as downloads: {cwd}/{sessionId}/outputs
  // modifiedFiles 文件数据筛选`findModifiedFiles`，供共享工具后续处理使用。
  const modifiedFiles = await findModifiedFiles(turnStartTime, outputsDir)

  // modifiedFiles 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (modifiedFiles.length === 0) {
    // 调用 logDebug，触发共享工具此处需要的副作用。
    logDebug('No modified files to persist')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { files: [], failed: [] }
  }

  // 调用 logDebug，触发共享工具此处需要的副作用。
  logDebug(`Found ${modifiedFiles.length} modified files`)

  // 满足 `signal?.aborted` 时，共享工具执行该分支。
  if (signal?.aborted) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { files: [], failed: [] }
  }

  // Enforce file count limit
  // 满足 `modifiedFiles.length > FILE_COUNT_LIMIT` 时，共享工具执行该分支。
  if (modifiedFiles.length > FILE_COUNT_LIMIT) {
    // 调用 logDebug，触发共享工具此处需要的副作用。
    logDebug(
      `File count limit exceeded: ${modifiedFiles.length} > ${FILE_COUNT_LIMIT}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_persistence_limit_exceeded', {
      file_count: modifiedFiles.length,
      limit: FILE_COUNT_LIMIT,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      files: [],
      failed: [
        {
          filename: outputsDir,
          error: `Too many files modified (${modifiedFiles.length}). Maximum: ${FILE_COUNT_LIMIT}.`,
        },
      ],
    }
  }

  // filesToProcess 文件数据 命名 `modifiedFiles`，让后续代码直接表达这个值的用途。
  const filesToProcess = modifiedFiles
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(filePath => ({
      path: filePath,
      relativePath: relative(outputsDir, filePath),
    }))
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(({ relativePath }) => {
      // Security: skip files that resolve outside the outputs directory
      // 满足 `relativePath.startsWith('..')` 时，共享工具执行该分支。
      if (relativePath.startsWith('..')) {
        // 调用 logDebug，触发共享工具此处需要的副作用。
        logDebug(`Skipping file outside outputs directory: ${relativePath}`)
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })

  // 调用 logDebug，触发共享工具此处需要的副作用。
  logDebug(`BYOC mode: uploading ${filesToProcess.length} files`)

  // Upload files in parallel
  // 结果列表读取`uploadSessionFiles`，供共享工具后续处理使用。
  const results = await uploadSessionFiles(
    filesToProcess,
    config,
    DEFAULT_UPLOAD_CONCURRENCY,
  )

  // Separate successful and failed uploads
  // persistedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const persistedFiles: PersistedFile[] = []
  // failedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const failedFiles: FailedPersistence[] = []

  // 按顺序遍历 `results` 中的结果，逐个交给共享工具处理。
  for (const result of results) {
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) {
      // persistedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      persistedFiles.push({
        filename: result.path,
        file_id: result.fileId,
      })
    } else {
      // failedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      failedFiles.push({
        filename: result.path,
        error: result.error,
      })
    }
  }

  // 调用 logDebug，触发共享工具此处需要的副作用。
  logDebug(
    `BYOC persistence complete: ${persistedFiles.length} uploaded, ${failedFiles.length} failed`,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    files: persistedFiles,
    failed: failedFiles,
  }
}

/**
 * Execute Cloud (1P) mode persistence.
 * TODO: Read file_id from xattr on output files. xattr-based file IDs are
 * currently being added for 1P environments.
 */
// executeCloudPersistence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function executeCloudPersistence(): FilesPersistedEventData {
  // 调用 logDebug，触发共享工具此处需要的副作用。
  logDebug('Cloud mode: xattr-based file ID reading not yet implemented')
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { files: [], failed: [] }
}

/**
 * Execute file persistence and emit result via callback.
 * Handles errors internally.
 */
// executeFilePersistence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function executeFilePersistence(
  turnStartTime: TurnStartTime,
  signal: AbortSignal,
  // 这个回调绑定到 onResult: (result: FilesPersistedEventData) => void,，负责共享工具在该局部场景下的响应。
  onResult: (result: FilesPersistedEventData) => void,
): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`runFilePersistence`，供共享工具后续处理使用。
    const result = await runFilePersistence(turnStartTime, signal)
    // 满足 `result` 时，共享工具执行该分支。
    if (result) {
      // 调用 onResult，触发共享工具此处需要的副作用。
      onResult(result)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

/**
 * Check if file persistence is enabled.
 * Requires: feature flag ON, valid environment kind, session access token,
 * and CLAUDE_CODE_REMOTE_SESSION_ID.
 * This ensures only public-api/sessions users trigger file persistence,
 * not normal Claude Code CLI users.
 */
// isFilePersistenceEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFilePersistenceEnabled(): boolean {
  // 满足 `feature('FILE_PERSISTENCE')` 时，共享工具执行该分支。
  if (feature('FILE_PERSISTENCE')) {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      getEnvironmentKind() === 'byoc' &&
      !!getSessionIngressAuthToken() &&
      !!process.env.CLAUDE_CODE_REMOTE_SESSION_ID
    )
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
