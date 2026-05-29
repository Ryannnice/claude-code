// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { statSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { lstat, readdir, readFile, realpath, stat } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, resolve, sep } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 引入 getProjectRoot，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot } from '../bootstrap/state.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from './errors.js'
// 引入 normalizePathForComparison，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { normalizePathForComparison } from './file.js'
// 类型依赖 { FrontmatterData } 来自 ./frontmatterParser.js，用于校准共享工具的数据契约。
import type { FrontmatterData } from './frontmatterParser.js'
// 引入 parseFrontmatter，将 ./frontmatterParser.js 中已经封装好的能力接到本文件流程里。
import { parseFrontmatter } from './frontmatterParser.js'
// 引入 findCanonicalGitRoot、findGitRoot，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { findCanonicalGitRoot, findGitRoot } from './git.js'
// 引入 parseToolListFromCLI，将 ./permissions/permissionSetup.js 中已经封装好的能力接到本文件流程里。
import { parseToolListFromCLI } from './permissions/permissionSetup.js'
// 引入 ripGrep，将 ./ripgrep.js 中已经封装好的能力接到本文件流程里。
import { ripGrep } from './ripgrep.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isSettingSourceEnabled,
  type SettingSource,
} from './settings/constants.js'
// 引入 getManagedFilePath，将 ./settings/managedPath.js 中已经封装好的能力接到本文件流程里。
import { getManagedFilePath } from './settings/managedPath.js'
// 引入 isRestrictedToPluginOnly，将 ./settings/pluginOnlyPolicy.js 中已经封装好的能力接到本文件流程里。
import { isRestrictedToPluginOnly } from './settings/pluginOnlyPolicy.js'

// Claude configuration directory names
// CLAUDE_CONFIG_DIRECTORIES 配置 聚合成有序列表，保持后续遍历顺序稳定。
export const CLAUDE_CONFIG_DIRECTORIES = [
  'commands',
  'agents',
  'output-styles',
  'skills',
  'workflows',
  ...(feature('TEMPLATES') ? (['templates'] as const) : []),
] as const

// ClaudeConfigDirectory 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeConfigDirectory = (typeof CLAUDE_CONFIG_DIRECTORIES)[number]

// MarkdownFile 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MarkdownFile = {
  filePath: string
  baseDir: string
  frontmatter: FrontmatterData
  content: string
  source: SettingSource
}

/**
 * Extracts a description from markdown content
 * Uses the first non-empty line as the description, or falls back to a default
 */
// extractDescriptionFromMarkdown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractDescriptionFromMarkdown(
  content: string,
  defaultDescription: string = 'Custom item',
): string {
  // 文本行格式化`content.split`，供共享工具后续处理使用。
  const lines = content.split('\n')
  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // trimmed格式化`line.trim`，供共享工具后续处理使用。
    const trimmed = line.trim()
    // 满足 `trimmed` 时，共享工具执行该分支。
    if (trimmed) {
      // If it's a header, strip the header prefix
      // headerMatch匹配`trimmed.match`，供共享工具后续处理使用。
      const headerMatch = trimmed.match(/^#+\s+(.+)$/)
      // 文本内容格式化`headerMatch?.[1] ?? trimmed` 整理出中间结果，供共享工具 markdown Config Loader后续步骤使用。
      const text = headerMatch?.[1] ?? trimmed

      // Return the text, limited to reasonable length
      // 返回 `text.length > 100 ? text.substring(0, 97) + '...' : text`，作为共享工具这次计算的结果。
      return text.length > 100 ? text.substring(0, 97) + '...' : text
    }
  }
  // 返回 `defaultDescription`，作为共享工具这次计算的结果。
  return defaultDescription
}

/**
 * Parses tools from frontmatter, supporting both string and array formats
 * Always returns a string array for consistency
 * @param toolsValue The value from frontmatter
 * @returns Parsed tool list as string[]
 */
