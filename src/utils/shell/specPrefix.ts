/**
 * Fig-spec-driven command prefix extraction.
 *
 * Given a command name + args array + its @withfig/autocomplete spec, walks
 * the spec to find how deep into the args a meaningful prefix extends.
 * `git -C /repo status --short` → `git status` (spec says -C takes a value,
 * skip it, find `status` as a known subcommand).
 *
 * Pure over (string, string[], CommandSpec) — no parser dependency. Extracted
 * from src/utils/bash/prefix.ts so PowerShell's extractor can reuse it;
 * external CLIs (git, npm, kubectl) are shell-agnostic.
 */

// 类型依赖 { CommandSpec } 来自 ../bash/registry.js，用于校准共享工具的数据契约。
import type { CommandSpec } from '../bash/registry.js'

// URL_PROTOCOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const URL_PROTOCOLS = ['http://', 'https://', 'ftp://']

// Overrides for commands whose fig specs aren't available at runtime
// (dynamic imports don't work in native/node builds). Without these,
// calculateDepth falls back to 2, producing overly broad prefixes.
// DEPTH_RULES 集合 集中保存共享工具 spec Prefix要一起传递的字段。
export const DEPTH_RULES: Record<string, number> = {
  rg: 2, // pattern argument is required despite variadic paths
  'pre-commit': 2,
  // CLI tools with deep subcommand trees (e.g. gcloud scheduler jobs list)
  gcloud: 4,
  'gcloud compute': 6,
  'gcloud beta': 6,
  aws: 4,
  az: 4,
  kubectl: 3,
  docker: 3,
  dotnet: 3,
  'git push': 2,
}

// toArray保存`Array.isArray`，供共享工具后续处理使用。
const toArray = <T>(val: T | T[]): T[] => (Array.isArray(val) ? val : [val])

// Check if an argument matches a known subcommand (case-insensitive: PS
// callers pass original-cased args; fig spec names are lowercase)
// isKnownSubcommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKnownSubcommand(arg: string, spec: CommandSpec | null): boolean {
  // 满足 `!spec?.subcommands?.length` 时，共享工具执行该分支。
  if (!spec?.subcommands?.length) return false
  // argLower保存`arg.toLowerCase`，供共享工具后续处理使用。
  const argLower = arg.toLowerCase()
  // 返回 `spec.subcommands.some(sub =>`，作为共享工具这次计算的结果。
  return spec.subcommands.some(sub =>
    Array.isArray(sub.name)
      // 这个回调绑定到 ? sub.name.some(n => n.toLowerCase() === argLower)，负责共享工具在该局部场景下的响应。
      ? sub.name.some(n => n.toLowerCase() === argLower)
      : sub.name.toLowerCase() === argLower,
  )
}

