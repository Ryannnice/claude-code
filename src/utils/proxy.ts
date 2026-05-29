// @aws-sdk/credential-provider-node and @smithy/node-http-handler are imported
// dynamically in getAWSClientProxyConfig() to defer ~929KB of AWS SDK.
// undici is lazy-required inside getProxyAgent/configureGlobalAgents to defer
// ~1.5MB when no HTTPS_PROXY/mTLS env vars are set (the common case).
// 引入 axios、AxiosInstance，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosInstance } from 'axios'
// 类型依赖 { LookupOptions } 来自 dns，用于校准共享工具的数据契约。
import type { LookupOptions } from 'dns'
// 类型依赖 { Agent } 来自 http，用于校准共享工具的数据契约。
import type { Agent } from 'http'
// 引入 HttpsProxyAgent、HttpsProxyAgentOptions，将 https-proxy-agent 中已经封装好的能力接到本文件流程里。
import { HttpsProxyAgent, type HttpsProxyAgentOptions } from 'https-proxy-agent'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 类型依赖 * as undici 来自 undici，用于校准共享工具的数据契约。
import type * as undici from 'undici'
// 引入 getCACertificates，将 ./caCerts.js 中已经封装好的能力接到本文件流程里。
import { getCACertificates } from './caCerts.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getMTLSAgent,
  getMTLSConfig,
  getTLSFetchOptions,
  type TLSConfig,
} from './mtls.js'

// Disable fetch keep-alive after a stale-pool ECONNRESET so retries open a
// fresh TCP connection instead of reusing the dead pooled socket. Sticky for
// the process lifetime — once the pool is known-bad, don't trust it again.
// Works under Bun (native fetch respects keepalive:false for pooling).
// Under Node/undici, keepalive is a no-op for pooling, but undici
// naturally evicts dead sockets from the pool on ECONNRESET.
// keepAliveDisabled标记共享工具 proxy是否启用对应路径。
let keepAliveDisabled = false

// disableKeepAlive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function disableKeepAlive(): void {
  // keepAliveDisabled更新为 `true`，确保共享工具后续读取最新状态。
  keepAliveDisabled = true
}

// _resetKeepAliveForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetKeepAliveForTesting(): void {
  // keepAliveDisabled更新为 `false`，确保共享工具后续读取最新状态。
  keepAliveDisabled = false
}

/**
 * Convert dns.LookupOptions.family to a numeric address family value
 * Handles: 0 | 4 | 6 | 'IPv4' | 'IPv6' | undefined
 */
// getAddressFamily 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAddressFamily(options: LookupOptions): 0 | 4 | 6 {
  // 按照 options.family 的取值选择共享工具的具体处理分支。
  switch (options.family) {
    case 0:
    case 4:
    case 6:
      // 返回 `options.family`，作为共享工具这次计算的结果。
      return options.family
    case 'IPv6':
      // 返回 `6`，作为共享工具这次计算的结果。
      return 6
    case 'IPv4':
    case undefined:
      // 返回 `4`，作为共享工具这次计算的结果。
      return 4
    default:
      // 抛出 new Error(`Unsupported address family: ${options.family}`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Unsupported address family: ${options.family}`)
  }
}

// EnvLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

/**
 * Get the active proxy URL if one is configured
 * Prefers lowercase variants over uppercase (https_proxy > HTTPS_PROXY > http_proxy > HTTP_PROXY)
 * @param env Environment variables to check (defaults to process.env for production use)
 */
// getProxyUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProxyUrl(env: EnvLike = process.env): string | undefined {
  // 返回 `env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY`，作为共享工具这次计算的结果。
  return env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY
}

/**
 * Get the NO_PROXY environment variable value
 * Prefers lowercase over uppercase (no_proxy > NO_PROXY)
 * @param env Environment variables to check (defaults to process.env for production use)
 */
// getNoProxy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNoProxy(env: EnvLike = process.env): string | undefined {
  // 返回 `env.no_proxy || env.NO_PROXY`，作为共享工具这次计算的结果。
  return env.no_proxy || env.NO_PROXY
}

/**
 * Check if a URL should bypass the proxy based on NO_PROXY environment variable
 * Supports:
 * - Exact hostname matches (e.g., "localhost")
 * - Domain suffix matches with leading dot (e.g., ".example.com")
 * - Wildcard "*" to bypass all
 * - Port-specific matches (e.g., "example.com:8080")
 * - IP addresses (e.g., "127.0.0.1")
 * @param urlString URL to check
 * @param noProxy NO_PROXY value (defaults to getNoProxy() for production use)
 */
