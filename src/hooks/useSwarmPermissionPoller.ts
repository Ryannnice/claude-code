/**
 * Swarm Permission Poller Hook
 *
 * This hook polls for permission responses from the team leader when running
 * as a worker agent in a swarm. When a response is received, it calls the
 * appropriate callback (onAllow/onReject) to continue execution.
 *
 * This hook should be used in conjunction with the worker-side integration
 * in useCanUseTool.ts, which creates pending requests that this hook monitors.
 */

// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type PermissionUpdate,
  permissionUpdateSchema,
} from '../utils/permissions/PermissionUpdateSchema.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  isSwarmWorker,
  type PermissionResponse,
  pollForResponse,
  removeWorkerResponse,
} from '../utils/swarm/permissionSync.js'
// 复用 getAgentName、getTeamName 工具函数，把通用处理留在 ../utils/teammate.js 中维护。
import { getAgentName, getTeamName } from '../utils/teammate.js'

// POLL_INTERVAL_MS 集合 命名 `500`，让后续代码直接表达这个值的用途。
const POLL_INTERVAL_MS = 500

/**
 * Validate permissionUpdates from external sources (mailbox IPC, disk polling).
 * Malformed entries from buggy/old teammate processes are filtered out rather
 * than propagated unchecked into callback.onAllow().
 */
// parsePermissionUpdates 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePermissionUpdates(raw: unknown): PermissionUpdate[] {
  // 满足 `!Array.isArray(raw)` 时，React hook执行该分支。
  if (!Array.isArray(raw)) {
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }
  // schema保存`permissionUpdateSchema`，供React hook后续处理使用。
  const schema = permissionUpdateSchema()
  // valid 从空数组开始收集，后续循环会按处理顺序追加条目。
  const valid: PermissionUpdate[] = []
  // 按顺序遍历 `raw` 中的entry，逐个交给React hook处理。
  for (const entry of raw) {
    // 结果保存`schema.safeParse`，供React hook后续处理使用。
    const result = schema.safeParse(entry)
    // 满足 `result.success` 时，React hook执行该分支。
    if (result.success) {
      // valid追加新条目，保持收集顺序与输入顺序一致。
      valid.push(result.data)
    } else {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[SwarmPermissionPoller] Dropping malformed permissionUpdate entry: ${result.error.message}`,
        { level: 'warn' },
      )
    }
  }
  // 返回 `valid`，作为React hook 状态流这次计算的结果。
  return valid
}

/**
 * Callback signature for handling permission responses
 */
// PermissionResponseCallback 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionResponseCallback = {
  requestId: string
  toolUseId: string
  // React hook use Swarm Permission Pol...在这里处理 `onAllow: (`，完成这一小步状态转换。
  onAllow: (
    updatedInput: Record<string, unknown> | undefined,
    permissionUpdates: PermissionUpdate[],
    feedback?: string,
  ) => void
  // 这个回调绑定到 onReject: (feedback?: string) => void，负责React hook 状态流在该局部场景下的响应。
  onReject: (feedback?: string) => void
}

/**
 * Registry for pending permission request callbacks
 * This allows the poller to find and invoke the right callbacks when responses arrive
 */
// PendingCallbackRegistry 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PendingCallbackRegistry = Map<string, PermissionResponseCallback>

// Module-level registry that persists across renders
// pendingCallbacks 集合 用 Map 保存键值关系，方便React hook use Swarm Permission Pol...按 key 查找和复用。
const pendingCallbacks: PendingCallbackRegistry = new Map()

/**
 * Register a callback for a pending permission request
 * Called by useCanUseTool when a worker submits a permission request
 */
// registerPermissionCallback 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerPermissionCallback(
  callback: PermissionResponseCallback,
): void {
  // pendingCallbacks.set 写入新的状态值，使React hook 状态流后续读取保持一致。
  pendingCallbacks.set(callback.requestId, callback)
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Registered callback for request ${callback.requestId}`,
  )
}

/**
 * Unregister a callback (e.g., when the request is resolved locally or times out)
 */
// unregisterPermissionCallback 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterPermissionCallback(requestId: string): void {
  // 调用 pendingCallbacks.delete，触发React hook此处需要的副作用。
  pendingCallbacks.delete(requestId)
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Unregistered callback for request ${requestId}`,
  )
}

/**
 * Check if a request has a registered callback
 */
// hasPermissionCallback 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasPermissionCallback(requestId: string): boolean {
  // 返回 `pendingCallbacks.has(requestId)`，作为React hook 状态流这次计算的结果。
  return pendingCallbacks.has(requestId)
}

/**
 * Clear all pending callbacks (both permission and sandbox).
 * Called from clearSessionCaches() on /clear to reset stale state,
 * and also used in tests for isolation.
 */
// clearAllPendingCallbacks 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllPendingCallbacks(): void {
  // 调用 pendingCallbacks.clear，触发React hook此处需要的副作用。
  pendingCallbacks.clear()
  // 调用 pendingSandboxCallbacks.clear，触发React hook此处需要的副作用。
  pendingSandboxCallbacks.clear()
}

/**
 * Process a permission response from a mailbox message.
 * This is called by the inbox poller when it detects a permission_response message.
 *
 * @returns true if the response was processed, false if no callback was registered
 */
// processMailboxPermissionResponse 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function processMailboxPermissionResponse(params: {
  requestId: string
  decision: 'approved' | 'rejected'
  feedback?: string
  updatedInput?: Record<string, unknown>
  permissionUpdates?: unknown
}): boolean {
  // callback读取`pendingCallbacks.get`，供React hook后续处理使用。
  const callback = pendingCallbacks.get(params.requestId)

  // callback缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!callback) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SwarmPermissionPoller] No callback registered for mailbox response ${params.requestId}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Processing mailbox response for request ${params.requestId}: ${params.decision}`,
  )

  // Remove from registry before invoking callback
  // 调用 pendingCallbacks.delete，触发React hook此处需要的副作用。
  pendingCallbacks.delete(params.requestId)

  // 当 `params.decision` 匹配 `'approved'` 时，React hook执行对应分支。
  if (params.decision === 'approved') {
    // permissionUpdates 权限数据解析`parsePermissionUpdates`，供React hook后续处理使用。
    const permissionUpdates = parsePermissionUpdates(params.permissionUpdates)
    // updatedInput 命名 `params.updatedInput`，让后续代码直接表达这个值的用途。
    const updatedInput = params.updatedInput
    // 调用 callback.onAllow，触发React hook此处需要的副作用。
    callback.onAllow(updatedInput, permissionUpdates)
  } else {
    // 调用 callback.onReject，触发React hook此处需要的副作用。
    callback.onReject(params.feedback)
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// ============================================================================
// Sandbox Permission Callback Registry
// ============================================================================

/**
 * Callback signature for handling sandbox permission responses
 */
// SandboxPermissionResponseCallback 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type SandboxPermissionResponseCallback = {
  requestId: string
  host: string
  // 这个回调绑定到 resolve: (allow: boolean) => void，负责React hook 状态流在该局部场景下的响应。
  resolve: (allow: boolean) => void
}

