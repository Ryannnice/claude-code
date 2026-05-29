// 类型依赖 { ContentBlock } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ContentBlock } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 getUserContext，将 src/context.js 中已经封装好的能力接到本文件流程里。
import { getUserContext } from 'src/context.js'
// 接入 queryModelWithoutStreaming 服务层能力，把外部通信或共享状态交给 src/services/api/claude.js 处理。
import { queryModelWithoutStreaming } from 'src/services/api/claude.js'
// 引入 getEmptyToolPermissionContext，将 src/Tool.js 中已经封装好的能力接到本文件流程里。
import { getEmptyToolPermissionContext } from 'src/Tool.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from 'src/tools/AgentTool/constants.js'
// 复用 prependUserContext 工具函数，把通用处理留在 src/utils/api.js 中维护。
import { prependUserContext } from 'src/utils/api.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  normalizeMessagesForAPI,
} from 'src/utils/messages.js'
// 类型依赖 { ModelName } 来自 src/utils/model/model.js，用于校准终端渲染的数据契约。
import type { ModelName } from 'src/utils/model/model.js'
// 引入 isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'

// GeneratedAgent 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type GeneratedAgent = {
  identifier: string
  whenToUse: string
  systemPrompt: string
}

// AGENT_CREATION_SYSTEM_PROMPT 命名 ``You are an elite AI agent architect specializing in craf...`，让后续代码直接表达这个值的用途。
const AGENT_CREATION_SYSTEM_PROMPT = `You are an elite AI agent architect specializing in crafting high-performance agent configurations. Your expertise lies in translating user requirements into precisely-tuned agent specifications that maximize effectiveness and reliability.

**Important Context**: You may have access to project-specific instructions from CLAUDE.md files and other context that may include coding standards, project structure, and custom requirements. Consider this context when creating agents to ensure they align with the project's established patterns and practices.

When a user describes what they want an agent to do, you will:

1. **Extract Core Intent**: Identify the fundamental purpose, key responsibilities, and success criteria for the agent. Look for both explicit requirements and implicit needs. Consider any project-specific context from CLAUDE.md files. For agents that are meant to review code, you should assume that the user is asking to review recently written code and not the whole codebase, unless the user has explicitly instructed you otherwise.

2. **Design Expert Persona**: Create a compelling expert identity that embodies deep domain knowledge relevant to the task. The persona should inspire confidence and guide the agent's decision-making approach.

3. **Architect Comprehensive Instructions**: Develop a system prompt that:
   - Establishes clear behavioral boundaries and operational parameters
   - Provides specific methodologies and best practices for task execution
   - Anticipates edge cases and provides guidance for handling them
   - Incorporates any specific requirements or preferences mentioned by the user
   - Defines output format expectations when relevant
   - Aligns with project-specific coding standards and patterns from CLAUDE.md

4. **Optimize for Performance**: Include:
   - Decision-making frameworks appropriate to the domain
   - Quality control mechanisms and self-verification steps
   - Efficient workflow patterns
   - Clear escalation or fallback strategies

5. **Create Identifier**: Design a concise, descriptive identifier that:
   - Uses lowercase letters, numbers, and hyphens only
   - Is typically 2-4 words joined by hyphens
   - Clearly indicates the agent's primary function
   - Is memorable and easy to type
   - Avoids generic terms like "helper" or "assistant"

6 **Example agent descriptions**:
  - in the 'whenToUse' field of the JSON object, you should include examples of when this agent should be used.
  - examples should be of the form:
    - <example>
      Context: The user is creating a test-runner agent that should be called after a logical chunk of code is written.
      user: "Please write a function that checks if a number is prime"
      assistant: "Here is the relevant function: "
      <function call omitted for brevity only for this example>
      <commentary>
      Since a significant piece of code was written, use the ${AGENT_TOOL_NAME} tool to launch the test-runner agent to run the tests.
      </commentary>
      assistant: "Now let me use the test-runner agent to run the tests"
    </example>
    - <example>
      Context: User is creating an agent to respond to the word "hello" with a friendly jok.
      user: "Hello"
      assistant: "I'm going to use the ${AGENT_TOOL_NAME} tool to launch the greeting-responder agent to respond with a friendly joke"
      <commentary>
      Since the user is greeting, use the greeting-responder agent to respond with a friendly joke. 
      </commentary>
    </example>
  - If the user mentioned or implied that the agent should be used proactively, you should include examples of this.
- NOTE: Ensure that in the examples, you are making the assistant use the Agent tool and not simply respond directly to the task.

Your output must be a valid JSON object with exactly these fields:
{
  "identifier": "A unique, descriptive identifier using lowercase letters, numbers, and hyphens (e.g., 'test-runner', 'api-docs-writer', 'code-formatter')",
  "whenToUse": "A precise, actionable description starting with 'Use this agent when...' that clearly defines the triggering conditions and use cases. Ensure you include examples as described above.",
  "systemPrompt": "The complete system prompt that will govern the agent's behavior, written in second person ('You are...', 'You will...') and structured for maximum clarity and effectiveness"
}

Key principles for your system prompts:
- Be specific rather than generic - avoid vague instructions
- Include concrete examples when they would clarify behavior
- Balance comprehensiveness with clarity - every instruction should add value
- Ensure the agent has enough context to handle variations of the core task
- Make the agent proactive in seeking clarification when needed
- Build in quality assurance and self-correction mechanisms

Remember: The agents you create should be autonomous experts capable of handling their designated tasks with minimal additional guidance. Your system prompts are their complete operational manual.
`

