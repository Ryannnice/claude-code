// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 CONTEXT_1M_BETA_HEADER，将 ../constants/betas.js 中已经封装好的能力接到本文件流程里。
import { CONTEXT_1M_BETA_HEADER } from '../constants/betas.js'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getCanonicalName，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getCanonicalName } from './model/model.js'
// 引入 getModelCapability，将 ./model/modelCapabilities.js 中已经封装好的能力接到本文件流程里。
import { getModelCapability } from './model/modelCapabilities.js'

// Model context window size (200k tokens for all models right now)
// MODEL_CONTEXT_WINDOW_DEFAULT保存`200_000`，供后续判断或组装使用。
export const MODEL_CONTEXT_WINDOW_DEFAULT = 200_000

// Maximum output tokens for compact operations
// COMPACT_MAX_OUTPUT_TOKENS 集合 命名 `20_000`，让后续代码直接表达这个值的用途。
export const COMPACT_MAX_OUTPUT_TOKENS = 20_000

// Default max output tokens
// MAX_OUTPUT_TOKENS_DEFAULT 命名 `32_000`，让后续代码直接表达这个值的用途。
const MAX_OUTPUT_TOKENS_DEFAULT = 32_000
// MAX_OUTPUT_TOKENS_UPPER_LIMIT保存`64_000`，供共享工具 context后续判断或输出使用。
const MAX_OUTPUT_TOKENS_UPPER_LIMIT = 64_000

// Capped default for slot-reservation optimization. BQ p99 output = 4,911
// tokens, so 32k/64k defaults over-reserve 8-16× slot capacity. With the cap
// enabled, <1% of requests hit the limit; those get one clean retry at 64k
// (see query.ts max_output_tokens_escalate). Cap is applied in
// claude.ts:getMaxOutputTokensForModel to avoid the growthbook→betas→context
// import cycle.
// CAPPED_DEFAULT_MAX_TOKENS 集合保存`8_000`，供后续判断或组装使用。
export const CAPPED_DEFAULT_MAX_TOKENS = 8_000
// ESCALATED_MAX_TOKENS 集合 命名 `64_000`，让后续代码直接表达这个值的用途。
export const ESCALATED_MAX_TOKENS = 64_000

/**
 * Check if 1M context is disabled via environment variable.
 * Used by C4E admins to disable 1M context for HIPAA compliance.
 */
// is1mContextDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function is1mContextDisabled(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_1M_CONTEXT)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_1M_CONTEXT)
}

// has1mContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function has1mContext(model: string): boolean {
  // 满足 `is1mContextDisabled()` 时，共享工具执行该分支。
  if (is1mContextDisabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `/\[1m\]/i.test(model)`，作为共享工具这次计算的结果。
  return /\[1m\]/i.test(model)
}

// @[MODEL LAUNCH]: Update this pattern if the new model supports 1M context
// modelSupports1M 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupports1M(model: string): boolean {
  // 满足 `is1mContextDisabled()` 时，共享工具执行该分支。
  if (is1mContextDisabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // 返回 `canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')`，作为共享工具这次计算的结果。
  return canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')
}

// getContextWindowForModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getContextWindowForModel(
  model: string,
  betas?: string[],
): number {
  // Allow override via environment variable (ant-only)
  // This takes precedence over all other context window resolution, including 1M detection,
  // so users can cap the effective context window for local decisions (auto-compact, etc.)
  // while still using a 1M-capable endpoint.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS
  ) {
    // override解析`parseInt`，供共享工具后续处理使用。
    const override = parseInt(process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS, 10)
    // 只有 `!isNaN(override) && override > 0` 满足时，共享工具才执行该分支。
    if (!isNaN(override) && override > 0) {
      // 返回 `override`，作为共享工具这次计算的结果。
      return override
    }
  }

  // [1m] suffix — explicit client-side opt-in, respected over all detection
  // 满足 `has1mContext(model)` 时，共享工具执行该分支。
  if (has1mContext(model)) {
    // 返回 `1_000_000`，作为共享工具这次计算的结果。
    return 1_000_000
  }

  // cap读取`getModelCapability`，供共享工具后续处理使用。
  const cap = getModelCapability(model)
  // 只有 `cap?.max_input_tokens && cap.max_input_tokens >=` 满足时，共享工具才执行该分支。
  if (cap?.max_input_tokens && cap.max_input_tokens >= 100_000) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      cap.max_input_tokens > MODEL_CONTEXT_WINDOW_DEFAULT &&
      is1mContextDisabled()
    ) {
      // 返回 `MODEL_CONTEXT_WINDOW_DEFAULT`，作为共享工具这次计算的结果。
      return MODEL_CONTEXT_WINDOW_DEFAULT
    }
    // 返回 `cap.max_input_tokens`，作为共享工具这次计算的结果。
    return cap.max_input_tokens
  }

  // 只有 `betas?.includes(CONTEXT_1M_BETA_HEADER) && modelSupports1M(model)` 满足时，共享工具才执行该分支。
  if (betas?.includes(CONTEXT_1M_BETA_HEADER) && modelSupports1M(model)) {
    // 返回 `1_000_000`，作为共享工具这次计算的结果。
    return 1_000_000
  }
  // 满足 `getSonnet1mExpTreatmentEnabled(model)` 时，共享工具执行该分支。
  if (getSonnet1mExpTreatmentEnabled(model)) {
    // 返回 `1_000_000`，作为共享工具这次计算的结果。
    return 1_000_000
  }
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // antModel读取`resolveAntModel`，供共享工具后续处理使用。
    const antModel = resolveAntModel(model)
    // 满足 `antModel?.contextWindow` 时，共享工具执行该分支。
    if (antModel?.contextWindow) {
      // 返回 `antModel.contextWindow`，作为共享工具这次计算的结果。
      return antModel.contextWindow
    }
  }
  // 返回 `MODEL_CONTEXT_WINDOW_DEFAULT`，作为共享工具这次计算的结果。
  return MODEL_CONTEXT_WINDOW_DEFAULT
}

