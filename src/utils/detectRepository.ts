// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getRemoteUrl，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { getRemoteUrl } from './git.js'

// ParsedRepository 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedRepository = {
  host: string
  owner: string
  name: string
}

// repositoryWithHostCache 缓存构建`new Map<string, ParsedRepository | null>()` 整理出中间结果，供共享工具 detect Repository后续步骤使用。
const repositoryWithHostCache = new Map<string, ParsedRepository | null>()

// clearRepositoryCaches 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearRepositoryCaches(): void {
  // 调用 repositoryWithHostCache.clear，触发共享工具此处需要的副作用。
  repositoryWithHostCache.clear()
}

// detectCurrentRepository 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectCurrentRepository(): Promise<string | null> {
  // 结果读取`detectCurrentRepositoryWithHost`，供共享工具后续处理使用。
  const result = await detectCurrentRepositoryWithHost()
  // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!result) return null
  // Only return results for github.com to avoid breaking downstream consumers
  // that assume the result is a github.com repository.
  // Use detectCurrentRepositoryWithHost() for GHE support.
  // `result.host` 与 `'github.com'` 不一致时刷新派生状态，避免使用过期结果。
  if (result.host !== 'github.com') return null
  // 返回 ``${result.owner}/${result.name}``，作为共享工具这次计算的结果。
  return `${result.owner}/${result.name}`
}

/**
 * Like detectCurrentRepository, but also returns the host (e.g. "github.com"
 * or a GHE hostname). Callers that need to construct URLs against a specific
 * GitHub host should use this variant.
 */
