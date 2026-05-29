// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from 'src/services/analytics/growthbook.js'
// 引入 getIsNonInteractiveSession、getSdkBetas，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession, getSdkBetas } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  BEDROCK_EXTRA_PARAMS_HEADERS,
  CLAUDE_CODE_20250219_BETA_HEADER,
  CLI_INTERNAL_BETA_HEADER,
  CONTEXT_1M_BETA_HEADER,
  CONTEXT_MANAGEMENT_BETA_HEADER,
  INTERLEAVED_THINKING_BETA_HEADER,
  PROMPT_CACHING_SCOPE_BETA_HEADER,
  REDACT_THINKING_BETA_HEADER,
  STRUCTURED_OUTPUTS_BETA_HEADER,
  SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER,
  TOKEN_EFFICIENT_TOOLS_BETA_HEADER,
  TOOL_SEARCH_BETA_HEADER_1P,
  TOOL_SEARCH_BETA_HEADER_3P,
  WEB_SEARCH_BETA_HEADER,
} from '../constants/betas.js'
// 引入 OAUTH_BETA_HEADER，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { OAUTH_BETA_HEADER } from '../constants/oauth.js'
// 引入 isClaudeAISubscriber，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { isClaudeAISubscriber } from './auth.js'
// 引入 has1mContext，将 ./context.js 中已经封装好的能力接到本文件流程里。
import { has1mContext } from './context.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'
// 引入 getCanonicalName，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getCanonicalName } from './model/model.js'
// 引入 get3PModelCapabilityOverride，将 ./model/modelSupportOverrides.js 中已经封装好的能力接到本文件流程里。
import { get3PModelCapabilityOverride } from './model/modelSupportOverrides.js'
// 引入 getAPIProvider，将 ./model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './model/providers.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'

/**
 * SDK-provided betas that are allowed for API key users.
 * Only betas in this list can be passed via SDK options.
 */
// ALLOWED_SDK_BETAS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALLOWED_SDK_BETAS = [CONTEXT_1M_BETA_HEADER]

/**
 * Filter betas to only include those in the allowlist.
 * Returns allowed and disallowed betas separately.
 */
// partitionBetasByAllowlist 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function partitionBetasByAllowlist(betas: string[]): {
  allowed: string[]
  disallowed: string[]
} {
  // allowed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allowed: string[] = []
  // disallowed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const disallowed: string[] = []
  // 按顺序遍历 `betas` 中的beta，逐个交给共享工具处理。
  for (const beta of betas) {
    // 满足 `ALLOWED_SDK_BETAS.includes(beta)` 时，共享工具执行该分支。
    if (ALLOWED_SDK_BETAS.includes(beta)) {
      // allowed追加新条目，保持收集顺序与输入顺序一致。
      allowed.push(beta)
    } else {
      // disallowed追加新条目，保持收集顺序与输入顺序一致。
      disallowed.push(beta)
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { allowed, disallowed }
}

/**
 * Filter SDK betas to only include allowed ones.
 * Warns about disallowed betas and subscriber restrictions.
 * Returns undefined if no valid betas remain or if user is a subscriber.
 */
// filterAllowedSdkBetas 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterAllowedSdkBetas(
  sdkBetas: string[] | undefined,
): string[] | undefined {
  // !sdkBetas || sdkBetas 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!sdkBetas || sdkBetas.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // biome-ignore lint/suspicious/noConsole: intentional warning
    // 调用 console.warn，触发共享工具此处需要的副作用。
    console.warn(
      'Warning: Custom betas are only available for API key users. Ignoring provided betas.',
    )
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 从 `partitionBetasByAllowlist(sdkBetas)` 解构 allowed、disallowed，减少共享工具 betas对同一对象的重复访问。
  const { allowed, disallowed } = partitionBetasByAllowlist(sdkBetas)
  // 按顺序遍历 `disallowed` 中的beta，逐个交给共享工具处理。
  for (const beta of disallowed) {
    // biome-ignore lint/suspicious/noConsole: intentional warning
    // 调用 console.warn，触发共享工具此处需要的副作用。
    console.warn(
      `Warning: Beta header '${beta}' is not allowed. Only the following betas are supported: ${ALLOWED_SDK_BETAS.join(', ')}`,
    )
  }
  // 返回 `allowed.length > 0 ? allowed : undefined`，作为共享工具这次计算的结果。
  return allowed.length > 0 ? allowed : undefined
}

// Generally, foundry supports all 1P features;
// however out of an abundance of caution, we do not enable any which are behind an experiment

// modelSupportsISP 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsISP(model: string): boolean {
  // supported3P读取`get3PModelCapabilityOverride`，供共享工具后续处理使用。
  const supported3P = get3PModelCapabilityOverride(
    model,
    'interleaved_thinking',
  )
  // `supported3P` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (supported3P !== undefined) {
    // 返回 `supported3P`，作为共享工具这次计算的结果。
    return supported3P
  }
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // Foundry supports interleaved thinking for all models
  // 当 `provider` 匹配 `'foundry'` 时，共享工具执行对应分支。
  if (provider === 'foundry') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 当 `provider` 匹配 `'firstParty'` 时，共享工具执行对应分支。
  if (provider === 'firstParty') {
    // 返回 `!canonical.includes('claude-3-')`，作为共享工具这次计算的结果。
    return !canonical.includes('claude-3-')
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    canonical.includes('claude-opus-4') || canonical.includes('claude-sonnet-4')
  )
}

