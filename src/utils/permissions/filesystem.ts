// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 引入 ignore，将 ignore 中已经封装好的能力接到本文件流程里。
import ignore from 'ignore'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir、tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir, tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, normalize, posix, sep } from 'path'
// 引入 hasAutoMemPathOverride、isAutoMemPath，将 src/memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { hasAutoMemPathOverride, isAutoMemPath } from 'src/memdir/paths.js'
// 接入 isAgentMemoryPath 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isAgentMemoryPath } from 'src/tools/AgentTool/agentMemory.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_FOLDER_PERMISSION_PATTERN,
  FILE_EDIT_TOOL_NAME,
  GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN,
} from 'src/tools/FileEditTool/constants.js'
// 类型依赖 { z } 来自 zod/v4，用于校准权限判定的数据契约。
import type { z } from 'zod/v4'
// 引入 getOriginalCwd、getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../../bootstrap/state.js'
// 接入 checkStatsigFeatureGate_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 类型依赖 { AnyObject, Tool, ToolPermissionContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { AnyObject, Tool, ToolPermissionContext } from '../../Tool.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getFsImplementation,
  getPathsForPermissionCheck,
} from '../fsOperations.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  containsPathTraversal,
  expandPath,
  getDirectoryForPath,
  sanitizePath,
} from '../path.js'
// 引入 getPlanSlug、getPlansDirectory，将 ../plans.js 中已经封装好的能力接到本文件流程里。
import { getPlanSlug, getPlansDirectory } from '../plans.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 getProjectDir，将 ../sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getProjectDir } from '../sessionStorage.js'
// 引入 SETTING_SOURCES，将 ../settings/constants.js 中已经封装好的能力接到本文件流程里。
import { SETTING_SOURCES } from '../settings/constants.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getSettingsFilePathForSource,
  getSettingsRootPathForSource,
} from '../settings/settings.js'
// 引入 containsVulnerableUncPath，将 ../shell/readOnlyCommandValidation.js 中已经封装好的能力接到本文件流程里。
import { containsVulnerableUncPath } from '../shell/readOnlyCommandValidation.js'
// 引入 getToolResultsDir，将 ../toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { getToolResultsDir } from '../toolResultStorage.js'
// 引入 windowsPathToPosixPath，将 ../windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { windowsPathToPosixPath } from '../windowsPaths.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecision,
  PermissionResult,
} from './PermissionResult.js'
// 类型依赖 { PermissionRule, PermissionRuleSource } 来自 ./PermissionRule.js，用于校准权限判定的数据契约。
import type { PermissionRule, PermissionRuleSource } from './PermissionRule.js'
// 引入 createReadRuleSuggestion，将 ./PermissionUpdate.js 中已经封装好的能力接到本文件流程里。
import { createReadRuleSuggestion } from './PermissionUpdate.js'
// 类型依赖 { PermissionUpdate } 来自 ./PermissionUpdateSchema.js，用于校准权限判定的数据契约。
import type { PermissionUpdate } from './PermissionUpdateSchema.js'
// 引入 getRuleByContentsForToolName，将 ./permissions.js 中已经封装好的能力接到本文件流程里。
import { getRuleByContentsForToolName } from './permissions.js'

// 权限工具 filesystem在这里处理 `declare const MACRO: { VERSION: string }`，完成这一小步状态转换。
declare const MACRO: { VERSION: string }

/**
 * Dangerous files that should be protected from auto-editing.
 * These files can be used for code execution or data exfiltration.
 */
// DANGEROUS_FILES 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
export const DANGEROUS_FILES = [
  '.gitconfig',
  '.gitmodules',
  '.bashrc',
  '.bash_profile',
  '.zshrc',
  '.zprofile',
  '.profile',
  '.ripgreprc',
  '.mcp.json',
  '.claude.json',
] as const

/**
 * Dangerous directories that should be protected from auto-editing.
 * These directories contain sensitive configuration or executable files.
 */
// DANGEROUS_DIRECTORIES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const DANGEROUS_DIRECTORIES = [
  '.git',
  '.vscode',
  '.idea',
  '.claude',
] as const

/**
 * Normalizes a path for case-insensitive comparison.
 * This prevents bypassing security checks using mixed-case paths on case-insensitive
 * filesystems (macOS/Windows) like `.cLauDe/Settings.locaL.json`.
 *
 * We always normalize to lowercase regardless of platform for consistent security.
 * @param path The path to normalize
 * @returns The lowercase path for safe comparison
 */
// normalizeCaseForComparison 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeCaseForComparison(path: string): string {
  // 返回 `path.toLowerCase()`，作为权限判定这次计算的结果。
  return path.toLowerCase()
}

/**
 * If filePath is inside a .claude/skills/{name}/ directory (project or global),
 * return the skill name and a session-allow pattern scoped to just that skill.
 * Used to offer a narrower "allow edits to this skill only" option in the
 * permission dialog and SDK suggestions, so iterating on one skill doesn't
 * require granting session access to all of .claude/ (settings.json, hooks/, etc.).
 */
// getClaudeSkillScope 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeSkillScope(
  filePath: string,
): { skillName: string; pattern: string } | null {
  // absolutePath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absolutePath = expandPath(filePath)
  // absolutePathLower 路径数据保存`normalizeCaseForComparison`，供权限判定后续处理使用。
  const absolutePathLower = normalizeCaseForComparison(absolutePath)

  // bases 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const bases = [
    {
      dir: expandPath(join(getOriginalCwd(), '.claude', 'skills')),
      prefix: '/.claude/skills/',
    },
    {
      dir: expandPath(join(homedir(), '.claude', 'skills')),
      prefix: '~/.claude/skills/',
    },
  ]

  // 循环处理 `const { dir, prefix } of bases`，让权限判定逐项把同类条目按顺序走完。
  for (const { dir, prefix } of bases) {
    // dirLower保存`normalizeCaseForComparison`，供权限判定后续处理使用。
    const dirLower = normalizeCaseForComparison(dir)
    // Try both path separators (Windows paths may not be normalized to /)
    // 按顺序遍历 `[sep, '/']` 中的s 集合，逐个交给权限判定处理。
    for (const s of [sep, '/']) {
      // 满足 `absolutePathLower.startsWith(dirLower + s.toLowerCase())` 时，权限判定执行该分支。
      if (absolutePathLower.startsWith(dirLower + s.toLowerCase())) {
        // Match on lowercase, but slice the ORIGINAL path so the skill name
        // preserves case (pattern matching downstream is case-sensitive)
        // rest格式化`absolutePath.slice`，供权限判定后续处理使用。
        const rest = absolutePath.slice(dir.length + s.length)
        // slash保存`rest.indexOf`，供权限判定后续处理使用。
        const slash = rest.indexOf('/')
        // bslash保存`rest.indexOf`，供权限判定后续处理使用。
        const bslash = sep === '\\' ? rest.indexOf('\\') : -1
        // cut 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const cut =
          slash === -1
            ? bslash
            : bslash === -1
              ? slash
              : Math.min(slash, bslash)
        // Require a separator: file must be INSIDE the skill dir, not a
        // file directly under skills/ (no skill scope for that)
        // 满足 `cut <= 0` 时，权限判定执行该分支。
        if (cut <= 0) return null
        // skillName格式化`rest.slice`，供权限判定后续处理使用。
        const skillName = rest.slice(0, cut)
        // Reject traversal and empty. Use includes('..') not === '..' to
        // match step 1.6's ruleContent.includes('..') guard: a skillName like
        // 'v2..beta' would otherwise produce a suggestion step 1.7 emits but
        // step 1.6 always rejects (dead suggestion, infinite re-prompt).
        // 只有 `!skillName || skillName === '.' || skillName.includes('..')` 满足时，权限判定才执行该分支。
        if (!skillName || skillName === '.' || skillName.includes('..')) {
          // 返回 `null`，作为权限判定这次计算的结果。
          return null
        }
        // Reject glob metacharacters. skillName is interpolated into a
        // gitignore pattern consumed by ignore().add() in matchingRuleForInput
        // at step 1.6. A directory literally named '*' (valid on POSIX) would
        // produce '/.claude/skills/*/**' which matches ALL skills. Return null
        // to fall through to generateSuggestions() instead.
        // 满足 `/[*?[\]]/.test(skillName)` 时，权限判定执行该分支。
        if (/[*?[\]]/.test(skillName)) return null
        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return { skillName, pattern: prefix + skillName + '/**' }
      }
    }
  }

  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

// Always use / as the path separator per gitignore spec
// https://git-scm.com/docs/gitignore
// DIR_SEP保存`posix.sep`，供后续判断或组装使用。
const DIR_SEP = posix.sep

/**
 * Cross-platform relative path calculation that returns POSIX-style paths.
 * Handles Windows path conversion internally.
 * @param from The base path
 * @param to The target path
 * @returns A POSIX-style relative path
 */
// relativePath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function relativePath(from: string, to: string): string {
  // 当 `getPlatform()` 匹配 `'windows'` 时，权限判定执行对应分支。
  if (getPlatform() === 'windows') {
    // Convert Windows paths to POSIX for consistent comparison
    // posixFrom保存`windowsPathToPosixPath`，供权限判定后续处理使用。
    const posixFrom = windowsPathToPosixPath(from)
    // posixTo保存`windowsPathToPosixPath`，供权限判定后续处理使用。
    const posixTo = windowsPathToPosixPath(to)
    // 返回 `posix.relative(posixFrom, posixTo)`，作为权限判定这次计算的结果。
    return posix.relative(posixFrom, posixTo)
  }
  // Use POSIX paths directly
  // 返回 `posix.relative(from, to)`，作为权限判定这次计算的结果。
  return posix.relative(from, to)
}

/**
 * Converts a path to POSIX format for pattern matching.
 * Handles Windows path conversion internally.
 * @param path The path to convert
 * @returns A POSIX-style path
 */
// toPosixPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toPosixPath(path: string): string {
  // 当 `getPlatform()` 匹配 `'windows'` 时，权限判定执行对应分支。
  if (getPlatform() === 'windows') {
    // 返回 `windowsPathToPosixPath(path)`，作为权限判定这次计算的结果。
    return windowsPathToPosixPath(path)
  }
  // 返回 `path`，作为权限判定这次计算的结果。
  return path
}

