// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { resolve } from 'path'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 类型依赖 { MarketplaceSource } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { MarketplaceSource } from './schemas.js'

/**
 * Parses a marketplace input string and returns the appropriate marketplace source type.
 * Handles various input formats:
 * - Git SSH URLs (user@host:path or user@host:path.git)
 *   - Standard: git@github.com:owner/repo.git
 *   - GitHub Enterprise SSH certificates: org-123456@github.com:owner/repo.git
 *   - Custom usernames: deploy@gitlab.com:group/project.git
 *   - Self-hosted: user@192.168.10.123:path/to/repo
 * - HTTP/HTTPS URLs
 * - GitHub shorthand (owner/repo)
 * - Local file paths (.json files)
 * - Local directory paths
 *
 * @param input The marketplace source input string
 * @returns MarketplaceSource object, error object, or null if format is unrecognized
 */
// parseMarketplaceInput 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseMarketplaceInput(
  input: string,
): Promise<MarketplaceSource | { error: string } | null> {
  // trimmed格式化`input.trim`，供插件管理后续处理使用。
  const trimmed = input.trim()
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()

  // Handle git SSH URLs with any valid username (not just 'git')
  // Supports: user@host:path, user@host:path.git, and with #ref suffix
  // Username can contain: alphanumeric, dots, underscores, hyphens
  // sshMatch匹配`trimmed.match`，供插件管理后续处理使用。
  const sshMatch = trimmed.match(
    /^([a-zA-Z0-9._-]+@[^:]+:.+?(?:\.git)?)(#(.+))?$/,
  )
  // 满足 `sshMatch?.[1]` 时，插件管理执行该分支。
  if (sshMatch?.[1]) {
    // URL 命名 `sshMatch[1]`，让后续代码直接表达这个值的用途。
    const url = sshMatch[1]
    // ref 引用保存`sshMatch[3]`，供插件工具 parse Marketplace Input后续判断或输出使用。
    const ref = sshMatch[3]
    // 返回 `ref ? { source: 'git', url, ref } : { source: 'git', url }`，作为插件管理这次计算的结果。
    return ref ? { source: 'git', url, ref } : { source: 'git', url }
  }

  // Handle URLs
  // 只有 `trimmed.startsWith('http://') || trimmed.startsWith('https://')` 满足时，插件管理才执行该分支。
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Extract fragment (ref) from URL if present
    // fragmentMatch匹配`trimmed.match`，供插件管理后续处理使用。
    const fragmentMatch = trimmed.match(/^([^#]+)(#(.+))?$/)
    // urlWithoutFragment标记插件工具 parse Marketplace Input是否启用对应路径。
    const urlWithoutFragment = fragmentMatch?.[1] || trimmed
    // ref 引用 命名 `fragmentMatch?.[3]`，让后续代码直接表达这个值的用途。
    const ref = fragmentMatch?.[3]

    // When user explicitly provides an HTTPS/HTTP URL that looks like a git
    // repo, use the git source type so we clone rather than fetch-as-JSON.
    // The .git suffix is a GitHub/GitLab/Bitbucket convention. Azure DevOps
    // uses /_git/ in the path with NO suffix (appending .git breaks ADO:
    // TF401019 "repo does not exist"). Without this check, an ADO URL falls
    // through to source:'url' below, which tries to fetch it as a raw
    // marketplace.json — the HTML response parses as "expected object,
    // received string". (gh-31256 / CC-299)
    // 插件管理在这里按实际状态进入对应分支。
    if (
      urlWithoutFragment.endsWith('.git') ||
      urlWithoutFragment.includes('/_git/')
    ) {
      // 返回 `ref`，作为插件管理这次计算的结果。
      return ref
        ? { source: 'git', url: urlWithoutFragment, ref }
        : { source: 'git', url: urlWithoutFragment }
    }
    // Parse URL to check hostname
    // URL 先占位，稍后的条件分支会根据实际输入补齐它。
    let url: URL
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // URL更新为 `new URL(urlWithoutFragment)`，确保插件工具后续读取最新状态。
      url = new URL(urlWithoutFragment)
    } catch (_err) {
      // Not a valid URL for parsing, treat as generic URL
      // new URL() throws TypeError for invalid URLs
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { source: 'url', url: urlWithoutFragment }
    }

    // 只有 `url.hostname === 'github.com' || url.hostname ===` 满足时，插件管理才执行该分支。
    if (url.hostname === 'github.com' || url.hostname === 'www.github.com') {
      // match匹配`pathname.match`，供插件管理后续处理使用。
      const match = url.pathname.match(/^\/([^/]+\/[^/]+?)(\/|\.git|$)/)
      // 满足 `match?.[1]` 时，插件管理执行该分支。
      if (match?.[1]) {
        // User explicitly provided HTTPS URL - keep it as HTTPS via 'git' type
        // Add .git suffix if not present for proper git clone
        // gitUrl保存`urlWithoutFragment.endsWith`，供插件管理后续处理使用。
        const gitUrl = urlWithoutFragment.endsWith('.git')
          ? urlWithoutFragment
          : `${urlWithoutFragment}.git`
        // 返回 `ref`，作为插件管理这次计算的结果。
        return ref
          ? { source: 'git', url: gitUrl, ref }
          : { source: 'git', url: gitUrl }
      }
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { source: 'url', url: urlWithoutFragment }
  }

  // Handle local paths
  // On Windows, also recognize backslash-relative (.\, ..\) and drive letter paths (C:\)
  // These are Windows-only because backslashes are valid filename chars on Unix
  // isWindows 集合标记插件工具 parse Marketplace Input是否启用对应路径。
  const isWindows = process.platform === 'win32'
  // isWindowsPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isWindowsPath =
    isWindows &&
    (trimmed.startsWith('.\\') ||
      trimmed.startsWith('..\\') ||
      /^[a-zA-Z]:[/\\]/.test(trimmed))
  // 插件管理在这里按实际状态进入对应分支。
  if (
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('~') ||
    isWindowsPath
  ) {
    // resolvedPath 路径数据读取`resolve`，供插件管理后续处理使用。
    const resolvedPath = resolve(
      trimmed.startsWith('~') ? trimmed.replace(/^~/, homedir()) : trimmed,
    )

    // Stat the path to determine if it's a file or directory. Swallow all stat
    // errors (ENOENT, EACCES, EPERM, etc.) and return an error result instead
    // of throwing — matches the old existsSync behavior which never threw.
    // stats 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let stats
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合更新为 `await fs.stat(resolvedPath)`，确保插件工具后续读取最新状态。
      stats = await fs.stat(resolvedPath)
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供插件管理后续处理使用。
      const code = getErrnoCode(e)
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        error:
          code === 'ENOENT'
            ? `Path does not exist: ${resolvedPath}`
            : `Cannot access path: ${resolvedPath} (${code ?? e})`,
      }
    }

    // 满足 `stats.isFile()` 时，插件管理执行该分支。
    if (stats.isFile()) {
      // 满足 `resolvedPath.endsWith('.json')` 时，插件管理执行该分支。
      if (resolvedPath.endsWith('.json')) {
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return { source: 'file', path: resolvedPath }
      } else {
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return {
          error: `File path must point to a .json file (marketplace.json), but got: ${resolvedPath}`,
        }
      }
    // 插件工具 parse Marketplace Input在这里处理 `} else if (stats.isDirectory()) {`，完成这一小步状态转换。
    } else if (stats.isDirectory()) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { source: 'directory', path: resolvedPath }
    } else {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        error: `Path is neither a file nor a directory: ${resolvedPath}`,
      }
    }
  }

  // Handle GitHub shorthand (owner/repo, owner/repo#ref, or owner/repo@ref)
  // Accept both # and @ as ref separators — the display formatter uses @, so users
  // naturally type @ when copying from error messages or managed settings.
  // 只有 `trimmed.includes('/') && !trimmed.startsWith('@')` 满足时，插件管理才执行该分支。
  if (trimmed.includes('/') && !trimmed.startsWith('@')) {
    // 满足 `trimmed.includes(':')` 时，插件管理执行该分支。
    if (trimmed.includes(':')) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // Extract ref if present (either #ref or @ref)
    // fragmentMatch匹配`trimmed.match`，供插件管理后续处理使用。
    const fragmentMatch = trimmed.match(/^([^#@]+)(?:[#@](.+))?$/)
    // repo标记插件工具 parse Marketplace Input是否启用对应路径。
    const repo = fragmentMatch?.[1] || trimmed
    // ref 引用读取 `fragmentMatch?.[2]` 对应条目，后续围绕该成员继续处理。
    const ref = fragmentMatch?.[2]
    // Assume it's a GitHub repo
    // 返回 `ref ? { source: 'github', repo, ref } : { source: 'github', repo }`，作为插件管理这次计算的结果。
    return ref ? { source: 'github', repo, ref } : { source: 'github', repo }
  }

  // NPM packages not yet implemented
  // Returning null for unrecognized input

  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}
