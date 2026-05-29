/**
 * Native Installer Implementation
 *
 * This module implements the file-based native installer system described in
 * docs/native-installer.md. It provides:
 * - Directory structure management with symlinks
 * - Version installation and activation
 * - Multi-process safety with locking
 * - Simple fallback mechanism using modification time
 * - Support for both JS and native builds
 */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants, type Stats } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  access,
  chmod,
  copyFile,
  lstat,
  mkdir,
  readdir,
  readlink,
  realpath,
  rename,
  rm,
  rmdir,
  stat,
  symlink,
  unlink,
  writeFile,
} from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, delimiter, dirname, join, resolve } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 引入 getMaxVersion、shouldSkipVersion，将 ../autoUpdater.js 中已经封装好的能力接到本文件流程里。
import { getMaxVersion, shouldSkipVersion } from '../autoUpdater.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getCurrentInstallationType，将 ../doctorDiagnostic.js 中已经封装好的能力接到本文件流程里。
import { getCurrentInstallationType } from '../doctorDiagnostic.js'
// 引入 env，将 ../env.js 中已经封装好的能力接到本文件流程里。
import { env } from '../env.js'
// 引入 envDynamic，将 ../envDynamic.js 中已经封装好的能力接到本文件流程里。
import { envDynamic } from '../envDynamic.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 errorMessage、getErrnoCode、isENOENT、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode, isENOENT, toError } from '../errors.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 getShellType，将 ../localInstaller.js 中已经封装好的能力接到本文件流程里。
import { getShellType } from '../localInstaller.js'
// 引入 * as lockfile，将 ../lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from '../lockfile.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 gt、gte，将 ../semver.js 中已经封装好的能力接到本文件流程里。
import { gt, gte } from '../semver.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterClaudeAliases,
  getShellConfigPaths,
  readFileLines,
  writeFileLines,
} from '../shellConfig.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getUserBinDir,
  getXDGCacheHome,
  getXDGDataHome,
  getXDGStateHome,
} from '../xdg.js'
// 引入 downloadVersion、getLatestVersion，将 ./download.js 中已经封装好的能力接到本文件流程里。
import { downloadVersion, getLatestVersion } from './download.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  acquireProcessLifetimeLock,
  cleanupStaleLocks,
  isLockActive,
  isPidBasedLockingEnabled,
  readLockContent,
  withLock,
} from './pidLock.js'

// VERSION_RETENTION_COUNT 数量 命名 `2`，让后续代码直接表达这个值的用途。
export const VERSION_RETENTION_COUNT = 2

// 7 days in milliseconds - used for mtime-based lock stale timeout.
// This is long enough to survive laptop sleep durations while still
// allowing cleanup of abandoned locks from crashed processes within a reasonable time.
// LOCK_STALE_MS 集合保存`7 * 24 * 60 * 60 * 1000`，供后续判断或组装使用。
const LOCK_STALE_MS = 7 * 24 * 60 * 60 * 1000

// SetupMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetupMessage = {
  message: string
  userActionRequired: boolean
  type: 'path' | 'alias' | 'info' | 'error'
}

// getPlatform 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlatform(): string {
  // Use env.platform which already handles platform detection and defaults to 'linux'
  // os 集合 命名 `env.platform`，让后续代码直接表达这个值的用途。
  const os = env.platform

  // arch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const arch =
    process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : null

  // arch缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!arch) {
    // 错误保存`Error`，供共享工具后续处理使用。
    const error = new Error(`Unsupported architecture: ${process.arch}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Native installer does not support architecture: ${process.arch}`,
      { level: 'error' },
    )
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }

  // Check for musl on Linux and adjust platform accordingly
  // 只有 `os === 'linux' && envDynamic.isMuslEnvironment()` 满足时，共享工具才执行该分支。
  if (os === 'linux' && envDynamic.isMuslEnvironment()) {
    // 返回 ``linux-${arch}-musl``，作为共享工具这次计算的结果。
    return `linux-${arch}-musl`
  }

  // 返回 ``${os}-${arch}``，作为共享工具这次计算的结果。
  return `${os}-${arch}`
}

// getBinaryName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBinaryName(platform: string): string {
  // 返回 `platform.startsWith('win32') ? 'claude.exe' : 'claude'`，作为共享工具这次计算的结果。
  return platform.startsWith('win32') ? 'claude.exe' : 'claude'
}

// getBaseDirectories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBaseDirectories() {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // executableName读取`getBinaryName`，供共享工具后续处理使用。
  const executableName = getBinaryName(platform)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // Data directories (permanent storage)
    versions: join(getXDGDataHome(), 'claude', 'versions'),

    // Cache directories (can be deleted)
    staging: join(getXDGCacheHome(), 'claude', 'staging'),

    // State directories
    locks: join(getXDGStateHome(), 'claude', 'locks'),

    // User bin
    executable: join(getUserBinDir(), executableName),
  }
}

// isPossibleClaudeBinary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isPossibleClaudeBinary(filePath: string): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供共享工具后续处理使用。
    const stats = await stat(filePath)
    // before download, the version lock file (located at the same filePath) will be size 0
    // also, we allow small sizes because we want to treat small wrapper scripts as valid
    // 只有 `!stats.isFile() || stats.size === 0` 满足时，共享工具才执行该分支。
    if (!stats.isFile() || stats.size === 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Check if file is executable. Note: On Windows, this relies on file extensions
    // (.exe, .bat, .cmd) and ACL permissions rather than Unix permission bits,
    // so it may not work perfectly for all executable files on Windows.
    // 等待 `access(filePath, fsConstants.X_OK)` 完成，再继续共享工具 installer的异步流程。
    await access(filePath, fsConstants.X_OK)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// getVersionPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getVersionPaths(version: string) {
  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()

  // Create directories, but not the executable path (which is a file)
  // dirsToCreate 聚合成有序列表，保持后续遍历顺序稳定。
  const dirsToCreate = [dirs.versions, dirs.staging, dirs.locks]
  // 这个回调绑定到 await Promise.all(dirsToCreate.map(dir => mkdir(dir, { recursive: true })))，负责共享工具在该局部场景下的响应。
  await Promise.all(dirsToCreate.map(dir => mkdir(dir, { recursive: true })))

  // Ensure parent directory of executable exists
  // executableParentDir保存`dirname`，供共享工具后续处理使用。
  const executableParentDir = dirname(dirs.executable)
  // 等待 `mkdir(executableParentDir, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
  await mkdir(executableParentDir, { recursive: true })

  // installPath 路径数据格式化`join`，供共享工具后续处理使用。
  const installPath = join(dirs.versions, version)

  // Create an empty file if it doesn't exist
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(installPath)` 完成，再继续共享工具 installer的异步流程。
    await stat(installPath)
  } catch {
    // 等待 `writeFile(installPath, '', { encoding: 'utf8' })` 完成，再继续共享工具 installer的异步流程。
    await writeFile(installPath, '', { encoding: 'utf8' })
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    stagingPath: join(dirs.staging, version),
    installPath,
  }
}

// Execute a callback while holding a lock on a version file
// Returns false if the file is already locked, true if callback executed
// tryWithVersionLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryWithVersionLock(
  versionFilePath: string,
  // 这个回调绑定到 callback: () => void | Promise<void>,，负责共享工具在该局部场景下的响应。
  callback: () => void | Promise<void>,
  retries = 0,
): Promise<boolean> {
  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()

  // lockfilePath 路径数据读取`getLockFilePathFromVersionPath`，供共享工具后续处理使用。
  const lockfilePath = getLockFilePathFromVersionPath(dirs, versionFilePath)

  // Ensure the locks directory exists
  // 等待 `mkdir(dirs.locks, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
  await mkdir(dirs.locks, { recursive: true })

  // 满足 `isPidBasedLockingEnabled()` 时，共享工具执行该分支。
  if (isPidBasedLockingEnabled()) {
    // Use PID-based locking with optional retries
    // attempts 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let attempts = 0
    // maxAttempts 集合保存`retries + 1`，供共享工具 installer后续判断或输出使用。
    const maxAttempts = retries + 1
    // minTimeout保存`retries > 0 ? 1000 : 100`，供后续判断或组装使用。
    const minTimeout = retries > 0 ? 1000 : 100
    // maxTimeout保存`retries > 0 ? 5000 : 500`，供共享工具 installer后续判断或输出使用。
    const maxTimeout = retries > 0 ? 5000 : 500

    // while 使用 attempts < maxAttempts 完成共享工具里的对应操作。
    while (attempts < maxAttempts) {
      // success 集合保存`withLock`，供共享工具后续处理使用。
      const success = await withLock(
        versionFilePath,
        lockfilePath,
        // 调用 async，触发共享工具此处需要的副作用。
        async () => {
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `callback()` 完成，再继续共享工具 installer的异步流程。
            await callback()
          } catch (error) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logError(error)
            // 抛出 error，阻止共享工具在无效状态下继续运行。
            throw error
          }
        },
      )

      // 满足 `success` 时，共享工具执行该分支。
      if (success) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_version_lock_acquired', {
          is_pid_based: true,
          is_lifetime_lock: false,
          attempts: attempts + 1,
        })
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }

      // 共享工具 installer在这里处理 `attempts++`，完成这一小步状态转换。
      attempts++
      // 满足 `attempts < maxAttempts` 时，共享工具执行该分支。
      if (attempts < maxAttempts) {
        // Wait before retrying with exponential backoff
        // timeout保存`Math.min`，供共享工具后续处理使用。
        const timeout = Math.min(
          minTimeout * Math.pow(2, attempts - 1),
          maxTimeout,
        )
        // 等待 `sleep(timeout)` 完成，再继续共享工具 installer的异步流程。
        await sleep(timeout)
      }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_version_lock_failed', {
      is_pid_based: true,
      is_lifetime_lock: false,
      attempts: maxAttempts,
    })
    // 调用 logLockAcquisitionError，触发共享工具此处需要的副作用。
    logLockAcquisitionError(
      versionFilePath,
      new Error('Lock held by another process'),
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Use mtime-based locking (proper-lockfile) with 30-day stale timeout
  // 这个回调绑定到 let release: (() => Promise<void>) | null = null，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | null = null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Lock acquisition phase - catch lock errors and return false
    // Use 30 days for stale to match lockCurrentVersion() - this ensures we never
    // consider a running process's lock as stale during normal usage (including
    // laptop sleep). 30 days allows eventual cleanup of abandoned locks from
    // crashed processes while being long enough for any realistic session.
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // release更新为 `await lockfile.lock(versionFilePath, {`，确保共享工具后续读取最新状态。
      release = await lockfile.lock(versionFilePath, {
        stale: LOCK_STALE_MS,
        retries: {
          retries,
          minTimeout: retries > 0 ? 1000 : 100,
          maxTimeout: retries > 0 ? 5000 : 500,
        },
        lockfilePath,
        // Handle lock compromise gracefully to prevent unhandled rejections
        // This can happen if another process deletes the lock directory while we hold it
        // 这个回调绑定到 onCompromised: (err: Error) => {，负责共享工具在该局部场景下的响应。
        onCompromised: (err: Error) => {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `NON-FATAL: Version lock was compromised during operation: ${err.message}`,
            { level: 'info' },
          )
        },
      })
    } catch (lockError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_version_lock_failed', {
        is_pid_based: false,
        is_lifetime_lock: false,
      })
      // 调用 logLockAcquisitionError，触发共享工具此处需要的副作用。
      logLockAcquisitionError(versionFilePath, lockError)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Operation phase - log errors but let them propagate
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `callback()` 完成，再继续共享工具 installer的异步流程。
      await callback()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_version_lock_acquired', {
        is_pid_based: false,
        is_lifetime_lock: false,
      })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 installer的异步流程。
      await release()
    }
  }
}

// atomicMoveToInstallPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function atomicMoveToInstallPath(
  stagedBinaryPath: string,
  installPath: string,
) {
  // Create installation directory if it doesn't exist
  // 等待 `mkdir(dirname(installPath), { recursive: true })` 完成，再继续共享工具 installer的异步流程。
  await mkdir(dirname(installPath), { recursive: true })

  // Move from staging to final location atomically
  // tempInstallPath 路径数据记录时间`Date.now`，供共享工具后续处理使用。
  const tempInstallPath = `${installPath}.tmp.${process.pid}.${Date.now()}`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Copy to temp next to install path, then rename. A direct rename from staging
    // would fail with EXDEV if staging and install are on different filesystems.
    // 等待 `copyFile(stagedBinaryPath, tempInstallPath)` 完成，再继续共享工具 installer的异步流程。
    await copyFile(stagedBinaryPath, tempInstallPath)
    // 等待 `chmod(tempInstallPath, 0o755)` 完成，再继续共享工具 installer的异步流程。
    await chmod(tempInstallPath, 0o755)
    // 等待 `rename(tempInstallPath, installPath)` 完成，再继续共享工具 installer的异步流程。
    await rename(tempInstallPath, installPath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Atomically installed binary to ${installPath}`)
  } catch (error) {
    // Clean up temp file if it exists
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(tempInstallPath)` 完成，再继续共享工具 installer的异步流程。
      await unlink(tempInstallPath)
    } catch {
      // Ignore cleanup errors
    }
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// installVersionFromPackage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installVersionFromPackage(
  stagingPath: string,
  installPath: string,
) {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Extract binary from npm package structure in staging
    // nodeModulesDir格式化`join`，供共享工具后续处理使用。
    const nodeModulesDir = join(stagingPath, 'node_modules', '@anthropic-ai')
    // entries 集合读取`readdir`，供共享工具后续处理使用。
    const entries = await readdir(nodeModulesDir)
    // nativePackage筛选`entries.find`，供共享工具后续处理使用。
    const nativePackage = entries.find((entry: string) =>
      entry.startsWith('claude-cli-native-'),
    )

    // nativePackage缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!nativePackage) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_install_package_failure', {
        stage_find_package: true,
        error_package_not_found: true,
      })
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error('Could not find platform-specific native package')
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }

    // stagedBinaryPath 路径数据格式化`join`，供共享工具后续处理使用。
    const stagedBinaryPath = join(nodeModulesDir, nativePackage, 'cli')

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(stagedBinaryPath)` 完成，再继续共享工具 installer的异步流程。
      await stat(stagedBinaryPath)
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_install_package_failure', {
        stage_binary_exists: true,
        error_binary_not_found: true,
      })
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error('Native binary not found in staged package')
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }

    // 等待 `atomicMoveToInstallPath(stagedBinaryPath, installPath)` 完成，再继续共享工具 installer的异步流程。
    await atomicMoveToInstallPath(stagedBinaryPath, installPath)

    // Clean up staging directory
    // 等待 `rm(stagingPath, { recursive: true, force: true })` 完成，再继续共享工具 installer的异步流程。
    await rm(stagingPath, { recursive: true, force: true })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_install_package_success', {})
  } catch (error) {
    // Log if not already logged above
    // 消息保存`errorMessage`，供共享工具后续处理使用。
    const msg = errorMessage(error)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !msg.includes('Could not find platform-specific') &&
      !msg.includes('Native binary not found')
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_install_package_failure', {
        stage_atomic_move: true,
        error_move_failed: true,
      })
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// installVersionFromBinary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installVersionFromBinary(
  stagingPath: string,
  installPath: string,
) {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // For direct binary downloads (GCS, generic bucket), the binary is directly in staging
    // platform读取`getPlatform`，供共享工具后续处理使用。
    const platform = getPlatform()
    // binaryName读取`getBinaryName`，供共享工具后续处理使用。
    const binaryName = getBinaryName(platform)
    // stagedBinaryPath 路径数据格式化`join`，供共享工具后续处理使用。
    const stagedBinaryPath = join(stagingPath, binaryName)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(stagedBinaryPath)` 完成，再继续共享工具 installer的异步流程。
      await stat(stagedBinaryPath)
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_install_binary_failure', {
        stage_binary_exists: true,
        error_binary_not_found: true,
      })
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error('Staged binary not found')
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }

    // 等待 `atomicMoveToInstallPath(stagedBinaryPath, installPath)` 完成，再继续共享工具 installer的异步流程。
    await atomicMoveToInstallPath(stagedBinaryPath, installPath)

    // Clean up staging directory
    // 等待 `rm(stagingPath, { recursive: true, force: true })` 完成，再继续共享工具 installer的异步流程。
    await rm(stagingPath, { recursive: true, force: true })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_install_binary_success', {})
  } catch (error) {
    // 满足 `!errorMessage(error).includes('Staged binary not found')` 时，共享工具执行该分支。
    if (!errorMessage(error).includes('Staged binary not found')) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_install_binary_failure', {
        stage_atomic_move: true,
        error_move_failed: true,
      })
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// installVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installVersion(
  stagingPath: string,
  installPath: string,
  downloadType: 'npm' | 'binary',
) {
  // Use the explicit download type instead of guessing
  // 当 `downloadType` 匹配 `'npm'` 时，共享工具执行对应分支。
  if (downloadType === 'npm') {
    // 等待 `installVersionFromPackage(stagingPath, installPath)` 完成，再继续共享工具 installer的异步流程。
    await installVersionFromPackage(stagingPath, installPath)
  } else {
    // 等待 `installVersionFromBinary(stagingPath, installPath)` 完成，再继续共享工具 installer的异步流程。
    await installVersionFromBinary(stagingPath, installPath)
  }
}

/**
 * Performs the core update operation: download (if needed), install, and update symlink.
 * Returns whether a new install was performed (vs just updating symlink).
 */
