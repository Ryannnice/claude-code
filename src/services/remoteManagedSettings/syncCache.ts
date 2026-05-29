/**
 * Eligibility check for remote managed settings.
 *
 * The cache state itself lives in syncCacheState.ts (a leaf, no auth import).
 * This file keeps isRemoteManagedSettingsEligible — the one function that
 * needs auth.ts — plus resetSyncCache wrapped to clear the local eligibility
 * mirror alongside the leaf's state.
 */

// 引入 CLAUDE_AI_INFERENCE_SCOPE，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { CLAUDE_AI_INFERENCE_SCOPE } from '../../constants/oauth.js'
// 整理这一组导入，让服务层 sync Cache后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKeyWithSource,
  getClaudeAIOAuthTokens,
} from '../../utils/auth.js'
// 整理这一组导入，让服务层 sync Cache后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from '../../utils/model/providers.js'

// 整理这一组导入，让服务层 sync Cache后续逻辑可以直接复用这些外部能力。
import {
  resetSyncCache as resetLeafCache,
  setEligibility,
} from './syncCacheState.js'

// cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let cached: boolean | undefined

// resetSyncCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSyncCache(): void {
  // cached 缓存更新为 `undefined`，确保服务层后续读取最新状态。
  cached = undefined
  // 调用 resetLeafCache，触发服务层 sync Cache此处需要的副作用。
  resetLeafCache()
}

/**
 * Check if the current user is eligible for remote managed settings
 *
 * Eligibility:
 * - Console users (API key): All eligible (must have actual key, not just apiKeyHelper)
 * - OAuth users with known subscriptionType: Only Enterprise/C4E and Team
 * - OAuth users with subscriptionType === null (externally-injected tokens via
 *   CLAUDE_CODE_OAUTH_TOKEN / FD, or keychain tokens missing metadata): Eligible —
 *   the API returns empty settings for ineligible orgs, so the cost of a false
 *   positive is one round-trip
 *
 * This is a pre-check to determine if we should query the API.
 * The API will return empty settings for users without managed settings.
 *
 * IMPORTANT: This function must NOT call getSettings() or any function that calls
 * getSettings() to avoid circular dependencies during settings loading.
 */
// isRemoteManagedSettingsEligible 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRemoteManagedSettingsEligible(): boolean {
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) return cached

  // 满足 `process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETC` 时，服务层 sync Cache执行该分支。
  if (process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH === '1') {
    // 返回 `(cached = setEligibility(false))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(false))
  }

  // 3p provider users should not hit the settings endpoint
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 返回 `(cached = setEligibility(false))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(false))
  }

  // Custom base URL users should not hit the settings endpoint
  // 满足 `!isFirstPartyAnthropicBaseUrl()` 时，服务层 sync Cache执行该分支。
  if (!isFirstPartyAnthropicBaseUrl()) {
    // 返回 `(cached = setEligibility(false))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(false))
  }

  // Cowork runs in a VM with its own permission model; server-managed settings
  // (designed for CLI/CCD) don't apply there, and per-surface settings don't
  // exist yet. MDM/file-based managed settings still apply via settings.ts —
  // those require physical deployment and a different IT intent.
  // 满足 `process.env.CLAUDE_CODE_ENTRYPOINT === 'local-age` 时，服务层 sync Cache执行该分支。
  if (process.env.CLAUDE_CODE_ENTRYPOINT === 'local-agent') {
    // 返回 `(cached = setEligibility(false))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(false))
  }

  // Check OAuth first: most Claude.ai users have no API key in the keychain.
  // The API key check spawns `security find-generic-password` (~20-50ms) which
  // returns null for OAuth-only users. Checking OAuth first short-circuits
  // that subprocess for the common case.
  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 sync Cache后续处理使用。
  const tokens = getClaudeAIOAuthTokens()

  // Externally-injected tokens (CCD via CLAUDE_CODE_OAUTH_TOKEN, CCR via
  // CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR, Agent SDK, CI) carry no
  // subscriptionType metadata — getClaudeAIOAuthTokens() constructs them with
  // subscriptionType: null. The token itself is valid; let the API decide.
  // fetchRemoteManagedSettings handles 204/404 gracefully (returns {}), and
  // settings.ts falls through to MDM/file when remote is empty, so ineligible
  // orgs pay one round-trip and nothing else changes.
  // 组合条件 `tokens?.accessToken && tokens.subscriptionType ==` 成立时，服务层 sync Cache才启用这条专门路径。
  if (tokens?.accessToken && tokens.subscriptionType === null) {
    // 返回 `(cached = setEligibility(true))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(true))
  }

  // 服务层 sync Cache在这里进入条件判断，后续代码按实际状态分流。
  if (
    tokens?.accessToken &&
    tokens.scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE) &&
    (tokens.subscriptionType === 'enterprise' ||
      tokens.subscriptionType === 'team')
  ) {
    // 返回 `(cached = setEligibility(true))`，作为服务层 sync Cache这次计算的结果。
    return (cached = setEligibility(true))
  }

  // Console users (API key) are eligible if we can get the actual key
  // Skip apiKeyHelper to avoid circular dependency with getSettings()
  // Wrap in try-catch because getAnthropicApiKeyWithSource throws in CI/test environments
  // when no API key is available
  // 保护这一段可能失败的服务层 sync Cache操作，确保异常能进入相邻错误处理。
  try {
    // 从 `getAnthropicApiKeyWithSource({` 解构 key，减少服务层 sync Cache对同一对象的重复访问。
    const { key: apiKey } = getAnthropicApiKeyWithSource({
      skipRetrievingKeyFromApiKeyHelper: true,
    })
    // 满足 `apiKey` 时，服务层 sync Cache执行该分支。
    if (apiKey) {
      // 返回 `(cached = setEligibility(true))`，作为服务层 sync Cache这次计算的结果。
      return (cached = setEligibility(true))
    }
  } catch {
    // No API key available (e.g., CI/test environment)
  }

  // 返回 `(cached = setEligibility(false))`，作为服务层 sync Cache这次计算的结果。
  return (cached = setEligibility(false))
}
