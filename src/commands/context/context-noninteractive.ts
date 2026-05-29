// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 microcompactMessages 服务层能力，把外部通信或共享状态交给 ../../services/compact/microCompact.js 处理。
import { microcompactMessages } from '../../services/compact/microCompact.js'
// 类型依赖 { AppState } 来自 ../../state/AppStateStore.js，用于校准命令处理的数据契约。
import type { AppState } from '../../state/AppStateStore.js'
// 类型依赖 { Tools, ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { Tools, ToolUseContext } from '../../Tool.js'
// 类型依赖 { AgentDefinitionsResult } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准命令处理的数据契约。
import type { AgentDefinitionsResult } from '../../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  analyzeContextUsage,
  type ContextData,
} from '../../utils/analyzeContext.js'
// 复用 formatTokens 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatTokens } from '../../utils/format.js'
// 复用 getMessagesAfterCompactBoundary 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { getMessagesAfterCompactBoundary } from '../../utils/messages.js'
// 复用 getSourceDisplayName 工具函数，把通用处理留在 ../../utils/settings/constants.js 中维护。
import { getSourceDisplayName } from '../../utils/settings/constants.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'

/**
 * Shared data-collection path for `/context` (slash command) and the SDK
 * `get_context_usage` control request. Mirrors query.ts's pre-API transforms
 * (compact boundary, projectView, microcompact) so the token count reflects
 * what the model actually sees.
 */
// CollectContextDataInput 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type CollectContextDataInput = {
  messages: Message[]
  // 这个回调绑定到 getAppState: () => AppState，负责命令处理在该局部场景下的响应。
  getAppState: () => AppState
  options: {
    mainLoopModel: string
    tools: Tools
    agentDefinitions: AgentDefinitionsResult
    customSystemPrompt?: string
    appendSystemPrompt?: string
  }
}

// collectContextData 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function collectContextData(
  context: CollectContextDataInput,
): Promise<ContextData> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages,
    getAppState,
    options: {
      mainLoopModel,
      tools,
      agentDefinitions,
      customSystemPrompt,
      appendSystemPrompt,
    },
  } = context

  // apiView读取`getMessagesAfterCompactBoundary`，供命令处理后续处理使用。
  let apiView = getMessagesAfterCompactBoundary(messages)
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，命令处理执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 斜杠命令 context noninteractive先整理这一处局部数据，后续分支可以直接读取。
    const { projectView } =
      require('../../services/contextCollapse/operations.js') as typeof import('../../services/contextCollapse/operations.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // apiView更新为 `projectView(apiView)`，确保斜杠命令后续读取最新状态。
    apiView = projectView(apiView)
  }

  // 从 `await microcompactMessages(apiView)` 解构 messages，减少斜杠命令 context noninteractive对同一对象的重复访问。
  const { messages: compactedMessages } = await microcompactMessages(apiView)
  // appState 状态读取`getAppState`，供命令处理后续处理使用。
  const appState = getAppState()

  // 返回 `analyzeContextUsage(`，作为命令处理这次计算的结果。
  return analyzeContextUsage(
    compactedMessages,
    mainLoopModel,
    // 调用 async，触发命令处理此处需要的副作用。
    async () => appState.toolPermissionContext,
    tools,
    agentDefinitions,
    undefined, // terminalWidth
    // analyzeContextUsage only reads options.{customSystemPrompt,appendSystemPrompt}
    // but its signature declares the full Pick<ToolUseContext, 'options'>.
    { options: { customSystemPrompt, appendSystemPrompt } } as Pick<
      ToolUseContext,
      'options'
    >,
    undefined, // mainThreadAgentDefinition
    apiView, // original messages for API usage extraction
  )
}

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  _args: string,
  context: ToolUseContext,
): Promise<{ type: 'text'; value: string }> {
  // data保存`collectContextData`，供命令处理后续处理使用。
  const data = await collectContextData(context)
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text' as const,
    value: formatContextAsMarkdownTable(data),
  }
}

