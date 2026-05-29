// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 引入 markPostCompaction，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { markPostCompaction } from 'src/bootstrap/state.js'
// 引入 getSystemPrompt，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../../constants/prompts.js'
// 引入 getSystemContext、getUserContext，将 ../../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from '../../context.js'
// 引入 getShortcutDisplay，将 ../../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../../keybindings/shortcutFormat.js'
// 接入 notifyCompaction 服务层能力，把外部通信或共享状态交给 ../../services/api/promptCacheBreakDetection.js 处理。
import { notifyCompaction } from '../../services/api/promptCacheBreakDetection.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type CompactionResult,
  compactConversation,
  ERROR_MESSAGE_INCOMPLETE_RESPONSE,
  ERROR_MESSAGE_NOT_ENOUGH_MESSAGES,
  ERROR_MESSAGE_USER_ABORT,
  mergeHookInstructions,
} from '../../services/compact/compact.js'
// 接入 suppressCompactWarning 服务层能力，把外部通信或共享状态交给 ../../services/compact/compactWarningState.js 处理。
import { suppressCompactWarning } from '../../services/compact/compactWarningState.js'
// 接入 microcompactMessages 服务层能力，把外部通信或共享状态交给 ../../services/compact/microCompact.js 处理。
import { microcompactMessages } from '../../services/compact/microCompact.js'
// 接入 runPostCompactCleanup 服务层能力，把外部通信或共享状态交给 ../../services/compact/postCompactCleanup.js 处理。
import { runPostCompactCleanup } from '../../services/compact/postCompactCleanup.js'
// 接入 trySessionMemoryCompaction 服务层能力，把外部通信或共享状态交给 ../../services/compact/sessionMemoryCompact.js 处理。
import { trySessionMemoryCompaction } from '../../services/compact/sessionMemoryCompact.js'
// 接入 setLastSummarizedMessageId 服务层能力，把外部通信或共享状态交给 ../../services/SessionMemory/sessionMemoryUtils.js 处理。
import { setLastSummarizedMessageId } from '../../services/SessionMemory/sessionMemoryUtils.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js'
// 复用 hasExactErrorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { hasExactErrorMessage } from '../../utils/errors.js'
// 复用 executePreCompactHooks 工具函数，把通用处理留在 ../../utils/hooks.js 中维护。
import { executePreCompactHooks } from '../../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getMessagesAfterCompactBoundary 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { getMessagesAfterCompactBoundary } from '../../utils/messages.js'
// 复用 getUpgradeMessage 工具函数，把通用处理留在 ../../utils/model/contextWindowUpgradeCheck.js 中维护。
import { getUpgradeMessage } from '../../utils/model/contextWindowUpgradeCheck.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  buildEffectiveSystemPrompt,
  type SystemPrompt,
} from '../../utils/systemPrompt.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// reactiveCompact保存`feature`，供命令处理后续处理使用。
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? (require('../../services/compact/reactiveCompact.js') as typeof import('../../services/compact/reactiveCompact.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// 这个回调绑定到 export const call: LocalCommandCall = async (args, context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async (args, context) => {
  // 从 `context` 解构 abortController，减少斜杠命令 compact对同一对象的重复访问。
  const { abortController } = context
  // 从 `context` 解构 messages，减少斜杠命令 compact对同一对象的重复访问。
  let { messages } = context

  // REPL keeps snipped messages for UI scrollback — project so the compact
  // model doesn't summarize content that was intentionally removed.
  // 对话消息更新为 `getMessagesAfterCompactBoundary(messages)`，确保斜杠命令后续读取最新状态。
  messages = getMessagesAfterCompactBoundary(messages)

  // 对话消息为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (messages.length === 0) {
    // 抛出 new Error('No messages to compact')，阻止命令处理在无效状态下继续运行。
    throw new Error('No messages to compact')
  }

  // customInstructions 集合格式化`args.trim`，供命令处理后续处理使用。
  const customInstructions = args.trim()

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // Try session memory compaction first if no custom instructions
    // (session memory compaction doesn't support custom instructions)
    // customInstructions 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!customInstructions) {
      // sessionMemoryResult 会话数据保存`trySessionMemoryCompaction`，供命令处理后续处理使用。
      const sessionMemoryResult = await trySessionMemoryCompaction(
        messages,
        context.agentId,
      )
      // 满足 `sessionMemoryResult` 时，命令处理执行该分支。
      if (sessionMemoryResult) {
        // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
        getUserContext.cache.clear?.()
        // 调用 runPostCompactCleanup，触发命令处理此处需要的副作用。
        runPostCompactCleanup()
        // Reset cache read baseline so the post-compact drop isn't flagged
        // as a break. compactConversation does this internally; SM-compact doesn't.
        // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，命令处理执行该分支。
        if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
          // 调用 notifyCompaction，触发命令处理此处需要的副作用。
          notifyCompaction(
            context.options.querySource ?? 'compact',
            context.agentId,
          )
        }
        // 调用 markPostCompaction，触发命令处理此处需要的副作用。
        markPostCompaction()
        // Suppress warning immediately after successful compaction
        // 调用 suppressCompactWarning，触发命令处理此处需要的副作用。
        suppressCompactWarning()

        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'compact',
          compactionResult: sessionMemoryResult,
          displayText: buildDisplayText(context),
        }
      }
    }

    // Reactive-only mode: route /compact through the reactive path.
    // Checked after session-memory (that path is cheap and orthogonal).
    // 满足 `reactiveCompact?.isReactiveOnlyMode()` 时，命令处理执行该分支。
    if (reactiveCompact?.isReactiveOnlyMode()) {
      // 等待并返回 `compactViaReactive(`，调用方直接接收异步结果。
      return await compactViaReactive(
        messages,
        context,
        customInstructions,
        reactiveCompact,
      )
    }

    // Fall back to traditional compaction
    // Run microcompact first to reduce tokens before summarization
    // microcompactResult保存`microcompactMessages`，供命令处理后续处理使用。
    const microcompactResult = await microcompactMessages(messages, context)
    // messagesForCompact 消息数据 命名 `microcompactResult.messages`，让后续代码直接表达这个值的用途。
    const messagesForCompact = microcompactResult.messages

    // 结果保存`compactConversation`，供命令处理后续处理使用。
    const result = await compactConversation(
      messagesForCompact,
      context,
      await getCacheSharingParams(context, messagesForCompact),
      false,
      customInstructions,
      false,
    )

    // Reset lastSummarizedMessageId since legacy compaction replaces all messages
    // and the old message UUID will no longer exist in the new messages array
    // setLastSummarizedMessageId 写入新的状态值，使命令处理后续读取保持一致。
    setLastSummarizedMessageId(undefined)

    // Suppress the "Context left until auto-compact" warning after successful compaction
    // 调用 suppressCompactWarning，触发命令处理此处需要的副作用。
    suppressCompactWarning()

    // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
    getUserContext.cache.clear?.()
    // 调用 runPostCompactCleanup，触发命令处理此处需要的副作用。
    runPostCompactCleanup()

    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'compact',
      compactionResult: result,
      displayText: buildDisplayText(context, result.userDisplayMessage),
    }
  } catch (error) {
    // 满足 `abortController.signal.aborted` 时，命令处理执行该分支。
    if (abortController.signal.aborted) {
      // 抛出 new Error('Compaction canceled.')，阻止命令处理在无效状态下继续运行。
      throw new Error('Compaction canceled.')
    // 斜杠命令 compact在这里处理 `} else if (hasExactErrorMessage(error, ERROR_MESSAGE_NOT_ENOUGH_MESSAGE...`，完成这一小步状态转换。
    } else if (hasExactErrorMessage(error, ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)) {
      // 抛出 new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)，阻止命令处理在无效状态下继续运行。
      throw new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)
    // 斜杠命令 compact在这里处理 `} else if (hasExactErrorMessage(error, ERROR_MESSAGE_INCOMPLETE_RESPONS...`，完成这一小步状态转换。
    } else if (hasExactErrorMessage(error, ERROR_MESSAGE_INCOMPLETE_RESPONSE)) {
      // 抛出 new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)，阻止命令处理在无效状态下继续运行。
      throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)
    } else {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 new Error(`Error during compaction: ${error}`)，阻止命令处理在无效状态下继续运行。
      throw new Error(`Error during compaction: ${error}`)
    }
  }
}

