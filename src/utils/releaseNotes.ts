// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 coerce，将 semver 中已经封装好的能力接到本文件流程里。
import { coerce } from 'semver'
// 引入 getIsNonInteractiveSession，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 isEssentialTrafficOnly，将 ./privacyLevel.js 中已经封装好的能力接到本文件流程里。
import { isEssentialTrafficOnly } from './privacyLevel.js'
// 引入 gt，将 ./semver.js 中已经封装好的能力接到本文件流程里。
import { gt } from './semver.js'

// MAX_RELEASE_NOTES_SHOWN保存`5`，供后续判断或组装使用。
const MAX_RELEASE_NOTES_SHOWN = 5

/**
 * We fetch the changelog from GitHub instead of bundling it with the build.
 *
 * This is necessary because Ink's static rendering makes it difficult to
 * dynamically update/show components after initial render. By storing the
 * changelog in config, we ensure it's available on the next startup without
 * requiring a full re-render of the current UI.
 *
 * The flow is:
 * 1. User updates to a new version
 * 2. We fetch the changelog in the background and store it in config
 * 3. Next time the user starts Claude, the cached changelog is available immediately
 */
// CHANGELOG_URL 先占位，稍后的条件分支会根据实际输入补齐它。
export const CHANGELOG_URL =
  'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md'
// RAW_CHANGELOG_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const RAW_CHANGELOG_URL =
  'https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md'

/**
 * Get the path for the cached changelog file.
 * The changelog is stored at ~/.claude/cache/changelog.md
 */
// getChangelogCachePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getChangelogCachePath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'cache', 'changelog.md')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'cache', 'changelog.md')
}

// In-memory cache populated by async reads. Sync callers (React render, sync
// helpers) read from this cache after setup.ts awaits checkForReleaseNotes().
// changelogMemoryCache 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let changelogMemoryCache: string | null = null

/** @internal exported for tests */
// _resetChangelogCacheForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetChangelogCacheForTesting(): void {
  // changelogMemoryCache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  changelogMemoryCache = null
}

/**
 * Migrate changelog from old config-based storage to file-based storage.
 * This should be called once at startup to ensure the migration happens
 * before any other config saves that might re-add the deprecated field.
 */
// migrateChangelogFromConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function migrateChangelogFromConfig(): Promise<void> {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // config.cachedChangelog 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!config.cachedChangelog) {
    // 共享工具 release Notes在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // cachePath 路径数据读取`getChangelogCachePath`，供共享工具后续处理使用。
  const cachePath = getChangelogCachePath()

  // If cache file doesn't exist, create it from old config
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dirname(cachePath), { recursive: true })` 完成，再继续共享工具 release Notes的异步流程。
    await mkdir(dirname(cachePath), { recursive: true })
    // 等待 `writeFile(cachePath, config.cachedChangelog, {` 完成，再继续共享工具 release Notes的异步流程。
    await writeFile(cachePath, config.cachedChangelog, {
      encoding: 'utf-8',
      flag: 'wx', // Write only if file doesn't exist
    })
  } catch {
    // File already exists, which is fine - skip silently
  }

  // Remove the deprecated field from config
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(({ cachedChangelog: _, ...rest }) => rest)
}

/**
 * Fetch the changelog from GitHub and store it in cache file
 * This runs in the background and doesn't block the UI
 */
// fetchAndStoreChangelog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchAndStoreChangelog(): Promise<void> {
  // Skip in noninteractive mode
  // 满足 `getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (getIsNonInteractiveSession()) {
    // 共享工具 release Notes在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Skip network requests if nonessential traffic is disabled
  // 满足 `isEssentialTrafficOnly()` 时，共享工具执行该分支。
  if (isEssentialTrafficOnly()) {
    // 共享工具 release Notes在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 接口响应读取`axios.get`，供共享工具后续处理使用。
  const response = await axios.get(RAW_CHANGELOG_URL)
  // 满足 `response.status === 200` 时，共享工具执行该分支。
  if (response.status === 200) {
    // changelogContent 命名 `response.data`，让后续代码直接表达这个值的用途。
    const changelogContent = response.data

    // Skip write if content unchanged — writing Date.now() defeats the
    // dirty-check in saveGlobalConfig since the timestamp always differs.
    // 满足 `changelogContent === changelogMemoryCache` 时，共享工具执行该分支。
    if (changelogContent === changelogMemoryCache) {
      // 共享工具 release Notes在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // cachePath 路径数据读取`getChangelogCachePath`，供共享工具后续处理使用。
    const cachePath = getChangelogCachePath()

    // Ensure cache directory exists
    // 等待 `mkdir(dirname(cachePath), { recursive: true })` 完成，再继续共享工具 release Notes的异步流程。
    await mkdir(dirname(cachePath), { recursive: true })

    // Write changelog to cache file
    // 等待 `writeFile(cachePath, changelogContent, { encoding: 'utf-8' })` 完成，再继续共享工具 release Notes的异步流程。
    await writeFile(cachePath, changelogContent, { encoding: 'utf-8' })
    // changelogMemoryCache 缓存更新为 `changelogContent`，确保共享工具后续读取最新状态。
    changelogMemoryCache = changelogContent

    // Update timestamp in config
    // changelogLastFetched记录时间`Date.now`，供共享工具后续处理使用。
    const changelogLastFetched = Date.now()
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      changelogLastFetched,
    }))
  }
}

/**
 * Get the stored changelog from cache file if available.
 * Populates the in-memory cache for subsequent sync reads.
 * @returns The cached changelog content or empty string if not available
 */
// getStoredChangelog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getStoredChangelog(): Promise<string> {
  // `changelogMemoryCache` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (changelogMemoryCache !== null) {
    // 返回 `changelogMemoryCache`，作为共享工具这次计算的结果。
    return changelogMemoryCache
  }
  // cachePath 路径数据读取`getChangelogCachePath`，供共享工具后续处理使用。
  const cachePath = getChangelogCachePath()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(cachePath, 'utf-8')
    // changelogMemoryCache 缓存更新为 `content`，确保共享工具后续读取最新状态。
    changelogMemoryCache = content
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  } catch {
    // changelogMemoryCache 缓存更新为 `''`，确保共享工具后续读取最新状态。
    changelogMemoryCache = ''
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
}

/**
 * Synchronous accessor for the changelog, reading only from the in-memory cache.
 * Returns empty string if the async getStoredChangelog() hasn't been called yet.
 * Intended for React render paths where async is not possible; setup.ts ensures
 * the cache is populated before first render via `await checkForReleaseNotes()`.
 */
// getStoredChangelogFromMemory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStoredChangelogFromMemory(): string {
  // 返回 `changelogMemoryCache ?? ''`，作为共享工具这次计算的结果。
  return changelogMemoryCache ?? ''
}

/**
 * Parses a changelog string in markdown format into a structured format
 * @param content - The changelog content string
 * @returns Record mapping version numbers to arrays of release notes
 */
// parseChangelog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseChangelog(content: string): Record<string, string[]> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!content) return {}

    // Parse the content
    // releaseNotes 集合 从空对象开始收集键值，后续按名称补齐内容。
    const releaseNotes: Record<string, string[]> = {}

    // Split by heading lines (## X.X.X)
    // sections 集合格式化`content.split`，供共享工具后续处理使用。
    const sections = content.split(/^## /gm).slice(1) // Skip the first section which is the header

    // 按顺序遍历 `sections` 中的section，逐个交给共享工具处理。
    for (const section of sections) {
      // 文本行格式化`section.trim`，供共享工具后续处理使用。
      const lines = section.trim().split('\n')
      // 文本行为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (lines.length === 0) continue

      // Extract version from the first line
      // Handle both "1.2.3" and "1.2.3 - YYYY-MM-DD" formats
      // versionLine读取 `lines[0]` 对应条目，后续围绕该成员继续处理。
      const versionLine = lines[0]
      // versionLine缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!versionLine) continue

      // First part before any dash is the version
      // version格式化`versionLine.split`，供共享工具后续处理使用。
      const version = versionLine.split(' - ')[0]?.trim() || ''
      // version缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!version) continue

      // Extract bullet points
      // notes 集合保存`lines`，供后续判断或组装使用。
      const notes = lines
        .slice(1)
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(line => line.trim().startsWith('- '))
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(line => line.trim().substring(2).trim())
        .filter(Boolean)

      // 满足 `notes.length > 0` 时，共享工具执行该分支。
      if (notes.length > 0) {
        // releaseNotes[version更新为 `notes`，确保共享工具 release Notes后续读取最新状态。
        releaseNotes[version] = notes
      }
    }

    // 返回 `releaseNotes`，作为共享工具这次计算的结果。
    return releaseNotes
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }
}

