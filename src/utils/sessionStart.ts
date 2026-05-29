// 引入 getMainThreadAgentType，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getMainThreadAgentType } from '../bootstrap/state.js'
// 类型依赖 { HookResultMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { HookResultMessage } from '../types/message.js'
// 引入 createAttachmentMessage，将 ./attachments.js 中已经封装好的能力接到本文件流程里。
import { createAttachmentMessage } from './attachments.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 withDiagnosticsTiming，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { withDiagnosticsTiming } from './diagLogs.js'
// 引入 isBareMode，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isBareMode } from './envUtils.js'
// 引入 updateWatchPaths，将 ./hooks/fileChangedWatcher.js 中已经封装好的能力接到本文件流程里。
import { updateWatchPaths } from './hooks/fileChangedWatcher.js'
// 引入 shouldAllowManagedHooksOnly，将 ./hooks/hooksConfigSnapshot.js 中已经封装好的能力接到本文件流程里。
import { shouldAllowManagedHooksOnly } from './hooks/hooksConfigSnapshot.js'
// 引入 executeSessionStartHooks、executeSetupHooks，将 ./hooks.js 中已经封装好的能力接到本文件流程里。
import { executeSessionStartHooks, executeSetupHooks } from './hooks.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 loadPluginHooks，将 ./plugins/loadPluginHooks.js 中已经封装好的能力接到本文件流程里。
import { loadPluginHooks } from './plugins/loadPluginHooks.js'

// SessionStartHooksOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionStartHooksOptions = {
  sessionId?: string
  agentType?: string
  model?: string
  forceSyncExecution?: boolean
}

// Set by processSessionStartHooks when a hook emits initialUserMessage;
// consumed once by takeInitialUserMessage. This side channel avoids changing
// the Promise<HookResultMessage[]> return type that main.tsx and print.ts
// both already await on (sessionStartHooksPromise is kicked in main.tsx and
// joined later — rippling a structural return-type change through that
// handoff would touch five callsites for what is a print-mode-only value).
// pendingInitialUserMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
let pendingInitialUserMessage: string | undefined

// takeInitialUserMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function takeInitialUserMessage(): string | undefined {
  // v保存`pendingInitialUserMessage`，供共享工具 session Start后续判断或输出使用。
  const v = pendingInitialUserMessage
  // pendingInitialUserMessage 消息数据更新为 `undefined`，确保共享工具后续读取最新状态。
  pendingInitialUserMessage = undefined
  // 返回 `v`，作为共享工具这次计算的结果。
  return v
}