// compactViaReactive 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function compactViaReactive(
  messages: Message[],
  context: ToolUseContext,
  customInstructions: string,
  reactive: NonNullable<typeof reactiveCompact>,
): Promise<{
  type: 'compact'
  compactionResult: CompactionResult
  displayText: string
}> {
  // 调用 context.onCompactProgress?.({，完成这一处局部操作。
  context.onCompactProgress?.({
    type: 'hooks_start',
    hookType: 'pre_compact',
  })
  // 调用 context.setSDKStatus?.('compacting')，完成这一处局部操作。
  context.setSDKStatus?.('compacting')

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // Hooks and cache-param build are independent — run concurrently.
    // getCacheSharingParams walks all tools to build the system prompt;
    // pre-compact hooks spawn subprocesses. Neither depends on the other.
    // 并行获取 hookResult、cacheSafeParams，缩短斜杠命令 compact等待多个独立异步任务的时间。
    const [hookResult, cacheSafeParams] = await Promise.all([
      executePreCompactHooks(
        { trigger: 'manual', customInstructions: customInstructions || null },
        context.abortController.signal,
      ),
      getCacheSharingParams(context, messages),
    ])
    // mergedInstructions 集合保存`mergeHookInstructions`，供命令处理后续处理使用。
    const mergedInstructions = mergeHookInstructions(
      customInstructions,
      hookResult.newCustomInstructions,
    )

    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责命令处理在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_start' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_start' })

    // outcome保存`reactive.reactiveCompactOnPromptTooLong`，供命令处理后续处理使用。
    const outcome = await reactive.reactiveCompactOnPromptTooLong(
      messages,
      cacheSafeParams,
      { customInstructions: mergedInstructions, trigger: 'manual' },
    )

    // outcome.ok缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!outcome.ok) {
      // The outer catch in `call` translates these: aborted → "Compaction
      // canceled." (via abortController.signal.aborted check), NOT_ENOUGH →
      // re-thrown as-is, everything else → "Error during compaction: …".
      // 按照 outcome.reason 的取值选择命令处理的具体处理分支。
      switch (outcome.reason) {
        case 'too_few_groups':
          // 抛出 new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)，阻止命令处理在无效状态下继续运行。
          throw new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)
        case 'aborted':
          // 抛出 new Error(ERROR_MESSAGE_USER_ABORT)，阻止命令处理在无效状态下继续运行。
          throw new Error(ERROR_MESSAGE_USER_ABORT)
        case 'exhausted':
        case 'error':
        case 'media_unstrippable':
          // 抛出 new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)，阻止命令处理在无效状态下继续运行。
          throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)
      }
    }

    // Mirrors the post-success cleanup in tryReactiveCompact, minus
    // resetMicrocompactState — processSlashCommand calls that for all
    // type:'compact' results.
    // setLastSummarizedMessageId 写入新的状态值，使命令处理后续读取保持一致。
    setLastSummarizedMessageId(undefined)
    // 调用 runPostCompactCleanup，触发命令处理此处需要的副作用。
    runPostCompactCleanup()
    // 调用 suppressCompactWarning，触发命令处理此处需要的副作用。
    suppressCompactWarning()
    // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
    getUserContext.cache.clear?.()

    // reactiveCompactOnPromptTooLong runs PostCompact hooks but not PreCompact
    // — both callers (here and tryReactiveCompact) run PreCompact outside so
    // they can merge its userDisplayMessage with PostCompact's here. This
    // caller additionally runs it concurrently with getCacheSharingParams.
    // combinedMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const combinedMessage =
      [hookResult.userDisplayMessage, outcome.result.userDisplayMessage]
        .filter(Boolean)
        .join('\n') || undefined

    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'compact',
      compactionResult: {
        ...outcome.result,
        userDisplayMessage: combinedMessage,
      },
      displayText: buildDisplayText(context, combinedMessage),
    }
  } finally {
    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责命令处理在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_end' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_end' })
    // 调用 context.setSDKStatus?.(null)，完成这一处局部操作。
    context.setSDKStatus?.(null)
  }
}

