// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getProjectRoot、getSessionId，将 ./bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot, getSessionId } from './bootstrap/state.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ./utils/cleanupRegistry.js 中维护。
import { registerCleanup } from './utils/cleanupRegistry.js'
// 类型依赖 { HistoryEntry, PastedContent } 来自 ./utils/config.js，用于校准history的数据契约。
import type { HistoryEntry, PastedContent } from './utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ./utils/debug.js 中维护。
import { logForDebugging } from './utils/debug.js'
// 复用 getClaudeConfigHomeDir、isEnvTruthy 工具函数，把通用处理留在 ./utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir, isEnvTruthy } from './utils/envUtils.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ./utils/errors.js 中维护。
import { getErrnoCode } from './utils/errors.js'
// 复用 readLinesReverse 工具函数，把通用处理留在 ./utils/fsOperations.js 中维护。
import { readLinesReverse } from './utils/fsOperations.js'
// 复用 lock 工具函数，把通用处理留在 ./utils/lockfile.js 中维护。
import { lock } from './utils/lockfile.js'
// 整理这一组导入，让history后续逻辑可以直接复用这些外部能力。
import {
  hashPastedText,
  retrievePastedText,
  storePastedText,
} from './utils/pasteStore.js'
// 复用 sleep 工具函数，把通用处理留在 ./utils/sleep.js 中维护。
import { sleep } from './utils/sleep.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ./utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from './utils/slowOperations.js'

// MAX_HISTORY_ITEMS 集合 命名 `100`，让后续代码直接表达这个值的用途。
const MAX_HISTORY_ITEMS = 100
// MAX_PASTED_CONTENT_LENGTH 数量保存`1024`，供后续判断或组装使用。
const MAX_PASTED_CONTENT_LENGTH = 1024

/**
 * Stored paste content - either inline content or a hash reference to paste store.
 */
// StoredPastedContent 固化history里传递的数据形状，帮助调用方按同一结构读写字段。
type StoredPastedContent = {
  id: number
  type: 'text' | 'image'
  content?: string // Inline content for small pastes
  contentHash?: string // Hash reference for large pastes stored externally
  mediaType?: string
  filename?: string
}

/**
 * Claude Code parses history for pasted content references to match back to
 * pasted content. The references look like:
 *   Text: [Pasted text #1 +10 lines]
 *   Image: [Image #2]
 * The numbers are expected to be unique within a single prompt but not across
 * prompts. We choose numeric, auto-incrementing IDs as they are more
 * user-friendly than other ID options.
 */

// Note: The original text paste implementation would consider input like
// "line1\nline2\nline3" to have +2 lines, not 3 lines. We preserve that
// behavior here.
// getPastedTextRefNumLines 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPastedTextRefNumLines(text: string): number {
  // 返回 `(text.match(/\r\n|\r|\n/g) || []).length`，作为history这次计算的结果。
  return (text.match(/\r\n|\r|\n/g) || []).length
}

// formatPastedTextRef 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatPastedTextRef(id: number, numLines: number): string {
  // 满足 `numLines === 0` 时，history执行该分支。
  if (numLines === 0) {
    // 返回 ``[Pasted text #${id}]``，作为history这次计算的结果。
    return `[Pasted text #${id}]`
  }
  // 返回 ``[Pasted text #${id} +${numLines} lines]``，作为history这次计算的结果。
  return `[Pasted text #${id} +${numLines} lines]`
}

// formatImageRef 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatImageRef(id: number): string {
  // 返回 ``[Image #${id}]``，作为history这次计算的结果。
  return `[Image #${id}]`
}

