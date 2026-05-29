// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  BetaContentBlock,
  BetaWebSearchTool20250305,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 复用 getAPIProvider 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProvider } from 'src/utils/model/providers.js'
// 类型依赖 { PermissionResult } 来自 src/utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from 'src/utils/permissions/PermissionResult.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 queryModelWithStreaming 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryModelWithStreaming } from '../../services/api/claude.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage } from '../../utils/messages.js'
// 复用 getMainLoopModel、getSmallFastModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel, getSmallFastModel } from '../../utils/model/model.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'
// 引入 getWebSearchPrompt、WEB_SEARCH_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getWebSearchPrompt, WEB_SEARCH_TOOL_NAME } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    query: z.string().min(2).describe('The search query to use'),
    allowed_domains: z
      .array(z.string())
      .optional()
      .describe('Only include search results from these domains'),
    blocked_domains: z
      .array(z.string())
      .optional()
      .describe('Never include search results from these domains'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type Input = z.infer<InputSchema>

// searchResultSchema保存`lazySchema`，供工具调用后续处理使用。
const searchResultSchema = lazySchema(() => {
  // searchHitSchema保存`z.object`，供工具调用后续处理使用。
  const searchHitSchema = z.object({
    title: z.string().describe('The title of the search result'),
    url: z.string().describe('The URL of the search result'),
  })

  // 返回 `z.object({`，作为工具调用这次计算的结果。
  return z.object({
    tool_use_id: z.string().describe('ID of the tool use'),
    content: z.array(searchHitSchema).describe('Array of search hits'),
  })
})

// SearchResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SearchResult = z.infer<ReturnType<typeof searchResultSchema>>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    query: z.string().describe('The search query that was executed'),
    results: z
      .array(z.union([searchResultSchema(), z.string()]))
      .describe('Search results and/or text commentary from the model'),
    durationSeconds: z
      .number()
      .describe('Time taken to complete the search operation'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// Re-export WebSearchProgress from centralized types to break import cycles
// 导出类型定义，让其他模块沿用工具实现 Web Search Tool的数据契约。
export type { WebSearchProgress } from '../../types/tools.js'

// 类型依赖 { WebSearchProgress } 来自 ../../types/tools.js，用于校准工具调用的数据契约。
import type { WebSearchProgress } from '../../types/tools.js'

// makeToolSchema 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeToolSchema(input: Input): BetaWebSearchTool20250305 {
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    type: 'web_search_20250305',
    name: 'web_search',
    allowed_domains: input.allowed_domains,
    blocked_domains: input.blocked_domains,
    max_uses: 8, // Hardcoded to 8 searches maximum
  }
}

