// 引入 GrowthBook，将 @growthbook/growthbook 中已经封装好的能力接到本文件流程里。
import { GrowthBook } from '@growthbook/growthbook'
// 引入 isEqual、memoize，将 lodash-es 中已经封装好的能力接到本文件流程里。
import { isEqual, memoize } from 'lodash-es'
// 整理这一组导入，让服务层 growthbook后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getSessionTrustAccepted,
} from '../../bootstrap/state.js'
// 引入 getGrowthBookClientKey，将 ../../constants/keys.js 中已经封装好的能力接到本文件流程里。
import { getGrowthBookClientKey } from '../../constants/keys.js'
// 整理这一组导入，让服务层 growthbook后续逻辑可以直接复用这些外部能力。
import {
  checkHasTrustDialogAccepted,
  getGlobalConfig,
  saveGlobalConfig,
} from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 getAuthHeaders 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders } from '../../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 createSignal 工具函数，把通用处理留在 ../../utils/signal.js 中维护。
import { createSignal } from '../../utils/signal.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让服务层 growthbook后续逻辑可以直接复用这些外部能力。
import {
  type GitHubActionsMetadata,
  getUserForGrowthBook,
} from '../../utils/user.js'
// 整理这一组导入，让服务层 growthbook后续逻辑可以直接复用这些外部能力。
import {
  is1PEventLoggingEnabled,
  logGrowthBookExperimentTo1P,
} from './firstPartyEventLogger.js'

/**
 * User attributes sent to GrowthBook for targeting.
 * Uses UUID suffix (not Uuid) to align with GrowthBook conventions.
 */
// GrowthBookUserAttributes 固化服务层 growthbook里传递的数据形状，帮助调用方按同一结构读写字段。
export type GrowthBookUserAttributes = {
  id: string
  sessionId: string
  deviceID: string
  platform: 'win32' | 'darwin' | 'linux'
  apiBaseUrlHost?: string
  organizationUUID?: string
  accountUUID?: string
  userType?: string
  subscriptionType?: string
  rateLimitTier?: string
  firstTokenTime?: number
  email?: string
  appVersion?: string
  github?: GitHubActionsMetadata
}

/**
 * Malformed feature response from API that uses "value" instead of "defaultValue".
 * This is a workaround until the API is fixed.
 */
// MalformedFeatureDefinition 固化服务层 growthbook里传递的数据形状，帮助调用方按同一结构读写字段。
type MalformedFeatureDefinition = {
  value?: unknown
  defaultValue?: unknown
  [key: string]: unknown
}

// API 客户端初始化为空值，后续分支会在有数据时补齐。
let client: GrowthBook | null = null

// Named handler refs so resetGrowthBook can remove them to prevent accumulation
// 这个回调绑定到 let currentBeforeExitHandler: (() => void) | null = null，负责服务层 growthbook在该局部场景下的响应。
let currentBeforeExitHandler: (() => void) | null = null
// 这个回调绑定到 let currentExitHandler: (() => void) | null = null，负责服务层 growthbook在该局部场景下的响应。
let currentExitHandler: (() => void) | null = null

// Track whether auth was available when the client was created
// This allows us to detect when we need to recreate with fresh auth headers
// clientCreatedWithAuth标记服务层 growthbook是否启用对应路径。
let clientCreatedWithAuth = false

// Store experiment data from payload for logging exposures later
// StoredExperimentData 固化服务层 growthbook里传递的数据形状，帮助调用方按同一结构读写字段。
type StoredExperimentData = {
  experimentId: string
  variationId: number
  inExperiment?: boolean
  hashAttribute?: string
  hashValue?: string
}
// experimentDataByFeature 命名 `new Map<string, StoredExperimentData>()`，让后续代码直接表达这个值的用途。
const experimentDataByFeature = new Map<string, StoredExperimentData>()

// Cache for remote eval feature values - workaround for SDK not respecting remoteEval response
// The SDK's setForcedFeatures also doesn't work reliably with remoteEval
// remoteEvalFeatureValues 集合 命名 `new Map<string, unknown>()`，让后续代码直接表达这个值的用途。
const remoteEvalFeatureValues = new Map<string, unknown>()

// Track features accessed before init that need exposure logging
// pendingExposures 集合构建`new Set<string>()` 整理出中间结果，供服务层 growthbook后续步骤使用。
const pendingExposures = new Set<string>()

// Track features that have already had their exposure logged this session (dedup)
// This prevents firing duplicate exposure events when getFeatureValue_CACHED_MAY_BE_STALE
// is called repeatedly in hot paths (e.g., isAutoMemoryEnabled in render loops)
// loggedExposures 集合构建`new Set<string>()`，供后续判断或组装使用。
const loggedExposures = new Set<string>()

// Track re-initialization promise for security gate checks
// When GrowthBook is re-initializing (e.g., after auth change), security gate checks
// should wait for init to complete to avoid returning stale values
// reinitializingPromise 异步任务保存`null`，作为后续空值处理的输入。
let reinitializingPromise: Promise<unknown> | null = null

// Listeners notified when GrowthBook feature values refresh (initial init or
// periodic refresh). Use for systems that bake feature values into long-lived
// objects at construction time (e.g. firstPartyEventLogger reads
// tengu_1p_event_batch_config once and builds a LoggerProvider with it) and
// need to rebuild when config changes. Per-call readers like
// getEventSamplingConfig / isSinkKilled don't need this — they're already
// reactive.
//
// NOT cleared by resetGrowthBook — subscribers register once (typically in
// init.ts) and must survive auth-change resets.
// GrowthBookRefreshListener 固化服务层 growthbook里传递的数据形状，帮助调用方按同一结构读写字段。
type GrowthBookRefreshListener = () => void | Promise<void>
// refreshed构建`createSignal`，供服务层 growthbook后续处理使用。
const refreshed = createSignal()

/** Call a listener with sync-throw and async-rejection both routed to logError. */
// callSafe 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function callSafe(listener: GrowthBookRefreshListener): void {
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // Promise.resolve() normalizes sync returns and Promises so both
    // sync throws (caught by outer try) and async rejections (caught
    // by .catch) hit logError. Without the .catch, an async listener
    // that rejects becomes an unhandled rejection — the try/catch
    // only sees the Promise, not its eventual rejection.
    // 这个回调绑定到 void Promise.resolve(listener()).catch(e => {，负责服务层 growthbook在该局部场景下的响应。
    void Promise.resolve(listener()).catch(e => {
      // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
      logError(e)
    })
  } catch (e) {
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

/**
 * Register a callback to fire when GrowthBook feature values refresh.
 * Returns an unsubscribe function.
 *
 * If init has already completed with features by the time this is called
 * (remoteEvalFeatureValues is populated), the listener fires once on the
 * next microtask. This catch-up handles the race where GB's network response
 * lands before the REPL's useEffect commits — on external builds with fast
 * networks and MCP-heavy configs, init can finish in ~100ms while REPL mount
 * takes ~600ms (see #20951 external-build trace at 30.540 vs 31.046).
 *
 * Change detection is on the subscriber: the callback fires on every refresh;
 * use isEqual against your last-seen config to decide whether to act.
 */
// onGrowthBookRefresh 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function onGrowthBookRefresh(
  listener: GrowthBookRefreshListener,
): () => void {
  // subscribed标记服务层 growthbook是否启用对应路径。
  let subscribed = true
  // unsubscribe保存`refreshed.subscribe`，供服务层 growthbook后续处理使用。
  const unsubscribe = refreshed.subscribe(() => callSafe(listener))
  // 满足 `remoteEvalFeatureValues.size > 0` 时，服务层 growthbook执行该分支。
  if (remoteEvalFeatureValues.size > 0) {
    // 调用 queueMicrotask，触发服务层 growthbook此处需要的副作用。
    queueMicrotask(() => {
      // Re-check: listener may have been removed, or resetGrowthBook may have
      // cleared the Map, between registration and this microtask running.
      // 组合条件 `subscribed && remoteEvalFeatureValues.size > 0` 成立时，服务层 growthbook才启用这条专门路径。
      if (subscribed && remoteEvalFeatureValues.size > 0) {
        // 调用 callSafe，触发服务层 growthbook此处需要的副作用。
        callSafe(listener)
      }
    })
  }
  // 返回 `() => {`，作为服务层 growthbook这次计算的结果。
  return () => {
    // subscribed更新为 `false`，确保服务层后续读取最新状态。
    subscribed = false
    // 调用 unsubscribe，触发服务层 growthbook此处需要的副作用。
    unsubscribe()
  }
}