// Note to CLAUDE: do not add ANY "warmup" logic. It is **CRITICAL** that you do not add extra work on startup.
// processSessionStartHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processSessionStartHooks(
  source: 'startup' | 'resume' | 'clear' | 'compact',
  {
    sessionId,
    agentType,
    model,
    forceSyncExecution,
  }: SessionStartHooksOptions = {},
): Promise<HookResultMessage[]> {
  // --bare skips all hooks. executeHooks already early-returns under --bare
  // (hooks.ts:1861), but this skips the loadPluginHooks() await below too —
  // no point loading plugin hooks that'll never run.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // hookMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const hookMessages: HookResultMessage[] = []
  // additionalContexts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const additionalContexts: string[] = []
  // allWatchPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allWatchPaths: string[] = []

  // Skip loading plugin hooks if restricted to managed hooks only
  // Plugin hooks are untrusted external code that should be blocked by policy
  // 满足 `shouldAllowManagedHooksOnly()` 时，共享工具执行该分支。
  if (shouldAllowManagedHooksOnly()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Skipping plugin hooks - allowManagedHooksOnly is enabled')
  } else {
    // Ensure plugin hooks are loaded before executing SessionStart hooks.
    // loadPluginHooks() may be called early during startup (fire-and-forget, non-blocking)
    // to pre-load hooks, but we must guarantee hooks are registered before executing them.
    // This function is memoized, so if hooks are already loaded, this returns immediately
    // with negligible overhead (just a cache lookup).
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 这个回调绑定到 await withDiagnosticsTiming('load_plugin_hooks', () => loadPluginHooks())，负责共享工具在该局部场景下的响应。
      await withDiagnosticsTiming('load_plugin_hooks', () => loadPluginHooks())
    } catch (error) {
      // Log error but don't crash - continue with session start without plugin hooks
      /* eslint-disable no-restricted-syntax -- both branches wrap with context, not a toError case */
      // enhancedError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const enhancedError =
        error instanceof Error
          ? new Error(
              `Failed to load plugin hooks during ${source}: ${error.message}`,
            )
          : new Error(
              `Failed to load plugin hooks during ${source}: ${String(error)}`,
            )
      /* eslint-enable no-restricted-syntax */

      // 只有 `error instanceof Error && error.stack` 满足时，共享工具才执行该分支。
      if (error instanceof Error && error.stack) {
        // stack更新为 `error.stack`，确保共享工具后续读取最新状态。
        enhancedError.stack = error.stack
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(enhancedError)

      // Provide specific guidance based on error type
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // userGuidance固定为 `''`，作为共享工具 session Start后续展示或比较的基准。
      let userGuidance = ''

      // 共享工具在这里按实际状态进入对应分支。
      if (
        errorMessage.includes('Failed to clone') ||
        errorMessage.includes('network') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ENOTFOUND')
      ) {
        // 共享工具 session Start在这里处理 `userGuidance =`，完成这一小步状态转换。
        userGuidance =
          'This appears to be a network issue. Check your internet connection and try again.'
      // 共享工具 session Start在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        errorMessage.includes('Permission denied') ||
        errorMessage.includes('EACCES') ||
        errorMessage.includes('EPERM')
      ) {
        // 共享工具 session Start在这里处理 `userGuidance =`，完成这一小步状态转换。
        userGuidance =
          'This appears to be a permissions issue. Check file permissions on ~/.claude/plugins/'
      // 共享工具 session Start在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('parse') ||
        errorMessage.includes('JSON') ||
        errorMessage.includes('schema')
      ) {
        // 共享工具 session Start在这里处理 `userGuidance =`，完成这一小步状态转换。
        userGuidance =
          'This appears to be a configuration issue. Check your plugin settings in .claude/settings.json'
      } else {
        // 共享工具 session Start在这里处理 `userGuidance =`，完成这一小步状态转换。
        userGuidance =
          'Please fix the plugin configuration or remove problematic plugins from your settings.'
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Warning: Failed to load plugin hooks. SessionStart hooks from plugins will not execute. ` +
          `Error: ${errorMessage}. ${userGuidance}`,
        { level: 'warn' },
      )

      // Continue execution - plugin hooks won't be available, but project-level hooks
      // from .claude/settings.json (loaded via captureHooksConfigSnapshot) will still work
    }
  }

  // Execute SessionStart hooks, ignoring blocking errors
  // Use the provided agentType or fall back to the one stored in bootstrap state
  // resolvedAgentType读取`getMainThreadAgentType`，供共享工具后续处理使用。
  const resolvedAgentType = agentType ?? getMainThreadAgentType()
  // 逐项读取 `executeSessionStartHooks(` 中的hookResult，按输入顺序推进共享工具 session Start。
  for await (const hookResult of executeSessionStartHooks(
    source,
    sessionId,
    resolvedAgentType,
    model,
    undefined,
    undefined,
    forceSyncExecution,
  )) {
    // 满足 `hookResult.message` 时，共享工具执行该分支。
    if (hookResult.message) {
      // hookMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      hookMessages.push(hookResult.message)
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      hookResult.additionalContexts &&
      hookResult.additionalContexts.length > 0
    ) {
      // additionalContexts 集合追加新条目，保持收集顺序与输入顺序一致。
      additionalContexts.push(...hookResult.additionalContexts)
    }
    // 满足 `hookResult.initialUserMessage` 时，共享工具执行该分支。
    if (hookResult.initialUserMessage) {
      // pendingInitialUserMessage 消息数据更新为 `hookResult.initialUserMessage`，确保共享工具后续读取最新状态。
      pendingInitialUserMessage = hookResult.initialUserMessage
    }
    // 只有 `hookResult.watchPaths && hookResult.watchPaths.le` 满足时，共享工具才执行该分支。
    if (hookResult.watchPaths && hookResult.watchPaths.length > 0) {
      // allWatchPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
      allWatchPaths.push(...hookResult.watchPaths)
    }
  }

  // 满足 `allWatchPaths.length > 0` 时，共享工具执行该分支。
  if (allWatchPaths.length > 0) {
    // 调用 updateWatchPaths，触发共享工具此处需要的副作用。
    updateWatchPaths(allWatchPaths)
  }

  // If hooks provided additional context, add it as a message
  // 满足 `additionalContexts.length > 0` 时，共享工具执行该分支。
  if (additionalContexts.length > 0) {
    // contextMessage 消息数据构建`createAttachmentMessage`，供共享工具后续处理使用。
    const contextMessage = createAttachmentMessage({
      type: 'hook_additional_context',
      content: additionalContexts,
      hookName: 'SessionStart',
      toolUseID: 'SessionStart',
      hookEvent: 'SessionStart',
    })
    // hookMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    hookMessages.push(contextMessage)
  }

  // 返回 `hookMessages`，作为共享工具这次计算的结果。
  return hookMessages
}

// processSetupHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processSetupHooks(
  trigger: 'init' | 'maintenance',
  { forceSyncExecution }: { forceSyncExecution?: boolean } = {},
): Promise<HookResultMessage[]> {
  // Same rationale as processSessionStartHooks above.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // hookMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const hookMessages: HookResultMessage[] = []
  // additionalContexts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const additionalContexts: string[] = []

  // 满足 `shouldAllowManagedHooksOnly()` 时，共享工具执行该分支。
  if (shouldAllowManagedHooksOnly()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Skipping plugin hooks - allowManagedHooksOnly is enabled')
  } else {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `loadPluginHooks()` 完成，再继续共享工具 session Start的异步流程。
      await loadPluginHooks()
    } catch (error) {
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Warning: Failed to load plugin hooks. Setup hooks from plugins will not execute. Error: ${errorMessage}`,
        { level: 'warn' },
      )
    }
  }

  // 逐项读取 `executeSetupHooks(` 中的hookResult，按输入顺序推进共享工具 session Start。
  for await (const hookResult of executeSetupHooks(
    trigger,
    undefined,
    undefined,
    forceSyncExecution,
  )) {
    // 满足 `hookResult.message` 时，共享工具执行该分支。
    if (hookResult.message) {
      // hookMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      hookMessages.push(hookResult.message)
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      hookResult.additionalContexts &&
      hookResult.additionalContexts.length > 0
    ) {
      // additionalContexts 集合追加新条目，保持收集顺序与输入顺序一致。
      additionalContexts.push(...hookResult.additionalContexts)
    }
  }

  // 满足 `additionalContexts.length > 0` 时，共享工具执行该分支。
  if (additionalContexts.length > 0) {
    // contextMessage 消息数据构建`createAttachmentMessage`，供共享工具后续处理使用。
    const contextMessage = createAttachmentMessage({
      type: 'hook_additional_context',
      content: additionalContexts,
      hookName: 'Setup',
      toolUseID: 'Setup',
      hookEvent: 'Setup',
    })
    // hookMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    hookMessages.push(contextMessage)
  }

  // 返回 `hookMessages`，作为共享工具这次计算的结果。
  return hookMessages
}
