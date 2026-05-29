// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../services/tokenEstimation.js'
// 类型依赖 { AgentDefinitionsResult } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinitionsResult } from '../tools/AgentTool/loadAgentsDir.js'

// AGENT_DESCRIPTIONS_THRESHOLD保存`15_000`，供共享工具 status Notice Helpers后续判断或输出使用。
export const AGENT_DESCRIPTIONS_THRESHOLD = 15_000

/**
 * Calculate cumulative token estimate for agent descriptions
 */
// getAgentDescriptionsTotalTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentDescriptionsTotalTokens(
  agentDefinitions?: AgentDefinitionsResult,
): number {
  // agentDefinitions 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentDefinitions) return 0

  // 返回 `agentDefinitions.activeAgents`，作为共享工具这次计算的结果。
  return agentDefinitions.activeAgents
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(a => a.source !== 'built-in')
    // 链式调用 reduce，继续加工上一行在共享工具中产生的数据。
    .reduce((total, agent) => {
      // description 命名 ``${agent.agentType}: ${agent.whenToUse}``，让后续代码直接表达这个值的用途。
      const description = `${agent.agentType}: ${agent.whenToUse}`
      // 返回 `total + roughTokenCountEstimation(description)`，作为共享工具这次计算的结果。
      return total + roughTokenCountEstimation(description)
    }, 0)
}
