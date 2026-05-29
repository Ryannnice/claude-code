/**
 * Terminal Launcher
 *
 * Detects the user's preferred terminal emulator and launches Claude Code
 * inside it. Used by the deep link protocol handler when invoked by the OS
 * (i.e., not already running inside a terminal).
 *
 * Platform support:
 *   macOS  — Terminal.app, iTerm2, Ghostty, Kitty, Alacritty, WezTerm
 *   Linux  — $TERMINAL, x-terminal-emulator, gnome-terminal, konsole, etc.
 *   Windows — Windows Terminal (wt.exe), PowerShell, cmd.exe
 */

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawn } from 'child_process'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 getGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'

// TerminalInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalInfo = {
  name: string
  command: string
}

// macOS terminals in preference order.
// Each entry: [display name, app bundle name or CLI command, detection method]
// MACOS_TERMINALS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const MACOS_TERMINALS: Array<{
  name: string
  bundleId: string
  app: string
}> = [
  { name: 'iTerm2', bundleId: 'com.googlecode.iterm2', app: 'iTerm' },
  { name: 'Ghostty', bundleId: 'com.mitchellh.ghostty', app: 'Ghostty' },
  { name: 'Kitty', bundleId: 'net.kovidgoyal.kitty', app: 'kitty' },
  { name: 'Alacritty', bundleId: 'org.alacritty', app: 'Alacritty' },
  { name: 'WezTerm', bundleId: 'com.github.wez.wezterm', app: 'WezTerm' },
  {
    name: 'Terminal.app',
    bundleId: 'com.apple.Terminal',
    app: 'Terminal',
  },
]

// Linux terminals in preference order (command name)
// LINUX_TERMINALS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const LINUX_TERMINALS = [
  'ghostty',
  'kitty',
  'alacritty',
  'wezterm',
  'gnome-terminal',
  'konsole',
  'xfce4-terminal',
  'mate-terminal',
  'tilix',
  'xterm',
]

/**
 * Detect the user's preferred terminal on macOS.
 * Checks running processes first (most likely to be what the user prefers),
 * then falls back to checking installed .app bundles.
 */
// detectMacosTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectMacosTerminal(): Promise<TerminalInfo> {
  // Stored preference from a previous interactive session. This is the only
  // signal that survives into the headless LaunchServices context — the env
  // var check below never hits when we're launched from a browser link.
  // stored读取`getGlobalConfig`，供共享工具后续处理使用。
  const stored = getGlobalConfig().deepLinkTerminal
  // 满足 `stored` 时，共享工具执行该分支。
  if (stored) {
    // match筛选`MACOS_TERMINALS.find`，供共享工具后续处理使用。
    const match = MACOS_TERMINALS.find(t => t.app === stored)
    // 满足 `match` 时，共享工具执行该分支。
    if (match) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: match.name, command: match.app }
    }
  }

  // Check the TERM_PROGRAM env var — if set, the user has a clear preference.
  // TERM_PROGRAM may include a .app suffix (e.g., "iTerm.app"), so strip it.
  // termProgram 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const termProgram = process.env.TERM_PROGRAM
  // 满足 `termProgram` 时，共享工具执行该分支。
  if (termProgram) {
    // normalized格式化`termProgram.replace`，供共享工具后续处理使用。
    const normalized = termProgram.replace(/\.app$/i, '').toLowerCase()
    // match筛选`MACOS_TERMINALS.find`，供共享工具后续处理使用。
    const match = MACOS_TERMINALS.find(
      // t更新为 `>`，确保共享工具后续读取最新状态。
      t =>
        t.app.toLowerCase() === normalized ||
        t.name.toLowerCase() === normalized,
    )
    // 满足 `match` 时，共享工具执行该分支。
    if (match) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: match.name, command: match.app }
    }
  }

  // Check which terminals are installed by looking for .app bundles.
  // Try mdfind first (Spotlight), but fall back to checking /Applications
  // directly since mdfind can return empty results if Spotlight is disabled
  // or hasn't indexed the app yet.
  // 按顺序遍历 `MACOS_TERMINALS` 中的terminal，逐个交给共享工具处理。
  for (const terminal of MACOS_TERMINALS) {
    // 从 `await execFileNoThrow(` 解构 code、stdout，减少共享工具 terminal Launcher对同一对象的重复访问。
    const { code, stdout } = await execFileNoThrow(
      'mdfind',
      [`kMDItemCFBundleIdentifier == "${terminal.bundleId}"`],
      { timeout: 5000, useCwd: false },
    )
    // 只有 `code === 0 && stdout.trim().length > 0` 满足时，共享工具才执行该分支。
    if (code === 0 && stdout.trim().length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: terminal.name, command: terminal.app }
    }
  }

  // Fallback: check /Applications directly (mdfind may not work if
  // Spotlight indexing is disabled or incomplete)
  // 按顺序遍历 `MACOS_TERMINALS` 中的terminal，逐个交给共享工具处理。
  for (const terminal of MACOS_TERMINALS) {
    // 从 `await execFileNoThrow(` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
    const { code: lsCode } = await execFileNoThrow(
      'ls',
      [`/Applications/${terminal.app}.app`],
      { timeout: 1000, useCwd: false },
    )
    // 满足 `lsCode === 0` 时，共享工具执行该分支。
    if (lsCode === 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: terminal.name, command: terminal.app }
    }
  }

  // Terminal.app is always available on macOS
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { name: 'Terminal.app', command: 'Terminal' }
}

