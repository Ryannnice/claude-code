/**
 * Permission prompts over channels (Telegram, iMessage, Discord).
 *
 * Mirrors `BridgePermissionCallbacks` — when CC hits a permission dialog,
 * it ALSO sends the prompt via active channels and races the reply against
 * local UI / bridge / hooks / classifier. First resolver wins via claim().
 *
 * Inbound is a structured event: the server parses the user's "yes tbxkq"
 * reply and emits notifications/claude/channel/permission with
 * {request_id, behavior}. CC never sees the reply as text — approval
 * requires the server to deliberately emit that specific event, not just
 * relay content. Servers opt in by declaring
 * capabilities.experimental['claude/channel/permission'].
 *
 * Kenneth's "would this let Claude self-approve?": the approving party is
 * the human via the channel, not Claude. But the trust boundary isn't the
 * terminal — it's the allowlist (tengu_harbor_ledger). A compromised
 * channel server CAN fabricate "yes <id>" without the human seeing the
 * prompt. Accepted risk: a compromised channel already has unlimited
 * conversation-injection turns (social-engineer over time, wait for
 * acceptEdits, etc.); inject-then-self-approve is faster, not more
 * capable. The dialog slows a compromised channel; it doesn't stop one.
 * See PR discussion 2956440848.
 */

// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'

/**
 * GrowthBook runtime gate — separate from the channels gate (tengu_harbor)
 * so channels can ship without permission-relay riding along (Kenneth: "no
 * bake time if it goes out tomorrow"). Default false; flip without a release.
 * Checked once at useManageMCPConnections mount — mid-session flag changes
 * don't apply until restart.
 */
// isChannelPermissionRelayEnabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isChannelPermissionRelayEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_harbor_permissions', false)`，作为MCP 服务这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_harbor_permissions', false)
}

// ChannelPermissionResponse 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelPermissionResponse = {
  behavior: 'allow' | 'deny'
  /** Which channel server the reply came from (e.g., "plugin:telegram:tg"). */
  fromServer: string
}

// ChannelPermissionCallbacks 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelPermissionCallbacks = {
  /** Register a resolver for a request ID. Returns unsubscribe. */
  onResponse(
    requestId: string,
    // 这个回调绑定到 handler: (response: ChannelPermissionResponse) => void,，负责MCP 服务在该局部场景下的响应。
    handler: (response: ChannelPermissionResponse) => void,
  ): () => void
  /** Resolve a pending request from a structured channel event
   *  (notifications/claude/channel/permission). Returns true if the ID
   *  was pending — the server parsed the user's reply and emitted
   *  {request_id, behavior}; we just match against the map. */
  // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
  resolve(
    requestId: string,
    behavior: 'allow' | 'deny',
    fromServer: string,
  ): boolean
}

/**
 * Reply format spec for channel servers to implement:
 *   /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i
 *
 * 5 lowercase letters, no 'l' (looks like 1/I). Case-insensitive (phone
 * autocorrect). No bare yes/no (conversational). No prefix/suffix chatter.
 *
 * CC generates the ID and sends the prompt. The SERVER parses the user's
 * reply and emits notifications/claude/channel/permission with {request_id,
 * behavior} — CC doesn't regex-match text anymore. Exported so plugins can
 * import the exact regex rather than hand-copying it.
 */
// PERMISSION_REPLY_RE 权限数据 命名 `/^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i`，让后续代码直接表达这个值的用途。
export const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i

// 25-letter alphabet: a-z minus 'l' (looks like 1/I). 25^5 ≈ 9.8M space.
// ID_ALPHABET 命名 `'abcdefghijkmnopqrstuvwxyz'`，让后续代码直接表达这个值的用途。
const ID_ALPHABET = 'abcdefghijkmnopqrstuvwxyz'

