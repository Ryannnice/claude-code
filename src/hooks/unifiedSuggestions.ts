// 引入 Fuse，将 fuse.js 中已经封装好的能力接到本文件流程里。
import Fuse from 'fuse.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 类型依赖 { SuggestionItem } 来自 src/components/PromptInput/PromptInputFooterSuggestions.js，用于校准React hook 状态流的数据契约。
import type { SuggestionItem } from 'src/components/PromptInput/PromptInputFooterSuggestions.js'
// 引入 generateFileSuggestions，将 src/hooks/fileSuggestions.js 中已经封装好的能力接到本文件流程里。
import { generateFileSuggestions } from 'src/hooks/fileSuggestions.js'
// 类型依赖 { ServerResource } 来自 src/services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { ServerResource } from 'src/services/mcp/types.js'
// 接入 getAgentColor 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getAgentColor } from 'src/tools/AgentTool/agentColorManager.js'
// 类型依赖 { AgentDefinition } 来自 src/tools/AgentTool/loadAgentsDir.js，用于校准React hook 状态流的数据契约。
import type { AgentDefinition } from 'src/tools/AgentTool/loadAgentsDir.js'
// 复用 truncateToWidth 工具函数，把通用处理留在 src/utils/format.js 中维护。
import { truncateToWidth } from 'src/utils/format.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 类型依赖 { Theme } 来自 src/utils/theme.js，用于校准React hook 状态流的数据契约。
import type { Theme } from 'src/utils/theme.js'

// FileSuggestionSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type FileSuggestionSource = {
  type: 'file'
  displayText: string
  description?: string
  path: string
  filename: string
  score?: number
}

// McpResourceSuggestionSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type McpResourceSuggestionSource = {
  type: 'mcp_resource'
  displayText: string
  description: string
  server: string
  uri: string
  name: string
}

// AgentSuggestionSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentSuggestionSource = {
  type: 'agent'
  displayText: string
  description: string
  agentType: string
  color?: keyof Theme
}

// SuggestionSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SuggestionSource =
  | FileSuggestionSource
  | McpResourceSuggestionSource
  | AgentSuggestionSource

/**
 * Creates a unified suggestion item from a source
 */
// createSuggestionFromSource 封装unifiedSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createSuggestionFromSource(source: SuggestionSource): SuggestionItem {
  // 按照 source.type 的取值选择React hook 状态流的具体处理分支。
  switch (source.type) {
    case 'file':
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        id: `file-${source.path}`,
        displayText: source.displayText,
        description: source.description,
      }
    case 'mcp_resource':
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        id: `mcp-resource-${source.server}__${source.uri}`,
        displayText: source.displayText,
        description: source.description,
      }
    case 'agent':
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        id: `agent-${source.agentType}`,
        displayText: source.displayText,
        description: source.description,
        color: source.color,
      }
  }
}

// MAX_UNIFIED_SUGGESTIONS 集合保存`15`，供后续判断或组装使用。
const MAX_UNIFIED_SUGGESTIONS = 15
// DESCRIPTION_MAX_LENGTH 数量保存`60`，供后续判断或组装使用。
const DESCRIPTION_MAX_LENGTH = 60

// truncateDescription 封装unifiedSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateDescription(description: string): string {
  // 返回 `truncateToWidth(description, DESCRIPTION_MAX_LENGTH)`，作为React hook 状态流这次计算的结果。
  return truncateToWidth(description, DESCRIPTION_MAX_LENGTH)
}

// generateAgentSuggestions 封装unifiedSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateAgentSuggestions(
  agents: AgentDefinition[],
  query: string,
  showOnEmpty = false,
): AgentSuggestionSource[] {
  // 组合条件 `!query && !showOnEmpty` 成立时，React hook 状态流才启用这条专门路径。
  if (!query && !showOnEmpty) {
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // 这个回调绑定到 const agentSources: AgentSuggestionSource[] = agents.map(agent => ({，负责React hook 状态流在该局部场景下的响应。
    const agentSources: AgentSuggestionSource[] = agents.map(agent => ({
      type: 'agent' as const,
      displayText: `${agent.agentType} (agent)`,
      description: truncateDescription(agent.whenToUse),
      agentType: agent.agentType,
      color: getAgentColor(agent.agentType),
    }))

    // query缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!query) {
      // 返回 `agentSources`，作为React hook 状态流这次计算的结果。
      return agentSources
    }

    // queryLower保存`query.toLowerCase`，供React hook后续处理使用。
    const queryLower = query.toLowerCase()
    // 返回 `agentSources.filter(`，作为React hook 状态流这次计算的结果。
    return agentSources.filter(
      // agent更新为 `>`，确保unifiedSuggestions后续读取最新状态。
      agent =>
        agent.agentType.toLowerCase().includes(queryLower) ||
        agent.displayText.toLowerCase().includes(queryLower),
    )
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }
}

