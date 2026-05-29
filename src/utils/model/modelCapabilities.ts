// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 OAUTH_BETA_HEADER，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { OAUTH_BETA_HEADER } from '../../constants/oauth.js'
// 接入 getAnthropicClient 服务层能力，把外部通信或共享状态交给 ../../services/api/client.js 处理。
import { getAnthropicClient } from '../../services/api/client.js'
// 引入 isClaudeAISubscriber，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { isClaudeAISubscriber } from '../auth.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 引入 safeParseJSON，将 ../json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from '../json.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 isEssentialTrafficOnly，将 ../privacyLevel.js 中已经封装好的能力接到本文件流程里。
import { isEssentialTrafficOnly } from '../privacyLevel.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 getAPIProvider、isFirstPartyAnthropicBaseUrl，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider, isFirstPartyAnthropicBaseUrl } from './providers.js'

// .strip() — don't persist internal-only fields (mycro_deployments etc.) to disk
// ModelCapabilitySchema保存`lazySchema`，供共享工具后续处理使用。
const ModelCapabilitySchema = lazySchema(() =>
  z
    .object({
      id: z.string(),
      max_input_tokens: z.number().optional(),
      max_tokens: z.number().optional(),
    })
    .strip(),
)

// CacheFileSchema 文件数据保存`lazySchema`，供共享工具后续处理使用。
const CacheFileSchema = lazySchema(() =>
  z.object({
    models: z.array(ModelCapabilitySchema()),
    timestamp: z.number(),
  }),
)

// ModelCapability 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelCapability = z.infer<ReturnType<typeof ModelCapabilitySchema>>

// getCacheDir 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCacheDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'cache')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'cache')
}

// getCachePath 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCachePath(): string {
  // 返回 `join(getCacheDir(), 'model-capabilities.json')`，作为共享工具这次计算的结果。
  return join(getCacheDir(), 'model-capabilities.json')
}

// isModelCapabilitiesEligible 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isModelCapabilitiesEligible(): boolean {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return false
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') return false
  // 满足 `!isFirstPartyAnthropicBaseUrl()` 时，共享工具执行该分支。
  if (!isFirstPartyAnthropicBaseUrl()) return false
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// Longest-id-first so substring match prefers most specific; secondary key for stable isEqual
// sortForMatching 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sortForMatching(models: ModelCapability[]): ModelCapability[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...models].sort(
    (a, b) => b.id.length - a.id.length || a.id.localeCompare(b.id),
  )
}

// Keyed on cache path so tests that set CLAUDE_CONFIG_DIR get a fresh read
// loadCache 缓存保存`memoize`，供共享工具后续处理使用。
const loadCache = memoize(
  (path: string): ModelCapability[] | null => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line custom-rules/no-sync-fs -- memoized; called from sync getContextWindowForModel
      // 原始文本读取`readFileSync`，供共享工具后续处理使用。
      const raw = readFileSync(path, 'utf-8')
      // 解析结果保存`CacheFileSchema`，供共享工具后续处理使用。
      const parsed = CacheFileSchema().safeParse(safeParseJSON(raw, false))
      // 返回 `parsed.success ? parsed.data.models : null`，作为共享工具这次计算的结果。
      return parsed.success ? parsed.data.models : null
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  },
  // 路径更新为 `> path`，确保模型工具后续读取最新状态。
  path => path,
)

// getModelCapability 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelCapability(model: string): ModelCapability | undefined {
  // 满足 `!isModelCapabilitiesEligible()` 时，共享工具执行该分支。
  if (!isModelCapabilitiesEligible()) return undefined
  // cached 缓存读取`loadCache`，供共享工具后续处理使用。
  const cached = loadCache(getCachePath())
  // !cached || cached 缓存为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!cached || cached.length === 0) return undefined
  // m保存`model.toLowerCase`，供共享工具后续处理使用。
  const m = model.toLowerCase()
  // exact筛选`cached.find`，供共享工具后续处理使用。
  const exact = cached.find(c => c.id.toLowerCase() === m)
  // 满足 `exact` 时，共享工具执行该分支。
  if (exact) return exact
  // 返回 `cached.find(c => m.includes(c.id.toLowerCase()))`，作为共享工具这次计算的结果。
  return cached.find(c => m.includes(c.id.toLowerCase()))
}

// refreshModelCapabilities 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshModelCapabilities(): Promise<void> {
  // 满足 `!isModelCapabilitiesEligible()` 时，共享工具执行该分支。
  if (!isModelCapabilitiesEligible()) return
  // 满足 `isEssentialTrafficOnly()` 时，共享工具执行该分支。
  if (isEssentialTrafficOnly()) return

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // anthropic读取`getAnthropicClient`，供共享工具后续处理使用。
    const anthropic = await getAnthropicClient({ maxRetries: 1 })
    // betas 集合保存`isClaudeAISubscriber`，供共享工具后续处理使用。
    const betas = isClaudeAISubscriber() ? [OAUTH_BETA_HEADER] : undefined
    // 解析结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const parsed: ModelCapability[] = []
    // 逐项读取 `anthropic.models.list({ betas })` 中的entry，按输入顺序推进共享工具。
    for await (const entry of anthropic.models.list({ betas })) {
      // 结果保存`ModelCapabilitySchema`，供共享工具后续处理使用。
      const result = ModelCapabilitySchema().safeParse(entry)
      // 满足 `result.success) parsed.push(result.data` 时，共享工具执行该分支。
      if (result.success) parsed.push(result.data)
    }
    // 解析结果为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (parsed.length === 0) return

    // 路径读取`getCachePath`，供共享工具后续处理使用。
    const path = getCachePath()
    // models 集合保存`sortForMatching`，供共享工具后续处理使用。
    const models = sortForMatching(parsed)
    // 满足 `isEqual(loadCache(path), models)` 时，共享工具执行该分支。
    if (isEqual(loadCache(path), models)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[modelCapabilities] cache unchanged, skipping write')
      // 模型工具 model Capabilities在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `mkdir(getCacheDir(), { recursive: true })` 完成，再继续模型工具 model Capabilities的异步流程。
    await mkdir(getCacheDir(), { recursive: true })
    // 等待 `writeFile(path, jsonStringify({ models, timestamp: Date.now() }), {` 完成，再继续模型工具 model Capabilities的异步流程。
    await writeFile(path, jsonStringify({ models, timestamp: Date.now() }), {
      encoding: 'utf-8',
      mode: 0o600,
    })
    // 调用 loadCache.cache.delete，触发共享工具此处需要的副作用。
    loadCache.cache.delete(path)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[modelCapabilities] cached ${models.length} models`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[modelCapabilities] fetch failed: ${error instanceof Error ? error.message : 'unknown'}`,
    )
  }
}
