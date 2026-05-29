// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 hostname，将 os 中已经封装好的能力接到本文件流程里。
import { hostname } from 'os'
// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  checkGate_CACHED_OR_BLOCKING,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from '../services/analytics/growthbook.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../utils/privacyLevel.js'
// 复用 getSecureStorage 工具函数，把通用处理留在 ../utils/secureStorage/index.js 中维护。
import { getSecureStorage } from '../utils/secureStorage/index.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'

/**
 * Trusted device token source for bridge (remote-control) sessions.
 *
 * Bridge sessions have SecurityTier=ELEVATED on the server (CCR v2).
 * The server gates ConnectBridgeWorker on its own flag
 * (sessions_elevated_auth_enforcement in Anthropic Main); this CLI-side
 * flag controls whether the CLI sends X-Trusted-Device-Token at all.
 * Two flags so rollout can be staged: flip CLI-side first (headers
 * start flowing, server still no-ops), then flip server-side.
 *
 * Enrollment (POST /auth/trusted_devices) is gated server-side by
 * account_session.created_at < 10min, so it must happen during /login.
 * Token is persistent (90d rolling expiry) and stored in keychain.
 *
 * See anthropics/anthropic#274559 (spec), #310375 (B1b tenant RPCs),
 * #295987 (B2 Python routes), #307150 (C1' CCR v2 gate).
 */

// TRUSTED_DEVICE_GATE保存`'tengu_sessions_elevated_auth_enforcement'`，作为后续固定文本处理的输入。
const TRUSTED_DEVICE_GATE = 'tengu_sessions_elevated_auth_enforcement'

// isGateEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isGateEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(TRUSTED_DEVICE_GATE, false)`，作为远程桥接会话这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(TRUSTED_DEVICE_GATE, false)
}

// Memoized — secureStorage.read() spawns a macOS `security` subprocess (~40ms).
// bridgeApi.ts calls this from getHeaders() on every poll/heartbeat/ack.
// Cache cleared after enrollment (below) and on logout (clearAuthRelatedCaches).
//
// Only the storage read is memoized — the GrowthBook gate is checked live so
// that a gate flip after GrowthBook refresh takes effect without a restart.
// readStoredToken保存`memoize`，供远程桥接会话后续处理使用。
const readStoredToken = memoize((): string | undefined => {
  // Env var takes precedence for testing/canary.
  // envToken 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envToken = process.env.CLAUDE_TRUSTED_DEVICE_TOKEN
  // 满足 `envToken` 时，远程桥接会话执行该分支。
  if (envToken) {
    // 返回 `envToken`，作为远程桥接会话这次计算的结果。
    return envToken
  }
  // 返回 `getSecureStorage().read()?.trustedDeviceToken`，作为远程桥接会话这次计算的结果。
  return getSecureStorage().read()?.trustedDeviceToken
})

// getTrustedDeviceToken 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTrustedDeviceToken(): string | undefined {
  // 满足 `!isGateEnabled()` 时，远程桥接会话执行该分支。
  if (!isGateEnabled()) {
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  }
  // 返回 `readStoredToken()`，作为远程桥接会话这次计算的结果。
  return readStoredToken()
}

// clearTrustedDeviceTokenCache 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearTrustedDeviceTokenCache(): void {
  // 调用 readStoredToken.cache?.clear?.()，完成这一处局部操作。
  readStoredToken.cache?.clear?.()
}

/**
 * Clear the stored trusted device token from secure storage and the memo cache.
 * Called before enrollTrustedDevice() during /login so a stale token from the
 * previous account isn't sent as X-Trusted-Device-Token while enrollment is
 * in-flight (enrollTrustedDevice is async — bridge API calls between login and
 * enrollment completion would otherwise still read the old cached token).
 */
// clearTrustedDeviceToken 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearTrustedDeviceToken(): void {
  // 满足 `!isGateEnabled()` 时，远程桥接会话执行该分支。
  if (!isGateEnabled()) {
    // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // secureStorage读取`getSecureStorage`，供远程桥接会话后续处理使用。
  const secureStorage = getSecureStorage()
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // data读取`secureStorage.read`，供远程桥接会话后续处理使用。
    const data = secureStorage.read()
    // 满足 `data?.trustedDeviceToken` 时，远程桥接会话执行该分支。
    if (data?.trustedDeviceToken) {
      // 远程桥接 trusted Device在这里处理 `delete data.trustedDeviceToken`，完成这一小步状态转换。
      delete data.trustedDeviceToken
      // 调用 secureStorage.update，触发远程桥接会话此处需要的副作用。
      secureStorage.update(data)
    }
  } catch {
    // Best-effort — don't block login if storage is inaccessible
  }
  // 调用 readStoredToken.cache?.clear?.()，完成这一处局部操作。
  readStoredToken.cache?.clear?.()
}

