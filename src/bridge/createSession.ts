// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 引入 extractErrorDetail，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { extractErrorDetail } from './debugUtils.js'
// 引入 toCompatSessionId，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { toCompatSessionId } from './sessionIdCompat.js'

// GitSource 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type GitSource = {
  type: 'git_repository'
  url: string
  revision?: string
}

// GitOutcome 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type GitOutcome = {
  type: 'git_repository'
  git_info: { type: 'github'; repo: string; branches: string[] }
}

// Events must be wrapped in { type: 'event', data: <sdk_message> } for the
// POST /v1/sessions endpoint (discriminated union format).
// SessionEvent 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionEvent = {
  type: 'event'
  data: SDKMessage
}

/**
 * Create a session on a bridge environment via POST /v1/sessions.
 *
 * Used by both `claude remote-control` (empty session so the user has somewhere to
 * type immediately) and `/remote-control` (session pre-populated with conversation
 * history).
 *
 * Returns the session ID on success, or null if creation fails (non-fatal).
 */
// createBridgeSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createBridgeSession({
  environmentId,
  title,
  events,
  gitRepoUrl,
  branch,
  signal,
  baseUrl: baseUrlOverride,
  getAccessToken,
  permissionMode,
}: {
  environmentId: string
  title?: string
  events: SessionEvent[]
  gitRepoUrl: string | null
  branch: string
  signal: AbortSignal
  baseUrl?: string
  // 这个回调绑定到 getAccessToken?: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAccessToken?: () => string | undefined
  permissionMode?: string
}): Promise<string | null> {
  // 从 `await import('../utils/auth.js')` 解构 getClaudeAIOAuthTokens，减少远程桥接 create Session对同一对象的重复访问。
  const { getClaudeAIOAuthTokens } = await import('../utils/auth.js')
  // 从 `await import('../services/oauth/client.js')` 解构 getOrganizationUUID，减少远程桥接 create Session对同一对象的重复访问。
  const { getOrganizationUUID } = await import('../services/oauth/client.js')
  // 从 `await import('../constants/oauth.js')` 解构 getOauthConfig，减少远程桥接 create Session对同一对象的重复访问。
  const { getOauthConfig } = await import('../constants/oauth.js')
  // 从 `await import('../utils/teleport/api.js')` 解构 getOAuthHeaders，减少远程桥接 create Session对同一对象的重复访问。
  const { getOAuthHeaders } = await import('../utils/teleport/api.js')
  // 从 `await import('../utils/detectRepository.js')` 解构 parseGitHubRepository，减少远程桥接 create Session对同一对象的重复访问。
  const { parseGitHubRepository } = await import('../utils/detectRepository.js')
  // 从 `await import('../utils/git.js')` 解构 getDefaultBranch，减少远程桥接 create Session对同一对象的重复访问。
  const { getDefaultBranch } = await import('../utils/git.js')
  // 从 `await import('../utils/model/model.js')` 解构 getMainLoopModel，减少远程桥接 create Session对同一对象的重复访问。
  const { getMainLoopModel } = await import('../utils/model/model.js')
  // 从 `await import('axios')` 解构 default，减少远程桥接 create Session对同一对象的重复访问。
  const { default: axios } = await import('axios')

  // accessToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const accessToken =
    getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No access token for session creation')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // orgUUID读取`getOrganizationUUID`，供远程桥接会话后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!orgUUID) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No org UUID for session creation')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // Build git source and outcome context
  // gitSource 命名 `null`，让后续代码直接表达这个值的用途。
  let gitSource: GitSource | null = null
  // gitOutcome 命名 `null`，让后续代码直接表达这个值的用途。
  let gitOutcome: GitOutcome | null = null

  // 满足 `gitRepoUrl` 时，远程桥接会话执行该分支。
  if (gitRepoUrl) {
    // 从 `await import('../utils/detectRepository.js')` 解构 parseGitRemote，减少远程桥接 create Session对同一对象的重复访问。
    const { parseGitRemote } = await import('../utils/detectRepository.js')
    // 解析结果解析`parseGitRemote`，供远程桥接会话后续处理使用。
    const parsed = parseGitRemote(gitRepoUrl)
    // 满足 `parsed` 时，远程桥接会话执行该分支。
    if (parsed) {
      // 从 `parsed` 解构 host、owner、name，减少远程桥接 create Session对同一对象的重复访问。
      const { host, owner, name } = parsed
      // revision读取`getDefaultBranch`，供远程桥接会话后续处理使用。
      const revision = branch || (await getDefaultBranch()) || undefined
      // gitSource更新为 `{`，确保Bridge 通信后续读取最新状态。
      gitSource = {
        type: 'git_repository',
        url: `https://${host}/${owner}/${name}`,
        revision,
      }
      // gitOutcome更新为 `{`，确保Bridge 通信后续读取最新状态。
      gitOutcome = {
        type: 'git_repository',
        git_info: {
          type: 'github',
          repo: `${owner}/${name}`,
          branches: [`claude/${branch || 'task'}`],
        },
      }
    } else {
      // Fallback: try parseGitHubRepository for owner/repo format
      // ownerRepo解析`parseGitHubRepository`，供远程桥接会话后续处理使用。
      const ownerRepo = parseGitHubRepository(gitRepoUrl)
      // 满足 `ownerRepo` 时，远程桥接会话执行该分支。
      if (ownerRepo) {
        // 从 `ownerRepo.split('/')` 按位置拆出 owner、name，让远程桥接 create Session分别处理这些返回值。
        const [owner, name] = ownerRepo.split('/')
        // 组合条件 `owner && name` 成立时，远程桥接会话才启用这条专门路径。
        if (owner && name) {
          // revision读取`getDefaultBranch`，供远程桥接会话后续处理使用。
          const revision = branch || (await getDefaultBranch()) || undefined
          // gitSource更新为 `{`，确保Bridge 通信后续读取最新状态。
          gitSource = {
            type: 'git_repository',
            url: `https://github.com/${owner}/${name}`,
            revision,
          }
          // gitOutcome更新为 `{`，确保Bridge 通信后续读取最新状态。
          gitOutcome = {
            type: 'git_repository',
            git_info: {
              type: 'github',
              repo: `${owner}/${name}`,
              branches: [`claude/${branch || 'task'}`],
            },
          }
        }
      }
    }
  }

  // requestBody 请求数据 集中保存远程桥接会话远程桥接 create Session要一起传递的字段。
  const requestBody = {
    ...(title !== undefined && { title }),
    events,
    session_context: {
      sources: gitSource ? [gitSource] : [],
      outcomes: gitOutcome ? [gitOutcome] : [],
      model: getMainLoopModel(),
    },
    environment_id: environmentId,
    source: 'remote-control',
    ...(permissionMode && { permission_mode: permissionMode }),
  }

  // 请求头 集中保存远程桥接会话远程桥接 create Session要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': 'ccr-byoc-2025-07-29',
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供远程桥接会话后续处理使用。
  const url = `${baseUrlOverride ?? getOauthConfig().BASE_API_URL}/v1/sessions`
  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await axios.post(url, requestBody, {`，确保Bridge 通信后续读取最新状态。
    response = await axios.post(url, requestBody, {
      headers,
      signal,
      // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
      validateStatus: s => s < 500,
    })
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session creation request failed: ${errorMessage(err)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // isSuccess 集合标记远程桥接会话远程桥接 create Session是否启用对应路径。
  const isSuccess = response.status === 200 || response.status === 201

  // isSuccess 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!isSuccess) {
    // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
    const detail = extractErrorDetail(response.data)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session creation failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // sessionData 会话数据保存`response.data`，供后续判断或组装使用。
  const sessionData: unknown = response.data
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    !sessionData ||
    typeof sessionData !== 'object' ||
    !('id' in sessionData) ||
    typeof sessionData.id !== 'string'
  ) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No session ID in response')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 返回 `sessionData.id`，作为远程桥接会话这次计算的结果。
  return sessionData.id
}

/**
 * Fetch a bridge session via GET /v1/sessions/{id}.
 *
 * Returns the session's environment_id (for `--session-id` resume) and title.
 * Uses the same org-scoped headers as create/archive — the environments-level
 * client in bridgeApi.ts uses a different beta header and no org UUID, which
 * makes the Sessions API return 404.
 */
// getBridgeSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getBridgeSession(
  sessionId: string,
  opts?: { baseUrl?: string; getAccessToken?: () => string | undefined },
): Promise<{ environment_id?: string; title?: string } | null> {
  // 从 `await import('../utils/auth.js')` 解构 getClaudeAIOAuthTokens，减少远程桥接 create Session对同一对象的重复访问。
  const { getClaudeAIOAuthTokens } = await import('../utils/auth.js')
  // 从 `await import('../services/oauth/client.js')` 解构 getOrganizationUUID，减少远程桥接 create Session对同一对象的重复访问。
  const { getOrganizationUUID } = await import('../services/oauth/client.js')
  // 从 `await import('../constants/oauth.js')` 解构 getOauthConfig，减少远程桥接 create Session对同一对象的重复访问。
  const { getOauthConfig } = await import('../constants/oauth.js')
  // 从 `await import('../utils/teleport/api.js')` 解构 getOAuthHeaders，减少远程桥接 create Session对同一对象的重复访问。
  const { getOAuthHeaders } = await import('../utils/teleport/api.js')
  // 从 `await import('axios')` 解构 default，减少远程桥接 create Session对同一对象的重复访问。
  const { default: axios } = await import('axios')

  // accessToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const accessToken =
    opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No access token for session fetch')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // orgUUID读取`getOrganizationUUID`，供远程桥接会话后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!orgUUID) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No org UUID for session fetch')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 请求头 集中保存远程桥接会话远程桥接 create Session要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': 'ccr-byoc-2025-07-29',
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供远程桥接会话后续处理使用。
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[bridge] Fetching session ${sessionId}`)

  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await axios.get<{ environment_id?: string; title?: string...`，确保Bridge 通信后续读取最新状态。
    response = await axios.get<{ environment_id?: string; title?: string }>(
      url,
      // 这个回调绑定到 { headers, timeout: 10_000, validateStatus: s => s < 500 },，负责远程桥接会话在该局部场景下的响应。
      { headers, timeout: 10_000, validateStatus: s => s < 500 },
    )
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session fetch request failed: ${errorMessage(err)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200) {
    // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
    const detail = extractErrorDetail(response.data)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session fetch failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 返回 `response.data`，作为远程桥接会话这次计算的结果。
  return response.data
}

/**
 * Archive a bridge session via POST /v1/sessions/{id}/archive.
 *
 * The CCR server never auto-archives sessions — archival is always an
 * explicit client action. Both `claude remote-control` (standalone bridge) and the
 * always-on `/remote-control` REPL bridge call this during shutdown to archive any
 * sessions that are still alive.
 *
 * The archive endpoint accepts sessions in any status (running, idle,
 * requires_action, pending) and returns 409 if already archived, making
 * it safe to call even if the server-side runner already archived the
 * session.
 *
 * Callers must handle errors — this function has no try/catch; 5xx,
 * timeouts, and network errors throw. Archival is best-effort during
 * cleanup; call sites wrap with .catch().
 */
// archiveBridgeSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function archiveBridgeSession(
  sessionId: string,
  opts?: {
    baseUrl?: string
    getAccessToken?: () => string | undefined
    timeoutMs?: number
  },
): Promise<void> {
  // 从 `await import('../utils/auth.js')` 解构 getClaudeAIOAuthTokens，减少远程桥接 create Session对同一对象的重复访问。
  const { getClaudeAIOAuthTokens } = await import('../utils/auth.js')
  // 从 `await import('../services/oauth/client.js')` 解构 getOrganizationUUID，减少远程桥接 create Session对同一对象的重复访问。
  const { getOrganizationUUID } = await import('../services/oauth/client.js')
  // 从 `await import('../constants/oauth.js')` 解构 getOauthConfig，减少远程桥接 create Session对同一对象的重复访问。
  const { getOauthConfig } = await import('../constants/oauth.js')
  // 从 `await import('../utils/teleport/api.js')` 解构 getOAuthHeaders，减少远程桥接 create Session对同一对象的重复访问。
  const { getOAuthHeaders } = await import('../utils/teleport/api.js')
  // 从 `await import('axios')` 解构 default，减少远程桥接 create Session对同一对象的重复访问。
  const { default: axios } = await import('axios')

  // accessToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const accessToken =
    opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No access token for session archive')
    // 远程桥接 create Session在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // orgUUID读取`getOrganizationUUID`，供远程桥接会话后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!orgUUID) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No org UUID for session archive')
    // 远程桥接 create Session在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 请求头 集中保存远程桥接会话远程桥接 create Session要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': 'ccr-byoc-2025-07-29',
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供远程桥接会话后续处理使用。
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/archive`
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[bridge] Archiving session ${sessionId}`)

  // 接口响应保存`axios.post`，供远程桥接会话后续处理使用。
  const response = await axios.post(
    url,
    {},
    {
      headers,
      timeout: opts?.timeoutMs ?? 10_000,
      // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
      validateStatus: s => s < 500,
    },
  )

  // 满足 `response.status === 200` 时，远程桥接会话执行该分支。
  if (response.status === 200) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge] Session ${sessionId} archived successfully`)
  } else {
    // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
    const detail = extractErrorDetail(response.data)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session archive failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    )
  }
}

