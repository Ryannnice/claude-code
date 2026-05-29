// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ContentBlockParam,
  ImageBlockParam,
  TextBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  countMessagesTokensWithAPI,
  roughTokenCountEstimation,
} from '../services/tokenEstimation.js'
// 引入 compressImageBlock，将 ./imageResizer.js 中已经封装好的能力接到本文件流程里。
import { compressImageBlock } from './imageResizer.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// MCP_TOKEN_COUNT_THRESHOLD_FACTOR 数量保存`0.5`，供后续判断或组装使用。
export const MCP_TOKEN_COUNT_THRESHOLD_FACTOR = 0.5
// IMAGE_TOKEN_ESTIMATE保存`1600`，供共享工具 mcp Validation后续判断或输出使用。
export const IMAGE_TOKEN_ESTIMATE = 1600
// DEFAULT_MAX_MCP_OUTPUT_TOKENS 集合保存`25000`，供后续判断或组装使用。
const DEFAULT_MAX_MCP_OUTPUT_TOKENS = 25000

/**
 * Resolve the MCP output token cap. Precedence:
 *   1. MAX_MCP_OUTPUT_TOKENS env var (explicit user override)
 *   2. tengu_satin_quoll GrowthBook flag's `mcp_tool` key (tokens, not chars —
 *      unlike the other keys in that map which getPersistenceThreshold reads
 *      as chars; MCP has its own truncation layer upstream of that)
 *   3. Hardcoded default
 */
// getMaxMcpOutputTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxMcpOutputTokens(): number {
  // envValue 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envValue = process.env.MAX_MCP_OUTPUT_TOKENS
  // 满足 `envValue` 时，共享工具执行该分支。
  if (envValue) {
    // 解析结果解析`parseInt`，供共享工具后续处理使用。
    const parsed = parseInt(envValue, 10)
    // 只有 `Number.isFinite(parsed) && parsed > 0` 满足时，共享工具才执行该分支。
    if (Number.isFinite(parsed) && parsed > 0) {
      // 返回 `parsed`，作为共享工具这次计算的结果。
      return parsed
    }
  }
  // overrides 集合 命名 `getFeatureValue_CACHED_MAY_BE_STALE<Record<`，让后续代码直接表达这个值的用途。
  const overrides = getFeatureValue_CACHED_MAY_BE_STALE<Record<
    string,
    number
  > | null>('tengu_satin_quoll', {})
  // override读取 `overrides?.['mcp_tool']` 对应条目，后续围绕该成员继续处理。
  const override = overrides?.['mcp_tool']
  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof override === 'number' &&
    Number.isFinite(override) &&
    override > 0
  ) {
    // 返回 `override`，作为共享工具这次计算的结果。
    return override
  }
  // 返回 `DEFAULT_MAX_MCP_OUTPUT_TOKENS`，作为共享工具这次计算的结果。
  return DEFAULT_MAX_MCP_OUTPUT_TOKENS
}

// MCPToolResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MCPToolResult = string | ContentBlockParam[] | undefined

// isTextBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTextBlock(block: ContentBlockParam): block is TextBlockParam {
  // 返回 `block.type === 'text'`，作为共享工具这次计算的结果。
  return block.type === 'text'
}

// isImageBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isImageBlock(block: ContentBlockParam): block is ImageBlockParam {
  // 返回 `block.type === 'image'`，作为共享工具这次计算的结果。
  return block.type === 'image'
}

// getContentSizeEstimate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getContentSizeEstimate(content: MCPToolResult): number {
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return 0

  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') {
    // 返回 `roughTokenCountEstimation(content)`，作为共享工具这次计算的结果。
    return roughTokenCountEstimation(content)
  }

  // 返回 `content.reduce((total, block) => {`，作为共享工具这次计算的结果。
  return content.reduce((total, block) => {
    // 满足 `isTextBlock(block)` 时，共享工具执行该分支。
    if (isTextBlock(block)) {
      // 返回 `total + roughTokenCountEstimation(block.text)`，作为共享工具这次计算的结果。
      return total + roughTokenCountEstimation(block.text)
    // 共享工具 mcp Validation在这里处理 `} else if (isImageBlock(block)) {`，完成这一小步状态转换。
    } else if (isImageBlock(block)) {
      // Estimate for image tokens
      // 返回 `total + IMAGE_TOKEN_ESTIMATE`，作为共享工具这次计算的结果。
      return total + IMAGE_TOKEN_ESTIMATE
    }
    // 返回 `total`，作为共享工具这次计算的结果。
    return total
  }, 0)
}

// getMaxMcpOutputChars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMaxMcpOutputChars(): number {
  // 返回 `getMaxMcpOutputTokens() * 4`，作为共享工具这次计算的结果。
  return getMaxMcpOutputTokens() * 4
}

// getTruncationMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTruncationMessage(): string {
  // 返回 ``\n\n[OUTPUT TRUNCATED - exceeded ${getMaxMcpOutputTokens()} token limi...`，作为共享工具这次计算的结果。
  return `\n\n[OUTPUT TRUNCATED - exceeded ${getMaxMcpOutputTokens()} token limit]

The tool output was truncated. If this MCP server provides pagination or filtering tools, use them to retrieve specific portions of the data. If pagination is not available, inform the user that you are working with truncated output and results may be incomplete.`
}

// truncateString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateString(content: string, maxChars: number): string {
  // 满足 `content.length <= maxChars` 时，共享工具执行该分支。
  if (content.length <= maxChars) {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  }
  // 返回 `content.slice(0, maxChars)`，作为共享工具这次计算的结果。
  return content.slice(0, maxChars)
}