// getSettingsPaths 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSettingsPaths(): string[] {
  // 返回 `SETTING_SOURCES.map(source =>`，作为权限判定这次计算的结果。
  return SETTING_SOURCES.map(source =>
    getSettingsFilePathForSource(source),
  ).filter(path => path !== undefined)
}

// isClaudeSettingsPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isClaudeSettingsPath(filePath: string): boolean {
  // SECURITY: Normalize path structure first to prevent bypass via redundant ./
  // sequences like `./.claude/./settings.json` which would evade the endsWith() check
  // expandedPath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const expandedPath = expandPath(filePath)

  // Normalize for case-insensitive comparison to prevent bypassing security
  // with paths like .cLauDe/Settings.locaL.json
  // normalizedPath 路径数据保存`normalizeCaseForComparison`，供权限判定后续处理使用。
  const normalizedPath = normalizeCaseForComparison(expandedPath)

  // Use platform separator so endsWith checks work on both Unix (/) and Windows (\)
  // 权限判定在这里按实际状态进入对应分支。
  if (
    normalizedPath.endsWith(`${sep}.claude${sep}settings.json`) ||
    normalizedPath.endsWith(`${sep}.claude${sep}settings.local.json`)
  ) {
    // Include .claude/settings.json even for other projects
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Check for current project's settings files (including managed settings and CLI args)
  // Both paths are now absolute and normalized for consistent comparison
  // 返回 `getSettingsPaths().some(`，作为权限判定这次计算的结果。
  return getSettingsPaths().some(
    // settingsPath 路径数据更新为 `> normalizeCaseForComparison(settingsPath) === normalized...`，确保权限工具后续读取最新状态。
    settingsPath => normalizeCaseForComparison(settingsPath) === normalizedPath,
  )
}

// Always ask when Claude Code tries to edit its own config files
// isClaudeConfigFilePath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isClaudeConfigFilePath(filePath: string): boolean {
  // 满足 `isClaudeSettingsPath(filePath)` 时，权限判定执行该分支。
  if (isClaudeSettingsPath(filePath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check if file is within .claude/commands or .claude/agents directories
  // using proper path segment validation (not string matching with includes())
  // pathInWorkingPath now handles case-insensitive comparison to prevent bypasses
  // commandsDir 命令数据格式化`join`，供权限判定后续处理使用。
  const commandsDir = join(getOriginalCwd(), '.claude', 'commands')
  // agentsDir格式化`join`，供权限判定后续处理使用。
  const agentsDir = join(getOriginalCwd(), '.claude', 'agents')
  // skillsDir格式化`join`，供权限判定后续处理使用。
  const skillsDir = join(getOriginalCwd(), '.claude', 'skills')

  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    pathInWorkingPath(filePath, commandsDir) ||
    pathInWorkingPath(filePath, agentsDir) ||
    pathInWorkingPath(filePath, skillsDir)
  )
}

// Check if file is the plan file for the current session
// isSessionPlanFile 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSessionPlanFile(absolutePath: string): boolean {
  // Check if path is a plan file for this session (main or agent-specific)
  // Main plan file: {plansDir}/{planSlug}.md
  // Agent plan file: {plansDir}/{planSlug}-agent-{agentId}.md
  // expectedPrefix格式化`join`，供权限判定后续处理使用。
  const expectedPrefix = join(getPlansDirectory(), getPlanSlug())
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    normalizedPath.startsWith(expectedPrefix) && normalizedPath.endsWith('.md')
  )
}

/**
 * Returns the session memory directory path for the current session with trailing separator.
 * Path format: {projectDir}/{sessionId}/session-memory/
 */
// getSessionMemoryDir 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionMemoryDir(): string {
  // 返回 `join(getProjectDir(getCwd()), getSessionId(), 'session-memory') + sep`，作为权限判定这次计算的结果。
  return join(getProjectDir(getCwd()), getSessionId(), 'session-memory') + sep
}

/**
 * Returns the session memory file path for the current session.
 * Path format: {projectDir}/{sessionId}/session-memory/summary.md
 */
// getSessionMemoryPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionMemoryPath(): string {
  // 返回 `join(getSessionMemoryDir(), 'summary.md')`，作为权限判定这次计算的结果。
  return join(getSessionMemoryDir(), 'summary.md')
}

// Check if file is within the session memory directory
// isSessionMemoryPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSessionMemoryPath(absolutePath: string): boolean {
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // 返回 `normalizedPath.startsWith(getSessionMemoryDir())`，作为权限判定这次计算的结果。
  return normalizedPath.startsWith(getSessionMemoryDir())
}

/**
 * Check if file is within the current project's directory.
 * Path format: ~/.claude/projects/{sanitized-cwd}/...
 */
// isProjectDirPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isProjectDirPath(absolutePath: string): boolean {
  // projectDir读取`getProjectDir`，供权限判定后续处理使用。
  const projectDir = getProjectDir(getCwd())
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    normalizedPath === projectDir || normalizedPath.startsWith(projectDir + sep)
  )
}

/**
 * Checks if the scratchpad directory feature is enabled.
 * The scratchpad is a per-session directory for Claude to write temporary files.
 * Controlled by the tengu_scratch Statsig gate.
 */
// isScratchpadEnabled 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isScratchpadEnabled(): boolean {
  // 返回 `checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_scratch')`，作为权限判定这次计算的结果。
  return checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_scratch')
}

/**
 * Returns the user-specific Claude temp directory name.
 * On Unix: 'claude-{uid}' to prevent multi-user permission conflicts
 * On Windows: 'claude' (tmpdir() is already per-user)
 */
// getClaudeTempDirName 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeTempDirName(): string {
  // 当 `getPlatform()` 匹配 `'windows'` 时，权限判定执行对应分支。
  if (getPlatform() === 'windows') {
    // 返回 `'claude'`，作为权限判定这次计算的结果。
    return 'claude'
  }
  // Use UID to create per-user directories, preventing permission conflicts
  // when multiple users share the same /tmp directory
  // uid读取`process.getuid?.() ?? 0`，供后续判断或组装使用。
  const uid = process.getuid?.() ?? 0
  // 返回 ``claude-${uid}``，作为权限判定这次计算的结果。
  return `claude-${uid}`
}

/**
 * Returns the Claude temp directory path with symlinks resolved.
 * Uses TMPDIR env var if set, otherwise:
 * - On Unix: /tmp/claude-{uid}/ (resolved to /private/tmp/claude-{uid}/ on macOS)
 * - On Windows: {tmpdir}/claude/ (e.g., C:\Users\{user}\AppData\Local\Temp\claude\)
 * This is a per-user temporary directory used by Claude Code for all temp files.
 *
 * NOTE: We resolve symlinks to ensure this path matches the resolved paths used
 * in permission checks. On macOS, /tmp is a symlink to /private/tmp, so without
 * resolution, paths like /tmp/claude-{uid}/... wouldn't match /private/tmp/claude-{uid}/...
 */
// Memoized: called per-tool from permission checks (yoloClassifier, sandbox-adapter)
// and per-turn from BashTool prompt. Inputs (CLAUDE_CODE_TMPDIR env + platform) are
// fixed at startup, and the realpath of the system tmp dir does not change mid-session.
// getClaudeTempDir保存`memoize`，供权限判定后续处理使用。
export const getClaudeTempDir = memoize(function getClaudeTempDir(): string {
  // baseTmpDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseTmpDir =
    process.env.CLAUDE_CODE_TMPDIR ||
    (getPlatform() === 'windows' ? tmpdir() : '/tmp')

  // Resolve symlinks in the base temp directory (e.g., /tmp -> /private/tmp on macOS)
  // This ensures the path matches resolved paths in permission checks
  // fs 集合读取`getFsImplementation`，供权限判定后续处理使用。
  const fs = getFsImplementation()
  // resolvedBaseTmpDir 命名 `baseTmpDir`，让后续代码直接表达这个值的用途。
  let resolvedBaseTmpDir = baseTmpDir
  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // resolvedBaseTmpDir更新为 `fs.realpathSync(baseTmpDir)`，确保权限工具后续读取最新状态。
    resolvedBaseTmpDir = fs.realpathSync(baseTmpDir)
  } catch {
    // If resolution fails, use the original path
  }

  // 返回 `join(resolvedBaseTmpDir, getClaudeTempDirName()) + sep`，作为权限判定这次计算的结果。
  return join(resolvedBaseTmpDir, getClaudeTempDirName()) + sep
})

/**
 * Root for bundled-skill file extraction (see bundledSkills.ts).
 *
 * SECURITY: The per-process random nonce is the load-bearing defense here.
 * Every other path component (uid, VERSION, skill name, file keys) is public
 * knowledge, so without it a local attacker can pre-create the tree on a
 * shared /tmp — sticky bit prevents deletion, not creation — and either
 * symlink an intermediate directory (O_NOFOLLOW only checks the final
 * component) or own a parent dir and swap file contents post-write for prompt
 * injection via the read allowlist. diskOutput.ts gets the same property from
 * the session-ID UUID in its path.
 *
 * Memoized so the extraction writes and the permission check agree on the
 * path for the life of the process. Version-scoped so stale extractions from
 * other binaries don't fall under the allowlist.
 */
// getBundledSkillsRoot保存`memoize`，供权限判定后续处理使用。
export const getBundledSkillsRoot = memoize(
  // getBundledSkillsRoot 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getBundledSkillsRoot(): string {
    // nonce保存`randomBytes`，供权限判定后续处理使用。
    const nonce = randomBytes(16).toString('hex')
    // 返回 `join(getClaudeTempDir(), 'bundled-skills', MACRO.VERSION, nonce)`，作为权限判定这次计算的结果。
    return join(getClaudeTempDir(), 'bundled-skills', MACRO.VERSION, nonce)
  },
)

/**
 * Returns the project temp directory path with trailing separator.
 * Path format: /tmp/claude-{uid}/{sanitized-cwd}/
 */
// getProjectTempDir 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectTempDir(): string {
  // 返回 `join(getClaudeTempDir(), sanitizePath(getOriginalCwd())) + sep`，作为权限判定这次计算的结果。
  return join(getClaudeTempDir(), sanitizePath(getOriginalCwd())) + sep
}

/**
 * Returns the scratchpad directory path for the current session.
 * Path format: /tmp/claude-{uid}/{sanitized-cwd}/{sessionId}/scratchpad/
 */
// getScratchpadDir 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScratchpadDir(): string {
  // 返回 `join(getProjectTempDir(), getSessionId(), 'scratchpad')`，作为权限判定这次计算的结果。
  return join(getProjectTempDir(), getSessionId(), 'scratchpad')
}

