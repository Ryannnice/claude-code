// 类型依赖 { PermissionMode } 来自 ../permissions/PermissionMode.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../permissions/PermissionMode.js'
// 引入 capitalize，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { capitalize } from '../stringUtils.js'
// 引入 MODEL_ALIASES、ModelAlias，将 ./aliases.js 中已经封装好的能力接到本文件流程里。
import { MODEL_ALIASES, type ModelAlias } from './aliases.js'
// 引入 applyBedrockRegionPrefix、getBedrockRegionPrefix，将 ./bedrock.js 中已经封装好的能力接到本文件流程里。
import { applyBedrockRegionPrefix, getBedrockRegionPrefix } from './bedrock.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCanonicalName,
  getRuntimeMainLoopModel,
  parseUserSpecifiedModel,
} from './model.js'
// 引入 getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './providers.js'

// AGENT_MODEL_OPTIONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const AGENT_MODEL_OPTIONS = [...MODEL_ALIASES, 'inherit'] as const
// AgentModelAlias 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentModelAlias = (typeof AGENT_MODEL_OPTIONS)[number]

// AgentModelOption 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentModelOption = {
  value: AgentModelAlias
  label: string
  description: string
}

/**
 * Get the default subagent model. Returns 'inherit' so subagents inherit
 * the model from the parent thread.
 */
// getDefaultSubagentModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultSubagentModel(): string {
  // 返回 `'inherit'`，作为共享工具这次计算的结果。
  return 'inherit'
}

/**
 * Get the effective model string for an agent.
 *
 * For Bedrock, if the parent model uses a cross-region inference prefix (e.g., "eu.", "us."),
 * that prefix is inherited by subagents using alias models (e.g., "sonnet", "haiku", "opus").
 * This ensures subagents use the same region as the parent, which is necessary when
 * IAM permissions are scoped to specific cross-region inference profiles.
 */
// getAgentModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentModel(
  agentModel: string | undefined,
  parentModel: string,
  toolSpecifiedModel?: ModelAlias,
  permissionMode?: PermissionMode,
): string {
  // 满足 `process.env.CLAUDE_CODE_SUBAGENT_MODEL` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_SUBAGENT_MODEL) {
    // 返回 `parseUserSpecifiedModel(process.env.CLAUDE_CODE_SUBAGENT_MODEL)`，作为共享工具这次计算的结果。
    return parseUserSpecifiedModel(process.env.CLAUDE_CODE_SUBAGENT_MODEL)
  }

  // Extract Bedrock region prefix from parent model to inherit for subagents.
  // This ensures subagents use the same cross-region inference profile (e.g., "eu.", "us.")
  // as the parent, which is required when IAM permissions only allow specific regions.
  // parentRegionPrefix读取`getBedrockRegionPrefix`，供共享工具后续处理使用。
  const parentRegionPrefix = getBedrockRegionPrefix(parentModel)

  // Helper to apply parent region prefix for Bedrock models.
  // `originalSpec` is the raw model string before resolution (alias or full ID).
  // If the user explicitly specified a full model ID that already carries its own
  // region prefix (e.g., "eu.anthropic.…"), we preserve it instead of overwriting
  // with the parent's prefix. This prevents silent data-residency violations when
  // an agent config intentionally pins to a different region than the parent.
  // applyParentRegionPrefix 命名 `(`，让后续代码直接表达这个值的用途。
  const applyParentRegionPrefix = (
    resolvedModel: string,
    originalSpec: string,
  ): string => {
    // 当 `parentRegionPrefix && getAPIProvider()` 匹配 `'bedrock'` 时，共享工具执行对应分支。
    if (parentRegionPrefix && getAPIProvider() === 'bedrock') {
      // 满足 `getBedrockRegionPrefix(originalSpec)` 时，共享工具执行该分支。
      if (getBedrockRegionPrefix(originalSpec)) return resolvedModel
      // 返回 `applyBedrockRegionPrefix(resolvedModel, parentRegionPrefix)`，作为共享工具这次计算的结果。
      return applyBedrockRegionPrefix(resolvedModel, parentRegionPrefix)
    }
    // 返回 `resolvedModel`，作为共享工具这次计算的结果。
    return resolvedModel
  }

  // Prioritize tool-specified model if provided
  // 满足 `toolSpecifiedModel` 时，共享工具执行该分支。
  if (toolSpecifiedModel) {
    // 满足 `aliasMatchesParentTier(toolSpecifiedModel, parentModel)` 时，共享工具执行该分支。
    if (aliasMatchesParentTier(toolSpecifiedModel, parentModel)) {
      // 返回 `parentModel`，作为共享工具这次计算的结果。
      return parentModel
    }
    // 模型名称解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
    const model = parseUserSpecifiedModel(toolSpecifiedModel)
    // 返回 `applyParentRegionPrefix(model, toolSpecifiedModel)`，作为共享工具这次计算的结果。
    return applyParentRegionPrefix(model, toolSpecifiedModel)
  }

  // agentModelWithExp读取`getDefaultSubagentModel`，供共享工具后续处理使用。
  const agentModelWithExp = agentModel ?? getDefaultSubagentModel()

  // 当 `agentModelWithExp` 匹配 `'inherit'` 时，共享工具执行对应分支。
  if (agentModelWithExp === 'inherit') {
    // Apply runtime model resolution for inherit to get the effective model
    // This ensures agents using 'inherit' get opusplan→Opus resolution in plan mode
    // 返回 `getRuntimeMainLoopModel({`，作为共享工具这次计算的结果。
    return getRuntimeMainLoopModel({
      permissionMode: permissionMode ?? 'default',
      mainLoopModel: parentModel,
      exceeds200kTokens: false,
    })
  }

  // 满足 `aliasMatchesParentTier(agentModelWithExp, parentModel)` 时，共享工具执行该分支。
  if (aliasMatchesParentTier(agentModelWithExp, parentModel)) {
    // 返回 `parentModel`，作为共享工具这次计算的结果。
    return parentModel
  }
  // 模型名称解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
  const model = parseUserSpecifiedModel(agentModelWithExp)
  // 返回 `applyParentRegionPrefix(model, agentModelWithExp)`，作为共享工具这次计算的结果。
  return applyParentRegionPrefix(model, agentModelWithExp)
}

