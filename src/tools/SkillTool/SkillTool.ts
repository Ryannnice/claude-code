// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 引入 getProjectRoot，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot } from 'src/bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  builtInCommandNames,
  findCommand,
  getCommands,
  type PromptCommand,
} from 'src/commands.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  Tool,
  ToolCallProgress,
  ToolResult,
  ToolUseContext,
  ValidationResult,
} from 'src/Tool.js'
// 引入 buildTool、ToolDef，将 src/Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from 'src/Tool.js'
// 类型依赖 { Command } 来自 src/types/command.js，用于校准工具调用的数据契约。
import type { Command } from 'src/types/command.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  SystemMessage,
  UserMessage,
} from 'src/types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 类型依赖 { PermissionDecision } 来自 src/utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from 'src/utils/permissions/PermissionResult.js'
// 复用 getRuleByContentsForTool 工具函数，把通用处理留在 src/utils/permissions/permissions.js 中维护。
import { getRuleByContentsForTool } from 'src/utils/permissions/permissions.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isOfficialMarketplaceName,
  parsePluginIdentifier,
} from 'src/utils/plugins/pluginIdentifier.js'
// 复用 buildPluginCommandTelemetryFields 工具函数，把通用处理留在 src/utils/telemetry/pluginTelemetry.js 中维护。
import { buildPluginCommandTelemetryFields } from 'src/utils/telemetry/pluginTelemetry.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addInvokedSkill,
  clearInvokedSkillsForAgent,
  getSessionId,
} from '../../bootstrap/state.js'
// 引入 COMMAND_MESSAGE_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMAND_MESSAGE_TAG } from '../../constants/xml.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 复用 getAgentContext 工具函数，把通用处理留在 ../../utils/agentContext.js 中维护。
import { getAgentContext } from '../../utils/agentContext.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  extractResultText,
  prepareForkedCommandContext,
} from '../../utils/forkedAgent.js'
// 复用 parseFrontmatter 工具函数，把通用处理留在 ../../utils/frontmatterParser.js 中维护。
import { parseFrontmatter } from '../../utils/frontmatterParser.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 createUserMessage、normalizeMessages 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage, normalizeMessages } from '../../utils/messages.js'
// 类型依赖 { ModelAlias } 来自 ../../utils/model/aliases.js，用于校准工具调用的数据契约。
import type { ModelAlias } from '../../utils/model/aliases.js'
// 复用 resolveSkillModelOverride 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { resolveSkillModelOverride } from '../../utils/model/model.js'
// 复用 recordSkillUsage 工具函数，把通用处理留在 ../../utils/suggestions/skillUsageTracking.js 中维护。
import { recordSkillUsage } from '../../utils/suggestions/skillUsageTracking.js'
// 复用 createAgentId 工具函数，把通用处理留在 ../../utils/uuid.js 中维护。
import { createAgentId } from '../../utils/uuid.js'
// 引入 runAgent，将 ../AgentTool/runAgent.js 中已经封装好的能力接到本文件流程里。
import { runAgent } from '../AgentTool/runAgent.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseIDFromParentMessage,
  tagMessagesWithToolUseID,
} from '../utils.js'
// 引入 SKILL_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { SKILL_TOOL_NAME } from './constants.js'
// 引入 getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getPrompt } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolUseRejectedMessage,
} from './UI.js'

/**
 * Gets all commands including MCP skills/prompts from AppState.
 * SkillTool needs this because getCommands() only returns local/bundled skills.
 */
// getAllCommands 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAllCommands(context: ToolUseContext): Promise<Command[]> {
  // Only include MCP skills (loadedFrom === 'mcp'), not plain MCP prompts.
  // Before this filter, the model could invoke MCP prompts via SkillTool
  // if it guessed the mcp__server__prompt name — they weren't discoverable
  // but were technically reachable.
  // mcpSkills 集合保存`context`，供后续判断或组装使用。
  const mcpSkills = context
    .getAppState()
    .mcp.commands.filter(
      // cmd 命令数据更新为 `> cmd.type === 'prompt' && cmd.loadedFrom === 'mcp'`，确保工具调用后续读取最新状态。
      cmd => cmd.type === 'prompt' && cmd.loadedFrom === 'mcp',
    )
  // 满足 `mcpSkills.length === 0) return getCommands(getProjectRoot()` 时，工具调用执行该分支。
  if (mcpSkills.length === 0) return getCommands(getProjectRoot())
  // localCommands 命令数据读取`getCommands`，供工具调用后续处理使用。
  const localCommands = await getCommands(getProjectRoot())
  // 返回 `uniqBy([...localCommands, ...mcpSkills], 'name')`，作为工具调用这次计算的结果。
  return uniqBy([...localCommands, ...mcpSkills], 'name')
}

// Re-export Progress from centralized types to break import cycles
// 导出类型定义，让其他模块沿用工具实现 Skill Tool的数据契约。
export type { SkillToolProgress as Progress } from '../../types/tools.js'

// 类型依赖 { SkillToolProgress as Progress } 来自 ../../types/tools.js，用于校准工具调用的数据契约。
import type { SkillToolProgress as Progress } from '../../types/tools.js'

// Conditional require for remote skill modules — static imports here would
// pull in akiBackend.ts (via remoteSkillLoader → akiBackend), which has
// module-level memoize()/lazySchema() consts that survive tree-shaking as
// side-effecting initializers. All usages are inside
// feature('EXPERIMENTAL_SKILL_SEARCH') guards, so remoteSkillModules is
// non-null at every call site.
/* eslint-disable @typescript-eslint/no-require-imports */
// remoteSkillModules 集合保存`feature`，供工具调用后续处理使用。
const remoteSkillModules = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? {
      ...(require('../../services/skillSearch/remoteSkillState.js') as typeof import('../../services/skillSearch/remoteSkillState.js')),
      ...(require('../../services/skillSearch/remoteSkillLoader.js') as typeof import('../../services/skillSearch/remoteSkillLoader.js')),
      ...(require('../../services/skillSearch/telemetry.js') as typeof import('../../services/skillSearch/telemetry.js')),
      ...(require('../../services/skillSearch/featureCheck.js') as typeof import('../../services/skillSearch/featureCheck.js')),
    }
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Executes a skill in a forked sub-agent context.
 * This runs the skill prompt in an isolated agent with its own token budget.
 */
