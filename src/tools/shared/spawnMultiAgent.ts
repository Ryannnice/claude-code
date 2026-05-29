/**
 * Shared spawn module for teammate creation.
 * Extracted from TeammateTool to allow reuse by AgentTool.
 */

// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getChromeFlagOverride,
  getFlagSettingsPath,
  getInlinePlugins,
  getMainLoopModelOverride,
  getSessionBypassPermissionsMode,
  getSessionId,
} from '../../bootstrap/state.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准工具调用的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 createTaskStateBase、generateTaskId，将 ../../Task.js 中已经封装好的能力接到本文件流程里。
import { createTaskStateBase, generateTaskId } from '../../Task.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { InProcessTeammateTaskState } 来自 ../../tasks/InProcessTeammateTask/types.js，用于校准工具调用的数据契约。
import type { InProcessTeammateTaskState } from '../../tasks/InProcessTeammateTask/types.js'
// 复用 formatAgentId 工具函数，把通用处理留在 ../../utils/agentId.js 中维护。
import { formatAgentId } from '../../utils/agentId.js'
// 复用 quote 工具函数，把通用处理留在 ../../utils/bash/shellQuote.js 中维护。
import { quote } from '../../utils/bash/shellQuote.js'
// 复用 isInBundledMode 工具函数，把通用处理留在 ../../utils/bundledMode.js 中维护。
import { isInBundledMode } from '../../utils/bundledMode.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig } from '../../utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
// 复用 parseUserSpecifiedModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { parseUserSpecifiedModel } from '../../utils/model/model.js'
// 类型依赖 { PermissionMode } 来自 ../../utils/permissions/PermissionMode.js，用于校准工具调用的数据契约。
import type { PermissionMode } from '../../utils/permissions/PermissionMode.js'
// 复用 isTmuxAvailable 工具函数，把通用处理留在 ../../utils/swarm/backends/detection.js 中维护。
import { isTmuxAvailable } from '../../utils/swarm/backends/detection.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  detectAndGetBackend,
  getBackendByType,
  isInProcessEnabled,
  markInProcessFallback,
  resetBackendDetection,
} from '../../utils/swarm/backends/registry.js'
// 复用 getTeammateModeFromSnapshot 工具函数，把通用处理留在 ../../utils/swarm/backends/teammateModeSnapshot.js 中维护。
import { getTeammateModeFromSnapshot } from '../../utils/swarm/backends/teammateModeSnapshot.js'
// 类型依赖 { BackendType } 来自 ../../utils/swarm/backends/types.js，用于校准工具调用的数据契约。
import type { BackendType } from '../../utils/swarm/backends/types.js'
// 复用 isPaneBackend 工具函数，把通用处理留在 ../../utils/swarm/backends/types.js 中维护。
import { isPaneBackend } from '../../utils/swarm/backends/types.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  SWARM_SESSION_NAME,
  TEAM_LEAD_NAME,
  TEAMMATE_COMMAND_ENV_VAR,
  TMUX_COMMAND,
} from '../../utils/swarm/constants.js'
// 复用 It2SetupPrompt 工具函数，把通用处理留在 ../../utils/swarm/It2SetupPrompt.js 中维护。
import { It2SetupPrompt } from '../../utils/swarm/It2SetupPrompt.js'
// 复用 startInProcessTeammate 工具函数，把通用处理留在 ../../utils/swarm/inProcessRunner.js 中维护。
import { startInProcessTeammate } from '../../utils/swarm/inProcessRunner.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type InProcessSpawnConfig,
  spawnInProcessTeammate,
} from '../../utils/swarm/spawnInProcess.js'
// 复用 buildInheritedEnvVars 工具函数，把通用处理留在 ../../utils/swarm/spawnUtils.js 中维护。
import { buildInheritedEnvVars } from '../../utils/swarm/spawnUtils.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  readTeamFileAsync,
  sanitizeAgentName,
  sanitizeName,
  writeTeamFileAsync,
} from '../../utils/swarm/teamHelpers.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  assignTeammateColor,
  createTeammatePaneInSwarmView,
  enablePaneBorderStatus,
  isInsideTmux,
  sendCommandToPane,
} from '../../utils/swarm/teammateLayoutManager.js'
// 复用 getHardcodedTeammateModelFallback 工具函数，把通用处理留在 ../../utils/swarm/teammateModel.js 中维护。
import { getHardcodedTeammateModelFallback } from '../../utils/swarm/teammateModel.js'
// 复用 registerTask 工具函数，把通用处理留在 ../../utils/task/framework.js 中维护。
import { registerTask } from '../../utils/task/framework.js'
// 复用 writeToMailbox 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { writeToMailbox } from '../../utils/teammateMailbox.js'
// 类型依赖 { CustomAgentDefinition } 来自 ../AgentTool/loadAgentsDir.js，用于校准工具调用的数据契约。
import type { CustomAgentDefinition } from '../AgentTool/loadAgentsDir.js'
// 引入 isCustomAgent，将 ../AgentTool/loadAgentsDir.js 中已经封装好的能力接到本文件流程里。
import { isCustomAgent } from '../AgentTool/loadAgentsDir.js'

// getDefaultTeammateModel 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDefaultTeammateModel(leaderModel: string | null): string {
  // configured 配置读取`getGlobalConfig`，供工具调用后续处理使用。
  const configured = getGlobalConfig().teammateDefaultModel
  // 满足 `configured === null` 时，工具调用执行该分支。
  if (configured === null) {
    // User picked "Default" in the /config picker — follow the leader.
    // 返回 `leaderModel ?? getHardcodedTeammateModelFallback()`，作为工具调用这次计算的结果。
    return leaderModel ?? getHardcodedTeammateModelFallback()
  }
  // `configured` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (configured !== undefined) {
    // 返回 `parseUserSpecifiedModel(configured)`，作为工具调用这次计算的结果。
    return parseUserSpecifiedModel(configured)
  }
  // 返回 `getHardcodedTeammateModelFallback()`，作为工具调用这次计算的结果。
  return getHardcodedTeammateModelFallback()
}

/**
 * Resolve a teammate model value. Handles the 'inherit' alias (from agent
 * frontmatter) by substituting the leader's model. gh-31069: 'inherit' was
 * passed literally to --model, producing "It may not exist or you may not
 * have access". If leader model is null (not yet set), falls through to the
 * default.
 *
 * Exported for testing.
 */