// parseReferences 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseReferences(
  input: string,
): Array<{ id: number; match: string; index: number }> {
  // referencePattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const referencePattern =
    /\[(Pasted text|Image|\.\.\.Truncated text) #(\d+)(?: \+\d+ lines)?(\.)*\]/g
  // matches 集合保存`input.matchAll`，供history后续处理使用。
  const matches = [...input.matchAll(referencePattern)]
  // 返回 `matches`，作为history这次计算的结果。
  return matches
    // 链式调用 map，继续加工上一行在history中产生的数据。
    .map(match => ({
      id: parseInt(match[2] || '0'),
      match: match[0],
      index: match.index,
    }))
    // 链式调用 filter，继续加工上一行在history中产生的数据。
    .filter(match => match.id > 0)
}

/**
 * Replace [Pasted text #N] placeholders in input with their actual content.
 * Image refs are left alone — they become content blocks, not inlined text.
 */
// expandPastedTextRefs 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function expandPastedTextRefs(
  input: string,
  pastedContents: Record<number, PastedContent>,
): string {
  // refs 集合解析`parseReferences`，供history后续处理使用。
  const refs = parseReferences(input)
  // expanded保存`input`，供后续判断或组装使用。
  let expanded = input
  // Splice at the original match offsets so placeholder-like strings inside
  // pasted content are never confused for real refs. Reverse order keeps
  // earlier offsets valid after later replacements.
  // 循环处理 `let i = refs.length - 1; i >= 0; i--`，让history逐项把同类条目按顺序走完。
  for (let i = refs.length - 1; i >= 0; i--) {
    // ref 引用保存`refs[i]!`，供history后续判断或输出使用。
    const ref = refs[i]!
    // 文本内容 命名 `pastedContents[ref.id]`，让后续代码直接表达这个值的用途。
    const content = pastedContents[ref.id]
    // `content?.type` 与 `'text'` 不一致时刷新派生状态，避免使用过期结果。
    if (content?.type !== 'text') continue
    // history在这里处理 `expanded =`，完成这一小步状态转换。
    expanded =
      expanded.slice(0, ref.index) +
      content.content +
      expanded.slice(ref.index + ref.match.length)
  }
  // 返回 `expanded`，作为history这次计算的结果。
  return expanded
}

// deserializeLogEntry 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function deserializeLogEntry(line: string): LogEntry {
  // 返回 `jsonParse(line) as LogEntry`，作为history这次计算的结果。
  return jsonParse(line) as LogEntry
}

