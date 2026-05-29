// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
// 接入 SEND_MESSAGE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SEND_MESSAGE_TOOL_NAME } from 'src/tools/SendMessageTool/constants.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
// 接入 WEB_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
// 复用 isUsing3PServices 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { isUsing3PServices } from 'src/utils/auth.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 src/utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from 'src/utils/embeddedTools.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 src/utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from 'src/utils/settings/settings.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../../utils/slowOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AgentDefinition,
  BuiltInAgentDefinition,
} from '../loadAgentsDir.js'

// CLAUDE_CODE_DOCS_MAP_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const CLAUDE_CODE_DOCS_MAP_URL =
  'https://code.claude.com/docs/en/claude_code_docs_map.md'
// CDP_DOCS_MAP_URL 命名 `'https://platform.claude.com/llms.txt'`，让后续代码直接表达这个值的用途。
const CDP_DOCS_MAP_URL = 'https://platform.claude.com/llms.txt'

// CLAUDE_CODE_GUIDE_AGENT_TYPE固定为 `'claude-code-guide'`，作为工具调用Agent 工具 claude Code Guide Ag...后续展示或比较的基准。
export const CLAUDE_CODE_GUIDE_AGENT_TYPE = 'claude-code-guide'

// getClaudeCodeGuideBasePrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getClaudeCodeGuideBasePrompt(): string {
  // Ant-native builds alias find/grep to embedded bfs/ugrep and remove the
  // dedicated Glob/Grep tools, so point at find/grep instead.
  // localSearchHint保存`hasEmbeddedSearchTools`，供工具调用后续处理使用。
  const localSearchHint = hasEmbeddedSearchTools()
    ? `${FILE_READ_TOOL_NAME}, \`find\`, and \`grep\``
    : `${FILE_READ_TOOL_NAME}, ${GLOB_TOOL_NAME}, and ${GREP_TOOL_NAME}`

  // 返回 ``You are the Claude guide agent. Your primary responsibility is helping...`，作为工具调用这次计算的结果。
  return `You are the Claude guide agent. Your primary responsibility is helping users understand and use Claude Code, the Claude Agent SDK, and the Claude API (formerly the Anthropic API) effectively.

**Your expertise spans three domains:**

1. **Claude Code** (the CLI tool): Installation, configuration, hooks, skills, MCP servers, keyboard shortcuts, IDE integrations, settings, and workflows.

2. **Claude Agent SDK**: A framework for building custom AI agents based on Claude Code technology. Available for Node.js/TypeScript and Python.

3. **Claude API**: The Claude API (formerly known as the Anthropic API) for direct model interaction, tool use, and integrations.

**Documentation sources:**

- **Claude Code docs** (${CLAUDE_CODE_DOCS_MAP_URL}): Fetch this for questions about the Claude Code CLI tool, including:
  - Installation, setup, and getting started
  - Hooks (pre/post command execution)
  - Custom skills
  - MCP server configuration
  - IDE integrations (VS Code, JetBrains)
  - Settings files and configuration
  - Keyboard shortcuts and hotkeys
  - Subagents and plugins
  - Sandboxing and security

- **Claude Agent SDK docs** (${CDP_DOCS_MAP_URL}): Fetch this for questions about building agents with the SDK, including:
  - SDK overview and getting started (Python and TypeScript)
  - Agent configuration + custom tools
  - Session management and permissions
  - MCP integration in agents
  - Hosting and deployment
  - Cost tracking and context management
  Note: Agent SDK docs are part of the Claude API documentation at the same URL.

- **Claude API docs** (${CDP_DOCS_MAP_URL}): Fetch this for questions about the Claude API (formerly the Anthropic API), including:
  - Messages API and streaming
  - Tool use (function calling) and Anthropic-defined tools (computer use, code execution, web search, text editor, bash, programmatic tool calling, tool search tool, context editing, Files API, structured outputs)
  - Vision, PDF support, and citations
  - Extended thinking and structured outputs
  - MCP connector for remote MCP servers
  - Cloud provider integrations (Bedrock, Vertex AI, Foundry)

**Approach:**
1. Determine which domain the user's question falls into
2. Use ${WEB_FETCH_TOOL_NAME} to fetch the appropriate docs map
3. Identify the most relevant documentation URLs from the map
4. Fetch the specific documentation pages
5. Provide clear, actionable guidance based on official documentation
6. Use ${WEB_SEARCH_TOOL_NAME} if docs don't cover the topic
7. Reference local project files (CLAUDE.md, .claude/ directory) when relevant using ${localSearchHint}

**Guidelines:**
- Always prioritize official documentation over assumptions
- Keep responses concise and actionable
- Include specific examples or code snippets when helpful
- Reference exact documentation URLs in your responses
- Help users discover features by proactively suggesting related commands, shortcuts, or capabilities

Complete the user's request by providing accurate, documentation-based guidance.`
}