// vertexModelSupportsWebSearch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function vertexModelSupportsWebSearch(model: string): boolean {
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // Web search only supported on Claude 4.0+ models on Vertex
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    canonical.includes('claude-opus-4') ||
    canonical.includes('claude-sonnet-4') ||
    canonical.includes('claude-haiku-4')
  )
}

// Context management is supported on Claude 4+ models
// modelSupportsContextManagement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsContextManagement(model: string): boolean {
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // 当 `provider` 匹配 `'foundry'` 时，共享工具执行对应分支。
  if (provider === 'foundry') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 当 `provider` 匹配 `'firstParty'` 时，共享工具执行对应分支。
  if (provider === 'firstParty') {
    // 返回 `!canonical.includes('claude-3-')`，作为共享工具这次计算的结果。
    return !canonical.includes('claude-3-')
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    canonical.includes('claude-opus-4') ||
    canonical.includes('claude-sonnet-4') ||
    canonical.includes('claude-haiku-4')
  )
}

// @[MODEL LAUNCH]: Add the new model ID to this list if it supports structured outputs.
// modelSupportsStructuredOutputs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsStructuredOutputs(model: string): boolean {
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // Structured outputs only supported on firstParty and Foundry (not Bedrock/Vertex yet)
  // `provider` 与 `'firstParty' && provider !== 'f...` 不一致时刷新派生状态，避免使用过期结果。
  if (provider !== 'firstParty' && provider !== 'foundry') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    canonical.includes('claude-sonnet-4-6') ||
    canonical.includes('claude-sonnet-4-5') ||
    canonical.includes('claude-opus-4-1') ||
    canonical.includes('claude-opus-4-5') ||
    canonical.includes('claude-opus-4-6') ||
    canonical.includes('claude-haiku-4-5')
  )
}

// @[MODEL LAUNCH]: Add the new model if it supports auto mode (specifically PI probes) — ask in #proj-claude-code-safety-research.
// modelSupportsAutoMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsAutoMode(model: string): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，共享工具执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // m读取`getCanonicalName`，供共享工具后续处理使用。
    const m = getCanonicalName(model)
    // External: firstParty-only at launch (PI probes not wired for
    // Bedrock/Vertex/Foundry yet). Checked before allowModels so the GB
    // override can't enable auto mode on unsupported providers.
    // `process.env.USER_TYPE` 与 `'ant' && getAPIProvider() !== '...` 不一致时刷新派生状态，避免使用过期结果。
    if (process.env.USER_TYPE !== 'ant' && getAPIProvider() !== 'firstParty') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // GrowthBook override: tengu_auto_mode_config.allowModels force-enables
    // auto mode for listed models, bypassing the denylist/allowlist below.
    // Exact model IDs (e.g. "claude-strudel-v6-p") match only that model;
    // canonical names (e.g. "claude-strudel") match the whole family.
    // 配置读取`getFeatureValue_CACHED_MAY_BE_STALE<{` 整理出中间结果，供共享工具 betas后续步骤使用。
    const config = getFeatureValue_CACHED_MAY_BE_STALE<{
      allowModels?: string[]
    }>('tengu_auto_mode_config', {})
    // rawLower保存`model.toLowerCase`，供共享工具后续处理使用。
    const rawLower = model.toLowerCase()
    // 共享工具在这里按实际状态进入对应分支。
    if (
      config?.allowModels?.some(
        // am更新为 `> am.toLowerCase() === rawLower || am.toLowerCase() === m`，确保共享工具后续读取最新状态。
        am => am.toLowerCase() === rawLower || am.toLowerCase() === m,
      )
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // Denylist: block known-unsupported claude models, allow everything else (ant-internal models etc.)
      // 满足 `m.includes('claude-3-')` 时，共享工具执行该分支。
      if (m.includes('claude-3-')) return false
      // claude-*-4 not followed by -[6-9]: blocks bare -4, -4-YYYYMMDD, -4@, -4-0 thru -4-5
      // 满足 `/claude-(opus|sonnet|haiku)-4(?!-[6-9])/.test(m)` 时，共享工具执行该分支。
      if (/claude-(opus|sonnet|haiku)-4(?!-[6-9])/.test(m)) return false
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // External allowlist (firstParty already checked above).
    // 返回 `/^claude-(opus|sonnet)-4-6/.test(m)`，作为共享工具这次计算的结果。
    return /^claude-(opus|sonnet)-4-6/.test(m)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get the correct tool search beta header for the current API provider.
 * - Claude API / Foundry: advanced-tool-use-2025-11-20
 * - Vertex AI / Bedrock: tool-search-tool-2025-10-19
 */
// getToolSearchBetaHeader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolSearchBetaHeader(): string {
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // 当 `provider` 匹配 `'vertex' || provider === 'b...` 时，共享工具执行对应分支。
  if (provider === 'vertex' || provider === 'bedrock') {
    // 返回 `TOOL_SEARCH_BETA_HEADER_3P`，作为共享工具这次计算的结果。
    return TOOL_SEARCH_BETA_HEADER_3P
  }
  // 返回 `TOOL_SEARCH_BETA_HEADER_1P`，作为共享工具这次计算的结果。
  return TOOL_SEARCH_BETA_HEADER_1P
}

