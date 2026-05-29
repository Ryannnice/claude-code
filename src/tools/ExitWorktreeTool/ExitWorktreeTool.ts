// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getProjectRoot,
  setOriginalCwd,
  setProjectRoot,
} from '../../bootstrap/state.js'
// 引入 clearSystemPromptSections，将 ../../constants/systemPromptSections.js 中已经封装好的能力接到本文件流程里。
import { clearSystemPromptSections } from '../../constants/systemPromptSections.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 clearMemoryFileCaches 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { clearMemoryFileCaches } from '../../utils/claudemd.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
// 复用 updateHooksConfigSnapshot 工具函数，把通用处理留在 ../../utils/hooks/hooksConfigSnapshot.js 中维护。
import { updateHooksConfigSnapshot } from '../../utils/hooks/hooksConfigSnapshot.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 getPlansDirectory 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlansDirectory } from '../../utils/plans.js'
// 复用 setCwd 工具函数，把通用处理留在 ../../utils/Shell.js 中维护。
import { setCwd } from '../../utils/Shell.js'
// 复用 saveWorktreeState 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { saveWorktreeState } from '../../utils/sessionStorage.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  cleanupWorktree,
  getCurrentWorktreeSession,
  keepWorktree,
  killTmuxSession,
} from '../../utils/worktree.js'
// 引入 EXIT_WORKTREE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { EXIT_WORKTREE_TOOL_NAME } from './constants.js'
// 引入 getExitWorktreeToolPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getExitWorktreeToolPrompt } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum(['keep', 'remove'])
      .describe(
        '"keep" leaves the worktree and branch on disk; "remove" deletes both.',
      ),
    discard_changes: z
      .boolean()
      .optional()
      .describe(
        'Required true when action is "remove" and the worktree has uncommitted files or unmerged commits. The tool will refuse and list them otherwise.',
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    action: z.enum(['keep', 'remove']),
    originalCwd: z.string(),
    worktreePath: z.string(),
    worktreeBranch: z.string().optional(),
    tmuxSessionName: z.string().optional(),
    discardedFiles: z.number().optional(),
    discardedCommits: z.number().optional(),
    message: z.string(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// ChangeSummary 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type ChangeSummary = {
  changedFiles: number
  commits: number
}

/**
 * Returns null when state cannot be reliably determined — callers that use
 * this as a safety gate must treat null as "unknown, assume unsafe"
 * (fail-closed). A silent 0/0 would let cleanupWorktree destroy real work.
 *
 * Null is returned when:
 * - git status or rev-list exit non-zero (lock file, corrupt index, bad ref)
 * - originalHeadCommit is undefined but git status succeeded — this is the
 *   hook-based-worktree-wrapping-git case (worktree.ts:525-532 doesn't set
 *   originalHeadCommit). We can see the working tree is git, but cannot count
 *   commits without a baseline, so we cannot prove the branch is clean.
 */
// countWorktreeChanges 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countWorktreeChanges(
  worktreePath: string,
  originalHeadCommit: string | undefined,
): Promise<ChangeSummary | null> {
  // status 集合保存`execFileNoThrow`，供工具调用后续处理使用。
  const status = await execFileNoThrow('git', [
    '-C',
    worktreePath,
    'status',
    '--porcelain',
  ])
  // `status.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (status.code !== 0) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
  // changedFiles 文件数据统计`count`，供工具调用后续处理使用。
  const changedFiles = count(status.stdout.split('\n'), l => l.trim() !== '')

  // originalHeadCommit缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!originalHeadCommit) {
    // git status succeeded → this is a git repo, but without a baseline
    // commit we cannot count commits. Fail-closed rather than claim 0.
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // revList 集合保存`execFileNoThrow`，供工具调用后续处理使用。
  const revList = await execFileNoThrow('git', [
    '-C',
    worktreePath,
    'rev-list',
    '--count',
    `${originalHeadCommit}..HEAD`,
  ])
  // `revList.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (revList.code !== 0) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
  // commits 集合解析`parseInt`，供工具调用后续处理使用。
  const commits = parseInt(revList.stdout.trim(), 10) || 0

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { changedFiles, commits }
}

/**
 * Restore session state to reflect the original directory.
 * This is the inverse of the session-level mutations in EnterWorktreeTool.call().
 *
 * keepWorktree()/cleanupWorktree() handle process.chdir and currentWorktreeSession;
 * this handles everything above the worktree utility layer.
 */