/**
 * Ensures the scratchpad directory exists for the current session.
 * Creates the directory with secure permissions (0o700) if it doesn't exist.
 * Returns the path to the scratchpad directory.
 * @throws If scratchpad feature is not enabled
 */
// ensureScratchpadDir 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureScratchpadDir(): Promise<string> {
  // 满足 `!isScratchpadEnabled()` 时，权限判定执行该分支。
  if (!isScratchpadEnabled()) {
    // 抛出 new Error('Scratchpad directory feature is not enabled')，阻止权限判定在无效状态下继续运行。
    throw new Error('Scratchpad directory feature is not enabled')
  }

  // fs 集合读取`getFsImplementation`，供权限判定后续处理使用。
  const fs = getFsImplementation()
  // scratchpadDir读取`getScratchpadDir`，供权限判定后续处理使用。
  const scratchpadDir = getScratchpadDir()

  // Create directory recursively with secure permissions (owner-only access)
  // FsOperations.mkdir handles recursive: true internally and is a no-op if dir exists
  // 等待 `fs.mkdir(scratchpadDir, { mode: 0o700 })` 完成，再继续权限工具 filesystem的异步流程。
  await fs.mkdir(scratchpadDir, { mode: 0o700 })

  // 返回 `scratchpadDir`，作为权限判定这次计算的结果。
  return scratchpadDir
}

// Check if file is within the scratchpad directory
// isScratchpadPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isScratchpadPath(absolutePath: string): boolean {
  // 满足 `!isScratchpadEnabled()` 时，权限判定执行该分支。
  if (!isScratchpadEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // scratchpadDir读取`getScratchpadDir`，供权限判定后续处理使用。
  const scratchpadDir = getScratchpadDir()
  // SECURITY: Normalize the path to resolve .. segments before checking
  // This prevents path traversal bypasses like:
  //   echo "malicious" > /tmp/claude-0/proj/session/scratchpad/../../../etc/passwd
  // Without normalization, the path would pass the startsWith check but write to /etc/passwd
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    normalizedPath === scratchpadDir ||
    normalizedPath.startsWith(scratchpadDir + sep)
  )
}

/**
 * Check if a file path is dangerous to auto-edit without explicit permission.
 * This includes:
 * - Files in .git directories or .gitconfig files (to prevent git-based data exfiltration and code execution)
 * - Files in .vscode directories (to prevent VS Code settings manipulation and potential code execution)
 * - Files in .idea directories (to prevent JetBrains IDE settings manipulation)
 * - Shell configuration files (to prevent shell startup script manipulation)
 * - UNC paths (to prevent network file access and WebDAV attacks)
 */
