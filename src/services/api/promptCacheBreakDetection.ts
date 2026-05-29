// 类型依赖 { BetaToolUnion } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准API 服务 prompt Cache Break Detection的数据契约。
import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准API 服务 prompt Cache Break Detection的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 createPatch，将 diff 中已经封装好的能力接到本文件流程里。
import { createPatch } from 'diff'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { AgentId } 来自 src/types/ids.js，用于校准API 服务 prompt Cache Break Detection的数据契约。
import type { AgentId } from 'src/types/ids.js'
// 类型依赖 { Message } 来自 src/types/message.js，用于校准API 服务 prompt Cache Break Detection的数据契约。
import type { Message } from 'src/types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 djb2Hash 工具函数，把通用处理留在 src/utils/hash.js 中维护。
import { djb2Hash } from 'src/utils/hash.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 复用 getClaudeTempDir 工具函数，把通用处理留在 src/utils/permissions/filesystem.js 中维护。
import { getClaudeTempDir } from 'src/utils/permissions/filesystem.js'
// 复用 jsonStringify 工具函数，把通用处理留在 src/utils/slowOperations.js 中维护。
import { jsonStringify } from 'src/utils/slowOperations.js'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准API 服务 prompt Cache Break Detection的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 整理这一组导入，让API 服务 prompt Cache Break Detection后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'

// getCacheBreakDiffPath 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCacheBreakDiffPath(): string {
  // chars 集合保存`'abcdefghijklmnopqrstuvwxyz0123456789'`，作为后续固定文本处理的输入。
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  // suffix固定为 `''`，作为API 服务 prompt Cache Break Detection后续展示或比较的基准。
  let suffix = ''
  // 按索引扫描 `4`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 4; i++) {
    // API 服务 prompt Cache Break Detection在这里处理 `suffix += chars[Math.floor(Math.random() * chars.length)]`，完成这一小步状态转换。
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  // 返回 `join(getClaudeTempDir(), `cache-break-${suffix}.diff`)`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return join(getClaudeTempDir(), `cache-break-${suffix}.diff`)
}

// PreviousState 固化API 服务 prompt Cache Break Detection里传递的数据形状，帮助调用方按同一结构读写字段。
type PreviousState = {
  systemHash: number
  toolsHash: number
  /** Hash of system blocks WITH cache_control intact. Catches scope/TTL flips
   *  (global↔org, 1h↔5m) that stripCacheControl erases from systemHash. */
  cacheControlHash: number
  toolNames: string[]
  /** Per-tool schema hash. Diffed to name which tool's description changed
   *  when toolSchemasChanged but added=removed=0 (77% of tool breaks per
   *  BQ 2026-03-22). AgentTool/SkillTool embed dynamic agent/command lists. */
  perToolHashes: Record<string, number>
  systemCharCount: number
  model: string
  fastMode: boolean
  /** 'tool_based' | 'system_prompt' | 'none' — flips when MCP tools are
   *  discovered/removed. */
  globalCacheStrategy: string
  /** Sorted beta header list. Diffed to show which headers were added/removed. */
  betas: string[]
  /** AFK_MODE_BETA_HEADER presence — should NOT break cache anymore
   *  (sticky-on latched in claude.ts). Tracked to verify the fix. */
  autoModeActive: boolean
  /** Overage state flip — should NOT break cache anymore (eligibility is
   *  latched session-stable in should1hCacheTTL). Tracked to verify the fix. */
  isUsingOverage: boolean
  /** Cache-editing beta header presence — should NOT break cache anymore
   *  (sticky-on latched in claude.ts). Tracked to verify the fix. */
  cachedMCEnabled: boolean
  /** Resolved effort (env → options → model default). Goes into output_config
   *  or anthropic_internal.effort_override. */
  effortValue: string
  /** Hash of getExtraBodyParams() — catches CLAUDE_CODE_EXTRA_BODY and
   *  anthropic_internal changes. */
  extraBodyHash: number
  callCount: number
  pendingChanges: PendingChanges | null
  prevCacheReadTokens: number | null
  /** Set when cached microcompact sends cache_edits deletions. Cache reads
   *  will legitimately drop — this is expected, not a break. */
  cacheDeletionsPending: boolean
  // 这个回调绑定到 buildDiffableContent: () => string，负责API 服务 prompt Cache Break Detection在该局部场景下的响应。
  buildDiffableContent: () => string
}

// PendingChanges 固化API 服务 prompt Cache Break Detection里传递的数据形状，帮助调用方按同一结构读写字段。
type PendingChanges = {
  systemPromptChanged: boolean
  toolSchemasChanged: boolean
  modelChanged: boolean
  fastModeChanged: boolean
  cacheControlChanged: boolean
  globalCacheStrategyChanged: boolean
  betasChanged: boolean
  autoModeChanged: boolean
  overageChanged: boolean
  cachedMCChanged: boolean
  effortChanged: boolean
  extraBodyChanged: boolean
  addedToolCount: number
  removedToolCount: number
  systemCharDelta: number
  addedTools: string[]
  removedTools: string[]
  changedToolSchemas: string[]
  previousModel: string
  newModel: string
  prevGlobalCacheStrategy: string
  newGlobalCacheStrategy: string
  addedBetas: string[]
  removedBetas: string[]
  prevEffortValue: string
  newEffortValue: string
  // 这个回调绑定到 buildPrevDiffableContent: () => string，负责API 服务 prompt Cache Break Detection在该局部场景下的响应。
  buildPrevDiffableContent: () => string
}

