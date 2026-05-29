// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 fileSuffixForOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { fileSuffixForOauthConfig } from '../constants/oauth.js'
// 引入 isRunningWithBun，将 ./bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isRunningWithBun } from './bundledMode.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 findExecutable，将 ./findExecutable.js 中已经封装好的能力接到本文件流程里。
import { findExecutable } from './findExecutable.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 which，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { which } from './which.js'

// Platform 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Platform = 'win32' | 'darwin' | 'linux'

// Config and data paths
// getGlobalClaudeFile 文件数据保存`memoize`，供共享工具后续处理使用。
export const getGlobalClaudeFile = memoize((): string => {
  // Legacy fallback for backwards compatibility
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getFsImplementation().existsSync(
      join(getClaudeConfigHomeDir(), '.config.json'),
    )
  ) {
    // 返回 `join(getClaudeConfigHomeDir(), '.config.json')`，作为共享工具这次计算的结果。
    return join(getClaudeConfigHomeDir(), '.config.json')
  }

  // 文件名保存`fileSuffixForOauthConfig`，供共享工具后续处理使用。
  const filename = `.claude${fileSuffixForOauthConfig()}.json`
  // 返回 `join(process.env.CLAUDE_CONFIG_DIR || homedir(), filename)`，作为共享工具这次计算的结果。
  return join(process.env.CLAUDE_CONFIG_DIR || homedir(), filename)
})

