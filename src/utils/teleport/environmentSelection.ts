// 引入 SETTING_SOURCES、SettingSource，将 ../settings/constants.js 中已经封装好的能力接到本文件流程里。
import { SETTING_SOURCES, type SettingSource } from '../settings/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from '../settings/settings.js'
// 引入 EnvironmentResource、fetchEnvironments，将 ./environments.js 中已经封装好的能力接到本文件流程里。
import { type EnvironmentResource, fetchEnvironments } from './environments.js'

// EnvironmentSelectionInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvironmentSelectionInfo = {
  availableEnvironments: EnvironmentResource[]
  selectedEnvironment: EnvironmentResource | null
  selectedEnvironmentSource: SettingSource | null
}

/**
 * Gets information about available environments and the currently selected one.
 *
 * @returns Promise<EnvironmentSelectionInfo> containing:
 *   - availableEnvironments: all environments from the API
 *   - selectedEnvironment: the environment that would be used (based on settings or first available),
 *     or null if no environments are available
 *   - selectedEnvironmentSource: the SettingSource where defaultEnvironmentId is configured,
 *     or null if using the default (first environment)
 */
// getEnvironmentSelectionInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getEnvironmentSelectionInfo(): Promise<EnvironmentSelectionInfo> {
  // Fetch available environments
  // environments 集合读取`fetchEnvironments`，供共享工具后续处理使用。
  const environments = await fetchEnvironments()

  // environments 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (environments.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      availableEnvironments: [],
      selectedEnvironment: null,
      selectedEnvironmentSource: null,
    }
  }

  // Get the merged settings to see what would actually be used
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED()
  // defaultEnvironmentId 命名 `mergedSettings?.remote?.defaultEnvironmentId`，让后续代码直接表达这个值的用途。
  const defaultEnvironmentId = mergedSettings?.remote?.defaultEnvironmentId

  // Find which environment would be selected
  // selectedEnvironment 先占位，稍后的条件分支会根据实际输入补齐它。
  let selectedEnvironment: EnvironmentResource =
    // 调用 environments.find，触发共享工具此处需要的副作用。
    environments.find(env => env.kind !== 'bridge') ?? environments[0]!
  // selectedEnvironmentSource初始化为空值，后续分支会在有数据时补齐。
  let selectedEnvironmentSource: SettingSource | null = null

  // 满足 `defaultEnvironmentId` 时，共享工具执行该分支。
  if (defaultEnvironmentId) {
    // matchingEnvironment筛选`environments.find`，供共享工具后续处理使用。
    const matchingEnvironment = environments.find(
      // env更新为 `> env.environment_id === defaultEnvironmentId`，确保共享工具后续读取最新状态。
      env => env.environment_id === defaultEnvironmentId,
    )

    // 满足 `matchingEnvironment` 时，共享工具执行该分支。
    if (matchingEnvironment) {
      // selectedEnvironment更新为 `matchingEnvironment`，确保共享工具后续读取最新状态。
      selectedEnvironment = matchingEnvironment

      // Find which source has this setting
      // Iterate from lowest to highest priority, so the last match wins (highest priority)
      // 循环处理 `let i = SETTING_SOURCES.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
      for (let i = SETTING_SOURCES.length - 1; i >= 0; i--) {
        // source读取 `SETTING_SOURCES[i]` 对应条目，后续围绕该成员继续处理。
        const source = SETTING_SOURCES[i]
        // 当 `!source || source` 匹配 `'flagSettings'` 时，共享工具执行对应分支。
        if (!source || source === 'flagSettings') {
          // Skip flagSettings as it's not a normal source we check
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // sourceSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
        const sourceSettings = getSettingsForSource(source)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          sourceSettings?.remote?.defaultEnvironmentId === defaultEnvironmentId
        ) {
          // selectedEnvironmentSource更新为 `source`，确保共享工具后续读取最新状态。
          selectedEnvironmentSource = source
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    availableEnvironments: environments,
    selectedEnvironment,
    selectedEnvironmentSource,
  }
}
