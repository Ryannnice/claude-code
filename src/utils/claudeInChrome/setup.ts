// 引入 BROWSER_TOOLS，将 @ant/claude-for-chrome-mcp 中已经封装好的能力接到本文件流程里。
import { BROWSER_TOOLS } from '@ant/claude-for-chrome-mcp'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, mkdir, readFile, writeFile } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 fileURLToPath，将 url 中已经封装好的能力接到本文件流程里。
import { fileURLToPath } from 'url'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getIsInteractive,
  getIsNonInteractiveSession,
  getSessionBypassPermissionsMode,
} from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 类型依赖 { ScopedMcpServerConfig } 来自 ../../services/mcp/types.js，用于校准共享工具的数据契约。
import type { ScopedMcpServerConfig } from '../../services/mcp/types.js'
// 引入 isInBundledMode，将 ../bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from '../bundledMode.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getClaudeConfigHomeDir,
  isEnvDefinedFalsy,
  isEnvTruthy,
} from '../envUtils.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_IN_CHROME_MCP_SERVER_NAME,
  getAllBrowserDataPaths,
  getAllNativeMessagingHostsDirs,
  getAllWindowsRegistryKeys,
  openInChrome,
} from './common.js'
// 引入 getChromeSystemPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getChromeSystemPrompt } from './prompt.js'
// 引入 isChromeExtensionInstalledPortable，将 ./setupPortable.js 中已经封装好的能力接到本文件流程里。
import { isChromeExtensionInstalledPortable } from './setupPortable.js'

// CHROME_EXTENSION_RECONNECT_URL保存`'https://clau.de/chrome/reconnect'`，作为后续固定文本处理的输入。
const CHROME_EXTENSION_RECONNECT_URL = 'https://clau.de/chrome/reconnect'

// NATIVE_HOST_IDENTIFIER固定为 `'com.anthropic.claude_code_browser_extension'`，作为共享工具 setup后续展示或比较的基准。
const NATIVE_HOST_IDENTIFIER = 'com.anthropic.claude_code_browser_extension'
// NATIVE_HOST_MANIFEST_NAME保存``${NATIVE_HOST_IDENTIFIER}.json``，作为后续固定文本处理的输入。
const NATIVE_HOST_MANIFEST_NAME = `${NATIVE_HOST_IDENTIFIER}.json`

// shouldEnableClaudeInChrome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldEnableClaudeInChrome(chromeFlag?: boolean): boolean {
  // Disable by default in non-interactive sessions (e.g., SDK, CI)
  // `getIsNonInteractiveSession() && chromeFlag` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
  if (getIsNonInteractiveSession() && chromeFlag !== true) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check CLI flags
  // 满足 `chromeFlag === true` 时，共享工具执行该分支。
  if (chromeFlag === true) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `chromeFlag === false` 时，共享工具执行该分支。
  if (chromeFlag === false) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check environment variables
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_CFC)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_CFC)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_CFC)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_CFC)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check default config settings
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // `config.claudeInChromeDefaultEnabled` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (config.claudeInChromeDefaultEnabled !== undefined) {
    // 返回 `config.claudeInChromeDefaultEnabled`，作为共享工具这次计算的结果。
    return config.claudeInChromeDefaultEnabled
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// shouldAutoEnable标记共享工具 setup是否启用对应路径。
let shouldAutoEnable: boolean | undefined = undefined

// shouldAutoEnableClaudeInChrome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAutoEnableClaudeInChrome(): boolean {
  // `shouldAutoEnable` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (shouldAutoEnable !== undefined) {
    // 返回 `shouldAutoEnable`，作为共享工具这次计算的结果。
    return shouldAutoEnable
  }

  // 共享工具 setup在这里处理 `shouldAutoEnable =`，完成这一小步状态转换。
  shouldAutoEnable =
    getIsInteractive() &&
    isChromeExtensionInstalled_CACHED_MAY_BE_STALE() &&
    (process.env.USER_TYPE === 'ant' ||
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_chrome_auto_enable', false))

  // 返回 `shouldAutoEnable`，作为共享工具这次计算的结果。
  return shouldAutoEnable
}