// Substring blocklist — 5 random letters can spell things (Kenneth, in the
// launch thread: "this is why i bias to numbers, hard to have anything worse
// than 80085"). Non-exhaustive, covers the send-to-your-boss-by-accident
// tier. If a generated ID contains any of these, re-hash with a salt.
// prettier-ignore
// ID_AVOID_SUBSTRINGS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ID_AVOID_SUBSTRINGS = [
  'fuck',
  'shit',
  'cunt',
  'cock',
  'dick',
  'twat',
  'piss',
  'crap',
  'bitch',
  'whore',
  'ass',
  'tit',
  'cum',
  'fag',
  'dyke',
  'nig',
  'kike',
  'rape',
  'nazi',
  'damn',
  'poo',
  'pee',
  'wank',
  'anus',
]

// hashToId 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashToId(input: string): string {
  // FNV-1a → uint32, then base-25 encode. Not crypto, just a stable
  // short letters-only ID. 32 bits / log2(25) ≈ 6.9 letters of entropy;
  // taking 5 wastes a little, plenty for this.
  // h保存`0x811c9dc5`，供MCP 服务MCP 服务 channel Permissions后续判断或输出使用。
  let h = 0x811c9dc5
  // 按索引扫描 `input.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < input.length; i++) {
    // MCP 服务 channel Permissions在这里处理 `h ^= input.charCodeAt(i)`，完成这一小步状态转换。
    h ^= input.charCodeAt(i)
    // h更新为 `Math.imul(h, 0x01000193)`，确保MCP 服务后续读取最新状态。
    h = Math.imul(h, 0x01000193)
  }
  // h更新为 `h >>> 0`，确保MCP 服务后续读取最新状态。
  h = h >>> 0
  // s 集合 命名 `''`，让后续代码直接表达这个值的用途。
  let s = ''
  // 按索引扫描 `5`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 5; i++) {
    // MCP 服务 channel Permissions在这里处理 `s += ID_ALPHABET[h % 25]`，完成这一小步状态转换。
    s += ID_ALPHABET[h % 25]
    // h更新为 `Math.floor(h / 25)`，确保MCP 服务后续读取最新状态。
    h = Math.floor(h / 25)
  }
  // 返回 `s`，作为MCP 服务这次计算的结果。
  return s
}

/**
 * Short ID from a toolUseID. 5 letters from a 25-char alphabet (a-z minus
 * 'l' — looks like 1/I in many fonts). 25^5 ≈ 9.8M space, birthday
 * collision at 50% needs ~3K simultaneous pending prompts, absurd for a
 * single interactive session. Letters-only so phone users don't switch
 * keyboard modes (hex alternates a-f/0-9 → mode toggles). Re-hashes with
 * a salt suffix if the result contains a blocklisted substring — 5 random
 * letters can spell things you don't want in a text message to your phone.
 * toolUseIDs are `toolu_` + base64-ish; we hash rather than slice.
 */
// shortRequestId 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shortRequestId(toolUseID: string): string {
  // 7 length-3 × 3 positions × 25² + 15 length-4 × 2 × 25 + 2 length-5
  // ≈ 13,877 blocked IDs out of 9.8M — roughly 1 in 700 hits the blocklist.
  // Cap at 10 retries; (1/700)^10 is negligible.
  // candidate保存`hashToId`，供MCP 服务后续处理使用。
  let candidate = hashToId(toolUseID)
  // 按索引扫描 `10`，需要消费相邻参数时可以精确移动游标。
  for (let salt = 0; salt < 10; salt++) {
    // 满足 `!ID_AVOID_SUBSTRINGS.some(bad => candidate.includes(bad))` 时，MCP 服务执行该分支。
    if (!ID_AVOID_SUBSTRINGS.some(bad => candidate.includes(bad))) {
      // 返回 `candidate`，作为MCP 服务这次计算的结果。
      return candidate
    }
    // candidate更新为 `hashToId(`${toolUseID}:${salt}`)`，确保MCP 服务后续读取最新状态。
    candidate = hashToId(`${toolUseID}:${salt}`)
  }
  // 返回 `candidate`，作为MCP 服务这次计算的结果。
  return candidate
}

/**
 * Truncate tool input to a phone-sized JSON preview. 200 chars is
 * roughly 3 lines on a narrow phone screen. Full input is in the local
 * terminal dialog; the channel gets a summary so Write(5KB-file) doesn't
 * flood your texts. Server decides whether/how to show it.
 */
