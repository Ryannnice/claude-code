// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { normalize, posix, win32 } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAutoMemPath,
  getMemoryBaseDir,
  isAutoMemoryEnabled,
  isAutoMemPath,
} from '../memdir/paths.js'
// 接入 isAgentMemoryPath 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isAgentMemoryPath } from '../tools/AgentTool/agentMemory.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  posixPathToWindowsPath,
  windowsPathToPosixPath,
} from './windowsPaths.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供共享工具后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('../memdir/teamMemPaths.js') as typeof import('../memdir/teamMemPaths.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// IS_WINDOWS 集合标记共享工具 memory File Detection是否启用对应路径。
const IS_WINDOWS = process.platform === 'win32'

// Normalize path separators to posix (/). Does NOT translate drive encoding.
// toPosix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toPosix(p: string): string {
  // 返回 `p.split(win32.sep).join(posix.sep)`，作为共享工具这次计算的结果。
  return p.split(win32.sep).join(posix.sep)
}

// Convert a path to a stable string-comparable form: forward-slash separated,
// and on Windows, lowercased (Windows filesystems are case-insensitive).
// toComparable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toComparable(p: string): string {
  // posixForm保存`toPosix`，供共享工具后续处理使用。
  const posixForm = toPosix(p)
  // 返回 `IS_WINDOWS ? posixForm.toLowerCase() : posixForm`，作为共享工具这次计算的结果。
  return IS_WINDOWS ? posixForm.toLowerCase() : posixForm
}

/**
 * Detects if a file path is a session-related file under ~/.claude.
 * Returns the type of session file or null if not a session file.
 */
