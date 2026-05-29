// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  EFFORT_HIGH,
  EFFORT_LOW,
  EFFORT_MAX,
  EFFORT_MEDIUM,
} from '../constants/figures.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type EffortLevel,
  type EffortValue,
  getDisplayedEffortLevel,
  modelSupportsEffort,
} from '../utils/effort.js'

/**
 * Build the text for the effort-changed notification, e.g. "◐ medium · /effort".
 * Returns undefined if the model doesn't support effort.
 */
// getEffortNotificationText 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffortNotificationText(
  effortValue: EffortValue | undefined,
  model: string,
): string | undefined {
  // 满足 `!modelSupportsEffort(model)` 时，终端渲染执行该分支。
  if (!modelSupportsEffort(model)) return undefined
  // level读取`getDisplayedEffortLevel`，供终端渲染后续处理使用。
  const level = getDisplayedEffortLevel(model, effortValue)
  // 返回 ``${effortLevelToSymbol(level)} ${level} · /effort``，作为终端渲染这次计算的结果。
  return `${effortLevelToSymbol(level)} ${level} · /effort`
}

// effortLevelToSymbol 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function effortLevelToSymbol(level: EffortLevel): string {
  // 按照 level 的取值选择终端渲染的具体处理分支。
  switch (level) {
    case 'low':
      // 返回 `EFFORT_LOW`，作为终端渲染这次计算的结果。
      return EFFORT_LOW
    case 'medium':
      // 返回 `EFFORT_MEDIUM`，作为终端渲染这次计算的结果。
      return EFFORT_MEDIUM
    case 'high':
      // 返回 `EFFORT_HIGH`，作为终端渲染这次计算的结果。
      return EFFORT_HIGH
    case 'max':
      // 返回 `EFFORT_MAX`，作为终端渲染这次计算的结果。
      return EFFORT_MAX
    default:
      // Defensive: level can originate from remote config. If an unknown
      // value slips through, render the high symbol rather than undefined.
      // 返回 `EFFORT_HIGH`，作为终端渲染这次计算的结果。
      return EFFORT_HIGH
  }
}
