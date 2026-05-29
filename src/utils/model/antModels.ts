// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 类型依赖 { EffortLevel } 来自 ../effort.js，用于校准共享工具的数据契约。
import type { EffortLevel } from '../effort.js'

// AntModel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AntModel = {
  alias: string
  model: string
  label: string
  description?: string
  defaultEffortValue?: number
  defaultEffortLevel?: EffortLevel
  contextWindow?: number
  defaultMaxTokens?: number
  upperMaxTokensLimit?: number
  /** Model defaults to adaptive thinking and rejects `thinking: { type: 'disabled' }`. */
  alwaysOnThinking?: boolean
}

// AntModelSwitchCalloutConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AntModelSwitchCalloutConfig = {
  modelAlias?: string
  description: string
  version: string
}

// AntModelOverrideConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AntModelOverrideConfig = {
  defaultModel?: string
  defaultModelEffortLevel?: EffortLevel
  defaultSystemPromptSuffix?: string
  antModels?: AntModel[]
  switchCallout?: AntModelSwitchCalloutConfig
}

// @[MODEL LAUNCH]: Update tengu_ant_model_override with new ant-only models
// @[MODEL LAUNCH]: Add the codename to scripts/excluded-strings.txt to prevent it from leaking to external builds.
// getAntModelOverrideConfig 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAntModelOverrideConfig(): AntModelOverrideConfig | null {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE<AntModelOverrideConfig | null>(`，作为共享工具这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE<AntModelOverrideConfig | null>(
    'tengu_ant_model_override',
    null,
  )
}

// getAntModels 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAntModels(): AntModel[] {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `getAntModelOverrideConfig()?.antModels ?? []`，作为共享工具这次计算的结果。
  return getAntModelOverrideConfig()?.antModels ?? []
}

// resolveAntModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveAntModel(
  model: string | undefined,
): AntModel | undefined {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 满足 `model === undefined` 时，共享工具执行该分支。
  if (model === undefined) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // lower保存`model.toLowerCase`，供共享工具后续处理使用。
  const lower = model.toLowerCase()
  // 返回 `getAntModels().find(`，作为共享工具这次计算的结果。
  return getAntModels().find(
    // m更新为 `> m.alias === model || lower.includes(m.model.toLowerCase...`，确保模型工具后续读取最新状态。
    m => m.alias === model || lower.includes(m.model.toLowerCase()),
  )
}