// getSonnet1mExpTreatmentEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSonnet1mExpTreatmentEnabled(model: string): boolean {
  // 满足 `is1mContextDisabled()` 时，共享工具执行该分支。
  if (is1mContextDisabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Only applies to sonnet 4.6 without an explicit [1m] suffix
  // 满足 `has1mContext(model)` 时，共享工具执行该分支。
  if (has1mContext(model)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `!getCanonicalName(model).includes('sonnet-4-6')` 时，共享工具执行该分支。
  if (!getCanonicalName(model).includes('sonnet-4-6')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getGlobalConfig().clientDataCache?.['coral_reef_sonnet'] === 'true'`，作为共享工具这次计算的结果。
  return getGlobalConfig().clientDataCache?.['coral_reef_sonnet'] === 'true'
}

/**
 * Calculate context window usage percentage from token usage data.
 * Returns used and remaining percentages, or null values if no usage data.
 */
// calculateContextPercentages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateContextPercentages(
  currentUsage: {
    input_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
  } | null,
  contextWindowSize: number,
): { used: number | null; remaining: number | null } {
  // currentUsage缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!currentUsage) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { used: null, remaining: null }
  }

  // totalInputTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalInputTokens =
    currentUsage.input_tokens +
    currentUsage.cache_creation_input_tokens +
    currentUsage.cache_read_input_tokens

  // usedPercentage保存`Math.round`，供共享工具后续处理使用。
  const usedPercentage = Math.round(
    (totalInputTokens / contextWindowSize) * 100,
  )
  // clampedUsed保存`Math.min`，供共享工具后续处理使用。
  const clampedUsed = Math.min(100, Math.max(0, usedPercentage))

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    used: clampedUsed,
    remaining: 100 - clampedUsed,
  }
}

/**
 * Returns the model's default and upper limit for max output tokens.
 */
// getModelMaxOutputTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelMaxOutputTokens(model: string): {
  default: number
  upperLimit: number
} {
  // defaultTokens 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let defaultTokens: number
  // upperLimit 先占位，稍后的条件分支会根据实际输入补齐它。
  let upperLimit: number

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // antModel读取`resolveAntModel`，供共享工具后续处理使用。
    const antModel = resolveAntModel(model.toLowerCase())
    // 满足 `antModel` 时，共享工具执行该分支。
    if (antModel) {
      // defaultTokens 集合更新为 `antModel.defaultMaxTokens ?? MAX_OUTPUT_TOKENS_DEFAULT`，确保共享工具后续读取最新状态。
      defaultTokens = antModel.defaultMaxTokens ?? MAX_OUTPUT_TOKENS_DEFAULT
      // upperLimit更新为 `antModel.upperMaxTokensLimit ?? MAX_OUTPUT_TOKENS_UPPER_L...`，确保共享工具后续读取最新状态。
      upperLimit = antModel.upperMaxTokensLimit ?? MAX_OUTPUT_TOKENS_UPPER_LIMIT
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { default: defaultTokens, upperLimit }
    }
  }

  // m读取`getCanonicalName`，供共享工具后续处理使用。
  const m = getCanonicalName(model)

  // 满足 `m.includes('opus-4-6')` 时，共享工具执行该分支。
  if (m.includes('opus-4-6')) {
    // defaultTokens 集合更新为 `64_000`，确保共享工具后续读取最新状态。
    defaultTokens = 64_000
    // upperLimit更新为 `128_000`，确保共享工具后续读取最新状态。
    upperLimit = 128_000
  // 共享工具 context在这里处理 `} else if (m.includes('sonnet-4-6')) {`，完成这一小步状态转换。
  } else if (m.includes('sonnet-4-6')) {
    // defaultTokens 集合更新为 `32_000`，确保共享工具后续读取最新状态。
    defaultTokens = 32_000
    // upperLimit更新为 `128_000`，确保共享工具后续读取最新状态。
    upperLimit = 128_000
  // 共享工具 context在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    m.includes('opus-4-5') ||
    m.includes('sonnet-4') ||
    m.includes('haiku-4')
  ) {
    // defaultTokens 集合更新为 `32_000`，确保共享工具后续读取最新状态。
    defaultTokens = 32_000
    // upperLimit更新为 `64_000`，确保共享工具后续读取最新状态。
    upperLimit = 64_000
  // 共享工具 context在这里处理 `} else if (m.includes('opus-4-1') || m.includes('opus-4')) {`，完成这一小步状态转换。
  } else if (m.includes('opus-4-1') || m.includes('opus-4')) {
    // defaultTokens 集合更新为 `32_000`，确保共享工具后续读取最新状态。
    defaultTokens = 32_000
    // upperLimit更新为 `32_000`，确保共享工具后续读取最新状态。
    upperLimit = 32_000
  // 共享工具 context在这里处理 `} else if (m.includes('claude-3-opus')) {`，完成这一小步状态转换。
  } else if (m.includes('claude-3-opus')) {
    // defaultTokens 集合更新为 `4_096`，确保共享工具后续读取最新状态。
    defaultTokens = 4_096
    // upperLimit更新为 `4_096`，确保共享工具后续读取最新状态。
    upperLimit = 4_096
  // 共享工具 context在这里处理 `} else if (m.includes('claude-3-sonnet')) {`，完成这一小步状态转换。
  } else if (m.includes('claude-3-sonnet')) {
    // defaultTokens 集合更新为 `8_192`，确保共享工具后续读取最新状态。
    defaultTokens = 8_192
    // upperLimit更新为 `8_192`，确保共享工具后续读取最新状态。
    upperLimit = 8_192
  // 共享工具 context在这里处理 `} else if (m.includes('claude-3-haiku')) {`，完成这一小步状态转换。
  } else if (m.includes('claude-3-haiku')) {
    // defaultTokens 集合更新为 `4_096`，确保共享工具后续读取最新状态。
    defaultTokens = 4_096
    // upperLimit更新为 `4_096`，确保共享工具后续读取最新状态。
    upperLimit = 4_096
  // 共享工具 context在这里处理 `} else if (m.includes('3-5-sonnet') || m.includes('3-5-haiku')) {`，完成这一小步状态转换。
  } else if (m.includes('3-5-sonnet') || m.includes('3-5-haiku')) {
    // defaultTokens 集合更新为 `8_192`，确保共享工具后续读取最新状态。
    defaultTokens = 8_192
    // upperLimit更新为 `8_192`，确保共享工具后续读取最新状态。
    upperLimit = 8_192
  // 共享工具 context在这里处理 `} else if (m.includes('3-7-sonnet')) {`，完成这一小步状态转换。
  } else if (m.includes('3-7-sonnet')) {
    // defaultTokens 集合更新为 `32_000`，确保共享工具后续读取最新状态。
    defaultTokens = 32_000
    // upperLimit更新为 `64_000`，确保共享工具后续读取最新状态。
    upperLimit = 64_000
  } else {
    // defaultTokens 集合更新为 `MAX_OUTPUT_TOKENS_DEFAULT`，确保共享工具后续读取最新状态。
    defaultTokens = MAX_OUTPUT_TOKENS_DEFAULT
    // upperLimit更新为 `MAX_OUTPUT_TOKENS_UPPER_LIMIT`，确保共享工具后续读取最新状态。
    upperLimit = MAX_OUTPUT_TOKENS_UPPER_LIMIT
  }

  // cap读取`getModelCapability`，供共享工具后续处理使用。
  const cap = getModelCapability(model)
  // 只有 `cap?.max_tokens && cap.max_tokens >= 4_096` 满足时，共享工具才执行该分支。
  if (cap?.max_tokens && cap.max_tokens >= 4_096) {
    // upperLimit更新为 `cap.max_tokens`，确保共享工具后续读取最新状态。
    upperLimit = cap.max_tokens
    // defaultTokens 集合更新为 `Math.min(defaultTokens, upperLimit)`，确保共享工具后续读取最新状态。
    defaultTokens = Math.min(defaultTokens, upperLimit)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { default: defaultTokens, upperLimit }
}

/**
 * Returns the max thinking budget tokens for a given model. The max
 * thinking tokens should be strictly less than the max output tokens.
 *
 * Deprecated since newer models use adaptive thinking rather than a
 * strict thinking token budget.
 */
// getMaxThinkingTokensForModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxThinkingTokensForModel(model: string): number {
  // 返回 `getModelMaxOutputTokens(model).upperLimit - 1`，作为共享工具这次计算的结果。
  return getModelMaxOutputTokens(model).upperLimit - 1
}
