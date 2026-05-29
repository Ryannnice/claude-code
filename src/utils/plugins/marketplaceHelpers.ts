// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getSettingsForSource，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from '../settings/settings.js'
// 引入 plural，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { plural } from '../stringUtils.js'
// 引入 checkGitAvailable，将 ./gitAvailability.js 中已经封装好的能力接到本文件流程里。
import { checkGitAvailable } from './gitAvailability.js'
// 引入 getMarketplace，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { getMarketplace } from './marketplaceManager.js'
// 类型依赖 { KnownMarketplace, MarketplaceSource } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { KnownMarketplace, MarketplaceSource } from './schemas.js'

/**
 * Format plugin failure details for user display
 * @param failures - Array of failures with names and reasons
 * @param includeReasons - Whether to include failure reasons (true for full errors, false for summaries)
 * @returns Formatted string like "plugin-a (reason); plugin-b (reason)" or "plugin-a, plugin-b"
 */
// formatFailureDetails 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatFailureDetails(
  failures: Array<{ name: string; reason?: string; error?: string }>,
  includeReasons: boolean,
): string {
  // maxShow 命名 `2`，让后续代码直接表达这个值的用途。
  const maxShow = 2
  // details 集合保存`failures`，供后续判断或组装使用。
  const details = failures
    .slice(0, maxShow)
    // 链式调用 map，继续加工上一行在插件管理中产生的数据。
    .map(f => {
      // reason标记插件工具 marketplace Helpers是否启用对应路径。
      const reason = f.reason || f.error || 'unknown error'
      // 返回 `includeReasons ? `${f.name} (${reason})` : f.name`，作为插件管理这次计算的结果。
      return includeReasons ? `${f.name} (${reason})` : f.name
    })
    .join(includeReasons ? '; ' : ', ')

  // remaining保存 `failures.length - maxShow` 的判断结果，供插件工具 marketplace Helpers后续分支直接复用。
  const remaining = failures.length - maxShow
  // moreText 命名 `remaining > 0 ? ` and ${remaining} more` : ''`，让后续代码直接表达这个值的用途。
  const moreText = remaining > 0 ? ` and ${remaining} more` : ''

  // 返回 ``${details}${moreText}``，作为插件管理这次计算的结果。
  return `${details}${moreText}`
}

/**
 * Extract source display string from marketplace configuration
 */
// getMarketplaceSourceDisplay 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMarketplaceSourceDisplay(source: MarketplaceSource): string {
  // 按照 source.source 的取值选择插件管理的具体处理分支。
  switch (source.source) {
    case 'github':
      // 返回 `source.repo`，作为插件管理这次计算的结果。
      return source.repo
    case 'url':
      // 返回 `source.url`，作为插件管理这次计算的结果。
      return source.url
    case 'git':
      // 返回 `source.url`，作为插件管理这次计算的结果。
      return source.url
    case 'directory':
      // 返回 `source.path`，作为插件管理这次计算的结果。
      return source.path
    case 'file':
      // 返回 `source.path`，作为插件管理这次计算的结果。
      return source.path
    case 'settings':
      // 返回 ``settings:${source.name}``，作为插件管理这次计算的结果。
      return `settings:${source.name}`
    default:
      // 返回 `'Unknown source'`，作为插件管理这次计算的结果。
      return 'Unknown source'
  }
}

/**
 * Create a plugin ID from plugin name and marketplace name
 */
// createPluginId 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPluginId(
  pluginName: string,
  marketplaceName: string,
): string {
  // 返回 ``${pluginName}@${marketplaceName}``，作为插件管理这次计算的结果。
  return `${pluginName}@${marketplaceName}`
}

/**
 * Load marketplaces with graceful degradation for individual failures.
 * Blocked marketplaces (per enterprise policy) are excluded from the results.
 */
