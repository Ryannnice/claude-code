// 类型依赖 { LogOption, SerializedMessage } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { LogOption, SerializedMessage } from '../types/logs.js'
// 引入 count，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { count } from './array.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getLogDisplayTitle、logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { getLogDisplayTitle, logError } from './log.js'
// 引入 getSmallFastModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getSmallFastModel } from './model/model.js'
// 引入 isLiteLog、loadFullLog，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { isLiteLog, loadFullLog } from './sessionStorage.js'
// 引入 sideQuery，将 ./sideQuery.js 中已经封装好的能力接到本文件流程里。
import { sideQuery } from './sideQuery.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

// Limits for transcript extraction
// MAX_TRANSCRIPT_CHARS 集合保存`2000 // Max chars of transcript per session`，供共享工具 agentic Session Search后续判断或输出使用。
const MAX_TRANSCRIPT_CHARS = 2000 // Max chars of transcript per session
// MAX_MESSAGES_TO_SCAN 消息数据保存`100 // Max messages to scan from start/end`，供后续判断或组装使用。
const MAX_MESSAGES_TO_SCAN = 100 // Max messages to scan from start/end
// MAX_SESSIONS_TO_SEARCH 会话数据保存`100 // Max sessions to send to the API`，供后续判断或组装使用。
const MAX_SESSIONS_TO_SEARCH = 100 // Max sessions to send to the API

// SESSION_SEARCH_SYSTEM_PROMPT 会话数据 命名 ``Your goal is to find relevant sessions based on a user's...`，让后续代码直接表达这个值的用途。
const SESSION_SEARCH_SYSTEM_PROMPT = `Your goal is to find relevant sessions based on a user's search query.

You will be given a list of sessions with their metadata and a search query. Identify which sessions are most relevant to the query.

Each session may include:
- Title (display name or custom title)
- Tag (user-assigned category, shown as [tag: name] - users tag sessions with /tag command to categorize them)
- Branch (git branch name, shown as [branch: name])
- Summary (AI-generated summary)
- First message (beginning of the conversation)
- Transcript (excerpt of conversation content)

IMPORTANT: Tags are user-assigned labels that indicate the session's topic or category. If the query matches a tag exactly or partially, those sessions should be highly prioritized.

For each session, consider (in order of priority):
1. Exact tag matches (highest priority - user explicitly categorized this session)
2. Partial tag matches or tag-related terms
3. Title matches (custom titles or first message content)
4. Branch name matches
5. Summary and transcript content matches
6. Semantic similarity and related concepts

CRITICAL: Be VERY inclusive in your matching. Include sessions that:
- Contain the query term anywhere in any field
- Are semantically related to the query (e.g., "testing" matches sessions about "tests", "unit tests", "QA", etc.)
- Discuss topics that could be related to the query
- Have transcripts that mention the concept even in passing

When in doubt, INCLUDE the session. It's better to return too many results than too few. The user can easily scan through results, but missing relevant sessions is frustrating.

Return sessions ordered by relevance (most relevant first). If truly no sessions have ANY connection to the query, return an empty array - but this should be rare.

Respond with ONLY the JSON object, no markdown formatting:
{"relevant_indices": [2, 5, 0]}`

// AgenticSearchResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AgenticSearchResult = {
  relevant_indices: number[]
}

/**
 * Extracts searchable text content from a message.
 */
// extractMessageText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractMessageText(message: SerializedMessage): string {
  // `message.type` 与 `'user' && message.type !== 'assi` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'user' && message.type !== 'assistant') {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 文本内容保存`'message' in message ? message.message?.content : undefin...`，作为后续固定文本处理的输入。
  const content = 'message' in message ? message.message?.content : undefined
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return ''

  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  }

  // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
  if (Array.isArray(content)) {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(block => {
        // 当 `typeof block` 匹配 `'string'` 时，共享工具执行对应分支。
        if (typeof block === 'string') return block
        // 当 `'text' in block && typeof block.text` 匹配 `'string'` 时，共享工具执行对应分支。
        if ('text' in block && typeof block.text === 'string') return block.text
        // 返回空字符串表示没有可用文本，调用方会按空输入处理。
        return ''
      })
      .filter(Boolean)
      .join(' ')
  }

  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Extracts a truncated transcript from session messages.
 */
// extractTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractTranscript(messages: SerializedMessage[]): string {
  // 对话消息为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (messages.length === 0) return ''

  // Take messages from start and end to get context
  // messagesToScan 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const messagesToScan =
    messages.length <= MAX_MESSAGES_TO_SCAN
      ? messages
      : [
          ...messages.slice(0, MAX_MESSAGES_TO_SCAN / 2),
          ...messages.slice(-MAX_MESSAGES_TO_SCAN / 2),
        ]

  // 文本 命名 `messagesToScan`，让后续代码直接表达这个值的用途。
  const text = messagesToScan
    .map(extractMessageText)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 返回 `text.length > MAX_TRANSCRIPT_CHARS`，作为共享工具这次计算的结果。
  return text.length > MAX_TRANSCRIPT_CHARS
    ? text.slice(0, MAX_TRANSCRIPT_CHARS) + '…'
    : text
}