// generateUnifiedSuggestions 封装unifiedSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateUnifiedSuggestions(
  query: string,
  mcpResources: Record<string, ServerResource[]>,
  agents: AgentDefinition[],
  showOnEmpty = false,
): Promise<SuggestionItem[]> {
  // 组合条件 `!query && !showOnEmpty` 成立时，React hook 状态流才启用这条专门路径。
  if (!query && !showOnEmpty) {
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }

  // 并行获取 fileSuggestions、agentSources，缩短React hook unified Suggestions等待多个独立异步任务的时间。
  const [fileSuggestions, agentSources] = await Promise.all([
    generateFileSuggestions(query, showOnEmpty),
    Promise.resolve(generateAgentSuggestions(agents, query, showOnEmpty)),
  ])

  // fileSources 文件数据派生`fileSuggestions.map(`，作为后续集合派生结果处理的输入。
  const fileSources: FileSuggestionSource[] = fileSuggestions.map(
    // suggestion更新为 `> ({`，确保unifiedSuggestions后续读取最新状态。
    suggestion => ({
      type: 'file' as const,
      displayText: suggestion.displayText,
      description: suggestion.description,
      path: suggestion.displayText, // Use displayText as path for files
      filename: basename(suggestion.displayText),
      score: (suggestion.metadata as { score?: number } | undefined)?.score,
    }),
  )

  // mcpSources 集合派生`Object.values(mcpResources)`，供后续判断或组装使用。
  const mcpSources: McpResourceSuggestionSource[] = Object.values(mcpResources)
    .flat()
    // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
    .map(resource => ({
      type: 'mcp_resource' as const,
      displayText: `${resource.server}:${resource.uri}`,
      description: truncateDescription(
        resource.description || resource.name || resource.uri,
      ),
      server: resource.server,
      uri: resource.uri,
      name: resource.name || resource.uri,
    }))

  // query缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!query) {
    // allSources 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const allSources = [...fileSources, ...mcpSources, ...agentSources]
    // 返回 `allSources`，作为React hook 状态流这次计算的结果。
    return allSources
      .slice(0, MAX_UNIFIED_SUGGESTIONS)
      .map(createSuggestionFromSource)
  }

  // nonFileSources 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const nonFileSources: SuggestionSource[] = [...mcpSources, ...agentSources]

  // Score non-file sources with Fuse.js
  // File sources are already scored by Rust/nucleo
  // ScoredSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
  type ScoredSource = { source: SuggestionSource; score: number }
  // scoredResults 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const scoredResults: ScoredSource[] = []

  // Add file sources with their nucleo scores (already 0-1, lower is better)
  // 按顺序遍历 `fileSources` 中的fileSource 文件数据，逐个交给React hook处理。
  for (const fileSource of fileSources) {
    // scoredResults 集合追加新条目，保持收集顺序与输入顺序一致。
    scoredResults.push({
      source: fileSource,
      score: fileSource.score ?? 0.5, // Default to middle score if missing
    })
  }

  // Score non-file sources with Fuse.js and add them
  // 满足 `nonFileSources.length > 0` 时，React hook执行该分支。
  if (nonFileSources.length > 0) {
    // fuse保存`Fuse`，供React hook后续处理使用。
    const fuse = new Fuse(nonFileSources, {
      includeScore: true,
      threshold: 0.6, // Allow more matches through, we'll sort by score
      keys: [
        { name: 'displayText', weight: 2 },
        { name: 'name', weight: 3 },
        { name: 'server', weight: 1 },
        { name: 'description', weight: 1 },
        { name: 'agentType', weight: 3 },
      ],
    })

    // fuseResults 集合保存`fuse.search`，供React hook后续处理使用。
    const fuseResults = fuse.search(query, { limit: MAX_UNIFIED_SUGGESTIONS })
    // 按顺序遍历 `fuseResults` 中的结果，逐个交给React hook处理。
    for (const result of fuseResults) {
      // scoredResults 集合追加新条目，保持收集顺序与输入顺序一致。
      scoredResults.push({
        source: result.item,
        score: result.score ?? 0.5,
      })
    }
  }

  // Sort all results by score (lower is better) and return top results
  // 调用 scoredResults.sort，触发React hook此处需要的副作用。
  scoredResults.sort((a, b) => a.score - b.score)

  // 返回 `scoredResults`，作为React hook 状态流这次计算的结果。
  return scoredResults
    .slice(0, MAX_UNIFIED_SUGGESTIONS)
    // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
    .map(r => r.source)
    .map(createSuggestionFromSource)
}
