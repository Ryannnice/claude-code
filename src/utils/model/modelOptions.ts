// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 getInitialMainLoopModel，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getInitialMainLoopModel } from '../../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isClaudeAISubscriber,
  isMaxSubscriber,
  isTeamPremiumSubscriber,
} from '../auth.js'
// 引入 getModelStrings，将 ./modelStrings.js 中已经封装好的能力接到本文件流程里。
import { getModelStrings } from './modelStrings.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  COST_TIER_3_15,
  COST_HAIKU_35,
  COST_HAIKU_45,
  formatModelPricing,
} from '../modelCost.js'
// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'
// 引入 checkOpus1mAccess、checkSonnet1mAccess，将 ./check1mAccess.js 中已经封装好的能力接到本文件流程里。
import { checkOpus1mAccess, checkSonnet1mAccess } from './check1mAccess.js'
// 引入 getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './providers.js'
// 引入 isModelAllowed，将 ./modelAllowlist.js 中已经封装好的能力接到本文件流程里。
import { isModelAllowed } from './modelAllowlist.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCanonicalName,
  getClaudeAiUserDefaultModelDescription,
  getDefaultSonnetModel,
  getDefaultOpusModel,
  getDefaultHaikuModel,
  getDefaultMainLoopModelSetting,
  getMarketingNameForModel,
  getUserSpecifiedModelSetting,
  isOpus1mMergeEnabled,
  getOpus46PricingSuffix,
  renderDefaultModelSetting,
  type ModelSetting,
} from './model.js'
// 引入 has1mContext，将 ../context.js 中已经封装好的能力接到本文件流程里。
import { has1mContext } from '../context.js'
// 引入 getGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from '../config.js'

// @[MODEL LAUNCH]: Update all the available and default model option strings below.

// ModelOption 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelOption = {
  value: ModelSetting
  label: string
  description: string
  descriptionForModel?: string
}

// getDefaultOptionForUser 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultOptionForUser(fastMode = false): ModelOption {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // currentModel保存`renderDefaultModelSetting`，供共享工具后续处理使用。
    const currentModel = renderDefaultModelSetting(
      getDefaultMainLoopModelSetting(),
    )
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: null,
      label: 'Default (recommended)',
      description: `Use the default model for Ants (currently ${currentModel})`,
      descriptionForModel: `Default model (currently ${currentModel})`,
    }
  }

  // Subscribers
  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: null,
      label: 'Default (recommended)',
      description: getClaudeAiUserDefaultModelDescription(fastMode),
    }
  }

  // PAYG
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: null,
    label: 'Default (recommended)',
    description: `Use the default model (currently ${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

// getCustomSonnetOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCustomSonnetOption(): ModelOption | undefined {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // customSonnetModel 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const customSonnetModel = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  // When a 3P user has a custom sonnet model string, show it directly
  // 只有 `is3P && customSonnetModel` 满足时，共享工具才执行该分支。
  if (is3P && customSonnetModel) {
    // is1m保存`has1mContext`，供共享工具后续处理使用。
    const is1m = has1mContext(customSonnetModel)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: 'sonnet',
      label:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME ?? customSonnetModel,
      description:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ??
        `Custom Sonnet model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ?? `Custom Sonnet model${is1m ? ' with 1M context' : ''}`} (${customSonnetModel})`,
    }
  }
}

// @[MODEL LAUNCH]: Update or add model option functions (getSonnetXXOption, getOpusXXOption, etc.)
// with the new model's label and description. These appear in the /model picker.
// getSonnet46Option 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSonnet46Option(): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: is3P ? getModelStrings().sonnet46 : 'sonnet',
    label: 'Sonnet',
    description: `Sonnet 4.6 · Best for everyday tasks${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Sonnet 4.6 - best for everyday tasks. Generally recommended for most coding tasks',
  }
}

// getCustomOpusOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCustomOpusOption(): ModelOption | undefined {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // customOpusModel 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const customOpusModel = process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  // When a 3P user has a custom opus model string, show it directly
  // 只有 `is3P && customOpusModel` 满足时，共享工具才执行该分支。
  if (is3P && customOpusModel) {
    // is1m保存`has1mContext`，供共享工具后续处理使用。
    const is1m = has1mContext(customOpusModel)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: 'opus',
      label: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME ?? customOpusModel,
      description:
        process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ??
        `Custom Opus model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ?? `Custom Opus model${is1m ? ' with 1M context' : ''}`} (${customOpusModel})`,
    }
  }
}

