// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// Background memory consolidation. Fires the /dream prompt as a forked
// subagent when time-gate passes AND enough sessions have accumulated.
//
// Gate order (cheapest first):
//   1. Time: hours since lastConsolidatedAt >= minHours (one stat)
//   2. Sessions: transcript count with mtime > lastConsolidatedAt >= minSessions
//   3. Lock: no other process mid-consolidation
//
// State is closure-scoped inside initAutoDream() rather than module-level
// (tests call initAutoDream() in beforeEach for a fresh closure).

// 类型依赖 { REPLHookContext } 来自 ../../utils/hooks/postSamplingHooks.js，用于校准服务层 auto Dream的数据契约。
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
// 整理这一组导入，让服务层 auto Dream后续逻辑可以直接复用这些外部能力。
import {
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 整理这一组导入，让服务层 auto Dream后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  createMemorySavedMessage,
} from '../../utils/messages.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 auto Dream的数据契约。
import type { Message } from '../../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准服务层 auto Dream的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 引入 isAutoMemoryEnabled、getAutoMemPath，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled, getAutoMemPath } from '../../memdir/paths.js'
// 引入 isAutoDreamEnabled，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { isAutoDreamEnabled } from './config.js'
// 复用 getProjectDir 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getProjectDir } from '../../utils/sessionStorage.js'
// 整理这一组导入，让服务层 auto Dream后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getKairosActive,
  getIsRemoteMode,
  getSessionId,
} from '../../bootstrap/state.js'
// 引入 createAutoMemCanUseTool，将 ../extractMemories/extractMemories.js 中已经封装好的能力接到本文件流程里。
import { createAutoMemCanUseTool } from '../extractMemories/extractMemories.js'
// 引入 buildConsolidationPrompt，将 ./consolidationPrompt.js 中已经封装好的能力接到本文件流程里。
import { buildConsolidationPrompt } from './consolidationPrompt.js'
// 整理这一组导入，让服务层 auto Dream后续逻辑可以直接复用这些外部能力。
import {
  readLastConsolidatedAt,
  listSessionsTouchedSince,
  tryAcquireConsolidationLock,
  rollbackConsolidationLock,
} from './consolidationLock.js'
// 整理这一组导入，让服务层 auto Dream后续逻辑可以直接复用这些外部能力。
import {
  registerDreamTask,
  addDreamTurn,
  completeDreamTask,
  failDreamTask,
  isDreamTask,
} from '../../tasks/DreamTask/DreamTask.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'

// Scan throttle: when time-gate passes but session-gate doesn't, the lock
// mtime doesn't advance, so the time-gate keeps passing every turn.
// SESSION_SCAN_INTERVAL_MS 会话数据 命名 `10 * 60 * 1000`，让后续代码直接表达这个值的用途。
const SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000

// AutoDreamConfig 固化服务层 auto Dream里传递的数据形状，帮助调用方按同一结构读写字段。
type AutoDreamConfig = {
  minHours: number
  minSessions: number
}

// DEFAULTS 集合 集中保存服务层 auto Dream要一起传递的字段。
const DEFAULTS: AutoDreamConfig = {
  minHours: 24,
  minSessions: 5,
}

/**
 * Thresholds from tengu_onyx_plover. The enabled gate lives in config.ts
 * (isAutoDreamEnabled); this returns only the scheduling knobs. Defensive
 * per-field validation since GB cache can return stale wrong-type values.
 */
// getConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfig(): AutoDreamConfig {
  // raw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const raw =
    getFeatureValue_CACHED_MAY_BE_STALE<Partial<AutoDreamConfig> | null>(
      'tengu_onyx_plover',
      null,
    )
  // 返回结构化结果，集中表达服务层 auto Dream已经整理出的状态。
  return {
    minHours:
      typeof raw?.minHours === 'number' &&
      Number.isFinite(raw.minHours) &&
      raw.minHours > 0
        ? raw.minHours
        : DEFAULTS.minHours,
    minSessions:
      typeof raw?.minSessions === 'number' &&
      Number.isFinite(raw.minSessions) &&
      raw.minSessions > 0
        ? raw.minSessions
        : DEFAULTS.minSessions,
  }
}