// isDangerousFilePathToAutoEdit 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDangerousFilePathToAutoEdit(path: string): boolean {
  // absolutePath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absolutePath = expandPath(path)
  // pathSegments 路径数据格式化`absolutePath.split`，供权限判定后续处理使用。
  const pathSegments = absolutePath.split(sep)
  // fileName 文件数据保存`pathSegments.at`，供权限判定后续处理使用。
  const fileName = pathSegments.at(-1)

  // Check for UNC paths (defense-in-depth to catch any patterns that might not be caught by containsVulnerableUncPath)
  // Block anything starting with \\ or // as these are potentially UNC paths that could access network resources
  // 只有 `path.startsWith('\\\\') || path.startsWith('//')` 满足时，权限判定才执行该分支。
  if (path.startsWith('\\\\') || path.startsWith('//')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check if path is within dangerous directories (case-insensitive to prevent bypasses)
  // 按索引扫描 `pathSegments.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < pathSegments.length; i++) {
    // segment保存`pathSegments[i]!`，供权限判定权限工具 filesystem后续判断或输出使用。
    const segment = pathSegments[i]!
    // normalizedSegment保存`normalizeCaseForComparison`，供权限判定后续处理使用。
    const normalizedSegment = normalizeCaseForComparison(segment)

    // 按顺序遍历 `DANGEROUS_DIRECTORIES` 中的dir，逐个交给权限判定处理。
    for (const dir of DANGEROUS_DIRECTORIES) {
      // `normalizedSegment` 与 `normalizeCaseForComparison(dir)` 不一致时刷新派生状态，避免使用过期结果。
      if (normalizedSegment !== normalizeCaseForComparison(dir)) {
        // 跳过当前项，继续处理权限判定中的下一轮循环。
        continue
      }

      // Special case: .claude/worktrees/ is a structural path (where Claude stores
      // git worktrees), not a user-created dangerous directory. Skip the .claude
      // segment when it's followed by 'worktrees'. Any nested .claude directories
      // within the worktree (not followed by 'worktrees') are still blocked.
      // 当 `dir` 匹配 `'.claude'` 时，权限判定执行对应分支。
      if (dir === '.claude') {
        // nextSegment读取 `pathSegments[i + 1]` 对应条目，后续围绕该成员继续处理。
        const nextSegment = pathSegments[i + 1]
        // 权限判定在这里按实际状态进入对应分支。
        if (
          nextSegment &&
          normalizeCaseForComparison(nextSegment) === 'worktrees'
        ) {
          // 结束这个分支或循环，避免权限判定继续落入后续路径。
          break // Skip this .claude, continue checking other segments
        }
      }

      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check for dangerous configuration files (case-insensitive)
  // 满足 `fileName` 时，权限判定执行该分支。
  if (fileName) {
    // normalizedFileName 文件数据保存`normalizeCaseForComparison`，供权限判定后续处理使用。
    const normalizedFileName = normalizeCaseForComparison(fileName)
    // 权限判定在这里按实际状态进入对应分支。
    if (
      (DANGEROUS_FILES as readonly string[]).some(
        // dangerousFile 文件数据更新为 `>`，确保权限工具后续读取最新状态。
        dangerousFile =>
          normalizeCaseForComparison(dangerousFile) === normalizedFileName,
      )
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Detects suspicious Windows path patterns that could bypass security checks.
 * These patterns include:
 * - NTFS Alternate Data Streams (e.g., file.txt::$DATA or file.txt:stream)
 * - 8.3 short names (e.g., GIT~1, CLAUDE~1, SETTIN~1.JSON)
 * - Long path prefixes (e.g., \\?\C:\..., \\.\C:\..., //?/C:/..., //./C:/...)
 * - Trailing dots and spaces (e.g., .git., .claude , .bashrc...)
 * - DOS device names (e.g., .git.CON, settings.json.PRN, .bashrc.AUX)
 * - Three or more consecutive dots (e.g., .../file.txt, path/.../file, file...txt)
 *
 * When detected, these paths should always require manual approval to prevent
 * bypassing security checks through path canonicalization vulnerabilities.
 *
 * ## Why Check on All Platforms?
 *
 * While these patterns are primarily Windows-specific, NTFS filesystems can be
 * mounted on Linux and macOS (e.g., using ntfs-3g). On these systems, the same
 * bypass techniques would work - an attacker could use short names or long path
 * prefixes to bypass security checks. Therefore, we check for these patterns on
 * all platforms to ensure comprehensive protection. (Note: the ADS colon check
 * is Windows/WSL-only, since colon syntax is only interpreted by the Windows
 * kernel; on Linux/macOS, NTFS ADS is accessed via xattrs, not colon syntax.)
 *
 * ## Why Detection Instead of Normalization?
 *
 * An alternative approach would be to normalize these paths using Windows APIs
 * (e.g., GetLongPathNameW). However, this approach has significant challenges:
 *
 * 1. **Filesystem dependency**: Short path normalization is relative to files that
 *    currently exist on the filesystem. This creates issues when writing to new
 *    files since they don't exist yet and cannot be normalized.
 *
 * 2. **Race conditions**: The filesystem state can change between normalization
 *    and actual file access, creating TOCTOU (Time-Of-Check-Time-Of-Use) vulnerabilities.
 *
 * 3. **Complexity**: Proper normalization requires Windows-specific APIs, handling
 *    multiple edge cases, and dealing with various path formats (UNC, device paths, etc.).
 *
 * 4. **Reliability**: Pattern detection is more predictable and doesn't depend on
 *    external system state.
 *
 * If you are considering adding normalization for these paths, please reach out to
 * AppSec first to discuss the security implications and implementation approach.
 *
 * @param path The path to check for suspicious patterns
 * @returns true if suspicious Windows path patterns are detected
 */
// hasSuspiciousWindowsPathPattern 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasSuspiciousWindowsPathPattern(path: string): boolean {
  // Check for NTFS Alternate Data Streams
  // Look for ':' after position 2 to skip drive letters (e.g., C:\)
  // Examples: file.txt::$DATA, .bashrc:hidden, settings.json:stream
  // Note: ADS colon syntax is only interpreted by the Windows kernel. On WSL,
  // DrvFs mounts route file operations through the Windows kernel, so colon
  // syntax is still interpreted as ADS separators. On Linux/macOS (non-WSL),
  // even when NTFS is mounted, ADS is accessed via xattrs (ntfs-3g) not colon
  // syntax, and colons are valid filename characters.
  // 当 `getPlatform()` 匹配 `'windows' || getPlatform() ...` 时，权限判定执行对应分支。
  if (getPlatform() === 'windows' || getPlatform() === 'wsl') {
    // colonIndex 索引保存`path.indexOf`，供权限判定后续处理使用。
    const colonIndex = path.indexOf(':', 2)
    // `colonIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (colonIndex !== -1) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check for 8.3 short names
  // Look for '~' followed by a digit
  // Examples: GIT~1, CLAUDE~1, SETTIN~1.JSON, BASHRC~1
  // 满足 `/~\d/.test(path)` 时，权限判定执行该分支。
  if (/~\d/.test(path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for long path prefixes (both backslash and forward slash variants)
  // Examples: \\?\C:\Users\..., \\.\C:\..., //?/C:/..., //./C:/...
  // 权限判定在这里按实际状态进入对应分支。
  if (
    path.startsWith('\\\\?\\') ||
    path.startsWith('\\\\.\\') ||
    path.startsWith('//?/') ||
    path.startsWith('//./')
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for trailing dots and spaces that Windows strips during path resolution
  // Examples: .git., .claude , .bashrc..., settings.json.
  // This can bypass string matching if ".git" is blocked but ".git." is used
  // 满足 `/[.\s]+$/.test(path)` 时，权限判定执行该分支。
  if (/[.\s]+$/.test(path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for DOS device names that Windows treats as special devices
  // Examples: .git.CON, settings.json.PRN, .bashrc.AUX
  // Device names: CON, PRN, AUX, NUL, COM1-9, LPT1-9
  // 满足 `/\.(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(path)` 时，权限判定执行该分支。
  if (/\.(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for three or more consecutive dots (...) when used as a path component
  // This pattern can be used to bypass security checks or create confusion
  // Examples: .../file.txt, path/.../file
  // Only block when dots are preceded AND followed by path separators (/ or \)
  // This allows legitimate uses like Next.js catch-all routes [...]name]
  // 满足 `/(^|\/|\\)\.{3,}(\/|\\|$)/.test(path)` 时，权限判定执行该分支。
  if (/(^|\/|\\)\.{3,}(\/|\\|$)/.test(path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for UNC paths (on all platforms for defense-in-depth)
  // Examples: \\server\share, \\foo.com\file, //server/share, \\192.168.1.1\share
  // UNC paths can access remote resources, leak credentials, and bypass working directory restrictions
  // 满足 `containsVulnerableUncPath(path)` 时，权限判定执行该分支。
  if (containsVulnerableUncPath(path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if a path is safe for auto-editing (acceptEdits mode).
 * Returns information about why the path is unsafe, or null if all checks pass.
 *
 * This function performs comprehensive safety checks including:
 * - Suspicious Windows path patterns (NTFS streams, 8.3 names, long path prefixes, etc.)
 * - Claude config files (.claude/settings.json, .claude/commands/, .claude/agents/)
 * - MCP CLI state files (managed internally by Claude Code)
 * - Dangerous files (.bashrc, .gitconfig, .git/, .vscode/, .idea/, etc.)
 *
 * IMPORTANT: This function checks BOTH the original path AND resolved symlink paths
 * to prevent bypasses via symlinks pointing to protected files.
 *
 * @param path The path to check for safety
 * @returns Object with safe=false and message if unsafe, or { safe: true } if all checks pass
 */
// checkPathSafetyForAutoEdit 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkPathSafetyForAutoEdit(
  path: string,
  precomputedPathsToCheck?: readonly string[],
):
  | { safe: true }
  | { safe: false; message: string; classifierApprovable: boolean } {
  // Get all paths to check (original + symlink resolved paths)
  // pathsToCheck 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pathsToCheck =
    precomputedPathsToCheck ?? getPathsForPermissionCheck(path)

  // Check for suspicious Windows path patterns on all paths
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // 满足 `hasSuspiciousWindowsPathPattern(pathToCheck)` 时，权限判定执行该分支。
    if (hasSuspiciousWindowsPathPattern(pathToCheck)) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        safe: false,
        message: `Claude requested permissions to write to ${path}, which contains a suspicious Windows path pattern that requires manual approval.`,
        classifierApprovable: false,
      }
    }
  }

  // Check for Claude config files on all paths
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // 满足 `isClaudeConfigFilePath(pathToCheck)` 时，权限判定执行该分支。
    if (isClaudeConfigFilePath(pathToCheck)) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        safe: false,
        message: `Claude requested permissions to write to ${path}, but you haven't granted it yet.`,
        classifierApprovable: true,
      }
    }
  }

  // Check for dangerous files on all paths
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // 满足 `isDangerousFilePathToAutoEdit(pathToCheck)` 时，权限判定执行该分支。
    if (isDangerousFilePathToAutoEdit(pathToCheck)) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        safe: false,
        message: `Claude requested permissions to edit ${path} which is a sensitive file.`,
        classifierApprovable: true,
      }
    }
  }

  // All safety checks passed
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { safe: true }
}

// allWorkingDirectories 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function allWorkingDirectories(
  context: ToolPermissionContext,
): Set<string> {
  // 返回 `new Set([`，作为权限判定这次计算的结果。
  return new Set([
    getOriginalCwd(),
    ...context.additionalWorkingDirectories.keys(),
  ])
}

// Working directories are session-stable; memoize their resolved forms to
// avoid repeated existsSync/lstatSync/realpathSync syscalls on every
// permission check. Keyed by path string — getPathsForPermissionCheck is
// deterministic for existing directories within a session.
// Exported for test/preload.ts cache clearing (shard-isolation).
// getResolvedWorkingDirPaths 路径数据保存`memoize`，供权限判定后续处理使用。
export const getResolvedWorkingDirPaths = memoize(getPathsForPermissionCheck)

// pathInAllowedWorkingPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pathInAllowedWorkingPath(
  path: string,
  toolPermissionContext: ToolPermissionContext,
  precomputedPathsToCheck?: readonly string[],
): boolean {
  // Check both the original path and the resolved symlink path
  // pathsToCheck 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pathsToCheck =
    precomputedPathsToCheck ?? getPathsForPermissionCheck(path)

  // Resolve working directories the same way we resolve input paths so
  // comparisons are symmetric. Without this, a resolved input path
  // (e.g. /System/Volumes/Data/home/... on macOS) would not match an
  // unresolved working directory (/home/...), causing false denials.
  // workingPaths 路径数据保存`Array.from`，供权限判定后续处理使用。
  const workingPaths = Array.from(
    allWorkingDirectories(toolPermissionContext),
  // 这个回调绑定到 ).flatMap(wp => getResolvedWorkingDirPaths(wp))，负责权限判定在该局部场景下的响应。
  ).flatMap(wp => getResolvedWorkingDirPaths(wp))

  // All paths must be within allowed working paths
  // If any resolved path is outside, deny access
  // 返回 `pathsToCheck.every(pathToCheck =>`，作为权限判定这次计算的结果。
  return pathsToCheck.every(pathToCheck =>
    // 调用 workingPaths.some，触发权限判定此处需要的副作用。
    workingPaths.some(workingPath =>
      pathInWorkingPath(pathToCheck, workingPath),
    ),
  )
}

// pathInWorkingPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pathInWorkingPath(path: string, workingPath: string): boolean {
  // absolutePath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absolutePath = expandPath(path)
  // absoluteWorkingPath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absoluteWorkingPath = expandPath(workingPath)

  // On macOS, handle common symlink issues:
  // - /var -> /private/var
  // - /tmp -> /private/tmp
  // normalizedPath 路径数据 命名 `absolutePath`，让后续代码直接表达这个值的用途。
  const normalizedPath = absolutePath
    .replace(/^\/private\/var\//, '/var/')
    .replace(/^\/private\/tmp(\/|$)/, '/tmp$1')
  // normalizedWorkingPath 路径数据保存`absoluteWorkingPath`，供后续判断或组装使用。
  const normalizedWorkingPath = absoluteWorkingPath
    .replace(/^\/private\/var\//, '/var/')
    .replace(/^\/private\/tmp(\/|$)/, '/tmp$1')

  // Normalize case for case-insensitive comparison to prevent bypassing security
  // checks on case-insensitive filesystems (macOS/Windows) like .cLauDe/CoMmAnDs
  // caseNormalizedPath 路径数据保存`normalizeCaseForComparison`，供权限判定后续处理使用。
  const caseNormalizedPath = normalizeCaseForComparison(normalizedPath)
  // caseNormalizedWorkingPath 路径数据保存`normalizeCaseForComparison`，供权限判定后续处理使用。
  const caseNormalizedWorkingPath = normalizeCaseForComparison(
    normalizedWorkingPath,
  )

  // Use cross-platform relative path helper
  // relative保存`relativePath`，供权限判定后续处理使用。
  const relative = relativePath(caseNormalizedWorkingPath, caseNormalizedPath)

  // Same path
  // 满足 `relative === ''` 时，权限判定执行该分支。
  if (relative === '') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 满足 `containsPathTraversal(relative)` 时，权限判定执行该分支。
  if (containsPathTraversal(relative)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Path is inside (relative path that doesn't go up)
  // 返回 `!posix.isAbsolute(relative)`，作为权限判定这次计算的结果。
  return !posix.isAbsolute(relative)
}

// rootPathForSource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rootPathForSource(source: PermissionRuleSource): string {
  // 按照 source 的取值选择权限判定的具体处理分支。
  switch (source) {
    case 'cliArg':
    case 'command':
    case 'session':
      // 返回 `expandPath(getOriginalCwd())`，作为权限判定这次计算的结果。
      return expandPath(getOriginalCwd())
    case 'userSettings':
    case 'policySettings':
    case 'projectSettings':
    case 'localSettings':
    case 'flagSettings':
      // 返回 `getSettingsRootPathForSource(source)`，作为权限判定这次计算的结果。
      return getSettingsRootPathForSource(source)
  }
}

// prependDirSep 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function prependDirSep(path: string): string {
  // 返回 `posix.join(DIR_SEP, path)`，作为权限判定这次计算的结果。
  return posix.join(DIR_SEP, path)
}

// normalizePatternToPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizePatternToPath({
  patternRoot,
  pattern,
  rootPath,
}: {
  patternRoot: string
  pattern: string
  rootPath: string
}): string | null {
  // If the pattern root + pattern combination starts with our reference root
  // fullPattern格式化`posix.join`，供权限判定后续处理使用。
  const fullPattern = posix.join(patternRoot, pattern)
  // 满足 `patternRoot === rootPath` 时，权限判定执行该分支。
  if (patternRoot === rootPath) {
    // If the pattern root exactly matches our reference root no need to change
    // 返回 `prependDirSep(pattern)`，作为权限判定这次计算的结果。
    return prependDirSep(pattern)
  // 权限工具 filesystem在这里处理 `} else if (fullPattern.startsWith(`${rootPath}${DIR_SEP}`)) {`，完成这一小步状态转换。
  } else if (fullPattern.startsWith(`${rootPath}${DIR_SEP}`)) {
    // Extract the relative part
    // relativePart格式化`fullPattern.slice`，供权限判定后续处理使用。
    const relativePart = fullPattern.slice(rootPath.length)
    // 返回 `prependDirSep(relativePart)`，作为权限判定这次计算的结果。
    return prependDirSep(relativePart)
  } else {
    // Handle patterns that are inside the reference root but not starting with it
    // relativePath 路径数据保存`posix.relative`，供权限判定后续处理使用。
    const relativePath = posix.relative(rootPath, patternRoot)
    // 权限判定在这里按实际状态进入对应分支。
    if (
      !relativePath ||
      relativePath.startsWith(`..${DIR_SEP}`) ||
      relativePath === '..'
    ) {
      // Pattern is outside the reference root, so it can be skipped
      // 返回 `null`，作为权限判定这次计算的结果。
      return null
    } else {
      // relativePattern格式化`posix.join`，供权限判定后续处理使用。
      const relativePattern = posix.join(relativePath, pattern)
      // 返回 `prependDirSep(relativePattern)`，作为权限判定这次计算的结果。
      return prependDirSep(relativePattern)
    }
  }
}

// normalizePatternsToPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizePatternsToPath(
  patternsByRoot: Map<string | null, string[]>,
  root: string,
): string[] {
  // null root means the pattern can match anywhere
  // 结果保存`Set`，供权限判定后续处理使用。
  const result = new Set(patternsByRoot.get(null) ?? [])

  // 循环处理 `const [patternRoot, patterns] of patternsByRoot.entries()`，让权限判定把同类条目按顺序走完。
  for (const [patternRoot, patterns] of patternsByRoot.entries()) {
    // 满足 `patternRoot === null` 时，权限判定执行该分支。
    if (patternRoot === null) {
      // already added
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue
    }

    // Check each pattern to see if the full path starts with our reference root
    // 按顺序遍历 `patterns` 中的pattern，逐个交给权限判定处理。
    for (const pattern of patterns) {
      // normalizedPattern保存`normalizePatternToPath`，供权限判定后续处理使用。
      const normalizedPattern = normalizePatternToPath({
        patternRoot,
        pattern,
        rootPath: root,
      })
      // 满足 `normalizedPattern` 时，权限判定执行该分支。
      if (normalizedPattern) {
        // 调用 result.add，触发权限判定此处需要的副作用。
        result.add(normalizedPattern)
      }
    }
  }
  // 返回 `Array.from(result)`，作为权限判定这次计算的结果。
  return Array.from(result)
}

/**
 * Collects all deny rules for file read permissions and returns their ignore patterns
 * Each pattern must be resolved relative to its root (map key)
 * Null keys are used for patterns that don't have a root
 *
 * This is used to hide files that are blocked by Read deny rules.
 *
 * @param toolPermissionContext
 */
// getFileReadIgnorePatterns 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFileReadIgnorePatterns(
  toolPermissionContext: ToolPermissionContext,
): Map<string | null, string[]> {
  // patternsByRoot读取`getPatternsByRoot`，供权限判定后续处理使用。
  const patternsByRoot = getPatternsByRoot(
    toolPermissionContext,
    'read',
    'deny',
  )
  // 结果构建`new Map<string | null, string[]>()`，供后续判断或组装使用。
  const result = new Map<string | null, string[]>()
  // 循环处理 `const [patternRoot, patternMap] of patternsByRoot.entries()`，让权限判定把同类条目按顺序走完。
  for (const [patternRoot, patternMap] of patternsByRoot.entries()) {
    // result.set 写入新的状态值，使权限判定后续读取保持一致。
    result.set(patternRoot, Array.from(patternMap.keys()))
  }

  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

// patternWithRoot 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function patternWithRoot(
  pattern: string,
  source: PermissionRuleSource,
): {
  relativePattern: string
  root: string | null
} {
  // 满足 `pattern.startsWith(`${DIR_SEP}${DIR_SEP}`)` 时，权限判定执行该分支。
  if (pattern.startsWith(`${DIR_SEP}${DIR_SEP}`)) {
    // Patterns starting with // resolve relative to /
    // patternWithoutDoubleSlash格式化`pattern.slice`，供权限判定后续处理使用。
    const patternWithoutDoubleSlash = pattern.slice(1)

    // On Windows, check if this is a POSIX-style drive path like //c/Users/...
    // Note: UNC paths (//server/share) will not match this regex and will be treated
    // as root-relative patterns, which may need separate handling in the future
    // 权限判定在这里按实际状态进入对应分支。
    if (
      getPlatform() === 'windows' &&
      patternWithoutDoubleSlash.match(/^\/[a-z]\//i)
    ) {
      // Convert POSIX path to Windows format
      // The pattern is like /c/Users/... so we convert it to C:\Users\...
      // driveLetter保存`toUpperCase`，供权限判定后续处理使用。
      const driveLetter = patternWithoutDoubleSlash[1]?.toUpperCase() ?? 'C'
      // Keep the pattern in POSIX format since relativePath returns POSIX paths
      // pathAfterDrive 路径数据格式化`patternWithoutDoubleSlash.slice`，供权限判定后续处理使用。
      const pathAfterDrive = patternWithoutDoubleSlash.slice(2)

      // Extract the drive root (C:\) and the rest of the pattern
      // driveRoot 命名 ``${driveLetter}:\\``，让后续代码直接表达这个值的用途。
      const driveRoot = `${driveLetter}:\\`
      // relativeFromDrive保存`pathAfterDrive.startsWith`，供权限判定后续处理使用。
      const relativeFromDrive = pathAfterDrive.startsWith('/')
        ? pathAfterDrive.slice(1)
        : pathAfterDrive

      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        relativePattern: relativeFromDrive,
        root: driveRoot,
      }
    }

    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      relativePattern: patternWithoutDoubleSlash,
      root: DIR_SEP,
    }
  // 权限工具 filesystem在这里处理 `} else if (pattern.startsWith(`~${DIR_SEP}`)) {`，完成这一小步状态转换。
  } else if (pattern.startsWith(`~${DIR_SEP}`)) {
    // Patterns starting with ~/ resolve relative to homedir
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      relativePattern: pattern.slice(1),
      root: homedir().normalize('NFC'),
    }
  // 权限工具 filesystem在这里处理 `} else if (pattern.startsWith(DIR_SEP)) {`，完成这一小步状态转换。
  } else if (pattern.startsWith(DIR_SEP)) {
    // Patterns starting with / resolve relative to the directory where settings are stored (without .claude/)
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      relativePattern: pattern,
      root: rootPathForSource(source),
    }
  }
  // No root specified, put it with all the other patterns
  // Normalize patterns that start with "./" to remove the prefix
  // This ensures that patterns like "./.env" match files like ".env"
  // normalizedPattern 命名 `pattern`，让后续代码直接表达这个值的用途。
  let normalizedPattern = pattern
  // 满足 `pattern.startsWith(`.${DIR_SEP}`)` 时，权限判定执行该分支。
  if (pattern.startsWith(`.${DIR_SEP}`)) {
    // normalizedPattern更新为 `pattern.slice(2)`，确保权限工具后续读取最新状态。
    normalizedPattern = pattern.slice(2)
  }
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    relativePattern: normalizedPattern,
    root: null,
  }
}

