// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { ModelUsage } 来自 ../entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { ModelUsage } from '../entrypoints/agentSdkTypes.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 errorMessage，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'
// 类型依赖 { DailyActivity, DailyModelTokens, SessionStats } 来自 ./stats.js，用于校准共享工具的数据契约。
import type { DailyActivity, DailyModelTokens, SessionStats } from './stats.js'

// STATS_CACHE_VERSION 缓存保存`3`，供后续判断或组装使用。
export const STATS_CACHE_VERSION = 3
// MIN_MIGRATABLE_VERSION保存`1`，供共享工具 stats Cache后续判断或输出使用。
const MIN_MIGRATABLE_VERSION = 1
// STATS_CACHE_FILENAME 文件数据固定为 `'stats-cache.json'`，作为共享工具 stats Cache后续展示或比较的基准。
const STATS_CACHE_FILENAME = 'stats-cache.json'

/**
 * Simple in-memory lock to prevent concurrent cache operations.
 */
// statsCacheLockPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let statsCacheLockPromise: Promise<void> | null = null

/**
 * Execute a function while holding the stats cache lock.
 * Only one operation can hold the lock at a time.
 */
// withStatsCacheLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function withStatsCacheLock<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock to be released
  // while 使用 statsCacheLockPromise 完成共享工具里的对应操作。
  while (statsCacheLockPromise) {
    // 等待 `statsCacheLockPromise` 完成，再继续共享工具 stats Cache的异步流程。
    await statsCacheLockPromise
  }

  // Create our lock
  // 这个回调绑定到 let releaseLock: (() => void) | undefined，负责共享工具在该局部场景下的响应。
  let releaseLock: (() => void) | undefined
  // statsCacheLockPromise 异步任务更新为 `new Promise<void>(resolve => {`，确保共享工具后续读取最新状态。
  statsCacheLockPromise = new Promise<void>(resolve => {
    // releaseLock更新为 `resolve`，确保共享工具后续读取最新状态。
    releaseLock = resolve
  })

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `fn()`，调用方直接接收异步结果。
    return await fn()
  } finally {
    // Release the lock
    // statsCacheLockPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
    statsCacheLockPromise = null
    // 调用 releaseLock?.()，完成这一处局部操作。
    releaseLock?.()
  }
}

/**
 * Persisted stats cache stored on disk.
 * Contains aggregated historical stats that won't change.
 * All fields are bounded to prevent unbounded file growth.
 */
// PersistedStatsCache 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistedStatsCache = {
  version: number
  // Last date that was fully computed (YYYY-MM-DD format)
  // Stats up to and including this date are considered complete
  lastComputedDate: string | null
  // Daily aggregates needed for heatmap, streaks, trends (bounded by days)
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  // Model usage aggregated (bounded by number of models)
  modelUsage: { [modelName: string]: ModelUsage }
  // Session aggregates (replaces unbounded sessionStats array)
  totalSessions: number
  totalMessages: number
  longestSession: SessionStats | null
  // First session date ever recorded
  firstSessionDate: string | null
  // Hour counts for peak hour calculation (bounded to 24 entries)
  hourCounts: { [hour: number]: number }
  // Speculation time saved across all sessions
  totalSpeculationTimeSavedMs: number
  // Shot distribution: map of shot count → number of sessions (ant-only)
  shotDistribution?: { [shotCount: number]: number }
}

// getStatsCachePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStatsCachePath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), STATS_CACHE_FILENAME)`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), STATS_CACHE_FILENAME)
}

// getEmptyCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEmptyCache(): PersistedStatsCache {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    version: STATS_CACHE_VERSION,
    lastComputedDate: null,
    dailyActivity: [],
    dailyModelTokens: [],
    modelUsage: {},
    totalSessions: 0,
    totalMessages: 0,
    longestSession: null,
    firstSessionDate: null,
    hourCounts: {},
    totalSpeculationTimeSavedMs: 0,
    shotDistribution: {},
  }
}

/**
 * Migrate an older cache to the current schema.
 * Returns null if the version is unknown or too old to migrate.
 *
 * Preserves historical aggregates that would otherwise be lost when
 * transcript files have already aged out past cleanupPeriodDays.
 * Pre-migration days may undercount (e.g. v2 lacked subagent tokens);
 * we accept that rather than drop the history.
 */
// migrateStatsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function migrateStatsCache(
  parsed: Partial<PersistedStatsCache> & { version: number },
): PersistedStatsCache | null {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof parsed.version !== 'number' ||
    parsed.version < MIN_MIGRATABLE_VERSION ||
    parsed.version > STATS_CACHE_VERSION
  ) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !Array.isArray(parsed.dailyActivity) ||
    !Array.isArray(parsed.dailyModelTokens) ||
    typeof parsed.totalSessions !== 'number' ||
    typeof parsed.totalMessages !== 'number'
  ) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    version: STATS_CACHE_VERSION,
    lastComputedDate: parsed.lastComputedDate ?? null,
    dailyActivity: parsed.dailyActivity,
    dailyModelTokens: parsed.dailyModelTokens,
    modelUsage: parsed.modelUsage ?? {},
    totalSessions: parsed.totalSessions,
    totalMessages: parsed.totalMessages,
    longestSession: parsed.longestSession ?? null,
    firstSessionDate: parsed.firstSessionDate ?? null,
    hourCounts: parsed.hourCounts ?? {},
    totalSpeculationTimeSavedMs: parsed.totalSpeculationTimeSavedMs ?? 0,
    // Preserve undefined (don't default to {}) so the SHOT_STATS recompute
    // check in loadStatsCache fires for v1/v2 caches that lacked this field.
    shotDistribution: parsed.shotDistribution,
  }
}

/**
 * Load the stats cache from disk.
 * Returns an empty cache if the file doesn't exist or is invalid.
 */
// loadStatsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadStatsCache(): Promise<PersistedStatsCache> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // cachePath 路径数据读取`getStatsCachePath`，供共享工具后续处理使用。
  const cachePath = getStatsCachePath()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供共享工具后续处理使用。
    const content = await fs.readFile(cachePath, { encoding: 'utf-8' })
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(content) as PersistedStatsCache

    // Validate version
    // `parsed.version` 与 `STATS_CACHE_VERSION` 不一致时刷新派生状态，避免使用过期结果。
    if (parsed.version !== STATS_CACHE_VERSION) {
      // migrated保存`migrateStatsCache`，供共享工具后续处理使用。
      const migrated = migrateStatsCache(parsed)
      // migrated缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!migrated) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Stats cache version ${parsed.version} not migratable (expected ${STATS_CACHE_VERSION}), returning empty cache`,
        )
        // 返回 `getEmptyCache()`，作为共享工具这次计算的结果。
        return getEmptyCache()
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Migrated stats cache from v${parsed.version} to v${STATS_CACHE_VERSION}`,
      )
      // Persist migration so we don't re-migrate on every load.
      // aggregateClaudeCodeStats() skips its save when lastComputedDate is
      // already current, so without this the on-disk file stays at the old
      // version indefinitely.
      // 等待 `saveStatsCache(migrated)` 完成，再继续共享工具 stats Cache的异步流程。
      await saveStatsCache(migrated)
      // 只有 `feature('SHOT_STATS') && !migrated.shotDistribution` 满足时，共享工具才执行该分支。
      if (feature('SHOT_STATS') && !migrated.shotDistribution) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Migrated stats cache missing shotDistribution, forcing recomputation',
        )
        // 返回 `getEmptyCache()`，作为共享工具这次计算的结果。
        return getEmptyCache()
      }
      // 返回 `migrated`，作为共享工具这次计算的结果。
      return migrated
    }

    // Basic validation
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !Array.isArray(parsed.dailyActivity) ||
      !Array.isArray(parsed.dailyModelTokens) ||
      typeof parsed.totalSessions !== 'number' ||
      typeof parsed.totalMessages !== 'number'
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Stats cache has invalid structure, returning empty cache',
      )
      // 返回 `getEmptyCache()`，作为共享工具这次计算的结果。
      return getEmptyCache()
    }

    // If SHOT_STATS is enabled but cache doesn't have shotDistribution,
    // force full recomputation to get historical shot data
    // 只有 `feature('SHOT_STATS') && !parsed.shotDistribution` 满足时，共享工具才执行该分支。
    if (feature('SHOT_STATS') && !parsed.shotDistribution) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Stats cache missing shotDistribution, forcing recomputation',
      )
      // 返回 `getEmptyCache()`，作为共享工具这次计算的结果。
      return getEmptyCache()
    }

    // 返回 `parsed`，作为共享工具这次计算的结果。
    return parsed
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load stats cache: ${errorMessage(error)}`)
    // 返回 `getEmptyCache()`，作为共享工具这次计算的结果。
    return getEmptyCache()
  }
}

