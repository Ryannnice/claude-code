/**
 * Portable session storage utilities.
 *
 * Pure Node.js — no internal dependencies on logging, experiments, or feature
 * flags. Shared between the CLI (src/utils/sessionStorage.ts) and the VS Code
 * extension (packages/claude-vscode/src/common-host/sessionStorage.ts).
 */

// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open as fsOpen, readdir, realpath, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 getWorktreePathsPortable，将 ./getWorktreePathsPortable.js 中已经封装好的能力接到本文件流程里。
import { getWorktreePathsPortable } from './getWorktreePathsPortable.js'
// 引入 djb2Hash，将 ./hash.js 中已经封装好的能力接到本文件流程里。
import { djb2Hash } from './hash.js'

/** Size of the head/tail buffer for lite metadata reads. */
// LITE_READ_BUF_SIZE保存`65536`，供后续判断或组装使用。
export const LITE_READ_BUF_SIZE = 65536

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------

// uuidRegex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// validateUuid 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateUuid(maybeUuid: unknown): UUID | null {
  // `typeof maybeUuid` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof maybeUuid !== 'string') return null
  // 返回 `uuidRegex.test(maybeUuid) ? (maybeUuid as UUID) : null`，作为共享工具这次计算的结果。
  return uuidRegex.test(maybeUuid) ? (maybeUuid as UUID) : null
}

// ---------------------------------------------------------------------------
// JSON string field extraction — no full parse, works on truncated lines
// ---------------------------------------------------------------------------

/**
 * Unescape a JSON string value extracted as raw text.
 * Only allocates a new string when escape sequences are present.
 */
// unescapeJsonString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unescapeJsonString(raw: string): string {
  // 满足 `!raw.includes('\\')` 时，共享工具执行该分支。
  if (!raw.includes('\\')) return raw
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `JSON.parse(`"${raw}"`)`，作为共享工具这次计算的结果。
    return JSON.parse(`"${raw}"`)
  } catch {
    // 返回 `raw`，作为共享工具这次计算的结果。
    return raw
  }
}

/**
 * Extracts a simple JSON string field value from raw text without full parsing.
 * Looks for `"key":"value"` or `"key": "value"` patterns.
 * Returns the first match, or undefined if not found.
 */