// parseToolListString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseToolListString(toolsValue: unknown): string[] | null {
  // Return null for missing/null - let caller decide the default
  // 只有 `toolsValue === undefined || toolsValue === null` 满足时，共享工具才执行该分支。
  if (toolsValue === undefined || toolsValue === null) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Empty string or other falsy values mean no tools
  // toolsValue缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!toolsValue) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // toolsArray 从空数组开始收集，后续循环会按处理顺序追加条目。
  let toolsArray: string[] = []
  // 当 `typeof toolsValue` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof toolsValue === 'string') {
    // toolsArray更新为 `[toolsValue]`，确保共享工具后续读取最新状态。
    toolsArray = [toolsValue]
  // 共享工具 markdown Config Loader在这里处理 `} else if (Array.isArray(toolsValue)) {`，完成这一小步状态转换。
  } else if (Array.isArray(toolsValue)) {
    // toolsArray更新为 `toolsValue.filter(`，确保共享工具后续读取最新状态。
    toolsArray = toolsValue.filter(
      // 这个回调绑定到 (item): item is string => typeof item === 'string',，负责共享工具在该局部场景下的响应。
      (item): item is string => typeof item === 'string',
    )
  }

  // toolsArray为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (toolsArray.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // parsedTools 集合解析`parseToolListFromCLI`，供共享工具后续处理使用。
  const parsedTools = parseToolListFromCLI(toolsArray)
  // 满足 `parsedTools.includes('*')` 时，共享工具执行该分支。
  if (parsedTools.includes('*')) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return ['*']
  }
  // 返回 `parsedTools`，作为共享工具这次计算的结果。
  return parsedTools
}

/**
 * Parse tools from agent frontmatter
 * Missing field = undefined (all tools)
 * Empty field = [] (no tools)
 */
// parseAgentToolsFromFrontmatter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAgentToolsFromFrontmatter(
  toolsValue: unknown,
): string[] | undefined {
  // 解析结果解析`parseToolListString`，供共享工具后续处理使用。
  const parsed = parseToolListString(toolsValue)
  // 满足 `parsed === null` 时，共享工具执行该分支。
  if (parsed === null) {
    // For agents: undefined = all tools (undefined), null = no tools ([])
    // 返回 `toolsValue === undefined ? undefined : []`，作为共享工具这次计算的结果。
    return toolsValue === undefined ? undefined : []
  }
  // If parsed contains '*', return undefined (all tools)
  // 满足 `parsed.includes('*')` 时，共享工具执行该分支。
  if (parsed.includes('*')) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `parsed`，作为共享工具这次计算的结果。
  return parsed
}

/**
 * Parse allowed-tools from slash command frontmatter
 * Missing or empty field = no tools ([])
 */
// parseSlashCommandToolsFromFrontmatter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSlashCommandToolsFromFrontmatter(
  toolsValue: unknown,
): string[] {
  // 解析结果解析`parseToolListString`，供共享工具后续处理使用。
  const parsed = parseToolListString(toolsValue)
  // 满足 `parsed === null` 时，共享工具执行该分支。
  if (parsed === null) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `parsed`，作为共享工具这次计算的结果。
  return parsed
}

/**
 * Gets a unique identifier for a file based on its device ID and inode.
 * This allows detection of duplicate files accessed through different paths
 * (e.g., via symlinks). Returns null if the file doesn't exist or can't be stat'd.
 *
 * Note: On Windows, dev and ino may not be reliable for all file systems.
 * The code handles this gracefully by returning null on error (fail open),
 * meaning deduplication may not work on some Windows configurations.
 *
 * Uses bigint: true to handle filesystems with large inodes (e.g., ExFAT)
 * that exceed JavaScript's Number precision (53 bits). Without bigint, different
 * large inodes can round to the same Number, causing false duplicate detection.
 * See: https://github.com/anthropics/claude-code/issues/13893
 *
 * @param filePath - Path to the file
 * @returns A string identifier "device:inode" or null if file can't be identified
 */
// getFileIdentity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getFileIdentity(filePath: string): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`lstat`，供共享工具后续处理使用。
    const stats = await lstat(filePath, { bigint: true })
    // Some filesystems (NFS, FUSE, network mounts) report dev=0 and ino=0
    // for all files, which would cause every file to look like a duplicate.
    // Return null to skip deduplication for these unreliable identities.
    // 只有 `stats.dev === 0n && stats.ino === 0n` 满足时，共享工具才执行该分支。
    if (stats.dev === 0n && stats.ino === 0n) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 ``${stats.dev}:${stats.ino}``，作为共享工具这次计算的结果。
    return `${stats.dev}:${stats.ino}`
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Compute the stop boundary for getProjectDirsUpToHome's upward walk.
 *
 * Normally the walk stops at the nearest `.git` above `cwd`. But if the Bash
 * tool has cd'd into a nested git repo inside the session's project (submodule,
 * vendored dep with its own `.git`), that nested root isn't the right boundary —
 * stopping there makes the parent project's `.claude/` unreachable (#31905).
 *
 * The boundary is widened to the session's git root only when BOTH:
 *   - the nearest `.git` from cwd belongs to a *different* canonical repo
 *     (submodule/vendored clone — not a worktree, which resolves back to main)
 *   - that nearest `.git` sits *inside* the session's project tree
 *
 * Worktrees (under `.claude/worktrees/`) stay on the old behavior: their `.git`
 * file is the stop, and loadMarkdownFilesForSubdir's fallback adds the main-repo
 * copy only when the worktree lacks one.
 */
