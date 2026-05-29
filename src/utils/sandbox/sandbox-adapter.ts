/**
 * Adapter layer that wraps @anthropic-ai/sandbox-runtime with Claude CLI-specific integrations.
 * This file provides the bridge between the external sandbox-runtime package and Claude CLI's
 * settings system, tool integration, and additional features.
 */

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  IgnoreViolationsConfig,
  NetworkHostPattern,
  NetworkRestrictionConfig,
  SandboxAskCallback,
  SandboxDependencyCheck,
  SandboxRuntimeConfig,
  SandboxViolationEvent,
} from '@anthropic-ai/sandbox-runtime'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  SandboxManager as BaseSandboxManager,
  SandboxRuntimeConfigSchema,
  SandboxViolationStore,
} from '@anthropic-ai/sandbox-runtime'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { rmSync, statSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 引入 memoize，将 lodash-es 中已经封装好的能力接到本文件流程里。
import { memoize } from 'lodash-es'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, resolve, sep } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAdditionalDirectoriesForClaudeMd,
  getCwdState,
  getOriginalCwd,
} from '../../bootstrap/state.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 expandPath，将 ../path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from '../path.js'
// 引入 getPlatform、Platform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform, type Platform } from '../platform.js'
// 引入 settingsChangeDetector，将 ../settings/changeDetector.js 中已经封装好的能力接到本文件流程里。
import { settingsChangeDetector } from '../settings/changeDetector.js'
// 引入 SETTING_SOURCES、SettingSource，将 ../settings/constants.js 中已经封装好的能力接到本文件流程里。
import { SETTING_SOURCES, type SettingSource } from '../settings/constants.js'
// 引入 getManagedSettingsDropInDir，将 ../settings/managedPath.js 中已经封装好的能力接到本文件流程里。
import { getManagedSettingsDropInDir } from '../settings/managedPath.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettings_DEPRECATED,
  getSettingsFilePathForSource,
  getSettingsForSource,
  getSettingsRootPathForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 类型依赖 { SettingsJson } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { SettingsJson } from '../settings/types.js'

// ============================================================================
// Settings Converter
// ============================================================================

// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 getClaudeTempDir，将 ../permissions/filesystem.js 中已经封装好的能力接到本文件流程里。
import { getClaudeTempDir } from '../permissions/filesystem.js'
// 类型依赖 { PermissionRuleValue } 来自 ../permissions/PermissionRule.js，用于校准共享工具的数据契约。
import type { PermissionRuleValue } from '../permissions/PermissionRule.js'
// 引入 ripgrepCommand，将 ../ripgrep.js 中已经封装好的能力接到本文件流程里。
import { ripgrepCommand } from '../ripgrep.js'

// Local copies to avoid circular dependency
// (permissions.ts imports SandboxManager, bashPermissions.ts imports permissions.ts)
// permissionRuleValueFromString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function permissionRuleValueFromString(
  ruleString: string,
): PermissionRuleValue {
  // matches 集合匹配`ruleString.match`，供共享工具后续处理使用。
  const matches = ruleString.match(/^([^(]+)\(([^)]+)\)$/)
  // matches 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!matches) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { toolName: ruleString }
  }
  // toolName读取 `matches[1]` 对应条目，后续围绕该成员继续处理。
  const toolName = matches[1]
  // ruleContent读取 `matches[2]` 对应条目，后续围绕该成员继续处理。
  const ruleContent = matches[2]
  // 只有 `!toolName || !ruleContent` 满足时，共享工具才执行该分支。
  if (!toolName || !ruleContent) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { toolName: ruleString }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { toolName, ruleContent }
}

// permissionRuleExtractPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function permissionRuleExtractPrefix(permissionRule: string): string | null {
  // match匹配`permissionRule.match`，供共享工具后续处理使用。
  const match = permissionRule.match(/^(.+):\*$/)
  // 返回 `match?.[1] ?? null`，作为共享工具这次计算的结果。
  return match?.[1] ?? null
}

/**
 * Resolve Claude Code-specific path patterns for sandbox-runtime.
 *
 * Claude Code uses special path prefixes in permission rules:
 * - `//path` → absolute from filesystem root (becomes `/path`)
 * - `/path` → relative to settings file directory (becomes `$SETTINGS_DIR/path`)
 * - `~/path` → passed through (sandbox-runtime handles this)
 * - `./path` or `path` → passed through (sandbox-runtime handles this)
 *
 * This function only handles CC-specific conventions (`//` and `/`).
 * Standard path patterns like `~/` and relative paths are passed through
 * for sandbox-runtime's normalizePathForSandbox to handle.
 *
 * @param pattern The path pattern from a permission rule
 * @param source The settings source this pattern came from (needed to resolve `/path` patterns)
 */
// resolvePathPatternForSandbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolvePathPatternForSandbox(
  pattern: string,
  source: SettingSource,
): string {
  // Handle // prefix - absolute from root (CC-specific convention)
  // 满足 `pattern.startsWith('//')` 时，共享工具执行该分支。
  if (pattern.startsWith('//')) {
    // 返回 `pattern.slice(1) // "//.aws/**" → "/.aws/**"`，作为共享工具这次计算的结果。
    return pattern.slice(1) // "//.aws/**" → "/.aws/**"
  }

  // Handle / prefix - relative to settings file directory (CC-specific convention)
  // Note: ~/path and relative paths are passed through for sandbox-runtime to handle
  // 只有 `pattern.startsWith('/') && !pattern.startsWith('//')` 满足时，共享工具才执行该分支。
  if (pattern.startsWith('/') && !pattern.startsWith('//')) {
    // root读取`getSettingsRootPathForSource`，供共享工具后续处理使用。
    const root = getSettingsRootPathForSource(source)
    // Pattern like "/foo/**" becomes "${root}/foo/**"
    // 返回 `resolve(root, pattern.slice(1))`，作为共享工具这次计算的结果。
    return resolve(root, pattern.slice(1))
  }

  // Other patterns (~/path, ./path, path) pass through as-is
  // sandbox-runtime's normalizePathForSandbox will handle them
  // 返回 `pattern`，作为共享工具这次计算的结果。
  return pattern
}

/**
 * Resolve paths from sandbox.filesystem.* settings (allowWrite, denyWrite, etc).
 *
 * Unlike permission rules (Edit/Read), these settings use standard path semantics:
 * - `/path` → absolute path (as written, NOT settings-relative)
 * - `~/path` → expanded to home directory
 * - `./path` or `path` → relative to settings file directory
 * - `//path` → absolute (legacy permission-rule syntax, accepted for compat)
 *
 * Fix for #30067: resolvePathPatternForSandbox treats `/Users/foo/.cargo` as
 * settings-relative (permission-rule convention). Users reasonably expect
 * absolute paths in sandbox.filesystem.allowWrite to work as-is.
 *
 * Also expands `~` here rather than relying on sandbox-runtime, because
 * sandbox-runtime's getFsWriteConfig() does not call normalizePathForSandbox
 * on allowWrite paths (it only strips trailing glob suffixes).
 */
// resolveSandboxFilesystemPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveSandboxFilesystemPath(
  pattern: string,
  source: SettingSource,
): string {
  // Legacy permission-rule escape: //path → /path. Kept for compat with
  // users who worked around #30067 by writing //Users/foo/.cargo in config.
  // 满足 `pattern.startsWith('//')) return pattern.slice(1` 时，共享工具执行该分支。
  if (pattern.startsWith('//')) return pattern.slice(1)
  // 返回 `expandPath(pattern, getSettingsRootPathForSource(source))`，作为共享工具这次计算的结果。
  return expandPath(pattern, getSettingsRootPathForSource(source))
}

/**
 * Check if only managed sandbox domains should be used.
 * This is true when policySettings has sandbox.network.allowManagedDomainsOnly: true
 */
// shouldAllowManagedSandboxDomainsOnly 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAllowManagedSandboxDomainsOnly(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getSettingsForSource('policySettings')?.sandbox?.network
      ?.allowManagedDomainsOnly === true
  )
}

// shouldAllowManagedReadPathsOnly 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldAllowManagedReadPathsOnly(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getSettingsForSource('policySettings')?.sandbox?.filesystem
      ?.allowManagedReadPathsOnly === true
  )
}

/**
 * Convert Claude Code settings format to SandboxRuntimeConfig format
 * (Function exported for testing)
 *
 * @param settings Merged settings (used for sandbox config like network, ripgrep, etc.)
 */
// convertToSandboxRuntimeConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function convertToSandboxRuntimeConfig(
  settings: SettingsJson,
): SandboxRuntimeConfig {
  // permissions 权限数据标记共享工具 sandbox adapter是否启用对应路径。
  const permissions = settings.permissions || {}

  // Extract network domains from WebFetch rules
  // allowedDomains 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allowedDomains: string[] = []
  // deniedDomains 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const deniedDomains: string[] = []

  // When allowManagedSandboxDomainsOnly is enabled, only use domains from policy settings
  // 满足 `shouldAllowManagedSandboxDomainsOnly()` 时，共享工具执行该分支。
  if (shouldAllowManagedSandboxDomainsOnly()) {
    // policySettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const policySettings = getSettingsForSource('policySettings')
    // 调用 for，触发共享工具此处需要的副作用。
    for (const domain of policySettings?.sandbox?.network?.allowedDomains ||
      []) {
      // allowedDomains 集合追加新条目，保持收集顺序与输入顺序一致。
      allowedDomains.push(domain)
    }
    // 按顺序遍历 `policySettings?.permissions?.` 中的ruleString，逐个交给共享工具处理。
    for (const ruleString of policySettings?.permissions?.allow || []) {
      // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
      const rule = permissionRuleValueFromString(ruleString)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        rule.toolName === WEB_FETCH_TOOL_NAME &&
        rule.ruleContent?.startsWith('domain:')
      ) {
        // allowedDomains 集合追加新条目，保持收集顺序与输入顺序一致。
        allowedDomains.push(rule.ruleContent.substring('domain:'.length))
      }
    }
  } else {
    // 按顺序遍历 `settings.sandbox?.network?.allowe` 中的domain，逐个交给共享工具处理。
    for (const domain of settings.sandbox?.network?.allowedDomains || []) {
      // allowedDomains 集合追加新条目，保持收集顺序与输入顺序一致。
      allowedDomains.push(domain)
    }
    // 按顺序遍历 `permissions.allow || []` 中的ruleString，逐个交给共享工具处理。
    for (const ruleString of permissions.allow || []) {
      // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
      const rule = permissionRuleValueFromString(ruleString)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        rule.toolName === WEB_FETCH_TOOL_NAME &&
        rule.ruleContent?.startsWith('domain:')
      ) {
        // allowedDomains 集合追加新条目，保持收集顺序与输入顺序一致。
        allowedDomains.push(rule.ruleContent.substring('domain:'.length))
      }
    }
  }

  // 按顺序遍历 `permissions.deny || []` 中的ruleString，逐个交给共享工具处理。
  for (const ruleString of permissions.deny || []) {
    // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
    const rule = permissionRuleValueFromString(ruleString)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      rule.toolName === WEB_FETCH_TOOL_NAME &&
      rule.ruleContent?.startsWith('domain:')
    ) {
      // deniedDomains 集合追加新条目，保持收集顺序与输入顺序一致。
      deniedDomains.push(rule.ruleContent.substring('domain:'.length))
    }
  }

  // Extract filesystem paths from Edit and Read rules
  // Always include current directory and Claude temp directory as writable
  // The temp directory is needed for Shell.ts cwd tracking files
  // allowWrite 聚合成有序列表，保持后续遍历顺序稳定。
  const allowWrite: string[] = ['.', getClaudeTempDir()]
  // denyWrite 从空数组开始收集，后续循环会按处理顺序追加条目。
  const denyWrite: string[] = []
  // denyRead 从空数组开始收集，后续循环会按处理顺序追加条目。
  const denyRead: string[] = []
  // allowRead 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allowRead: string[] = []

  // Always deny writes to settings.json files to prevent sandbox escape
  // This blocks settings in the original working directory (where Claude Code started)
  // settingsPaths 路径数据派生`SETTING_SOURCES.map`，供共享工具后续处理使用。
  const settingsPaths = SETTING_SOURCES.map(source =>
    getSettingsFilePathForSource(source),
  // 这个回调绑定到 ).filter((p): p is string => p !== undefined)，负责共享工具在该局部场景下的响应。
  ).filter((p): p is string => p !== undefined)
  // denyWrite追加新条目，保持收集顺序与输入顺序一致。
  denyWrite.push(...settingsPaths)
  // denyWrite追加新条目，保持收集顺序与输入顺序一致。
  denyWrite.push(getManagedSettingsDropInDir())

  // Also block settings files in the current working directory if it differs from original
  // This handles the case where the user has cd'd to a different directory
  // cwd读取`getCwdState`，供共享工具后续处理使用。
  const cwd = getCwdState()
  // originalCwd读取`getOriginalCwd`，供共享工具后续处理使用。
  const originalCwd = getOriginalCwd()
  // `cwd` 与 `originalCwd` 不一致时刷新派生状态，避免使用过期结果。
  if (cwd !== originalCwd) {
    // denyWrite追加新条目，保持收集顺序与输入顺序一致。
    denyWrite.push(resolve(cwd, '.claude', 'settings.json'))
    // denyWrite追加新条目，保持收集顺序与输入顺序一致。
    denyWrite.push(resolve(cwd, '.claude', 'settings.local.json'))
  }

  // Block writes to .claude/skills in both original and current working directories.
  // The sandbox-runtime's getDangerousDirectories() protects .claude/commands and
  // .claude/agents but not .claude/skills. Skills have the same privilege level
  // (auto-discovered, auto-loaded, full Claude capabilities) so they need the
  // same OS-level sandbox protection.
  // denyWrite追加新条目，保持收集顺序与输入顺序一致。
  denyWrite.push(resolve(originalCwd, '.claude', 'skills'))
  // `cwd` 与 `originalCwd` 不一致时刷新派生状态，避免使用过期结果。
  if (cwd !== originalCwd) {
    // denyWrite追加新条目，保持收集顺序与输入顺序一致。
    denyWrite.push(resolve(cwd, '.claude', 'skills'))
  }

  // SECURITY: Git's is_git_directory() treats cwd as a bare repo if it has
  // HEAD + objects/ + refs/. An attacker planting these (plus a config with
  // core.fsmonitor) escapes the sandbox when Claude's unsandboxed git runs.
  //
  // Unconditionally denying these paths makes sandbox-runtime mount
  // /dev/null at non-existent ones, which (a) leaves a 0-byte HEAD stub on
  // the host and (b) breaks `git log HEAD` inside bwrap ("ambiguous argument").
  // So: if a file exists, denyWrite (ro-bind in place, no stub). If not, scrub
  // it post-command in scrubBareGitRepoFiles() — planted files are gone before
  // unsandboxed git runs; inside the command, git is itself sandboxed.
  // bareGitRepoScrubPaths 路径数据被清空，共享工具从干净状态继续。
  bareGitRepoScrubPaths.length = 0
  // bareGitRepoFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const bareGitRepoFiles = ['HEAD', 'objects', 'refs', 'hooks', 'config']
  // 按顺序遍历 `cwd === originalCwd ? [originalCwd]` 中的dir，逐个交给共享工具处理。
  for (const dir of cwd === originalCwd ? [originalCwd] : [originalCwd, cwd]) {
    // 按顺序遍历 `bareGitRepoFiles` 中的gitFile 文件数据，逐个交给共享工具处理。
    for (const gitFile of bareGitRepoFiles) {
      // p读取`resolve`，供共享工具后续处理使用。
      const p = resolve(dir, gitFile)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // eslint-disable-next-line custom-rules/no-sync-fs -- refreshConfig() must be sync
        // 调用 statSync，触发共享工具此处需要的副作用。
        statSync(p)
        // denyWrite追加新条目，保持收集顺序与输入顺序一致。
        denyWrite.push(p)
      } catch {
        // bareGitRepoScrubPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
        bareGitRepoScrubPaths.push(p)
      }
    }
  }

  // If we detected a git worktree during initialize(), the main repo path is
  // cached in worktreeMainRepoPath. Git operations in a worktree need write
  // access to the main repo's .git directory for index.lock etc.
  // This is resolved once at init time (worktree status doesn't change mid-session).
  // 只有 `worktreeMainRepoPath && worktreeMainRepoPath !==` 满足时，共享工具才执行该分支。
  if (worktreeMainRepoPath && worktreeMainRepoPath !== cwd) {
    // allowWrite追加新条目，保持收集顺序与输入顺序一致。
    allowWrite.push(worktreeMainRepoPath)
  }

  // Include directories added via --add-dir CLI flag or /add-dir command.
  // These must be in allowWrite so that Bash commands (which run inside the
  // sandbox) can access them — not just file tools, which check permissions
  // at the app level via pathInAllowedWorkingPath().
  // Two sources: persisted in settings, and session-only in bootstrap state.
  // additionalDirs 集合保存`Set`，供共享工具后续处理使用。
  const additionalDirs = new Set([
    ...(settings.permissions?.additionalDirectories || []),
    ...getAdditionalDirectoriesForClaudeMd(),
  ])
  // allowWrite追加新条目，保持收集顺序与输入顺序一致。
  allowWrite.push(...additionalDirs)

  // Iterate through each settings source to resolve paths correctly
  // Path patterns like `/foo` are relative to the settings file directory,
  // so we need to know which source each rule came from
  // 按顺序遍历 `SETTING_SOURCES` 中的source，逐个交给共享工具处理。
  for (const source of SETTING_SOURCES) {
    // sourceSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const sourceSettings = getSettingsForSource(source)

    // Extract filesystem paths from permission rules
    // 满足 `sourceSettings?.permissions` 时，共享工具执行该分支。
    if (sourceSettings?.permissions) {
      // 按顺序遍历 `sourceSettings.permissions.al` 中的ruleString，逐个交给共享工具处理。
      for (const ruleString of sourceSettings.permissions.allow || []) {
        // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
        const rule = permissionRuleValueFromString(ruleString)
        // 只有 `rule.toolName === FILE_EDIT_TOOL_NAME && rule.rul` 满足时，共享工具才执行该分支。
        if (rule.toolName === FILE_EDIT_TOOL_NAME && rule.ruleContent) {
          // allowWrite追加新条目，保持收集顺序与输入顺序一致。
          allowWrite.push(
            resolvePathPatternForSandbox(rule.ruleContent, source),
          )
        }
      }

      // 按顺序遍历 `sourceSettings.permissions.de` 中的ruleString，逐个交给共享工具处理。
      for (const ruleString of sourceSettings.permissions.deny || []) {
        // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
        const rule = permissionRuleValueFromString(ruleString)
        // 只有 `rule.toolName === FILE_EDIT_TOOL_NAME && rule.rul` 满足时，共享工具才执行该分支。
        if (rule.toolName === FILE_EDIT_TOOL_NAME && rule.ruleContent) {
          // denyWrite追加新条目，保持收集顺序与输入顺序一致。
          denyWrite.push(resolvePathPatternForSandbox(rule.ruleContent, source))
        }
        // 只有 `rule.toolName === FILE_READ_TOOL_NAME && rule.rul` 满足时，共享工具才执行该分支。
        if (rule.toolName === FILE_READ_TOOL_NAME && rule.ruleContent) {
          // denyRead追加新条目，保持收集顺序与输入顺序一致。
          denyRead.push(resolvePathPatternForSandbox(rule.ruleContent, source))
        }
      }
    }

    // Extract filesystem paths from sandbox.filesystem settings
    // sandbox.filesystem.* uses standard path semantics (/path = absolute),
    // NOT the permission-rule convention (/path = settings-relative). #30067
    // fs 集合保存`sourceSettings?.sandbox?.filesystem`，供共享工具 sandbox adapter后续判断或输出使用。
    const fs = sourceSettings?.sandbox?.filesystem
    // 满足 `fs` 时，共享工具执行该分支。
    if (fs) {
      // 按顺序遍历 `fs.allowWrite || []` 中的p，逐个交给共享工具处理。
      for (const p of fs.allowWrite || []) {
        // allowWrite追加新条目，保持收集顺序与输入顺序一致。
        allowWrite.push(resolveSandboxFilesystemPath(p, source))
      }
      // 按顺序遍历 `fs.denyWrite || []` 中的p，逐个交给共享工具处理。
      for (const p of fs.denyWrite || []) {
        // denyWrite追加新条目，保持收集顺序与输入顺序一致。
        denyWrite.push(resolveSandboxFilesystemPath(p, source))
      }
      // 按顺序遍历 `fs.denyRead || []` 中的p，逐个交给共享工具处理。
      for (const p of fs.denyRead || []) {
        // denyRead追加新条目，保持收集顺序与输入顺序一致。
        denyRead.push(resolveSandboxFilesystemPath(p, source))
      }
      // 当 `!shouldAllowManagedReadPathsOnly() || source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
      if (!shouldAllowManagedReadPathsOnly() || source === 'policySettings') {
        // 按顺序遍历 `fs.allowRead || []` 中的p，逐个交给共享工具处理。
        for (const p of fs.allowRead || []) {
          // allowRead追加新条目，保持收集顺序与输入顺序一致。
          allowRead.push(resolveSandboxFilesystemPath(p, source))
        }
      }
    }
  }
  // Ripgrep config for sandbox. User settings take priority; otherwise pass our rg.
  // In embedded mode (argv0='rg' dispatch), sandbox-runtime spawns with argv0 set.
  // 从 `ripgrepCommand()` 解构 rgPath、rgArgs、argv0，减少共享工具 sandbox adapter对同一对象的重复访问。
  const { rgPath, rgArgs, argv0 } = ripgrepCommand()
  // ripgrepConfig 配置保存`settings.sandbox?.ripgrep ?? {`，供后续判断或组装使用。
  const ripgrepConfig = settings.sandbox?.ripgrep ?? {
    command: rgPath,
    args: rgArgs,
    argv0,
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    network: {
      allowedDomains,
      deniedDomains,
      allowUnixSockets: settings.sandbox?.network?.allowUnixSockets,
      allowAllUnixSockets: settings.sandbox?.network?.allowAllUnixSockets,
      allowLocalBinding: settings.sandbox?.network?.allowLocalBinding,
      httpProxyPort: settings.sandbox?.network?.httpProxyPort,
      socksProxyPort: settings.sandbox?.network?.socksProxyPort,
    },
    filesystem: {
      denyRead,
      allowRead,
      allowWrite,
      denyWrite,
    },
    ignoreViolations: settings.sandbox?.ignoreViolations,
    enableWeakerNestedSandbox: settings.sandbox?.enableWeakerNestedSandbox,
    enableWeakerNetworkIsolation:
      settings.sandbox?.enableWeakerNetworkIsolation,
    ripgrep: ripgrepConfig,
  }
}