// getOpus41Option 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOpus41Option(): ModelOption {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'opus',
    label: 'Opus 4.1',
    description: `Opus 4.1 · Legacy`,
    descriptionForModel: 'Opus 4.1 - legacy version',
  }
}

// getOpus46Option 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOpus46Option(fastMode = false): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: is3P ? getModelStrings().opus46 : 'opus',
    label: 'Opus',
    description: `Opus 4.6 · Most capable for complex work${getOpus46PricingSuffix(fastMode)}`,
    descriptionForModel: 'Opus 4.6 - most capable for complex work',
  }
}

// getSonnet46_1MOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSonnet46_1MOption(): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: is3P ? getModelStrings().sonnet46 + '[1m]' : 'sonnet[1m]',
    label: 'Sonnet (1M context)',
    description: `Sonnet 4.6 for long sessions${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Sonnet 4.6 with 1M context window - for long sessions with large codebases',
  }
}

// getOpus46_1MOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOpus46_1MOption(fastMode = false): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 for long sessions${getOpus46PricingSuffix(fastMode)}`,
    descriptionForModel:
      'Opus 4.6 with 1M context window - for long sessions with large codebases',
  }
}

// getCustomHaikuOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCustomHaikuOption(): ModelOption | undefined {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // customHaikuModel 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const customHaikuModel = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  // When a 3P user has a custom haiku model string, show it directly
  // 只有 `is3P && customHaikuModel` 满足时，共享工具才执行该分支。
  if (is3P && customHaikuModel) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: 'haiku',
      label: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME ?? customHaikuModel,
      description:
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ??
        'Custom Haiku model',
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ?? 'Custom Haiku model'} (${customHaikuModel})`,
    }
  }
}

// getHaiku45Option 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHaiku45Option(): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'haiku',
    label: 'Haiku',
    description: `Haiku 4.5 · Fastest for quick answers${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_45)}`}`,
    descriptionForModel:
      'Haiku 4.5 - fastest for quick answers. Lower cost but less capable than Sonnet 4.6.',
  }
}

// getHaiku35Option 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHaiku35Option(): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'haiku',
    label: 'Haiku',
    description: `Haiku 3.5 for simple tasks${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_35)}`}`,
    descriptionForModel:
      'Haiku 3.5 - faster and lower cost, but less capable than Sonnet. Use for simple tasks.',
  }
}

// getHaikuOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHaikuOption(): ModelOption {
  // Return correct Haiku option based on provider
  // haikuModel读取`getDefaultHaikuModel`，供共享工具后续处理使用。
  const haikuModel = getDefaultHaikuModel()
  // 返回 `haikuModel === getModelStrings().haiku45`，作为共享工具这次计算的结果。
  return haikuModel === getModelStrings().haiku45
    ? getHaiku45Option()
    : getHaiku35Option()
}

// getMaxOpusOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMaxOpusOption(fastMode = false): ModelOption {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'opus',
    label: 'Opus',
    description: `Opus 4.6 · Most capable for complex work${fastMode ? getOpus46PricingSuffix(true) : ''}`,
  }
}

// getMaxSonnet46_1MOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxSonnet46_1MOption(): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // billingInfo保存`isClaudeAISubscriber`，供共享工具后续处理使用。
  const billingInfo = isClaudeAISubscriber() ? ' · Billed as extra usage' : ''
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'sonnet[1m]',
    label: 'Sonnet (1M context)',
    description: `Sonnet 4.6 with 1M context${billingInfo}${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

// getMaxOpus46_1MOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxOpus46_1MOption(fastMode = false): ModelOption {
  // billingInfo保存`isClaudeAISubscriber`，供共享工具后续处理使用。
  const billingInfo = isClaudeAISubscriber() ? ' · Billed as extra usage' : ''
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 with 1M context${billingInfo}${getOpus46PricingSuffix(fastMode)}`,
  }
}

// getMergedOpus1MOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMergedOpus1MOption(fastMode = false): ModelOption {
  // is3P读取`getAPIProvider`，供共享工具后续处理使用。
  const is3P = getAPIProvider() !== 'firstParty'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 with 1M context · Most capable for complex work${!is3P && fastMode ? getOpus46PricingSuffix(fastMode) : ''}`,
    descriptionForModel:
      'Opus 4.6 with 1M context - most capable for complex work',
  }
}

