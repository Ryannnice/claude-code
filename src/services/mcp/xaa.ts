/**
 * Cross-App Access (XAA) / Enterprise Managed Authorization (SEP-990)
 *
 * Obtains an MCP access token WITHOUT a browser consent screen by chaining:
 *   1. RFC 8693 Token Exchange at the IdP: id_token → ID-JAG
 *   2. RFC 7523 JWT Bearer Grant at the AS: ID-JAG → access_token
 *
 * Spec refs:
 *   - ID-JAG (IETF draft): https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/
 *   - MCP ext-auth (SEP-990): https://github.com/modelcontextprotocol/ext-auth
 *   - RFC 8693 (Token Exchange), RFC 7523 (JWT Bearer), RFC 9728 (PRM)
 *
 * Reference impl: ~/code/mcp/conformance/examples/clients/typescript/everything-client.ts:375-522
 *
 * Structure: four Layer-2 ops (aligned with TS SDK PR #1593's Layer-2 shapes so
 * a future SDK swap is mechanical) + one Layer-3 orchestrator that composes them.
 */

// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from '@modelcontextprotocol/sdk/client/auth.js'
// 类型依赖 { FetchLike } 来自 @modelcontextprotocol/sdk/shared/transport.js，用于校准MCP 服务的数据契约。
import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logMCPDebug 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

// XAA_REQUEST_TIMEOUT_MS 请求数据保存`30000`，供后续判断或组装使用。
const XAA_REQUEST_TIMEOUT_MS = 30000

// TOKEN_EXCHANGE_GRANT 命名 `'urn:ietf:params:oauth:grant-type:token-exchange'`，让后续代码直接表达这个值的用途。
const TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange'
// JWT_BEARER_GRANT 命名 `'urn:ietf:params:oauth:grant-type:jwt-bearer'`，让后续代码直接表达这个值的用途。
const JWT_BEARER_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer'
// ID_JAG_TOKEN_TYPE 命名 `'urn:ietf:params:oauth:token-type:id-jag'`，让后续代码直接表达这个值的用途。
const ID_JAG_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:id-jag'
// ID_TOKEN_TYPE 命名 `'urn:ietf:params:oauth:token-type:id_token'`，让后续代码直接表达这个值的用途。
const ID_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:id_token'

/**
 * Creates a fetch wrapper that enforces the XAA request timeout and optionally
 * composes a caller-provided abort signal. Using AbortSignal.any ensures the
 * user's cancel (e.g. Esc in the auth menu) actually aborts in-flight requests
 * rather than being clobbered by the timeout signal.
 */
// makeXaaFetch 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeXaaFetch(abortSignal?: AbortSignal): FetchLike {
  // 返回 `(url, init) => {`，作为MCP 服务这次计算的结果。
  return (url, init) => {
    // timeout保存`AbortSignal.timeout`，供MCP 服务后续处理使用。
    const timeout = AbortSignal.timeout(XAA_REQUEST_TIMEOUT_MS)
    // signal 命名 `abortSignal`，让后续代码直接表达这个值的用途。
    const signal = abortSignal
      ? // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
        AbortSignal.any([timeout, abortSignal])
      : timeout
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    // 返回 `fetch(url, { ...init, signal })`，作为MCP 服务这次计算的结果。
    return fetch(url, { ...init, signal })
  }
}

// defaultFetch构建`makeXaaFetch`，供MCP 服务后续处理使用。
const defaultFetch = makeXaaFetch()

/**
 * RFC 8414 §3.3 / RFC 9728 §3.3 identifier comparison. Roundtrip through URL
 * to apply RFC 3986 §6.2.2 syntax-based normalization (lowercases scheme+host,
 * drops default port), then strip trailing slash.
 */
// normalizeUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeUrl(url: string): string {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `new URL(url).href.replace(/\/$/, '')`，作为MCP 服务这次计算的结果。
    return new URL(url).href.replace(/\/$/, '')
  } catch {
    // 返回 `url.replace(/\/$/, '')`，作为MCP 服务这次计算的结果。
    return url.replace(/\/$/, '')
  }
}

/**
 * Thrown by requestJwtAuthorizationGrant when the IdP token-exchange leg
 * fails. Carries `shouldClearIdToken` so callers can decide whether to drop
 * the cached id_token based on OAuth error semantics (not substring matching):
 *   - 4xx / invalid_grant / invalid_token → id_token is bad, clear it
 *   - 5xx → IdP is down, id_token may still be valid, keep it
 *   - 200 with structurally-invalid body → protocol violation, clear it
 */
// XaaTokenExchangeError 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class XaaTokenExchangeError extends Error {
  readonly shouldClearIdToken: boolean
  // 构造函数接收 message: string, shouldClearIdToken: boolean，把外部输入整理成实例可复用的内部状态。
  constructor(message: string, shouldClearIdToken: boolean) {
    // 调用 super，触发MCP 服务此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'XaaTokenExchangeError'，同步MCP 服务的内部状态。
    this.name = 'XaaTokenExchangeError'
    // 更新实例字段 shouldClearIdToken 为 shouldClearIdToken，同步MCP 服务的内部状态。
    this.shouldClearIdToken = shouldClearIdToken
  }
}

// Matches quoted values for known token-bearing keys regardless of nesting
// depth. Works on both parsed-then-stringified bodies AND raw text() error
// bodies from !res.ok paths — a misbehaving AS that echoes the request's
// subject_token/assertion/client_secret in a 4xx error envelope must not leak
// into debug logs.
// SENSITIVE_TOKEN_RE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SENSITIVE_TOKEN_RE =
  /"(access_token|refresh_token|id_token|assertion|subject_token|client_secret)"\s*:\s*"[^"]*"/g

// redactTokens 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
function redactTokens(raw: unknown): string {
  // s 集合保存`jsonStringify`，供MCP 服务后续处理使用。
  const s = typeof raw === 'string' ? raw : jsonStringify(raw)
  // 返回 s.replace(SENSITIVE_TOKEN_RE, (_, k) => `"${k}":"[REDACTED]"`)，把MCP 服务这个分支的结果交还调用方。
  return s.replace(SENSITIVE_TOKEN_RE, (_, k) => `"${k}":"[REDACTED]"`)
}

// ─── Zod Schemas ────────────────────────────────────────────────────────────

// TokenExchangeResponseSchema保存`lazySchema`，供MCP 服务后续处理使用。
const TokenExchangeResponseSchema = lazySchema(() =>
  z.object({
    access_token: z.string().optional(),
    issued_token_type: z.string().optional(),
    // z.coerce tolerates IdPs that send expires_in as a string (common in
    // PHP-backed IdPs) — technically non-conformant JSON but widespread.
    expires_in: z.coerce.number().optional(),
    scope: z.string().optional(),
  }),
)

// JwtBearerResponseSchema保存`lazySchema`，供MCP 服务后续处理使用。
const JwtBearerResponseSchema = lazySchema(() =>
  z.object({
    access_token: z.string().min(1),
    // Many ASes omit token_type since Bearer is the only value anyone uses
    // (RFC 6750). Don't reject a valid access_token over a missing label.
    token_type: z.string().default('Bearer'),
    expires_in: z.coerce.number().optional(),
    scope: z.string().optional(),
    refresh_token: z.string().optional(),
  }),
)

// ─── Layer 2: Discovery ─────────────────────────────────────────────────────

// ProtectedResourceMetadata 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProtectedResourceMetadata = {
  resource: string
  authorization_servers: string[]
}

/**
 * RFC 9728 PRM discovery via SDK, plus RFC 9728 §3.3 resource-mismatch
 * validation (mix-up protection — TODO: upstream to SDK).
 */
