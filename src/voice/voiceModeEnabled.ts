// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让voice Mode Enabled后续逻辑可以直接复用这些外部能力。
import {
  getClaudeAIOAuthTokens,
  isAnthropicAuthEnabled,
} from '../utils/auth.js'

/**
 * Kill-switch check for voice mode. Returns true unless the
 * `tengu_amber_quartz_disabled` GrowthBook flag is flipped on (emergency
 * off). Default `false` means a missing/stale disk cache reads as "not
 * killed" — so fresh installs get voice working immediately without
 * waiting for GrowthBook init. Use this for deciding whether voice mode
 * should be *visible* (e.g., command registration, config UI).
 */
// isVoiceGrowthBookEnabled 封装voiceModeEnabled的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVoiceGrowthBookEnabled(): boolean {
  // Positive ternary pattern — see docs/feature-gating.md.
  // Negative pattern (if (!feature(...)) return) does not eliminate
  // inline string literals from external builds.
  // 返回 `feature('VOICE_MODE')`，作为voice Mode Enabled这次计算的结果。
  return feature('VOICE_MODE')
    ? !getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_quartz_disabled', false)
    : false
}

/**
 * Auth-only check for voice mode. Returns true when the user has a valid
 * Anthropic OAuth token. Backed by the memoized getClaudeAIOAuthTokens —
 * first call spawns `security` on macOS (~20-50ms), subsequent calls are
 * cache hits. The memoize clears on token refresh (~once/hour), so one
 * cold spawn per refresh is expected. Cheap enough for usage-time checks.
 */
// hasVoiceAuth 封装voiceModeEnabled的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasVoiceAuth(): boolean {
  // Voice mode requires Anthropic OAuth — it uses the voice_stream
  // endpoint on claude.ai which is not available with API keys,
  // Bedrock, Vertex, or Foundry.
  // 满足 `!isAnthropicAuthEnabled()` 时，voice Mode Enabled执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // isAnthropicAuthEnabled only checks the auth *provider*, not whether
  // a token exists. Without this check, the voice UI renders but
  // connectVoiceStream fails silently when the user isn't logged in.
  // token 列表读取`getClaudeAIOAuthTokens`，供voice Mode Enabled后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 返回 `Boolean(tokens?.accessToken)`，作为voice Mode Enabled这次计算的结果。
  return Boolean(tokens?.accessToken)
}

/**
 * Full runtime check: auth + GrowthBook kill-switch. Callers: `/voice`
 * (voice.ts, voice/index.ts), ConfigTool, VoiceModeNotice — command-time
 * paths where a fresh keychain read is acceptable. For React render
 * paths use useVoiceEnabled() instead (memoizes the auth half).
 */
// isVoiceModeEnabled 封装voiceModeEnabled的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVoiceModeEnabled(): boolean {
  // 返回 `hasVoiceAuth() && isVoiceGrowthBookEnabled()`，作为voice Mode Enabled这次计算的结果。
  return hasVoiceAuth() && isVoiceGrowthBookEnabled()
}
