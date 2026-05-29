// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js'
// 复用 fetchEnvironments 工具函数，把通用处理留在 ../../utils/teleport/environments.js 中维护。
import { fetchEnvironments } from '../../utils/teleport/environments.js'

// CCR_BYOC_BETA_HEADER 命名 `'ccr-byoc-2025-07-29'`，让后续代码直接表达这个值的用途。
const CCR_BYOC_BETA_HEADER = 'ccr-byoc-2025-07-29'

/**
 * Wraps a raw GitHub token so that its string representation is redacted.
 * `String(token)`, template literals, `JSON.stringify(token)`, and any
 * attached error messages will show `[REDACTED:gh-token]` instead of the
 * token value. Call `.reveal()` only at the single point where the raw
 * value is placed into an HTTP body.
 */
// RedactedGithubToken 聚合命令处理相关状态与操作，把同一职责的行为收束到类实例中。
export class RedactedGithubToken {
  readonly #value: string
  // 构造函数接收 raw: string，把外部输入整理成实例可复用的内部状态。
  constructor(raw: string) {
    // 斜杠命令 api在这里处理 `this.#value = raw`，完成这一小步状态转换。
    this.#value = raw
  }
  // reveal 使用 无 完成命令处理里的对应操作。
  reveal(): string {
    // 返回 `this.#value`，作为命令处理这次计算的结果。
    return this.#value
  }
  // toString 使用 无 完成命令处理里的对应操作。
  toString(): string {
    // 返回 `'[REDACTED:gh-token]'`，作为命令处理这次计算的结果。
    return '[REDACTED:gh-token]'
  }
  // toJSON 使用 无 完成命令处理里的对应操作。
  toJSON(): string {
    // 返回 `'[REDACTED:gh-token]'`，作为命令处理这次计算的结果。
    return '[REDACTED:gh-token]'
  }
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    // 返回 `'[REDACTED:gh-token]'`，作为命令处理这次计算的结果。
    return '[REDACTED:gh-token]'
  }
}

// ImportTokenResult 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ImportTokenResult = {
  github_username: string
}

// ImportTokenError 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ImportTokenError =
  | { kind: 'not_signed_in' }
  | { kind: 'invalid_token' }
  | { kind: 'server'; status: number }
  | { kind: 'network' }

/**
 * POSTs a GitHub token to the CCR backend, which validates it against
 * GitHub's /user endpoint and stores it Fernet-encrypted in sync_user_tokens.
 * The stored token satisfies the same read paths as an OAuth token, so
 * clone/push in claude.ai/code works immediately after this succeeds.
 */
// importGithubToken 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function importGithubToken(
  token: RedactedGithubToken,
): Promise<
  | { ok: true; result: ImportTokenResult }
  | { ok: false; error: ImportTokenError }
> {
  // accessToken 先占位，稍后的条件分支会根据实际输入补齐它。
  let accessToken: string, orgUUID: string
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 斜杠命令 api在这里处理 `;({ accessToken, orgUUID } = await prepareApiRequest())`，完成这一小步状态转换。
    ;({ accessToken, orgUUID } = await prepareApiRequest())
  } catch {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { ok: false, error: { kind: 'not_signed_in' } }
  }

  // URL读取`getOauthConfig`，供命令处理后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/code/github/import-token`
  // 请求头 集中保存命令处理斜杠命令 api要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'anthropic-beta': CCR_BYOC_BETA_HEADER,
    'x-organization-uuid': orgUUID,
  }

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应 等待 `axios.post<ImportTokenResult>(`，确保继续执行前已有结果。
    const response = await axios.post<ImportTokenResult>(
      url,
      { token: token.reveal() },
      // 这个回调绑定到 { headers, timeout: 15000, validateStatus: () => true },，负责命令处理在该局部场景下的响应。
      { headers, timeout: 15000, validateStatus: () => true },
    )
    // 满足 `response.status === 200` 时，命令处理执行该分支。
    if (response.status === 200) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { ok: true, result: response.data }
    }
    // 满足 `response.status === 400` 时，命令处理执行该分支。
    if (response.status === 400) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { ok: false, error: { kind: 'invalid_token' } }
    }
    // 满足 `response.status === 401` 时，命令处理执行该分支。
    if (response.status === 401) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { ok: false, error: { kind: 'not_signed_in' } }
    }
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`import-token returned ${response.status}`, {
      level: 'error',
    })
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { ok: false, error: { kind: 'server', status: response.status } }
  } catch (err) {
    // 满足 `axios.isAxiosError(err)` 时，命令处理执行该分支。
    if (axios.isAxiosError(err)) {
      // err.config.data would contain the POST body with the raw token.
      // Do not include it in any log. The error code alone is enough.
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`import-token network error: ${err.code ?? 'unknown'}`, {
        level: 'error',
      })
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { ok: false, error: { kind: 'network' } }
  }
}