// executeForkedSkill 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executeForkedSkill(
  command: Command & { type: 'prompt' },
  commandName: string,
  args: string | undefined,
  context: ToolUseContext,
  canUseTool: CanUseToolFn,
  parentMessage: AssistantMessage,
  onProgress?: ToolCallProgress<Progress>,
): Promise<ToolResult<Output>> {
  // startTime记录时间`Date.now`，供工具调用后续处理使用。
  const startTime = Date.now()
  // agentId构建`createAgentId`，供工具调用后续处理使用。
  const agentId = createAgentId()
  // isBuiltIn记录 `builtInCommandNames` 是否成立，工具调用随后按该结果分支。
  const isBuiltIn = builtInCommandNames().has(commandName)
  // isOfficialSkill记录 `isOfficialMarketplaceSkill` 是否成立，工具调用随后按该结果分支。
  const isOfficialSkill = isOfficialMarketplaceSkill(command)
  // isBundled标记工具实现 Skill Tool是否启用对应路径。
  const isBundled = command.source === 'bundled'
  // forkedSanitizedName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const forkedSanitizedName =
    isBuiltIn || isBundled || isOfficialSkill ? commandName : 'custom'

  // wasDiscoveredField 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wasDiscoveredField =
    feature('EXPERIMENTAL_SKILL_SEARCH') &&
    remoteSkillModules!.isSkillSearchEnabled()
      ? {
          was_discovered:
            context.discoveredSkillNames?.has(commandName) ?? false,
        }
      : {}
  // pluginMarketplace 插件数据 命名 `command.pluginInfo`，让后续代码直接表达这个值的用途。
  const pluginMarketplace = command.pluginInfo
    ? parsePluginIdentifier(command.pluginInfo.repository).marketplace
    : undefined
  // queryDepth保存`context.queryTracking?.depth ?? 0`，供工具实现 Skill Tool后续判断或输出使用。
  const queryDepth = context.queryTracking?.depth ?? 0
  // parentAgentId读取`getAgentContext`，供工具调用后续处理使用。
  const parentAgentId = getAgentContext()?.agentId
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_skill_tool_invocation', {
    command_name:
      forkedSanitizedName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    // _PROTO_skill_name routes to the privileged skill_name BQ column
    // (unredacted, all users); command_name stays in additional_metadata as
    // the redacted variant for general-access dashboards.
    _PROTO_skill_name:
      commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    execution_context:
      'fork' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    invocation_trigger: (queryDepth > 0
      ? 'nested-skill'
      : 'claude-proactive') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    query_depth: queryDepth,
    ...(parentAgentId && {
      parent_agent_id:
        parentAgentId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...wasDiscoveredField,
    ...(process.env.USER_TYPE === 'ant' && {
      skill_name:
        commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_source:
        command.source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(command.loadedFrom && {
        skill_loaded_from:
          command.loadedFrom as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(command.kind && {
        skill_kind:
          command.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    }),
    ...(command.pluginInfo && {
      // _PROTO_* routes to PII-tagged plugin_name/marketplace_name BQ columns
      // (unredacted, all users); plugin_name/plugin_repository stay in
      // additional_metadata as redacted variants.
      _PROTO_plugin_name: command.pluginInfo.pluginManifest
        .name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(pluginMarketplace && {
        _PROTO_marketplace_name:
          pluginMarketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      plugin_name: (isOfficialSkill
        ? command.pluginInfo.pluginManifest.name
        : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      plugin_repository: (isOfficialSkill
        ? command.pluginInfo.repository
        : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginCommandTelemetryFields(command.pluginInfo),
    }),
  })

  // 工具实现 Skill Tool先整理这一处局部数据，后续分支可以直接读取。
  const { modifiedGetAppState, baseAgent, promptMessages, skillContent } =
    await prepareForkedCommandContext(command, args || '', context)

  // Merge skill's effort into the agent definition so runAgent applies it
  // agentDefinition 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const agentDefinition =
    command.effort !== undefined
      ? { ...baseAgent, effort: command.effort }
      : baseAgent

  // Collect messages from the forked agent
  // agentMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentMessages: Message[] = []

  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `SkillTool executing forked skill ${commandName} with agent ${agentDefinition.agentType}`,
  )

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // Run the sub-agent
    // 逐项读取 `runAgent({` 中的消息，按输入顺序推进工具实现 Skill Tool。
    for await (const message of runAgent({
      agentDefinition,
      promptMessages,
      toolUseContext: {
        ...context,
        getAppState: modifiedGetAppState,
      },
      canUseTool,
      isAsync: false,
      querySource: 'agent:custom',
      model: command.model as ModelAlias | undefined,
      availableTools: context.options.tools,
      override: { agentId },
    })) {
      // agentMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      agentMessages.push(message)

      // Report progress for tool uses (like AgentTool does)
      // 工具调用在这里按实际状态进入对应分支。
      if (
        (message.type === 'assistant' || message.type === 'user') &&
        onProgress
      ) {
        // normalizedNew保存`normalizeMessages`，供工具调用后续处理使用。
        const normalizedNew = normalizeMessages([message])
        // 按顺序遍历 `normalizedNew` 中的m，逐个交给工具调用处理。
        for (const m of normalizedNew) {
          // hasToolContent记录 `content.some` 是否成立，工具调用随后按该结果分支。
          const hasToolContent = m.message.content.some(
            // c更新为 `> c.type === 'tool_use' || c.type === 'tool_result'`，确保工具调用后续读取最新状态。
            c => c.type === 'tool_use' || c.type === 'tool_result',
          )
          // 满足 `hasToolContent` 时，工具调用执行该分支。
          if (hasToolContent) {
            // 调用 onProgress，触发工具调用此处需要的副作用。
            onProgress({
              toolUseID: `skill_${parentMessage.message.id}`,
              data: {
                message: m,
                type: 'skill_progress',
                prompt: skillContent,
                agentId,
              },
            })
          }
        }
      }
    }

    // resultText保存`extractResultText`，供工具调用后续处理使用。
    const resultText = extractResultText(
      agentMessages,
      'Skill execution completed',
    )
    // Release message memory after extracting result
    // agentMessages 消息数据被清空，工具调用从干净状态继续。
    agentMessages.length = 0

    // durationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
    const durationMs = Date.now() - startTime
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `SkillTool forked skill ${commandName} completed in ${durationMs}ms`,
    )

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: true,
        commandName,
        status: 'forked',
        agentId,
        result: resultText,
      },
    }
  } finally {
    // Release skill content from invokedSkills state
    // 调用 clearInvokedSkillsForAgent，触发工具调用此处需要的副作用。
    clearInvokedSkillsForAgent(agentId)
  }
}

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
export const inputSchema = lazySchema(() =>
  z.object({
    skill: z
      .string()
      .describe('The skill name. E.g., "commit", "review-pr", or "pdf"'),
    args: z.string().optional().describe('Optional arguments for the skill'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() => {
  // Output schema for inline skills (default)
  // inlineOutputSchema保存`z.object`，供工具调用后续处理使用。
  const inlineOutputSchema = z.object({
    success: z.boolean().describe('Whether the skill is valid'),
    commandName: z.string().describe('The name of the skill'),
    allowedTools: z
      .array(z.string())
      .optional()
      .describe('Tools allowed by this skill'),
    model: z.string().optional().describe('Model override if specified'),
    status: z.literal('inline').optional().describe('Execution status'),
  })

  // Output schema for forked skills
  // forkedOutputSchema保存`z.object`，供工具调用后续处理使用。
  const forkedOutputSchema = z.object({
    success: z.boolean().describe('Whether the skill completed successfully'),
    commandName: z.string().describe('The name of the skill'),
    status: z.literal('forked').describe('Execution status'),
    agentId: z
      .string()
      .describe('The ID of the sub-agent that executed the skill'),
    result: z.string().describe('The result from the forked skill execution'),
  })

  // 返回 `z.union([inlineOutputSchema, forkedOutputSchema])`，作为工具调用这次计算的结果。
  return z.union([inlineOutputSchema, forkedOutputSchema])
})
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.input<OutputSchema>

// SkillTool构建`buildTool({` 整理出中间结果，供工具实现 Skill Tool后续步骤使用。
export const SkillTool: Tool<InputSchema, Output, Progress> = buildTool({
  name: SKILL_TOOL_NAME,
  searchHint: 'invoke a slash-command skill',
  maxResultSizeChars: 100_000,
  // 工具实现 Skill Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Skill Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },

  // 这个回调绑定到 description: async ({ skill }) => `Execute skill: ${skill}`,，负责工具调用在该局部场景下的响应。
  description: async ({ skill }) => `Execute skill: ${skill}`,

  // 这个回调绑定到 prompt: async () => getPrompt(getProjectRoot()),，负责工具调用在该局部场景下的响应。
  prompt: async () => getPrompt(getProjectRoot()),

  // Only one skill/command should run at a time, since the tool expands the
  // command into a full prompt that Claude must process before continuing.
  // Skill-coach needs the skill name to avoid false-positive "you could have
  // used skill X" suggestions when X was actually invoked. Backseat classifies
  // downstream tool calls from the expanded prompt, not this wrapper, so the
  // name alone is sufficient — it just records that the skill fired.
  // 这个回调绑定到 toAutoClassifierInput: ({ skill }) => skill ?? '',，负责工具调用在该局部场景下的响应。
  toAutoClassifierInput: ({ skill }) => skill ?? '',

  // validateInput 使用 { skill }, context 完成工具调用里的对应操作。
  async validateInput({ skill }, context): Promise<ValidationResult> {
    // Skills are just skill names, no arguments
    // trimmed格式化`skill.trim`，供工具调用后续处理使用。
    const trimmed = skill.trim()
    // trimmed缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!trimmed) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Invalid skill format: ${skill}`,
        errorCode: 1,
      }
    }

    // Remove leading slash if present (for compatibility)
    // hasLeadingSlash记录 `trimmed.startsWith` 是否成立，工具调用随后按该结果分支。
    const hasLeadingSlash = trimmed.startsWith('/')
    // 满足 `hasLeadingSlash` 时，工具调用执行该分支。
    if (hasLeadingSlash) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_skill_tool_slash_prefix', {})
    }
    // normalizedCommandName 命令数据保存`hasLeadingSlash`，供后续判断或组装使用。
    const normalizedCommandName = hasLeadingSlash
      ? trimmed.substring(1)
      : trimmed

    // Remote canonical skill handling (ant-only experimental). Intercept
    // `_canonical_<slug>` names before local command lookup since remote
    // skills are not in the local command registry.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('EXPERIMENTAL_SKILL_SEARCH') &&
      process.env.USER_TYPE === 'ant'
    ) {
      // slug保存`stripCanonicalPrefix`，供工具调用后续处理使用。
      const slug = remoteSkillModules!.stripCanonicalPrefix(
        normalizedCommandName,
      )
      // `slug` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (slug !== null) {
        // meta读取`getDiscoveredRemoteSkill`，供工具调用后续处理使用。
        const meta = remoteSkillModules!.getDiscoveredRemoteSkill(slug)
        // meta缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!meta) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message: `Remote skill ${slug} was not discovered in this session. Use DiscoverSkills to find remote skills first.`,
            errorCode: 6,
          }
        }
        // Discovered remote skill — valid. Loading happens in call().
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }
    }

    // Get available commands (including MCP skills)
    // commands 命令数据读取`getAllCommands`，供工具调用后续处理使用。
    const commands = await getAllCommands(context)

    // Check if command exists
    // foundCommand 命令数据筛选`findCommand`，供工具调用后续处理使用。
    const foundCommand = findCommand(normalizedCommandName, commands)
    // foundCommand 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!foundCommand) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Unknown skill: ${normalizedCommandName}`,
        errorCode: 2,
      }
    }

    // Check if command has model invocation disabled
    // 满足 `foundCommand.disableModelInvocation` 时，工具调用执行该分支。
    if (foundCommand.disableModelInvocation) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Skill ${normalizedCommandName} cannot be used with ${SKILL_TOOL_NAME} tool due to disable-model-invocation`,
        errorCode: 4,
      }
    }

    // Check if command is a prompt-based command
    // `foundCommand.type` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
    if (foundCommand.type !== 'prompt') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Skill ${normalizedCommandName} is not a prompt-based skill`,
        errorCode: 5,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },

  // 工具实现 Skill Tool在这里处理 `async checkPermissions(`，完成这一小步状态转换。
  async checkPermissions(
    { skill, args },
    context,
  ): Promise<PermissionDecision> {
    // Skills are just skill names, no arguments
    // trimmed格式化`skill.trim`，供工具调用后续处理使用。
    const trimmed = skill.trim()

    // Remove leading slash if present (for compatibility)
    // commandName 命令数据格式化`trimmed.startsWith`，供工具调用后续处理使用。
    const commandName = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed

    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // permissionContext 权限数据保存`appState.toolPermissionContext`，供工具实现 Skill Tool后续判断或输出使用。
    const permissionContext = appState.toolPermissionContext

    // Look up the command object to pass as metadata
    // commands 命令数据读取`getAllCommands`，供工具调用后续处理使用。
    const commands = await getAllCommands(context)
    // commandObj 命令数据筛选`findCommand`，供工具调用后续处理使用。
    const commandObj = findCommand(commandName, commands)

    // Helper function to check if a rule matches the skill
    // Normalizes both inputs by stripping leading slashes for consistent matching
    // ruleMatches 集合封装成回调，供工具实现 Skill Tool在事件触发或异步步骤中调用。
    const ruleMatches = (ruleContent: string): boolean => {
      // Normalize rule content by stripping leading slash
      // normalizedRule保存`ruleContent.startsWith`，供工具调用后续处理使用。
      const normalizedRule = ruleContent.startsWith('/')
        ? ruleContent.substring(1)
        : ruleContent

      // Check exact match (using normalized commandName)
      // 满足 `normalizedRule === commandName` 时，工具调用执行该分支。
      if (normalizedRule === commandName) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
      // Check prefix match (e.g., "review:*" matches "review-pr 123")
      // 满足 `normalizedRule.endsWith(':*')` 时，工具调用执行该分支。
      if (normalizedRule.endsWith(':*')) {
        // prefix格式化`normalizedRule.slice`，供工具调用后续处理使用。
        const prefix = normalizedRule.slice(0, -2) // Remove ':*'
        // 返回 `commandName.startsWith(prefix)`，作为工具调用这次计算的结果。
        return commandName.startsWith(prefix)
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Check for deny rules
    // denyRules 集合读取`getRuleByContentsForTool`，供工具调用后续处理使用。
    const denyRules = getRuleByContentsForTool(
      permissionContext,
      SkillTool as Tool,
      'deny',
    )
    // 循环处理 `const [ruleContent, rule] of denyRules.entries()`，让工具调用把同类条目按顺序走完。
    for (const [ruleContent, rule] of denyRules.entries()) {
      // 满足 `ruleMatches(ruleContent)` 时，工具调用执行该分支。
      if (ruleMatches(ruleContent)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'deny',
          message: `Skill execution blocked by permission rules`,
          decisionReason: {
            type: 'rule',
            rule,
          },
        }
      }
    }

    // Remote canonical skills are ant-only experimental — auto-grant.
    // Placed AFTER the deny loop so a user-configured Skill(_canonical_:*)
    // deny rule is honored (same pattern as safe-properties auto-allow below).
    // The skill content itself is canonical/curated, not user-authored.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('EXPERIMENTAL_SKILL_SEARCH') &&
      process.env.USER_TYPE === 'ant'
    ) {
      // slug保存`stripCanonicalPrefix`，供工具调用后续处理使用。
      const slug = remoteSkillModules!.stripCanonicalPrefix(commandName)
      // `slug` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (slug !== null) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: { skill, args },
          decisionReason: undefined,
        }
      }
    }

    // Check for allow rules
    // allowRules 集合读取`getRuleByContentsForTool`，供工具调用后续处理使用。
    const allowRules = getRuleByContentsForTool(
      permissionContext,
      SkillTool as Tool,
      'allow',
    )
    // 循环处理 `const [ruleContent, rule] of allowRules.entries()`，让工具调用把同类条目按顺序走完。
    for (const [ruleContent, rule] of allowRules.entries()) {
      // 满足 `ruleMatches(ruleContent)` 时，工具调用执行该分支。
      if (ruleMatches(ruleContent)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: { skill, args },
          decisionReason: {
            type: 'rule',
            rule,
          },
        }
      }
    }

    // Auto-allow skills that only use safe properties.
    // This is an allowlist: if a skill has any property NOT in this set with a
    // meaningful value, it requires permission. This ensures new properties added
    // in the future default to requiring permission.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      commandObj?.type === 'prompt' &&
      skillHasOnlySafeProperties(commandObj)
    ) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'allow',
        updatedInput: { skill, args },
        decisionReason: undefined,
      }
    }

    // Prepare suggestions for exact skill and prefix
    // Use normalized commandName (without leading slash) for consistent rules
    // suggestions 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const suggestions = [
      // Exact skill suggestion
      {
        type: 'addRules' as const,
        rules: [
          {
            toolName: SKILL_TOOL_NAME,
            ruleContent: commandName,
          },
        ],
        behavior: 'allow' as const,
        destination: 'localSettings' as const,
      },
      // Prefix suggestion to allow any args
      {
        type: 'addRules' as const,
        rules: [
          {
            toolName: SKILL_TOOL_NAME,
            ruleContent: `${commandName}:*`,
          },
        ],
        behavior: 'allow' as const,
        destination: 'localSettings' as const,
      },
    ]

    // Default behavior: ask user for permission
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: `Execute skill: ${commandName}`,
      decisionReason: undefined,
      suggestions,
      updatedInput: { skill, args },
      metadata: commandObj ? { command: commandObj } : undefined,
    }
  },

  // 工具实现 Skill Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    { skill, args },
    context,
    canUseTool,
    parentMessage,
    onProgress?,
  ): Promise<ToolResult<Output>> {
    // At this point, validateInput has already confirmed:
    // - Skill format is valid
    // - Skill exists
    // - Skill can be loaded
    // - Skill doesn't have disableModelInvocation
    // - Skill is a prompt-based skill

    // Skills are just names, with optional arguments
    // trimmed格式化`skill.trim`，供工具调用后续处理使用。
    const trimmed = skill.trim()

    // Remove leading slash if present (for compatibility)
    // commandName 命令数据格式化`trimmed.startsWith`，供工具调用后续处理使用。
    const commandName = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed

    // Remote canonical skill execution (ant-only experimental). Intercepts
    // `_canonical_<slug>` before local command lookup — loads SKILL.md from
    // AKI/GCS (with local cache), injects content directly as a user message.
    // Remote skills are declarative markdown so no slash-command expansion
    // (no !command substitution, no $ARGUMENTS interpolation) is needed.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('EXPERIMENTAL_SKILL_SEARCH') &&
      process.env.USER_TYPE === 'ant'
    ) {
      // slug保存`stripCanonicalPrefix`，供工具调用后续处理使用。
      const slug = remoteSkillModules!.stripCanonicalPrefix(commandName)
      // `slug` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (slug !== null) {
        // 返回 `executeRemoteSkill(slug, commandName, parentMessage, context)`，作为工具调用这次计算的结果。
        return executeRemoteSkill(slug, commandName, parentMessage, context)
      }
    }

    // commands 命令数据读取`getAllCommands`，供工具调用后续处理使用。
    const commands = await getAllCommands(context)
    // 命令筛选`findCommand`，供工具调用后续处理使用。
    const command = findCommand(commandName, commands)

    // Track skill usage for ranking
    // 调用 recordSkillUsage，触发工具调用此处需要的副作用。
    recordSkillUsage(commandName)

    // Check if skill should run as a forked sub-agent
    // 只有 `command?.type === 'prompt' && command.context ===` 满足时，工具调用才执行该分支。
    if (command?.type === 'prompt' && command.context === 'fork') {
      // 返回 `executeForkedSkill(`，作为工具调用这次计算的结果。
      return executeForkedSkill(
        command,
        commandName,
        args,
        context,
        canUseTool,
        parentMessage,
        onProgress,
      )
    }

    // Process the skill with optional args
    // 从 `await import(` 解构 processPromptSlashCommand，减少工具实现 Skill Tool对同一对象的重复访问。
    const { processPromptSlashCommand } = await import(
      'src/utils/processUserInput/processSlashCommand.js'
    )
    // processedCommand 命令数据保存`processPromptSlashCommand`，供工具调用后续处理使用。
    const processedCommand = await processPromptSlashCommand(
      commandName,
      args || '', // Pass args if provided
      commands,
      context,
    )

    // processedCommand.shouldQuery 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!processedCommand.shouldQuery) {
      // 抛出 new Error('Command processing failed')，阻止工具调用在无效状态下继续运行。
      throw new Error('Command processing failed')
    }

    // Extract metadata from the command
    // allowedTools 集合标记工具实现 Skill Tool是否启用对应路径。
    const allowedTools = processedCommand.allowedTools || []
    // 模型名称保存`processedCommand.model`，供工具实现 Skill Tool后续判断或输出使用。
    const model = processedCommand.model
    // effort标记工具实现 Skill Tool是否启用对应路径。
    const effort = command?.type === 'prompt' ? command.effort : undefined

    // isBuiltIn记录 `builtInCommandNames` 是否成立，工具调用随后按该结果分支。
    const isBuiltIn = builtInCommandNames().has(commandName)
    // isBundled标记工具实现 Skill Tool是否启用对应路径。
    const isBundled = command?.type === 'prompt' && command.source === 'bundled'
    // isOfficialSkill 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isOfficialSkill =
      command?.type === 'prompt' && isOfficialMarketplaceSkill(command)
    // sanitizedCommandName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const sanitizedCommandName =
      isBuiltIn || isBundled || isOfficialSkill ? commandName : 'custom'

    // wasDiscoveredField 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const wasDiscoveredField =
      feature('EXPERIMENTAL_SKILL_SEARCH') &&
      remoteSkillModules!.isSkillSearchEnabled()
        ? {
            was_discovered:
              context.discoveredSkillNames?.has(commandName) ?? false,
          }
        : {}
    // pluginMarketplace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const pluginMarketplace =
      command?.type === 'prompt' && command.pluginInfo
        ? parsePluginIdentifier(command.pluginInfo.repository).marketplace
        : undefined
    // queryDepth保存`context.queryTracking?.depth ?? 0`，供工具实现 Skill Tool后续判断或输出使用。
    const queryDepth = context.queryTracking?.depth ?? 0
    // parentAgentId读取`getAgentContext`，供工具调用后续处理使用。
    const parentAgentId = getAgentContext()?.agentId
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_skill_tool_invocation', {
      command_name:
        sanitizedCommandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      // _PROTO_skill_name routes to the privileged skill_name BQ column
      // (unredacted, all users); command_name stays in additional_metadata as
      // the redacted variant for general-access dashboards.
      _PROTO_skill_name:
        commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      execution_context:
        'inline' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      invocation_trigger: (queryDepth > 0
        ? 'nested-skill'
        : 'claude-proactive') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      query_depth: queryDepth,
      ...(parentAgentId && {
        parent_agent_id:
          parentAgentId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...wasDiscoveredField,
      ...(process.env.USER_TYPE === 'ant' && {
        skill_name:
          commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...(command?.type === 'prompt' && {
          skill_source:
            command.source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(command?.loadedFrom && {
          skill_loaded_from:
            command.loadedFrom as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(command?.kind && {
          skill_kind:
            command.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
      }),
      ...(command?.type === 'prompt' &&
        command.pluginInfo && {
          _PROTO_plugin_name: command.pluginInfo.pluginManifest
            .name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
          ...(pluginMarketplace && {
            _PROTO_marketplace_name:
              pluginMarketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
          }),
          plugin_name: (isOfficialSkill
            ? command.pluginInfo.pluginManifest.name
            : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          plugin_repository: (isOfficialSkill
            ? command.pluginInfo.repository
            : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          ...buildPluginCommandTelemetryFields(command.pluginInfo),
        }),
    })

    // Get the tool use ID from the parent message for linking newMessages
    // toolUseID读取`getToolUseIDFromParentMessage`，供工具调用后续处理使用。
    const toolUseID = getToolUseIDFromParentMessage(
      parentMessage,
      SKILL_TOOL_NAME,
    )

    // Tag user messages with sourceToolUseID so they stay transient until this tool resolves
    // newMessages 消息数据保存`tagMessagesWithToolUseID`，供工具调用后续处理使用。
    const newMessages = tagMessagesWithToolUseID(
      processedCommand.messages.filter(
        // 这个回调绑定到 (m): m is UserMessage | AttachmentMessage | SystemMessage => {，负责工具调用在该局部场景下的响应。
        (m): m is UserMessage | AttachmentMessage | SystemMessage => {
          // 当 `m.type` 匹配 `'progress'` 时，工具调用执行对应分支。
          if (m.type === 'progress') {
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
          // Filter out command-message since SkillTool handles display
          // 只有 `m.type === 'user' && 'message' in m` 满足时，工具调用才执行该分支。
          if (m.type === 'user' && 'message' in m) {
            // 文本内容 命名 `m.message.content`，让后续代码直接表达这个值的用途。
            const content = m.message.content
            // 工具调用在这里按实际状态进入对应分支。
            if (
              typeof content === 'string' &&
              content.includes(`<${COMMAND_MESSAGE_TAG}>`)
            ) {
              // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
              return false
            }
          }
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        },
      ),
      toolUseID,
    )

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `SkillTool returning ${newMessages.length} newMessages for skill ${commandName}`,
    )

    // Note: addInvokedSkill and registerSkillHooks are called inside
    // processPromptSlashCommand (via getMessagesForPromptSlashCommand), so
    // calling them again here would double-register hooks and rebuild
    // skillContent redundantly.

    // Return success with newMessages and contextModifier
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: true,
        commandName,
        allowedTools: allowedTools.length > 0 ? allowedTools : undefined,
        model,
      },
      newMessages,
      // contextModifier 使用 ctx 完成工具调用里的对应操作。
      contextModifier(ctx) {
        // modifiedContext保存`ctx`，供后续判断或组装使用。
        let modifiedContext = ctx

        // Update allowed tools if specified
        // 满足 `allowedTools.length > 0` 时，工具调用执行该分支。
        if (allowedTools.length > 0) {
          // Capture the current getAppState to chain modifications properly
          // previousGetAppState 状态读取`modifiedContext.getAppState` 整理出中间结果，供工具实现 Skill Tool后续步骤使用。
          const previousGetAppState = modifiedContext.getAppState
          // modifiedContext更新为 `{`，确保工具调用后续读取最新状态。
          modifiedContext = {
            ...modifiedContext,
            // getAppState不依赖额外参数，直接计算工具调用需要的结果。
            getAppState() {
              // Use the previous getAppState, not the closure's context.getAppState,
              // to properly chain context modifications
              // appState 状态保存`previousGetAppState`，供工具调用后续处理使用。
              const appState = previousGetAppState()
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                ...appState,
                toolPermissionContext: {
                  ...appState.toolPermissionContext,
                  alwaysAllowRules: {
                    ...appState.toolPermissionContext.alwaysAllowRules,
                    command: [
                      ...new Set([
                        ...(appState.toolPermissionContext.alwaysAllowRules
                          .command || []),
                        ...allowedTools,
                      ]),
                    ],
                  },
                },
              }
            },
          }
        }

        // Carry [1m] suffix over — otherwise a skill with `model: opus` on an
        // opus[1m] session drops the effective window to 200K and trips autocompact.
        // 满足 `model` 时，工具调用执行该分支。
        if (model) {
          // modifiedContext更新为 `{`，确保工具调用后续读取最新状态。
          modifiedContext = {
            ...modifiedContext,
            options: {
              ...modifiedContext.options,
              mainLoopModel: resolveSkillModelOverride(
                model,
                ctx.options.mainLoopModel,
              ),
            },
          }
        }

        // Override effort level if skill specifies one
        // `effort` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (effort !== undefined) {
          // previousGetAppState 状态读取`modifiedContext.getAppState` 整理出中间结果，供工具实现 Skill Tool后续步骤使用。
          const previousGetAppState = modifiedContext.getAppState
          // modifiedContext更新为 `{`，确保工具调用后续读取最新状态。
          modifiedContext = {
            ...modifiedContext,
            // getAppState不依赖额外参数，直接计算工具调用需要的结果。
            getAppState() {
              // appState 状态保存`previousGetAppState`，供工具调用后续处理使用。
              const appState = previousGetAppState()
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                ...appState,
                effortValue: effort,
              }
            },
          }
        }

        // 返回 `modifiedContext`，作为工具调用这次计算的结果。
        return modifiedContext
      },
    }
  },

  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam(
    result: Output,
    toolUseID: string,
  ): ToolResultBlockParam {
    // Handle forked skill result
    // 当 `'status' in result && result.status` 匹配 `'forked'` 时，工具调用执行对应分支。
    if ('status' in result && result.status === 'forked') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'tool_result' as const,
        tool_use_id: toolUseID,
        content: `Skill "${result.commandName}" completed (forked execution).\n\nResult:\n${result.result}`,
      }
    }

    // Inline skill result (default)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseID,
      content: `Launching skill: ${result.commandName}`,
    }
  },

  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolUseRejectedMessage,
  renderToolUseErrorMessage,
} satisfies ToolDef<InputSchema, Output, Progress>)

