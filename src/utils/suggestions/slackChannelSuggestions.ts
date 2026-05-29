// 引入 z，将 zod 中已经封装好的能力接到本文件流程里。
import { z } from 'zod'
// 类型依赖 { SuggestionItem } 来自 ../../components/PromptInput/PromptInputFooterSuggestions.js，用于校准共享工具的数据契约。
import type { SuggestionItem } from '../../components/PromptInput/PromptInputFooterSuggestions.js'
// 类型依赖 { MCPServerConnection } 来自 ../../services/mcp/types.js，用于校准共享工具的数据契约。
import type { MCPServerConnection } from '../../services/mcp/types.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 createSignal，将 ../signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from '../signal.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'

// SLACK_SEARCH_TOOL 命名 `'slack_search_channels'`，让后续代码直接表达这个值的用途。
const SLACK_SEARCH_TOOL = 'slack_search_channels'

// Plain Map (not LRUCache) — findReusableCacheEntry needs to iterate all
// entries for prefix matching, which LRUCache doesn't expose cleanly.
// cache 缓存构建`new Map<string, string[]>()`，供后续判断或组装使用。
const cache = new Map<string, string[]>()
// Flat set of every channel name ever returned by MCP — used to gate
// highlighting so only confirmed-real channels turn blue in the prompt.
// knownChannels 集合构建`new Set<string>()` 整理出中间结果，供共享工具 slack Channel Suggestions后续步骤使用。
const knownChannels = new Set<string>()
// knownChannelsVersion保存`0`，供后续判断或组装使用。
let knownChannelsVersion = 0
// knownChannelsChanged构建`createSignal`，供共享工具后续处理使用。
const knownChannelsChanged = createSignal()
// subscribeKnownChannels 集合保存`knownChannelsChanged.subscribe`，供共享工具 slack Channel Suggestions后续判断或输出使用。
export const subscribeKnownChannels = knownChannelsChanged.subscribe
// inflightQuery初始化为空值，后续分支会在有数据时补齐。
let inflightQuery: string | null = null
// inflightPromise 异步任务初始化为空值，后续分支会在有数据时补齐。
let inflightPromise: Promise<string[]> | null = null

// findSlackClient 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findSlackClient(
  clients: MCPServerConnection[],
): MCPServerConnection | undefined {
  // 返回 `clients.find(c => c.type === 'connected' && c.name.includes('slack'))`，作为共享工具这次计算的结果。
  return clients.find(c => c.type === 'connected' && c.name.includes('slack'))
}

