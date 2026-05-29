// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import * as fs from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 引入 CACHE_PATHS，将 ./cachePaths.js 中已经封装好的能力接到本文件流程里。
import { CACHE_PATHS } from './cachePaths.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 FsOperations、getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { type FsOperations, getFsImplementation } from './fsOperations.js'
// 引入 cleanupOldImageCaches，将 ./imageStore.js 中已经封装好的能力接到本文件流程里。
import { cleanupOldImageCaches } from './imageStore.js'
// 引入 * as lockfile，将 ./lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from './lockfile.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 cleanupOldVersions，将 ./nativeInstaller/index.js 中已经封装好的能力接到本文件流程里。
import { cleanupOldVersions } from './nativeInstaller/index.js'
// 引入 cleanupOldPastes，将 ./pasteStore.js 中已经封装好的能力接到本文件流程里。
import { cleanupOldPastes } from './pasteStore.js'
// 引入 getProjectsDir，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getProjectsDir } from './sessionStorage.js'
// 引入 getSettingsWithAllErrors，将 ./settings/allErrors.js 中已经封装好的能力接到本文件流程里。
import { getSettingsWithAllErrors } from './settings/allErrors.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  rawSettingsContainsKey,
} from './settings/settings.js'
// 引入 TOOL_RESULTS_SUBDIR，将 ./toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { TOOL_RESULTS_SUBDIR } from './toolResultStorage.js'
// 引入 cleanupStaleAgentWorktrees，将 ./worktree.js 中已经封装好的能力接到本文件流程里。
import { cleanupStaleAgentWorktrees } from './worktree.js'

// DEFAULT_CLEANUP_PERIOD_DAYS 集合保存`30`，供后续判断或组装使用。
const DEFAULT_CLEANUP_PERIOD_DAYS = 30

// getCutoffDate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCutoffDate(): Date {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // cleanupPeriodDays 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cleanupPeriodDays =
    settings.cleanupPeriodDays ?? DEFAULT_CLEANUP_PERIOD_DAYS
  // cleanupPeriodMs 集合保存`cleanupPeriodDays * 24 * 60 * 60 * 1000`，供后续判断或组装使用。
  const cleanupPeriodMs = cleanupPeriodDays * 24 * 60 * 60 * 1000
  // 返回 `new Date(Date.now() - cleanupPeriodMs)`，作为共享工具这次计算的结果。
  return new Date(Date.now() - cleanupPeriodMs)
}

// CleanupResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CleanupResult = {
  messages: number
  errors: number
}

// addCleanupResults 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addCleanupResults(
  a: CleanupResult,
  b: CleanupResult,
): CleanupResult {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: a.messages + b.messages,
    errors: a.errors + b.errors,
  }
}

// convertFileNameToDate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function convertFileNameToDate(filename: string): Date {
  // isoStr保存`filename`，供共享工具 cleanup后续判断或输出使用。
  const isoStr = filename
    .split('.')[0]!
    .replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z')
  // 返回 `new Date(isoStr)`，作为共享工具这次计算的结果。
  return new Date(isoStr)
}

// cleanupOldFilesInDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function cleanupOldFilesInDirectory(
  dirPath: string,
  cutoffDate: Date,
  isMessagePath: boolean,
): Promise<CleanupResult> {
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据读取`getFsImplementation`，供共享工具后续处理使用。
    const files = await getFsImplementation().readdir(dirPath)

    // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
    for (const file of files) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // Convert filename format where all ':.' were replaced with '-'
        // timestamp记录时间`convertFileNameToDate`，供共享工具后续处理使用。
        const timestamp = convertFileNameToDate(file.name)
        // 满足 `timestamp < cutoffDate` 时，共享工具执行该分支。
        if (timestamp < cutoffDate) {
          // 等待 `getFsImplementation().unlink(join(dirPath, file.name))` 完成，再继续共享工具 cleanup的异步流程。
          await getFsImplementation().unlink(join(dirPath, file.name))
          // Increment the appropriate counter
          // 满足 `isMessagePath` 时，共享工具执行该分支。
          if (isMessagePath) {
            // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
            result.messages++
          } else {
            // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
            result.errors++
          }
        }
      } catch (error) {
        // Log but continue processing other files
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error as Error)
      }
    }
  } catch (error: unknown) {
    // Ignore if directory doesn't exist
    // 只有 `error instanceof Error && 'code' in error && erro` 满足时，共享工具才执行该分支。
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// cleanupOldMessageFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldMessageFiles(): Promise<CleanupResult> {
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // errorPath 路径数据保存`CACHE_PATHS.errors`，供共享工具后续处理使用。
  const errorPath = CACHE_PATHS.errors()
  // baseCachePath 路径数据保存`CACHE_PATHS.baseLogs`，供共享工具后续处理使用。
  const baseCachePath = CACHE_PATHS.baseLogs()

  // Clean up message and error logs
  // 结果保存`cleanupOldFilesInDirectory`，供共享工具后续处理使用。
  let result = await cleanupOldFilesInDirectory(errorPath, cutoffDate, false)

  // Clean up MCP logs
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let dirents
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // dirents 集合更新为 `await fsImpl.readdir(baseCachePath)`，确保共享工具后续读取最新状态。
      dirents = await fsImpl.readdir(baseCachePath)
    } catch {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // mcpLogDirs 集合保存`dirents`，供共享工具 cleanup后续判断或输出使用。
    const mcpLogDirs = dirents
      .filter(
        // dirent更新为 `> dirent.isDirectory() && dirent.name.startsWith('mcp-log...`，确保共享工具后续读取最新状态。
        dirent => dirent.isDirectory() && dirent.name.startsWith('mcp-logs-'),
      )
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(dirent => join(baseCachePath, dirent.name))

    // 按顺序遍历 `mcpLogDirs` 中的mcpLogDir，逐个交给共享工具处理。
    for (const mcpLogDir of mcpLogDirs) {
      // Clean up files in MCP log directory
      // 结果更新为 `addCleanupResults(`，确保共享工具后续读取最新状态。
      result = addCleanupResults(
        result,
        await cleanupOldFilesInDirectory(mcpLogDir, cutoffDate, true),
      )
      // 等待 `tryRmdir(mcpLogDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
      await tryRmdir(mcpLogDir, fsImpl)
    }
  } catch (error: unknown) {
    // 只有 `error instanceof Error && 'code' in error && erro` 满足时，共享工具才执行该分支。
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// unlinkIfOld 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function unlinkIfOld(
  filePath: string,
  cutoffDate: Date,
  fsImpl: FsOperations,
): Promise<boolean> {
  // stats 集合保存`fsImpl.stat`，供共享工具后续处理使用。
  const stats = await fsImpl.stat(filePath)
  // 满足 `stats.mtime < cutoffDate` 时，共享工具执行该分支。
  if (stats.mtime < cutoffDate) {
    // 等待 `fsImpl.unlink(filePath)` 完成，再继续共享工具 cleanup的异步流程。
    await fsImpl.unlink(filePath)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// tryRmdir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryRmdir(dirPath: string, fsImpl: FsOperations): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fsImpl.rmdir(dirPath)` 完成，再继续共享工具 cleanup的异步流程。
    await fsImpl.rmdir(dirPath)
  } catch {
    // not empty / doesn't exist
  }
}

// cleanupOldSessionFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldSessionFiles(): Promise<CleanupResult> {
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()

  // projectDirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let projectDirents
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // projectDirents 集合更新为 `await fsImpl.readdir(projectsDir)`，确保共享工具后续读取最新状态。
    projectDirents = await fsImpl.readdir(projectsDir)
  } catch {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 按顺序遍历 `projectDirents` 中的projectDirent，逐个交给共享工具处理。
  for (const projectDirent of projectDirents) {
    // 满足 `!projectDirent.isDirectory()` 时，共享工具执行该分支。
    if (!projectDirent.isDirectory()) continue
    // projectDir格式化`join`，供共享工具后续处理使用。
    const projectDir = join(projectsDir, projectDirent.name)

    // Single readdir per project directory — partition into files and session dirs
    // entries 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let entries
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合更新为 `await fsImpl.readdir(projectDir)`，确保共享工具后续读取最新状态。
      entries = await fsImpl.readdir(projectDir)
    } catch {
      // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
      result.errors++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
    for (const entry of entries) {
      // 满足 `entry.isFile()` 时，共享工具执行该分支。
      if (entry.isFile()) {
        // 只有 `!entry.name.endsWith('.jsonl') && !entry.name.endsWith('.cast')` 满足时，共享工具才执行该分支。
        if (!entry.name.endsWith('.jsonl') && !entry.name.endsWith('.cast')) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 共享工具在这里按实际状态进入对应分支。
          if (
            await unlinkIfOld(join(projectDir, entry.name), cutoffDate, fsImpl)
          ) {
            // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
            result.messages++
          }
        } catch {
          // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
          result.errors++
        }
      // 共享工具 cleanup在这里处理 `} else if (entry.isDirectory()) {`，完成这一小步状态转换。
      } else if (entry.isDirectory()) {
        // Session directory — clean up tool-results/<toolDir>/* beneath it
        // sessionDir 会话数据格式化`join`，供共享工具后续处理使用。
        const sessionDir = join(projectDir, entry.name)
        // toolResultsDir格式化`join`，供共享工具后续处理使用。
        const toolResultsDir = join(sessionDir, TOOL_RESULTS_SUBDIR)
        // toolDirs 的赋值跨多行展开，先保留变量名再读取后续表达式。
        let toolDirs
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // toolDirs 集合更新为 `await fsImpl.readdir(toolResultsDir)`，确保共享工具后续读取最新状态。
          toolDirs = await fsImpl.readdir(toolResultsDir)
        } catch {
          // No tool-results dir — still try to remove an empty session dir
          // 等待 `tryRmdir(sessionDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
          await tryRmdir(sessionDir, fsImpl)
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 按顺序遍历 `toolDirs` 中的toolEntry，逐个交给共享工具处理。
        for (const toolEntry of toolDirs) {
          // 满足 `toolEntry.isFile()` 时，共享工具执行该分支。
          if (toolEntry.isFile()) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 共享工具在这里按实际状态进入对应分支。
              if (
                await unlinkIfOld(
                  join(toolResultsDir, toolEntry.name),
                  cutoffDate,
                  fsImpl,
                )
              ) {
                // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
                result.messages++
              }
            } catch {
              // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
              result.errors++
            }
          // 共享工具 cleanup在这里处理 `} else if (toolEntry.isDirectory()) {`，完成这一小步状态转换。
          } else if (toolEntry.isDirectory()) {
            // toolDirPath 路径数据格式化`join`，供共享工具后续处理使用。
            const toolDirPath = join(toolResultsDir, toolEntry.name)
            // toolFiles 的赋值跨多行展开，先保留变量名再读取后续表达式。
            let toolFiles
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // toolFiles 文件数据更新为 `await fsImpl.readdir(toolDirPath)`，确保共享工具后续读取最新状态。
              toolFiles = await fsImpl.readdir(toolDirPath)
            } catch {
              // 跳过当前项，继续处理共享工具中的下一轮循环。
              continue
            }
            // 按顺序遍历 `toolFiles` 中的tf，逐个交给共享工具处理。
            for (const tf of toolFiles) {
              // 满足 `!tf.isFile()` 时，共享工具执行该分支。
              if (!tf.isFile()) continue
              // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
              try {
                // 共享工具在这里按实际状态进入对应分支。
                if (
                  await unlinkIfOld(
                    join(toolDirPath, tf.name),
                    cutoffDate,
                    fsImpl,
                  )
                ) {
                  // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
                  result.messages++
                }
              } catch {
                // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
                result.errors++
              }
            }
            // 等待 `tryRmdir(toolDirPath, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
            await tryRmdir(toolDirPath, fsImpl)
          }
        }
        // 等待 `tryRmdir(toolResultsDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
        await tryRmdir(toolResultsDir, fsImpl)
        // 等待 `tryRmdir(sessionDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
        await tryRmdir(sessionDir, fsImpl)
      }
    }

    // 等待 `tryRmdir(projectDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
    await tryRmdir(projectDir, fsImpl)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Generic helper for cleaning up old files in a single directory
 * @param dirPath Path to the directory to clean
 * @param extension File extension to filter (e.g., '.md', '.jsonl')
 * @param removeEmptyDir Whether to remove the directory if empty after cleanup
 */
// cleanupSingleDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function cleanupSingleDirectory(
  dirPath: string,
  extension: string,
  removeEmptyDir: boolean = true,
): Promise<CleanupResult> {
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()

  // dirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let dirents
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await fsImpl.readdir(dirPath)`，确保共享工具后续读取最新状态。
    dirents = await fsImpl.readdir(dirPath)
  } catch {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 按顺序遍历 `dirents` 中的dirent，逐个交给共享工具处理。
  for (const dirent of dirents) {
    // 只有 `!dirent.isFile() || !dirent.name.endsWith(extension)` 满足时，共享工具才执行该分支。
    if (!dirent.isFile() || !dirent.name.endsWith(extension)) continue
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `await unlinkIfOld(join(dirPath, dirent.name), cutoffDate, fsImpl)` 时，共享工具执行该分支。
      if (await unlinkIfOld(join(dirPath, dirent.name), cutoffDate, fsImpl)) {
        // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
        result.messages++
      }
    } catch {
      // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
      result.errors++
    }
  }

  // 满足 `removeEmptyDir` 时，共享工具执行该分支。
  if (removeEmptyDir) {
    // 等待 `tryRmdir(dirPath, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
    await tryRmdir(dirPath, fsImpl)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// cleanupOldPlanFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cleanupOldPlanFiles(): Promise<CleanupResult> {
  // plansDir格式化`join`，供共享工具后续处理使用。
  const plansDir = join(getClaudeConfigHomeDir(), 'plans')
  // 返回 `cleanupSingleDirectory(plansDir, '.md')`，作为共享工具这次计算的结果。
  return cleanupSingleDirectory(plansDir, '.md')
}

// cleanupOldFileHistoryBackups 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldFileHistoryBackups(): Promise<CleanupResult> {
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
    const configDir = getClaudeConfigHomeDir()
    // fileHistoryStorageDir 文件数据格式化`join`，供共享工具后续处理使用。
    const fileHistoryStorageDir = join(configDir, 'file-history')

    // dirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let dirents
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // dirents 集合更新为 `await fsImpl.readdir(fileHistoryStorageDir)`，确保共享工具后续读取最新状态。
      dirents = await fsImpl.readdir(fileHistoryStorageDir)
    } catch {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // fileHistorySessionsDirs 会话数据保存`dirents`，供共享工具 cleanup后续判断或输出使用。
    const fileHistorySessionsDirs = dirents
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(dirent => dirent.isDirectory())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(dirent => join(fileHistoryStorageDir, dirent.name))

    // 等待 `Promise.all(` 完成，再继续共享工具 cleanup的异步流程。
    await Promise.all(
      // 调用 fileHistorySessionsDirs.map，触发共享工具此处需要的副作用。
      fileHistorySessionsDirs.map(async fileHistorySessionDir => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // stats 集合保存`fsImpl.stat`，供共享工具后续处理使用。
          const stats = await fsImpl.stat(fileHistorySessionDir)
          // 满足 `stats.mtime < cutoffDate` 时，共享工具执行该分支。
          if (stats.mtime < cutoffDate) {
            // 等待 `fsImpl.rm(fileHistorySessionDir, {` 完成，再继续共享工具 cleanup的异步流程。
            await fsImpl.rm(fileHistorySessionDir, {
              recursive: true,
              force: true,
            })
            // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
            result.messages++
          }
        } catch {
          // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
          result.errors++
        }
      }),
    )

    // 等待 `tryRmdir(fileHistoryStorageDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
    await tryRmdir(fileHistoryStorageDir, fsImpl)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// cleanupOldSessionEnvDirs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldSessionEnvDirs(): Promise<CleanupResult> {
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
    const configDir = getClaudeConfigHomeDir()
    // sessionEnvBaseDir 会话数据格式化`join`，供共享工具后续处理使用。
    const sessionEnvBaseDir = join(configDir, 'session-env')

    // dirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let dirents
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // dirents 集合更新为 `await fsImpl.readdir(sessionEnvBaseDir)`，确保共享工具后续读取最新状态。
      dirents = await fsImpl.readdir(sessionEnvBaseDir)
    } catch {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // sessionEnvDirs 会话数据保存`dirents`，供共享工具 cleanup后续判断或输出使用。
    const sessionEnvDirs = dirents
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(dirent => dirent.isDirectory())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(dirent => join(sessionEnvBaseDir, dirent.name))

    // 按顺序遍历 `sessionEnvDirs` 中的sessionEnvDir 会话数据，逐个交给共享工具处理。
    for (const sessionEnvDir of sessionEnvDirs) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // stats 集合保存`fsImpl.stat`，供共享工具后续处理使用。
        const stats = await fsImpl.stat(sessionEnvDir)
        // 满足 `stats.mtime < cutoffDate` 时，共享工具执行该分支。
        if (stats.mtime < cutoffDate) {
          // 等待 `fsImpl.rm(sessionEnvDir, { recursive: true, force: true })` 完成，再继续共享工具 cleanup的异步流程。
          await fsImpl.rm(sessionEnvDir, { recursive: true, force: true })
          // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
          result.messages++
        }
      } catch {
        // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
        result.errors++
      }
    }

    // 等待 `tryRmdir(sessionEnvBaseDir, fsImpl)` 完成，再继续共享工具 cleanup的异步流程。
    await tryRmdir(sessionEnvBaseDir, fsImpl)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Cleans up old debug log files from ~/.claude/debug/
 * Preserves the 'latest' symlink which points to the current session's log.
 * Debug logs can grow very large (especially with the infinite logging loop bug)
 * and accumulate indefinitely without this cleanup.
 */
// cleanupOldDebugLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldDebugLogs(): Promise<CleanupResult> {
  // cutoffDate读取`getCutoffDate`，供共享工具后续处理使用。
  const cutoffDate = getCutoffDate()
  // 结果 集中保存共享工具 cleanup要一起传递的字段。
  const result: CleanupResult = { messages: 0, errors: 0 }
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()
  // debugDir格式化`join`，供共享工具后续处理使用。
  const debugDir = join(getClaudeConfigHomeDir(), 'debug')

  // dirents 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let dirents
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await fsImpl.readdir(debugDir)`，确保共享工具后续读取最新状态。
    dirents = await fsImpl.readdir(debugDir)
  } catch {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 按顺序遍历 `dirents` 中的dirent，逐个交给共享工具处理。
  for (const dirent of dirents) {
    // Preserve the 'latest' symlink
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !dirent.isFile() ||
      !dirent.name.endsWith('.txt') ||
      dirent.name === 'latest'
    ) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `await unlinkIfOld(join(debugDir, dirent.name), cutoffDate, fsImpl)` 时，共享工具执行该分支。
      if (await unlinkIfOld(join(debugDir, dirent.name), cutoffDate, fsImpl)) {
        // 共享工具 cleanup在这里处理 `result.messages++`，完成这一小步状态转换。
        result.messages++
      }
    } catch {
      // 共享工具 cleanup在这里处理 `result.errors++`，完成这一小步状态转换。
      result.errors++
    }
  }

  // Intentionally do NOT remove debugDir even if empty — needed for future logs
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// ONE_DAY_MS 集合保存`24 * 60 * 60 * 1000`，供后续判断或组装使用。
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Clean up old npm cache entries for Anthropic packages.
 * This helps reduce disk usage since we publish many dev versions per day.
 * Only runs once per day for Ant users.
 */
// cleanupNpmCacheForAnthropicPackages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupNpmCacheForAnthropicPackages(): Promise<void> {
  // markerPath 路径数据格式化`join`，供共享工具后续处理使用。
  const markerPath = join(getClaudeConfigHomeDir(), '.npm-cache-cleanup')

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stat保存`fs.stat`，供共享工具后续处理使用。
    const stat = await fs.stat(markerPath)
    // 满足 `Date.now() - stat.mtimeMs < ONE_DAY_MS` 时，共享工具执行该分支。
    if (Date.now() - stat.mtimeMs < ONE_DAY_MS) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('npm cache cleanup: skipping, ran recently')
      // 共享工具 cleanup在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  } catch {
    // File doesn't exist, proceed with cleanup
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `lockfile.lock(markerPath, { retries: 0, realpath: false })` 完成，再继续共享工具 cleanup的异步流程。
    await lockfile.lock(markerPath, { retries: 0, realpath: false })
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('npm cache cleanup: skipping, lock held')
    // 共享工具 cleanup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('npm cache cleanup: starting')

  // npmCachePath 路径数据格式化`join`，供共享工具后续处理使用。
  const npmCachePath = join(homedir(), '.npm', '_cacache')

  // NPM_CACHE_RETENTION_COUNT 缓存保存`5`，供共享工具 cleanup后续判断或输出使用。
  const NPM_CACHE_RETENTION_COUNT = 5

  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // cacache 缓存保存`import`，供共享工具后续处理使用。
    const cacache = await import('cacache')
    // cutoff保存`startTime - ONE_DAY_MS`，供后续判断或组装使用。
    const cutoff = startTime - ONE_DAY_MS

    // Stream index entries and collect all Anthropic package entries.
    // Previous implementation used cacache.verify() which does a full
    // integrity check + GC of the ENTIRE cache — O(all content blobs).
    // On large caches this took 60+ seconds and blocked the event loop.
    // stream保存`ls.stream`，供共享工具后续处理使用。
    const stream = cacache.ls.stream(npmCachePath)
    // anthropicEntries 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const anthropicEntries: { key: string; time: number }[] = []
    // 逐项读取 `stream as AsyncIterable<{` 中的entry，按输入顺序推进共享工具 cleanup。
    for await (const entry of stream as AsyncIterable<{
      key: string
      time: number
    }>) {
      // 满足 `entry.key.includes('@anthropic-ai/claude-')` 时，共享工具执行该分支。
      if (entry.key.includes('@anthropic-ai/claude-')) {
        // anthropicEntries 集合追加新条目，保持收集顺序与输入顺序一致。
        anthropicEntries.push({ key: entry.key, time: entry.time })
      }
    }

    // Group by package name (everything before the last @version separator)
    // byPackage构建`new Map<string, { key: string; time: number }[]>()`，供后续判断或组装使用。
    const byPackage = new Map<string, { key: string; time: number }[]>()
    // 按顺序遍历 `anthropicEntries` 中的entry，逐个交给共享工具处理。
    for (const entry of anthropicEntries) {
      // atVersionIdx保存`key.lastIndexOf`，供共享工具后续处理使用。
      const atVersionIdx = entry.key.lastIndexOf('@')
      // pkgName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const pkgName =
        atVersionIdx > 0 ? entry.key.slice(0, atVersionIdx) : entry.key
      // existing读取`byPackage.get`，供共享工具后续处理使用。
      const existing = byPackage.get(pkgName) ?? []
      // existing追加新条目，保持收集顺序与输入顺序一致。
      existing.push(entry)
      // byPackage.set 写入新的状态值，使共享工具后续读取保持一致。
      byPackage.set(pkgName, existing)
    }

    // Remove entries older than 1 day OR beyond the top N most recent per package
    // keysToRemove 从空数组开始收集，后续循环会按处理顺序追加条目。
    const keysToRemove: string[] = []
    // 循环处理 `const [, entries] of byPackage`，让共享工具逐项把同类条目按顺序走完。
    for (const [, entries] of byPackage) {
      // 调用 entries.sort，触发共享工具此处需要的副作用。
      entries.sort((a, b) => b.time - a.time) // newest first
      // 按索引扫描 `entries.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < entries.length; i++) {
        // entry 命名 `entries[i]!`，让后续代码直接表达这个值的用途。
        const entry = entries[i]!
        // 只有 `entry.time < cutoff || i >= NPM_CACHE_RETENTION_C` 满足时，共享工具才执行该分支。
        if (entry.time < cutoff || i >= NPM_CACHE_RETENTION_COUNT) {
          // keysToRemove追加新条目，保持收集顺序与输入顺序一致。
          keysToRemove.push(entry.key)
        }
      }
    }

    // 等待 `Promise.all(` 完成，再继续共享工具 cleanup的异步流程。
    await Promise.all(
      // 调用 keysToRemove.map，触发共享工具此处需要的副作用。
      keysToRemove.map(key => cacache.rm.entry(npmCachePath, key)),
    )

    // 等待 `fs.writeFile(markerPath, new Date().toISOString())` 完成，再继续共享工具 cleanup的异步流程。
    await fs.writeFile(markerPath, new Date().toISOString())

    // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const durationMs = Date.now() - startTime
    // 满足 `keysToRemove.length > 0` 时，共享工具执行该分支。
    if (keysToRemove.length > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `npm cache cleanup: Removed ${keysToRemove.length} old @anthropic-ai entries in ${durationMs}ms`,
      )
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`npm cache cleanup: completed in ${durationMs}ms`)
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_npm_cache_cleanup', {
      success: true,
      durationMs,
      entriesRemoved: keysToRemove.length,
    })
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_npm_cache_cleanup', {
      success: false,
      durationMs: Date.now() - startTime,
    })
  } finally {
    // 这个回调绑定到 await lockfile.unlock(markerPath, { realpath: false }).catch(() => {})，负责共享工具在该局部场景下的响应。
    await lockfile.unlock(markerPath, { realpath: false }).catch(() => {})
  }
}

