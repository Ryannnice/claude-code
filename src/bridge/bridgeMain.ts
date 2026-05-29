// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 hostname、tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { hostname, tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join, resolve } from 'path'
// 引入 getRemoteSessionUrl，将 ../constants/product.js 中已经封装好的能力接到本文件流程里。
import { getRemoteSessionUrl } from '../constants/product.js'
// 接入 shutdownDatadog 服务层能力，把外部通信或共享状态交给 ../services/analytics/datadog.js 处理。
import { shutdownDatadog } from '../services/analytics/datadog.js'
// 接入 shutdown1PEventLogging 服务层能力，把外部通信或共享状态交给 ../services/analytics/firstPartyEventLogger.js 处理。
import { shutdown1PEventLogging } from '../services/analytics/firstPartyEventLogger.js'
// 接入 checkGate_CACHED_OR_BLOCKING 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { checkGate_CACHED_OR_BLOCKING } from '../services/analytics/growthbook.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
  logEventAsync,
} from '../services/analytics/index.js'
// 复用 isInBundledMode 工具函数，把通用处理留在 ../utils/bundledMode.js 中维护。
import { isInBundledMode } from '../utils/bundledMode.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 isEnvTruthy、isInProtectedNamespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy, isInProtectedNamespace } from '../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { truncateToWidth } from '../utils/format.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 sleep 工具函数，把通用处理留在 ../utils/sleep.js 中维护。
import { sleep } from '../utils/sleep.js'
// 复用 createAgentWorktree、removeAgentWorktree 工具函数，把通用处理留在 ../utils/worktree.js 中维护。
import { createAgentWorktree, removeAgentWorktree } from '../utils/worktree.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  BridgeFatalError,
  createBridgeApiClient,
  isExpiredErrorType,
  isSuppressible403,
  validateBridgeId,
} from './bridgeApi.js'
// 引入 formatDuration，将 ./bridgeStatusUtil.js 中已经封装好的能力接到本文件流程里。
import { formatDuration } from './bridgeStatusUtil.js'
// 引入 createBridgeLogger，将 ./bridgeUI.js 中已经封装好的能力接到本文件流程里。
import { createBridgeLogger } from './bridgeUI.js'
// 引入 createCapacityWake，将 ./capacityWake.js 中已经封装好的能力接到本文件流程里。
import { createCapacityWake } from './capacityWake.js'
// 引入 describeAxiosError，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { describeAxiosError } from './debugUtils.js'
// 引入 createTokenRefreshScheduler，将 ./jwtUtils.js 中已经封装好的能力接到本文件流程里。
import { createTokenRefreshScheduler } from './jwtUtils.js'
// 引入 getPollIntervalConfig，将 ./pollConfig.js 中已经封装好的能力接到本文件流程里。
import { getPollIntervalConfig } from './pollConfig.js'
// 引入 toCompatSessionId、toInfraSessionId，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { toCompatSessionId, toInfraSessionId } from './sessionIdCompat.js'
// 引入 createSessionSpawner、safeFilenameId，将 ./sessionRunner.js 中已经封装好的能力接到本文件流程里。
import { createSessionSpawner, safeFilenameId } from './sessionRunner.js'
// 引入 getTrustedDeviceToken，将 ./trustedDevice.js 中已经封装好的能力接到本文件流程里。
import { getTrustedDeviceToken } from './trustedDevice.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  BRIDGE_LOGIN_ERROR,
  type BridgeApiClient,
  type BridgeConfig,
  type BridgeLogger,
  DEFAULT_SESSION_TIMEOUT_MS,
  type SessionDoneStatus,
  type SessionHandle,
  type SessionSpawner,
  type SessionSpawnOpts,
  type SpawnMode,
} from './types.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  buildCCRv2SdkUrl,
  buildSdkUrl,
  decodeWorkSecret,
  registerWorker,
  sameSessionId,
} from './workSecret.js'

// BackoffConfig 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackoffConfig = {
  connInitialMs: number
  connCapMs: number
  connGiveUpMs: number
  generalInitialMs: number
  generalCapMs: number
  generalGiveUpMs: number
  /** SIGTERM→SIGKILL grace period on shutdown. Default 30s. */
  shutdownGraceMs?: number
  /** stopWorkWithRetry base delay (1s/2s/4s backoff). Default 1000ms. */
  stopWorkBaseDelayMs?: number
}

// DEFAULT_BACKOFF 集中保存远程桥接 bridge Main要一起传递的字段。
const DEFAULT_BACKOFF: BackoffConfig = {
  connInitialMs: 2_000,
  connCapMs: 120_000, // 2 minutes
  connGiveUpMs: 600_000, // 10 minutes
  generalInitialMs: 500,
  generalCapMs: 30_000,
  generalGiveUpMs: 600_000, // 10 minutes
}

/** Status update interval for the live display (ms). */
// STATUS_UPDATE_INTERVAL_MS 集合保存`1_000`，供后续判断或组装使用。
const STATUS_UPDATE_INTERVAL_MS = 1_000
// SPAWN_SESSIONS_DEFAULT 会话数据 命名 `32`，让后续代码直接表达这个值的用途。
const SPAWN_SESSIONS_DEFAULT = 32

/**
 * GrowthBook gate for multi-session spawn modes (--spawn / --capacity / --create-session-in-dir).
 * Sibling of tengu_ccr_bridge_multi_environment (multiple envs per host:dir) —
 * this one enables multiple sessions per environment.
 * Rollout staged via targeting rules: ants first, then gradual external.
 *
 * Uses the blocking gate check so a stale disk-cache miss doesn't unfairly
 * deny access. The fast path (cache has true) is still instant; only the
 * cold-start path awaits the server fetch, and that fetch also seeds the
 * disk cache for next time.
 */
// isMultiSessionSpawnEnabled 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isMultiSessionSpawnEnabled(): Promise<boolean> {
  // 返回 `checkGate_CACHED_OR_BLOCKING('tengu_ccr_bridge_multi_session')`，作为远程桥接会话这次计算的结果。
  return checkGate_CACHED_OR_BLOCKING('tengu_ccr_bridge_multi_session')
}

/**
 * Returns the threshold for detecting system sleep/wake in the poll loop.
 * Must exceed the max backoff cap — otherwise normal backoff delays trigger
 * false sleep detection (resetting the error budget indefinitely). Using
 * 2× the connection backoff cap, matching the pattern in WebSocketTransport
 * and replBridge.
 */
// pollSleepDetectionThresholdMs 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pollSleepDetectionThresholdMs(backoff: BackoffConfig): number {
  // 返回 `backoff.connCapMs * 2`，作为远程桥接会话这次计算的结果。
  return backoff.connCapMs * 2
}

/**
 * Returns the args that must precede CLI flags when spawning a child claude
 * process. In compiled binaries, process.execPath is the claude binary itself
 * and args go directly to it. In npm installs (node running cli.js),
 * process.execPath is the node runtime — the child spawn must pass the script
 * path as the first arg, otherwise node interprets --sdk-url as a node option
 * and exits with "bad option: --sdk-url". See anthropics/claude-code#28334.
 */
// spawnScriptArgs 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function spawnScriptArgs(): string[] {
  // 组合条件 `isInBundledMode() || !process.argv[1]` 成立时，远程桥接会话才启用这条专门路径。
  if (isInBundledMode() || !process.argv[1]) {
    // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
    return []
  }
  // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
  return [process.argv[1]]
}

