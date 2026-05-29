// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, randomUUID, type UUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, join, relative, sep } from 'path'
// 引入 getOriginalCwd、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AttributionSnapshotMessage,
  FileAttributionState,
} from '../types/logs.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 isGeneratedFile，将 ./generatedFiles.js 中已经封装好的能力接到本文件流程里。
import { isGeneratedFile } from './generatedFiles.js'
// 引入 getRemoteUrlForDir、resolveGitDir，将 ./git/gitFilesystem.js 中已经封装好的能力接到本文件流程里。
import { getRemoteUrlForDir, resolveGitDir } from './git/gitFilesystem.js'
// 引入 findGitRoot、gitExe，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot, gitExe } from './git.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getCanonicalName、ModelName，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getCanonicalName, type ModelName } from './model/model.js'
// 引入 sequential，将 ./sequential.js 中已经封装好的能力接到本文件流程里。
import { sequential } from './sequential.js'

/**
 * List of repos where internal model names are allowed in trailers.
 * Includes both SSH and HTTPS URL formats.
 *
 * NOTE: This is intentionally a repo allowlist, not an org-wide check.
 * The anthropics and anthropic-experimental orgs contain PUBLIC repos
 * (e.g. anthropics/claude-code, anthropic-experimental/sandbox-runtime).
 * Undercover mode must stay ON in those to prevent codename leaks.
 * Only add repos here that are confirmed PRIVATE.
 */
// INTERNAL_MODEL_REPOS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const INTERNAL_MODEL_REPOS = [
  'github.com:anthropics/claude-cli-internal',
  'github.com/anthropics/claude-cli-internal',
  'github.com:anthropics/anthropic',
  'github.com/anthropics/anthropic',
  'github.com:anthropics/apps',
  'github.com/anthropics/apps',
  'github.com:anthropics/casino',
  'github.com/anthropics/casino',
  'github.com:anthropics/dbt',
  'github.com/anthropics/dbt',
  'github.com:anthropics/dotfiles',
  'github.com/anthropics/dotfiles',
  'github.com:anthropics/terraform-config',
  'github.com/anthropics/terraform-config',
  'github.com:anthropics/hex-export',
  'github.com/anthropics/hex-export',
  'github.com:anthropics/feedback-v2',
  'github.com/anthropics/feedback-v2',
  'github.com:anthropics/labs',
  'github.com/anthropics/labs',
  'github.com:anthropics/argo-rollouts',
  'github.com/anthropics/argo-rollouts',
  'github.com:anthropics/starling-configs',
  'github.com/anthropics/starling-configs',
  'github.com:anthropics/ts-tools',
  'github.com/anthropics/ts-tools',
  'github.com:anthropics/ts-capsules',
  'github.com/anthropics/ts-capsules',
  'github.com:anthropics/feldspar-testing',
  'github.com/anthropics/feldspar-testing',
  'github.com:anthropics/trellis',
  'github.com/anthropics/trellis',
  'github.com:anthropics/claude-for-hiring',
  'github.com/anthropics/claude-for-hiring',
  'github.com:anthropics/forge-web',
  'github.com/anthropics/forge-web',
  'github.com:anthropics/infra-manifests',
  'github.com/anthropics/infra-manifests',
  'github.com:anthropics/mycro_manifests',
  'github.com/anthropics/mycro_manifests',
  'github.com:anthropics/mycro_configs',
  'github.com/anthropics/mycro_configs',
  'github.com:anthropics/mobile-apps',
  'github.com/anthropics/mobile-apps',
]

/**
 * Get the repo root for attribution operations.
 * Uses getCwd() which respects agent worktree overrides (AsyncLocalStorage),
 * then resolves to git root to handle `cd subdir` case.
 * Falls back to getOriginalCwd() if git root can't be determined.
 */
// getAttributionRepoRoot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAttributionRepoRoot(): string {
  // cwd读取`getCwd`，供共享工具后续处理使用。
  const cwd = getCwd()
  // 返回 `findGitRoot(cwd) ?? getOriginalCwd()`，作为共享工具这次计算的结果。
  return findGitRoot(cwd) ?? getOriginalCwd()
}

// Cache for repo classification result. Primed once per process.
// 'internal' = remote matches INTERNAL_MODEL_REPOS allowlist
// 'external' = has a remote, not on allowlist (public/open-source repo)
// 'none'     = no remote URL (not a git repo, or no remote configured)
// repoClassCache 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let repoClassCache: 'internal' | 'external' | 'none' | null = null

/**
 * Synchronously return the cached repo classification.
 * Returns null if the async check hasn't run yet.
 */
// getRepoClassCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRepoClassCached(): 'internal' | 'external' | 'none' | null {
  // 返回 `repoClassCache`，作为共享工具这次计算的结果。
  return repoClassCache
}

/**
 * Synchronously return the cached result of isInternalModelRepo().
 * Returns false if the check hasn't run yet (safe default: don't leak).
 */
// isInternalModelRepoCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInternalModelRepoCached(): boolean {
  // 返回 `repoClassCache === 'internal'`，作为共享工具这次计算的结果。
  return repoClassCache === 'internal'
}

/**
 * Check if the current repo is in the allowlist for internal model names.
 * Memoized - only checks once per process.
 */
