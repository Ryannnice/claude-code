// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 整理这一组导入，让context后续逻辑可以直接复用这些外部能力。
import {
  getAdditionalDirectoriesForClaudeMd,
  setCachedClaudeMdContent,
} from './bootstrap/state.js'
// 引入 getLocalISODate，将 ./constants/common.js 中已经封装好的能力接到本文件流程里。
import { getLocalISODate } from './constants/common.js'
// 整理这一组导入，让context后续逻辑可以直接复用这些外部能力。
import {
  filterInjectedMemoryFiles,
  getClaudeMds,
  getMemoryFiles,
} from './utils/claudemd.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ./utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from './utils/diagLogs.js'
// 复用 isBareMode、isEnvTruthy 工具函数，把通用处理留在 ./utils/envUtils.js 中维护。
import { isBareMode, isEnvTruthy } from './utils/envUtils.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ./utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from './utils/execFileNoThrow.js'
// 复用 getBranch、getDefaultBranch、getIsGit、gitExe 工具函数，把通用处理留在 ./utils/git.js 中维护。
import { getBranch, getDefaultBranch, getIsGit, gitExe } from './utils/git.js'
// 复用 shouldIncludeGitInstructions 工具函数，把通用处理留在 ./utils/gitSettings.js 中维护。
import { shouldIncludeGitInstructions } from './utils/gitSettings.js'
// 复用 logError 工具函数，把通用处理留在 ./utils/log.js 中维护。
import { logError } from './utils/log.js'

// MAX_STATUS_CHARS 集合保存`2000`，供后续判断或组装使用。
const MAX_STATUS_CHARS = 2000

// System prompt injection for cache breaking (ant-only, ephemeral debugging state)
// systemPromptInjection初始化为空值，后续分支会在有数据时补齐。
let systemPromptInjection: string | null = null

// getSystemPromptInjection 封装context的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSystemPromptInjection(): string | null {
  // 返回 `systemPromptInjection`，作为context这次计算的结果。
  return systemPromptInjection
}

// setSystemPromptInjection 封装context的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSystemPromptInjection(value: string | null): void {
  // systemPromptInjection更新为 `value`，确保context后续读取最新状态。
  systemPromptInjection = value
  // Clear context caches immediately when injection changes
  // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
  getUserContext.cache.clear?.()
  // 调用 getSystemContext.cache.clear?.()，完成这一处局部操作。
  getSystemContext.cache.clear?.()
}

