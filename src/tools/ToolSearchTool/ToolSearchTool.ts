// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildTool,
  findToolByName,
  type Tool,
  type ToolDef,
  type Tools,
} from '../../Tool.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 escapeRegExp 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { escapeRegExp } from '../../utils/stringUtils.js'
// 复用 isToolSearchEnabledOptimistic 工具函数，把通用处理留在 ../../utils/toolSearch.js 中维护。
import { isToolSearchEnabledOptimistic } from '../../utils/toolSearch.js'
// 引入 getPrompt、isDeferredTool、TOOL_SEARCH_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getPrompt, isDeferredTool, TOOL_SEARCH_TOOL_NAME } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
export const inputSchema = lazySchema(() =>
  z.object({
    query: z
      .string()
      .describe(
        'Query to find deferred tools. Use "select:<tool_name>" for direct selection, or keywords to search.',
      ),
    max_results: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum number of results to return (default: 5)'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() =>
  z.object({
    matches: z.array(z.string()),
    query: z.string(),
    total_deferred_tools: z.number(),
    pending_mcp_servers: z.array(z.string()).optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// Track deferred tool names to detect when cache should be cleared
// cachedDeferredToolNames 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cachedDeferredToolNames: string | null = null

/**
 * Get a cache key representing the current set of deferred tools.
 */
// getDeferredToolsCacheKey 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDeferredToolsCacheKey(deferredTools: Tools): string {
  // 返回 `deferredTools`，作为工具调用这次计算的结果。
  return deferredTools
    .map(t => t.name)
    .sort()
    .join(',')
}

/**
 * Get tool description, memoized by tool name.
 * Used for keyword search scoring.
 */
// getToolDescriptionMemoized保存`memoize`，供工具调用后续处理使用。
const getToolDescriptionMemoized = memoize(
  async (toolName: string, tools: Tools): Promise<string> => {
    // 工具筛选`findToolByName`，供工具调用后续处理使用。
    const tool = findToolByName(tools, toolName)
    // 工具缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!tool) {
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
    }
    // 返回 `tool.prompt({`，作为工具调用这次计算的结果。
    return tool.prompt({
      // 这个回调绑定到 getToolPermissionContext: async () => ({，负责工具调用在该局部场景下的响应。
      getToolPermissionContext: async () => ({
        mode: 'default' as const,
        additionalWorkingDirectories: new Map(),
        alwaysAllowRules: {},
        alwaysDenyRules: {},
        alwaysAskRules: {},
        isBypassPermissionsModeAvailable: false,
      }),
      tools,
      agents: [],
    })
  },
  // 这个回调绑定到 (toolName: string) => toolName,，负责工具调用在该局部场景下的响应。
  (toolName: string) => toolName,
)

/**
 * Invalidate the description cache if deferred tools have changed.
 */
// maybeInvalidateCache 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeInvalidateCache(deferredTools: Tools): void {
  // currentKey读取`getDeferredToolsCacheKey`，供工具调用后续处理使用。
  const currentKey = getDeferredToolsCacheKey(deferredTools)
  // `cachedDeferredToolNames` 与 `currentKey` 不一致时刷新派生状态，避免使用过期结果。
  if (cachedDeferredToolNames !== currentKey) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `ToolSearchTool: cache invalidated - deferred tools changed`,
    )
    // 调用 getToolDescriptionMemoized.cache.clear?.()，完成这一处局部操作。
    getToolDescriptionMemoized.cache.clear?.()
    // cachedDeferredToolNames 缓存更新为 `currentKey`，确保工具调用后续读取最新状态。
    cachedDeferredToolNames = currentKey
  }
}

// clearToolSearchDescriptionCache 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearToolSearchDescriptionCache(): void {
  // 调用 getToolDescriptionMemoized.cache.clear?.()，完成这一处局部操作。
  getToolDescriptionMemoized.cache.clear?.()
  // cachedDeferredToolNames 缓存更新为 `null`，确保工具调用后续读取最新状态。
  cachedDeferredToolNames = null
}

/**
 * Build the search result output structure.
 */
// buildSearchResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildSearchResult(
  matches: string[],
  query: string,
  totalDeferredTools: number,
  pendingMcpServers?: string[],
): { data: Output } {
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      matches,
      query,
      total_deferred_tools: totalDeferredTools,
      ...(pendingMcpServers && pendingMcpServers.length > 0
        ? { pending_mcp_servers: pendingMcpServers }
        : {}),
    },
  }
}