// isInternalModelRepo记录 `sequential` 是否成立，共享工具随后按该结果分支。
export const isInternalModelRepo = sequential(async (): Promise<boolean> => {
  // `repoClassCache` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (repoClassCache !== null) {
    // 返回 `repoClassCache === 'internal'`，作为共享工具这次计算的结果。
    return repoClassCache === 'internal'
  }

  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()
  // remoteUrl读取`getRemoteUrlForDir`，供共享工具后续处理使用。
  const remoteUrl = await getRemoteUrlForDir(cwd)

  // remoteUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!remoteUrl) {
    // repoClassCache 缓存更新为 `'none'`，确保共享工具后续读取最新状态。
    repoClassCache = 'none'
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // isInternal记录 `INTERNAL_MODEL_REPOS.some` 是否成立，共享工具随后按该结果分支。
  const isInternal = INTERNAL_MODEL_REPOS.some(repo => remoteUrl.includes(repo))
  // repoClassCache 缓存更新为 `isInternal ? 'internal' : 'external'`，确保共享工具后续读取最新状态。
  repoClassCache = isInternal ? 'internal' : 'external'
  // 返回 `isInternal`，作为共享工具这次计算的结果。
  return isInternal
})

/**
 * Sanitize a surface key to use public model names.
 * Converts internal model variants to their public equivalents.
 */
// sanitizeSurfaceKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeSurfaceKey(surfaceKey: string): string {
  // Split surface key into surface and model parts (e.g., "cli/opus-4-5-fast" -> ["cli", "opus-4-5-fast"])
  // slashIndex 索引保存`surfaceKey.lastIndexOf`，供共享工具后续处理使用。
  const slashIndex = surfaceKey.lastIndexOf('/')
  // 满足 `slashIndex === -1` 时，共享工具执行该分支。
  if (slashIndex === -1) {
    // 返回 `surfaceKey`，作为共享工具这次计算的结果。
    return surfaceKey
  }

  // surface格式化`surfaceKey.slice`，供共享工具后续处理使用。
  const surface = surfaceKey.slice(0, slashIndex)
  // 模型名称格式化`surfaceKey.slice`，供共享工具后续处理使用。
  const model = surfaceKey.slice(slashIndex + 1)
  // sanitizedModel保存`sanitizeModelName`，供共享工具后续处理使用。
  const sanitizedModel = sanitizeModelName(model)

  // 返回 ``${surface}/${sanitizedModel}``，作为共享工具这次计算的结果。
  return `${surface}/${sanitizedModel}`
}

// @[MODEL LAUNCH]: Add a mapping for the new model ID so git commit trailers show the public name.
/**
 * Sanitize a model name to its public equivalent.
 * Maps internal variants to their public names based on model family.
 */
// sanitizeModelName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeModelName(shortName: string): string {
  // Map internal variants to public equivalents based on model family
  // 满足 `shortName.includes('opus-4-6')` 时，共享工具执行该分支。
  if (shortName.includes('opus-4-6')) return 'claude-opus-4-6'
  // 满足 `shortName.includes('opus-4-5')` 时，共享工具执行该分支。
  if (shortName.includes('opus-4-5')) return 'claude-opus-4-5'
  // 满足 `shortName.includes('opus-4-1')` 时，共享工具执行该分支。
  if (shortName.includes('opus-4-1')) return 'claude-opus-4-1'
  // 满足 `shortName.includes('opus-4')` 时，共享工具执行该分支。
  if (shortName.includes('opus-4')) return 'claude-opus-4'
  // 满足 `shortName.includes('sonnet-4-6')` 时，共享工具执行该分支。
  if (shortName.includes('sonnet-4-6')) return 'claude-sonnet-4-6'
  // 满足 `shortName.includes('sonnet-4-5')` 时，共享工具执行该分支。
  if (shortName.includes('sonnet-4-5')) return 'claude-sonnet-4-5'
  // 满足 `shortName.includes('sonnet-4')` 时，共享工具执行该分支。
  if (shortName.includes('sonnet-4')) return 'claude-sonnet-4'
  // 满足 `shortName.includes('sonnet-3-7')` 时，共享工具执行该分支。
  if (shortName.includes('sonnet-3-7')) return 'claude-sonnet-3-7'
  // 满足 `shortName.includes('haiku-4-5')` 时，共享工具执行该分支。
  if (shortName.includes('haiku-4-5')) return 'claude-haiku-4-5'
  // 满足 `shortName.includes('haiku-3-5')` 时，共享工具执行该分支。
  if (shortName.includes('haiku-3-5')) return 'claude-haiku-3-5'
  // Unknown models get a generic name
  // 返回 `'claude'`，作为共享工具这次计算的结果。
  return 'claude'
}

/**
 * Attribution state for tracking Claude's contributions to files.
 */
// AttributionState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AttributionState = {
  // File states keyed by relative path (from cwd)
  fileStates: Map<string, FileAttributionState>
  // Session baseline states for net change calculation
  sessionBaselines: Map<string, { contentHash: string; mtime: number }>
  // Surface from which edits were made
  surface: string
  // HEAD SHA at session start (for detecting external commits)
  startingHeadSha: string | null
  // Total prompts in session (for steer count calculation)
  promptCount: number
  // Prompts at last commit (to calculate steers for current commit)
  promptCountAtLastCommit: number
  // Permission prompt tracking
  permissionPromptCount: number
  permissionPromptCountAtLastCommit: number
  // ESC press tracking (user cancelled permission prompt)
  escapeCount: number
  escapeCountAtLastCommit: number
}

/**
 * Summary of Claude's contribution for a commit.
 */
// AttributionSummary 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AttributionSummary = {
  claudePercent: number
  claudeChars: number
  humanChars: number
  surfaces: string[]
}

/**
 * Per-file attribution details for git notes.
 */
// FileAttribution 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileAttribution = {
  claudeChars: number
  humanChars: number
  percent: number
  surface: string
}

/**
 * Full attribution data for git notes JSON.
 */
// AttributionData 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AttributionData = {
  version: 1
  summary: AttributionSummary
  files: Record<string, FileAttribution>
  surfaceBreakdown: Record<string, { claudeChars: number; percent: number }>
  excludedGenerated: string[]
  sessions: string[]
}

/**
 * Get the current client surface from environment.
 */
