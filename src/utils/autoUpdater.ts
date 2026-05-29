// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { access, writeFile } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 getDynamicConfig_BLOCKS_ON_INIT 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getDynamicConfig_BLOCKS_ON_INIT } from 'src/services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 引入 ReleaseChannel、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { type ReleaseChannel, saveGlobalConfig } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 env，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { env } from './env.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 ClaudeError、getErrnoCode、isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { ClaudeError, getErrnoCode, isENOENT } from './errors.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 gracefulShutdownSync，将 ./gracefulShutdown.js 中已经封装好的能力接到本文件流程里。
import { gracefulShutdownSync } from './gracefulShutdown.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 gte、lt，将 ./semver.js 中已经封装好的能力接到本文件流程里。
import { gte, lt } from './semver.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterClaudeAliases,
  getShellConfigPaths,
  readFileLines,
  writeFileLines,
} from './shellConfig.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

// GCS_BUCKET_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const GCS_BUCKET_URL =
  'https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases'

// AutoUpdaterError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class AutoUpdaterError extends ClaudeError {}

// InstallStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallStatus =
  | 'success'
  | 'no_permissions'
  | 'install_failed'
  | 'in_progress'

// AutoUpdaterResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoUpdaterResult = {
  version: string | null
  status: InstallStatus
  notifications?: string[]
}

// MaxVersionConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MaxVersionConfig = {
  external?: string
  ant?: string
  external_message?: string
  ant_message?: string
}

/**
 * Checks if the current version meets the minimum required version from Statsig config
 * Terminates the process with an error message if the version is too old
 *
 * NOTE ON SHA-BASED VERSIONING:
 * We use SemVer-compliant versioning with build metadata format (X.X.X+SHA) for continuous deployment.
 * According to SemVer specs, build metadata (the +SHA part) is ignored when comparing versions.
 *
 * Versioning approach:
 * 1. For version requirements/compatibility (assertMinVersion), we use semver comparison that ignores build metadata
 * 2. For updates ('claude update'), we use exact string comparison to detect any change, including SHA
 *    - This ensures users always get the latest build, even when only the SHA changes
 *    - The UI clearly shows both versions including build metadata
 *
 * This approach keeps version comparison logic simple while maintaining traceability via the SHA.
 */
// assertMinVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function assertMinVersion(): Promise<void> {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 共享工具 auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // versionConfig 配置 等待 `getDynamicConfig_BLOCKS_ON_INIT<{`，确保继续执行前已有结果。
    const versionConfig = await getDynamicConfig_BLOCKS_ON_INIT<{
      minVersion: string
    }>('tengu_version_config', { minVersion: '0.0.0' })

    // 共享工具在这里按实际状态进入对应分支。
    if (
      versionConfig.minVersion &&
      lt(MACRO.VERSION, versionConfig.minVersion)
    ) {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.error，触发共享工具此处需要的副作用。
      console.error(`
It looks like your version of Claude Code (${MACRO.VERSION}) needs an update.
A newer version (${versionConfig.minVersion} or higher) is required to continue.

To update, please run:
    claude update

This will ensure you have access to the latest features and improvements.
`)
      // 调用 gracefulShutdownSync，触发共享工具此处需要的副作用。
      gracefulShutdownSync(1)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }
}

/**
 * Returns the maximum allowed version for the current user type.
 * For ants, returns the `ant` field (dev version format).
 * For external users, returns the `external` field (clean semver).
 * This is used as a server-side kill switch to pause auto-updates during incidents.
 * Returns undefined if no cap is configured.
 */
// getMaxVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMaxVersion(): Promise<string | undefined> {
  // 配置读取`getMaxVersionConfig`，供共享工具后续处理使用。
  const config = await getMaxVersionConfig()
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 `config.ant || undefined`，作为共享工具这次计算的结果。
    return config.ant || undefined
  }
  // 返回 `config.external || undefined`，作为共享工具这次计算的结果。
  return config.external || undefined
}

/**
 * Returns the server-driven message explaining the known issue, if configured.
 * Shown in the warning banner when the current version exceeds the max allowed version.
 */
// getMaxVersionMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMaxVersionMessage(): Promise<string | undefined> {
  // 配置读取`getMaxVersionConfig`，供共享工具后续处理使用。
  const config = await getMaxVersionConfig()
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 `config.ant_message || undefined`，作为共享工具这次计算的结果。
    return config.ant_message || undefined
  }
  // 返回 `config.external_message || undefined`，作为共享工具这次计算的结果。
  return config.external_message || undefined
}

// getMaxVersionConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getMaxVersionConfig(): Promise<MaxVersionConfig> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `getDynamicConfig_BLOCKS_ON_INIT<MaxVersionConfig>(`，调用方直接接收异步结果。
    return await getDynamicConfig_BLOCKS_ON_INIT<MaxVersionConfig>(
      'tengu_max_version_config',
      {},
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }
}

/**
 * Checks if a target version should be skipped due to user's minimumVersion setting.
 * This is used when switching to stable channel - the user can choose to stay on their
 * current version until stable catches up, preventing downgrades.
 */
// shouldSkipVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldSkipVersion(targetVersion: string): boolean {
  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()
  // minimumVersion保存`settings?.minimumVersion`，供后续判断或组装使用。
  const minimumVersion = settings?.minimumVersion
  // minimumVersion缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!minimumVersion) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Skip if target version is less than minimum
  // shouldSkip记录 `gte` 是否成立，共享工具随后按该结果分支。
  const shouldSkip = !gte(targetVersion, minimumVersion)
  // 满足 `shouldSkip` 时，共享工具执行该分支。
  if (shouldSkip) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping update to ${targetVersion} - below minimumVersion ${minimumVersion}`,
    )
  }
  // 返回 `shouldSkip`，作为共享工具这次计算的结果。
  return shouldSkip
}

// Lock file for auto-updater to prevent concurrent updates
// LOCK_TIMEOUT_MS 集合 命名 `5 * 60 * 1000 // 5 minute timeout for locks`，让后续代码直接表达这个值的用途。
const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minute timeout for locks

/**
 * Get the path to the lock file
 * This is a function to ensure it's evaluated at runtime after test setup
 */
// getLockFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLockFilePath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), '.update.lock')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), '.update.lock')
}

/**
 * Attempts to acquire a lock for auto-updater
 * @returns true if lock was acquired, false if another process holds the lock
 */
// acquireLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function acquireLock(): Promise<boolean> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // lockPath 路径数据读取`getLockFilePath`，供共享工具后续处理使用。
  const lockPath = getLockFilePath()

  // Check for existing lock: 1 stat() on the happy path (fresh lock or ENOENT),
  // 2 on stale-lock recovery (re-verify staleness immediately before unlink).
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`fs.stat`，供共享工具后续处理使用。
    const stats = await fs.stat(lockPath)
    // age记录时间`Date.now`，供共享工具后续处理使用。
    const age = Date.now() - stats.mtimeMs
    // 满足 `age < LOCK_TIMEOUT_MS` 时，共享工具执行该分支。
    if (age < LOCK_TIMEOUT_MS) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // Lock is stale, remove it before taking over. Re-verify staleness
    // immediately before unlinking to close a TOCTOU race: if two processes
    // both observe the stale lock, A unlinks + writes a fresh lock, then B
    // would unlink A's fresh lock and both believe they hold it. A fresh
    // lock has a recent mtime, so re-checking staleness makes B back off.
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // recheck保存`fs.stat`，供共享工具后续处理使用。
      const recheck = await fs.stat(lockPath)
      // 满足 `Date.now() - recheck.mtimeMs < LOCK_TIMEOUT_MS` 时，共享工具执行该分支。
      if (Date.now() - recheck.mtimeMs < LOCK_TIMEOUT_MS) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 等待 `fs.unlink(lockPath)` 完成，再继续共享工具 auto Updater的异步流程。
      await fs.unlink(lockPath)
    } catch (err) {
      // 满足 `!isENOENT(err)` 时，共享工具执行该分支。
      if (!isENOENT(err)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(err as Error)
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
  } catch (err) {
    // 满足 `!isENOENT(err)` 时，共享工具执行该分支。
    if (!isENOENT(err)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(err as Error)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // ENOENT: no lock file, proceed to create one
  }

  // Create lock file atomically with O_EXCL (flag: 'wx'). If another process
  // wins the race and creates it first, we get EEXIST and back off.
  // Lazy-mkdir the config dir on ENOENT.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(lockPath, `${process.pid}`, {` 完成，再继续共享工具 auto Updater的异步流程。
    await writeFile(lockPath, `${process.pid}`, {
      encoding: 'utf8',
      flag: 'wx',
    })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (err) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(err)
    // 当 `code` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
    if (code === 'EEXIST') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // fs.mkdir from getFsImplementation() is always recursive:true and
        // swallows EEXIST internally, so a dir-creation race cannot reach the
        // catch below — only writeFile's EEXIST (true lock contention) can.
        // 等待 `fs.mkdir(getClaudeConfigHomeDir())` 完成，再继续共享工具 auto Updater的异步流程。
        await fs.mkdir(getClaudeConfigHomeDir())
        // 等待 `writeFile(lockPath, `${process.pid}`, {` 完成，再继续共享工具 auto Updater的异步流程。
        await writeFile(lockPath, `${process.pid}`, {
          encoding: 'utf8',
          flag: 'wx',
        })
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch (mkdirErr) {
        // 当 `getErrnoCode(mkdirErr)` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
        if (getErrnoCode(mkdirErr) === 'EEXIST') {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(mkdirErr as Error)
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err as Error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Releases the update lock if it's held by this process
 */
// releaseLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function releaseLock(): Promise<void> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // lockPath 路径数据读取`getLockFilePath`，供共享工具后续处理使用。
  const lockPath = getLockFilePath()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockData读取`fs.readFile`，供共享工具后续处理使用。
    const lockData = await fs.readFile(lockPath, { encoding: 'utf8' })
    // 当 `lockData` 匹配 ``${process.pid}`` 时，共享工具执行对应分支。
    if (lockData === `${process.pid}`) {
      // 等待 `fs.unlink(lockPath)` 完成，再继续共享工具 auto Updater的异步流程。
      await fs.unlink(lockPath)
    }
  } catch (err) {
    // 满足 `isENOENT(err)` 时，共享工具执行该分支。
    if (isENOENT(err)) {
      // 共享工具 auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err as Error)
  }
}

// getInstallationPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getInstallationPrefix(): Promise<string | null> {
  // Run from home directory to avoid reading project-level .npmrc/.bunfig.toml
  // isBun记录 `env.isRunningWithBun` 是否成立，共享工具随后按该结果分支。
  const isBun = env.isRunningWithBun()
  // prefixResult初始化为空值，后续分支会在有数据时补齐。
  let prefixResult = null
  // 满足 `isBun` 时，共享工具执行该分支。
  if (isBun) {
    // prefixResult更新为 `await execFileNoThrowWithCwd('bun', ['pm', 'bin', '-g'], {`，确保共享工具后续读取最新状态。
    prefixResult = await execFileNoThrowWithCwd('bun', ['pm', 'bin', '-g'], {
      cwd: homedir(),
    })
  } else {
    // prefixResult更新为 `await execFileNoThrowWithCwd(`，确保共享工具后续读取最新状态。
    prefixResult = await execFileNoThrowWithCwd(
      'npm',
      ['-g', 'config', 'get', 'prefix'],
      { cwd: homedir() },
    )
  }
  // `prefixResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (prefixResult.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to check ${isBun ? 'bun' : 'npm'} permissions`))
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `prefixResult.stdout.trim()`，作为共享工具这次计算的结果。
  return prefixResult.stdout.trim()
}

// checkGlobalInstallPermissions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGlobalInstallPermissions(): Promise<{
  hasPermissions: boolean
  npmPrefix: string | null
}> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // prefix读取`getInstallationPrefix`，供共享工具后续处理使用。
    const prefix = await getInstallationPrefix()
    // prefix缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!prefix) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { hasPermissions: false, npmPrefix: null }
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `access(prefix, fsConstants.W_OK)` 完成，再继续共享工具 auto Updater的异步流程。
      await access(prefix, fsConstants.W_OK)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { hasPermissions: true, npmPrefix: prefix }
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new AutoUpdaterError(
          'Insufficient permissions for global npm install.',
        ),
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { hasPermissions: false, npmPrefix: prefix }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { hasPermissions: false, npmPrefix: null }
  }
}

// getLatestVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLatestVersion(
  channel: ReleaseChannel,
): Promise<string | null> {
  // npmTag标记共享工具 auto Updater是否启用对应路径。
  const npmTag = channel === 'stable' ? 'stable' : 'latest'

  // Run from home directory to avoid reading project-level .npmrc
  // which could be maliciously crafted to redirect to an attacker's registry
  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd(
    'npm',
    ['view', `${MACRO.PACKAGE_URL}@${npmTag}`, 'version', '--prefer-online'],
    { abortSignal: AbortSignal.timeout(5000), cwd: homedir() },
  )
  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`npm view failed with code ${result.code}`)
    // 满足 `result.stderr` 时，共享工具执行该分支。
    if (result.stderr) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`npm stderr: ${result.stderr.trim()}`)
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('npm stderr: (empty)')
    }
    // 满足 `result.stdout` 时，共享工具执行该分支。
    if (result.stdout) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`npm stdout: ${result.stdout.trim()}`)
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `result.stdout.trim()`，作为共享工具这次计算的结果。
  return result.stdout.trim()
}

