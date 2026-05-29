// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { BetaToolUseBlock } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准工具调用的数据契约。
import type { BetaToolUseBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  FORK_BOILERPLATE_TAG,
  FORK_DIRECTIVE_PREFIX,
} from '../../constants/xml.js'
// 引入 isCoordinatorMode，将 ../../coordinator/coordinatorMode.js 中已经封装好的能力接到本文件流程里。
import { isCoordinatorMode } from '../../coordinator/coordinatorMode.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message as MessageType,
} from '../../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage } from '../../utils/messages.js'
// 类型依赖 { BuiltInAgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { BuiltInAgentDefinition } from './loadAgentsDir.js'

/**
 * Fork subagent feature gate.
 *
 * When enabled:
 * - `subagent_type` becomes optional on the Agent tool schema
 * - Omitting `subagent_type` triggers an implicit fork: the child inherits
 *   the parent's full conversation context and system prompt
 * - All agent spawns run in the background (async) for a unified
 *   `<task-notification>` interaction model
 * - `/fork <directive>` slash command is available
 *
 * Mutually exclusive with coordinator mode — coordinator already owns the
 * orchestration role and has its own delegation model.
 */
// isForkSubagentEnabled 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isForkSubagentEnabled(): boolean {
  // 满足 `feature('FORK_SUBAGENT')` 时，工具调用执行该分支。
  if (feature('FORK_SUBAGENT')) {
    // 满足 `isCoordinatorMode()` 时，工具调用执行该分支。
    if (isCoordinatorMode()) return false
    // 满足 `getIsNonInteractiveSession()` 时，工具调用执行该分支。
    if (getIsNonInteractiveSession()) return false
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/** Synthetic agent type name used for analytics when the fork path fires. */
// FORK_SUBAGENT_TYPE 命名 `'fork'`，让后续代码直接表达这个值的用途。
export const FORK_SUBAGENT_TYPE = 'fork'

/**
 * Synthetic agent definition for the fork path.
 *
 * Not registered in builtInAgents — used only when `!subagent_type` and the
 * experiment is active. `tools: ['*']` with `useExactTools` means the fork
 * child receives the parent's exact tool pool (for cache-identical API
 * prefixes). `permissionMode: 'bubble'` surfaces permission prompts to the
 * parent terminal. `model: 'inherit'` keeps the parent's model for context
 * length parity.
 *
 * The getSystemPrompt here is unused: the fork path passes
 * `override.systemPrompt` with the parent's already-rendered system prompt
 * bytes, threaded via `toolUseContext.renderedSystemPrompt`. Reconstructing
 * by re-calling getSystemPrompt() can diverge (GrowthBook cold→warm) and
 * bust the prompt cache; threading the rendered bytes is byte-exact.
 */
// FORK_AGENT 集中保存工具调用Agent 工具 fork Subagent要一起传递的字段。
export const FORK_AGENT = {
  agentType: FORK_SUBAGENT_TYPE,
  whenToUse:
    'Implicit fork — inherits full conversation context. Not selectable via subagent_type; triggered by omitting subagent_type when the fork experiment is active.',
  tools: ['*'],
  maxTurns: 200,
  model: 'inherit',
  permissionMode: 'bubble',
  source: 'built-in',
  baseDir: 'built-in',
  // 这个回调绑定到 getSystemPrompt: () => '',，负责工具调用在该局部场景下的响应。
  getSystemPrompt: () => '',
} satisfies BuiltInAgentDefinition

/**
 * Guard against recursive forking. Fork children keep the Agent tool in their
 * tool pool for cache-identical tool definitions, so we reject fork attempts
 * at call time by detecting the fork boilerplate tag in conversation history.
 */
// isInForkChild 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInForkChild(messages: MessageType[]): boolean {
  // 返回 `messages.some(m => {`，作为工具调用这次计算的结果。
  return messages.some(m => {
    // `m.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (m.type !== 'user') return false
    // 文本内容 命名 `m.message.content`，让后续代码直接表达这个值的用途。
    const content = m.message.content
    // 满足 `!Array.isArray(content)` 时，工具调用执行该分支。
    if (!Array.isArray(content)) return false
    // 返回 `content.some(`，作为工具调用这次计算的结果。
    return content.some(
      // block更新为 `>`，确保Agent 工具后续读取最新状态。
      block =>
        block.type === 'text' &&
        block.text.includes(`<${FORK_BOILERPLATE_TAG}>`),
    )
  })
}

/** Placeholder text used for all tool_result blocks in the fork prefix.
 * Must be identical across all fork children for prompt cache sharing. */
// FORK_PLACEHOLDER_RESULT保存`'Fork started — processing in background'`，作为后续固定文本处理的输入。
const FORK_PLACEHOLDER_RESULT = 'Fork started — processing in background'

/**
 * Build the forked conversation messages for the child agent.
 *
 * For prompt cache sharing, all fork children must produce byte-identical
 * API request prefixes. This function:
 * 1. Keeps the full parent assistant message (all tool_use blocks, thinking, text)
 * 2. Builds a single user message with tool_results for every tool_use block
 *    using an identical placeholder, then appends a per-child directive text block
 *
 * Result: [...history, assistant(all_tool_uses), user(placeholder_results..., directive)]
 * Only the final text block differs per child, maximizing cache hits.
 */
