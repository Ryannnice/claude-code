// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, join, normalize, sep } from 'path'
// 整理这一组导入，让paths后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getProjectRoot,
} from '../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让paths后续逻辑可以直接复用这些外部能力。
import {
  getClaudeConfigHomeDir,
  isEnvDefinedFalsy,
  isEnvTruthy,
} from '../utils/envUtils.js'
// 复用 findCanonicalGitRoot 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { findCanonicalGitRoot } from '../utils/git.js'
// 复用 sanitizePath 工具函数，把通用处理留在 ../utils/path.js 中维护。
import { sanitizePath } from '../utils/path.js'
// 整理这一组导入，让paths后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Whether auto-memory features are enabled (memdir, agent memory, past session search).
 * Enabled by default. Priority chain (first defined wins):
 *   1. CLAUDE_CODE_DISABLE_AUTO_MEMORY env var (1/true → OFF, 0/false → ON)
 *   2. CLAUDE_CODE_SIMPLE (--bare) → OFF
 *   3. CCR without persistent storage → OFF (no CLAUDE_CODE_REMOTE_MEMORY_DIR)
 *   4. autoMemoryEnabled in settings.json (supports project-level opt-out)
 *   5. Default: enabled
 */
// isAutoMemoryEnabled 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoMemoryEnabled(): boolean {
  // envVal 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envVal = process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY
  // 满足 `isEnvTruthy(envVal)` 时，paths执行该分支。
  if (isEnvTruthy(envVal)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `isEnvDefinedFalsy(envVal)` 时，paths执行该分支。
  if (isEnvDefinedFalsy(envVal)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // --bare / SIMPLE: prompts.ts already drops the memory section from the
  // system prompt via its SIMPLE early-return; this gate stops the other half
  // (extractMemories turn-end fork, autoDream, /remember, /dream, team sync).
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，paths执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // paths在这里进入条件判断，后续代码按实际状态分流。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
    !process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // settings 集合读取`getInitialSettings`，供paths后续处理使用。
  const settings = getInitialSettings()
  // `settings.autoMemoryEnabled` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (settings.autoMemoryEnabled !== undefined) {
    // 返回 `settings.autoMemoryEnabled`，作为paths这次计算的结果。
    return settings.autoMemoryEnabled
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Whether the extract-memories background agent will run this session.
 *
 * The main agent's prompt always has full save instructions regardless of
 * this gate — when the main agent writes memories, the background agent
 * skips that range (hasMemoryWritesSince in extractMemories.ts); when it
 * doesn't, the background agent catches anything missed.
 *
 * Callers must also gate on feature('EXTRACT_MEMORIES') — that check cannot
 * live inside this helper because feature() only tree-shakes when used
 * directly in an `if` condition.
 */
// isExtractModeActive 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isExtractModeActive(): boolean {
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_passport_quail', false)` 时，paths执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_passport_quail', false)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为paths这次计算的结果。
  return (
    !getIsNonInteractiveSession() ||
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_slate_thimble', false)
  )
}

/**
 * Returns the base directory for persistent memory storage.
 * Resolution order:
 *   1. CLAUDE_CODE_REMOTE_MEMORY_DIR env var (explicit override, set in CCR)
 *   2. ~/.claude (default config home)
 */
// getMemoryBaseDir 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMemoryBaseDir(): string {
  // 满足 `process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR` 时，paths执行该分支。
  if (process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR) {
    // 返回 `process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR`，作为paths这次计算的结果。
    return process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR
  }
  // 返回 `getClaudeConfigHomeDir()`，作为paths这次计算的结果。
  return getClaudeConfigHomeDir()
}

// AUTO_MEM_DIRNAME固定为 `'memory'`，作为paths后续展示或比较的基准。
const AUTO_MEM_DIRNAME = 'memory'
// AUTO_MEM_ENTRYPOINT_NAME保存`'MEMORY.md'`，作为后续固定文本处理的输入。
const AUTO_MEM_ENTRYPOINT_NAME = 'MEMORY.md'

/**
 * Normalize and validate a candidate auto-memory directory path.
 *
 * SECURITY: Rejects paths that would be dangerous as a read-allowlist root
 * or that normalize() doesn't fully resolve:
 * - relative (!isAbsolute): "../foo" — would be interpreted relative to CWD
 * - root/near-root (length < 3): "/" → "" after strip; "/a" too short
 * - Windows drive-root (C: regex): "C:\" → "C:" after strip
 * - UNC paths (\\server\share): network paths — opaque trust boundary
 * - null byte: survives normalize(), can truncate in syscalls
 *
 * Returns the normalized path with exactly one trailing separator,
 * or undefined if the path is unset/empty/rejected.
 */
