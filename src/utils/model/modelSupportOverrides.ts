// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './providers.js'

// ModelCapabilityOverride 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelCapabilityOverride =
  | 'effort'
  | 'max_effort'
  | 'thinking'
  | 'adaptive_thinking'
  | 'interleaved_thinking'

// TIERS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TIERS = [
  {
    modelEnvVar: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
    capabilitiesEnvVar: 'ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES',
  },
  {
    modelEnvVar: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
    capabilitiesEnvVar: 'ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES',
  },
  {
    modelEnvVar: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    capabilitiesEnvVar: 'ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES',
  },
] as const

/**
 * Check whether a 3p model capability override is set for a model that matches one of
 * the pinned ANTHROPIC_DEFAULT_*_MODEL env vars.
 */
// get3PModelCapabilityOverride保存`memoize`，供共享工具后续处理使用。
export const get3PModelCapabilityOverride = memoize(
  (model: string, capability: ModelCapabilityOverride): boolean | undefined => {
    // 当 `getAPIProvider()` 匹配 `'firstParty'` 时，共享工具执行对应分支。
    if (getAPIProvider() === 'firstParty') {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }
    // m保存`model.toLowerCase`，供共享工具后续处理使用。
    const m = model.toLowerCase()
    // 按顺序遍历 `TIERS` 中的tier，逐个交给共享工具处理。
    for (const tier of TIERS) {
      // pinned 命名 `process.env[tier.modelEnvVar]`，让后续代码直接表达这个值的用途。
      const pinned = process.env[tier.modelEnvVar]
      // capabilities 集合读取 `process.env[tier.capabilitiesEnvVar]` 对应条目，后续围绕该成员继续处理。
      const capabilities = process.env[tier.capabilitiesEnvVar]
      // 只有 `!pinned || capabilities === undefined` 满足时，共享工具才执行该分支。
      if (!pinned || capabilities === undefined) continue
      // `m` 与 `pinned.toLowerCase()` 不一致时刷新派生状态，避免使用过期结果。
      if (m !== pinned.toLowerCase()) continue
      // 返回 `capabilities`，作为共享工具这次计算的结果。
      return capabilities
        .toLowerCase()
        .split(',')
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(s => s.trim())
        .includes(capability)
    }
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  },
  // 这个回调绑定到 (model, capability) => `${model.toLowerCase()}:${capability}`,，负责共享工具在该局部场景下的响应。
  (model, capability) => `${model.toLowerCase()}:${capability}`,
)
