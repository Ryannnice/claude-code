/**
 * Shared helpers for building the API cache-key prefix (systemPrompt,
 * userContext, systemContext) for query() calls.
 *
 * Lives in its own file because it imports from context.ts and
 * constants/prompts.ts, which are high in the dependency graph. Putting
 * these imports in systemPrompt.ts or sideQuestion.ts (both reachable
 * from commands.ts) would create cycles. Only entrypoint-layer files
 * import from here (QueryEngine.ts, cli/print.ts).
 */

// 类型依赖 { Command } 来自 ../commands.js，用于校准共享工具的数据契约。
import type { Command } from '../commands.js'
// 引入 getSystemPrompt，将 ../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../constants/prompts.js'
// 引入 getSystemContext、getUserContext，将 ../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from '../context.js'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准共享工具的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'
// 类型依赖 { AppState } 来自 ../state/AppStateStore.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppStateStore.js'
// 类型依赖 { Tools, ToolUseContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tools, ToolUseContext } from '../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 createAbortController，将 ./abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from './abortController.js'
// 类型依赖 { FileStateCache } 来自 ./fileStateCache.js，用于校准共享工具的数据契约。
import type { FileStateCache } from './fileStateCache.js'
// 类型依赖 { CacheSafeParams } 来自 ./forkedAgent.js，用于校准共享工具的数据契约。
import type { CacheSafeParams } from './forkedAgent.js'
// 引入 getMainLoopModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModel } from './model/model.js'
// 引入 asSystemPrompt，将 ./systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from './systemPromptType.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  shouldEnableThinkingByDefault,
  type ThinkingConfig,
} from './thinking.js'

/**
 * Fetch the three context pieces that form the API cache-key prefix:
 * systemPrompt parts, userContext, systemContext.
 *
 * When customSystemPrompt is set, the default getSystemPrompt build and
 * getSystemContext are skipped — the custom prompt replaces the default
 * entirely, and systemContext would be appended to a default that isn't
 * being used.
 *
 * Callers assemble the final systemPrompt from defaultSystemPrompt (or
 * customSystemPrompt) + optional extras + appendSystemPrompt. QueryEngine
 * injects coordinator userContext and memory-mechanics prompt on top;
 * sideQuestion's fallback uses the base result directly.
 */
// fetchSystemPromptParts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchSystemPromptParts({
  tools,
  mainLoopModel,
  additionalWorkingDirectories,
  mcpClients,
  customSystemPrompt,
}: {
  tools: Tools
  mainLoopModel: string
  additionalWorkingDirectories: string[]
  mcpClients: MCPServerConnection[]
  customSystemPrompt: string | undefined
}): Promise<{
  defaultSystemPrompt: string[]
  userContext: { [k: string]: string }
  systemContext: { [k: string]: string }
}> {
  // 并行获取 defaultSystemPrompt、userContext、systemContext，缩短共享工具 query Context等待多个独立异步任务的时间。
  const [defaultSystemPrompt, userContext, systemContext] = await Promise.all([
    customSystemPrompt !== undefined
      ? Promise.resolve([])
      : getSystemPrompt(
          tools,
          mainLoopModel,
          additionalWorkingDirectories,
          mcpClients,
        ),
    getUserContext(),
    customSystemPrompt !== undefined ? Promise.resolve({}) : getSystemContext(),
  ])
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { defaultSystemPrompt, userContext, systemContext }
}

/**
 * Build CacheSafeParams from raw inputs when getLastCacheSafeParams() is null.
 *
 * Used by the SDK side_question handler (print.ts) on resume before a turn
 * completes — there's no stopHooks snapshot yet. Mirrors the system prompt
 * assembly in QueryEngine.ts:ask() so the rebuilt prefix matches what the
 * main loop will send, preserving the cache hit in the common case.
 *
 * May still miss the cache if the main loop applies extras this path doesn't
 * know about (coordinator mode, memory-mechanics prompt). That's acceptable —
 * the alternative is returning null and failing the side question entirely.
 */
// buildSideQuestionFallbackParams 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildSideQuestionFallbackParams({
  tools,
  commands,
  mcpClients,
  messages,
  readFileState,
  getAppState,
  setAppState,
  customSystemPrompt,
  appendSystemPrompt,
  thinkingConfig,
  agents,
}: {
  tools: Tools
  commands: Command[]
  mcpClients: MCPServerConnection[]
  messages: Message[]
  readFileState: FileStateCache
  // 这个回调绑定到 getAppState: () => AppState，负责共享工具在该局部场景下的响应。
  getAppState: () => AppState
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责共享工具在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
  customSystemPrompt: string | undefined
  appendSystemPrompt: string | undefined
  thinkingConfig: ThinkingConfig | undefined
  agents: AgentDefinition[]
}): Promise<CacheSafeParams> {
  // mainLoopModel读取`getMainLoopModel`，供共享工具后续处理使用。
  const mainLoopModel = getMainLoopModel()
  // appState 状态读取`getAppState`，供共享工具后续处理使用。
  const appState = getAppState()

  // 共享工具 query Context先整理这一处局部数据，后续分支可以直接读取。
  const { defaultSystemPrompt, userContext, systemContext } =
    await fetchSystemPromptParts({
      tools,
      mainLoopModel,
      additionalWorkingDirectories: Array.from(
        appState.toolPermissionContext.additionalWorkingDirectories.keys(),
      ),
      mcpClients,
      customSystemPrompt,
    })

  // 系统提示词保存`asSystemPrompt`，供共享工具后续处理使用。
  const systemPrompt = asSystemPrompt([
    ...(customSystemPrompt !== undefined
      ? [customSystemPrompt]
      : defaultSystemPrompt),
    ...(appendSystemPrompt ? [appendSystemPrompt] : []),
  ])

  // Strip in-progress assistant message (stop_reason === null) — same guard
  // as btw.tsx. The SDK can fire side_question mid-turn.
  // last保存`messages.at`，供共享工具后续处理使用。
  const last = messages.at(-1)
  // forkContextMessages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const forkContextMessages =
    last?.type === 'assistant' && last.message.stop_reason === null
      ? messages.slice(0, -1)
      : messages

  // toolUseContext 集中保存共享工具 query Context要一起传递的字段。
  const toolUseContext: ToolUseContext = {
    options: {
      commands,
      debug: false,
      mainLoopModel,
      tools,
      verbose: false,
      thinkingConfig:
        thinkingConfig ??
        (shouldEnableThinkingByDefault() !== false
          ? { type: 'adaptive' }
          : { type: 'disabled' }),
      mcpClients,
      mcpResources: {},
      isNonInteractiveSession: true,
      agentDefinitions: { activeAgents: agents, allAgents: [] },
      customSystemPrompt,
      appendSystemPrompt,
    },
    abortController: createAbortController(),
    readFileState,
    getAppState,
    setAppState,
    messages: forkContextMessages,
    // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责共享工具在该局部场景下的响应。
    setInProgressToolUseIDs: () => {},
    // 这个回调绑定到 setResponseLength: () => {},，负责共享工具在该局部场景下的响应。
    setResponseLength: () => {},
    // 这个回调绑定到 updateFileHistoryState: () => {},，负责共享工具在该局部场景下的响应。
    updateFileHistoryState: () => {},
    // 这个回调绑定到 updateAttributionState: () => {},，负责共享工具在该局部场景下的响应。
    updateAttributionState: () => {},
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    forkContextMessages,
  }
}