// resolveTeammateModel 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveTeammateModel(
  inputModel: string | undefined,
  leaderModel: string | null,
): string {
  // 当 `inputModel` 匹配 `'inherit'` 时，工具调用执行对应分支。
  if (inputModel === 'inherit') {
    // 返回 `leaderModel ?? getDefaultTeammateModel(leaderModel)`，作为工具调用这次计算的结果。
    return leaderModel ?? getDefaultTeammateModel(leaderModel)
  }
  // 返回 `inputModel ?? getDefaultTeammateModel(leaderModel)`，作为工具调用这次计算的结果。
  return inputModel ?? getDefaultTeammateModel(leaderModel)
}

// ============================================================================
// Types
// ============================================================================

// SpawnOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpawnOutput = {
  teammate_id: string
  agent_id: string
  agent_type?: string
  model?: string
  name: string
  color?: string
  tmux_session_name: string
  tmux_window_name: string
  tmux_pane_id: string
  team_name?: string
  is_splitpane?: boolean
  plan_mode_required?: boolean
}

// SpawnTeammateConfig 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpawnTeammateConfig = {
  name: string
  prompt: string
  team_name?: string
  cwd?: string
  use_splitpane?: boolean
  plan_mode_required?: boolean
  model?: string
  agent_type?: string
  description?: string
  /** request_id of the API call whose response contained the tool_use that
   *  spawned this teammate. Threaded through to TeammateAgentContext for
   *  lineage tracing on tengu_api_* events. */
  invokingRequestId?: string
}

// Internal input type matching TeammateTool's spawn parameters
// SpawnInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SpawnInput = {
  name: string
  prompt: string
  team_name?: string
  cwd?: string
  use_splitpane?: boolean
  plan_mode_required?: boolean
  model?: string
  agent_type?: string
  description?: string
  invokingRequestId?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a tmux session exists
 */
// hasSession 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function hasSession(sessionName: string): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供工具调用后续处理使用。
  const result = await execFileNoThrow(TMUX_COMMAND, [
    'has-session',
    '-t',
    sessionName,
  ])
  // 返回 `result.code === 0`，作为工具调用这次计算的结果。
  return result.code === 0
}

/**
 * Creates a new tmux session if it doesn't exist
 */
// ensureSession 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensureSession(sessionName: string): Promise<void> {
  // exists 集合保存`hasSession`，供工具调用后续处理使用。
  const exists = await hasSession(sessionName)
  // exists 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!exists) {
    // 结果保存`execFileNoThrow`，供工具调用后续处理使用。
    const result = await execFileNoThrow(TMUX_COMMAND, [
      'new-session',
      '-d',
      '-s',
      sessionName,
    ])
    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        `Failed to create tmux session '${sessionName}': ${result.stderr || 'Unknown error'}`,
      )
    }
  }
}

/**
 * Gets the command to spawn a teammate.
 * For native builds (compiled binaries), use process.execPath.
 * For non-native (node/bun running a script), use process.argv[1].
 */
// getTeammateCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTeammateCommand(): string {
  // 满足 `process.env[TEAMMATE_COMMAND_ENV_VAR]` 时，工具调用执行该分支。
  if (process.env[TEAMMATE_COMMAND_ENV_VAR]) {
    // 返回 `process.env[TEAMMATE_COMMAND_ENV_VAR]`，作为工具调用这次计算的结果。
    return process.env[TEAMMATE_COMMAND_ENV_VAR]
  }
  // 返回 `isInBundledMode() ? process.execPath : process.argv[1]!`，作为工具调用这次计算的结果。
  return isInBundledMode() ? process.execPath : process.argv[1]!
}

/**
 * Builds CLI flags to propagate from the current session to spawned teammates.
 * This ensures teammates inherit important settings like permission mode,
 * model selection, and plugin configuration from their parent.
 *
 * @param options.planModeRequired - If true, don't inherit bypass permissions (plan mode takes precedence)
 * @param options.permissionMode - Permission mode to propagate
 */