// history在这里处理 `async function* makeLogEntryReader(): AsyncGenerator<LogEntry> {`，完成这一小步状态转换。
async function* makeLogEntryReader(): AsyncGenerator<LogEntry> {
  // currentSession 会话数据读取`getSessionId`，供history后续处理使用。
  const currentSession = getSessionId()

  // Start with entries that have yet to be flushed to disk
  // 循环处理 `let i = pendingEntries.length - 1; i >= 0; i--`，让history逐项把同类条目按顺序走完。
  for (let i = pendingEntries.length - 1; i >= 0; i--) {
    // 生成器产出 `pendingEntries[i]!`，把阶段性结果交给上层消费。
    yield pendingEntries[i]!
  }

  // Read from global history file (shared across all projects)
  // historyPath 路径数据格式化`join`，供history后续处理使用。
  const historyPath = join(getClaudeConfigHomeDir(), 'history.jsonl')

  // 保护这一段可能失败的history操作，确保异常能进入相邻错误处理。
  try {
    // 逐项读取 `readLinesReverse(historyPath)` 中的line，按输入顺序推进history。
    for await (const line of readLinesReverse(historyPath)) {
      // 保护这一段可能失败的history操作，确保异常能进入相邻错误处理。
      try {
        // entry保存`deserializeLogEntry`，供history后续处理使用。
        const entry = deserializeLogEntry(line)
        // removeLastFromHistory slow path: entry was flushed before removal,
        // so filter here so both getHistory (Up-arrow) and makeHistoryReader
        // (ctrl+r search) skip it consistently.
        // history在这里进入条件判断，后续代码按实际状态分流。
        if (
          entry.sessionId === currentSession &&
          skippedTimestamps.has(entry.timestamp)
        ) {
          // 跳过当前项，继续处理history中的下一轮循环。
          continue
        }
        // 生成器产出 `entry`，把阶段性结果交给上层消费。
        yield entry
      } catch (error) {
        // Not a critical error - just skip malformed lines
        // 记录history运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to parse history line: ${error}`)
      }
    }
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供history后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，history执行对应分支。
    if (code === 'ENOENT') {
      // history在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 抛出 e，阻止history在无效状态下继续运行。
    throw e
  }
}

// history在这里处理 `export async function* makeHistoryReader(): AsyncGenerator<HistoryEntry...`，完成这一小步状态转换。
export async function* makeHistoryReader(): AsyncGenerator<HistoryEntry> {
  // 逐项读取 `makeLogEntryReader()` 中的entry，按输入顺序推进history。
  for await (const entry of makeLogEntryReader()) {
    // 生成器产出 `await logEntryToHistoryEntry(entry)`，把阶段性结果交给上层消费。
    yield await logEntryToHistoryEntry(entry)
  }
}

// TimestampedHistoryEntry 固化history里传递的数据形状，帮助调用方按同一结构读写字段。
export type TimestampedHistoryEntry = {
  display: string
  timestamp: number
  // 这个回调绑定到 resolve: () => Promise<HistoryEntry>，负责history在该局部场景下的响应。
  resolve: () => Promise<HistoryEntry>
}

/**
 * Current-project history for the ctrl+r picker: deduped by display text,
 * newest first, with timestamps. Paste contents are resolved lazily via
 * `resolve()` — the picker only reads display+timestamp for the list.
 */
// history在这里处理 `export async function* getTimestampedHistory(): AsyncGenerator<Timestam...`，完成这一小步状态转换。
export async function* getTimestampedHistory(): AsyncGenerator<TimestampedHistoryEntry> {
  // currentProject读取`getProjectRoot`，供history后续处理使用。
  const currentProject = getProjectRoot()
  // seen构建`new Set<string>()`，供后续判断或组装使用。
  const seen = new Set<string>()

  // 逐项读取 `makeLogEntryReader()` 中的entry，按输入顺序推进history。
  for await (const entry of makeLogEntryReader()) {
    // `!entry || typeof entry.project` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (!entry || typeof entry.project !== 'string') continue
    // `entry.project` 与 `currentProject` 不一致时刷新派生状态，避免使用过期结果。
    if (entry.project !== currentProject) continue
    // 满足 `seen.has(entry.display)` 时，history执行该分支。
    if (seen.has(entry.display)) continue
    // 调用 seen.add，触发history此处需要的副作用。
    seen.add(entry.display)

    // 生成器产出 `{`，把阶段性结果交给上层消费。
    yield {
      display: entry.display,
      timestamp: entry.timestamp,
      // 这个回调绑定到 resolve: () => logEntryToHistoryEntry(entry),，负责history在该局部场景下的响应。
      resolve: () => logEntryToHistoryEntry(entry),
    }

    // 满足 `seen.size >= MAX_HISTORY_ITEMS` 时，history执行该分支。
    if (seen.size >= MAX_HISTORY_ITEMS) return
  }
}

/**
 * Get history entries for the current project, with current session's entries first.
 *
 * Entries from the current session are yielded before entries from other sessions,
 * so concurrent sessions don't interleave their up-arrow history. Within each group,
 * order is newest-first. Scans the same MAX_HISTORY_ITEMS window as before —
 * entries are reordered within that window, not beyond it.
 */
// history在这里处理 `export async function* getHistory(): AsyncGenerator<HistoryEntry> {`，完成这一小步状态转换。
export async function* getHistory(): AsyncGenerator<HistoryEntry> {
  // currentProject读取`getProjectRoot`，供history后续处理使用。
  const currentProject = getProjectRoot()
  // currentSession 会话数据读取`getSessionId`，供history后续处理使用。
  const currentSession = getSessionId()
  // otherSessionEntries 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const otherSessionEntries: LogEntry[] = []
  // yielded保存`0`，供history后续判断或输出使用。
  let yielded = 0

  // 逐项读取 `makeLogEntryReader()` 中的entry，按输入顺序推进history。
  for await (const entry of makeLogEntryReader()) {
    // Skip malformed entries (corrupted file, old format, or invalid JSON structure)
    // `!entry || typeof entry.project` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (!entry || typeof entry.project !== 'string') continue
    // `entry.project` 与 `currentProject` 不一致时刷新派生状态，避免使用过期结果。
    if (entry.project !== currentProject) continue

    // 满足 `entry.sessionId === currentSession` 时，history执行该分支。
    if (entry.sessionId === currentSession) {
      // 生成器产出 `await logEntryToHistoryEntry(entry)`，把阶段性结果交给上层消费。
      yield await logEntryToHistoryEntry(entry)
      // history在这里处理 `yielded++`，完成这一小步状态转换。
      yielded++
    } else {
      // otherSessionEntries 会话数据追加新条目，保持收集顺序与输入顺序一致。
      otherSessionEntries.push(entry)
    }

    // Same MAX_HISTORY_ITEMS window as before — just reordered within it.
    // 满足 `yielded + otherSessionEntries.length >= MAX_HISTORY_ITEMS` 时，history执行该分支。
    if (yielded + otherSessionEntries.length >= MAX_HISTORY_ITEMS) break
  }

  // 按顺序遍历 `otherSessionEntries` 中的entry，逐个交给history处理。
  for (const entry of otherSessionEntries) {
    // 满足 `yielded >= MAX_HISTORY_ITEMS` 时，history执行该分支。
    if (yielded >= MAX_HISTORY_ITEMS) return
    // 生成器产出 `await logEntryToHistoryEntry(entry)`，把阶段性结果交给上层消费。
    yield await logEntryToHistoryEntry(entry)
    // history在这里处理 `yielded++`，完成这一小步状态转换。
    yielded++
  }
}

// LogEntry 固化history里传递的数据形状，帮助调用方按同一结构读写字段。
type LogEntry = {
  display: string
  pastedContents: Record<number, StoredPastedContent>
  timestamp: number
  project: string
  sessionId?: string
}

/**
 * Resolve stored paste content to full PastedContent by fetching from paste store if needed.
 */
// resolveStoredPastedContent 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function resolveStoredPastedContent(
  stored: StoredPastedContent,
): Promise<PastedContent | null> {
  // If we have inline content, use it directly
  // 满足 `stored.content` 时，history执行该分支。
  if (stored.content) {
    // 返回结构化结果，集中表达history已经整理出的状态。
    return {
      id: stored.id,
      type: stored.type,
      content: stored.content,
      mediaType: stored.mediaType,
      filename: stored.filename,
    }
  }

  // If we have a hash reference, fetch from paste store
  // 满足 `stored.contentHash` 时，history执行该分支。
  if (stored.contentHash) {
    // 文本内容保存`retrievePastedText`，供history后续处理使用。
    const content = await retrievePastedText(stored.contentHash)
    // 满足 `content` 时，history执行该分支。
    if (content) {
      // 返回结构化结果，集中表达history已经整理出的状态。
      return {
        id: stored.id,
        type: stored.type,
        content,
        mediaType: stored.mediaType,
        filename: stored.filename,
      }
    }
  }

  // Content not available
  // 返回 `null`，作为history这次计算的结果。
  return null
}

