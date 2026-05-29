/**
 * XAA IdP Login — acquires an OIDC id_token from an enterprise IdP via the
 * standard authorization_code + PKCE flow, then caches it by IdP issuer.
 *
 * This is the "one browser pop" in the XAA value prop: one IdP login → N silent
 * MCP server auths. The id_token is cached in the keychain and reused until expiry.
 */

// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  exchangeAuthorization,
  startAuthorization,
} from '@modelcontextprotocol/sdk/client/auth.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type OAuthClientInformation,
  type OpenIdProviderDiscoveryMetadata,
  OpenIdProviderDiscoveryMetadataSchema,
} from '@modelcontextprotocol/sdk/shared/auth.js'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 引入 createServer、Server，将 http 中已经封装好的能力接到本文件流程里。
import { createServer, type Server } from 'http'
// 引入 parse，将 url 中已经封装好的能力接到本文件流程里。
import { parse } from 'url'
// 引入 xss，将 xss 中已经封装好的能力接到本文件流程里。
import xss from 'xss'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 logMCPDebug 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug } from '../../utils/log.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'
// 复用 getSecureStorage 工具函数，把通用处理留在 ../../utils/secureStorage/index.js 中维护。
import { getSecureStorage } from '../../utils/secureStorage/index.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js'
// 引入 buildRedirectUri、findAvailablePort，将 ./oauthPort.js 中已经封装好的能力接到本文件流程里。
import { buildRedirectUri, findAvailablePort } from './oauthPort.js'

// isXaaEnabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isXaaEnabled(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_XAA)`，作为MCP 服务这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_XAA)
}

// XaaIdpSettings 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type XaaIdpSettings = {
  issuer: string
  clientId: string
  callbackPort?: number
}

/**
 * Typed accessor for settings.xaaIdp. The field is env-gated in SettingsSchema
 * so it doesn't surface in SDK types/docs — which means the inferred settings
 * type doesn't have it at compile time. This is the one cast.
 */
// getXaaIdpSettings 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getXaaIdpSettings(): XaaIdpSettings | undefined {
  // 返回 `(getInitialSettings() as { xaaIdp?: XaaIdpSettings }).xaaIdp`，作为MCP 服务这次计算的结果。
  return (getInitialSettings() as { xaaIdp?: XaaIdpSettings }).xaaIdp
}

// IDP_LOGIN_TIMEOUT_MS 集合保存`5 * 60 * 1000`，供MCP 服务MCP 服务 xaa Idp Login后续判断或输出使用。
const IDP_LOGIN_TIMEOUT_MS = 5 * 60 * 1000
// IDP_REQUEST_TIMEOUT_MS 请求数据保存`30000`，供后续判断或组装使用。
const IDP_REQUEST_TIMEOUT_MS = 30000
// ID_TOKEN_EXPIRY_BUFFER_S 集合保存`60`，供后续判断或组装使用。
const ID_TOKEN_EXPIRY_BUFFER_S = 60

// IdpLoginOptions 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type IdpLoginOptions = {
  idpIssuer: string
  idpClientId: string
  /**
   * Optional IdP client secret for confidential clients. Auth method
   * (client_secret_post, client_secret_basic, none) is chosen per IdP
   * metadata. Omit for public clients (PKCE only).
   */
  idpClientSecret?: string
  /**
   * Fixed callback port. If omitted, a random port is chosen.
   * Use this when the IdP client is pre-registered with a specific loopback
   * redirect URI (RFC 8252 §7.3 says IdPs SHOULD accept any port for
   * http://localhost, but many don't).
   */
  callbackPort?: number
  /** Called with the authorization URL before (or instead of) opening the browser */
  // 这个回调绑定到 onAuthorizationUrl?: (url: string) => void，负责MCP 服务在该局部场景下的响应。
  onAuthorizationUrl?: (url: string) => void
  /** If true, don't auto-open the browser — just call onAuthorizationUrl */
  skipBrowserOpen?: boolean
  abortSignal?: AbortSignal
}

