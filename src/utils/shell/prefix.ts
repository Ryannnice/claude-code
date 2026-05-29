/**
 * Shared command prefix extraction using Haiku LLM
 *
 * This module provides a factory for creating command prefix extractors
 * that can be used by different shell tools. The core logic
 * (Haiku query, response validation) is shared, while tool-specific
 * aspects (examples, pre-checks) are configurable.
 */

// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 queryHaiku 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryHaiku } from '../../services/api/claude.js'
// 接入 startsWithApiErrorPrefix 服务层能力，把外部通信或共享状态交给 ../../services/api/errors.js 处理。
import { startsWithApiErrorPrefix } from '../../services/api/errors.js'
// 引入 memoizeWithLRU，将 ../memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from '../memoize.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'

/**
 * Shell executables that must never be accepted as bare prefixes.
 * Allowing e.g. "bash:*" would let any command through, defeating
 * the permission system. Includes Unix shells and Windows equivalents.
 */
// DANGEROUS_SHELL_PREFIXES 集合保存`Set`，供共享工具后续处理使用。
const DANGEROUS_SHELL_PREFIXES = new Set([
  'sh',
  'bash',
  'zsh',
  'fish',
  'csh',
  'tcsh',
  'ksh',
  'dash',
  'cmd',
  'cmd.exe',
  'powershell',
  'powershell.exe',
  'pwsh',
  'pwsh.exe',
  'bash.exe',
])

/**
 * Result of command prefix extraction
 */
// CommandPrefixResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandPrefixResult = {
  /** The detected command prefix, or null if no prefix could be determined */
  commandPrefix: string | null
}

/**
 * Result including subcommand prefixes for compound commands
 */
// CommandSubcommandPrefixResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandSubcommandPrefixResult = CommandPrefixResult & {
  subcommandPrefixes: Map<string, CommandPrefixResult>
}

/**
 * Configuration for creating a command prefix extractor
 */
// PrefixExtractorConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PrefixExtractorConfig = {
  /** Tool name for logging and warning messages */
  toolName: string

  /** The policy spec containing examples for Haiku */
  policySpec: string
  /** Analytics event name for logging */
  eventName: string

  /** Query source identifier for the API call */
  querySource: QuerySource

  /** Optional pre-check function that can short-circuit the Haiku call */
  // 这个回调绑定到 preCheck?: (command: string) => CommandPrefixResult | null，负责共享工具在该局部场景下的响应。
  preCheck?: (command: string) => CommandPrefixResult | null
}

/**
 * Creates a memoized command prefix extractor function.
 *
 * Uses two-layer memoization: the outer memoized function creates the promise
 * and attaches a .catch handler that evicts the cache entry on rejection.
 * This prevents aborted or failed Haiku calls from poisoning future lookups.
 *
 * Bounded to 200 entries via LRU to prevent unbounded growth in heavy sessions.
 *
 * @param config - Configuration for the extractor
 * @returns A memoized async function that extracts command prefixes
 */
// createCommandPrefixExtractor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCommandPrefixExtractor(config: PrefixExtractorConfig) {
  // 从 `config` 解构 toolName、policySpec、eventName、querySource，减少共享工具 prefix对同一对象的重复访问。
  const { toolName, policySpec, eventName, querySource, preCheck } = config

  // memoized保存`memoizeWithLRU`，供共享工具后续处理使用。
  const memoized = memoizeWithLRU(
    (
      command: string,
      abortSignal: AbortSignal,
      isNonInteractiveSession: boolean,
    ): Promise<CommandPrefixResult | null> => {
      // promise 异步任务读取`getCommandPrefixImpl`，供共享工具后续处理使用。
      const promise = getCommandPrefixImpl(
        command,
        abortSignal,
        isNonInteractiveSession,
        toolName,
        policySpec,
        eventName,
        querySource,
        preCheck,
      )
      // Evict on rejection so aborted calls don't poison future turns.
      // Identity guard: after LRU eviction, a newer promise may occupy
      // this key; a stale rejection must not delete it.
      // 调用 promise.catch，触发共享工具此处需要的副作用。
      promise.catch(() => {
        // 满足 `memoized.cache.get(command) === promise` 时，共享工具执行该分支。
        if (memoized.cache.get(command) === promise) {
          // 调用 memoized.cache.delete，触发共享工具此处需要的副作用。
          memoized.cache.delete(command)
        }
      })
      // 返回 `promise`，作为共享工具这次计算的结果。
      return promise
    },
    // 命令更新为 `> command, // memoize by command only`，确保共享工具后续读取最新状态。
    command => command, // memoize by command only
    200,
  )

  // 返回 `memoized`，作为共享工具这次计算的结果。
  return memoized
}

/**
 * Creates a memoized function to get prefixes for compound commands with subcommands.
 *
 * Uses the same two-layer memoization pattern as createCommandPrefixExtractor:
 * a .catch handler evicts the cache entry on rejection to prevent poisoning.
 *
 * @param getPrefix - The single-command prefix extractor (from createCommandPrefixExtractor)
 * @param splitCommand - Function to split a compound command into subcommands
 * @returns A memoized async function that extracts prefixes for the main command and all subcommands
 */
