/**
 * Plugin Zip Cache Module
 *
 * Manages plugins as ZIP archives in a mounted directory (e.g., Filestore).
 * When CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE is enabled and CLAUDE_CODE_PLUGIN_CACHE_DIR
 * is set, plugins are stored as ZIPs in that directory and extracted to a
 * session-local temp directory at startup.
 *
 * Limitations:
 * - Only headless mode is supported
 * - All settings sources are used (same as normal plugin flow)
 * - Only github, git, and url marketplace sources are supported
 * - Only strict:true marketplace entries are supported
 * - Auto-update is non-blocking (background, does not affect current session)
 *
 * Directory structure of the zip cache:
 * /mnt/plugins-cache/
 *   ├── known_marketplaces.json
 *   ├── installed_plugins.json
 *   ├── marketplaces/
 *   │   ├── official-marketplace.json
 *   │   └── company-marketplace.json
 *   └── plugins/
 *       ├── official-marketplace/
 *       │   └── plugin-a/
 *       │       └── 1.0.0.zip
 *       └── company-marketplace/
 *           └── plugin-b/
 *               └── 2.1.3.zip
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  chmod,
  lstat,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'fs/promises'
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 parseZipModes、unzipFile，将 ../dxt/zip.js 中已经封装好的能力接到本文件流程里。
import { parseZipModes, unzipFile } from '../dxt/zip.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 expandTilde，将 ../permissions/pathValidation.js 中已经封装好的能力接到本文件流程里。
import { expandTilde } from '../permissions/pathValidation.js'
// 类型依赖 { MarketplaceSource } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { MarketplaceSource } from './schemas.js'

/**
 * Check if the plugin zip cache mode is enabled.
 */
// isPluginZipCacheEnabled 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginZipCacheEnabled(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE)`，作为插件管理这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE)
}

/**
 * Get the path to the zip cache directory.
 * Requires CLAUDE_CODE_PLUGIN_CACHE_DIR to be set.
 * Returns undefined if zip cache is not enabled.
 */
// getPluginZipCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginZipCachePath(): string | undefined {
  // 满足 `!isPluginZipCacheEnabled()` 时，插件管理执行该分支。
  if (!isPluginZipCacheEnabled()) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }
  // dir 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const dir = process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR
  // 返回 `dir ? expandTilde(dir) : undefined`，作为插件管理这次计算的结果。
  return dir ? expandTilde(dir) : undefined
}

/**
 * Get the path to known_marketplaces.json in the zip cache.
 */
// getZipCacheKnownMarketplacesPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getZipCacheKnownMarketplacesPath(): string {
  // cachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginZipCachePath()
  // cachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!cachePath) {
    // 抛出 new Error('Plugin zip cache is not enabled')，阻止插件管理在无效状态下继续运行。
    throw new Error('Plugin zip cache is not enabled')
  }
  // 返回 `join(cachePath, 'known_marketplaces.json')`，作为插件管理这次计算的结果。
  return join(cachePath, 'known_marketplaces.json')
}

/**
 * Get the path to installed_plugins.json in the zip cache.
 */
// getZipCacheInstalledPluginsPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getZipCacheInstalledPluginsPath(): string {
  // cachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginZipCachePath()
  // cachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!cachePath) {
    // 抛出 new Error('Plugin zip cache is not enabled')，阻止插件管理在无效状态下继续运行。
    throw new Error('Plugin zip cache is not enabled')
  }
  // 返回 `join(cachePath, 'installed_plugins.json')`，作为插件管理这次计算的结果。
  return join(cachePath, 'installed_plugins.json')
}

/**
 * Get the marketplaces directory within the zip cache.
 */
// getZipCacheMarketplacesDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getZipCacheMarketplacesDir(): string {
  // cachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginZipCachePath()
  // cachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!cachePath) {
    // 抛出 new Error('Plugin zip cache is not enabled')，阻止插件管理在无效状态下继续运行。
    throw new Error('Plugin zip cache is not enabled')
  }
  // 返回 `join(cachePath, 'marketplaces')`，作为插件管理这次计算的结果。
  return join(cachePath, 'marketplaces')
}

/**
 * Get the plugins directory within the zip cache.
 */
// getZipCachePluginsDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getZipCachePluginsDir(): string {
  // cachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginZipCachePath()
  // cachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!cachePath) {
    // 抛出 new Error('Plugin zip cache is not enabled')，阻止插件管理在无效状态下继续运行。
    throw new Error('Plugin zip cache is not enabled')
  }
  // 返回 `join(cachePath, 'plugins')`，作为插件管理这次计算的结果。
  return join(cachePath, 'plugins')
}

// Session plugin cache: a temp directory on local disk (NOT in the mounted zip cache)
// that holds extracted plugins for the duration of the session.
// sessionPluginCachePath 插件数据初始化为空值，后续分支会在有数据时补齐。
let sessionPluginCachePath: string | null = null
// sessionPluginCachePromise 异步任务初始化为空值，后续分支会在有数据时补齐。
let sessionPluginCachePromise: Promise<string> | null = null

/**
 * Get or create the session plugin cache directory.
 * This is a temp directory on local disk where plugins are extracted for the session.
 */
// getSessionPluginCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionPluginCachePath(): Promise<string> {
  // 满足 `sessionPluginCachePath` 时，插件管理执行该分支。
  if (sessionPluginCachePath) {
    // 返回 `sessionPluginCachePath`，作为插件管理这次计算的结果。
    return sessionPluginCachePath
  }
  // sessionPluginCachePromise 异步任务缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!sessionPluginCachePromise) {
    // sessionPluginCachePromise 异步任务更新为 `(async () => {`，确保插件工具后续读取最新状态。
    sessionPluginCachePromise = (async () => {
      // suffix保存`randomBytes`，供插件管理后续处理使用。
      const suffix = randomBytes(8).toString('hex')
      // dir格式化`join`，供插件管理后续处理使用。
      const dir = join(tmpdir(), `claude-plugin-session-${suffix}`)
      // 等待 `getFsImplementation().mkdir(dir)` 完成，再继续插件工具 zip Cache的异步流程。
      await getFsImplementation().mkdir(dir)
      // sessionPluginCachePath 插件数据更新为 `dir`，确保插件工具后续读取最新状态。
      sessionPluginCachePath = dir
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Created session plugin cache at ${dir}`)
      // 返回 `dir`，作为插件管理这次计算的结果。
      return dir
    })()
  }
  // 返回 `sessionPluginCachePromise`，作为插件管理这次计算的结果。
  return sessionPluginCachePromise
}

/**
 * Clean up the session plugin cache directory.
 * Should be called when the session ends.
 */
// cleanupSessionPluginCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupSessionPluginCache(): Promise<void> {
  // sessionPluginCachePath 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!sessionPluginCachePath) {
    // 插件工具 zip Cache在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(sessionPluginCachePath, { recursive: true, force: true })` 完成，再继续插件工具 zip Cache的异步流程。
    await rm(sessionPluginCachePath, { recursive: true, force: true })
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cleaned up session plugin cache at ${sessionPluginCachePath}`,
    )
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to clean up session plugin cache: ${error}`)
  } finally {
    // sessionPluginCachePath 插件数据更新为 `null`，确保插件工具后续读取最新状态。
    sessionPluginCachePath = null
    // sessionPluginCachePromise 异步任务更新为 `null`，确保插件工具后续读取最新状态。
    sessionPluginCachePromise = null
  }
}

/**
 * Reset the session plugin cache path (for testing).
 */
// resetSessionPluginCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSessionPluginCache(): void {
  // sessionPluginCachePath 插件数据更新为 `null`，确保插件工具后续读取最新状态。
  sessionPluginCachePath = null
  // sessionPluginCachePromise 异步任务更新为 `null`，确保插件工具后续读取最新状态。
  sessionPluginCachePromise = null
}

/**
 * Write data to a file in the zip cache atomically.
 * Writes to a temp file in the same directory, then renames.
 */
// atomicWriteToZipCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function atomicWriteToZipCache(
  targetPath: string,
  data: string | Uint8Array,
): Promise<void> {
  // dir保存`dirname`，供插件管理后续处理使用。
  const dir = dirname(targetPath)
  // 等待 `getFsImplementation().mkdir(dir)` 完成，再继续插件工具 zip Cache的异步流程。
  await getFsImplementation().mkdir(dir)

  // tmpName保存`basename`，供插件管理后续处理使用。
  const tmpName = `.${basename(targetPath)}.tmp.${randomBytes(4).toString('hex')}`
  // tmpPath 路径数据格式化`join`，供插件管理后续处理使用。
  const tmpPath = join(dir, tmpName)

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 当 `typeof data` 匹配 `'string'` 时，插件管理执行对应分支。
    if (typeof data === 'string') {
      // 等待 `writeFile(tmpPath, data, { encoding: 'utf-8' })` 完成，再继续插件工具 zip Cache的异步流程。
      await writeFile(tmpPath, data, { encoding: 'utf-8' })
    } else {
      // 等待 `writeFile(tmpPath, data)` 完成，再继续插件工具 zip Cache的异步流程。
      await writeFile(tmpPath, data)
    }
    // 等待 `rename(tmpPath, targetPath)` 完成，再继续插件工具 zip Cache的异步流程。
    await rename(tmpPath, targetPath)
  } catch (error) {
    // Clean up tmp file on failure
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `rm(tmpPath, { force: true })` 完成，再继续插件工具 zip Cache的异步流程。
      await rm(tmpPath, { force: true })
    } catch {
      // ignore cleanup errors
    }
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }
}

// fflate's ZippableFile tuple form: [data, opts]. Using the tuple lets us
// store {os, attrs} so parseZipModes can recover exec bits on extraction.
// ZipEntry 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type ZipEntry = [Uint8Array, { os: number; attrs: number }]

/**
 * Create a ZIP archive from a directory.
 * Resolves symlinks to actual file contents (replaces symlinks with real data).
 * Stores Unix mode bits in external_attr so extractZipToDirectory can restore
 * +x — otherwise the round-trip (git clone → zip → extract) loses exec bits.
 *
 * @param sourceDir - Directory to zip
 * @returns ZIP file as Uint8Array
 */
// createZipFromDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createZipFromDirectory(
  sourceDir: string,
): Promise<Uint8Array> {
  // files 文件数据 从空对象开始收集键值，后续按名称补齐内容。
  const files: Record<string, ZipEntry> = {}
  // visited构建`new Set<string>()`，供后续判断或组装使用。
  const visited = new Set<string>()
  // 等待 `collectFilesForZip(sourceDir, '', files, visited)` 完成，再继续插件工具 zip Cache的异步流程。
  await collectFilesForZip(sourceDir, '', files, visited)

  // 从 `await import('fflate')` 解构 zipSync，减少插件工具 zip Cache对同一对象的重复访问。
  const { zipSync } = await import('fflate')
  // zipData保存`zipSync`，供插件管理后续处理使用。
  const zipData = zipSync(files, { level: 6 })
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Created ZIP from ${sourceDir}: ${Object.keys(files).length} files, ${zipData.length} bytes`,
  )
  // 返回 `zipData`，作为插件管理这次计算的结果。
  return zipData
}

/**
 * Recursively collect files from a directory for zipping.
 * Uses lstat to detect symlinks and tracks visited inodes for cycle detection.
 */
// collectFilesForZip 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function collectFilesForZip(
  baseDir: string,
  relativePath: string,
  files: Record<string, ZipEntry>,
  visited: Set<string>,
): Promise<void> {
  // currentDir格式化`join`，供插件管理后续处理使用。
  const currentDir = relativePath ? join(baseDir, relativePath) : baseDir
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: string[]
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(currentDir)`，确保插件工具后续读取最新状态。
    entries = await readdir(currentDir)
  } catch {
    // 插件工具 zip Cache在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Track visited directories by dev+ino to detect symlink cycles.
  // bigint: true is required — on Windows NTFS, the file index packs a 16-bit
  // sequence number into the high bits. Once that sequence exceeds ~32 (very
  // common on a busy CI runner that churns through temp files), the value
  // exceeds Number.MAX_SAFE_INTEGER and two adjacent directories round to the
  // same JS number, causing subdirs to be silently skipped as "cycles". This
  // broke the round-trip test on Windows CI when sharding shuffled which tests
  // ran first and pushed MFT sequence numbers over the precision cliff.
  // See also: markdownConfigLoader.ts getFileIdentity, anthropics/claude-code#13893
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // dirStat保存`stat`，供插件管理后续处理使用。
    const dirStat = await stat(currentDir, { bigint: true })
    // ReFS (Dev Drive), NFS, some FUSE mounts report dev=0 and ino=0 for
    // everything. Fail open: skip cycle detection rather than skip the
    // directory. We already skip symlinked directories unconditionally below,
    // so the only cycle left here is a bind mount, which we accept.
    // `dirStat.dev` 与 `0n || dirStat.ino !== 0n` 不一致时刷新派生状态，避免使用过期结果。
    if (dirStat.dev !== 0n || dirStat.ino !== 0n) {
      // key 命名 ``${dirStat.dev}:${dirStat.ino}``，让后续代码直接表达这个值的用途。
      const key = `${dirStat.dev}:${dirStat.ino}`
      // 满足 `visited.has(key)` 时，插件管理执行该分支。
      if (visited.has(key)) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Skipping symlink cycle at ${currentDir}`)
        // 插件工具 zip Cache在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 visited.add，触发插件管理此处需要的副作用。
      visited.add(key)
    }
  } catch {
    // 插件工具 zip Cache在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 按顺序遍历 `entries` 中的entry，逐个交给插件管理处理。
  for (const entry of entries) {
    // Skip hidden files that are git-related
    // 当 `entry` 匹配 `'.git'` 时，插件管理执行对应分支。
    if (entry === '.git') {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
    const fullPath = join(currentDir, entry)
    // relPath 路径数据保存`relativePath ? `${relativePath}/${entry}` : entry`，供后续判断或组装使用。
    const relPath = relativePath ? `${relativePath}/${entry}` : entry

    // fileStat 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let fileStat
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // fileStat 文件数据更新为 `await lstat(fullPath)`，确保插件工具后续读取最新状态。
      fileStat = await lstat(fullPath)
    } catch {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Skip symlinked directories (follow symlinked files)
    // 满足 `fileStat.isSymbolicLink()` 时，插件管理执行该分支。
    if (fileStat.isSymbolicLink()) {
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // targetStat保存`stat`，供插件管理后续处理使用。
        const targetStat = await stat(fullPath)
        // 满足 `targetStat.isDirectory()` 时，插件管理执行该分支。
        if (targetStat.isDirectory()) {
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }
        // Symlinked file — read its contents below
        // fileStat 文件数据更新为 `targetStat`，确保插件工具后续读取最新状态。
        fileStat = targetStat
      } catch {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue // broken symlink
      }
    }

    // 满足 `fileStat.isDirectory()` 时，插件管理执行该分支。
    if (fileStat.isDirectory()) {
      // 等待 `collectFilesForZip(baseDir, relPath, files, visited)` 完成，再继续插件工具 zip Cache的异步流程。
      await collectFilesForZip(baseDir, relPath, files, visited)
    // 插件工具 zip Cache在这里处理 `} else if (fileStat.isFile()) {`，完成这一小步状态转换。
    } else if (fileStat.isFile()) {
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供插件管理后续处理使用。
        const content = await readFile(fullPath)
        // os=3 (Unix) + st_mode in high 16 bits of external_attr — this is
        // what parseZipModes reads back on extraction. fileStat is already
        // in hand from the lstat/stat above, so no extra syscall.
        // files[relPath 路径数据更新为 `[`，确保插件工具 zip Cache后续读取最新状态。
        files[relPath] = [
          new Uint8Array(content),
          { os: 3, attrs: (fileStat.mode & 0xffff) << 16 },
        ]
      } catch (error) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to read file for zip: ${relPath}: ${error}`)
      }
    }
  }
}

/**
 * Extract a ZIP file to a target directory.
 *
 * @param zipPath - Path to the ZIP file
 * @param targetDir - Directory to extract into
 */
// extractZipToDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function extractZipToDirectory(
  zipPath: string,
  targetDir: string,
): Promise<void> {
  // zipBuf读取`getFsImplementation`，供插件管理后续处理使用。
  const zipBuf = await getFsImplementation().readFileBytes(zipPath)
  // files 文件数据保存`unzipFile`，供插件管理后续处理使用。
  const files = await unzipFile(zipBuf)
  // fflate doesn't surface external_attr — parse the central directory so
  // exec bits survive extraction (hooks/scripts need +x to run via `sh -c`).
  // modes 集合解析`parseZipModes`，供插件管理后续处理使用。
  const modes = parseZipModes(zipBuf)

  // 等待 `getFsImplementation().mkdir(targetDir)` 完成，再继续插件工具 zip Cache的异步流程。
  await getFsImplementation().mkdir(targetDir)

  // 循环处理 `const [relPath, data] of Object.entries(files)`，让插件管理把同类条目按顺序走完。
  for (const [relPath, data] of Object.entries(files)) {
    // Skip directory entries (trailing slash)
    // 满足 `relPath.endsWith('/')` 时，插件管理执行该分支。
    if (relPath.endsWith('/')) {
      // 等待 `getFsImplementation().mkdir(join(targetDir, relPath))` 完成，再继续插件工具 zip Cache的异步流程。
      await getFsImplementation().mkdir(join(targetDir, relPath))
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
    const fullPath = join(targetDir, relPath)
    // 等待 `getFsImplementation().mkdir(dirname(fullPath))` 完成，再继续插件工具 zip Cache的异步流程。
    await getFsImplementation().mkdir(dirname(fullPath))
    // 等待 `writeFile(fullPath, data)` 完成，再继续插件工具 zip Cache的异步流程。
    await writeFile(fullPath, data)
    // mode 命名 `modes[relPath]`，让后续代码直接表达这个值的用途。
    const mode = modes[relPath]
    // 只有 `mode && mode & 0o111` 满足时，插件管理才执行该分支。
    if (mode && mode & 0o111) {
      // Swallow EPERM/ENOTSUP (NFS root_squash, some FUSE mounts) — losing +x
      // is the pre-PR behavior and better than aborting mid-extraction.
      // 这个回调绑定到 await chmod(fullPath, mode & 0o777).catch(() => {})，负责插件管理在该局部场景下的响应。
      await chmod(fullPath, mode & 0o777).catch(() => {})
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Extracted ZIP to ${targetDir}: ${Object.keys(files).length} entries`,
  )
}

/**
 * Convert a plugin directory to a ZIP in-place: zip → atomic write → delete dir.
 * Both call sites (cacheAndRegisterPlugin, copyPluginToVersionedCache) need the
 * same sequence; getting it wrong (non-atomic write, forgetting rm) corrupts cache.
 */
// convertDirectoryToZipInPlace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function convertDirectoryToZipInPlace(
  dirPath: string,
  zipPath: string,
): Promise<void> {
  // zipData构建`createZipFromDirectory`，供插件管理后续处理使用。
  const zipData = await createZipFromDirectory(dirPath)
  // 等待 `atomicWriteToZipCache(zipPath, zipData)` 完成，再继续插件工具 zip Cache的异步流程。
  await atomicWriteToZipCache(zipPath, zipData)
  // 等待 `rm(dirPath, { recursive: true, force: true })` 完成，再继续插件工具 zip Cache的异步流程。
  await rm(dirPath, { recursive: true, force: true })
}

/**
 * Get the relative path for a marketplace JSON file within the zip cache.
 * Format: marketplaces/{marketplace-name}.json
 */
// getMarketplaceJsonRelativePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMarketplaceJsonRelativePath(
  marketplaceName: string,
): string {
  // sanitized格式化`marketplaceName.replace`，供插件管理后续处理使用。
  const sanitized = marketplaceName.replace(/[^a-zA-Z0-9\-_]/g, '-')
  // 返回 `join('marketplaces', `${sanitized}.json`)`，作为插件管理这次计算的结果。
  return join('marketplaces', `${sanitized}.json`)
}

/**
 * Check if a marketplace source type is supported by zip cache mode.
 *
 * Supported sources write to `join(cacheDir, name)` — syncMarketplacesToZipCache
 * reads marketplace.json from that installLocation, source-type-agnostic.
 * - github/git/url: clone to temp, rename into cacheDir
 * - settings: write synthetic marketplace.json directly to cacheDir (no fetch)
 *
 * Excluded: file/directory (installLocation is the user's path OUTSIDE cacheDir —
 * nonsensical in ephemeral containers), npm (node_modules bloat on Filestore mount).
 */
// isMarketplaceSourceSupportedByZipCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMarketplaceSourceSupportedByZipCache(
  source: MarketplaceSource,
): boolean {
  // 返回列表结果，保留插件管理已经排好的条目顺序。
  return ['github', 'git', 'url', 'settings'].includes(source.source)
}
