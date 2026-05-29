// 类型依赖 { Attributes } 来自 @opentelemetry/api，用于校准共享工具的数据契约。
import type { Attributes } from '@opentelemetry/api'
// 引入 getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from 'src/bootstrap/state.js'
// 引入 getOauthAccountInfo，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { getOauthAccountInfo } from './auth.js'
// 引入 getOrCreateUserID，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getOrCreateUserID } from './config.js'
// 引入 envDynamic，将 ./envDynamic.js 中已经封装好的能力接到本文件流程里。
import { envDynamic } from './envDynamic.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 toTaggedId，将 ./taggedId.js 中已经封装好的能力接到本文件流程里。
import { toTaggedId } from './taggedId.js'

// Default configuration for metrics cardinality
// METRICS_CARDINALITY_DEFAULTS 集合集中保存共享工具 telemetry Attributes要一起传递的字段。
const METRICS_CARDINALITY_DEFAULTS = {
  OTEL_METRICS_INCLUDE_SESSION_ID: true,
  OTEL_METRICS_INCLUDE_VERSION: false,
  OTEL_METRICS_INCLUDE_ACCOUNT_UUID: true,
}

// shouldIncludeAttribute 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldIncludeAttribute(
  envVar: keyof typeof METRICS_CARDINALITY_DEFAULTS,
): boolean {
  // defaultValue保存`METRICS_CARDINALITY_DEFAULTS[envVar]`，供共享工具 telemetry Attributes后续判断或输出使用。
  const defaultValue = METRICS_CARDINALITY_DEFAULTS[envVar]
  // envValue保存`process.env[envVar]`，供共享工具 telemetry Attributes后续判断或输出使用。
  const envValue = process.env[envVar]

  // 满足 `envValue === undefined` 时，共享工具执行该分支。
  if (envValue === undefined) {
    // 返回 `defaultValue`，作为共享工具这次计算的结果。
    return defaultValue
  }

  // 返回 `isEnvTruthy(envValue)`，作为共享工具这次计算的结果。
  return isEnvTruthy(envValue)
}

// getTelemetryAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTelemetryAttributes(): Attributes {
  // userId读取`getOrCreateUserID`，供共享工具后续处理使用。
  const userId = getOrCreateUserID()
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()

  // attributes 集合 集中保存共享工具 telemetry Attributes要一起传递的字段。
  const attributes: Attributes = {
    'user.id': userId,
  }

  // 满足 `shouldIncludeAttribute('OTEL_METRICS_INCLUDE_SESSION_ID')` 时，共享工具执行该分支。
  if (shouldIncludeAttribute('OTEL_METRICS_INCLUDE_SESSION_ID')) {
    // id'更新为 `sessionId`，确保共享工具 telemetry Attributes后续读取最新状态。
    attributes['session.id'] = sessionId
  }
  // 满足 `shouldIncludeAttribute('OTEL_METRICS_INCLUDE_VERSION')` 时，共享工具执行该分支。
  if (shouldIncludeAttribute('OTEL_METRICS_INCLUDE_VERSION')) {
    // version'更新为 `MACRO.VERSION`，确保共享工具 telemetry Attributes后续读取最新状态。
    attributes['app.version'] = MACRO.VERSION
  }

  // Only include OAuth account data when actively using OAuth authentication
  // oauthAccount 数量读取`getOauthAccountInfo`，供共享工具后续处理使用。
  const oauthAccount = getOauthAccountInfo()
  // 满足 `oauthAccount` 时，共享工具执行该分支。
  if (oauthAccount) {
    // orgId统计`oauthAccount.organizationUuid` 整理出中间结果，供共享工具 telemetry Attributes后续步骤使用。
    const orgId = oauthAccount.organizationUuid
    // email统计`oauthAccount.emailAddress`，供后续判断或组装使用。
    const email = oauthAccount.emailAddress
    // accountUuid 数量 命名 `oauthAccount.accountUuid`，让后续代码直接表达这个值的用途。
    const accountUuid = oauthAccount.accountUuid

    // 满足 `orgId` 时，共享工具执行该分支。
    if (orgId) attributes['organization.id'] = orgId
    // 满足 `email` 时，共享工具执行该分支。
    if (email) attributes['user.email'] = email

    // 共享工具在这里按实际状态进入对应分支。
    if (
      accountUuid &&
      shouldIncludeAttribute('OTEL_METRICS_INCLUDE_ACCOUNT_UUID')
    ) {
      // account_uuid' 数量更新为 `accountUuid`，确保共享工具 telemetry Attributes后续读取最新状态。
      attributes['user.account_uuid'] = accountUuid
      // 共享工具 telemetry Attributes在这里处理 `attributes['user.account_id'] =`，完成这一小步状态转换。
      attributes['user.account_id'] =
        process.env.CLAUDE_CODE_ACCOUNT_TAGGED_ID ||
        toTaggedId('user', accountUuid)
    }
  }

  // Add terminal type if available
  // 满足 `envDynamic.terminal` 时，共享工具执行该分支。
  if (envDynamic.terminal) {
    // type'更新为 `envDynamic.terminal`，确保共享工具 telemetry Attributes后续读取最新状态。
    attributes['terminal.type'] = envDynamic.terminal
  }

  // 返回 `attributes`，作为共享工具这次计算的结果。
  return attributes
}