/** Attempt to spawn a session; returns error string if spawn throws. */
// safeSpawn 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function safeSpawn(
  spawner: SessionSpawner,
  opts: SessionSpawnOpts,
  dir: string,
): SessionHandle | string {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `spawner.spawn(opts, dir)`，作为远程桥接会话这次计算的结果。
    return spawner.spawn(opts, dir)
  } catch (err) {
    // errMsg保存`errorMessage`，供远程桥接会话后续处理使用。
    const errMsg = errorMessage(err)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Session spawn failed: ${errMsg}`))
    // 返回 `errMsg`，作为远程桥接会话这次计算的结果。
    return errMsg
  }
}

// runBridgeLoop 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runBridgeLoop(
  config: BridgeConfig,
  environmentId: string,
  environmentSecret: string,
  api: BridgeApiClient,
  spawner: SessionSpawner,
  logger: BridgeLogger,
  signal: AbortSignal,
  backoffConfig: BackoffConfig = DEFAULT_BACKOFF,
  initialSessionId?: string,
  // 这个回调绑定到 getAccessToken?: () => string | undefined | Promise<string | undefined>,，负责远程桥接会话在该局部场景下的响应。
  getAccessToken?: () => string | undefined | Promise<string | undefined>,
): Promise<void> {
  // Local abort controller so that onSessionDone can stop the poll loop.
  // Linked to the incoming signal so external aborts also work.
  // controller保存`AbortController`，供远程桥接会话后续处理使用。
  const controller = new AbortController()
  // 满足 `signal.aborted` 时，远程桥接会话执行该分支。
  if (signal.aborted) {
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    controller.abort()
  } else {
    // 调用 signal.addEventListener，触发远程桥接会话此处需要的副作用。
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  // loopSignal保存`controller.signal`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
  const loopSignal = controller.signal

  // activeSessions 会话数据构建`new Map<string, SessionHandle>()` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
  const activeSessions = new Map<string, SessionHandle>()
  // sessionStartTimes 会话数据构建`new Map<string, number>()`，供后续判断或组装使用。
  const sessionStartTimes = new Map<string, number>()
  // sessionWorkIds 会话数据构建`new Map<string, string>()`，供后续判断或组装使用。
  const sessionWorkIds = new Map<string, string>()
  // Compat-surface ID (session_*) computed once at spawn and cached so
  // cleanup and status-update ticks use the same key regardless of whether
  // the tengu_bridge_repl_v2_cse_shim_enabled gate flips mid-session.
  // sessionCompatIds 会话数据 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const sessionCompatIds = new Map<string, string>()
  // Session ingress JWTs for heartbeat auth, keyed by sessionId.
  // Stored separately from handle.accessToken because the token refresh
  // scheduler overwrites that field with the OAuth token (~3h55m in).
  // sessionIngressTokens 会话数据构建`new Map<string, string>()`，供后续判断或组装使用。
  const sessionIngressTokens = new Map<string, string>()
  // sessionTimers 会话数据构建`new Map<string, ReturnType<typeof setTimeout>>()` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
  const sessionTimers = new Map<string, ReturnType<typeof setTimeout>>()
  // completedWorkIds 集合构建`new Set<string>()`，供后续判断或组装使用。
  const completedWorkIds = new Set<string>()
  // sessionWorktrees 会话数据构建`new Map<` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
  const sessionWorktrees = new Map<
    string,
    {
      worktreePath: string
      worktreeBranch?: string
      gitRoot?: string
      hookBased?: boolean
    }
  >()
  // Track sessions killed by the timeout watchdog so onSessionDone can
  // distinguish them from server-initiated or shutdown interrupts.
  // timedOutSessions 会话数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const timedOutSessions = new Set<string>()
  // Sessions that already have a title (server-set or bridge-derived) so
  // onFirstUserMessage doesn't clobber a user-assigned --name / web rename.
  // Keyed by compatSessionId to match logger.setSessionTitle's key.
  // titledSessions 会话数据构建`new Set<string>()` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
  const titledSessions = new Set<string>()
  // Signal to wake the at-capacity sleep early when a session completes,
  // so the bridge can immediately accept new work.
  // capacityWake构建`createCapacityWake`，供远程桥接会话后续处理使用。
  const capacityWake = createCapacityWake(loopSignal)

  /**
   * Heartbeat all active work items.
   * Returns 'ok' if at least one heartbeat succeeded, 'auth_failed' if any
   * got a 401/403 (JWT expired — re-queued via reconnectSession so the next
   * poll delivers fresh work), or 'failed' if all failed for other reasons.
   */
  // heartbeatActiveWorkItems 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function heartbeatActiveWorkItems(): Promise<
    'ok' | 'auth_failed' | 'fatal' | 'failed'
  > {
    // anySuccess 集合标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
    let anySuccess = false
    // anyFatal标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
    let anyFatal = false
    // authFailedSessions 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const authFailedSessions: string[] = []
    // 循环处理 `const [sessionId] of activeSessions`，让远程桥接会话逐项把同类条目按顺序走完。
    for (const [sessionId] of activeSessions) {
      // workId读取`sessionWorkIds.get`，供远程桥接会话后续处理使用。
      const workId = sessionWorkIds.get(sessionId)
      // ingressToken读取`sessionIngressTokens.get`，供远程桥接会话后续处理使用。
      const ingressToken = sessionIngressTokens.get(sessionId)
      // 组合条件 `!workId || !ingressToken` 成立时，远程桥接会话才启用这条专门路径。
      if (!workId || !ingressToken) {
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `api.heartbeatWork(environmentId, workId, ingressToken)` 完成，再继续远程桥接 bridge Main的异步流程。
        await api.heartbeatWork(environmentId, workId, ingressToken)
        // anySuccess 集合更新为 `true`，确保Bridge 通信后续读取最新状态。
        anySuccess = true
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:heartbeat] Failed for sessionId=${sessionId} workId=${workId}: ${errorMessage(err)}`,
        )
        // 满足 `err instanceof BridgeFatalError` 时，远程桥接会话执行该分支。
        if (err instanceof BridgeFatalError) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bridge_heartbeat_error', {
            status:
              err.status as unknown as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            error_type: (err.status === 401 || err.status === 403
              ? 'auth_failed'
              : 'fatal') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 组合条件 `err.status === 401 || err.status === 403` 成立时，远程桥接会话才启用这条专门路径。
          if (err.status === 401 || err.status === 403) {
            // authFailedSessions 会话数据追加新条目，保持收集顺序与输入顺序一致。
            authFailedSessions.push(sessionId)
          } else {
            // 404/410 = environment expired or deleted — no point retrying
            // anyFatal更新为 `true`，确保Bridge 通信后续读取最新状态。
            anyFatal = true
          }
        }
      }
    }
    // JWT expired → trigger server-side re-dispatch. Without this, work stays
    // ACK'd out of the Redis PEL and poll returns empty forever (CC-1263).
    // The existingHandle path below delivers the fresh token to the child.
    // sessionId is already in the format /bridge/reconnect expects: it comes
    // from work.data.id, which matches the server's EnvironmentInstance store
    // (cse_* under the compat gate, session_* otherwise).
    // 按顺序遍历 `authFailedSessions` 中的sessionId 会话数据，逐个交给远程桥接会话处理。
    for (const sessionId of authFailedSessions) {
      // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
      logger.logVerbose(
        `Session ${sessionId} token expired — re-queuing via bridge/reconnect`,
      )
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `api.reconnectSession(environmentId, sessionId)` 完成，再继续远程桥接 bridge Main的异步流程。
        await api.reconnectSession(environmentId, sessionId)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:heartbeat] Re-queued sessionId=${sessionId} via bridge/reconnect`,
        )
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logger.logError(
          `Failed to refresh session ${sessionId} token: ${errorMessage(err)}`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:heartbeat] reconnectSession(${sessionId}) failed: ${errorMessage(err)}`,
          { level: 'error' },
        )
      }
    }
    // 满足 `anyFatal` 时，远程桥接会话执行该分支。
    if (anyFatal) {
      // 返回 `'fatal'`，作为远程桥接会话这次计算的结果。
      return 'fatal'
    }
    // 满足 `authFailedSessions.length > 0` 时，远程桥接会话执行该分支。
    if (authFailedSessions.length > 0) {
      // 返回 `'auth_failed'`，作为远程桥接会话这次计算的结果。
      return 'auth_failed'
    }
    // 返回 `anySuccess ? 'ok' : 'failed'`，作为远程桥接会话这次计算的结果。
    return anySuccess ? 'ok' : 'failed'
  }

  // Sessions spawned with CCR v2 env vars. v2 children cannot use OAuth
  // tokens (CCR worker endpoints validate the JWT's session_id claim,
  // register_worker.go:32), so onRefresh triggers server re-dispatch
  // instead — the next poll delivers fresh work with a new JWT via the
  // existingHandle path below.
  // v2Sessions 会话数据构建`new Set<string>()`，供后续判断或组装使用。
  const v2Sessions = new Set<string>()

  // Proactive token refresh: schedules a timer 5min before the session
  // ingress JWT expires. v1 delivers OAuth directly; v2 calls
  // reconnectSession to trigger server re-dispatch (CC-1263: without
  // this, v2 daemon sessions silently die at ~5h since the server does
  // not auto-re-dispatch ACK'd work on lease expiry).
  // tokenRefresh读取`getAccessToken`，供后续判断或组装使用。
  const tokenRefresh = getAccessToken
    ? createTokenRefreshScheduler({
        getAccessToken,
        // 这个回调绑定到 onRefresh: (sessionId, oauthToken) => {，负责远程桥接会话在该局部场景下的响应。
        onRefresh: (sessionId, oauthToken) => {
          // handle读取`activeSessions.get`，供远程桥接会话后续处理使用。
          const handle = activeSessions.get(sessionId)
          // handle缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
          if (!handle) {
            // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // 满足 `v2Sessions.has(sessionId)` 时，远程桥接会话执行该分支。
          if (v2Sessions.has(sessionId)) {
            // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
            logger.logVerbose(
              `Refreshing session ${sessionId} token via bridge/reconnect`,
            )
            // 显式忽略 `api` 的返回值，只保留它触发的副作用。
            void api
              .reconnectSession(environmentId, sessionId)
              // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
              .catch((err: unknown) => {
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logger.logError(
                  `Failed to refresh session ${sessionId} token: ${errorMessage(err)}`,
                )
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:token] reconnectSession(${sessionId}) failed: ${errorMessage(err)}`,
                  { level: 'error' },
                )
              })
          } else {
            // 调用 handle.updateAccessToken，触发远程桥接会话此处需要的副作用。
            handle.updateAccessToken(oauthToken)
          }
        },
        label: 'bridge',
      })
    : null
  // loopStartTime记录时间`Date.now`，供远程桥接会话后续处理使用。
  const loopStartTime = Date.now()
  // Track all in-flight cleanup promises (stopWork, worktree removal) so
  // the shutdown sequence can await them before process.exit().
  // pendingCleanups 集合构建`new Set<Promise<unknown>>()`，供后续判断或组装使用。
  const pendingCleanups = new Set<Promise<unknown>>()
  // trackCleanup 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function trackCleanup(p: Promise<unknown>): void {
    // 调用 pendingCleanups.add，触发远程桥接会话此处需要的副作用。
    pendingCleanups.add(p)
    // 这个回调绑定到 void p.finally(() => pendingCleanups.delete(p))，负责远程桥接会话在该局部场景下的响应。
    void p.finally(() => pendingCleanups.delete(p))
  }
  // connBackoff 命名 `0`，让后续代码直接表达这个值的用途。
  let connBackoff = 0
  // generalBackoff 命名 `0`，让后续代码直接表达这个值的用途。
  let generalBackoff = 0
  // connErrorStart 错误信息初始化为空值，后续分支会在有数据时补齐。
  let connErrorStart: number | null = null
  // generalErrorStart 错误信息保存`null`，作为后续空值处理的输入。
  let generalErrorStart: number | null = null
  // lastPollErrorTime 错误信息初始化为空值，后续分支会在有数据时补齐。
  let lastPollErrorTime: number | null = null
  // statusUpdateTimer保存`null`，作为后续空值处理的输入。
  let statusUpdateTimer: ReturnType<typeof setInterval> | null = null
  // Set by BridgeFatalError and give-up paths so the shutdown block can
  // skip the resume message (resume is impossible after env expiry/auth
  // failure/sustained connection errors).
  // fatalExit标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  let fatalExit = false

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:work] Starting poll loop spawnMode=${config.spawnMode} maxSessions=${config.maxSessions} environmentId=${environmentId}`,
  )
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_loop_started', {
    max_sessions: config.maxSessions,
    spawn_mode: config.spawnMode,
  })

  // For ant users, show where session debug logs will land so they can tail them.
  // sessionRunner.ts uses the same base path. File appears once a session spawns.
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，远程桥接会话执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // debugGlob 先占位，稍后的条件分支会根据实际输入补齐它。
    let debugGlob: string
    // 满足 `config.debugFile` 时，远程桥接会话执行该分支。
    if (config.debugFile) {
      // ext保存`debugFile.lastIndexOf`，供远程桥接会话后续处理使用。
      const ext = config.debugFile.lastIndexOf('.')
      // 远程桥接 bridge Main在这里处理 `debugGlob =`，完成这一小步状态转换。
      debugGlob =
        ext > 0
          ? `${config.debugFile.slice(0, ext)}-*${config.debugFile.slice(ext)}`
          : `${config.debugFile}-*`
    } else {
      // debugGlob更新为 `join(tmpdir(), 'claude', 'bridge-session-*.log')`，确保Bridge 通信后续读取最新状态。
      debugGlob = join(tmpdir(), 'claude', 'bridge-session-*.log')
    }
    // logger.setDebugLogPath 写入新的状态值，使远程桥接会话后续读取保持一致。
    logger.setDebugLogPath(debugGlob)
  }

  // 调用 logger.printBanner，触发远程桥接会话此处需要的副作用。
  logger.printBanner(config, environmentId)

  // Seed the logger's session count + spawn mode before any render. Without
  // this, setAttached() below renders with the logger's default sessionMax=1,
  // showing "Capacity: 0/1" until the status ticker kicks in (which is gated
  // by !initialSessionId and only starts after the poll loop picks up work).
  // 调用 logger.updateSessionCount，触发远程桥接会话此处需要的副作用。
  logger.updateSessionCount(0, config.maxSessions, config.spawnMode)

  // If an initial session was pre-created, show its URL from the start so
  // the user can click through immediately (matching /remote-control behavior).
  // 满足 `initialSessionId` 时，远程桥接会话执行该分支。
  if (initialSessionId) {
    // logger.setAttached 写入新的状态值，使远程桥接会话后续读取保持一致。
    logger.setAttached(initialSessionId)
  }

  /** Refresh the inline status display. Shows idle or active depending on state. */
  // updateStatusDisplay 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function updateStatusDisplay(): void {
    // Push the session count (no-op when maxSessions === 1) so the
    // next renderStatusLine tick shows the current count.
    // 调用 logger.updateSessionCount，触发远程桥接会话此处需要的副作用。
    logger.updateSessionCount(
      activeSessions.size,
      config.maxSessions,
      config.spawnMode,
    )

    // Push per-session activity into the multi-session display.
    // 循环处理 `const [sid, handle] of activeSessions`，让远程桥接会话逐项把同类条目按顺序走完。
    for (const [sid, handle] of activeSessions) {
      // act保存`handle.currentActivity`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
      const act = handle.currentActivity
      // 满足 `act` 时，远程桥接会话执行该分支。
      if (act) {
        // 调用 logger.updateSessionActivity，触发远程桥接会话此处需要的副作用。
        logger.updateSessionActivity(sessionCompatIds.get(sid) ?? sid, act)
      }
    }

    // 满足 `activeSessions.size === 0` 时，远程桥接会话执行该分支。
    if (activeSessions.size === 0) {
      // 调用 logger.updateIdleStatus，触发远程桥接会话此处需要的副作用。
      logger.updateIdleStatus()
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Show the most recently started session that is still actively working.
    // Sessions whose current activity is 'result' or 'error' are between
    // turns — the CLI emitted its result but the process stays alive waiting
    // for the next user message.  Skip updating so the status line keeps
    // whatever state it had (Attached / session title).
    // 从 `[...activeSessions.entries()].pop()!` 按位置拆出 sessionId、handle，让远程桥接 bridge Main分别处理这些返回值。
    const [sessionId, handle] = [...activeSessions.entries()].pop()!
    // startTime读取`sessionStartTimes.get`，供远程桥接会话后续处理使用。
    const startTime = sessionStartTimes.get(sessionId)
    // startTime缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!startTime) return

    // activity保存`handle.currentActivity`，供后续判断或组装使用。
    const activity = handle.currentActivity
    // 组合条件 `!activity || activity.type === 'result' || activi` 成立时，远程桥接会话才启用这条专门路径。
    if (!activity || activity.type === 'result' || activity.type === 'error') {
      // Session is between turns — keep current status (Attached/titled).
      // In multi-session mode, still refresh so bullet-list activities stay current.
      // 满足 `config.maxSessions > 1) logger.refreshDisplay(` 时，远程桥接会话执行该分支。
      if (config.maxSessions > 1) logger.refreshDisplay()
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // elapsed格式化`formatDuration`，供远程桥接会话后续处理使用。
    const elapsed = formatDuration(Date.now() - startTime)

    // Build trail from recent tool activities (last 5)
    // trail保存`handle.activities`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
    const trail = handle.activities
      // 链式调用 filter，继续加工上一行在远程桥接会话中产生的数据。
      .filter(a => a.type === 'tool_start')
      .slice(-5)
      // 链式调用 map，继续加工上一行在远程桥接会话中产生的数据。
      .map(a => a.summary)

    // 调用 logger.updateSessionStatus，触发远程桥接会话此处需要的副作用。
    logger.updateSessionStatus(sessionId, elapsed, activity, trail)
  }

  /** Start the status display update ticker. */
  // startStatusUpdates 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function startStatusUpdates(): void {
    // 调用 stopStatusUpdates，触发远程桥接会话此处需要的副作用。
    stopStatusUpdates()
    // Call immediately so the first transition (e.g. Connecting → Ready)
    // happens without delay, avoiding concurrent timer races.
    // 调用 updateStatusDisplay，触发远程桥接会话此处需要的副作用。
    updateStatusDisplay()
    // statusUpdateTimer更新为 `setInterval(`，确保Bridge 通信后续读取最新状态。
    statusUpdateTimer = setInterval(
      updateStatusDisplay,
      STATUS_UPDATE_INTERVAL_MS,
    )
  }

  /** Stop the status display update ticker. */
  // stopStatusUpdates 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function stopStatusUpdates(): void {
    // 满足 `statusUpdateTimer` 时，远程桥接会话执行该分支。
    if (statusUpdateTimer) {
      // 调用 clearInterval，触发远程桥接会话此处需要的副作用。
      clearInterval(statusUpdateTimer)
      // statusUpdateTimer更新为 `null`，确保Bridge 通信后续读取最新状态。
      statusUpdateTimer = null
    }
  }

  // onSessionDone 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onSessionDone(
    sessionId: string,
    startTime: number,
    handle: SessionHandle,
  ): (status: SessionDoneStatus) => void {
    // return 使用 rawStatus: SessionDoneStatus 完成远程桥接会话里的对应操作。
    return (rawStatus: SessionDoneStatus): void => {
      // workId读取`sessionWorkIds.get`，供远程桥接会话后续处理使用。
      const workId = sessionWorkIds.get(sessionId)
      // 调用 activeSessions.delete，触发远程桥接会话此处需要的副作用。
      activeSessions.delete(sessionId)
      // 调用 sessionStartTimes.delete，触发远程桥接会话此处需要的副作用。
      sessionStartTimes.delete(sessionId)
      // 调用 sessionWorkIds.delete，触发远程桥接会话此处需要的副作用。
      sessionWorkIds.delete(sessionId)
      // 调用 sessionIngressTokens.delete，触发远程桥接会话此处需要的副作用。
      sessionIngressTokens.delete(sessionId)
      // compatId读取`sessionCompatIds.get`，供远程桥接会话后续处理使用。
      const compatId = sessionCompatIds.get(sessionId) ?? sessionId
      // 调用 sessionCompatIds.delete，触发远程桥接会话此处需要的副作用。
      sessionCompatIds.delete(sessionId)
      // 调用 logger.removeSession，触发远程桥接会话此处需要的副作用。
      logger.removeSession(compatId)
      // 调用 titledSessions.delete，触发远程桥接会话此处需要的副作用。
      titledSessions.delete(compatId)
      // 调用 v2Sessions.delete，触发远程桥接会话此处需要的副作用。
      v2Sessions.delete(sessionId)
      // Clear per-session timeout timer
      // timer读取`sessionTimers.get`，供远程桥接会话后续处理使用。
      const timer = sessionTimers.get(sessionId)
      // 满足 `timer` 时，远程桥接会话执行该分支。
      if (timer) {
        // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
        clearTimeout(timer)
        // 调用 sessionTimers.delete，触发远程桥接会话此处需要的副作用。
        sessionTimers.delete(sessionId)
      }
      // Clear token refresh timer
      // 调用 tokenRefresh?.cancel(sessionId)，完成这一处局部操作。
      tokenRefresh?.cancel(sessionId)
      // Wake the at-capacity sleep so the bridge can accept new work immediately
      // 调用 capacityWake.wake，触发远程桥接会话此处需要的副作用。
      capacityWake.wake()

      // If the session was killed by the timeout watchdog, treat it as a
      // failed session (not a server/shutdown interrupt) so we still call
      // stopWork and archiveSession below.
      // wasTimedOut保存`timedOutSessions.delete`，供远程桥接会话后续处理使用。
      const wasTimedOut = timedOutSessions.delete(sessionId)
      // status 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      const status: SessionDoneStatus =
        wasTimedOut && rawStatus === 'interrupted' ? 'failed' : rawStatus
      // durationMs 集合记录时间`Date.now`，供远程桥接会话后续处理使用。
      const durationMs = Date.now() - startTime

      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:session] sessionId=${sessionId} workId=${workId ?? 'unknown'} exited status=${status} duration=${formatDuration(durationMs)}`,
      )
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_session_done', {
        status:
          status as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        duration_ms: durationMs,
      })
      // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
      logForDiagnosticsNoPII('info', 'bridge_session_done', {
        status,
        duration_ms: durationMs,
      })

      // Clear the status display before printing final log
      // 调用 logger.clearStatus，触发远程桥接会话此处需要的副作用。
      logger.clearStatus()
      // 调用 stopStatusUpdates，触发远程桥接会话此处需要的副作用。
      stopStatusUpdates()

      // Build error message from stderr if available
      // stderrSummary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const stderrSummary =
        handle.lastStderr.length > 0 ? handle.lastStderr.join('\n') : undefined
      // failureMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let failureMessage: string | undefined

      // 按照 status 的取值选择远程桥接会话的具体处理分支。
      switch (status) {
        case 'completed':
          // 调用 logger.logSessionComplete，触发远程桥接会话此处需要的副作用。
          logger.logSessionComplete(sessionId, durationMs)
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        case 'failed':
          // Skip failure log during shutdown — the child exits non-zero when
          // killed, which is expected and not a real failure.
          // Also skip for timeout-killed sessions — the timeout watchdog
          // already logged a clear timeout message.
          // 组合条件 `!wasTimedOut && !loopSignal.aborted` 成立时，远程桥接会话才启用这条专门路径。
          if (!wasTimedOut && !loopSignal.aborted) {
            // failureMessage 消息数据更新为 `stderrSummary ?? 'Process exited with error'`，确保Bridge 通信后续读取最新状态。
            failureMessage = stderrSummary ?? 'Process exited with error'
            // 调用 logger.logSessionFailed，触发远程桥接会话此处需要的副作用。
            logger.logSessionFailed(sessionId, failureMessage)
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logError(new Error(`Bridge session failed: ${failureMessage}`))
          }
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        case 'interrupted':
          // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
          logger.logVerbose(`Session ${sessionId} interrupted`)
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
      }

      // Notify the server that this work item is done. Skip for interrupted
      // sessions — interrupts are either server-initiated (the server already
      // knows) or caused by bridge shutdown (which calls stopWork() separately).
      // `status` 与 `'interrupted' && workId` 不一致时刷新派生状态，避免使用过期结果。
      if (status !== 'interrupted' && workId) {
        // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
        trackCleanup(
          stopWorkWithRetry(
            api,
            environmentId,
            workId,
            logger,
            backoffConfig.stopWorkBaseDelayMs,
          ),
        )
        // 调用 completedWorkIds.add，触发远程桥接会话此处需要的副作用。
        completedWorkIds.add(workId)
      }

      // Clean up worktree if one was created for this session
      // wt读取`sessionWorktrees.get`，供远程桥接会话后续处理使用。
      const wt = sessionWorktrees.get(sessionId)
      // 满足 `wt` 时，远程桥接会话执行该分支。
      if (wt) {
        // 调用 sessionWorktrees.delete，触发远程桥接会话此处需要的副作用。
        sessionWorktrees.delete(sessionId)
        // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
        trackCleanup(
          removeAgentWorktree(
            wt.worktreePath,
            wt.worktreeBranch,
            wt.gitRoot,
            wt.hookBased,
          // 这个回调绑定到 ).catch((err: unknown) =>，负责远程桥接会话在该局部场景下的响应。
          ).catch((err: unknown) =>
            logger.logVerbose(
              `Failed to remove worktree ${wt.worktreePath}: ${errorMessage(err)}`,
            ),
          ),
        )
      }

      // Lifecycle decision: in multi-session mode, keep the bridge running
      // after a session completes. In single-session mode, abort the poll
      // loop so the bridge exits cleanly.
      // `status` 与 `'interrupted' && !loopSignal.ab...` 不一致时刷新派生状态，避免使用过期结果。
      if (status !== 'interrupted' && !loopSignal.aborted) {
        // `config.spawnMode` 与 `'single-session'` 不一致时刷新派生状态，避免使用过期结果。
        if (config.spawnMode !== 'single-session') {
          // Multi-session: archive the completed session so it doesn't linger
          // as stale in the web UI. archiveSession is idempotent (409 if already
          // archived), so double-archiving at shutdown is safe.
          // sessionId arrived as cse_* from the work poll (infrastructure-layer
          // tag). archiveSession hits /v1/sessions/{id}/archive which is the
          // compat surface and validates TagSession (session_*). Re-tag — same
          // UUID underneath.
          // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
          trackCleanup(
            api
              .archiveSession(compatId)
              // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
              .catch((err: unknown) =>
                logger.logVerbose(
                  `Failed to archive session ${sessionId}: ${errorMessage(err)}`,
                ),
              ),
          )
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:session] Session ${status}, returning to idle (multi-session mode)`,
          )
        } else {
          // Single-session: coupled lifecycle — tear down environment
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:session] Session ${status}, aborting poll loop to tear down environment`,
          )
          // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
          controller.abort()
          // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }

      // loopSignal.aborted缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!loopSignal.aborted) {
        // 调用 startStatusUpdates，触发远程桥接会话此处需要的副作用。
        startStatusUpdates()
      }
    }
  }

  // Start the idle status display immediately — unless we have a pre-created
  // session, in which case setAttached() already set up the display and the
  // poll loop will start status updates when it picks up the session.
  // initialSessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!initialSessionId) {
    // 调用 startStatusUpdates，触发远程桥接会话此处需要的副作用。
    startStatusUpdates()
  }

  // while 使用 !loopSignal.aborted 完成远程桥接会话里的对应操作。
  while (!loopSignal.aborted) {
    // Fetched once per iteration — the GrowthBook cache refreshes every
    // 5 min, so a loop running at the at-capacity rate picks up config
    // changes within one sleep cycle.
    // pollConfig 配置读取`getPollIntervalConfig`，供远程桥接会话后续处理使用。
    const pollConfig = getPollIntervalConfig()

    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // work保存`api.pollForWork`，供远程桥接会话后续处理使用。
      const work = await api.pollForWork(
        environmentId,
        environmentSecret,
        loopSignal,
        pollConfig.reclaim_older_than_ms,
      )

      // Log reconnection if we were previously disconnected
      // wasDisconnected 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const wasDisconnected =
        connErrorStart !== null || generalErrorStart !== null
      // 满足 `wasDisconnected` 时，远程桥接会话执行该分支。
      if (wasDisconnected) {
        // disconnectedMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const disconnectedMs =
          Date.now() - (connErrorStart ?? generalErrorStart ?? Date.now())
        // 调用 logger.logReconnected，触发远程桥接会话此处需要的副作用。
        logger.logReconnected(disconnectedMs)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:poll] Reconnected after ${formatDuration(disconnectedMs)}`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_reconnected', {
          disconnected_ms: disconnectedMs,
        })
      }

      // connBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
      connBackoff = 0
      // generalBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
      generalBackoff = 0
      // connErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
      connErrorStart = null
      // generalErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
      generalErrorStart = null
      // lastPollErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
      lastPollErrorTime = null

      // Null response = no work available in the queue.
      // Add a minimum delay to avoid hammering the server.
      // work缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!work) {
        // Use live check (not a snapshot) since sessions can end during poll.
        // atCap 命名 `activeSessions.size >= config.maxSessions`，让后续代码直接表达这个值的用途。
        const atCap = activeSessions.size >= config.maxSessions
        // 满足 `atCap` 时，远程桥接会话执行该分支。
        if (atCap) {
          // atCapMs 集合 命名 `pollConfig.multisession_poll_interval_ms_at_capacity`，让后续代码直接表达这个值的用途。
          const atCapMs = pollConfig.multisession_poll_interval_ms_at_capacity
          // Heartbeat loops WITHOUT polling. When at-capacity polling is also
          // enabled (atCapMs > 0), the loop tracks a deadline and breaks out
          // to poll at that interval — heartbeat and poll compose instead of
          // one suppressing the other. We break out to poll when:
          //   - Poll deadline reached (atCapMs > 0 only)
          //   - Auth fails (JWT expired → poll refreshes tokens)
          //   - Capacity wake fires (session ended → poll for new work)
          //   - Loop aborted (shutdown)
          // 满足 `pollConfig.non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
          if (pollConfig.non_exclusive_heartbeat_interval_ms > 0) {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_heartbeat_mode_entered', {
              active_sessions: activeSessions.size,
              heartbeat_interval_ms:
                pollConfig.non_exclusive_heartbeat_interval_ms,
            })
            // Deadline computed once at entry — GB updates to atCapMs don't
            // shift an in-flight deadline (next entry picks up the new value).
            // pollDeadline记录时间`Date.now`，供远程桥接会话后续处理使用。
            const pollDeadline = atCapMs > 0 ? Date.now() + atCapMs : null
            // hbResult保存`'ok'`，作为后续固定文本处理的输入。
            let hbResult: 'ok' | 'auth_failed' | 'fatal' | 'failed' = 'ok'
            // hbCycles 集合保存`0`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
            let hbCycles = 0
            // 调用 while，触发远程桥接会话此处需要的副作用。
            while (
              !loopSignal.aborted &&
              activeSessions.size >= config.maxSessions &&
              (pollDeadline === null || Date.now() < pollDeadline)
            ) {
              // Re-read config each cycle so GrowthBook updates take effect
              // hbConfig 配置读取`getPollIntervalConfig`，供远程桥接会话后续处理使用。
              const hbConfig = getPollIntervalConfig()
              // 满足 `hbConfig.non_exclusive_heartbeat_interval_ms <= 0` 时，远程桥接会话执行该分支。
              if (hbConfig.non_exclusive_heartbeat_interval_ms <= 0) break

              // Capture capacity signal BEFORE the async heartbeat call so
              // a session ending during the HTTP request is caught by the
              // subsequent sleep (instead of being lost to a replaced controller).
              // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
              const cap = capacityWake.signal()

              // hbResult更新为 `await heartbeatActiveWorkItems()`，确保Bridge 通信后续读取最新状态。
              hbResult = await heartbeatActiveWorkItems()
              // 当 `hbResult` 匹配 `'auth_failed' || hbResult =...` 时，远程桥接会话执行对应分支。
              if (hbResult === 'auth_failed' || hbResult === 'fatal') {
                // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
                cap.cleanup()
                // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
                break
              }

              // 远程桥接 bridge Main在这里处理 `hbCycles++`，完成这一小步状态转换。
              hbCycles++
              // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
              await sleep(
                hbConfig.non_exclusive_heartbeat_interval_ms,
                cap.signal,
              )
              // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
              cap.cleanup()
            }

            // Determine exit reason for telemetry
            // exitReason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const exitReason =
              hbResult === 'auth_failed' || hbResult === 'fatal'
                ? hbResult
                : loopSignal.aborted
                  ? 'shutdown'
                  : activeSessions.size < config.maxSessions
                    ? 'capacity_changed'
                    : pollDeadline !== null && Date.now() >= pollDeadline
                      ? 'poll_due'
                      : 'config_disabled'
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_heartbeat_mode_exited', {
              reason:
                exitReason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              heartbeat_cycles: hbCycles,
              active_sessions: activeSessions.size,
            })
            // 当 `exitReason` 匹配 `'poll_due'` 时，远程桥接会话执行对应分支。
            if (exitReason === 'poll_due') {
              // bridgeApi throttles empty-poll logs (EMPTY_POLL_LOG_INTERVAL=100)
              // so the once-per-10min poll_due poll is invisible at counter=2.
              // Log it here so verification runs see both endpoints in the debug log.
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:poll] Heartbeat poll_due after ${hbCycles} cycles — falling through to pollForWork`,
              )
            }

            // On auth_failed or fatal, sleep before polling to avoid a tight
            // poll+heartbeat loop. Auth_failed: heartbeatActiveWorkItems
            // already called reconnectSession — the sleep gives the server
            // time to propagate the re-queue. Fatal (404/410): may be a
            // single work item GCd while the environment is still valid.
            // Use atCapMs if enabled, else the heartbeat interval as a floor
            // (guaranteed > 0 here) so heartbeat-only configs don't tight-loop.
            // 当 `hbResult` 匹配 `'auth_failed' || hbResult =...` 时，远程桥接会话执行对应分支。
            if (hbResult === 'auth_failed' || hbResult === 'fatal') {
              // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
              const cap = capacityWake.signal()
              // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
              await sleep(
                atCapMs > 0
                  ? atCapMs
                  : pollConfig.non_exclusive_heartbeat_interval_ms,
                cap.signal,
              )
              // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
              cap.cleanup()
            }
          // 远程桥接 bridge Main在这里处理 `} else if (atCapMs > 0) {`，完成这一小步状态转换。
          } else if (atCapMs > 0) {
            // Heartbeat disabled: slow poll as liveness signal.
            // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
            const cap = capacityWake.signal()
            // 等待 `sleep(atCapMs, cap.signal)` 完成，再继续远程桥接 bridge Main的异步流程。
            await sleep(atCapMs, cap.signal)
            // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
            cap.cleanup()
          }
        } else {
          // interval 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const interval =
            activeSessions.size > 0
              ? pollConfig.multisession_poll_interval_ms_partial_capacity
              : pollConfig.multisession_poll_interval_ms_not_at_capacity
          // 等待 `sleep(interval, loopSignal)` 完成，再继续远程桥接 bridge Main的异步流程。
          await sleep(interval, loopSignal)
        }
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // At capacity — we polled to keep the heartbeat alive, but cannot
      // accept new work right now. We still enter the switch below so that
      // token refreshes for existing sessions are processed (the case
      // 'session' handler checks for existing sessions before the inner
      // capacity guard).
      // atCapacityBeforeSwitch统计`activeSessions.size >= config.maxSessions` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
      const atCapacityBeforeSwitch = activeSessions.size >= config.maxSessions

      // Skip work items that have already been completed and stopped.
      // The server may re-deliver stale work before processing our stop
      // request, which would otherwise cause a duplicate session spawn.
      // 满足 `completedWorkIds.has(work.id)` 时，远程桥接会话执行该分支。
      if (completedWorkIds.has(work.id)) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:work] Skipping already-completed workId=${work.id}`,
        )
        // Respect capacity throttle — without a sleep here, persistent stale
        // redeliveries would tight-loop at poll-request speed (the !work
        // branch above is the only sleep, and work != null skips it).
        // 满足 `atCapacityBeforeSwitch` 时，远程桥接会话执行该分支。
        if (atCapacityBeforeSwitch) {
          // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
          const cap = capacityWake.signal()
          // 满足 `pollConfig.non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
          if (pollConfig.non_exclusive_heartbeat_interval_ms > 0) {
            // 等待 `heartbeatActiveWorkItems()` 完成，再继续远程桥接 bridge Main的异步流程。
            await heartbeatActiveWorkItems()
            // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
            await sleep(
              pollConfig.non_exclusive_heartbeat_interval_ms,
              cap.signal,
            )
          // 远程桥接 bridge Main在这里处理 `} else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {`，完成这一小步状态转换。
          } else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {
            // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
            await sleep(
              pollConfig.multisession_poll_interval_ms_at_capacity,
              cap.signal,
            )
          }
          // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
          cap.cleanup()
        } else {
          // 等待 `sleep(1000, loopSignal)` 完成，再继续远程桥接 bridge Main的异步流程。
          await sleep(1000, loopSignal)
        }
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // Decode the work secret for session spawning and to extract the JWT
      // used for the ack call below.
      // secret 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let secret
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // secret更新为 `decodeWorkSecret(work.secret)`，确保Bridge 通信后续读取最新状态。
        secret = decodeWorkSecret(work.secret)
      } catch (err) {
        // errMsg保存`errorMessage`，供远程桥接会话后续处理使用。
        const errMsg = errorMessage(err)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logger.logError(
          `Failed to decode work secret for workId=${work.id}: ${errMsg}`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_work_secret_failed', {})
        // Can't ack (needs the JWT we failed to decode). stopWork uses OAuth,
        // so it's callable here — prevents XAUTOCLAIM from re-delivering this
        // poisoned item every reclaim_older_than_ms cycle.
        // 调用 completedWorkIds.add，触发远程桥接会话此处需要的副作用。
        completedWorkIds.add(work.id)
        // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
        trackCleanup(
          stopWorkWithRetry(
            api,
            environmentId,
            work.id,
            logger,
            backoffConfig.stopWorkBaseDelayMs,
          ),
        )
        // Respect capacity throttle before retrying — without a sleep here,
        // repeated decode failures at capacity would tight-loop at
        // poll-request speed (work != null skips the !work sleep above).
        // 满足 `atCapacityBeforeSwitch` 时，远程桥接会话执行该分支。
        if (atCapacityBeforeSwitch) {
          // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
          const cap = capacityWake.signal()
          // 满足 `pollConfig.non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
          if (pollConfig.non_exclusive_heartbeat_interval_ms > 0) {
            // 等待 `heartbeatActiveWorkItems()` 完成，再继续远程桥接 bridge Main的异步流程。
            await heartbeatActiveWorkItems()
            // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
            await sleep(
              pollConfig.non_exclusive_heartbeat_interval_ms,
              cap.signal,
            )
          // 远程桥接 bridge Main在这里处理 `} else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {`，完成这一小步状态转换。
          } else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {
            // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
            await sleep(
              pollConfig.multisession_poll_interval_ms_at_capacity,
              cap.signal,
            )
          }
          // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
          cap.cleanup()
        }
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // Explicitly acknowledge after committing to handle the work — NOT
      // before. The at-capacity guard inside case 'session' can break
      // without spawning; acking there would permanently lose the work.
      // Ack failures are non-fatal: server re-delivers, and existingHandle
      // / completedWorkIds paths handle the dedup.
      // ackWork保存`async`，供远程桥接会话后续处理使用。
      const ackWork = async (): Promise<void> => {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[bridge:work] Acknowledging workId=${work.id}`)
        // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `api.acknowledgeWork(` 完成，再继续远程桥接 bridge Main的异步流程。
          await api.acknowledgeWork(
            environmentId,
            work.id,
            secret.session_ingress_token,
          )
        } catch (err) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:work] Acknowledge failed workId=${work.id}: ${errorMessage(err)}`,
          )
        }
      }

      // workType保存`work.data.type`，供远程桥接 bridge Main后续判断或输出使用。
      const workType: string = work.data.type
      // 按照 work.data.type 的取值选择远程桥接会话的具体处理分支。
      switch (work.data.type) {
        case 'healthcheck':
          // 等待 `ackWork()` 完成，再继续远程桥接 bridge Main的异步流程。
          await ackWork()
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[bridge:work] Healthcheck received')
          // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
          logger.logVerbose('Healthcheck received')
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        case 'session': {
          // sessionId 会话数据保存`work.data.id`，供后续判断或组装使用。
          const sessionId = work.data.id
          // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
          try {
            // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
            validateBridgeId(sessionId, 'session_id')
          } catch {
            // 等待 `ackWork()` 完成，再继续远程桥接 bridge Main的异步流程。
            await ackWork()
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logger.logError(`Invalid session_id received: ${sessionId}`)
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }

          // If the session is already running, deliver the fresh token so
          // the child process can reconnect its WebSocket with the new
          // session ingress token. This handles the case where the server
          // re-dispatches work for an existing session after the WS drops.
          // existingHandle读取`activeSessions.get`，供远程桥接会话后续处理使用。
          const existingHandle = activeSessions.get(sessionId)
          // 满足 `existingHandle` 时，远程桥接会话执行该分支。
          if (existingHandle) {
            // 调用 existingHandle.updateAccessToken，触发远程桥接会话此处需要的副作用。
            existingHandle.updateAccessToken(secret.session_ingress_token)
            // sessionIngressTokens.set 写入新的状态值，使远程桥接会话后续读取保持一致。
            sessionIngressTokens.set(sessionId, secret.session_ingress_token)
            // sessionWorkIds.set 写入新的状态值，使远程桥接会话后续读取保持一致。
            sessionWorkIds.set(sessionId, work.id)
            // Re-schedule next refresh from the fresh JWT's expiry. onRefresh
            // branches on v2Sessions so both v1 and v2 are safe here.
            // 调用 tokenRefresh?.schedule(sessionId, secret.session_ingress_token)，完成这一处局部操作。
            tokenRefresh?.schedule(sessionId, secret.session_ingress_token)
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:work] Updated access token for existing sessionId=${sessionId} workId=${work.id}`,
            )
            // 等待 `ackWork()` 完成，再继续远程桥接 bridge Main的异步流程。
            await ackWork()
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }

          // At capacity — token refresh for existing sessions is handled
          // above, but we cannot spawn new ones. The post-switch capacity
          // sleep will throttle the loop; just break here.
          // 满足 `activeSessions.size >= config.maxSessions` 时，远程桥接会话执行该分支。
          if (activeSessions.size >= config.maxSessions) {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:work] At capacity (${activeSessions.size}/${config.maxSessions}), cannot spawn new session for workId=${work.id}`,
            )
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }

          // 等待 `ackWork()` 完成，再继续远程桥接 bridge Main的异步流程。
          await ackWork()
          // spawnStartTime记录时间`Date.now`，供远程桥接会话后续处理使用。
          const spawnStartTime = Date.now()

          // CCR v2 path: register this bridge as the session worker, get the
          // epoch, and point the child at /v1/code/sessions/{id}. The child
          // already has the full v2 client (SSETransport + CCRClient) — same
          // code path environment-manager launches in containers.
          //
          // v1 path: Session-Ingress WebSocket. Uses config.sessionIngressUrl
          // (not secret.api_base_url, which may point to a remote proxy tunnel
          // that doesn't know about locally-created sessions).
          // sdkUrl 先占位，稍后的条件分支会根据实际输入补齐它。
          let sdkUrl: string
          // useCcrV2标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
          let useCcrV2 = false
          // workerEpoch 先占位，稍后的条件分支会根据实际输入补齐它。
          let workerEpoch: number | undefined
          // Server decides per-session via the work secret; env var is the
          // ant-dev override (e.g. forcing v2 before the server flag is on).
          // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
          if (
            secret.use_code_sessions === true ||
            isEnvTruthy(process.env.CLAUDE_BRIDGE_USE_CCR_V2)
          ) {
            // sdkUrl更新为 `buildCCRv2SdkUrl(config.apiBaseUrl, sessionId)`，确保Bridge 通信后续读取最新状态。
            sdkUrl = buildCCRv2SdkUrl(config.apiBaseUrl, sessionId)
            // Retry once on transient failure (network blip, 500) before
            // permanently giving up and killing the session.
            // 循环处理 `let attempt = 1; attempt <= 2; attempt++`，让远程桥接会话逐项把同类条目按顺序走完。
            for (let attempt = 1; attempt <= 2; attempt++) {
              // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
              try {
                // workerEpoch更新为 `await registerWorker(`，确保Bridge 通信后续读取最新状态。
                workerEpoch = await registerWorker(
                  sdkUrl,
                  secret.session_ingress_token,
                )
                // useCcrV2更新为 `true`，确保Bridge 通信后续读取最新状态。
                useCcrV2 = true
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:session] CCR v2: registered worker sessionId=${sessionId} epoch=${workerEpoch} attempt=${attempt}`,
                )
                // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
                break
              } catch (err) {
                // errMsg保存`errorMessage`，供远程桥接会话后续处理使用。
                const errMsg = errorMessage(err)
                // 满足 `attempt < 2` 时，远程桥接会话执行该分支。
                if (attempt < 2) {
                  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `[bridge:session] CCR v2: registerWorker attempt ${attempt} failed, retrying: ${errMsg}`,
                  )
                  // 等待 `sleep(2_000, loopSignal)` 完成，再继续远程桥接 bridge Main的异步流程。
                  await sleep(2_000, loopSignal)
                  // 满足 `loopSignal.aborted` 时，远程桥接会话执行该分支。
                  if (loopSignal.aborted) break
                  // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
                  continue
                }
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logger.logError(
                  `CCR v2 worker registration failed for session ${sessionId}: ${errMsg}`,
                )
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logError(new Error(`registerWorker failed: ${errMsg}`))
                // 调用 completedWorkIds.add，触发远程桥接会话此处需要的副作用。
                completedWorkIds.add(work.id)
                // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
                trackCleanup(
                  stopWorkWithRetry(
                    api,
                    environmentId,
                    work.id,
                    logger,
                    backoffConfig.stopWorkBaseDelayMs,
                  ),
                )
              }
            }
            // useCcrV2缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
            if (!useCcrV2) break
          } else {
            // sdkUrl更新为 `buildSdkUrl(config.sessionIngressUrl, sessionId)`，确保Bridge 通信后续读取最新状态。
            sdkUrl = buildSdkUrl(config.sessionIngressUrl, sessionId)
          }

          // In worktree mode, on-demand sessions get an isolated git worktree
          // so concurrent sessions don't interfere with each other's file
          // changes. The pre-created initial session (if any) runs in
          // config.dir so the user's first session lands in the directory they
          // invoked `rc` from — matching the old single-session UX.
          // In same-dir and single-session modes, all sessions share config.dir.
          // Capture spawnMode before the await below — the `w` key handler
          // mutates config.spawnMode directly, and createAgentWorktree can
          // take 1-2s, so reading config.spawnMode after the await can
          // produce contradictory analytics (spawn_mode:'same-dir', in_worktree:true).
          // spawnModeAtDecision 命名 `config.spawnMode`，让后续代码直接表达这个值的用途。
          const spawnModeAtDecision = config.spawnMode
          // sessionDir 会话数据保存`config.dir`，供后续判断或组装使用。
          let sessionDir = config.dir
          // worktreeCreateMs 集合保存`0`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
          let worktreeCreateMs = 0
          // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
          if (
            spawnModeAtDecision === 'worktree' &&
            (initialSessionId === undefined ||
              !sameSessionId(sessionId, initialSessionId))
          ) {
            // wtStart记录时间`Date.now`，供远程桥接会话后续处理使用。
            const wtStart = Date.now()
            // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
            try {
              // wt构建`createAgentWorktree`，供远程桥接会话后续处理使用。
              const wt = await createAgentWorktree(
                `bridge-${safeFilenameId(sessionId)}`,
              )
              // worktreeCreateMs 集合更新为 `Date.now() - wtStart`，确保Bridge 通信后续读取最新状态。
              worktreeCreateMs = Date.now() - wtStart
              // sessionWorktrees.set 写入新的状态值，使远程桥接会话后续读取保持一致。
              sessionWorktrees.set(sessionId, {
                worktreePath: wt.worktreePath,
                worktreeBranch: wt.worktreeBranch,
                gitRoot: wt.gitRoot,
                hookBased: wt.hookBased,
              })
              // sessionDir 会话数据更新为 `wt.worktreePath`，确保Bridge 通信后续读取最新状态。
              sessionDir = wt.worktreePath
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:session] Created worktree for sessionId=${sessionId} at ${wt.worktreePath}`,
              )
            } catch (err) {
              // errMsg保存`errorMessage`，供远程桥接会话后续处理使用。
              const errMsg = errorMessage(err)
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logger.logError(
                `Failed to create worktree for session ${sessionId}: ${errMsg}`,
              )
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logError(new Error(`Worktree creation failed: ${errMsg}`))
              // 调用 completedWorkIds.add，触发远程桥接会话此处需要的副作用。
              completedWorkIds.add(work.id)
              // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
              trackCleanup(
                stopWorkWithRetry(
                  api,
                  environmentId,
                  work.id,
                  logger,
                  backoffConfig.stopWorkBaseDelayMs,
                ),
              )
              // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
              break
            }
          }

          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:session] Spawning sessionId=${sessionId} sdkUrl=${sdkUrl}`,
          )

          // compat-surface session_* form for logger/Sessions-API calls.
          // Work poll returns cse_* under v2 compat; convert before spawn so
          // the onFirstUserMessage callback can close over it.
          // compatSessionId 会话数据保存`toCompatSessionId`，供远程桥接会话后续处理使用。
          const compatSessionId = toCompatSessionId(sessionId)

          // spawnResult保存`safeSpawn`，供远程桥接会话后续处理使用。
          const spawnResult = safeSpawn(
            spawner,
            {
              sessionId,
              sdkUrl,
              accessToken: secret.session_ingress_token,
              useCcrV2,
              workerEpoch,
              // 这个回调绑定到 onFirstUserMessage: text => {，负责远程桥接会话在该局部场景下的响应。
              onFirstUserMessage: text => {
                // Server-set titles (--name, web rename) win. fetchSessionTitle
                // runs concurrently; if it already populated titledSessions,
                // skip. If it hasn't resolved yet, the derived title sticks —
                // acceptable since the server had no title at spawn time.
                // 满足 `titledSessions.has(compatSessionId)` 时，远程桥接会话执行该分支。
                if (titledSessions.has(compatSessionId)) return
                // 调用 titledSessions.add，触发远程桥接会话此处需要的副作用。
                titledSessions.add(compatSessionId)
                // title 标题保存`deriveSessionTitle`，供远程桥接会话后续处理使用。
                const title = deriveSessionTitle(text)
                // logger.setSessionTitle 写入新的状态值，使远程桥接会话后续读取保持一致。
                logger.setSessionTitle(compatSessionId, title)
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:title] derived title for ${compatSessionId}: ${title}`,
                )
                // 显式忽略 `import('./createSession.js')` 的返回值，只保留它触发的副作用。
                void import('./createSession.js')
                  // 链式调用 then，继续加工上一行在远程桥接会话中产生的数据。
                  .then(({ updateBridgeSessionTitle }) =>
                    updateBridgeSessionTitle(compatSessionId, title, {
                      baseUrl: config.apiBaseUrl,
                    }),
                  )
                  // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
                  .catch(err =>
                    logForDebugging(
                      `[bridge:title] failed to update title for ${compatSessionId}: ${err}`,
                      { level: 'error' },
                    ),
                  )
              },
            },
            sessionDir,
          )
          // 当 `typeof spawnResult` 匹配 `'string'` 时，远程桥接会话执行对应分支。
          if (typeof spawnResult === 'string') {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logger.logError(
              `Failed to spawn session ${sessionId}: ${spawnResult}`,
            )
            // Clean up worktree if one was created for this session
            // wt读取`sessionWorktrees.get`，供远程桥接会话后续处理使用。
            const wt = sessionWorktrees.get(sessionId)
            // 满足 `wt` 时，远程桥接会话执行该分支。
            if (wt) {
              // 调用 sessionWorktrees.delete，触发远程桥接会话此处需要的副作用。
              sessionWorktrees.delete(sessionId)
              // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
              trackCleanup(
                removeAgentWorktree(
                  wt.worktreePath,
                  wt.worktreeBranch,
                  wt.gitRoot,
                  wt.hookBased,
                // 这个回调绑定到 ).catch((err: unknown) =>，负责远程桥接会话在该局部场景下的响应。
                ).catch((err: unknown) =>
                  logger.logVerbose(
                    `Failed to remove worktree ${wt.worktreePath}: ${errorMessage(err)}`,
                  ),
                ),
              )
            }
            // 调用 completedWorkIds.add，触发远程桥接会话此处需要的副作用。
            completedWorkIds.add(work.id)
            // 调用 trackCleanup，触发远程桥接会话此处需要的副作用。
            trackCleanup(
              stopWorkWithRetry(
                api,
                environmentId,
                work.id,
                logger,
                backoffConfig.stopWorkBaseDelayMs,
              ),
            )
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }
          // handle 命名 `spawnResult`，让后续代码直接表达这个值的用途。
          const handle = spawnResult

          // spawnDurationMs 集合记录时间`Date.now`，供远程桥接会话后续处理使用。
          const spawnDurationMs = Date.now() - spawnStartTime
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bridge_session_started', {
            active_sessions: activeSessions.size,
            spawn_mode:
              spawnModeAtDecision as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            in_worktree: sessionWorktrees.has(sessionId),
            spawn_duration_ms: spawnDurationMs,
            worktree_create_ms: worktreeCreateMs,
            inProtectedNamespace: isInProtectedNamespace(),
          })
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII('info', 'bridge_session_started', {
            spawn_mode: spawnModeAtDecision,
            in_worktree: sessionWorktrees.has(sessionId),
            spawn_duration_ms: spawnDurationMs,
            worktree_create_ms: worktreeCreateMs,
          })

          // activeSessions.set 写入新的状态值，使远程桥接会话后续读取保持一致。
          activeSessions.set(sessionId, handle)
          // sessionWorkIds.set 写入新的状态值，使远程桥接会话后续读取保持一致。
          sessionWorkIds.set(sessionId, work.id)
          // sessionIngressTokens.set 写入新的状态值，使远程桥接会话后续读取保持一致。
          sessionIngressTokens.set(sessionId, secret.session_ingress_token)
          // sessionCompatIds.set 写入新的状态值，使远程桥接会话后续读取保持一致。
          sessionCompatIds.set(sessionId, compatSessionId)

          // startTime记录时间`Date.now`，供远程桥接会话后续处理使用。
          const startTime = Date.now()
          // sessionStartTimes.set 写入新的状态值，使远程桥接会话后续读取保持一致。
          sessionStartTimes.set(sessionId, startTime)

          // Use a generic prompt description since we no longer get startup_context
          // 调用 logger.logSessionStart，触发远程桥接会话此处需要的副作用。
          logger.logSessionStart(sessionId, `Session ${sessionId}`)

          // Compute the actual debug file path (mirrors sessionRunner.ts logic)
          // safeId保存`safeFilenameId`，供远程桥接会话后续处理使用。
          const safeId = safeFilenameId(sessionId)
          // sessionDebugFile 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
          let sessionDebugFile: string | undefined
          // 满足 `config.debugFile` 时，远程桥接会话执行该分支。
          if (config.debugFile) {
            // ext保存`debugFile.lastIndexOf`，供远程桥接会话后续处理使用。
            const ext = config.debugFile.lastIndexOf('.')
            // 满足 `ext > 0` 时，远程桥接会话执行该分支。
            if (ext > 0) {
              // sessionDebugFile 会话数据更新为 ``${config.debugFile.slice(0, ext)}-${safeId}${config.debu...`，确保Bridge 通信后续读取最新状态。
              sessionDebugFile = `${config.debugFile.slice(0, ext)}-${safeId}${config.debugFile.slice(ext)}`
            } else {
              // sessionDebugFile 会话数据更新为 ``${config.debugFile}-${safeId}``，确保Bridge 通信后续读取最新状态。
              sessionDebugFile = `${config.debugFile}-${safeId}`
            }
          // 远程桥接 bridge Main在这里处理 `} else if (config.verbose || process.env.USER_TYPE === 'ant') {`，完成这一小步状态转换。
          } else if (config.verbose || process.env.USER_TYPE === 'ant') {
            // sessionDebugFile 会话数据更新为 `join(`，确保Bridge 通信后续读取最新状态。
            sessionDebugFile = join(
              tmpdir(),
              'claude',
              `bridge-session-${safeId}.log`,
            )
          }

          // 满足 `sessionDebugFile` 时，远程桥接会话执行该分支。
          if (sessionDebugFile) {
            // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
            logger.logVerbose(`Debug log: ${sessionDebugFile}`)
          }

          // Register in the sessions Map before starting status updates so the
          // first render tick shows the correct count and bullet list in sync.
          // 调用 logger.addSession，触发远程桥接会话此处需要的副作用。
          logger.addSession(
            compatSessionId,
            getRemoteSessionUrl(compatSessionId, config.sessionIngressUrl),
          )

          // Start live status updates and transition to "Attached" state.
          // 调用 startStatusUpdates，触发远程桥接会话此处需要的副作用。
          startStatusUpdates()
          // logger.setAttached 写入新的状态值，使远程桥接会话后续读取保持一致。
          logger.setAttached(compatSessionId)

          // One-shot title fetch. If the session already has a title (set via
          // --name, web rename, or /remote-control), display it and mark as
          // titled so the first-user-message fallback doesn't overwrite it.
          // Otherwise onFirstUserMessage derives one from the first prompt.
          // 显式忽略 `fetchSessionTitle(compatSessionId, config.apiBaseUrl)` 的返回值，只保留它触发的副作用。
          void fetchSessionTitle(compatSessionId, config.apiBaseUrl)
            // 链式调用 then，继续加工上一行在远程桥接会话中产生的数据。
            .then(title => {
              // 组合条件 `title && activeSessions.has(sessionId)` 成立时，远程桥接会话才启用这条专门路径。
              if (title && activeSessions.has(sessionId)) {
                // 调用 titledSessions.add，触发远程桥接会话此处需要的副作用。
                titledSessions.add(compatSessionId)
                // logger.setSessionTitle 写入新的状态值，使远程桥接会话后续读取保持一致。
                logger.setSessionTitle(compatSessionId, title)
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:title] server title for ${compatSessionId}: ${title}`,
                )
              }
            })
            // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
            .catch(err =>
              logForDebugging(
                `[bridge:title] failed to fetch title for ${compatSessionId}: ${err}`,
                { level: 'error' },
              ),
            )

          // Start per-session timeout watchdog
          // timeoutMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const timeoutMs =
            config.sessionTimeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS
          // 满足 `timeoutMs > 0` 时，远程桥接会话执行该分支。
          if (timeoutMs > 0) {
            // timer保存`setTimeout`，供远程桥接会话后续处理使用。
            const timer = setTimeout(
              onSessionTimeout,
              timeoutMs,
              sessionId,
              timeoutMs,
              logger,
              timedOutSessions,
              handle,
            )
            // sessionTimers.set 写入新的状态值，使远程桥接会话后续读取保持一致。
            sessionTimers.set(sessionId, timer)
          }

          // Schedule proactive token refresh before the JWT expires.
          // onRefresh branches on v2Sessions: v1 delivers OAuth to the
          // child, v2 triggers server re-dispatch via reconnectSession.
          // 满足 `useCcrV2` 时，远程桥接会话执行该分支。
          if (useCcrV2) {
            // 调用 v2Sessions.add，触发远程桥接会话此处需要的副作用。
            v2Sessions.add(sessionId)
          }
          // 调用 tokenRefresh?.schedule(sessionId, secret.session_ingress_token)，完成这一处局部操作。
          tokenRefresh?.schedule(sessionId, secret.session_ingress_token)

          // 显式忽略 `handle.done.then(onSessionDone(sessionId, startTime, handle))` 的返回值，只保留它触发的副作用。
          void handle.done.then(onSessionDone(sessionId, startTime, handle))
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        }
        default:
          // 等待 `ackWork()` 完成，再继续远程桥接 bridge Main的异步流程。
          await ackWork()
          // Gracefully ignore unknown work types. The backend may send new
          // types before the bridge client is updated.
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:work] Unknown work type: ${workType}, skipping`,
          )
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
      }

      // When at capacity, throttle the loop. The switch above still runs so
      // existing-session token refreshes are processed, but we sleep here
      // to avoid busy-looping. Include the capacity wake signal so the
      // sleep is interrupted immediately when a session completes.
      // 满足 `atCapacityBeforeSwitch` 时，远程桥接会话执行该分支。
      if (atCapacityBeforeSwitch) {
        // cap保存`capacityWake.signal`，供远程桥接会话后续处理使用。
        const cap = capacityWake.signal()
        // 满足 `pollConfig.non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
        if (pollConfig.non_exclusive_heartbeat_interval_ms > 0) {
          // 等待 `heartbeatActiveWorkItems()` 完成，再继续远程桥接 bridge Main的异步流程。
          await heartbeatActiveWorkItems()
          // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
          await sleep(
            pollConfig.non_exclusive_heartbeat_interval_ms,
            cap.signal,
          )
        // 远程桥接 bridge Main在这里处理 `} else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {`，完成这一小步状态转换。
        } else if (pollConfig.multisession_poll_interval_ms_at_capacity > 0) {
          // 等待 `sleep(` 完成，再继续远程桥接 bridge Main的异步流程。
          await sleep(
            pollConfig.multisession_poll_interval_ms_at_capacity,
            cap.signal,
          )
        }
        // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
        cap.cleanup()
      }
    } catch (err) {
      // 满足 `loopSignal.aborted` 时，远程桥接会话执行该分支。
      if (loopSignal.aborted) {
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }

      // Fatal errors (401/403) — no point retrying, auth won't fix itself
      // 满足 `err instanceof BridgeFatalError` 时，远程桥接会话执行该分支。
      if (err instanceof BridgeFatalError) {
        // fatalExit更新为 `true`，确保Bridge 通信后续读取最新状态。
        fatalExit = true
        // Server-enforced expiry gets a clean status message, not an error
        // 满足 `isExpiredErrorType(err.errorType)` 时，远程桥接会话执行该分支。
        if (isExpiredErrorType(err.errorType)) {
          // 调用 logger.logStatus，触发远程桥接会话此处需要的副作用。
          logger.logStatus(err.message)
        // 远程桥接 bridge Main在这里处理 `} else if (isSuppressible403(err)) {`，完成这一小步状态转换。
        } else if (isSuppressible403(err)) {
          // Cosmetic 403 errors (e.g., external_poll_sessions scope,
          // environments:manage permission) — don't show to user
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`[bridge:work] Suppressed 403 error: ${err.message}`)
        } else {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logger.logError(err.message)
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logError(err)
        }
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_fatal_error', {
          status: err.status,
          error_type:
            err.errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII(
          isExpiredErrorType(err.errorType) ? 'info' : 'error',
          'bridge_fatal_error',
          { status: err.status, error_type: err.errorType },
        )
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }

      // errMsg保存`describeAxiosError`，供远程桥接会话后续处理使用。
      const errMsg = describeAxiosError(err)

      // 组合条件 `isConnectionError(err) || isServerError(err)` 成立时，远程桥接会话才启用这条专门路径。
      if (isConnectionError(err) || isServerError(err)) {
        // now记录时间`Date.now`，供远程桥接会话后续处理使用。
        const now = Date.now()

        // Detect system sleep/wake: if the gap since the last poll error
        // greatly exceeds the expected backoff, the machine likely slept.
        // Reset error tracking so the bridge retries with a fresh budget.
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          lastPollErrorTime !== null &&
          now - lastPollErrorTime > pollSleepDetectionThresholdMs(backoffConfig)
        ) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:work] Detected system sleep (${Math.round((now - lastPollErrorTime) / 1000)}s gap), resetting error budget`,
          )
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII('info', 'bridge_poll_sleep_detected', {
            gapMs: now - lastPollErrorTime,
          })
          // connErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          connErrorStart = null
          // connBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
          connBackoff = 0
          // generalErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          generalErrorStart = null
          // generalBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
          generalBackoff = 0
        }
        // lastPollErrorTime 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
        lastPollErrorTime = now

        // connErrorStart 错误信息缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!connErrorStart) {
          // connErrorStart 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
          connErrorStart = now
        }
        // elapsed保存`now - connErrorStart`，供后续判断或组装使用。
        const elapsed = now - connErrorStart
        // 满足 `elapsed >= backoffConfig.connGiveUpMs` 时，远程桥接会话执行该分支。
        if (elapsed >= backoffConfig.connGiveUpMs) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logger.logError(
            `Server unreachable for ${Math.round(elapsed / 60_000)} minutes, giving up.`,
          )
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bridge_poll_give_up', {
            error_type:
              'connection' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            elapsed_ms: elapsed,
          })
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII('error', 'bridge_poll_give_up', {
            error_type: 'connection',
            elapsed_ms: elapsed,
          })
          // fatalExit更新为 `true`，确保Bridge 通信后续读取最新状态。
          fatalExit = true
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        }

        // Reset the other track when switching error types
        // generalErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
        generalErrorStart = null
        // generalBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
        generalBackoff = 0

        // connBackoff更新为 `connBackoff`，确保Bridge 通信后续读取最新状态。
        connBackoff = connBackoff
          ? Math.min(connBackoff * 2, backoffConfig.connCapMs)
          : backoffConfig.connInitialMs
        // delay保存`addJitter`，供远程桥接会话后续处理使用。
        const delay = addJitter(connBackoff)
        // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
        logger.logVerbose(
          `Connection error, retrying in ${formatDelay(delay)} (${Math.round(elapsed / 1000)}s elapsed): ${errMsg}`,
        )
        // 调用 logger.updateReconnectingStatus，触发远程桥接会话此处需要的副作用。
        logger.updateReconnectingStatus(
          formatDelay(delay),
          formatDuration(elapsed),
        )
        // The poll_due heartbeat-loop exit leaves a healthy lease exposed to
        // this backoff path. Heartbeat before each sleep so /poll outages
        // (the VerifyEnvironmentSecretAuth DB path heartbeat was introduced
        // to avoid) don't kill the 300s lease TTL. No-op when activeSessions
        // is empty or heartbeat is disabled.
        // 满足 `getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
        if (getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0) {
          // 等待 `heartbeatActiveWorkItems()` 完成，再继续远程桥接 bridge Main的异步流程。
          await heartbeatActiveWorkItems()
        }
        // 等待 `sleep(delay, loopSignal)` 完成，再继续远程桥接 bridge Main的异步流程。
        await sleep(delay, loopSignal)
      } else {
        // now记录时间`Date.now`，供远程桥接会话后续处理使用。
        const now = Date.now()

        // Sleep detection for general errors (same logic as connection errors)
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          lastPollErrorTime !== null &&
          now - lastPollErrorTime > pollSleepDetectionThresholdMs(backoffConfig)
        ) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:work] Detected system sleep (${Math.round((now - lastPollErrorTime) / 1000)}s gap), resetting error budget`,
          )
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII('info', 'bridge_poll_sleep_detected', {
            gapMs: now - lastPollErrorTime,
          })
          // connErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          connErrorStart = null
          // connBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
          connBackoff = 0
          // generalErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          generalErrorStart = null
          // generalBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
          generalBackoff = 0
        }
        // lastPollErrorTime 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
        lastPollErrorTime = now

        // generalErrorStart 错误信息缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!generalErrorStart) {
          // generalErrorStart 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
          generalErrorStart = now
        }
        // elapsed保存`now - generalErrorStart`，供后续判断或组装使用。
        const elapsed = now - generalErrorStart
        // 满足 `elapsed >= backoffConfig.generalGiveUpMs` 时，远程桥接会话执行该分支。
        if (elapsed >= backoffConfig.generalGiveUpMs) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logger.logError(
            `Persistent errors for ${Math.round(elapsed / 60_000)} minutes, giving up.`,
          )
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bridge_poll_give_up', {
            error_type:
              'general' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            elapsed_ms: elapsed,
          })
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII('error', 'bridge_poll_give_up', {
            error_type: 'general',
            elapsed_ms: elapsed,
          })
          // fatalExit更新为 `true`，确保Bridge 通信后续读取最新状态。
          fatalExit = true
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        }

        // Reset the other track when switching error types
        // connErrorStart 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
        connErrorStart = null
        // connBackoff更新为 `0`，确保Bridge 通信后续读取最新状态。
        connBackoff = 0

        // generalBackoff更新为 `generalBackoff`，确保Bridge 通信后续读取最新状态。
        generalBackoff = generalBackoff
          ? Math.min(generalBackoff * 2, backoffConfig.generalCapMs)
          : backoffConfig.generalInitialMs
        // delay保存`addJitter`，供远程桥接会话后续处理使用。
        const delay = addJitter(generalBackoff)
        // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
        logger.logVerbose(
          `Poll failed, retrying in ${formatDelay(delay)} (${Math.round(elapsed / 1000)}s elapsed): ${errMsg}`,
        )
        // 调用 logger.updateReconnectingStatus，触发远程桥接会话此处需要的副作用。
        logger.updateReconnectingStatus(
          formatDelay(delay),
          formatDuration(elapsed),
        )
        // 满足 `getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
        if (getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0) {
          // 等待 `heartbeatActiveWorkItems()` 完成，再继续远程桥接 bridge Main的异步流程。
          await heartbeatActiveWorkItems()
        }
        // 等待 `sleep(delay, loopSignal)` 完成，再继续远程桥接 bridge Main的异步流程。
        await sleep(delay, loopSignal)
      }
    }
  }

  // Clean up
  // 调用 stopStatusUpdates，触发远程桥接会话此处需要的副作用。
  stopStatusUpdates()
  // 调用 logger.clearStatus，触发远程桥接会话此处需要的副作用。
  logger.clearStatus()

  // loopDurationMs 集合记录时间`Date.now`，供远程桥接会话后续处理使用。
  const loopDurationMs = Date.now() - loopStartTime
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_shutdown', {
    active_sessions: activeSessions.size,
    loop_duration_ms: loopDurationMs,
  })
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_shutdown', {
    active_sessions: activeSessions.size,
    loop_duration_ms: loopDurationMs,
  })

  // Graceful shutdown: kill active sessions, report them as interrupted,
  // archive sessions, then deregister the environment so the web UI shows
  // the bridge as offline.

  // Collect all session IDs to archive on exit. This includes:
  // 1. Active sessions (snapshot before killing — onSessionDone clears maps)
  // 2. The initial auto-created session (may never have had work dispatched)
  // api.archiveSession is idempotent (409 if already archived), so
  // double-archiving is safe.
  // sessionsToArchive 会话数据保存`Set`，供远程桥接会话后续处理使用。
  const sessionsToArchive = new Set(activeSessions.keys())
  // 满足 `initialSessionId` 时，远程桥接会话执行该分支。
  if (initialSessionId) {
    // 调用 sessionsToArchive.add，触发远程桥接会话此处需要的副作用。
    sessionsToArchive.add(initialSessionId)
  }
  // Snapshot before killing — onSessionDone clears sessionCompatIds.
  // compatIdSnapshot保存`Map`，供远程桥接会话后续处理使用。
  const compatIdSnapshot = new Map(sessionCompatIds)

  // 满足 `activeSessions.size > 0` 时，远程桥接会话执行该分支。
  if (activeSessions.size > 0) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:shutdown] Shutting down ${activeSessions.size} active session(s)`,
    )
    // 调用 logger.logStatus，触发远程桥接会话此处需要的副作用。
    logger.logStatus(
      `Shutting down ${activeSessions.size} active session(s)\u2026`,
    )

    // Snapshot work IDs before killing — onSessionDone clears the maps when
    // each child exits, so we need a copy for the stopWork calls below.
    // shutdownWorkIds 集合保存`Map`，供远程桥接会话后续处理使用。
    const shutdownWorkIds = new Map(sessionWorkIds)

    // 循环处理 `const [sessionId, handle] of activeSessions.entries()`，让远程桥接会话把同类条目按顺序走完。
    for (const [sessionId, handle] of activeSessions.entries()) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:shutdown] Sending SIGTERM to sessionId=${sessionId}`,
      )
      // 调用 handle.kill，触发远程桥接会话此处需要的副作用。
      handle.kill()
    }

    // timeout保存`AbortController`，供远程桥接会话后续处理使用。
    const timeout = new AbortController()
    // 等待 `Promise.race([` 完成，再继续远程桥接 bridge Main的异步流程。
    await Promise.race([
      // 调用 Promise.allSettled，触发远程桥接会话此处需要的副作用。
      Promise.allSettled([...activeSessions.values()].map(h => h.done)),
      sleep(backoffConfig.shutdownGraceMs ?? 30_000, timeout.signal),
    ])
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    timeout.abort()

    // SIGKILL any processes that didn't respond to SIGTERM within the grace window
    // 循环处理 `const [sid, handle] of activeSessions.entries()`，让远程桥接会话把同类条目按顺序走完。
    for (const [sid, handle] of activeSessions.entries()) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[bridge:shutdown] Force-killing stuck sessionId=${sid}`)
      // 调用 handle.forceKill，触发远程桥接会话此处需要的副作用。
      handle.forceKill()
    }

    // Clear any remaining session timeout and refresh timers
    // 逐项读取 `sessionTimers.values()` 中的timer，按输入顺序推进远程桥接会话。
    for (const timer of sessionTimers.values()) {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(timer)
    }
    // 调用 sessionTimers.clear，触发远程桥接会话此处需要的副作用。
    sessionTimers.clear()
    // 调用 tokenRefresh?.cancelAll()，完成这一处局部操作。
    tokenRefresh?.cancelAll()

    // Clean up any remaining worktrees from active sessions.
    // Snapshot and clear the map first so onSessionDone (which may fire
    // during the await below when handle.done resolves) won't try to
    // remove the same worktrees again.
    // 满足 `sessionWorktrees.size > 0` 时，远程桥接会话执行该分支。
    if (sessionWorktrees.size > 0) {
      // remainingWorktrees 集合保存`sessionWorktrees.values`，供远程桥接会话后续处理使用。
      const remainingWorktrees = [...sessionWorktrees.values()]
      // 调用 sessionWorktrees.clear，触发远程桥接会话此处需要的副作用。
      sessionWorktrees.clear()
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:shutdown] Cleaning up ${remainingWorktrees.length} worktree(s)`,
      )
      // 等待 `Promise.allSettled(` 完成，再继续远程桥接 bridge Main的异步流程。
      await Promise.allSettled(
        // 调用 remainingWorktrees.map，触发远程桥接会话此处需要的副作用。
        remainingWorktrees.map(wt =>
          removeAgentWorktree(
            wt.worktreePath,
            wt.worktreeBranch,
            wt.gitRoot,
            wt.hookBased,
          ),
        ),
      )
    }

    // Stop all active work items so the server knows they're done
    // 等待 `Promise.allSettled(` 完成，再继续远程桥接 bridge Main的异步流程。
    await Promise.allSettled(
      // 这个回调绑定到 [...shutdownWorkIds.entries()].map(([sessionId, workId]) => {，负责远程桥接会话在该局部场景下的响应。
      [...shutdownWorkIds.entries()].map(([sessionId, workId]) => {
        // 返回 `api`，作为远程桥接会话这次计算的结果。
        return api
          .stopWork(environmentId, workId, true)
          // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
          .catch(err =>
            logger.logVerbose(
              `Failed to stop work ${workId} for session ${sessionId}: ${errorMessage(err)}`,
            ),
          )
      }),
    )
  }

  // Ensure all in-flight cleanup (stopWork, worktree removal) from
  // onSessionDone completes before deregistering — otherwise
  // process.exit() can kill them mid-flight.
  // 满足 `pendingCleanups.size > 0` 时，远程桥接会话执行该分支。
  if (pendingCleanups.size > 0) {
    // 等待 `Promise.allSettled([...pendingCleanups])` 完成，再继续远程桥接 bridge Main的异步流程。
    await Promise.allSettled([...pendingCleanups])
  }

  // In single-session mode with a known session, leave the session and
  // environment alive so `claude remote-control --session-id=<id>` can resume.
  // The backend GCs stale environments via a 4h TTL (BRIDGE_LAST_POLL_TTL).
  // Archiving the session or deregistering the environment would make the
  // printed resume command a lie — deregister deletes Firestore + Redis stream.
  // Skip when the loop exited fatally (env expired, auth failed, give-up) —
  // resume is impossible in those cases and the message would contradict the
  // error already printed.
  // feature('KAIROS') gate: --session-id is ant-only; without the gate,
  // revert to the pre-PR behavior (archive + deregister on every shutdown).
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('KAIROS') &&
    config.spawnMode === 'single-session' &&
    initialSessionId &&
    !fatalExit
  ) {
    // 调用 logger.logStatus，触发远程桥接会话此处需要的副作用。
    logger.logStatus(
      `Resume this session by running \`claude remote-control --continue\``,
    )
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:shutdown] Skipping archive+deregister to allow resume of session ${initialSessionId}`,
    )
    // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Archive all known sessions so they don't linger as idle/running on the
  // server after the bridge goes offline.
  // 满足 `sessionsToArchive.size > 0` 时，远程桥接会话执行该分支。
  if (sessionsToArchive.size > 0) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:shutdown] Archiving ${sessionsToArchive.size} session(s)`,
    )
    // 等待 `Promise.allSettled(` 完成，再继续远程桥接 bridge Main的异步流程。
    await Promise.allSettled(
      // 这个回调绑定到 [...sessionsToArchive].map(sessionId =>，负责远程桥接会话在该局部场景下的响应。
      [...sessionsToArchive].map(sessionId =>
        api
          .archiveSession(
            compatIdSnapshot.get(sessionId) ?? toCompatSessionId(sessionId),
          )
          // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
          .catch(err =>
            logger.logVerbose(
              `Failed to archive session ${sessionId}: ${errorMessage(err)}`,
            ),
          ),
      ),
    )
  }

  // Deregister the environment so the web UI shows the bridge as offline
  // and the Redis stream is cleaned up.
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `api.deregisterEnvironment(environmentId)` 完成，再继续远程桥接 bridge Main的异步流程。
    await api.deregisterEnvironment(environmentId)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:shutdown] Environment deregistered, bridge offline`,
    )
    // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
    logger.logVerbose('Environment deregistered.')
  } catch (err) {
    // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
    logger.logVerbose(`Failed to deregister environment: ${errorMessage(err)}`)
  }

  // Clear the crash-recovery pointer — the env is gone, pointer would be
  // stale. The early return above (resumable SIGINT shutdown) skips this,
  // leaving the pointer as a backup for the printed --session-id hint.
  // 从 `await import('./bridgePointer.js')` 解构 clearBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
  const { clearBridgePointer } = await import('./bridgePointer.js')
  // 等待 `clearBridgePointer(config.dir)` 完成，再继续远程桥接 bridge Main的异步流程。
  await clearBridgePointer(config.dir)

  // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
  logger.logVerbose('Environment offline.')
}

// CONNECTION_ERROR_CODES 错误信息保存`Set`，供远程桥接会话后续处理使用。
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
])

// isConnectionError 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isConnectionError(err: unknown): boolean {
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    typeof err.code === 'string' &&
    CONNECTION_ERROR_CODES.has(err.code)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/** Detect HTTP 5xx errors from axios (code: 'ERR_BAD_RESPONSE'). */
// isServerError 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isServerError(err: unknown): boolean {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    typeof err.code === 'string' &&
    err.code === 'ERR_BAD_RESPONSE'
  )
}

/** Add ±25% jitter to a delay value. */
// addJitter 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addJitter(ms: number): number {
  // 返回 `Math.max(0, ms + ms * 0.25 * (2 * Math.random() - 1))`，作为远程桥接会话这次计算的结果。
  return Math.max(0, ms + ms * 0.25 * (2 * Math.random() - 1))
}

// formatDelay 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatDelay(ms: number): string {
  // 返回 `ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms``，作为远程桥接会话这次计算的结果。
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