/**
 * Normalize an IdP issuer URL for use as a cache key: strip trailing slashes,
 * lowercase host. Issuers from config and from OIDC discovery may differ
 * cosmetically but should hit the same cache slot. Exported so the setup
 * command can compare issuers using the same normalization as keychain ops.
 */
// issuerKey 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function issuerKey(issuer: string): string {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // u保存`URL`，供MCP 服务后续处理使用。
    const u = new URL(issuer)
    // pathname 路径数据更新为 `u.pathname.replace(/\/+$/, '')`，确保MCP 服务后续读取最新状态。
    u.pathname = u.pathname.replace(/\/+$/, '')
    // host更新为 `u.host.toLowerCase()`，确保MCP 服务后续读取最新状态。
    u.host = u.host.toLowerCase()
    // 返回 `u.toString()`，作为MCP 服务这次计算的结果。
    return u.toString()
  } catch {
    // 返回 `issuer.replace(/\/+$/, '')`，作为MCP 服务这次计算的结果。
    return issuer.replace(/\/+$/, '')
  }
}

/**
 * Read a cached id_token for the given IdP issuer from secure storage.
 * Returns undefined if missing or within ID_TOKEN_EXPIRY_BUFFER_S of expiring.
 */
// getCachedIdpIdToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedIdpIdToken(idpIssuer: string): string | undefined {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // data读取`storage.read`，供MCP 服务后续处理使用。
  const data = storage.read()
  // entry保存`issuerKey`，供MCP 服务后续处理使用。
  const entry = data?.mcpXaaIdp?.[issuerKey(idpIssuer)]
  // entry缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!entry) return undefined
  // remainingMs 集合记录时间`Date.now`，供MCP 服务后续处理使用。
  const remainingMs = entry.expiresAt - Date.now()
  // 满足 `remainingMs <= ID_TOKEN_EXPIRY_BUFFER_S * 1000` 时，MCP 服务执行该分支。
  if (remainingMs <= ID_TOKEN_EXPIRY_BUFFER_S * 1000) return undefined
  // 返回 `entry.idToken`，作为MCP 服务这次计算的结果。
  return entry.idToken
}

// saveIdpIdToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function saveIdpIdToken(
  idpIssuer: string,
  idToken: string,
  expiresAt: number,
): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existing读取`storage.read`，供MCP 服务后续处理使用。
  const existing = storage.read() || {}
  // 调用 storage.update，触发MCP 服务此处需要的副作用。
  storage.update({
    ...existing,
    mcpXaaIdp: {
      ...existing.mcpXaaIdp,
      [issuerKey(idpIssuer)]: { idToken, expiresAt },
    },
  })
}

/**
 * Save an externally-obtained id_token into the XAA cache — the exact slot
 * getCachedIdpIdToken/acquireIdpIdToken read from. Used by conformance testing
 * where the mock IdP hands us a pre-signed token but doesn't serve /authorize.
 *
 * Parses the JWT's exp claim for cache TTL (same as acquireIdpIdToken).
 * Returns the expiresAt it computed so the caller can report it.
 */
// saveIdpIdTokenFromJwt 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveIdpIdTokenFromJwt(
  idpIssuer: string,
  idToken: string,
): number {
  // expFromJwt保存`jwtExp`，供MCP 服务后续处理使用。
  const expFromJwt = jwtExp(idToken)
  // expiresAt记录时间`Date.now`，供MCP 服务后续处理使用。
  const expiresAt = expFromJwt ? expFromJwt * 1000 : Date.now() + 3600 * 1000
  // 调用 saveIdpIdToken，触发MCP 服务此处需要的副作用。
  saveIdpIdToken(idpIssuer, idToken, expiresAt)
  // 返回 `expiresAt`，作为MCP 服务这次计算的结果。
  return expiresAt
}

// clearIdpIdToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearIdpIdToken(idpIssuer: string): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existing读取`storage.read`，供MCP 服务后续处理使用。
  const existing = storage.read()
  // 按键保存`issuerKey`，供MCP 服务后续处理使用。
  const key = issuerKey(idpIssuer)
  // 满足 `!existing?.mcpXaaIdp?.[key]` 时，MCP 服务执行该分支。
  if (!existing?.mcpXaaIdp?.[key]) return
  // MCP 服务 xaa Idp Login在这里处理 `delete existing.mcpXaaIdp[key]`，完成这一小步状态转换。
  delete existing.mcpXaaIdp[key]
  // 调用 storage.update，触发MCP 服务此处需要的副作用。
  storage.update(existing)
}

/**
 * Save an IdP client secret to secure storage, keyed by IdP issuer.
 * Separate from MCP server AS secrets — different trust domain.
 * Returns the storage update result so callers can surface keychain
 * failures (locked keychain, `security` nonzero exit) instead of
 * silently dropping the secret and failing later with invalid_client.
 */
// saveIdpClientSecret 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveIdpClientSecret(
  idpIssuer: string,
  clientSecret: string,
): { success: boolean; warning?: string } {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existing读取`storage.read`，供MCP 服务后续处理使用。
  const existing = storage.read() || {}
  // 返回 `storage.update({`，作为MCP 服务这次计算的结果。
  return storage.update({
    ...existing,
    mcpXaaIdpConfig: {
      ...existing.mcpXaaIdpConfig,
      [issuerKey(idpIssuer)]: { clientSecret },
    },
  })
}

/**
 * Read the IdP client secret for the given issuer from secure storage.
 */
// getIdpClientSecret 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIdpClientSecret(idpIssuer: string): string | undefined {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // data读取`storage.read`，供MCP 服务后续处理使用。
  const data = storage.read()
  // 返回 `data?.mcpXaaIdpConfig?.[issuerKey(idpIssuer)]?.clientSecret`，作为MCP 服务这次计算的结果。
  return data?.mcpXaaIdpConfig?.[issuerKey(idpIssuer)]?.clientSecret
}

/**
 * Remove the IdP client secret for the given issuer from secure storage.
 * Used by `claude mcp xaa clear`.
 */
// clearIdpClientSecret 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearIdpClientSecret(idpIssuer: string): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existing读取`storage.read`，供MCP 服务后续处理使用。
  const existing = storage.read()
  // 按键保存`issuerKey`，供MCP 服务后续处理使用。
  const key = issuerKey(idpIssuer)
  // 满足 `!existing?.mcpXaaIdpConfig?.[key]` 时，MCP 服务执行该分支。
  if (!existing?.mcpXaaIdpConfig?.[key]) return
  // MCP 服务 xaa Idp Login在这里处理 `delete existing.mcpXaaIdpConfig[key]`，完成这一小步状态转换。
  delete existing.mcpXaaIdpConfig[key]
  // 调用 storage.update，触发MCP 服务此处需要的副作用。
  storage.update(existing)
}

