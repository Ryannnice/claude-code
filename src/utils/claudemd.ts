/**
 * Files are loaded in the following order:
 *
 * 1. Managed memory (eg. /etc/claude-code/CLAUDE.md) - Global instructions for all users
 * 2. User memory (~/.claude/CLAUDE.md) - Private global instructions for all projects
 * 3. Project memory (CLAUDE.md, .claude/CLAUDE.md, and .claude/rules/*.md in project roots) - Instructions checked into the codebase
 * 4. Local memory (CLAUDE.local.md in project roots) - Private project-specific instructions
 *
 * Files are loaded in reverse order of priority, i.e. the latest files are highest priority
 * with the model paying more attention to them.
 *
 * File discovery:
 * - User memory is loaded from the user's home directory
 * - Project and Local files are discovered by traversing from the current directory up to root
 * - Files closer to the current directory have higher priority (loaded later)
 * - CLAUDE.md, .claude/CLAUDE.md, and all .md files in .claude/rules/ are checked in each directory for Project memory
 *
 * Memory @include directive:
 * - Memory files can include other files using @ notation
 * - Syntax: @path, @./relative/path, @~/home/path, or @/absolute/path
 * - @path (without prefix) is treated as a relative path (same as @./path)
 * - Works in leaf text nodes only (not inside code blocks or code strings)
 * - Included files are added as separate entries before the including file
 * - Circular references are prevented by tracking processed files
 * - Non-existent files are silently ignored
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 ignore，将 ignore 中已经封装好的能力接到本文件流程里。
import ignore from 'ignore'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 Lexer，将 marked 中已经封装好的能力接到本文件流程里。
import { Lexer } from 'marked'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  parse,
  relative,
  sep,
} from 'path'
// 引入 picomatch，将 picomatch 中已经封装好的能力接到本文件流程里。
import picomatch from 'picomatch'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAdditionalDirectoriesForClaudeMd,
  getOriginalCwd,
} from '../bootstrap/state.js'
// 引入 truncateEntrypointContent，将 ../memdir/memdir.js 中已经封装好的能力接到本文件流程里。
import { truncateEntrypointContent } from '../memdir/memdir.js'
// 引入 getAutoMemEntrypoint、isAutoMemoryEnabled，将 ../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemEntrypoint, isAutoMemoryEnabled } from '../memdir/paths.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCurrentProjectConfig,
  getManagedClaudeRulesDir,
  getMemoryPath,
  getUserClaudeRulesDir,
} from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 normalizePathForComparison，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { normalizePathForComparison } from './file.js'
// 引入 cacheKeys、FileStateCache，将 ./fileStateCache.js 中已经封装好的能力接到本文件流程里。
import { cacheKeys, type FileStateCache } from './fileStateCache.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  parseFrontmatter,
  splitPathInFrontmatter,
} from './frontmatterParser.js'
// 引入 getFsImplementation、safeResolvePath，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, safeResolvePath } from './fsOperations.js'
// 引入 findCanonicalGitRoot、findGitRoot，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { findCanonicalGitRoot, findGitRoot } from './git.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  executeInstructionsLoadedHooks,
  hasInstructionsLoadedHook,
  type InstructionsLoadReason,
  type InstructionsMemoryType,
} from './hooks.js'
// 类型依赖 { MemoryType } 来自 ./memory/types.js，用于校准共享工具的数据契约。
import type { MemoryType } from './memory/types.js'
// 引入 expandPath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from './path.js'
// 引入 pathInWorkingPath，将 ./permissions/filesystem.js 中已经封装好的能力接到本文件流程里。
import { pathInWorkingPath } from './permissions/filesystem.js'
// 引入 isSettingSourceEnabled，将 ./settings/constants.js 中已经封装好的能力接到本文件流程里。
import { isSettingSourceEnabled } from './settings/constants.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供共享工具后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('../memdir/teamMemPaths.js') as typeof import('../memdir/teamMemPaths.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// hasLoggedInitialLoad标记共享工具 claudemd是否启用对应路径。
let hasLoggedInitialLoad = false

// MEMORY_INSTRUCTION_PROMPT 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const MEMORY_INSTRUCTION_PROMPT =
  'Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.'
// Recommended max character count for a memory file
// MAX_MEMORY_CHARACTER_COUNT 数量保存`40000`，供共享工具 claudemd后续判断或输出使用。
export const MAX_MEMORY_CHARACTER_COUNT = 40000

// File extensions that are allowed for @include directives
// This prevents binary files (images, PDFs, etc.) from being loaded into memory
// TEXT_FILE_EXTENSIONS 文件数据保存`Set`，供共享工具后续处理使用。
const TEXT_FILE_EXTENSIONS = new Set([
  // Markdown and text
  '.md',
  '.txt',
  '.text',
  // Data formats
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.csv',
  // Web
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  // JavaScript/TypeScript
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  // Python
  '.py',
  '.pyi',
  '.pyw',
  // Ruby
  '.rb',
  '.erb',
  '.rake',
  // Go
  '.go',
  // Rust
  '.rs',
  // Java/Kotlin/Scala
  '.java',
  '.kt',
  '.kts',
  '.scala',
  // C/C++
  '.c',
  '.cpp',
  '.cc',
  '.cxx',
  '.h',
  '.hpp',
  '.hxx',
  // C#
  '.cs',
  // Swift
  '.swift',
  // Shell
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.ps1',
  '.bat',
  '.cmd',
  // Config
  '.env',
  '.ini',
  '.cfg',
  '.conf',
  '.config',
  '.properties',
  // Database
  '.sql',
  '.graphql',
  '.gql',
  // Protocol
  '.proto',
  // Frontend frameworks
  '.vue',
  '.svelte',
  '.astro',
  // Templating
  '.ejs',
  '.hbs',
  '.pug',
  '.jade',
  // Other languages
  '.php',
  '.pl',
  '.pm',
  '.lua',
  '.r',
  '.R',
  '.dart',
  '.ex',
  '.exs',
  '.erl',
  '.hrl',
  '.clj',
  '.cljs',
  '.cljc',
  '.edn',
  '.hs',
  '.lhs',
  '.elm',
  '.ml',
  '.mli',
  '.f',
  '.f90',
  '.f95',
  '.for',
  // Build files
  '.cmake',
  '.make',
  '.makefile',
  '.gradle',
  '.sbt',
  // Documentation
  '.rst',
  '.adoc',
  '.asciidoc',
  '.org',
  '.tex',
  '.latex',
  // Lock files (often text-based)
  '.lock',
  // Misc
  '.log',
  '.diff',
  '.patch',
])

// MemoryFileInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryFileInfo = {
  path: string
  type: MemoryType
  content: string
  parent?: string // Path of the file that included this one
  globs?: string[] // Glob patterns for file paths this rule applies to
  // True when auto-injection transformed `content` (stripped HTML comments,
  // stripped frontmatter, truncated MEMORY.md) such that it no longer matches
  // the bytes on disk. When set, `rawContent` holds the unmodified disk bytes
  // so callers can cache a `isPartialView` readFileState entry — presence in
  // cache provides dedup + change detection, but Edit/Write still require an
  // explicit Read before proceeding.
  contentDiffersFromDisk?: boolean
  rawContent?: string
}

// pathInOriginalCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pathInOriginalCwd(path: string): boolean {
  // 返回 `pathInWorkingPath(path, getOriginalCwd())`，作为共享工具这次计算的结果。
  return pathInWorkingPath(path, getOriginalCwd())
}

/**
 * Parses raw content to extract both content and glob patterns from frontmatter
 * @param rawContent Raw file content with frontmatter
 * @returns Object with content and globs (undefined if no paths or match-all pattern)
 */
// parseFrontmatterPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseFrontmatterPaths(rawContent: string): {
  content: string
  paths?: string[]
} {
  // 从 `parseFrontmatter(rawContent)` 解构 frontmatter、content，减少共享工具 claudemd对同一对象的重复访问。
  const { frontmatter, content } = parseFrontmatter(rawContent)

  // frontmatter.paths 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!frontmatter.paths) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content }
  }

  // patterns 集合格式化`splitPathInFrontmatter`，供共享工具后续处理使用。
  const patterns = splitPathInFrontmatter(frontmatter.paths)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(pattern => {
      // Remove /** suffix - ignore library treats 'path' as matching both
      // the path itself and everything inside it
      // 返回 `pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern`，作为共享工具这次计算的结果。
      return pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern
    })
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter((p: string) => p.length > 0)

  // If all patterns are ** (match-all), treat as no globs (undefined)
  // This means the file applies to all paths
  // 只有 `patterns.length === 0 || patterns.every((p: string) => p === '**')` 满足时，共享工具才执行该分支。
  if (patterns.length === 0 || patterns.every((p: string) => p === '**')) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { content, paths: patterns }
}