/**
 * Retry stopWork with exponential backoff (3 attempts, 1s/2s/4s).
 * Ensures the server learns the work item ended, preventing server-side zombies.
 */
// stopWorkWithRetry 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function stopWorkWithRetry(
  api: BridgeApiClient,
  environmentId: string,
  workId: string,
  logger: BridgeLogger,
  baseDelayMs = 1000,
): Promise<void> {
  // MAX_ATTEMPTS 集合保存`3`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
  const MAX_ATTEMPTS = 3

  // 循环处理 `let attempt = 1; attempt <= MAX_ATTEMPTS; attempt`，让远程桥接会话逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `api.stopWork(environmentId, workId, false)` 完成，再继续远程桥接 bridge Main的异步流程。
      await api.stopWork(environmentId, workId, false)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:work] stopWork succeeded for workId=${workId} on attempt ${attempt}/${MAX_ATTEMPTS}`,
      )
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (err) {
      // Auth/permission errors won't be fixed by retrying
      // 满足 `err instanceof BridgeFatalError` 时，远程桥接会话执行该分支。
      if (err instanceof BridgeFatalError) {
        // 满足 `isSuppressible403(err)` 时，远程桥接会话执行该分支。
        if (isSuppressible403(err)) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:work] Suppressed stopWork 403 for ${workId}: ${err.message}`,
          )
        } else {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logger.logError(`Failed to stop work ${workId}: ${err.message}`)
        }
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII('error', 'bridge_stop_work_failed', {
          attempts: attempt,
          fatal: true,
        })
        // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // errMsg保存`errorMessage`，供远程桥接会话后续处理使用。
      const errMsg = errorMessage(err)
      // 满足 `attempt < MAX_ATTEMPTS` 时，远程桥接会话执行该分支。
      if (attempt < MAX_ATTEMPTS) {
        // delay保存`addJitter`，供远程桥接会话后续处理使用。
        const delay = addJitter(baseDelayMs * Math.pow(2, attempt - 1))
        // 调用 logger.logVerbose，触发远程桥接会话此处需要的副作用。
        logger.logVerbose(
          `Failed to stop work ${workId} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${formatDelay(delay)}: ${errMsg}`,
        )
        // 等待 `sleep(delay)` 完成，再继续远程桥接 bridge Main的异步流程。
        await sleep(delay)
      } else {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logger.logError(
          `Failed to stop work ${workId} after ${MAX_ATTEMPTS} attempts: ${errMsg}`,
        )
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII('error', 'bridge_stop_work_failed', {
          attempts: MAX_ATTEMPTS,
        })
      }
    }
  }
}

