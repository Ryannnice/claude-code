// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, writeFile } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url'
// 复用 color 终端界面组件，避免在这里重复拼装显示逻辑。
import { color } from '../components/design-system/color.js'
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../ink/supports-hyperlinks.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from './errors.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 类型依赖 { ThemeName } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { ThemeName } from './theme.js'

// EOL保存`'\n'`，作为后续固定文本处理的输入。
const EOL = '\n'

// ShellInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ShellInfo = {
  name: string
  rcFile: string
  cacheFile: string
  completionLine: string
  shellFlag: string
}

// detectShell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectShell(): ShellInfo | null {
  // shell 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const shell = process.env.SHELL || ''
  // home保存`homedir`，供共享工具后续处理使用。
  const home = homedir()
  // claudeDir格式化`join`，供共享工具后续处理使用。
  const claudeDir = join(home, '.claude')

  // 只有 `shell.endsWith('/zsh') || shell.endsWith('/zsh.exe')` 满足时，共享工具才执行该分支。
  if (shell.endsWith('/zsh') || shell.endsWith('/zsh.exe')) {
    // cacheFile 文件数据格式化`join`，供共享工具后续处理使用。
    const cacheFile = join(claudeDir, 'completion.zsh')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      name: 'zsh',
      rcFile: join(home, '.zshrc'),
      cacheFile,
      completionLine: `[[ -f "${cacheFile}" ]] && source "${cacheFile}"`,
      shellFlag: 'zsh',
    }
  }
  // 只有 `shell.endsWith('/bash') || shell.endsWith('/bash.exe')` 满足时，共享工具才执行该分支。
  if (shell.endsWith('/bash') || shell.endsWith('/bash.exe')) {
    // cacheFile 文件数据格式化`join`，供共享工具后续处理使用。
    const cacheFile = join(claudeDir, 'completion.bash')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      name: 'bash',
      rcFile: join(home, '.bashrc'),
      cacheFile,
      completionLine: `[ -f "${cacheFile}" ] && source "${cacheFile}"`,
      shellFlag: 'bash',
    }
  }
  // 只有 `shell.endsWith('/fish') || shell.endsWith('/fish.exe')` 满足时，共享工具才执行该分支。
  if (shell.endsWith('/fish') || shell.endsWith('/fish.exe')) {
    // xdg格式化`join`，供共享工具后续处理使用。
    const xdg = process.env.XDG_CONFIG_HOME || join(home, '.config')
    // cacheFile 文件数据格式化`join`，供共享工具后续处理使用。
    const cacheFile = join(claudeDir, 'completion.fish')
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      name: 'fish',
      rcFile: join(xdg, 'fish', 'config.fish'),
      cacheFile,
      completionLine: `[ -f "${cacheFile}" ] && source "${cacheFile}"`,
      shellFlag: 'fish',
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// formatPathLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatPathLink(filePath: string): string {
  // 满足 `!supportsHyperlinks()` 时，共享工具执行该分支。
  if (!supportsHyperlinks()) {
    // 返回 `filePath`，作为共享工具这次计算的结果。
    return filePath
  }
  // fileUrl 文件数据保存`pathToFileURL`，供共享工具后续处理使用。
  const fileUrl = pathToFileURL(filePath).href
  // 返回 ``\x1b]8;;${fileUrl}\x07${filePath}\x1b]8;;\x07``，作为共享工具这次计算的结果。
  return `\x1b]8;;${fileUrl}\x07${filePath}\x1b]8;;\x07`
}

/**
 * Generate and cache the completion script, then add a source line to the
 * shell's rc file. Returns a user-facing status message.
 */
