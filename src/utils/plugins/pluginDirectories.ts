/**
 * Centralized plugin directory configuration.
 *
 * This module provides the single source of truth for the plugins directory path.
 * It supports switching between 'plugins' and 'cowork_plugins' directories via:
 * - CLI flag: --cowork
 * - Environment variable: CLAUDE_CODE_USE_COWORK_PLUGINS
 *
 * The base directory can be overridden via CLAUDE_CODE_PLUGIN_CACHE_DIR.
 */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { mkdirSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, rm, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { delimiter, join } from 'path'
// 引入 getUseCoworkPlugins，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getUseCoworkPlugins } from '../../bootstrap/state.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from '../envUtils.js'
// 引入 errorMessage、isFsInaccessible，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isFsInaccessible } from '../errors.js'
// 引入 formatFileSize，将 ../format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from '../format.js'
// 引入 expandTilde，将 ../permissions/pathValidation.js 中已经封装好的能力接到本文件流程里。
import { expandTilde } from '../permissions/pathValidation.js'

// PLUGINS_DIR 插件数据 命名 `'plugins'`，让后续代码直接表达这个值的用途。
const PLUGINS_DIR = 'plugins'
// COWORK_PLUGINS_DIR 插件数据固定为 `'cowork_plugins'`，作为插件工具 plugin Directories后续展示或比较的基准。
const COWORK_PLUGINS_DIR = 'cowork_plugins'

/**
 * Get the plugins directory name based on current mode.
 * Uses session state (from --cowork flag) or env var.
 *
 * Priority:
 * 1. Session state (set by CLI flag --cowork)
 * 2. Environment variable CLAUDE_CODE_USE_COWORK_PLUGINS
 * 3. Default: 'plugins'
 */
// getPluginsDirectoryName 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPluginsDirectoryName(): string {
  // Session state takes precedence (set by CLI flag)
  // 满足 `getUseCoworkPlugins()` 时，插件管理执行该分支。
  if (getUseCoworkPlugins()) {
    // 返回 `COWORK_PLUGINS_DIR`，作为插件管理这次计算的结果。
    return COWORK_PLUGINS_DIR
  }
  // Fall back to env var
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)` 时，插件管理执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)) {
    // 返回 `COWORK_PLUGINS_DIR`，作为插件管理这次计算的结果。
    return COWORK_PLUGINS_DIR
  }
  // 返回 `PLUGINS_DIR`，作为插件管理这次计算的结果。
  return PLUGINS_DIR
}

/**
 * Get the full path to the plugins directory.
 *
 * Priority:
 * 1. CLAUDE_CODE_PLUGIN_CACHE_DIR env var (explicit override)
 * 2. Default: ~/.claude/plugins or ~/.claude/cowork_plugins
 */
// getPluginsDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginsDirectory(): string {
  // expandTilde: when CLAUDE_CODE_PLUGIN_CACHE_DIR is set via settings.json
  // `env` (not shell), ~ is not expanded by the shell. Without this, a value
  // like "~/.claude/plugins" becomes a literal `~` directory created in the
  // cwd of every project (gh-30794 / CC-212).
  // envOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envOverride = process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR
  // 满足 `envOverride` 时，插件管理执行该分支。
  if (envOverride) {
    // 返回 `expandTilde(envOverride)`，作为插件管理这次计算的结果。
    return expandTilde(envOverride)
  }
  // 返回 `join(getClaudeConfigHomeDir(), getPluginsDirectoryName())`，作为插件管理这次计算的结果。
  return join(getClaudeConfigHomeDir(), getPluginsDirectoryName())
}

/**
 * Get the read-only plugin seed directories, if configured.
 *
 * Customers can pre-bake a populated plugins directory into their container
 * image and point CLAUDE_CODE_PLUGIN_SEED_DIR at it. CC will use it as a
 * read-only fallback layer under the primary plugins directory — marketplaces
 * and plugin caches found in the seed are used in place without re-cloning.
 *
 * Multiple seed directories can be layered using the platform path delimiter
 * (':' on Unix, ';' on Windows), in PATH-like precedence order — the first
 * seed that contains a given marketplace or plugin cache wins.
 *
 * Seed structure mirrors the primary plugins directory:
 *   $CLAUDE_CODE_PLUGIN_SEED_DIR/
 *     known_marketplaces.json
 *     marketplaces/<name>/...
 *     cache/<marketplace>/<plugin>/<version>/...
 *
 * @returns Absolute paths to seed dirs in precedence order (empty if unset)
 */
// getPluginSeedDirs 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginSeedDirs(): string[] {
  // Same tilde-expansion rationale as getPluginsDirectory (gh-30794).
  // 原始文本 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const raw = process.env.CLAUDE_CODE_PLUGIN_SEED_DIR
  // 原始文本缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!raw) return []
  // 返回 `raw.split(delimiter).filter(Boolean).map(expandTilde)`，作为插件管理这次计算的结果。
  return raw.split(delimiter).filter(Boolean).map(expandTilde)
}

// sanitizePluginId 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizePluginId(pluginId: string): string {
  // Same character class as the install-cache sanitizer (pluginLoader.ts)
  // 返回 `pluginId.replace(/[^a-zA-Z0-9\-_]/g, '-')`，作为插件管理这次计算的结果。
  return pluginId.replace(/[^a-zA-Z0-9\-_]/g, '-')
}

/** Pure path — no mkdir. For display (e.g. uninstall dialog). */
// pluginDataDirPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pluginDataDirPath(pluginId: string): string {
  // 返回 `join(getPluginsDirectory(), 'data', sanitizePluginId(pluginId))`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'data', sanitizePluginId(pluginId))
}

/**
 * Persistent per-plugin data directory, exposed to plugins as
 * ${CLAUDE_PLUGIN_DATA}. Unlike the version-scoped install cache
 * (${CLAUDE_PLUGIN_ROOT}, which is orphaned and GC'd on every update),
 * this survives plugin updates — only removed on last-scope uninstall.
 *
 * Creates the directory on call (mkdir). The *lazy* behavior is at the
 * substitutePluginVariables call site — the DATA pattern uses function-form
 * .replace() so this isn't invoked unless ${CLAUDE_PLUGIN_DATA} is present
 * (ROOT also uses function-form, but for $-pattern safety, not laziness).
 * Env-var export sites (MCP/LSP server env, hook env) call this eagerly
 * since subprocesses may expect the dir to exist before writing to it.
 *
 * Sync because it's called from substitutePluginVariables (sync, inside
 * String.replace) — making this async would cascade through 6 call sites
 * and their sync iteration loops. One mkdir in plugin-load path is cheap.
 */
// getPluginDataDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginDataDir(pluginId: string): string {
  // dir保存`pluginDataDirPath`，供插件管理后续处理使用。
  const dir = pluginDataDirPath(pluginId)
  // 调用 mkdirSync，触发插件管理此处需要的副作用。
  mkdirSync(dir, { recursive: true })
  // 返回 `dir`，作为插件管理这次计算的结果。
  return dir
}

/**
 * Size of the data dir for the uninstall confirmation prompt. Returns null
 * when the dir is absent or empty so callers can skip the prompt entirely.
 * Recursive walk — not hot-path (only on uninstall).
 */
// getPluginDataDirSize 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPluginDataDirSize(
  pluginId: string,
): Promise<{ bytes: number; human: string } | null> {
  // dir保存`pluginDataDirPath`，供插件管理后续处理使用。
  const dir = pluginDataDirPath(pluginId)
  // bytes 集合保存`0`，供插件工具 plugin Directories后续判断或输出使用。
  let bytes = 0
  // walk保存`async`，供插件管理后续处理使用。
  const walk = async (p: string) => {
    // 逐项读取 `await readdir(p, { withFileTypes: true })` 中的entry，按输入顺序推进插件管理。
    for (const entry of await readdir(p, { withFileTypes: true })) {
      // full格式化`join`，供插件管理后续处理使用。
      const full = join(p, entry.name)
      // 满足 `entry.isDirectory()` 时，插件管理执行该分支。
      if (entry.isDirectory()) {
        // 等待 `walk(full)` 完成，再继续插件工具 plugin Directories的异步流程。
        await walk(full)
      } else {
        // Per-entry catch: a broken symlink makes stat() throw ENOENT.
        // Without this, one broken link bubbles to the outer catch →
        // returns null → dialog skipped → data silently deleted.
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // 插件工具 plugin Directories在这里处理 `bytes += (await stat(full)).size`，完成这一小步状态转换。
          bytes += (await stat(full)).size
        } catch {
          // Broken symlink / raced delete — skip this entry, keep walking
        }
      }
    }
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `walk(dir)` 完成，再继续插件工具 plugin Directories的异步流程。
    await walk(dir)
  } catch (e) {
    // 满足 `isFsInaccessible(e)` 时，插件管理执行该分支。
    if (isFsInaccessible(e)) return null
    // 抛出 e，阻止插件管理在无效状态下继续运行。
    throw e
  }
  // 满足 `bytes === 0` 时，插件管理执行该分支。
  if (bytes === 0) return null
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { bytes, human: formatFileSize(bytes) }
}

/**
 * Best-effort cleanup on last-scope uninstall. Failure is logged but does
 * not throw — the uninstall itself already succeeded; we don't want a
 * cleanup side-effect surfacing as "uninstall failed". Same rationale as
 * deletePluginOptions (pluginOptionsStorage.ts).
 */
// deletePluginDataDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function deletePluginDataDir(pluginId: string): Promise<void> {
  // dir保存`pluginDataDirPath`，供插件管理后续处理使用。
  const dir = pluginDataDirPath(pluginId)
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(dir, { recursive: true, force: true })` 完成，再继续插件工具 plugin Directories的异步流程。
    await rm(dir, { recursive: true, force: true })
  } catch (e) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to delete plugin data dir ${dir}: ${errorMessage(e)}`,
      { level: 'warn' },
    )
  }
}