/**
 * Parse env var overrides for GrowthBook features.
 * Set CLAUDE_INTERNAL_FC_OVERRIDES to a JSON object mapping feature keys to values
 * to bypass remote eval and disk cache. Useful for eval harnesses that need to
 * test specific feature flag configurations. Only active when USER_TYPE is 'ant'.
 *
 * Example: CLAUDE_INTERNAL_FC_OVERRIDES='{"my_feature": true, "my_config": {"key": "val"}}'
 */
// envOverrides 集合初始化为空值，后续分支会在有数据时补齐。
let envOverrides: Record<string, unknown> | null = null
// envOverridesParsed标记服务层 growthbook是否启用对应路径。
let envOverridesParsed = false

// getEnvOverrides 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEnvOverrides(): Record<string, unknown> | null {
  // envOverridesParsed缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
  if (!envOverridesParsed) {
    // envOverridesParsed更新为 `true`，确保服务层后续读取最新状态。
    envOverridesParsed = true
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 原始文本 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const raw = process.env.CLAUDE_INTERNAL_FC_OVERRIDES
      // 满足 `raw` 时，服务层 growthbook执行该分支。
      if (raw) {
        // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
        try {
          // envOverrides 集合更新为 `JSON.parse(raw) as Record<string, unknown>`，确保服务层后续读取最新状态。
          envOverrides = JSON.parse(raw) as Record<string, unknown>
          // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `GrowthBook: Using env var overrides for ${Object.keys(envOverrides!).length} features: ${Object.keys(envOverrides!).join(', ')}`,
          )
        } catch {
          // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `GrowthBook: Failed to parse CLAUDE_INTERNAL_FC_OVERRIDES: ${raw}`,
            ),
          )
        }
      }
    }
  }
  // 返回 `envOverrides`，作为服务层 growthbook这次计算的结果。
  return envOverrides
}

/**
 * Check if a feature has an env-var override (CLAUDE_INTERNAL_FC_OVERRIDES).
 * When true, _CACHED_MAY_BE_STALE will return the override without touching
 * disk or network — callers can skip awaiting init for that feature.
 */
// hasGrowthBookEnvOverride 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasGrowthBookEnvOverride(feature: string): boolean {
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 返回 `overrides !== null && feature in overrides`，作为服务层 growthbook这次计算的结果。
  return overrides !== null && feature in overrides
}

/**
 * Local config overrides set via /config Gates tab (ant-only). Checked after
 * env-var overrides — env wins so eval harnesses remain deterministic. Unlike
 * getEnvOverrides this is not memoized: the user can change overrides at
 * runtime, and getGlobalConfig() is already memory-cached (pointer-chase)
 * until the next saveGlobalConfig() invalidates it.
 */
// getConfigOverrides 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfigOverrides(): Record<string, unknown> | undefined {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return undefined
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `getGlobalConfig().growthBookOverrides`，作为服务层 growthbook这次计算的结果。
    return getGlobalConfig().growthBookOverrides
  } catch {
    // getGlobalConfig() throws before configReadingAllowed is set (early
    // main.tsx startup path). Same degrade as the disk-cache fallback below.
    // 返回 `undefined`，作为服务层 growthbook这次计算的结果。
    return undefined
  }
}

/**
 * Enumerate all known GrowthBook features and their current resolved values
 * (not including overrides). In-memory payload first, disk cache fallback —
 * same priority as the getters. Used by the /config Gates tab.
 */
// getAllGrowthBookFeatures 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllGrowthBookFeatures(): Record<string, unknown> {
  // 满足 `remoteEvalFeatureValues.size > 0` 时，服务层 growthbook执行该分支。
  if (remoteEvalFeatureValues.size > 0) {
    // 返回 `Object.fromEntries(remoteEvalFeatureValues)`，作为服务层 growthbook这次计算的结果。
    return Object.fromEntries(remoteEvalFeatureValues)
  }
  // 返回 `getGlobalConfig().cachedGrowthBookFeatures ?? {}`，作为服务层 growthbook这次计算的结果。
  return getGlobalConfig().cachedGrowthBookFeatures ?? {}
}

// getGrowthBookConfigOverrides 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGrowthBookConfigOverrides(): Record<string, unknown> {
  // 返回 `getConfigOverrides() ?? {}`，作为服务层 growthbook这次计算的结果。
  return getConfigOverrides() ?? {}
}

/**
 * Set or clear a single config override. Pass undefined to clear.
 * Fires onGrowthBookRefresh listeners so systems that bake gate values into
 * long-lived objects (useMainLoopModel, useSkillsChange, etc.) rebuild —
 * otherwise overriding e.g. tengu_ant_model_override wouldn't actually
 * change the model until the next periodic refresh.
 */