// getClientSurface 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClientSurface(): string {
  // 返回 `process.env.CLAUDE_CODE_ENTRYPOINT ?? 'cli'`，作为共享工具这次计算的结果。
  return process.env.CLAUDE_CODE_ENTRYPOINT ?? 'cli'
}

/**
 * Build a surface key that includes the model name.
 * Format: "surface/model" (e.g., "cli/claude-sonnet")
 */
// buildSurfaceKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSurfaceKey(surface: string, model: ModelName): string {
  // 返回 ``${surface}/${getCanonicalName(model)}``，作为共享工具这次计算的结果。
  return `${surface}/${getCanonicalName(model)}`
}

/**
 * Compute SHA-256 hash of content.
 */
// computeContentHash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeContentHash(content: string): string {
  // 返回 `createHash('sha256').update(content).digest('hex')`，作为共享工具这次计算的结果。
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Normalize file path to relative path from cwd for consistent tracking.
 * Resolves symlinks to handle /tmp vs /private/tmp on macOS.
 */
// normalizeFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeFilePath(filePath: string): string {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()

  // 满足 `!isAbsolute(filePath)` 时，共享工具执行该分支。
  if (!isAbsolute(filePath)) {
    // 返回 `filePath`，作为共享工具这次计算的结果。
    return filePath
  }

  // Resolve symlinks in both paths for consistent comparison
  // (e.g., /tmp -> /private/tmp on macOS)
  // resolvedPath 路径数据保存`filePath`，供后续判断或组装使用。
  let resolvedPath = filePath
  // resolvedCwd保存`cwd`，供共享工具 commit Attribution后续判断或输出使用。
  let resolvedCwd = cwd

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // resolvedPath 路径数据更新为 `fs.realpathSync(filePath)`，确保共享工具后续读取最新状态。
    resolvedPath = fs.realpathSync(filePath)
  } catch {
    // File may not exist yet, use original path
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // resolvedCwd更新为 `fs.realpathSync(cwd)`，确保共享工具后续读取最新状态。
    resolvedCwd = fs.realpathSync(cwd)
  } catch {
    // Keep original cwd
  }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    resolvedPath.startsWith(resolvedCwd + sep) ||
    resolvedPath === resolvedCwd
  ) {
    // Normalize to forward slashes so keys match git diff output on Windows
    // 返回 `relative(resolvedCwd, resolvedPath).replaceAll(sep, '/')`，作为共享工具这次计算的结果。
    return relative(resolvedCwd, resolvedPath).replaceAll(sep, '/')
  }

  // Fallback: try original comparison
  // 只有 `filePath.startsWith(cwd + sep) || filePath === cwd` 满足时，共享工具才执行该分支。
  if (filePath.startsWith(cwd + sep) || filePath === cwd) {
    // 返回 `relative(cwd, filePath).replaceAll(sep, '/')`，作为共享工具这次计算的结果。
    return relative(cwd, filePath).replaceAll(sep, '/')
  }

  // 返回 `filePath`，作为共享工具这次计算的结果。
  return filePath
}

/**
 * Expand a relative path to absolute path.
 */
// expandFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandFilePath(filePath: string): string {
  // 满足 `isAbsolute(filePath)` 时，共享工具执行该分支。
  if (isAbsolute(filePath)) {
    // 返回 `filePath`，作为共享工具这次计算的结果。
    return filePath
  }
  // 返回 `join(getAttributionRepoRoot(), filePath)`，作为共享工具这次计算的结果。
  return join(getAttributionRepoRoot(), filePath)
}

/**
 * Create an empty attribution state for a new session.
 */
// createEmptyAttributionState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createEmptyAttributionState(): AttributionState {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    fileStates: new Map(),
    sessionBaselines: new Map(),
    surface: getClientSurface(),
    startingHeadSha: null,
    promptCount: 0,
    promptCountAtLastCommit: 0,
    permissionPromptCount: 0,
    permissionPromptCountAtLastCommit: 0,
    escapeCount: 0,
    escapeCountAtLastCommit: 0,
  }
}

/**
 * Compute the character contribution for a file modification.
 * Returns the FileAttributionState to store, or null if tracking failed.
 */