// buildInheritedCliFlags 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildInheritedCliFlags(options?: {
  planModeRequired?: boolean
  permissionMode?: PermissionMode
}): string {
  // flags 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const flags: string[] = []
  // 从 `options || {}` 解构 planModeRequired、permissionMode，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { planModeRequired, permissionMode } = options || {}

  // Propagate permission mode to teammates, but NOT if plan mode is required
  // Plan mode takes precedence over bypass permissions for safety
  // 满足 `planModeRequired` 时，工具调用执行该分支。
  if (planModeRequired) {
    // Don't inherit bypass permissions when plan mode is required
  // 工具实现 spawn Multi Agent在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    permissionMode === 'bypassPermissions' ||
    getSessionBypassPermissionsMode()
  ) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--dangerously-skip-permissions')
  // 工具实现 spawn Multi Agent在这里处理 `} else if (permissionMode === 'acceptEdits') {`，完成这一小步状态转换。
  } else if (permissionMode === 'acceptEdits') {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--permission-mode acceptEdits')
  // 工具实现 spawn Multi Agent在这里处理 `} else if (permissionMode === 'auto') {`，完成这一小步状态转换。
  } else if (permissionMode === 'auto') {
    // Teammates inherit auto mode so the classifier auto-approves their tool
    // calls too. The teammate's own startup (permissionSetup.ts) handles
    // GrowthBook gate checks and setAutoModeActive(true) independently.
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--permission-mode auto')
  }

  // Propagate --model if explicitly set via CLI
  // modelOverride读取`getMainLoopModelOverride`，供工具调用后续处理使用。
  const modelOverride = getMainLoopModelOverride()
  // 满足 `modelOverride` 时，工具调用执行该分支。
  if (modelOverride) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--model ${quote([modelOverride])}`)
  }

  // Propagate --settings if set via CLI
  // settingsPath 路径数据读取`getFlagSettingsPath`，供工具调用后续处理使用。
  const settingsPath = getFlagSettingsPath()
  // 满足 `settingsPath` 时，工具调用执行该分支。
  if (settingsPath) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--settings ${quote([settingsPath])}`)
  }

  // Propagate --plugin-dir for each inline plugin
  // inlinePlugins 插件数据读取`getInlinePlugins`，供工具调用后续处理使用。
  const inlinePlugins = getInlinePlugins()
  // 按顺序遍历 `inlinePlugins` 中的pluginDir 插件数据，逐个交给工具调用处理。
  for (const pluginDir of inlinePlugins) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--plugin-dir ${quote([pluginDir])}`)
  }

  // Propagate --chrome / --no-chrome if explicitly set on the CLI
  // chromeFlagOverride读取`getChromeFlagOverride`，供工具调用后续处理使用。
  const chromeFlagOverride = getChromeFlagOverride()
  // 满足 `chromeFlagOverride === true` 时，工具调用执行该分支。
  if (chromeFlagOverride === true) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--chrome')
  // 工具实现 spawn Multi Agent在这里处理 `} else if (chromeFlagOverride === false) {`，完成这一小步状态转换。
  } else if (chromeFlagOverride === false) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--no-chrome')
  }

  // 返回 `flags.join(' ')`，作为工具调用这次计算的结果。
  return flags.join(' ')
}

/**
 * Generates a unique teammate name by checking existing team members.
 * If the name already exists, appends a numeric suffix (e.g., tester-2, tester-3).
 * @internal Exported for testing
 */
// generateUniqueTeammateName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateUniqueTeammateName(
  baseName: string,
  teamName: string | undefined,
): Promise<string> {
  // teamName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamName) {
    // 返回 `baseName`，作为工具调用这次计算的结果。
    return baseName
  }

  // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamFile) {
    // 返回 `baseName`，作为工具调用这次计算的结果。
    return baseName
  }

  // existingNames 集合保存`Set`，供工具调用后续处理使用。
  const existingNames = new Set(teamFile.members.map(m => m.name.toLowerCase()))

  // If the base name doesn't exist, use it as-is
  // 满足 `!existingNames.has(baseName.toLowerCase())` 时，工具调用执行该分支。
  if (!existingNames.has(baseName.toLowerCase())) {
    // 返回 `baseName`，作为工具调用这次计算的结果。
    return baseName
  }

  // Find the next available suffix
  // suffix 命名 `2`，让后续代码直接表达这个值的用途。
  let suffix = 2
  // 只要 existingNames.has(`${baseName}-${suffix}`.toLowerCase()) 成立，就持续推进工具调用中的循环处理。
  while (existingNames.has(`${baseName}-${suffix}`.toLowerCase())) {
    // 工具实现 spawn Multi Agent在这里处理 `suffix++`，完成这一小步状态转换。
    suffix++
  }

  // 返回 ``${baseName}-${suffix}``，作为工具调用这次计算的结果。
  return `${baseName}-${suffix}`
}

// ============================================================================
// Spawn Handlers
// ============================================================================

/**
 * Handle spawn operation using split-pane view (default).
 * When inside tmux: Creates teammates in a shared window with leader on left, teammates on right.
 * When outside tmux: Creates a claude-swarm session with all teammates in a tiled layout.
 */
// handleSpawnSplitPane 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSpawnSplitPane(
  input: SpawnInput,
  context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  // 从 `context` 解构 setAppState、getAppState，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { setAppState, getAppState } = context
  // 从 `input` 解构 name、prompt、agent_type、cwd，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { name, prompt, agent_type, cwd, plan_mode_required } = input

  // Resolve model: 'inherit' → leader's model; undefined → default Opus
  // 模型名称读取`resolveTeammateModel`，供工具调用后续处理使用。
  const model = resolveTeammateModel(input.model, getAppState().mainLoopModel)

  // 只有 `!name || !prompt` 满足时，工具调用才执行该分支。
  if (!name || !prompt) {
    // 抛出 new Error('name and prompt are required for spawn operation')，阻止工具调用在无效状态下继续运行。
    throw new Error('name and prompt are required for spawn operation')
  }

  // Get team name from input or inherit from leader's team context
  // appState 状态读取`getAppState`，供工具调用后续处理使用。
  const appState = getAppState()
  // teamName标记工具实现 spawn Multi Agent是否启用对应路径。
  const teamName = input.team_name || appState.teamContext?.teamName

  // teamName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamName) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'team_name is required for spawn operation. Either provide team_name in input or call spawnTeam first to establish team context.',
    )
  }

  // Generate unique name if duplicate exists in team
  // uniqueName保存`generateUniqueTeammateName`，供工具调用后续处理使用。
  const uniqueName = await generateUniqueTeammateName(name, teamName)

  // Sanitize the name to prevent @ in agent IDs (would break agentName@teamName format)
  // sanitizedName保存`sanitizeAgentName`，供工具调用后续处理使用。
  const sanitizedName = sanitizeAgentName(uniqueName)

  // Generate deterministic agent ID from name and team
  // teammateId格式化`formatAgentId`，供工具调用后续处理使用。
  const teammateId = formatAgentId(sanitizedName, teamName)
  // workingDir读取`getCwd`，供工具调用后续处理使用。
  const workingDir = cwd || getCwd()

  // Detect the appropriate backend and check if setup is needed
  // detectionResult读取`detectAndGetBackend`，供工具调用后续处理使用。
  let detectionResult = await detectAndGetBackend()

  // If in iTerm2 but it2 isn't set up, prompt the user
  // 只有 `detectionResult.needsIt2Setup && context.setToolJ` 满足时，工具调用才执行该分支。
  if (detectionResult.needsIt2Setup && context.setToolJSX) {
    // tmuxAvailable保存`isTmuxAvailable`，供工具调用后续处理使用。
    const tmuxAvailable = await isTmuxAvailable()

    // Show the setup prompt and wait for user decision
    // setupResult 等待 `new Promise<`，确保继续执行前已有结果。
    const setupResult = await new Promise<
      'installed' | 'use-tmux' | 'cancelled'
    // 这个回调绑定到 >(resolve => {，负责工具调用在该局部场景下的响应。
    >(resolve => {
      // 工具实现 spawn Multi Agent在这里处理 `context.setToolJSX!({`，完成这一小步状态转换。
      context.setToolJSX!({
        jsx: React.createElement(It2SetupPrompt, {
          onDone: resolve,
          tmuxAvailable,
        }),
        shouldHidePromptInput: true,
      })
    })

    // Clear the JSX
    // context.setToolJSX 写入新的状态值，使工具调用后续读取保持一致。
    context.setToolJSX(null)

    // 当 `setupResult` 匹配 `'cancelled'` 时，工具调用执行对应分支。
    if (setupResult === 'cancelled') {
      // 抛出 new Error('Teammate spawn cancelled - iTerm2 setup required')，阻止工具调用在无效状态下继续运行。
      throw new Error('Teammate spawn cancelled - iTerm2 setup required')
    }

    // If they installed it2 or chose tmux, clear cached detection and re-fetch
    // so the local detectionResult matches the backend that will actually
    // spawn the pane.
    // - 'installed': re-detect to pick up the ITermBackend (it2 is now available)
    // - 'use-tmux': re-detect so needsIt2Setup is false (preferTmux is now saved)
    //   and subsequent spawns skip this prompt
    // 只有 `setupResult === 'installed' || setupResult === 'u` 满足时，工具调用才执行该分支。
    if (setupResult === 'installed' || setupResult === 'use-tmux') {
      // 调用 resetBackendDetection，触发工具调用此处需要的副作用。
      resetBackendDetection()
      // detectionResult更新为 `await detectAndGetBackend()`，确保工具调用后续读取最新状态。
      detectionResult = await detectAndGetBackend()
    }
  }

  // Check if we're inside tmux to determine session naming
  // insideTmux保存`isInsideTmux`，供工具调用后续处理使用。
  const insideTmux = await isInsideTmux()

  // Assign a unique color to this teammate
  // teammateColor保存`assignTeammateColor`，供工具调用后续处理使用。
  const teammateColor = assignTeammateColor(teammateId)

  // Create a pane in the swarm view
  // - Inside tmux: splits current window (leader on left, teammates on right)
  // - In iTerm2 with it2: uses native iTerm2 split panes
  // - Outside both: creates claude-swarm session with tiled teammates
  // 从 `await createTeammatePaneInSwarmView(` 解构 paneId、isFirstTeammate，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { paneId, isFirstTeammate } = await createTeammatePaneInSwarmView(
    sanitizedName,
    teammateColor,
  )

  // Enable pane border status on first teammate when inside tmux
  // (outside tmux, this is handled in createTeammatePaneInSwarmView)
  // 只有 `isFirstTeammate && insideTmux` 满足时，工具调用才执行该分支。
  if (isFirstTeammate && insideTmux) {
    // 等待 `enablePaneBorderStatus()` 完成，再继续工具实现 spawn Multi Agent的异步流程。
    await enablePaneBorderStatus()
  }

  // Build the command to spawn Claude Code with teammate identity
  // Note: We spawn without a prompt - initial instructions are sent via mailbox
  // binaryPath 路径数据读取`getTeammateCommand`，供工具调用后续处理使用。
  const binaryPath = getTeammateCommand()

  // Build teammate identity CLI args (replaces CLAUDE_CODE_* env vars)
  // teammateArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const teammateArgs = [
    `--agent-id ${quote([teammateId])}`,
    `--agent-name ${quote([sanitizedName])}`,
    `--team-name ${quote([teamName])}`,
    `--agent-color ${quote([teammateColor])}`,
    `--parent-session-id ${quote([getSessionId()])}`,
    plan_mode_required ? '--plan-mode-required' : '',
    agent_type ? `--agent-type ${quote([agent_type])}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Build CLI flags to propagate to teammate
  // Pass plan_mode_required to prevent inheriting bypass permissions
  // inheritedFlags 集合构建`buildInheritedCliFlags`，供工具调用后续处理使用。
  let inheritedFlags = buildInheritedCliFlags({
    planModeRequired: plan_mode_required,
    permissionMode: appState.toolPermissionContext.mode,
  })

  // If teammate has a custom model, add --model flag (or replace inherited one)
  // 满足 `model` 时，工具调用执行该分支。
  if (model) {
    // Remove any inherited --model flag first
    // inheritedFlags 集合更新为 `inheritedFlags`，确保工具调用后续读取最新状态。
    inheritedFlags = inheritedFlags
      .split(' ')
      // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
      .filter((flag, i, arr) => flag !== '--model' && arr[i - 1] !== '--model')
      .join(' ')
    // Add the teammate's model
    // inheritedFlags 集合更新为 `inheritedFlags`，确保工具调用后续读取最新状态。
    inheritedFlags = inheritedFlags
      ? `${inheritedFlags} --model ${quote([model])}`
      : `--model ${quote([model])}`
  }

  // flagsStr保存`inheritedFlags ? ` ${inheritedFlags}` : ''`，供后续判断或组装使用。
  const flagsStr = inheritedFlags ? ` ${inheritedFlags}` : ''
  // Propagate env vars that teammates need but may not inherit from tmux split-window shells.
  // Includes CLAUDECODE, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, and API provider vars.
  // envStr构建`buildInheritedEnvVars`，供工具调用后续处理使用。
  const envStr = buildInheritedEnvVars()
  // spawnCommand 命令数据保存`quote`，供工具调用后续处理使用。
  const spawnCommand = `cd ${quote([workingDir])} && env ${envStr} ${quote([binaryPath])} ${teammateArgs}${flagsStr}`

  // Send the command to the new pane
  // Use swarm socket when running outside tmux (external swarm session)
  // 等待 `sendCommandToPane(paneId, spawnCommand, !insideTmux)` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await sendCommandToPane(paneId, spawnCommand, !insideTmux)

  // Determine session/window names for output
  // sessionName 会话数据保存`insideTmux ? 'current' : SWARM_SESSION_NAME`，供工具实现 spawn Multi Agent后续判断或输出使用。
  const sessionName = insideTmux ? 'current' : SWARM_SESSION_NAME
  // windowName保存`insideTmux ? 'current' : 'swarm-view'`，供后续判断或组装使用。
  const windowName = insideTmux ? 'current' : 'swarm-view'

  // Track the teammate in AppState's teamContext with color
  // If spawning without spawnTeam, set up the leader as team lead
  // setAppState 写入新的状态值，使工具调用后续读取保持一致。
  setAppState(prev => ({
    ...prev,
    teamContext: {
      ...prev.teamContext,
      teamName: teamName ?? prev.teamContext?.teamName ?? 'default',
      teamFilePath: prev.teamContext?.teamFilePath ?? '',
      leadAgentId: prev.teamContext?.leadAgentId ?? '',
      teammates: {
        ...(prev.teamContext?.teammates || {}),
        [teammateId]: {
          name: sanitizedName,
          agentType: agent_type,
          color: teammateColor,
          tmuxSessionName: sessionName,
          tmuxPaneId: paneId,
          cwd: workingDir,
          spawnedAt: Date.now(),
        },
      },
    },
  }))

  // Register background task so teammates appear in the tasks pill/dialog
  // 调用 registerOutOfProcessTeammateTask，触发工具调用此处需要的副作用。
  registerOutOfProcessTeammateTask(setAppState, {
    teammateId,
    sanitizedName,
    teamName,
    teammateColor,
    prompt,
    plan_mode_required,
    paneId,
    insideTmux,
    backendType: detectionResult.backend.type,
    toolUseId: context.toolUseId,
  })

  // Register agent in the team file
  // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamFile) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Team "${teamName}" does not exist. Call spawnTeam first to create the team.`,
    )
  }
  // members 集合追加新条目，保持收集顺序与输入顺序一致。
  teamFile.members.push({
    agentId: teammateId,
    name: sanitizedName,
    agentType: agent_type,
    model,
    prompt,
    color: teammateColor,
    planModeRequired: plan_mode_required,
    joinedAt: Date.now(),
    tmuxPaneId: paneId,
    cwd: workingDir,
    subscriptions: [],
    backendType: detectionResult.backend.type,
  })
  // 等待 `writeTeamFileAsync(teamName, teamFile)` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await writeTeamFileAsync(teamName, teamFile)

  // Send initial instructions to teammate via mailbox
  // The teammate's inbox poller will pick this up and submit it as their first turn
  // 等待 `writeToMailbox(` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await writeToMailbox(
    sanitizedName,
    {
      from: TEAM_LEAD_NAME,
      text: prompt,
      timestamp: new Date().toISOString(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      teammate_id: teammateId,
      agent_id: teammateId,
      agent_type,
      model,
      name: sanitizedName,
      color: teammateColor,
      tmux_session_name: sessionName,
      tmux_window_name: windowName,
      tmux_pane_id: paneId,
      team_name: teamName,
      is_splitpane: true,
      plan_mode_required,
    },
  }
}

