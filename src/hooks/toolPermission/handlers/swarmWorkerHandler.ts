// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准React hook 状态流的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 类型依赖 { PendingClassifierCheck } 来自 ../../../types/permissions.js，用于校准React hook 状态流的数据契约。
import type { PendingClassifierCheck } from '../../../types/permissions.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../../utils/agentSwarmsEnabled.js'
// 复用 toError 工具函数，把通用处理留在 ../../../utils/errors.js 中维护。
import { toError } from '../../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js'
// 类型依赖 { PermissionDecision } 来自 ../../../utils/permissions/PermissionResult.js，用于校准React hook 状态流的数据契约。
import type { PermissionDecision } from '../../../utils/permissions/PermissionResult.js'
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准React hook 状态流的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createPermissionRequest,
  isSwarmWorker,
  sendPermissionRequestViaMailbox,
} from '../../../utils/swarm/permissionSync.js'
// 引入 registerPermissionCallback，将 ../../useSwarmPermissionPoller.js 中已经封装好的能力接到本文件流程里。
import { registerPermissionCallback } from '../../useSwarmPermissionPoller.js'
// 类型依赖 { PermissionContext } 来自 ../PermissionContext.js，用于校准React hook 状态流的数据契约。
import type { PermissionContext } from '../PermissionContext.js'
// 引入 createResolveOnce，将 ../PermissionContext.js 中已经封装好的能力接到本文件流程里。
import { createResolveOnce } from '../PermissionContext.js'

// SwarmWorkerPermissionParams 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SwarmWorkerPermissionParams = {
  ctx: PermissionContext
  description: string
  pendingClassifierCheck?: PendingClassifierCheck | undefined
  updatedInput: Record<string, unknown> | undefined
  suggestions: PermissionUpdate[] | undefined
}

/**
 * Handles the swarm worker permission flow.
 *
 * When running as a swarm worker:
 * 1. Tries classifier auto-approval for bash commands
 * 2. Forwards the permission request to the leader via mailbox
 * 3. Registers callbacks for when the leader responds
 * 4. Sets the pending indicator while waiting
 *
 * Returns a PermissionDecision if the classifier auto-approves,
 * or a Promise that resolves when the leader responds.
 * Returns null if swarms are not enabled or this is not a swarm worker,
 * so the caller can fall through to interactive handling.
 */
