// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open, readFile, stat } from 'fs/promises'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  applyEdits,
  modify,
  parse as parseJsonc,
} from 'jsonc-parser/lib/esm/main.js'
// 引入 stripBOM，将 ./jsonRead.js 中已经封装好的能力接到本文件流程里。
import { stripBOM } from './jsonRead.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 memoizeWithLRU，将 ./memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from './memoize.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// CachedParse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedParse = { ok: true; value: unknown } | { ok: false }

// Memoized inner parse. Uses a discriminated-union wrapper because:
// 1. memoizeWithLRU requires NonNullable<unknown>, but JSON.parse can return
//    null (e.g. JSON.parse("null")).
// 2. Invalid JSON must also be cached — otherwise repeated calls with the same
//    bad string re-parse and re-log every time (behavioral regression vs the
//    old lodash memoize which wrapped the entire try/catch).
// Bounded to 50 entries to prevent unbounded memory growth — previously this
// used lodash memoize which cached every unique JSON string forever (settings,
// .mcp.json, notebooks, tool results), causing a significant memory leak.
// Note: shouldLogError is intentionally excluded from the cache key (matching
// lodash memoize default resolver = first arg only).
// Skip caching above this size — the LRU stores the full string as the key,
// so a 200KB config file would pin ~10MB in #keyList across 50 slots. Large
// inputs like ~/.claude.json also change between reads (numStartups bumps on
// every CC startup), so the cache never hits anyway.
// PARSE_CACHE_MAX_KEY_BYTES 缓存保存`8 * 1024`，供后续判断或组装使用。
const PARSE_CACHE_MAX_KEY_BYTES = 8 * 1024

// parseJSONUncached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseJSONUncached(json: string, shouldLogError: boolean): CachedParse {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: true, value: JSON.parse(stripBOM(json)) }
  } catch (e) {
    // 满足 `shouldLogError` 时，共享工具执行该分支。
    if (shouldLogError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: false }
  }
}

// parseJSONCached 缓存保存`memoizeWithLRU`，供共享工具后续处理使用。
const parseJSONCached = memoizeWithLRU(parseJSONUncached, json => json, 50)

// Important: memoized for performance (LRU-bounded to 50 entries, small inputs only).
// safeParseJSON保存`Object.assign`，供共享工具后续处理使用。
export const safeParseJSON = Object.assign(
  // safeParseJSON 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function safeParseJSON(
    json: string | null | undefined,
    shouldLogError: boolean = true,
  ): unknown {
    // json缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!json) return null
    // result 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const result =
      json.length > PARSE_CACHE_MAX_KEY_BYTES
        ? parseJSONUncached(json, shouldLogError)
        : parseJSONCached(json, shouldLogError)
    // 返回 `result.ok ? result.value : null`，作为共享工具这次计算的结果。
    return result.ok ? result.value : null
  },
  { cache: parseJSONCached.cache },
)

/**
 * Safely parse JSON with comments (jsonc).
 * This is useful for VS Code configuration files like keybindings.json
 * which support comments and other jsonc features.
 */
// safeParseJSONC 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function safeParseJSONC(json: string | null | undefined): unknown {
  // json缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!json) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Strip BOM before parsing - PowerShell 5.x adds BOM to UTF-8 files
    // 返回 `parseJsonc(stripBOM(json))`，作为共享工具这次计算的结果。
    return parseJsonc(stripBOM(json))
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Modify a jsonc string by adding a new item to an array, preserving comments and formatting.
 * @param content The jsonc string to modify
 * @param newItem The new item to add to the array
 * @returns The modified jsonc string
 */
/**
 * Bun.JSONL.parseChunk if available, false otherwise.
 * Supports both strings and Buffers, minimizing memory usage and copies.
 * Also handles BOM stripping internally.
 */
// BunJSONLParseChunk 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BunJSONLParseChunk = (
  data: string | Buffer,
  offset?: number,
) => { values: unknown[]; error: null | Error; read: number; done: boolean }