/**
 * Check if experimental betas should be included.
 * These are betas that are only available on firstParty provider
 * and may not be supported by proxies or other providers.
 */
// shouldIncludeFirstPartyOnlyBetas 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldIncludeFirstPartyOnlyBetas(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    (getAPIProvider() === 'firstParty' || getAPIProvider() === 'foundry') &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)
  )
}

/**
 * Global-scope prompt caching is firstParty only. Foundry is excluded because
 * GrowthBook never bucketed Foundry users into the rollout experiment — the
 * treatment data is firstParty-only.
 */
// shouldUseGlobalCacheScope 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldUseGlobalCacheScope(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getAPIProvider() === 'firstParty' &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS)
  )
}

// getAllModelBetas 集合保存`memoize`，供共享工具后续处理使用。
export const getAllModelBetas = memoize((model: string): string[] => {
  // betaHeaders 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const betaHeaders = []
  // isHaiku记录 `getCanonicalName` 是否成立，共享工具随后按该结果分支。
  const isHaiku = getCanonicalName(model).includes('haiku')
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()
  // includeFirstPartyOnlyBetas 集合保存`shouldIncludeFirstPartyOnlyBetas`，供共享工具后续处理使用。
  const includeFirstPartyOnlyBetas = shouldIncludeFirstPartyOnlyBetas()

  // isHaiku缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isHaiku) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(CLAUDE_CODE_20250219_BETA_HEADER)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      process.env.USER_TYPE === 'ant' &&
      process.env.CLAUDE_CODE_ENTRYPOINT === 'cli'
    ) {
      // 满足 `CLI_INTERNAL_BETA_HEADER` 时，共享工具执行该分支。
      if (CLI_INTERNAL_BETA_HEADER) {
        // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
        betaHeaders.push(CLI_INTERNAL_BETA_HEADER)
      }
    }
  }
  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(OAUTH_BETA_HEADER)
  }
  // 满足 `has1mContext(model)` 时，共享工具执行该分支。
  if (has1mContext(model)) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(CONTEXT_1M_BETA_HEADER)
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !isEnvTruthy(process.env.DISABLE_INTERLEAVED_THINKING) &&
    modelSupportsISP(model)
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(INTERLEAVED_THINKING_BETA_HEADER)
  }

  // Skip the API-side Haiku thinking summarizer — the summary is only used
  // for ctrl+o display, which interactive users rarely open. The API returns
  // redacted_thinking blocks instead; AssistantRedactedThinkingMessage already
  // renders those as a stub. SDK / print-mode keep summaries because callers
  // may iterate over thinking content. Users can opt back in via settings.json
  // showThinkingSummaries.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    includeFirstPartyOnlyBetas &&
    modelSupportsISP(model) &&
    !getIsNonInteractiveSession() &&
    getInitialSettings().showThinkingSummaries !== true
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(REDACT_THINKING_BETA_HEADER)
  }

  // POC: server-side connector-text summarization (anti-distillation). The
  // API buffers assistant text between tool calls, summarizes it, and returns
  // the summary with a signature so the original can be restored on subsequent
  // turns — same mechanism as thinking blocks. Ant-only while we measure
  // TTFT/TTLT/capacity; betas already flow to tengu_api_success for splitting.
  // Backend independently requires Capability.ANTHROPIC_INTERNAL_RESEARCH.
  //
  // USE_CONNECTOR_TEXT_SUMMARIZATION is tri-state: =1 forces on (opt-in even
  // if GB is off), =0 forces off (opt-out of a GB rollout you were bucketed
  // into), unset defers to GB.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER &&
    process.env.USER_TYPE === 'ant' &&
    includeFirstPartyOnlyBetas &&
    !isEnvDefinedFalsy(process.env.USE_CONNECTOR_TEXT_SUMMARIZATION) &&
    (isEnvTruthy(process.env.USE_CONNECTOR_TEXT_SUMMARIZATION) ||
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_slate_prism', false))
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER)
  }

  // Add context management beta for tool clearing (ant opt-in) or thinking preservation
  // antOptedIntoToolClearing 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const antOptedIntoToolClearing =
    isEnvTruthy(process.env.USE_API_CONTEXT_MANAGEMENT) &&
    process.env.USER_TYPE === 'ant'

  // thinkingPreservationEnabled保存`modelSupportsContextManagement`，供共享工具后续处理使用。
  const thinkingPreservationEnabled = modelSupportsContextManagement(model)

  // 共享工具在这里按实际状态进入对应分支。
  if (
    shouldIncludeFirstPartyOnlyBetas() &&
    (antOptedIntoToolClearing || thinkingPreservationEnabled)
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(CONTEXT_MANAGEMENT_BETA_HEADER)
  }
  // Add strict tool use beta if experiment is enabled.
  // Gate on includeFirstPartyOnlyBetas: CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS
  // already strips schema.strict from tool bodies at api.ts's choke point, but
  // this header was escaping that kill switch. Proxy gateways that look like
  // firstParty but forward to Vertex reject this header with 400.
  // github.com/deshaw/anthropic-issues/issues/5
  // strictToolsEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const strictToolsEnabled =
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_tool_pear')
  // 3P default: false. API rejects strict + token-efficient-tools together
  // (tool_use.py:139), so these are mutually exclusive — strict wins.
  // tokenEfficientToolsEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const tokenEfficientToolsEnabled =
    !strictToolsEnabled &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_json_tools', false)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    includeFirstPartyOnlyBetas &&
    modelSupportsStructuredOutputs(model) &&
    strictToolsEnabled
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(STRUCTURED_OUTPUTS_BETA_HEADER)
  }
  // JSON tool_use format (FC v3) — ~4.5% output token reduction vs ANTML.
  // Sends the v2 header (2026-03-28) added in anthropics/anthropic#337072 to
  // isolate the CC A/B cohort from ~9.2M/week existing v1 senders. Ant-only
  // while the restored JsonToolUseOutputParser soaks.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    includeFirstPartyOnlyBetas &&
    tokenEfficientToolsEnabled
  ) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(TOKEN_EFFICIENT_TOOLS_BETA_HEADER)
  }

  // Add web search beta for Vertex Claude 4.0+ models only
  // 只有 `provider === 'vertex' && vertexModelSupportsWebSearch(model)` 满足时，共享工具才执行该分支。
  if (provider === 'vertex' && vertexModelSupportsWebSearch(model)) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(WEB_SEARCH_BETA_HEADER)
  }
  // Foundry only ships models that already support Web Search
  // 当 `provider` 匹配 `'foundry'` 时，共享工具执行对应分支。
  if (provider === 'foundry') {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(WEB_SEARCH_BETA_HEADER)
  }

  // Always send the beta header for 1P. The header is a no-op without a scope field.
  // 满足 `includeFirstPartyOnlyBetas` 时，共享工具执行该分支。
  if (includeFirstPartyOnlyBetas) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(PROMPT_CACHING_SCOPE_BETA_HEADER)
  }

  // If ANTHROPIC_BETAS is set, split it by commas and add to betaHeaders.
  // This is an explicit user opt-in, so honor it regardless of model.
  // 满足 `process.env.ANTHROPIC_BETAS` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_BETAS) {
    // betaHeaders 集合追加新条目，保持收集顺序与输入顺序一致。
    betaHeaders.push(
      ...process.env.ANTHROPIC_BETAS.split(',')
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(_ => _.trim())
        .filter(Boolean),
    )
  }
  // 返回 `betaHeaders`，作为共享工具这次计算的结果。
  return betaHeaders
})

