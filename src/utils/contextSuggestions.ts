// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../tools/FileReadTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from '../tools/WebFetchTool/prompt.js'
// 类型依赖 { ContextData } 来自 ./analyzeContext.js，用于校准共享工具的数据契约。
import type { ContextData } from './analyzeContext.js'
// 引入 getDisplayPath，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getDisplayPath } from './file.js'
// 引入 formatTokens，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatTokens } from './format.js'

// --

// SuggestionSeverity 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SuggestionSeverity = 'info' | 'warning'

// ContextSuggestion 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContextSuggestion = {
  severity: SuggestionSeverity
  title: string
  detail: string
  /** Estimated tokens that could be saved */
  savingsTokens?: number
}

// Thresholds for triggering suggestions
// LARGE_TOOL_RESULT_PERCENT保存`15 // tool results > 15% of context`，供后续判断或组装使用。
const LARGE_TOOL_RESULT_PERCENT = 15 // tool results > 15% of context
// LARGE_TOOL_RESULT_TOKENS 集合 命名 `10_000`，让后续代码直接表达这个值的用途。
const LARGE_TOOL_RESULT_TOKENS = 10_000
// READ_BLOAT_PERCENT保存`5 // Read results > 5% of context`，供后续判断或组装使用。
const READ_BLOAT_PERCENT = 5 // Read results > 5% of context
// NEAR_CAPACITY_PERCENT 命名 `80`，让后续代码直接表达这个值的用途。
const NEAR_CAPACITY_PERCENT = 80
// MEMORY_HIGH_PERCENT 命名 `5`，让后续代码直接表达这个值的用途。
const MEMORY_HIGH_PERCENT = 5
// MEMORY_HIGH_TOKENS 集合保存`5_000`，供共享工具 context Suggestions后续判断或输出使用。
const MEMORY_HIGH_TOKENS = 5_000

// --

// generateContextSuggestions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateContextSuggestions(
  data: ContextData,
): ContextSuggestion[] {
  // suggestions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const suggestions: ContextSuggestion[] = []

  // 调用 checkNearCapacity，触发共享工具此处需要的副作用。
  checkNearCapacity(data, suggestions)
  // 调用 checkLargeToolResults，触发共享工具此处需要的副作用。
  checkLargeToolResults(data, suggestions)
  // 调用 checkReadResultBloat，触发共享工具此处需要的副作用。
  checkReadResultBloat(data, suggestions)
  // 调用 checkMemoryBloat，触发共享工具此处需要的副作用。
  checkMemoryBloat(data, suggestions)
  // 调用 checkAutoCompactDisabled，触发共享工具此处需要的副作用。
  checkAutoCompactDisabled(data, suggestions)

  // Sort: warnings first, then by savings descending
  // 调用 suggestions.sort，触发共享工具此处需要的副作用。
  suggestions.sort((a, b) => {
    // `a.severity` 与 `b.severity` 不一致时刷新派生状态，避免使用过期结果。
    if (a.severity !== b.severity) {
      // 返回 `a.severity === 'warning' ? -1 : 1`，作为共享工具这次计算的结果。
      return a.severity === 'warning' ? -1 : 1
    }
    // 返回 `(b.savingsTokens ?? 0) - (a.savingsTokens ?? 0)`，作为共享工具这次计算的结果。
    return (b.savingsTokens ?? 0) - (a.savingsTokens ?? 0)
  })

  // 返回 `suggestions`，作为共享工具这次计算的结果。
  return suggestions
}

// --

// checkNearCapacity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkNearCapacity(
  data: ContextData,
  suggestions: ContextSuggestion[],
): void {
  // 满足 `data.percentage >= NEAR_CAPACITY_PERCENT` 时，共享工具执行该分支。
  if (data.percentage >= NEAR_CAPACITY_PERCENT) {
    // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
    suggestions.push({
      severity: 'warning',
      title: `Context is ${data.percentage}% full`,
      detail: data.isAutoCompactEnabled
        ? 'Autocompact will trigger soon, which discards older messages. Use /compact now to control what gets kept.'
        : 'Autocompact is disabled. Use /compact to free space, or enable autocompact in /config.',
    })
  }
}