// truncateForPreview 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateForPreview(input: unknown): string {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // s 集合保存`jsonStringify`，供MCP 服务后续处理使用。
    const s = jsonStringify(input)
    // 返回 `s.length > 200 ? s.slice(0, 200) + '…' : s`，作为MCP 服务这次计算的结果。
    return s.length > 200 ? s.slice(0, 200) + '…' : s
  } catch {
    // 返回 `'(unserializable)'`，作为MCP 服务这次计算的结果。
    return '(unserializable)'
  }
}

/**
 * Filter MCP clients down to those that can relay permission prompts.
 * Three conditions, ALL required: connected + in the session's --channels
 * allowlist + declares BOTH capabilities. The second capability is the
 * server's explicit opt-in — a relay-only channel never becomes a
 * permission surface by accident (Kenneth's "users may be unpleasantly
 * surprised"). Centralized here so a future fourth condition lands once.
 */
// filterPermissionRelayClients 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterPermissionRelayClients<
  T extends {
    type: string
    name: string
    capabilities?: { experimental?: Record<string, unknown> }
  },
>(
  clients: readonly T[],
  // 这个回调绑定到 isInAllowlist: (name: string) => boolean,，负责MCP 服务在该局部场景下的响应。
  isInAllowlist: (name: string) => boolean,
): (T & { type: 'connected' })[] {
  // 返回 `clients.filter(`，作为MCP 服务这次计算的结果。
  return clients.filter(
    (c): c is T & { type: 'connected' } =>
      c.type === 'connected' &&
      isInAllowlist(c.name) &&
      c.capabilities?.experimental?.['claude/channel'] !== undefined &&
      c.capabilities?.experimental?.['claude/channel/permission'] !== undefined,
  )
}

/**
 * Factory for the callbacks object. The pending Map is closed over — NOT
 * module-level (per src/CLAUDE.md), NOT in AppState (functions-in-state
 * causes issues with equality/serialization). Same lifetime pattern as
 * `replBridgePermissionCallbacks`: constructed once per session inside
 * a React hook, stable reference stored in AppState.
 *
 * resolve() is called from the dedicated notification handler
 * (notifications/claude/channel/permission) with the structured payload.
 * The server already parsed "yes tbxkq" → {request_id, behavior}; we just
 * match against the pending map. No regex on CC's side — text in the
 * general channel can't accidentally approve anything.
 */
// createChannelPermissionCallbacks 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createChannelPermissionCallbacks(): ChannelPermissionCallbacks {
  // pending构建`new Map<`，供后续判断或组装使用。
  const pending = new Map<
    string,
    (response: ChannelPermissionResponse) => void
  >()

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    // onResponse 使用 requestId, handler 完成MCP 服务里的对应操作。
    onResponse(requestId, handler) {
      // Lowercase here too — resolve() already does; asymmetry means a
      // future caller passing a mixed-case ID would silently never match.
      // shortRequestId always emits lowercase so this is a noop today,
      // but the symmetry makes the contract explicit.
      // 按键保存`requestId.toLowerCase`，供MCP 服务后续处理使用。
      const key = requestId.toLowerCase()
      // pending.set 写入新的状态值，使MCP 服务后续读取保持一致。
      pending.set(key, handler)
      // 返回 `() => {`，作为MCP 服务这次计算的结果。
      return () => {
        // 调用 pending.delete，触发MCP 服务此处需要的副作用。
        pending.delete(key)
      }
    },

    // resolve 使用 requestId, behavior, fromServer 完成MCP 服务里的对应操作。
    resolve(requestId, behavior, fromServer) {
      // 按键保存`requestId.toLowerCase`，供MCP 服务后续处理使用。
      const key = requestId.toLowerCase()
      // resolver读取`pending.get`，供MCP 服务后续处理使用。
      const resolver = pending.get(key)
      // resolver缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!resolver) return false
      // Delete BEFORE calling — if resolver throws or re-enters, the
      // entry is already gone. Also handles duplicate events (second
      // emission falls through — server bug or network dup, ignore).
      // 调用 pending.delete，触发MCP 服务此处需要的副作用。
      pending.delete(key)
      // resolver 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolver({ behavior, fromServer })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },
  }
}