// loadMarketplacesWithGracefulDegradation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadMarketplacesWithGracefulDegradation(
  config: Record<string, KnownMarketplace>,
): Promise<{
  marketplaces: Array<{
    name: string
    config: KnownMarketplace
    data: Awaited<ReturnType<typeof getMarketplace>> | null
  }>
  failures: Array<{ name: string; error: string }>
}> {
  // marketplaces 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
  const marketplaces: Array<{
    name: string
    config: KnownMarketplace
    data: Awaited<ReturnType<typeof getMarketplace>> | null
  }> = []
  // failures 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const failures: Array<{ name: string; error: string }> = []

  // 循环处理 `const [name, marketplaceConfig] of Object.entries(config)`，让插件管理把同类条目按顺序走完。
  for (const [name, marketplaceConfig] of Object.entries(config)) {
    // Skip marketplaces blocked by enterprise policy
    // 满足 `!isSourceAllowedByPolicy(marketplaceConfig.source)` 时，插件管理执行该分支。
    if (!isSourceAllowedByPolicy(marketplaceConfig.source)) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // data 命名 `null`，让后续代码直接表达这个值的用途。
    let data = null
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // data更新为 `await getMarketplace(name)`，确保插件工具后续读取最新状态。
      data = await getMarketplace(name)
    } catch (err) {
      // Track individual marketplace failures but continue loading others
      // errorMessage 消息数据保存`String`，供插件管理后续处理使用。
      const errorMessage = err instanceof Error ? err.message : String(err)
      // failures 集合追加新条目，保持收集顺序与输入顺序一致。
      failures.push({ name, error: errorMessage })

      // Log for monitoring
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(toError(err))
    }

    // marketplaces 市场数据追加新条目，保持收集顺序与输入顺序一致。
    marketplaces.push({
      name,
      config: marketplaceConfig,
      data,
    })
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { marketplaces, failures }
}

/**
 * Format marketplace loading failures into appropriate user messages
 */
// formatMarketplaceLoadingErrors 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatMarketplaceLoadingErrors(
  failures: Array<{ name: string; error: string }>,
  successCount: number,
): { type: 'warning' | 'error'; message: string } | null {
  // failures 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (failures.length === 0) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // If some marketplaces succeeded, show warning
  // 满足 `successCount > 0` 时，插件管理执行该分支。
  if (successCount > 0) {
    // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const message =
      failures.length === 1
        ? `Warning: Failed to load marketplace '${failures[0]!.name}': ${failures[0]!.error}`
        : `Warning: Failed to load ${failures.length} marketplaces: ${formatFailureNames(failures)}`
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { type: 'warning', message }
  }

  // All marketplaces failed - this is a critical error
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    type: 'error',
    message: `Failed to load all marketplaces. Errors: ${formatFailureErrors(failures)}`,
  }
}

// formatFailureNames 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatFailureNames(
  failures: Array<{ name: string; error: string }>,
): string {
  // 返回 `failures.map(f => f.name).join(', ')`，作为插件管理这次计算的结果。
  return failures.map(f => f.name).join(', ')
}

// formatFailureErrors 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatFailureErrors(
  failures: Array<{ name: string; error: string }>,
): string {
  // 返回 `failures.map(f => `${f.name}: ${f.error}`).join('; ')`，作为插件管理这次计算的结果。
  return failures.map(f => `${f.name}: ${f.error}`).join('; ')
}

/**
 * Get the strict marketplace source allowlist from policy settings.
 * Returns null if no restriction is in place, or an array of allowed sources.
 */
// getStrictKnownMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStrictKnownMarketplaces(): MarketplaceSource[] | null {
  // policySettings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
  const policySettings = getSettingsForSource('policySettings')
  // 满足 `!policySettings?.strictKnownMarketplaces` 时，插件管理执行该分支。
  if (!policySettings?.strictKnownMarketplaces) {
    // 返回 `null // No restrictions`，作为插件管理这次计算的结果。
    return null // No restrictions
  }
  // 返回 `policySettings.strictKnownMarketplaces`，作为插件管理这次计算的结果。
  return policySettings.strictKnownMarketplaces
}

/**
 * Get the marketplace source blocklist from policy settings.
 * Returns null if no blocklist is in place, or an array of blocked sources.
 */
// getBlockedMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBlockedMarketplaces(): MarketplaceSource[] | null {
  // policySettings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
  const policySettings = getSettingsForSource('policySettings')
  // 满足 `!policySettings?.blockedMarketplaces` 时，插件管理执行该分支。
  if (!policySettings?.blockedMarketplaces) {
    // 返回 `null // No blocklist`，作为插件管理这次计算的结果。
    return null // No blocklist
  }
  // 返回 `policySettings.blockedMarketplaces`，作为插件管理这次计算的结果。
  return policySettings.blockedMarketplaces
}

/**
 * Get the custom plugin trust message from policy settings.
 * Returns undefined if not configured.
 */
// getPluginTrustMessage 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginTrustMessage(): string | undefined {
  // 返回 `getSettingsForSource('policySettings')?.pluginTrustMessage`，作为插件管理这次计算的结果。
  return getSettingsForSource('policySettings')?.pluginTrustMessage
}

/**
 * Compare two MarketplaceSource objects for equality.
 * Sources are equal if they have the same type and all relevant fields match.
 */
// areSourcesEqual 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function areSourcesEqual(a: MarketplaceSource, b: MarketplaceSource): boolean {
  // `a.source` 与 `b.source` 不一致时刷新派生状态，避免使用过期结果。
  if (a.source !== b.source) return false

  // 按照 a.source 的取值选择插件管理的具体处理分支。
  switch (a.source) {
    case 'url':
      // 返回 `a.url === (b as typeof a).url`，作为插件管理这次计算的结果。
      return a.url === (b as typeof a).url
    case 'github':
      // 返回 `(`，作为插件管理这次计算的结果。
      return (
        a.repo === (b as typeof a).repo &&
        (a.ref || undefined) === ((b as typeof a).ref || undefined) &&
        (a.path || undefined) === ((b as typeof a).path || undefined)
      )
    case 'git':
      // 返回 `(`，作为插件管理这次计算的结果。
      return (
        a.url === (b as typeof a).url &&
        (a.ref || undefined) === ((b as typeof a).ref || undefined) &&
        (a.path || undefined) === ((b as typeof a).path || undefined)
      )
    case 'npm':
      // 返回 `a.package === (b as typeof a).package`，作为插件管理这次计算的结果。
      return a.package === (b as typeof a).package
    case 'file':
      // 返回 `a.path === (b as typeof a).path`，作为插件管理这次计算的结果。
      return a.path === (b as typeof a).path
    case 'directory':
      // 返回 `a.path === (b as typeof a).path`，作为插件管理这次计算的结果。
      return a.path === (b as typeof a).path
    case 'settings':
      // 返回 `(`，作为插件管理这次计算的结果。
      return (
        a.name === (b as typeof a).name &&
        isEqual(a.plugins, (b as typeof a).plugins)
      )
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

/**
 * Extract the host/domain from a marketplace source.
 * Used for hostPattern matching in strictKnownMarketplaces.
 *
 * Currently only supports github, git, and url sources.
 * npm, file, and directory sources are not supported for hostPattern matching.
 *
 * @param source - The marketplace source to extract host from
 * @returns The hostname string, or null if extraction fails or source type not supported
 */
// extractHostFromSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractHostFromSource(
  source: MarketplaceSource,
): string | null {
  // 按照 source.source 的取值选择插件管理的具体处理分支。
  switch (source.source) {
    case 'github':
      // GitHub shorthand always means github.com
      // 返回 `'github.com'`，作为插件管理这次计算的结果。
      return 'github.com'

    case 'git': {
      // SSH format: user@HOST:path (e.g., git@github.com:owner/repo.git)
      // sshMatch匹配`url.match`，供插件管理后续处理使用。
      const sshMatch = source.url.match(/^[^@]+@([^:]+):/)
      // 满足 `sshMatch?.[1]` 时，插件管理执行该分支。
      if (sshMatch?.[1]) {
        // 返回 `sshMatch[1]`，作为插件管理这次计算的结果。
        return sshMatch[1]
      }
      // HTTPS format: extract hostname from URL
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 返回 `new URL(source.url).hostname`，作为插件管理这次计算的结果。
        return new URL(source.url).hostname
      } catch {
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }
    }

    case 'url':
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 返回 `new URL(source.url).hostname`，作为插件管理这次计算的结果。
        return new URL(source.url).hostname
      } catch {
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

    // npm, file, directory, hostPattern, pathPattern sources are not supported for hostPattern matching
    default:
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
  }
}