// checkLargeToolResults 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkLargeToolResults(
  data: ContextData,
  suggestions: ContextSuggestion[],
): void {
  // data.messageBreakdown 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!data.messageBreakdown) return

  // 按顺序遍历 `data.messageBreakdown.toolCallsByTy` 中的工具，逐个交给共享工具处理。
  for (const tool of data.messageBreakdown.toolCallsByType) {
    // totalToolTokens 集合保存`tool.callTokens + tool.resultTokens`，供共享工具 context Suggestions后续判断或输出使用。
    const totalToolTokens = tool.callTokens + tool.resultTokens
    // percent 命名 `(totalToolTokens / data.rawMaxTokens) * 100`，让后续代码直接表达这个值的用途。
    const percent = (totalToolTokens / data.rawMaxTokens) * 100

    // 共享工具在这里按实际状态进入对应分支。
    if (
      percent < LARGE_TOOL_RESULT_PERCENT ||
      totalToolTokens < LARGE_TOOL_RESULT_TOKENS
    ) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // suggestion读取`getLargeToolSuggestion`，供共享工具后续处理使用。
    const suggestion = getLargeToolSuggestion(
      tool.name,
      totalToolTokens,
      percent,
    )
    // 满足 `suggestion` 时，共享工具执行该分支。
    if (suggestion) {
      // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
      suggestions.push(suggestion)
    }
  }
}