// Module-level registry for sandbox permission callbacks
// pendingSandboxCallbacks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const pendingSandboxCallbacks: Map<string, SandboxPermissionResponseCallback> =
  new Map()

/**
 * Register a callback for a pending sandbox permission request
 * Called when a worker sends a sandbox permission request to the leader
 */
// registerSandboxPermissionCallback 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerSandboxPermissionCallback(
  callback: SandboxPermissionResponseCallback,
): void {
  // pendingSandboxCallbacks.set 写入新的状态值，使React hook 状态流后续读取保持一致。
  pendingSandboxCallbacks.set(callback.requestId, callback)
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Registered sandbox callback for request ${callback.requestId}`,
  )
}

/**
 * Check if a sandbox request has a registered callback
 */
// hasSandboxPermissionCallback 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasSandboxPermissionCallback(requestId: string): boolean {
  // 返回 `pendingSandboxCallbacks.has(requestId)`，作为React hook 状态流这次计算的结果。
  return pendingSandboxCallbacks.has(requestId)
}

/**
 * Process a sandbox permission response from a mailbox message.
 * Called by the inbox poller when it detects a sandbox_permission_response message.
 *
 * @returns true if the response was processed, false if no callback was registered
 */
// processSandboxPermissionResponse 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function processSandboxPermissionResponse(params: {
  requestId: string
  host: string
  allow: boolean
}): boolean {
  // callback读取`pendingSandboxCallbacks.get`，供React hook后续处理使用。
  const callback = pendingSandboxCallbacks.get(params.requestId)

  // callback缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!callback) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SwarmPermissionPoller] No sandbox callback registered for request ${params.requestId}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Processing sandbox response for request ${params.requestId}: allow=${params.allow}`,
  )

  // Remove from registry before invoking callback
  // 调用 pendingSandboxCallbacks.delete，触发React hook此处需要的副作用。
  pendingSandboxCallbacks.delete(params.requestId)

  // Resolve the promise with the allow decision
  // callback.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
  callback.resolve(params.allow)

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Process a permission response by invoking the registered callback
 */
