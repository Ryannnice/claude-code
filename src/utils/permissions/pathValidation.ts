// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, resolve } from 'path'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getFsImplementation,
  getPathsForPermissionCheck,
  safeResolvePath,
} from '../fsOperations.js'
// 引入 containsPathTraversal，将 ../path.js 中已经封装好的能力接到本文件流程里。
import { containsPathTraversal } from '../path.js'
// 引入 SandboxManager，将 ../sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from '../sandbox/sandbox-adapter.js'
// 引入 containsVulnerableUncPath，将 ../shell/readOnlyCommandValidation.js 中已经封装好的能力接到本文件流程里。
import { containsVulnerableUncPath } from '../shell/readOnlyCommandValidation.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  checkEditableInternalPath,
  checkPathSafetyForAutoEdit,
  checkReadableInternalPath,
  matchingRuleForInput,
  pathInAllowedWorkingPath,
  pathInWorkingPath,
} from './filesystem.js'
// 类型依赖 { PermissionDecisionReason } 来自 ./PermissionResult.js，用于校准权限判定的数据契约。
import type { PermissionDecisionReason } from './PermissionResult.js'

// MAX_DIRS_TO_LIST 集合保存`5`，供后续判断或组装使用。
const MAX_DIRS_TO_LIST = 5
// GLOB_PATTERN_REGEX读取 `/[*?[\]{}]/` 对应条目，后续围绕该成员继续处理。
const GLOB_PATTERN_REGEX = /[*?[\]{}]/

// FileOperationType 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileOperationType = 'read' | 'write' | 'create'

// PathCheckResult 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type PathCheckResult = {
  allowed: boolean
  decisionReason?: PermissionDecisionReason
}

// ResolvedPathCheckResult 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolvedPathCheckResult = PathCheckResult & {
  resolvedPath: string
}

// formatDirectoryList 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDirectoryList(directories: string[]): string {
  // dirCount 数量记录 `directories.length` 是否成立，下一步按该结果分支。
  const dirCount = directories.length

  // 满足 `dirCount <= MAX_DIRS_TO_LIST` 时，权限判定执行该分支。
  if (dirCount <= MAX_DIRS_TO_LIST) {
    // 返回 `directories.map(dir => `'${dir}'`).join(', ')`，作为权限判定这次计算的结果。
    return directories.map(dir => `'${dir}'`).join(', ')
  }

  // firstDirs 集合 命名 `directories`，让后续代码直接表达这个值的用途。
  const firstDirs = directories
    .slice(0, MAX_DIRS_TO_LIST)
    // 链式调用 map，继续加工上一行在权限判定中产生的数据。
    .map(dir => `'${dir}'`)
    .join(', ')

  // 返回 ``${firstDirs}, and ${dirCount - MAX_DIRS_TO_LIST} more``，作为权限判定这次计算的结果。
  return `${firstDirs}, and ${dirCount - MAX_DIRS_TO_LIST} more`
}

/**
 * Extracts the base directory from a glob pattern for validation.
 * For example: "/path/to/*.txt" returns "/path/to"
 */
// getGlobBaseDirectory 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGlobBaseDirectory(path: string): string {
  // globMatch匹配`path.match`，供权限判定后续处理使用。
  const globMatch = path.match(GLOB_PATTERN_REGEX)
  // 只有 `!globMatch || globMatch.index === undefined` 满足时，权限判定才执行该分支。
  if (!globMatch || globMatch.index === undefined) {
    // 返回 `path`，作为权限判定这次计算的结果。
    return path
  }

  // Get everything before the first glob character
  // beforeGlob格式化`path.substring`，供权限判定后续处理使用。
  const beforeGlob = path.substring(0, globMatch.index)

  // Find the last directory separator
  // lastSepIndex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lastSepIndex =
    getPlatform() === 'windows'
      ? Math.max(beforeGlob.lastIndexOf('/'), beforeGlob.lastIndexOf('\\'))
      : beforeGlob.lastIndexOf('/')
  // 满足 `lastSepIndex === -1` 时，权限判定执行该分支。
  if (lastSepIndex === -1) return '.'

  // 返回 `beforeGlob.substring(0, lastSepIndex) || '/'`，作为权限判定这次计算的结果。
  return beforeGlob.substring(0, lastSepIndex) || '/'
}