/**
 * Gets release notes to show based on the previously seen version.
 * Shows up to MAX_RELEASE_NOTES_SHOWN items total, prioritizing the most recent versions.
 *
 * @param currentVersion - The current app version
 * @param previousVersion - The last version where release notes were seen (or null if first time)
 * @param readChangelog - Function to read the changelog (defaults to readChangelogFile)
 * @returns Array of release notes to display
 */
// getRecentReleaseNotes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRecentReleaseNotes(
  currentVersion: string,
  previousVersion: string | null | undefined,
  changelogContent: string = getStoredChangelogFromMemory(),
): string[] {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // releaseNotes 集合解析`parseChangelog`，供共享工具后续处理使用。
    const releaseNotes = parseChangelog(changelogContent)

    // Strip SHA from both versions to compare only the base versions
    // baseCurrentVersion保存`coerce`，供共享工具后续处理使用。
    const baseCurrentVersion = coerce(currentVersion)
    // basePreviousVersion保存`coerce`，供共享工具后续处理使用。
    const basePreviousVersion = previousVersion ? coerce(previousVersion) : null

    // 共享工具在这里按实际状态进入对应分支。
    if (
      !basePreviousVersion ||
      (baseCurrentVersion &&
        gt(baseCurrentVersion.version, basePreviousVersion.version))
    ) {
      // Get all versions that are newer than the last seen version
      // 返回 `Object.entries(releaseNotes)`，作为共享工具这次计算的结果。
      return Object.entries(releaseNotes)
        .filter(
          // 这个回调绑定到 ([version]) =>，负责共享工具在该局部场景下的响应。
          ([version]) =>
            !basePreviousVersion || gt(version, basePreviousVersion.version),
        )
        // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
        .sort(([versionA], [versionB]) => (gt(versionA, versionB) ? -1 : 1)) // Sort newest first
        // 链式调用 flatMap，继续加工上一行在共享工具中产生的数据。
        .flatMap(([_, notes]) => notes)
        .filter(Boolean)
        .slice(0, MAX_RELEASE_NOTES_SHOWN)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Gets all release notes as an array of [version, notes] arrays.
 * Versions are sorted with oldest first.
 *
 * @param readChangelog - Function to read the changelog (defaults to readChangelogFile)
 * @returns Array of [version, notes[]] arrays
 */
// getAllReleaseNotes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllReleaseNotes(
  changelogContent: string = getStoredChangelogFromMemory(),
): Array<[string, string[]]> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // releaseNotes 集合解析`parseChangelog`，供共享工具后续处理使用。
    const releaseNotes = parseChangelog(changelogContent)

    // Sort versions with oldest first
    // sortedVersions 集合派生`Object.keys`，供共享工具后续处理使用。
    const sortedVersions = Object.keys(releaseNotes).sort((a, b) =>
      gt(a, b) ? 1 : -1,
    )

    // Return array of [version, notes] arrays
    // 返回 `sortedVersions`，作为共享工具这次计算的结果。
    return sortedVersions
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(version => {
        // versionNotes 集合 命名 `releaseNotes[version]`，让后续代码直接表达这个值的用途。
        const versionNotes = releaseNotes[version]
        // !versionNotes || versionNotes 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
        if (!versionNotes || versionNotes.length === 0) return null

        // notes 集合筛选`versionNotes.filter`，供共享工具后续处理使用。
        const notes = versionNotes.filter(Boolean)
        // notes 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
        if (notes.length === 0) return null

        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [version, notes] as [string, string[]]
      })
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((item): item is [string, string[]] => item !== null)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Checks if there are release notes to show based on the last seen version.
 * Can be used by multiple components to determine whether to display release notes.
 * Also triggers a fetch of the latest changelog if the version has changed.
 *
 * @param lastSeenVersion The last version of release notes the user has seen
 * @param currentVersion The current application version, defaults to MACRO.VERSION
 * @returns An object with hasReleaseNotes and the releaseNotes content
 */
// checkForReleaseNotes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkForReleaseNotes(
  lastSeenVersion: string | null | undefined,
  currentVersion: string = MACRO.VERSION,
): Promise<{ hasReleaseNotes: boolean; releaseNotes: string[] }> {
  // For Ant builds, use VERSION_CHANGELOG bundled at build time
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // changelog保存`MACRO.VERSION_CHANGELOG`，供后续判断或组装使用。
    const changelog = MACRO.VERSION_CHANGELOG
    // 满足 `changelog` 时，共享工具执行该分支。
    if (changelog) {
      // commits 集合格式化`changelog.trim`，供共享工具后续处理使用。
      const commits = changelog.trim().split('\n').filter(Boolean)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        hasReleaseNotes: commits.length > 0,
        releaseNotes: commits,
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      hasReleaseNotes: false,
      releaseNotes: [],
    }
  }

  // Ensure the in-memory cache is populated for subsequent sync reads
  // cachedChangelog 缓存读取`getStoredChangelog`，供共享工具后续处理使用。
  const cachedChangelog = await getStoredChangelog()

  // If the version has changed or we don't have a cached changelog, fetch a new one
  // This happens in the background and doesn't block the UI
  // `lastSeenVersion` 与 `currentVersion || !cachedChan` 不一致时刷新派生状态，避免使用过期结果。
  if (lastSeenVersion !== currentVersion || !cachedChangelog) {
    // 调用 fetchAndStoreChangelog，触发共享工具此处需要的副作用。
    fetchAndStoreChangelog().catch(error => logError(toError(error)))
  }

  // releaseNotes 集合读取`getRecentReleaseNotes`，供共享工具后续处理使用。
  const releaseNotes = getRecentReleaseNotes(
    currentVersion,
    lastSeenVersion,
    cachedChangelog,
  )
  // hasReleaseNotes 集合标记共享工具 release Notes是否启用对应路径。
  const hasReleaseNotes = releaseNotes.length > 0

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    hasReleaseNotes,
    releaseNotes,
  }
}