// makeOutputFromSearchResponse 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeOutputFromSearchResponse(
  result: BetaContentBlock[],
  query: string,
  durationSeconds: number,
): Output {
  // The result is a sequence of these blocks:
  // - text to start -- always?
  // [
  //    - server_tool_use
  //    - web_search_tool_result
  //    - text and citation blocks intermingled
  //  ]+  (this block repeated for each search)

  // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const results: (SearchResult | string)[] = []
  // textAcc固定为 `''`，作为工具实现 Web Search Tool后续展示或比较的基准。
  let textAcc = ''
  // inText标记工具实现 Web Search Tool是否启用对应路径。
  let inText = true

  // 按顺序遍历 `result` 中的block，逐个交给工具调用处理。
  for (const block of result) {
    // 当 `block.type` 匹配 `'server_tool_use'` 时，工具调用执行对应分支。
    if (block.type === 'server_tool_use') {
      // 满足 `inText` 时，工具调用执行该分支。
      if (inText) {
        // inText更新为 `false`，确保工具调用后续读取最新状态。
        inText = false
        // 满足 `textAcc.trim().length > 0` 时，工具调用执行该分支。
        if (textAcc.trim().length > 0) {
          // 结果列表追加新条目，保持收集顺序与输入顺序一致。
          results.push(textAcc.trim())
        }
        // textAcc更新为 `''`，确保工具调用后续读取最新状态。
        textAcc = ''
      }
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 当 `block.type` 匹配 `'web_search_tool_result'` 时，工具调用执行对应分支。
    if (block.type === 'web_search_tool_result') {
      // Handle error case - content is a WebSearchToolResultError
      // 满足 `!Array.isArray(block.content)` 时，工具调用执行该分支。
      if (!Array.isArray(block.content)) {
        // errorMessage 消息数据保存``Web search error: ${block.content.error_code}``，作为后续固定文本处理的输入。
        const errorMessage = `Web search error: ${block.content.error_code}`
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(new Error(errorMessage))
        // 结果列表追加新条目，保持收集顺序与输入顺序一致。
        results.push(errorMessage)
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // Success case - add results to our collection
      // hits 集合派生`content.map`，供工具调用后续处理使用。
      const hits = block.content.map(r => ({ title: r.title, url: r.url }))
      // 结果列表追加新条目，保持收集顺序与输入顺序一致。
      results.push({
        tool_use_id: block.tool_use_id,
        content: hits,
      })
    }

    // 当 `block.type` 匹配 `'text'` 时，工具调用执行对应分支。
    if (block.type === 'text') {
      // 满足 `inText` 时，工具调用执行该分支。
      if (inText) {
        // 工具实现 Web Search Tool在这里处理 `textAcc += block.text`，完成这一小步状态转换。
        textAcc += block.text
      } else {
        // inText更新为 `true`，确保工具调用后续读取最新状态。
        inText = true
        // textAcc更新为 `block.text`，确保工具调用后续读取最新状态。
        textAcc = block.text
      }
    }
  }

  // 满足 `textAcc.length` 时，工具调用执行该分支。
  if (textAcc.length) {
    // 结果列表追加新条目，保持收集顺序与输入顺序一致。
    results.push(textAcc.trim())
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    query,
    results,
    durationSeconds,
  }
}

// WebSearchTool构建`buildTool`，供工具调用后续处理使用。
export const WebSearchTool = buildTool({
  name: WEB_SEARCH_TOOL_NAME,
  searchHint: 'search the web for current information',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // description 使用 input 完成工具调用里的对应操作。
  async description(input) {
    // 返回 ``Claude wants to search the web for: ${input.query}``，作为工具调用这次计算的结果。
    return `Claude wants to search the web for: ${input.query}`
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Web Search'`，作为工具调用这次计算的结果。
    return 'Web Search'
  },
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Searching for ${summary}` : 'Searching the web'`，作为工具调用这次计算的结果。
    return summary ? `Searching for ${summary}` : 'Searching the web'
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // provider读取`getAPIProvider`，供工具调用后续处理使用。
    const provider = getAPIProvider()
    // 模型名称读取`getMainLoopModel`，供工具调用后续处理使用。
    const model = getMainLoopModel()

    // Enable for firstParty
    // 当 `provider` 匹配 `'firstParty'` 时，工具调用执行对应分支。
    if (provider === 'firstParty') {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Enable for Vertex AI with supported models (Claude 4.0+)
    // 当 `provider` 匹配 `'vertex'` 时，工具调用执行对应分支。
    if (provider === 'vertex') {
      // supportsWebSearch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const supportsWebSearch =
        model.includes('claude-opus-4') ||
        model.includes('claude-sonnet-4') ||
        model.includes('claude-haiku-4')

      // 返回 `supportsWebSearch`，作为工具调用这次计算的结果。
      return supportsWebSearch
    }

    // Foundry only ships models that already support Web Search
    // 当 `provider` 匹配 `'foundry'` 时，工具调用执行对应分支。
    if (provider === 'foundry') {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  // 工具实现 Web Search Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Web Search Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.query`，作为工具调用这次计算的结果。
    return input.query
  },
  // checkPermissions 使用 _input 完成工具调用里的对应操作。
  async checkPermissions(_input): Promise<PermissionResult> {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'WebSearchTool requires permission.',
      suggestions: [
        {
          type: 'addRules',
          rules: [{ toolName: WEB_SEARCH_TOOL_NAME }],
          behavior: 'allow',
          destination: 'localSettings',
        },
      ],
    }
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getWebSearchPrompt()`，作为工具调用这次计算的结果。
    return getWebSearchPrompt()
  },
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolResultMessage,
  // extractSearchText 使用 无 完成工具调用里的对应操作。
  extractSearchText() {
    // renderToolResultMessage shows only "Did N searches in Xs" chrome —
    // the results[] content never appears on screen. Heuristic would index
    // string entries in results[] (phantom match). Nothing to search.
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  // validateInput 使用 input 完成工具调用里的对应操作。
  async validateInput(input) {
    // 从 `input` 解构 query、allowed_domains、blocked_domains，减少工具实现 Web Search Tool对同一对象的重复访问。
    const { query, allowed_domains, blocked_domains } = input
    // query.length 数量缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!query.length) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'Error: Missing query',
        errorCode: 1,
      }
    }
    // 只有 `allowed_domains?.length && blocked_domains?.length` 满足时，工具调用才执行该分支。
    if (allowed_domains?.length && blocked_domains?.length) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'Error: Cannot specify both allowed_domains and blocked_domains in the same request',
        errorCode: 2,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // call 使用 input, context, _canUseTool, _parentMessage, onPr… 完成工具调用里的对应操作。
  async call(input, context, _canUseTool, _parentMessage, onProgress) {
    // startTime记录时间`performance.now`，供工具调用后续处理使用。
    const startTime = performance.now()
    // 从 `input` 解构 query，减少工具实现 Web Search Tool对同一对象的重复访问。
    const { query } = input
    // userMessage 消息数据构建`createUserMessage`，供工具调用后续处理使用。
    const userMessage = createUserMessage({
      content: 'Perform a web search for the query: ' + query,
    })
    // toolSchema构建`makeToolSchema`，供工具调用后续处理使用。
    const toolSchema = makeToolSchema(input)

    // useHaiku读取`getFeatureValue_CACHED_MAY_BE_STALE`，供工具调用后续处理使用。
    const useHaiku = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_plum_vx3',
      false,
    )

    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // queryStream保存`queryModelWithStreaming`，供工具调用后续处理使用。
    const queryStream = queryModelWithStreaming({
      messages: [userMessage],
      systemPrompt: asSystemPrompt([
        'You are an assistant for performing a web search tool use',
      ]),
      thinkingConfig: useHaiku
        ? { type: 'disabled' as const }
        : context.options.thinkingConfig,
      tools: [],
      signal: context.abortController.signal,
      options: {
        // 这个回调绑定到 getToolPermissionContext: async () => appState.toolPermissionContext,，负责工具调用在该局部场景下的响应。
        getToolPermissionContext: async () => appState.toolPermissionContext,
        model: useHaiku ? getSmallFastModel() : context.options.mainLoopModel,
        toolChoice: useHaiku ? { type: 'tool', name: 'web_search' } : undefined,
        isNonInteractiveSession: context.options.isNonInteractiveSession,
        hasAppendSystemPrompt: !!context.options.appendSystemPrompt,
        extraToolSchemas: [toolSchema],
        querySource: 'web_search_tool',
        agents: context.options.agentDefinitions.activeAgents,
        mcpTools: [],
        agentId: context.agentId,
        effortValue: appState.effortValue,
      },
    })

    // allContentBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const allContentBlocks: BetaContentBlock[] = []
    // currentToolUseId保存`null`，作为后续空值处理的输入。
    let currentToolUseId = null
    // currentToolUseJson保存`''`，作为后续固定文本处理的输入。
    let currentToolUseJson = ''
    // progressCounter 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let progressCounter = 0
    // toolUseQueries 集合保存`Map`，供工具调用后续处理使用。
    const toolUseQueries = new Map() // Map of tool_use_id to query

    // 逐项读取 `queryStream` 中的event，按输入顺序推进工具调用。
    for await (const event of queryStream) {
      // 当 `event.type` 匹配 `'assistant'` 时，工具调用执行对应分支。
      if (event.type === 'assistant') {
        // allContentBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
        allContentBlocks.push(...event.message.content)
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Track tool use ID when server_tool_use starts
      // 工具调用在这里按实际状态进入对应分支。
      if (
        event.type === 'stream_event' &&
        event.event?.type === 'content_block_start'
      ) {
        // contentBlock保存`event.event.content_block`，供工具实现 Web Search Tool后续判断或输出使用。
        const contentBlock = event.event.content_block
        // 只有 `contentBlock && contentBlock.type === 'server_too` 满足时，工具调用才执行该分支。
        if (contentBlock && contentBlock.type === 'server_tool_use') {
          // currentToolUseId更新为 `contentBlock.id`，确保工具调用后续读取最新状态。
          currentToolUseId = contentBlock.id
          // currentToolUseJson更新为 `''`，确保工具调用后续读取最新状态。
          currentToolUseJson = ''
          // Note: The ServerToolUseBlock doesn't contain input.query
          // The actual query comes through input_json_delta events
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
      }

      // Accumulate JSON for current tool use
      // 工具调用在这里按实际状态进入对应分支。
      if (
        currentToolUseId &&
        event.type === 'stream_event' &&
        event.event?.type === 'content_block_delta'
      ) {
        // delta保存`event.event.delta`，供工具实现 Web Search Tool后续判断或输出使用。
        const delta = event.event.delta
        // 只有 `delta?.type === 'input_json_delta' && delta.parti` 满足时，工具调用才执行该分支。
        if (delta?.type === 'input_json_delta' && delta.partial_json) {
          // 工具实现 Web Search Tool在这里处理 `currentToolUseJson += delta.partial_json`，完成这一小步状态转换。
          currentToolUseJson += delta.partial_json

          // Try to extract query from partial JSON for progress updates
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // Look for a complete query field
            // queryMatch匹配`currentToolUseJson.match`，供工具调用后续处理使用。
            const queryMatch = currentToolUseJson.match(
              /"query"\s*:\s*"((?:[^"\\]|\\.)*)"/,
            )
            // 只有 `queryMatch && queryMatch[1]` 满足时，工具调用才执行该分支。
            if (queryMatch && queryMatch[1]) {
              // The regex properly handles escaped characters
              // query解析`jsonParse`，供工具调用后续处理使用。
              const query = jsonParse('"' + queryMatch[1] + '"')

              // 工具调用在这里按实际状态进入对应分支。
              if (
                !toolUseQueries.has(currentToolUseId) ||
                toolUseQueries.get(currentToolUseId) !== query
              ) {
                // toolUseQueries.set写入新的状态值，使工具调用后续读取保持一致。
                toolUseQueries.set(currentToolUseId, query)
                // 工具实现 Web Search Tool处理 `progressCounter++`，完成这一小步状态转换。
                progressCounter++
                // 满足 `onProgress` 时，工具调用执行该分支。
                if (onProgress) {
                  // onProgress执行工具调用在此处需要的副作用或外部交互。
                  onProgress({
                    toolUseID: `search-progress-${progressCounter}`,
                    data: {
                      type: 'query_update',
                      query,
                    },
                  })
                }
              }
            }
          } catch {
            // Ignore parsing errors for partial JSON
          }
        }
      }

      // Yield progress when search results come in
      // 工具调用在这里按实际状态进入对应分支。
      if (
        event.type === 'stream_event' &&
        event.event?.type === 'content_block_start'
      ) {
        // contentBlock保存`event.event.content_block`，供工具实现 Web Search Tool后续步骤使用。
        const contentBlock = event.event.content_block
        // 只有 `contentBlock && contentBlock.type === 'web_search` 满足时，工具调用才执行该分支。
        if (contentBlock && contentBlock.type === 'web_search_tool_result') {
          // Get the actual query that was used for this search
          // toolUseId保存`contentBlock.tool_use_id`，供工具实现 Web Search Tool后续步骤使用。
          const toolUseId = contentBlock.tool_use_id
          // actualQuery读取`toolUseQueries.get`，供工具调用后续处理使用。
          const actualQuery = toolUseQueries.get(toolUseId) || query
          // content保存`contentBlock.content`，供工具实现 Web Search Tool后续步骤使用。
          const content = contentBlock.content

          // 工具实现 Web Search Tool处理 `progressCounter++`，完成这一小步状态转换。
          progressCounter++
          // 满足 `onProgress` 时，工具调用执行该分支。
          if (onProgress) {
            // onProgress执行工具调用在此处需要的副作用或外部交互。
            onProgress({
              toolUseID: toolUseId || `search-progress-${progressCounter}`,
              data: {
                type: 'search_results_received',
                resultCount: Array.isArray(content) ? content.length : 0,
                query: actualQuery,
              },
            })
          }
        }
      }
    }

    // Process the final result
    // endTime记录时间`performance.now`，供工具调用后续处理使用。
    const endTime = performance.now()
    // durationSeconds 集合保存`(endTime - startTime) / 1000`，供工具实现 Web Search Tool后续步骤使用。
    const durationSeconds = (endTime - startTime) / 1000

    // data构建`makeOutputFromSearchResponse`，供工具调用后续处理使用。
    const data = makeOutputFromSearchResponse(
      allContentBlocks,
      query,
      durationSeconds,
    )
    // 返回 { data }，把工具调用这个分支的结果交还调用方。
    return { data }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 从 `output` 解构 query、results，减少工具实现 Web Search Tool对同一对象的重复访问。
    const { query, results } = output

    // formattedOutput保存``Web search results for query: "${query}"\n\n``，供工具实现 Web Search Tool后续步骤使用。
    let formattedOutput = `Web search results for query: "${query}"\n\n`

    // Process the results array - it can contain both string summaries and search result objects.
    // Guard against null/undefined entries that can appear after JSON round-tripping
    // (e.g., from compaction or transcript deserialization).
    // 这个回调绑定到 ;(results ?? []).forEach(result => {，负责工具调用在该局部场景下的响应。
    ;(results ?? []).forEach(result => {
      // 满足 `result == null` 时，工具调用执行该分支。
      if (result == null) {
        // 工具实现 Web Search Tool在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // `typeof result` 命中特定值 `'string'` 时，进入工具调用对应处理。
      if (typeof result === 'string') {
        // Text summary
        // 工具实现 Web Search Tool处理 `formattedOutput += result + '\n\n'`，完成这一小步状态转换。
        formattedOutput += result + '\n\n'
      } else {
        // Search result with links
        // 满足 `result.content?.length > 0` 时，工具调用执行该分支。
        if (result.content?.length > 0) {
          // 工具实现 Web Search Tool处理 `formattedOutput += `Links: ${jsonStringify(result.content)}\n\n``，完成这一小步状态转换。
          formattedOutput += `Links: ${jsonStringify(result.content)}\n\n`
        } else {
          // 工具实现 Web Search Tool处理 `formattedOutput += 'No links found.\n\n'`，完成这一小步状态转换。
          formattedOutput += 'No links found.\n\n'
        }
      }
    })

    // 工具实现 Web Search Tool处理 `formattedOutput +=`，完成这一小步状态转换。
    formattedOutput +=
      '\nREMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.'

    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: formattedOutput.trim(),
    }
  },
} satisfies ToolDef<InputSchema, Output, WebSearchProgress>)