/**
 * Expands tilde (~) at the start of a path to the user's home directory.
 * Note: ~username expansion is not supported for security reasons.
 */
// expandTilde 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandTilde(path: string): string {
  // 权限判定在这里按实际状态进入对应分支。
  if (
    path === '~' ||
    path.startsWith('~/') ||
    (process.platform === 'win32' && path.startsWith('~\\'))
  ) {
    // 返回 `homedir() + path.slice(1)`，作为权限判定这次计算的结果。
    return homedir() + path.slice(1)
  }
  // 返回 `path`，作为权限判定这次计算的结果。
  return path
}

/**
 * Checks if a resolved path is writable according to the sandbox write allowlist.
 * When the sandbox is enabled, the user has explicitly configured which directories
 * are writable. We treat these as additional allowed write directories for path
 * validation purposes, so commands like `echo foo > /tmp/claude/x.txt` don't
 * prompt for permission when /tmp/claude/ is already in the sandbox allowlist.
 *
 * Respects the deny-within-allow list: paths in denyWithinAllow (like
 * .claude/settings.json) are still blocked even if their parent is in allowOnly.
 */
// isPathInSandboxWriteAllowlist 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPathInSandboxWriteAllowlist(resolvedPath: string): boolean {
  // 满足 `!SandboxManager.isSandboxingEnabled()` 时，权限判定执行该分支。
  if (!SandboxManager.isSandboxingEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 从 `SandboxManager.getFsWriteConfig()` 解构 allowOnly、denyWithinAllow，减少权限工具 path Validation对同一对象的重复访问。
  const { allowOnly, denyWithinAllow } = SandboxManager.getFsWriteConfig()
  // Resolve symlinks on both sides so comparisons are symmetric (matching
  // pathInAllowedWorkingPath). Without this, an allowlist entry that is a
  // symlink (e.g. /home/user/proj -> /data/proj) would not match a write to
  // its resolved target, causing an unnecessary prompt. Over-conservative,
  // not a security issue. All resolved input representations must be allowed
  // and none may be denied. Config paths are session-stable, so memoize
  // their resolution to avoid N × config.length redundant syscalls per
  // command with N write targets (matching getResolvedWorkingDirPaths).
  // pathsToCheck 路径数据读取`getPathsForPermissionCheck`，供权限判定后续处理使用。
  const pathsToCheck = getPathsForPermissionCheck(resolvedPath)
  // resolvedAllow派生`allowOnly.flatMap`，供权限判定后续处理使用。
  const resolvedAllow = allowOnly.flatMap(getResolvedSandboxConfigPath)
  // resolvedDeny派生`denyWithinAllow.flatMap`，供权限判定后续处理使用。
  const resolvedDeny = denyWithinAllow.flatMap(getResolvedSandboxConfigPath)
  // 返回 `pathsToCheck.every(p => {`，作为权限判定这次计算的结果。
  return pathsToCheck.every(p => {
    // 按顺序遍历 `resolvedDeny` 中的denyPath 路径数据，逐个交给权限判定处理。
    for (const denyPath of resolvedDeny) {
      // 满足 `pathInWorkingPath(p, denyPath)` 时，权限判定执行该分支。
      if (pathInWorkingPath(p, denyPath)) return false
    }
    // 返回 `resolvedAllow.some(allowPath => pathInWorkingPath(p, allowPath))`，作为权限判定这次计算的结果。
    return resolvedAllow.some(allowPath => pathInWorkingPath(p, allowPath))
  })
}

// Sandbox config paths are session-stable; memoize their resolved forms to
// avoid repeated lstat/realpath syscalls on every write-target check.
// Matches the getResolvedWorkingDirPaths pattern in filesystem.ts.
// getResolvedSandboxConfigPath 路径数据保存`memoize`，供权限判定后续处理使用。
const getResolvedSandboxConfigPath = memoize(getPathsForPermissionCheck)

