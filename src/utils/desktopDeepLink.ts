// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 coerce as semverCoerce，将 semver 中已经封装好的能力接到本文件流程里。
import { coerce as semverCoerce } from 'semver'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 pathExists，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from './file.js'
// 引入 gte as semverGte，将 ./semver.js 中已经封装好的能力接到本文件流程里。
import { gte as semverGte } from './semver.js'

// MIN_DESKTOP_VERSION保存`'1.1.2396'`，作为后续固定文本处理的输入。
const MIN_DESKTOP_VERSION = '1.1.2396'

// isDevMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDevMode(): boolean {
  // 当 `(process.env.NODE_ENV as string)` 匹配 `'development'` 时，共享工具执行对应分支。
  if ((process.env.NODE_ENV as string) === 'development') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Local builds from build directories are dev mode even with NODE_ENV=production
  // pathsToCheck 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
  const pathsToCheck = [process.argv[1] || '', process.execPath || '']
  // buildDirs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const buildDirs = [
    '/build-ant/',
    '/build-ant-native/',
    '/build-external/',
    '/build-external-native/',
  ]

  // 返回 `pathsToCheck.some(p => buildDirs.some(dir => p.includes(dir)))`，作为共享工具这次计算的结果。
  return pathsToCheck.some(p => buildDirs.some(dir => p.includes(dir)))
}

/**
 * Builds a deep link URL for Claude Desktop to resume a CLI session.
 * Format: claude://resume?session={sessionId}&cwd={cwd}
 * In dev mode: claude-dev://resume?session={sessionId}&cwd={cwd}
 */
// buildDesktopDeepLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildDesktopDeepLink(sessionId: string): string {
  // protocol保存`isDevMode`，供共享工具后续处理使用。
  const protocol = isDevMode() ? 'claude-dev' : 'claude'
  // URL保存`URL`，供共享工具后续处理使用。
  const url = new URL(`${protocol}://resume`)
  // url.searchParams.set 写入新的状态值，使共享工具后续读取保持一致。
  url.searchParams.set('session', sessionId)
  // url.searchParams.set 写入新的状态值，使共享工具后续读取保持一致。
  url.searchParams.set('cwd', getCwd())
  // 返回 `url.toString()`，作为共享工具这次计算的结果。
  return url.toString()
}

/**
 * Check if Claude Desktop app is installed.
 * On macOS, checks for /Applications/Claude.app.
 * On Linux, checks if xdg-open can handle claude:// protocol.
 * On Windows, checks if the protocol handler exists.
 * In dev mode, always returns true (assumes dev Desktop is running).
 */
// isDesktopInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isDesktopInstalled(): Promise<boolean> {
  // In dev mode, assume the dev Desktop app is running
  // 满足 `isDevMode()` 时，共享工具执行该分支。
  if (isDevMode()) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // platform保存`process.platform`，供后续判断或组装使用。
  const platform = process.platform

  // 当 `platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (platform === 'darwin') {
    // Check for Claude.app in /Applications
    // 返回 `pathExists('/Applications/Claude.app')`，作为共享工具这次计算的结果。
    return pathExists('/Applications/Claude.app')
  // 共享工具 desktop Deep Link在这里处理 `} else if (platform === 'linux') {`，完成这一小步状态转换。
  } else if (platform === 'linux') {
    // Check if xdg-mime can find a handler for claude://
    // Note: xdg-mime returns exit code 0 even with no handler, so check stdout too
    // 从 `await execFileNoThrow('xdg-mime', [` 解构 code、stdout，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code, stdout } = await execFileNoThrow('xdg-mime', [
      'query',
      'default',
      'x-scheme-handler/claude',
    ])
    // 返回 `code === 0 && stdout.trim().length > 0`，作为共享工具这次计算的结果。
    return code === 0 && stdout.trim().length > 0
  // 共享工具 desktop Deep Link在这里处理 `} else if (platform === 'win32') {`，完成这一小步状态转换。
  } else if (platform === 'win32') {
    // On Windows, try to query the registry for the protocol handler
    // 从 `await execFileNoThrow('reg', [` 解构 code，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code } = await execFileNoThrow('reg', [
      'query',
      'HKEY_CLASSES_ROOT\\claude',
      '/ve',
    ])
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Detect the installed Claude Desktop version.
 * On macOS, reads CFBundleShortVersionString from the app plist.
 * On Windows, finds the highest app-X.Y.Z directory in the Squirrel install.
 * Returns null if version cannot be determined.
 */
// getDesktopVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getDesktopVersion(): Promise<string | null> {
  // platform保存`process.platform`，供后续判断或组装使用。
  const platform = process.platform

  // 当 `platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (platform === 'darwin') {
    // 从 `await execFileNoThrow('defaults', [` 解构 code、stdout，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code, stdout } = await execFileNoThrow('defaults', [
      'read',
      '/Applications/Claude.app/Contents/Info.plist',
      'CFBundleShortVersionString',
    ])
    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // version格式化`stdout.trim`，供共享工具后续处理使用。
    const version = stdout.trim()
    // 返回 `version.length > 0 ? version : null`，作为共享工具这次计算的结果。
    return version.length > 0 ? version : null
  // 共享工具 desktop Deep Link在这里处理 `} else if (platform === 'win32') {`，完成这一小步状态转换。
  } else if (platform === 'win32') {
    // localAppData 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const localAppData = process.env.LOCALAPPDATA
    // localAppData缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!localAppData) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // installDir格式化`join`，供共享工具后续处理使用。
    const installDir = join(localAppData, 'AnthropicClaude')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合读取`readdir`，供共享工具后续处理使用。
      const entries = await readdir(installDir)
      // versions 集合保存`entries`，供共享工具 desktop Deep Link后续判断或输出使用。
      const versions = entries
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(e => e.startsWith('app-'))
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(e => e.slice(4))
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(v => semverCoerce(v) !== null)
        // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
        .sort((a, b) => {
          // ca保存`semverCoerce`，供共享工具后续处理使用。
          const ca = semverCoerce(a)!
          // cb保存`semverCoerce`，供共享工具后续处理使用。
          const cb = semverCoerce(b)!
          // 返回 `ca.compare(cb)`，作为共享工具这次计算的结果。
          return ca.compare(cb)
        })
      // 返回 `versions.length > 0 ? versions[versions.length - 1]! : null`，作为共享工具这次计算的结果。
      return versions.length > 0 ? versions[versions.length - 1]! : null
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// DesktopInstallStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DesktopInstallStatus =
  | { status: 'not-installed' }
  | { status: 'version-too-old'; version: string }
  | { status: 'ready'; version: string }

/**
 * Check Desktop install status including version compatibility.
 */
// getDesktopInstallStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getDesktopInstallStatus(): Promise<DesktopInstallStatus> {
  // installed保存`isDesktopInstalled`，供共享工具后续处理使用。
  const installed = await isDesktopInstalled()
  // installed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!installed) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'not-installed' }
  }

  // version 先占位，稍后的条件分支会根据实际输入补齐它。
  let version: string | null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // version更新为 `await getDesktopVersion()`，确保共享工具后续读取最新状态。
    version = await getDesktopVersion()
  } catch {
    // Best effort — proceed with handoff if version detection fails
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'ready', version: 'unknown' }
  }

  // version缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!version) {
    // Can't determine version — assume it's ready (dev mode or unknown install)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'ready', version: 'unknown' }
  }

  // coerced保存`semverCoerce`，供共享工具后续处理使用。
  const coerced = semverCoerce(version)
  // 只有 `!coerced || !semverGte(coerced.version, MIN_DESKTOP_VERSION)` 满足时，共享工具才执行该分支。
  if (!coerced || !semverGte(coerced.version, MIN_DESKTOP_VERSION)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'version-too-old', version }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { status: 'ready', version }
}

/**
 * Opens a deep link URL using the platform-specific mechanism.
 * Returns true if the command succeeded, false otherwise.
 */
// openDeepLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function openDeepLink(deepLinkUrl: string): Promise<boolean> {
  // platform保存`process.platform`，供后续判断或组装使用。
  const platform = process.platform
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Opening deep link: ${deepLinkUrl}`)

  // 当 `platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (platform === 'darwin') {
    // 满足 `isDevMode()` 时，共享工具执行该分支。
    if (isDevMode()) {
      // In dev mode, `open` launches a bare Electron binary (without app code)
      // because setAsDefaultProtocolClient registers just the Electron executable.
      // Use AppleScript to route the URL to the already-running Electron app.
      // 从 `await execFileNoThrow('osascript', [` 解构 code，减少共享工具 desktop Deep Link对同一对象的重复访问。
      const { code } = await execFileNoThrow('osascript', [
        '-e',
        `tell application "Electron" to open location "${deepLinkUrl}"`,
      ])
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }
    // 从 `await execFileNoThrow('open', [deepLinkUrl])` 解构 code，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code } = await execFileNoThrow('open', [deepLinkUrl])
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  // 共享工具 desktop Deep Link在这里处理 `} else if (platform === 'linux') {`，完成这一小步状态转换。
  } else if (platform === 'linux') {
    // 从 `await execFileNoThrow('xdg-open', [deepLinkUrl])` 解构 code，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code } = await execFileNoThrow('xdg-open', [deepLinkUrl])
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  // 共享工具 desktop Deep Link在这里处理 `} else if (platform === 'win32') {`，完成这一小步状态转换。
  } else if (platform === 'win32') {
    // On Windows, use cmd /c start to open URLs
    // 从 `await execFileNoThrow('cmd', [` 解构 code，减少共享工具 desktop Deep Link对同一对象的重复访问。
    const { code } = await execFileNoThrow('cmd', [
      '/c',
      'start',
      '',
      deepLinkUrl,
    ])
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Build and open a deep link to resume the current session in Claude Desktop.
 * Returns an object with success status and any error message.
 */
// openCurrentSessionInDesktop 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function openCurrentSessionInDesktop(): Promise<{
  success: boolean
  error?: string
  deepLinkUrl?: string
}> {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()

  // Check if Desktop is installed
  // installed保存`isDesktopInstalled`，供共享工具后续处理使用。
  const installed = await isDesktopInstalled()
  // installed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!installed) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error:
        'Claude Desktop is not installed. Install it from https://claude.ai/download',
    }
  }

  // Build and open the deep link
  // deepLinkUrl构建`buildDesktopDeepLink`，供共享工具后续处理使用。
  const deepLinkUrl = buildDesktopDeepLink(sessionId)
  // opened保存`openDeepLink`，供共享工具后续处理使用。
  const opened = await openDeepLink(deepLinkUrl)

  // opened缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!opened) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: 'Failed to open Claude Desktop. Please try opening it manually.',
      deepLinkUrl,
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { success: true, deepLinkUrl }
}