// Allowlist of PromptCommand property keys that are safe and don't require permission.
// If a skill has any property NOT in this set with a meaningful value, it requires
// permission. This ensures new properties added to PromptCommand in the future
// default to requiring permission until explicitly reviewed and added here.
// SAFE_SKILL_PROPERTIES 集合保存`Set`，供工具调用后续处理使用。
const SAFE_SKILL_PROPERTIES = new Set([
  // PromptCommand properties
  'type',
  'progressMessage',
  'contentLength',
  'argNames',
  'model',
  'effort',
  'source',
  'pluginInfo',
  'disableNonInteractive',
  'skillRoot',
  'context',
  'agent',
  'getPromptForCommand',
  'frontmatterKeys',
  // CommandBase properties
  'name',
  'description',
  'hasUserSpecifiedDescription',
  'isEnabled',
  'isHidden',
  'aliases',
  'isMcp',
  'argumentHint',
  'whenToUse',
  'paths',
  'version',
  'disableModelInvocation',
  'userInvocable',
  'loadedFrom',
  'immediate',
  'userFacingName',
])

// skillHasOnlySafeProperties 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function skillHasOnlySafeProperties(command: Command): boolean {
  // 逐项读取 `Object.keys(command)` 中的key，按输入顺序推进工具调用。
  for (const key of Object.keys(command)) {
    // 满足 `SAFE_SKILL_PROPERTIES.has(key)` 时，工具调用执行该分支。
    if (SAFE_SKILL_PROPERTIES.has(key)) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // Property not in safe allowlist - check if it has a meaningful value
    // 取值保存`(command as Record<string, unknown>)[key]`，供工具实现 Skill Tool后续判断或输出使用。
    const value = (command as Record<string, unknown>)[key]
    // 只有 `value === undefined || value === null` 满足时，工具调用才执行该分支。
    if (value === undefined || value === null) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // Array.isArray(value) && value为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (Array.isArray(value) && value.length === 0) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 工具调用在这里按实际状态进入对应分支。
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// isOfficialMarketplaceSkill 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOfficialMarketplaceSkill(command: PromptCommand): boolean {
  // `command.source` 与 `'plugin' || !command.pluginInf` 不一致时刷新派生状态，避免使用过期结果。
  if (command.source !== 'plugin' || !command.pluginInfo?.repository) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `isOfficialMarketplaceName(`，作为工具调用这次计算的结果。
  return isOfficialMarketplaceName(
    parsePluginIdentifier(command.pluginInfo.repository).marketplace,
  )
}