/**
 * Setup Claude in Chrome MCP server and tools
 *
 * @returns MCP config and allowed tools, or throws an error if platform is unsupported
 */
// setupClaudeInChrome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setupClaudeInChrome(): {
  mcpConfig: Record<string, ScopedMcpServerConfig>
  allowedTools: string[]
  systemPrompt: string
} {
  // isNativeBuild记录 `isInBundledMode` 是否成立，共享工具随后按该结果分支。
  const isNativeBuild = isInBundledMode()
  // allowedTools 集合派生`BROWSER_TOOLS.map`，供共享工具后续处理使用。
  const allowedTools = BROWSER_TOOLS.map(
    // 工具更新为 `> `mcp__claude-in-chrome__${tool.name}``，确保共享工具后续读取最新状态。
    tool => `mcp__claude-in-chrome__${tool.name}`,
  )

  // env 从空对象开始收集键值，后续按名称补齐内容。
  const env: Record<string, string> = {}
  // 满足 `getSessionBypassPermissionsMode()` 时，共享工具执行该分支。
  if (getSessionBypassPermissionsMode()) {
    // CLAUDE_CHROME_PERMISSION_MODE 权限数据更新为 `'skip_all_permission_checks'`，确保共享工具后续读取最新状态。
    env.CLAUDE_CHROME_PERMISSION_MODE = 'skip_all_permission_checks'
  }
  // hasEnv记录 `Object.keys` 是否成立，共享工具随后按该结果分支。
  const hasEnv = Object.keys(env).length > 0

  // 满足 `isNativeBuild` 时，共享工具执行该分支。
  if (isNativeBuild) {
    // Create a wrapper script that calls the same binary with --chrome-native-host. This
    // is needed because the native host manifest "path" field cannot contain arguments.
    // execCommand 命令数据 命名 ``"${process.execPath}" --chrome-native-host``，让后续代码直接表达这个值的用途。
    const execCommand = `"${process.execPath}" --chrome-native-host`

    // Run asynchronously without blocking; best-effort so swallow errors
    // 显式忽略 `createWrapperScript(execCommand)` 的返回值，只保留它触发的副作用。
    void createWrapperScript(execCommand)
      // 链式调用 then，继续加工上一行在共享工具中产生的数据。
      .then(manifestBinaryPath =>
        installChromeNativeHostManifest(manifestBinaryPath),
      )
      // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
      .catch(e =>
        logForDebugging(
          `[Claude in Chrome] Failed to install native host: ${e}`,
          { level: 'error' },
        ),
      )

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      mcpConfig: {
        [CLAUDE_IN_CHROME_MCP_SERVER_NAME]: {
          type: 'stdio' as const,
          command: process.execPath,
          args: ['--claude-in-chrome-mcp'],
          scope: 'dynamic' as const,
          ...(hasEnv && { env }),
        },
      },
      allowedTools,
      systemPrompt: getChromeSystemPrompt(),
    }
  } else {
    // __filename 文件数据保存`fileURLToPath`，供共享工具后续处理使用。
    const __filename = fileURLToPath(import.meta.url)
    // __dirname格式化`join`，供共享工具后续处理使用。
    const __dirname = join(__filename, '..')
    // cliPath 路径数据格式化`join`，供共享工具后续处理使用。
    const cliPath = join(__dirname, 'cli.js')

    // 显式忽略 `createWrapperScript(` 的返回值，只保留它触发的副作用。
    void createWrapperScript(
      `"${process.execPath}" "${cliPath}" --chrome-native-host`,
    )
      // 链式调用 then，继续加工上一行在共享工具中产生的数据。
      .then(manifestBinaryPath =>
        installChromeNativeHostManifest(manifestBinaryPath),
      )
      // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
      .catch(e =>
        logForDebugging(
          `[Claude in Chrome] Failed to install native host: ${e}`,
          { level: 'error' },
        ),
      )

    // mcpConfig 配置集中保存共享工具 setup要一起传递的字段。
    const mcpConfig = {
      [CLAUDE_IN_CHROME_MCP_SERVER_NAME]: {
        type: 'stdio' as const,
        command: process.execPath,
        args: [`${cliPath}`, '--claude-in-chrome-mcp'],
        scope: 'dynamic' as const,
        ...(hasEnv && { env }),
      },
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      mcpConfig,
      allowedTools,
      systemPrompt: getChromeSystemPrompt(),
    }
  }
}

