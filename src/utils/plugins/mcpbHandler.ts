// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import type {
  McpbManifest,
  McpbUserConfigurationOption,
} from '@anthropic-ai/mcpb'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 类型依赖 { McpServerConfig } 来自 ../../services/mcp/types.js，用于校准插件管理的数据契约。
import type { McpServerConfig } from '../../services/mcp/types.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 parseAndValidateManifestFromBytes，将 ../dxt/helpers.js 中已经封装好的能力接到本文件流程里。
import { parseAndValidateManifestFromBytes } from '../dxt/helpers.js'
// 引入 parseZipModes、unzipFile，将 ../dxt/zip.js 中已经封装好的能力接到本文件流程里。
import { parseZipModes, unzipFile } from '../dxt/zip.js'
// 引入 errorMessage、getErrnoCode、isENOENT、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode, isENOENT, toError } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getSecureStorage，将 ../secureStorage/index.js 中已经封装好的能力接到本文件流程里。
import { getSecureStorage } from '../secureStorage/index.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  updateSettingsForSource,
} from '../settings/settings.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 getSystemDirectories，将 ../systemDirectories.js 中已经封装好的能力接到本文件流程里。
import { getSystemDirectories } from '../systemDirectories.js'
// 引入 classifyFetchError、logPluginFetch，将 ./fetchTelemetry.js 中已经封装好的能力接到本文件流程里。
import { classifyFetchError, logPluginFetch } from './fetchTelemetry.js'
/**
 * User configuration values for MCPB
 */
// UserConfigValues 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type UserConfigValues = Record<
  string,
  string | number | boolean | string[]
>

/**
 * User configuration schema from DXT manifest
 */
// UserConfigSchema 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type UserConfigSchema = Record<string, McpbUserConfigurationOption>

/**
 * Result of loading an MCPB file (success case)
 */
// McpbLoadResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpbLoadResult = {
  manifest: McpbManifest
  mcpConfig: McpServerConfig
  extractedPath: string
  contentHash: string
}

/**
 * Result when MCPB needs user configuration
 */
// McpbNeedsConfigResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpbNeedsConfigResult = {
  status: 'needs-config'
  manifest: McpbManifest
  extractedPath: string
  contentHash: string
  configSchema: UserConfigSchema
  existingConfig: UserConfigValues
  validationErrors: string[]
}

/**
 * Metadata stored for each cached MCPB
 */
// McpbCacheMetadata 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpbCacheMetadata = {
  source: string
  contentHash: string
  extractedPath: string
  cachedAt: string
  lastChecked: string
}

/**
 * Progress callback for download and extraction operations
 */
// ProgressCallback 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProgressCallback = (status: string) => void

/**
 * Check if a source string is an MCPB file reference
 */
// isMcpbSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpbSource(source: string): boolean {
  // 返回 `source.endsWith('.mcpb') || source.endsWith('.dxt')`，作为插件管理这次计算的结果。
  return source.endsWith('.mcpb') || source.endsWith('.dxt')
}

/**
 * Check if a source is a URL
 */
// isUrl 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUrl(source: string): boolean {
  // 返回 `source.startsWith('http://') || source.startsWith('https://')`，作为插件管理这次计算的结果。
  return source.startsWith('http://') || source.startsWith('https://')
}

/**
 * Generate content hash for an MCPB file
 */
// generateContentHash 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateContentHash(data: Uint8Array): string {
  // 返回 `createHash('sha256').update(data).digest('hex').substring(0, 16)`，作为插件管理这次计算的结果。
  return createHash('sha256').update(data).digest('hex').substring(0, 16)
}

/**
 * Get cache directory for MCPB files
 */
// getMcpbCacheDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpbCacheDir(pluginPath: string): string {
  // 返回 `join(pluginPath, '.mcpb-cache')`，作为插件管理这次计算的结果。
  return join(pluginPath, '.mcpb-cache')
}

/**
 * Get metadata file path for cached MCPB
 */
// getMetadataPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMetadataPath(cacheDir: string, source: string): string {
  // sourceHash构建`createHash`，供插件管理后续处理使用。
  const sourceHash = createHash('md5')
    .update(source)
    .digest('hex')
    .substring(0, 8)
  // 返回 `join(cacheDir, `${sourceHash}.metadata.json`)`，作为插件管理这次计算的结果。
  return join(cacheDir, `${sourceHash}.metadata.json`)
}

/**
 * Compose the secureStorage key for a per-server secret bucket.
 * `pluginSecrets` is a flat map — per-server secrets share it with top-level
 * plugin options (pluginOptionsStorage.ts) using a `${pluginId}/${server}`
 * composite key. `/` can't appear in plugin IDs (`name@marketplace`) or
 * server names (MCP identifier constraints), so it's unambiguous. Keeps the
 * SecureStorageData schema unchanged and the single-keychain-entry size
 * budget (~2KB stdin-safe, see INC-3028) shared across all plugin secrets.
 */
// serverSecretsKey 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function serverSecretsKey(pluginId: string, serverName: string): string {
  // 返回 ``${pluginId}/${serverName}``，作为插件管理这次计算的结果。
  return `${pluginId}/${serverName}`
}

/**
 * Load user configuration for an MCP server, merging non-sensitive values
 * (from settings.json) with sensitive values (from secureStorage keychain).
 * secureStorage wins on collision — schema determines destination so
 * collision shouldn't happen, but if a user hand-edits settings.json we
 * trust the more secure source.
 *
 * Returns null only if NEITHER source has anything — callers skip
 * ${user_config.X} substitution in that case.
 *
 * @param pluginId - Plugin identifier in "plugin@marketplace" format
 * @param serverName - MCP server name from DXT manifest
 */
// loadMcpServerUserConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadMcpServerUserConfig(
  pluginId: string,
  serverName: string,
): UserConfigValues | null {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
    const settings = getSettings_DEPRECATED()
    // nonSensitive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const nonSensitive =
      settings.pluginConfigs?.[pluginId]?.mcpServers?.[serverName]

    // sensitive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const sensitive =
      getSecureStorage().read()?.pluginSecrets?.[
        serverSecretsKey(pluginId, serverName)
      ]

    // 只有 `!nonSensitive && !sensitive` 满足时，插件管理才执行该分支。
    if (!nonSensitive && !sensitive) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Loaded user config for ${pluginId}/${serverName} (settings + secureStorage)`,
    )
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { ...nonSensitive, ...sensitive }
  } catch (error) {
    // errorObj 错误信息保存`toError`，供插件管理后续处理使用。
    const errorObj = toError(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(errorObj)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to load user config for ${pluginId}/${serverName}: ${error}`,
      { level: 'error' },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Save user configuration for an MCP server, splitting by `schema[key].sensitive`.
 * Mirrors savePluginOptions (pluginOptionsStorage.ts:90) for top-level options:
 *   - `sensitive: true` → secureStorage (keychain on macOS, .credentials.json 0600 elsewhere)
 *   - everything else   → settings.json pluginConfigs[pluginId].mcpServers[serverName]
 *
 * Without this split, per-channel `sensitive: true` was a false sense of
 * security — the dialog masked the input but the save went to plaintext
 * settings.json anyway. H1 #3617646 (Telegram/Discord bot tokens in
 * world-readable .env) surfaced this as the gap to close.
 *
 * Writes are skipped if nothing in that category is present.
 *
 * @param pluginId - Plugin identifier in "plugin@marketplace" format
 * @param serverName - MCP server name from DXT manifest
 * @param config - User configuration values
 * @param schema - The userConfig schema for this server (manifest.user_config
 *   or channels[].userConfig) — drives the sensitive/non-sensitive split
 */
// saveMcpServerUserConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveMcpServerUserConfig(
  pluginId: string,
  serverName: string,
  config: UserConfigValues,
  schema: UserConfigSchema,
): void {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // nonSensitive 从空对象开始收集键值，后续按名称补齐内容。
    const nonSensitive: UserConfigValues = {}
    // sensitive 从空对象开始收集键值，后续按名称补齐内容。
    const sensitive: Record<string, string> = {}

    // 循环处理 `const [key, value] of Object.entries(config)`，让插件管理把同类条目按顺序走完。
    for (const [key, value] of Object.entries(config)) {
      // 满足 `schema[key]?.sensitive === true` 时，插件管理执行该分支。
      if (schema[key]?.sensitive === true) {
        // sensitive[key更新为 `String(value)`，确保插件工具 mcpb Handler后续读取最新状态。
        sensitive[key] = String(value)
      } else {
        // nonSensitive[key更新为 `value`，确保插件工具 mcpb Handler后续读取最新状态。
        nonSensitive[key] = value
      }
    }

    // Scrub ONLY keys we're writing in this call. Covers both directions
    // across schema-version flips:
    //  - sensitive→secureStorage ⇒ remove stale plaintext from settings.json
    //  - nonSensitive→settings.json ⇒ remove stale entry from secureStorage
    //    (otherwise loadMcpServerUserConfig's {...nonSensitive, ...sensitive}
    //    would let the stale secureStorage value win on next read)
    // Partial `config` (user only re-enters one field) leaves other fields
    // untouched in BOTH stores — defense-in-depth against future callers.
    // sensitiveKeysInThisSave保存`Set`，供插件管理后续处理使用。
    const sensitiveKeysInThisSave = new Set(Object.keys(sensitive))
    // nonSensitiveKeysInThisSave保存`Set`，供插件管理后续处理使用。
    const nonSensitiveKeysInThisSave = new Set(Object.keys(nonSensitive))

    // Sensitive → secureStorage FIRST. If this fails (keychain locked,
    // .credentials.json perms), throw before touching settings.json — the
    // old plaintext stays as a fallback instead of losing BOTH copies.
    //
    // Also scrub non-sensitive keys from secureStorage — schema flipped
    // sensitive→false and they're being written to settings.json now. Without
    // this, loadMcpServerUserConfig's merge would let the stale secureStorage
    // value win on next read.
    // storage读取`getSecureStorage`，供插件管理后续处理使用。
    const storage = getSecureStorage()
    // k保存`serverSecretsKey`，供插件管理后续处理使用。
    const k = serverSecretsKey(pluginId, serverName)
    // existingInSecureStorage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const existingInSecureStorage =
      storage.read()?.pluginSecrets?.[k] ?? undefined
    // secureScrubbed保存`existingInSecureStorage`，供后续判断或组装使用。
    const secureScrubbed = existingInSecureStorage
      ? Object.fromEntries(
          Object.entries(existingInSecureStorage).filter(
            // 这个回调绑定到 ([key]) => !nonSensitiveKeysInThisSave.has(key),，负责插件管理在该局部场景下的响应。
            ([key]) => !nonSensitiveKeysInThisSave.has(key),
          ),
        )
      : undefined
    // needSecureScrub 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const needSecureScrub =
      secureScrubbed &&
      existingInSecureStorage &&
      Object.keys(secureScrubbed).length !==
        Object.keys(existingInSecureStorage).length
    // 只有 `Object.keys(sensitive).length > 0 || needSecureScrub` 满足时，插件管理才执行该分支。
    if (Object.keys(sensitive).length > 0 || needSecureScrub) {
      // existing读取`storage.read`，供插件管理后续处理使用。
      const existing = storage.read() ?? {}
      // existing.pluginSecrets 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!existing.pluginSecrets) {
        // pluginSecrets 插件数据更新为 `{}`，确保插件工具后续读取最新状态。
        existing.pluginSecrets = {}
      }
      // secureStorage keyvault is a flat object — direct replace, no merge
      // semantics to worry about (unlike settings.json's mergeWith).
      // pluginSecrets[k 插件数据更新为 `{`，确保插件工具 mcpb Handler后续读取最新状态。
      existing.pluginSecrets[k] = {
        ...secureScrubbed,
        ...sensitive,
      }
      // 结果保存`storage.update`，供插件管理后续处理使用。
      const result = storage.update(existing)
      // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!result.success) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Failed to save sensitive config to secure storage for ${k}`,
        )
      }
      // 满足 `result.warning` 时，插件管理执行该分支。
      if (result.warning) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Server secrets save warning: ${result.warning}`, {
          level: 'warn',
        })
      }
      // 满足 `needSecureScrub` 时，插件管理执行该分支。
      if (needSecureScrub) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `saveMcpServerUserConfig: scrubbed ${
            Object.keys(existingInSecureStorage!).length -
            Object.keys(secureScrubbed!).length
          } stale non-sensitive key(s) from secureStorage for ${k}`,
        )
      }
    }

    // Non-sensitive → settings.json. Write whenever there are new non-sensitive
    // values OR existing plaintext sensitive values to scrub — so reconfiguring
    // a sensitive-only schema still cleans up the old settings.json. Runs
    // AFTER the secureStorage write succeeded, so the scrub can't leave you
    // with zero copies of the secret.
    //
    // updateSettingsForSource does mergeWith(diskSettings, ourSettings, ...)
    // which PRESERVES destination keys absent from source — so simply omitting
    // sensitive keys doesn't scrub them, the disk copy merges back in. Instead:
    // set each sensitive key to explicit `undefined` — mergeWith (with the
    // customizer at settings.ts:349) treats explicit undefined as a delete.
    // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
    const settings = getSettings_DEPRECATED()
    // existingInSettings 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const existingInSettings =
      settings.pluginConfigs?.[pluginId]?.mcpServers?.[serverName] ?? {}
    // keysToScrubFromSettings 集合派生`Object.keys`，供插件管理后续处理使用。
    const keysToScrubFromSettings = Object.keys(existingInSettings).filter(k =>
      sensitiveKeysInThisSave.has(k),
    )
    // 插件管理在这里按实际状态进入对应分支。
    if (
      Object.keys(nonSensitive).length > 0 ||
      keysToScrubFromSettings.length > 0
    ) {
      // settings.pluginConfigs 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!settings.pluginConfigs) {
        // pluginConfigs 插件数据更新为 `{}`，确保插件工具后续读取最新状态。
        settings.pluginConfigs = {}
      }
      // 满足 `!settings.pluginConfigs[pluginId]` 时，插件管理执行该分支。
      if (!settings.pluginConfigs[pluginId]) {
        // pluginConfigs[pluginId 插件数据更新为 `{}`，确保插件工具 mcpb Handler后续读取最新状态。
        settings.pluginConfigs[pluginId] = {}
      }
      // 满足 `!settings.pluginConfigs[pluginId].mcpServers` 时，插件管理执行该分支。
      if (!settings.pluginConfigs[pluginId].mcpServers) {
        // mcpServers 集合更新为 `{}`，确保插件工具 mcpb Handler后续读取最新状态。
        settings.pluginConfigs[pluginId].mcpServers = {}
      }
      // Build the scrub-via-undefined map. The UserConfigValues type doesn't
      // include undefined, but updateSettingsForSource's mergeWith customizer
      // needs explicit undefined to delete — cast is deliberate internal
      // plumbing (same rationale as deletePluginOptions in
      // pluginOptionsStorage.ts:184, see CLAUDE.md's 10% case).
      // scrubbed保存`Object.fromEntries`，供插件管理后续处理使用。
      const scrubbed = Object.fromEntries(
        // 调用 keysToScrubFromSettings.map，触发插件管理此处需要的副作用。
        keysToScrubFromSettings.map(k => [k, undefined]),
      ) as Record<string, undefined>
      // 插件工具 mcpb Handler在这里处理 `settings.pluginConfigs[pluginId].mcpServers![serverName] = {`，完成这一小步状态转换。
      settings.pluginConfigs[pluginId].mcpServers![serverName] = {
        ...nonSensitive,
        ...scrubbed,
      } as UserConfigValues
      // 结果保存`updateSettingsForSource`，供插件管理后续处理使用。
      const result = updateSettingsForSource('userSettings', settings)
      // 满足 `result.error` 时，插件管理执行该分支。
      if (result.error) {
        // 抛出 result.error，阻止插件管理在无效状态下继续运行。
        throw result.error
      }
      // 满足 `keysToScrubFromSettings.length > 0` 时，插件管理执行该分支。
      if (keysToScrubFromSettings.length > 0) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `saveMcpServerUserConfig: scrubbed ${keysToScrubFromSettings.length} plaintext sensitive key(s) from settings.json for ${pluginId}/${serverName}`,
        )
      }
    }

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Saved user config for ${pluginId}/${serverName} (${Object.keys(nonSensitive).length} non-sensitive, ${Object.keys(sensitive).length} sensitive)`,
    )
  } catch (error) {
    // errorObj 错误信息保存`toError`，供插件管理后续处理使用。
    const errorObj = toError(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(errorObj)
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Failed to save user configuration for ${pluginId}/${serverName}: ${errorObj.message}`,
    )
  }
}

/**
 * Validate user configuration values against DXT user_config schema
 */
// validateUserConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateUserConfig(
  values: UserConfigValues,
  schema: UserConfigSchema,
): { valid: boolean; errors: string[] } {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: string[] = []

  // Check each field in the schema
  // 循环处理 `const [key, fieldSchema] of Object.entries(schema)`，让插件管理把同类条目按顺序走完。
  for (const [key, fieldSchema] of Object.entries(schema)) {
    // 取值读取 `values[key]` 对应条目，后续围绕该成员继续处理。
    const value = values[key]

    // Check required fields
    // 只有 `fieldSchema.required && (value === undefined || value === '')` 满足时，插件管理才执行该分支。
    if (fieldSchema.required && (value === undefined || value === '')) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`${fieldSchema.title || key} is required but not provided`)
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Skip validation for optional fields that aren't provided
    // 只有 `value === undefined || value === ''` 满足时，插件管理才执行该分支。
    if (value === undefined || value === '') {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Type validation
    // 当 `fieldSchema.type` 匹配 `'string'` 时，插件管理执行对应分支。
    if (fieldSchema.type === 'string') {
      // 满足 `Array.isArray(value)` 时，插件管理执行该分支。
      if (Array.isArray(value)) {
        // String arrays are allowed if multiple: true
        // fieldSchema.multiple缺失时直接走兜底路径，避免插件管理使用无效输入。
        if (!fieldSchema.multiple) {
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push(
            `${fieldSchema.title || key} must be a string, not an array`,
          )
        // 这个回调绑定到 } else if (!value.every(v => typeof v === 'string')) {，负责插件管理在该局部场景下的响应。
        } else if (!value.every(v => typeof v === 'string')) {
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push(`${fieldSchema.title || key} must be an array of strings`)
        }
      // 插件工具 mcpb Handler在这里处理 `} else if (typeof value !== 'string') {`，完成这一小步状态转换。
      } else if (typeof value !== 'string') {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push(`${fieldSchema.title || key} must be a string`)
      }
    // 插件工具 mcpb Handler在这里处理 `} else if (fieldSchema.type === 'number' && typeof value !== 'number') {`，完成这一小步状态转换。
    } else if (fieldSchema.type === 'number' && typeof value !== 'number') {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`${fieldSchema.title || key} must be a number`)
    // 插件工具 mcpb Handler在这里处理 `} else if (fieldSchema.type === 'boolean' && typeof value !== 'boolean'...`，完成这一小步状态转换。
    } else if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`${fieldSchema.title || key} must be a boolean`)
    // 插件工具 mcpb Handler在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      (fieldSchema.type === 'file' || fieldSchema.type === 'directory') &&
      typeof value !== 'string'
    ) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`${fieldSchema.title || key} must be a path string`)
    }

    // Number range validation
    // 只有 `fieldSchema.type === 'number' && typeof value ===` 满足时，插件管理才执行该分支。
    if (fieldSchema.type === 'number' && typeof value === 'number') {
      // `fieldSchema.min` 与 `undefined && value < fieldSch` 不一致时刷新派生状态，避免使用过期结果。
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push(
          `${fieldSchema.title || key} must be at least ${fieldSchema.min}`,
        )
      }
      // `fieldSchema.max` 与 `undefined && value > fieldSch` 不一致时刷新派生状态，避免使用过期结果。
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push(
          `${fieldSchema.title || key} must be at most ${fieldSchema.max}`,
        )
      }
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { valid: errors.length === 0, errors }
}

/**
 * Generate MCP server configuration from DXT manifest
 */
// generateMcpConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generateMcpConfig(
  manifest: McpbManifest,
  extractedPath: string,
  userConfig: UserConfigValues = {},
): Promise<McpServerConfig> {
  // Lazy import: @anthropic-ai/mcpb barrel pulls in zod v3 schemas (~700KB of
  // bound closures). See dxt/helpers.ts for details.
  // 从 `await import('@anthropic-ai/mcpb')` 解构 getMcpConfigForManifest，减少插件工具 mcpb Handler对同一对象的重复访问。
  const { getMcpConfigForManifest } = await import('@anthropic-ai/mcpb')
  // mcpConfig 配置读取`getMcpConfigForManifest`，供插件管理后续处理使用。
  const mcpConfig = await getMcpConfigForManifest({
    manifest,
    extensionPath: extractedPath,
    systemDirs: getSystemDirectories(),
    userConfig,
    pathSeparator: '/',
  })

  // mcpConfig 配置缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!mcpConfig) {
    // 错误保存`Error`，供插件管理后续处理使用。
    const error = new Error(
      `Failed to generate MCP server configuration from manifest "${manifest.name}"`,
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }

  // 返回 `mcpConfig as McpServerConfig`，作为插件管理这次计算的结果。
  return mcpConfig as McpServerConfig
}

/**
 * Load cache metadata for an MCPB source
 */
// loadCacheMetadata 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadCacheMetadata(
  cacheDir: string,
  source: string,
): Promise<McpbCacheMetadata | null> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // metadataPath 路径数据读取`getMetadataPath`，供插件管理后续处理使用。
  const metadataPath = getMetadataPath(cacheDir, source)

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(metadataPath, { encoding: 'utf-8' })
    // 返回 `jsonParse(content) as McpbCacheMetadata`，作为插件管理这次计算的结果。
    return jsonParse(content) as McpbCacheMetadata
  } catch (error) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') return null
    // errorObj 错误信息保存`toError`，供插件管理后续处理使用。
    const errorObj = toError(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(errorObj)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load MCPB cache metadata: ${error}`, {
      level: 'error',
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Save cache metadata for an MCPB source
 */
// saveCacheMetadata 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveCacheMetadata(
  cacheDir: string,
  source: string,
  metadata: McpbCacheMetadata,
): Promise<void> {
  // metadataPath 路径数据读取`getMetadataPath`，供插件管理后续处理使用。
  const metadataPath = getMetadataPath(cacheDir, source)

  // 等待 `getFsImplementation().mkdir(cacheDir)` 完成，再继续插件工具 mcpb Handler的异步流程。
  await getFsImplementation().mkdir(cacheDir)
  // 等待 `writeFile(metadataPath, jsonStringify(metadata, null, 2), 'utf-8')` 完成，再继续插件工具 mcpb Handler的异步流程。
  await writeFile(metadataPath, jsonStringify(metadata, null, 2), 'utf-8')
}

/**
 * Download MCPB file from URL
 */
// downloadMcpb 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function downloadMcpb(
  url: string,
  destPath: string,
  onProgress?: ProgressCallback,
): Promise<Uint8Array> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Downloading MCPB from ${url}`)
  // 满足 `onProgress` 时，插件管理执行该分支。
  if (onProgress) {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress(`Downloading ${url}...`)
  }

  // started记录时间`performance.now`，供插件管理后续处理使用。
  const started = performance.now()
  // fetchTelemetryFired标记插件工具 mcpb Handler是否启用对应路径。
  let fetchTelemetryFired = false
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`axios.get`，供插件管理后续处理使用。
    const response = await axios.get(url, {
      timeout: 120000, // 2 minute timeout
      responseType: 'arraybuffer',
      maxRedirects: 5, // Follow redirects (like curl -L)
      // 这个回调绑定到 onDownloadProgress: progressEvent => {，负责插件管理在该局部场景下的响应。
      onDownloadProgress: progressEvent => {
        // 只有 `progressEvent.total && onProgress` 满足时，插件管理才执行该分支。
        if (progressEvent.total && onProgress) {
          // percent保存`Math.round`，供插件管理后续处理使用。
          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          )
          // 调用 onProgress，触发插件管理此处需要的副作用。
          onProgress(`Downloading... ${percent}%`)
        }
      },
    })

    // data保存`Uint8Array`，供插件管理后续处理使用。
    const data = new Uint8Array(response.data)
    // Fire telemetry before writeFile — the event measures the network
    // fetch, not disk I/O. A writeFile EACCES would otherwise match
    // classifyFetchError's /permission denied/ → misreport as auth.
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch('mcpb', url, 'success', performance.now() - started)
    // fetchTelemetryFired更新为 `true`，确保插件工具后续读取最新状态。
    fetchTelemetryFired = true

    // Save to disk (binary data)
    // 等待 `writeFile(destPath, Buffer.from(data))` 完成，再继续插件工具 mcpb Handler的异步流程。
    await writeFile(destPath, Buffer.from(data))

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Downloaded ${data.length} bytes to ${destPath}`)
    // 满足 `onProgress` 时，插件管理执行该分支。
    if (onProgress) {
      // 调用 onProgress，触发插件管理此处需要的副作用。
      onProgress('Download complete')
    }

    // 返回 `data`，作为插件管理这次计算的结果。
    return data
  } catch (error) {
    // fetchTelemetryFired缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!fetchTelemetryFired) {
      // 调用 logPluginFetch，触发插件管理此处需要的副作用。
      logPluginFetch(
        'mcpb',
        url,
        'failure',
        performance.now() - started,
        classifyFetchError(error),
      )
    }
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // fullError 错误信息保存`Error`，供插件管理后续处理使用。
    const fullError = new Error(
      `Failed to download MCPB file from ${url}: ${errorMsg}`,
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(fullError)
    // 抛出 fullError，阻止插件管理在无效状态下继续运行。
    throw fullError
  }
}

