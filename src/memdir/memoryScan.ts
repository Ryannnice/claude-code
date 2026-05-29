/**
 * Memory-directory scanning primitives. Split out of findRelevantMemories.ts
 * so extractMemories can import the scan without pulling in sideQuery and
 * the API-client chain (which closed a cycle through memdir.ts — #25372).
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join } from 'path'
// 复用 parseFrontmatter 工具函数，把通用处理留在 ../utils/frontmatterParser.js 中维护。
import { parseFrontmatter } from '../utils/frontmatterParser.js'
// 复用 readFileInRange 工具函数，把通用处理留在 ../utils/readFileInRange.js 中维护。
import { readFileInRange } from '../utils/readFileInRange.js'
// 引入 MemoryType、parseMemoryType，将 ./memoryTypes.js 中已经封装好的能力接到本文件流程里。
import { type MemoryType, parseMemoryType } from './memoryTypes.js'

// MemoryHeader 固化memory Scan里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryHeader = {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
}

// MAX_MEMORY_FILES 文件数据保存`200`，供后续判断或组装使用。
const MAX_MEMORY_FILES = 200
// FRONTMATTER_MAX_LINES 集合 命名 `30`，让后续代码直接表达这个值的用途。
const FRONTMATTER_MAX_LINES = 30

/**
 * Scan a memory directory for .md files, read their frontmatter, and return
 * a header list sorted newest-first (capped at MAX_MEMORY_FILES). Shared by
 * findRelevantMemories (query-time recall) and extractMemories (pre-injects
 * the listing so the extraction agent doesn't spend a turn on `ls`).
 *
 * Single-pass: readFileInRange stats internally and returns mtimeMs, so we
 * read-then-sort rather than stat-sort-read. For the common case (N ≤ 200)
 * this halves syscalls vs a separate stat round; for large N we read a few
 * extra small files but still avoid the double-stat on the surviving 200.
 */
// scanMemoryFiles 封装memoryScan的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function scanMemoryFiles(
  memoryDir: string,
  signal: AbortSignal,
): Promise<MemoryHeader[]> {
  // 保护这一段可能失败的memory Scan操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合读取`readdir`，供memory Scan后续处理使用。
    const entries = await readdir(memoryDir, { recursive: true })
    // mdFiles 文件数据筛选`entries.filter`，供memory Scan后续处理使用。
    const mdFiles = entries.filter(
      // f更新为 `> f.endsWith('.md') && basename(f) !== 'MEMORY.md'`，确保memoryScan后续读取最新状态。
      f => f.endsWith('.md') && basename(f) !== 'MEMORY.md',
    )

    // headerResults 集合保存`Promise.allSettled`，供memory Scan后续处理使用。
    const headerResults = await Promise.allSettled(
      // 调用 mdFiles.map，触发memory Scan此处需要的副作用。
      mdFiles.map(async (relativePath): Promise<MemoryHeader> => {
        // 文件路径格式化`join`，供memory Scan后续处理使用。
        const filePath = join(memoryDir, relativePath)
        // 从 `await readFileInRange(` 解构 content、mtimeMs，减少memory Scan对同一对象的重复访问。
        const { content, mtimeMs } = await readFileInRange(
          filePath,
          0,
          FRONTMATTER_MAX_LINES,
          undefined,
          signal,
        )
        // 从 `parseFrontmatter(content, filePath)` 解构 frontmatter，减少memory Scan对同一对象的重复访问。
        const { frontmatter } = parseFrontmatter(content, filePath)
        // 返回结构化结果，集中表达memory Scan已经整理出的状态。
        return {
          filename: relativePath,
          filePath,
          mtimeMs,
          description: frontmatter.description || null,
          type: parseMemoryType(frontmatter.type),
        }
      }),
    )

    // 返回 `headerResults`，作为memory Scan这次计算的结果。
    return headerResults
      .filter(
        // 这个回调绑定到 (r): r is PromiseFulfilledResult<MemoryHeader> =>，负责memory Scan在该局部场景下的响应。
        (r): r is PromiseFulfilledResult<MemoryHeader> =>
          r.status === 'fulfilled',
      )
      // 链式调用 map，继续加工上一行在memory Scan中产生的数据。
      .map(r => r.value)
      // 链式调用 sort，继续加工上一行在memory Scan中产生的数据。
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, MAX_MEMORY_FILES)
  } catch {
    // 返回列表结果，保留memory Scan已经排好的条目顺序。
    return []
  }
}

/**
 * Format memory headers as a text manifest: one line per file with
 * [type] filename (timestamp): description. Used by both the recall
 * selector prompt and the extraction-agent prompt.
 */
// formatMemoryManifest 封装memoryScan的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatMemoryManifest(memories: MemoryHeader[]): string {
  // 返回 `memories`，作为memory Scan这次计算的结果。
  return memories
    .map(m => {
      // tag 命名 `m.type ? `[${m.type}] ` : ''`，让后续代码直接表达这个值的用途。
      const tag = m.type ? `[${m.type}] ` : ''
      // ts 集合记录时间`Date`，供memory Scan后续处理使用。
      const ts = new Date(m.mtimeMs).toISOString()
      // 返回 `m.description`，作为memory Scan这次计算的结果。
      return m.description
        ? `- ${tag}${m.filename} (${ts}): ${m.description}`
        : `- ${tag}${m.filename} (${ts})`
    })
    .join('\n')
}
