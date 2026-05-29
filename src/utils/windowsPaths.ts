// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 * as pathWin32，将 path/win32 中已经封装好的能力接到本文件流程里。
import * as pathWin32 from 'path/win32'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 execSync_DEPRECATED，将 ./execSyncWrapper.js 中已经封装好的能力接到本文件流程里。
import { execSync_DEPRECATED } from './execSyncWrapper.js'
// 引入 memoizeWithLRU，将 ./memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from './memoize.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

/**
 * Check if a file or directory exists on Windows using the dir command
 * @param path - The path to check
 * @returns true if the path exists, false otherwise
 */
// checkPathExists 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkPathExists(path: string): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 execSync_DEPRECATED，触发共享工具此处需要的副作用。
    execSync_DEPRECATED(`dir "${path}"`, { stdio: 'pipe' })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Find an executable using where.exe on Windows
 * @param executable - The name of the executable to find
 * @returns The path to the executable or null if not found
 */
// findExecutable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findExecutable(executable: string): string | null {
  // For git, check common installation locations first
  // 当 `executable` 匹配 `'git'` 时，共享工具执行对应分支。
  if (executable === 'git') {
    // defaultLocations 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const defaultLocations = [
      // check 64 bit before 32 bit
      'C:\\Program Files\\Git\\cmd\\git.exe',
      'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
      // intentionally don't look for C:\Program Files\Git\mingw64\bin\git.exe
      // because that directory is the "raw" tools with no environment setup
    ]

    // 按顺序遍历 `defaultLocations` 中的location，逐个交给共享工具处理。
    for (const location of defaultLocations) {
      // 满足 `checkPathExists(location)` 时，共享工具执行该分支。
      if (checkPathExists(location)) {
        // 返回 `location`，作为共享工具这次计算的结果。
        return location
      }
    }
  }

  // Fall back to where.exe
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execSync_DEPRECATED`，供共享工具后续处理使用。
    const result = execSync_DEPRECATED(`where.exe ${executable}`, {
      stdio: 'pipe',
      encoding: 'utf8',
    }).trim()

    // SECURITY: Filter out any results from the current directory
    // to prevent executing malicious git.bat/cmd/exe files
    // 路径列表格式化`result.split`，供共享工具后续处理使用。
    const paths = result.split('\r\n').filter(Boolean)
    // cwd读取`getCwd`，供共享工具后续处理使用。
    const cwd = getCwd().toLowerCase()

    // 按顺序遍历 `paths` 中的candidatePath 路径数据，逐个交给共享工具处理。
    for (const candidatePath of paths) {
      // Normalize and compare paths to ensure we're not in current directory
      // normalizedPath 路径数据读取`path.resolve`，供共享工具后续处理使用。
      const normalizedPath = path.resolve(candidatePath).toLowerCase()
      // pathDir 路径数据保存`path.dirname`，供共享工具后续处理使用。
      const pathDir = path.dirname(normalizedPath).toLowerCase()

      // Skip if the executable is in the current working directory
      // 只有 `pathDir === cwd || normalizedPath.startsWith(cwd + path.sep)` 满足时，共享工具才执行该分支。
      if (pathDir === cwd || normalizedPath.startsWith(cwd + path.sep)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping potentially malicious executable in current directory: ${candidatePath}`,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Return the first valid path that's not in the current directory
      // 返回 `candidatePath`，作为共享工具这次计算的结果。
      return candidatePath
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * If Windows, set the SHELL environment variable to git-bash path.
 * This is used by BashTool and Shell.ts for user shell commands.
 * COMSPEC is left unchanged for system process execution.
 */
