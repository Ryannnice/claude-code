// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准工具调用的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type McpServerConfig,
  McpServerConfigSchema,
} from '../../services/mcp/types.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  EFFORT_LEVELS,
  type EffortValue,
  parseEffortValue,
} from '../../utils/effort.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 parsePositiveIntFromFrontmatter 工具函数，把通用处理留在 ../../utils/frontmatterParser.js 中维护。
import { parsePositiveIntFromFrontmatter } from '../../utils/frontmatterParser.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  loadMarkdownFilesForSubdir,
  parseAgentToolsFromFrontmatter,
  parseSlashCommandToolsFromFrontmatter,
} from '../../utils/markdownConfigLoader.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  PERMISSION_MODES,
  type PermissionMode,
} from '../../utils/permissions/PermissionMode.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  clearPluginAgentCache,
  loadPluginAgents,
} from '../../utils/plugins/loadPluginAgents.js'
// 复用 HooksSchema、HooksSettings 工具函数，把通用处理留在 ../../utils/settings/types.js 中维护。
import { HooksSchema, type HooksSettings } from '../../utils/settings/types.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 FILE_EDIT_TOOL_NAME，将 ../FileEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { FILE_EDIT_TOOL_NAME } from '../FileEditTool/constants.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'
// 引入 FILE_WRITE_TOOL_NAME，将 ../FileWriteTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME } from '../FileWriteTool/prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  AGENT_COLORS,
  type AgentColorName,
  setAgentColor,
} from './agentColorManager.js'
// 引入 AgentMemoryScope、loadAgentMemoryPrompt，将 ./agentMemory.js 中已经封装好的能力接到本文件流程里。
import { type AgentMemoryScope, loadAgentMemoryPrompt } from './agentMemory.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkAgentMemorySnapshot,
  initializeFromSnapshot,
} from './agentMemorySnapshot.js'
// 引入 getBuiltInAgents，将 ./builtInAgents.js 中已经封装好的能力接到本文件流程里。
import { getBuiltInAgents } from './builtInAgents.js'

// Type for MCP server specification in agent definitions
// Can be either a reference to an existing server by name, or an inline definition as { [name]: config }
// AgentMcpServerSpec 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentMcpServerSpec =
  | string // Reference to existing server by name (e.g., "slack")
  | { [name: string]: McpServerConfig } // Inline definition as { name: config }

// Zod schema for agent MCP server specs
// AgentMcpServerSpecSchema保存`lazySchema`，供工具调用后续处理使用。
const AgentMcpServerSpecSchema = lazySchema(() =>
  z.union([
    z.string(), // Reference by name
    z.record(z.string(), McpServerConfigSchema()), // Inline as { name: config }
  ]),
)

// Zod schemas for JSON agent validation
// Note: HooksSchema is lazy so the circular chain AppState -> loadAgentsDir -> settings/types
// is broken at module load time
// AgentJsonSchema保存`lazySchema`，供工具调用后续处理使用。
const AgentJsonSchema = lazySchema(() =>
  z.object({
    description: z.string().min(1, 'Description cannot be empty'),
    tools: z.array(z.string()).optional(),
    disallowedTools: z.array(z.string()).optional(),
    prompt: z.string().min(1, 'Prompt cannot be empty'),
    model: z
      .string()
      .trim()
      .min(1, 'Model cannot be empty')
      // 链式调用 transform，继续加工上一行在工具调用中产生的数据。
      .transform(m => (m.toLowerCase() === 'inherit' ? 'inherit' : m))
      .optional(),
    effort: z.union([z.enum(EFFORT_LEVELS), z.number().int()]).optional(),
    permissionMode: z.enum(PERMISSION_MODES).optional(),
    mcpServers: z.array(AgentMcpServerSpecSchema()).optional(),
    hooks: HooksSchema().optional(),
    maxTurns: z.number().int().positive().optional(),
    skills: z.array(z.string()).optional(),
    initialPrompt: z.string().optional(),
    memory: z.enum(['user', 'project', 'local']).optional(),
    background: z.boolean().optional(),
    isolation: (process.env.USER_TYPE === 'ant'
      ? z.enum(['worktree', 'remote'])
      : z.enum(['worktree'])
    ).optional(),
  }),
)

// AgentsJsonSchema保存`lazySchema`，供工具调用后续处理使用。
const AgentsJsonSchema = lazySchema(() =>
  z.record(z.string(), AgentJsonSchema()),
)

