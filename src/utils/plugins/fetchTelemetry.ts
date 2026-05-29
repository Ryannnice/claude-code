/**
 * Telemetry for plugin/marketplace fetches that hit the network.
 *
 * Added for inc-5046 (GitHub complained about claude-plugins-official load).
 * Before this, fetch operations only had logForDebugging — no way to measure
 * actual network volume. This surfaces what's hitting GitHub vs GCS vs
 * user-hosted so we can see the GCS migration take effect and catch future
 * hot-path regressions before GitHub emails us again.
 *
 * Volume: these fire at startup (install-counts 24h-TTL)
 * and on explicit user action (install/update). NOT per-interaction. Similar
 * envelope to tengu_binary_download_*.
 */

// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS as SafeString,
} from '../../services/analytics/index.js'
// 引入 OFFICIAL_MARKETPLACE_NAME，将 ./officialMarketplace.js 中已经封装好的能力接到本文件流程里。
import { OFFICIAL_MARKETPLACE_NAME } from './officialMarketplace.js'

// PluginFetchSource 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginFetchSource =
  | 'install_counts'
  | 'marketplace_clone'
  | 'marketplace_pull'
  | 'marketplace_url'
  | 'plugin_clone'
  | 'mcpb'

// PluginFetchOutcome 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginFetchOutcome = 'success' | 'failure' | 'cache_hit'

// Allowlist of public hosts we report by name. Anything else (enterprise
// git, self-hosted, internal) is bucketed as 'other' — we don't want
// internal hostnames (git.mycorp.internal) landing in telemetry. Bounded
// cardinality also keeps the dashboard host-breakdown tractable.
// KNOWN_PUBLIC_HOSTS 集合保存`Set`，供插件管理后续处理使用。
const KNOWN_PUBLIC_HOSTS = new Set([
  'github.com',
  'raw.githubusercontent.com',
  'objects.githubusercontent.com',
  'gist.githubusercontent.com',
  'gitlab.com',
  'bitbucket.org',
  'codeberg.org',
  'dev.azure.com',
  'ssh.dev.azure.com',
  'storage.googleapis.com', // GCS — where Dickson's migration points
])

/**
 * Extract hostname from a URL or git spec and bucket to the allowlist.
 * Handles `https://host/...`, `git@host:path`, `ssh://host/...`.
 * Returns a known public host, 'other' (parseable but not allowlisted —
 * don't leak private hostnames), or 'unknown' (unparseable / local path).
 */
// extractHost 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractHost(urlOrSpec: string): string {
  // host 先占位，稍后的条件分支会根据实际输入补齐它。
  let host: string
  // scpMatch保存`exec`，供插件管理后续处理使用。
  const scpMatch = /^[^@/]+@([^:/]+):/.exec(urlOrSpec)
  // 满足 `scpMatch` 时，插件管理执行该分支。
  if (scpMatch) {
    // host更新为 `scpMatch[1]!`，确保插件工具后续读取最新状态。
    host = scpMatch[1]!
  } else {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // host更新为 `new URL(urlOrSpec).hostname`，确保插件工具后续读取最新状态。
      host = new URL(urlOrSpec).hostname
    } catch {
      // 返回 `'unknown'`，作为插件管理这次计算的结果。
      return 'unknown'
    }
  }
  // normalized保存`host.toLowerCase`，供插件管理后续处理使用。
  const normalized = host.toLowerCase()
  // 返回 `KNOWN_PUBLIC_HOSTS.has(normalized) ? normalized : 'other'`，作为插件管理这次计算的结果。
  return KNOWN_PUBLIC_HOSTS.has(normalized) ? normalized : 'other'
}

/**
 * True if the URL/spec points at anthropics/claude-plugins-official — the
 * repo GitHub complained about. Lets the dashboard separate "our problem"
 * traffic from user-configured marketplaces.
 */
// isOfficialRepo 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOfficialRepo(urlOrSpec: string): boolean {
  // 返回 `urlOrSpec.includes(`anthropics/${OFFICIAL_MARKETPLACE_NAME}`)`，作为插件管理这次计算的结果。
  return urlOrSpec.includes(`anthropics/${OFFICIAL_MARKETPLACE_NAME}`)
}

// logPluginFetch 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logPluginFetch(
  source: PluginFetchSource,
  urlOrSpec: string | undefined,
  outcome: PluginFetchOutcome,
  durationMs: number,
  errorKind?: string,
): void {
  // String values are bounded enums / hostname-only — no code, no paths,
  // no raw error messages. Same privacy envelope as tengu_web_fetch_host.
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_remote_fetch', {
    source: source as SafeString,
    host: (urlOrSpec ? extractHost(urlOrSpec) : 'unknown') as SafeString,
    is_official: urlOrSpec ? isOfficialRepo(urlOrSpec) : false,
    outcome: outcome as SafeString,
    duration_ms: Math.round(durationMs),
    ...(errorKind && { error_kind: errorKind as SafeString }),
  })
}

/**
 * Classify an error into a stable bucket for the error_kind field. Keeps
 * cardinality bounded — raw error messages would explode dashboard grouping.
 *
 * Handles both axios Error objects (Node.js error codes like ENOTFOUND) and
 * git stderr strings (human phrases like "Could not resolve host"). DNS
 * checked BEFORE timeout because gitClone's error enhancement at
 * marketplaceManager.ts:~950 rewrites DNS failures to include the word
 * "timeout" — ordering the other way would misclassify git DNS as timeout.
 */
// classifyFetchError 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyFetchError(error: unknown): string {
  // 消息保存`String`，供插件管理后续处理使用。
  const msg = String((error as { message?: unknown })?.message ?? error)
  // 插件管理在这里按实际状态进入对应分支。
  if (
    /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|Could not resolve host|Connection refused/i.test(
      msg,
    )
  ) {
    // 返回 `'dns_or_refused'`，作为插件管理这次计算的结果。
    return 'dns_or_refused'
  }
  // 满足 `/ETIMEDOUT|timed out|timeout/i.test(msg)` 时，插件管理执行该分支。
  if (/ETIMEDOUT|timed out|timeout/i.test(msg)) return 'timeout'
  // 插件管理在这里按实际状态进入对应分支。
  if (
    /ECONNRESET|socket hang up|Connection reset by peer|remote end hung up/i.test(
      msg,
    )
  ) {
    // 返回 `'conn_reset'`，作为插件管理这次计算的结果。
    return 'conn_reset'
  }
  // 满足 `/403|401|authentication|permission denied/i.test(msg)` 时，插件管理执行该分支。
  if (/403|401|authentication|permission denied/i.test(msg)) return 'auth'
  // 满足 `/404|not found|repository not found/i.test(msg)` 时，插件管理执行该分支。
  if (/404|not found|repository not found/i.test(msg)) return 'not_found'
  // 满足 `/certificate|SSL|TLS|unable to get local issuer/i.test(msg)` 时，插件管理执行该分支。
  if (/certificate|SSL|TLS|unable to get local issuer/i.test(msg)) return 'tls'
  // Schema validation throws "Invalid response format" (install_counts) —
  // distinguish from true unknowns so the dashboard can
  // see "server sent garbage" separately.
  // 满足 `/Invalid response format|Invalid marketplace schema/i.test(msg)` 时，插件管理执行该分支。
  if (/Invalid response format|Invalid marketplace schema/i.test(msg)) {
    // 返回 `'invalid_schema'`，作为插件管理这次计算的结果。
    return 'invalid_schema'
  }
  // 返回 `'other'`，作为插件管理这次计算的结果。
  return 'other'
}