// detectSessionFileType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectSessionFileType(
  filePath: string,
): 'session_memory' | 'session_transcript' | null {
  // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const configDir = getClaudeConfigHomeDir()
  // Compare in forward-slash form; on Windows also case-fold. The caller
  // (isShellCommandTargetingMemory) converts MinGW /c/... → native before
  // reaching here, so we only need separator + case normalization.
  // normalized保存`toComparable`，供共享工具后续处理使用。
  const normalized = toComparable(filePath)
  // configDirCmp 配置保存`toComparable`，供共享工具后续处理使用。
  const configDirCmp = toComparable(configDir)
  // 满足 `!normalized.startsWith(configDirCmp)` 时，共享工具执行该分支。
  if (!normalized.startsWith(configDirCmp)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 只有 `normalized.includes('/session-memory/') && normalized.endsWith('.md')` 满足时，共享工具才执行该分支。
  if (normalized.includes('/session-memory/') && normalized.endsWith('.md')) {
    // 返回 `'session_memory'`，作为共享工具这次计算的结果。
    return 'session_memory'
  }
  // 只有 `normalized.includes('/projects/') && normalized.endsWith('.jsonl')` 满足时，共享工具才执行该分支。
  if (normalized.includes('/projects/') && normalized.endsWith('.jsonl')) {
    // 返回 `'session_transcript'`，作为共享工具这次计算的结果。
    return 'session_transcript'
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a glob/pattern string indicates session file access intent.
 * Used for Grep/Glob tools where we check patterns, not actual file paths.
 */
// detectSessionPatternType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectSessionPatternType(
  pattern: string,
): 'session_memory' | 'session_transcript' | null {
  // normalized格式化`pattern.split`，供共享工具后续处理使用。
  const normalized = pattern.split(win32.sep).join(posix.sep)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    normalized.includes('session-memory') &&
    (normalized.includes('.md') || normalized.endsWith('*'))
  ) {
    // 返回 `'session_memory'`，作为共享工具这次计算的结果。
    return 'session_memory'
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    normalized.includes('.jsonl') ||
    (normalized.includes('projects') && normalized.includes('*.jsonl'))
  ) {
    // 返回 `'session_transcript'`，作为共享工具这次计算的结果。
    return 'session_transcript'
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Check if a file path is within the memdir directory.
 */
// isAutoMemFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoMemFile(filePath: string): boolean {
  // 满足 `isAutoMemoryEnabled()` 时，共享工具执行该分支。
  if (isAutoMemoryEnabled()) {
    // 返回 `isAutoMemPath(filePath)`，作为共享工具这次计算的结果。
    return isAutoMemPath(filePath)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// MemoryScope 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryScope = 'personal' | 'team'

/**
 * Determine which memory store (if any) a path belongs to.
 *
 * Team dir is a subdirectory of memdir (getTeamMemPath = join(getAutoMemPath, 'team')),
 * so a team path matches both isTeamMemFile and isAutoMemFile. Check team first.
 *
 * Use this for scope-keyed telemetry where a single event name distinguishes
 * by scope field — the existing tengu_memdir_* / tengu_team_mem_* event-name
 * hierarchy handles the overlap differently (team writes intentionally fire both).
 */
// memoryScopeForPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryScopeForPath(filePath: string): MemoryScope | null {
  // 只有 `feature('TEAMMEM') && teamMemPaths!.isTeamMemFile(filePath)` 满足时，共享工具才执行该分支。
  if (feature('TEAMMEM') && teamMemPaths!.isTeamMemFile(filePath)) {
    // 返回 `'team'`，作为共享工具这次计算的结果。
    return 'team'
  }
  // 满足 `isAutoMemFile(filePath)` 时，共享工具执行该分支。
  if (isAutoMemFile(filePath)) {
    // 返回 `'personal'`，作为共享工具这次计算的结果。
    return 'personal'
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Check if a file path is within an agent memory directory.
 */
// isAgentMemFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAgentMemFile(filePath: string): boolean {
  // 满足 `isAutoMemoryEnabled()` 时，共享工具执行该分支。
  if (isAutoMemoryEnabled()) {
    // 返回 `isAgentMemoryPath(filePath)`，作为共享工具这次计算的结果。
    return isAgentMemoryPath(filePath)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a file is a Claude-managed memory file (NOT user-managed instruction files).
 * Includes: auto-memory (memdir), agent memory, session memory/transcripts.
 * Excludes: CLAUDE.md, CLAUDE.local.md, .claude/rules/*.md (user-managed).
 *
 * Use this for collapse/badge logic where user-managed files should show full diffs.
 */
// isAutoManagedMemoryFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoManagedMemoryFile(filePath: string): boolean {
  // 满足 `isAutoMemFile(filePath)` 时，共享工具执行该分支。
  if (isAutoMemFile(filePath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 只有 `feature('TEAMMEM') && teamMemPaths!.isTeamMemFile(filePath)` 满足时，共享工具才执行该分支。
  if (feature('TEAMMEM') && teamMemPaths!.isTeamMemFile(filePath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // `detectSessionFileType(filePath)` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (detectSessionFileType(filePath) !== null) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `isAgentMemFile(filePath)` 时，共享工具执行该分支。
  if (isAgentMemFile(filePath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Check if a directory path is a memory-related directory.
// Used by Grep/Glob which take a directory `path` rather than a specific file.
// Checks both configDir and memoryBaseDir to handle custom memory dir paths.
// isMemoryDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMemoryDirectory(dirPath: string): boolean {
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments.
  // On Windows this produces backslashes; toComparable flips them back for
  // string matching. MinGW /c/... paths are converted to native before
  // reaching here (extraction-time in isShellCommandTargetingMemory), so
  // normalize() never sees them.
  // normalizedPath 路径数据保存`normalize`，供共享工具后续处理使用。
  const normalizedPath = normalize(dirPath)
  // normalizedCmp保存`toComparable`，供共享工具后续处理使用。
  const normalizedCmp = toComparable(normalizedPath)
  // Agent memory directories can be under cwd (project scope), configDir, or memoryBaseDir
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isAutoMemoryEnabled() &&
    (normalizedCmp.includes('/agent-memory/') ||
      normalizedCmp.includes('/agent-memory-local/'))
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Team memory directories live under <autoMemPath>/team/
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('TEAMMEM') &&
    teamMemPaths!.isTeamMemoryEnabled() &&
    teamMemPaths!.isTeamMemPath(normalizedPath)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Check the auto-memory path override (CLAUDE_COWORK_MEMORY_PATH_OVERRIDE)
  // 满足 `isAutoMemoryEnabled()` 时，共享工具执行该分支。
  if (isAutoMemoryEnabled()) {
    // autoMemPath 路径数据读取`getAutoMemPath`，供共享工具后续处理使用。
    const autoMemPath = getAutoMemPath()
    // autoMemDirCmp保存`toComparable`，供共享工具后续处理使用。
    const autoMemDirCmp = toComparable(autoMemPath.replace(/[/\\]+$/, ''))
    // autoMemPathCmp 路径数据保存`toComparable`，供共享工具后续处理使用。
    const autoMemPathCmp = toComparable(autoMemPath)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      normalizedCmp === autoMemDirCmp ||
      normalizedCmp.startsWith(autoMemPathCmp)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // configDirCmp 配置保存`toComparable`，供共享工具后续处理使用。
  const configDirCmp = toComparable(getClaudeConfigHomeDir())
  // memoryBaseCmp保存`toComparable`，供共享工具后续处理使用。
  const memoryBaseCmp = toComparable(getMemoryBaseDir())
  // underConfig 配置保存`normalizedCmp.startsWith`，供共享工具后续处理使用。
  const underConfig = normalizedCmp.startsWith(configDirCmp)
  // underMemoryBase保存`normalizedCmp.startsWith`，供共享工具后续处理使用。
  const underMemoryBase = normalizedCmp.startsWith(memoryBaseCmp)

  // 只有 `!underConfig && !underMemoryBase` 满足时，共享工具才执行该分支。
  if (!underConfig && !underMemoryBase) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `normalizedCmp.includes('/session-memory/')` 时，共享工具执行该分支。
  if (normalizedCmp.includes('/session-memory/')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 只有 `underConfig && normalizedCmp.includes('/projects/')` 满足时，共享工具才执行该分支。
  if (underConfig && normalizedCmp.includes('/projects/')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 只有 `isAutoMemoryEnabled() && normalizedCmp.includes('/memory/')` 满足时，共享工具才执行该分支。
  if (isAutoMemoryEnabled() && normalizedCmp.includes('/memory/')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a shell command string (Bash or PowerShell) targets memory files
 * by extracting absolute path tokens and checking them against memory
 * detection functions. Used for Bash/PowerShell grep/search commands in the
 * collapse logic.
 */
// isShellCommandTargetingMemory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isShellCommandTargetingMemory(command: string): boolean {
  // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const configDir = getClaudeConfigHomeDir()
  // memoryBase读取`getMemoryBaseDir`，供共享工具后续处理使用。
  const memoryBase = getMemoryBaseDir()
  // autoMemDir保存`isAutoMemoryEnabled`，供共享工具后续处理使用。
  const autoMemDir = isAutoMemoryEnabled()
    ? getAutoMemPath().replace(/[/\\]+$/, '')
    : ''

  // Quick check: does the command mention the config, memory base, or
  // auto-mem directory? Compare in forward-slash form (PowerShell on Windows
  // may use either separator while configDir uses the platform-native one).
  // On Windows also check the MinGW form (/c/...) since BashTool runs under
  // Git Bash which emits that encoding. On Linux/Mac, configDir is already
  // posix so only one form to check — and crucially, windowsPathToPosixPath
  // is NOT called, so Linux paths like /m/foo aren't misinterpreted as MinGW.
  // commandCmp 命令数据保存`toComparable`，供共享工具后续处理使用。
  const commandCmp = toComparable(command)
  // dirs 集合筛选`filter`，供共享工具后续处理使用。
  const dirs = [configDir, memoryBase, autoMemDir].filter(Boolean)
  // matchesAnyDir筛选`dirs.some`，供共享工具后续处理使用。
  const matchesAnyDir = dirs.some(d => {
    // 满足 `commandCmp.includes(toComparable(d))` 时，共享工具执行该分支。
    if (commandCmp.includes(toComparable(d))) return true
    // 满足 `IS_WINDOWS` 时，共享工具执行该分支。
    if (IS_WINDOWS) {
      // BashTool on Windows (Git Bash) emits /c/Users/... — check MinGW form too
      // 返回 `commandCmp.includes(windowsPathToPosixPath(d).toLowerCase())`，作为共享工具这次计算的结果。
      return commandCmp.includes(windowsPathToPosixPath(d).toLowerCase())
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  })
  // matchesAnyDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!matchesAnyDir) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Extract absolute path-like tokens. Matches Unix absolute paths (/foo/bar),
  // Windows drive-letter paths (C:\foo, C:/foo), and MinGW paths (/c/foo —
  // they're /-prefixed so the regex already captures them). Bare backslash
  // tokens (\foo) are intentionally excluded — they appear in regex/grep
  // patterns and would cause false-positive memory classification after
  // normalization flips backslashes to forward slashes.
  // matches 集合匹配`command.match`，供共享工具后续处理使用。
  const matches = command.match(/(?:[A-Za-z]:[/\\]|\/)[^\s'"]+/g)
  // 匹配结果缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
  if (!matches) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // 遍历 const match of matches，让共享工具逐项完成同一类处理。
  for (const match of matches) {
    // Strip trailing shell metacharacters that could be adjacent to a path
    // cleanPath 文件数据格式化`match.replace`，供共享工具后续处理使用。
    const cleanPath = match.replace(/[,;|&>]+$/, '')
    // On Windows, convert MinGW /c/... → native C:\... at this single
    // point. Downstream predicates (isAutoManagedMemoryFile, isMemoryDirectory,
    // isAutoMemPath, isAgentMemoryPath) then receive native paths and only
    // need toComparable() for matching. On other platforms, paths are already
    // native — no conversion, so /m/foo etc. pass through unmodified.
    // nativePath 文件数据保存`IS_WINDOWS`，供共享工具 memory File Detection后续步骤使用。
    const nativePath = IS_WINDOWS
      ? posixPathToWindowsPath(cleanPath)
      : cleanPath
    // 判断 isAutoManagedMemoryFile(nativePath) || isMemoryDirectory(nativePath)，将共享工具分流到只适用于该条件的处理路径。
    if (isAutoManagedMemoryFile(nativePath) || isMemoryDirectory(nativePath)) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

// Check if a glob/pattern targets auto-managed memory files only.
// Excludes CLAUDE.md, CLAUDE.local.md, .claude/rules/ (user-managed).
// Used for collapse badge logic where user-managed files should not be
// counted as "memory" operations.
// isAutoManagedMemoryPattern 承担共享工具中的独立步骤，串起共享工具 memory File Detection需要的输入整理、状态更新和结果输出。
export function isAutoManagedMemoryPattern(pattern: string): boolean {
  // 判断 detectSessionPatternType(pattern) !== null，将共享工具分流到只适用于该条件的处理路径。
  if (detectSessionPatternType(pattern) !== null) {
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    isAutoMemoryEnabled() &&
    (pattern.replace(/\\/g, '/').includes('agent-memory/') ||
      pattern.replace(/\\/g, '/').includes('agent-memory-local/'))
  ) {
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}
