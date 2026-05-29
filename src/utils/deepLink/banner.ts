/**
 * Deep Link Origin Banner
 *
 * Builds the warning text shown when a session was opened by an external
 * claude-cli:// deep link. Linux xdg-open and browsers with "always allow"
 * set dispatch the link with no OS-level confirmation, so the application
 * provides its own provenance signal — mirroring claude.ai's security
 * interstitial for external-source prefills.
 *
 * The user must press Enter to submit; this banner primes them to read the
 * prompt (which may use homoglyphs or padding to hide instructions) and
 * notice which directory — and therefore which CLAUDE.md — was loaded.
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, sep } from 'path'
// 引入 formatNumber、formatRelativeTimeAgo，将 ../format.js 中已经封装好的能力接到本文件流程里。
import { formatNumber, formatRelativeTimeAgo } from '../format.js'
// 引入 getCommonDir，将 ../git/gitFilesystem.js 中已经封装好的能力接到本文件流程里。
import { getCommonDir } from '../git/gitFilesystem.js'
// 引入 getGitDir，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { getGitDir } from '../git.js'

// STALE_FETCH_WARN_MS 集合保存`7 * 24 * 60 * 60 * 1000`，供共享工具 banner后续判断或输出使用。
const STALE_FETCH_WARN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Above this length, a pre-filled prompt no longer fits on one screen
 * (~12-15 lines on an 80-col terminal). The banner switches from "review
 * carefully" to an explicit "scroll to review the entire prompt" so a
 * malicious tail buried past line 60 isn't silently off-screen.
 */
// LONG_PREFILL_THRESHOLD 命名 `1000`，让后续代码直接表达这个值的用途。
const LONG_PREFILL_THRESHOLD = 1000

// DeepLinkBannerInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeepLinkBannerInfo = {
  /** Resolved working directory the session launched in. */
  cwd: string
  /** Length of the ?q= prompt pre-filled in the input box. Undefined = no prefill. */
  prefillLength?: number
  /** The ?repo= slug if the cwd was resolved from the githubRepoPaths MRU. */
  repo?: string
  /** Last-fetch timestamp for the repo (FETCH_HEAD mtime). Undefined = never fetched or not a git repo. */
  lastFetch?: Date
}

/**
 * Build the multi-line warning banner for a deep-link-originated session.
 *
 * Always shows the working directory so the user can see which CLAUDE.md
 * will load. When the link pre-filled a prompt, adds a second line prompting
 * the user to review it — the prompt itself is visible in the input box.
 *
 * When the cwd was resolved from a ?repo= slug, also shows the slug and the
 * clone's last-fetch age so the user knows which local clone was selected
 * and whether its CLAUDE.md may be stale relative to upstream.
 */
// buildDeepLinkBanner 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildDeepLinkBanner(info: DeepLinkBannerInfo): string {
  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines = [
    `This session was opened by an external deep link in ${tildify(info.cwd)}`,
  ]
  // 满足 `info.repo` 时，共享工具执行该分支。
  if (info.repo) {
    // age格式化`formatRelativeTimeAgo`，供共享工具后续处理使用。
    const age = info.lastFetch ? formatRelativeTimeAgo(info.lastFetch) : 'never'
    // stale 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const stale =
      !info.lastFetch ||
      Date.now() - info.lastFetch.getTime() > STALE_FETCH_WARN_MS
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `Resolved ${info.repo} from local clones · last fetched ${age}${stale ? ' — CLAUDE.md may be stale' : ''}`,
    )
  }
  // 满足 `info.prefillLength` 时，共享工具执行该分支。
  if (info.prefillLength) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      info.prefillLength > LONG_PREFILL_THRESHOLD
        ? `The prompt below (${formatNumber(info.prefillLength)} chars) was supplied by the link — scroll to review the entire prompt before pressing Enter.`
        : 'The prompt below was supplied by the link — review carefully before pressing Enter.',
    )
  }
  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}

/**
 * Read the mtime of .git/FETCH_HEAD, which git updates on every fetch or
 * pull. Returns undefined if the directory is not a git repo or has never
 * been fetched.
 *
 * FETCH_HEAD is per-worktree — fetching from the main worktree does not
 * touch a sibling worktree's FETCH_HEAD. When cwd is a worktree, we check
 * both and return whichever is newer so a recently-fetched main repo
 * doesn't read as "never fetched" just because the deep link landed in
 * a worktree.
 */
// readLastFetchTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readLastFetchTime(
  cwd: string,
): Promise<Date | undefined> {
  // gitDir读取`getGitDir`，供共享工具后续处理使用。
  const gitDir = await getGitDir(cwd)
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) return undefined
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = await getCommonDir(gitDir)
  // 并行获取 local、common，缩短共享工具 banner等待多个独立异步任务的时间。
  const [local, common] = await Promise.all([
    mtimeOrUndefined(join(gitDir, 'FETCH_HEAD')),
    commonDir
      ? mtimeOrUndefined(join(commonDir, 'FETCH_HEAD'))
      : Promise.resolve(undefined),
  ])
  // 只有 `local && common` 满足时，共享工具才执行该分支。
  if (local && common) return local > common ? local : common
  // 返回 `local ?? common`，作为共享工具这次计算的结果。
  return local ?? common
}

// mtimeOrUndefined 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function mtimeOrUndefined(p: string): Promise<Date | undefined> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await stat(p)` 解构 mtime，减少共享工具 banner对同一对象的重复访问。
    const { mtime } = await stat(p)
    // 返回 `mtime`，作为共享工具这次计算的结果。
    return mtime
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Shorten home-dir-prefixed paths to ~ notation for the banner.
 * Not using getDisplayPath() because cwd is the current working directory,
 * so the relative-path branch would collapse it to the empty string.
 */
// tildify 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tildify(p: string): string {
  // home保存`homedir`，供共享工具后续处理使用。
  const home = homedir()
  // 满足 `p === home` 时，共享工具执行该分支。
  if (p === home) return '~'
  // 满足 `p.startsWith(home + sep)) return '~' + p.slice(home.length` 时，共享工具执行该分支。
  if (p.startsWith(home + sep)) return '~' + p.slice(home.length)
  // 返回 `p`，作为共享工具这次计算的结果。
  return p
}
