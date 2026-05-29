// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 toolMatchesName、Tool、Tools，将 ./Tool.js 中已经封装好的能力接到本文件流程里。
import { toolMatchesName, type Tool, type Tools } from './Tool.js'
// 接入 AgentTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AgentTool } from './tools/AgentTool/AgentTool.js'
// 接入 SkillTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SkillTool } from './tools/SkillTool/SkillTool.js'
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from './tools/BashTool/BashTool.js'
// 接入 FileEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
// 接入 FileReadTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileReadTool } from './tools/FileReadTool/FileReadTool.js'
// 接入 FileWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool.js'
// 接入 GlobTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GlobTool } from './tools/GlobTool/GlobTool.js'
// 接入 NotebookEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NotebookEditTool } from './tools/NotebookEditTool/NotebookEditTool.js'
// 接入 WebFetchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WebFetchTool } from './tools/WebFetchTool/WebFetchTool.js'
// 接入 TaskStopTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskStopTool } from './tools/TaskStopTool/TaskStopTool.js'
// 接入 BriefTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BriefTool } from './tools/BriefTool/BriefTool.js'
// Dead code elimination: conditional import for ant-only tools
/* eslint-disable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// REPLTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const REPLTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/REPLTool/REPLTool.js').REPLTool
    : null
// SuggestBackgroundPRTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SuggestBackgroundPRTool =
  process.env.USER_TYPE === 'ant'
    ? require('./tools/SuggestBackgroundPRTool/SuggestBackgroundPRTool.js')
        .SuggestBackgroundPRTool
    : null
// SleepTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
// cronTools 集合保存`feature`，供内置工具注册表后续处理使用。
const cronTools = feature('AGENT_TRIGGERS')
  ? [
      require('./tools/ScheduleCronTool/CronCreateTool.js').CronCreateTool,
      require('./tools/ScheduleCronTool/CronDeleteTool.js').CronDeleteTool,
      require('./tools/ScheduleCronTool/CronListTool.js').CronListTool,
    ]
  : []
// RemoteTriggerTool保存`feature`，供内置工具注册表后续处理使用。
const RemoteTriggerTool = feature('AGENT_TRIGGERS_REMOTE')
  ? require('./tools/RemoteTriggerTool/RemoteTriggerTool.js').RemoteTriggerTool
  : null
// MonitorTool保存`feature`，供内置工具注册表后续处理使用。
const MonitorTool = feature('MONITOR_TOOL')
  ? require('./tools/MonitorTool/MonitorTool.js').MonitorTool
  : null
// SendUserFileTool 文件数据保存`feature`，供内置工具注册表后续处理使用。
const SendUserFileTool = feature('KAIROS')
  ? require('./tools/SendUserFileTool/SendUserFileTool.js').SendUserFileTool
  : null
// PushNotificationTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const PushNotificationTool =
  feature('KAIROS') || feature('KAIROS_PUSH_NOTIFICATION')
    ? require('./tools/PushNotificationTool/PushNotificationTool.js')
        .PushNotificationTool
    : null
// SubscribePRTool保存`feature`，供内置工具注册表后续处理使用。
const SubscribePRTool = feature('KAIROS_GITHUB_WEBHOOKS')
  ? require('./tools/SubscribePRTool/SubscribePRTool.js').SubscribePRTool
  : null
/* eslint-enable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// 接入 TaskOutputTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskOutputTool } from './tools/TaskOutputTool/TaskOutputTool.js'
// 接入 WebSearchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WebSearchTool } from './tools/WebSearchTool/WebSearchTool.js'
// 接入 TodoWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TodoWriteTool } from './tools/TodoWriteTool/TodoWriteTool.js'
// 接入 ExitPlanModeV2Tool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ExitPlanModeV2Tool } from './tools/ExitPlanModeTool/ExitPlanModeV2Tool.js'
// 接入 TestingPermissionTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TestingPermissionTool } from './tools/testing/TestingPermissionTool.js'
// 接入 GrepTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GrepTool } from './tools/GrepTool/GrepTool.js'
// 接入 TungstenTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TungstenTool } from './tools/TungstenTool/TungstenTool.js'
// Lazy require to break circular dependency: tools.ts -> TeamCreateTool/TeamDeleteTool -> ... -> tools.ts
/* eslint-disable @typescript-eslint/no-require-imports */
// getTeamCreateTool封装成回调，供内置工具注册表在事件触发或异步步骤中调用。
const getTeamCreateTool = () =>
  require('./tools/TeamCreateTool/TeamCreateTool.js')
    .TeamCreateTool as typeof import('./tools/TeamCreateTool/TeamCreateTool.js').TeamCreateTool