// Base type with common fields for all agents
// BaseAgentDefinition 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type BaseAgentDefinition = {
  agentType: string
  whenToUse: string
  tools?: string[]
  disallowedTools?: string[]
  skills?: string[] // Skill names to preload (parsed from comma-separated frontmatter)
  mcpServers?: AgentMcpServerSpec[] // MCP servers specific to this agent
  hooks?: HooksSettings // Session-scoped hooks registered when agent starts
  color?: AgentColorName
  model?: string
  effort?: EffortValue
  permissionMode?: PermissionMode
  maxTurns?: number // Maximum number of agentic turns before stopping
  filename?: string // Original filename without .md extension (for user/project/managed agents)
  baseDir?: string
  criticalSystemReminder_EXPERIMENTAL?: string // Short message re-injected at every user turn
  requiredMcpServers?: string[] // MCP server name patterns that must be configured for agent to be available
  background?: boolean // Always run as background task when spawned
  initialPrompt?: string // Prepended to the first user turn (slash commands work)
  memory?: AgentMemoryScope // Persistent memory scope
  isolation?: 'worktree' | 'remote' // Run in an isolated git worktree, or remotely in CCR (ant-only)
  pendingSnapshotUpdate?: { snapshotTimestamp: string }
  /** Omit CLAUDE.md hierarchy from the agent's userContext. Read-only agents
   * (Explore, Plan) don't need commit/PR/lint guidelines — the main agent has
   * full CLAUDE.md and interprets their output. Saves ~5-15 Gtok/week across
   * 34M+ Explore spawns. Kill-switch: tengu_slim_subagent_claudemd. */
  omitClaudeMd?: boolean
}

// Built-in agents - dynamic prompts only, no static systemPrompt field
// BuiltInAgentDefinition 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type BuiltInAgentDefinition = BaseAgentDefinition & {
  source: 'built-in'
  baseDir: 'built-in'
  callback?: () => void
  // Agent 工具 load Agents Dir在这里处理 `getSystemPrompt: (params: {`，完成这一小步状态转换。
  getSystemPrompt: (params: {
    toolUseContext: Pick<ToolUseContext, 'options'>
  }) => string
}

// Custom agents from user/project/policy settings - prompt stored via closure
// CustomAgentDefinition 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CustomAgentDefinition = BaseAgentDefinition & {
  // 这个回调绑定到 getSystemPrompt: () => string，负责工具调用在该局部场景下的响应。
  getSystemPrompt: () => string
  source: SettingSource
  filename?: string
  baseDir?: string
}

// Plugin agents - similar to custom but with plugin metadata, prompt stored via closure
// PluginAgentDefinition 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginAgentDefinition = BaseAgentDefinition & {
  // 这个回调绑定到 getSystemPrompt: () => string，负责工具调用在该局部场景下的响应。
  getSystemPrompt: () => string
  source: 'plugin'
  filename?: string
  plugin: string
}

// Union type for all agent types
// AgentDefinition 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentDefinition =
  | BuiltInAgentDefinition
  | CustomAgentDefinition
  | PluginAgentDefinition

// Type guards for runtime type checking
// isBuiltInAgent 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBuiltInAgent(
  agent: AgentDefinition,
): agent is BuiltInAgentDefinition {
  // 返回 `agent.source === 'built-in'`，作为工具调用这次计算的结果。
  return agent.source === 'built-in'
}

// isCustomAgent 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCustomAgent(
  agent: AgentDefinition,
): agent is CustomAgentDefinition {
  // 返回 `agent.source !== 'built-in' && agent.source !== 'plugin'`，作为工具调用这次计算的结果。
  return agent.source !== 'built-in' && agent.source !== 'plugin'
}

// isPluginAgent 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginAgent(
  agent: AgentDefinition,
): agent is PluginAgentDefinition {
  // 返回 `agent.source === 'plugin'`，作为工具调用这次计算的结果。
  return agent.source === 'plugin'
}

// AgentDefinitionsResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentDefinitionsResult = {
  activeAgents: AgentDefinition[]
  allAgents: AgentDefinition[]
  failedFiles?: Array<{ path: string; error: string }>
  allowedAgentTypes?: string[]
}

// getActiveAgentsFromList 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getActiveAgentsFromList(
  allAgents: AgentDefinition[],
): AgentDefinition[] {
  // builtInAgents 集合筛选`allAgents.filter`，供工具调用后续处理使用。
  const builtInAgents = allAgents.filter(a => a.source === 'built-in')
  // pluginAgents 插件数据筛选`allAgents.filter`，供工具调用后续处理使用。
  const pluginAgents = allAgents.filter(a => a.source === 'plugin')
  // userAgents 集合筛选`allAgents.filter`，供工具调用后续处理使用。
  const userAgents = allAgents.filter(a => a.source === 'userSettings')
  // projectAgents 集合筛选`allAgents.filter`，供工具调用后续处理使用。
  const projectAgents = allAgents.filter(a => a.source === 'projectSettings')
  // managedAgents 集合筛选`allAgents.filter`，供工具调用后续处理使用。
  const managedAgents = allAgents.filter(a => a.source === 'policySettings')
  // flagAgents 集合筛选`allAgents.filter`，供工具调用后续处理使用。
  const flagAgents = allAgents.filter(a => a.source === 'flagSettings')

  // agentGroups 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const agentGroups = [
    builtInAgents,
    pluginAgents,
    userAgents,
    projectAgents,
    flagAgents,
    managedAgents,
  ]

  // agentMap 命名 `new Map<string, AgentDefinition>()`，让后续代码直接表达这个值的用途。
  const agentMap = new Map<string, AgentDefinition>()

  // 按顺序遍历 `agentGroups` 中的agents 集合，逐个交给工具调用处理。
  for (const agents of agentGroups) {
    // 按顺序遍历 `agents` 中的agent，逐个交给工具调用处理。
    for (const agent of agents) {
      // agentMap.set 写入新的状态值，使工具调用后续读取保持一致。
      agentMap.set(agent.agentType, agent)
    }
  }

  // 返回 `Array.from(agentMap.values())`，作为工具调用这次计算的结果。
  return Array.from(agentMap.values())
}

