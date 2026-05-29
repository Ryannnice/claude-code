// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 clearInvokedSkillsForAgent，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { clearInvokedSkillsForAgent } from '../../bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  ALL_AGENT_DISALLOWED_TOOLS,
  ASYNC_AGENT_ALLOWED_TOOLS,
  CUSTOM_AGENT_DISALLOWED_TOOLS,
  IN_PROCESS_TEAMMATE_ALLOWED_TOOLS,
} from '../../constants/tools.js'
// 接入 startAgentSummarization 服务层能力，把外部通信或共享状态交给 ../../services/AgentSummary/agentSummary.js 处理。
import { startAgentSummarization } from '../../services/AgentSummary/agentSummary.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 clearDumpState 服务层能力，把外部通信或共享状态交给 ../../services/api/dumpPrompts.js 处理。
import { clearDumpState } from '../../services/api/dumpPrompts.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准工具调用的数据契约。
import type { AppState } from '../../state/AppState.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  Tool,
  ToolPermissionContext,
  Tools,
  ToolUseContext,
} from '../../Tool.js'
// 引入 toolMatchesName，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { toolMatchesName } from '../../Tool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  completeAgentTask as completeAsyncAgent,
  createActivityDescriptionResolver,
  createProgressTracker,
  enqueueAgentNotification,
  failAgentTask as failAsyncAgent,
  getProgressUpdate,
  getTokenCountFromTracker,
  isLocalAgentTask,
  killAsyncAgent,
  type ProgressTracker,
  updateAgentProgress as updateAsyncAgentProgress,
  updateProgressFromMessage,
} from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 引入 asAgentId，将 ../../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asAgentId } from '../../types/ids.js'
// 类型依赖 { Message as MessageType } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { Message as MessageType } from '../../types/message.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isInProtectedNamespace 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isInProtectedNamespace } from '../../utils/envUtils.js'
// 复用 AbortError、errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { AbortError, errorMessage } from '../../utils/errors.js'
// 类型依赖 { CacheSafeParams } 来自 ../../utils/forkedAgent.js，用于校准工具调用的数据契约。
import type { CacheSafeParams } from '../../utils/forkedAgent.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  extractTextContent,
  getLastAssistantMessage,
} from '../../utils/messages.js'
// 类型依赖 { PermissionMode } 来自 ../../utils/permissions/PermissionMode.js，用于校准工具调用的数据契约。
import type { PermissionMode } from '../../utils/permissions/PermissionMode.js'
// 复用 permissionRuleValueFromString 工具函数，把通用处理留在 ../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueFromString } from '../../utils/permissions/permissionRuleParser.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildTranscriptForClassifier,
  classifyYoloAction,
} from '../../utils/permissions/yoloClassifier.js'
// 复用 emitTaskProgress as emitTaskProgressEvent 工具函数，把通用处理留在 ../../utils/task/sdkProgress.js 中维护。
import { emitTaskProgress as emitTaskProgressEvent } from '../../utils/task/sdkProgress.js'
// 复用 isInProcessTeammate 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { isInProcessTeammate } from '../../utils/teammateContext.js'
// 复用 getTokenCountFromUsage 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { getTokenCountFromUsage } from '../../utils/tokens.js'
// 引入 EXIT_PLAN_MODE_V2_TOOL_NAME，将 ../ExitPlanModeTool/constants.js 中已经封装好的能力接到本文件流程里。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../ExitPlanModeTool/constants.js'
// 引入 AGENT_TOOL_NAME、LEGACY_AGENT_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME, LEGACY_AGENT_TOOL_NAME } from './constants.js'
// 类型依赖 { AgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { AgentDefinition } from './loadAgentsDir.js'
// ResolvedAgentTools 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolvedAgentTools = {
  hasWildcard: boolean
  validTools: string[]
  invalidTools: string[]
  resolvedTools: Tools
  allowedAgentTypes?: string[]
}