// discoverProtectedResource 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
export async function discoverProtectedResource(
  serverUrl: string,
  opts?: { fetchFn?: FetchLike },
): Promise<ProtectedResourceMetadata> {
  // prm 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let prm
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // prm更新为 `await discoverOAuthProtectedResourceMetadata(`，确保MCP 服务后续读取最新状态。
    prm = await discoverOAuthProtectedResourceMetadata(
      serverUrl,
      undefined,
      opts?.fetchFn ?? defaultFetch,
    )
  } catch (e) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: PRM discovery failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
  // 组合条件 `!prm.resource || !prm.authorization_servers?.[0]` 成立时，MCP 服务才启用这条专门路径。
  if (!prm.resource || !prm.authorization_servers?.[0]) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      'XAA: PRM discovery failed: PRM missing resource or authorization_servers',
    )
  }
  // 判断 normalizeUrl(prm.resource) !== normalizeUrl(serverUrl)，将MCP 服务分流到只适用于该条件的处理路径。
  if (normalizeUrl(prm.resource) !== normalizeUrl(serverUrl)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: PRM discovery failed: PRM resource mismatch: expected ${serverUrl}, got ${prm.resource}`,
    )
  }
  // 返回 {，把MCP 服务这个分支的结果交还调用方。
  return {
    resource: prm.resource,
    authorization_servers: prm.authorization_servers,
  }
}

// AuthorizationServerMetadata 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type AuthorizationServerMetadata = {
  issuer: string
  token_endpoint: string
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
}

/**
 * AS metadata discovery via SDK (RFC 8414 + OIDC fallback), plus RFC 8414
 * §3.3 issuer-mismatch validation (mix-up protection — TODO: upstream to SDK).
 */
// discoverAuthorizationServer 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
export async function discoverAuthorizationServer(
  asUrl: string,
  opts?: { fetchFn?: FetchLike },
): Promise<AuthorizationServerMetadata> {
  // meta保存`discoverAuthorizationServerMetadata`，供MCP 服务后续处理使用。
  const meta = await discoverAuthorizationServerMetadata(asUrl, {
    fetchFn: opts?.fetchFn ?? defaultFetch,
  })
  // 组合条件 `!meta?.issuer || !meta.token_endpoint` 成立时，MCP 服务才启用这条专门路径。
  if (!meta?.issuer || !meta.token_endpoint) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: AS metadata discovery failed: no valid metadata at ${asUrl}`,
    )
  }
  // 判断 normalizeUrl(meta.issuer) !== normalizeUrl(asUrl)，将MCP 服务分流到只适用于该条件的处理路径。
  if (normalizeUrl(meta.issuer) !== normalizeUrl(asUrl)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: AS metadata discovery failed: issuer mismatch: expected ${asUrl}, got ${meta.issuer}`,
    )
  }
  // RFC 8414 §3.3 / RFC 9728 §3 require HTTPS. A PRM-advertised http:// AS
  // that self-consistently reports an http:// issuer would pass the mismatch
  // check above, then we'd POST id_token + client_secret over plaintext.
  // 判断 new URL(meta.token_endpoint).protocol !== 'https:'，将MCP 服务分流到只适用于该条件的处理路径。
  if (new URL(meta.token_endpoint).protocol !== 'https:') {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: refusing non-HTTPS token endpoint: ${meta.token_endpoint}`,
    )
  }
  // 返回 {，把MCP 服务这个分支的结果交还调用方。
  return {
    issuer: meta.issuer,
    token_endpoint: meta.token_endpoint,
    grant_types_supported: meta.grant_types_supported,
    token_endpoint_auth_methods_supported:
      meta.token_endpoint_auth_methods_supported,
  }
}

// ─── Layer 2: Exchange ──────────────────────────────────────────────────────

// JwtAuthGrantResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type JwtAuthGrantResult = {
  /** The ID-JAG (Identity Assertion Authorization Grant) */
  jwtAuthGrant: string
  expiresIn?: number
  scope?: string
}

