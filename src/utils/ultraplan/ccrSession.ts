// CCR session polling for /ultraplan. Waits for an approved ExitPlanMode
// tool_result, then extracts the plan text. Uses pollRemoteSessionEvents
// (shared with RemoteAgentTask) for pagination + typed SDKMessage[].
// Plan mode is set via set_permission_mode control_request in
// teleportToRemote's CreateSession events array.

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources'
// 类型依赖 { SDKMessage } 来自 ../../entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { SDKMessage } from '../../entrypoints/agentSdkTypes.js'
// 接入 EXIT_PLAN_MODE_V2_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../../tools/ExitPlanModeTool/constants.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 引入 isTransientNetworkError，将 ../teleport/api.js 中已经封装好的能力接到本文件流程里。
import { isTransientNetworkError } from '../teleport/api.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type PollRemoteSessionResponse,
  pollRemoteSessionEvents,
} from '../teleport.js'

// POLL_INTERVAL_MS 集合保存`3000`，供共享工具 ccr Session后续判断或输出使用。
const POLL_INTERVAL_MS = 3000
// pollRemoteSessionEvents doesn't retry. A 30min poll makes ~600 calls;
// at any nonzero 5xx rate one blip would kill the run.
// MAX_CONSECUTIVE_FAILURES 集合保存`5`，供后续判断或组装使用。
const MAX_CONSECUTIVE_FAILURES = 5

// PollFailReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PollFailReason =
  | 'terminated'
  | 'timeout_pending'
  | 'timeout_no_plan'
  | 'extract_marker_missing'
  | 'network_or_unknown'
  | 'stopped'

// UltraplanPollError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class UltraplanPollError extends Error {
  constructor(
    message: string,
    readonly reason: PollFailReason,
    readonly rejectCount: number,
    options?: ErrorOptions,
  ) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message, options)
    // 更新实例字段 name 为 'UltraplanPollError'，同步共享工具的内部状态。
    this.name = 'UltraplanPollError'
  }
}

// Sentinel string the browser PlanModal includes in the feedback when the user
// clicks "teleport back to terminal". Plan text follows on the next line.
// ULTRAPLAN_TELEPORT_SENTINEL保存`'__ULTRAPLAN_TELEPORT_LOCAL__'`，作为后续固定文本处理的输入。
export const ULTRAPLAN_TELEPORT_SENTINEL = '__ULTRAPLAN_TELEPORT_LOCAL__'

// ScanResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScanResult =
  | { kind: 'approved'; plan: string }
  | { kind: 'teleport'; plan: string }
  | { kind: 'rejected'; id: string }
  | { kind: 'pending' }
  | { kind: 'terminated'; subtype: string }
  | { kind: 'unchanged' }

/**
 * Pill/detail-view state derived from the event stream. Transitions:
 *   running → (turn ends, no ExitPlanMode) → needs_input
 *   needs_input → (user replies in browser) → running
 *   running → (ExitPlanMode emitted, no result yet) → plan_ready
 *   plan_ready → (rejected) → running
 *   plan_ready → (approved) → poll resolves, pill removed
 */
// UltraplanPhase 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type UltraplanPhase = 'running' | 'needs_input' | 'plan_ready'

/**
 * Pure stateful classifier for the CCR event stream. Ingests SDKMessage[]
 * batches (as delivered by pollRemoteSessionEvents) and returns the current
 * ExitPlanMode verdict. No I/O, no timers — feed it synthetic or recorded
 * events for unit tests and offline replay.
 *
 * Precedence (approved > terminated > rejected > pending > unchanged):
 * pollRemoteSessionEvents paginates up to 50 pages per call, so one ingest
 * can span seconds of session activity. A batch may contain both an approved
 * tool_result AND a subsequent {type:'result'} (user approved, then remote
 * crashed). The approved plan is real and in threadstore — don't drop it.
 */