/**
 * Handle spawn operation using separate windows (legacy behavior).
 * Creates each teammate in its own tmux window.
 */
// handleSpawnSeparateWindow 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSpawnSeparateWindow(
  input: SpawnInput,
  context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  // 从 `context` 解构 setAppState、getAppState，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { setAppState, getAppState } = context
  // 从 `input` 解构 name、prompt、agent_type、cwd，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { name, prompt, agent_type, cwd, plan_mode_required } = input

  // Resolve model: 'inherit' → leader's model; undefined → default Opus
  // 模型名称读取`resolveTeammateModel`，供工具调用后续处理使用。
  const model = resolveTeammateModel(input.model, getAppState().mainLoopModel)

  // 只有 `!name || !prompt` 满足时，工具调用才执行该分支。
  if (!name || !prompt) {
    // 抛出 new Error('name and prompt are required for spawn operation')，阻止工具调用在无效状态下继续运行。
    throw new Error('name and prompt are required for spawn operation')
  }

  // Get team name from input or inherit from leader's team context
  // appState 状态读取`getAppState`，供工具调用后续处理使用。
  const appState = getAppState()
  // teamName标记工具实现 spawn Multi Agent是否启用对应路径。
  const teamName = input.team_name || appState.teamContext?.teamName

  // teamName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamName) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'team_name is required for spawn operation. Either provide team_name in input or call spawnTeam first to establish team context.',
    )
  }

  // Generate unique name if duplicate exists in team
  // uniqueName保存`generateUniqueTeammateName`，供工具调用后续处理使用。
  const uniqueName = await generateUniqueTeammateName(name, teamName)

  // Sanitize the name to prevent @ in agent IDs (would break agentName@teamName format)
  // sanitizedName保存`sanitizeAgentName`，供工具调用后续处理使用。
  const sanitizedName = sanitizeAgentName(uniqueName)

  // Generate deterministic agent ID from name and team
  // teammateId格式化`formatAgentId`，供工具调用后续处理使用。
  const teammateId = formatAgentId(sanitizedName, teamName)
  // windowName保存`sanitizeName`，供工具调用后续处理使用。
  const windowName = `teammate-${sanitizeName(sanitizedName)}`
  // workingDir读取`getCwd`，供工具调用后续处理使用。
  const workingDir = cwd || getCwd()

  // Ensure the swarm session exists
  // 等待 `ensureSession(SWARM_SESSION_NAME)` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await ensureSession(SWARM_SESSION_NAME)

  // Assign a unique color to this teammate
  // teammateColor保存`assignTeammateColor`，供工具调用后续处理使用。
  const teammateColor = assignTeammateColor(teammateId)

  // Create a new window for this teammate
  // createWindowResult保存`execFileNoThrow`，供工具调用后续处理使用。
  const createWindowResult = await execFileNoThrow(TMUX_COMMAND, [
    'new-window',
    '-t',
    SWARM_SESSION_NAME,
    '-n',
    windowName,
    '-P',
    '-F',
    '#{pane_id}',
  ])

  // `createWindowResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (createWindowResult.code !== 0) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Failed to create tmux window: ${createWindowResult.stderr}`,
    )
  }

  // paneId格式化`stdout.trim`，供工具调用后续处理使用。
  const paneId = createWindowResult.stdout.trim()

  // Build the command to spawn Claude Code with teammate identity
  // Note: We spawn without a prompt - initial instructions are sent via mailbox
  // binaryPath 路径数据读取`getTeammateCommand`，供工具调用后续处理使用。
  const binaryPath = getTeammateCommand()

  // Build teammate identity CLI args (replaces CLAUDE_CODE_* env vars)
  // teammateArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const teammateArgs = [
    `--agent-id ${quote([teammateId])}`,
    `--agent-name ${quote([sanitizedName])}`,
    `--team-name ${quote([teamName])}`,
    `--agent-color ${quote([teammateColor])}`,
    `--parent-session-id ${quote([getSessionId()])}`,
    plan_mode_required ? '--plan-mode-required' : '',
    agent_type ? `--agent-type ${quote([agent_type])}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Build CLI flags to propagate to teammate
  // Pass plan_mode_required to prevent inheriting bypass permissions
  // inheritedFlags 集合构建`buildInheritedCliFlags`，供工具调用后续处理使用。
  let inheritedFlags = buildInheritedCliFlags({
    planModeRequired: plan_mode_required,
    permissionMode: appState.toolPermissionContext.mode,
  })

  // If teammate has a custom model, add --model flag (or replace inherited one)
  // 满足 `model` 时，工具调用执行该分支。
  if (model) {
    // Remove any inherited --model flag first
    // inheritedFlags 集合更新为 `inheritedFlags`，确保工具调用后续读取最新状态。
    inheritedFlags = inheritedFlags
      .split(' ')
      // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
      .filter((flag, i, arr) => flag !== '--model' && arr[i - 1] !== '--model')
      .join(' ')
    // Add the teammate's model
    // inheritedFlags 集合更新为 `inheritedFlags`，确保工具调用后续读取最新状态。
    inheritedFlags = inheritedFlags
      ? `${inheritedFlags} --model ${quote([model])}`
      : `--model ${quote([model])}`
  }

  // flagsStr保存`inheritedFlags ? ` ${inheritedFlags}` : ''`，供后续判断或组装使用。
  const flagsStr = inheritedFlags ? ` ${inheritedFlags}` : ''
  // Propagate env vars that teammates need but may not inherit from tmux split-window shells.
  // Includes CLAUDECODE, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, and API provider vars.
  // envStr构建`buildInheritedEnvVars`，供工具调用后续处理使用。
  const envStr = buildInheritedEnvVars()
  // spawnCommand 命令数据保存`quote`，供工具调用后续处理使用。
  const spawnCommand = `cd ${quote([workingDir])} && env ${envStr} ${quote([binaryPath])} ${teammateArgs}${flagsStr}`

  // Send the command to the new window
  // sendKeysResult保存`execFileNoThrow`，供工具调用后续处理使用。
  const sendKeysResult = await execFileNoThrow(TMUX_COMMAND, [
    'send-keys',
    '-t',
    `${SWARM_SESSION_NAME}:${windowName}`,
    spawnCommand,
    'Enter',
  ])

  // `sendKeysResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (sendKeysResult.code !== 0) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Failed to send command to tmux window: ${sendKeysResult.stderr}`,
    )
  }

  // Track the teammate in AppState's teamContext
  // setAppState 写入新的状态值，使工具调用后续读取保持一致。
  setAppState(prev => ({
    ...prev,
    teamContext: {
      ...prev.teamContext,
      teamName: teamName ?? prev.teamContext?.teamName ?? 'default',
      teamFilePath: prev.teamContext?.teamFilePath ?? '',
      leadAgentId: prev.teamContext?.leadAgentId ?? '',
      teammates: {
        ...(prev.teamContext?.teammates || {}),
        [teammateId]: {
          name: sanitizedName,
          agentType: agent_type,
          color: teammateColor,
          tmuxSessionName: SWARM_SESSION_NAME,
          tmuxPaneId: paneId,
          cwd: workingDir,
          spawnedAt: Date.now(),
        },
      },
    },
  }))

  // Register background task so tmux teammates appear in the tasks pill/dialog
  // Separate window spawns are always outside tmux (external swarm session)
  // 调用 registerOutOfProcessTeammateTask，触发工具调用此处需要的副作用。
  registerOutOfProcessTeammateTask(setAppState, {
    teammateId,
    sanitizedName,
    teamName,
    teammateColor,
    prompt,
    plan_mode_required,
    paneId,
    insideTmux: false,
    backendType: 'tmux',
    toolUseId: context.toolUseId,
  })

  // Register agent in the team file
  // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamFile) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Team "${teamName}" does not exist. Call spawnTeam first to create the team.`,
    )
  }
  // members 集合追加新条目，保持收集顺序与输入顺序一致。
  teamFile.members.push({
    agentId: teammateId,
    name: sanitizedName,
    agentType: agent_type,
    model,
    prompt,
    color: teammateColor,
    planModeRequired: plan_mode_required,
    joinedAt: Date.now(),
    tmuxPaneId: paneId,
    cwd: workingDir,
    subscriptions: [],
    backendType: 'tmux', // This handler always uses tmux directly
  })
  // 等待 `writeTeamFileAsync(teamName, teamFile)` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await writeTeamFileAsync(teamName, teamFile)

  // Send initial instructions to teammate via mailbox
  // The teammate's inbox poller will pick this up and submit it as their first turn
  // 等待 `writeToMailbox(` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await writeToMailbox(
    sanitizedName,
    {
      from: TEAM_LEAD_NAME,
      text: prompt,
      timestamp: new Date().toISOString(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      teammate_id: teammateId,
      agent_id: teammateId,
      agent_type,
      model,
      name: sanitizedName,
      color: teammateColor,
      tmux_session_name: SWARM_SESSION_NAME,
      tmux_window_name: windowName,
      tmux_pane_id: paneId,
      team_name: teamName,
      is_splitpane: false,
      plan_mode_required,
    },
  }
}