// ============================================================================
// Claude CLI-specific state
// ============================================================================

// initializationPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
let initializationPromise: Promise<void> | undefined
// 这个回调绑定到 let settingsSubscriptionCleanup: (() => void) | undefined，负责共享工具在该局部场景下的响应。
let settingsSubscriptionCleanup: (() => void) | undefined

// Cached main repo path for git worktrees, resolved once during initialize().
// In a worktree, .git is a file containing "gitdir: /path/to/main/repo/.git/worktrees/name".
// undefined = not yet resolved; null = not a worktree or detection failed.
// worktreeMainRepoPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
let worktreeMainRepoPath: string | null | undefined

// Bare-repo files at cwd that didn't exist at config time and should be
// scrubbed if they appear after a sandboxed command. See anthropics/claude-code#29316.
// bareGitRepoScrubPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const bareGitRepoScrubPaths: string[] = []

/**
 * Delete bare-repo files planted at cwd during a sandboxed command, before
 * Claude's unsandboxed git calls can see them. See the SECURITY block above
 * bareGitRepoFiles. anthropics/claude-code#29316.
 */
// scrubBareGitRepoFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scrubBareGitRepoFiles(): void {
  // 按顺序遍历 `bareGitRepoScrubPaths` 中的p，逐个交给共享工具处理。
  for (const p of bareGitRepoScrubPaths) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line custom-rules/no-sync-fs -- cleanupAfterCommand must be sync (Shell.ts:367)
      // 调用 rmSync，触发共享工具此处需要的副作用。
      rmSync(p, { recursive: true })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[Sandbox] scrubbed planted bare-repo file: ${p}`)
    } catch {
      // ENOENT is the expected common case — nothing was planted
    }
  }
}

/**
 * Detect if cwd is a git worktree and resolve the main repo path.
 * Called once during initialize() and cached for the session.
 * In a worktree, .git is a file (not a directory) containing "gitdir: ...".
 * If .git is a directory, readFile throws EISDIR and we return null.
 */
// detectWorktreeMainRepoPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectWorktreeMainRepoPath(cwd: string): Promise<string | null> {
  // gitPath 路径数据格式化`join`，供共享工具后续处理使用。
  const gitPath = join(cwd, '.git')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // gitContent读取`readFile`，供共享工具后续处理使用。
    const gitContent = await readFile(gitPath, { encoding: 'utf8' })
    // gitdirMatch匹配`gitContent.match`，供共享工具后续处理使用。
    const gitdirMatch = gitContent.match(/^gitdir:\s*(.+)$/m)
    // 满足 `!gitdirMatch?.[1]` 时，共享工具执行该分支。
    if (!gitdirMatch?.[1]) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // gitdir may be relative (rare, but git accepts it) — resolve against cwd
    // gitdir读取`resolve`，供共享工具后续处理使用。
    const gitdir = resolve(cwd, gitdirMatch[1].trim())
    // gitdir format: /path/to/main/repo/.git/worktrees/worktree-name
    // Match the /.git/worktrees/ segment specifically — indexOf('.git') alone
    // would false-match paths like /home/user/.github-projects/...
    // marker保存``${sep}.git${sep}worktrees${sep}``，作为后续固定文本处理的输入。
    const marker = `${sep}.git${sep}worktrees${sep}`
    // markerIndex 索引保存`gitdir.lastIndexOf`，供共享工具后续处理使用。
    const markerIndex = gitdir.lastIndexOf(marker)
    // 满足 `markerIndex > 0` 时，共享工具执行该分支。
    if (markerIndex > 0) {
      // 返回 `gitdir.substring(0, markerIndex)`，作为共享工具这次计算的结果。
      return gitdir.substring(0, markerIndex)
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  } catch {
    // Not in a worktree, .git is a directory (EISDIR), or can't read .git file
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Check if dependencies are available (memoized)
 * Returns { errors, warnings } - errors mean sandbox cannot run
 */
// checkDependencies 集合保存`memoize`，供共享工具后续处理使用。
const checkDependencies = memoize((): SandboxDependencyCheck => {
  // 从 `ripgrepCommand()` 解构 rgPath、rgArgs，减少共享工具 sandbox adapter对同一对象的重复访问。
  const { rgPath, rgArgs } = ripgrepCommand()
  // 返回 `BaseSandboxManager.checkDependencies({`，作为共享工具这次计算的结果。
  return BaseSandboxManager.checkDependencies({
    command: rgPath,
    args: rgArgs,
  })
})

// getSandboxEnabledSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSandboxEnabledSetting(): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
    const settings = getSettings_DEPRECATED()
    // 返回 `settings?.sandbox?.enabled ?? false`，作为共享工具这次计算的结果。
    return settings?.sandbox?.enabled ?? false
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to get settings for sandbox check: ${error}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// isAutoAllowBashIfSandboxedEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAutoAllowBashIfSandboxedEnabled(): boolean {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // 返回 `settings?.sandbox?.autoAllowBashIfSandboxed ?? true`，作为共享工具这次计算的结果。
  return settings?.sandbox?.autoAllowBashIfSandboxed ?? true
}

// areUnsandboxedCommandsAllowed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function areUnsandboxedCommandsAllowed(): boolean {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // 返回 `settings?.sandbox?.allowUnsandboxedCommands ?? true`，作为共享工具这次计算的结果。
  return settings?.sandbox?.allowUnsandboxedCommands ?? true
}

// isSandboxRequired 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSandboxRequired(): boolean {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getSandboxEnabledSetting() &&
    (settings?.sandbox?.failIfUnavailable ?? false)
  )
}

/**
 * Check if the current platform is supported for sandboxing (memoized)
 * Supports: macOS, Linux, and WSL2+ (WSL1 is not supported)
 */
// isSupportedPlatform记录 `memoize` 是否成立，共享工具随后按该结果分支。
const isSupportedPlatform = memoize((): boolean => {
  // 返回 `BaseSandboxManager.isSupportedPlatform()`，作为共享工具这次计算的结果。
  return BaseSandboxManager.isSupportedPlatform()
})

/**
 * Check if the current platform is in the enabledPlatforms list.
 *
 * This is an undocumented setting that allows restricting sandbox to specific platforms.
 * When enabledPlatforms is not set, all supported platforms are allowed.
 *
 * Added to unblock NVIDIA enterprise rollout: they want to enable autoAllowBashIfSandboxed
 * but only on macOS initially, since Linux/WSL sandbox support is newer. This allows
 * setting enabledPlatforms: ["macos"] to disable sandbox (and auto-allow) on other platforms.
 */
// isPlatformInEnabledList 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPlatformInEnabledList(): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
    const settings = getInitialSettings()
    // enabledPlatforms 集合保存`(`，供后续判断或组装使用。
    const enabledPlatforms = (
      settings?.sandbox as { enabledPlatforms?: Platform[] } | undefined
    )?.enabledPlatforms

    // 满足 `enabledPlatforms === undefined` 时，共享工具执行该分支。
    if (enabledPlatforms === undefined) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // enabledPlatforms 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (enabledPlatforms.length === 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // currentPlatform读取`getPlatform`，供共享工具后续处理使用。
    const currentPlatform = getPlatform()
    // 返回 `enabledPlatforms.includes(currentPlatform)`，作为共享工具这次计算的结果。
    return enabledPlatforms.includes(currentPlatform)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to check enabledPlatforms: ${error}`)
    // 返回 `true // Default to enabled if we can't read settings`，作为共享工具这次计算的结果。
    return true // Default to enabled if we can't read settings
  }
}

