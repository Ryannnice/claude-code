// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, realpath } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { delimiter, join, posix, win32 } from 'path'
// 引入 checkGlobalInstallPermissions，将 ./autoUpdater.js 中已经封装好的能力接到本文件流程里。
import { checkGlobalInstallPermissions } from './autoUpdater.js'
// 引入 isInBundledMode，将 ./bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from './bundledMode.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  formatAutoUpdaterDisabledReason,
  getAutoUpdaterDisabledReason,
  getGlobalConfig,
  type InstallMethod,
} from './config.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getShellType,
  isRunningFromLocalInstallation,
  localInstallationExists,
} from './localInstaller.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  detectApk,
  detectAsdf,
  detectDeb,
  detectHomebrew,
  detectMise,
  detectPacman,
  detectRpm,
  detectWinget,
  getPackageManager,
} from './nativeInstaller/packageManagers.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 getRipgrepStatus，将 ./ripgrep.js 中已经封装好的能力接到本文件流程里。
import { getRipgrepStatus } from './ripgrep.js'
// 引入 SandboxManager，将 ./sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from './sandbox/sandbox-adapter.js'
// 引入 getManagedFilePath，将 ./settings/managedPath.js 中已经封装好的能力接到本文件流程里。
import { getManagedFilePath } from './settings/managedPath.js'
// 引入 CUSTOMIZATION_SURFACES，将 ./settings/types.js 中已经封装好的能力接到本文件流程里。
import { CUSTOMIZATION_SURFACES } from './settings/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findClaudeAlias,
  findValidClaudeAlias,
  getShellConfigPaths,
} from './shellConfig.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'
// 引入 which，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { which } from './which.js'

// InstallationType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallationType =
  | 'npm-global'
  | 'npm-local'
  | 'native'
  | 'package-manager'
  | 'development'
  | 'unknown'

// DiagnosticInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DiagnosticInfo = {
  installationType: InstallationType
  version: string
  installationPath: string
  invokedBinary: string
  configInstallMethod: InstallMethod | 'not set'
  autoUpdates: string
  hasUpdatePermissions: boolean | null
  multipleInstallations: Array<{ type: string; path: string }>
  warnings: Array<{ issue: string; fix: string }>
  recommendation?: string
  packageManager?: string
  ripgrepStatus: {
    working: boolean
    mode: 'system' | 'builtin' | 'embedded'
    systemPath: string | null
  }
}

// getNormalizedPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNormalizedPaths(): [invokedPath: string, execPath: string] {
  // invokedPath 路径数据标记共享工具 doctor Diagnostic是否启用对应路径。
  let invokedPath = process.argv[1] || ''
  // execPath 路径数据标记共享工具 doctor Diagnostic是否启用对应路径。
  let execPath = process.execPath || process.argv[0] || ''

  // On Windows, convert backslashes to forward slashes for consistent path matching
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // invokedPath 路径数据更新为 `invokedPath.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
    invokedPath = invokedPath.split(win32.sep).join(posix.sep)
    // execPath 路径数据更新为 `execPath.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
    execPath = execPath.split(win32.sep).join(posix.sep)
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [invokedPath, execPath]
}