/**
 * RFC 8693 Token Exchange at the IdP: id_token → ID-JAG.
 * Validates `issued_token_type` is `urn:ietf:params:oauth:token-type:id-jag`.
 *
 * `clientSecret` is optional — sent via `client_secret_post` if present.
 * Some IdPs register the client as confidential even when they advertise
 * `token_endpoint_auth_method: "none"`.
 *
 * TODO(xaa-ga): consult `token_endpoint_auth_methods_supported` from IdP
 * OIDC metadata and support `client_secret_basic`, mirroring the AS-side
 * selection in `performCrossAppAccess`. All major IdPs accept POST today.
 */
// requestJwtAuthorizationGrant 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
export async function requestJwtAuthorizationGrant(opts: {
  tokenEndpoint: string
  audience: string
  resource: string
  idToken: string
  clientId: string
  clientSecret?: string
  scope?: string
  fetchFn?: FetchLike
}): Promise<JwtAuthGrantResult> {
  // fetchFn读取`opts.fetchFn ?? defaultFetch`，供MCP 服务MCP 服务 xaa后续步骤使用。
  const fetchFn = opts.fetchFn ?? defaultFetch
  // params 集合保存`URLSearchParams`，供MCP 服务后续处理使用。
  const params = new URLSearchParams({
    grant_type: TOKEN_EXCHANGE_GRANT,
    requested_token_type: ID_JAG_TOKEN_TYPE,
    audience: opts.audience,
    resource: opts.resource,
    subject_token: opts.idToken,
    subject_token_type: ID_TOKEN_TYPE,
    client_id: opts.clientId,
  })
  // 满足 `opts.clientSecret` 时，MCP 服务执行该分支。
  if (opts.clientSecret) {
    // params.set写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('client_secret', opts.clientSecret)
  }
  // 满足 `opts.scope` 时，MCP 服务执行该分支。
  if (opts.scope) {
    // params.set写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('scope', opts.scope)
  }

  // res 集合读取`fetchFn`，供MCP 服务后续处理使用。
  const res = await fetchFn(opts.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  // res.ok缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!res.ok) {
    // body保存`redactTokens`，供MCP 服务后续处理使用。
    const body = redactTokens(await res.text()).slice(0, 200)
    // 4xx → id_token rejected (invalid_grant etc.), clear cache.
    // 5xx → IdP outage, id_token may still be valid, preserve it.
    // shouldClear记录当前扫描状态，MCP 服务MCP 服务 xaa随后按该状态分支。
    const shouldClear = res.status < 500
    // 抛出 new XaaTokenExchangeError(，阻止MCP 服务在无效状态下继续运行。
    throw new XaaTokenExchangeError(
      `XAA: token exchange failed: HTTP ${res.status}: ${body}`,
      shouldClear,
    )
  }
  // rawExchange先声明占位，稍后的分支会根据实际输入补齐。
  let rawExchange: unknown
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // rawExchange更新为 `await res.json()`，确保MCP 服务后续读取最新状态。
    rawExchange = await res.json()
  } catch {
    // Transient network condition (captive portal, proxy) — don't clear id_token.
    // 抛出 new XaaTokenExchangeError(，阻止MCP 服务在无效状态下继续运行。
    throw new XaaTokenExchangeError(
      `XAA: token exchange returned non-JSON (captive portal?) at ${opts.tokenEndpoint}`,
      false,
    )
  }
  // exchangeParsed保存`TokenExchangeResponseSchema`，供MCP 服务后续处理使用。
  const exchangeParsed = TokenExchangeResponseSchema().safeParse(rawExchange)
  // exchangeParsed.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!exchangeParsed.success) {
    // 抛出 new XaaTokenExchangeError(，阻止MCP 服务在无效状态下继续运行。
    throw new XaaTokenExchangeError(
      `XAA: token exchange response did not match expected shape: ${redactTokens(rawExchange)}`,
      true,
    )
  }
  // 结果保存`exchangeParsed.data`，供MCP 服务MCP 服务 xaa后续步骤使用。
  const result = exchangeParsed.data
  // result.access_token缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!result.access_token) {
    // 抛出 new XaaTokenExchangeError(，阻止MCP 服务在无效状态下继续运行。
    throw new XaaTokenExchangeError(
      `XAA: token exchange response missing access_token: ${redactTokens(result)}`,
      true,
    )
  }
  // `result.issued_token_type` 与 `ID_JAG_TOKEN_TYPE` 不一致时刷新派生状态。
  if (result.issued_token_type !== ID_JAG_TOKEN_TYPE) {
    // 抛出 new XaaTokenExchangeError(，阻止MCP 服务在无效状态下继续运行。
    throw new XaaTokenExchangeError(
      `XAA: token exchange returned unexpected issued_token_type: ${result.issued_token_type}`,
      true,
    )
  }
  // 返回 {，把MCP 服务这个分支的结果交还调用方。
  return {
    jwtAuthGrant: result.access_token,
    expiresIn: result.expires_in,
    scope: result.scope,
  }
}

// XaaTokenResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type XaaTokenResult = {
  access_token: string
  token_type: string
  expires_in?: number
  scope?: string
  refresh_token?: string
}

// XaaResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type XaaResult = XaaTokenResult & {
  /**
   * The AS issuer URL discovered via PRM. Callers must persist this as
   * `discoveryState.authorizationServerUrl` so that refresh (auth.ts _doRefresh)
   * and revocation (revokeServerTokens) can locate the token/revocation
   * endpoints — the MCP URL is not the AS URL in typical XAA setups.
   */
  authorizationServerUrl: string
}

/**
 * RFC 7523 JWT Bearer Grant at the AS: ID-JAG → access_token.
 *
 * `authMethod` defaults to `client_secret_basic` (Base64 header, not body
 * params) — the SEP-990 conformance test requires this. Only set
 * `client_secret_post` if the AS explicitly requires it.
 */
// exchangeJwtAuthGrant 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
export async function exchangeJwtAuthGrant(opts: {
  tokenEndpoint: string
  assertion: string
  clientId: string
  clientSecret: string
  authMethod?: 'client_secret_basic' | 'client_secret_post'
  scope?: string
  fetchFn?: FetchLike
}): Promise<XaaTokenResult> {
  // fetchFn读取`opts.fetchFn ?? defaultFetch`，供MCP 服务MCP 服务 xaa后续步骤使用。
  const fetchFn = opts.fetchFn ?? defaultFetch
  // authMethod保存`opts.authMethod ?? 'client_secret_basic'`，供MCP 服务MCP 服务 xaa后续步骤使用。
  const authMethod = opts.authMethod ?? 'client_secret_basic'

  // params 集合保存`URLSearchParams`，供MCP 服务后续处理使用。
  const params = new URLSearchParams({
    grant_type: JWT_BEARER_GRANT,
    assertion: opts.assertion,
  })
  // 满足 `opts.scope` 时，MCP 服务执行该分支。
  if (opts.scope) {
    // params.set写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('scope', opts.scope)
  }

  // headers 集合集中保存MCP 服务 xaa要一起传递的字段。
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  // `authMethod` 命中特定值 `'client_secret_basic'` 时，进入MCP 服务对应处理。
  if (authMethod === 'client_secret_basic') {
    // basicAuth保存`Buffer.from`，供MCP 服务后续处理使用。
    const basicAuth = Buffer.from(
      `${encodeURIComponent(opts.clientId)}:${encodeURIComponent(opts.clientSecret)}`,
    ).toString('base64')
    // Authorization更新为 ``Basic ${basicAuth}``，确保MCP 服务后续读取最新状态。
    headers.Authorization = `Basic ${basicAuth}`
  } else {
    // params.set写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('client_id', opts.clientId)
    // params.set写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('client_secret', opts.clientSecret)
  }

  // res 集合读取`fetchFn`，供MCP 服务后续处理使用。
  const res = await fetchFn(opts.tokenEndpoint, {
    method: 'POST',
    headers,
    body: params,
  })
  // res.ok缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!res.ok) {
    // body保存`redactTokens`，供MCP 服务后续处理使用。
    const body = redactTokens(await res.text()).slice(0, 200)
    // 抛出 new Error(`XAA: jwt-bearer grant failed: HTTP ${res.status}: ${body}`)，阻止MCP 服务在无效状态下继续运行。
    throw new Error(`XAA: jwt-bearer grant failed: HTTP ${res.status}: ${body}`)
  }
  // rawTokens 集合先声明占位，稍后的分支会根据实际输入补齐。
  let rawTokens: unknown
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // rawTokens 集合更新为 `await res.json()`，确保MCP 服务后续读取最新状态。
    rawTokens = await res.json()
  } catch {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: jwt-bearer grant returned non-JSON (captive portal?) at ${opts.tokenEndpoint}`,
    )
  }
  // tokensParsed保存`JwtBearerResponseSchema`，供MCP 服务后续处理使用。
  const tokensParsed = JwtBearerResponseSchema().safeParse(rawTokens)
  // tokensParsed.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!tokensParsed.success) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: jwt-bearer response did not match expected shape: ${redactTokens(rawTokens)}`,
    )
  }
  // 返回 tokensParsed.data，把MCP 服务这个分支的结果交还调用方。
  return tokensParsed.data
}