/**
 * Check if a source matches a hostPattern entry.
 * Extracts the host from the source and tests it against the regex pattern.
 *
 * @param source - The marketplace source to check
 * @param pattern - The hostPattern entry from strictKnownMarketplaces
 * @returns true if the source's host matches the pattern
 */
// doesSourceMatchHostPattern 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function doesSourceMatchHostPattern(
  source: MarketplaceSource,
  pattern: MarketplaceSource & { source: 'hostPattern' },
): boolean {
  // host保存`extractHostFromSource`，供插件管理后续处理使用。
  const host = extractHostFromSource(source)
  // host缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!host) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // regex匹配`RegExp`，供插件管理后续处理使用。
    const regex = new RegExp(pattern.hostPattern)
    // 返回 `regex.test(host)`，作为插件管理这次计算的结果。
    return regex.test(host)
  } catch {
    // Invalid regex - log and return false
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Invalid hostPattern regex: ${pattern.hostPattern}`))
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Check if a source matches a pathPattern entry.
 * Tests the source's .path (file and directory sources only) against the regex pattern.
 *
 * @param source - The marketplace source to check
 * @param pattern - The pathPattern entry from strictKnownMarketplaces
 * @returns true if the source's path matches the pattern
 */
// doesSourceMatchPathPattern 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function doesSourceMatchPathPattern(
  source: MarketplaceSource,
  pattern: MarketplaceSource & { source: 'pathPattern' },
): boolean {
  // Only file and directory sources have a .path to match against
  // `source.source` 与 `'file' && source.source !== 'di` 不一致时刷新派生状态，避免使用过期结果。
  if (source.source !== 'file' && source.source !== 'directory') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // regex匹配`RegExp`，供插件管理后续处理使用。
    const regex = new RegExp(pattern.pathPattern)
    // 返回 `regex.test(source.path)`，作为插件管理这次计算的结果。
    return regex.test(source.path)
  } catch {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Invalid pathPattern regex: ${pattern.pathPattern}`))
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Get hosts from hostPattern entries in the allowlist.
 * Used to provide helpful error messages.
 */
// getHostPatternsFromAllowlist 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHostPatternsFromAllowlist(): string[] {
  // allowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
  const allowlist = getStrictKnownMarketplaces()
  // allowlist 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!allowlist) return []

  // 返回 `allowlist`，作为插件管理这次计算的结果。
  return allowlist
    .filter(
      // 这个回调绑定到 (entry): entry is MarketplaceSource & { source: 'hostPattern' } =>，负责插件管理在该局部场景下的响应。
      (entry): entry is MarketplaceSource & { source: 'hostPattern' } =>
        entry.source === 'hostPattern',
    )
    // 链式调用 map，继续加工上一行在插件管理中产生的数据。
    .map(entry => entry.hostPattern)
}

/**
 * Extract GitHub owner/repo from a git URL if it's a GitHub URL.
 * Returns null if not a GitHub URL.
 *
 * Handles:
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo
 */
// extractGitHubRepoFromGitUrl 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractGitHubRepoFromGitUrl(url: string): string | null {
  // SSH format: git@github.com:owner/repo.git
  // sshMatch匹配`url.match`，供插件管理后续处理使用。
  const sshMatch = url.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/)
  // 只有 `sshMatch && sshMatch[1]` 满足时，插件管理才执行该分支。
  if (sshMatch && sshMatch[1]) {
    // 返回 `sshMatch[1]`，作为插件管理这次计算的结果。
    return sshMatch[1]
  }

  // HTTPS format: https://github.com/owner/repo.git or https://github.com/owner/repo
  // httpsMatch匹配`url.match`，供插件管理后续处理使用。
  const httpsMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/,
  )
  // 只有 `httpsMatch && httpsMatch[1]` 满足时，插件管理才执行该分支。
  if (httpsMatch && httpsMatch[1]) {
    // 返回 `httpsMatch[1]`，作为插件管理这次计算的结果。
    return httpsMatch[1]
  }

  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * Check if a blocked ref/path constraint matches a source.
 * If the blocklist entry has no ref/path, it matches ALL refs/paths (wildcard).
 * If the blocklist entry has a specific ref/path, it only matches that exact value.
 */
// blockedConstraintMatches 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function blockedConstraintMatches(
  blockedValue: string | undefined,
  sourceValue: string | undefined,
): boolean {
  // If blocklist doesn't specify a constraint, it's a wildcard - matches anything
  // blockedValue缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!blockedValue) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // If blocklist specifies a constraint, source must match exactly
  // 返回 `(blockedValue || undefined) === (sourceValue || undefined)`，作为插件管理这次计算的结果。
  return (blockedValue || undefined) === (sourceValue || undefined)
}

/**
 * Check if two sources refer to the same GitHub repository, even if using
 * different source types (github vs git with GitHub URL).
 *
 * Blocklist matching is asymmetric:
 * - If blocklist entry has no ref/path, it blocks ALL refs/paths (wildcard)
 * - If blocklist entry has a specific ref/path, only that exact value is blocked
 */
// areSourcesEquivalentForBlocklist 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function areSourcesEquivalentForBlocklist(
  source: MarketplaceSource,
  blocked: MarketplaceSource,
): boolean {
  // Check exact same source type
  // 满足 `source.source === blocked.source` 时，插件管理执行该分支。
  if (source.source === blocked.source) {
    // 按照 source.source 的取值选择插件管理的具体处理分支。
    switch (source.source) {
      case 'github': {
        // b保存`blocked as typeof source`，供后续判断或组装使用。
        const b = blocked as typeof source
        // `source.repo` 与 `b.repo` 不一致时刷新派生状态，避免使用过期结果。
        if (source.repo !== b.repo) return false
        // 返回 `(`，作为插件管理这次计算的结果。
        return (
          blockedConstraintMatches(b.ref, source.ref) &&
          blockedConstraintMatches(b.path, source.path)
        )
      }
      case 'git': {
        // b保存`blocked as typeof source`，供后续判断或组装使用。
        const b = blocked as typeof source
        // `source.url` 与 `b.url` 不一致时刷新派生状态，避免使用过期结果。
        if (source.url !== b.url) return false
        // 返回 `(`，作为插件管理这次计算的结果。
        return (
          blockedConstraintMatches(b.ref, source.ref) &&
          blockedConstraintMatches(b.path, source.path)
        )
      }
      case 'url':
        // 返回 `source.url === (blocked as typeof source).url`，作为插件管理这次计算的结果。
        return source.url === (blocked as typeof source).url
      case 'npm':
        // 返回 `source.package === (blocked as typeof source).package`，作为插件管理这次计算的结果。
        return source.package === (blocked as typeof source).package
      case 'file':
        // 返回 `source.path === (blocked as typeof source).path`，作为插件管理这次计算的结果。
        return source.path === (blocked as typeof source).path
      case 'directory':
        // 返回 `source.path === (blocked as typeof source).path`，作为插件管理这次计算的结果。
        return source.path === (blocked as typeof source).path
      case 'settings':
        // 返回 `source.name === (blocked as typeof source).name`，作为插件管理这次计算的结果。
        return source.name === (blocked as typeof source).name
      default:
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
    }
  }

  // Check if a git source matches a github blocklist entry
  // 只有 `source.source === 'git' && blocked.source === 'gi` 满足时，插件管理才执行该分支。
  if (source.source === 'git' && blocked.source === 'github') {
    // extractedRepo保存`extractGitHubRepoFromGitUrl`，供插件管理后续处理使用。
    const extractedRepo = extractGitHubRepoFromGitUrl(source.url)
    // 满足 `extractedRepo === blocked.repo` 时，插件管理执行该分支。
    if (extractedRepo === blocked.repo) {
      // 返回 `(`，作为插件管理这次计算的结果。
      return (
        blockedConstraintMatches(blocked.ref, source.ref) &&
        blockedConstraintMatches(blocked.path, source.path)
      )
    }
  }

  // Check if a github source matches a git blocklist entry (GitHub URL)
  // 只有 `source.source === 'github' && blocked.source ===` 满足时，插件管理才执行该分支。
  if (source.source === 'github' && blocked.source === 'git') {
    // extractedRepo保存`extractGitHubRepoFromGitUrl`，供插件管理后续处理使用。
    const extractedRepo = extractGitHubRepoFromGitUrl(blocked.url)
    // 满足 `extractedRepo === source.repo` 时，插件管理执行该分支。
    if (extractedRepo === source.repo) {
      // 返回 `(`，作为插件管理这次计算的结果。
      return (
        blockedConstraintMatches(blocked.ref, source.ref) &&
        blockedConstraintMatches(blocked.path, source.path)
      )
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a marketplace source is explicitly in the blocklist.
 * Used for error message differentiation.
 *
 * This also catches attempts to bypass a github blocklist entry by using
 * git URLs (e.g., git@github.com:owner/repo.git or https://github.com/owner/repo.git).
 */
// isSourceInBlocklist 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSourceInBlocklist(source: MarketplaceSource): boolean {
  // blocklist 集合读取`getBlockedMarketplaces`，供插件管理后续处理使用。
  const blocklist = getBlockedMarketplaces()
  // 满足 `blocklist === null` 时，插件管理执行该分支。
  if (blocklist === null) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `blocklist.some(blocked =>`，作为插件管理这次计算的结果。
  return blocklist.some(blocked =>
    areSourcesEquivalentForBlocklist(source, blocked),
  )
}

/**
 * Check if a marketplace source is allowed by enterprise policy.
 * Returns true if allowed (or no policy), false if blocked.
 * This check happens BEFORE downloading, so blocked sources never touch the filesystem.
 *
 * Policy precedence:
 * 1. blockedMarketplaces (blocklist) - if source matches, it's blocked
 * 2. strictKnownMarketplaces (allowlist) - if set, source must be in the list
 */
// isSourceAllowedByPolicy 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSourceAllowedByPolicy(source: MarketplaceSource): boolean {
  // Check blocklist first (takes precedence)
  // 满足 `isSourceInBlocklist(source)` 时，插件管理执行该分支。
  if (isSourceInBlocklist(source)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Then check allowlist
  // allowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
  const allowlist = getStrictKnownMarketplaces()
  // 满足 `allowlist === null` 时，插件管理执行该分支。
  if (allowlist === null) {
    // 返回 `true // No restrictions`，作为插件管理这次计算的结果。
    return true // No restrictions
  }

  // Check each entry in the allowlist
  // 返回 `allowlist.some(allowed => {`，作为插件管理这次计算的结果。
  return allowlist.some(allowed => {
    // Handle hostPattern entries - match by extracted host
    // 当 `allowed.source` 匹配 `'hostPattern'` 时，插件管理执行对应分支。
    if (allowed.source === 'hostPattern') {
      // 返回 `doesSourceMatchHostPattern(source, allowed)`，作为插件管理这次计算的结果。
      return doesSourceMatchHostPattern(source, allowed)
    }
    // Handle pathPattern entries - match file/directory .path by regex
    // 当 `allowed.source` 匹配 `'pathPattern'` 时，插件管理执行对应分支。
    if (allowed.source === 'pathPattern') {
      // 返回 `doesSourceMatchPathPattern(source, allowed)`，作为插件管理这次计算的结果。
      return doesSourceMatchPathPattern(source, allowed)
    }
    // Handle regular source entries - exact match
    // 返回 `areSourcesEqual(source, allowed)`，作为插件管理这次计算的结果。
    return areSourcesEqual(source, allowed)
  })
}

/**
 * Format a MarketplaceSource for display in error messages
 */
// formatSourceForDisplay 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatSourceForDisplay(source: MarketplaceSource): string {
  // 按照 source.source 的取值选择插件管理的具体处理分支。
  switch (source.source) {
    case 'github':
      // 返回 ``github:${source.repo}${source.ref ? `@${source.ref}` : ''}``，作为插件管理这次计算的结果。
      return `github:${source.repo}${source.ref ? `@${source.ref}` : ''}`
    case 'url':
      // 返回 `source.url`，作为插件管理这次计算的结果。
      return source.url
    case 'git':
      // 返回 ``git:${source.url}${source.ref ? `@${source.ref}` : ''}``，作为插件管理这次计算的结果。
      return `git:${source.url}${source.ref ? `@${source.ref}` : ''}`
    case 'npm':
      // 返回 ``npm:${source.package}``，作为插件管理这次计算的结果。
      return `npm:${source.package}`
    case 'file':
      // 返回 ``file:${source.path}``，作为插件管理这次计算的结果。
      return `file:${source.path}`
    case 'directory':
      // 返回 ``dir:${source.path}``，作为插件管理这次计算的结果。
      return `dir:${source.path}`
    case 'hostPattern':
      // 返回 ``hostPattern:${source.hostPattern}``，作为插件管理这次计算的结果。
      return `hostPattern:${source.hostPattern}`
    case 'pathPattern':
      // 返回 ``pathPattern:${source.pathPattern}``，作为插件管理这次计算的结果。
      return `pathPattern:${source.pathPattern}`
    case 'settings':
      // 返回 ``settings:${source.name} (${source.plugins.length} ${plural(source.plug...`，作为插件管理这次计算的结果。
      return `settings:${source.name} (${source.plugins.length} ${plural(source.plugins.length, 'plugin')})`
    default:
      // 返回 `'unknown source'`，作为插件管理这次计算的结果。
      return 'unknown source'
  }
}

/**
 * Reasons why no marketplaces are available in the Discover screen
 */
// EmptyMarketplaceReason 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type EmptyMarketplaceReason =
  | 'git-not-installed'
  | 'all-blocked-by-policy'
  | 'policy-restricts-sources'
  | 'all-marketplaces-failed'
  | 'no-marketplaces-configured'
  | 'all-plugins-installed'

/**
 * Detect why no marketplaces are available.
 * Checks in order of priority: git availability → policy restrictions → config state → failures
 */
// detectEmptyMarketplaceReason 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectEmptyMarketplaceReason({
  configuredMarketplaceCount,
  failedMarketplaceCount,
}: {
  configuredMarketplaceCount: number
  failedMarketplaceCount: number
}): Promise<EmptyMarketplaceReason> {
  // Check if git is installed (required for most marketplace sources)
  // gitAvailable读取`checkGitAvailable`，供插件管理后续处理使用。
  const gitAvailable = await checkGitAvailable()
  // gitAvailable缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!gitAvailable) {
    // 返回 `'git-not-installed'`，作为插件管理这次计算的结果。
    return 'git-not-installed'
  }

  // Check policy restrictions
  // allowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
  const allowlist = getStrictKnownMarketplaces()
  // `allowlist` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (allowlist !== null) {
    // allowlist 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
    if (allowlist.length === 0) {
      // Policy explicitly blocks all marketplaces
      // 返回 `'all-blocked-by-policy'`，作为插件管理这次计算的结果。
      return 'all-blocked-by-policy'
    }
    // Policy restricts which sources can be used
    // 满足 `configuredMarketplaceCount === 0` 时，插件管理执行该分支。
    if (configuredMarketplaceCount === 0) {
      // 返回 `'policy-restricts-sources'`，作为插件管理这次计算的结果。
      return 'policy-restricts-sources'
    }
  }

  // Check if any marketplaces are configured
  // 满足 `configuredMarketplaceCount === 0` 时，插件管理执行该分支。
  if (configuredMarketplaceCount === 0) {
    // 返回 `'no-marketplaces-configured'`，作为插件管理这次计算的结果。
    return 'no-marketplaces-configured'
  }

  // Check if all configured marketplaces failed to load
  // 插件管理在这里按实际状态进入对应分支。
  if (
    failedMarketplaceCount > 0 &&
    failedMarketplaceCount === configuredMarketplaceCount
  ) {
    // 返回 `'all-marketplaces-failed'`，作为插件管理这次计算的结果。
    return 'all-marketplaces-failed'
  }

  // Marketplaces are configured and loaded, but no plugins available
  // This typically means all plugins are already installed
  // 返回 `'all-plugins-installed'`，作为插件管理这次计算的结果。
  return 'all-plugins-installed'
}
