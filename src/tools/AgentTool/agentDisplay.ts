/**
 * Shared utilities for displaying agent information.
 * Used by both the CLI `claude agents` handler and the interactive `/agents` command.
 */

// 复用 getDefaultSubagentModel 工具函数，把通用处理留在 ../../utils/model/agent.js 中维护。
import { getDefaultSubagentModel } from '../../utils/model/agent.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getSourceDisplayName,
  type SettingSource,
} from '../../utils/settings/constants.js'
// 类型依赖 { AgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { AgentDefinition } from './loadAgentsDir.js'

// AgentSource 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentSource = SettingSource | 'built-in' | 'plugin'

// AgentSourceGroup 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentSourceGroup = {
  label: string
  source: AgentSource
}

/**
 * Ordered list of agent source groups for display.
 * Both the CLI and interactive UI should use this to ensure consistent ordering.
 */
// AGENT_SOURCE_GROUPS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const AGENT_SOURCE_GROUPS: AgentSourceGroup[] = [
  { label: 'User agents', source: 'userSettings' },
  { label: 'Project agents', source: 'projectSettings' },
  { label: 'Local agents', source: 'localSettings' },
  { label: 'Managed agents', source: 'policySettings' },
  { label: 'Plugin agents', source: 'plugin' },
  { label: 'CLI arg agents', source: 'flagSettings' },
  { label: 'Built-in agents', source: 'built-in' },
]

// ResolvedAgent 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolvedAgent = AgentDefinition & {
  overriddenBy?: AgentSource
}

/**
 * Annotate agents with override information by comparing against the active
 * (winning) agent list. An agent is "overridden" when another agent with the
 * same type from a higher-priority source takes precedence.
 *
 * Also deduplicates by (agentType, source) to handle git worktree duplicates
 * where the same agent file is loaded from both the worktree and main repo.
 */
// resolveAgentOverrides 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveAgentOverrides(
  allAgents: AgentDefinition[],
  activeAgents: AgentDefinition[],
): ResolvedAgent[] {
  // activeMap 命名 `new Map<string, AgentDefinition>()`，让后续代码直接表达这个值的用途。
  const activeMap = new Map<string, AgentDefinition>()
  // 按顺序遍历 `activeAgents` 中的agent，逐个交给工具调用处理。
  for (const agent of activeAgents) {
    // activeMap.set 写入新的状态值，使工具调用后续读取保持一致。
    activeMap.set(agent.agentType, agent)
  }

  // seen 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const seen = new Set<string>()
  // resolved 从空数组开始收集，后续循环会按处理顺序追加条目。
  const resolved: ResolvedAgent[] = []

  // Iterate allAgents, annotating each with override info from activeAgents.
  // Deduplicate by (agentType, source) to handle git worktree duplicates.
  // 按顺序遍历 `allAgents` 中的agent，逐个交给工具调用处理。
  for (const agent of allAgents) {
    // key保存``${agent.agentType}:${agent.source}``，作为后续固定文本处理的输入。
    const key = `${agent.agentType}:${agent.source}`
    // 满足 `seen.has(key)` 时，工具调用执行该分支。
    if (seen.has(key)) continue
    // 调用 seen.add，触发工具调用此处需要的副作用。
    seen.add(key)

    // active读取`activeMap.get`，供工具调用后续处理使用。
    const active = activeMap.get(agent.agentType)
    // overriddenBy 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const overriddenBy =
      active && active.source !== agent.source ? active.source : undefined
    // resolved追加新条目，保持收集顺序与输入顺序一致。
    resolved.push({ ...agent, overriddenBy })
  }

  // 返回 `resolved`，作为工具调用这次计算的结果。
  return resolved
}

/**
 * Resolve the display model string for an agent.
 * Returns the model alias or 'inherit' for display purposes.
 */
// resolveAgentModelDisplay 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveAgentModelDisplay(
  agent: AgentDefinition,
): string | undefined {
  // 模型名称读取`getDefaultSubagentModel`，供工具调用后续处理使用。
  const model = agent.model || getDefaultSubagentModel()
  // 模型名称缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!model) return undefined
  // 返回 `model === 'inherit' ? 'inherit' : model`，作为工具调用这次计算的结果。
  return model === 'inherit' ? 'inherit' : model
}

/**
 * Get a human-readable label for the source that overrides an agent.
 * Returns lowercase, e.g. "user", "project", "managed".
 */
// getOverrideSourceLabel 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOverrideSourceLabel(source: AgentSource): string {
  // 返回 `getSourceDisplayName(source).toLowerCase()`，作为工具调用这次计算的结果。
  return getSourceDisplayName(source).toLowerCase()
}

/**
 * Compare agents alphabetically by name (case-insensitive).
 */
// compareAgentsByName 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function compareAgentsByName(
  a: AgentDefinition,
  b: AgentDefinition,
): number {
  // 返回 `a.agentType.localeCompare(b.agentType, undefined, {`，作为工具调用这次计算的结果。
  return a.agentType.localeCompare(b.agentType, undefined, {
    sensitivity: 'base',
  })
}