// validateMemoryPath 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateMemoryPath(
  raw: string | undefined,
  expandTilde: boolean,
): string | undefined {
  // 原始文本缺失时提前走兜底路径，避免paths继续依赖无效输入。
  if (!raw) {
    // 返回 `undefined`，作为paths这次计算的结果。
    return undefined
  }
  // candidate 命名 `raw`，让后续代码直接表达这个值的用途。
  let candidate = raw
  // Settings.json paths support ~/ expansion (user-friendly). The env var
  // override does not (it's set programmatically by Cowork/SDK, which should
  // always pass absolute paths). Bare "~", "~/", "~/.", "~/..", etc. are NOT
  // expanded — they would make isAutoMemPath() match all of $HOME or its
  // parent (same class of danger as "/" or "C:\").
  // paths在这里进入条件判断，后续代码按实际状态分流。
  if (
    expandTilde &&
    (candidate.startsWith('~/') || candidate.startsWith('~\\'))
  ) {
    // rest格式化`candidate.slice`，供paths后续处理使用。
    const rest = candidate.slice(2)
    // Reject trivial remainders that would expand to $HOME or an ancestor.
    // normalize('') = '.', normalize('.') = '.', normalize('foo/..') = '.',
    // normalize('..') = '..', normalize('foo/../..') = '..'
    // restNorm保存`normalize`，供paths后续处理使用。
    const restNorm = normalize(rest || '.')
    // 当 `restNorm` 匹配 `'.' || restNorm === '..'` 时，paths执行对应分支。
    if (restNorm === '.' || restNorm === '..') {
      // 返回 `undefined`，作为paths这次计算的结果。
      return undefined
    }
    // candidate更新为 `join(homedir(), rest)`，确保paths后续读取最新状态。
    candidate = join(homedir(), rest)
  }
  // normalize() may preserve a trailing separator; strip before adding
  // exactly one to match the trailing-sep contract of getAutoMemPath()
  // normalized保存`normalize`，供paths后续处理使用。
  const normalized = normalize(candidate).replace(/[/\\]+$/, '')
  // paths在这里进入条件判断，后续代码按实际状态分流。
  if (
    !isAbsolute(normalized) ||
    normalized.length < 3 ||
    /^[A-Za-z]:$/.test(normalized) ||
    normalized.startsWith('\\\\') ||
    normalized.startsWith('//') ||
    normalized.includes('\0')
  ) {
    // 返回 `undefined`，作为paths这次计算的结果。
    return undefined
  }
  // 返回 `(normalized + sep).normalize('NFC')`，作为paths这次计算的结果。
  return (normalized + sep).normalize('NFC')
}

/**
 * Direct override for the full auto-memory directory path via env var.
 * When set, getAutoMemPath()/getAutoMemEntrypoint() return this path directly
 * instead of computing `{base}/projects/{sanitized-cwd}/memory/`.
 *
 * Used by Cowork to redirect memory to a space-scoped mount where the
 * per-session cwd (which contains the VM process name) would otherwise
 * produce a different project-key for every session.
 */
// getAutoMemPathOverride 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoMemPathOverride(): string | undefined {
  // 返回 `validateMemoryPath(`，作为paths这次计算的结果。
  return validateMemoryPath(
    process.env.CLAUDE_COWORK_MEMORY_PATH_OVERRIDE,
    false,
  )
}

/**
 * Settings.json override for the full auto-memory directory path.
 * Supports ~/ expansion for user convenience.
 *
 * SECURITY: projectSettings (.claude/settings.json committed to the repo) is
 * intentionally excluded — a malicious repo could otherwise set
 * autoMemoryDirectory: "~/.ssh" and gain silent write access to sensitive
 * directories via the filesystem.ts write carve-out (which fires when
 * isAutoMemPath() matches and hasAutoMemPathOverride() is false). This follows
 * the same pattern as hasSkipDangerousModePermissionPrompt() etc.
 */
// getAutoMemPathSetting 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoMemPathSetting(): string | undefined {
  // dir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const dir =
    getSettingsForSource('policySettings')?.autoMemoryDirectory ??
    getSettingsForSource('flagSettings')?.autoMemoryDirectory ??
    getSettingsForSource('localSettings')?.autoMemoryDirectory ??
    getSettingsForSource('userSettings')?.autoMemoryDirectory
  // 返回 `validateMemoryPath(dir, true)`，作为paths这次计算的结果。
  return validateMemoryPath(dir, true)
}

/**
 * Check if CLAUDE_COWORK_MEMORY_PATH_OVERRIDE is set to a valid override.
 * Use this as a signal that the SDK caller has explicitly opted into
 * the auto-memory mechanics — e.g. to decide whether to inject the
 * memory prompt when a custom system prompt replaces the default.
 */
// hasAutoMemPathOverride 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAutoMemPathOverride(): boolean {
  // 返回 `getAutoMemPathOverride() !== undefined`，作为paths这次计算的结果。
  return getAutoMemPathOverride() !== undefined
}