// fetchChannels 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchChannels(
  clients: MCPServerConnection[],
  query: string,
): Promise<string[]> {
  // slackClient筛选`findSlackClient`，供共享工具后续处理使用。
  const slackClient = findSlackClient(clients)
  // `!slackClient || slackClient.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
  if (!slackClient || slackClient.type !== 'connected') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`client.callTool`，供共享工具后续处理使用。
    const result = await slackClient.client.callTool(
      {
        name: SLACK_SEARCH_TOOL,
        arguments: {
          query,
          limit: 20,
          channel_types: 'public_channel,private_channel',
        },
      },
      undefined,
      { timeout: 5000 },
    )

    // 文本内容保存`result.content`，供后续判断或组装使用。
    const content = result.content
    // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
    if (!Array.isArray(content)) return []

    // rawText保存`content`，供后续判断或组装使用。
    const rawText = content
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(c => c.text)
      .join('\n')

    // 返回 `parseChannels(unwrapResults(rawText))`，作为共享工具这次计算的结果。
    return parseChannels(unwrapResults(rawText))
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to fetch Slack channels: ${error}`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// The Slack MCP server wraps its markdown in a JSON envelope:
// {"results":"# Search Results...\nName: #chan\n..."}
// resultsEnvelopeSchema保存`lazySchema`，供共享工具后续处理使用。
const resultsEnvelopeSchema = lazySchema(() =>
  z.object({ results: z.string() }),
)

// unwrapResults 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function unwrapResults(text: string): string {
  // trimmed格式化`text.trim`，供共享工具后续处理使用。
  const trimmed = text.trim()
  // 满足 `!trimmed.startsWith('{')` 时，共享工具执行该分支。
  if (!trimmed.startsWith('{')) return text
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`resultsEnvelopeSchema`，供共享工具后续处理使用。
    const parsed = resultsEnvelopeSchema().safeParse(jsonParse(trimmed))
    // 满足 `parsed.success` 时，共享工具执行该分支。
    if (parsed.success) return parsed.data.results
  } catch {
    // jsonParse threw — fall through
  }
  // 返回 `text`，作为共享工具这次计算的结果。
  return text
}

// Parse channel names from slack_search_channels text output.
// The Slack MCP server returns markdown with "Name: #channel-name" lines.
// parseChannels 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseChannels(text: string): string[] {
  // channels 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const channels: string[] = []
  // seen构建`new Set<string>()`，供后续判断或组装使用。
  const seen = new Set<string>()

  // 逐项读取 `text.split('\n')` 中的line，按输入顺序推进共享工具。
  for (const line of text.split('\n')) {
    // m匹配`line.match`，供共享工具后续处理使用。
    const m = line.match(/^Name:\s*#?([a-z0-9][a-z0-9_-]{0,79})\s*$/)
    // 只有 `m && !seen.has(m[1]!)` 满足时，共享工具才执行该分支。
    if (m && !seen.has(m[1]!)) {
      // 调用 seen.add，触发共享工具此处需要的副作用。
      seen.add(m[1]!)
      // channels 集合追加新条目，保持收集顺序与输入顺序一致。
      channels.push(m[1]!)
    }
  }

  // 返回 `channels`，作为共享工具这次计算的结果。
  return channels
}

// hasSlackMcpServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasSlackMcpServer(clients: MCPServerConnection[]): boolean {
  // 返回 `findSlackClient(clients) !== undefined`，作为共享工具这次计算的结果。
  return findSlackClient(clients) !== undefined
}

// getKnownChannelsVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKnownChannelsVersion(): number {
  // 返回 `knownChannelsVersion`，作为共享工具这次计算的结果。
  return knownChannelsVersion
}

// findSlackChannelPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findSlackChannelPositions(
  text: string,
): Array<{ start: number; end: number }> {
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: Array<{ start: number; end: number }> = []
  // re保存`/(^|\s)#([a-z0-9][a-z0-9_-]{0,79})(?=\s|$)/g`，供共享工具 slack Channel Suggestions后续判断或输出使用。
  const re = /(^|\s)#([a-z0-9][a-z0-9_-]{0,79})(?=\s|$)/g
  // m 先占位，稍后的条件分支会根据实际输入补齐它。
  let m: RegExpExecArray | null
  // 只要 (m = re.exec(text)) !== null 成立，就持续推进共享工具中的循环处理。
  while ((m = re.exec(text)) !== null) {
    // 满足 `!knownChannels.has(m[2]!)` 时，共享工具执行该分支。
    if (!knownChannels.has(m[2]!)) continue
    // start保存 `m.index + m[1]!.length` 的判断结果，供共享工具 slack Channel Suggestions后续分支直接复用。
    const start = m.index + m[1]!.length
    // positions 集合追加新条目，保持收集顺序与输入顺序一致。
    positions.push({ start, end: start + 1 + m[2]!.length })
  }
  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// Slack's search tokenizes on hyphens and requires whole-word matches, so
// "claude-code-team-en" returns 0 results. Strip the trailing partial segment
// so the MCP query is "claude-code-team" (complete words only), then filter
// locally. This keeps the query maximally specific (avoiding the 20-result
// cap) while never sending a partial word that kills the search.
// mcpQueryFor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mcpQueryFor(searchToken: string): string {
  // lastSep保存`Math.max`，供共享工具后续处理使用。
  const lastSep = Math.max(
    searchToken.lastIndexOf('-'),
    searchToken.lastIndexOf('_'),
  )
  // 返回 `lastSep > 0 ? searchToken.slice(0, lastSep) : searchToken`，作为共享工具这次计算的结果。
  return lastSep > 0 ? searchToken.slice(0, lastSep) : searchToken
}

