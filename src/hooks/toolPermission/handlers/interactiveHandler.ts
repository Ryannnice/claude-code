// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准React hook 状态流的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 getAllowedChannels，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAllowedChannels } from '../../../bootstrap/state.js'
// 类型依赖 { BridgePermissionCallbacks } 来自 ../../../bridge/bridgePermissionCallbacks.js，用于校准React hook 状态流的数据契约。
import type { BridgePermissionCallbacks } from '../../../bridge/bridgePermissionCallbacks.js'
// 复用 getTerminalFocused 终端界面组件，避免在这里重复拼装显示逻辑。
import { getTerminalFocused } from '../../../ink/terminal-focus-state.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  CHANNEL_PERMISSION_REQUEST_METHOD,
  type ChannelPermissionRequestParams,
  findChannelEntry,
} from '../../../services/mcp/channelNotification.js'
// 类型依赖 { ChannelPermissionCallbacks } 来自 ../../../services/mcp/channelPermissions.js，用于校准React hook 状态流的数据契约。
import type { ChannelPermissionCallbacks } from '../../../services/mcp/channelPermissions.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  filterPermissionRelayClients,
  shortRequestId,
  truncateForPreview,
} from '../../../services/mcp/channelPermissions.js'
// 接入 executeAsyncClassifierCheck 工具实现，后续工具池会按权限和开关决定是否暴露。
import { executeAsyncClassifierCheck } from '../../../tools/BashTool/bashPermissions.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../../tools/BashTool/toolName.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  clearClassifierChecking,
  setClassifierApproval,
  setClassifierChecking,
  setYoloClassifierApproval,
} from '../../../utils/classifierApprovals.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../../utils/errors.js 中维护。
import { errorMessage } from '../../../utils/errors.js'
// 类型依赖 { PermissionDecision } 来自 ../../../utils/permissions/PermissionResult.js，用于校准React hook 状态流的数据契约。
import type { PermissionDecision } from '../../../utils/permissions/PermissionResult.js'
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准React hook 状态流的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js'
// 复用 hasPermissionsToUseTool 工具函数，把通用处理留在 ../../../utils/permissions/permissions.js 中维护。
import { hasPermissionsToUseTool } from '../../../utils/permissions/permissions.js'
// 类型依赖 { PermissionContext } 来自 ../PermissionContext.js，用于校准React hook 状态流的数据契约。
import type { PermissionContext } from '../PermissionContext.js'
// 引入 createResolveOnce，将 ../PermissionContext.js 中已经封装好的能力接到本文件流程里。
import { createResolveOnce } from '../PermissionContext.js'

// InteractivePermissionParams 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type InteractivePermissionParams = {
  ctx: PermissionContext
  description: string
  result: PermissionDecision & { behavior: 'ask' }
  awaitAutomatedChecksBeforeDialog: boolean | undefined
  bridgeCallbacks?: BridgePermissionCallbacks
  channelCallbacks?: ChannelPermissionCallbacks
}

/**
 * Handles the interactive (main-agent) permission flow.
 *
 * Pushes a ToolUseConfirm entry to the confirm queue with callbacks:
 * onAbort, onAllow, onReject, recheckPermission, onUserInteraction.
 *
 * Runs permission hooks and bash classifier checks asynchronously in the
 * background, racing them against user interaction. Uses a resolve-once
 * guard and `userInteracted` flag to prevent multiple resolutions.
 *
 * This function does NOT return a Promise -- it sets up callbacks that
 * eventually call `resolve()` to resolve the outer promise owned by
 * the caller.
 */