/**
 * Checks if an agent's required MCP servers are available.
 * Returns true if no requirements or all requirements are met.
 * @param agent The agent to check
 * @param availableServers List of available MCP server names (e.g., from mcp.clients)
 */
// hasRequiredMcpServers 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasRequiredMcpServers(
  agent: AgentDefinition,
  availableServers: string[],
): boolean {
  // 只有 `!agent.requiredMcpServers || agent.requiredMcpSer` 满足时，工具调用才执行该分支。
  if (!agent.requiredMcpServers || agent.requiredMcpServers.length === 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Each required pattern must match at least one available server (case-insensitive)
  // 返回 `agent.requiredMcpServers.every(pattern =>`，作为工具调用这次计算的结果。
  return agent.requiredMcpServers.every(pattern =>
    // 调用 availableServers.some，触发工具调用此处需要的副作用。
    availableServers.some(server =>
      server.toLowerCase().includes(pattern.toLowerCase()),
    ),
  )
}

/**
 * Filters agents based on MCP server requirements.
 * Only returns agents whose required MCP servers are available.
 * @param agents List of agents to filter
 * @param availableServers List of available MCP server names
 */
// filterAgentsByMcpRequirements 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterAgentsByMcpRequirements(
  agents: AgentDefinition[],
  availableServers: string[],
): AgentDefinition[] {
  // 返回 `agents.filter(agent => hasRequiredMcpServers(agent, availableServers))`，作为工具调用这次计算的结果。
  return agents.filter(agent => hasRequiredMcpServers(agent, availableServers))
}

/**
 * Check for and initialize agent memory from project snapshots.
 * For agents with memory enabled, copies snapshot to local if no local memory exists.
 * For agents with newer snapshots, logs a debug message (user prompt TODO).
 */
