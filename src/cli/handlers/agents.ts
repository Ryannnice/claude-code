/**
 * Agents subcommand handler — prints the list of configured agents.
 * Dynamically imported only when `claude agents` runs.
 */

// 整理这一组导入，让agents后续逻辑可以直接复用这些外部能力。
import {
  AGENT_SOURCE_GROUPS,
  compareAgentsByName,
  getOverrideSourceLabel,
  type ResolvedAgent,
  resolveAgentModelDisplay,
  resolveAgentOverrides,
} from '../../tools/AgentTool/agentDisplay.js'
// 整理这一组导入，让agents后续逻辑可以直接复用这些外部能力。
import {
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
} from '../../tools/AgentTool/loadAgentsDir.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'

// formatAgent 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatAgent(agent: ResolvedAgent): string {
  // 模型名称读取`resolveAgentModelDisplay`，供agents后续处理使用。
  const model = resolveAgentModelDisplay(agent)
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [agent.agentType]
  // 满足 `model` 时，agents执行该分支。
  if (model) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(model)
  }
  // 满足 `agent.memory` 时，agents执行该分支。
  if (agent.memory) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${agent.memory} memory`)
  }
  // 返回 `parts.join(' · ')`，作为agents这次计算的结果。
  return parts.join(' · ')
}

// agentsHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function agentsHandler(): Promise<void> {
  // cwd读取`getCwd`，供agents后续处理使用。
  const cwd = getCwd()
  // 从 `await getAgentDefinitionsWithOverrides(cwd)` 解构 allAgents，减少agents对同一对象的重复访问。
  const { allAgents } = await getAgentDefinitionsWithOverrides(cwd)
  // activeAgents 集合读取`getActiveAgentsFromList`，供agents后续处理使用。
  const activeAgents = getActiveAgentsFromList(allAgents)
  // resolvedAgents 集合读取`resolveAgentOverrides`，供agents后续处理使用。
  const resolvedAgents = resolveAgentOverrides(allAgents, activeAgents)

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // totalActive保存`0`，供后续判断或组装使用。
  let totalActive = 0

  // 循环处理 `const { label, source } of AGENT_SOURCE_GROUPS`，让agents逐项把同类条目按顺序走完。
  for (const { label, source } of AGENT_SOURCE_GROUPS) {
    // groupAgents 集合读取`resolvedAgents`，供后续判断或组装使用。
    const groupAgents = resolvedAgents
      // 链式调用 filter，继续加工上一行在agents中产生的数据。
      .filter(a => a.source === source)
      .sort(compareAgentsByName)

    // groupAgents 集合为空时立即返回或跳过，避免agents把空集合当成可处理内容。
    if (groupAgents.length === 0) continue

    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`${label}:`)
    // 按顺序遍历 `groupAgents` 中的agent，逐个交给agents处理。
    for (const agent of groupAgents) {
      // 满足 `agent.overriddenBy` 时，agents执行该分支。
      if (agent.overriddenBy) {
        // winnerSource读取`getOverrideSourceLabel`，供agents后续处理使用。
        const winnerSource = getOverrideSourceLabel(agent.overriddenBy)
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(`  (shadowed by ${winnerSource}) ${formatAgent(agent)}`)
      } else {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(`  ${formatAgent(agent)}`)
        // agents在这里处理 `totalActive++`，完成这一小步状态转换。
        totalActive++
      }
    }
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push('')
  }

  // 文本行为空时立即返回或跳过，避免agents把空集合当成可处理内容。
  if (lines.length === 0) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发agents此处需要的副作用。
    console.log('No agents found.')
  } else {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发agents此处需要的副作用。
    console.log(`${totalActive} active agents\n`)
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发agents此处需要的副作用。
    console.log(lines.join('\n').trimEnd())
  }
}