/**
 * Get native messaging hosts directories for all supported browsers
 * Returns an array of directories where the native host manifest should be installed
 */
// getNativeMessagingHostsDirs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNativeMessagingHostsDirs(): string[] {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // 当 `platform` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (platform === 'windows') {
    // Windows uses a single location with registry entries pointing to it
    // home保存`homedir`，供共享工具后续处理使用。
    const home = homedir()
    // appData格式化`join`，供共享工具后续处理使用。
    const appData = process.env.APPDATA || join(home, 'AppData', 'Local')
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [join(appData, 'Claude Code', 'ChromeNativeHost')]
  }

  // macOS and Linux: return all browser native messaging directories
  // 返回 `getAllNativeMessagingHostsDirs().map(({ path }) => path)`，作为共享工具这次计算的结果。
  return getAllNativeMessagingHostsDirs().map(({ path }) => path)
}

// installChromeNativeHostManifest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installChromeNativeHostManifest(
  manifestBinaryPath: string,
): Promise<void> {
  // manifestDirs 集合读取`getNativeMessagingHostsDirs`，供共享工具后续处理使用。
  const manifestDirs = getNativeMessagingHostsDirs()
  // manifestDirs 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (manifestDirs.length === 0) {
    // 抛出 Error('Claude in Chrome Native Host not supported on this platform')，阻止共享工具在无效状态下继续运行。
    throw Error('Claude in Chrome Native Host not supported on this platform')
  }

  // manifest集中保存共享工具 setup要一起传递的字段。
  const manifest = {
    name: NATIVE_HOST_IDENTIFIER,
    description: 'Claude Code Browser Extension Native Host',
    path: manifestBinaryPath,
    type: 'stdio',
    allowed_origins: [
      `chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/`, // PROD_EXTENSION_ID
      ...(process.env.USER_TYPE === 'ant'
        ? [
            'chrome-extension://dihbgbndebgnbjfmelmegjepbnkhlgni/', // DEV_EXTENSION_ID
            'chrome-extension://dngcpimnedloihjnnfngkgjoidhnaolf/', // ANT_EXTENSION_ID
          ]
        : []),
    ],
  }

  // manifestContent保存`jsonStringify`，供共享工具后续处理使用。
  const manifestContent = jsonStringify(manifest, null, 2)
  // anyManifestUpdated标记共享工具 setup是否启用对应路径。
  let anyManifestUpdated = false

  // Install manifest to all browser directories
  // 按顺序遍历 `manifestDirs` 中的manifestDir，逐个交给共享工具处理。
  for (const manifestDir of manifestDirs) {
    // manifestPath 路径数据格式化`join`，供共享工具后续处理使用。
    const manifestPath = join(manifestDir, NATIVE_HOST_MANIFEST_NAME)

    // Check if content matches to avoid unnecessary writes
    // existingContent读取`readFile`，供共享工具后续处理使用。
    const existingContent = await readFile(manifestPath, 'utf-8').catch(
      // 这个回调绑定到 () => null,，负责共享工具在该局部场景下的响应。
      () => null,
    )
    // 满足 `existingContent === manifestContent` 时，共享工具执行该分支。
    if (existingContent === manifestContent) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `mkdir(manifestDir, { recursive: true })` 完成，再继续共享工具 setup的异步流程。
      await mkdir(manifestDir, { recursive: true })
      // 等待 `writeFile(manifestPath, manifestContent)` 完成，再继续共享工具 setup的异步流程。
      await writeFile(manifestPath, manifestContent)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Claude in Chrome] Installed native host manifest at: ${manifestPath}`,
      )
      // anyManifestUpdated更新为 `true`，确保共享工具后续读取最新状态。
      anyManifestUpdated = true
    } catch (error) {
      // Log but don't fail - the browser might not be installed
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Claude in Chrome] Failed to install manifest at ${manifestPath}: ${error}`,
      )
    }
  }

  // Windows requires registry entries pointing to the manifest for each browser
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // manifestPath 路径数据格式化`join`，供共享工具后续处理使用。
    const manifestPath = join(manifestDirs[0]!, NATIVE_HOST_MANIFEST_NAME)
    // 调用 registerWindowsNativeHosts，触发共享工具此处需要的副作用。
    registerWindowsNativeHosts(manifestPath)
  }

  // Restart the native host if we have rewritten any manifest
  // 满足 `anyManifestUpdated` 时，共享工具执行该分支。
  if (anyManifestUpdated) {
    // 这个回调绑定到 void isChromeExtensionInstalled().then(isInstalled => {，负责共享工具在该局部场景下的响应。
    void isChromeExtensionInstalled().then(isInstalled => {
      // 满足 `isInstalled` 时，共享工具执行该分支。
      if (isInstalled) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Claude in Chrome] First-time install detected, opening reconnect page in browser`,
        )
        // 显式忽略 `openInChrome(CHROME_EXTENSION_RECONNECT_URL)` 的返回值，只保留它触发的副作用。
        void openInChrome(CHROME_EXTENSION_RECONNECT_URL)
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Claude in Chrome] First-time install detected, but extension not installed, skipping reconnect`,
        )
      }
    })
  }
}