/**
 * Detect the user's preferred terminal on Linux.
 * Checks $TERMINAL, then x-terminal-emulator, then walks a priority list.
 */
// detectLinuxTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectLinuxTerminal(): Promise<TerminalInfo | null> {
  // Check $TERMINAL env var
  // termEnv 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const termEnv = process.env.TERMINAL
  // 满足 `termEnv` 时，共享工具执行该分支。
  if (termEnv) {
    // resolved保存`which`，供共享工具后续处理使用。
    const resolved = await which(termEnv)
    // 满足 `resolved` 时，共享工具执行该分支。
    if (resolved) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: basename(termEnv), command: resolved }
    }
  }

  // Check x-terminal-emulator (Debian/Ubuntu alternative)
  // xte保存`which`，供共享工具后续处理使用。
  const xte = await which('x-terminal-emulator')
  // 满足 `xte` 时，共享工具执行该分支。
  if (xte) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { name: 'x-terminal-emulator', command: xte }
  }

  // Walk the priority list
  // 按顺序遍历 `LINUX_TERMINALS` 中的terminal，逐个交给共享工具处理。
  for (const terminal of LINUX_TERMINALS) {
    // resolved保存`which`，供共享工具后续处理使用。
    const resolved = await which(terminal)
    // 满足 `resolved` 时，共享工具执行该分支。
    if (resolved) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: terminal, command: resolved }
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Detect the user's preferred terminal on Windows.
 */
// detectWindowsTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectWindowsTerminal(): Promise<TerminalInfo> {
  // Check for Windows Terminal first
  // wt保存`which`，供共享工具后续处理使用。
  const wt = await which('wt.exe')
  // 满足 `wt` 时，共享工具执行该分支。
  if (wt) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { name: 'Windows Terminal', command: wt }
  }

  // PowerShell 7+ (separate install)
  // pwsh保存`which`，供共享工具后续处理使用。
  const pwsh = await which('pwsh.exe')
  // 满足 `pwsh` 时，共享工具执行该分支。
  if (pwsh) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { name: 'PowerShell', command: pwsh }
  }

  // Windows PowerShell 5.1 (built into Windows)
  // powershell保存`which`，供共享工具后续处理使用。
  const powershell = await which('powershell.exe')
  // 满足 `powershell` 时，共享工具执行该分支。
  if (powershell) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { name: 'PowerShell', command: powershell }
  }

  // cmd.exe is always available
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { name: 'Command Prompt', command: 'cmd.exe' }
}

/**
 * Detect the user's preferred terminal emulator.
 */
// detectTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectTerminal(): Promise<TerminalInfo | null> {
  // 按照 process.platform 的取值选择共享工具的具体处理分支。
  switch (process.platform) {
    case 'darwin':
      // 返回 `detectMacosTerminal()`，作为共享工具这次计算的结果。
      return detectMacosTerminal()
    case 'linux':
      // 返回 `detectLinuxTerminal()`，作为共享工具这次计算的结果。
      return detectLinuxTerminal()
    case 'win32':
      // 返回 `detectWindowsTerminal()`，作为共享工具这次计算的结果。
      return detectWindowsTerminal()
    default:
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}

