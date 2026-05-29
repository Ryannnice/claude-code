// 引入 buildPrefix，将 ../shell/specPrefix.js 中已经封装好的能力接到本文件流程里。
import { buildPrefix } from '../shell/specPrefix.js'
// 引入 splitCommand_DEPRECATED，将 ./commands.js 中已经封装好的能力接到本文件流程里。
import { splitCommand_DEPRECATED } from './commands.js'
// 引入 extractCommandArguments、parseCommand，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { extractCommandArguments, parseCommand } from './parser.js'
// 引入 getCommandSpec，将 ./registry.js 中已经封装好的能力接到本文件流程里。
import { getCommandSpec } from './registry.js'

// NUMERIC保存`/^\d+$/`，供共享工具 prefix后续判断或输出使用。
const NUMERIC = /^\d+$/
// ENV_VAR保存`/^[A-Za-z_][A-Za-z0-9_]*=/`，供共享工具 prefix后续判断或输出使用。
const ENV_VAR = /^[A-Za-z_][A-Za-z0-9_]*=/

// Wrapper commands with complex option handling that can't be expressed in specs
// WRAPPER_COMMANDS 命令数据保存`Set`，供共享工具后续处理使用。
const WRAPPER_COMMANDS = new Set([
  'nice', // command position varies based on options
])

// toArray保存`Array.isArray`，供共享工具后续处理使用。
const toArray = <T>(val: T | T[]): T[] => (Array.isArray(val) ? val : [val])

// Check if args[0] matches a known subcommand (disambiguates wrapper commands
// that also have subcommands, e.g. the git spec has isCommand args for aliases).
// isKnownSubcommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKnownSubcommand(
  arg: string,
  spec: { subcommands?: { name: string | string[] }[] } | null,
): boolean {
  // 满足 `!spec?.subcommands?.length` 时，共享工具执行该分支。
  if (!spec?.subcommands?.length) return false
  // 返回 `spec.subcommands.some(sub =>`，作为共享工具这次计算的结果。
  return spec.subcommands.some(sub =>
    Array.isArray(sub.name) ? sub.name.includes(arg) : sub.name === arg,
  )
}

// getCommandPrefixStatic 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCommandPrefixStatic(
  command: string,
  recursionDepth = 0,
  wrapperCount = 0,
): Promise<{ commandPrefix: string | null } | null> {
  // 只有 `wrapperCount > 2 || recursionDepth > 10` 满足时，共享工具才执行该分支。
  if (wrapperCount > 2 || recursionDepth > 10) return null

  // 解析结果解析`parseCommand`，供共享工具后续处理使用。
  const parsed = await parseCommand(command)
  // 解析结果缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parsed) return null
  // parsed.commandNode 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parsed.commandNode) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { commandPrefix: null }
  }

  // 从 `parsed` 解构 envVars、commandNode，减少共享工具 prefix对同一对象的重复访问。
  const { envVars, commandNode } = parsed
  // cmdArgs 命令数据保存`extractCommandArguments`，供共享工具后续处理使用。
  const cmdArgs = extractCommandArguments(commandNode)

  // 从 `cmdArgs` 按位置拆出 cmd、其余 args，让共享工具 prefix分别处理这些返回值。
  const [cmd, ...args] = cmdArgs
  // cmd 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cmd) return { commandPrefix: null }

  // Check if this is a wrapper command by looking at its spec
  // spec读取`getCommandSpec`，供共享工具后续处理使用。
  const spec = await getCommandSpec(cmd)
  // Check if this is a wrapper command
  // isWrapper 先占位，稍后的条件分支会根据实际输入补齐它。
  let isWrapper =
    WRAPPER_COMMANDS.has(cmd) ||
    // 这个回调绑定到 (spec?.args && toArray(spec.args).some(arg => arg?.isCommand))，负责共享工具在该局部场景下的响应。
    (spec?.args && toArray(spec.args).some(arg => arg?.isCommand))

  // Special case: if the command has subcommands and the first arg matches a subcommand,
  // treat it as a regular command, not a wrapper
  // 只有 `isWrapper && args[0] && isKnownSubcommand(args[0], spec)` 满足时，共享工具才执行该分支。
  if (isWrapper && args[0] && isKnownSubcommand(args[0], spec)) {
    // isWrapper更新为 `false`，确保Bash 解析工具后续读取最新状态。
    isWrapper = false
  }

  // prefix保存`isWrapper`，供后续判断或组装使用。
  const prefix = isWrapper
    ? await handleWrapper(cmd, args, recursionDepth, wrapperCount)
    : await buildPrefix(cmd, args, spec)

  // 只有 `prefix === null && recursionDepth === 0 && isWrap` 满足时，共享工具才执行该分支。
  if (prefix === null && recursionDepth === 0 && isWrapper) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // envPrefix格式化`envVars.join`，供共享工具后续处理使用。
  const envPrefix = envVars.length ? `${envVars.join(' ')} ` : ''
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { commandPrefix: prefix ? envPrefix + prefix : null }
}

