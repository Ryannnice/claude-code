// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 getShortcutDisplay，将 ../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../keybindings/shortcutFormat.js'
// 引入 isExtractModeActive，将 ../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isExtractModeActive } from '../memdir/paths.js'
// 整理这一组导入，让stop Hooks后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准stop Hooks的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 类型依赖 { HookProgress } 来自 ../types/hooks.js，用于校准stop Hooks的数据契约。
import type { HookProgress } from '../types/hooks.js'
// 整理这一组导入，让stop Hooks后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  RequestStartEvent,
  StopHookInfo,
  StreamEvent,
  TombstoneMessage,
  ToolUseSummaryMessage,
} from '../types/message.js'
// 复用 createAttachmentMessage 工具函数，把通用处理留在 ../utils/attachments.js 中维护。
import { createAttachmentMessage } from '../utils/attachments.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 类型依赖 { REPLHookContext } 来自 ../utils/hooks/postSamplingHooks.js，用于校准stop Hooks的数据契约。
import type { REPLHookContext } from '../utils/hooks/postSamplingHooks.js'
// 整理这一组导入，让stop Hooks后续逻辑可以直接复用这些外部能力。
import {
  executeStopHooks,
  executeTaskCompletedHooks,
  executeTeammateIdleHooks,
  getStopHookMessage,
  getTaskCompletedHookMessage,
  getTeammateIdleHookMessage,
} from '../utils/hooks.js'
// 整理这一组导入，让stop Hooks后续逻辑可以直接复用这些外部能力。
import {
  createStopHookSummaryMessage,
  createSystemMessage,
  createUserInterruptionMessage,
  createUserMessage,
} from '../utils/messages.js'
// 类型依赖 { SystemPrompt } 来自 ../utils/systemPromptType.js，用于校准stop Hooks的数据契约。
import type { SystemPrompt } from '../utils/systemPromptType.js'
// 复用 getTaskListId、listTasks 工具函数，把通用处理留在 ../utils/tasks.js 中维护。
import { getTaskListId, listTasks } from '../utils/tasks.js'
// 复用 getAgentName、getTeamName、isTeammate 工具函数，把通用处理留在 ../utils/teammate.js 中维护。
import { getAgentName, getTeamName, isTeammate } from '../utils/teammate.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// extractMemoriesModule保存`feature`，供stop Hooks后续处理使用。
const extractMemoriesModule = feature('EXTRACT_MEMORIES')
  ? (require('../services/extractMemories/extractMemories.js') as typeof import('../services/extractMemories/extractMemories.js'))
  : null
// jobClassifierModule保存`feature`，供stop Hooks后续处理使用。
const jobClassifierModule = feature('TEMPLATES')
  ? (require('../jobs/classifier.js') as typeof import('../jobs/classifier.js'))
  : null

/* eslint-enable @typescript-eslint/no-require-imports */

// 类型依赖 { QuerySource } 来自 ../constants/querySource.js，用于校准stop Hooks的数据契约。
import type { QuerySource } from '../constants/querySource.js'
// 接入 executeAutoDream 服务层能力，把外部通信或共享状态交给 ../services/autoDream/autoDream.js 处理。
import { executeAutoDream } from '../services/autoDream/autoDream.js'
// 接入 executePromptSuggestion 服务层能力，把外部通信或共享状态交给 ../services/PromptSuggestion/promptSuggestion.js 处理。
import { executePromptSuggestion } from '../services/PromptSuggestion/promptSuggestion.js'
// 复用 isBareMode、isEnvDefinedFalsy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isBareMode, isEnvDefinedFalsy } from '../utils/envUtils.js'
// 整理这一组导入，让stop Hooks后续逻辑可以直接复用这些外部能力。
import {
  createCacheSafeParams,
  saveCacheSafeParams,
} from '../utils/forkedAgent.js'

// StopHookResult 固化stop Hooks里传递的数据形状，帮助调用方按同一结构读写字段。
type StopHookResult = {
  blockingErrors: Message[]
  preventContinuation: boolean
}

