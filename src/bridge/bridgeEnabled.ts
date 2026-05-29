// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  checkGate_CACHED_OR_BLOCKING,
  getDynamicConfig_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from '../services/analytics/growthbook.js'
// Namespace import breaks the bridgeEnabled → auth → config → bridgeEnabled
// cycle — authModule.foo is a live binding, so by the time the helpers below
// call it, auth.js is fully loaded. Previously used require() for the same
// deferral, but require() hits a CJS cache that diverges from the ESM
// namespace after mock.module() (daemon/auth.test.ts), breaking spyOn.
// 复用 * as authModule 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import * as authModule from '../utils/auth.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 复用 lt 工具函数，把通用处理留在 ../utils/semver.js 中维护。
import { lt } from '../utils/semver.js'

/**
 * Runtime check for bridge mode entitlement.
 *
 * Remote Control requires a claude.ai subscription (the bridge auths to CCR
 * with the claude.ai OAuth token). isClaudeAISubscriber() excludes
 * Bedrock/Vertex/Foundry, apiKeyHelper/gateway deployments, env-var API keys,
 * and Console API logins — none of which have the OAuth token CCR needs.
 * See github.com/deshaw/anthropic-issues/issues/24.
 *
 * The `feature('BRIDGE_MODE')` guard ensures the GrowthBook string literal
 * is only referenced when bridge mode is enabled at build time.
 */
// isBridgeEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBridgeEnabled(): boolean {
  // Positive ternary pattern — see docs/feature-gating.md.
  // Negative pattern (if (!feature(...)) return) does not eliminate
  // inline string literals from external builds.
  // 返回 `feature('BRIDGE_MODE')`，作为远程桥接会话这次计算的结果。
  return feature('BRIDGE_MODE')
    ? isClaudeAISubscriber() &&
        getFeatureValue_CACHED_MAY_BE_STALE('tengu_ccr_bridge', false)
    : false
}

/**
 * Blocking entitlement check for Remote Control.
 *
 * Returns cached `true` immediately (fast path). If the disk cache says
 * `false` or is missing, awaits GrowthBook init and fetches the fresh
 * server value (slow path, max ~5s), then writes it to disk.
 *
 * Use at entitlement gates where a stale `false` would unfairly block access.
 * For user-facing error paths, prefer `getBridgeDisabledReason()` which gives
 * a specific diagnostic. For render-body UI visibility checks, use
 * `isBridgeEnabled()` instead.
 */
// isBridgeEnabledBlocking 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isBridgeEnabledBlocking(): Promise<boolean> {
  // 返回 `feature('BRIDGE_MODE')`，作为远程桥接会话这次计算的结果。
  return feature('BRIDGE_MODE')
    ? isClaudeAISubscriber() &&
        (await checkGate_CACHED_OR_BLOCKING('tengu_ccr_bridge'))
    : false
}

/**
 * Diagnostic message for why Remote Control is unavailable, or null if
 * it's enabled. Call this instead of a bare `isBridgeEnabledBlocking()`
 * check when you need to show the user an actionable error.
 *
 * The GrowthBook gate targets on organizationUUID, which comes from
 * config.oauthAccount — populated by /api/oauth/profile during login.
 * That endpoint requires the user:profile scope. Tokens without it
 * (setup-token, CLAUDE_CODE_OAUTH_TOKEN env var, or pre-scope-expansion
 * logins) leave oauthAccount unpopulated, so the gate falls back to
 * false and users see a dead-end "not enabled" message with no hint
 * that re-login would fix it. See CC-1165 / gh-33105.
 */
