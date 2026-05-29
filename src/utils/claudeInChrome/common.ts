// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readdirSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 引入 homedir、platform、tmpdir、userInfo，将 os 中已经封装好的能力接到本文件流程里。
import { homedir, platform, tmpdir, userInfo } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 normalizeNameForMCP 服务层能力，把外部通信或共享状态交给 ../../services/mcp/normalization.js 处理。
import { normalizeNameForMCP } from '../../services/mcp/normalization.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isFsInaccessible，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from '../errors.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'

// CLAUDE_IN_CHROME_MCP_SERVER_NAME固定为 `'claude-in-chrome'`，作为共享工具 common后续展示或比较的基准。
export const CLAUDE_IN_CHROME_MCP_SERVER_NAME = 'claude-in-chrome'

// Re-export ChromiumBrowser type for setup.ts
// 导出类型定义，让其他模块沿用共享工具 common的数据契约。
export type { ChromiumBrowser } from './setupPortable.js'

// Import for local use
// 类型依赖 { ChromiumBrowser } 来自 ./setupPortable.js，用于校准共享工具的数据契约。
import type { ChromiumBrowser } from './setupPortable.js'

// BrowserConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BrowserConfig = {
  name: string
  macos: {
    appName: string
    dataPath: string[]
    nativeMessagingPath: string[]
  }
  linux: {
    binaries: string[]
    dataPath: string[]
    nativeMessagingPath: string[]
  }
  windows: {
    dataPath: string[]
    registryKey: string
    useRoaming?: boolean // Opera uses Roaming instead of Local
  }
}