// truncateContentBlocks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function truncateContentBlocks(
  blocks: ContentBlockParam[],
  maxChars: number,
): Promise<ContentBlockParam[]> {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: ContentBlockParam[] = []
  // currentChars 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let currentChars = 0

  // 按顺序遍历 `blocks` 中的block，逐个交给共享工具处理。
  for (const block of blocks) {
    // 满足 `isTextBlock(block)` 时，共享工具执行该分支。
    if (isTextBlock(block)) {
      // remainingChars 集合 命名 `maxChars - currentChars`，让后续代码直接表达这个值的用途。
      const remainingChars = maxChars - currentChars
      // 满足 `remainingChars <= 0` 时，共享工具执行该分支。
      if (remainingChars <= 0) break

      // 满足 `block.text.length <= remainingChars` 时，共享工具执行该分支。
      if (block.text.length <= remainingChars) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(block)
        // 共享工具 mcp Validation在这里处理 `currentChars += block.text.length`，完成这一小步状态转换。
        currentChars += block.text.length
      } else {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ type: 'text', text: block.text.slice(0, remainingChars) })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    // 共享工具 mcp Validation在这里处理 `} else if (isImageBlock(block)) {`，完成这一小步状态转换。
    } else if (isImageBlock(block)) {
      // Include images but count their estimated size
      // imageChars 集合保存`IMAGE_TOKEN_ESTIMATE * 4`，供后续判断或组装使用。
      const imageChars = IMAGE_TOKEN_ESTIMATE * 4
      // 满足 `currentChars + imageChars <= maxChars` 时，共享工具执行该分支。
      if (currentChars + imageChars <= maxChars) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(block)
        // 共享工具 mcp Validation在这里处理 `currentChars += imageChars`，完成这一小步状态转换。
        currentChars += imageChars
      } else {
        // Image exceeds budget - try to compress it to fit remaining space
        // remainingChars 集合 命名 `maxChars - currentChars`，让后续代码直接表达这个值的用途。
        const remainingChars = maxChars - currentChars
        // 满足 `remainingChars > 0` 时，共享工具执行该分支。
        if (remainingChars > 0) {
          // Convert remaining chars to bytes for compression
          // base64 uses ~4/3 the original size, so we calculate max bytes
          // remainingBytes 集合保存`Math.floor`，供共享工具后续处理使用。
          const remainingBytes = Math.floor(remainingChars * 0.75)
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // compressedBlock保存`compressImageBlock`，供共享工具后续处理使用。
            const compressedBlock = await compressImageBlock(
              block,
              remainingBytes,
            )
            // 结果追加新条目，保持收集顺序与输入顺序一致。
            result.push(compressedBlock)
            // Update currentChars based on compressed image size
            // 当 `compressedBlock.source.type` 匹配 `'base64'` 时，共享工具执行对应分支。
            if (compressedBlock.source.type === 'base64') {
              // 共享工具 mcp Validation在这里处理 `currentChars += compressedBlock.source.data.length`，完成这一小步状态转换。
              currentChars += compressedBlock.source.data.length
            } else {
              // 共享工具 mcp Validation在这里处理 `currentChars += imageChars`，完成这一小步状态转换。
              currentChars += imageChars
            }
          } catch {
            // If compression fails, skip the image
          }
        }
      }
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(block)
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// mcpContentNeedsTruncation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function mcpContentNeedsTruncation(
  content: MCPToolResult,
): Promise<boolean> {
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return false

  // Use size check as a heuristic to avoid unnecessary token counting API calls
  // contentSizeEstimate读取`getContentSizeEstimate`，供共享工具后续处理使用。
  const contentSizeEstimate = getContentSizeEstimate(content)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    contentSizeEstimate <=
    getMaxMcpOutputTokens() * MCP_TOKEN_COUNT_THRESHOLD_FACTOR
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // messages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const messages =
      typeof content === 'string'
        ? [{ role: 'user' as const, content }]
        : [{ role: 'user' as const, content }]

    // tokenCount 数量统计`countMessagesTokensWithAPI`，供共享工具后续处理使用。
    const tokenCount = await countMessagesTokensWithAPI(messages, [])
    // 返回 `!!(tokenCount && tokenCount > getMaxMcpOutputTokens())`，作为共享工具这次计算的结果。
    return !!(tokenCount && tokenCount > getMaxMcpOutputTokens())
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // Assume no truncation needed on error
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// truncateMcpContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function truncateMcpContent(
  content: MCPToolResult,
): Promise<MCPToolResult> {
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return content

  // maxChars 集合读取`getMaxMcpOutputChars`，供共享工具后续处理使用。
  const maxChars = getMaxMcpOutputChars()
  // truncationMsg读取`getTruncationMessage`，供共享工具后续处理使用。
  const truncationMsg = getTruncationMessage()

  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') {
    // 返回 `truncateString(content, maxChars) + truncationMsg`，作为共享工具这次计算的结果。
    return truncateString(content, maxChars) + truncationMsg
  } else {
    // truncatedBlocks 集合保存`truncateContentBlocks`，供共享工具后续处理使用。
    const truncatedBlocks = await truncateContentBlocks(
      content as ContentBlockParam[],
      maxChars,
    )
    // truncatedBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
    truncatedBlocks.push({ type: 'text', text: truncationMsg })
    // 返回 `truncatedBlocks`，作为共享工具这次计算的结果。
    return truncatedBlocks
  }
}

// truncateMcpContentIfNeeded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function truncateMcpContentIfNeeded(
  content: MCPToolResult,
): Promise<MCPToolResult> {
  // 满足 `!(await mcpContentNeedsTruncation(content))` 时，共享工具执行该分支。
  if (!(await mcpContentNeedsTruncation(content))) {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  }

  // 等待并返回 `truncateMcpContent(content)`，调用方直接接收异步结果。
  return await truncateMcpContent(content)
}