// getPatternsByRoot 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPatternsByRoot(
  toolPermissionContext: ToolPermissionContext,
  toolType: 'edit' | 'read',
  behavior: 'allow' | 'deny' | 'ask',
): Map<string | null, Map<string, PermissionRule>> {
  // toolName封装成回调，供权限判定权限工具 filesystem在事件触发或异步步骤中调用。
  const toolName = (() => {
    // 按照 toolType 的取值选择权限判定的具体处理分支。
    switch (toolType) {
      case 'edit':
        // Apply Edit tool rules to any tool editing files
        // 返回 `FILE_EDIT_TOOL_NAME`，作为权限判定这次计算的结果。
        return FILE_EDIT_TOOL_NAME
      case 'read':
        // Apply Read tool rules to any tool reading files
        // 返回 `FILE_READ_TOOL_NAME`，作为权限判定这次计算的结果。
        return FILE_READ_TOOL_NAME
    }
  })()

  // rules 集合读取`getRuleByContentsForToolName`，供权限判定后续处理使用。
  const rules = getRuleByContentsForToolName(
    toolPermissionContext,
    toolName,
    behavior,
  )
  // Resolve rules relative to path based on source
  // patternsByRoot构建`new Map<string | null, Map<string, PermissionRule>>()`，供后续判断或组装使用。
  const patternsByRoot = new Map<string | null, Map<string, PermissionRule>>()
  // 循环处理 `const [pattern, rule] of rules.entries()`，让权限判定把同类条目按顺序走完。
  for (const [pattern, rule] of rules.entries()) {
    // 从 `patternWithRoot(pattern, rule.source)` 解构 relativePattern、root，减少权限工具 filesystem对同一对象的重复访问。
    const { relativePattern, root } = patternWithRoot(pattern, rule.source)
    // patternsForRoot读取`patternsByRoot.get`，供权限判定后续处理使用。
    let patternsForRoot = patternsByRoot.get(root)
    // 满足 `patternsForRoot === undefined` 时，权限判定执行该分支。
    if (patternsForRoot === undefined) {
      // patternsForRoot更新为 `new Map<string, PermissionRule>()`，确保权限工具后续读取最新状态。
      patternsForRoot = new Map<string, PermissionRule>()
      // patternsByRoot.set 写入新的状态值，使权限判定后续读取保持一致。
      patternsByRoot.set(root, patternsForRoot)
    }
    // Store the rule keyed by the root
    // patternsForRoot.set 写入新的状态值，使权限判定后续读取保持一致。
    patternsForRoot.set(relativePattern, rule)
  }
  // 返回 `patternsByRoot`，作为权限判定这次计算的结果。
  return patternsByRoot
}

