/**
 * Channel notifications — lets an MCP server push user messages into the
 * conversation. A "channel" (Discord, Slack, SMS, etc.) is just an MCP server
 * that:
 *   - exposes tools for outbound messages (e.g. `send_message`) — standard MCP
 *   - sends `notifications/claude/channel` notifications for inbound — this file
 *
 * The notification handler wraps the content in a <channel> tag and
 * enqueues it. SleepTool polls hasCommandsInQueue() and wakes within 1s.
 * The model sees where the message came from and decides which tool to reply
 * with (the channel's MCP tool, SendUserMessage, or both).
 *
 * feature('KAIROS') || feature('KAIROS_CHANNELS'). Runtime gate tengu_harbor.
 * Requires claude.ai OAuth auth — API key users are blocked until
 * console gets a channelsEnabled admin surface. Teams/Enterprise orgs
 * must explicitly opt in via channelsEnabled: true in managed settings.
 */

// 类型依赖 { ServerCapabilities } 来自 @modelcontextprotocol/sdk/types.js，用于校准MCP 服务的数据契约。
import type { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 ChannelEntry、getAllowedChannels，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { type ChannelEntry, getAllowedChannels } from '../../bootstrap/state.js'
// 引入 CHANNEL_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { CHANNEL_TAG } from '../../constants/xml.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getClaudeAIOAuthTokens,
  getSubscriptionType,
} from '../../utils/auth.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 parsePluginIdentifier 工具函数，把通用处理留在 ../../utils/plugins/pluginIdentifier.js 中维护。
import { parsePluginIdentifier } from '../../utils/plugins/pluginIdentifier.js'
// 复用 getSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettingsForSource } from '../../utils/settings/settings.js'
// 复用 escapeXmlAttr 工具函数，把通用处理留在 ../../utils/xml.js 中维护。
import { escapeXmlAttr } from '../../utils/xml.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type ChannelAllowlistEntry,
  getChannelAllowlist,
  isChannelsEnabled,
} from './channelAllowlist.js'

// ChannelMessageNotificationSchema 消息数据保存`lazySchema`，供MCP 服务后续处理使用。
export const ChannelMessageNotificationSchema = lazySchema(() =>
  z.object({
    method: z.literal('notifications/claude/channel'),
    params: z.object({
      content: z.string(),
      // Opaque passthrough — thread_id, user, whatever the channel wants the
      // model to see. Rendered as attributes on the <channel> tag.
      meta: z.record(z.string(), z.string()).optional(),
    }),
  }),
)

/**
 * Structured permission reply from a channel server. Servers that support
 * this declare `capabilities.experimental['claude/channel/permission']` and
 * emit this event INSTEAD of relaying "yes tbxkq" as text via
 * notifications/claude/channel. Explicit opt-in per server — a channel that
 * just wants to relay text never becomes a permission surface by accident.
 *
 * The server parses the user's reply (spec: /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i)
 * and emits {request_id, behavior}. CC matches request_id against its
 * pending map. Unlike the regex-intercept approach, text in the general
 * channel can never accidentally match — approval requires the server
 * to deliberately emit this specific event.
 */
// CHANNEL_PERMISSION_METHOD 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const CHANNEL_PERMISSION_METHOD =
  'notifications/claude/channel/permission'
// ChannelPermissionNotificationSchema 权限数据保存`lazySchema`，供MCP 服务后续处理使用。
export const ChannelPermissionNotificationSchema = lazySchema(() =>
  z.object({
    method: z.literal(CHANNEL_PERMISSION_METHOD),
    params: z.object({
      request_id: z.string(),
      behavior: z.enum(['allow', 'deny']),
    }),
  }),
)

/**
 * Outbound: CC → server. Fired from interactiveHandler.ts when a
 * permission dialog opens and the server has declared the permission
 * capability. Server formats the message for its platform (Telegram
 * markdown, iMessage rich text, Discord embed) and sends it to the
 * human. When the human replies "yes tbxkq", the server parses that
 * against PERMISSION_REPLY_RE and emits the inbound schema above.
 *
 * Not a zod schema — CC SENDS this, doesn't validate it. A type here
 * keeps both halves of the protocol documented side by side.
 */
// CHANNEL_PERMISSION_REQUEST_METHOD 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const CHANNEL_PERMISSION_REQUEST_METHOD =
  'notifications/claude/channel/permission_request'
// ChannelPermissionRequestParams 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelPermissionRequestParams = {
  request_id: string
  tool_name: string
  description: string
  /** JSON-stringified tool input, truncated to 200 chars with …. Full
   *  input is in the local terminal dialog; this is a phone-sized
   *  preview. Server decides whether/how to show it. */
  input_preview: string
}

/**
 * Meta keys become XML attribute NAMES — a crafted key like
 * `x="" injected="y` would break out of the attribute structure. Only
 * accept keys that look like plain identifiers. This is stricter than
 * the XML spec (which allows `:`, `.`, `-`) but channel servers only
 * send `chat_id`, `user`, `thread_ts`, `message_id` in practice.
 */
