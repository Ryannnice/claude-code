/**
 * Minimal module for firing macOS keychain reads in parallel with main.tsx
 * module evaluation, same pattern as startMdmRawRead() in settings/mdm/rawRead.ts.
 *
 * isRemoteManagedSettingsEligible() reads two separate keychain entries
 * SEQUENTIALLY via sync execSync during applySafeConfigEnvironmentVariables():
 *   1. "Claude Code-credentials" (OAuth tokens)  — ~32ms
 *   2. "Claude Code" (legacy API key)            — ~33ms
 * Sequential cost: ~65ms on every macOS startup.
 *
 * Firing both here lets the subprocesses run in parallel with the ~65ms of
 * main.tsx imports. ensureKeychainPrefetchCompleted() is awaited alongside
 * ensureMdmSettingsLoaded() in main.tsx preAction — nearly free since the
 * subprocesses finish during import evaluation. Sync read() and
 * getApiKeyFromConfigOrMacOSKeychain() then hit their caches.
 *
 * Imports stay minimal: child_process + macOsKeychainHelpers.ts (NOT
 * macOsKeychainStorage.ts — that pulls in execa → human-signals →
 * cross-spawn, ~58ms of synchronous module init). The helpers file's own
 * import chain (envUtils, oauth constants, crypto) is already evaluated by
 * startupProfiler.ts at main.tsx:5, so no new module-init cost lands here.
 */

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFile } from 'child_process'
// 引入 isBareMode，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isBareMode } from '../envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CREDENTIALS_SERVICE_SUFFIX,
  getMacOsKeychainStorageServiceName,
  getUsername,
  primeKeychainCacheFromPrefetch,
} from './macOsKeychainHelpers.js'

// KEYCHAIN_PREFETCH_TIMEOUT_MS 集合保存`10_000`，供共享工具 keychain Prefetch后续判断或输出使用。
const KEYCHAIN_PREFETCH_TIMEOUT_MS = 10_000

// Shared with auth.ts getApiKeyFromConfigOrMacOSKeychain() so it can skip its
// sync spawn when the prefetch already landed. Distinguishing "not started" (null)
// from "completed with no key" ({ stdout: null }) lets the sync reader only
// trust a completed prefetch.
// legacyApiKeyPrefetch保存`null`，作为后续空值处理的输入。
let legacyApiKeyPrefetch: { stdout: string | null } | null = null

// prefetchPromise 异步任务初始化为空值，后续分支会在有数据时补齐。
let prefetchPromise: Promise<void> | null = null

// SpawnResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SpawnResult = { stdout: string | null; timedOut: boolean }

// spawnSecurity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function spawnSecurity(serviceName: string): Promise<SpawnResult> {
  // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
  return new Promise(resolve => {
    // 调用 execFile，触发共享工具此处需要的副作用。
    execFile(
      'security',
      ['find-generic-password', '-a', getUsername(), '-w', '-s', serviceName],
      { encoding: 'utf-8', timeout: KEYCHAIN_PREFETCH_TIMEOUT_MS },
      // 这个回调绑定到 (err, stdout) => {，负责共享工具在该局部场景下的响应。
      (err, stdout) => {
        // Exit 44 (entry not found) is a valid "no key" result and safe to
        // prime as null. But timeout (err.killed) means the keychain MAY have
        // a key we couldn't fetch — don't prime, let sync spawn retry.
        // biome-ignore lint/nursery/noFloatingPromises: resolve() is not a floating promise
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve({
          stdout: err ? null : stdout?.trim() || null,
          timedOut: Boolean(err && 'killed' in err && err.killed),
        })
      },
    )
  })
}

/**
 * Fire both keychain reads in parallel. Called at main.tsx top-level
 * immediately after startMdmRawRead(). Non-darwin is a no-op.
 */
// startKeychainPrefetch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startKeychainPrefetch(): void {
  // `process.platform` 与 `'darwin' || prefetchPromise || ...` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin' || prefetchPromise || isBareMode()) return

  // Fire both subprocesses immediately (non-blocking). They run in parallel
  // with each other AND with main.tsx imports. The await in Promise.all
  // happens later via ensureKeychainPrefetchCompleted().
  // oauthSpawn保存`spawnSecurity`，供共享工具后续处理使用。
  const oauthSpawn = spawnSecurity(
    getMacOsKeychainStorageServiceName(CREDENTIALS_SERVICE_SUFFIX),
  )
  // legacySpawn保存`spawnSecurity`，供共享工具后续处理使用。
  const legacySpawn = spawnSecurity(getMacOsKeychainStorageServiceName())

  // prefetchPromise 异步任务更新为 `Promise.all([oauthSpawn, legacySpawn]).then(`，确保共享工具后续读取最新状态。
  prefetchPromise = Promise.all([oauthSpawn, legacySpawn]).then(
    // 这个回调绑定到 ([oauth, legacy]) => {，负责共享工具在该局部场景下的响应。
    ([oauth, legacy]) => {
      // Timed-out prefetch: don't prime. Sync read/spawn will retry with its
      // own (longer) timeout. Priming null here would shadow a key that the
      // sync path might successfully fetch.
      // 满足 `!oauth.timedOut) primeKeychainCacheFromPrefetch(oauth.stdout` 时，共享工具执行该分支。
      if (!oauth.timedOut) primeKeychainCacheFromPrefetch(oauth.stdout)
      // legacy.timedOut缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!legacy.timedOut) legacyApiKeyPrefetch = { stdout: legacy.stdout }
    },
  )
}

/**
 * Await prefetch completion. Called in main.tsx preAction alongside
 * ensureMdmSettingsLoaded() — nearly free since subprocesses finish during
 * the ~65ms of main.tsx imports. Resolves immediately on non-darwin.
 */
// ensureKeychainPrefetchCompleted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureKeychainPrefetchCompleted(): Promise<void> {
  // 满足 `prefetchPromise` 时，共享工具执行该分支。
  if (prefetchPromise) await prefetchPromise
}

/**
 * Consumed by getApiKeyFromConfigOrMacOSKeychain() in auth.ts before it
 * falls through to sync execSync. Returns null if prefetch hasn't completed.
 */
// getLegacyApiKeyPrefetchResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLegacyApiKeyPrefetchResult(): {
  stdout: string | null
} | null {
  // 返回 `legacyApiKeyPrefetch`，作为共享工具这次计算的结果。
  return legacyApiKeyPrefetch
}

/**
 * Clear prefetch result. Called alongside getApiKeyFromConfigOrMacOSKeychain
 * cache invalidation so a stale prefetch doesn't shadow a fresh write.
 */
// clearLegacyApiKeyPrefetch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearLegacyApiKeyPrefetch(): void {
  // legacyApiKeyPrefetch更新为 `null`，确保共享工具后续读取最新状态。
  legacyApiKeyPrefetch = null
}
