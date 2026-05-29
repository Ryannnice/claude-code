// 引入 getAgentColorMap，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAgentColorMap } from '../../bootstrap/state.js'
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准工具调用的数据契约。
import type { Theme } from '../../utils/theme.js'

// AgentColorName 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentColorName =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan'

// AGENT_COLORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const AGENT_COLORS: readonly AgentColorName[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
] as const

// AGENT_COLOR_TO_THEME_COLOR 集中保存工具调用Agent 工具 agent Color Manager要一起传递的字段。
export const AGENT_COLOR_TO_THEME_COLOR = {
  red: 'red_FOR_SUBAGENTS_ONLY',
  blue: 'blue_FOR_SUBAGENTS_ONLY',
  green: 'green_FOR_SUBAGENTS_ONLY',
  yellow: 'yellow_FOR_SUBAGENTS_ONLY',
  purple: 'purple_FOR_SUBAGENTS_ONLY',
  orange: 'orange_FOR_SUBAGENTS_ONLY',
  pink: 'pink_FOR_SUBAGENTS_ONLY',
  cyan: 'cyan_FOR_SUBAGENTS_ONLY',
} as const satisfies Record<AgentColorName, keyof Theme>

// getAgentColor 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentColor(agentType: string): keyof Theme | undefined {
  // 当 `agentType` 匹配 `'general-purpose'` 时，工具调用执行对应分支。
  if (agentType === 'general-purpose') {
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }

  // agentColorMap读取`getAgentColorMap`，供工具调用后续处理使用。
  const agentColorMap = getAgentColorMap()

  // Check if color already assigned
  // existingColor读取`agentColorMap.get`，供工具调用后续处理使用。
  const existingColor = agentColorMap.get(agentType)
  // 只有 `existingColor && AGENT_COLORS.includes(existingColor)` 满足时，工具调用才执行该分支。
  if (existingColor && AGENT_COLORS.includes(existingColor)) {
    // 返回 `AGENT_COLOR_TO_THEME_COLOR[existingColor]`，作为工具调用这次计算的结果。
    return AGENT_COLOR_TO_THEME_COLOR[existingColor]
  }

  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

// setAgentColor 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAgentColor(
  agentType: string,
  color: AgentColorName | undefined,
): void {
  // agentColorMap读取`getAgentColorMap`，供工具调用后续处理使用。
  const agentColorMap = getAgentColorMap()

  // color缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!color) {
    // 调用 agentColorMap.delete，触发工具调用此处需要的副作用。
    agentColorMap.delete(agentType)
    // Agent 工具 agent Color Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `AGENT_COLORS.includes(color)` 时，工具调用执行该分支。
  if (AGENT_COLORS.includes(color)) {
    // agentColorMap.set 写入新的状态值，使工具调用后续读取保持一致。
    agentColorMap.set(agentType, color)
  }
}