// handleSwarmWorkerPermission 封装swarmWorkerHandler的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSwarmWorkerPermission(
  params: SwarmWorkerPermissionParams,
): Promise<PermissionDecision | null> {
  // 组合条件 `!isAgentSwarmsEnabled() || !isSwarmWorker()` 成立时，React hook 状态流才启用这条专门路径。
  if (!isAgentSwarmsEnabled() || !isSwarmWorker()) {
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }

  // 从 `params` 解构 ctx、description、updatedInput、suggestions，减少React hook swarm Worker Handler对同一对象的重复访问。
  const { ctx, description, updatedInput, suggestions } = params

  // For bash commands, try classifier auto-approval before forwarding to
  // the leader. Agents await the classifier result (rather than racing it
  // against user interaction like the main agent).
  // classifierResult保存`feature`，供React hook后续处理使用。
  const classifierResult = feature('BASH_CLASSIFIER')
    ? await ctx.tryClassifier?.(params.pendingClassifierCheck, updatedInput)
    : null
  // 满足 `classifierResult` 时，React hook执行该分支。
  if (classifierResult) {
    // 返回 `classifierResult`，作为React hook 状态流这次计算的结果。
    return classifierResult
  }

  // Forward permission request to the leader via mailbox
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // clearPendingRequest 请求数据封装成回调，供React hook swarm Work...在事件触发或异步步骤中调用。
    const clearPendingRequest = (): void =>
      // ctx.toolUseContext.setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      ctx.toolUseContext.setAppState(prev => ({
        ...prev,
        pendingWorkerRequest: null,
      }))

    // decision 等待 `new Promise<PermissionDecision>(resolve => {`，确保继续执行前已有结果。
    const decision = await new Promise<PermissionDecision>(resolve => {
      // 从 `createResolveOnce(resolve)` 解构 resolve、claim，减少React hook swarm Worker Handler对同一对象的重复访问。
      const { resolve: resolveOnce, claim } = createResolveOnce(resolve)

      // Create the permission request
      // request 请求数据构建`createPermissionRequest`，供React hook后续处理使用。
      const request = createPermissionRequest({
        toolName: ctx.tool.name,
        toolUseId: ctx.toolUseID,
        input: ctx.input,
        description,
        permissionSuggestions: suggestions,
      })

      // Register callback BEFORE sending the request to avoid race condition
      // where leader responds before callback is registered
      // 调用 registerPermissionCallback，触发React hook此处需要的副作用。
      registerPermissionCallback({
        requestId: request.id,
        toolUseId: ctx.toolUseID,
        // React hook swarm Worker Handler在这里处理 `async onAllow(`，完成这一小步状态转换。
        async onAllow(
          allowedInput: Record<string, unknown> | undefined,
          permissionUpdates: PermissionUpdate[],
          feedback?: string,
          contentBlocks?: ContentBlockParam[],
        ) {
          // 满足 `!claim()` 时，React hook执行该分支。
          if (!claim()) return // atomic check-and-mark before await
          // 调用 clearPendingRequest，触发React hook此处需要的副作用。
          clearPendingRequest()

          // Merge the updated input with the original input
          // finalInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const finalInput =
            allowedInput && Object.keys(allowedInput).length > 0
              ? allowedInput
              : ctx.input

          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(
            await ctx.handleUserAllow(
              finalInput,
              permissionUpdates,
              feedback,
              undefined,
              contentBlocks,
            ),
          )
        },
        // onReject 使用 feedback?: string, contentBlocks?: ContentBlockPa… 完成React hook 状态流里的对应操作。
        onReject(feedback?: string, contentBlocks?: ContentBlockParam[]) {
          // 满足 `!claim()` 时，React hook执行该分支。
          if (!claim()) return
          // 调用 clearPendingRequest，触发React hook此处需要的副作用。
          clearPendingRequest()

          // 调用 ctx.logDecision，触发React hook此处需要的副作用。
          ctx.logDecision({
            decision: 'reject',
            source: { type: 'user_reject', hasFeedback: !!feedback },
          })

          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(ctx.cancelAndAbort(feedback, undefined, contentBlocks))
        },
      })

      // Now that callback is registered, send the request to the leader
      // 显式忽略 `sendPermissionRequestViaMailbox(request)` 的返回值，只保留它触发的副作用。
      void sendPermissionRequestViaMailbox(request)

      // Show visual indicator that we're waiting for leader approval
      // ctx.toolUseContext.setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      ctx.toolUseContext.setAppState(prev => ({
        ...prev,
        pendingWorkerRequest: {
          toolName: ctx.tool.name,
          toolUseId: ctx.toolUseID,
          description,
        },
      }))

      // If the abort signal fires while waiting for the leader response,
      // resolve the promise with a cancel decision so it does not hang.
      // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
      ctx.toolUseContext.abortController.signal.addEventListener(
        'abort',
        // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
        () => {
          // 满足 `!claim()` 时，React hook执行该分支。
          if (!claim()) return
          // 调用 clearPendingRequest，触发React hook此处需要的副作用。
          clearPendingRequest()
          // 调用 ctx.logCancelled，触发React hook此处需要的副作用。
          ctx.logCancelled()
          // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveOnce(ctx.cancelAndAbort(undefined, true))
        },
        { once: true },
      )
    })

    // 返回 `decision`，作为React hook 状态流这次计算的结果。
    return decision
  } catch (error) {
    // If swarm permission submission fails, fall back to local handling
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // Continue to local UI handling below
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }
}

// 重新导出这一组成员，让React hook 状态流的公共 API 保持集中入口。
export { handleSwarmWorkerPermission }
// 导出类型定义，让其他模块沿用React hook swarm Worker Handler的数据契约。
export type { SwarmWorkerPermissionParams }