/**
 * Register the native host in Windows registry for all supported browsers
 */
// registerWindowsNativeHosts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function registerWindowsNativeHosts(manifestPath: string): void {
  // registryKeys 集合读取`getAllWindowsRegistryKeys`，供共享工具后续处理使用。
  const registryKeys = getAllWindowsRegistryKeys()

  // 循环处理 `const { browser, key } of registryKeys`，让共享工具逐项把同类条目按顺序走完。
  for (const { browser, key } of registryKeys) {
    // fullKey保存``${key}\\${NATIVE_HOST_IDENTIFIER}``，作为后续固定文本处理的输入。
    const fullKey = `${key}\\${NATIVE_HOST_IDENTIFIER}`
    // Use reg.exe to add the registry entry
    // https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
    // 显式忽略 `execFileNoThrowWithCwd('reg', [` 的返回值，只保留它触发的副作用。
    void execFileNoThrowWithCwd('reg', [
      'add',
      fullKey,
      '/ve', // Set the default (unnamed) value
      '/t',
      'REG_SZ',
      '/d',
      manifestPath,
      '/f', // Force overwrite without prompt
    // 这个回调绑定到 ]).then(result => {，负责共享工具在该局部场景下的响应。
    ]).then(result => {
      // 满足 `result.code === 0` 时，共享工具执行该分支。
      if (result.code === 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Claude in Chrome] Registered native host for ${browser} in Windows registry: ${fullKey}`,
        )
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Claude in Chrome] Failed to register native host for ${browser} in Windows registry: ${result.stderr}`,
        )
      }
    })
  }
}

/**
 * Create a wrapper script in ~/.claude/chrome/ that invokes the given command. This is
 * necessary because Chrome's native host manifest "path" field cannot contain arguments.
 *
 * @param command - The full command to execute (e.g., "/path/to/claude --chrome-native-host")
 * @returns The path to the wrapper script
 */