// getCurrentInstallationType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCurrentInstallationType(): Promise<InstallationType> {
  // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'development') {
    // 返回 `'development'`，作为共享工具这次计算的结果。
    return 'development'
  }

  // 从 `getNormalizedPaths()` 按位置拆出 invokedPath，让共享工具 doctor Diagnostic分别处理这些返回值。
  const [invokedPath] = getNormalizedPaths()

  // Check if running in bundled mode first
  // 满足 `isInBundledMode()` 时，共享工具执行该分支。
  if (isInBundledMode()) {
    // Check if this bundled instance was installed by a package manager
    // 共享工具在这里按实际状态进入对应分支。
    if (
      detectHomebrew() ||
      detectWinget() ||
      detectMise() ||
      detectAsdf() ||
      (await detectPacman()) ||
      (await detectDeb()) ||
      (await detectRpm()) ||
      (await detectApk())
    ) {
      // 返回 `'package-manager'`，作为共享工具这次计算的结果。
      return 'package-manager'
    }
    // 返回 `'native'`，作为共享工具这次计算的结果。
    return 'native'
  }

  // Check if running from local npm installation
  // 满足 `isRunningFromLocalInstallation()` 时，共享工具执行该分支。
  if (isRunningFromLocalInstallation()) {
    // 返回 `'npm-local'`，作为共享工具这次计算的结果。
    return 'npm-local'
  }

  // Check if we're in a typical npm global location
  // npmGlobalPaths 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
  const npmGlobalPaths = [
    '/usr/local/lib/node_modules',
    '/usr/lib/node_modules',
    '/opt/homebrew/lib/node_modules',
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/.nvm/versions/node/', // nvm installations
  ]

  // 满足 `npmGlobalPaths.some(path => invokedPath.includes(path))` 时，共享工具执行该分支。
  if (npmGlobalPaths.some(path => invokedPath.includes(path))) {
    // 返回 `'npm-global'`，作为共享工具这次计算的结果。
    return 'npm-global'
  }

  // Also check for npm/nvm in the path even if not in standard locations
  // 只有 `invokedPath.includes('/npm/') || invokedPath.includes('/nvm/')` 满足时，共享工具才执行该分支。
  if (invokedPath.includes('/npm/') || invokedPath.includes('/nvm/')) {
    // 返回 `'npm-global'`，作为共享工具这次计算的结果。
    return 'npm-global'
  }

  // npmConfigResult 配置保存`execa`，供共享工具后续处理使用。
  const npmConfigResult = await execa('npm config get prefix', {
    shell: true,
    reject: false,
  })
  // globalPrefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const globalPrefix =
    npmConfigResult.exitCode === 0 ? npmConfigResult.stdout.trim() : null

  // 只有 `globalPrefix && invokedPath.startsWith(globalPrefix)` 满足时，共享工具才执行该分支。
  if (globalPrefix && invokedPath.startsWith(globalPrefix)) {
    // 返回 `'npm-global'`，作为共享工具这次计算的结果。
    return 'npm-global'
  }

  // If we can't determine, return unknown
  // 返回 `'unknown'`，作为共享工具这次计算的结果。
  return 'unknown'
}

// getInstallationPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getInstallationPath(): Promise<string> {
  // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'development') {
    // 返回 `getCwd()`，作为共享工具这次计算的结果。
    return getCwd()
  }

  // For bundled/native builds, show the binary location
  // 满足 `isInBundledMode()` 时，共享工具执行该分支。
  if (isInBundledMode()) {
    // Try to find the actual binary that was invoked
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `realpath(process.execPath)`，调用方直接接收异步结果。
      return await realpath(process.execPath)
    } catch {
      // This function doesn't expect errors
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 路径保存`which`，供共享工具后续处理使用。
      const path = await which('claude')
      // 满足 `path` 时，共享工具执行该分支。
      if (path) {
        // 返回 `path`，作为共享工具这次计算的结果。
        return path
      }
    } catch {
      // This function doesn't expect errors
    }

    // If we can't find it, check common locations
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `getFsImplementation().stat(join(homedir(), '.local/bin/claude'))` 完成，再继续共享工具 doctor Diagnostic的异步流程。
      await getFsImplementation().stat(join(homedir(), '.local/bin/claude'))
      // 返回 `join(homedir(), '.local/bin/claude')`，作为共享工具这次计算的结果。
      return join(homedir(), '.local/bin/claude')
    } catch {
      // Not found
    }
    // 返回 `'native'`，作为共享工具这次计算的结果。
    return 'native'
  }

  // For npm installations, use the path of the executable
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `process.argv[0] || 'unknown'`，作为共享工具这次计算的结果。
    return process.argv[0] || 'unknown'
  } catch {
    // 返回 `'unknown'`，作为共享工具这次计算的结果。
    return 'unknown'
  }
}

