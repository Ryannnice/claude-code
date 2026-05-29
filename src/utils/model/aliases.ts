// MODEL_ALIASES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const MODEL_ALIASES = [
  'sonnet',
  'opus',
  'haiku',
  'best',
  'sonnet[1m]',
  'opus[1m]',
  'opusplan',
] as const
// ModelAlias 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelAlias = (typeof MODEL_ALIASES)[number]

// isModelAlias 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isModelAlias(modelInput: string): modelInput is ModelAlias {
  // 返回 `MODEL_ALIASES.includes(modelInput as ModelAlias)`，作为共享工具这次计算的结果。
  return MODEL_ALIASES.includes(modelInput as ModelAlias)
}

/**
 * Bare model family aliases that act as wildcards in the availableModels allowlist.
 * When "opus" is in the allowlist, ANY opus model is allowed (opus 4.5, 4.6, etc.).
 * When a specific model ID is in the allowlist, only that exact version is allowed.
 */
// MODEL_FAMILY_ALIASES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const MODEL_FAMILY_ALIASES = ['sonnet', 'opus', 'haiku'] as const

// isModelFamilyAlias 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isModelFamilyAlias(model: string): boolean {
  // 返回 `(MODEL_FAMILY_ALIASES as readonly string[]).includes(model)`，作为共享工具这次计算的结果。
  return (MODEL_FAMILY_ALIASES as readonly string[]).includes(model)
}