/**
 * Register a background task entry for an out-of-process (tmux/iTerm2) teammate.
 * This makes tmux teammates visible in the background tasks pill and dialog,
 * matching how in-process teammates are tracked.
 */
// registerOutOfProcessTeammateTask 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function registerOutOfProcessTeammateTask(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责工具调用在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  {
    teammateId,
    sanitizedName,
    teamName,
    teammateColor,
    prompt,
    plan_mode_required,
    paneId,
    insideTmux,
    backendType,
    toolUseId,
  }: {
    teammateId: string
    sanitizedName: string
    teamName: string
    teammateColor: string
    prompt: string
    plan_mode_required?: boolean
    paneId: string
    insideTmux: boolean
    backendType: BackendType
    toolUseId?: string
  },
): void {
  // taskId保存`generateTaskId`，供工具调用后续处理使用。
  const taskId = generateTaskId('in_process_teammate')
  // description格式化`prompt.substring`，供工具调用后续处理使用。
  const description = `${sanitizedName}: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`

  // abortController保存`AbortController`，供工具调用后续处理使用。
  const abortController = new AbortController()

  // taskState 状态 集中保存工具实现 spawn Multi Agent要一起传递的字段。
  const taskState: InProcessTeammateTaskState = {
    ...createTaskStateBase(
      taskId,
      'in_process_teammate',
      description,
      toolUseId,
    ),
    type: 'in_process_teammate',
    status: 'running',
    identity: {
      agentId: teammateId,
      agentName: sanitizedName,
      teamName,
      color: teammateColor,
      planModeRequired: plan_mode_required ?? false,
      parentSessionId: getSessionId(),
    },
    prompt,
    abortController,
    awaitingPlanApproval: false,
    permissionMode: plan_mode_required ? 'plan' : 'default',
    isIdle: false,
    shutdownRequested: false,
    lastReportedToolCount: 0,
    lastReportedTokenCount: 0,
    pendingUserMessages: [],
  }

  // 调用 registerTask，触发工具调用此处需要的副作用。
  registerTask(taskState, setAppState)

  // When abort is signaled, kill the pane using the backend that created it
  // (tmux kill-pane for tmux panes, it2 session close for iTerm2 native panes).
  // SDK task_notification bookend is emitted by killInProcessTeammate (the
  // sole abort trigger for this controller).
  // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
  abortController.signal.addEventListener(
    'abort',
    // 这个回调绑定到 () => {，负责工具调用在该局部场景下的响应。
    () => {
      // 满足 `isPaneBackend(backendType)` 时，工具调用执行该分支。
      if (isPaneBackend(backendType)) {
        // 显式忽略 `getBackendByType(backendType).killPane(paneId, !insideTmux)` 的返回值，只保留它触发的副作用。
        void getBackendByType(backendType).killPane(paneId, !insideTmux)
      }
    },
    { once: true },
  )
}