// onSessionTimeout 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function onSessionTimeout(
  sessionId: string,
  timeoutMs: number,
  logger: BridgeLogger,
  timedOutSessions: Set<string>,
  handle: SessionHandle,
): void {
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:session] sessionId=${sessionId} timed out after ${formatDuration(timeoutMs)}`,
  )
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_session_timeout', {
    timeout_ms: timeoutMs,
  })
  // 调用 logger.logSessionFailed，触发远程桥接会话此处需要的副作用。
  logger.logSessionFailed(
    sessionId,
    `Session timed out after ${formatDuration(timeoutMs)}`,
  )
  // 调用 timedOutSessions.add，触发远程桥接会话此处需要的副作用。
  timedOutSessions.add(sessionId)
  // 调用 handle.kill，触发远程桥接会话此处需要的副作用。
  handle.kill()
}

// ParsedArgs 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedArgs = {
  verbose: boolean
  sandbox: boolean
  debugFile?: string
  sessionTimeoutMs?: number
  permissionMode?: string
  name?: string
  /** Value passed to --spawn (if any); undefined if no --spawn flag was given. */
  spawnMode: SpawnMode | undefined
  /** Value passed to --capacity (if any); undefined if no --capacity flag was given. */
  capacity: number | undefined
  /** --[no-]create-session-in-dir override; undefined = use default (on). */
  createSessionInDir: boolean | undefined
  /** Resume an existing session instead of creating a new one. */
  sessionId?: string
  /** Resume the last session in this directory (reads bridge-pointer.json). */
  continueSession: boolean
  help: boolean
  error?: string
}

// SPAWN_FLAG_VALUES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SPAWN_FLAG_VALUES = ['session', 'same-dir', 'worktree'] as const

// parseSpawnValue 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSpawnValue(raw: string | undefined): SpawnMode | string {
  // 当 `raw` 匹配 `'session'` 时，远程桥接会话执行对应分支。
  if (raw === 'session') return 'single-session'
  // 当 `raw` 匹配 `'same-dir'` 时，远程桥接会话执行对应分支。
  if (raw === 'same-dir') return 'same-dir'
  // 当 `raw` 匹配 `'worktree'` 时，远程桥接会话执行对应分支。
  if (raw === 'worktree') return 'worktree'
  // 返回 ``--spawn requires one of: ${SPAWN_FLAG_VALUES.join(', ')} (got: ${raw ?...`，作为远程桥接会话这次计算的结果。
  return `--spawn requires one of: ${SPAWN_FLAG_VALUES.join(', ')} (got: ${raw ?? '<missing>'})`
}