/**
 * Parse tool name into searchable parts.
 * Handles both MCP tools (mcp__server__action) and regular tools (CamelCase).
 */
// parseToolName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseToolName(name: string): {
  parts: string[]
  full: string
  isMcp: boolean
} {
  // Check if it's an MCP tool
  // 满足 `name.startsWith('mcp__')` 时，工具调用执行该分支。
  if (name.startsWith('mcp__')) {
    // withoutPrefix格式化`name.replace`，供工具调用后续处理使用。
    const withoutPrefix = name.replace(/^mcp__/, '').toLowerCase()
    // 片段列表格式化`withoutPrefix.split`，供工具调用后续处理使用。
    const parts = withoutPrefix.split('__').flatMap(p => p.split('_'))
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      parts: parts.filter(Boolean),
      full: withoutPrefix.replace(/__/g, ' ').replace(/_/g, ' '),
      isMcp: true,
    }
  }

  // Regular tool - split by CamelCase and underscores
  // 片段列表 命名 `name`，让后续代码直接表达这个值的用途。
  const parts = name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    parts,
    full: parts.join(' '),
    isMcp: false,
  }
}

/**
 * Pre-compile word-boundary regexes for all search terms.
 * Called once per search instead of tools×terms×2 times.
 */
// compileTermPatterns 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function compileTermPatterns(terms: string[]): Map<string, RegExp> {
  // patterns 集合 命名 `new Map<string, RegExp>()`，让后续代码直接表达这个值的用途。
  const patterns = new Map<string, RegExp>()
  // 按顺序遍历 `terms` 中的term，逐个交给工具调用处理。
  for (const term of terms) {
    // 满足 `!patterns.has(term)` 时，工具调用执行该分支。
    if (!patterns.has(term)) {
      // patterns.set 写入新的状态值，使工具调用后续读取保持一致。
      patterns.set(term, new RegExp(`\\b${escapeRegExp(term)}\\b`))
    }
  }
  // 返回 `patterns`，作为工具调用这次计算的结果。
  return patterns
}

/**
 * Keyword-based search over tool names and descriptions.
 * Handles both MCP tools (mcp__server__action) and regular tools (CamelCase).
 *
 * The model typically queries with:
 * - Server names when it knows the integration (e.g., "slack", "github")
 * - Action words when looking for functionality (e.g., "read", "list", "create")
 * - Tool-specific terms (e.g., "notebook", "shell", "kill")
 */