// getTeamDeleteTool封装成回调，供内置工具注册表在事件触发或异步步骤中调用。
const getTeamDeleteTool = () =>
  require('./tools/TeamDeleteTool/TeamDeleteTool.js')
    .TeamDeleteTool as typeof import('./tools/TeamDeleteTool/TeamDeleteTool.js').TeamDeleteTool
// getSendMessageTool 消息数据封装成回调，供内置工具注册表在事件触发或异步步骤中调用。
const getSendMessageTool = () =>
  require('./tools/SendMessageTool/SendMessageTool.js')
    .SendMessageTool as typeof import('./tools/SendMessageTool/SendMessageTool.js').SendMessageTool
/* eslint-enable @typescript-eslint/no-require-imports */
// 接入 AskUserQuestionTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AskUserQuestionTool } from './tools/AskUserQuestionTool/AskUserQuestionTool.js'
// 接入 LSPTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { LSPTool } from './tools/LSPTool/LSPTool.js'
// 接入 ListMcpResourcesTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ListMcpResourcesTool } from './tools/ListMcpResourcesTool/ListMcpResourcesTool.js'
// 接入 ReadMcpResourceTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ReadMcpResourceTool } from './tools/ReadMcpResourceTool/ReadMcpResourceTool.js'
// 接入 ToolSearchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ToolSearchTool } from './tools/ToolSearchTool/ToolSearchTool.js'
// 接入 EnterPlanModeTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EnterPlanModeTool } from './tools/EnterPlanModeTool/EnterPlanModeTool.js'
// 接入 EnterWorktreeTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EnterWorktreeTool } from './tools/EnterWorktreeTool/EnterWorktreeTool.js'
// 接入 ExitWorktreeTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ExitWorktreeTool } from './tools/ExitWorktreeTool/ExitWorktreeTool.js'
// 接入 ConfigTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ConfigTool } from './tools/ConfigTool/ConfigTool.js'
// 接入 TaskCreateTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskCreateTool } from './tools/TaskCreateTool/TaskCreateTool.js'
// 接入 TaskGetTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskGetTool } from './tools/TaskGetTool/TaskGetTool.js'
// 接入 TaskUpdateTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskUpdateTool } from './tools/TaskUpdateTool/TaskUpdateTool.js'
// 接入 TaskListTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TaskListTool } from './tools/TaskListTool/TaskListTool.js'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 复用 isToolSearchEnabledOptimistic 工具函数，把通用处理留在 ./utils/toolSearch.js 中维护。
import { isToolSearchEnabledOptimistic } from './utils/toolSearch.js'
// 复用 isTodoV2Enabled 工具函数，把通用处理留在 ./utils/tasks.js 中维护。
import { isTodoV2Enabled } from './utils/tasks.js'
// Dead code elimination: conditional import for CLAUDE_CODE_VERIFY_PLAN
/* eslint-disable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// VerifyPlanExecutionTool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const VerifyPlanExecutionTool =
  process.env.CLAUDE_CODE_VERIFY_PLAN === 'true'
    ? require('./tools/VerifyPlanExecutionTool/VerifyPlanExecutionTool.js')
        .VerifyPlanExecutionTool
    : null
/* eslint-enable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// 接入 SYNTHETIC_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SYNTHETIC_OUTPUT_TOOL_NAME } from './tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 重新导出这一组成员，让内置工具注册表的公共 API 保持集中入口。
export {
  ALL_AGENT_DISALLOWED_TOOLS,
  CUSTOM_AGENT_DISALLOWED_TOOLS,
  ASYNC_AGENT_ALLOWED_TOOLS,
  COORDINATOR_MODE_ALLOWED_TOOLS,
} from './constants/tools.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// Dead code elimination: conditional import for OVERFLOW_TEST_TOOL
/* eslint-disable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// OverflowTestTool保存`feature`，供内置工具注册表后续处理使用。
const OverflowTestTool = feature('OVERFLOW_TEST_TOOL')
  ? require('./tools/OverflowTestTool/OverflowTestTool.js').OverflowTestTool
  : null
// CtxInspectTool保存`feature`，供内置工具注册表后续处理使用。
const CtxInspectTool = feature('CONTEXT_COLLAPSE')
  ? require('./tools/CtxInspectTool/CtxInspectTool.js').CtxInspectTool
  : null
// TerminalCaptureTool保存`feature`，供内置工具注册表后续处理使用。
const TerminalCaptureTool = feature('TERMINAL_PANEL')
  ? require('./tools/TerminalCaptureTool/TerminalCaptureTool.js')
      .TerminalCaptureTool
  : null
// WebBrowserTool保存`feature`，供内置工具注册表后续处理使用。
const WebBrowserTool = feature('WEB_BROWSER_TOOL')
  ? require('./tools/WebBrowserTool/WebBrowserTool.js').WebBrowserTool
  : null
// coordinatorModeModule保存`feature`，供内置工具注册表后续处理使用。
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? (require('./coordinator/coordinatorMode.js') as typeof import('./coordinator/coordinatorMode.js'))
  : null
// SnipTool保存`feature`，供内置工具注册表后续处理使用。
const SnipTool = feature('HISTORY_SNIP')
  ? require('./tools/SnipTool/SnipTool.js').SnipTool
  : null
// ListPeersTool 集合保存`feature`，供内置工具注册表后续处理使用。
const ListPeersTool = feature('UDS_INBOX')
  ? require('./tools/ListPeersTool/ListPeersTool.js').ListPeersTool
  : null
// WorkflowTool保存`feature`，供内置工具注册表后续处理使用。
const WorkflowTool = feature('WORKFLOW_SCRIPTS')
  // 这个回调绑定到 ? (() => {，负责内置工具注册表在该局部场景下的响应。
  ? (() => {
      // 调用 require，触发内置工具注册表此处需要的副作用。
      require('./tools/WorkflowTool/bundled/index.js').initBundledWorkflows()
      // 返回 `require('./tools/WorkflowTool/WorkflowTool.js').WorkflowTool`，作为内置工具注册表这次计算的结果。
      return require('./tools/WorkflowTool/WorkflowTool.js').WorkflowTool
    })()
  : null
/* eslint-enable custom-rules/no-process-env-top-level, @typescript-eslint/no-require-imports */
// 类型依赖 { ToolPermissionContext } 来自 ./Tool.js，用于校准内置工具注册表的数据契约。
import type { ToolPermissionContext } from './Tool.js'
// 复用 getDenyRuleForTool 工具函数，把通用处理留在 ./utils/permissions/permissions.js 中维护。
import { getDenyRuleForTool } from './utils/permissions/permissions.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 ./utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from './utils/embeddedTools.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ./utils/envUtils.js 中维护。
import { isEnvTruthy } from './utils/envUtils.js'
// 复用 isPowerShellToolEnabled 工具函数，把通用处理留在 ./utils/shell/shellToolUtils.js 中维护。
import { isPowerShellToolEnabled } from './utils/shell/shellToolUtils.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ./utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from './utils/agentSwarmsEnabled.js'
// 复用 isWorktreeModeEnabled 工具函数，把通用处理留在 ./utils/worktreeModeEnabled.js 中维护。
import { isWorktreeModeEnabled } from './utils/worktreeModeEnabled.js'
// 整理这一组导入，让内置工具注册表后续逻辑可以直接复用这些外部能力。
import {
  REPL_TOOL_NAME,
  REPL_ONLY_TOOLS,
  isReplModeEnabled,
} from './tools/REPLTool/constants.js'
// 重新导出这一组成员，让内置工具注册表的公共 API 保持集中入口。
export { REPL_ONLY_TOOLS }
/* eslint-disable @typescript-eslint/no-require-imports */
// getPowerShellTool封装成回调，供内置工具注册表在事件触发或异步步骤中调用。
const getPowerShellTool = () => {
  // 满足 `!isPowerShellToolEnabled()` 时，内置工具注册表执行该分支。
  if (!isPowerShellToolEnabled()) return null
  // 返回 `(`，作为内置工具注册表这次计算的结果。
  return (
    require('./tools/PowerShellTool/PowerShellTool.js') as typeof import('./tools/PowerShellTool/PowerShellTool.js')
  ).PowerShellTool
}
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Predefined tool presets that can be used with --tools flag
 */
