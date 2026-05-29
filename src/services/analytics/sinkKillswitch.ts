// 引入 getDynamicConfig_CACHED_MAY_BE_STALE，将 ./growthbook.js 中已经封装好的能力接到本文件流程里。
import { getDynamicConfig_CACHED_MAY_BE_STALE } from './growthbook.js'

// Mangled name: per-sink analytics killswitch
// SINK_KILLSWITCH_CONFIG_NAME 配置固定为 `'tengu_frond_boric'`，作为服务层 sink Killswitch后续展示或比较的基准。
const SINK_KILLSWITCH_CONFIG_NAME = 'tengu_frond_boric'

// SinkName 固化服务层 sink Killswitch里传递的数据形状，帮助调用方按同一结构读写字段。
export type SinkName = 'datadog' | 'firstParty'

/**
 * GrowthBook JSON config that disables individual analytics sinks.
 * Shape: { datadog?: boolean, firstParty?: boolean }
 * A value of true for a key stops all dispatch to that sink.
 * Default {} (nothing killed). Fail-open: missing/malformed config = sink stays on.
 *
 * NOTE: Must NOT be called from inside is1PEventLoggingEnabled() -
 * growthbook.ts:isGrowthBookEnabled() calls that, so a lookup here would recurse.
 * Call at per-event dispatch sites instead.
 */
// isSinkKilled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSinkKilled(sink: SinkName): boolean {
  // 配置读取`getDynamicConfig_CACHED_MAY_BE_STALE<` 整理出中间结果，供服务层 sink Killswitch后续步骤使用。
  const config = getDynamicConfig_CACHED_MAY_BE_STALE<
    Partial<Record<SinkName, boolean>>
  >(SINK_KILLSWITCH_CONFIG_NAME, {})
  // getFeatureValue_CACHED_MAY_BE_STALE guards on `!== undefined`, so a
  // cached JSON null leaks through instead of falling back to {}.
  // 返回 `config?.[sink] === true`，作为服务层 sink Killswitch这次计算的结果。
  return config?.[sink] === true
}