// initializeAgentMemorySnapshots 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function initializeAgentMemorySnapshots(
  agents: CustomAgentDefinition[],
): Promise<void> {
  // 等待 `Promise.all(` 完成，再继续Agent 工具 load Agents Dir的异步流程。
  await Promise.all(
    agents.map(async agent => {
      // `agent.memory` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (agent.memory !== 'user') return
      // 结果读取`checkAgentMemorySnapshot`，供工具调用后续处理使用。
      const result = await checkAgentMemorySnapshot(
        agent.agentType,
        agent.memory,
      )
      // 按照 result.action 的取值选择工具调用的具体处理分支。
      switch (result.action) {
        case 'initialize':
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Initializing ${agent.agentType} memory from project snapshot`,
          )
          // 等待 `initializeFromSnapshot(` 完成，再继续Agent 工具 load Agents Dir的异步流程。
          await initializeFromSnapshot(
            agent.agentType,
            agent.memory,
            result.snapshotTimestamp!,
          )
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        case 'prompt-update':
          // pendingSnapshotUpdate更新为 `{`，确保Agent 工具后续读取最新状态。
          agent.pendingSnapshotUpdate = {
            snapshotTimestamp: result.snapshotTimestamp!,
          }
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Newer snapshot available for ${agent.agentType} memory (snapshot: ${result.snapshotTimestamp})`,
          )
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
      }
    }),
  )
}

// getAgentDefinitionsWithOverrides 集合保存`memoize`，供工具调用后续处理使用。
export const getAgentDefinitionsWithOverrides = memoize(
  async (cwd: string): Promise<AgentDefinitionsResult> => {
    // Simple mode: skip custom agents, only return built-ins
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，工具调用执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
      // builtInAgents 集合读取`getBuiltInAgents`，供工具调用后续处理使用。
      const builtInAgents = getBuiltInAgents()
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        activeAgents: builtInAgents,
        allAgents: builtInAgents,
      }
    }

    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // markdownFiles 文件数据读取`loadMarkdownFilesForSubdir`，供工具调用后续处理使用。
      const markdownFiles = await loadMarkdownFilesForSubdir('agents', cwd)

      // failedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const failedFiles: Array<{ path: string; error: string }> = []
      // customAgents 集合 命名 `markdownFiles`，让后续代码直接表达这个值的用途。
      const customAgents = markdownFiles
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(({ filePath, baseDir, frontmatter, content, source }) => {
          // agent解析`parseAgentFromMarkdown`，供工具调用后续处理使用。
          const agent = parseAgentFromMarkdown(
            filePath,
            baseDir,
            frontmatter,
            content,
            source,
          )
          // agent缺失时直接走兜底路径，避免工具调用使用无效输入。
          if (!agent) {
            // Skip non-agent markdown files silently (e.g., reference docs
            // co-located with agent definitions). Only report errors for files
            // that look like agent attempts (have a 'name' field in frontmatter).
            // 满足 `!frontmatter['name']` 时，工具调用执行该分支。
            if (!frontmatter['name']) {
              // 返回 `null`，作为工具调用这次计算的结果。
              return null
            }
            // errorMsg 错误信息读取`getParseError`，供工具调用后续处理使用。
            const errorMsg = getParseError(frontmatter)
            // failedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
            failedFiles.push({ path: filePath, error: errorMsg })
            // 记录工具调用运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to parse agent from ${filePath}: ${errorMsg}`,
            )
            // 记录工具调用运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_agent_parse_error', {
              error:
                errorMsg as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              location:
                source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
            // 返回 `null`，作为工具调用这次计算的结果。
            return null
          }
          // 返回 `agent`，作为工具调用这次计算的结果。
          return agent
        })
        // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
        .filter(agent => agent !== null)

      // Kick off plugin agent loading concurrently with memory snapshot init —
      // loadPluginAgents is memoized and takes no args, so it's independent.
      // Join both so neither becomes a floating promise if the other throws.
      // pluginAgentsPromise 异步任务保存 `loadPluginAgents` 启动的异步任务，稍后再决定等待还是后台完成。
      let pluginAgentsPromise = loadPluginAgents()
      // 只有 `feature('AGENT_MEMORY_SNAPSHOT') && isAutoMemoryEnabled()` 满足时，工具调用才执行该分支。
      if (feature('AGENT_MEMORY_SNAPSHOT') && isAutoMemoryEnabled()) {
        // 并行获取 pluginAgents_，缩短Agent 工具 load Agents Dir等待多个独立异步任务的时间。
        const [pluginAgents_] = await Promise.all([
          pluginAgentsPromise,
          initializeAgentMemorySnapshots(customAgents),
        ])
        // pluginAgentsPromise 异步任务更新为 `Promise.resolve(pluginAgents_)`，确保Agent 工具后续读取最新状态。
        pluginAgentsPromise = Promise.resolve(pluginAgents_)
      }
      // pluginAgents 插件数据 等待 `pluginAgentsPromise`，确保继续执行前已有结果。
      const pluginAgents = await pluginAgentsPromise

      // builtInAgents 集合读取`getBuiltInAgents`，供工具调用后续处理使用。
      const builtInAgents = getBuiltInAgents()

      // allAgentsList 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const allAgentsList: AgentDefinition[] = [
        ...builtInAgents,
        ...pluginAgents,
        ...customAgents,
      ]

      // activeAgents 集合读取`getActiveAgentsFromList`，供工具调用后续处理使用。
      const activeAgents = getActiveAgentsFromList(allAgentsList)

      // Initialize colors for all active agents
      // 按顺序遍历 `activeAgents` 中的agent，逐个交给工具调用处理。
      for (const agent of activeAgents) {
        // 满足 `agent.color` 时，工具调用执行该分支。
        if (agent.color) {
          // setAgentColor 写入新的状态值，使工具调用后续读取保持一致。
          setAgentColor(agent.agentType, agent.color)
        }
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        activeAgents,
        allAgents: allAgentsList,
        failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
      }
    } catch (error) {
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Error loading agent definitions: ${errorMessage}`)
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // Even on error, return the built-in agents
      // builtInAgents 集合读取`getBuiltInAgents`，供工具调用后续处理使用。
      const builtInAgents = getBuiltInAgents()
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        activeAgents: builtInAgents,
        allAgents: builtInAgents,
        failedFiles: [{ path: 'unknown', error: errorMessage }],
      }
    }
  },
)

// clearAgentDefinitionsCache 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAgentDefinitionsCache(): void {
  // 调用 getAgentDefinitionsWithOverrides.cache.clear?.()，完成这一处局部操作。
  getAgentDefinitionsWithOverrides.cache.clear?.()
  // 清理相关缓存，确保工具调用下一次读取时重新加载最新数据。
  clearPluginAgentCache()
}

/**
 * Helper to determine the specific parsing error for an agent file
 */
// getParseError 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getParseError(frontmatter: Record<string, unknown>): string {
  // agentType读取 `frontmatter['name']` 对应条目，后续围绕该成员继续处理。
  const agentType = frontmatter['name']
  // description 命名 `frontmatter['description']`，让后续代码直接表达这个值的用途。
  const description = frontmatter['description']

  // `!agentType || typeof agentType` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (!agentType || typeof agentType !== 'string') {
    // 返回 `'Missing required "name" field in frontmatter'`，作为工具调用这次计算的结果。
    return 'Missing required "name" field in frontmatter'
  }

  // `!description || typeof description` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (!description || typeof description !== 'string') {
    // 返回 `'Missing required "description" field in frontmatter'`，作为工具调用这次计算的结果。
    return 'Missing required "description" field in frontmatter'
  }

  // 返回 `'Unknown parsing error'`，作为工具调用这次计算的结果。
  return 'Unknown parsing error'
}

/**
 * Parse hooks from frontmatter using the HooksSchema
 * @param frontmatter The frontmatter object containing potential hooks
 * @param agentType The agent type for logging purposes
 * @returns Parsed hooks settings or undefined if invalid/missing
 */
// parseHooksFromFrontmatter 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseHooksFromFrontmatter(
  frontmatter: Record<string, unknown>,
  agentType: string,
): HooksSettings | undefined {
  // frontmatter.hooks 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!frontmatter.hooks) {
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }

  // 结果保存`HooksSchema`，供工具调用后续处理使用。
  const result = HooksSchema().safeParse(frontmatter.hooks)
  // result.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!result.success) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Invalid hooks in agent '${agentType}': ${result.error.message}`,
    )
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }
  // 返回 `result.data`，作为工具调用这次计算的结果。
  return result.data
}