// previousStateBySource 状态构建`new Map<string, PreviousState>()` 整理出中间结果，供API 服务 prompt Cache Break Detection后续步骤使用。
const previousStateBySource = new Map<string, PreviousState>()

// Cap the number of tracked sources to prevent unbounded memory growth.
// Each entry stores a ~300KB+ diffableContent string (serialized system prompt
// + tool schemas). Without a cap, spawning many subagents (each with a unique
// agentId key) causes the map to grow indefinitely.
// MAX_TRACKED_SOURCES 集合 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_TRACKED_SOURCES = 10

// TRACKED_SOURCE_PREFIXES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TRACKED_SOURCE_PREFIXES = [
  'repl_main_thread',
  'sdk',
  'agent:custom',
  'agent:default',
  'agent:builtin',
]

// Minimum absolute token drop required to trigger a cache break warning.
// Small drops (e.g., a few thousand tokens) can happen due to normal variation
// and aren't worth alerting on.
// MIN_CACHE_MISS_TOKENS 缓存 命名 `2_000`，让后续代码直接表达这个值的用途。
const MIN_CACHE_MISS_TOKENS = 2_000

// Anthropic's server-side prompt cache TTL thresholds to test.
// Cache breaks after these durations are likely due to TTL expiration
// rather than client-side changes.
// CACHE_TTL_5MIN_MS 缓存保存`5 * 60 * 1000`，供后续判断或组装使用。
const CACHE_TTL_5MIN_MS = 5 * 60 * 1000
// CACHE_TTL_1HOUR_MS 缓存 命名 `60 * 60 * 1000`，让后续代码直接表达这个值的用途。
export const CACHE_TTL_1HOUR_MS = 60 * 60 * 1000

// Models to exclude from cache break detection (e.g., haiku has different caching behavior)
// isExcludedModel 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isExcludedModel(model: string): boolean {
  // 返回 `model.includes('haiku')`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return model.includes('haiku')
}

/**
 * Returns the tracking key for a querySource, or null if untracked.
 * Compact shares the same server-side cache as repl_main_thread
 * (same cacheSafeParams), so they share tracking state.
 *
 * For subagents with a tracked querySource, uses the unique agentId to
 * isolate tracking state. This prevents false positive cache break
 * notifications when multiple instances of the same agent type run
 * concurrently.
 *
 * Untracked sources (speculation, session_memory, prompt_suggestion, etc.)
 * are short-lived forked agents where cache break detection provides no
 * value — they run 1-3 turns with a fresh agentId each time, so there's
 * nothing meaningful to compare against. Their cache metrics are still
 * logged via tengu_api_success for analytics.
 */
// getTrackingKey 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTrackingKey(
  querySource: QuerySource,
  agentId?: AgentId,
): string | null {
  // 当 `querySource` 匹配 `'compact'` 时，API 服务 prompt Cache Break Detection执行对应分支。
  if (querySource === 'compact') return 'repl_main_thread'
  // 逐项读取 `TRACKED_SOURCE_PREFIXES` 中的prefix，按输入顺序推进API 服务 prompt Cache Break Detection...。
  for (const prefix of TRACKED_SOURCE_PREFIXES) {
    // 满足 `querySource.startsWith(prefix)` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (querySource.startsWith(prefix)) return agentId || querySource
  }
  // 返回 `null`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return null
}

// stripCacheControl 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripCacheControl(
  items: ReadonlyArray<Record<string, unknown>>,
): unknown[] {
  // 返回 `items.map(item => {`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return items.map(item => {
    // 满足 `!('cache_control' in item)` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (!('cache_control' in item)) return item
    // 从 `item` 解构 cache_control、其余 rest，减少API 服务 prompt Cache Break Detection对同一对象的重复访问。
    const { cache_control: _, ...rest } = item
    // 返回 `rest`，作为API 服务 prompt Cache Break Detection这次计算的结果。
    return rest
  })
}

// computeHash 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeHash(data: unknown): number {
  // str保存`jsonStringify`，供API 服务 prompt Cache Break Detection后续处理使用。
  const str = jsonStringify(data)
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // hash保存`Bun.hash`，供API 服务 prompt Cache Break Detection后续处理使用。
    const hash = Bun.hash(str)
    // Bun.hash can return bigint for large inputs; convert to number safely
    // 返回 `typeof hash === 'bigint' ? Number(hash & 0xffffffffn) : hash`，作为API 服务 prompt Cache Break Detection这次计算的结果。
    return typeof hash === 'bigint' ? Number(hash & 0xffffffffn) : hash
  }
  // Fallback for non-Bun runtimes (e.g. Node.js via npm global install)
  // 返回 `djb2Hash(str)`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return djb2Hash(str)
}

/** MCP tool names are user-controlled (server config) and may leak filepaths.
 *  Collapse them to 'mcp'; built-in names are a fixed vocabulary. */
// sanitizeToolName 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeToolName(name: string): string {
  // 返回 `name.startsWith('mcp__') ? 'mcp' : name`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return name.startsWith('mcp__') ? 'mcp' : name
}

// computePerToolHashes 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computePerToolHashes(
  strippedTools: ReadonlyArray<unknown>,
  names: string[],
): Record<string, number> {
  // hashes 集合 从空对象开始收集键值，后续按名称补齐内容。
  const hashes: Record<string, number> = {}
  // 按索引扫描 `strippedTools.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < strippedTools.length; i++) {
    // API 服务 prompt Cache Break Detection在这里处理 `hashes[names[i] ?? `__idx_${i}`] = computeHash(strippedTools[i])`，完成这一小步状态转换。
    hashes[names[i] ?? `__idx_${i}`] = computeHash(strippedTools[i])
  }
  // 返回 `hashes`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return hashes
}