// TOOL_PRESETS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const TOOL_PRESETS = ['default'] as const

// ToolPreset 固化内置工具注册表里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolPreset = (typeof TOOL_PRESETS)[number]

// parseToolPreset 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseToolPreset(preset: string): ToolPreset | null {
  // presetString保存`preset.toLowerCase`，供内置工具注册表后续处理使用。
  const presetString = preset.toLowerCase()
  // 满足 `!TOOL_PRESETS.includes(presetString as ToolPreset)` 时，内置工具注册表执行该分支。
  if (!TOOL_PRESETS.includes(presetString as ToolPreset)) {
    // 返回 `null`，作为内置工具注册表这次计算的结果。
    return null
  }
  // 返回 `presetString as ToolPreset`，作为内置工具注册表这次计算的结果。
  return presetString as ToolPreset
}

/**
 * Get the list of tool names for a given preset
 * Filters out tools that are disabled via isEnabled() check
 * @param preset The preset name
 * @returns Array of tool names
 */
// getToolsForDefaultPreset 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolsForDefaultPreset(): string[] {
  // tools 集合读取`getAllBaseTools`，供内置工具注册表后续处理使用。
  const tools = getAllBaseTools()
  // isEnabled记录 `tools.map` 是否成立，内置工具注册表随后按该结果分支。
  const isEnabled = tools.map(tool => tool.isEnabled())
  // 返回 `tools.filter((_, i) => isEnabled[i]).map(tool => tool.name)`，作为内置工具注册表这次计算的结果。
  return tools.filter((_, i) => isEnabled[i]).map(tool => tool.name)
}