// searchToolsWithKeywords 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function searchToolsWithKeywords(
  query: string,
  deferredTools: Tools,
  tools: Tools,
  maxResults: number,
): Promise<string[]> {
  // queryLower保存`query.toLowerCase`，供工具调用后续处理使用。
  const queryLower = query.toLowerCase().trim()

  // Fast path: if query matches a tool name exactly, return it directly.
  // Handles models using a bare tool name instead of select: prefix (seen
  // from subagents/post-compaction). Checks deferred first, then falls back
  // to the full tool set — selecting an already-loaded tool is a harmless
  // no-op that lets the model proceed without retry churn.
  // exactMatch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const exactMatch =
    // 调用 deferredTools.find，触发工具调用此处需要的副作用。
    deferredTools.find(t => t.name.toLowerCase() === queryLower) ??
    // 调用 tools.find，触发工具调用此处需要的副作用。
    tools.find(t => t.name.toLowerCase() === queryLower)
  // 满足 `exactMatch` 时，工具调用执行该分支。
  if (exactMatch) {
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return [exactMatch.name]
  }

  // If query looks like an MCP tool prefix (mcp__server), find matching tools.
  // Handles models searching by server name with mcp__ prefix.
  // 只有 `queryLower.startsWith('mcp__') && queryLower.length > 5` 满足时，工具调用才执行该分支。
  if (queryLower.startsWith('mcp__') && queryLower.length > 5) {
    // prefixMatches 集合保存`deferredTools`，供后续判断或组装使用。
    const prefixMatches = deferredTools
      // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
      .filter(t => t.name.toLowerCase().startsWith(queryLower))
      .slice(0, maxResults)
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map(t => t.name)
    // 满足 `prefixMatches.length > 0` 时，工具调用执行该分支。
    if (prefixMatches.length > 0) {
      // 返回 `prefixMatches`，作为工具调用这次计算的结果。
      return prefixMatches
    }
  }

  // queryTerms 集合格式化`queryLower.split`，供工具调用后续处理使用。
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0)

  // Partition into required (+prefixed) and optional terms
  // requiredTerms 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const requiredTerms: string[] = []
  // optionalTerms 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const optionalTerms: string[] = []
  // 按顺序遍历 `queryTerms` 中的term，逐个交给工具调用处理。
  for (const term of queryTerms) {
    // 只有 `term.startsWith('+') && term.length > 1` 满足时，工具调用才执行该分支。
    if (term.startsWith('+') && term.length > 1) {
      // requiredTerms 集合追加新条目，保持收集顺序与输入顺序一致。
      requiredTerms.push(term.slice(1))
    } else {
      // optionalTerms 集合追加新条目，保持收集顺序与输入顺序一致。
      optionalTerms.push(term)
    }
  }

  // allScoringTerms 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const allScoringTerms =
    requiredTerms.length > 0 ? [...requiredTerms, ...optionalTerms] : queryTerms
  // termPatterns 集合保存`compileTermPatterns`，供工具调用后续处理使用。
  const termPatterns = compileTermPatterns(allScoringTerms)

  // Pre-filter to tools matching ALL required terms in name or description
  // candidateTools 集合保存`deferredTools`，供后续判断或组装使用。
  let candidateTools = deferredTools
  // 满足 `requiredTerms.length > 0` 时，工具调用执行该分支。
  if (requiredTerms.length > 0) {
    // matches 集合保存`Promise.all`，供工具调用后续处理使用。
    const matches = await Promise.all(
      // 调用 deferredTools.map，触发工具调用此处需要的副作用。
      deferredTools.map(async tool => {
        // 解析结果解析`parseToolName`，供工具调用后续处理使用。
        const parsed = parseToolName(tool.name)
        // description读取`getToolDescriptionMemoized`，供工具调用后续处理使用。
        const description = await getToolDescriptionMemoized(tool.name, tools)
        // descNormalized保存`description.toLowerCase`，供工具调用后续处理使用。
        const descNormalized = description.toLowerCase()
        // hintNormalized保存`toLowerCase`，供工具调用后续处理使用。
        const hintNormalized = tool.searchHint?.toLowerCase() ?? ''
        // matchesAll筛选`requiredTerms.every`，供工具调用后续处理使用。
        const matchesAll = requiredTerms.every(term => {
          // pattern读取`termPatterns.get`，供工具调用后续处理使用。
          const pattern = termPatterns.get(term)!
          // 返回 `(`，作为工具调用这次计算的结果。
          return (
            parsed.parts.includes(term) ||
            // 调用 parsed.parts.some，触发工具调用此处需要的副作用。
            parsed.parts.some(part => part.includes(term)) ||
            pattern.test(descNormalized) ||
            (hintNormalized && pattern.test(hintNormalized))
          )
        })
        // 返回 `matchesAll ? tool : null`，作为工具调用这次计算的结果。
        return matchesAll ? tool : null
      }),
    )
    // candidateTools 集合更新为 `matches.filter((t): t is Tool => t !== null)`，确保工具调用后续读取最新状态。
    candidateTools = matches.filter((t): t is Tool => t !== null)
  }

  // scored保存`Promise.all`，供工具调用后续处理使用。
  const scored = await Promise.all(
    // 调用 candidateTools.map，触发工具调用此处需要的副作用。
    candidateTools.map(async tool => {
      // 解析结果解析`parseToolName`，供工具调用后续处理使用。
      const parsed = parseToolName(tool.name)
      // description读取`getToolDescriptionMemoized`，供工具调用后续处理使用。
      const description = await getToolDescriptionMemoized(tool.name, tools)
      // descNormalized保存`description.toLowerCase`，供工具调用后续处理使用。
      const descNormalized = description.toLowerCase()
      // hintNormalized保存`toLowerCase`，供工具调用后续处理使用。
      const hintNormalized = tool.searchHint?.toLowerCase() ?? ''

      // score保存`0`，供工具实现 Tool Search Tool后续判断或输出使用。
      let score = 0
      // 按顺序遍历 `allScoringTerms` 中的term，逐个交给工具调用处理。
      for (const term of allScoringTerms) {
        // pattern读取`termPatterns.get`，供工具调用后续处理使用。
        const pattern = termPatterns.get(term)!

        // Exact part match (high weight for MCP server names, tool name parts)
        // 满足 `parsed.parts.includes(term)` 时，工具调用执行该分支。
        if (parsed.parts.includes(term)) {
          // 工具实现 Tool Search Tool在这里处理 `score += parsed.isMcp ? 12 : 10`，完成这一小步状态转换。
          score += parsed.isMcp ? 12 : 10
        // 这个回调绑定到 } else if (parsed.parts.some(part => part.includes(term))) {，负责工具调用在该局部场景下的响应。
        } else if (parsed.parts.some(part => part.includes(term))) {
          // 工具实现 Tool Search Tool在这里处理 `score += parsed.isMcp ? 6 : 5`，完成这一小步状态转换。
          score += parsed.isMcp ? 6 : 5
        }

        // Full name fallback (for edge cases)
        // 只有 `parsed.full.includes(term) && score === 0` 满足时，工具调用才执行该分支。
        if (parsed.full.includes(term) && score === 0) {
          // 工具实现 Tool Search Tool在这里处理 `score += 3`，完成这一小步状态转换。
          score += 3
        }

        // searchHint match — curated capability phrase, higher signal than prompt
        // 只有 `hintNormalized && pattern.test(hintNormalized)` 满足时，工具调用才执行该分支。
        if (hintNormalized && pattern.test(hintNormalized)) {
          // 工具实现 Tool Search Tool在这里处理 `score += 4`，完成这一小步状态转换。
          score += 4
        }

        // Description match - use word boundary to avoid false positives
        // 满足 `pattern.test(descNormalized)` 时，工具调用执行该分支。
        if (pattern.test(descNormalized)) {
          // 工具实现 Tool Search Tool在这里处理 `score += 2`，完成这一小步状态转换。
          score += 2
        }
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { name: tool.name, score }
    }),
  )

  // 返回 `scored`，作为工具调用这次计算的结果。
  return scored
    // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
    .filter(item => item.score > 0)
    // 链式调用 sort，继续加工上一行在工具调用中产生的数据。
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    // 链式调用 map，继续加工上一行在工具调用中产生的数据。
    .map(item => item.name)
}