/**
 * Handle spawn operation for in-process teammates.
 * In-process teammates run in the same Node.js process using AsyncLocalStorage.
 */
// handleSpawnInProcess 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSpawnInProcess(
  input: SpawnInput,
  context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  // 从 `context` 解构 setAppState、getAppState，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { setAppState, getAppState } = context
  // 从 `input` 解构 name、prompt、agent_type、plan_mode_required，减少工具实现 spawn Multi Agent对同一对象的重复访问。
  const { name, prompt, agent_type, plan_mode_required } = input

  // Resolve model: 'inherit' → leader's model; undefined → default Opus
  // 模型名称读取`resolveTeammateModel`，供工具调用后续处理使用。
  const model = resolveTeammateModel(input.model, getAppState().mainLoopModel)

  // 只有 `!name || !prompt` 满足时，工具调用才执行该分支。
  if (!name || !prompt) {
    // 抛出 new Error('name and prompt are required for spawn operation')，阻止工具调用在无效状态下继续运行。
    throw new Error('name and prompt are required for spawn operation')
  }

  // Get team name from input or inherit from leader's team context
  // appState 状态读取`getAppState`，供工具调用后续处理使用。
  const appState = getAppState()
  // teamName标记工具实现 spawn Multi Agent是否启用对应路径。
  const teamName = input.team_name || appState.teamContext?.teamName

  // teamName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamName) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'team_name is required for spawn operation. Either provide team_name in input or call spawnTeam first to establish team context.',
    )
  }

  // Generate unique name if duplicate exists in team
  // uniqueName保存`generateUniqueTeammateName`，供工具调用后续处理使用。
  const uniqueName = await generateUniqueTeammateName(name, teamName)

  // Sanitize the name to prevent @ in agent IDs
  // sanitizedName保存`sanitizeAgentName`，供工具调用后续处理使用。
  const sanitizedName = sanitizeAgentName(uniqueName)

  // Generate deterministic agent ID from name and team
  // teammateId格式化`formatAgentId`，供工具调用后续处理使用。
  const teammateId = formatAgentId(sanitizedName, teamName)

  // Assign a unique color to this teammate
  // teammateColor保存`assignTeammateColor`，供工具调用后续处理使用。
  const teammateColor = assignTeammateColor(teammateId)

  // Look up custom agent definition if agent_type is provided
  // agentDefinition 先占位，稍后的条件分支会根据实际输入补齐它。
  let agentDefinition: CustomAgentDefinition | undefined
  // 满足 `agent_type` 时，工具调用执行该分支。
  if (agent_type) {
    // allAgents 集合 命名 `context.options.agentDefinitions.activeAgents`，让后续代码直接表达这个值的用途。
    const allAgents = context.options.agentDefinitions.activeAgents
    // foundAgent筛选`allAgents.find`，供工具调用后续处理使用。
    const foundAgent = allAgents.find(a => a.agentType === agent_type)
    // 只有 `foundAgent && isCustomAgent(foundAgent)` 满足时，工具调用才执行该分支。
    if (foundAgent && isCustomAgent(foundAgent)) {
      // agentDefinition更新为 `foundAgent`，确保工具调用后续读取最新状态。
      agentDefinition = foundAgent
    }
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[handleSpawnInProcess] agent_type=${agent_type}, found=${!!agentDefinition}`,
    )
  }

  // Spawn in-process teammate
  // 配置 集中保存工具实现 spawn Multi Agent要一起传递的字段。
  const config: InProcessSpawnConfig = {
    name: sanitizedName,
    teamName,
    prompt,
    color: teammateColor,
    planModeRequired: plan_mode_required ?? false,
    model,
  }

  // 结果保存`spawnInProcessTeammate`，供工具调用后续处理使用。
  const result = await spawnInProcessTeammate(config, context)

  // result.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!result.success) {
    // 抛出 new Error(result.error ?? 'Failed to spawn in-process teammate')，阻止工具调用在无效状态下继续运行。
    throw new Error(result.error ?? 'Failed to spawn in-process teammate')
  }

  // Debug: log what spawn returned
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[handleSpawnInProcess] spawn result: taskId=${result.taskId}, hasContext=${!!result.teammateContext}, hasAbort=${!!result.abortController}`,
  )

  // Start the agent execution loop (fire-and-forget)
  // 只有 `result.taskId && result.teammateContext && result` 满足时，工具调用才执行该分支。
  if (result.taskId && result.teammateContext && result.abortController) {
    // 调用 startInProcessTeammate，触发工具调用此处需要的副作用。
    startInProcessTeammate({
      identity: {
        agentId: teammateId,
        agentName: sanitizedName,
        teamName,
        color: teammateColor,
        planModeRequired: plan_mode_required ?? false,
        parentSessionId: result.teammateContext.parentSessionId,
      },
      taskId: result.taskId,
      prompt,
      description: input.description,
      model,
      agentDefinition,
      teammateContext: result.teammateContext,
      // Strip messages: the teammate never reads toolUseContext.messages
      // (it builds its own history via allMessages in inProcessRunner).
      // Passing the parent's full conversation here would pin it for the
      // teammate's lifetime, surviving /clear and auto-compact.
      toolUseContext: { ...context, messages: [] },
      abortController: result.abortController,
      invokingRequestId: input.invokingRequestId,
    })
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[handleSpawnInProcess] Started agent execution for ${teammateId}`,
    )
  }

  // Track the teammate in AppState's teamContext
  // Auto-register leader if spawning without prior spawnTeam call
  // setAppState 写入新的状态值，使工具调用后续读取保持一致。
  setAppState(prev => {
    // needsLeaderSetup标记工具实现 spawn Multi Agent是否启用对应路径。
    const needsLeaderSetup = !prev.teamContext?.leadAgentId
    // leadAgentId保存`needsLeaderSetup`，供后续判断或组装使用。
    const leadAgentId = needsLeaderSetup
      ? formatAgentId(TEAM_LEAD_NAME, teamName)
      : prev.teamContext!.leadAgentId

    // Build teammates map, including leader if needed for inbox polling
    // existingTeammates 集合标记工具实现 spawn Multi Agent是否启用对应路径。
    const existingTeammates = prev.teamContext?.teammates || {}
    // leadEntry 命名 `needsLeaderSetup`，让后续代码直接表达这个值的用途。
    const leadEntry = needsLeaderSetup
      ? {
          [leadAgentId]: {
            name: TEAM_LEAD_NAME,
            agentType: TEAM_LEAD_NAME,
            color: assignTeammateColor(leadAgentId),
            tmuxSessionName: 'in-process',
            tmuxPaneId: 'leader',
            cwd: getCwd(),
            spawnedAt: Date.now(),
          },
        }
      : {}

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      ...prev,
      teamContext: {
        ...prev.teamContext,
        teamName: teamName ?? prev.teamContext?.teamName ?? 'default',
        teamFilePath: prev.teamContext?.teamFilePath ?? '',
        leadAgentId,
        teammates: {
          ...existingTeammates,
          ...leadEntry,
          [teammateId]: {
            name: sanitizedName,
            agentType: agent_type,
            color: teammateColor,
            tmuxSessionName: 'in-process',
            tmuxPaneId: 'in-process',
            cwd: getCwd(),
            spawnedAt: Date.now(),
          },
        },
      },
    }
  })

  // Register agent in the team file
  // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamFile) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Team "${teamName}" does not exist. Call spawnTeam first to create the team.`,
    )
  }
  // members 集合追加新条目，保持收集顺序与输入顺序一致。
  teamFile.members.push({
    agentId: teammateId,
    name: sanitizedName,
    agentType: agent_type,
    model,
    prompt,
    color: teammateColor,
    planModeRequired: plan_mode_required,
    joinedAt: Date.now(),
    tmuxPaneId: 'in-process',
    cwd: getCwd(),
    subscriptions: [],
    backendType: 'in-process',
  })
  // 等待 `writeTeamFileAsync(teamName, teamFile)` 完成，再继续工具实现 spawn Multi Agent的异步流程。
  await writeTeamFileAsync(teamName, teamFile)

  // Note: Do NOT send the prompt via mailbox for in-process teammates.
  // In-process teammates receive the prompt directly via startInProcessTeammate().
  // The mailbox is only needed for tmux-based teammates which poll for their initial message.
  // Sending via both paths would cause duplicate welcome messages.

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      teammate_id: teammateId,
      agent_id: teammateId,
      agent_type,
      model,
      name: sanitizedName,
      color: teammateColor,
      tmux_session_name: 'in-process',
      tmux_window_name: 'in-process',
      tmux_pane_id: 'in-process',
      team_name: teamName,
      is_splitpane: false,
      plan_mode_required,
    },
  }
}

