// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, isAbsolute, join, sep } from 'path'
// 类型依赖 { ToolPermissionContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { ToolPermissionContext } from '../Tool.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getFileReadIgnorePatterns,
  normalizePatternsToPath,
} from './permissions/filesystem.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 getGlobExclusionsForPluginCache，将 ./plugins/orphanedPluginFilter.js 中已经封装好的能力接到本文件流程里。
import { getGlobExclusionsForPluginCache } from './plugins/orphanedPluginFilter.js'
// 引入 ripGrep，将 ./ripgrep.js 中已经封装好的能力接到本文件流程里。
import { ripGrep } from './ripgrep.js'

/**
 * Extracts the static base directory from a glob pattern.
 * The base directory is everything before the first glob special character (* ? [ {).
 * Returns the directory portion and the remaining relative pattern.
 */
// extractGlobBaseDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractGlobBaseDirectory(pattern: string): {
  baseDir: string
  relativePattern: string
} {
  // Find the first glob special character: *, ?, [, {
  // globChars 集合保存`/[*?[{]/`，供共享工具 glob后续判断或输出使用。
  const globChars = /[*?[{]/
  // match匹配`pattern.match`，供共享工具后续处理使用。
  const match = pattern.match(globChars)

  // 只有 `!match || match.index === undefined` 满足时，共享工具才执行该分支。
  if (!match || match.index === undefined) {
    // No glob characters - this is a literal path
    // Return the directory portion and filename as pattern
    // dir保存`dirname`，供共享工具后续处理使用。
    const dir = dirname(pattern)
    // file 文件数据保存`basename`，供共享工具后续处理使用。
    const file = basename(pattern)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { baseDir: dir, relativePattern: file }
  }

  // Get everything before the first glob character
  // staticPrefix格式化`pattern.slice`，供共享工具后续处理使用。
  const staticPrefix = pattern.slice(0, match.index)

  // Find the last path separator in the static prefix
  // lastSepIndex 索引保存`Math.max`，供共享工具后续处理使用。
  const lastSepIndex = Math.max(
    staticPrefix.lastIndexOf('/'),
    staticPrefix.lastIndexOf(sep),
  )

  // 满足 `lastSepIndex === -1` 时，共享工具执行该分支。
  if (lastSepIndex === -1) {
    // No path separator before the glob - pattern is relative to cwd
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { baseDir: '', relativePattern: pattern }
  }

  // baseDir格式化`staticPrefix.slice`，供共享工具后续处理使用。
  let baseDir = staticPrefix.slice(0, lastSepIndex)
  // relativePattern格式化`pattern.slice`，供共享工具后续处理使用。
  const relativePattern = pattern.slice(lastSepIndex + 1)

  // Handle root directory patterns (e.g., /*.txt on Unix or C:/*.txt on Windows)
  // When lastSepIndex is 0, baseDir is empty but we need to use '/' as the root
  // 只有 `baseDir === '' && lastSepIndex === 0` 满足时，共享工具才执行该分支。
  if (baseDir === '' && lastSepIndex === 0) {
    // baseDir更新为 `'/'`，确保共享工具后续读取最新状态。
    baseDir = '/'
  }

  // Handle Windows drive root paths (e.g., C:/*.txt)
  // 'C:' means "current directory on drive C" (relative), not root
  // We need 'C:/' or 'C:\' for the actual drive root
  // 只有 `getPlatform() === 'windows' && /^[A-Za-z]:$/.test(baseDir)` 满足时，共享工具才执行该分支。
  if (getPlatform() === 'windows' && /^[A-Za-z]:$/.test(baseDir)) {
    // baseDir更新为 `baseDir + sep`，确保共享工具后续读取最新状态。
    baseDir = baseDir + sep
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { baseDir, relativePattern }
}

// glob 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function glob(
  filePattern: string,
  cwd: string,
  { limit, offset }: { limit: number; offset: number },
  abortSignal: AbortSignal,
  toolPermissionContext: ToolPermissionContext,
): Promise<{ files: string[]; truncated: boolean }> {
  // searchDir保存`cwd`，供共享工具 glob后续判断或输出使用。
  let searchDir = cwd
  // searchPattern 命名 `filePattern`，让后续代码直接表达这个值的用途。
  let searchPattern = filePattern

  // Handle absolute paths by extracting the base directory and converting to relative pattern
  // ripgrep's --glob flag only works with relative patterns
  // 满足 `isAbsolute(filePattern)` 时，共享工具执行该分支。
  if (isAbsolute(filePattern)) {
    // 从 `extractGlobBaseDirectory(filePattern)` 解构 baseDir、relativePattern，减少共享工具 glob对同一对象的重复访问。
    const { baseDir, relativePattern } = extractGlobBaseDirectory(filePattern)
    // 满足 `baseDir` 时，共享工具执行该分支。
    if (baseDir) {
      // searchDir更新为 `baseDir`，确保共享工具后续读取最新状态。
      searchDir = baseDir
      // searchPattern更新为 `relativePattern`，确保共享工具后续读取最新状态。
      searchPattern = relativePattern
    }
  }

  // ignorePatterns 集合保存`normalizePatternsToPath`，供共享工具后续处理使用。
  const ignorePatterns = normalizePatternsToPath(
    getFileReadIgnorePatterns(toolPermissionContext),
    searchDir,
  )

  // Use ripgrep for better memory performance
  // --files: list files instead of searching content
  // --glob: filter by pattern
  // --sort=modified: sort by modification time (oldest first)
  // --no-ignore: don't respect .gitignore (default true, set CLAUDE_CODE_GLOB_NO_IGNORE=false to respect .gitignore)
  // --hidden: include hidden files (default true, set CLAUDE_CODE_GLOB_HIDDEN=false to exclude)
  // Note: use || instead of ?? to treat empty string as unset (defaulting to true)
  // noIgnore保存`isEnvTruthy`，供共享工具后续处理使用。
  const noIgnore = isEnvTruthy(process.env.CLAUDE_CODE_GLOB_NO_IGNORE || 'true')
  // hidden保存`isEnvTruthy`，供共享工具后续处理使用。
  const hidden = isEnvTruthy(process.env.CLAUDE_CODE_GLOB_HIDDEN || 'true')
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    '--files',
    '--glob',
    searchPattern,
    '--sort=modified',
    ...(noIgnore ? ['--no-ignore'] : []),
    ...(hidden ? ['--hidden'] : []),
  ]

  // Add ignore patterns
  // 按顺序遍历 `ignorePatterns` 中的pattern，逐个交给共享工具处理。
  for (const pattern of ignorePatterns) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--glob', `!${pattern}`)
  }

  // Exclude orphaned plugin version directories
  // 逐项读取 `await getGlobExclusionsForPluginCache(searchDir)` 中的exclusion，按输入顺序推进共享工具。
  for (const exclusion of await getGlobExclusionsForPluginCache(searchDir)) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--glob', exclusion)
  }

  // allPaths 路径数据保存`ripGrep`，供共享工具后续处理使用。
  const allPaths = await ripGrep(args, searchDir, abortSignal)

  // ripgrep returns relative paths, convert to absolute
  // absolutePaths 路径数据派生`allPaths.map`，供共享工具后续处理使用。
  const absolutePaths = allPaths.map(p =>
    isAbsolute(p) ? p : join(searchDir, p),
  )

  // truncated保存 `absolutePaths.length > offset + limit` 的判断结果，供共享工具 glob后续分支直接复用。
  const truncated = absolutePaths.length > offset + limit
  // files 文件数据格式化`absolutePaths.slice`，供共享工具后续处理使用。
  const files = absolutePaths.slice(offset, offset + limit)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { files, truncated }
}
