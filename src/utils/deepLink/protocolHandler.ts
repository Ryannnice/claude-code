/**
 * Protocol Handler
 *
 * Entry point for `claude --handle-uri <url>`. When the OS invokes claude
 * with a `claude-cli://` URL, this module:
 *   1. Parses the URI into a structured action
 *   2. Detects the user's terminal emulator
 *   3. Opens a new terminal window running claude with the appropriate args
 *
 * This runs in a headless context (no TTY) because the OS launches the binary
 * directly — there is no terminal attached.
 */

// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterExistingPaths,
  getKnownPathsForRepo,
} from '../githubRepoPathMapping.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 readLastFetchTime，将 ./banner.js 中已经封装好的能力接到本文件流程里。
import { readLastFetchTime } from './banner.js'
// 引入 parseDeepLink，将 ./parseDeepLink.js 中已经封装好的能力接到本文件流程里。
import { parseDeepLink } from './parseDeepLink.js'
// 引入 MACOS_BUNDLE_ID，将 ./registerProtocol.js 中已经封装好的能力接到本文件流程里。
import { MACOS_BUNDLE_ID } from './registerProtocol.js'
// 引入 launchInTerminal，将 ./terminalLauncher.js 中已经封装好的能力接到本文件流程里。
import { launchInTerminal } from './terminalLauncher.js'

/**
 * Handle an incoming deep link URI.
 *
 * Called from the CLI entry point when `--handle-uri` is passed.
 * This function parses the URI, resolves the claude binary, and
 * launches it in the user's terminal.
 *
 * @param uri - The raw URI string (e.g., "claude-cli://prompt?q=hello+world")
 * @returns exit code (0 = success)
 */
// handleDeepLinkUri 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleDeepLinkUri(uri: string): Promise<number> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Handling deep link URI: ${uri}`)

  // action 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let action
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // action更新为 `parseDeepLink(uri)`，确保共享工具后续读取最新状态。
    action = parseDeepLink(uri)
  } catch (error) {
    // 消息保存`String`，供共享工具后续处理使用。
    const message = error instanceof Error ? error.message : String(error)
    // biome-ignore lint/suspicious/noConsole: intentional error output
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error(`Deep link error: ${message}`)
    // 返回 `1`，作为共享工具这次计算的结果。
    return 1
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Parsed deep link action: ${jsonStringify(action)}`)

  // Always the running executable — no PATH lookup. The OS launched us via
  // an absolute path (bundle symlink / .desktop Exec= / registry command)
  // baked at registration time, and we want the terminal-launched Claude to
  // be the same binary. process.execPath is that binary.
  // 从 `await resolveCwd(action)` 解构 cwd、resolvedRepo，减少共享工具 protocol Handler对同一对象的重复访问。
  const { cwd, resolvedRepo } = await resolveCwd(action)
  // Resolve FETCH_HEAD age here, in the trampoline process, so main.tsx
  // stays await-free — the launched instance receives it as a precomputed
  // flag instead of statting the filesystem on its own startup path.
  // lastFetch读取`readLastFetchTime`，供共享工具后续处理使用。
  const lastFetch = resolvedRepo ? await readLastFetchTime(cwd) : undefined
  // launched保存`launchInTerminal`，供共享工具后续处理使用。
  const launched = await launchInTerminal(process.execPath, {
    query: action.query,
    cwd,
    repo: resolvedRepo,
    lastFetchMs: lastFetch?.getTime(),
  })
  // launched缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!launched) {
    // biome-ignore lint/suspicious/noConsole: intentional error output
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error(
      'Failed to open a terminal. Make sure a supported terminal emulator is installed.',
    )
    // 返回 `1`，作为共享工具这次计算的结果。
    return 1
  }

  // 返回 `0`，作为共享工具这次计算的结果。
  return 0
}

/**
 * Handle the case where claude was launched as the app bundle's executable
 * by macOS (via URL scheme). Uses the NAPI module to receive the URL from
 * the Apple Event, then handles it normally.
 *
 * @returns exit code (0 = success, 1 = error, null = not a URL launch)
 */
// handleUrlSchemeLaunch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleUrlSchemeLaunch(): Promise<number | null> {
  // LaunchServices overwrites __CFBundleIdentifier with the launching bundle's
  // ID. This is a precise positive signal — it's set to our exact bundle ID
  // if and only if macOS launched us via the URL handler .app bundle.
  // (`open` from a terminal passes the caller's env through, so negative
  // heuristics like !TERM don't work — the terminal's TERM leaks in.)
  // `process.env.__CFBundleIdentifier` 与 `MACOS_BUNDLE` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.__CFBundleIdentifier !== MACOS_BUNDLE_ID) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await import('url-handler-napi')` 解构 waitForUrlEvent，减少共享工具 protocol Handler对同一对象的重复访问。
    const { waitForUrlEvent } = await import('url-handler-napi')
    // URL保存`waitForUrlEvent`，供共享工具后续处理使用。
    const url = waitForUrlEvent(5000)
    // URL缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!url) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 等待并返回 `handleDeepLinkUri(url)`，调用方直接接收异步结果。
    return await handleDeepLinkUri(url)
  } catch {
    // NAPI module not available, or handleDeepLinkUri rejected — not a URL launch
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Resolve the working directory for the launched Claude instance.
 * Precedence: explicit cwd > repo lookup (MRU clone) > home.
 * A repo that isn't cloned locally is not an error — fall through to home
 * so a web link referencing a repo the user doesn't have still opens Claude.
 *
 * Returns the resolved cwd, and the repo slug if (and only if) the MRU
 * lookup hit — so the launched instance can show which clone was selected
 * and its git freshness.
 */
// resolveCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function resolveCwd(action: {
  cwd?: string
  repo?: string
}): Promise<{ cwd: string; resolvedRepo?: string }> {
  // 满足 `action.cwd` 时，共享工具执行该分支。
  if (action.cwd) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { cwd: action.cwd }
  }
  // 满足 `action.repo` 时，共享工具执行该分支。
  if (action.repo) {
    // known读取`getKnownPathsForRepo`，供共享工具后续处理使用。
    const known = getKnownPathsForRepo(action.repo)
    // existing筛选`filterExistingPaths`，供共享工具后续处理使用。
    const existing = await filterExistingPaths(known)
    // 满足 `existing[0]` 时，共享工具执行该分支。
    if (existing[0]) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Resolved repo ${action.repo} → ${existing[0]}`)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { cwd: existing[0], resolvedRepo: action.repo }
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `No local clone found for repo ${action.repo}, falling back to home`,
    )
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { cwd: homedir() }
}