// resolveStopBoundary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveStopBoundary(cwd: string): string | null {
  // cwdGitRoot筛选`findGitRoot`，供共享工具后续处理使用。
  const cwdGitRoot = findGitRoot(cwd)
  // sessionGitRoot 会话数据筛选`findGitRoot`，供共享工具后续处理使用。
  const sessionGitRoot = findGitRoot(getProjectRoot())
  // 只有 `!cwdGitRoot || !sessionGitRoot` 满足时，共享工具才执行该分支。
  if (!cwdGitRoot || !sessionGitRoot) {
    // 返回 `cwdGitRoot`，作为共享工具这次计算的结果。
    return cwdGitRoot
  }
  // findCanonicalGitRoot resolves worktree `.git` files to the main repo.
  // Submodules (no commondir) and standalone clones fall through unchanged.
  // cwdCanonical筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
  const cwdCanonical = findCanonicalGitRoot(cwd)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    cwdCanonical &&
    normalizePathForComparison(cwdCanonical) ===
      normalizePathForComparison(sessionGitRoot)
  ) {
    // Same canonical repo (main, or a worktree of main). Stop at nearest .git.
    // 返回 `cwdGitRoot`，作为共享工具这次计算的结果。
    return cwdGitRoot
  }
  // Different canonical repo. Is it nested *inside* the session's project?
  // nCwdGitRoot保存`normalizePathForComparison`，供共享工具后续处理使用。
  const nCwdGitRoot = normalizePathForComparison(cwdGitRoot)
  // nSessionRoot 会话数据保存`normalizePathForComparison`，供共享工具后续处理使用。
  const nSessionRoot = normalizePathForComparison(sessionGitRoot)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    nCwdGitRoot !== nSessionRoot &&
    nCwdGitRoot.startsWith(nSessionRoot + sep)
  ) {
    // Nested repo inside the project — skip past it, stop at the project's root.
    // 返回 `sessionGitRoot`，作为共享工具这次计算的结果。
    return sessionGitRoot
  }
  // Sibling repo or elsewhere. Stop at nearest .git (old behavior).
  // 返回 `cwdGitRoot`，作为共享工具这次计算的结果。
  return cwdGitRoot
}

/**
 * Traverses from the current directory up to the git root (or home directory if not in a git repo),
 * collecting all .claude directories along the way.
 *
 * Stopping at git root prevents commands/skills from parent directories outside the repository
 * from leaking into projects. For example, if ~/projects/.claude/commands/ exists, it won't
 * appear in ~/projects/my-repo/ if my-repo is a git repository.
 *
 * @param subdir Subdirectory (eg. "commands", "agents")
 * @param cwd Current working directory to start from
 * @returns Array of directory paths containing .claude/subdir, from most specific (cwd) to least specific
 */