// extractJsonStringField 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractJsonStringField(
  text: string,
  key: string,
): string | undefined {
  // patterns 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const patterns = [`"${key}":"`, `"${key}": "`]
  // 按顺序遍历 `patterns` 中的pattern，逐个交给共享工具处理。
  for (const pattern of patterns) {
    // idx保存`text.indexOf`，供共享工具后续处理使用。
    const idx = text.indexOf(pattern)
    // 满足 `idx < 0` 时，共享工具执行该分支。
    if (idx < 0) continue

    // valueStart保存 `idx + pattern.length` 的判断结果，供共享工具 session Storage Portable后续分支直接复用。
    const valueStart = idx + pattern.length
    // i保存`valueStart`，供后续判断或组装使用。
    let i = valueStart
    // while 使用 i < text.length 完成共享工具里的对应操作。
    while (i < text.length) {
      // 当 `text[i]` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (text[i] === '\\') {
        // 共享工具 session Storage Portable在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `text[i]` 匹配 `'"'` 时，共享工具执行对应分支。
      if (text[i] === '"') {
        // 返回 `unescapeJsonString(text.slice(valueStart, i))`，作为共享工具这次计算的结果。
        return unescapeJsonString(text.slice(valueStart, i))
      }
      // 共享工具 session Storage Portable在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Like extractJsonStringField but finds the LAST occurrence.
 * Useful for fields that are appended (customTitle, tag, etc.).
 */
// extractLastJsonStringField 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractLastJsonStringField(
  text: string,
  key: string,
): string | undefined {
  // patterns 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const patterns = [`"${key}":"`, `"${key}": "`]
  // lastValue 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastValue: string | undefined
  // 按顺序遍历 `patterns` 中的pattern，逐个交给共享工具处理。
  for (const pattern of patterns) {
    // searchFrom 命名 `0`，让后续代码直接表达这个值的用途。
    let searchFrom = 0
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // idx保存`text.indexOf`，供共享工具后续处理使用。
      const idx = text.indexOf(pattern, searchFrom)
      // 满足 `idx < 0` 时，共享工具执行该分支。
      if (idx < 0) break

      // valueStart保存 `idx + pattern.length` 的判断结果，供共享工具 session Storage Portable后续分支直接复用。
      const valueStart = idx + pattern.length
      // i保存`valueStart`，供后续判断或组装使用。
      let i = valueStart
      // while 使用 i < text.length 完成共享工具里的对应操作。
      while (i < text.length) {
        // 当 `text[i]` 匹配 `'\\'` 时，共享工具执行对应分支。
        if (text[i] === '\\') {
          // 共享工具 session Storage Portable在这里处理 `i += 2`，完成这一小步状态转换。
          i += 2
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 当 `text[i]` 匹配 `'"'` 时，共享工具执行对应分支。
        if (text[i] === '"') {
          // lastValue更新为 `unescapeJsonString(text.slice(valueStart, i))`，确保共享工具后续读取最新状态。
          lastValue = unescapeJsonString(text.slice(valueStart, i))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 共享工具 session Storage Portable在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
      // searchFrom更新为 `i + 1`，确保共享工具后续读取最新状态。
      searchFrom = i + 1
    }
  }
  // 返回 `lastValue`，作为共享工具这次计算的结果。
  return lastValue
}

// ---------------------------------------------------------------------------
// First prompt extraction from head chunk
// ---------------------------------------------------------------------------

/**
 * Pattern matching auto-generated or system messages that should be skipped
 * when looking for the first meaningful user prompt. Matches anything that
 * starts with a lowercase XML-like tag (IDE context, hook output, task
 * notifications, channel messages, etc.) or a synthetic interrupt marker.
 */
// SKIP_FIRST_PROMPT_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SKIP_FIRST_PROMPT_PATTERN =
  /^(?:\s*<[a-z][\w-]*[\s>]|\[Request interrupted by user[^\]]*\])/

// COMMAND_NAME_RE 命令数据保存`/<command-name>(.*?)<\/command-name>/`，供后续判断或组装使用。
const COMMAND_NAME_RE = /<command-name>(.*?)<\/command-name>/

/**
 * Extracts the first meaningful user prompt from a JSONL head chunk.
 *
 * Skips tool_result messages, isMeta, isCompactSummary, command-name messages,
 * and auto-generated patterns (session hooks, tick, IDE metadata, etc.).
 * Truncates to 200 chars.
 */
// extractFirstPromptFromHead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractFirstPromptFromHead(head: string): string {
  // start保存`0`，供共享工具 session Storage Portable后续判断或输出使用。
  let start = 0
  // commandFallback 命令数据保存`''`，作为后续固定文本处理的输入。
  let commandFallback = ''
  // while 使用 start < head.length 完成共享工具里的对应操作。
  while (start < head.length) {
    // newlineIdx保存`head.indexOf`，供共享工具后续处理使用。
    const newlineIdx = head.indexOf('\n', start)
    // line 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const line =
      newlineIdx >= 0 ? head.slice(start, newlineIdx) : head.slice(start)
    // start更新为 `newlineIdx >= 0 ? newlineIdx + 1 : head.length`，确保共享工具后续读取最新状态。
    start = newlineIdx >= 0 ? newlineIdx + 1 : head.length

    // 只有 `!line.includes('"type":"user"') && !line.includes('"type": "user"')` 满足时，共享工具才执行该分支。
    if (!line.includes('"type":"user"') && !line.includes('"type": "user"'))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    // 满足 `line.includes('"tool_result"')` 时，共享工具执行该分支。
    if (line.includes('"tool_result"')) continue
    // 只有 `line.includes('"isMeta":true') || line.includes('"isMeta": true')` 满足时，共享工具才执行该分支。
    if (line.includes('"isMeta":true') || line.includes('"isMeta": true'))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    // 共享工具在这里按实际状态进入对应分支。
    if (
      line.includes('"isCompactSummary":true') ||
      line.includes('"isCompactSummary": true')
    )
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entry解析`JSON.parse`，供共享工具后续处理使用。
      const entry = JSON.parse(line) as Record<string, unknown>
      // `entry.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (entry.type !== 'user') continue

      // 消息保存`entry.message as Record<string, unknown> | undefined`，供后续判断或组装使用。
      const message = entry.message as Record<string, unknown> | undefined
      // 消息缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!message) continue

      // 文本内容 命名 `message.content`，让后续代码直接表达这个值的用途。
      const content = message.content
      // texts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const texts: string[] = []
      // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof content === 'string') {
        // texts 集合追加新条目，保持收集顺序与输入顺序一致。
        texts.push(content)
      // 共享工具 session Storage Portable在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content as Record<string, unknown>` 中的block，逐个交给共享工具处理。
        for (const block of content as Record<string, unknown>[]) {
          // 只有 `block.type === 'text' && typeof block.text === 's` 满足时，共享工具才执行该分支。
          if (block.type === 'text' && typeof block.text === 'string') {
            // texts 集合追加新条目，保持收集顺序与输入顺序一致。
            texts.push(block.text as string)
          }
        }
      }

      // 按顺序遍历 `texts` 中的原始文本，逐个交给共享工具处理。
      for (const raw of texts) {
        // 结果格式化`raw.replace`，供共享工具后续处理使用。
        let result = raw.replace(/\n/g, ' ').trim()
        // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!result) continue

        // Skip slash-command messages but remember first as fallback
        // cmdMatch 命令数据保存`COMMAND_NAME_RE.exec`，供共享工具后续处理使用。
        const cmdMatch = COMMAND_NAME_RE.exec(result)
        // 满足 `cmdMatch` 时，共享工具执行该分支。
        if (cmdMatch) {
          // commandFallback 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!commandFallback) commandFallback = cmdMatch[1]!
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }

        // Format bash input with ! prefix before the generic XML skip
        // bashMatch保存`exec`，供共享工具后续处理使用。
        const bashMatch = /<bash-input>([\s\S]*?)<\/bash-input>/.exec(result)
        // 满足 `bashMatch) return `! ${bashMatch[1]!.trim(` 时，共享工具执行该分支。
        if (bashMatch) return `! ${bashMatch[1]!.trim()}`

        // 满足 `SKIP_FIRST_PROMPT_PATTERN.test(result)` 时，共享工具执行该分支。
        if (SKIP_FIRST_PROMPT_PATTERN.test(result)) continue

        // 满足 `result.length > 200` 时，共享工具执行该分支。
        if (result.length > 200) {
          // 结果更新为 `result.slice(0, 200).trim() + '\u2026'`，确保共享工具后续读取最新状态。
          result = result.slice(0, 200).trim() + '\u2026'
        }
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      }
    } catch {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
  }
  // 满足 `commandFallback` 时，共享工具执行该分支。
  if (commandFallback) return commandFallback
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

// ---------------------------------------------------------------------------
// File I/O — read head and tail of a file
// ---------------------------------------------------------------------------

/**
 * Reads the first and last LITE_READ_BUF_SIZE bytes of a file.
 *
 * For small files where head covers tail, `tail === head`.
 * Accepts a shared Buffer to avoid per-file allocation overhead.
 * Returns `{ head: '', tail: '' }` on any error.
 */
// readHeadAndTail 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readHeadAndTail(
  filePath: string,
  fileSize: number,
  buf: Buffer,
): Promise<{ head: string; tail: string }> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fh保存`fsOpen`，供共享工具后续处理使用。
    const fh = await fsOpen(filePath, 'r')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // headResult读取`fh.read`，供共享工具后续处理使用。
      const headResult = await fh.read(buf, 0, LITE_READ_BUF_SIZE, 0)
      // 满足 `headResult.bytesRead === 0` 时，共享工具执行该分支。
      if (headResult.bytesRead === 0) return { head: '', tail: '' }

      // head格式化`buf.toString`，供共享工具后续处理使用。
      const head = buf.toString('utf8', 0, headResult.bytesRead)

      // tailOffset保存`Math.max`，供共享工具后续处理使用。
      const tailOffset = Math.max(0, fileSize - LITE_READ_BUF_SIZE)
      // tail 命名 `head`，让后续代码直接表达这个值的用途。
      let tail = head
      // 满足 `tailOffset > 0` 时，共享工具执行该分支。
      if (tailOffset > 0) {
        // tailResult读取`fh.read`，供共享工具后续处理使用。
        const tailResult = await fh.read(buf, 0, LITE_READ_BUF_SIZE, tailOffset)
        // tail更新为 `buf.toString('utf8', 0, tailResult.bytesRead)`，确保共享工具后续读取最新状态。
        tail = buf.toString('utf8', 0, tailResult.bytesRead)
      }

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { head, tail }
    } finally {
      // 等待 `fh.close()` 完成，再继续共享工具 session Storage Portable的异步流程。
      await fh.close()
    }
  } catch {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { head: '', tail: '' }
  }
}

