// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getSessionId、setOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId, setOriginalCwd } from '../../bootstrap/state.js'
// 引入 clearSystemPromptSections，将 ../../constants/systemPromptSections.js 中已经封装好的能力接到本文件流程里。
import { clearSystemPromptSections } from '../../constants/systemPromptSections.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 clearMemoryFileCaches 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { clearMemoryFileCaches } from '../../utils/claudemd.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 findCanonicalGitRoot 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { findCanonicalGitRoot } from '../../utils/git.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 getPlanSlug、getPlansDirectory 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlanSlug, getPlansDirectory } from '../../utils/plans.js'
// 复用 setCwd 工具函数，把通用处理留在 ../../utils/Shell.js 中维护。
import { setCwd } from '../../utils/Shell.js'
// 复用 saveWorktreeState 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { saveWorktreeState } from '../../utils/sessionStorage.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createWorktreeForSession,
  getCurrentWorktreeSession,
  validateWorktreeSlug,
} from '../../utils/worktree.js'
// 引入 ENTER_WORKTREE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { ENTER_WORKTREE_TOOL_NAME } from './constants.js'
// 引入 getEnterWorktreeToolPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getEnterWorktreeToolPrompt } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    name: z
      .string()
      // 链式调用 superRefine，继续加工上一行在工具调用中产生的数据。
      .superRefine((s, ctx) => {
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // 调用 validateWorktreeSlug，触发工具调用此处需要的副作用。
          validateWorktreeSlug(s)
        } catch (e) {
          // 调用 ctx.addIssue，触发工具调用此处需要的副作用。
          ctx.addIssue({ code: 'custom', message: (e as Error).message })
        }
      })
      .optional()
      .describe(
        'Optional name for the worktree. Each "/"-separated segment may contain only letters, digits, dots, underscores, and dashes; max 64 chars total. A random name is generated if not provided.',
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    worktreePath: z.string(),
    worktreeBranch: z.string().optional(),
    message: z.string(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// EnterWorktreeTool 命名 `buildTool({`，让后续代码直接表达这个值的用途。
export const EnterWorktreeTool: Tool<InputSchema, Output> = buildTool({
  name: ENTER_WORKTREE_TOOL_NAME,
  searchHint: 'create an isolated git worktree and switch into it',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Creates an isolated worktree (via git or configured hooks) and switche...`，作为工具调用这次计算的结果。
    return 'Creates an isolated worktree (via git or configured hooks) and switches the session into it'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getEnterWorktreeToolPrompt()`，作为工具调用这次计算的结果。
    return getEnterWorktreeToolPrompt()
  },
  // 工具实现 Enter Worktree Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Enter Worktree Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Creating worktree'`，作为工具调用这次计算的结果。
    return 'Creating worktree'
  },
  shouldDefer: true,
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.name ?? ''`，作为工具调用这次计算的结果。
    return input.name ?? ''
  },
  renderToolUseMessage,
  renderToolResultMessage,
  // call 使用 input 完成工具调用里的对应操作。
  async call(input) {
    // Validate not already in a worktree created by this session
    // 满足 `getCurrentWorktreeSession()` 时，工具调用执行该分支。
    if (getCurrentWorktreeSession()) {
      // 抛出 new Error('Already in a worktree session')，阻止工具调用在无效状态下继续运行。
      throw new Error('Already in a worktree session')
    }

    // Resolve to main repo root so worktree creation works from within a worktree
    // mainRepoRoot筛选`findCanonicalGitRoot`，供工具调用后续处理使用。
    const mainRepoRoot = findCanonicalGitRoot(getCwd())
    // `mainRepoRoot && mainRepoRoot` 与 `getCwd()` 不一致时刷新派生状态，避免使用过期结果。
    if (mainRepoRoot && mainRepoRoot !== getCwd()) {
      // 调用 process.chdir，触发工具调用此处需要的副作用。
      process.chdir(mainRepoRoot)
      // setCwd 写入新的状态值，使工具调用后续读取保持一致。
      setCwd(mainRepoRoot)
    }

    // slug读取`getPlanSlug`，供工具调用后续处理使用。
    const slug = input.name ?? getPlanSlug()

    // worktreeSession 会话数据构建`createWorktreeForSession`，供工具调用后续处理使用。
    const worktreeSession = await createWorktreeForSession(getSessionId(), slug)

    // 调用 process.chdir，触发工具调用此处需要的副作用。
    process.chdir(worktreeSession.worktreePath)
    // setCwd 写入新的状态值，使工具调用后续读取保持一致。
    setCwd(worktreeSession.worktreePath)
    // setOriginalCwd 写入新的状态值，使工具调用后续读取保持一致。
    setOriginalCwd(getCwd())
    // 调用 saveWorktreeState，触发工具调用此处需要的副作用。
    saveWorktreeState(worktreeSession)
    // Clear cached system prompt sections so env_info_simple recomputes with worktree context
    // 调用 clearSystemPromptSections，触发工具调用此处需要的副作用。
    clearSystemPromptSections()
    // Clear memoized caches that depend on CWD
    // 清理相关缓存，确保工具调用下一次读取时重新加载最新数据。
    clearMemoryFileCaches()
    // 调用 getPlansDirectory.cache.clear?.()，完成这一处局部操作。
    getPlansDirectory.cache.clear?.()

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_worktree_created', {
      mid_session: true,
    })

    // branchInfo保存`worktreeSession.worktreeBranch`，供后续判断或组装使用。
    const branchInfo = worktreeSession.worktreeBranch
      ? ` on branch ${worktreeSession.worktreeBranch}`
      : ''

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        worktreePath: worktreeSession.worktreePath,
        worktreeBranch: worktreeSession.worktreeBranch,
        message: `Created worktree at ${worktreeSession.worktreePath}${branchInfo}. The session is now working in the worktree. Use ExitWorktree to leave mid-session, or exit the session to be prompted.`,
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
