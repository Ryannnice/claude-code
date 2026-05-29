// 引入 axios、AxiosRequestConfig、AxiosResponse，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 getOauthConfig，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from 'src/constants/oauth.js'
// 接入 getOrganizationUUID 服务层能力，把外部通信或共享状态交给 src/services/oauth/client.js 处理。
import { getOrganizationUUID } from 'src/services/oauth/client.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import z from 'zod/v4'
// 引入 getClaudeAIOAuthTokens，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getClaudeAIOAuthTokens } from '../auth.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 parseGitHubRepository，将 ../detectRepository.js 中已经封装好的能力接到本文件流程里。
import { parseGitHubRepository } from '../detectRepository.js'
// 引入 errorMessage、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, toError } from '../errors.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'

// Retry configuration for teleport API requests
// TELEPORT_RETRY_DELAYS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TELEPORT_RETRY_DELAYS = [2000, 4000, 8000, 16000] // 4 retries with exponential backoff
// MAX_TELEPORT_RETRIES 集合记录 `TELEPORT_RETRY_DELAYS.length` 是否成立，下一步按该结果分支。
const MAX_TELEPORT_RETRIES = TELEPORT_RETRY_DELAYS.length

// CCR_BYOC_BETA 命名 `'ccr-byoc-2025-07-29'`，让后续代码直接表达这个值的用途。
export const CCR_BYOC_BETA = 'ccr-byoc-2025-07-29'

/**
 * Checks if an axios error is a transient network error that should be retried
 */
// isTransientNetworkError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTransientNetworkError(error: unknown): boolean {
  // 满足 `!axios.isAxiosError(error)` 时，共享工具执行该分支。
  if (!axios.isAxiosError(error)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Retry on network errors (no response received)
  // error.response 响应数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!error.response) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Retry on server errors (5xx)
  // 满足 `error.response.status >= 500` 时，共享工具执行该分支。
  if (error.response.status >= 500) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Don't retry on client errors (4xx) - they're not transient
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Makes an axios GET request with automatic retry for transient network errors
 * Uses exponential backoff: 2s, 4s, 8s, 16s (4 retries = 5 total attempts)
 */
// axiosGetWithRetry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function axiosGetWithRetry<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  // lastError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastError: unknown

  // 循环处理 `let attempt = 0; attempt <= MAX_TELEPORT_RETRIES`，让共享工具逐项把同类条目按顺序走完。
  for (let attempt = 0; attempt <= MAX_TELEPORT_RETRIES; attempt++) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `axios.get<T>(url, config)`，调用方直接接收异步结果。
      return await axios.get<T>(url, config)
    } catch (error) {
      // lastError 错误信息更新为 `error`，确保共享工具后续读取最新状态。
      lastError = error

      // Don't retry if this isn't a transient error
      // 满足 `!isTransientNetworkError(error)` 时，共享工具执行该分支。
      if (!isTransientNetworkError(error)) {
        // 抛出 error，阻止共享工具在无效状态下继续运行。
        throw error
      }

      // Don't retry if we've exhausted all retries
      // 满足 `attempt >= MAX_TELEPORT_RETRIES` 时，共享工具执行该分支。
      if (attempt >= MAX_TELEPORT_RETRIES) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Teleport request failed after ${attempt + 1} attempts: ${errorMessage(error)}`,
        )
        // 抛出 error，阻止共享工具在无效状态下继续运行。
        throw error
      }

      // delay 命名 `TELEPORT_RETRY_DELAYS[attempt] ?? 2000`，让后续代码直接表达这个值的用途。
      const delay = TELEPORT_RETRY_DELAYS[attempt] ?? 2000
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Teleport request failed (attempt ${attempt + 1}/${MAX_TELEPORT_RETRIES + 1}), retrying in ${delay}ms: ${errorMessage(error)}`,
      )
      // 等待 `sleep(delay)` 完成，再继续共享工具 api的异步流程。
      await sleep(delay)
    }
  }

  // 抛出 lastError，阻止共享工具在无效状态下继续运行。
  throw lastError
}

// Types matching the actual Sessions API response from api/schemas/sessions/sessions.py
// SessionStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionStatus = 'requires_action' | 'running' | 'idle' | 'archived'

// GitSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitSource = {
  type: 'git_repository'
  url: string
  revision?: string | null
  allow_unrestricted_git_push?: boolean
}

// KnowledgeBaseSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type KnowledgeBaseSource = {
  type: 'knowledge_base'
  knowledge_base_id: string
}

// SessionContextSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionContextSource = GitSource | KnowledgeBaseSource

// Outcome types from api/schemas/sandbox.py
// OutcomeGitInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutcomeGitInfo = {
  type: 'github'
  repo: string
  branches: string[]
}

// GitRepositoryOutcome 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitRepositoryOutcome = {
  type: 'git_repository'
  git_info: OutcomeGitInfo
}

// Outcome 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Outcome = GitRepositoryOutcome

// SessionContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionContext = {
  sources: SessionContextSource[]
  cwd: string
  outcomes: Outcome[] | null
  custom_system_prompt: string | null
  append_system_prompt: string | null
  model: string | null
  // Seed filesystem with a git bundle on Files API
  seed_bundle_file_id?: string
  github_pr?: { owner: string; repo: string; number: number }
  reuse_outcome_branches?: boolean
}

// SessionResource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionResource = {
  type: 'session'
  id: string
  title: string | null
  session_status: SessionStatus
  environment_id: string
  created_at: string
  updated_at: string
  session_context: SessionContext
}

// ListSessionsResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ListSessionsResponse = {
  data: SessionResource[]
  has_more: boolean
  first_id: string | null
  last_id: string | null
}

// CodeSessionSchema 会话数据保存`lazySchema`，供共享工具后续处理使用。
export const CodeSessionSchema = lazySchema(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum([
      'idle',
      'working',
      'waiting',
      'completed',
      'archived',
      'cancelled',
      'rejected',
    ]),
    repo: z
      .object({
        name: z.string(),
        owner: z.object({
          login: z.string(),
        }),
        default_branch: z.string().optional(),
      })
      .nullable(),
    turns: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
  }),
)

// Export the inferred type from the Zod schema
// CodeSession 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CodeSession = z.infer<ReturnType<typeof CodeSessionSchema>>

/**
 * Validates and prepares for API requests
 * @returns Object containing access token and organization UUID
 */
// prepareApiRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function prepareApiRequest(): Promise<{
  accessToken: string
  orgUUID: string
}> {
  // accessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const accessToken = getClaudeAIOAuthTokens()?.accessToken
  // 满足 `accessToken === undefined` 时，共享工具执行该分支。
  if (accessToken === undefined) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'Claude Code web sessions require authentication with a Claude.ai account. API key authentication is not sufficient. Please run /login to authenticate, or check your authentication status with /status.',
    )
  }

  // orgUUID读取`getOrganizationUUID`，供共享工具后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!orgUUID) {
    // 抛出 new Error('Unable to get organization UUID')，阻止共享工具在无效状态下继续运行。
    throw new Error('Unable to get organization UUID')
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { accessToken, orgUUID }
}

/**
 * Fetches code sessions from the new Sessions API (/v1/sessions)
 * @returns Array of code sessions
 */
// fetchCodeSessionsFromSessionsAPI 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchCodeSessionsFromSessionsAPI(): Promise<
  CodeSession[]
> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少共享工具 api对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // URL读取`getOauthConfig`，供共享工具后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/sessions`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 请求头集中保存共享工具 api要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'anthropic-beta': 'ccr-byoc-2025-07-29',
      'x-organization-uuid': orgUUID,
    }

    // 接口响应 等待 `axiosGetWithRetry<ListSessionsResponse>(url, {`，确保继续执行前已有结果。
    const response = await axiosGetWithRetry<ListSessionsResponse>(url, {
      headers,
    })

    // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200) {
      // 抛出 new Error(`Failed to fetch code sessions: ${response.statusText}`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Failed to fetch code sessions: ${response.statusText}`)
    }

    // Transform SessionResource[] to CodeSession[] format
    // 这个回调绑定到 const sessions: CodeSession[] = response.data.data.map(session => {，负责共享工具在该局部场景下的响应。
    const sessions: CodeSession[] = response.data.data.map(session => {
      // Extract repository info from git sources
      // gitSource筛选`sources.find`，供共享工具后续处理使用。
      const gitSource = session.session_context.sources.find(
        // 这个回调绑定到 (source): source is GitSource => source.type === 'git_repository',，负责共享工具在该局部场景下的响应。
        (source): source is GitSource => source.type === 'git_repository',
      )

      // repo 命名 `null`，让后续代码直接表达这个值的用途。
      let repo: CodeSession['repo'] = null
      // 满足 `gitSource?.url` 时，共享工具执行该分支。
      if (gitSource?.url) {
        // Parse GitHub URL using the existing utility function
        // repoPath 路径数据解析`parseGitHubRepository`，供共享工具后续处理使用。
        const repoPath = parseGitHubRepository(gitSource.url)
        // 满足 `repoPath` 时，共享工具执行该分支。
        if (repoPath) {
          // 从 `repoPath.split('/')` 按位置拆出 owner、name，让共享工具 api分别处理这些返回值。
          const [owner, name] = repoPath.split('/')
          // 只有 `owner && name` 满足时，共享工具才执行该分支。
          if (owner && name) {
            // repo更新为 `{`，确保共享工具后续读取最新状态。
            repo = {
              name,
              owner: {
                login: owner,
              },
              default_branch: gitSource.revision || undefined,
            }
          }
        }
      }

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        id: session.id,
        title: session.title || 'Untitled',
        description: '', // SessionResource doesn't have description field
        status: session.session_status as CodeSession['status'], // Map session_status to status
        repo,
        turns: [], // SessionResource doesn't have turns field
        created_at: session.created_at,
        updated_at: session.updated_at,
      }
    })

    // 返回 `sessions`，作为共享工具这次计算的结果。
    return sessions
  } catch (error) {
    // err保存`toError`，供共享工具后续处理使用。
    const err = toError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

/**
 * Creates OAuth headers for API requests
 * @param accessToken The OAuth access token
 * @returns Headers object with Authorization, Content-Type, and anthropic-version
 */
// getOAuthHeaders 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOAuthHeaders(accessToken: string): Record<string, string> {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }
}

/**
 * Fetches a single session by ID from the Sessions API
 * @param sessionId The session ID to fetch
 * @returns The session resource
 */
// fetchSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchSession(
  sessionId: string,
): Promise<SessionResource> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少共享工具 api对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // URL读取`getOauthConfig`，供共享工具后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`
  // 请求头集中保存共享工具 api要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': 'ccr-byoc-2025-07-29',
    'x-organization-uuid': orgUUID,
  }

  // 接口响应 等待 `axios.get<SessionResource>(url, {`，确保继续执行前已有结果。
  const response = await axios.get<SessionResource>(url, {
    headers,
    timeout: 15000,
    // 这个回调绑定到 validateStatus: status => status < 500,，负责共享工具在该局部场景下的响应。
    validateStatus: status => status < 500,
  })

  // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200) {
    // Extract error message from response if available
    // errorData 错误信息保存`response.data as { error?: { message?: string } }`，供共享工具 api后续判断或输出使用。
    const errorData = response.data as { error?: { message?: string } }
    // apiMessage 消息数据保存`errorData?.error?.message`，供共享工具 api后续判断或输出使用。
    const apiMessage = errorData?.error?.message

    // 满足 `response.status === 404` 时，共享工具执行该分支。
    if (response.status === 404) {
      // 抛出 new Error(`Session not found: ${sessionId}`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Session not found: ${sessionId}`)
    }

    // 满足 `response.status === 401` 时，共享工具执行该分支。
    if (response.status === 401) {
      // 抛出 new Error('Session expired. Please run /login to sign in again.')，阻止共享工具在无效状态下继续运行。
      throw new Error('Session expired. Please run /login to sign in again.')
    }

    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      apiMessage ||
        `Failed to fetch session: ${response.status} ${response.statusText}`,
    )
  }

  // 返回 `response.data`，作为共享工具这次计算的结果。
  return response.data
}

/**
 * Extracts the first branch name from a session's git repository outcomes
 * @param session The session resource to extract from
 * @returns The first branch name, or undefined if none found
 */
// getBranchFromSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBranchFromSession(
  session: SessionResource,
): string | undefined {
  // gitOutcome筛选`find`，供共享工具后续处理使用。
  const gitOutcome = session.session_context.outcomes?.find(
    (outcome): outcome is GitRepositoryOutcome =>
      outcome.type === 'git_repository',
  )
  // 返回 `gitOutcome?.git_info?.branches[0]`，作为共享工具这次计算的结果。
  return gitOutcome?.git_info?.branches[0]
}

/**
 * Content for a remote session message.
 * Accepts a plain string or an array of content blocks (text, image, etc.)
 * following the Anthropic API messages spec.
 */
// RemoteMessageContent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteMessageContent =
  | string
  | Array<{ type: string; [key: string]: unknown }>

/**
 * Sends a user message event to an existing remote session via the Sessions API
 * @param sessionId The session ID to send the event to
 * @param messageContent The user message content (string or content blocks)
 * @param opts.uuid Optional UUID for the event — callers that added a local
 *   UserMessage first should pass its UUID so echo filtering can dedup
 * @returns Promise<boolean> True if successful, false otherwise
 */
// sendEventToRemoteSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendEventToRemoteSession(
  sessionId: string,
  messageContent: RemoteMessageContent,
  opts?: { uuid?: string },
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少共享工具 api对同一对象的重复访问。
    const { accessToken, orgUUID } = await prepareApiRequest()

    // URL读取`getOauthConfig`，供共享工具后续处理使用。
    const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/events`
    // 请求头集中保存共享工具 api要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'anthropic-beta': 'ccr-byoc-2025-07-29',
      'x-organization-uuid': orgUUID,
    }

    // userEvent集中保存共享工具 api要一起传递的字段。
    const userEvent = {
      uuid: opts?.uuid ?? randomUUID(),
      session_id: sessionId,
      type: 'user',
      parent_tool_use_id: null,
      message: {
        role: 'user',
        content: messageContent,
      },
    }

    // requestBody 请求数据集中保存共享工具 api要一起传递的字段。
    const requestBody = {
      events: [userEvent],
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[sendEventToRemoteSession] Sending event to session ${sessionId}`,
    )
    // The endpoint may block until the CCR worker is ready. Observed ~2.6s
    // in normal cases; allow a generous margin for cold-start containers.
    // 接口响应保存`axios.post`，供共享工具后续处理使用。
    const response = await axios.post(url, requestBody, {
      headers,
      // 这个回调绑定到 validateStatus: status => status < 500,，负责共享工具在该局部场景下的响应。
      validateStatus: status => status < 500,
      timeout: 30000,
    })

    // 只有 `response.status === 200 || response.status === 201` 满足时，共享工具才执行该分支。
    if (response.status === 200 || response.status === 201) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[sendEventToRemoteSession] Successfully sent event to session ${sessionId}`,
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[sendEventToRemoteSession] Failed with status ${response.status}: ${jsonStringify(response.data)}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[sendEventToRemoteSession] Error: ${errorMessage(error)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Updates the title of an existing remote session via the Sessions API
 * @param sessionId The session ID to update
 * @param title The new title for the session
 * @returns Promise<boolean> True if successful, false otherwise
 */
// updateSessionTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateSessionTitle(
  sessionId: string,
  title: string,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少共享工具 api对同一对象的重复访问。
    const { accessToken, orgUUID } = await prepareApiRequest()

    // URL读取`getOauthConfig`，供共享工具后续处理使用。
    const url = `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}`
    // 请求头集中保存共享工具 api要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'anthropic-beta': 'ccr-byoc-2025-07-29',
      'x-organization-uuid': orgUUID,
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[updateSessionTitle] Updating title for session ${sessionId}: "${title}"`,
    )
    // 接口响应保存`axios.patch`，供共享工具后续处理使用。
    const response = await axios.patch(
      url,
      { title },
      {
        headers,
        // 这个回调绑定到 validateStatus: status => status < 500,，负责共享工具在该局部场景下的响应。
        validateStatus: status => status < 500,
      },
    )

    // 满足 `response.status === 200` 时，共享工具执行该分支。
    if (response.status === 200) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[updateSessionTitle] Successfully updated title for session ${sessionId}`,
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[updateSessionTitle] Failed with status ${response.status}: ${jsonStringify(response.data)}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[updateSessionTitle] Error: ${errorMessage(error)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