// filterToolsForAgent 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterToolsForAgent({
  tools,
  isBuiltIn,
  isAsync = false,
  permissionMode,
}: {
  tools: Tools
  isBuiltIn: boolean
  isAsync?: boolean
  permissionMode?: PermissionMode
}): Tools {
  // 返回 `tools.filter(tool => {`，作为工具调用这次计算的结果。
  return tools.filter(tool => {
    // Allow MCP tools for all agents
    // 满足 `tool.name.startsWith('mcp__')` 时，工具调用执行该分支。
    if (tool.name.startsWith('mcp__')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Allow ExitPlanMode for agents in plan mode (e.g., in-process teammates)
    // This bypasses both the ALL_AGENT_DISALLOWED_TOOLS and async tool filters
    // 工具调用在这里按实际状态进入对应分支。
    if (
      toolMatchesName(tool, EXIT_PLAN_MODE_V2_TOOL_NAME) &&
      permissionMode === 'plan'
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 满足 `ALL_AGENT_DISALLOWED_TOOLS.has(tool.name)` 时，工具调用执行该分支。
    if (ALL_AGENT_DISALLOWED_TOOLS.has(tool.name)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 只有 `!isBuiltIn && CUSTOM_AGENT_DISALLOWED_TOOLS.has(tool.name)` 满足时，工具调用才执行该分支。
    if (!isBuiltIn && CUSTOM_AGENT_DISALLOWED_TOOLS.has(tool.name)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 只有 `isAsync && !ASYNC_AGENT_ALLOWED_TOOLS.has(tool.name)` 满足时，工具调用才执行该分支。
    if (isAsync && !ASYNC_AGENT_ALLOWED_TOOLS.has(tool.name)) {
      // 只有 `isAgentSwarmsEnabled() && isInProcessTeammate()` 满足时，工具调用才执行该分支。
      if (isAgentSwarmsEnabled() && isInProcessTeammate()) {
        // Allow AgentTool for in-process teammates to spawn sync subagents.
        // Validation in AgentTool.call() prevents background agents and teammate spawning.
        // 满足 `toolMatchesName(tool, AGENT_TOOL_NAME)` 时，工具调用执行该分支。
        if (toolMatchesName(tool, AGENT_TOOL_NAME)) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
        // Allow task tools for in-process teammates to coordinate via shared task list
        // 满足 `IN_PROCESS_TEAMMATE_ALLOWED_TOOLS.has(tool.name)` 时，工具调用执行该分支。
        if (IN_PROCESS_TEAMMATE_ALLOWED_TOOLS.has(tool.name)) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })
}

/**
 * Resolves and validates agent tools against available tools
 * Handles wildcard expansion and validation in one place
 */
// resolveAgentTools 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveAgentTools(
  agentDefinition: Pick<
    AgentDefinition,
    'tools' | 'disallowedTools' | 'source' | 'permissionMode'
  >,
  availableTools: Tools,
  isAsync = false,
  isMainThread = false,
): ResolvedAgentTools {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tools: agentTools,
    disallowedTools,
    source,
    permissionMode,
  } = agentDefinition
  // When isMainThread is true, skip filterToolsForAgent entirely — the main
  // thread's tool pool is already properly assembled by useMergedTools(), so
  // the sub-agent disallow lists shouldn't apply.
  // filteredAvailableTools 集合读取`isMainThread` 整理出中间结果，供工具调用Agent 工具 agent Tool Utils后续步骤使用。
  const filteredAvailableTools = isMainThread
    ? availableTools
    : filterToolsForAgent({
        tools: availableTools,
        isBuiltIn: source === 'built-in',
        isAsync,
        permissionMode,
      })

  // Create a set of disallowed tool names for quick lookup
  // disallowedToolSet保存`Set`，供工具调用后续处理使用。
  const disallowedToolSet = new Set(
    // 这个回调绑定到 disallowedTools?.map(toolSpec => {，负责工具调用在该局部场景下的响应。
    disallowedTools?.map(toolSpec => {
      // 从 `permissionRuleValueFromString(toolSpec)` 解构 toolName，减少Agent 工具 agent Tool Utils对同一对象的重复访问。
      const { toolName } = permissionRuleValueFromString(toolSpec)
      // 返回 `toolName`，作为工具调用这次计算的结果。
      return toolName
    }) ?? [],
  )

  // Filter available tools based on disallowed list
  // allowedAvailableTools 集合筛选`filteredAvailableTools.filter`，供工具调用后续处理使用。
  const allowedAvailableTools = filteredAvailableTools.filter(
    // 工具更新为 `> !disallowedToolSet.has(tool.name)`，确保Agent 工具后续读取最新状态。
    tool => !disallowedToolSet.has(tool.name),
  )

  // If tools is undefined or ['*'], allow all tools (after filtering disallowed)
  // hasWildcard 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasWildcard =
    agentTools === undefined ||
    (agentTools.length === 1 && agentTools[0] === '*')
  // 满足 `hasWildcard` 时，工具调用执行该分支。
  if (hasWildcard) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      hasWildcard: true,
      validTools: [],
      invalidTools: [],
      resolvedTools: allowedAvailableTools,
    }
  }

  // availableToolMap 命名 `new Map<string, Tool>()`，让后续代码直接表达这个值的用途。
  const availableToolMap = new Map<string, Tool>()
  // 按顺序遍历 `allowedAvailableTools` 中的工具，逐个交给工具调用处理。
  for (const tool of allowedAvailableTools) {
    // availableToolMap.set 写入新的状态值，使工具调用后续读取保持一致。
    availableToolMap.set(tool.name, tool)
  }

  // validTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const validTools: string[] = []
  // invalidTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const invalidTools: string[] = []
  // resolved 从空数组开始收集，后续循环会按处理顺序追加条目。
  const resolved: Tool[] = []
  // resolvedToolsSet构建`new Set<Tool>()` 整理出中间结果，供工具调用Agent 工具 agent Tool Utils后续步骤使用。
  const resolvedToolsSet = new Set<Tool>()
  // allowedAgentTypes 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let allowedAgentTypes: string[] | undefined

  // 按顺序遍历 `agentTools` 中的toolSpec，逐个交给工具调用处理。
  for (const toolSpec of agentTools) {
    // Parse the tool spec to extract the base tool name and any permission pattern
    // 从 `permissionRuleValueFromString(toolSpec)` 解构 toolName、ruleContent，减少Agent 工具 agent Tool Utils对同一对象的重复访问。
    const { toolName, ruleContent } = permissionRuleValueFromString(toolSpec)

    // Special case: Agent tool carries allowedAgentTypes metadata in its spec
    // 满足 `toolName === AGENT_TOOL_NAME` 时，工具调用执行该分支。
    if (toolName === AGENT_TOOL_NAME) {
      // 满足 `ruleContent` 时，工具调用执行该分支。
      if (ruleContent) {
        // Parse comma-separated agent types: "worker, researcher" → ["worker", "researcher"]
        // allowedAgentTypes 集合更新为 `ruleContent.split(',').map(s => s.trim())`，确保Agent 工具后续读取最新状态。
        allowedAgentTypes = ruleContent.split(',').map(s => s.trim())
      }
      // For sub-agents, Agent is excluded by filterToolsForAgent — mark the spec
      // valid for allowedAgentTypes tracking but skip tool resolution.
      // isMainThread缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!isMainThread) {
        // validTools 集合追加新条目，保持收集顺序与输入顺序一致。
        validTools.push(toolSpec)
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // For main thread, filtering was skipped so Agent is in availableToolMap —
      // fall through to normal resolution below.
    }

    // 工具读取`availableToolMap.get`，供工具调用后续处理使用。
    const tool = availableToolMap.get(toolName)
    // 满足 `tool` 时，工具调用执行该分支。
    if (tool) {
      // validTools 集合追加新条目，保持收集顺序与输入顺序一致。
      validTools.push(toolSpec)
      // 满足 `!resolvedToolsSet.has(tool)` 时，工具调用执行该分支。
      if (!resolvedToolsSet.has(tool)) {
        // resolved追加新条目，保持收集顺序与输入顺序一致。
        resolved.push(tool)
        // resolvedToolsSet.add 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolvedToolsSet.add(tool)
      }
    } else {
      // invalidTools 集合追加新条目，保持收集顺序与输入顺序一致。
      invalidTools.push(toolSpec)
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    hasWildcard: false,
    validTools,
    invalidTools,
    resolvedTools: resolved,
    allowedAgentTypes,
  }
}

// agentToolResultSchema保存`lazySchema`，供工具调用后续处理使用。
export const agentToolResultSchema = lazySchema(() =>
  z.object({
    agentId: z.string(),
    // Optional: older persisted sessions won't have this (resume replays
    // results verbatim without re-validation). Used to gate the sync
    // result trailer — one-shot built-ins skip the SendMessage hint.
    agentType: z.string().optional(),
    content: z.array(z.object({ type: z.literal('text'), text: z.string() })),
    totalToolUseCount: z.number(),
    totalDurationMs: z.number(),
    totalTokens: z.number(),
    usage: z.object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      cache_creation_input_tokens: z.number().nullable(),
      cache_read_input_tokens: z.number().nullable(),
      server_tool_use: z
        .object({
          web_search_requests: z.number(),
          web_fetch_requests: z.number(),
        })
        .nullable(),
      service_tier: z.enum(['standard', 'priority', 'batch']).nullable(),
      cache_creation: z
        .object({
          ephemeral_1h_input_tokens: z.number(),
          ephemeral_5m_input_tokens: z.number(),
        })
        .nullable(),
    }),
  }),
)

// AgentToolResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentToolResult = z.input<ReturnType<typeof agentToolResultSchema>>

// countToolUses 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countToolUses(messages: MessageType[]): number {
  // count 数量保存`0`，供后续判断或组装使用。
  let count = 0
  // 按顺序遍历 `messages` 中的m，逐个交给工具调用处理。
  for (const m of messages) {
    // 当 `m.type` 匹配 `'assistant'` 时，工具调用执行对应分支。
    if (m.type === 'assistant') {
      // 按顺序遍历 `m.message.content` 中的block，逐个交给工具调用处理。
      for (const block of m.message.content) {
        // 当 `block.type` 匹配 `'tool_use'` 时，工具调用执行对应分支。
        if (block.type === 'tool_use') {
          // Agent 工具 agent Tool Utils在这里处理 `count++`，完成这一小步状态转换。
          count++
        }
      }
    }
  }
  // 返回 `count`，作为工具调用这次计算的结果。
  return count
}