/**
 * Launch Claude Code in the detected terminal emulator.
 *
 * Pure argv paths (no shell, user input never touches an interpreter):
 *   macOS — Ghostty, Alacritty, Kitty, WezTerm (via open -na --args)
 *   Linux — all ten in LINUX_TERMINALS
 *   Windows — Windows Terminal
 *
 * Shell-string paths (user input is shell-quoted and relied upon):
 *   macOS — iTerm2, Terminal.app (AppleScript `write text` / `do script`
 *           are inherently shell-interpreted; no argv interface exists)
 *   Windows — PowerShell -Command, cmd.exe /k (no argv exec mode)
 *
 * For pure-argv paths: claudePath, --prefill, query, cwd travel as distinct
 * argv elements end-to-end. No sh -c. No shellQuote(). The terminal does
 * chdir(cwd) and execvp(claude, argv). Spaces/quotes/metacharacters in
 * query or cwd are preserved by argv boundaries with zero interpretation.
 */
// launchInTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function launchInTerminal(
  claudePath: string,
  action: {
    query?: string
    cwd?: string
    repo?: string
    lastFetchMs?: number
  },
): Promise<boolean> {
  // terminal读取`detectTerminal`，供共享工具后续处理使用。
  const terminal = await detectTerminal()
  // terminal缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!terminal) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('No terminal emulator detected', { level: 'error' })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Launching in terminal: ${terminal.name} (${terminal.command})`,
  )
  // claudeArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const claudeArgs = ['--deep-link-origin']
  // 满足 `action.repo` 时，共享工具执行该分支。
  if (action.repo) {
    // claudeArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    claudeArgs.push('--deep-link-repo', action.repo)
    // `action.lastFetchMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (action.lastFetchMs !== undefined) {
      // claudeArgs 集合追加新条目，保持收集顺序与输入顺序一致。
      claudeArgs.push('--deep-link-last-fetch', String(action.lastFetchMs))
    }
  }
  // 满足 `action.query` 时，共享工具执行该分支。
  if (action.query) {
    // claudeArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    claudeArgs.push('--prefill', action.query)
  }

  // 按照 process.platform 的取值选择共享工具的具体处理分支。
  switch (process.platform) {
    case 'darwin':
      // 返回 `launchMacosTerminal(terminal, claudePath, claudeArgs, action.cwd)`，作为共享工具这次计算的结果。
      return launchMacosTerminal(terminal, claudePath, claudeArgs, action.cwd)
    case 'linux':
      // 返回 `launchLinuxTerminal(terminal, claudePath, claudeArgs, action.cwd)`，作为共享工具这次计算的结果。
      return launchLinuxTerminal(terminal, claudePath, claudeArgs, action.cwd)
    case 'win32':
      // 返回 `launchWindowsTerminal(terminal, claudePath, claudeArgs, action.cwd)`，作为共享工具这次计算的结果。
      return launchWindowsTerminal(terminal, claudePath, claudeArgs, action.cwd)
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

// launchMacosTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function launchMacosTerminal(
  terminal: TerminalInfo,
  claudePath: string,
  claudeArgs: string[],
  cwd?: string,
): Promise<boolean> {
  // 按照 terminal.command 的取值选择共享工具的具体处理分支。
  switch (terminal.command) {
    // --- SHELL-STRING PATHS (AppleScript has no argv interface) ---
    // User input is shell-quoted via shellQuote(). These two are the only
    // macOS paths where shellQuote() correctness is load-bearing.

    case 'iTerm': {
      // shCmd 命令数据构建`buildShellCommand`，供共享工具后续处理使用。
      const shCmd = buildShellCommand(claudePath, claudeArgs, cwd)
      // If iTerm isn't running, `tell application` launches it and iTerm's
      // default startup behavior opens a window — so `create window` would
      // make a second one. Check `running` first: if already running (even
      // with zero windows), create a window; if not, `activate` lets iTerm's
      // startup create the first window.
      // script保存``tell application "iTerm"`，作为后续固定文本处理的输入。
      const script = `tell application "iTerm"
  if running then
    create window with default profile
  else
    activate
  end if
  tell current session of current window
    write text ${appleScriptQuote(shCmd)}
  end tell
end tell`
      // 从 `await execFileNoThrow('osascript', ['-e', script], {` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('osascript', ['-e', script], {
        useCwd: false,
      })
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) return true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'Terminal': {
      // shCmd 命令数据构建`buildShellCommand`，供共享工具后续处理使用。
      const shCmd = buildShellCommand(claudePath, claudeArgs, cwd)
      // script固定为 ``tell application "Terminal"`，作为共享工具 terminal Launcher后续展示或比较的基准。
      const script = `tell application "Terminal"
  do script ${appleScriptQuote(shCmd)}
  activate
end tell`
      // 从 `await execFileNoThrow('osascript', ['-e', script], {` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('osascript', ['-e', script], {
        useCwd: false,
      })
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }

    // --- PURE ARGV PATHS (no shell, no shellQuote) ---
    // open -na <App> --args <argv> → app receives argv verbatim →
    // terminal's native --working-directory + -e exec the command directly.

    case 'Ghostty': {
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = [
        '-na',
        terminal.command,
        '--args',
        '--window-save-state=never',
      ]
      // 满足 `cwd) args.push(`--working-directory=${cwd}`` 时，共享工具执行该分支。
      if (cwd) args.push(`--working-directory=${cwd}`)
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-e', claudePath, ...claudeArgs)
      // 从 `await execFileNoThrow('open', args, { useCwd: false })` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('open', args, { useCwd: false })
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) return true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'Alacritty': {
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = ['-na', terminal.command, '--args']
      // 满足 `cwd) args.push('--working-directory', cwd` 时，共享工具执行该分支。
      if (cwd) args.push('--working-directory', cwd)
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-e', claudePath, ...claudeArgs)
      // 从 `await execFileNoThrow('open', args, { useCwd: false })` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('open', args, { useCwd: false })
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) return true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'kitty': {
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = ['-na', terminal.command, '--args']
      // 满足 `cwd) args.push('--directory', cwd` 时，共享工具执行该分支。
      if (cwd) args.push('--directory', cwd)
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 从 `await execFileNoThrow('open', args, { useCwd: false })` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('open', args, { useCwd: false })
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) return true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'WezTerm': {
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = ['-na', terminal.command, '--args', 'start']
      // 满足 `cwd) args.push('--cwd', cwd` 时，共享工具执行该分支。
      if (cwd) args.push('--cwd', cwd)
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--', claudePath, ...claudeArgs)
      // 从 `await execFileNoThrow('open', args, { useCwd: false })` 解构 code，减少共享工具 terminal Launcher对同一对象的重复访问。
      const { code } = await execFileNoThrow('open', args, { useCwd: false })
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) return true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Failed to launch ${terminal.name}, falling back to Terminal.app`,
  )
  // 返回 `launchMacosTerminal(`，作为共享工具这次计算的结果。
  return launchMacosTerminal(
    { name: 'Terminal.app', command: 'Terminal' },
    claudePath,
    claudeArgs,
    cwd,
  )
}

// launchLinuxTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function launchLinuxTerminal(
  terminal: TerminalInfo,
  claudePath: string,
  claudeArgs: string[],
  cwd?: string,
): Promise<boolean> {
  // All Linux paths are pure argv. Each terminal's --working-directory
  // (or equivalent) sets cwd natively; the command is exec'd directly.
  // For the few terminals without a cwd flag (xterm, and the opaque
  // x-terminal-emulator / $TERMINAL), spawn({cwd}) sets the terminal
  // process's cwd — most inherit it for the child.

  // 参数列表 先占位，稍后的条件分支会根据实际输入补齐它。
  let args: string[]
  // spawnCwd 先占位，稍后的条件分支会根据实际输入补齐它。
  let spawnCwd: string | undefined

  // 按照 terminal.name 的取值选择共享工具的具体处理分支。
  switch (terminal.name) {
    case 'gnome-terminal':
      // 参数列表更新为 `cwd ? [`--working-directory=${cwd}`, '--'] : ['--']`，确保共享工具后续读取最新状态。
      args = cwd ? [`--working-directory=${cwd}`, '--'] : ['--']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'konsole':
      // 参数列表更新为 `cwd ? ['--workdir', cwd, '-e'] : ['-e']`，确保共享工具后续读取最新状态。
      args = cwd ? ['--workdir', cwd, '-e'] : ['-e']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'kitty':
      // 参数列表更新为 `cwd ? ['--directory', cwd] : []`，确保共享工具后续读取最新状态。
      args = cwd ? ['--directory', cwd] : []
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'wezterm':
      // 参数列表更新为 `cwd ? ['start', '--cwd', cwd, '--'] : ['start', '--']`，确保共享工具后续读取最新状态。
      args = cwd ? ['start', '--cwd', cwd, '--'] : ['start', '--']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'alacritty':
      // 参数列表更新为 `cwd ? ['--working-directory', cwd, '-e'] : ['-e']`，确保共享工具后续读取最新状态。
      args = cwd ? ['--working-directory', cwd, '-e'] : ['-e']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'ghostty':
      // 参数列表更新为 `cwd ? [`--working-directory=${cwd}`, '-e'] : ['-e']`，确保共享工具后续读取最新状态。
      args = cwd ? [`--working-directory=${cwd}`, '-e'] : ['-e']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'xfce4-terminal':
    case 'mate-terminal':
      // 参数列表更新为 `cwd ? [`--working-directory=${cwd}`, '-x'] : ['-x']`，确保共享工具后续读取最新状态。
      args = cwd ? [`--working-directory=${cwd}`, '-x'] : ['-x']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'tilix':
      // 参数列表更新为 `cwd ? [`--working-directory=${cwd}`, '-e'] : ['-e']`，确保共享工具后续读取最新状态。
      args = cwd ? [`--working-directory=${cwd}`, '-e'] : ['-e']
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    default:
      // xterm, x-terminal-emulator, $TERMINAL — no reliable cwd flag.
      // spawn({cwd}) sets the terminal's own cwd; most inherit.
      // 参数列表更新为 `['-e', claudePath, ...claudeArgs]`，确保共享工具后续读取最新状态。
      args = ['-e', claudePath, ...claudeArgs]
      // spawnCwd更新为 `cwd`，确保共享工具后续读取最新状态。
      spawnCwd = cwd
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }

  // 返回 `spawnDetached(terminal.command, args, { cwd: spawnCwd })`，作为共享工具这次计算的结果。
  return spawnDetached(terminal.command, args, { cwd: spawnCwd })
}

// launchWindowsTerminal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function launchWindowsTerminal(
  terminal: TerminalInfo,
  claudePath: string,
  claudeArgs: string[],
  cwd?: string,
): Promise<boolean> {
  // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const args: string[] = []

  // 按照 terminal.name 的取值选择共享工具的具体处理分支。
  switch (terminal.name) {
    // --- PURE ARGV PATH ---
    case 'Windows Terminal':
      // 满足 `cwd) args.push('-d', cwd` 时，共享工具执行该分支。
      if (cwd) args.push('-d', cwd)
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--', claudePath, ...claudeArgs)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break

    // --- SHELL-STRING PATHS ---
    // PowerShell -Command and cmd /k take a command string. No argv exec
    // mode that also keeps the session interactive after claude exits.
    // User input is escaped per-shell; correctness of that escaping is
    // load-bearing here.

    case 'PowerShell': {
      // Single-quoted PowerShell strings have NO escape sequences (only
      // '' for a literal quote). Double-quoted strings interpret backtick
      // escapes — a query containing `" could break out.
      // cdCmd 命令数据保存`psQuote`，供共享工具后续处理使用。
      const cdCmd = cwd ? `Set-Location ${psQuote(cwd)}; ` : ''
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(
        '-NoExit',
        '-Command',
        `${cdCmd}& ${psQuote(claudePath)} ${claudeArgs.map(psQuote).join(' ')}`,
      )
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    default: {
      // cdCmd 命令数据保存`cmdQuote`，供共享工具后续处理使用。
      const cdCmd = cwd ? `cd /d ${cmdQuote(cwd)} && ` : ''
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(
        '/k',
        // 这个回调绑定到 `${cdCmd}${cmdQuote(claudePath)} ${claudeArgs.map(a => cmdQuote(a)).join(' ')}`,，负责共享工具在该局部场景下的响应。
        `${cdCmd}${cmdQuote(claudePath)} ${claudeArgs.map(a => cmdQuote(a)).join(' ')}`,
      )
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // cmd.exe does NOT use MSVCRT-style argument parsing. libuv's default
  // quoting for spawn() on Windows assumes MSVCRT rules and would double-
  // escape our already-cmdQuote'd string. Bypass it for cmd.exe only.
  // 返回 `spawnDetached(terminal.command, args, {`，作为共享工具这次计算的结果。
  return spawnDetached(terminal.command, args, {
    windowsVerbatimArguments: terminal.name === 'Command Prompt',
  })
}

/**
 * Spawn a terminal detached so the handler process can exit without
 * waiting for the terminal to close. Resolves false on spawn failure
 * (ENOENT, EACCES) rather than crashing.
 */
// spawnDetached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function spawnDetached(
  command: string,
  args: string[],
  opts: { cwd?: string; windowsVerbatimArguments?: boolean } = {},
): Promise<boolean> {
  // 返回 `new Promise<boolean>(resolve => {`，作为共享工具这次计算的结果。
  return new Promise<boolean>(resolve => {
    // child保存`spawn`，供共享工具后续处理使用。
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      cwd: opts.cwd,
      windowsVerbatimArguments: opts.windowsVerbatimArguments,
    })
    // 调用 child.once，触发共享工具此处需要的副作用。
    child.once('error', err => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to spawn ${command}: ${err.message}`, {
        level: 'error',
      })
      // 显式忽略 `resolve(false)` 的返回值，只保留它触发的副作用。
      void resolve(false)
    })
    // 调用 child.once，触发共享工具此处需要的副作用。
    child.once('spawn', () => {
      // 调用 child.unref，触发共享工具此处需要的副作用。
      child.unref()
      // 显式忽略 `resolve(true)` 的返回值，只保留它触发的副作用。
      void resolve(true)
    })
  })
}

/**
 * Build a single-quoted POSIX shell command string. ONLY used by the
 * AppleScript paths (iTerm, Terminal.app) which have no argv interface.
 */
// buildShellCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildShellCommand(
  claudePath: string,
  claudeArgs: string[],
  cwd?: string,
): string {
  // cdPrefix保存`shellQuote`，供共享工具后续处理使用。
  const cdPrefix = cwd ? `cd ${shellQuote(cwd)} && ` : ''
  // 返回 ``${cdPrefix}${[claudePath, ...claudeArgs].map(shellQuote).join(' ')}``，作为共享工具这次计算的结果。
  return `${cdPrefix}${[claudePath, ...claudeArgs].map(shellQuote).join(' ')}`
}

/**
 * POSIX single-quote escaping. Single-quoted strings have zero
 * interpretation except for the closing single quote itself.
 * Only used by buildShellCommand() for the AppleScript paths.
 */
// shellQuote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shellQuote(s: string): string {
  // 返回 ``'${s.replace(/'/g, "'\\''")}'``，作为共享工具这次计算的结果。
  return `'${s.replace(/'/g, "'\\''")}'`
}

