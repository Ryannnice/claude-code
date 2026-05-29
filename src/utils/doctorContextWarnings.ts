// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../services/tokenEstimation.js'
// 类型依赖 { Tool, ToolPermissionContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tool, ToolPermissionContext } from '../Tool.js'
// 类型依赖 { AgentDefinitionsResult } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinitionsResult } from '../tools/AgentTool/loadAgentsDir.js'
// 引入 countMcpToolTokens，将 ./analyzeContext.js 中已经封装好的能力接到本文件流程里。
import { countMcpToolTokens } from './analyzeContext.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLargeMemoryFiles,
  getMemoryFiles,
  MAX_MEMORY_CHARACTER_COUNT,
} from './claudemd.js'
// 引入 getMainLoopModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModel } from './model/model.js'
// 引入 permissionRuleValueToString，将 ./permissions/permissionRuleParser.js 中已经封装好的能力接到本文件流程里。
import { permissionRuleValueToString } from './permissions/permissionRuleParser.js'
// 引入 detectUnreachableRules，将 ./permissions/shadowedRuleDetection.js 中已经封装好的能力接到本文件流程里。
import { detectUnreachableRules } from './permissions/shadowedRuleDetection.js'
// 引入 SandboxManager，将 ./sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from './sandbox/sandbox-adapter.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  AGENT_DESCRIPTIONS_THRESHOLD,
  getAgentDescriptionsTotalTokens,
} from './statusNoticeHelpers.js'
// 引入 plural，将 ./stringUtils.js 中已经封装好的能力接到本文件流程里。
import { plural } from './stringUtils.js'

// Thresholds (matching status notices and existing patterns)
// MCP_TOOLS_THRESHOLD 命名 `25_000 // 15k tokens`，让后续代码直接表达这个值的用途。
const MCP_TOOLS_THRESHOLD = 25_000 // 15k tokens

// ContextWarning 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContextWarning = {
  type:
    | 'claudemd_files'
    | 'agent_descriptions'
    | 'mcp_tools'
    | 'unreachable_rules'
  severity: 'warning' | 'error'
  message: string
  details: string[]
  currentValue: number
  threshold: number
}

// ContextWarnings 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContextWarnings = {
  claudeMdWarning: ContextWarning | null
  agentWarning: ContextWarning | null
  mcpWarning: ContextWarning | null
  unreachableRulesWarning: ContextWarning | null
}

// checkClaudeMdFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkClaudeMdFiles(): Promise<ContextWarning | null> {
  // largeFiles 文件数据读取`getLargeMemoryFiles`，供共享工具后续处理使用。
  const largeFiles = getLargeMemoryFiles(await getMemoryFiles())

  // This already filters for files > 40k chars each
  // largeFiles 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (largeFiles.length === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // details 集合 命名 `largeFiles`，让后续代码直接表达这个值的用途。
  const details = largeFiles
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => b.content.length - a.content.length)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(file => `${file.path}: ${file.content.length.toLocaleString()} chars`)

  // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const message =
    largeFiles.length === 1
      ? `Large CLAUDE.md file detected (${largeFiles[0]!.content.length.toLocaleString()} chars > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()})`
      : `${largeFiles.length} large CLAUDE.md files detected (each > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()} chars)`

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'claudemd_files',
    severity: 'warning',
    message,
    details,
    currentValue: largeFiles.length, // Number of files exceeding threshold
    threshold: MAX_MEMORY_CHARACTER_COUNT,
  }
}

/**
 * Check agent descriptions token count
 */
// checkAgentDescriptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkAgentDescriptions(
  agentInfo: AgentDefinitionsResult | null,
): Promise<ContextWarning | null> {
  // agentInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentInfo) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // totalTokens 集合读取`getAgentDescriptionsTotalTokens`，供共享工具后续处理使用。
  const totalTokens = getAgentDescriptionsTotalTokens(agentInfo)

  // 满足 `totalTokens <= AGENT_DESCRIPTIONS_THRESHOLD` 时，共享工具执行该分支。
  if (totalTokens <= AGENT_DESCRIPTIONS_THRESHOLD) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Calculate tokens for each agent
  // agentTokens 集合保存`agentInfo.activeAgents`，供共享工具 doctor Context Warnings后续判断或输出使用。
  const agentTokens = agentInfo.activeAgents
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(a => a.source !== 'built-in')
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(agent => {
      // description固定为 ``${agent.agentType}: ${agent.whenToUse}``，作为共享工具 doctor Context Warnings后续展示或比较的基准。
      const description = `${agent.agentType}: ${agent.whenToUse}`
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        name: agent.agentType,
        tokens: roughTokenCountEstimation(description),
      }
    })
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => b.tokens - a.tokens)

  // details 集合 命名 `agentTokens`，让后续代码直接表达这个值的用途。
  const details = agentTokens
    .slice(0, 5)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(agent => `${agent.name}: ~${agent.tokens.toLocaleString()} tokens`)

  // 满足 `agentTokens.length > 5` 时，共享工具执行该分支。
  if (agentTokens.length > 5) {
    // details 集合追加新条目，保持收集顺序与输入顺序一致。
    details.push(`(${agentTokens.length - 5} more custom agents)`)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'agent_descriptions',
    severity: 'warning',
    message: `Large agent descriptions (~${totalTokens.toLocaleString()} tokens > ${AGENT_DESCRIPTIONS_THRESHOLD.toLocaleString()})`,
    details,
    currentValue: totalTokens,
    threshold: AGENT_DESCRIPTIONS_THRESHOLD,
  }
}

/**
 * Check MCP tools token count
 */
// checkMcpTools 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkMcpTools(
  tools: Tool[],
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agentInfo: AgentDefinitionsResult | null,
): Promise<ContextWarning | null> {
  // mcpTools 集合筛选`tools.filter`，供共享工具后续处理使用。
  const mcpTools = tools.filter(tool => tool.isMcp)

  // Note: MCP tools are loaded asynchronously and may not be available
  // when doctor command runs, as it executes before MCP connections are established
  // mcpTools 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (mcpTools.length === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Use the existing countMcpToolTokens function from analyzeContext
    // 模型名称读取`getMainLoopModel`，供共享工具后续处理使用。
    const model = getMainLoopModel()
    // 从 `await countMcpToolTokens(` 解构 mcpToolTokens、mcpToolDetails，减少共享工具 doctor Context Warnings对同一对象的重复访问。
    const { mcpToolTokens, mcpToolDetails } = await countMcpToolTokens(
      tools,
      getToolPermissionContext,
      agentInfo,
      model,
    )

    // 满足 `mcpToolTokens <= MCP_TOOLS_THRESHOLD` 时，共享工具执行该分支。
    if (mcpToolTokens <= MCP_TOOLS_THRESHOLD) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Group tools by server
    // toolsByServer 命名 `new Map<string, { count: number; tokens: number }>()`，让后续代码直接表达这个值的用途。
    const toolsByServer = new Map<string, { count: number; tokens: number }>()

    // 按顺序遍历 `mcpToolDetails` 中的工具，逐个交给共享工具处理。
    for (const tool of mcpToolDetails) {
      // Extract server name from tool name (format: mcp__servername__toolname)
      // 片段列表格式化`name.split`，供共享工具后续处理使用。
      const parts = tool.name.split('__')
      // serverName标记共享工具 doctor Context Warnings是否启用对应路径。
      const serverName = parts[1] || 'unknown'

      // current读取`toolsByServer.get`，供共享工具后续处理使用。
      const current = toolsByServer.get(serverName) || { count: 0, tokens: 0 }
      // toolsByServer.set 写入新的状态值，使共享工具后续读取保持一致。
      toolsByServer.set(serverName, {
        count: current.count + 1,
        tokens: current.tokens + tool.tokens,
      })
    }

    // Sort servers by token count
    // sortedServers 集合保存`Array.from`，供共享工具后续处理使用。
    const sortedServers = Array.from(toolsByServer.entries()).sort(
      // 这个回调绑定到 (a, b) => b[1].tokens - a[1].tokens,，负责共享工具在该局部场景下的响应。
      (a, b) => b[1].tokens - a[1].tokens,
    )

    // details 集合保存`sortedServers`，供后续判断或组装使用。
    const details = sortedServers
      .slice(0, 5)
      .map(
        // 这个回调绑定到 ([name, info]) =>，负责共享工具在该局部场景下的响应。
        ([name, info]) =>
          `${name}: ${info.count} tools (~${info.tokens.toLocaleString()} tokens)`,
      )

    // 满足 `sortedServers.length > 5` 时，共享工具执行该分支。
    if (sortedServers.length > 5) {
      // details 集合追加新条目，保持收集顺序与输入顺序一致。
      details.push(`(${sortedServers.length - 5} more servers)`)
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'mcp_tools',
      severity: 'warning',
      message: `Large MCP tools context (~${mcpToolTokens.toLocaleString()} tokens > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details,
      currentValue: mcpToolTokens,
      threshold: MCP_TOOLS_THRESHOLD,
    }
  } catch (_error) {
    // If token counting fails, fall back to character-based estimation
    // estimatedTokens 集合派生`mcpTools.reduce`，供共享工具后续处理使用。
    const estimatedTokens = mcpTools.reduce((total, tool) => {
      // chars 集合标记共享工具 doctor Context Warnings是否启用对应路径。
      const chars = (tool.name?.length || 0) + tool.description.length
      // 返回 `total + roughTokenCountEstimation(chars.toString())`，作为共享工具这次计算的结果。
      return total + roughTokenCountEstimation(chars.toString())
    }, 0)

    // 满足 `estimatedTokens <= MCP_TOOLS_THRESHOLD` 时，共享工具执行该分支。
    if (estimatedTokens <= MCP_TOOLS_THRESHOLD) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'mcp_tools',
      severity: 'warning',
      message: `Large MCP tools context (~${estimatedTokens.toLocaleString()} tokens estimated > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details: [
        `${mcpTools.length} MCP tools detected (token count estimated)`,
      ],
      currentValue: estimatedTokens,
      threshold: MCP_TOOLS_THRESHOLD,
    }
  }
}