// hasExistingEnvironment 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function hasExistingEnvironment(): Promise<boolean> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // envs 集合读取`fetchEnvironments`，供命令处理后续处理使用。
    const envs = await fetchEnvironments()
    // 返回 `envs.length > 0`，作为命令处理这次计算的结果。
    return envs.length > 0
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Best-effort default environment creation. Mirrors the web onboarding's
 * DEFAULT_CLOUD_ENVIRONMENT_REQUEST so a first-time user lands on the
 * composer instead of env-setup. Checks for existing environments first
 * so re-running /web-setup doesn't pile up duplicates. Failures are
 * non-fatal — the token import already succeeded, and the web state
 * machine falls back to env-setup on next load.
 */
// createDefaultEnvironment 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createDefaultEnvironment(): Promise<boolean> {
  // accessToken 先占位，稍后的条件分支会根据实际输入补齐它。
  let accessToken: string, orgUUID: string
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 斜杠命令 api在这里处理 `;({ accessToken, orgUUID } = await prepareApiRequest())`，完成这一小步状态转换。
    ;({ accessToken, orgUUID } = await prepareApiRequest())
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `await hasExistingEnvironment()` 时，命令处理执行该分支。
  if (await hasExistingEnvironment()) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // The /private/organizations/{org}/ path rejects CLI OAuth tokens (wrong
  // auth dep). The public path uses build_flexible_auth — same path
  // fetchEnvironments() uses. Org is passed via x-organization-uuid header.
  // URL读取`getOauthConfig`，供命令处理后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/environment_providers/cloud/create`
  // 请求头 集中保存命令处理斜杠命令 api要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应保存`axios.post`，供命令处理后续处理使用。
    const response = await axios.post(
      url,
      {
        name: 'Default',
        kind: 'anthropic_cloud',
        description: 'Default - trusted network access',
        config: {
          environment_type: 'anthropic',
          cwd: '/home/user',
          init_script: null,
          environment: {},
          languages: [
            { name: 'python', version: '3.11' },
            { name: 'node', version: '20' },
          ],
          network_config: {
            allowed_hosts: [],
            allow_default_hosts: true,
          },
        },
      },
      // 这个回调绑定到 { headers, timeout: 15000, validateStatus: () => true },，负责命令处理在该局部场景下的响应。
      { headers, timeout: 15000, validateStatus: () => true },
    )
    // 返回 `response.status >= 200 && response.status < 300`，作为命令处理这次计算的结果。
    return response.status >= 200 && response.status < 300
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/** Returns true when the user has valid Claude OAuth credentials. */
// isSignedIn 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isSignedIn(): Promise<boolean> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `prepareApiRequest()` 完成，再继续斜杠命令 api的异步流程。
    await prepareApiRequest()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// getCodeWebUrl 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCodeWebUrl(): string {
  // 返回 ``${getOauthConfig().CLAUDE_AI_ORIGIN}/code``，作为命令处理这次计算的结果。
  return `${getOauthConfig().CLAUDE_AI_ORIGIN}/code`
}