// restoreSessionToOriginalCwd 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function restoreSessionToOriginalCwd(
  originalCwd: string,
  projectRootIsWorktree: boolean,
): void {
  // setCwd 写入新的状态值，使工具调用后续读取保持一致。
  setCwd(originalCwd)
  // EnterWorktree sets originalCwd to the *worktree* path (intentional — see
  // state.ts getProjectRoot comment). Reset to the real original.
  // setOriginalCwd 写入新的状态值，使工具调用后续读取保持一致。
  setOriginalCwd(originalCwd)
  // --worktree startup sets projectRoot to the worktree; mid-session
  // EnterWorktreeTool does not. Only restore when it was actually changed —
  // otherwise we'd move projectRoot to wherever the user had cd'd before
  // entering the worktree (session.originalCwd), breaking the "stable project
  // identity" contract.
  // 满足 `projectRootIsWorktree` 时，工具调用执行该分支。
  if (projectRootIsWorktree) {
    // setProjectRoot 写入新的状态值，使工具调用后续读取保持一致。
    setProjectRoot(originalCwd)
    // setup.ts's --worktree block called updateHooksConfigSnapshot() to re-read
    // hooks from the worktree. Restore symmetrically. (Mid-session
    // EnterWorktreeTool never touched the snapshot, so no-op there.)
    // 调用 updateHooksConfigSnapshot，触发工具调用此处需要的副作用。
    updateHooksConfigSnapshot()
  }
  // 调用 saveWorktreeState，触发工具调用此处需要的副作用。
  saveWorktreeState(null)
  // 调用 clearSystemPromptSections，触发工具调用此处需要的副作用。
  clearSystemPromptSections()
  // 清理相关缓存，确保工具调用下一次读取时重新加载最新数据。
  clearMemoryFileCaches()
  // 调用 getPlansDirectory.cache.clear?.()，完成这一处局部操作。
  getPlansDirectory.cache.clear?.()
}