// MaxSonnet46Option 集中保存模型工具 model Options要一起传递的字段。
const MaxSonnet46Option: ModelOption = {
  value: 'sonnet',
  label: 'Sonnet',
  description: 'Sonnet 4.6 · Best for everyday tasks',
}

// MaxHaiku45Option 集中保存模型工具 model Options要一起传递的字段。
const MaxHaiku45Option: ModelOption = {
  value: 'haiku',
  label: 'Haiku',
  description: 'Haiku 4.5 · Fastest for quick answers',
}

// getOpusPlanOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOpusPlanOption(): ModelOption {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: 'opusplan',
    label: 'Opus Plan Mode',
    description: 'Use Opus 4.6 in plan mode, Sonnet 4.6 otherwise',
  }
}

// @[MODEL LAUNCH]: Update the model picker lists below to include/reorder options for the new model.
// Each user tier (ant, Max/Team Premium, Pro/Team Standard/Enterprise, PAYG 1P, PAYG 3P) has its own list.
// getModelOptionsBase 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getModelOptionsBase(fastMode = false): ModelOption[] {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Build options from antModels config
    // 这个回调绑定到 const antModelOptions: ModelOption[] = getAntModels().map(m => ({，负责共享工具在该局部场景下的响应。
    const antModelOptions: ModelOption[] = getAntModels().map(m => ({
      value: m.alias,
      label: m.label,
      description: m.description ?? `[ANT-ONLY] ${m.label} (${m.model})`,
    }))

    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      getDefaultOptionForUser(),
      ...antModelOptions,
      getMergedOpus1MOption(fastMode),
      getSonnet46Option(),
      getSonnet46_1MOption(),
      getHaiku45Option(),
    ]
  }

  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // 只有 `isMaxSubscriber() || isTeamPremiumSubscriber()` 满足时，共享工具才执行该分支。
    if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
      // Max and Team Premium users: Opus is default, show Sonnet as alternative
      // premiumOptions 集合读取`getDefaultOptionForUser`，供共享工具后续处理使用。
      const premiumOptions = [getDefaultOptionForUser(fastMode)]
      // 只有 `!isOpus1mMergeEnabled() && checkOpus1mAccess()` 满足时，共享工具才执行该分支。
      if (!isOpus1mMergeEnabled() && checkOpus1mAccess()) {
        // premiumOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        premiumOptions.push(getMaxOpus46_1MOption(fastMode))
      }

      // premiumOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      premiumOptions.push(MaxSonnet46Option)
      // 满足 `checkSonnet1mAccess()` 时，共享工具执行该分支。
      if (checkSonnet1mAccess()) {
        // premiumOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        premiumOptions.push(getMaxSonnet46_1MOption())
      }

      // premiumOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      premiumOptions.push(MaxHaiku45Option)
      // 返回 `premiumOptions`，作为共享工具这次计算的结果。
      return premiumOptions
    }

    // Pro/Team Standard/Enterprise users: Sonnet is default, show Opus as alternative
    // standardOptions 集合读取`getDefaultOptionForUser`，供共享工具后续处理使用。
    const standardOptions = [getDefaultOptionForUser(fastMode)]
    // 满足 `checkSonnet1mAccess()` 时，共享工具执行该分支。
    if (checkSonnet1mAccess()) {
      // standardOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      standardOptions.push(getMaxSonnet46_1MOption())
    }

    // 满足 `isOpus1mMergeEnabled()` 时，共享工具执行该分支。
    if (isOpus1mMergeEnabled()) {
      // standardOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      standardOptions.push(getMergedOpus1MOption(fastMode))
    } else {
      // standardOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      standardOptions.push(getMaxOpusOption(fastMode))
      // 满足 `checkOpus1mAccess()` 时，共享工具执行该分支。
      if (checkOpus1mAccess()) {
        // standardOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        standardOptions.push(getMaxOpus46_1MOption(fastMode))
      }
    }

    // standardOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    standardOptions.push(MaxHaiku45Option)
    // 返回 `standardOptions`，作为共享工具这次计算的结果。
    return standardOptions
  }

  // PAYG 1P API: Default (Sonnet) + Sonnet 1M + Opus 4.6 + Opus 1M + Haiku
  // 当 `getAPIProvider()` 匹配 `'firstParty'` 时，共享工具执行对应分支。
  if (getAPIProvider() === 'firstParty') {
    // payg1POptions 集合读取`getDefaultOptionForUser`，供共享工具后续处理使用。
    const payg1POptions = [getDefaultOptionForUser(fastMode)]
    // 满足 `checkSonnet1mAccess()` 时，共享工具执行该分支。
    if (checkSonnet1mAccess()) {
      // payg1POptions 集合追加新条目，保持收集顺序与输入顺序一致。
      payg1POptions.push(getSonnet46_1MOption())
    }
    // 满足 `isOpus1mMergeEnabled()` 时，共享工具执行该分支。
    if (isOpus1mMergeEnabled()) {
      // payg1POptions 集合追加新条目，保持收集顺序与输入顺序一致。
      payg1POptions.push(getMergedOpus1MOption(fastMode))
    } else {
      // payg1POptions 集合追加新条目，保持收集顺序与输入顺序一致。
      payg1POptions.push(getOpus46Option(fastMode))
      // 满足 `checkOpus1mAccess()` 时，共享工具执行该分支。
      if (checkOpus1mAccess()) {
        // payg1POptions 集合追加新条目，保持收集顺序与输入顺序一致。
        payg1POptions.push(getOpus46_1MOption(fastMode))
      }
    }
    // payg1POptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg1POptions.push(getHaiku45Option())
    // 返回 `payg1POptions`，作为共享工具这次计算的结果。
    return payg1POptions
  }

  // PAYG 3P: Default (Sonnet 4.5) + Sonnet (3P custom) or Sonnet 4.6/1M + Opus (3P custom) or Opus 4.1/Opus 4.6/Opus1M + Haiku + Opus 4.1
  // payg3pOptions 集合读取`getDefaultOptionForUser`，供共享工具后续处理使用。
  const payg3pOptions = [getDefaultOptionForUser(fastMode)]

  // customSonnet读取`getCustomSonnetOption`，供共享工具后续处理使用。
  const customSonnet = getCustomSonnetOption()
  // `customSonnet` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (customSonnet !== undefined) {
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(customSonnet)
  } else {
    // Add Sonnet 4.6 since Sonnet 4.5 is the default
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(getSonnet46Option())
    // 满足 `checkSonnet1mAccess()` 时，共享工具执行该分支。
    if (checkSonnet1mAccess()) {
      // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      payg3pOptions.push(getSonnet46_1MOption())
    }
  }

  // customOpus 集合读取`getCustomOpusOption`，供共享工具后续处理使用。
  const customOpus = getCustomOpusOption()
  // `customOpus` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (customOpus !== undefined) {
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(customOpus)
  } else {
    // Add Opus 4.1, Opus 4.6 and Opus 4.6 1M
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(getOpus41Option()) // This is the default opus
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(getOpus46Option(fastMode))
    // 满足 `checkOpus1mAccess()` 时，共享工具执行该分支。
    if (checkOpus1mAccess()) {
      // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      payg3pOptions.push(getOpus46_1MOption(fastMode))
    }
  }
  // customHaiku读取`getCustomHaikuOption`，供共享工具后续处理使用。
  const customHaiku = getCustomHaikuOption()
  // `customHaiku` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (customHaiku !== undefined) {
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(customHaiku)
  } else {
    // payg3pOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    payg3pOptions.push(getHaikuOption())
  }
  // 返回 `payg3pOptions`，作为共享工具这次计算的结果。
  return payg3pOptions
}