// LiteSessionFile 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LiteSessionFile = {
  mtime: number
  size: number
  head: string
  tail: string
}

/**
 * Opens a single session file, stats it, and reads head + tail in one fd.
 * Allocates its own buffer — safe for concurrent use with Promise.all.
 * Returns null on any error.
 */
// readSessionLite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readSessionLite(
  filePath: string,
): Promise<LiteSessionFile | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fh保存`fsOpen`，供共享工具后续处理使用。
    const fh = await fsOpen(filePath, 'r')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stat保存`fh.stat`，供共享工具后续处理使用。
      const stat = await fh.stat()
      // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
      const buf = Buffer.allocUnsafe(LITE_READ_BUF_SIZE)
      // headResult读取`fh.read`，供共享工具后续处理使用。
      const headResult = await fh.read(buf, 0, LITE_READ_BUF_SIZE, 0)
      // 满足 `headResult.bytesRead === 0` 时，共享工具执行该分支。
      if (headResult.bytesRead === 0) return null

      // head格式化`buf.toString`，供共享工具后续处理使用。
      const head = buf.toString('utf8', 0, headResult.bytesRead)
      // tailOffset保存`Math.max`，供共享工具后续处理使用。
      const tailOffset = Math.max(0, stat.size - LITE_READ_BUF_SIZE)
      // tail 命名 `head`，让后续代码直接表达这个值的用途。
      let tail = head
      // 满足 `tailOffset > 0` 时，共享工具执行该分支。
      if (tailOffset > 0) {
        // tailResult读取`fh.read`，供共享工具后续处理使用。
        const tailResult = await fh.read(buf, 0, LITE_READ_BUF_SIZE, tailOffset)
        // tail更新为 `buf.toString('utf8', 0, tailResult.bytesRead)`，确保共享工具后续读取最新状态。
        tail = buf.toString('utf8', 0, tailResult.bytesRead)
      }

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { mtime: stat.mtime.getTime(), size: stat.size, head, tail }
    } finally {
      // 等待 `fh.close()` 完成，再继续共享工具 session Storage Portable的异步流程。
      await fh.close()
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// ---------------------------------------------------------------------------
// Path sanitization
// ---------------------------------------------------------------------------

/**
 * Maximum length for a single filesystem path component (directory or file name).
 * Most filesystems (ext4, APFS, NTFS) limit individual components to 255 bytes.
 * We use 200 to leave room for the hash suffix and separator.
 */
// MAX_SANITIZED_LENGTH 数量保存`200`，供后续判断或组装使用。
export const MAX_SANITIZED_LENGTH = 200

// simpleHash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function simpleHash(str: string): string {
  // 返回 `Math.abs(djb2Hash(str)).toString(36)`，作为共享工具这次计算的结果。
  return Math.abs(djb2Hash(str)).toString(36)
}

/**
 * Makes a string safe for use as a directory or file name.
 * Replaces all non-alphanumeric characters with hyphens.
 * This ensures compatibility across all platforms, including Windows
 * where characters like colons are reserved.
 *
 * For deeply nested paths that would exceed filesystem limits (255 bytes),
 * truncates and appends a hash suffix for uniqueness.
 *
 * @param name - The string to make safe (e.g., '/Users/foo/my-project' or 'plugin:name:server')
 * @returns A safe name (e.g., '-Users-foo-my-project' or 'plugin-name-server')
 */
// sanitizePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizePath(name: string): string {
  // sanitized格式化`name.replace`，供共享工具后续处理使用。
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, '-')
  // 满足 `sanitized.length <= MAX_SANITIZED_LENGTH` 时，共享工具执行该分支。
  if (sanitized.length <= MAX_SANITIZED_LENGTH) {
    // 返回 `sanitized`，作为共享工具这次计算的结果。
    return sanitized
  }
  // hash 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hash =
    typeof Bun !== 'undefined' ? Bun.hash(name).toString(36) : simpleHash(name)
  // 返回 ``${sanitized.slice(0, MAX_SANITIZED_LENGTH)}-${hash}``，作为共享工具这次计算的结果。
  return `${sanitized.slice(0, MAX_SANITIZED_LENGTH)}-${hash}`
}

// ---------------------------------------------------------------------------
// Project directory discovery (shared by listSessions & getSessionMessages)
// ---------------------------------------------------------------------------

// getProjectsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectsDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'projects')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'projects')
}

// getProjectDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectDir(projectDir: string): string {
  // 返回 `join(getProjectsDir(), sanitizePath(projectDir))`，作为共享工具这次计算的结果。
  return join(getProjectsDir(), sanitizePath(projectDir))
}

/**
 * Resolves a directory path to its canonical form using realpath + NFC
 * normalization. Falls back to NFC-only if realpath fails (e.g., the
 * directory doesn't exist yet). Ensures symlinked paths (e.g.,
 * /tmp → /private/tmp on macOS) resolve to the same project directory.
 */
// canonicalizePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function canonicalizePath(dir: string): Promise<string> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `(await realpath(dir)).normalize('NFC')`，作为共享工具这次计算的结果。
    return (await realpath(dir)).normalize('NFC')
  } catch {
    // 返回 `dir.normalize('NFC')`，作为共享工具这次计算的结果。
    return dir.normalize('NFC')
  }
}

/**
 * Finds the project directory for a given path, tolerating hash mismatches
 * for long paths (>200 chars). The CLI uses Bun.hash while the SDK under
 * Node.js uses simpleHash — for paths that exceed MAX_SANITIZED_LENGTH,
 * these produce different directory suffixes. This function falls back to
 * prefix-based scanning when the exact match doesn't exist.
 */
// findProjectDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findProjectDir(
  projectPath: string,
): Promise<string | undefined> {
  // exact读取`getProjectDir`，供共享工具后续处理使用。
  const exact = getProjectDir(projectPath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `readdir(exact)` 完成，再继续共享工具 session Storage Portable的异步流程。
    await readdir(exact)
    // 返回 `exact`，作为共享工具这次计算的结果。
    return exact
  } catch {
    // Exact match failed — for short paths this means no sessions exist.
    // For long paths, try prefix matching to handle hash mismatches.
    // sanitized保存`sanitizePath`，供共享工具后续处理使用。
    const sanitized = sanitizePath(projectPath)
    // 满足 `sanitized.length <= MAX_SANITIZED_LENGTH` 时，共享工具执行该分支。
    if (sanitized.length <= MAX_SANITIZED_LENGTH) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }
    // prefix格式化`sanitized.slice`，供共享工具后续处理使用。
    const prefix = sanitized.slice(0, MAX_SANITIZED_LENGTH)
    // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
    const projectsDir = getProjectsDir()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // dirents 集合读取`readdir`，供共享工具后续处理使用。
      const dirents = await readdir(projectsDir, { withFileTypes: true })
      // match筛选`dirents.find`，供共享工具后续处理使用。
      const match = dirents.find(
        // d更新为 `> d.isDirectory() && d.name.startsWith(prefix + '-')`，确保共享工具后续读取最新状态。
        d => d.isDirectory() && d.name.startsWith(prefix + '-'),
      )
      // 返回 `match ? join(projectsDir, match.name) : undefined`，作为共享工具这次计算的结果。
      return match ? join(projectsDir, match.name) : undefined
    } catch {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }
  }
}

/**
 * Resolve a sessionId to its on-disk JSONL file path.
 *
 * When `dir` is provided: canonicalize it, look in that project's directory
 * (with findProjectDir fallback for Bun/Node hash mismatches), then fall back
 * to sibling git worktrees. `projectPath` in the result is the canonical
 * user-facing directory the file was found under.
 *
 * When `dir` is omitted: scan all project directories under ~/.claude/projects/.
 * `projectPath` is undefined in this case (no meaningful project path to report).
 *
 * Existence is checked by stat (operate-then-catch-ENOENT, no existsSync).
 * Zero-byte files are treated as not-found so callers continue searching past
 * a truncated copy to find a valid one in a sibling directory.
 *
 * `fileSize` is returned so callers (loadSessionBuffer) don't need to re-stat.
 *
 * Shared by getSessionInfoImpl and getSessionMessagesImpl — the caller
 * invokes its own reader (readSessionLite / loadSessionBuffer) on the
 * resolved path.
 */
// resolveSessionFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveSessionFilePath(
  sessionId: string,
  dir?: string,
): Promise<
  | { filePath: string; projectPath: string | undefined; fileSize: number }
  | undefined
> {
  // fileName 文件数据 命名 ``${sessionId}.jsonl``，让后续代码直接表达这个值的用途。
  const fileName = `${sessionId}.jsonl`

  // 满足 `dir` 时，共享工具执行该分支。
  if (dir) {
    // canonical保存`canonicalizePath`，供共享工具后续处理使用。
    const canonical = await canonicalizePath(dir)
    // projectDir筛选`findProjectDir`，供共享工具后续处理使用。
    const projectDir = await findProjectDir(canonical)
    // 满足 `projectDir` 时，共享工具执行该分支。
    if (projectDir) {
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(projectDir, fileName)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // s 集合保存`stat`，供共享工具后续处理使用。
        const s = await stat(filePath)
        // 满足 `s.size > 0` 时，共享工具执行该分支。
        if (s.size > 0)
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { filePath, projectPath: canonical, fileSize: s.size }
      } catch {
        // ENOENT/EACCES — keep searching
      }
    }
    // Worktree fallback — sessions may live under a different worktree root
    // worktreePaths 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let worktreePaths: string[]
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // worktreePaths 路径数据更新为 `await getWorktreePathsPortable(canonical)`，确保共享工具后续读取最新状态。
      worktreePaths = await getWorktreePathsPortable(canonical)
    } catch {
      // worktreePaths 路径数据更新为 `[]`，确保共享工具后续读取最新状态。
      worktreePaths = []
    }
    // 按顺序遍历 `worktreePaths` 中的wt，逐个交给共享工具处理。
    for (const wt of worktreePaths) {
      // 满足 `wt === canonical` 时，共享工具执行该分支。
      if (wt === canonical) continue
      // wtProjectDir筛选`findProjectDir`，供共享工具后续处理使用。
      const wtProjectDir = await findProjectDir(wt)
      // wtProjectDir缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!wtProjectDir) continue
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(wtProjectDir, fileName)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // s 集合保存`stat`，供共享工具后续处理使用。
        const s = await stat(filePath)
        // 满足 `s.size > 0` 时，共享工具执行该分支。
        if (s.size > 0) return { filePath, projectPath: wt, fileSize: s.size }
      } catch {
        // ENOENT/EACCES — keep searching
      }
    }
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // No dir — scan all project directories
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()
  // dirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let dirents: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectsDir)`，确保共享工具后续读取最新状态。
    dirents = await readdir(projectsDir)
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 按顺序遍历 `dirents` 中的名称，逐个交给共享工具处理。
  for (const name of dirents) {
    // 文件路径格式化`join`，供共享工具后续处理使用。
    const filePath = join(projectsDir, name, fileName)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // s 集合保存`stat`，供共享工具后续处理使用。
      const s = await stat(filePath)
      // 满足 `s.size > 0` 时，共享工具执行该分支。
      if (s.size > 0)
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { filePath, projectPath: undefined, fileSize: s.size }
    } catch {
      // ENOENT/ENOTDIR — not in this project, keep scanning
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// ---------------------------------------------------------------------------
// Compact-boundary chunked read (shared by loadTranscriptFile & SDK getSessionMessages)
// ---------------------------------------------------------------------------

/** Chunk size for the forward transcript reader. 1 MB balances I/O calls vs buffer growth. */
// TRANSCRIPT_READ_CHUNK_SIZE 命名 `1024 * 1024`，让后续代码直接表达这个值的用途。
const TRANSCRIPT_READ_CHUNK_SIZE = 1024 * 1024

/**
 * File size below which precompact filtering is skipped.
 * Large sessions (>5 MB) almost always have compact boundaries — they got big
 * because of many turns triggering auto-compact.
 */
// SKIP_PRECOMPACT_THRESHOLD保存`5 * 1024 * 1024`，供共享工具 session Storage Portable后续判断或输出使用。
export const SKIP_PRECOMPACT_THRESHOLD = 5 * 1024 * 1024

/** Marker bytes searched for when locating the boundary. Lazy: allocated on
 * first use, not at module load. Most sessions never resume. */
// _compactBoundaryMarker 先占位，稍后的条件分支会根据实际输入补齐它。
let _compactBoundaryMarker: Buffer | undefined
// compactBoundaryMarker 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function compactBoundaryMarker(): Buffer {
  // 返回 `(_compactBoundaryMarker ??= Buffer.from('"compact_boundary"'))`，作为共享工具这次计算的结果。
  return (_compactBoundaryMarker ??= Buffer.from('"compact_boundary"'))
}