/**
 * Checks if a resolved path is allowed for the given operation type.
 *
 * @param precomputedPathsToCheck - Optional cached result of
 *   `getPathsForPermissionCheck(resolvedPath)`. When `resolvedPath` is the
 *   output of `realpathSync` (canonical path, all symlinks resolved), this
 *   is trivially `[resolvedPath]` and passing it here skips 5 redundant
 *   syscalls per inner check. Do NOT pass this for non-canonical paths
 *   (nonexistent files, UNC paths, etc.) — parent-directory symlink
 *   resolution is still required for those.
 */
// isPathAllowed 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPathAllowed(
  resolvedPath: string,
  context: ToolPermissionContext,
  operationType: FileOperationType,
  precomputedPathsToCheck?: readonly string[],
): PathCheckResult {
  // Determine which permission type to check based on operation
  // permissionType 权限数据标记权限判定权限工具 path Validation是否启用对应路径。
  const permissionType = operationType === 'read' ? 'read' : 'edit'

  // 1. Check deny rules first (they take precedence)
  // denyRule保存`matchingRuleForInput`，供权限判定后续处理使用。
  const denyRule = matchingRuleForInput(
    resolvedPath,
    context,
    permissionType,
    'deny',
  )
  // `denyRule` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (denyRule !== null) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      allowed: false,
      decisionReason: { type: 'rule', rule: denyRule },
    }
  }

  // 2. For write/create operations, check internal editable paths (plan files, scratchpad, agent memory, job dirs)
  // This MUST come before checkPathSafetyForAutoEdit since .claude is a dangerous directory
  // and internal editable paths live under ~/.claude/ — matching the ordering in
  // checkWritePermissionForTool (filesystem.ts step 1.5)
  // `operationType` 与 `'read'` 不一致时刷新派生状态，避免使用过期结果。
  if (operationType !== 'read') {
    // internalEditResult读取`checkEditableInternalPath`，供权限判定后续处理使用。
    const internalEditResult = checkEditableInternalPath(resolvedPath, {})
    // 当 `internalEditResult.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
    if (internalEditResult.behavior === 'allow') {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        allowed: true,
        decisionReason: internalEditResult.decisionReason,
      }
    }
  }

  // 2.5. For write/create operations, check comprehensive safety validations
  // This MUST come before checking working directory to prevent bypass via acceptEdits mode
  // Checks: Windows patterns, Claude config files, dangerous files (on original + symlink paths)
  // `operationType` 与 `'read'` 不一致时刷新派生状态，避免使用过期结果。
  if (operationType !== 'read') {
    // safetyCheck读取`checkPathSafetyForAutoEdit`，供权限判定后续处理使用。
    const safetyCheck = checkPathSafetyForAutoEdit(
      resolvedPath,
      precomputedPathsToCheck,
    )
    // safetyCheck.safe缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!safetyCheck.safe) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        allowed: false,
        decisionReason: {
          type: 'safetyCheck',
          reason: safetyCheck.message,
          classifierApprovable: safetyCheck.classifierApprovable,
        },
      }
    }
  }

  // 3. Check if path is in allowed working directory
  // For write/create operations, require acceptEdits mode to auto-allow
  // This is consistent with checkWritePermissionForTool in filesystem.ts
  // isInWorkingDir记录 `pathInAllowedWorkingPath` 是否成立，权限判定随后按该结果分支。
  const isInWorkingDir = pathInAllowedWorkingPath(
    resolvedPath,
    context,
    precomputedPathsToCheck,
  )
  // 满足 `isInWorkingDir` 时，权限判定执行该分支。
  if (isInWorkingDir) {
    // 只有 `operationType === 'read' || context.mode === 'acc` 满足时，权限判定才执行该分支。
    if (operationType === 'read' || context.mode === 'acceptEdits') {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return { allowed: true }
    }
    // Write/create without acceptEdits mode falls through to check allow rules
  }

  // 3.5. For read operations, check internal readable paths (project temp dir, session memory, etc.)
  // This allows reading agent output files without explicit permission
  // 当 `operationType` 匹配 `'read'` 时，权限判定执行对应分支。
  if (operationType === 'read') {
    // internalReadResult读取`checkReadableInternalPath`，供权限判定后续处理使用。
    const internalReadResult = checkReadableInternalPath(resolvedPath, {})
    // 当 `internalReadResult.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
    if (internalReadResult.behavior === 'allow') {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        allowed: true,
        decisionReason: internalReadResult.decisionReason,
      }
    }
  }

  // 3.7. For write/create operations to paths OUTSIDE the working directory,
  // check the sandbox write allowlist. When the sandbox is enabled, users
  // have explicitly configured writable directories (e.g. /tmp/claude/) —
  // treat these as additional allowed write directories so redirects/touch/
  // mkdir don't prompt unnecessarily. Safety checks (step 2) already ran.
  // Paths IN the working directory are intentionally excluded: the sandbox
  // allowlist always seeds '.' (cwd, see sandbox-adapter.ts), which would
  // bypass the acceptEdits gate at step 3. Step 3 handles those.
  // 权限判定在这里按实际状态进入对应分支。
  if (
    operationType !== 'read' &&
    !isInWorkingDir &&
    isPathInSandboxWriteAllowlist(resolvedPath)
  ) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      allowed: true,
      decisionReason: {
        type: 'other',
        reason: 'Path is in sandbox write allowlist',
      },
    }
  }

  // 4. Check allow rules for the operation type
  // allowRule保存`matchingRuleForInput`，供权限判定后续处理使用。
  const allowRule = matchingRuleForInput(
    resolvedPath,
    context,
    permissionType,
    'allow',
  )
  // `allowRule` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (allowRule !== null) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      allowed: true,
      decisionReason: { type: 'rule', rule: allowRule },
    }
  }

  // 5. Path is not allowed
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { allowed: false }
}

