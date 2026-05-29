// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 env、JETBRAINS_IDES，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { env, JETBRAINS_IDES } from './env.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 getAncestorCommandsAsync，将 ./genericProcessUtils.js 中已经封装好的能力接到本文件流程里。
import { getAncestorCommandsAsync } from './genericProcessUtils.js'

// Functions that require execFileNoThrow and thus cannot be in env.ts

// getIsDocker保存`memoize`，供共享工具后续处理使用。
const getIsDocker = memoize(async (): Promise<boolean> => {
  // `process.platform` 与 `'linux'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'linux') return false
  // Check for .dockerenv file
  // 从 `await execFileNoThrow('test', ['-f', '/.dockerenv'])` 解构 code，减少共享工具 env Dynamic对同一对象的重复访问。
  const { code } = await execFileNoThrow('test', ['-f', '/.dockerenv'])
  // 返回 `code === 0`，作为共享工具这次计算的结果。
  return code === 0
})

// getIsBubblewrapSandbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getIsBubblewrapSandbox(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    process.platform === 'linux' &&
    isEnvTruthy(process.env.CLAUDE_CODE_BUBBLEWRAP)
  )
}

// Cache for the runtime musl detection fallback (node/unbundled only).
// In native linux builds, feature flags resolve this at compile time, so the
// cache is only consulted when both IS_LIBC_MUSL and IS_LIBC_GLIBC are false.
// muslRuntimeCache 缓存保存`null`，作为后续空值处理的输入。
let muslRuntimeCache: boolean | null = null

// Fire-and-forget: populate the musl cache for the node fallback path.
// Native builds never reach this (feature flags short-circuit), so this only
// matters for unbundled node on Linux. Installer calls on native builds are
// unaffected since feature() resolves at compile time.
// 当 `process.platform` 匹配 `'linux'` 时，共享工具执行对应分支。
if (process.platform === 'linux') {
  // muslArch标记共享工具 env Dynamic是否启用对应路径。
  const muslArch = process.arch === 'x64' ? 'x86_64' : 'aarch64'
  // 显式忽略 `stat(`/lib/libc.musl-${muslArch}.so.1`).then(` 的返回值，只保留它触发的副作用。
  void stat(`/lib/libc.musl-${muslArch}.so.1`).then(
    // 这个回调绑定到 () => {，负责共享工具在该局部场景下的响应。
    () => {
      // muslRuntimeCache 缓存更新为 `true`，确保共享工具后续读取最新状态。
      muslRuntimeCache = true
    },
    // 这个回调绑定到 () => {，负责共享工具在该局部场景下的响应。
    () => {
      // muslRuntimeCache 缓存更新为 `false`，确保共享工具后续读取最新状态。
      muslRuntimeCache = false
    },
  )
}

/**
 * Checks if the system is using MUSL libc instead of glibc.
 * In native linux builds, this is statically known at compile time via IS_LIBC_MUSL/IS_LIBC_GLIBC flags.
 * In node (unbundled), both flags are false and we fall back to a runtime async stat check
 * whose result is cached at module load. If the cache isn't populated yet, returns false.
 */
// isMuslEnvironment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMuslEnvironment(): boolean {
  // 满足 `feature('IS_LIBC_MUSL')` 时，共享工具执行该分支。
  if (feature('IS_LIBC_MUSL')) return true
  // 满足 `feature('IS_LIBC_GLIBC')` 时，共享工具执行该分支。
  if (feature('IS_LIBC_GLIBC')) return false

  // Fallback for node: runtime detection via pre-populated cache
  // `process.platform` 与 `'linux'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'linux') return false
  // 返回 `muslRuntimeCache ?? false`，作为共享工具这次计算的结果。
  return muslRuntimeCache ?? false
}

// Cache for async JetBrains detection
// jetBrainsIDECache 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let jetBrainsIDECache: string | null | undefined

// detectJetBrainsIDEFromParentProcessAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectJetBrainsIDEFromParentProcessAsync(): Promise<
  string | null