/**
 * Confirm a byte-matched line is a real compact_boundary (marker can appear
 * inside user content) and check for preservedSegment.
 */
// parseBoundaryLine 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseBoundaryLine(
  line: string,
): { hasPreservedSegment: boolean } | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`JSON.parse`，供共享工具后续处理使用。
    const parsed = JSON.parse(line) as {
      type?: string
      subtype?: string
      compactMetadata?: { preservedSegment?: unknown }
    }
    // `parsed.type` 与 `'system' || parsed.subtype !== ...` 不一致时刷新派生状态，避免使用过期结果。
    if (parsed.type !== 'system' || parsed.subtype !== 'compact_boundary') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      hasPreservedSegment: Boolean(parsed.compactMetadata?.preservedSegment),
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Single forward chunked read for the --resume load path. Attr-snap lines
 * are skipped at the fd level; compact boundaries truncate in-stream. Peak
 * is the output size, not the file size.
 *
 * The surviving (last) attr-snap is appended at EOF instead of in-place;
 * restoreAttributionStateFromSnapshots only reads [length-1] so position
 * doesn't matter.
 */

// Sink 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Sink = { buf: Buffer; len: number; cap: number }

// sinkWrite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sinkWrite(s: Sink, src: Buffer, start: number, end: number): void {
  // n保存`end - start`，供共享工具 session Storage Portable后续判断或输出使用。
  const n = end - start
  // 满足 `n <= 0` 时，共享工具执行该分支。
  if (n <= 0) return
  // 满足 `s.len + n > s.buf.length` 时，共享工具执行该分支。
  if (s.len + n > s.buf.length) {
    // grown保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
    const grown = Buffer.allocUnsafe(
      Math.min(Math.max(s.buf.length * 2, s.len + n), s.cap),
    )
    // 调用 s.buf.copy，触发共享工具此处需要的副作用。
    s.buf.copy(grown, 0, 0, s.len)
    // buf更新为 `grown`，确保共享工具后续读取最新状态。
    s.buf = grown
  }
  // 调用 src.copy，触发共享工具此处需要的副作用。
  src.copy(s.buf, s.len, start, end)
  // 共享工具 session Storage Portable在这里处理 `s.len += n`，完成这一小步状态转换。
  s.len += n
}

// hasPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasPrefix(
  src: Buffer,
  prefix: Buffer,
  at: number,
  end: number,
): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    end - at >= prefix.length &&
    src.compare(prefix, 0, prefix.length, at, at + prefix.length) === 0
  )
}

// ATTR_SNAP_PREFIX保存`Buffer.from`，供共享工具后续处理使用。
const ATTR_SNAP_PREFIX = Buffer.from('{"type":"attribution-snapshot"')
// SYSTEM_PREFIX保存`Buffer.from`，供共享工具后续处理使用。
const SYSTEM_PREFIX = Buffer.from('{"type":"system"')
// LF保存`0x0a`，供共享工具 session Storage Portable后续判断或输出使用。
const LF = 0x0a
// LF_BYTE保存`Buffer.from`，供共享工具后续处理使用。
const LF_BYTE = Buffer.from([LF])
// BOUNDARY_SEARCH_BOUND 命名 `256 // marker sits ~28 bytes in; 256 is slack`，让后续代码直接表达这个值的用途。
const BOUNDARY_SEARCH_BOUND = 256 // marker sits ~28 bytes in; 256 is slack

// LoadState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadState = {
  out: Sink
  boundaryStartOffset: number
  hasPreservedSegment: boolean
  lastSnapSrc: Buffer | null // most-recent attr-snap, appended at EOF
  lastSnapLen: number
  lastSnapBuf: Buffer | undefined
  bufFileOff: number // file offset of buf[0]
  carryLen: number
  carryBuf: Buffer | undefined
  straddleSnapCarryLen: number // per-chunk; reset by processStraddle
  straddleSnapTailEnd: number
}

