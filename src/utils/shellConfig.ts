/**
 * Utilities for managing shell configuration files (like .bashrc, .zshrc)
 * Used for managing claude aliases and PATH entries
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open, readFile, stat } from 'fs/promises'
// 引入 homedir as osHomedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir as osHomedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from './errors.js'
// 引入 getLocalClaudePath，将 ./localInstaller.js 中已经封装好的能力接到本文件流程里。
import { getLocalClaudePath } from './localInstaller.js'

// CLAUDE_ALIAS_REGEX 命名 `/^\s*alias\s+claude\s*=/`，让后续代码直接表达这个值的用途。
export const CLAUDE_ALIAS_REGEX = /^\s*alias\s+claude\s*=/

// EnvLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

// ShellConfigOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ShellConfigOptions = {
  env?: EnvLike
  homedir?: string
}

/**
 * Get the paths to shell configuration files
 * Respects ZDOTDIR for zsh users
 * @param options Optional overrides for testing (env, homedir)
 */
// getShellConfigPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getShellConfigPaths(
  options?: ShellConfigOptions,
): Record<string, string> {
  // home保存`osHomedir`，供共享工具后续处理使用。
  const home = options?.homedir ?? osHomedir()
  // env保存`options?.env ?? process.env`，供后续判断或组装使用。
  const env = options?.env ?? process.env
  // zshConfigDir 配置标记共享工具 shell Config是否启用对应路径。
  const zshConfigDir = env.ZDOTDIR || home
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    zsh: join(zshConfigDir, '.zshrc'),
    bash: join(home, '.bashrc'),
    fish: join(home, '.config/fish/config.fish'),
  }
}

/**
 * Filter out installer-created claude aliases from an array of lines
 * Only removes aliases pointing to $HOME/.claude/local/claude
 * Preserves custom user aliases that point to other locations
 * Returns the filtered lines and whether our default installer alias was found
 */