// finalizeAgentTool 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function finalizeAgentTool(
  agentMessages: MessageType[],
  agentId: string,
  metadata: {
    prompt: string
    resolvedAgentModel: string
    isBuiltInAgent: boolean
    startTime: number
    agentType: string
    isAsync: boolean
  },
): AgentToolResult {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    prompt,
    resolvedAgentModel,
    isBuiltInAgent,
    startTime,
    agentType,
    isAsync,
  } = metadata

  // lastAssistantMessage 消息数据读取`getLastAssistantMessage`，供工具调用后续处理使用。
  const lastAssistantMessage = getLastAssistantMessage(agentMessages)
  // 满足 `lastAssistantMessage === undefined` 时，工具调用执行该分支。
  if (lastAssistantMessage === undefined) {
    // 抛出 new Error('No assistant messages found')，阻止工具调用在无效状态下继续运行。
    throw new Error('No assistant messages found')
  }
  // Extract text content from the agent's response. If the final assistant
  // message is a pure tool_use block (loop exited mid-turn), fall back to
  // the most recent assistant message that has text content.
  // 文本内容筛选`content.filter`，供工具调用后续处理使用。
  let content = lastAssistantMessage.message.content.filter(
    // _更新为 `> _.type === 'text'`，确保Agent 工具后续读取最新状态。
    _ => _.type === 'text',
  )
  // 文本内容为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (content.length === 0) {
    // 循环处理 `let i = agentMessages.length - 1; i >= 0; i--`，让工具调用逐项把同类条目按顺序走完。
    for (let i = agentMessages.length - 1; i >= 0; i--) {
      // m读取 `agentMessages[i]!` 对应条目，后续围绕该成员继续处理。
      const m = agentMessages[i]!
      // `m.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
      if (m.type !== 'assistant') continue
      // textBlocks 集合筛选`content.filter`，供工具调用后续处理使用。
      const textBlocks = m.message.content.filter(_ => _.type === 'text')
      // 满足 `textBlocks.length > 0` 时，工具调用执行该分支。
      if (textBlocks.length > 0) {
        // 文本内容更新为 `textBlocks`，确保Agent 工具后续读取最新状态。
        content = textBlocks
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }
    }
  }

  // totalTokens 集合读取`getTokenCountFromUsage`，供工具调用后续处理使用。
  const totalTokens = getTokenCountFromUsage(lastAssistantMessage.message.usage)
  // totalToolUseCount 数量统计`countToolUses`，供工具调用后续处理使用。
  const totalToolUseCount = countToolUses(agentMessages)

  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_agent_tool_completed', {
    agent_type:
      agentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    model:
      resolvedAgentModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    prompt_char_count: prompt.length,
    response_char_count: content.length,
    assistant_message_count: agentMessages.length,
    total_tool_uses: totalToolUseCount,
    duration_ms: Date.now() - startTime,
    total_tokens: totalTokens,
    is_built_in_agent: isBuiltInAgent,
    is_async: isAsync,
  })

  // Signal to inference that this subagent's cache chain can be evicted.
  // lastRequestId 请求数据保存`lastAssistantMessage.requestId`，供工具调用Agent 工具 agent Tool Utils后续判断或输出使用。
  const lastRequestId = lastAssistantMessage.requestId
  // 满足 `lastRequestId` 时，工具调用执行该分支。
  if (lastRequestId) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_cache_eviction_hint', {
      scope:
        'subagent_end' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_request_id:
        lastRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    agentId,
    agentType,
    content,
    totalDurationMs: Date.now() - startTime,
    totalTokens,
    totalToolUseCount,
    usage: lastAssistantMessage.message.usage,
  }
}

