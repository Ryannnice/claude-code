// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'

// 引入 debugBody、extractErrorDetail，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { debugBody, extractErrorDetail } from './debugUtils.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  BRIDGE_LOGIN_INSTRUCTION,
  type BridgeApiClient,
  type BridgeConfig,
  type PermissionResponseEvent,
  type WorkResponse,
} from './types.js'

// BridgeApiDeps 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type BridgeApiDeps = {
  baseUrl: string
  // 这个回调绑定到 getAccessToken: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAccessToken: () => string | undefined
  runnerVersion: string
  onDebug?: (msg: string) => void
  /**
   * Called on 401 to attempt OAuth token refresh. Returns true if refreshed,
   * in which case the request is retried once. Injected because
   * handleOAuth401Error from utils/auth.ts transitively pulls in config.ts →
   * file.ts → permissions/filesystem.ts → sessionStorage.ts → commands.ts
   * (~1300 modules). Daemon callers using env-var tokens omit this — their
   * tokens don't refresh, so 401 goes straight to BridgeFatalError.
   */
  // 这个回调绑定到 onAuth401?: (staleAccessToken: string) => Promise<boolean>，负责远程桥接会话在该局部场景下的响应。
  onAuth401?: (staleAccessToken: string) => Promise<boolean>
  /**
   * Returns the trusted device token to send as X-Trusted-Device-Token on
   * bridge API calls. Bridge sessions have SecurityTier=ELEVATED on the
   * server (CCR v2); when the server's enforcement flag is on,
   * ConnectBridgeWorker requires a trusted device at JWT-issuance.
   * Optional — when absent or returning undefined, the header is omitted
   * and the server falls through to its flag-off/no-op path. The CLI-side
   * gate is tengu_sessions_elevated_auth_enforcement (see trustedDevice.ts).
   */
  // 这个回调绑定到 getTrustedDeviceToken?: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getTrustedDeviceToken?: () => string | undefined
}

// BETA_HEADER 命名 `'environments-2025-11-01'`，让后续代码直接表达这个值的用途。
const BETA_HEADER = 'environments-2025-11-01'

/** Allowlist pattern for server-provided IDs used in URL path segments. */
// SAFE_ID_PATTERN 命名 `/^[a-zA-Z0-9_-]+$/`，让后续代码直接表达这个值的用途。
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * Validate that a server-provided ID is safe to interpolate into a URL path.
 * Prevents path traversal (e.g. `../../admin`) and injection via IDs that
 * contain slashes, dots, or other special characters.
 */
// validateBridgeId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateBridgeId(id: string, label: string): string {
  // 组合条件 `!id || !SAFE_ID_PATTERN.test(id)` 成立时，远程桥接会话才启用这条专门路径。
  if (!id || !SAFE_ID_PATTERN.test(id)) {
    // 抛出 new Error(`Invalid ${label}: contains unsafe characters`)，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(`Invalid ${label}: contains unsafe characters`)
  }
  // 返回 `id`，作为远程桥接会话这次计算的结果。
  return id
}

/** Fatal bridge errors that should not be retried (e.g. auth failures). */
// BridgeFatalError 聚合远程桥接会话相关状态与操作，把同一职责的行为收束到类实例中。
export class BridgeFatalError extends Error {
  readonly status: number
  /** Server-provided error type, e.g. "environment_expired". */
  readonly errorType: string | undefined
  // 构造函数接收 message: string, status: number, errorType?: stri…，把外部输入整理成实例可复用的内部状态。
  constructor(message: string, status: number, errorType?: string) {
    // 调用 super，触发远程桥接会话此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'BridgeFatalError'，同步远程桥接会话的内部状态。
    this.name = 'BridgeFatalError'
    // 更新实例字段 status 为 status，同步远程桥接会话的内部状态。
    this.status = status
    // 更新实例字段 errorType 为 errorType，同步远程桥接会话的内部状态。
    this.errorType = errorType
  }
}

