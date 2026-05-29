// 引入 axios、AxiosResponse，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosResponse } from 'axios'
// 引入 LRUCache，将 lru-cache 中已经封装好的能力接到本文件流程里。
import { LRUCache } from 'lru-cache'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 queryHaiku 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryHaiku } from '../../services/api/claude.js'
// 复用 AbortError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { AbortError } from '../../utils/errors.js'
// 复用 getWebFetchUserAgent 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getWebFetchUserAgent } from '../../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isBinaryContentType,
  persistBinaryContent,
} from '../../utils/mcpOutputStorage.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../../utils/settings/settings.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'
// 引入 isPreapprovedHost，将 ./preapproved.js 中已经封装好的能力接到本文件流程里。
import { isPreapprovedHost } from './preapproved.js'
// 引入 makeSecondaryModelPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { makeSecondaryModelPrompt } from './prompt.js'

// Custom error classes for domain blocking
// DomainBlockedError 聚合工具调用相关状态与操作，把同一职责的行为收束到类实例中。
class DomainBlockedError extends Error {
  // 构造函数接收 domain: string，把外部输入整理成实例可复用的内部状态。
  constructor(domain: string) {
    // 调用 super，触发工具调用此处需要的副作用。
    super(`Claude Code is unable to fetch from ${domain}`)
    // 更新实例字段 name 为 'DomainBlockedError'，同步工具调用的内部状态。
    this.name = 'DomainBlockedError'
  }
}

// DomainCheckFailedError 聚合工具调用相关状态与操作，把同一职责的行为收束到类实例中。
class DomainCheckFailedError extends Error {
  // 构造函数接收 domain: string，把外部输入整理成实例可复用的内部状态。
  constructor(domain: string) {
    // 调用 super，触发工具调用此处需要的副作用。
    super(
      `Unable to verify if domain ${domain} is safe to fetch. This may be due to network restrictions or enterprise security policies blocking claude.ai.`,
    )
    // 更新实例字段 name 为 'DomainCheckFailedError'，同步工具调用的内部状态。
    this.name = 'DomainCheckFailedError'
  }
}

// EgressBlockedError 聚合工具调用相关状态与操作，把同一职责的行为收束到类实例中。
class EgressBlockedError extends Error {
  // 构造函数接收 public readonly domain: string，把外部输入整理成实例可复用的内部状态。
  constructor(public readonly domain: string) {
    // 调用 super，触发工具调用此处需要的副作用。
    super(
      JSON.stringify({
        error_type: 'EGRESS_BLOCKED',
        domain,
        message: `Access to ${domain} is blocked by the network egress proxy.`,
      }),
    )
    // 更新实例字段 name 为 'EgressBlockedError'，同步工具调用的内部状态。
    this.name = 'EgressBlockedError'
  }
}

// Cache for storing fetched URL content
// CacheEntry 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type CacheEntry = {
  bytes: number
  code: number
  codeText: string
  content: string
  contentType: string
  persistedPath?: string
  persistedSize?: number
}

// Cache with 15-minute TTL and 50MB size limit
// LRUCache handles automatic expiration and eviction
// CACHE_TTL_MS 缓存保存`15 * 60 * 1000 // 15 minutes`，供后续判断或组装使用。
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
// MAX_CACHE_SIZE_BYTES 缓存保存`50 * 1024 * 1024 // 50MB`，供工具实现 utils后续判断或输出使用。
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

// URL_CACHE 缓存 命名 `new LRUCache<string, CacheEntry>({`，让后续代码直接表达这个值的用途。
const URL_CACHE = new LRUCache<string, CacheEntry>({
  maxSize: MAX_CACHE_SIZE_BYTES,
  ttl: CACHE_TTL_MS,
})

