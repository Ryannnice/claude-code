// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 复用 getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getSubscriptionType } from '../../utils/auth.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 ../../utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from '../../utils/embeddedTools.js'
// 复用 isEnvDefinedFalsy、isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy, isEnvTruthy } from '../../utils/envUtils.js'
// 复用 isTeammate 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { isTeammate } from '../../utils/teammate.js'
// 复用 isInProcessTeammate 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { isInProcessTeammate } from '../../utils/teammateContext.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'
// 引入 FILE_WRITE_TOOL_NAME，将 ../FileWriteTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME } from '../FileWriteTool/prompt.js'
// 引入 GLOB_TOOL_NAME，将 ../GlobTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GLOB_TOOL_NAME } from '../GlobTool/prompt.js'
// 引入 SEND_MESSAGE_TOOL_NAME，将 ../SendMessageTool/constants.js 中已经封装好的能力接到本文件流程里。
import { SEND_MESSAGE_TOOL_NAME } from '../SendMessageTool/constants.js'
// 引入 AGENT_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from './constants.js'
// 引入 isForkSubagentEnabled，将 ./forkSubagent.js 中已经封装好的能力接到本文件流程里。
import { isForkSubagentEnabled } from './forkSubagent.js'
// 类型依赖 { AgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { AgentDefinition } from './loadAgentsDir.js'

// getToolsDescription 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolsDescription(agent: AgentDefinition): string {
  // 从 `agent` 解构 tools、disallowedTools，减少Agent 工具 prompt对同一对象的重复访问。
  const { tools, disallowedTools } = agent
  // hasAllowlist 集合标记工具调用Agent 工具 prompt是否启用对应路径。
  const hasAllowlist = tools && tools.length > 0
  // hasDenylist 集合标记工具调用Agent 工具 prompt是否启用对应路径。
  const hasDenylist = disallowedTools && disallowedTools.length > 0

  // 只有 `hasAllowlist && hasDenylist` 满足时，工具调用才执行该分支。
  if (hasAllowlist && hasDenylist) {
    // Both defined: filter allowlist by denylist to match runtime behavior
    // denySet保存`Set`，供工具调用后续处理使用。
    const denySet = new Set(disallowedTools)
    // effectiveTools 集合筛选`tools.filter`，供工具调用后续处理使用。
    const effectiveTools = tools.filter(t => !denySet.has(t))
    // effectiveTools 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (effectiveTools.length === 0) {
      // 返回 `'None'`，作为工具调用这次计算的结果。
      return 'None'
    }
    // 返回 `effectiveTools.join(', ')`，作为工具调用这次计算的结果。
    return effectiveTools.join(', ')
  // Agent 工具 prompt在这里处理 `} else if (hasAllowlist) {`，完成这一小步状态转换。
  } else if (hasAllowlist) {
    // Allowlist only: show the specific tools available
    // 返回 `tools.join(', ')`，作为工具调用这次计算的结果。
    return tools.join(', ')
  // Agent 工具 prompt在这里处理 `} else if (hasDenylist) {`，完成这一小步状态转换。
  } else if (hasDenylist) {
    // Denylist only: show "All tools except X, Y, Z"
    // 返回 ``All tools except ${disallowedTools.join(', ')}``，作为工具调用这次计算的结果。
    return `All tools except ${disallowedTools.join(', ')}`
  }
  // No restrictions
  // 返回 `'All tools'`，作为工具调用这次计算的结果。
  return 'All tools'
}

/**
 * Format one agent line for the agent_listing_delta attachment message:
 * `- type: whenToUse (Tools: ...)`.
 */
// formatAgentLine 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatAgentLine(agent: AgentDefinition): string {
  // toolsDescription读取`getToolsDescription`，供工具调用后续处理使用。
  const toolsDescription = getToolsDescription(agent)
  // 返回 ``- ${agent.agentType}: ${agent.whenToUse} (Tools: ${toolsDescription})``，作为工具调用这次计算的结果。
  return `- ${agent.agentType}: ${agent.whenToUse} (Tools: ${toolsDescription})`
}

/**
 * Whether the agent list should be injected as an attachment message instead
 * of embedded in the tool description. When true, getPrompt() returns a static
 * description and attachments.ts emits an agent_listing_delta attachment.
 *
 * The dynamic agent list was ~10.2% of fleet cache_creation tokens: MCP async
 * connect, /reload-plugins, or permission-mode changes mutate the list →
 * description changes → full tool-schema cache bust.
 *
 * Override with CLAUDE_CODE_AGENT_LIST_IN_MESSAGES=true/false for testing.
 */