// shouldBypassProxy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldBypassProxy(
  urlString: string,
  noProxy: string | undefined = getNoProxy(),
): boolean {
  // noProxy缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!noProxy) return false

  // Handle wildcard
  // 当 `noProxy` 匹配 `'*'` 时，共享工具执行对应分支。
  if (noProxy === '*') return true

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // URL保存`URL`，供共享工具后续处理使用。
    const url = new URL(urlString)
    // hostname保存`hostname.toLowerCase`，供共享工具后续处理使用。
    const hostname = url.hostname.toLowerCase()
    // port标记共享工具 proxy是否启用对应路径。
    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    // hostWithPort保存``${hostname}:${port}``，作为后续固定文本处理的输入。
    const hostWithPort = `${hostname}:${port}`

    // Split by comma or space and trim each entry
    // noProxyList 集合格式化`noProxy.split`，供共享工具后续处理使用。
    const noProxyList = noProxy.split(/[,\s]+/).filter(Boolean)

    // 返回 `noProxyList.some(pattern => {`，作为共享工具这次计算的结果。
    return noProxyList.some(pattern => {
      // pattern更新为 `pattern.toLowerCase().trim()`，确保共享工具后续读取最新状态。
      pattern = pattern.toLowerCase().trim()

      // Check for port-specific match
      // 满足 `pattern.includes(':')` 时，共享工具执行该分支。
      if (pattern.includes(':')) {
        // 返回 `hostWithPort === pattern`，作为共享工具这次计算的结果。
        return hostWithPort === pattern
      }

      // Check for domain suffix match (with or without leading dot)
      // 满足 `pattern.startsWith('.')` 时，共享工具执行该分支。
      if (pattern.startsWith('.')) {
        // Pattern ".example.com" should match "sub.example.com" and "example.com"
        // but NOT "notexample.com"
        // suffix保存`pattern`，供共享工具 proxy后续判断或输出使用。
        const suffix = pattern
        // 返回 `hostname === pattern.substring(1) || hostname.endsWith(suffix)`，作为共享工具这次计算的结果。
        return hostname === pattern.substring(1) || hostname.endsWith(suffix)
      }

      // Check for exact hostname match or IP address
      // 返回 `hostname === pattern`，作为共享工具这次计算的结果。
      return hostname === pattern
    })
  } catch {
    // If URL parsing fails, don't bypass proxy
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Create an HttpsProxyAgent with optional mTLS configuration
 * Skips local DNS resolution to let the proxy handle it
 */
// createHttpsProxyAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createHttpsProxyAgent(
  proxyUrl: string,
  extra: HttpsProxyAgentOptions<string> = {},
): HttpsProxyAgent<string> {
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()

  // agentOptions 集合 集中保存共享工具 proxy要一起传递的字段。
  const agentOptions: HttpsProxyAgentOptions<string> = {
    ...(mtlsConfig && {
      cert: mtlsConfig.cert,
      key: mtlsConfig.key,
      passphrase: mtlsConfig.passphrase,
    }),
    ...(caCerts && { ca: caCerts }),
  }

  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_PROXY_RESOLVES_HOSTS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_PROXY_RESOLVES_HOSTS)) {
    // Skip local DNS resolution - let the proxy resolve hostnames
    // This is needed for environments where DNS is not configured locally
    // and instead handled by the proxy (as in sandboxes)
    // lookup更新为 `(hostname, options, callback) => {`，确保共享工具后续读取最新状态。
    agentOptions.lookup = (hostname, options, callback) => {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(null, hostname, getAddressFamily(options))
    }
  }

  // 返回 `new HttpsProxyAgent(proxyUrl, { ...agentOptions, ...extra })`，作为共享工具这次计算的结果。
  return new HttpsProxyAgent(proxyUrl, { ...agentOptions, ...extra })
}

/**
 * Axios instance with its own proxy agent. Same NO_PROXY/mTLS/CA
 * resolution as the global interceptor, but agent options stay
 * scoped to this instance.
 */