// getProjectDirsUpToHome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectDirsUpToHome(
  subdir: ClaudeConfigDirectory,
  cwd: string,
): string[] {
  // home读取`resolve`，供共享工具后续处理使用。
  const home = resolve(homedir()).normalize('NFC')
  // gitRoot读取`resolveStopBoundary`，供共享工具后续处理使用。
  const gitRoot = resolveStopBoundary(cwd)
  // current读取`resolve`，供共享工具后续处理使用。
  let current = resolve(cwd)
  // dirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const dirs: string[] = []

  // Traverse from current directory up to git root (or home if not in a git repo)
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // Stop if we've reached the home directory (don't check it, as it's loaded separately as userDir)
    // Use normalized comparison to handle Windows drive letter casing (C:\ vs c:\)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      normalizePathForComparison(current) === normalizePathForComparison(home)
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // claudeSubdir格式化`join`，供共享工具后续处理使用。
    const claudeSubdir = join(current, '.claude', subdir)
    // Filter to existing dirs. This is a perf filter (avoids spawning
    // ripgrep on non-existent dirs downstream) and the worktree fallback
    // in loadMarkdownFilesForSubdir relies on it. statSync + explicit error
    // handling instead of existsSync — re-throws unexpected errors rather
    // than silently swallowing them. Downstream loadMarkdownFiles handles
    // the TOCTOU window (dir disappearing before read) gracefully.
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 statSync，触发共享工具此处需要的副作用。
      statSync(claudeSubdir)
      // dirs 集合追加新条目，保持收集顺序与输入顺序一致。
      dirs.push(claudeSubdir)
    } catch (e: unknown) {
      // 满足 `!isFsInaccessible(e)` 时，共享工具执行该分支。
      if (!isFsInaccessible(e)) throw e
    }

    // Stop after processing the git root directory - this prevents commands from parent
    // directories outside the repository from appearing in the project
    // 共享工具在这里按实际状态进入对应分支。
    if (
      gitRoot &&
      normalizePathForComparison(current) ===
        normalizePathForComparison(gitRoot)
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // Move to parent directory
    // parent保存`dirname`，供共享工具后续处理使用。
    const parent = dirname(current)

    // Safety check: if parent is the same as current, we've reached the root
    // 满足 `parent === current` 时，共享工具执行该分支。
    if (parent === current) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // current更新为 `parent`，确保共享工具后续读取最新状态。
    current = parent
  }

  // 返回 `dirs`，作为共享工具这次计算的结果。
  return dirs
}

/**
 * Loads markdown files from managed, user, and project directories
 * @param subdir Subdirectory (eg. "agents" or "commands")
 * @param cwd Current working directory for project directory traversal
 * @returns Array of parsed markdown files with metadata
 */