/**
 * Get the complete exhaustive list of all tools that could be available
 * in the current environment (respecting process.env flags).
 * This is the source of truth for ALL tools.
 */
/**
 * NOTE: This MUST stay in sync with https://console.statsig.com/4aF3Ewatb6xPVpCwxb5nA3/dynamic_configs/claude_code_global_system_caching, in order to cache the system prompt across users.
 */
// getAllBaseTools 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllBaseTools(): Tools {
  // 返回列表结果，保留内置工具注册表已经排好的条目顺序。
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    // Ant-native builds have bfs/ugrep embedded in the bun binary (same ARGV0
    // trick as ripgrep). When available, find/grep in Claude's shell are aliased
    // to these fast tools, so the dedicated Glob/Grep tools are unnecessary.
    ...(hasEmbeddedSearchTools() ? [] : [GlobTool, GrepTool]),
    ExitPlanModeV2Tool,
    FileReadTool,
    FileEditTool,
    FileWriteTool,
    NotebookEditTool,
    WebFetchTool,
    TodoWriteTool,
    WebSearchTool,
    TaskStopTool,
    AskUserQuestionTool,
    SkillTool,
    EnterPlanModeTool,
    ...(process.env.USER_TYPE === 'ant' ? [ConfigTool] : []),
    ...(process.env.USER_TYPE === 'ant' ? [TungstenTool] : []),
    ...(SuggestBackgroundPRTool ? [SuggestBackgroundPRTool] : []),
    ...(WebBrowserTool ? [WebBrowserTool] : []),
    ...(isTodoV2Enabled()
      ? [TaskCreateTool, TaskGetTool, TaskUpdateTool, TaskListTool]
      : []),
    ...(OverflowTestTool ? [OverflowTestTool] : []),
    ...(CtxInspectTool ? [CtxInspectTool] : []),
    ...(TerminalCaptureTool ? [TerminalCaptureTool] : []),
    ...(isEnvTruthy(process.env.ENABLE_LSP_TOOL) ? [LSPTool] : []),
    ...(isWorktreeModeEnabled() ? [EnterWorktreeTool, ExitWorktreeTool] : []),
    getSendMessageTool(),
    ...(ListPeersTool ? [ListPeersTool] : []),
    ...(isAgentSwarmsEnabled()
      ? [getTeamCreateTool(), getTeamDeleteTool()]
      : []),
    ...(VerifyPlanExecutionTool ? [VerifyPlanExecutionTool] : []),
    ...(process.env.USER_TYPE === 'ant' && REPLTool ? [REPLTool] : []),
    ...(WorkflowTool ? [WorkflowTool] : []),
    ...(SleepTool ? [SleepTool] : []),
    ...cronTools,
    ...(RemoteTriggerTool ? [RemoteTriggerTool] : []),
    ...(MonitorTool ? [MonitorTool] : []),
    BriefTool,
    ...(SendUserFileTool ? [SendUserFileTool] : []),
    ...(PushNotificationTool ? [PushNotificationTool] : []),
    ...(SubscribePRTool ? [SubscribePRTool] : []),
    ...(getPowerShellTool() ? [getPowerShellTool()] : []),
    ...(SnipTool ? [SnipTool] : []),
    ...(process.env.NODE_ENV === 'test' ? [TestingPermissionTool] : []),
    ListMcpResourcesTool,
    ReadMcpResourceTool,
    // Include ToolSearchTool when tool search might be enabled (optimistic check)
    // The actual decision to defer tools happens at request time in claude.ts
    ...(isToolSearchEnabledOptimistic() ? [ToolSearchTool] : []),
  ]
}