// buildForkedMessages 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildForkedMessages(
  directive: string,
  assistantMessage: AssistantMessage,
): MessageType[] {
  // Clone the assistant message to avoid mutating the original, keeping all
  // content blocks (thinking, text, and every tool_use)
  // fullAssistantMessage 消息数据 集中保存Agent 工具 fork Subagent要一起传递的字段。
  const fullAssistantMessage: AssistantMessage = {
    ...assistantMessage,
    uuid: randomUUID(),
    message: {
      ...assistantMessage.message,
      content: [...assistantMessage.message.content],
    },
  }

  // Collect all tool_use blocks from the assistant message
  // toolUseBlocks 集合筛选`content.filter`，供工具调用后续处理使用。
  const toolUseBlocks = assistantMessage.message.content.filter(
    // 这个回调绑定到 (block): block is BetaToolUseBlock => block.type === 'tool_use',，负责工具调用在该局部场景下的响应。
    (block): block is BetaToolUseBlock => block.type === 'tool_use',
  )

  // toolUseBlocks 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (toolUseBlocks.length === 0) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `No tool_use blocks found in assistant message for fork directive: ${directive.slice(0, 50)}...`,
      { level: 'error' },
    )
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return [
      createUserMessage({
        content: [
          { type: 'text' as const, text: buildChildMessage(directive) },
        ],
      }),
    ]
  }

  // Build tool_result blocks for every tool_use, all with identical placeholder text
  // toolResultBlocks 集合派生`toolUseBlocks.map`，供工具调用后续处理使用。
  const toolResultBlocks = toolUseBlocks.map(block => ({
    type: 'tool_result' as const,
    tool_use_id: block.id,
    content: [
      {
        type: 'text' as const,
        text: FORK_PLACEHOLDER_RESULT,
      },
    ],
  }))

  // Build a single user message: all placeholder tool_results + the per-child directive
  // TODO(smoosh): this text sibling creates a [tool_result, text] pattern on the wire
  // (renders as </function_results>\n\nHuman:<text>). One-off per-child construction,
  // not a repeated teacher, so low-priority. If we ever care, use smooshIntoToolResult
  // from src/utils/messages.ts to fold the directive into the last tool_result.content.
  // toolResultMessage 消息数据构建`createUserMessage`，供工具调用后续处理使用。
  const toolResultMessage = createUserMessage({
    content: [
      ...toolResultBlocks,
      {
        type: 'text' as const,
        text: buildChildMessage(directive),
      },
    ],
  })

  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [fullAssistantMessage, toolResultMessage]
}

// buildChildMessage 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildChildMessage(directive: string): string {
  // 返回 ``<${FORK_BOILERPLATE_TAG}>`，作为工具调用这次计算的结果。
  return `<${FORK_BOILERPLATE_TAG}>
STOP. READ THIS FIRST.

You are a forked worker process. You are NOT the main agent.

RULES (non-negotiable):
1. Your system prompt says "default to forking." IGNORE IT \u2014 that's for the parent. You ARE the fork. Do NOT spawn sub-agents; execute directly.
2. Do NOT converse, ask questions, or suggest next steps
3. Do NOT editorialize or add meta-commentary
4. USE your tools directly: Bash, Read, Write, etc.
5. If you modify files, commit your changes before reporting. Include the commit hash in your report.
6. Do NOT emit text between tool calls. Use tools silently, then report once at the end.
7. Stay strictly within your directive's scope. If you discover related systems outside your scope, mention them in one sentence at most — other workers cover those areas.
8. Keep your report under 500 words unless the directive specifies otherwise. Be factual and concise.
9. Your response MUST begin with "Scope:". No preamble, no thinking-out-loud.
10. REPORT structured facts, then stop

Output format (plain text labels, not markdown headers):
  Scope: <echo back your assigned scope in one sentence>
  Result: <the answer or key findings, limited to the scope above>
  Key files: <relevant file paths — include for research tasks>
  Files changed: <list with commit hash — include only if you modified files>
  Issues: <list — include only if there are issues to flag>
</${FORK_BOILERPLATE_TAG}>

${FORK_DIRECTIVE_PREFIX}${directive}`
}

/**
 * Notice injected into fork children running in an isolated worktree.
 * Tells the child to translate paths from the inherited context, re-read
 * potentially stale files, and that its changes are isolated.
 */
// buildWorktreeNotice 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildWorktreeNotice(
  parentCwd: string,
  worktreeCwd: string,
): string {
  // 返回 ``You've inherited the conversation context above from a parent agent wo...`，作为工具调用这次计算的结果。
  return `You've inherited the conversation context above from a parent agent working in ${parentCwd}. You are operating in an isolated git worktree at ${worktreeCwd} — same repository, same relative file structure, separate working copy. Paths in the inherited context refer to the parent's working directory; translate them to your worktree root. Re-read files before editing if the parent may have modified them since they appear in the context. Your changes stay in this worktree and will not affect the parent's files.`
}