// processResponse 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processResponse(response: PermissionResponse): boolean {
  // callback读取`pendingCallbacks.get`，供React hook后续处理使用。
  const callback = pendingCallbacks.get(response.requestId)

  // callback缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!callback) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SwarmPermissionPoller] No callback registered for request ${response.requestId}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmPermissionPoller] Processing response for request ${response.requestId}: ${response.decision}`,
  )

  // Remove from registry before invoking callback
  // 调用 pendingCallbacks.delete，触发React hook此处需要的副作用。
  pendingCallbacks.delete(response.requestId)

  // 当 `response.decision` 匹配 `'approved'` 时，React hook执行对应分支。
  if (response.decision === 'approved') {
    // permissionUpdates 权限数据解析`parsePermissionUpdates`，供React hook后续处理使用。
    const permissionUpdates = parsePermissionUpdates(response.permissionUpdates)
    // updatedInput保存`response.updatedInput`，供后续判断或组装使用。
    const updatedInput = response.updatedInput
    // 调用 callback.onAllow，触发React hook此处需要的副作用。
    callback.onAllow(updatedInput, permissionUpdates)
  } else {
    // 调用 callback.onReject，触发React hook此处需要的副作用。
    callback.onReject(response.feedback)
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Hook that polls for permission responses when running as a swarm worker.
 *
 * This hook:
 * 1. Only activates when isSwarmWorker() returns true
 * 2. Polls every 500ms for responses
 * 3. When a response is found, invokes the registered callback
 * 4. Cleans up the response file after processing
 */
// useSwarmPermissionPoller 封装useSwarmPermissionPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSwarmPermissionPoller(): void {
  // isProcessingRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isProcessingRef = useRef(false)

  // poll保存`useCallback`，供React hook后续处理使用。
  const poll = useCallback(async () => {
    // Don't poll if not a swarm worker
    // 满足 `!isSwarmWorker()` 时，React hook执行该分支。
    if (!isSwarmWorker()) {
      // React hook use Swarm Permission Pol...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Prevent concurrent polling
    // 满足 `isProcessingRef.current` 时，React hook执行该分支。
    if (isProcessingRef.current) {
      // React hook use Swarm Permission Pol...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Don't poll if no callbacks are registered
    // 满足 `pendingCallbacks.size === 0` 时，React hook执行该分支。
    if (pendingCallbacks.size === 0) {
      // React hook use Swarm Permission Pol...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // current更新为 `true`，确保useSwarmPermissionPoller后续读取最新状态。
    isProcessingRef.current = true

    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // agentName读取`getAgentName`，供React hook后续处理使用。
      const agentName = getAgentName()
      // teamName读取`getTeamName`，供React hook后续处理使用。
      const teamName = getTeamName()

      // 组合条件 `!agentName || !teamName` 成立时，React hook 状态流才启用这条专门路径。
      if (!agentName || !teamName) {
        // React hook use Swarm Permission Pol...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Check each pending request for a response
      // 循环处理 `const [requestId, _callback] of pendingCallbacks`，让React hook 状态流逐项把同类条目按顺序走完。
      for (const [requestId, _callback] of pendingCallbacks) {
        // 接口响应保存`pollForResponse`，供React hook后续处理使用。
        const response = await pollForResponse(requestId, agentName, teamName)

        // 满足 `response` 时，React hook执行该分支。
        if (response) {
          // Process the response
          // processed保存`processResponse`，供React hook后续处理使用。
          const processed = processResponse(response)

          // 满足 `processed` 时，React hook执行该分支。
          if (processed) {
            // Clean up the response from the worker's inbox
            // 等待 `removeWorkerResponse(requestId, agentName, teamName)` 完成，再继续React hook use Swarm Permission Pol...的异步流程。
            await removeWorkerResponse(requestId, agentName, teamName)
          }
        }
      }
    } catch (error) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[SwarmPermissionPoller] Error during poll: ${errorMessage(error)}`,
      )
    } finally {
      // current更新为 `false`，确保useSwarmPermissionPoller后续读取最新状态。
      isProcessingRef.current = false
    }
  }, [])

  // Only poll if we're a swarm worker
  // shouldPoll记录 `isSwarmWorker` 是否成立，React hook随后按该结果分支。
  const shouldPoll = isSwarmWorker()
  // 调用 useInterval，触发React hook此处需要的副作用。
  useInterval(() => void poll(), shouldPoll ? POLL_INTERVAL_MS : null)

  // Initial poll on mount
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `isSwarmWorker()` 时，React hook执行该分支。
    if (isSwarmWorker()) {
      // 显式忽略 `poll()` 的返回值，只保留它触发的副作用。
      void poll()
    }
  }, [poll])
}