// ExitWorktreeTool构建`buildTool({`，供后续判断或组装使用。
export const ExitWorktreeTool: Tool<InputSchema, Output> = buildTool({
  name: EXIT_WORKTREE_TOOL_NAME,
  searchHint: 'exit a worktree session and return to the original directory',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Exits a worktree session created by EnterWorktree and restores the ori...`，作为工具调用这次计算的结果。
    return 'Exits a worktree session created by EnterWorktree and restores the original working directory'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getExitWorktreeToolPrompt()`，作为工具调用这次计算的结果。
    return getExitWorktreeToolPrompt()
  },
  // 工具实现 Exit Worktree Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Exit Worktree Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Exiting worktree'`，作为工具调用这次计算的结果。
    return 'Exiting worktree'
  },
  shouldDefer: true,
  // isDestructive 用 input 判断工具调用是否满足条件。
  isDestructive(input) {
    // 返回 `input.action === 'remove'`，作为工具调用这次计算的结果。
    return input.action === 'remove'
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.action`，作为工具调用这次计算的结果。
    return input.action
  },
  // validateInput 使用 input 完成工具调用里的对应操作。
  async validateInput(input) {
    // Scope guard: getCurrentWorktreeSession() is null unless EnterWorktree
    // (specifically createWorktreeForSession) ran in THIS session. Worktrees
    // created by `git worktree add`, or by EnterWorktree in a previous
    // session, do not populate it. This is the sole entry gate — everything
    // past this point operates on a path EnterWorktree created.
    // session 会话数据读取`getCurrentWorktreeSession`，供工具调用后续处理使用。
    const session = getCurrentWorktreeSession()
    // session 会话数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!session) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'No-op: there is no active EnterWorktree session to exit. This tool only operates on worktrees created by EnterWorktree in the current session — it will not touch worktrees created manually or in a previous session. No filesystem changes were made.',
        errorCode: 1,
      }
    }

    // 只有 `input.action === 'remove' && !input.discard_chang` 满足时，工具调用才执行该分支。
    if (input.action === 'remove' && !input.discard_changes) {
      // summary统计`countWorktreeChanges`，供工具调用后续处理使用。
      const summary = await countWorktreeChanges(
        session.worktreePath,
        session.originalHeadCommit,
      )
      // 满足 `summary === null` 时，工具调用执行该分支。
      if (summary === null) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Could not verify worktree state at ${session.worktreePath}. Refusing to remove without explicit confirmation. Re-invoke with discard_changes: true to proceed — or use action: "keep" to preserve the worktree.`,
          errorCode: 3,
        }
      }
      // 从 `summary` 解构 changedFiles、commits，减少工具实现 Exit Worktree Tool对同一对象的重复访问。
      const { changedFiles, commits } = summary
      // 只有 `changedFiles > 0 || commits > 0` 满足时，工具调用才执行该分支。
      if (changedFiles > 0 || commits > 0) {
        // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
        const parts: string[] = []
        // 满足 `changedFiles > 0` 时，工具调用执行该分支。
        if (changedFiles > 0) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(
            `${changedFiles} uncommitted ${changedFiles === 1 ? 'file' : 'files'}`,
          )
        }
        // 满足 `commits > 0` 时，工具调用执行该分支。
        if (commits > 0) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(
            `${commits} ${commits === 1 ? 'commit' : 'commits'} on ${session.worktreeBranch ?? 'the worktree branch'}`,
          )
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Worktree has ${parts.join(' and ')}. Removing will discard this work permanently. Confirm with the user, then re-invoke with discard_changes: true — or use action: "keep" to preserve the worktree.`,
          errorCode: 2,
        }
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  renderToolUseMessage,
  renderToolResultMessage,
  // call 使用 input 完成工具调用里的对应操作。
  async call(input) {
    // session 会话数据读取`getCurrentWorktreeSession`，供工具调用后续处理使用。
    const session = getCurrentWorktreeSession()
    // session 会话数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!session) {
      // validateInput guards this, but the session is module-level mutable
      // state — defend against a race between validation and execution.
      // 抛出 new Error('Not in a worktree session')，阻止工具调用在无效状态下继续运行。
      throw new Error('Not in a worktree session')
    }

    // Capture before keepWorktree/cleanupWorktree null out currentWorktreeSession.
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      originalCwd,
      worktreePath,
      worktreeBranch,
      tmuxSessionName,
      originalHeadCommit,
    } = session

    // --worktree startup calls setOriginalCwd(getCwd()) and
    // setProjectRoot(getCwd()) back-to-back right after setCwd(worktreePath)
    // (setup.ts:235/239), so both hold the same realpath'd value and BashTool
    // cd never touches either. Mid-session EnterWorktreeTool sets originalCwd
    // but NOT projectRoot. (Can't use getCwd() — BashTool mutates it on every
    // cd. Can't use session.worktreePath — it's join()'d, not realpath'd.)
    // projectRootIsWorktree读取`getProjectRoot`，供工具调用后续处理使用。
    const projectRootIsWorktree = getProjectRoot() === getOriginalCwd()

    // Re-count at execution time for accurate analytics and output — the
    // worktree state at validateInput time may not match now. Null (git
    // failure) falls back to 0/0; safety gating already happened in
    // validateInput, so this only affects analytics + messaging.
    // 从 `(await countWorktreeChanges(` 解构 changedFiles、commits，减少工具实现 Exit Worktree Tool对同一对象的重复访问。
    const { changedFiles, commits } = (await countWorktreeChanges(
      worktreePath,
      originalHeadCommit,
    )) ?? { changedFiles: 0, commits: 0 }

    // 当 `input.action` 匹配 `'keep'` 时，工具调用执行对应分支。
    if (input.action === 'keep') {
      // 等待 `keepWorktree()` 完成，再继续工具实现 Exit Worktree Tool的异步流程。
      await keepWorktree()
      // 调用 restoreSessionToOriginalCwd，触发工具调用此处需要的副作用。
      restoreSessionToOriginalCwd(originalCwd, projectRootIsWorktree)

      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_worktree_kept', {
        mid_session: true,
        commits,
        changed_files: changedFiles,
      })

      // tmuxNote保存`tmuxSessionName`，供工具实现 Exit Worktree Tool后续判断或输出使用。
      const tmuxNote = tmuxSessionName
        ? ` Tmux session ${tmuxSessionName} is still running; reattach with: tmux attach -t ${tmuxSessionName}`
        : ''
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          action: 'keep' as const,
          originalCwd,
          worktreePath,
          worktreeBranch,
          tmuxSessionName,
          message: `Exited worktree. Your work is preserved at ${worktreePath}${worktreeBranch ? ` on branch ${worktreeBranch}` : ''}. Session is now back in ${originalCwd}.${tmuxNote}`,
        },
      }
    }

    // action === 'remove'
    // 满足 `tmuxSessionName` 时，工具调用执行该分支。
    if (tmuxSessionName) {
      // 等待 `killTmuxSession(tmuxSessionName)` 完成，再继续工具实现 Exit Worktree Tool的异步流程。
      await killTmuxSession(tmuxSessionName)
    }
    // 等待 `cleanupWorktree()` 完成，再继续工具实现 Exit Worktree Tool的异步流程。
    await cleanupWorktree()
    // 调用 restoreSessionToOriginalCwd，触发工具调用此处需要的副作用。
    restoreSessionToOriginalCwd(originalCwd, projectRootIsWorktree)

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_worktree_removed', {
      mid_session: true,
      commits,
      changed_files: changedFiles,
    })

    // discardParts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const discardParts: string[] = []
    // 满足 `commits > 0` 时，工具调用执行该分支。
    if (commits > 0) {
      // discardParts 集合追加新条目，保持收集顺序与输入顺序一致。
      discardParts.push(`${commits} ${commits === 1 ? 'commit' : 'commits'}`)
    }
    // 满足 `changedFiles > 0` 时，工具调用执行该分支。
    if (changedFiles > 0) {
      // discardParts 集合追加新条目，保持收集顺序与输入顺序一致。
      discardParts.push(
        `${changedFiles} uncommitted ${changedFiles === 1 ? 'file' : 'files'}`,
      )
    }
    // discardNote 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const discardNote =
      discardParts.length > 0 ? ` Discarded ${discardParts.join(' and ')}.` : ''
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        action: 'remove' as const,
        originalCwd,
        worktreePath,
        worktreeBranch,
        discardedFiles: changedFiles,
        discardedCommits: commits,
        message: `Exited and removed worktree at ${worktreePath}.${discardNote} Session is now back in ${originalCwd}.`,
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 { message }, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam({ message }, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      content: message,
      tool_use_id: toolUseID,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
