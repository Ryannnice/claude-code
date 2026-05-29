// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 TASK_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_OUTPUT_TOOL_NAME } from '../tools/TaskOutputTool/constants.js'
// 接入 EXIT_PLAN_MODE_V2_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../tools/ExitPlanModeTool/constants.js'
// 接入 ENTER_PLAN_MODE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ENTER_PLAN_MODE_TOOL_NAME } from '../tools/EnterPlanModeTool/constants.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../tools/AgentTool/constants.js'
// 接入 ASK_USER_QUESTION_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ASK_USER_QUESTION_TOOL_NAME } from '../tools/AskUserQuestionTool/prompt.js'
// 接入 TASK_STOP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_STOP_TOOL_NAME } from '../tools/TaskStopTool/prompt.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../tools/FileReadTool/prompt.js'
// 接入 WEB_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_SEARCH_TOOL_NAME } from '../tools/WebSearchTool/prompt.js'
// 接入 TODO_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TODO_WRITE_TOOL_NAME } from '../tools/TodoWriteTool/constants.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from '../tools/WebFetchTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from '../tools/GlobTool/prompt.js'
// 复用 SHELL_TOOL_NAMES 工具函数，把通用处理留在 ../utils/shell/shellToolUtils.js 中维护。
import { SHELL_TOOL_NAMES } from '../utils/shell/shellToolUtils.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
// 接入 NOTEBOOK_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NOTEBOOK_EDIT_TOOL_NAME } from '../tools/NotebookEditTool/constants.js'
// 接入 SKILL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SKILL_TOOL_NAME } from '../tools/SkillTool/constants.js'
// 接入 SEND_MESSAGE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SEND_MESSAGE_TOOL_NAME } from '../tools/SendMessageTool/constants.js'
// 接入 TASK_CREATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_CREATE_TOOL_NAME } from '../tools/TaskCreateTool/constants.js'
// 接入 TASK_GET_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_GET_TOOL_NAME } from '../tools/TaskGetTool/constants.js'
// 接入 TASK_LIST_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_LIST_TOOL_NAME } from '../tools/TaskListTool/constants.js'
// 接入 TASK_UPDATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_UPDATE_TOOL_NAME } from '../tools/TaskUpdateTool/constants.js'
// 接入 TOOL_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TOOL_SEARCH_TOOL_NAME } from '../tools/ToolSearchTool/prompt.js'
// 接入 SYNTHETIC_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SYNTHETIC_OUTPUT_TOOL_NAME } from '../tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 接入 ENTER_WORKTREE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ENTER_WORKTREE_TOOL_NAME } from '../tools/EnterWorktreeTool/constants.js'
// 接入 EXIT_WORKTREE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_WORKTREE_TOOL_NAME } from '../tools/ExitWorktreeTool/constants.js'
// 接入 WORKFLOW_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WORKFLOW_TOOL_NAME } from '../tools/WorkflowTool/constants.js'
// 整理这一组导入，让tools后续逻辑可以直接复用这些外部能力。
import {
  CRON_CREATE_TOOL_NAME,
  CRON_DELETE_TOOL_NAME,
  CRON_LIST_TOOL_NAME,
} from '../tools/ScheduleCronTool/prompt.js'

// ALL_AGENT_DISALLOWED_TOOLS 集合保存`Set`，供tools后续处理使用。
export const ALL_AGENT_DISALLOWED_TOOLS = new Set([
  TASK_OUTPUT_TOOL_NAME,
  EXIT_PLAN_MODE_V2_TOOL_NAME,
  ENTER_PLAN_MODE_TOOL_NAME,
  // Allow Agent tool for agents when user is ant (enables nested agents)
  ...(process.env.USER_TYPE === 'ant' ? [] : [AGENT_TOOL_NAME]),
  ASK_USER_QUESTION_TOOL_NAME,
  TASK_STOP_TOOL_NAME,
  // Prevent recursive workflow execution inside subagents.
  ...(feature('WORKFLOW_SCRIPTS') ? [WORKFLOW_TOOL_NAME] : []),
])

// CUSTOM_AGENT_DISALLOWED_TOOLS 集合保存`Set`，供tools后续处理使用。
export const CUSTOM_AGENT_DISALLOWED_TOOLS = new Set([
  ...ALL_AGENT_DISALLOWED_TOOLS,
])

/*
 * Async Agent Tool Availability Status (Source of Truth)
 */
// ASYNC_AGENT_ALLOWED_TOOLS 集合保存`Set`，供tools后续处理使用。
export const ASYNC_AGENT_ALLOWED_TOOLS = new Set([
  FILE_READ_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  TODO_WRITE_TOOL_NAME,
  GREP_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  GLOB_TOOL_NAME,
  ...SHELL_TOOL_NAMES,
  FILE_EDIT_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
  NOTEBOOK_EDIT_TOOL_NAME,
  SKILL_TOOL_NAME,
  SYNTHETIC_OUTPUT_TOOL_NAME,
  TOOL_SEARCH_TOOL_NAME,
  ENTER_WORKTREE_TOOL_NAME,
  EXIT_WORKTREE_TOOL_NAME,
])
/**
 * Tools allowed only for in-process teammates (not general async agents).
 * These are injected by inProcessRunner.ts and allowed through filterToolsForAgent
 * via isInProcessTeammate() check.
 */
// IN_PROCESS_TEAMMATE_ALLOWED_TOOLS 集合保存`Set`，供tools后续处理使用。
export const IN_PROCESS_TEAMMATE_ALLOWED_TOOLS = new Set([
  TASK_CREATE_TOOL_NAME,
  TASK_GET_TOOL_NAME,
  TASK_LIST_TOOL_NAME,
  TASK_UPDATE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  // Teammate-created crons are tagged with the creating agentId and routed to
  // that teammate's pendingUserMessages queue (see useScheduledTasks.ts).
  ...(feature('AGENT_TRIGGERS')
    ? [CRON_CREATE_TOOL_NAME, CRON_DELETE_TOOL_NAME, CRON_LIST_TOOL_NAME]
    : []),
])

/*
 * BLOCKED FOR ASYNC AGENTS:
 * - AgentTool: Blocked to prevent recursion
 * - TaskOutputTool: Blocked to prevent recursion
 * - ExitPlanModeTool: Plan mode is a main thread abstraction.
 * - TaskStopTool: Requires access to main thread task state.
 * - TungstenTool: Uses singleton virtual terminal abstraction that conflicts between agents.
 *
 * ENABLE LATER (NEED WORK):
 * - MCPTool: TBD
 * - ListMcpResourcesTool: TBD
 * - ReadMcpResourceTool: TBD
 */

/**
 * Tools allowed in coordinator mode - only output and agent management tools for the coordinator
 */
// COORDINATOR_MODE_ALLOWED_TOOLS 集合保存`Set`，供tools后续处理使用。
export const COORDINATOR_MODE_ALLOWED_TOOLS = new Set([
  AGENT_TOOL_NAME,
  TASK_STOP_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  SYNTHETIC_OUTPUT_TOOL_NAME,
])
