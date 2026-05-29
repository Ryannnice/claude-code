// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准session History的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../utils/teleport/api.js'

// HISTORY_PAGE_SIZE保存`100`，供session History后续判断或输出使用。
export const HISTORY_PAGE_SIZE = 100

// HistoryPage 固化session History里传递的数据形状，帮助调用方按同一结构读写字段。
export type HistoryPage = {
  /** Chronological order within the page. */
  events: SDKMessage[]
  /** Oldest event ID in this page → before_id cursor for next-older page. */
  firstId: string | null
  /** true = older events exist. */
  hasMore: boolean
}

// SessionEventsResponse 固化session History里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionEventsResponse = {
  data: SDKMessage[]
  has_more: boolean
  first_id: string | null
  last_id: string | null
}

// HistoryAuthCtx 固化session History里传递的数据形状，帮助调用方按同一结构读写字段。
export type HistoryAuthCtx = {
  baseUrl: string
  headers: Record<string, string>
}

/** Prepare auth + headers + base URL once, reuse across pages. */
// createHistoryAuthCtx 封装sessionHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createHistoryAuthCtx(
  sessionId: string,
): Promise<HistoryAuthCtx> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少session History对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()
  // 返回结构化结果，集中表达session History已经整理出的状态。
  return {
    baseUrl: `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/events`,
    headers: {
      ...getOAuthHeaders(accessToken),
      'anthropic-beta': 'ccr-byoc-2025-07-29',
      'x-organization-uuid': orgUUID,
    },
  }
}

// fetchPage 封装sessionHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchPage(
  ctx: HistoryAuthCtx,
  params: Record<string, string | number | boolean>,
  label: string,
): Promise<HistoryPage | null> {
  // resp 等待 `axios`，确保继续执行前已有结果。
  const resp = await axios
    .get<SessionEventsResponse>(ctx.baseUrl, {
      headers: ctx.headers,
      params,
      timeout: 15000,
      // 这个回调绑定到 validateStatus: () => true,，负责session History在该局部场景下的响应。
      validateStatus: () => true,
    })
    .catch(() => null)
  // `!resp || resp.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (!resp || resp.status !== 200) {
    // 记录session History运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[${label}] HTTP ${resp?.status ?? 'error'}`)
    // 返回 `null`，作为session History这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达session History已经整理出的状态。
  return {
    events: Array.isArray(resp.data.data) ? resp.data.data : [],
    firstId: resp.data.first_id,
    hasMore: resp.data.has_more,
  }
}

/**
 * Newest page: last `limit` events, chronological, via anchor_to_latest.
 * has_more=true means older events exist.
 */
// fetchLatestEvents 封装sessionHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchLatestEvents(
  ctx: HistoryAuthCtx,
  limit = HISTORY_PAGE_SIZE,
): Promise<HistoryPage | null> {
  // 返回 `fetchPage(ctx, { limit, anchor_to_latest: true }, 'fetchLatestEvents')`，作为session History这次计算的结果。
  return fetchPage(ctx, { limit, anchor_to_latest: true }, 'fetchLatestEvents')
}

/** Older page: events immediately before `beforeId` cursor. */
// fetchOlderEvents 封装sessionHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchOlderEvents(
  ctx: HistoryAuthCtx,
  beforeId: string,
  limit = HISTORY_PAGE_SIZE,
): Promise<HistoryPage | null> {
  // 返回 `fetchPage(ctx, { limit, before_id: beforeId }, 'fetchOlderEvents')`，作为session History这次计算的结果。
  return fetchPage(ctx, { limit, before_id: beforeId }, 'fetchOlderEvents')
}