/**
 * Update the title of a bridge session via PATCH /v1/sessions/{id}.
 *
 * Called when the user renames a session via /rename while a bridge
 * connection is active, so the title stays in sync on claude.ai/code.
 *
 * Errors are swallowed — title sync is best-effort.
 */
// updateBridgeSessionTitle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateBridgeSessionTitle(
  sessionId: string,
  title: string,
  opts?: { baseUrl?: string; getAccessToken?: () => string | undefined },
): Promise<void> {
  // 从 `await import('../utils/auth.js')` 解构 getClaudeAIOAuthTokens，减少远程桥接 create Session对同一对象的重复访问。
  const { getClaudeAIOAuthTokens } = await import('../utils/auth.js')
  // 从 `await import('../services/oauth/client.js')` 解构 getOrganizationUUID，减少远程桥接 create Session对同一对象的重复访问。
  const { getOrganizationUUID } = await import('../services/oauth/client.js')
  // 从 `await import('../constants/oauth.js')` 解构 getOauthConfig，减少远程桥接 create Session对同一对象的重复访问。
  const { getOauthConfig } = await import('../constants/oauth.js')
  // 从 `await import('../utils/teleport/api.js')` 解构 getOAuthHeaders，减少远程桥接 create Session对同一对象的重复访问。
  const { getOAuthHeaders } = await import('../utils/teleport/api.js')
  // 从 `await import('axios')` 解构 default，减少远程桥接 create Session对同一对象的重复访问。
  const { default: axios } = await import('axios')

  // accessToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const accessToken =
    opts?.getAccessToken?.() ?? getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No access token for session title update')
    // 远程桥接 create Session在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // orgUUID读取`getOrganizationUUID`，供远程桥接会话后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!orgUUID) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge] No org UUID for session title update')
    // 远程桥接 create Session在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 请求头 集中保存远程桥接会话远程桥接 create Session要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': 'ccr-byoc-2025-07-29',
    'x-organization-uuid': orgUUID,
  }

  // Compat gateway only accepts session_* (compat/convert.go:27). v2 callers
  // pass raw cse_*; retag here so all callers can pass whatever they hold.
  // Idempotent for v1's session_* and bridgeMain's pre-converted compatSessionId.
  // compatId保存`toCompatSessionId`，供远程桥接会话后续处理使用。
  const compatId = toCompatSessionId(sessionId)
  // URL读取`getOauthConfig`，供远程桥接会话后续处理使用。
  const url = `${opts?.baseUrl ?? getOauthConfig().BASE_API_URL}/v1/sessions/${compatId}`
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[bridge] Updating session title: ${compatId} → ${title}`)

  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应保存`axios.patch`，供远程桥接会话后续处理使用。
    const response = await axios.patch(
      url,
      { title },
      // 这个回调绑定到 { headers, timeout: 10_000, validateStatus: s => s < 500 },，负责远程桥接会话在该局部场景下的响应。
      { headers, timeout: 10_000, validateStatus: s => s < 500 },
    )

    // 满足 `response.status === 200` 时，远程桥接会话执行该分支。
    if (response.status === 200) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[bridge] Session title updated successfully`)
    } else {
      // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
      const detail = extractErrorDetail(response.data)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge] Session title update failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
      )
    }
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge] Session title update request failed: ${errorMessage(err)}`,
    )
  }
}