// isGateOpen 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isGateOpen(): boolean {
  // 满足 `getKairosActive()` 时，服务层 auto Dream执行该分支。
  if (getKairosActive()) return false // KAIROS mode uses disk-skill dream
  // 满足 `getIsRemoteMode()` 时，服务层 auto Dream执行该分支。
  if (getIsRemoteMode()) return false
  // 满足 `!isAutoMemoryEnabled()` 时，服务层 auto Dream执行该分支。
  if (!isAutoMemoryEnabled()) return false
  // 返回 `isAutoDreamEnabled()`，作为服务层 auto Dream这次计算的结果。
  return isAutoDreamEnabled()
}

// Ant-build-only test override. Bypasses enabled/time/session gates but NOT
// the lock (so repeated turns don't pile up dreams) or the memory-dir
// precondition. Still scans sessions so the prompt's session-hint is populated.
// isForced 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isForced(): boolean {
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// AppendSystemMessageFn 固化服务层 auto Dream里传递的数据形状，帮助调用方按同一结构读写字段。
type AppendSystemMessageFn = NonNullable<ToolUseContext['appendSystemMessage']>

// 服务层 auto Dream先整理这一处局部数据，后续分支可以直接读取。
let runner:
  | ((
      context: REPLHookContext,
      appendSystemMessage?: AppendSystemMessageFn,
    ) => Promise<void>)
  | null = null

/**
 * Call once at startup (from backgroundHousekeeping alongside
 * initExtractMemories), or per-test in beforeEach for a fresh closure.
 */
