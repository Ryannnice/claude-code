/**
 * Leaf state module for the remote-managed-settings sync cache.
 *
 * Split from syncCache.ts to break the settings.ts → syncCache.ts → auth.ts →
 * settings.ts cycle. auth.ts sits inside the large settings SCC; importing it
 * from settings.ts's own dependency chain pulls hundreds of modules into the
 * eagerly-evaluated SCC at startup.
 *
 * This module imports only leaves (path, envUtils, file, json, types,
 * settings/settingsCache — also a leaf, only type-imports validation). settings.ts
 * reads the cache from here. syncCache.ts keeps isRemoteManagedSettingsEligible
 * (the auth-touching part) and re-exports everything from here for callers that
 * don't care about the cycle.
 *
 * Eligibility is a tri-state here: undefined (not yet determined — return
 * null), false (ineligible — return null), true (proceed). managedEnv.ts
 * calls isRemoteManagedSettingsEligible() just before the policySettings
 * read — after userSettings/flagSettings env vars are applied, so the check
 * sees config-provided CLAUDE_CODE_USE_BEDROCK/ANTHROPIC_BASE_URL. That call
 * computes once and mirrors the result here via setEligibility(). Every
 * subsequent read hits the cached bool instead of re-running the auth chain.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 readFileSync 工具函数，把通用处理留在 ../../utils/fileRead.js 中维护。
import { readFileSync } from '../../utils/fileRead.js'
// 复用 stripBOM 工具函数，把通用处理留在 ../../utils/jsonRead.js 中维护。
import { stripBOM } from '../../utils/jsonRead.js'
// 复用 resetSettingsCache 工具函数，把通用处理留在 ../../utils/settings/settingsCache.js 中维护。
import { resetSettingsCache } from '../../utils/settings/settingsCache.js'
// 类型依赖 { SettingsJson } 来自 ../../utils/settings/types.js，用于校准服务层 sync Cache State的数据契约。
import type { SettingsJson } from '../../utils/settings/types.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js'

// SETTINGS_FILENAME 文件数据固定为 `'remote-settings.json'`，作为服务层 sync Cache State后续展示或比较的基准。
const SETTINGS_FILENAME = 'remote-settings.json'

// sessionCache 会话数据 命名 `null`，让后续代码直接表达这个值的用途。
let sessionCache: SettingsJson | null = null
// eligible 先占位，稍后的条件分支会根据实际输入补齐它。
let eligible: boolean | undefined

// setSessionCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionCache(value: SettingsJson | null): void {
  // sessionCache 会话数据更新为 `value`，确保服务层后续读取最新状态。
  sessionCache = value
}

// resetSyncCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSyncCache(): void {
  // sessionCache 会话数据更新为 `null`，确保服务层后续读取最新状态。
  sessionCache = null
  // eligible更新为 `undefined`，确保服务层后续读取最新状态。
  eligible = undefined
}

// setEligibility 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setEligibility(v: boolean): boolean {
  // eligible更新为 `v`，确保服务层后续读取最新状态。
  eligible = v
  // 返回 `v`，作为服务层 sync Cache State这次计算的结果。
  return v
}

// getSettingsPath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsPath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), SETTINGS_FILENAME)`，作为服务层 sync Cache State这次计算的结果。
  return join(getClaudeConfigHomeDir(), SETTINGS_FILENAME)
}

// sync IO — settings pipeline is sync. fileRead and jsonRead are leaves;
// file.ts and json.ts both sit in the settings SCC.
// loadSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function loadSettings(): SettingsJson | null {
  // 保护这一段可能失败的服务层 sync Cache State操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFileSync`，供服务层 sync Cache State后续处理使用。
    const content = readFileSync(getSettingsPath())
    // data解析`jsonParse(stripBOM(content))` 整理出中间结果，供服务层 sync Cache State后续步骤使用。
    const data: unknown = jsonParse(stripBOM(content))
    // `!data || typeof data` 与 `'object' || Array.isArray(data)` 不一致时刷新派生状态，避免使用过期结果。
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      // 返回 `null`，作为服务层 sync Cache State这次计算的结果。
      return null
    }
    // 返回 `data as SettingsJson`，作为服务层 sync Cache State这次计算的结果。
    return data as SettingsJson
  } catch {
    // 返回 `null`，作为服务层 sync Cache State这次计算的结果。
    return null
  }
}

// getRemoteManagedSettingsSyncFromCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRemoteManagedSettingsSyncFromCache(): SettingsJson | null {
  // `eligible` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
  if (eligible !== true) return null
  // 满足 `sessionCache` 时，服务层 sync Cache State执行该分支。
  if (sessionCache) return sessionCache
  // cachedSettings 缓存读取`loadSettings`，供服务层 sync Cache State后续处理使用。
  const cachedSettings = loadSettings()
  // 满足 `cachedSettings` 时，服务层 sync Cache State执行该分支。
  if (cachedSettings) {
    // sessionCache 会话数据更新为 `cachedSettings`，确保服务层后续读取最新状态。
    sessionCache = cachedSettings
    // Remote settings just became available for the first time. Any merged
    // getSettings_DEPRECATED() result cached before this moment is missing
    // the policySettings layer (the `eligible !== true` guard above returned
    // null). Flush so the next merged read re-merges with this layer visible.
    //
    // Fires at most once: subsequent calls hit `if (sessionCache)` above.
    // When called from loadSettingsFromDisk() (settings.ts:546), the merged
    // cache is still null (setSessionSettingsCache runs at :732 after
    // loadSettingsFromDisk returns) — no-op. The async-fetch arm (index.ts
    // setSessionCache + notifyChange) already handles its own reset.
    //
    // gh-23085: isBridgeEnabled() at main.tsx Commander-definition time
    // (before preAction → init() → isRemoteManagedSettingsEligible()) reached
    // getSettings_DEPRECATED() at auth.ts:115. The try/catch in bridgeEnabled
    // swallowed the later getGlobalConfig() throw, but the merged settings
    // cache was already poisoned. See managedSettingsHeadless.int.test.ts.
    // 调用 resetSettingsCache，触发服务层 sync Cache State此处需要的副作用。
    resetSettingsCache()
    // 返回 `cachedSettings`，作为服务层 sync Cache State这次计算的结果。
    return cachedSettings
  }
  // 返回 `null`，作为服务层 sync Cache State这次计算的结果。
  return null
}
