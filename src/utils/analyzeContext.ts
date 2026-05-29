// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { Anthropic } 来自 @anthropic-ai/sdk，用于校准共享工具的数据契约。
import type { Anthropic } from '@anthropic-ai/sdk'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSystemPrompt,
  SYSTEM_PROMPT_DYNAMIC_BOUNDARY,
} from 'src/constants/prompts.js'
// 接入 microcompactMessages 服务层能力，把外部通信或共享状态交给 src/services/compact/microCompact.js 处理。
import { microcompactMessages } from 'src/services/compact/microCompact.js'
// 引入 getSdkBetas，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSdkBetas } from '../bootstrap/state.js'
// 引入 getCommandName，将 ../commands.js 中已经封装好的能力接到本文件流程里。
import { getCommandName } from '../commands.js'
// 引入 getSystemContext，将 ../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext } from '../context.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  AUTOCOMPACT_BUFFER_TOKENS,
  getEffectiveContextWindowSize,
  isAutoCompactEnabled,
  MANUAL_COMPACT_BUFFER_TOKENS,
} from '../services/compact/autoCompact.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  countMessagesTokensWithAPI,
  countTokensViaHaikuFallback,
  roughTokenCountEstimation,
} from '../services/tokenEstimation.js'
// 引入 estimateSkillFrontmatterTokens，将 ../skills/loadSkillsDir.js 中已经封装好的能力接到本文件流程里。
import { estimateSkillFrontmatterTokens } from '../skills/loadSkillsDir.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findToolByName,
  type Tool,
  type ToolPermissionContext,
  type Tools,
  type ToolUseContext,
  toolMatchesName,
} from '../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AgentDefinition,
  AgentDefinitionsResult,
} from '../tools/AgentTool/loadAgentsDir.js'
// 接入 SKILL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SKILL_TOOL_NAME } from '../tools/SkillTool/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLimitedSkillToolCommands,
  getSkillToolInfo as getSlashCommandInfo,
} from '../tools/SkillTool/prompt.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  NormalizedAssistantMessage,
  NormalizedUserMessage,
  UserMessage,
} from '../types/message.js'
// 引入 toolToAPISchema，将 ./api.js 中已经封装好的能力接到本文件流程里。
import { toolToAPISchema } from './api.js'
// 引入 filterInjectedMemoryFiles、getMemoryFiles，将 ./claudemd.js 中已经封装好的能力接到本文件流程里。
import { filterInjectedMemoryFiles, getMemoryFiles } from './claudemd.js'
// 引入 getContextWindowForModel，将 ./context.js 中已经封装好的能力接到本文件流程里。
import { getContextWindowForModel } from './context.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 errorMessage、toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, toError } from './errors.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 normalizeMessagesForAPI，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { normalizeMessagesForAPI } from './messages.js'
// 引入 getRuntimeMainLoopModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getRuntimeMainLoopModel } from './model/model.js'
// 类型依赖 { SettingSource } 来自 ./settings/constants.js，用于校准共享工具的数据契约。
import type { SettingSource } from './settings/constants.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'
// 引入 buildEffectiveSystemPrompt，将 ./systemPrompt.js 中已经封装好的能力接到本文件流程里。
import { buildEffectiveSystemPrompt } from './systemPrompt.js'
// 类型依赖 { Theme } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { Theme } from './theme.js'
// 引入 getCurrentUsage，将 ./tokens.js 中已经封装好的能力接到本文件流程里。
import { getCurrentUsage } from './tokens.js'

// RESERVED_CATEGORY_NAME 命名 `'Autocompact buffer'`，让后续代码直接表达这个值的用途。
const RESERVED_CATEGORY_NAME = 'Autocompact buffer'
// MANUAL_COMPACT_BUFFER_NAME保存`'Compact buffer'`，作为后续固定文本处理的输入。
const MANUAL_COMPACT_BUFFER_NAME = 'Compact buffer'

/**
 * Fixed token overhead added by the API when tools are present.
 * The API adds a tool prompt preamble (~500 tokens) once per API call when tools are present.
 * When we count tools individually via the token counting API, each call includes this overhead,
 * leading to N × overhead instead of 1 × overhead for N tools.
 * We subtract this overhead from per-tool counts to show accurate tool content sizes.
 */
// TOOL_TOKEN_COUNT_OVERHEAD 数量保存`500`，供后续判断或组装使用。
export const TOOL_TOKEN_COUNT_OVERHEAD = 500

// countTokensWithFallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countTokensWithFallback(
  messages: Anthropic.Beta.Messages.BetaMessageParam[],
  tools: Anthropic.Beta.Messages.BetaToolUnion[],
): Promise<number | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果统计`countMessagesTokensWithAPI`，供共享工具后续处理使用。
    const result = await countMessagesTokensWithAPI(messages, tools)
    // `result` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (result !== null) {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `countTokensWithFallback: API returned null, trying haiku fallback (${tools.length} tools)`,
    )
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`countTokensWithFallback: API failed: ${errorMessage(err)}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fallbackResult统计`countTokensViaHaikuFallback`，供共享工具后续处理使用。
    const fallbackResult = await countTokensViaHaikuFallback(messages, tools)
    // 满足 `fallbackResult === null` 时，共享工具执行该分支。
    if (fallbackResult === null) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `countTokensWithFallback: haiku fallback also returned null (${tools.length} tools)`,
      )
    }
    // 返回 `fallbackResult`，作为共享工具这次计算的结果。
    return fallbackResult
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `countTokensWithFallback: haiku fallback failed: ${errorMessage(err)}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// ContextCategory 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ContextCategory {
  name: string
  tokens: number
  color: keyof Theme
  /** When true, these tokens are deferred and don't count toward context usage */
  isDeferred?: boolean
}

// GridSquare 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface GridSquare {
  color: keyof Theme
  isFilled: boolean
  categoryName: string
  tokens: number
  percentage: number
  squareFullness: number // 0-1 representing how full this individual square is
}

// MemoryFile 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface MemoryFile {
  path: string
  type: string
  tokens: number
}

// McpTool 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface McpTool {
  name: string
  serverName: string
  tokens: number
  isLoaded?: boolean
}

// DeferredBuiltinTool 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface DeferredBuiltinTool {
  name: string
  tokens: number
  isLoaded: boolean
}

// SystemToolDetail 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface SystemToolDetail {
  name: string
  tokens: number
}

// SystemPromptSectionDetail 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface SystemPromptSectionDetail {
  name: string
  tokens: number
}

// Agent 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface Agent {
  agentType: string
  source: SettingSource | 'built-in' | 'plugin'
  tokens: number
}

// SlashCommandInfo 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface SlashCommandInfo {
  readonly totalCommands: number
  readonly includedCommands: number
  readonly tokens: number
}

/** Individual skill detail for context display */
// SkillFrontmatter 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface SkillFrontmatter {
  name: string
  source: SettingSource | 'plugin'
  tokens: number
}

/**
 * Information about skills included in the context window.
 */
// SkillInfo 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface SkillInfo {
  /** Total number of available skills */
  readonly totalSkills: number
  /** Number of skills included within token budget */
  readonly includedSkills: number
  /** Total tokens consumed by skills */
  readonly tokens: number
  /** Individual skill details */
  readonly skillFrontmatter: SkillFrontmatter[]
}

// ContextData 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ContextData {
  readonly categories: ContextCategory[]
  readonly totalTokens: number
  readonly maxTokens: number
  readonly rawMaxTokens: number
  readonly percentage: number
  readonly gridRows: GridSquare[][]
  readonly model: string
  readonly memoryFiles: MemoryFile[]
  readonly mcpTools: McpTool[]
  /** Ant-only: per-tool breakdown of deferred built-in tools */
  readonly deferredBuiltinTools?: DeferredBuiltinTool[]
  /** Ant-only: per-tool breakdown of always-loaded built-in tools */
  readonly systemTools?: SystemToolDetail[]
  /** Ant-only: per-section breakdown of system prompt */
  readonly systemPromptSections?: SystemPromptSectionDetail[]
  readonly agents: Agent[]
  readonly slashCommands?: SlashCommandInfo
  /** Skill statistics */
  readonly skills?: SkillInfo
  readonly autoCompactThreshold?: number
  readonly isAutoCompactEnabled: boolean
  messageBreakdown?: {
    toolCallTokens: number
    toolResultTokens: number
    attachmentTokens: number
    assistantMessageTokens: number
    userMessageTokens: number
    toolCallsByType: Array<{
      name: string
      callTokens: number
      resultTokens: number
    }>
    attachmentsByType: Array<{ name: string; tokens: number }>
  }
  /** Actual token usage from last API response (if available) */
  readonly apiUsage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
  } | null
}

// countToolDefinitionTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countToolDefinitionTokens(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
  model?: string,
): Promise<number> {
  // toolSchemas 集合保存`Promise.all`，供共享工具后续处理使用。
  const toolSchemas = await Promise.all(
    // 调用 tools.map，触发共享工具此处需要的副作用。
    tools.map(tool =>
      toolToAPISchema(tool, {
        getToolPermissionContext,
        tools,
        agents: agentInfo?.activeAgents ?? [],
        model,
      }),
    ),
  )
  // 结果统计`countTokensWithFallback`，供共享工具后续处理使用。
  const result = await countTokensWithFallback([], toolSchemas)
  // 只有 `result === null || result === 0` 满足时，共享工具才执行该分支。
  if (result === null || result === 0) {
    // toolNames 集合派生`tools.map`，供共享工具后续处理使用。
    const toolNames = tools.map(t => t.name).join(', ')
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `countToolDefinitionTokens returned ${result} for ${tools.length} tools: ${toolNames.slice(0, 100)}${toolNames.length > 100 ? '...' : ''}`,
    )
  }
  // 返回 `result ?? 0`，作为共享工具这次计算的结果。
  return result ?? 0
}

/** Extract a human-readable name from a system prompt section's content */
// extractSectionName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractSectionName(content: string): string {
  // Try to find first markdown heading
  // headingMatch匹配`content.match`，供共享工具后续处理使用。
  const headingMatch = content.match(/^#+\s+(.+)$/m)
  // 满足 `headingMatch` 时，共享工具执行该分支。
  if (headingMatch) {
    // 返回 `headingMatch[1]!.trim()`，作为共享工具这次计算的结果。
    return headingMatch[1]!.trim()
  }
  // Fall back to a truncated preview of the first non-empty line
  // firstLine格式化`content.split`，供共享工具后续处理使用。
  const firstLine = content.split('\n').find(l => l.trim().length > 0) ?? ''
  // 返回 `firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine`，作为共享工具这次计算的结果。
  return firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
}

// countSystemTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countSystemTokens(
  effectiveSystemPrompt: readonly string[],
): Promise<{
  systemPromptTokens: number
  systemPromptSections: SystemPromptSectionDetail[]
}> {
  // Get system context (gitStatus, etc.) which is always included
  // systemContext读取`getSystemContext`，供共享工具后续处理使用。
  const systemContext = await getSystemContext()

  // Build named entries: system prompt parts + system context values
  // Skip empty strings and the global-cache boundary marker
  // namedEntries 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const namedEntries: Array<{ name: string; content: string }> = [
    ...effectiveSystemPrompt
      .filter(
        // 文本内容更新为 `>`，确保共享工具后续读取最新状态。
        content =>
          content.length > 0 && content !== SYSTEM_PROMPT_DYNAMIC_BOUNDARY,
      )
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(content => ({ name: extractSectionName(content), content })),
    ...Object.entries(systemContext)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(([, content]) => content.length > 0)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(([name, content]) => ({ name, content })),
  ]

  // 满足 `namedEntries.length < 1` 时，共享工具执行该分支。
  if (namedEntries.length < 1) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { systemPromptTokens: 0, systemPromptSections: [] }
  }

  // systemTokenCounts 数量保存`Promise.all`，供共享工具后续处理使用。
  const systemTokenCounts = await Promise.all(
    // 调用 namedEntries.map，触发共享工具此处需要的副作用。
    namedEntries.map(({ content }) =>
      countTokensWithFallback([{ role: 'user', content }], []),
    ),
  )

  // systemPromptSections 集合派生`namedEntries.map(` 得到集合派生结果，供共享工具 analyze Context后续步骤使用。
  const systemPromptSections: SystemPromptSectionDetail[] = namedEntries.map(
    // 这个回调绑定到 (entry, i) => ({，负责共享工具在该局部场景下的响应。
    (entry, i) => ({
      name: entry.name,
      tokens: systemTokenCounts[i] || 0,
    }),
  )

  // systemPromptTokens 集合派生`systemTokenCounts.reduce`，供共享工具后续处理使用。
  const systemPromptTokens = systemTokenCounts.reduce(
    // 这个回调绑定到 (sum: number, tokens) => sum + (tokens || 0),，负责共享工具在该局部场景下的响应。
    (sum: number, tokens) => sum + (tokens || 0),
    0,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { systemPromptTokens, systemPromptSections }
}

// countMemoryFileTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countMemoryFileTokens(): Promise<{
  memoryFileDetails: MemoryFile[]
  claudeMdTokens: number
}> {
  // Simple mode disables CLAUDE.md loading, so don't report tokens for them
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { memoryFileDetails: [], claudeMdTokens: 0 }
  }

  // memoryFilesData 文件数据筛选`filterInjectedMemoryFiles`，供共享工具后续处理使用。
  const memoryFilesData = filterInjectedMemoryFiles(await getMemoryFiles())
  // memoryFileDetails 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const memoryFileDetails: MemoryFile[] = []
  // claudeMdTokens 集合保存`0`，供后续判断或组装使用。
  let claudeMdTokens = 0

  // 满足 `memoryFilesData.length < 1` 时，共享工具执行该分支。
  if (memoryFilesData.length < 1) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      memoryFileDetails: [],
      claudeMdTokens: 0,
    }
  }

  // claudeMdTokenCounts 数量保存`Promise.all`，供共享工具后续处理使用。
  const claudeMdTokenCounts = await Promise.all(
    // 调用 memoryFilesData.map，触发共享工具此处需要的副作用。
    memoryFilesData.map(async file => {
      // token 列表统计`countTokensWithFallback`，供共享工具后续处理使用。
      const tokens = await countTokensWithFallback(
        [{ role: 'user', content: file.content }],
        [],
      )

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { file, tokens: tokens || 0 }
    }),
  )

  // 循环处理 `const { file, tokens } of claudeMdTokenCounts`，让共享工具逐项把同类条目按顺序走完。
  for (const { file, tokens } of claudeMdTokenCounts) {
    // 共享工具 analyze Context在这里处理 `claudeMdTokens += tokens`，完成这一小步状态转换。
    claudeMdTokens += tokens
    // memoryFileDetails 文件数据追加新条目，保持收集顺序与输入顺序一致。
    memoryFileDetails.push({
      path: file.path,
      type: file.type,
      tokens,
    })
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { claudeMdTokens, memoryFileDetails }
}

// countBuiltInToolTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countBuiltInToolTokens(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
  model?: string,
  messages?: Message[],
): Promise<{
  builtInToolTokens: number
  deferredBuiltinDetails: DeferredBuiltinTool[]
  deferredBuiltinTokens: number
  systemToolDetails: SystemToolDetail[]
}> {
  // builtInTools 集合筛选`tools.filter`，供共享工具后续处理使用。
  const builtInTools = tools.filter(tool => !tool.isMcp)
  // 满足 `builtInTools.length < 1` 时，共享工具执行该分支。
  if (builtInTools.length < 1) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      builtInToolTokens: 0,
      deferredBuiltinDetails: [],
      deferredBuiltinTokens: 0,
      systemToolDetails: [],
    }
  }

  // Check if tool search is enabled
  // 从 `await import('./toolSearch.js')` 解构 isToolSearchEnabled，减少共享工具 analyze Context对同一对象的重复访问。
  const { isToolSearchEnabled } = await import('./toolSearch.js')
  // 从 `await import('../tools/ToolSearchTool/prompt.js')` 解构 isDeferredTool，减少共享工具 analyze Context对同一对象的重复访问。
  const { isDeferredTool } = await import('../tools/ToolSearchTool/prompt.js')
  // isDeferred记录 `isToolSearchEnabled` 是否成立，共享工具随后按该结果分支。
  const isDeferred = await isToolSearchEnabled(
    model ?? '',
    tools,
    getToolPermissionContext,
    agentInfo?.activeAgents ?? [],
    'analyzeBuiltIn',
  )

  // Separate always-loaded and deferred builtin tools using dynamic isDeferredTool check
  // alwaysLoadedTools 集合筛选`builtInTools.filter`，供共享工具后续处理使用。
  const alwaysLoadedTools = builtInTools.filter(t => !isDeferredTool(t))
  // deferredBuiltinTools 集合筛选`builtInTools.filter`，供共享工具后续处理使用。
  const deferredBuiltinTools = builtInTools.filter(t => isDeferredTool(t))

  // Count always-loaded tools
  // alwaysLoadedTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const alwaysLoadedTokens =
    alwaysLoadedTools.length > 0
      ? await countToolDefinitionTokens(
          alwaysLoadedTools,
          getToolPermissionContext,
          agentInfo,
          model,
        )
      : 0

  // Build per-tool breakdown for always-loaded tools (ant-only, proportional
  // split of the bulk count based on rough schema size estimation). Excludes
  // SkillTool since its tokens are shown in the separate Skills category.
  // systemToolDetails 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let systemToolDetails: SystemToolDetail[] = []
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // toolsForBreakdown筛选`alwaysLoadedTools.filter`，供共享工具后续处理使用。
    const toolsForBreakdown = alwaysLoadedTools.filter(
      // t更新为 `> !toolMatchesName(t, SKILL_TOOL_NAME)`，确保共享工具后续读取最新状态。
      t => !toolMatchesName(t, SKILL_TOOL_NAME),
    )
    // 满足 `toolsForBreakdown.length > 0` 时，共享工具执行该分支。
    if (toolsForBreakdown.length > 0) {
      // estimates 集合派生`toolsForBreakdown.map`，供共享工具后续处理使用。
      const estimates = toolsForBreakdown.map(t =>
        roughTokenCountEstimation(jsonStringify(t.inputSchema ?? {})),
      )
      // estimateTotal派生`estimates.reduce`，供共享工具后续处理使用。
      const estimateTotal = estimates.reduce((s, e) => s + e, 0) || 1
      // distributable保存`Math.max`，供共享工具后续处理使用。
      const distributable = Math.max(
        0,
        alwaysLoadedTokens - TOOL_TOKEN_COUNT_OVERHEAD,
      )
      // systemToolDetails 集合更新为 `toolsForBreakdown`，确保共享工具后续读取最新状态。
      systemToolDetails = toolsForBreakdown
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map((t, i) => ({
          name: t.name,
          tokens: Math.round((estimates[i]! / estimateTotal) * distributable),
        }))
        // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
        .sort((a, b) => b.tokens - a.tokens)
    }
  }

  // Count deferred builtin tools individually for details
  // deferredBuiltinDetails 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const deferredBuiltinDetails: DeferredBuiltinTool[] = []
  // loadedDeferredTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let loadedDeferredTokens = 0
  // totalDeferredTokens 集合保存`0`，供共享工具 analyze Context后续判断或输出使用。
  let totalDeferredTokens = 0

  // 只有 `deferredBuiltinTools.length > 0 && isDeferred` 满足时，共享工具才执行该分支。
  if (deferredBuiltinTools.length > 0 && isDeferred) {
    // Find which deferred tools have been used in messages
    // loadedToolNames 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const loadedToolNames = new Set<string>()
    // 满足 `messages` 时，共享工具执行该分支。
    if (messages) {
      // deferredToolNameSet保存`Set`，供共享工具后续处理使用。
      const deferredToolNameSet = new Set(deferredBuiltinTools.map(t => t.name))
      // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
      for (const msg of messages) {
        // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
        if (msg.type === 'assistant') {
          // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
          for (const block of msg.message.content) {
            // 共享工具在这里按实际状态进入对应分支。
            if (
              'type' in block &&
              block.type === 'tool_use' &&
              'name' in block &&
              typeof block.name === 'string' &&
              deferredToolNameSet.has(block.name)
            ) {
              // 调用 loadedToolNames.add，触发共享工具此处需要的副作用。
              loadedToolNames.add(block.name)
            }
          }
        }
      }
    }

    // Count each deferred tool
    // tokensByTool保存`Promise.all`，供共享工具后续处理使用。
    const tokensByTool = await Promise.all(
      // 调用 deferredBuiltinTools.map，触发共享工具此处需要的副作用。
      deferredBuiltinTools.map(t =>
        countToolDefinitionTokens(
          [t],
          getToolPermissionContext,
          agentInfo,
          model,
        ),
      ),
    )

    // 循环处理 `const [i, tool] of deferredBuiltinTools.entries()`，让共享工具把同类条目按顺序走完。
    for (const [i, tool] of deferredBuiltinTools.entries()) {
      // token 列表保存`Math.max`，供共享工具后续处理使用。
      const tokens = Math.max(
        0,
        (tokensByTool[i] || 0) - TOOL_TOKEN_COUNT_OVERHEAD,
      )
      // isLoaded记录 `loadedToolNames.has` 是否成立，共享工具随后按该结果分支。
      const isLoaded = loadedToolNames.has(tool.name)
      // deferredBuiltinDetails 集合追加新条目，保持收集顺序与输入顺序一致。
      deferredBuiltinDetails.push({
        name: tool.name,
        tokens,
        isLoaded,
      })
      // 共享工具 analyze Context在这里处理 `totalDeferredTokens += tokens`，完成这一小步状态转换。
      totalDeferredTokens += tokens
      // 满足 `isLoaded` 时，共享工具执行该分支。
      if (isLoaded) {
        // 共享工具 analyze Context在这里处理 `loadedDeferredTokens += tokens`，完成这一小步状态转换。
        loadedDeferredTokens += tokens
      }
    }
  // 共享工具 analyze Context在这里处理 `} else if (deferredBuiltinTools.length > 0) {`，完成这一小步状态转换。
  } else if (deferredBuiltinTools.length > 0) {
    // Tool search not enabled - count deferred tools as regular
    // deferredTokens 集合统计`countToolDefinitionTokens`，供共享工具后续处理使用。
    const deferredTokens = await countToolDefinitionTokens(
      deferredBuiltinTools,
      getToolPermissionContext,
      agentInfo,
      model,
    )
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      builtInToolTokens: alwaysLoadedTokens + deferredTokens,
      deferredBuiltinDetails: [],
      deferredBuiltinTokens: 0,
      systemToolDetails,
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // When deferred, only count always-loaded tools + any loaded deferred tools
    builtInToolTokens: alwaysLoadedTokens + loadedDeferredTokens,
    deferredBuiltinDetails,
    deferredBuiltinTokens: totalDeferredTokens - loadedDeferredTokens,
    systemToolDetails,
  }
}

// findSkillTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findSkillTool(tools: Tools): Tool | undefined {
  // 返回 `findToolByName(tools, SKILL_TOOL_NAME)`，作为共享工具这次计算的结果。
  return findToolByName(tools, SKILL_TOOL_NAME)
}

// countSlashCommandTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countSlashCommandTokens(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
): Promise<{
  slashCommandTokens: number
  commandInfo: { totalCommands: number; includedCommands: number }
}> {
  // info读取`getSlashCommandInfo`，供共享工具后续处理使用。
  const info = await getSlashCommandInfo(getCwd())

  // slashCommandTool 命令数据筛选`findSkillTool`，供共享工具后续处理使用。
  const slashCommandTool = findSkillTool(tools)
  // slashCommandTool 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!slashCommandTool) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      slashCommandTokens: 0,
      commandInfo: { totalCommands: 0, includedCommands: 0 },
    }
  }

  // slashCommandTokens 命令数据统计`countToolDefinitionTokens`，供共享工具后续处理使用。
  const slashCommandTokens = await countToolDefinitionTokens(
    [slashCommandTool],
    getToolPermissionContext,
    agentInfo,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    slashCommandTokens,
    commandInfo: {
      totalCommands: info.totalCommands,
      includedCommands: info.includedCommands,
    },
  }
}

// countSkillTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countSkillTokens(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
): Promise<{
  skillTokens: number
  skillInfo: {
    totalSkills: number
    includedSkills: number
    skillFrontmatter: SkillFrontmatter[]
  }
}> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // skills 集合读取`getLimitedSkillToolCommands`，供共享工具后续处理使用。
    const skills = await getLimitedSkillToolCommands(getCwd())

    // slashCommandTool 命令数据筛选`findSkillTool`，供共享工具后续处理使用。
    const slashCommandTool = findSkillTool(tools)
    // slashCommandTool 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!slashCommandTool) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        skillTokens: 0,
        skillInfo: { totalSkills: 0, includedSkills: 0, skillFrontmatter: [] },
      }
    }

    // NOTE: This counts the entire SlashCommandTool (which includes both commands AND skills).
    // This is the same tool counted by countSlashCommandTokens(), but we track it separately
    // here for display purposes. These tokens should NOT be added to context categories
    // to avoid double-counting.
    // skillTokens 集合统计`countToolDefinitionTokens`，供共享工具后续处理使用。
    const skillTokens = await countToolDefinitionTokens(
      [slashCommandTool],
      getToolPermissionContext,
      agentInfo,
    )

    // Calculate per-skill token estimates based on frontmatter only
    // (name, description, whenToUse) since full content is only loaded on invocation
    // 这个回调绑定到 const skillFrontmatter: SkillFrontmatter[] = skills.map(skill => ({，负责共享工具在该局部场景下的响应。
    const skillFrontmatter: SkillFrontmatter[] = skills.map(skill => ({
      name: getCommandName(skill),
      source: (skill.type === 'prompt' ? skill.source : 'plugin') as
        | SettingSource
        | 'plugin',
      tokens: estimateSkillFrontmatterTokens(skill),
    }))

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      skillTokens,
      skillInfo: {
        totalSkills: skills.length,
        includedSkills: skills.length,
        skillFrontmatter,
      },
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))

    // Return zero values rather than failing the entire context analysis
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      skillTokens: 0,
      skillInfo: { totalSkills: 0, includedSkills: 0, skillFrontmatter: [] },
    }
  }
}

// countMcpToolTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countMcpToolTokens(
  tools: Tools,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
  model: string,
  messages?: Message[],
): Promise<{
  mcpToolTokens: number
  mcpToolDetails: McpTool[]
  deferredToolTokens: number
  loadedMcpToolNames: Set<string>
}> {
  // mcpTools 集合筛选`tools.filter`，供共享工具后续处理使用。
  const mcpTools = tools.filter(tool => tool.isMcp)
  // mcpToolDetails 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const mcpToolDetails: McpTool[] = []
  // Single bulk API call for all MCP tools (instead of N individual calls)
  // totalTokensRaw统计`countToolDefinitionTokens`，供共享工具后续处理使用。
  const totalTokensRaw = await countToolDefinitionTokens(
    mcpTools,
    getToolPermissionContext,
    agentInfo,
    model,
  )
  // Subtract the single overhead since we made one bulk call
  // totalTokens 集合保存`Math.max`，供共享工具后续处理使用。
  const totalTokens = Math.max(
    0,
    (totalTokensRaw || 0) - TOOL_TOKEN_COUNT_OVERHEAD,
  )

  // Estimate per-tool proportions for display using local estimation.
  // Include name + description + input schema to match what toolToAPISchema
  // sends — otherwise tools with similar schemas but different descriptions
  // get identical counts (MCP tools share the same base Zod inputSchema).
  // estimates 集合保存`Promise.all`，供共享工具后续处理使用。
  const estimates = await Promise.all(
    // 调用 mcpTools.map，触发共享工具此处需要的副作用。
    mcpTools.map(async t =>
      roughTokenCountEstimation(
        jsonStringify({
          name: t.name,
          description: await t.prompt({
            getToolPermissionContext,
            tools,
            agents: agentInfo?.activeAgents ?? [],
          }),
          input_schema: t.inputJSONSchema ?? {},
        }),
      ),
    ),
  )
  // estimateTotal派生`estimates.reduce`，供共享工具后续处理使用。
  const estimateTotal = estimates.reduce((s, e) => s + e, 0) || 1
  // mcpToolTokensByTool派生`estimates.map`，供共享工具后续处理使用。
  const mcpToolTokensByTool = estimates.map(e =>
    Math.round((e / estimateTotal) * totalTokens),
  )

  // Check if tool search is enabled - if so, MCP tools are deferred
  // isToolSearchEnabled handles threshold calculation internally for TstAuto mode
  // 从 `await import('./toolSearch.js')` 解构 isToolSearchEnabled，减少共享工具 analyze Context对同一对象的重复访问。
  const { isToolSearchEnabled } = await import('./toolSearch.js')
  // 从 `await import('../tools/ToolSearchTool/prompt.js')` 解构 isDeferredTool，减少共享工具 analyze Context对同一对象的重复访问。
  const { isDeferredTool } = await import('../tools/ToolSearchTool/prompt.js')

  // isDeferred记录 `isToolSearchEnabled` 是否成立，共享工具随后按该结果分支。
  const isDeferred = await isToolSearchEnabled(
    model,
    tools,
    getToolPermissionContext,
    agentInfo?.activeAgents ?? [],
    'analyzeMcp',
  )

  // Find MCP tools that have been used in messages (loaded via ToolSearchTool)
  // loadedMcpToolNames 集合构建`new Set<string>()`，供后续判断或组装使用。
  const loadedMcpToolNames = new Set<string>()
  // 只有 `isDeferred && messages` 满足时，共享工具才执行该分支。
  if (isDeferred && messages) {
    // mcpToolNameSet保存`Set`，供共享工具后续处理使用。
    const mcpToolNameSet = new Set(mcpTools.map(t => t.name))
    // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
    for (const msg of messages) {
      // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
      if (msg.type === 'assistant') {
        // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
        for (const block of msg.message.content) {
          // 共享工具在这里按实际状态进入对应分支。
          if (
            'type' in block &&
            block.type === 'tool_use' &&
            'name' in block &&
            typeof block.name === 'string' &&
            mcpToolNameSet.has(block.name)
          ) {
            // 调用 loadedMcpToolNames.add，触发共享工具此处需要的副作用。
            loadedMcpToolNames.add(block.name)
          }
        }
      }
    }
  }

  // Build tool details with isLoaded flag
  // 循环处理 `const [i, tool] of mcpTools.entries()`，让共享工具把同类条目按顺序走完。
  for (const [i, tool] of mcpTools.entries()) {
    // mcpToolDetails 集合追加新条目，保持收集顺序与输入顺序一致。
    mcpToolDetails.push({
      name: tool.name,
      serverName: tool.name.split('__')[1] || 'unknown',
      tokens: mcpToolTokensByTool[i]!,
      isLoaded: loadedMcpToolNames.has(tool.name) || !isDeferredTool(tool),
    })
  }

  // Calculate loaded vs deferred tokens
  // loadedTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let loadedTokens = 0
  // deferredTokens 集合保存`0`，供共享工具 analyze Context后续判断或输出使用。
  let deferredTokens = 0
  // 按顺序遍历 `mcpToolDetails` 中的detail，逐个交给共享工具处理。
  for (const detail of mcpToolDetails) {
    // 满足 `detail.isLoaded` 时，共享工具执行该分支。
    if (detail.isLoaded) {
      // 共享工具 analyze Context在这里处理 `loadedTokens += detail.tokens`，完成这一小步状态转换。
      loadedTokens += detail.tokens
    // 共享工具 analyze Context在这里处理 `} else if (isDeferred) {`，完成这一小步状态转换。
    } else if (isDeferred) {
      // 共享工具 analyze Context在这里处理 `deferredTokens += detail.tokens`，完成这一小步状态转换。
      deferredTokens += detail.tokens
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // When deferred but some tools are loaded, count loaded tokens
    mcpToolTokens: isDeferred ? loadedTokens : totalTokens,
    mcpToolDetails,
    // Track deferred tokens separately for display
    deferredToolTokens: deferredTokens,
    loadedMcpToolNames,
  }
}

// countCustomAgentTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countCustomAgentTokens(agentDefinitions: {
  activeAgents: AgentDefinition[]
}): Promise<{
  agentTokens: number
  agentDetails: Agent[]
}> {
  // customAgents 集合筛选`activeAgents.filter`，供共享工具后续处理使用。
  const customAgents = agentDefinitions.activeAgents.filter(
    // a更新为 `> a.source !== 'built-in'`，确保共享工具后续读取最新状态。
    a => a.source !== 'built-in',
  )
  // agentDetails 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentDetails: Agent[] = []
  // agentTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let agentTokens = 0

  // tokenCounts 数量保存`Promise.all`，供共享工具后续处理使用。
  const tokenCounts = await Promise.all(
    // 调用 customAgents.map，触发共享工具此处需要的副作用。
    customAgents.map(agent =>
      countTokensWithFallback(
        [
          {
            role: 'user',
            content: [agent.agentType, agent.whenToUse].join(' '),
          },
        ],
        [],
      ),
    ),
  )

  // 循环处理 `const [i, agent] of customAgents.entries()`，让共享工具把同类条目按顺序走完。
  for (const [i, agent] of customAgents.entries()) {
    // token 列表标记共享工具 analyze Context是否启用对应路径。
    const tokens = tokenCounts[i] || 0
    // 共享工具 analyze Context在这里处理 `agentTokens += tokens || 0`，完成这一小步状态转换。
    agentTokens += tokens || 0
    // agentDetails 集合追加新条目，保持收集顺序与输入顺序一致。
    agentDetails.push({
      agentType: agent.agentType,
      source: agent.source,
      tokens: tokens || 0,
    })
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { agentTokens, agentDetails }
}

// MessageBreakdown 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MessageBreakdown = {
  totalTokens: number
  toolCallTokens: number
  toolResultTokens: number
  attachmentTokens: number
  assistantMessageTokens: number
  userMessageTokens: number
  toolCallsByType: Map<string, number>
  toolResultsByType: Map<string, number>
  attachmentsByType: Map<string, number>
}

// processAssistantMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processAssistantMessage(
  msg: AssistantMessage | NormalizedAssistantMessage,
  breakdown: MessageBreakdown,
): void {
  // Process each content block individually
  // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
  for (const block of msg.message.content) {
    // blockStr保存`jsonStringify`，供共享工具后续处理使用。
    const blockStr = jsonStringify(block)
    // blockTokens 集合保存`roughTokenCountEstimation`，供共享工具后续处理使用。
    const blockTokens = roughTokenCountEstimation(blockStr)

    // 当 `'type' in block && block.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
    if ('type' in block && block.type === 'tool_use') {
      // 共享工具 analyze Context在这里处理 `breakdown.toolCallTokens += blockTokens`，完成这一小步状态转换。
      breakdown.toolCallTokens += blockTokens
      // toolName标记共享工具 analyze Context是否启用对应路径。
      const toolName = ('name' in block ? block.name : undefined) || 'unknown'
      // breakdown.toolCallsByType.set 写入新的状态值，使共享工具后续读取保持一致。
      breakdown.toolCallsByType.set(
        toolName,
        (breakdown.toolCallsByType.get(toolName) || 0) + blockTokens,
      )
    } else {
      // Text blocks or other non-tool content
      // 共享工具 analyze Context在这里处理 `breakdown.assistantMessageTokens += blockTokens`，完成这一小步状态转换。
      breakdown.assistantMessageTokens += blockTokens
    }
  }
}

// processUserMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processUserMessage(
  msg: UserMessage | NormalizedUserMessage,
  breakdown: MessageBreakdown,
  toolUseIdToName: Map<string, string>,
): void {
  // Handle both string and array content
  // 当 `typeof msg.message.content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof msg.message.content === 'string') {
    // Simple string content
    // token 列表保存`roughTokenCountEstimation`，供共享工具后续处理使用。
    const tokens = roughTokenCountEstimation(msg.message.content)
    // 共享工具 analyze Context在这里处理 `breakdown.userMessageTokens += tokens`，完成这一小步状态转换。
    breakdown.userMessageTokens += tokens
    // 共享工具 analyze Context在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Process each content block individually
  // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
  for (const block of msg.message.content) {
    // blockStr保存`jsonStringify`，供共享工具后续处理使用。
    const blockStr = jsonStringify(block)
    // blockTokens 集合保存`roughTokenCountEstimation`，供共享工具后续处理使用。
    const blockTokens = roughTokenCountEstimation(blockStr)

    // 当 `'type' in block && block.type` 匹配 `'tool_result'` 时，共享工具执行对应分支。
    if ('type' in block && block.type === 'tool_result') {
      // 共享工具 analyze Context在这里处理 `breakdown.toolResultTokens += blockTokens`，完成这一小步状态转换。
      breakdown.toolResultTokens += blockTokens
      // toolUseId固定为 `'tool_use_id' in block ? block.tool_use_id : undefined`，作为共享工具 analyze Context后续展示或比较的基准。
      const toolUseId = 'tool_use_id' in block ? block.tool_use_id : undefined
      // toolName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const toolName =
        (toolUseId ? toolUseIdToName.get(toolUseId) : undefined) || 'unknown'
      // breakdown.toolResultsByType.set 写入新的状态值，使共享工具后续读取保持一致。
      breakdown.toolResultsByType.set(
        toolName,
        (breakdown.toolResultsByType.get(toolName) || 0) + blockTokens,
      )
    } else {
      // Text blocks or other non-tool content
      // 共享工具 analyze Context在这里处理 `breakdown.userMessageTokens += blockTokens`，完成这一小步状态转换。
      breakdown.userMessageTokens += blockTokens
    }
  }
}

// processAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processAttachment(
  msg: AttachmentMessage,
  breakdown: MessageBreakdown,
): void {
  // contentStr保存`jsonStringify`，供共享工具后续处理使用。
  const contentStr = jsonStringify(msg.attachment)
  // token 列表保存`roughTokenCountEstimation`，供共享工具后续处理使用。
  const tokens = roughTokenCountEstimation(contentStr)
  // 共享工具 analyze Context在这里处理 `breakdown.attachmentTokens += tokens`，完成这一小步状态转换。
  breakdown.attachmentTokens += tokens
  // attachType标记共享工具 analyze Context是否启用对应路径。
  const attachType = msg.attachment.type || 'unknown'
  // breakdown.attachmentsByType.set 写入新的状态值，使共享工具后续读取保持一致。
  breakdown.attachmentsByType.set(
    attachType,
    (breakdown.attachmentsByType.get(attachType) || 0) + tokens,
  )
}

// approximateMessageTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function approximateMessageTokens(
  messages: Message[],
): Promise<MessageBreakdown> {
  // microcompactResult保存`microcompactMessages`，供共享工具后续处理使用。
  const microcompactResult = await microcompactMessages(messages)

  // Initialize tracking
  // breakdown 集中保存共享工具 analyze Context要一起传递的字段。
  const breakdown: MessageBreakdown = {
    totalTokens: 0,
    toolCallTokens: 0,
    toolResultTokens: 0,
    attachmentTokens: 0,
    assistantMessageTokens: 0,
    userMessageTokens: 0,
    toolCallsByType: new Map<string, number>(),
    toolResultsByType: new Map<string, number>(),
    attachmentsByType: new Map<string, number>(),
  }

  // Build a map of tool_use_id to tool_name for easier lookup
  // toolUseIdToName构建`new Map<string, string>()` 整理出中间结果，供共享工具 analyze Context后续步骤使用。
  const toolUseIdToName = new Map<string, string>()
  // 按顺序遍历 `microcompactResult.messages` 中的消息，逐个交给共享工具处理。
  for (const msg of microcompactResult.messages) {
    // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
    if (msg.type === 'assistant') {
      // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
      for (const block of msg.message.content) {
        // 当 `'type' in block && block.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
        if ('type' in block && block.type === 'tool_use') {
          // toolUseId 命名 `'id' in block ? block.id : undefined`，让后续代码直接表达这个值的用途。
          const toolUseId = 'id' in block ? block.id : undefined
          // toolName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const toolName =
            ('name' in block ? block.name : undefined) || 'unknown'
          // 满足 `toolUseId` 时，共享工具执行该分支。
          if (toolUseId) {
            // toolUseIdToName.set 写入新的状态值，使共享工具后续读取保持一致。
            toolUseIdToName.set(toolUseId, toolName)
          }
        }
      }
    }
  }

  // Process each message for detailed breakdown
  // 按顺序遍历 `microcompactResult.messages` 中的消息，逐个交给共享工具处理。
  for (const msg of microcompactResult.messages) {
    // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
    if (msg.type === 'assistant') {
      // 调用 processAssistantMessage，触发共享工具此处需要的副作用。
      processAssistantMessage(msg, breakdown)
    // 共享工具 analyze Context在这里处理 `} else if (msg.type === 'user') {`，完成这一小步状态转换。
    } else if (msg.type === 'user') {
      // 调用 processUserMessage，触发共享工具此处需要的副作用。
      processUserMessage(msg, breakdown, toolUseIdToName)
    // 共享工具 analyze Context在这里处理 `} else if (msg.type === 'attachment') {`，完成这一小步状态转换。
    } else if (msg.type === 'attachment') {
      // 调用 processAttachment，触发共享工具此处需要的副作用。
      processAttachment(msg, breakdown)
    }
  }

  // Calculate total tokens using the API for accuracy
  // approximateMessageTokens 消息数据统计`countTokensWithFallback`，供共享工具后续处理使用。
  const approximateMessageTokens = await countTokensWithFallback(
    // 调用 normalizeMessagesForAPI，触发共享工具此处需要的副作用。
    normalizeMessagesForAPI(microcompactResult.messages).map(_ => {
      // 当 `_.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
      if (_.type === 'assistant') {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          // Important: strip out fields like id, etc. -- the counting API errors if they're present
          role: 'assistant',
          content: _.message.content,
        }
      }
      // 返回 `_.message`，作为共享工具这次计算的结果。
      return _.message
    }),
    [],
  )

  // totalTokens 集合更新为 `approximateMessageTokens ?? 0`，确保共享工具后续读取最新状态。
  breakdown.totalTokens = approximateMessageTokens ?? 0
  // 返回 `breakdown`，作为共享工具这次计算的结果。
  return breakdown
}

// analyzeContextUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function analyzeContextUsage(
  messages: Message[],
  model: string,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  tools: Tools,
  agentDefinitions: AgentDefinitionsResult,
  terminalWidth?: number,
  toolUseContext?: Pick<ToolUseContext, 'options'>,
  mainThreadAgentDefinition?: AgentDefinition,
  /** Original messages before microcompact, used to extract API usage */
  originalMessages?: Message[],
): Promise<ContextData> {
  // runtimeModel读取`getRuntimeMainLoopModel`，供共享工具后续处理使用。
  const runtimeModel = getRuntimeMainLoopModel({
    permissionMode: (await getToolPermissionContext()).mode,
    mainLoopModel: model,
  })
  // Get context window size
  // contextWindow读取`getContextWindowForModel`，供共享工具后续处理使用。
  const contextWindow = getContextWindowForModel(runtimeModel, getSdkBetas())

  // Build the effective system prompt using the shared utility
  // defaultSystemPrompt读取`getSystemPrompt`，供共享工具后续处理使用。
  const defaultSystemPrompt = await getSystemPrompt(tools, runtimeModel)
  // effectiveSystemPrompt构建`buildEffectiveSystemPrompt`，供共享工具后续处理使用。
  const effectiveSystemPrompt = buildEffectiveSystemPrompt({
    mainThreadAgentDefinition,
    toolUseContext: toolUseContext ?? {
      options: {} as ToolUseContext['options'],
    },
    customSystemPrompt: toolUseContext?.options.customSystemPrompt,
    defaultSystemPrompt,
    appendSystemPrompt: toolUseContext?.options.appendSystemPrompt,
  })

  // Critical operations that should not fail due to skills
  // 共享工具 analyze Context先整理这一处局部数据，后续分支可以直接读取。
  const [
    { systemPromptTokens, systemPromptSections },
    { claudeMdTokens, memoryFileDetails },
    {
      builtInToolTokens,
      deferredBuiltinDetails,
      deferredBuiltinTokens,
      systemToolDetails,
    },
    { mcpToolTokens, mcpToolDetails, deferredToolTokens },
    { agentTokens, agentDetails },
    { slashCommandTokens, commandInfo },
    messageBreakdown,
  ] = await Promise.all([
    countSystemTokens(effectiveSystemPrompt),
    countMemoryFileTokens(),
    countBuiltInToolTokens(
      tools,
      getToolPermissionContext,
      agentDefinitions,
      runtimeModel,
      messages,
    ),
    countMcpToolTokens(
      tools,
      getToolPermissionContext,
      agentDefinitions,
      runtimeModel,
      messages,
    ),
    countCustomAgentTokens(agentDefinitions),
    countSlashCommandTokens(tools, getToolPermissionContext, agentDefinitions),
    approximateMessageTokens(messages),
  ])

  // Count skills separately with error isolation
  // skillResult统计`countSkillTokens`，供共享工具后续处理使用。
  const skillResult = await countSkillTokens(
    tools,
    getToolPermissionContext,
    agentDefinitions,
  )
  // skillInfo保存`skillResult.skillInfo`，供后续判断或组装使用。
  const skillInfo = skillResult.skillInfo
  // Use sum of individual skill token estimates (matches what's shown in details)
  // rather than skillResult.skillTokens which includes tool schema overhead
  // skillFrontmatterTokens 集合派生`skillFrontmatter.reduce`，供共享工具后续处理使用。
  const skillFrontmatterTokens = skillInfo.skillFrontmatter.reduce(
    // 这个回调绑定到 (sum, skill) => sum + skill.tokens,，负责共享工具在该局部场景下的响应。
    (sum, skill) => sum + skill.tokens,
    0,
  )

  // messageTokens 消息数据 命名 `messageBreakdown.totalTokens`，让后续代码直接表达这个值的用途。
  const messageTokens = messageBreakdown.totalTokens

  // Check if autocompact is enabled and calculate threshold
  // isAutoCompact记录 `isAutoCompactEnabled` 是否成立，共享工具随后按该结果分支。
  const isAutoCompact = isAutoCompactEnabled()
  // autoCompactThreshold保存`isAutoCompact`，供后续判断或组装使用。
  const autoCompactThreshold = isAutoCompact
    ? getEffectiveContextWindowSize(model) - AUTOCOMPACT_BUFFER_TOKENS
    : undefined

  // Create categories
  // cats 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const cats: ContextCategory[] = []

  // System prompt is always shown first (fixed overhead)
  // 满足 `systemPromptTokens > 0` 时，共享工具执行该分支。
  if (systemPromptTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'System prompt',
      tokens: systemPromptTokens,
      color: 'promptBorder',
    })
  }

  // Built-in tools right after system prompt (skills shown separately below)
  // Ant users get a per-tool breakdown via systemToolDetails
  // systemToolsTokens 集合保存`builtInToolTokens - skillFrontmatterTokens`，供后续判断或组装使用。
  const systemToolsTokens = builtInToolTokens - skillFrontmatterTokens
  // 满足 `systemToolsTokens > 0` 时，共享工具执行该分支。
  if (systemToolsTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name:
        process.env.USER_TYPE === 'ant'
          ? '[ANT-ONLY] System tools'
          : 'System tools',
      tokens: systemToolsTokens,
      color: 'inactive',
    })
  }

  // MCP tools after system tools
  // 满足 `mcpToolTokens > 0` 时，共享工具执行该分支。
  if (mcpToolTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'MCP tools',
      tokens: mcpToolTokens,
      color: 'cyan_FOR_SUBAGENTS_ONLY',
    })
  }

  // Show deferred MCP tools (when tool search is enabled)
  // These don't count toward context usage but we show them for visibility
  // 满足 `deferredToolTokens > 0` 时，共享工具执行该分支。
  if (deferredToolTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'MCP tools (deferred)',
      tokens: deferredToolTokens,
      color: 'inactive',
      isDeferred: true,
    })
  }

  // Show deferred builtin tools (when tool search is enabled)
  // 满足 `deferredBuiltinTokens > 0` 时，共享工具执行该分支。
  if (deferredBuiltinTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'System tools (deferred)',
      tokens: deferredBuiltinTokens,
      color: 'inactive',
      isDeferred: true,
    })
  }

  // Custom agents after MCP tools
  // 满足 `agentTokens > 0` 时，共享工具执行该分支。
  if (agentTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'Custom agents',
      tokens: agentTokens,
      color: 'permission',
    })
  }

  // Memory files after custom agents
  // 满足 `claudeMdTokens > 0` 时，共享工具执行该分支。
  if (claudeMdTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'Memory files',
      tokens: claudeMdTokens,
      color: 'claude',
    })
  }

  // Skills after memory files
  // 满足 `skillFrontmatterTokens > 0` 时，共享工具执行该分支。
  if (skillFrontmatterTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'Skills',
      tokens: skillFrontmatterTokens,
      color: 'warning',
    })
  }

  // `messageTokens` 与 `null && messageTokens > 0` 不一致时刷新派生状态，避免使用过期结果。
  if (messageTokens !== null && messageTokens > 0) {
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: 'Messages',
      tokens: messageTokens,
      color: 'purple_FOR_SUBAGENTS_ONLY',
    })
  }

  // Calculate actual content usage (before adding reserved buffers)
  // Exclude deferred categories from the usage calculation
  // actualUsage派生`cats.reduce`，供共享工具后续处理使用。
  const actualUsage = cats.reduce(
    // 这个回调绑定到 (sum, cat) => sum + (cat.isDeferred ? 0 : cat.tokens),，负责共享工具在该局部场景下的响应。
    (sum, cat) => sum + (cat.isDeferred ? 0 : cat.tokens),
    0,
  )

  // Reserved space after messages (not counted in actualUsage shown to user).
  // Under reactive-only mode (cobalt_raccoon), proactive autocompact never
  // fires and the reserved buffer is a lie — skip it entirely and let Free
  // space fill the grid. feature() guard keeps the flag string out of
  // external builds. Same for context-collapse (marble_origami) — collapse
  // owns the threshold ladder and autocompact is suppressed in
  // shouldAutoCompact, so the 33k buffer shown here would be a lie too.
  // reservedTokens 集合保存`0`，供后续判断或组装使用。
  let reservedTokens = 0
  // skipReservedBuffer标记共享工具 analyze Context是否启用对应路径。
  let skipReservedBuffer = false
  // 满足 `feature('REACTIVE_COMPACT')` 时，共享工具执行该分支。
  if (feature('REACTIVE_COMPACT')) {
    // 满足 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_raccoon', false)` 时，共享工具执行该分支。
    if (getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_raccoon', false)) {
      // skipReservedBuffer更新为 `true`，确保共享工具后续读取最新状态。
      skipReservedBuffer = true
    }
  }
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，共享工具执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 共享工具 analyze Context先整理这一处局部数据，后续分支可以直接读取。
    const { isContextCollapseEnabled } =
      require('../services/contextCollapse/index.js') as typeof import('../services/contextCollapse/index.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 满足 `isContextCollapseEnabled()` 时，共享工具执行该分支。
    if (isContextCollapseEnabled()) {
      // skipReservedBuffer更新为 `true`，确保共享工具后续读取最新状态。
      skipReservedBuffer = true
    }
  }
  // 满足 `skipReservedBuffer` 时，共享工具执行该分支。
  if (skipReservedBuffer) {
    // No buffer category pushed — reactive compaction is transparent and
    // doesn't need a visible reservation in the grid.
  // 共享工具 analyze Context在这里处理 `} else if (isAutoCompact && autoCompactThreshold !== undefined) {`，完成这一小步状态转换。
  } else if (isAutoCompact && autoCompactThreshold !== undefined) {
    // Autocompact buffer (from effective context)
    // reservedTokens 集合更新为 `contextWindow - autoCompactThreshold`，确保共享工具后续读取最新状态。
    reservedTokens = contextWindow - autoCompactThreshold
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: RESERVED_CATEGORY_NAME,
      tokens: reservedTokens,
      color: 'inactive',
    })
  // 共享工具 analyze Context在这里处理 `} else if (!isAutoCompact) {`，完成这一小步状态转换。
  } else if (!isAutoCompact) {
    // Compact buffer reserve (3k from actual context limit)
    // reservedTokens 集合更新为 `MANUAL_COMPACT_BUFFER_TOKENS`，确保共享工具后续读取最新状态。
    reservedTokens = MANUAL_COMPACT_BUFFER_TOKENS
    // cats 集合追加新条目，保持收集顺序与输入顺序一致。
    cats.push({
      name: MANUAL_COMPACT_BUFFER_NAME,
      tokens: reservedTokens,
      color: 'inactive',
    })
  }

  // Calculate free space (subtract both actual usage and reserved buffer)
  // freeTokens 集合保存`Math.max`，供共享工具后续处理使用。
  const freeTokens = Math.max(0, contextWindow - actualUsage - reservedTokens)

  // cats 集合追加新条目，保持收集顺序与输入顺序一致。
  cats.push({
    name: 'Free space',
    tokens: freeTokens,
    color: 'promptBorder',
  })

  // Total for display (everything except free space)
  // totalIncludingReserved保存`actualUsage`，供后续判断或组装使用。
  const totalIncludingReserved = actualUsage

  // Extract API usage from original messages (if provided) to match status line
  // This uses the same source of truth as the status line for consistency
  // apiUsage读取`getCurrentUsage`，供共享工具后续处理使用。
  const apiUsage = getCurrentUsage(originalMessages ?? messages)

  // When API usage is available, use it for total to match status line calculation
  // Status line uses: input_tokens + cache_creation_input_tokens + cache_read_input_tokens
  // totalFromAPI保存`apiUsage`，供后续判断或组装使用。
  const totalFromAPI = apiUsage
    ? apiUsage.input_tokens +
      apiUsage.cache_creation_input_tokens +
      apiUsage.cache_read_input_tokens
    : null

  // Use API total if available, otherwise fall back to estimated total
  // finalTotalTokens 集合保存`totalFromAPI ?? totalIncludingReserved`，供后续判断或组装使用。
  const finalTotalTokens = totalFromAPI ?? totalIncludingReserved

  // Pre-calculate grid based on model context window and terminal width
  // For narrow screens (< 80 cols), use 5x5 for 200k models, 5x10 for 1M+ models
  // For normal screens, use 10x10 for 200k models, 20x10 for 1M+ models
  // isNarrowScreen标记共享工具 analyze Context是否启用对应路径。
  const isNarrowScreen = terminalWidth && terminalWidth < 80
  // GRID_WIDTH 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const GRID_WIDTH =
    contextWindow >= 1000000
      ? isNarrowScreen
        ? 5
        : 20
      : isNarrowScreen
        ? 5
        : 10
  // GRID_HEIGHT保存`contextWindow >= 1000000 ? 10 : isNarrowScreen ? 5 : 10`，供后续判断或组装使用。
  const GRID_HEIGHT = contextWindow >= 1000000 ? 10 : isNarrowScreen ? 5 : 10
  // TOTAL_SQUARES 集合保存`GRID_WIDTH * GRID_HEIGHT`，供共享工具 analyze Context后续判断或输出使用。
  const TOTAL_SQUARES = GRID_WIDTH * GRID_HEIGHT

  // Filter out deferred categories - they don't take up actual context space
  // (e.g., MCP tools when tool search is enabled)
  // nonDeferredCats 集合筛选`cats.filter`，供共享工具后续处理使用。
  const nonDeferredCats = cats.filter(cat => !cat.isDeferred)

  // Calculate squares per category (use rawEffectiveMax for visualization to show full context)
  // categorySquares 集合派生`nonDeferredCats.map`，供共享工具后续处理使用。
  const categorySquares = nonDeferredCats.map(cat => ({
    ...cat,
    squares:
      cat.name === 'Free space'
        ? Math.round((cat.tokens / contextWindow) * TOTAL_SQUARES)
        : Math.max(1, Math.round((cat.tokens / contextWindow) * TOTAL_SQUARES)),
    percentageOfTotal: Math.round((cat.tokens / contextWindow) * 100),
  }))

  // Helper function to create grid squares for a category
  // createCategorySquares 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function createCategorySquares(
    category: (typeof categorySquares)[0],
  ): GridSquare[] {
    // squares 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const squares: GridSquare[] = []
    // exactSquares 集合 命名 `(category.tokens / contextWindow) * TOTAL_SQUARES`，让后续代码直接表达这个值的用途。
    const exactSquares = (category.tokens / contextWindow) * TOTAL_SQUARES
    // wholeSquares 集合保存`Math.floor`，供共享工具后续处理使用。
    const wholeSquares = Math.floor(exactSquares)
    // fractionalPart保存`exactSquares - wholeSquares`，供后续判断或组装使用。
    const fractionalPart = exactSquares - wholeSquares

    // 按索引扫描 `category.squares`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < category.squares; i++) {
      // Determine fullness: full squares get 1.0, partial square gets fractional amount
      // squareFullness 集合保存`1.0`，供共享工具 analyze Context后续判断或输出使用。
      let squareFullness = 1.0
      // 只有 `i === wholeSquares && fractionalPart > 0` 满足时，共享工具才执行该分支。
      if (i === wholeSquares && fractionalPart > 0) {
        // This is the partial square
        // squareFullness 集合更新为 `fractionalPart`，确保共享工具后续读取最新状态。
        squareFullness = fractionalPart
      }

      // squares 集合追加新条目，保持收集顺序与输入顺序一致。
      squares.push({
        color: category.color,
        isFilled: true,
        categoryName: category.name,
        tokens: category.tokens,
        percentage: category.percentageOfTotal,
        squareFullness,
      })
    }

    // 返回 `squares`，作为共享工具这次计算的结果。
    return squares
  }

  // Build the grid as an array of squares with full metadata
  // gridSquares 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const gridSquares: GridSquare[] = []

  // Separate reserved category for end placement (either autocompact or manual compact buffer)
  // reservedCategory筛选`categorySquares.find`，供共享工具后续处理使用。
  const reservedCategory = categorySquares.find(
    // cat更新为 `>`，确保共享工具后续读取最新状态。
    cat =>
      cat.name === RESERVED_CATEGORY_NAME ||
      cat.name === MANUAL_COMPACT_BUFFER_NAME,
  )
  // nonReservedCategories 集合筛选`categorySquares.filter`，供共享工具后续处理使用。
  const nonReservedCategories = categorySquares.filter(
    // cat更新为 `>`，确保共享工具后续读取最新状态。
    cat =>
      cat.name !== RESERVED_CATEGORY_NAME &&
      cat.name !== MANUAL_COMPACT_BUFFER_NAME &&
      cat.name !== 'Free space',
  )

  // Add all non-reserved, non-free-space squares first
  // 按顺序遍历 `nonReservedCategories` 中的cat，逐个交给共享工具处理。
  for (const cat of nonReservedCategories) {
    // squares 集合构建`createCategorySquares`，供共享工具后续处理使用。
    const squares = createCategorySquares(cat)
    // 按顺序遍历 `squares` 中的square，逐个交给共享工具处理。
    for (const square of squares) {
      // 满足 `gridSquares.length < TOTAL_SQUARES` 时，共享工具执行该分支。
      if (gridSquares.length < TOTAL_SQUARES) {
        // gridSquares 集合追加新条目，保持收集顺序与输入顺序一致。
        gridSquares.push(square)
      }
    }
  }

  // Calculate how many squares are needed for reserved
  // reservedSquareCount 数量保存`reservedCategory ? reservedCategory.squares : 0`，供共享工具 analyze Context后续判断或输出使用。
  const reservedSquareCount = reservedCategory ? reservedCategory.squares : 0

  // Fill with free space, leaving room for reserved at the end
  // freeSpaceCat筛选`cats.find`，供共享工具后续处理使用。
  const freeSpaceCat = cats.find(c => c.name === 'Free space')
  // freeSpaceTarget 命名 `TOTAL_SQUARES - reservedSquareCount`，让后续代码直接表达这个值的用途。
  const freeSpaceTarget = TOTAL_SQUARES - reservedSquareCount

  // while 使用 gridSquares.length < freeSpaceTarget 完成共享工具里的对应操作。
  while (gridSquares.length < freeSpaceTarget) {
    // gridSquares 集合追加新条目，保持收集顺序与输入顺序一致。
    gridSquares.push({
      color: 'promptBorder',
      isFilled: true,
      categoryName: 'Free space',
      tokens: freeSpaceCat?.tokens || 0,
      percentage: freeSpaceCat
        ? Math.round((freeSpaceCat.tokens / contextWindow) * 100)
        : 0,
      squareFullness: 1.0, // Free space is always "full"
    })
  }

  // Add reserved squares at the end
  // 满足 `reservedCategory` 时，共享工具执行该分支。
  if (reservedCategory) {
    // squares 集合构建`createCategorySquares`，供共享工具后续处理使用。
    const squares = createCategorySquares(reservedCategory)
    // 按顺序遍历 `squares` 中的square，逐个交给共享工具处理。
    for (const square of squares) {
      // 满足 `gridSquares.length < TOTAL_SQUARES` 时，共享工具执行该分支。
      if (gridSquares.length < TOTAL_SQUARES) {
        // gridSquares 集合追加新条目，保持收集顺序与输入顺序一致。
        gridSquares.push(square)
      }
    }
  }

  // Convert to rows for rendering
  // gridRows 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const gridRows: GridSquare[][] = []
  // 按索引扫描 `GRID_HEIGHT`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < GRID_HEIGHT; i++) {
    // gridRows 集合追加新条目，保持收集顺序与输入顺序一致。
    gridRows.push(gridSquares.slice(i * GRID_WIDTH, (i + 1) * GRID_WIDTH))
  }

  // Format message breakdown (used by context suggestions for all users)
  // Combine tool calls and results, then get top 5
  // toolsMap构建`new Map<` 整理出中间结果，供共享工具 analyze Context后续步骤使用。
  const toolsMap = new Map<
    string,
    { callTokens: number; resultTokens: number }
  >()

  // Add call tokens
  // 循环处理 `const [name, tokens] of messageBreakdown.toolCallsByType.entries()`，让共享工具把同类条目按顺序走完。
  for (const [name, tokens] of messageBreakdown.toolCallsByType.entries()) {
    // existing读取`toolsMap.get`，供共享工具后续处理使用。
    const existing = toolsMap.get(name) || { callTokens: 0, resultTokens: 0 }
    // toolsMap.set 写入新的状态值，使共享工具后续读取保持一致。
    toolsMap.set(name, { ...existing, callTokens: tokens })
  }

  // Add result tokens
  // 循环处理 `const [name, tokens] of messageBreakdown.toolResultsByType.entries()`，让共享工具把同类条目按顺序走完。
  for (const [name, tokens] of messageBreakdown.toolResultsByType.entries()) {
    // existing读取`toolsMap.get`，供共享工具后续处理使用。
    const existing = toolsMap.get(name) || { callTokens: 0, resultTokens: 0 }
    // toolsMap.set 写入新的状态值，使共享工具后续读取保持一致。
    toolsMap.set(name, { ...existing, resultTokens: tokens })
  }

  // Convert to array and sort by total tokens (calls + results)
  // toolsByTypeArray保存`Array.from`，供共享工具后续处理使用。
  const toolsByTypeArray = Array.from(toolsMap.entries())
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(([name, { callTokens, resultTokens }]) => ({
      name,
      callTokens,
      resultTokens,
    }))
    .sort(
      // 这个回调绑定到 (a, b) => b.callTokens + b.resultTokens - (a.callTokens + a.resultTokens),，负责共享工具在该局部场景下的响应。
      (a, b) => b.callTokens + b.resultTokens - (a.callTokens + a.resultTokens),
    )

  // attachmentsByTypeArray保存`Array.from`，供共享工具后续处理使用。
  const attachmentsByTypeArray = Array.from(
    messageBreakdown.attachmentsByType.entries(),
  )
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(([name, tokens]) => ({ name, tokens }))
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => b.tokens - a.tokens)

  // formattedMessageBreakdown 消息数据集中保存共享工具 analyze Context要一起传递的字段。
  const formattedMessageBreakdown = {
    toolCallTokens: messageBreakdown.toolCallTokens,
    toolResultTokens: messageBreakdown.toolResultTokens,
    attachmentTokens: messageBreakdown.attachmentTokens,
    assistantMessageTokens: messageBreakdown.assistantMessageTokens,
    userMessageTokens: messageBreakdown.userMessageTokens,
    toolCallsByType: toolsByTypeArray,
    attachmentsByType: attachmentsByTypeArray,
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    categories: cats,
    totalTokens: finalTotalTokens,
    maxTokens: contextWindow,
    rawMaxTokens: contextWindow,
    percentage: Math.round((finalTotalTokens / contextWindow) * 100),
    gridRows,
    model: runtimeModel,
    memoryFiles: memoryFileDetails,
    mcpTools: mcpToolDetails,
    deferredBuiltinTools:
      process.env.USER_TYPE === 'ant' ? deferredBuiltinDetails : undefined,
    systemTools:
      process.env.USER_TYPE === 'ant' ? systemToolDetails : undefined,
    systemPromptSections:
      process.env.USER_TYPE === 'ant' ? systemPromptSections : undefined,
    agents: agentDetails,
    slashCommands:
      slashCommandTokens > 0
        ? {
            totalCommands: commandInfo.totalCommands,
            includedCommands: commandInfo.includedCommands,
            tokens: slashCommandTokens,
          }
        : undefined,
    skills:
      skillFrontmatterTokens > 0
        ? {
            totalSkills: skillInfo.totalSkills,
            includedSkills: skillInfo.includedSkills,
            tokens: skillFrontmatterTokens,
            skillFrontmatter: skillInfo.skillFrontmatter,
          }
        : undefined,
    autoCompactThreshold,
    isAutoCompactEnabled: isAutoCompact,
    messageBreakdown: formattedMessageBreakdown,
    apiUsage,
  }
}