// initAutoDream 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initAutoDream(): void {
  // lastSessionScanAt 会话数据保存`0`，供服务层 auto Dream后续判断或输出使用。
  let lastSessionScanAt = 0

  // runner更新为 `async function runAutoDream(context, appendSystemMessage)...`，确保服务层后续读取最新状态。
  runner = async function runAutoDream(context, appendSystemMessage) {
    // cfg读取`getConfig`，供服务层 auto Dream后续处理使用。
    const cfg = getConfig()
    // force保存`isForced`，供服务层 auto Dream后续处理使用。
    const force = isForced()
    // 组合条件 `!force && !isGateOpen()` 成立时，服务层 auto Dream才启用这条专门路径。
    if (!force && !isGateOpen()) return

    // --- Time gate ---
    // lastAt 先占位，稍后的条件分支会根据实际输入补齐它。
    let lastAt: number
    // 保护这一段可能失败的服务层 auto Dream操作，确保异常能进入相邻错误处理。
    try {
      // lastAt更新为 `await readLastConsolidatedAt()`，确保服务层后续读取最新状态。
      lastAt = await readLastConsolidatedAt()
    } catch (e: unknown) {
      // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[autoDream] readLastConsolidatedAt failed: ${(e as Error).message}`,
      )
      // 服务层 auto Dream在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // hoursSince记录时间`Date.now`，供服务层 auto Dream后续处理使用。
    const hoursSince = (Date.now() - lastAt) / 3_600_000
    // 组合条件 `!force && hoursSince < cfg.minHours` 成立时，服务层 auto Dream才启用这条专门路径。
    if (!force && hoursSince < cfg.minHours) return

    // --- Scan throttle ---
    // sinceScanMs 集合记录时间`Date.now`，供服务层 auto Dream后续处理使用。
    const sinceScanMs = Date.now() - lastSessionScanAt
    // 组合条件 `!force && sinceScanMs < SESSION_SCAN_INTERVAL_MS` 成立时，服务层 auto Dream才启用这条专门路径。
    if (!force && sinceScanMs < SESSION_SCAN_INTERVAL_MS) {
      // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[autoDream] scan throttle — time-gate passed but last scan was ${Math.round(sinceScanMs / 1000)}s ago`,
      )
      // 服务层 auto Dream在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // lastSessionScanAt 会话数据更新为 `Date.now()`，确保服务层后续读取最新状态。
    lastSessionScanAt = Date.now()

    // --- Session gate ---
    // sessionIds 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let sessionIds: string[]
    // 保护这一段可能失败的服务层 auto Dream操作，确保异常能进入相邻错误处理。
    try {
      // sessionIds 会话数据更新为 `await listSessionsTouchedSince(lastAt)`，确保服务层后续读取最新状态。
      sessionIds = await listSessionsTouchedSince(lastAt)
    } catch (e: unknown) {
      // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[autoDream] listSessionsTouchedSince failed: ${(e as Error).message}`,
      )
      // 服务层 auto Dream在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Exclude the current session (its mtime is always recent).
    // currentSession 会话数据读取`getSessionId`，供服务层 auto Dream后续处理使用。
    const currentSession = getSessionId()
    // sessionIds 会话数据更新为 `sessionIds.filter(id => id !== currentSession)`，确保服务层后续读取最新状态。
    sessionIds = sessionIds.filter(id => id !== currentSession)
    // 组合条件 `!force && sessionIds.length < cfg.minSessions` 成立时，服务层 auto Dream才启用这条专门路径。
    if (!force && sessionIds.length < cfg.minSessions) {
      // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[autoDream] skip — ${sessionIds.length} sessions since last consolidation, need ${cfg.minSessions}`,
      )
      // 服务层 auto Dream在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // --- Lock ---
    // Under force, skip acquire entirely — use the existing mtime so
    // kill's rollback is a no-op (rewinds to where it already is).
    // The lock file stays untouched; next non-force turn sees it as-is.
    // priorMtime 先占位，稍后的条件分支会根据实际输入补齐它。
    let priorMtime: number | null
    // 满足 `force` 时，服务层 auto Dream执行该分支。
    if (force) {
      // priorMtime更新为 `lastAt`，确保服务层后续读取最新状态。
      priorMtime = lastAt
    } else {
      // 保护这一段可能失败的服务层 auto Dream操作，确保异常能进入相邻错误处理。
      try {
        // priorMtime更新为 `await tryAcquireConsolidationLock()`，确保服务层后续读取最新状态。
        priorMtime = await tryAcquireConsolidationLock()
      } catch (e: unknown) {
        // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[autoDream] lock acquire failed: ${(e as Error).message}`,
        )
        // 服务层 auto Dream在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 满足 `priorMtime === null` 时，服务层 auto Dream执行该分支。
      if (priorMtime === null) return
    }

    // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[autoDream] firing — ${hoursSince.toFixed(1)}h since last, ${sessionIds.length} sessions to review`,
    )
    // 记录服务层 auto Dream运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_auto_dream_fired', {
      hours_since: Math.round(hoursSince),
      sessions_since: sessionIds.length,
    })

    // setAppState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const setAppState =
      context.toolUseContext.setAppStateForTasks ??
      context.toolUseContext.setAppState
    // abortController保存`AbortController`，供服务层 auto Dream后续处理使用。
    const abortController = new AbortController()
    // taskId保存`registerDreamTask`，供服务层 auto Dream后续处理使用。
    const taskId = registerDreamTask(setAppState, {
      sessionsReviewing: sessionIds.length,
      priorMtime,
      abortController,
    })

    // 保护这一段可能失败的服务层 auto Dream操作，确保异常能进入相邻错误处理。
    try {
      // memoryRoot读取`getAutoMemPath`，供服务层 auto Dream后续处理使用。
      const memoryRoot = getAutoMemPath()
      // transcriptDir读取`getProjectDir`，供服务层 auto Dream后续处理使用。
      const transcriptDir = getProjectDir(getOriginalCwd())
      // Tool constraints note goes in `extra`, not the shared prompt body —
      // manual /dream runs in the main loop with normal permissions and this
      // would be misleading there.
      // extra 命名 ```，让后续代码直接表达这个值的用途。
      const extra = `

**Tool constraints for this run:** Bash is restricted to read-only commands (\`ls\`, \`find\`, \`grep\`, \`cat\`, \`stat\`, \`wc\`, \`head\`, \`tail\`, and similar). Anything that writes, redirects to a file, or modifies state will be denied. Plan your exploration with this in mind — no need to probe.

Sessions since last consolidation (${sessionIds.length}):
${sessionIds.map(id => `- ${id}`).join('\n')}`
      const prompt = buildConsolidationPrompt(memoryRoot, transcriptDir, extra)

      const result = await runForkedAgent({
        promptMessages: [createUserMessage({ content: prompt })],
        cacheSafeParams: createCacheSafeParams(context),
        canUseTool: createAutoMemCanUseTool(memoryRoot),
        querySource: 'auto_dream',
        forkLabel: 'auto_dream',
        skipTranscript: true,
        overrides: { abortController },
        onMessage: makeDreamProgressWatcher(taskId, setAppState),
      })

      completeDreamTask(taskId, setAppState)
      // Inline completion summary in the main transcript (same surface as
      // extractMemories's "Saved N memories" message).
      const dreamState = context.toolUseContext.getAppState().tasks?.[taskId]
      if (
        appendSystemMessage &&
        isDreamTask(dreamState) &&
        dreamState.filesTouched.length > 0
      ) {
        appendSystemMessage({
          ...createMemorySavedMessage(dreamState.filesTouched),
          verb: 'Improved',
        })
      }
      logForDebugging(
        `[autoDream] completed — cache: read=${result.totalUsage.cache_read_input_tokens} created=${result.totalUsage.cache_creation_input_tokens}`,
      )
      logEvent('tengu_auto_dream_completed', {
        cache_read: result.totalUsage.cache_read_input_tokens,
        cache_created: result.totalUsage.cache_creation_input_tokens,
        output: result.totalUsage.output_tokens,
        sessions_reviewed: sessionIds.length,
      })
    } catch (e: unknown) {
      // If the user killed from the bg-tasks dialog, DreamTask.kill already
      // aborted, rolled back the lock, and set status=killed. Don't overwrite
      // or double-rollback.
      if (abortController.signal.aborted) {
        logForDebugging('[autoDream] aborted by user')
        return
      }
      logForDebugging(`[autoDream] fork failed: ${(e as Error).message}`)
      logEvent('tengu_auto_dream_failed', {})
      failDreamTask(taskId, setAppState)
      // Rewind mtime so time-gate passes again. Scan throttle is the backoff.
      await rollbackConsolidationLock(priorMtime)
    }
  }
}