// handleWrapper 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleWrapper(
  command: string,
  args: string[],
  recursionDepth: number,
  wrapperCount: number,
): Promise<string | null> {
  // spec读取`getCommandSpec`，供共享工具后续处理使用。
  const spec = await getCommandSpec(command)

  // 满足 `spec?.args` 时，共享工具执行该分支。
  if (spec?.args) {
    // commandArgIndex 命令数据保存`toArray`，供共享工具后续处理使用。
    const commandArgIndex = toArray(spec.args).findIndex(arg => arg?.isCommand)

    // `commandArgIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (commandArgIndex !== -1) {
      // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
      const parts = [command]

      // 循环处理 `let i = 0; i < args.length && i <= commandArgInde`，让共享工具逐项把同类条目按顺序走完。
      for (let i = 0; i < args.length && i <= commandArgIndex; i++) {
        // 满足 `i === commandArgIndex` 时，共享工具执行该分支。
        if (i === commandArgIndex) {
          // 结果读取`getCommandPrefixStatic`，供共享工具后续处理使用。
          const result = await getCommandPrefixStatic(
            args.slice(i).join(' '),
            recursionDepth + 1,
            wrapperCount + 1,
          )
          // 满足 `result?.commandPrefix` 时，共享工具执行该分支。
          if (result?.commandPrefix) {
            // 片段列表追加新条目，保持收集顺序与输入顺序一致。
            parts.push(...result.commandPrefix.split(' '))
            // 返回 `parts.join(' ')`，作为共享工具这次计算的结果。
            return parts.join(' ')
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        // 共享工具 prefix在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          args[i] &&
          !args[i]!.startsWith('-') &&
          !ENV_VAR.test(args[i]!)
        ) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(args[i]!)
        }
      }
    }
  }

  // wrapped筛选`args.find`，供共享工具后续处理使用。
  const wrapped = args.find(
    // 当前参数更新为 `> !arg.startsWith('-') && !NUMERIC.test(arg) && !ENV_VAR....`，确保Bash 解析工具后续读取最新状态。
    arg => !arg.startsWith('-') && !NUMERIC.test(arg) && !ENV_VAR.test(arg),
  )
  // wrapped缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!wrapped) return command

  // 结果读取`getCommandPrefixStatic`，供共享工具后续处理使用。
  const result = await getCommandPrefixStatic(
    args.slice(args.indexOf(wrapped)).join(' '),
    recursionDepth + 1,
    wrapperCount + 1,
  )

  // 返回 `!result?.commandPrefix ? null : `${command} ${result.commandPrefix}``，作为共享工具这次计算的结果。
  return !result?.commandPrefix ? null : `${command} ${result.commandPrefix}`
}

/**
 * Computes prefixes for a compound command (with && / || / ;).
 * For single commands, returns a single-element array with the prefix.
 *
 * For compound commands, computes per-subcommand prefixes and collapses
 * them: subcommands sharing a root (first word) are collapsed via
 * word-aligned longest common prefix.
 *
 * @param excludeSubcommand — optional filter; return true for subcommands
 *   that should be excluded from the prefix suggestion (e.g. read-only
 *   commands that are already auto-allowed).
 */
