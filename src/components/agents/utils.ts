// 引入 capitalize，将 lodash-es/capitalize.js 中已经封装好的能力接到本文件流程里。
import capitalize from 'lodash-es/capitalize.js'
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js'
// 复用 getSettingSourceName 工具函数，把通用处理留在 src/utils/settings/constants.js 中维护。
import { getSettingSourceName } from 'src/utils/settings/constants.js'

// getAgentSourceDisplayName 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentSourceDisplayName(
  source: SettingSource | 'all' | 'built-in' | 'plugin',
): string {
  // 当 `source` 匹配 `'all'` 时，终端渲染执行对应分支。
  if (source === 'all') {
    // 返回 `'Agents'`，作为终端渲染这次计算的结果。
    return 'Agents'
  }
  // 当 `source` 匹配 `'built-in'` 时，终端渲染执行对应分支。
  if (source === 'built-in') {
    // 返回 `'Built-in agents'`，作为终端渲染这次计算的结果。
    return 'Built-in agents'
  }
  // 当 `source` 匹配 `'plugin'` 时，终端渲染执行对应分支。
  if (source === 'plugin') {
    // 返回 `'Plugin agents'`，作为终端渲染这次计算的结果。
    return 'Plugin agents'
  }
  // 返回 `capitalize(getSettingSourceName(source))`，作为终端渲染这次计算的结果。
  return capitalize(getSettingSourceName(source))
}