// stop Hooks在这里处理 `export async function* handleStopHooks(`，完成这一小步状态转换。
export async function* handleStopHooks(
  messagesForQuery: Message[],
  assistantMessages: AssistantMessage[],
  systemPrompt: SystemPrompt,
  userContext: { [k: string]: string },
  systemContext: { [k: string]: string },
  toolUseContext: ToolUseContext,
  querySource: QuerySource,
  stopHookActive?: boolean,
): AsyncGenerator<
  | StreamEvent
  | RequestStartEvent
  | Message
  | TombstoneMessage
  | ToolUseSummaryMessage,
  StopHookResult
> {
  // hookStartTime记录时间`Date.now`，供stop Hooks后续处理使用。
  const hookStartTime = Date.now()

  // stopHookContext 集中保存stop Hooks要一起传递的字段。
  const stopHookContext: REPLHookContext = {
    messages: [...messagesForQuery, ...assistantMessages],
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    querySource,
  }
  // Only save params for main session queries — subagents must not overwrite.
  // Outside the prompt-suggestion gate: the REPL /btw command and the
  // side_question SDK control_request both read this snapshot, and neither
  // depends on prompt suggestions being enabled.
  // 组合条件 `querySource === 'repl_main_thread' || querySource` 成立时，stop Hooks才启用这条专门路径。
  if (querySource === 'repl_main_thread' || querySource === 'sdk') {
    // 调用 saveCacheSafeParams，触发stop Hooks此处需要的副作用。
    saveCacheSafeParams(createCacheSafeParams(stopHookContext))
  }

  // Template job classification: when running as a dispatched job, classify
  // state after each turn. Gate on repl_main_thread so background forks
  // (extract-memories, auto-dream) don't pollute the timeline with their own
  // assistant messages. Await the classifier so state.json is written before
  // the turn returns — otherwise `claude list` shows stale state for the gap.
  // Env key hardcoded (vs importing JOB_ENV_KEY from jobs/state) to match the
  // require()-gated jobs/ import pattern above; spawn.test.ts asserts the
  // string matches.
  // stop Hooks在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('TEMPLATES') &&
    process.env.CLAUDE_JOB_DIR &&
    querySource.startsWith('repl_main_thread') &&
    !toolUseContext.agentId
  ) {
    // Full turn history — assistantMessages resets each queryLoop iteration,
    // so tool calls from earlier iterations (Agent spawn, then summary) need
    // messagesForQuery to be visible in the tool-call summary.
    // turnAssistantMessages 消息数据筛选`messages.filter`，供stop Hooks后续处理使用。
    const turnAssistantMessages = stopHookContext.messages.filter(
      // 这个回调绑定到 (m): m is AssistantMessage => m.type === 'assistant',，负责stop Hooks在该局部场景下的响应。
      (m): m is AssistantMessage => m.type === 'assistant',
    )
    // p保存`jobClassifierModule!`，供stop Hooks后续判断或输出使用。
    const p = jobClassifierModule!
      .classifyAndWriteState(process.env.CLAUDE_JOB_DIR, turnAssistantMessages)
      // 链式调用 catch，继续加工上一行在stop Hooks中产生的数据。
      .catch(err => {
        // 记录stop Hooks运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[job] classifier error: ${errorMessage(err)}`, {
          level: 'error',
        })
      })
    // 等待 `Promise.race([` 完成，再继续stop Hooks的异步流程。
    await Promise.race([
      p,
      // eslint-disable-next-line no-restricted-syntax -- sleep() has no .unref(); timer must not block exit
      // 这个回调绑定到 new Promise<void>(r => setTimeout(r, 60_000).unref()),，负责stop Hooks在该局部场景下的响应。
      new Promise<void>(r => setTimeout(r, 60_000).unref()),
    ])
  }
  // --bare / SIMPLE: skip background bookkeeping (prompt suggestion,
  // memory extraction, auto-dream). Scripted -p calls don't want auto-memory
  // or forked agents contending for resources during shutdown.
  // 满足 `!isBareMode()` 时，stop Hooks执行该分支。
  if (!isBareMode()) {
    // Inline env check for dead code elimination in external builds
    // 满足 `!isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION)` 时，stop Hooks执行该分支。
    if (!isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION)) {
      // 显式忽略 `executePromptSuggestion(stopHookContext)` 的返回值，只保留它触发的副作用。
      void executePromptSuggestion(stopHookContext)
    }
    // stop Hooks在这里进入条件判断，后续代码按实际状态分流。
    if (
      feature('EXTRACT_MEMORIES') &&
      !toolUseContext.agentId &&
      isExtractModeActive()
    ) {
      // Fire-and-forget in both interactive and non-interactive. For -p/SDK,
      // print.ts drains the in-flight promise after flushing the response
      // but before gracefulShutdownSync (see drainPendingExtraction).
      // 显式忽略 `extractMemoriesModule!.executeExtractMemories(` 的返回值，只保留它触发的副作用。
      void extractMemoriesModule!.executeExtractMemories(
        stopHookContext,
        toolUseContext.appendSystemMessage,
      )
    }
    // toolUseContext.agentId缺失时提前走兜底路径，避免stop Hooks继续依赖无效输入。
    if (!toolUseContext.agentId) {
      // 显式忽略 `executeAutoDream(stopHookContext, toolUseContext.appendSystemMe...` 的返回值，只保留它触发的副作用。
      void executeAutoDream(stopHookContext, toolUseContext.appendSystemMessage)
    }
  }

  // chicago MCP: auto-unhide + lock release at turn end.
  // Main thread only — the CU lock is a process-wide module-level variable,
  // so a subagent's stopHooks releasing it leaves the main thread's cleanup
  // seeing isLockHeldLocally()===false → no exit notification, and unhides
  // mid-turn. Subagents don't start CU sessions so this is a pure skip.
  // 组合条件 `feature('CHICAGO_MCP') && !toolUseContext.agentId` 成立时，stop Hooks才启用这条专门路径。
  if (feature('CHICAGO_MCP') && !toolUseContext.agentId) {
    // 保护这一段可能失败的stop Hooks操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await import(` 解构 cleanupComputerUseAfterTurn，减少stop Hooks对同一对象的重复访问。
      const { cleanupComputerUseAfterTurn } = await import(
        '../utils/computerUse/cleanup.js'
      )
      // 等待 `cleanupComputerUseAfterTurn(toolUseContext)` 完成，再继续stop Hooks的异步流程。
      await cleanupComputerUseAfterTurn(toolUseContext)
    } catch {
      // Failures are silent — this is dogfooding cleanup, not critical path
    }
  }

  // 保护这一段可能失败的stop Hooks操作，确保异常能进入相邻错误处理。
  try {
    // blockingErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
    const blockingErrors = []
    // appState 状态读取`toolUseContext.getAppState`，供stop Hooks后续处理使用。
    const appState = toolUseContext.getAppState()
    // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供后续判断或组装使用。
    const permissionMode = appState.toolPermissionContext.mode

    // generator保存`executeStopHooks`，供stop Hooks后续处理使用。
    const generator = executeStopHooks(
      permissionMode,
      toolUseContext.abortController.signal,
      undefined,
      stopHookActive ?? false,
      toolUseContext.agentId,
      toolUseContext,
      [...messagesForQuery, ...assistantMessages],
      toolUseContext.agentType,
    )

    // Consume all progress messages and get blocking errors
    // stopHookToolUseID固定为 `''`，作为stop Hooks后续展示或比较的基准。
    let stopHookToolUseID = ''
    // hookCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let hookCount = 0
    // preventedContinuation标记stop Hooks是否启用对应路径。
    let preventedContinuation = false
    // stopReason 命名 `''`，让后续代码直接表达这个值的用途。
    let stopReason = ''
    // hasOutput标记stop Hooks是否启用对应路径。
    let hasOutput = false
    // hookErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
    const hookErrors: string[] = []
    // hookInfos 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const hookInfos: StopHookInfo[] = []

    // 逐项读取 `generator` 中的结果，按输入顺序推进stop Hooks。
    for await (const result of generator) {
      // 满足 `result.message` 时，stop Hooks执行该分支。
      if (result.message) {
        // 生成器产出 `result.message`，把阶段性结果交给上层消费。
        yield result.message
        // Track toolUseID from progress messages and count hooks
        // 组合条件 `result.message.type === 'progress' && result.mess` 成立时，stop Hooks才启用这条专门路径。
        if (result.message.type === 'progress' && result.message.toolUseID) {
          // stopHookToolUseID更新为 `result.message.toolUseID`，确保stopHooks后续读取最新状态。
          stopHookToolUseID = result.message.toolUseID
          // stop Hooks在这里处理 `hookCount++`，完成这一小步状态转换。
          hookCount++
          // Extract hook command and prompt text from progress data
          // progressData 命名 `result.message.data as HookProgress`，让后续代码直接表达这个值的用途。
          const progressData = result.message.data as HookProgress
          // 满足 `progressData.command` 时，stop Hooks执行该分支。
          if (progressData.command) {
            // hookInfos 集合追加新条目，保持收集顺序与输入顺序一致。
            hookInfos.push({
              command: progressData.command,
              promptText: progressData.promptText,
            })
          }
        }
        // Track errors and output from attachments
        // 当 `result.message.type` 匹配 `'attachment'` 时，stop Hooks执行对应分支。
        if (result.message.type === 'attachment') {
          // attachment 命名 `result.message.attachment`，让后续代码直接表达这个值的用途。
          const attachment = result.message.attachment
          // stop Hooks在这里进入条件判断，后续代码按实际状态分流。
          if (
            'hookEvent' in attachment &&
            (attachment.hookEvent === 'Stop' ||
              attachment.hookEvent === 'SubagentStop')
          ) {
            // 当 `attachment.type` 匹配 `'hook_non_blocking_error'` 时，stop Hooks执行对应分支。
            if (attachment.type === 'hook_non_blocking_error') {
              // hookErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
              hookErrors.push(
                attachment.stderr || `Exit code ${attachment.exitCode}`,
              )
              // Non-blocking errors always have output
              // hasOutput更新为 `true`，确保stopHooks后续读取最新状态。
              hasOutput = true
            // stop Hooks在这里处理 `} else if (attachment.type === 'hook_error_during_execution') {`，完成这一小步状态转换。
            } else if (attachment.type === 'hook_error_during_execution') {
              // hookErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
              hookErrors.push(attachment.content)
              // hasOutput更新为 `true`，确保stopHooks后续读取最新状态。
              hasOutput = true
            // stop Hooks在这里处理 `} else if (attachment.type === 'hook_success') {`，完成这一小步状态转换。
            } else if (attachment.type === 'hook_success') {
              // Check if successful hook produced any stdout/stderr
              // stop Hooks在这里进入条件判断，后续代码按实际状态分流。
              if (
                (attachment.stdout && attachment.stdout.trim()) ||
                (attachment.stderr && attachment.stderr.trim())
              ) {
                // hasOutput更新为 `true`，确保stopHooks后续读取最新状态。
                hasOutput = true
              }
            }
            // Extract per-hook duration for timing visibility.
            // Hooks run in parallel; match by command + first unassigned entry.
            // 组合条件 `'durationMs' in attachment && 'command' in attach` 成立时，stop Hooks才启用这条专门路径。
            if ('durationMs' in attachment && 'command' in attachment) {
              // info筛选`hookInfos.find`，供stop Hooks后续处理使用。
              const info = hookInfos.find(
                // i更新为 `>`，确保stopHooks后续读取最新状态。
                i =>
                  i.command === attachment.command &&
                  i.durationMs === undefined,
              )
              // 满足 `info` 时，stop Hooks执行该分支。
              if (info) {
                // durationMs 集合更新为 `attachment.durationMs`，确保stopHooks后续读取最新状态。
                info.durationMs = attachment.durationMs
              }
            }
          }
        }
      }
      // 满足 `result.blockingError` 时，stop Hooks执行该分支。
      if (result.blockingError) {
        // userMessage 消息数据构建`createUserMessage`，供stop Hooks后续处理使用。
        const userMessage = createUserMessage({
          content: getStopHookMessage(result.blockingError),
          isMeta: true, // Hide from UI (shown in summary message instead)
        })
        // blockingErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
        blockingErrors.push(userMessage)
        // 生成器产出 `userMessage`，把阶段性结果交给上层消费。
        yield userMessage
        // hasOutput更新为 `true`，确保stopHooks后续读取最新状态。
        hasOutput = true
        // Add to hookErrors so it appears in the summary
        // hookErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
        hookErrors.push(result.blockingError.blockingError)
      }
      // Check if hook wants to prevent continuation
      // 满足 `result.preventContinuation` 时，stop Hooks执行该分支。
      if (result.preventContinuation) {
        // preventedContinuation更新为 `true`，确保stopHooks后续读取最新状态。
        preventedContinuation = true
        // stopReason更新为 `result.stopReason || 'Stop hook prevented continuation'`，确保stopHooks后续读取最新状态。
        stopReason = result.stopReason || 'Stop hook prevented continuation'
        // Create attachment to track the stopped continuation (for structured data)
        // 生成器产出 `createAttachmentMessage({`，把阶段性结果交给上层消费。
        yield createAttachmentMessage({
          type: 'hook_stopped_continuation',
          message: stopReason,
          hookName: 'Stop',
          toolUseID: stopHookToolUseID,
          hookEvent: 'Stop',
        })
      }

      // Check if we were aborted during hook execution
      // 满足 `toolUseContext.abortController.signal.aborted` 时，stop Hooks执行该分支。
      if (toolUseContext.abortController.signal.aborted) {
        // 记录stop Hooks运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_pre_stop_hooks_cancelled', {
          queryChainId: toolUseContext.queryTracking
            ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,

          queryDepth: toolUseContext.queryTracking?.depth,
        })
        // 生成器产出 `createUserInterruptionMessage({`，把阶段性结果交给上层消费。
        yield createUserInterruptionMessage({
          toolUse: false,
        })
        // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
        return { blockingErrors: [], preventContinuation: true }
      }
    }

    // Create summary system message if hooks ran
    // 满足 `hookCount > 0` 时，stop Hooks执行该分支。
    if (hookCount > 0) {
      // 生成器产出 `createStopHookSummaryMessage(`，把阶段性结果交给上层消费。
      yield createStopHookSummaryMessage(
        hookCount,
        hookInfos,
        hookErrors,
        preventedContinuation,
        stopReason,
        hasOutput,
        'suggestion',
        stopHookToolUseID,
      )

      // Send notification about errors (shown in verbose/transcript mode via ctrl+o)
      // 满足 `hookErrors.length > 0` 时，stop Hooks执行该分支。
      if (hookErrors.length > 0) {
        // expandShortcut读取`getShortcutDisplay`，供stop Hooks后续处理使用。
        const expandShortcut = getShortcutDisplay(
          'app:toggleTranscript',
          'Global',
          'ctrl+o',
        )
        // 调用 toolUseContext.addNotification?.({，完成这一处局部操作。
        toolUseContext.addNotification?.({
          key: 'stop-hook-error',
          text: `Stop hook error occurred \u00b7 ${expandShortcut} to see`,
          priority: 'immediate',
        })
      }
    }

    // 满足 `preventedContinuation` 时，stop Hooks执行该分支。
    if (preventedContinuation) {
      // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
      return { blockingErrors: [], preventContinuation: true }
    }

    // Collect blocking errors from stop hooks
    // 满足 `blockingErrors.length > 0` 时，stop Hooks执行该分支。
    if (blockingErrors.length > 0) {
      // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
      return { blockingErrors, preventContinuation: false }
    }

    // After Stop hooks pass, run TeammateIdle and TaskCompleted hooks if this is a teammate
    // 满足 `isTeammate()` 时，stop Hooks执行该分支。
    if (isTeammate()) {
      // teammateName读取`getAgentName`，供stop Hooks后续处理使用。
      const teammateName = getAgentName() ?? ''
      // teamName读取`getTeamName`，供stop Hooks后续处理使用。
      const teamName = getTeamName() ?? ''
      // teammateBlockingErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
      const teammateBlockingErrors: Message[] = []
      // teammatePreventedContinuation标记stop Hooks是否启用对应路径。
      let teammatePreventedContinuation = false
      // teammateStopReason 先占位，稍后的条件分支会根据实际输入补齐它。
      let teammateStopReason: string | undefined
      // Each hook executor generates its own toolUseID — capture from progress
      // messages (same pattern as stopHookToolUseID at L142), not the Stop ID.
      // teammateHookToolUseID保存`''`，作为后续固定文本处理的输入。
      let teammateHookToolUseID = ''

      // Run TaskCompleted hooks for any in-progress tasks owned by this teammate
      // taskListId 集合读取`getTaskListId`，供stop Hooks后续处理使用。
      const taskListId = getTaskListId()
      // tasks 集合保存`listTasks`，供stop Hooks后续处理使用。
      const tasks = await listTasks(taskListId)
      // inProgressTasks 集合筛选`tasks.filter`，供stop Hooks后续处理使用。
      const inProgressTasks = tasks.filter(
        // t更新为 `> t.status === 'in_progress' && t.owner === teammateName`，确保stopHooks后续读取最新状态。
        t => t.status === 'in_progress' && t.owner === teammateName,
      )

      // 按顺序遍历 `inProgressTasks` 中的task，逐个交给stop Hooks处理。
      for (const task of inProgressTasks) {
        // taskCompletedGenerator保存`executeTaskCompletedHooks`，供stop Hooks后续处理使用。
        const taskCompletedGenerator = executeTaskCompletedHooks(
          task.id,
          task.subject,
          task.description,
          teammateName,
          teamName,
          permissionMode,
          toolUseContext.abortController.signal,
          undefined,
          toolUseContext,
        )

        // 逐项读取 `taskCompletedGenerator` 中的结果，按输入顺序推进stop Hooks。
        for await (const result of taskCompletedGenerator) {
          // 满足 `result.message` 时，stop Hooks执行该分支。
          if (result.message) {
            // stop Hooks在这里进入条件判断，后续代码按实际状态分流。
            if (
              result.message.type === 'progress' &&
              result.message.toolUseID
            ) {
              // teammateHookToolUseID更新为 `result.message.toolUseID`，确保stopHooks后续读取最新状态。
              teammateHookToolUseID = result.message.toolUseID
            }
            // 生成器产出 `result.message`，把阶段性结果交给上层消费。
            yield result.message
          }
          // 满足 `result.blockingError` 时，stop Hooks执行该分支。
          if (result.blockingError) {
            // userMessage 消息数据构建`createUserMessage`，供stop Hooks后续处理使用。
            const userMessage = createUserMessage({
              content: getTaskCompletedHookMessage(result.blockingError),
              isMeta: true,
            })
            // teammateBlockingErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
            teammateBlockingErrors.push(userMessage)
            // 生成器产出 `userMessage`，把阶段性结果交给上层消费。
            yield userMessage
          }
          // Match Stop hook behavior: allow preventContinuation/stopReason
          // 满足 `result.preventContinuation` 时，stop Hooks执行该分支。
          if (result.preventContinuation) {
            // teammatePreventedContinuation更新为 `true`，确保stopHooks后续读取最新状态。
            teammatePreventedContinuation = true
            // stop Hooks在这里处理 `teammateStopReason =`，完成这一小步状态转换。
            teammateStopReason =
              result.stopReason || 'TaskCompleted hook prevented continuation'
            // 生成器产出 `createAttachmentMessage({`，把阶段性结果交给上层消费。
            yield createAttachmentMessage({
              type: 'hook_stopped_continuation',
              message: teammateStopReason,
              hookName: 'TaskCompleted',
              toolUseID: teammateHookToolUseID,
              hookEvent: 'TaskCompleted',
            })
          }
          // 满足 `toolUseContext.abortController.signal.aborted` 时，stop Hooks执行该分支。
          if (toolUseContext.abortController.signal.aborted) {
            // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
            return { blockingErrors: [], preventContinuation: true }
          }
        }
      }

      // Run TeammateIdle hooks
      // teammateIdleGenerator保存`executeTeammateIdleHooks`，供stop Hooks后续处理使用。
      const teammateIdleGenerator = executeTeammateIdleHooks(
        teammateName,
        teamName,
        permissionMode,
        toolUseContext.abortController.signal,
      )

      // 逐项读取 `teammateIdleGenerator` 中的结果，按输入顺序推进stop Hooks。
      for await (const result of teammateIdleGenerator) {
        // 满足 `result.message` 时，stop Hooks执行该分支。
        if (result.message) {
          // 组合条件 `result.message.type === 'progress' && result.mess` 成立时，stop Hooks才启用这条专门路径。
          if (result.message.type === 'progress' && result.message.toolUseID) {
            // teammateHookToolUseID更新为 `result.message.toolUseID`，确保stopHooks后续读取最新状态。
            teammateHookToolUseID = result.message.toolUseID
          }
          // 生成器产出 `result.message`，把阶段性结果交给上层消费。
          yield result.message
        }
        // 满足 `result.blockingError` 时，stop Hooks执行该分支。
        if (result.blockingError) {
          // userMessage 消息数据构建`createUserMessage`，供stop Hooks后续处理使用。
          const userMessage = createUserMessage({
            content: getTeammateIdleHookMessage(result.blockingError),
            isMeta: true,
          })
          // teammateBlockingErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
          teammateBlockingErrors.push(userMessage)
          // 生成器产出 `userMessage`，把阶段性结果交给上层消费。
          yield userMessage
        }
        // Match Stop hook behavior: allow preventContinuation/stopReason
        // 满足 `result.preventContinuation` 时，stop Hooks执行该分支。
        if (result.preventContinuation) {
          // teammatePreventedContinuation更新为 `true`，确保stopHooks后续读取最新状态。
          teammatePreventedContinuation = true
          // stop Hooks在这里处理 `teammateStopReason =`，完成这一小步状态转换。
          teammateStopReason =
            result.stopReason || 'TeammateIdle hook prevented continuation'
          // 生成器产出 `createAttachmentMessage({`，把阶段性结果交给上层消费。
          yield createAttachmentMessage({
            type: 'hook_stopped_continuation',
            message: teammateStopReason,
            hookName: 'TeammateIdle',
            toolUseID: teammateHookToolUseID,
            hookEvent: 'TeammateIdle',
          })
        }
        // 满足 `toolUseContext.abortController.signal.aborted` 时，stop Hooks执行该分支。
        if (toolUseContext.abortController.signal.aborted) {
          // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
          return { blockingErrors: [], preventContinuation: true }
        }
      }

      // 满足 `teammatePreventedContinuation` 时，stop Hooks执行该分支。
      if (teammatePreventedContinuation) {
        // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
        return { blockingErrors: [], preventContinuation: true }
      }

      // 满足 `teammateBlockingErrors.length > 0` 时，stop Hooks执行该分支。
      if (teammateBlockingErrors.length > 0) {
        // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
        return {
          blockingErrors: teammateBlockingErrors,
          preventContinuation: false,
        }
      }
    }

    // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
    return { blockingErrors: [], preventContinuation: false }
  } catch (error) {
    // durationMs 集合记录时间`Date.now`，供stop Hooks后续处理使用。
    const durationMs = Date.now() - hookStartTime
    // 记录stop Hooks运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_stop_hook_error', {
      duration: durationMs,

      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
    })
    // Yield a system message that is not visible to the model for the user
    // to debug their hook.
    // 生成器产出 `createSystemMessage(`，把阶段性结果交给上层消费。
    yield createSystemMessage(
      `Stop hook failed: ${errorMessage(error)}`,
      'warning',
    )
    // 返回结构化结果，集中表达stop Hooks已经整理出的状态。
    return { blockingErrors: [], preventContinuation: false }
  }
}