// CHROMIUM_BROWSERS 集合 集中保存共享工具 common要一起传递的字段。
export const CHROMIUM_BROWSERS: Record<ChromiumBrowser, BrowserConfig> = {
  chrome: {
    name: 'Google Chrome',
    macos: {
      appName: 'Google Chrome',
      dataPath: ['Library', 'Application Support', 'Google', 'Chrome'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'Google',
        'Chrome',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['google-chrome', 'google-chrome-stable'],
      dataPath: ['.config', 'google-chrome'],
      nativeMessagingPath: ['.config', 'google-chrome', 'NativeMessagingHosts'],
    },
    windows: {
      dataPath: ['Google', 'Chrome', 'User Data'],
      registryKey: 'HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts',
    },
  },
  brave: {
    name: 'Brave',
    macos: {
      appName: 'Brave Browser',
      dataPath: [
        'Library',
        'Application Support',
        'BraveSoftware',
        'Brave-Browser',
      ],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'BraveSoftware',
        'Brave-Browser',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['brave-browser', 'brave'],
      dataPath: ['.config', 'BraveSoftware', 'Brave-Browser'],
      nativeMessagingPath: [
        '.config',
        'BraveSoftware',
        'Brave-Browser',
        'NativeMessagingHosts',
      ],
    },
    windows: {
      dataPath: ['BraveSoftware', 'Brave-Browser', 'User Data'],
      registryKey:
        'HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts',
    },
  },
  arc: {
    name: 'Arc',
    macos: {
      appName: 'Arc',
      dataPath: ['Library', 'Application Support', 'Arc', 'User Data'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'Arc',
        'User Data',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      // Arc is not available on Linux
      binaries: [],
      dataPath: [],
      nativeMessagingPath: [],
    },
    windows: {
      // Arc Windows is Chromium-based
      dataPath: ['Arc', 'User Data'],
      registryKey: 'HKCU\\Software\\ArcBrowser\\Arc\\NativeMessagingHosts',
    },
  },
  chromium: {
    name: 'Chromium',
    macos: {
      appName: 'Chromium',
      dataPath: ['Library', 'Application Support', 'Chromium'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'Chromium',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['chromium', 'chromium-browser'],
      dataPath: ['.config', 'chromium'],
      nativeMessagingPath: ['.config', 'chromium', 'NativeMessagingHosts'],
    },
    windows: {
      dataPath: ['Chromium', 'User Data'],
      registryKey: 'HKCU\\Software\\Chromium\\NativeMessagingHosts',
    },
  },
  edge: {
    name: 'Microsoft Edge',
    macos: {
      appName: 'Microsoft Edge',
      dataPath: ['Library', 'Application Support', 'Microsoft Edge'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'Microsoft Edge',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['microsoft-edge', 'microsoft-edge-stable'],
      dataPath: ['.config', 'microsoft-edge'],
      nativeMessagingPath: [
        '.config',
        'microsoft-edge',
        'NativeMessagingHosts',
      ],
    },
    windows: {
      dataPath: ['Microsoft', 'Edge', 'User Data'],
      registryKey: 'HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts',
    },
  },
  vivaldi: {
    name: 'Vivaldi',
    macos: {
      appName: 'Vivaldi',
      dataPath: ['Library', 'Application Support', 'Vivaldi'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'Vivaldi',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['vivaldi', 'vivaldi-stable'],
      dataPath: ['.config', 'vivaldi'],
      nativeMessagingPath: ['.config', 'vivaldi', 'NativeMessagingHosts'],
    },
    windows: {
      dataPath: ['Vivaldi', 'User Data'],
      registryKey: 'HKCU\\Software\\Vivaldi\\NativeMessagingHosts',
    },
  },
  opera: {
    name: 'Opera',
    macos: {
      appName: 'Opera',
      dataPath: ['Library', 'Application Support', 'com.operasoftware.Opera'],
      nativeMessagingPath: [
        'Library',
        'Application Support',
        'com.operasoftware.Opera',
        'NativeMessagingHosts',
      ],
    },
    linux: {
      binaries: ['opera'],
      dataPath: ['.config', 'opera'],
      nativeMessagingPath: ['.config', 'opera', 'NativeMessagingHosts'],
    },
    windows: {
      dataPath: ['Opera Software', 'Opera Stable'],
      registryKey:
        'HKCU\\Software\\Opera Software\\Opera Stable\\NativeMessagingHosts',
      useRoaming: true, // Opera uses Roaming AppData, not Local
    },
  },
}

// Priority order for browser detection (most common first)
// BROWSER_DETECTION_ORDER 聚合成有序列表，保持后续遍历顺序稳定。
export const BROWSER_DETECTION_ORDER: ChromiumBrowser[] = [
  'chrome',
  'brave',
  'arc',
  'edge',
  'chromium',
  'vivaldi',
  'opera',
]

/**
 * Get all browser data paths to check for extension installation
 */
// getAllBrowserDataPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllBrowserDataPaths(): {
  browser: ChromiumBrowser
  path: string
}[] {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // home保存`homedir`，供共享工具后续处理使用。
  const home = homedir()
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: { browser: ChromiumBrowser; path: string }[] = []

  // 按顺序遍历 `BROWSER_DETECTION_ORDER` 中的browserId，逐个交给共享工具处理。
  for (const browserId of BROWSER_DETECTION_ORDER) {
    // 配置读取 `CHROMIUM_BROWSERS[browserId]` 对应条目，后续围绕该成员继续处理。
    const config = CHROMIUM_BROWSERS[browserId]
    // dataPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let dataPath: string[] | undefined

    // 按照 platform 的取值选择共享工具的具体处理分支。
    switch (platform) {
      case 'macos':
        // dataPath 路径数据更新为 `config.macos.dataPath`，确保共享工具后续读取最新状态。
        dataPath = config.macos.dataPath
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'linux':
      case 'wsl':
        // dataPath 路径数据更新为 `config.linux.dataPath`，确保共享工具后续读取最新状态。
        dataPath = config.linux.dataPath
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'windows': {
        // 满足 `config.windows.dataPath.length > 0` 时，共享工具执行该分支。
        if (config.windows.dataPath.length > 0) {
          // appDataBase保存`config.windows.useRoaming`，供后续判断或组装使用。
          const appDataBase = config.windows.useRoaming
            ? join(home, 'AppData', 'Roaming')
            : join(home, 'AppData', 'Local')
          // 路径列表追加新条目，保持收集顺序与输入顺序一致。
          paths.push({
            browser: browserId,
            path: join(appDataBase, ...config.windows.dataPath),
          })
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }

    // 只有 `dataPath && dataPath.length > 0` 满足时，共享工具才执行该分支。
    if (dataPath && dataPath.length > 0) {
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push({
        browser: browserId,
        path: join(home, ...dataPath),
      })
    }
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

/**
 * Get native messaging host directories for all supported browsers
 */
// getAllNativeMessagingHostsDirs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllNativeMessagingHostsDirs(): {
  browser: ChromiumBrowser
  path: string
}[] {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // home保存`homedir`，供共享工具后续处理使用。
  const home = homedir()
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: { browser: ChromiumBrowser; path: string }[] = []

  // 按顺序遍历 `BROWSER_DETECTION_ORDER` 中的browserId，逐个交给共享工具处理。
  for (const browserId of BROWSER_DETECTION_ORDER) {
    // 配置读取 `CHROMIUM_BROWSERS[browserId]` 对应条目，后续围绕该成员继续处理。
    const config = CHROMIUM_BROWSERS[browserId]

    // 按照 platform 的取值选择共享工具的具体处理分支。
    switch (platform) {
      case 'macos':
        // 满足 `config.macos.nativeMessagingPath.length > 0` 时，共享工具执行该分支。
        if (config.macos.nativeMessagingPath.length > 0) {
          // 路径列表追加新条目，保持收集顺序与输入顺序一致。
          paths.push({
            browser: browserId,
            path: join(home, ...config.macos.nativeMessagingPath),
          })
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'linux':
      case 'wsl':
        // 满足 `config.linux.nativeMessagingPath.length > 0` 时，共享工具执行该分支。
        if (config.linux.nativeMessagingPath.length > 0) {
          // 路径列表追加新条目，保持收集顺序与输入顺序一致。
          paths.push({
            browser: browserId,
            path: join(home, ...config.linux.nativeMessagingPath),
          })
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'windows':
        // Windows uses registry, not file paths for native messaging
        // We'll use a common location for the manifest file
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

/**
 * Get Windows registry keys for all supported browsers
 */
// getAllWindowsRegistryKeys 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllWindowsRegistryKeys(): {
  browser: ChromiumBrowser
  key: string
}[] {
  // keys 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const keys: { browser: ChromiumBrowser; key: string }[] = []

  // 按顺序遍历 `BROWSER_DETECTION_ORDER` 中的browserId，逐个交给共享工具处理。
  for (const browserId of BROWSER_DETECTION_ORDER) {
    // 配置读取 `CHROMIUM_BROWSERS[browserId]` 对应条目，后续围绕该成员继续处理。
    const config = CHROMIUM_BROWSERS[browserId]
    // 满足 `config.windows.registryKey` 时，共享工具执行该分支。
    if (config.windows.registryKey) {
      // keys 集合追加新条目，保持收集顺序与输入顺序一致。
      keys.push({
        browser: browserId,
        key: config.windows.registryKey,
      })
    }
  }

  // 返回 `keys`，作为共享工具这次计算的结果。
  return keys
}

/**
 * Detect which browser to use for opening URLs
 * Returns the first available browser, or null if none found
 */
// detectAvailableBrowser 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectAvailableBrowser(): Promise<ChromiumBrowser | null> {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // 按顺序遍历 `BROWSER_DETECTION_ORDER` 中的browserId，逐个交给共享工具处理。
  for (const browserId of BROWSER_DETECTION_ORDER) {
    // 配置读取 `CHROMIUM_BROWSERS[browserId]` 对应条目，后续围绕该成员继续处理。
    const config = CHROMIUM_BROWSERS[browserId]

    // 按照 platform 的取值选择共享工具的具体处理分支。
    switch (platform) {
      case 'macos': {
        // Check if the .app bundle (a directory) exists
        // appPath 路径数据保存``/Applications/${config.macos.appName}.app``，作为后续固定文本处理的输入。
        const appPath = `/Applications/${config.macos.appName}.app`
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // stats 集合保存`stat`，供共享工具后续处理使用。
          const stats = await stat(appPath)
          // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
          if (stats.isDirectory()) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[Claude in Chrome] Detected browser: ${config.name}`,
            )
            // 返回 `browserId`，作为共享工具这次计算的结果。
            return browserId
          }
        } catch (e) {
          // 满足 `!isFsInaccessible(e)` 时，共享工具执行该分支。
          if (!isFsInaccessible(e)) throw e
          // App not found, continue checking
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'wsl':
      case 'linux': {
        // Check if any binary exists
        // 按顺序遍历 `config.linux.binaries` 中的binary，逐个交给共享工具处理。
        for (const binary of config.linux.binaries) {
          // 满足 `await which(binary).catch(() => null)` 时，共享工具执行该分支。
          if (await which(binary).catch(() => null)) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[Claude in Chrome] Detected browser: ${config.name}`,
            )
            // 返回 `browserId`，作为共享工具这次计算的结果。
            return browserId
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'windows': {
        // Check if data path exists (indicates browser is installed)
        // home保存`homedir`，供共享工具后续处理使用。
        const home = homedir()
        // 满足 `config.windows.dataPath.length > 0` 时，共享工具执行该分支。
        if (config.windows.dataPath.length > 0) {
          // appDataBase保存`config.windows.useRoaming`，供后续判断或组装使用。
          const appDataBase = config.windows.useRoaming
            ? join(home, 'AppData', 'Roaming')
            : join(home, 'AppData', 'Local')
          // dataPath 路径数据格式化`join`，供共享工具后续处理使用。
          const dataPath = join(appDataBase, ...config.windows.dataPath)
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // stats 集合保存`stat`，供共享工具后续处理使用。
            const stats = await stat(dataPath)
            // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
            if (stats.isDirectory()) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[Claude in Chrome] Detected browser: ${config.name}`,
              )
              // 返回 `browserId`，作为共享工具这次计算的结果。
              return browserId
            }
          } catch (e) {
            // 满足 `!isFsInaccessible(e)` 时，共享工具执行该分支。
            if (!isFsInaccessible(e)) throw e
            // Browser not found, continue checking
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// isClaudeInChromeMCPServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isClaudeInChromeMCPServer(name: string): boolean {
  // 返回 `normalizeNameForMCP(name) === CLAUDE_IN_CHROME_MCP_SERVER_NAME`，作为共享工具这次计算的结果。
  return normalizeNameForMCP(name) === CLAUDE_IN_CHROME_MCP_SERVER_NAME
}

// MAX_TRACKED_TABS 集合保存`200`，供共享工具 common后续判断或输出使用。
const MAX_TRACKED_TABS = 200
// trackedTabIds 集合 命名 `new Set<number>()`，让后续代码直接表达这个值的用途。
const trackedTabIds = new Set<number>()

// trackClaudeInChromeTabId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackClaudeInChromeTabId(tabId: number): void {
  // 只有 `trackedTabIds.size >= MAX_TRACKED_TABS && !trackedTabIds.has(tabId)` 满足时，共享工具才执行该分支。
  if (trackedTabIds.size >= MAX_TRACKED_TABS && !trackedTabIds.has(tabId)) {
    // 调用 trackedTabIds.clear，触发共享工具此处需要的副作用。
    trackedTabIds.clear()
  }
  // 调用 trackedTabIds.add，触发共享工具此处需要的副作用。
  trackedTabIds.add(tabId)
}

// isTrackedClaudeInChromeTabId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTrackedClaudeInChromeTabId(tabId: number): boolean {
  // 返回 `trackedTabIds.has(tabId)`，作为共享工具这次计算的结果。
  return trackedTabIds.has(tabId)
}

// openInChrome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function openInChrome(url: string): Promise<boolean> {
  // currentPlatform读取`getPlatform`，供共享工具后续处理使用。
  const currentPlatform = getPlatform()

  // Detect the best available browser
  // browser读取`detectAvailableBrowser`，供共享工具后续处理使用。
  const browser = await detectAvailableBrowser()

  // browser缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!browser) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Claude in Chrome] No compatible browser found')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 配置保存`CHROMIUM_BROWSERS[browser]`，供共享工具 common后续判断或输出使用。
  const config = CHROMIUM_BROWSERS[browser]

  // 按照 currentPlatform 的取值选择共享工具的具体处理分支。
  switch (currentPlatform) {
    case 'macos': {
      // 从 `await execFileNoThrow('open', [` 解构 code，减少共享工具 common对同一对象的重复访问。
      const { code } = await execFileNoThrow('open', [
        '-a',
        config.macos.appName,
        url,
      ])
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }
    case 'windows': {
      // Use rundll32 to avoid cmd.exe metacharacter issues with URLs containing & | > <
      // 从 `await execFileNoThrow('rundll32', ['url,OpenURL', url])` 解构 code，减少共享工具 common对同一对象的重复访问。
      const { code } = await execFileNoThrow('rundll32', ['url,OpenURL', url])
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }
    case 'wsl':
    case 'linux': {
      // 按顺序遍历 `config.linux.binaries` 中的binary，逐个交给共享工具处理。
      for (const binary of config.linux.binaries) {
        // 从 `await execFileNoThrow(binary, [url])` 解构 code，减少共享工具 common对同一对象的重复访问。
        const { code } = await execFileNoThrow(binary, [url])
        // 满足 `code === 0` 时，共享工具执行该分支。
        if (code === 0) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

/**
 * Get the socket directory path (Unix only)
 */
// getSocketDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSocketDir(): string {
  // 返回 ``/tmp/claude-mcp-browser-bridge-${getUsername()}``，作为共享工具这次计算的结果。
  return `/tmp/claude-mcp-browser-bridge-${getUsername()}`
}

/**
 * Get the socket path (Unix) or pipe name (Windows)
 */
// getSecureSocketPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSecureSocketPath(): string {
  // 当 `platform()` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (platform() === 'win32') {
    // 返回 ``\\\\.\\pipe\\${getSocketName()}``，作为共享工具这次计算的结果。
    return `\\\\.\\pipe\\${getSocketName()}`
  }
  // 返回 `join(getSocketDir(), `${process.pid}.sock`)`，作为共享工具这次计算的结果。
  return join(getSocketDir(), `${process.pid}.sock`)
}

/**
 * Get all socket paths including PID-based sockets in the directory
 * and legacy fallback paths
 */
// getAllSocketPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllSocketPaths(): string[] {
  // Windows uses named pipes, not Unix sockets
  // 当 `platform()` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (platform() === 'win32') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [`\\\\.\\pipe\\${getSocketName()}`]
  }

  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: string[] = []
  // socketDir读取`getSocketDir`，供共享工具后续处理使用。
  const socketDir = getSocketDir()

  // Scan for *.sock files in the socket directory
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- ClaudeForChromeContext.getSocketPaths (external @ant/claude-for-chrome-mcp) requires a sync () => string[] callback
    // files 文件数据读取`readdirSync`，供共享工具后续处理使用。
    const files = readdirSync(socketDir)
    // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
    for (const file of files) {
      // 满足 `file.endsWith('.sock')` 时，共享工具执行该分支。
      if (file.endsWith('.sock')) {
        // 路径列表追加新条目，保持收集顺序与输入顺序一致。
        paths.push(join(socketDir, file))
      }
    }
  } catch {
    // Directory may not exist yet
  }

  // Legacy fallback paths
  // legacyName读取`getUsername`，供共享工具后续处理使用。
  const legacyName = `claude-mcp-browser-bridge-${getUsername()}`
  // legacyTmpdir格式化`join`，供共享工具后续处理使用。
  const legacyTmpdir = join(tmpdir(), legacyName)
  // legacyTmp 命名 ``/tmp/${legacyName}``，让后续代码直接表达这个值的用途。
  const legacyTmp = `/tmp/${legacyName}`

  // 满足 `!paths.includes(legacyTmpdir)` 时，共享工具执行该分支。
  if (!paths.includes(legacyTmpdir)) {
    // 路径列表追加新条目，保持收集顺序与输入顺序一致。
    paths.push(legacyTmpdir)
  }
  // `legacyTmpdir` 与 `legacyTmp && !paths.includes(le...` 不一致时刷新派生状态，避免使用过期结果。
  if (legacyTmpdir !== legacyTmp && !paths.includes(legacyTmp)) {
    // 路径列表追加新条目，保持收集顺序与输入顺序一致。
    paths.push(legacyTmp)
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

// getSocketName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSocketName(): string {
  // NOTE: This must match the one used in the Claude in Chrome MCP
  // 返回 ``claude-mcp-browser-bridge-${getUsername()}``，作为共享工具这次计算的结果。
  return `claude-mcp-browser-bridge-${getUsername()}`
}

// getUsername 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUsername(): string {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `userInfo().username || 'default'`，作为共享工具这次计算的结果。
    return userInfo().username || 'default'
  } catch {
    // 返回 `process.env.USER || process.env.USERNAME || 'default'`，作为共享工具这次计算的结果。
    return process.env.USER || process.env.USERNAME || 'default'
  }
}
