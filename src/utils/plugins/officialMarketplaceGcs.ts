/**
 * inc-5046: fetch the official marketplace from a GCS mirror instead of
 * git-cloning GitHub on every startup.
 *
 * Backend (anthropic#317037) publishes a marketplace-only zip alongside the
 * titanium squashfs, keyed by base repo SHA. This module fetches the `latest`
 * pointer, compares against a local sentinel, and downloads+extracts the zip
 * when there's a new SHA. Callers decide fallback behavior on failure.
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, resolve, sep } from 'path'
// 引入 waitForScrollIdle，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { waitForScrollIdle } from '../../bootstrap/state.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/index.js，用于校准插件管理的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 parseZipModes、unzipFile，将 ../dxt/zip.js 中已经封装好的能力接到本文件流程里。
import { parseZipModes, unzipFile } from '../dxt/zip.js'
// 引入 errorMessage、getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from '../errors.js'

// SafeString 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type SafeString = AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS

// CDN-fronted domain for the public GCS bucket (same bucket the native
// binary ships from — nativeInstaller/download.ts:24 uses the raw GCS URL).
// `{sha}.zip` is content-addressed so CDN can cache it indefinitely;
// `latest` has Cache-Control: max-age=300 so CDN staleness is bounded.
// Backend (anthropic#317037) populates this prefix.
// GCS_BASE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const GCS_BASE =
  'https://downloads.claude.ai/claude-code-releases/plugins/claude-plugins-official'

// Zip arc paths are seed-dir-relative (marketplaces/claude-plugins-official/…)
// so the titanium seed machinery can use the same zip. Strip this prefix when
// extracting for a laptop install.
// ARC_PREFIX保存`'marketplaces/claude-plugins-official/'`，作为后续固定文本处理的输入。
const ARC_PREFIX = 'marketplaces/claude-plugins-official/'

/**
 * Fetch the official marketplace from GCS and extract to installLocation.
 * Idempotent — checks a `.gcs-sha` sentinel before downloading the ~3.5MB zip.
 *
 * @param installLocation where to extract (must be inside marketplacesCacheDir)
 * @param marketplacesCacheDir the plugins marketplace cache root — passed in
 *   by callers (rather than imported from pluginDirectories) to break a
 *   circular-dep edge through marketplaceManager
 * @returns the fetched SHA on success (including no-op), null on any failure
 *   (network, 404, zip parse). Caller decides whether to fall through to git.
 */