/**
 * Strip block-level HTML comments (<!-- ... -->) from markdown content.
 *
 * Uses the marked lexer to identify comments at the block level only, so
 * comments inside inline code spans and fenced code blocks are preserved.
 * Inline HTML comments inside a paragraph are also left intact; the intended
 * use case is authorial notes that occupy their own lines.
 *
 * Unclosed comments (`<!--` with no matching `-->`) are left in place so a
 * typo doesn't silently swallow the rest of the file.
 */
// stripHtmlComments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripHtmlComments(content: string): {
  content: string
  stripped: boolean
} {
  // 满足 `!content.includes('<!--')` 时，共享工具执行该分支。
  if (!content.includes('<!--')) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content, stripped: false }
  }
  // gfm:false is fine here — html-block detection is a CommonMark rule.
  // 返回 `stripHtmlCommentsFromTokens(new Lexer({ gfm: false }).lex(content))`，作为共享工具这次计算的结果。
  return stripHtmlCommentsFromTokens(new Lexer({ gfm: false }).lex(content))
}

// stripHtmlCommentsFromTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripHtmlCommentsFromTokens(tokens: ReturnType<Lexer['lex']>): {
  content: string
  stripped: boolean
} {
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // stripped标记共享工具 claudemd是否启用对应路径。
  let stripped = false

  // A well-formed HTML comment span. Non-greedy so multiple comments on the
  // same line are matched independently; [\s\S] to span newlines.
  // commentSpan读取 `/<!--[\s\S]*?-->/g` 对应条目，后续围绕该成员继续处理。
  const commentSpan = /<!--[\s\S]*?-->/g

  // 按顺序遍历 `tokens` 中的token，逐个交给共享工具处理。
  for (const token of tokens) {
    // 当 `token.type` 匹配 `'html'` 时，共享工具执行对应分支。
    if (token.type === 'html') {
      // trimmed格式化`raw.trimStart`，供共享工具后续处理使用。
      const trimmed = token.raw.trimStart()
      // 只有 `trimmed.startsWith('<!--') && trimmed.includes('-->')` 满足时，共享工具才执行该分支。
      if (trimmed.startsWith('<!--') && trimmed.includes('-->')) {
        // Per CommonMark, a type-2 HTML block ends at the *line* containing
        // `-->`, so text after `-->` on that line is part of this token.
        // Strip only the comment spans and keep any residual content.
        // residue格式化`raw.replace`，供共享工具后续处理使用。
        const residue = token.raw.replace(commentSpan, '')
        // stripped更新为 `true`，确保共享工具后续读取最新状态。
        stripped = true
        // 满足 `residue.trim().length > 0` 时，共享工具执行该分支。
        if (residue.trim().length > 0) {
          // Residual content exists (e.g. `<!-- note --> Use bun`): keep it.
          // 共享工具 claudemd在这里处理 `result += residue`，完成这一小步状态转换。
          result += residue
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 共享工具 claudemd在这里处理 `result += token.raw`，完成这一小步状态转换。
    result += token.raw
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { content: result, stripped }
}

/**
 * Parses raw memory file content into a MemoryFileInfo. Pure function — no I/O.
 *
 * When includeBasePath is given, @include paths are resolved in the same lex
 * pass and returned alongside the parsed file (so processMemoryFile doesn't
 * need to lex the same content a second time).
 */
// parseMemoryFileContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseMemoryFileContent(
  rawContent: string,
  filePath: string,
  type: MemoryType,
  includeBasePath?: string,
): { info: MemoryFileInfo | null; includePaths: string[] } {
  // Skip non-text files to prevent loading binary data (images, PDFs, etc.) into memory
  // ext保存`extname`，供共享工具后续处理使用。
  const ext = extname(filePath).toLowerCase()
  // 只有 `ext && !TEXT_FILE_EXTENSIONS.has(ext)` 满足时，共享工具才执行该分支。
  if (ext && !TEXT_FILE_EXTENSIONS.has(ext)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Skipping non-text file in @include: ${filePath}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { info: null, includePaths: [] }
  }

  // 共享工具 claudemd先整理这一处局部数据，后续分支可以直接读取。
  const { content: withoutFrontmatter, paths } =
    parseFrontmatterPaths(rawContent)

  // Lex once so strip and @include-extract share the same tokens. gfm:false
  // is required by extract (so ~/path doesn't tokenize as strikethrough) and
  // doesn't affect strip (html blocks are a CommonMark rule).
  // hasComment记录 `withoutFrontmatter.includes` 是否成立，共享工具随后按该结果分支。
  const hasComment = withoutFrontmatter.includes('<!--')
  // tokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const tokens =
    hasComment || includeBasePath !== undefined
      ? new Lexer({ gfm: false }).lex(withoutFrontmatter)
      : undefined

  // Only rebuild via tokens when a comment actually needs stripping —
  // marked normalises \r\n during lex, so round-tripping a CRLF file
  // through token.raw would spuriously flip contentDiffersFromDisk.
  // strippedContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const strippedContent =
    hasComment && tokens
      ? stripHtmlCommentsFromTokens(tokens).content
      : withoutFrontmatter

  // includePaths 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const includePaths =
    tokens && includeBasePath !== undefined
      ? extractIncludePathsFromTokens(tokens, includeBasePath)
      : []

  // Truncate MEMORY.md entrypoints to the line AND byte caps
  // finalContent保存`strippedContent`，供后续判断或组装使用。
  let finalContent = strippedContent
  // 当 `type` 匹配 `'AutoMem' || type === 'Team...` 时，共享工具执行对应分支。
  if (type === 'AutoMem' || type === 'TeamMem') {
    // finalContent更新为 `truncateEntrypointContent(strippedContent).content`，确保共享工具后续读取最新状态。
    finalContent = truncateEntrypointContent(strippedContent).content
  }

  // Covers frontmatter strip, HTML comment strip, and MEMORY.md truncation
  // contentDiffersFromDisk标记共享工具 claudemd是否启用对应路径。
  const contentDiffersFromDisk = finalContent !== rawContent
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    info: {
      path: filePath,
      type,
      content: finalContent,
      globs: paths,
      contentDiffersFromDisk,
      rawContent: contentDiffersFromDisk ? rawContent : undefined,
    },
    includePaths,
  }
}

// handleMemoryFileReadError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleMemoryFileReadError(error: unknown, filePath: string): void {
  // code读取`getErrnoCode`，供共享工具后续处理使用。
  const code = getErrnoCode(error)
  // ENOENT = file doesn't exist, EISDIR = is a directory — both expected
  // 当 `code` 匹配 `'ENOENT' || code === 'EISDI...` 时，共享工具执行对应分支。
  if (code === 'ENOENT' || code === 'EISDIR') {
    // 共享工具 claudemd在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Log permission errors (EACCES) as they're actionable
  // 当 `code` 匹配 `'EACCES'` 时，共享工具执行对应分支。
  if (code === 'EACCES') {
    // Don't log the full file path to avoid PII/security issues
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_claude_md_permission_error', {
      is_access_error: 1,
      has_home_dir: filePath.includes(getClaudeConfigHomeDir()) ? 1 : 0,
    })
  }
}

/**
 * Used by processMemoryFile → getMemoryFiles so the event loop stays
 * responsive during the directory walk (many readFile attempts, most
 * ENOENT). When includeBasePath is given, @include paths are resolved in
 * the same lex pass and returned alongside the parsed file.
 */
// safelyReadMemoryFileAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function safelyReadMemoryFileAsync(
  filePath: string,
  type: MemoryType,
  includeBasePath?: string,
): Promise<{ info: MemoryFileInfo | null; includePaths: string[] }> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // rawContent读取`fs.readFile`，供共享工具后续处理使用。
    const rawContent = await fs.readFile(filePath, { encoding: 'utf-8' })
    // 返回 `parseMemoryFileContent(rawContent, filePath, type, includeBasePath)`，作为共享工具这次计算的结果。
    return parseMemoryFileContent(rawContent, filePath, type, includeBasePath)
  } catch (error) {
    // 调用 handleMemoryFileReadError，触发共享工具此处需要的副作用。
    handleMemoryFileReadError(error, filePath)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { info: null, includePaths: [] }
  }
}

// MarkdownToken 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MarkdownToken = {
  type: string
  text?: string
  href?: string
  tokens?: MarkdownToken[]
  raw?: string
  items?: MarkdownToken[]
}

// Extract @path include references from pre-lexed tokens and resolve to
// absolute paths. Skips html tokens so @paths inside block comments are
// ignored — the caller may pass pre-strip tokens.
// extractIncludePathsFromTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractIncludePathsFromTokens(
  tokens: ReturnType<Lexer['lex']>,
  basePath: string,
): string[] {
  // absolutePaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
  const absolutePaths = new Set<string>()

  // Extract @paths from a text string and add resolved paths to absolutePaths.
  // extractPathsFromText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function extractPathsFromText(textContent: string) {
    // includeRegex 命名 `/(?:^|\s)@((?:[^\s\\]|\\ )+)/g`，让后续代码直接表达这个值的用途。
    const includeRegex = /(?:^|\s)@((?:[^\s\\]|\\ )+)/g
    // match 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let match
    // 只要 (match = includeRegex.exec(textContent)) !== null 成立，就持续推进共享工具中的循环处理。
    while ((match = includeRegex.exec(textContent)) !== null) {
      // 路径保存`match[1]`，供共享工具 claudemd后续判断或输出使用。
      let path = match[1]
      // 路径缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!path) continue

      // Strip fragment identifiers (#heading, #section-name, etc.)
      // hashIndex 索引保存`path.indexOf`，供共享工具后续处理使用。
      const hashIndex = path.indexOf('#')
      // `hashIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (hashIndex !== -1) {
        // 路径更新为 `path.substring(0, hashIndex)`，确保共享工具后续读取最新状态。
        path = path.substring(0, hashIndex)
      }
      // 路径缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!path) continue

      // Unescape the spaces in the path
      // 路径更新为 `path.replace(/\\ /g, ' ')`，确保共享工具后续读取最新状态。
      path = path.replace(/\\ /g, ' ')

      // Accept @path, @./path, @~/path, or @/path
      // 满足 `path` 时，共享工具执行该分支。
      if (path) {
        // isValidPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isValidPath =
          path.startsWith('./') ||
          path.startsWith('~/') ||
          (path.startsWith('/') && path !== '/') ||
          (!path.startsWith('@') &&
            !path.match(/^[#%^&*()]+/) &&
            path.match(/^[a-zA-Z0-9._-]/))

        // 满足 `isValidPath` 时，共享工具执行该分支。
        if (isValidPath) {
          // resolvedPath 路径数据保存`expandPath`，供共享工具后续处理使用。
          const resolvedPath = expandPath(path, dirname(basePath))
          // 调用 absolutePaths.add，触发共享工具此处需要的副作用。
          absolutePaths.add(resolvedPath)
        }
      }
    }
  }

  // Recursively process elements to find text nodes
  // processElements 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function processElements(elements: MarkdownToken[]) {
    // 按顺序遍历 `elements` 中的element，逐个交给共享工具处理。
    for (const element of elements) {
      // 只有 `element.type === 'code' || element.type === 'code` 满足时，共享工具才执行该分支。
      if (element.type === 'code' || element.type === 'codespan') {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // For html tokens that contain comments, strip the comment spans and
      // check the residual for @paths (e.g. `<!-- note --> @./file.md`).
      // Other html tokens (non-comment tags) are skipped entirely.
      // 当 `element.type` 匹配 `'html'` 时，共享工具执行对应分支。
      if (element.type === 'html') {
        // 原始文本标记共享工具 claudemd是否启用对应路径。
        const raw = element.raw || ''
        // trimmed格式化`raw.trimStart`，供共享工具后续处理使用。
        const trimmed = raw.trimStart()
        // 只有 `trimmed.startsWith('<!--') && trimmed.includes('-->')` 满足时，共享工具才执行该分支。
        if (trimmed.startsWith('<!--') && trimmed.includes('-->')) {
          // commentSpan读取 `/<!--[\s\S]*?-->/g` 对应条目，后续围绕该成员继续处理。
          const commentSpan = /<!--[\s\S]*?-->/g
          // residue格式化`raw.replace`，供共享工具后续处理使用。
          const residue = raw.replace(commentSpan, '')
          // 满足 `residue.trim().length > 0` 时，共享工具执行该分支。
          if (residue.trim().length > 0) {
            // 调用 extractPathsFromText，触发共享工具此处需要的副作用。
            extractPathsFromText(residue)
          }
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Process text nodes
      // 当 `element.type` 匹配 `'text'` 时，共享工具执行对应分支。
      if (element.type === 'text') {
        // 调用 extractPathsFromText，触发共享工具此处需要的副作用。
        extractPathsFromText(element.text || '')
      }

      // Recurse into children tokens
      // 满足 `element.tokens` 时，共享工具执行该分支。
      if (element.tokens) {
        // 调用 processElements，触发共享工具此处需要的副作用。
        processElements(element.tokens)
      }

      // Special handling for list structures
      // 满足 `element.items` 时，共享工具执行该分支。
      if (element.items) {
        // 调用 processElements，触发共享工具此处需要的副作用。
        processElements(element.items)
      }
    }
  }

  // 调用 processElements，触发共享工具此处需要的副作用。
  processElements(tokens as MarkdownToken[])
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...absolutePaths]
}

// MAX_INCLUDE_DEPTH保存`5`，供共享工具 claudemd后续判断或输出使用。
const MAX_INCLUDE_DEPTH = 5

/**
 * Checks whether a CLAUDE.md file path is excluded by the claudeMdExcludes setting.
 * Only applies to User, Project, and Local memory types.
 * Managed, AutoMem, and TeamMem types are never excluded.
 *
 * Matches both the original path and the realpath-resolved path to handle symlinks
 * (e.g., /tmp -> /private/tmp on macOS).
 */
// isClaudeMdExcluded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isClaudeMdExcluded(filePath: string, type: MemoryType): boolean {
  // `type` 与 `'User' && type !== 'Project' &&...` 不一致时刷新派生状态，避免使用过期结果。
  if (type !== 'User' && type !== 'Project' && type !== 'Local') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // patterns 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const patterns = getInitialSettings().claudeMdExcludes
  // !patterns || patterns 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!patterns || patterns.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // matchOpts 集合集中保存共享工具 claudemd要一起传递的字段。
  const matchOpts = { dot: true }
  // normalizedPath 路径数据格式化`filePath.replaceAll`，供共享工具后续处理使用。
  const normalizedPath = filePath.replaceAll('\\', '/')

  // Build an expanded pattern list that includes realpath-resolved versions of
  // absolute patterns. This handles symlinks like /tmp -> /private/tmp on macOS:
  // the user writes "/tmp/project/CLAUDE.md" in their exclude, but the system
  // resolves the CWD to "/private/tmp/project/...", so the file path uses the
  // real path. By resolving the patterns too, both sides match.
  // expandedPatterns 集合读取`resolveExcludePatterns`，供共享工具后续处理使用。
  const expandedPatterns = resolveExcludePatterns(patterns).filter(
    // p更新为 `> p.length > 0`，确保共享工具后续读取最新状态。
    p => p.length > 0,
  )
  // expandedPatterns 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (expandedPatterns.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `picomatch.isMatch(normalizedPath, expandedPatterns, matchOpts)`，作为共享工具这次计算的结果。
  return picomatch.isMatch(normalizedPath, expandedPatterns, matchOpts)
}

/**
 * Expands exclude patterns by resolving symlinks in absolute path prefixes.
 * For each absolute pattern (starting with /), tries to resolve the longest
 * existing directory prefix via realpathSync and adds the resolved version.
 * Glob patterns (containing *) have their static prefix resolved.
 */
