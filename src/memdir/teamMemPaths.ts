// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { lstat, realpath } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, resolve, sep } from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { getErrnoCode } from '../utils/errors.js'
// 引入 getAutoMemPath、isAutoMemoryEnabled，将 ./paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemPath, isAutoMemoryEnabled } from './paths.js'

/**
 * Error thrown when a path validation detects a traversal or injection attempt.
 */
// PathTraversalError 聚合team Mem Paths相关状态与操作，把同一职责的行为收束到类实例中。
export class PathTraversalError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发team Mem Paths此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'PathTraversalError'，同步team Mem Paths的内部状态。
    this.name = 'PathTraversalError'
  }
}

/**
 * Sanitize a file path key by rejecting dangerous patterns.
 * Checks for null bytes, URL-encoded traversals, and other injection vectors.
 * Returns the sanitized string or throws PathTraversalError.
 */
// sanitizePathKey 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizePathKey(key: string): string {
  // Null bytes can truncate paths in C-based syscalls
  // 满足 `key.includes('\0')` 时，team Mem Paths执行该分支。
  if (key.includes('\0')) {
    // 抛出 new PathTraversalError(`Null byte in path key: "${key}"`)，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(`Null byte in path key: "${key}"`)
  }
  // URL-encoded traversals (e.g. %2e%2e%2f = ../)
  // decoded 先占位，稍后的条件分支会根据实际输入补齐它。
  let decoded: string
  // 保护这一段可能失败的team Mem Paths操作，确保异常能进入相邻错误处理。
  try {
    // decoded更新为 `decodeURIComponent(key)`，确保teamMemPaths后续读取最新状态。
    decoded = decodeURIComponent(key)
  } catch {
    // Malformed percent-encoding (e.g. %ZZ, lone %) — not valid URL-encoding,
    // so no URL-encoded traversal is possible
    // decoded更新为 `key`，确保teamMemPaths后续读取最新状态。
    decoded = key
  }
  // `decoded` 与 `key && (decoded.includes('..') ...` 不一致时刷新派生状态，避免使用过期结果。
  if (decoded !== key && (decoded.includes('..') || decoded.includes('/'))) {
    // 抛出 new PathTraversalError(`URL-encoded traversal in path key: "${key}"`)，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(`URL-encoded traversal in path key: "${key}"`)
  }
  // Unicode normalization attacks: fullwidth ．．／ (U+FF0E U+FF0F) normalize
  // to ASCII ../ under NFKC. While path.resolve/fs.writeFile treat these as
  // literal bytes (not separators), downstream layers or filesystems may
  // normalize — reject for defense-in-depth (PSR M22187 vector 4).
  // normalized保存`key.normalize`，供team Mem Paths后续处理使用。
  const normalized = key.normalize('NFKC')
  // team Mem Paths在这里进入条件判断，后续代码按实际状态分流。
  if (
    normalized !== key &&
    (normalized.includes('..') ||
      normalized.includes('/') ||
      normalized.includes('\\') ||
      normalized.includes('\0'))
  ) {
    // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(
      `Unicode-normalized traversal in path key: "${key}"`,
    )
  }
  // Reject backslashes (Windows path separator used as traversal vector)
  // 满足 `key.includes('\\')` 时，team Mem Paths执行该分支。
  if (key.includes('\\')) {
    // 抛出 new PathTraversalError(`Backslash in path key: "${key}"`)，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(`Backslash in path key: "${key}"`)
  }
  // Reject absolute paths
  // 满足 `key.startsWith('/')` 时，team Mem Paths执行该分支。
  if (key.startsWith('/')) {
    // 抛出 new PathTraversalError(`Absolute path key: "${key}"`)，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(`Absolute path key: "${key}"`)
  }
  // 返回 `key`，作为team Mem Paths这次计算的结果。
  return key
}

/**
 * Whether team memory features are enabled.
 * Team memory is a subdirectory of auto memory, so it requires auto memory
 * to be enabled. This keeps all team-memory consumers (prompt, content
 * injection, sync watcher, file detection) consistent when auto memory is
 * disabled via env var or settings.
 */
// isTeamMemoryEnabled 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemoryEnabled(): boolean {
  // 满足 `!isAutoMemoryEnabled()` 时，team Mem Paths执行该分支。
  if (!isAutoMemoryEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_herring_clock', false)`，作为team Mem Paths这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_herring_clock', false)
}