// getModelBetas 集合保存`memoize`，供共享工具后续处理使用。
export const getModelBetas = memoize((model: string): string[] => {
  // modelBetas 集合读取`getAllModelBetas`，供共享工具后续处理使用。
  const modelBetas = getAllModelBetas(model)
  // 当 `getAPIProvider()` 匹配 `'bedrock'` 时，共享工具执行对应分支。
  if (getAPIProvider() === 'bedrock') {
    // 返回 `modelBetas.filter(b => !BEDROCK_EXTRA_PARAMS_HEADERS.has(b))`，作为共享工具这次计算的结果。
    return modelBetas.filter(b => !BEDROCK_EXTRA_PARAMS_HEADERS.has(b))
  }
  // 返回 `modelBetas`，作为共享工具这次计算的结果。
  return modelBetas
})

// getBedrockExtraBodyParamsBetas 集合保存`memoize`，供共享工具后续处理使用。
export const getBedrockExtraBodyParamsBetas = memoize(
  (model: string): string[] => {
    // modelBetas 集合读取`getAllModelBetas`，供共享工具后续处理使用。
    const modelBetas = getAllModelBetas(model)
    // 返回 `modelBetas.filter(b => BEDROCK_EXTRA_PARAMS_HEADERS.has(b))`，作为共享工具这次计算的结果。
    return modelBetas.filter(b => BEDROCK_EXTRA_PARAMS_HEADERS.has(b))
  },
)