// createBridgeApiClient 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createBridgeApiClient(deps: BridgeApiDeps): BridgeApiClient {
  // debug 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function debug(msg: string): void {
    // 调用 deps.onDebug?.(msg)，完成这一处局部操作。
    deps.onDebug?.(msg)
  }

  // consecutiveEmptyPolls 集合保存`0`，供远程桥接会话远程桥接 bridge Api后续判断或输出使用。
  let consecutiveEmptyPolls = 0
  // EMPTY_POLL_LOG_INTERVAL 命名 `100`，让后续代码直接表达这个值的用途。
  const EMPTY_POLL_LOG_INTERVAL = 100

  // getHeaders 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getHeaders(accessToken: string): Record<string, string> {
    // 请求头 集中保存远程桥接 bridge Api要一起传递的字段。
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': BETA_HEADER,
      'x-environment-runner-version': deps.runnerVersion,
    }
    // deviceToken读取`deps.getTrustedDeviceToken?.()`，供后续判断或组装使用。
    const deviceToken = deps.getTrustedDeviceToken?.()
    // 满足 `deviceToken` 时，远程桥接会话执行该分支。
    if (deviceToken) {
      // headers['X-Trusted-Device-Token'更新为 `deviceToken`，确保远程桥接 bridge Api后续读取最新状态。
      headers['X-Trusted-Device-Token'] = deviceToken
    }
    // 返回 `headers`，作为远程桥接会话这次计算的结果。
    return headers
  }

  // resolveAuth 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function resolveAuth(): string {
    // accessToken读取`deps.getAccessToken`，供远程桥接会话后续处理使用。
    const accessToken = deps.getAccessToken()
    // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!accessToken) {
      // 抛出 new Error(BRIDGE_LOGIN_INSTRUCTION)，阻止远程桥接会话在无效状态下继续运行。
      throw new Error(BRIDGE_LOGIN_INSTRUCTION)
    }
    // 返回 `accessToken`，作为远程桥接会话这次计算的结果。
    return accessToken
  }

  /**
   * Execute an OAuth-authenticated request with a single retry on 401.
   * On 401, attempts token refresh via handleOAuth401Error (same pattern as
   * withRetry.ts for v1/messages). If refresh succeeds, retries the request
   * once with the new token. If refresh fails or the retry also returns 401,
   * the 401 response is returned for handleErrorStatus to throw BridgeFatalError.
   */
  // withOAuthRetry 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function withOAuthRetry<T>(
    // 这个回调绑定到 fn: (accessToken: string) => Promise<{ status: number; data: T }>,，负责远程桥接会话在该局部场景下的响应。
    fn: (accessToken: string) => Promise<{ status: number; data: T }>,
    context: string,
  ): Promise<{ status: number; data: T }> {
    // accessToken读取`resolveAuth`，供远程桥接会话后续处理使用。
    const accessToken = resolveAuth()
    // 接口响应保存`fn`，供远程桥接会话后续处理使用。
    const response = await fn(accessToken)

    // `response.status` 与 `401` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 401) {
      // 返回 `response`，作为远程桥接会话这次计算的结果。
      return response
    }

    // deps.onAuth401缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!deps.onAuth401) {
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] ${context}: 401 received, no refresh handler`)
      // 返回 `response`，作为远程桥接会话这次计算的结果。
      return response
    }

    // Attempt token refresh — matches the pattern in withRetry.ts
    // 调用 debug，触发远程桥接会话此处需要的副作用。
    debug(`[bridge:api] ${context}: 401 received, attempting token refresh`)
    // refreshed保存`deps.onAuth401`，供远程桥接会话后续处理使用。
    const refreshed = await deps.onAuth401(accessToken)
    // 满足 `refreshed` 时，远程桥接会话执行该分支。
    if (refreshed) {
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] ${context}: Token refreshed, retrying request`)
      // newToken读取`resolveAuth`，供远程桥接会话后续处理使用。
      const newToken = resolveAuth()
      // retryResponse 响应数据保存`fn`，供远程桥接会话后续处理使用。
      const retryResponse = await fn(newToken)
      // `retryResponse.status` 与 `401` 不一致时刷新派生状态，避免使用过期结果。
      if (retryResponse.status !== 401) {
        // 返回 `retryResponse`，作为远程桥接会话这次计算的结果。
        return retryResponse
      }
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] ${context}: Retry after refresh also got 401`)
    } else {
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] ${context}: Token refresh failed`)
    }

    // Refresh failed — return 401 for handleErrorStatus to throw
    // 返回 `response`，作为远程桥接会话这次计算的结果。
    return response
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // 远程桥接 bridge Api在这里处理 `async registerBridgeEnvironment(`，完成这一小步状态转换。
    async registerBridgeEnvironment(
      config: BridgeConfig,
    ): Promise<{ environment_id: string; environment_secret: string }> {
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/environments/bridge bridgeId=${config.bridgeId}`,
      )

      // 接口响应保存`withOAuthRetry`，供远程桥接会话后续处理使用。
      const response = await withOAuthRetry(
        // 这个回调绑定到 (token: string) =>，负责远程桥接会话在该局部场景下的响应。
        (token: string) =>
          axios.post<{
            environment_id: string
            environment_secret: string
          }>(
            `${deps.baseUrl}/v1/environments/bridge`,
            {
              machine_name: config.machineName,
              directory: config.dir,
              branch: config.branch,
              git_repo_url: config.gitRepoUrl,
              // Advertise session capacity so claude.ai/code can show
              // "2/4 sessions" badges and only block the picker when
              // actually at capacity. Backends that don't yet accept
              // this field will silently ignore it.
              max_sessions: config.maxSessions,
              // worker_type lets claude.ai filter environments by origin
              // (e.g. assistant picker only shows assistant-mode workers).
              // Desktop cowork app sends "cowork"; we send a distinct value.
              metadata: { worker_type: config.workerType },
              // Idempotent re-registration: if we have a backend-issued
              // environment_id from a prior session (--session-id resume),
              // send it back so the backend reattaches instead of creating
              // a new env. The backend may still hand back a fresh ID if
              // the old one expired — callers must compare the response.
              ...(config.reuseEnvironmentId && {
                environment_id: config.reuseEnvironmentId,
              }),
            },
            {
              headers: getHeaders(token),
              timeout: 15_000,
              // 这个回调绑定到 validateStatus: status => status < 500,，负责远程桥接会话在该局部场景下的响应。
              validateStatus: status => status < 500,
            },
          ),
        'Registration',
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'Registration')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/environments/bridge -> ${response.status} environment_id=${response.data.environment_id}`,
      )
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] >>> ${debugBody({ machine_name: config.machineName, directory: config.dir, branch: config.branch, git_repo_url: config.gitRepoUrl, max_sessions: config.maxSessions, metadata: { worker_type: config.workerType } })}`,
      )
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] <<< ${debugBody(response.data)}`)
      // 返回 `response.data`，作为远程桥接会话这次计算的结果。
      return response.data
    },

    // 远程桥接 bridge Api在这里处理 `async pollForWork(`，完成这一小步状态转换。
    async pollForWork(
      environmentId: string,
      environmentSecret: string,
      signal?: AbortSignal,
      reclaimOlderThanMs?: number,
    ): Promise<WorkResponse | null> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')

      // Save and reset so errors break the "consecutive empty" streak.
      // Restored below when the response is truly empty.
      // prevEmptyPolls 集合 命名 `consecutiveEmptyPolls`，让后续代码直接表达这个值的用途。
      const prevEmptyPolls = consecutiveEmptyPolls
      // consecutiveEmptyPolls 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
      consecutiveEmptyPolls = 0

      // 接口响应 等待 `axios.get<WorkResponse | null>(`，确保继续执行前已有结果。
      const response = await axios.get<WorkResponse | null>(
        `${deps.baseUrl}/v1/environments/${environmentId}/work/poll`,
        {
          headers: getHeaders(environmentSecret),
          params:
            reclaimOlderThanMs !== undefined
              ? { reclaim_older_than_ms: reclaimOlderThanMs }
              : undefined,
          timeout: 10_000,
          signal,
          // 这个回调绑定到 validateStatus: status => status < 500,，负责远程桥接会话在该局部场景下的响应。
          validateStatus: status => status < 500,
        },
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'Poll')

      // Empty body or null = no work available
      // response.data 响应数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!response.data) {
        // consecutiveEmptyPolls 集合更新为 `prevEmptyPolls + 1`，确保Bridge 通信后续读取最新状态。
        consecutiveEmptyPolls = prevEmptyPolls + 1
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          consecutiveEmptyPolls === 1 ||
          consecutiveEmptyPolls % EMPTY_POLL_LOG_INTERVAL === 0
        ) {
          // 调用 debug，触发远程桥接会话此处需要的副作用。
          debug(
            `[bridge:api] GET .../work/poll -> ${response.status} (no work, ${consecutiveEmptyPolls} consecutive empty polls)`,
          )
        }
        // 返回 `null`，作为远程桥接会话这次计算的结果。
        return null
      }

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] GET .../work/poll -> ${response.status} workId=${response.data.id} type=${response.data.data?.type}${response.data.data?.id ? ` sessionId=${response.data.data.id}` : ''}`,
      )
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] <<< ${debugBody(response.data)}`)
      // 返回 `response.data`，作为远程桥接会话这次计算的结果。
      return response.data
    },

    // 远程桥接 bridge Api在这里处理 `async acknowledgeWork(`，完成这一小步状态转换。
    async acknowledgeWork(
      environmentId: string,
      workId: string,
      sessionToken: string,
    ): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(workId, 'workId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../work/${workId}/ack`)

      // 接口响应保存`axios.post`，供远程桥接会话后续处理使用。
      const response = await axios.post(
        `${deps.baseUrl}/v1/environments/${environmentId}/work/${workId}/ack`,
        {},
        {
          headers: getHeaders(sessionToken),
          timeout: 10_000,
          // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
          validateStatus: s => s < 500,
        },
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'Acknowledge')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../work/${workId}/ack -> ${response.status}`)
    },

    // 远程桥接 bridge Api在这里处理 `async stopWork(`，完成这一小步状态转换。
    async stopWork(
      environmentId: string,
      workId: string,
      force: boolean,
    ): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(workId, 'workId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../work/${workId}/stop force=${force}`)

      // 接口响应保存`withOAuthRetry`，供远程桥接会话后续处理使用。
      const response = await withOAuthRetry(
        // 这个回调绑定到 (token: string) =>，负责远程桥接会话在该局部场景下的响应。
        (token: string) =>
          axios.post(
            `${deps.baseUrl}/v1/environments/${environmentId}/work/${workId}/stop`,
            { force },
            {
              headers: getHeaders(token),
              timeout: 10_000,
              // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
              validateStatus: s => s < 500,
            },
          ),
        'StopWork',
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'StopWork')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../work/${workId}/stop -> ${response.status}`)
    },

    // deregisterEnvironment 使用 environmentId: string 完成远程桥接会话里的对应操作。
    async deregisterEnvironment(environmentId: string): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] DELETE /v1/environments/bridge/${environmentId}`)

      // 接口响应保存`withOAuthRetry`，供远程桥接会话后续处理使用。
      const response = await withOAuthRetry(
        // 这个回调绑定到 (token: string) =>，负责远程桥接会话在该局部场景下的响应。
        (token: string) =>
          axios.delete(
            `${deps.baseUrl}/v1/environments/bridge/${environmentId}`,
            {
              headers: getHeaders(token),
              timeout: 10_000,
              // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
              validateStatus: s => s < 500,
            },
          ),
        'Deregister',
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'Deregister')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] DELETE /v1/environments/bridge/${environmentId} -> ${response.status}`,
      )
    },

    // archiveSession 使用 sessionId: string 完成远程桥接会话里的对应操作。
    async archiveSession(sessionId: string): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(sessionId, 'sessionId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST /v1/sessions/${sessionId}/archive`)

      // 接口响应保存`withOAuthRetry`，供远程桥接会话后续处理使用。
      const response = await withOAuthRetry(
        // 这个回调绑定到 (token: string) =>，负责远程桥接会话在该局部场景下的响应。
        (token: string) =>
          axios.post(
            `${deps.baseUrl}/v1/sessions/${sessionId}/archive`,
            {},
            {
              headers: getHeaders(token),
              timeout: 10_000,
              // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
              validateStatus: s => s < 500,
            },
          ),
        'ArchiveSession',
      )

      // 409 = already archived (idempotent, not an error)
      // 满足 `response.status === 409` 时，远程桥接会话执行该分支。
      if (response.status === 409) {
        // 调用 debug，触发远程桥接会话此处需要的副作用。
        debug(
          `[bridge:api] POST /v1/sessions/${sessionId}/archive -> 409 (already archived)`,
        )
        // 远程桥接 bridge Api在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'ArchiveSession')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/sessions/${sessionId}/archive -> ${response.status}`,
      )
    },

    // 远程桥接 bridge Api在这里处理 `async reconnectSession(`，完成这一小步状态转换。
    async reconnectSession(
      environmentId: string,
      sessionId: string,
    ): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(sessionId, 'sessionId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/environments/${environmentId}/bridge/reconnect session_id=${sessionId}`,
      )

      // 接口响应保存`withOAuthRetry`，供远程桥接会话后续处理使用。
      const response = await withOAuthRetry(
        // 这个回调绑定到 (token: string) =>，负责远程桥接会话在该局部场景下的响应。
        (token: string) =>
          axios.post(
            `${deps.baseUrl}/v1/environments/${environmentId}/bridge/reconnect`,
            { session_id: sessionId },
            {
              headers: getHeaders(token),
              timeout: 10_000,
              // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
              validateStatus: s => s < 500,
            },
          ),
        'ReconnectSession',
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'ReconnectSession')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../bridge/reconnect -> ${response.status}`)
    },

    // 远程桥接 bridge Api在这里处理 `async heartbeatWork(`，完成这一小步状态转换。
    async heartbeatWork(
      environmentId: string,
      workId: string,
      sessionToken: string,
    ): Promise<{ lease_extended: boolean; state: string }> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(environmentId, 'environmentId')
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(workId, 'workId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] POST .../work/${workId}/heartbeat`)

      // 接口响应 等待 `axios.post<{`，确保继续执行前已有结果。
      const response = await axios.post<{
        lease_extended: boolean
        state: string
        last_heartbeat: string
        ttl_seconds: number
      }>(
        `${deps.baseUrl}/v1/environments/${environmentId}/work/${workId}/heartbeat`,
        {},
        {
          headers: getHeaders(sessionToken),
          timeout: 10_000,
          // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
          validateStatus: s => s < 500,
        },
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(response.status, response.data, 'Heartbeat')
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST .../work/${workId}/heartbeat -> ${response.status} lease_extended=${response.data.lease_extended} state=${response.data.state}`,
      )
      // 返回 `response.data`，作为远程桥接会话这次计算的结果。
      return response.data
    },

    // 远程桥接 bridge Api在这里处理 `async sendPermissionResponseEvent(`，完成这一小步状态转换。
    async sendPermissionResponseEvent(
      sessionId: string,
      event: PermissionResponseEvent,
      sessionToken: string,
    ): Promise<void> {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(sessionId, 'sessionId')

      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/sessions/${sessionId}/events type=${event.type}`,
      )

      // 接口响应保存`axios.post`，供远程桥接会话后续处理使用。
      const response = await axios.post(
        `${deps.baseUrl}/v1/sessions/${sessionId}/events`,
        { events: [event] },
        {
          headers: getHeaders(sessionToken),
          timeout: 10_000,
          // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
          validateStatus: s => s < 500,
        },
      )

      // 调用 handleErrorStatus，触发远程桥接会话此处需要的副作用。
      handleErrorStatus(
        response.status,
        response.data,
        'SendPermissionResponseEvent',
      )
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(
        `[bridge:api] POST /v1/sessions/${sessionId}/events -> ${response.status}`,
      )
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] >>> ${debugBody({ events: [event] })}`)
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`[bridge:api] <<< ${debugBody(response.data)}`)
    },
  }
}

// handleErrorStatus 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleErrorStatus(
  status: number,
  data: unknown,
  context: string,
): void {
  // 组合条件 `status === 200 || status === 204` 成立时，远程桥接会话才启用这条专门路径。
  if (status === 200 || status === 204) {
    // 远程桥接 bridge Api在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
  const detail = extractErrorDetail(data)
  // errorType 错误信息保存`extractErrorTypeFromData`，供远程桥接会话后续处理使用。
  const errorType = extractErrorTypeFromData(data)
  // 按照 status 的取值选择远程桥接会话的具体处理分支。
  switch (status) {
    case 401:
      // 抛出 new BridgeFatalError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeFatalError(
        `${context}: Authentication failed (401)${detail ? `: ${detail}` : ''}. ${BRIDGE_LOGIN_INSTRUCTION}`,
        401,
        errorType,
      )
    case 403:
      // 抛出 new BridgeFatalError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeFatalError(
        isExpiredErrorType(errorType)
          ? 'Remote Control session has expired. Please restart with `claude remote-control` or /remote-control.'
          : `${context}: Access denied (403)${detail ? `: ${detail}` : ''}. Check your organization permissions.`,
        403,
        errorType,
      )
    case 404:
      // 抛出 new BridgeFatalError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeFatalError(
        detail ??
          `${context}: Not found (404). Remote Control may not be available for this organization.`,
        404,
        errorType,
      )
    case 410:
      // 抛出 new BridgeFatalError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeFatalError(
        detail ??
          'Remote Control session has expired. Please restart with `claude remote-control` or /remote-control.',
        410,
        errorType ?? 'environment_expired',
      )
    case 429:
      // 抛出 new Error(`${context}: Rate limited (429). Polling too frequently.`)，阻止远程桥接会话在无效状态下继续运行。
      throw new Error(`${context}: Rate limited (429). Polling too frequently.`)
    default:
      // 抛出 new Error(，阻止远程桥接会话在无效状态下继续运行。
      throw new Error(
        `${context}: Failed with status ${status}${detail ? `: ${detail}` : ''}`,
      )
  }
}

/** Check whether an error type string indicates a session/environment expiry. */
// isExpiredErrorType 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isExpiredErrorType(errorType: string | undefined): boolean {
  // errorType 错误信息缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!errorType) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `errorType.includes('expired') || errorType.includes('lifetime')`，作为远程桥接会话这次计算的结果。
  return errorType.includes('expired') || errorType.includes('lifetime')
}

/**
 * Check whether a BridgeFatalError is a suppressible 403 permission error.
 * These are 403 errors for scopes like 'external_poll_sessions' or operations
 * like StopWork that fail because the user's role lacks 'environments:manage'.
 * They don't affect core functionality and shouldn't be shown to users.
 */
// isSuppressible403 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSuppressible403(err: BridgeFatalError): boolean {
  // `err.status` 与 `403` 不一致时刷新派生状态，避免使用过期结果。
  if (err.status !== 403) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    err.message.includes('external_poll_sessions') ||
    err.message.includes('environments:manage')
  )
}

// extractErrorTypeFromData 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractErrorTypeFromData(data: unknown): string | undefined {
  // 当 `data && typeof data` 匹配 `'object'` 时，远程桥接会话执行对应分支。
  if (data && typeof data === 'object') {
    // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
    if (
      'error' in data &&
      data.error &&
      typeof data.error === 'object' &&
      'type' in data.error &&
      typeof data.error.type === 'string'
    ) {
      // 返回 `data.error.type`，作为远程桥接会话这次计算的结果。
      return data.error.type
    }
  }
  // 返回 `undefined`，作为远程桥接会话这次计算的结果。
  return undefined
}