/**
 * Returns the canonical git repo root if available, otherwise falls back to
 * the stable project root. Uses findCanonicalGitRoot so all worktrees of the
 * same repo share one auto-memory directory (anthropics/claude-code#24382).
 */
// getAutoMemBase 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoMemBase(): string {
  // 返回 `findCanonicalGitRoot(getProjectRoot()) ?? getProjectRoot()`，作为paths这次计算的结果。
  return findCanonicalGitRoot(getProjectRoot()) ?? getProjectRoot()
}

/**
 * Returns the auto-memory directory path.
 *
 * Resolution order:
 *   1. CLAUDE_COWORK_MEMORY_PATH_OVERRIDE env var (full-path override, used by Cowork)
 *   2. autoMemoryDirectory in settings.json (trusted sources only: policy/local/user)
 *   3. <memoryBase>/projects/<sanitized-git-root>/memory/
 *      where memoryBase is resolved by getMemoryBaseDir()
 *
 * Memoized: render-path callers (collapseReadSearchGroups → isAutoManagedMemoryFile)
 * fire per tool-use message per Messages re-render; each miss costs
 * getSettingsForSource × 4 → parseSettingsFile (realpathSync + readFileSync).
 * Keyed on projectRoot so tests that change its mock mid-block recompute;
 * env vars / settings.json / CLAUDE_CONFIG_DIR are session-stable in
 * production and covered by per-test cache.clear.
 */
// getAutoMemPath 路径数据保存`memoize`，供paths后续处理使用。
export const getAutoMemPath = memoize(
  (): string => {
    // override读取`getAutoMemPathOverride`，供paths后续处理使用。
    const override = getAutoMemPathOverride() ?? getAutoMemPathSetting()
    // 满足 `override` 时，paths执行该分支。
    if (override) {
      // 返回 `override`，作为paths这次计算的结果。
      return override
    }
    // projectsDir格式化`join`，供paths后续处理使用。
    const projectsDir = join(getMemoryBaseDir(), 'projects')
    // 返回 `(`，作为paths这次计算的结果。
    return (
      join(projectsDir, sanitizePath(getAutoMemBase()), AUTO_MEM_DIRNAME) + sep
    ).normalize('NFC')
  },
  // 这个回调绑定到 () => getProjectRoot(),，负责paths在该局部场景下的响应。
  () => getProjectRoot(),
)

/**
 * Returns the daily log file path for the given date (defaults to today).
 * Shape: <autoMemPath>/logs/YYYY/MM/YYYY-MM-DD.md
 *
 * Used by assistant mode (feature('KAIROS')): rather than maintaining
 * MEMORY.md as a live index, the agent appends to a date-named log file
 * as it works. A separate nightly /dream skill distills these logs into
 * topic files + MEMORY.md.
 */
// getAutoMemDailyLogPath 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoMemDailyLogPath(date: Date = new Date()): string {
  // yyyy读取`date.getFullYear`，供paths后续处理使用。
  const yyyy = date.getFullYear().toString()
  // mm读取`date.getMonth`，供paths后续处理使用。
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  // dd读取`date.getDate`，供paths后续处理使用。
  const dd = date.getDate().toString().padStart(2, '0')
  // 返回 `join(getAutoMemPath(), 'logs', yyyy, mm, `${yyyy}-${mm}-${dd}.md`)`，作为paths这次计算的结果。
  return join(getAutoMemPath(), 'logs', yyyy, mm, `${yyyy}-${mm}-${dd}.md`)
}

/**
 * Returns the auto-memory entrypoint (MEMORY.md inside the auto-memory dir).
 * Follows the same resolution order as getAutoMemPath().
 */
// getAutoMemEntrypoint 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoMemEntrypoint(): string {
  // 返回 `join(getAutoMemPath(), AUTO_MEM_ENTRYPOINT_NAME)`，作为paths这次计算的结果。
  return join(getAutoMemPath(), AUTO_MEM_ENTRYPOINT_NAME)
}

/**
 * Check if an absolute path is within the auto-memory directory.
 *
 * When CLAUDE_COWORK_MEMORY_PATH_OVERRIDE is set, this matches against the
 * env-var override directory. Note that a true return here does NOT imply
 * write permission in that case — the filesystem.ts write carve-out is gated
 * on !hasAutoMemPathOverride() (it exists to bypass DANGEROUS_DIRECTORIES).
 *
 * The settings.json autoMemoryDirectory DOES get the write carve-out: it's the
 * user's explicit choice from a trusted settings source (projectSettings is
 * excluded — see getAutoMemPathSetting), and hasAutoMemPathOverride() remains
 * false for it.
 */
// isAutoMemPath 封装paths的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoMemPath(absolutePath: string): boolean {
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments
  // normalizedPath 路径数据保存`normalize`，供paths后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // 返回 `normalizedPath.startsWith(getAutoMemPath())`，作为paths这次计算的结果。
  return normalizedPath.startsWith(getAutoMemPath())
}
