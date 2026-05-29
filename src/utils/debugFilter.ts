// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'

// DebugFilter 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DebugFilter = {
  include: string[]
  exclude: string[]
  isExclusive: boolean
}

/**
 * Parse debug filter string into a filter configuration
 * Examples:
 * - "api,hooks" -> include only api and hooks categories
 * - "!1p,!file" -> exclude logging and file categories
 * - undefined/empty -> no filtering (show all)
 */
// parseDebugFilter保存`memoize`，供共享工具后续处理使用。
export const parseDebugFilter = memoize(
  (filterString?: string): DebugFilter | null => {
    // 只有 `!filterString || filterString.trim() === ''` 满足时，共享工具才执行该分支。
    if (!filterString || filterString.trim() === '') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // filters 集合筛选`filterString`，供后续判断或组装使用。
    const filters = filterString
      .split(',')
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(f => f.trim())
      .filter(Boolean)

    // If no valid filters remain, return null
    // filters 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (filters.length === 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Check for mixed inclusive/exclusive filters
    // hasExclusive记录 `filters.some` 是否成立，共享工具随后按该结果分支。
    const hasExclusive = filters.some(f => f.startsWith('!'))
    // hasInclusive记录 `filters.some` 是否成立，共享工具随后按该结果分支。
    const hasInclusive = filters.some(f => !f.startsWith('!'))

    // 只有 `hasExclusive && hasInclusive` 满足时，共享工具才执行该分支。
    if (hasExclusive && hasInclusive) {
      // For now, we'll treat this as an error case and show all messages
      // Log error using logForDebugging to avoid console.error lint rule
      // We'll import and use it later when the circular dependency is resolved
      // For now, just return null silently
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Clean up filters (remove ! prefix) and normalize
    // cleanFilters 集合筛选`filters.map`，供共享工具后续处理使用。
    const cleanFilters = filters.map(f => f.replace(/^!/, '').toLowerCase())

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      include: hasExclusive ? [] : cleanFilters,
      exclude: hasExclusive ? cleanFilters : [],
      isExclusive: hasExclusive,
    }
  },
)

/**
 * Extract debug categories from a message
 * Supports multiple patterns:
 * - "category: message" -> ["category"]
 * - "[CATEGORY] message" -> ["category"]
 * - "MCP server \"name\": message" -> ["mcp", "name"]
 * - "[ANT-ONLY] 1P event: tengu_timer" -> ["ant-only", "1p"]
 *
 * Returns lowercase categories for case-insensitive matching
 */
// extractDebugCategories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractDebugCategories(message: string): string[] {
  // categories 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const categories: string[] = []

  // Pattern 3: MCP server "servername" - Check this first to avoid false positives
  // mcpMatch匹配`message.match`，供共享工具后续处理使用。
  const mcpMatch = message.match(/^MCP server ["']([^"']+)["']/)
  // 只有 `mcpMatch && mcpMatch[1]` 满足时，共享工具才执行该分支。
  if (mcpMatch && mcpMatch[1]) {
    // categories 集合追加新条目，保持收集顺序与输入顺序一致。
    categories.push('mcp')
    // categories 集合追加新条目，保持收集顺序与输入顺序一致。
    categories.push(mcpMatch[1].toLowerCase())
  } else {
    // Pattern 1: "category: message" (simple prefix) - only if not MCP pattern
    // prefixMatch匹配`message.match`，供共享工具后续处理使用。
    const prefixMatch = message.match(/^([^:[]+):/)
    // 只有 `prefixMatch && prefixMatch[1]` 满足时，共享工具才执行该分支。
    if (prefixMatch && prefixMatch[1]) {
      // categories 集合追加新条目，保持收集顺序与输入顺序一致。
      categories.push(prefixMatch[1].trim().toLowerCase())
    }
  }

  // Pattern 2: [CATEGORY] at the start
  // bracketMatch匹配`message.match`，供共享工具后续处理使用。
  const bracketMatch = message.match(/^\[([^\]]+)]/)
  // 只有 `bracketMatch && bracketMatch[1]` 满足时，共享工具才执行该分支。
  if (bracketMatch && bracketMatch[1]) {
    // categories 集合追加新条目，保持收集顺序与输入顺序一致。
    categories.push(bracketMatch[1].trim().toLowerCase())
  }

  // Pattern 4: Check for additional categories in the message
  // e.g., "[ANT-ONLY] 1P event: tengu_timer" should match both "ant-only" and "1p"
  // 满足 `message.toLowerCase().includes('1p event:')` 时，共享工具执行该分支。
  if (message.toLowerCase().includes('1p event:')) {
    // categories 集合追加新条目，保持收集顺序与输入顺序一致。
    categories.push('1p')
  }

  // Pattern 5: Look for secondary categories after the first pattern
  // e.g., "AutoUpdaterWrapper: Installation type: development"
  // secondaryMatch匹配`message.match`，供共享工具后续处理使用。
  const secondaryMatch = message.match(
    /:\s*([^:]+?)(?:\s+(?:type|mode|status|event))?:/,
  )
  // 只有 `secondaryMatch && secondaryMatch[1]` 满足时，共享工具才执行该分支。
  if (secondaryMatch && secondaryMatch[1]) {
    // secondary格式化`trim`，供共享工具后续处理使用。
    const secondary = secondaryMatch[1].trim().toLowerCase()
    // Only add if it's a reasonable category name (not too long, no spaces)
    // 只有 `secondary.length < 30 && !secondary.includes(' ')` 满足时，共享工具才执行该分支。
    if (secondary.length < 30 && !secondary.includes(' ')) {
      // categories 集合追加新条目，保持收集顺序与输入顺序一致。
      categories.push(secondary)
    }
  }

  // If no categories found, return empty array (uncategorized)
  // 返回 `Array.from(new Set(categories)) // Remove duplicates`，作为共享工具这次计算的结果。
  return Array.from(new Set(categories)) // Remove duplicates
}

/**
 * Check if debug message should be shown based on filter
 * @param categories - Categories extracted from the message
 * @param filter - Parsed filter configuration
 * @returns true if message should be shown
 */
// shouldShowDebugCategories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowDebugCategories(
  categories: string[],
  filter: DebugFilter | null,
): boolean {
  // No filter means show everything
  // filter缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!filter) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // If no categories found, handle based on filter mode
  // categories 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (categories.length === 0) {
    // In exclusive mode, uncategorized messages are excluded by default for security
    // In inclusive mode, uncategorized messages are excluded (must match a category)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `filter.isExclusive` 时，共享工具执行该分支。
  if (filter.isExclusive) {
    // Exclusive mode: show if none of the categories are in the exclude list
    // 返回 `!categories.some(cat => filter.exclude.includes(cat))`，作为共享工具这次计算的结果。
    return !categories.some(cat => filter.exclude.includes(cat))
  } else {
    // Inclusive mode: show if any of the categories are in the include list
    // 返回 `categories.some(cat => filter.include.includes(cat))`，作为共享工具这次计算的结果。
    return categories.some(cat => filter.include.includes(cat))
  }
}

/**
 * Main function to check if a debug message should be shown
 * Combines extraction and filtering
 */
// shouldShowDebugMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowDebugMessage(
  message: string,
  filter: DebugFilter | null,
): boolean {
  // Fast path: no filter means show everything
  // filter缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!filter) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Only extract categories if we have a filter
  // categories 集合保存`extractDebugCategories`，供共享工具后续处理使用。
  const categories = extractDebugCategories(message)
  // 返回 `shouldShowDebugCategories(categories, filter)`，作为共享工具这次计算的结果。
  return shouldShowDebugCategories(categories, filter)
}