// Agent memory instructions to include in the system prompt when memory is mentioned or relevant
// AGENT_MEMORY_INSTRUCTIONS 集合保存```，作为后续固定文本处理的输入。
const AGENT_MEMORY_INSTRUCTIONS = `

7. **Agent Memory Instructions**: If the user mentions "memory", "remember", "learn", "persist", or similar concepts, OR if the agent would benefit from building up knowledge across conversations (e.g., code reviewers learning patterns, architects learning codebase structure, etc.), include domain-specific memory update instructions in the systemPrompt.

   Add a section like this to the systemPrompt, tailored to the agent's specific domain:

   "**Update your agent memory** as you discover [domain-specific items]. This builds up institutional knowledge across conversations. Write concise notes about what you found and where.

   Examples of what to record:
   - [domain-specific item 1]
   - [domain-specific item 2]
   - [domain-specific item 3]"

   Examples of domain-specific memory instructions:
   - For a code-reviewer: "Update your agent memory as you discover code patterns, style conventions, common issues, and architectural decisions in this codebase."
   - For a test-runner: "Update your agent memory as you discover test patterns, common failure modes, flaky tests, and testing best practices."
   - For an architect: "Update your agent memory as you discover codepaths, library locations, key architectural decisions, and component relationships."
   - For a documentation writer: "Update your agent memory as you discover documentation patterns, API structures, and terminology conventions."

   The memory instructions should be specific to what the agent would naturally learn while performing its core tasks.
`

// generateAgent 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateAgent(
  userPrompt: string,
  model: ModelName,
  existingIdentifiers: string[],
  abortSignal: AbortSignal,
): Promise<GeneratedAgent> {
  // existingList 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const existingList =
    existingIdentifiers.length > 0
      ? `\n\nIMPORTANT: The following identifiers already exist and must NOT be used: ${existingIdentifiers.join(', ')}`
      : ''

  // 提示词 命名 ``Create an agent configuration based on this request: "${...`，让后续代码直接表达这个值的用途。
  const prompt = `Create an agent configuration based on this request: "${userPrompt}".${existingList}
  Return ONLY the JSON object, no other text.`

  // userMessage 消息数据构建`createUserMessage`，供终端渲染后续处理使用。
  const userMessage = createUserMessage({ content: prompt })

  // Fetch user and system contexts
  // userContext读取`getUserContext`，供终端渲染后续处理使用。
  const userContext = await getUserContext()

  // Prepend user context to messages and append system context to system prompt
  // messagesWithContext 消息数据保存`prependUserContext`，供终端渲染后续处理使用。
  const messagesWithContext = prependUserContext([userMessage], userContext)

  // Include memory instructions when the feature is enabled
  // 系统提示词保存`isAutoMemoryEnabled`，供终端渲染后续处理使用。
  const systemPrompt = isAutoMemoryEnabled()
    ? AGENT_CREATION_SYSTEM_PROMPT + AGENT_MEMORY_INSTRUCTIONS
    : AGENT_CREATION_SYSTEM_PROMPT

  // 接口响应保存`queryModelWithoutStreaming`，供终端渲染后续处理使用。
  const response = await queryModelWithoutStreaming({
    messages: normalizeMessagesForAPI(messagesWithContext),
    systemPrompt: asSystemPrompt([systemPrompt]),
    thinkingConfig: { type: 'disabled' as const },
    tools: [],
    signal: abortSignal,
    options: {
      // 这个回调绑定到 getToolPermissionContext: async () => getEmptyToolPermissionContext(),，负责终端渲染在该局部场景下的响应。
      getToolPermissionContext: async () => getEmptyToolPermissionContext(),
      model,
      toolChoice: undefined,
      agents: [],
      isNonInteractiveSession: false,
      hasAppendSystemPrompt: false,
      querySource: 'agent_creation',
      mcpTools: [],
    },
  })

  // textBlocks 集合筛选`content.filter`，供终端渲染后续处理使用。
  const textBlocks = response.message.content.filter(
    // 这个回调绑定到 (block): block is ContentBlock & { type: 'text' } => block.type === 'text',，负责终端渲染在该局部场景下的响应。
    (block): block is ContentBlock & { type: 'text' } => block.type === 'text',
  )
  // responseText 响应数据派生`textBlocks.map`，供终端渲染后续处理使用。
  const responseText = textBlocks.map(block => block.text).join('\n')

  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: GeneratedAgent
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(responseText.trim())`，确保Agent 配置界面后续读取最新状态。
    parsed = jsonParse(responseText.trim())
  } catch {
    // jsonMatch匹配`responseText.match`，供终端渲染后续处理使用。
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    // jsonMatch缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!jsonMatch) {
      // 抛出 new Error('No JSON object found in response')，阻止终端渲染在无效状态下继续运行。
      throw new Error('No JSON object found in response')
    }
    // 解析结果更新为 `jsonParse(jsonMatch[0])`，确保Agent 配置界面后续读取最新状态。
    parsed = jsonParse(jsonMatch[0])
  }

  // 只有 `!parsed.identifier || !parsed.whenToUse || !parse` 满足时，终端渲染才执行该分支。
  if (!parsed.identifier || !parsed.whenToUse || !parsed.systemPrompt) {
    // 抛出 new Error('Invalid agent configuration generated')，阻止终端渲染在无效状态下继续运行。
    throw new Error('Invalid agent configuration generated')
  }

  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_agent_definition_generated', {
    agent_identifier:
      parsed.identifier as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    identifier: parsed.identifier,
    whenToUse: parsed.whenToUse,
    systemPrompt: parsed.systemPrompt,
  }
}