// shouldInjectAgentListInMessages 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldInjectAgentListInMessages(): boolean {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_AGENT_LIST_IN_MESSAGES)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_AGENT_LIST_IN_MESSAGES)) return true
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_AGENT_LIST_IN_MESSAGES)` 时，工具调用执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_AGENT_LIST_IN_MESSAGES))
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_agent_list_attach', false)`，作为工具调用这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_agent_list_attach', false)
}

// getPrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPrompt(
  agentDefinitions: AgentDefinition[],
  isCoordinator?: boolean,
  allowedAgentTypes?: string[],
): Promise<string> {
  // Filter agents by allowed types when Agent(x,y) restricts which agents can be spawned
  // effectiveAgents 集合保存`allowedAgentTypes`，供工具调用Agent 工具 prompt后续判断或输出使用。
  const effectiveAgents = allowedAgentTypes
    // 这个回调绑定到 ? agentDefinitions.filter(a => allowedAgentTypes.includes(a.agentType))，负责工具调用在该局部场景下的响应。
    ? agentDefinitions.filter(a => allowedAgentTypes.includes(a.agentType))
    : agentDefinitions

  // Fork subagent feature: when enabled, insert the "When to fork" section
  // (fork semantics, directive-style prompts) and swap in fork-aware examples.
  // forkEnabled保存`isForkSubagentEnabled`，供工具调用后续处理使用。
  const forkEnabled = isForkSubagentEnabled()

  // whenToForkSection 命名 `forkEnabled`，让后续代码直接表达这个值的用途。
  const whenToForkSection = forkEnabled
    ? `

## When to fork

Fork yourself (omit \`subagent_type\`) when the intermediate tool output isn't worth keeping in your context. The criterion is qualitative \u2014 "will I need this output again" \u2014 not task size.
- **Research**: fork open-ended questions. If research can be broken into independent questions, launch parallel forks in one message. A fork beats a fresh subagent for this \u2014 it inherits context and shares your cache.
- **Implementation**: prefer to fork implementation work that requires more than a couple of edits. Do research before jumping to implementation.

Forks are cheap because they share your prompt cache. Don't set \`model\` on a fork \u2014 a different model can't reuse the parent's cache. Pass a short \`name\` (one or two words, lowercase) so the user can see the fork in the teams panel and steer it mid-run.

**Don't peek.** The tool result includes an \`output_file\` path — do not Read or tail it unless the user explicitly asks for a progress check. You get a completion notification; trust it. Reading the transcript mid-flight pulls the fork's tool noise into your context, which defeats the point of forking.

**Don't race.** After launching, you know nothing about what the fork found. Never fabricate or predict fork results in any format — not as prose, summary, or structured output. The notification arrives as a user-role message in a later turn; it is never something you write yourself. If the user asks a follow-up before the notification lands, tell them the fork is still running — give status, not a guess.

**Writing a fork prompt.** Since the fork inherits your context, the prompt is a *directive* — what to do, not what the situation is. Be specific about scope: what's in, what's out, what another agent is handling. Don't re-explain background.
`
    : ''

  // writingThePromptSection保存```，作为后续固定文本处理的输入。
  const writingThePromptSection = `

## Writing the prompt

${forkEnabled ? 'When spawning a fresh agent (with a `subagent_type`), it starts with zero context. ' : ''}Brief the agent like a smart colleague who just walked into the room — it hasn't seen this conversation, doesn't know what you've tried, doesn't understand why this task matters.
- Explain what you're trying to accomplish and why.
- Describe what you've already learned or ruled out.
- Give enough context about the surrounding problem that the agent can make judgment calls rather than just following a narrow instruction.
- If you need a short response, say so ("report in under 200 words").
- Lookups: hand over the exact command. Investigations: hand over the question — prescribed steps become dead weight when the premise is wrong.

${forkEnabled ? 'For fresh agents, terse' : 'Terse'} command-style prompts produce shallow, generic work.

**Never delegate understanding.** Don't write "based on your findings, fix the bug" or "based on the research, implement it." Those phrases push synthesis onto the agent instead of doing it yourself. Write prompts that prove you understood: include file paths, line numbers, what specifically to change.
`

  // forkExamples 集合固定为 ``Example usage:`，作为工具调用Agent 工具 prompt后续展示或比较的基准。
  const forkExamples = `Example usage:

<example>
user: "What's left on this branch before we can ship?"
assistant: <thinking>Forking this \u2014 it's a survey question. I want the punch list, not the git output in my context.</thinking>
${AGENT_TOOL_NAME}({
  name: "ship-audit",
  description: "Branch ship-readiness audit",
  prompt: "Audit what's left before this branch can ship. Check: uncommitted changes, commits ahead of main, whether tests exist, whether the GrowthBook gate is wired up, whether CI-relevant files changed. Report a punch list \u2014 done vs. missing. Under 200 words."
})
assistant: Ship-readiness audit running.
<commentary>
Turn ends here. The coordinator knows nothing about the findings yet. What follows is a SEPARATE turn \u2014 the notification arrives from outside, as a user-role message. It is not something the coordinator writes.
</commentary>
[later turn \u2014 notification arrives as user message]
assistant: Audit's back. Three blockers: no tests for the new prompt path, GrowthBook gate wired but not in build_flags.yaml, and one uncommitted file.
</example>

<example>
user: "so is the gate wired up or not"
<commentary>
User asks mid-wait. The audit fork was launched to answer exactly this, and it hasn't returned. The coordinator does not have this answer. Give status, not a fabricated result.
</commentary>
assistant: Still waiting on the audit \u2014 that's one of the things it's checking. Should land shortly.
</example>

<example>
user: "Can you get a second opinion on whether this migration is safe?"
assistant: <thinking>I'll ask the code-reviewer agent — it won't see my analysis, so it can give an independent read.</thinking>
<commentary>
A subagent_type is specified, so the agent starts fresh. It needs full context in the prompt. The briefing explains what to assess and why.
</commentary>
${AGENT_TOOL_NAME}({
  name: "migration-review",
  description: "Independent migration review",
  subagent_type: "code-reviewer",
  prompt: "Review migration 0042_user_schema.sql for safety. Context: we're adding a NOT NULL column to a 50M-row table. Existing rows get a backfill default. I want a second opinion on whether the backfill approach is safe under concurrent writes — I've checked locking behavior but want independent verification. Report: is this safe, and if not, what specifically breaks?"
})
</example>
`

  // currentExamples 集合固定为 ``Example usage:`，作为工具调用Agent 工具 prompt后续展示或比较的基准。
  const currentExamples = `Example usage:

<example_agent_descriptions>
"test-runner": use this agent after you are done writing code to run tests
"greeting-responder": use this agent to respond to user greetings with a friendly joke
</example_agent_descriptions>

<example>
user: "Please write a function that checks if a number is prime"
assistant: I'm going to use the ${FILE_WRITE_TOOL_NAME} tool to write the following code:
<code>
function isPrime(n) {
  if (n <= 1) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}
</code>
<commentary>
Since a significant piece of code was written and the task was completed, now use the test-runner agent to run the tests
</commentary>
assistant: Uses the ${AGENT_TOOL_NAME} tool to launch the test-runner agent
</example>

<example>
user: "Hello"
<commentary>
Since the user is greeting, use the greeting-responder agent to respond with a friendly joke
</commentary>
assistant: "I'm going to use the ${AGENT_TOOL_NAME} tool to launch the greeting-responder agent"
</example>
`

  // When the gate is on, the agent list lives in an agent_listing_delta
  // attachment (see attachments.ts) instead of inline here. This keeps the
  // tool description static across MCP/plugin/permission changes so the
  // tools-block prompt cache doesn't bust every time an agent loads.
  // listViaAttachment 集合保存`shouldInjectAgentListInMessages`，供工具调用后续处理使用。
  const listViaAttachment = shouldInjectAgentListInMessages()

  // agentListSection 集合保存`listViaAttachment`，供工具调用Agent 工具 prompt后续判断或输出使用。
  const agentListSection = listViaAttachment
    ? `Available agent types are listed in <system-reminder> messages in the conversation.`
    : `Available agent types and the tools they have access to:
${effectiveAgents.map(agent => formatAgentLine(agent)).join('\n')}`

  // Shared core prompt used by both coordinator and non-coordinator modes
  const shared = `Launch a new agent to handle complex, multi-step tasks autonomously.

The ${AGENT_TOOL_NAME} tool launches specialized agents (subprocesses) that autonomously handle complex tasks. Each agent type has specific capabilities and tools available to it.

${agentListSection}

${
  forkEnabled
    ? `When using the ${AGENT_TOOL_NAME} tool, specify a subagent_type to use a specialized agent, or omit it to fork yourself — a fork inherits your full conversation context.`
    : `When using the ${AGENT_TOOL_NAME} tool, specify a subagent_type parameter to select which agent type to use. If omitted, the general-purpose agent is used.`
}`

  // Coordinator mode gets the slim prompt -- the coordinator system prompt
  // already covers usage notes, examples, and when-not-to-use guidance.
  // 满足 `isCoordinator` 时，工具调用执行该分支。
  if (isCoordinator) {
    // 返回 `shared`，作为工具调用这次计算的结果。
    return shared
  }

  // Ant-native builds alias find/grep to embedded bfs/ugrep and remove the
  // dedicated Glob/Grep tools, so point at find via Bash instead.
  // embedded保存`hasEmbeddedSearchTools`，供工具调用后续处理使用。
  const embedded = hasEmbeddedSearchTools()
  // fileSearchHint 文件数据保存`embedded`，供工具调用Agent 工具 prompt后续判断或输出使用。
  const fileSearchHint = embedded
    ? '`find` via the Bash tool'
    : `the ${GLOB_TOOL_NAME} tool`
  // The "class Foo" example is about content search. Non-embedded stays Glob
  // (original intent: find-the-file-containing). Embedded gets grep because
  // find -name doesn't look at file contents.
  // contentSearchHint 命名 `embedded`，让后续代码直接表达这个值的用途。
  const contentSearchHint = embedded
    ? '`grep` via the Bash tool'
    : `the ${GLOB_TOOL_NAME} tool`
  // whenNotToUseSection保存`forkEnabled`，供后续判断或组装使用。
  const whenNotToUseSection = forkEnabled
    ? ''
    : `
When NOT to use the ${AGENT_TOOL_NAME} tool:
- If you want to read a specific file path, use the ${FILE_READ_TOOL_NAME} tool or ${fileSearchHint} instead of the ${AGENT_TOOL_NAME} tool, to find the match more quickly
- If you are searching for a specific class definition like "class Foo", use ${contentSearchHint} instead, to find the match more quickly
- If you are searching for code within a specific file or set of 2-3 files, use the ${FILE_READ_TOOL_NAME} tool instead of the ${AGENT_TOOL_NAME} tool, to find the match more quickly
- Other tasks that are not related to the agent descriptions above
`

  // When listing via attachment, the "launch multiple agents" note is in the
  // attachment message (conditioned on subscription there). When inline, keep
  // the existing per-call getSubscriptionType() check.
  // concurrencyNote 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const concurrencyNote =
    !listViaAttachment && getSubscriptionType() !== 'pro'
      ? `
- Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses`
      : ''

  // Non-coordinator gets the full prompt with all sections
  // 返回 ``${shared}`，作为工具调用这次计算的结果。
  return `${shared}
${whenNotToUseSection}

Usage notes:
- Always include a short description (3-5 words) summarizing what the agent will do${concurrencyNote}
- When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.${
    // eslint-disable-next-line custom-rules/no-process-env-top-level
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS) &&
    !isInProcessTeammate() &&
    !forkEnabled
      ? `
- You can optionally run agents in the background using the run_in_background parameter. When an agent runs in the background, you will be automatically notified when it completes — do NOT sleep, poll, or proactively check on its progress. Continue with other work or respond to the user instead.
- **Foreground vs background**: Use foreground (default) when you need the agent's results before you can proceed — e.g., research agents whose findings inform your next steps. Use background when you have genuinely independent work to do in parallel.`
      : ''
  }
