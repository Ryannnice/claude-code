// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join, sep } from 'path'
// 类型依赖 { ModelUsage } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { ModelUsage } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { Entry, TranscriptMessage } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { Entry, TranscriptMessage } from '../types/logs.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage、isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isENOENT } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 readJSONLFile，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { readJSONLFile } from './json.js'
// 引入 SYNTHETIC_MODEL，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { SYNTHETIC_MODEL } from './messages.js'
// 引入 getProjectsDir、isTranscriptMessage，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getProjectsDir, isTranscriptMessage } from './sessionStorage.js'
// 引入 SHELL_TOOL_NAMES，将 ./shell/shellToolUtils.js 中已经封装好的能力接到本文件流程里。
import { SHELL_TOOL_NAMES } from './shell/shellToolUtils.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getTodayDateString,
  getYesterdayDateString,
  isDateBefore,
  loadStatsCache,
  mergeCacheWithNewStats,
  type PersistedStatsCache,
  saveStatsCache,
  toDateString,
  withStatsCacheLock,
} from './statsCache.js'

// DailyActivity 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DailyActivity = {
  date: string // YYYY-MM-DD format
  messageCount: number
  sessionCount: number
  toolCallCount: number
}

// DailyModelTokens 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DailyModelTokens = {
  date: string // YYYY-MM-DD format
  tokensByModel: { [modelName: string]: number } // total tokens (input + output) per model
}

// StreakInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type StreakInfo = {
  currentStreak: number
  longestStreak: number
  currentStreakStart: string | null
  longestStreakStart: string | null
  longestStreakEnd: string | null
}

// SessionStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionStats = {
  sessionId: string
  duration: number // in milliseconds
  messageCount: number
  timestamp: string
}

// ClaudeCodeStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeCodeStats = {
  // Activity overview
  totalSessions: number
  totalMessages: number
  totalDays: number
  activeDays: number

  // Streaks
  streaks: StreakInfo

  // Daily activity for heatmap
  dailyActivity: DailyActivity[]

  // Daily token usage per model for charts
  dailyModelTokens: DailyModelTokens[]

  // Session info
  longestSession: SessionStats | null

  // Model usage aggregated
  modelUsage: { [modelName: string]: ModelUsage }

  // Time stats
  firstSessionDate: string | null
  lastSessionDate: string | null
  peakActivityDay: string | null
  peakActivityHour: number | null

  // Speculation time saved
  totalSpeculationTimeSavedMs: number

  // Shot stats (ant-only, gated by SHOT_STATS feature flag)
  shotDistribution?: { [shotCount: number]: number }
  oneShotRate?: number
}

/**
 * Result of processing session files - intermediate stats that can be merged.
 */
// ProcessedStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ProcessedStats = {
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  modelUsage: { [modelName: string]: ModelUsage }
  sessionStats: SessionStats[]
  hourCounts: { [hour: number]: number }
  totalMessages: number
  totalSpeculationTimeSavedMs: number
  shotDistribution?: { [shotCount: number]: number }
}

/**
 * Options for processing session files.
 */
// ProcessOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ProcessOptions = {
  // Only include data from dates >= this date (YYYY-MM-DD format)
  fromDate?: string
  // Only include data from dates <= this date (YYYY-MM-DD format)
  toDate?: string
}

/**
 * Process session files and extract stats.
 * Can filter by date range.
 */
// processSessionFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processSessionFiles(
  sessionFiles: string[],
  options: ProcessOptions = {},
): Promise<ProcessedStats> {
  // 从 `options` 解构 fromDate、toDate，减少共享工具 stats对同一对象的重复访问。
  const { fromDate, toDate } = options
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // dailyActivityMap构建`new Map<string, DailyActivity>()` 整理出中间结果，供共享工具 stats后续步骤使用。
  const dailyActivityMap = new Map<string, DailyActivity>()
  // dailyModelTokensMap 命名 `new Map<string, { [modelName: string]: number }>()`，让后续代码直接表达这个值的用途。
  const dailyModelTokensMap = new Map<string, { [modelName: string]: number }>()
  // sessions 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sessions: SessionStats[] = []
  // hourCounts 数量 命名 `new Map<number, number>()`，让后续代码直接表达这个值的用途。
  const hourCounts = new Map<number, number>()
  // totalMessages 消息数据保存`0`，供共享工具 stats后续判断或输出使用。
  let totalMessages = 0
  // totalSpeculationTimeSavedMs 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let totalSpeculationTimeSavedMs = 0
  // modelUsageAgg 从空对象开始收集键值，后续按名称补齐内容。
  const modelUsageAgg: { [modelName: string]: ModelUsage } = {}
  // shotDistributionMap保存`feature`，供共享工具后续处理使用。
  const shotDistributionMap = feature('SHOT_STATS')
    ? new Map<number, number>()
    : undefined
  // Track parent sessions that already recorded a shot count (dedup across subagents)
  // sessionsWithShotCount 会话数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const sessionsWithShotCount = new Set<string>()

  // Process session files in parallel batches for better performance
  // BATCH_SIZE保存`20`，供后续判断或组装使用。
  const BATCH_SIZE = 20
  // 循环处理 `let i = 0; i < sessionFiles.length; i += BATCH_SI`，让共享工具逐项把同类条目按顺序走完。
  for (let i = 0; i < sessionFiles.length; i += BATCH_SIZE) {
    // batch格式化`sessionFiles.slice`，供共享工具后续处理使用。
    const batch = sessionFiles.slice(i, i + BATCH_SIZE)
    // 结果列表保存`Promise.all`，供共享工具后续处理使用。
    const results = await Promise.all(
      // 调用 batch.map，触发共享工具此处需要的副作用。
      batch.map(async sessionFile => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // If we have a fromDate filter, skip files that haven't been modified since then
          // 满足 `fromDate` 时，共享工具执行该分支。
          if (fromDate) {
            // fileSize 文件数据保存`0`，供后续判断或组装使用。
            let fileSize = 0
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // fileStat 文件数据保存`fs.stat`，供共享工具后续处理使用。
              const fileStat = await fs.stat(sessionFile)
              // fileModifiedDate 文件数据记录时间`toDateString`，供共享工具后续处理使用。
              const fileModifiedDate = toDateString(fileStat.mtime)
              // 满足 `isDateBefore(fileModifiedDate, fromDate)` 时，共享工具执行该分支。
              if (isDateBefore(fileModifiedDate, fromDate)) {
                // 返回结构化结果，集中表达共享工具已经整理出的状态。
                return {
                  sessionFile,
                  entries: null,
                  error: null,
                  skipped: true,
                }
              }
              // fileSize 文件数据更新为 `fileStat.size`，确保共享工具后续读取最新状态。
              fileSize = fileStat.size
            } catch {
              // If we can't stat the file, try to read it anyway
            }
            // For large files, peek at the session start date before reading everything.
            // Sessions that pass the mtime filter but started before fromDate are skipped
            // (e.g. a month-old session resumed today gets a new mtime write but old start date).
            // 满足 `fileSize > 65536` 时，共享工具执行该分支。
            if (fileSize > 65536) {
              // startDate读取`readSessionStartDate`，供共享工具后续处理使用。
              const startDate = await readSessionStartDate(sessionFile)
              // 只有 `startDate && isDateBefore(startDate, fromDate)` 满足时，共享工具才执行该分支。
              if (startDate && isDateBefore(startDate, fromDate)) {
                // 返回结构化结果，集中表达共享工具已经整理出的状态。
                return {
                  sessionFile,
                  entries: null,
                  error: null,
                  skipped: true,
                }
              }
            }
          }
          // entries 集合 等待 `readJSONLFile<Entry>(sessionFile)`，确保继续执行前已有结果。
          const entries = await readJSONLFile<Entry>(sessionFile)
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { sessionFile, entries, error: null, skipped: false }
        } catch (error) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { sessionFile, entries: null, error, skipped: false }
        }
      }),
    )

    // 循环处理 `const { sessionFile, entries, error, skipped } of`，让共享工具逐项把同类条目按顺序走完。
    for (const { sessionFile, entries, error, skipped } of results) {
      // 满足 `skipped` 时，共享工具执行该分支。
      if (skipped) continue
      // 只有 `error || !entries` 满足时，共享工具才执行该分支。
      if (error || !entries) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to read session file ${sessionFile}: ${errorMessage(error)}`,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // sessionId 会话数据保存`basename`，供共享工具后续处理使用。
      const sessionId = basename(sessionFile, '.jsonl')
      // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
      const messages: TranscriptMessage[] = []

      // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
      for (const entry of entries) {
        // 满足 `isTranscriptMessage(entry)` 时，共享工具执行该分支。
        if (isTranscriptMessage(entry)) {
          // 对话消息追加新条目，保持收集顺序与输入顺序一致。
          messages.push(entry)
        // 共享工具 stats在这里处理 `} else if (entry.type === 'speculation-accept') {`，完成这一小步状态转换。
        } else if (entry.type === 'speculation-accept') {
          // 共享工具 stats在这里处理 `totalSpeculationTimeSavedMs += entry.timeSavedMs`，完成这一小步状态转换。
          totalSpeculationTimeSavedMs += entry.timeSavedMs
        }
      }

      // 对话消息为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (messages.length === 0) continue

      // Subagent transcripts mark all messages as sidechain. We still want
      // their token usage counted, but not as separate sessions.
      // isSubagentFile 文件数据记录 `sessionFile.includes` 是否成立，共享工具随后按该结果分支。
      const isSubagentFile = sessionFile.includes(`${sep}subagents${sep}`)

      // Extract shot count from PR attribution in gh pr create calls (ant-only)
      // This must run before the sidechain filter since subagent transcripts
      // mark all messages as sidechain
      // 只有 `feature('SHOT_STATS') && shotDistributionMap` 满足时，共享工具才执行该分支。
      if (feature('SHOT_STATS') && shotDistributionMap) {
        // parentSessionId 会话数据 命名 `isSubagentFile`，让后续代码直接表达这个值的用途。
        const parentSessionId = isSubagentFile
          ? basename(dirname(dirname(sessionFile)))
          : sessionId

        // 满足 `!sessionsWithShotCount.has(parentSessionId)` 时，共享工具执行该分支。
        if (!sessionsWithShotCount.has(parentSessionId)) {
          // shotCount 数量保存`extractShotCountFromMessages`，供共享工具后续处理使用。
          const shotCount = extractShotCountFromMessages(messages)
          // `shotCount` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
          if (shotCount !== null) {
            // 调用 sessionsWithShotCount.add，触发共享工具此处需要的副作用。
            sessionsWithShotCount.add(parentSessionId)
            // shotDistributionMap.set 写入新的状态值，使共享工具后续读取保持一致。
            shotDistributionMap.set(
              shotCount,
              (shotDistributionMap.get(shotCount) || 0) + 1,
            )
          }
        }
      }

      // Filter out sidechain messages for session metadata (duration, counts).
      // For subagent files, use all messages since they're all sidechain.
      // mainMessages 消息数据保存`isSubagentFile`，供后续判断或组装使用。
      const mainMessages = isSubagentFile
        ? messages
        // 这个回调绑定到 : messages.filter(m => !m.isSidechain)，负责共享工具在该局部场景下的响应。
        : messages.filter(m => !m.isSidechain)
      // mainMessages 消息数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (mainMessages.length === 0) continue

      // firstMessage 消息数据保存`mainMessages[0]!`，供共享工具 stats后续判断或输出使用。
      const firstMessage = mainMessages[0]!
      // lastMessage 消息数据保存`mainMessages.at`，供共享工具后续处理使用。
      const lastMessage = mainMessages.at(-1)!

      // firstTimestamp记录时间`Date`，供共享工具后续处理使用。
      const firstTimestamp = new Date(firstMessage.timestamp)
      // lastTimestamp记录时间`Date`，供共享工具后续处理使用。
      const lastTimestamp = new Date(lastMessage.timestamp)

      // Skip sessions with malformed timestamps — some transcripts on disk
      // have entries missing the timestamp field (e.g. partial/remote writes).
      // new Date(undefined) produces an Invalid Date, and toDateString() would
      // throw RangeError: Invalid Date on .toISOString().
      // 只有 `isNaN(firstTimestamp.getTime()) || isNaN(lastTimestamp.getTime())` 满足时，共享工具才执行该分支。
      if (isNaN(firstTimestamp.getTime()) || isNaN(lastTimestamp.getTime())) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping session with invalid timestamp: ${sessionFile}`,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // dateKey记录时间`toDateString`，供共享工具后续处理使用。
      const dateKey = toDateString(firstTimestamp)

      // Apply date filters
      // 只有 `fromDate && isDateBefore(dateKey, fromDate)` 满足时，共享工具才执行该分支。
      if (fromDate && isDateBefore(dateKey, fromDate)) continue
      // 只有 `toDate && isDateBefore(toDate, dateKey)` 满足时，共享工具才执行该分支。
      if (toDate && isDateBefore(toDate, dateKey)) continue

      // Track daily activity (use first message date as session date)
      // existing读取`dailyActivityMap.get`，供共享工具后续处理使用。
      const existing = dailyActivityMap.get(dateKey) || {
        date: dateKey,
        messageCount: 0,
        sessionCount: 0,
        toolCallCount: 0,
      }

      // Subagent files contribute tokens and tool calls, but aren't sessions.
      // isSubagentFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!isSubagentFile) {
        // duration读取`lastTimestamp.getTime`，供共享工具后续处理使用。
        const duration = lastTimestamp.getTime() - firstTimestamp.getTime()

        // sessions 会话数据追加新条目，保持收集顺序与输入顺序一致。
        sessions.push({
          sessionId,
          duration,
          messageCount: mainMessages.length,
          timestamp: firstMessage.timestamp,
        })

        // 共享工具 stats在这里处理 `totalMessages += mainMessages.length`，完成这一小步状态转换。
        totalMessages += mainMessages.length

        // 共享工具 stats在这里处理 `existing.sessionCount++`，完成这一小步状态转换。
        existing.sessionCount++
        // 共享工具 stats在这里处理 `existing.messageCount += mainMessages.length`，完成这一小步状态转换。
        existing.messageCount += mainMessages.length

        // hour读取`firstTimestamp.getHours`，供共享工具后续处理使用。
        const hour = firstTimestamp.getHours()
        // hourCounts.set 写入新的状态值，使共享工具后续读取保持一致。
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }

      // 只有 `!isSubagentFile || dailyActivityMap.has(dateKey)` 满足时，共享工具才执行该分支。
      if (!isSubagentFile || dailyActivityMap.has(dateKey)) {
        // dailyActivityMap.set 写入新的状态值，使共享工具后续读取保持一致。
        dailyActivityMap.set(dateKey, existing)
      }

      // Process messages for tool usage and model stats
      // 按顺序遍历 `mainMessages` 中的消息，逐个交给共享工具处理。
      for (const message of mainMessages) {
        // 当 `message.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
        if (message.type === 'assistant') {
          // 文本内容保存`message.message?.content`，供共享工具 stats后续判断或输出使用。
          const content = message.message?.content
          // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
          if (Array.isArray(content)) {
            // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
            for (const block of content) {
              // 当 `block.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
              if (block.type === 'tool_use') {
                // activity读取`dailyActivityMap.get`，供共享工具后续处理使用。
                const activity = dailyActivityMap.get(dateKey)
                // 满足 `activity` 时，共享工具执行该分支。
                if (activity) {
                  // 共享工具 stats在这里处理 `activity.toolCallCount++`，完成这一小步状态转换。
                  activity.toolCallCount++
                }
              }
            }
          }

          // Track model usage if available (skip synthetic messages)
          // 满足 `message.message?.usage` 时，共享工具执行该分支。
          if (message.message?.usage) {
            // usage保存`message.message.usage`，供共享工具 stats后续判断或输出使用。
            const usage = message.message.usage
            // 模型名称标记共享工具 stats是否启用对应路径。
            const model = message.message.model || 'unknown'

            // Skip synthetic messages - they are internal and shouldn't appear in stats
            // 满足 `model === SYNTHETIC_MODEL` 时，共享工具执行该分支。
            if (model === SYNTHETIC_MODEL) {
              // 跳过当前项，继续处理共享工具中的下一轮循环。
              continue
            }

            // 满足 `!modelUsageAgg[model]` 时，共享工具执行该分支。
            if (!modelUsageAgg[model]) {
              // modelUsageAgg[model更新为 `{`，确保共享工具 stats后续读取最新状态。
              modelUsageAgg[model] = {
                inputTokens: 0,
                outputTokens: 0,
                cacheReadInputTokens: 0,
                cacheCreationInputTokens: 0,
                webSearchRequests: 0,
                costUSD: 0,
                contextWindow: 0,
                maxOutputTokens: 0,
              }
            }

            // 共享工具 stats在这里处理 `modelUsageAgg[model]!.inputTokens += usage.input_tokens || 0`，完成这一小步状态转换。
            modelUsageAgg[model]!.inputTokens += usage.input_tokens || 0
            // 共享工具 stats在这里处理 `modelUsageAgg[model]!.outputTokens += usage.output_tokens || 0`，完成这一小步状态转换。
            modelUsageAgg[model]!.outputTokens += usage.output_tokens || 0
            // 共享工具 stats在这里处理 `modelUsageAgg[model]!.cacheReadInputTokens +=`，完成这一小步状态转换。
            modelUsageAgg[model]!.cacheReadInputTokens +=
              usage.cache_read_input_tokens || 0
            // 共享工具 stats在这里处理 `modelUsageAgg[model]!.cacheCreationInputTokens +=`，完成这一小步状态转换。
            modelUsageAgg[model]!.cacheCreationInputTokens +=
              usage.cache_creation_input_tokens || 0

            // Track daily tokens per model
            // totalTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const totalTokens =
              (usage.input_tokens || 0) + (usage.output_tokens || 0)
            // 满足 `totalTokens > 0` 时，共享工具执行该分支。
            if (totalTokens > 0) {
              // dayTokens 集合读取`dailyModelTokensMap.get`，供共享工具后续处理使用。
              const dayTokens = dailyModelTokensMap.get(dateKey) || {}
              // dayTokens[model更新为 `(dayTokens[model] || 0) + totalTokens`，确保共享工具 stats后续读取最新状态。
              dayTokens[model] = (dayTokens[model] || 0) + totalTokens
              // dailyModelTokensMap.set 写入新的状态值，使共享工具后续读取保持一致。
              dailyModelTokensMap.set(dateKey, dayTokens)
            }
          }
        }
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // 这个回调绑定到 dailyActivity: Array.from(dailyActivityMap.values()).sort((a, b) =>，负责共享工具在该局部场景下的响应。
    dailyActivity: Array.from(dailyActivityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    dailyModelTokens: Array.from(dailyModelTokensMap.entries())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(([date, tokensByModel]) => ({ date, tokensByModel }))
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => a.date.localeCompare(b.date)),
    modelUsage: modelUsageAgg,
    sessionStats: sessions,
    hourCounts: Object.fromEntries(hourCounts),
    totalMessages,
    totalSpeculationTimeSavedMs,
    ...(feature('SHOT_STATS') && shotDistributionMap
      ? { shotDistribution: Object.fromEntries(shotDistributionMap) }
      : {}),
  }
}