// formatContextAsMarkdownTable 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatContextAsMarkdownTable(data: ContextData): string {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    categories,
    totalTokens,
    rawMaxTokens,
    percentage,
    model,
    memoryFiles,
    mcpTools,
    agents,
    skills,
    messageBreakdown,
    systemTools,
    systemPromptSections,
  } = data

  // output固定为 ``## Context Usage\n\n``，作为命令处理斜杠命令 context noninteractive后续展示或比较的基准。
  let output = `## Context Usage\n\n`
  // 斜杠命令 context noninteractive在这里处理 `output += `**Model:** ${model} \n``，完成这一小步状态转换。
  output += `**Model:** ${model}  \n`
  // 斜杠命令 context noninteractive在这里处理 `output += `**Tokens:** ${formatTokens(totalTokens)} / ${formatTokens(ra...`，完成这一小步状态转换。
  output += `**Tokens:** ${formatTokens(totalTokens)} / ${formatTokens(rawMaxTokens)} (${percentage}%)\n`

  // Context-collapse status. Always show when the runtime gate is on —
  // the user needs to know which strategy is managing their context
  // even before anything has fired.
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，命令处理执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 斜杠命令 context noninteractive先整理这一处局部数据，后续分支可以直接读取。
    const { getStats, isContextCollapseEnabled } =
      require('../../services/contextCollapse/index.js') as typeof import('../../services/contextCollapse/index.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 满足 `isContextCollapseEnabled()` 时，命令处理执行该分支。
    if (isContextCollapseEnabled()) {
      // s 集合读取`getStats`，供命令处理后续处理使用。
      const s = getStats()
      // 从 `s` 解构 health，减少斜杠命令 context noninteractive对同一对象的重复访问。
      const { health: h } = s

      // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
      const parts = []
      // 满足 `s.collapsedSpans > 0` 时，命令处理执行该分支。
      if (s.collapsedSpans > 0) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(
          `${s.collapsedSpans} ${plural(s.collapsedSpans, 'span')} summarized (${s.collapsedMessages} messages)`,
        )
      }
      // 满足 `s.stagedSpans > 0) parts.push(`${s.stagedSpans} staged`` 时，命令处理执行该分支。
      if (s.stagedSpans > 0) parts.push(`${s.stagedSpans} staged`)
      // summary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const summary =
        parts.length > 0
          ? parts.join(', ')
          : h.totalSpawns > 0
            ? `${h.totalSpawns} ${plural(h.totalSpawns, 'spawn')}, nothing staged yet`
            : 'waiting for first trigger'
      // 斜杠命令 context noninteractive在这里处理 `output += `**Context strategy:** collapse (${summary})\n``，完成这一小步状态转换。
      output += `**Context strategy:** collapse (${summary})\n`

      // 满足 `h.totalErrors > 0` 时，命令处理执行该分支。
      if (h.totalErrors > 0) {
        // 斜杠命令 context noninteractive在这里处理 `output += `**Collapse errors:** ${h.totalErrors}/${h.totalSpawns} spawn...`，完成这一小步状态转换。
        output += `**Collapse errors:** ${h.totalErrors}/${h.totalSpawns} spawns failed`
        // 满足 `h.lastError` 时，命令处理执行该分支。
        if (h.lastError) {
          // 斜杠命令 context noninteractive在这里处理 `output += ` (last: ${h.lastError.slice(0, 80)})``，完成这一小步状态转换。
          output += ` (last: ${h.lastError.slice(0, 80)})`
        }
        // 斜杠命令 context noninteractive在这里处理 `output += '\n'`，完成这一小步状态转换。
        output += '\n'
      // 斜杠命令 context noninteractive在这里处理 `} else if (h.emptySpawnWarningEmitted) {`，完成这一小步状态转换。
      } else if (h.emptySpawnWarningEmitted) {
        // 斜杠命令 context noninteractive在这里处理 `output += `**Collapse idle:** ${h.totalEmptySpawns} consecutive empty r...`，完成这一小步状态转换。
        output += `**Collapse idle:** ${h.totalEmptySpawns} consecutive empty runs\n`
      }
    }
  }
  // 斜杠命令 context noninteractive在这里处理 `output += '\n'`，完成这一小步状态转换。
  output += '\n'

  // Main categories table
  // visibleCategories 集合筛选`categories.filter`，供命令处理后续处理使用。
  const visibleCategories = categories.filter(
    // cat更新为 `>`，确保斜杠命令后续读取最新状态。
    cat =>
      cat.tokens > 0 &&
      cat.name !== 'Free space' &&
      cat.name !== 'Autocompact buffer',
  )

  // 满足 `visibleCategories.length > 0` 时，命令处理执行该分支。
  if (visibleCategories.length > 0) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### Estimated usage by category\n\n``，完成这一小步状态转换。
    output += `### Estimated usage by category\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Category | Tokens | Percentage |\n``，完成这一小步状态转换。
    output += `| Category | Tokens | Percentage |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|----------|--------|------------|\n``，完成这一小步状态转换。
    output += `|----------|--------|------------|\n`

    // 按顺序遍历 `visibleCategories` 中的cat，逐个交给命令处理处理。
    for (const cat of visibleCategories) {
      // percentDisplay保存`toFixed`，供命令处理后续处理使用。
      const percentDisplay = ((cat.tokens / rawMaxTokens) * 100).toFixed(1)
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${cat.name} | ${formatTokens(cat.tokens)} | ${percentDispl...`，完成这一小步状态转换。
      output += `| ${cat.name} | ${formatTokens(cat.tokens)} | ${percentDisplay}% |\n`
    }

    // freeSpaceCategory筛选`categories.find`，供命令处理后续处理使用。
    const freeSpaceCategory = categories.find(c => c.name === 'Free space')
    // 只有 `freeSpaceCategory && freeSpaceCategory.tokens > 0` 满足时，命令处理才执行该分支。
    if (freeSpaceCategory && freeSpaceCategory.tokens > 0) {
      // percentDisplay 命名 `(`，让后续代码直接表达这个值的用途。
      const percentDisplay = (
        (freeSpaceCategory.tokens / rawMaxTokens) *
        100
      ).toFixed(1)
      // 斜杠命令 context noninteractive在这里处理 `output += `| Free space | ${formatTokens(freeSpaceCategory.tokens)} | $...`，完成这一小步状态转换。
      output += `| Free space | ${formatTokens(freeSpaceCategory.tokens)} | ${percentDisplay}% |\n`
    }

    // autocompactCategory筛选`categories.find`，供命令处理后续处理使用。
    const autocompactCategory = categories.find(
      // c更新为 `> c.name === 'Autocompact buffer'`，确保斜杠命令后续读取最新状态。
      c => c.name === 'Autocompact buffer',
    )
    // 只有 `autocompactCategory && autocompactCategory.tokens` 满足时，命令处理才执行该分支。
    if (autocompactCategory && autocompactCategory.tokens > 0) {
      // percentDisplay 命名 `(`，让后续代码直接表达这个值的用途。
      const percentDisplay = (
        (autocompactCategory.tokens / rawMaxTokens) *
        100
      ).toFixed(1)
      // 斜杠命令 context noninteractive在这里处理 `output += `| Autocompact buffer | ${formatTokens(autocompactCategory.to...`，完成这一小步状态转换。
      output += `| Autocompact buffer | ${formatTokens(autocompactCategory.tokens)} | ${percentDisplay}% |\n`
    }

    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // MCP tools
  // 满足 `mcpTools.length > 0` 时，命令处理执行该分支。
  if (mcpTools.length > 0) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### MCP Tools\n\n``，完成这一小步状态转换。
    output += `### MCP Tools\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Tool | Server | Tokens |\n``，完成这一小步状态转换。
    output += `| Tool | Server | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|------|--------|--------|\n``，完成这一小步状态转换。
    output += `|------|--------|--------|\n`
    // 按顺序遍历 `mcpTools` 中的工具，逐个交给命令处理处理。
    for (const tool of mcpTools) {
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${tool.name} | ${tool.serverName} | ${formatTokens(tool.to...`，完成这一小步状态转换。
      output += `| ${tool.name} | ${tool.serverName} | ${formatTokens(tool.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // System tools (ant-only)
  // 命令处理在这里按实际状态进入对应分支。
  if (
    systemTools &&
    systemTools.length > 0 &&
    process.env.USER_TYPE === 'ant'
  ) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### [ANT-ONLY] System Tools\n\n``，完成这一小步状态转换。
    output += `### [ANT-ONLY] System Tools\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Tool | Tokens |\n``，完成这一小步状态转换。
    output += `| Tool | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|------|--------|\n``，完成这一小步状态转换。
    output += `|------|--------|\n`
    // 按顺序遍历 `systemTools` 中的工具，逐个交给命令处理处理。
    for (const tool of systemTools) {
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${tool.name} | ${formatTokens(tool.tokens)} |\n``，完成这一小步状态转换。
      output += `| ${tool.name} | ${formatTokens(tool.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // System prompt sections (ant-only)
  // 命令处理在这里按实际状态进入对应分支。
  if (
    systemPromptSections &&
    systemPromptSections.length > 0 &&
    process.env.USER_TYPE === 'ant'
  ) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### [ANT-ONLY] System Prompt Sections\n\n``，完成这一小步状态转换。
    output += `### [ANT-ONLY] System Prompt Sections\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Section | Tokens |\n``，完成这一小步状态转换。
    output += `| Section | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|---------|--------|\n``，完成这一小步状态转换。
    output += `|---------|--------|\n`
    // 按顺序遍历 `systemPromptSections` 中的section，逐个交给命令处理处理。
    for (const section of systemPromptSections) {
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${section.name} | ${formatTokens(section.tokens)} |\n``，完成这一小步状态转换。
      output += `| ${section.name} | ${formatTokens(section.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // Custom agents
  // 满足 `agents.length > 0` 时，命令处理执行该分支。
  if (agents.length > 0) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### Custom Agents\n\n``，完成这一小步状态转换。
    output += `### Custom Agents\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Agent Type | Source | Tokens |\n``，完成这一小步状态转换。
    output += `| Agent Type | Source | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|------------|--------|--------|\n``，完成这一小步状态转换。
    output += `|------------|--------|--------|\n`
    // 按顺序遍历 `agents` 中的agent，逐个交给命令处理处理。
    for (const agent of agents) {
      // sourceDisplay 先占位，稍后的条件分支会根据实际输入补齐它。
      let sourceDisplay: string
      // 按照 agent.source 的取值选择命令处理的具体处理分支。
      switch (agent.source) {
        case 'projectSettings':
          // sourceDisplay更新为 `'Project'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Project'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'userSettings':
          // sourceDisplay更新为 `'User'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'User'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'localSettings':
          // sourceDisplay更新为 `'Local'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Local'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'flagSettings':
          // sourceDisplay更新为 `'Flag'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Flag'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'policySettings':
          // sourceDisplay更新为 `'Policy'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Policy'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'plugin':
          // sourceDisplay更新为 `'Plugin'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Plugin'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        case 'built-in':
          // sourceDisplay更新为 `'Built-in'`，确保斜杠命令后续读取最新状态。
          sourceDisplay = 'Built-in'
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        default:
          // sourceDisplay更新为 `String(agent.source)`，确保斜杠命令后续读取最新状态。
          sourceDisplay = String(agent.source)
      }
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${agent.agentType} | ${sourceDisplay} | ${formatTokens(age...`，完成这一小步状态转换。
      output += `| ${agent.agentType} | ${sourceDisplay} | ${formatTokens(agent.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // Memory files
  // 满足 `memoryFiles.length > 0` 时，命令处理执行该分支。
  if (memoryFiles.length > 0) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### Memory Files\n\n``，完成这一小步状态转换。
    output += `### Memory Files\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Type | Path | Tokens |\n``，完成这一小步状态转换。
    output += `| Type | Path | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|------|------|--------|\n``，完成这一小步状态转换。
    output += `|------|------|--------|\n`
    // 按顺序遍历 `memoryFiles` 中的file 文件数据，逐个交给命令处理处理。
    for (const file of memoryFiles) {
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${file.type} | ${file.path} | ${formatTokens(file.tokens)}...`，完成这一小步状态转换。
      output += `| ${file.type} | ${file.path} | ${formatTokens(file.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // Skills
  // 只有 `skills && skills.tokens > 0 && skills.skillFrontm` 满足时，命令处理才执行该分支。
  if (skills && skills.tokens > 0 && skills.skillFrontmatter.length > 0) {
    // 斜杠命令 context noninteractive在这里处理 `output += `### Skills\n\n``，完成这一小步状态转换。
    output += `### Skills\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Skill | Source | Tokens |\n``，完成这一小步状态转换。
    output += `| Skill | Source | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|-------|--------|--------|\n``，完成这一小步状态转换。
    output += `|-------|--------|--------|\n`
    // 按顺序遍历 `skills.skillFrontmatter` 中的skill，逐个交给命令处理处理。
    for (const skill of skills.skillFrontmatter) {
      // 斜杠命令 context noninteractive在这里处理 `output += `| ${skill.name} | ${getSourceDisplayName(skill.source)} | ${...`，完成这一小步状态转换。
      output += `| ${skill.name} | ${getSourceDisplayName(skill.source)} | ${formatTokens(skill.tokens)} |\n`
    }
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`
  }

  // Message breakdown (ant-only)
  // 只有 `messageBreakdown && process.env.USER_TYPE === 'an` 满足时，命令处理才执行该分支。
  if (messageBreakdown && process.env.USER_TYPE === 'ant') {
    // 斜杠命令 context noninteractive在这里处理 `output += `### [ANT-ONLY] Message Breakdown\n\n``，完成这一小步状态转换。
    output += `### [ANT-ONLY] Message Breakdown\n\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Category | Tokens |\n``，完成这一小步状态转换。
    output += `| Category | Tokens |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `|----------|--------|\n``，完成这一小步状态转换。
    output += `|----------|--------|\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Tool calls | ${formatTokens(messageBreakdown.toolCallToken...`，完成这一小步状态转换。
    output += `| Tool calls | ${formatTokens(messageBreakdown.toolCallTokens)} |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Tool results | ${formatTokens(messageBreakdown.toolResultT...`，完成这一小步状态转换。
    output += `| Tool results | ${formatTokens(messageBreakdown.toolResultTokens)} |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Attachments | ${formatTokens(messageBreakdown.attachmentTo...`，完成这一小步状态转换。
    output += `| Attachments | ${formatTokens(messageBreakdown.attachmentTokens)} |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| Assistant messages (non-tool) | ${formatTokens(messageBrea...`，完成这一小步状态转换。
    output += `| Assistant messages (non-tool) | ${formatTokens(messageBreakdown.assistantMessageTokens)} |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `| User messages (non-tool-result) | ${formatTokens(messageBr...`，完成这一小步状态转换。
    output += `| User messages (non-tool-result) | ${formatTokens(messageBreakdown.userMessageTokens)} |\n`
    // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
    output += `\n`

    // 满足 `messageBreakdown.toolCallsByType.length > 0` 时，命令处理执行该分支。
    if (messageBreakdown.toolCallsByType.length > 0) {
      // 斜杠命令 context noninteractive在这里处理 `output += `#### Top Tools\n\n``，完成这一小步状态转换。
      output += `#### Top Tools\n\n`
      // 斜杠命令 context noninteractive在这里处理 `output += `| Tool | Call Tokens | Result Tokens |\n``，完成这一小步状态转换。
      output += `| Tool | Call Tokens | Result Tokens |\n`
      // 斜杠命令 context noninteractive在这里处理 `output += `|------|-------------|---------------|\n``，完成这一小步状态转换。
      output += `|------|-------------|---------------|\n`
      // 按顺序遍历 `messageBreakdown.toolCallsByType` 中的工具，逐个交给命令处理处理。
      for (const tool of messageBreakdown.toolCallsByType) {
        // 斜杠命令 context noninteractive在这里处理 `output += `| ${tool.name} | ${formatTokens(tool.callTokens)} | ${format...`，完成这一小步状态转换。
        output += `| ${tool.name} | ${formatTokens(tool.callTokens)} | ${formatTokens(tool.resultTokens)} |\n`
      }
      // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
      output += `\n`
    }

    // 满足 `messageBreakdown.attachmentsByType.length > 0` 时，命令处理执行该分支。
    if (messageBreakdown.attachmentsByType.length > 0) {
      // 斜杠命令 context noninteractive在这里处理 `output += `#### Top Attachments\n\n``，完成这一小步状态转换。
      output += `#### Top Attachments\n\n`
      // 斜杠命令 context noninteractive在这里处理 `output += `| Attachment | Tokens |\n``，完成这一小步状态转换。
      output += `| Attachment | Tokens |\n`
      // 斜杠命令 context noninteractive在这里处理 `output += `|------------|--------|\n``，完成这一小步状态转换。
      output += `|------------|--------|\n`
      // 按顺序遍历 `messageBreakdown.attachmentsB` 中的attachment，逐个交给命令处理处理。
      for (const attachment of messageBreakdown.attachmentsByType) {
        // 斜杠命令 context noninteractive在这里处理 `output += `| ${attachment.name} | ${formatTokens(attachment.tokens)} |\...`，完成这一小步状态转换。
        output += `| ${attachment.name} | ${formatTokens(attachment.tokens)} |\n`
      }
      // 斜杠命令 context noninteractive在这里处理 `output += `\n``，完成这一小步状态转换。
      output += `\n`
    }
  }

  // 返回 `output`，作为命令处理这次计算的结果。
  return output
}
