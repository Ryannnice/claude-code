// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准工具调用的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 getProjectRoot、getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot, getSessionId } from '../../bootstrap/state.js'
// 引入 getCommand、getSkillToolCommands、hasCommand，将 ../../commands.js 中已经封装好的能力接到本文件流程里。
import { getCommand, getSkillToolCommands, hasCommand } from '../../commands.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_AGENT_PROMPT,
  enhanceSystemPromptWithEnvDetails,
} from '../../constants/prompts.js'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准工具调用的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 引入 getSystemContext、getUserContext，将 ../../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from '../../context.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 引入 query，将 ../../query.js 中已经封装好的能力接到本文件流程里。
import { query } from '../../query.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 getDumpPromptsPath 服务层能力，把外部通信或共享状态交给 ../../services/api/dumpPrompts.js 处理。
import { getDumpPromptsPath } from '../../services/api/dumpPrompts.js'
// 接入 cleanupAgentTracking 服务层能力，把外部通信或共享状态交给 ../../services/api/promptCacheBreakDetection.js 处理。
import { cleanupAgentTracking } from '../../services/api/promptCacheBreakDetection.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  connectToServer,
  fetchToolsForClient,
} from '../../services/mcp/client.js'
// 接入 getMcpConfigByName 服务层能力，把外部通信或共享状态交给 ../../services/mcp/config.js 处理。
import { getMcpConfigByName } from '../../services/mcp/config.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  ScopedMcpServerConfig,
} from '../../services/mcp/types.js'
// 类型依赖 { Tool, Tools, ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool, Tools, ToolUseContext } from '../../Tool.js'
// 引入 killShellTasksForAgent，将 ../../tasks/LocalShellTask/killShellTasks.js 中已经封装好的能力接到本文件流程里。
import { killShellTasksForAgent } from '../../tasks/LocalShellTask/killShellTasks.js'
// 类型依赖 { Command } 来自 ../../types/command.js，用于校准工具调用的数据契约。
import type { Command } from '../../types/command.js'
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准工具调用的数据契约。
import type { AgentId } from '../../types/ids.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  ProgressMessage,
  RequestStartEvent,
  StreamEvent,
  SystemCompactBoundaryMessage,
  TombstoneMessage,
  ToolUseSummaryMessage,
  UserMessage,
} from '../../types/message.js'
// 复用 createAttachmentMessage 工具函数，把通用处理留在 ../../utils/attachments.js 中维护。
import { createAttachmentMessage } from '../../utils/attachments.js'
// 复用 AbortError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { AbortError } from '../../utils/errors.js'
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  cloneFileStateCache,
  createFileStateCacheWithSizeLimit,
  READ_FILE_STATE_CACHE_SIZE,
} from '../../utils/fileStateCache.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type CacheSafeParams,
  createSubagentContext,
} from '../../utils/forkedAgent.js'
// 复用 registerFrontmatterHooks 工具函数，把通用处理留在 ../../utils/hooks/registerFrontmatterHooks.js 中维护。
import { registerFrontmatterHooks } from '../../utils/hooks/registerFrontmatterHooks.js'
// 复用 clearSessionHooks 工具函数，把通用处理留在 ../../utils/hooks/sessionHooks.js 中维护。
import { clearSessionHooks } from '../../utils/hooks/sessionHooks.js'
// 复用 executeSubagentStartHooks 工具函数，把通用处理留在 ../../utils/hooks.js 中维护。
import { executeSubagentStartHooks } from '../../utils/hooks.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage } from '../../utils/messages.js'
// 复用 getAgentModel 工具函数，把通用处理留在 ../../utils/model/agent.js 中维护。
import { getAgentModel } from '../../utils/model/agent.js'
// 类型依赖 { ModelAlias } 来自 ../../utils/model/aliases.js，用于校准工具调用的数据契约。
import type { ModelAlias } from '../../utils/model/aliases.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  clearAgentTranscriptSubdir,
  recordSidechainTranscript,
  setAgentTranscriptSubdir,
  writeAgentMetadata,
} from '../../utils/sessionStorage.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isRestrictedToPluginOnly,
  isSourceAdminTrusted,
} from '../../utils/settings/pluginOnlyPolicy.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  asSystemPrompt,
  type SystemPrompt,
} from '../../utils/systemPromptType.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isPerfettoTracingEnabled,
  registerAgent as registerPerfettoAgent,
  unregisterAgent as unregisterPerfettoAgent,
} from '../../utils/telemetry/perfettoTracing.js'
// 类型依赖 { ContentReplacementState } 来自 ../../utils/toolResultStorage.js，用于校准工具调用的数据契约。
import type { ContentReplacementState } from '../../utils/toolResultStorage.js'
// 复用 createAgentId 工具函数，把通用处理留在 ../../utils/uuid.js 中维护。
import { createAgentId } from '../../utils/uuid.js'
// 引入 resolveAgentTools，将 ./agentToolUtils.js 中已经封装好的能力接到本文件流程里。
import { resolveAgentTools } from './agentToolUtils.js'
// 引入 AgentDefinition、isBuiltInAgent，将 ./loadAgentsDir.js 中已经封装好的能力接到本文件流程里。
import { type AgentDefinition, isBuiltInAgent } from './loadAgentsDir.js'

/**
 * Initialize agent-specific MCP servers
 * Agents can define their own MCP servers in their frontmatter that are additive
 * to the parent's MCP clients. These servers are connected when the agent starts
 * and cleaned up when the agent finishes.
 *
 * @param agentDefinition The agent definition with optional mcpServers
 * @param parentClients MCP clients inherited from parent context
 * @returns Merged clients (parent + agent-specific), agent MCP tools, and cleanup function
 */