/**
 * Validates a glob pattern by checking its base directory.
 * Returns the validation result for the base path where the glob would expand.
 */
// validateGlobPattern 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateGlobPattern(
  cleanPath: string,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  operationType: FileOperationType,
): ResolvedPathCheckResult {
  // 满足 `containsPathTraversal(cleanPath)` 时，权限判定执行该分支。
  if (containsPathTraversal(cleanPath)) {
    // For patterns with path traversal, resolve the full path
    // absolutePath 路径数据保存`isAbsolute`，供权限判定后续处理使用。
    const absolutePath = isAbsolute(cleanPath)
      ? cleanPath
      : resolve(cwd, cleanPath)
    // 从 `safeResolvePath(` 解构 resolvedPath、isCanonical，减少权限工具 path Validation对同一对象的重复访问。
    const { resolvedPath, isCanonical } = safeResolvePath(
      getFsImplementation(),
      absolutePath,
    )
    // 结果保存`isPathAllowed`，供权限判定后续处理使用。
    const result = isPathAllowed(
      resolvedPath,
      toolPermissionContext,
      operationType,
      isCanonical ? [resolvedPath] : undefined,
    )
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      allowed: result.allowed,
      resolvedPath,
      decisionReason: result.decisionReason,
    }
  }

  // basePath 路径数据读取`getGlobBaseDirectory`，供权限判定后续处理使用。
  const basePath = getGlobBaseDirectory(cleanPath)
  // absoluteBasePath 路径数据保存`isAbsolute`，供权限判定后续处理使用。
  const absoluteBasePath = isAbsolute(basePath)
    ? basePath
    : resolve(cwd, basePath)
  // 从 `safeResolvePath(` 解构 resolvedPath、isCanonical，减少权限工具 path Validation对同一对象的重复访问。
  const { resolvedPath, isCanonical } = safeResolvePath(
    getFsImplementation(),
    absoluteBasePath,
  )
  // 结果保存`isPathAllowed`，供权限判定后续处理使用。
  const result = isPathAllowed(
    resolvedPath,
    toolPermissionContext,
    operationType,
    isCanonical ? [resolvedPath] : undefined,
  )
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    allowed: result.allowed,
    resolvedPath,
    decisionReason: result.decisionReason,
  }
}