// hasInternetAccess 集合记录 `memoize` 是否成立，共享工具随后按该结果分支。
const hasInternetAccess = memoize(async (): Promise<boolean> => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await import('axios')` 解构 default，减少共享工具 env对同一对象的重复访问。
    const { default: axiosClient } = await import('axios')
    // 等待 `axiosClient.head('http://1.1.1.1', {` 完成，再继续共享工具 env的异步流程。
    await axiosClient.head('http://1.1.1.1', {
      signal: AbortSignal.timeout(1000),
    })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
})

// isCommandAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isCommandAvailable(command: string): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // which does not execute the file.
    // 返回 `!!(await which(command))`，作为共享工具这次计算的结果。
    return !!(await which(command))
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// detectPackageManagers 集合保存`memoize`，供共享工具后续处理使用。
const detectPackageManagers = memoize(async (): Promise<string[]> => {
  // packageManagers 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const packageManagers = []

  // 满足 `await isCommandAvailable('npm')) packageManagers.push('npm'` 时，共享工具执行该分支。
  if (await isCommandAvailable('npm')) packageManagers.push('npm')
  // 满足 `await isCommandAvailable('yarn')) packageManagers.push('yarn'` 时，共享工具执行该分支。
  if (await isCommandAvailable('yarn')) packageManagers.push('yarn')
  // 满足 `await isCommandAvailable('pnpm')) packageManagers.push('pnpm'` 时，共享工具执行该分支。
  if (await isCommandAvailable('pnpm')) packageManagers.push('pnpm')

  // 返回 `packageManagers`，作为共享工具这次计算的结果。
  return packageManagers
})

// detectRuntimes 集合保存`memoize`，供共享工具后续处理使用。
const detectRuntimes = memoize(async (): Promise<string[]> => {
  // runtimes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const runtimes = []

  // 满足 `await isCommandAvailable('bun')) runtimes.push('bun'` 时，共享工具执行该分支。
  if (await isCommandAvailable('bun')) runtimes.push('bun')
  // 满足 `await isCommandAvailable('deno')) runtimes.push('deno'` 时，共享工具执行该分支。
  if (await isCommandAvailable('deno')) runtimes.push('deno')
  // 满足 `await isCommandAvailable('node')) runtimes.push('node'` 时，共享工具执行该分支。
  if (await isCommandAvailable('node')) runtimes.push('node')

  // 返回 `runtimes`，作为共享工具这次计算的结果。
  return runtimes
})

/**
 * Checks if we're running in a WSL environment
 * @returns true if running in WSL, false otherwise
 */
// isWslEnvironment记录 `memoize` 是否成立，共享工具随后按该结果分支。
const isWslEnvironment = memoize((): boolean => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check for WSLInterop file which is a reliable indicator of WSL
    // 返回 `getFsImplementation().existsSync(`，作为共享工具这次计算的结果。
    return getFsImplementation().existsSync(
      '/proc/sys/fs/binfmt_misc/WSLInterop',
    )
  } catch (_error) {
    // If there's an error checking, assume not WSL
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
})

/**
 * Checks if the npm executable is located in the Windows filesystem within WSL
 * @returns true if npm is from Windows (starts with /mnt/c/), false otherwise
 */
// isNpmFromWindowsPath 路径数据记录 `memoize` 是否成立，共享工具随后按该结果分支。
const isNpmFromWindowsPath = memoize((): boolean => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Only relevant in WSL environment
    // 满足 `!isWslEnvironment()` 时，共享工具执行该分支。
    if (!isWslEnvironment()) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Find the actual npm executable path
    // 从 `findExecutable('npm', [])` 解构 cmd，减少共享工具 env对同一对象的重复访问。
    const { cmd } = findExecutable('npm', [])

    // If npm is in Windows path, it will start with /mnt/c/
    // 返回 `cmd.startsWith('/mnt/c/')`，作为共享工具这次计算的结果。
    return cmd.startsWith('/mnt/c/')
  } catch (_error) {
    // If there's an error, assume it's not from Windows
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
})

/**
 * Checks if we're running via Conductor
 * @returns true if running via Conductor, false otherwise
 */
// isConductor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isConductor(): boolean {
  // 返回 `process.env.__CFBundleIdentifier === 'com.conductor.app'`，作为共享工具这次计算的结果。
  return process.env.__CFBundleIdentifier === 'com.conductor.app'
}

// JETBRAINS_IDES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const JETBRAINS_IDES = [
  'pycharm',
  'intellij',
  'webstorm',
  'phpstorm',
  'rubymine',
  'clion',
  'goland',
  'rider',
  'datagrip',
  'appcode',
  'dataspell',
  'aqua',
  'gateway',
  'fleet',
  'jetbrains',
  'androidstudio',
]

// Detect terminal type with fallbacks for all platforms
// detectTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectTerminal(): string | null {
  // 满足 `process.env.CURSOR_TRACE_ID` 时，共享工具执行该分支。
  if (process.env.CURSOR_TRACE_ID) return 'cursor'
  // Cursor and Windsurf under WSL have TERM_PROGRAM=vscode
  // 满足 `process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('cursor')` 时，共享工具执行该分支。
  if (process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('cursor')) {
    // 返回 `'cursor'`，作为共享工具这次计算的结果。
    return 'cursor'
  }
  // 满足 `process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('windsurf')` 时，共享工具执行该分支。
  if (process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('windsurf')) {
    // 返回 `'windsurf'`，作为共享工具这次计算的结果。
    return 'windsurf'
  }
  // 满足 `process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('antigravity')` 时，共享工具执行该分支。
  if (process.env.VSCODE_GIT_ASKPASS_MAIN?.includes('antigravity')) {
    // 返回 `'antigravity'`，作为共享工具这次计算的结果。
    return 'antigravity'
  }
  // bundleId保存`toLowerCase`，供共享工具后续处理使用。
  const bundleId = process.env.__CFBundleIdentifier?.toLowerCase()
  // 满足 `bundleId?.includes('vscodium')` 时，共享工具执行该分支。
  if (bundleId?.includes('vscodium')) return 'codium'
  // 满足 `bundleId?.includes('windsurf')` 时，共享工具执行该分支。
  if (bundleId?.includes('windsurf')) return 'windsurf'
  // 满足 `bundleId?.includes('com.google.android.studio')` 时，共享工具执行该分支。
  if (bundleId?.includes('com.google.android.studio')) return 'androidstudio'
  // Check for JetBrains IDEs in bundle ID
  // 满足 `bundleId` 时，共享工具执行该分支。
  if (bundleId) {
    // 按顺序遍历 `JETBRAINS_IDES` 中的ide，逐个交给共享工具处理。
    for (const ide of JETBRAINS_IDES) {
      // 满足 `bundleId.includes(ide)` 时，共享工具执行该分支。
      if (bundleId.includes(ide)) return ide
    }
  }

  // 满足 `process.env.VisualStudioVersion` 时，共享工具执行该分支。
  if (process.env.VisualStudioVersion) {
    // This is desktop Visual Studio, not VS Code
    // 返回 `'visualstudio'`，作为共享工具这次计算的结果。
    return 'visualstudio'
  }

  // Check for JetBrains terminal on Linux/Windows
  // 满足 `process.env.TERMINAL_EMULATOR === 'JetBrains-Jedi` 时，共享工具执行该分支。
  if (process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm') {
    // For macOS, bundle ID detection above already handles JetBrains IDEs
    // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
    if (process.platform === 'darwin') return 'pycharm'

    // For finegrained detection on Linux/Windows use envDynamic.getTerminalWithJetBrainsDetection()
    // 返回 `'pycharm'`，作为共享工具这次计算的结果。
    return 'pycharm'
  }

  // Check for specific terminals by TERM before TERM_PROGRAM
  // This handles cases where TERM and TERM_PROGRAM might be inconsistent
  // 当 `process.env.TERM` 匹配 `'xterm-ghostty'` 时，共享工具执行对应分支。
  if (process.env.TERM === 'xterm-ghostty') {
    // 返回 `'ghostty'`，作为共享工具这次计算的结果。
    return 'ghostty'
  }
  // 满足 `process.env.TERM?.includes('kitty')` 时，共享工具执行该分支。
  if (process.env.TERM?.includes('kitty')) {
    // 返回 `'kitty'`，作为共享工具这次计算的结果。
    return 'kitty'
  }

  // 满足 `process.env.TERM_PROGRAM` 时，共享工具执行该分支。
  if (process.env.TERM_PROGRAM) {
    // 返回 `process.env.TERM_PROGRAM`，作为共享工具这次计算的结果。
    return process.env.TERM_PROGRAM
  }

  // 满足 `process.env.TMUX` 时，共享工具执行该分支。
  if (process.env.TMUX) return 'tmux'
  // 满足 `process.env.STY` 时，共享工具执行该分支。
  if (process.env.STY) return 'screen'

  // Check for terminal-specific environment variables (common on Linux)
  // 满足 `process.env.KONSOLE_VERSION` 时，共享工具执行该分支。
  if (process.env.KONSOLE_VERSION) return 'konsole'
  // 满足 `process.env.GNOME_TERMINAL_SERVICE` 时，共享工具执行该分支。
  if (process.env.GNOME_TERMINAL_SERVICE) return 'gnome-terminal'
  // 满足 `process.env.XTERM_VERSION` 时，共享工具执行该分支。
  if (process.env.XTERM_VERSION) return 'xterm'
  // 满足 `process.env.VTE_VERSION` 时，共享工具执行该分支。
  if (process.env.VTE_VERSION) return 'vte-based'
  // 满足 `process.env.TERMINATOR_UUID` 时，共享工具执行该分支。
  if (process.env.TERMINATOR_UUID) return 'terminator'
  // 满足 `process.env.KITTY_WINDOW_ID` 时，共享工具执行该分支。
  if (process.env.KITTY_WINDOW_ID) {
    // 返回 `'kitty'`，作为共享工具这次计算的结果。
    return 'kitty'
  }
  // 满足 `process.env.ALACRITTY_LOG` 时，共享工具执行该分支。
  if (process.env.ALACRITTY_LOG) return 'alacritty'
  // 满足 `process.env.TILIX_ID` 时，共享工具执行该分支。
  if (process.env.TILIX_ID) return 'tilix'

  // Windows-specific detection
  // 满足 `process.env.WT_SESSION` 时，共享工具执行该分支。
  if (process.env.WT_SESSION) return 'windows-terminal'
  // 当 `process.env.SESSIONNAME && process.env.TERM` 匹配 `'cygwin'` 时，共享工具执行对应分支。
  if (process.env.SESSIONNAME && process.env.TERM === 'cygwin') return 'cygwin'
  // 满足 `process.env.MSYSTEM) return process.env.MSYSTEM.toLowerCase(` 时，共享工具执行该分支。
  if (process.env.MSYSTEM) return process.env.MSYSTEM.toLowerCase() // MINGW64, MSYS2, etc.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.ConEmuANSI ||
    process.env.ConEmuPID ||
    process.env.ConEmuTask
  ) {
    // 返回 `'conemu'`，作为共享工具这次计算的结果。
    return 'conemu'
  }

  // WSL detection
  // 满足 `process.env.WSL_DISTRO_NAME` 时，共享工具执行该分支。
  if (process.env.WSL_DISTRO_NAME) return `wsl-${process.env.WSL_DISTRO_NAME}`

  // SSH session detection
  // 满足 `isSSHSession()` 时，共享工具执行该分支。
  if (isSSHSession()) {
    // 返回 `'ssh-session'`，作为共享工具这次计算的结果。
    return 'ssh-session'
  }

  // Fall back to TERM which is more universally available
  // Special case for common terminal identifiers in TERM
  // 满足 `process.env.TERM` 时，共享工具执行该分支。
  if (process.env.TERM) {
    // term 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const term = process.env.TERM
    // 满足 `term.includes('alacritty')` 时，共享工具执行该分支。
    if (term.includes('alacritty')) return 'alacritty'
    // 满足 `term.includes('rxvt')` 时，共享工具执行该分支。
    if (term.includes('rxvt')) return 'rxvt'
    // 满足 `term.includes('termite')` 时，共享工具执行该分支。
    if (term.includes('termite')) return 'termite'
    // 返回 `process.env.TERM`，作为共享工具这次计算的结果。
    return process.env.TERM
  }

  // Detect non-interactive environment
  // process.stdout.isTTY缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.stdout.isTTY) return 'non-interactive'

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Detects the deployment environment/platform based on environment variables
 * @returns The deployment platform name, or 'unknown' if not detected
 */
// detectDeploymentEnvironment保存`memoize`，供共享工具后续处理使用。
export const detectDeploymentEnvironment = memoize((): string => {
  // Cloud development environments
  // 满足 `isEnvTruthy(process.env.CODESPACES)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CODESPACES)) return 'codespaces'
  // 满足 `process.env.GITPOD_WORKSPACE_ID` 时，共享工具执行该分支。
  if (process.env.GITPOD_WORKSPACE_ID) return 'gitpod'
  // 只有 `process.env.REPL_ID || process.env.REPL_SLUG` 满足时，共享工具才执行该分支。
  if (process.env.REPL_ID || process.env.REPL_SLUG) return 'replit'
  // 满足 `process.env.PROJECT_DOMAIN` 时，共享工具执行该分支。
  if (process.env.PROJECT_DOMAIN) return 'glitch'

  // Cloud platforms
  // 满足 `isEnvTruthy(process.env.VERCEL)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.VERCEL)) return 'vercel'
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_SERVICE_NAME
  ) {
    // 返回 `'railway'`，作为共享工具这次计算的结果。
    return 'railway'
  }
  // 满足 `isEnvTruthy(process.env.RENDER)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.RENDER)) return 'render'
  // 满足 `isEnvTruthy(process.env.NETLIFY)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.NETLIFY)) return 'netlify'
  // 满足 `process.env.DYNO` 时，共享工具执行该分支。
  if (process.env.DYNO) return 'heroku'
  // 只有 `process.env.FLY_APP_NAME || process.env.FLY_MACHINE_ID` 满足时，共享工具才执行该分支。
  if (process.env.FLY_APP_NAME || process.env.FLY_MACHINE_ID) return 'fly.io'
  // 满足 `isEnvTruthy(process.env.CF_PAGES)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CF_PAGES)) return 'cloudflare-pages'
  // 满足 `process.env.DENO_DEPLOYMENT_ID` 时，共享工具执行该分支。
  if (process.env.DENO_DEPLOYMENT_ID) return 'deno-deploy'
  // 满足 `process.env.AWS_LAMBDA_FUNCTION_NAME` 时，共享工具执行该分支。
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws-lambda'
  // 当 `process.env.AWS_EXECUTION_ENV` 匹配 `'AWS_ECS_FARGATE'` 时，共享工具执行对应分支。
  if (process.env.AWS_EXECUTION_ENV === 'AWS_ECS_FARGATE') return 'aws-fargate'
  // 当 `process.env.AWS_EXECUTION_ENV` 匹配 `'AWS_ECS_EC2'` 时，共享工具执行对应分支。
  if (process.env.AWS_EXECUTION_ENV === 'AWS_ECS_EC2') return 'aws-ecs'
  // Check for EC2 via hypervisor UUID
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // uuid读取`getFsImplementation`，供共享工具后续处理使用。
    const uuid = getFsImplementation()
      .readFileSync('/sys/hypervisor/uuid', { encoding: 'utf8' })
      .trim()
      .toLowerCase()
    // 满足 `uuid.startsWith('ec2')` 时，共享工具执行该分支。
    if (uuid.startsWith('ec2')) return 'aws-ec2'
  } catch {
    // Ignore errors reading hypervisor UUID (ENOENT on non-EC2, etc.)
  }
  // 满足 `process.env.K_SERVICE` 时，共享工具执行该分支。
  if (process.env.K_SERVICE) return 'gcp-cloud-run'
  // 满足 `process.env.GOOGLE_CLOUD_PROJECT` 时，共享工具执行该分支。
  if (process.env.GOOGLE_CLOUD_PROJECT) return 'gcp'
  // 只有 `process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_SKU` 满足时，共享工具才执行该分支。
  if (process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_SKU)
    // 返回 `'azure-app-service'`，作为共享工具这次计算的结果。
    return 'azure-app-service'
  // 满足 `process.env.AZURE_FUNCTIONS_ENVIRONMENT` 时，共享工具执行该分支。
  if (process.env.AZURE_FUNCTIONS_ENVIRONMENT) return 'azure-functions'
  // 满足 `process.env.APP_URL?.includes('ondigitalocean.app')` 时，共享工具执行该分支。
  if (process.env.APP_URL?.includes('ondigitalocean.app')) {
    // 返回 `'digitalocean-app-platform'`，作为共享工具这次计算的结果。
    return 'digitalocean-app-platform'
  }
  // 满足 `process.env.SPACE_CREATOR_USER_ID` 时，共享工具执行该分支。
  if (process.env.SPACE_CREATOR_USER_ID) return 'huggingface-spaces'

  // CI/CD platforms
  // 满足 `isEnvTruthy(process.env.GITHUB_ACTIONS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.GITHUB_ACTIONS)) return 'github-actions'
  // 满足 `isEnvTruthy(process.env.GITLAB_CI)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.GITLAB_CI)) return 'gitlab-ci'
  // 满足 `process.env.CIRCLECI` 时，共享工具执行该分支。
  if (process.env.CIRCLECI) return 'circleci'
  // 满足 `process.env.BUILDKITE` 时，共享工具执行该分支。
  if (process.env.BUILDKITE) return 'buildkite'
  // 满足 `isEnvTruthy(process.env.CI)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CI)) return 'ci'

  // Container orchestration
  // 满足 `process.env.KUBERNETES_SERVICE_HOST` 时，共享工具执行该分支。
  if (process.env.KUBERNETES_SERVICE_HOST) return 'kubernetes'
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `getFsImplementation().existsSync('/.dockerenv')` 时，共享工具执行该分支。
    if (getFsImplementation().existsSync('/.dockerenv')) return 'docker'
  } catch {
    // Ignore errors checking for Docker
  }

  // Platform-specific fallback for undetected environments
  // 当 `env.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (env.platform === 'darwin') return 'unknown-darwin'
  // 当 `env.platform` 匹配 `'linux'` 时，共享工具执行对应分支。
  if (env.platform === 'linux') return 'unknown-linux'
  // 当 `env.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (env.platform === 'win32') return 'unknown-win32'

  // 返回 `'unknown'`，作为共享工具这次计算的结果。
  return 'unknown'
})