// setGrowthBookConfigOverride 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setGrowthBookConfigOverride(
  feature: string,
  value: unknown,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // 调用 saveGlobalConfig，触发服务层 growthbook此处需要的副作用。
    saveGlobalConfig(c => {
      // current 命名 `c.growthBookOverrides ?? {}`，让后续代码直接表达这个值的用途。
      const current = c.growthBookOverrides ?? {}
      // 满足 `value === undefined` 时，服务层 growthbook执行该分支。
      if (value === undefined) {
        // 满足 `!(feature in current)` 时，服务层 growthbook执行该分支。
        if (!(feature in current)) return c
        // 从 `current` 解构 [feature]、其余 rest，减少服务层 growthbook对同一对象的重复访问。
        const { [feature]: _, ...rest } = current
        // Object.keys(rest)为空时立即返回或跳过，避免服务层 growthbook把空集合当成可处理内容。
        if (Object.keys(rest).length === 0) {
          // 从 `c` 解构 growthBookOverrides、其余 configWithout，减少服务层 growthbook对同一对象的重复访问。
          const { growthBookOverrides: __, ...configWithout } = c
          // 返回 `configWithout`，作为服务层 growthbook这次计算的结果。
          return configWithout
        }
        // 返回结构化结果，集中表达服务层 growthbook已经整理出的状态。
        return { ...c, growthBookOverrides: rest }
      }
      // 满足 `isEqual(current[feature], value)` 时，服务层 growthbook执行该分支。
      if (isEqual(current[feature], value)) return c
      // 返回结构化结果，集中表达服务层 growthbook已经整理出的状态。
      return { ...c, growthBookOverrides: { ...current, [feature]: value } }
    })
    // Subscribers do their own change detection (see onGrowthBookRefresh docs),
    // so firing on a no-op write is fine.
    // 调用 refreshed.emit，触发服务层 growthbook此处需要的副作用。
    refreshed.emit()
  } catch (e) {
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

// clearGrowthBookConfigOverrides 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearGrowthBookConfigOverrides(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // 调用 saveGlobalConfig，触发服务层 growthbook此处需要的副作用。
    saveGlobalConfig(c => {
      // 服务层 growthbook在这里进入条件判断，后续代码按实际状态分流。
      if (
        !c.growthBookOverrides ||
        Object.keys(c.growthBookOverrides).length === 0
      ) {
        // 返回 `c`，作为服务层 growthbook这次计算的结果。
        return c
      }
      // 从 `c` 解构 growthBookOverrides、其余 rest，减少服务层 growthbook对同一对象的重复访问。
      const { growthBookOverrides: _, ...rest } = c
      // 返回 `rest`，作为服务层 growthbook这次计算的结果。
      return rest
    })
    // 调用 refreshed.emit，触发服务层 growthbook此处需要的副作用。
    refreshed.emit()
  } catch (e) {
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

/**
 * Log experiment exposure for a feature if it has experiment data.
 * Deduplicates within a session - each feature is logged at most once.
 */
// logExposureForFeature 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logExposureForFeature(feature: string): void {
  // Skip if already logged this session (dedup)
  // 满足 `loggedExposures.has(feature)` 时，服务层 growthbook执行该分支。
  if (loggedExposures.has(feature)) {
    // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // expData读取`experimentDataByFeature.get`，供服务层 growthbook后续处理使用。
  const expData = experimentDataByFeature.get(feature)
  // 满足 `expData` 时，服务层 growthbook执行该分支。
  if (expData) {
    // 调用 loggedExposures.add，触发服务层 growthbook此处需要的副作用。
    loggedExposures.add(feature)
    // 调用 logGrowthBookExperimentTo1P，触发服务层 growthbook此处需要的副作用。
    logGrowthBookExperimentTo1P({
      experimentId: expData.experimentId,
      variationId: expData.variationId,
      userAttributes: getUserAttributes(),
      experimentMetadata: {
        feature_id: feature,
      },
    })
  }
}

/**
 * Process a remote eval payload from the GrowthBook server and populate
 * local caches. Called after both initial client.init() and after
 * client.refreshFeatures() so that _BLOCKS_ON_INIT callers see fresh values
 * across the process lifetime, not just init-time snapshots.
 *
 * Without this running on refresh, remoteEvalFeatureValues freezes at its
 * init-time snapshot and getDynamicConfig_BLOCKS_ON_INIT returns stale values
 * for the entire process lifetime — which broke the tengu_max_version_config
 * kill switch for long-running sessions.
 */
// processRemoteEvalPayload 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processRemoteEvalPayload(
  gbClient: GrowthBook,
): Promise<boolean> {
  // WORKAROUND: Transform remote eval response format
  // The API returns { "value": ... } but SDK expects { "defaultValue": ... }
  // TODO: Remove this once the API is fixed to return correct format
  // payload读取`gbClient.getPayload`，供服务层 growthbook后续处理使用。
  const payload = gbClient.getPayload()
  // Empty object is truthy — without the length check, `{features: {}}`
  // (transient server bug, truncated response) would pass, clear the maps
  // below, return true, and syncRemoteEvalToDisk would wholesale-write `{}`
  // to disk: total flag blackout for every process sharing ~/.claude.json.
  // !payload?.features || Object.ke...为空时立即返回或跳过，避免服务层 growthbook把空集合当成可处理内容。
  if (!payload?.features || Object.keys(payload.features).length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Clear before rebuild so features removed between refreshes don't
  // leave stale ghost entries that short-circuit getFeatureValueInternal.
  // 调用 experimentDataByFeature.clear，触发服务层 growthbook此处需要的副作用。
  experimentDataByFeature.clear()

  // transformedFeatures 集合 从空对象开始收集键值，后续按名称补齐内容。
  const transformedFeatures: Record<string, MalformedFeatureDefinition> = {}
  // 循环处理 `const [key, feature] of Object.entries(payload.features)`，让服务层 growthbook把同类条目按顺序走完。
  for (const [key, feature] of Object.entries(payload.features)) {
    // f 通过懒加载取得，避免服务层 growthbook在启动阶段加载暂时用不到的实现。
    const f = feature as MalformedFeatureDefinition
    // 组合条件 `'value' in f && !('defaultValue' in f)` 成立时，服务层 growthbook才启用这条专门路径。
    if ('value' in f && !('defaultValue' in f)) {
      // transformedFeatures[key更新为 `{`，确保服务层 growthbook后续读取最新状态。
      transformedFeatures[key] = {
        ...f,
        defaultValue: f.value,
      }
    } else {
      // transformedFeatures[key更新为 `f`，确保服务层 growthbook后续读取最新状态。
      transformedFeatures[key] = f
    }

    // Store experiment data for later logging when feature is accessed
    // 组合条件 `f.source === 'experiment' && f.experimentResult` 成立时，服务层 growthbook才启用这条专门路径。
    if (f.source === 'experiment' && f.experimentResult) {
      // expResult保存`f.experimentResult as {`，供后续判断或组装使用。
      const expResult = f.experimentResult as {
        variationId?: number
      }
      // exp 命名 `f.experiment as { key?: string } | undefined`，让后续代码直接表达这个值的用途。
      const exp = f.experiment as { key?: string } | undefined
      // `exp?.key && expResult.variationId` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (exp?.key && expResult.variationId !== undefined) {
        // experimentDataByFeature.set 写入新的状态值，使服务层 growthbook后续读取保持一致。
        experimentDataByFeature.set(key, {
          experimentId: exp.key,
          variationId: expResult.variationId,
        })
      }
    }
  }
  // Re-set the payload with transformed features
  // 等待 `gbClient.setPayload({` 完成，再继续服务层 growthbook的异步流程。
  await gbClient.setPayload({
    ...payload,
    features: transformedFeatures,
  })

  // WORKAROUND: Cache the evaluated values directly from remote eval response.
  // The SDK's evalFeature() tries to re-evaluate rules locally, ignoring the
  // pre-evaluated 'value' from remoteEval. setForcedFeatures also doesn't work
  // reliably. So we cache values ourselves and use them in getFeatureValueInternal.
  // 调用 remoteEvalFeatureValues.clear，触发服务层 growthbook此处需要的副作用。
  remoteEvalFeatureValues.clear()
  // 循环处理 `const [key, feature] of Object.entries(transformedFeatures)`，让服务层 growthbook把同类条目按顺序走完。
  for (const [key, feature] of Object.entries(transformedFeatures)) {
    // Under remoteEval:true the server pre-evaluates. Whether the answer
    // lands in `value` (current API) or `defaultValue` (post-TODO API shape),
    // it's the authoritative value for this user. Guarding on both keeps
    // syncRemoteEvalToDisk correct across a partial or full API migration.
    // v 命名 `'value' in feature ? feature.value : feature.defaultValue`，让后续代码直接表达这个值的用途。
    const v = 'value' in feature ? feature.value : feature.defaultValue
    // `v` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (v !== undefined) {
      // remoteEvalFeatureValues.set 写入新的状态值，使服务层 growthbook后续读取保持一致。
      remoteEvalFeatureValues.set(key, v)
    }
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Write the complete remoteEvalFeatureValues map to disk. Called exactly
 * once per successful processRemoteEvalPayload — never from a failure path,
 * so init-timeout poisoning is structurally impossible (the .catch() at init
 * never reaches here).
 *
 * Wholesale replace (not merge): features deleted server-side are dropped
 * from disk on the next successful payload. Ant builds ⊇ external, so
 * switching builds is safe — the write is always a complete answer for this
 * process's SDK key.
 */
// syncRemoteEvalToDisk 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function syncRemoteEvalToDisk(): void {
  // fresh保存`Object.fromEntries`，供服务层 growthbook后续处理使用。
  const fresh = Object.fromEntries(remoteEvalFeatureValues)
  // 配置读取`getGlobalConfig`，供服务层 growthbook后续处理使用。
  const config = getGlobalConfig()
  // 满足 `isEqual(config.cachedGrowthBookFeatures, fresh)` 时，服务层 growthbook执行该分支。
  if (isEqual(config.cachedGrowthBookFeatures, fresh)) {
    // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 调用 saveGlobalConfig，触发服务层 growthbook此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    cachedGrowthBookFeatures: fresh,
  }))
}

/**
 * Check if GrowthBook operations should be enabled
 */
// isGrowthBookEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isGrowthBookEnabled(): boolean {
  // GrowthBook depends on 1P event logging.
  // 返回 `is1PEventLoggingEnabled()`，作为服务层 growthbook这次计算的结果。
  return is1PEventLoggingEnabled()
}