/**
 * Returns the team memory path: <memoryBase>/projects/<sanitized-project-root>/memory/team/
 * Lives as a subdirectory of the auto-memory directory, scoped per-project.
 */
// getTeamMemPath 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamMemPath(): string {
  // 返回 `(join(getAutoMemPath(), 'team') + sep).normalize('NFC')`，作为team Mem Paths这次计算的结果。
  return (join(getAutoMemPath(), 'team') + sep).normalize('NFC')
}

/**
 * Returns the team memory entrypoint: <memoryBase>/projects/<sanitized-project-root>/memory/team/MEMORY.md
 * Lives as a subdirectory of the auto-memory directory, scoped per-project.
 */
// getTeamMemEntrypoint 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamMemEntrypoint(): string {
  // 返回 `join(getAutoMemPath(), 'team', 'MEMORY.md')`，作为team Mem Paths这次计算的结果。
  return join(getAutoMemPath(), 'team', 'MEMORY.md')
}

/**
 * Resolve symlinks for the deepest existing ancestor of a path.
 * The target file may not exist yet (we may be about to create it), so we
 * walk up the directory tree until realpath() succeeds, then rejoin the
 * non-existing tail onto the resolved ancestor.
 *
 * SECURITY (PSR M22186): path.resolve() does NOT resolve symlinks. An attacker
 * who can place a symlink inside teamDir pointing outside (e.g. to
 * ~/.ssh/authorized_keys) would pass a resolve()-based containment check.
 * Using realpath() on the deepest existing ancestor ensures we compare the
 * actual filesystem location, not the symbolic path.
 *
 */
// realpathDeepestExisting 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function realpathDeepestExisting(absolutePath: string): Promise<string> {
  // tail 从空数组开始收集，后续循环会按处理顺序追加条目。
  const tail: string[] = []
  // current 命名 `absolutePath`，让后续代码直接表达这个值的用途。
  let current = absolutePath
  // Walk up until realpath succeeds. ENOENT means this segment doesn't exist
  // yet; pop it onto the tail and try the parent. ENOTDIR means a non-directory
  // component sits in the middle of the path; pop and retry so we can realpath
  // the ancestor to detect symlink escapes.
  // Loop terminates when we reach the filesystem root (dirname('/') === '/').
  // 调用 for，触发team Mem Paths此处需要的副作用。
  for (
    let parent = dirname(current);
    current !== parent;
    parent = dirname(current)
  ) {
    // 保护这一段可能失败的team Mem Paths操作，确保异常能进入相邻错误处理。
    try {
      // realCurrent保存`realpath`，供team Mem Paths后续处理使用。
      const realCurrent = await realpath(current)
      // Rejoin the non-existing tail in reverse order (deepest popped first)
      // 返回 `tail.length === 0`，作为team Mem Paths这次计算的结果。
      return tail.length === 0
        ? realCurrent
        : join(realCurrent, ...tail.reverse())
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供team Mem Paths后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，team Mem Paths执行对应分支。
      if (code === 'ENOENT') {
        // Could be truly non-existent (safe to walk up) OR a dangling symlink
        // whose target doesn't exist. Dangling symlinks are an attack vector:
        // writeFile would follow the link and create the target outside teamDir.
        // lstat distinguishes: it succeeds for dangling symlinks (the link entry
        // itself exists), fails with ENOENT for truly non-existent paths.
        // 保护这一段可能失败的team Mem Paths操作，确保异常能进入相邻错误处理。
        try {
          // st保存`lstat`，供team Mem Paths后续处理使用。
          const st = await lstat(current)
          // 满足 `st.isSymbolicLink()` 时，team Mem Paths执行该分支。
          if (st.isSymbolicLink()) {
            // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
            throw new PathTraversalError(
              `Dangling symlink detected (target does not exist): "${current}"`,
            )
          }
          // lstat succeeded but isn't a symlink — ENOENT from realpath was
          // caused by a dangling symlink in an ancestor. Walk up to find it.
        } catch (lstatErr: unknown) {
          // 满足 `lstatErr instanceof PathTraversalError` 时，team Mem Paths执行该分支。
          if (lstatErr instanceof PathTraversalError) {
            // 抛出 lstatErr，阻止team Mem Paths在无效状态下继续运行。
            throw lstatErr
          }
          // lstat also failed (truly non-existent or inaccessible) — safe to walk up.
        }
      // team Mem Paths在这里处理 `} else if (code === 'ELOOP') {`，完成这一小步状态转换。
      } else if (code === 'ELOOP') {
        // Symlink loop — corrupted or malicious filesystem state.
        // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
        throw new PathTraversalError(
          `Symlink loop detected in path: "${current}"`,
        )
      // team Mem Paths在这里处理 `} else if (code !== 'ENOTDIR' && code !== 'ENAMETOOLONG') {`，完成这一小步状态转换。
      } else if (code !== 'ENOTDIR' && code !== 'ENAMETOOLONG') {
        // EACCES, EIO, etc. — cannot verify containment. Fail closed by wrapping
        // as PathTraversalError so the caller can skip this entry gracefully
        // instead of aborting the entire batch.
        // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
        throw new PathTraversalError(
          `Cannot verify path containment (${code}): "${current}"`,
        )
      }
      // tail追加新条目，保持收集顺序与输入顺序一致。
      tail.push(current.slice(parent.length + sep.length))
      // current更新为 `parent`，确保teamMemPaths后续读取最新状态。
      current = parent
    }
  }
  // Reached filesystem root without finding an existing ancestor (rare —
  // root normally exists). Fall back to the input; containment check will reject.
  // 返回 `absolutePath`，作为team Mem Paths这次计算的结果。
  return absolutePath
}