// computeFileModificationState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeFileModificationState(
  existingFileStates: Map<string, FileAttributionState>,
  filePath: string,
  oldContent: string,
  newContent: string,
  mtime: number,
): FileAttributionState | null {
  // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
  const normalizedPath = normalizeFilePath(filePath)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Calculate Claude's character contribution
    // claudeContribution 先占位，稍后的条件分支会根据实际输入补齐它。
    let claudeContribution: number

    // 当 `oldContent` 匹配 `'' || newContent === ''` 时，共享工具执行对应分支。
    if (oldContent === '' || newContent === '') {
      // New file or full deletion - contribution is the content length
      // 共享工具 commit Attribution在这里处理 `claudeContribution =`，完成这一小步状态转换。
      claudeContribution =
        oldContent === '' ? newContent.length : oldContent.length
    } else {
      // Find actual changed region via common prefix/suffix matching.
      // This correctly handles same-length replacements (e.g., "Esc" → "esc")
      // where Math.abs(newLen - oldLen) would be 0.
      // minLen保存`Math.min`，供共享工具后续处理使用。
      const minLen = Math.min(oldContent.length, newContent.length)
      // prefixEnd 命名 `0`，让后续代码直接表达这个值的用途。
      let prefixEnd = 0
      // 调用 while，触发共享工具此处需要的副作用。
      while (
        prefixEnd < minLen &&
        oldContent[prefixEnd] === newContent[prefixEnd]
      ) {
        // 共享工具 commit Attribution在这里处理 `prefixEnd++`，完成这一小步状态转换。
        prefixEnd++
      }
      // suffixLen 命名 `0`，让后续代码直接表达这个值的用途。
      let suffixLen = 0
      // 调用 while，触发共享工具此处需要的副作用。
      while (
        suffixLen < minLen - prefixEnd &&
        oldContent[oldContent.length - 1 - suffixLen] ===
          newContent[newContent.length - 1 - suffixLen]
      ) {
        // 共享工具 commit Attribution在这里处理 `suffixLen++`，完成这一小步状态转换。
        suffixLen++
      }
      // oldChangedLen 命名 `oldContent.length - prefixEnd - suffixLen`，让后续代码直接表达这个值的用途。
      const oldChangedLen = oldContent.length - prefixEnd - suffixLen
      // newChangedLen保存 `newContent.length - prefixEnd - suffixLen` 的判断结果，供共享工具 commit Attribution后续分支直接复用。
      const newChangedLen = newContent.length - prefixEnd - suffixLen
      // claudeContribution更新为 `Math.max(oldChangedLen, newChangedLen)`，确保共享工具后续读取最新状态。
      claudeContribution = Math.max(oldChangedLen, newChangedLen)
    }

    // Get current file state if it exists
    // existingState 状态读取`existingFileStates.get`，供共享工具后续处理使用。
    const existingState = existingFileStates.get(normalizedPath)
    // existingContribution保存`existingState?.claudeContribution ?? 0`，供后续判断或组装使用。
    const existingContribution = existingState?.claudeContribution ?? 0

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      contentHash: computeContentHash(newContent),
      claudeContribution: existingContribution + claudeContribution,
      mtime,
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Get a file's modification time (mtimeMs), falling back to Date.now() if
 * the file doesn't exist. This is async so it can be precomputed before
 * entering a sync setAppState callback.
 */
// getFileMtime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getFileMtime(filePath: string): Promise<number> {
  // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
  const normalizedPath = normalizeFilePath(filePath)
  // absPath 路径数据保存`expandFilePath`，供共享工具后续处理使用。
  const absPath = expandFilePath(normalizedPath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供共享工具后续处理使用。
    const stats = await stat(absPath)
    // 返回 `stats.mtimeMs`，作为共享工具这次计算的结果。
    return stats.mtimeMs
  } catch {
    // 返回 `Date.now()`，作为共享工具这次计算的结果。
    return Date.now()
  }
}

/**
 * Track a file modification by Claude.
 * Called after Edit/Write tool completes.
 */
// trackFileModification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackFileModification(
  state: AttributionState,
  filePath: string,
  oldContent: string,
  newContent: string,
  _userModified: boolean,
  mtime: number = Date.now(),
): AttributionState {
  // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
  const normalizedPath = normalizeFilePath(filePath)
  // newFileState 文件数据保存`computeFileModificationState`，供共享工具后续处理使用。
  const newFileState = computeFileModificationState(
    state.fileStates,
    filePath,
    oldContent,
    newContent,
    mtime,
  )
  // newFileState 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!newFileState) {
    // 返回 `state`，作为共享工具这次计算的结果。
    return state
  }

  // newFileStates 文件数据保存`Map`，供共享工具后续处理使用。
  const newFileStates = new Map(state.fileStates)
  // newFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
  newFileStates.set(normalizedPath, newFileState)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Attribution: Tracked ${newFileState.claudeContribution} chars for ${normalizedPath}`,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...state,
    fileStates: newFileStates,
  }
}

/**
 * Track a file creation by Claude (e.g., via bash command).
 * Used when Claude creates a new file through a non-tracked mechanism.
 */
// trackFileCreation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackFileCreation(
  state: AttributionState,
  filePath: string,
  content: string,
  mtime: number = Date.now(),
): AttributionState {
  // A creation is simply a modification from empty to the new content
  // 返回 `trackFileModification(state, filePath, '', content, false, mtime)`，作为共享工具这次计算的结果。
  return trackFileModification(state, filePath, '', content, false, mtime)
}

/**
 * Track a file deletion by Claude (e.g., via bash rm command).
 * Used when Claude deletes a file through a non-tracked mechanism.
 */
// trackFileDeletion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackFileDeletion(
  state: AttributionState,
  filePath: string,
  oldContent: string,
): AttributionState {
  // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
  const normalizedPath = normalizeFilePath(filePath)
  // existingState 状态读取`fileStates.get`，供共享工具后续处理使用。
  const existingState = state.fileStates.get(normalizedPath)
  // existingContribution保存`existingState?.claudeContribution ?? 0`，供后续判断或组装使用。
  const existingContribution = existingState?.claudeContribution ?? 0
  // deletedChars 集合 命名 `oldContent.length`，让后续代码直接表达这个值的用途。
  const deletedChars = oldContent.length

  // newFileState 文件数据 集中保存共享工具 commit Attribution要一起传递的字段。
  const newFileState: FileAttributionState = {
    contentHash: '', // Empty hash for deleted files
    claudeContribution: existingContribution + deletedChars,
    mtime: Date.now(),
  }

  // newFileStates 文件数据保存`Map`，供共享工具后续处理使用。
  const newFileStates = new Map(state.fileStates)
  // newFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
  newFileStates.set(normalizedPath, newFileState)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Attribution: Tracked deletion of ${normalizedPath} (${deletedChars} chars removed, total contribution: ${newFileState.claudeContribution})`,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...state,
    fileStates: newFileStates,
  }
}

// --

/**
 * Track multiple file changes in bulk, mutating a single Map copy.
 * This avoids the O(n²) cost of copying the Map per file when processing
 * large git diffs (e.g., jj operations that touch hundreds of thousands of files).
 */
