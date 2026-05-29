// 类型依赖 Anthropic 来自 @anthropic-ai/sdk，用于校准共享工具的数据契约。
import type Anthropic from '@anthropic-ai/sdk'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  BetaTool,
  BetaToolUnion,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 引入 SYSTEM_PROMPT_DYNAMIC_BOUNDARY，将 src/constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { SYSTEM_PROMPT_DYNAMIC_BOUNDARY } from 'src/constants/prompts.js'
// 引入 getSystemContext、getUserContext，将 src/context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from 'src/context.js'
// 接入 isAnalyticsDisabled 服务层能力，把外部通信或共享状态交给 src/services/analytics/config.js 处理。
import { isAnalyticsDisabled } from 'src/services/analytics/config.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from 'src/services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 prefetchAllMcpResources 服务层能力，把外部通信或共享状态交给 src/services/mcp/client.js 处理。
import { prefetchAllMcpResources } from 'src/services/mcp/client.js'
// 类型依赖 { ScopedMcpServerConfig } 来自 src/services/mcp/types.js，用于校准共享工具的数据契约。
import type { ScopedMcpServerConfig } from 'src/services/mcp/types.js'
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from 'src/tools/BashTool/BashTool.js'
// 接入 FileEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileEditTool } from 'src/tools/FileEditTool/FileEditTool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  normalizeFileEditInput,
  stripTrailingWhitespace,
} from 'src/tools/FileEditTool/utils.js'
// 接入 FileWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileWriteTool } from 'src/tools/FileWriteTool/FileWriteTool.js'
// 引入 getTools，将 src/tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from 'src/tools.js'
// 类型依赖 { AgentId } 来自 src/types/ids.js，用于校准共享工具的数据契约。
import type { AgentId } from 'src/types/ids.js'
// 类型依赖 { z } 来自 zod/v4，用于校准共享工具的数据契约。
import type { z } from 'zod/v4'
// 引入 CLI_SYSPROMPT_PREFIXES，将 ../constants/system.js 中已经封装好的能力接到本文件流程里。
import { CLI_SYSPROMPT_PREFIXES } from '../constants/system.js'
// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../services/tokenEstimation.js'
// 类型依赖 { Tool, ToolPermissionContext, Tools } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tool, ToolPermissionContext, Tools } from '../Tool.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../tools/AgentTool/constants.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 接入 EXIT_PLAN_MODE_V2_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../tools/ExitPlanModeTool/constants.js'
// 接入 TASK_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_OUTPUT_TOOL_NAME } from '../tools/TaskOutputTool/constants.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 isAgentSwarmsEnabled，将 ./agentSwarmsEnabled.js 中已经封装好的能力接到本文件流程里。
import { isAgentSwarmsEnabled } from './agentSwarmsEnabled.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  modelSupportsStructuredOutputs,
  shouldUseGlobalCacheScope,
} from './betas.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 createUserMessage，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { createUserMessage } from './messages.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from './model/providers.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getFileReadIgnorePatterns,
  normalizePatternsToPath,
} from './permissions/filesystem.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getPlan,
  getPlanFilePath,
  persistFileSnapshotIfRemote,
} from './plans.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 countFilesRoundedRg，将 ./ripgrep.js 中已经封装好的能力接到本文件流程里。
import { countFilesRoundedRg } from './ripgrep.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'
// 类型依赖 { SystemPrompt } 来自 ./systemPromptType.js，用于校准共享工具的数据契约。
import type { SystemPrompt } from './systemPromptType.js'
// 引入 getToolSchemaCache，将 ./toolSchemaCache.js 中已经封装好的能力接到本文件流程里。
import { getToolSchemaCache } from './toolSchemaCache.js'
// 引入 windowsPathToPosixPath，将 ./windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { windowsPathToPosixPath } from './windowsPaths.js'
// 引入 zodToJsonSchema，将 ./zodToJsonSchema.js 中已经封装好的能力接到本文件流程里。
import { zodToJsonSchema } from './zodToJsonSchema.js'

// Extended BetaTool type with strict mode and defer_loading support
// BetaToolWithExtras 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BetaToolWithExtras = BetaTool & {
  strict?: boolean
  defer_loading?: boolean
  cache_control?: {
    type: 'ephemeral'
    scope?: 'global' | 'org'
    ttl?: '5m' | '1h'
  }
  eager_input_streaming?: boolean
}

// CacheScope 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CacheScope = 'global' | 'org'
// SystemPromptBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SystemPromptBlock = {
  text: string
  cacheScope: CacheScope | null
}

// Fields to filter from tool schemas when swarms are not enabled
// SWARM_FIELDS_BY_TOOL 集中保存共享工具 api要一起传递的字段。
const SWARM_FIELDS_BY_TOOL: Record<string, string[]> = {
  [EXIT_PLAN_MODE_V2_TOOL_NAME]: ['launchSwarm', 'teammateCount'],
  [AGENT_TOOL_NAME]: ['name', 'team_name', 'mode'],
}

/**
 * Filter swarm-related fields from a tool's input schema.
 * Called at runtime when isAgentSwarmsEnabled() returns false.
 */
// filterSwarmFieldsFromSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterSwarmFieldsFromSchema(
  toolName: string,
  schema: Anthropic.Tool.InputSchema,
): Anthropic.Tool.InputSchema {
  // fieldsToRemove读取 `SWARM_FIELDS_BY_TOOL[toolName]` 对应条目，后续围绕该成员继续处理。
  const fieldsToRemove = SWARM_FIELDS_BY_TOOL[toolName]
  // !fieldsToRemove || fieldsToRemo...为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!fieldsToRemove || fieldsToRemove.length === 0) {
    // 返回 `schema`，作为共享工具这次计算的结果。
    return schema
  }

  // Clone the schema to avoid mutating the original
  // filtered集中保存共享工具 api要一起传递的字段。
  const filtered = { ...schema }
  // 组件属性筛选`filtered.properties` 整理出中间结果，供共享工具 api后续步骤使用。
  const props = filtered.properties
  // 当 `props && typeof props` 匹配 `'object'` 时，共享工具执行对应分支。
  if (props && typeof props === 'object') {
    // filteredProps 集合集中保存共享工具 api要一起传递的字段。
    const filteredProps = { ...(props as Record<string, unknown>) }
    // 按顺序遍历 `fieldsToRemove` 中的field，逐个交给共享工具处理。
    for (const field of fieldsToRemove) {
      // 共享工具 api在这里处理 `delete filteredProps[field]`，完成这一小步状态转换。
      delete filteredProps[field]
    }
    // properties 集合更新为 `filteredProps`，确保共享工具后续读取最新状态。
    filtered.properties = filteredProps
  }

  // 返回 `filtered`，作为共享工具这次计算的结果。
  return filtered
}

// toolToAPISchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function toolToAPISchema(
  tool: Tool,
  options: {
    // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>，负责共享工具在该局部场景下的响应。
    getToolPermissionContext: () => Promise<ToolPermissionContext>
    tools: Tools
    agents: AgentDefinition[]
    allowedAgentTypes?: string[]
    model?: string
    /** When true, mark this tool with defer_loading for tool search */
    deferLoading?: boolean
    cacheControl?: {
      type: 'ephemeral'
      scope?: 'global' | 'org'
      ttl?: '5m' | '1h'
    }
  },
): Promise<BetaToolUnion> {
  // Session-stable base schema: name, description, input_schema, strict,
  // eager_input_streaming. These are computed once per session and cached to
  // prevent mid-session GrowthBook flips (tengu_tool_pear, tengu_fgts) or
  // tool.prompt() drift from churning the serialized tool array bytes.
  // See toolSchemaCache.ts for rationale.
  //
  // Cache key includes inputJSONSchema when present. StructuredOutput instances
  // share the name 'StructuredOutput' but carry different schemas per workflow
  // call — name-only keying returned a stale schema (5.4% → 51% err rate, see
  // PR#25424). MCP tools also set inputJSONSchema but each has a stable schema,
  // so including it preserves their GB-flip cache stability.
  // cacheKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cacheKey =
    'inputJSONSchema' in tool && tool.inputJSONSchema
      ? `${tool.name}:${jsonStringify(tool.inputJSONSchema)}`
      : tool.name
  // cache 缓存读取`getToolSchemaCache`，供共享工具后续处理使用。
  const cache = getToolSchemaCache()
  // base读取`cache.get`，供共享工具后续处理使用。
  let base = cache.get(cacheKey)
  // base缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!base) {
    // strictToolsEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const strictToolsEnabled =
      checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_tool_pear')
    // Use tool's JSON schema directly if provided, otherwise convert Zod schema
    // input_schema保存`(`，供后续判断或组装使用。
    let input_schema = (
      'inputJSONSchema' in tool && tool.inputJSONSchema
        ? tool.inputJSONSchema
        : zodToJsonSchema(tool.inputSchema)
    ) as Anthropic.Tool.InputSchema

    // Filter out swarm-related fields when swarms are not enabled
    // This ensures external non-EAP users don't see swarm features in the schema
    // 满足 `!isAgentSwarmsEnabled()` 时，共享工具执行该分支。
    if (!isAgentSwarmsEnabled()) {
      // input_schema更新为 `filterSwarmFieldsFromSchema(tool.name, input_schema)`，确保共享工具后续读取最新状态。
      input_schema = filterSwarmFieldsFromSchema(tool.name, input_schema)
    }

    // base更新为 `{`，确保共享工具后续读取最新状态。
    base = {
      name: tool.name,
      description: await tool.prompt({
        getToolPermissionContext: options.getToolPermissionContext,
        tools: options.tools,
        agents: options.agents,
        allowedAgentTypes: options.allowedAgentTypes,
      }),
      input_schema,
    }

    // Only add strict if:
    // 1. Feature flag is enabled
    // 2. Tool has strict: true
    // 3. Model is provided and supports it (not all models support it right now)
    //    (if model is not provided, assume we can't use strict tools)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      strictToolsEnabled &&
      tool.strict === true &&
      options.model &&
      modelSupportsStructuredOutputs(options.model)
    ) {
      // strict更新为 `true`，确保共享工具后续读取最新状态。
      base.strict = true
    }

    // Enable fine-grained tool streaming via per-tool API field.
    // Without FGTS, the API buffers entire tool input parameters before sending
    // input_json_delta events, causing multi-minute hangs on large tool inputs.
    // Gated to direct api.anthropic.com: proxies (LiteLLM etc.) and Bedrock/Vertex
    // with Claude 4.5 reject this field with 400. See GH#32742, PR #21729.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      getAPIProvider() === 'firstParty' &&
      isFirstPartyAnthropicBaseUrl() &&
      (getFeatureValue_CACHED_MAY_BE_STALE('tengu_fgts', false) ||
        isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING))
    ) {
      // eager_input_streaming更新为 `true`，确保共享工具后续读取最新状态。
      base.eager_input_streaming = true
    }

    // cache.set 写入新的状态值，使共享工具后续读取保持一致。
    cache.set(cacheKey, base)
  }

  // Per-request overlay: defer_loading and cache_control vary by call
  // (tool search defers different tools per turn; cache markers move).
  // Explicit field copy avoids mutating the cached base and sidesteps
  // BetaTool.cache_control's `| null` clashing with our narrower type.
  // schema 集中保存共享工具 api要一起传递的字段。
  const schema: BetaToolWithExtras = {
    name: base.name,
    description: base.description,
    input_schema: base.input_schema,
    ...(base.strict && { strict: true }),
    ...(base.eager_input_streaming && { eager_input_streaming: true }),
  }

  // Add defer_loading if requested (for tool search feature)
  // 满足 `options.deferLoading` 时，共享工具执行该分支。
  if (options.deferLoading) {
    // defer_loading更新为 `true`，确保共享工具后续读取最新状态。
    schema.defer_loading = true
  }

  // 满足 `options.cacheControl` 时，共享工具执行该分支。
  if (options.cacheControl) {
    // cache_control 缓存更新为 `options.cacheControl`，确保共享工具后续读取最新状态。
    schema.cache_control = options.cacheControl
  }

  // CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS is the kill switch for beta API
  // shapes. Proxy gateways (ANTHROPIC_BASE_URL → LiteLLM → Bedrock) reject
  // fields like defer_loading with "Extra inputs are not permitted". The gates
  // above each field are scattered and not all provider-aware, so this strips
  // everything not in the base-tool allowlist at the one choke point all tool
  // schemas pass through — including fields added in the future.
  // cache_control is allowlisted: the base {type: 'ephemeral'} shape is
  // standard prompt caching (Bedrock/Vertex supported); the beta sub-fields
  // (scope, ttl) are already gated upstream by shouldIncludeFirstPartyOnlyBetas
  // which independently respects this kill switch.
  // github.com/anthropics/claude-code/issues/20031
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)) {
    // allowed保存`Set`，供共享工具后续处理使用。
    const allowed = new Set([
      'name',
      'description',
      'input_schema',
      'cache_control',
    ])
    // stripped派生`Object.keys`，供共享工具后续处理使用。
    const stripped = Object.keys(schema).filter(k => !allowed.has(k))
    // 满足 `stripped.length > 0` 时，共享工具执行该分支。
    if (stripped.length > 0) {
      // 调用 logStripOnce，触发共享工具此处需要的副作用。
      logStripOnce(stripped)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        name: schema.name,
        description: schema.description,
        input_schema: schema.input_schema,
        ...(schema.cache_control && { cache_control: schema.cache_control }),
      }
    }
  }

  // Note: We cast to BetaTool but the extra fields are still present at runtime
  // and will be serialized in the API request, even though they're not in the SDK's
  // BetaTool type definition. This is intentional for beta features.
  // 返回 `schema as BetaTool`，作为共享工具这次计算的结果。
  return schema as BetaTool
}