// parseCapacityValue 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCapacityValue(raw: string | undefined): number | string {
  // n解析`parseInt`，供远程桥接会话后续处理使用。
  const n = raw === undefined ? NaN : parseInt(raw, 10)
  // 组合条件 `isNaN(n) || n < 1` 成立时，远程桥接会话才启用这条专门路径。
  if (isNaN(n) || n < 1) {
    // 返回 ``--capacity requires a positive integer (got: ${raw ?? '<missing>'})``，作为远程桥接会话这次计算的结果。
    return `--capacity requires a positive integer (got: ${raw ?? '<missing>'})`
  }
  // 返回 `n`，作为远程桥接会话这次计算的结果。
  return n
}

// parseArgs 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseArgs(args: string[]): ParsedArgs {
  // verbose标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  let verbose = false
  // sandbox标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  let sandbox = false
  // debugFile 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let debugFile: string | undefined
  // sessionTimeoutMs 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let sessionTimeoutMs: number | undefined
  // permissionMode 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let permissionMode: string | undefined
  // 名称 先占位，稍后的条件分支会根据实际输入补齐它。
  let name: string | undefined
  // help标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  let help = false
  // spawnMode 先占位，稍后的条件分支会根据实际输入补齐它。
  let spawnMode: SpawnMode | undefined
  // capacity 先占位，稍后的条件分支会根据实际输入补齐它。
  let capacity: number | undefined
  // createSessionInDir 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let createSessionInDir: boolean | undefined
  // sessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let sessionId: string | undefined
  // continueSession 会话数据标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  let continueSession = false

  // 按索引扫描 `args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < args.length; i++) {
    // 当前参数 命名 `args[i]!`，让后续代码直接表达这个值的用途。
    const arg = args[i]!
    // 当 `arg` 匹配 `'--help' || arg === '-h'` 时，远程桥接会话执行对应分支。
    if (arg === '--help' || arg === '-h') {
      // help更新为 `true`，确保Bridge 通信后续读取最新状态。
      help = true
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--verbose' || arg === '-v') {`，完成这一小步状态转换。
    } else if (arg === '--verbose' || arg === '-v') {
      // verbose更新为 `true`，确保Bridge 通信后续读取最新状态。
      verbose = true
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--sandbox') {`，完成这一小步状态转换。
    } else if (arg === '--sandbox') {
      // sandbox更新为 `true`，确保Bridge 通信后续读取最新状态。
      sandbox = true
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--no-sandbox') {`，完成这一小步状态转换。
    } else if (arg === '--no-sandbox') {
      // sandbox更新为 `false`，确保Bridge 通信后续读取最新状态。
      sandbox = false
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--debug-file' && i + 1 < args.length) {`，完成这一小步状态转换。
    } else if (arg === '--debug-file' && i + 1 < args.length) {
      // debugFile 文件数据更新为 `resolve(args[++i]!)`，确保Bridge 通信后续读取最新状态。
      debugFile = resolve(args[++i]!)
    // 远程桥接 bridge Main在这里处理 `} else if (arg.startsWith('--debug-file=')) {`，完成这一小步状态转换。
    } else if (arg.startsWith('--debug-file=')) {
      // debugFile 文件数据更新为 `resolve(arg.slice('--debug-file='.length))`，确保Bridge 通信后续读取最新状态。
      debugFile = resolve(arg.slice('--debug-file='.length))
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--session-timeout' && i + 1 < args.length) {`，完成这一小步状态转换。
    } else if (arg === '--session-timeout' && i + 1 < args.length) {
      // sessionTimeoutMs 会话数据更新为 `parseInt(args[++i]!, 10) * 1000`，确保Bridge 通信后续读取最新状态。
      sessionTimeoutMs = parseInt(args[++i]!, 10) * 1000
    // 远程桥接 bridge Main在这里处理 `} else if (arg.startsWith('--session-timeout=')) {`，完成这一小步状态转换。
    } else if (arg.startsWith('--session-timeout=')) {
      // 远程桥接 bridge Main在这里处理 `sessionTimeoutMs =`，完成这一小步状态转换。
      sessionTimeoutMs =
        parseInt(arg.slice('--session-timeout='.length), 10) * 1000
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--permission-mode' && i + 1 < args.length) {`，完成这一小步状态转换。
    } else if (arg === '--permission-mode' && i + 1 < args.length) {
      // permissionMode 权限数据更新为 `args[++i]!`，确保Bridge 通信后续读取最新状态。
      permissionMode = args[++i]!
    // 远程桥接 bridge Main在这里处理 `} else if (arg.startsWith('--permission-mode=')) {`，完成这一小步状态转换。
    } else if (arg.startsWith('--permission-mode=')) {
      // permissionMode 权限数据更新为 `arg.slice('--permission-mode='.length)`，确保Bridge 通信后续读取最新状态。
      permissionMode = arg.slice('--permission-mode='.length)
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--name' && i + 1 < args.length) {`，完成这一小步状态转换。
    } else if (arg === '--name' && i + 1 < args.length) {
      // 名称更新为 `args[++i]!`，确保Bridge 通信后续读取最新状态。
      name = args[++i]!
    // 远程桥接 bridge Main在这里处理 `} else if (arg.startsWith('--name=')) {`，完成这一小步状态转换。
    } else if (arg.startsWith('--name=')) {
      // 名称更新为 `arg.slice('--name='.length)`，确保Bridge 通信后续读取最新状态。
      name = arg.slice('--name='.length)
    // 远程桥接 bridge Main在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      feature('KAIROS') &&
      arg === '--session-id' &&
      i + 1 < args.length
    ) {
      // sessionId 会话数据更新为 `args[++i]!`，确保Bridge 通信后续读取最新状态。
      sessionId = args[++i]!
      // sessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!sessionId) {
        // 返回 `makeError('--session-id requires a value')`，作为远程桥接会话这次计算的结果。
        return makeError('--session-id requires a value')
      }
    // 远程桥接 bridge Main在这里处理 `} else if (feature('KAIROS') && arg.startsWith('--session-id=')) {`，完成这一小步状态转换。
    } else if (feature('KAIROS') && arg.startsWith('--session-id=')) {
      // sessionId 会话数据更新为 `arg.slice('--session-id='.length)`，确保Bridge 通信后续读取最新状态。
      sessionId = arg.slice('--session-id='.length)
      // sessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!sessionId) {
        // 返回 `makeError('--session-id requires a value')`，作为远程桥接会话这次计算的结果。
        return makeError('--session-id requires a value')
      }
    // 远程桥接 bridge Main在这里处理 `} else if (feature('KAIROS') && (arg === '--continue' || arg === '-c'))...`，完成这一小步状态转换。
    } else if (feature('KAIROS') && (arg === '--continue' || arg === '-c')) {
      // continueSession 会话数据更新为 `true`，确保Bridge 通信后续读取最新状态。
      continueSession = true
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--spawn' || arg.startsWith('--spawn=')) {`，完成这一小步状态转换。
    } else if (arg === '--spawn' || arg.startsWith('--spawn=')) {
      // `spawnMode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (spawnMode !== undefined) {
        // 返回 `makeError('--spawn may only be specified once')`，作为远程桥接会话这次计算的结果。
        return makeError('--spawn may only be specified once')
      }
      // 原始文本保存`arg.startsWith`，供远程桥接会话后续处理使用。
      const raw = arg.startsWith('--spawn=')
        ? arg.slice('--spawn='.length)
        : args[++i]
      // v解析`parseSpawnValue`，供远程桥接会话后续处理使用。
      const v = parseSpawnValue(raw)
      // 组合条件 `v === 'single-session' || v === 'same-dir' || v =` 成立时，远程桥接会话才启用这条专门路径。
      if (v === 'single-session' || v === 'same-dir' || v === 'worktree') {
        // spawnMode更新为 `v`，确保Bridge 通信后续读取最新状态。
        spawnMode = v
      } else {
        // 返回 `makeError(v)`，作为远程桥接会话这次计算的结果。
        return makeError(v)
      }
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--capacity' || arg.startsWith('--capacity=')) {`，完成这一小步状态转换。
    } else if (arg === '--capacity' || arg.startsWith('--capacity=')) {
      // `capacity` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (capacity !== undefined) {
        // 返回 `makeError('--capacity may only be specified once')`，作为远程桥接会话这次计算的结果。
        return makeError('--capacity may only be specified once')
      }
      // 原始文本保存`arg.startsWith`，供远程桥接会话后续处理使用。
      const raw = arg.startsWith('--capacity=')
        ? arg.slice('--capacity='.length)
        : args[++i]
      // v解析`parseCapacityValue`，供远程桥接会话后续处理使用。
      const v = parseCapacityValue(raw)
      // 当 `typeof v` 匹配 `'number'` 时，远程桥接会话执行对应分支。
      if (typeof v === 'number') capacity = v
      else return makeError(v)
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--create-session-in-dir') {`，完成这一小步状态转换。
    } else if (arg === '--create-session-in-dir') {
      // createSessionInDir 会话数据更新为 `true`，确保Bridge 通信后续读取最新状态。
      createSessionInDir = true
    // 远程桥接 bridge Main在这里处理 `} else if (arg === '--no-create-session-in-dir') {`，完成这一小步状态转换。
    } else if (arg === '--no-create-session-in-dir') {
      // createSessionInDir 会话数据更新为 `false`，确保Bridge 通信后续读取最新状态。
      createSessionInDir = false
    } else {
      // 返回 `makeError(`，作为远程桥接会话这次计算的结果。
      return makeError(
        `Unknown argument: ${arg}\nRun 'claude remote-control --help' for usage.`,
      )
    }
  }

  // Note: gate check for --spawn/--capacity/--create-session-in-dir is in bridgeMain
  // (gate-aware error). Flag cross-validation happens here.

  // --capacity only makes sense for multi-session modes.
  // `spawnMode === 'single-session' && capacity` 与 `un` 不一致时刷新派生状态，避免使用过期结果。
  if (spawnMode === 'single-session' && capacity !== undefined) {
    // 返回 `makeError(`，作为远程桥接会话这次计算的结果。
    return makeError(
      `--capacity cannot be used with --spawn=session (single-session mode has fixed capacity 1).`,
    )
  }

  // --session-id / --continue resume a specific session on its original
  // environment; incompatible with spawn-related flags (which configure
  // fresh session creation), and mutually exclusive with each other.
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    (sessionId || continueSession) &&
    (spawnMode !== undefined ||
      capacity !== undefined ||
      createSessionInDir !== undefined)
  ) {
    // 返回 `makeError(`，作为远程桥接会话这次计算的结果。
    return makeError(
      `--session-id and --continue cannot be used with --spawn, --capacity, or --create-session-in-dir.`,
    )
  }
  // 组合条件 `sessionId && continueSession` 成立时，远程桥接会话才启用这条专门路径。
  if (sessionId && continueSession) {
    // 返回 `makeError(`--session-id and --continue cannot be used together.`)`，作为远程桥接会话这次计算的结果。
    return makeError(`--session-id and --continue cannot be used together.`)
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    verbose,
    sandbox,
    debugFile,
    sessionTimeoutMs,
    permissionMode,
    name,
    spawnMode,
    capacity,
    createSessionInDir,
    sessionId,
    continueSession,
    help,
  }

  // makeError 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function makeError(error: string): ParsedArgs {
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return {
      verbose,
      sandbox,
      debugFile,
      sessionTimeoutMs,
      permissionMode,
      name,
      spawnMode,
      capacity,
      createSessionInDir,
      sessionId,
      continueSession,
      help,
      error,
    }
  }
}

// printHelp 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function printHelp(): Promise<void> {
  // Use EXTERNAL_PERMISSION_MODES for help text — internal modes (bubble)
  // are ant-only and auto is feature-gated; they're still accepted by validation.
  // 从 `await import('../types/permissions.js')` 解构 EXTERNAL_PERMISSION_MODES，减少远程桥接 bridge Main对同一对象的重复访问。
  const { EXTERNAL_PERMISSION_MODES } = await import('../types/permissions.js')
  // modes 集合格式化`EXTERNAL_PERMISSION_MODES.join`，供远程桥接会话后续处理使用。
  const modes = EXTERNAL_PERMISSION_MODES.join(', ')
  // showServer保存`isMultiSessionSpawnEnabled`，供远程桥接会话后续处理使用。
  const showServer = await isMultiSessionSpawnEnabled()
  // serverOptions 集合 命名 `showServer`，让后续代码直接表达这个值的用途。
  const serverOptions = showServer
    ? `  --spawn <mode>                   Spawn mode: same-dir, worktree, session
                                   (default: same-dir)
  --capacity <N>                   Max concurrent sessions in worktree or
                                   same-dir mode (default: ${SPAWN_SESSIONS_DEFAULT})
  --[no-]create-session-in-dir     Pre-create a session in the current
                                   directory; in worktree mode this session
                                   stays in cwd while on-demand sessions get
                                   isolated worktrees (default: on)
`
    : ''
  // serverDescription 命名 `showServer`，让后续代码直接表达这个值的用途。
  const serverDescription = showServer
    ? `
  Remote Control runs as a persistent server that accepts multiple concurrent
  sessions in the current directory. One session is pre-created on start so
  you have somewhere to type immediately. Use --spawn=worktree to isolate
  each on-demand session in its own git worktree, or --spawn=session for
  the classic single-session mode (exits when that session ends). Press 'w'
  during runtime to toggle between same-dir and worktree.
`
    : ''
  // serverNote保存`showServer`，供远程桥接会话远程桥接 bridge Main后续判断或输出使用。
  const serverNote = showServer
    ? `  - Worktree mode requires a git repository or WorktreeCreate/WorktreeRemove hooks
`
    : ''
  // help保存```，作为后续固定文本处理的输入。
  const help = `
Remote Control - Connect your local environment to claude.ai/code

USAGE
  claude remote-control [options]
OPTIONS
  --name <name>                    Name for the session (shown in claude.ai/code)
${
  feature('KAIROS')
    ? `  -c, --continue                   Resume the last session in this directory
  --session-id <id>                Resume a specific session by ID (cannot be
                                   used with spawn flags or --continue)
