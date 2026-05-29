// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { sep } from 'path'
// 引入 getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../bootstrap/state.js'
// 类型依赖 { LogOption } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { LogOption } from '../types/logs.js'
// 引入 quote，将 ./bash/shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from './bash/shellQuote.js'
// 引入 getSessionIdFromLog，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getSessionIdFromLog } from './sessionStorage.js'

// CrossProjectResumeResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CrossProjectResumeResult =
  | {
      isCrossProject: false
    }
  | {
      isCrossProject: true
      isSameRepoWorktree: true
      projectPath: string
    }
  | {
      isCrossProject: true
      isSameRepoWorktree: false
      command: string
      projectPath: string
    }

/**
 * Check if a log is from a different project directory and determine
 * whether it's a related worktree or a completely different project.
 *
 * For same-repo worktrees, we can resume directly without requiring cd.
 * For different projects, we generate the cd command.
 */
// checkCrossProjectResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkCrossProjectResume(
  log: LogOption,
  showAllProjects: boolean,
  worktreePaths: string[],
): CrossProjectResumeResult {
  // currentCwd读取`getOriginalCwd`，供共享工具后续处理使用。
  const currentCwd = getOriginalCwd()

  // 只有 `!showAllProjects || !log.projectPath || log.proje` 满足时，共享工具才执行该分支。
  if (!showAllProjects || !log.projectPath || log.projectPath === currentCwd) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { isCrossProject: false }
  }

  // Gate worktree detection to ants only for staged rollout
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // sessionId 会话数据读取`getSessionIdFromLog`，供共享工具后续处理使用。
    const sessionId = getSessionIdFromLog(log)
    // 命令保存`quote`，供共享工具后续处理使用。
    const command = `cd ${quote([log.projectPath])} && claude --resume ${sessionId}`
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCrossProject: true,
      isSameRepoWorktree: false,
      command,
      projectPath: log.projectPath,
    }
  }

  // Check if log.projectPath is under a worktree of the same repo
  // isSameRepo记录 `worktreePaths.some` 是否成立，共享工具随后按该结果分支。
  const isSameRepo = worktreePaths.some(
    // wt更新为 `> log.projectPath === wt || log.projectPath!.startsWith(w...`，确保共享工具后续读取最新状态。
    wt => log.projectPath === wt || log.projectPath!.startsWith(wt + sep),
  )

  // 满足 `isSameRepo` 时，共享工具执行该分支。
  if (isSameRepo) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCrossProject: true,
      isSameRepoWorktree: true,
      projectPath: log.projectPath,
    }
  }

  // Different repo - generate cd command
  // sessionId 会话数据读取`getSessionIdFromLog`，供共享工具后续处理使用。
  const sessionId = getSessionIdFromLog(log)
  // 命令保存`quote`，供共享工具后续处理使用。
  const command = `cd ${quote([log.projectPath])} && claude --resume ${sessionId}`
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    isCrossProject: true,
    isSameRepoWorktree: false,
    command,
    projectPath: log.projectPath,
  }
}
