// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准headless 查询引擎的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 last，将 lodash-es/last.js 中已经封装好的能力接到本文件流程里。
import last from 'lodash-es/last.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  getSessionId,
  isSessionPersistenceDisabled,
} from 'src/bootstrap/state.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import type {
  PermissionMode,
  SDKCompactBoundaryMessage,
  SDKMessage,
  SDKPermissionDenial,
  SDKStatus,
  SDKUserMessageReplay,
} from 'src/entrypoints/agentSdkTypes.js'
// 接入 accumulateUsage、updateUsage 服务层能力，把外部通信或共享状态交给 src/services/api/claude.js 处理。
import { accumulateUsage, updateUsage } from 'src/services/api/claude.js'
// 类型依赖 { NonNullableUsage } 来自 src/services/api/logging.js，用于校准headless 查询引擎的数据契约。
import type { NonNullableUsage } from 'src/services/api/logging.js'
// 接入 EMPTY_USAGE 服务层能力，把外部通信或共享状态交给 src/services/api/logging.js 处理。
import { EMPTY_USAGE } from 'src/services/api/logging.js'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 类型依赖 { Command } 来自 ./commands.js，用于校准headless 查询引擎的数据契约。
import type { Command } from './commands.js'
// 引入 getSlashCommandToolSkills，将 ./commands.js 中已经封装好的能力接到本文件流程里。
import { getSlashCommandToolSkills } from './commands.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  LOCAL_COMMAND_STDERR_TAG,
  LOCAL_COMMAND_STDOUT_TAG,
} from './constants/xml.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  getModelUsage,
  getTotalAPIDuration,
  getTotalCost,
} from './cost-tracker.js'
// 类型依赖 { CanUseToolFn } 来自 ./hooks/useCanUseTool.js，用于校准headless 查询引擎的数据契约。
import type { CanUseToolFn } from './hooks/useCanUseTool.js'
// 引入 loadMemoryPrompt，将 ./memdir/memdir.js 中已经封装好的能力接到本文件流程里。
import { loadMemoryPrompt } from './memdir/memdir.js'
// 引入 hasAutoMemPathOverride，将 ./memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { hasAutoMemPathOverride } from './memdir/paths.js'
// 引入 query，将 ./query.js 中已经封装好的能力接到本文件流程里。
import { query } from './query.js'
// 接入 categorizeRetryableAPIError 服务层能力，把外部通信或共享状态交给 ./services/api/errors.js 处理。
import { categorizeRetryableAPIError } from './services/api/errors.js'
// 类型依赖 { MCPServerConnection } 来自 ./services/mcp/types.js，用于校准headless 查询引擎的数据契约。
import type { MCPServerConnection } from './services/mcp/types.js'
// 类型依赖 { AppState } 来自 ./state/AppState.js，用于校准headless 查询引擎的数据契约。
import type { AppState } from './state/AppState.js'
// 引入 Tools、ToolUseContext、toolMatchesName，将 ./Tool.js 中已经封装好的能力接到本文件流程里。
import { type Tools, type ToolUseContext, toolMatchesName } from './Tool.js'
// 类型依赖 { AgentDefinition } 来自 ./tools/AgentTool/loadAgentsDir.js，用于校准headless 查询引擎的数据契约。
import type { AgentDefinition } from './tools/AgentTool/loadAgentsDir.js'
// 接入 SYNTHETIC_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SYNTHETIC_OUTPUT_TOOL_NAME } from './tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 类型依赖 { Message } 来自 ./types/message.js，用于校准headless 查询引擎的数据契约。
import type { Message } from './types/message.js'
// 类型依赖 { OrphanedPermission } 来自 ./types/textInputTypes.js，用于校准headless 查询引擎的数据契约。
import type { OrphanedPermission } from './types/textInputTypes.js'
// 复用 createAbortController 工具函数，把通用处理留在 ./utils/abortController.js 中维护。
import { createAbortController } from './utils/abortController.js'
// 类型依赖 { AttributionState } 来自 ./utils/commitAttribution.js，用于校准headless 查询引擎的数据契约。
import type { AttributionState } from './utils/commitAttribution.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ./utils/config.js 中维护。
import { getGlobalConfig } from './utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ./utils/cwd.js 中维护。
import { getCwd } from './utils/cwd.js'
// 复用 isBareMode、isEnvTruthy 工具函数，把通用处理留在 ./utils/envUtils.js 中维护。
import { isBareMode, isEnvTruthy } from './utils/envUtils.js'
// 复用 getFastModeState 工具函数，把通用处理留在 ./utils/fastMode.js 中维护。
import { getFastModeState } from './utils/fastMode.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  type FileHistoryState,
  fileHistoryEnabled,
  fileHistoryMakeSnapshot,
} from './utils/fileHistory.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  cloneFileStateCache,
  type FileStateCache,
} from './utils/fileStateCache.js'
// 复用 headlessProfilerCheckpoint 工具函数，把通用处理留在 ./utils/headlessProfiler.js 中维护。
import { headlessProfilerCheckpoint } from './utils/headlessProfiler.js'
// 复用 registerStructuredOutputEnforcement 工具函数，把通用处理留在 ./utils/hooks/hookHelpers.js 中维护。
import { registerStructuredOutputEnforcement } from './utils/hooks/hookHelpers.js'
// 复用 getInMemoryErrors 工具函数，把通用处理留在 ./utils/log.js 中维护。
import { getInMemoryErrors } from './utils/log.js'
// 复用 countToolCalls、SYNTHETIC_MESSAGES 工具函数，把通用处理留在 ./utils/messages.js 中维护。
import { countToolCalls, SYNTHETIC_MESSAGES } from './utils/messages.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  getMainLoopModel,
  parseUserSpecifiedModel,
} from './utils/model/model.js'
// 复用 loadAllPluginsCacheOnly 工具函数，把通用处理留在 ./utils/plugins/pluginLoader.js 中维护。
import { loadAllPluginsCacheOnly } from './utils/plugins/pluginLoader.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  type ProcessUserInputContext,
  processUserInput,
} from './utils/processUserInput/processUserInput.js'
// 复用 fetchSystemPromptParts 工具函数，把通用处理留在 ./utils/queryContext.js 中维护。
import { fetchSystemPromptParts } from './utils/queryContext.js'
// 复用 setCwd 工具函数，把通用处理留在 ./utils/Shell.js 中维护。
import { setCwd } from './utils/Shell.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  flushSessionStorage,
  recordTranscript,
} from './utils/sessionStorage.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ./utils/systemPromptType.js 中维护。
import { asSystemPrompt } from './utils/systemPromptType.js'
// 复用 resolveThemeSetting 工具函数，把通用处理留在 ./utils/systemTheme.js 中维护。
import { resolveThemeSetting } from './utils/systemTheme.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  shouldEnableThinkingByDefault,
  type ThinkingConfig,
} from './utils/thinking.js'

// Lazy: MessageSelector.tsx pulls React/ink; only needed for message filtering at query time
/* eslint-disable @typescript-eslint/no-require-imports */
// messageSelector 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const messageSelector =
  // 这个回调绑定到 (): typeof import('src/components/MessageSelector.js') =>，负责headless 查询引擎在该局部场景下的响应。
  (): typeof import('src/components/MessageSelector.js') =>
    require('src/components/MessageSelector.js')

// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  localCommandOutputToSDKAssistantMessage,
  toSDKCompactMetadata,
} from './utils/messages/mappers.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  buildSystemInitMessage,
  sdkCompatToolName,
} from './utils/messages/systemInit.js'
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  getScratchpadDir,
  isScratchpadEnabled,
} from './utils/permissions/filesystem.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让headless 查询引擎后续逻辑可以直接复用这些外部能力。
import {
  handleOrphanedPermission,
  isResultSuccessful,
  normalizeMessage,
} from './utils/queryHelpers.js'

// Dead code elimination: conditional import for coordinator mode
/* eslint-disable @typescript-eslint/no-require-imports */
// getCoordinatorUserContext 先占位，稍后的条件分支会根据实际输入补齐它。
const getCoordinatorUserContext: (
  mcpClients: ReadonlyArray<{ name: string }>,
  scratchpadDir?: string,
) => { [k: string]: string } = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js').getCoordinatorUserContext
  // 这个回调绑定到 : () => ({})，负责headless 查询引擎在该局部场景下的响应。
  : () => ({})
