/**
 * Approved channel plugins allowlist. --channels plugin:name@marketplace
 * entries only register if {marketplace, plugin} is on this list. server:
 * entries always fail (schema is plugin-only). The
 * --dangerously-load-development-channels flag bypasses for both kinds.
 * Lives in GrowthBook so it can be updated without a release.
 *
 * Plugin-level granularity: if a plugin is approved, all its channel
 * servers are. Per-server gating was overengineering — a plugin that
 * sprouts a malicious second server is already compromised, and per-server
 * entries would break on harmless plugin refactors.
 *
 * The allowlist check is a pure {marketplace, plugin} comparison against
 * the user's typed tag. The gate's separate 'marketplace' step verifies
 * the tag matches what's actually installed before this check runs.
 */

// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 parsePluginIdentifier 工具函数，把通用处理留在 ../../utils/plugins/pluginIdentifier.js 中维护。
import { parsePluginIdentifier } from '../../utils/plugins/pluginIdentifier.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'

// ChannelAllowlistEntry 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelAllowlistEntry = {
  marketplace: string
  plugin: string
}

// ChannelAllowlistSchema 集合保存`lazySchema`，供MCP 服务后续处理使用。
const ChannelAllowlistSchema = lazySchema(() =>
  z.array(
    z.object({
      marketplace: z.string(),
      plugin: z.string(),
    }),
  ),
)

// getChannelAllowlist 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChannelAllowlist(): ChannelAllowlistEntry[] {
  // 原始文本读取`getFeatureValue_CACHED_MAY_BE_STALE<unknown>(`，供后续判断或组装使用。
  const raw = getFeatureValue_CACHED_MAY_BE_STALE<unknown>(
    'tengu_harbor_ledger',
    [],
  )
  // 解析结果保存`ChannelAllowlistSchema`，供MCP 服务后续处理使用。
  const parsed = ChannelAllowlistSchema().safeParse(raw)
  // 返回 `parsed.success ? parsed.data : []`，作为MCP 服务这次计算的结果。
  return parsed.success ? parsed.data : []
}

/**
 * Overall channels on/off. Checked before any per-server gating —
 * when false, --channels is a no-op and no handlers register.
 * Default false; GrowthBook 5-min refresh.
 */
// isChannelsEnabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isChannelsEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_harbor', false)`，作为MCP 服务这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_harbor', false)
}

/**
 * Pure allowlist check keyed off the connection's pluginSource — for UI
 * pre-filtering so the IDE only shows "Enable channel?" for servers that will
 * actually pass the gate. Not a security boundary: channel_enable still runs
 * the full gate. Matches the allowlist comparison inside gateChannelServer()
 * but standalone (no session/marketplace coupling — those are tautologies
 * when the entry is derived from pluginSource).
 *
 * Returns false for undefined pluginSource (non-plugin server — can never
 * match the {marketplace, plugin}-keyed ledger) and for @-less sources
 * (builtin/inline — same reason).
 */
// isChannelAllowlisted 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isChannelAllowlisted(
  pluginSource: string | undefined,
): boolean {
  // pluginSource 插件数据缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!pluginSource) return false
  // 从 `parsePluginIdentifier(pluginSource)` 解构 name、marketplace，减少MCP 服务 channel Allowlist对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(pluginSource)
  // marketplace 市场数据缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!marketplace) return false
  // 返回 `getChannelAllowlist().some(`，作为MCP 服务这次计算的结果。
  return getChannelAllowlist().some(
    // e更新为 `> e.plugin === name && e.marketplace === marketplace`，确保MCP 服务后续读取最新状态。
    e => e.plugin === name && e.marketplace === marketplace,
  )
}