> {
  // `jetBrainsIDECache` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (jetBrainsIDECache !== undefined) {
    // 返回 `jetBrainsIDECache`，作为共享工具这次计算的结果。
    return jetBrainsIDECache
  }

  // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (process.platform === 'darwin') {
    // jetBrainsIDECache 缓存更新为 `null`，确保共享工具后续读取最新状态。
    jetBrainsIDECache = null
    // 返回 `null // macOS uses bundle ID detection which is already handled`，作为共享工具这次计算的结果。
    return null // macOS uses bundle ID detection which is already handled
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Get ancestor commands in a single call (avoids sync bash in loop)
    // commands 命令数据读取`getAncestorCommandsAsync`，供共享工具后续处理使用。
    const commands = await getAncestorCommandsAsync(process.pid, 10)

    // 按顺序遍历 `commands` 中的命令，逐个交给共享工具处理。
    for (const command of commands) {
      // lowerCommand 命令数据保存`command.toLowerCase`，供共享工具后续处理使用。
      const lowerCommand = command.toLowerCase()
      // Check for specific JetBrains IDEs in the command line
      // 按顺序遍历 `JETBRAINS_IDES` 中的ide，逐个交给共享工具处理。
      for (const ide of JETBRAINS_IDES) {
        // 满足 `lowerCommand.includes(ide)` 时，共享工具执行该分支。
        if (lowerCommand.includes(ide)) {
          // jetBrainsIDECache 缓存更新为 `ide`，确保共享工具后续读取最新状态。
          jetBrainsIDECache = ide
          // 返回 `ide`，作为共享工具这次计算的结果。
          return ide
        }
      }
    }
  } catch {
    // Silently fail - this is a best-effort detection
  }

  // jetBrainsIDECache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  jetBrainsIDECache = null
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getTerminalWithJetBrainsDetectionAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTerminalWithJetBrainsDetectionAsync(): Promise<
  string | null
> {
  // Check for JetBrains terminal on Linux/Windows
  // 满足 `process.env.TERMINAL_EMULATOR === 'JetBrains-Jedi` 时，共享工具执行该分支。
  if (process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm') {
    // For macOS, bundle ID detection above already handles JetBrains IDEs
    // `env.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
    if (env.platform !== 'darwin') {
      // specificIDE读取`detectJetBrainsIDEFromParentProcessAsync`，供共享工具后续处理使用。
      const specificIDE = await detectJetBrainsIDEFromParentProcessAsync()
      // 返回 `specificIDE || 'pycharm'`，作为共享工具这次计算的结果。
      return specificIDE || 'pycharm'
    }
  }
  // 返回 `env.terminal`，作为共享工具这次计算的结果。
  return env.terminal
}

// Synchronous version that returns cached result or falls back to env.terminal
// Used for backward compatibility - callers should migrate to async version
// getTerminalWithJetBrainsDetection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalWithJetBrainsDetection(): string | null {
  // Check for JetBrains terminal on Linux/Windows
  // 满足 `process.env.TERMINAL_EMULATOR === 'JetBrains-Jedi` 时，共享工具执行该分支。
  if (process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm') {
    // For macOS, bundle ID detection above already handles JetBrains IDEs
    // `env.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
    if (env.platform !== 'darwin') {
      // Return cached value if available, otherwise fall back to generic detection
      // The async version should be called early in app initialization to populate cache
      // `jetBrainsIDECache` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (jetBrainsIDECache !== undefined) {
        // 返回 `jetBrainsIDECache || 'pycharm'`，作为共享工具这次计算的结果。
        return jetBrainsIDECache || 'pycharm'
      }
      // Fall back to generic 'pycharm' if cache not populated yet
      // 返回 `'pycharm'`，作为共享工具这次计算的结果。
      return 'pycharm'
    }
  }
  // 返回 `env.terminal`，作为共享工具这次计算的结果。
  return env.terminal
}

/**
 * Initialize JetBrains IDE detection asynchronously.
 * Call this early in app initialization to populate the cache.
 * After this resolves, getTerminalWithJetBrainsDetection() will return accurate results.
 */
// initJetBrainsDetection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initJetBrainsDetection(): Promise<void> {
  // 满足 `process.env.TERMINAL_EMULATOR === 'JetBrains-Jedi` 时，共享工具执行该分支。
  if (process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm') {
    // 等待 `detectJetBrainsIDEFromParentProcessAsync()` 完成，再继续共享工具 env Dynamic的异步流程。
    await detectJetBrainsIDEFromParentProcessAsync()
  }
}

// Combined export that includes all env properties plus dynamic functions
// envDynamic集中保存共享工具 env Dynamic要一起传递的字段。
export const envDynamic = {
  ...env, // Include all properties from env
  terminal: getTerminalWithJetBrainsDetection(),
  getIsDocker,
  getIsBubblewrapSandbox,
  isMuslEnvironment,
  getTerminalWithJetBrainsDetectionAsync,
  initJetBrainsDetection,
}