// all of these should be immutable
// isSSHSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSSHSession(): boolean {
  // 返回 `!!(`，作为共享工具这次计算的结果。
  return !!(
    process.env.SSH_CONNECTION ||
    process.env.SSH_CLIENT ||
    process.env.SSH_TTY
  )
}

// env集中保存共享工具 env要一起传递的字段。
export const env = {
  hasInternetAccess,
  isCI: isEnvTruthy(process.env.CI),
  platform: (['win32', 'darwin'].includes(process.platform)
    ? process.platform
    : 'linux') as Platform,
  arch: process.arch,
  nodeVersion: process.version,
  terminal: detectTerminal(),
  isSSH: isSSHSession,
  getPackageManagers: detectPackageManagers,
  getRuntimes: detectRuntimes,
  isRunningWithBun: memoize(isRunningWithBun),
  isWslEnvironment,
  isNpmFromWindowsPath,
  isConductor,
  detectDeploymentEnvironment,
}

/**
 * Returns the host platform for analytics reporting.
 * If CLAUDE_CODE_HOST_PLATFORM is set to a valid platform value, that overrides
 * the detected platform. This is useful for container/remote environments where
 * process.platform reports the container OS but the actual host platform differs.
 */
// getHostPlatformForAnalytics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHostPlatformForAnalytics(): Platform {
  // override 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const override = process.env.CLAUDE_CODE_HOST_PLATFORM
  // 只有 `override === 'win32' || override === 'darwin' ||` 满足时，共享工具才执行该分支。
  if (override === 'win32' || override === 'darwin' || override === 'linux') {
    // 返回 `override`，作为共享工具这次计算的结果。
    return override
  }
  // 返回 `env.platform`，作为共享工具这次计算的结果。
  return env.platform
}