`
    : ''
}  --permission-mode <mode>         Permission mode for spawned sessions
                                   (${modes})
  --debug-file <path>              Write debug logs to file
  -v, --verbose                    Enable verbose output
  -h, --help                       Show this help
${serverOptions}
DESCRIPTION
  Remote Control allows you to control sessions on your local device from
  claude.ai/code (https://claude.ai/code). Run this command in the
  directory you want to work in, then connect from the Claude app or web.
${serverDescription}
NOTES
  - You must be logged in with a Claude account that has a subscription
  - Run \`claude\` first in the directory to accept the workspace trust dialog
${serverNote}`
  // biome-ignore lint/suspicious/noConsole: intentional help output
  // 调用 console.log，触发远程桥接会话此处需要的副作用。
  console.log(help)
}

// TITLE_MAX_LEN 标题 命名 `80`，让后续代码直接表达这个值的用途。
const TITLE_MAX_LEN = 80

/** Derive a session title from a user message: first line, truncated. */
// deriveSessionTitle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function deriveSessionTitle(text: string): string {
  // Collapse whitespace — newlines/tabs would break the single-line status display.
  // flat格式化`text.replace`，供远程桥接会话后续处理使用。
  const flat = text.replace(/\s+/g, ' ').trim()
  // 返回 `truncateToWidth(flat, TITLE_MAX_LEN)`，作为远程桥接会话这次计算的结果。
  return truncateToWidth(flat, TITLE_MAX_LEN)
}

/**
 * One-shot fetch of a session's title via GET /v1/sessions/{id}.
 *
 * Uses `getBridgeSession` from createSession.ts (ccr-byoc headers + org UUID)
 * rather than the environments-level bridgeApi client, whose headers make the
 * Sessions API return 404. Returns undefined if the session has no title yet
 * or the fetch fails — the caller falls back to deriving a title from the
 * first user message.
 */
// fetchSessionTitle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchSessionTitle(
  compatSessionId: string,
  baseUrl: string,
): Promise<string | undefined> {
  // 从 `await import('./createSession.js')` 解构 getBridgeSession，减少远程桥接 bridge Main对同一对象的重复访问。
  const { getBridgeSession } = await import('./createSession.js')
  // session 会话数据读取`getBridgeSession`，供远程桥接会话后续处理使用。
  const session = await getBridgeSession(compatSessionId, { baseUrl })
  // 返回 `session?.title || undefined`，作为远程桥接会话这次计算的结果。
  return session?.title || undefined
}