// getSystemCharCount 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSystemCharCount(system: TextBlockParam[]): number {
  // total 命名 `0`，让后续代码直接表达这个值的用途。
  let total = 0
  // 逐项读取 `system` 中的block，按输入顺序推进API 服务 prompt Cache Break Detection...。
  for (const block of system) {
    // API 服务 prompt Cache Break Detection在这里处理 `total += block.text.length`，完成这一小步状态转换。
    total += block.text.length
  }
  // 返回 `total`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return total
}

// buildDiffableContent 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildDiffableContent(
  system: TextBlockParam[],
  tools: BetaToolUnion[],
  model: string,
): string {
  // systemText派生`system.map`，供API 服务 prompt Cache Break Detection后续处理使用。
  const systemText = system.map(b => b.text).join('\n\n')
  // toolDetails 集合保存`tools`，供后续判断或组装使用。
  const toolDetails = tools
    // 链式调用 map，继续加工上一行在API 服务 prompt Cache Break Detection中产生的数据。
    .map(t => {
      // 满足 `!('name' in t)` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (!('name' in t)) return 'unknown'
      // desc固定为 `'description' in t ? t.description : ''`，作为API 服务 prompt Cache Break Detection后续展示或比较的基准。
      const desc = 'description' in t ? t.description : ''
      // schema保存`jsonStringify`，供API 服务 prompt Cache Break Detection后续处理使用。
      const schema = 'input_schema' in t ? jsonStringify(t.input_schema) : ''
      // 返回 ``${t.name}\n description: ${desc}\n input_schema: ${schema}``，作为API 服务 prompt Cache Break Detection这次计算的结果。
      return `${t.name}\n  description: ${desc}\n  input_schema: ${schema}`
    })
    .sort()
    .join('\n\n')
  // 返回 ``Model: ${model}\n\n=== System Prompt ===\n\n${systemText}\n\n=== Tools...`，作为API 服务 prompt Cache Break Detection这次计算的结果。
  return `Model: ${model}\n\n=== System Prompt ===\n\n${systemText}\n\n=== Tools (${tools.length}) ===\n\n${toolDetails}\n`
}

/** Extended tracking snapshot — everything that could affect the server-side
 *  cache key that we can observe from the client. All fields are optional so
 *  the call site can add incrementally; undefined fields compare as stable. */
// PromptStateSnapshot 固化API 服务 prompt Cache Break Detection里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptStateSnapshot = {
  system: TextBlockParam[]
  toolSchemas: BetaToolUnion[]
  querySource: QuerySource
  model: string
  agentId?: AgentId
  fastMode?: boolean
  globalCacheStrategy?: string
  betas?: readonly string[]
  autoModeActive?: boolean
  isUsingOverage?: boolean
  cachedMCEnabled?: boolean
  effortValue?: string | number
  extraBodyParams?: unknown
}

/**
 * Phase 1 (pre-call): Record the current prompt/tool state and detect what changed.
 * Does NOT fire events — just stores pending changes for phase 2 to use.
 */
