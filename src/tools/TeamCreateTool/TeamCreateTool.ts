// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/metadata.js，用于校准工具调用的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/metadata.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 formatAgentId 工具函数，把通用处理留在 ../../utils/agentId.js 中维护。
import { formatAgentId } from '../../utils/agentId.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModel,
  parseUserSpecifiedModel,
} from '../../utils/model/model.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 getResolvedTeammateMode 工具函数，把通用处理留在 ../../utils/swarm/backends/registry.js 中维护。
import { getResolvedTeammateMode } from '../../utils/swarm/backends/registry.js'
// 复用 TEAM_LEAD_NAME 工具函数，把通用处理留在 ../../utils/swarm/constants.js 中维护。
import { TEAM_LEAD_NAME } from '../../utils/swarm/constants.js'
// 类型依赖 { TeamFile } 来自 ../../utils/swarm/teamHelpers.js，用于校准工具调用的数据契约。
import type { TeamFile } from '../../utils/swarm/teamHelpers.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getTeamFilePath,
  readTeamFile,
  registerTeamForSessionCleanup,
  sanitizeName,
  writeTeamFileAsync,
} from '../../utils/swarm/teamHelpers.js'
// 复用 assignTeammateColor 工具函数，把通用处理留在 ../../utils/swarm/teammateLayoutManager.js 中维护。
import { assignTeammateColor } from '../../utils/swarm/teammateLayoutManager.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  ensureTasksDir,
  resetTaskList,
  setLeaderTeamName,
} from '../../utils/tasks.js'
// 复用 generateWordSlug 工具函数，把通用处理留在 ../../utils/words.js 中维护。
import { generateWordSlug } from '../../utils/words.js'
// 引入 TEAM_CREATE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_CREATE_TOOL_NAME } from './constants.js'
// 引入 getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getPrompt } from './prompt.js'
// 引入 renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    team_name: z.string().describe('Name for the new team to create.'),
    description: z.string().optional().describe('Team description/purpose.'),
    agent_type: z
      .string()
      .optional()
      .describe(
        'Type/role of the team lead (e.g., "researcher", "test-runner"). ' +
          'Used for team file and inter-agent coordination.',
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = {
  team_name: string
  team_file_path: string
  lead_agent_id: string
}

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

/**
 * Generates a unique team name by checking if the provided name already exists.
 * If the name already exists, generates a new word slug.
 */
// generateUniqueTeamName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateUniqueTeamName(providedName: string): string {
  // If the team doesn't exist, use the provided name
  // 满足 `!readTeamFile(providedName)` 时，工具调用执行该分支。
  if (!readTeamFile(providedName)) {
    // 返回 `providedName`，作为工具调用这次计算的结果。
    return providedName
  }

  // Team exists, generate a new unique name
  // 返回 `generateWordSlug()`，作为工具调用这次计算的结果。
  return generateWordSlug()
}

