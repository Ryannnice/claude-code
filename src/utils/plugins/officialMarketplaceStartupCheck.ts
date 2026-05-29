/**
 * Auto-install logic for the official Anthropic marketplace.
 *
 * This module handles automatically installing the official marketplace
 * on startup for new users, with appropriate checks for:
 * - Enterprise policy restrictions
 * - Git availability
 * - Previous installation attempts
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 checkGitAvailable、markGitUnavailable，将 ./gitAvailability.js 中已经封装好的能力接到本文件流程里。
import { checkGitAvailable, markGitUnavailable } from './gitAvailability.js'
// 引入 isSourceAllowedByPolicy，将 ./marketplaceHelpers.js 中已经封装好的能力接到本文件流程里。
import { isSourceAllowedByPolicy } from './marketplaceHelpers.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  addMarketplaceSource,
  getMarketplacesCacheDir,
  loadKnownMarketplacesConfig,
  saveKnownMarketplacesConfig,
} from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  OFFICIAL_MARKETPLACE_NAME,
  OFFICIAL_MARKETPLACE_SOURCE,
} from './officialMarketplace.js'
// 引入 fetchOfficialMarketplaceFromGcs，将 ./officialMarketplaceGcs.js 中已经封装好的能力接到本文件流程里。
import { fetchOfficialMarketplaceFromGcs } from './officialMarketplaceGcs.js'

/**
 * Reason why the official marketplace was not installed
 */
// OfficialMarketplaceSkipReason 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type OfficialMarketplaceSkipReason =
  | 'already_attempted'
  | 'already_installed'
  | 'policy_blocked'
  | 'git_unavailable'
  | 'gcs_unavailable'
  | 'unknown'

/**
 * Check if official marketplace auto-install is disabled via environment variable.
 */
// isOfficialMarketplaceAutoInstallDisabled 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOfficialMarketplaceAutoInstallDisabled(): boolean {
  // 返回 `isEnvTruthy(`，作为插件管理这次计算的结果。
  return isEnvTruthy(
    process.env.CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL,
  )
}

/**
 * Configuration for retry logic
 */
// RETRY_CONFIG 配置 集中保存插件工具 official Marketplace Sta...要一起传递的字段。
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 10,
  INITIAL_DELAY_MS: 60 * 60 * 1000, // 1 hour
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY_MS: 7 * 24 * 60 * 60 * 1000, // 1 week
}

/**
 * Calculate next retry delay using exponential backoff
 */
// calculateNextRetryDelay 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function calculateNextRetryDelay(retryCount: number): number {
  // delay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const delay =
    RETRY_CONFIG.INITIAL_DELAY_MS *
    Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount)
  // 返回 `Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS)`，作为插件管理这次计算的结果。
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS)
}

/**
 * Determine if installation should be retried based on failure reason and retry state
 */
// shouldRetryInstallation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldRetryInstallation(
  config: ReturnType<typeof getGlobalConfig>,
): boolean {
  // If never attempted, should try
  // config.officialMarketplaceAutoInstallAttempted 市场数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!config.officialMarketplaceAutoInstallAttempted) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // If already installed successfully, don't retry
  // 满足 `config.officialMarketplaceAutoInstalled` 时，插件管理执行该分支。
  if (config.officialMarketplaceAutoInstalled) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // failReason 命名 `config.officialMarketplaceAutoInstallFailReason`，让后续代码直接表达这个值的用途。
  const failReason = config.officialMarketplaceAutoInstallFailReason
  // retryCount 数量标记插件工具 official Marketplace Sta...是否启用对应路径。
  const retryCount = config.officialMarketplaceAutoInstallRetryCount || 0
  // nextRetryTime 命名 `config.officialMarketplaceAutoInstallNextRetryTime`，让后续代码直接表达这个值的用途。
  const nextRetryTime = config.officialMarketplaceAutoInstallNextRetryTime
  // now记录时间`Date.now`，供插件管理后续处理使用。
  const now = Date.now()

  // Check if we've exceeded max attempts
  // 满足 `retryCount >= RETRY_CONFIG.MAX_ATTEMPTS` 时，插件管理执行该分支。
  if (retryCount >= RETRY_CONFIG.MAX_ATTEMPTS) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Permanent failures - don't retry
  // 当 `failReason` 匹配 `'policy_blocked'` 时，插件管理执行对应分支。
  if (failReason === 'policy_blocked') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if enough time has passed for next retry
  // 只有 `nextRetryTime && now < nextRetryTime` 满足时，插件管理才执行该分支。
  if (nextRetryTime && now < nextRetryTime) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Retry for temporary failures (unknown), semi-permanent (git_unavailable),
  // and legacy state (undefined failReason from before retry logic existed)
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    failReason === 'unknown' ||
    failReason === 'git_unavailable' ||
    failReason === 'gcs_unavailable' ||
    failReason === undefined
  )
}

