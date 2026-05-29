// 类型依赖 { BetaUsage as Usage } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准cost tracker的数据契约。
import type { BetaUsage as Usage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 整理这一组导入，让cost tracker后续逻辑可以直接复用这些外部能力。
import {
  addToTotalCostState,
  addToTotalLinesChanged,
  getCostCounter,
  getModelUsage,
  getSdkBetas,
  getSessionId,
  getTokenCounter,
  getTotalAPIDuration,
  getTotalAPIDurationWithoutRetries,
  getTotalCacheCreationInputTokens,
  getTotalCacheReadInputTokens,
  getTotalCostUSD,
  getTotalDuration,
  getTotalInputTokens,
  getTotalLinesAdded,
  getTotalLinesRemoved,
  getTotalOutputTokens,
  getTotalToolDuration,
  getTotalWebSearchRequests,
  getUsageForModel,
  hasUnknownModelCost,
  resetCostState,
  resetStateForTests,
  setCostStateForRestore,
  setHasUnknownModelCost,
} from './bootstrap/state.js'
// 类型依赖 { ModelUsage } 来自 ./entrypoints/agentSdkTypes.js，用于校准cost tracker的数据契约。
import type { ModelUsage } from './entrypoints/agentSdkTypes.js'
// 整理这一组导入，让cost tracker后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from './services/analytics/index.js'
// 复用 getAdvisorUsage 工具函数，把通用处理留在 ./utils/advisor.js 中维护。
import { getAdvisorUsage } from './utils/advisor.js'
// 整理这一组导入，让cost tracker后续逻辑可以直接复用这些外部能力。
import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from './utils/config.js'
// 整理这一组导入，让cost tracker后续逻辑可以直接复用这些外部能力。
import {
  getContextWindowForModel,
  getModelMaxOutputTokens,
} from './utils/context.js'
// 复用 isFastModeEnabled 工具函数，把通用处理留在 ./utils/fastMode.js 中维护。
import { isFastModeEnabled } from './utils/fastMode.js'
// 复用 formatDuration、formatNumber 工具函数，把通用处理留在 ./utils/format.js 中维护。
import { formatDuration, formatNumber } from './utils/format.js'
// 类型依赖 { FpsMetrics } 来自 ./utils/fpsTracker.js，用于校准cost tracker的数据契约。
import type { FpsMetrics } from './utils/fpsTracker.js'
// 复用 getCanonicalName 工具函数，把通用处理留在 ./utils/model/model.js 中维护。
import { getCanonicalName } from './utils/model/model.js'
// 复用 calculateUSDCost 工具函数，把通用处理留在 ./utils/modelCost.js 中维护。
import { calculateUSDCost } from './utils/modelCost.js'
// 重新导出这一组成员，让cost tracker的公共 API 保持集中入口。
export {
  getTotalCostUSD as getTotalCost,
  getTotalDuration,
  getTotalAPIDuration,
  getTotalAPIDurationWithoutRetries,
  addToTotalLinesChanged,
  getTotalLinesAdded,
  getTotalLinesRemoved,
  getTotalInputTokens,
  getTotalOutputTokens,
  getTotalCacheReadInputTokens,
  getTotalCacheCreationInputTokens,
  getTotalWebSearchRequests,
  formatCost,
  hasUnknownModelCost,
  resetStateForTests,
  resetCostState,
  setHasUnknownModelCost,
  getModelUsage,
  getUsageForModel,
}

// StoredCostState 固化cost tracker里传递的数据形状，帮助调用方按同一结构读写字段。
type StoredCostState = {
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number
  totalLinesAdded: number
  totalLinesRemoved: number
  lastDuration: number | undefined
  modelUsage: { [modelName: string]: ModelUsage } | undefined
}

/**
 * Gets stored cost state from project config for a specific session.
 * Returns the cost data if the session ID matches, or undefined otherwise.
 * Use this to read costs BEFORE overwriting the config with saveCurrentSessionCosts().
 */
// getStoredSessionCosts 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStoredSessionCosts(
  sessionId: string,
): StoredCostState | undefined {
  // projectConfig 配置读取`getCurrentProjectConfig`，供cost tracker后续处理使用。
  const projectConfig = getCurrentProjectConfig()

  // Only return costs if this is the same session that was last saved
  // `projectConfig.lastSessionId` 与 `sessionId` 不一致时刷新派生状态，避免使用过期结果。
  if (projectConfig.lastSessionId !== sessionId) {
    // 返回 `undefined`，作为cost tracker这次计算的结果。
    return undefined
  }

  // Build model usage with context windows
  // modelUsage 先占位，稍后的条件分支会根据实际输入补齐它。
  let modelUsage: { [modelName: string]: ModelUsage } | undefined
  // 满足 `projectConfig.lastModelUsage` 时，cost tracker执行该分支。
  if (projectConfig.lastModelUsage) {
    // modelUsage更新为 `Object.fromEntries(`，确保cost-tracker后续读取最新状态。
    modelUsage = Object.fromEntries(
      // 调用 Object.entries，触发cost tracker此处需要的副作用。
      Object.entries(projectConfig.lastModelUsage).map(([model, usage]) => [
        model,
        {
          ...usage,
          contextWindow: getContextWindowForModel(model, getSdkBetas()),
          maxOutputTokens: getModelMaxOutputTokens(model).default,
        },
      ]),
    )
  }

  // 返回结构化结果，集中表达cost tracker已经整理出的状态。
  return {
    totalCostUSD: projectConfig.lastCost ?? 0,
    totalAPIDuration: projectConfig.lastAPIDuration ?? 0,
    totalAPIDurationWithoutRetries:
      projectConfig.lastAPIDurationWithoutRetries ?? 0,
    totalToolDuration: projectConfig.lastToolDuration ?? 0,
    totalLinesAdded: projectConfig.lastLinesAdded ?? 0,
    totalLinesRemoved: projectConfig.lastLinesRemoved ?? 0,
    lastDuration: projectConfig.lastDuration,
    modelUsage,
  }
}