/**
 * Extract URL scheme for telemetry. Defaults to 'gs' for unrecognized schemes
 * since the AKI backend is the only production path and the loader throws on
 * unknown schemes before we reach telemetry anyway.
 */
// extractUrlScheme 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractUrlScheme(url: string): 'gs' | 'http' | 'https' | 's3' {
  // 满足 `url.startsWith('gs://')` 时，工具调用执行该分支。
  if (url.startsWith('gs://')) return 'gs'
  // 满足 `url.startsWith('https://')` 时，工具调用执行该分支。
  if (url.startsWith('https://')) return 'https'
  // 满足 `url.startsWith('http://')` 时，工具调用执行该分支。
  if (url.startsWith('http://')) return 'http'
  // 满足 `url.startsWith('s3://')` 时，工具调用执行该分支。
  if (url.startsWith('s3://')) return 's3'
  // 返回 `'gs'`，作为工具调用这次计算的结果。
  return 'gs'
}

/**
 * Load a remote canonical skill and inject its SKILL.md content into the
 * conversation. Unlike local skills (which go through processPromptSlashCommand
 * for !command / $ARGUMENTS expansion), remote skills are declarative markdown
 * — we wrap the content directly in a user message.
 *
 * The skill is also registered with addInvokedSkill so it survives compaction
 * (same as local skills).
 *
 * Only called from within a feature('EXPERIMENTAL_SKILL_SEARCH') guard in
 * call() — remoteSkillModules is non-null here.
 */
