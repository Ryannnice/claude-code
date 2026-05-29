// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  hasVoiceAuth,
  isVoiceGrowthBookEnabled,
} from '../voice/voiceModeEnabled.js'

/**
 * Combines user intent (settings.voiceEnabled) with auth + GB kill-switch.
 * Only the auth half is memoized on authVersion — it's the expensive one
 * (cold getClaudeAIOAuthTokens memoize → sync `security` spawn, ~60ms/call,
 * ~180ms total in profile v5 when token refresh cleared the cache mid-session).
 * GB is a cheap cached-map lookup and stays outside the memo so a mid-session
 * kill-switch flip still takes effect on the next render.
 *
 * authVersion bumps on /login only. Background token refresh leaves it alone
 * (user is still authed), so the auth memo stays correct without re-eval.
 */
// useVoiceEnabled 封装useVoiceEnabled的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useVoiceEnabled(): boolean {
  // userIntent保存`useAppState`，供React hook后续处理使用。
  const userIntent = useAppState(s => s.settings.voiceEnabled === true)
  // authVersion保存`useAppState`，供React hook后续处理使用。
  const authVersion = useAppState(s => s.authVersion)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // authed保存`useMemo`，供React hook后续处理使用。
  const authed = useMemo(hasVoiceAuth, [authVersion])
  // 返回 `userIntent && authed && isVoiceGrowthBookEnabled()`，作为React hook 状态流这次计算的结果。
  return userIntent && authed && isVoiceGrowthBookEnabled()
}