// resolveExcludePatterns 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveExcludePatterns(patterns: string[]): string[] {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 这个回调绑定到 const expanded: string[] = patterns.map(p => p.replaceAll('\\', '/'))，负责共享工具在该局部场景下的响应。
  const expanded: string[] = patterns.map(p => p.replaceAll('\\', '/'))

  // 按顺序遍历 `expanded` 中的normalized，逐个交给共享工具处理。
  for (const normalized of expanded) {
    // Only resolve absolute patterns — glob-only patterns like "**/*.md" don't have
    // a filesystem prefix to resolve
    // 满足 `!normalized.startsWith('/')` 时，共享工具执行该分支。
    if (!normalized.startsWith('/')) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Find the static prefix before any glob characters
    // globStart保存`normalized.search`，供共享工具后续处理使用。
    const globStart = normalized.search(/[*?{[]/)
    // staticPrefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const staticPrefix =
      globStart === -1 ? normalized : normalized.slice(0, globStart)
    // dirToResolve保存`dirname`，供共享工具后续处理使用。
    const dirToResolve = dirname(staticPrefix)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // sync IO: called from sync context (isClaudeMdExcluded -> processMemoryFile -> getMemoryFiles)
      // resolvedDir保存`fs.realpathSync`，供共享工具后续处理使用。
      const resolvedDir = fs.realpathSync(dirToResolve).replaceAll('\\', '/')
      // `resolvedDir` 与 `dirToResolve` 不一致时刷新派生状态，避免使用过期结果。
      if (resolvedDir !== dirToResolve) {
        // resolvedPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const resolvedPattern =
          resolvedDir + normalized.slice(dirToResolve.length)
        // expanded追加新条目，保持收集顺序与输入顺序一致。
        expanded.push(resolvedPattern)
      }
    } catch {
      // Directory doesn't exist; skip resolution for this pattern
    }
  }

  // 返回 `expanded`，作为共享工具这次计算的结果。
  return expanded
}

/**
 * Recursively processes a memory file and all its @include references
 * Returns an array of MemoryFileInfo objects with includes first, then main file
 */
// processMemoryFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processMemoryFile(
  filePath: string,
  type: MemoryType,
  processedPaths: Set<string>,
  includeExternal: boolean,
  depth: number = 0,
  parent?: string,
): Promise<MemoryFileInfo[]> {
  // Skip if already processed or max depth exceeded.
  // Normalize paths for comparison to handle Windows drive letter casing
  // differences (e.g., C:\Users vs c:\Users).
  // normalizedPath 路径数据保存`normalizePathForComparison`，供共享工具后续处理使用。
  const normalizedPath = normalizePathForComparison(filePath)
  // 只有 `processedPaths.has(normalizedPath) || depth >= MAX_INCLUDE_DEPTH` 满足时，共享工具才执行该分支。
  if (processedPaths.has(normalizedPath) || depth >= MAX_INCLUDE_DEPTH) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Skip if path is excluded by claudeMdExcludes setting
  // 满足 `isClaudeMdExcluded(filePath, type)` 时，共享工具执行该分支。
  if (isClaudeMdExcluded(filePath, type)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Resolve symlink path early for @import resolution
  // 从 `safeResolvePath(` 解构 resolvedPath、isSymlink，减少共享工具 claudemd对同一对象的重复访问。
  const { resolvedPath, isSymlink } = safeResolvePath(
    getFsImplementation(),
    filePath,
  )

  // 调用 processedPaths.add，触发共享工具此处需要的副作用。
  processedPaths.add(normalizedPath)
  // 满足 `isSymlink` 时，共享工具执行该分支。
  if (isSymlink) {
    // 调用 processedPaths.add，触发共享工具此处需要的副作用。
    processedPaths.add(normalizePathForComparison(resolvedPath))
  }

  // 共享工具 claudemd先整理这一处局部数据，后续分支可以直接读取。
  const { info: memoryFile, includePaths: resolvedIncludePaths } =
    await safelyReadMemoryFileAsync(filePath, type, resolvedPath)
  // 只有 `!memoryFile || !memoryFile.content.trim()` 满足时，共享工具才执行该分支。
  if (!memoryFile || !memoryFile.content.trim()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Add parent information
  // 满足 `parent` 时，共享工具执行该分支。
  if (parent) {
    // parent更新为 `parent`，确保共享工具后续读取最新状态。
    memoryFile.parent = parent
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: MemoryFileInfo[] = []

  // Add the main file first (parent before children)
  // 结果追加新条目，保持收集顺序与输入顺序一致。
  result.push(memoryFile)

  // 按顺序遍历 `resolvedIncludePaths` 中的resolvedIncludePath 路径数据，逐个交给共享工具处理。
  for (const resolvedIncludePath of resolvedIncludePaths) {
    // isExternal记录 `pathInOriginalCwd` 是否成立，共享工具随后按该结果分支。
    const isExternal = !pathInOriginalCwd(resolvedIncludePath)
    // 只有 `isExternal && !includeExternal` 满足时，共享工具才执行该分支。
    if (isExternal && !includeExternal) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Recursively process included files with this file as parent
    // includedFiles 文件数据保存`processMemoryFile`，供共享工具后续处理使用。
    const includedFiles = await processMemoryFile(
      resolvedIncludePath,
      type,
      processedPaths,
      includeExternal,
      depth + 1,
      filePath, // Pass current file as parent
    )
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(...includedFiles)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Processes all .md files in the .claude/rules/ directory and its subdirectories
 * @param rulesDir The path to the rules directory
 * @param type Type of memory file (User, Project, Local)
 * @param processedPaths Set of already processed file paths
 * @param includeExternal Whether to include external files
 * @param conditionalRule If true, only include files with frontmatter paths; if false, only include files without frontmatter paths
 * @param visitedDirs Set of already visited directory real paths (for cycle detection)
 * @returns Array of MemoryFileInfo objects
 */
// processMdRules 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processMdRules({
  rulesDir,
  type,
  processedPaths,
  includeExternal,
  conditionalRule,
  visitedDirs = new Set(),
}: {
  rulesDir: string
  type: MemoryType
  processedPaths: Set<string>
  includeExternal: boolean
  conditionalRule: boolean
  visitedDirs?: Set<string>
}): Promise<MemoryFileInfo[]> {
  // 满足 `visitedDirs.has(rulesDir)` 时，共享工具执行该分支。
  if (visitedDirs.has(rulesDir)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()

    // 从 `safeResolvePath(` 解构 resolvedPath、isSymlink，减少共享工具 claudemd对同一对象的重复访问。
    const { resolvedPath: resolvedRulesDir, isSymlink } = safeResolvePath(
      fs,
      rulesDir,
    )

    // 调用 visitedDirs.add，触发共享工具此处需要的副作用。
    visitedDirs.add(rulesDir)
    // 满足 `isSymlink` 时，共享工具执行该分支。
    if (isSymlink) {
      // 调用 visitedDirs.add，触发共享工具此处需要的副作用。
      visitedDirs.add(resolvedRulesDir)
    }

    // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const result: MemoryFileInfo[] = []
    // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let entries: import('fs').Dirent[]
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合更新为 `await fs.readdir(resolvedRulesDir)`，确保共享工具后续读取最新状态。
      entries = await fs.readdir(resolvedRulesDir)
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 只有 `code === 'ENOENT' || code === 'EACCES' || code ==` 满足时，共享工具才执行该分支。
      if (code === 'ENOENT' || code === 'EACCES' || code === 'ENOTDIR') {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      }
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }

    // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
    for (const entry of entries) {
      // entryPath 路径数据格式化`join`，供共享工具后续处理使用。
      const entryPath = join(rulesDir, entry.name)
      // 从 `safeResolvePath(` 解构 resolvedPath、isSymlink，减少共享工具 claudemd对同一对象的重复访问。
      const { resolvedPath: resolvedEntryPath, isSymlink } = safeResolvePath(
        fs,
        entryPath,
      )

      // Use Dirent methods for non-symlinks to avoid extra stat calls.
      // For symlinks, we need stat to determine what the target is.
      // stats 集合保存`fs.stat`，供共享工具后续处理使用。
      const stats = isSymlink ? await fs.stat(resolvedEntryPath) : null
      // isDirectory记录 `stats.isDirectory` 是否成立，共享工具随后按该结果分支。
      const isDirectory = stats ? stats.isDirectory() : entry.isDirectory()
      // isFile 文件数据记录 `stats.isFile` 是否成立，共享工具随后按该结果分支。
      const isFile = stats ? stats.isFile() : entry.isFile()

      // 满足 `isDirectory` 时，共享工具执行该分支。
      if (isDirectory) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMdRules({
            rulesDir: resolvedEntryPath,
            type,
            processedPaths,
            includeExternal,
            conditionalRule,
            visitedDirs,
          })),
        )
      // 共享工具 claudemd在这里处理 `} else if (isFile && entry.name.endsWith('.md')) {`，完成这一小步状态转换。
      } else if (isFile && entry.name.endsWith('.md')) {
        // files 文件数据保存`processMemoryFile`，供共享工具后续处理使用。
        const files = await processMemoryFile(
          resolvedEntryPath,
          type,
          processedPaths,
          includeExternal,
        )
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
          ...files.filter(f => (conditionalRule ? f.globs : !f.globs)),
        )
      }
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 只有 `error instanceof Error && error.message.includes('EACCES')` 满足时，共享工具才执行该分支。
    if (error instanceof Error && error.message.includes('EACCES')) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_claude_rules_md_permission_error', {
        is_access_error: 1,
        has_home_dir: rulesDir.includes(getClaudeConfigHomeDir()) ? 1 : 0,
      })
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// getMemoryFiles 文件数据保存`memoize`，供共享工具后续处理使用。
export const getMemoryFiles = memoize(
  async (forceIncludeExternal: boolean = false): Promise<MemoryFileInfo[]> => {
    // startTime记录时间`Date.now`，供共享工具后续处理使用。
    const startTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'memory_files_started')

    // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const result: MemoryFileInfo[] = []
    // processedPaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
    const processedPaths = new Set<string>()
    // 配置读取`getCurrentProjectConfig`，供共享工具后续处理使用。
    const config = getCurrentProjectConfig()
    // includeExternal 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const includeExternal =
      forceIncludeExternal ||
      config.hasClaudeMdExternalIncludesApproved ||
      false

    // Process Managed file first (always loaded - policy settings)
    // managedClaudeMd读取`getMemoryPath`，供共享工具后续处理使用。
    const managedClaudeMd = getMemoryPath('Managed')
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processMemoryFile(
        managedClaudeMd,
        'Managed',
        processedPaths,
        includeExternal,
      )),
    )
    // Process Managed .claude/rules/*.md files
    // managedClaudeRulesDir读取`getManagedClaudeRulesDir`，供共享工具后续处理使用。
    const managedClaudeRulesDir = getManagedClaudeRulesDir()
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processMdRules({
        rulesDir: managedClaudeRulesDir,
        type: 'Managed',
        processedPaths,
        includeExternal,
        conditionalRule: false,
      })),
    )

    // Process User file (only if userSettings is enabled)
    // 满足 `isSettingSourceEnabled('userSettings')` 时，共享工具执行该分支。
    if (isSettingSourceEnabled('userSettings')) {
      // userClaudeMd读取`getMemoryPath`，供共享工具后续处理使用。
      const userClaudeMd = getMemoryPath('User')
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(
        ...(await processMemoryFile(
          userClaudeMd,
          'User',
          processedPaths,
          true, // User memory can always include external files
        )),
      )
      // Process User ~/.claude/rules/*.md files
      // userClaudeRulesDir读取`getUserClaudeRulesDir`，供共享工具后续处理使用。
      const userClaudeRulesDir = getUserClaudeRulesDir()
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(
        ...(await processMdRules({
          rulesDir: userClaudeRulesDir,
          type: 'User',
          processedPaths,
          includeExternal: true,
          conditionalRule: false,
        })),
      )
    }

    // Then process Project and Local files
    // dirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const dirs: string[] = []
    // originalCwd读取`getOriginalCwd`，供共享工具后续处理使用。
    const originalCwd = getOriginalCwd()
    // currentDir保存`originalCwd`，供共享工具 claudemd后续判断或输出使用。
    let currentDir = originalCwd

    // 只要 currentDir !== parse(currentDir).root 成立，就持续推进共享工具中的循环处理。
    while (currentDir !== parse(currentDir).root) {
      // dirs 集合追加新条目，保持收集顺序与输入顺序一致。
      dirs.push(currentDir)
      // currentDir更新为 `dirname(currentDir)`，确保共享工具后续读取最新状态。
      currentDir = dirname(currentDir)
    }

    // When running from a git worktree nested inside its main repo (e.g.,
    // .claude/worktrees/<name>/ from `claude -w`), the upward walk passes
    // through both the worktree root and the main repo root. Both contain
    // checked-in files like CLAUDE.md and .claude/rules/*.md, so the same
    // content gets loaded twice. Skip Project-type (checked-in) files from
    // directories above the worktree but within the main repo — the worktree
    // already has its own checkout. CLAUDE.local.md is gitignored so it only
    // exists in the main repo and is still loaded.
    // See: https://github.com/anthropics/claude-code/issues/29599
    // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
    const gitRoot = findGitRoot(originalCwd)
    // canonicalRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
    const canonicalRoot = findCanonicalGitRoot(originalCwd)
    // isNestedWorktree 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isNestedWorktree =
      gitRoot !== null &&
      canonicalRoot !== null &&
      normalizePathForComparison(gitRoot) !==
        normalizePathForComparison(canonicalRoot) &&
      pathInWorkingPath(gitRoot, canonicalRoot)

    // Process from root downward to CWD
    // 逐项读取 `dirs.reverse()` 中的dir，按输入顺序推进共享工具。
    for (const dir of dirs.reverse()) {
      // In a nested worktree, skip checked-in files from the main repo's
      // working tree (dirs inside canonicalRoot but outside the worktree).
      // skipProject 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const skipProject =
        isNestedWorktree &&
        pathInWorkingPath(dir, canonicalRoot) &&
        !pathInWorkingPath(dir, gitRoot)

      // Try reading CLAUDE.md (Project) - only if projectSettings is enabled
      // 只有 `isSettingSourceEnabled('projectSettings') && !skipProject` 满足时，共享工具才执行该分支。
      if (isSettingSourceEnabled('projectSettings') && !skipProject) {
        // projectPath 路径数据格式化`join`，供共享工具后续处理使用。
        const projectPath = join(dir, 'CLAUDE.md')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMemoryFile(
            projectPath,
            'Project',
            processedPaths,
            includeExternal,
          )),
        )

        // Try reading .claude/CLAUDE.md (Project)
        // dotClaudePath 路径数据格式化`join`，供共享工具后续处理使用。
        const dotClaudePath = join(dir, '.claude', 'CLAUDE.md')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMemoryFile(
            dotClaudePath,
            'Project',
            processedPaths,
            includeExternal,
          )),
        )

        // Try reading .claude/rules/*.md files (Project)
        // rulesDir格式化`join`，供共享工具后续处理使用。
        const rulesDir = join(dir, '.claude', 'rules')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMdRules({
            rulesDir,
            type: 'Project',
            processedPaths,
            includeExternal,
            conditionalRule: false,
          })),
        )
      }

      // Try reading CLAUDE.local.md (Local) - only if localSettings is enabled
      // 满足 `isSettingSourceEnabled('localSettings')` 时，共享工具执行该分支。
      if (isSettingSourceEnabled('localSettings')) {
        // localPath 路径数据格式化`join`，供共享工具后续处理使用。
        const localPath = join(dir, 'CLAUDE.local.md')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMemoryFile(
            localPath,
            'Local',
            processedPaths,
            includeExternal,
          )),
        )
      }
    }

    // Process CLAUDE.md from additional directories (--add-dir) if env var is enabled
    // This is controlled by CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD and defaults to off
    // Note: we don't check isSettingSourceEnabled('projectSettings') here because --add-dir
    // is an explicit user action and the SDK defaults settingSources to [] when not specified
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD)) {
      // additionalDirs 集合读取`getAdditionalDirectoriesForClaudeMd`，供共享工具后续处理使用。
      const additionalDirs = getAdditionalDirectoriesForClaudeMd()
      // 按顺序遍历 `additionalDirs` 中的dir，逐个交给共享工具处理。
      for (const dir of additionalDirs) {
        // Try reading CLAUDE.md from the additional directory
        // projectPath 路径数据格式化`join`，供共享工具后续处理使用。
        const projectPath = join(dir, 'CLAUDE.md')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMemoryFile(
            projectPath,
            'Project',
            processedPaths,
            includeExternal,
          )),
        )

        // Try reading .claude/CLAUDE.md from the additional directory
        // dotClaudePath 路径数据格式化`join`，供共享工具后续处理使用。
        const dotClaudePath = join(dir, '.claude', 'CLAUDE.md')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMemoryFile(
            dotClaudePath,
            'Project',
            processedPaths,
            includeExternal,
          )),
        )

        // Try reading .claude/rules/*.md files from the additional directory
        // rulesDir格式化`join`，供共享工具后续处理使用。
        const rulesDir = join(dir, '.claude', 'rules')
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          ...(await processMdRules({
            rulesDir,
            type: 'Project',
            processedPaths,
            includeExternal,
            conditionalRule: false,
          })),
        )
      }
    }

    // Memdir entrypoint (memory.md) - only if feature is on and file exists
    // 满足 `isAutoMemoryEnabled()` 时，共享工具执行该分支。
    if (isAutoMemoryEnabled()) {
      // 从 `await safelyReadMemoryFileAsync(` 解构 info，减少共享工具 claudemd对同一对象的重复访问。
      const { info: memdirEntry } = await safelyReadMemoryFileAsync(
        getAutoMemEntrypoint(),
        'AutoMem',
      )
      // 满足 `memdirEntry` 时，共享工具执行该分支。
      if (memdirEntry) {
        // normalizedPath 路径数据保存`normalizePathForComparison`，供共享工具后续处理使用。
        const normalizedPath = normalizePathForComparison(memdirEntry.path)
        // 满足 `!processedPaths.has(normalizedPath)` 时，共享工具执行该分支。
        if (!processedPaths.has(normalizedPath)) {
          // 调用 processedPaths.add，触发共享工具此处需要的副作用。
          processedPaths.add(normalizedPath)
          // 结果追加新条目，保持收集顺序与输入顺序一致。
          result.push(memdirEntry)
        }
      }
    }

    // Team memory entrypoint - only if feature is on and file exists
    // 只有 `feature('TEAMMEM') && teamMemPaths!.isTeamMemoryEnabled()` 满足时，共享工具才执行该分支。
    if (feature('TEAMMEM') && teamMemPaths!.isTeamMemoryEnabled()) {
      // 从 `await safelyReadMemoryFileAsync(` 解构 info，减少共享工具 claudemd对同一对象的重复访问。
      const { info: teamMemEntry } = await safelyReadMemoryFileAsync(
        teamMemPaths!.getTeamMemEntrypoint(),
        'TeamMem',
      )
      // 满足 `teamMemEntry` 时，共享工具执行该分支。
      if (teamMemEntry) {
        // normalizedPath 路径数据保存`normalizePathForComparison`，供共享工具后续处理使用。
        const normalizedPath = normalizePathForComparison(teamMemEntry.path)
        // 满足 `!processedPaths.has(normalizedPath)` 时，共享工具执行该分支。
        if (!processedPaths.has(normalizedPath)) {
          // 调用 processedPaths.add，触发共享工具此处需要的副作用。
          processedPaths.add(normalizedPath)
          // 结果追加新条目，保持收集顺序与输入顺序一致。
          result.push(teamMemEntry)
        }
      }
    }

    // totalContentLength 数量派生`result.reduce`，供共享工具后续处理使用。
    const totalContentLength = result.reduce(
      // 这个回调绑定到 (sum, f) => sum + f.content.length,，负责共享工具在该局部场景下的响应。
      (sum, f) => sum + f.content.length,
      0,
    )

    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'memory_files_completed', {
      duration_ms: Date.now() - startTime,
      file_count: result.length,
      total_content_length: totalContentLength,
    })

    // typeCounts 数量 从空对象开始收集键值，后续按名称补齐内容。
    const typeCounts: Record<string, number> = {}
    // 按顺序遍历 `result` 中的f，逐个交给共享工具处理。
    for (const f of result) {
      // type更新为 `(typeCounts[f.type] ?? 0) + 1`，确保共享工具 claudemd后续读取最新状态。
      typeCounts[f.type] = (typeCounts[f.type] ?? 0) + 1
    }

    // hasLoggedInitialLoad缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!hasLoggedInitialLoad) {
      // hasLoggedInitialLoad更新为 `true`，确保共享工具后续读取最新状态。
      hasLoggedInitialLoad = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_claudemd__initial_load', {
        file_count: result.length,
        total_content_length: totalContentLength,
        user_count: typeCounts['User'] ?? 0,
        project_count: typeCounts['Project'] ?? 0,
        local_count: typeCounts['Local'] ?? 0,
        managed_count: typeCounts['Managed'] ?? 0,
        automem_count: typeCounts['AutoMem'] ?? 0,
        ...(feature('TEAMMEM')
          ? { teammem_count: typeCounts['TeamMem'] ?? 0 }
          : {}),
        duration_ms: Date.now() - startTime,
      })
    }

    // Fire InstructionsLoaded hook for each instruction file loaded
    // (fire-and-forget, audit/observability only).
    // AutoMem/TeamMem are intentionally excluded — they're a separate
    // memory system, not "instructions" in the CLAUDE.md/rules sense.
    // Gated on !forceIncludeExternal: the forceIncludeExternal=true variant
    // is only used by getExternalClaudeMdIncludes() for approval checks, not
    // for building context — firing the hook there would double-fire on startup.
    // The one-shot flag is consumed on every !forceIncludeExternal cache miss
    // (NOT gated on hasInstructionsLoadedHook) so the flag is released even
    // when no hook is configured — otherwise a mid-session hook registration
    // followed by a direct .cache.clear() would spuriously fire with a stale
    // 'session_start' reason.
    // forceIncludeExternal缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!forceIncludeExternal) {
      // eagerLoadReason保存`consumeNextEagerLoadReason`，供共享工具后续处理使用。
      const eagerLoadReason = consumeNextEagerLoadReason()
      // `eagerLoadReason` 与 `undefined && hasInstructionsLoa...` 不一致时刷新派生状态，避免使用过期结果。
      if (eagerLoadReason !== undefined && hasInstructionsLoadedHook()) {
        // 按顺序遍历 `result` 中的file 文件数据，逐个交给共享工具处理。
        for (const file of result) {
          // 满足 `!isInstructionsMemoryType(file.type)` 时，共享工具执行该分支。
          if (!isInstructionsMemoryType(file.type)) continue
          // loadReason保存`file.parent ? 'include' : eagerLoadReason`，供后续判断或组装使用。
          const loadReason = file.parent ? 'include' : eagerLoadReason
          // 显式忽略 `executeInstructionsLoadedHooks(` 的返回值，只保留它触发的副作用。
          void executeInstructionsLoadedHooks(
            file.path,
            file.type,
            loadReason,
            {
              globs: file.globs,
              parentFilePath: file.parent,
            },
          )
        }
      }
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  },
)