// getInvokedBinary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInvokedBinary(): string {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // For bundled/compiled executables, show the actual binary path
    // 满足 `isInBundledMode()` 时，共享工具执行该分支。
    if (isInBundledMode()) {
      // 返回 `process.execPath || 'unknown'`，作为共享工具这次计算的结果。
      return process.execPath || 'unknown'
    }

    // For npm/development, show the script path
    // 返回 `process.argv[1] || 'unknown'`，作为共享工具这次计算的结果。
    return process.argv[1] || 'unknown'
  } catch {
    // 返回 `'unknown'`，作为共享工具这次计算的结果。
    return 'unknown'
  }
}

// detectMultipleInstallations 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectMultipleInstallations(): Promise<
  Array<{ type: string; path: string }>
> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // installations 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const installations: Array<{ type: string; path: string }> = []

  // Check for local installation
  // localPath 路径数据格式化`join`，供共享工具后续处理使用。
  const localPath = join(homedir(), '.claude', 'local')
  // 满足 `await localInstallationExists()` 时，共享工具执行该分支。
  if (await localInstallationExists()) {
    // installations 集合追加新条目，保持收集顺序与输入顺序一致。
    installations.push({ type: 'npm-local', path: localPath })
  }

  // Check for global npm installation
  // packagesToCheck 聚合成有序列表，保持后续遍历顺序稳定。
  const packagesToCheck = ['@anthropic-ai/claude-code']
  // `MACRO.PACKAGE_URL && MACRO.PACKAGE_URL` 与 `'@anth` 不一致时刷新派生状态，避免使用过期结果。
  if (MACRO.PACKAGE_URL && MACRO.PACKAGE_URL !== '@anthropic-ai/claude-code') {
    // packagesToCheck追加新条目，保持收集顺序与输入顺序一致。
    packagesToCheck.push(MACRO.PACKAGE_URL)
  }
  // npmResult保存`execFileNoThrow`，供共享工具后续处理使用。
  const npmResult = await execFileNoThrow('npm', [
    '-g',
    'config',
    'get',
    'prefix',
  ])
  // 只有 `npmResult.code === 0 && npmResult.stdout` 满足时，共享工具才执行该分支。
  if (npmResult.code === 0 && npmResult.stdout) {
    // npmPrefix格式化`stdout.trim`，供共享工具后续处理使用。
    const npmPrefix = npmResult.stdout.trim()
    // isWindows 集合记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
    const isWindows = getPlatform() === 'windows'

    // First check for active installations via bin/claude
    // Linux / macOS have prefix/bin/claude and prefix/lib/node_modules
    // Windows has prefix/claude and prefix/node_modules
    // globalBinPath 路径数据保存`isWindows`，供共享工具 doctor Diagnostic后续判断或输出使用。
    const globalBinPath = isWindows
      ? join(npmPrefix, 'claude')
      : join(npmPrefix, 'bin', 'claude')

    // globalBinExists 集合标记共享工具 doctor Diagnostic是否启用对应路径。
    let globalBinExists = false
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(globalBinPath)` 完成，再继续共享工具 doctor Diagnostic的异步流程。
      await fs.stat(globalBinPath)
      // globalBinExists 集合更新为 `true`，确保共享工具后续读取最新状态。
      globalBinExists = true
    } catch {
      // Not found
    }

    // 满足 `globalBinExists` 时，共享工具执行该分支。
    if (globalBinExists) {
      // Check if this is actually a Homebrew cask installation, not npm-global
      // When npm is installed via Homebrew, both can exist at /opt/homebrew/bin/claude
      // We need to resolve the symlink to see where it actually points
      // isCurrentHomebrewInstallation标记共享工具 doctor Diagnostic是否启用对应路径。
      let isCurrentHomebrewInstallation = false

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // Resolve the symlink to get the actual target
        // realPath 路径数据保存`realpath`，供共享工具后续处理使用。
        const realPath = await realpath(globalBinPath)

        // If the symlink points to a Caskroom directory, it's a Homebrew cask
        // Only skip it if it's the same Homebrew installation we're currently running from
        // 满足 `realPath.includes('/Caskroom/')` 时，共享工具执行该分支。
        if (realPath.includes('/Caskroom/')) {
          // isCurrentHomebrewInstallation更新为 `detectHomebrew()`，确保共享工具后续读取最新状态。
          isCurrentHomebrewInstallation = detectHomebrew()
        }
      } catch {
        // If we can't resolve the symlink, include it anyway
      }

      // isCurrentHomebrewInstallation缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!isCurrentHomebrewInstallation) {
        // installations 集合追加新条目，保持收集顺序与输入顺序一致。
        installations.push({ type: 'npm-global', path: globalBinPath })
      }
    } else {
      // If no bin/claude exists, check for orphaned packages (no bin/claude symlink)
      // 按顺序遍历 `packagesToCheck` 中的packageName，逐个交给共享工具处理。
      for (const packageName of packagesToCheck) {
        // globalPackagePath 路径数据保存`isWindows`，供共享工具 doctor Diagnostic后续判断或输出使用。
        const globalPackagePath = isWindows
          ? join(npmPrefix, 'node_modules', packageName)
          : join(npmPrefix, 'lib', 'node_modules', packageName)

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `fs.stat(globalPackagePath)` 完成，再继续共享工具 doctor Diagnostic的异步流程。
          await fs.stat(globalPackagePath)
          // installations 集合追加新条目，保持收集顺序与输入顺序一致。
          installations.push({
            type: 'npm-global-orphan',
            path: globalPackagePath,
          })
        } catch {
          // Package not found
        }
      }
    }
  }

  // Check for native installation

  // Check common native installation paths
  // nativeBinPath 路径数据格式化`join`，供共享工具后续处理使用。
  const nativeBinPath = join(homedir(), '.local', 'bin', 'claude')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.stat(nativeBinPath)` 完成，再继续共享工具 doctor Diagnostic的异步流程。
    await fs.stat(nativeBinPath)
    // installations 集合追加新条目，保持收集顺序与输入顺序一致。
    installations.push({ type: 'native', path: nativeBinPath })
  } catch {
    // Not found
  }

  // Also check if config indicates native installation
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 当 `config.installMethod` 匹配 `'native'` 时，共享工具执行对应分支。
  if (config.installMethod === 'native') {
    // nativeDataPath 路径数据格式化`join`，供共享工具后续处理使用。
    const nativeDataPath = join(homedir(), '.local', 'share', 'claude')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(nativeDataPath)` 完成，再继续共享工具 doctor Diagnostic的异步流程。
      await fs.stat(nativeDataPath)
      // 满足 `!installations.some(i => i.type === 'native')` 时，共享工具执行该分支。
      if (!installations.some(i => i.type === 'native')) {
        // installations 集合追加新条目，保持收集顺序与输入顺序一致。
        installations.push({ type: 'native', path: nativeDataPath })
      }
    } catch {
      // Not found
    }
  }

  // 返回 `installations`，作为共享工具这次计算的结果。
  return installations
}

// detectConfigurationIssues 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectConfigurationIssues(
  type: InstallationType,
): Promise<Array<{ issue: string; fix: string }>> {
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: Array<{ issue: string; fix: string }> = []

  // Managed-settings forwards-compat: the schema preprocess silently drops
  // unknown strictPluginOnlyCustomization surface names so one future enum
  // value doesn't null out the entire policy file (settings.ts:101). But
  // admins should KNOW — read the raw file and diff. Runs before the
  // development-mode early return: this is config correctness, not an
  // install-path check, and it's useful to see during dev testing.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本读取`readFile`，供共享工具后续处理使用。
    const raw = await readFile(
      join(getManagedFilePath(), 'managed-settings.json'),
      'utf-8',
    )
    // 解析结果解析`jsonParse(raw)`，供后续判断或组装使用。
    const parsed: unknown = jsonParse(raw)
    // field 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const field =
      parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>).strictPluginOnlyCustomization
        : undefined
    // `field` 与 `undefined && typeof field !== '...` 不一致时刷新派生状态，避免使用过期结果。
    if (field !== undefined && typeof field !== 'boolean') {
      // 满足 `!Array.isArray(field)` 时，共享工具执行该分支。
      if (!Array.isArray(field)) {
        // .catch(undefined) in the schema silently drops this, so the rest
        // of managed settings survive — but the admin typed something
        // wrong (an object, a string, etc.).
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: `managed-settings.json: strictPluginOnlyCustomization has an invalid value (expected true or an array, got ${typeof field})`,
          fix: `The field is silently ignored (schema .catch rescues it). Set it to true, or an array of: ${CUSTOMIZATION_SURFACES.join(', ')}.`,
        })
      } else {
        // unknown筛选`field.filter`，供共享工具后续处理使用。
        const unknown = field.filter(
          // x更新为 `>`，确保共享工具后续读取最新状态。
          x =>
            typeof x === 'string' &&
            !(CUSTOMIZATION_SURFACES as readonly string[]).includes(x),
        )
        // 满足 `unknown.length > 0` 时，共享工具执行该分支。
        if (unknown.length > 0) {
          // 警告列表追加新条目，保持收集顺序与输入顺序一致。
          warnings.push({
            issue: `managed-settings.json: strictPluginOnlyCustomization has ${unknown.length} value(s) this client doesn't recognize: ${unknown.map(String).join(', ')}`,
            fix: `These are silently ignored (forwards-compat). Known surfaces for this version: ${CUSTOMIZATION_SURFACES.join(', ')}. Either remove them, or this client is older than the managed-settings intended.`,
          })
        }
      }
    }
  } catch {
    // ENOENT (no managed settings) / parse error — not this check's concern.
    // Parse errors are surfaced by the settings loader itself.
  }

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()

  // Skip most warnings for development mode
  // 当 `type` 匹配 `'development'` 时，共享工具执行对应分支。
  if (type === 'development') {
    // 返回 `warnings`，作为共享工具这次计算的结果。
    return warnings
  }

  // Check if ~/.local/bin is in PATH for native installations
  // 当 `type` 匹配 `'native'` 时，共享工具执行对应分支。
  if (type === 'native') {
    // 路径 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const path = process.env.PATH || ''
    // pathDirectories 路径数据格式化`path.split`，供共享工具后续处理使用。
    const pathDirectories = path.split(delimiter)
    // homeDir保存`homedir`，供共享工具后续处理使用。
    const homeDir = homedir()
    // localBinPath 路径数据格式化`join`，供共享工具后续处理使用。
    const localBinPath = join(homeDir, '.local', 'bin')

    // On Windows, convert backslashes to forward slashes for consistent path matching
    // normalizedLocalBinPath 路径数据保存`localBinPath`，供共享工具 doctor Diagnostic后续判断或输出使用。
    let normalizedLocalBinPath = localBinPath
    // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
    if (getPlatform() === 'windows') {
      // normalizedLocalBinPath 路径数据更新为 `localBinPath.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
      normalizedLocalBinPath = localBinPath.split(win32.sep).join(posix.sep)
    }

    // Check if ~/.local/bin is in PATH (handle both expanded and unexpanded forms)
    // Also handle trailing slashes that users may have in their PATH
    // localBinInPath 路径数据筛选`pathDirectories.some`，供共享工具后续处理使用。
    const localBinInPath = pathDirectories.some(dir => {
      // normalizedDir保存`dir`，供后续判断或组装使用。
      let normalizedDir = dir
      // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
      if (getPlatform() === 'windows') {
        // normalizedDir更新为 `dir.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
        normalizedDir = dir.split(win32.sep).join(posix.sep)
      }
      // Remove trailing slashes for comparison (handles paths like /home/user/.local/bin/)
      // trimmedDir格式化`normalizedDir.replace`，供共享工具后续处理使用。
      const trimmedDir = normalizedDir.replace(/\/+$/, '')
      // trimmedRawDir格式化`dir.replace`，供共享工具后续处理使用。
      const trimmedRawDir = dir.replace(/[/\\]+$/, '')
      // 返回 `(`，作为共享工具这次计算的结果。
      return (
        trimmedDir === normalizedLocalBinPath ||
        trimmedRawDir === '~/.local/bin' ||
        trimmedRawDir === '$HOME/.local/bin'
      )
    })

    // localBinInPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!localBinInPath) {
      // isWindows 集合记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
      const isWindows = getPlatform() === 'windows'
      // 满足 `isWindows` 时，共享工具执行该分支。
      if (isWindows) {
        // Windows-specific PATH instructions
        // windowsLocalBinPath 路径数据 命名 `localBinPath`，让后续代码直接表达这个值的用途。
        const windowsLocalBinPath = localBinPath
          .split(posix.sep)
          .join(win32.sep)
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: `Native installation exists but ${windowsLocalBinPath} is not in your PATH`,
          fix: `Add it by opening: System Properties → Environment Variables → Edit User PATH → New → Add the path above. Then restart your terminal.`,
        })
      } else {
        // Unix-style PATH instructions
        // shellType读取`getShellType`，供共享工具后续处理使用。
        const shellType = getShellType()
        // configPaths 路径数据读取`getShellConfigPaths`，供共享工具后续处理使用。
        const configPaths = getShellConfigPaths()
        // configFile 文件数据读取 `configPaths[shellType as keyof typeof configPaths]` 对应条目，后续围绕该成员继续处理。
        const configFile = configPaths[shellType as keyof typeof configPaths]
        // displayPath 路径数据 命名 `configFile`，让后续代码直接表达这个值的用途。
        const displayPath = configFile
          ? configFile.replace(homedir(), '~')
          : 'your shell config file'

        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue:
            'Native installation exists but ~/.local/bin is not in your PATH',
          fix: `Run: echo 'export PATH="$HOME/.local/bin:$PATH"' >> ${displayPath} then open a new terminal or run: source ${displayPath}`,
        })
      }
    }
  }

  // Check for configuration mismatches
  // Skip these checks if DISABLE_INSTALLATION_CHECKS is set (e.g., in HFI)
  // 满足 `!isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)) {
    // 只有 `type === 'npm-local' && config.installMethod !==` 满足时，共享工具才执行该分支。
    if (type === 'npm-local' && config.installMethod !== 'local') {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        issue: `Running from local installation but config install method is '${config.installMethod}'`,
        fix: 'Consider using native installation: claude install',
      })
    }

    // `type === 'native' && config.installMethod` 与 `'na` 不一致时刷新派生状态，避免使用过期结果。
    if (type === 'native' && config.installMethod !== 'native') {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        issue: `Running native installation but config install method is '${config.installMethod}'`,
        fix: 'Run claude install to update configuration',
      })
    }
  }

  // 只有 `type === 'npm-global' && (await localInstallationExists())` 满足时，共享工具才执行该分支。
  if (type === 'npm-global' && (await localInstallationExists())) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      issue: 'Local installation exists but not being used',
      fix: 'Consider using native installation: claude install',
    })
  }

  // existingAlias 集合筛选`findClaudeAlias`，供共享工具后续处理使用。
  const existingAlias = await findClaudeAlias()
  // validAlias 集合筛选`findValidClaudeAlias`，供共享工具后续处理使用。
  const validAlias = await findValidClaudeAlias()

  // Check if running local installation but it's not in PATH
  // 当 `type` 匹配 `'npm-local'` 时，共享工具执行对应分支。
  if (type === 'npm-local') {
    // Check if claude is already accessible via PATH
    // whichResult保存`which`，供共享工具后续处理使用。
    const whichResult = await which('claude')
    // claudeInPath 路径数据标记共享工具 doctor Diagnostic是否启用对应路径。
    const claudeInPath = !!whichResult

    // Only show warning if claude is NOT in PATH AND no valid alias exists
    // 只有 `!claudeInPath && !validAlias` 满足时，共享工具才执行该分支。
    if (!claudeInPath && !validAlias) {
      // 满足 `existingAlias` 时，共享工具执行该分支。
      if (existingAlias) {
        // Alias exists but points to invalid target
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: 'Local installation not accessible',
          fix: `Alias exists but points to invalid target: ${existingAlias}. Update alias: alias claude="~/.claude/local/claude"`,
        })
      } else {
        // No alias exists and not in PATH
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: 'Local installation not accessible',
          fix: 'Create alias: alias claude="~/.claude/local/claude"',
        })
      }
    }
  }

  // 返回 `warnings`，作为共享工具这次计算的结果。
  return warnings
}