// 这个回调绑定到 const bunJSONLParse: BunJSONLParseChunk | false = (() => {，负责共享工具在该局部场景下的响应。
const bunJSONLParse: BunJSONLParseChunk | false = (() => {
  // 当 `typeof Bun` 匹配 `'undefined'` 时，共享工具执行对应分支。
  if (typeof Bun === 'undefined') return false
  // b 命名 `Bun as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const b = Bun as Record<string, unknown>
  // jsonl 命名 `b.JSONL as Record<string, unknown> | undefined`，让后续代码直接表达这个值的用途。
  const jsonl = b.JSONL as Record<string, unknown> | undefined
  // 满足 `!jsonl?.parseChunk` 时，共享工具执行该分支。
  if (!jsonl?.parseChunk) return false
  // 返回 `jsonl.parseChunk as BunJSONLParseChunk`，作为共享工具这次计算的结果。
  return jsonl.parseChunk as BunJSONLParseChunk
})()

// parseJSONLBun 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseJSONLBun<T>(data: string | Buffer): T[] {
  // parse保存`bunJSONLParse as BunJSONLParseChunk`，供后续判断或组装使用。
  const parse = bunJSONLParse as BunJSONLParseChunk
  // len保存 `data.length` 的判断结果，供共享工具 json后续分支直接复用。
  const len = data.length
  // 结果解析`parse`，供共享工具后续处理使用。
  const result = parse(data)
  // 只有 `!result.error || result.done || result.read >= len` 满足时，共享工具才执行该分支。
  if (!result.error || result.done || result.read >= len) {
    // 返回 `result.values as T[]`，作为共享工具这次计算的结果。
    return result.values as T[]
  }
  // Had an error mid-stream — collect what we got and keep going
  // values 集合 命名 `result.values as T[]`，让后续代码直接表达这个值的用途。
  let values = result.values as T[]
  // offset读取`result.read` 整理出中间结果，供共享工具 json后续步骤使用。
  let offset = result.read
  // while 使用 offset < len 完成共享工具里的对应操作。
  while (offset < len) {
    // newlineIndex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const newlineIndex =
      typeof data === 'string'
        ? data.indexOf('\n', offset)
        : data.indexOf(0x0a, offset)
    // 满足 `newlineIndex === -1` 时，共享工具执行该分支。
    if (newlineIndex === -1) break
    // offset更新为 `newlineIndex + 1`，确保共享工具后续读取最新状态。
    offset = newlineIndex + 1
    // next解析`parse`，供共享工具后续处理使用。
    const next = parse(data, offset)
    // 满足 `next.values.length > 0` 时，共享工具执行该分支。
    if (next.values.length > 0) {
      // values 集合更新为 `values.concat(next.values as T[])`，确保共享工具后续读取最新状态。
      values = values.concat(next.values as T[])
    }
    // 只有 `!next.error || next.done || next.read >= len` 满足时，共享工具才执行该分支。
    if (!next.error || next.done || next.read >= len) break
    // offset更新为 `next.read`，确保共享工具后续读取最新状态。
    offset = next.read
  }
  // 返回 `values`，作为共享工具这次计算的结果。
  return values
}

// parseJSONLBuffer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseJSONLBuffer<T>(buf: Buffer): T[] {
  // bufLen 命名 `buf.length`，让后续代码直接表达这个值的用途。
  const bufLen = buf.length
  // start保存`0`，供共享工具 json后续判断或输出使用。
  let start = 0

  // Strip UTF-8 BOM (EF BB BF)
  // 只有 `buf[0] === 0xef && buf[1] === 0xbb && buf[2] ===` 满足时，共享工具才执行该分支。
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    // start更新为 `3`，确保共享工具后续读取最新状态。
    start = 3
  }

  // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const results: T[] = []
  // while 使用 start < bufLen 完成共享工具里的对应操作。
  while (start < bufLen) {
    // end保存`buf.indexOf`，供共享工具后续处理使用。
    let end = buf.indexOf(0x0a, start)
    // 满足 `end === -1` 时，共享工具执行该分支。
    if (end === -1) end = bufLen

    // line格式化`buf.toString`，供共享工具后续处理使用。
    const line = buf.toString('utf8', start, end).trim()
    // start更新为 `end + 1`，确保共享工具后续读取最新状态。
    start = end + 1
    // line缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!line) continue
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果列表追加新条目，保持收集顺序与输入顺序一致。
      results.push(JSON.parse(line) as T)
    } catch {
      // Skip malformed lines
    }
  }
  // 返回 `results`，作为共享工具这次计算的结果。
  return results
}

