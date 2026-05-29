// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  checkAdminRequestEligibility,
  createAdminRequest,
  getMyAdminRequests,
} from '../../services/api/adminRequests.js'
// 接入 invalidateOverageCreditGrantCache 服务层能力，把外部通信或共享状态交给 ../../services/api/overageCreditGrant.js 处理。
import { invalidateOverageCreditGrantCache } from '../../services/api/overageCreditGrant.js'
// 接入 ExtraUsage、fetchUtilization 服务层能力，把外部通信或共享状态交给 ../../services/api/usage.js 处理。
import { type ExtraUsage, fetchUtilization } from '../../services/api/usage.js'
// 复用 getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getSubscriptionType } from '../../utils/auth.js'
// 复用 hasClaudeAiBillingAccess 工具函数，把通用处理留在 ../../utils/billing.js 中维护。
import { hasClaudeAiBillingAccess } from '../../utils/billing.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'

// ExtraUsageResult 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type ExtraUsageResult =
  | { type: 'message'; value: string }
  | { type: 'browser-opened'; url: string; opened: boolean }

// runExtraUsage 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runExtraUsage(): Promise<ExtraUsageResult> {
  // 满足 `!getGlobalConfig().hasVisitedExtraUsage` 时，命令处理执行该分支。
  if (!getGlobalConfig().hasVisitedExtraUsage) {
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(prev => ({ ...prev, hasVisitedExtraUsage: true }))
  }
  // Invalidate only the current org's entry so a follow-up read refetches
  // the granted state. Separate from the visited flag since users may run
  // /extra-usage more than once while iterating on the claim flow.
  // 调用 invalidateOverageCreditGrantCache，触发命令处理此处需要的副作用。
  invalidateOverageCreditGrantCache()

  // subscriptionType读取`getSubscriptionType`，供命令处理后续处理使用。
  const subscriptionType = getSubscriptionType()
  // isTeamOrEnterprise 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isTeamOrEnterprise =
    subscriptionType === 'team' || subscriptionType === 'enterprise'
  // hasBillingAccess 集合记录 `hasClaudeAiBillingAccess` 是否成立，命令处理随后按该结果分支。
  const hasBillingAccess = hasClaudeAiBillingAccess()

  // 只有 `!hasBillingAccess && isTeamOrEnterprise` 满足时，命令处理才执行该分支。
  if (!hasBillingAccess && isTeamOrEnterprise) {
    // Mirror apps/claude-ai useHasUnlimitedOverage(): if overage is enabled
    // with no monthly cap, there is nothing to request. On fetch error, fall
    // through and let the user ask (matching web's "err toward show" behavior).
    // extraUsage 先占位，稍后的条件分支会根据实际输入补齐它。
    let extraUsage: ExtraUsage | null | undefined
    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // utilization读取`fetchUtilization`，供命令处理后续处理使用。
      const utilization = await fetchUtilization()
      // extraUsage更新为 `utilization?.extra_usage`，确保斜杠命令后续读取最新状态。
      extraUsage = utilization?.extra_usage
    } catch (error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
    }

    // 只有 `extraUsage?.is_enabled && extraUsage.monthly_limi` 满足时，命令处理才执行该分支。
    if (extraUsage?.is_enabled && extraUsage.monthly_limit === null) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'message',
        value:
          'Your organization already has unlimited extra usage. No request needed.',
      }
    }

    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // eligibility读取`checkAdminRequestEligibility`，供命令处理后续处理使用。
      const eligibility = await checkAdminRequestEligibility('limit_increase')
      // 满足 `eligibility?.is_allowed === false` 时，命令处理执行该分支。
      if (eligibility?.is_allowed === false) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'message',
          value: 'Please contact your admin to manage extra usage settings.',
        }
      }
    } catch (error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
      // If eligibility check fails, continue — the create endpoint will enforce if necessary
    }

    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // pendingOrDismissedRequests 请求数据读取`getMyAdminRequests`，供命令处理后续处理使用。
      const pendingOrDismissedRequests = await getMyAdminRequests(
        'limit_increase',
        ['pending', 'dismissed'],
      )
      // 只有 `pendingOrDismissedRequests && pendingOrDismissedR` 满足时，命令处理才执行该分支。
      if (pendingOrDismissedRequests && pendingOrDismissedRequests.length > 0) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'message',
          value:
            'You have already submitted a request for extra usage to your admin.',
        }
      }
    } catch (error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
      // Fall through to creating a new request below
    }

    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `createAdminRequest({` 完成，再继续斜杠命令 extra usage core的异步流程。
      await createAdminRequest({
        request_type: 'limit_increase',
        details: null,
      })
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'message',
        value: extraUsage?.is_enabled
          ? 'Request sent to your admin to increase extra usage.'
          : 'Request sent to your admin to enable extra usage.',
      }
    } catch (error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
      // Fall through to generic message below
    }

    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'message',
      value: 'Please contact your admin to manage extra usage settings.',
    }
  }

  // URL保存`isTeamOrEnterprise`，供后续判断或组装使用。
  const url = isTeamOrEnterprise
    ? 'https://claude.ai/admin-settings/usage'
    : 'https://claude.ai/settings/usage'

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // opened保存`openBrowser`，供命令处理后续处理使用。
    const opened = await openBrowser(url)
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'browser-opened', url, opened }
  } catch (error) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'message',
      value: `Failed to open browser. Please visit ${url} to manage extra usage.`,
    }
  }
}