// performVersionUpdate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function performVersionUpdate(
  version: string,
  forceReinstall: boolean,
): Promise<boolean> {
  // 共享工具 installer先整理这一处局部数据，后续分支可以直接读取。
  const { stagingPath: baseStagingPath, installPath } =
    await getVersionPaths(version)
  // 从 `getBaseDirectories()` 解构 executable，减少共享工具 installer对同一对象的重复访问。
  const { executable: executablePath } = getBaseDirectories()

  // For lockless updates, use a unique staging path to avoid conflicts between concurrent downloads
  // stagingPath 路径数据保存`isEnvTruthy`，供共享工具后续处理使用。
  const stagingPath = isEnvTruthy(process.env.ENABLE_LOCKLESS_UPDATES)
    ? `${baseStagingPath}.${process.pid}.${Date.now()}`
    : baseStagingPath

  // Only download if not already installed (or if force reinstall)
  // needsInstall记录 `versionIsAvailable` 是否成立，共享工具随后按该结果分支。
  const needsInstall = !(await versionIsAvailable(version)) || forceReinstall
  // 满足 `needsInstall` 时，共享工具执行该分支。
  if (needsInstall) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      forceReinstall
        ? `Force reinstalling native installer version ${version}`
        : `Downloading native installer version ${version}`,
    )
    // downloadType读取`downloadVersion`，供共享工具后续处理使用。
    const downloadType = await downloadVersion(version, stagingPath)
    // 等待 `installVersion(stagingPath, installPath, downloadType)` 完成，再继续共享工具 installer的异步流程。
    await installVersion(stagingPath, installPath, downloadType)
  } else {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Version ${version} already installed, updating symlink`)
  }

  // Create direct symlink from ~/.local/bin/claude to the version binary
  // 等待 `removeDirectoryIfEmpty(executablePath)` 完成，再继续共享工具 installer的异步流程。
  await removeDirectoryIfEmpty(executablePath)
  // 等待 `updateSymlink(executablePath, installPath)` 完成，再继续共享工具 installer的异步流程。
  await updateSymlink(executablePath, installPath)

  // Verify the executable was actually created/updated
  // 满足 `!(await isPossibleClaudeBinary(executablePath))` 时，共享工具执行该分支。
  if (!(await isPossibleClaudeBinary(executablePath))) {
    // installPathExists 路径数据标记共享工具 installer是否启用对应路径。
    let installPathExists = false
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(installPath)` 完成，再继续共享工具 installer的异步流程。
      await stat(installPath)
      // installPathExists 路径数据更新为 `true`，确保共享工具后续读取最新状态。
      installPathExists = true
    } catch {
      // installPath doesn't exist
    }
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Failed to create executable at ${executablePath}. ` +
        `Source file exists: ${installPathExists}. ` +
        `Check write permissions to ${executablePath}.`,
    )
  }
  // 返回 `needsInstall`，作为共享工具这次计算的结果。
  return needsInstall
}

// versionIsAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function versionIsAvailable(version: string): Promise<boolean> {
  // 从 `await getVersionPaths(version)` 解构 installPath，减少共享工具 installer对同一对象的重复访问。
  const { installPath } = await getVersionPaths(version)
  // 返回 `isPossibleClaudeBinary(installPath)`，作为共享工具这次计算的结果。
  return isPossibleClaudeBinary(installPath)
}

// updateLatest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updateLatest(
  channelOrVersion: string,
  forceReinstall: boolean = false,
): Promise<{
  success: boolean
  latestVersion: string
  lockFailed?: boolean
  lockHolderPid?: number
}> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // version读取`getLatestVersion`，供共享工具后续处理使用。
  let version = await getLatestVersion(channelOrVersion)
  // 从 `getBaseDirectories()` 解构 executable，减少共享工具 installer对同一对象的重复访问。
  const { executable: executablePath } = getBaseDirectories()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Checking for native installer update to version ${version}`)

  // Check if max version is set (server-side kill switch for auto-updates)
  // forceReinstall缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!forceReinstall) {
    // maxVersion读取`getMaxVersion`，供共享工具后续处理使用。
    const maxVersion = await getMaxVersion()
    // 只有 `maxVersion && gt(version, maxVersion)` 满足时，共享工具才执行该分支。
    if (maxVersion && gt(version, maxVersion)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Native installer: maxVersion ${maxVersion} is set, capping update from ${version} to ${maxVersion}`,
      )
      // If we're already at or above maxVersion, skip the update entirely
      // 满足 `gte(MACRO.VERSION, maxVersion)` 时，共享工具执行该分支。
      if (gte(MACRO.VERSION, maxVersion)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Native installer: current version ${MACRO.VERSION} is already at or above maxVersion ${maxVersion}, skipping update`,
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_native_update_skipped_max_version', {
          latency_ms: Date.now() - startTime,
          max_version:
            maxVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          available_version:
            version as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { success: true, latestVersion: version }
      }
      // version更新为 `maxVersion`，确保共享工具后续读取最新状态。
      version = maxVersion
    }
  }

  // Early exit: if we're already running this exact version AND both the version binary
  // and executable exist and are valid. We need to proceed if the executable doesn't exist,
  // is invalid (e.g., empty/corrupted from a failed install), or we're running via npx.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !forceReinstall &&
    version === MACRO.VERSION &&
    (await versionIsAvailable(version)) &&
    (await isPossibleClaudeBinary(executablePath))
  ) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Found ${version} at ${executablePath}, skipping install`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_update_complete', {
      latency_ms: Date.now() - startTime,
      was_new_install: false,
      was_force_reinstall: false,
      was_already_running: true,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, latestVersion: version }
  }

  // Check if this version should be skipped due to minimumVersion setting
  // 只有 `!forceReinstall && shouldSkipVersion(version)` 满足时，共享工具才执行该分支。
  if (!forceReinstall && shouldSkipVersion(version)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_update_skipped_minimum_version', {
      latency_ms: Date.now() - startTime,
      target_version:
        version as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, latestVersion: version }
  }

  // Track if we're actually installing or just symlinking
  // wasNewInstall标记共享工具 installer是否启用对应路径。
  let wasNewInstall = false
  // latencyMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let latencyMs: number

  // 满足 `isEnvTruthy(process.env.ENABLE_LOCKLESS_UPDATES)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.ENABLE_LOCKLESS_UPDATES)) {
    // Lockless: rely on atomic operations, errors propagate
    // wasNewInstall更新为 `await performVersionUpdate(version, forceReinstall)`，确保共享工具后续读取最新状态。
    wasNewInstall = await performVersionUpdate(version, forceReinstall)
    // latencyMs 集合更新为 `Date.now() - startTime`，确保共享工具后续读取最新状态。
    latencyMs = Date.now() - startTime
  } else {
    // Lock-based updates
    // 从 `await getVersionPaths(version)` 解构 installPath，减少共享工具 installer对同一对象的重复访问。
    const { installPath } = await getVersionPaths(version)
    // If force reinstall, remove any existing lock to bypass stale locks
    // 满足 `forceReinstall` 时，共享工具执行该分支。
    if (forceReinstall) {
      // 等待 `forceRemoveLock(installPath)` 完成，再继续共享工具 installer的异步流程。
      await forceRemoveLock(installPath)
    }

    // lockAcquired保存`tryWithVersionLock`，供共享工具后续处理使用。
    const lockAcquired = await tryWithVersionLock(
      installPath,
      // 调用 async，触发共享工具此处需要的副作用。
      async () => {
        // wasNewInstall更新为 `await performVersionUpdate(version, forceReinstall)`，确保共享工具后续读取最新状态。
        wasNewInstall = await performVersionUpdate(version, forceReinstall)
      },
      3, // retries
    )

    // latencyMs 集合更新为 `Date.now() - startTime`，确保共享工具后续读取最新状态。
    latencyMs = Date.now() - startTime

    // Lock acquisition failed - get lock holder PID for error message
    // lockAcquired缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!lockAcquired) {
      // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
      const dirs = getBaseDirectories()
      // lockHolderPid 先占位，稍后的条件分支会根据实际输入补齐它。
      let lockHolderPid: number | undefined
      // 满足 `isPidBasedLockingEnabled()` 时，共享工具执行该分支。
      if (isPidBasedLockingEnabled()) {
        // lockfilePath 路径数据读取`getLockFilePathFromVersionPath`，供共享工具后续处理使用。
        const lockfilePath = getLockFilePathFromVersionPath(dirs, installPath)
        // 满足 `isLockActive(lockfilePath)` 时，共享工具执行该分支。
        if (isLockActive(lockfilePath)) {
          // lockHolderPid更新为 `readLockContent(lockfilePath)?.pid`，确保共享工具后续读取最新状态。
          lockHolderPid = readLockContent(lockfilePath)?.pid
        }
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_update_lock_failed', {
        latency_ms: latencyMs,
        lock_holder_pid: lockHolderPid,
      })
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        latestVersion: version,
        lockFailed: true,
        lockHolderPid,
      }
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_native_update_complete', {
    latency_ms: latencyMs,
    was_new_install: wasNewInstall,
    was_force_reinstall: forceReinstall,
  })
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Successfully updated to version ${version}`)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { success: true, latestVersion: version }
}

// Exported for testing
// removeDirectoryIfEmpty 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeDirectoryIfEmpty(path: string): Promise<void> {
  // rmdir alone handles all cases: ENOTDIR if path is a file, ENOTEMPTY if
  // directory is non-empty, ENOENT if missing. No need to stat+readdir first.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rmdir(path)` 完成，再继续共享工具 installer的异步流程。
    await rmdir(path)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Removed empty directory at ${path}`)
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // Expected cases (not-a-dir, missing, not-empty) — silently skip.
    // ENOTDIR is the normal path: executablePath is typically a symlink.
    // `code` 与 `'ENOTDIR' && code !== 'ENOENT' ...` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOTDIR' && code !== 'ENOENT' && code !== 'ENOTEMPTY') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Could not remove directory at ${path}: ${error}`)
    }
  }
}

// updateSymlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updateSymlink(
  symlinkPath: string,
  targetPath: string,
): Promise<boolean> {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // isWindows 集合记录 `platform.startsWith` 是否成立，共享工具随后按该结果分支。
  const isWindows = platform.startsWith('win32')

  // On Windows, directly copy the executable instead of creating a symlink
  // 满足 `isWindows` 时，共享工具执行该分支。
  if (isWindows) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Ensure parent directory exists
      // parentDir保存`dirname`，供共享工具后续处理使用。
      const parentDir = dirname(symlinkPath)
      // 等待 `mkdir(parentDir, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
      await mkdir(parentDir, { recursive: true })

      // Check if file already exists and has same content
      // existingStats 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let existingStats: Stats | undefined
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // existingStats 集合更新为 `await stat(symlinkPath)`，确保共享工具后续读取最新状态。
        existingStats = await stat(symlinkPath)
      } catch {
        // symlinkPath doesn't exist
      }

      // 满足 `existingStats` 时，共享工具执行该分支。
      if (existingStats) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // targetStats 集合保存`stat`，供共享工具后续处理使用。
          const targetStats = await stat(targetPath)
          // If sizes match, assume files are the same (avoid reading large files)
          // 满足 `existingStats.size === targetStats.size` 时，共享工具执行该分支。
          if (existingStats.size === targetStats.size) {
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
        } catch {
          // Continue with copy if we can't compare
        }
        // Use rename strategy to handle file locking on Windows
        // Rename always works even for running executables, unlike delete
        // oldFileName 文件数据记录时间`Date.now`，供共享工具后续处理使用。
        const oldFileName = `${symlinkPath}.old.${Date.now()}`
        // 等待 `rename(symlinkPath, oldFileName)` 完成，再继续共享工具 installer的异步流程。
        await rename(symlinkPath, oldFileName)

        // Try to copy new executable, with rollback on failure
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `copyFile(targetPath, symlinkPath)` 完成，再继续共享工具 installer的异步流程。
          await copyFile(targetPath, symlinkPath)
          // Success - try immediate cleanup of old file (non-blocking)
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `unlink(oldFileName)` 完成，再继续共享工具 installer的异步流程。
            await unlink(oldFileName)
          } catch {
            // File still running - ignore, Windows will clean up eventually
          }
        } catch (copyError) {
          // Copy failed - restore the old executable
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `rename(oldFileName, symlinkPath)` 完成，再继续共享工具 installer的异步流程。
            await rename(oldFileName, symlinkPath)
          } catch (restoreError) {
            // Critical: User left without working executable - prioritize restore error
            // errorWithCause 错误信息保存`Error`，供共享工具后续处理使用。
            const errorWithCause = new Error(
              `Failed to restore old executable: ${restoreError}`,
              { cause: copyError },
            )
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logError(errorWithCause)
            // 抛出 errorWithCause，阻止共享工具在无效状态下继续运行。
            throw errorWithCause
          }
          // 抛出 copyError，阻止共享工具在无效状态下继续运行。
          throw copyError
        }
      } else {
        // First-time installation (no existing file to rename)
        // Copy the executable directly; handle ENOENT from copyFile itself
        // rather than a stat() pre-check (avoids TOCTOU + extra syscall)
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `copyFile(targetPath, symlinkPath)` 完成，再继续共享工具 installer的异步流程。
          await copyFile(targetPath, symlinkPath)
        } catch (e) {
          // 满足 `isENOENT(e)` 时，共享工具执行该分支。
          if (isENOENT(e)) {
            // 抛出 new Error(`Source file does not exist: ${targetPath}`)，阻止共享工具在无效状态下继续运行。
            throw new Error(`Source file does not exist: ${targetPath}`)
          }
          // 抛出 e，阻止共享工具在无效状态下继续运行。
          throw e
        }
      }
      // chmod is not needed on Windows - executability is determined by .exe extension
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Failed to copy executable from ${targetPath} to ${symlinkPath}: ${error}`,
        ),
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // For non-Windows platforms, use symlinks as before
  // Ensure parent directory exists (same as Windows path above)
  // parentDir保存`dirname`，供共享工具后续处理使用。
  const parentDir = dirname(symlinkPath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(parentDir, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
    await mkdir(parentDir, { recursive: true })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Created directory ${parentDir} for symlink`)
  } catch (mkdirError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to create directory ${parentDir}: ${mkdirError}`),
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if symlink already exists and points to the correct target
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // symlinkExists 集合标记共享工具 installer是否启用对应路径。
    let symlinkExists = false
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(symlinkPath)` 完成，再继续共享工具 installer的异步流程。
      await stat(symlinkPath)
      // symlinkExists 集合更新为 `true`，确保共享工具后续读取最新状态。
      symlinkExists = true
    } catch {
      // symlinkPath doesn't exist
    }

    // 满足 `symlinkExists` 时，共享工具执行该分支。
    if (symlinkExists) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // currentTarget读取`readlink`，供共享工具后续处理使用。
        const currentTarget = await readlink(symlinkPath)
        // resolvedCurrentTarget读取`resolve`，供共享工具后续处理使用。
        const resolvedCurrentTarget = resolve(
          dirname(symlinkPath),
          currentTarget,
        )
        // resolvedTargetPath 路径数据读取`resolve`，供共享工具后续处理使用。
        const resolvedTargetPath = resolve(targetPath)

        // 满足 `resolvedCurrentTarget === resolvedTargetPath` 时，共享工具执行该分支。
        if (resolvedCurrentTarget === resolvedTargetPath) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      } catch {
        // Path exists but is not a symlink - will remove it below
      }

      // Remove existing file/symlink before creating new one
      // 等待 `unlink(symlinkPath)` 完成，再继续共享工具 installer的异步流程。
      await unlink(symlinkPath)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to check/remove existing symlink: ${error}`))
  }

  // Use atomic rename to avoid race conditions. Create symlink with temporary name
  // then atomically rename to final name. This ensures the symlink always exists
  // and is always valid, even with concurrent updates.
  // tempSymlink记录时间`Date.now`，供共享工具后续处理使用。
  const tempSymlink = `${symlinkPath}.tmp.${process.pid}.${Date.now()}`
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `symlink(targetPath, tempSymlink)` 完成，再继续共享工具 installer的异步流程。
    await symlink(targetPath, tempSymlink)

    // Atomically rename to final name (replaces existing)
    // 等待 `rename(tempSymlink, symlinkPath)` 完成，再继续共享工具 installer的异步流程。
    await rename(tempSymlink, symlinkPath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Atomically updated symlink ${symlinkPath} -> ${targetPath}`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // Clean up temp symlink if it exists
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(tempSymlink)` 完成，再继续共享工具 installer的异步流程。
      await unlink(tempSymlink)
    } catch {
      // Ignore cleanup errors
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Failed to create symlink from ${symlinkPath} to ${targetPath}: ${error}`,
      ),
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// checkInstall 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkInstall(
  force: boolean = false,
): Promise<SetupMessage[]> {
  // Skip all installation checks if disabled via environment variable
  // 满足 `isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Get the actual installation type and config
  // installationType读取`getCurrentInstallationType`，供共享工具后续处理使用。
  const installationType = await getCurrentInstallationType()

  // Skip checks for development builds - config.installMethod from a previous
  // native installation shouldn't trigger warnings when running dev builds
  // 当 `installationType` 匹配 `'development'` 时，共享工具执行对应分支。
  if (installationType === 'development') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()

  // Only show warnings if:
  // 1. User is actually running from native installation, OR
  // 2. User has explicitly set installMethod to 'native' in config (they're trying to use native)
  // 3. force is true (used during installation process)
  // shouldCheckNative 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldCheckNative =
    force || installationType === 'native' || config.installMethod === 'native'

  // shouldCheckNative缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shouldCheckNative) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()
  // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messages: SetupMessage[] = []
  // localBinDir保存`dirname`，供共享工具后续处理使用。
  const localBinDir = dirname(dirs.executable)
  // resolvedLocalBinPath 路径数据读取`resolve`，供共享工具后续处理使用。
  const resolvedLocalBinPath = resolve(localBinDir)
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // isWindows 集合记录 `platform.startsWith` 是否成立，共享工具随后按该结果分支。
  const isWindows = platform.startsWith('win32')

  // Check if bin directory exists
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `access(localBinDir)` 完成，再继续共享工具 installer的异步流程。
    await access(localBinDir)
  } catch {
    // 对话消息追加新条目，保持收集顺序与输入顺序一致。
    messages.push({
      message: `installMethod is native, but directory ${localBinDir} does not exist`,
      userActionRequired: true,
      type: 'error',
    })
  }

  // Check if claude executable exists and is valid.
  // On non-Windows, call readlink directly and route errno — ENOENT means
  // the executable is missing, EINVAL means it exists but isn't a symlink.
  // This avoids an access()→readlink() TOCTOU where deletion between the
  // two calls produces a misleading "Not a symlink" diagnostic.
  // isPossibleClaudeBinary stats the path internally, so we don't pre-check
  // with access() — that would be a TOCTOU between access and the stat.
  // 满足 `isWindows` 时，共享工具执行该分支。
  if (isWindows) {
    // On Windows it's a copied executable, not a symlink
    // 满足 `!(await isPossibleClaudeBinary(dirs.executable))` 时，共享工具执行该分支。
    if (!(await isPossibleClaudeBinary(dirs.executable))) {
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({
        message: `installMethod is native, but claude command is missing or invalid at ${dirs.executable}`,
        userActionRequired: true,
        type: 'error',
      })
    }
  } else {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // target读取`readlink`，供共享工具后续处理使用。
      const target = await readlink(dirs.executable)
      // absoluteTarget读取`resolve`，供共享工具后续处理使用。
      const absoluteTarget = resolve(dirname(dirs.executable), target)
      // 满足 `!(await isPossibleClaudeBinary(absoluteTarget))` 时，共享工具执行该分支。
      if (!(await isPossibleClaudeBinary(absoluteTarget))) {
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push({
          message: `Claude symlink points to missing or invalid binary: ${target}`,
          userActionRequired: true,
          type: 'error',
        })
      }
    } catch (e) {
      // 满足 `isENOENT(e)` 时，共享工具执行该分支。
      if (isENOENT(e)) {
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push({
          message: `installMethod is native, but claude command not found at ${dirs.executable}`,
          userActionRequired: true,
          type: 'error',
        })
      } else {
        // EINVAL (not a symlink) or other — check as regular binary
        // 满足 `!(await isPossibleClaudeBinary(dirs.executable))` 时，共享工具执行该分支。
        if (!(await isPossibleClaudeBinary(dirs.executable))) {
          // 对话消息追加新条目，保持收集顺序与输入顺序一致。
          messages.push({
            message: `${dirs.executable} exists but is not a valid Claude binary`,
            userActionRequired: true,
            type: 'error',
          })
        }
      }
    }
  }

  // Check if bin directory is in PATH
  // isInCurrentPath 路径数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const isInCurrentPath = (process.env.PATH || '')
    .split(delimiter)
    // 链式调用 some，继续加工上一行在共享工具中产生的数据。
    .some(entry => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // resolvedEntry读取`resolve`，供共享工具后续处理使用。
        const resolvedEntry = resolve(entry)
        // On Windows, perform case-insensitive comparison for paths
        // 满足 `isWindows` 时，共享工具执行该分支。
        if (isWindows) {
          // 返回 `(`，作为共享工具这次计算的结果。
          return (
            resolvedEntry.toLowerCase() === resolvedLocalBinPath.toLowerCase()
          )
        }
        // 返回 `resolvedEntry === resolvedLocalBinPath`，作为共享工具这次计算的结果。
        return resolvedEntry === resolvedLocalBinPath
      } catch {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    })

  // isInCurrentPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isInCurrentPath) {
    // 满足 `isWindows` 时，共享工具执行该分支。
    if (isWindows) {
      // Windows-specific PATH instructions
      // windowsBinPath 路径数据格式化`localBinDir.replace`，供共享工具后续处理使用。
      const windowsBinPath = localBinDir.replace(/\//g, '\\')
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({
        message: `Native installation exists but ${windowsBinPath} is not in your PATH. Add it by opening: System Properties → Environment Variables → Edit User PATH → New → Add the path above. Then restart your terminal.`,
        userActionRequired: true,
        type: 'path',
      })
    } else {
      // Unix-style PATH instructions
      // shellType读取`getShellType`，供共享工具后续处理使用。
      const shellType = getShellType()
      // configPaths 路径数据读取`getShellConfigPaths`，供共享工具后续处理使用。
      const configPaths = getShellConfigPaths()
      // configFile 文件数据保存`configPaths[shellType as keyof typeof configPaths]`，供共享工具 installer后续判断或输出使用。
      const configFile = configPaths[shellType as keyof typeof configPaths]
      // displayPath 路径数据 命名 `configFile`，让后续代码直接表达这个值的用途。
      const displayPath = configFile
        ? configFile.replace(homedir(), '~')
        : 'your shell config file'

      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({
        message: `Native installation exists but ~/.local/bin is not in your PATH. Run:\n\necho 'export PATH="$HOME/.local/bin:$PATH"' >> ${displayPath} && source ${displayPath}`,
        userActionRequired: true,
        type: 'path',
      })
    }
  }

  // 返回 `messages`，作为共享工具这次计算的结果。
  return messages
}

// InstallLatestResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InstallLatestResult = {
  latestVersion: string | null
  wasUpdated: boolean
  lockFailed?: boolean
  lockHolderPid?: number
}

// In-process singleflight guard. NativeAutoUpdater remounts whenever the
// prompt suggestions overlay toggles (PromptInput.tsx:2916), and the
// isUpdating guard does not survive the remount. Each remount kicked off a
// fresh 271MB binary download while previous ones were still in flight.
// Telemetry: session 42fed33f saw arrayBuffers climb to 91GB at ~650MB/s.
// inFlightInstall 命名 `null`，让后续代码直接表达这个值的用途。
let inFlightInstall: Promise<InstallLatestResult> | null = null

// installLatest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function installLatest(
  channelOrVersion: string,
  forceReinstall: boolean = false,
): Promise<InstallLatestResult> {
  // 满足 `forceReinstall` 时，共享工具执行该分支。
  if (forceReinstall) {
    // 返回 `installLatestImpl(channelOrVersion, forceReinstall)`，作为共享工具这次计算的结果。
    return installLatestImpl(channelOrVersion, forceReinstall)
  }
  // 满足 `inFlightInstall` 时，共享工具执行该分支。
  if (inFlightInstall) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('installLatest: joining in-flight call')
    // 返回 `inFlightInstall`，作为共享工具这次计算的结果。
    return inFlightInstall
  }
  // promise 异步任务保存`installLatestImpl`，供共享工具后续处理使用。
  const promise = installLatestImpl(channelOrVersion, forceReinstall)
  // inFlightInstall更新为 `promise`，确保共享工具后续读取最新状态。
  inFlightInstall = promise
  // clear封装成回调，供共享工具 installer在事件触发或异步步骤中调用。
  const clear = (): void => {
    // inFlightInstall更新为 `null`，确保共享工具后续读取最新状态。
    inFlightInstall = null
  }
  // 显式忽略 `promise.then(clear, clear)` 的返回值，只保留它触发的副作用。
  void promise.then(clear, clear)
  // 返回 `promise`，作为共享工具这次计算的结果。
  return promise
}

// installLatestImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installLatestImpl(
  channelOrVersion: string,
  forceReinstall: boolean = false,
): Promise<InstallLatestResult> {
  // updateResult保存`updateLatest`，供共享工具后续处理使用。
  const updateResult = await updateLatest(channelOrVersion, forceReinstall)

  // updateResult.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!updateResult.success) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      latestVersion: null,
      wasUpdated: false,
      lockFailed: updateResult.lockFailed,
      lockHolderPid: updateResult.lockHolderPid,
    }
  }

  // Installation succeeded (early return above covers failure). Mark as native
  // and disable legacy auto-updater to protect symlinks.
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // `config.installMethod` 与 `'native'` 不一致时刷新派生状态，避免使用过期结果。
  if (config.installMethod !== 'native') {
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      installMethod: 'native',
      // Disable legacy auto-updater to prevent npm sessions from deleting native symlinks.
      // Native installations use NativeAutoUpdater instead, which respects native installation.
      autoUpdates: false,
      // Mark this as protection-based, not user preference
      autoUpdatesProtectedForNative: true,
    }))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Native installer: Set installMethod to "native" and disabled legacy auto-updater for protection',
    )
  }

  // 显式忽略 `cleanupOldVersions()` 的返回值，只保留它触发的副作用。
  void cleanupOldVersions()

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    latestVersion: updateResult.latestVersion,
    wasUpdated: updateResult.success,
    lockFailed: false,
  }
}

// getVersionFromSymlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getVersionFromSymlink(
  symlinkPath: string,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // target读取`readlink`，供共享工具后续处理使用。
    const target = await readlink(symlinkPath)
    // absoluteTarget读取`resolve`，供共享工具后续处理使用。
    const absoluteTarget = resolve(dirname(symlinkPath), target)
    // 满足 `await isPossibleClaudeBinary(absoluteTarget)` 时，共享工具执行该分支。
    if (await isPossibleClaudeBinary(absoluteTarget)) {
      // 返回 `absoluteTarget`，作为共享工具这次计算的结果。
      return absoluteTarget
    }
  } catch {
    // Not a symlink / doesn't exist / target doesn't exist
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getLockFilePathFromVersionPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLockFilePathFromVersionPath(
  dirs: ReturnType<typeof getBaseDirectories>,
  versionPath: string,
) {
  // versionName保存`basename`，供共享工具后续处理使用。
  const versionName = basename(versionPath)
  // 返回 `join(dirs.locks, `${versionName}.lock`)`，作为共享工具这次计算的结果。
  return join(dirs.locks, `${versionName}.lock`)
}

/**
 * Acquire a lock on the current running version to prevent it from being deleted
 * This lock is held for the entire lifetime of the process
 *
 * Uses PID-based locking (when enabled) which can immediately detect crashed processes
 * (unlike mtime-based locking which requires a 30-day timeout)
 */
// lockCurrentVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function lockCurrentVersion(): Promise<void> {
  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()

  // Only lock if we're running from the versions directory
  // 满足 `!process.execPath.includes(dirs.versions)` 时，共享工具执行该分支。
  if (!process.execPath.includes(dirs.versions)) {
    // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // versionPath 路径数据读取`resolve`，供共享工具后续处理使用。
  const versionPath = resolve(process.execPath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockfilePath 路径数据读取`getLockFilePathFromVersionPath`，供共享工具后续处理使用。
    const lockfilePath = getLockFilePathFromVersionPath(dirs, versionPath)

    // Ensure locks directory exists
    // 等待 `mkdir(dirs.locks, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
    await mkdir(dirs.locks, { recursive: true })

    // 满足 `isPidBasedLockingEnabled()` 时，共享工具执行该分支。
    if (isPidBasedLockingEnabled()) {
      // Acquire PID-based lock and hold it for the process lifetime
      // PID-based locking allows immediate detection of crashed processes
      // while still surviving laptop sleep (process is suspended but PID exists)
      // acquired保存`acquireProcessLifetimeLock`，供共享工具后续处理使用。
      const acquired = await acquireProcessLifetimeLock(
        versionPath,
        lockfilePath,
      )

      // acquired缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!acquired) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_version_lock_failed', {
          is_pid_based: true,
          is_lifetime_lock: true,
        })
        // 调用 logLockAcquisitionError，触发共享工具此处需要的副作用。
        logLockAcquisitionError(
          versionPath,
          new Error('Lock already held by another process'),
        )
        // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_version_lock_acquired', {
        is_pid_based: true,
        is_lifetime_lock: true,
      })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Acquired PID lock on running version: ${versionPath}`)
    } else {
      // Acquire mtime-based lock and never release it (until process exits)
      // Use 30 days for stale to prevent the lock from being considered stale during
      // normal usage. This is critical because laptop sleep suspends the process,
      // stopping the mtime heartbeat. 30 days is long enough for any realistic session
      // while still allowing eventual cleanup of abandoned locks.
      // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
      let release: (() => Promise<void>) | undefined
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // release更新为 `await lockfile.lock(versionPath, {`，确保共享工具后续读取最新状态。
        release = await lockfile.lock(versionPath, {
          stale: LOCK_STALE_MS,
          retries: 0, // Don't retry - if we can't lock, that's fine
          lockfilePath,
          // Handle lock compromise gracefully (e.g., if another process deletes the lock directory)
          // 这个回调绑定到 onCompromised: (err: Error) => {，负责共享工具在该局部场景下的响应。
          onCompromised: (err: Error) => {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `NON-FATAL: Lock on running version was compromised: ${err.message}`,
              { level: 'info' },
            )
          },
        })
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_version_lock_acquired', {
          is_pid_based: false,
          is_lifetime_lock: true,
        })
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Acquired mtime-based lock on running version: ${versionPath}`,
        )

        // Release lock explicitly; proper-lockfile's cleanup is unreliable with signal-exit v3+v4
        // 调用 registerCleanup，触发共享工具此处需要的副作用。
        registerCleanup(async () => {
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `release?.()` 完成，再继续共享工具 installer的异步流程。
            await release?.()
          } catch {
            // Lock may already be released
          }
        })
      } catch (lockError) {
        // 满足 `isENOENT(lockError)` 时，共享工具执行该分支。
        if (isENOENT(lockError)) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Cannot lock current version - file does not exist: ${versionPath}`,
            { level: 'info' },
          )
          // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_version_lock_failed', {
          is_pid_based: false,
          is_lifetime_lock: true,
        })
        // 调用 logLockAcquisitionError，触发共享工具此处需要的副作用。
        logLockAcquisitionError(versionPath, lockError)
        // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Cannot lock current version - file does not exist: ${versionPath}`,
        { level: 'info' },
      )
      // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // We fallback to previous behavior where we don't acquire a lock on a running version
    // This ~mostly works but using native binaries like ripgrep will fail
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `NON-FATAL: Failed to lock current version during execution ${errorMessage(error)}`,
      { level: 'info' },
    )
  }
}