// Separate cache for preflight domain checks. URL_CACHE is URL-keyed, so
// fetching two paths on the same domain triggers two identical preflight
// HTTP round-trips to api.anthropic.com. This hostname-keyed cache avoids
// that. Only 'allowed' is cached — blocked/failed re-check on next attempt.
// DOMAIN_CHECK_CACHE 缓存构建`new LRUCache<string, true>({`，供后续判断或组装使用。
const DOMAIN_CHECK_CACHE = new LRUCache<string, true>({
  max: 128,
  ttl: 5 * 60 * 1000, // 5 minutes — shorter than URL_CACHE TTL
})

// clearWebFetchCache 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearWebFetchCache(): void {
  // 调用 URL_CACHE.clear，触发工具调用此处需要的副作用。
  URL_CACHE.clear()
  // 调用 DOMAIN_CHECK_CACHE.clear，触发工具调用此处需要的副作用。
  DOMAIN_CHECK_CACHE.clear()
}

// Lazy singleton — defers the turndown → @mixmark-io/domino import (~1.4MB
// retained heap) until the first HTML fetch, and reuses one instance across
// calls (construction builds 15 rule objects; .turndown() is stateless).
// @types/turndown ships only `export =` (no .d.mts), so TS types the import
// as the class itself while Bun wraps CJS in { default } — hence the cast.
// TurndownCtor 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type TurndownCtor = typeof import('turndown')
// turndownServicePromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
let turndownServicePromise: Promise<InstanceType<TurndownCtor>> | undefined
// getTurndownService 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTurndownService(): Promise<InstanceType<TurndownCtor>> {
  // 返回 `(turndownServicePromise ??= import('turndown').then(m => {`，作为工具调用这次计算的结果。
  return (turndownServicePromise ??= import('turndown').then(m => {
    // Turndown保存`(m as unknown as { default: TurndownCtor }).default`，供后续判断或组装使用。
    const Turndown = (m as unknown as { default: TurndownCtor }).default
    // 返回 `new Turndown()`，作为工具调用这次计算的结果。
    return new Turndown()
  }))
}

// PSR requested limiting the length of URLs to 250 to lower the potential
// for a data exfiltration. However, this is too restrictive for some customers'
// legitimate use cases, such as JWT-signed URLs (e.g., cloud service signed URLs)
// that can be much longer. We already require user approval for each domain,
// which provides a primary security boundary. In addition, Claude Code has
// other data exfil channels, and this one does not seem relatively high risk,
// so I'm removing that length restriction. -ab
// MAX_URL_LENGTH 数量保存`2000`，供工具实现 utils后续判断或输出使用。
const MAX_URL_LENGTH = 2000

// Per PSR:
// "Implement resource consumption controls because setting limits on CPU,
// memory, and network usage for the Web Fetch tool can prevent a single
// request or user from overwhelming the system."
// MAX_HTTP_CONTENT_LENGTH 数量保存`10 * 1024 * 1024`，供后续判断或组装使用。
const MAX_HTTP_CONTENT_LENGTH = 10 * 1024 * 1024

// Timeout for the main HTTP fetch request (60 seconds).
// Prevents hanging indefinitely on slow/unresponsive servers.
// FETCH_TIMEOUT_MS 集合保存`60_000`，供工具实现 utils后续判断或输出使用。
const FETCH_TIMEOUT_MS = 60_000

// Timeout for the domain blocklist preflight check (10 seconds).
// DOMAIN_CHECK_TIMEOUT_MS 集合 命名 `10_000`，让后续代码直接表达这个值的用途。
const DOMAIN_CHECK_TIMEOUT_MS = 10_000

// Cap same-host redirect hops. Without this a malicious server can return
// a redirect loop (/a → /b → /a …) and the per-request FETCH_TIMEOUT_MS
// resets on every hop, hanging the tool until user interrupt. 10 matches
// common client defaults (axios=5, follow-redirects=21, Chrome=20).
// MAX_REDIRECTS 集合 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_REDIRECTS = 10