/**
 * Convert LogEntry to HistoryEntry by resolving paste store references.
 */
// logEntryToHistoryEntry 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function logEntryToHistoryEntry(entry: LogEntry): Promise<HistoryEntry> {
  // pastedContents 集合 从空对象开始收集键值，后续按名称补齐内容。
  const pastedContents: Record<number, PastedContent> = {}

  // 循环处理 `const [id, stored] of Object.entries(entry.pastedContents || {})`，让history把同类条目按顺序走完。
  for (const [id, stored] of Object.entries(entry.pastedContents || {})) {
    // resolved读取`resolveStoredPastedContent`，供history后续处理使用。
    const resolved = await resolveStoredPastedContent(stored)
    // 满足 `resolved` 时，history执行该分支。
    if (resolved) {
      // pastedContents[Number(id)更新为 `resolved`，确保history后续读取最新状态。
      pastedContents[Number(id)] = resolved
    }
  }

  // 返回结构化结果，集中表达history已经整理出的状态。
  return {
    display: entry.display,
    pastedContents,
  }
}

// pendingEntries 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
let pendingEntries: LogEntry[] = []
// isWriting标记history是否启用对应路径。
let isWriting = false
// currentFlushPromise 异步任务保存`null`，作为后续空值处理的输入。
let currentFlushPromise: Promise<void> | null = null
// cleanupRegistered标记history是否启用对应路径。
let cleanupRegistered = false
// lastAddedEntry 命名 `null`，让后续代码直接表达这个值的用途。
let lastAddedEntry: LogEntry | null = null
// Timestamps of entries already flushed to disk that should be skipped when
// reading. Used by removeLastFromHistory when the entry has raced past the
// pending buffer. Session-scoped (module state resets on process restart).
// skippedTimestamps 集合构建`new Set<number>()` 整理出中间结果，供history后续步骤使用。
const skippedTimestamps = new Set<number>()