// detectLinuxGlobPatternWarnings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectLinuxGlobPatternWarnings(): Array<{
  issue: string
  fix: string
}> {
  // `getPlatform()` 与 `'linux'` 不一致时刷新派生状态，避免使用过期结果。
  if (getPlatform() !== 'linux') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: Array<{ issue: string; fix: string }> = []
  // globPatterns 集合读取`SandboxManager.getLinuxGlobPatternWarnings`，供共享工具后续处理使用。
  const globPatterns = SandboxManager.getLinuxGlobPatternWarnings()

  // 满足 `globPatterns.length > 0` 时，共享工具执行该分支。
  if (globPatterns.length > 0) {
    // Show first 3 patterns, then indicate if there are more
    // displayPatterns 集合格式化`globPatterns.slice`，供共享工具后续处理使用。
    const displayPatterns = globPatterns.slice(0, 3).join(', ')
    // remaining记录 `globPatterns.length - 3` 是否成立，下一步按该结果分支。
    const remaining = globPatterns.length - 3
    // patternList 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const patternList =
      remaining > 0 ? `${displayPatterns} (${remaining} more)` : displayPatterns

    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      issue: `Glob patterns in sandbox permission rules are not fully supported on Linux`,
      fix: `Found ${globPatterns.length} pattern(s): ${patternList}. On Linux, glob patterns in Edit/Read rules will be ignored.`,
    })
  }

  // 返回 `warnings`，作为共享工具这次计算的结果。
  return warnings
}