// executeRemoteSkill 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executeRemoteSkill(
  slug: string,
  commandName: string,
  parentMessage: AssistantMessage,
  context: ToolUseContext,
): Promise<ToolResult<Output>> {
  // 工具实现 Skill Tool先整理这一处局部数据，后续分支可以直接读取。
  const { getDiscoveredRemoteSkill, loadRemoteSkill, logRemoteSkillLoaded } =
    remoteSkillModules!

  // validateInput already confirmed this slug is in session state, but we
  // re-fetch here to get the URL. If it's somehow gone (e.g., state cleared
  // mid-session), fail with a clear error rather than crashing.
  // meta读取`getDiscoveredRemoteSkill`，供工具调用后续处理使用。
  const meta = getDiscoveredRemoteSkill(slug)
  // meta缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!meta) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Remote skill ${slug} was not discovered in this session. Use DiscoverSkills to find remote skills first.`,
    )
  }

  // urlScheme保存`extractUrlScheme`，供工具调用后续处理使用。
  const urlScheme = extractUrlScheme(meta.url)
  // loadResult 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let loadResult
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // loadResult更新为 `await loadRemoteSkill(slug, meta.url)`，确保工具调用后续读取最新状态。
    loadResult = await loadRemoteSkill(slug, meta.url)
  } catch (e) {
    // 消息保存`errorMessage`，供工具调用后续处理使用。
    const msg = errorMessage(e)
    // 调用 logRemoteSkillLoaded，触发工具调用此处需要的副作用。
    logRemoteSkillLoaded({
      slug,
      cacheHit: false,
      latencyMs: 0,
      urlScheme,
      error: msg,
    })
    // 抛出 new Error(`Failed to load remote skill ${slug}: ${msg}`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`Failed to load remote skill ${slug}: ${msg}`)
  }

  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    cacheHit,
    latencyMs,
    skillPath,
    content,
    fileCount,
    totalBytes,
    fetchMethod,
  } = loadResult

  // 调用 logRemoteSkillLoaded，触发工具调用此处需要的副作用。
  logRemoteSkillLoaded({
    slug,
    cacheHit,
    latencyMs,
    urlScheme,
    fileCount,
    totalBytes,
    fetchMethod,
  })

  // Remote skills are always model-discovered (never in static skill_listing),
  // so was_discovered is always true. is_remote lets BQ queries separate
  // remote from local invocations without joining on skill name prefixes.
  // queryDepth保存`context.queryTracking?.depth ?? 0`，供工具实现 Skill Tool后续判断或输出使用。
  const queryDepth = context.queryTracking?.depth ?? 0
  // parentAgentId读取`getAgentContext`，供工具调用后续处理使用。
  const parentAgentId = getAgentContext()?.agentId
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_skill_tool_invocation', {
    command_name:
      'remote_skill' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    // _PROTO_skill_name routes to the privileged skill_name BQ column
    // (unredacted, all users); command_name stays in additional_metadata as
    // the redacted variant.
    _PROTO_skill_name:
      commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    execution_context:
      'remote' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    invocation_trigger: (queryDepth > 0
      ? 'nested-skill'
      : 'claude-proactive') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    query_depth: queryDepth,
    ...(parentAgentId && {
      parent_agent_id:
        parentAgentId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    was_discovered: true,
    is_remote: true,
    remote_cache_hit: cacheHit,
    remote_load_latency_ms: latencyMs,
    ...(process.env.USER_TYPE === 'ant' && {
      skill_name:
        commandName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      remote_slug:
        slug as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
  })

  // 调用 recordSkillUsage，触发工具调用此处需要的副作用。
  recordSkillUsage(commandName)

  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `SkillTool loaded remote skill ${slug} (cacheHit=${cacheHit}, ${latencyMs}ms, ${content.length} chars)`,
  )

  // Strip YAML frontmatter (---\nname: x\n---) before prepending the header
  // (matches loadSkillsDir.ts:333). parseFrontmatter returns the original
  // content unchanged if no frontmatter is present.
  // 从 `parseFrontmatter(content, skillPath)` 解构 content，减少工具实现 Skill Tool对同一对象的重复访问。
  const { content: bodyContent } = parseFrontmatter(content, skillPath)

  // Inject base directory header + ${CLAUDE_SKILL_DIR}/${CLAUDE_SESSION_ID}
  // substitution (matches loadSkillsDir.ts) so the model can resolve relative
  // refs like ./schemas/foo.json against the cache dir.
  // skillDir保存`dirname`，供工具调用后续处理使用。
  const skillDir = dirname(skillPath)
  // normalizedDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const normalizedDir =
    process.platform === 'win32' ? skillDir.replace(/\\/g, '/') : skillDir
  // finalContent固定为 ``Base directory for this skill: ${normalizedDir}\n\n${bod...`，作为工具实现 Skill Tool后续展示或比较的基准。
  let finalContent = `Base directory for this skill: ${normalizedDir}\n\n${bodyContent}`
  // finalContent更新为 `finalContent.replace(/\$\{CLAUDE_SKILL_DIR\}/g, normalize...`，确保工具调用后续读取最新状态。
  finalContent = finalContent.replace(/\$\{CLAUDE_SKILL_DIR\}/g, normalizedDir)
  // finalContent更新为 `finalContent.replace(`，确保工具调用后续读取最新状态。
  finalContent = finalContent.replace(
    /\$\{CLAUDE_SESSION_ID\}/g,
    getSessionId(),
  )

  // Register with compaction-preservation state. Use the cached file path so
  // post-compact restoration knows where the content came from. Must use
  // finalContent (not raw content) so the base directory header and
  // ${CLAUDE_SKILL_DIR} substitutions survive compaction — matches how local
  // skills store their already-transformed content via processSlashCommand.
  // 调用 addInvokedSkill，触发工具调用此处需要的副作用。
  addInvokedSkill(
    commandName,
    skillPath,
    finalContent,
    getAgentContext()?.agentId ?? null,
  )

  // Direct injection — wrap SKILL.md content in a meta user message. Matches
  // the shape of what processPromptSlashCommand produces for simple skills.
  // toolUseID读取`getToolUseIDFromParentMessage`，供工具调用后续处理使用。
  const toolUseID = getToolUseIDFromParentMessage(
    parentMessage,
    SKILL_TOOL_NAME,
  )
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: { success: true, commandName, status: 'inline' },
    newMessages: tagMessagesWithToolUseID(
      [createUserMessage({ content: finalContent, isMeta: true })],
      toolUseID,
    ),
  }
}