// ToolSearchTool构建`buildTool`，供工具调用后续处理使用。
export const ToolSearchTool = buildTool({
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isToolSearchEnabledOptimistic()`，作为工具调用这次计算的结果。
    return isToolSearchEnabledOptimistic()
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
  name: TOOL_SEARCH_TOOL_NAME,
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `getPrompt()`，作为工具调用这次计算的结果。
    return getPrompt()
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getPrompt()`，作为工具调用这次计算的结果。
    return getPrompt()
  },
  // 工具实现 Tool Search Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Tool Search Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // call 使用 input, { options: { tools }, getAppState } 完成工具调用里的对应操作。
  async call(input, { options: { tools }, getAppState }) {
    // 从 `input` 解构 query、max_results = 5，减少工具实现 Tool Search Tool对同一对象的重复访问。
    const { query, max_results = 5 } = input

    // deferredTools 集合筛选`tools.filter`，供工具调用后续处理使用。
    const deferredTools = tools.filter(isDeferredTool)
    // 调用 maybeInvalidateCache，触发工具调用此处需要的副作用。
    maybeInvalidateCache(deferredTools)

    // Check for MCP servers still connecting
    // getPendingServerNames 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function getPendingServerNames(): string[] | undefined {
      // appState 状态读取`getAppState`，供工具调用后续处理使用。
      const appState = getAppState()
      // pending筛选`clients.filter`，供工具调用后续处理使用。
      const pending = appState.mcp.clients.filter(c => c.type === 'pending')
      // 返回 `pending.length > 0 ? pending.map(s => s.name) : undefined`，作为工具调用这次计算的结果。
      return pending.length > 0 ? pending.map(s => s.name) : undefined
    }

    // Helper to log search outcome
    // logSearchOutcome 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function logSearchOutcome(
      matches: string[],
      queryType: 'select' | 'keyword',
    ): void {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_search_outcome', {
        query:
          query as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        queryType:
          queryType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        matchCount: matches.length,
        totalDeferredTools: deferredTools.length,
        maxResults: max_results,
        hasMatches: matches.length > 0,
      })
    }

    // Check for select: prefix — direct tool selection.
    // Supports comma-separated multi-select: `select:A,B,C`.
    // If a name isn't in the deferred set but IS in the full tool set,
    // we still return it — the tool is already loaded, so "selecting" it
    // is a harmless no-op that lets the model proceed without retry churn.
    // selectMatch匹配`query.match`，供工具调用后续处理使用。
    const selectMatch = query.match(/^select:(.+)$/i)
    // 满足 `selectMatch` 时，工具调用执行该分支。
    if (selectMatch) {
      // requested 请求数据 命名 `selectMatch[1]!`，让后续代码直接表达这个值的用途。
      const requested = selectMatch[1]!
        .split(',')
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(s => s.trim())
        .filter(Boolean)

      // found 从空数组开始收集，后续循环会按处理顺序追加条目。
      const found: string[] = []
      // missing 从空数组开始收集，后续循环会按处理顺序追加条目。
      const missing: string[] = []
      // 按顺序遍历 `requested` 中的toolName，逐个交给工具调用处理。
      for (const toolName of requested) {
        // tool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const tool =
          findToolByName(deferredTools, toolName) ??
          findToolByName(tools, toolName)
        // 满足 `tool` 时，工具调用执行该分支。
        if (tool) {
          // 满足 `!found.includes(tool.name)) found.push(tool.name` 时，工具调用执行该分支。
          if (!found.includes(tool.name)) found.push(tool.name)
        } else {
          // missing追加新条目，保持收集顺序与输入顺序一致。
          missing.push(toolName)
        }
      }

      // found为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
      if (found.length === 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `ToolSearchTool: select failed — none found: ${missing.join(', ')}`,
        )
        // 调用 logSearchOutcome，触发工具调用此处需要的副作用。
        logSearchOutcome([], 'select')
        // pendingServers 集合读取`getPendingServerNames`，供工具调用后续处理使用。
        const pendingServers = getPendingServerNames()
        // 返回 `buildSearchResult(`，作为工具调用这次计算的结果。
        return buildSearchResult(
          [],
          query,
          deferredTools.length,
          pendingServers,
        )
      }

      // 满足 `missing.length > 0` 时，工具调用执行该分支。
      if (missing.length > 0) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `ToolSearchTool: partial select — found: ${found.join(', ')}, missing: ${missing.join(', ')}`,
        )
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`ToolSearchTool: selected ${found.join(', ')}`)
      }
      // 调用 logSearchOutcome，触发工具调用此处需要的副作用。
      logSearchOutcome(found, 'select')
      // 返回 `buildSearchResult(found, query, deferredTools.length)`，作为工具调用这次计算的结果。
      return buildSearchResult(found, query, deferredTools.length)
    }

    // Keyword search
    // matches 集合保存`searchToolsWithKeywords`，供工具调用后续处理使用。
    const matches = await searchToolsWithKeywords(
      query,
      deferredTools,
      tools,
      max_results,
    )

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `ToolSearchTool: keyword search for "${query}", found ${matches.length} matches`,
    )

    // 调用 logSearchOutcome，触发工具调用此处需要的副作用。
    logSearchOutcome(matches, 'keyword')

    // Include pending server info when search finds no matches
    // matches 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (matches.length === 0) {
      // pendingServers 集合读取`getPendingServerNames`，供工具调用后续处理使用。
      const pendingServers = getPendingServerNames()
      // 返回 `buildSearchResult(`，作为工具调用这次计算的结果。
      return buildSearchResult(
        matches,
        query,
        deferredTools.length,
        pendingServers,
      )
    }

    // 返回 `buildSearchResult(matches, query, deferredTools.length)`，作为工具调用这次计算的结果。
    return buildSearchResult(matches, query, deferredTools.length)
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // 这个回调绑定到 userFacingName: () => '',，负责工具调用在该局部场景下的响应。
  userFacingName: () => '',
  /**
   * Returns a tool_result with tool_reference blocks.
   * This format works on 1P/Foundry. Bedrock/Vertex may not support
   * client-side tool_reference expansion yet.
   */
  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam(
    content: Output,
    toolUseID: string,
  ): ToolResultBlockParam {
    // content.matches 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (content.matches.length === 0) {
      // 文本内容保存`'No matching deferred tools found'`，作为后续固定文本处理的输入。
      let text = 'No matching deferred tools found'
      // 工具调用在这里按实际状态进入对应分支。
      if (
        content.pending_mcp_servers &&
        content.pending_mcp_servers.length > 0
      ) {
        // 工具实现 Tool Search Tool在这里处理 `text += `. Some MCP servers are still connecting: ${content.pending_mcp...`，完成这一小步状态转换。
        text += `. Some MCP servers are still connecting: ${content.pending_mcp_servers.join(', ')}. Their tools will become available shortly — try searching again.`
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: text,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      // 这个回调绑定到 content: content.matches.map(name => ({，负责工具调用在该局部场景下的响应。
      content: content.matches.map(name => ({
        type: 'tool_reference' as const,
        tool_name: name,
      })),
    } as unknown as ToolResultBlockParam
  },
} satisfies ToolDef<InputSchema, Output>)