// bridgeMain 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function bridgeMain(args: string[]): Promise<void> {
  // 解析结果解析`parseArgs`，供远程桥接会话后续处理使用。
  const parsed = parseArgs(args)

  // 满足 `parsed.help` 时，远程桥接会话执行该分支。
  if (parsed.help) {
    // 等待 `printHelp()` 完成，再继续远程桥接 bridge Main的异步流程。
    await printHelp()
    // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `parsed.error` 时，远程桥接会话执行该分支。
  if (parsed.error) {
    // biome-ignore lint/suspicious/noConsole: intentional error output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(`Error: ${parsed.error}`)
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    verbose,
    sandbox,
    debugFile,
    sessionTimeoutMs,
    permissionMode,
    name,
    spawnMode: parsedSpawnMode,
    capacity: parsedCapacity,
    createSessionInDir: parsedCreateSessionInDir,
    sessionId: parsedSessionId,
    continueSession,
  } = parsed
  // Mutable so --continue can set it from the pointer file. The #20460
  // resume flow below then treats it the same as an explicit --session-id.
  // resumeSessionId 会话数据 命名 `parsedSessionId`，让后续代码直接表达这个值的用途。
  let resumeSessionId = parsedSessionId
  // When --continue found a pointer, this is the directory it came from
  // (may be a worktree sibling, not `dir`). On resume-flow deterministic
  // failure, clear THIS file so --continue doesn't keep hitting the same
  // dead session. Undefined for explicit --session-id (leaves pointer alone).
  // resumePointerDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let resumePointerDir: string | undefined

  // usedMultiSessionFeature 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const usedMultiSessionFeature =
    parsedSpawnMode !== undefined ||
    parsedCapacity !== undefined ||
    parsedCreateSessionInDir !== undefined

  // Validate permission mode early so the user gets an error before
  // the bridge starts polling for work.
  // `permissionMode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (permissionMode !== undefined) {
    // 从 `await import('../types/permissions.js')` 解构 PERMISSION_MODES，减少远程桥接 bridge Main对同一对象的重复访问。
    const { PERMISSION_MODES } = await import('../types/permissions.js')
    // valid保存`PERMISSION_MODES`，供远程桥接 bridge Main后续判断或输出使用。
    const valid: readonly string[] = PERMISSION_MODES
    // 满足 `!valid.includes(permissionMode)` 时，远程桥接会话执行该分支。
    if (!valid.includes(permissionMode)) {
      // biome-ignore lint/suspicious/noConsole: intentional error output
      // 调用 console.error，触发远程桥接会话此处需要的副作用。
      console.error(
        `Error: Invalid permission mode '${permissionMode}'. Valid modes: ${valid.join(', ')}`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(1)
    }
  }

  // dir读取`resolve`，供远程桥接会话后续处理使用。
  const dir = resolve('.')

  // The bridge fast-path bypasses init.ts, so we must enable config reading
  // before any code that transitively calls getGlobalConfig()
  // 从 `await import(` 解构 enableConfigs、checkHasTrustDialogAccepted，减少远程桥接 bridge Main对同一对象的重复访问。
  const { enableConfigs, checkHasTrustDialogAccepted } = await import(
    '../utils/config.js'
  )
  // 调用 enableConfigs，触发远程桥接会话此处需要的副作用。
  enableConfigs()

  // Initialize analytics and error reporting sinks. The bridge bypasses the
  // setup() init flow, so we call initSinks() directly to attach sinks here.
  // 从 `await import('../utils/sinks.js')` 解构 initSinks，减少远程桥接 bridge Main对同一对象的重复访问。
  const { initSinks } = await import('../utils/sinks.js')
  // 调用 initSinks，触发远程桥接会话此处需要的副作用。
  initSinks()

  // Gate-aware validation: --spawn / --capacity / --create-session-in-dir require
  // the multi-session gate. parseArgs has already validated flag combinations;
  // here we only check the gate since that requires an async GrowthBook call.
  // Runs after enableConfigs() (GrowthBook cache reads global config) and after
  // initSinks() so the denial event can be enqueued.
  // multiSessionEnabled 会话数据保存`isMultiSessionSpawnEnabled`，供远程桥接会话后续处理使用。
  const multiSessionEnabled = await isMultiSessionSpawnEnabled()
  // 组合条件 `usedMultiSessionFeature && !multiSessionEnabled` 成立时，远程桥接会话才启用这条专门路径。
  if (usedMultiSessionFeature && !multiSessionEnabled) {
    // 等待 `logEventAsync('tengu_bridge_multi_session_denied', {` 完成，再继续远程桥接 bridge Main的异步流程。
    await logEventAsync('tengu_bridge_multi_session_denied', {
      used_spawn: parsedSpawnMode !== undefined,
      used_capacity: parsedCapacity !== undefined,
      used_create_session_in_dir: parsedCreateSessionInDir !== undefined,
    })
    // logEventAsync only enqueues — process.exit() discards buffered events.
    // Flush explicitly, capped at 500ms to match gracefulShutdown.ts.
    // (sleep() doesn't unref its timer, but process.exit() follows immediately
    // so the ref'd timer can't delay shutdown.)
    // 等待 `Promise.race([` 完成，再继续远程桥接 bridge Main的异步流程。
    await Promise.race([
      Promise.all([shutdown1PEventLogging(), shutdownDatadog()]),
      sleep(500, undefined, { unref: true }),
    // 这个回调绑定到 ]).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
    ]).catch(() => {})
    // biome-ignore lint/suspicious/noConsole: intentional error output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      'Error: Multi-session Remote Control is not enabled for your account yet.',
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // Set the bootstrap CWD so that trust checks, project config lookups, and
  // git utilities (getBranch, getRemoteUrl) resolve against the correct path.
  // 从 `await import('../bootstrap/state.js')` 解构 setOriginalCwd、setCwdState，减少远程桥接 bridge Main对同一对象的重复访问。
  const { setOriginalCwd, setCwdState } = await import('../bootstrap/state.js')
  // setOriginalCwd 写入新的状态值，使远程桥接会话后续读取保持一致。
  setOriginalCwd(dir)
  // setCwdState 写入新的状态值，使远程桥接会话后续读取保持一致。
  setCwdState(dir)

  // The bridge bypasses main.tsx (which renders the interactive TrustDialog via showSetupScreens),
  // so we must verify trust was previously established by a normal `claude` session.
  // 满足 `!checkHasTrustDialogAccepted()` 时，远程桥接会话执行该分支。
  if (!checkHasTrustDialogAccepted()) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      `Error: Workspace not trusted. Please run \`claude\` in ${dir} first to review and accept the workspace trust dialog.`,
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // Resolve auth
  // 远程桥接 bridge Main先整理这一处局部数据，后续分支可以直接读取。
  const { clearOAuthTokenCache, checkAndRefreshOAuthTokenIfNeeded } =
    await import('../utils/auth.js')
  // 从 `await import(` 解构 getBridgeAccessToken、getBridgeBaseUrl，减少远程桥接 bridge Main对同一对象的重复访问。
  const { getBridgeAccessToken, getBridgeBaseUrl } = await import(
    './bridgeConfig.js'
  )

  // bridgeToken读取`getBridgeAccessToken`，供远程桥接会话后续处理使用。
  const bridgeToken = getBridgeAccessToken()
  // bridgeToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!bridgeToken) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(BRIDGE_LOGIN_ERROR)
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // First-time remote dialog — explain what bridge does and get consent
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    getGlobalConfig,
    saveGlobalConfig,
    getCurrentProjectConfig,
    saveCurrentProjectConfig,
  } = await import('../utils/config.js')
  // 满足 `!getGlobalConfig().remoteDialogSeen` 时，远程桥接会话执行该分支。
  if (!getGlobalConfig().remoteDialogSeen) {
    // readline保存`import`，供远程桥接会话后续处理使用。
    const readline = await import('readline')
    // rl读取`readline.createInterface`，供远程桥接会话后续处理使用。
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发远程桥接会话此处需要的副作用。
    console.log(
      '\nRemote Control lets you access this CLI session from the web (claude.ai/code)\nor the Claude app, so you can pick up where you left off on any device.\n\nYou can disconnect remote access anytime by running /remote-control again.\n',
    )
    // answer 等待 `new Promise<string>(resolve => {`，确保继续执行前已有结果。
    const answer = await new Promise<string>(resolve => {
      // 调用 rl.question，触发远程桥接会话此处需要的副作用。
      rl.question('Enable Remote Control? (y/n) ', resolve)
    })
    // 关闭 readline 会话，结束本地交互循环。
    rl.close()
    // 调用 saveGlobalConfig，触发远程桥接会话此处需要的副作用。
    saveGlobalConfig(current => {
      // 满足 `current.remoteDialogSeen` 时，远程桥接会话执行该分支。
      if (current.remoteDialogSeen) return current
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { ...current, remoteDialogSeen: true }
    })
    // `answer.toLowerCase()` 与 `'y' && answer.toLowerCase() !==...` 不一致时刷新派生状态，避免使用过期结果。
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(0)
    }
  }

  // --continue: resolve the most recent session from the crash-recovery
  // pointer and chain into the #20460 --session-id flow. Worktree-aware:
  // checks current dir first (fast path, zero exec), then fans out to git
  // worktree siblings if that misses — the REPL bridge writes to
  // getOriginalCwd() which EnterWorktreeTool/activeWorktreeSession can
  // point at a worktree while the user's shell is at the repo root.
  // KAIROS-gated at parseArgs — continueSession is always false in external
  // builds, so this block tree-shakes.
  // 组合条件 `feature('KAIROS') && continueSession` 成立时，远程桥接会话才启用这条专门路径。
  if (feature('KAIROS') && continueSession) {
    // 从 `await import(` 解构 readBridgePointerAcrossWorktrees，减少远程桥接 bridge Main对同一对象的重复访问。
    const { readBridgePointerAcrossWorktrees } = await import(
      './bridgePointer.js'
    )
    // found读取`readBridgePointerAcrossWorktrees`，供远程桥接会话后续处理使用。
    const found = await readBridgePointerAcrossWorktrees(dir)
    // found缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!found) {
      // biome-ignore lint/suspicious/noConsole: intentional error output
      // 调用 console.error，触发远程桥接会话此处需要的副作用。
      console.error(
        `Error: No recent session found in this directory or its worktrees. Run \`claude remote-control\` to start a new one.`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(1)
    }
    // 从 `found` 解构 pointer、dir，减少远程桥接 bridge Main对同一对象的重复访问。
    const { pointer, dir: pointerDir } = found
    // ageMin保存`Math.round`，供远程桥接会话后续处理使用。
    const ageMin = Math.round(pointer.ageMs / 60_000)
    // ageStr保存`Math.round`，供远程桥接会话后续处理使用。
    const ageStr = ageMin < 60 ? `${ageMin}m` : `${Math.round(ageMin / 60)}h`
    // fromWt标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
    const fromWt = pointerDir !== dir ? ` from worktree ${pointerDir}` : ''
    // biome-ignore lint/suspicious/noConsole: intentional info output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      `Resuming session ${pointer.sessionId} (${ageStr} ago)${fromWt}\u2026`,
    )
    // resumeSessionId 会话数据更新为 `pointer.sessionId`，确保Bridge 通信后续读取最新状态。
    resumeSessionId = pointer.sessionId
    // Track where the pointer came from so the #20460 exit(1) paths below
    // clear the RIGHT file on deterministic failure — otherwise --continue
    // would keep hitting the same dead session. May be a worktree sibling.
    // resumePointerDir更新为 `pointerDir`，确保Bridge 通信后续读取最新状态。
    resumePointerDir = pointerDir
  }

  // In production, baseUrl is the Anthropic API (from OAuth config).
  // CLAUDE_BRIDGE_BASE_URL overrides this for ant local dev only.
  // baseUrl读取`getBridgeBaseUrl`，供远程桥接会话后续处理使用。
  const baseUrl = getBridgeBaseUrl()

  // For non-localhost targets, require HTTPS to protect credentials.
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    baseUrl.startsWith('http://') &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1')
  ) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      'Error: Remote Control base URL uses HTTP. Only HTTPS or localhost HTTP is allowed.',
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // Session ingress URL for WebSocket connections. In production this is the
  // same as baseUrl (Envoy routes /v1/session_ingress/* to session-ingress).
  // Locally, session-ingress runs on a different port (9413) than the
  // contain-provide-api (8211), so CLAUDE_BRIDGE_SESSION_INGRESS_URL must be
  // set explicitly. Ant-only, matching CLAUDE_BRIDGE_BASE_URL.
  // sessionIngressUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sessionIngressUrl =
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      ? process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      : baseUrl

  // 从 `await import(` 解构 getBranch、getRemoteUrl、findGitRoot，减少远程桥接 bridge Main对同一对象的重复访问。
  const { getBranch, getRemoteUrl, findGitRoot } = await import(
    '../utils/git.js'
  )

  // Precheck worktree availability for the first-run dialog and the `w`
  // toggle. Unconditional so we know upfront whether worktree is an option.
  // 从 `await import('../utils/hooks.js')` 解构 hasWorktreeCreateHook，减少远程桥接 bridge Main对同一对象的重复访问。
  const { hasWorktreeCreateHook } = await import('../utils/hooks.js')
  // worktreeAvailable保存`hasWorktreeCreateHook`，供远程桥接会话后续处理使用。
  const worktreeAvailable = hasWorktreeCreateHook() || findGitRoot(dir) !== null

  // Load saved per-project spawn-mode preference. Gated by multiSessionEnabled
  // so a GrowthBook rollback cleanly reverts users to single-session —
  // otherwise a saved pref would silently re-enable multi-session behavior
  // (worktree isolation, 32 max sessions, w toggle) despite the gate being off.
  // Also guard against a stale worktree pref left over from when this dir WAS
  // a git repo (or the user copied config) — clear it on disk so the warning
  // doesn't repeat on every launch.
  // savedSpawnMode保存`multiSessionEnabled`，供后续判断或组装使用。
  let savedSpawnMode = multiSessionEnabled
    ? getCurrentProjectConfig().remoteControlSpawnMode
    : undefined
  // 组合条件 `savedSpawnMode === 'worktree' && !worktreeAvailab` 成立时，远程桥接会话才启用这条专门路径。
  if (savedSpawnMode === 'worktree' && !worktreeAvailable) {
    // biome-ignore lint/suspicious/noConsole: intentional warning output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      'Warning: Saved spawn mode is worktree but this directory is not a git repository. Falling back to same-dir.',
    )
    // savedSpawnMode更新为 `undefined`，确保Bridge 通信后续读取最新状态。
    savedSpawnMode = undefined
    // 调用 saveCurrentProjectConfig，触发远程桥接会话此处需要的副作用。
    saveCurrentProjectConfig(current => {
      // 满足 `current.remoteControlSpawnMode === undefined` 时，远程桥接会话执行该分支。
      if (current.remoteControlSpawnMode === undefined) return current
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { ...current, remoteControlSpawnMode: undefined }
    })
  }

  // First-run spawn-mode choice: ask once per project when the choice is
  // meaningful (gate on, both modes available, no explicit override, not
  // resuming). Saves to ProjectConfig so subsequent runs skip this.
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    multiSessionEnabled &&
    !savedSpawnMode &&
    worktreeAvailable &&
    parsedSpawnMode === undefined &&
    !resumeSessionId &&
    process.stdin.isTTY
  ) {
    // readline保存`import`，供远程桥接会话后续处理使用。
    const readline = await import('readline')
    // rl读取`readline.createInterface`，供远程桥接会话后续处理使用。
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    // biome-ignore lint/suspicious/noConsole: intentional dialog output
    // 调用 console.log，触发远程桥接会话此处需要的副作用。
    console.log(
      `\nClaude Remote Control is launching in spawn mode which lets you create new sessions in this project from Claude Code on Web or your Mobile app. Learn more here: https://code.claude.com/docs/en/remote-control\n\n` +
        `Spawn mode for this project:\n` +
        `  [1] same-dir \u2014 sessions share the current directory (default)\n` +
        `  [2] worktree \u2014 each session gets an isolated git worktree\n\n` +
        `This can be changed later or explicitly set with --spawn=same-dir or --spawn=worktree.\n`,
    )
    // answer 等待 `new Promise<string>(resolve => {`，确保继续执行前已有结果。
    const answer = await new Promise<string>(resolve => {
      // 调用 rl.question，触发远程桥接会话此处需要的副作用。
      rl.question('Choose [1/2] (default: 1): ', resolve)
    })
    // 关闭 readline 会话，结束本地交互循环。
    rl.close()
    // chosen 先占位，稍后的条件分支会根据实际输入补齐它。
    const chosen: 'same-dir' | 'worktree' =
      answer.trim() === '2' ? 'worktree' : 'same-dir'
    // savedSpawnMode更新为 `chosen`，确保Bridge 通信后续读取最新状态。
    savedSpawnMode = chosen
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_spawn_mode_chosen', {
      spawn_mode:
        chosen as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 调用 saveCurrentProjectConfig，触发远程桥接会话此处需要的副作用。
    saveCurrentProjectConfig(current => {
      // 满足 `current.remoteControlSpawnMode === chosen` 时，远程桥接会话执行该分支。
      if (current.remoteControlSpawnMode === chosen) return current
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { ...current, remoteControlSpawnMode: chosen }
    })
  }

  // Determine effective spawn mode.
  // Precedence: resume > explicit --spawn > saved project pref > gate default
  // - resuming via --continue / --session-id: always single-session (resume
  //   targets one specific session in its original directory)
  // - explicit --spawn flag: use that value directly (does not persist)
  // - saved ProjectConfig.remoteControlSpawnMode: set by first-run dialog or `w`
  // - default with gate on: same-dir (persistent multi-session, shared cwd)
  // - default with gate off: single-session (unchanged legacy behavior)
  // Track how spawn mode was determined, for rollout analytics.
  // SpawnModeSource 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
  type SpawnModeSource = 'resume' | 'flag' | 'saved' | 'gate_default'
  // spawnModeSource 先占位，稍后的条件分支会根据实际输入补齐它。
  let spawnModeSource: SpawnModeSource
  // spawnMode 先占位，稍后的条件分支会根据实际输入补齐它。
  let spawnMode: SpawnMode
  // 满足 `resumeSessionId` 时，远程桥接会话执行该分支。
  if (resumeSessionId) {
    // spawnMode更新为 `'single-session'`，确保Bridge 通信后续读取最新状态。
    spawnMode = 'single-session'
    // spawnModeSource更新为 `'resume'`，确保Bridge 通信后续读取最新状态。
    spawnModeSource = 'resume'
  // 远程桥接 bridge Main在这里处理 `} else if (parsedSpawnMode !== undefined) {`，完成这一小步状态转换。
  } else if (parsedSpawnMode !== undefined) {
    // spawnMode更新为 `parsedSpawnMode`，确保Bridge 通信后续读取最新状态。
    spawnMode = parsedSpawnMode
    // spawnModeSource更新为 `'flag'`，确保Bridge 通信后续读取最新状态。
    spawnModeSource = 'flag'
  // 远程桥接 bridge Main在这里处理 `} else if (savedSpawnMode !== undefined) {`，完成这一小步状态转换。
  } else if (savedSpawnMode !== undefined) {
    // spawnMode更新为 `savedSpawnMode`，确保Bridge 通信后续读取最新状态。
    spawnMode = savedSpawnMode
    // spawnModeSource更新为 `'saved'`，确保Bridge 通信后续读取最新状态。
    spawnModeSource = 'saved'
  } else {
    // spawnMode更新为 `multiSessionEnabled ? 'same-dir' : 'single-session'`，确保Bridge 通信后续读取最新状态。
    spawnMode = multiSessionEnabled ? 'same-dir' : 'single-session'
    // spawnModeSource更新为 `'gate_default'`，确保Bridge 通信后续读取最新状态。
    spawnModeSource = 'gate_default'
  }
  // maxSessions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const maxSessions =
    spawnMode === 'single-session'
      ? 1
      : (parsedCapacity ?? SPAWN_SESSIONS_DEFAULT)
  // Pre-create an empty session on start so the user has somewhere to type
  // immediately, running in the current directory (exempted from worktree
  // creation in the spawn loop). On by default; --no-create-session-in-dir
  // opts out for a pure on-demand server where every session is isolated.
  // The effectiveResumeSessionId guard at the creation site handles the
  // resume case (skip creation when resume succeeded; fall through to
  // fresh creation on env-mismatch fallback).
  // preCreateSession 会话数据解析`parsedCreateSessionInDir ?? true` 整理出中间结果，供远程桥接会话远程桥接 bridge Main后续步骤使用。
  const preCreateSession = parsedCreateSessionInDir ?? true

  // Without --continue: a leftover pointer means the previous run didn't
  // shut down cleanly (crash, kill -9, terminal closed). Clear it so the
  // stale env doesn't linger past its relevance. Runs in all modes
  // (clearBridgePointer is a no-op when no file exists) — covers the
  // gate-transition case where a user crashed in single-session mode then
  // starts fresh in worktree mode. Only single-session mode writes new
  // pointers.
  // resumeSessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!resumeSessionId) {
    // 从 `await import('./bridgePointer.js')` 解构 clearBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
    const { clearBridgePointer } = await import('./bridgePointer.js')
    // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 bridge Main的异步流程。
    await clearBridgePointer(dir)
  }

  // Worktree mode requires either git or WorktreeCreate/WorktreeRemove hooks.
  // Only reachable via explicit --spawn=worktree (default is same-dir);
  // saved worktree pref was already guarded above.
  // 组合条件 `spawnMode === 'worktree' && !worktreeAvailable` 成立时，远程桥接会话才启用这条专门路径。
  if (spawnMode === 'worktree' && !worktreeAvailable) {
    // biome-ignore lint/suspicious/noConsole: intentional error output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      `Error: Worktree mode requires a git repository or WorktreeCreate hooks configured. Use --spawn=session for single-session mode.`,
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // branch读取`getBranch`，供远程桥接会话后续处理使用。
  const branch = await getBranch()
  // gitRepoUrl读取`getRemoteUrl`，供远程桥接会话后续处理使用。
  const gitRepoUrl = await getRemoteUrl()
  // machineName保存`hostname`，供远程桥接会话后续处理使用。
  const machineName = hostname()
  // bridgeId保存`randomUUID`，供远程桥接会话后续处理使用。
  const bridgeId = randomUUID()

  // 从 `await import('../utils/auth.js')` 解构 handleOAuth401Error，减少远程桥接 bridge Main对同一对象的重复访问。
  const { handleOAuth401Error } = await import('../utils/auth.js')
  // api构建`createBridgeApiClient`，供远程桥接会话后续处理使用。
  const api = createBridgeApiClient({
    baseUrl,
    getAccessToken: getBridgeAccessToken,
    runnerVersion: MACRO.VERSION,
    onDebug: logForDebugging,
    onAuth401: handleOAuth401Error,
    getTrustedDeviceToken,
  })

  // When resuming a session via --session-id, fetch it to learn its
  // environment_id and reuse that for registration (idempotent on the
  // backend). Left undefined otherwise — the backend rejects
  // client-generated UUIDs and will allocate a fresh environment.
  // feature('KAIROS') gate: --session-id is ant-only; parseArgs already
  // rejects the flag when the gate is off, so resumeSessionId is always
  // undefined here in external builds — this guard is for tree-shaking.
  // reuseEnvironmentId 先占位，稍后的条件分支会根据实际输入补齐它。
  let reuseEnvironmentId: string | undefined
  // 组合条件 `feature('KAIROS') && resumeSessionId` 成立时，远程桥接会话才启用这条专门路径。
  if (feature('KAIROS') && resumeSessionId) {
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
      validateBridgeId(resumeSessionId, 'sessionId')
    } catch {
      // biome-ignore lint/suspicious/noConsole: intentional error output
      // 调用 console.error，触发远程桥接会话此处需要的副作用。
      console.error(
        `Error: Invalid session ID "${resumeSessionId}". Session IDs must not contain unsafe characters.`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(1)
    }
    // Proactively refresh the OAuth token — getBridgeSession uses raw axios
    // without the withOAuthRetry 401-refresh logic. An expired-but-present
    // token would otherwise produce a misleading "not found" error.
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续远程桥接 bridge Main的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()
    // 清理相关缓存，确保远程桥接会话下一次读取时重新加载最新数据。
    clearOAuthTokenCache()
    // 从 `await import('./createSession.js')` 解构 getBridgeSession，减少远程桥接 bridge Main对同一对象的重复访问。
    const { getBridgeSession } = await import('./createSession.js')
    // session 会话数据读取`getBridgeSession`，供远程桥接会话后续处理使用。
    const session = await getBridgeSession(resumeSessionId, {
      baseUrl,
      getAccessToken: getBridgeAccessToken,
    })
    // session 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!session) {
      // Session gone on server → pointer is stale. Clear it so the user
      // isn't re-prompted next launch. (Explicit --session-id leaves the
      // pointer alone — it's an independent file they may not even have.)
      // resumePointerDir may be a worktree sibling — clear THAT file.
      // 满足 `resumePointerDir` 时，远程桥接会话执行该分支。
      if (resumePointerDir) {
        // 从 `await import('./bridgePointer.js')` 解构 clearBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
        const { clearBridgePointer } = await import('./bridgePointer.js')
        // 等待 `clearBridgePointer(resumePointerDir)` 完成，再继续远程桥接 bridge Main的异步流程。
        await clearBridgePointer(resumePointerDir)
      }
      // biome-ignore lint/suspicious/noConsole: intentional error output
      // 调用 console.error，触发远程桥接会话此处需要的副作用。
      console.error(
        `Error: Session ${resumeSessionId} not found. It may have been archived or expired, or your login may have lapsed (run \`claude /login\`).`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(1)
    }
    // session.environment_id 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!session.environment_id) {
      // 满足 `resumePointerDir` 时，远程桥接会话执行该分支。
      if (resumePointerDir) {
        // 从 `await import('./bridgePointer.js')` 解构 clearBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
        const { clearBridgePointer } = await import('./bridgePointer.js')
        // 等待 `clearBridgePointer(resumePointerDir)` 完成，再继续远程桥接 bridge Main的异步流程。
        await clearBridgePointer(resumePointerDir)
      }
      // biome-ignore lint/suspicious/noConsole: intentional error output
      // 调用 console.error，触发远程桥接会话此处需要的副作用。
      console.error(
        `Error: Session ${resumeSessionId} has no environment_id. It may never have been attached to a bridge.`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发远程桥接会话此处需要的副作用。
      process.exit(1)
    }
    // reuseEnvironmentId更新为 `session.environment_id`，确保Bridge 通信后续读取最新状态。
    reuseEnvironmentId = session.environment_id
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:init] Resuming session ${resumeSessionId} on environment ${reuseEnvironmentId}`,
    )
  }

  // 配置 集中保存远程桥接 bridge Main要一起传递的字段。
  const config: BridgeConfig = {
    dir,
    machineName,
    branch,
    gitRepoUrl,
    maxSessions,
    spawnMode,
    verbose,
    sandbox,
    bridgeId,
    workerType: 'claude_code',
    environmentId: randomUUID(),
    reuseEnvironmentId,
    apiBaseUrl: baseUrl,
    sessionIngressUrl,
    debugFile,
    sessionTimeoutMs,
  }

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:init] bridgeId=${bridgeId}${reuseEnvironmentId ? ` reuseEnvironmentId=${reuseEnvironmentId}` : ''} dir=${dir} branch=${branch} gitRepoUrl=${gitRepoUrl} machine=${machineName}`,
  )
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:init] apiBaseUrl=${baseUrl} sessionIngressUrl=${sessionIngressUrl}`,
  )
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:init] sandbox=${sandbox}${debugFile ? ` debugFile=${debugFile}` : ''}`,
  )

  // Register the bridge environment before entering the poll loop.
  // environmentId 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentId: string
  // environmentSecret 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentSecret: string
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // reg保存`api.registerBridgeEnvironment`，供远程桥接会话后续处理使用。
    const reg = await api.registerBridgeEnvironment(config)
    // environmentId更新为 `reg.environment_id`，确保Bridge 通信后续读取最新状态。
    environmentId = reg.environment_id
    // environmentSecret更新为 `reg.environment_secret`，确保Bridge 通信后续读取最新状态。
    environmentSecret = reg.environment_secret
  } catch (err) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_registration_failed', {
      status: err instanceof BridgeFatalError ? err.status : undefined,
    })
    // Registration failures are fatal — print a clean message instead of a stack trace.
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发远程桥接会话此处需要的副作用。
    console.error(
      err instanceof BridgeFatalError && err.status === 404
        ? 'Remote Control environments are not available for your account.'
        : `Error: ${errorMessage(err)}`,
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发远程桥接会话此处需要的副作用。
    process.exit(1)
  }

  // Tracks whether the --session-id resume flow completed successfully.
  // Used below to skip fresh session creation and seed initialSessionId.
  // Cleared on env mismatch so we gracefully fall back to a new session.
  // effectiveResumeSessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let effectiveResumeSessionId: string | undefined
  // 组合条件 `feature('KAIROS') && resumeSessionId` 成立时，远程桥接会话才启用这条专门路径。
  if (feature('KAIROS') && resumeSessionId) {
    // `reuseEnvironmentId && environmentId` 与 `reuseEnvi` 不一致时刷新派生状态，避免使用过期结果。
    if (reuseEnvironmentId && environmentId !== reuseEnvironmentId) {
      // Backend returned a different environment_id — the original env
      // expired or was reaped. Reconnect won't work against the new env
      // (session is bound to the old one). Log to sentry for visibility
      // and fall through to fresh session creation on the new env.
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Bridge resume env mismatch: requested ${reuseEnvironmentId}, backend returned ${environmentId}. Falling back to fresh session.`,
        ),
      )
      // biome-ignore lint/suspicious/noConsole: intentional warning output
      // 调用 console.warn，触发远程桥接会话此处需要的副作用。
      console.warn(
        `Warning: Could not resume session ${resumeSessionId} — its environment has expired. Creating a fresh session instead.`,
      )
      // Don't deregister — we're going to use this new environment.
      // effectiveResumeSessionId stays undefined → fresh session path below.
    } else {
      // Force-stop any stale worker instances for this session and re-queue
      // it so our poll loop picks it up. Must happen after registration so
      // the backend knows a live worker exists for the environment.
      //
      // The pointer stores a session_* ID but /bridge/reconnect looks
      // sessions up by their infra tag (cse_*) when ccr_v2_compat_enabled
      // is on. Try both; the conversion is a no-op if already cse_*.
      // infraResumeId保存`toInfraSessionId`，供远程桥接会话后续处理使用。
      const infraResumeId = toInfraSessionId(resumeSessionId)
      // reconnectCandidates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const reconnectCandidates =
        infraResumeId === resumeSessionId
          ? [resumeSessionId]
          : [resumeSessionId, infraResumeId]
      // reconnected标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
      let reconnected = false
      // lastReconnectErr 先占位，稍后的条件分支会根据实际输入补齐它。
      let lastReconnectErr: unknown
      // 按顺序遍历 `reconnectCandidates` 中的candidateId，逐个交给远程桥接会话处理。
      for (const candidateId of reconnectCandidates) {
        // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `api.reconnectSession(environmentId, candidateId)` 完成，再继续远程桥接 bridge Main的异步流程。
          await api.reconnectSession(environmentId, candidateId)
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:init] Session ${candidateId} re-queued via bridge/reconnect`,
          )
          // effectiveResumeSessionId 会话数据更新为 `resumeSessionId`，确保Bridge 通信后续读取最新状态。
          effectiveResumeSessionId = resumeSessionId
          // reconnected更新为 `true`，确保Bridge 通信后续读取最新状态。
          reconnected = true
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        } catch (err) {
          // lastReconnectErr更新为 `err`，确保Bridge 通信后续读取最新状态。
          lastReconnectErr = err
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:init] reconnectSession(${candidateId}) failed: ${errorMessage(err)}`,
          )
        }
      }
      // reconnected缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!reconnected) {
        // err 命名 `lastReconnectErr`，让后续代码直接表达这个值的用途。
        const err = lastReconnectErr

        // Do NOT deregister on transient reconnect failure — at this point
        // environmentId IS the session's own environment. Deregistering
        // would make retry impossible. The backend's 4h TTL cleans up.
        // isFatal标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
        const isFatal = err instanceof BridgeFatalError
        // Clear pointer only on fatal reconnect failure. Transient failures
        // ("try running the same command again") should keep the pointer so
        // next launch re-prompts — that IS the retry mechanism.
        // 组合条件 `resumePointerDir && isFatal` 成立时，远程桥接会话才启用这条专门路径。
        if (resumePointerDir && isFatal) {
          // 从 `await import('./bridgePointer.js')` 解构 clearBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
          const { clearBridgePointer } = await import('./bridgePointer.js')
          // 等待 `clearBridgePointer(resumePointerDir)` 完成，再继续远程桥接 bridge Main的异步流程。
          await clearBridgePointer(resumePointerDir)
        }
        // biome-ignore lint/suspicious/noConsole: intentional error output
        // 调用 console.error，触发远程桥接会话此处需要的副作用。
        console.error(
          isFatal
            ? `Error: ${errorMessage(err)}`
            : `Error: Failed to reconnect session ${resumeSessionId}: ${errorMessage(err)}\nThe session may still be resumable — try running the same command again.`,
        )
        // eslint-disable-next-line custom-rules/no-process-exit
        // 调用 process.exit，触发远程桥接会话此处需要的副作用。
        process.exit(1)
      }
    }
  }

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:init] Registered, server environmentId=${environmentId}`,
  )
  // startupPollConfig 配置读取`getPollIntervalConfig`，供远程桥接会话后续处理使用。
  const startupPollConfig = getPollIntervalConfig()
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_started', {
    max_sessions: config.maxSessions,
    has_debug_file: !!config.debugFile,
    sandbox: config.sandbox,
    verbose: config.verbose,
    heartbeat_interval_ms:
      startupPollConfig.non_exclusive_heartbeat_interval_ms,
    spawn_mode:
      config.spawnMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    spawn_mode_source:
      spawnModeSource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    multi_session_gate: multiSessionEnabled,
    pre_create_session: preCreateSession,
    worktree_available: worktreeAvailable,
  })
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_started', {
    max_sessions: config.maxSessions,
    sandbox: config.sandbox,
    spawn_mode: config.spawnMode,
  })

  // spawner构建`createSessionSpawner`，供远程桥接会话后续处理使用。
  const spawner = createSessionSpawner({
    execPath: process.execPath,
    scriptArgs: spawnScriptArgs(),
    env: process.env,
    verbose,
    sandbox,
    debugFile,
    permissionMode,
    onDebug: logForDebugging,
    // 这个回调绑定到 onActivity: (sessionId, activity) => {，负责远程桥接会话在该局部场景下的响应。
    onActivity: (sessionId, activity) => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:activity] sessionId=${sessionId} ${activity.type} ${activity.summary}`,
      )
    },
    // 这个回调绑定到 onPermissionRequest: (sessionId, request, _accessToken) => {，负责远程桥接会话在该局部场景下的响应。
    onPermissionRequest: (sessionId, request, _accessToken) => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:perm] sessionId=${sessionId} tool=${request.request.tool_name} request_id=${request.request_id} (not auto-approving)`,
      )
    },
  })

  // logger构建`createBridgeLogger`，供远程桥接会话后续处理使用。
  const logger = createBridgeLogger({ verbose })
  // 从 `await import('../utils/detectRepository.js')` 解构 parseGitHubRepository，减少远程桥接 bridge Main对同一对象的重复访问。
  const { parseGitHubRepository } = await import('../utils/detectRepository.js')
  // ownerRepo解析`parseGitHubRepository`，供远程桥接会话后续处理使用。
  const ownerRepo = gitRepoUrl ? parseGitHubRepository(gitRepoUrl) : null
  // Use the repo name from the parsed owner/repo, or fall back to the dir basename
  // repoName格式化`ownerRepo.split`，供远程桥接会话后续处理使用。
  const repoName = ownerRepo ? ownerRepo.split('/').pop()! : basename(dir)
  // logger.setRepoInfo 写入新的状态值，使远程桥接会话后续读取保持一致。
  logger.setRepoInfo(repoName, branch)

  // `w` toggle is available iff we're in a multi-session mode AND worktree
  // is a valid option. When unavailable, the mode suffix and hint are hidden.
  // toggleAvailable标记远程桥接会话远程桥接 bridge Main是否启用对应路径。
  const toggleAvailable = spawnMode !== 'single-session' && worktreeAvailable
  // 满足 `toggleAvailable` 时，远程桥接会话执行该分支。
  if (toggleAvailable) {
    // Safe cast: spawnMode is not single-session (checked above), and the
    // saved-worktree-in-non-git guard + exit check above ensure worktree
    // is only reached when available.
    // logger.setSpawnModeDisplay 写入新的状态值，使远程桥接会话后续读取保持一致。
    logger.setSpawnModeDisplay(spawnMode as 'same-dir' | 'worktree')
  }

  // Listen for keys: space toggles QR code, w toggles spawn mode
  // onStdinData封装成回调，供远程桥接会话远程桥接 bridge Main在事件触发或异步步骤中调用。
  const onStdinData = (data: Buffer): void => {
    // 组合条件 `data[0] === 0x03 || data[0] === 0x04` 成立时，远程桥接会话才启用这条专门路径。
    if (data[0] === 0x03 || data[0] === 0x04) {
      // Ctrl+C / Ctrl+D — trigger graceful shutdown
      // 调用 process.emit，触发远程桥接会话此处需要的副作用。
      process.emit('SIGINT')
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 满足 `data[0] === 0x20 /* space */` 时，远程桥接会话执行该分支。
    if (data[0] === 0x20 /* space */) {
      // 调用 logger.toggleQr，触发远程桥接会话此处需要的副作用。
      logger.toggleQr()
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 满足 `data[0] === 0x77 /* 'w' */` 时，远程桥接会话执行该分支。
    if (data[0] === 0x77 /* 'w' */) {
      // toggleAvailable缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!toggleAvailable) return
      // newMode 先占位，稍后的条件分支会根据实际输入补齐它。
      const newMode: 'same-dir' | 'worktree' =
        config.spawnMode === 'same-dir' ? 'worktree' : 'same-dir'
      // spawnMode更新为 `newMode`，确保Bridge 通信后续读取最新状态。
      config.spawnMode = newMode
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_spawn_mode_toggled', {
        spawn_mode:
          newMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 调用 logger.logStatus，触发远程桥接会话此处需要的副作用。
      logger.logStatus(
        newMode === 'worktree'
          ? 'Spawn mode: worktree (new sessions get isolated git worktrees)'
          : 'Spawn mode: same-dir (new sessions share the current directory)',
      )
      // logger.setSpawnModeDisplay 写入新的状态值，使远程桥接会话后续读取保持一致。
      logger.setSpawnModeDisplay(newMode)
      // 调用 logger.refreshDisplay，触发远程桥接会话此处需要的副作用。
      logger.refreshDisplay()
      // 调用 saveCurrentProjectConfig，触发远程桥接会话此处需要的副作用。
      saveCurrentProjectConfig(current => {
        // 满足 `current.remoteControlSpawnMode === newMode` 时，远程桥接会话执行该分支。
        if (current.remoteControlSpawnMode === newMode) return current
        // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
        return { ...current, remoteControlSpawnMode: newMode }
      })
      // 远程桥接 bridge Main在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }
  // 满足 `process.stdin.isTTY` 时，远程桥接会话执行该分支。
  if (process.stdin.isTTY) {
    // process.stdin.setRawMode 写入新的状态值，使远程桥接会话后续读取保持一致。
    process.stdin.setRawMode(true)
    // 调用 process.stdin.resume，触发远程桥接会话此处需要的副作用。
    process.stdin.resume()
    // 调用 process.stdin.on，触发远程桥接会话此处需要的副作用。
    process.stdin.on('data', onStdinData)
  }

  // controller保存`AbortController`，供远程桥接会话后续处理使用。
  const controller = new AbortController()
  // onSigint封装成回调，供远程桥接会话远程桥接 bridge Main在事件触发或异步步骤中调用。
  const onSigint = (): void => {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge:shutdown] SIGINT received, shutting down')
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    controller.abort()
  }
  // onSigterm封装成回调，供远程桥接会话远程桥接 bridge Main在事件触发或异步步骤中调用。
  const onSigterm = (): void => {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge:shutdown] SIGTERM received, shutting down')
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    controller.abort()
  }
  // 调用 process.on，触发远程桥接会话此处需要的副作用。
  process.on('SIGINT', onSigint)
  // 调用 process.on，触发远程桥接会话此处需要的副作用。
  process.on('SIGTERM', onSigterm)

  // Auto-create an empty session so the user has somewhere to type
  // immediately (matching /remote-control behavior). Controlled by
  // preCreateSession: on by default; --no-create-session-in-dir opts out.
  // When a --session-id resume succeeded, skip creation entirely — the
  // session already exists and bridge/reconnect has re-queued it.
  // When resume was requested but failed on env mismatch, effectiveResumeSessionId
  // is undefined, so we fall through to fresh session creation (honoring the
  // "Creating a fresh session instead" warning printed above).
  // initialSessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let initialSessionId: string | null =
    feature('KAIROS') && effectiveResumeSessionId
      ? effectiveResumeSessionId
      : null
  // 组合条件 `preCreateSession && !(feature('KAIROS') && effectiveResumeSessionId)` 成立时，远程桥接会话才启用这条专门路径。
  if (preCreateSession && !(feature('KAIROS') && effectiveResumeSessionId)) {
    // 从 `await import('./createSession.js')` 解构 createBridgeSession，减少远程桥接 bridge Main对同一对象的重复访问。
    const { createBridgeSession } = await import('./createSession.js')
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // initialSessionId 会话数据更新为 `await createBridgeSession({`，确保Bridge 通信后续读取最新状态。
      initialSessionId = await createBridgeSession({
        environmentId,
        title: name,
        events: [],
        gitRepoUrl,
        branch,
        signal: controller.signal,
        baseUrl,
        getAccessToken: getBridgeAccessToken,
        permissionMode,
      })
      // 满足 `initialSessionId` 时，远程桥接会话执行该分支。
      if (initialSessionId) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:init] Created initial session ${initialSessionId}`,
        )
      }
    } catch (err) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:init] Session creation failed (non-fatal): ${errorMessage(err)}`,
      )
    }
  }

  // Crash-recovery pointer: write immediately so kill -9 at any point
  // after this leaves a recoverable trail. Covers both fresh sessions and
  // resumed ones (so a second crash after resume is still recoverable).
  // Cleared when runBridgeLoop falls through to archive+deregister; left in
  // place on the SIGINT resumable-shutdown return (backup for when the user
  // closes the terminal before copying the printed --session-id hint).
  // Refreshed hourly so a 5h+ session that crashes still has a fresh
  // pointer (staleness checks file mtime, backend TTL is rolling-from-poll).
  // pointerRefreshTimer初始化为空值，后续分支会在有数据时补齐。
  let pointerRefreshTimer: ReturnType<typeof setInterval> | null = null
  // Single-session only: --continue forces single-session mode on resume,
  // so a pointer written in multi-session mode would contradict the user's
  // config when they try to resume. The resumable-shutdown path is also
  // gated to single-session (line ~1254) so the pointer would be orphaned.
  // 当 `initialSessionId && spawnMode` 匹配 `'single-session'` 时，远程桥接会话执行对应分支。
  if (initialSessionId && spawnMode === 'single-session') {
    // 从 `await import('./bridgePointer.js')` 解构 writeBridgePointer，减少远程桥接 bridge Main对同一对象的重复访问。
    const { writeBridgePointer } = await import('./bridgePointer.js')
    // pointerPayload 集中保存远程桥接会话远程桥接 bridge Main要一起传递的字段。
    const pointerPayload = {
      sessionId: initialSessionId,
      environmentId,
      source: 'standalone' as const,
    }
    // 等待 `writeBridgePointer(config.dir, pointerPayload)` 完成，再继续远程桥接 bridge Main的异步流程。
    await writeBridgePointer(config.dir, pointerPayload)
    // pointerRefreshTimer更新为 `setInterval(`，确保Bridge 通信后续读取最新状态。
    pointerRefreshTimer = setInterval(
      writeBridgePointer,
      60 * 60 * 1000,
      config.dir,
      pointerPayload,
    )
    // Don't let the interval keep the process alive on its own.
    // 调用 pointerRefreshTimer.unref?.()，完成这一处局部操作。
    pointerRefreshTimer.unref?.()
  }

  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `runBridgeLoop(` 完成，再继续远程桥接 bridge Main的异步流程。
    await runBridgeLoop(
      config,
      environmentId,
      environmentSecret,
      api,
      spawner,
      logger,
      controller.signal,
      undefined,
      initialSessionId ?? undefined,
      // 调用 async，触发远程桥接会话此处需要的副作用。
      async () => {
        // Clear the memoized OAuth token cache so we re-read from secure
        // storage, picking up tokens refreshed by child processes.
        // 清理相关缓存，确保远程桥接会话下一次读取时重新加载最新数据。
        clearOAuthTokenCache()
        // Proactively refresh the token if it's expired on disk too.
        // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续远程桥接 bridge Main的异步流程。
        await checkAndRefreshOAuthTokenIfNeeded()
        // 返回 `getBridgeAccessToken()`，作为远程桥接会话这次计算的结果。
        return getBridgeAccessToken()
      },
    )
  } finally {
    // `pointerRefreshTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (pointerRefreshTimer !== null) {
      // 调用 clearInterval，触发远程桥接会话此处需要的副作用。
      clearInterval(pointerRefreshTimer)
    }
    // 调用 process.off，触发远程桥接会话此处需要的副作用。
    process.off('SIGINT', onSigint)
    // 调用 process.off，触发远程桥接会话此处需要的副作用。
    process.off('SIGTERM', onSigterm)
    // 调用 process.stdin.off，触发远程桥接会话此处需要的副作用。
    process.stdin.off('data', onStdinData)
    // 满足 `process.stdin.isTTY` 时，远程桥接会话执行该分支。
    if (process.stdin.isTTY) {
      // process.stdin.setRawMode 写入新的状态值，使远程桥接会话后续读取保持一致。
      process.stdin.setRawMode(false)
    }
    // 调用 process.stdin.pause，触发远程桥接会话此处需要的副作用。
    process.stdin.pause()
  }

  // The bridge bypasses init.ts (and its graceful shutdown handler), so we
  // must exit explicitly.
  // eslint-disable-next-line custom-rules/no-process-exit
  // 调用 process.exit，触发远程桥接会话此处需要的副作用。
  process.exit(0)
}