/**
 * Throttled wrapper around cleanupOldVersions for recurring cleanup in long-running sessions.
 * Uses a marker file and lock to ensure it runs at most once per 24 hours,
 * and does not block if another process is already running cleanup.
 * The regular cleanupOldVersions() should still be used for installer flows.
 */
// cleanupOldVersionsThrottled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldVersionsThrottled(): Promise<void> {
  // markerPath 路径数据格式化`join`，供共享工具后续处理使用。
  const markerPath = join(getClaudeConfigHomeDir(), '.version-cleanup')

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stat保存`fs.stat`，供共享工具后续处理使用。
    const stat = await fs.stat(markerPath)
    // 满足 `Date.now() - stat.mtimeMs < ONE_DAY_MS` 时，共享工具执行该分支。
    if (Date.now() - stat.mtimeMs < ONE_DAY_MS) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('version cleanup: skipping, ran recently')
      // 共享工具 cleanup在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  } catch {
    // File doesn't exist, proceed with cleanup
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `lockfile.lock(markerPath, { retries: 0, realpath: false })` 完成，再继续共享工具 cleanup的异步流程。
    await lockfile.lock(markerPath, { retries: 0, realpath: false })
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('version cleanup: skipping, lock held')
    // 共享工具 cleanup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('version cleanup: starting (throttled)')

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `cleanupOldVersions()` 完成，再继续共享工具 cleanup的异步流程。
    await cleanupOldVersions()
    // 等待 `fs.writeFile(markerPath, new Date().toISOString())` 完成，再继续共享工具 cleanup的异步流程。
    await fs.writeFile(markerPath, new Date().toISOString())
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  } finally {
    // 这个回调绑定到 await lockfile.unlock(markerPath, { realpath: false }).catch(() => {})，负责共享工具在该局部场景下的响应。
    await lockfile.unlock(markerPath, { realpath: false }).catch(() => {})
  }
}