/**
 * Get all session files from all project directories.
 * Includes both main session files and subagent transcript files.
 */
// getAllSessionFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAllSessionFiles(): Promise<string[]> {
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // Get all project directories
  // allEntries 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let allEntries
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // allEntries 集合更新为 `await fs.readdir(projectsDir)`，确保共享工具后续读取最新状态。
    allEntries = await fs.readdir(projectsDir)
  } catch (e) {
    // 满足 `isENOENT(e)` 时，共享工具执行该分支。
    if (isENOENT(e)) return []
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
  // projectDirs 集合保存`allEntries`，供共享工具 stats后续判断或输出使用。
  const projectDirs = allEntries
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(dirent => dirent.isDirectory())
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(dirent => join(projectsDir, dirent.name))

  // Collect all session files from all projects in parallel
  // projectResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const projectResults = await Promise.all(
    // 调用 projectDirs.map，触发共享工具此处需要的副作用。
    projectDirs.map(async projectDir => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // entries 集合读取`fs.readdir`，供共享工具后续处理使用。
        const entries = await fs.readdir(projectDir)

        // Collect main session files (*.jsonl directly in project dir)
        // mainFiles 文件数据保存`entries`，供后续判断或组装使用。
        const mainFiles = entries
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.jsonl'))
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(dirent => join(projectDir, dirent.name))

        // Collect subagent files from session subdirectories in parallel
        // Structure: {projectDir}/{sessionId}/subagents/agent-{agentId}.jsonl
        // sessionDirs 会话数据筛选`entries.filter`，供共享工具后续处理使用。
        const sessionDirs = entries.filter(dirent => dirent.isDirectory())
        // subagentResults 集合保存`Promise.all`，供共享工具后续处理使用。
        const subagentResults = await Promise.all(
          // 调用 sessionDirs.map，触发共享工具此处需要的副作用。
          sessionDirs.map(async sessionDir => {
            // subagentsDir格式化`join`，供共享工具后续处理使用。
            const subagentsDir = join(projectDir, sessionDir.name, 'subagents')
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // subagentEntries 集合读取`fs.readdir`，供共享工具后续处理使用。
              const subagentEntries = await fs.readdir(subagentsDir)
              // 返回 `subagentEntries`，作为共享工具这次计算的结果。
              return subagentEntries
                .filter(
                  // dirent更新为 `>`，确保共享工具后续读取最新状态。
                  dirent =>
                    dirent.isFile() &&
                    dirent.name.endsWith('.jsonl') &&
                    dirent.name.startsWith('agent-'),
                )
                // 链式调用 map，继续加工上一行在共享工具中产生的数据。
                .map(dirent => join(subagentsDir, dirent.name))
            } catch {
              // subagents directory doesn't exist for this session, skip
              // 返回列表结果，保留共享工具已经排好的条目顺序。
              return []
            }
          }),
        )

        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [...mainFiles, ...subagentResults.flat()]
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to read project directory ${projectDir}: ${errorMessage(error)}`,
        )
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      }
    }),
  )

  // 返回 `projectResults.flat()`，作为共享工具这次计算的结果。
  return projectResults.flat()
}

/**
 * Convert a PersistedStatsCache to ClaudeCodeStats by computing derived fields.
 */
// cacheToStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cacheToStats(
  cache: PersistedStatsCache,
  todayStats: ProcessedStats | null,
): ClaudeCodeStats {
  // Merge cache with today's stats
  // dailyActivityMap构建`new Map<string, DailyActivity>()` 整理出中间结果，供共享工具 stats后续步骤使用。
  const dailyActivityMap = new Map<string, DailyActivity>()
  // 按顺序遍历 `cache.dailyActivity` 中的day，逐个交给共享工具处理。
  for (const day of cache.dailyActivity) {
    // dailyActivityMap.set 写入新的状态值，使共享工具后续读取保持一致。
    dailyActivityMap.set(day.date, { ...day })
  }
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 按顺序遍历 `todayStats.dailyActivity` 中的day，逐个交给共享工具处理。
    for (const day of todayStats.dailyActivity) {
      // existing读取`dailyActivityMap.get`，供共享工具后续处理使用。
      const existing = dailyActivityMap.get(day.date)
      // 满足 `existing` 时，共享工具执行该分支。
      if (existing) {
        // 共享工具 stats在这里处理 `existing.messageCount += day.messageCount`，完成这一小步状态转换。
        existing.messageCount += day.messageCount
        // 共享工具 stats在这里处理 `existing.sessionCount += day.sessionCount`，完成这一小步状态转换。
        existing.sessionCount += day.sessionCount
        // 共享工具 stats在这里处理 `existing.toolCallCount += day.toolCallCount`，完成这一小步状态转换。
        existing.toolCallCount += day.toolCallCount
      } else {
        // dailyActivityMap.set 写入新的状态值，使共享工具后续读取保持一致。
        dailyActivityMap.set(day.date, { ...day })
      }
    }
  }

  // dailyModelTokensMap 命名 `new Map<string, { [model: string]: number }>()`，让后续代码直接表达这个值的用途。
  const dailyModelTokensMap = new Map<string, { [model: string]: number }>()
  // 按顺序遍历 `cache.dailyModelTokens` 中的day，逐个交给共享工具处理。
  for (const day of cache.dailyModelTokens) {
    // dailyModelTokensMap.set 写入新的状态值，使共享工具后续读取保持一致。
    dailyModelTokensMap.set(day.date, { ...day.tokensByModel })
  }
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 按顺序遍历 `todayStats.dailyModelTokens` 中的day，逐个交给共享工具处理。
    for (const day of todayStats.dailyModelTokens) {
      // existing读取`dailyModelTokensMap.get`，供共享工具后续处理使用。
      const existing = dailyModelTokensMap.get(day.date)
      // 满足 `existing` 时，共享工具执行该分支。
      if (existing) {
        // 循环处理 `const [model, tokens] of Object.entries(day.tokensByModel)`，让共享工具把同类条目按顺序走完。
        for (const [model, tokens] of Object.entries(day.tokensByModel)) {
          // existing[model更新为 `(existing[model] || 0) + tokens`，确保共享工具 stats后续读取最新状态。
          existing[model] = (existing[model] || 0) + tokens
        }
      } else {
        // dailyModelTokensMap.set 写入新的状态值，使共享工具后续读取保持一致。
        dailyModelTokensMap.set(day.date, { ...day.tokensByModel })
      }
    }
  }

  // Merge model usage
  // modelUsage集中保存共享工具 stats要一起传递的字段。
  const modelUsage = { ...cache.modelUsage }
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 循环处理 `const [model, usage] of Object.entries(todayStats.modelUsage)`，让共享工具把同类条目按顺序走完。
    for (const [model, usage] of Object.entries(todayStats.modelUsage)) {
      // 满足 `modelUsage[model]` 时，共享工具执行该分支。
      if (modelUsage[model]) {
        // modelUsage[model更新为 `{`，确保共享工具 stats后续读取最新状态。
        modelUsage[model] = {
          inputTokens: modelUsage[model]!.inputTokens + usage.inputTokens,
          outputTokens: modelUsage[model]!.outputTokens + usage.outputTokens,
          cacheReadInputTokens:
            modelUsage[model]!.cacheReadInputTokens +
            usage.cacheReadInputTokens,
          cacheCreationInputTokens:
            modelUsage[model]!.cacheCreationInputTokens +
            usage.cacheCreationInputTokens,
          webSearchRequests:
            modelUsage[model]!.webSearchRequests + usage.webSearchRequests,
          costUSD: modelUsage[model]!.costUSD + usage.costUSD,
          contextWindow: Math.max(
            modelUsage[model]!.contextWindow,
            usage.contextWindow,
          ),
          maxOutputTokens: Math.max(
            modelUsage[model]!.maxOutputTokens,
            usage.maxOutputTokens,
          ),
        }
      } else {
        // modelUsage[model更新为 `{ ...usage }`，确保共享工具 stats后续读取最新状态。
        modelUsage[model] = { ...usage }
      }
    }
  }

  // Merge hour counts
  // hourCountsMap 数量构建`new Map<number, number>()` 整理出中间结果，供共享工具 stats后续步骤使用。
  const hourCountsMap = new Map<number, number>()
  // 循环处理 `const [hour, count] of Object.entries(cache.hourCounts)`，让共享工具把同类条目按顺序走完。
  for (const [hour, count] of Object.entries(cache.hourCounts)) {
    // hourCountsMap.set 写入新的状态值，使共享工具后续读取保持一致。
    hourCountsMap.set(parseInt(hour, 10), count)
  }
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 循环处理 `const [hour, count] of Object.entries(todayStats.hourCounts)`，让共享工具把同类条目按顺序走完。
    for (const [hour, count] of Object.entries(todayStats.hourCounts)) {
      // hourNum解析`parseInt`，供共享工具后续处理使用。
      const hourNum = parseInt(hour, 10)
      // hourCountsMap.set 写入新的状态值，使共享工具后续读取保持一致。
      hourCountsMap.set(hourNum, (hourCountsMap.get(hourNum) || 0) + count)
    }
  }

  // Calculate derived stats
  // dailyActivityArray保存`Array.from`，供共享工具后续处理使用。
  const dailyActivityArray = Array.from(dailyActivityMap.values()).sort(
    // 这个回调绑定到 (a, b) => a.date.localeCompare(b.date),，负责共享工具在该局部场景下的响应。
    (a, b) => a.date.localeCompare(b.date),
  )
  // streaks 集合保存`calculateStreaks`，供共享工具后续处理使用。
  const streaks = calculateStreaks(dailyActivityArray)

  // dailyModelTokens 集合保存`Array.from`，供共享工具后续处理使用。
  const dailyModelTokens = Array.from(dailyModelTokensMap.entries())
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(([date, tokensByModel]) => ({ date, tokensByModel }))
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a.date.localeCompare(b.date))

  // Compute session aggregates: combine cache aggregates with today's stats
  // totalSessions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalSessions =
    cache.totalSessions + (todayStats?.sessionStats.length || 0)
  // totalMessages 消息数据标记共享工具 stats是否启用对应路径。
  const totalMessages = cache.totalMessages + (todayStats?.totalMessages || 0)

  // Find longest session (compare cache's longest with today's sessions)
  // longestSession 会话数据 命名 `cache.longestSession`，让后续代码直接表达这个值的用途。
  let longestSession = cache.longestSession
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 按顺序遍历 `todayStats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
    for (const session of todayStats.sessionStats) {
      // 只有 `!longestSession || session.duration > longestSess` 满足时，共享工具才执行该分支。
      if (!longestSession || session.duration > longestSession.duration) {
        // longestSession 会话数据更新为 `session`，确保共享工具后续读取最新状态。
        longestSession = session
      }
    }
  }

  // Find first/last session dates
  // firstSessionDate 会话数据记录时间`cache.firstSessionDate`，供后续判断或组装使用。
  let firstSessionDate = cache.firstSessionDate
  // lastSessionDate 会话数据保存`null`，作为后续空值处理的输入。
  let lastSessionDate: string | null = null
  // 满足 `todayStats` 时，共享工具执行该分支。
  if (todayStats) {
    // 按顺序遍历 `todayStats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
    for (const session of todayStats.sessionStats) {
      // 只有 `!firstSessionDate || session.timestamp < firstSes` 满足时，共享工具才执行该分支。
      if (!firstSessionDate || session.timestamp < firstSessionDate) {
        // firstSessionDate 会话数据更新为 `session.timestamp`，确保共享工具后续读取最新状态。
        firstSessionDate = session.timestamp
      }
      // 只有 `!lastSessionDate || session.timestamp > lastSessi` 满足时，共享工具才执行该分支。
      if (!lastSessionDate || session.timestamp > lastSessionDate) {
        // lastSessionDate 会话数据更新为 `session.timestamp`，确保共享工具后续读取最新状态。
        lastSessionDate = session.timestamp
      }
    }
  }
  // If no today sessions, derive lastSessionDate from dailyActivity
  // 只有 `!lastSessionDate && dailyActivityArray.length > 0` 满足时，共享工具才执行该分支。
  if (!lastSessionDate && dailyActivityArray.length > 0) {
    // lastSessionDate 会话数据更新为 `dailyActivityArray.at(-1)!.date`，确保共享工具后续读取最新状态。
    lastSessionDate = dailyActivityArray.at(-1)!.date
  }

  // peakActivityDay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const peakActivityDay =
    dailyActivityArray.length > 0
      // 这个回调绑定到 ? dailyActivityArray.reduce((max, d) =>，负责共享工具在该局部场景下的响应。
      ? dailyActivityArray.reduce((max, d) =>
          d.messageCount > max.messageCount ? d : max,
        ).date
      : null

  // peakActivityHour 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const peakActivityHour =
    hourCountsMap.size > 0
      // 这个回调绑定到 ? Array.from(hourCountsMap.entries()).reduce((max, [hour, count]) =>，负责共享工具在该局部场景下的响应。
      ? Array.from(hourCountsMap.entries()).reduce((max, [hour, count]) =>
          count > max[1] ? [hour, count] : max,
        )[0]
      : null

  // totalDays 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalDays =
    firstSessionDate && lastSessionDate
      ? Math.ceil(
          (new Date(lastSessionDate).getTime() -
            new Date(firstSessionDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0

  // totalSpeculationTimeSavedMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalSpeculationTimeSavedMs =
    cache.totalSpeculationTimeSavedMs +
    (todayStats?.totalSpeculationTimeSavedMs || 0)

  // 结果 集中保存共享工具 stats要一起传递的字段。
  const result: ClaudeCodeStats = {
    totalSessions,
    totalMessages,
    totalDays,
    activeDays: dailyActivityMap.size,
    streaks,
    dailyActivity: dailyActivityArray,
    dailyModelTokens,
    longestSession,
    modelUsage,
    firstSessionDate,
    lastSessionDate,
    peakActivityDay,
    peakActivityHour,
    totalSpeculationTimeSavedMs,
  }

  // 满足 `feature('SHOT_STATS')` 时，共享工具执行该分支。
  if (feature('SHOT_STATS')) {
    // shotDistribution 集中保存共享工具 stats要一起传递的字段。
    const shotDistribution: { [shotCount: number]: number } = {
      ...(cache.shotDistribution || {}),
    }
    // 满足 `todayStats?.shotDistribution` 时，共享工具执行该分支。
    if (todayStats?.shotDistribution) {
      // 调用 for，触发共享工具此处需要的副作用。
      for (const [count, sessions] of Object.entries(
        todayStats.shotDistribution,
      )) {
        // 按键解析`parseInt`，供共享工具后续处理使用。
        const key = parseInt(count, 10)
        // shotDistribution[key更新为 `(shotDistribution[key] || 0) + sessions`，确保共享工具 stats后续读取最新状态。
        shotDistribution[key] = (shotDistribution[key] || 0) + sessions
      }
    }
    // shotDistribution更新为 `shotDistribution`，确保共享工具后续读取最新状态。
    result.shotDistribution = shotDistribution
    // totalWithShots 集合派生`Object.values`，供共享工具后续处理使用。
    const totalWithShots = Object.values(shotDistribution).reduce(
      // 这个回调绑定到 (sum, n) => sum + n,，负责共享工具在该局部场景下的响应。
      (sum, n) => sum + n,
      0,
    )
    // 共享工具 stats在这里处理 `result.oneShotRate =`，完成这一小步状态转换。
    result.oneShotRate =
      totalWithShots > 0
        ? Math.round(((shotDistribution[1] || 0) / totalWithShots) * 100)
        : 0
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Aggregates stats from all Claude Code sessions across all projects.
 * Uses a disk cache to avoid reprocessing historical data.
 */
// aggregateClaudeCodeStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function aggregateClaudeCodeStats(): Promise<ClaudeCodeStats> {
  // allSessionFiles 会话数据读取`getAllSessionFiles`，供共享工具后续处理使用。
  const allSessionFiles = await getAllSessionFiles()

  // allSessionFiles 会话数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (allSessionFiles.length === 0) {
    // 返回 `getEmptyStats()`，作为共享工具这次计算的结果。
    return getEmptyStats()
  }

  // Use lock to prevent race conditions with background cache updates
  // updatedCache 缓存保存`withStatsCacheLock`，供共享工具后续处理使用。
  const updatedCache = await withStatsCacheLock(async () => {
    // Load the cache
    // cache 缓存读取`loadStatsCache`，供共享工具后续处理使用。
    const cache = await loadStatsCache()
    // yesterday读取`getYesterdayDateString`，供共享工具后续处理使用。
    const yesterday = getYesterdayDateString()

    // Determine what needs to be processed
    // - If no cache: process everything up to yesterday, then today separately
    // - If cache exists: process from day after lastComputedDate to yesterday, then today
    // 结果保存`cache`，供后续判断或组装使用。
    let result = cache

    // cache.lastComputedDate 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cache.lastComputedDate) {
      // No cache - process all historical data (everything before today)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Stats cache empty, processing all historical data')
      // historicalStats 集合保存`processSessionFiles`，供共享工具后续处理使用。
      const historicalStats = await processSessionFiles(allSessionFiles, {
        toDate: yesterday,
      })

      // 共享工具在这里按实际状态进入对应分支。
      if (
        historicalStats.sessionStats.length > 0 ||
        historicalStats.dailyActivity.length > 0
      ) {
        // 结果更新为 `mergeCacheWithNewStats(cache, historicalStats, yesterday)`，确保共享工具后续读取最新状态。
        result = mergeCacheWithNewStats(cache, historicalStats, yesterday)
        // 等待 `saveStatsCache(result)` 完成，再继续共享工具 stats的异步流程。
        await saveStatsCache(result)
      }
    // 共享工具 stats在这里处理 `} else if (isDateBefore(cache.lastComputedDate, yesterday)) {`，完成这一小步状态转换。
    } else if (isDateBefore(cache.lastComputedDate, yesterday)) {
      // Cache is stale - process new days
      // Process from day after lastComputedDate to yesterday
      // nextDay读取`getNextDay`，供共享工具后续处理使用。
      const nextDay = getNextDay(cache.lastComputedDate)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Stats cache stale (${cache.lastComputedDate}), processing ${nextDay} to ${yesterday}`,
      )
      // newStats 集合保存`processSessionFiles`，供共享工具后续处理使用。
      const newStats = await processSessionFiles(allSessionFiles, {
        fromDate: nextDay,
        toDate: yesterday,
      })

      // 共享工具在这里按实际状态进入对应分支。
      if (
        newStats.sessionStats.length > 0 ||
        newStats.dailyActivity.length > 0
      ) {
        // 结果更新为 `mergeCacheWithNewStats(cache, newStats, yesterday)`，确保共享工具后续读取最新状态。
        result = mergeCacheWithNewStats(cache, newStats, yesterday)
        // 等待 `saveStatsCache(result)` 完成，再继续共享工具 stats的异步流程。
        await saveStatsCache(result)
      } else {
        // No new data, but update lastComputedDate
        // 结果更新为 `{ ...cache, lastComputedDate: yesterday }`，确保共享工具后续读取最新状态。
        result = { ...cache, lastComputedDate: yesterday }
        // 等待 `saveStatsCache(result)` 完成，再继续共享工具 stats的异步流程。
        await saveStatsCache(result)
      }
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  })

  // Always process today's data live (it's incomplete)
  // This doesn't need to be in the lock since it doesn't modify the cache
  // today读取`getTodayDateString`，供共享工具后续处理使用。
  const today = getTodayDateString()
  // todayStats 集合保存`processSessionFiles`，供共享工具后续处理使用。
  const todayStats = await processSessionFiles(allSessionFiles, {
    fromDate: today,
    toDate: today,
  })

  // Combine cache with today's stats
  // 返回 `cacheToStats(updatedCache, todayStats)`，作为共享工具这次计算的结果。
  return cacheToStats(updatedCache, todayStats)
}

// StatsDateRange 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type StatsDateRange = '7d' | '30d' | 'all'

/**
 * Aggregates stats for a specific date range.
 * For 'all', uses the cached aggregation. For other ranges, processes files directly.
 */
// aggregateClaudeCodeStatsForRange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function aggregateClaudeCodeStatsForRange(
  range: StatsDateRange,
): Promise<ClaudeCodeStats> {
  // 当 `range` 匹配 `'all'` 时，共享工具执行对应分支。
  if (range === 'all') {
    // 返回 `aggregateClaudeCodeStats()`，作为共享工具这次计算的结果。
    return aggregateClaudeCodeStats()
  }

  // allSessionFiles 会话数据读取`getAllSessionFiles`，供共享工具后续处理使用。
  const allSessionFiles = await getAllSessionFiles()
  // allSessionFiles 会话数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (allSessionFiles.length === 0) {
    // 返回 `getEmptyStats()`，作为共享工具这次计算的结果。
    return getEmptyStats()
  }

  // Calculate fromDate based on range
  // today记录时间`Date`，供共享工具后续处理使用。
  const today = new Date()
  // daysBack标记共享工具 stats是否启用对应路径。
  const daysBack = range === '7d' ? 7 : 30
  // fromDate记录时间`Date`，供共享工具后续处理使用。
  const fromDate = new Date(today)
  // fromDate.setDate 写入新的状态值，使共享工具后续读取保持一致。
  fromDate.setDate(today.getDate() - daysBack + 1) // +1 to include today
  // fromDateStr记录时间`toDateString`，供共享工具后续处理使用。
  const fromDateStr = toDateString(fromDate)

  // Process session files for the date range
  // stats 集合保存`processSessionFiles`，供共享工具后续处理使用。
  const stats = await processSessionFiles(allSessionFiles, {
    fromDate: fromDateStr,
  })

  // 返回 `processedStatsToClaudeCodeStats(stats)`，作为共享工具这次计算的结果。
  return processedStatsToClaudeCodeStats(stats)
}

/**
 * Convert ProcessedStats to ClaudeCodeStats.
 * Used for filtered date ranges that bypass the cache.
 */
// processedStatsToClaudeCodeStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processedStatsToClaudeCodeStats(
  stats: ProcessedStats,
): ClaudeCodeStats {
  // dailyActivitySorted保存`stats.dailyActivity`，供共享工具 stats后续判断或输出使用。
  const dailyActivitySorted = stats.dailyActivity
    .slice()
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a.date.localeCompare(b.date))
  // dailyModelTokensSorted保存`stats.dailyModelTokens`，供共享工具 stats后续判断或输出使用。
  const dailyModelTokensSorted = stats.dailyModelTokens
    .slice()
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate streaks from daily activity
  // streaks 集合保存`calculateStreaks`，供共享工具后续处理使用。
  const streaks = calculateStreaks(dailyActivitySorted)

  // Find longest session
  // longestSession 会话数据 命名 `null`，让后续代码直接表达这个值的用途。
  let longestSession: SessionStats | null = null
  // 按顺序遍历 `stats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
  for (const session of stats.sessionStats) {
    // 只有 `!longestSession || session.duration > longestSess` 满足时，共享工具才执行该分支。
    if (!longestSession || session.duration > longestSession.duration) {
      // longestSession 会话数据更新为 `session`，确保共享工具后续读取最新状态。
      longestSession = session
    }
  }

  // Find first/last session dates
  // firstSessionDate 会话数据保存`null`，作为后续空值处理的输入。
  let firstSessionDate: string | null = null
  // lastSessionDate 会话数据保存`null`，作为后续空值处理的输入。
  let lastSessionDate: string | null = null
  // 按顺序遍历 `stats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
  for (const session of stats.sessionStats) {
    // 只有 `!firstSessionDate || session.timestamp < firstSes` 满足时，共享工具才执行该分支。
    if (!firstSessionDate || session.timestamp < firstSessionDate) {
      // firstSessionDate 会话数据更新为 `session.timestamp`，确保共享工具后续读取最新状态。
      firstSessionDate = session.timestamp
    }
    // 只有 `!lastSessionDate || session.timestamp > lastSessi` 满足时，共享工具才执行该分支。
    if (!lastSessionDate || session.timestamp > lastSessionDate) {
      // lastSessionDate 会话数据更新为 `session.timestamp`，确保共享工具后续读取最新状态。
      lastSessionDate = session.timestamp
    }
  }

  // Peak activity day
  // peakActivityDay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const peakActivityDay =
    dailyActivitySorted.length > 0
      // 这个回调绑定到 ? dailyActivitySorted.reduce((max, d) =>，负责共享工具在该局部场景下的响应。
      ? dailyActivitySorted.reduce((max, d) =>
          d.messageCount > max.messageCount ? d : max,
        ).date
      : null

  // Peak activity hour
  // hourEntries 集合派生`Object.entries`，供共享工具后续处理使用。
  const hourEntries = Object.entries(stats.hourCounts)
  // peakActivityHour 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const peakActivityHour =
    hourEntries.length > 0
      ? parseInt(
          // 调用 hourEntries.reduce，触发共享工具此处需要的副作用。
          hourEntries.reduce((max, [hour, count]) =>
            count > parseInt(max[1].toString()) ? [hour, count] : max,
          )[0],
          10,
        )
      : null

  // Total days in range
  // totalDays 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalDays =
    firstSessionDate && lastSessionDate
      ? Math.ceil(
          (new Date(lastSessionDate).getTime() -
            new Date(firstSessionDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0

  // 结果 集中保存共享工具 stats要一起传递的字段。
  const result: ClaudeCodeStats = {
    totalSessions: stats.sessionStats.length,
    totalMessages: stats.totalMessages,
    totalDays,
    activeDays: stats.dailyActivity.length,
    streaks,
    dailyActivity: dailyActivitySorted,
    dailyModelTokens: dailyModelTokensSorted,
    longestSession,
    modelUsage: stats.modelUsage,
    firstSessionDate,
    lastSessionDate,
    peakActivityDay,
    peakActivityHour,
    totalSpeculationTimeSavedMs: stats.totalSpeculationTimeSavedMs,
  }

  // 只有 `feature('SHOT_STATS') && stats.shotDistribution` 满足时，共享工具才执行该分支。
  if (feature('SHOT_STATS') && stats.shotDistribution) {
    // shotDistribution更新为 `stats.shotDistribution`，确保共享工具后续读取最新状态。
    result.shotDistribution = stats.shotDistribution
    // totalWithShots 集合派生`Object.values`，供共享工具后续处理使用。
    const totalWithShots = Object.values(stats.shotDistribution).reduce(
      // 这个回调绑定到 (sum, n) => sum + n,，负责共享工具在该局部场景下的响应。
      (sum, n) => sum + n,
      0,
    )
    // 共享工具 stats在这里处理 `result.oneShotRate =`，完成这一小步状态转换。
    result.oneShotRate =
      totalWithShots > 0
        ? Math.round(((stats.shotDistribution[1] || 0) / totalWithShots) * 100)
        : 0
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Get the next day after a given date string (YYYY-MM-DD format).
 */
// getNextDay 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNextDay(dateStr: string): string {
  // date记录时间`Date`，供共享工具后续处理使用。
  const date = new Date(dateStr)
  // date.setDate 写入新的状态值，使共享工具后续读取保持一致。
  date.setDate(date.getDate() + 1)
  // 返回 `toDateString(date)`，作为共享工具这次计算的结果。
  return toDateString(date)
}

// calculateStreaks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function calculateStreaks(dailyActivity: DailyActivity[]): StreakInfo {
  // dailyActivity为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (dailyActivity.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStart: null,
      longestStreakStart: null,
      longestStreakEnd: null,
    }
  }

  // today记录时间`Date`，供共享工具后续处理使用。
  const today = new Date()
  // today.setHours 写入新的状态值，使共享工具后续读取保持一致。
  today.setHours(0, 0, 0, 0)

  // Calculate current streak (working backwards from today)
  // currentStreak保存`0`，供后续判断或组装使用。
  let currentStreak = 0
  // currentStreakStart初始化为空值，后续分支会在有数据时补齐。
  let currentStreakStart: string | null = null
  // checkDate记录时间`Date`，供共享工具后续处理使用。
  const checkDate = new Date(today)

  // Build a set of active dates for quick lookup
  // activeDates 集合保存`Set`，供共享工具后续处理使用。
  const activeDates = new Set(dailyActivity.map(d => d.date))

  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // dateStr记录时间`toDateString`，供共享工具后续处理使用。
    const dateStr = toDateString(checkDate)
    // 满足 `!activeDates.has(dateStr)` 时，共享工具执行该分支。
    if (!activeDates.has(dateStr)) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 共享工具 stats在这里处理 `currentStreak++`，完成这一小步状态转换。
    currentStreak++
    // currentStreakStart更新为 `dateStr`，确保共享工具后续读取最新状态。
    currentStreakStart = dateStr
    // checkDate.setDate 写入新的状态值，使共享工具后续读取保持一致。
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Calculate longest streak
  // longestStreak保存`0`，供共享工具 stats后续判断或输出使用。
  let longestStreak = 0
  // longestStreakStart 命名 `null`，让后续代码直接表达这个值的用途。
  let longestStreakStart: string | null = null
  // longestStreakEnd 命名 `null`，让后续代码直接表达这个值的用途。
  let longestStreakEnd: string | null = null

  // 满足 `dailyActivity.length > 0` 时，共享工具执行该分支。
  if (dailyActivity.length > 0) {
    // sortedDates 集合保存`Array.from`，供共享工具后续处理使用。
    const sortedDates = Array.from(activeDates).sort()
    // tempStreak保存`1`，供共享工具 stats后续判断或输出使用。
    let tempStreak = 1
    // tempStart 命名 `sortedDates[0]!`，让后续代码直接表达这个值的用途。
    let tempStart = sortedDates[0]!

    // 循环处理 `let i = 1; i < sortedDates.length; i++`，让共享工具逐项把同类条目按顺序走完。
    for (let i = 1; i < sortedDates.length; i++) {
      // prevDate记录时间`Date`，供共享工具后续处理使用。
      const prevDate = new Date(sortedDates[i - 1]!)
      // currDate记录时间`Date`，供共享工具后续处理使用。
      const currDate = new Date(sortedDates[i]!)

      // dayDiff保存`Math.round`，供共享工具后续处理使用。
      const dayDiff = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      // 满足 `dayDiff === 1` 时，共享工具执行该分支。
      if (dayDiff === 1) {
        // 共享工具 stats在这里处理 `tempStreak++`，完成这一小步状态转换。
        tempStreak++
      } else {
        // 满足 `tempStreak > longestStreak` 时，共享工具执行该分支。
        if (tempStreak > longestStreak) {
          // longestStreak更新为 `tempStreak`，确保共享工具后续读取最新状态。
          longestStreak = tempStreak
          // longestStreakStart更新为 `tempStart`，确保共享工具后续读取最新状态。
          longestStreakStart = tempStart
          // longestStreakEnd更新为 `sortedDates[i - 1]!`，确保共享工具后续读取最新状态。
          longestStreakEnd = sortedDates[i - 1]!
        }
        // tempStreak更新为 `1`，确保共享工具后续读取最新状态。
        tempStreak = 1
        // tempStart更新为 `sortedDates[i]!`，确保共享工具后续读取最新状态。
        tempStart = sortedDates[i]!
      }
    }

    // Check final streak
    // 满足 `tempStreak > longestStreak` 时，共享工具执行该分支。
    if (tempStreak > longestStreak) {
      // longestStreak更新为 `tempStreak`，确保共享工具后续读取最新状态。
      longestStreak = tempStreak
      // longestStreakStart更新为 `tempStart`，确保共享工具后续读取最新状态。
      longestStreakStart = tempStart
      // longestStreakEnd更新为 `sortedDates.at(-1)!`，确保共享工具后续读取最新状态。
      longestStreakEnd = sortedDates.at(-1)!
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    currentStreak,
    longestStreak,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd,
  }
}

// SHOT_COUNT_REGEX 数量 命名 `/(\d+)-shotted by/`，让后续代码直接表达这个值的用途。
const SHOT_COUNT_REGEX = /(\d+)-shotted by/

/**
 * Extract the shot count from PR attribution text in a `gh pr create` Bash call.
 * The attribution format is: "N-shotted by model-name"
 * Returns the shot count, or null if not found.
 */
// extractShotCountFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractShotCountFromMessages(
  messages: TranscriptMessage[],
): number | null {
  // 按顺序遍历 `messages` 中的m，逐个交给共享工具处理。
  for (const m of messages) {
    // `m.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (m.type !== 'assistant') continue
    // 文本内容 命名 `m.message?.content`，让后续代码直接表达这个值的用途。
    const content = m.message?.content
    // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
    if (!Array.isArray(content)) continue
    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        block.type !== 'tool_use' ||
        !SHELL_TOOL_NAMES.includes(block.name) ||
        typeof block.input !== 'object' ||
        block.input === null ||
        !('command' in block.input) ||
        typeof block.input.command !== 'string'
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // match保存`SHOT_COUNT_REGEX.exec`，供共享工具后续处理使用。
      const match = SHOT_COUNT_REGEX.exec(block.input.command)
      // 满足 `match` 时，共享工具执行该分支。
      if (match) {
        // 返回 `parseInt(match[1]!, 10)`，作为共享工具这次计算的结果。
        return parseInt(match[1]!, 10)
      }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// Transcript message types — must match isTranscriptMessage() in sessionStorage.ts.
// The canonical dateKey (see processSessionFiles) reads mainMessages[0].timestamp,
// where mainMessages = entries.filter(isTranscriptMessage).filter(!isSidechain).
// This peek must extract the same value to be a safe skip optimization.
// TRANSCRIPT_MESSAGE_TYPES 消息数据保存`Set`，供共享工具后续处理使用。
const TRANSCRIPT_MESSAGE_TYPES = new Set([
  'user',
  'assistant',
  'attachment',
  'system',
  'progress',
])

/**
 * Peeks at the head of a session file to get the session start date.
 * Uses a small 4 KB read to avoid loading the full file.
 *
 * Session files typically begin with non-transcript entries (`mode`,
 * `file-history-snapshot`, `attribution-snapshot`) before the first transcript
 * message, so we scan lines until we hit one. Each complete line is JSON-parsed
 * — naive string search is unsafe here because `file-history-snapshot` entries
 * embed a nested `snapshot.timestamp` carrying the *previous* session's date
 * (written by copyFileHistoryForResume), which would cause resumed sessions to
 * be miscategorised as old and silently dropped from stats.
 *
 * Returns a YYYY-MM-DD string, or null if no transcript message fits in the
 * head (caller falls through to the full read — safe default).
 */
// readSessionStartDate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readSessionStartDate(
  filePath: string,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fd保存`open`，供共享工具后续处理使用。
    const fd = await open(filePath, 'r')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
      const buf = Buffer.allocUnsafe(4096)
      // 从 `await fd.read(buf, 0, buf.length, 0)` 解构 bytesRead，减少共享工具 stats对同一对象的重复访问。
      const { bytesRead } = await fd.read(buf, 0, buf.length, 0)
      // 满足 `bytesRead === 0` 时，共享工具执行该分支。
      if (bytesRead === 0) return null
      // head格式化`buf.toString`，供共享工具后续处理使用。
      const head = buf.toString('utf8', 0, bytesRead)

      // Only trust complete lines — the 4KB boundary may bisect a JSON entry.
      // lastNewline保存`head.lastIndexOf`，供共享工具后续处理使用。
      const lastNewline = head.lastIndexOf('\n')
      // 满足 `lastNewline < 0` 时，共享工具执行该分支。
      if (lastNewline < 0) return null

      // 逐项读取 `head.slice(0, lastNewline).split('\n')` 中的line，按输入顺序推进共享工具。
      for (const line of head.slice(0, lastNewline).split('\n')) {
        // line缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!line) continue
        // entry 先占位，稍后的条件分支会根据实际输入补齐它。
        let entry: {
          type?: unknown
          timestamp?: unknown
          isSidechain?: unknown
        }
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // entry更新为 `jsonParse(line)`，确保共享工具后续读取最新状态。
          entry = jsonParse(line)
        } catch {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // `typeof entry.type` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof entry.type !== 'string') continue
        // 满足 `!TRANSCRIPT_MESSAGE_TYPES.has(entry.type)` 时，共享工具执行该分支。
        if (!TRANSCRIPT_MESSAGE_TYPES.has(entry.type)) continue
        // 满足 `entry.isSidechain === true` 时，共享工具执行该分支。
        if (entry.isSidechain === true) continue
        // `typeof entry.timestamp` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof entry.timestamp !== 'string') return null
        // date记录时间`Date`，供共享工具后续处理使用。
        const date = new Date(entry.timestamp)
        // 满足 `Number.isNaN(date.getTime())` 时，共享工具执行该分支。
        if (Number.isNaN(date.getTime())) return null
        // 返回 `toDateString(date)`，作为共享工具这次计算的结果。
        return toDateString(date)
      }
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    } finally {
      // 等待 `fd.close()` 完成，再继续共享工具 stats的异步流程。
      await fd.close()
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// getEmptyStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEmptyStats(): ClaudeCodeStats {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    totalSessions: 0,
    totalMessages: 0,
    totalDays: 0,
    activeDays: 0,
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStart: null,
      longestStreakStart: null,
      longestStreakEnd: null,
    },
    dailyActivity: [],
    dailyModelTokens: [],
    longestSession: null,
    modelUsage: {},
    firstSessionDate: null,
    lastSessionDate: null,
    peakActivityDay: null,
    peakActivityHour: null,
    totalSpeculationTimeSavedMs: 0,
  }
}
