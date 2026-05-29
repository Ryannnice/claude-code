/**
 * Preconnect to the Anthropic API to overlap TCP+TLS handshake with startup.
 *
 * The TCP+TLS handshake is ~100-200ms that normally blocks inside the first
 * API call. Kicking a fire-and-forget fetch during init lets the handshake
 * happen in parallel with action-handler work (~100ms of setup/commands/mcp
 * before the API request in -p mode; unbounded "user is typing" window in
 * interactive mode).
 *
 * Bun's fetch shares a keep-alive connection pool globally, so the real API
 * request reuses the warmed connection.
 *
 * Called from init.ts AFTER applyExtraCACertsFromConfig() + configureGlobalAgents()
 * so settings.json env vars are applied and the TLS cert store is finalized.
 * The early cli.tsx call site was removed — it ran before settings.json loaded,
 * so ANTHROPIC_BASE_URL/proxy/mTLS in settings would be invisible and preconnect
 * would warm the wrong pool (or worse, lock BoringSSL's cert store before
 * NODE_EXTRA_CA_CERTS was applied).
 *
 * Skipped when:
 * - proxy/mTLS/unix socket configured (preconnect would use wrong transport —
 *   the SDK passes a custom dispatcher/agent that doesn't share the global pool)
 * - Bedrock/Vertex/Foundry (different endpoints, different auth)
 */

// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

// fired标记共享工具 api Preconnect是否启用对应路径。
let fired = false

// preconnectAnthropicApi 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function preconnectAnthropicApi(): void {
  // 满足 `fired` 时，共享工具执行该分支。
  if (fired) return
  // fired更新为 `true`，确保共享工具后续读取最新状态。
  fired = true

  // Skip if using a cloud provider — different endpoint + auth
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
  ) {
    // 共享工具 api Preconnect在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Skip if proxy/mTLS/unix — SDK's custom dispatcher won't reuse this pool
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ANTHROPIC_UNIX_SOCKET ||
    process.env.CLAUDE_CODE_CLIENT_CERT ||
    process.env.CLAUDE_CODE_CLIENT_KEY
  ) {
    // 共享工具 api Preconnect在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Use configured base URL (staging, local, or custom gateway). Covers
  // ANTHROPIC_BASE_URL env + USE_STAGING_OAUTH + USE_LOCAL_OAUTH in one lookup.
  // NODE_EXTRA_CA_CERTS no longer a skip — init.ts applied it before this fires.
  // baseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseUrl =
    process.env.ANTHROPIC_BASE_URL || getOauthConfig().BASE_API_URL

  // Fire and forget. HEAD means no response body — the connection is eligible
  // for keep-alive pool reuse immediately after headers arrive. 10s timeout
  // so a slow network doesn't hang the process; abort is fine since the real
  // request will handshake fresh if needed.
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // 显式忽略 `fetch(baseUrl, {` 的返回值，只保留它触发的副作用。
  void fetch(baseUrl, {
    method: 'HEAD',
    signal: AbortSignal.timeout(10_000),
  // 这个回调绑定到 }).catch(() => {})，负责共享工具在该局部场景下的响应。
  }).catch(() => {})
}