// handleInteractivePermission 封装interactiveHandler的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleInteractivePermission(
  params: InteractivePermissionParams,
  // 这个回调绑定到 resolve: (decision: PermissionDecision) => void,，负责React hook 状态流在该局部场景下的响应。
  resolve: (decision: PermissionDecision) => void,
): void {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ctx,
    description,
    result,
    awaitAutomatedChecksBeforeDialog,
    bridgeCallbacks,
    channelCallbacks,
  } = params

  // 从 `createResolveOnce(resolve)` 解构 resolve、isResolved、claim，减少React hook interactive Handler对同一对象的重复访问。
  const { resolve: resolveOnce, isResolved, claim } = createResolveOnce(resolve)
  // userInteracted标记React hook interactiv...是否启用对应路径。
  let userInteracted = false
  // checkmarkTransitionTimer 先占位，稍后的条件分支会根据实际输入补齐它。
  let checkmarkTransitionTimer: ReturnType<typeof setTimeout> | undefined
  // Hoisted so onDismissCheckmark (Esc during checkmark window) can also
  // remove the abort listener — not just the timer callback.
  // 这个回调绑定到 let checkmarkAbortHandler: (() => void) | undefined，负责React hook 状态流在该局部场景下的响应。
  let checkmarkAbortHandler: (() => void) | undefined
  // bridgeRequestId 请求数据保存`randomUUID`，供React hook后续处理使用。
  const bridgeRequestId = bridgeCallbacks ? randomUUID() : undefined
  // Hoisted so local/hook/classifier wins can remove the pending channel
  // entry. No "tell remote to dismiss" equivalent — the text sits in your
  // phone, and a stale "yes abc123" after local-resolve falls through
  // tryConsumeReply (entry gone) and gets enqueued as normal chat.
  // 这个回调绑定到 let channelUnsubscribe: (() => void) | undefined，负责React hook 状态流在该局部场景下的响应。
  let channelUnsubscribe: (() => void) | undefined

  // permissionPromptStartTimeMs 权限数据记录时间`Date.now`，供React hook后续处理使用。
  const permissionPromptStartTimeMs = Date.now()
  // displayInput保存`result.updatedInput ?? ctx.input`，供后续判断或组装使用。
  const displayInput = result.updatedInput ?? ctx.input

  // clearClassifierIndicator 封装interactiveHandler的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function clearClassifierIndicator(): void {
    // 满足 `feature('BASH_CLASSIFIER')` 时，React hook执行该分支。
    if (feature('BASH_CLASSIFIER')) {
      // 调用 ctx.updateQueueItem，触发React hook此处需要的副作用。
      ctx.updateQueueItem({ classifierCheckInProgress: false })
    }
  }

  // 调用 ctx.pushToQueue，触发React hook此处需要的副作用。
  ctx.pushToQueue({
    assistantMessage: ctx.assistantMessage,
    tool: ctx.tool,
    description,
    input: displayInput,
    toolUseContext: ctx.toolUseContext,
    toolUseID: ctx.toolUseID,
    permissionResult: result,
    permissionPromptStartTimeMs,
    ...(feature('BASH_CLASSIFIER')
      ? {
          classifierCheckInProgress:
            !!result.pendingClassifierCheck &&
            !awaitAutomatedChecksBeforeDialog,
        }
      : {}),
    // onUserInteraction 使用 无 完成React hook 状态流里的对应操作。
    onUserInteraction() {
      // Called when user starts interacting with the permission dialog
      // (e.g., arrow keys, tab, typing feedback)
      // Hide the classifier indicator since auto-approve is no longer possible
      //
      // Grace period: ignore interactions in the first 200ms to prevent
      // accidental keypresses from canceling the classifier prematurely
      // GRACE_PERIOD_MS 集合 命名 `200`，让后续代码直接表达这个值的用途。
      const GRACE_PERIOD_MS = 200
      // 满足 `Date.now() - permissionPromptStartTimeMs < GRACE_PERIOD_MS` 时，React hook执行该分支。
      if (Date.now() - permissionPromptStartTimeMs < GRACE_PERIOD_MS) {
        // React hook interactive Handler在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // userInteracted更新为 `true`，确保interactiveHandler后续读取最新状态。
      userInteracted = true
      // 调用 clearClassifierChecking，触发React hook此处需要的副作用。
      clearClassifierChecking(ctx.toolUseID)
      // 调用 clearClassifierIndicator，触发React hook此处需要的副作用。
      clearClassifierIndicator()
    },
    // onDismissCheckmark 使用 无 完成React hook 状态流里的对应操作。
    onDismissCheckmark() {
      // 满足 `checkmarkTransitionTimer` 时，React hook执行该分支。
      if (checkmarkTransitionTimer) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(checkmarkTransitionTimer)
        // checkmarkTransitionTimer更新为 `undefined`，确保interactiveHandler后续读取最新状态。
        checkmarkTransitionTimer = undefined
        // 满足 `checkmarkAbortHandler` 时，React hook执行该分支。
        if (checkmarkAbortHandler) {
          // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
          ctx.toolUseContext.abortController.signal.removeEventListener(
            'abort',
            checkmarkAbortHandler,
          )
          // checkmarkAbortHandler更新为 `undefined`，确保interactiveHandler后续读取最新状态。
          checkmarkAbortHandler = undefined
        }
        // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
        ctx.removeFromQueue()
      }
    },
    // onAbort 使用 无 完成React hook 状态流里的对应操作。
    onAbort() {
      // 满足 `!claim()` 时，React hook执行该分支。
      if (!claim()) return
      // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
      if (bridgeCallbacks && bridgeRequestId) {
        // 调用 bridgeCallbacks.sendResponse，触发React hook此处需要的副作用。
        bridgeCallbacks.sendResponse(bridgeRequestId, {
          behavior: 'deny',
          message: 'User aborted',
        })
        // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
        bridgeCallbacks.cancelRequest(bridgeRequestId)
      }
      // 调用 channelUnsubscribe?.()，完成这一处局部操作。
      channelUnsubscribe?.()
      // 调用 ctx.logCancelled，触发React hook此处需要的副作用。
      ctx.logCancelled()
      // 调用 ctx.logDecision，触发React hook此处需要的副作用。
      ctx.logDecision(
        { decision: 'reject', source: { type: 'user_abort' } },
        { permissionPromptStartTimeMs },
      )
      // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolveOnce(ctx.cancelAndAbort(undefined, true))
    },
    // React hook interactive Handler在这里处理 `async onAllow(`，完成这一小步状态转换。
    async onAllow(
      updatedInput,
      permissionUpdates: PermissionUpdate[],
      feedback?: string,
      contentBlocks?: ContentBlockParam[],
    ) {
      // 满足 `!claim()` 时，React hook执行该分支。
      if (!claim()) return // atomic check-and-mark before await

      // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
      if (bridgeCallbacks && bridgeRequestId) {
        // 调用 bridgeCallbacks.sendResponse，触发React hook此处需要的副作用。
        bridgeCallbacks.sendResponse(bridgeRequestId, {
          behavior: 'allow',
          updatedInput,
          updatedPermissions: permissionUpdates,
        })
        // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
        bridgeCallbacks.cancelRequest(bridgeRequestId)
      }
      // 调用 channelUnsubscribe?.()，完成这一处局部操作。
      channelUnsubscribe?.()

      // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolveOnce(
        await ctx.handleUserAllow(
          updatedInput,
          permissionUpdates,
          feedback,
          permissionPromptStartTimeMs,
          contentBlocks,
          result.decisionReason,
        ),
      )
    },
    // onReject 使用 feedback?: string, contentBlocks?: ContentBlockPa… 完成React hook 状态流里的对应操作。
    onReject(feedback?: string, contentBlocks?: ContentBlockParam[]) {
      // 满足 `!claim()` 时，React hook执行该分支。
      if (!claim()) return

      // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
      if (bridgeCallbacks && bridgeRequestId) {
        // 调用 bridgeCallbacks.sendResponse，触发React hook此处需要的副作用。
        bridgeCallbacks.sendResponse(bridgeRequestId, {
          behavior: 'deny',
          message: feedback ?? 'User denied permission',
        })
        // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
        bridgeCallbacks.cancelRequest(bridgeRequestId)
      }
      // 调用 channelUnsubscribe?.()，完成这一处局部操作。
      channelUnsubscribe?.()

      // 调用 ctx.logDecision，触发React hook此处需要的副作用。
      ctx.logDecision(
        {
          decision: 'reject',
          source: { type: 'user_reject', hasFeedback: !!feedback },
        },
        { permissionPromptStartTimeMs },
      )
      // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolveOnce(ctx.cancelAndAbort(feedback, undefined, contentBlocks))
    },
    // recheckPermission 使用 无 完成React hook 状态流里的对应操作。
    async recheckPermission() {
      // 满足 `isResolved()` 时，React hook执行该分支。
      if (isResolved()) return
      // freshResult保存`hasPermissionsToUseTool`，供React hook后续处理使用。
      const freshResult = await hasPermissionsToUseTool(
        ctx.tool,
        ctx.input,
        ctx.toolUseContext,
        ctx.assistantMessage,
        ctx.toolUseID,
      )
      // 当 `freshResult.behavior` 匹配 `'allow'` 时，React hook执行对应分支。
      if (freshResult.behavior === 'allow') {
        // claim() (atomic check-and-mark), not isResolved() — the async
        // hasPermissionsToUseTool call above opens a window where CCR
        // could have responded in flight. Matches onAllow/onReject/hook
        // paths. cancelRequest tells CCR to dismiss its prompt — without
        // it, the web UI shows a stale prompt for a tool that's already
        // executing (particularly visible when recheck is triggered by
        // a CCR-initiated mode switch, the very case this callback exists
        // for after useReplBridge started calling it).
        // 满足 `!claim()` 时，React hook执行该分支。
        if (!claim()) return
        // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
        if (bridgeCallbacks && bridgeRequestId) {
          // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
          bridgeCallbacks.cancelRequest(bridgeRequestId)
        }
        // 调用 channelUnsubscribe?.()，完成这一处局部操作。
        channelUnsubscribe?.()
        // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
        ctx.removeFromQueue()
        // 调用 ctx.logDecision，触发React hook此处需要的副作用。
        ctx.logDecision({ decision: 'accept', source: 'config' })
        // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolveOnce(ctx.buildAllow(freshResult.updatedInput ?? ctx.input))
      }
    },
  })

  // Race 4: Bridge permission response from CCR (claude.ai)
  // When the bridge is connected, send the permission request to CCR and
  // subscribe for a response. Whichever side (CLI or CCR) responds first
  // wins via claim().
  //
  // All tools are forwarded — CCR's generic allow/deny modal handles any
  // tool, and can return `updatedInput` when it has a dedicated renderer
  // (e.g. plan edit). Tools whose local dialog injects fields (ReviewArtifact
  // `selected`, AskUserQuestion `answers`) tolerate the field being missing
  // so generic remote approval degrades gracefully instead of throwing.
  // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
  if (bridgeCallbacks && bridgeRequestId) {
    // 调用 bridgeCallbacks.sendRequest，触发React hook此处需要的副作用。
    bridgeCallbacks.sendRequest(
      bridgeRequestId,
      ctx.tool.name,
      displayInput,
      ctx.toolUseID,
      description,
      result.suggestions,
      result.blockedPath,
    )

    // signal保存`ctx.toolUseContext.abortController.signal`，供后续判断或组装使用。
    const signal = ctx.toolUseContext.abortController.signal
    // unsubscribe保存`bridgeCallbacks.onResponse`，供React hook后续处理使用。
    const unsubscribe = bridgeCallbacks.onResponse(
      bridgeRequestId,
      // 接口响应更新为 `> {`，确保interactiveHandler后续读取最新状态。
      response => {
        // 满足 `!claim()` 时，React hook执行该分支。
        if (!claim()) return // Local user/hook/classifier already responded
        // 调用 signal.removeEventListener，触发React hook此处需要的副作用。
        signal.removeEventListener('abort', unsubscribe)
        // 调用 clearClassifierChecking，触发React hook此处需要的副作用。
        clearClassifierChecking(ctx.toolUseID)
        // 调用 clearClassifierIndicator，触发React hook此处需要的副作用。
        clearClassifierIndicator()
        // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
        ctx.removeFromQueue()
        // 调用 channelUnsubscribe?.()，完成这一处局部操作。
        channelUnsubscribe?.()

        // 当 `response.behavior` 匹配 `'allow'` 时，React hook执行对应分支。
        if (response.behavior === 'allow') {
          // 满足 `response.updatedPermissions?.length` 时，React hook执行该分支。
          if (response.updatedPermissions?.length) {
            // 显式忽略 `ctx.persistPermissions(response.updatedPermissions)` 的返回值，只保留它触发的副作用。
            void ctx.persistPermissions(response.updatedPermissions)
          }
          // 调用 ctx.logDecision，触发React hook此处需要的副作用。
          ctx.logDecision(
            {
              decision: 'accept',
              source: {
                type: 'user',
                permanent: !!response.updatedPermissions?.length,
              },
            },
            { permissionPromptStartTimeMs },
          )
          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(ctx.buildAllow(response.updatedInput ?? displayInput))
        } else {
          // 调用 ctx.logDecision，触发React hook此处需要的副作用。
          ctx.logDecision(
            {
              decision: 'reject',
              source: {
                type: 'user_reject',
                hasFeedback: !!response.message,
              },
            },
            { permissionPromptStartTimeMs },
          )
          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(ctx.cancelAndAbort(response.message))
        }
      },
    )

    // 调用 signal.addEventListener，触发React hook此处需要的副作用。
    signal.addEventListener('abort', unsubscribe, { once: true })
  }

  // Channel permission relay — races alongside the bridge block above. Send a
  // permission prompt to every active channel (Telegram, iMessage, etc.) via
  // its MCP send_message tool, then race the reply against local/bridge/hook/
  // classifier. The inbound "yes abc123" is intercepted in the notification
  // handler (useManageMCPConnections.ts) BEFORE enqueue, so it never reaches
  // Claude as a conversation turn.
  //
  // Unlike the bridge block, this still guards on `requiresUserInteraction` —
  // channel replies are pure yes/no with no `updatedInput` path. In practice
  // the guard is dead code today: all three `requiresUserInteraction` tools
  // (ExitPlanMode, AskUserQuestion, ReviewArtifact) return `isEnabled()===false`
  // when channels are configured, so they never reach this handler.
  //
  // Fire-and-forget send: if callTool fails (channel down, tool missing),
  // the subscription never fires and another racer wins. Graceful degradation
  // — the local dialog is always there as the floor.
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
    channelCallbacks &&
    !ctx.tool.requiresUserInteraction?.()
  ) {
    // channelRequestId 请求数据保存`shortRequestId`，供React hook后续处理使用。
    const channelRequestId = shortRequestId(ctx.toolUseID)
    // allowedChannels 集合读取`getAllowedChannels`，供React hook后续处理使用。
    const allowedChannels = getAllowedChannels()
    // channelClients 集合筛选`filterPermissionRelayClients`，供React hook后续处理使用。
    const channelClients = filterPermissionRelayClients(
      ctx.toolUseContext.getAppState().mcp.clients,
      // 名称更新为 `> findChannelEntry(name, allowedChannels) !== undefined`，确保interactiveHandler后续读取最新状态。
      name => findChannelEntry(name, allowedChannels) !== undefined,
    )

    // 满足 `channelClients.length > 0` 时，React hook执行该分支。
    if (channelClients.length > 0) {
      // Outbound is structured too (Kenneth's symmetry ask) — server owns
      // message formatting for its platform (Telegram markdown, iMessage
      // rich text, Discord embed). CC sends the RAW parts; server composes.
      // The old callTool('send_message', {text,content,message}) triple-key
      // hack is gone — no more guessing which arg name each plugin takes.
      // params 集合 集中保存React hook interactive Handler要一起传递的字段。
      const params: ChannelPermissionRequestParams = {
        request_id: channelRequestId,
        tool_name: ctx.tool.name,
        description,
        input_preview: truncateForPreview(displayInput),
      }

      // 按顺序遍历 `channelClients` 中的API 客户端，逐个交给React hook处理。
      for (const client of channelClients) {
        // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
        if (client.type !== 'connected') continue // refine for TS
        // 显式忽略 `client.client` 的返回值，只保留它触发的副作用。
        void client.client
          .notification({
            method: CHANNEL_PERMISSION_REQUEST_METHOD,
            params,
          })
          // 链式调用 catch，继续加工上一行在React hook 状态流中产生的数据。
          .catch(e => {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Channel permission_request failed for ${client.name}: ${errorMessage(e)}`,
              { level: 'error' },
            )
          })
      }

      // channelSignal保存`ctx.toolUseContext.abortController.signal`，供React hook interactiv...后续判断或输出使用。
      const channelSignal = ctx.toolUseContext.abortController.signal
      // Wrap so BOTH the map delete AND the abort-listener teardown happen
      // at every call site. The 6 channelUnsubscribe?.() sites after local/
      // hook/classifier wins previously only deleted the map entry — the
      // dead closure stayed registered on the session-scoped abort signal
      // until the session ended. Not a functional bug (Map.delete is
      // idempotent), but it held the closure alive.
      // mapUnsub保存`channelCallbacks.onResponse`，供React hook后续处理使用。
      const mapUnsub = channelCallbacks.onResponse(
        channelRequestId,
        // 接口响应更新为 `> {`，确保interactiveHandler后续读取最新状态。
        response => {
          // 满足 `!claim()` 时，React hook执行该分支。
          if (!claim()) return // Another racer won
          // 调用 channelUnsubscribe?.() // both: map delete + listener remove，完成这一处局部操作。
          channelUnsubscribe?.() // both: map delete + listener remove
          // 调用 clearClassifierChecking，触发React hook此处需要的副作用。
          clearClassifierChecking(ctx.toolUseID)
          // 调用 clearClassifierIndicator，触发React hook此处需要的副作用。
          clearClassifierIndicator()
          // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
          ctx.removeFromQueue()
          // Bridge is the other remote — tell it we're done.
          // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
          if (bridgeCallbacks && bridgeRequestId) {
            // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
            bridgeCallbacks.cancelRequest(bridgeRequestId)
          }

          // 当 `response.behavior` 匹配 `'allow'` 时，React hook执行对应分支。
          if (response.behavior === 'allow') {
            // 调用 ctx.logDecision，触发React hook此处需要的副作用。
            ctx.logDecision(
              {
                decision: 'accept',
                source: { type: 'user', permanent: false },
              },
              { permissionPromptStartTimeMs },
            )
            // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolveOnce(ctx.buildAllow(displayInput))
          } else {
            // 调用 ctx.logDecision，触发React hook此处需要的副作用。
            ctx.logDecision(
              {
                decision: 'reject',
                source: { type: 'user_reject', hasFeedback: false },
              },
              { permissionPromptStartTimeMs },
            )
            // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolveOnce(
              ctx.cancelAndAbort(`Denied via channel ${response.fromServer}`),
            )
          }
        },
      )
      // channelUnsubscribe更新为 `() => {`，确保interactiveHandler后续读取最新状态。
      channelUnsubscribe = () => {
        // 调用 mapUnsub，触发React hook此处需要的副作用。
        mapUnsub()
        // 调用 channelSignal.removeEventListener，触发React hook此处需要的副作用。
        channelSignal.removeEventListener('abort', channelUnsubscribe!)
      }

      // 调用 channelSignal.addEventListener，触发React hook此处需要的副作用。
      channelSignal.addEventListener('abort', channelUnsubscribe, {
        once: true,
      })
    }
  }

  // Skip hooks if they were already awaited in the coordinator branch above
  // awaitAutomatedChecksBeforeDialog缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!awaitAutomatedChecksBeforeDialog) {
    // Execute PermissionRequest hooks asynchronously
    // If hook returns a decision before user responds, apply it
    // 调用 void，触发React hook此处需要的副作用。
    void (async () => {
      // 满足 `isResolved()` 时，React hook执行该分支。
      if (isResolved()) return
      // currentAppState 状态读取`toolUseContext.getAppState`，供React hook后续处理使用。
      const currentAppState = ctx.toolUseContext.getAppState()
      // hookDecision保存`ctx.runHooks`，供React hook后续处理使用。
      const hookDecision = await ctx.runHooks(
        currentAppState.toolPermissionContext.mode,
        result.suggestions,
        result.updatedInput,
        permissionPromptStartTimeMs,
      )
      // 组合条件 `!hookDecision || !claim()` 成立时，React hook 状态流才启用这条专门路径。
      if (!hookDecision || !claim()) return
      // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
      if (bridgeCallbacks && bridgeRequestId) {
        // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
        bridgeCallbacks.cancelRequest(bridgeRequestId)
      }
      // 调用 channelUnsubscribe?.()，完成这一处局部操作。
      channelUnsubscribe?.()
      // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
      ctx.removeFromQueue()
      // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolveOnce(hookDecision)
    })()
  }

  // Execute bash classifier check asynchronously (if applicable)
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('BASH_CLASSIFIER') &&
    result.pendingClassifierCheck &&
    ctx.tool.name === BASH_TOOL_NAME &&
    !awaitAutomatedChecksBeforeDialog
  ) {
    // UI indicator for "classifier running" — set here (not in
    // toolExecution.ts) so commands that auto-allow via prefix rules
    // don't flash the indicator for a split second before allow returns.
    // setClassifierChecking 写入新的状态值，使React hook 状态流后续读取保持一致。
    setClassifierChecking(ctx.toolUseID)
    // 显式忽略 `executeAsyncClassifierCheck(` 的返回值，只保留它触发的副作用。
    void executeAsyncClassifierCheck(
      result.pendingClassifierCheck,
      ctx.toolUseContext.abortController.signal,
      ctx.toolUseContext.options.isNonInteractiveSession,
      {
        // 这个回调绑定到 shouldContinue: () => !isResolved() && !userInteracted,，负责React hook 状态流在该局部场景下的响应。
        shouldContinue: () => !isResolved() && !userInteracted,
        // 这个回调绑定到 onComplete: () => {，负责React hook 状态流在该局部场景下的响应。
        onComplete: () => {
          // 调用 clearClassifierChecking，触发React hook此处需要的副作用。
          clearClassifierChecking(ctx.toolUseID)
          // 调用 clearClassifierIndicator，触发React hook此处需要的副作用。
          clearClassifierIndicator()
        },
        // 这个回调绑定到 onAllow: decisionReason => {，负责React hook 状态流在该局部场景下的响应。
        onAllow: decisionReason => {
          // 满足 `!claim()` 时，React hook执行该分支。
          if (!claim()) return
          // 组合条件 `bridgeCallbacks && bridgeRequestId` 成立时，React hook 状态流才启用这条专门路径。
          if (bridgeCallbacks && bridgeRequestId) {
            // 调用 bridgeCallbacks.cancelRequest，触发React hook此处需要的副作用。
            bridgeCallbacks.cancelRequest(bridgeRequestId)
          }
          // 调用 channelUnsubscribe?.()，完成这一处局部操作。
          channelUnsubscribe?.()
          // 调用 clearClassifierChecking，触发React hook此处需要的副作用。
          clearClassifierChecking(ctx.toolUseID)

          // matchedRule 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const matchedRule =
            decisionReason.type === 'classifier'
              ? (decisionReason.reason.match(
                  /^Allowed by prompt rule: "(.+)"$/,
                )?.[1] ?? decisionReason.reason)
              : undefined

          // Show auto-approved transition with dimmed options
          // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，React hook执行该分支。
          if (feature('TRANSCRIPT_CLASSIFIER')) {
            // 调用 ctx.updateQueueItem，触发React hook此处需要的副作用。
            ctx.updateQueueItem({
              classifierCheckInProgress: false,
              classifierAutoApproved: true,
              classifierMatchedRule: matchedRule,
            })
          }

          // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
          if (
            feature('TRANSCRIPT_CLASSIFIER') &&
            decisionReason.type === 'classifier'
          ) {
            // 当 `decisionReason.classifier` 匹配 `'auto-mode'` 时，React hook执行对应分支。
            if (decisionReason.classifier === 'auto-mode') {
              // setYoloClassifierApproval 写入新的状态值，使React hook 状态流后续读取保持一致。
              setYoloClassifierApproval(ctx.toolUseID, decisionReason.reason)
            // React hook interactive Handler在这里处理 `} else if (matchedRule) {`，完成这一小步状态转换。
            } else if (matchedRule) {
              // setClassifierApproval 写入新的状态值，使React hook 状态流后续读取保持一致。
              setClassifierApproval(ctx.toolUseID, matchedRule)
            }
          }

          // 调用 ctx.logDecision，触发React hook此处需要的副作用。
          ctx.logDecision(
            { decision: 'accept', source: { type: 'classifier' } },
            { permissionPromptStartTimeMs },
          )
          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(ctx.buildAllow(ctx.input, { decisionReason }))

          // Keep checkmark visible, then remove dialog.
          // 3s if terminal is focused (user can see it), 1s if not.
          // User can dismiss early with Esc via onDismissCheckmark.
          // signal保存`ctx.toolUseContext.abortController.signal`，供后续判断或组装使用。
          const signal = ctx.toolUseContext.abortController.signal
          // checkmarkAbortHandler更新为 `() => {`，确保interactiveHandler后续读取最新状态。
          checkmarkAbortHandler = () => {
            // 满足 `checkmarkTransitionTimer` 时，React hook执行该分支。
            if (checkmarkTransitionTimer) {
              // 调用 clearTimeout，触发React hook此处需要的副作用。
              clearTimeout(checkmarkTransitionTimer)
              // checkmarkTransitionTimer更新为 `undefined`，确保interactiveHandler后续读取最新状态。
              checkmarkTransitionTimer = undefined
              // Sibling Bash error can fire this (StreamingToolExecutor
              // cascades via siblingAbortController) — must drop the
              // cosmetic ✓ dialog or it blocks the next queued item.
              // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
              ctx.removeFromQueue()
            }
          }
          // checkmarkMs 集合读取`getTerminalFocused`，供React hook后续处理使用。
          const checkmarkMs = getTerminalFocused() ? 3000 : 1000
          // checkmarkTransitionTimer更新为 `setTimeout(() => {`，确保interactiveHandler后续读取最新状态。
          checkmarkTransitionTimer = setTimeout(() => {
            // checkmarkTransitionTimer更新为 `undefined`，确保interactiveHandler后续读取最新状态。
            checkmarkTransitionTimer = undefined
            // 满足 `checkmarkAbortHandler` 时，React hook执行该分支。
            if (checkmarkAbortHandler) {
              // 调用 signal.removeEventListener，触发React hook此处需要的副作用。
              signal.removeEventListener('abort', checkmarkAbortHandler)
              // checkmarkAbortHandler更新为 `undefined`，确保interactiveHandler后续读取最新状态。
              checkmarkAbortHandler = undefined
            }
            // 调用 ctx.removeFromQueue，触发React hook此处需要的副作用。
            ctx.removeFromQueue()
          }, checkmarkMs)
          // 调用 signal.addEventListener，触发React hook此处需要的副作用。
          signal.addEventListener('abort', checkmarkAbortHandler, {
            once: true,
          })
        },
      },
    // 这个回调绑定到 ).catch(error => {，负责React hook 状态流在该局部场景下的响应。
    ).catch(error => {
      // Log classifier API errors for debugging but don't propagate them as interruptions
      // These errors can be network failures, rate limits, or model issues - not user cancellations
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Async classifier check failed: ${errorMessage(error)}`, {
        level: 'error',
      })
    })
  }
}

// --

// 重新导出这一组成员，让React hook 状态流的公共 API 保持集中入口。
export { handleInteractivePermission }
// 导出类型定义，让其他模块沿用React hook interactive Handler的数据契约。
export type { InteractivePermissionParams }
