/**
 * Utilities for handling local installation
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { access, chmod, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 ReleaseChannel、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { type ReleaseChannel, saveGlobalConfig } from './config.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// Lazy getters: getClaudeConfigHomeDir() is memoized and reads process.env.
// Evaluating at module scope would capture the value before entrypoints like
// hfi.tsx get a chance to set CLAUDE_CONFIG_DIR in main(), and would also
// populate the memoize cache with that stale value for all 150+ other callers.
// getLocalInstallDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLocalInstallDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'local')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'local')
}
// getLocalClaudePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLocalClaudePath(): string {
  // 返回 `join(getLocalInstallDir(), 'claude')`，作为共享工具这次计算的结果。
  return join(getLocalInstallDir(), 'claude')
}

/**
 * Check if we're running from our managed local installation
 */
// isRunningFromLocalInstallation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRunningFromLocalInstallation(): boolean {
  // execPath 路径数据标记共享工具 local Installer是否启用对应路径。
  const execPath = process.argv[1] || ''
  // 返回 `execPath.includes('/.claude/local/node_modules/')`，作为共享工具这次计算的结果。
  return execPath.includes('/.claude/local/node_modules/')
}

/**
 * Write `content` to `path` only if the file does not already exist.
 * Uses O_EXCL ('wx') for atomic create-if-missing.
 */
// writeIfMissing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeIfMissing(
  path: string,
  content: string,
  mode?: number,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(path, content, { encoding: 'utf8', flag: 'wx', mode })` 完成，再继续共享工具 local Installer的异步流程。
    await writeFile(path, content, { encoding: 'utf8', flag: 'wx', mode })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e) {
    // 当 `getErrnoCode(e)` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
    if (getErrnoCode(e) === 'EEXIST') return false
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

/**
 * Ensure the local package environment is set up
 * Creates the directory, package.json, and wrapper script
 */
// ensureLocalPackageEnvironment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureLocalPackageEnvironment(): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // localInstallDir读取`getLocalInstallDir`，供共享工具后续处理使用。
    const localInstallDir = getLocalInstallDir()

    // Create installation directory (recursive, idempotent)
    // 等待 `getFsImplementation().mkdir(localInstallDir)` 完成，再继续共享工具 local Installer的异步流程。
    await getFsImplementation().mkdir(localInstallDir)

    // Create package.json if it doesn't exist
    // 等待 `writeIfMissing(` 完成，再继续共享工具 local Installer的异步流程。
    await writeIfMissing(
      join(localInstallDir, 'package.json'),
      jsonStringify(
        { name: 'claude-local', version: '0.0.1', private: true },
        null,
        2,
      ),
    )

    // Create the wrapper script if it doesn't exist
    // wrapperPath 路径数据格式化`join`，供共享工具后续处理使用。
    const wrapperPath = join(localInstallDir, 'claude')
    // created保存`writeIfMissing`，供共享工具后续处理使用。
    const created = await writeIfMissing(
      wrapperPath,
      `#!/bin/sh\nexec "${localInstallDir}/node_modules/.bin/claude" "$@"`,
      0o755,
    )
    // 满足 `created` 时，共享工具执行该分支。
    if (created) {
      // Mode in writeFile is masked by umask; chmod to ensure executable bit.
      // 等待 `chmod(wrapperPath, 0o755)` 完成，再继续共享工具 local Installer的异步流程。
      await chmod(wrapperPath, 0o755)
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Install or update Claude CLI package in the local directory
 * @param channel - Release channel to use (latest or stable)
 * @param specificVersion - Optional specific version to install (overrides channel)
 */
// installOrUpdateClaudePackage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installOrUpdateClaudePackage(
  channel: ReleaseChannel,
  specificVersion?: string | null,
): Promise<'in_progress' | 'success' | 'install_failed'> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // First ensure the environment is set up
    // 满足 `!(await ensureLocalPackageEnvironment())` 时，共享工具执行该分支。
    if (!(await ensureLocalPackageEnvironment())) {
      // 返回 `'install_failed'`，作为共享工具这次计算的结果。
      return 'install_failed'
    }

    // Use specific version if provided, otherwise use channel tag
    // versionSpec保存`specificVersion`，供共享工具 local Installer后续判断或输出使用。
    const versionSpec = specificVersion
      ? specificVersion
      : channel === 'stable'
        ? 'stable'
        : 'latest'
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      'npm',
      ['install', `${MACRO.PACKAGE_URL}@${versionSpec}`],
      { cwd: getLocalInstallDir(), maxBuffer: 1000000 },
    )

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error(
        `Failed to install Claude CLI package: ${result.stderr}`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 返回 `result.code === 190 ? 'in_progress' : 'install_failed'`，作为共享工具这次计算的结果。
      return result.code === 190 ? 'in_progress' : 'install_failed'
    }

    // Set installMethod to 'local' to prevent npm permission warnings
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      installMethod: 'local',
    }))

    // 返回 `'success'`，作为共享工具这次计算的结果。
    return 'success'
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `'install_failed'`，作为共享工具这次计算的结果。
    return 'install_failed'
  }
}

/**
 * Check if local installation exists.
 * Pure existence probe — callers use this to choose update path / UI hints.
 */
// localInstallationExists 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function localInstallationExists(): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `access(join(getLocalInstallDir(), 'node_modules', '.bin', 'claude'))` 完成，再继续共享工具 local Installer的异步流程。
    await access(join(getLocalInstallDir(), 'node_modules', '.bin', 'claude'))
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Get shell type to determine appropriate path setup
 */
// getShellType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getShellType(): string {
  // shellPath 路径数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const shellPath = process.env.SHELL || ''
  // 满足 `shellPath.includes('zsh')` 时，共享工具执行该分支。
  if (shellPath.includes('zsh')) return 'zsh'
  // 满足 `shellPath.includes('bash')` 时，共享工具执行该分支。
  if (shellPath.includes('bash')) return 'bash'
  // 满足 `shellPath.includes('fish')` 时，共享工具执行该分支。
  if (shellPath.includes('fish')) return 'fish'
  // 返回 `'unknown'`，作为共享工具这次计算的结果。
  return 'unknown'
}