// createSubcommandPrefixExtractor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSubcommandPrefixExtractor(
  getPrefix: ReturnType<typeof createCommandPrefixExtractor>,
  // 这个回调绑定到 splitCommand: (command: string) => string[] | Promise<string[]>,，负责共享工具在该局部场景下的响应。
  splitCommand: (command: string) => string[] | Promise<string[]>,
) {
  // memoized保存`memoizeWithLRU`，供共享工具后续处理使用。
  const memoized = memoizeWithLRU(
    (
      command: string,
      abortSignal: AbortSignal,
      isNonInteractiveSession: boolean,
    ): Promise<CommandSubcommandPrefixResult | null> => {
      // promise 异步任务读取`getCommandSubcommandPrefixImpl`，供共享工具后续处理使用。
      const promise = getCommandSubcommandPrefixImpl(
        command,
        abortSignal,
        isNonInteractiveSession,
        getPrefix,
        splitCommand,
      )
      // Evict on rejection so aborted calls don't poison future turns.
      // Identity guard: after LRU eviction, a newer promise may occupy
      // this key; a stale rejection must not delete it.
      // 调用 promise.catch，触发共享工具此处需要的副作用。
      promise.catch(() => {
        // 满足 `memoized.cache.get(command) === promise` 时，共享工具执行该分支。
        if (memoized.cache.get(command) === promise) {
          // 调用 memoized.cache.delete，触发共享工具此处需要的副作用。
          memoized.cache.delete(command)
        }
      })
      // 返回 `promise`，作为共享工具这次计算的结果。
      return promise
    },
    // 命令更新为 `> command, // memoize by command only`，确保共享工具后续读取最新状态。
    command => command, // memoize by command only
    200,
  )

  // 返回 `memoized`，作为共享工具这次计算的结果。
  return memoized
}

// getCommandPrefixImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCommandPrefixImpl(
  command: string,
  abortSignal: AbortSignal,
  isNonInteractiveSession: boolean,
  toolName: string,
  policySpec: string,
  eventName: string,
  querySource: QuerySource,
  // 这个回调绑定到 preCheck?: (command: string) => CommandPrefixResult | null,，负责共享工具在该局部场景下的响应。
  preCheck?: (command: string) => CommandPrefixResult | null,
): Promise<CommandPrefixResult | null> {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Run pre-check if provided (e.g., isHelpCommand for Bash)
  // 满足 `preCheck` 时，共享工具执行该分支。
  if (preCheck) {
    // preCheckResult保存`preCheck`，供共享工具后续处理使用。
    const preCheckResult = preCheck(command)
    // `preCheckResult` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (preCheckResult !== null) {
      // 返回 `preCheckResult`，作为共享工具这次计算的结果。
      return preCheckResult
    }
  }

  // preflightCheckTimeoutId 先占位，稍后的条件分支会根据实际输入补齐它。
  let preflightCheckTimeoutId: NodeJS.Timeout | undefined
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 结果初始化为空值，后续分支会在有数据时补齐。
  let result: CommandPrefixResult | null = null

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Log a warning if the pre-flight check takes too long
    // preflightCheckTimeoutId更新为 `setTimeout(`，确保共享工具后续读取最新状态。
    preflightCheckTimeoutId = setTimeout(
      // 这个回调绑定到 (tn, nonInteractive) => {，负责共享工具在该局部场景下的响应。
      (tn, nonInteractive) => {
        // 消息固定为 ``[${tn}Tool] Pre-flight check is taking longer than expec...`，作为共享工具 prefix后续展示或比较的基准。
        const message = `[${tn}Tool] Pre-flight check is taking longer than expected. Run with ANTHROPIC_LOG=debug to check for failed or slow API requests.`
        // 满足 `nonInteractive` 时，共享工具执行该分支。
        if (nonInteractive) {
          // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
          process.stderr.write(jsonStringify({ level: 'warn', message }) + '\n')
        } else {
          // biome-ignore lint/suspicious/noConsole: intentional warning
          // 调用 console.warn，触发共享工具此处需要的副作用。
          console.warn(chalk.yellow(`⚠️  ${message}`))
        }
      },
      10000, // 10 seconds
      toolName,
      isNonInteractiveSession,
    )

    // useSystemPromptPolicySpec读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
    const useSystemPromptPolicySpec = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_cork_m4q',
      false,
    )

    // 接口响应保存`queryHaiku`，供共享工具后续处理使用。
    const response = await queryHaiku({
      systemPrompt: asSystemPrompt(
        useSystemPromptPolicySpec
          ? [
              `Your task is to process ${toolName} commands that an AI coding agent wants to run.\n\n${policySpec}`,
            ]
          : [
              `Your task is to process ${toolName} commands that an AI coding agent wants to run.\n\nThis policy spec defines how to determine the prefix of a ${toolName} command:`,
            ],
      ),
      userPrompt: useSystemPromptPolicySpec
        ? `Command: ${command}`
        : `${policySpec}\n\nCommand: ${command}`,
      signal: abortSignal,
      options: {
        enablePromptCaching: useSystemPromptPolicySpec,
        querySource,
        agents: [],
        isNonInteractiveSession,
        hasAppendSystemPrompt: false,
        mcpTools: [],
      },
    })

    // Clear the timeout since the query completed
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(preflightCheckTimeoutId)
    // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const durationMs = Date.now() - startTime

    // prefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const prefix =
      typeof response.message.content === 'string'
        ? response.message.content
        : Array.isArray(response.message.content)
          // 这个回调绑定到 ? (response.message.content.find(_ => _.type === 'text')?.text ??，负责共享工具在该局部场景下的响应。
          ? (response.message.content.find(_ => _.type === 'text')?.text ??
            'none')
          : 'none'

    // 满足 `startsWithApiErrorPrefix(prefix)` 时，共享工具执行该分支。
    if (startsWithApiErrorPrefix(prefix)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        success: false,
        error:
          'API error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        durationMs,
      })
      // 结果更新为 `null`，确保共享工具后续读取最新状态。
      result = null
    // 共享工具 prefix在这里处理 `} else if (prefix === 'command_injection_detected') {`，完成这一小步状态转换。
    } else if (prefix === 'command_injection_detected') {
      // Haiku detected something suspicious - treat as no prefix available
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        success: false,
        error:
          'command_injection_detected' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        durationMs,
      })
      // 结果更新为 `{`，确保共享工具后续读取最新状态。
      result = {
        commandPrefix: null,
      }
    // 共享工具 prefix在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      prefix === 'git' ||
      DANGEROUS_SHELL_PREFIXES.has(prefix.toLowerCase())
    ) {
      // Never accept bare `git` or shell executables as a prefix
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        success: false,
        error:
          'dangerous_shell_prefix' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        durationMs,
      })
      // 结果更新为 `{`，确保共享工具后续读取最新状态。
      result = {
        commandPrefix: null,
      }
    // 共享工具 prefix在这里处理 `} else if (prefix === 'none') {`，完成这一小步状态转换。
    } else if (prefix === 'none') {
      // No prefix detected
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        success: false,
        error:
          'prefix "none"' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        durationMs,
      })
      // 结果更新为 `{`，确保共享工具后续读取最新状态。
      result = {
        commandPrefix: null,
      }
    } else {
      // Validate that the prefix is actually a prefix of the command

      // 满足 `!command.startsWith(prefix)` 时，共享工具执行该分支。
      if (!command.startsWith(prefix)) {
        // Prefix isn't actually a prefix of the command
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent(eventName, {
          success: false,
          error:
            'command did not start with prefix' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          durationMs,
        })
        // 结果更新为 `{`，确保共享工具后续读取最新状态。
        result = {
          commandPrefix: null,
        }
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent(eventName, {
          success: true,
          durationMs,
        })
        // 结果更新为 `{`，确保共享工具后续读取最新状态。
        result = {
          commandPrefix: prefix,
        }
      }
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(preflightCheckTimeoutId)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// getCommandSubcommandPrefixImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCommandSubcommandPrefixImpl(
  command: string,
  abortSignal: AbortSignal,
  isNonInteractiveSession: boolean,
  getPrefix: ReturnType<typeof createCommandPrefixExtractor>,
  // 这个回调绑定到 splitCommandFn: (command: string) => string[] | Promise<string[]>,，负责共享工具在该局部场景下的响应。
  splitCommandFn: (command: string) => string[] | Promise<string[]>,
): Promise<CommandSubcommandPrefixResult | null> {
  // subcommands 命令数据格式化`splitCommandFn`，供共享工具后续处理使用。
  const subcommands = await splitCommandFn(command)

  // 并行获取 fullCommandPrefix、其余 subcommandPrefixesResults，缩短共享工具 prefix等待多个独立异步任务的时间。
  const [fullCommandPrefix, ...subcommandPrefixesResults] = await Promise.all([
    getPrefix(command, abortSignal, isNonInteractiveSession),
    // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
    ...subcommands.map(async subcommand => ({
      subcommand,
      prefix: await getPrefix(subcommand, abortSignal, isNonInteractiveSession),
    })),
  ])

  // fullCommandPrefix 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!fullCommandPrefix) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // subcommandPrefixes 命令数据派生`subcommandPrefixesResults.reduce`，供共享工具后续处理使用。
  const subcommandPrefixes = subcommandPrefixesResults.reduce(
    // 这个回调绑定到 (acc, { subcommand, prefix }) => {，负责共享工具在该局部场景下的响应。
    (acc, { subcommand, prefix }) => {
      // 满足 `prefix` 时，共享工具执行该分支。
      if (prefix) {
        // acc.set 写入新的状态值，使共享工具后续读取保持一致。
        acc.set(subcommand, prefix)
      }
      // 返回 `acc`，作为共享工具这次计算的结果。
      return acc
    },
    new Map<string, CommandPrefixResult>(),
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...fullCommandPrefix,
    subcommandPrefixes,
  }
}