// matchingRuleForInput 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchingRuleForInput(
  path: string,
  toolPermissionContext: ToolPermissionContext,
  toolType: 'edit' | 'read',
  behavior: 'allow' | 'deny' | 'ask',
): PermissionRule | null {
  // fileAbsolutePath 路径数据保存`expandPath`，供权限判定后续处理使用。
  let fileAbsolutePath = expandPath(path)

  // On Windows, convert to POSIX format to match against permission patterns
  // 只有 `getPlatform() === 'windows' && fileAbsolutePath.includes('\\')` 满足时，权限判定才执行该分支。
  if (getPlatform() === 'windows' && fileAbsolutePath.includes('\\')) {
    // fileAbsolutePath 路径数据更新为 `windowsPathToPosixPath(fileAbsolutePath)`，确保权限工具后续读取最新状态。
    fileAbsolutePath = windowsPathToPosixPath(fileAbsolutePath)
  }

  // patternsByRoot读取`getPatternsByRoot`，供权限判定后续处理使用。
  const patternsByRoot = getPatternsByRoot(
    toolPermissionContext,
    toolType,
    behavior,
  )

  // Check each root for a matching pattern
  // 循环处理 `const [root, patternMap] of patternsByRoot.entries()`，让权限判定把同类条目按顺序走完。
  for (const [root, patternMap] of patternsByRoot.entries()) {
    // Transform patterns for the ignore library
    // patterns 集合保存`Array.from`，供权限判定后续处理使用。
    const patterns = Array.from(patternMap.keys()).map(pattern => {
      // adjustedPattern 命名 `pattern`，让后续代码直接表达这个值的用途。
      let adjustedPattern = pattern

      // Remove /** suffix - ignore library treats 'path' as matching both
      // the path itself and everything inside it
      // 满足 `adjustedPattern.endsWith('/**')` 时，权限判定执行该分支。
      if (adjustedPattern.endsWith('/**')) {
        // adjustedPattern更新为 `adjustedPattern.slice(0, -3)`，确保权限工具后续读取最新状态。
        adjustedPattern = adjustedPattern.slice(0, -3)
      }

      // 返回 `adjustedPattern`，作为权限判定这次计算的结果。
      return adjustedPattern
    })

    // ig保存`ignore`，供权限判定后续处理使用。
    const ig = ignore().add(patterns)

    // Use cross-platform relative path helper for POSIX-style patterns
    // relativePathStr 路径数据保存`relativePath`，供权限判定后续处理使用。
    const relativePathStr = relativePath(
      root ?? getCwd(),
      fileAbsolutePath ?? getCwd(),
    )

    // 满足 `relativePathStr.startsWith(`..${DIR_SEP}`)` 时，权限判定执行该分支。
    if (relativePathStr.startsWith(`..${DIR_SEP}`)) {
      // The path is outside the root, so ignore it
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue
    }

    // Important: ig.test throws if you give it an empty string
    // relativePathStr 路径数据缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!relativePathStr) {
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue
    }

    // igResult保存`ig.test`，供权限判定后续处理使用。
    const igResult = ig.test(relativePathStr)

    // 只有 `igResult.ignored && igResult.rule` 满足时，权限判定才执行该分支。
    if (igResult.ignored && igResult.rule) {
      // Map the matched pattern back to the original rule
      // originalPattern 命名 `igResult.rule.pattern`，让后续代码直接表达这个值的用途。
      const originalPattern = igResult.rule.pattern

      // Check if this was a /** pattern we simplified
      // withWildcard 命名 `originalPattern + '/**'`，让后续代码直接表达这个值的用途。
      const withWildcard = originalPattern + '/**'
      // 满足 `patternMap.has(withWildcard)` 时，权限判定执行该分支。
      if (patternMap.has(withWildcard)) {
        // 返回 `patternMap.get(withWildcard) ?? null`，作为权限判定这次计算的结果。
        return patternMap.get(withWildcard) ?? null
      }

      // 返回 `patternMap.get(originalPattern) ?? null`，作为权限判定这次计算的结果。
      return patternMap.get(originalPattern) ?? null
    }
  }

  // No matching rule found
  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

/**
 * Permission result for read permission for the specified tool & tool input
 */
// checkReadPermissionForTool 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkReadPermissionForTool(
  tool: Tool,
  input: { [key: string]: unknown },
  toolPermissionContext: ToolPermissionContext,
): PermissionDecision {
  // `typeof tool.getPath` 与 `'function'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof tool.getPath !== 'function') {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'ask',
      message: `Claude requested permissions to use ${tool.name}, but you haven't granted it yet.`,
    }
  }
  // 路径读取`tool.getPath`，供权限判定后续处理使用。
  const path = tool.getPath(input)

  // Get paths to check (includes both original and resolved symlinks).
  // Computed once here and threaded through checkWritePermissionForTool →
  // checkPathSafetyForAutoEdit → pathInAllowedWorkingPath to avoid redundant
  // existsSync/lstatSync/realpathSync syscalls on the same path (previously
  // 6× = 30 syscalls per Read permission check).
  // pathsToCheck 路径数据读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
  const pathsToCheck = getPathsForPermissionCheck(path)

  // 1. Defense-in-depth: Block UNC paths early (before other checks)
  // This catches paths starting with \\ or // that could access network resources
  // This may catch some UNC patterns not detected by containsVulnerableUncPath
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // 只有 `pathToCheck.startsWith('\\\\') || pathToCheck.startsWith('//')` 满足时，权限判定才执行该分支。
    if (pathToCheck.startsWith('\\\\') || pathToCheck.startsWith('//')) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Claude requested permissions to read from ${path}, which appears to be a UNC path that could access network resources.`,
        decisionReason: {
          type: 'other',
          reason: 'UNC path detected (defense-in-depth check)',
        },
      }
    }
  }

  // 2. Check for suspicious Windows path patterns (defense in depth)
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // 满足 `hasSuspiciousWindowsPathPattern(pathToCheck)` 时，权限判定执行该分支。
    if (hasSuspiciousWindowsPathPattern(pathToCheck)) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Claude requested permissions to read from ${path}, which contains a suspicious Windows path pattern that requires manual approval.`,
        decisionReason: {
          type: 'other',
          reason:
            'Path contains suspicious Windows-specific patterns (alternate data streams, short names, long path prefixes, or three or more consecutive dots) that require manual verification',
        },
      }
    }
  }

  // 3. Check for READ-SPECIFIC deny rules first - check both the original path and resolved symlink path
  // SECURITY: This must come before any allow checks (including "edit access implies read access")
  // to prevent bypassing explicit read deny rules
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // denyRule保存`matchingRuleForInput`，供权限判定后续处理使用。
    const denyRule = matchingRuleForInput(
      pathToCheck,
      toolPermissionContext,
      'read',
      'deny',
    )
    // 满足 `denyRule` 时，权限判定执行该分支。
    if (denyRule) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'deny',
        message: `Permission to read ${path} has been denied.`,
        decisionReason: {
          type: 'rule',
          rule: denyRule,
        },
      }
    }
  }

  // 4. Check for READ-SPECIFIC ask rules - check both the original path and resolved symlink path
  // SECURITY: This must come before implicit allow checks to ensure explicit ask rules are honored
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // askRule保存`matchingRuleForInput`，供权限判定后续处理使用。
    const askRule = matchingRuleForInput(
      pathToCheck,
      toolPermissionContext,
      'read',
      'ask',
    )
    // 满足 `askRule` 时，权限判定执行该分支。
    if (askRule) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Claude requested permissions to read from ${path}, but you haven't granted it yet.`,
        decisionReason: {
          type: 'rule',
          rule: askRule,
        },
      }
    }
  }

  // 5. Edit access implies read access (but only if no read-specific deny/ask rules exist)
  // We check this after read-specific rules so that explicit read restrictions take precedence
  // editResult读取`checkWritePermissionForTool`，供权限判定后续处理使用。
  const editResult = checkWritePermissionForTool(
    tool,
    input,
    toolPermissionContext,
    pathsToCheck,
  )
  // 当 `editResult.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
  if (editResult.behavior === 'allow') {
    // 返回 `editResult`，作为权限判定这次计算的结果。
    return editResult
  }

  // 6. Allow reads in working directories
  // isInWorkingDir记录 `pathInAllowedWorkingPath` 是否成立，权限判定随后按该结果分支。
  const isInWorkingDir = pathInAllowedWorkingPath(
    path,
    toolPermissionContext,
    pathsToCheck,
  )
  // 满足 `isInWorkingDir` 时，权限判定执行该分支。
  if (isInWorkingDir) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'mode',
        mode: 'default',
      },
    }
  }

  // 7. Allow reads from internal harness paths (session-memory, plans, tool-results)
  // absolutePath 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absolutePath = expandPath(path)
  // internalReadResult读取`checkReadableInternalPath`，供权限判定后续处理使用。
  const internalReadResult = checkReadableInternalPath(absolutePath, input)
  // `internalReadResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态，避免使用过期结果。
  if (internalReadResult.behavior !== 'passthrough') {
    // 返回 `internalReadResult`，作为权限判定这次计算的结果。
    return internalReadResult
  }

  // 8. Check for allow rules
  // allowRule保存`matchingRuleForInput`，供权限判定后续处理使用。
  const allowRule = matchingRuleForInput(
    path,
    toolPermissionContext,
    'read',
    'allow',
  )
  // 满足 `allowRule` 时，权限判定执行该分支。
  if (allowRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'rule',
        rule: allowRule,
      },
    }
  }

  // 12. Default to asking for permission
  // At this point, isInWorkingDir is false (from step #6), so path is outside working directories
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    behavior: 'ask',
    message: `Claude requested permissions to read from ${path}, but you haven't granted it yet.`,
    suggestions: generateSuggestions(
      path,
      'read',
      toolPermissionContext,
      pathsToCheck,
    ),
    decisionReason: {
      type: 'workingDir',
      reason: 'Path is outside allowed working directories',
    },
  }
}

/**
 * Permission result for write permission for the specified tool & tool input.
 *
 * @param precomputedPathsToCheck - Optional cached result of
 *   `getPathsForPermissionCheck(tool.getPath(input))`. Callers MUST derive this
 *   from the same `tool` and `input` in the same synchronous frame — `path` is
 *   re-derived internally for error messages and internal-path checks, so a
 *   stale value would silently check deny rules for the wrong path.
 */
