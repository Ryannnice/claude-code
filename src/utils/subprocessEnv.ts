// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

/**
 * Env vars to strip from subprocess environments when running inside GitHub
 * Actions. This prevents prompt-injection attacks from exfiltrating secrets
 * via shell expansion (e.g., ${ANTHROPIC_API_KEY}) in Bash tool commands.
 *
 * The parent claude process keeps these vars (needed for API calls, lazy
 * credential reads). Only child processes (bash, shell snapshot, MCP stdio, LSP, hooks) are scrubbed.
 *
 * GITHUB_TOKEN / GH_TOKEN are intentionally NOT scrubbed — wrapper scripts
 * (gh.sh) need them to call the GitHub API. That token is job-scoped and
 * expires when the workflow ends.
 */
// GHA_SUBPROCESS_SCRUB 聚合成有序列表，保持后续遍历顺序稳定。
const GHA_SUBPROCESS_SCRUB = [
  // Anthropic auth — claude re-reads these per-request, subprocesses don't need them
  'ANTHROPIC_API_KEY',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_FOUNDRY_API_KEY',
  'ANTHROPIC_CUSTOM_HEADERS',

  // OTLP exporter headers — documented to carry Authorization=Bearer tokens
  // for monitoring backends; read in-process by OTEL SDK, subprocesses never need them
  'OTEL_EXPORTER_OTLP_HEADERS',
  'OTEL_EXPORTER_OTLP_LOGS_HEADERS',
  'OTEL_EXPORTER_OTLP_METRICS_HEADERS',
  'OTEL_EXPORTER_OTLP_TRACES_HEADERS',

  // Cloud provider creds — same pattern (lazy SDK reads)
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_BEARER_TOKEN_BEDROCK',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'AZURE_CLIENT_SECRET',
  'AZURE_CLIENT_CERTIFICATE_PATH',

  // GitHub Actions OIDC — consumed by the action's JS before claude spawns;
  // leaking these allows minting an App installation token → repo takeover
  'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
  'ACTIONS_ID_TOKEN_REQUEST_URL',

  // GitHub Actions artifact/cache API — cache poisoning → supply-chain pivot
  'ACTIONS_RUNTIME_TOKEN',
  'ACTIONS_RUNTIME_URL',

  // claude-code-action-specific duplicates — action JS consumes these during
  // prepare, before spawning claude. ALL_INPUTS contains anthropic_api_key as JSON.
  'ALL_INPUTS',
  'OVERRIDE_GITHUB_TOKEN',
  'DEFAULT_WORKFLOW_TOKEN',
  'SSH_SIGNING_KEY',
] as const

/**
 * Returns a copy of process.env with sensitive secrets stripped, for use when
 * spawning subprocesses (Bash tool, shell snapshot, MCP stdio servers, LSP
 * servers, shell hooks).
 *
 * Gated on CLAUDE_CODE_SUBPROCESS_ENV_SCRUB. claude-code-action sets this
 * automatically when `allowed_non_write_users` is configured — the flag that
 * exposes a workflow to untrusted content (prompt injection surface).
 */
// Registered by init.ts after the upstreamproxy module is dynamically imported
// in CCR sessions. Stays undefined in non-CCR startups so we never pull in the
// upstreamproxy module graph (upstreamproxy.ts + relay.ts) via a static import.
// 这个回调绑定到 let _getUpstreamProxyEnv: (() => Record<string, string>) | undefined，负责共享工具在该局部场景下的响应。
let _getUpstreamProxyEnv: (() => Record<string, string>) | undefined

/**
 * Called from init.ts to wire up the proxy env function after the upstreamproxy
 * module has been lazily loaded. Must be called before any subprocess is spawned.
 */
// registerUpstreamProxyEnvFn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerUpstreamProxyEnvFn(
  // 这个回调绑定到 fn: () => Record<string, string>,，负责共享工具在该局部场景下的响应。
  fn: () => Record<string, string>,
): void {
  // _getUpstreamProxyEnv更新为 `fn`，确保共享工具后续读取最新状态。
  _getUpstreamProxyEnv = fn
}

// subprocessEnv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function subprocessEnv(): NodeJS.ProcessEnv {
  // CCR upstreamproxy: inject HTTPS_PROXY + CA bundle vars so curl/gh/python
  // in agent subprocesses route through the local relay. Returns {} when the
  // proxy is disabled or not registered (non-CCR), so this is a no-op outside
  // CCR containers.
  // proxyEnv读取`_getUpstreamProxyEnv?.() ?? {}` 整理出中间结果，供共享工具 subprocess Env后续步骤使用。
  const proxyEnv = _getUpstreamProxyEnv?.() ?? {}

  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB)) {
    // 返回 `Object.keys(proxyEnv).length > 0`，作为共享工具这次计算的结果。
    return Object.keys(proxyEnv).length > 0
      ? { ...process.env, ...proxyEnv }
      : process.env
  }
  // env集中保存共享工具 subprocess Env要一起传递的字段。
  const env = { ...process.env, ...proxyEnv }
  // 按顺序遍历 `GHA_SUBPROCESS_SCRUB` 中的k，逐个交给共享工具处理。
  for (const k of GHA_SUBPROCESS_SCRUB) {
    // 共享工具 subprocess Env在这里处理 `delete env[k]`，完成这一小步状态转换。
    delete env[k]
    // GitHub Actions auto-creates INPUT_<NAME> for `with:` inputs, duplicating
    // secrets like INPUT_ANTHROPIC_API_KEY. No-op for vars that aren't action inputs.
    // 共享工具 subprocess Env在这里处理 `delete env[`INPUT_${k}`]`，完成这一小步状态转换。
    delete env[`INPUT_${k}`]
  }
  // 返回 `env`，作为共享工具这次计算的结果。
  return env
}
