// 接入 isRemoteManagedSettingsEligible 服务层能力，把外部通信或共享状态交给 ../services/remoteManagedSettings/syncCache.js 处理。
import { isRemoteManagedSettingsEligible } from '../services/remoteManagedSettings/syncCache.js'
// 引入 clearCACertsCache，将 ./caCerts.js 中已经封装好的能力接到本文件流程里。
import { clearCACertsCache } from './caCerts.js'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isProviderManagedEnvVar,
  SAFE_ENV_VARS,
} from './managedEnvConstants.js'
// 引入 clearMTLSCache，将 ./mtls.js 中已经封装好的能力接到本文件流程里。
import { clearMTLSCache } from './mtls.js'
// 引入 clearProxyCache、configureGlobalAgents，将 ./proxy.js 中已经封装好的能力接到本文件流程里。
import { clearProxyCache, configureGlobalAgents } from './proxy.js'
// 引入 isSettingSourceEnabled，将 ./settings/constants.js 中已经封装好的能力接到本文件流程里。
import { isSettingSourceEnabled } from './settings/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from './settings/settings.js'

/**
 * `claude ssh` remote: ANTHROPIC_UNIX_SOCKET routes auth through a -R forwarded
 * socket to a local proxy, and the launcher sets a handful of placeholder auth
 * env vars that the remote's ~/.claude settings.env MUST NOT clobber (see
 * isAnthropicAuthEnabled). Strip them from any settings-sourced env object.
 */
// withoutSSHTunnelVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function withoutSSHTunnelVars(
  env: Record<string, string> | undefined,
): Record<string, string> {
  // 只有 `!env || !process.env.ANTHROPIC_UNIX_SOCKET` 满足时，共享工具才执行该分支。
  if (!env || !process.env.ANTHROPIC_UNIX_SOCKET) return env || {}
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ANTHROPIC_UNIX_SOCKET: _1,
    ANTHROPIC_BASE_URL: _2,
    ANTHROPIC_API_KEY: _3,
    ANTHROPIC_AUTH_TOKEN: _4,
    CLAUDE_CODE_OAUTH_TOKEN: _5,
    ...rest
  } = env
  // 返回 `rest`，作为共享工具这次计算的结果。
  return rest
}

/**
 * When the host owns inference routing (sets
 * CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST in spawn env), strip
 * provider-selection / model-default vars from settings-sourced env so a
 * user's ~/.claude/settings.json can't redirect requests away from the
 * host-configured provider.
 */
// withoutHostManagedProviderVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function withoutHostManagedProviderVars(
  env: Record<string, string> | undefined,
): Record<string, string> {
  // env缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!env) return {}
  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST)) {
    // 返回 `env`，作为共享工具这次计算的结果。
    return env
  }
  // out 从空对象开始收集键值，后续按名称补齐内容。
  const out: Record<string, string> = {}
  // 循环处理 `const [key, value] of Object.entries(env)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(env)) {
    // 满足 `!isProviderManagedEnvVar(key)` 时，共享工具执行该分支。
    if (!isProviderManagedEnvVar(key)) {
      // out[key更新为 `value`，确保共享工具 managed Env后续读取最新状态。
      out[key] = value
    }
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Snapshot of env keys present before any settings.env is applied — for CCD,
 * these are the keys the desktop host set to orchestrate the subprocess.
 * Settings must not override them (OTEL_LOGS_EXPORTER=console would corrupt
 * the stdio JSON-RPC transport). Keys added LATER by user/project settings
 * are not in this set, so mid-session settings.json changes still apply.
 * Lazy-captured on first applySafeConfigEnvironmentVariables() call.
 */
// ccdSpawnEnvKeys 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let ccdSpawnEnvKeys: Set<string> | null | undefined

// withoutCcdSpawnEnvKeys 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function withoutCcdSpawnEnvKeys(
  env: Record<string, string> | undefined,
): Record<string, string> {
  // 只有 `!env || !ccdSpawnEnvKeys` 满足时，共享工具才执行该分支。
  if (!env || !ccdSpawnEnvKeys) return env || {}
  // out 从空对象开始收集键值，后续按名称补齐内容。
  const out: Record<string, string> = {}
  // 循环处理 `const [key, value] of Object.entries(env)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(env)) {
    // 满足 `!ccdSpawnEnvKeys.has(key)` 时，共享工具执行该分支。
    if (!ccdSpawnEnvKeys.has(key)) out[key] = value
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Compose the strip filters applied to every settings-sourced env object.
 */
// filterSettingsEnv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterSettingsEnv(
  env: Record<string, string> | undefined,
): Record<string, string> {
  // 返回 `withoutCcdSpawnEnvKeys(`，作为共享工具这次计算的结果。
  return withoutCcdSpawnEnvKeys(
    withoutHostManagedProviderVars(withoutSSHTunnelVars(env)),
  )
}

/**
 * Trusted setting sources whose env vars can be applied before the trust dialog.
 *
 * - userSettings (~/.claude/settings.json): controlled by the user, not project-specific
 * - flagSettings (--settings CLI flag or SDK inline settings): explicitly passed by the user
 * - policySettings (managed settings from enterprise API or local managed-settings.json):
 *   controlled by IT/admin (highest priority, cannot be overridden)
 *
 * Project-scoped sources (projectSettings, localSettings) are excluded because they live
 * inside the project directory and could be committed by a malicious actor to redirect
 * traffic (e.g., ANTHROPIC_BASE_URL) to an attacker-controlled server.
 */