// Truncate to not spend too many tokens
// MAX_MARKDOWN_LENGTH 数量保存`100_000`，供工具实现 utils后续判断或输出使用。
export const MAX_MARKDOWN_LENGTH = 100_000

// isPreapprovedUrl 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPreapprovedUrl(url: string): boolean {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // parsedUrl保存`URL`，供工具调用后续处理使用。
    const parsedUrl = new URL(url)
    // 返回 `isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)`，作为工具调用这次计算的结果。
    return isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// validateURL 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateURL(url: string): boolean {
  // 满足 `url.length > MAX_URL_LENGTH` 时，工具调用执行该分支。
  if (url.length > MAX_URL_LENGTH) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // parsed 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let parsed
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `new URL(url)`，确保工具调用后续读取最新状态。
    parsed = new URL(url)
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // We don't need to check protocol here, as we'll upgrade http to https when making the request

  // As long as we aren't supporting aiming to cookies or internal domains,
  // we should block URLs with usernames/passwords too, even though these
  // seem exceedingly unlikely.
  // 只有 `parsed.username || parsed.password` 满足时，工具调用才执行该分支。
  if (parsed.username || parsed.password) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Initial filter that this isn't a privileged, company-internal URL
  // by checking that the hostname is publicly resolvable
  // hostname解析`parsed.hostname`，供后续判断或组装使用。
  const hostname = parsed.hostname
  // 片段列表格式化`hostname.split`，供工具调用后续处理使用。
  const parts = hostname.split('.')
  // 满足 `parts.length < 2` 时，工具调用执行该分支。
  if (parts.length < 2) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// DomainCheckResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type DomainCheckResult =
  | { status: 'allowed' }
  | { status: 'blocked' }
  | { status: 'check_failed'; error: Error }

// checkDomainBlocklist 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkDomainBlocklist(
  domain: string,
): Promise<DomainCheckResult> {
  // 满足 `DOMAIN_CHECK_CACHE.has(domain)` 时，工具调用执行该分支。
  if (DOMAIN_CHECK_CACHE.has(domain)) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { status: 'allowed' }
  }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`axios.get`，供工具调用后续处理使用。
    const response = await axios.get(
      `https://api.anthropic.com/api/web/domain_info?domain=${encodeURIComponent(domain)}`,
      { timeout: DOMAIN_CHECK_TIMEOUT_MS },
    )
    // 满足 `response.status === 200` 时，工具调用执行该分支。
    if (response.status === 200) {
      // 满足 `response.data.can_fetch === true` 时，工具调用执行该分支。
      if (response.data.can_fetch === true) {
        // DOMAIN_CHECK_CACHE.set 写入新的状态值，使工具调用后续读取保持一致。
        DOMAIN_CHECK_CACHE.set(domain, true)
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { status: 'allowed' }
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { status: 'blocked' }
    }
    // Non-200 status but didn't throw
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      status: 'check_failed',
      error: new Error(`Domain check returned status ${response.status}`),
    }
  } catch (e) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { status: 'check_failed', error: e as Error }
  }
}

/**
 * Check if a redirect is safe to follow
 * Allows redirects that:
 * - Add or remove "www." in the hostname
 * - Keep the origin the same but change path/query params
 * - Or both of the above
 */
