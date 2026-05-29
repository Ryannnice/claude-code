// SessionState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionState = 'idle' | 'running' | 'requires_action'

/**
 * Context carried with requires_action transitions so downstream
 * surfaces (CCR sidebar, push notifications) can show what the
 * session is blocked on, not just that it's blocked.
 *
 * Two delivery paths:
 * - tool_name + action_description → RequiresActionDetails proto
 *   (webhook payload, typed, logged in Datadog)
 * - full object → external_metadata.pending_action (queryable JSON
 *   on the Session, lets the frontend iterate on shape without
 *   proto round-trips)
 */
// RequiresActionDetails 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RequiresActionDetails = {
  tool_name: string
  /** Human-readable summary, e.g. "Editing src/foo.ts", "Running npm test" */
  action_description: string
  tool_use_id: string
  request_id: string
  /** Raw tool input — the frontend reads from external_metadata.pending_action.input
   * to parse question options / plan content without scanning the event stream. */
  input?: Record<string, unknown>
}

// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 类型依赖 { PermissionMode } 来自 ./permissions/PermissionMode.js，用于校准共享工具的数据契约。
import type { PermissionMode } from './permissions/PermissionMode.js'
// 引入 enqueueSdkEvent，将 ./sdkEventQueue.js 中已经封装好的能力接到本文件流程里。
import { enqueueSdkEvent } from './sdkEventQueue.js'

// CCR external_metadata keys — push in onChangeAppState, restore in
// externalMetadataToAppState.
// SessionExternalMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionExternalMetadata = {
  permission_mode?: string | null
  is_ultraplan_mode?: boolean | null
  model?: string | null
  pending_action?: RequiresActionDetails | null
  // Opaque — typed at the emit site. Importing PostTurnSummaryOutput here
  // would leak the import path string into sdk.d.ts via agentSdkBridge's
  // re-export of SessionState.
  post_turn_summary?: unknown
  // Mid-turn progress line from the forked-agent summarizer — fires every
  // ~5 steps / 2min so long-running turns still surface "what's happening
  // right now" before post_turn_summary arrives.
  task_summary?: string | null
}

// SessionStateChangedListener 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionStateChangedListener = (
  state: SessionState,
  details?: RequiresActionDetails,
) => void
// SessionMetadataChangedListener 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionMetadataChangedListener = (
  metadata: SessionExternalMetadata,
) => void
// PermissionModeChangedListener 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionModeChangedListener = (mode: PermissionMode) => void

// stateListener 状态 命名 `null`，让后续代码直接表达这个值的用途。
let stateListener: SessionStateChangedListener | null = null
// metadataListener 集合 命名 `null`，让后续代码直接表达这个值的用途。
let metadataListener: SessionMetadataChangedListener | null = null
// permissionModeListener 权限数据初始化为空值，后续分支会在有数据时补齐。
let permissionModeListener: PermissionModeChangedListener | null = null

// setSessionStateChangedListener 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionStateChangedListener(
  cb: SessionStateChangedListener | null,
): void {
  // stateListener 状态更新为 `cb`，确保共享工具后续读取最新状态。
  stateListener = cb
}

// setSessionMetadataChangedListener 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionMetadataChangedListener(
  cb: SessionMetadataChangedListener | null,
): void {
  // metadataListener 集合更新为 `cb`，确保共享工具后续读取最新状态。
  metadataListener = cb
}

/**
 * Register a listener for permission-mode changes from onChangeAppState.
 * Wired by print.ts to emit an SDK system:status message so CCR/IDE clients
 * see mode transitions in real time — regardless of which code path mutated
 * toolPermissionContext.mode (Shift+Tab, ExitPlanMode dialog, slash command,
 * bridge set_permission_mode, etc.).
 */
// setPermissionModeChangedListener 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPermissionModeChangedListener(
  cb: PermissionModeChangedListener | null,
): void {
  // permissionModeListener 权限数据更新为 `cb`，确保共享工具后续读取最新状态。
  permissionModeListener = cb
}

// hasPendingAction标记共享工具 session State是否启用对应路径。
let hasPendingAction = false
// currentState 状态 命名 `'idle'`，让后续代码直接表达这个值的用途。
let currentState: SessionState = 'idle'

// getSessionState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionState(): SessionState {
  // 返回 `currentState`，作为共享工具这次计算的结果。
  return currentState
}

// notifySessionStateChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifySessionStateChanged(
  state: SessionState,
  details?: RequiresActionDetails,
): void {
  // currentState 状态更新为 `state`，确保共享工具后续读取最新状态。
  currentState = state
  // 调用 stateListener?.(state, details)，完成这一处局部操作。
  stateListener?.(state, details)

  // Mirror details into external_metadata so GetSession carries the
  // pending-action context without proto changes. Cleared via RFC 7396
  // null on the next non-blocked transition.
  // 只有 `state === 'requires_action' && details` 满足时，共享工具才执行该分支。
  if (state === 'requires_action' && details) {
    // hasPendingAction更新为 `true`，确保共享工具后续读取最新状态。
    hasPendingAction = true
    // 调用 metadataListener?.({，完成这一处局部操作。
    metadataListener?.({
      pending_action: details,
    })
  // 共享工具 session State在这里处理 `} else if (hasPendingAction) {`，完成这一小步状态转换。
  } else if (hasPendingAction) {
    // hasPendingAction更新为 `false`，确保共享工具后续读取最新状态。
    hasPendingAction = false
    // 调用 metadataListener?.({ pending_action: null })，完成这一处局部操作。
    metadataListener?.({ pending_action: null })
  }

  // task_summary is written mid-turn by the forked summarizer; clear it at
  // idle so the next turn doesn't briefly show the previous turn's progress.
  // 当 `state` 匹配 `'idle'` 时，共享工具执行对应分支。
  if (state === 'idle') {
    // 调用 metadataListener?.({ task_summary: null })，完成这一处局部操作。
    metadataListener?.({ task_summary: null })
  }

  // Mirror to the SDK event stream so non-CCR consumers (scmuxd, VS Code)
  // see the same authoritative idle/running signal the CCR bridge does.
  // 'idle' fires after heldBackResult flushes — lets scmuxd flip IDLE and
  // show the bg-task dot instead of a stuck generating spinner.
  //
  // Opt-in until CCR web + mobile clients learn to ignore this subtype in
  // their isWorking() last-message heuristics — the trailing idle event
  // currently pins them at "Running...".
  // https://anthropic.slack.com/archives/C093BJBD1CP/p1774152406752229
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS)) {
    // 调用 enqueueSdkEvent，触发共享工具此处需要的副作用。
    enqueueSdkEvent({
      type: 'system',
      subtype: 'session_state_changed',
      state,
    })
  }
}

// notifySessionMetadataChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifySessionMetadataChanged(
  metadata: SessionExternalMetadata,
): void {
  // 调用 metadataListener?.(metadata)，完成这一处局部操作。
  metadataListener?.(metadata)
}

/**
 * Fired by onChangeAppState when toolPermissionContext.mode changes.
 * Downstream listeners (CCR external_metadata PUT, SDK status stream) are
 * both wired through this single choke point so no mode-mutation path can
 * silently bypass them.
 */
// notifyPermissionModeChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyPermissionModeChanged(mode: PermissionMode): void {
  // 调用 permissionModeListener?.(mode)，完成这一处局部操作。
  permissionModeListener?.(mode)
}
