// 类型依赖 { TextProps } 来自 ../ink.js，用于校准共享工具的数据契约。
import type { TextProps } from '../ink.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  AGENT_COLOR_TO_THEME_COLOR,
  type AgentColorName,
} from '../tools/AgentTool/agentColorManager.js'

// DEFAULT_AGENT_THEME_COLOR固定为 `'cyan_FOR_SUBAGENTS_ONLY'`，作为共享工具 ink后续展示或比较的基准。
const DEFAULT_AGENT_THEME_COLOR = 'cyan_FOR_SUBAGENTS_ONLY'

/**
 * Convert a color string to Ink's TextProps['color'] format.
 * Colors are typically AgentColorName values like 'blue', 'green', etc.
 * This converts them to theme keys so they respect the current theme.
 * Falls back to the raw ANSI color if the color is not a known agent color.
 */
// toInkColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toInkColor(color: string | undefined): TextProps['color'] {
  // color缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!color) {
    // 返回 `DEFAULT_AGENT_THEME_COLOR`，作为共享工具这次计算的结果。
    return DEFAULT_AGENT_THEME_COLOR
  }
  // Try to map to a theme color if it's a known agent color
  // themeColor读取 `AGENT_COLOR_TO_THEME_COLOR[color as AgentColorName]` 对应条目，后续围绕该成员继续处理。
  const themeColor = AGENT_COLOR_TO_THEME_COLOR[color as AgentColorName]
  // 满足 `themeColor` 时，共享工具执行该分支。
  if (themeColor) {
    // 返回 `themeColor`，作为共享工具这次计算的结果。
    return themeColor
  }
  // Fall back to raw ANSI color for unknown colors
  // 返回 ``ansi:${color}` as TextProps['color']`，作为共享工具这次计算的结果。
  return `ansi:${color}` as TextProps['color']
}