// Core flush logic - writes pending entries to disk
// immediateFlushHistory 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function immediateFlushHistory(): Promise<void> {
  // pendingEntries 集合为空时立即返回或跳过，避免history把空集合当成可处理内容。
  if (pendingEntries.length === 0) {
    // history在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // release 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let release
  // 保护这一段可能失败的history操作，确保异常能进入相邻错误处理。
  try {
    // historyPath 路径数据格式化`join`，供history后续处理使用。
    const historyPath = join(getClaudeConfigHomeDir(), 'history.jsonl')

    // Ensure the file exists before acquiring lock (append mode creates if missing)
    // 等待 `writeFile(historyPath, '', {` 完成，再继续history的异步流程。
    await writeFile(historyPath, '', {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'a',
    })

    // release更新为 `await lock(historyPath, {`，确保history后续读取最新状态。
    release = await lock(historyPath, {
      stale: 10000,
      retries: {
        retries: 3,
        minTimeout: 50,
      },
    })

    // jsonLines 集合派生`pendingEntries.map`，供history后续处理使用。
    const jsonLines = pendingEntries.map(entry => jsonStringify(entry) + '\n')
    // pendingEntries 集合更新为 `[]`，确保history后续读取最新状态。
    pendingEntries = []

    // 等待 `appendFile(historyPath, jsonLines.join(''), { mode: 0o600 })` 完成，再继续history的异步流程。
    await appendFile(historyPath, jsonLines.join(''), { mode: 0o600 })
  } catch (error) {
    // 记录history运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to write prompt history: ${error}`)
  } finally {
    // 满足 `release` 时，history执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续history的异步流程。
      await release()
    }
  }
}

// flushPromptHistory 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function flushPromptHistory(retries: number): Promise<void> {
  // isWriting || pendingEntries 集合为空时立即返回或跳过，避免history把空集合当成可处理内容。
  if (isWriting || pendingEntries.length === 0) {
    // history在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Stop trying to flush history until the next user prompt
  // 满足 `retries > 5` 时，history执行该分支。
  if (retries > 5) {
    // history在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // isWriting更新为 `true`，确保history后续读取最新状态。
  isWriting = true

  // 保护这一段可能失败的history操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `immediateFlushHistory()` 完成，再继续history的异步流程。
    await immediateFlushHistory()
  } finally {
    // isWriting更新为 `false`，确保history后续读取最新状态。
    isWriting = false

    // 满足 `pendingEntries.length > 0` 时，history执行该分支。
    if (pendingEntries.length > 0) {
      // Avoid trying again in a hot loop
      // 等待 `sleep(500)` 完成，再继续history的异步流程。
      await sleep(500)

      // 显式忽略 `flushPromptHistory(retries + 1)` 的返回值，只保留它触发的副作用。
      void flushPromptHistory(retries + 1)
    }
  }
}

// addToPromptHistory 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function addToPromptHistory(
  command: HistoryEntry | string,
): Promise<void> {
  // entry 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const entry =
    typeof command === 'string'
      ? { display: command, pastedContents: {} }
      : command

  // storedPastedContents 集合 从空对象开始收集键值，后续按名称补齐内容。
  const storedPastedContents: Record<number, StoredPastedContent> = {}
  // 满足 `entry.pastedContents` 时，history执行该分支。
  if (entry.pastedContents) {
    // 循环处理 `const [id, content] of Object.entries(entry.pastedContents)`，让history把同类条目按顺序走完。
    for (const [id, content] of Object.entries(entry.pastedContents)) {
      // Filter out images (they're stored separately in image-cache)
      // 当 `content.type` 匹配 `'image'` 时，history执行对应分支。
      if (content.type === 'image') {
        // 跳过当前项，继续处理history中的下一轮循环。
        continue
      }

      // For small text content, store inline
      // 满足 `content.content.length <= MAX_PASTED_CONTENT_LENG` 时，history执行该分支。
      if (content.content.length <= MAX_PASTED_CONTENT_LENGTH) {
        // storedPastedContents[Number(id)更新为 `{`，确保history后续读取最新状态。
        storedPastedContents[Number(id)] = {
          id: content.id,
          type: content.type,
          content: content.content,
          mediaType: content.mediaType,
          filename: content.filename,
        }
      } else {
        // For large text content, compute hash synchronously and store reference
        // The actual disk write happens async (fire-and-forget)
        // hash保存`hashPastedText`，供history后续处理使用。
        const hash = hashPastedText(content.content)
        // storedPastedContents[Number(id)更新为 `{`，确保history后续读取最新状态。
        storedPastedContents[Number(id)] = {
          id: content.id,
          type: content.type,
          contentHash: hash,
          mediaType: content.mediaType,
          filename: content.filename,
        }
        // Fire-and-forget disk write - don't block history entry creation
        // 显式忽略 `storePastedText(hash, content.content)` 的返回值，只保留它触发的副作用。
        void storePastedText(hash, content.content)
      }
    }
  }

  // logEntry 集中保存history要一起传递的字段。
  const logEntry: LogEntry = {
    ...entry,
    pastedContents: storedPastedContents,
    timestamp: Date.now(),
    project: getProjectRoot(),
    sessionId: getSessionId(),
  }

  // pendingEntries 集合追加新条目，保持收集顺序与输入顺序一致。
  pendingEntries.push(logEntry)
  // lastAddedEntry更新为 `logEntry`，确保history后续读取最新状态。
  lastAddedEntry = logEntry
  // currentFlushPromise 异步任务更新为 `flushPromptHistory(0)`，确保history后续读取最新状态。
  currentFlushPromise = flushPromptHistory(0)
  // 显式忽略 `currentFlushPromise` 的返回值，只保留它触发的副作用。
  void currentFlushPromise
}