/**
 * Handle spawn operation - creates a new Claude Code instance.
 * Uses in-process mode when enabled, otherwise uses tmux/iTerm2 split-pane view.
 * Falls back to in-process if pane backend detection fails (e.g., iTerm2 without
 * it2 CLI or tmux installed).
 */
// handleSpawn 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSpawn(
  input: SpawnInput,
  context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  // Check if in-process mode is enabled via feature flag
  // 满足 `isInProcessEnabled()` 时，工具调用执行该分支。
  if (isInProcessEnabled()) {
    // 返回 `handleSpawnInProcess(input, context)`，作为工具调用这次计算的结果。
    return handleSpawnInProcess(input, context)
  }

  // Pre-flight: ensure a pane backend is available before attempting pane-based spawn.
  // This handles auto-mode cases like iTerm2 without it2 or tmux installed, where
  // isInProcessEnabled() returns false but detectAndGetBackend() has no viable backend.
  // Narrowly scoped so user cancellation and other spawn errors propagate normally.
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `detectAndGetBackend()` 完成，再继续工具实现 spawn Multi Agent的异步流程。
    await detectAndGetBackend()
  } catch (error) {
    // Only fall back silently in auto mode. If the user explicitly configured
    // teammateMode: 'tmux', let the error propagate so they see the actionable
    // install instructions from getTmuxInstallInstructions().
    // `getTeammateModeFromSnapshot()` 与 `'auto'` 不一致时刷新派生状态，避免使用过期结果。
    if (getTeammateModeFromSnapshot() !== 'auto') {
      // 抛出 error，阻止工具调用在无效状态下继续运行。
      throw error
    }
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[handleSpawn] No pane backend available, falling back to in-process: ${errorMessage(error)}`,
    )
    // Record the fallback so isInProcessEnabled() reflects the actual mode
    // (fixes banner and other UI that would otherwise show tmux attach commands).
    // 调用 markInProcessFallback，触发工具调用此处需要的副作用。
    markInProcessFallback()
    // 返回 `handleSpawnInProcess(input, context)`，作为工具调用这次计算的结果。
    return handleSpawnInProcess(input, context)
  }

  // Backend is available (and now cached) - proceed with pane spawning.
  // Any errors here (user cancellation, validation, etc.) propagate to the caller.
  // useSplitPane标记工具实现 spawn Multi Agent是否启用对应路径。
  const useSplitPane = input.use_splitpane !== false
  // 满足 `useSplitPane` 时，工具调用执行该分支。
  if (useSplitPane) {
    // 返回 `handleSpawnSplitPane(input, context)`，作为工具调用这次计算的结果。
    return handleSpawnSplitPane(input, context)
  }
  // 返回 `handleSpawnSeparateWindow(input, context)`，作为工具调用这次计算的结果。
  return handleSpawnSeparateWindow(input, context)
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Spawns a new teammate with the given configuration.
 * This is the main entry point for teammate spawning, used by both TeammateTool and AgentTool.
 */
// spawnTeammate 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function spawnTeammate(
  config: SpawnTeammateConfig,
  context: ToolUseContext,
): Promise<{ data: SpawnOutput }> {
  // 返回 `handleSpawn(config, context)`，作为工具调用这次计算的结果。
  return handleSpawn(config, context)
}