/**
 * Watch the forked agent's messages. For each assistant turn, extracts any
 * text blocks (the agent's reasoning/summary — what the user wants to see)
 * and collapses tool_use blocks to a count. Edit/Write file_paths are
 * collected for phase-flip + the inline completion message.
 */
function makeDreamProgressWatcher(
  taskId: string,
  setAppState: import('../../Task.js').SetAppState,
): (msg: Message) => void {
  return msg => {
    if (msg.type !== 'assistant') return
    let text = ''
    let toolUseCount = 0
    const touchedPaths: string[] = []
    for (const block of msg.message.content) {
      if (block.type === 'text') {
        text += block.text
      } else if (block.type === 'tool_use') {
        toolUseCount++
        if (
          block.name === FILE_EDIT_TOOL_NAME ||
          block.name === FILE_WRITE_TOOL_NAME
        ) {
          const input = block.input as { file_path?: unknown }
          if (typeof input.file_path === 'string') {
            touchedPaths.push(input.file_path)
          }
        }
      }
    }
    addDreamTurn(
      taskId,
      { text: text.trim(), toolUseCount },
      touchedPaths,
      setAppState,
    )
  }
}

/**
 * Entry point from stopHooks. No-op until initAutoDream() has been called.
 * Per-turn cost when enabled: one GB cache read + one stat.
 */
export async function executeAutoDream(
  context: REPLHookContext,
  appendSystemMessage?: AppendSystemMessageFn,
): Promise<void> {
  await runner?.(context, appendSystemMessage)
}