// initializeAgentMcpServers 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function initializeAgentMcpServers(
  agentDefinition: AgentDefinition,
  parentClients: MCPServerConnection[],
): Promise<{
  clients: MCPServerConnection[]
  tools: Tools
  // 这个回调绑定到 cleanup: () => Promise<void>，负责工具调用在该局部场景下的响应。
  cleanup: () => Promise<void>
}> {
  // If no agent-specific servers defined, return parent clients as-is
  // 满足 `!agentDefinition.mcpServers?.length` 时，工具调用执行该分支。
  if (!agentDefinition.mcpServers?.length) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      clients: parentClients,
      tools: [],
      // 这个回调绑定到 cleanup: async () => {},，负责工具调用在该局部场景下的响应。
      cleanup: async () => {},
    }
  }

  // When MCP is locked to plugin-only, skip frontmatter MCP servers for
  // USER-CONTROLLED agents only. Plugin, built-in, and policySettings agents
  // are admin-trusted — their frontmatter MCP is part of the admin-approved
  // surface. Blocking them (as the first cut did) breaks plugin agents that
  // legitimately need MCP, contradicting "plugin-provided always loads."
  // agentIsAdminTrusted保存`isSourceAdminTrusted`，供工具调用后续处理使用。
  const agentIsAdminTrusted = isSourceAdminTrusted(agentDefinition.source)
  // 只有 `isRestrictedToPluginOnly('mcp') && !agentIsAdminTrusted` 满足时，工具调用才执行该分支。
  if (isRestrictedToPluginOnly('mcp') && !agentIsAdminTrusted) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Agent: ${agentDefinition.agentType}] Skipping MCP servers: strictPluginOnlyCustomization locks MCP to plugin-only (agent source: ${agentDefinition.source})`,
    )
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      clients: parentClients,
      tools: [],
      // 这个回调绑定到 cleanup: async () => {},，负责工具调用在该局部场景下的响应。
      cleanup: async () => {},
    }
  }

  // agentClients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentClients: MCPServerConnection[] = []
  // Track which clients were newly created (inline definitions) vs. shared from parent
  // Only newly created clients should be cleaned up when the agent finishes
  // newlyCreatedClients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newlyCreatedClients: MCPServerConnection[] = []
  // agentTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentTools: Tool[] = []

  // 按顺序遍历 `agentDefinition.mcpServers` 中的spec，逐个交给工具调用处理。
  for (const spec of agentDefinition.mcpServers) {
    // 配置保存`null`，作为后续空值处理的输入。
    let config: ScopedMcpServerConfig | null = null
    // 名称 先占位，稍后的条件分支会根据实际输入补齐它。
    let name: string
    // isNewlyCreated标记工具调用Agent 工具 run Agent是否启用对应路径。
    let isNewlyCreated = false

    // 当 `typeof spec` 匹配 `'string'` 时，工具调用执行对应分支。
    if (typeof spec === 'string') {
      // Reference by name - look up in existing MCP configs
      // This uses the memoized connectToServer, so we may get a shared client
      // 名称更新为 `spec`，确保Agent 工具后续读取最新状态。
      name = spec
      // 配置更新为 `getMcpConfigByName(spec)`，确保Agent 工具后续读取最新状态。
      config = getMcpConfigByName(spec)
      // 配置缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!config) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Agent: ${agentDefinition.agentType}] MCP server not found: ${spec}`,
          { level: 'warn' },
        )
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
    } else {
      // Inline definition as { [name]: config }
      // These are agent-specific servers that should be cleaned up
      // entries 集合派生`Object.entries`，供工具调用后续处理使用。
      const entries = Object.entries(spec)
      // `entries.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
      if (entries.length !== 1) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Agent: ${agentDefinition.agentType}] Invalid MCP server spec: expected exactly one key`,
          { level: 'warn' },
        )
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // 从 `entries[0]!` 按位置拆出 serverName、serverConfig，让Agent 工具 run Agent分别处理这些返回值。
      const [serverName, serverConfig] = entries[0]!
      // 名称更新为 `serverName`，确保Agent 工具后续读取最新状态。
      name = serverName
      // 配置更新为 `{`，确保Agent 工具后续读取最新状态。
      config = {
        ...serverConfig,
        scope: 'dynamic' as const,
      } as ScopedMcpServerConfig
      // isNewlyCreated更新为 `true`，确保Agent 工具后续读取最新状态。
      isNewlyCreated = true
    }

    // Connect to the server
    // API 客户端保存`connectToServer`，供工具调用后续处理使用。
    const client = await connectToServer(name, config)
    // agentClients 集合追加新条目，保持收集顺序与输入顺序一致。
    agentClients.push(client)
    // 满足 `isNewlyCreated` 时，工具调用执行该分支。
    if (isNewlyCreated) {
      // newlyCreatedClients 集合追加新条目，保持收集顺序与输入顺序一致。
      newlyCreatedClients.push(client)
    }

    // Fetch tools if connected
    // 当 `client.type` 匹配 `'connected'` 时，工具调用执行对应分支。
    if (client.type === 'connected') {
      // tools 集合读取`fetchToolsForClient`，供工具调用后续处理使用。
      const tools = await fetchToolsForClient(client)
      // agentTools 集合追加新条目，保持收集顺序与输入顺序一致。
      agentTools.push(...tools)
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Agent: ${agentDefinition.agentType}] Connected to MCP server '${name}' with ${tools.length} tools`,
      )
    } else {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Agent: ${agentDefinition.agentType}] Failed to connect to MCP server '${name}': ${client.type}`,
        { level: 'warn' },
      )
    }
  }

  // Create cleanup function for agent-specific servers
  // Only clean up newly created clients (inline definitions), not shared/referenced ones
  // Shared clients (referenced by string name) are memoized and used by the parent context
  // cleanup保存`async`，供工具调用后续处理使用。
  const cleanup = async () => {
    // 按顺序遍历 `newlyCreatedClients` 中的API 客户端，逐个交给工具调用处理。
    for (const client of newlyCreatedClients) {
      // 当 `client.type` 匹配 `'connected'` 时，工具调用执行对应分支。
      if (client.type === 'connected') {
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `client.cleanup()` 完成，再继续Agent 工具 run Agent的异步流程。
          await client.cleanup()
        } catch (error) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[Agent: ${agentDefinition.agentType}] Error cleaning up MCP server '${client.name}': ${error}`,
            { level: 'warn' },
          )
        }
      }
    }
  }

  // Return merged clients (parent + agent-specific) and agent tools
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    clients: [...parentClients, ...agentClients],
    tools: agentTools,
    cleanup,
  }
}

// QueryMessage 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type QueryMessage =
  | StreamEvent
  | RequestStartEvent
  | Message
  | ToolUseSummaryMessage
  | TombstoneMessage

/**
 * Type guard to check if a message from query() is a recordable Message type.
 * Matches the types we want to record: assistant, user, progress, or system compact_boundary.
 */