// TeamCreateTool构建`buildTool({`，供后续判断或组装使用。
export const TeamCreateTool: Tool<InputSchema, Output> = buildTool({
  name: TEAM_CREATE_TOOL_NAME,
  searchHint: 'create a multi-agent swarm team',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },

  // 工具实现 Team Create Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },

  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isAgentSwarmsEnabled()`，作为工具调用这次计算的结果。
    return isAgentSwarmsEnabled()
  },

  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.team_name`，作为工具调用这次计算的结果。
    return input.team_name
  },

  // validateInput 使用 input, _context 完成工具调用里的对应操作。
  async validateInput(input, _context) {
    // !input.team_name || input.team_...为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (!input.team_name || input.team_name.trim().length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'team_name is required for TeamCreate',
        errorCode: 9,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },

  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Create a new team for coordinating multiple agents'`，作为工具调用这次计算的结果。
    return 'Create a new team for coordinating multiple agents'
  },

  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getPrompt()`，作为工具调用这次计算的结果。
    return getPrompt()
  },

  // mapToolResultToToolResultBlockParam 使用 data, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: [
        {
          type: 'text' as const,
          text: jsonStringify(data),
        },
      ],
    }
  },

  // call 使用 input, context 完成工具调用里的对应操作。
  async call(input, context) {
    // 从 `context` 解构 setAppState、getAppState，减少工具实现 Team Create Tool对同一对象的重复访问。
    const { setAppState, getAppState } = context
    // 从 `input` 解构 team_name、description、agent_type，减少工具实现 Team Create Tool对同一对象的重复访问。
    const { team_name, description: _description, agent_type } = input

    // Check if already in a team - restrict to one team per leader
    // appState 状态读取`getAppState`，供工具调用后续处理使用。
    const appState = getAppState()
    // existingTeam保存`appState.teamContext?.teamName`，供后续判断或组装使用。
    const existingTeam = appState.teamContext?.teamName

    // 满足 `existingTeam` 时，工具调用执行该分支。
    if (existingTeam) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        `Already leading team "${existingTeam}". A leader can only manage one team at a time. Use TeamDelete to end the current team before creating a new one.`,
      )
    }

    // If team already exists, generate a unique name instead of failing
    // finalTeamName保存`generateUniqueTeamName`，供工具调用后续处理使用。
    const finalTeamName = generateUniqueTeamName(team_name)

    // Generate a deterministic agent ID for the team lead
    // leadAgentId格式化`formatAgentId`，供工具调用后续处理使用。
    const leadAgentId = formatAgentId(TEAM_LEAD_NAME, finalTeamName)
    // leadAgentType标记工具实现 Team Create Tool是否启用对应路径。
    const leadAgentType = agent_type || TEAM_LEAD_NAME
    // Get the team lead's current model from AppState (handles session model, settings, CLI override)
    // leadModel解析`parseUserSpecifiedModel`，供工具调用后续处理使用。
    const leadModel = parseUserSpecifiedModel(
      appState.mainLoopModelForSession ??
        appState.mainLoopModel ??
        getDefaultMainLoopModel(),
    )

    // teamFilePath 路径数据读取`getTeamFilePath`，供工具调用后续处理使用。
    const teamFilePath = getTeamFilePath(finalTeamName)

    // teamFile 文件数据 集中保存工具实现 Team Create Tool要一起传递的字段。
    const teamFile: TeamFile = {
      name: finalTeamName,
      description: _description,
      createdAt: Date.now(),
      leadAgentId,
      leadSessionId: getSessionId(), // Store actual session ID for team discovery
      members: [
        {
          agentId: leadAgentId,
          name: TEAM_LEAD_NAME,
          agentType: leadAgentType,
          model: leadModel,
          joinedAt: Date.now(),
          tmuxPaneId: '',
          cwd: getCwd(),
          subscriptions: [],
        },
      ],
    }

    // 等待 `writeTeamFileAsync(finalTeamName, teamFile)` 完成，再继续工具实现 Team Create Tool的异步流程。
    await writeTeamFileAsync(finalTeamName, teamFile)
    // Track for session-end cleanup — teams were left on disk forever
    // unless explicitly TeamDelete'd (gh-32730).
    // 调用 registerTeamForSessionCleanup，触发工具调用此处需要的副作用。
    registerTeamForSessionCleanup(finalTeamName)

    // Reset and create the corresponding task list directory (Team = Project = TaskList)
    // This ensures task numbering starts fresh at 1 for each new swarm
    // taskListId 集合保存`sanitizeName`，供工具调用后续处理使用。
    const taskListId = sanitizeName(finalTeamName)
    // 等待 `resetTaskList(taskListId)` 完成，再继续工具实现 Team Create Tool的异步流程。
    await resetTaskList(taskListId)
    // 等待 `ensureTasksDir(taskListId)` 完成，再继续工具实现 Team Create Tool的异步流程。
    await ensureTasksDir(taskListId)

    // Register the team name so getTaskListId() returns it for the leader.
    // Without this, the leader falls through to getSessionId() and writes tasks
    // to a different directory than tmux/iTerm2 teammates expect.
    // setLeaderTeamName 写入新的状态值，使工具调用后续读取保持一致。
    setLeaderTeamName(sanitizeName(finalTeamName))

    // Update AppState with team context
    // setAppState 写入新的状态值，使工具调用后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      teamContext: {
        teamName: finalTeamName,
        teamFilePath,
        leadAgentId,
        teammates: {
          [leadAgentId]: {
            name: TEAM_LEAD_NAME,
            agentType: leadAgentType,
            color: assignTeammateColor(leadAgentId),
            tmuxSessionName: '',
            tmuxPaneId: '',
            cwd: getCwd(),
            spawnedAt: Date.now(),
          },
        },
      },
    }))

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_team_created', {
      team_name:
        finalTeamName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      teammate_count: 1,
      lead_agent_type:
        leadAgentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      teammate_mode:
        getResolvedTeammateMode() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // Note: We intentionally don't set CLAUDE_CODE_AGENT_ID for the team lead because:
    // 1. The lead is not a "teammate" - isTeammate() should return false for them
    // 2. Their ID is deterministic (team-lead@teamName) and can be derived when needed
    // 3. Setting it would cause isTeammate() to return true, breaking inbox polling
    // Team name is stored in AppState.teamContext, not process.env

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        team_name: finalTeamName,
        team_file_path: teamFilePath,
        lead_agent_id: leadAgentId,
      },
    }
  },

  renderToolUseMessage,
} satisfies ToolDef<InputSchema, Output>)
