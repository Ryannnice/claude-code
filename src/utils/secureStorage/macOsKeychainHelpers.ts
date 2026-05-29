/**
 * Lightweight helpers shared between keychainPrefetch.ts and
 * macOsKeychainStorage.ts.
 *
 * This module MUST NOT import execa, execFileNoThrow, or
 * execFileNoThrowPortable. keychainPrefetch.ts fires at the very top of
 * main.tsx (before the ~65ms of module evaluation it parallelizes), and Bun's
 * __esm wrapper evaluates the ENTIRE module when any symbol is accessed —
 * so a heavy transitive import here defeats the prefetch. The execa →
 * human-signals → cross-spawn chain alone is ~58ms of synchronous init.
 *
 * The imports below (envUtils, oauth constants, crypto, os) are already
 * evaluated by startupProfiler.ts at main.tsx:5, so they add no module-init
 * cost when keychainPrefetch.ts pulls this file in.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 引入 userInfo，将 os 中已经封装好的能力接到本文件流程里。
import { userInfo } from 'os'
// 引入 getOauthConfig，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from 'src/constants/oauth.js'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 类型依赖 { SecureStorageData } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SecureStorageData } from './types.js'

// Suffix distinguishing the OAuth credentials keychain entry from the legacy
// API key entry (which uses no suffix). Both share the service name base.
// DO NOT change this value — it's part of the keychain lookup key and would
// orphan existing stored credentials.
// CREDENTIALS_SERVICE_SUFFIX 命名 `'-credentials'`，让后续代码直接表达这个值的用途。
export const CREDENTIALS_SERVICE_SUFFIX = '-credentials'

// getMacOsKeychainStorageServiceName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMacOsKeychainStorageServiceName(
  serviceSuffix: string = '',
): string {
  // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const configDir = getClaudeConfigHomeDir()
  // isDefaultDir 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const isDefaultDir = !process.env.CLAUDE_CONFIG_DIR

  // Use a hash of the config dir path to create a unique but stable suffix
  // Only add suffix for non-default directories to maintain backwards compatibility
  // dirHash保存`isDefaultDir`，供共享工具 mac Os Keychain Helpers后续判断或输出使用。
  const dirHash = isDefaultDir
    ? ''
    : `-${createHash('sha256').update(configDir).digest('hex').substring(0, 8)}`
  // 返回 ``Claude Code${getOauthConfig().OAUTH_FILE_SUFFIX}${serviceSuffix}${dirH...`，作为共享工具这次计算的结果。
  return `Claude Code${getOauthConfig().OAUTH_FILE_SUFFIX}${serviceSuffix}${dirHash}`
}

// getUsername 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUsername(): string {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `process.env.USER || userInfo().username`，作为共享工具这次计算的结果。
    return process.env.USER || userInfo().username
  } catch {
    // 返回 `'claude-code-user'`，作为共享工具这次计算的结果。
    return 'claude-code-user'
  }
}

// --

// Cache for keychain reads to avoid repeated expensive security CLI calls.
// TTL bounds staleness for cross-process scenarios (another CC instance
// refreshing/invalidating tokens) without forcing a blocking spawnSync on
// every read. In-process writes invalidate via clearKeychainCache() directly.
//
// The sync read() path takes ~500ms per `security` spawn. With 50+ claude.ai
// MCP connectors authenticating at startup, a short TTL expires mid-storm and
// triggers repeat sync reads — observed as a 5.5s event-loop stall
// (go/ccshare/adamj-20260326-212235). 30s of cross-process staleness is fine:
// OAuth tokens expire in hours, and the only cross-process writer is another
// CC instance's /login or refresh.
//
// Lives here (not in macOsKeychainStorage.ts) so keychainPrefetch.ts can
// prime it without pulling in execa. Wrapped in an object because ES module
// `let` bindings aren't writable across module boundaries — both this file
// and macOsKeychainStorage.ts need to mutate all three fields.
// KEYCHAIN_CACHE_TTL_MS 缓存保存`30_000`，供后续判断或组装使用。
export const KEYCHAIN_CACHE_TTL_MS = 30_000

// keychainCacheState 状态 先占位，稍后的条件分支会根据实际输入补齐它。
export const keychainCacheState: {
  cache: { data: SecureStorageData | null; cachedAt: number } // cachedAt 0 = invalid
  // Incremented on every cache invalidation. readAsync() captures this before
  // spawning and skips its cache write if a newer generation exists, preventing
  // a stale subprocess result from overwriting fresh data written by update().
  generation: number
  // Deduplicates concurrent readAsync() calls so TTL expiry under load spawns
  // one subprocess, not N. Cleared on invalidation so fresh reads don't join
  // a stale in-flight promise.
  readInFlight: Promise<SecureStorageData | null> | null
} = {
  cache: { data: null, cachedAt: 0 },
  generation: 0,
  readInFlight: null,
}

// clearKeychainCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearKeychainCache(): void {
  // cache 缓存更新为 `{ data: null, cachedAt: 0 }`，确保共享工具后续读取最新状态。
  keychainCacheState.cache = { data: null, cachedAt: 0 }
  // 共享工具 mac Os Keychain Helpers在这里处理 `keychainCacheState.generation++`，完成这一小步状态转换。
  keychainCacheState.generation++
  // readInFlight更新为 `null`，确保共享工具后续读取最新状态。
  keychainCacheState.readInFlight = null
}

/**
 * Prime the keychain cache from a prefetch result (keychainPrefetch.ts).
 * Only writes if the cache hasn't been touched yet — if sync read() or
 * update() already ran, their result is authoritative and we discard this.
 */
// primeKeychainCacheFromPrefetch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function primeKeychainCacheFromPrefetch(stdout: string | null): void {
  // `keychainCacheState.cache.cachedAt` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (keychainCacheState.cache.cachedAt !== 0) return
  // data保存`null`，作为后续空值处理的输入。
  let data: SecureStorageData | null = null
  // 满足 `stdout` 时，共享工具执行该分支。
  if (stdout) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line custom-rules/no-direct-json-operations -- jsonParse() pulls slowOperations (lodash-es/cloneDeep) into the early-startup import chain; see file header
      // data更新为 `JSON.parse(stdout)`，确保共享工具后续读取最新状态。
      data = JSON.parse(stdout)
    } catch {
      // malformed prefetch result — let sync read() re-fetch
      // 共享工具 mac Os Keychain Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }
  // cache 缓存更新为 `{ data, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
  keychainCacheState.cache = { data, cachedAt: Date.now() }
}
