// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 类型依赖 { LocalCommandCall } 来自 ../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../types/command.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  canUserConfigureAdvisor,
  isValidAdvisorModel,
  modelSupportsAdvisor,
} from '../utils/advisor.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModelSetting,
  normalizeModelStringForAPI,
  parseUserSpecifiedModel,
} from '../utils/model/model.js'
// 复用 validateModel 工具函数，把通用处理留在 ../utils/model/validateModel.js 中维护。
import { validateModel } from '../utils/model/validateModel.js'
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js'

// 这个回调绑定到 const call: LocalCommandCall = async (args, context) => {，负责命令处理在该局部场景下的响应。
const call: LocalCommandCall = async (args, context) => {
  // 当前参数格式化`args.trim`，供命令处理后续处理使用。
  const arg = args.trim().toLowerCase()
  // baseModel解析`parseUserSpecifiedModel`，供命令处理后续处理使用。
  const baseModel = parseUserSpecifiedModel(
    context.getAppState().mainLoopModel ?? getDefaultMainLoopModelSetting(),
  )

  // 当前参数缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!arg) {
    // current读取`context.getAppState`，供命令处理后续处理使用。
    const current = context.getAppState().advisorModel
    // current缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!current) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value:
          'Advisor: not set\nUse "/advisor <model>" to enable (e.g. "/advisor opus").',
      }
    }
    // 满足 `!modelSupportsAdvisor(baseModel)` 时，命令处理执行该分支。
    if (!modelSupportsAdvisor(baseModel)) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: `Advisor: ${current} (inactive)\nThe current model (${baseModel}) does not support advisors.`,
      }
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `Advisor: ${current}\nUse "/advisor unset" to disable or "/advisor <model>" to change.`,
    }
  }

  // 当 `arg` 匹配 `'unset' || arg === 'off'` 时，命令处理执行对应分支。
  if (arg === 'unset' || arg === 'off') {
    // prev读取`context.getAppState`，供命令处理后续处理使用。
    const prev = context.getAppState().advisorModel
    // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
    context.setAppState(s => {
      // 满足 `s.advisorModel === undefined` 时，命令处理执行该分支。
      if (s.advisorModel === undefined) return s
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { ...s, advisorModel: undefined }
    })
    // 调用 updateSettingsForSource，触发命令处理此处需要的副作用。
    updateSettingsForSource('userSettings', { advisorModel: undefined })
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: prev
        ? `Advisor disabled (was ${prev}).`
        : 'Advisor already unset.',
    }
  }

  // normalizedModel保存`normalizeModelStringForAPI`，供命令处理后续处理使用。
  const normalizedModel = normalizeModelStringForAPI(arg)
  // resolvedModel解析`parseUserSpecifiedModel`，供命令处理后续处理使用。
  const resolvedModel = parseUserSpecifiedModel(arg)
  // 从 `await validateModel(resolvedModel)` 解构 valid、error，减少斜杠命令 advisor对同一对象的重复访问。
  const { valid, error } = await validateModel(resolvedModel)
  // valid缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!valid) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: error
        ? `Invalid advisor model: ${error}`
        : `Unknown model: ${arg} (${resolvedModel})`,
    }
  }

  // 满足 `!isValidAdvisorModel(resolvedModel)` 时，命令处理执行该分支。
  if (!isValidAdvisorModel(resolvedModel)) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `The model ${arg} (${resolvedModel}) cannot be used as an advisor`,
    }
  }

  // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
  context.setAppState(s => {
    // 满足 `s.advisorModel === normalizedModel` 时，命令处理执行该分支。
    if (s.advisorModel === normalizedModel) return s
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { ...s, advisorModel: normalizedModel }
  })
  // 调用 updateSettingsForSource，触发命令处理此处需要的副作用。
  updateSettingsForSource('userSettings', { advisorModel: normalizedModel })

  // 满足 `!modelSupportsAdvisor(baseModel)` 时，命令处理执行该分支。
  if (!modelSupportsAdvisor(baseModel)) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `Advisor set to ${normalizedModel}.\nNote: Your current model (${baseModel}) does not support advisors. Switch to a supported model to use the advisor.`,
    }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: `Advisor set to ${normalizedModel}.`,
  }
}

// advisor 集中保存命令处理斜杠命令 advisor要一起传递的字段。
const advisor = {
  type: 'local',
  name: 'advisor',
  description: 'Configure the advisor model',
  argumentHint: '[<model>|off]',
  // 这个回调绑定到 isEnabled: () => canUserConfigureAdvisor(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => canUserConfigureAdvisor(),
  // 斜杠命令 advisor在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!canUserConfigureAdvisor()`，作为命令处理这次计算的结果。
    return !canUserConfigureAdvisor()
  },
  supportsNonInteractive: true,
  // 这个回调绑定到 load: () => Promise.resolve({ call }),，负责命令处理在该局部场景下的响应。
  load: () => Promise.resolve({ call }),
} satisfies Command

export default advisor
