// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'path'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 posixPathToWindowsPath，将 ./windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { posixPathToWindowsPath } from './windowsPaths.js'

/**
 * Expands a path that may contain tilde notation (~) to an absolute path.
 *
 * On Windows, POSIX-style paths (e.g., `/c/Users/...`) are automatically converted
 * to Windows format (e.g., `C:\Users\...`). The function always returns paths in
 * the native format for the current platform.
 *
 * @param path - The path to expand, may contain:
 *   - `~` - expands to user's home directory
 *   - `~/path` - expands to path within user's home directory
 *   - absolute paths - returned normalized
 *   - relative paths - resolved relative to baseDir
 *   - POSIX paths on Windows - converted to Windows format
 * @param baseDir - The base directory for resolving relative paths (defaults to current working directory)
 * @returns The expanded absolute path in the native format for the current platform
 *
 * @throws {Error} If path is invalid
 *
 * @example
 * expandPath('~') // '/home/user'
 * expandPath('~/Documents') // '/home/user/Documents'
 * expandPath('./src', '/project') // '/project/src'
 * expandPath('/absolute/path') // '/absolute/path'
 */
// expandPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandPath(path: string, baseDir?: string): string {
  // Set default baseDir to getCwd() if not provided
  // actualBaseDir读取`getCwd`，供共享工具后续处理使用。
  const actualBaseDir = baseDir ?? getCwd() ?? getFsImplementation().cwd()

  // Input validation
  // `typeof path` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof path !== 'string') {
    // 抛出 new TypeError(`Path must be a string, received ${typeof path}`)，阻止共享工具在无效状态下继续运行。
    throw new TypeError(`Path must be a string, received ${typeof path}`)
  }

  // `typeof actualBaseDir` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof actualBaseDir !== 'string') {
    // 抛出 new TypeError(，阻止共享工具在无效状态下继续运行。
    throw new TypeError(
      `Base directory must be a string, received ${typeof actualBaseDir}`,
    )
  }

  // Security: Check for null bytes
  // 只有 `path.includes('\0') || actualBaseDir.includes('\0')` 满足时，共享工具才执行该分支。
  if (path.includes('\0') || actualBaseDir.includes('\0')) {
    // 抛出 new Error('Path contains null bytes')，阻止共享工具在无效状态下继续运行。
    throw new Error('Path contains null bytes')
  }

  // Handle empty or whitespace-only paths
  // trimmedPath 路径数据格式化`path.trim`，供共享工具后续处理使用。
  const trimmedPath = path.trim()
  // trimmedPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmedPath) {
    // 返回 `normalize(actualBaseDir).normalize('NFC')`，作为共享工具这次计算的结果。
    return normalize(actualBaseDir).normalize('NFC')
  }

  // Handle home directory notation
  // 当 `trimmedPath` 匹配 `'~'` 时，共享工具执行对应分支。
  if (trimmedPath === '~') {
    // 返回 `homedir().normalize('NFC')`，作为共享工具这次计算的结果。
    return homedir().normalize('NFC')
  }

  // 满足 `trimmedPath.startsWith('~/')` 时，共享工具执行该分支。
  if (trimmedPath.startsWith('~/')) {
    // 返回 `join(homedir(), trimmedPath.slice(2)).normalize('NFC')`，作为共享工具这次计算的结果。
    return join(homedir(), trimmedPath.slice(2)).normalize('NFC')
  }

  // On Windows, convert POSIX-style paths (e.g., /c/Users/...) to Windows format
  // processedPath 路径数据格式化`trimmedPath` 整理出中间结果，供共享工具 path后续步骤使用。
  let processedPath = trimmedPath
  // 只有 `getPlatform() === 'windows' && trimmedPath.match(/^\/[a-z]\//i)` 满足时，共享工具才执行该分支。
  if (getPlatform() === 'windows' && trimmedPath.match(/^\/[a-z]\//i)) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // processedPath 路径数据更新为 `posixPathToWindowsPath(trimmedPath)`，确保共享工具后续读取最新状态。
      processedPath = posixPathToWindowsPath(trimmedPath)
    } catch {
      // If conversion fails, use original path
      // processedPath 路径数据更新为 `trimmedPath`，确保共享工具后续读取最新状态。
      processedPath = trimmedPath
    }
  }

  // Handle absolute paths
  // 满足 `isAbsolute(processedPath)` 时，共享工具执行该分支。
  if (isAbsolute(processedPath)) {
    // 返回 `normalize(processedPath).normalize('NFC')`，作为共享工具这次计算的结果。
    return normalize(processedPath).normalize('NFC')
  }

  // Handle relative paths
  // 返回 `resolve(actualBaseDir, processedPath).normalize('NFC')`，作为共享工具这次计算的结果。
  return resolve(actualBaseDir, processedPath).normalize('NFC')
}