/**
 * Hostname of ANTHROPIC_BASE_URL when it points at a non-Anthropic proxy.
 *
 * Enterprise-proxy deployments (Epic, Marble, etc.) typically use
 * apiKeyHelper auth, which means isAnthropicAuthEnabled() returns false and
 * organizationUUID/accountUUID/email are all absent from GrowthBook
 * attributes. Without this, there's no stable attribute to target them on
 * — only per-device IDs. See src/utils/auth.ts isAnthropicAuthEnabled().
 *
 * Returns undefined for unset/default (api.anthropic.com) so the attribute
 * is absent for direct-API users. Hostname only — no path/query/creds.
 */
// getApiBaseUrlHost 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiBaseUrlHost(): string | undefined {
  // baseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  // baseUrl缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
  if (!baseUrl) return undefined
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // host保存`URL`，供服务层 growthbook后续处理使用。
    const host = new URL(baseUrl).host
    // 当 `host` 匹配 `'api.anthropic.com'` 时，服务层 growthbook执行对应分支。
    if (host === 'api.anthropic.com') return undefined
    // 返回 `host`，作为服务层 growthbook这次计算的结果。
    return host
  } catch {
    // 返回 `undefined`，作为服务层 growthbook这次计算的结果。
    return undefined
  }
}

/**
 * Get user attributes for GrowthBook from CoreUserData
 */
// getUserAttributes 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUserAttributes(): GrowthBookUserAttributes {
  // user读取`getUserForGrowthBook`，供服务层 growthbook后续处理使用。
  const user = getUserForGrowthBook()

  // For ants, always try to include email from OAuth config even if ANTHROPIC_API_KEY is set.
  // This ensures GrowthBook targeting by email works regardless of auth method.
  // email保存`user.email`，供服务层 growthbook后续判断或输出使用。
  let email = user.email
  // 当 `!email && process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
  if (!email && process.env.USER_TYPE === 'ant') {
    // email更新为 `getGlobalConfig().oauthAccount?.emailAddress`，确保服务层后续读取最新状态。
    email = getGlobalConfig().oauthAccount?.emailAddress
  }

  // apiBaseUrlHost读取`getApiBaseUrlHost`，供服务层 growthbook后续处理使用。
  const apiBaseUrlHost = getApiBaseUrlHost()

  // attributes 集合 集中保存服务层 growthbook要一起传递的字段。
  const attributes = {
    id: user.deviceId,
    sessionId: user.sessionId,
    deviceID: user.deviceId,
    platform: user.platform,
    ...(apiBaseUrlHost && { apiBaseUrlHost }),
    ...(user.organizationUuid && { organizationUUID: user.organizationUuid }),
    ...(user.accountUuid && { accountUUID: user.accountUuid }),
    ...(user.userType && { userType: user.userType }),
    ...(user.subscriptionType && { subscriptionType: user.subscriptionType }),
    ...(user.rateLimitTier && { rateLimitTier: user.rateLimitTier }),
    ...(user.firstTokenTime && { firstTokenTime: user.firstTokenTime }),
    ...(email && { email }),
    ...(user.appVersion && { appVersion: user.appVersion }),
    ...(user.githubActionsMetadata && {
      githubActionsMetadata: user.githubActionsMetadata,
    }),
  }
  // 返回 `attributes`，作为服务层 growthbook这次计算的结果。
  return attributes
}

/**
 * Get or create the GrowthBook client instance
 */
// getGrowthBookClient保存`memoize`，供服务层 growthbook后续处理使用。
const getGrowthBookClient = memoize(
  (): { client: GrowthBook; initialized: Promise<void> } | null => {
    // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
    if (!isGrowthBookEnabled()) {
      // 返回 `null`，作为服务层 growthbook这次计算的结果。
      return null
    }

    // attributes 集合读取`getUserAttributes`，供服务层 growthbook后续处理使用。
    const attributes = getUserAttributes()
    // clientKey读取`getGrowthBookClientKey`，供服务层 growthbook后续处理使用。
    const clientKey = getGrowthBookClientKey()
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `GrowthBook: Creating client with clientKey=${clientKey}, attributes: ${jsonStringify(attributes)}`,
      )
    }
    // baseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baseUrl =
      process.env.USER_TYPE === 'ant'
        ? process.env.CLAUDE_CODE_GB_BASE_URL || 'https://api.anthropic.com/'
        : 'https://api.anthropic.com/'

    // Skip auth if trust hasn't been established yet
    // This prevents executing apiKeyHelper commands before the trust dialog
    // Non-interactive sessions implicitly have workspace trust
    // getSessionTrustAccepted() covers the case where the TrustDialog auto-resolved
    // without persisting trust for the specific CWD (e.g., home directory) —
    // showSetupScreens() sets this after the trust dialog flow completes.
    // hasTrust 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasTrust =
      checkHasTrustDialogAccepted() ||
      getSessionTrustAccepted() ||
      getIsNonInteractiveSession()
    // authHeaders 集合保存`hasTrust`，供后续判断或组装使用。
    const authHeaders = hasTrust
      ? getAuthHeaders()
      : { headers: {}, error: 'trust not established' }
    // hasAuth标记服务层 growthbook是否启用对应路径。
    const hasAuth = !authHeaders.error
    // clientCreatedWithAuth更新为 `hasAuth`，确保服务层后续读取最新状态。
    clientCreatedWithAuth = hasAuth

    // Capture in local variable so the init callback operates on THIS client,
    // not a later client if reinitialization happens before init completes
    // thisClient保存`GrowthBook`，供服务层 growthbook后续处理使用。
    const thisClient = new GrowthBook({
      apiHost: baseUrl,
      clientKey,
      attributes,
      remoteEval: true,
      // Re-fetch when user ID or org changes (org change = login to different org)
      cacheKeyAttributes: ['id', 'organizationUUID'],
      // Add auth headers if available
      ...(authHeaders.error
        ? {}
        : { apiHostRequestHeaders: authHeaders.headers }),
      // Debug logging for Ants
      ...(process.env.USER_TYPE === 'ant'
        ? {
            // 这个回调绑定到 log: (msg: string, ctx: Record<string, unknown>) => {，负责服务层 growthbook在该局部场景下的响应。
            log: (msg: string, ctx: Record<string, unknown>) => {
              // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`GrowthBook: ${msg} ${jsonStringify(ctx)}`)
            },
          }
        : {}),
    })
    // API 客户端更新为 `thisClient`，确保服务层后续读取最新状态。
    client = thisClient

    // hasAuth缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
    if (!hasAuth) {
      // No auth available yet — skip HTTP init, rely on disk-cached values.
      // initializeGrowthBook() will reset and re-create with auth when available.
      // 返回结构化结果，集中表达服务层 growthbook已经整理出的状态。
      return { client: thisClient, initialized: Promise.resolve() }
    }

    // initialized保存`thisClient`，供服务层 growthbook后续判断或输出使用。
    const initialized = thisClient
      .init({ timeout: 5000 })
      // 链式调用 then，继续加工上一行在服务层 growthbook中产生的数据。
      .then(async result => {
        // Guard: if this client was replaced by a newer one, skip processing
        // `client` 与 `thisClient` 不一致时刷新派生状态，避免使用过期结果。
        if (client !== thisClient) {
          // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
          if (process.env.USER_TYPE === 'ant') {
            // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              'GrowthBook: Skipping init callback for replaced client',
            )
          }
          // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `GrowthBook initialized successfully, source: ${result.source}, success: ${result.success}`,
          )
        }

        // hadFeatures 集合读取`processRemoteEvalPayload`，供服务层 growthbook后续处理使用。
        const hadFeatures = await processRemoteEvalPayload(thisClient)
        // Re-check: processRemoteEvalPayload yields at `await setPayload`.
        // Microtask-only today (no encryption, no sticky-bucket service), but
        // the guard at the top of this callback runs before that await;
        // this runs after.
        // `client` 与 `thisClient` 不一致时刷新派生状态，避免使用过期结果。
        if (client !== thisClient) return

        // 满足 `hadFeatures` 时，服务层 growthbook执行该分支。
        if (hadFeatures) {
          // 按顺序遍历 `pendingExposures` 中的feature，逐个交给服务层 growthbook处理。
          for (const feature of pendingExposures) {
            // 调用 logExposureForFeature，触发服务层 growthbook此处需要的副作用。
            logExposureForFeature(feature)
          }
          // 调用 pendingExposures.clear，触发服务层 growthbook此处需要的副作用。
          pendingExposures.clear()
          // 调用 syncRemoteEvalToDisk，触发服务层 growthbook此处需要的副作用。
          syncRemoteEvalToDisk()
          // Notify subscribers: remoteEvalFeatureValues is populated and
          // disk is freshly synced. _CACHED_MAY_BE_STALE reads memory first
          // (#22295), so subscribers see fresh values immediately.
          // 调用 refreshed.emit，触发服务层 growthbook此处需要的副作用。
          refreshed.emit()
        }

        // Log what features were loaded
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // features 集合读取`thisClient.getFeatures`，供服务层 growthbook后续处理使用。
          const features = thisClient.getFeatures()
          // 满足 `features` 时，服务层 growthbook执行该分支。
          if (features) {
            // featureKeys 集合派生`Object.keys`，供服务层 growthbook后续处理使用。
            const featureKeys = Object.keys(features)
            // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `GrowthBook loaded ${featureKeys.length} features: ${featureKeys.slice(0, 10).join(', ')}${featureKeys.length > 10 ? '...' : ''}`,
            )
          }
        }
      })
      // 链式调用 catch，继续加工上一行在服务层 growthbook中产生的数据。
      .catch(error => {
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
          logError(toError(error))
        }
      })

    // Register cleanup handlers for graceful shutdown (named refs so resetGrowthBook can remove them)
    // currentBeforeExitHandler更新为 `() => client?.destroy()`，确保服务层后续读取最新状态。
    currentBeforeExitHandler = () => client?.destroy()
    // currentExitHandler更新为 `() => client?.destroy()`，确保服务层后续读取最新状态。
    currentExitHandler = () => client?.destroy()
    // 调用 process.on，触发服务层 growthbook此处需要的副作用。
    process.on('beforeExit', currentBeforeExitHandler)
    // 调用 process.on，触发服务层 growthbook此处需要的副作用。
    process.on('exit', currentExitHandler)

    // 返回结构化结果，集中表达服务层 growthbook已经整理出的状态。
    return { client: thisClient, initialized }
  },
)