/**
 * Checks if a log contains the query term in any searchable field.
 */
// logContainsQuery 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logContainsQuery(log: LogOption, queryLower: string): boolean {
  // Check title
  // title 标题读取`getLogDisplayTitle`，供共享工具后续处理使用。
  const title = getLogDisplayTitle(log).toLowerCase()
  // 满足 `title.includes(queryLower)` 时，共享工具执行该分支。
  if (title.includes(queryLower)) return true

  // Check custom title
  // 满足 `log.customTitle?.toLowerCase().includes(queryLower)` 时，共享工具执行该分支。
  if (log.customTitle?.toLowerCase().includes(queryLower)) return true

  // Check tag
  // 满足 `log.tag?.toLowerCase().includes(queryLower)` 时，共享工具执行该分支。
  if (log.tag?.toLowerCase().includes(queryLower)) return true

  // Check branch
  // 满足 `log.gitBranch?.toLowerCase().includes(queryLower)` 时，共享工具执行该分支。
  if (log.gitBranch?.toLowerCase().includes(queryLower)) return true

  // Check summary
  // 满足 `log.summary?.toLowerCase().includes(queryLower)` 时，共享工具执行该分支。
  if (log.summary?.toLowerCase().includes(queryLower)) return true

  // Check first prompt
  // 满足 `log.firstPrompt?.toLowerCase().includes(queryLower)` 时，共享工具执行该分支。
  if (log.firstPrompt?.toLowerCase().includes(queryLower)) return true

  // Check transcript (more expensive, do last)
  // 只有 `log.messages && log.messages.length > 0` 满足时，共享工具才执行该分支。
  if (log.messages && log.messages.length > 0) {
    // transcript保存`extractTranscript`，供共享工具后续处理使用。
    const transcript = extractTranscript(log.messages).toLowerCase()
    // 满足 `transcript.includes(queryLower)` 时，共享工具执行该分支。
    if (transcript.includes(queryLower)) return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Performs an agentic search using Claude to find relevant sessions
 * based on semantic understanding of the query.
 */
// agenticSessionSearch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function agenticSessionSearch(
  query: string,
  logs: LogOption[],
  signal?: AbortSignal,
): Promise<LogOption[]> {
  // !query.trim() || logs 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!query.trim() || logs.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // queryLower保存`query.toLowerCase`，供共享工具后续处理使用。
  const queryLower = query.toLowerCase()

  // Pre-filter: find sessions that contain the query term
  // This ensures we search relevant sessions, not just recent ones
  // matchingLogs 集合筛选`logs.filter`，供共享工具后续处理使用。
  const matchingLogs = logs.filter(log => logContainsQuery(log, queryLower))

  // Take up to MAX_SESSIONS_TO_SEARCH matching logs
  // If fewer matches, fill remaining slots with recent non-matching logs for context
  // logsToSearch 先占位，稍后的条件分支会根据实际输入补齐它。
  let logsToSearch: LogOption[]
  // 满足 `matchingLogs.length >= MAX_SESSIONS_TO_SEARCH` 时，共享工具执行该分支。
  if (matchingLogs.length >= MAX_SESSIONS_TO_SEARCH) {
    // logsToSearch更新为 `matchingLogs.slice(0, MAX_SESSIONS_TO_SEARCH)`，确保共享工具后续读取最新状态。
    logsToSearch = matchingLogs.slice(0, MAX_SESSIONS_TO_SEARCH)
  } else {
    // nonMatchingLogs 集合筛选`logs.filter`，供共享工具后续处理使用。
    const nonMatchingLogs = logs.filter(
      // log更新为 `> !logContainsQuery(log, queryLower)`，确保共享工具后续读取最新状态。
      log => !logContainsQuery(log, queryLower),
    )
    // remainingSlots 集合记录 `MAX_SESSIONS_TO_SEARCH - matchingLogs.length` 是否成立，下一步按该结果分支。
    const remainingSlots = MAX_SESSIONS_TO_SEARCH - matchingLogs.length
    // logsToSearch更新为 `[`，确保共享工具后续读取最新状态。
    logsToSearch = [
      ...matchingLogs,
      ...nonMatchingLogs.slice(0, remainingSlots),
    ]
  }

  // Debug: log what data we have
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Agentic search: ${logsToSearch.length}/${logs.length} logs, query="${query}", ` +
      // 这个回调绑定到 `matching: ${matchingLogs.length}, with messages: ${count(logsToSearch, l => l.messa…，负责共享工具在该局部场景下的响应。
      `matching: ${matchingLogs.length}, with messages: ${count(logsToSearch, l => l.messages?.length > 0)}`,
  )

  // Load full logs for lite logs to get transcript content
  // logsWithTranscriptsPromises 集合派生`logsToSearch.map`，供共享工具后续处理使用。
  const logsWithTranscriptsPromises = logsToSearch.map(async log => {
    // 满足 `isLiteLog(log)` 时，共享工具执行该分支。
    if (isLiteLog(log)) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待并返回 `loadFullLog(log)`，调用方直接接收异步结果。
        return await loadFullLog(log)
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error as Error)
        // If loading fails, use the lite log (no transcript)
        // 返回 `log`，作为共享工具这次计算的结果。
        return log
      }
    }
    // 返回 `log`，作为共享工具这次计算的结果。
    return log
  })
  // logsWithTranscripts 集合保存`Promise.all`，供共享工具后续处理使用。
  const logsWithTranscripts = await Promise.all(logsWithTranscriptsPromises)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    // 这个回调绑定到 `Agentic search: loaded ${count(logsWithTranscripts, l => l.messages?.length > 0)}/$…，负责共享工具在该局部场景下的响应。
    `Agentic search: loaded ${count(logsWithTranscripts, l => l.messages?.length > 0)}/${logsToSearch.length} logs with transcripts`,
  )

  // Build session list for the prompt with all searchable metadata
  // sessionList 会话数据保存`logsWithTranscripts`，供后续判断或组装使用。
  const sessionList = logsWithTranscripts
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map((log, index) => {
      // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
      const parts: string[] = [`${index}:`]

      // Title (display title, may be custom or from first prompt)
      // displayTitle 标题读取`getLogDisplayTitle`，供共享工具后续处理使用。
      const displayTitle = getLogDisplayTitle(log)
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(displayTitle)

      // Custom title if different from display title
      // `log.customTitle && log.customTitle` 与 `displayTit` 不一致时刷新派生状态，避免使用过期结果。
      if (log.customTitle && log.customTitle !== displayTitle) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`[custom title: ${log.customTitle}]`)
      }

      // Tag
      // 满足 `log.tag` 时，共享工具执行该分支。
      if (log.tag) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`[tag: ${log.tag}]`)
      }

      // Git branch
      // 满足 `log.gitBranch` 时，共享工具执行该分支。
      if (log.gitBranch) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`[branch: ${log.gitBranch}]`)
      }

      // Summary
      // 满足 `log.summary` 时，共享工具执行该分支。
      if (log.summary) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`- Summary: ${log.summary}`)
      }

      // First prompt content (truncated)
      // `log.firstPrompt && log.firstPrompt` 与 `'No prompt'` 不一致时刷新派生状态，避免使用过期结果。
      if (log.firstPrompt && log.firstPrompt !== 'No prompt') {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`- First message: ${log.firstPrompt.slice(0, 300)}`)
      }

      // Transcript excerpt (if messages are available)
      // 只有 `log.messages && log.messages.length > 0` 满足时，共享工具才执行该分支。
      if (log.messages && log.messages.length > 0) {
        // transcript保存`extractTranscript`，供共享工具后续处理使用。
        const transcript = extractTranscript(log.messages)
        // 满足 `transcript` 时，共享工具执行该分支。
        if (transcript) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(`- Transcript: ${transcript}`)
        }
      }

      // 返回 `parts.join(' ')`，作为共享工具这次计算的结果。
      return parts.join(' ')
    })
    .join('\n')

  // userMessage 消息数据保存``Sessions:`，作为后续固定文本处理的输入。
  const userMessage = `Sessions:
${sessionList}

Search query: "${query}"

Find the sessions that are most relevant to this query.`

  // Debug: log first part of the session list
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Agentic search prompt (first 500 chars): ${userMessage.slice(0, 500)}...`,
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 模型名称读取`getSmallFastModel`，供共享工具后续处理使用。
    const model = getSmallFastModel()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Agentic search using model: ${model}`)

    // 接口响应保存`sideQuery`，供共享工具后续处理使用。
    const response = await sideQuery({
      model,
      system: SESSION_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      signal,
      querySource: 'session_search',
    })

    // Extract the text content from the response
    // textContent筛选`content.find`，供共享工具后续处理使用。
    const textContent = response.content.find(block => block.type === 'text')
    // `!textContent || textContent.type` 与 `'text'` 不一致时刷新派生状态，避免使用过期结果。
    if (!textContent || textContent.type !== 'text') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('No text content in agentic search response')
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }

    // Debug: log the response
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Agentic search response: ${textContent.text}`)

    // Parse the JSON response
    // jsonMatch匹配`text.match`，供共享工具后续处理使用。
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    // jsonMatch缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!jsonMatch) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Could not find JSON in agentic search response')
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }

    // 结果解析`jsonParse(jsonMatch[0])` 整理出中间结果，供共享工具 agentic Session Search后续步骤使用。
    const result: AgenticSearchResult = jsonParse(jsonMatch[0])
    // relevantIndices 集合标记共享工具 agentic Session Search是否启用对应路径。
    const relevantIndices = result.relevant_indices || []

    // Map indices back to logs (indices are relative to logsWithTranscripts)
    // relevantLogs 集合 命名 `relevantIndices`，让后续代码直接表达这个值的用途。
    const relevantLogs = relevantIndices
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(index => index >= 0 && index < logsWithTranscripts.length)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(index => logsWithTranscripts[index]!)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Agentic search found ${relevantLogs.length} relevant sessions`,
    )

    // 返回 `relevantLogs`，作为共享工具这次计算的结果。
    return relevantLogs
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Agentic search error: ${error}`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}