/**
 * Check if sandboxing is enabled
 * This checks the user's enabled setting, platform support, and enabledPlatforms restriction
 */
// isSandboxingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSandboxingEnabled(): boolean {
  // 满足 `!isSupportedPlatform()` 时，共享工具执行该分支。
  if (!isSupportedPlatform()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `checkDependencies().errors.length > 0` 时，共享工具执行该分支。
  if (checkDependencies().errors.length > 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if current platform is in the enabledPlatforms list (undocumented setting)
  // 满足 `!isPlatformInEnabledList()` 时，共享工具执行该分支。
  if (!isPlatformInEnabledList()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `getSandboxEnabledSetting()`，作为共享工具这次计算的结果。
  return getSandboxEnabledSetting()
}

/**
 * If the user explicitly enabled sandbox (sandbox.enabled: true in settings)
 * but it cannot actually run, return a human-readable reason. Otherwise
 * return undefined.
 *
 * Fix for #34044: previously isSandboxingEnabled() silently returned false
 * when dependencies were missing, giving users zero feedback that their
 * explicit security setting was being ignored. This is a security footgun —
 * users configure allowedDomains expecting enforcement, get none.
 *
 * Call this once at startup (REPL/print) and surface the reason if present.
 * Does not cover the case where the user never enabled sandbox (no noise).
 */
// getSandboxUnavailableReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSandboxUnavailableReason(): string | undefined {
  // Only warn if user explicitly asked for sandbox. If they didn't enable
  // it, missing deps are irrelevant.
  // 满足 `!getSandboxEnabledSetting()` 时，共享工具执行该分支。
  if (!getSandboxEnabledSetting()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 满足 `!isSupportedPlatform()` 时，共享工具执行该分支。
  if (!isSupportedPlatform()) {
    // platform读取`getPlatform`，供共享工具后续处理使用。
    const platform = getPlatform()
    // 当 `platform` 匹配 `'wsl'` 时，共享工具执行对应分支。
    if (platform === 'wsl') {
      // 返回 `'sandbox.enabled is set but WSL1 is not supported (requires WSL2)'`，作为共享工具这次计算的结果。
      return 'sandbox.enabled is set but WSL1 is not supported (requires WSL2)'
    }
    // 返回 ``sandbox.enabled is set but ${platform} is not supported (requires macO...`，作为共享工具这次计算的结果。
    return `sandbox.enabled is set but ${platform} is not supported (requires macOS, Linux, or WSL2)`
  }

  // 满足 `!isPlatformInEnabledList()` 时，共享工具执行该分支。
  if (!isPlatformInEnabledList()) {
    // 返回 ``sandbox.enabled is set but ${getPlatform()} is not in sandbox.enabledP...`，作为共享工具这次计算的结果。
    return `sandbox.enabled is set but ${getPlatform()} is not in sandbox.enabledPlatforms`
  }

  // deps 集合读取`checkDependencies`，供共享工具后续处理使用。
  const deps = checkDependencies()
  // 满足 `deps.errors.length > 0` 时，共享工具执行该分支。
  if (deps.errors.length > 0) {
    // platform读取`getPlatform`，供共享工具后续处理使用。
    const platform = getPlatform()
    // hint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hint =
      platform === 'macos'
        ? 'run /sandbox or /doctor for details'
        : 'install missing tools (e.g. apt install bubblewrap socat) or run /sandbox for details'
    // 返回 ``sandbox.enabled is set but dependencies are missing: ${deps.errors.joi...`，作为共享工具这次计算的结果。
    return `sandbox.enabled is set but dependencies are missing: ${deps.errors.join(', ')} · ${hint}`
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Get glob patterns that won't work fully on Linux/WSL
 */
// getLinuxGlobPatternWarnings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLinuxGlobPatternWarnings(): string[] {
  // Only return warnings on Linux/WSL (bubblewrap doesn't support globs)
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // `platform` 与 `'linux' && platform !== 'wsl'` 不一致时刷新派生状态，避免使用过期结果。
  if (platform !== 'linux' && platform !== 'wsl') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
    const settings = getSettings_DEPRECATED()

    // Only return warnings when sandboxing is enabled (check settings directly, not cached value)
    // 满足 `!settings?.sandbox?.enabled` 时，共享工具执行该分支。
    if (!settings?.sandbox?.enabled) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }

    // permissions 权限数据标记共享工具 sandbox adapter是否启用对应路径。
    const permissions = settings?.permissions || {}
    // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const warnings: string[] = []

    // Helper to check if a path has glob characters (excluding trailing /**)
    // hasGlobs 集合封装成回调，供共享工具 sandbox adapter在事件触发或异步步骤中调用。
    const hasGlobs = (path: string): boolean => {
      // stripped格式化`path.replace`，供共享工具后续处理使用。
      const stripped = path.replace(/\/\*\*$/, '')
      // 返回 `/[*?[\]]/.test(stripped)`，作为共享工具这次计算的结果。
      return /[*?[\]]/.test(stripped)
    }

    // Check all permission rules
    // 调用 for，触发共享工具此处需要的副作用。
    for (const ruleString of [
      ...(permissions.allow || []),
      ...(permissions.deny || []),
    ]) {
      // rule保存`permissionRuleValueFromString`，供共享工具后续处理使用。
      const rule = permissionRuleValueFromString(ruleString)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        (rule.toolName === FILE_EDIT_TOOL_NAME ||
          rule.toolName === FILE_READ_TOOL_NAME) &&
        rule.ruleContent &&
        hasGlobs(rule.ruleContent)
      ) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push(ruleString)
      }
    }

    // 返回 `warnings`，作为共享工具这次计算的结果。
    return warnings
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to get Linux glob pattern warnings: ${error}`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Check if sandbox settings are locked by policy
 */
// areSandboxSettingsLockedByPolicy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function areSandboxSettingsLockedByPolicy(): boolean {
  // Check if sandbox settings are explicitly set in any source that overrides localSettings
  // These sources have higher priority than localSettings and would make local changes ineffective
  // overridingSources 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const overridingSources = ['flagSettings', 'policySettings'] as const

  // 按顺序遍历 `overridingSources` 中的source，逐个交给共享工具处理。
  for (const source of overridingSources) {
    // settings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const settings = getSettingsForSource(source)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      settings?.sandbox?.enabled !== undefined ||
      settings?.sandbox?.autoAllowBashIfSandboxed !== undefined ||
      settings?.sandbox?.allowUnsandboxedCommands !== undefined
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Set sandbox settings
 */
// setSandboxSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function setSandboxSettings(options: {
  enabled?: boolean
  autoAllowBashIfSandboxed?: boolean
  allowUnsandboxedCommands?: boolean
}): Promise<void> {
  // existingSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const existingSettings = getSettingsForSource('localSettings')

  // Note: Memoized caches auto-invalidate when settings change because they use
  // the settings object as the cache key (new settings object = cache miss)

  // 调用 updateSettingsForSource，触发共享工具此处需要的副作用。
  updateSettingsForSource('localSettings', {
    sandbox: {
      ...existingSettings?.sandbox,
      ...(options.enabled !== undefined && { enabled: options.enabled }),
      ...(options.autoAllowBashIfSandboxed !== undefined && {
        autoAllowBashIfSandboxed: options.autoAllowBashIfSandboxed,
      }),
      ...(options.allowUnsandboxedCommands !== undefined && {
        allowUnsandboxedCommands: options.allowUnsandboxedCommands,
      }),
    },
  })
}

/**
 * Get excluded commands (commands that should not be sandboxed)
 */
// getExcludedCommands 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getExcludedCommands(): string[] {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // 返回 `settings?.sandbox?.excludedCommands ?? []`，作为共享工具这次计算的结果。
  return settings?.sandbox?.excludedCommands ?? []
}

/**
 * Wrap command with sandbox, optionally specifying the shell to use
 */
// wrapWithSandbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function wrapWithSandbox(
  command: string,
  binShell?: string,
  customConfig?: Partial<SandboxRuntimeConfig>,
  abortSignal?: AbortSignal,
): Promise<string> {
  // If sandboxing is enabled, ensure initialization is complete
  // 满足 `isSandboxingEnabled()` 时，共享工具执行该分支。
  if (isSandboxingEnabled()) {
    // 满足 `initializationPromise` 时，共享工具执行该分支。
    if (initializationPromise) {
      // 等待 `initializationPromise` 完成，再继续共享工具 sandbox adapter的异步流程。
      await initializationPromise
    } else {
      // 抛出 new Error('Sandbox failed to initialize. ')，阻止共享工具在无效状态下继续运行。
      throw new Error('Sandbox failed to initialize. ')
    }
  }

  // 返回 `BaseSandboxManager.wrapWithSandbox(`，作为共享工具这次计算的结果。
  return BaseSandboxManager.wrapWithSandbox(
    command,
    binShell,
    customConfig,
    abortSignal,
  )
}

/**
 * Initialize sandbox with log monitoring enabled by default
 */
// initialize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function initialize(
  sandboxAskCallback?: SandboxAskCallback,
): Promise<void> {
  // If already initializing or initialized, return the promise
  // 满足 `initializationPromise` 时，共享工具执行该分支。
  if (initializationPromise) {
    // 返回 `initializationPromise`，作为共享工具这次计算的结果。
    return initializationPromise
  }

  // Check if sandboxing is enabled in settings
  // 满足 `!isSandboxingEnabled()` 时，共享工具执行该分支。
  if (!isSandboxingEnabled()) {
    // 共享工具 sandbox adapter在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Wrap the callback to enforce allowManagedDomainsOnly policy.
  // This ensures all code paths (REPL, print/SDK) are covered.
  // wrappedCallback 命名 `sandboxAskCallback`，让后续代码直接表达这个值的用途。
  const wrappedCallback: SandboxAskCallback | undefined = sandboxAskCallback
    // 这个回调绑定到 ? async (hostPattern: NetworkHostPattern) => {，负责共享工具在该局部场景下的响应。
    ? async (hostPattern: NetworkHostPattern) => {
        // 满足 `shouldAllowManagedSandboxDomainsOnly()` 时，共享工具执行该分支。
        if (shouldAllowManagedSandboxDomainsOnly()) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[sandbox] Blocked network request to ${hostPattern.host} (allowManagedDomainsOnly)`,
          )
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // 返回 `sandboxAskCallback(hostPattern)`，作为共享工具这次计算的结果。
        return sandboxAskCallback(hostPattern)
      }
    : undefined

  // Create the initialization promise synchronously (before any await) to prevent
  // race conditions where wrapWithSandbox() is called before the promise is assigned.
  // initializationPromise 异步任务更新为 `(async () => {`，确保共享工具后续读取最新状态。
  initializationPromise = (async () => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Resolve worktree main repo path once before building config.
      // Worktree status doesn't change mid-session, so this is cached for all
      // subsequent refreshConfig() calls (which must be synchronous to avoid
      // race conditions where pending requests slip through with stale config).
      // 满足 `worktreeMainRepoPath === undefined` 时，共享工具执行该分支。
      if (worktreeMainRepoPath === undefined) {
        // worktreeMainRepoPath 路径数据更新为 `await detectWorktreeMainRepoPath(getCwdState())`，确保共享工具后续读取最新状态。
        worktreeMainRepoPath = await detectWorktreeMainRepoPath(getCwdState())
      }

      // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
      const settings = getSettings_DEPRECATED()
      // runtimeConfig 配置保存`convertToSandboxRuntimeConfig`，供共享工具后续处理使用。
      const runtimeConfig = convertToSandboxRuntimeConfig(settings)

      // Log monitor is automatically enabled for macOS
      // 等待 `BaseSandboxManager.initialize(runtimeConfig, wrappedCallback)` 完成，再继续共享工具 sandbox adapter的异步流程。
      await BaseSandboxManager.initialize(runtimeConfig, wrappedCallback)

      // Subscribe to settings changes to update sandbox config dynamically
      // settingsSubscriptionCleanup更新为 `settingsChangeDetector.subscribe(() => {`，确保共享工具后续读取最新状态。
      settingsSubscriptionCleanup = settingsChangeDetector.subscribe(() => {
        // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
        const settings = getSettings_DEPRECATED()
        // newConfig 配置保存`convertToSandboxRuntimeConfig`，供共享工具后续处理使用。
        const newConfig = convertToSandboxRuntimeConfig(settings)
        // 调用 BaseSandboxManager.updateConfig，触发共享工具此处需要的副作用。
        BaseSandboxManager.updateConfig(newConfig)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Sandbox configuration updated from settings change')
      })
    } catch (error) {
      // Clear the promise on error so initialization can be retried
      // initializationPromise 异步任务更新为 `undefined`，确保共享工具后续读取最新状态。
      initializationPromise = undefined

      // Log error but don't throw - let sandboxing fail gracefully
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to initialize sandbox: ${errorMessage(error)}`)
    }
  })()

  // 返回 `initializationPromise`，作为共享工具这次计算的结果。
  return initializationPromise
}

/**
 * Refresh sandbox config from current settings immediately
 * Call this after updating permissions to avoid race conditions
 */
// refreshConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function refreshConfig(): void {
  // 满足 `!isSandboxingEnabled()` 时，共享工具执行该分支。
  if (!isSandboxingEnabled()) return
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // newConfig 配置保存`convertToSandboxRuntimeConfig`，供共享工具后续处理使用。
  const newConfig = convertToSandboxRuntimeConfig(settings)
  // 调用 BaseSandboxManager.updateConfig，触发共享工具此处需要的副作用。
  BaseSandboxManager.updateConfig(newConfig)
}

/**
 * Reset sandbox state and clear memoized values
 */
// reset 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function reset(): Promise<void> {
  // Clean up settings subscription
  // 调用 settingsSubscriptionCleanup?.()，完成这一处局部操作。
  settingsSubscriptionCleanup?.()
  // settingsSubscriptionCleanup更新为 `undefined`，确保共享工具后续读取最新状态。
  settingsSubscriptionCleanup = undefined
  // worktreeMainRepoPath 路径数据更新为 `undefined`，确保共享工具后续读取最新状态。
  worktreeMainRepoPath = undefined
  // bareGitRepoScrubPaths 路径数据被清空，共享工具从干净状态继续。
  bareGitRepoScrubPaths.length = 0

  // Clear memoized caches
  // 调用 checkDependencies.cache.clear?.()，完成这一处局部操作。
  checkDependencies.cache.clear?.()
  // 调用 isSupportedPlatform.cache.clear?.()，完成这一处局部操作。
  isSupportedPlatform.cache.clear?.()
  // initializationPromise 异步任务更新为 `undefined`，确保共享工具后续读取最新状态。
  initializationPromise = undefined

  // Reset the base sandbox manager
  // 返回 `BaseSandboxManager.reset()`，作为共享工具这次计算的结果。
  return BaseSandboxManager.reset()
}

/**
 * Add a command to the excluded commands list (commands that should not be sandboxed)
 * This is a Claude CLI-specific function that updates local settings.
 */
// addToExcludedCommands 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToExcludedCommands(
  command: string,
  permissionUpdates?: Array<{
    type: string
    rules: Array<{ toolName: string; ruleContent?: string }>
  }>,
): string {
  // existingSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const existingSettings = getSettingsForSource('localSettings')
  // existingExcludedCommands 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const existingExcludedCommands =
    existingSettings?.sandbox?.excludedCommands || []

  // Determine the command pattern to add
  // If there are suggestions with Bash rules, extract the pattern (e.g., "npm run test" from "npm run test:*")
  // Otherwise use the exact command
  // commandPattern 命令数据保存`command`，供共享工具 sandbox adapter后续判断或输出使用。
  let commandPattern: string = command

  // 满足 `permissionUpdates` 时，共享工具执行该分支。
  if (permissionUpdates) {
    // bashSuggestions 集合筛选`permissionUpdates.filter`，供共享工具后续处理使用。
    const bashSuggestions = permissionUpdates.filter(
      // update更新为 `>`，确保共享工具后续读取最新状态。
      update =>
        update.type === 'addRules' &&
        // 调用 update.rules.some，触发共享工具此处需要的副作用。
        update.rules.some(rule => rule.toolName === BASH_TOOL_NAME),
    )

    // 只有 `bashSuggestions.length > 0 && bashSuggestions[0]!` 满足时，共享工具才执行该分支。
    if (bashSuggestions.length > 0 && bashSuggestions[0]!.type === 'addRules') {
      // firstBashRule筛选`rules.find`，供共享工具后续处理使用。
      const firstBashRule = bashSuggestions[0]!.rules.find(
        // rule更新为 `> rule.toolName === BASH_TOOL_NAME`，确保共享工具后续读取最新状态。
        rule => rule.toolName === BASH_TOOL_NAME,
      )
      // 满足 `firstBashRule?.ruleContent` 时，共享工具执行该分支。
      if (firstBashRule?.ruleContent) {
        // Extract pattern from Bash(command) or Bash(command:*) format
        // prefix保存`permissionRuleExtractPrefix`，供共享工具后续处理使用。
        const prefix = permissionRuleExtractPrefix(firstBashRule.ruleContent)
        // commandPattern 命令数据更新为 `prefix || firstBashRule.ruleContent`，确保共享工具后续读取最新状态。
        commandPattern = prefix || firstBashRule.ruleContent
      }
    }
  }

  // Add to excludedCommands if not already present
  // 满足 `!existingExcludedCommands.includes(commandPattern)` 时，共享工具执行该分支。
  if (!existingExcludedCommands.includes(commandPattern)) {
    // 调用 updateSettingsForSource，触发共享工具此处需要的副作用。
    updateSettingsForSource('localSettings', {
      sandbox: {
        ...existingSettings?.sandbox,
        excludedCommands: [...existingExcludedCommands, commandPattern],
      },
    })
  }

  // 返回 `commandPattern`，作为共享工具这次计算的结果。
  return commandPattern
}

// ============================================================================
// Export interface and implementation
// ============================================================================

// ISandboxManager 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ISandboxManager {
  initialize(sandboxAskCallback?: SandboxAskCallback): Promise<void>
  isSupportedPlatform(): boolean
  isPlatformInEnabledList(): boolean
  getSandboxUnavailableReason(): string | undefined
  // isSandboxingEnabled 用 无 判断共享工具是否满足条件。
  isSandboxingEnabled(): boolean
  // isSandboxEnabledInSettings 用 无 判断共享工具是否满足条件。
  isSandboxEnabledInSettings(): boolean
  // checkDependencies 使用 无 完成共享工具里的对应操作。
  checkDependencies(): SandboxDependencyCheck
  // isAutoAllowBashIfSandboxedEnabled 用 无 判断共享工具是否满足条件。
  isAutoAllowBashIfSandboxedEnabled(): boolean
  // areUnsandboxedCommandsAllowed 使用 无 完成共享工具里的对应操作。
  areUnsandboxedCommandsAllowed(): boolean
  // isSandboxRequired 用 无 判断共享工具是否满足条件。
  isSandboxRequired(): boolean
  // areSandboxSettingsLockedByPolicy 使用 无 完成共享工具里的对应操作。
  areSandboxSettingsLockedByPolicy(): boolean
  // setSandboxSettings 写入新的状态值，使共享工具后续读取保持一致。
  setSandboxSettings(options: {
    enabled?: boolean
    autoAllowBashIfSandboxed?: boolean
    allowUnsandboxedCommands?: boolean
  }): Promise<void>
  // getFsReadConfig不依赖额外参数，直接计算共享工具需要的结果。
  getFsReadConfig(): FsReadRestrictionConfig
  // getFsWriteConfig不依赖额外参数，直接计算共享工具需要的结果。
  getFsWriteConfig(): FsWriteRestrictionConfig
  // getNetworkRestrictionConfig不依赖额外参数，直接计算共享工具需要的结果。
  getNetworkRestrictionConfig(): NetworkRestrictionConfig
  // getAllowUnixSockets不依赖额外参数，直接计算共享工具需要的结果。
  getAllowUnixSockets(): string[] | undefined
  // getAllowLocalBinding不依赖额外参数，直接计算共享工具需要的结果。
  getAllowLocalBinding(): boolean | undefined
  // getIgnoreViolations不依赖额外参数，直接计算共享工具需要的结果。
  getIgnoreViolations(): IgnoreViolationsConfig | undefined
  // getEnableWeakerNestedSandbox不依赖额外参数，直接计算共享工具需要的结果。
  getEnableWeakerNestedSandbox(): boolean | undefined
  // getExcludedCommands不依赖额外参数，直接计算共享工具需要的结果。
  getExcludedCommands(): string[]
  // getProxyPort不依赖额外参数，直接计算共享工具需要的结果。
  getProxyPort(): number | undefined
  // getSocksProxyPort不依赖额外参数，直接计算共享工具需要的结果。
  getSocksProxyPort(): number | undefined
  // getLinuxHttpSocketPath不依赖额外参数，直接计算共享工具需要的结果。
  getLinuxHttpSocketPath(): string | undefined
  // getLinuxSocksSocketPath不依赖额外参数，直接计算共享工具需要的结果。
  getLinuxSocksSocketPath(): string | undefined
  // waitForNetworkInitialization 使用 无 完成共享工具里的对应操作。
  waitForNetworkInitialization(): Promise<boolean>
  // 调用 wrapWithSandbox，触发共享工具此处需要的副作用。
  wrapWithSandbox(
    command: string,
    binShell?: string,
    customConfig?: Partial<SandboxRuntimeConfig>,
    abortSignal?: AbortSignal,
  ): Promise<string>
  // cleanupAfterCommand 使用 无 完成共享工具里的对应操作。
  cleanupAfterCommand(): void
  // getSandboxViolationStore不依赖额外参数，直接计算共享工具需要的结果。
  getSandboxViolationStore(): SandboxViolationStore
  // annotateStderrWithSandboxFailures 使用 command: string, stderr: string 完成共享工具里的对应操作。
  annotateStderrWithSandboxFailures(command: string, stderr: string): string
  // getLinuxGlobPatternWarnings不依赖额外参数，直接计算共享工具需要的结果。
  getLinuxGlobPatternWarnings(): string[]
  // refreshConfig 使用 无 完成共享工具里的对应操作。
  refreshConfig(): void
  // reset 使用 无 完成共享工具里的对应操作。
  reset(): Promise<void>
}

/**
 * Claude CLI sandbox manager - wraps sandbox-runtime with Claude-specific features
 */
// SandboxManager 集中保存共享工具 sandbox adapter要一起传递的字段。
export const SandboxManager: ISandboxManager = {
  // Custom implementations
  initialize,
  isSandboxingEnabled,
  isSandboxEnabledInSettings: getSandboxEnabledSetting,
  isPlatformInEnabledList,
  getSandboxUnavailableReason,
  isAutoAllowBashIfSandboxedEnabled,
  areUnsandboxedCommandsAllowed,
  isSandboxRequired,
  areSandboxSettingsLockedByPolicy,
  setSandboxSettings,
  getExcludedCommands,
  wrapWithSandbox,
  refreshConfig,
  reset,
  checkDependencies,

  // Forward to base sandbox manager
  getFsReadConfig: BaseSandboxManager.getFsReadConfig,
  getFsWriteConfig: BaseSandboxManager.getFsWriteConfig,
  getNetworkRestrictionConfig: BaseSandboxManager.getNetworkRestrictionConfig,
  getIgnoreViolations: BaseSandboxManager.getIgnoreViolations,
  getLinuxGlobPatternWarnings,
  isSupportedPlatform,
  getAllowUnixSockets: BaseSandboxManager.getAllowUnixSockets,
  getAllowLocalBinding: BaseSandboxManager.getAllowLocalBinding,
  getEnableWeakerNestedSandbox: BaseSandboxManager.getEnableWeakerNestedSandbox,
  getProxyPort: BaseSandboxManager.getProxyPort,
  getSocksProxyPort: BaseSandboxManager.getSocksProxyPort,
  getLinuxHttpSocketPath: BaseSandboxManager.getLinuxHttpSocketPath,
  getLinuxSocksSocketPath: BaseSandboxManager.getLinuxSocksSocketPath,
  waitForNetworkInitialization: BaseSandboxManager.waitForNetworkInitialization,
  getSandboxViolationStore: BaseSandboxManager.getSandboxViolationStore,
  annotateStderrWithSandboxFailures:
    BaseSandboxManager.annotateStderrWithSandboxFailures,
  // 这个回调绑定到 cleanupAfterCommand: (): void => {，负责共享工具在该局部场景下的响应。
  cleanupAfterCommand: (): void => {
    // 调用 BaseSandboxManager.cleanupAfterCommand，触发共享工具此处需要的副作用。
    BaseSandboxManager.cleanupAfterCommand()
    // 调用 scrubBareGitRepoFiles，触发共享工具此处需要的副作用。
    scrubBareGitRepoFiles()
  },
}

// ============================================================================
// Re-export types from sandbox-runtime
// ============================================================================

// 导出类型定义，让其他模块沿用共享工具 sandbox adapter的数据契约。
export type {
  SandboxAskCallback,
  SandboxDependencyCheck,
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  NetworkRestrictionConfig,
  NetworkHostPattern,
  SandboxViolationEvent,
  SandboxRuntimeConfig,
  IgnoreViolationsConfig,
}

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { SandboxViolationStore, SandboxRuntimeConfigSchema }