// ─── Layer 3: Orchestrator ──────────────────────────────────────────────────

/**
 * Config needed to run the full XAA orchestrator.
 * Mirrors the conformance test context shape (see ClientConformanceContextSchema).
 */
// XaaConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type XaaConfig = {
  /** Client ID registered at the MCP server's authorization server */
  clientId: string
  /** Client secret for the MCP server's authorization server */
  clientSecret: string
  /** Client ID registered at the IdP (for the token-exchange request) */
  idpClientId: string
  /** Optional IdP client secret (client_secret_post) — some IdPs require it */
  idpClientSecret?: string
  /** The user's OIDC id_token from the IdP login */
  idpIdToken: string
  /** IdP token endpoint (where to send the RFC 8693 token-exchange) */
  idpTokenEndpoint: string
}

/**
 * Full XAA flow: PRM → AS metadata → token-exchange → jwt-bearer → access_token.
 * Thin composition of the four Layer-2 ops. Used by performMCPXaaAuth,
 * ClaudeAuthProvider.xaaRefresh, and the try-xaa*.ts debug scripts.
 *
 * @param serverUrl The MCP server URL (e.g. `https://mcp.example.com/mcp`)
 * @param config IdP + AS credentials
 * @param serverName Server name for debug logging
 */
// performCrossAppAccess 承担MCP 服务中的独立步骤，串起MCP 服务 xaa需要的输入整理、状态更新和结果输出。
export async function performCrossAppAccess(
  serverUrl: string,
  config: XaaConfig,
  serverName = 'xaa',
  abortSignal?: AbortSignal,
): Promise<XaaResult> {
  // fetchFn构建`makeXaaFetch`，供MCP 服务后续处理使用。
  const fetchFn = makeXaaFetch(abortSignal)

  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(serverName, `XAA: discovering PRM for ${serverUrl}`)
  // prm保存`discoverProtectedResource`，供MCP 服务后续处理使用。
  const prm = await discoverProtectedResource(serverUrl, { fetchFn })
  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(
    serverName,
    `XAA: discovered resource=${prm.resource} ASes=[${prm.authorization_servers.join(', ')}]`,
  )

  // Try each advertised AS in order. grant_types_supported is OPTIONAL per
  // RFC 8414 §2 — only skip if the AS explicitly advertises a list that omits
  // jwt-bearer. If absent, let the token endpoint decide.
  // asMeta先声明占位，稍后的分支会根据实际输入补齐。
  let asMeta: AuthorizationServerMetadata | undefined
  // asErrors 错误信息从空数组开始收集，后续按处理顺序追加条目。
  const asErrors: string[] = []
  // 遍历 const asUrl of prm.authorization_servers，让MCP 服务逐项完成同一类处理。
  for (const asUrl of prm.authorization_servers) {
    // candidate先声明占位，稍后的分支会根据实际输入补齐。
    let candidate: AuthorizationServerMetadata
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // candidate更新为 `await discoverAuthorizationServer(asUrl, { fetchFn })`，确保MCP 服务后续读取最新状态。
      candidate = await discoverAuthorizationServer(asUrl, { fetchFn })
    } catch (e) {
      // 判断 abortSignal?.aborted，将MCP 服务分流到只适用于该条件的处理路径。
      if (abortSignal?.aborted) throw e
      // asErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
      asErrors.push(`${asUrl}: ${e instanceof Error ? e.message : String(e)}`)
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      candidate.grant_types_supported &&
      !candidate.grant_types_supported.includes(JWT_BEARER_GRANT)
    ) {
      // asErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
      asErrors.push(
        `${asUrl}: does not advertise jwt-bearer grant (supported: ${candidate.grant_types_supported.join(', ')})`,
      )
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // asMeta更新为 `candidate`，确保MCP 服务后续读取最新状态。
    asMeta = candidate
    // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
    break
  }
  // asMeta缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!asMeta) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: no authorization server supports jwt-bearer. Tried: ${asErrors.join('; ')}`,
    )
  }
  // Pick auth method from what the AS advertises. We handle
  // client_secret_basic and client_secret_post; if the AS only supports post,
  // honor that, else default to basic (SEP-990 conformance expectation).
  // authMethods 集合保存`asMeta.token_endpoint_auth_methods_supported`，供MCP 服务MCP 服务 xaa后续步骤使用。
  const authMethods = asMeta.token_endpoint_auth_methods_supported
  // authMethod先声明占位，稍后的分支会根据实际输入补齐。
  const authMethod: 'client_secret_basic' | 'client_secret_post' =
    authMethods &&
    !authMethods.includes('client_secret_basic') &&
    authMethods.includes('client_secret_post')
      ? 'client_secret_post'
      : 'client_secret_basic'
  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(
    serverName,
    `XAA: AS issuer=${asMeta.issuer} token_endpoint=${asMeta.token_endpoint} auth_method=${authMethod}`,
  )

  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(serverName, `XAA: exchanging id_token for ID-JAG at IdP`)
  // jag保存`requestJwtAuthorizationGrant`，供MCP 服务后续处理使用。
  const jag = await requestJwtAuthorizationGrant({
    tokenEndpoint: config.idpTokenEndpoint,
    audience: asMeta.issuer,
    resource: prm.resource,
    idToken: config.idpIdToken,
    clientId: config.idpClientId,
    clientSecret: config.idpClientSecret,
    fetchFn,
  })
  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(serverName, `XAA: ID-JAG obtained`)

  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(serverName, `XAA: exchanging ID-JAG for access_token at AS`)
  // tokens 集合保存`exchangeJwtAuthGrant`，供MCP 服务后续处理使用。
  const tokens = await exchangeJwtAuthGrant({
    tokenEndpoint: asMeta.token_endpoint,
    assertion: jag.jwtAuthGrant,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authMethod,
    fetchFn,
  })
  // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
  logMCPDebug(serverName, `XAA: access_token obtained`)

  // 返回 { ...tokens, authorizationServerUrl: asMeta.issuer }，把MCP 服务这个分支的结果交还调用方。
  return { ...tokens, authorizationServerUrl: asMeta.issuer }
}