// getBridgeDisabledReason 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getBridgeDisabledReason(): Promise<string | null> {
  // 满足 `feature('BRIDGE_MODE')` 时，远程桥接会话执行该分支。
  if (feature('BRIDGE_MODE')) {
    // 满足 `!isClaudeAISubscriber()` 时，远程桥接会话执行该分支。
    if (!isClaudeAISubscriber()) {
      // 返回 `'Remote Control requires a claude.ai subscription. Run `claude auth log...`，作为远程桥接会话这次计算的结果。
      return 'Remote Control requires a claude.ai subscription. Run `claude auth login` to sign in with your claude.ai account.'
    }
    // 满足 `!hasProfileScope()` 时，远程桥接会话执行该分支。
    if (!hasProfileScope()) {
      // 返回 `'Remote Control requires a full-scope login token. Long-lived tokens (f...`，作为远程桥接会话这次计算的结果。
      return 'Remote Control requires a full-scope login token. Long-lived tokens (from `claude setup-token` or CLAUDE_CODE_OAUTH_TOKEN) are limited to inference-only for security reasons. Run `claude auth login` to use Remote Control.'
    }
    // 满足 `!getOauthAccountInfo()?.organizationUuid` 时，远程桥接会话执行该分支。
    if (!getOauthAccountInfo()?.organizationUuid) {
      // 返回 `'Unable to determine your organization for Remote Control eligibility. ...`，作为远程桥接会话这次计算的结果。
      return 'Unable to determine your organization for Remote Control eligibility. Run `claude auth login` to refresh your account information.'
    }
    // 满足 `!(await checkGate_CACHED_OR_BLOCKING('tengu_ccr_bridge'))` 时，远程桥接会话执行该分支。
    if (!(await checkGate_CACHED_OR_BLOCKING('tengu_ccr_bridge'))) {
      // 返回 `'Remote Control is not yet enabled for your account.'`，作为远程桥接会话这次计算的结果。
      return 'Remote Control is not yet enabled for your account.'
    }
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // 返回 `'Remote Control is not available in this build.'`，作为远程桥接会话这次计算的结果。
  return 'Remote Control is not available in this build.'
}

// try/catch: main.tsx:5698 calls isBridgeEnabled() while defining the Commander
// program, before enableConfigs() runs. isClaudeAISubscriber() → getGlobalConfig()
// throws "Config accessed before allowed" there. Pre-config, no OAuth token can
// exist anyway — false is correct. Same swallow getFeatureValue_CACHED_MAY_BE_STALE
// already does at growthbook.ts:775-780.
// isClaudeAISubscriber 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isClaudeAISubscriber(): boolean {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `authModule.isClaudeAISubscriber()`，作为远程桥接会话这次计算的结果。
    return authModule.isClaudeAISubscriber()
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
// hasProfileScope 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasProfileScope(): boolean {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `authModule.hasProfileScope()`，作为远程桥接会话这次计算的结果。
    return authModule.hasProfileScope()
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
// getOauthAccountInfo 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOauthAccountInfo(): ReturnType<
  typeof authModule.getOauthAccountInfo
> {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `authModule.getOauthAccountInfo()`，作为远程桥接会话这次计算的结果。
    return authModule.getOauthAccountInfo()
  } catch {
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  }
}

/**
 * Runtime check for the env-less (v2) REPL bridge path.
 * Returns true when the GrowthBook flag `tengu_bridge_repl_v2` is enabled.
 *
 * This gates which implementation initReplBridge uses — NOT whether bridge
 * is available at all (see isBridgeEnabled above). Daemon/print paths stay
 * on the env-based implementation regardless of this gate.
 */
// isEnvLessBridgeEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEnvLessBridgeEnabled(): boolean {
  // 返回 `feature('BRIDGE_MODE')`，作为远程桥接会话这次计算的结果。
  return feature('BRIDGE_MODE')
    ? getFeatureValue_CACHED_MAY_BE_STALE('tengu_bridge_repl_v2', false)
    : false
}

/**
 * Kill-switch for the `cse_*` → `session_*` client-side retag shim.
 *
 * The shim exists because compat/convert.go:27 validates TagSession and the
 * claude.ai frontend routes on `session_*`, while v2 worker endpoints hand out
 * `cse_*`. Once the server tags by environment_kind and the frontend accepts
 * `cse_*` directly, flip this to false to make toCompatSessionId a no-op.
 * Defaults to true — the shim stays active until explicitly disabled.
 */
// isCseShimEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCseShimEnabled(): boolean {
  // 返回 `feature('BRIDGE_MODE')`，作为远程桥接会话这次计算的结果。
  return feature('BRIDGE_MODE')
    ? getFeatureValue_CACHED_MAY_BE_STALE(
        'tengu_bridge_repl_v2_cse_shim_enabled',
        true,
      )
    : true
}

/**
 * Returns an error message if the current CLI version is below the
 * minimum required for the v1 (env-based) Remote Control path, or null if the
 * version is fine. The v2 (env-less) path uses checkEnvLessBridgeMinVersion()
 * in envLessBridgeConfig.ts instead — the two implementations have independent
 * version floors.
 *
 * Uses cached (non-blocking) GrowthBook config. If GrowthBook hasn't
 * loaded yet, the default '0.0.0' means the check passes — a safe fallback.
 */
// checkBridgeMinVersion 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkBridgeMinVersion(): string | null {
  // Positive pattern — see docs/feature-gating.md.
  // Negative pattern (if (!feature(...)) return) does not eliminate
  // inline string literals from external builds.
  // 满足 `feature('BRIDGE_MODE')` 时，远程桥接会话执行该分支。
  if (feature('BRIDGE_MODE')) {
    // 配置读取`getDynamicConfig_CACHED_MAY_BE_STALE<{`，供后续判断或组装使用。
    const config = getDynamicConfig_CACHED_MAY_BE_STALE<{
      minVersion: string
    }>('tengu_bridge_min_version', { minVersion: '0.0.0' })
    // 组合条件 `config.minVersion && lt(MACRO.VERSION, config.minVersion)` 成立时，远程桥接会话才启用这条专门路径。
    if (config.minVersion && lt(MACRO.VERSION, config.minVersion)) {
      // 返回 ``Your version of Claude Code (${MACRO.VERSION}) is too old for Remote C...`，作为远程桥接会话这次计算的结果。
      return `Your version of Claude Code (${MACRO.VERSION}) is too old for Remote Control.\nVersion ${config.minVersion} or higher is required. Run \`claude update\` to update.`
    }
  }
  // 返回 `null`，作为远程桥接会话这次计算的结果。
  return null
}

/**
 * Default for remoteControlAtStartup when the user hasn't explicitly set it.
 * When the CCR_AUTO_CONNECT build flag is present (ant-only) and the
 * tengu_cobalt_harbor GrowthBook gate is on, all sessions connect to CCR by
 * default — the user can still opt out by setting remoteControlAtStartup=false
 * in config (explicit settings always win over this default).
 *
 * Defined here rather than in config.ts to avoid a direct
 * config.ts → growthbook.ts import cycle (growthbook.ts → user.ts → config.ts).
 */
// getCcrAutoConnectDefault 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCcrAutoConnectDefault(): boolean {
  // 返回 `feature('CCR_AUTO_CONNECT')`，作为远程桥接会话这次计算的结果。
  return feature('CCR_AUTO_CONNECT')
    ? getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_harbor', false)
    : false
}

/**
 * Opt-in CCR mirror mode — every local session spawns an outbound-only
 * Remote Control session that receives forwarded events. Separate from
 * getCcrAutoConnectDefault (bidirectional Remote Control). Env var wins for
 * local opt-in; GrowthBook controls rollout.
 */
// isCcrMirrorEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCcrMirrorEnabled(): boolean {
  // 返回 `feature('CCR_MIRROR')`，作为远程桥接会话这次计算的结果。
  return feature('CCR_MIRROR')
    ? isEnvTruthy(process.env.CLAUDE_CODE_CCR_MIRROR) ||
        getFeatureValue_CACHED_MAY_BE_STALE('tengu_ccr_mirror', false)
    : false
}