// parseJSONLString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseJSONLString<T>(data: string): T[] {
  // stripped保存`stripBOM`，供共享工具后续处理使用。
  const stripped = stripBOM(data)
  // len保存 `stripped.length` 的判断结果，供共享工具 json后续分支直接复用。
  const len = stripped.length
  // start保存`0`，供共享工具 json后续判断或输出使用。
  let start = 0

  // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const results: T[] = []
  // while 使用 start < len 完成共享工具里的对应操作。
  while (start < len) {
    // end保存`stripped.indexOf`，供共享工具后续处理使用。
    let end = stripped.indexOf('\n', start)
    // 满足 `end === -1` 时，共享工具执行该分支。
    if (end === -1) end = len

    // line格式化`stripped.substring`，供共享工具后续处理使用。
    const line = stripped.substring(start, end).trim()
    // start更新为 `end + 1`，确保共享工具后续读取最新状态。
    start = end + 1
    // line缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!line) continue
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果列表追加新条目，保持收集顺序与输入顺序一致。
      results.push(JSON.parse(line) as T)
    } catch {
      // Skip malformed lines
    }
  }
  // 返回 `results`，作为共享工具这次计算的结果。
  return results
}

/**
 * Parses JSONL data from a string or Buffer, skipping malformed lines.
 * Uses Bun.JSONL.parseChunk when available for better performance,
 * falls back to indexOf-based scanning otherwise.
 */
// parseJSONL 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseJSONL<T>(data: string | Buffer): T[] {
  // 满足 `bunJSONLParse` 时，共享工具执行该分支。
  if (bunJSONLParse) {
    // 返回 `parseJSONLBun<T>(data)`，作为共享工具这次计算的结果。
    return parseJSONLBun<T>(data)
  }
  // 当 `typeof data` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof data === 'string') {
    // 返回 `parseJSONLString<T>(data)`，作为共享工具这次计算的结果。
    return parseJSONLString<T>(data)
  }
  // 返回 `parseJSONLBuffer<T>(data)`，作为共享工具这次计算的结果。
  return parseJSONLBuffer<T>(data)
}

// MAX_JSONL_READ_BYTES 集合保存`100 * 1024 * 1024`，供后续判断或组装使用。
const MAX_JSONL_READ_BYTES = 100 * 1024 * 1024

/**
 * Reads and parses a JSONL file, reading at most the last 100 MB.
 * For files larger than 100 MB, reads the tail and skips the first partial line.
 *
 * 100 MB is more than sufficient since the longest context window we support
 * is ~2M tokens, which is well under 100 MB of JSONL.
 */
// readJSONLFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readJSONLFile<T>(filePath: string): Promise<T[]> {
  // 从 `await stat(filePath)` 解构 size，减少共享工具 json对同一对象的重复访问。
  const { size } = await stat(filePath)
  // 满足 `size <= MAX_JSONL_READ_BYTES` 时，共享工具执行该分支。
  if (size <= MAX_JSONL_READ_BYTES) {
    // 返回 `parseJSONL<T>(await readFile(filePath))`，作为共享工具这次计算的结果。
    return parseJSONL<T>(await readFile(filePath))
  }
  // 等待 `using fd = await open(filePath, 'r')` 完成，再继续共享工具 json的异步流程。
  await using fd = await open(filePath, 'r')
  // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const buf = Buffer.allocUnsafe(MAX_JSONL_READ_BYTES)
  // totalRead保存`0`，供后续判断或组装使用。
  let totalRead = 0
  // fileOffset 文件数据统计`size - MAX_JSONL_READ_BYTES` 整理出中间结果，供共享工具 json后续步骤使用。
  const fileOffset = size - MAX_JSONL_READ_BYTES
  // while 使用 totalRead < MAX_JSONL_READ_BYTES 完成共享工具里的对应操作。
  while (totalRead < MAX_JSONL_READ_BYTES) {
    // 从 `await fd.read(` 解构 bytesRead，减少共享工具 json对同一对象的重复访问。
    const { bytesRead } = await fd.read(
      buf,
      totalRead,
      MAX_JSONL_READ_BYTES - totalRead,
      fileOffset + totalRead,
    )
    // 满足 `bytesRead === 0` 时，共享工具执行该分支。
    if (bytesRead === 0) break
    // 共享工具 json在这里处理 `totalRead += bytesRead`，完成这一小步状态转换。
    totalRead += bytesRead
  }
  // Skip the first partial line
  // newlineIndex 索引保存`buf.indexOf`，供共享工具后续处理使用。
  const newlineIndex = buf.indexOf(0x0a)
  // `newlineIndex` 与 `-1 && newlineIndex < totalRead -` 不一致时刷新派生状态，避免使用过期结果。
  if (newlineIndex !== -1 && newlineIndex < totalRead - 1) {
    // 返回 `parseJSONL<T>(buf.subarray(newlineIndex + 1, totalRead))`，作为共享工具这次计算的结果。
    return parseJSONL<T>(buf.subarray(newlineIndex + 1, totalRead))
  }
  // 返回 `parseJSONL<T>(buf.subarray(0, totalRead))`，作为共享工具这次计算的结果。
  return parseJSONL<T>(buf.subarray(0, totalRead))
}