// NpmDistTags 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type NpmDistTags = {
  latest: string | null
  stable: string | null
}

/**
 * Get npm dist-tags (latest and stable versions) from the registry.
 * This is used by the doctor command to show users what versions are available.
 */
// getNpmDistTags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getNpmDistTags(): Promise<NpmDistTags> {
  // Run from home directory to avoid reading project-level .npmrc
  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd(
    'npm',
    ['view', MACRO.PACKAGE_URL, 'dist-tags', '--json', '--prefer-online'],
    { abortSignal: AbortSignal.timeout(5000), cwd: homedir() },
  )

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`npm view dist-tags failed with code ${result.code}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { latest: null, stable: null }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(result.stdout.trim()) as Record<string, unknown>
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      latest: typeof parsed.latest === 'string' ? parsed.latest : null,
      stable: typeof parsed.stable === 'string' ? parsed.stable : null,
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to parse dist-tags: ${error}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { latest: null, stable: null }
  }
}

/**
 * Get the latest version from GCS bucket for a given release channel.
 * This is used by installations that don't have npm (e.g. package manager installs).
 */
// getLatestVersionFromGcs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLatestVersionFromGcs(
  channel: ReleaseChannel,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`axios.get`，供共享工具后续处理使用。
    const response = await axios.get(`${GCS_BUCKET_URL}/${channel}`, {
      timeout: 5000,
      responseType: 'text',
    })
    // 返回 `response.data.trim()`，作为共享工具这次计算的结果。
    return response.data.trim()
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to fetch ${channel} from GCS: ${error}`)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Get available versions from GCS bucket (for native installations).
 * Fetches both latest and stable channel pointers.
 */
// getGcsDistTags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGcsDistTags(): Promise<NpmDistTags> {
  // 并行获取 latest、stable，缩短共享工具 auto Updater等待多个独立异步任务的时间。
  const [latest, stable] = await Promise.all([
    getLatestVersionFromGcs('latest'),
    getLatestVersionFromGcs('stable'),
  ])

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { latest, stable }
}

/**
 * Get version history from npm registry (ant-only feature)
 * Returns versions sorted newest-first, limited to the specified count
 *
 * Uses NATIVE_PACKAGE_URL when available because:
 * 1. Native installation is the primary installation method for ant users
 * 2. Not all JS package versions have corresponding native packages
 * 3. This prevents rollback from listing versions that don't have native binaries
 */
// getVersionHistory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getVersionHistory(limit: number): Promise<string[]> {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Use native package URL when available to ensure we only show versions
  // that have native binaries (not all JS package versions have native builds)
  // packageUrl保存`MACRO.NATIVE_PACKAGE_URL ?? MACRO.PACKAGE_URL`，供共享工具 auto Updater后续判断或输出使用。
  const packageUrl = MACRO.NATIVE_PACKAGE_URL ?? MACRO.PACKAGE_URL

  // Run from home directory to avoid reading project-level .npmrc
  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd(
    'npm',
    ['view', packageUrl, 'versions', '--json', '--prefer-online'],
    // Longer timeout for version list
    { abortSignal: AbortSignal.timeout(30000), cwd: homedir() },
  )

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`npm view versions failed with code ${result.code}`)
    // 满足 `result.stderr` 时，共享工具执行该分支。
    if (result.stderr) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`npm stderr: ${result.stderr.trim()}`)
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // versions 集合解析`jsonParse`，供共享工具后续处理使用。
    const versions = jsonParse(result.stdout.trim()) as string[]
    // Take last N versions, then reverse to get newest first
    // 返回 `versions.slice(-limit).reverse()`，作为共享工具这次计算的结果。
    return versions.slice(-limit).reverse()
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to parse version history: ${error}`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// installGlobalPackage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installGlobalPackage(
  specificVersion?: string | null,
): Promise<InstallStatus> {
  // 满足 `!(await acquireLock())` 时，共享工具执行该分支。
  if (!(await acquireLock())) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new AutoUpdaterError('Another process is currently installing an update'),
    )
    // Log the lock contention
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_auto_updater_lock_contention', {
      pid: process.pid,
      currentVersion:
        MACRO.VERSION as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 `'in_progress'`，作为共享工具这次计算的结果。
    return 'in_progress'
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `removeClaudeAliasesFromShellConfigs()` 完成，再继续共享工具 auto Updater的异步流程。
    await removeClaudeAliasesFromShellConfigs()
    // Check if we're using npm from Windows path in WSL
    // 只有 `!env.isRunningWithBun() && env.isNpmFromWindowsPath()` 满足时，共享工具才执行该分支。
    if (!env.isRunningWithBun() && env.isNpmFromWindowsPath()) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(new Error('Windows NPM detected in WSL environment'))
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_auto_updater_windows_npm_in_wsl', {
        currentVersion:
          MACRO.VERSION as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.error，触发共享工具此处需要的副作用。
      console.error(`