// cleanupOldMessageFilesInBackground 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldMessageFilesInBackground(): Promise<void> {
  // If settings have validation errors but the user explicitly set cleanupPeriodDays,
  // skip cleanup entirely rather than falling back to the default (30 days).
  // This prevents accidentally deleting files when the user intended a different retention period.
  // 从 `getSettingsWithAllErrors()` 解构 errors，减少共享工具 cleanup对同一对象的重复访问。
  const { errors } = getSettingsWithAllErrors()
  // 只有 `errors.length > 0 && rawSettingsContainsKey('cleanupPeriodDays')` 满足时，共享工具才执行该分支。
  if (errors.length > 0 && rawSettingsContainsKey('cleanupPeriodDays')) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Skipping cleanup: settings have validation errors but cleanupPeriodDays was explicitly set. Fix settings errors to enable cleanup.',
    )
    // 共享工具 cleanup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 等待 `cleanupOldMessageFiles()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldMessageFiles()
  // 等待 `cleanupOldSessionFiles()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldSessionFiles()
  // 等待 `cleanupOldPlanFiles()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldPlanFiles()
  // 等待 `cleanupOldFileHistoryBackups()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldFileHistoryBackups()
  // 等待 `cleanupOldSessionEnvDirs()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldSessionEnvDirs()
  // 等待 `cleanupOldDebugLogs()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldDebugLogs()
  // 等待 `cleanupOldImageCaches()` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldImageCaches()
  // 等待 `cleanupOldPastes(getCutoffDate())` 完成，再继续共享工具 cleanup的异步流程。
  await cleanupOldPastes(getCutoffDate())
  // removedWorktrees 集合保存`cleanupStaleAgentWorktrees`，供共享工具后续处理使用。
  const removedWorktrees = await cleanupStaleAgentWorktrees(getCutoffDate())
  // 满足 `removedWorktrees > 0` 时，共享工具执行该分支。
  if (removedWorktrees > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_worktree_cleanup', { removed: removedWorktrees })
  }
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 等待 `cleanupNpmCacheForAnthropicPackages()` 完成，再继续共享工具 cleanup的异步流程。
    await cleanupNpmCacheForAnthropicPackages()
  }
}