// ExitPlanModeScanner 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ExitPlanModeScanner {
  private exitPlanCalls: string[] = []
  private results = new Map<string, ToolResultBlockParam>()
  private rejectedIds = new Set<string>()
  private terminated: { subtype: string } | null = null
  private rescanAfterRejection = false
  everSeenPending = false

  // 共享工具 ccr Session在这里处理 `get rejectCount(): number {`，完成这一小步状态转换。
  get rejectCount(): number {
    // 返回 `this.rejectedIds.size`，作为共享工具这次计算的结果。
    return this.rejectedIds.size
  }

  /**
   * True when an ExitPlanMode tool_use exists with no tool_result yet —
   * the remote is showing the approval dialog in the browser.
   */
  // 共享工具 ccr Session在这里处理 `get hasPendingPlan(): boolean {`，完成这一小步状态转换。
  get hasPendingPlan(): boolean {
    // 标识符筛选`exitPlanCalls.findLast`，供共享工具后续处理使用。
    const id = this.exitPlanCalls.findLast(c => !this.rejectedIds.has(c))
    // 返回 `id !== undefined && !this.results.has(id)`，作为共享工具这次计算的结果。
    return id !== undefined && !this.results.has(id)
  }

  // ingest 使用 newEvents: SDKMessage[] 完成共享工具里的对应操作。
  ingest(newEvents: SDKMessage[]): ScanResult {
    // 按顺序遍历 `newEvents` 中的m，逐个交给共享工具处理。
    for (const m of newEvents) {
      // 当 `m.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
      if (m.type === 'assistant') {
        // 按顺序遍历 `m.message.content` 中的block，逐个交给共享工具处理。
        for (const block of m.message.content) {
          // `block.type` 与 `'tool_use'` 不一致时刷新派生状态，避免使用过期结果。
          if (block.type !== 'tool_use') continue
          // tu 命名 `block as ToolUseBlock`，让后续代码直接表达这个值的用途。
          const tu = block as ToolUseBlock
          // 满足 `tu.name === EXIT_PLAN_MODE_V2_TOOL_NAME` 时，共享工具执行该分支。
          if (tu.name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
            // exitPlanCalls 集合追加新条目，保持收集顺序与输入顺序一致。
            this.exitPlanCalls.push(tu.id)
          }
        }
      // 共享工具 ccr Session在这里处理 `} else if (m.type === 'user') {`，完成这一小步状态转换。
      } else if (m.type === 'user') {
        // 文本内容保存`m.message.content`，供后续判断或组装使用。
        const content = m.message.content
        // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
        if (!Array.isArray(content)) continue
        // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
        for (const block of content) {
          // 当 `block.type` 匹配 `'tool_result'` 时，共享工具执行对应分支。
          if (block.type === 'tool_result') {
            // this.results.set 写入新的状态值，使共享工具后续读取保持一致。
            this.results.set(block.tool_use_id, block)
          }
        }
      // 共享工具 ccr Session在这里处理 `} else if (m.type === 'result' && m.subtype !== 'success') {`，完成这一小步状态转换。
      } else if (m.type === 'result' && m.subtype !== 'success') {
        // result(success) fires after EVERY CCR turn
        // If the remote asks a clarifying question (turn ends without
        // ExitPlanMode), we must keep polling — the user can reply in
        // the browser and reach ExitPlanMode in a later turn.
        // Only error subtypes (error_during_execution, error_max_turns,
        // etc.) mean the session is actually dead.
        // 更新实例字段 terminated 为 { subtype: m.subtype }，同步共享工具的内部状态。
        this.terminated = { subtype: m.subtype }
      }
    }

    // Skip-scan when nothing could have moved the target: no new events, no
    // rejection last tick. A rejection moves the newest-non-rejected target.
    // shouldScan标记共享工具 ccr Session是否启用对应路径。
    const shouldScan = newEvents.length > 0 || this.rescanAfterRejection
    // 更新实例字段 rescanAfterRejection 为 false，同步共享工具的内部状态。
    this.rescanAfterRejection = false

    // 共享工具 ccr Session先整理这一处局部数据，后续分支可以直接读取。
    let found:
      | { kind: 'approved'; plan: string }
      | { kind: 'teleport'; plan: string }
      | { kind: 'rejected'; id: string }
      | { kind: 'pending' }
      | null = null
    // 满足 `shouldScan` 时，共享工具执行该分支。
    if (shouldScan) {
      // 循环处理 `let i = this.exitPlanCalls.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
      for (let i = this.exitPlanCalls.length - 1; i >= 0; i--) {
        // 标识符保存`this.exitPlanCalls[i]!`，供共享工具 ccr Session后续判断或输出使用。
        const id = this.exitPlanCalls[i]!
        // 满足 `this.rejectedIds.has(id)` 时，共享工具执行该分支。
        if (this.rejectedIds.has(id)) continue
        // tr读取`results.get`，供共享工具后续处理使用。
        const tr = this.results.get(id)
        // tr缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!tr) {
          // found更新为 `{ kind: 'pending' }`，确保共享工具后续读取最新状态。
          found = { kind: 'pending' }
        // 共享工具 ccr Session在这里处理 `} else if (tr.is_error === true) {`，完成这一小步状态转换。
        } else if (tr.is_error === true) {
          // teleportPlan保存`extractTeleportPlan`，供共享工具后续处理使用。
          const teleportPlan = extractTeleportPlan(tr.content)
          // 共享工具 ccr Session在这里处理 `found =`，完成这一小步状态转换。
          found =
            teleportPlan !== null
              ? { kind: 'teleport', plan: teleportPlan }
              : { kind: 'rejected', id }
        } else {
          // found更新为 `{ kind: 'approved', plan: extractApprovedPlan(tr.content)...`，确保共享工具后续读取最新状态。
          found = { kind: 'approved', plan: extractApprovedPlan(tr.content) }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 当 `found?.kind` 匹配 `'approved' || found?.kind =...` 时，共享工具执行对应分支。
      if (found?.kind === 'approved' || found?.kind === 'teleport') return found
    }

    // Bookkeeping before the terminated check — a batch can contain BOTH a
    // rejected tool_result and a {type:'result'}; rejectCount must reflect
    // the rejection even though terminated takes return precedence.
    // 当 `found?.kind` 匹配 `'rejected'` 时，共享工具执行对应分支。
    if (found?.kind === 'rejected') {
      // this.rejectedIds.add 结算当前 Promise，唤醒等待这个异步结果的调用方。
      this.rejectedIds.add(found.id)
      // 更新实例字段 rescanAfterRejection 为 true，同步共享工具的内部状态。
      this.rescanAfterRejection = true
    }
    // 满足 `this.terminated` 时，共享工具执行该分支。
    if (this.terminated) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { kind: 'terminated', subtype: this.terminated.subtype }
    }
    // 当 `found?.kind` 匹配 `'rejected'` 时，共享工具执行对应分支。
    if (found?.kind === 'rejected') {
      // 返回 `found`，作为共享工具这次计算的结果。
      return found
    }
    // 当 `found?.kind` 匹配 `'pending'` 时，共享工具执行对应分支。
    if (found?.kind === 'pending') {
      // 更新实例字段 everSeenPending 为 true，同步共享工具的内部状态。
      this.everSeenPending = true
      // 返回 `found`，作为共享工具这次计算的结果。
      return found
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'unchanged' }
  }
}

// PollResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PollResult = {
  plan: string
  rejectCount: number
  /** 'local' = user clicked teleport (execute here, archive remote). 'remote' = user approved in-CCR execution (don't archive). */
  executionTarget: 'local' | 'remote'
}

// Returns the approved plan text and where the user wants it executed.
// 'approved' scrapes from the "## Approved Plan:" marker (ExitPlanModeV2Tool
// default branch) — the model writes plan to a file inside CCR and calls
// ExitPlanMode({allowedPrompts}), so input.plan is never in threadstore.
// 'teleport' scrapes from the ULTRAPLAN_TELEPORT_SENTINEL in a deny tool_result —
// browser sends a rejection so the remote stays in plan mode, with the plan
// text embedded in the feedback. Normal rejections (is_error === true, no
// sentinel) are tracked and skipped so the user can iterate in the browser.
// pollForApprovedExitPlanMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pollForApprovedExitPlanMode(
  sessionId: string,
  timeoutMs: number,
  onPhaseChange?: (phase: UltraplanPhase) => void,
  shouldStop?: () => boolean,
): Promise<PollResult> {
  // deadline记录时间`Date.now`，供共享工具后续处理使用。
  const deadline = Date.now() + timeoutMs
  // scanner保存`ExitPlanModeScanner`，供共享工具后续处理使用。
  const scanner = new ExitPlanModeScanner()
  // cursor保存`null`，作为后续空值处理的输入。
  let cursor: string | null = null
  // failures 集合保存`0`，供共享工具 ccr Session后续判断或输出使用。
  let failures = 0
  // lastPhase保存`'running'`，作为后续固定文本处理的输入。
  let lastPhase: UltraplanPhase = 'running'

  // 只要 Date.now() < deadline 成立，就持续推进共享工具中的循环处理。
  while (Date.now() < deadline) {
    // 满足 `shouldStop?.()` 时，共享工具执行该分支。
    if (shouldStop?.()) {
      // 抛出 new UltraplanPollError(，阻止共享工具在无效状态下继续运行。
      throw new UltraplanPollError(
        'poll stopped by caller',
        'stopped',
        scanner.rejectCount,
      )
    }
    // newEvents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let newEvents: SDKMessage[]
    // sessionStatus 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let sessionStatus: PollRemoteSessionResponse['sessionStatus']
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Metadata fetch (session_status) is the needs_input signal —
      // threadstore doesn't persist result(success) turn-end events, so
      // idle status is the only authoritative "remote is waiting" marker.
      // resp保存`pollRemoteSessionEvents`，供共享工具后续处理使用。
      const resp = await pollRemoteSessionEvents(sessionId, cursor)
      // newEvents 集合更新为 `resp.newEvents`，确保共享工具后续读取最新状态。
      newEvents = resp.newEvents
      // cursor更新为 `resp.lastEventId`，确保共享工具后续读取最新状态。
      cursor = resp.lastEventId
      // sessionStatus 会话数据更新为 `resp.sessionStatus`，确保共享工具后续读取最新状态。
      sessionStatus = resp.sessionStatus
      // failures 集合更新为 `0`，确保共享工具后续读取最新状态。
      failures = 0
    } catch (e) {
      // transient保存`isTransientNetworkError`，供共享工具后续处理使用。
      const transient = isTransientNetworkError(e)
      // 只有 `!transient || ++failures >= MAX_CONSECUTIVE_FAILU` 满足时，共享工具才执行该分支。
      if (!transient || ++failures >= MAX_CONSECUTIVE_FAILURES) {
        // 抛出 new UltraplanPollError(，阻止共享工具在无效状态下继续运行。
        throw new UltraplanPollError(
          e instanceof Error ? e.message : String(e),
          'network_or_unknown',
          scanner.rejectCount,
          { cause: e },
        )
      }
      // 等待 `sleep(POLL_INTERVAL_MS)` 完成，再继续共享工具 ccr Session的异步流程。
      await sleep(POLL_INTERVAL_MS)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
    let result: ScanResult
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果更新为 `scanner.ingest(newEvents)`，确保共享工具后续读取最新状态。
      result = scanner.ingest(newEvents)
    } catch (e) {
      // 抛出 new UltraplanPollError(，阻止共享工具在无效状态下继续运行。
      throw new UltraplanPollError(
        e instanceof Error ? e.message : String(e),
        'extract_marker_missing',
        scanner.rejectCount,
      )
    }
    // 当 `result.kind` 匹配 `'approved'` 时，共享工具执行对应分支。
    if (result.kind === 'approved') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        plan: result.plan,
        rejectCount: scanner.rejectCount,
        executionTarget: 'remote',
      }
    }
    // 当 `result.kind` 匹配 `'teleport'` 时，共享工具执行对应分支。
    if (result.kind === 'teleport') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        plan: result.plan,
        rejectCount: scanner.rejectCount,
        executionTarget: 'local',
      }
    }
    // 当 `result.kind` 匹配 `'terminated'` 时，共享工具执行对应分支。
    if (result.kind === 'terminated') {
      // 抛出 new UltraplanPollError(，阻止共享工具在无效状态下继续运行。
      throw new UltraplanPollError(
        `remote session ended (${result.subtype}) before plan approval`,
        'terminated',
        scanner.rejectCount,
      )
    }
    // plan_ready from the event stream wins; otherwise idle session status
    // means the remote asked a question and is waiting for a browser reply.
    // requires_action with no pending plan is also needs_input — the remote
    // may be blocked on a non-ExitPlanMode permission prompt.
    // CCR briefly flips to 'idle' between tool turns (see STABLE_IDLE_POLLS
    // in RemoteAgentTask). Only trust idle when no new events arrived —
    // events flowing means the session is working regardless of the status
    // snapshot. This also makes needs_input → running snap back on the first
    // poll that sees the user's reply event, even if session_status lags.
    // quietIdle 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const quietIdle =
      (sessionStatus === 'idle' || sessionStatus === 'requires_action') &&
      newEvents.length === 0
    // phase 命名 `scanner.hasPendingPlan`，让后续代码直接表达这个值的用途。
    const phase: UltraplanPhase = scanner.hasPendingPlan
      ? 'plan_ready'
      : quietIdle
        ? 'needs_input'
        : 'running'
    // `phase` 与 `lastPhase` 不一致时刷新派生状态，避免使用过期结果。
    if (phase !== lastPhase) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[ultraplan] phase ${lastPhase} → ${phase}`)
      // lastPhase更新为 `phase`，确保共享工具后续读取最新状态。
      lastPhase = phase
      // 调用 onPhaseChange?.(phase)，完成这一处局部操作。
      onPhaseChange?.(phase)
    }
    // 等待 `sleep(POLL_INTERVAL_MS)` 完成，再继续共享工具 ccr Session的异步流程。
    await sleep(POLL_INTERVAL_MS)
  }

  // 抛出 new UltraplanPollError(，阻止共享工具在无效状态下继续运行。
  throw new UltraplanPollError(
    scanner.everSeenPending
      ? `no approval after ${timeoutMs / 1000}s`
      : `ExitPlanMode never reached after ${timeoutMs / 1000}s (the remote container failed to start, or session ID mismatch?)`,
    scanner.everSeenPending ? 'timeout_pending' : 'timeout_no_plan',
    scanner.rejectCount,
  )
}

// tool_result content may be string or [{type:'text',text}] depending on
// threadstore encoding.
// contentToText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function contentToText(content: ToolResultBlockParam['content']): string {
  // 返回 `typeof content === 'string'`，作为共享工具这次计算的结果。
  return typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map(b => ('text' in b ? b.text : '')).join('')
      : ''
}

// Extracts the plan text after the ULTRAPLAN_TELEPORT_SENTINEL marker.
// Returns null when the sentinel is absent — callers treat null as a normal
// user rejection (scanner falls through to { kind: 'rejected' }).
// extractTeleportPlan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractTeleportPlan(
  content: ToolResultBlockParam['content'],
): string | null {
  // 文本保存`contentToText`，供共享工具后续处理使用。
  const text = contentToText(content)
  // marker固定为 ``${ULTRAPLAN_TELEPORT_SENTINEL}\n``，作为共享工具 ccr Session后续展示或比较的基准。
  const marker = `${ULTRAPLAN_TELEPORT_SENTINEL}\n`
  // idx保存`text.indexOf`，供共享工具后续处理使用。
  const idx = text.indexOf(marker)
  // 满足 `idx === -1` 时，共享工具执行该分支。
  if (idx === -1) return null
  // 返回 `text.slice(idx + marker.length).trimEnd()`，作为共享工具这次计算的结果。
  return text.slice(idx + marker.length).trimEnd()
}

// Plan is echoed in tool_result content as "## Approved Plan:\n<text>" or
// "## Approved Plan (edited by user):\n<text>" (ExitPlanModeV2Tool).
// extractApprovedPlan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractApprovedPlan(content: ToolResultBlockParam['content']): string {
  // 文本保存`contentToText`，供共享工具后续处理使用。
  const text = contentToText(content)
  // Try both markers — edited plans use a different label.
  // markers 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const markers = [
    '## Approved Plan (edited by user):\n',
    '## Approved Plan:\n',
  ]
  // 按顺序遍历 `markers` 中的marker，逐个交给共享工具处理。
  for (const marker of markers) {
    // idx保存`text.indexOf`，供共享工具后续处理使用。
    const idx = text.indexOf(marker)
    // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (idx !== -1) {
      // 返回 `text.slice(idx + marker.length).trimEnd()`，作为共享工具这次计算的结果。
      return text.slice(idx + marker.length).trimEnd()
    }
  }
  // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
  throw new Error(
    `ExitPlanMode approved but tool_result has no "## Approved Plan:" marker — remote may have hit the empty-plan or isAgent branch. Content preview: ${text.slice(0, 200)}`,
  )
}