/**
 * Save the stats cache to disk atomically.
 * Uses a temp file + rename pattern to prevent corruption.
 */
// saveStatsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveStatsCache(
  cache: PersistedStatsCache,
): Promise<void> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // cachePath 路径数据读取`getStatsCachePath`，供共享工具后续处理使用。
  const cachePath = getStatsCachePath()
  // tempPath 路径数据保存`randomBytes`，供共享工具后续处理使用。
  const tempPath = `${cachePath}.${randomBytes(8).toString('hex')}.tmp`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Ensure the directory exists
    // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
    const configDir = getClaudeConfigHomeDir()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.mkdir(configDir)` 完成，再继续共享工具 stats Cache的异步流程。
      await fs.mkdir(configDir)
    } catch {
      // Directory already exists or other error - proceed
    }

    // Write to temp file with fsync for atomic write safety
    // 文本内容保存`jsonStringify`，供共享工具后续处理使用。
    const content = jsonStringify(cache, null, 2)
    // handle保存`open`，供共享工具后续处理使用。
    const handle = await open(tempPath, 'w', 0o600)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `handle.writeFile(content, { encoding: 'utf-8' })` 完成，再继续共享工具 stats Cache的异步流程。
      await handle.writeFile(content, { encoding: 'utf-8' })
      // 等待 `handle.sync()` 完成，再继续共享工具 stats Cache的异步流程。
      await handle.sync()
    } finally {
      // 等待 `handle.close()` 完成，再继续共享工具 stats Cache的异步流程。
      await handle.close()
    }

    // Atomic rename
    // 等待 `fs.rename(tempPath, cachePath)` 完成，再继续共享工具 stats Cache的异步流程。
    await fs.rename(tempPath, cachePath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Stats cache saved successfully (lastComputedDate: ${cache.lastComputedDate})`,
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // Clean up temp file
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.unlink(tempPath)` 完成，再继续共享工具 stats Cache的异步流程。
      await fs.unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Merge new stats into an existing cache.
 * Used when incrementally adding new days to the cache.
 */
// mergeCacheWithNewStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergeCacheWithNewStats(
  existingCache: PersistedStatsCache,
  newStats: {
    dailyActivity: DailyActivity[]
    dailyModelTokens: DailyModelTokens[]
    modelUsage: { [modelName: string]: ModelUsage }
    sessionStats: SessionStats[]
    hourCounts: { [hour: number]: number }
    totalSpeculationTimeSavedMs: number
    shotDistribution?: { [shotCount: number]: number }
  },
  newLastComputedDate: string,
): PersistedStatsCache {
  // Merge daily activity - combine by date
  // dailyActivityMap构建`new Map<string, DailyActivity>()`，供后续判断或组装使用。
  const dailyActivityMap = new Map<string, DailyActivity>()
  // 按顺序遍历 `existingCache.dailyActivity` 中的day，逐个交给共享工具处理。
  for (const day of existingCache.dailyActivity) {
    // dailyActivityMap.set 写入新的状态值，使共享工具后续读取保持一致。
    dailyActivityMap.set(day.date, { ...day })
  }
  // 按顺序遍历 `newStats.dailyActivity` 中的day，逐个交给共享工具处理。
  for (const day of newStats.dailyActivity) {
    // existing读取`dailyActivityMap.get`，供共享工具后续处理使用。
    const existing = dailyActivityMap.get(day.date)
    // 满足 `existing` 时，共享工具执行该分支。
    if (existing) {
      // 共享工具 stats Cache在这里处理 `existing.messageCount += day.messageCount`，完成这一小步状态转换。
      existing.messageCount += day.messageCount
      // 共享工具 stats Cache在这里处理 `existing.sessionCount += day.sessionCount`，完成这一小步状态转换。
      existing.sessionCount += day.sessionCount
      // 共享工具 stats Cache在这里处理 `existing.toolCallCount += day.toolCallCount`，完成这一小步状态转换。
      existing.toolCallCount += day.toolCallCount
    } else {
      // dailyActivityMap.set 写入新的状态值，使共享工具后续读取保持一致。
      dailyActivityMap.set(day.date, { ...day })
    }
  }

  // Merge daily model tokens - combine by date
  // dailyModelTokensMap 命名 `new Map<string, { [model: string]: number }>()`，让后续代码直接表达这个值的用途。
  const dailyModelTokensMap = new Map<string, { [model: string]: number }>()
  // 按顺序遍历 `existingCache.dailyModelTokens` 中的day，逐个交给共享工具处理。
  for (const day of existingCache.dailyModelTokens) {
    // dailyModelTokensMap.set 写入新的状态值，使共享工具后续读取保持一致。
    dailyModelTokensMap.set(day.date, { ...day.tokensByModel })
  }
  // 按顺序遍历 `newStats.dailyModelTokens` 中的day，逐个交给共享工具处理。
  for (const day of newStats.dailyModelTokens) {
    // existing读取`dailyModelTokensMap.get`，供共享工具后续处理使用。
    const existing = dailyModelTokensMap.get(day.date)
    // 满足 `existing` 时，共享工具执行该分支。
    if (existing) {
      // 循环处理 `const [model, tokens] of Object.entries(day.tokensByModel)`，让共享工具把同类条目按顺序走完。
      for (const [model, tokens] of Object.entries(day.tokensByModel)) {
        // existing[model更新为 `(existing[model] || 0) + tokens`，确保共享工具 stats Cache后续读取最新状态。
        existing[model] = (existing[model] || 0) + tokens
      }
    } else {
      // dailyModelTokensMap.set 写入新的状态值，使共享工具后续读取保持一致。
      dailyModelTokensMap.set(day.date, { ...day.tokensByModel })
    }
  }

  // Merge model usage
  // modelUsage集中保存共享工具 stats Cache要一起传递的字段。
  const modelUsage = { ...existingCache.modelUsage }
  // 循环处理 `const [model, usage] of Object.entries(newStats.modelUsage)`，让共享工具把同类条目按顺序走完。
  for (const [model, usage] of Object.entries(newStats.modelUsage)) {
    // 满足 `modelUsage[model]` 时，共享工具执行该分支。
    if (modelUsage[model]) {
      // modelUsage[model更新为 `{`，确保共享工具 stats Cache后续读取最新状态。
      modelUsage[model] = {
        inputTokens: modelUsage[model]!.inputTokens + usage.inputTokens,
        outputTokens: modelUsage[model]!.outputTokens + usage.outputTokens,
        cacheReadInputTokens:
          modelUsage[model]!.cacheReadInputTokens + usage.cacheReadInputTokens,
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
      // modelUsage[model更新为 `{ ...usage }`，确保共享工具 stats Cache后续读取最新状态。
      modelUsage[model] = { ...usage }
    }
  }

  // Merge hour counts
  // hourCounts 数量集中保存共享工具 stats Cache要一起传递的字段。
  const hourCounts = { ...existingCache.hourCounts }
  // 循环处理 `const [hour, count] of Object.entries(newStats.hourCounts)`，让共享工具把同类条目按顺序走完。
  for (const [hour, count] of Object.entries(newStats.hourCounts)) {
    // hourNum解析`parseInt`，供共享工具后续处理使用。
    const hourNum = parseInt(hour, 10)
    // hourCounts[hourNum 数量更新为 `(hourCounts[hourNum] || 0) + count`，确保共享工具 stats Cache后续读取最新状态。
    hourCounts[hourNum] = (hourCounts[hourNum] || 0) + count
  }

  // Update session aggregates
  // totalSessions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalSessions =
    existingCache.totalSessions + newStats.sessionStats.length
  // totalMessages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalMessages =
    existingCache.totalMessages +
    // 调用 newStats.sessionStats.reduce，触发共享工具此处需要的副作用。
    newStats.sessionStats.reduce((sum, s) => sum + s.messageCount, 0)

  // Find longest session (compare existing with new)
  // longestSession 会话数据保存`existingCache.longestSession`，供共享工具 stats Cache后续判断或输出使用。
  let longestSession = existingCache.longestSession
  // 按顺序遍历 `newStats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
  for (const session of newStats.sessionStats) {
    // 只有 `!longestSession || session.duration > longestSess` 满足时，共享工具才执行该分支。
    if (!longestSession || session.duration > longestSession.duration) {
      // longestSession 会话数据更新为 `session`，确保共享工具后续读取最新状态。
      longestSession = session
    }
  }

  // Find first session date
  // firstSessionDate 会话数据记录时间`existingCache.firstSessionDate` 整理出中间结果，供共享工具 stats Cache后续步骤使用。
  let firstSessionDate = existingCache.firstSessionDate
  // 按顺序遍历 `newStats.sessionStats` 中的session 会话数据，逐个交给共享工具处理。
  for (const session of newStats.sessionStats) {
    // 只有 `!firstSessionDate || session.timestamp < firstSes` 满足时，共享工具才执行该分支。
    if (!firstSessionDate || session.timestamp < firstSessionDate) {
      // firstSessionDate 会话数据更新为 `session.timestamp`，确保共享工具后续读取最新状态。
      firstSessionDate = session.timestamp
    }
  }

  // 结果 集中保存共享工具 stats Cache要一起传递的字段。
  const result: PersistedStatsCache = {
    version: STATS_CACHE_VERSION,
    lastComputedDate: newLastComputedDate,
    // 这个回调绑定到 dailyActivity: Array.from(dailyActivityMap.values()).sort((a, b) =>，负责共享工具在该局部场景下的响应。
    dailyActivity: Array.from(dailyActivityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    dailyModelTokens: Array.from(dailyModelTokensMap.entries())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(([date, tokensByModel]) => ({ date, tokensByModel }))
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => a.date.localeCompare(b.date)),
    modelUsage,
    totalSessions,
    totalMessages,
    longestSession,
    firstSessionDate,
    hourCounts,
    totalSpeculationTimeSavedMs:
      existingCache.totalSpeculationTimeSavedMs +
      newStats.totalSpeculationTimeSavedMs,
  }

  // 满足 `feature('SHOT_STATS')` 时，共享工具执行该分支。
  if (feature('SHOT_STATS')) {
    // shotDistribution 集中保存共享工具 stats Cache要一起传递的字段。
    const shotDistribution: { [shotCount: number]: number } = {
      ...(existingCache.shotDistribution || {}),
    }
    // 调用 for，触发共享工具此处需要的副作用。
    for (const [count, sessions] of Object.entries(
      newStats.shotDistribution || {},
    )) {
      // 按键解析`parseInt`，供共享工具后续处理使用。
      const key = parseInt(count, 10)
      // shotDistribution[key更新为 `(shotDistribution[key] || 0) + sessions`，确保共享工具 stats Cache后续读取最新状态。
      shotDistribution[key] = (shotDistribution[key] || 0) + sessions
    }
    // shotDistribution更新为 `shotDistribution`，确保共享工具后续读取最新状态。
    result.shotDistribution = shotDistribution
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Extract the date portion (YYYY-MM-DD) from a Date object.
 */
// toDateString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toDateString(date: Date): string {
  // 片段列表保存`date.toISOString`，供共享工具后续处理使用。
  const parts = date.toISOString().split('T')
  // dateStr 命名 `parts[0]`，让后续代码直接表达这个值的用途。
  const dateStr = parts[0]
  // dateStr缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!dateStr) {
    // 抛出 new Error('Invalid ISO date string')，阻止共享工具在无效状态下继续运行。
    throw new Error('Invalid ISO date string')
  }
  // 返回 `dateStr`，作为共享工具这次计算的结果。
  return dateStr
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
// getTodayDateString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTodayDateString(): string {
  // 返回 `toDateString(new Date())`，作为共享工具这次计算的结果。
  return toDateString(new Date())
}

/**
 * Get yesterday's date in YYYY-MM-DD format.
 */
// getYesterdayDateString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getYesterdayDateString(): string {
  // yesterday记录时间`Date`，供共享工具后续处理使用。
  const yesterday = new Date()
  // yesterday.setDate 写入新的状态值，使共享工具后续读取保持一致。
  yesterday.setDate(yesterday.getDate() - 1)
  // 返回 `toDateString(yesterday)`，作为共享工具这次计算的结果。
  return toDateString(yesterday)
}

/**
 * Check if a date string is before another date string.
 * Both should be in YYYY-MM-DD format.
 */
// isDateBefore 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDateBefore(date1: string, date2: string): boolean {
  // 返回 `date1 < date2`，作为共享工具这次计算的结果。
  return date1 < date2
}