// WINDOWS_DRIVE_ROOT_REGEX读取 `/^[A-Za-z]:\/?$/` 对应条目，后续围绕该成员继续处理。
const WINDOWS_DRIVE_ROOT_REGEX = /^[A-Za-z]:\/?$/
// WINDOWS_DRIVE_CHILD_REGEX 命名 `/^[A-Za-z]:\/[^/]+$/`，让后续代码直接表达这个值的用途。
const WINDOWS_DRIVE_CHILD_REGEX = /^[A-Za-z]:\/[^/]+$/

/**
 * Checks if a resolved path is dangerous for removal operations (rm/rmdir).
 * Dangerous paths are:
 * - Wildcard '*' (removes all files in directory)
 * - Any path ending with '/*' or '\*' (e.g., /path/to/dir/*, C:\foo\*)
 * - Root directory (/)
 * - Home directory (~)
 * - Direct children of root (/usr, /tmp, /etc, etc.)
 * - Windows drive root (C:\, D:\) and direct children (C:\Windows, C:\Users)
 */
// isDangerousRemovalPath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDangerousRemovalPath(resolvedPath: string): boolean {
  // Callers pass both slash forms; collapse runs so C:\\Windows (valid in
  // PowerShell) doesn't bypass the drive-child check.
  // forwardSlashed格式化`resolvedPath.replace`，供权限判定后续处理使用。
  const forwardSlashed = resolvedPath.replace(/[\\/]+/g, '/')

  // 只有 `forwardSlashed === '*' || forwardSlashed.endsWith('/*')` 满足时，权限判定才执行该分支。
  if (forwardSlashed === '*' || forwardSlashed.endsWith('/*')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // normalizedPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const normalizedPath =
    forwardSlashed === '/' ? forwardSlashed : forwardSlashed.replace(/\/$/, '')

  // 当 `normalizedPath` 匹配 `'/'` 时，权限判定执行对应分支。
  if (normalizedPath === '/') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 满足 `WINDOWS_DRIVE_ROOT_REGEX.test(normalizedPath)` 时，权限判定执行该分支。
  if (WINDOWS_DRIVE_ROOT_REGEX.test(normalizedPath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // normalizedHome保存`homedir`，供权限判定后续处理使用。
  const normalizedHome = homedir().replace(/[\\/]+/g, '/')
  // 满足 `normalizedPath === normalizedHome` 时，权限判定执行该分支。
  if (normalizedPath === normalizedHome) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Direct children of root: /usr, /tmp, /etc (but not /usr/local)
  // parentDir保存`dirname`，供权限判定后续处理使用。
  const parentDir = dirname(normalizedPath)
  // 当 `parentDir` 匹配 `'/'` 时，权限判定执行对应分支。
  if (parentDir === '/') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 满足 `WINDOWS_DRIVE_CHILD_REGEX.test(normalizedPath)` 时，权限判定执行该分支。
  if (WINDOWS_DRIVE_CHILD_REGEX.test(normalizedPath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Validates a file system path, handling tilde expansion and glob patterns.
 * Returns whether the path is allowed and the resolved path for error messages.
 */
// validatePath 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validatePath(
  path: string,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  operationType: FileOperationType,
): ResolvedPathCheckResult {
  // Remove surrounding quotes if present
  // cleanPath 路径数据保存`expandTilde`，供权限判定后续处理使用。
  const cleanPath = expandTilde(path.replace(/^['"]|['"]$/g, ''))

  // SECURITY: Block UNC paths that could leak credentials
  // 判断 containsVulnerableUncPath(cleanPath)，将权限判定分流到只适用于该条件的处理路径。
  if (containsVulnerableUncPath(cleanPath)) {
    // 返回 {，把权限判定这个分支的结果交还调用方。
    return {
      allowed: false,
      resolvedPath: cleanPath,
      decisionReason: {
        type: 'other',
        reason: 'UNC network paths require manual approval',
      },
    }
  }

  // SECURITY: Reject tilde variants (~user, ~+, ~-, ~N) that expandTilde doesn't handle.
  // expandTilde resolves ~ and ~/ to $HOME, but ~root, ~+, ~- etc. are left as literal
  // text and resolved as relative paths (e.g., /cwd/~root/.ssh/id_rsa).
  // The shell expands these differently (~root → /var/root, ~+ → $PWD, ~- → $OLDPWD),
  // creating a TOCTOU gap: we validate /cwd/~root/... but bash reads /var/root/...
  // This check is safe from false positives because expandTilde already converted
  // ~ and ~/ to absolute paths starting with /, so only unexpanded variants remain.
  // 判断 cleanPath.startsWith('~')，将权限判定分流到只适用于该条件的处理路径。
  if (cleanPath.startsWith('~')) {
    // 返回 {，把权限判定这个分支的结果交还调用方。
    return {
      allowed: false,
      resolvedPath: cleanPath,
      decisionReason: {
        type: 'other',
        reason:
          'Tilde expansion variants (~user, ~+, ~-) in paths require manual approval',
      },
    }
  }

  // SECURITY: Reject paths containing ANY shell expansion syntax ($ or % characters,
  // or paths starting with = which triggers Zsh equals expansion)
  // - $VAR (Unix/Linux environment variables like $HOME, $PWD)
  // - ${VAR} (brace expansion)
  // - $(cmd) (command substitution)
  // - %VAR% (Windows environment variables like %TEMP%, %USERPROFILE%)
  // - Nested combinations like $(echo $HOME)
  // - =cmd (Zsh equals expansion, e.g. =rg expands to /usr/bin/rg)
  // All of these are preserved as literal strings during validation but expanded
  // by the shell during execution, creating a TOCTOU vulnerability
  // 权限判定在这里按实际状态进入对应分支。
  if (
    cleanPath.includes('$') ||
    cleanPath.includes('%') ||
    cleanPath.startsWith('=')
  ) {
    // 返回 {，把权限判定这个分支的结果交还调用方。
    return {
      allowed: false,
      resolvedPath: cleanPath,
      decisionReason: {
        type: 'other',
        reason: 'Shell expansion syntax in paths requires manual approval',
      },
    }
  }

  // SECURITY: Block glob patterns in write/create operations
  // Write tools don't expand globs - they use paths literally.
  // Allowing globs in write operations could bypass security checks.
  // Example: /allowed/dir/*.txt would only validate /allowed/dir,
  // but the actual write would use the literal path with the *
  // 判断 GLOB_PATTERN_REGEX.test(cleanPath)，将权限判定分流到只适用于该条件的处理路径。
  if (GLOB_PATTERN_REGEX.test(cleanPath)) {
    // 只有 `operationType === 'write' || operationType === 'c` 满足时，权限判定才执行该分支。
    if (operationType === 'write' || operationType === 'create') {
      // 返回 {，把权限判定这个分支的结果交还调用方。
      return {
        allowed: false,
        resolvedPath: cleanPath,
        decisionReason: {
          type: 'other',
          reason:
            'Glob patterns are not allowed in write operations. Please specify an exact file path.',
        },
      }
    }

    // For read operations, validate the base directory where the glob would expand
    // 返回 validateGlobPattern(，把权限判定这个分支的结果交还调用方。
    return validateGlobPattern(
      cleanPath,
      cwd,
      toolPermissionContext,
      operationType,
    )
  }

  // Resolve path
  // absolutePath 文件数据保存`isAbsolute`，供权限判定后续处理使用。
  const absolutePath = isAbsolute(cleanPath)
    ? cleanPath
    : resolve(cwd, cleanPath)
  // 从 `safeResolvePath(` 解构 resolvedPath、isCanonical，减少权限工具 path Validation对同一对象的重复访问。
  const { resolvedPath, isCanonical } = safeResolvePath(
    getFsImplementation(),
    absolutePath,
  )

  // 结果保存`isPathAllowed`，供权限判定后续处理使用。
  const result = isPathAllowed(
    resolvedPath,
    toolPermissionContext,
    operationType,
    isCanonical ? [resolvedPath] : undefined,
  )
  // 返回 {，把权限判定这个分支的结果交还调用方。
  return {
    allowed: result.allowed,
    resolvedPath,
    decisionReason: result.decisionReason,
  }
}
