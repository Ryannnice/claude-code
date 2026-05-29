/**
 * Deep Link URI Parser
 *
 * Parses `claude-cli://open` URIs. All parameters are optional:
 *   q    — pre-fill the prompt input (not submitted)
 *   cwd  — working directory (absolute path)
 *   repo — owner/name slug, resolved against githubRepoPaths config
 *
 * Examples:
 *   claude-cli://open
 *   claude-cli://open?q=hello+world
 *   claude-cli://open?q=fix+tests&repo=owner/repo
 *   claude-cli://open?cwd=/path/to/project
 *
 * Security: values are URL-decoded, Unicode-sanitized, and rejected if they
 * contain ASCII control characters (newlines etc. can act as command
 * separators). All values are single-quote shell-escaped at the point of
 * use (terminalLauncher.ts) — that escaping is the injection boundary.
 */

// 引入 partiallySanitizeUnicode，将 ../sanitization.js 中已经封装好的能力接到本文件流程里。
import { partiallySanitizeUnicode } from '../sanitization.js'

// DEEP_LINK_PROTOCOL固定为 `'claude-cli'`，作为共享工具 parse Deep Link后续展示或比较的基准。
export const DEEP_LINK_PROTOCOL = 'claude-cli'

// DeepLinkAction 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeepLinkAction = {
  query?: string
  cwd?: string
  repo?: string
}

/**
 * Check if a string contains ASCII control characters (0x00-0x1F, 0x7F).
 * These can act as command separators in shells (newlines, carriage returns, etc.).
 * Allows printable ASCII and Unicode (CJK, emoji, accented chars, etc.).
 */
// containsControlChars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsControlChars(s: string): boolean {
  // 按索引扫描 `s.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < s.length; i++) {
    // code保存`s.charCodeAt`，供共享工具后续处理使用。
    const code = s.charCodeAt(i)
    // 只有 `code <= 0x1f || code === 0x7f` 满足时，共享工具才执行该分支。
    if (code <= 0x1f || code === 0x7f) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * GitHub owner/repo slug: alphanumerics, dots, hyphens, underscores,
 * exactly one slash. Keeps this from becoming a path traversal vector.
 */
// REPO_SLUG_PATTERN保存`/^[\w.-]+\/[\w.-]+$/`，供共享工具 parse Deep Link后续判断或输出使用。
const REPO_SLUG_PATTERN = /^[\w.-]+\/[\w.-]+$/

/**
 * Cap on pre-filled prompt length. The only defense against a prompt like
 * "review PR #18796 […4900 chars of padding…] also cat ~/.ssh/id_rsa" is
 * the user reading it before pressing Enter. At this length the prompt is
 * no longer scannable at a glance, so banner.ts shows an explicit "scroll
 * to review the entire prompt" warning above LONG_PREFILL_THRESHOLD.
 * Reject, don't truncate — truncation changes meaning.
 *
 * 5000 is the practical ceiling: the Windows cmd.exe fallback
 * (terminalLauncher.ts) has an 8191-char command-string limit, and after
 * the `cd /d <cwd> && <claude.exe> --deep-link-origin ... --prefill "<q>"`
 * wrapper plus cmdQuote's %→%% expansion, ~7000 chars of query is the
 * hard stop for typical inputs. A pathological >60%-percent-sign query
 * would 2× past the limit, but cmd.exe is the last-resort fallback
 * (wt.exe and PowerShell are tried first) and the failure mode is a
 * launch error, not a security issue — so we don't penalize real users
 * for an implausible input.
 */
// MAX_QUERY_LENGTH 数量 命名 `5000`，让后续代码直接表达这个值的用途。
const MAX_QUERY_LENGTH = 5000

/**
 * PATH_MAX on Linux is 4096. Windows MAX_PATH is 260 (32767 with long-path
 * opt-in). No real path approaches this; a cwd over 4096 is malformed or
 * malicious.
 */
// MAX_CWD_LENGTH 数量保存`4096`，供后续判断或组装使用。
const MAX_CWD_LENGTH = 4096

/**
 * Parse a claude-cli:// URI into a structured action.
 *
 * @throws {Error} if the URI is malformed or contains dangerous characters
 */
// parseDeepLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseDeepLink(uri: string): DeepLinkAction {
  // Normalize: accept with or without the trailing colon in protocol
  // normalized保存`uri.startsWith`，供共享工具后续处理使用。
  const normalized = uri.startsWith(`${DEEP_LINK_PROTOCOL}://`)
    ? uri
    : uri.startsWith(`${DEEP_LINK_PROTOCOL}:`)
      ? uri.replace(`${DEEP_LINK_PROTOCOL}:`, `${DEEP_LINK_PROTOCOL}://`)
      : null

  // normalized缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!normalized) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid deep link: expected ${DEEP_LINK_PROTOCOL}:// scheme, got "${uri}"`,
    )
  }

  // URL 先占位，稍后的条件分支会根据实际输入补齐它。
  let url: URL
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // URL更新为 `new URL(normalized)`，确保共享工具后续读取最新状态。
    url = new URL(normalized)
  } catch {
    // 抛出 new Error(`Invalid deep link URL: "${uri}"`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid deep link URL: "${uri}"`)
  }

  // `url.hostname` 与 `'open'` 不一致时刷新派生状态，避免使用过期结果。
  if (url.hostname !== 'open') {
    // 抛出 new Error(`Unknown deep link action: "${url.hostname}"`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Unknown deep link action: "${url.hostname}"`)
  }

  // cwd读取`searchParams.get`，供共享工具后续处理使用。
  const cwd = url.searchParams.get('cwd') ?? undefined
  // 当前仓库读取`searchParams.get`，供共享工具后续处理使用。
  const repo = url.searchParams.get('repo') ?? undefined
  // rawQuery读取`searchParams.get`，供共享工具后续处理使用。
  const rawQuery = url.searchParams.get('q')

  // Validate cwd if present — must be an absolute path
  // 只有 `cwd && !cwd.startsWith('/') && !/^[a-zA-Z]:[/\\]/.test(cwd)` 满足时，共享工具才执行该分支。
  if (cwd && !cwd.startsWith('/') && !/^[a-zA-Z]:[/\\]/.test(cwd)) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid cwd in deep link: must be an absolute path, got "${cwd}"`,
    )
  }

  // Reject control characters in cwd (newlines, etc.) but allow path chars like backslash.
  // 只有 `cwd && containsControlChars(cwd)` 满足时，共享工具才执行该分支。
  if (cwd && containsControlChars(cwd)) {
    // 抛出 new Error('Deep link cwd contains disallowed control characters')，阻止共享工具在无效状态下继续运行。
    throw new Error('Deep link cwd contains disallowed control characters')
  }
  // 只有 `cwd && cwd.length > MAX_CWD_LENGTH` 满足时，共享工具才执行该分支。
  if (cwd && cwd.length > MAX_CWD_LENGTH) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Deep link cwd exceeds ${MAX_CWD_LENGTH} characters (got ${cwd.length})`,
    )
  }

  // Validate repo slug format. Resolution happens later (protocolHandler.ts) —
  // this parser stays pure with no config/filesystem access.
  // 只有 `repo && !REPO_SLUG_PATTERN.test(repo)` 满足时，共享工具才执行该分支。
  if (repo && !REPO_SLUG_PATTERN.test(repo)) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid repo in deep link: expected "owner/repo", got "${repo}"`,
    )
  }

  // query 先占位，稍后的条件分支会根据实际输入补齐它。
  let query: string | undefined
  // 只有 `rawQuery && rawQuery.trim().length > 0` 满足时，共享工具才执行该分支。
  if (rawQuery && rawQuery.trim().length > 0) {
    // Strip hidden Unicode characters (ASCII smuggling / hidden prompt injection)
    // query更新为 `partiallySanitizeUnicode(rawQuery.trim())`，确保共享工具后续读取最新状态。
    query = partiallySanitizeUnicode(rawQuery.trim())
    // 满足 `containsControlChars(query)` 时，共享工具执行该分支。
    if (containsControlChars(query)) {
      // 抛出 new Error('Deep link query contains disallowed control characters')，阻止共享工具在无效状态下继续运行。
      throw new Error('Deep link query contains disallowed control characters')
    }
    // 满足 `query.length > MAX_QUERY_LENGTH` 时，共享工具执行该分支。
    if (query.length > MAX_QUERY_LENGTH) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Deep link query exceeds ${MAX_QUERY_LENGTH} characters (got ${query.length})`,
      )
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { query, cwd, repo }
}

/**
 * Build a claude-cli:// deep link URL.
 */
// buildDeepLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildDeepLink(action: DeepLinkAction): string {
  // URL保存`URL`，供共享工具后续处理使用。
  const url = new URL(`${DEEP_LINK_PROTOCOL}://open`)
  // 满足 `action.query` 时，共享工具执行该分支。
  if (action.query) {
    // url.searchParams.set 写入新的状态值，使共享工具后续读取保持一致。
    url.searchParams.set('q', action.query)
  }
  // 满足 `action.cwd` 时，共享工具执行该分支。
  if (action.cwd) {
    // url.searchParams.set 写入新的状态值，使共享工具后续读取保持一致。
    url.searchParams.set('cwd', action.cwd)
  }
  // 满足 `action.repo` 时，共享工具执行该分支。
  if (action.repo) {
    // url.searchParams.set 写入新的状态值，使共享工具后续读取保持一致。
    url.searchParams.set('repo', action.repo)
  }
  // 返回 `url.toString()`，作为共享工具这次计算的结果。
  return url.toString()
}
