// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 复用 splitCommand_DEPRECATED 工具函数，把通用处理留在 ../../utils/bash/commands.js 中维护。
import { splitCommand_DEPRECATED } from '../../utils/bash/commands.js'
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../../utils/settings/settings.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  BINARY_HIJACK_VARS,
  bashPermissionRule,
  matchWildcardPattern,
  stripAllLeadingEnvVars,
  stripSafeWrappers,
} from './bashPermissions.js'

// SandboxInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SandboxInput = {
  command?: string
  dangerouslyDisableSandbox?: boolean
}

// NOTE: excludedCommands is a user-facing convenience feature, not a security boundary.
// It is not a security bug to be able to bypass excludedCommands — the sandbox permission
// system (which prompts users) is the actual security control.
// containsExcludedCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsExcludedCommand(command: string): boolean {
  // Check dynamic config for disabled commands and substrings (only for ants)
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // disabledCommands 命令数据 命名 `getFeatureValue_CACHED_MAY_BE_STALE<{`，让后续代码直接表达这个值的用途。
    const disabledCommands = getFeatureValue_CACHED_MAY_BE_STALE<{
      commands: string[]
      substrings: string[]
    }>('tengu_sandbox_disabled_commands', { commands: [], substrings: [] })

    // Check if command contains any disabled substrings
    // 按顺序遍历 `disabledCommands.substrings` 中的substring，逐个交给工具调用处理。
    for (const substring of disabledCommands.substrings) {
      // 满足 `command.includes(substring)` 时，工具调用执行该分支。
      if (command.includes(substring)) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }

    // Check if command starts with any disabled commands
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // commandParts 命令数据格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
      const commandParts = splitCommand_DEPRECATED(command)
      // 按顺序遍历 `commandParts` 中的part，逐个交给工具调用处理。
      for (const part of commandParts) {
        // baseCommand 命令数据格式化`part.trim`，供工具调用后续处理使用。
        const baseCommand = part.trim().split(' ')[0]
        // 只有 `baseCommand && disabledCommands.commands.includes(baseCommand)` 满足时，工具调用才执行该分支。
        if (baseCommand && disabledCommands.commands.includes(baseCommand)) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
    } catch {
      // If we can't parse the command (e.g., malformed bash syntax),
      // treat it as not excluded to allow other validation checks to handle it
      // This prevents crashes when rendering tool use messages
    }
  }

  // Check user-configured excluded commands from settings
  // settings 集合读取`getSettings_DEPRECATED`，供工具调用后续处理使用。
  const settings = getSettings_DEPRECATED()
  // userExcludedCommands 命令数据保存`settings.sandbox?.excludedCommands ?? []`，供Bash 工具 should Use Sandbox后续判断或输出使用。
  const userExcludedCommands = settings.sandbox?.excludedCommands ?? []

  // userExcludedCommands 命令数据为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (userExcludedCommands.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Split compound commands (e.g. "docker ps && curl evil.com") into individual
  // subcommands and check each one against excluded patterns. This prevents a
  // compound command from escaping the sandbox just because its first subcommand
  // matches an excluded pattern.
  // subcommands 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let subcommands: string[]
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // subcommands 命令数据更新为 `splitCommand_DEPRECATED(command)`，确保Bash 工具后续读取最新状态。
    subcommands = splitCommand_DEPRECATED(command)
  } catch {
    // subcommands 命令数据更新为 `[command]`，确保Bash 工具后续读取最新状态。
    subcommands = [command]
  }

  // 按顺序遍历 `subcommands` 中的subcommand 命令数据，逐个交给工具调用处理。
  for (const subcommand of subcommands) {
    // trimmed格式化`subcommand.trim`，供工具调用后续处理使用。
    const trimmed = subcommand.trim()
    // Also try matching with env var prefixes and wrapper commands stripped, so
    // that `FOO=bar bazel ...` and `timeout 30 bazel ...` match `bazel:*`. Not a
    // security boundary (see NOTE at top); the &&-split above already lets
    // `export FOO=bar && bazel ...` match. BINARY_HIJACK_VARS kept as a heuristic.
    //
    // We iteratively apply both stripping operations until no new candidates are
    // produced (fixed-point), matching the approach in filterRulesByContentsMatchingInput.
    // This handles interleaved patterns like `timeout 300 FOO=bar bazel run`
    // where single-pass composition would fail.
    // candidates 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const candidates = [trimmed]
    // seen保存`Set`，供工具调用后续处理使用。
    const seen = new Set(candidates)
    // startIdx保存`0`，供后续判断或组装使用。
    let startIdx = 0
    // while 使用 startIdx < candidates.length 完成工具调用里的对应操作。
    while (startIdx < candidates.length) {
      // endIdx 命名 `candidates.length`，让后续代码直接表达这个值的用途。
      const endIdx = candidates.length
      // 循环处理 `let i = startIdx; i < endIdx; i++`，让工具调用逐项把同类条目按顺序走完。
      for (let i = startIdx; i < endIdx; i++) {
        // cmd 命令数据 命名 `candidates[i]!`，让后续代码直接表达这个值的用途。
        const cmd = candidates[i]!
        // envStripped保存`stripAllLeadingEnvVars`，供工具调用后续处理使用。
        const envStripped = stripAllLeadingEnvVars(cmd, BINARY_HIJACK_VARS)
        // 满足 `!seen.has(envStripped)` 时，工具调用执行该分支。
        if (!seen.has(envStripped)) {
          // candidates 集合追加新条目，保持收集顺序与输入顺序一致。
          candidates.push(envStripped)
          // 调用 seen.add，触发工具调用此处需要的副作用。
          seen.add(envStripped)
        }
        // wrapperStripped保存`stripSafeWrappers`，供工具调用后续处理使用。
        const wrapperStripped = stripSafeWrappers(cmd)
        // 满足 `!seen.has(wrapperStripped)` 时，工具调用执行该分支。
        if (!seen.has(wrapperStripped)) {
          // candidates 集合追加新条目，保持收集顺序与输入顺序一致。
          candidates.push(wrapperStripped)
          // 调用 seen.add，触发工具调用此处需要的副作用。
          seen.add(wrapperStripped)
        }
      }
      // startIdx更新为 `endIdx`，确保Bash 工具后续读取最新状态。
      startIdx = endIdx
    }

    // 按顺序遍历 `userExcludedCommands` 中的pattern，逐个交给工具调用处理。
    for (const pattern of userExcludedCommands) {
      // rule保存`bashPermissionRule`，供工具调用后续处理使用。
      const rule = bashPermissionRule(pattern)
      // 按顺序遍历 `candidates` 中的cand，逐个交给工具调用处理。
      for (const cand of candidates) {
        // 按照 rule.type 的取值选择工具调用的具体处理分支。
        switch (rule.type) {
          case 'prefix':
            // 只有 `cand === rule.prefix || cand.startsWith(rule.prefix + ' ')` 满足时，工具调用才执行该分支。
            if (cand === rule.prefix || cand.startsWith(rule.prefix + ' ')) {
              // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
              return true
            }
            // 结束这个分支或循环，避免工具调用继续落入后续路径。
            break
          case 'exact':
            // 满足 `cand === rule.command` 时，工具调用执行该分支。
            if (cand === rule.command) {
              // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
              return true
            }
            // 结束这个分支或循环，避免工具调用继续落入后续路径。
            break
          case 'wildcard':
            // 满足 `matchWildcardPattern(rule.pattern, cand)` 时，工具调用执行该分支。
            if (matchWildcardPattern(rule.pattern, cand)) {
              // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
              return true
            }
            // 结束这个分支或循环，避免工具调用继续落入后续路径。
            break
        }
      }
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// shouldUseSandbox 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldUseSandbox(input: Partial<SandboxInput>): boolean {
  // 满足 `!SandboxManager.isSandboxingEnabled()` 时，工具调用执行该分支。
  if (!SandboxManager.isSandboxingEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Don't sandbox if explicitly overridden AND unsandboxed commands are allowed by policy
  // 工具调用在这里按实际状态进入对应分支。
  if (
    input.dangerouslyDisableSandbox &&
    SandboxManager.areUnsandboxedCommandsAllowed()
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // input.command 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!input.command) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Don't sandbox if the command contains user-configured excluded commands
  // 满足 `containsExcludedCommand(input.command)` 时，工具调用执行该分支。
  if (containsExcludedCommand(input.command)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