/**
 * Check whether a real (symlink-resolved) path is within the real team
 * memory directory. Both sides are realpath'd so the comparison is between
 * canonical filesystem locations.
 *
 * If teamDir does not exist, returns true (skips the check). This is safe:
 * a symlink escape requires a pre-existing symlink inside teamDir, which
 * requires teamDir to exist. If there's no directory, there's no symlink,
 * and the first-pass string-level containment check is sufficient.
 */
// isRealPathWithinTeamDir 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isRealPathWithinTeamDir(
  realCandidate: string,
): Promise<boolean> {
  // realTeamDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let realTeamDir: string
  // 保护这一段可能失败的team Mem Paths操作，确保异常能进入相邻错误处理。
  try {
    // getTeamMemPath() includes a trailing separator; strip it because
    // realpath() rejects trailing separators on some platforms.
    // realTeamDir更新为 `await realpath(getTeamMemPath().replace(/[/\\]+$/, ''))`，确保teamMemPaths后续读取最新状态。
    realTeamDir = await realpath(getTeamMemPath().replace(/[/\\]+$/, ''))
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供team Mem Paths后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT' || code === 'ENOTD...` 时，team Mem Paths执行对应分支。
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      // Team dir doesn't exist — symlink escape impossible, skip check.
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Unexpected error (EACCES, EIO) — fail closed.
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `realCandidate === realTeamDir` 时，team Mem Paths执行该分支。
  if (realCandidate === realTeamDir) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Prefix-attack protection: require separator after the prefix so that
  // "/foo/team-evil" doesn't match "/foo/team".
  // 返回 `realCandidate.startsWith(realTeamDir + sep)`，作为team Mem Paths这次计算的结果。
  return realCandidate.startsWith(realTeamDir + sep)
}

/**
 * Check if a resolved absolute path is within the team memory directory.
 * Uses path.resolve() to convert relative paths and eliminate traversal segments.
 * Does NOT resolve symlinks — for write validation use validateTeamMemWritePath()
 * or validateTeamMemKey() which include symlink resolution.
 */
// isTeamMemPath 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemPath(filePath: string): boolean {
  // SECURITY: resolve() converts to absolute and eliminates .. segments,
  // preventing path traversal attacks (e.g. "team/../../etc/passwd")
  // resolvedPath 路径数据读取`resolve`，供team Mem Paths后续处理使用。
  const resolvedPath = resolve(filePath)
  // teamDir读取`getTeamMemPath`，供team Mem Paths后续处理使用。
  const teamDir = getTeamMemPath()
  // 返回 `resolvedPath.startsWith(teamDir)`，作为team Mem Paths这次计算的结果。
  return resolvedPath.startsWith(teamDir)
}

/**
 * Validate that an absolute file path is safe for writing to the team memory directory.
 * Returns the resolved absolute path if valid.
 * Throws PathTraversalError if the path contains injection vectors, escapes the
 * directory via .. segments, or escapes via a symlink (PSR M22186).
 */
// validateTeamMemWritePath 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateTeamMemWritePath(
  filePath: string,
): Promise<string> {
  // 满足 `filePath.includes('\0')` 时，team Mem Paths执行该分支。
  if (filePath.includes('\0')) {
    // 抛出 new PathTraversalError(`Null byte in path: "${filePath}"`)，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(`Null byte in path: "${filePath}"`)
  }
  // First pass: normalize .. segments and check string-level containment.
  // This is a fast rejection for obvious traversal attempts before we touch
  // the filesystem.
  // resolvedPath 路径数据读取`resolve`，供team Mem Paths后续处理使用。
  const resolvedPath = resolve(filePath)
  // teamDir读取`getTeamMemPath`，供team Mem Paths后续处理使用。
  const teamDir = getTeamMemPath()
  // Prefix attack protection: teamDir already ends with sep (from getTeamMemPath),
  // so "team-evil/" won't match "team/"
  // 满足 `!resolvedPath.startsWith(teamDir)` 时，team Mem Paths执行该分支。
  if (!resolvedPath.startsWith(teamDir)) {
    // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(
      `Path escapes team memory directory: "${filePath}"`,
    )
  }
  // Second pass: resolve symlinks on the deepest existing ancestor and verify
  // the real path is still within the real team dir. This catches symlink-based
  // escapes that path.resolve() alone cannot detect.
  // realPath 路径数据保存`realpathDeepestExisting`，供team Mem Paths后续处理使用。
  const realPath = await realpathDeepestExisting(resolvedPath)
  // 满足 `!(await isRealPathWithinTeamDir(realPath))` 时，team Mem Paths执行该分支。
  if (!(await isRealPathWithinTeamDir(realPath))) {
    // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(
      `Path escapes team memory directory via symlink: "${filePath}"`,
    )
  }
  // 返回 `resolvedPath`，作为team Mem Paths这次计算的结果。
  return resolvedPath
}

/**
 * Validate a relative path key from the server against the team memory directory.
 * Sanitizes the key, joins with the team dir, resolves symlinks on the deepest
 * existing ancestor, and verifies containment against the real team dir.
 * Returns the resolved absolute path.
 * Throws PathTraversalError if the key is malicious (PSR M22186).
 */
// validateTeamMemKey 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateTeamMemKey(relativeKey: string): Promise<string> {
  // 调用 sanitizePathKey，触发team Mem Paths此处需要的副作用。
  sanitizePathKey(relativeKey)
  // teamDir读取`getTeamMemPath`，供team Mem Paths后续处理使用。
  const teamDir = getTeamMemPath()
  // fullPath 路径数据格式化`join`，供team Mem Paths后续处理使用。
  const fullPath = join(teamDir, relativeKey)
  // First pass: normalize .. segments and check string-level containment.
  // resolvedPath 路径数据读取`resolve`，供team Mem Paths后续处理使用。
  const resolvedPath = resolve(fullPath)
  // 满足 `!resolvedPath.startsWith(teamDir)` 时，team Mem Paths执行该分支。
  if (!resolvedPath.startsWith(teamDir)) {
    // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(
      `Key escapes team memory directory: "${relativeKey}"`,
    )
  }
  // Second pass: resolve symlinks and verify real containment.
  // realPath 路径数据保存`realpathDeepestExisting`，供team Mem Paths后续处理使用。
  const realPath = await realpathDeepestExisting(resolvedPath)
  // 满足 `!(await isRealPathWithinTeamDir(realPath))` 时，team Mem Paths执行该分支。
  if (!(await isRealPathWithinTeamDir(realPath))) {
    // 抛出 new PathTraversalError(，阻止team Mem Paths在无效状态下继续运行。
    throw new PathTraversalError(
      `Key escapes team memory directory via symlink: "${relativeKey}"`,
    )
  }
  // 返回 `resolvedPath`，作为team Mem Paths这次计算的结果。
  return resolvedPath
}

/**
 * Check if a file path is within the team memory directory
 * and team memory is enabled.
 */
// isTeamMemFile 封装teamMemPaths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemFile(filePath: string): boolean {
  // 返回 `isTeamMemoryEnabled() && isTeamMemPath(filePath)`，作为team Mem Paths这次计算的结果。
  return isTeamMemoryEnabled() && isTeamMemPath(filePath)
}