/**
 * Merge SDK-provided betas with auto-detected model betas.
 * SDK betas are read from global state (set via setSdkBetas in main.tsx).
 * The betas are pre-filtered by filterAllowedSdkBetas which handles
 * subscriber checks and allowlist validation with warnings.
 *
 * @param options.isAgenticQuery - When true, ensures the beta headers needed
 *   for agentic queries are present. For non-Haiku models these are already
 *   included by getAllModelBetas(); for Haiku they're excluded since
 *   non-agentic calls (compaction, classifiers, token estimation) don't need them.
 */
// getMergedBetas 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMergedBetas(
  model: string,
  options?: { isAgenticQuery?: boolean },
): string[] {
  // baseBetas 集合读取`getModelBetas`，供共享工具后续处理使用。
  const baseBetas = [...getModelBetas(model)]

  // Agentic queries always need claude-code and cli-internal beta headers.
  // For non-Haiku models these are already in baseBetas; for Haiku they're
  // excluded by getAllModelBetas() since non-agentic Haiku calls don't need them.
  // 满足 `options?.isAgenticQuery` 时，共享工具执行该分支。
  if (options?.isAgenticQuery) {
    // 满足 `!baseBetas.includes(CLAUDE_CODE_20250219_BETA_HEADER)` 时，共享工具执行该分支。
    if (!baseBetas.includes(CLAUDE_CODE_20250219_BETA_HEADER)) {
      // baseBetas 集合追加新条目，保持收集顺序与输入顺序一致。
      baseBetas.push(CLAUDE_CODE_20250219_BETA_HEADER)
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      process.env.USER_TYPE === 'ant' &&
      process.env.CLAUDE_CODE_ENTRYPOINT === 'cli' &&
      CLI_INTERNAL_BETA_HEADER &&
      !baseBetas.includes(CLI_INTERNAL_BETA_HEADER)
    ) {
      // baseBetas 集合追加新条目，保持收集顺序与输入顺序一致。
      baseBetas.push(CLI_INTERNAL_BETA_HEADER)
    }
  }

  // sdkBetas 集合读取`getSdkBetas`，供共享工具后续处理使用。
  const sdkBetas = getSdkBetas()

  // !sdkBetas || sdkBetas 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!sdkBetas || sdkBetas.length === 0) {
    // 返回 `baseBetas`，作为共享工具这次计算的结果。
    return baseBetas
  }

  // Merge SDK betas without duplicates (already filtered by filterAllowedSdkBetas)
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...baseBetas, ...sdkBetas.filter(b => !baseBetas.includes(b))]
}

// clearBetasCaches 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBetasCaches(): void {
  // 调用 getAllModelBetas.cache?.clear?.()，完成这一处局部操作。
  getAllModelBetas.cache?.clear?.()
  // 调用 getModelBetas.cache?.clear?.()，完成这一处局部操作。
  getModelBetas.cache?.clear?.()
  // 调用 getBedrockExtraBodyParamsBetas.cache?.clear?.()，完成这一处局部操作。
  getBedrockExtraBodyParamsBetas.cache?.clear?.()
}