/**
 * Initialize GrowthBook client (blocks until ready)
 */
// initializeGrowthBook保存`memoize`，供服务层 growthbook后续处理使用。
export const initializeGrowthBook = memoize(
  async (): Promise<GrowthBook | null> => {
    // clientWrapper读取`getGrowthBookClient`，供服务层 growthbook后续处理使用。
    let clientWrapper = getGrowthBookClient()
    // clientWrapper缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
    if (!clientWrapper) {
      // 返回 `null`，作为服务层 growthbook这次计算的结果。
      return null
    }

    // Check if auth has become available since the client was created
    // If so, we need to recreate the client with fresh auth headers
    // Only check if trust is established to avoid triggering apiKeyHelper before trust dialog
    // clientCreatedWithAuth缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
    if (!clientCreatedWithAuth) {
      // hasTrust 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const hasTrust =
        checkHasTrustDialogAccepted() ||
        getSessionTrustAccepted() ||
        getIsNonInteractiveSession()
      // 满足 `hasTrust` 时，服务层 growthbook执行该分支。
      if (hasTrust) {
        // currentAuth读取`getAuthHeaders`，供服务层 growthbook后续处理使用。
        const currentAuth = getAuthHeaders()
        // currentAuth.error 错误信息缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
        if (!currentAuth.error) {
          // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
          if (process.env.USER_TYPE === 'ant') {
            // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              'GrowthBook: Auth became available after client creation, reinitializing',
            )
          }
          // Use resetGrowthBook to properly destroy old client and stop periodic refresh
          // This prevents double-init where old client's init promise continues running
          // 调用 resetGrowthBook，触发服务层 growthbook此处需要的副作用。
          resetGrowthBook()
          // clientWrapper更新为 `getGrowthBookClient()`，确保服务层后续读取最新状态。
          clientWrapper = getGrowthBookClient()
          // clientWrapper缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
          if (!clientWrapper) {
            // 返回 `null`，作为服务层 growthbook这次计算的结果。
            return null
          }
        }
      }
    }

    // 等待 `clientWrapper.initialized` 完成，再继续服务层 growthbook的异步流程。
    await clientWrapper.initialized

    // Set up periodic refresh after successful initialization
    // This is called here (not separately) so it's always re-established after any reinit
    // 调用 setupPeriodicGrowthBookRefresh，触发服务层 growthbook此处需要的副作用。
    setupPeriodicGrowthBookRefresh()

    // 返回 `clientWrapper.client`，作为服务层 growthbook这次计算的结果。
    return clientWrapper.client
  },
)

/**
 * Get a feature value with a default fallback - blocks until initialized.
 * @internal Used by both deprecated and cached functions.
 */
// getFeatureValueInternal 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getFeatureValueInternal<T>(
  feature: string,
  defaultValue: T,
  logExposure: boolean,
): Promise<T> {
  // Check env var overrides first (for eval harnesses)
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 组合条件 `overrides && feature in overrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (overrides && feature in overrides) {
    // 返回 `overrides[feature] as T`，作为服务层 growthbook这次计算的结果。
    return overrides[feature] as T
  }
  // configOverrides 配置读取`getConfigOverrides`，供服务层 growthbook后续处理使用。
  const configOverrides = getConfigOverrides()
  // 组合条件 `configOverrides && feature in configOverrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (configOverrides && feature in configOverrides) {
    // 返回 `configOverrides[feature] as T`，作为服务层 growthbook这次计算的结果。
    return configOverrides[feature] as T
  }

  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 返回 `defaultValue`，作为服务层 growthbook这次计算的结果。
    return defaultValue
  }

  // growthBookClient保存`initializeGrowthBook`，供服务层 growthbook后续处理使用。
  const growthBookClient = await initializeGrowthBook()
  // growthBookClient缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
  if (!growthBookClient) {
    // 返回 `defaultValue`，作为服务层 growthbook这次计算的结果。
    return defaultValue
  }

  // Use cached remote eval values if available (workaround for SDK bug)
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result: T
  // 满足 `remoteEvalFeatureValues.has(feature)` 时，服务层 growthbook执行该分支。
  if (remoteEvalFeatureValues.has(feature)) {
    // 结果更新为 `remoteEvalFeatureValues.get(feature) as T`，确保服务层后续读取最新状态。
    result = remoteEvalFeatureValues.get(feature) as T
  } else {
    // 结果更新为 `growthBookClient.getFeatureValue(feature, defaultValue) a...`，确保服务层后续读取最新状态。
    result = growthBookClient.getFeatureValue(feature, defaultValue) as T
  }

  // Log experiment exposure using stored experiment data
  // 满足 `logExposure` 时，服务层 growthbook执行该分支。
  if (logExposure) {
    // 调用 logExposureForFeature，触发服务层 growthbook此处需要的副作用。
    logExposureForFeature(feature)
  }

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `GrowthBook: getFeatureValue("${feature}") = ${jsonStringify(result)}`,
    )
  }
  // 返回 `result`，作为服务层 growthbook这次计算的结果。
  return result
}

/**
 * @deprecated Use getFeatureValue_CACHED_MAY_BE_STALE instead, which is non-blocking.
 * This function blocks on GrowthBook initialization which can slow down startup.
 */
// getFeatureValue_DEPRECATED 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getFeatureValue_DEPRECATED<T>(
  feature: string,
  defaultValue: T,
): Promise<T> {
  // 返回 `getFeatureValueInternal(feature, defaultValue, true)`，作为服务层 growthbook这次计算的结果。
  return getFeatureValueInternal(feature, defaultValue, true)
}

