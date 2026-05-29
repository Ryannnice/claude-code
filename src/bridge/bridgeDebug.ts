// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 引入 BridgeFatalError，将 ./bridgeApi.js 中已经封装好的能力接到本文件流程里。
import { BridgeFatalError } from './bridgeApi.js'
// 类型依赖 { BridgeApiClient } 来自 ./types.js，用于校准远程桥接会话的数据契约。
import type { BridgeApiClient } from './types.js'

/**
 * Ant-only fault injection for manually testing bridge recovery paths.
 *
 * Real failure modes this targets (BQ 2026-03-12, 7-day window):
 *   poll 404 not_found_error   — 147K sessions/week, dead onEnvironmentLost gate
 *   ws_closed 1002/1006        —  22K sessions/week, zombie poll after close
 *   register transient failure —  residual: network blips during doReconnect
 *
 * Usage: /bridge-kick <subcommand> from the REPL while Remote Control is
 * connected, then tail debug.log to watch the recovery machinery react.
 *
 * Module-level state is intentional here: one bridge per REPL process, the
 * /bridge-kick slash command has no other way to reach into initBridgeCore's
 * closures, and teardown clears the slot.
 */

/** One-shot fault to inject on the next matching api call. */
// BridgeFault 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type BridgeFault = {
  method:
    | 'pollForWork'
    | 'registerBridgeEnvironment'
    | 'reconnectSession'
    | 'heartbeatWork'
  /** Fatal errors go through handleErrorStatus → BridgeFatalError. Transient
   *  errors surface as plain axios rejections (5xx / network). Recovery code
   *  distinguishes the two: fatal → teardown, transient → retry/backoff. */
  kind: 'fatal' | 'transient'
  status: number
  errorType?: string
  /** Remaining injections. Decremented on consume; removed at 0. */
  count: number
}

// BridgeDebugHandle 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgeDebugHandle = {
  /** Invoke the transport's permanent-close handler directly. Tests the
   *  ws_closed → reconnectEnvironmentWithSession escalation (#22148). */
  // 这个回调绑定到 fireClose: (code: number) => void，负责远程桥接会话在该局部场景下的响应。
  fireClose: (code: number) => void
  /** Call reconnectEnvironmentWithSession() — same as SIGUSR2 but
   *  reachable from the slash command. */
  // 这个回调绑定到 forceReconnect: () => void，负责远程桥接会话在该局部场景下的响应。
  forceReconnect: () => void
  /** Queue a fault for the next N calls to the named api method. */
  // 这个回调绑定到 injectFault: (fault: BridgeFault) => void，负责远程桥接会话在该局部场景下的响应。
  injectFault: (fault: BridgeFault) => void
  /** Abort the at-capacity sleep so an injected poll fault lands
   *  immediately instead of up to 10min later. */
  // 这个回调绑定到 wakePollLoop: () => void，负责远程桥接会话在该局部场景下的响应。
  wakePollLoop: () => void
  /** env/session IDs for the debug.log grep. */
  // 这个回调绑定到 describe: () => string，负责远程桥接会话在该局部场景下的响应。
  describe: () => string
}

// debugHandle初始化为空值，后续分支会在有数据时补齐。
let debugHandle: BridgeDebugHandle | null = null
// faultQueue 从空数组开始收集，后续循环会按处理顺序追加条目。
const faultQueue: BridgeFault[] = []

// registerBridgeDebugHandle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerBridgeDebugHandle(h: BridgeDebugHandle): void {
  // debugHandle更新为 `h`，确保Bridge 通信后续读取最新状态。
  debugHandle = h
}

// clearBridgeDebugHandle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBridgeDebugHandle(): void {
  // debugHandle更新为 `null`，确保Bridge 通信后续读取最新状态。
  debugHandle = null
  // faultQueue被清空，Bridge 通信从干净状态继续。
  faultQueue.length = 0
}

// getBridgeDebugHandle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeDebugHandle(): BridgeDebugHandle | null {
  // 返回 `debugHandle`，作为远程桥接会话这次计算的结果。
  return debugHandle
}