// OIDC Discovery §4.1 says `{issuer}/.well-known/openid-configuration` — path
// APPEND, not replace. `new URL('/.well-known/...', issuer)` with a leading
// slash is a WHATWG absolute-path reference and drops the issuer's pathname,
// breaking Azure AD (`login.microsoftonline.com/{tenant}/v2.0`), Okta custom
// auth servers, and Keycloak realms. Trailing-slash base + relative path is
// the fix. Exported because auth.ts needs the same discovery.
// discoverOidc 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function discoverOidc(
  idpIssuer: string,
): Promise<OpenIdProviderDiscoveryMetadata> {
  // base保存`idpIssuer.endsWith`，供MCP 服务后续处理使用。
  const base = idpIssuer.endsWith('/') ? idpIssuer : idpIssuer + '/'
  // URL保存`URL`，供MCP 服务后续处理使用。
  const url = new URL('.well-known/openid-configuration', base)
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // res 集合读取`fetch`，供MCP 服务后续处理使用。
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(IDP_REQUEST_TIMEOUT_MS),
  })
  // res.ok缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!res.ok) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA IdP: OIDC discovery failed: HTTP ${res.status} at ${url}`,
    )
  }
  // Captive portals and proxy auth pages return 200 with HTML. res.json()
  // throws a raw SyntaxError before safeParse can give a useful message.
  // 请求体 先占位，稍后的条件分支会根据实际输入补齐它。
  let body: unknown
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 请求体更新为 `await res.json()`，确保MCP 服务后续读取最新状态。
    body = await res.json()
  } catch {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA IdP: OIDC discovery returned non-JSON at ${url} (captive portal or proxy?)`,
    )
  }
  // 解析结果保存`OpenIdProviderDiscoveryMetadataSchema.safeParse`，供MCP 服务后续处理使用。
  const parsed = OpenIdProviderDiscoveryMetadataSchema.safeParse(body)
  // parsed.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!parsed.success) {
    // 抛出 new Error(`XAA IdP: invalid OIDC metadata: ${parsed.error.message}`)，阻止MCP 服务在无效状态下继续运行。
    throw new Error(`XAA IdP: invalid OIDC metadata: ${parsed.error.message}`)
  }
  // `new URL(parsed.data.token_endpoint).protocol` 与 `'https:'` 不一致时刷新派生状态，避免使用过期结果。
  if (new URL(parsed.data.token_endpoint).protocol !== 'https:') {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA IdP: refusing non-HTTPS token endpoint: ${parsed.data.token_endpoint}`,
    )
  }
  // 返回 `parsed.data`，作为MCP 服务这次计算的结果。
  return parsed.data
}

/**
 * Decode the exp claim from a JWT without verifying its signature.
 * Returns undefined if parsing fails or exp is absent. Used only to
 * derive a cache TTL.
 *
 * Why no signature/iss/aud/nonce validation: per SEP-990, this id_token
 * is the RFC 8693 subject_token in a token-exchange at the IdP's own
 * token endpoint. The IdP validates its own token there. An attacker who
 * can mint a token that fools the IdP has no need to fool us first; an
 * attacker who can't, hands us garbage and gets a 401 from the IdP. The
 * --id-token injection seam is likewise safe: bad input → rejected later,
 * no privesc. Client-side verification would add code and no security.
 */
// jwtExp 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function jwtExp(jwt: string): number | undefined {
  // 片段列表格式化`jwt.split`，供MCP 服务后续处理使用。
  const parts = jwt.split('.')
  // `parts.length` 与 `3` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 3) return undefined
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // payload解析`jsonParse`，供MCP 服务后续处理使用。
    const payload = jsonParse(
      Buffer.from(parts[1]!, 'base64url').toString('utf-8'),
    ) as { exp?: number }
    // 返回 `typeof payload.exp === 'number' ? payload.exp : undefined`，作为MCP 服务这次计算的结果。
    return typeof payload.exp === 'number' ? payload.exp : undefined
  } catch {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
}

/**
 * Wait for the OAuth authorization code on a local callback server.
 * Returns the code once /callback is hit with a matching state.
 *
 * `onListening` fires after the socket is actually bound — use it to defer
 * browser-open so EADDRINUSE surfaces before a spurious tab pops open.
 */