/**
 * Get a feature value from disk cache immediately. Pure read — disk is
 * populated by syncRemoteEvalToDisk on every successful payload (init +
 * periodic refresh), not by this function.
 *
 * This is the preferred method for startup-critical paths and sync contexts.
 * The value may be stale if the cache was written by a previous process.
 */
// getFeatureValue_CACHED_MAY_BE_STALE 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(
  feature: string,
  defaultValue: T,
): T {
  // Check env var overrides first (for eval harnesses)
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 组合条件 `overrides && feature in overrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (overrides && feature in overrides) {
    // 返回 `overrides[feature] as T`，作为服务层 growthbook这次计算的结果。
    return overrides[feature] as T
  }
  // configOverrides 配置读取`getConfigOverrides`，供服务层 growthbook后续处理使用。
  const configOverrides = getConfigOverrides()
  // 组合条件 `configOverrides && feature in configOverrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (configOverrides && feature in configOverrides) {
    // 返回 `configOverrides[feature] as T`，作为服务层 growthbook这次计算的结果。
    return configOverrides[feature] as T
  }

  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 返回 `defaultValue`，作为服务层 growthbook这次计算的结果。
    return defaultValue
  }

  // Log experiment exposure if data is available, otherwise defer until after init
  // 满足 `experimentDataByFeature.has(feature)` 时，服务层 growthbook执行该分支。
  if (experimentDataByFeature.has(feature)) {
    // 调用 logExposureForFeature，触发服务层 growthbook此处需要的副作用。
    logExposureForFeature(feature)
  } else {
    // 调用 pendingExposures.add，触发服务层 growthbook此处需要的副作用。
    pendingExposures.add(feature)
  }

  // In-memory payload is authoritative once processRemoteEvalPayload has run.
  // Disk is also fresh by then (syncRemoteEvalToDisk runs synchronously inside
  // init), so this is correctness-equivalent to the disk read below — but it
  // skips the config JSON parse and is what onGrowthBookRefresh subscribers
  // depend on to read fresh values the instant they're notified.
  // 满足 `remoteEvalFeatureValues.has(feature)` 时，服务层 growthbook执行该分支。
  if (remoteEvalFeatureValues.has(feature)) {
    // 返回 `remoteEvalFeatureValues.get(feature) as T`，作为服务层 growthbook这次计算的结果。
    return remoteEvalFeatureValues.get(feature) as T
  }

  // Fall back to disk cache (survives across process restarts)
  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // cached 缓存读取`getGlobalConfig`，供服务层 growthbook后续处理使用。
    const cached = getGlobalConfig().cachedGrowthBookFeatures?.[feature]
    // 返回 `cached !== undefined ? (cached as T) : defaultValue`，作为服务层 growthbook这次计算的结果。
    return cached !== undefined ? (cached as T) : defaultValue
  } catch {
    // 返回 `defaultValue`，作为服务层 growthbook这次计算的结果。
    return defaultValue
  }
}

/**
 * @deprecated Disk cache is now synced on every successful payload load
 * (init + 20min/6h periodic refresh). The per-feature TTL never fetched
 * fresh data from the server — it only re-wrote in-memory state to disk,
 * which is now redundant. Use getFeatureValue_CACHED_MAY_BE_STALE directly.
 */
// getFeatureValue_CACHED_WITH_REFRESH 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFeatureValue_CACHED_WITH_REFRESH<T>(
  feature: string,
  defaultValue: T,
  _refreshIntervalMs: number,
): T {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(feature, defaultValue)`，作为服务层 growthbook这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(feature, defaultValue)
}

/**
 * Check a Statsig feature gate value via GrowthBook, with fallback to Statsig cache.
 *
 * **MIGRATION ONLY**: This function is for migrating existing Statsig gates to GrowthBook.
 * For new features, use `getFeatureValue_CACHED_MAY_BE_STALE()` instead.
 *
 * - Checks GrowthBook disk cache first
 * - Falls back to Statsig's cachedStatsigGates during migration
 * - The value may be stale if the cache hasn't been updated recently
 *
 * @deprecated Use getFeatureValue_CACHED_MAY_BE_STALE() for new code. This function
 * exists only to support migration of existing Statsig gates.
 */
// checkStatsigFeatureGate_CACHED_MAY_BE_STALE 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
  gate: string,
): boolean {
  // Check env var overrides first (for eval harnesses)
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 组合条件 `overrides && gate in overrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (overrides && gate in overrides) {
    // 返回 `Boolean(overrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(overrides[gate])
  }
  // configOverrides 配置读取`getConfigOverrides`，供服务层 growthbook后续处理使用。
  const configOverrides = getConfigOverrides()
  // 组合条件 `configOverrides && gate in configOverrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (configOverrides && gate in configOverrides) {
    // 返回 `Boolean(configOverrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(configOverrides[gate])
  }

  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Log experiment exposure if data is available, otherwise defer until after init
  // 满足 `experimentDataByFeature.has(gate)` 时，服务层 growthbook执行该分支。
  if (experimentDataByFeature.has(gate)) {
    // 调用 logExposureForFeature，触发服务层 growthbook此处需要的副作用。
    logExposureForFeature(gate)
  } else {
    // 调用 pendingExposures.add，触发服务层 growthbook此处需要的副作用。
    pendingExposures.add(gate)
  }

  // Return cached value immediately from disk
  // First check GrowthBook cache, then fall back to Statsig cache for migration
  // 配置读取`getGlobalConfig`，供服务层 growthbook后续处理使用。
  const config = getGlobalConfig()
  // gbCached 缓存 命名 `config.cachedGrowthBookFeatures?.[gate]`，让后续代码直接表达这个值的用途。
  const gbCached = config.cachedGrowthBookFeatures?.[gate]
  // `gbCached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (gbCached !== undefined) {
    // 返回 `Boolean(gbCached)`，作为服务层 growthbook这次计算的结果。
    return Boolean(gbCached)
  }
  // Fallback to Statsig cache for migration period
  // 返回 `config.cachedStatsigGates?.[gate] ?? false`，作为服务层 growthbook这次计算的结果。
  return config.cachedStatsigGates?.[gate] ?? false
}

/**
 * Check a security restriction gate, waiting for re-init if in progress.
 *
 * Use this for security-critical gates where we need fresh values after auth changes.
 *
 * Behavior:
 * - If GrowthBook is re-initializing (e.g., after login), waits for it to complete
 * - Otherwise, returns cached value immediately (Statsig cache first, then GrowthBook)
 *
 * Statsig cache is checked first as a safety measure for security-related checks:
 * if the Statsig cache indicates the gate is enabled, we honor it.
 */