// loadMarkdownFilesForSubdir 文件数据保存`memoize`，供共享工具后续处理使用。
export const loadMarkdownFilesForSubdir = memoize(
  // 共享工具 markdown Config Loader在这里处理 `async function (`，完成这一小步状态转换。
  async function (
    subdir: ClaudeConfigDirectory,
    cwd: string,
  ): Promise<MarkdownFile[]> {
    // searchStartTime记录时间`Date.now`，供共享工具后续处理使用。
    const searchStartTime = Date.now()
    // userDir格式化`join`，供共享工具后续处理使用。
    const userDir = join(getClaudeConfigHomeDir(), subdir)
    // managedDir格式化`join`，供共享工具后续处理使用。
    const managedDir = join(getManagedFilePath(), '.claude', subdir)
    // projectDirs 集合读取`getProjectDirsUpToHome`，供共享工具后续处理使用。
    const projectDirs = getProjectDirsUpToHome(subdir, cwd)

    // For git worktrees where the worktree does NOT have .claude/<subdir> checked
    // out (e.g. sparse-checkout), fall back to the main repository's copy.
    // getProjectDirsUpToHome stops at the worktree root (where the .git file is),
    // so it never sees the main repo on its own.
    //
    // Only add the main repo's copy when the worktree root's .claude/<subdir>
    // is absent. A standard `git worktree add` checks out the full tree, so the
    // worktree already has identical .claude/<subdir> content — loading the main
    // repo's copy too would duplicate every command/agent/skill
    // (anthropics/claude-code#29599, #28182, #26992).
    //
    // projectDirs already reflects existence (getProjectDirsUpToHome checked
    // each dir), so we compare against that instead of stat'ing again.
    // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
    const gitRoot = findGitRoot(cwd)
    // canonicalRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
    const canonicalRoot = findCanonicalGitRoot(cwd)
    // `gitRoot && canonicalRoot && canonicalRoot` 与 `git` 不一致时刷新派生状态，避免使用过期结果。
    if (gitRoot && canonicalRoot && canonicalRoot !== gitRoot) {
      // worktreeSubdir保存`normalizePathForComparison`，供共享工具后续处理使用。
      const worktreeSubdir = normalizePathForComparison(
        join(gitRoot, '.claude', subdir),
      )
      // worktreeHasSubdir筛选`projectDirs.some`，供共享工具后续处理使用。
      const worktreeHasSubdir = projectDirs.some(
        // dir更新为 `> normalizePathForComparison(dir) === worktreeSubdir`，确保共享工具后续读取最新状态。
        dir => normalizePathForComparison(dir) === worktreeSubdir,
      )
      // worktreeHasSubdir缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!worktreeHasSubdir) {
        // mainClaudeSubdir格式化`join`，供共享工具后续处理使用。
        const mainClaudeSubdir = join(canonicalRoot, '.claude', subdir)
        // 满足 `!projectDirs.includes(mainClaudeSubdir)` 时，共享工具执行该分支。
        if (!projectDirs.includes(mainClaudeSubdir)) {
          // projectDirs 集合追加新条目，保持收集顺序与输入顺序一致。
          projectDirs.push(mainClaudeSubdir)
        }
      }
    }

    // 并行获取 managedFiles、userFiles、projectFilesNested，缩短共享工具 markdown Config Loader等待多个独立异步任务的时间。
    const [managedFiles, userFiles, projectFilesNested] = await Promise.all([
      // Always load managed (policy settings)
      // 调用 loadMarkdownFiles，触发共享工具此处需要的副作用。
      loadMarkdownFiles(managedDir).then(_ =>
        // 调用 _.map，触发共享工具此处需要的副作用。
        _.map(file => ({
          ...file,
          baseDir: managedDir,
          source: 'policySettings' as const,
        })),
      ),
      // Conditionally load user files
      isSettingSourceEnabled('userSettings') &&
      !(subdir === 'agents' && isRestrictedToPluginOnly('agents'))
        // 这个回调绑定到 ? loadMarkdownFiles(userDir).then(_ =>，负责共享工具在该局部场景下的响应。
        ? loadMarkdownFiles(userDir).then(_ =>
            // 调用 _.map，触发共享工具此处需要的副作用。
            _.map(file => ({
              ...file,
              baseDir: userDir,
              source: 'userSettings' as const,
            })),
          )
        : Promise.resolve([]),
      // Conditionally load project files from all directories up to home
      isSettingSourceEnabled('projectSettings') &&
      !(subdir === 'agents' && isRestrictedToPluginOnly('agents'))
        ? Promise.all(
            // 调用 projectDirs.map，触发共享工具此处需要的副作用。
            projectDirs.map(projectDir =>
              // 调用 loadMarkdownFiles，触发共享工具此处需要的副作用。
              loadMarkdownFiles(projectDir).then(_ =>
                // 调用 _.map，触发共享工具此处需要的副作用。
                _.map(file => ({
                  ...file,
                  baseDir: projectDir,
                  source: 'projectSettings' as const,
                })),
              ),
            ),
          )
        : Promise.resolve([]),
    ])

    // Flatten nested project files array
    // projectFiles 文件数据保存`projectFilesNested.flat`，供共享工具后续处理使用。
    const projectFiles = projectFilesNested.flat()

    // Combine all files with priority: managed > user > project
    // allFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
    const allFiles = [...managedFiles, ...userFiles, ...projectFiles]

    // Deduplicate files that resolve to the same physical file (same inode).
    // This prevents the same file from appearing multiple times when ~/.claude is
    // symlinked to a directory within the project hierarchy, causing the same
    // physical file to be discovered through different paths.
    // fileIdentities 文件数据保存`Promise.all`，供共享工具后续处理使用。
    const fileIdentities = await Promise.all(
      // 调用 allFiles.map，触发共享工具此处需要的副作用。
      allFiles.map(file => getFileIdentity(file.filePath)),
    )

    // seenFileIds 文件数据 命名 `new Map<string, SettingSource>()`，让后续代码直接表达这个值的用途。
    const seenFileIds = new Map<string, SettingSource>()
    // deduplicatedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const deduplicatedFiles: MarkdownFile[] = []

    // 循环处理 `const [i, file] of allFiles.entries()`，让共享工具把同类条目按顺序走完。
    for (const [i, file] of allFiles.entries()) {
      // fileId 文件数据保存`fileIdentities[i] ?? null`，供共享工具 markdown Config Loader后续判断或输出使用。
      const fileId = fileIdentities[i] ?? null
      // 满足 `fileId === null` 时，共享工具执行该分支。
      if (fileId === null) {
        // If we can't identify the file, include it (fail open)
        // deduplicatedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
        deduplicatedFiles.push(file)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // existingSource读取`seenFileIds.get`，供共享工具后续处理使用。
      const existingSource = seenFileIds.get(fileId)
      // `existingSource` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (existingSource !== undefined) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping duplicate file '${file.filePath}' from ${file.source} (same inode already loaded from ${existingSource})`,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // seenFileIds.set 写入新的状态值，使共享工具后续读取保持一致。
      seenFileIds.set(fileId, file.source)
      // deduplicatedFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      deduplicatedFiles.push(file)
    }

    // duplicatesRemoved保存 `allFiles.length - deduplicatedFiles.length` 的判断结果，供共享工具 markdown Config Loader后续分支直接复用。
    const duplicatesRemoved = allFiles.length - deduplicatedFiles.length
    // 满足 `duplicatesRemoved > 0` 时，共享工具执行该分支。
    if (duplicatesRemoved > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Deduplicated ${duplicatesRemoved} files in ${subdir} (same inode via symlinks or hard links)`,
      )
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(`tengu_dir_search`, {
      durationMs: Date.now() - searchStartTime,
      managedFilesFound: managedFiles.length,
      userFilesFound: userFiles.length,
      projectFilesFound: projectFiles.length,
      projectDirsSearched: projectDirs.length,
      subdir:
        subdir as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 返回 `deduplicatedFiles`，作为共享工具这次计算的结果。
    return deduplicatedFiles
  },
  // Custom resolver creates cache key from both subdir and cwd parameters
  // 这个回调绑定到 (subdir: ClaudeConfigDirectory, cwd: string) => `${subdir}:${cwd}`,，负责共享工具在该局部场景下的响应。
  (subdir: ClaudeConfigDirectory, cwd: string) => `${subdir}:${cwd}`,
)

/**
 * Native implementation to find markdown files using Node.js fs APIs
 *
 * This implementation exists alongside ripgrep for the following reasons:
 * 1. Ripgrep has poor startup performance in native builds (noticeable on app startup)
 * 2. Provides a fallback when ripgrep is unavailable
 * 3. Can be explicitly enabled via CLAUDE_CODE_USE_NATIVE_FILE_SEARCH env var
 *
 * Symlink handling:
 * - Follows symlinks (equivalent to ripgrep's --follow flag)
 * - Uses device+inode tracking to detect cycles (same as ripgrep's same_file library)
 * - Falls back to realpath on systems without inode support
 *
 * Does not respect .gitignore (matches ripgrep with --no-ignore flag)
 *
 * @param dir Directory to search
 * @param signal AbortSignal for timeout
 * @returns Array of file paths
 */
// findMarkdownFilesNative 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function findMarkdownFilesNative(
  dir: string,
  signal: AbortSignal,
): Promise<string[]> {
  // files 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const files: string[] = []
  // visitedDirs 集合构建`new Set<string>()` 整理出中间结果，供共享工具 markdown Config Loader后续步骤使用。
  const visitedDirs = new Set<string>()

  // walk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function walk(currentDir: string): Promise<void> {
    // 满足 `signal.aborted` 时，共享工具执行该分支。
    if (signal.aborted) {
      // 共享工具 markdown Config Loader在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Cycle detection: track visited directories by device+inode
    // Uses bigint: true to handle filesystems with large inodes (e.g., ExFAT)
    // that exceed JavaScript's Number precision (53 bits).
    // See: https://github.com/anthropics/claude-code/issues/13893
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供共享工具后续处理使用。
      const stats = await stat(currentDir, { bigint: true })
      // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
      if (stats.isDirectory()) {
        // dirKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const dirKey =
          stats.dev !== undefined && stats.ino !== undefined
            ? `${stats.dev}:${stats.ino}` // Unix/Linux: device + inode
            : await realpath(currentDir) // Windows: canonical path

        // 满足 `visitedDirs.has(dirKey)` 时，共享工具执行该分支。
        if (visitedDirs.has(dirKey)) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Skipping already visited directory (circular symlink): ${currentDir}`,
          )
          // 共享工具 markdown Config Loader在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 调用 visitedDirs.add，触发共享工具此处需要的副作用。
        visitedDirs.add(dirKey)
      }
    } catch (error) {
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to stat directory ${currentDir}: ${errorMessage}`)
      // 共享工具 markdown Config Loader在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合读取`readdir`，供共享工具后续处理使用。
      const entries = await readdir(currentDir, { withFileTypes: true })

      // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
      for (const entry of entries) {
        // 满足 `signal.aborted` 时，共享工具执行该分支。
        if (signal.aborted) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }

        // fullPath 路径数据格式化`join`，供共享工具后续处理使用。
        const fullPath = join(currentDir, entry.name)

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // Handle symlinks: isFile() and isDirectory() return false for symlinks
          // 满足 `entry.isSymbolicLink()` 时，共享工具执行该分支。
          if (entry.isSymbolicLink()) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // stats 集合保存`stat`，供共享工具后续处理使用。
              const stats = await stat(fullPath) // stat() follows symlinks
              // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
              if (stats.isDirectory()) {
                // 等待 `walk(fullPath)` 完成，再继续共享工具 markdown Config Loader的异步流程。
                await walk(fullPath)
              // 共享工具 markdown Config Loader在这里处理 `} else if (stats.isFile() && entry.name.endsWith('.md')) {`，完成这一小步状态转换。
              } else if (stats.isFile() && entry.name.endsWith('.md')) {
                // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
                files.push(fullPath)
              }
            } catch (error) {
              // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Failed to follow symlink ${fullPath}: ${errorMessage}`,
              )
            }
          // 共享工具 markdown Config Loader在这里处理 `} else if (entry.isDirectory()) {`，完成这一小步状态转换。
          } else if (entry.isDirectory()) {
            // 等待 `walk(fullPath)` 完成，再继续共享工具 markdown Config Loader的异步流程。
            await walk(fullPath)
          // 共享工具 markdown Config Loader在这里处理 `} else if (entry.isFile() && entry.name.endsWith('.md')) {`，完成这一小步状态转换。
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
            files.push(fullPath)
          }
        } catch (error) {
          // Skip files/directories we can't access
          // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Failed to access ${fullPath}: ${errorMessage}`)
        }
      }
    } catch (error) {
      // If readdir fails (e.g., permission denied), log and continue
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to read directory ${currentDir}: ${errorMessage}`)
    }
  }

  // 等待 `walk(dir)` 完成，再继续共享工具 markdown Config Loader的异步流程。
  await walk(dir)
  // 返回 `files`，作为共享工具这次计算的结果。
  return files
}

/**
 * Generic function to load markdown files from specified directories
 * @param dir Directory (eg. "~/.claude/commands")
 * @returns Array of parsed markdown files with metadata
 */
// loadMarkdownFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadMarkdownFiles(dir: string): Promise<
  {
    filePath: string
    frontmatter: FrontmatterData
    content: string
  }[]
> {
  // File search strategy:
  // - Default: ripgrep (faster, battle-tested)
  // - Fallback: native Node.js (when CLAUDE_CODE_USE_NATIVE_FILE_SEARCH is set)
  //
  // Why both? Ripgrep has poor startup performance in native builds.
  // useNative保存`isEnvTruthy`，供共享工具后续处理使用。
  const useNative = isEnvTruthy(process.env.CLAUDE_CODE_USE_NATIVE_FILE_SEARCH)
  // signal保存`AbortSignal.timeout`，供共享工具后续处理使用。
  const signal = AbortSignal.timeout(3000)
  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `useNative`，确保共享工具后续读取最新状态。
    files = useNative
      ? await findMarkdownFilesNative(dir, signal)
      : await ripGrep(
          ['--files', '--hidden', '--follow', '--no-ignore', '--glob', '*.md'],
          dir,
          signal,
        )
  } catch (e: unknown) {
    // Handle missing/inaccessible dir directly instead of pre-checking
    // existence (TOCTOU). findMarkdownFilesNative already catches internally;
    // ripGrep rejects on inaccessible target paths.
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return []
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 files.map，触发共享工具此处需要的副作用。
    files.map(async filePath => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // rawContent读取`readFile`，供共享工具后续处理使用。
        const rawContent = await readFile(filePath, { encoding: 'utf-8' })
        // 从 `parseFrontmatter(rawContent, filePath)` 解构 frontmatter、content，减少共享工具 markdown Config Loader对同一对象的重复访问。
        const { frontmatter, content } = parseFrontmatter(rawContent, filePath)

        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          filePath,
          frontmatter,
          content,
        }
      } catch (error) {
        // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to read/parse markdown file:  ${filePath}: ${errorMessage}`,
        )
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // 返回 `results.filter(_ => _ !== null)`，作为共享工具这次计算的结果。
  return results.filter(_ => _ !== null)
}