/**
 * Converts an absolute path to a relative path from cwd, to save tokens in
 * tool output. If the path is outside cwd (relative path would start with ..),
 * returns the absolute path unchanged so it stays unambiguous.
 *
 * @param absolutePath - The absolute path to relativize
 * @returns Relative path if under cwd, otherwise the original absolute path
 */
// toRelativePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toRelativePath(absolutePath: string): string {
  // relativePath 路径数据保存`relative`，供共享工具后续处理使用。
  const relativePath = relative(getCwd(), absolutePath)
  // If the relative path would go outside cwd (starts with ..), keep absolute
  // 返回 `relativePath.startsWith('..') ? absolutePath : relativePath`，作为共享工具这次计算的结果。
  return relativePath.startsWith('..') ? absolutePath : relativePath
}

/**
 * Gets the directory path for a given file or directory path.
 * If the path is a directory, returns the path itself.
 * If the path is a file or doesn't exist, returns the parent directory.
 *
 * @param path - The file or directory path
 * @returns The directory path
 */
// getDirectoryForPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDirectoryForPath(path: string): string {
  // absolutePath 路径数据保存`expandPath`，供共享工具后续处理使用。
  const absolutePath = expandPath(path)
  // SECURITY: Skip filesystem operations for UNC paths to prevent NTLM credential leaks.
  // 只有 `absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')` 满足时，共享工具才执行该分支。
  if (absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')) {
    // 返回 `dirname(absolutePath)`，作为共享工具这次计算的结果。
    return dirname(absolutePath)
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const stats = getFsImplementation().statSync(absolutePath)
    // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
    if (stats.isDirectory()) {
      // 返回 `absolutePath`，作为共享工具这次计算的结果。
      return absolutePath
    }
  } catch {
    // Path doesn't exist or can't be accessed
  }
  // If it's not a directory or doesn't exist, return the parent directory
  // 返回 `dirname(absolutePath)`，作为共享工具这次计算的结果。
  return dirname(absolutePath)
}

/**
 * Checks if a path contains directory traversal patterns that navigate to parent directories.
 *
 * @param path - The path to check for traversal patterns
 * @returns true if the path contains traversal (e.g., '../', '..\', or ends with '..')
 */
// containsPathTraversal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function containsPathTraversal(path: string): boolean {
  // 返回 `/(?:^|[\\/])\.\.(?:[\\/]|$)/.test(path)`，作为共享工具这次计算的结果。
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(path)
}

// Re-export from the shared zero-dep source.
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { sanitizePath } from './sessionStoragePortable.js'

/**
 * Normalizes a path for use as a JSON config key.
 * On Windows, paths can have inconsistent separators (C:\path vs C:/path)
 * depending on whether they come from git, Node.js APIs, or user input.
 * This normalizes to forward slashes for consistent JSON serialization.
 *
 * @param path - The path to normalize
 * @returns The normalized path with consistent forward slashes
 */
// normalizePathForConfigKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizePathForConfigKey(path: string): string {
  // First use Node's normalize to resolve . and .. segments
  // normalized保存`normalize`，供共享工具后续处理使用。
  const normalized = normalize(path)
  // Then convert all backslashes to forward slashes for consistent JSON keys
  // This is safe because forward slashes work in Windows paths for most operations
  // 返回 `normalized.replace(/\\/g, '/')`，作为共享工具这次计算的结果。
  return normalized.replace(/\\/g, '/')
}