// filterClaudeAliases 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterClaudeAliases(lines: string[]): {
  filtered: string[]
  hadAlias: boolean
} {
  // hadAlias 集合标记共享工具 shell Config是否启用对应路径。
  let hadAlias = false
  // filtered筛选`lines.filter`，供共享工具后续处理使用。
  const filtered = lines.filter(line => {
    // Check if this is a claude alias
    // 满足 `CLAUDE_ALIAS_REGEX.test(line)` 时，共享工具执行该分支。
    if (CLAUDE_ALIAS_REGEX.test(line)) {
      // Extract the alias target - handle spaces, quotes, and various formats
      // First try with quotes
      // match匹配`line.match`，供共享工具后续处理使用。
      let match = line.match(/alias\s+claude\s*=\s*["']([^"']+)["']/)
      // match缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!match) {
        // Try without quotes (capturing until end of line or comment)
        // match更新为 `line.match(/alias\s+claude\s*=\s*([^#\n]+)/)`，确保共享工具后续读取最新状态。
        match = line.match(/alias\s+claude\s*=\s*([^#\n]+)/)
      }

      // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
      if (match && match[1]) {
        // target格式化`trim`，供共享工具后续处理使用。
        const target = match[1].trim()
        // Only remove if it points to the installer location
        // The installer always creates aliases with the full expanded path
        // 满足 `target === getLocalClaudePath()` 时，共享工具执行该分支。
        if (target === getLocalClaudePath()) {
          // hadAlias 集合更新为 `true`，确保共享工具后续读取最新状态。
          hadAlias = true
          // 返回 `false // Remove this line`，作为共享工具这次计算的结果。
          return false // Remove this line
        }
      }
      // Keep custom aliases that don't point to the installer location
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { filtered, hadAlias }
}

/**
 * Read a file and split it into lines
 * Returns null if file doesn't exist or can't be read
 */
// readFileLines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readFileLines(
  filePath: string,
): Promise<string[] | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(filePath, { encoding: 'utf8' })
    // 返回 `content.split('\n')`，作为共享工具这次计算的结果。
    return content.split('\n')
  } catch (e: unknown) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return null
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

/**
 * Write lines back to a file
 */
// writeFileLines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeFileLines(
  filePath: string,
  lines: string[],
): Promise<void> {
  // fh保存`open`，供共享工具后续处理使用。
  const fh = await open(filePath, 'w')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fh.writeFile(lines.join('\n'), { encoding: 'utf8' })` 完成，再继续共享工具 shell Config的异步流程。
    await fh.writeFile(lines.join('\n'), { encoding: 'utf8' })
    // 等待 `fh.datasync()` 完成，再继续共享工具 shell Config的异步流程。
    await fh.datasync()
  } finally {
    // 等待 `fh.close()` 完成，再继续共享工具 shell Config的异步流程。
    await fh.close()
  }
}

/**
 * Check if a claude alias exists in any shell config file
 * Returns the alias target if found, null otherwise
 * @param options Optional overrides for testing (env, homedir)
 */
// findClaudeAlias 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findClaudeAlias(
  options?: ShellConfigOptions,
): Promise<string | null> {
  // configs 配置读取`getShellConfigPaths`，供共享工具后续处理使用。
  const configs = getShellConfigPaths(options)

  // 逐项读取 `Object.values(configs)` 中的configPath 路径数据，按输入顺序推进共享工具。
  for (const configPath of Object.values(configs)) {
    // 文本行读取`readFileLines`，供共享工具后续处理使用。
    const lines = await readFileLines(configPath)
    // 文本行缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!lines) continue

    // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
    for (const line of lines) {
      // 满足 `CLAUDE_ALIAS_REGEX.test(line)` 时，共享工具执行该分支。
      if (CLAUDE_ALIAS_REGEX.test(line)) {
        // Extract the alias target
        // match匹配`line.match`，供共享工具后续处理使用。
        const match = line.match(/alias\s+claude=["']?([^"'\s]+)/)
        // 组合条件 `match && match[1]` 成立时，共享工具才启用这条专门路径。
        if (match && match[1]) {
          // 返回 match[1]，把共享工具这个分支的结果交还调用方。
          return match[1]
        }
      }
    }
  }

  // 返回 null，把共享工具这个分支的结果交还调用方。
  return null
}

/**
 * Check if a claude alias exists and points to a valid executable
 * Returns the alias target if valid, null otherwise
 * @param options Optional overrides for testing (env, homedir)
 */
// findValidClaudeAlias 承担共享工具中的独立步骤，串起共享工具 shell Config需要的输入整理、状态更新和结果输出。
export async function findValidClaudeAlias(
  options?: ShellConfigOptions,
): Promise<string | null> {
  // aliasTarget筛选`findClaudeAlias`，供共享工具后续处理使用。
  const aliasTarget = await findClaudeAlias(options)
  // 判断 !aliasTarget，将共享工具分流到只适用于该条件的处理路径。
  if (!aliasTarget) return null

  // home保存`osHomedir`，供共享工具后续处理使用。
  const home = options?.homedir ?? osHomedir()

  // Expand ~ to home directory
  // expandedPath 文件数据读取`aliasTarget.startsWith`，供共享工具后续处理使用。
  const expandedPath = aliasTarget.startsWith('~')
    ? aliasTarget.replace('~', home)
    : aliasTarget

  // Check if the target exists and is executable
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文件状态保存`stat`，供共享工具后续处理使用。
    const stats = await stat(expandedPath)
    // Check if it's a file (could be executable or symlink)
    // 只有 `stats.isFile() || stats.isSymbolicLink()` 满足时，共享工具才执行该分支。
    if (stats.isFile() || stats.isSymbolicLink()) {
      // 返回 `aliasTarget`，作为共享工具这次计算的结果。
      return aliasTarget
    }
  } catch {
    // Target doesn't exist or can't be accessed
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
