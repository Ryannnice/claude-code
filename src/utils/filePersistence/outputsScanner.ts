/**
 * Outputs directory scanner for file persistence
 *
 * This module provides utilities to:
 * - Detect the session type from environment variables
 * - Capture turn start timestamp
 * - Find modified files by comparing file mtimes against turn start time
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import * as fs from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { EnvironmentKind } 来自 ../teleport/environments.js，用于校准共享工具的数据契约。
import type { EnvironmentKind } from '../teleport/environments.js'
// 类型依赖 { TurnStartTime } 来自 ./types.js，用于校准共享工具的数据契约。
import type { TurnStartTime } from './types.js'

/** Shared debug logger for file persistence modules */
// logDebug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logDebug(message: string): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[file-persistence] ${message}`)
}

/**
 * Get the environment kind from CLAUDE_CODE_ENVIRONMENT_KIND.
 * Returns null if not set or not a recognized value.
 */
// getEnvironmentKind 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnvironmentKind(): EnvironmentKind | null {
  // kind 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const kind = process.env.CLAUDE_CODE_ENVIRONMENT_KIND
  // 当 `kind` 匹配 `'byoc' || kind === 'anthrop...` 时，共享工具执行对应分支。
  if (kind === 'byoc' || kind === 'anthropic_cloud') {
    // 返回 `kind`，作为共享工具这次计算的结果。
    return kind
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// hasParentPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasParentPath(
  entry: object,
): entry is { parentPath: string; name: string } {
  // 返回 `'parentPath' in entry && typeof entry.parentPath === 'string'`，作为共享工具这次计算的结果。
  return 'parentPath' in entry && typeof entry.parentPath === 'string'
}

// hasPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasPath(entry: object): entry is { path: string; name: string } {
  // 返回 `'path' in entry && typeof entry.path === 'string'`，作为共享工具这次计算的结果。
  return 'path' in entry && typeof entry.path === 'string'
}

// getEntryParentPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEntryParentPath(entry: object, fallback: string): string {
  // 满足 `hasParentPath(entry)` 时，共享工具执行该分支。
  if (hasParentPath(entry)) {
    // 返回 `entry.parentPath`，作为共享工具这次计算的结果。
    return entry.parentPath
  }
  // 满足 `hasPath(entry)` 时，共享工具执行该分支。
  if (hasPath(entry)) {
    // 返回 `entry.path`，作为共享工具这次计算的结果。
    return entry.path
  }
  // 返回 `fallback`，作为共享工具这次计算的结果。
  return fallback
}

/**
 * Find files that have been modified since the turn started.
 * Returns paths of files with mtime >= turnStartTime.
 *
 * Uses recursive directory listing and parallelized stat calls for efficiency.
 *
 * @param turnStartTime - The timestamp when the turn started
 * @param outputsDir - The directory to scan for modified files
 */
// findModifiedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findModifiedFiles(
  turnStartTime: TurnStartTime,
  outputsDir: string,
): Promise<string[]> {
  // Use recursive flag to get all entries in one call
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: Awaited<ReturnType<typeof fs.readdir>>
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await fs.readdir(outputsDir, {`，确保共享工具后续读取最新状态。
    entries = await fs.readdir(outputsDir, {
      withFileTypes: true,
      recursive: true,
    })
  } catch {
    // Directory doesn't exist or is not accessible
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Filter to regular files only (skip symlinks for security) and build full paths
  // filePaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const filePaths: string[] = []
  // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
  for (const entry of entries) {
    // 满足 `entry.isSymbolicLink()` 时，共享工具执行该分支。
    if (entry.isSymbolicLink()) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `entry.isFile()` 时，共享工具执行该分支。
    if (entry.isFile()) {
      // entry.parentPath is available in Node 20+, fallback to entry.path for older versions
      // parentPath 路径数据读取`getEntryParentPath`，供共享工具后续处理使用。
      const parentPath = getEntryParentPath(entry, outputsDir)
      // filePaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
      filePaths.push(path.join(parentPath, entry.name))
    }
  }

  // filePaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (filePaths.length === 0) {
    // 调用 logDebug，触发共享工具此处需要的副作用。
    logDebug('No files found in outputs directory')
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Parallelize stat calls for all files
  // statResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const statResults = await Promise.all(
    // 调用 filePaths.map，触发共享工具此处需要的副作用。
    filePaths.map(async filePath => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // stat保存`fs.lstat`，供共享工具后续处理使用。
        const stat = await fs.lstat(filePath)
        // Skip if it became a symlink between readdir and stat (race condition)
        // 满足 `stat.isSymbolicLink()` 时，共享工具执行该分支。
        if (stat.isSymbolicLink()) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { filePath, mtimeMs: stat.mtimeMs }
      } catch {
        // File may have been deleted between readdir and stat
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // Filter to files modified since turn start
  // modifiedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const modifiedFiles: string[] = []
  // 按顺序遍历 `statResults` 中的结果，逐个交给共享工具处理。
  for (const result of statResults) {
    // 只有 `result && result.mtimeMs >= turnStartTime` 满足时，共享工具才执行该分支。
    if (result && result.mtimeMs >= turnStartTime) {
      // modifiedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      modifiedFiles.push(result.filePath)
    }
  }

  // 调用 logDebug，触发共享工具此处需要的副作用。
  logDebug(
    `Found ${modifiedFiles.length} modified files since turn start (scanned ${filePaths.length} total)`,
  )

  // 返回 `modifiedFiles`，作为共享工具这次计算的结果。
  return modifiedFiles
}