// @[MODEL LAUNCH]: Add the new model ID to the appropriate family pattern below
// so the "newer version available" hint works correctly.
/**
 * Map a full model name to its family alias and the marketing name of the
 * version the alias currently resolves to. Used to detect when a user has
 * a specific older version pinned and a newer one is available.
 */
// getModelFamilyInfo 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getModelFamilyInfo(
  model: string,
): { alias: string; currentVersionName: string } | null {
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(model)

  // Sonnet family
  // 共享工具在这里按实际状态进入对应分支。
  if (
    canonical.includes('claude-sonnet-4-6') ||
    canonical.includes('claude-sonnet-4-5') ||
    canonical.includes('claude-sonnet-4-') ||
    canonical.includes('claude-3-7-sonnet') ||
    canonical.includes('claude-3-5-sonnet')
  ) {
    // currentName读取`getMarketingNameForModel`，供共享工具后续处理使用。
    const currentName = getMarketingNameForModel(getDefaultSonnetModel())
    // 满足 `currentName` 时，共享工具执行该分支。
    if (currentName) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { alias: 'Sonnet', currentVersionName: currentName }
    }
  }

  // Opus family
  // 满足 `canonical.includes('claude-opus-4')` 时，共享工具执行该分支。
  if (canonical.includes('claude-opus-4')) {
    // currentName读取`getMarketingNameForModel`，供共享工具后续处理使用。
    const currentName = getMarketingNameForModel(getDefaultOpusModel())
    // 满足 `currentName` 时，共享工具执行该分支。
    if (currentName) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { alias: 'Opus', currentVersionName: currentName }
    }
  }

  // Haiku family
  // 共享工具在这里按实际状态进入对应分支。
  if (
    canonical.includes('claude-haiku') ||
    canonical.includes('claude-3-5-haiku')
  ) {
    // currentName读取`getMarketingNameForModel`，供共享工具后续处理使用。
    const currentName = getMarketingNameForModel(getDefaultHaikuModel())
    // 满足 `currentName` 时，共享工具执行该分支。
    if (currentName) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { alias: 'Haiku', currentVersionName: currentName }
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Returns a ModelOption for a known Anthropic model with a human-readable
 * label, and an upgrade hint if a newer version is available via the alias.
 * Returns null if the model is not recognized.
 */
// getKnownModelOption 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getKnownModelOption(model: string): ModelOption | null {
  // marketingName读取`getMarketingNameForModel`，供共享工具后续处理使用。
  const marketingName = getMarketingNameForModel(model)
  // marketingName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!marketingName) return null

  // familyInfo读取`getModelFamilyInfo`，供共享工具后续处理使用。
  const familyInfo = getModelFamilyInfo(model)
  // familyInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!familyInfo) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: model,
      label: marketingName,
      description: model,
    }
  }

  // Check if the alias currently resolves to a different (newer) version
  // `marketingName` 与 `familyInfo.currentVersionName` 不一致时刷新派生状态，避免使用过期结果。
  if (marketingName !== familyInfo.currentVersionName) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: model,
      label: marketingName,
      description: `Newer version available · select ${familyInfo.alias} for ${familyInfo.currentVersionName}`,
    }
  }

  // Same version as the alias — just show the friendly name
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    value: model,
    label: marketingName,
    description: model,
  }
}

