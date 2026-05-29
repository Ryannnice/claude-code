// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 isFsInaccessible，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from '../errors.js'

// CHROME_EXTENSION_URL固定为 `'https://claude.ai/chrome'`，作为共享工具 setup Portable后续展示或比较的基准。
export const CHROME_EXTENSION_URL = 'https://claude.ai/chrome'

// Production extension ID
// PROD_EXTENSION_ID保存`'fcoeoabgfenejglbffodgkkbkcdhcgfn'`，作为后续固定文本处理的输入。
const PROD_EXTENSION_ID = 'fcoeoabgfenejglbffodgkkbkcdhcgfn'
// Dev extension IDs (for internal use)
// DEV_EXTENSION_ID 命名 `'dihbgbndebgnbjfmelmegjepbnkhlgni'`，让后续代码直接表达这个值的用途。
const DEV_EXTENSION_ID = 'dihbgbndebgnbjfmelmegjepbnkhlgni'
// ANT_EXTENSION_ID保存`'dngcpimnedloihjnnfngkgjoidhnaolf'`，作为后续固定文本处理的输入。
const ANT_EXTENSION_ID = 'dngcpimnedloihjnnfngkgjoidhnaolf'

// getExtensionIds 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getExtensionIds(): string[] {
  // 返回 `process.env.USER_TYPE === 'ant'`，作为共享工具这次计算的结果。
  return process.env.USER_TYPE === 'ant'
    ? [PROD_EXTENSION_ID, DEV_EXTENSION_ID, ANT_EXTENSION_ID]
    : [PROD_EXTENSION_ID]
}

// Must match ChromiumBrowser from common.ts
// ChromiumBrowser 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChromiumBrowser =
  | 'chrome'
  | 'brave'
  | 'arc'
  | 'chromium'
  | 'edge'
  | 'vivaldi'
  | 'opera'

// BrowserPath 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BrowserPath = {
  browser: ChromiumBrowser
  path: string
}

// Logger 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Logger = (message: string) => void

// Browser detection order - must match BROWSER_DETECTION_ORDER from common.ts
// BROWSER_DETECTION_ORDER 聚合成有序列表，保持后续遍历顺序稳定。
const BROWSER_DETECTION_ORDER: ChromiumBrowser[] = [
  'chrome',
  'brave',
  'arc',
  'edge',
  'chromium',
  'vivaldi',
  'opera',
]

// BrowserDataConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BrowserDataConfig = {
  macos: string[]
  linux: string[]
  windows: { path: string[]; useRoaming?: boolean }
}

// Must match CHROMIUM_BROWSERS dataPath from common.ts
// CHROMIUM_BROWSERS 集合 集中保存共享工具 setup Portable要一起传递的字段。
const CHROMIUM_BROWSERS: Record<ChromiumBrowser, BrowserDataConfig> = {
  chrome: {
    macos: ['Library', 'Application Support', 'Google', 'Chrome'],
    linux: ['.config', 'google-chrome'],
    windows: { path: ['Google', 'Chrome', 'User Data'] },
  },
  brave: {
    macos: ['Library', 'Application Support', 'BraveSoftware', 'Brave-Browser'],
    linux: ['.config', 'BraveSoftware', 'Brave-Browser'],
    windows: { path: ['BraveSoftware', 'Brave-Browser', 'User Data'] },
  },
  arc: {
    macos: ['Library', 'Application Support', 'Arc', 'User Data'],
    linux: [],
    windows: { path: ['Arc', 'User Data'] },
  },
  chromium: {
    macos: ['Library', 'Application Support', 'Chromium'],
    linux: ['.config', 'chromium'],
    windows: { path: ['Chromium', 'User Data'] },
  },
  edge: {
    macos: ['Library', 'Application Support', 'Microsoft Edge'],
    linux: ['.config', 'microsoft-edge'],
    windows: { path: ['Microsoft', 'Edge', 'User Data'] },
  },
  vivaldi: {
    macos: ['Library', 'Application Support', 'Vivaldi'],
    linux: ['.config', 'vivaldi'],
    windows: { path: ['Vivaldi', 'User Data'] },
  },
  opera: {
    macos: ['Library', 'Application Support', 'com.operasoftware.Opera'],
    linux: ['.config', 'opera'],
    windows: { path: ['Opera Software', 'Opera Stable'], useRoaming: true },
  },
}

/**
 * Get all browser data paths to check for extension installation.
 * Portable version that uses process.platform directly.
 */