/* eslint-enable @typescript-eslint/no-require-imports */

// Dead code elimination: conditional import for snip compaction
/* eslint-disable @typescript-eslint/no-require-imports */
// snipModule保存`feature`，供headless 查询引擎后续处理使用。
const snipModule = feature('HISTORY_SNIP')
  ? (require('./services/compact/snipCompact.js') as typeof import('./services/compact/snipCompact.js'))
  : null
// snipProjection保存`feature`，供headless 查询引擎后续处理使用。
const snipProjection = feature('HISTORY_SNIP')
  ? (require('./services/compact/snipProjection.js') as typeof import('./services/compact/snipProjection.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// QueryEngineConfig 固化headless 查询引擎里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueryEngineConfig = {
  cwd: string
  tools: Tools
  commands: Command[]
  mcpClients: MCPServerConnection[]
  agents: AgentDefinition[]
  canUseTool: CanUseToolFn
  // 这个回调绑定到 getAppState: () => AppState，负责headless 查询引擎在该局部场景下的响应。
  getAppState: () => AppState
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责headless 查询引擎在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
  initialMessages?: Message[]
  readFileCache: FileStateCache
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  fallbackModel?: string
  thinkingConfig?: ThinkingConfig
  maxTurns?: number
  maxBudgetUsd?: number
  taskBudget?: { total: number }
  jsonSchema?: Record<string, unknown>
  verbose?: boolean
  replayUserMessages?: boolean
  /** Handler for URL elicitations triggered by MCP tool -32042 errors. */
  handleElicitation?: ToolUseContext['handleElicitation']
  includePartialMessages?: boolean
  // 这个回调绑定到 setSDKStatus?: (status: SDKStatus) => void，负责headless 查询引擎在该局部场景下的响应。
  setSDKStatus?: (status: SDKStatus) => void
  abortController?: AbortController
  orphanedPermission?: OrphanedPermission
  /**
   * Snip-boundary handler: receives each yielded system message plus the
   * current mutableMessages store. Returns undefined if the message is not a
   * snip boundary; otherwise returns the replayed snip result. Injected by
   * ask() when HISTORY_SNIP is enabled so feature-gated strings stay inside
   * the gated module (keeps QueryEngine free of excluded strings and testable
   * despite feature() returning false under bun test). SDK-only: the REPL
   * keeps full history for UI scrollback and projects on demand via
   * projectSnippedView; QueryEngine truncates here to bound memory in long
   * headless sessions (no UI to preserve).
   */
  // headless 查询引擎在这里处理 `snipReplay?: (`，完成这一小步状态转换。
  snipReplay?: (
    yieldedSystemMsg: Message,
    store: Message[],
  ) => { messages: Message[]; executed: boolean } | undefined
}

/**
 * QueryEngine owns the query lifecycle and session state for a conversation.
 * It extracts the core logic from ask() into a standalone class that can be
 * used by both the headless/SDK path and (in a future phase) the REPL.
 *
 * One QueryEngine per conversation. Each submitMessage() call starts a new
 * turn within the same conversation. State (messages, file cache, usage, etc.)
 * persists across turns.
 */
// QueryEngine 聚合headless 查询引擎相关状态与操作，把同一职责的行为收束到类实例中。
export class QueryEngine {
  private config: QueryEngineConfig
  private mutableMessages: Message[]
  private abortController: AbortController
  private permissionDenials: SDKPermissionDenial[]
  private totalUsage: NonNullableUsage
  private hasHandledOrphanedPermission = false
  private readFileState: FileStateCache
  // Turn-scoped skill discovery tracking (feeds was_discovered on
  // tengu_skill_tool_invocation). Must persist across the two
  // processUserInputContext rebuilds inside submitMessage, but is cleared
  // at the start of each submitMessage to avoid unbounded growth across
  // many turns in SDK mode.
  private discoveredSkillNames = new Set<string>()
  private loadedNestedMemoryPaths = new Set<string>()

  // 构造函数接收 config: QueryEngineConfig，把外部输入整理成实例可复用的内部状态。
  constructor(config: QueryEngineConfig) {
    // 更新实例字段 config 为 config，同步headless 查询引擎的内部状态。
    this.config = config
    // 更新实例字段 mutableMessages 为 config.initialMessages ?? []，同步headless 查询引擎的内部状态。
    this.mutableMessages = config.initialMessages ?? []
    // 更新实例字段 abortController 为 config.abortController ?? createAbortController()，同步headless 查询引擎的内部状态。
    this.abortController = config.abortController ?? createAbortController()
    // 更新实例字段 permissionDenials 为 []，同步headless 查询引擎的内部状态。
    this.permissionDenials = []
    // 更新实例字段 readFileState 为 config.readFileCache，同步headless 查询引擎的内部状态。
    this.readFileState = config.readFileCache
    // 更新实例字段 totalUsage 为 EMPTY_USAGE，同步headless 查询引擎的内部状态。
    this.totalUsage = EMPTY_USAGE
  }

  // headless 查询引擎在这里处理 `async *submitMessage(`，完成这一小步状态转换。
  async *submitMessage(
    prompt: string | ContentBlockParam[],
    options?: { uuid?: string; isMeta?: boolean },
  ): AsyncGenerator<SDKMessage, void, unknown> {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      cwd,
      commands,
      tools,
      mcpClients,
      verbose = false,
      thinkingConfig,
      maxTurns,
      maxBudgetUsd,
      taskBudget,
      canUseTool,
      customSystemPrompt,
      appendSystemPrompt,
      userSpecifiedModel,
      fallbackModel,
      jsonSchema,
      getAppState,
      setAppState,
      replayUserMessages = false,
      includePartialMessages = false,
      agents = [],
      setSDKStatus,
      orphanedPermission,
    } = this.config

    // 调用 this.discoveredSkillNames.clear，触发headless 查询引擎此处需要的副作用。
    this.discoveredSkillNames.clear()
    // setCwd 写入新的状态值，使headless 查询引擎后续读取保持一致。
    setCwd(cwd)
    // persistSession 会话数据保存`isSessionPersistenceDisabled`，供headless 查询引擎后续处理使用。
    const persistSession = !isSessionPersistenceDisabled()
    // startTime记录时间`Date.now`，供headless 查询引擎后续处理使用。
    const startTime = Date.now()

    // Wrap canUseTool to track permission denials
    // wrappedCanUseTool封装成回调，供headless 查询引擎在事件触发或异步步骤中调用。
    const wrappedCanUseTool: CanUseToolFn = async (
      tool,
      input,
      toolUseContext,
      assistantMessage,
      toolUseID,
      forceDecision,
    ) => {
      // 结果保存`canUseTool`，供headless 查询引擎后续处理使用。
      const result = await canUseTool(
        tool,
        input,
        toolUseContext,
        assistantMessage,
        toolUseID,
        forceDecision,
      )

      // Track denials for SDK reporting
      // `result.behavior` 与 `'allow'` 不一致时刷新派生状态，避免使用过期结果。
      if (result.behavior !== 'allow') {
        // permissionDenials 权限数据追加新条目，保持收集顺序与输入顺序一致。
        this.permissionDenials.push({
          tool_name: sdkCompatToolName(tool.name),
          tool_use_id: toolUseID,
          tool_input: input,
        })
      }

      // 返回 `result`，作为headless 查询引擎这次计算的结果。
      return result
    }

    // initialAppState 状态读取`getAppState`，供headless 查询引擎后续处理使用。
    const initialAppState = getAppState()
    // initialMainLoopModel 命名 `userSpecifiedModel`，让后续代码直接表达这个值的用途。
    const initialMainLoopModel = userSpecifiedModel
      ? parseUserSpecifiedModel(userSpecifiedModel)
      : getMainLoopModel()

    // initialThinkingConfig 配置保存`thinkingConfig`，供后续判断或组装使用。
    const initialThinkingConfig: ThinkingConfig = thinkingConfig
      ? thinkingConfig
      : shouldEnableThinkingByDefault() !== false
        ? { type: 'adaptive' }
        : { type: 'disabled' }

    // 调用 headlessProfilerCheckpoint，触发headless 查询引擎此处需要的副作用。
    headlessProfilerCheckpoint('before_getSystemPrompt')
    // Narrow once so TS tracks the type through the conditionals below.
    // customPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const customPrompt =
      typeof customSystemPrompt === 'string' ? customSystemPrompt : undefined
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      defaultSystemPrompt,
      userContext: baseUserContext,
      systemContext,
    } = await fetchSystemPromptParts({
      tools,
      mainLoopModel: initialMainLoopModel,
      additionalWorkingDirectories: Array.from(
        initialAppState.toolPermissionContext.additionalWorkingDirectories.keys(),
      ),
      mcpClients,
      customSystemPrompt: customPrompt,
    })
    // 调用 headlessProfilerCheckpoint，触发headless 查询引擎此处需要的副作用。
    headlessProfilerCheckpoint('after_getSystemPrompt')
    // userContext 集中保存headless 查询引擎要一起传递的字段。
    const userContext = {
      ...baseUserContext,
      ...getCoordinatorUserContext(
        mcpClients,
        isScratchpadEnabled() ? getScratchpadDir() : undefined,
      ),
    }

    // When an SDK caller provides a custom system prompt AND has set
    // CLAUDE_COWORK_MEMORY_PATH_OVERRIDE, inject the memory-mechanics prompt.
    // The env var is an explicit opt-in signal — the caller has wired up
    // a memory directory and needs Claude to know how to use it (which
    // Write/Edit tools to call, MEMORY.md filename, loading semantics).
    // The caller can layer their own policy text via appendSystemPrompt.
    // memoryMechanicsPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const memoryMechanicsPrompt =
      customPrompt !== undefined && hasAutoMemPathOverride()
        ? await loadMemoryPrompt()
        : null

    // 系统提示词保存`asSystemPrompt`，供headless 查询引擎后续处理使用。
    const systemPrompt = asSystemPrompt([
      ...(customPrompt !== undefined ? [customPrompt] : defaultSystemPrompt),
      ...(memoryMechanicsPrompt ? [memoryMechanicsPrompt] : []),
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ])

    // Register function hook for structured output enforcement
    // hasStructuredOutputTool记录 `tools.some` 是否成立，headless 查询引擎随后按该结果分支。
    const hasStructuredOutputTool = tools.some(t =>
      toolMatchesName(t, SYNTHETIC_OUTPUT_TOOL_NAME),
    )
    // 组合条件 `jsonSchema && hasStructuredOutputTool` 成立时，headless 查询引擎才启用这条专门路径。
    if (jsonSchema && hasStructuredOutputTool) {
      // 调用 registerStructuredOutputEnforcement，触发headless 查询引擎此处需要的副作用。
      registerStructuredOutputEnforcement(setAppState, getSessionId())
    }

    // processUserInputContext 集中保存headless 查询引擎要一起传递的字段。
    let processUserInputContext: ProcessUserInputContext = {
      messages: this.mutableMessages,
      // Slash commands that mutate the message array (e.g. /force-snip)
      // call setMessages(fn).  In interactive mode this writes back to
      // AppState; in print mode we write back to mutableMessages so the
      // rest of the query loop (push at :389, snapshot at :392) sees
      // the result.  The second processUserInputContext below (after
      // slash-command processing) keeps the no-op — nothing else calls
      // setMessages past that point.
      // 这个回调绑定到 setMessages: fn => {，负责headless 查询引擎在该局部场景下的响应。
      setMessages: fn => {
        // 更新实例字段 mutableMessages 为 fn(this.mutableMessages)，同步headless 查询引擎的内部状态。
        this.mutableMessages = fn(this.mutableMessages)
      },
      // 这个回调绑定到 onChangeAPIKey: () => {},，负责headless 查询引擎在该局部场景下的响应。
      onChangeAPIKey: () => {},
      handleElicitation: this.config.handleElicitation,
      options: {
        commands,
        debug: false, // we use stdout, so don't want to clobber it
        tools,
        verbose,
        mainLoopModel: initialMainLoopModel,
        thinkingConfig: initialThinkingConfig,
        mcpClients,
        mcpResources: {},
        ideInstallationStatus: null,
        isNonInteractiveSession: true,
        customSystemPrompt,
        appendSystemPrompt,
        agentDefinitions: { activeAgents: agents, allAgents: [] },
        theme: resolveThemeSetting(getGlobalConfig().theme),
        maxBudgetUsd,
      },
      getAppState,
      setAppState,
      abortController: this.abortController,
      readFileState: this.readFileState,
      nestedMemoryAttachmentTriggers: new Set<string>(),
      loadedNestedMemoryPaths: this.loadedNestedMemoryPaths,
      dynamicSkillDirTriggers: new Set<string>(),
      discoveredSkillNames: this.discoveredSkillNames,
      // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setInProgressToolUseIDs: () => {},
      // 这个回调绑定到 setResponseLength: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setResponseLength: () => {},
      // headless 查询引擎在这里处理 `updateFileHistoryState: (`，完成这一小步状态转换。
      updateFileHistoryState: (
        // 这个回调绑定到 updater: (prev: FileHistoryState) => FileHistoryState,，负责headless 查询引擎在该局部场景下的响应。
        updater: (prev: FileHistoryState) => FileHistoryState,
      ) => {
        // setAppState 写入新的状态值，使headless 查询引擎后续读取保持一致。
        setAppState(prev => {
          // updated保存`updater`，供headless 查询引擎后续处理使用。
          const updated = updater(prev.fileHistory)
          // 满足 `updated === prev.fileHistory` 时，headless 查询引擎执行该分支。
          if (updated === prev.fileHistory) return prev
          // 返回结构化结果，集中表达headless 查询引擎已经整理出的状态。
          return { ...prev, fileHistory: updated }
        })
      },
      // headless 查询引擎在这里处理 `updateAttributionState: (`，完成这一小步状态转换。
      updateAttributionState: (
        // 这个回调绑定到 updater: (prev: AttributionState) => AttributionState,，负责headless 查询引擎在该局部场景下的响应。
        updater: (prev: AttributionState) => AttributionState,
      ) => {
        // setAppState 写入新的状态值，使headless 查询引擎后续读取保持一致。
        setAppState(prev => {
          // updated保存`updater`，供headless 查询引擎后续处理使用。
          const updated = updater(prev.attribution)
          // 满足 `updated === prev.attribution` 时，headless 查询引擎执行该分支。
          if (updated === prev.attribution) return prev
          // 返回结构化结果，集中表达headless 查询引擎已经整理出的状态。
          return { ...prev, attribution: updated }
        })
      },
      setSDKStatus,
    }

    // Handle orphaned permission (only once per engine lifetime)
    // 组合条件 `orphanedPermission && !this.hasHandledOrphanedPer` 成立时，headless 查询引擎才启用这条专门路径。
    if (orphanedPermission && !this.hasHandledOrphanedPermission) {
      // 更新实例字段 hasHandledOrphanedPermission 为 true，同步headless 查询引擎的内部状态。
      this.hasHandledOrphanedPermission = true
      // 逐项读取 `handleOrphanedPermission(` 中的消息，按输入顺序推进headless 查询引擎。
      for await (const message of handleOrphanedPermission(
        orphanedPermission,
        tools,
        this.mutableMessages,
        processUserInputContext,
      )) {
        // 生成器产出 `message`，把阶段性结果交给上层消费。
        yield message
      }
    }

    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      messages: messagesFromUserInput,
      shouldQuery,
      allowedTools,
      model: modelFromUserInput,
      resultText,
    } = await processUserInput({
      input: prompt,
      mode: 'prompt',
      // 这个回调绑定到 setToolJSX: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setToolJSX: () => {},
      context: {
        ...processUserInputContext,
        messages: this.mutableMessages,
      },
      messages: this.mutableMessages,
      uuid: options?.uuid,
      isMeta: options?.isMeta,
      querySource: 'sdk',
    })

    // Push new messages, including user input and any attachments
    // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    this.mutableMessages.push(...messagesFromUserInput)

    // Update params to reflect updates from processing /slash commands
    // 对话消息 聚合成有序列表，保持后续遍历顺序稳定。
    const messages = [...this.mutableMessages]

    // Persist the user's message(s) to transcript BEFORE entering the query
    // loop. The for-await below only calls recordTranscript when ask() yields
    // an assistant/user/compact_boundary message — which doesn't happen until
    // the API responds. If the process is killed before that (e.g. user clicks
    // Stop in cowork seconds after send), the transcript is left with only
    // queue-operation entries; getLastSessionLog filters those out, returns
    // null, and --resume fails with "No conversation found". Writing now makes
    // the transcript resumable from the point the user message was accepted,
    // even if no API response ever arrives.
    //
    // --bare / SIMPLE: fire-and-forget. Scripted calls don't --resume after
    // kill-mid-request. The await is ~4ms on SSD, ~30ms under disk contention
    // — the single largest controllable critical-path cost after module eval.
    // Transcript is still written (for post-hoc debugging); just not blocking.
    // 组合条件 `persistSession && messagesFromUserInput.length > 0` 成立时，headless 查询引擎才启用这条专门路径。
    if (persistSession && messagesFromUserInput.length > 0) {
      // transcriptPromise 异步任务保存 `recordTranscript` 启动的异步任务，稍后再决定等待还是后台完成。
      const transcriptPromise = recordTranscript(messages)
      // 满足 `isBareMode()` 时，headless 查询引擎执行该分支。
      if (isBareMode()) {
        // 显式忽略 `transcriptPromise` 的返回值，只保留它触发的副作用。
        void transcriptPromise
      } else {
        // 等待 `transcriptPromise` 完成，再继续headless 查询引擎的异步流程。
        await transcriptPromise
        // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
        if (
          isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
          isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
        ) {
          // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
          await flushSessionStorage()
        }
      }
    }

    // Filter messages that should be acknowledged after transcript
    // replayableMessages 消息数据筛选`messagesFromUserInput.filter`，供headless 查询引擎后续处理使用。
    const replayableMessages = messagesFromUserInput.filter(
      // 消息更新为 `>`，确保QueryEngine后续读取最新状态。
      msg =>
        (msg.type === 'user' &&
          !msg.isMeta && // Skip synthetic caveat messages
          !msg.toolUseResult && // Skip tool results (they'll be acked from query)
          messageSelector().selectableUserMessagesFilter(msg)) || // Skip non-user-authored messages (task notifications, etc.)
        (msg.type === 'system' && msg.subtype === 'compact_boundary'), // Always ack compact boundaries
    )
    // messagesToAck 消息数据保存`replayUserMessages ? replayableMessages : []`，供headless 查询引擎后续判断或输出使用。
    const messagesToAck = replayUserMessages ? replayableMessages : []

    // Update the ToolPermissionContext based on user input processing (as necessary)
    // setAppState 写入新的状态值，使headless 查询引擎后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      toolPermissionContext: {
        ...prev.toolPermissionContext,
        alwaysAllowRules: {
          ...prev.toolPermissionContext.alwaysAllowRules,
          command: allowedTools,
        },
      },
    }))

    // mainLoopModel保存`modelFromUserInput ?? initialMainLoopModel`，供headless 查询引擎后续判断或输出使用。
    const mainLoopModel = modelFromUserInput ?? initialMainLoopModel

    // Recreate after processing the prompt to pick up updated messages and
    // model (from slash commands).
    // processUserInputContext更新为 `{`，确保QueryEngine后续读取最新状态。
    processUserInputContext = {
      messages,
      // 这个回调绑定到 setMessages: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setMessages: () => {},
      // 这个回调绑定到 onChangeAPIKey: () => {},，负责headless 查询引擎在该局部场景下的响应。
      onChangeAPIKey: () => {},
      handleElicitation: this.config.handleElicitation,
      options: {
        commands,
        debug: false,
        tools,
        verbose,
        mainLoopModel,
        thinkingConfig: initialThinkingConfig,
        mcpClients,
        mcpResources: {},
        ideInstallationStatus: null,
        isNonInteractiveSession: true,
        customSystemPrompt,
        appendSystemPrompt,
        theme: resolveThemeSetting(getGlobalConfig().theme),
        agentDefinitions: { activeAgents: agents, allAgents: [] },
        maxBudgetUsd,
      },
      getAppState,
      setAppState,
      abortController: this.abortController,
      readFileState: this.readFileState,
      nestedMemoryAttachmentTriggers: new Set<string>(),
      loadedNestedMemoryPaths: this.loadedNestedMemoryPaths,
      dynamicSkillDirTriggers: new Set<string>(),
      discoveredSkillNames: this.discoveredSkillNames,
      // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setInProgressToolUseIDs: () => {},
      // 这个回调绑定到 setResponseLength: () => {},，负责headless 查询引擎在该局部场景下的响应。
      setResponseLength: () => {},
      updateFileHistoryState: processUserInputContext.updateFileHistoryState,
      updateAttributionState: processUserInputContext.updateAttributionState,
      setSDKStatus,
    }

    // 调用 headlessProfilerCheckpoint，触发headless 查询引擎此处需要的副作用。
    headlessProfilerCheckpoint('before_skills_plugins')
    // Cache-only: headless/SDK/CCR startup must not block on network for
    // ref-tracked plugins. CCR populates the cache via CLAUDE_CODE_SYNC_PLUGIN_INSTALL
    // (headlessPluginInstall) or CLAUDE_CODE_PLUGIN_SEED_DIR before this runs;
    // SDK callers that need fresh source can call /reload-plugins.
    // 并行获取 skills、{ enabled，缩短headless 查询引擎等待多个独立异步任务的时间。
    const [skills, { enabled: enabledPlugins }] = await Promise.all([
      getSlashCommandToolSkills(getCwd()),
      loadAllPluginsCacheOnly(),
    ])
    // 调用 headlessProfilerCheckpoint，触发headless 查询引擎此处需要的副作用。
    headlessProfilerCheckpoint('after_skills_plugins')

    // 生成器产出 `buildSystemInitMessage({`，把阶段性结果交给上层消费。
    yield buildSystemInitMessage({
      tools,
      mcpClients,
      model: mainLoopModel,
      permissionMode: initialAppState.toolPermissionContext
        .mode as PermissionMode, // TODO: avoid the cast
      commands,
      agents,
      skills,
      plugins: enabledPlugins,
      fastMode: initialAppState.fastMode,
    })

    // Record when system message is yielded for headless latency tracking
    // 调用 headlessProfilerCheckpoint，触发headless 查询引擎此处需要的副作用。
    headlessProfilerCheckpoint('system_message_yielded')

    // shouldQuery缺失时提前走兜底路径，避免headless 查询引擎继续依赖无效输入。
    if (!shouldQuery) {
      // Return the results of local slash commands.
      // Use messagesFromUserInput (not replayableMessages) for command output
      // because selectableUserMessagesFilter excludes local-command-stdout tags.
      // 按顺序遍历 `messagesFromUserInput` 中的消息，逐个交给headless 查询引擎处理。
      for (const msg of messagesFromUserInput) {
        // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
        if (
          msg.type === 'user' &&
          typeof msg.message.content === 'string' &&
          (msg.message.content.includes(`<${LOCAL_COMMAND_STDOUT_TAG}>`) ||
            msg.message.content.includes(`<${LOCAL_COMMAND_STDERR_TAG}>`) ||
            msg.isCompactSummary)
        ) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'user',
            message: {
              ...msg.message,
              content: stripAnsi(msg.message.content),
            },
            session_id: getSessionId(),
            parent_tool_use_id: null,
            uuid: msg.uuid,
            timestamp: msg.timestamp,
            isReplay: !msg.isCompactSummary,
            isSynthetic: msg.isMeta || msg.isVisibleInTranscriptOnly,
          } as SDKUserMessageReplay
        }

        // Local command output — yield as a synthetic assistant message so
        // RC renders it as assistant-style text rather than a user bubble.
        // Emitted as assistant (not the dedicated SDKLocalCommandOutputMessage
        // system subtype) so mobile clients + session-ingress can parse it.
        // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
        if (
          msg.type === 'system' &&
          msg.subtype === 'local_command' &&
          typeof msg.content === 'string' &&
          (msg.content.includes(`<${LOCAL_COMMAND_STDOUT_TAG}>`) ||
            msg.content.includes(`<${LOCAL_COMMAND_STDERR_TAG}>`))
        ) {
          // 生成器产出 `localCommandOutputToSDKAssistantMessage(msg.content, msg.uuid)`，把阶段性结果交给上层消费。
          yield localCommandOutputToSDKAssistantMessage(msg.content, msg.uuid)
        }

        // 组合条件 `msg.type === 'system' && msg.subtype === 'compact` 成立时，headless 查询引擎才启用这条专门路径。
        if (msg.type === 'system' && msg.subtype === 'compact_boundary') {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'system',
            subtype: 'compact_boundary' as const,
            session_id: getSessionId(),
            uuid: msg.uuid,
            compact_metadata: toSDKCompactMetadata(msg.compactMetadata),
          } as SDKCompactBoundaryMessage
        }
      }

      // 满足 `persistSession` 时，headless 查询引擎执行该分支。
      if (persistSession) {
        // 等待 `recordTranscript(messages)` 完成，再继续headless 查询引擎的异步流程。
        await recordTranscript(messages)
        // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
        if (
          isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
          isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
        ) {
          // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
          await flushSessionStorage()
        }
      }

      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        type: 'result',
        subtype: 'success',
        is_error: false,
        duration_ms: Date.now() - startTime,
        duration_api_ms: getTotalAPIDuration(),
        num_turns: messages.length - 1,
        result: resultText ?? '',
        stop_reason: null,
        session_id: getSessionId(),
        total_cost_usd: getTotalCost(),
        usage: this.totalUsage,
        modelUsage: getModelUsage(),
        permission_denials: this.permissionDenials,
        fast_mode_state: getFastModeState(
          mainLoopModel,
          initialAppState.fastMode,
        ),
        uuid: randomUUID(),
      }
      // headless 查询引擎在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 组合条件 `fileHistoryEnabled() && persistSession` 成立时，headless 查询引擎才启用这条专门路径。
    if (fileHistoryEnabled() && persistSession) {
      // headless 查询引擎在这里处理 `messagesFromUserInput`，完成这一小步状态转换。
      messagesFromUserInput
        .filter(messageSelector().selectableUserMessagesFilter)
        // 链式调用 forEach，继续加工上一行在headless 查询引擎中产生的数据。
        .forEach(message => {
          // 显式忽略 `fileHistoryMakeSnapshot(` 的返回值，只保留它触发的副作用。
          void fileHistoryMakeSnapshot(
            // 这个回调绑定到 (updater: (prev: FileHistoryState) => FileHistoryState) => {，负责headless 查询引擎在该局部场景下的响应。
            (updater: (prev: FileHistoryState) => FileHistoryState) => {
              // setAppState 写入新的状态值，使headless 查询引擎后续读取保持一致。
              setAppState(prev => ({
                ...prev,
                fileHistory: updater(prev.fileHistory),
              }))
            },
            message.uuid,
          )
        })
    }

    // Track current message usage (reset on each message_start)
    // currentMessageUsage 消息数据保存`EMPTY_USAGE`，供headless 查询引擎后续判断或输出使用。
    let currentMessageUsage: NonNullableUsage = EMPTY_USAGE
    // turnCount 数量 命名 `1`，让后续代码直接表达这个值的用途。
    let turnCount = 1
    // hasAcknowledgedInitialMessages 消息数据标记headless 查询引擎是否启用对应路径。
    let hasAcknowledgedInitialMessages = false
    // Track structured output from StructuredOutput tool calls
    // structuredOutputFromTool 先占位，稍后的条件分支会根据实际输入补齐它。
    let structuredOutputFromTool: unknown
    // Track the last stop_reason from assistant messages
    // lastStopReason保存`null`，作为后续空值处理的输入。
    let lastStopReason: string | null = null
    // Reference-based watermark so error_during_execution's errors[] is
    // turn-scoped. A length-based index breaks when the 100-entry ring buffer
    // shift()s during the turn — the index slides. If this entry is rotated
    // out, lastIndexOf returns -1 and we include everything (safe fallback).
    // errorLogWatermark 错误信息读取`getInMemoryErrors`，供headless 查询引擎后续处理使用。
    const errorLogWatermark = getInMemoryErrors().at(-1)
    // Snapshot count before this query for delta-based retry limiting
    // initialStructuredOutputCalls 集合保存`jsonSchema`，供后续判断或组装使用。
    const initialStructuredOutputCalls = jsonSchema
      ? countToolCalls(this.mutableMessages, SYNTHETIC_OUTPUT_TOOL_NAME)
      : 0

    // 逐项读取 `query({` 中的消息，按输入顺序推进headless 查询引擎。
    for await (const message of query({
      messages,
      systemPrompt,
      userContext,
      systemContext,
      canUseTool: wrappedCanUseTool,
      toolUseContext: processUserInputContext,
      fallbackModel,
      querySource: 'sdk',
      maxTurns,
      taskBudget,
    })) {
      // Record assistant, user, and compact boundary messages
      // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
      if (
        message.type === 'assistant' ||
        message.type === 'user' ||
        (message.type === 'system' && message.subtype === 'compact_boundary')
      ) {
        // Before writing a compact boundary, flush any in-memory-only
        // messages up through the preservedSegment tail. Attachments and
        // progress are now recorded inline (their switch cases below), but
        // this flush still matters for the preservedSegment tail walk.
        // If the SDK subprocess restarts before then (claude-desktop kills
        // between turns), tailUuid points to a never-written message →
        // applyPreservedSegmentRelinks fails its tail→head walk → returns
        // without pruning → resume loads full pre-compact history.
        // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
        if (
          persistSession &&
          message.type === 'system' &&
          message.subtype === 'compact_boundary'
        ) {
          // tailUuid保存`message.compactMetadata?.preservedSegment?.tailUuid`，供后续判断或组装使用。
          const tailUuid = message.compactMetadata?.preservedSegment?.tailUuid
          // 满足 `tailUuid` 时，headless 查询引擎执行该分支。
          if (tailUuid) {
            // tailIdx筛选`mutableMessages.findLastIndex`，供headless 查询引擎后续处理使用。
            const tailIdx = this.mutableMessages.findLastIndex(
              // m更新为 `> m.uuid === tailUuid`，确保QueryEngine后续读取最新状态。
              m => m.uuid === tailUuid,
            )
            // `tailIdx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
            if (tailIdx !== -1) {
              // 等待 `recordTranscript(this.mutableMessages.slice(0, tailIdx + 1))` 完成，再继续headless 查询引擎的异步流程。
              await recordTranscript(this.mutableMessages.slice(0, tailIdx + 1))
            }
          }
        }
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push(message)
        // 满足 `persistSession` 时，headless 查询引擎执行该分支。
        if (persistSession) {
          // Fire-and-forget for assistant messages. claude.ts yields one
          // assistant message per content block, then mutates the last
          // one's message.usage/stop_reason on message_delta — relying on
          // the write queue's 100ms lazy jsonStringify. Awaiting here
          // blocks ask()'s generator, so message_delta can't run until
          // every block is consumed; the drain timer (started at block 1)
          // elapses first. Interactive CC doesn't hit this because
          // useLogMessages.ts fire-and-forgets. enqueueWrite is
          // order-preserving so fire-and-forget here is safe.
          // 当 `message.type` 匹配 `'assistant'` 时，headless 查询引擎执行对应分支。
          if (message.type === 'assistant') {
            // 显式忽略 `recordTranscript(messages)` 的返回值，只保留它触发的副作用。
            void recordTranscript(messages)
          } else {
            // 等待 `recordTranscript(messages)` 完成，再继续headless 查询引擎的异步流程。
            await recordTranscript(messages)
          }
        }

        // Acknowledge initial user messages after first transcript recording
        // 组合条件 `!hasAcknowledgedInitialMessages && messagesToAck.` 成立时，headless 查询引擎才启用这条专门路径。
        if (!hasAcknowledgedInitialMessages && messagesToAck.length > 0) {
          // hasAcknowledgedInitialMessages 消息数据更新为 `true`，确保QueryEngine后续读取最新状态。
          hasAcknowledgedInitialMessages = true
          // 按顺序遍历 `messagesToAck` 中的msgToAck，逐个交给headless 查询引擎处理。
          for (const msgToAck of messagesToAck) {
            // 当 `msgToAck.type` 匹配 `'user'` 时，headless 查询引擎执行对应分支。
            if (msgToAck.type === 'user') {
              // 生成器产出 `{`，把阶段性结果交给上层消费。
              yield {
                type: 'user',
                message: msgToAck.message,
                session_id: getSessionId(),
                parent_tool_use_id: null,
                uuid: msgToAck.uuid,
                timestamp: msgToAck.timestamp,
                isReplay: true,
              } as SDKUserMessageReplay
            }
          }
        }
      }

      // 当 `message.type` 匹配 `'user'` 时，headless 查询引擎执行对应分支。
      if (message.type === 'user') {
        // headless 查询引擎在这里处理 `turnCount++`，完成这一小步状态转换。
        turnCount++
      }

      // 按照 message.type 的取值选择headless 查询引擎的具体处理分支。
      switch (message.type) {
        case 'tombstone':
          // Tombstone messages are control signals for removing messages, skip them
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'assistant':
          // Capture stop_reason if already set (synthetic messages). For
          // streamed responses, this is null at content_block_stop time;
          // the real value arrives via message_delta (handled below).
          // 满足 `message.message.stop_reason != null` 时，headless 查询引擎执行该分支。
          if (message.message.stop_reason != null) {
            // lastStopReason更新为 `message.message.stop_reason`，确保QueryEngine后续读取最新状态。
            lastStopReason = message.message.stop_reason
          }
          // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          this.mutableMessages.push(message)
          // 生成器产出 `yield* normalizeMessage(message)`，把阶段性结果交给上层消费。
          yield* normalizeMessage(message)
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'progress':
          // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          this.mutableMessages.push(message)
          // Record inline so the dedup loop in the next ask() call sees it
          // as already-recorded. Without this, deferred progress interleaves
          // with already-recorded tool_results in mutableMessages, and the
          // dedup walk freezes startingParentUuid at the wrong message —
          // forking the chain and orphaning the conversation on resume.
          // 满足 `persistSession` 时，headless 查询引擎执行该分支。
          if (persistSession) {
            // 对话消息追加新条目，保持收集顺序与输入顺序一致。
            messages.push(message)
            // 显式忽略 `recordTranscript(messages)` 的返回值，只保留它触发的副作用。
            void recordTranscript(messages)
          }
          // 生成器产出 `yield* normalizeMessage(message)`，把阶段性结果交给上层消费。
          yield* normalizeMessage(message)
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'user':
          // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          this.mutableMessages.push(message)
          // 生成器产出 `yield* normalizeMessage(message)`，把阶段性结果交给上层消费。
          yield* normalizeMessage(message)
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'stream_event':
          // 当 `message.event.type` 匹配 `'message_start'` 时，headless 查询引擎执行对应分支。
          if (message.event.type === 'message_start') {
            // Reset current message usage for new message
            // currentMessageUsage 消息数据更新为 `EMPTY_USAGE`，确保QueryEngine后续读取最新状态。
            currentMessageUsage = EMPTY_USAGE
            // currentMessageUsage 消息数据更新为 `updateUsage(`，确保QueryEngine后续读取最新状态。
            currentMessageUsage = updateUsage(
              currentMessageUsage,
              message.event.message.usage,
            )
          }
          // 当 `message.event.type` 匹配 `'message_delta'` 时，headless 查询引擎执行对应分支。
          if (message.event.type === 'message_delta') {
            // currentMessageUsage 消息数据更新为 `updateUsage(`，确保QueryEngine后续读取最新状态。
            currentMessageUsage = updateUsage(
              currentMessageUsage,
              message.event.usage,
            )
            // Capture stop_reason from message_delta. The assistant message
            // is yielded at content_block_stop with stop_reason=null; the
            // real value only arrives here (see claude.ts message_delta
            // handler). Without this, result.stop_reason is always null.
            // 满足 `message.event.delta.stop_reason != null` 时，headless 查询引擎执行该分支。
            if (message.event.delta.stop_reason != null) {
              // lastStopReason更新为 `message.event.delta.stop_reason`，确保QueryEngine后续读取最新状态。
              lastStopReason = message.event.delta.stop_reason
            }
          }
          // 当 `message.event.type` 匹配 `'message_stop'` 时，headless 查询引擎执行对应分支。
          if (message.event.type === 'message_stop') {
            // Accumulate current message usage into total
            // 更新实例字段 totalUsage 为 accumulateUsage(，同步headless 查询引擎的内部状态。
            this.totalUsage = accumulateUsage(
              this.totalUsage,
              currentMessageUsage,
            )
          }

          // 满足 `includePartialMessages` 时，headless 查询引擎执行该分支。
          if (includePartialMessages) {
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'stream_event' as const,
              event: message.event,
              session_id: getSessionId(),
              parent_tool_use_id: null,
              uuid: randomUUID(),
            }
          }

          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'attachment':
          // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          this.mutableMessages.push(message)
          // Record inline (same reason as progress above).
          // 满足 `persistSession` 时，headless 查询引擎执行该分支。
          if (persistSession) {
            // 对话消息追加新条目，保持收集顺序与输入顺序一致。
            messages.push(message)
            // 显式忽略 `recordTranscript(messages)` 的返回值，只保留它触发的副作用。
            void recordTranscript(messages)
          }

          // Extract structured output from StructuredOutput tool calls
          // 当 `message.attachment.type` 匹配 `'structured_output'` 时，headless 查询引擎执行对应分支。
          if (message.attachment.type === 'structured_output') {
            // structuredOutputFromTool更新为 `message.attachment.data`，确保QueryEngine后续读取最新状态。
            structuredOutputFromTool = message.attachment.data
          }
          // Handle max turns reached signal from query.ts
          else if (message.attachment.type === 'max_turns_reached') {
            // 满足 `persistSession` 时，headless 查询引擎执行该分支。
            if (persistSession) {
              // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
              if (
                isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
                isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
              ) {
                // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
                await flushSessionStorage()
              }
            }
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'result',
              subtype: 'error_max_turns',
              duration_ms: Date.now() - startTime,
              duration_api_ms: getTotalAPIDuration(),
              is_error: true,
              num_turns: message.attachment.turnCount,
              stop_reason: lastStopReason,
              session_id: getSessionId(),
              total_cost_usd: getTotalCost(),
              usage: this.totalUsage,
              modelUsage: getModelUsage(),
              permission_denials: this.permissionDenials,
              fast_mode_state: getFastModeState(
                mainLoopModel,
                initialAppState.fastMode,
              ),
              uuid: randomUUID(),
              errors: [
                `Reached maximum number of turns (${message.attachment.maxTurns})`,
              ],
            }
            // headless 查询引擎在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // Yield queued_command attachments as SDK user message replays
          else if (
            replayUserMessages &&
            message.attachment.type === 'queued_command'
          ) {
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'user',
              message: {
                role: 'user' as const,
                content: message.attachment.prompt,
              },
              session_id: getSessionId(),
              parent_tool_use_id: null,
              uuid: message.attachment.source_uuid || message.uuid,
              timestamp: message.timestamp,
              isReplay: true,
            } as SDKUserMessageReplay
          }
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'stream_request_start':
          // Don't yield stream request start messages
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        case 'system': {
          // Snip boundary: replay on our store to remove zombie messages and
          // stale markers. The yielded boundary is a signal, not data to push —
          // the replay produces its own equivalent boundary. Without this,
          // markers persist and re-trigger on every turn, and mutableMessages
          // never shrinks (memory leak in long SDK sessions). The subtype
          // check lives inside the injected callback so feature-gated strings
          // stay out of this file (excluded-strings check).
          // snipResult 命名 `this.config.snipReplay?.(`，让后续代码直接表达这个值的用途。
          const snipResult = this.config.snipReplay?.(
            message,
            this.mutableMessages,
          )
          // `snipResult` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
          if (snipResult !== undefined) {
            // 满足 `snipResult.executed` 时，headless 查询引擎执行该分支。
            if (snipResult.executed) {
              // this.mutableMessages 消息数据被清空，QueryEngine从干净状态继续。
              this.mutableMessages.length = 0
              // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
              this.mutableMessages.push(...snipResult.messages)
            }
            // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
            break
          }
          // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          this.mutableMessages.push(message)
          // Yield compact boundary messages to SDK
          // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
          if (
            message.subtype === 'compact_boundary' &&
            message.compactMetadata
          ) {
            // Release pre-compaction messages for GC. The boundary was just
            // pushed so it's the last element. query.ts already uses
            // getMessagesAfterCompactBoundary() internally, so only
            // post-boundary messages are needed going forward.
            // mutableBoundaryIdx保存 `this.mutableMessages.length - 1` 的判断结果，供headless 查询引擎后续分支直接复用。
            const mutableBoundaryIdx = this.mutableMessages.length - 1
            // 满足 `mutableBoundaryIdx > 0` 时，headless 查询引擎执行该分支。
            if (mutableBoundaryIdx > 0) {
              // 调用 this.mutableMessages.splice，触发headless 查询引擎此处需要的副作用。
              this.mutableMessages.splice(0, mutableBoundaryIdx)
            }
            // localBoundaryIdx记录 `messages.length - 1` 是否成立，下一步按该结果分支。
            const localBoundaryIdx = messages.length - 1
            // 满足 `localBoundaryIdx > 0` 时，headless 查询引擎执行该分支。
            if (localBoundaryIdx > 0) {
              // 调用 messages.splice，触发headless 查询引擎此处需要的副作用。
              messages.splice(0, localBoundaryIdx)
            }

            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'system',
              subtype: 'compact_boundary' as const,
              session_id: getSessionId(),
              uuid: message.uuid,
              compact_metadata: toSDKCompactMetadata(message.compactMetadata),
            }
          }
          // 当 `message.subtype` 匹配 `'api_error'` 时，headless 查询引擎执行对应分支。
          if (message.subtype === 'api_error') {
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'system',
              subtype: 'api_retry' as const,
              attempt: message.retryAttempt,
              max_retries: message.maxRetries,
              retry_delay_ms: message.retryInMs,
              error_status: message.error.status ?? null,
              error: categorizeRetryableAPIError(message.error),
              session_id: getSessionId(),
              uuid: message.uuid,
            }
          }
          // Don't yield other system messages in headless mode
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
        }
        case 'tool_use_summary':
          // Yield tool use summary messages to SDK
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'tool_use_summary' as const,
            summary: message.summary,
            preceding_tool_use_ids: message.precedingToolUseIds,
            session_id: getSessionId(),
            uuid: message.uuid,
          }
          // 结束这个分支或循环，避免headless 查询引擎继续落入后续路径。
          break
      }

      // Check if USD budget has been exceeded
      // `maxBudgetUsd` 与 `undefined && getTotalCost() >= ...` 不一致时刷新派生状态，避免使用过期结果。
      if (maxBudgetUsd !== undefined && getTotalCost() >= maxBudgetUsd) {
        // 满足 `persistSession` 时，headless 查询引擎执行该分支。
        if (persistSession) {
          // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
          if (
            isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
            isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
          ) {
            // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
            await flushSessionStorage()
          }
        }
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          type: 'result',
          subtype: 'error_max_budget_usd',
          duration_ms: Date.now() - startTime,
          duration_api_ms: getTotalAPIDuration(),
          is_error: true,
          num_turns: turnCount,
          stop_reason: lastStopReason,
          session_id: getSessionId(),
          total_cost_usd: getTotalCost(),
          usage: this.totalUsage,
          modelUsage: getModelUsage(),
          permission_denials: this.permissionDenials,
          fast_mode_state: getFastModeState(
            mainLoopModel,
            initialAppState.fastMode,
          ),
          uuid: randomUUID(),
          errors: [`Reached maximum budget ($${maxBudgetUsd})`],
        }
        // headless 查询引擎在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Check if structured output retry limit exceeded (only on user messages)
      // 组合条件 `message.type === 'user' && jsonSchema` 成立时，headless 查询引擎才启用这条专门路径。
      if (message.type === 'user' && jsonSchema) {
        // currentCalls 集合统计`countToolCalls`，供headless 查询引擎后续处理使用。
        const currentCalls = countToolCalls(
          this.mutableMessages,
          SYNTHETIC_OUTPUT_TOOL_NAME,
        )
        // callsThisQuery保存`currentCalls - initialStructuredOutputCalls`，供headless 查询引擎后续判断或输出使用。
        const callsThisQuery = currentCalls - initialStructuredOutputCalls
        // maxRetries 集合解析`parseInt`，供headless 查询引擎后续处理使用。
        const maxRetries = parseInt(
          process.env.MAX_STRUCTURED_OUTPUT_RETRIES || '5',
          10,
        )
        // 满足 `callsThisQuery >= maxRetries` 时，headless 查询引擎执行该分支。
        if (callsThisQuery >= maxRetries) {
          // 满足 `persistSession` 时，headless 查询引擎执行该分支。
          if (persistSession) {
            // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
            if (
              isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
              isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
            ) {
              // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
              await flushSessionStorage()
            }
          }
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'result',
            subtype: 'error_max_structured_output_retries',
            duration_ms: Date.now() - startTime,
            duration_api_ms: getTotalAPIDuration(),
            is_error: true,
            num_turns: turnCount,
            stop_reason: lastStopReason,
            session_id: getSessionId(),
            total_cost_usd: getTotalCost(),
            usage: this.totalUsage,
            modelUsage: getModelUsage(),
            permission_denials: this.permissionDenials,
            fast_mode_state: getFastModeState(
              mainLoopModel,
              initialAppState.fastMode,
            ),
            uuid: randomUUID(),
            errors: [
              `Failed to provide valid structured output after ${maxRetries} attempts`,
            ],
          }
          // headless 查询引擎在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
    }

    // Stop hooks yield progress/attachment messages AFTER the assistant
    // response (via yield* handleStopHooks in query.ts). Since #23537 pushes
    // those to `messages` inline, last(messages) can be a progress/attachment
    // instead of the assistant — which makes textResult extraction below
    // return '' and -p mode emit a blank line. Allowlist to assistant|user:
    // isResultSuccessful handles both (user with all tool_result blocks is a
    // valid successful terminal state).
    // 结果筛选`messages.findLast`，供headless 查询引擎后续处理使用。
    const result = messages.findLast(
      // m更新为 `> m.type === 'assistant' || m.type === 'user'`，确保QueryEngine后续读取最新状态。
      m => m.type === 'assistant' || m.type === 'user',
    )
    // Capture for the error_during_execution diagnostic — isResultSuccessful
    // is a type predicate (message is Message), so inside the false branch
    // `result` narrows to never and these accesses don't typecheck.
    // edeResultType 命名 `result?.type ?? 'undefined'`，让后续代码直接表达这个值的用途。
    const edeResultType = result?.type ?? 'undefined'
    // edeLastContentType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const edeLastContentType =
      result?.type === 'assistant'
        ? (last(result.message.content)?.type ?? 'none')
        : 'n/a'

    // Flush buffered transcript writes before yielding result.
    // The desktop app kills the CLI process immediately after receiving the
    // result message, so any unflushed writes would be lost.
    // 满足 `persistSession` 时，headless 查询引擎执行该分支。
    if (persistSession) {
      // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
      if (
        isEnvTruthy(process.env.CLAUDE_CODE_EAGER_FLUSH) ||
        isEnvTruthy(process.env.CLAUDE_CODE_IS_COWORK)
      ) {
        // 等待 `flushSessionStorage()` 完成，再继续headless 查询引擎的异步流程。
        await flushSessionStorage()
      }
    }

    // 满足 `!isResultSuccessful(result, lastStopReason)` 时，headless 查询引擎执行该分支。
    if (!isResultSuccessful(result, lastStopReason)) {
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        type: 'result',
        subtype: 'error_during_execution',
        duration_ms: Date.now() - startTime,
        duration_api_ms: getTotalAPIDuration(),
        is_error: true,
        num_turns: turnCount,
        stop_reason: lastStopReason,
        session_id: getSessionId(),
        total_cost_usd: getTotalCost(),
        usage: this.totalUsage,
        modelUsage: getModelUsage(),
        permission_denials: this.permissionDenials,
        fast_mode_state: getFastModeState(
          mainLoopModel,
          initialAppState.fastMode,
        ),
        uuid: randomUUID(),
        // Diagnostic prefix: these are what isResultSuccessful() checks — if
        // the result type isn't assistant-with-text/thinking or user-with-
        // tool_result, and stop_reason isn't end_turn, that's why this fired.
        // errors[] is turn-scoped via the watermark; previously it dumped the
        // entire process's logError buffer (ripgrep timeouts, ENOENT, etc).
        // 这个回调绑定到 errors: (() => {，负责headless 查询引擎在该局部场景下的响应。
        errors: (() => {
          // all读取`getInMemoryErrors`，供headless 查询引擎后续处理使用。
          const all = getInMemoryErrors()
          // start 命名 `errorLogWatermark`，让后续代码直接表达这个值的用途。
          const start = errorLogWatermark
            ? all.lastIndexOf(errorLogWatermark) + 1
            : 0
          // 返回列表结果，保留headless 查询引擎已经排好的条目顺序。
          return [
            `[ede_diagnostic] result_type=${edeResultType} last_content_type=${edeLastContentType} stop_reason=${lastStopReason}`,
            // 链式调用 链式方法，继续加工上一行在headless 查询引擎中产生的数据。
            ...all.slice(start).map(_ => _.error),
          ]
        })(),
      }
      // headless 查询引擎在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Extract the text result based on message type
    // textResult 命名 `''`，让后续代码直接表达这个值的用途。
    let textResult = ''
    // isApiError 错误信息标记headless 查询引擎是否启用对应路径。
    let isApiError = false

    // 当 `result.type` 匹配 `'assistant'` 时，headless 查询引擎执行对应分支。
    if (result.type === 'assistant') {
      // lastContent保存`last`，供headless 查询引擎后续处理使用。
      const lastContent = last(result.message.content)
      // headless 查询引擎在这里进入条件判断，后续代码按实际状态分流。
      if (
        lastContent?.type === 'text' &&
        !SYNTHETIC_MESSAGES.has(lastContent.text)
      ) {
        // textResult更新为 `lastContent.text`，确保QueryEngine后续读取最新状态。
        textResult = lastContent.text
      }
      // isApiError 错误信息更新为 `Boolean(result.isApiErrorMessage)`，确保QueryEngine后续读取最新状态。
      isApiError = Boolean(result.isApiErrorMessage)
    }

    // 生成器产出 `{`，把阶段性结果交给上层消费。
    yield {
      type: 'result',
      subtype: 'success',
      is_error: isApiError,
      duration_ms: Date.now() - startTime,
      duration_api_ms: getTotalAPIDuration(),
      num_turns: turnCount,
      result: textResult,
      stop_reason: lastStopReason,
      session_id: getSessionId(),
      total_cost_usd: getTotalCost(),
      usage: this.totalUsage,
      modelUsage: getModelUsage(),
      permission_denials: this.permissionDenials,
      structured_output: structuredOutputFromTool,
      fast_mode_state: getFastModeState(
        mainLoopModel,
        initialAppState.fastMode,
      ),
      uuid: randomUUID(),
    }
  }

  // interrupt 使用 无 完成headless 查询引擎里的对应操作。
  interrupt(): void {
    // 触发取消信号，通知headless 查询引擎中仍在等待的异步任务尽快停止。
    this.abortController.abort()
  }

  // getMessages不依赖额外参数，直接计算headless 查询引擎需要的结果。
  getMessages(): readonly Message[] {
    // 返回 `this.mutableMessages`，作为headless 查询引擎这次计算的结果。
    return this.mutableMessages
  }

  // getReadFileState不依赖额外参数，直接计算headless 查询引擎需要的结果。
  getReadFileState(): FileStateCache {
    // 返回 `this.readFileState`，作为headless 查询引擎这次计算的结果。
    return this.readFileState
  }

  // getSessionId不依赖额外参数，直接计算headless 查询引擎需要的结果。
  getSessionId(): string {
    // 返回 `getSessionId()`，作为headless 查询引擎这次计算的结果。
    return getSessionId()
  }

  // setModel 根据 model: string 更新headless 查询引擎的状态。
  setModel(model: string): void {
    // userSpecifiedModel更新为 `model`，确保QueryEngine后续读取最新状态。
    this.config.userSpecifiedModel = model
  }
}