// trackBulkFileChanges 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackBulkFileChanges(
  state: AttributionState,
  changes: ReadonlyArray<{
    path: string
    type: 'modified' | 'created' | 'deleted'
    oldContent: string
    newContent: string
    mtime?: number
  }>,
): AttributionState {
  // Create ONE copy of the Map, then mutate it for each file
  // newFileStates 文件数据保存`Map`，供共享工具后续处理使用。
  const newFileStates = new Map(state.fileStates)

  // 按顺序遍历 `changes` 中的change，逐个交给共享工具处理。
  for (const change of changes) {
    // mtime记录时间`Date.now`，供共享工具后续处理使用。
    const mtime = change.mtime ?? Date.now()
    // 当 `change.type` 匹配 `'deleted'` 时，共享工具执行对应分支。
    if (change.type === 'deleted') {
      // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
      const normalizedPath = normalizeFilePath(change.path)
      // existingState 状态读取`newFileStates.get`，供共享工具后续处理使用。
      const existingState = newFileStates.get(normalizedPath)
      // existingContribution保存`existingState?.claudeContribution ?? 0`，供后续判断或组装使用。
      const existingContribution = existingState?.claudeContribution ?? 0
      // deletedChars 集合记录 `change.oldContent.length` 是否成立，下一步按该结果分支。
      const deletedChars = change.oldContent.length

      // newFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
      newFileStates.set(normalizedPath, {
        contentHash: '',
        claudeContribution: existingContribution + deletedChars,
        mtime,
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Attribution: Tracked deletion of ${normalizedPath} (${deletedChars} chars removed, total contribution: ${existingContribution + deletedChars})`,
      )
    } else {
      // newFileState 文件数据保存`computeFileModificationState`，供共享工具后续处理使用。
      const newFileState = computeFileModificationState(
        newFileStates,
        change.path,
        change.oldContent,
        change.newContent,
        mtime,
      )
      // 满足 `newFileState` 时，共享工具执行该分支。
      if (newFileState) {
        // normalizedPath 路径数据保存`normalizeFilePath`，供共享工具后续处理使用。
        const normalizedPath = normalizeFilePath(change.path)
        // newFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
        newFileStates.set(normalizedPath, newFileState)

        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Attribution: Tracked ${newFileState.claudeContribution} chars for ${normalizedPath}`,
        )
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...state,
    fileStates: newFileStates,
  }
}

/**
 * Calculate final attribution for staged files.
 * Compares session baseline to committed state.
 */
// calculateCommitAttribution 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function calculateCommitAttribution(
  states: AttributionState[],
  stagedFiles: string[],
): Promise<AttributionData> {
  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()

  // files 文件数据 从空对象开始收集键值，后续按名称补齐内容。
  const files: Record<string, FileAttribution> = {}
  // excludedGenerated 从空数组开始收集，后续循环会按处理顺序追加条目。
  const excludedGenerated: string[] = []
  // surfaces 集合构建`new Set<string>()`，供后续判断或组装使用。
  const surfaces = new Set<string>()
  // surfaceCounts 数量 从空对象开始收集键值，后续按名称补齐内容。
  const surfaceCounts: Record<string, number> = {}

  // totalClaudeChars 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let totalClaudeChars = 0
  // totalHumanChars 集合保存`0`，供共享工具 commit Attribution后续判断或输出使用。
  let totalHumanChars = 0

  // Merge file states from all sessions
  // mergedFileStates 文件数据构建`new Map<string, FileAttributionState>()` 整理出中间结果，供共享工具 commit Attribution后续步骤使用。
  const mergedFileStates = new Map<string, FileAttributionState>()
  // mergedBaselines 集合构建`new Map<`，供后续判断或组装使用。
  const mergedBaselines = new Map<
    string,
    { contentHash: string; mtime: number }
  >()

  // 按顺序遍历 `states` 中的状态，逐个交给共享工具处理。
  for (const state of states) {
    // 调用 surfaces.add，触发共享工具此处需要的副作用。
    surfaces.add(state.surface)

    // Merge baselines (earliest baseline wins)
    // Handle both Map and plain object (in case of serialization)
    // baselines 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baselines =
      state.sessionBaselines instanceof Map
        ? state.sessionBaselines
        : new Map(
            Object.entries(
              (state.sessionBaselines ?? {}) as Record<
                string,
                { contentHash: string; mtime: number }
              >,
            ),
          )
    // 循环处理 `const [path, baseline] of baselines`，让共享工具逐项把同类条目按顺序走完。
    for (const [path, baseline] of baselines) {
      // 满足 `!mergedBaselines.has(path)` 时，共享工具执行该分支。
      if (!mergedBaselines.has(path)) {
        // mergedBaselines.set 写入新的状态值，使共享工具后续读取保持一致。
        mergedBaselines.set(path, baseline)
      }
    }

    // Merge file states (accumulate contributions)
    // Handle both Map and plain object (in case of serialization)
    // fileStates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const fileStates =
      state.fileStates instanceof Map
        ? state.fileStates
        : new Map(
            Object.entries(
              (state.fileStates ?? {}) as Record<string, FileAttributionState>,
            ),
          )
    // 循环处理 `const [path, fileState] of fileStates`，让共享工具逐项把同类条目按顺序走完。
    for (const [path, fileState] of fileStates) {
      // existing读取`mergedFileStates.get`，供共享工具后续处理使用。
      const existing = mergedFileStates.get(path)
      // 满足 `existing` 时，共享工具执行该分支。
      if (existing) {
        // mergedFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
        mergedFileStates.set(path, {
          ...fileState,
          claudeContribution:
            existing.claudeContribution + fileState.claudeContribution,
        })
      } else {
        // mergedFileStates.set 写入新的状态值，使共享工具后续读取保持一致。
        mergedFileStates.set(path, fileState)
      }
    }
  }

  // Process files in parallel
  // fileResults 文件数据保存`Promise.all`，供共享工具后续处理使用。
  const fileResults = await Promise.all(
    // 调用 stagedFiles.map，触发共享工具此处需要的副作用。
    stagedFiles.map(async file => {
      // Skip generated files
      // 满足 `isGeneratedFile(file)` 时，共享工具执行该分支。
      if (isGeneratedFile(file)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'generated' as const, file }
      }

      // absPath 路径数据格式化`join`，供共享工具后续处理使用。
      const absPath = join(cwd, file)
      // fileState 文件数据读取`mergedFileStates.get`，供共享工具后续处理使用。
      const fileState = mergedFileStates.get(file)
      // baseline读取`mergedBaselines.get`，供共享工具后续处理使用。
      const baseline = mergedBaselines.get(file)

      // Get the surface for this file
      // fileSurface 文件数据读取 `states[0]!.surface` 对应条目，后续围绕该成员继续处理。
      const fileSurface = states[0]!.surface

      // claudeChars 集合 命名 `0`，让后续代码直接表达这个值的用途。
      let claudeChars = 0
      // humanChars 集合保存`0`，供后续判断或组装使用。
      let humanChars = 0

      // Check if file was deleted
      // deleted保存`isFileDeleted`，供共享工具后续处理使用。
      const deleted = await isFileDeleted(file)

      // 满足 `deleted` 时，共享工具执行该分支。
      if (deleted) {
        // File was deleted
        // 满足 `fileState` 时，共享工具执行该分支。
        if (fileState) {
          // Claude deleted this file (tracked deletion)
          // claudeChars 集合更新为 `fileState.claudeContribution`，确保共享工具后续读取最新状态。
          claudeChars = fileState.claudeContribution
          // humanChars 集合更新为 `0`，确保共享工具后续读取最新状态。
          humanChars = 0
        } else {
          // Human deleted this file (untracked deletion)
          // Use diff size to get the actual change size
          // diffSize读取`getGitDiffSize`，供共享工具后续处理使用。
          const diffSize = await getGitDiffSize(file)
          // humanChars 集合更新为 `diffSize > 0 ? diffSize : 100 // Minimum attribution for ...`，确保共享工具后续读取最新状态。
          humanChars = diffSize > 0 ? diffSize : 100 // Minimum attribution for a deletion
        }
      } else {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // Only need file size, not content - stat() avoids loading GB-scale
          // build artifacts into memory when they appear in the working tree.
          // stats.size (bytes) is an adequate proxy for char count here.
          // stats 集合保存`stat`，供共享工具后续处理使用。
          const stats = await stat(absPath)

          // 满足 `fileState` 时，共享工具执行该分支。
          if (fileState) {
            // We have tracked modifications for this file
            // claudeChars 集合更新为 `fileState.claudeContribution`，确保共享工具后续读取最新状态。
            claudeChars = fileState.claudeContribution
            // humanChars 集合更新为 `0`，确保共享工具后续读取最新状态。
            humanChars = 0
          // 共享工具 commit Attribution在这里处理 `} else if (baseline) {`，完成这一小步状态转换。
          } else if (baseline) {
            // File was modified but not tracked - human modification
            // diffSize读取`getGitDiffSize`，供共享工具后续处理使用。
            const diffSize = await getGitDiffSize(file)
            // humanChars 集合更新为 `diffSize > 0 ? diffSize : stats.size`，确保共享工具后续读取最新状态。
            humanChars = diffSize > 0 ? diffSize : stats.size
          } else {
            // New file not created by Claude
            // humanChars 集合更新为 `stats.size`，确保共享工具后续读取最新状态。
            humanChars = stats.size
          }
        } catch {
          // File doesn't exist or stat failed - skip it
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }
      }

      // Ensure non-negative values
      // claudeChars 集合更新为 `Math.max(0, claudeChars)`，确保共享工具后续读取最新状态。
      claudeChars = Math.max(0, claudeChars)
      // humanChars 集合更新为 `Math.max(0, humanChars)`，确保共享工具后续读取最新状态。
      humanChars = Math.max(0, humanChars)

      // total保存`claudeChars + humanChars`，供后续判断或组装使用。
      const total = claudeChars + humanChars
      // percent保存`Math.round`，供共享工具后续处理使用。
      const percent = total > 0 ? Math.round((claudeChars / total) * 100) : 0

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'file' as const,
        file,
        claudeChars,
        humanChars,
        percent,
        surface: fileSurface,
      }
    }),
  )

  // Aggregate results
  // 按顺序遍历 `fileResults` 中的结果，逐个交给共享工具处理。
  for (const result of fileResults) {
    // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result) continue

    // 当 `result.type` 匹配 `'generated'` 时，共享工具执行对应分支。
    if (result.type === 'generated') {
      // excludedGenerated追加新条目，保持收集顺序与输入顺序一致。
      excludedGenerated.push(result.file)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // file 文件数据更新为 `{`，确保共享工具 commit Attribution后续读取最新状态。
    files[result.file] = {
      claudeChars: result.claudeChars,
      humanChars: result.humanChars,
      percent: result.percent,
      surface: result.surface,
    }

    // 共享工具 commit Attribution在这里处理 `totalClaudeChars += result.claudeChars`，完成这一小步状态转换。
    totalClaudeChars += result.claudeChars
    // 共享工具 commit Attribution在这里处理 `totalHumanChars += result.humanChars`，完成这一小步状态转换。
    totalHumanChars += result.humanChars

    // 共享工具 commit Attribution在这里处理 `surfaceCounts[result.surface] =`，完成这一小步状态转换。
    surfaceCounts[result.surface] =
      (surfaceCounts[result.surface] ?? 0) + result.claudeChars
  }

  // totalChars 集合保存`totalClaudeChars + totalHumanChars`，供后续判断或组装使用。
  const totalChars = totalClaudeChars + totalHumanChars
  // claudePercent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const claudePercent =
    totalChars > 0 ? Math.round((totalClaudeChars / totalChars) * 100) : 0

  // Calculate surface breakdown (percentage of total content per surface)
  // surfaceBreakdown 先占位，稍后的条件分支会根据实际输入补齐它。
  const surfaceBreakdown: Record<
    string,
    { claudeChars: number; percent: number }
  > = {}
  // 循环处理 `const [surface, chars] of Object.entries(surfaceCounts)`，让共享工具把同类条目按顺序走完。
  for (const [surface, chars] of Object.entries(surfaceCounts)) {
    // Calculate what percentage of TOTAL content this surface contributed
    // percent保存`Math.round`，供共享工具后续处理使用。
    const percent = totalChars > 0 ? Math.round((chars / totalChars) * 100) : 0
    // surfaceBreakdown[surface更新为 `{ claudeChars: chars, percent }`，确保共享工具 commit Attribution后续读取最新状态。
    surfaceBreakdown[surface] = { claudeChars: chars, percent }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    version: 1,
    summary: {
      claudePercent,
      claudeChars: totalClaudeChars,
      humanChars: totalHumanChars,
      surfaces: Array.from(surfaces),
    },
    files,
    surfaceBreakdown,
    excludedGenerated,
    sessions: [sessionId],
  }
}