/**
 * AppleScript string literal escaping (backslash then double-quote).
 */
// appleScriptQuote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function appleScriptQuote(s: string): string {
  // 返回 ``"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"``，作为共享工具这次计算的结果。
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * PowerShell single-quoted string. The ONLY special sequence is '' for a
 * literal single quote — no backtick escapes, no variable expansion, no
 * subexpressions. This is the safe PowerShell quoting; double-quoted
 * strings interpret `n `t `" etc. and can be escaped out of.
 */
// psQuote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function psQuote(s: string): string {
  // 返回 ``'${s.replace(/'/g, "''")}'``，作为共享工具这次计算的结果。
  return `'${s.replace(/'/g, "''")}'`
}

/**
 * cmd.exe argument quoting. cmd.exe does NOT use CommandLineToArgvW-style
 * backslash escaping — it toggles its quoting state on every raw "
 * character, so an embedded " breaks out of the quoted region and exposes
 * metacharacters (& | < > ^) to cmd.exe interpretation = command injection.
 *
 * Strategy: strip " from the input (it cannot be safely represented in a
 * cmd.exe double-quoted string). Escape % as %% to prevent environment
 * variable expansion (%PATH% etc.) which cmd.exe performs even inside
 * double quotes. Trailing backslashes are still doubled because the
 * *child process* (claude.exe) uses CommandLineToArgvW, where a trailing
 * \ before our closing " would eat the close-quote.
 */
// cmdQuote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cmdQuote(arg: string): string {
  // stripped格式化`arg.replace`，供共享工具后续处理使用。
  const stripped = arg.replace(/"/g, '').replace(/%/g, '%%')
  // escaped格式化`stripped.replace`，供共享工具后续处理使用。
  const escaped = stripped.replace(/(\\+)$/, '$1$1')
  // 返回 `"${escaped}"`，把共享工具这个分支的结果交还调用方。
  return `"${escaped}"`
}