/**
 * Result of the auto-install check
 */
// OfficialMarketplaceCheckResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type OfficialMarketplaceCheckResult = {
  /** Whether the marketplace was successfully installed */
  installed: boolean
  /** Whether the installation was skipped (and why) */
  skipped: boolean
  /** Reason for skipping, if applicable */
  reason?: OfficialMarketplaceSkipReason
  /** Whether saving retry metadata to config failed */
  configSaveFailed?: boolean
}

/**
 * Check and install the official marketplace on startup.
 *
 * This function is designed to be called as a fire-and-forget operation
 * during startup. It will:
 * 1. Check if installation was already attempted
 * 2. Check if marketplace is already installed
 * 3. Check enterprise policy restrictions
 * 4. Check git availability
 * 5. Attempt installation
 * 6. Record the result in GlobalConfig
 *
 * @returns Result indicating whether installation succeeded or was skipped
 */
// checkAndInstallOfficialMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndInstallOfficialMarketplace(): Promise<OfficialMarketplaceCheckResult> {
  // 配置读取`getGlobalConfig`，供插件管理后续处理使用。
  const config = getGlobalConfig()

  // Check if we should retry installation
  // 满足 `!shouldRetryInstallation(config)` 时，插件管理执行该分支。
  if (!shouldRetryInstallation(config)) {
    // reason 先占位，稍后的条件分支会根据实际输入补齐它。
    const reason: OfficialMarketplaceSkipReason =
      config.officialMarketplaceAutoInstallFailReason ?? 'already_attempted'
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Official marketplace auto-install skipped: ${reason}`)
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      installed: false,
      skipped: true,
      reason,
    }
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Check if auto-install is disabled via env var
    // 满足 `isOfficialMarketplaceAutoInstallDisabled()` 时，插件管理执行该分支。
    if (isOfficialMarketplaceAutoInstallDisabled()) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Official marketplace auto-install disabled via env var, skipping',
      )
      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: false,
        officialMarketplaceAutoInstallFailReason: 'policy_blocked',
      }))
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: false,
        skipped: true,
        policy_blocked: true,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { installed: false, skipped: true, reason: 'policy_blocked' }
    }

    // Check if marketplace is already installed
    // knownMarketplaces 市场数据读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
    const knownMarketplaces = await loadKnownMarketplacesConfig()
    // 满足 `knownMarketplaces[OFFICIAL_MARKETPLACE_NAME]` 时，插件管理执行该分支。
    if (knownMarketplaces[OFFICIAL_MARKETPLACE_NAME]) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Official marketplace '${OFFICIAL_MARKETPLACE_NAME}' already installed, skipping`,
      )
      // Mark as attempted so we don't check again
      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: true,
      }))
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { installed: false, skipped: true, reason: 'already_installed' }
    }

    // Check enterprise policy restrictions
    // 满足 `!isSourceAllowedByPolicy(OFFICIAL_MARKETPLACE_SOURCE)` 时，插件管理执行该分支。
    if (!isSourceAllowedByPolicy(OFFICIAL_MARKETPLACE_SOURCE)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Official marketplace blocked by enterprise policy, skipping',
      )
      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: false,
        officialMarketplaceAutoInstallFailReason: 'policy_blocked',
      }))
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: false,
        skipped: true,
        policy_blocked: true,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { installed: false, skipped: true, reason: 'policy_blocked' }
    }

    // inc-5046: try GCS mirror first — doesn't need git, doesn't hit GitHub.
    // Backend (anthropic#317037) publishes a marketplace zip to the same
    // bucket as the native binary. If GCS succeeds, register the marketplace
    // with source:'github' (still true — GCS is a mirror) and skip git
    // entirely.
    // cacheDir 缓存读取`getMarketplacesCacheDir`，供插件管理后续处理使用。
    const cacheDir = getMarketplacesCacheDir()
    // installLocation格式化`join`，供插件管理后续处理使用。
    const installLocation = join(cacheDir, OFFICIAL_MARKETPLACE_NAME)
    // gcsSha读取`fetchOfficialMarketplaceFromGcs`，供插件管理后续处理使用。
    const gcsSha = await fetchOfficialMarketplaceFromGcs(
      installLocation,
      cacheDir,
    )
    // `gcsSha` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (gcsSha !== null) {
      // known读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
      const known = await loadKnownMarketplacesConfig()
      // known[OFFICIAL_MARKETPLACE_NAME 市场数据更新为 `{`，确保插件工具 official Marketplace Startup C...后续读取最新状态。
      known[OFFICIAL_MARKETPLACE_NAME] = {
        source: OFFICIAL_MARKETPLACE_SOURCE,
        installLocation,
        lastUpdated: new Date().toISOString(),
      }
      // 等待 `saveKnownMarketplacesConfig(known)` 完成，再继续插件工具 official Marketplace Startup C...的异步流程。
      await saveKnownMarketplacesConfig(known)

      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: true,
        officialMarketplaceAutoInstallFailReason: undefined,
        officialMarketplaceAutoInstallRetryCount: undefined,
        officialMarketplaceAutoInstallLastAttemptTime: undefined,
        officialMarketplaceAutoInstallNextRetryTime: undefined,
      }))
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: true,
        skipped: false,
        via_gcs: true,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { installed: true, skipped: false }
    }
    // GCS failed (404 until backend writes, or network). Fall through to git
    // ONLY if the kill-switch allows — same gate as refreshMarketplace().
    // 插件管理在这里按实际状态进入对应分支。
    if (
      !getFeatureValue_CACHED_MAY_BE_STALE(
        'tengu_plugin_official_mkt_git_fallback',
        true,
      )
    ) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Official marketplace GCS failed; git fallback disabled by flag — skipping install',
      )
      // Same retry-with-backoff metadata as git_unavailable below — transient
      // GCS failures should retry with exponential backoff, not give up.
      // retryCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const retryCount =
        (config.officialMarketplaceAutoInstallRetryCount || 0) + 1
      // now记录时间`Date.now`，供插件管理后续处理使用。
      const now = Date.now()
      // nextRetryTime保存`calculateNextRetryDelay`，供插件管理后续处理使用。
      const nextRetryTime = now + calculateNextRetryDelay(retryCount)
      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: false,
        officialMarketplaceAutoInstallFailReason: 'gcs_unavailable',
        officialMarketplaceAutoInstallRetryCount: retryCount,
        officialMarketplaceAutoInstallLastAttemptTime: now,
        officialMarketplaceAutoInstallNextRetryTime: nextRetryTime,
      }))
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: false,
        skipped: true,
        gcs_unavailable: true,
        retry_count: retryCount,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { installed: false, skipped: true, reason: 'gcs_unavailable' }
    }

    // Check git availability
    // gitAvailable读取`checkGitAvailable`，供插件管理后续处理使用。
    const gitAvailable = await checkGitAvailable()
    // gitAvailable缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!gitAvailable) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Git not available, skipping official marketplace auto-install',
      )
      // retryCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const retryCount =
        (config.officialMarketplaceAutoInstallRetryCount || 0) + 1
      // now记录时间`Date.now`，供插件管理后续处理使用。
      const now = Date.now()
      // nextRetryDelay保存`calculateNextRetryDelay`，供插件管理后续处理使用。
      const nextRetryDelay = calculateNextRetryDelay(retryCount)
      // nextRetryTime 命名 `now + nextRetryDelay`，让后续代码直接表达这个值的用途。
      const nextRetryTime = now + nextRetryDelay

      // configSaveFailed 配置标记插件工具 official Marketplace Sta...是否启用对应路径。
      let configSaveFailed = false
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
        saveGlobalConfig(current => ({
          ...current,
          officialMarketplaceAutoInstallAttempted: true,
          officialMarketplaceAutoInstalled: false,
          officialMarketplaceAutoInstallFailReason: 'git_unavailable',
          officialMarketplaceAutoInstallRetryCount: retryCount,
          officialMarketplaceAutoInstallLastAttemptTime: now,
          officialMarketplaceAutoInstallNextRetryTime: nextRetryTime,
        }))
      } catch (saveError) {
        // configSaveFailed 配置更新为 `true`，确保插件工具后续读取最新状态。
        configSaveFailed = true
        // Log the error properly so it gets tracked
        // configError 配置保存`toError`，供插件管理后续处理使用。
        const configError = toError(saveError)
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(configError)

        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to save marketplace auto-install git_unavailable state: ${saveError}`,
          { level: 'error' },
        )
      }
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: false,
        skipped: true,
        git_unavailable: true,
        retry_count: retryCount,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        installed: false,
        skipped: true,
        reason: 'git_unavailable',
        configSaveFailed,
      }
    }

    // Attempt installation
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Attempting to auto-install official marketplace')
    // 等待 `addMarketplaceSource(OFFICIAL_MARKETPLACE_SOURCE)` 完成，再继续插件工具 official Marketplace Startup C...的异步流程。
    await addMarketplaceSource(OFFICIAL_MARKETPLACE_SOURCE)

    // Success
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Successfully auto-installed official marketplace')
    // previousRetryCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const previousRetryCount =
      config.officialMarketplaceAutoInstallRetryCount || 0
    // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      officialMarketplaceAutoInstallAttempted: true,
      officialMarketplaceAutoInstalled: true,
      // Clear retry metadata on success
      officialMarketplaceAutoInstallFailReason: undefined,
      officialMarketplaceAutoInstallRetryCount: undefined,
      officialMarketplaceAutoInstallLastAttemptTime: undefined,
      officialMarketplaceAutoInstallNextRetryTime: undefined,
    }))
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_official_marketplace_auto_install', {
      installed: true,
      skipped: false,
      retry_count: previousRetryCount,
    })
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { installed: true, skipped: false }
  } catch (error) {
    // Handle installation failure
    // errorMessage 消息数据保存`String`，供插件管理后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)

    // On macOS, /usr/bin/git is an xcrun shim that always exists on PATH, so
    // checkGitAvailable() (which only does `which git`) passes even without
    // Xcode CLT installed. The shim then fails at clone time with
    // "xcrun: error: invalid active developer path (...)". Poison the memoized
    // availability check so other git callers in this session skip cleanly,
    // then return silently without recording any attempt state — next startup
    // tries fresh (no backoff machinery for what is effectively "git absent").
    // 满足 `errorMessage.includes('xcrun: error:')` 时，插件管理执行该分支。
    if (errorMessage.includes('xcrun: error:')) {
      // 调用 markGitUnavailable，触发插件管理此处需要的副作用。
      markGitUnavailable()
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Official marketplace auto-install: git is a non-functional macOS xcrun shim, treating as git_unavailable',
      )
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_official_marketplace_auto_install', {
        installed: false,
        skipped: true,
        git_unavailable: true,
        macos_xcrun_shim: true,
      })
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        installed: false,
        skipped: true,
        reason: 'git_unavailable',
      }
    }

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to auto-install official marketplace: ${errorMessage}`,
      { level: 'error' },
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))

    // retryCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const retryCount =
      (config.officialMarketplaceAutoInstallRetryCount || 0) + 1
    // now记录时间`Date.now`，供插件管理后续处理使用。
    const now = Date.now()
    // nextRetryDelay保存`calculateNextRetryDelay`，供插件管理后续处理使用。
    const nextRetryDelay = calculateNextRetryDelay(retryCount)
    // nextRetryTime 命名 `now + nextRetryDelay`，让后续代码直接表达这个值的用途。
    const nextRetryTime = now + nextRetryDelay

    // configSaveFailed 配置标记插件工具 official Marketplace Sta...是否启用对应路径。
    let configSaveFailed = false
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        officialMarketplaceAutoInstallAttempted: true,
        officialMarketplaceAutoInstalled: false,
        officialMarketplaceAutoInstallFailReason: 'unknown',
        officialMarketplaceAutoInstallRetryCount: retryCount,
        officialMarketplaceAutoInstallLastAttemptTime: now,
        officialMarketplaceAutoInstallNextRetryTime: nextRetryTime,
      }))
    } catch (saveError) {
      // configSaveFailed 配置更新为 `true`，确保插件工具后续读取最新状态。
      configSaveFailed = true
      // Log the error properly so it gets tracked
      // configError 配置保存`toError`，供插件管理后续处理使用。
      const configError = toError(saveError)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(configError)

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to save marketplace auto-install failure state: ${saveError}`,
        { level: 'error' },
      )

      // Still return the failure result even if config save failed
      // This ensures we report the installation failure correctly
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_official_marketplace_auto_install', {
      installed: false,
      skipped: true,
      failed: true,
      retry_count: retryCount,
    })

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      installed: false,
      skipped: true,
      reason: 'unknown',
      configSaveFailed,
    }
  }
}