// setShellIfWindows 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setShellIfWindows(): void {
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // gitBashPath 路径数据筛选`findGitBashPath`，供共享工具后续处理使用。
    const gitBashPath = findGitBashPath()
    // SHELL更新为 `gitBashPath`，确保共享工具后续读取最新状态。
    process.env.SHELL = gitBashPath
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Using bash path: "${gitBashPath}"`)
  }
}

/**
 * Find the path where `bash.exe` included with git-bash exists, exiting the process if not found.
 */
// findGitBashPath 路径数据保存`memoize`，供共享工具后续处理使用。
export const findGitBashPath = memoize((): string => {
  // 满足 `process.env.CLAUDE_CODE_GIT_BASH_PATH` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_GIT_BASH_PATH) {
    // 满足 `checkPathExists(process.env.CLAUDE_CODE_GIT_BASH_PATH)` 时，共享工具执行该分支。
    if (checkPathExists(process.env.CLAUDE_CODE_GIT_BASH_PATH)) {
      // 返回 `process.env.CLAUDE_CODE_GIT_BASH_PATH`，作为共享工具这次计算的结果。
      return process.env.CLAUDE_CODE_GIT_BASH_PATH
    }
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error(
      `Claude Code was unable to find CLAUDE_CODE_GIT_BASH_PATH path "${process.env.CLAUDE_CODE_GIT_BASH_PATH}"`,
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发共享工具此处需要的副作用。
    process.exit(1)
  }

  // gitPath 路径数据筛选`findExecutable`，供共享工具后续处理使用。
  const gitPath = findExecutable('git')
  // 满足 `gitPath` 时，共享工具执行该分支。
  if (gitPath) {
    // bashPath 路径数据格式化`pathWin32.join`，供共享工具后续处理使用。
    const bashPath = pathWin32.join(gitPath, '..', '..', 'bin', 'bash.exe')
    // 满足 `checkPathExists(bashPath)` 时，共享工具执行该分支。
    if (checkPathExists(bashPath)) {
      // 返回 `bashPath`，作为共享工具这次计算的结果。
      return bashPath
    }
  }

  // biome-ignore lint/suspicious/noConsole:: intentional console output
  // 调用 console.error，触发共享工具此处需要的副作用。
  console.error(
    'Claude Code on Windows requires git-bash (https://git-scm.com/downloads/win). If installed but not in PATH, set environment variable pointing to your bash.exe, similar to: CLAUDE_CODE_GIT_BASH_PATH=C:\\Program Files\\Git\\bin\\bash.exe',
  )
  // eslint-disable-next-line custom-rules/no-process-exit
  // 调用 process.exit，触发共享工具此处需要的副作用。
  process.exit(1)
})

/** Convert a Windows path to a POSIX path using pure JS. */
// windowsPathToPosixPath 路径数据保存`memoizeWithLRU`，供共享工具后续处理使用。
export const windowsPathToPosixPath = memoizeWithLRU(
  // 这个回调绑定到 (windowsPath: string): string => {，负责共享工具在该局部场景下的响应。
  (windowsPath: string): string => {
    // Handle UNC paths: \\server\share -> //server/share
    // 满足 `windowsPath.startsWith('\\\\')` 时，共享工具执行该分支。
    if (windowsPath.startsWith('\\\\')) {
      // 返回 `windowsPath.replace(/\\/g, '/')`，作为共享工具这次计算的结果。
      return windowsPath.replace(/\\/g, '/')
    }
    // Handle drive letter paths: C:\Users\foo -> /c/Users/foo
    // match匹配`windowsPath.match`，供共享工具后续处理使用。
    const match = windowsPath.match(/^([A-Za-z]):[/\\]/)
    // 满足 `match` 时，共享工具执行该分支。
    if (match) {
      // driveLetter保存`toLowerCase`，供共享工具后续处理使用。
      const driveLetter = match[1]!.toLowerCase()
      // 返回 `'/' + driveLetter + windowsPath.slice(2).replace(/\\/g, '/')`，作为共享工具这次计算的结果。
      return '/' + driveLetter + windowsPath.slice(2).replace(/\\/g, '/')
    }
    // Already POSIX or relative — just flip slashes
    // 返回 `windowsPath.replace(/\\/g, '/')`，作为共享工具这次计算的结果。
    return windowsPath.replace(/\\/g, '/')
  },
  // 这个回调绑定到 (p: string) => p,，负责共享工具在该局部场景下的响应。
  (p: string) => p,
  500,
)

/** Convert a POSIX path to a Windows path using pure JS. */
// posixPathToWindowsPath 路径数据保存`memoizeWithLRU`，供共享工具后续处理使用。
export const posixPathToWindowsPath = memoizeWithLRU(
  // 这个回调绑定到 (posixPath: string): string => {，负责共享工具在该局部场景下的响应。
  (posixPath: string): string => {
    // Handle UNC paths: //server/share -> \\server\share
    // 满足 `posixPath.startsWith('//')` 时，共享工具执行该分支。
    if (posixPath.startsWith('//')) {
      // 返回 `posixPath.replace(/\//g, '\\')`，作为共享工具这次计算的结果。
      return posixPath.replace(/\//g, '\\')
    }
    // Handle /cygdrive/c/... format
    // cygdriveMatch匹配`posixPath.match`，供共享工具后续处理使用。
    const cygdriveMatch = posixPath.match(/^\/cygdrive\/([A-Za-z])(\/|$)/)
    // 满足 `cygdriveMatch` 时，共享工具执行该分支。
    if (cygdriveMatch) {
      // driveLetter保存`toUpperCase`，供共享工具后续处理使用。
      const driveLetter = cygdriveMatch[1]!.toUpperCase()
      // rest格式化`posixPath.slice`，供共享工具后续处理使用。
      const rest = posixPath.slice(('/cygdrive/' + cygdriveMatch[1]).length)
      // 返回 `driveLetter + ':' + (rest || '\\').replace(/\//g, '\\')`，作为共享工具这次计算的结果。
      return driveLetter + ':' + (rest || '\\').replace(/\//g, '\\')
    }
    // Handle /c/... format (MSYS2/Git Bash)
    // driveMatch匹配`posixPath.match`，供共享工具后续处理使用。
    const driveMatch = posixPath.match(/^\/([A-Za-z])(\/|$)/)
    // 满足 `driveMatch` 时，共享工具执行该分支。
    if (driveMatch) {
      // driveLetter保存`toUpperCase`，供共享工具后续处理使用。
      const driveLetter = driveMatch[1]!.toUpperCase()
      // rest格式化`posixPath.slice`，供共享工具后续处理使用。
      const rest = posixPath.slice(2)
      // 返回 `driveLetter + ':' + (rest || '\\').replace(/\//g, '\\')`，作为共享工具这次计算的结果。
      return driveLetter + ':' + (rest || '\\').replace(/\//g, '\\')
    }
    // Already Windows or relative — just flip slashes
    // 返回 `posixPath.replace(/\//g, '\\')`，作为共享工具这次计算的结果。
    return posixPath.replace(/\//g, '\\')
  },
  // 这个回调绑定到 (p: string) => p,，负责共享工具在该局部场景下的响应。
  (p: string) => p,
  500,
)
