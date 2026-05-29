// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 引入 createCombinedAbortSignal，将 ../combinedAbortSignal.js 中已经封装好的能力接到本文件流程里。
import { createCombinedAbortSignal } from '../combinedAbortSignal.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 getProxyUrl、shouldBypassProxy，将 ../proxy.js 中已经封装好的能力接到本文件流程里。
import { getProxyUrl, shouldBypassProxy } from '../proxy.js'
// Import as namespace so spyOn works in tests (direct imports bypass spies)
// 引入 * as settingsModule，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import * as settingsModule from '../settings/settings.js'
// 类型依赖 { HttpHook } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HttpHook } from '../settings/types.js'
// 引入 ssrfGuardedLookup，将 ./ssrfGuard.js 中已经封装好的能力接到本文件流程里。
import { ssrfGuardedLookup } from './ssrfGuard.js'

// DEFAULT_HTTP_HOOK_TIMEOUT_MS 集合保存`minutes`，供共享工具后续处理使用。
const DEFAULT_HTTP_HOOK_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes (matches TOOL_HOOK_EXECUTION_TIMEOUT_MS)

/**
 * Get the sandbox proxy config for routing HTTP hook requests through the
 * sandbox network proxy when sandboxing is enabled.
 *
 * Uses dynamic import to avoid a static import cycle
 * (sandbox-adapter -> settings -> ... -> hooks -> execHttpHook).
 */
// getSandboxProxyConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getSandboxProxyConfig(): Promise<
  { host: string; port: number; protocol: string } | undefined
> {
  // 从 `await import('../sandbox/sandbox-adapter.js')` 解构 SandboxManager，减少React hook exec Http Hook对同一对象的重复访问。
  const { SandboxManager } = await import('../sandbox/sandbox-adapter.js')

  // 满足 `!SandboxManager.isSandboxingEnabled()` 时，共享工具执行该分支。
  if (!SandboxManager.isSandboxingEnabled()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Wait for the sandbox network proxy to finish initializing. In REPL mode,
  // SandboxManager.initialize() is fire-and-forget so the proxy may not be
  // ready yet when the first hook fires.
  // 等待 `SandboxManager.waitForNetworkInitialization()` 完成，再继续React hook exec Http Hook的异步流程。
  await SandboxManager.waitForNetworkInitialization()

  // proxyPort读取`SandboxManager.getProxyPort`，供共享工具后续处理使用。
  const proxyPort = SandboxManager.getProxyPort()
  // proxyPort缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!proxyPort) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { host: '127.0.0.1', port: proxyPort, protocol: 'http' }
}

/**
 * Read HTTP hook allowlist restrictions from merged settings (all sources).
 * Follows the allowedMcpServers precedent: arrays concatenate across sources.
 * When allowManagedHooksOnly is set in managed settings, only admin-defined
 * hooks run anyway, so no separate lock-down boolean is needed here.
 */
// getHttpHookPolicy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHttpHookPolicy(): {
  allowedUrls: string[] | undefined
  allowedEnvVars: string[] | undefined
} {
  // settings 集合读取`settingsModule.getInitialSettings`，供共享工具后续处理使用。
  const settings = settingsModule.getInitialSettings()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    allowedUrls: settings.allowedHttpHookUrls,
    allowedEnvVars: settings.httpHookAllowedEnvVars,
  }
}

/**
 * Match a URL against a pattern with * as a wildcard (any characters).
 * Same semantics as the MCP server allowlist patterns.
 */
// urlMatchesPattern 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function urlMatchesPattern(url: string, pattern: string): boolean {
  // escaped格式化`pattern.replace`，供共享工具后续处理使用。
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  // regexStr格式化`escaped.replace`，供共享工具后续处理使用。
  const regexStr = escaped.replace(/\*/g, '.*')
  // 返回 `new RegExp(`^${regexStr}$`).test(url)`，作为共享工具这次计算的结果。
  return new RegExp(`^${regexStr}$`).test(url)
}

/**
 * Strip CR, LF, and NUL bytes from a header value to prevent HTTP header
 * injection (CRLF injection) via env var values or hook-configured header
 * templates. A malicious env var like "token\r\nX-Evil: 1" would otherwise
 * inject a second header into the request.
 */
// sanitizeHeaderValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  // 返回 `value.replace(/[\r\n\x00]/g, '')`，作为共享工具这次计算的结果。
  return value.replace(/[\r\n\x00]/g, '')
}

/**
 * Interpolate $VAR_NAME and ${VAR_NAME} patterns in a string using process.env,
 * but only for variable names present in the allowlist. References to variables
 * not in the allowlist are replaced with empty strings to prevent exfiltration
 * of secrets via project-configured HTTP hooks.
 *
 * The result is sanitized to strip CR/LF/NUL bytes to prevent header injection.
 */
// interpolateEnvVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function interpolateEnvVars(
  value: string,
  allowedEnvVars: ReadonlySet<string>,
): string {
  // interpolated格式化`value.replace`，供共享工具后续处理使用。
  const interpolated = value.replace(
    /\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g,
    // 这个回调绑定到 (_, braced, unbraced) => {，负责共享工具在该局部场景下的响应。
    (_, braced, unbraced) => {
      // varName 命名 `braced ?? unbraced`，让后续代码直接表达这个值的用途。
      const varName = braced ?? unbraced
      // 满足 `!allowedEnvVars.has(varName)` 时，共享工具执行该分支。
      if (!allowedEnvVars.has(varName)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: env var $${varName} not in allowedEnvVars, skipping interpolation`,
          { level: 'warn' },
        )
        // 返回空字符串表示没有可用文本，调用方会按空输入处理。
        return ''
      }
      // 返回 `process.env[varName] ?? ''`，作为共享工具这次计算的结果。
      return process.env[varName] ?? ''
    },
  )
  // 返回 `sanitizeHeaderValue(interpolated)`，作为共享工具这次计算的结果。
  return sanitizeHeaderValue(interpolated)
}

/**
 * Execute an HTTP hook by POSTing the hook input JSON to the configured URL.
 * Returns the raw response for the caller to interpret.
 *
 * When sandboxing is enabled, requests are routed through the sandbox network
 * proxy which enforces the domain allowlist. The proxy returns HTTP 403 for
 * blocked domains.
 *
 * Header values support $VAR_NAME and ${VAR_NAME} env var interpolation so that
 * secrets (e.g. "Authorization: Bearer $MY_TOKEN") are not stored in settings.json.
 * Only env vars explicitly listed in the hook's `allowedEnvVars` array are resolved;
 * all other references are replaced with empty strings.
 */
// execHttpHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function execHttpHook(
  hook: HttpHook,
  _hookEvent: HookEvent,
  jsonInput: string,
  signal?: AbortSignal,
): Promise<{
  ok: boolean
  statusCode?: number
  body: string
  error?: string
  aborted?: boolean
}> {
  // Enforce URL allowlist before any I/O. Follows allowedMcpServers semantics:
  // undefined → no restriction; [] → block all; non-empty → must match a pattern.
  // policy读取`getHttpHookPolicy`，供共享工具后续处理使用。
  const policy = getHttpHookPolicy()
  // `policy.allowedUrls` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (policy.allowedUrls !== undefined) {
    // matched筛选`allowedUrls.some`，供共享工具后续处理使用。
    const matched = policy.allowedUrls.some(p => urlMatchesPattern(hook.url, p))
    // matched缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!matched) {
      // 消息保存``HTTP hook blocked: ${hook.url} does not match any patter...`，作为后续固定文本处理的输入。
      const msg = `HTTP hook blocked: ${hook.url} does not match any pattern in allowedHttpHookUrls`
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(msg, { level: 'warn' })
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ok: false, body: '', error: msg }
    }
  }

  // timeoutMs 集合 命名 `hook.timeout`，让后续代码直接表达这个值的用途。
  const timeoutMs = hook.timeout
    ? hook.timeout * 1000
    : DEFAULT_HTTP_HOOK_TIMEOUT_MS

  // 从 `createCombinedAbortSignal(` 解构 signal、cleanup，减少React hook exec Http Hook对同一对象的重复访问。
  const { signal: combinedSignal, cleanup } = createCombinedAbortSignal(
    signal,
    { timeoutMs },
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Build headers with env var interpolation in values
    // 请求头 集中保存React hook exec Http Hook要一起传递的字段。
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    // 满足 `hook.headers` 时，共享工具执行该分支。
    if (hook.headers) {
      // Intersect hook's allowedEnvVars with policy allowlist when policy is set
      // hookVars 集合保存`hook.allowedEnvVars ?? []`，供共享工具React hook exec Http Hook后续判断或输出使用。
      const hookVars = hook.allowedEnvVars ?? []
      // effectiveVars 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const effectiveVars =
        policy.allowedEnvVars !== undefined
          // 这个回调绑定到 ? hookVars.filter(v => policy.allowedEnvVars!.includes(v))，负责共享工具在该局部场景下的响应。
          ? hookVars.filter(v => policy.allowedEnvVars!.includes(v))
          : hookVars
      // allowedEnvVars 集合保存`Set`，供共享工具后续处理使用。
      const allowedEnvVars = new Set(effectiveVars)
      // 循环处理 `const [name, value] of Object.entries(hook.headers)`，让共享工具把同类条目按顺序走完。
      for (const [name, value] of Object.entries(hook.headers)) {
        // headers[name更新为 `interpolateEnvVars(value, allowedEnvVars)`，确保React hook exec Http Hook后续读取最新状态。
        headers[name] = interpolateEnvVars(value, allowedEnvVars)
      }
    }

    // Route through sandbox network proxy when available. The proxy enforces
    // the domain allowlist and returns 403 for blocked domains.
    // sandboxProxy读取`getSandboxProxyConfig`，供共享工具后续处理使用。
    const sandboxProxy = await getSandboxProxyConfig()

    // Detect env var proxy (HTTP_PROXY / HTTPS_PROXY, respecting NO_PROXY).
    // When set, configureGlobalAgents() has already installed a request
    // interceptor that sets httpsAgent to an HttpsProxyAgent — the proxy
    // handles DNS for the target. Skip the SSRF guard in that case, same
    // as we do for the sandbox proxy, so that we don't accidentally block
    // a corporate proxy sitting on a private IP (e.g. 10.0.0.1:3128).
    // envProxyActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const envProxyActive =
      !sandboxProxy &&
      getProxyUrl() !== undefined &&
      !shouldBypassProxy(hook.url)

    // 满足 `sandboxProxy` 时，共享工具执行该分支。
    if (sandboxProxy) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: HTTP hook POST to ${hook.url} (via sandbox proxy :${sandboxProxy.port})`,
      )
    // React hook exec Http Hook在这里处理 `} else if (envProxyActive) {`，完成这一小步状态转换。
    } else if (envProxyActive) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: HTTP hook POST to ${hook.url} (via env-var proxy)`,
      )
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: HTTP hook POST to ${hook.url}`)
    }

    // 接口响应 等待 `axios.post<string>(hook.url, jsonInput, {`，确保继续执行前已有结果。
    const response = await axios.post<string>(hook.url, jsonInput, {
      headers,
      signal: combinedSignal,
      responseType: 'text',
      // 这个回调绑定到 validateStatus: () => true,，负责共享工具在该局部场景下的响应。
      validateStatus: () => true,
      maxRedirects: 0,
      // Explicit false prevents axios's own env-var proxy detection; when an
      // env-var proxy is configured, the global axios interceptor installed
      // by configureGlobalAgents() handles it via httpsAgent instead.
      proxy: sandboxProxy ?? false,
      // SSRF guard: validate resolved IPs, block private/link-local ranges
      // (but allow loopback for local dev). Skipped when any proxy is in
      // use — the proxy performs DNS for the target, and applying the
      // guard would instead validate the proxy's own IP, breaking
      // connections to corporate proxies on private networks.
      lookup: sandboxProxy || envProxyActive ? undefined : ssrfGuardedLookup,
    })

    // 调用 cleanup，触发共享工具此处需要的副作用。
    cleanup()

    // 请求体 命名 `response.data ?? ''`，让后续代码直接表达这个值的用途。
    const body = response.data ?? ''
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: HTTP hook response status ${response.status}, body length ${body.length}`,
    )

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ok: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      body,
    }
  } catch (error) {
    // 调用 cleanup，触发共享工具此处需要的副作用。
    cleanup()

    // 满足 `combinedSignal.aborted` 时，共享工具执行该分支。
    if (combinedSignal.aborted) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ok: false, body: '', aborted: true }
    }

    // errorMsg 错误信息保存`errorMessage`，供共享工具后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Hooks: HTTP hook error: ${errorMsg}`, { level: 'error' })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: false, body: '', error: errorMsg }
  }
}