// Line spanning the chunk seam. 0 = fall through to concat.
// processStraddle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processStraddle(
  s: LoadState,
  chunk: Buffer,
  bytesRead: number,
): number {
  // straddleSnapCarryLen更新为 `0`，确保共享工具后续读取最新状态。
  s.straddleSnapCarryLen = 0
  // straddleSnapTailEnd更新为 `0`，确保共享工具后续读取最新状态。
  s.straddleSnapTailEnd = 0
  // 满足 `s.carryLen === 0` 时，共享工具执行该分支。
  if (s.carryLen === 0) return 0
  // cb保存`s.carryBuf!`，供共享工具 session Storage Portable后续判断或输出使用。
  const cb = s.carryBuf!
  // firstNl保存`chunk.indexOf`，供共享工具后续处理使用。
  const firstNl = chunk.indexOf(LF)
  // 只有 `firstNl === -1 || firstNl >= bytesRead` 满足时，共享工具才执行该分支。
  if (firstNl === -1 || firstNl >= bytesRead) return 0
  // tailEnd保存`firstNl + 1`，供后续判断或组装使用。
  const tailEnd = firstNl + 1
  // 满足 `hasPrefix(cb, ATTR_SNAP_PREFIX, 0, s.carryLen)` 时，共享工具执行该分支。
  if (hasPrefix(cb, ATTR_SNAP_PREFIX, 0, s.carryLen)) {
    // straddleSnapCarryLen更新为 `s.carryLen`，确保共享工具后续读取最新状态。
    s.straddleSnapCarryLen = s.carryLen
    // straddleSnapTailEnd更新为 `tailEnd`，确保共享工具后续读取最新状态。
    s.straddleSnapTailEnd = tailEnd
    // lastSnapSrc更新为 `null`，确保共享工具后续读取最新状态。
    s.lastSnapSrc = null
  // 共享工具 session Storage Portable在这里处理 `} else if (s.carryLen < ATTR_SNAP_PREFIX.length) {`，完成这一小步状态转换。
  } else if (s.carryLen < ATTR_SNAP_PREFIX.length) {
    // 返回 `0 // too short to rule out attr-snap`，作为共享工具这次计算的结果。
    return 0 // too short to rule out attr-snap
  } else {
    // 满足 `hasPrefix(cb, SYSTEM_PREFIX, 0, s.carryLen)` 时，共享工具执行该分支。
    if (hasPrefix(cb, SYSTEM_PREFIX, 0, s.carryLen)) {
      // hit解析`parseBoundaryLine`，供共享工具后续处理使用。
      const hit = parseBoundaryLine(
        cb.toString('utf-8', 0, s.carryLen) +
          chunk.toString('utf-8', 0, firstNl),
      )
      // 满足 `hit?.hasPreservedSegment` 时，共享工具执行该分支。
      if (hit?.hasPreservedSegment) {
        // hasPreservedSegment更新为 `true`，确保共享工具后续读取最新状态。
        s.hasPreservedSegment = true
      // 共享工具 session Storage Portable在这里处理 `} else if (hit) {`，完成这一小步状态转换。
      } else if (hit) {
        // len更新为 `0`，确保共享工具后续读取最新状态。
        s.out.len = 0
        // boundaryStartOffset更新为 `s.bufFileOff`，确保共享工具后续读取最新状态。
        s.boundaryStartOffset = s.bufFileOff
        // hasPreservedSegment更新为 `false`，确保共享工具后续读取最新状态。
        s.hasPreservedSegment = false
        // lastSnapSrc更新为 `null`，确保共享工具后续读取最新状态。
        s.lastSnapSrc = null
      }
    }
    // 调用 sinkWrite，触发共享工具此处需要的副作用。
    sinkWrite(s.out, cb, 0, s.carryLen)
    // 调用 sinkWrite，触发共享工具此处需要的副作用。
    sinkWrite(s.out, chunk, 0, tailEnd)
  }
  // 共享工具 session Storage Portable在这里处理 `s.bufFileOff += s.carryLen + tailEnd`，完成这一小步状态转换。
  s.bufFileOff += s.carryLen + tailEnd
  // carryLen更新为 `0`，确保共享工具后续读取最新状态。
  s.carryLen = 0
  // 返回 `tailEnd`，作为共享工具这次计算的结果。
  return tailEnd
}

// Strip attr-snaps, truncate on boundaries. Kept lines write as runs.
// scanChunkLines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scanChunkLines(
  s: LoadState,
  buf: Buffer,
  boundaryMarker: Buffer,
): { lastSnapStart: number; lastSnapEnd: number; trailStart: number } {
  // boundaryAt保存`buf.indexOf`，供共享工具后续处理使用。
  let boundaryAt = buf.indexOf(boundaryMarker)
  // runStart保存`0`，供后续判断或组装使用。
  let runStart = 0
  // lineStart 命名 `0`，让后续代码直接表达这个值的用途。
  let lineStart = 0
  // lastSnapStart 命名 `-1`，让后续代码直接表达这个值的用途。
  let lastSnapStart = -1
  // lastSnapEnd保存`-1`，供后续判断或组装使用。
  let lastSnapEnd = -1
  // nl保存`buf.indexOf`，供共享工具后续处理使用。
  let nl = buf.indexOf(LF)
  // while 使用 nl !== -1 完成共享工具里的对应操作。
  while (nl !== -1) {
    // lineEnd保存`nl + 1`，供共享工具 session Storage Portable后续判断或输出使用。
    const lineEnd = nl + 1
    // `boundaryAt` 与 `-1 && boundaryAt < lineStart` 不一致时刷新派生状态，避免使用过期结果。
    if (boundaryAt !== -1 && boundaryAt < lineStart) {
      // boundaryAt更新为 `buf.indexOf(boundaryMarker, lineStart)`，确保共享工具后续读取最新状态。
      boundaryAt = buf.indexOf(boundaryMarker, lineStart)
    }
    // 满足 `hasPrefix(buf, ATTR_SNAP_PREFIX, lineStart, lineEnd)` 时，共享工具执行该分支。
    if (hasPrefix(buf, ATTR_SNAP_PREFIX, lineStart, lineEnd)) {
      // 调用 sinkWrite，触发共享工具此处需要的副作用。
      sinkWrite(s.out, buf, runStart, lineStart)
      // lastSnapStart更新为 `lineStart`，确保共享工具后续读取最新状态。
      lastSnapStart = lineStart
      // lastSnapEnd更新为 `lineEnd`，确保共享工具后续读取最新状态。
      lastSnapEnd = lineEnd
      // runStart更新为 `lineEnd`，确保共享工具后续读取最新状态。
      runStart = lineEnd
    // 共享工具 session Storage Portable在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      boundaryAt >= lineStart &&
      boundaryAt < Math.min(lineStart + BOUNDARY_SEARCH_BOUND, lineEnd)
    ) {
      // hit解析`parseBoundaryLine`，供共享工具后续处理使用。
      const hit = parseBoundaryLine(buf.toString('utf-8', lineStart, nl))
      // 满足 `hit?.hasPreservedSegment` 时，共享工具执行该分支。
      if (hit?.hasPreservedSegment) {
        // hasPreservedSegment更新为 `true // don't truncate; preserved msgs already in output`，确保共享工具后续读取最新状态。
        s.hasPreservedSegment = true // don't truncate; preserved msgs already in output
      // 共享工具 session Storage Portable在这里处理 `} else if (hit) {`，完成这一小步状态转换。
      } else if (hit) {
        // len更新为 `0`，确保共享工具后续读取最新状态。
        s.out.len = 0
        // boundaryStartOffset更新为 `s.bufFileOff + lineStart`，确保共享工具后续读取最新状态。
        s.boundaryStartOffset = s.bufFileOff + lineStart
        // hasPreservedSegment更新为 `false`，确保共享工具后续读取最新状态。
        s.hasPreservedSegment = false
        // lastSnapSrc更新为 `null`，确保共享工具后续读取最新状态。
        s.lastSnapSrc = null
        // lastSnapStart更新为 `-1`，确保共享工具后续读取最新状态。
        lastSnapStart = -1
        // straddleSnapCarryLen更新为 `0`，确保共享工具后续读取最新状态。
        s.straddleSnapCarryLen = 0
        // runStart更新为 `lineStart`，确保共享工具后续读取最新状态。
        runStart = lineStart
      }
      // boundaryAt更新为 `buf.indexOf(`，确保共享工具后续读取最新状态。
      boundaryAt = buf.indexOf(
        boundaryMarker,
        boundaryAt + boundaryMarker.length,
      )
    }
    // lineStart更新为 `lineEnd`，确保共享工具后续读取最新状态。
    lineStart = lineEnd
    // nl更新为 `buf.indexOf(LF, lineStart)`，确保共享工具后续读取最新状态。
    nl = buf.indexOf(LF, lineStart)
  }
  // 调用 sinkWrite，触发共享工具此处需要的副作用。
  sinkWrite(s.out, buf, runStart, lineStart)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { lastSnapStart, lastSnapEnd, trailStart: lineStart }
}