// getGitStatus 集合保存`memoize`，供context后续处理使用。
export const getGitStatus = memoize(async (): Promise<string | null> => {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，context执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // Avoid cycles in tests
    // 返回 `null`，作为context这次计算的结果。
    return null
  }

  // startTime记录时间`Date.now`，供context后续处理使用。
  const startTime = Date.now()
  // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
  logForDiagnosticsNoPII('info', 'git_status_started')

  // isGitStart记录 `Date.now` 是否成立，context随后按该结果分支。
  const isGitStart = Date.now()
  // isGit记录 `getIsGit` 是否成立，context随后按该结果分支。
  const isGit = await getIsGit()
  // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
  logForDiagnosticsNoPII('info', 'git_is_git_check_completed', {
    duration_ms: Date.now() - isGitStart,
    is_git: isGit,
  })

  // isGit缺失时提前走兜底路径，避免context继续依赖无效输入。
  if (!isGit) {
    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'git_status_skipped_not_git', {
      duration_ms: Date.now() - startTime,
    })
    // 返回 `null`，作为context这次计算的结果。
    return null
  }

  // 保护这一段可能失败的context操作，确保异常能进入相邻错误处理。
  try {
    // gitCmdsStart 命令数据记录时间`Date.now`，供context后续处理使用。
    const gitCmdsStart = Date.now()
    // 并行获取 branch、mainBranch、status、log，缩短context等待多个独立异步任务的时间。
    const [branch, mainBranch, status, log, userName] = await Promise.all([
      getBranch(),
      getDefaultBranch(),
      execFileNoThrow(gitExe(), ['--no-optional-locks', 'status', '--short'], {
        preserveOutputOnError: false,
      // 这个回调绑定到 }).then(({ stdout }) => stdout.trim()),，负责context在该局部场景下的响应。
      }).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(
        gitExe(),
        ['--no-optional-locks', 'log', '--oneline', '-n', '5'],
        {
          preserveOutputOnError: false,
        },
      // 这个回调绑定到 ).then(({ stdout }) => stdout.trim()),，负责context在该局部场景下的响应。
      ).then(({ stdout }) => stdout.trim()),
      execFileNoThrow(gitExe(), ['config', 'user.name'], {
        preserveOutputOnError: false,
      // 这个回调绑定到 }).then(({ stdout }) => stdout.trim()),，负责context在该局部场景下的响应。
      }).then(({ stdout }) => stdout.trim()),
    ])

    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'git_commands_completed', {
      duration_ms: Date.now() - gitCmdsStart,
      status_length: status.length,
    })

    // Check if status exceeds character limit
    // truncatedStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const truncatedStatus =
      status.length > MAX_STATUS_CHARS
        ? status.substring(0, MAX_STATUS_CHARS) +
          '\n... (truncated because it exceeds 2k characters. If you need more information, run "git status" using BashTool)'
        : status

    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'git_status_completed', {
      duration_ms: Date.now() - startTime,
      truncated: status.length > MAX_STATUS_CHARS,
    })

    // 返回列表结果，保留context已经排好的条目顺序。
    return [
      `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.`,
      `Current branch: ${branch}`,
      `Main branch (you will usually use this for PRs): ${mainBranch}`,
      ...(userName ? [`Git user: ${userName}`] : []),
      `Status:\n${truncatedStatus || '(clean)'}`,
      `Recent commits:\n${log}`,
    ].join('\n\n')
  } catch (error) {
    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('error', 'git_status_failed', {
      duration_ms: Date.now() - startTime,
    })
    // 记录context运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为context这次计算的结果。
    return null
  }
})

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
// getSystemContext保存`memoize`，供context后续处理使用。
export const getSystemContext = memoize(
  // 这个异步回调接收 无，串起context的等待、调用和返回。
  async (): Promise<{
    [k: string]: string
  }> => {
    // startTime记录时间`Date.now`，供context后续处理使用。
    const startTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'system_context_started')

    // Skip git status in CCR (unnecessary overhead on resume) or when git instructions are disabled
    // gitStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const gitStatus =
      isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ||
      !shouldIncludeGitInstructions()
        ? null
        : await getGitStatus()

    // Include system prompt injection if set (for cache breaking, ant-only)
    // injection保存`feature`，供context后续处理使用。
    const injection = feature('BREAK_CACHE_COMMAND')
      ? getSystemPromptInjection()
      : null

    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'system_context_completed', {
      duration_ms: Date.now() - startTime,
      has_git_status: gitStatus !== null,
      has_injection: injection !== null,
    })

    // 返回结构化结果，集中表达context已经整理出的状态。
    return {
      ...(gitStatus && { gitStatus }),
      ...(feature('BREAK_CACHE_COMMAND') && injection
        ? {
            cacheBreaker: `[CACHE_BREAKER: ${injection}]`,
          }
        : {}),
    }
  },
)

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
// getUserContext保存`memoize`，供context后续处理使用。
export const getUserContext = memoize(
  // 这个异步回调接收 无，串起context的等待、调用和返回。
  async (): Promise<{
    [k: string]: string
  }> => {
    // startTime记录时间`Date.now`，供context后续处理使用。
    const startTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'user_context_started')

    // CLAUDE_CODE_DISABLE_CLAUDE_MDS: hard off, always.
    // --bare: skip auto-discovery (cwd walk), BUT honor explicit --add-dir.
    // --bare means "skip what I didn't ask for", not "ignore what I asked for".
    // shouldDisableClaudeMd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const shouldDisableClaudeMd =
      isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS) ||
      (isBareMode() && getAdditionalDirectoriesForClaudeMd().length === 0)
    // Await the async I/O (readFile/readdir directory walk) so the event
    // loop yields naturally at the first fs.readFile.
    // claudeMd保存`shouldDisableClaudeMd`，供后续判断或组装使用。
    const claudeMd = shouldDisableClaudeMd
      ? null
      : getClaudeMds(filterInjectedMemoryFiles(await getMemoryFiles()))
    // Cache for the auto-mode classifier (yoloClassifier.ts reads this
    // instead of importing claudemd.ts directly, which would create a
    // cycle through permissions/filesystem → permissions → yoloClassifier).
    // setCachedClaudeMdContent 写入新的状态值，使context后续读取保持一致。
    setCachedClaudeMdContent(claudeMd || null)

    // 调用 logForDiagnosticsNoPII，触发context此处需要的副作用。
    logForDiagnosticsNoPII('info', 'user_context_completed', {
      duration_ms: Date.now() - startTime,
      claudemd_length: claudeMd?.length ?? 0,
      claudemd_disabled: Boolean(shouldDisableClaudeMd),
    })

    // 返回结构化结果，集中表达context已经整理出的状态。
    return {
      ...(claudeMd && { claudeMd }),
      currentDate: `Today's date is ${getLocalISODate()}.`,
    }
  },
)
