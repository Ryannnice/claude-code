/**
 * Periodic background summarization for coordinator mode sub-agents.
 *
 * Forks the sub-agent's conversation every ~30s using runForkedAgent()
 * to generate a 1-2 sentence progress summary. The summary is stored
 * on AgentProgress for UI display.
 *
 * Cache sharing: uses the same CacheSafeParams as the parent agent
 * to share the prompt cache. Tools are kept in the request for cache
 * key matching but denied via canUseTool callback.
 */

// 类型依赖 { TaskContext } 来自 ../../Task.js，用于校准服务层 agent Summary的数据契约。
import type { TaskContext } from '../../Task.js'
// 引入 updateAgentSummary，将 ../../tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { updateAgentSummary } from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 接入 filterIncompleteToolCalls 工具实现，后续工具池会按权限和开关决定是否暴露。
import { filterIncompleteToolCalls } from '../../tools/AgentTool/runAgent.js'
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准服务层 agent Summary的数据契约。
import type { AgentId } from '../../types/ids.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让服务层 agent Summary后续逻辑可以直接复用这些外部能力。
import {
  type CacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage } from '../../utils/messages.js'
// 复用 getAgentTranscript 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getAgentTranscript } from '../../utils/sessionStorage.js'

// SUMMARY_INTERVAL_MS 集合 命名 `30_000`，让后续代码直接表达这个值的用途。
const SUMMARY_INTERVAL_MS = 30_000

// buildSummaryPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildSummaryPrompt(previousSummary: string | null): string {
  // prevLine 命名 `previousSummary`，让后续代码直接表达这个值的用途。
  const prevLine = previousSummary
    ? `\nPrevious: "${previousSummary}" — say something NEW.\n`
    : ''

  // 返回 ``Describe your most recent action in 3-5 words using present tense (-in...`，作为服务层 agent Summary这次计算的结果。
  return `Describe your most recent action in 3-5 words using present tense (-ing). Name the file or function, not the branch. Do not use tools.
${prevLine}
Good: "Reading runAgent.ts"
Good: "Fixing null check in validate.ts"
Good: "Running auth module tests"
Good: "Adding retry logic to fetchUser"

Bad (past tense): "Analyzed the branch diff"
Bad (too vague): "Investigating the issue"
Bad (too long): "Reviewing full branch diff and AgentTool.tsx integration"
Bad (branch name): "Analyzed adam/background-summary branch diff"`
}

// startAgentSummarization 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startAgentSummarization(
  taskId: string,
  agentId: AgentId,
  cacheSafeParams: CacheSafeParams,
  setAppState: TaskContext['setAppState'],