// injectBridgeFault 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function injectBridgeFault(fault: BridgeFault): void {
  // faultQueue追加新条目，保持收集顺序与输入顺序一致。
  faultQueue.push(fault)
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:debug] Queued fault: ${fault.method} ${fault.kind}/${fault.status}${fault.errorType ? `/${fault.errorType}` : ''} ×${fault.count}`,
  )
}

/**
 * Wrap a BridgeApiClient so each call first checks the fault queue. If a
 * matching fault is queued, throw the specified error instead of calling
 * through. Delegates everything else to the real client.
 *
 * Only called when USER_TYPE === 'ant' — zero overhead in external builds.
 */
// wrapApiForFaultInjection 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapApiForFaultInjection(
  api: BridgeApiClient,
): BridgeApiClient {
  // consume 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function consume(method: BridgeFault['method']): BridgeFault | null {
    // idx筛选`faultQueue.findIndex`，供远程桥接会话后续处理使用。
    const idx = faultQueue.findIndex(f => f.method === method)
    // 满足 `idx === -1` 时，远程桥接会话执行该分支。
    if (idx === -1) return null
    // fault 命名 `faultQueue[idx]!`，让后续代码直接表达这个值的用途。
    const fault = faultQueue[idx]!
    // 远程桥接 bridge Debug在这里处理 `fault.count--`，完成这一小步状态转换。
    fault.count--
    // 满足 `fault.count <= 0) faultQueue.splice(idx, 1` 时，远程桥接会话执行该分支。
    if (fault.count <= 0) faultQueue.splice(idx, 1)
    // 返回 `fault`，作为远程桥接会话这次计算的结果。
    return fault
  }

  // throwFault 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function throwFault(fault: BridgeFault, context: string): never {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:debug] Injecting ${fault.kind} fault into ${context}: status=${fault.status} errorType=${fault.errorType ?? 'none'}`,
    )
    // 当 `fault.kind` 匹配 `'fatal'` 时，远程桥接会话执行对应分支。
    if (fault.kind === 'fatal') {
      // 抛出 new BridgeFatalError(，阻止远程桥接会话在无效状态下继续运行。
      throw new BridgeFatalError(
        `[injected] ${context} ${fault.status}`,
        fault.status,
        fault.errorType,
      )
    }
    // Transient: mimic an axios rejection (5xx / network). No .status on
    // the error itself — that's how the catch blocks distinguish.
    // 抛出 new Error(`[injected transient] ${context} ${fault.status}`)，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(`[injected transient] ${context} ${fault.status}`)
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    ...api,
    // pollForWork 使用 envId, secret, signal, reclaimMs 完成远程桥接会话里的对应操作。
    async pollForWork(envId, secret, signal, reclaimMs) {
      // f保存`consume`，供远程桥接会话后续处理使用。
      const f = consume('pollForWork')
      // 满足 `f) throwFault(f, 'Poll'` 时，远程桥接会话执行该分支。
      if (f) throwFault(f, 'Poll')
      // 返回 `api.pollForWork(envId, secret, signal, reclaimMs)`，作为远程桥接会话这次计算的结果。
      return api.pollForWork(envId, secret, signal, reclaimMs)
    },
    // registerBridgeEnvironment 使用 config 完成远程桥接会话里的对应操作。
    async registerBridgeEnvironment(config) {
      // f保存`consume`，供远程桥接会话后续处理使用。
      const f = consume('registerBridgeEnvironment')
      // 满足 `f) throwFault(f, 'Registration'` 时，远程桥接会话执行该分支。
      if (f) throwFault(f, 'Registration')
      // 返回 `api.registerBridgeEnvironment(config)`，作为远程桥接会话这次计算的结果。
      return api.registerBridgeEnvironment(config)
    },
    // reconnectSession 使用 envId, sessionId 完成远程桥接会话里的对应操作。
    async reconnectSession(envId, sessionId) {
      // f保存`consume`，供远程桥接会话后续处理使用。
      const f = consume('reconnectSession')
      // 满足 `f) throwFault(f, 'ReconnectSession'` 时，远程桥接会话执行该分支。
      if (f) throwFault(f, 'ReconnectSession')
      // 返回 `api.reconnectSession(envId, sessionId)`，作为远程桥接会话这次计算的结果。
      return api.reconnectSession(envId, sessionId)
    },
    // heartbeatWork 使用 envId, workId, token 完成远程桥接会话里的对应操作。
    async heartbeatWork(envId, workId, token) {
      // f保存`consume`，供远程桥接会话后续处理使用。
      const f = consume('heartbeatWork')
      // 满足 `f) throwFault(f, 'Heartbeat'` 时，远程桥接会话执行该分支。
      if (f) throwFault(f, 'Heartbeat')
      // 返回 `api.heartbeatWork(envId, workId, token)`，作为远程桥接会话这次计算的结果。
      return api.heartbeatWork(envId, workId, token)
    },
  }
}