/**
 * Sends a single prompt to the Claude API and returns the response.
 * Assumes that claude is being used non-interactively -- will not
 * ask the user for permissions or further input.
 *
 * Convenience wrapper around QueryEngine for one-shot usage.
 */
// headless 查询引擎在这里处理 `export async function* ask({`，完成这一小步状态转换。
export async function* ask({
  commands,
  prompt,
  promptUuid,
  isMeta,
  cwd,
  tools,
  mcpClients,
  verbose = false,
  thinkingConfig,
  maxTurns,
  maxBudgetUsd,
  taskBudget,
  canUseTool,
  mutableMessages = [],
  getReadFileCache,
  setReadFileCache,
  customSystemPrompt,
  appendSystemPrompt,
  userSpecifiedModel,
  fallbackModel,
  jsonSchema,
  getAppState,
  setAppState,
  abortController,
  replayUserMessages = false,
  includePartialMessages = false,
  handleElicitation,
  agents = [],
  setSDKStatus,
  orphanedPermission,
}: {
  commands: Command[]
  prompt: string | Array<ContentBlockParam>
  promptUuid?: string
  isMeta?: boolean
  cwd: string
  tools: Tools
  verbose?: boolean
  mcpClients: MCPServerConnection[]
  thinkingConfig?: ThinkingConfig
  maxTurns?: number
  maxBudgetUsd?: number
  taskBudget?: { total: number }
  canUseTool: CanUseToolFn
  mutableMessages?: Message[]
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  fallbackModel?: string
  jsonSchema?: Record<string, unknown>
  // 这个回调绑定到 getAppState: () => AppState，负责headless 查询引擎在该局部场景下的响应。
  getAppState: () => AppState
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责headless 查询引擎在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
  // 这个回调绑定到 getReadFileCache: () => FileStateCache，负责headless 查询引擎在该局部场景下的响应。
  getReadFileCache: () => FileStateCache
  // 这个回调绑定到 setReadFileCache: (cache: FileStateCache) => void，负责headless 查询引擎在该局部场景下的响应。
  setReadFileCache: (cache: FileStateCache) => void
  abortController?: AbortController
  replayUserMessages?: boolean
  includePartialMessages?: boolean
  handleElicitation?: ToolUseContext['handleElicitation']
  agents?: AgentDefinition[]
  // 这个回调绑定到 setSDKStatus?: (status: SDKStatus) => void，负责headless 查询引擎在该局部场景下的响应。
  setSDKStatus?: (status: SDKStatus) => void
  orphanedPermission?: OrphanedPermission
}): AsyncGenerator<SDKMessage, void, unknown> {
  // engine保存`QueryEngine`，供headless 查询引擎后续处理使用。
  const engine = new QueryEngine({
    cwd,
    tools,
    commands,
    mcpClients,
    agents,
    canUseTool,
    getAppState,
    setAppState,
    initialMessages: mutableMessages,
    readFileCache: cloneFileStateCache(getReadFileCache()),
    customSystemPrompt,
    appendSystemPrompt,
    userSpecifiedModel,
    fallbackModel,
    thinkingConfig,
    maxTurns,
    maxBudgetUsd,
    taskBudget,
    jsonSchema,
    verbose,
    handleElicitation,
    replayUserMessages,
    includePartialMessages,
    setSDKStatus,
    abortController,
    orphanedPermission,
    ...(feature('HISTORY_SNIP')
      ? {
          // 这个回调绑定到 snipReplay: (yielded: Message, store: Message[]) => {，负责headless 查询引擎在该局部场景下的响应。
          snipReplay: (yielded: Message, store: Message[]) => {
            // 满足 `!snipProjection!.isSnipBoundaryMessage(yielded)` 时，headless 查询引擎执行该分支。
            if (!snipProjection!.isSnipBoundaryMessage(yielded))
              // 返回 `undefined`，作为headless 查询引擎这次计算的结果。
              return undefined
            // 返回 `snipModule!.snipCompactIfNeeded(store, { force: true })`，作为headless 查询引擎这次计算的结果。
            return snipModule!.snipCompactIfNeeded(store, { force: true })
          },
        }
      : {}),
  })

  // 保护这一段可能失败的headless 查询引擎操作，确保异常能进入相邻错误处理。
  try {
    // 生成器产出 `yield* engine.submitMessage(prompt, {`，把阶段性结果交给上层消费。
    yield* engine.submitMessage(prompt, {
      uuid: promptUuid,
      isMeta,
    })
  } finally {
    // setReadFileCache 写入新的状态值，使headless 查询引擎后续读取保持一致。
    setReadFileCache(engine.getReadFileState())
  }
}