// getFeedbackGuideline 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFeedbackGuideline(): string {
  // For 3P services (Bedrock/Vertex/Foundry), /feedback command is disabled
  // Direct users to the appropriate feedback channel instead
  // 满足 `isUsing3PServices()` 时，工具调用执行该分支。
  if (isUsing3PServices()) {
    // 返回 ``- When you cannot find an answer or the feature doesn't exist, direct ...`，作为工具调用这次计算的结果。
    return `- When you cannot find an answer or the feature doesn't exist, direct the user to ${MACRO.ISSUES_EXPLAINER}`
  }
  // 返回 `"- When you cannot find an answer or the feature doesn't exist, direct ...`，作为工具调用这次计算的结果。
  return "- When you cannot find an answer or the feature doesn't exist, direct the user to use /feedback to report a feature request or bug"
}

// CLAUDE_CODE_GUIDE_AGENT 集中保存Agent 工具 claude Code Guide Agent要一起传递的字段。
export const CLAUDE_CODE_GUIDE_AGENT: BuiltInAgentDefinition = {
  agentType: CLAUDE_CODE_GUIDE_AGENT_TYPE,
  whenToUse: `Use this agent when the user asks questions ("Can Claude...", "Does Claude...", "How do I...") about: (1) Claude Code (the CLI tool) - features, hooks, slash commands, MCP servers, settings, IDE integrations, keyboard shortcuts; (2) Claude Agent SDK - building custom agents; (3) Claude API (formerly Anthropic API) - API usage, tool use, Anthropic SDK usage. **IMPORTANT:** Before spawning a new agent, check if there is already a running or recently completed claude-code-guide agent that you can continue via ${SEND_MESSAGE_TOOL_NAME}.`,
  // Ant-native builds: Glob/Grep tools are removed; use Bash (with embedded
  // bfs/ugrep via find/grep aliases) for local file search instead.
  tools: hasEmbeddedSearchTools()
    ? [
        BASH_TOOL_NAME,
        FILE_READ_TOOL_NAME,
        WEB_FETCH_TOOL_NAME,
        WEB_SEARCH_TOOL_NAME,
      ]
    : [
        GLOB_TOOL_NAME,
        GREP_TOOL_NAME,
        FILE_READ_TOOL_NAME,
        WEB_FETCH_TOOL_NAME,
        WEB_SEARCH_TOOL_NAME,
      ],
  source: 'built-in',
  baseDir: 'built-in',
  model: 'haiku',
  permissionMode: 'dontAsk',
  // getSystemPrompt 根据 { toolUseContext } 读取或计算工具调用需要的结果。
  getSystemPrompt({ toolUseContext }) {
    // commands 命令数据保存`toolUseContext.options.commands`，供后续判断或组装使用。
    const commands = toolUseContext.options.commands

    // Build context sections
    // contextSections 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const contextSections: string[] = []

    // 1. Custom skills
    // customCommands 命令数据筛选`commands.filter`，供工具调用后续处理使用。
    const customCommands = commands.filter(cmd => cmd.type === 'prompt')
    // 满足 `customCommands.length > 0` 时，工具调用执行该分支。
    if (customCommands.length > 0) {
      // commandList 命令数据保存`customCommands`，供工具调用Agent 工具 claude Code Guide Ag...后续判断或输出使用。
      const commandList = customCommands
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(cmd => `- /${cmd.name}: ${cmd.description}`)
        .join('\n')
      // contextSections 集合追加新条目，保持收集顺序与输入顺序一致。
      contextSections.push(
        `**Available custom skills in this project:**\n${commandList}`,
      )
    }

    // 2. Custom agents from .claude/agents/
    // customAgents 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const customAgents =
      toolUseContext.options.agentDefinitions.activeAgents.filter(
        // 这个回调绑定到 (a: AgentDefinition) => a.source !== 'built-in',，负责工具调用在该局部场景下的响应。
        (a: AgentDefinition) => a.source !== 'built-in',
      )
    // 满足 `customAgents.length > 0` 时，工具调用执行该分支。
    if (customAgents.length > 0) {
      // agentList 集合保存`customAgents`，供后续判断或组装使用。
      const agentList = customAgents
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map((a: AgentDefinition) => `- ${a.agentType}: ${a.whenToUse}`)
        .join('\n')
      // contextSections 集合追加新条目，保持收集顺序与输入顺序一致。
      contextSections.push(
        `**Available custom agents configured:**\n${agentList}`,
      )
    }

    // 3. MCP servers
    // mcpClients 集合保存`toolUseContext.options.mcpClients`，供工具调用Agent 工具 claude Code Guide Ag...后续判断或输出使用。
    const mcpClients = toolUseContext.options.mcpClients
    // 只有 `mcpClients && mcpClients.length > 0` 满足时，工具调用才执行该分支。
    if (mcpClients && mcpClients.length > 0) {
      // mcpList 集合保存`mcpClients`，供工具调用Agent 工具 claude Code Guide Ag...后续判断或输出使用。
      const mcpList = mcpClients
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map((client: { name: string }) => `- ${client.name}`)
        .join('\n')
      // contextSections 集合追加新条目，保持收集顺序与输入顺序一致。
      contextSections.push(`**Configured MCP servers:**\n${mcpList}`)
    }

    // 4. Plugin commands
    // pluginCommands 命令数据筛选`commands.filter`，供工具调用后续处理使用。
    const pluginCommands = commands.filter(
      // cmd 命令数据更新为 `> cmd.type === 'prompt' && cmd.source === 'plugin'`，确保Agent 工具后续读取最新状态。
      cmd => cmd.type === 'prompt' && cmd.source === 'plugin',
    )
    // 满足 `pluginCommands.length > 0` 时，工具调用执行该分支。
    if (pluginCommands.length > 0) {
      // pluginList 插件数据 命名 `pluginCommands`，让后续代码直接表达这个值的用途。
      const pluginList = pluginCommands
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(cmd => `- /${cmd.name}: ${cmd.description}`)
        .join('\n')
      // contextSections 集合追加新条目，保持收集顺序与输入顺序一致。
      contextSections.push(`**Available plugin skills:**\n${pluginList}`)
    }

    // 5. User settings
    // settings 集合读取`getSettings_DEPRECATED`，供工具调用后续处理使用。
    const settings = getSettings_DEPRECATED()
    // 满足 `Object.keys(settings).length > 0` 时，工具调用执行该分支。
    if (Object.keys(settings).length > 0) {
      // eslint-disable-next-line no-restricted-syntax -- human-facing UI, not tool_result
      // settingsJson保存`jsonStringify`，供工具调用后续处理使用。
      const settingsJson = jsonStringify(settings, null, 2)
      // contextSections 集合追加新条目，保持收集顺序与输入顺序一致。
      contextSections.push(
        `**User's settings.json:**\n\`\`\`json\n${settingsJson}\n\`\`\``,
      )
    }

    // Add the feedback guideline (conditional based on whether user is using 3P services)
    // feedbackGuideline读取`getFeedbackGuideline`，供工具调用后续处理使用。
    const feedbackGuideline = getFeedbackGuideline()
    // basePromptWithFeedback读取`getClaudeCodeGuideBasePrompt`，供工具调用后续处理使用。
    const basePromptWithFeedback = `${getClaudeCodeGuideBasePrompt()}
${feedbackGuideline}`

    // If we have any context to add, append it to the base system prompt
    // 满足 `contextSections.length > 0` 时，工具调用执行该分支。
    if (contextSections.length > 0) {
      // 返回 ``${basePromptWithFeedback}`，作为工具调用这次计算的结果。
      return `${basePromptWithFeedback}

---

# User's Current Configuration

The user has the following custom setup in their environment:

${contextSections.join('\n\n')}

When answering questions, consider these configured features and proactively suggest them when relevant.`
    }

    // Return the base prompt if no context to add
    // 返回 `basePromptWithFeedback`，作为工具调用这次计算的结果。
    return basePromptWithFeedback
  },
}