// SAFE_META_KEY读取 `/^[a-zA-Z_][a-zA-Z0-9_]*$/` 对应条目，后续围绕该成员继续处理。
const SAFE_META_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/

// wrapChannelMessage 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapChannelMessage(
  serverName: string,
  content: string,
  meta?: Record<string, string>,
): string {
  // attrs 集合派生`Object.entries`，供MCP 服务后续处理使用。
  const attrs = Object.entries(meta ?? {})
    // 链式调用 filter，继续加工上一行在MCP 服务中产生的数据。
    .filter(([k]) => SAFE_META_KEY.test(k))
    // 链式调用 map，继续加工上一行在MCP 服务中产生的数据。
    .map(([k, v]) => ` ${k}="${escapeXmlAttr(v)}"`)
    .join('')
  // 返回 ``<${CHANNEL_TAG} source="${escapeXmlAttr(serverName)}"${attrs}>\n${cont...`，作为MCP 服务这次计算的结果。
  return `<${CHANNEL_TAG} source="${escapeXmlAttr(serverName)}"${attrs}>\n${content}\n</${CHANNEL_TAG}>`
}

/**
 * Effective allowlist for the current session. Team/enterprise orgs can set
 * allowedChannelPlugins in managed settings — when set, it REPLACES the
 * GrowthBook ledger (admin owns the trust decision). Undefined falls back
 * to the ledger. Unmanaged users always get the ledger.
 *
 * Callers already read sub/policy for the policy gate — pass them in to
 * avoid double-reading getSettingsForSource (uncached).
 */
// getEffectiveChannelAllowlist 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEffectiveChannelAllowlist(
  sub: ReturnType<typeof getSubscriptionType>,
  orgList: ChannelAllowlistEntry[] | undefined,
): {
  entries: ChannelAllowlistEntry[]
  source: 'org' | 'ledger'
} {
  // 组合条件 `(sub === 'team' || sub === 'enterprise') && orgList` 成立时，MCP 服务才启用这条专门路径。
  if ((sub === 'team' || sub === 'enterprise') && orgList) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { entries: orgList, source: 'org' }
  }
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { entries: getChannelAllowlist(), source: 'ledger' }
}

// ChannelGateResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelGateResult =
  | { action: 'register' }
  | {
      action: 'skip'
      kind:
        | 'capability'
        | 'disabled'
        | 'auth'
        | 'policy'
        | 'session'
        | 'marketplace'
        | 'allowlist'
      reason: string
    }

/**
 * Match a connected MCP server against the user's parsed --channels entries.
 * server-kind is exact match on bare name; plugin-kind matches on the second
 * segment of plugin:X:Y. Returns the matching entry so callers can read its
 * kind — that's the user's trust declaration, not inferred from runtime shape.
 */
// findChannelEntry 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findChannelEntry(
  serverName: string,
  channels: readonly ChannelEntry[],
): ChannelEntry | undefined {
  // split unconditionally — for a bare name like 'slack', parts is ['slack']
  // and the plugin-kind branch correctly never matches (parts[0] !== 'plugin').
  // 片段列表格式化`serverName.split`，供MCP 服务后续处理使用。
  const parts = serverName.split(':')
  // 返回 `channels.find(c =>`，作为MCP 服务这次计算的结果。
  return channels.find(c =>
    c.kind === 'server'
      ? serverName === c.name
      : parts[0] === 'plugin' && parts[1] === c.name,
  )
}

/**
 * Gate an MCP server's channel-notification path. Caller checks
 * feature('KAIROS') || feature('KAIROS_CHANNELS') first (build-time
 * elimination). Gate order: capability → runtime gate (tengu_harbor) →
 * auth (OAuth only) → org policy → session --channels → allowlist.
 * API key users are blocked at the auth layer — channels requires
 * claude.ai auth; console orgs have no admin opt-in surface yet.
 *
 *   skip      Not a channel server, or managed org hasn't opted in, or
 *             not in session --channels. Connection stays up; handler
 *             not registered.
 *   register  Subscribe to notifications/claude/channel.
 *
 * Which servers can connect at all is governed by allowedMcpServers —
 * this gate only decides whether the notification handler registers.
 */
// gateChannelServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function gateChannelServer(
  serverName: string,
  capabilities: ServerCapabilities | undefined,
  pluginSource: string | undefined,
): ChannelGateResult {
  // Channel servers declare `experimental['claude/channel']: {}` (MCP's
  // presence-signal idiom — same as `tools: {}`). Truthy covers `{}` and
  // `true`; absent/undefined/explicit-`false` all fail. Key matches the
  // notification method namespace (notifications/claude/channel).
  // 满足 `!capabilities?.experimental?.['claude/channel']` 时，MCP 服务执行该分支。
  if (!capabilities?.experimental?.['claude/channel']) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      action: 'skip',
      kind: 'capability',
      reason: 'server did not declare claude/channel capability',
    }
  }

  // Overall runtime gate. After capability so normal MCP servers never hit
  // this path. Before auth/policy so the killswitch works regardless of
  // session state.
  // 满足 `!isChannelsEnabled()` 时，MCP 服务执行该分支。
  if (!isChannelsEnabled()) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      action: 'skip',
      kind: 'disabled',
      reason: 'channels feature is not currently available',
    }
  }

  // OAuth-only. API key users (console) are blocked — there's no
  // channelsEnabled admin surface in console yet, so the policy opt-in
  // flow doesn't exist for them. Drop this when console parity lands.
  // 满足 `!getClaudeAIOAuthTokens()?.accessToken` 时，MCP 服务执行该分支。
  if (!getClaudeAIOAuthTokens()?.accessToken) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      action: 'skip',
      kind: 'auth',
      reason: 'channels requires claude.ai authentication (run /login)',
    }
  }

  // Teams/Enterprise opt-in. Managed orgs must explicitly enable channels.
  // Default OFF — absent or false blocks. Keyed off subscription tier, not
  // "policy settings exist" — a team org with zero configured policy keys
  // (remote endpoint returns 404) is still a managed org and must not fall
  // through to the unmanaged path.
  // sub读取`getSubscriptionType`，供MCP 服务后续处理使用。
  const sub = getSubscriptionType()
  // managed标记MCP 服务MCP 服务 channel Notification是否启用对应路径。
  const managed = sub === 'team' || sub === 'enterprise'
  // policy读取`getSettingsForSource`，供MCP 服务后续处理使用。
  const policy = managed ? getSettingsForSource('policySettings') : undefined
  // `managed && policy?.channelsEnabled` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
  if (managed && policy?.channelsEnabled !== true) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      action: 'skip',
      kind: 'policy',
      reason:
        'channels not enabled by org policy (set channelsEnabled: true in managed settings)',
    }
  }

  // User-level session opt-in. A server must be explicitly listed in
  // --channels to push inbound this session — protects against a trusted
  // server surprise-adding the capability.
  // entry筛选`findChannelEntry`，供MCP 服务后续处理使用。
  const entry = findChannelEntry(serverName, getAllowedChannels())
  // entry缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!entry) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      action: 'skip',
      kind: 'session',
      reason: `server ${serverName} not in --channels list for this session`,
    }
  }

  // 当 `entry.kind` 匹配 `'plugin'` 时，MCP 服务执行对应分支。
  if (entry.kind === 'plugin') {
    // Marketplace verification: the tag is intent (plugin:slack@anthropic),
    // the runtime name is just plugin:slack:X — could be slack@anthropic or
    // slack@evil depending on what's installed. Verify they match before
    // trusting the tag for the allowlist check below. Source is stashed on
    // the config at addPluginScopeToServers — undefined (non-plugin server,
    // shouldn't happen for plugin-kind entry) or @-less (builtin/inline)
    // both fail the comparison.
    // actual 命名 `pluginSource`，让后续代码直接表达这个值的用途。
    const actual = pluginSource
      ? parsePluginIdentifier(pluginSource).marketplace
      : undefined
    // `actual` 与 `entry.marketplace` 不一致时刷新派生状态，避免使用过期结果。
    if (actual !== entry.marketplace) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        action: 'skip',
        kind: 'marketplace',
        reason: `you asked for plugin:${entry.name}@${entry.marketplace} but the installed ${entry.name} plugin is from ${actual ?? 'an unknown source'}`,
      }
    }

    // Approved-plugin allowlist. Marketplace gate already verified
    // tag == reality, so this is a pure entry check. entry.dev (per-entry,
    // not the session-wide bit) bypasses — so accepting the dev dialog for
    // one entry doesn't leak allowlist-bypass to --channels entries.
    // entry.dev缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!entry.dev) {
      // 从 `getEffectiveChannelAllowlist(` 解构 entries、source，减少MCP 服务 channel Notification对同一对象的重复访问。
      const { entries, source } = getEffectiveChannelAllowlist(
        sub,
        policy?.allowedChannelPlugins,
      )
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        !entries.some(
          // e更新为 `> e.plugin === entry.name && e.marketplace === entry.mark...`，确保MCP 服务后续读取最新状态。
          e => e.plugin === entry.name && e.marketplace === entry.marketplace,
        )
      ) {
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          action: 'skip',
          kind: 'allowlist',
          reason:
            source === 'org'
              ? `plugin ${entry.name}@${entry.marketplace} is not on your org's approved channels list (set allowedChannelPlugins in managed settings)`
              : `plugin ${entry.name}@${entry.marketplace} is not on the approved channels allowlist (use --dangerously-load-development-channels for local dev)`,
        }
      }
    }
  } else {
    // server-kind: allowlist schema is {marketplace, plugin} — a server entry
    // can never match. Without this, --channels server:plugin:foo:bar would
    // match a plugin's runtime name and register with no allowlist check.
    // entry.dev缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!entry.dev) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        action: 'skip',
        kind: 'allowlist',
        reason: `server ${entry.name} is not on the approved channels allowlist (use --dangerously-load-development-channels for local dev)`,
      }
    }
  }

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { action: 'register' }
}