// buildDisplayText 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildDisplayText(
  context: ToolUseContext,
  userDisplayMessage?: string,
): string {
  // upgradeMessage 消息数据读取`getUpgradeMessage`，供命令处理后续处理使用。
  const upgradeMessage = getUpgradeMessage('tip')
  // expandShortcut读取`getShortcutDisplay`，供命令处理后续处理使用。
  const expandShortcut = getShortcutDisplay(
    'app:toggleTranscript',
    'Global',
    'ctrl+o',
  )
  // dimmed 聚合成有序列表，保持后续遍历顺序稳定。
  const dimmed = [
    ...(context.options.verbose
      ? []
      : [`(${expandShortcut} to see full summary)`]),
    ...(userDisplayMessage ? [userDisplayMessage] : []),
    ...(upgradeMessage ? [upgradeMessage] : []),
  ]
  // 返回 `chalk.dim('Compacted ' + dimmed.join('\n'))`，作为命令处理这次计算的结果。
  return chalk.dim('Compacted ' + dimmed.join('\n'))
}

// getCacheSharingParams 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCacheSharingParams(
  context: ToolUseContext,
  forkContextMessages: Message[],
): Promise<{
  systemPrompt: SystemPrompt
  userContext: { [k: string]: string }
  systemContext: { [k: string]: string }
  toolUseContext: ToolUseContext
  forkContextMessages: Message[]
}> {
  // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
  const appState = context.getAppState()
  // defaultSysPrompt读取`getSystemPrompt`，供命令处理后续处理使用。
  const defaultSysPrompt = await getSystemPrompt(
    context.options.tools,
    context.options.mainLoopModel,
    Array.from(
      appState.toolPermissionContext.additionalWorkingDirectories.keys(),
    ),
    context.options.mcpClients,
  )
  // 系统提示词构建`buildEffectiveSystemPrompt`，供命令处理后续处理使用。
  const systemPrompt = buildEffectiveSystemPrompt({
    mainThreadAgentDefinition: undefined,
    toolUseContext: context,
    customSystemPrompt: context.options.customSystemPrompt,
    defaultSystemPrompt: defaultSysPrompt,
    appendSystemPrompt: context.options.appendSystemPrompt,
  })
  // 并行获取 userContext、systemContext，缩短斜杠命令 compact等待多个独立异步任务的时间。
  const [userContext, systemContext] = await Promise.all([
    getUserContext(),
    getSystemContext(),
  ])
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext: context,
    forkContextMessages,
  }
}