// setupShellCompletion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setupShellCompletion(theme: ThemeName): Promise<string> {
  // shell读取`detectShell`，供共享工具后续处理使用。
  const shell = detectShell()
  // shell缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shell) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // Ensure the cache directory exists
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dirname(shell.cacheFile), { recursive: true })` 完成，再继续共享工具 completion Cache的异步流程。
    await mkdir(dirname(shell.cacheFile), { recursive: true })
  } catch (e: unknown) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 ``${EOL}${color('warning', theme)(`Could not write ${shell.name} complet...`，作为共享工具这次计算的结果。
    return `${EOL}${color('warning', theme)(`Could not write ${shell.name} completion cache`)}${EOL}${chalk.dim(`Run manually: claude completion ${shell.shellFlag} > ${shell.cacheFile}`)}${EOL}`
  }

  // Generate the completion script by writing directly to the cache file.
  // Using --output avoids piping through stdout where process.exit() can
  // truncate output before the pipe buffer drains.
  // claudeBin标记共享工具 completion Cache是否启用对应路径。
  const claudeBin = process.argv[1] || 'claude'
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(claudeBin, [
    'completion',
    shell.shellFlag,
    '--output',
    shell.cacheFile,
  ])
  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 返回 ``${EOL}${color('warning', theme)(`Could not generate ${shell.name} shel...`，作为共享工具这次计算的结果。
    return `${EOL}${color('warning', theme)(`Could not generate ${shell.name} shell completions`)}${EOL}${chalk.dim(`Run manually: claude completion ${shell.shellFlag} > ${shell.cacheFile}`)}${EOL}`
  }

  // Check if rc file already sources completions
  // existing固定为 `''`，作为共享工具 completion Cache后续展示或比较的基准。
  let existing = ''
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // existing更新为 `await readFile(shell.rcFile, { encoding: 'utf-8' })`，确保共享工具后续读取最新状态。
    existing = await readFile(shell.rcFile, { encoding: 'utf-8' })
    // 共享工具在这里按实际状态进入对应分支。
    if (
      existing.includes('claude completion') ||
      existing.includes(shell.cacheFile)
    ) {
      // 返回 ``${EOL}${color('success', theme)(`Shell completions updated for ${shell...`，作为共享工具这次计算的结果。
      return `${EOL}${color('success', theme)(`Shell completions updated for ${shell.name}`)}${EOL}${chalk.dim(`See ${formatPathLink(shell.rcFile)}`)}${EOL}`
    }
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
      // 返回 ``${EOL}${color('warning', theme)(`Could not install ${shell.name} shell...`，作为共享工具这次计算的结果。
      return `${EOL}${color('warning', theme)(`Could not install ${shell.name} shell completions`)}${EOL}${chalk.dim(`Add this to ${formatPathLink(shell.rcFile)}:`)}${EOL}${chalk.dim(shell.completionLine)}${EOL}`
    }
  }

  // Append source line to rc file
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // configDir 配置保存`dirname`，供共享工具后续处理使用。
    const configDir = dirname(shell.rcFile)
    // 等待 `mkdir(configDir, { recursive: true })` 完成，再继续共享工具 completion Cache的异步流程。
    await mkdir(configDir, { recursive: true })

    // separator保存`existing.endsWith`，供共享工具后续处理使用。
    const separator = existing && !existing.endsWith('\n') ? '\n' : ''
    // 文本内容 命名 ``${existing}${separator}\n# Claude Code shell completions...`，让后续代码直接表达这个值的用途。
    const content = `${existing}${separator}\n# Claude Code shell completions\n${shell.completionLine}\n`
    // 等待 `writeFile(shell.rcFile, content, { encoding: 'utf-8' })` 完成，再继续共享工具 completion Cache的异步流程。
    await writeFile(shell.rcFile, content, { encoding: 'utf-8' })

    // 返回 ``${EOL}${color('success', theme)(`Installed ${shell.name} shell complet...`，作为共享工具这次计算的结果。
    return `${EOL}${color('success', theme)(`Installed ${shell.name} shell completions`)}${EOL}${chalk.dim(`Added to ${formatPathLink(shell.rcFile)}`)}${EOL}${chalk.dim(`Run: source ${shell.rcFile}`)}${EOL}`
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 ``${EOL}${color('warning', theme)(`Could not install ${shell.name} shell...`，作为共享工具这次计算的结果。
    return `${EOL}${color('warning', theme)(`Could not install ${shell.name} shell completions`)}${EOL}${chalk.dim(`Add this to ${formatPathLink(shell.rcFile)}:`)}${EOL}${chalk.dim(shell.completionLine)}${EOL}`
  }
}

/**
 * Regenerate cached shell completion scripts in ~/.claude/.
 * Called after `claude update` so completions stay in sync with the new binary.
 */
// regenerateCompletionCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function regenerateCompletionCache(): Promise<void> {
  // shell读取`detectShell`，供共享工具后续处理使用。
  const shell = detectShell()
  // shell缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shell) {
    // 共享工具 completion Cache在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Regenerating ${shell.name} completion cache`)

  // claudeBin标记共享工具 completion Cache是否启用对应路径。
  const claudeBin = process.argv[1] || 'claude'
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(claudeBin, [
    'completion',
    shell.shellFlag,
    '--output',
    shell.cacheFile,
  ])

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `update: Failed to regenerate ${shell.name} completion cache`,
    )
    // 共享工具 completion Cache在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `update: Regenerated ${shell.name} completion cache at ${shell.cacheFile}`,
  )
}