// ─── Headless bridge (daemon worker) ────────────────────────────────────────

/**
 * Thrown by runBridgeHeadless for configuration issues the supervisor should
 * NOT retry (trust not accepted, worktree unavailable, http-not-https). The
 * daemon worker catches this and exits with EXIT_CODE_PERMANENT so the
 * supervisor parks the worker instead of respawning it on backoff.
 */
// BridgeHeadlessPermanentError 聚合远程桥接会话相关状态与操作，把同一职责的行为收束到类实例中。
export class BridgeHeadlessPermanentError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发远程桥接会话此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'BridgeHeadlessPermanentError'，同步远程桥接会话的内部状态。
    this.name = 'BridgeHeadlessPermanentError'
  }
}

// HeadlessBridgeOpts 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type HeadlessBridgeOpts = {
  dir: string
  name?: string
  spawnMode: 'same-dir' | 'worktree'
  capacity: number
  permissionMode?: string
  sandbox: boolean
  sessionTimeoutMs?: number
  createSessionOnStart: boolean
  // 这个回调绑定到 getAccessToken: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAccessToken: () => string | undefined
  // 这个回调绑定到 onAuth401: (failedToken: string) => Promise<boolean>，负责远程桥接会话在该局部场景下的响应。
  onAuth401: (failedToken: string) => Promise<boolean>
  // 这个回调绑定到 log: (s: string) => void，负责远程桥接会话在该局部场景下的响应。
  log: (s: string) => void
}

/**
 * Non-interactive bridge entrypoint for the `remoteControl` daemon worker.
 *
 * Linear subset of bridgeMain(): no readline dialogs, no stdin key handlers,
 * no TUI, no process.exit(). Config comes from the caller (daemon.json), auth
 * comes via IPC (supervisor's AuthManager), logs go to the worker's stdout
 * pipe. Throws on fatal errors — the worker catches and maps permanent vs
 * transient to the right exit code.
 *
 * Resolves cleanly when `signal` aborts and the poll loop tears down.
 */
// runBridgeHeadless 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runBridgeHeadless(
  opts: HeadlessBridgeOpts,
  signal: AbortSignal,
): Promise<void> {
  // 从 `opts` 解构 dir、log，减少远程桥接 bridge Main对同一对象的重复访问。
  const { dir, log } = opts

  // Worker inherits the supervisor's CWD. chdir first so git utilities
  // (getBranch/getRemoteUrl) — which read from bootstrap CWD state set
  // below — resolve against the right repo.
  // 调用 process.chdir，触发远程桥接会话此处需要的副作用。
  process.chdir(dir)
  // 从 `await import('../bootstrap/state.js')` 解构 setOriginalCwd、setCwdState，减少远程桥接 bridge Main对同一对象的重复访问。
  const { setOriginalCwd, setCwdState } = await import('../bootstrap/state.js')
  // setOriginalCwd 写入新的状态值，使远程桥接会话后续读取保持一致。
  setOriginalCwd(dir)
  // setCwdState 写入新的状态值，使远程桥接会话后续读取保持一致。
  setCwdState(dir)

  // 从 `await import(` 解构 enableConfigs、checkHasTrustDialogAccepted，减少远程桥接 bridge Main对同一对象的重复访问。
  const { enableConfigs, checkHasTrustDialogAccepted } = await import(
    '../utils/config.js'
  )
  // 调用 enableConfigs，触发远程桥接会话此处需要的副作用。
  enableConfigs()
  // 从 `await import('../utils/sinks.js')` 解构 initSinks，减少远程桥接 bridge Main对同一对象的重复访问。
  const { initSinks } = await import('../utils/sinks.js')
  // 调用 initSinks，触发远程桥接会话此处需要的副作用。
  initSinks()

  // 满足 `!checkHasTrustDialogAccepted()` 时，远程桥接会话执行该分支。
  if (!checkHasTrustDialogAccepted()) {
    // 抛出 new BridgeHeadlessPermanentError(，阻止远程桥接会话在无效状态下继续运行。
    throw new BridgeHeadlessPermanentError(
      `Workspace not trusted: ${dir}. Run \`claude\` in that directory first to accept the trust dialog.`,
    )
  }

  // 满足 `!opts.getAccessToken()` 时，远程桥接会话执行该分支。
  if (!opts.getAccessToken()) {
    // Transient — supervisor's AuthManager may pick up a token on next cycle.
    // 抛出 new Error(BRIDGE_LOGIN_ERROR)，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(BRIDGE_LOGIN_ERROR)
  }

  // 从 `await import('./bridgeConfig.js')` 解构 getBridgeBaseUrl，减少远程桥接 bridge Main对同一对象的重复访问。
  const { getBridgeBaseUrl } = await import('./bridgeConfig.js')
  // baseUrl读取`getBridgeBaseUrl`，供远程桥接会话后续处理使用。
  const baseUrl = getBridgeBaseUrl()
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    baseUrl.startsWith('http://') &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1')
  ) {
    // 抛出 new BridgeHeadlessPermanentError(，阻止远程桥接会话在无效状态下继续运行。
    throw new BridgeHeadlessPermanentError(
      'Remote Control base URL uses HTTP. Only HTTPS or localhost HTTP is allowed.',
    )
  }
  // sessionIngressUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sessionIngressUrl =
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      ? process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      : baseUrl

  // 从 `await import(` 解构 getBranch、getRemoteUrl、findGitRoot，减少远程桥接 bridge Main对同一对象的重复访问。
  const { getBranch, getRemoteUrl, findGitRoot } = await import(
    '../utils/git.js'
  )
  // 从 `await import('../utils/hooks.js')` 解构 hasWorktreeCreateHook，减少远程桥接 bridge Main对同一对象的重复访问。
  const { hasWorktreeCreateHook } = await import('../utils/hooks.js')

  // 当 `opts.spawnMode` 匹配 `'worktree'` 时，远程桥接会话执行对应分支。
  if (opts.spawnMode === 'worktree') {
    // worktreeAvailable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const worktreeAvailable =
      hasWorktreeCreateHook() || findGitRoot(dir) !== null
    // worktreeAvailable缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!worktreeAvailable) {
      // 抛出 new BridgeHeadlessPermanentError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeHeadlessPermanentError(
        `Worktree mode requires a git repository or WorktreeCreate hooks. Directory ${dir} has neither.`,
      )
    }
  }

  // branch读取`getBranch`，供远程桥接会话后续处理使用。
  const branch = await getBranch()
  // gitRepoUrl读取`getRemoteUrl`，供远程桥接会话后续处理使用。
  const gitRepoUrl = await getRemoteUrl()
  // machineName保存`hostname`，供远程桥接会话后续处理使用。
  const machineName = hostname()
  // bridgeId保存`randomUUID`，供远程桥接会话后续处理使用。
  const bridgeId = randomUUID()

  // 配置 集中保存远程桥接 bridge Main要一起传递的字段。
  const config: BridgeConfig = {
    dir,
    machineName,
    branch,
    gitRepoUrl,
    maxSessions: opts.capacity,
    spawnMode: opts.spawnMode,
    verbose: false,
    sandbox: opts.sandbox,
    bridgeId,
    workerType: 'claude_code',
    environmentId: randomUUID(),
    apiBaseUrl: baseUrl,
    sessionIngressUrl,
    sessionTimeoutMs: opts.sessionTimeoutMs,
  }

  // api构建`createBridgeApiClient`，供远程桥接会话后续处理使用。
  const api = createBridgeApiClient({
    baseUrl,
    getAccessToken: opts.getAccessToken,
    runnerVersion: MACRO.VERSION,
    onDebug: log,
    onAuth401: opts.onAuth401,
    getTrustedDeviceToken,
  })

  // environmentId 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentId: string
  // environmentSecret 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentSecret: string
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // reg保存`api.registerBridgeEnvironment`，供远程桥接会话后续处理使用。
    const reg = await api.registerBridgeEnvironment(config)
    // environmentId更新为 `reg.environment_id`，确保Bridge 通信后续读取最新状态。
    environmentId = reg.environment_id
    // environmentSecret更新为 `reg.environment_secret`，确保Bridge 通信后续读取最新状态。
    environmentSecret = reg.environment_secret
  } catch (err) {
    // Transient — let supervisor backoff-retry.
    // 抛出 new Error(`Bridge registration failed: ${errorMessage(err)}`)，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(`Bridge registration failed: ${errorMessage(err)}`)
  }

  // spawner构建`createSessionSpawner`，供远程桥接会话后续处理使用。
  const spawner = createSessionSpawner({
    execPath: process.execPath,
    scriptArgs: spawnScriptArgs(),
    env: process.env,
    verbose: false,
    sandbox: opts.sandbox,
    permissionMode: opts.permissionMode,
    onDebug: log,
  })

  // logger构建`createHeadlessBridgeLogger`，供远程桥接会话后续处理使用。
  const logger = createHeadlessBridgeLogger(log)
  // 调用 logger.printBanner，触发远程桥接会话此处需要的副作用。
  logger.printBanner(config, environmentId)

  // initialSessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let initialSessionId: string | undefined
  // 满足 `opts.createSessionOnStart` 时，远程桥接会话执行该分支。
  if (opts.createSessionOnStart) {
    // 从 `await import('./createSession.js')` 解构 createBridgeSession，减少远程桥接 bridge Main对同一对象的重复访问。
    const { createBridgeSession } = await import('./createSession.js')
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // sid构建`createBridgeSession`，供远程桥接会话后续处理使用。
      const sid = await createBridgeSession({
        environmentId,
        title: opts.name,
        events: [],
        gitRepoUrl,
        branch,
        signal,
        baseUrl,
        getAccessToken: opts.getAccessToken,
        permissionMode: opts.permissionMode,
      })
      // 满足 `sid` 时，远程桥接会话执行该分支。
      if (sid) {
        // initialSessionId 会话数据更新为 `sid`，确保Bridge 通信后续读取最新状态。
        initialSessionId = sid
        // 调用 log，触发远程桥接会话此处需要的副作用。
        log(`created initial session ${sid}`)
      }
    } catch (err) {
      // log 使用 `session pre-creation failed (non-fatal 完成远程桥接会话里的对应操作。
      log(`session pre-creation failed (non-fatal): ${errorMessage(err)}`)
    }
  }

  // 等待 `runBridgeLoop(` 完成，再继续远程桥接 bridge Main的异步流程。
  await runBridgeLoop(
    config,
    environmentId,
    environmentSecret,
    api,
    spawner,
    logger,
    signal,
    undefined,
    initialSessionId,
    // 调用 async，触发远程桥接会话此处需要的副作用。
    async () => opts.getAccessToken(),
  )
}

/** BridgeLogger adapter that routes everything to a single line-log fn. */
// createHeadlessBridgeLogger 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createHeadlessBridgeLogger(log: (s: string) => void): BridgeLogger {
  // noop封装成回调，供远程桥接会话远程桥接 bridge Main在事件触发或异步步骤中调用。
  const noop = (): void => {}
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // 这个回调绑定到 printBanner: (cfg, envId) =>，负责远程桥接会话在该局部场景下的响应。
    printBanner: (cfg, envId) =>
      log(
        `registered environmentId=${envId} dir=${cfg.dir} spawnMode=${cfg.spawnMode} capacity=${cfg.maxSessions}`,
      ),
    // 这个回调绑定到 logSessionStart: (id, _prompt) => log(`session start ${id}`),，负责远程桥接会话在该局部场景下的响应。
    logSessionStart: (id, _prompt) => log(`session start ${id}`),
    // 这个回调绑定到 logSessionComplete: (id, ms) => log(`session complete ${id} (${ms}ms)`),，负责远程桥接会话在该局部场景下的响应。
    logSessionComplete: (id, ms) => log(`session complete ${id} (${ms}ms)`),
    // 这个回调绑定到 logSessionFailed: (id, err) => log(`session failed ${id}: ${err}`),，负责远程桥接会话在该局部场景下的响应。
    logSessionFailed: (id, err) => log(`session failed ${id}: ${err}`),
    logStatus: log,
    logVerbose: log,
    // 这个回调绑定到 logError: s => log(`error: ${s}`),，负责远程桥接会话在该局部场景下的响应。
    logError: s => log(`error: ${s}`),
    // 这个回调绑定到 logReconnected: ms => log(`reconnected after ${ms}ms`),，负责远程桥接会话在该局部场景下的响应。
    logReconnected: ms => log(`reconnected after ${ms}ms`),
    // 这个回调绑定到 addSession: (id, _url) => log(`session attached ${id}`),，负责远程桥接会话在该局部场景下的响应。
    addSession: (id, _url) => log(`session attached ${id}`),
    // 这个回调绑定到 removeSession: id => log(`session detached ${id}`),，负责远程桥接会话在该局部场景下的响应。
    removeSession: id => log(`session detached ${id}`),
    updateIdleStatus: noop,
    updateReconnectingStatus: noop,
    updateSessionStatus: noop,
    updateSessionActivity: noop,
    updateSessionCount: noop,
    updateFailedStatus: noop,
    setSpawnModeDisplay: noop,
    setRepoInfo: noop,
    setDebugLogPath: noop,
    setAttached: noop,
    setSessionTitle: noop,
    clearStatus: noop,
    toggleQr: noop,
    refreshDisplay: noop,
  }
}