/**
 * Filters out tools that are blanket-denied by the permission context.
 * A tool is filtered out if there's a deny rule matching its name with no
 * ruleContent (i.e., a blanket deny for that tool).
 *
 * Uses the same matcher as the runtime permission check (step 1a), so MCP
 * server-prefix rules like `mcp__server` strip all tools from that server
 * before the model sees them — not just at call time.
 */
// filterToolsByDenyRules 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterToolsByDenyRules<
  T extends {
    name: string
    mcpInfo?: { serverName: string; toolName: string }
  },
>(tools: readonly T[], permissionContext: ToolPermissionContext): T[] {
  // 返回 `tools.filter(tool => !getDenyRuleForTool(permissionContext, tool))`，作为内置工具注册表这次计算的结果。
  return tools.filter(tool => !getDenyRuleForTool(permissionContext, tool))
}

// getTools 集合封装成回调，供内置工具注册表在事件触发或异步步骤中调用。
export const getTools = (permissionContext: ToolPermissionContext): Tools => {
  // Simple mode: only Bash, Read, and Edit tools
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，内置工具注册表执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // --bare + REPL mode: REPL wraps Bash/Read/Edit/etc inside the VM, so
    // return REPL instead of the raw primitives. Matches the non-bare path
    // below which also hides REPL_ONLY_TOOLS when REPL is enabled.
    // 组合条件 `isReplModeEnabled() && REPLTool` 成立时，内置工具注册表才启用这条专门路径。
    if (isReplModeEnabled() && REPLTool) {
      // replSimple 聚合成有序列表，保持后续遍历顺序稳定。
      const replSimple: Tool[] = [REPLTool]
      // 内置工具注册表在这里进入条件判断，后续代码按实际状态分流。
      if (
        feature('COORDINATOR_MODE') &&
        coordinatorModeModule?.isCoordinatorMode()
      ) {
        // replSimple追加新条目，保持收集顺序与输入顺序一致。
        replSimple.push(TaskStopTool, getSendMessageTool())
      }
      // 返回 `filterToolsByDenyRules(replSimple, permissionContext)`，作为内置工具注册表这次计算的结果。
      return filterToolsByDenyRules(replSimple, permissionContext)
    }
    // simpleTools 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const simpleTools: Tool[] = [BashTool, FileReadTool, FileEditTool]
    // When coordinator mode is also active, include AgentTool and TaskStopTool
    // so the coordinator gets Task+TaskStop (via useMergedTools filtering) and
    // workers get Bash/Read/Edit (via filterToolsForAgent filtering).
    // 内置工具注册表在这里进入条件判断，后续代码按实际状态分流。
    if (
      feature('COORDINATOR_MODE') &&
      coordinatorModeModule?.isCoordinatorMode()
    ) {
      // simpleTools 集合追加新条目，保持收集顺序与输入顺序一致。
      simpleTools.push(AgentTool, TaskStopTool, getSendMessageTool())
    }
    // 返回 `filterToolsByDenyRules(simpleTools, permissionContext)`，作为内置工具注册表这次计算的结果。
    return filterToolsByDenyRules(simpleTools, permissionContext)
  }

  // Get all base tools and filter out special tools that get added conditionally
  // specialTools 集合保存`Set`，供内置工具注册表后续处理使用。
  const specialTools = new Set([
    ListMcpResourcesTool.name,
    ReadMcpResourceTool.name,
    SYNTHETIC_OUTPUT_TOOL_NAME,
  ])

  // tools 集合读取`getAllBaseTools`，供内置工具注册表后续处理使用。
  const tools = getAllBaseTools().filter(tool => !specialTools.has(tool.name))

  // Filter out tools that are denied by the deny rules
  // allowedTools 集合筛选`filterToolsByDenyRules`，供内置工具注册表后续处理使用。
  let allowedTools = filterToolsByDenyRules(tools, permissionContext)

  // When REPL mode is enabled, hide primitive tools from direct use.
  // They're still accessible inside REPL via the VM context.
  // 满足 `isReplModeEnabled()` 时，内置工具注册表执行该分支。
  if (isReplModeEnabled()) {
    // replEnabled筛选`allowedTools.some`，供内置工具注册表后续处理使用。
    const replEnabled = allowedTools.some(tool =>
      toolMatchesName(tool, REPL_TOOL_NAME),
    )
    // 满足 `replEnabled` 时，内置工具注册表执行该分支。
    if (replEnabled) {
      // allowedTools 集合更新为 `allowedTools.filter(`，确保tools后续读取最新状态。
      allowedTools = allowedTools.filter(
        // 工具更新为 `> !REPL_ONLY_TOOLS.has(tool.name)`，确保tools后续读取最新状态。
        tool => !REPL_ONLY_TOOLS.has(tool.name),
      )
    }
  }

  // isEnabled记录 `allowedTools.map` 是否成立，内置工具注册表随后按该结果分支。
  const isEnabled = allowedTools.map(_ => _.isEnabled())
  // 返回 `allowedTools.filter((_, i) => isEnabled[i])`，作为内置工具注册表这次计算的结果。
  return allowedTools.filter((_, i) => isEnabled[i])
}