/**
 * Check for unreachable permission rules (e.g., specific allow rules shadowed by tool-wide ask rules)
 */
// checkUnreachableRules 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkUnreachableRules(
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
): Promise<ContextWarning | null> {
  // 上下文读取`getToolPermissionContext`，供共享工具后续处理使用。
  const context = await getToolPermissionContext()
  // sandboxAutoAllowEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sandboxAutoAllowEnabled =
    SandboxManager.isSandboxingEnabled() &&
    SandboxManager.isAutoAllowBashIfSandboxedEnabled()

  // unreachable读取`detectUnreachableRules`，供共享工具后续处理使用。
  const unreachable = detectUnreachableRules(context, {
    sandboxAutoAllowEnabled,
  })

  // unreachable为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (unreachable.length === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // details 集合派生`unreachable.flatMap`，供共享工具后续处理使用。
  const details = unreachable.flatMap(r => [
    `${permissionRuleValueToString(r.rule.ruleValue)}: ${r.reason}`,
    `  Fix: ${r.fix}`,
  ])

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'unreachable_rules',
    severity: 'warning',
    message: `${unreachable.length} ${plural(unreachable.length, 'unreachable permission rule')} detected`,
    details,
    currentValue: unreachable.length,
    threshold: 0,
  }
}

/**
 * Check all context warnings for the doctor command
 */
// checkContextWarnings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkContextWarnings(
  tools: Tool[],
  agentInfo: AgentDefinitionsResult | null,
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>,，负责共享工具在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
): Promise<ContextWarnings> {
  // 共享工具 doctor Context Warnings先整理这一处局部数据，后续分支可以直接读取。
  const [claudeMdWarning, agentWarning, mcpWarning, unreachableRulesWarning] =
    await Promise.all([
      checkClaudeMdFiles(),
      checkAgentDescriptions(agentInfo),
      checkMcpTools(tools, getToolPermissionContext, agentInfo),
      checkUnreachableRules(getToolPermissionContext),
    ])

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    claudeMdWarning,
    agentWarning,
    mcpWarning,
    unreachableRulesWarning,
  }
}
