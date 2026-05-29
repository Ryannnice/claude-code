// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  execFileNoThrow,
  execFileNoThrowWithCwd,
} from '../../../utils/execFileNoThrow.js'
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js'

/**
 * Package manager types for installing it2.
 * Listed in order of preference.
 */
// PythonPackageManager 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PythonPackageManager = 'uvx' | 'pipx' | 'pip'

/**
 * Result of attempting to install it2.
 */
// It2InstallResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type It2InstallResult = {
  success: boolean
  error?: string
  packageManager?: PythonPackageManager
}

/**
 * Result of verifying it2 setup.
 */
// It2VerifyResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type It2VerifyResult = {
  success: boolean
  error?: string
  needsPythonApiEnabled?: boolean
}

/**
 * Detects which Python package manager is available on the system.
 * Checks in order of preference: uvx, pipx, pip.
 *
 * @returns The detected package manager, or null if none found
 */
// detectPythonPackageManager 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectPythonPackageManager(): Promise<PythonPackageManager | null> {
  // Check uv first (preferred for isolated environments)
  // We check for 'uv' since 'uv tool install' is the install command
  // uvResult保存`execFileNoThrow`，供共享工具后续处理使用。
  const uvResult = await execFileNoThrow('which', ['uv'])
  // 满足 `uvResult.code === 0` 时，共享工具执行该分支。
  if (uvResult.code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[it2Setup] Found uv (will use uv tool install)')
    // 返回 `'uvx' // Keep the type name for compatibility`，作为共享工具这次计算的结果。
    return 'uvx' // Keep the type name for compatibility
  }

  // Check pipx (good for isolated environments)
  // pipxResult保存`execFileNoThrow`，供共享工具后续处理使用。
  const pipxResult = await execFileNoThrow('which', ['pipx'])
  // 满足 `pipxResult.code === 0` 时，共享工具执行该分支。
  if (pipxResult.code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[it2Setup] Found pipx package manager')
    // 返回 `'pipx'`，作为共享工具这次计算的结果。
    return 'pipx'
  }

  // Check pip (fallback)
  // pipResult保存`execFileNoThrow`，供共享工具后续处理使用。
  const pipResult = await execFileNoThrow('which', ['pip'])
  // 满足 `pipResult.code === 0` 时，共享工具执行该分支。
  if (pipResult.code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[it2Setup] Found pip package manager')
    // 返回 `'pip'`，作为共享工具这次计算的结果。
    return 'pip'
  }

  // Also check pip3
  // pip3Result保存`execFileNoThrow`，供共享工具后续处理使用。
  const pip3Result = await execFileNoThrow('which', ['pip3'])
  // 满足 `pip3Result.code === 0` 时，共享工具执行该分支。
  if (pip3Result.code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[it2Setup] Found pip3 package manager')
    // 返回 `'pip'`，作为共享工具这次计算的结果。
    return 'pip'
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[it2Setup] No Python package manager found')
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if the it2 CLI tool is installed and accessible.
 *
 * @returns true if it2 is available
 */
// isIt2CliAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isIt2CliAvailable(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('which', ['it2'])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

/**
 * Installs the it2 CLI tool using the detected package manager.
 *
 * @param packageManager - The package manager to use for installation
 * @returns Result indicating success or failure
 */
// installIt2 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installIt2(
  packageManager: PythonPackageManager,
): Promise<It2InstallResult> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[it2Setup] Installing it2 using ${packageManager}`)

  // Run from home directory to avoid reading project-level pip.conf/uv.toml
  // which could be maliciously crafted to redirect to an attacker's PyPI server
  // result 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let result
  // 按照 packageManager 的取值选择共享工具的具体处理分支。
  switch (packageManager) {
    case 'uvx':
      // uv tool install it2 installs it globally in isolated env
      // (uvx is for running, uv tool install is for installing)
      // 结果更新为 `await execFileNoThrowWithCwd('uv', ['tool', 'install', 'i...`，确保共享工具后续读取最新状态。
      result = await execFileNoThrowWithCwd('uv', ['tool', 'install', 'it2'], {
        cwd: homedir(),
      })
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'pipx':
      // 结果更新为 `await execFileNoThrowWithCwd('pipx', ['install', 'it2'], {`，确保共享工具后续读取最新状态。
      result = await execFileNoThrowWithCwd('pipx', ['install', 'it2'], {
        cwd: homedir(),
      })
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'pip':
      // Use --user to install without sudo
      // 结果更新为 `await execFileNoThrowWithCwd(`，确保共享工具后续读取最新状态。
      result = await execFileNoThrowWithCwd(
        'pip',
        ['install', '--user', 'it2'],
        { cwd: homedir() },
      )
      // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (result.code !== 0) {
        // Try pip3 if pip fails
        // 结果更新为 `await execFileNoThrowWithCwd(`，确保共享工具后续读取最新状态。
        result = await execFileNoThrowWithCwd(
          'pip3',
          ['install', '--user', 'it2'],
          { cwd: homedir() },
        )
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 错误标记共享工具 it2 Setup是否启用对应路径。
    const error = result.stderr || 'Unknown installation error'
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`[it2Setup] Failed to install it2: ${error}`))
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error,
      packageManager,
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[it2Setup] it2 installed successfully')
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    success: true,
    packageManager,
  }
}