- To continue a previously spawned agent, use ${SEND_MESSAGE_TOOL_NAME} with the agent's ID or name as the \`to\` field. The agent resumes with its full context preserved. ${forkEnabled ? 'Each fresh Agent invocation with a subagent_type starts without context — provide a complete task description.' : 'Each Agent invocation starts fresh — provide a complete task description.'}
- The agent's outputs should generally be trusted
- Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.)${forkEnabled ? '' : ", since it is not aware of the user's intent"}
- If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.
- If the user specifies that they want you to run agents "in parallel", you MUST send a single message with multiple ${AGENT_TOOL_NAME} tool use content blocks. For example, if you need to launch both a build-validator agent and a test-runner agent in parallel, send a single message with both tool calls.
- You can optionally set \`isolation: "worktree"\` to run the agent in a temporary git worktree, giving it an isolated copy of the repository. The worktree is automatically cleaned up if the agent makes no changes; if changes are made, the worktree path and branch are returned in the result.${
    process.env.USER_TYPE === 'ant'
      ? `\n- You can set \`isolation: "remote"\` to run the agent in a remote CCR environment. This is always a background task; you'll be notified when it completes. Use for long-running tasks that need a fresh sandbox.`
      : ''
  }${
    isInProcessTeammate()
      ? `
- The run_in_background, name, team_name, and mode parameters are not available in this context. Only synchronous subagents are supported.`
      : isTeammate()
        ? `
- The name, team_name, and mode parameters are not available in this context — teammates cannot spawn other teammates. Omit them to spawn a subagent.`
        : ''
  }${whenToForkSection}${writingThePromptSection}

${forkEnabled ? forkExamples : currentExamples}`
}