/**
 * Extract MCPB file and write contents to extraction directory.
 *
 * @param modes - name→mode map from `parseZipModes`. MCPB bundles can ship
 *   native MCP server binaries, so preserving the exec bit matters here.
 */
// extractMcpbContents 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function extractMcpbContents(
  unzipped: Record<string, Uint8Array>,
  extractPath: string,
  modes: Record<string, number>,
  onProgress?: ProgressCallback,
): Promise<void> {
  // 满足 `onProgress` 时，插件管理执行该分支。
  if (onProgress) {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress('Extracting files...')
  }

  // Create extraction directory
  // 等待 `getFsImplementation().mkdir(extractPath)` 完成，再继续插件工具 mcpb Handler的异步流程。
  await getFsImplementation().mkdir(extractPath)

  // Write all files. Filter directory entries from the count so progress
  // messages use the same denominator as filesWritten (which skips them).
  // filesWritten 文件数据 命名 `0`，让后续代码直接表达这个值的用途。
  let filesWritten = 0
  // entries 集合派生`Object.entries`，供插件管理后续处理使用。
  const entries = Object.entries(unzipped).filter(([k]) => !k.endsWith('/'))
  // totalFiles 文件数据保存 `entries.length` 的判断结果，供插件工具 mcpb Handler后续分支直接复用。
  const totalFiles = entries.length

  // 循环处理 `const [filePath, fileData] of entries`，让插件管理逐项把同类条目按顺序走完。
  for (const [filePath, fileData] of entries) {
    // Directory entries (common in zip -r, Python zipfile, Java ZipOutputStream)
    // are filtered above — writeFile would create `bin/` as an empty regular
    // file, then mkdir for `bin/server` would fail with ENOTDIR. The
    // mkdir(dirname(fullPath)) below creates parent dirs implicitly.

    // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
    const fullPath = join(extractPath, filePath)
    // dir保存`dirname`，供插件管理后续处理使用。
    const dir = dirname(fullPath)

    // Ensure directory exists (recursive handles already-existing)
    // `dir` 与 `extractPath` 不一致时刷新派生状态，避免使用过期结果。
    if (dir !== extractPath) {
      // 等待 `getFsImplementation().mkdir(dir)` 完成，再继续插件工具 mcpb Handler的异步流程。
      await getFsImplementation().mkdir(dir)
    }

    // Determine if text or binary
    // isTextFile 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isTextFile =
      filePath.endsWith('.json') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.ts') ||
      filePath.endsWith('.txt') ||
      filePath.endsWith('.md') ||
      filePath.endsWith('.yml') ||
      filePath.endsWith('.yaml')

    // 满足 `isTextFile` 时，插件管理执行该分支。
    if (isTextFile) {
      // 文本内容保存`TextDecoder`，供插件管理后续处理使用。
      const content = new TextDecoder().decode(fileData)
      // 等待 `writeFile(fullPath, content, 'utf-8')` 完成，再继续插件工具 mcpb Handler的异步流程。
      await writeFile(fullPath, content, 'utf-8')
    } else {
      // 等待 `writeFile(fullPath, Buffer.from(fileData))` 完成，再继续插件工具 mcpb Handler的异步流程。
      await writeFile(fullPath, Buffer.from(fileData))
    }

    // mode读取 `modes[filePath]` 对应条目，后续围绕该成员继续处理。
    const mode = modes[filePath]
    // 只有 `mode && mode & 0o111` 满足时，插件管理才执行该分支。
    if (mode && mode & 0o111) {
      // Swallow EPERM/ENOTSUP (NFS root_squash, some FUSE mounts) — losing +x
      // is the pre-PR behavior and better than aborting mid-extraction.
      // 这个回调绑定到 await chmod(fullPath, mode & 0o777).catch(() => {})，负责插件管理在该局部场景下的响应。
      await chmod(fullPath, mode & 0o777).catch(() => {})
    }

    // 插件工具 mcpb Handler在这里处理 `filesWritten++`，完成这一小步状态转换。
    filesWritten++
    // 只有 `onProgress && filesWritten % 10 === 0` 满足时，插件管理才执行该分支。
    if (onProgress && filesWritten % 10 === 0) {
      // 调用 onProgress，触发插件管理此处需要的副作用。
      onProgress(`Extracted ${filesWritten}/${totalFiles} files`)
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Extracted ${filesWritten} files to ${extractPath}`)
  // 满足 `onProgress` 时，插件管理执行该分支。
  if (onProgress) {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress(`Extraction complete (${filesWritten} files)`)
  }
}

/**
 * Check if an MCPB source has changed and needs re-extraction
 */
// checkMcpbChanged 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkMcpbChanged(
  source: string,
  pluginPath: string,
): Promise<boolean> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // cacheDir 缓存读取`getMcpbCacheDir`，供插件管理后续处理使用。
  const cacheDir = getMcpbCacheDir(pluginPath)
  // metadata读取`loadCacheMetadata`，供插件管理后续处理使用。
  const metadata = await loadCacheMetadata(cacheDir, source)

  // metadata缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!metadata) {
    // No cache metadata, needs loading
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check if extraction directory still exists
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.stat(metadata.extractedPath)` 完成，再继续插件工具 mcpb Handler的异步流程。
    await fs.stat(metadata.extractedPath)
  } catch (error) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`MCPB extraction path missing: ${metadata.extractedPath}`)
    } else {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `MCPB extraction path inaccessible: ${metadata.extractedPath}: ${error}`,
        { level: 'error' },
      )
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // For local files, check mtime
  // 满足 `!isUrl(source)` 时，插件管理执行该分支。
  if (!isUrl(source)) {
    // localPath 路径数据格式化`join`，供插件管理后续处理使用。
    const localPath = join(pluginPath, source)
    // stats 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let stats
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合更新为 `await fs.stat(localPath)`，确保插件工具后续读取最新状态。
      stats = await fs.stat(localPath)
    } catch (error) {
      // code读取`getErrnoCode`，供插件管理后续处理使用。
      const code = getErrnoCode(error)
      // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
      if (code === 'ENOENT') {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`MCPB source file missing: ${localPath}`)
      } else {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `MCPB source file inaccessible: ${localPath}: ${error}`,
          { level: 'error' },
        )
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // cachedTime 缓存记录时间`Date`，供插件管理后续处理使用。
    const cachedTime = new Date(metadata.cachedAt).getTime()
    // Floor to match the ms precision of cachedAt (ISO string). Sub-ms
    // precision on mtimeMs would make a freshly-cached file appear "newer"
    // than its own cache timestamp when both happen in the same millisecond.
    // fileTime 文件数据保存`Math.floor`，供插件管理后续处理使用。
    const fileTime = Math.floor(stats.mtimeMs)

    // 满足 `fileTime > cachedTime` 时，插件管理执行该分支。
    if (fileTime > cachedTime) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `MCPB file modified: ${new Date(fileTime)} > ${new Date(cachedTime)}`,
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // For URLs, we'll re-check on explicit update (handled elsewhere)
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Load and extract an MCPB file, with caching and user configuration support
 *
 * @param source - MCPB file path or URL
 * @param pluginPath - Plugin directory path
 * @param pluginId - Plugin identifier in "plugin@marketplace" format (for config storage)
 * @param onProgress - Progress callback
 * @param providedUserConfig - User configuration values (for initial setup or reconfiguration)
 * @returns Success with MCP config, or needs-config status with schema
 */
// loadMcpbFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadMcpbFile(
  source: string,
  pluginPath: string,
  pluginId: string,
  onProgress?: ProgressCallback,
  providedUserConfig?: UserConfigValues,
  forceConfigDialog?: boolean,
): Promise<McpbLoadResult | McpbNeedsConfigResult> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // cacheDir 缓存读取`getMcpbCacheDir`，供插件管理后续处理使用。
  const cacheDir = getMcpbCacheDir(pluginPath)
  // 等待 `fs.mkdir(cacheDir)` 完成，再继续插件工具 mcpb Handler的异步流程。
  await fs.mkdir(cacheDir)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Loading MCPB from source: ${source}`)

  // Check cache first
  // metadata读取`loadCacheMetadata`，供插件管理后续处理使用。
  const metadata = await loadCacheMetadata(cacheDir, source)
  // 只有 `metadata && !(await checkMcpbChanged(source, pluginPath))` 满足时，插件管理才执行该分支。
  if (metadata && !(await checkMcpbChanged(source, pluginPath))) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using cached MCPB from ${metadata.extractedPath} (hash: ${metadata.contentHash})`,
    )

    // Load manifest from cache
    // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
    const manifestPath = join(metadata.extractedPath, 'manifest.json')
    // manifestContent 先占位，稍后的条件分支会根据实际输入补齐它。
    let manifestContent: string
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // manifestContent更新为 `await fs.readFile(manifestPath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
      manifestContent = await fs.readFile(manifestPath, { encoding: 'utf-8' })
    } catch (error) {
      // 满足 `isENOENT(error)` 时，插件管理执行该分支。
      if (isENOENT(error)) {
        // err保存`Error`，供插件管理后续处理使用。
        const err = new Error(`Cached manifest not found: ${manifestPath}`)
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(err)
        // 抛出 err，阻止插件管理在无效状态下继续运行。
        throw err
      }
      // 抛出 error，阻止插件管理在无效状态下继续运行。
      throw error
    }

    // manifestData保存`TextEncoder`，供插件管理后续处理使用。
    const manifestData = new TextEncoder().encode(manifestContent)
    // manifest解析`parseAndValidateManifestFromBytes`，供插件管理后续处理使用。
    const manifest = await parseAndValidateManifestFromBytes(manifestData)

    // Check for user_config requirement
    // 只有 `manifest.user_config && Object.keys(manifest.user_config).length > 0` 满足时，插件管理才执行该分支。
    if (manifest.user_config && Object.keys(manifest.user_config).length > 0) {
      // Server name from DXT manifest
      // serverName保存`manifest.name`，供插件工具 mcpb Handler后续判断或输出使用。
      const serverName = manifest.name

      // Try to load existing config from settings.json or use provided config
      // savedConfig 配置读取`loadMcpServerUserConfig`，供插件管理后续处理使用。
      const savedConfig = loadMcpServerUserConfig(pluginId, serverName)
      // userConfig 配置标记插件工具 mcpb Handler是否启用对应路径。
      const userConfig = providedUserConfig || savedConfig || {}

      // Validate we have all required fields
      // validation读取`validateUserConfig`，供插件管理后续处理使用。
      const validation = validateUserConfig(userConfig, manifest.user_config)

      // Return needs-config if: forced (reconfiguration) OR validation failed
      // 只有 `forceConfigDialog || !validation.valid` 满足时，插件管理才执行该分支。
      if (forceConfigDialog || !validation.valid) {
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return {
          status: 'needs-config',
          manifest,
          extractedPath: metadata.extractedPath,
          contentHash: metadata.contentHash,
          configSchema: manifest.user_config,
          existingConfig: savedConfig || {},
          validationErrors: validation.valid ? [] : validation.errors,
        }
      }

      // Save config if it was provided (first time or reconfiguration)
      // 满足 `providedUserConfig` 时，插件管理执行该分支。
      if (providedUserConfig) {
        // 调用 saveMcpServerUserConfig，触发插件管理此处需要的副作用。
        saveMcpServerUserConfig(
          pluginId,
          serverName,
          providedUserConfig,
          manifest.user_config ?? {},
        )
      }

      // Generate MCP config WITH user config
      // mcpConfig 配置保存`generateMcpConfig`，供插件管理后续处理使用。
      const mcpConfig = await generateMcpConfig(
        manifest,
        metadata.extractedPath,
        userConfig,
      )

      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        manifest,
        mcpConfig,
        extractedPath: metadata.extractedPath,
        contentHash: metadata.contentHash,
      }
    }

    // No user_config required - generate config without it
    // mcpConfig 配置保存`generateMcpConfig`，供插件管理后续处理使用。
    const mcpConfig = await generateMcpConfig(manifest, metadata.extractedPath)

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      manifest,
      mcpConfig,
      extractedPath: metadata.extractedPath,
      contentHash: metadata.contentHash,
    }
  }

  // Not cached or changed - need to download/load and extract
  // mcpbData 先占位，稍后的条件分支会根据实际输入补齐它。
  let mcpbData: Uint8Array
  // mcpbFilePath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let mcpbFilePath: string

  // 满足 `isUrl(source)` 时，插件管理执行该分支。
  if (isUrl(source)) {
    // Download from URL
    // sourceHash构建`createHash`，供插件管理后续处理使用。
    const sourceHash = createHash('md5')
      .update(source)
      .digest('hex')
      .substring(0, 8)
    // mcpbFilePath 路径数据更新为 `join(cacheDir, `${sourceHash}.mcpb`)`，确保插件工具后续读取最新状态。
    mcpbFilePath = join(cacheDir, `${sourceHash}.mcpb`)
    // mcpbData更新为 `await downloadMcpb(source, mcpbFilePath, onProgress)`，确保插件工具后续读取最新状态。
    mcpbData = await downloadMcpb(source, mcpbFilePath, onProgress)
  } else {
    // Load from local path
    // localPath 路径数据格式化`join`，供插件管理后续处理使用。
    const localPath = join(pluginPath, source)

    // 满足 `onProgress` 时，插件管理执行该分支。
    if (onProgress) {
      // 调用 onProgress，触发插件管理此处需要的副作用。
      onProgress(`Loading ${source}...`)
    }

    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // mcpbData更新为 `await fs.readFileBytes(localPath)`，确保插件工具后续读取最新状态。
      mcpbData = await fs.readFileBytes(localPath)
      // mcpbFilePath 路径数据更新为 `localPath`，确保插件工具后续读取最新状态。
      mcpbFilePath = localPath
    } catch (error) {
      // 满足 `isENOENT(error)` 时，插件管理执行该分支。
      if (isENOENT(error)) {
        // err保存`Error`，供插件管理后续处理使用。
        const err = new Error(`MCPB file not found: ${localPath}`)
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(err)
        // 抛出 err，阻止插件管理在无效状态下继续运行。
        throw err
      }
      // 抛出 error，阻止插件管理在无效状态下继续运行。
      throw error
    }
  }

  // Generate content hash
  // contentHash保存`generateContentHash`，供插件管理后续处理使用。
  const contentHash = generateContentHash(mcpbData)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`MCPB content hash: ${contentHash}`)

  // Extract ZIP
  // 满足 `onProgress` 时，插件管理执行该分支。
  if (onProgress) {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress('Extracting MCPB archive...')
  }

  // unzipped保存`unzipFile`，供插件管理后续处理使用。
  const unzipped = await unzipFile(Buffer.from(mcpbData))
  // fflate doesn't surface external_attr — parse the central directory so
  // native MCP server binaries keep their exec bit after extraction.
  // modes 集合解析`parseZipModes`，供插件管理后续处理使用。
  const modes = parseZipModes(mcpbData)

  // Check for manifest.json
  // manifestData保存`unzipped['manifest.json']`，供插件工具 mcpb Handler后续判断或输出使用。
  const manifestData = unzipped['manifest.json']
  // manifestData缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!manifestData) {
    // 错误保存`Error`，供插件管理后续处理使用。
    const error = new Error('No manifest.json found in MCPB file')
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }

  // Parse and validate manifest
  // manifest解析`parseAndValidateManifestFromBytes`，供插件管理后续处理使用。
  const manifest = await parseAndValidateManifestFromBytes(manifestData)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `MCPB manifest: ${manifest.name} v${manifest.version} by ${manifest.author.name}`,
  )

  // Check if manifest has server config
  // manifest.server缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!manifest.server) {
    // 错误保存`Error`，供插件管理后续处理使用。
    const error = new Error(
      `MCPB manifest for "${manifest.name}" does not define a server configuration`,
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }

  // Extract to cache directory
  // extractPath 路径数据格式化`join`，供插件管理后续处理使用。
  const extractPath = join(cacheDir, contentHash)
  // 等待 `extractMcpbContents(unzipped, extractPath, modes, onProgress)` 完成，再继续插件工具 mcpb Handler的异步流程。
  await extractMcpbContents(unzipped, extractPath, modes, onProgress)

  // Check for user_config requirement
  // 只有 `manifest.user_config && Object.keys(manifest.user_config).length > 0` 满足时，插件管理才执行该分支。
  if (manifest.user_config && Object.keys(manifest.user_config).length > 0) {
    // Server name from DXT manifest
    // serverName保存`manifest.name`，供插件工具 mcpb Handler后续判断或输出使用。
    const serverName = manifest.name

    // Try to load existing config from settings.json or use provided config
    // savedConfig 配置读取`loadMcpServerUserConfig`，供插件管理后续处理使用。
    const savedConfig = loadMcpServerUserConfig(pluginId, serverName)
    // userConfig 配置标记插件工具 mcpb Handler是否启用对应路径。
    const userConfig = providedUserConfig || savedConfig || {}

    // Validate we have all required fields
    // validation读取`validateUserConfig`，供插件管理后续处理使用。
    const validation = validateUserConfig(userConfig, manifest.user_config)

    // validation.valid缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!validation.valid) {
      // Save cache metadata even though config is incomplete
      // newMetadata 集中保存插件工具 mcpb Handler要一起传递的字段。
      const newMetadata: McpbCacheMetadata = {
        source,
        contentHash,
        extractedPath: extractPath,
        cachedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
      }
      // 等待 `saveCacheMetadata(cacheDir, source, newMetadata)` 完成，再继续插件工具 mcpb Handler的异步流程。
      await saveCacheMetadata(cacheDir, source, newMetadata)

      // Return "needs configuration" status
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        status: 'needs-config',
        manifest,
        extractedPath: extractPath,
        contentHash,
        configSchema: manifest.user_config,
        existingConfig: savedConfig || {},
        validationErrors: validation.errors,
      }
    }

    // Save config if it was provided (first time or reconfiguration)
    // 满足 `providedUserConfig` 时，插件管理执行该分支。
    if (providedUserConfig) {
      // 调用 saveMcpServerUserConfig，触发插件管理此处需要的副作用。
      saveMcpServerUserConfig(
        pluginId,
        serverName,
        providedUserConfig,
        manifest.user_config ?? {},
      )
    }

    // Generate MCP config WITH user config
    // 满足 `onProgress` 时，插件管理执行该分支。
    if (onProgress) {
      // 调用 onProgress，触发插件管理此处需要的副作用。
      onProgress('Generating MCP server configuration...')
    }

    // mcpConfig 配置保存`generateMcpConfig`，供插件管理后续处理使用。
    const mcpConfig = await generateMcpConfig(manifest, extractPath, userConfig)

    // Save cache metadata
    // newMetadata 集中保存插件工具 mcpb Handler要一起传递的字段。
    const newMetadata: McpbCacheMetadata = {
      source,
      contentHash,
      extractedPath: extractPath,
      cachedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
    }
    // 等待 `saveCacheMetadata(cacheDir, source, newMetadata)` 完成，再继续插件工具 mcpb Handler的异步流程。
    await saveCacheMetadata(cacheDir, source, newMetadata)

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      manifest,
      mcpConfig,
      extractedPath: extractPath,
      contentHash,
    }
  }

  // No user_config required - generate config without it
  // 满足 `onProgress` 时，插件管理执行该分支。
  if (onProgress) {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress('Generating MCP server configuration...')
  }

  // mcpConfig 配置保存`generateMcpConfig`，供插件管理后续处理使用。
  const mcpConfig = await generateMcpConfig(manifest, extractPath)

  // Save cache metadata
  // newMetadata 集中保存插件工具 mcpb Handler要一起传递的字段。
  const newMetadata: McpbCacheMetadata = {
    source,
    contentHash,
    extractedPath: extractPath,
    cachedAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
  }
  // 等待 `saveCacheMetadata(cacheDir, source, newMetadata)` 完成，再继续插件工具 mcpb Handler的异步流程。
  await saveCacheMetadata(cacheDir, source, newMetadata)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Successfully loaded MCPB: ${manifest.name} (extracted to ${extractPath})`,
  )

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    manifest,
    mcpConfig: mcpConfig as McpServerConfig,
    extractedPath: extractPath,
    contentHash,
  }
}