/**
 * Restores cost state from project config when resuming a session.
 * Only restores if the session ID matches the last saved session.
 * @returns true if cost state was restored, false otherwise
 */
// restoreCostStateForSession 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreCostStateForSession(sessionId: string): boolean {
  // data读取`getStoredSessionCosts`，供cost tracker后续处理使用。
  const data = getStoredSessionCosts(sessionId)
  // data缺失时提前走兜底路径，避免cost tracker继续依赖无效输入。
  if (!data) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // setCostStateForRestore 写入新的状态值，使cost tracker后续读取保持一致。
  setCostStateForRestore(data)
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Saves the current session's costs to project config.
 * Call this before switching sessions to avoid losing accumulated costs.
 */
// saveCurrentSessionCosts 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveCurrentSessionCosts(fpsMetrics?: FpsMetrics): void {
  // 调用 saveCurrentProjectConfig，触发cost tracker此处需要的副作用。
  saveCurrentProjectConfig(current => ({
    ...current,
    lastCost: getTotalCostUSD(),
    lastAPIDuration: getTotalAPIDuration(),
    lastAPIDurationWithoutRetries: getTotalAPIDurationWithoutRetries(),
    lastToolDuration: getTotalToolDuration(),
    lastDuration: getTotalDuration(),
    lastLinesAdded: getTotalLinesAdded(),
    lastLinesRemoved: getTotalLinesRemoved(),
    lastTotalInputTokens: getTotalInputTokens(),
    lastTotalOutputTokens: getTotalOutputTokens(),
    lastTotalCacheCreationInputTokens: getTotalCacheCreationInputTokens(),
    lastTotalCacheReadInputTokens: getTotalCacheReadInputTokens(),
    lastTotalWebSearchRequests: getTotalWebSearchRequests(),
    lastFpsAverage: fpsMetrics?.averageFps,
    lastFpsLow1Pct: fpsMetrics?.low1PctFps,
    lastModelUsage: Object.fromEntries(
      // 调用 Object.entries，触发cost tracker此处需要的副作用。
      Object.entries(getModelUsage()).map(([model, usage]) => [
        model,
        {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadInputTokens: usage.cacheReadInputTokens,
          cacheCreationInputTokens: usage.cacheCreationInputTokens,
          webSearchRequests: usage.webSearchRequests,
          costUSD: usage.costUSD,
        },
      ]),
    ),
    lastSessionId: getSessionId(),
  }))
}

// formatCost 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatCost(cost: number, maxDecimalPlaces: number = 4): string {
  // 返回 ``$${cost > 0.5 ? round(cost, 100).toFixed(2) : cost.toFixed(maxDecimalP...`，作为cost tracker这次计算的结果。
  return `$${cost > 0.5 ? round(cost, 100).toFixed(2) : cost.toFixed(maxDecimalPlaces)}`
}

