// 引入 getMainLoopModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModel } from './model/model.js'

// Document extensions that are handled specially
// DOCUMENT_EXTENSIONS 集合保存`Set`，供共享工具后续处理使用。
export const DOCUMENT_EXTENSIONS = new Set(['pdf'])

/**
 * Parse a page range string into firstPage/lastPage numbers.
 * Supported formats:
 * - "5" → { firstPage: 5, lastPage: 5 }
 * - "1-10" → { firstPage: 1, lastPage: 10 }
 * - "3-" → { firstPage: 3, lastPage: Infinity }
 *
 * Returns null on invalid input (non-numeric, zero, inverted range).
 * Pages are 1-indexed.
 */
// parsePDFPageRange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePDFPageRange(
  pages: string,
): { firstPage: number; lastPage: number } | null {
  // trimmed格式化`pages.trim`，供共享工具后续处理使用。
  const trimmed = pages.trim()
  // trimmed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmed) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // "N-" open-ended range
  // 满足 `trimmed.endsWith('-')` 时，共享工具执行该分支。
  if (trimmed.endsWith('-')) {
    // first解析`parseInt`，供共享工具后续处理使用。
    const first = parseInt(trimmed.slice(0, -1), 10)
    // 只有 `isNaN(first) || first < 1` 满足时，共享工具才执行该分支。
    if (isNaN(first) || first < 1) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { firstPage: first, lastPage: Infinity }
  }

  // dashIndex 索引格式化`trimmed.indexOf`，供共享工具后续处理使用。
  const dashIndex = trimmed.indexOf('-')
  // 满足 `dashIndex === -1` 时，共享工具执行该分支。
  if (dashIndex === -1) {
    // Single page: "5"
    // page解析`parseInt`，供共享工具后续处理使用。
    const page = parseInt(trimmed, 10)
    // 只有 `isNaN(page) || page < 1` 满足时，共享工具才执行该分支。
    if (isNaN(page) || page < 1) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { firstPage: page, lastPage: page }
  }

  // Range: "1-10"
  // first解析`parseInt`，供共享工具后续处理使用。
  const first = parseInt(trimmed.slice(0, dashIndex), 10)
  // last解析`parseInt`，供共享工具后续处理使用。
  const last = parseInt(trimmed.slice(dashIndex + 1), 10)
  // 只有 `isNaN(first) || isNaN(last) || first < 1 || last < 1 || last < first` 满足时，共享工具才执行该分支。
  if (isNaN(first) || isNaN(last) || first < 1 || last < 1 || last < first) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { firstPage: first, lastPage: last }
}

/**
 * Check if PDF reading is supported with the current model.
 * PDF document blocks work on all providers (1P, Vertex, Bedrock, Foundry).
 * Haiku 3 is the only remaining model that predates PDF support; users on
 * it fall back to the page-extraction path (poppler-utils). Substring match
 * covers all provider ID formats (Bedrock prefixes, Vertex @-dates).
 */
// isPDFSupported 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPDFSupported(): boolean {
  // 返回 `!getMainLoopModel().toLowerCase().includes('claude-3-haiku')`，作为共享工具这次计算的结果。
  return !getMainLoopModel().toLowerCase().includes('claude-3-haiku')
}

/**
 * Check if a file extension is a PDF document.
 * @param ext File extension (with or without leading dot)
 */
// isPDFExtension 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPDFExtension(ext: string): boolean {
  // normalized保存`ext.startsWith`，供共享工具后续处理使用。
  const normalized = ext.startsWith('.') ? ext.slice(1) : ext
  // 返回 `DOCUMENT_EXTENSIONS.has(normalized.toLowerCase())`，作为共享工具这次计算的结果。
  return DOCUMENT_EXTENSIONS.has(normalized.toLowerCase())
}