// In-buf snap wins over straddle (later in file). carryBuf still valid here.
// captureSnap 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function captureSnap(
  s: LoadState,
  buf: Buffer,
  chunk: Buffer,
  lastSnapStart: number,
  lastSnapEnd: number,
): void {
  // `lastSnapStart` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (lastSnapStart !== -1) {
    // lastSnapLen更新为 `lastSnapEnd - lastSnapStart`，确保共享工具后续读取最新状态。
    s.lastSnapLen = lastSnapEnd - lastSnapStart
    // 只有 `s.lastSnapBuf === undefined || s.lastSnapLen > s.` 满足时，共享工具才执行该分支。
    if (s.lastSnapBuf === undefined || s.lastSnapLen > s.lastSnapBuf.length) {
      // lastSnapBuf更新为 `Buffer.allocUnsafe(s.lastSnapLen)`，确保共享工具后续读取最新状态。
      s.lastSnapBuf = Buffer.allocUnsafe(s.lastSnapLen)
    }
    // 调用 buf.copy，触发共享工具此处需要的副作用。
    buf.copy(s.lastSnapBuf, 0, lastSnapStart, lastSnapEnd)
    // lastSnapSrc更新为 `s.lastSnapBuf`，确保共享工具后续读取最新状态。
    s.lastSnapSrc = s.lastSnapBuf
  // 共享工具 session Storage Portable在这里处理 `} else if (s.straddleSnapCarryLen > 0) {`，完成这一小步状态转换。
  } else if (s.straddleSnapCarryLen > 0) {
    // lastSnapLen更新为 `s.straddleSnapCarryLen + s.straddleSnapTailEnd`，确保共享工具后续读取最新状态。
    s.lastSnapLen = s.straddleSnapCarryLen + s.straddleSnapTailEnd
    // 只有 `s.lastSnapBuf === undefined || s.lastSnapLen > s.` 满足时，共享工具才执行该分支。
    if (s.lastSnapBuf === undefined || s.lastSnapLen > s.lastSnapBuf.length) {
      // lastSnapBuf更新为 `Buffer.allocUnsafe(s.lastSnapLen)`，确保共享工具后续读取最新状态。
      s.lastSnapBuf = Buffer.allocUnsafe(s.lastSnapLen)
    }
    // 共享工具 session Storage Portable在这里处理 `s.carryBuf!.copy(s.lastSnapBuf, 0, 0, s.straddleSnapCarryLen)`，完成这一小步状态转换。
    s.carryBuf!.copy(s.lastSnapBuf, 0, 0, s.straddleSnapCarryLen)
    // 调用 chunk.copy，触发共享工具此处需要的副作用。
    chunk.copy(s.lastSnapBuf, s.straddleSnapCarryLen, 0, s.straddleSnapTailEnd)
    // lastSnapSrc更新为 `s.lastSnapBuf`，确保共享工具后续读取最新状态。
    s.lastSnapSrc = s.lastSnapBuf
  }
}

// captureCarry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function captureCarry(s: LoadState, buf: Buffer, trailStart: number): void {
  // carryLen更新为 `buf.length - trailStart`，确保共享工具后续读取最新状态。
  s.carryLen = buf.length - trailStart
  // 满足 `s.carryLen > 0` 时，共享工具执行该分支。
  if (s.carryLen > 0) {
    // 只有 `s.carryBuf === undefined || s.carryLen > s.carryB` 满足时，共享工具才执行该分支。
    if (s.carryBuf === undefined || s.carryLen > s.carryBuf.length) {
      // carryBuf更新为 `Buffer.allocUnsafe(s.carryLen)`，确保共享工具后续读取最新状态。
      s.carryBuf = Buffer.allocUnsafe(s.carryLen)
    }
    // 调用 buf.copy，触发共享工具此处需要的副作用。
    buf.copy(s.carryBuf, 0, trailStart, buf.length)
  }
}

// finalizeOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function finalizeOutput(s: LoadState): void {
  // 满足 `s.carryLen > 0` 时，共享工具执行该分支。
  if (s.carryLen > 0) {
    // cb保存`s.carryBuf!`，供共享工具 session Storage Portable后续判断或输出使用。
    const cb = s.carryBuf!
    // 满足 `hasPrefix(cb, ATTR_SNAP_PREFIX, 0, s.carryLen)` 时，共享工具执行该分支。
    if (hasPrefix(cb, ATTR_SNAP_PREFIX, 0, s.carryLen)) {
      // lastSnapSrc更新为 `cb`，确保共享工具后续读取最新状态。
      s.lastSnapSrc = cb
      // lastSnapLen更新为 `s.carryLen`，确保共享工具后续读取最新状态。
      s.lastSnapLen = s.carryLen
    } else {
      // 调用 sinkWrite，触发共享工具此处需要的副作用。
      sinkWrite(s.out, cb, 0, s.carryLen)
    }
  }
  // 满足 `s.lastSnapSrc` 时，共享工具执行该分支。
  if (s.lastSnapSrc) {
    // `s.out.len > 0 && s.out.buf[s.out.len - 1]` 与 `LF` 不一致时刷新派生状态，避免使用过期结果。
    if (s.out.len > 0 && s.out.buf[s.out.len - 1] !== LF) {
      // 调用 sinkWrite，触发共享工具此处需要的副作用。
      sinkWrite(s.out, LF_BYTE, 0, 1)
    }
    // 调用 sinkWrite，触发共享工具此处需要的副作用。
    sinkWrite(s.out, s.lastSnapSrc, 0, s.lastSnapLen)
  }
}

// readTranscriptForLoad 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readTranscriptForLoad(
  filePath: string,
  fileSize: number,
): Promise<{
  boundaryStartOffset: number
  postBoundaryBuf: Buffer
  hasPreservedSegment: boolean
}> {
  // boundaryMarker保存`compactBoundaryMarker`，供共享工具后续处理使用。
  const boundaryMarker = compactBoundaryMarker()
  // CHUNK_SIZE保存`TRANSCRIPT_READ_CHUNK_SIZE`，供后续判断或组装使用。
  const CHUNK_SIZE = TRANSCRIPT_READ_CHUNK_SIZE

  // s 集合 集中保存共享工具 session Storage Portable要一起传递的字段。
  const s: LoadState = {
    out: {
      // Gated callers enter with fileSize > 5MB, so min(fileSize, 8MB) lands
      // in [5, 8]MB; large boundaryless sessions (24-31MB output) take 2
      // grows. Ungated callers (attribution.ts) pass small files too — the
      // min just right-sizes the initial buf, no grows.
      buf: Buffer.allocUnsafe(Math.min(fileSize, 8 * 1024 * 1024)),
      len: 0,
      // +1: finalizeOutput may insert one LF between a non-LF-terminated
      // carry and the reordered last attr-snap (crash-truncated file).
      cap: fileSize + 1,
    },
    boundaryStartOffset: 0,
    hasPreservedSegment: false,
    lastSnapSrc: null,
    lastSnapLen: 0,
    lastSnapBuf: undefined,
    bufFileOff: 0,
    carryLen: 0,
    carryBuf: undefined,
    straddleSnapCarryLen: 0,
    straddleSnapTailEnd: 0,
  }

  // chunk保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const chunk = Buffer.allocUnsafe(CHUNK_SIZE)
  // fd保存`fsOpen`，供共享工具后续处理使用。
  const fd = await fsOpen(filePath, 'r')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // filePos 文件数据保存`0`，供共享工具 session Storage Portable后续判断或输出使用。
    let filePos = 0
    // while 使用 filePos < fileSize 完成共享工具里的对应操作。
    while (filePos < fileSize) {
      // 从 `await fd.read(` 解构 bytesRead，减少共享工具 session Storage Portable对同一对象的重复访问。
      const { bytesRead } = await fd.read(
        chunk,
        0,
        Math.min(CHUNK_SIZE, fileSize - filePos),
        filePos,
      )
      // 满足 `bytesRead === 0` 时，共享工具执行该分支。
      if (bytesRead === 0) break
      // 共享工具 session Storage Portable在这里处理 `filePos += bytesRead`，完成这一小步状态转换。
      filePos += bytesRead

      // chunkOff保存`processStraddle`，供共享工具后续处理使用。
      const chunkOff = processStraddle(s, chunk, bytesRead)

      // buf 先占位，稍后的条件分支会根据实际输入补齐它。
      let buf: Buffer
      // 满足 `s.carryLen > 0` 时，共享工具执行该分支。
      if (s.carryLen > 0) {
        // bufLen保存`s.carryLen + (bytesRead - chunkOff)`，供后续判断或组装使用。
        const bufLen = s.carryLen + (bytesRead - chunkOff)
        // buf更新为 `Buffer.allocUnsafe(bufLen)`，确保共享工具后续读取最新状态。
        buf = Buffer.allocUnsafe(bufLen)
        // 共享工具 session Storage Portable在这里处理 `s.carryBuf!.copy(buf, 0, 0, s.carryLen)`，完成这一小步状态转换。
        s.carryBuf!.copy(buf, 0, 0, s.carryLen)
        // 调用 chunk.copy，触发共享工具此处需要的副作用。
        chunk.copy(buf, s.carryLen, chunkOff, bytesRead)
      } else {
        // buf更新为 `chunk.subarray(chunkOff, bytesRead)`，确保共享工具后续读取最新状态。
        buf = chunk.subarray(chunkOff, bytesRead)
      }

      // r保存`scanChunkLines`，供共享工具后续处理使用。
      const r = scanChunkLines(s, buf, boundaryMarker)
      // 调用 captureSnap，触发共享工具此处需要的副作用。
      captureSnap(s, buf, chunk, r.lastSnapStart, r.lastSnapEnd)
      // 调用 captureCarry，触发共享工具此处需要的副作用。
      captureCarry(s, buf, r.trailStart)
      // 共享工具 session Storage Portable在这里处理 `s.bufFileOff += r.trailStart`，完成这一小步状态转换。
      s.bufFileOff += r.trailStart
    }
    // 调用 finalizeOutput，触发共享工具此处需要的副作用。
    finalizeOutput(s)
  } finally {
    // 等待 `fd.close()` 完成，再继续共享工具 session Storage Portable的异步流程。
    await fd.close()
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    boundaryStartOffset: s.boundaryStartOffset,
    postBoundaryBuf: s.out.buf.subarray(0, s.out.len),
    hasPreservedSegment: s.hasPreservedSegment,
  }
}
