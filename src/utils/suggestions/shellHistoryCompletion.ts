// 引入 getHistory，将 ../../history.js 中已经封装好的能力接到本文件流程里。
import { getHistory } from '../../history.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'

/**
 * Result of shell history completion lookup
 */
// ShellHistoryMatch 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellHistoryMatch = {
  /** The full command from history */
  fullCommand: string
  /** The suffix to display as ghost text (the part after user's input) */
  suffix: string
}

// Cache for shell history commands to avoid repeated async reads
// History only changes when user submits a command, so a long TTL is fine
// shellHistoryCache 缓存初始化为空值，后续分支会在有数据时补齐。
let shellHistoryCache: string[] | null = null
// shellHistoryCacheTimestamp 缓存 命名 `0`，让后续代码直接表达这个值的用途。
let shellHistoryCacheTimestamp = 0
// CACHE_TTL_MS 缓存保存`60000 // 60 seconds - history won't change while typing`，供后续判断或组装使用。
const CACHE_TTL_MS = 60000 // 60 seconds - history won't change while typing

/**
 * Get shell commands from history, with caching
 */
// getShellHistoryCommands 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getShellHistoryCommands(): Promise<string[]> {
  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()

  // Return cached result if still fresh
  // 只有 `shellHistoryCache && now - shellHistoryCacheTimes` 满足时，共享工具才执行该分支。
  if (shellHistoryCache && now - shellHistoryCacheTimestamp < CACHE_TTL_MS) {
    // 返回 `shellHistoryCache`，作为共享工具这次计算的结果。
    return shellHistoryCache
  }

  // commands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const commands: string[] = []
  // seen构建`new Set<string>()` 整理出中间结果，供共享工具 shell History Completion后续步骤使用。
  const seen = new Set<string>()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Read history entries and filter for bash commands
    // 逐项读取 `getHistory()` 中的entry，按输入顺序推进共享工具。
    for await (const entry of getHistory()) {
      // 只有 `entry.display && entry.display.startsWith('!')` 满足时，共享工具才执行该分支。
      if (entry.display && entry.display.startsWith('!')) {
        // Remove the '!' prefix to get the actual command
        // 命令格式化`display.slice`，供共享工具后续处理使用。
        const command = entry.display.slice(1).trim()
        // 只有 `command && !seen.has(command)` 满足时，共享工具才执行该分支。
        if (command && !seen.has(command)) {
          // 调用 seen.add，触发共享工具此处需要的副作用。
          seen.add(command)
          // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
          commands.push(command)
        }
      }
      // Limit to 50 most recent unique commands
      // 满足 `commands.length >= 50` 时，共享工具执行该分支。
      if (commands.length >= 50) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to read shell history: ${error}`)
  }

  // shellHistoryCache 缓存更新为 `commands`，确保共享工具后续读取最新状态。
  shellHistoryCache = commands
  // shellHistoryCacheTimestamp 缓存更新为 `now`，确保共享工具后续读取最新状态。
  shellHistoryCacheTimestamp = now
  // 返回 `commands`，作为共享工具这次计算的结果。
  return commands
}

/**
 * Clear the shell history cache (useful when history is updated)
 */
// clearShellHistoryCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearShellHistoryCache(): void {
  // shellHistoryCache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  shellHistoryCache = null
  // shellHistoryCacheTimestamp 缓存更新为 `0`，确保共享工具后续读取最新状态。
  shellHistoryCacheTimestamp = 0
}

/**
 * Add a command to the front of the shell history cache without
 * flushing the entire cache.  If the command already exists in the
 * cache it is moved to the front (deduped).  When the cache hasn't
 * been populated yet this is a no-op – the next lookup will read
 * the full history which already includes the new command.
 */
// prependToShellHistoryCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prependToShellHistoryCache(command: string): void {
  // shellHistoryCache 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shellHistoryCache) {
    // 共享工具 shell History Completion在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // idx保存`shellHistoryCache.indexOf`，供共享工具后续处理使用。
  const idx = shellHistoryCache.indexOf(command)
  // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (idx !== -1) {
    // 调用 shellHistoryCache.splice，触发共享工具此处需要的副作用。
    shellHistoryCache.splice(idx, 1)
  }
  // 调用 shellHistoryCache.unshift，触发共享工具此处需要的副作用。
  shellHistoryCache.unshift(command)
}

/**
 * Find the best matching shell command from history for the given input
 *
 * @param input The current user input (without '!' prefix)
 * @returns The best match, or null if no match found
 */
// getShellHistoryCompletion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getShellHistoryCompletion(
  input: string,
): Promise<ShellHistoryMatch | null> {
  // Don't suggest for empty or very short input
  // 只有 `!input || input.length < 2` 满足时，共享工具才执行该分支。
  if (!input || input.length < 2) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Check the trimmed input to make sure there's actual content
  // trimmedInput格式化`input.trim`，供共享工具后续处理使用。
  const trimmedInput = input.trim()
  // trimmedInput缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmedInput) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // commands 命令数据读取`getShellHistoryCommands`，供共享工具后续处理使用。
  const commands = await getShellHistoryCommands()

  // Find the first command that starts with the EXACT input (including spaces)
  // This ensures "ls " matches "ls -lah" but "ls  " (2 spaces) does not
  // 按顺序遍历 `commands` 中的命令，逐个交给共享工具处理。
  for (const command of commands) {
    // `command.startsWith(input) && command` 与 `input` 不一致时刷新派生状态，避免使用过期结果。
    if (command.startsWith(input) && command !== input) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        fullCommand: command,
        suffix: command.slice(input.length),
      }
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