// getLargeToolSuggestion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLargeToolSuggestion(
  toolName: string,
  tokens: number,
  percent: number,
): ContextSuggestion | null {
  // tokenStr格式化`formatTokens`，供共享工具后续处理使用。
  const tokenStr = formatTokens(tokens)

  // 按照 toolName 的取值选择共享工具的具体处理分支。
  switch (toolName) {
    case BASH_TOOL_NAME:
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        severity: 'warning',
        title: `Bash results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail:
          'Pipe output through head, tail, or grep to reduce result size. Avoid cat on large files \u2014 use Read with offset/limit instead.',
        savingsTokens: Math.floor(tokens * 0.5),
      }
    case FILE_READ_TOOL_NAME:
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        severity: 'info',
        title: `Read results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail:
          'Use offset and limit parameters to read only the sections you need. Avoid re-reading entire files when you only need a few lines.',
        savingsTokens: Math.floor(tokens * 0.3),
      }
    case GREP_TOOL_NAME:
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        severity: 'info',
        title: `Grep results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail:
          'Add more specific patterns or use the glob or type parameter to narrow file types. Consider Glob for file discovery instead of Grep.',
        savingsTokens: Math.floor(tokens * 0.3),
      }
    case WEB_FETCH_TOOL_NAME:
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        severity: 'info',
        title: `WebFetch results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail:
          'Web page content can be very large. Consider extracting only the specific information needed.',
        savingsTokens: Math.floor(tokens * 0.4),
      }
    default:
      // 满足 `percent >= 20` 时，共享工具执行该分支。
      if (percent >= 20) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          severity: 'info',
          title: `${toolName} using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
          detail: `This tool is consuming a significant portion of context.`,
          savingsTokens: Math.floor(tokens * 0.2),
        }
      }
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}

// checkReadResultBloat 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkReadResultBloat(
  data: ContextData,
  suggestions: ContextSuggestion[],
): void {
  // data.messageBreakdown 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!data.messageBreakdown) return

  // callsByType保存`data.messageBreakdown.toolCallsByType`，供后续判断或组装使用。
  const callsByType = data.messageBreakdown.toolCallsByType
  // readTool筛选`callsByType.find`，供共享工具后续处理使用。
  const readTool = callsByType.find(t => t.name === FILE_READ_TOOL_NAME)
  // readTool缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!readTool) return

  // totalReadTokens 集合 命名 `readTool.callTokens + readTool.resultTokens`，让后续代码直接表达这个值的用途。
  const totalReadTokens = readTool.callTokens + readTool.resultTokens
  // totalReadPercent 命名 `(totalReadTokens / data.rawMaxTokens) * 100`，让后续代码直接表达这个值的用途。
  const totalReadPercent = (totalReadTokens / data.rawMaxTokens) * 100
  // readPercent 命名 `(readTool.resultTokens / data.rawMaxTokens) * 100`，让后续代码直接表达这个值的用途。
  const readPercent = (readTool.resultTokens / data.rawMaxTokens) * 100

  // Skip if already covered by checkLargeToolResults (>= 15% band)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    totalReadPercent >= LARGE_TOOL_RESULT_PERCENT &&
    totalReadTokens >= LARGE_TOOL_RESULT_TOKENS
  ) {
    // 共享工具 context Suggestions在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    readPercent >= READ_BLOAT_PERCENT &&
    readTool.resultTokens >= LARGE_TOOL_RESULT_TOKENS
  ) {
    // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
    suggestions.push({
      severity: 'info',
      title: `File reads using ${formatTokens(readTool.resultTokens)} tokens (${readPercent.toFixed(0)}%)`,
      detail:
        'If you are re-reading files, consider referencing earlier reads. Use offset/limit for large files.',
      savingsTokens: Math.floor(readTool.resultTokens * 0.3),
    })
  }
}

// checkMemoryBloat 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkMemoryBloat(
  data: ContextData,
  suggestions: ContextSuggestion[],
): void {
  // totalMemoryTokens 集合派生`memoryFiles.reduce`，供共享工具后续处理使用。
  const totalMemoryTokens = data.memoryFiles.reduce(
    // 这个回调绑定到 (sum, f) => sum + f.tokens,，负责共享工具在该局部场景下的响应。
    (sum, f) => sum + f.tokens,
    0,
  )
  // memoryPercent 命名 `(totalMemoryTokens / data.rawMaxTokens) * 100`，让后续代码直接表达这个值的用途。
  const memoryPercent = (totalMemoryTokens / data.rawMaxTokens) * 100

  // 共享工具在这里按实际状态进入对应分支。
  if (
    memoryPercent >= MEMORY_HIGH_PERCENT &&
    totalMemoryTokens >= MEMORY_HIGH_TOKENS
  ) {
    // largestFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
    const largestFiles = [...data.memoryFiles]
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 3)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(f => {
        // 名称读取`getDisplayPath`，供共享工具后续处理使用。
        const name = getDisplayPath(f.path)
        // 返回 ``${name} (${formatTokens(f.tokens)})``，作为共享工具这次计算的结果。
        return `${name} (${formatTokens(f.tokens)})`
      })
      .join(', ')

    // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
    suggestions.push({
      severity: 'info',
      title: `Memory files using ${formatTokens(totalMemoryTokens)} tokens (${memoryPercent.toFixed(0)}%)`,
      detail: `Largest: ${largestFiles}. Use /memory to review and prune stale entries.`,
      savingsTokens: Math.floor(totalMemoryTokens * 0.3),
    })
  }
}

// checkAutoCompactDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkAutoCompactDisabled(
  data: ContextData,
  suggestions: ContextSuggestion[],
): void {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !data.isAutoCompactEnabled &&
    data.percentage >= 50 &&
    data.percentage < NEAR_CAPACITY_PERCENT
  ) {
    // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
    suggestions.push({
      severity: 'info',
      title: 'Autocompact is disabled',
      detail:
        'Without autocompact, you will hit context limits and lose the conversation. Enable it in /config or use /compact manually.',
    })
  }
}