// recordPromptState 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordPromptState(snapshot: PromptStateSnapshot): void {
  // 保护这一段可能失败的API 服务 prompt Cache Break Detection操作，确保异常能进入相邻错误处理。
  try {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      system,
      toolSchemas,
      querySource,
      model,
      agentId,
      fastMode,
      globalCacheStrategy = '',
      betas = [],
      autoModeActive = false,
      isUsingOverage = false,
      cachedMCEnabled = false,
      effortValue,
      extraBodyParams,
    } = snapshot
    // key读取`getTrackingKey`，供API 服务 prompt Cache Break Detection后续处理使用。
    const key = getTrackingKey(querySource, agentId)
    // key缺失时提前走兜底路径，避免API 服务 prompt Cache Break Detection继续依赖无效输入。
    if (!key) return

    // strippedSystem保存`stripCacheControl`，供API 服务 prompt Cache Break Detection后续处理使用。
    const strippedSystem = stripCacheControl(
      system as unknown as ReadonlyArray<Record<string, unknown>>,
    )
    // strippedTools 集合保存`stripCacheControl`，供API 服务 prompt Cache Break Detection后续处理使用。
    const strippedTools = stripCacheControl(
      toolSchemas as unknown as ReadonlyArray<Record<string, unknown>>,
    )

    // systemHash保存`computeHash`，供API 服务 prompt Cache Break Detection后续处理使用。
    const systemHash = computeHash(strippedSystem)
    // toolsHash保存`computeHash`，供API 服务 prompt Cache Break Detection后续处理使用。
    const toolsHash = computeHash(strippedTools)
    // Hash the full system array INCLUDING cache_control — this catches
    // scope flips (global↔org/none) and TTL flips (1h↔5m) that the stripped
    // hash can't see because the text content is identical.
    // cacheControlHash 缓存保存`computeHash`，供API 服务 prompt Cache Break Detection后续处理使用。
    const cacheControlHash = computeHash(
      // 调用 system.map，触发API 服务 prompt Cache Break Detection此处需要的副作用。
      system.map(b => ('cache_control' in b ? b.cache_control : null)),
    )
    // toolNames 集合派生`toolSchemas.map`，供API 服务 prompt Cache Break Detection后续处理使用。
    const toolNames = toolSchemas.map(t => ('name' in t ? t.name : 'unknown'))
    // Only compute per-tool hashes when the aggregate changed — common case
    // (tools unchanged) skips N extra jsonStringify calls.
    // computeToolHashes 集合封装成回调，供API 服务 prompt Cache Break Detection在事件触发或异步步骤中调用。
    const computeToolHashes = () =>
      computePerToolHashes(strippedTools, toolNames)
    // systemCharCount 数量读取`getSystemCharCount`，供API 服务 prompt Cache Break Detection后续处理使用。
    const systemCharCount = getSystemCharCount(system)
    // lazyDiffableContent封装成回调，供API 服务 prompt Cache Break Detection在事件触发或异步步骤中调用。
    const lazyDiffableContent = () =>
      buildDiffableContent(system, toolSchemas, model)
    // isFastMode标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const isFastMode = fastMode ?? false
    // sortedBetas 集合保存`sort`，供API 服务 prompt Cache Break Detection后续处理使用。
    const sortedBetas = [...betas].sort()
    // effortStr保存`String`，供API 服务 prompt Cache Break Detection后续处理使用。
    const effortStr = effortValue === undefined ? '' : String(effortValue)
    // extraBodyHash 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const extraBodyHash =
      extraBodyParams === undefined ? 0 : computeHash(extraBodyParams)

    // prev读取`previousStateBySource.get`，供API 服务 prompt Cache Break Detection后续处理使用。
    const prev = previousStateBySource.get(key)

    // prev缺失时提前走兜底路径，避免API 服务 prompt Cache Break Detection继续依赖无效输入。
    if (!prev) {
      // Evict oldest entries if map is at capacity
      // while 使用 previousStateBySource.size >= MAX_TRACKED_SOURCES 完成API 服务 prompt Cache Break Detection里的对应操作。
      while (previousStateBySource.size >= MAX_TRACKED_SOURCES) {
        // oldest保存`previousStateBySource.keys`，供API 服务 prompt Cache Break Detection后续处理使用。
        const oldest = previousStateBySource.keys().next().value
        // `oldest` 与 `undefined) previousStateBySourc...` 不一致时刷新派生状态，避免使用过期结果。
        if (oldest !== undefined) previousStateBySource.delete(oldest)
      }

      // previousStateBySource.set 写入新的状态值，使API 服务 prompt Cache Break Detection后续读取保持一致。
      previousStateBySource.set(key, {
        systemHash,
        toolsHash,
        cacheControlHash,
        toolNames,
        systemCharCount,
        model,
        fastMode: isFastMode,
        globalCacheStrategy,
        betas: sortedBetas,
        autoModeActive,
        isUsingOverage,
        cachedMCEnabled,
        effortValue: effortStr,
        extraBodyHash,
        callCount: 1,
        pendingChanges: null,
        prevCacheReadTokens: null,
        cacheDeletionsPending: false,
        buildDiffableContent: lazyDiffableContent,
        perToolHashes: computeToolHashes(),
      })
      // API 服务 prompt Cache Break Detection在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // API 服务 prompt Cache Break Detection在这里处理 `prev.callCount++`，完成这一小步状态转换。
    prev.callCount++

    // systemPromptChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const systemPromptChanged = systemHash !== prev.systemHash
    // toolSchemasChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const toolSchemasChanged = toolsHash !== prev.toolsHash
    // modelChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const modelChanged = model !== prev.model
    // fastModeChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const fastModeChanged = isFastMode !== prev.fastMode
    // cacheControlChanged 缓存标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const cacheControlChanged = cacheControlHash !== prev.cacheControlHash
    // globalCacheStrategyChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const globalCacheStrategyChanged =
      globalCacheStrategy !== prev.globalCacheStrategy
    // betasChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const betasChanged =
      sortedBetas.length !== prev.betas.length ||
      // 调用 sortedBetas.some，触发API 服务 prompt Cache Break Detection此处需要的副作用。
      sortedBetas.some((b, i) => b !== prev.betas[i])
    // autoModeChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const autoModeChanged = autoModeActive !== prev.autoModeActive
    // overageChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const overageChanged = isUsingOverage !== prev.isUsingOverage
    // cachedMCChanged 缓存标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const cachedMCChanged = cachedMCEnabled !== prev.cachedMCEnabled
    // effortChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const effortChanged = effortStr !== prev.effortValue
    // extraBodyChanged标记API 服务 prompt Cache Break Detection是否启用对应路径。
    const extraBodyChanged = extraBodyHash !== prev.extraBodyHash

    // API 服务 prompt Cache Break Detection在这里进入条件判断，后续代码按实际状态分流。
    if (
      systemPromptChanged ||
      toolSchemasChanged ||
      modelChanged ||
      fastModeChanged ||
      cacheControlChanged ||
      globalCacheStrategyChanged ||
      betasChanged ||
      autoModeChanged ||
      overageChanged ||
      cachedMCChanged ||
      effortChanged ||
      extraBodyChanged
    ) {
      // prevToolSet保存`Set`，供API 服务 prompt Cache Break Detection后续处理使用。
      const prevToolSet = new Set(prev.toolNames)
      // newToolSet保存`Set`，供API 服务 prompt Cache Break Detection后续处理使用。
      const newToolSet = new Set(toolNames)
      // prevBetaSet保存`Set`，供API 服务 prompt Cache Break Detection后续处理使用。
      const prevBetaSet = new Set(prev.betas)
      // newBetaSet保存`Set`，供API 服务 prompt Cache Break Detection后续处理使用。
      const newBetaSet = new Set(sortedBetas)
      // addedTools 集合筛选`toolNames.filter`，供API 服务 prompt Cache Break Detection后续处理使用。
      const addedTools = toolNames.filter(n => !prevToolSet.has(n))
      // removedTools 集合筛选`toolNames.filter`，供API 服务 prompt Cache Break Detection后续处理使用。
      const removedTools = prev.toolNames.filter(n => !newToolSet.has(n))
      // changedToolSchemas 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const changedToolSchemas: string[] = []
      // 满足 `toolSchemasChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (toolSchemasChanged) {
        // newHashes 集合保存`computeToolHashes`，供API 服务 prompt Cache Break Detection后续处理使用。
        const newHashes = computeToolHashes()
        // 逐项读取 `toolNames` 中的名称，按输入顺序推进API 服务 prompt Cache Break Detection...。
        for (const name of toolNames) {
          // 满足 `!prevToolSet.has(name)` 时，API 服务 prompt Cache Break Detection执行该分支。
          if (!prevToolSet.has(name)) continue
          // `newHashes[name]` 与 `prev.perToolHashes[name]` 不一致时刷新派生状态，避免使用过期结果。
          if (newHashes[name] !== prev.perToolHashes[name]) {
            // changedToolSchemas 集合追加新条目，保持收集顺序与输入顺序一致。
            changedToolSchemas.push(name)
          }
        }
        // perToolHashes 集合更新为 `newHashes`，确保API 服务后续读取最新状态。
        prev.perToolHashes = newHashes
      }
      // pendingChanges 集合更新为 `{`，确保API 服务后续读取最新状态。
      prev.pendingChanges = {
        systemPromptChanged,
        toolSchemasChanged,
        modelChanged,
        fastModeChanged,
        cacheControlChanged,
        globalCacheStrategyChanged,
        betasChanged,
        autoModeChanged,
        overageChanged,
        cachedMCChanged,
        effortChanged,
        extraBodyChanged,
        addedToolCount: addedTools.length,
        removedToolCount: removedTools.length,
        addedTools,
        removedTools,
        changedToolSchemas,
        systemCharDelta: systemCharCount - prev.systemCharCount,
        previousModel: prev.model,
        newModel: model,
        prevGlobalCacheStrategy: prev.globalCacheStrategy,
        newGlobalCacheStrategy: globalCacheStrategy,
        // 这个回调绑定到 addedBetas: sortedBetas.filter(b => !prevBetaSet.has(b)),，负责API 服务 prompt Cache Break Detection在该局部场景下的响应。
        addedBetas: sortedBetas.filter(b => !prevBetaSet.has(b)),
        // 这个回调绑定到 removedBetas: prev.betas.filter(b => !newBetaSet.has(b)),，负责API 服务 prompt Cache Break Detection在该局部场景下的响应。
        removedBetas: prev.betas.filter(b => !newBetaSet.has(b)),
        prevEffortValue: prev.effortValue,
        newEffortValue: effortStr,
        buildPrevDiffableContent: prev.buildDiffableContent,
      }
    } else {
      // pendingChanges 集合更新为 `null`，确保API 服务后续读取最新状态。
      prev.pendingChanges = null
    }

    // systemHash更新为 `systemHash`，确保API 服务后续读取最新状态。
    prev.systemHash = systemHash
    // toolsHash更新为 `toolsHash`，确保API 服务后续读取最新状态。
    prev.toolsHash = toolsHash
    // cacheControlHash 缓存更新为 `cacheControlHash`，确保API 服务后续读取最新状态。
    prev.cacheControlHash = cacheControlHash
    // toolNames 集合更新为 `toolNames`，确保API 服务后续读取最新状态。
    prev.toolNames = toolNames
    // systemCharCount 数量更新为 `systemCharCount`，确保API 服务后续读取最新状态。
    prev.systemCharCount = systemCharCount
    // 模型名称更新为 `model`，确保API 服务后续读取最新状态。
    prev.model = model
    // fastMode更新为 `isFastMode`，确保API 服务后续读取最新状态。
    prev.fastMode = isFastMode
    // globalCacheStrategy 缓存更新为 `globalCacheStrategy`，确保API 服务后续读取最新状态。
    prev.globalCacheStrategy = globalCacheStrategy
    // betas 集合更新为 `sortedBetas`，确保API 服务后续读取最新状态。
    prev.betas = sortedBetas
    // autoModeActive更新为 `autoModeActive`，确保API 服务后续读取最新状态。
    prev.autoModeActive = autoModeActive
    // isUsingOverage更新为 `isUsingOverage`，确保API 服务后续读取最新状态。
    prev.isUsingOverage = isUsingOverage
    // cachedMCEnabled 缓存更新为 `cachedMCEnabled`，确保API 服务后续读取最新状态。
    prev.cachedMCEnabled = cachedMCEnabled
    // effortValue更新为 `effortStr`，确保API 服务后续读取最新状态。
    prev.effortValue = effortStr
    // extraBodyHash更新为 `extraBodyHash`，确保API 服务后续读取最新状态。
    prev.extraBodyHash = extraBodyHash
    // buildDiffableContent更新为 `lazyDiffableContent`，确保API 服务后续读取最新状态。
    prev.buildDiffableContent = lazyDiffableContent
  } catch (e: unknown) {
    // 记录API 服务 prompt Cache Break Detection运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

/**
 * Phase 2 (post-call): Check the API response's cache tokens to determine
 * if a cache break actually occurred. If it did, use the pending changes
 * from phase 1 to explain why.
 */
// checkResponseForCacheBreak 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkResponseForCacheBreak(
  querySource: QuerySource,
  cacheReadTokens: number,
  cacheCreationTokens: number,
  messages: Message[],
  agentId?: AgentId,
  requestId?: string | null,
): Promise<void> {
  // 保护这一段可能失败的API 服务 prompt Cache Break Detection操作，确保异常能进入相邻错误处理。
  try {
    // key读取`getTrackingKey`，供API 服务 prompt Cache Break Detection后续处理使用。
    const key = getTrackingKey(querySource, agentId)
    // key缺失时提前走兜底路径，避免API 服务 prompt Cache Break Detection继续依赖无效输入。
    if (!key) return

    // 状态读取`previousStateBySource.get`，供API 服务 prompt Cache Break Detection后续处理使用。
    const state = previousStateBySource.get(key)
    // 状态缺失时提前走兜底路径，避免API 服务 prompt Cache Break Detection继续依赖无效输入。
    if (!state) return

    // Skip excluded models (e.g., haiku has different caching behavior)
    // 满足 `isExcludedModel(state.model)` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (isExcludedModel(state.model)) return

    // prevCacheRead 缓存保存`state.prevCacheReadTokens`，供API 服务 prompt Cache Break Detection后续判断或输出使用。
    const prevCacheRead = state.prevCacheReadTokens
    // prevCacheReadTokens 缓存更新为 `cacheReadTokens`，确保API 服务后续读取最新状态。
    state.prevCacheReadTokens = cacheReadTokens

    // Calculate time since last call for TTL detection by finding the most recent
    // assistant message timestamp in the messages array (before the current response)
    // lastAssistantMessage 消息数据筛选`messages.findLast`，供API 服务 prompt Cache Break Detection后续处理使用。
    const lastAssistantMessage = messages.findLast(m => m.type === 'assistant')
    // timeSinceLastAssistantMsg保存`lastAssistantMessage`，供API 服务 prompt Cache Break Detection后续判断或输出使用。
    const timeSinceLastAssistantMsg = lastAssistantMessage
      ? Date.now() - new Date(lastAssistantMessage.timestamp).getTime()
      : null

    // Skip the first call — no previous value to compare against
    // 满足 `prevCacheRead === null` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (prevCacheRead === null) return

    // changes 集合 命名 `state.pendingChanges`，让后续代码直接表达这个值的用途。
    const changes = state.pendingChanges

    // Cache deletions via cached microcompact intentionally reduce the cached
    // prefix. The drop in cache read tokens is expected — reset the baseline
    // so we don't false-positive on the next call.
    // 满足 `state.cacheDeletionsPending` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (state.cacheDeletionsPending) {
      // cacheDeletionsPending 缓存更新为 `false`，确保API 服务后续读取最新状态。
      state.cacheDeletionsPending = false
      // 记录API 服务 prompt Cache Break Detection运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PROMPT CACHE] cache deletion applied, cache read: ${prevCacheRead} → ${cacheReadTokens} (expected drop)`,
      )
      // Don't flag as a break — the remaining state is still valid
      // pendingChanges 集合更新为 `null`，确保API 服务后续读取最新状态。
      state.pendingChanges = null
      // API 服务 prompt Cache Break Detection在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Detect a cache break: cache read dropped >5% from previous AND
    // the absolute drop exceeds the minimum threshold.
    // tokenDrop保存`prevCacheRead - cacheReadTokens`，供API 服务 prompt Cache Break Detection后续判断或输出使用。
    const tokenDrop = prevCacheRead - cacheReadTokens
    // API 服务 prompt Cache Break Detection在这里进入条件判断，后续代码按实际状态分流。
    if (
      cacheReadTokens >= prevCacheRead * 0.95 ||
      tokenDrop < MIN_CACHE_MISS_TOKENS
    ) {
      // pendingChanges 集合更新为 `null`，确保API 服务后续读取最新状态。
      state.pendingChanges = null
      // API 服务 prompt Cache Break Detection在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Build explanation from pending changes (if any)
    // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const parts: string[] = []
    // 满足 `changes` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (changes) {
      // 满足 `changes.modelChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.modelChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(
          `model changed (${changes.previousModel} → ${changes.newModel})`,
        )
      }
      // 满足 `changes.systemPromptChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.systemPromptChanged) {
        // charDelta 命名 `changes.systemCharDelta`，让后续代码直接表达这个值的用途。
        const charDelta = changes.systemCharDelta
        // charInfo 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const charInfo =
          charDelta === 0
            ? ''
            : charDelta > 0
              ? ` (+${charDelta} chars)`
              : ` (${charDelta} chars)`
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`system prompt changed${charInfo}`)
      }
      // 满足 `changes.toolSchemasChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.toolSchemasChanged) {
        // toolDiff 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const toolDiff =
          changes.addedToolCount > 0 || changes.removedToolCount > 0
            ? ` (+${changes.addedToolCount}/-${changes.removedToolCount} tools)`
            : ' (tool prompt/schema changed, same tool set)'
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`tools changed${toolDiff}`)
      }
      // 满足 `changes.fastModeChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.fastModeChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('fast mode toggled')
      }
      // 满足 `changes.globalCacheStrategyChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.globalCacheStrategyChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(
          `global cache strategy changed (${changes.prevGlobalCacheStrategy || 'none'} → ${changes.newGlobalCacheStrategy || 'none'})`,
        )
      }
      // API 服务 prompt Cache Break Detection在这里进入条件判断，后续代码按实际状态分流。
      if (
        changes.cacheControlChanged &&
        !changes.globalCacheStrategyChanged &&
        !changes.systemPromptChanged
      ) {
        // Only report as standalone cause if nothing else explains it —
        // otherwise the scope/TTL flip is a consequence, not the root cause.
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('cache_control changed (scope or TTL)')
      }
      // 满足 `changes.betasChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.betasChanged) {
        // added 命名 `changes.addedBetas.length`，让后续代码直接表达这个值的用途。
        const added = changes.addedBetas.length
          ? `+${changes.addedBetas.join(',')}`
          : ''
        // removed记录 `changes.removedBetas.length` 是否成立，下一步按该结果分支。
        const removed = changes.removedBetas.length
          ? `-${changes.removedBetas.join(',')}`
          : ''
        // diff筛选`filter`，供API 服务 prompt Cache Break Detection后续处理使用。
        const diff = [added, removed].filter(Boolean).join(' ')
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`betas changed${diff ? ` (${diff})` : ''}`)
      }
      // 满足 `changes.autoModeChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.autoModeChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('auto mode toggled')
      }
      // 满足 `changes.overageChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.overageChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('overage state changed (TTL latched, no flip)')
      }
      // 满足 `changes.cachedMCChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.cachedMCChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('cached microcompact toggled')
      }
      // 满足 `changes.effortChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.effortChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(
          `effort changed (${changes.prevEffortValue || 'default'} → ${changes.newEffortValue || 'default'})`,
        )
      }
      // 满足 `changes.extraBodyChanged` 时，API 服务 prompt Cache Break Detection执行该分支。
      if (changes.extraBodyChanged) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push('extra body params changed')
      }
    }

    // Check if time gap suggests TTL expiration
    // lastAssistantMsgOver5minAgo 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const lastAssistantMsgOver5minAgo =
      timeSinceLastAssistantMsg !== null &&
      timeSinceLastAssistantMsg > CACHE_TTL_5MIN_MS
    // lastAssistantMsgOver1hAgo 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const lastAssistantMsgOver1hAgo =
      timeSinceLastAssistantMsg !== null &&
      timeSinceLastAssistantMsg > CACHE_TTL_1HOUR_MS

    // Post PR #19823 BQ analysis (bq-queries/prompt-caching/cache_break_pr19823_analysis.sql):
    // when all client-side flags are false and the gap is under TTL, ~90% of breaks
    // are server-side routing/eviction or billed/inference disagreement. Label
    // accordingly instead of implying a CC bug hunt.
    // reason 先占位，稍后的条件分支会根据实际输入补齐它。
    let reason: string
    // 满足 `parts.length > 0` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (parts.length > 0) {
      // reason更新为 `parts.join(', ')`，确保API 服务后续读取最新状态。
      reason = parts.join(', ')
    // API 服务 prompt Cache Break Detection在这里处理 `} else if (lastAssistantMsgOver1hAgo) {`，完成这一小步状态转换。
    } else if (lastAssistantMsgOver1hAgo) {
      // reason更新为 `'possible 1h TTL expiry (prompt unchanged)'`，确保API 服务后续读取最新状态。
      reason = 'possible 1h TTL expiry (prompt unchanged)'
    // API 服务 prompt Cache Break Detection在这里处理 `} else if (lastAssistantMsgOver5minAgo) {`，完成这一小步状态转换。
    } else if (lastAssistantMsgOver5minAgo) {
      // reason更新为 `'possible 5min TTL expiry (prompt unchanged)'`，确保API 服务后续读取最新状态。
      reason = 'possible 5min TTL expiry (prompt unchanged)'
    // API 服务 prompt Cache Break Detection在这里处理 `} else if (timeSinceLastAssistantMsg !== null) {`，完成这一小步状态转换。
    } else if (timeSinceLastAssistantMsg !== null) {
      // reason更新为 `'likely server-side (prompt unchanged, <5min gap)'`，确保API 服务后续读取最新状态。
      reason = 'likely server-side (prompt unchanged, <5min gap)'
    } else {
      // reason更新为 `'unknown cause'`，确保API 服务后续读取最新状态。
      reason = 'unknown cause'
    }

    // 记录API 服务 prompt Cache Break Detection运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_prompt_cache_break', {
      systemPromptChanged: changes?.systemPromptChanged ?? false,
      toolSchemasChanged: changes?.toolSchemasChanged ?? false,
      modelChanged: changes?.modelChanged ?? false,
      fastModeChanged: changes?.fastModeChanged ?? false,
      cacheControlChanged: changes?.cacheControlChanged ?? false,
      globalCacheStrategyChanged: changes?.globalCacheStrategyChanged ?? false,
      betasChanged: changes?.betasChanged ?? false,
      autoModeChanged: changes?.autoModeChanged ?? false,
      overageChanged: changes?.overageChanged ?? false,
      cachedMCChanged: changes?.cachedMCChanged ?? false,
      effortChanged: changes?.effortChanged ?? false,
      extraBodyChanged: changes?.extraBodyChanged ?? false,
      addedToolCount: changes?.addedToolCount ?? 0,
      removedToolCount: changes?.removedToolCount ?? 0,
      systemCharDelta: changes?.systemCharDelta ?? 0,
      // Tool names are sanitized: built-in names are a fixed vocabulary,
      // MCP tools collapse to 'mcp' (user-configured, could leak paths).
      addedTools: (changes?.addedTools ?? [])
        .map(sanitizeToolName)
        .join(
          ',',
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      removedTools: (changes?.removedTools ?? [])
        .map(sanitizeToolName)
        .join(
          ',',
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      changedToolSchemas: (changes?.changedToolSchemas ?? [])
        .map(sanitizeToolName)
        .join(
          ',',
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      // Beta header names and cache strategy are fixed enum-like values,
      // not code or filepaths. requestId is an opaque server-generated ID.
      addedBetas: (changes?.addedBetas ?? []).join(
        ',',
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      removedBetas: (changes?.removedBetas ?? []).join(
        ',',
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      prevGlobalCacheStrategy: (changes?.prevGlobalCacheStrategy ??
        '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      newGlobalCacheStrategy: (changes?.newGlobalCacheStrategy ??
        '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      callNumber: state.callCount,
      prevCacheReadTokens: prevCacheRead,
      cacheReadTokens,
      cacheCreationTokens,
      timeSinceLastAssistantMsg: timeSinceLastAssistantMsg ?? -1,
      lastAssistantMsgOver5minAgo,
      lastAssistantMsgOver1hAgo,
      requestId: (requestId ??
        '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // Write diff file for ant debugging via --debug. The path is included in
    // the summary log so ants can find it (DevBar UI removed — event data
    // flows reliably to BQ for analytics).
    // diffPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let diffPath: string | undefined
    // 满足 `changes?.buildPrevDiffableContent` 时，API 服务 prompt Cache Break Detection执行该分支。
    if (changes?.buildPrevDiffableContent) {
      // diffPath 路径数据更新为 `await writeCacheBreakDiff(`，确保API 服务后续读取最新状态。
      diffPath = await writeCacheBreakDiff(
        changes.buildPrevDiffableContent(),
        state.buildDiffableContent(),
      )
    }

    // diffSuffix保存`diffPath ? `, diff: ${diffPath}` : ''`，供API 服务 prompt Cache Break Detection后续判断或输出使用。
    const diffSuffix = diffPath ? `, diff: ${diffPath}` : ''
    // summary读取 ``[PROMPT CACHE BREAK] ${reason} [source=${querySource}, c...` 对应条目，后续围绕该成员继续处理。
    const summary = `[PROMPT CACHE BREAK] ${reason} [source=${querySource}, call #${state.callCount}, cache read: ${prevCacheRead} → ${cacheReadTokens}, creation: ${cacheCreationTokens}${diffSuffix}]`

    // 记录API 服务 prompt Cache Break Detection运行诊断，方便排查异常路径或性能问题。
    logForDebugging(summary, { level: 'warn' })

    // pendingChanges 集合更新为 `null`，确保API 服务后续读取最新状态。
    state.pendingChanges = null
  } catch (e: unknown) {
    // 记录API 服务 prompt Cache Break Detection运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

/**
 * Call when cached microcompact sends cache_edits deletions.
 * The next API response will have lower cache read tokens — that's
 * expected, not a cache break.
 */
// notifyCacheDeletion 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyCacheDeletion(
  querySource: QuerySource,
  agentId?: AgentId,
): void {
  // key读取`getTrackingKey`，供API 服务 prompt Cache Break Detection后续处理使用。
  const key = getTrackingKey(querySource, agentId)
  // 状态读取`previousStateBySource.get`，供API 服务 prompt Cache Break Detection后续处理使用。
  const state = key ? previousStateBySource.get(key) : undefined
  // 满足 `state` 时，API 服务 prompt Cache Break Detection执行该分支。
  if (state) {
    // cacheDeletionsPending 缓存更新为 `true`，确保API 服务后续读取最新状态。
    state.cacheDeletionsPending = true
  }
}

/**
 * Call after compaction to reset the cache read baseline.
 * Compaction legitimately reduces message count, so cache read tokens
 * will naturally drop on the next call — that's not a break.
 */
// notifyCompaction 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyCompaction(
  querySource: QuerySource,
  agentId?: AgentId,
): void {
  // key读取`getTrackingKey`，供API 服务 prompt Cache Break Detection后续处理使用。
  const key = getTrackingKey(querySource, agentId)
  // 状态读取`previousStateBySource.get`，供API 服务 prompt Cache Break Detection后续处理使用。
  const state = key ? previousStateBySource.get(key) : undefined
  // 满足 `state` 时，API 服务 prompt Cache Break Detection执行该分支。
  if (state) {
    // prevCacheReadTokens 缓存更新为 `null`，确保API 服务后续读取最新状态。
    state.prevCacheReadTokens = null
  }
}

// cleanupAgentTracking 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cleanupAgentTracking(agentId: AgentId): void {
  // 调用 previousStateBySource.delete，触发API 服务 prompt Cache Break Detection此处需要的副作用。
  previousStateBySource.delete(agentId)
}

// resetPromptCacheBreakDetection 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetPromptCacheBreakDetection(): void {
  // 调用 previousStateBySource.clear，触发API 服务 prompt Cache Break Detection此处需要的副作用。
  previousStateBySource.clear()
}

// writeCacheBreakDiff 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeCacheBreakDiff(
  prevContent: string,
  newContent: string,
): Promise<string | undefined> {
  // 保护这一段可能失败的API 服务 prompt Cache Break Detection操作，确保异常能进入相邻错误处理。
  try {
    // diffPath 路径数据读取`getCacheBreakDiffPath`，供API 服务 prompt Cache Break Detection后续处理使用。
    const diffPath = getCacheBreakDiffPath()
    // 等待 `mkdir(getClaudeTempDir(), { recursive: true })` 完成，再继续API 服务 prompt Cache Break Detection的异步流程。
    await mkdir(getClaudeTempDir(), { recursive: true })
    // patch构建`createPatch`，供API 服务 prompt Cache Break Detection后续处理使用。
    const patch = createPatch(
      'prompt-state',
      prevContent,
      newContent,
      'before',
      'after',
    )
    // 等待 `writeFile(diffPath, patch)` 完成，再继续API 服务 prompt Cache Break Detection的异步流程。
    await writeFile(diffPath, patch)
    // 返回 `diffPath`，作为API 服务 prompt Cache Break Detection这次计算的结果。
    return diffPath
  } catch {
    // 返回 `undefined`，作为API 服务 prompt Cache Break Detection这次计算的结果。
    return undefined
  }
}