/**
 * Parses agent definition from JSON data
 */
// parseAgentFromJson 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAgentFromJson(
  name: string,
  definition: unknown,
  source: SettingSource = 'flagSettings',
): CustomAgentDefinition | null {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`AgentJsonSchema`，供工具调用后续处理使用。
    const parsed = AgentJsonSchema().parse(definition)

    // tools 集合解析`parseAgentToolsFromFrontmatter`，供工具调用后续处理使用。
    let tools = parseAgentToolsFromFrontmatter(parsed.tools)

    // If memory is enabled, inject Write/Edit/Read tools for memory access
    // `isAutoMemoryEnabled() && parsed.memory && t...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (isAutoMemoryEnabled() && parsed.memory && tools !== undefined) {
      // toolSet保存`Set`，供工具调用后续处理使用。
      const toolSet = new Set(tools)
      // 调用 for，触发工具调用此处需要的副作用。
      for (const tool of [
        FILE_WRITE_TOOL_NAME,
        FILE_EDIT_TOOL_NAME,
        FILE_READ_TOOL_NAME,
      ]) {
        // 满足 `!toolSet.has(tool)` 时，工具调用执行该分支。
        if (!toolSet.has(tool)) {
          // tools 集合更新为 `[...tools, tool]`，确保Agent 工具后续读取最新状态。
          tools = [...tools, tool]
        }
      }
    }

    // disallowedTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const disallowedTools =
      parsed.disallowedTools !== undefined
        ? parseAgentToolsFromFrontmatter(parsed.disallowedTools)
        : undefined

    // 系统提示词 命名 `parsed.prompt`，让后续代码直接表达这个值的用途。
    const systemPrompt = parsed.prompt

    // agent 集中保存Agent 工具 load Agents Dir要一起传递的字段。
    const agent: CustomAgentDefinition = {
      agentType: name,
      whenToUse: parsed.description,
      ...(tools !== undefined ? { tools } : {}),
      ...(disallowedTools !== undefined ? { disallowedTools } : {}),
      // 这个回调绑定到 getSystemPrompt: () => {，负责工具调用在该局部场景下的响应。
      getSystemPrompt: () => {
        // 只有 `isAutoMemoryEnabled() && parsed.memory` 满足时，工具调用才执行该分支。
        if (isAutoMemoryEnabled() && parsed.memory) {
          // 返回 `(`，作为工具调用这次计算的结果。
          return (
            systemPrompt + '\n\n' + loadAgentMemoryPrompt(name, parsed.memory)
          )
        }
        // 返回 `systemPrompt`，作为工具调用这次计算的结果。
        return systemPrompt
      },
      source,
      ...(parsed.model ? { model: parsed.model } : {}),
      ...(parsed.effort !== undefined ? { effort: parsed.effort } : {}),
      ...(parsed.permissionMode
        ? { permissionMode: parsed.permissionMode }
        : {}),
      ...(parsed.mcpServers && parsed.mcpServers.length > 0
        ? { mcpServers: parsed.mcpServers }
        : {}),
      ...(parsed.hooks ? { hooks: parsed.hooks } : {}),
      ...(parsed.maxTurns !== undefined ? { maxTurns: parsed.maxTurns } : {}),
      ...(parsed.skills && parsed.skills.length > 0
        ? { skills: parsed.skills }
        : {}),
      ...(parsed.initialPrompt ? { initialPrompt: parsed.initialPrompt } : {}),
      ...(parsed.background ? { background: parsed.background } : {}),
      ...(parsed.memory ? { memory: parsed.memory } : {}),
      ...(parsed.isolation ? { isolation: parsed.isolation } : {}),
    }

    // 返回 `agent`，作为工具调用这次计算的结果。
    return agent
  } catch (error) {
    // errorMessage 消息数据保存`String`，供工具调用后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error parsing agent '${name}' from JSON: ${errorMessage}`)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
}

