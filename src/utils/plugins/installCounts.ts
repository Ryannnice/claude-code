/**
 * Plugin install counts data layer
 *
 * This module fetches and caches plugin install counts from the official
 * Claude plugins statistics repository. The cache is refreshed if older
 * than 24 hours.
 *
 * Cache location: ~/.claude/plugins/install-counts-cache.json
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, rename, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage、getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 classifyFetchError、logPluginFetch，将 ./fetchTelemetry.js 中已经封装好的能力接到本文件流程里。
import { classifyFetchError, logPluginFetch } from './fetchTelemetry.js'
// 引入 getPluginsDirectory，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginsDirectory } from './pluginDirectories.js'

// INSTALL_COUNTS_CACHE_VERSION 缓存保存`1`，供插件工具 install Counts后续判断或输出使用。
const INSTALL_COUNTS_CACHE_VERSION = 1
// INSTALL_COUNTS_CACHE_FILENAME 文件数据固定为 `'install-counts-cache.json'`，作为插件工具 install Counts后续展示或比较的基准。
const INSTALL_COUNTS_CACHE_FILENAME = 'install-counts-cache.json'
// INSTALL_COUNTS_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const INSTALL_COUNTS_URL =
  'https://raw.githubusercontent.com/anthropics/claude-plugins-official/refs/heads/stats/stats/plugin-installs.json'
// CACHE_TTL_MS 缓存保存`24 * 60 * 60 * 1000 // 24 hours in milliseconds`，供插件工具 install Counts后续判断或输出使用。
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Structure of the install counts cache file
 */
// InstallCountsCache 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type InstallCountsCache = {
  version: number
  fetchedAt: string // ISO timestamp
  counts: Array<{
    plugin: string // "pluginName@marketplace"
    unique_installs: number
  }>
}

/**
 * Expected structure of the GitHub stats response
 */
// GitHubStatsResponse 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type GitHubStatsResponse = {
  plugins: Array<{
    plugin: string
    unique_installs: number
  }>
}

/**
 * Get the path to the install counts cache file
 */
// getInstallCountsCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInstallCountsCachePath(): string {
  // 返回 `join(getPluginsDirectory(), INSTALL_COUNTS_CACHE_FILENAME)`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), INSTALL_COUNTS_CACHE_FILENAME)
}

/**
 * Load the install counts cache from disk.
 * Returns null if the file doesn't exist, is invalid, or is stale (>24h old).
 */
// loadInstallCountsCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadInstallCountsCache(): Promise<InstallCountsCache | null> {
  // cachePath 路径数据读取`getInstallCountsCachePath`，供插件管理后续处理使用。
  const cachePath = getInstallCountsCachePath()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(cachePath, { encoding: 'utf-8' })
    // 解析结果解析`jsonParse`，供插件管理后续处理使用。
    const parsed = jsonParse(content) as unknown

    // Validate basic structure
    // 插件管理在这里按实际状态进入对应分支。
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      !('fetchedAt' in parsed) ||
      !('counts' in parsed)
    ) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Install counts cache has invalid structure')
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // cache 缓存解析`parsed as {`，供后续判断或组装使用。
    const cache = parsed as {
      version: unknown
      fetchedAt: unknown
      counts: unknown
    }

    // Validate version
    // `cache.version` 与 `INSTALL_COUNTS_CACHE_VERSION` 不一致时刷新派生状态，避免使用过期结果。
    if (cache.version !== INSTALL_COUNTS_CACHE_VERSION) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Install counts cache version mismatch (got ${cache.version}, expected ${INSTALL_COUNTS_CACHE_VERSION})`,
      )
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Validate fetchedAt and counts
    // `typeof cache.fetchedAt` 与 `'string' || !Array.isArray(cach...` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof cache.fetchedAt !== 'string' || !Array.isArray(cache.counts)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Install counts cache has invalid structure')
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Validate fetchedAt is a valid date
    // fetchedAt记录时间`Date`，供插件管理后续处理使用。
    const fetchedAt = new Date(cache.fetchedAt).getTime()
    // 满足 `Number.isNaN(fetchedAt)` 时，插件管理执行该分支。
    if (Number.isNaN(fetchedAt)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Install counts cache has invalid fetchedAt timestamp')
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Validate count entries have required fields
    // validCounts 数量筛选`counts.every`，供插件管理后续处理使用。
    const validCounts = cache.counts.every(
      // 这个回调绑定到 (entry): entry is { plugin: string; unique_installs: number } =>，负责插件管理在该局部场景下的响应。
      (entry): entry is { plugin: string; unique_installs: number } =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.plugin === 'string' &&
        typeof entry.unique_installs === 'number',
    )
    // validCounts 数量缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!validCounts) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Install counts cache has malformed entries')
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Check if cache is stale (>24 hours old)
    // now记录时间`Date.now`，供插件管理后续处理使用。
    const now = Date.now()
    // 满足 `now - fetchedAt > CACHE_TTL_MS` 时，插件管理执行该分支。
    if (now - fetchedAt > CACHE_TTL_MS) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Install counts cache is stale (>24h old)')
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Return validated cache
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      version: cache.version as number,
      fetchedAt: cache.fetchedAt,
      counts: cache.counts,
    }
  } catch (error) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load install counts cache: ${errorMessage(error)}`,
      )
    }
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Save the install counts cache to disk atomically.
 * Uses a temp file + rename pattern to prevent corruption.
 */
// saveInstallCountsCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveInstallCountsCache(
  cache: InstallCountsCache,
): Promise<void> {
  // cachePath 路径数据读取`getInstallCountsCachePath`，供插件管理后续处理使用。
  const cachePath = getInstallCountsCachePath()
  // tempPath 路径数据保存`randomBytes`，供插件管理后续处理使用。
  const tempPath = `${cachePath}.${randomBytes(8).toString('hex')}.tmp`

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Ensure the plugins directory exists
    // pluginsDir 插件数据读取`getPluginsDirectory`，供插件管理后续处理使用。
    const pluginsDir = getPluginsDirectory()
    // 等待 `getFsImplementation().mkdir(pluginsDir)` 完成，再继续插件工具 install Counts的异步流程。
    await getFsImplementation().mkdir(pluginsDir)

    // Write to temp file
    // 文本内容保存`jsonStringify`，供插件管理后续处理使用。
    const content = jsonStringify(cache, null, 2)
    // 等待 `writeFile(tempPath, content, {` 完成，再继续插件工具 install Counts的异步流程。
    await writeFile(tempPath, content, {
      encoding: 'utf-8',
      mode: 0o600,
    })

    // Atomic rename
    // 等待 `rename(tempPath, cachePath)` 完成，再继续插件工具 install Counts的异步流程。
    await rename(tempPath, cachePath)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Install counts cache saved successfully')
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // Clean up temp file if it exists
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(tempPath)` 完成，再继续插件工具 install Counts的异步流程。
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Fetch install counts from GitHub stats repository
 */
// fetchInstallCountsFromGitHub 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchInstallCountsFromGitHub(): Promise<
  Array<{ plugin: string; unique_installs: number }>
> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Fetching install counts from ${INSTALL_COUNTS_URL}`)

  // started记录时间`performance.now`，供插件管理后续处理使用。
  const started = performance.now()
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应 等待 `axios.get<GitHubStatsResponse>(INSTALL_COUNTS_URL, {`，确保继续执行前已有结果。
    const response = await axios.get<GitHubStatsResponse>(INSTALL_COUNTS_URL, {
      timeout: 10000,
    })

    // 只有 `!response.data?.plugins || !Array.isArray(response.data.plugins)` 满足时，插件管理才执行该分支。
    if (!response.data?.plugins || !Array.isArray(response.data.plugins)) {
      // 抛出 new Error('Invalid response format from install counts API')，阻止插件管理在无效状态下继续运行。
      throw new Error('Invalid response format from install counts API')
    }

    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'install_counts',
      INSTALL_COUNTS_URL,
      'success',
      performance.now() - started,
    )
    // 返回 `response.data.plugins`，作为插件管理这次计算的结果。
    return response.data.plugins
  } catch (error) {
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'install_counts',
      INSTALL_COUNTS_URL,
      'failure',
      performance.now() - started,
      classifyFetchError(error),
    )
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }
}