// checkSecurityRestrictionGate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkSecurityRestrictionGate(
  gate: string,
): Promise<boolean> {
  // Check env var overrides first (for eval harnesses)
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 组合条件 `overrides && gate in overrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (overrides && gate in overrides) {
    // 返回 `Boolean(overrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(overrides[gate])
  }
  // configOverrides 配置读取`getConfigOverrides`，供服务层 growthbook后续处理使用。
  const configOverrides = getConfigOverrides()
  // 组合条件 `configOverrides && gate in configOverrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (configOverrides && gate in configOverrides) {
    // 返回 `Boolean(configOverrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(configOverrides[gate])
  }

  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // If re-initialization is in progress, wait for it to complete
  // This ensures we get fresh values after auth changes
  // 满足 `reinitializingPromise` 时，服务层 growthbook执行该分支。
  if (reinitializingPromise) {
    // 等待 `reinitializingPromise` 完成，再继续服务层 growthbook的异步流程。
    await reinitializingPromise
  }

  // Check Statsig cache first - it may have correct value from previous logged-in session
  // 配置读取`getGlobalConfig`，供服务层 growthbook后续处理使用。
  const config = getGlobalConfig()
  // statsigCached 缓存保存`config.cachedStatsigGates?.[gate]`，供服务层 growthbook后续判断或输出使用。
  const statsigCached = config.cachedStatsigGates?.[gate]
  // `statsigCached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (statsigCached !== undefined) {
    // 返回 `Boolean(statsigCached)`，作为服务层 growthbook这次计算的结果。
    return Boolean(statsigCached)
  }

  // Then check GrowthBook cache
  // gbCached 缓存 命名 `config.cachedGrowthBookFeatures?.[gate]`，让后续代码直接表达这个值的用途。
  const gbCached = config.cachedGrowthBookFeatures?.[gate]
  // `gbCached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (gbCached !== undefined) {
    // 返回 `Boolean(gbCached)`，作为服务层 growthbook这次计算的结果。
    return Boolean(gbCached)
  }

  // No cache - return false (don't block on init for uncached gates)
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check a boolean entitlement gate with fallback-to-blocking semantics.
 *
 * Fast path: if the disk cache already says `true`, return it immediately.
 * Slow path: if disk says `false`/missing, await GrowthBook init and fetch the
 * fresh server value (max ~5s). Disk is populated by syncRemoteEvalToDisk
 * inside init, so by the time the slow path returns, disk already has the
 * fresh value — no write needed here.
 *
 * Use for user-invoked features (e.g. /remote-control) that are gated on
 * subscription/org, where a stale `false` would unfairly block access but a
 * stale `true` is acceptable (the server is the real gatekeeper).
 */
// checkGate_CACHED_OR_BLOCKING 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGate_CACHED_OR_BLOCKING(
  gate: string,
): Promise<boolean> {
  // Check env var overrides first (for eval harnesses)
  // overrides 集合读取`getEnvOverrides`，供服务层 growthbook后续处理使用。
  const overrides = getEnvOverrides()
  // 组合条件 `overrides && gate in overrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (overrides && gate in overrides) {
    // 返回 `Boolean(overrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(overrides[gate])
  }
  // configOverrides 配置读取`getConfigOverrides`，供服务层 growthbook后续处理使用。
  const configOverrides = getConfigOverrides()
  // 组合条件 `configOverrides && gate in configOverrides` 成立时，服务层 growthbook才启用这条专门路径。
  if (configOverrides && gate in configOverrides) {
    // 返回 `Boolean(configOverrides[gate])`，作为服务层 growthbook这次计算的结果。
    return Boolean(configOverrides[gate])
  }

  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Fast path: disk cache already says true — trust it
  // cached 缓存读取`getGlobalConfig`，供服务层 growthbook后续处理使用。
  const cached = getGlobalConfig().cachedGrowthBookFeatures?.[gate]
  // 满足 `cached === true` 时，服务层 growthbook执行该分支。
  if (cached === true) {
    // Log experiment exposure if data is available, otherwise defer
    // 满足 `experimentDataByFeature.has(gate)` 时，服务层 growthbook执行该分支。
    if (experimentDataByFeature.has(gate)) {
      // 调用 logExposureForFeature，触发服务层 growthbook此处需要的副作用。
      logExposureForFeature(gate)
    } else {
      // 调用 pendingExposures.add，触发服务层 growthbook此处需要的副作用。
      pendingExposures.add(gate)
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Slow path: disk says false/missing — may be stale, fetch fresh
  // 返回 `getFeatureValueInternal(gate, false, true)`，作为服务层 growthbook这次计算的结果。
  return getFeatureValueInternal(gate, false, true)
}

/**
 * Refresh GrowthBook after auth changes (login/logout).
 *
 * NOTE: This must destroy and recreate the client because GrowthBook's
 * apiHostRequestHeaders cannot be updated after client creation.
 */
// refreshGrowthBookAfterAuthChange 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function refreshGrowthBookAfterAuthChange(): void {
  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // Reset the client completely to get fresh auth headers
    // This is necessary because apiHostRequestHeaders can't be updated after creation
    // 调用 resetGrowthBook，触发服务层 growthbook此处需要的副作用。
    resetGrowthBook()

    // resetGrowthBook cleared remoteEvalFeatureValues. If re-init below
    // times out (hadFeatures=false) or short-circuits on !hasAuth (logout),
    // the init-callback notify never fires — subscribers stay synced to the
    // previous account's memoized state. Notify here so they re-read now
    // (falls to disk cache). If re-init succeeds, they'll notify again with
    // fresh values; if not, at least they're synced to the post-reset state.
    // 调用 refreshed.emit，触发服务层 growthbook此处需要的副作用。
    refreshed.emit()

    // Reinitialize with fresh auth headers and attributes
    // Track this promise so security gate checks can wait for it.
    // .catch before .finally: initializeGrowthBook can reject if its sync
    // helpers throw (getGrowthBookClient, getAuthHeaders, resetGrowthBook —
    // clientWrapper.initialized itself has its own .catch so never rejects),
    // and .finally re-settles with the original rejection — the sync
    // try/catch below cannot catch async rejections.
    // reinitializingPromise 异步任务更新为 `initializeGrowthBook()`，确保服务层后续读取最新状态。
    reinitializingPromise = initializeGrowthBook()
      // 链式调用 catch，继续加工上一行在服务层 growthbook中产生的数据。
      .catch(error => {
        // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
        logError(toError(error))
        // 返回 `null`，作为服务层 growthbook这次计算的结果。
        return null
      })
      // 链式调用 finally，继续加工上一行在服务层 growthbook中产生的数据。
      .finally(() => {
        // reinitializingPromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
        reinitializingPromise = null
      })
  } catch (error) {
    // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，服务层 growthbook执行对应分支。
    if (process.env.NODE_ENV === 'development') {
      // 抛出 error，阻止服务层 growthbook在无效状态下继续运行。
      throw error
    }
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
  }
}

/**
 * Reset GrowthBook client state (primarily for testing)
 */
// resetGrowthBook 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetGrowthBook(): void {
  // 调用 stopPeriodicGrowthBookRefresh，触发服务层 growthbook此处需要的副作用。
  stopPeriodicGrowthBookRefresh()
  // Remove process handlers before destroying client to prevent accumulation
  // 满足 `currentBeforeExitHandler` 时，服务层 growthbook执行该分支。
  if (currentBeforeExitHandler) {
    // 调用 process.off，触发服务层 growthbook此处需要的副作用。
    process.off('beforeExit', currentBeforeExitHandler)
    // currentBeforeExitHandler更新为 `null`，确保服务层后续读取最新状态。
    currentBeforeExitHandler = null
  }
  // 满足 `currentExitHandler` 时，服务层 growthbook执行该分支。
  if (currentExitHandler) {
    // 调用 process.off，触发服务层 growthbook此处需要的副作用。
    process.off('exit', currentExitHandler)
    // currentExitHandler更新为 `null`，确保服务层后续读取最新状态。
    currentExitHandler = null
  }
  // 调用 client?.destroy()，完成这一处局部操作。
  client?.destroy()
  // API 客户端更新为 `null`，确保服务层后续读取最新状态。
  client = null
  // clientCreatedWithAuth更新为 `false`，确保服务层后续读取最新状态。
  clientCreatedWithAuth = false
  // reinitializingPromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  reinitializingPromise = null
  // 调用 experimentDataByFeature.clear，触发服务层 growthbook此处需要的副作用。
  experimentDataByFeature.clear()
  // 调用 pendingExposures.clear，触发服务层 growthbook此处需要的副作用。
  pendingExposures.clear()
  // 调用 loggedExposures.clear，触发服务层 growthbook此处需要的副作用。
  loggedExposures.clear()
  // 调用 remoteEvalFeatureValues.clear，触发服务层 growthbook此处需要的副作用。
  remoteEvalFeatureValues.clear()
  // 调用 getGrowthBookClient.cache?.clear?.()，完成这一处局部操作。
  getGrowthBookClient.cache?.clear?.()
  // 调用 initializeGrowthBook.cache?.clear?.()，完成这一处局部操作。
  initializeGrowthBook.cache?.clear?.()
  // envOverrides 集合更新为 `null`，确保服务层后续读取最新状态。
  envOverrides = null
  // envOverridesParsed更新为 `false`，确保服务层后续读取最新状态。
  envOverridesParsed = false
}

