/**
 * Read tool output limits.  Two caps apply to text reads:
 *
 *   | limit         | default | checks                    | cost          | on overflow     |
 *   |---------------|---------|---------------------------|---------------|-----------------|
 *   | maxSizeBytes  | 256 KB  | TOTAL FILE SIZE (not out) | 1 stat        | throws pre-read |
 *   | maxTokens     | 25000   | actual output tokens      | API roundtrip | throws post-read|
 *
 * Known mismatch: maxSizeBytes gates on total file size, not the slice.
 * Tested truncating instead of throwing for explicit-limit reads that
 * exceed the byte cap (#21841, Mar 2026).  Reverted: tool error rate
 * dropped but mean tokens rose — the throw path yields a ~100-byte error
 * tool-result while truncation yields ~25K tokens of content at the cap.
 */
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 复用 MAX_OUTPUT_SIZE 工具函数，把通用处理留在 src/utils/file.js 中维护。
import { MAX_OUTPUT_SIZE } from 'src/utils/file.js'
// DEFAULT_MAX_OUTPUT_TOKENS 集合保存`25000`，供工具实现 limits后续判断或输出使用。
export const DEFAULT_MAX_OUTPUT_TOKENS = 25000

/**
 * Env var override for max output tokens. Returns undefined when unset/invalid
 * so the caller can fall through to the next precedence tier.
 */
// getEnvMaxTokens 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEnvMaxTokens(): number | undefined {
  // override 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const override = process.env.CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS
  // 满足 `override` 时，工具调用执行该分支。
  if (override) {
    // 解析结果解析`parseInt`，供工具调用后续处理使用。
    const parsed = parseInt(override, 10)
    // 只有 `!isNaN(parsed) && parsed > 0` 满足时，工具调用才执行该分支。
    if (!isNaN(parsed) && parsed > 0) {
      // 返回 `parsed`，作为工具调用这次计算的结果。
      return parsed
    }
  }
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

// FileReadingLimits 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileReadingLimits = {
  maxTokens: number
  maxSizeBytes: number
  includeMaxSizeInPrompt?: boolean
  targetedRangeNudge?: boolean
}

/**
 * Default limits for Read tool when the ToolUseContext doesn't supply an
 * override. Memoized so the GrowthBook value is fixed at first call — avoids
 * the cap changing mid-session as the flag refreshes in the background.
 *
 * Precedence for maxTokens: env var > GrowthBook > DEFAULT_MAX_OUTPUT_TOKENS.
 * (Env var is a user-set override, should beat experiment infrastructure.)
 *
 * Defensive: each field is individually validated; invalid values fall
 * through to the hardcoded defaults (no route to cap=0).
 */
// getDefaultFileReadingLimits 文件数据保存`memoize`，供工具调用后续处理使用。
export const getDefaultFileReadingLimits = memoize((): FileReadingLimits => {
  // override 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const override =
    getFeatureValue_CACHED_MAY_BE_STALE<Partial<FileReadingLimits> | null>(
      'tengu_amber_wren',
      {},
    )

  // maxSizeBytes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const maxSizeBytes =
    typeof override?.maxSizeBytes === 'number' &&
    Number.isFinite(override.maxSizeBytes) &&
    override.maxSizeBytes > 0
      ? override.maxSizeBytes
      : MAX_OUTPUT_SIZE

  // envMaxTokens 集合读取`getEnvMaxTokens`，供工具调用后续处理使用。
  const envMaxTokens = getEnvMaxTokens()
  // maxTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const maxTokens =
    envMaxTokens ??
    (typeof override?.maxTokens === 'number' &&
    Number.isFinite(override.maxTokens) &&
    override.maxTokens > 0
      ? override.maxTokens
      : DEFAULT_MAX_OUTPUT_TOKENS)

  // includeMaxSizeInPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const includeMaxSizeInPrompt =
    typeof override?.includeMaxSizeInPrompt === 'boolean'
      ? override.includeMaxSizeInPrompt
      : undefined

  // targetedRangeNudge 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const targetedRangeNudge =
    typeof override?.targetedRangeNudge === 'boolean'
      ? override.targetedRangeNudge
      : undefined

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    maxSizeBytes,
    maxTokens,
    includeMaxSizeInPrompt,
    targetedRangeNudge,
  }
})
