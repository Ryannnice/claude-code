// PRODUCT_URL保存`'https://claude.com/claude-code'`，作为后续固定文本处理的输入。
export const PRODUCT_URL = 'https://claude.com/claude-code'

// Claude Code Remote session URLs
// CLAUDE_AI_BASE_URL固定为 `'https://claude.ai'`，作为product后续展示或比较的基准。
export const CLAUDE_AI_BASE_URL = 'https://claude.ai'
// CLAUDE_AI_STAGING_BASE_URL保存`'https://claude-ai.staging.ant.dev'`，作为后续固定文本处理的输入。
export const CLAUDE_AI_STAGING_BASE_URL = 'https://claude-ai.staging.ant.dev'
// CLAUDE_AI_LOCAL_BASE_URL 命名 `'http://localhost:4000'`，让后续代码直接表达这个值的用途。
export const CLAUDE_AI_LOCAL_BASE_URL = 'http://localhost:4000'

/**
 * Determine if we're in a staging environment for remote sessions.
 * Checks session ID format and ingress URL.
 */
// isRemoteSessionStaging 封装product的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRemoteSessionStaging(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  // 返回 `(`，作为product这次计算的结果。
  return (
    sessionId?.includes('_staging_') === true ||
    ingressUrl?.includes('staging') === true
  )
}

/**
 * Determine if we're in a local-dev environment for remote sessions.
 * Checks session ID format (e.g. `session_local_...`) and ingress URL.
 */
// isRemoteSessionLocal 封装product的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRemoteSessionLocal(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  // 返回 `(`，作为product这次计算的结果。
  return (
    sessionId?.includes('_local_') === true ||
    ingressUrl?.includes('localhost') === true
  )
}

/**
 * Get the base URL for Claude AI based on environment.
 */
// getClaudeAiBaseUrl 封装product的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeAiBaseUrl(
  sessionId?: string,
  ingressUrl?: string,
): string {
  // 满足 `isRemoteSessionLocal(sessionId, ingressUrl)` 时，product执行该分支。
  if (isRemoteSessionLocal(sessionId, ingressUrl)) {
    // 返回 `CLAUDE_AI_LOCAL_BASE_URL`，作为product这次计算的结果。
    return CLAUDE_AI_LOCAL_BASE_URL
  }
  // 满足 `isRemoteSessionStaging(sessionId, ingressUrl)` 时，product执行该分支。
  if (isRemoteSessionStaging(sessionId, ingressUrl)) {
    // 返回 `CLAUDE_AI_STAGING_BASE_URL`，作为product这次计算的结果。
    return CLAUDE_AI_STAGING_BASE_URL
  }
  // 返回 `CLAUDE_AI_BASE_URL`，作为product这次计算的结果。
  return CLAUDE_AI_BASE_URL
}

/**
 * Get the full session URL for a remote session.
 *
 * The cse_→session_ translation is a temporary shim gated by
 * tengu_bridge_repl_v2_cse_shim_enabled (see isCseShimEnabled). Worker
 * endpoints (/v1/code/sessions/{id}/worker/*) want `cse_*` but the claude.ai
 * frontend currently routes on `session_*` (compat/convert.go:27 validates
 * TagSession). Same UUID body, different tag prefix. Once the server tags by
 * environment_kind and the frontend accepts `cse_*` directly, flip the gate
 * off. No-op for IDs already in `session_*` form. See toCompatSessionId in
 * src/bridge/sessionIdCompat.ts for the canonical helper (lazy-required here
 * to keep constants/ leaf-of-DAG at module-load time).
 */
// getRemoteSessionUrl 封装product的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRemoteSessionUrl(
  sessionId: string,
  ingressUrl?: string,
): string {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // product先整理这一处局部数据，后续分支可以直接读取。
  const { toCompatSessionId } =
    require('../bridge/sessionIdCompat.js') as typeof import('../bridge/sessionIdCompat.js')
  /* eslint-enable @typescript-eslint/no-require-imports */
  // compatId保存`toCompatSessionId`，供product后续处理使用。
  const compatId = toCompatSessionId(sessionId)
  // baseUrl读取`getClaudeAiBaseUrl`，供product后续处理使用。
  const baseUrl = getClaudeAiBaseUrl(compatId, ingressUrl)
  // 返回 ``${baseUrl}/code/${compatId}``，作为product这次计算的结果。
  return `${baseUrl}/code/${compatId}`
}