// isPermittedRedirect 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermittedRedirect(
  originalUrl: string,
  redirectUrl: string,
): boolean {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // parsedOriginal保存`URL`，供工具调用后续处理使用。
    const parsedOriginal = new URL(originalUrl)
    // parsedRedirect保存`URL`，供工具调用后续处理使用。
    const parsedRedirect = new URL(redirectUrl)

    // `parsedRedirect.protocol` 与 `parsedOriginal.protoc` 不一致时刷新派生状态，避免使用过期结果。
    if (parsedRedirect.protocol !== parsedOriginal.protocol) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // `parsedRedirect.port` 与 `parsedOriginal.port` 不一致时刷新派生状态，避免使用过期结果。
    if (parsedRedirect.port !== parsedOriginal.port) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 只有 `parsedRedirect.username || parsedRedirect.password` 满足时，工具调用才执行该分支。
    if (parsedRedirect.username || parsedRedirect.password) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Now check hostname conditions
    // 1. Adding www. is allowed: example.com -> www.example.com
    // 2. Removing www. is allowed: www.example.com -> example.com
    // 3. Same host (with or without www.) is allowed: paths can change
    // stripWww格式化`hostname.replace`，供工具调用后续处理使用。
    const stripWww = (hostname: string) => hostname.replace(/^www\./, '')
    // originalHostWithoutWww保存`stripWww`，供工具调用后续处理使用。
    const originalHostWithoutWww = stripWww(parsedOriginal.hostname)
    // redirectHostWithoutWww保存`stripWww`，供工具调用后续处理使用。
    const redirectHostWithoutWww = stripWww(parsedRedirect.hostname)
    // 返回 `originalHostWithoutWww === redirectHostWithoutWww`，作为工具调用这次计算的结果。
    return originalHostWithoutWww === redirectHostWithoutWww
  } catch (_error) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Helper function to handle fetching URLs with custom redirect handling
 * Recursively follows redirects if they pass the redirectChecker function
 *
 * Per PSR:
 * "Do not automatically follow redirects because following redirects could
 * allow for an attacker to exploit an open redirect vulnerability in a
 * trusted domain to force a user to make a request to a malicious domain
 * unknowingly"
 */
// RedirectInfo 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type RedirectInfo = {
  type: 'redirect'
  originalUrl: string
  redirectUrl: string
  statusCode: number
}

// getWithPermittedRedirects 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getWithPermittedRedirects(
  url: string,
  signal: AbortSignal,
  // 这个回调绑定到 redirectChecker: (originalUrl: string, redirectUrl: string) => boolean,，负责工具调用在该局部场景下的响应。
  redirectChecker: (originalUrl: string, redirectUrl: string) => boolean,
  depth = 0,
): Promise<AxiosResponse<ArrayBuffer> | RedirectInfo> {
  // 满足 `depth > MAX_REDIRECTS` 时，工具调用执行该分支。
  if (depth > MAX_REDIRECTS) {
    // 抛出 new Error(`Too many redirects (exceeded ${MAX_REDIRECTS})`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`Too many redirects (exceeded ${MAX_REDIRECTS})`)
  }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `axios.get(url, {`，调用方直接接收异步结果。
    return await axios.get(url, {
      signal,
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 0,
      responseType: 'arraybuffer',
      maxContentLength: MAX_HTTP_CONTENT_LENGTH,
      headers: {
        Accept: 'text/markdown, text/html, */*',
        'User-Agent': getWebFetchUserAgent(),
      },
    })
  } catch (error) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      axios.isAxiosError(error) &&
      error.response &&
      [301, 302, 307, 308].includes(error.response.status)
    ) {
      // redirectLocation保存`error.response.headers.location`，供工具实现 utils后续判断或输出使用。
      const redirectLocation = error.response.headers.location
      // redirectLocation缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!redirectLocation) {
        // 抛出 new Error('Redirect missing Location header')，阻止工具调用在无效状态下继续运行。
        throw new Error('Redirect missing Location header')
      }

      // Resolve relative URLs against the original URL
      // redirectUrl保存`URL`，供工具调用后续处理使用。
      const redirectUrl = new URL(redirectLocation, url).toString()

      // 满足 `redirectChecker(url, redirectUrl)` 时，工具调用执行该分支。
      if (redirectChecker(url, redirectUrl)) {
        // Recursively follow the permitted redirect
        // 返回 `getWithPermittedRedirects(`，作为工具调用这次计算的结果。
        return getWithPermittedRedirects(
          redirectUrl,
          signal,
          redirectChecker,
          depth + 1,
        )
      } else {
        // Return redirect information to the caller
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          type: 'redirect',
          originalUrl: url,
          redirectUrl,
          statusCode: error.response.status,
        }
      }
    }

    // Detect egress proxy blocks: the proxy returns 403 with
    // X-Proxy-Error: blocked-by-allowlist when egress is restricted
    // 工具调用在这里按实际状态进入对应分支。
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 403 &&
      error.response.headers['x-proxy-error'] === 'blocked-by-allowlist'
    ) {
      // hostname保存`URL`，供工具调用后续处理使用。
      const hostname = new URL(url).hostname
      // 抛出 new EgressBlockedError(hostname)，阻止工具调用在无效状态下继续运行。
      throw new EgressBlockedError(hostname)
    }

    // 抛出 error，阻止工具调用在无效状态下继续运行。
    throw error
  }
}