/**
 * Get plugin install counts as a Map.
 * Uses cached data if available and less than 24 hours old.
 * Returns null on errors so UI can hide counts rather than show misleading zeros.
 *
 * @returns Map of plugin ID (name@marketplace) to install count, or null if unavailable
 */
// getInstallCounts 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getInstallCounts(): Promise<Map<string, number> | null> {
  // Try to load from cache first
  // cache 缓存读取`loadInstallCountsCache`，供插件管理后续处理使用。
  const cache = await loadInstallCountsCache()
  // 满足 `cache` 时，插件管理执行该分支。
  if (cache) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Using cached install counts')
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch('install_counts', INSTALL_COUNTS_URL, 'cache_hit', 0)
    // map构建`new Map<string, number>()`，供后续判断或组装使用。
    const map = new Map<string, number>()
    // 按顺序遍历 `cache.counts` 中的entry，逐个交给插件管理处理。
    for (const entry of cache.counts) {
      // map.set 写入新的状态值，使插件管理后续读取保持一致。
      map.set(entry.plugin, entry.unique_installs)
    }
    // 返回 `map`，作为插件管理这次计算的结果。
    return map
  }

  // Cache miss or stale - fetch from GitHub
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // counts 数量读取`fetchInstallCountsFromGitHub`，供插件管理后续处理使用。
    const counts = await fetchInstallCountsFromGitHub()

    // Save to cache
    // newCache 缓存 集中保存插件工具 install Counts要一起传递的字段。
    const newCache: InstallCountsCache = {
      version: INSTALL_COUNTS_CACHE_VERSION,
      fetchedAt: new Date().toISOString(),
      counts,
    }
    // 等待 `saveInstallCountsCache(newCache)` 完成，再继续插件工具 install Counts的异步流程。
    await saveInstallCountsCache(newCache)

    // Convert to Map
    // map构建`new Map<string, number>()`，供后续判断或组装使用。
    const map = new Map<string, number>()
    // 按顺序遍历 `counts` 中的entry，逐个交给插件管理处理。
    for (const entry of counts) {
      // map.set 写入新的状态值，使插件管理后续读取保持一致。
      map.set(entry.plugin, entry.unique_installs)
    }
    // 返回 `map`，作为插件管理这次计算的结果。
    return map
  } catch (error) {
    // Log error and return null so UI can hide counts
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to fetch install counts: ${errorMessage(error)}`)
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Format an install count for display.
 *
 * @param count - The raw install count
 * @returns Formatted string:
 *   - <1000: raw number (e.g., "42")
 *   - >=1000: K suffix with 1 decimal (e.g., "1.2K", "36.2K")
 *   - >=1000000: M suffix with 1 decimal (e.g., "1.2M")
 */
// formatInstallCount 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatInstallCount(count: number): string {
  // 满足 `count < 1000` 时，插件管理执行该分支。
  if (count < 1000) {
    // 返回 `String(count)`，作为插件管理这次计算的结果。
    return String(count)
  }

  // 满足 `count < 1000000` 时，插件管理执行该分支。
  if (count < 1000000) {
    // k统计`count / 1000`，供后续判断或组装使用。
    const k = count / 1000
    // Use toFixed(1) but remove trailing .0
    // formatted保存`k.toFixed`，供插件管理后续处理使用。
    const formatted = k.toFixed(1)
    // 返回 `formatted.endsWith('.0')`，作为插件管理这次计算的结果。
    return formatted.endsWith('.0')
      ? `${formatted.slice(0, -2)}K`
      : `${formatted}K`
  }

  // m统计`count / 1000000` 整理出中间结果，供插件工具 install Counts后续步骤使用。
  const m = count / 1000000
  // formatted保存`m.toFixed`，供插件管理后续处理使用。
  const formatted = m.toFixed(1)
  // 返回 `formatted.endsWith('.0')`，作为插件管理这次计算的结果。
  return formatted.endsWith('.0')
    ? `${formatted.slice(0, -2)}M`
    : `${formatted}M`
}