// Check if a flag takes an argument based on spec, or use heuristic
// flagTakesArg 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flagTakesArg(
  flag: string,
  nextArg: string | undefined,
  spec: CommandSpec | null,
): boolean {
  // Check if flag is in spec.options
  // 满足 `spec?.options` 时，共享工具执行该分支。
  if (spec?.options) {
    // option筛选`options.find`，供共享工具后续处理使用。
    const option = spec.options.find(opt =>
      Array.isArray(opt.name) ? opt.name.includes(flag) : opt.name === flag,
    )
    // 满足 `option` 时，共享工具执行该分支。
    if (option) return !!option.args
  }
  // Heuristic: if next arg isn't a flag and isn't a known subcommand, assume it's a flag value
  // 只有 `spec?.subcommands?.length && nextArg && !nextArg.startsWith('-')` 满足时，共享工具才执行该分支。
  if (spec?.subcommands?.length && nextArg && !nextArg.startsWith('-')) {
    // 返回 `!isKnownSubcommand(nextArg, spec)`，作为共享工具这次计算的结果。
    return !isKnownSubcommand(nextArg, spec)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Find the first subcommand by skipping flags and their values
// findFirstSubcommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findFirstSubcommand(
  args: string[],
  spec: CommandSpec | null,
): string | undefined {
  // 按索引扫描 `args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < args.length; i++) {
    // 当前参数保存`args[i]`，供共享工具 spec Prefix后续判断或输出使用。
    const arg = args[i]
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) continue
    // 满足 `arg.startsWith('-')` 时，共享工具执行该分支。
    if (arg.startsWith('-')) {
      // 满足 `flagTakesArg(arg, args[i + 1], spec)` 时，共享工具执行该分支。
      if (flagTakesArg(arg, args[i + 1], spec)) i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `!spec?.subcommands?.length` 时，共享工具执行该分支。
    if (!spec?.subcommands?.length) return arg
    // 满足 `isKnownSubcommand(arg, spec)` 时，共享工具执行该分支。
    if (isKnownSubcommand(arg, spec)) return arg
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// buildPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildPrefix(
  command: string,
  args: string[],
  spec: CommandSpec | null,
): Promise<string> {
  // maxDepth保存`calculateDepth`，供共享工具后续处理使用。
  const maxDepth = await calculateDepth(command, args, spec)
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [command]
  // hasSubcommands 命令数据标记共享工具 spec Prefix是否启用对应路径。
  const hasSubcommands = !!spec?.subcommands?.length
  // foundSubcommand 命令数据标记共享工具 spec Prefix是否启用对应路径。
  let foundSubcommand = false

  // 按索引扫描 `args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < args.length; i++) {
    // 当前参数保存`args[i]`，供共享工具 spec Prefix后续判断或输出使用。
    const arg = args[i]
    // 只有 `!arg || parts.length >= maxDepth` 满足时，共享工具才执行该分支。
    if (!arg || parts.length >= maxDepth) break

    // 满足 `arg.startsWith('-')` 时，共享工具执行该分支。
    if (arg.startsWith('-')) {
      // Special case: python -c should stop after -c
      // 只有 `arg === '-c' && ['python', 'python3'].includes(command.toLowerCase())` 满足时，共享工具才执行该分支。
      if (arg === '-c' && ['python', 'python3'].includes(command.toLowerCase()))
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break

      // Check for isCommand/isModule flags that should be included in prefix
      // 满足 `spec?.options` 时，共享工具执行该分支。
      if (spec?.options) {
        // option筛选`options.find`，供共享工具后续处理使用。
        const option = spec.options.find(opt =>
          Array.isArray(opt.name) ? opt.name.includes(arg) : opt.name === arg,
        )
        // 共享工具在这里按实际状态进入对应分支。
        if (
          option?.args &&
          // 调用 toArray，触发共享工具此处需要的副作用。
          toArray(option.args).some(a => a?.isCommand || a?.isModule)
        ) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(arg)
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
      }

      // For commands with subcommands, skip global flags to find the subcommand
      // 只有 `hasSubcommands && !foundSubcommand` 满足时，共享工具才执行该分支。
      if (hasSubcommands && !foundSubcommand) {
        // 满足 `flagTakesArg(arg, args[i + 1], spec)` 时，共享工具执行该分支。
        if (flagTakesArg(arg, args[i + 1], spec)) i++
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break // Stop at flags (original behavior)
    }

    // 满足 `await shouldStopAtArg(arg, args.slice(0, i), spec)` 时，共享工具执行该分支。
    if (await shouldStopAtArg(arg, args.slice(0, i), spec)) break
    // 只有 `hasSubcommands && !foundSubcommand` 满足时，共享工具才执行该分支。
    if (hasSubcommands && !foundSubcommand) {
      // foundSubcommand 命令数据更新为 `isKnownSubcommand(arg, spec)`，确保共享工具后续读取最新状态。
      foundSubcommand = isKnownSubcommand(arg, spec)
    }
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(arg)
  }

  // 返回 `parts.join(' ')`，作为共享工具这次计算的结果。
  return parts.join(' ')
}

// calculateDepth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function calculateDepth(
  command: string,
  args: string[],
  spec: CommandSpec | null,
): Promise<number> {
  // Find first subcommand by skipping flags and their values
  // firstSubcommand 命令数据筛选`findFirstSubcommand`，供共享工具后续处理使用。
  const firstSubcommand = findFirstSubcommand(args, spec)
  // commandLower 命令数据保存`command.toLowerCase`，供共享工具后续处理使用。
  const commandLower = command.toLowerCase()
  // key保存`firstSubcommand`，供后续判断或组装使用。
  const key = firstSubcommand
    ? `${commandLower} ${firstSubcommand.toLowerCase()}`
    : commandLower
  // 满足 `DEPTH_RULES[key]` 时，共享工具执行该分支。
  if (DEPTH_RULES[key]) return DEPTH_RULES[key]
  // 满足 `DEPTH_RULES[commandLower]` 时，共享工具执行该分支。
  if (DEPTH_RULES[commandLower]) return DEPTH_RULES[commandLower]
  // spec缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!spec) return 2

  // 只有 `spec.options && args.some(arg => arg?.startsWith('-'))` 满足时，共享工具才执行该分支。
  if (spec.options && args.some(arg => arg?.startsWith('-'))) {
    // 按顺序遍历 `args` 中的当前参数，逐个交给共享工具处理。
    for (const arg of args) {
      // 满足 `!arg?.startsWith('-')` 时，共享工具执行该分支。
      if (!arg?.startsWith('-')) continue
      // option筛选`options.find`，供共享工具后续处理使用。
      const option = spec.options.find(opt =>
        Array.isArray(opt.name) ? opt.name.includes(arg) : opt.name === arg,
      )
      // 共享工具在这里按实际状态进入对应分支。
      if (
        option?.args &&
        // 调用 toArray，触发共享工具此处需要的副作用。
        toArray(option.args).some(arg => arg?.isCommand || arg?.isModule)
      )
        // 返回 `3`，作为共享工具这次计算的结果。
        return 3
    }
  }

  // Find subcommand spec using the already-found firstSubcommand
  // 只有 `firstSubcommand && spec.subcommands?.length` 满足时，共享工具才执行该分支。
  if (firstSubcommand && spec.subcommands?.length) {
    // firstSubLower保存`firstSubcommand.toLowerCase`，供共享工具后续处理使用。
    const firstSubLower = firstSubcommand.toLowerCase()
    // subcommand 命令数据筛选`subcommands.find`，供共享工具后续处理使用。
    const subcommand = spec.subcommands.find(sub =>
      Array.isArray(sub.name)
        // 这个回调绑定到 ? sub.name.some(n => n.toLowerCase() === firstSubLower)，负责共享工具在该局部场景下的响应。
        ? sub.name.some(n => n.toLowerCase() === firstSubLower)
        : sub.name.toLowerCase() === firstSubLower,
    )
    // 满足 `subcommand` 时，共享工具执行该分支。
    if (subcommand) {
      // 满足 `subcommand.args` 时，共享工具执行该分支。
      if (subcommand.args) {
        // subArgs 集合保存`toArray`，供共享工具后续处理使用。
        const subArgs = toArray(subcommand.args)
        // 满足 `subArgs.some(arg => arg?.isCommand)` 时，共享工具执行该分支。
        if (subArgs.some(arg => arg?.isCommand)) return 3
        // 满足 `subArgs.some(arg => arg?.isVariadic)` 时，共享工具执行该分支。
        if (subArgs.some(arg => arg?.isVariadic)) return 2
      }
      // 满足 `subcommand.subcommands?.length` 时，共享工具执行该分支。
      if (subcommand.subcommands?.length) return 4
      // Leaf subcommand with NO args declared (git show, git log, git tag):
      // the 3rd word is transient (SHA, ref, tag name) → dead over-specific
      // rule like PowerShell(git show 81210f8:*). NOT the isOptional case —
      // `git fetch` declares optional remote/branch and `git fetch origin`
      // is tested (bash/prefix.test.ts:912) as intentional remote scoping.
      // subcommand.args 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!subcommand.args) return 2
      // 返回 `3`，作为共享工具这次计算的结果。
      return 3
    }
  }

  // 满足 `spec.args` 时，共享工具执行该分支。
  if (spec.args) {
    // argsArray保存`toArray`，供共享工具后续处理使用。
    const argsArray = toArray(spec.args)

    // 满足 `argsArray.some(arg => arg?.isCommand)` 时，共享工具执行该分支。
    if (argsArray.some(arg => arg?.isCommand)) {
      // 返回 `!Array.isArray(spec.args) && spec.args.isCommand`，作为共享工具这次计算的结果。
      return !Array.isArray(spec.args) && spec.args.isCommand
        ? 2
        // 这个回调绑定到 : Math.min(2 + argsArray.findIndex(arg => arg?.isCommand), 3)，负责共享工具在该局部场景下的响应。
        : Math.min(2 + argsArray.findIndex(arg => arg?.isCommand), 3)
    }

    // 满足 `!spec.subcommands?.length` 时，共享工具执行该分支。
    if (!spec.subcommands?.length) {
      // 满足 `argsArray.some(arg => arg?.isVariadic)` 时，共享工具执行该分支。
      if (argsArray.some(arg => arg?.isVariadic)) return 1
      // 只有 `argsArray[0] && !argsArray[0].isOptional` 满足时，共享工具才执行该分支。
      if (argsArray[0] && !argsArray[0].isOptional) return 2
    }
  }

  // 返回 `spec.args && toArray(spec.args).some(arg => arg?.isDangerous) ? 3 : 2`，作为共享工具这次计算的结果。
  return spec.args && toArray(spec.args).some(arg => arg?.isDangerous) ? 3 : 2
}

