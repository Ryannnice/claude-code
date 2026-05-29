// 接入 normalizeNameForMCP 服务层能力，把外部通信或共享状态交给 ../../services/mcp/normalization.js 处理。
import { normalizeNameForMCP } from '../../services/mcp/normalization.js'
// 引入 env，将 ../env.js 中已经封装好的能力接到本文件流程里。
import { env } from '../env.js'

// COMPUTER_USE_MCP_SERVER_NAME保存`'computer-use'`，作为后续固定文本处理的输入。
export const COMPUTER_USE_MCP_SERVER_NAME = 'computer-use'

/**
 * Sentinel bundle ID for the frontmost gate. Claude Code is a terminal — it has
 * no window. This never matches a real `NSWorkspace.frontmostApplication`, so
 * the package's "host is frontmost" branch (mouse click-through exemption,
 * keyboard safety-net) is dead code for us. `prepareForAction`'s "exempt our
 * own window" is likewise a no-op — there is no window to exempt.
 */
// CLI_HOST_BUNDLE_ID保存`'com.anthropic.claude-code.cli-no-window'`，作为后续固定文本处理的输入。
export const CLI_HOST_BUNDLE_ID = 'com.anthropic.claude-code.cli-no-window'

/**
 * Fallback `env.terminal` → bundleId map for when `__CFBundleIdentifier` is
 * unset. Covers the macOS terminals we can distinguish — Linux entries
 * (konsole, gnome-terminal, xterm) are deliberately absent since
 * `createCliExecutor` is darwin-guarded.
 */
// TERMINAL_BUNDLE_ID_FALLBACK 集中保存共享工具 common要一起传递的字段。
const TERMINAL_BUNDLE_ID_FALLBACK: Readonly<Record<string, string>> = {
  'iTerm.app': 'com.googlecode.iterm2',
  Apple_Terminal: 'com.apple.Terminal',
  ghostty: 'com.mitchellh.ghostty',
  kitty: 'net.kovidgoyal.kitty',
  WarpTerminal: 'dev.warp.Warp-Stable',
  vscode: 'com.microsoft.VSCode',
}

/**
 * Bundle ID of the terminal emulator we're running inside, so `prepareDisplay`
 * can exempt it from hiding and `captureExcluding` can keep it out of
 * screenshots. Returns null when undetectable (ssh, cleared env, unknown
 * terminal) — caller must handle the null case.
 *
 * `__CFBundleIdentifier` is set by LaunchServices when a .app bundle spawns a
 * process and is inherited by children. It's the exact bundleId, no lookup
 * needed — handles terminals the fallback table doesn't know about. Under
 * tmux/screen it reflects the terminal that started the SERVER, which may
 * differ from the attached client. That's harmless here: we exempt A
 * terminal window, and the screenshots exclude it regardless.
 */
// getTerminalBundleId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalBundleId(): string | null {
  // cfBundleId 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const cfBundleId = process.env.__CFBundleIdentifier
  // 满足 `cfBundleId` 时，共享工具执行该分支。
  if (cfBundleId) return cfBundleId
  // 返回 `TERMINAL_BUNDLE_ID_FALLBACK[env.terminal ?? ''] ?? null`，作为共享工具这次计算的结果。
  return TERMINAL_BUNDLE_ID_FALLBACK[env.terminal ?? ''] ?? null
}

/**
 * Static capabilities for macOS CLI. `hostBundleId` is not here — it's added
 * by `executor.ts` per `ComputerExecutor.capabilities`. `buildComputerUseTools`
 * takes this shape (no `hostBundleId`, no `teachMode`).
 */
// CLI_CU_CAPABILITIES 集合集中保存共享工具 common要一起传递的字段。
export const CLI_CU_CAPABILITIES = {
  screenshotFiltering: 'native' as const,
  platform: 'darwin' as const,
}

// isComputerUseMCPServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isComputerUseMCPServer(name: string): boolean {
  // 返回 `normalizeNameForMCP(name) === COMPUTER_USE_MCP_SERVER_NAME`，作为共享工具这次计算的结果。
  return normalizeNameForMCP(name) === COMPUTER_USE_MCP_SERVER_NAME
}