// isRedirectInfo 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRedirectInfo(
  response: AxiosResponse<ArrayBuffer> | RedirectInfo,
): response is RedirectInfo {
  // 返回 `'type' in response && response.type === 'redirect'`，作为工具调用这次计算的结果。
  return 'type' in response && response.type === 'redirect'
}

// FetchedContent 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FetchedContent = {
  content: string
  bytes: number
  code: number
  codeText: string
  contentType: string
  persistedPath?: string
  persistedSize?: number
}

// getURLMarkdownContent 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getURLMarkdownContent(
  url: string,
  abortController: AbortController,
): Promise<FetchedContent | RedirectInfo> {
  // 满足 `!validateURL(url)` 时，工具调用执行该分支。
  if (!validateURL(url)) {
    // 抛出 new Error('Invalid URL')，阻止工具调用在无效状态下继续运行。
    throw new Error('Invalid URL')
  }

  // Check cache (LRUCache handles TTL automatically)
  // cachedEntry 缓存读取`URL_CACHE.get`，供工具调用后续处理使用。
  const cachedEntry = URL_CACHE.get(url)
  // 满足 `cachedEntry` 时，工具调用执行该分支。
  if (cachedEntry) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      bytes: cachedEntry.bytes,
      code: cachedEntry.code,
      codeText: cachedEntry.codeText,
      content: cachedEntry.content,
      contentType: cachedEntry.contentType,
      persistedPath: cachedEntry.persistedPath,
      persistedSize: cachedEntry.persistedSize,
    }
  }

  // parsedUrl 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsedUrl: URL
  // upgradedUrl保存`url`，供后续判断或组装使用。
  let upgradedUrl = url

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // parsedUrl更新为 `new URL(url)`，确保工具调用后续读取最新状态。
    parsedUrl = new URL(url)

    // Upgrade http to https if needed
    // 当 `parsedUrl.protocol` 匹配 `'http:'` 时，工具调用执行对应分支。
    if (parsedUrl.protocol === 'http:') {
      // protocol更新为 `'https:'`，确保工具调用后续读取最新状态。
      parsedUrl.protocol = 'https:'
      // upgradedUrl更新为 `parsedUrl.toString()`，确保工具调用后续读取最新状态。
      upgradedUrl = parsedUrl.toString()
    }

    // hostname解析`parsedUrl.hostname` 整理出中间结果，供工具实现 utils后续步骤使用。
    const hostname = parsedUrl.hostname

    // Check if the user has opted to skip the blocklist check
    // This is for enterprise customers with restrictive security policies
    // that prevent outbound connections to claude.ai
    // settings 集合读取`getSettings_DEPRECATED`，供工具调用后续处理使用。
    const settings = getSettings_DEPRECATED()
    // settings.skipWebFetchPreflight缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!settings.skipWebFetchPreflight) {
      // checkResult读取`checkDomainBlocklist`，供工具调用后续处理使用。
      const checkResult = await checkDomainBlocklist(hostname)
      // 按照 checkResult.status 的取值选择工具调用的具体处理分支。
      switch (checkResult.status) {
        case 'allowed':
          // Continue with the fetch
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        case 'blocked':
          // 抛出 new DomainBlockedError(hostname)，阻止工具调用在无效状态下继续运行。
          throw new DomainBlockedError(hostname)
        case 'check_failed':
          // 抛出 new DomainCheckFailedError(hostname)，阻止工具调用在无效状态下继续运行。
          throw new DomainCheckFailedError(hostname)
      }
    }

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_web_fetch_host', {
        hostname:
          hostname as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }
  } catch (e) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      e instanceof DomainBlockedError ||
      e instanceof DomainCheckFailedError
    ) {
      // Expected user-facing failures - re-throw without logging as internal error
      // 抛出 e，阻止工具调用在无效状态下继续运行。
      throw e
    }
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }

  // 接口响应读取`getWithPermittedRedirects`，供工具调用后续处理使用。
  const response = await getWithPermittedRedirects(
    upgradedUrl,
    abortController.signal,
    isPermittedRedirect,
  )

  // Check if we got a redirect response
  // 满足 `isRedirectInfo(response)` 时，工具调用执行该分支。
  if (isRedirectInfo(response)) {
    // 返回 `response`，作为工具调用这次计算的结果。
    return response
  }

  // rawBuffer保存`Buffer.from`，供工具调用后续处理使用。
  const rawBuffer = Buffer.from(response.data)
  // Release the axios-held ArrayBuffer copy; rawBuffer owns the bytes now.
  // This lets GC reclaim up to MAX_HTTP_CONTENT_LENGTH (10MB) before Turndown
  // builds its DOM tree (which can be 3-5x the HTML size).
  // 工具实现 utils在这里处理 `;(response as { data: unknown }).data = null`，完成这一小步状态转换。
  ;(response as { data: unknown }).data = null
  // contentType保存`response.headers['content-type'] ?? ''`，供工具实现 utils后续判断或输出使用。
  const contentType = response.headers['content-type'] ?? ''

  // Binary content: save raw bytes to disk with a proper extension so Claude
  // can inspect the file later. We still fall through to the utf-8 decode +
  // Haiku path below — for PDFs in particular the decoded string has enough
  // ASCII structure (/Title, text streams) that Haiku can summarize it, and
  // the saved file is a supplement rather than a replacement.
  // persistedPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let persistedPath: string | undefined
  // persistedSize 先占位，稍后的条件分支会根据实际输入补齐它。
  let persistedSize: number | undefined
  // 满足 `isBinaryContentType(contentType)` 时，工具调用执行该分支。
  if (isBinaryContentType(contentType)) {
    // persistId记录时间`Date.now`，供工具调用后续处理使用。
    const persistId = `webfetch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    // 结果保存`persistBinaryContent`，供工具调用后续处理使用。
    const result = await persistBinaryContent(rawBuffer, contentType, persistId)
    // 满足 `!('error' in result)` 时，工具调用执行该分支。
    if (!('error' in result)) {
      // persistedPath 路径数据更新为 `result.filepath`，确保工具调用后续读取最新状态。
      persistedPath = result.filepath
      // persistedSize更新为 `result.size`，确保工具调用后续读取最新状态。
      persistedSize = result.size
    }
  }

  // bytes 集合记录 `rawBuffer.length` 是否成立，下一步按该结果分支。
  const bytes = rawBuffer.length
  // htmlContent格式化`rawBuffer.toString`，供工具调用后续处理使用。
  const htmlContent = rawBuffer.toString('utf-8')

  // markdownContent 先占位，稍后的条件分支会根据实际输入补齐它。
  let markdownContent: string
  // contentBytes 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let contentBytes: number
  // 满足 `contentType.includes('text/html')` 时，工具调用执行该分支。
  if (contentType.includes('text/html')) {
    // markdownContent更新为 `(await getTurndownService()).turndown(htmlContent)`，确保工具调用后续读取最新状态。
    markdownContent = (await getTurndownService()).turndown(htmlContent)
    // contentBytes 集合更新为 `Buffer.byteLength(markdownContent)`，确保工具调用后续读取最新状态。
    contentBytes = Buffer.byteLength(markdownContent)
  } else {
    // It's not HTML - just use it raw. The decoded string's UTF-8 byte
    // length equals rawBuffer.length (modulo U+FFFD replacement on invalid
    // bytes — negligible for cache eviction accounting), so skip the O(n)
    // Buffer.byteLength scan.
    // markdownContent更新为 `htmlContent`，确保工具调用后续读取最新状态。
    markdownContent = htmlContent
    // contentBytes 集合更新为 `bytes`，确保工具调用后续读取最新状态。
    contentBytes = bytes
  }

  // Store the fetched content in cache. Note that it's stored under
  // the original URL, not the upgraded or redirected URL.
  // entry 集中保存工具实现 utils要一起传递的字段。
  const entry: CacheEntry = {
    bytes,
    code: response.status,
    codeText: response.statusText,
    content: markdownContent,
    contentType,
    persistedPath,
    persistedSize,
  }
  // lru-cache requires positive integers; clamp to 1 for empty responses.
  // URL_CACHE.set 写入新的状态值，使工具调用后续读取保持一致。
  URL_CACHE.set(url, entry, { size: Math.max(1, contentBytes) })
  // 返回 `entry`，作为工具调用这次计算的结果。
  return entry
}

// applyPromptToMarkdown 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function applyPromptToMarkdown(
  prompt: string,
  markdownContent: string,
  signal: AbortSignal,
  isNonInteractiveSession: boolean,
  isPreapprovedDomain: boolean,
): Promise<string> {
  // Truncate content to avoid "Prompt is too long" errors from the secondary model
  // truncatedContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const truncatedContent =
    markdownContent.length > MAX_MARKDOWN_LENGTH
      ? markdownContent.slice(0, MAX_MARKDOWN_LENGTH) +
        '\n\n[Content truncated due to length...]'
      : markdownContent

  // modelPrompt构建`makeSecondaryModelPrompt`，供工具调用后续处理使用。
  const modelPrompt = makeSecondaryModelPrompt(
    truncatedContent,
    prompt,
    isPreapprovedDomain,
  )
  // assistantMessage 消息数据保存`queryHaiku`，供工具调用后续处理使用。
  const assistantMessage = await queryHaiku({
    systemPrompt: asSystemPrompt([]),
    userPrompt: modelPrompt,
    signal,
    options: {
      querySource: 'web_fetch_apply',
      agents: [],
      isNonInteractiveSession,
      hasAppendSystemPrompt: false,
      mcpTools: [],
    },
  })

  // We need to bubble this up, so that the tool call throws, causing us to return
  // an is_error tool_use block to the server, and render a red dot in the UI.
  // 满足 `signal.aborted` 时，工具调用执行该分支。
  if (signal.aborted) {
    // 抛出 new AbortError()，阻止工具调用在无效状态下继续运行。
    throw new AbortError()
  }

  // 从 `assistantMessage.message` 解构 content，减少工具实现 utils对同一对象的重复访问。
  const { content } = assistantMessage.message
  // 满足 `content.length > 0` 时，工具调用执行该分支。
  if (content.length > 0) {
    // contentBlock读取 `content[0]` 对应条目，后续围绕该成员继续处理。
    const contentBlock = content[0]
    // 满足 `'text' in contentBlock!` 时，工具调用执行该分支。
    if ('text' in contentBlock!) {
      // 返回 `contentBlock.text`，作为工具调用这次计算的结果。
      return contentBlock.text
    }
  }
  // 返回 `'No response from model'`，作为工具调用这次计算的结果。
  return 'No response from model'
}