// isInstructionsMemoryType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInstructionsMemoryType(
  type: MemoryType,
): type is InstructionsMemoryType {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    type === 'User' ||
    type === 'Project' ||
    type === 'Local' ||
    type === 'Managed'
  )
}

// Load reason to report for top-level (non-included) files on the next eager
// getMemoryFiles() pass. Set to 'compact' by resetGetMemoryFilesCache when
// compaction clears the cache, so the InstructionsLoaded hook reports the
// reload correctly instead of misreporting it as 'session_start'. One-shot:
// reset to 'session_start' after being read.
// nextEagerLoadReason保存`'session_start'`，作为后续固定文本处理的输入。
let nextEagerLoadReason: InstructionsLoadReason = 'session_start'

// Whether the InstructionsLoaded hook should fire on the next cache miss.
// true initially (for session_start), consumed after firing, re-enabled only
// by resetGetMemoryFilesCache(). Callers that only need cache invalidation
// for correctness (e.g. worktree enter/exit, settings sync, /memory dialog)
// should use clearMemoryFileCaches() instead to avoid spurious hook fires.
// shouldFireHook标记共享工具 claudemd是否启用对应路径。
let shouldFireHook = true

// consumeNextEagerLoadReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function consumeNextEagerLoadReason(): InstructionsLoadReason | undefined {
  // shouldFireHook缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shouldFireHook) return undefined
  // shouldFireHook更新为 `false`，确保共享工具后续读取最新状态。
  shouldFireHook = false
  // reason保存`nextEagerLoadReason`，供共享工具 claudemd后续判断或输出使用。
  const reason = nextEagerLoadReason
  // nextEagerLoadReason更新为 `'session_start'`，确保共享工具后续读取最新状态。
  nextEagerLoadReason = 'session_start'
  // 返回 `reason`，作为共享工具这次计算的结果。
  return reason
}