// logLockAcquisitionError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logLockAcquisitionError(versionPath: string, lockError: unknown) {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logError(
    new Error(
      `NON-FATAL: Lock acquisition failed for ${versionPath} (expected in multi-process scenarios)`,
      { cause: lockError },
    ),
  )
}

/**
 * Force-remove a lock file for a given version path.
 * Used when --force is specified to bypass stale locks.
 */
// forceRemoveLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function forceRemoveLock(versionFilePath: string): Promise<void> {
  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()
  // lockfilePath 路径数据读取`getLockFilePathFromVersionPath`，供共享工具后续处理使用。
  const lockfilePath = getLockFilePathFromVersionPath(dirs, versionFilePath)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(lockfilePath)` 完成，再继续共享工具 installer的异步流程。
    await unlink(lockfilePath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Force-removed lock file at ${lockfilePath}`)
  } catch (error) {
    // Log but don't throw - we'll try to acquire the lock anyway
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to force-remove lock file: ${errorMessage(error)}`)
  }
}

// cleanupOldVersions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldVersions(): Promise<void> {
  // Yield to ensure we don't block startup
  // 等待 `Promise.resolve()` 完成，再继续共享工具 installer的异步流程。
  await Promise.resolve()

  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()
  // oneHourAgo记录时间`Date.now`，供共享工具后续处理使用。
  const oneHourAgo = Date.now() - 3600000

  // Clean up old renamed executables on Windows (no longer running at startup)
  // 满足 `getPlatform().startsWith('win32')` 时，共享工具执行该分支。
  if (getPlatform().startsWith('win32')) {
    // executableDir保存`dirname`，供共享工具后续处理使用。
    const executableDir = dirname(dirs.executable)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // files 文件数据读取`readdir`，供共享工具后续处理使用。
      const files = await readdir(executableDir)
      // cleanedCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let cleanedCount = 0
      // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
      for (const file of files) {
        // 满足 `!/^claude\.exe\.old\.\d+$/.test(file)` 时，共享工具执行该分支。
        if (!/^claude\.exe\.old\.\d+$/.test(file)) continue
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `unlink(join(executableDir, file))` 完成，再继续共享工具 installer的异步流程。
          await unlink(join(executableDir, file))
          // 共享工具 installer在这里处理 `cleanedCount++`，完成这一小步状态转换。
          cleanedCount++
        } catch {
          // File might still be in use by another process
        }
      }
      // 满足 `cleanedCount > 0` 时，共享工具执行该分支。
      if (cleanedCount > 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Cleaned up ${cleanedCount} old Windows executables on startup`,
        )
      }
    } catch (error) {
      // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
      if (!isENOENT(error)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to clean up old Windows executables: ${error}`)
      }
    }
  }

  // Clean up orphaned staging directories older than 1 hour
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stagingEntries 集合读取`readdir`，供共享工具后续处理使用。
    const stagingEntries = await readdir(dirs.staging)
    // stagingCleanedCount 数量保存`0`，供后续判断或组装使用。
    let stagingCleanedCount = 0
    // 按顺序遍历 `stagingEntries` 中的entry，逐个交给共享工具处理。
    for (const entry of stagingEntries) {
      // stagingPath 路径数据格式化`join`，供共享工具后续处理使用。
      const stagingPath = join(dirs.staging, entry)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // stat() is load-bearing here (we need mtime). There is a theoretical
        // TOCTOU where a concurrent installer could freshen a stale staging
        // dir between stat and rm — but the 1-hour threshold makes this
        // vanishingly unlikely, and rm({force:true}) tolerates concurrent
        // deletion.
        // stats 集合保存`stat`，供共享工具后续处理使用。
        const stats = await stat(stagingPath)
        // 满足 `stats.mtime.getTime() < oneHourAgo` 时，共享工具执行该分支。
        if (stats.mtime.getTime() < oneHourAgo) {
          // 等待 `rm(stagingPath, { recursive: true, force: true })` 完成，再继续共享工具 installer的异步流程。
          await rm(stagingPath, { recursive: true, force: true })
          // 共享工具 installer在这里处理 `stagingCleanedCount++`，完成这一小步状态转换。
          stagingCleanedCount++
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleaned up old staging directory: ${entry}`)
        }
      } catch {
        // Ignore individual errors
      }
    }
    // 满足 `stagingCleanedCount > 0` 时，共享工具执行该分支。
    if (stagingCleanedCount > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Cleaned up ${stagingCleanedCount} orphaned staging directories`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_staging_cleanup', {
        cleaned_count: stagingCleanedCount,
      })
    }
  } catch (error) {
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to clean up staging directories: ${error}`)
    }
  }

  // Clean up stale PID locks (crashed processes) — cleanupStaleLocks handles ENOENT
  // 满足 `isPidBasedLockingEnabled()` 时，共享工具执行该分支。
  if (isPidBasedLockingEnabled()) {
    // staleLocksCleaned保存`cleanupStaleLocks`，供共享工具后续处理使用。
    const staleLocksCleaned = cleanupStaleLocks(dirs.locks)
    // 满足 `staleLocksCleaned > 0` 时，共享工具执行该分支。
    if (staleLocksCleaned > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Cleaned up ${staleLocksCleaned} stale version locks`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_stale_locks_cleanup', {
        cleaned_count: staleLocksCleaned,
      })
    }
  }

  // Single readdir of versions dir. Partition into temp files vs candidate binaries,
  // stat'ing each entry at most once.
  // versionEntries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let versionEntries: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // versionEntries 集合更新为 `await readdir(dirs.versions)`，确保共享工具后续读取最新状态。
    versionEntries = await readdir(dirs.versions)
  } catch (error) {
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to readdir versions directory: ${error}`)
    }
    // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // VersionInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
  type VersionInfo = {
    name: string
    path: string
    resolvedPath: string
    mtime: Date
  }
  // versionFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const versionFiles: VersionInfo[] = []
  // tempFilesCleanedCount 文件数据保存`0`，供共享工具 installer后续判断或输出使用。
  let tempFilesCleanedCount = 0

  // 按顺序遍历 `versionEntries` 中的entry，逐个交给共享工具处理。
  for (const entry of versionEntries) {
    // entryPath 路径数据格式化`join`，供共享工具后续处理使用。
    const entryPath = join(dirs.versions, entry)
    // 满足 `/\.tmp\.\d+\.\d+$/.test(entry)` 时，共享工具执行该分支。
    if (/\.tmp\.\d+\.\d+$/.test(entry)) {
      // Orphaned temp install file — pattern: {version}.tmp.{pid}.{timestamp}
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // stats 集合保存`stat`，供共享工具后续处理使用。
        const stats = await stat(entryPath)
        // 满足 `stats.mtime.getTime() < oneHourAgo` 时，共享工具执行该分支。
        if (stats.mtime.getTime() < oneHourAgo) {
          // 等待 `unlink(entryPath)` 完成，再继续共享工具 installer的异步流程。
          await unlink(entryPath)
          // 共享工具 installer在这里处理 `tempFilesCleanedCount++`，完成这一小步状态转换。
          tempFilesCleanedCount++
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleaned up orphaned temp install file: ${entry}`)
        }
      } catch {
        // Ignore individual errors
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Candidate version binary — stat once, reuse for isFile/size/mtime/mode
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供共享工具后续处理使用。
      const stats = await stat(entryPath)
      // 满足 `!stats.isFile()` 时，共享工具执行该分支。
      if (!stats.isFile()) continue
      // 共享工具在这里按实际状态进入对应分支。
      if (
        process.platform !== 'win32' &&
        stats.size > 0 &&
        (stats.mode & 0o111) === 0
      ) {
        // Check executability via mode bits from the existing stat result —
        // avoids a second syscall (access(X_OK)) and the TOCTOU window between
        // stat and access. Skip on Windows: libuv only sets execute bits for
        // .exe/.com/.bat/.cmd, but version files are extensionless semver
        // strings (e.g. "1.2.3"), so this check would reject all of them.
        // The previous access(X_OK) passed any readable file on Windows anyway.
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // versionFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      versionFiles.push({
        name: entry,
        path: entryPath,
        resolvedPath: resolve(entryPath),
        mtime: stats.mtime,
      })
    } catch {
      // Skip files we can't stat
    }
  }

  // 满足 `tempFilesCleanedCount > 0` 时，共享工具执行该分支。
  if (tempFilesCleanedCount > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cleaned up ${tempFilesCleanedCount} orphaned temp install files`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_temp_files_cleanup', {
      cleaned_count: tempFilesCleanedCount,
    })
  }

  // versionFiles 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (versionFiles.length === 0) {
    // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Identify protected versions
    // currentBinaryPath 路径数据保存`process.execPath`，供后续判断或组装使用。
    const currentBinaryPath = process.execPath
    // protectedVersions 集合构建`new Set<string>()`，供后续判断或组装使用。
    const protectedVersions = new Set<string>()
    // 只有 `currentBinaryPath && currentBinaryPath.includes(dirs.versions)` 满足时，共享工具才执行该分支。
    if (currentBinaryPath && currentBinaryPath.includes(dirs.versions)) {
      // 调用 protectedVersions.add，触发共享工具此处需要的副作用。
      protectedVersions.add(resolve(currentBinaryPath))
    }

    // currentSymlinkVersion读取`getVersionFromSymlink`，供共享工具后续处理使用。
    const currentSymlinkVersion = await getVersionFromSymlink(dirs.executable)
    // 满足 `currentSymlinkVersion` 时，共享工具执行该分支。
    if (currentSymlinkVersion) {
      // 调用 protectedVersions.add，触发共享工具此处需要的副作用。
      protectedVersions.add(currentSymlinkVersion)
    }

    // Protect versions with active locks (running in other processes)
    // 按顺序遍历 `versionFiles` 中的v，逐个交给共享工具处理。
    for (const v of versionFiles) {
      // 满足 `protectedVersions.has(v.resolvedPath)` 时，共享工具执行该分支。
      if (protectedVersions.has(v.resolvedPath)) continue

      // lockFilePath 路径数据读取`getLockFilePathFromVersionPath`，供共享工具后续处理使用。
      const lockFilePath = getLockFilePathFromVersionPath(dirs, v.resolvedPath)
      // hasActiveLock标记共享工具 installer是否启用对应路径。
      let hasActiveLock = false
      // 满足 `isPidBasedLockingEnabled()` 时，共享工具执行该分支。
      if (isPidBasedLockingEnabled()) {
        // hasActiveLock更新为 `isLockActive(lockFilePath)`，确保共享工具后续读取最新状态。
        hasActiveLock = isLockActive(lockFilePath)
      } else {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // hasActiveLock更新为 `await lockfile.check(v.resolvedPath, {`，确保共享工具后续读取最新状态。
          hasActiveLock = await lockfile.check(v.resolvedPath, {
            stale: LOCK_STALE_MS,
            lockfilePath: lockFilePath,
          })
        } catch {
          // hasActiveLock更新为 `false`，确保共享工具后续读取最新状态。
          hasActiveLock = false
        }
      }
      // 满足 `hasActiveLock` 时，共享工具执行该分支。
      if (hasActiveLock) {
        // 调用 protectedVersions.add，触发共享工具此处需要的副作用。
        protectedVersions.add(v.resolvedPath)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Protecting locked version from cleanup: ${v.name}`)
      }
    }

    // Eligible versions: not protected, sorted newest first (reuse cached mtime)
    // eligibleVersions 集合保存`versionFiles`，供共享工具 installer后续判断或输出使用。
    const eligibleVersions = versionFiles
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(v => !protectedVersions.has(v.resolvedPath))
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    // versionsToDelete格式化`eligibleVersions.slice`，供共享工具后续处理使用。
    const versionsToDelete = eligibleVersions.slice(VERSION_RETENTION_COUNT)

    // versionsToDelete为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (versionsToDelete.length === 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_native_version_cleanup', {
        total_count: versionFiles.length,
        deleted_count: 0,
        protected_count: protectedVersions.size,
        retained_count: VERSION_RETENTION_COUNT,
        lock_failed_count: 0,
        error_count: 0,
      })
      // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // deletedCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let deletedCount = 0
    // lockFailedCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let lockFailedCount = 0
    // errorCount 错误信息 命名 `0`，让后续代码直接表达这个值的用途。
    let errorCount = 0

    // 等待 `Promise.all(` 完成，再继续共享工具 installer的异步流程。
    await Promise.all(
      // 调用 versionsToDelete.map，触发共享工具此处需要的副作用。
      versionsToDelete.map(async version => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // deleted保存`tryWithVersionLock`，供共享工具后续处理使用。
          const deleted = await tryWithVersionLock(version.path, async () => {
            // 等待 `unlink(version.path)` 完成，再继续共享工具 installer的异步流程。
            await unlink(version.path)
          })
          // 满足 `deleted` 时，共享工具执行该分支。
          if (deleted) {
            // 共享工具 installer在这里处理 `deletedCount++`，完成这一小步状态转换。
            deletedCount++
          } else {
            // 共享工具 installer在这里处理 `lockFailedCount++`，完成这一小步状态转换。
            lockFailedCount++
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Skipping deletion of ${version.name} - locked by another process`,
            )
          }
        } catch (error) {
          // 共享工具 installer在这里处理 `errorCount++`，完成这一小步状态转换。
          errorCount++
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(`Failed to delete version ${version.name}: ${error}`),
          )
        }
      }),
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_native_version_cleanup', {
      total_count: versionFiles.length,
      deleted_count: deletedCount,
      protected_count: protectedVersions.size,
      retained_count: VERSION_RETENTION_COUNT,
      lock_failed_count: lockFailedCount,
      error_count: errorCount,
    })
  } catch (error) {
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Version cleanup failed: ${error}`))
    }
  }
}

/**
 * Check if a given path is managed by npm
 * @param executablePath - The path to check (can be a symlink)
 * @returns true if the path is npm-managed, false otherwise
 */
// isNpmSymlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isNpmSymlink(executablePath: string): Promise<boolean> {
  // Resolve symlink to its target if applicable
  // targetPath 路径数据 命名 `executablePath`，让后续代码直接表达这个值的用途。
  let targetPath = executablePath
  // stats 集合保存`lstat`，供共享工具后续处理使用。
  const stats = await lstat(executablePath)
  // 满足 `stats.isSymbolicLink()` 时，共享工具执行该分支。
  if (stats.isSymbolicLink()) {
    // targetPath 路径数据更新为 `await realpath(executablePath)`，确保共享工具后续读取最新状态。
    targetPath = await realpath(executablePath)
  }

  // checking npm prefix isn't guaranteed to work, as prefix can change
  // and users may set --prefix manually when installing
  // thus we use this heuristic:
  // 返回 `targetPath.endsWith('.js') || targetPath.includes('node_modules')`，作为共享工具这次计算的结果。
  return targetPath.endsWith('.js') || targetPath.includes('node_modules')
}

/**
 * Remove the claude symlink from the executable directory
 * This is used when switching away from native installation
 * Will only remove if it's a native binary symlink, not npm-managed JS files
 */
// removeInstalledSymlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeInstalledSymlink(): Promise<void> {
  // dirs 集合读取`getBaseDirectories`，供共享工具后续处理使用。
  const dirs = getBaseDirectories()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check if this is an npm-managed installation
    // 满足 `await isNpmSymlink(dirs.executable)` 时，共享工具执行该分支。
    if (await isNpmSymlink(dirs.executable)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Skipping removal of ${dirs.executable} - appears to be npm-managed`,
      )
      // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // It's a native binary symlink, safe to remove
    // 等待 `unlink(dirs.executable)` 完成，再继续共享工具 installer的异步流程。
    await unlink(dirs.executable)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Removed claude symlink at ${dirs.executable}`)
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 共享工具 installer在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to remove claude symlink: ${error}`))
  }
}

