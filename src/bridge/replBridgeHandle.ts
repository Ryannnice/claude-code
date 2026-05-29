// 复用 updateSessionBridgeId 工具函数，把通用处理留在 ../utils/concurrentSessions.js 中维护。
import { updateSessionBridgeId } from '../utils/concurrentSessions.js'
// 类型依赖 { ReplBridgeHandle } 来自 ./replBridge.js，用于校准远程桥接会话的数据契约。
import type { ReplBridgeHandle } from './replBridge.js'
// 引入 toCompatSessionId，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { toCompatSessionId } from './sessionIdCompat.js'

/**
 * Global pointer to the active REPL bridge handle, so callers outside
 * useReplBridge's React tree (tools, slash commands) can invoke handle methods
 * like subscribePR. Same one-bridge-per-process justification as bridgeDebug.ts
 * — the handle's closure captures the sessionId and getAccessToken that created
 * the session, and re-deriving those independently (BriefTool/upload.ts pattern)
 * risks staging/prod token divergence.
 *
 * Set from useReplBridge.tsx when init completes; cleared on teardown.
 */

// handle 命名 `null`，让后续代码直接表达这个值的用途。
let handle: ReplBridgeHandle | null = null

// setReplBridgeHandle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setReplBridgeHandle(h: ReplBridgeHandle | null): void {
  // handle更新为 `h`，确保Bridge 通信后续读取最新状态。
  handle = h
  // Publish (or clear) our bridge session ID in the session record so other
  // local peers can dedup us out of their bridge list — local is preferred.
  // 这个回调绑定到 void updateSessionBridgeId(getSelfBridgeCompatId() ?? null).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
  void updateSessionBridgeId(getSelfBridgeCompatId() ?? null).catch(() => {})
}

// getReplBridgeHandle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getReplBridgeHandle(): ReplBridgeHandle | null {
  // 返回 `handle`，作为远程桥接会话这次计算的结果。
  return handle
}

/**
 * Our own bridge session ID in the session_* compat format the API returns
 * in /v1/sessions responses — or undefined if bridge isn't connected.
 */
// getSelfBridgeCompatId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSelfBridgeCompatId(): string | undefined {
  // h读取`getReplBridgeHandle`，供远程桥接会话后续处理使用。
  const h = getReplBridgeHandle()
  // 返回 `h ? toCompatSessionId(h.bridgeSessionId) : undefined`，作为远程桥接会话这次计算的结果。
  return h ? toCompatSessionId(h.bridgeSessionId) : undefined
}
