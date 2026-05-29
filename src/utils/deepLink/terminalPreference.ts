/**
 * Terminal preference capture for deep link handling.
 *
 * Separate from terminalLauncher.ts so interactiveHelpers.tsx can import
 * this without pulling the full launcher module into the startup path
 * (which would defeat LODESTONE tree-shaking).
 */

// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'

/**
 * Map TERM_PROGRAM env var values (lowercased) to the `app` name used by
 * launchMacosTerminal's switch cases. TERM_PROGRAM values are what terminals
 * self-report; they don't always match the .app bundle name (e.g.,
 * "iTerm.app" → "iTerm", "Apple_Terminal" → "Terminal").
 */
// TERM_PROGRAM_TO_APP 集中保存共享工具 terminal Preference要一起传递的字段。
const TERM_PROGRAM_TO_APP: Record<string, string> = {
  iterm: 'iTerm',
  'iterm.app': 'iTerm',
  ghostty: 'Ghostty',
  kitty: 'kitty',
  alacritty: 'Alacritty',
  wezterm: 'WezTerm',
  apple_terminal: 'Terminal',
}

/**
 * Capture the current terminal from TERM_PROGRAM and store it for the deep
 * link handler to use later. The handler runs headless (LaunchServices/xdg)
 * where TERM_PROGRAM is unset, so without this it falls back to a static
 * priority list that picks whatever is installed first — often not the
 * terminal the user actually uses.
 *
 * Called fire-and-forget from interactive startup, same as
 * updateGithubRepoPathMapping.
 */
// updateDeepLinkTerminalPreference 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateDeepLinkTerminalPreference(): void {
  // Only detectMacosTerminal reads the stored value — skip the write on
  // other platforms.
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') return

  // termProgram 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const termProgram = process.env.TERM_PROGRAM
  // termProgram缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!termProgram) return

  // app保存`termProgram.toLowerCase`，供共享工具后续处理使用。
  const app = TERM_PROGRAM_TO_APP[termProgram.toLowerCase()]
  // app缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!app) return

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 满足 `config.deepLinkTerminal === app` 时，共享工具执行该分支。
  if (config.deepLinkTerminal === app) return

  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({ ...current, deepLinkTerminal: app }))
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Stored deep link terminal preference: ${app}`)
}