// getCompoundCommandPrefixesStatic 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCompoundCommandPrefixesStatic(
  command: string,
  excludeSubcommand?: (subcommand: string) => boolean,
): Promise<string[]> {
  // subcommands 命令数据格式化`splitCommand_DEPRECATED`，供共享工具后续处理使用。
  const subcommands = splitCommand_DEPRECATED(command)
  // 满足 `subcommands.length <= 1` 时，共享工具执行该分支。
  if (subcommands.length <= 1) {
    // 结果读取`getCommandPrefixStatic`，供共享工具后续处理使用。
    const result = await getCommandPrefixStatic(command)
    // 返回 `result?.commandPrefix ? [result.commandPrefix] : []`，作为共享工具这次计算的结果。
    return result?.commandPrefix ? [result.commandPrefix] : []
  }

  // prefixes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const prefixes: string[] = []
  // 按顺序遍历 `subcommands` 中的subcmd 命令数据，逐个交给共享工具处理。
  for (const subcmd of subcommands) {
    // trimmed格式化`subcmd.trim`，供共享工具后续处理使用。
    const trimmed = subcmd.trim()
    // 满足 `excludeSubcommand?.(trimmed)` 时，共享工具执行该分支。
    if (excludeSubcommand?.(trimmed)) continue
    // 结果读取`getCommandPrefixStatic`，供共享工具后续处理使用。
    const result = await getCommandPrefixStatic(trimmed)
    // 满足 `result?.commandPrefix` 时，共享工具执行该分支。
    if (result?.commandPrefix) {
      // prefixes 集合追加新条目，保持收集顺序与输入顺序一致。
      prefixes.push(result.commandPrefix)
    }
  }

  // prefixes 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (prefixes.length === 0) return []

  // Group prefixes by their first word (root command)
  // groups 集合 命名 `new Map<string, string[]>()`，让后续代码直接表达这个值的用途。
  const groups = new Map<string, string[]>()
  // 按顺序遍历 `prefixes` 中的prefix，逐个交给共享工具处理。
  for (const prefix of prefixes) {
    // root格式化`prefix.split`，供共享工具后续处理使用。
    const root = prefix.split(' ')[0]!
    // group读取`groups.get`，供共享工具后续处理使用。
    const group = groups.get(root)
    // 满足 `group` 时，共享工具执行该分支。
    if (group) {
      // group追加新条目，保持收集顺序与输入顺序一致。
      group.push(prefix)
    } else {
      // groups.set 写入新的状态值，使共享工具后续读取保持一致。
      groups.set(root, [prefix])
    }
  }

  // Collapse each group via word-aligned LCP
  // collapsed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const collapsed: string[] = []
  // 循环处理 `const [, group] of groups`，让共享工具逐项把同类条目按顺序走完。
  for (const [, group] of groups) {
    // collapsed追加新条目，保持收集顺序与输入顺序一致。
    collapsed.push(longestCommonPrefix(group))
  }
  // 返回 `collapsed`，作为共享工具这次计算的结果。
  return collapsed
}

/**
 * Compute the longest common prefix of strings, aligned to word boundaries.
 * e.g. ["git fetch", "git worktree"] → "git"
 *      ["npm run test", "npm run lint"] → "npm run"
 */
// longestCommonPrefix 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function longestCommonPrefix(strings: string[]): string {
  // strings 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (strings.length === 0) return ''
  // 满足 `strings.length === 1` 时，共享工具执行该分支。
  if (strings.length === 1) return strings[0]!

  // first读取 `strings[0]!` 对应条目，后续围绕该成员继续处理。
  const first = strings[0]!
  // words 集合格式化`first.split`，供共享工具后续处理使用。
  const words = first.split(' ')
  // commonWords 集合保存 `words.length` 的判断结果，供共享工具 prefix后续分支直接复用。
  let commonWords = words.length

  // 循环处理 `let i = 1; i < strings.length; i++`，让共享工具逐项把同类条目按顺序走完。
  for (let i = 1; i < strings.length; i++) {
    // otherWords 集合格式化`split`，供共享工具后续处理使用。
    const otherWords = strings[i]!.split(' ')
    // shared保存`0`，供共享工具 prefix后续判断或输出使用。
    let shared = 0
    // 调用 while，触发共享工具此处需要的副作用。
    while (
      shared < commonWords &&
      shared < otherWords.length &&
      words[shared] === otherWords[shared]
    ) {
      // 共享工具 prefix在这里处理 `shared++`，完成这一小步状态转换。
      shared++
    }
    // commonWords 集合更新为 `shared`，确保Bash 解析工具后续读取最新状态。
    commonWords = shared
  }

  // 返回 `words.slice(0, Math.max(1, commonWords)).join(' ')`，作为共享工具这次计算的结果。
  return words.slice(0, Math.max(1, commonWords)).join(' ')
}