/**
 * Check if a bare family alias (opus/sonnet/haiku) matches the parent model's
 * tier. When it does, the subagent inherits the parent's exact model string
 * instead of resolving the alias to a provider default.
 *
 * Prevents surprising downgrades: a Vertex user on Opus 4.6 (via /model) who
 * spawns a subagent with `model: opus` should get Opus 4.6, not whatever
 * getDefaultOpusModel() returns for 3P.
 * See https://github.com/anthropics/claude-code/issues/30815.
 *
 * Only bare family aliases match. `opus[1m]`, `best`, `opusplan` fall through
 * since they carry semantics beyond "same tier as parent".
 */
// aliasMatchesParentTier 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function aliasMatchesParentTier(alias: string, parentModel: string): boolean {
  // canonical读取`getCanonicalName`，供共享工具后续处理使用。
  const canonical = getCanonicalName(parentModel)
  // 依据 alias.toLowerCase() 的取值选择共享工具的具体处理分支。
  switch (alias.toLowerCase()) {
    case 'opus':
      // 返回 `canonical.includes('opus')`，作为共享工具这次计算的结果。
      return canonical.includes('opus')
    case 'sonnet':
      // 返回 `canonical.includes('sonnet')`，作为共享工具这次计算的结果。
      return canonical.includes('sonnet')
    case 'haiku':
      // 返回 `canonical.includes('haiku')`，作为共享工具这次计算的结果。
      return canonical.includes('haiku')
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

// getAgentModelDisplay 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentModelDisplay(model: string | undefined): string {
  // When model is omitted, getDefaultSubagentModel() returns 'inherit' at runtime
  // 满足 `!model) return 'Inherit from parent (default` 时，共享工具执行该分支。
  if (!model) return 'Inherit from parent (default)'
  // 当 `model` 匹配 `'inherit'` 时，共享工具执行对应分支。
  if (model === 'inherit') return 'Inherit from parent'
  // 返回 `capitalize(model)`，作为共享工具这次计算的结果。
  return capitalize(model)
}

/**
 * Get available model options for agents
 */
// getAgentModelOptions 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentModelOptions(): AgentModelOption[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      value: 'sonnet',
      label: 'Sonnet',
      description: 'Balanced performance - best for most agents',
    },
    {
      value: 'opus',
      label: 'Opus',
      description: 'Most capable for complex reasoning tasks',
    },
    {
      value: 'haiku',
      label: 'Haiku',
      description: 'Fast and efficient for simple tasks',
    },
    {
      value: 'inherit',
      label: 'Inherit from parent',
      description: 'Use the same model as the main conversation',
    },
  ]
}