// formatModelUsage 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatModelUsage(): string {
  // modelUsageMap读取`getModelUsage`，供cost tracker后续处理使用。
  const modelUsageMap = getModelUsage()
  // Object.keys(modelUsageMap)为空时立即返回或跳过，避免cost tracker把空集合当成可处理内容。
  if (Object.keys(modelUsageMap).length === 0) {
    // 返回 `'Usage: 0 input, 0 output, 0 cache read, 0 cache write'`，作为cost tracker这次计算的结果。
    return 'Usage:                 0 input, 0 output, 0 cache read, 0 cache write'
  }

  // Accumulate usage by short name
  // usageByShortName 从空对象开始收集键值，后续按名称补齐内容。
  const usageByShortName: { [shortName: string]: ModelUsage } = {}
  // 循环处理 `const [model, usage] of Object.entries(modelUsageMap)`，让cost tracker把同类条目按顺序走完。
  for (const [model, usage] of Object.entries(modelUsageMap)) {
    // shortName读取`getCanonicalName`，供cost tracker后续处理使用。
    const shortName = getCanonicalName(model)
    // 满足 `!usageByShortName[shortName]` 时，cost tracker执行该分支。
    if (!usageByShortName[shortName]) {
      // usageByShortName[shortName更新为 `{`，确保cost tracker后续读取最新状态。
      usageByShortName[shortName] = {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
        webSearchRequests: 0,
        costUSD: 0,
        contextWindow: 0,
        maxOutputTokens: 0,
      }
    }
    // accumulated保存`usageByShortName[shortName]`，供cost tracker后续判断或输出使用。
    const accumulated = usageByShortName[shortName]
    // cost tracker在这里处理 `accumulated.inputTokens += usage.inputTokens`，完成这一小步状态转换。
    accumulated.inputTokens += usage.inputTokens
    // cost tracker在这里处理 `accumulated.outputTokens += usage.outputTokens`，完成这一小步状态转换。
    accumulated.outputTokens += usage.outputTokens
    // cost tracker在这里处理 `accumulated.cacheReadInputTokens += usage.cacheReadInputTokens`，完成这一小步状态转换。
    accumulated.cacheReadInputTokens += usage.cacheReadInputTokens
    // cost tracker在这里处理 `accumulated.cacheCreationInputTokens += usage.cacheCreationInputTokens`，完成这一小步状态转换。
    accumulated.cacheCreationInputTokens += usage.cacheCreationInputTokens
    // cost tracker在这里处理 `accumulated.webSearchRequests += usage.webSearchRequests`，完成这一小步状态转换。
    accumulated.webSearchRequests += usage.webSearchRequests
    // cost tracker在这里处理 `accumulated.costUSD += usage.costUSD`，完成这一小步状态转换。
    accumulated.costUSD += usage.costUSD
  }

  // 结果 命名 `'Usage by model:'`，让后续代码直接表达这个值的用途。
  let result = 'Usage by model:'
  // 循环处理 `const [shortName, usage] of Object.entries(usageByShortName)`，让cost tracker把同类条目按顺序走完。
  for (const [shortName, usage] of Object.entries(usageByShortName)) {
    // usageString 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const usageString =
      `  ${formatNumber(usage.inputTokens)} input, ` +
      `${formatNumber(usage.outputTokens)} output, ` +
      `${formatNumber(usage.cacheReadInputTokens)} cache read, ` +
      `${formatNumber(usage.cacheCreationInputTokens)} cache write` +
      (usage.webSearchRequests > 0
        ? `, ${formatNumber(usage.webSearchRequests)} web search`
        : '') +
      ` (${formatCost(usage.costUSD)})`
    // cost tracker在这里处理 `result += `\n` + `${shortName}:`.padStart(21) + usageString`，完成这一小步状态转换。
    result += `\n` + `${shortName}:`.padStart(21) + usageString
  }
  // 返回 `result`，作为cost tracker这次计算的结果。
  return result
}

// formatTotalCost 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTotalCost(): string {
  // costDisplay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const costDisplay =
    formatCost(getTotalCostUSD()) +
    (hasUnknownModelCost()
      ? ' (costs may be inaccurate due to usage of unknown models)'
      : '')

  // modelUsageDisplay格式化`formatModelUsage`，供cost tracker后续处理使用。
  const modelUsageDisplay = formatModelUsage()

  // 返回 `chalk.dim(`，作为cost tracker这次计算的结果。
  return chalk.dim(
    `Total cost:            ${costDisplay}\n` +
      `Total duration (API):  ${formatDuration(getTotalAPIDuration())}
Total duration (wall): ${formatDuration(getTotalDuration())}
Total code changes:    ${getTotalLinesAdded()} ${getTotalLinesAdded() === 1 ? 'line' : 'lines'} added, ${getTotalLinesRemoved()} ${getTotalLinesRemoved() === 1 ? 'line' : 'lines'} removed
${modelUsageDisplay}`,
  )
}

// round 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function round(number: number, precision: number): number {
  // 返回 `Math.round(number * precision) / precision`，作为cost tracker这次计算的结果。
  return Math.round(number * precision) / precision
}