// getAllBrowserDataPathsPortable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllBrowserDataPathsPortable(): BrowserPath[] {
  // home保存`homedir`，供共享工具后续处理使用。
  const home = homedir()
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: BrowserPath[] = []

  // 按顺序遍历 `BROWSER_DETECTION_ORDER` 中的browserId，逐个交给共享工具处理。
  for (const browserId of BROWSER_DETECTION_ORDER) {
    // 配置保存`CHROMIUM_BROWSERS[browserId]`，供共享工具 setup Portable后续判断或输出使用。
    const config = CHROMIUM_BROWSERS[browserId]
    // dataPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let dataPath: string[] | undefined

    // 按照 process.platform 的取值选择共享工具的具体处理分支。
    switch (process.platform) {
      case 'darwin':
        // dataPath 路径数据更新为 `config.macos`，确保共享工具后续读取最新状态。
        dataPath = config.macos
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'linux':
        // dataPath 路径数据更新为 `config.linux`，确保共享工具后续读取最新状态。
        dataPath = config.linux
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'win32': {
        // 满足 `config.windows.path.length > 0` 时，共享工具执行该分支。
        if (config.windows.path.length > 0) {
          // appDataBase 命名 `config.windows.useRoaming`，让后续代码直接表达这个值的用途。
          const appDataBase = config.windows.useRoaming
            ? join(home, 'AppData', 'Roaming')
            : join(home, 'AppData', 'Local')
          // 路径列表追加新条目，保持收集顺序与输入顺序一致。
          paths.push({
            browser: browserId,
            path: join(appDataBase, ...config.windows.path),
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
 * Detects if the Claude in Chrome extension is installed by checking the Extensions
 * directory across all supported Chromium-based browsers and their profiles.
 *
 * This is a portable version that can be used by both TUI and VS Code extension.
 *
 * @param browserPaths - Array of browser data paths to check (from getAllBrowserDataPaths)
 * @param log - Optional logging callback for debug messages
 * @returns Object with isInstalled boolean and the browser where the extension was found
 */
// detectExtensionInstallationPortable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectExtensionInstallationPortable(
  browserPaths: BrowserPath[],
  log?: Logger,
): Promise<{
  isInstalled: boolean
  browser: ChromiumBrowser | null
}> {
  // browserPaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (browserPaths.length === 0) {
    // 调用 log?.(`[Claude in Chrome] No browser paths to check`)，完成这一处局部操作。
    log?.(`[Claude in Chrome] No browser paths to check`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { isInstalled: false, browser: null }
  }

  // extensionIds 集合读取`getExtensionIds`，供共享工具后续处理使用。
  const extensionIds = getExtensionIds()

  // Check each browser for the extension
  // 循环处理 `const { browser, path: browserBasePath } of brows`，让共享工具逐项把同类条目按顺序走完。
  for (const { browser, path: browserBasePath } of browserPaths) {
    // browserProfileEntries 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    let browserProfileEntries = []

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // browserProfileEntries 文件数据更新为 `await readdir(browserBasePath, {`，确保共享工具后续读取最新状态。
      browserProfileEntries = await readdir(browserBasePath, {
        withFileTypes: true,
      })
    } catch (e) {
      // Browser not installed or path doesn't exist, continue to next browser
      // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
      if (isFsInaccessible(e)) continue
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }

    // profileDirs 文件数据保存`browserProfileEntries`，供共享工具 setup Portable后续判断或输出使用。
    const profileDirs = browserProfileEntries
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(entry => entry.isDirectory())
      .filter(
        // entry更新为 `> entry.name === 'Default' || entry.name.startsWith('Prof...`，确保共享工具后续读取最新状态。
        entry => entry.name === 'Default' || entry.name.startsWith('Profile '),
      )
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(entry => entry.name)

    // 满足 `profileDirs.length > 0` 时，共享工具执行该分支。
    if (profileDirs.length > 0) {
      // 共享工具 setup Portable在这里处理 `log?.(`，完成这一小步状态转换。
      log?.(
        `[Claude in Chrome] Found ${browser} profiles: ${profileDirs.join(', ')}`,
      )
    }

    // Check each profile for any of the extension IDs
    // 按顺序遍历 `profileDirs` 中的profile 文件数据，逐个交给共享工具处理。
    for (const profile of profileDirs) {
      // 按顺序遍历 `extensionIds` 中的extensionId，逐个交给共享工具处理。
      for (const extensionId of extensionIds) {
        // extensionPath 路径数据格式化`join`，供共享工具后续处理使用。
        const extensionPath = join(
          browserBasePath,
          profile,
          'Extensions',
          extensionId,
        )

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `readdir(extensionPath)` 完成，再继续共享工具 setup Portable的异步流程。
          await readdir(extensionPath)
          // 共享工具 setup Portable在这里处理 `log?.(`，完成这一小步状态转换。
          log?.(
            `[Claude in Chrome] Extension ${extensionId} found in ${browser} ${profile}`,
          )
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { isInstalled: true, browser }
        } catch {
          // Extension not found in this profile, continue checking
        }
      }
    }
  }

  // 调用 log?.(`[Claude in Chrome] Extension not found in any browser`)，完成这一处局部操作。
  log?.(`[Claude in Chrome] Extension not found in any browser`)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { isInstalled: false, browser: null }
}

/**
 * Simple wrapper that returns just the boolean result
 */
// isChromeExtensionInstalledPortable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isChromeExtensionInstalledPortable(
  browserPaths: BrowserPath[],
  log?: Logger,
): Promise<boolean> {
  // 结果读取`detectExtensionInstallationPortable`，供共享工具后续处理使用。
  const result = await detectExtensionInstallationPortable(browserPaths, log)
  // 返回 `result.isInstalled`，作为共享工具这次计算的结果。
  return result.isInstalled
}

/**
 * Convenience function that gets browser paths automatically.
 * Use this when you don't need to provide custom browser paths.
 */
// isChromeExtensionInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isChromeExtensionInstalled(log?: Logger): Promise<boolean> {
  // browserPaths 路径数据读取`getAllBrowserDataPathsPortable`，供共享工具后续处理使用。
  const browserPaths = getAllBrowserDataPathsPortable()
  // 返回 `isChromeExtensionInstalledPortable(browserPaths, log)`，作为共享工具这次计算的结果。
  return isChromeExtensionInstalledPortable(browserPaths, log)
}