// addToHistory 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToHistory(command: HistoryEntry | string): void {
  // Skip history when running in a tmux session spawned by Claude Code's Tungsten tool.
  // This prevents verification/test sessions from polluting the user's real command history.
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_PROMPT_HISTORY)` 时，history执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_PROMPT_HISTORY)) {
    // history在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Register cleanup on first use
  // cleanupRegistered缺失时提前走兜底路径，避免history继续依赖无效输入。
  if (!cleanupRegistered) {
    // cleanupRegistered更新为 `true`，确保history后续读取最新状态。
    cleanupRegistered = true
    // 调用 registerCleanup，触发history此处需要的副作用。
    registerCleanup(async () => {
      // If there's an in-progress flush, wait for it
      // 满足 `currentFlushPromise` 时，history执行该分支。
      if (currentFlushPromise) {
        // 等待 `currentFlushPromise` 完成，再继续history的异步流程。
        await currentFlushPromise
      }
      // If there are still pending entries after the flush completed, do one final flush
      // 满足 `pendingEntries.length > 0` 时，history执行该分支。
      if (pendingEntries.length > 0) {
        // 等待 `immediateFlushHistory()` 完成，再继续history的异步流程。
        await immediateFlushHistory()
      }
    })
  }

  // 显式忽略 `addToPromptHistory(command)` 的返回值，只保留它触发的副作用。
  void addToPromptHistory(command)
}

// clearPendingHistoryEntries 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPendingHistoryEntries(): void {
  // pendingEntries 集合更新为 `[]`，确保history后续读取最新状态。
  pendingEntries = []
  // lastAddedEntry更新为 `null`，确保history后续读取最新状态。
  lastAddedEntry = null
  // 调用 skippedTimestamps.clear，触发history此处需要的副作用。
  skippedTimestamps.clear()
}

/**
 * Undo the most recent addToHistory call. Used by auto-restore-on-interrupt:
 * when Esc rewinds the conversation before any response arrives, the submit is
 * semantically undone — the history entry should be too, otherwise Up-arrow
 * shows the restored text twice (once from the input box, once from disk).
 *
 * Fast path pops from the pending buffer. If the async flush already won the
 * race (TTFT is typically >> disk write latency), the entry's timestamp is
 * added to a skip-set consulted by getHistory. One-shot: clears the tracked
 * entry so a second call is a no-op.
 */
// removeLastFromHistory 封装history的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeLastFromHistory(): void {
  // lastAddedEntry缺失时提前走兜底路径，避免history继续依赖无效输入。
  if (!lastAddedEntry) return
  // entry 命名 `lastAddedEntry`，让后续代码直接表达这个值的用途。
  const entry = lastAddedEntry
  // lastAddedEntry更新为 `null`，确保history后续读取最新状态。
  lastAddedEntry = null

  // idx保存`pendingEntries.lastIndexOf`，供history后续处理使用。
  const idx = pendingEntries.lastIndexOf(entry)
  // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (idx !== -1) {
    // 调用 pendingEntries.splice，触发history此处需要的副作用。
    pendingEntries.splice(idx, 1)
  } else {
    // 调用 skippedTimestamps.add，触发history此处需要的副作用。
    skippedTimestamps.add(entry.timestamp)
  }
}