/**
 * Get the size of changes for a file from git diff.
 * Returns the number of characters added/removed (absolute difference).
 * For new files, returns the total file size.
 * For deleted files, returns the size of the deleted content.
 */
// getGitDiffSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGitDiffSize(filePath: string): Promise<number> {
  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Use git diff --stat to get a summary of changes
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      gitExe(),
      ['diff', '--cached', '--stat', '--', filePath],
      { cwd, timeout: 5000 },
    )

    // `result.code` 与 `0 || !result.stdout` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0 || !result.stdout) {
      // 返回 `0`，作为共享工具这次计算的结果。
      return 0
    }

    // Parse the stat output to extract additions and deletions
    // Format: " file | 5 ++---" or " file | 10 +"
    // 文本行格式化`stdout.split`，供共享工具后续处理使用。
    const lines = result.stdout.split('\n').filter(Boolean)
    // totalChanges 集合保存`0`，供共享工具 commit Attribution后续判断或输出使用。
    let totalChanges = 0

    // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
    for (const line of lines) {
      // Skip the summary line (e.g., "1 file changed, 3 insertions(+), 2 deletions(-)")
      // 只有 `line.includes('file changed') || line.includes('files changed')` 满足时，共享工具才执行该分支。
      if (line.includes('file changed') || line.includes('files changed')) {
        // insertMatch匹配`line.match`，供共享工具后续处理使用。
        const insertMatch = line.match(/(\d+) insertions?/)
        // deleteMatch匹配`line.match`，供共享工具后续处理使用。
        const deleteMatch = line.match(/(\d+) deletions?/)

        // Use line-based changes and approximate chars per line (~40 chars average)
        // insertions 集合解析`parseInt`，供共享工具后续处理使用。
        const insertions = insertMatch ? parseInt(insertMatch[1]!, 10) : 0
        // deletions 集合解析`parseInt`，供共享工具后续处理使用。
        const deletions = deleteMatch ? parseInt(deleteMatch[1]!, 10) : 0
        // 共享工具 commit Attribution在这里处理 `totalChanges += (insertions + deletions) * 40`，完成这一小步状态转换。
        totalChanges += (insertions + deletions) * 40
      }
    }

    // 返回 `totalChanges`，作为共享工具这次计算的结果。
    return totalChanges
  } catch {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }
}