/**
 * Assemble the full tool pool for a given permission context and MCP tools.
 *
 * This is the single source of truth for combining built-in tools with MCP tools.
 * Both REPL.tsx (via useMergedTools hook) and runAgent.ts (for coordinator workers)
 * use this function to ensure consistent tool pool assembly.
 *
 * The function:
 * 1. Gets built-in tools via getTools() (respects mode filtering)
 * 2. Filters MCP tools by deny rules
 * 3. Deduplicates by tool name (built-in tools take precedence)
 *
 * @param permissionContext - Permission context for filtering built-in tools
 * @param mcpTools - MCP tools from appState.mcp.tools
 * @returns Combined, deduplicated array of built-in and MCP tools
 */
// assembleToolPool 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function assembleToolPool(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools,
): Tools {
  // builtInTools 集合读取`getTools`，供内置工具注册表后续处理使用。
  const builtInTools = getTools(permissionContext)

  // Filter out MCP tools that are in the deny list
  // allowedMcpTools 集合筛选`filterToolsByDenyRules`，供内置工具注册表后续处理使用。
  const allowedMcpTools = filterToolsByDenyRules(mcpTools, permissionContext)

  // Sort each partition for prompt-cache stability, keeping built-ins as a
  // contiguous prefix. The server's claude_code_system_cache_policy places a
  // global cache breakpoint after the last prefix-matched built-in tool; a flat
  // sort would interleave MCP tools into built-ins and invalidate all downstream
  // cache keys whenever an MCP tool sorts between existing built-ins. uniqBy
  // preserves insertion order, so built-ins win on name conflict.
  // Avoid Array.toSorted (Node 20+) — we support Node 18. builtInTools is
  // readonly so copy-then-sort; allowedMcpTools is a fresh .filter() result.
  // byName保存`name.localeCompare`，供内置工具注册表后续处理使用。
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name)
  // 返回 `uniqBy(`，作为内置工具注册表这次计算的结果。
  return uniqBy(
    [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
    'name',
  )
}

/**
 * Get all tools including both built-in tools and MCP tools.
 *
 * This is the preferred function when you need the complete tools list for:
 * - Tool search threshold calculations (isToolSearchEnabled)
 * - Token counting that includes MCP tools
 * - Any context where MCP tools should be considered
 *
 * Use getTools() only when you specifically need just built-in tools.
 *
 * @param permissionContext - Permission context for filtering built-in tools
 * @param mcpTools - MCP tools from appState.mcp.tools
 * @returns Combined array of built-in and MCP tools
 */
// getMergedTools 封装tools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMergedTools(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools,
): Tools {
  // builtInTools 集合读取`getTools`，供内置工具注册表后续处理使用。
  const builtInTools = getTools(permissionContext)
  // 返回列表结果，保留内置工具注册表已经排好的条目顺序。
  return [...builtInTools, ...mcpTools]
}