// createAxiosInstance 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createAxiosInstance(
  extra: HttpsProxyAgentOptions<string> = {},
): AxiosInstance {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()
  // mtlsAgent读取`getMTLSAgent`，供共享工具后续处理使用。
  const mtlsAgent = getMTLSAgent()
  // instance构建`axios.create`，供共享工具后续处理使用。
  const instance = axios.create({ proxy: false })

  // proxyUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!proxyUrl) {
    // 满足 `mtlsAgent` 时，共享工具执行该分支。
    if (mtlsAgent) instance.defaults.httpsAgent = mtlsAgent
    // 返回 `instance`，作为共享工具这次计算的结果。
    return instance
  }

  // proxyAgent构建`createHttpsProxyAgent`，供共享工具后续处理使用。
  const proxyAgent = createHttpsProxyAgent(proxyUrl, extra)
  // 调用 instance.interceptors.request.use，触发共享工具此处需要的副作用。
  instance.interceptors.request.use(config => {
    // 只有 `config.url && shouldBypassProxy(config.url)` 满足时，共享工具才执行该分支。
    if (config.url && shouldBypassProxy(config.url)) {
      // httpsAgent更新为 `mtlsAgent`，确保共享工具后续读取最新状态。
      config.httpsAgent = mtlsAgent
      // httpAgent更新为 `mtlsAgent`，确保共享工具后续读取最新状态。
      config.httpAgent = mtlsAgent
    } else {
      // httpsAgent更新为 `proxyAgent`，确保共享工具后续读取最新状态。
      config.httpsAgent = proxyAgent
      // httpAgent更新为 `proxyAgent`，确保共享工具后续读取最新状态。
      config.httpAgent = proxyAgent
    }
    // 返回 `config`，作为共享工具这次计算的结果。
    return config
  })
  // 返回 `instance`，作为共享工具这次计算的结果。
  return instance
}

/**
 * Get or create a memoized proxy agent for the given URI
 * Now respects NO_PROXY environment variable
 */
// getProxyAgent保存`memoize`，供共享工具后续处理使用。
export const getProxyAgent = memoize((uri: string): undici.Dispatcher => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // undiciMod保存`require`，供共享工具后续处理使用。
  const undiciMod = require('undici') as typeof undici
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()

  // Use EnvHttpProxyAgent to respect NO_PROXY
  // This agent automatically checks NO_PROXY for each request
  // proxyOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const proxyOptions: undici.EnvHttpProxyAgent.Options & {
    requestTls?: {
      cert?: string | Buffer
      key?: string | Buffer
      passphrase?: string
      ca?: string | string[] | Buffer
    }
  } = {
    // Override both HTTP and HTTPS proxy with the provided URI
    httpProxy: uri,
    httpsProxy: uri,
    noProxy: process.env.NO_PROXY || process.env.no_proxy,
  }

  // Set both connect and requestTls so TLS options apply to both paths:
  // - requestTls: used by ProxyAgent for the TLS connection through CONNECT tunnels
  // - connect: used by Agent for direct (no-proxy) connections
  // 只有 `mtlsConfig || caCerts` 满足时，共享工具才执行该分支。
  if (mtlsConfig || caCerts) {
    // tlsOpts 集合集中保存共享工具 proxy要一起传递的字段。
    const tlsOpts = {
      ...(mtlsConfig && {
        cert: mtlsConfig.cert,
        key: mtlsConfig.key,
        passphrase: mtlsConfig.passphrase,
      }),
      ...(caCerts && { ca: caCerts }),
    }
    // connect更新为 `tlsOpts`，确保共享工具后续读取最新状态。
    proxyOptions.connect = tlsOpts
    // requestTls 请求数据更新为 `tlsOpts`，确保共享工具后续读取最新状态。
    proxyOptions.requestTls = tlsOpts
  }

  // 返回 `new undiciMod.EnvHttpProxyAgent(proxyOptions)`，作为共享工具这次计算的结果。
  return new undiciMod.EnvHttpProxyAgent(proxyOptions)
})

/**
 * Get an HTTP agent configured for WebSocket proxy support
 * Returns undefined if no proxy is configured or URL should bypass proxy
 */
// getWebSocketProxyAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWebSocketProxyAgent(url: string): Agent | undefined {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()

  // proxyUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!proxyUrl) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Check if URL should bypass proxy
  // 满足 `shouldBypassProxy(url)` 时，共享工具执行该分支。
  if (shouldBypassProxy(url)) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回 `createHttpsProxyAgent(proxyUrl)`，作为共享工具这次计算的结果。
  return createHttpsProxyAgent(proxyUrl)
}