// fetchOfficialMarketplaceFromGcs 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchOfficialMarketplaceFromGcs(
  installLocation: string,
  marketplacesCacheDir: string,
): Promise<string | null> {
  // Defense in depth: this function does `rm(installLocation, {recursive})`
  // during the atomic swap. A corrupted known_marketplaces.json (gh-32793 —
  // Windows path read on WSL, literal tilde, manual edit) could point at the
  // user's project. Refuse any path outside the marketplaces cache dir.
  // Same guard as refreshMarketplace() at marketplaceManager.ts:~2392 but
  // inside the function so ALL callers are covered.
  // cacheDir 缓存读取`resolve`，供插件管理后续处理使用。
  const cacheDir = resolve(marketplacesCacheDir)
  // resolvedLoc读取`resolve`，供插件管理后续处理使用。
  const resolvedLoc = resolve(installLocation)
  // `resolvedLoc` 与 `cacheDir && !resolvedLoc.starts...` 不一致时刷新派生状态，避免使用过期结果。
  if (resolvedLoc !== cacheDir && !resolvedLoc.startsWith(cacheDir + sep)) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `fetchOfficialMarketplaceFromGcs: refusing path outside cache dir: ${installLocation}`,
      { level: 'error' },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // Network + zip extraction competes for the event loop with scroll frames.
  // This is a fire-and-forget startup call — delaying by a few hundred ms
  // until scroll settles is invisible to the user.
  // 等待 `waitForScrollIdle()` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
  await waitForScrollIdle()

  // start记录时间`performance.now`，供插件管理后续处理使用。
  const start = performance.now()
  // outcome 命名 `'failed'`，让后续代码直接表达这个值的用途。
  let outcome: 'noop' | 'updated' | 'failed' = 'failed'
  // sha 先占位，稍后的条件分支会根据实际输入补齐它。
  let sha: string | undefined
  // bytes 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let bytes: number | undefined
  // errKind 先占位，稍后的条件分支会根据实际输入补齐它。
  let errKind: string | undefined

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 1. Latest pointer — ~40 bytes, backend sets Cache-Control: no-cache,
    //    max-age=300. Cheap enough to hit every startup.
    // latest读取`axios.get`，供插件管理后续处理使用。
    const latest = await axios.get(`${GCS_BASE}/latest`, {
      responseType: 'text',
      timeout: 10_000,
    })
    // sha更新为 `String(latest.data).trim()`，确保插件工具后续读取最新状态。
    sha = String(latest.data).trim()
    // sha缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!sha) {
      // Empty /latest body — backend misconfigured. Bail (null), don't
      // lock into a permanently-broken empty-sentinel state.
      // 抛出 new Error('latest pointer returned empty body')，阻止插件管理在无效状态下继续运行。
      throw new Error('latest pointer returned empty body')
    }

    // 2. Sentinel check — `.gcs-sha` at the install root holds the last
    //    extracted SHA. Matching means we already have this content.
    // sentinelPath 路径数据格式化`join`，供插件管理后续处理使用。
    const sentinelPath = join(installLocation, '.gcs-sha')
    // currentSha读取`readFile`，供插件管理后续处理使用。
    const currentSha = await readFile(sentinelPath, 'utf8').then(
      // s 集合更新为 `> s.trim()`，确保插件工具后续读取最新状态。
      s => s.trim(),
      // 这个回调绑定到 () => null, // ENOENT — first fetch, proceed to download，负责插件管理在该局部场景下的响应。
      () => null, // ENOENT — first fetch, proceed to download
    )
    // 满足 `currentSha === sha` 时，插件管理执行该分支。
    if (currentSha === sha) {
      // outcome更新为 `'noop'`，确保插件工具后续读取最新状态。
      outcome = 'noop'
      // 返回 `sha`，作为插件管理这次计算的结果。
      return sha
    }

    // 3. Download zip and extract to a staging dir, then atomic-swap into
    //    place. Crash mid-extract leaves a .staging dir (next run rm's it)
    //    rather than a half-written installLocation.
    // zipResp读取`axios.get`，供插件管理后续处理使用。
    const zipResp = await axios.get(`${GCS_BASE}/${sha}.zip`, {
      responseType: 'arraybuffer',
      timeout: 60_000,
    })
    // zipBuf保存`Buffer.from`，供插件管理后续处理使用。
    const zipBuf = Buffer.from(zipResp.data)
    // bytes 集合更新为 `zipBuf.length`，确保插件工具后续读取最新状态。
    bytes = zipBuf.length
    // files 文件数据保存`unzipFile`，供插件管理后续处理使用。
    const files = await unzipFile(zipBuf)
    // fflate doesn't surface external_attr, so parse the central directory
    // ourselves to recover exec bits. Without this, hooks/scripts extract as
    // 0644 and `sh -c "/path/script.sh"` (hooks.ts:~1002) fails with EACCES
    // on Unix. Git-clone preserves +x natively; this keeps GCS at parity.
    // modes 集合解析`parseZipModes`，供插件管理后续处理使用。
    const modes = parseZipModes(zipBuf)

    // staging固定为 ``${installLocation}.staging``，作为插件工具 official Marketplace Gcs后续展示或比较的基准。
    const staging = `${installLocation}.staging`
    // 等待 `rm(staging, { recursive: true, force: true })` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
    await rm(staging, { recursive: true, force: true })
    // 等待 `mkdir(staging, { recursive: true })` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
    await mkdir(staging, { recursive: true })
    // 循环处理 `const [arcPath, data] of Object.entries(files)`，让插件管理把同类条目按顺序走完。
    for (const [arcPath, data] of Object.entries(files)) {
      // 满足 `!arcPath.startsWith(ARC_PREFIX)` 时，插件管理执行该分支。
      if (!arcPath.startsWith(ARC_PREFIX)) continue
      // rel格式化`arcPath.slice`，供插件管理后续处理使用。
      const rel = arcPath.slice(ARC_PREFIX.length)
      // 只有 `!rel || rel.endsWith('/')` 满足时，插件管理才执行该分支。
      if (!rel || rel.endsWith('/')) continue // prefix dir entry or subdir entry
      // dest格式化`join`，供插件管理后续处理使用。
      const dest = join(staging, rel)
      // 等待 `mkdir(dirname(dest), { recursive: true })` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
      await mkdir(dirname(dest), { recursive: true })
      // 等待 `writeFile(dest, data)` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
      await writeFile(dest, data)
      // mode读取 `modes[arcPath]` 对应条目，后续围绕该成员继续处理。
      const mode = modes[arcPath]
      // 只有 `mode && mode & 0o111` 满足时，插件管理才执行该分支。
      if (mode && mode & 0o111) {
        // Only chmod when an exec bit is set — skip plain files to save syscalls.
        // Swallow EPERM/ENOTSUP (NFS root_squash, some FUSE mounts) — losing +x
        // is the pre-PR behavior and better than aborting mid-extraction.
        // 这个回调绑定到 await chmod(dest, mode & 0o777).catch(() => {})，负责插件管理在该局部场景下的响应。
        await chmod(dest, mode & 0o777).catch(() => {})
      }
    }
    // 等待 `writeFile(join(staging, '.gcs-sha'), sha)` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
    await writeFile(join(staging, '.gcs-sha'), sha)

    // Atomic swap: rm old, rename staging. Brief window where installLocation
    // doesn't exist — acceptable for a background refresh (caller retries next
    // startup if it crashes here).
    // 等待 `rm(installLocation, { recursive: true, force: true })` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
    await rm(installLocation, { recursive: true, force: true })
    // 等待 `rename(staging, installLocation)` 完成，再继续插件工具 official Marketplace Gcs的异步流程。
    await rename(staging, installLocation)

    // outcome更新为 `'updated'`，确保插件工具后续读取最新状态。
    outcome = 'updated'
    // 返回 `sha`，作为插件管理这次计算的结果。
    return sha
  } catch (e) {
    // errKind更新为 `classifyGcsError(e)`，确保插件工具后续读取最新状态。
    errKind = classifyGcsError(e)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Official marketplace GCS fetch failed: ${errorMessage(e)}`,
      { level: 'warn' },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  } finally {
    // tengu_plugin_remote_fetch schema shared with the telemetry PR
    // (.daisy/inc-5046/index.md) — adds source:'marketplace_gcs'. All string
    // values below are static enums or a git SHA — not code/filepaths/PII.
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_remote_fetch', {
      source: 'marketplace_gcs' as SafeString,
      host: 'downloads.claude.ai' as SafeString,
      is_official: true,
      outcome: outcome as SafeString,
      duration_ms: Math.round(performance.now() - start),
      ...(bytes !== undefined && { bytes }),
      ...(sha && { sha: sha as SafeString }),
      ...(errKind && { error_kind: errKind as SafeString }),
    })
  }
}

// Bounded set of errno codes we report by name. Anything else buckets as
// fs_other to keep dashboard cardinality tractable.
// KNOWN_FS_CODES 集合保存`Set`，供插件管理后续处理使用。
const KNOWN_FS_CODES = new Set([
  'ENOSPC',
  'EACCES',
  'EPERM',
  'EXDEV',
  'EBUSY',
  'ENOENT',
  'ENOTDIR',
  'EROFS',
  'EMFILE',
  'ENAMETOOLONG',
])

/**
 * Classify a GCS fetch error into a stable telemetry bucket.
 *
 * Telemetry from v2.1.83+ showed 50% of failures landing in 'other' — and
 * 99.99% of those had both sha+bytes set, meaning download succeeded but
 * extraction/fs failed. This splits that bucket so we can see whether the
 * failures are fixable (wrong staging dir, cross-device rename) or inherent
 * (disk full, permission denied) before flipping the git-fallback kill switch.
 */
// classifyGcsError 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyGcsError(e: unknown): string {
  // 满足 `axios.isAxiosError(e)` 时，插件管理执行该分支。
  if (axios.isAxiosError(e)) {
    // 当 `e.code` 匹配 `'ECONNABORTED'` 时，插件管理执行对应分支。
    if (e.code === 'ECONNABORTED') return 'timeout'
    // 满足 `e.response` 时，插件管理执行该分支。
    if (e.response) return `http_${e.response.status}`
    // 返回 `'network'`，作为插件管理这次计算的结果。
    return 'network'
  }
  // code读取`getErrnoCode`，供插件管理后续处理使用。
  const code = getErrnoCode(e)
  // Node fs errno codes are E<UPPERCASE> (ENOSPC, EACCES). Axios also sets
  // .code (ERR_NETWORK, ERR_BAD_OPTION, EPROTO) — don't bucket those as fs.
  // 只有 `code && /^E[A-Z]+$/.test(code) && !code.startsWith('ERR_')` 满足时，插件管理才执行该分支。
  if (code && /^E[A-Z]+$/.test(code) && !code.startsWith('ERR_')) {
    // 返回 `KNOWN_FS_CODES.has(code) ? `fs_${code}` : 'fs_other'`，作为插件管理这次计算的结果。
    return KNOWN_FS_CODES.has(code) ? `fs_${code}` : 'fs_other'
  }
  // fflate sets numeric .code (0-14) on inflate/unzip errors — catches
  // deflate-level corruption ("unexpected EOF", "invalid block type") that
  // the message regex misses.
  // 当 `typeof (e as { code?: unknown })?.code` 匹配 `'number'` 时，插件管理执行对应分支。
  if (typeof (e as { code?: unknown })?.code === 'number') return 'zip_parse'
  // 消息保存`errorMessage`，供插件管理后续处理使用。
  const msg = errorMessage(e)
  // 满足 `/unzip|invalid zip|central directory/i.test(msg)` 时，插件管理执行该分支。
  if (/unzip|invalid zip|central directory/i.test(msg)) return 'zip_parse'
  // 满足 `/empty body/.test(msg)` 时，插件管理执行该分支。
  if (/empty body/.test(msg)) return 'empty_latest'
  // 返回 `'other'`，作为插件管理这次计算的结果。
  return 'other'
}