/**
 * Clean up old claude aliases from shell configuration files
 * Only handles alias removal, not PATH setup
 */
// cleanupShellAliases 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupShellAliases(): Promise<SetupMessage[]> {
  // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messages: SetupMessage[] = []
  // configMap 配置读取`getShellConfigPaths`，供共享工具后续处理使用。
  const configMap = getShellConfigPaths()

  // 循环处理 `const [shellType, configFile] of Object.entries(configMap)`，让共享工具把同类条目按顺序走完。
  for (const [shellType, configFile] of Object.entries(configMap)) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本行读取`readFileLines`，供共享工具后续处理使用。
      const lines = await readFileLines(configFile)
      // 文本行缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!lines) continue

      // 从 `filterClaudeAliases(lines)` 解构 filtered、hadAlias，减少共享工具 installer对同一对象的重复访问。
      const { filtered, hadAlias } = filterClaudeAliases(lines)

      // 满足 `hadAlias` 时，共享工具执行该分支。
      if (hadAlias) {
        // 等待 `writeFileLines(configFile, filtered)` 完成，再继续共享工具 installer的异步流程。
        await writeFileLines(configFile, filtered)
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push({
          message: `Removed claude alias from ${configFile}. Run: unalias claude`,
          userActionRequired: true,
          type: 'alias',
        })
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Cleaned up claude alias from ${shellType} config`)
      }
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({
        message: `Failed to clean up ${configFile}: ${error}`,
        userActionRequired: false,
        type: 'error',
      })
    }
  }

  // 返回 `messages`，作为共享工具这次计算的结果。
  return messages
}

// manualRemoveNpmPackage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function manualRemoveNpmPackage(
  packageName: string,
): Promise<{ success: boolean; error?: string; warning?: string }> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Get npm global prefix
    // prefixResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const prefixResult = await execFileNoThrowWithCwd('npm', [
      'config',
      'get',
      'prefix',
    ])
    // `prefixResult.code` 与 `0 || !prefixResult.stdout` 不一致时刷新派生状态，避免使用过期结果。
    if (prefixResult.code !== 0 || !prefixResult.stdout) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: 'Failed to get npm global prefix',
      }
    }

    // globalPrefix格式化`stdout.trim`，供共享工具后续处理使用。
    const globalPrefix = prefixResult.stdout.trim()
    // manuallyRemoved标记共享工具 installer是否启用对应路径。
    let manuallyRemoved = false

    // Helper to try removing a file. unlink alone is sufficient — it throws
    // ENOENT if the file is missing, which the catch handles identically.
    // A stat() pre-check would add a syscall and a TOCTOU window where
    // concurrent cleanup causes a false-negative return.
    // tryRemove 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function tryRemove(filePath: string, description: string) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `unlink(filePath)` 完成，再继续共享工具 installer的异步流程。
        await unlink(filePath)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Manually removed ${description}: ${filePath}`)
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }

    // 满足 `getPlatform().startsWith('win32')` 时，共享工具执行该分支。
    if (getPlatform().startsWith('win32')) {
      // Windows - only remove executables, not the package directory
      // binCmd 命令数据格式化`join`，供共享工具后续处理使用。
      const binCmd = join(globalPrefix, 'claude.cmd')
      // binPs1格式化`join`，供共享工具后续处理使用。
      const binPs1 = join(globalPrefix, 'claude.ps1')
      // binExe格式化`join`，供共享工具后续处理使用。
      const binExe = join(globalPrefix, 'claude')

      // 满足 `await tryRemove(binCmd, 'bin script')` 时，共享工具执行该分支。
      if (await tryRemove(binCmd, 'bin script')) {
        // manuallyRemoved更新为 `true`，确保共享工具后续读取最新状态。
        manuallyRemoved = true
      }

      // 满足 `await tryRemove(binPs1, 'PowerShell script')` 时，共享工具执行该分支。
      if (await tryRemove(binPs1, 'PowerShell script')) {
        // manuallyRemoved更新为 `true`，确保共享工具后续读取最新状态。
        manuallyRemoved = true
      }

      // 满足 `await tryRemove(binExe, 'bin executable')` 时，共享工具执行该分支。
      if (await tryRemove(binExe, 'bin executable')) {
        // manuallyRemoved更新为 `true`，确保共享工具后续读取最新状态。
        manuallyRemoved = true
      }
    } else {
      // Unix/Mac - only remove symlink, not the package directory
      // binSymlink格式化`join`，供共享工具后续处理使用。
      const binSymlink = join(globalPrefix, 'bin', 'claude')

      // 满足 `await tryRemove(binSymlink, 'bin symlink')` 时，共享工具执行该分支。
      if (await tryRemove(binSymlink, 'bin symlink')) {
        // manuallyRemoved更新为 `true`，确保共享工具后续读取最新状态。
        manuallyRemoved = true
      }
    }

    // 满足 `manuallyRemoved` 时，共享工具执行该分支。
    if (manuallyRemoved) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Successfully removed ${packageName} manually`)
      // nodeModulesPath 路径数据读取`getPlatform`，供共享工具后续处理使用。
      const nodeModulesPath = getPlatform().startsWith('win32')
        ? join(globalPrefix, 'node_modules', packageName)
        : join(globalPrefix, 'lib', 'node_modules', packageName)

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: true,
        warning: `${packageName} executables removed, but node_modules directory was left intact for safety. You may manually delete it later at: ${nodeModulesPath}`,
      }
    } else {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false }
    }
  } catch (manualError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Manual removal failed: ${manualError}`, {
      level: 'error',
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: `Manual removal failed: ${manualError}`,
    }
  }
}