// detectCurrentRepositoryWithHost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectCurrentRepositoryWithHost(): Promise<ParsedRepository | null> {
  // cwd读取`getCwd`，供共享工具后续处理使用。
  const cwd = getCwd()

  // 满足 `repositoryWithHostCache.has(cwd)` 时，共享工具执行该分支。
  if (repositoryWithHostCache.has(cwd)) {
    // 返回 `repositoryWithHostCache.get(cwd) ?? null`，作为共享工具这次计算的结果。
    return repositoryWithHostCache.get(cwd) ?? null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // remoteUrl读取`getRemoteUrl`，供共享工具后续处理使用。
    const remoteUrl = await getRemoteUrl()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Git remote URL: ${remoteUrl}`)
    // remoteUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!remoteUrl) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('No git remote URL found')
      // repositoryWithHostCache.set 写入新的状态值，使共享工具后续读取保持一致。
      repositoryWithHostCache.set(cwd, null)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 解析结果解析`parseGitRemote`，供共享工具后续处理使用。
    const parsed = parseGitRemote(remoteUrl)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Parsed repository: ${parsed ? `${parsed.host}/${parsed.owner}/${parsed.name}` : null} from URL: ${remoteUrl}`,
    )
    // repositoryWithHostCache.set 写入新的状态值，使共享工具后续读取保持一致。
    repositoryWithHostCache.set(cwd, parsed)
    // 返回 `parsed`，作为共享工具这次计算的结果。
    return parsed
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error detecting repository: ${error}`)
    // repositoryWithHostCache.set 写入新的状态值，使共享工具后续读取保持一致。
    repositoryWithHostCache.set(cwd, null)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Synchronously returns the cached github.com repository for the current cwd
 * as "owner/name", or null if it hasn't been resolved yet or the host is not
 * github.com. Call detectCurrentRepository() first to populate the cache.
 *
 * Callers construct github.com URLs, so GHE hosts are filtered out here.
 */
// getCachedRepository 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedRepository(): string | null {
  // 解析结果读取`repositoryWithHostCache.get`，供共享工具后续处理使用。
  const parsed = repositoryWithHostCache.get(getCwd())
  // `!parsed || parsed.host` 与 `'github.com'` 不一致时刷新派生状态，避免使用过期结果。
  if (!parsed || parsed.host !== 'github.com') return null
  // 返回 ``${parsed.owner}/${parsed.name}``，作为共享工具这次计算的结果。
  return `${parsed.owner}/${parsed.name}`
}

/**
 * Parses a git remote URL into host, owner, and name components.
 * Accepts any host (github.com, GHE instances, etc.).
 *
 * Supports:
 *   https://host/owner/repo.git
 *   git@host:owner/repo.git
 *   ssh://git@host/owner/repo.git
 *   git://host/owner/repo.git
 *   https://host/owner/repo (no .git)
 *
 * Note: repo names can contain dots (e.g., cc.kurs.web)
 */
// parseGitRemote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseGitRemote(input: string): ParsedRepository | null {
  // trimmed格式化`input.trim`，供共享工具后续处理使用。
  const trimmed = input.trim()

  // SSH format: git@host:owner/repo.git
  // sshMatch匹配`trimmed.match`，供共享工具后续处理使用。
  const sshMatch = trimmed.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/)
  // 只有 `sshMatch?.[1] && sshMatch[2] && sshMatch[3]` 满足时，共享工具才执行该分支。
  if (sshMatch?.[1] && sshMatch[2] && sshMatch[3]) {
    // 满足 `!looksLikeRealHostname(sshMatch[1])` 时，共享工具执行该分支。
    if (!looksLikeRealHostname(sshMatch[1])) return null
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      host: sshMatch[1],
      owner: sshMatch[2],
      name: sshMatch[3],
    }
  }

  // URL format: https://host/owner/repo.git, ssh://git@host/owner/repo, git://host/owner/repo
  // urlMatch匹配`trimmed.match`，供共享工具后续处理使用。
  const urlMatch = trimmed.match(
    /^(https?|ssh|git):\/\/(?:[^@]+@)?([^/:]+(?::\d+)?)\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  )
  // 只有 `urlMatch?.[1] && urlMatch[2] && urlMatch[3] && ur` 满足时，共享工具才执行该分支。
  if (urlMatch?.[1] && urlMatch[2] && urlMatch[3] && urlMatch[4]) {
    // protocol保存`urlMatch[1]`，供共享工具 detect Repository后续判断或输出使用。
    const protocol = urlMatch[1]
    // hostWithPort保存`urlMatch[2]`，供共享工具 detect Repository后续判断或输出使用。
    const hostWithPort = urlMatch[2]
    // hostWithoutPort格式化`hostWithPort.split`，供共享工具后续处理使用。
    const hostWithoutPort = hostWithPort.split(':')[0] ?? ''
    // 满足 `!looksLikeRealHostname(hostWithoutPort)` 时，共享工具执行该分支。
    if (!looksLikeRealHostname(hostWithoutPort)) return null
    // Only preserve port for HTTPS — SSH/git ports are not usable for constructing
    // web URLs (e.g. ssh://git@ghe.corp.com:2222 → port 2222 is SSH, not HTTPS).
    // host 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const host =
      protocol === 'https' || protocol === 'http'
        ? hostWithPort
        : hostWithoutPort
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      host,
      owner: urlMatch[3],
      name: urlMatch[4],
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Parses a git remote URL or "owner/repo" string and returns "owner/repo".
 * Only returns results for github.com hosts — GHE URLs return null.
 * Use parseGitRemote() for GHE support.
 * Also accepts plain "owner/repo" strings for backward compatibility.
 */
// parseGitHubRepository 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseGitHubRepository(input: string): string | null {
  // trimmed格式化`input.trim`，供共享工具后续处理使用。
  const trimmed = input.trim()

  // Try parsing as a full remote URL first.
  // Only return results for github.com hosts — existing callers (VS Code extension,
  // bridge) assume this function is GitHub.com-specific. Use parseGitRemote() directly
  // for GHE support.
  // 解析结果解析`parseGitRemote`，供共享工具后续处理使用。
  const parsed = parseGitRemote(trimmed)
  // 满足 `parsed` 时，共享工具执行该分支。
  if (parsed) {
    // `parsed.host` 与 `'github.com'` 不一致时刷新派生状态，避免使用过期结果。
    if (parsed.host !== 'github.com') return null
    // 返回 ``${parsed.owner}/${parsed.name}``，作为共享工具这次计算的结果。
    return `${parsed.owner}/${parsed.name}`
  }

  // If no URL pattern matched, check if it's already in owner/repo format
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !trimmed.includes('://') &&
    !trimmed.includes('@') &&
    trimmed.includes('/')
  ) {
    // 片段列表格式化`trimmed.split`，供共享工具后续处理使用。
    const parts = trimmed.split('/')
    // 只有 `parts.length === 2 && parts[0] && parts[1]` 满足时，共享工具才执行该分支。
    if (parts.length === 2 && parts[0] && parts[1]) {
      // Remove .git extension if present
      // 当前仓库格式化`replace`，供共享工具后续处理使用。
      const repo = parts[1].replace(/\.git$/, '')
      // 返回 ``${parts[0]}/${repo}``，作为共享工具这次计算的结果。
      return `${parts[0]}/${repo}`
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Could not parse repository from: ${trimmed}`)
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks whether a hostname looks like a real domain name rather than an
 * SSH config alias. A simple dot-check is not enough because aliases like
 * "github.com-work" still contain a dot. We additionally require that the
 * last segment (the TLD) is purely alphabetic — real TLDs (com, org, io, net)
 * never contain hyphens or digits.
 */
// looksLikeRealHostname 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function looksLikeRealHostname(host: string): boolean {
  // 满足 `!host.includes('.')` 时，共享工具执行该分支。
  if (!host.includes('.')) return false
  // lastSegment格式化`host.split`，供共享工具后续处理使用。
  const lastSegment = host.split('.').pop()
  // lastSegment缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastSegment) return false
  // Real TLDs are purely alphabetic (e.g., "com", "org", "io").
  // SSH aliases like "github.com-work" have a last segment "com-work" which
  // contains a hyphen.
  // 返回 `/^[a-zA-Z]+$/.test(lastSegment)`，作为共享工具这次计算的结果。
  return /^[a-zA-Z]+$/.test(lastSegment)
}
