// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../Tool.js'
// 接入 resolveAgentTools 工具实现，后续工具池会按权限和开关决定是否暴露。
import { resolveAgentTools } from '../../tools/AgentTool/agentToolUtils.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import type {
  AgentDefinition,
  CustomAgentDefinition,
} from '../../tools/AgentTool/loadAgentsDir.js'
// 引入 getAgentSourceDisplayName，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getAgentSourceDisplayName } from './utils.js'

// AgentValidationResult 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// validateAgentType 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateAgentType(agentType: string): string | null {
  // agentType缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!agentType) {
    // 返回 `'Agent type is required'`，作为终端渲染这次计算的结果。
    return 'Agent type is required'
  }

  // 满足 `!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(agentType)` 时，终端渲染执行该分支。
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(agentType)) {
    // 返回 `'Agent type must start and end with alphanumeric characters and contain...`，作为终端渲染这次计算的结果。
    return 'Agent type must start and end with alphanumeric characters and contain only letters, numbers, and hyphens'
  }

  // 满足 `agentType.length < 3` 时，终端渲染执行该分支。
  if (agentType.length < 3) {
    // 返回 `'Agent type must be at least 3 characters long'`，作为终端渲染这次计算的结果。
    return 'Agent type must be at least 3 characters long'
  }

  // 满足 `agentType.length > 50` 时，终端渲染执行该分支。
  if (agentType.length > 50) {
    // 返回 `'Agent type must be less than 50 characters'`，作为终端渲染这次计算的结果。
    return 'Agent type must be less than 50 characters'
  }

  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// validateAgent 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateAgent(
  agent: Omit<CustomAgentDefinition, 'location'>,
  availableTools: Tools,
  existingAgents: AgentDefinition[],
): AgentValidationResult {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: string[] = []
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: string[] = []

  // Validate agent type
  // agent.agentType缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!agent.agentType) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push('Agent type is required')
  } else {
    // typeError 错误信息读取`validateAgentType`，供终端渲染后续处理使用。
    const typeError = validateAgentType(agent.agentType)
    // 满足 `typeError` 时，终端渲染执行该分支。
    if (typeError) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(typeError)
    }

    // Check for duplicates (excluding self for editing)
    // duplicate筛选`existingAgents.find`，供终端渲染后续处理使用。
    const duplicate = existingAgents.find(
      // a更新为 `> a.agentType === agent.agentType && a.source !== agent.s...`，确保Agent 配置界面后续读取最新状态。
      a => a.agentType === agent.agentType && a.source !== agent.source,
    )
    // 满足 `duplicate` 时，终端渲染执行该分支。
    if (duplicate) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(
        `Agent type "${agent.agentType}" already exists in ${getAgentSourceDisplayName(duplicate.source)}`,
      )
    }
  }

  // Validate description
  // agent.whenToUse缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!agent.whenToUse) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push('Description (description) is required')
  // 终端 UI 组件 validate Agent在这里处理 `} else if (agent.whenToUse.length < 10) {`，完成这一小步状态转换。
  } else if (agent.whenToUse.length < 10) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push(
      'Description should be more descriptive (at least 10 characters)',
    )
  // 终端 UI 组件 validate Agent在这里处理 `} else if (agent.whenToUse.length > 5000) {`，完成这一小步状态转换。
  } else if (agent.whenToUse.length > 5000) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push('Description is very long (over 5000 characters)')
  }

  // Validate tools
  // `agent.tools` 与 `undefined && !Array.isArray(age...` 不一致时刷新派生状态，避免使用过期结果。
  if (agent.tools !== undefined && !Array.isArray(agent.tools)) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push('Tools must be an array')
  } else {
    // 满足 `agent.tools === undefined` 时，终端渲染执行该分支。
    if (agent.tools === undefined) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push('Agent has access to all tools')
    // 终端 UI 组件 validate Agent在这里处理 `} else if (agent.tools.length === 0) {`，完成这一小步状态转换。
    } else if (agent.tools.length === 0) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push(
        'No tools selected - agent will have very limited capabilities',
      )
    }

    // Check for invalid tools
    // resolvedTools 集合读取`resolveAgentTools`，供终端渲染后续处理使用。
    const resolvedTools = resolveAgentTools(agent, availableTools, false)

    // 满足 `resolvedTools.invalidTools.length > 0` 时，终端渲染执行该分支。
    if (resolvedTools.invalidTools.length > 0) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`Invalid tools: ${resolvedTools.invalidTools.join(', ')}`)
    }
  }

  // Validate system prompt
  // 系统提示词读取`agent.getSystemPrompt`，供终端渲染后续处理使用。
  const systemPrompt = agent.getSystemPrompt()
  // 系统提示词缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!systemPrompt) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push('System prompt is required')
  // 终端 UI 组件 validate Agent在这里处理 `} else if (systemPrompt.length < 20) {`，完成这一小步状态转换。
  } else if (systemPrompt.length < 20) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push('System prompt is too short (minimum 20 characters)')
  // 终端 UI 组件 validate Agent在这里处理 `} else if (systemPrompt.length > 10000) {`，完成这一小步状态转换。
  } else if (systemPrompt.length > 10000) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push('System prompt is very long (over 10,000 characters)')
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
