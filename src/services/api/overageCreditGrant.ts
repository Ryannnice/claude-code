// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 getOauthAccountInfo 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getOauthAccountInfo } from '../../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js'

// OverageCreditGrantInfo 固化API 服务 overage Credit Grant里传递的数据形状，帮助调用方按同一结构读写字段。
export type OverageCreditGrantInfo = {
  available: boolean
  eligible: boolean
  granted: boolean
  amount_minor_units: number | null
  currency: string | null
}

// CachedGrantEntry 固化API 服务 overage Credit Grant里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedGrantEntry = {
  info: OverageCreditGrantInfo
  timestamp: number
}

// CACHE_TTL_MS 缓存保存`60 * 60 * 1000 // 1 hour`，供后续判断或组装使用。
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Fetch the current user's overage credit grant eligibility from the backend.
 * The backend resolves tier-specific amounts and role-based claim permission,
 * so the CLI just reads the response without replicating that logic.
 */
// fetchOverageCreditGrant 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchOverageCreditGrant(): Promise<OverageCreditGrantInfo | null> {
  // 保护这一段可能失败的API 服务 overage Credit Grant操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 overage Credit Grant对同一对象的重复访问。
    const { accessToken, orgUUID } = await prepareApiRequest()
    // URL读取`getOauthConfig`，供API 服务 overage Credit Grant后续处理使用。
    const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/overage_credit_grant`
    // 接口响应 等待 `axios.get<OverageCreditGrantInfo>(url, {`，确保继续执行前已有结果。
    const response = await axios.get<OverageCreditGrantInfo>(url, {
      headers: getOAuthHeaders(accessToken),
    })
    // 返回 `response.data`，作为API 服务 overage Credit Grant这次计算的结果。
    return response.data
  } catch (err) {
    // 记录API 服务 overage Credit Grant运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 返回 `null`，作为API 服务 overage Credit Grant这次计算的结果。
    return null
  }
}

/**
 * Get cached grant info. Returns null if no cache or cache is stale.
 * Callers should render nothing (not block) when this returns null —
 * refreshOverageCreditGrantCache fires lazily to populate it.
 */
// getCachedOverageCreditGrant 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedOverageCreditGrant(): OverageCreditGrantInfo | null {
  // orgId读取`getOauthAccountInfo`，供API 服务 overage Credit Grant后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 overage Credit Grant继续依赖无效输入。
  if (!orgId) return null
  // cached 缓存读取`getGlobalConfig`，供API 服务 overage Credit Grant后续处理使用。
  const cached = getGlobalConfig().overageCreditGrantCache?.[orgId]
  // cached 缓存缺失时提前走兜底路径，避免API 服务 overage Credit Grant继续依赖无效输入。
  if (!cached) return null
  // 满足 `Date.now() - cached.timestamp > CACHE_TTL_MS` 时，API 服务 overage Credit Grant执行该分支。
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null
  // 返回 `cached.info`，作为API 服务 overage Credit Grant这次计算的结果。
  return cached.info
}

/**
 * Drop the current org's cached entry so the next read refetches.
 * Leaves other orgs' entries intact.
 */
// invalidateOverageCreditGrantCache 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function invalidateOverageCreditGrantCache(): void {
  // orgId读取`getOauthAccountInfo`，供API 服务 overage Credit Grant后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 overage Credit Grant继续依赖无效输入。
  if (!orgId) return
  // cache 缓存读取`getGlobalConfig`，供API 服务 overage Credit Grant后续处理使用。
  const cache = getGlobalConfig().overageCreditGrantCache
  // 组合条件 `!cache || !(orgId in cache)` 成立时，API 服务 overage Credit Grant才启用这条专门路径。
  if (!cache || !(orgId in cache)) return
  // 调用 saveGlobalConfig，触发API 服务 overage Credit Grant此处需要的副作用。
  saveGlobalConfig(prev => {
    // next 集中保存API 服务 overage Credit Grant要一起传递的字段。
    const next = { ...prev.overageCreditGrantCache }
    // API 服务 overage Credit Grant在这里处理 `delete next[orgId]`，完成这一小步状态转换。
    delete next[orgId]
    // 返回结构化结果，集中表达API 服务 overage Credit Grant已经整理出的状态。
    return { ...prev, overageCreditGrantCache: next }
  })
}

/**
 * Fetch and cache grant info. Fire-and-forget; call when an upsell surface
 * is about to render and the cache is empty.
 */
// refreshOverageCreditGrantCache 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshOverageCreditGrantCache(): Promise<void> {
  // 满足 `isEssentialTrafficOnly()` 时，API 服务 overage Credit Grant执行该分支。
  if (isEssentialTrafficOnly()) return
  // orgId读取`getOauthAccountInfo`，供API 服务 overage Credit Grant后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 overage Credit Grant继续依赖无效输入。
  if (!orgId) return
  // info读取`fetchOverageCreditGrant`，供API 服务 overage Credit Grant后续处理使用。
  const info = await fetchOverageCreditGrant()
  // info缺失时提前走兜底路径，避免API 服务 overage Credit Grant继续依赖无效输入。
  if (!info) return
  // Skip rewriting info if grant data is unchanged — avoids config write
  // amplification (inc-4552 pattern). Still refresh the timestamp so the
  // TTL-based staleness check in getCachedOverageCreditGrant doesn't keep
  // re-triggering API calls on every component mount.
  // 调用 saveGlobalConfig，触发API 服务 overage Credit Grant此处需要的副作用。
  saveGlobalConfig(prev => {
    // Derive from prev (lock-fresh) rather than a pre-lock getGlobalConfig()
    // read — saveConfigWithLock re-reads config from disk under the file lock,
    // so another CLI instance may have written between any outer read and lock
    // acquire.
    // prevCached 缓存 命名 `prev.overageCreditGrantCache?.[orgId]`，让后续代码直接表达这个值的用途。
    const prevCached = prev.overageCreditGrantCache?.[orgId]
    // existing保存`prevCached?.info`，供后续判断或组装使用。
    const existing = prevCached?.info
    // dataUnchanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dataUnchanged =
      existing &&
      existing.available === info.available &&
      existing.eligible === info.eligible &&
      existing.granted === info.granted &&
      existing.amount_minor_units === info.amount_minor_units &&
      existing.currency === info.currency
    // When data is unchanged and timestamp is still fresh, skip the write entirely
    // API 服务 overage Credit Grant在这里进入条件判断，后续代码按实际状态分流。
    if (
      dataUnchanged &&
      prevCached &&
      Date.now() - prevCached.timestamp <= CACHE_TTL_MS
    ) {
      // 返回 `prev`，作为API 服务 overage Credit Grant这次计算的结果。
      return prev
    }
    // entry 集中保存API 服务 overage Credit Grant要一起传递的字段。
    const entry: CachedGrantEntry = {
      info: dataUnchanged ? existing : info,
      timestamp: Date.now(),
    }
    // 返回结构化结果，集中表达API 服务 overage Credit Grant已经整理出的状态。
    return {
      ...prev,
      overageCreditGrantCache: {
        ...prev.overageCreditGrantCache,
        [orgId]: entry,
      },
    }
  })
}

/**
 * Format the grant amount for display. Returns null if amount isn't available
 * (not eligible, or currency we don't know how to format).
 */
// formatGrantAmount 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatGrantAmount(info: OverageCreditGrantInfo): string | null {
  // 组合条件 `info.amount_minor_units == null || !info.currency` 成立时，API 服务 overage Credit Grant才启用这条专门路径。
  if (info.amount_minor_units == null || !info.currency) return null
  // For now only USD; backend may expand later
  // 当 `info.currency.toUpperCase()` 匹配 `'USD'` 时，API 服务 overage Credit Grant执行对应分支。
  if (info.currency.toUpperCase() === 'USD') {
    // dollars 集合 命名 `info.amount_minor_units / 100`，让后续代码直接表达这个值的用途。
    const dollars = info.amount_minor_units / 100
    // 返回 `Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}``，作为API 服务 overage Credit Grant这次计算的结果。
    return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
  }
  // 返回 `null`，作为API 服务 overage Credit Grant这次计算的结果。
  return null
}

// 导出类型定义，让其他模块沿用API 服务 overage Credit Grant的数据契约。
export type { CachedGrantEntry as OverageCreditGrantCacheEntry }