// createWrapperScript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createWrapperScript(command: string): Promise<string> {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // chromeDir格式化`join`，供共享工具后续处理使用。
  const chromeDir = join(getClaudeConfigHomeDir(), 'chrome')
  // wrapperPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wrapperPath =
    platform === 'windows'
      ? join(chromeDir, 'chrome-native-host.bat')
      : join(chromeDir, 'chrome-native-host')

  // scriptContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const scriptContent =
    platform === 'windows'
      ? `@echo off
REM Chrome native host wrapper script
REM Generated by Claude Code - do not edit manually
${command}
`
      : `#!/bin/sh
# Chrome native host wrapper script
# Generated by Claude Code - do not edit manually
exec ${command}
`

  // Check if content matches to avoid unnecessary writes
  // existingContent读取`readFile`，供共享工具后续处理使用。
  const existingContent = await readFile(wrapperPath, 'utf-8').catch(() => null)
  // 满足 `existingContent === scriptContent` 时，共享工具执行该分支。
  if (existingContent === scriptContent) {
    // 返回 `wrapperPath`，作为共享工具这次计算的结果。
    return wrapperPath
  }

  // 等待 `mkdir(chromeDir, { recursive: true })` 完成，再继续共享工具 setup的异步流程。
  await mkdir(chromeDir, { recursive: true })
  // 等待 `writeFile(wrapperPath, scriptContent)` 完成，再继续共享工具 setup的异步流程。
  await writeFile(wrapperPath, scriptContent)

  // `platform` 与 `'windows'` 不一致时刷新派生状态，避免使用过期结果。
  if (platform !== 'windows') {
    // 等待 `chmod(wrapperPath, 0o755)` 完成，再继续共享工具 setup的异步流程。
    await chmod(wrapperPath, 0o755)
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Claude in Chrome] Created Chrome native host wrapper script: ${wrapperPath}`,
  )
  // 返回 `wrapperPath`，作为共享工具这次计算的结果。
  return wrapperPath
}

/**
 * Get cached value of whether Chrome extension is installed. Returns
 * from disk cache immediately, updates cache in background.
 *
 * Use this for sync/startup-critical paths where blocking on filesystem
 * access is not acceptable. The value may be stale if the cache hasn't
 * been updated recently.
 *
 * Only positive detections are persisted. A negative result from the
 * filesystem scan is not cached, because it may come from a machine that
 * shares ~/.claude.json but has no local Chrome (e.g. a remote dev
 * environment using the bridge), and caching it would permanently poison
 * auto-enable for every session on every machine that reads that config.
 */
// isChromeExtensionInstalled_CACHED_MAY_BE_STALE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isChromeExtensionInstalled_CACHED_MAY_BE_STALE(): boolean {
  // Update cache in background without blocking
  // 这个回调绑定到 void isChromeExtensionInstalled().then(isInstalled => {，负责共享工具在该局部场景下的响应。
  void isChromeExtensionInstalled().then(isInstalled => {
    // Only persist positive detections — see docstring. The cost of a stale
    // `true` is one silent MCP connection attempt per session; the cost of a
    // stale `false` is auto-enable never working again without manual repair.
    // isInstalled缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!isInstalled) {
      // 共享工具 setup在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const config = getGlobalConfig()
    // `config.cachedChromeExtensionInstalled` 与 `isInsta` 不一致时刷新派生状态，避免使用过期结果。
    if (config.cachedChromeExtensionInstalled !== isInstalled) {
      // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
      saveGlobalConfig(prev => ({
        ...prev,
        cachedChromeExtensionInstalled: isInstalled,
      }))
    }
  })

  // Return cached value immediately from disk
  // cached 缓存读取`getGlobalConfig`，供共享工具后续处理使用。
  const cached = getGlobalConfig().cachedChromeExtensionInstalled
  // 返回 `cached ?? false`，作为共享工具这次计算的结果。
  return cached ?? false
}

/**
 * Detects if the Claude in Chrome extension is installed by checking the Extensions
 * directory across all supported Chromium-based browsers and their profiles.
 *
 * @returns Object with isInstalled boolean and the browser where the extension was found
 */
// isChromeExtensionInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isChromeExtensionInstalled(): Promise<boolean> {
  // browserPaths 路径数据读取`getAllBrowserDataPaths`，供共享工具后续处理使用。
  const browserPaths = getAllBrowserDataPaths()
  // browserPaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (browserPaths.length === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Claude in Chrome] Unsupported platform for extension detection: ${getPlatform()}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `isChromeExtensionInstalledPortable(browserPaths, logForDebugging)`，作为共享工具这次计算的结果。
  return isChromeExtensionInstalledPortable(browserPaths, logForDebugging)
}