/**
 * Enroll this device via POST /auth/trusted_devices and persist the token
 * to keychain. Best-effort — logs and returns on failure so callers
 * (post-login hooks) don't block the login flow.
 *
 * The server gates enrollment on account_session.created_at < 10min, so
 * this must be called immediately after a fresh /login. Calling it later
 * (e.g. lazy enrollment on /bridge 403) will fail with 403 stale_session.
 */
// enrollTrustedDevice 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enrollTrustedDevice(): Promise<void> {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // checkGate_CACHED_OR_BLOCKING awaits any in-flight GrowthBook re-init
    // (triggered by refreshGrowthBookAfterAuthChange in login.tsx) before
    // reading the gate, so we get the post-refresh value.
    // 满足 `!(await checkGate_CACHED_OR_BLOCKING(TRUSTED_DEVICE_GATE))` 时，远程桥接会话执行该分支。
    if (!(await checkGate_CACHED_OR_BLOCKING(TRUSTED_DEVICE_GATE))) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[trusted-device] Gate ${TRUSTED_DEVICE_GATE} is off, skipping enrollment`,
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // If CLAUDE_TRUSTED_DEVICE_TOKEN is set (e.g. by an enterprise wrapper),
    // skip enrollment — the env var takes precedence in readStoredToken() so
    // any enrolled token would be shadowed and never used.
    // 满足 `process.env.CLAUDE_TRUSTED_DEVICE_TOKEN` 时，远程桥接会话执行该分支。
    if (process.env.CLAUDE_TRUSTED_DEVICE_TOKEN) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[trusted-device] CLAUDE_TRUSTED_DEVICE_TOKEN env var is set, skipping enrollment (env var takes precedence)',
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Lazy require — utils/auth.ts transitively pulls ~1300 modules
    // (config → file → permissions → sessionStorage → commands). Daemon callers
    // of getTrustedDeviceToken() don't need this; only /login does.
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 远程桥接 trusted Device先整理这一处局部数据，后续分支可以直接读取。
    const { getClaudeAIOAuthTokens } =
      require('../utils/auth.js') as typeof import('../utils/auth.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // accessToken读取`getClaudeAIOAuthTokens`，供远程桥接会话后续处理使用。
    const accessToken = getClaudeAIOAuthTokens()?.accessToken
    // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!accessToken) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[trusted-device] No OAuth token, skipping enrollment')
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Always re-enroll on /login — the existing token may belong to a
    // different account (account-switch without /logout). Skipping enrollment
    // would send the old account's token on the new account's bridge calls.
    // secureStorage读取`getSecureStorage`，供远程桥接会话后续处理使用。
    const secureStorage = getSecureStorage()

    // 满足 `isEssentialTrafficOnly()` 时，远程桥接会话执行该分支。
    if (isEssentialTrafficOnly()) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[trusted-device] Essential traffic only, skipping enrollment',
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // baseUrl读取`getOauthConfig`，供远程桥接会话后续处理使用。
    const baseUrl = getOauthConfig().BASE_API_URL
    // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let response
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应更新为 `await axios.post<{`，确保Bridge 通信后续读取最新状态。
      response = await axios.post<{
        device_token?: string
        device_id?: string
      }>(
        `${baseUrl}/api/auth/trusted_devices`,
        { display_name: `Claude Code on ${hostname()} · ${process.platform}` },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
          // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
          validateStatus: s => s < 500,
        },
      )
    } catch (err: unknown) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[trusted-device] Enrollment request failed: ${errorMessage(err)}`,
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `response.status` 与 `200 && response.status !== 201` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200 && response.status !== 201) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[trusted-device] Enrollment failed ${response.status}: ${jsonStringify(response.data).slice(0, 200)}`,
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // token保存`response.data?.device_token`，供后续判断或组装使用。
    const token = response.data?.device_token
    // `!token || typeof token` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (!token || typeof token !== 'string') {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[trusted-device] Enrollment response missing device_token field',
      )
      // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // storageData读取`secureStorage.read`，供远程桥接会话后续处理使用。
      const storageData = secureStorage.read()
      // storageData缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!storageData) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[trusted-device] Cannot read storage, skipping token persist',
        )
        // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // trustedDeviceToken更新为 `token`，确保Bridge 通信后续读取最新状态。
      storageData.trustedDeviceToken = token
      // 结果保存`secureStorage.update`，供远程桥接会话后续处理使用。
      const result = secureStorage.update(storageData)
      // result.success 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!result.success) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[trusted-device] Failed to persist token: ${result.warning ?? 'unknown'}`,
        )
        // 远程桥接 trusted Device在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 readStoredToken.cache?.clear?.()，完成这一处局部操作。
      readStoredToken.cache?.clear?.()
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[trusted-device] Enrolled device_id=${response.data.device_id ?? 'unknown'}`,
      )
    } catch (err: unknown) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[trusted-device] Storage write failed: ${errorMessage(err)}`,
      )
    }
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[trusted-device] Enrollment error: ${errorMessage(err)}`)
  }
}