// TRUSTED_SETTING_SOURCES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TRUSTED_SETTING_SOURCES = [
  'userSettings',
  'flagSettings',
  'policySettings',
] as const

/**
 * Apply environment variables from trusted sources to process.env.
 * Called before the trust dialog so that user/enterprise env vars like
 * ANTHROPIC_BASE_URL take effect during first-run/onboarding.
 *
 * For trusted sources (user settings, managed settings, CLI flags), ALL env vars
 * are applied — including ones like ANTHROPIC_BASE_URL that would be dangerous
 * from project-scoped settings.
 *
 * For project-scoped sources (projectSettings, localSettings), only safe env vars
 * from the SAFE_ENV_VARS allowlist are applied. These are applied after trust is
 * fully established via applyConfigEnvironmentVariables().
 */
// applySafeConfigEnvironmentVariables 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySafeConfigEnvironmentVariables(): void {
  // Capture CCD spawn-env keys before any settings.env is applied (once).
  // 满足 `ccdSpawnEnvKeys === undefined` 时，共享工具执行该分支。
  if (ccdSpawnEnvKeys === undefined) {
    // 共享工具 managed Env在这里处理 `ccdSpawnEnvKeys =`，完成这一小步状态转换。
    ccdSpawnEnvKeys =
      process.env.CLAUDE_CODE_ENTRYPOINT === 'claude-desktop'
        ? new Set(Object.keys(process.env))
        : null
  }

  // Global config (~/.claude.json) is user-controlled. In CCD mode,
  // filterSettingsEnv strips keys that were in the spawn env snapshot so
  // the desktop host's operational vars (OTEL, etc.) are not overridden.
  // 调用 Object.assign，触发共享工具此处需要的副作用。
  Object.assign(process.env, filterSettingsEnv(getGlobalConfig().env))

  // Apply ALL env vars from trusted setting sources, policySettings last.
  // Gate on isSettingSourceEnabled so SDK settingSources: [] (isolation mode)
  // doesn't get clobbered by ~/.claude/settings.json env (gh#217). policy/flag
  // sources are always enabled, so this only ever filters userSettings.
  // 按顺序遍历 `TRUSTED_SETTING_SOURCES` 中的source，逐个交给共享工具处理。
  for (const source of TRUSTED_SETTING_SOURCES) {
    // 当 `source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
    if (source === 'policySettings') continue
    // 满足 `!isSettingSourceEnabled(source)` 时，共享工具执行该分支。
    if (!isSettingSourceEnabled(source)) continue
    // 调用 Object.assign，触发共享工具此处需要的副作用。
    Object.assign(
      process.env,
      filterSettingsEnv(getSettingsForSource(source)?.env),
    )
  }

  // Compute remote-managed-settings eligibility now, with userSettings and
  // flagSettings env applied. Eligibility reads CLAUDE_CODE_USE_BEDROCK,
  // ANTHROPIC_BASE_URL — both settable via settings.env.
  // getSettingsForSource('policySettings') below consults the remote cache,
  // which guards on this. The two-phase structure makes the ordering
  // dependency visible: non-policy env → eligibility → policy env.
  // 调用 isRemoteManagedSettingsEligible，触发共享工具此处需要的副作用。
  isRemoteManagedSettingsEligible()

  // 调用 Object.assign，触发共享工具此处需要的副作用。
  Object.assign(
    process.env,
    filterSettingsEnv(getSettingsForSource('policySettings')?.env),
  )

  // Apply only safe env vars from the fully-merged settings (which includes
  // project-scoped sources). For safe vars that also exist in trusted sources,
  // the merged value (which may come from a higher-priority project source)
  // will overwrite the trusted value — this is acceptable since these vars are
  // in the safe allowlist. Only policySettings values are guaranteed to survive
  // unchanged (it has the highest merge priority in both loops) — except
  // provider-routing vars, which filterSettingsEnv strips from every source
  // when CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST is set.
  // settingsEnv筛选`filterSettingsEnv`，供共享工具后续处理使用。
  const settingsEnv = filterSettingsEnv(getSettings_DEPRECATED()?.env)
  // 循环处理 `const [key, value] of Object.entries(settingsEnv)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(settingsEnv)) {
    // 满足 `SAFE_ENV_VARS.has(key.toUpperCase())` 时，共享工具执行该分支。
    if (SAFE_ENV_VARS.has(key.toUpperCase())) {
      // env[key更新为 `value`，确保共享工具 managed Env后续读取最新状态。
      process.env[key] = value
    }
  }
}

/**
 * Apply environment variables from settings to process.env.
 * This applies ALL environment variables (except provider-routing vars when
 * CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST is set — see filterSettingsEnv) and
 * should only be called after trust is established. This applies potentially
 * dangerous environment variables such as LD_PRELOAD, PATH, etc.
 */
// applyConfigEnvironmentVariables 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyConfigEnvironmentVariables(): void {
  // 调用 Object.assign，触发共享工具此处需要的副作用。
  Object.assign(process.env, filterSettingsEnv(getGlobalConfig().env))

  // 调用 Object.assign，触发共享工具此处需要的副作用。
  Object.assign(process.env, filterSettingsEnv(getSettings_DEPRECATED()?.env))

  // Clear caches so agents are rebuilt with the new env vars
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearCACertsCache()
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearMTLSCache()
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearProxyCache()

  // Reconfigure proxy/mTLS agents to pick up any proxy env vars from settings
  // 调用 configureGlobalAgents，触发共享工具此处需要的副作用。
  configureGlobalAgents()
}