// loggedStrip标记共享工具 api是否启用对应路径。
let loggedStrip = false
// logStripOnce 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logStripOnce(stripped: string[]): void {
  // 满足 `loggedStrip` 时，共享工具执行该分支。
  if (loggedStrip) return
  // loggedStrip更新为 `true`，确保共享工具后续读取最新状态。
  loggedStrip = true
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[betas] Stripped from tool schemas: [${stripped.join(', ')}] (CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1)`,
  )
}

/**
 * Log stats about first block for analyzing prefix matching config
 * (see https://console.statsig.com/4aF3Ewatb6xPVpCwxb5nA3/dynamic_configs/claude_cli_system_prompt_prefixes)
 */
// logAPIPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logAPIPrefix(systemPrompt: SystemPrompt): void {
  // 从 `splitSysPromptPrefix(systemPrompt)` 按位置拆出 firstSyspromptBlock，让共享工具 api分别处理这些返回值。
  const [firstSyspromptBlock] = splitSysPromptPrefix(systemPrompt)
  // firstSystemPrompt 命名 `firstSyspromptBlock?.text`，让后续代码直接表达这个值的用途。
  const firstSystemPrompt = firstSyspromptBlock?.text
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_sysprompt_block', {
    snippet: firstSystemPrompt?.slice(
      0,
      20,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    length: firstSystemPrompt?.length ?? 0,
    hash: (firstSystemPrompt
      ? createHash('sha256').update(firstSystemPrompt).digest('hex')
      : '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

/**
 * Split system prompt blocks by content type for API matching and cache control.
 * See https://console.statsig.com/4aF3Ewatb6xPVpCwxb5nA3/dynamic_configs/claude_cli_system_prompt_prefixes
 *
 * Behavior depends on feature flags and options:
 *
 * 1. MCP tools present (skipGlobalCacheForSystemPrompt=true):
 *    Returns up to 3 blocks with org-level caching (no global cache on system prompt):
 *    - Attribution header (cacheScope=null)
 *    - System prompt prefix (cacheScope='org')
 *    - Everything else concatenated (cacheScope='org')
 *
 * 2. Global cache mode with boundary marker (1P only, boundary found):
 *    Returns up to 4 blocks:
 *    - Attribution header (cacheScope=null)
 *    - System prompt prefix (cacheScope=null)
 *    - Static content before boundary (cacheScope='global')
 *    - Dynamic content after boundary (cacheScope=null)
 *
 * 3. Default mode (3P providers, or boundary missing):
 *    Returns up to 3 blocks with org-level caching:
 *    - Attribution header (cacheScope=null)
 *    - System prompt prefix (cacheScope='org')
 *    - Everything else concatenated (cacheScope='org')
 */
// splitSysPromptPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function splitSysPromptPrefix(
  systemPrompt: SystemPrompt,
  options?: { skipGlobalCacheForSystemPrompt?: boolean },
): SystemPromptBlock[] {
  // useGlobalCacheFeature 缓存保存`shouldUseGlobalCacheScope`，供共享工具后续处理使用。
  const useGlobalCacheFeature = shouldUseGlobalCacheScope()
  // 只有 `useGlobalCacheFeature && options?.skipGlobalCache` 满足时，共享工具才执行该分支。
  if (useGlobalCacheFeature && options?.skipGlobalCacheForSystemPrompt) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_sysprompt_using_tool_based_cache', {
      promptBlockCount: systemPrompt.length,
    })

    // Filter out boundary marker, return blocks without global scope
    // attributionHeader 先占位，稍后的条件分支会根据实际输入补齐它。
    let attributionHeader: string | undefined
    // systemPromptPrefix 先占位，稍后的条件分支会根据实际输入补齐它。
    let systemPromptPrefix: string | undefined
    // rest 从空数组开始收集，后续循环会按处理顺序追加条目。
    const rest: string[] = []

    // 按顺序遍历 `systemPrompt` 中的提示词，逐个交给共享工具处理。
    for (const prompt of systemPrompt) {
      // 提示词缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!prompt) continue
      // 满足 `prompt === SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 时，共享工具执行该分支。
      if (prompt === SYSTEM_PROMPT_DYNAMIC_BOUNDARY) continue // Skip boundary
      // 满足 `prompt.startsWith('x-anthropic-billing-header')` 时，共享工具执行该分支。
      if (prompt.startsWith('x-anthropic-billing-header')) {
        // attributionHeader更新为 `prompt`，确保共享工具后续读取最新状态。
        attributionHeader = prompt
      // 共享工具 api在这里处理 `} else if (CLI_SYSPROMPT_PREFIXES.has(prompt)) {`，完成这一小步状态转换。
      } else if (CLI_SYSPROMPT_PREFIXES.has(prompt)) {
        // systemPromptPrefix更新为 `prompt`，确保共享工具后续读取最新状态。
        systemPromptPrefix = prompt
      } else {
        // rest追加新条目，保持收集顺序与输入顺序一致。
        rest.push(prompt)
      }
    }

    // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const result: SystemPromptBlock[] = []
    // 满足 `attributionHeader` 时，共享工具执行该分支。
    if (attributionHeader) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({ text: attributionHeader, cacheScope: null })
    }
    // 满足 `systemPromptPrefix` 时，共享工具执行该分支。
    if (systemPromptPrefix) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({ text: systemPromptPrefix, cacheScope: 'org' })
    }
    // restJoined格式化`rest.join`，供共享工具后续处理使用。
    const restJoined = rest.join('\n\n')
    // 满足 `restJoined` 时，共享工具执行该分支。
    if (restJoined) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({ text: restJoined, cacheScope: 'org' })
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 满足 `useGlobalCacheFeature` 时，共享工具执行该分支。
  if (useGlobalCacheFeature) {
    // boundaryIndex 索引筛选`systemPrompt.findIndex`，供共享工具后续处理使用。
    const boundaryIndex = systemPrompt.findIndex(
      // s 集合更新为 `> s === SYSTEM_PROMPT_DYNAMIC_BOUNDARY`，确保共享工具后续读取最新状态。
      s => s === SYSTEM_PROMPT_DYNAMIC_BOUNDARY,
    )
    // `boundaryIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (boundaryIndex !== -1) {
      // attributionHeader 先占位，稍后的条件分支会根据实际输入补齐它。
      let attributionHeader: string | undefined
      // systemPromptPrefix 先占位，稍后的条件分支会根据实际输入补齐它。
      let systemPromptPrefix: string | undefined
      // staticBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const staticBlocks: string[] = []
      // dynamicBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const dynamicBlocks: string[] = []

      // 按索引扫描 `systemPrompt.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < systemPrompt.length; i++) {
        // block保存`systemPrompt[i]`，供共享工具 api后续判断或输出使用。
        const block = systemPrompt[i]
        // 只有 `!block || block === SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 满足时，共享工具才执行该分支。
        if (!block || block === SYSTEM_PROMPT_DYNAMIC_BOUNDARY) continue

        // 满足 `block.startsWith('x-anthropic-billing-header')` 时，共享工具执行该分支。
        if (block.startsWith('x-anthropic-billing-header')) {
          // attributionHeader更新为 `block`，确保共享工具后续读取最新状态。
          attributionHeader = block
        // 共享工具 api在这里处理 `} else if (CLI_SYSPROMPT_PREFIXES.has(block)) {`，完成这一小步状态转换。
        } else if (CLI_SYSPROMPT_PREFIXES.has(block)) {
          // systemPromptPrefix更新为 `block`，确保共享工具后续读取最新状态。
          systemPromptPrefix = block
        // 共享工具 api在这里处理 `} else if (i < boundaryIndex) {`，完成这一小步状态转换。
        } else if (i < boundaryIndex) {
          // staticBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
          staticBlocks.push(block)
        } else {
          // dynamicBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
          dynamicBlocks.push(block)
        }
      }

      // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
      const result: SystemPromptBlock[] = []
      // 满足 `attributionHeader` 时，共享工具执行该分支。
      if (attributionHeader)
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ text: attributionHeader, cacheScope: null })
      // 满足 `systemPromptPrefix` 时，共享工具执行该分支。
      if (systemPromptPrefix)
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ text: systemPromptPrefix, cacheScope: null })
      // staticJoined格式化`staticBlocks.join`，供共享工具后续处理使用。
      const staticJoined = staticBlocks.join('\n\n')
      // 满足 `staticJoined` 时，共享工具执行该分支。
      if (staticJoined)
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ text: staticJoined, cacheScope: 'global' })
      // dynamicJoined格式化`dynamicBlocks.join`，供共享工具后续处理使用。
      const dynamicJoined = dynamicBlocks.join('\n\n')
      // 满足 `dynamicJoined) result.push({ text: dynamicJoined, cacheScope: null }` 时，共享工具执行该分支。
      if (dynamicJoined) result.push({ text: dynamicJoined, cacheScope: null })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_sysprompt_boundary_found', {
        blockCount: result.length,
        staticBlockLength: staticJoined.length,
        dynamicBlockLength: dynamicJoined.length,
      })

      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_sysprompt_missing_boundary_marker', {
        promptBlockCount: systemPrompt.length,
      })
    }
  }
  // attributionHeader 先占位，稍后的条件分支会根据实际输入补齐它。
  let attributionHeader: string | undefined
  // systemPromptPrefix 先占位，稍后的条件分支会根据实际输入补齐它。
  let systemPromptPrefix: string | undefined
  // rest 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rest: string[] = []

  // 按顺序遍历 `systemPrompt` 中的block，逐个交给共享工具处理。
  for (const block of systemPrompt) {
    // block缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!block) continue

    // 满足 `block.startsWith('x-anthropic-billing-header')` 时，共享工具执行该分支。
    if (block.startsWith('x-anthropic-billing-header')) {
      // attributionHeader更新为 `block`，确保共享工具后续读取最新状态。
      attributionHeader = block
    // 共享工具 api在这里处理 `} else if (CLI_SYSPROMPT_PREFIXES.has(block)) {`，完成这一小步状态转换。
    } else if (CLI_SYSPROMPT_PREFIXES.has(block)) {
      // systemPromptPrefix更新为 `block`，确保共享工具后续读取最新状态。
      systemPromptPrefix = block
    } else {
      // rest追加新条目，保持收集顺序与输入顺序一致。
      rest.push(block)
    }
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: SystemPromptBlock[] = []
  // 满足 `attributionHeader` 时，共享工具执行该分支。
  if (attributionHeader)
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push({ text: attributionHeader, cacheScope: null })
  // 满足 `systemPromptPrefix` 时，共享工具执行该分支。
  if (systemPromptPrefix)
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push({ text: systemPromptPrefix, cacheScope: 'org' })
  // restJoined格式化`rest.join`，供共享工具后续处理使用。
  const restJoined = rest.join('\n\n')
  // 满足 `restJoined) result.push({ text: restJoined, cacheScope: 'org' }` 时，共享工具执行该分支。
  if (restJoined) result.push({ text: restJoined, cacheScope: 'org' })
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// appendSystemContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function appendSystemContext(
  systemPrompt: SystemPrompt,
  context: { [k: string]: string },
): string[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    ...systemPrompt,
    Object.entries(context)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'),
  ].filter(Boolean)
}

// prependUserContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prependUserContext(
  messages: Message[],
  context: { [k: string]: string },
): Message[] {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回 `messages`，作为共享工具这次计算的结果。
    return messages
  }

  // Object.entries(context)为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (Object.entries(context).length === 0) {
    // 返回 `messages`，作为共享工具这次计算的结果。
    return messages
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    createUserMessage({
      content: `<system-reminder>\nAs you answer the user's questions, you can use the following context:\n${Object.entries(
        context,
      )
        .map(([key, value]) => `# ${key}\n${value}`)
        .join('\n')}

      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.\n</system-reminder>\n`,
      isMeta: true,
    }),
    ...messages,
  ]
}

/**
 * Log metrics about context and system prompt size
 */
// logContextMetrics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logContextMetrics(
  mcpConfigs: Record<string, ScopedMcpServerConfig>,
  toolPermissionContext: ToolPermissionContext,
): Promise<void> {
  // Early return if logging is disabled
  // 满足 `isAnalyticsDisabled()` 时，共享工具执行该分支。
  if (isAnalyticsDisabled()) {
    // 共享工具 api在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 共享工具 api先整理这一处局部数据，后续分支可以直接读取。
  const [{ tools: mcpTools }, tools, userContext, systemContext] =
    await Promise.all([
      prefetchAllMcpResources(mcpConfigs),
      getTools(toolPermissionContext),
      getUserContext(),
      getSystemContext(),
    ])
  // Extract individual context sizes and calculate total
  // gitStatusSize保存 `systemContext.gitStatus?.length ?? 0` 的判断结果，供共享工具 api后续分支直接复用。
  const gitStatusSize = systemContext.gitStatus?.length ?? 0
  // claudeMdSize保存 `userContext.claudeMd?.length ?? 0` 的判断结果，供共享工具 api后续分支直接复用。
  const claudeMdSize = userContext.claudeMd?.length ?? 0

  // Calculate total context size
  // totalContextSize 命名 `gitStatusSize + claudeMdSize`，让后续代码直接表达这个值的用途。
  const totalContextSize = gitStatusSize + claudeMdSize

  // Get file count using ripgrep (rounded to nearest power of 10 for privacy)
  // currentDir读取`getCwd`，供共享工具后续处理使用。
  const currentDir = getCwd()
  // ignorePatternsByRoot读取`getFileReadIgnorePatterns`，供共享工具后续处理使用。
  const ignorePatternsByRoot = getFileReadIgnorePatterns(toolPermissionContext)
  // normalizedIgnorePatterns 集合保存`normalizePatternsToPath`，供共享工具后续处理使用。
  const normalizedIgnorePatterns = normalizePatternsToPath(
    ignorePatternsByRoot,
    currentDir,
  )
  // fileCount 文件数据统计`countFilesRoundedRg`，供共享工具后续处理使用。
  const fileCount = await countFilesRoundedRg(
    currentDir,
    AbortSignal.timeout(1000),
    normalizedIgnorePatterns,
  )

  // Calculate tool metrics
  // mcpToolsCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let mcpToolsCount = 0
  // mcpServersCount 数量保存`0`，供后续判断或组装使用。
  let mcpServersCount = 0
  // mcpToolsTokens 集合保存`0`，供共享工具 api后续判断或输出使用。
  let mcpToolsTokens = 0
  // nonMcpToolsCount 数量保存`0`，供后续判断或组装使用。
  let nonMcpToolsCount = 0
  // nonMcpToolsTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let nonMcpToolsTokens = 0

  // nonMcpTools 集合筛选`tools.filter`，供共享工具后续处理使用。
  const nonMcpTools = tools.filter(tool => !tool.isMcp)
  // mcpToolsCount 数量更新为 `mcpTools.length`，确保共享工具后续读取最新状态。
  mcpToolsCount = mcpTools.length
  // nonMcpToolsCount 数量更新为 `nonMcpTools.length`，确保共享工具后续读取最新状态。
  nonMcpToolsCount = nonMcpTools.length

  // Extract unique server names from MCP tool names (format: mcp__servername__toolname)
  // serverNames 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const serverNames = new Set<string>()
  // 按顺序遍历 `mcpTools` 中的工具，逐个交给共享工具处理。
  for (const tool of mcpTools) {
    // 片段列表格式化`name.split`，供共享工具后续处理使用。
    const parts = tool.name.split('__')
    // 只有 `parts.length >= 3 && parts[1]` 满足时，共享工具才执行该分支。
    if (parts.length >= 3 && parts[1]) {
      // 调用 serverNames.add，触发共享工具此处需要的副作用。
      serverNames.add(parts[1])
    }
  }
  // mcpServersCount 数量更新为 `serverNames.size`，确保共享工具后续读取最新状态。
  mcpServersCount = serverNames.size

  // Estimate tool tokens locally for analytics (avoids N API calls per session)
  // Use inputJSONSchema (plain JSON Schema) when available, otherwise convert Zod schema
  // 按顺序遍历 `mcpTools` 中的工具，逐个交给共享工具处理。
  for (const tool of mcpTools) {
    // schema 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const schema =
      'inputJSONSchema' in tool && tool.inputJSONSchema
        ? tool.inputJSONSchema
        : zodToJsonSchema(tool.inputSchema)
    // 共享工具 api在这里处理 `mcpToolsTokens += roughTokenCountEstimation(jsonStringify(schema))`，完成这一小步状态转换。
    mcpToolsTokens += roughTokenCountEstimation(jsonStringify(schema))
  }
  // 按顺序遍历 `nonMcpTools` 中的工具，逐个交给共享工具处理。
  for (const tool of nonMcpTools) {
    // schema 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const schema =
      'inputJSONSchema' in tool && tool.inputJSONSchema
        ? tool.inputJSONSchema
        : zodToJsonSchema(tool.inputSchema)
    // 共享工具 api在这里处理 `nonMcpToolsTokens += roughTokenCountEstimation(jsonStringify(schema))`，完成这一小步状态转换。
    nonMcpToolsTokens += roughTokenCountEstimation(jsonStringify(schema))
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_context_size', {
    git_status_size: gitStatusSize,
    claude_md_size: claudeMdSize,
    total_context_size: totalContextSize,
    project_file_count_rounded: fileCount,
    mcp_tools_count: mcpToolsCount,
    mcp_servers_count: mcpServersCount,
    mcp_tools_tokens: mcpToolsTokens,
    non_mcp_tools_count: nonMcpToolsCount,
    non_mcp_tools_tokens: nonMcpToolsTokens,
  })
}

// TODO: Generalize this to all tools
// normalizeToolInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeToolInput<T extends Tool>(
  tool: T,
  input: z.infer<T['inputSchema']>,
  agentId?: AgentId,
): z.infer<T['inputSchema']> {
  // 按照 tool.name 的取值选择共享工具的具体处理分支。
  switch (tool.name) {
    case EXIT_PLAN_MODE_V2_TOOL_NAME: {
      // Always inject plan content and file path for ExitPlanModeV2 so hooks/SDK get the plan.
      // The V2 tool reads plan from file instead of input, but hooks/SDK
      // plan读取`getPlan`，供共享工具后续处理使用。
      const plan = getPlan(agentId)
      // planFilePath 路径数据读取`getPlanFilePath`，供共享工具后续处理使用。
      const planFilePath = getPlanFilePath(agentId)
      // Persist file snapshot for CCR sessions so the plan survives pod recycling
      // 显式忽略 `persistFileSnapshotIfRemote()` 的返回值，只保留它触发的副作用。
      void persistFileSnapshotIfRemote()
      // 返回 `plan !== null ? { ...input, plan, planFilePath } : input`，作为共享工具这次计算的结果。
      return plan !== null ? { ...input, plan, planFilePath } : input
    }
    case BashTool.name: {
      // Validated upstream, won't throw
      // 解析结果解析`inputSchema.parse`，供共享工具后续处理使用。
      const parsed = BashTool.inputSchema.parse(input)
      // 从 `parsed` 解构 command、timeout、description，减少共享工具 api对同一对象的重复访问。
      const { command, timeout, description } = parsed
      // cwd读取`getCwd`，供共享工具后续处理使用。
      const cwd = getCwd()
      // normalizedCommand 命令数据格式化`command.replace`，供共享工具后续处理使用。
      let normalizedCommand = command.replace(`cd ${cwd} && `, '')
      // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
      if (getPlatform() === 'windows') {
        // normalizedCommand 命令数据更新为 `normalizedCommand.replace(`，确保共享工具后续读取最新状态。
        normalizedCommand = normalizedCommand.replace(
          `cd ${windowsPathToPosixPath(cwd)} && `,
          '',
        )
      }

      // Replace \\; with \; (commonly needed for find -exec commands)
      // normalizedCommand 命令数据更新为 `normalizedCommand.replace(/\\\\;/g, '\\;')`，确保共享工具后续读取最新状态。
      normalizedCommand = normalizedCommand.replace(/\\\\;/g, '\\;')

      // Logging for commands that are only echoing a string. This is to help us understand how often  Claude talks via bash
      // 满足 `/^echo\s+["']?[^|&;><]*["']?$/i.test(normalizedCommand.trim())` 时，共享工具执行该分支。
      if (/^echo\s+["']?[^|&;><]*["']?$/i.test(normalizedCommand.trim())) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bash_tool_simple_echo', {})
      }

      // Check for run_in_background (may not exist in schema if CLAUDE_CODE_DISABLE_BACKGROUND_TASKS is set)
      // run_in_background 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const run_in_background =
        'run_in_background' in parsed ? parsed.run_in_background : undefined

      // SAFETY: Cast is safe because input was validated by .parse() above.
      // TypeScript can't narrow the generic T based on switch(tool.name), so it
      // doesn't know the return type matches T['inputSchema']. This is a fundamental
      // TS limitation with generics, not bypassable without major refactoring.
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        command: normalizedCommand,
        description,
        ...(timeout !== undefined && { timeout }),
        ...(description !== undefined && { description }),
        ...(run_in_background !== undefined && { run_in_background }),
        ...('dangerouslyDisableSandbox' in parsed &&
          parsed.dangerouslyDisableSandbox !== undefined && {
            dangerouslyDisableSandbox: parsed.dangerouslyDisableSandbox,
          }),
      } as z.infer<T['inputSchema']>
    }
    case FileEditTool.name: {
      // Validated upstream, won't throw
      // parsedInput解析`inputSchema.parse`，供共享工具后续处理使用。
      const parsedInput = FileEditTool.inputSchema.parse(input)

      // This is a workaround for tokens claude can't see
      // 从 `normalizeFileEditInput({` 解构 file_path、edits，减少共享工具 api对同一对象的重复访问。
      const { file_path, edits } = normalizeFileEditInput({
        file_path: parsedInput.file_path,
        edits: [
          {
            old_string: parsedInput.old_string,
            new_string: parsedInput.new_string,
            replace_all: parsedInput.replace_all,
          },
        ],
      })

      // SAFETY: See comment in BashTool case above
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        replace_all: edits[0]!.replace_all,
        file_path,
        old_string: edits[0]!.old_string,
        new_string: edits[0]!.new_string,
      } as z.infer<T['inputSchema']>
    }
    case FileWriteTool.name: {
      // Validated upstream, won't throw
      // parsedInput解析`inputSchema.parse`，供共享工具后续处理使用。
      const parsedInput = FileWriteTool.inputSchema.parse(input)

      // Markdown uses two trailing spaces as a hard line break — don't strip.
      // isMarkdown记录 `i.test` 是否成立，共享工具随后按该结果分支。
      const isMarkdown = /\.(md|mdx)$/i.test(parsedInput.file_path)

      // SAFETY: See comment in BashTool case above
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        file_path: parsedInput.file_path,
        content: isMarkdown
          ? parsedInput.content
          : stripTrailingWhitespace(parsedInput.content),
      } as z.infer<T['inputSchema']>
    }
    case TASK_OUTPUT_TOOL_NAME: {
      // Normalize legacy parameter names from AgentOutputTool/BashOutputTool
      // legacyInput保存`input as Record<string, unknown>`，供后续判断或组装使用。
      const legacyInput = input as Record<string, unknown>
      // taskId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const taskId =
        legacyInput.task_id ?? legacyInput.agentId ?? legacyInput.bash_id
      // timeout 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const timeout =
        legacyInput.timeout ??
        (typeof legacyInput.wait_up_to === 'number'
          ? legacyInput.wait_up_to * 1000
          : undefined)
      // SAFETY: See comment in BashTool case above
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        task_id: taskId ?? '',
        block: legacyInput.block ?? true,
        timeout: timeout ?? 30000,
      } as z.infer<T['inputSchema']>
    }
    default:
      // 返回 `input`，作为共享工具这次计算的结果。
      return input
  }
}

