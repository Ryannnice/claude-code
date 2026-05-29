// 引入 LRUCache，将 lru-cache 中已经封装好的能力接到本文件流程里。
import { LRUCache } from 'lru-cache'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join, sep } from 'path'
// 类型依赖 { SuggestionItem } 来自 src/components/PromptInput/PromptInputFooterSuggestions.js，用于校准共享工具的数据契约。
import type { SuggestionItem } from 'src/components/PromptInput/PromptInputFooterSuggestions.js'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 src/utils/fsOperations.js 中维护。
import { getFsImplementation } from 'src/utils/fsOperations.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 复用 expandPath 工具函数，把通用处理留在 src/utils/path.js 中维护。
import { expandPath } from 'src/utils/path.js'
// Types
// DirectoryEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DirectoryEntry = {
  name: string
  path: string
  type: 'directory'
}

// PathEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PathEntry = {
  name: string
  path: string
  type: 'directory' | 'file'
}

// CompletionOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompletionOptions = {
  basePath?: string
  maxResults?: number
}

// PathCompletionOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PathCompletionOptions = CompletionOptions & {
  includeFiles?: boolean
  includeHidden?: boolean
}

// ParsedPath 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedPath = {
  directory: string
  prefix: string
}

// Cache configuration
// CACHE_SIZE 缓存保存`500`，供共享工具 directory Completion后续判断或输出使用。
const CACHE_SIZE = 500
// CACHE_TTL 缓存保存`5 * 60 * 1000 // 5 minutes`，供后续判断或组装使用。
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Initialize LRU cache for directory scans
// directoryCache 缓存 命名 `new LRUCache<string, DirectoryEntry[]>({`，让后续代码直接表达这个值的用途。
const directoryCache = new LRUCache<string, DirectoryEntry[]>({
  max: CACHE_SIZE,
  ttl: CACHE_TTL,
})

// Initialize LRU cache for path scans (files and directories)
// pathCache 路径数据构建`new LRUCache<string, PathEntry[]>({`，供后续判断或组装使用。
const pathCache = new LRUCache<string, PathEntry[]>({
  max: CACHE_SIZE,
  ttl: CACHE_TTL,
})

/**
 * Parses a partial path into directory and prefix components
 */
// parsePartialPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePartialPath(
  partialPath: string,
  basePath?: string,
): ParsedPath {
  // Handle empty input
  // partialPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!partialPath) {
    // directory读取`getCwd`，供共享工具后续处理使用。
    const directory = basePath || getCwd()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { directory, prefix: '' }
  }

  // resolved保存`expandPath`，供共享工具后续处理使用。
  const resolved = expandPath(partialPath, basePath)

  // If path ends with separator, treat as directory with no prefix
  // Handle both forward slash and platform-specific separator
  // 只有 `partialPath.endsWith('/') || partialPath.endsWith(sep)` 满足时，共享工具才执行该分支。
  if (partialPath.endsWith('/') || partialPath.endsWith(sep)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { directory: resolved, prefix: '' }
  }

  // Split into directory and prefix
  // directory保存`dirname`，供共享工具后续处理使用。
  const directory = dirname(resolved)
  // prefix保存`basename`，供共享工具后续处理使用。
  const prefix = basename(partialPath)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { directory, prefix }
}

/**
 * Scans a directory and returns subdirectories
 * Uses LRU cache to avoid repeated filesystem calls
 */
// scanDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function scanDirectory(
  dirPath: string,
): Promise<DirectoryEntry[]> {
  // Check cache first
  // cached 缓存读取`directoryCache.get`，供共享工具后续处理使用。
  const cached = directoryCache.get(dirPath)
  // 满足 `cached` 时，共享工具执行该分支。
  if (cached) {
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Read directory contents
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // entries 集合读取`fs.readdir`，供共享工具后续处理使用。
    const entries = await fs.readdir(dirPath)

    // Filter for directories only, exclude hidden directories
    // directories 集合保存`entries`，供共享工具 directory Completion后续判断或输出使用。
    const directories = entries
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(entry => ({
        name: entry.name,
        path: join(dirPath, entry.name),
        type: 'directory' as const,
      }))
      .slice(0, 100) // Limit results for MVP

    // Cache the results
    // directoryCache.set 写入新的状态值，使共享工具后续读取保持一致。
    directoryCache.set(dirPath, directories)

    // 返回 `directories`，作为共享工具这次计算的结果。
    return directories
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Main function to get directory completion suggestions
 */
// getDirectoryCompletions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getDirectoryCompletions(
  partialPath: string,
  options: CompletionOptions = {},
): Promise<SuggestionItem[]> {
  // 从 `options` 解构 basePath = getCwd()、maxResults = 10，减少共享工具 directory Completion对同一对象的重复访问。
  const { basePath = getCwd(), maxResults = 10 } = options

  // 从 `parsePartialPath(partialPath, basePath)` 解构 directory、prefix，减少共享工具 directory Completion对同一对象的重复访问。
  const { directory, prefix } = parsePartialPath(partialPath, basePath)
  // entries 集合保存`scanDirectory`，供共享工具后续处理使用。
  const entries = await scanDirectory(directory)
  // prefixLower保存`prefix.toLowerCase`，供共享工具后续处理使用。
  const prefixLower = prefix.toLowerCase()
  // matches 集合 命名 `entries`，让后续代码直接表达这个值的用途。
  const matches = entries
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(entry => entry.name.toLowerCase().startsWith(prefixLower))
    .slice(0, maxResults)

  // 返回 `matches.map(entry => ({`，作为共享工具这次计算的结果。
  return matches.map(entry => ({
    id: entry.path,
    displayText: entry.name + '/',
    description: 'directory',
    metadata: { type: 'directory' as const },
  }))
}

/**
 * Clears the directory cache
 */
// clearDirectoryCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearDirectoryCache(): void {
  // 调用 directoryCache.clear，触发共享工具此处需要的副作用。
  directoryCache.clear()
}

/**
 * Checks if a string looks like a path (starts with path-like prefixes)
 */
// isPathLikeToken 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPathLikeToken(token: string): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    token.startsWith('~/') ||
    token.startsWith('/') ||
    token.startsWith('./') ||
    token.startsWith('../') ||
    token === '~' ||
    token === '.' ||
    token === '..'
  )
}

/**
 * Scans a directory and returns both files and subdirectories
 * Uses LRU cache to avoid repeated filesystem calls
 */
// scanDirectoryForPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function scanDirectoryForPaths(
  dirPath: string,
  includeHidden = false,
): Promise<PathEntry[]> {
  // cacheKey 缓存 命名 ``${dirPath}:${includeHidden}``，让后续代码直接表达这个值的用途。
  const cacheKey = `${dirPath}:${includeHidden}`
  // cached 缓存读取`pathCache.get`，供共享工具后续处理使用。
  const cached = pathCache.get(cacheKey)
  // 满足 `cached` 时，共享工具执行该分支。
  if (cached) {
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // entries 集合读取`fs.readdir`，供共享工具后续处理使用。
    const entries = await fs.readdir(dirPath)

    // 路径列表保存`entries`，供后续判断或组装使用。
    const paths = entries
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(entry => includeHidden || !entry.name.startsWith('.'))
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(entry => ({
        name: entry.name,
        path: join(dirPath, entry.name),
        type: entry.isDirectory() ? ('directory' as const) : ('file' as const),
      }))
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => {
        // Sort directories first, then alphabetically
        // 当 `a.type` 匹配 `'directory' && b.type !== '...` 时，共享工具执行对应分支。
        if (a.type === 'directory' && b.type !== 'directory') return -1
        // 当 `a.type !== 'directory' && b.type` 匹配 `'directory'` 时，共享工具执行对应分支。
        if (a.type !== 'directory' && b.type === 'directory') return 1
        // 返回 `a.name.localeCompare(b.name)`，作为共享工具这次计算的结果。
        return a.name.localeCompare(b.name)
      })
      .slice(0, 100)

    // pathCache.set 写入新的状态值，使共享工具后续读取保持一致。
    pathCache.set(cacheKey, paths)
    // 返回 `paths`，作为共享工具这次计算的结果。
    return paths
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Get path completion suggestions for files and directories
 */
// getPathCompletions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPathCompletions(
  partialPath: string,
  options: PathCompletionOptions = {},
): Promise<SuggestionItem[]> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    basePath = getCwd(),
    maxResults = 10,
    includeFiles = true,
    includeHidden = false,
  } = options

  // 从 `parsePartialPath(partialPath, basePath)` 解构 directory、prefix，减少共享工具 directory Completion对同一对象的重复访问。
  const { directory, prefix } = parsePartialPath(partialPath, basePath)
  // entries 集合保存`scanDirectoryForPaths`，供共享工具后续处理使用。
  const entries = await scanDirectoryForPaths(directory, includeHidden)
  // prefixLower保存`prefix.toLowerCase`，供共享工具后续处理使用。
  const prefixLower = prefix.toLowerCase()

  // matches 集合 命名 `entries`，让后续代码直接表达这个值的用途。
  const matches = entries
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(entry => {
      // 当 `!includeFiles && entry.type` 匹配 `'file'` 时，共享工具执行对应分支。
      if (!includeFiles && entry.type === 'file') return false
      // 返回 `entry.name.toLowerCase().startsWith(prefixLower)`，作为共享工具这次计算的结果。
      return entry.name.toLowerCase().startsWith(prefixLower)
    })
    .slice(0, maxResults)

  // Construct relative path based on original partialPath
  // e.g., if partialPath is "src/c", directory portion is "src/"
  // Strip leading "./" since it's just used for cwd search
  // Handle both forward slash and platform separator for Windows compatibility
  // hasSeparator记录 `partialPath.includes` 是否成立，共享工具随后按该结果分支。
  const hasSeparator = partialPath.includes('/') || partialPath.includes(sep)
  // dirPortion固定为 `''`，作为共享工具 directory Completion后续展示或比较的基准。
  let dirPortion = ''
  // 满足 `hasSeparator` 时，共享工具执行该分支。
  if (hasSeparator) {
    // Find the last separator (either / or platform-specific)
    // lastSlash保存`partialPath.lastIndexOf`，供共享工具后续处理使用。
    const lastSlash = partialPath.lastIndexOf('/')
    // lastSep保存`partialPath.lastIndexOf`，供共享工具后续处理使用。
    const lastSep = partialPath.lastIndexOf(sep)
    // lastSeparatorPos 集合保存`Math.max`，供共享工具后续处理使用。
    const lastSeparatorPos = Math.max(lastSlash, lastSep)
    // dirPortion更新为 `partialPath.substring(0, lastSeparatorPos + 1)`，确保共享工具后续读取最新状态。
    dirPortion = partialPath.substring(0, lastSeparatorPos + 1)
  }
  // 只有 `dirPortion.startsWith('./') || dirPortion.startsWith('.' + sep)` 满足时，共享工具才执行该分支。
  if (dirPortion.startsWith('./') || dirPortion.startsWith('.' + sep)) {
    // dirPortion更新为 `dirPortion.slice(2)`，确保共享工具后续读取最新状态。
    dirPortion = dirPortion.slice(2)
  }

  // 返回 `matches.map(entry => {`，作为共享工具这次计算的结果。
  return matches.map(entry => {
    // fullPath 路径数据保存`dirPortion + entry.name`，供共享工具 directory Completion后续判断或输出使用。
    const fullPath = dirPortion + entry.name
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      id: fullPath,
      displayText: entry.type === 'directory' ? fullPath + '/' : fullPath,
      metadata: { type: entry.type },
    }
  })
}

/**
 * Clears both directory and path caches
 */
// clearPathCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPathCache(): void {
  // 调用 directoryCache.clear，触发共享工具此处需要的副作用。
  directoryCache.clear()
  // 调用 pathCache.clear，触发共享工具此处需要的副作用。
  pathCache.clear()
}
