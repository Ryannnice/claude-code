// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js'

// AdminRequestType 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdminRequestType = 'limit_increase' | 'seat_upgrade'

// AdminRequestStatus 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdminRequestStatus = 'pending' | 'approved' | 'dismissed'

// AdminRequestSeatUpgradeDetails 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdminRequestSeatUpgradeDetails = {
  message?: string | null
  current_seat_tier?: string | null
}

// AdminRequestCreateParams 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdminRequestCreateParams =
  | {
      request_type: 'limit_increase'
      details: null
    }
  | {
      request_type: 'seat_upgrade'
      details: AdminRequestSeatUpgradeDetails
    }

// AdminRequest 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdminRequest = {
  uuid: string
  status: AdminRequestStatus
  requester_uuid?: string | null
  created_at: string
} & (
  | {
      request_type: 'limit_increase'
      details: null
    }
  | {
      request_type: 'seat_upgrade'
      details: AdminRequestSeatUpgradeDetails
    }
)

/**
 * Create an admin request (limit increase or seat upgrade).
 *
 * For Team/Enterprise users who don't have billing/admin permissions,
 * this creates a request that their admin can act on.
 *
 * If a pending request of the same type already exists for this user,
 * returns the existing request instead of creating a new one.
 */
// createAdminRequest 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createAdminRequest(
  params: AdminRequestCreateParams,
): Promise<AdminRequest> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 admin Requests对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // 请求头 集中保存API 服务 admin Requests要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供API 服务 admin Requests后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/admin_requests`

  // 接口响应 等待 `axios.post<AdminRequest>(url, params, { headers })`，确保继续执行前已有结果。
  const response = await axios.post<AdminRequest>(url, params, { headers })

  // 返回 `response.data`，作为API 服务 admin Requests这次计算的结果。
  return response.data
}

/**
 * Get pending admin request of a specific type for the current user.
 *
 * Returns the pending request if one exists, otherwise null.
 */
// getMyAdminRequests 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMyAdminRequests(
  requestType: AdminRequestType,
  statuses: AdminRequestStatus[],
): Promise<AdminRequest[] | null> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 admin Requests对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // 请求头 集中保存API 服务 admin Requests要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供API 服务 admin Requests后续处理使用。
  let url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/admin_requests/me?request_type=${requestType}`
  // 按顺序遍历 `statuses` 中的status 集合，逐个交给API 服务 admin Requests处理。
  for (const status of statuses) {
    // API 服务 admin Requests在这里处理 `url += `&statuses=${status}``，完成这一小步状态转换。
    url += `&statuses=${status}`
  }

  // 接口响应 等待 `axios.get<AdminRequest[] | null>(url, {`，确保继续执行前已有结果。
  const response = await axios.get<AdminRequest[] | null>(url, {
    headers,
  })

  // 返回 `response.data`，作为API 服务 admin Requests这次计算的结果。
  return response.data
}

// AdminRequestEligibilityResponse 固化API 服务 admin Requests里传递的数据形状，帮助调用方按同一结构读写字段。
type AdminRequestEligibilityResponse = {
  request_type: AdminRequestType
  is_allowed: boolean
}

/**
 * Check if a specific admin request type is allowed for this org.
 */
// checkAdminRequestEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAdminRequestEligibility(
  requestType: AdminRequestType,
): Promise<AdminRequestEligibilityResponse | null> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 admin Requests对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // 请求头 集中保存API 服务 admin Requests要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供API 服务 admin Requests后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/admin_requests/eligibility?request_type=${requestType}`

  // 接口响应 等待 `axios.get<AdminRequestEligibilityResponse>(url, {`，确保继续执行前已有结果。
  const response = await axios.get<AdminRequestEligibilityResponse>(url, {
    headers,
  })

  // 返回 `response.data`，作为API 服务 admin Requests这次计算的结果。
  return response.data
}