/**
 * Parses multiple agents from a JSON object
 */
// parseAgentsFromJson 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAgentsFromJson(
  agentsJson: unknown,
  source: SettingSource = 'flagSettings',
): AgentDefinition[] {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`AgentsJsonSchema`，供工具调用后续处理使用。
    const parsed = AgentsJsonSchema().parse(agentsJson)
    // 返回 `Object.entries(parsed)`，作为工具调用这次计算的结果。
    return Object.entries(parsed)
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map(([name, def]) => parseAgentFromJson(name, def, source))
      // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
      .filter((agent): agent is CustomAgentDefinition => agent !== null)
  } catch (error) {
    // errorMessage 消息数据保存`String`，供工具调用后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error parsing agents from JSON: ${errorMessage}`)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return []
  }
}

/**
 * Parses agent definition from markdown file data
 */
// parseAgentFromMarkdown 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAgentFromMarkdown(
  filePath: string,
  baseDir: string,
  frontmatter: Record<string, unknown>,
  content: string,
  source: SettingSource,
): CustomAgentDefinition | null {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // agentType读取 `frontmatter['name']` 对应条目，后续围绕该成员继续处理。
    const agentType = frontmatter['name']
    // whenToUse 命名 `frontmatter['description'] as string`，让后续代码直接表达这个值的用途。
    let whenToUse = frontmatter['description'] as string

    // Validate required fields — silently skip files without any agent
    // frontmatter (they're likely co-located reference documentation)
    // `!agentType || typeof agentType` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (!agentType || typeof agentType !== 'string') {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // `!whenToUse || typeof whenToUse` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (!whenToUse || typeof whenToUse !== 'string') {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Agent file ${filePath} is missing required 'description' in frontmatter`,
      )
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }

    // Unescape newlines in whenToUse that were escaped for YAML parsing
    // whenToUse更新为 `whenToUse.replace(/\\n/g, '\n')`，确保Agent 工具后续读取最新状态。
    whenToUse = whenToUse.replace(/\\n/g, '\n')

    // color读取 `frontmatter['color'] as AgentColorName | undefined` 对应条目，后续围绕该成员继续处理。
    const color = frontmatter['color'] as AgentColorName | undefined
    // modelRaw 命名 `frontmatter['model']`，让后续代码直接表达这个值的用途。
    const modelRaw = frontmatter['model']
    // 模型名称 先占位，稍后的条件分支会根据实际输入补齐它。
    let model: string | undefined
    // 只有 `typeof modelRaw === 'string' && modelRaw.trim().length > 0` 满足时，工具调用才执行该分支。
    if (typeof modelRaw === 'string' && modelRaw.trim().length > 0) {
      // trimmed格式化`modelRaw.trim`，供工具调用后续处理使用。
      const trimmed = modelRaw.trim()
      // 模型名称更新为 `trimmed.toLowerCase() === 'inherit' ? 'inherit' : trimmed`，确保Agent 工具后续读取最新状态。
      model = trimmed.toLowerCase() === 'inherit' ? 'inherit' : trimmed
    }

    // Parse background flag
    // backgroundRaw保存`frontmatter['background']`，供工具调用Agent 工具 load Agents Dir后续判断或输出使用。
    const backgroundRaw = frontmatter['background']

    // 工具调用在这里按实际状态进入对应分支。
    if (
      backgroundRaw !== undefined &&
      backgroundRaw !== 'true' &&
      backgroundRaw !== 'false' &&
      backgroundRaw !== true &&
      backgroundRaw !== false
    ) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Agent file ${filePath} has invalid background value '${backgroundRaw}'. Must be 'true', 'false', or omitted.`,
      )
    }

    // background 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const background =
      backgroundRaw === 'true' || backgroundRaw === true ? true : undefined

    // Parse memory scope
    // VALID_MEMORY_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const VALID_MEMORY_SCOPES: AgentMemoryScope[] = ['user', 'project', 'local']
    // memoryRaw读取 `frontmatter['memory'] as string | undefined` 对应条目，后续围绕该成员继续处理。
    const memoryRaw = frontmatter['memory'] as string | undefined
    // memory 先占位，稍后的条件分支会根据实际输入补齐它。
    let memory: AgentMemoryScope | undefined
    // `memoryRaw` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (memoryRaw !== undefined) {
      // 满足 `VALID_MEMORY_SCOPES.includes(memoryRaw as AgentMemoryScope)` 时，工具调用执行该分支。
      if (VALID_MEMORY_SCOPES.includes(memoryRaw as AgentMemoryScope)) {
        // memory更新为 `memoryRaw as AgentMemoryScope`，确保Agent 工具后续读取最新状态。
        memory = memoryRaw as AgentMemoryScope
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Agent file ${filePath} has invalid memory value '${memoryRaw}'. Valid options: ${VALID_MEMORY_SCOPES.join(', ')}`,
        )
      }
    }

    // Parse isolation mode. 'remote' is ant-only; external builds reject it at parse time.
    // IsolationMode 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
    type IsolationMode = 'worktree' | 'remote'
    // VALID_ISOLATION_MODES 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const VALID_ISOLATION_MODES: readonly IsolationMode[] =
      process.env.USER_TYPE === 'ant' ? ['worktree', 'remote'] : ['worktree']
    // isolationRaw读取 `frontmatter['isolation'] as string | undefined` 对应条目，后续围绕该成员继续处理。
    const isolationRaw = frontmatter['isolation'] as string | undefined
    // isolation 先占位，稍后的条件分支会根据实际输入补齐它。
    let isolation: IsolationMode | undefined
    // `isolationRaw` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (isolationRaw !== undefined) {
      // 满足 `VALID_ISOLATION_MODES.includes(isolationRaw as IsolationMode)` 时，工具调用执行该分支。
      if (VALID_ISOLATION_MODES.includes(isolationRaw as IsolationMode)) {
        // isolation更新为 `isolationRaw as IsolationMode`，确保Agent 工具后续读取最新状态。
        isolation = isolationRaw as IsolationMode
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Agent file ${filePath} has invalid isolation value '${isolationRaw}'. Valid options: ${VALID_ISOLATION_MODES.join(', ')}`,
        )
      }
    }

    // Parse effort from frontmatter (supports string levels and integers)
    // effortRaw读取 `frontmatter['effort']` 对应条目，后续围绕该成员继续处理。
    const effortRaw = frontmatter['effort']
    // parsedEffort 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const parsedEffort =
      effortRaw !== undefined ? parseEffortValue(effortRaw) : undefined

    // `effortRaw` 与 `undefined && parsedEffort === u...` 不一致时刷新派生状态，避免使用过期结果。
    if (effortRaw !== undefined && parsedEffort === undefined) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Agent file ${filePath} has invalid effort '${effortRaw}'. Valid options: ${EFFORT_LEVELS.join(', ')} or an integer`,
      )
    }

    // Parse permissionMode from frontmatter
    // permissionModeRaw 权限数据 命名 `frontmatter['permissionMode'] as`，让后续代码直接表达这个值的用途。
    const permissionModeRaw = frontmatter['permissionMode'] as
      | string
      | undefined
    // isValidPermissionMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isValidPermissionMode =
      permissionModeRaw &&
      (PERMISSION_MODES as readonly string[]).includes(permissionModeRaw)

    // 只有 `permissionModeRaw && !isValidPermissionMode` 满足时，工具调用才执行该分支。
    if (permissionModeRaw && !isValidPermissionMode) {
      // errorMsg 错误信息格式化`PERMISSION_MODES.join`，供工具调用后续处理使用。
      const errorMsg = `Agent file ${filePath} has invalid permissionMode '${permissionModeRaw}'. Valid options: ${PERMISSION_MODES.join(', ')}`
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(errorMsg)
    }

    // Parse maxTurns from frontmatter
    // maxTurnsRaw读取 `frontmatter['maxTurns']` 对应条目，后续围绕该成员继续处理。
    const maxTurnsRaw = frontmatter['maxTurns']
    // maxTurns 集合解析`parsePositiveIntFromFrontmatter`，供工具调用后续处理使用。
    const maxTurns = parsePositiveIntFromFrontmatter(maxTurnsRaw)
    // `maxTurnsRaw` 与 `undefined && maxTurns === undef...` 不一致时刷新派生状态，避免使用过期结果。
    if (maxTurnsRaw !== undefined && maxTurns === undefined) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Agent file ${filePath} has invalid maxTurns '${maxTurnsRaw}'. Must be a positive integer.`,
      )
    }

    // Extract filename without extension
    // 文件名保存`basename`，供工具调用后续处理使用。
    const filename = basename(filePath, '.md')

    // Parse tools from frontmatter
    // tools 集合解析`parseAgentToolsFromFrontmatter`，供工具调用后续处理使用。
    let tools = parseAgentToolsFromFrontmatter(frontmatter['tools'])

    // If memory is enabled, inject Write/Edit/Read tools for memory access
    // `isAutoMemoryEnabled() && memory && tools` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (isAutoMemoryEnabled() && memory && tools !== undefined) {
      // toolSet保存`Set`，供工具调用后续处理使用。
      const toolSet = new Set(tools)
      // 调用 for，触发工具调用此处需要的副作用。
      for (const tool of [
        FILE_WRITE_TOOL_NAME,
        FILE_EDIT_TOOL_NAME,
        FILE_READ_TOOL_NAME,
      ]) {
        // 满足 `!toolSet.has(tool)` 时，工具调用执行该分支。
        if (!toolSet.has(tool)) {
          // tools 集合更新为 `[...tools, tool]`，确保Agent 工具后续读取最新状态。
          tools = [...tools, tool]
        }
      }
    }

    // Parse disallowedTools from frontmatter
    // disallowedToolsRaw 命名 `frontmatter['disallowedTools']`，让后续代码直接表达这个值的用途。
    const disallowedToolsRaw = frontmatter['disallowedTools']
    // disallowedTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const disallowedTools =
      disallowedToolsRaw !== undefined
        ? parseAgentToolsFromFrontmatter(disallowedToolsRaw)
        : undefined

    // Parse skills from frontmatter
    // skills 集合解析`parseSlashCommandToolsFromFrontmatter`，供工具调用后续处理使用。
    const skills = parseSlashCommandToolsFromFrontmatter(frontmatter['skills'])

    // initialPromptRaw 命名 `frontmatter['initialPrompt']`，让后续代码直接表达这个值的用途。
    const initialPromptRaw = frontmatter['initialPrompt']
    // initialPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const initialPrompt =
      typeof initialPromptRaw === 'string' && initialPromptRaw.trim()
        ? initialPromptRaw
        : undefined

    // Parse mcpServers from frontmatter using same Zod validation as JSON agents
    // mcpServersRaw保存`frontmatter['mcpServers']`，供工具调用Agent 工具 load Agents Dir后续判断或输出使用。
    const mcpServersRaw = frontmatter['mcpServers']
    // mcpServers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let mcpServers: AgentMcpServerSpec[] | undefined
    // 满足 `Array.isArray(mcpServersRaw)` 时，工具调用执行该分支。
    if (Array.isArray(mcpServersRaw)) {
      // mcpServers 集合更新为 `mcpServersRaw`，确保Agent 工具后续读取最新状态。
      mcpServers = mcpServersRaw
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(item => {
          // 结果保存`AgentMcpServerSpecSchema`，供工具调用后续处理使用。
          const result = AgentMcpServerSpecSchema().safeParse(item)
          // 满足 `result.success` 时，工具调用执行该分支。
          if (result.success) {
            // 返回 `result.data`，作为工具调用这次计算的结果。
            return result.data
          }
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Agent file ${filePath} has invalid mcpServers item: ${jsonStringify(item)}. Error: ${result.error.message}`,
          )
          // 返回 `null`，作为工具调用这次计算的结果。
          return null
        })
        // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
        .filter((item): item is AgentMcpServerSpec => item !== null)
    }

    // Parse hooks from frontmatter
    // hooks 集合解析`parseHooksFromFrontmatter`，供工具调用后续处理使用。
    const hooks = parseHooksFromFrontmatter(frontmatter, agentType)

    // 系统提示词格式化`content.trim`，供工具调用后续处理使用。
    const systemPrompt = content.trim()
    // agentDef 集中保存Agent 工具 load Agents Dir要一起传递的字段。
    const agentDef: CustomAgentDefinition = {
      baseDir,
      agentType: agentType,
      whenToUse: whenToUse,
      ...(tools !== undefined ? { tools } : {}),
      ...(disallowedTools !== undefined ? { disallowedTools } : {}),
      ...(skills !== undefined ? { skills } : {}),
      ...(initialPrompt !== undefined ? { initialPrompt } : {}),
      ...(mcpServers !== undefined && mcpServers.length > 0
        ? { mcpServers }
        : {}),
      ...(hooks !== undefined ? { hooks } : {}),
      // 这个回调绑定到 getSystemPrompt: () => {，负责工具调用在该局部场景下的响应。
      getSystemPrompt: () => {
        // 只有 `isAutoMemoryEnabled() && memory` 满足时，工具调用才执行该分支。
        if (isAutoMemoryEnabled() && memory) {
          // memoryPrompt读取`loadAgentMemoryPrompt`，供工具调用后续处理使用。
          const memoryPrompt = loadAgentMemoryPrompt(agentType, memory)
          // 返回 `systemPrompt + '\n\n' + memoryPrompt`，作为工具调用这次计算的结果。
          return systemPrompt + '\n\n' + memoryPrompt
        }
        // 返回 `systemPrompt`，作为工具调用这次计算的结果。
        return systemPrompt
      },
      source,
      filename,
      ...(color && typeof color === 'string' && AGENT_COLORS.includes(color)
        ? { color }
        : {}),
      ...(model !== undefined ? { model } : {}),
      ...(parsedEffort !== undefined ? { effort: parsedEffort } : {}),
      ...(isValidPermissionMode
        ? { permissionMode: permissionModeRaw as PermissionMode }
        : {}),
      ...(maxTurns !== undefined ? { maxTurns } : {}),
      ...(background ? { background } : {}),
      ...(memory ? { memory } : {}),
      ...(isolation ? { isolation } : {}),
    }
    // 返回 `agentDef`，作为工具调用这次计算的结果。
    return agentDef
  } catch (error) {
    // errorMessage 消息数据保存`String`，供工具调用后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error parsing agent from ${filePath}: ${errorMessage}`)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
}