Error: Windows NPM detected in WSL

You're running Claude Code in WSL but using the Windows NPM installation from /mnt/c/.
This configuration is not supported for updates.

To fix this issue:
  1. Install Node.js within your Linux distribution: e.g. sudo apt install nodejs npm
  2. Make sure Linux NPM is in your PATH before the Windows version
  3. Try updating again with 'claude update'
`)
      // 返回 `'install_failed'`，作为共享工具这次计算的结果。
      return 'install_failed'
    }

    // 从 `await checkGlobalInstallPermissions()` 解构 hasPermissions，减少共享工具 auto Updater对同一对象的重复访问。
    const { hasPermissions } = await checkGlobalInstallPermissions()
    // hasPermissions 权限数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!hasPermissions) {
      // 返回 `'no_permissions'`，作为共享工具这次计算的结果。
      return 'no_permissions'
    }

    // Use specific version if provided, otherwise use latest
    // packageSpec 命名 `specificVersion`，让后续代码直接表达这个值的用途。
    const packageSpec = specificVersion
      ? `${MACRO.PACKAGE_URL}@${specificVersion}`
      : MACRO.PACKAGE_URL

    // Run from home directory to avoid reading project-level .npmrc/.bunfig.toml
    // which could be maliciously crafted to redirect to an attacker's registry
    // packageManager保存`env.isRunningWithBun`，供共享工具后续处理使用。
    const packageManager = env.isRunningWithBun() ? 'bun' : 'npm'
    // installResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const installResult = await execFileNoThrowWithCwd(
      packageManager,
      ['install', '-g', packageSpec],
      { cwd: homedir() },
    )
    // `installResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (installResult.code !== 0) {
      // 错误保存`AutoUpdaterError`，供共享工具后续处理使用。
      const error = new AutoUpdaterError(
        `Failed to install new version of claude: ${installResult.stdout} ${installResult.stderr}`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 返回 `'install_failed'`，作为共享工具这次计算的结果。
      return 'install_failed'
    }

    // Set installMethod to 'global' to track npm global installations
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      installMethod: 'global',
    }))

    // 返回 `'success'`，作为共享工具这次计算的结果。
    return 'success'
  } finally {
    // Ensure we always release the lock
    // 等待 `releaseLock()` 完成，再继续共享工具 auto Updater的异步流程。
    await releaseLock()
  }
}

/**
 * Remove claude aliases from shell configuration files
 * This helps clean up old installation methods when switching to native or npm global
 */
// removeClaudeAliasesFromShellConfigs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function removeClaudeAliasesFromShellConfigs(): Promise<void> {
  // configMap 配置读取`getShellConfigPaths`，供共享工具后续处理使用。
  const configMap = getShellConfigPaths()

  // Process each shell config file
  // 循环处理 `const [, configFile] of Object.entries(configMap)`，让共享工具把同类条目按顺序走完。
  for (const [, configFile] of Object.entries(configMap)) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本行读取`readFileLines`，供共享工具后续处理使用。
      const lines = await readFileLines(configFile)
      // 文本行缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!lines) continue

      // 从 `filterClaudeAliases(lines)` 解构 filtered、hadAlias，减少共享工具 auto Updater对同一对象的重复访问。
      const { filtered, hadAlias } = filterClaudeAliases(lines)

      // 满足 `hadAlias` 时，共享工具执行该分支。
      if (hadAlias) {
        // 等待 `writeFileLines(configFile, filtered)` 完成，再继续共享工具 auto Updater的异步流程。
        await writeFileLines(configFile, filtered)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Removed claude alias from ${configFile}`)
      }
    } catch (error) {
      // Don't fail the whole operation if one file can't be processed
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to remove alias from ${configFile}: ${error}`, {
        level: 'error',
      })
    }
  }
}