/**
 * Returns the name of the last tool_use block in an assistant message,
 * or undefined if the message is not an assistant message with tool_use.
 */
// getLastToolUseName 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastToolUseName(message: MessageType): string | undefined {
  // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'assistant') return undefined
  // block筛选`content.findLast`，供工具调用后续处理使用。
  const block = message.message.content.findLast(b => b.type === 'tool_use')
  // 返回 `block?.type === 'tool_use' ? block.name : undefined`，作为工具调用这次计算的结果。
  return block?.type === 'tool_use' ? block.name : undefined
}

// emitTaskProgress 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitTaskProgress(
  tracker: ProgressTracker,
  taskId: string,
  toolUseId: string | undefined,
  description: string,
  startTime: number,
  lastToolName: string,
): void {
  // progress 集合读取`getProgressUpdate`，供工具调用后续处理使用。
  const progress = getProgressUpdate(tracker)
  // 调用 emitTaskProgressEvent，触发工具调用此处需要的副作用。
  emitTaskProgressEvent({
    taskId,
    toolUseId,
    description: progress.lastActivity?.activityDescription ?? description,
    startTime,
    totalTokens: progress.tokenCount,
    toolUses: progress.toolUseCount,
    lastToolName,
  })
}

// classifyHandoffIfNeeded 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function classifyHandoffIfNeeded({
  agentMessages,
  tools,
  toolPermissionContext,
  abortSignal,
  subagentType,
  totalToolUseCount,
}: {
  agentMessages: MessageType[]
  tools: Tools
  toolPermissionContext: AppState['toolPermissionContext']
  abortSignal: AbortSignal
  subagentType: string
  totalToolUseCount: number
}): Promise<string | null> {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，工具调用执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // `toolPermissionContext.mode` 与 `'auto'` 不一致时刷新派生状态，避免使用过期结果。
    if (toolPermissionContext.mode !== 'auto') return null

    // agentTranscript构建`buildTranscriptForClassifier`，供工具调用后续处理使用。
    const agentTranscript = buildTranscriptForClassifier(agentMessages, tools)
    // agentTranscript缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!agentTranscript) return null

    // classifierResult保存`classifyYoloAction`，供工具调用后续处理使用。
    const classifierResult = await classifyYoloAction(
      agentMessages,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: "Sub-agent has finished and is handing back control to the main agent. Review the sub-agent's work based on the block rules and let the main agent know if any file is dangerous (the main agent will see the reason).",
          },
        ],
      },
      tools,
      toolPermissionContext as ToolPermissionContext,
      abortSignal,
    )

    // handoffDecision保存`classifierResult.unavailable`，供后续判断或组装使用。
    const handoffDecision = classifierResult.unavailable
      ? 'unavailable'
      : classifierResult.shouldBlock
        ? 'blocked'
        : 'allowed'
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_auto_mode_decision', {
      decision:
        handoffDecision as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName:
        // Use legacy name for analytics continuity across the Task→Agent rename
        LEGACY_AGENT_TOOL_NAME as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      inProtectedNamespace: isInProtectedNamespace(),
      classifierModel:
        classifierResult.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      agentType:
        subagentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolUseCount: totalToolUseCount,
      isHandoff: true,
      // For handoff, the relevant agent completion is the subagent's final
      // assistant message — the last thing the classifier transcript shows
      // before the handoff review prompt.
      agentMsgId: getLastAssistantMessage(agentMessages)?.message
        .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      classifierStage:
        classifierResult.stage as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      classifierStage1RequestId:
        classifierResult.stage1RequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      classifierStage1MsgId:
        classifierResult.stage1MsgId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      classifierStage2RequestId:
        classifierResult.stage2RequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      classifierStage2MsgId:
        classifierResult.stage2MsgId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 满足 `classifierResult.shouldBlock` 时，工具调用执行该分支。
    if (classifierResult.shouldBlock) {
      // When classifier is unavailable, still propagate the sub-agent's
      // results but with a warning so the parent agent can verify the work.
      // 满足 `classifierResult.unavailable` 时，工具调用执行该分支。
      if (classifierResult.unavailable) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Handoff classifier unavailable, allowing sub-agent output with warning',
          { level: 'warn' },
        )
        // 返回 ``Note: The safety classifier was unavailable when reviewing this sub-ag...`，作为工具调用这次计算的结果。
        return `Note: The safety classifier was unavailable when reviewing this sub-agent's work. Please carefully verify the sub-agent's actions and output before acting on them.`
      }

      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Handoff classifier flagged sub-agent output: ${classifierResult.reason}`,
        { level: 'warn' },
      )
      // 返回 ``SECURITY WARNING: This sub-agent performed actions that may violate se...`，作为工具调用这次计算的结果。
      return `SECURITY WARNING: This sub-agent performed actions that may violate security policy. Reason: ${classifierResult.reason}. Review the sub-agent's actions carefully before acting on its output.`
    }
  }

  // 返回 `null`，作为工具调用这次计算的结果。
  return null
}

