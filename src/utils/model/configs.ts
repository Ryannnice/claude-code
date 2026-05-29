// 类型依赖 { ModelName } 来自 ./model.js，用于校准共享工具的数据契约。
import type { ModelName } from './model.js'
// 类型依赖 { APIProvider } 来自 ./providers.js，用于校准共享工具的数据契约。
import type { APIProvider } from './providers.js'

// ModelConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelConfig = Record<APIProvider, ModelName>

// @[MODEL LAUNCH]: Add a new CLAUDE_*_CONFIG constant here. Double check the correct model strings
// here since the pattern may change.

// CLAUDE_3_7_SONNET_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_3_7_SONNET_CONFIG = {
  firstParty: 'claude-3-7-sonnet-20250219',
  bedrock: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  vertex: 'claude-3-7-sonnet@20250219',
  foundry: 'claude-3-7-sonnet',
} as const satisfies ModelConfig

// CLAUDE_3_5_V2_SONNET_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_3_5_V2_SONNET_CONFIG = {
  firstParty: 'claude-3-5-sonnet-20241022',
  bedrock: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  vertex: 'claude-3-5-sonnet-v2@20241022',
  foundry: 'claude-3-5-sonnet',
} as const satisfies ModelConfig

// CLAUDE_3_5_HAIKU_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_3_5_HAIKU_CONFIG = {
  firstParty: 'claude-3-5-haiku-20241022',
  bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  vertex: 'claude-3-5-haiku@20241022',
  foundry: 'claude-3-5-haiku',
} as const satisfies ModelConfig

// CLAUDE_HAIKU_4_5_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_HAIKU_4_5_CONFIG = {
  firstParty: 'claude-haiku-4-5-20251001',
  bedrock: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  vertex: 'claude-haiku-4-5@20251001',
  foundry: 'claude-haiku-4-5',
} as const satisfies ModelConfig

// CLAUDE_SONNET_4_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_SONNET_4_CONFIG = {
  firstParty: 'claude-sonnet-4-20250514',
  bedrock: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  vertex: 'claude-sonnet-4@20250514',
  foundry: 'claude-sonnet-4',
} as const satisfies ModelConfig

// CLAUDE_SONNET_4_5_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_SONNET_4_5_CONFIG = {
  firstParty: 'claude-sonnet-4-5-20250929',
  bedrock: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  vertex: 'claude-sonnet-4-5@20250929',
  foundry: 'claude-sonnet-4-5',
} as const satisfies ModelConfig

// CLAUDE_OPUS_4_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_OPUS_4_CONFIG = {
  firstParty: 'claude-opus-4-20250514',
  bedrock: 'us.anthropic.claude-opus-4-20250514-v1:0',
  vertex: 'claude-opus-4@20250514',
  foundry: 'claude-opus-4',
} as const satisfies ModelConfig

// CLAUDE_OPUS_4_1_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_OPUS_4_1_CONFIG = {
  firstParty: 'claude-opus-4-1-20250805',
  bedrock: 'us.anthropic.claude-opus-4-1-20250805-v1:0',
  vertex: 'claude-opus-4-1@20250805',
  foundry: 'claude-opus-4-1',
} as const satisfies ModelConfig

// CLAUDE_OPUS_4_5_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_OPUS_4_5_CONFIG = {
  firstParty: 'claude-opus-4-5-20251101',
  bedrock: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
  vertex: 'claude-opus-4-5@20251101',
  foundry: 'claude-opus-4-5',
} as const satisfies ModelConfig

// CLAUDE_OPUS_4_6_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_OPUS_4_6_CONFIG = {
  firstParty: 'claude-opus-4-6',
  bedrock: 'us.anthropic.claude-opus-4-6-v1',
  vertex: 'claude-opus-4-6',
  foundry: 'claude-opus-4-6',
} as const satisfies ModelConfig

// CLAUDE_SONNET_4_6_CONFIG 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const CLAUDE_SONNET_4_6_CONFIG = {
  firstParty: 'claude-sonnet-4-6',
  bedrock: 'us.anthropic.claude-sonnet-4-6',
  vertex: 'claude-sonnet-4-6',
  foundry: 'claude-sonnet-4-6',
} as const satisfies ModelConfig

// @[MODEL LAUNCH]: Register the new config here.
// ALL_MODEL_CONFIGS 配置 集中保存共享工具模型工具 configs要一起传递的字段。
export const ALL_MODEL_CONFIGS = {
  haiku35: CLAUDE_3_5_HAIKU_CONFIG,
  haiku45: CLAUDE_HAIKU_4_5_CONFIG,
  sonnet35: CLAUDE_3_5_V2_SONNET_CONFIG,
  sonnet37: CLAUDE_3_7_SONNET_CONFIG,
  sonnet40: CLAUDE_SONNET_4_CONFIG,
  sonnet45: CLAUDE_SONNET_4_5_CONFIG,
  sonnet46: CLAUDE_SONNET_4_6_CONFIG,
  opus40: CLAUDE_OPUS_4_CONFIG,
  opus41: CLAUDE_OPUS_4_1_CONFIG,
  opus45: CLAUDE_OPUS_4_5_CONFIG,
  opus46: CLAUDE_OPUS_4_6_CONFIG,
} as const satisfies Record<string, ModelConfig>

// ModelKey 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelKey = keyof typeof ALL_MODEL_CONFIGS

/** Union of all canonical first-party model IDs, e.g. 'claude-opus-4-6' | 'claude-sonnet-4-5-20250929' | … */
// CanonicalModelId 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CanonicalModelId =
  (typeof ALL_MODEL_CONFIGS)[ModelKey]['firstParty']

/** Runtime list of canonical model IDs — used by comprehensiveness tests. */
// CANONICAL_MODEL_IDS 集合派生`Object.values`，供共享工具后续处理使用。
export const CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS).map(
  // c更新为 `> c.firstParty`，确保模型工具后续读取最新状态。
  c => c.firstParty,
) as [CanonicalModelId, ...CanonicalModelId[]]

/** Map canonical ID → internal short key. Used to apply settings-based modelOverrides. */
// CANONICAL_ID_TO_KEY 先占位，稍后的条件分支会根据实际输入补齐它。
export const CANONICAL_ID_TO_KEY: Record<CanonicalModelId, ModelKey> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      // 这个回调绑定到 ([key, cfg]) => [cfg.firstParty, key],，负责共享工具在该局部场景下的响应。
      ([key, cfg]) => [cfg.firstParty, key],
    ),
  ) as Record<CanonicalModelId, ModelKey>