// 这个回调绑定到 ): { stop: () => void } {，负责服务层 agent Summary在该局部场景下的响应。
): { stop: () => void } {
  // Drop forkContextMessages from the closure — runSummary rebuilds it each
  // tick from getAgentTranscript(). Without this, the original fork messages
  // (passed from AgentTool.tsx) are pinned for the lifetime of the timer.
  // 从 `cacheSafeParams` 解构 forkContextMessages、其余 baseParams，减少服务层 agent Summary对同一对象的重复访问。
  const { forkContextMessages: _drop, ...baseParams } = cacheSafeParams
  // summaryAbortController 命名 `null`，让后续代码直接表达这个值的用途。
  let summaryAbortController: AbortController | null = null
  // timeoutId保存`null`，作为后续空值处理的输入。
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  // stopped标记服务层 agent Summary是否启用对应路径。
  let stopped = false
  // previousSummary 命名 `null`，让后续代码直接表达这个值的用途。
  let previousSummary: string | null = null

  // runSummary 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function runSummary(): Promise<void> {
    // 满足 `stopped` 时，服务层 agent Summary执行该分支。
    if (stopped) return

    // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[AgentSummary] Timer fired for agent ${agentId}`)

    // 保护这一段可能失败的服务层 agent Summary操作，确保异常能进入相邻错误处理。
    try {
      // Read current messages from transcript
      // transcript读取`getAgentTranscript`，供服务层 agent Summary后续处理使用。
      const transcript = await getAgentTranscript(agentId)
      // 组合条件 `!transcript || transcript.messages.length < 3` 成立时，服务层 agent Summary才启用这条专门路径。
      if (!transcript || transcript.messages.length < 3) {
        // Not enough context yet — finally block will schedule next attempt
        // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[AgentSummary] Skipping summary for ${taskId}: not enough messages (${transcript?.messages.length ?? 0})`,
        )
        // 服务层 agent Summary在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Filter to clean message state
      // cleanMessages 消息数据筛选`filterIncompleteToolCalls`，供服务层 agent Summary后续处理使用。
      const cleanMessages = filterIncompleteToolCalls(transcript.messages)

      // Build fork params with current messages
      // forkParams 集合 集中保存服务层 agent Summary要一起传递的字段。
      const forkParams: CacheSafeParams = {
        ...baseParams,
        forkContextMessages: cleanMessages,
      }

      // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[AgentSummary] Forking for summary, ${cleanMessages.length} messages in context`,
      )

      // Create abort controller for this summary
      // summaryAbortController更新为 `new AbortController()`，确保服务层后续读取最新状态。
      summaryAbortController = new AbortController()

      // Deny tools via callback, NOT by passing tools:[] - that busts cache
      // canUseTool记录 `async` 是否成立，服务层 agent Summary随后按该结果分支。
      const canUseTool = async () => ({
        behavior: 'deny' as const,
        message: 'No tools needed for summary',
        decisionReason: { type: 'other' as const, reason: 'summary only' },
      })

      // DO NOT set maxOutputTokens here. The fork piggybacks on the main
      // thread's prompt cache by sending identical cache-key params (system,
      // tools, model, messages prefix, thinking config). Setting maxOutputTokens
      // would clamp budget_tokens, creating a thinking config mismatch that
      // invalidates the cache.
      //
      // ContentReplacementState is cloned by default in createSubagentContext
      // from forkParams.toolUseContext (the subagent's LIVE state captured at
      // onCacheSafeParams time). No explicit override needed.
      // 结果保存`runForkedAgent`，供服务层 agent Summary后续处理使用。
      const result = await runForkedAgent({
        promptMessages: [
          createUserMessage({ content: buildSummaryPrompt(previousSummary) }),
        ],
        cacheSafeParams: forkParams,
        canUseTool,
        querySource: 'agent_summary',
        forkLabel: 'agent_summary',
        overrides: { abortController: summaryAbortController },
        skipTranscript: true,
      })

      // 满足 `stopped` 时，服务层 agent Summary执行该分支。
      if (stopped) return

      // Extract summary text from result
      // 按顺序遍历 `result.messages` 中的消息，逐个交给服务层 agent Summary处理。
      for (const msg of result.messages) {
        // `msg.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.type !== 'assistant') continue
        // Skip API error messages
        // 满足 `msg.isApiErrorMessage` 时，服务层 agent Summary执行该分支。
        if (msg.isApiErrorMessage) {
          // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[AgentSummary] Skipping API error message for ${taskId}`,
          )
          // 跳过当前项，继续处理服务层 agent Summary中的下一轮循环。
          continue
        }
        // textBlock筛选`content.find`，供服务层 agent Summary后续处理使用。
        const textBlock = msg.message.content.find(b => b.type === 'text')
        // 组合条件 `textBlock?.type === 'text' && textBlock.text.trim()` 成立时，服务层 agent Summary才启用这条专门路径。
        if (textBlock?.type === 'text' && textBlock.text.trim()) {
          // summaryText格式化`text.trim`，供服务层 agent Summary后续处理使用。
          const summaryText = textBlock.text.trim()
          // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[AgentSummary] Summary result for ${taskId}: ${summaryText}`,
          )
          // previousSummary更新为 `summaryText`，确保服务层后续读取最新状态。
          previousSummary = summaryText
          // 调用 updateAgentSummary，触发服务层 agent Summary此处需要的副作用。
          updateAgentSummary(taskId, summaryText, setAppState)
          // 结束这个分支或循环，避免服务层 agent Summary继续落入后续路径。
          break
        }
      }
    } catch (e) {
      // 组合条件 `!stopped && e instanceof Error` 成立时，服务层 agent Summary才启用这条专门路径。
      if (!stopped && e instanceof Error) {
        // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
        logError(e)
      }
    } finally {
      // summaryAbortController更新为 `null`，确保服务层后续读取最新状态。
      summaryAbortController = null
      // Reset timer on completion (not initiation) to prevent overlapping summaries
      // stopped缺失时提前走兜底路径，避免服务层 agent Summary继续依赖无效输入。
      if (!stopped) {
        // 调用 scheduleNext，触发服务层 agent Summary此处需要的副作用。
        scheduleNext()
      }
    }
  }

  // scheduleNext 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function scheduleNext(): void {
    // 满足 `stopped` 时，服务层 agent Summary执行该分支。
    if (stopped) return
    // timeoutId更新为 `setTimeout(runSummary, SUMMARY_INTERVAL_MS)`，确保服务层后续读取最新状态。
    timeoutId = setTimeout(runSummary, SUMMARY_INTERVAL_MS)
  }

  // stop 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function stop(): void {
    // 记录服务层 agent Summary运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[AgentSummary] Stopping summarization for ${taskId}`)
    // stopped更新为 `true`，确保服务层后续读取最新状态。
    stopped = true
    // 满足 `timeoutId` 时，服务层 agent Summary执行该分支。
    if (timeoutId) {
      // 调用 clearTimeout，触发服务层 agent Summary此处需要的副作用。
      clearTimeout(timeoutId)
      // timeoutId更新为 `null`，确保服务层后续读取最新状态。
      timeoutId = null
    }
    // 满足 `summaryAbortController` 时，服务层 agent Summary执行该分支。
    if (summaryAbortController) {
      // 触发取消信号，通知服务层 agent Summary中仍在等待的异步任务尽快停止。
      summaryAbortController.abort()
      // summaryAbortController更新为 `null`，确保服务层后续读取最新状态。
      summaryAbortController = null
    }
  }

  // Start the first timer
  // 调用 scheduleNext，触发服务层 agent Summary此处需要的副作用。
  scheduleNext()

  // 返回结构化结果，集中表达服务层 agent Summary已经整理出的状态。
  return { stop }
}