/**
 * Extract a partial result string from an agent's accumulated messages.
 * Used when an async agent is killed to preserve what it accomplished.
 * Returns undefined if no text content is found.
 */
// extractPartialResult 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractPartialResult(
  messages: MessageType[],
): string | undefined {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让工具调用逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // m 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const m = messages[i]!
    // `m.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (m.type !== 'assistant') continue
    // 文本保存`extractTextContent`，供工具调用后续处理使用。
    const text = extractTextContent(m.message.content, '\n')
    // 满足 `text` 时，工具调用执行该分支。
    if (text) {
      // 返回 `text`，作为工具调用这次计算的结果。
      return text
    }
  }
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

// SetAppState 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (f: (prev: AppState) => AppState) => void

/**
 * Drives a background agent from spawn to terminal notification.
 * Shared between AgentTool's async-from-start path and resumeAgentBackground.
 */
// runAsyncAgentLifecycle 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runAsyncAgentLifecycle({
  taskId,
  abortController,
  makeStream,
  metadata,
  description,
  toolUseContext,
  rootSetAppState,
  agentIdForCleanup,
  enableSummarization,
  getWorktreeResult,
}: {
  taskId: string
  abortController: AbortController
  // Agent 工具 agent Tool Utils在这里处理 `makeStream: (`，完成这一小步状态转换。
  makeStream: (
    // 这个回调绑定到 onCacheSafeParams: ((p: CacheSafeParams) => void) | undefined,，负责工具调用在该局部场景下的响应。
    onCacheSafeParams: ((p: CacheSafeParams) => void) | undefined,
  ) => AsyncGenerator<MessageType, void>
  metadata: Parameters<typeof finalizeAgentTool>[2]
  description: string
  toolUseContext: ToolUseContext
  rootSetAppState: SetAppState
  agentIdForCleanup: string
  enableSummarization: boolean
  // 这个回调绑定到 getWorktreeResult: () => Promise<{，负责工具调用在该局部场景下的响应。
  getWorktreeResult: () => Promise<{
    worktreePath?: string
    worktreeBranch?: string
  }>
}): Promise<void> {
  // 这个回调绑定到 let stopSummarization: (() => void) | undefined，负责工具调用在该局部场景下的响应。
  let stopSummarization: (() => void) | undefined
  // agentMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentMessages: MessageType[] = []
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // tracker构建`createProgressTracker`，供工具调用后续处理使用。
    const tracker = createProgressTracker()
    // resolveActivity构建`createActivityDescriptionResolver`，供工具调用后续处理使用。
    const resolveActivity = createActivityDescriptionResolver(
      toolUseContext.options.tools,
    )
    // onCacheSafeParams 缓存保存`enableSummarization`，供工具调用Agent 工具 agent Tool Utils后续判断或输出使用。
    const onCacheSafeParams = enableSummarization
      // 这个回调绑定到 ? (params: CacheSafeParams) => {，负责工具调用在该局部场景下的响应。
      ? (params: CacheSafeParams) => {
          // 从 `startAgentSummarization(` 解构 stop，减少Agent 工具 agent Tool Utils对同一对象的重复访问。
          const { stop } = startAgentSummarization(
            taskId,
            asAgentId(taskId),
            params,
            rootSetAppState,
          )
          // stopSummarization更新为 `stop`，确保Agent 工具后续读取最新状态。
          stopSummarization = stop
        }
      : undefined
    // 逐项读取 `makeStream(onCacheSafeParams)` 中的消息，按输入顺序推进工具调用。
    for await (const message of makeStream(onCacheSafeParams)) {
      // agentMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      agentMessages.push(message)
      // Append immediately when UI holds the task (retain). Bootstrap reads
      // disk in parallel and UUID-merges the prefix — disk-write-before-yield
      // means live is always a suffix of disk, so merge is order-correct.
      // 调用 rootSetAppState，触发工具调用此处需要的副作用。
      rootSetAppState(prev => {
        // t 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
        const t = prev.tasks[taskId]
        // 只有 `!isLocalAgentTask(t) || !t.retain` 满足时，工具调用才执行该分支。
        if (!isLocalAgentTask(t) || !t.retain) return prev
        // base 命名 `t.messages ?? []`，让后续代码直接表达这个值的用途。
        const base = t.messages ?? []
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [taskId]: { ...t, messages: [...base, message] },
          },
        }
      })
      // 调用 updateProgressFromMessage，触发工具调用此处需要的副作用。
      updateProgressFromMessage(
        tracker,
        message,
        resolveActivity,
        toolUseContext.options.tools,
      )
      // 调用 updateAsyncAgentProgress，触发工具调用此处需要的副作用。
      updateAsyncAgentProgress(
        taskId,
        getProgressUpdate(tracker),
        rootSetAppState,
      )
      // lastToolName读取`getLastToolUseName`，供工具调用后续处理使用。
      const lastToolName = getLastToolUseName(message)
      // 满足 `lastToolName` 时，工具调用执行该分支。
      if (lastToolName) {
        // 调用 emitTaskProgress，触发工具调用此处需要的副作用。
        emitTaskProgress(
          tracker,
          taskId,
          toolUseContext.toolUseId,
          description,
          metadata.startTime,
          lastToolName,
        )
      }
    }

    // 调用 stopSummarization?.()，完成这一处局部操作。
    stopSummarization?.()

    // agentResult保存`finalizeAgentTool`，供工具调用后续处理使用。
    const agentResult = finalizeAgentTool(agentMessages, taskId, metadata)

    // Mark task completed FIRST so TaskOutput(block=true) unblocks
    // immediately. classifyHandoffIfNeeded (API call) and getWorktreeResult
    // (git exec) are notification embellishments that can hang — they must
    // not gate the status transition (gh-20236).
    // 调用 completeAsyncAgent，触发工具调用此处需要的副作用。
    completeAsyncAgent(agentResult, rootSetAppState)

    // finalMessage 消息数据保存`extractTextContent`，供工具调用后续处理使用。
    let finalMessage = extractTextContent(agentResult.content, '\n')

    // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，工具调用执行该分支。
    if (feature('TRANSCRIPT_CLASSIFIER')) {
      // handoffWarning 警告信息保存`classifyHandoffIfNeeded`，供工具调用后续处理使用。
      const handoffWarning = await classifyHandoffIfNeeded({
        agentMessages,
        tools: toolUseContext.options.tools,
        toolPermissionContext:
          toolUseContext.getAppState().toolPermissionContext,
        abortSignal: abortController.signal,
        subagentType: metadata.agentType,
        totalToolUseCount: agentResult.totalToolUseCount,
      })
      // 满足 `handoffWarning` 时，工具调用执行该分支。
      if (handoffWarning) {
        // finalMessage 消息数据更新为 ``${handoffWarning}\n\n${finalMessage}``，确保Agent 工具后续读取最新状态。
        finalMessage = `${handoffWarning}\n\n${finalMessage}`
      }
    }

    // worktreeResult读取`getWorktreeResult`，供工具调用后续处理使用。
    const worktreeResult = await getWorktreeResult()

    // 调用 enqueueAgentNotification，触发工具调用此处需要的副作用。
    enqueueAgentNotification({
      taskId,
      description,
      status: 'completed',
      setAppState: rootSetAppState,
      finalMessage,
      usage: {
        totalTokens: getTokenCountFromTracker(tracker),
        toolUses: agentResult.totalToolUseCount,
        durationMs: agentResult.totalDurationMs,
      },
      toolUseId: toolUseContext.toolUseId,
      ...worktreeResult,
    })
  } catch (error) {
    // 调用 stopSummarization?.()，完成这一处局部操作。
    stopSummarization?.()
    // 满足 `error instanceof AbortError` 时，工具调用执行该分支。
    if (error instanceof AbortError) {
      // killAsyncAgent is a no-op if TaskStop already set status='killed' —
      // but only this catch handler has agentMessages, so the notification
      // must fire unconditionally. Transition status BEFORE worktree cleanup
      // so TaskOutput unblocks even if git hangs (gh-20236).
      // 调用 killAsyncAgent，触发工具调用此处需要的副作用。
      killAsyncAgent(taskId, rootSetAppState)
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_agent_tool_terminated', {
        agent_type:
          metadata.agentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        model:
          metadata.resolvedAgentModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        duration_ms: Date.now() - metadata.startTime,
        is_async: true,
        is_built_in_agent: metadata.isBuiltInAgent,
        reason:
          'user_kill_async' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // worktreeResult读取`getWorktreeResult`，供工具调用后续处理使用。
      const worktreeResult = await getWorktreeResult()
      // partialResult保存`extractPartialResult`，供工具调用后续处理使用。
      const partialResult = extractPartialResult(agentMessages)
      // 调用 enqueueAgentNotification，触发工具调用此处需要的副作用。
      enqueueAgentNotification({
        taskId,
        description,
        status: 'killed',
        setAppState: rootSetAppState,
        toolUseId: toolUseContext.toolUseId,
        finalMessage: partialResult,
        ...worktreeResult,
      })
      // Agent 工具 agent Tool Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 消息保存`errorMessage`，供工具调用后续处理使用。
    const msg = errorMessage(error)
    // 调用 failAsyncAgent，触发工具调用此处需要的副作用。
    failAsyncAgent(taskId, msg, rootSetAppState)
    // worktreeResult读取`getWorktreeResult`，供工具调用后续处理使用。
    const worktreeResult = await getWorktreeResult()
    // 调用 enqueueAgentNotification，触发工具调用此处需要的副作用。
    enqueueAgentNotification({
      taskId,
      description,
      status: 'failed',
      error: msg,
      setAppState: rootSetAppState,
      toolUseId: toolUseContext.toolUseId,
      ...worktreeResult,
    })
  } finally {
    // 调用 clearInvokedSkillsForAgent，触发工具调用此处需要的副作用。
    clearInvokedSkillsForAgent(agentIdForCleanup)
    // 调用 clearDumpState，触发工具调用此处需要的副作用。
    clearDumpState(agentIdForCleanup)
  }
}