// getDoctorDiagnostic 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getDoctorDiagnostic(): Promise<DiagnosticInfo> {
  // installationType读取`getCurrentInstallationType`，供共享工具后续处理使用。
  const installationType = await getCurrentInstallationType()
  // version 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const version =
    typeof MACRO !== 'undefined' && MACRO.VERSION ? MACRO.VERSION : 'unknown'
  // installationPath 路径数据读取`getInstallationPath`，供共享工具后续处理使用。
  const installationPath = await getInstallationPath()
  // invokedBinary读取`getInvokedBinary`，供共享工具后续处理使用。
  const invokedBinary = getInvokedBinary()
  // multipleInstallations 集合读取`detectMultipleInstallations`，供共享工具后续处理使用。
  const multipleInstallations = await detectMultipleInstallations()
  // 警告列表读取`detectConfigurationIssues`，供共享工具后续处理使用。
  const warnings = await detectConfigurationIssues(installationType)

  // Add glob pattern warnings for Linux sandboxing
  // 警告列表追加新条目，保持收集顺序与输入顺序一致。
  warnings.push(...detectLinuxGlobPatternWarnings())

  // Add warnings for leftover npm installations when running native
  // 当 `installationType` 匹配 `'native'` 时，共享工具执行对应分支。
  if (installationType === 'native') {
    // npmInstalls 集合筛选`multipleInstallations.filter`，供共享工具后续处理使用。
    const npmInstalls = multipleInstallations.filter(
      // i更新为 `>`，确保共享工具后续读取最新状态。
      i =>
        i.type === 'npm-global' ||
        i.type === 'npm-global-orphan' ||
        i.type === 'npm-local',
    )

    // isWindows 集合记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
    const isWindows = getPlatform() === 'windows'

    // 按顺序遍历 `npmInstalls` 中的install，逐个交给共享工具处理。
    for (const install of npmInstalls) {
      // 当 `install.type` 匹配 `'npm-global'` 时，共享工具执行对应分支。
      if (install.type === 'npm-global') {
        // uninstallCmd 命令数据固定为 `'npm -g uninstall @anthropic-ai/claude-code'`，作为共享工具 doctor Diagnostic后续展示或比较的基准。
        let uninstallCmd = 'npm -g uninstall @anthropic-ai/claude-code'
        // 共享工具在这里按实际状态进入对应分支。
        if (
          MACRO.PACKAGE_URL &&
          MACRO.PACKAGE_URL !== '@anthropic-ai/claude-code'
        ) {
          // 共享工具 doctor Diagnostic在这里处理 `uninstallCmd += ` && npm -g uninstall ${MACRO.PACKAGE_URL}``，完成这一小步状态转换。
          uninstallCmd += ` && npm -g uninstall ${MACRO.PACKAGE_URL}`
        }
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: `Leftover npm global installation at ${install.path}`,
          fix: `Run: ${uninstallCmd}`,
        })
      // 共享工具 doctor Diagnostic在这里处理 `} else if (install.type === 'npm-global-orphan') {`，完成这一小步状态转换。
      } else if (install.type === 'npm-global-orphan') {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: `Orphaned npm global package at ${install.path}`,
          fix: isWindows
            ? `Run: rmdir /s /q "${install.path}"`
            : `Run: rm -rf ${install.path}`,
        })
      // 共享工具 doctor Diagnostic在这里处理 `} else if (install.type === 'npm-local') {`，完成这一小步状态转换。
      } else if (install.type === 'npm-local') {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          issue: `Leftover npm local installation at ${install.path}`,
          fix: isWindows
            ? `Run: rmdir /s /q "${install.path}"`
            : `Run: rm -rf ${install.path}`,
        })
      }
    }
  }

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()

  // Get config values for display
  // configInstallMethod 配置标记共享工具 doctor Diagnostic是否启用对应路径。
  const configInstallMethod = config.installMethod || 'not set'

  // Check permissions for global installations
  // hasUpdatePermissions 权限数据标记共享工具 doctor Diagnostic是否启用对应路径。
  let hasUpdatePermissions: boolean | null = null
  // 当 `installationType` 匹配 `'npm-global'` 时，共享工具执行对应分支。
  if (installationType === 'npm-global') {
    // permCheck读取`checkGlobalInstallPermissions`，供共享工具后续处理使用。
    const permCheck = await checkGlobalInstallPermissions()
    // hasUpdatePermissions 权限数据更新为 `permCheck.hasPermissions`，确保共享工具后续读取最新状态。
    hasUpdatePermissions = permCheck.hasPermissions

    // Add warning if no permissions
    // 只有 `!hasUpdatePermissions && !getAutoUpdaterDisabledReason()` 满足时，共享工具才执行该分支。
    if (!hasUpdatePermissions && !getAutoUpdaterDisabledReason()) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        issue: 'Insufficient permissions for auto-updates',
        fix: 'Do one of: (1) Re-install node without sudo, or (2) Use `claude install` for native installation',
      })
    }
  }

  // Get ripgrep status and configuration
  // ripgrepStatusRaw读取`getRipgrepStatus`，供共享工具后续处理使用。
  const ripgrepStatusRaw = getRipgrepStatus()

  // Provide simple ripgrep status info
  // ripgrepStatus 集合集中保存共享工具 doctor Diagnostic要一起传递的字段。
  const ripgrepStatus = {
    working: ripgrepStatusRaw.working ?? true, // Assume working if not yet tested
    mode: ripgrepStatusRaw.mode,
    systemPath:
      ripgrepStatusRaw.mode === 'system' ? ripgrepStatusRaw.path : null,
  }

  // Get package manager info if running from package manager
  // packageManager 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const packageManager =
    installationType === 'package-manager'
      ? await getPackageManager()
      : undefined

  // diagnostic 集中保存共享工具 doctor Diagnostic要一起传递的字段。
  const diagnostic: DiagnosticInfo = {
    installationType,
    version,
    installationPath,
    invokedBinary,
    configInstallMethod,
    // 这个回调绑定到 autoUpdates: (() => {，负责共享工具在该局部场景下的响应。
    autoUpdates: (() => {
      // reason读取`getAutoUpdaterDisabledReason`，供共享工具后续处理使用。
      const reason = getAutoUpdaterDisabledReason()
      // 返回 `reason`，作为共享工具这次计算的结果。
      return reason
        ? `disabled (${formatAutoUpdaterDisabledReason(reason)})`
        : 'enabled'
    })(),
    hasUpdatePermissions,
    multipleInstallations,
    warnings,
    packageManager,
    ripgrepStatus,
  }

  // 返回 `diagnostic`，作为共享工具这次计算的结果。
  return diagnostic
}