/**
 * Synchronous variant of checkForReleaseNotes for React render paths.
 * Reads only from the in-memory cache populated by the async version.
 * setup.ts awaits checkForReleaseNotes() before first render, so this
 * returns accurate results in component render bodies.
 */
// checkForReleaseNotesSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkForReleaseNotesSync(
  lastSeenVersion: string | null | undefined,
  currentVersion: string = MACRO.VERSION,
): { hasReleaseNotes: boolean; releaseNotes: string[] } {
  // For Ant builds, use VERSION_CHANGELOG bundled at build time
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // changelog保存`MACRO.VERSION_CHANGELOG`，供后续判断或组装使用。
    const changelog = MACRO.VERSION_CHANGELOG
    // 满足 `changelog` 时，共享工具执行该分支。
    if (changelog) {
      // commits 集合格式化`changelog.trim`，供共享工具后续处理使用。
      const commits = changelog.trim().split('\n').filter(Boolean)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        hasReleaseNotes: commits.length > 0,
        releaseNotes: commits,
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      hasReleaseNotes: false,
      releaseNotes: [],
    }
  }

  // releaseNotes 集合读取`getRecentReleaseNotes`，供共享工具后续处理使用。
  const releaseNotes = getRecentReleaseNotes(currentVersion, lastSeenVersion)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    hasReleaseNotes: releaseNotes.length > 0,
    releaseNotes,
  }
}