// Periodic refresh interval (matches Statsig's 6-hour interval)
// GROWTHBOOK_REFRESH_INTERVAL_MS 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const GROWTHBOOK_REFRESH_INTERVAL_MS =
  process.env.USER_TYPE !== 'ant'
    ? 6 * 60 * 60 * 1000 // 6 hours
    : 20 * 60 * 1000 // 20 min (for ants)
// refreshInterval 命名 `null`，让后续代码直接表达这个值的用途。
let refreshInterval: ReturnType<typeof setInterval> | null = null
// 这个回调绑定到 let beforeExitListener: (() => void) | null = null，负责服务层 growthbook在该局部场景下的响应。
let beforeExitListener: (() => void) | null = null

/**
 * Light refresh - re-fetch features from server without recreating client.
 * Use this for periodic refresh when auth headers haven't changed.
 *
 * Unlike refreshGrowthBookAfterAuthChange() which destroys and recreates the client,
 * this preserves client state and just fetches fresh feature values.
 */
// refreshGrowthBookFeatures 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshGrowthBookFeatures(): Promise<void> {
  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 growthbook操作，确保异常能进入相邻错误处理。
  try {
    // growthBookClient保存`initializeGrowthBook`，供服务层 growthbook后续处理使用。
    const growthBookClient = await initializeGrowthBook()
    // growthBookClient缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
    if (!growthBookClient) {
      // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `growthBookClient.refreshFeatures()` 完成，再继续服务层 growthbook的异步流程。
    await growthBookClient.refreshFeatures()

    // Guard: if this client was replaced during the in-flight refresh
    // (e.g. refreshGrowthBookAfterAuthChange ran), skip processing the
    // stale payload. Mirrors the init-callback guard above.
    // `growthBookClient` 与 `client` 不一致时刷新派生状态，避免使用过期结果。
    if (growthBookClient !== client) {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'GrowthBook: Skipping refresh processing for replaced client',
        )
      }
      // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Rebuild remoteEvalFeatureValues from the refreshed payload so that
    // _BLOCKS_ON_INIT callers (e.g. getMaxVersion for the auto-update kill
    // switch) see fresh values, not the stale init-time snapshot.
    // hadFeatures 集合读取`processRemoteEvalPayload`，供服务层 growthbook后续处理使用。
    const hadFeatures = await processRemoteEvalPayload(growthBookClient)
    // Same re-check as init path: covers the setPayload yield inside
    // processRemoteEvalPayload (the guard above only covers refreshFeatures).
    // `growthBookClient` 与 `client` 不一致时刷新派生状态，避免使用过期结果。
    if (growthBookClient !== client) return

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 growthbook执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
      logForDebugging('GrowthBook: Light refresh completed')
    }

    // Gate on hadFeatures: if the payload was empty/malformed,
    // remoteEvalFeatureValues wasn't rebuilt — skip both the no-op disk
    // write and the spurious subscriber churn (clearCommandMemoizationCaches
    // + getCommands + 4× model re-renders).
    // 满足 `hadFeatures` 时，服务层 growthbook执行该分支。
    if (hadFeatures) {
      // 调用 syncRemoteEvalToDisk，触发服务层 growthbook此处需要的副作用。
      syncRemoteEvalToDisk()
      // 调用 refreshed.emit，触发服务层 growthbook此处需要的副作用。
      refreshed.emit()
    }
  } catch (error) {
    // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，服务层 growthbook执行对应分支。
    if (process.env.NODE_ENV === 'development') {
      // 抛出 error，阻止服务层 growthbook在无效状态下继续运行。
      throw error
    }
    // 记录服务层 growthbook运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
  }
}

/**
 * Set up periodic refresh of GrowthBook features.
 * Uses light refresh (refreshGrowthBookFeatures) to re-fetch without recreating client.
 *
 * Call this after initialization for long-running sessions to ensure
 * feature values stay fresh. Matches Statsig's 6-hour refresh interval.
 */
// setupPeriodicGrowthBookRefresh 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setupPeriodicGrowthBookRefresh(): void {
  // 满足 `!isGrowthBookEnabled()` 时，服务层 growthbook执行该分支。
  if (!isGrowthBookEnabled()) {
    // 服务层 growthbook在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Clear any existing interval to avoid duplicates
  // 满足 `refreshInterval` 时，服务层 growthbook执行该分支。
  if (refreshInterval) {
    // 调用 clearInterval，触发服务层 growthbook此处需要的副作用。
    clearInterval(refreshInterval)
  }

  // refreshInterval更新为 `setInterval(() => {`，确保服务层后续读取最新状态。
  refreshInterval = setInterval(() => {
    // 显式忽略 `refreshGrowthBookFeatures()` 的返回值，只保留它触发的副作用。
    void refreshGrowthBookFeatures()
  }, GROWTHBOOK_REFRESH_INTERVAL_MS)
  // Allow process to exit naturally - this timer shouldn't keep the process alive
  // 调用 refreshInterval.unref?.()，完成这一处局部操作。
  refreshInterval.unref?.()

  // Register cleanup listener only once
  // beforeExitListener 集合缺失时提前走兜底路径，避免服务层 growthbook继续依赖无效输入。
  if (!beforeExitListener) {
    // beforeExitListener 集合更新为 `() => {`，确保服务层后续读取最新状态。
    beforeExitListener = () => {
      // 调用 stopPeriodicGrowthBookRefresh，触发服务层 growthbook此处需要的副作用。
      stopPeriodicGrowthBookRefresh()
    }
    // 调用 process.once，触发服务层 growthbook此处需要的副作用。
    process.once('beforeExit', beforeExitListener)
  }
}

/**
 * Stop periodic refresh (for testing or cleanup)
 */
// stopPeriodicGrowthBookRefresh 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopPeriodicGrowthBookRefresh(): void {
  // 满足 `refreshInterval` 时，服务层 growthbook执行该分支。
  if (refreshInterval) {
    // 调用 clearInterval，触发服务层 growthbook此处需要的副作用。
    clearInterval(refreshInterval)
    // refreshInterval更新为 `null`，确保服务层后续读取最新状态。
    refreshInterval = null
  }
  // 满足 `beforeExitListener` 时，服务层 growthbook执行该分支。
  if (beforeExitListener) {
    // 调用 process.removeListener，触发服务层 growthbook此处需要的副作用。
    process.removeListener('beforeExit', beforeExitListener)
    // beforeExitListener 集合更新为 `null`，确保服务层后续读取最新状态。
    beforeExitListener = null
  }
}

// ============================================================================
// Dynamic Config Functions
// These are semantic wrappers around feature functions for Statsig API parity.
// In GrowthBook, dynamic configs are just features with object values.
// ============================================================================

/**
 * Get a dynamic config value - blocks until GrowthBook is initialized.
 * Prefer getFeatureValue_CACHED_MAY_BE_STALE for startup-critical paths.
 */
// getDynamicConfig_BLOCKS_ON_INIT 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getDynamicConfig_BLOCKS_ON_INIT<T>(
  configName: string,
  defaultValue: T,
): Promise<T> {
  // 返回 `getFeatureValue_DEPRECATED(configName, defaultValue)`，作为服务层 growthbook这次计算的结果。
  return getFeatureValue_DEPRECATED(configName, defaultValue)
}

/**
 * Get a dynamic config value from disk cache immediately. Pure read — see
 * getFeatureValue_CACHED_MAY_BE_STALE.
 * This is the preferred method for startup-critical paths and sync contexts.
 *
 * In GrowthBook, dynamic configs are just features with object values.
 */
// getDynamicConfig_CACHED_MAY_BE_STALE 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDynamicConfig_CACHED_MAY_BE_STALE<T>(
  configName: string,
  defaultValue: T,
): T {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(configName, defaultValue)`，作为服务层 growthbook这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(configName, defaultValue)
}