// checkWritePermissionForTool 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkWritePermissionForTool<Input extends AnyObject>(
  tool: Tool<Input>,
  input: z.infer<Input>,
  toolPermissionContext: ToolPermissionContext,
  precomputedPathsToCheck?: readonly string[],
): PermissionDecision {
  // `typeof tool.getPath` 与 `'function'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof tool.getPath !== 'function') {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'ask',
      message: `Claude requested permissions to use ${tool.name}, but you haven't granted it yet.`,
    }
  }
  // 路径读取`tool.getPath`，供权限判定后续处理使用。
  const path = tool.getPath(input)

  // 1. Check for deny rules - check both the original path and resolved symlink path
  // pathsToCheck 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pathsToCheck =
    precomputedPathsToCheck ?? getPathsForPermissionCheck(path)
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // denyRule保存`matchingRuleForInput`，供权限判定后续处理使用。
    const denyRule = matchingRuleForInput(
      pathToCheck,
      toolPermissionContext,
      'edit',
      'deny',
    )
    // 满足 `denyRule` 时，权限判定执行该分支。
    if (denyRule) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'deny',
        message: `Permission to edit ${path} has been denied.`,
        decisionReason: {
          type: 'rule',
          rule: denyRule,
        },
      }
    }
  }

  // 1.5. Allow writes to internal editable paths (plan files, scratchpad)
  // This MUST come before isDangerousFilePathToAutoEdit check since .claude is a dangerous directory
  // absolutePathForEdit 路径数据保存`expandPath`，供权限判定后续处理使用。
  const absolutePathForEdit = expandPath(path)
  // internalEditResult读取`checkEditableInternalPath`，供权限判定后续处理使用。
  const internalEditResult = checkEditableInternalPath(
    absolutePathForEdit,
    input,
  )
  // `internalEditResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态，避免使用过期结果。
  if (internalEditResult.behavior !== 'passthrough') {
    // 返回 `internalEditResult`，作为权限判定这次计算的结果。
    return internalEditResult
  }

  // 1.6. Check for .claude/** allow rules BEFORE safety checks
  // This allows session-level permissions to bypass the safety blocks for .claude/
  // We only allow this for session-level rules to prevent users from accidentally
  // permanently granting broad access to their .claude/ folder.
  //
  // matchingRuleForInput returns the first match across all sources. If the user
  // also has a broader Edit(.claude) rule in userSettings (e.g. from sandbox
  // write-allow conversion), that rule would be found first and its source check
  // below would fail. Scope the search to session-only rules so the dialog's
  // "allow Claude to edit its own settings for this session" option actually works.
  // claudeFolderAllowRule保存`matchingRuleForInput`，供权限判定后续处理使用。
  const claudeFolderAllowRule = matchingRuleForInput(
    path,
    {
      ...toolPermissionContext,
      alwaysAllowRules: {
        session: toolPermissionContext.alwaysAllowRules.session ?? [],
      },
    },
    'edit',
    'allow',
  )
  // 满足 `claudeFolderAllowRule` 时，权限判定执行该分支。
  if (claudeFolderAllowRule) {
    // Check if this rule is scoped under .claude/ (project or global).
    // Accepts both the broad patterns ('/.claude/**', '~/.claude/**') and
    // narrowed ones like '/.claude/skills/my-skill/**' so users can grant
    // session access to a single skill without also exposing settings.json
    // or hooks/. The rule already matched the path via matchingRuleForInput;
    // this is an additional scope check. Reject '..' to prevent a rule like
    // '/.claude/../**' from leaking this bypass outside .claude/.
    // ruleContent 命名 `claudeFolderAllowRule.ruleValue.ruleContent`，让后续代码直接表达这个值的用途。
    const ruleContent = claudeFolderAllowRule.ruleValue.ruleContent
    // 权限判定在这里按实际状态进入对应分支。
    if (
      ruleContent &&
      (ruleContent.startsWith(CLAUDE_FOLDER_PERMISSION_PATTERN.slice(0, -2)) ||
        ruleContent.startsWith(
          GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN.slice(0, -2),
        )) &&
      !ruleContent.includes('..') &&
      ruleContent.endsWith('/**')
    ) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'allow',
        updatedInput: input,
        decisionReason: {
          type: 'rule',
          rule: claudeFolderAllowRule,
        },
      }
    }
  }

  // 1.7. Check comprehensive safety validations (Windows patterns, Claude config, dangerous files)
  // This MUST come before checking allow rules to prevent users from accidentally granting
  // permission to edit protected files
  // safetyCheck读取`checkPathSafetyForAutoEdit`，供权限判定后续处理使用。
  const safetyCheck = checkPathSafetyForAutoEdit(path, pathsToCheck)
  // safetyCheck.safe缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!safetyCheck.safe) {
    // SDK suggestion: if under .claude/skills/{name}/, emit the narrowed
    // session-scoped addRules that step 1.6 will honor on the next call.
    // Everything else (.claude/settings.json, .git/, .vscode/, .idea/) falls
    // back to generateSuggestions — its setMode suggestion doesn't bypass
    // this check, but preserving it avoids a surprising empty array.
    // skillScope读取`getClaudeSkillScope`，供权限判定后续处理使用。
    const skillScope = getClaudeSkillScope(path)
    // safetySuggestions 集合保存`skillScope`，供后续判断或组装使用。
    const safetySuggestions: PermissionUpdate[] = skillScope
      ? [
          {
            type: 'addRules',
            rules: [
              {
                toolName: FILE_EDIT_TOOL_NAME,
                ruleContent: skillScope.pattern,
              },
            ],
            behavior: 'allow',
            destination: 'session',
          },
        ]
      : generateSuggestions(path, 'write', toolPermissionContext, pathsToCheck)
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'ask',
      message: safetyCheck.message,
      suggestions: safetySuggestions,
      decisionReason: {
        type: 'safetyCheck',
        reason: safetyCheck.message,
        classifierApprovable: safetyCheck.classifierApprovable,
      },
    }
  }

  // 2. Check for ask rules - check both the original path and resolved symlink path
  // 按顺序遍历 `pathsToCheck` 中的pathToCheck 路径数据，逐个交给权限判定处理。
  for (const pathToCheck of pathsToCheck) {
    // askRule保存`matchingRuleForInput`，供权限判定后续处理使用。
    const askRule = matchingRuleForInput(
      pathToCheck,
      toolPermissionContext,
      'edit',
      'ask',
    )
    // 满足 `askRule` 时，权限判定执行该分支。
    if (askRule) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Claude requested permissions to write to ${path}, but you haven't granted it yet.`,
        decisionReason: {
          type: 'rule',
          rule: askRule,
        },
      }
    }
  }

  // 3. If in acceptEdits or sandboxBashMode mode, allow all writes in original cwd
  // isInWorkingDir记录 `pathInAllowedWorkingPath` 是否成立，权限判定随后按该结果分支。
  const isInWorkingDir = pathInAllowedWorkingPath(
    path,
    toolPermissionContext,
    pathsToCheck,
  )
  // 只有 `toolPermissionContext.mode === 'acceptEdits' && i` 满足时，权限判定才执行该分支。
  if (toolPermissionContext.mode === 'acceptEdits' && isInWorkingDir) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'mode',
        mode: toolPermissionContext.mode,
      },
    }
  }

  // 4. Check for allow rules
  // allowRule保存`matchingRuleForInput`，供权限判定后续处理使用。
  const allowRule = matchingRuleForInput(
    path,
    toolPermissionContext,
    'edit',
    'allow',
  )
  // 满足 `allowRule` 时，权限判定执行该分支。
  if (allowRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'rule',
        rule: allowRule,
      },
    }
  }

  // 5. Default to asking for permission
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    behavior: 'ask',
    message: `Claude requested permissions to write to ${path}, but you haven't granted it yet.`,
    suggestions: generateSuggestions(
      path,
      'write',
      toolPermissionContext,
      pathsToCheck,
    ),
    decisionReason: !isInWorkingDir
      ? {
          type: 'workingDir',
          reason: 'Path is outside allowed working directories',
        }
      : undefined,
  }
}

// generateSuggestions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateSuggestions(
  filePath: string,
  operationType: 'read' | 'write' | 'create',
  toolPermissionContext: ToolPermissionContext,
  precomputedPathsToCheck?: readonly string[],
): PermissionUpdate[] {
  // isOutsideWorkingDir记录 `pathInAllowedWorkingPath` 是否成立，权限判定随后按该结果分支。
  const isOutsideWorkingDir = !pathInAllowedWorkingPath(
    filePath,
    toolPermissionContext,
    precomputedPathsToCheck,
  )

  // 只有 `operationType === 'read' && isOutsideWorkingDir` 满足时，权限判定才执行该分支。
  if (operationType === 'read' && isOutsideWorkingDir) {
    // For read operations outside working directories, add Read rules
    // IMPORTANT: Include both the symlink path and resolved path so subsequent checks pass
    // dirPath 路径数据读取`getDirectoryForPath`，供权限判定后续处理使用。
    const dirPath = getDirectoryForPath(filePath)
    // dirsToAdd读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
    const dirsToAdd = getPathsForPermissionCheck(dirPath)

    // suggestions 集合保存`dirsToAdd`，供权限判定权限工具 filesystem后续判断或输出使用。
    const suggestions = dirsToAdd
      // 链式调用 map，继续加工上一行在权限判定中产生的数据。
      .map(dir => createReadRuleSuggestion(dir, 'session'))
      // 链式调用 filter，继续加工上一行在权限判定中产生的数据。
      .filter((s): s is PermissionUpdate => s !== undefined)

    // 返回 `suggestions`，作为权限判定这次计算的结果。
    return suggestions
  }

  // Only suggest setMode:acceptEdits when it would be an upgrade. In auto
  // mode the classifier already auto-approves edits; in bypassPermissions
  // everything is allowed; in acceptEdits it's a no-op. Suggesting it
  // anyway and having the SDK host apply it on "Always allow" silently
  // downgrades auto → acceptEdits, which then prompts for MCP/Bash.
  // shouldSuggestAcceptEdits 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldSuggestAcceptEdits =
    toolPermissionContext.mode === 'default' ||
    toolPermissionContext.mode === 'plan'

  // 只有 `operationType === 'write' || operationType === 'c` 满足时，权限判定才执行该分支。
  if (operationType === 'write' || operationType === 'create') {
    // updates 集合 命名 `shouldSuggestAcceptEdits`，让后续代码直接表达这个值的用途。
    const updates: PermissionUpdate[] = shouldSuggestAcceptEdits
      ? [{ type: 'setMode', mode: 'acceptEdits', destination: 'session' }]
      : []

    // 满足 `isOutsideWorkingDir` 时，权限判定执行该分支。
    if (isOutsideWorkingDir) {
      // For write operations outside working directories, also add the directory
      // IMPORTANT: Include both the symlink path and resolved path so subsequent checks pass
      // dirPath 路径数据读取`getDirectoryForPath`，供权限判定后续处理使用。
      const dirPath = getDirectoryForPath(filePath)
      // dirsToAdd读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
      const dirsToAdd = getPathsForPermissionCheck(dirPath)

      // updates 集合追加新条目，保持收集顺序与输入顺序一致。
      updates.push({
        type: 'addDirectories',
        directories: dirsToAdd,
        destination: 'session',
      })
    }

    // 返回 `updates`，作为权限判定这次计算的结果。
    return updates
  }

  // For read operations inside working directories, just change mode
  // 返回 `shouldSuggestAcceptEdits`，作为权限判定这次计算的结果。
  return shouldSuggestAcceptEdits
    ? [{ type: 'setMode', mode: 'acceptEdits', destination: 'session' }]
    : []
}

/**
 * Check if a path is an internal path that can be edited without permission.
 * Returns a PermissionResult - either 'allow' if matched, or 'passthrough' to continue checking.
 */
// checkEditableInternalPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkEditableInternalPath(
  absolutePath: string,
  input: { [key: string]: unknown },
): PermissionResult {
  // SECURITY: Normalize path to prevent traversal bypasses via .. segments
  // This is defense-in-depth; individual helper functions also normalize
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)

  // Plan files for current session
  // 满足 `isSessionPlanFile(normalizedPath)` 时，权限判定执行该分支。
  if (isSessionPlanFile(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Plan files for current session are allowed for writing',
      },
    }
  }

  // Scratchpad directory for current session
  // 满足 `isScratchpadPath(normalizedPath)` 时，权限判定执行该分支。
  if (isScratchpadPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Scratchpad files for current session are allowed for writing',
      },
    }
  }

  // Template job's own directory. Env key hardcoded (vs importing JOB_ENV_KEY
  // from jobs/state) so tree-shaking eliminates the string from external
  // builds — spawn.test.ts asserts the string matches. Hijack guard: the env
  // var value must itself resolve under ~/.claude/jobs/. Symlink guard: every
  // resolved form of the target (lexical + symlink chain) must fall under some
  // resolved form of the job dir, so a symlink inside the job dir pointing at
  // e.g. ~/.ssh/authorized_keys does not get a free write. Resolving both
  // sides handles the macOS /tmp → /private/tmp case where the config dir
  // lives under a symlinked root.
  // 满足 `feature('TEMPLATES')` 时，权限判定执行该分支。
  if (feature('TEMPLATES')) {
    // jobDir 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const jobDir = process.env.CLAUDE_JOB_DIR
    // 满足 `jobDir` 时，权限判定执行该分支。
    if (jobDir) {
      // jobsRoot格式化`join`，供权限判定后续处理使用。
      const jobsRoot = join(getClaudeConfigHomeDir(), 'jobs')
      // jobDirForms 集合读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
      const jobDirForms = getPathsForPermissionCheck(jobDir).map(normalize)
      // jobsRootForms 集合读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
      const jobsRootForms = getPathsForPermissionCheck(jobsRoot).map(normalize)
      // Hijack guard: every resolved form of the job dir must sit under
      // some resolved form of the jobs root. Resolving both sides handles
      // the case where ~/.claude is a symlink (e.g. to /data/claude-config).
      // isUnderJobsRoot记录 `jobDirForms.every` 是否成立，权限判定随后按该结果分支。
      const isUnderJobsRoot = jobDirForms.every(jd =>
        // 调用 jobsRootForms.some，触发权限判定此处需要的副作用。
        jobsRootForms.some(jr => jd.startsWith(jr + sep)),
      )
      // 满足 `isUnderJobsRoot` 时，权限判定执行该分支。
      if (isUnderJobsRoot) {
        // targetForms 集合读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
        const targetForms = getPathsForPermissionCheck(absolutePath)
        // allInsideJobDir筛选`targetForms.every`，供权限判定后续处理使用。
        const allInsideJobDir = targetForms.every(p => {
          // np保存`normalize`，供权限判定后续处理使用。
          const np = normalize(p)
          // 返回 `jobDirForms.some(jd => np === jd || np.startsWith(jd + sep))`，作为权限判定这次计算的结果。
          return jobDirForms.some(jd => np === jd || np.startsWith(jd + sep))
        })
        // 满足 `allInsideJobDir` 时，权限判定执行该分支。
        if (allInsideJobDir) {
          // 返回结构化结果，集中表达权限判定已经整理出的状态。
          return {
            behavior: 'allow',
            updatedInput: input,
            decisionReason: {
              type: 'other',
              reason:
                'Job directory files for current job are allowed for writing',
            },
          }
        }
      }
    }
  }

  // Agent memory directory (for self-improving agents)
  // 满足 `isAgentMemoryPath(normalizedPath)` 时，权限判定执行该分支。
  if (isAgentMemoryPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Agent memory files are allowed for writing',
      },
    }
  }

  // Memdir directory (persistent memory for cross-session learning)
  // This pre-safety-check carve-out exists because the default path is under
  // ~/.claude/, which is in DANGEROUS_DIRECTORIES. The CLAUDE_COWORK_MEMORY_PATH_OVERRIDE
  // override is an arbitrary caller-designated directory with no such conflict,
  // so it gets NO special permission treatment here — writes go through normal
  // permission flow (step 5 → ask). SDK callers who want silent memory should
  // pass an allow rule for the override path.
  // 只有 `!hasAutoMemPathOverride() && isAutoMemPath(normalizedPath)` 满足时，权限判定才执行该分支。
  if (!hasAutoMemPathOverride() && isAutoMemPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'auto memory files are allowed for writing',
      },
    }
  }

  // .claude/launch.json — desktop preview config (dev server command + port).
  // The desktop's preview_start MCP tool instructs Claude to create/update
  // this file as part of the preview workflow. Without this carve-out the
  // .claude/ DANGEROUS_DIRECTORIES check prompts for it, which in SDK mode
  // cascades: user clicks "Always allow" → setMode:acceptEdits suggestion
  // applied → silent downgrade from auto mode. Matches the project-level
  // .claude/ only (not ~/.claude/) since launch.json is per-project.
  // 权限判定在这里按实际状态进入对应分支。
  if (
    normalizeCaseForComparison(normalizedPath) ===
    normalizeCaseForComparison(join(getOriginalCwd(), '.claude', 'launch.json'))
  ) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Preview launch config is allowed for writing',
      },
    }
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { behavior: 'passthrough', message: '' }
}

/**
 * Check if a path is an internal path that can be read without permission.
 * Returns a PermissionResult - either 'allow' if matched, or 'passthrough' to continue checking.
 */
// checkReadableInternalPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkReadableInternalPath(
  absolutePath: string,
  input: { [key: string]: unknown },
): PermissionResult {
  // SECURITY: Normalize path to prevent traversal bypasses via .. segments
  // This is defense-in-depth; individual helper functions also normalize
  // normalizedPath 路径数据保存`normalize`，供权限判定后续处理使用。
  const normalizedPath = normalize(absolutePath)

  // Session memory directory
  // 满足 `isSessionMemoryPath(normalizedPath)` 时，权限判定执行该分支。
  if (isSessionMemoryPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Session memory files are allowed for reading',
      },
    }
  }

  // Project directory (for reading past session memories)
  // Path format: ~/.claude/projects/{sanitized-cwd}/...
  // 满足 `isProjectDirPath(normalizedPath)` 时，权限判定执行该分支。
  if (isProjectDirPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Project directory files are allowed for reading',
      },
    }
  }

  // Plan files for current session
  // 满足 `isSessionPlanFile(normalizedPath)` 时，权限判定执行该分支。
  if (isSessionPlanFile(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Plan files for current session are allowed for reading',
      },
    }
  }

  // Tool results directory (persisted large outputs)
  // Use path separator suffix to prevent path traversal (e.g., tool-results-evil/)
  // toolResultsDir读取`getToolResultsDir`，供权限判定后续处理使用。
  const toolResultsDir = getToolResultsDir()
  // toolResultsDirWithSep保存`toolResultsDir.endsWith`，供权限判定后续处理使用。
  const toolResultsDirWithSep = toolResultsDir.endsWith(sep)
    ? toolResultsDir
    : toolResultsDir + sep
  // 权限判定在这里按实际状态进入对应分支。
  if (
    normalizedPath === toolResultsDir ||
    normalizedPath.startsWith(toolResultsDirWithSep)
  ) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Tool result files are allowed for reading',
      },
    }
  }

  // Scratchpad directory for current session
  // 满足 `isScratchpadPath(normalizedPath)` 时，权限判定执行该分支。
  if (isScratchpadPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Scratchpad files for current session are allowed for reading',
      },
    }
  }

  // Project temp directory (/tmp/claude/{sanitized-cwd}/)
  // Intentionally allows reading files from all sessions in this project, not just the current session.
  // This enables cross-session file access within the same project's temp space.
  // projectTempDir读取`getProjectTempDir`，供权限判定后续处理使用。
  const projectTempDir = getProjectTempDir()
  // 满足 `normalizedPath.startsWith(projectTempDir)` 时，权限判定执行该分支。
  if (normalizedPath.startsWith(projectTempDir)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Project temp directory files are allowed for reading',
      },
    }
  }

  // Agent memory directory (for self-improving agents)
  // 满足 `isAgentMemoryPath(normalizedPath)` 时，权限判定执行该分支。
  if (isAgentMemoryPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Agent memory files are allowed for reading',
      },
    }
  }

  // Memdir directory (persistent memory for cross-session learning)
  // 满足 `isAutoMemPath(normalizedPath)` 时，权限判定执行该分支。
  if (isAutoMemPath(normalizedPath)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'auto memory files are allowed for reading',
      },
    }
  }

  // Tasks directory (~/.claude/tasks/) for swarm task coordination
  // tasksDir格式化`join`，供权限判定后续处理使用。
  const tasksDir = join(getClaudeConfigHomeDir(), 'tasks') + sep
  // 权限判定在这里按实际状态进入对应分支。
  if (
    normalizedPath === tasksDir.slice(0, -1) ||
    normalizedPath.startsWith(tasksDir)
  ) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Task files are allowed for reading',
      },
    }
  }

  // Teams directory (~/.claude/teams/) for swarm coordination
  // teamsReadDir格式化`join`，供权限判定后续处理使用。
  const teamsReadDir = join(getClaudeConfigHomeDir(), 'teams') + sep
  // 权限判定在这里按实际状态进入对应分支。
  if (
    normalizedPath === teamsReadDir.slice(0, -1) ||
    normalizedPath.startsWith(teamsReadDir)
  ) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Team files are allowed for reading',
      },
    }
  }

  // Bundled skill reference files extracted on first invocation.
  // SECURITY: See getBundledSkillsRoot() — the per-process nonce in the path
  // is the load-bearing defense; uid/VERSION alone are public knowledge and
  // squattable. We always write-before-read on invocation, so content under
  // this subtree is harness-controlled.
  // bundledSkillsRoot读取`getBundledSkillsRoot`，供权限判定后续处理使用。
  const bundledSkillsRoot = getBundledSkillsRoot() + sep
  // 满足 `normalizedPath.startsWith(bundledSkillsRoot)` 时，权限判定执行该分支。
  if (normalizedPath.startsWith(bundledSkillsRoot)) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Bundled skill reference files are allowed for reading',
      },
    }
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { behavior: 'passthrough', message: '' }
}
