/**
 * Session ID tag translation helpers for the CCR v2 compat layer.
 *
 * Lives in its own file (rather than workSecret.ts) so that sessionHandle.ts
 * and replBridgeTransport.ts (bridge.mjs entry points) can import from
 * workSecret.ts without pulling in these retag functions.
 *
 * The isCseShimEnabled kill switch is injected via setCseShimGate() to avoid
 * a static import of bridgeEnabled.ts → growthbook.ts → config.ts — all
 * banned from the sdk.mjs bundle (scripts/build-agent-sdk.sh). Callers that
 * already import bridgeEnabled.ts register the gate; the SDK path never does,
 * so the shim defaults to active (matching isCseShimEnabled()'s own default).
 */

// 这个回调绑定到 let _isCseShimEnabled: (() => boolean) | undefined，负责远程桥接会话在该局部场景下的响应。
let _isCseShimEnabled: (() => boolean) | undefined

/**
 * Register the GrowthBook gate for the cse_ shim. Called from bridge
 * init code that already imports bridgeEnabled.ts.
 */
// setCseShimGate 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCseShimGate(gate: () => boolean): void {
  // _isCseShimEnabled更新为 `gate`，确保Bridge 通信后续读取最新状态。
  _isCseShimEnabled = gate
}

/**
 * Re-tag a `cse_*` session ID to `session_*` for use with the v1 compat API.
 *
 * Worker endpoints (/v1/code/sessions/{id}/worker/*) want `cse_*`; that's
 * what the work poll delivers. Client-facing compat endpoints
 * (/v1/sessions/{id}, /v1/sessions/{id}/archive, /v1/sessions/{id}/events)
 * want `session_*` — compat/convert.go:27 validates TagSession. Same UUID,
 * different costume. No-op for IDs that aren't `cse_*`.
 *
 * bridgeMain holds one sessionId variable for both worker registration and
 * session-management calls. It arrives as `cse_*` from the work poll under
 * the compat gate, so archiveSession/fetchSessionTitle need this re-tag.
 */
// toCompatSessionId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toCompatSessionId(id: string): string {
  // 满足 `!id.startsWith('cse_')` 时，远程桥接会话执行该分支。
  if (!id.startsWith('cse_')) return id
  // 组合条件 `_isCseShimEnabled && !_isCseShimEnabled()` 成立时，远程桥接会话才启用这条专门路径。
  if (_isCseShimEnabled && !_isCseShimEnabled()) return id
  // 返回 `'session_' + id.slice('cse_'.length)`，作为远程桥接会话这次计算的结果。
  return 'session_' + id.slice('cse_'.length)
}

/**
 * Re-tag a `session_*` session ID to `cse_*` for infrastructure-layer calls.
 *
 * Inverse of toCompatSessionId. POST /v1/environments/{id}/bridge/reconnect
 * lives below the compat layer: once ccr_v2_compat_enabled is on server-side,
 * it looks sessions up by their infra tag (`cse_*`). createBridgeSession still
 * returns `session_*` (compat/convert.go:41) and that's what bridge-pointer
 * stores — so perpetual reconnect passes the wrong costume and gets "Session
 * not found" back. Same UUID, wrong tag. No-op for IDs that aren't `session_*`.
 */
// toInfraSessionId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toInfraSessionId(id: string): string {
  // 满足 `!id.startsWith('session_')` 时，远程桥接会话执行该分支。
  if (!id.startsWith('session_')) return id
  // 返回 `'cse_' + id.slice('session_'.length)`，作为远程桥接会话这次计算的结果。
  return 'cse_' + id.slice('session_'.length)
}