// shouldStopAtArg 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function shouldStopAtArg(
  arg: string,
  args: string[],
  spec: CommandSpec | null,
): Promise<boolean> {
  // 满足 `arg.startsWith('-')` 时，共享工具执行该分支。
  if (arg.startsWith('-')) return true

  // dotIndex 索引保存`arg.lastIndexOf`，供共享工具后续处理使用。
  const dotIndex = arg.lastIndexOf('.')
  // hasExtension 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasExtension =
    dotIndex > 0 &&
    dotIndex < arg.length - 1 &&
    !arg.substring(dotIndex + 1).includes(':')

  // hasFile 文件数据记录 `arg.includes` 是否成立，共享工具随后按该结果分支。
  const hasFile = arg.includes('/') || hasExtension
  // hasUrl记录 `URL_PROTOCOLS.some` 是否成立，共享工具随后按该结果分支。
  const hasUrl = URL_PROTOCOLS.some(proto => arg.startsWith(proto))

  // 只有 `!hasFile && !hasUrl` 满足时，共享工具才执行该分支。
  if (!hasFile && !hasUrl) return false

  // Check if we're after a -m flag for python modules
  // 只有 `spec?.options && args.length > 0 && args[args.len` 满足时，共享工具才执行该分支。
  if (spec?.options && args.length > 0 && args[args.length - 1] === '-m') {
    // option筛选`options.find`，供共享工具后续处理使用。
    const option = spec.options.find(opt =>
      Array.isArray(opt.name) ? opt.name.includes('-m') : opt.name === '-m',
    )
    // 只有 `option?.args && toArray(option.args).some(arg => arg?.isModule)` 满足时，共享工具才执行该分支。
    if (option?.args && toArray(option.args).some(arg => arg?.isModule)) {
      // 返回 `false // Don't stop at module names`，作为共享工具这次计算的结果。
      return false // Don't stop at module names
    }
  }

  // For actual files/URLs, always stop regardless of context
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