// isRecordableMessage 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRecordableMessage(
  msg: QueryMessage,
): msg is
  | AssistantMessage
  | UserMessage
  | ProgressMessage
  | SystemCompactBoundaryMessage {
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    msg.type === 'assistant' ||
    msg.type === 'user' ||
    msg.type === 'progress' ||
    (msg.type === 'system' &&
      'subtype' in msg &&
      msg.subtype === 'compact_boundary')
  )
}

// Agent 工具 run Agent在这里处理 `export async function* runAgent({`，完成这一小步状态转换。
export async function* runAgent({
  agentDefinition,
  promptMessages,
  toolUseContext,
  canUseTool,
  isAsync,
  canShowPermissionPrompts,
  forkContextMessages,
  querySource,
  override,
  model,
  maxTurns,
  preserveToolUseResults,
  availableTools,
  allowedTools,
  onCacheSafeParams,
  contentReplacementState,
  useExactTools,
  worktreePath,
  description,
  transcriptSubdir,
  onQueryProgress,
}: {
  agentDefinition: AgentDefinition
  promptMessages: Message[]
  toolUseContext: ToolUseContext
  canUseTool: CanUseToolFn
  isAsync: boolean
  /** Whether this agent can show permission prompts. Defaults to !isAsync.
   * Set to true for in-process teammates that run async but share the terminal. */
  canShowPermissionPrompts?: boolean
  forkContextMessages?: Message[]
  querySource: QuerySource
  override?: {
    userContext?: { [k: string]: string }
    systemContext?: { [k: string]: string }
    systemPrompt?: SystemPrompt
    abortController?: AbortController
    agentId?: AgentId
  }
  model?: ModelAlias
  maxTurns?: number
  /** Preserve toolUseResult on messages for subagents with viewable transcripts */
  preserveToolUseResults?: boolean
  /** Precomputed tool pool for the worker agent. Computed by the caller
   * (AgentTool.tsx) to avoid a circular dependency between runAgent and tools.ts.
   * Always contains the full tool pool assembled with the worker's own permission
   * mode, independent of the parent's tool restrictions. */
  availableTools: Tools
  /** Tool permission rules to add to the agent's session allow rules.
   * When provided, replaces ALL allow rules so the agent only has what's
   * explicitly listed (parent approvals don't leak through). */
  allowedTools?: string[]
  /** Optional callback invoked with CacheSafeParams after constructing the agent's
   * system prompt, context, and tools. Used by background summarization to fork
   * the agent's conversation for periodic progress summaries. */
  // 这个回调绑定到 onCacheSafeParams?: (params: CacheSafeParams) => void，负责工具调用在该局部场景下的响应。
  onCacheSafeParams?: (params: CacheSafeParams) => void
  /** Replacement state reconstructed from a resumed sidechain transcript so
   * the same tool results are re-replaced (prompt cache stability). When
   * omitted, createSubagentContext clones the parent's state. */
  contentReplacementState?: ContentReplacementState
  /** When true, use availableTools directly without filtering through
   * resolveAgentTools(). Also inherits the parent's thinkingConfig and
   * isNonInteractiveSession instead of overriding them. Used by the fork
   * subagent path to produce byte-identical API request prefixes for
   * prompt cache hits. */
  useExactTools?: boolean
  /** Worktree path if the agent was spawned with isolation: "worktree".
   * Persisted to metadata so resume can restore the correct cwd. */
  worktreePath?: string
  /** Original task description from AgentTool input. Persisted to metadata
   * so a resumed agent's notification can show the original description. */
  description?: string
  /** Optional subdirectory under subagents/ to group this agent's transcript
   * with related ones (e.g. workflows/<runId> for workflow subagents). */
  transcriptSubdir?: string
  /** Optional callback fired on every message yielded by query() — including
   * stream_event deltas that runAgent otherwise drops. Use to detect liveness
   * during long single-block streams (e.g. thinking) where no assistant
   * message is yielded for >60s. */
  // 这个回调绑定到 onQueryProgress?: () => void，负责工具调用在该局部场景下的响应。
  onQueryProgress?: () => void
}): AsyncGenerator<Message, void> {
  // Track subagent usage for feature discovery

  // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
  const appState = toolUseContext.getAppState()
  // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供工具调用Agent 工具 run Agent后续判断或输出使用。
  const permissionMode = appState.toolPermissionContext.mode
  // Always-shared channel to the root AppState store. toolUseContext.setAppState
  // is a no-op when the *parent* is itself an async agent (nested async→async),
  // so session-scoped writes (hooks, bash tasks) must go through this instead.
  // rootSetAppState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rootSetAppState =
    toolUseContext.setAppStateForTasks ?? toolUseContext.setAppState

  // resolvedAgentModel读取`getAgentModel`，供工具调用后续处理使用。
  const resolvedAgentModel = getAgentModel(
    agentDefinition.model,
    toolUseContext.options.mainLoopModel,
    model,
    permissionMode,
  )

  // agentId构建`createAgentId`，供工具调用后续处理使用。
  const agentId = override?.agentId ? override.agentId : createAgentId()

  // Route this agent's transcript into a grouping subdirectory if requested
  // (e.g. workflow subagents write to subagents/workflows/<runId>/).
  // 满足 `transcriptSubdir` 时，工具调用执行该分支。
  if (transcriptSubdir) {
    // setAgentTranscriptSubdir 写入新的状态值，使工具调用后续读取保持一致。
    setAgentTranscriptSubdir(agentId, transcriptSubdir)
  }

  // Register agent in Perfetto trace for hierarchy visualization
  // 满足 `isPerfettoTracingEnabled()` 时，工具调用执行该分支。
  if (isPerfettoTracingEnabled()) {
    // parentId读取`getSessionId`，供工具调用后续处理使用。
    const parentId = toolUseContext.agentId ?? getSessionId()
    // 调用 registerPerfettoAgent，触发工具调用此处需要的副作用。
    registerPerfettoAgent(agentId, agentDefinition.agentType, parentId)
  }

  // Log API calls path for subagents (ant-only)
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Subagent ${agentDefinition.agentType}] API calls: ${getDisplayPath(getDumpPromptsPath(agentId))}`,
    )
  }

  // Handle message forking for context sharing
  // Filter out incomplete tool calls from parent messages to avoid API errors
  // contextMessages 消息数据 命名 `forkContextMessages`，让后续代码直接表达这个值的用途。
  const contextMessages: Message[] = forkContextMessages
    ? filterIncompleteToolCalls(forkContextMessages)
    : []
  // initialMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
  const initialMessages: Message[] = [...contextMessages, ...promptMessages]

  // agentReadFileState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const agentReadFileState =
    forkContextMessages !== undefined
      ? cloneFileStateCache(toolUseContext.readFileState)
      : createFileStateCacheWithSizeLimit(READ_FILE_STATE_CACHE_SIZE)

  // 并行获取 baseUserContext、baseSystemContext，缩短Agent 工具 run Agent等待多个独立异步任务的时间。
  const [baseUserContext, baseSystemContext] = await Promise.all([
    override?.userContext ?? getUserContext(),
    override?.systemContext ?? getSystemContext(),
  ])

  // Read-only agents (Explore, Plan) don't act on commit/PR/lint rules from
  // CLAUDE.md — the main agent has full context and interprets their output.
  // Dropping claudeMd here saves ~5-15 Gtok/week across 34M+ Explore spawns.
  // Explicit override.userContext from callers is preserved untouched.
  // Kill-switch defaults true; flip tengu_slim_subagent_claudemd=false to revert.
  // shouldOmitClaudeMd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldOmitClaudeMd =
    agentDefinition.omitClaudeMd &&
    !override?.userContext &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_slim_subagent_claudemd', true)
  // Agent 工具 run Agent先整理这一处局部数据，后续分支可以直接读取。
  const { claudeMd: _omittedClaudeMd, ...userContextNoClaudeMd } =
    baseUserContext
  // resolvedUserContext 命名 `shouldOmitClaudeMd`，让后续代码直接表达这个值的用途。
  const resolvedUserContext = shouldOmitClaudeMd
    ? userContextNoClaudeMd
    : baseUserContext

  // Explore/Plan are read-only search agents — the parent-session-start
  // gitStatus (up to 40KB, explicitly labeled stale) is dead weight. If they
  // need git info they run `git status` themselves and get fresh data.
  // Saves ~1-3 Gtok/week fleet-wide.
  // Agent 工具 run Agent先整理这一处局部数据，后续分支可以直接读取。
  const { gitStatus: _omittedGitStatus, ...systemContextNoGit } =
    baseSystemContext
  // resolvedSystemContext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const resolvedSystemContext =
    agentDefinition.agentType === 'Explore' ||
    agentDefinition.agentType === 'Plan'
      ? systemContextNoGit
      : baseSystemContext

  // Override permission mode if agent defines one
  // However, don't override if parent is in bypassPermissions or acceptEdits mode - those should always take precedence
  // For async agents, also set shouldAvoidPermissionPrompts since they can't show UI
  // agentPermissionMode 权限数据保存`agentDefinition.permissionMode`，供后续判断或组装使用。
  const agentPermissionMode = agentDefinition.permissionMode
  // agentGetAppState 状态封装成回调，供工具调用Agent 工具 run Agent在事件触发或异步步骤中调用。
  const agentGetAppState = () => {
    // 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const state = toolUseContext.getAppState()
    // toolPermissionContext 权限数据 命名 `state.toolPermissionContext`，让后续代码直接表达这个值的用途。
    let toolPermissionContext = state.toolPermissionContext

    // Override permission mode if agent defines one (unless parent is bypassPermissions, acceptEdits, or auto)
    // 工具调用在这里按实际状态进入对应分支。
    if (
      agentPermissionMode &&
      state.toolPermissionContext.mode !== 'bypassPermissions' &&
      state.toolPermissionContext.mode !== 'acceptEdits' &&
      !(
        feature('TRANSCRIPT_CLASSIFIER') &&
        state.toolPermissionContext.mode === 'auto'
      )
    ) {
      // toolPermissionContext 权限数据更新为 `{`，确保Agent 工具后续读取最新状态。
      toolPermissionContext = {
        ...toolPermissionContext,
        mode: agentPermissionMode,
      }
    }

    // Set flag to auto-deny prompts for agents that can't show UI
    // Use explicit canShowPermissionPrompts if provided, otherwise:
    //   - bubble mode: always show prompts (bubbles to parent terminal)
    //   - default: !isAsync (sync agents show prompts, async agents don't)
    // shouldAvoidPrompts 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const shouldAvoidPrompts =
      canShowPermissionPrompts !== undefined
        ? !canShowPermissionPrompts
        : agentPermissionMode === 'bubble'
          ? false
          : isAsync
    // 满足 `shouldAvoidPrompts` 时，工具调用执行该分支。
    if (shouldAvoidPrompts) {
      // toolPermissionContext 权限数据更新为 `{`，确保Agent 工具后续读取最新状态。
      toolPermissionContext = {
        ...toolPermissionContext,
        shouldAvoidPermissionPrompts: true,
      }
    }

    // For background agents that can show prompts, await automated checks
    // (classifier, permission hooks) before showing the permission dialog.
    // Since these are background agents, waiting is fine — the user should
    // only be interrupted when automated checks can't resolve the permission.
    // This applies to bubble mode (always) and explicit canShowPermissionPrompts.
    // 只有 `isAsync && !shouldAvoidPrompts` 满足时，工具调用才执行该分支。
    if (isAsync && !shouldAvoidPrompts) {
      // toolPermissionContext 权限数据更新为 `{`，确保Agent 工具后续读取最新状态。
      toolPermissionContext = {
        ...toolPermissionContext,
        awaitAutomatedChecksBeforeDialog: true,
      }
    }

    // Scope tool permissions: when allowedTools is provided, use them as session rules.
    // IMPORTANT: Preserve cliArg rules (from SDK's --allowedTools) since those are
    // explicit permissions from the SDK consumer that should apply to all agents.
    // Only clear session-level rules from the parent to prevent unintended leakage.
    // `allowedTools` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (allowedTools !== undefined) {
      // toolPermissionContext 权限数据更新为 `{`，确保Agent 工具后续读取最新状态。
      toolPermissionContext = {
        ...toolPermissionContext,
        alwaysAllowRules: {
          // Preserve SDK-level permissions from --allowedTools
          cliArg: state.toolPermissionContext.alwaysAllowRules.cliArg,
          // Use the provided allowedTools as session-level permissions
          session: [...allowedTools],
        },
      }
    }

    // Override effort level if agent defines one
    // effortValue 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const effortValue =
      agentDefinition.effort !== undefined
        ? agentDefinition.effort
        : state.effortValue

    // 工具调用在这里按实际状态进入对应分支。
    if (
      toolPermissionContext === state.toolPermissionContext &&
      effortValue === state.effortValue
    ) {
      // 返回 `state`，作为工具调用这次计算的结果。
      return state
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      ...state,
      toolPermissionContext,
      effortValue,
    }
  }

  // resolvedTools 集合读取 hook 状态，供工具调用Agent 工具 run Agent本轮渲染使用。
  const resolvedTools = useExactTools
    ? availableTools
    : resolveAgentTools(agentDefinition, availableTools, isAsync).resolvedTools

  // additionalWorkingDirectories 集合保存`Array.from`，供工具调用后续处理使用。
  const additionalWorkingDirectories = Array.from(
    appState.toolPermissionContext.additionalWorkingDirectories.keys(),
  )

  // agentSystemPrompt保存`override?.systemPrompt`，供工具调用Agent 工具 run Agent后续判断或输出使用。
  const agentSystemPrompt = override?.systemPrompt
    ? override.systemPrompt
    : asSystemPrompt(
        await getAgentSystemPrompt(
          agentDefinition,
          toolUseContext,
          resolvedAgentModel,
          additionalWorkingDirectories,
          resolvedTools,
        ),
      )

  // Determine abortController:
  // - Override takes precedence
  // - Async agents get a new unlinked controller (runs independently)
  // - Sync agents share parent's controller
  // agentAbortController保存`override?.abortController`，供后续判断或组装使用。
  const agentAbortController = override?.abortController
    ? override.abortController
    : isAsync
      ? new AbortController()
      : toolUseContext.abortController

  // Execute SubagentStart hooks and collect additional context
  // additionalContexts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const additionalContexts: string[] = []
  // 逐项读取 `executeSubagentStartHooks(` 中的hookResult，按输入顺序推进Agent 工具 run Agent。
  for await (const hookResult of executeSubagentStartHooks(
    agentId,
    agentDefinition.agentType,
    agentAbortController.signal,
  )) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      hookResult.additionalContexts &&
      hookResult.additionalContexts.length > 0
    ) {
      // additionalContexts 集合追加新条目，保持收集顺序与输入顺序一致。
      additionalContexts.push(...hookResult.additionalContexts)
    }
  }

  // Add SubagentStart hook context as a user message (consistent with SessionStart/UserPromptSubmit)
  // 满足 `additionalContexts.length > 0` 时，工具调用执行该分支。
  if (additionalContexts.length > 0) {
    // contextMessage 消息数据构建`createAttachmentMessage`，供工具调用后续处理使用。
    const contextMessage = createAttachmentMessage({
      type: 'hook_additional_context',
      content: additionalContexts,
      hookName: 'SubagentStart',
      toolUseID: randomUUID(),
      hookEvent: 'SubagentStart',
    })
    // initialMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    initialMessages.push(contextMessage)
  }

  // Register agent's frontmatter hooks (scoped to agent lifecycle)
  // Pass isAgent=true to convert Stop hooks to SubagentStop (since subagents trigger SubagentStop)
  // Same admin-trusted gate for frontmatter hooks: under ["hooks"] alone
  // (skills/agents not locked), user agents still load — block their
  // frontmatter-hook REGISTRATION here where source is known, rather than
  // blanket-blocking all session hooks at execution time (which would
  // also kill plugin agents' hooks).
  // hooksAllowedForThisAgent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hooksAllowedForThisAgent =
    !isRestrictedToPluginOnly('hooks') ||
    isSourceAdminTrusted(agentDefinition.source)
  // 只有 `agentDefinition.hooks && hooksAllowedForThisAgent` 满足时，工具调用才执行该分支。
  if (agentDefinition.hooks && hooksAllowedForThisAgent) {
    // 调用 registerFrontmatterHooks，触发工具调用此处需要的副作用。
    registerFrontmatterHooks(
      rootSetAppState,
      agentId,
      agentDefinition.hooks,
      `agent '${agentDefinition.agentType}'`,
      true, // isAgent - converts Stop to SubagentStop
    )
  }

  // Preload skills from agent frontmatter
  // skillsToPreload保存`agentDefinition.skills ?? []`，供工具调用Agent 工具 run Agent后续判断或输出使用。
  const skillsToPreload = agentDefinition.skills ?? []
  // 满足 `skillsToPreload.length > 0` 时，工具调用执行该分支。
  if (skillsToPreload.length > 0) {
    // allSkills 集合读取`getSkillToolCommands`，供工具调用后续处理使用。
    const allSkills = await getSkillToolCommands(getProjectRoot())

    // Filter valid skills and warn about missing ones
    // validSkills 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const validSkills: Array<{
      skillName: string
      skill: (typeof allSkills)[0] & { type: 'prompt' }
    }> = []

    // 按顺序遍历 `skillsToPreload` 中的skillName，逐个交给工具调用处理。
    for (const skillName of skillsToPreload) {
      // Resolve the skill name, trying multiple strategies:
      // 1. Exact match (hasCommand checks name, userFacingName, aliases)
      // 2. Fully-qualified with agent's plugin prefix (e.g., "my-skill" → "plugin:my-skill")
      // 3. Suffix match on ":skillName" for plugin-namespaced skills
      // resolvedName读取`resolveSkillName`，供工具调用后续处理使用。
      const resolvedName = resolveSkillName(
        skillName,
        allSkills,
        agentDefinition,
      )
      // resolvedName缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!resolvedName) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Agent: ${agentDefinition.agentType}] Warning: Skill '${skillName}' specified in frontmatter was not found`,
          { level: 'warn' },
        )
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // skill读取`getCommand`，供工具调用后续处理使用。
      const skill = getCommand(resolvedName, allSkills)
      // `skill.type` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
      if (skill.type !== 'prompt') {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Agent: ${agentDefinition.agentType}] Warning: Skill '${skillName}' is not a prompt-based skill`,
          { level: 'warn' },
        )
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // validSkills 集合追加新条目，保持收集顺序与输入顺序一致。
      validSkills.push({ skillName, skill })
    }

    // Load all skill contents concurrently and add to initial messages
    // 从 `await import(` 解构 formatSkillLoadingMetadata，减少Agent 工具 run Agent对同一对象的重复访问。
    const { formatSkillLoadingMetadata } = await import(
      '../../utils/processUserInput/processSlashCommand.js'
    )
    // loaded保存`Promise.all`，供工具调用后续处理使用。
    const loaded = await Promise.all(
      // 调用 validSkills.map，触发工具调用此处需要的副作用。
      validSkills.map(async ({ skillName, skill }) => ({
        skillName,
        skill,
        content: await skill.getPromptForCommand('', toolUseContext),
      })),
    )
    // 循环处理 `const { skillName, skill, content } of loaded`，让工具调用逐项把同类条目按顺序走完。
    for (const { skillName, skill, content } of loaded) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Agent: ${agentDefinition.agentType}] Preloaded skill '${skillName}'`,
      )

      // Add command-message metadata so the UI shows which skill is loading
      // metadata格式化`formatSkillLoadingMetadata`，供工具调用后续处理使用。
      const metadata = formatSkillLoadingMetadata(
        skillName,
        skill.progressMessage,
      )

      // initialMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      initialMessages.push(
        createUserMessage({
          content: [{ type: 'text', text: metadata }, ...content],
          isMeta: true,
        }),
      )
    }
  }

  // Initialize agent-specific MCP servers (additive to parent's servers)
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    clients: mergedMcpClients,
    tools: agentMcpTools,
    cleanup: mcpCleanup,
  } = await initializeAgentMcpServers(
    agentDefinition,
    toolUseContext.options.mcpClients,
  )

  // Merge agent MCP tools with resolved agent tools, deduplicating by name.
  // resolvedTools is already deduplicated (see resolveAgentTools), so skip
  // the spread + uniqBy overhead when there are no agent-specific MCP tools.
  // allTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const allTools =
    agentMcpTools.length > 0
      ? uniqBy([...resolvedTools, ...agentMcpTools], 'name')
      : resolvedTools

  // Build agent-specific options
  // agentOptions 集合 集中保存Agent 工具 run Agent要一起传递的字段。
  const agentOptions: ToolUseContext['options'] = {
    isNonInteractiveSession: useExactTools
      ? toolUseContext.options.isNonInteractiveSession
      : isAsync
        ? true
        : (toolUseContext.options.isNonInteractiveSession ?? false),
    appendSystemPrompt: toolUseContext.options.appendSystemPrompt,
    tools: allTools,
    commands: [],
    debug: toolUseContext.options.debug,
    verbose: toolUseContext.options.verbose,
    mainLoopModel: resolvedAgentModel,
    // For fork children (useExactTools), inherit thinking config to match the
    // parent's API request prefix for prompt cache hits. For regular
    // sub-agents, disable thinking to control output token costs.
    thinkingConfig: useExactTools
      ? toolUseContext.options.thinkingConfig
      : { type: 'disabled' as const },
    mcpClients: mergedMcpClients,
    mcpResources: toolUseContext.options.mcpResources,
    agentDefinitions: toolUseContext.options.agentDefinitions,
    // Fork children (useExactTools path) need querySource on context.options
    // for the recursive-fork guard at AgentTool.tsx call() — it checks
    // options.querySource === 'agent:builtin:fork'. This survives autocompact
    // (which rewrites messages, not context.options). Without this, the guard
    // reads undefined and only the message-scan fallback fires — which
    // autocompact defeats by replacing the fork-boilerplate message.
    ...(useExactTools && { querySource }),
  }

  // Create subagent context using shared helper
  // - Sync agents share setAppState, setResponseLength, abortController with parent
  // - Async agents are fully isolated (but with explicit unlinked abortController)
  // agentToolUseContext构建`createSubagentContext`，供工具调用后续处理使用。
  const agentToolUseContext = createSubagentContext(toolUseContext, {
    options: agentOptions,
    agentId,
    agentType: agentDefinition.agentType,
    messages: initialMessages,
    readFileState: agentReadFileState,
    abortController: agentAbortController,
    getAppState: agentGetAppState,
    // Sync agents share these callbacks with parent
    shareSetAppState: !isAsync,
    shareSetResponseLength: true, // Both sync and async contribute to response metrics
    criticalSystemReminder_EXPERIMENTAL:
      agentDefinition.criticalSystemReminder_EXPERIMENTAL,
    contentReplacementState,
  })

  // Preserve tool use results for subagents with viewable transcripts (in-process teammates)
  // 满足 `preserveToolUseResults` 时，工具调用执行该分支。
  if (preserveToolUseResults) {
    // preserveToolUseResults 集合更新为 `true`，确保Agent 工具后续读取最新状态。
    agentToolUseContext.preserveToolUseResults = true
  }

  // Expose cache-safe params for background summarization (prompt cache sharing)
  // 满足 `onCacheSafeParams` 时，工具调用执行该分支。
  if (onCacheSafeParams) {
    // 调用 onCacheSafeParams，触发工具调用此处需要的副作用。
    onCacheSafeParams({
      systemPrompt: agentSystemPrompt,
      userContext: resolvedUserContext,
      systemContext: resolvedSystemContext,
      toolUseContext: agentToolUseContext,
      forkContextMessages: initialMessages,
    })
  }

  // Record initial messages before the query loop starts, plus the agentType
  // so resume can route correctly when subagent_type is omitted. Both writes
  // are fire-and-forget — persistence failure shouldn't block the agent.
  // 这个回调绑定到 void recordSidechainTranscript(initialMessages, agentId).catch(_err =>，负责工具调用在该局部场景下的响应。
  void recordSidechainTranscript(initialMessages, agentId).catch(_err =>
    logForDebugging(`Failed to record sidechain transcript: ${_err}`),
  )
  // 显式忽略 `writeAgentMetadata(agentId, {` 的返回值，只保留它触发的副作用。
  void writeAgentMetadata(agentId, {
    agentType: agentDefinition.agentType,
    ...(worktreePath && { worktreePath }),
    ...(description && { description }),
  // 这个回调绑定到 }).catch(_err => logForDebugging(`Failed to write agent metadata: ${_err}`))，负责工具调用在该局部场景下的响应。
  }).catch(_err => logForDebugging(`Failed to write agent metadata: ${_err}`))

  // Track the last recorded message UUID for parent chain continuity
  // lastRecordedUuid 命名 `initialMessages.at(-1)?.uuid ?? null`，让后续代码直接表达这个值的用途。
  let lastRecordedUuid: UUID | null = initialMessages.at(-1)?.uuid ?? null

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 逐项读取 `query({` 中的消息，按输入顺序推进Agent 工具 run Agent。
    for await (const message of query({
      messages: initialMessages,
      systemPrompt: agentSystemPrompt,
      userContext: resolvedUserContext,
      systemContext: resolvedSystemContext,
      canUseTool,
      toolUseContext: agentToolUseContext,
      querySource,
      maxTurns: maxTurns ?? agentDefinition.maxTurns,
    })) {
      // 调用 onQueryProgress?.()，完成这一处局部操作。
      onQueryProgress?.()
      // Forward subagent API request starts to parent's metrics display
      // so TTFT/OTPS update during subagent execution.
      // 工具调用在这里按实际状态进入对应分支。
      if (
        message.type === 'stream_event' &&
        message.event.type === 'message_start' &&
        message.ttftMs != null
      ) {
        // 调用 toolUseContext.pushApiMetricsEntry?.(message.ttftMs)，完成这一处局部操作。
        toolUseContext.pushApiMetricsEntry?.(message.ttftMs)
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Yield attachment messages (e.g., structured_output) without recording them
      // 当 `message.type` 匹配 `'attachment'` 时，工具调用执行对应分支。
      if (message.type === 'attachment') {
        // Handle max turns reached signal from query.ts
        // 当 `message.attachment.type` 匹配 `'max_turns_reached'` 时，工具调用执行对应分支。
        if (message.attachment.type === 'max_turns_reached') {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[Agent
: $
{
  agentDefinition.agentType
}
] Reached max turns limit ($
{
  message.attachment.maxTurns
}
)`,
          )
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        }
        // 生成器产出 `message`，把阶段性结果交给上层消费。
        yield message
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // 满足 `isRecordableMessage(message)` 时，工具调用执行该分支。
      if (isRecordableMessage(message)) {
        // Record only the new message with correct parent (O(1) per message)
        // 等待 `recordSidechainTranscript(` 完成，再继续Agent 工具 run Agent的异步流程。
        await recordSidechainTranscript(
          [message],
          agentId,
          lastRecordedUuid,
        // 这个回调绑定到 ).catch(err =>，负责工具调用在该局部场景下的响应。
        ).catch(err =>
          logForDebugging(`Failed to record sidechain transcript: ${err}`),
        )
        // `message.type` 与 `'progress'` 不一致时刷新派生状态，避免使用过期结果。
        if (message.type !== 'progress') {
          // lastRecordedUuid更新为 `message.uuid`，确保Agent 工具后续读取最新状态。
          lastRecordedUuid = message.uuid
        }
        // 生成器产出 `message`，把阶段性结果交给上层消费。
        yield message
      }
    }

    // 满足 `agentAbortController.signal.aborted` 时，工具调用执行该分支。
    if (agentAbortController.signal.aborted) {
      // 抛出 new AbortError()，阻止工具调用在无效状态下继续运行。
      throw new AbortError()
    }

    // Run callback if provided (only built-in agents have callbacks)
    // 只有 `isBuiltInAgent(agentDefinition) && agentDefinition.callback` 满足时，工具调用才执行该分支。
    if (isBuiltInAgent(agentDefinition) && agentDefinition.callback) {
      // 调用 agentDefinition.callback，触发工具调用此处需要的副作用。
      agentDefinition.callback()
    }
  } finally {
    // Clean up agent-specific MCP servers (runs on normal completion, abort, or error)
    // 等待 `mcpCleanup()` 完成，再继续Agent 工具 run Agent的异步流程。
    await mcpCleanup()
    // Clean up agent's session hooks
    // 满足 `agentDefinition.hooks` 时，工具调用执行该分支。
    if (agentDefinition.hooks) {
      // 调用 clearSessionHooks，触发工具调用此处需要的副作用。
      clearSessionHooks(rootSetAppState, agentId)
    }
    // Clean up prompt cache tracking state for this agent
    // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，工具调用执行该分支。
    if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
      // 调用 cleanupAgentTracking，触发工具调用此处需要的副作用。
      cleanupAgentTracking(agentId)
    }
    // Release cloned file state cache memory
    // 调用 agentToolUseContext.readFileState.clear，触发工具调用此处需要的副作用。
    agentToolUseContext.readFileState.clear()
    // Release the cloned fork context messages
    // initialMessages 消息数据被清空，Agent 工具从干净状态继续。
    initialMessages.length = 0
    // Release perfetto agent registry entry
    // 调用 unregisterPerfettoAgent，触发工具调用此处需要的副作用。
    unregisterPerfettoAgent(agentId)
    // Release transcript subdir mapping
    // 调用 clearAgentTranscriptSubdir，触发工具调用此处需要的副作用。
    clearAgentTranscriptSubdir(agentId)
    // Release this agent's todos entry. Without this, every subagent that
    // called TodoWrite leaves a key in AppState.todos forever (even after all
    // items complete, the value is [] but the key stays). Whale sessions
    // spawn hundreds of agents; each orphaned key is a small leak that adds up.
    // 调用 rootSetAppState，触发工具调用此处需要的副作用。
    rootSetAppState(prev => {
      // 满足 `!(agentId in prev.todos)` 时，工具调用执行该分支。
      if (!(agentId in prev.todos)) return prev
      // 从 `prev.todos` 解构 [agentId]、其余 todos，减少Agent 工具 run Agent对同一对象的重复访问。
      const { [agentId]: _removed, ...todos } = prev.todos
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { ...prev, todos }
    })
    // Kill any background bash tasks this agent spawned. Without this, a
    // `run_in_background` shell loop (e.g. test fixture fake-logs.sh) outlives
    // the agent as a PPID=1 zombie once the main session eventually exits.
    // 调用 killShellTasksForAgent，触发工具调用此处需要的副作用。
    killShellTasksForAgent(agentId, toolUseContext.getAppState, rootSetAppState)
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 满足 `feature('MONITOR_TOOL')` 时，工具调用执行该分支。
    if (feature('MONITOR_TOOL')) {
      // mcpMod 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const mcpMod =
        require('../../tasks/MonitorMcpTask/MonitorMcpTask.js') as typeof import('../../tasks/MonitorMcpTask/MonitorMcpTask.js')
      // 调用 mcpMod.killMonitorMcpTasksForAgent，触发工具调用此处需要的副作用。
      mcpMod.killMonitorMcpTasksForAgent(
        agentId,
        toolUseContext.getAppState,
        rootSetAppState,
      )
    }
    /* eslint-enable @typescript-eslint/no-require-imports */
  }
}

/**
 * Filters out assistant messages with incomplete tool calls (tool uses without results).
 * This prevents API errors when sending messages with orphaned tool calls.
 */
// filterIncompleteToolCalls 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterIncompleteToolCalls(messages: Message[]): Message[] {
  // Build a set of tool use IDs that have results
  // toolUseIdsWithResults 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const toolUseIdsWithResults = new Set<string>()

  // 按顺序遍历 `messages` 中的消息，逐个交给工具调用处理。
  for (const message of messages) {
    // 当 `message?.type` 匹配 `'user'` 时，工具调用执行对应分支。
    if (message?.type === 'user') {
      // userMessage 消息数据保存`message as UserMessage`，供后续判断或组装使用。
      const userMessage = message as UserMessage
      // 文本内容 命名 `userMessage.message.content`，让后续代码直接表达这个值的用途。
      const content = userMessage.message.content
      // 满足 `Array.isArray(content)` 时，工具调用执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给工具调用处理。
        for (const block of content) {
          // 只有 `block.type === 'tool_result' && block.tool_use_id` 满足时，工具调用才执行该分支。
          if (block.type === 'tool_result' && block.tool_use_id) {
            // 调用 toolUseIdsWithResults.add，触发工具调用此处需要的副作用。
            toolUseIdsWithResults.add(block.tool_use_id)
          }
        }
      }
    }
  }

  // Filter out assistant messages that contain tool calls without results
  // 返回 `messages.filter(message => {`，作为工具调用这次计算的结果。
  return messages.filter(message => {
    // 当 `message?.type` 匹配 `'assistant'` 时，工具调用执行对应分支。
    if (message?.type === 'assistant') {
      // assistantMessage 消息数据 命名 `message as AssistantMessage`，让后续代码直接表达这个值的用途。
      const assistantMessage = message as AssistantMessage
      // 文本内容保存`assistantMessage.message.content`，供工具调用Agent 工具 run Agent后续判断或输出使用。
      const content = assistantMessage.message.content
      // 满足 `Array.isArray(content)` 时，工具调用执行该分支。
      if (Array.isArray(content)) {
        // Check if this assistant message has any tool uses without results
        // hasIncompleteToolCall记录 `content.some` 是否成立，工具调用随后按该结果分支。
        const hasIncompleteToolCall = content.some(
          // block更新为 `>`，确保Agent 工具后续读取最新状态。
          block =>
            block.type === 'tool_use' &&
            block.id &&
            !toolUseIdsWithResults.has(block.id),
        )
        // Exclude messages with incomplete tool calls
        // 返回 `!hasIncompleteToolCall`，作为工具调用这次计算的结果。
        return !hasIncompleteToolCall
      }
    }
    // Keep all non-assistant messages and assistant messages without tool calls
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })
}

// getAgentSystemPrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAgentSystemPrompt(
  agentDefinition: AgentDefinition,
  toolUseContext: Pick<ToolUseContext, 'options'>,
  resolvedAgentModel: string,
  additionalWorkingDirectories: string[],
  resolvedTools: readonly Tool[],
): Promise<string[]> {
  // enabledToolNames 集合保存`Set`，供工具调用后续处理使用。
  const enabledToolNames = new Set(resolvedTools.map(t => t.name))
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // agentPrompt读取`agentDefinition.getSystemPrompt`，供工具调用后续处理使用。
    const agentPrompt = agentDefinition.getSystemPrompt({ toolUseContext })
    // prompts 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const prompts = [agentPrompt]

    // 等待并返回 `enhanceSystemPromptWithEnvDetails(`，调用方直接接收异步结果。
    return await enhanceSystemPromptWithEnvDetails(
      prompts,
      resolvedAgentModel,
      additionalWorkingDirectories,
      enabledToolNames,
    )
  } catch (_error) {
    // 返回 `enhanceSystemPromptWithEnvDetails(`，作为工具调用这次计算的结果。
    return enhanceSystemPromptWithEnvDetails(
      [DEFAULT_AGENT_PROMPT],
      resolvedAgentModel,
      additionalWorkingDirectories,
      enabledToolNames,
    )
  }
}

/**
 * Resolve a skill name from agent frontmatter to a registered command name.
 *
 * Plugin skills are registered with namespaced names (e.g., "my-plugin:my-skill")
 * but agents reference them with bare names (e.g., "my-skill"). This function
 * tries multiple resolution strategies:
 *
 * 1. Exact match via hasCommand (name, userFacingName, aliases)
 * 2. Prefix with agent's plugin name (e.g., "my-skill" → "my-plugin:my-skill")
 * 3. Suffix match — find any command whose name ends with ":skillName"
 */
// resolveSkillName 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveSkillName(
  skillName: string,
  allSkills: Command[],
  agentDefinition: AgentDefinition,
): string | null {
  // 1. Direct match
  // 满足 `hasCommand(skillName, allSkills)` 时，工具调用执行该分支。
  if (hasCommand(skillName, allSkills)) {
    // 返回 `skillName`，作为工具调用这次计算的结果。
    return skillName
  }

  // 2. Try prefixing with the agent's plugin name
  // Plugin agents have agentType like "pluginName:agentName"
  // pluginPrefix 插件数据格式化`agentType.split`，供工具调用后续处理使用。
  const pluginPrefix = agentDefinition.agentType.split(':')[0]
  // 满足 `pluginPrefix` 时，工具调用执行该分支。
  if (pluginPrefix) {
    // qualifiedName保存``${pluginPrefix}:${skillName}``，作为后续固定文本处理的输入。
    const qualifiedName = `${pluginPrefix}:${skillName}`
    // 满足 `hasCommand(qualifiedName, allSkills)` 时，工具调用执行该分支。
    if (hasCommand(qualifiedName, allSkills)) {
      // 返回 `qualifiedName`，作为工具调用这次计算的结果。
      return qualifiedName
    }
  }

  // 3. Suffix match — find a skill whose name ends with ":skillName"
  // suffix 命名 ``:${skillName}``，让后续代码直接表达这个值的用途。
  const suffix = `:${skillName}`
  // match筛选`allSkills.find`，供工具调用后续处理使用。
  const match = allSkills.find(cmd => cmd.name.endsWith(suffix))
  // 满足 `match` 时，工具调用执行该分支。
  if (match) {
    // 返回 `match.name`，作为工具调用这次计算的结果。
    return match.name
  }

  // 返回 `null`，作为工具调用这次计算的结果。
  return null
}
