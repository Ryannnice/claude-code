/**
 * Model deprecation utilities
 *
 * Contains information about deprecated models and their retirement dates.
 */

// 引入 APIProvider、getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { type APIProvider, getAPIProvider } from './providers.js'

// DeprecatedModelInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DeprecatedModelInfo = {
  isDeprecated: true
  modelName: string
  retirementDate: string
}

// NotDeprecatedInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type NotDeprecatedInfo = {
  isDeprecated: false
}

// DeprecationInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DeprecationInfo = DeprecatedModelInfo | NotDeprecatedInfo

// DeprecationEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DeprecationEntry = {
  /** Human-readable model name */
  modelName: string
  /** Retirement dates by provider (null = not deprecated for that provider) */
  retirementDates: Record<APIProvider, string | null>
}

/**
 * Deprecated models and their retirement dates by provider.
 * Keys are substrings to match in model IDs (case-insensitive).
 * To add a new deprecated model, add an entry to this object.
 */
// DEPRECATED_MODELS 集合 集中保存模型工具 deprecation要一起传递的字段。
const DEPRECATED_MODELS: Record<string, DeprecationEntry> = {
  'claude-3-opus': {
    modelName: 'Claude 3 Opus',
    retirementDates: {
      firstParty: 'January 5, 2026',
      bedrock: 'January 15, 2026',
      vertex: 'January 5, 2026',
      foundry: 'January 5, 2026',
    },
  },
  'claude-3-7-sonnet': {
    modelName: 'Claude 3.7 Sonnet',
    retirementDates: {
      firstParty: 'February 19, 2026',
      bedrock: 'April 28, 2026',
      vertex: 'May 11, 2026',
      foundry: 'February 19, 2026',
    },
  },
  'claude-3-5-haiku': {
    modelName: 'Claude 3.5 Haiku',
    retirementDates: {
      firstParty: 'February 19, 2026',
      bedrock: null,
      vertex: null,
      foundry: null,
    },
  },
}

/**
 * Check if a model is deprecated and get its deprecation info
 */
// getDeprecatedModelInfo 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDeprecatedModelInfo(modelId: string): DeprecationInfo {
  // lowercaseModelId保存`modelId.toLowerCase`，供共享工具后续处理使用。
  const lowercaseModelId = modelId.toLowerCase()
  // provider读取`getAPIProvider`，供共享工具后续处理使用。
  const provider = getAPIProvider()

  // 循环处理 `const [key, value] of Object.entries(DEPRECATED_MODELS)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(DEPRECATED_MODELS)) {
    // retirementDate记录时间`value.retirementDates[provider]` 整理出中间结果，供共享工具模型工具 deprecation后续步骤使用。
    const retirementDate = value.retirementDates[provider]
    // 只有 `!lowercaseModelId.includes(key) || !retirementDate` 满足时，共享工具才执行该分支。
    if (!lowercaseModelId.includes(key) || !retirementDate) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isDeprecated: true,
      modelName: value.modelName,
      retirementDate,
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { isDeprecated: false }
}

/**
 * Get a deprecation warning message for a model, or null if not deprecated
 */
// getModelDeprecationWarning 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelDeprecationWarning(
  modelId: string | null,
): string | null {
  // modelId缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!modelId) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // info读取`getDeprecatedModelInfo`，供共享工具后续处理使用。
  const info = getDeprecatedModelInfo(modelId)
  // info.isDeprecated缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!info.isDeprecated) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 ``⚠ ${info.modelName} will be retired on ${info.retirementDate}. Conside...`，作为共享工具这次计算的结果。
  return `⚠ ${info.modelName} will be retired on ${info.retirementDate}. Consider switching to a newer model.`
}