/**
 * Check if a file was deleted in the staged changes.
 */
// isFileDeleted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isFileDeleted(filePath: string): Promise<boolean> {
  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      gitExe(),
      ['diff', '--cached', '--name-status', '--', filePath],
      { cwd, timeout: 5000 },
    )

    // 只有 `result.code === 0 && result.stdout` 满足时，共享工具才执行该分支。
    if (result.code === 0 && result.stdout) {
      // Format: "D\tfilename" for deleted files
      // 返回 `result.stdout.trim().startsWith('D\t')`，作为共享工具这次计算的结果。
      return result.stdout.trim().startsWith('D\t')
    }
  } catch {
    // Ignore errors
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get staged files from git.
 */
// getStagedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getStagedFiles(): Promise<string[]> {
  // cwd读取`getAttributionRepoRoot`，供共享工具后续处理使用。
  const cwd = getAttributionRepoRoot()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      gitExe(),
      ['diff', '--cached', '--name-only'],
      { cwd, timeout: 5000 },
    )

    // 只有 `result.code === 0 && result.stdout` 满足时，共享工具才执行该分支。
    if (result.code === 0 && result.stdout) {
      // 返回 `result.stdout.split('\n').filter(Boolean)`，作为共享工具这次计算的结果。
      return result.stdout.split('\n').filter(Boolean)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

// formatAttributionTrailer moved to attributionTrailer.ts for tree-shaking
// (contains excluded strings that should not be in external builds)

/**
 * Check if we're in a transient git state (rebase, merge, cherry-pick).
 */
// isGitTransientState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isGitTransientState(): Promise<boolean> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir(getAttributionRepoRoot())
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) return false

  // indicators 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const indicators = [
    'rebase-merge',
    'rebase-apply',
    'MERGE_HEAD',
    'CHERRY_PICK_HEAD',
    'BISECT_LOG',
  ]

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 indicators.map，触发共享工具此处需要的副作用。
    indicators.map(async indicator => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `stat(join(gitDir, indicator))` 完成，再继续共享工具 commit Attribution的异步流程。
        await stat(join(gitDir, indicator))
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }),
  )

  // 返回 `results.some(exists => exists)`，作为共享工具这次计算的结果。
  return results.some(exists => exists)
}

/**
 * Convert attribution state to snapshot message for persistence.
 */
// stateToSnapshotMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stateToSnapshotMessage(
  state: AttributionState,
  messageId: UUID,
): AttributionSnapshotMessage {
  // fileStates 文件数据 从空对象开始收集键值，后续按名称补齐内容。
  const fileStates: Record<string, FileAttributionState> = {}

  // 循环处理 `const [path, fileState] of state.fileStates`，让共享工具逐项把同类条目按顺序走完。
  for (const [path, fileState] of state.fileStates) {
    // fileStates[path 路径数据更新为 `fileState`，确保共享工具 commit Attribution后续读取最新状态。
    fileStates[path] = fileState
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'attribution-snapshot',
    messageId,
    surface: state.surface,
    fileStates,
    promptCount: state.promptCount,
    promptCountAtLastCommit: state.promptCountAtLastCommit,
    permissionPromptCount: state.permissionPromptCount,
    permissionPromptCountAtLastCommit: state.permissionPromptCountAtLastCommit,
    escapeCount: state.escapeCount,
    escapeCountAtLastCommit: state.escapeCountAtLastCommit,
  }
}

/**
 * Restore attribution state from snapshot messages.
 */
// restoreAttributionStateFromSnapshots 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreAttributionStateFromSnapshots(
  snapshots: AttributionSnapshotMessage[],
): AttributionState {
  // 状态构建`createEmptyAttributionState`，供共享工具后续处理使用。
  const state = createEmptyAttributionState()

  // Snapshots are full-state dumps (see stateToSnapshotMessage), not deltas.
  // The last snapshot has the most recent count for every path — fileStates
  // never shrinks. Iterating and SUMMING counts across snapshots causes
  // quadratic growth on restore (837 snapshots × 280 files → 1.15 quadrillion
  // "chars" tracked for a 5KB file over a 5-day session).
  // lastSnapshot记录 `snapshots[snapshots.length - 1]` 是否成立，下一步按该结果分支。
  const lastSnapshot = snapshots[snapshots.length - 1]
  // lastSnapshot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastSnapshot) {
    // 返回 `state`，作为共享工具这次计算的结果。
    return state
  }

  // surface更新为 `lastSnapshot.surface`，确保共享工具后续读取最新状态。
  state.surface = lastSnapshot.surface
  // 循环处理 `const [path, fileState] of Object.entries(lastSnapshot.fileStates)`，让共享工具把同类条目按顺序走完。
  for (const [path, fileState] of Object.entries(lastSnapshot.fileStates)) {
    // state.fileStates.set 写入新的状态值，使共享工具后续读取保持一致。
    state.fileStates.set(path, fileState)
  }

  // Restore prompt counts from the last snapshot (most recent state)
  // promptCount 数量更新为 `lastSnapshot.promptCount ?? 0`，确保共享工具后续读取最新状态。
  state.promptCount = lastSnapshot.promptCount ?? 0
  // promptCountAtLastCommit 数量更新为 `lastSnapshot.promptCountAtLastCommit ?? 0`，确保共享工具后续读取最新状态。
  state.promptCountAtLastCommit = lastSnapshot.promptCountAtLastCommit ?? 0
  // permissionPromptCount 权限数据更新为 `lastSnapshot.permissionPromptCount ?? 0`，确保共享工具后续读取最新状态。
  state.permissionPromptCount = lastSnapshot.permissionPromptCount ?? 0
  // 共享工具 commit Attribution在这里处理 `state.permissionPromptCountAtLastCommit =`，完成这一小步状态转换。
  state.permissionPromptCountAtLastCommit =
    lastSnapshot.permissionPromptCountAtLastCommit ?? 0
  // escapeCount 数量更新为 `lastSnapshot.escapeCount ?? 0`，确保共享工具后续读取最新状态。
  state.escapeCount = lastSnapshot.escapeCount ?? 0
  // escapeCountAtLastCommit 数量更新为 `lastSnapshot.escapeCountAtLastCommit ?? 0`，确保共享工具后续读取最新状态。
  state.escapeCountAtLastCommit = lastSnapshot.escapeCountAtLastCommit ?? 0

  // 返回 `state`，作为共享工具这次计算的结果。
  return state
}

/**
 * Restore attribution state from log snapshots on session resume.
 */
// attributionRestoreStateFromLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function attributionRestoreStateFromLog(
  attributionSnapshots: AttributionSnapshotMessage[],
  // 这个回调绑定到 onUpdateState: (newState: AttributionState) => void,，负责共享工具在该局部场景下的响应。
  onUpdateState: (newState: AttributionState) => void,
): void {
  // 状态保存`restoreAttributionStateFromSnapshots`，供共享工具后续处理使用。
  const state = restoreAttributionStateFromSnapshots(attributionSnapshots)
  // 调用 onUpdateState，触发共享工具此处需要的副作用。
  onUpdateState(state)
}

/**
 * Increment promptCount and save an attribution snapshot.
 * Used to persist the prompt count across compaction.
 *
 * @param attribution - Current attribution state
 * @param saveSnapshot - Function to save the snapshot (allows async handling by caller)
 * @returns New attribution state with incremented promptCount
 */
// incrementPromptCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementPromptCount(
  attribution: AttributionState,
  // 这个回调绑定到 saveSnapshot: (snapshot: AttributionSnapshotMessage) => void,，负责共享工具在该局部场景下的响应。
  saveSnapshot: (snapshot: AttributionSnapshotMessage) => void,
): AttributionState {
  // newAttribution集中保存共享工具 commit Attribution要一起传递的字段。
  const newAttribution = {
    ...attribution,
    promptCount: attribution.promptCount + 1,
  }
  // snapshot保存`stateToSnapshotMessage`，供共享工具后续处理使用。
  const snapshot = stateToSnapshotMessage(newAttribution, randomUUID())
  // 调用 saveSnapshot，触发共享工具此处需要的副作用。
  saveSnapshot(snapshot)
  // 返回 `newAttribution`，作为共享工具这次计算的结果。
  return newAttribution
}