// attemptNpmUninstall 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function attemptNpmUninstall(
  packageName: string,
): Promise<{ success: boolean; error?: string; warning?: string }> {
  // 从 `await execFileNoThrowWithCwd(` 解构 code、stderr，减少共享工具 installer对同一对象的重复访问。
  const { code, stderr } = await execFileNoThrowWithCwd(
    'npm',
    ['uninstall', '-g', packageName],
    // eslint-disable-next-line custom-rules/no-process-cwd -- matches original behavior
    { cwd: process.cwd() },
  )

  // 满足 `code === 0` 时，共享工具执行该分支。
  if (code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Removed global npm installation of ${packageName}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true }
  // 共享工具 installer在这里处理 `} else if (stderr && !stderr.includes('npm ERR! code E404')) {`，完成这一小步状态转换。
  } else if (stderr && !stderr.includes('npm ERR! code E404')) {
    // Check for ENOTEMPTY error and try manual removal
    // 满足 `stderr.includes('npm error code ENOTEMPTY')` 时，共享工具执行该分支。
    if (stderr.includes('npm error code ENOTEMPTY')) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to uninstall global npm package ${packageName}: ${stderr}`,
        { level: 'error' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Attempting manual removal due to ENOTEMPTY error`)

      // manualResult保存`manualRemoveNpmPackage`，供共享工具后续处理使用。
      const manualResult = await manualRemoveNpmPackage(packageName)
      // 满足 `manualResult.success` 时，共享工具执行该分支。
      if (manualResult.success) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { success: true, warning: manualResult.warning }
      // 共享工具 installer在这里处理 `} else if (manualResult.error) {`，完成这一小步状态转换。
      } else if (manualResult.error) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: false,
          error: `Failed to remove global npm installation of ${packageName}: ${stderr}. Manual removal also failed: ${manualResult.error}`,
        }
      }
    }

    // Only report as error if it's not a "package not found" error
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to uninstall global npm package ${packageName}: ${stderr}`,
      { level: 'error' },
    )
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: `Failed to remove global npm installation of ${packageName}: ${stderr}`,
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { success: false } // Package not found, not an error
}

// cleanupNpmInstallations 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupNpmInstallations(): Promise<{
  removed: number
  errors: string[]
  warnings: string[]
}> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: string[] = []
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: string[] = []
  // removed保存`0`，供共享工具 installer后续判断或输出使用。
  let removed = 0

  // Always attempt to remove @anthropic-ai/claude-code
  // codePackageResult保存`attemptNpmUninstall`，供共享工具后续处理使用。
  const codePackageResult = await attemptNpmUninstall(
    '@anthropic-ai/claude-code',
  )
  // 满足 `codePackageResult.success` 时，共享工具执行该分支。
  if (codePackageResult.success) {
    // 共享工具 installer在这里处理 `removed++`，完成这一小步状态转换。
    removed++
    // 满足 `codePackageResult.warning` 时，共享工具执行该分支。
    if (codePackageResult.warning) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push(codePackageResult.warning)
    }
  // 共享工具 installer在这里处理 `} else if (codePackageResult.error) {`，完成这一小步状态转换。
  } else if (codePackageResult.error) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push(codePackageResult.error)
  }

  // Also attempt to remove MACRO.PACKAGE_URL if it's defined and different
  // `MACRO.PACKAGE_URL && MACRO.PACKAGE_URL` 与 `'@anth` 不一致时刷新派生状态，避免使用过期结果。
  if (MACRO.PACKAGE_URL && MACRO.PACKAGE_URL !== '@anthropic-ai/claude-code') {
    // macroPackageResult保存`attemptNpmUninstall`，供共享工具后续处理使用。
    const macroPackageResult = await attemptNpmUninstall(MACRO.PACKAGE_URL)
    // 满足 `macroPackageResult.success` 时，共享工具执行该分支。
    if (macroPackageResult.success) {
      // 共享工具 installer在这里处理 `removed++`，完成这一小步状态转换。
      removed++
      // 满足 `macroPackageResult.warning` 时，共享工具执行该分支。
      if (macroPackageResult.warning) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push(macroPackageResult.warning)
      }
    // 共享工具 installer在这里处理 `} else if (macroPackageResult.error) {`，完成这一小步状态转换。
    } else if (macroPackageResult.error) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(macroPackageResult.error)
    }
  }

  // Check for local installation at ~/.claude/local
  // localInstallDir格式化`join`，供共享工具后续处理使用。
  const localInstallDir = join(homedir(), '.claude', 'local')

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(localInstallDir, { recursive: true })` 完成，再继续共享工具 installer的异步流程。
    await rm(localInstallDir, { recursive: true })
    // 共享工具 installer在这里处理 `removed++`，完成这一小步状态转换。
    removed++
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Removed local installation at ${localInstallDir}`)
  } catch (error) {
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`Failed to remove ${localInstallDir}: ${error}`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to remove local installation: ${error}`, {
        level: 'error',
      })
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { removed, errors, warnings }
}
