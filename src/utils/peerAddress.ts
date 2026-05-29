/**
 * Peer address parsing — kept separate from peerRegistry.ts so that
 * SendMessageTool can import parseAddress without transitively loading
 * the bridge (axios) and UDS (fs, net) modules at tool-enumeration time.
 */

/** Parse a URI-style address into scheme + target. */
// parseAddress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAddress(to: string): {
  scheme: 'uds' | 'bridge' | 'other'
  target: string
} {
  // 满足 `to.startsWith('uds:')) return { scheme: 'uds', target: to.slice(4` 时，共享工具执行该分支。
  if (to.startsWith('uds:')) return { scheme: 'uds', target: to.slice(4) }
  // 满足 `to.startsWith('bridge:')) return { scheme: 'bridge', target: to.slice(7` 时，共享工具执行该分支。
  if (to.startsWith('bridge:')) return { scheme: 'bridge', target: to.slice(7) }
  // Legacy: old-code UDS senders emit bare socket paths in from=; route them
  // through the UDS branch so replies aren't silently dropped into teammate
  // routing. (No bare-session-ID fallback — bridge messaging is new enough
  // that no old senders exist, and the prefix would hijack teammate names
  // like session_manager.)
  // 满足 `to.startsWith('/')` 时，共享工具执行该分支。
  if (to.startsWith('/')) return { scheme: 'uds', target: to }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { scheme: 'other', target: to }
}