/**
 * Verifies that it2 is properly configured and can communicate with iTerm2.
 * This tests the Python API connection by running a simple it2 command.
 *
 * @returns Result indicating success or the specific failure reason
 */
// verifyIt2Setup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function verifyIt2Setup(): Promise<It2VerifyResult> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[it2Setup] Verifying it2 setup...')

  // First check if it2 is installed
  // installed保存`isIt2CliAvailable`，供共享工具后续处理使用。
  const installed = await isIt2CliAvailable()
  // installed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!installed) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: 'it2 CLI is not installed or not in PATH',
    }
  }

  // Try to list sessions - this tests the Python API connection
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('it2', ['session', 'list'])

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // stderr保存`stderr.toLowerCase`，供共享工具后续处理使用。
    const stderr = result.stderr.toLowerCase()

    // Check for common Python API errors
    // 共享工具在这里按实际状态进入对应分支。
    if (
      stderr.includes('api') ||
      stderr.includes('python') ||
      stderr.includes('connection refused') ||
      stderr.includes('not enabled')
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[it2Setup] Python API not enabled in iTerm2')
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: 'Python API not enabled in iTerm2 preferences',
        needsPythonApiEnabled: true,
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: result.stderr || 'Failed to communicate with iTerm2',
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[it2Setup] it2 setup verified successfully')
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    success: true,
  }
}

/**
 * Returns instructions for enabling the Python API in iTerm2.
 */
// getPythonApiInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPythonApiInstructions(): string[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    'Almost done! Enable the Python API in iTerm2:',
    '',
    '  iTerm2 → Settings → General → Magic → Enable Python API',
    '',
    'After enabling, you may need to restart iTerm2.',
  ]
}

/**
 * Marks that it2 setup has been completed successfully.
 * This prevents showing the setup prompt again.
 */
// markIt2SetupComplete 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markIt2SetupComplete(): void {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // `config.iterm2It2SetupComplete` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
  if (config.iterm2It2SetupComplete !== true) {
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      iterm2It2SetupComplete: true,
    }))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[it2Setup] Marked it2 setup as complete')
  }
}

/**
 * Marks that the user prefers to use tmux over iTerm2 split panes.
 * This prevents showing the setup prompt when in iTerm2.
 */
// setPreferTmuxOverIterm2 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPreferTmuxOverIterm2(prefer: boolean): void {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // `config.preferTmuxOverIterm2` 与 `prefer` 不一致时刷新派生状态，避免使用过期结果。
  if (config.preferTmuxOverIterm2 !== prefer) {
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      preferTmuxOverIterm2: prefer,
    }))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[it2Setup] Set preferTmuxOverIterm2 = ${prefer}`)
  }
}

/**
 * Checks if the user prefers tmux over iTerm2 split panes.
 */
// getPreferTmuxOverIterm2 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPreferTmuxOverIterm2(): boolean {
  // 返回 `getGlobalConfig().preferTmuxOverIterm2 === true`，作为共享工具这次计算的结果。
  return getGlobalConfig().preferTmuxOverIterm2 === true
}