/**
 * Get the proxy URL for WebSocket connections under Bun.
 * Bun's native WebSocket supports a `proxy` string option instead of Node's `agent`.
 * Returns undefined if no proxy is configured or URL should bypass proxy.
 */
// getWebSocketProxyUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWebSocketProxyUrl(url: string): string | undefined {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()

  // proxyUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!proxyUrl) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 满足 `shouldBypassProxy(url)` 时，共享工具执行该分支。
  if (shouldBypassProxy(url)) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回 `proxyUrl`，作为共享工具这次计算的结果。
  return proxyUrl
}

/**
 * Get fetch options for the Anthropic SDK with proxy and mTLS configuration
 * Returns fetch options with appropriate dispatcher for proxy and/or mTLS
 *
 * @param opts.forAnthropicAPI - Enables ANTHROPIC_UNIX_SOCKET tunneling. This
 *   env var is set by `claude ssh` on the remote CLI to route API calls through
 *   an ssh -R forwarded unix socket to a local auth proxy. It MUST NOT leak
 *   into non-Anthropic-API fetch paths (MCP HTTP/SSE transports, etc.) or those
 *   requests get misrouted to api.anthropic.com. Only the Anthropic SDK client
 *   should pass `true` here.
 */
// getProxyFetchOptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProxyFetchOptions(opts?: { forAnthropicAPI?: boolean }): {
  tls?: TLSConfig
  dispatcher?: undici.Dispatcher
  proxy?: string
  unix?: string
  keepalive?: false
} {
  // base保存`keepAliveDisabled ? ({ keepalive: false } as const) : {}`，供共享工具 proxy后续判断或输出使用。
  const base = keepAliveDisabled ? ({ keepalive: false } as const) : {}

  // ANTHROPIC_UNIX_SOCKET tunnels through the `claude ssh` auth proxy, which
  // hardcodes the upstream to the Anthropic API. Scope to the Anthropic API
  // client so MCP/SSE/other callers don't get their requests misrouted.
  // 满足 `opts?.forAnthropicAPI` 时，共享工具执行该分支。
  if (opts?.forAnthropicAPI) {
    // unixSocket 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const unixSocket = process.env.ANTHROPIC_UNIX_SOCKET
    // `unixSocket && typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
    if (unixSocket && typeof Bun !== 'undefined') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ...base, unix: unixSocket }
    }
  }

  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()

  // If we have a proxy, use the proxy agent (which includes mTLS config)
  // 满足 `proxyUrl` 时，共享工具执行该分支。
  if (proxyUrl) {
    // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof Bun !== 'undefined') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ...base, proxy: proxyUrl, ...getTLSFetchOptions() }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ...base, dispatcher: getProxyAgent(proxyUrl) }
  }

  // Otherwise, use TLS options directly if available
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { ...base, ...getTLSFetchOptions() }
}

/**
 * Configure global HTTP agents for both axios and undici
 * This ensures all HTTP requests use the proxy and/or mTLS if configured
 */
// proxyInterceptorId 先占位，稍后的条件分支会根据实际输入补齐它。
let proxyInterceptorId: number | undefined