// waitForCallback 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function waitForCallback(
  port: number,
  expectedState: string,
  abortSignal: AbortSignal | undefined,
  // 这个回调绑定到 onListening: () => void,，负责MCP 服务在该局部场景下的响应。
  onListening: () => void,
): Promise<string> {
  // server初始化为空值，后续分支会在有数据时补齐。
  let server: Server | null = null
  // timeoutId保存`null`，作为后续空值处理的输入。
  let timeoutId: NodeJS.Timeout | null = null
  // 这个回调绑定到 let abortHandler: (() => void) | null = null，负责MCP 服务在该局部场景下的响应。
  let abortHandler: (() => void) | null = null
  // cleanup封装成回调，供MCP 服务MCP 服务 xaa Idp Login在事件触发或异步步骤中调用。
  const cleanup = () => {
    // 调用 server?.removeAllListeners()，完成这一处局部操作。
    server?.removeAllListeners()
    // Defensive: removeAllListeners() strips the error handler, so swallow any late error during close
    // 这个回调绑定到 server?.on('error', () => {})，负责MCP 服务在该局部场景下的响应。
    server?.on('error', () => {})
    // 调用 server?.close()，完成这一处局部操作。
    server?.close()
    // server更新为 `null`，确保MCP 服务后续读取最新状态。
    server = null
    // 满足 `timeoutId` 时，MCP 服务执行该分支。
    if (timeoutId) {
      // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
      clearTimeout(timeoutId)
      // timeoutId更新为 `null`，确保MCP 服务后续读取最新状态。
      timeoutId = null
    }
    // 组合条件 `abortSignal && abortHandler` 成立时，MCP 服务才启用这条专门路径。
    if (abortSignal && abortHandler) {
      // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
      abortSignal.removeEventListener('abort', abortHandler)
      // abortHandler更新为 `null`，确保MCP 服务后续读取最新状态。
      abortHandler = null
    }
  }
  // 返回 `new Promise<string>((resolve, reject) => {`，作为MCP 服务这次计算的结果。
  return new Promise<string>((resolve, reject) => {
    // resolved标记MCP 服务MCP 服务 xaa Idp Login是否启用对应路径。
    let resolved = false
    // resolveOnce封装成回调，供MCP 服务MCP 服务 xaa Idp Login在事件触发或异步步骤中调用。
    const resolveOnce = (v: string) => {
      // 满足 `resolved` 时，MCP 服务执行该分支。
      if (resolved) return
      // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
      resolved = true
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve(v)
    }
    // rejectOnce封装成回调，供MCP 服务MCP 服务 xaa Idp Login在事件触发或异步步骤中调用。
    const rejectOnce = (e: Error) => {
      // 满足 `resolved` 时，MCP 服务执行该分支。
      if (resolved) return
      // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
      resolved = true
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      reject(e)
    }

    // 满足 `abortSignal` 时，MCP 服务执行该分支。
    if (abortSignal) {
      // abortHandler更新为 `() => rejectOnce(new Error('XAA IdP: login cancelled'))`，确保MCP 服务后续读取最新状态。
      abortHandler = () => rejectOnce(new Error('XAA IdP: login cancelled'))
      // 满足 `abortSignal.aborted` 时，MCP 服务执行该分支。
      if (abortSignal.aborted) {
        // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
        abortHandler()
        // MCP 服务 xaa Idp Login在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
      abortSignal.addEventListener('abort', abortHandler, { once: true })
    }

    // server更新为 `createServer((req, res) => {`，确保MCP 服务后续读取最新状态。
    server = createServer((req, res) => {
      // 解析结果解析`parse`，供MCP 服务后续处理使用。
      const parsed = parse(req.url || '', true)
      // `parsed.pathname` 与 `'/callback'` 不一致时刷新派生状态，避免使用过期结果。
      if (parsed.pathname !== '/callback') {
        // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
        res.writeHead(404)
        // 调用 res.end，触发MCP 服务此处需要的副作用。
        res.end()
        // MCP 服务 xaa Idp Login在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // code 命名 `parsed.query.code as string | undefined`，让后续代码直接表达这个值的用途。
      const code = parsed.query.code as string | undefined
      // 状态解析`parsed.query.state as string | undefined` 整理出中间结果，供MCP 服务MCP 服务 xaa Idp Login后续步骤使用。
      const state = parsed.query.state as string | undefined
      // err 命名 `parsed.query.error as string | undefined`，让后续代码直接表达这个值的用途。
      const err = parsed.query.error as string | undefined

      // 满足 `err` 时，MCP 服务执行该分支。
      if (err) {
        // desc解析`parsed.query.error_description as string | undefined`，供后续判断或组装使用。
        const desc = parsed.query.error_description as string | undefined
        // safeErr保存`xss`，供MCP 服务后续处理使用。
        const safeErr = xss(err)
        // safeDesc保存`xss`，供MCP 服务后续处理使用。
        const safeDesc = desc ? xss(desc) : ''
        // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
        res.writeHead(400, { 'Content-Type': 'text/html' })
        // 调用 res.end，触发MCP 服务此处需要的副作用。
        res.end(
          `<html><body><h3>IdP login failed</h3><p>${safeErr}</p><p>${safeDesc}</p></body></html>`,
        )
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(new Error(`XAA IdP: ${err}${desc ? ` — ${desc}` : ''}`))
        // MCP 服务 xaa Idp Login在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // `state` 与 `expectedState` 不一致时刷新派生状态，避免使用过期结果。
      if (state !== expectedState) {
        // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
        res.writeHead(400, { 'Content-Type': 'text/html' })
        // 调用 res.end，触发MCP 服务此处需要的副作用。
        res.end('<html><body><h3>State mismatch</h3></body></html>')
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(new Error('XAA IdP: state mismatch (possible CSRF)'))
        // MCP 服务 xaa Idp Login在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // code缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!code) {
        // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
        res.writeHead(400, { 'Content-Type': 'text/html' })
        // 调用 res.end，触发MCP 服务此处需要的副作用。
        res.end('<html><body><h3>Missing code</h3></body></html>')
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(new Error('XAA IdP: callback missing code'))
        // MCP 服务 xaa Idp Login在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
      res.writeHead(200, { 'Content-Type': 'text/html' })
      // 调用 res.end，触发MCP 服务此处需要的副作用。
      res.end(
        '<html><body><h3>IdP login complete — you can close this window.</h3></body></html>',
      )
      // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolveOnce(code)
    })

    // 调用 server.on，触发MCP 服务此处需要的副作用。
    server.on('error', (err: NodeJS.ErrnoException) => {
      // 当 `err.code` 匹配 `'EADDRINUSE'` 时，MCP 服务执行对应分支。
      if (err.code === 'EADDRINUSE') {
        // findCmd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const findCmd =
          getPlatform() === 'windows'
            ? `netstat -ano | findstr :${port}`
            : `lsof -ti:${port} -sTCP:LISTEN`
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(
          new Error(
            `XAA IdP: callback port ${port} is already in use. Run \`${findCmd}\` to find the holder.`,
          ),
        )
      } else {
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(new Error(`XAA IdP: callback server failed: ${err.message}`))
      }
    })

    // 调用 server.listen，触发MCP 服务此处需要的副作用。
    server.listen(port, '127.0.0.1', () => {
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // 调用 onListening，触发MCP 服务此处需要的副作用。
        onListening()
      } catch (e) {
        // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        rejectOnce(toError(e))
      }
    })
    // 调用 server.unref，触发MCP 服务此处需要的副作用。
    server.unref()
    // timeoutId更新为 `setTimeout(`，确保MCP 服务后续读取最新状态。
    timeoutId = setTimeout(
      // rej更新为 `> rej(new Error('XAA IdP: login timed out'))`，确保MCP 服务后续读取最新状态。
      rej => rej(new Error('XAA IdP: login timed out')),
      IDP_LOGIN_TIMEOUT_MS,
      rejectOnce,
    )
    // 调用 timeoutId.unref，触发MCP 服务此处需要的副作用。
    timeoutId.unref()
  })
}

/**
 * Acquire an id_token from the IdP: return cached if valid, otherwise run
 * the full OIDC authorization_code + PKCE flow (one browser pop).
 */
// acquireIdpIdToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function acquireIdpIdToken(
  opts: IdpLoginOptions,
): Promise<string> {
  // 从 `opts` 解构 idpIssuer、idpClientId，减少MCP 服务 xaa Idp Login对同一对象的重复访问。
  const { idpIssuer, idpClientId } = opts

  // cached 缓存读取`getCachedIdpIdToken`，供MCP 服务后续处理使用。
  const cached = getCachedIdpIdToken(idpIssuer)
  // 满足 `cached` 时，MCP 服务执行该分支。
  if (cached) {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug('xaa', `Using cached id_token for ${idpIssuer}`)
    // 返回 `cached`，作为MCP 服务这次计算的结果。
    return cached
  }

  // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
  logMCPDebug('xaa', `No cached id_token for ${idpIssuer}; starting OIDC login`)

  // metadata保存`discoverOidc`，供MCP 服务后续处理使用。
  const metadata = await discoverOidc(idpIssuer)
  // port筛选`findAvailablePort`，供MCP 服务后续处理使用。
  const port = opts.callbackPort ?? (await findAvailablePort())
  // redirectUri构建`buildRedirectUri`，供MCP 服务后续处理使用。
  const redirectUri = buildRedirectUri(port)
  // 状态保存`randomBytes`，供MCP 服务后续处理使用。
  const state = randomBytes(32).toString('base64url')
  // clientInformation 集中保存MCP 服务 xaa Idp Login要一起传递的字段。
  const clientInformation: OAuthClientInformation = {
    client_id: idpClientId,
    ...(opts.idpClientSecret ? { client_secret: opts.idpClientSecret } : {}),
  }

  // 从 `await startAuthorization(` 解构 authorizationUrl、codeVerifier，减少MCP 服务 xaa Idp Login对同一对象的重复访问。
  const { authorizationUrl, codeVerifier } = await startAuthorization(
    idpIssuer,
    {
      metadata,
      clientInformation,
      redirectUrl: redirectUri,
      scope: 'openid',
      state,
    },
  )

  // Open the browser only after the socket is actually bound — listen() is
  // async, and on the fixed-callbackPort path EADDRINUSE otherwise surfaces
  // after a spurious tab has already popped. Mirrors the auth.ts pattern of
  // wrapping sdkAuth inside server.listen's callback.
  // authorizationCode保存`waitForCallback`，供MCP 服务后续处理使用。
  const authorizationCode = await waitForCallback(
    port,
    state,
    opts.abortSignal,
    // 这个回调绑定到 () => {，负责MCP 服务在该局部场景下的响应。
    () => {
      // 满足 `opts.onAuthorizationUrl` 时，MCP 服务执行该分支。
      if (opts.onAuthorizationUrl) {
        // 调用 opts.onAuthorizationUrl，触发MCP 服务此处需要的副作用。
        opts.onAuthorizationUrl(authorizationUrl.toString())
      }
      // opts.skipBrowserOpen缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!opts.skipBrowserOpen) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug('xaa', `Opening browser to IdP authorization endpoint`)
        // 显式忽略 `openBrowser(authorizationUrl.toString())` 的返回值，只保留它触发的副作用。
        void openBrowser(authorizationUrl.toString())
      }
    },
  )

  // token 列表保存`exchangeAuthorization`，供MCP 服务后续处理使用。
  const tokens = await exchangeAuthorization(idpIssuer, {
    metadata,
    clientInformation,
    authorizationCode,
    codeVerifier,
    redirectUri,
    // 这个回调绑定到 fetchFn: (url, init) =>，负责MCP 服务在该局部场景下的响应。
    fetchFn: (url, init) =>
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      fetch(url, {
        ...init,
        signal: AbortSignal.timeout(IDP_REQUEST_TIMEOUT_MS),
      }),
  })
  // tokens.id_token缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!tokens.id_token) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      'XAA IdP: token response missing id_token (check scope=openid)',
    )
  }

  // Prefer the id_token's own exp claim; fall back to expires_in.
  // expires_in is for the access_token and may differ from the id_token
  // lifetime. If neither is present, default to 1h.
  // expFromJwt保存`jwtExp`，供MCP 服务后续处理使用。
  const expFromJwt = jwtExp(tokens.id_token)
  // expiresAt 命名 `expFromJwt`，让后续代码直接表达这个值的用途。
  const expiresAt = expFromJwt
    ? expFromJwt * 1000
    : Date.now() + (tokens.expires_in ?? 3600) * 1000

  // 调用 saveIdpIdToken，触发MCP 服务此处需要的副作用。
  saveIdpIdToken(idpIssuer, tokens.id_token, expiresAt)
  // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
  logMCPDebug(
    'xaa',
    `Cached id_token for ${idpIssuer} (expires ${new Date(expiresAt).toISOString()})`,
  )

  // 返回 `tokens.id_token`，作为MCP 服务这次计算的结果。
  return tokens.id_token
}