// Strips fields that were added by normalizeToolInput before sending to API
// (e.g., plan field from ExitPlanModeV2 which has an empty input schema)
// normalizeToolInputForAPI 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeToolInputForAPI<T extends Tool>(
  tool: T,
  input: z.infer<T['inputSchema']>,
): z.infer<T['inputSchema']> {
  // 按照 tool.name 的取值选择共享工具的具体处理分支。
  switch (tool.name) {
    case EXIT_PLAN_MODE_V2_TOOL_NAME: {
      // Strip injected fields before sending to API (schema expects empty object)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        input &&
        typeof input === 'object' &&
        ('plan' in input || 'planFilePath' in input)
      ) {
        // 从 `input as Record<string, unknown>` 解构 plan、planFilePath、其余 rest，减少共享工具 api对同一对象的重复访问。
        const { plan, planFilePath, ...rest } = input as Record<string, unknown>
        // 返回 `rest as z.infer<T['inputSchema']>`，作为共享工具这次计算的结果。
        return rest as z.infer<T['inputSchema']>
      }
      // 返回 `input`，作为共享工具这次计算的结果。
      return input
    }
    case FileEditTool.name: {
      // Strip synthetic old_string/new_string/replace_all from OLD sessions
      // that were resumed from transcripts written before PR #20357, where
      // normalizeToolInput used to synthesize these. Needed so old --resume'd
      // transcripts don't send whole-file copies to the API. New sessions
      // don't need this (synthesis moved to emission time).
      // 只有 `input && typeof input === 'object' && 'edits' in` 满足时，共享工具才执行该分支。
      if (input && typeof input === 'object' && 'edits' in input) {
        // 共享工具 api先整理这一处局部数据，后续分支可以直接读取。
        const { old_string, new_string, replace_all, ...rest } =
          input as Record<string, unknown>
        // 返回 `rest as z.infer<T['inputSchema']>`，作为共享工具这次计算的结果。
        return rest as z.infer<T['inputSchema']>
      }
      // 返回 `input`，作为共享工具这次计算的结果。
      return input
    }
    default:
      // 返回 `input`，作为共享工具这次计算的结果。
      return input
  }
}
