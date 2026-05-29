// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from 'src/constants/oauth.js'
// 接入 getOrganizationUUID 服务层能力，把外部通信或共享状态交给 src/services/oauth/client.js 处理。
import { getOrganizationUUID } from 'src/services/oauth/client.js'
// 引入 getClaudeAIOAuthTokens，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getClaudeAIOAuthTokens } from '../auth.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getOAuthHeaders，将 ./api.js 中已经封装好的能力接到本文件流程里。
import { getOAuthHeaders } from './api.js'

// EnvironmentKind 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvironmentKind = 'anthropic_cloud' | 'byoc' | 'bridge'
// EnvironmentState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvironmentState = 'active'

// EnvironmentResource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvironmentResource = {
  kind: EnvironmentKind
  environment_id: string
  name: string
  created_at: string
  state: EnvironmentState
}

// EnvironmentListResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvironmentListResponse = {
  environments: EnvironmentResource[]
  has_more: boolean
  first_id: string | null
  last_id: string | null
}

/**
 * Fetches the list of available environments from the Environment API
 * @returns Promise<EnvironmentResource[]> Array of available environments
 * @throws Error if the API request fails or no access token is available
 */
// fetchEnvironments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchEnvironments(): Promise<EnvironmentResource[]> {
  // accessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const accessToken = getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!accessToken) {
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

  // URL读取`getOauthConfig`，供共享工具后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/environment_providers`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 请求头集中保存共享工具 environments要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'x-organization-uuid': orgUUID,
    }

    // 接口响应 等待 `axios.get<EnvironmentListResponse>(url, {`，确保继续执行前已有结果。
    const response = await axios.get<EnvironmentListResponse>(url, {
      headers,
      timeout: 15000,
    })

    // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to fetch environments: ${response.status} ${response.statusText}`,
      )
    }

    // 返回 `response.data.environments`，作为共享工具这次计算的结果。
    return response.data.environments
  } catch (error) {
    // err保存`toError`，供共享工具后续处理使用。
    const err = toError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 抛出 new Error(`Failed to fetch environments: ${err.message}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Failed to fetch environments: ${err.message}`)
  }
}

/**
 * Creates a default anthropic_cloud environment for users who have none.
 * Uses the public environment_providers route (same auth as fetchEnvironments).
 */
// createDefaultCloudEnvironment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createDefaultCloudEnvironment(
  name: string,
): Promise<EnvironmentResource> {
  // accessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const accessToken = getClaudeAIOAuthTokens()?.accessToken
  // accessToken缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!accessToken) {
    // 抛出 new Error('No access token available')，阻止共享工具在无效状态下继续运行。
    throw new Error('No access token available')
  }
  // orgUUID读取`getOrganizationUUID`，供共享工具后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!orgUUID) {
    // 抛出 new Error('Unable to get organization UUID')，阻止共享工具在无效状态下继续运行。
    throw new Error('Unable to get organization UUID')
  }

  // URL读取`getOauthConfig`，供共享工具后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/environment_providers/cloud/create`
  // 接口响应 等待 `axios.post<EnvironmentResource>(`，确保继续执行前已有结果。
  const response = await axios.post<EnvironmentResource>(
    url,
    {
      name,
      kind: 'anthropic_cloud',
      description: '',
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
    {
      headers: {
        ...getOAuthHeaders(accessToken),
        'anthropic-beta': 'ccr-byoc-2025-07-29',
        'x-organization-uuid': orgUUID,
      },
      timeout: 15000,
    },
  )
  // 返回 `response.data`，作为共享工具这次计算的结果。
  return response.data
}