// addItemToJSONCArray 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addItemToJSONCArray(content: string, newItem: unknown): string {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // If the content is empty or whitespace, create a new JSON file
    // 只有 `!content || content.trim() === ''` 满足时，共享工具才执行该分支。
    if (!content || content.trim() === '') {
      // 返回 `jsonStringify([newItem], null, 4)`，作为共享工具这次计算的结果。
      return jsonStringify([newItem], null, 4)
    }

    // Strip BOM before parsing - PowerShell 5.x adds BOM to UTF-8 files
    // cleanContent保存`stripBOM`，供共享工具后续处理使用。
    const cleanContent = stripBOM(content)

    // Parse the content to check if it's valid JSON
    // parsedContent解析`parseJsonc`，供共享工具后续处理使用。
    const parsedContent = parseJsonc(cleanContent)

    // If the parsed content is a valid array, modify it
    // 满足 `Array.isArray(parsedContent)` 时，共享工具执行该分支。
    if (Array.isArray(parsedContent)) {
      // Get the length of the array
      // arrayLength 数量 命名 `parsedContent.length`，让后续代码直接表达这个值的用途。
      const arrayLength = parsedContent.length

      // Determine if we are dealing with an empty array
      // isEmpty标记共享工具 json是否启用对应路径。
      const isEmpty = arrayLength === 0

      // If it's an empty array we want to add at index 0, otherwise append to the end
      // insertPath 路径数据保存`isEmpty ? [0] : [arrayLength]`，供共享工具 json后续判断或输出使用。
      const insertPath = isEmpty ? [0] : [arrayLength]

      // Generate edits - we're using isArrayInsertion to add a new item without overwriting existing ones
      // edits 集合保存`modify`，供共享工具后续处理使用。
      const edits = modify(cleanContent, insertPath, newItem, {
        formattingOptions: { insertSpaces: true, tabSize: 4 },
        isArrayInsertion: true,
      })

      // If edits could not be generated, fall back to manual JSON string manipulation
      // !edits || edits 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (!edits || edits.length === 0) {
        // copy 聚合成有序列表，保持后续遍历顺序稳定。
        const copy = [...parsedContent, newItem]
        // 返回 `jsonStringify(copy, null, 4)`，作为共享工具这次计算的结果。
        return jsonStringify(copy, null, 4)
      }

      // Apply the edits to preserve comments (use cleanContent without BOM)
      // 返回 `applyEdits(cleanContent, edits)`，作为共享工具这次计算的结果。
      return applyEdits(cleanContent, edits)
    }
    // If it's not an array at all, create a new array with the item
    else {
      // If the content exists but is not an array, we'll replace it completely
      // 返回 `jsonStringify([newItem], null, 4)`，作为共享工具这次计算的结果。
      return jsonStringify([newItem], null, 4)
    }
  } catch (e) {
    // If parsing fails for any reason, log the error and fallback to creating a new JSON array
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `jsonStringify([newItem], null, 4)`，作为共享工具这次计算的结果。
    return jsonStringify([newItem], null, 4)
  }
}