// getModelOptions 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelOptions(fastMode = false): ModelOption[] {
  // 选项读取`getModelOptionsBase`，供共享工具后续处理使用。
  const options = getModelOptionsBase(fastMode)

  // Add the custom model from the ANTHROPIC_CUSTOM_MODEL_OPTION env var
  // envCustomModel 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envCustomModel = process.env.ANTHROPIC_CUSTOM_MODEL_OPTION
  // 共享工具在这里按实际状态进入对应分支。
  if (
    envCustomModel &&
    // 这个回调绑定到 !options.some(existing => existing.value === envCustomModel)，负责共享工具在该局部场景下的响应。
    !options.some(existing => existing.value === envCustomModel)
  ) {
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push({
      value: envCustomModel,
      label: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME ?? envCustomModel,
      description:
        process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION ??
        `Custom model (${envCustomModel})`,
    })
  }

  // Append additional model options fetched during bootstrap
  // 逐项读取 `getGlobalConfig().additionalModelOptionsCache ?...` 中的opt，按输入顺序推进共享工具。
  for (const opt of getGlobalConfig().additionalModelOptionsCache ?? []) {
    // 满足 `!options.some(existing => existing.value === opt.value)` 时，共享工具执行该分支。
    if (!options.some(existing => existing.value === opt.value)) {
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push(opt)
    }
  }

  // Add custom model from either the current model value or the initial one
  // if it is not already in the options.
  // customModel初始化为空值，后续分支会在有数据时补齐。
  let customModel: ModelSetting = null
  // currentMainLoopModel读取`getUserSpecifiedModelSetting`，供共享工具后续处理使用。
  const currentMainLoopModel = getUserSpecifiedModelSetting()
  // initialMainLoopModel读取`getInitialMainLoopModel`，供共享工具后续处理使用。
  const initialMainLoopModel = getInitialMainLoopModel()
  // `currentMainLoopModel` 与 `undefined && currentMain` 不一致时刷新派生状态，避免使用过期结果。
  if (currentMainLoopModel !== undefined && currentMainLoopModel !== null) {
    // customModel更新为 `currentMainLoopModel`，确保模型工具后续读取最新状态。
    customModel = currentMainLoopModel
  // 模型工具 model Options在这里处理 `} else if (initialMainLoopModel !== null) {`，完成这一小步状态转换。
  } else if (initialMainLoopModel !== null) {
    // customModel更新为 `initialMainLoopModel`，确保模型工具后续读取最新状态。
    customModel = initialMainLoopModel
  }
  // 只有 `customModel === null || options.some(opt => opt.value === customModel)` 满足时，共享工具才执行该分支。
  if (customModel === null || options.some(opt => opt.value === customModel)) {
    // 返回 `filterModelOptionsByAllowlist(options)`，作为共享工具这次计算的结果。
    return filterModelOptionsByAllowlist(options)
  // 模型工具 model Options在这里处理 `} else if (customModel === 'opusplan') {`，完成这一小步状态转换。
  } else if (customModel === 'opusplan') {
    // 返回 `filterModelOptionsByAllowlist([...options, getOpusPlanOption()])`，作为共享工具这次计算的结果。
    return filterModelOptionsByAllowlist([...options, getOpusPlanOption()])
  // 模型工具 model Options在这里处理 `} else if (customModel === 'opus' && getAPIProvider() === 'firstParty')...`，完成这一小步状态转换。
  } else if (customModel === 'opus' && getAPIProvider() === 'firstParty') {
    // 返回 `filterModelOptionsByAllowlist([`，作为共享工具这次计算的结果。
    return filterModelOptionsByAllowlist([
      ...options,
      getMaxOpusOption(fastMode),
    ])
  // 模型工具 model Options在这里处理 `} else if (customModel === 'opus[1m]' && getAPIProvider() === 'firstPar...`，完成这一小步状态转换。
  } else if (customModel === 'opus[1m]' && getAPIProvider() === 'firstParty') {
    // 返回 `filterModelOptionsByAllowlist([`，作为共享工具这次计算的结果。
    return filterModelOptionsByAllowlist([
      ...options,
      getMergedOpus1MOption(fastMode),
    ])
  } else {
    // Try to show a human-readable label for known Anthropic models, with an
    // upgrade hint if the alias now resolves to a newer version.
    // knownOption读取`getKnownModelOption`，供共享工具后续处理使用。
    const knownOption = getKnownModelOption(customModel)
    // 满足 `knownOption` 时，共享工具执行该分支。
    if (knownOption) {
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push(knownOption)
    } else {
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push({
        value: customModel,
        label: customModel,
        description: 'Custom model',
      })
    }
    // 返回 `filterModelOptionsByAllowlist(options)`，作为共享工具这次计算的结果。
    return filterModelOptionsByAllowlist(options)
  }
}

/**
 * Filter model options by the availableModels allowlist.
 * Always preserves the "Default" option (value: null).
 */
// filterModelOptionsByAllowlist 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterModelOptionsByAllowlist(options: ModelOption[]): ModelOption[] {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // settings.availableModels 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!settings.availableModels) {
    // 返回 `options // No restrictions`，作为共享工具这次计算的结果。
    return options // No restrictions
  }
  // 返回 `options.filter(`，作为共享工具这次计算的结果。
  return options.filter(
    // opt更新为 `>`，确保模型工具后续读取最新状态。
    opt =>
      opt.value === null || (opt.value !== null && isModelAllowed(opt.value)),
  )
}