// addToTotalModelUsage 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addToTotalModelUsage(
  cost: number,
  usage: Usage,
  model: string,
): ModelUsage {
  // modelUsage读取`getUsageForModel`，供cost tracker后续处理使用。
  const modelUsage = getUsageForModel(model) ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
    webSearchRequests: 0,
    costUSD: 0,
    contextWindow: 0,
    maxOutputTokens: 0,
  }

  // cost tracker在这里处理 `modelUsage.inputTokens += usage.input_tokens`，完成这一小步状态转换。
  modelUsage.inputTokens += usage.input_tokens
  // cost tracker在这里处理 `modelUsage.outputTokens += usage.output_tokens`，完成这一小步状态转换。
  modelUsage.outputTokens += usage.output_tokens
  // cost tracker在这里处理 `modelUsage.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0`，完成这一小步状态转换。
  modelUsage.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0
  // cost tracker在这里处理 `modelUsage.cacheCreationInputTokens += usage.cache_creation_input_token...`，完成这一小步状态转换。
  modelUsage.cacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0
  // cost tracker在这里处理 `modelUsage.webSearchRequests +=`，完成这一小步状态转换。
  modelUsage.webSearchRequests +=
    usage.server_tool_use?.web_search_requests ?? 0
  // cost tracker在这里处理 `modelUsage.costUSD += cost`，完成这一小步状态转换。
  modelUsage.costUSD += cost
  // contextWindow更新为 `getContextWindowForModel(model, getSdkBetas())`，确保cost-tracker后续读取最新状态。
  modelUsage.contextWindow = getContextWindowForModel(model, getSdkBetas())
  // maxOutputTokens 集合更新为 `getModelMaxOutputTokens(model).default`，确保cost-tracker后续读取最新状态。
  modelUsage.maxOutputTokens = getModelMaxOutputTokens(model).default
  // 返回 `modelUsage`，作为cost tracker这次计算的结果。
  return modelUsage
}

// addToTotalSessionCost 封装cost-tracker的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTotalSessionCost(
  cost: number,
  usage: Usage,
  model: string,
): number {
  // modelUsage保存`addToTotalModelUsage`，供cost tracker后续处理使用。
  const modelUsage = addToTotalModelUsage(cost, usage, model)
  // 调用 addToTotalCostState，触发cost tracker此处需要的副作用。
  addToTotalCostState(cost, modelUsage, model)

  // attrs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const attrs =
    isFastModeEnabled() && usage.speed === 'fast'
      ? { model, speed: 'fast' }
      : { model }

  // 调用 getCostCounter，触发cost tracker此处需要的副作用。
  getCostCounter()?.add(cost, attrs)
  // 调用 getTokenCounter，触发cost tracker此处需要的副作用。
  getTokenCounter()?.add(usage.input_tokens, { ...attrs, type: 'input' })
  // 调用 getTokenCounter，触发cost tracker此处需要的副作用。
  getTokenCounter()?.add(usage.output_tokens, { ...attrs, type: 'output' })
  // 调用 getTokenCounter，触发cost tracker此处需要的副作用。
  getTokenCounter()?.add(usage.cache_read_input_tokens ?? 0, {
    ...attrs,
    type: 'cacheRead',
  })
  // 调用 getTokenCounter，触发cost tracker此处需要的副作用。
  getTokenCounter()?.add(usage.cache_creation_input_tokens ?? 0, {
    ...attrs,
    type: 'cacheCreation',
  })

  // totalCost保存`cost`，供cost tracker后续判断或输出使用。
  let totalCost = cost
  // 逐项读取 `getAdvisorUsage(usage)` 中的advisorUsage，按输入顺序推进cost tracker。
  for (const advisorUsage of getAdvisorUsage(usage)) {
    // advisorCost保存`calculateUSDCost`，供cost tracker后续处理使用。
    const advisorCost = calculateUSDCost(advisorUsage.model, advisorUsage)
    // 记录cost tracker运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_advisor_tool_token_usage', {
      advisor_model:
        advisorUsage.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      input_tokens: advisorUsage.input_tokens,
      output_tokens: advisorUsage.output_tokens,
      cache_read_input_tokens: advisorUsage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens:
        advisorUsage.cache_creation_input_tokens ?? 0,
      cost_usd_micros: Math.round(advisorCost * 1_000_000),
    })
    // cost tracker在这里处理 `totalCost += addToTotalSessionCost(`，完成这一小步状态转换。
    totalCost += addToTotalSessionCost(
      advisorCost,
      advisorUsage,
      advisorUsage.model,
    )
  }
  // 返回 `totalCost`，作为cost tracker这次计算的结果。
  return totalCost
}