/**
 * Clears the getMemoryFiles memoize cache
 * without firing the InstructionsLoaded hook.
 *
 * Use this for cache invalidation that is purely for correctness (e.g.
 * worktree enter/exit, settings sync, /memory dialog). For events that
 * represent instructions actually being reloaded into context (e.g.
 * compaction), use resetGetMemoryFilesCache() instead.
 */
// clearMemoryFileCaches 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMemoryFileCaches(): void {
  // ?.cache because tests spyOn this, which replaces the memoize wrapper.
  // 调用 getMemoryFiles.cache?.clear?.()，完成这一处局部操作。
  getMemoryFiles.cache?.clear?.()
}

// resetGetMemoryFilesCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetGetMemoryFilesCache(
  reason: InstructionsLoadReason = 'session_start',
): void {
  // nextEagerLoadReason更新为 `reason`，确保共享工具后续读取最新状态。
  nextEagerLoadReason = reason
  // shouldFireHook更新为 `true`，确保共享工具后续读取最新状态。
  shouldFireHook = true
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearMemoryFileCaches()
}

// getLargeMemoryFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLargeMemoryFiles(files: MemoryFileInfo[]): MemoryFileInfo[] {
  // 返回 `files.filter(f => f.content.length > MAX_MEMORY_CHARACTER_COUNT)`，作为共享工具这次计算的结果。
  return files.filter(f => f.content.length > MAX_MEMORY_CHARACTER_COUNT)
}

/**
 * When tengu_moth_copse is on, the findRelevantMemories prefetch surfaces
 * memory files via attachments, so the MEMORY.md index is no longer injected
 * into the system prompt. Callsites that care about "what's actually in
 * context" (context builder, /context viz) should filter through this.
 */
// filterInjectedMemoryFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterInjectedMemoryFiles(
  files: MemoryFileInfo[],
): MemoryFileInfo[] {
  // skipMemoryIndex 索引读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
  const skipMemoryIndex = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_moth_copse',
    false,
  )
  // skipMemoryIndex 索引缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!skipMemoryIndex) return files
  // 返回 `files.filter(f => f.type !== 'AutoMem' && f.type !== 'TeamMem')`，作为共享工具这次计算的结果。
  return files.filter(f => f.type !== 'AutoMem' && f.type !== 'TeamMem')
}

// getClaudeMds 集合保存`(`，供共享工具 claudemd后续判断或输出使用。
export const getClaudeMds = (
  memoryFiles: MemoryFileInfo[],
  filter?: (type: MemoryType) => boolean,
): string => {
  // memories 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const memories: string[] = []
  // skipProjectLevel读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
  const skipProjectLevel = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_paper_halyard',
    false,
  )

  // 按顺序遍历 `memoryFiles` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of memoryFiles) {
    // 只有 `filter && !filter(file.type)` 满足时，共享工具才执行该分支。
    if (filter && !filter(file.type)) continue
    // 只有 `skipProjectLevel && (file.type === 'Project' || file.type === 'Local')` 满足时，共享工具才执行该分支。
    if (skipProjectLevel && (file.type === 'Project' || file.type === 'Local'))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    // 满足 `file.content` 时，共享工具执行该分支。
    if (file.content) {
      // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const description =
        file.type === 'Project'
          ? ' (project instructions, checked into the codebase)'
          : file.type === 'Local'
            ? " (user's private project instructions, not checked in)"
            : feature('TEAMMEM') && file.type === 'TeamMem'
              ? ' (shared team memory, synced across the organization)'
              : file.type === 'AutoMem'
                ? " (user's auto-memory, persists across conversations)"
                : " (user's private global instructions for all projects)"

      // 文本内容格式化`content.trim`，供共享工具后续处理使用。
      const content = file.content.trim()
      // 当 `feature('TEAMMEM') && file.type` 匹配 `'TeamMem'` 时，共享工具执行对应分支。
      if (feature('TEAMMEM') && file.type === 'TeamMem') {
        // memories 集合追加新条目，保持收集顺序与输入顺序一致。
        memories.push(
          `Contents of ${file.path}${description}:\n\n<team-memory-content source="shared">\n${content}\n</team-memory-content>`,
        )
      } else {
        // memories 集合追加新条目，保持收集顺序与输入顺序一致。
        memories.push(`Contents of ${file.path}${description}:\n\n${content}`)
      }
    }
  }

  // memories 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (memories.length === 0) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 返回 ``${MEMORY_INSTRUCTION_PROMPT}\n\n${memories.join('\n\n')}``，作为共享工具这次计算的结果。
  return `${MEMORY_INSTRUCTION_PROMPT}\n\n${memories.join('\n\n')}`
}

/**
 * Gets managed and user conditional rules that match the target path.
 * This is the first phase of nested memory loading.
 *
 * @param targetPath The target file path to match against glob patterns
 * @param processedPaths Set of already processed file paths (will be mutated)
 * @returns Array of MemoryFileInfo objects for matching conditional rules
 */
// getManagedAndUserConditionalRules 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getManagedAndUserConditionalRules(
  targetPath: string,
  processedPaths: Set<string>,
): Promise<MemoryFileInfo[]> {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: MemoryFileInfo[] = []

  // Process Managed conditional .claude/rules/*.md files
  // managedClaudeRulesDir读取`getManagedClaudeRulesDir`，供共享工具后续处理使用。
  const managedClaudeRulesDir = getManagedClaudeRulesDir()
  // 结果追加新条目，保持收集顺序与输入顺序一致。
  result.push(
    ...(await processConditionedMdRules(
      targetPath,
      managedClaudeRulesDir,
      'Managed',
      processedPaths,
      false,
    )),
  )

  // 满足 `isSettingSourceEnabled('userSettings')` 时，共享工具执行该分支。
  if (isSettingSourceEnabled('userSettings')) {
    // Process User conditional .claude/rules/*.md files
    // userClaudeRulesDir读取`getUserClaudeRulesDir`，供共享工具后续处理使用。
    const userClaudeRulesDir = getUserClaudeRulesDir()
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processConditionedMdRules(
        targetPath,
        userClaudeRulesDir,
        'User',
        processedPaths,
        true,
      )),
    )
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Gets memory files for a single nested directory (between CWD and target).
 * Loads CLAUDE.md, unconditional rules, and conditional rules for that directory.
 *
 * @param dir The directory to process
 * @param targetPath The target file path (for conditional rule matching)
 * @param processedPaths Set of already processed file paths (will be mutated)
 * @returns Array of MemoryFileInfo objects
 */
// getMemoryFilesForNestedDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMemoryFilesForNestedDirectory(
  dir: string,
  targetPath: string,
  processedPaths: Set<string>,
): Promise<MemoryFileInfo[]> {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: MemoryFileInfo[] = []

  // Process project memory files (CLAUDE.md and .claude/CLAUDE.md)
  // 满足 `isSettingSourceEnabled('projectSettings')` 时，共享工具执行该分支。
  if (isSettingSourceEnabled('projectSettings')) {
    // projectPath 路径数据格式化`join`，供共享工具后续处理使用。
    const projectPath = join(dir, 'CLAUDE.md')
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processMemoryFile(
        projectPath,
        'Project',
        processedPaths,
        false,
      )),
    )
    // dotClaudePath 路径数据格式化`join`，供共享工具后续处理使用。
    const dotClaudePath = join(dir, '.claude', 'CLAUDE.md')
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processMemoryFile(
        dotClaudePath,
        'Project',
        processedPaths,
        false,
      )),
    )
  }

  // Process local memory file (CLAUDE.local.md)
  // 满足 `isSettingSourceEnabled('localSettings')` 时，共享工具执行该分支。
  if (isSettingSourceEnabled('localSettings')) {
    // localPath 路径数据格式化`join`，供共享工具后续处理使用。
    const localPath = join(dir, 'CLAUDE.local.md')
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(
      ...(await processMemoryFile(localPath, 'Local', processedPaths, false)),
    )
  }

  // rulesDir格式化`join`，供共享工具后续处理使用。
  const rulesDir = join(dir, '.claude', 'rules')

  // Process project unconditional .claude/rules/*.md files, which were not eagerly loaded
  // Use a separate processedPaths set to avoid marking conditional rule files as processed
  // unconditionalProcessedPaths 路径数据保存`Set`，供共享工具后续处理使用。
  const unconditionalProcessedPaths = new Set(processedPaths)
  // 结果追加新条目，保持收集顺序与输入顺序一致。
  result.push(
    ...(await processMdRules({
      rulesDir,
      type: 'Project',
      processedPaths: unconditionalProcessedPaths,
      includeExternal: false,
      conditionalRule: false,
    })),
  )

  // Process project conditional .claude/rules/*.md files
  // 结果追加新条目，保持收集顺序与输入顺序一致。
  result.push(
    ...(await processConditionedMdRules(
      targetPath,
      rulesDir,
      'Project',
      processedPaths,
      false,
    )),
  )

  // processedPaths must be seeded with unconditional paths for subsequent directories
  // 按顺序遍历 `unconditionalProcessedPaths` 中的路径，逐个交给共享工具处理。
  for (const path of unconditionalProcessedPaths) {
    // 调用 processedPaths.add，触发共享工具此处需要的副作用。
    processedPaths.add(path)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Gets conditional rules for a CWD-level directory (from root up to CWD).
 * Only processes conditional rules since unconditional rules are already loaded eagerly.
 *
 * @param dir The directory to process
 * @param targetPath The target file path (for conditional rule matching)
 * @param processedPaths Set of already processed file paths (will be mutated)
 * @returns Array of MemoryFileInfo objects
 */
// getConditionalRulesForCwdLevelDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getConditionalRulesForCwdLevelDirectory(
  dir: string,
  targetPath: string,
  processedPaths: Set<string>,
): Promise<MemoryFileInfo[]> {
  // rulesDir格式化`join`，供共享工具后续处理使用。
  const rulesDir = join(dir, '.claude', 'rules')
  // 返回 `processConditionedMdRules(`，作为共享工具这次计算的结果。
  return processConditionedMdRules(
    targetPath,
    rulesDir,
    'Project',
    processedPaths,
    false,
  )
}

/**
 * Processes all .md files in the .claude/rules/ directory and its subdirectories,
 * filtering to only include files with frontmatter paths that match the target path
 * @param targetPath The file path to match against frontmatter glob patterns
 * @param rulesDir The path to the rules directory
 * @param type Type of memory file (User, Project, Local)
 * @param processedPaths Set of already processed file paths
 * @param includeExternal Whether to include external files
 * @returns Array of MemoryFileInfo objects that match the target path
 */
// processConditionedMdRules 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processConditionedMdRules(
  targetPath: string,
  rulesDir: string,
  type: MemoryType,
  processedPaths: Set<string>,
  includeExternal: boolean,
): Promise<MemoryFileInfo[]> {
  // conditionedRuleMdFiles 文件数据保存`processMdRules`，供共享工具后续处理使用。
  const conditionedRuleMdFiles = await processMdRules({
    rulesDir,
    type,
    processedPaths,
    includeExternal,
    conditionalRule: true,
  })

  // Filter to only include files whose globs patterns match the targetPath
  // 返回 `conditionedRuleMdFiles.filter(file => {`，作为共享工具这次计算的结果。
  return conditionedRuleMdFiles.filter(file => {
    // !file.globs || file.globs 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (!file.globs || file.globs.length === 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // For Project rules: glob patterns are relative to the directory containing .claude
    // For Managed/User rules: glob patterns are relative to the original CWD
    // baseDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baseDir =
      type === 'Project'
        ? dirname(dirname(rulesDir)) // Parent of .claude
        : getOriginalCwd() // Project root for managed/user rules

    // relativePath 路径数据保存`isAbsolute`，供共享工具后续处理使用。
    const relativePath = isAbsolute(targetPath)
      ? relative(baseDir, targetPath)
      : targetPath
    // ignore() throws on empty strings, paths escaping the base (../),
    // and absolute paths (Windows cross-drive relative() returns absolute).
    // Files outside baseDir can't match baseDir-relative globs anyway.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !relativePath ||
      relativePath.startsWith('..') ||
      isAbsolute(relativePath)
    ) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 `ignore().add(file.globs).ignores(relativePath)`，作为共享工具这次计算的结果。
    return ignore().add(file.globs).ignores(relativePath)
  })
}

// ExternalClaudeMdInclude 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExternalClaudeMdInclude = {
  path: string
  parent: string
}

// getExternalClaudeMdIncludes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getExternalClaudeMdIncludes(
  files: MemoryFileInfo[],
): ExternalClaudeMdInclude[] {
  // externals 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const externals: ExternalClaudeMdInclude[] = []
  // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of files) {
    // `file.type` 与 `'User' && file.parent && !pathI...` 不一致时刷新派生状态，避免使用过期结果。
    if (file.type !== 'User' && file.parent && !pathInOriginalCwd(file.path)) {
      // externals 集合追加新条目，保持收集顺序与输入顺序一致。
      externals.push({ path: file.path, parent: file.parent })
    }
  }
  // 返回 `externals`，作为共享工具这次计算的结果。
  return externals
}

// hasExternalClaudeMdIncludes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasExternalClaudeMdIncludes(files: MemoryFileInfo[]): boolean {
  // 返回 `getExternalClaudeMdIncludes(files).length > 0`，作为共享工具这次计算的结果。
  return getExternalClaudeMdIncludes(files).length > 0
}

// shouldShowClaudeMdExternalIncludesWarning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shouldShowClaudeMdExternalIncludesWarning(): Promise<boolean> {
  // 配置读取`getCurrentProjectConfig`，供共享工具后续处理使用。
  const config = getCurrentProjectConfig()
  // 共享工具在这里按实际状态进入对应分支。
  if (
    config.hasClaudeMdExternalIncludesApproved ||
    config.hasClaudeMdExternalIncludesWarningShown
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `hasExternalClaudeMdIncludes(await getMemoryFiles(true))`，作为共享工具这次计算的结果。
  return hasExternalClaudeMdIncludes(await getMemoryFiles(true))
}

/**
 * Check if a file path is a memory file (CLAUDE.md, CLAUDE.local.md, or .claude/rules/*.md)
 */
// isMemoryFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMemoryFilePath(filePath: string): boolean {
  // 名称保存`basename`，供共享工具后续处理使用。
  const name = basename(filePath)

  // CLAUDE.md or CLAUDE.local.md anywhere
  // 当 `name` 匹配 `'CLAUDE.md' || name === 'CL...` 时，共享工具执行对应分支。
  if (name === 'CLAUDE.md' || name === 'CLAUDE.local.md') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // .md files in .claude/rules/ directories
  // 共享工具在这里按实际状态进入对应分支。
  if (
    name.endsWith('.md') &&
    filePath.includes(`${sep}.claude${sep}rules${sep}`)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get all memory file paths from both standard discovery and readFileState.
 * Combines:
 * - getMemoryFiles() paths (CWD upward to root)
 * - readFileState paths matching memory patterns (includes child directories)
 */
// getAllMemoryFilePaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllMemoryFilePaths(
  files: MemoryFileInfo[],
  readFileState: FileStateCache,
): string[] {
  // 路径列表构建`new Set<string>()` 整理出中间结果，供共享工具 claudemd后续步骤使用。
  const paths = new Set<string>()
  // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of files) {
    // 满足 `file.content.trim().length > 0` 时，共享工具执行该分支。
    if (file.content.trim().length > 0) {
      // 调用 paths.add，触发共享工具此处需要的副作用。
      paths.add(file.path)
    }
  }

  // Add memory files from readFileState (includes child directories)
  // 逐项读取 `cacheKeys(readFileState)` 中的文件路径，按输入顺序推进共享工具。
  for (const filePath of cacheKeys(readFileState)) {
    // 满足 `isMemoryFilePath(filePath)` 时，共享工具执行该分支。
    if (isMemoryFilePath(filePath)) {
      // 调用 paths.add，触发共享工具此处需要的副作用。
      paths.add(filePath)
    }
  }

  // 返回 `Array.from(paths)`，作为共享工具这次计算的结果。
  return Array.from(paths)
}