// Find a cached entry whose key is a prefix of mcpQuery and still has
// matches for searchToken. Lets typing "c"→"cl"→"cla" reuse the "c" cache
// instead of issuing a new MCP call per keystroke.
// findReusableCacheEntry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findReusableCacheEntry(
  mcpQuery: string,
  searchToken: string,
): string[] | undefined {
  // best 先占位，稍后的条件分支会根据实际输入补齐它。
  let best: string[] | undefined
  // bestLen 命名 `0`，让后续代码直接表达这个值的用途。
  let bestLen = 0
  // 循环处理 `const [key, channels] of cache`，让共享工具逐项把同类条目按顺序走完。
  for (const [key, channels] of cache) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      mcpQuery.startsWith(key) &&
      key.length > bestLen &&
      // 调用 channels.some，触发共享工具此处需要的副作用。
      channels.some(c => c.startsWith(searchToken))
    ) {
      // best更新为 `channels`，确保共享工具后续读取最新状态。
      best = channels
      // bestLen更新为 `key.length`，确保共享工具后续读取最新状态。
      bestLen = key.length
    }
  }
  // 返回 `best`，作为共享工具这次计算的结果。
  return best
}

// getSlackChannelSuggestions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSlackChannelSuggestions(
  clients: MCPServerConnection[],
  searchToken: string,
): Promise<SuggestionItem[]> {
  // searchToken缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!searchToken) return []

  // mcpQuery保存`mcpQueryFor`，供共享工具后续处理使用。
  const mcpQuery = mcpQueryFor(searchToken)
  // lower保存`searchToken.toLowerCase`，供共享工具后续处理使用。
  const lower = searchToken.toLowerCase()

  // channels 集合读取`cache.get`，供共享工具后续处理使用。
  let channels = cache.get(mcpQuery) ?? findReusableCacheEntry(mcpQuery, lower)
  // channels 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!channels) {
    // 只有 `inflightQuery === mcpQuery && inflightPromise` 满足时，共享工具才执行该分支。
    if (inflightQuery === mcpQuery && inflightPromise) {
      // channels 集合更新为 `await inflightPromise`，确保共享工具后续读取最新状态。
      channels = await inflightPromise
    } else {
      // inflightQuery更新为 `mcpQuery`，确保共享工具后续读取最新状态。
      inflightQuery = mcpQuery
      // inflightPromise 异步任务更新为 `fetchChannels(clients, mcpQuery)`，确保共享工具后续读取最新状态。
      inflightPromise = fetchChannels(clients, mcpQuery)
      // channels 集合更新为 `await inflightPromise`，确保共享工具后续读取最新状态。
      channels = await inflightPromise
      // cache.set 写入新的状态值，使共享工具后续读取保持一致。
      cache.set(mcpQuery, channels)
      // before统计`knownChannels.size`，供后续判断或组装使用。
      const before = knownChannels.size
      // 逐项读取 `channels) knownChannels.add(c` 中的c，按输入顺序推进共享工具。
      for (const c of channels) knownChannels.add(c)
      // `knownChannels.size` 与 `before` 不一致时刷新派生状态，避免使用过期结果。
      if (knownChannels.size !== before) {
        // 共享工具 slack Channel Suggestions在这里处理 `knownChannelsVersion++`，完成这一小步状态转换。
        knownChannelsVersion++
        // 调用 knownChannelsChanged.emit，触发共享工具此处需要的副作用。
        knownChannelsChanged.emit()
      }
      // 满足 `cache.size > 50` 时，共享工具执行该分支。
      if (cache.size > 50) {
        // 调用 cache.delete，触发共享工具此处需要的副作用。
        cache.delete(cache.keys().next().value!)
      }
      // 满足 `inflightQuery === mcpQuery` 时，共享工具执行该分支。
      if (inflightQuery === mcpQuery) {
        // inflightQuery更新为 `null`，确保共享工具后续读取最新状态。
        inflightQuery = null
        // inflightPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
        inflightPromise = null
      }
    }
  }

  // 返回 `channels`，作为共享工具这次计算的结果。
  return channels
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(c => c.startsWith(lower))
    .sort()
    .slice(0, 10)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(c => ({
      id: `slack-channel-${c}`,
      displayText: `#${c}`,
    }))
}

// clearSlackChannelCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSlackChannelCache(): void {
  // 调用 cache.clear，触发共享工具此处需要的副作用。
  cache.clear()
  // 调用 knownChannels.clear，触发共享工具此处需要的副作用。
  knownChannels.clear()
  // knownChannelsVersion更新为 `0`，确保共享工具后续读取最新状态。
  knownChannelsVersion = 0
  // inflightQuery更新为 `null`，确保共享工具后续读取最新状态。
  inflightQuery = null
  // inflightPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
  inflightPromise = null
}