// configureGlobalAgents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function configureGlobalAgents(): void {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()
  // mtlsAgent读取`getMTLSAgent`，供共享工具后续处理使用。
  const mtlsAgent = getMTLSAgent()

  // Eject previous interceptor to avoid stacking on repeated calls
  // `proxyInterceptorId` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (proxyInterceptorId !== undefined) {
    // 调用 axios.interceptors.request.eject，触发共享工具此处需要的副作用。
    axios.interceptors.request.eject(proxyInterceptorId)
    // proxyInterceptorId更新为 `undefined`，确保共享工具后续读取最新状态。
    proxyInterceptorId = undefined
  }

  // Reset proxy-related defaults so reconfiguration is clean
  // proxy更新为 `undefined`，确保共享工具后续读取最新状态。
  axios.defaults.proxy = undefined
  // httpAgent更新为 `undefined`，确保共享工具后续读取最新状态。
  axios.defaults.httpAgent = undefined
  // httpsAgent更新为 `undefined`，确保共享工具后续读取最新状态。
  axios.defaults.httpsAgent = undefined

  // 满足 `proxyUrl` 时，共享工具执行该分支。
  if (proxyUrl) {
    // workaround for https://github.com/axios/axios/issues/4531
    // proxy更新为 `false`，确保共享工具后续读取最新状态。
    axios.defaults.proxy = false

    // Create proxy agent with mTLS options if available
    // proxyAgent构建`createHttpsProxyAgent`，供共享工具后续处理使用。
    const proxyAgent = createHttpsProxyAgent(proxyUrl)

    // Add axios request interceptor to handle NO_PROXY
    // proxyInterceptorId更新为 `axios.interceptors.request.use(config => {`，确保共享工具后续读取最新状态。
    proxyInterceptorId = axios.interceptors.request.use(config => {
      // Check if URL should bypass proxy based on NO_PROXY
      // 只有 `config.url && shouldBypassProxy(config.url)` 满足时，共享工具才执行该分支。
      if (config.url && shouldBypassProxy(config.url)) {
        // Bypass proxy - use mTLS agent if configured, otherwise undefined
        // 满足 `mtlsAgent` 时，共享工具执行该分支。
        if (mtlsAgent) {
          // httpsAgent更新为 `mtlsAgent`，确保共享工具后续读取最新状态。
          config.httpsAgent = mtlsAgent
          // httpAgent更新为 `mtlsAgent`，确保共享工具后续读取最新状态。
          config.httpAgent = mtlsAgent
        } else {
          // Remove any proxy agents to use direct connection
          // 共享工具 proxy在这里处理 `delete config.httpsAgent`，完成这一小步状态转换。
          delete config.httpsAgent
          // 共享工具 proxy在这里处理 `delete config.httpAgent`，完成这一小步状态转换。
          delete config.httpAgent
        }
      } else {
        // Use proxy agent
        // httpsAgent更新为 `proxyAgent`，确保共享工具后续读取最新状态。
        config.httpsAgent = proxyAgent
        // httpAgent更新为 `proxyAgent`，确保共享工具后续读取最新状态。
        config.httpAgent = proxyAgent
      }
      // 返回 `config`，作为共享工具这次计算的结果。
      return config
    })

    // Set global dispatcher that now respects NO_PROXY via EnvHttpProxyAgent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // 共享工具 proxy在这里处理 `;(require('undici') as typeof undici).setGlobalDispatcher(`，完成这一小步状态转换。
    ;(require('undici') as typeof undici).setGlobalDispatcher(
      getProxyAgent(proxyUrl),
    )
  // 共享工具 proxy在这里处理 `} else if (mtlsAgent) {`，完成这一小步状态转换。
  } else if (mtlsAgent) {
    // No proxy but mTLS is configured
    // httpsAgent更新为 `mtlsAgent`，确保共享工具后续读取最新状态。
    axios.defaults.httpsAgent = mtlsAgent

    // Set undici global dispatcher with mTLS
    // mtlsOptions 集合读取`getTLSFetchOptions`，供共享工具后续处理使用。
    const mtlsOptions = getTLSFetchOptions()
    // 满足 `mtlsOptions.dispatcher` 时，共享工具执行该分支。
    if (mtlsOptions.dispatcher) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // 共享工具 proxy在这里处理 `;(require('undici') as typeof undici).setGlobalDispatcher(`，完成这一小步状态转换。
      ;(require('undici') as typeof undici).setGlobalDispatcher(
        mtlsOptions.dispatcher,
      )
    }
  }
}

/**
 * Get AWS SDK client configuration with proxy support
 * Returns configuration object that can be spread into AWS service client constructors
 */
// getAWSClientProxyConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAWSClientProxyConfig(): Promise<object> {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()

  // proxyUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!proxyUrl) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }

  // 并行获取 { NodeHttpHandler }、{ defaultProvider }，缩短共享工具 proxy等待多个独立异步任务的时间。
  const [{ NodeHttpHandler }, { defaultProvider }] = await Promise.all([
    import('@smithy/node-http-handler'),
    import('@aws-sdk/credential-provider-node'),
  ])

  // agent构建`createHttpsProxyAgent`，供共享工具后续处理使用。
  const agent = createHttpsProxyAgent(proxyUrl)
  // requestHandler 请求数据保存`NodeHttpHandler`，供共享工具后续处理使用。
  const requestHandler = new NodeHttpHandler({
    httpAgent: agent,
    httpsAgent: agent,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    requestHandler,
    credentials: defaultProvider({
      clientConfig: { requestHandler },
    }),
  }
}

/**
 * Clear proxy agent cache.
 */
// clearProxyCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearProxyCache(): void {
  // 调用 getProxyAgent.cache.clear?.()，完成这一处局部操作。
  getProxyAgent.cache.clear?.()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Cleared proxy agent cache')
}
