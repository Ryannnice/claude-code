// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  Base64ImageSource,
  ContentBlockParam,
  ImageBlockParam,
} from '@anthropic-ai/sdk/resources/messages.mjs'
// 类型依赖 { UUID } 来自 crypto，用于校准远程桥接会话的数据契约。
import type { UUID } from 'crypto'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 复用 detectImageFormatFromBase64 工具函数，把通用处理留在 ../utils/imageResizer.js 中维护。
import { detectImageFormatFromBase64 } from '../utils/imageResizer.js'

/**
 * Process an inbound user message from the bridge, extracting content
 * and UUID for enqueueing. Supports both string content and
 * ContentBlockParam[] (e.g. messages containing images).
 *
 * Normalizes image blocks from bridge clients that may use camelCase
 * `mediaType` instead of snake_case `media_type` (mobile-apps#5825).
 *
 * Returns the extracted fields, or undefined if the message should be
 * skipped (non-user type, missing/empty content).
 */
// extractInboundMessageFields 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractInboundMessageFields(
  msg: SDKMessage,
):
  | { content: string | Array<ContentBlockParam>; uuid: UUID | undefined }
  | undefined {
  // `msg.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (msg.type !== 'user') return undefined
  // 文本内容 命名 `msg.message?.content`，让后续代码直接表达这个值的用途。
  const content = msg.message?.content
  // 文本内容缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!content) return undefined
  // Array.isArray(content) && conte...为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
  if (Array.isArray(content) && content.length === 0) return undefined

  // uuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const uuid =
    'uuid' in msg && typeof msg.uuid === 'string'
      ? (msg.uuid as UUID)
      : undefined

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    content: Array.isArray(content) ? normalizeImageBlocks(content) : content,
    uuid,
  }
}

/**
 * Normalize image content blocks from bridge clients. iOS/web clients may
 * send `mediaType` (camelCase) instead of `media_type` (snake_case), or
 * omit the field entirely. Without normalization, the bad block poisons
 * the session — every subsequent API call fails with
 * "media_type: Field required".
 *
 * Fast-path scan returns the original array reference when no
 * normalization is needed (zero allocation on the happy path).
 */
// normalizeImageBlocks 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeImageBlocks(
  blocks: Array<ContentBlockParam>,
): Array<ContentBlockParam> {
  // 满足 `!blocks.some(isMalformedBase64Image)` 时，远程桥接会话执行该分支。
  if (!blocks.some(isMalformedBase64Image)) return blocks

  // 返回 `blocks.map(block => {`，作为远程桥接会话这次计算的结果。
  return blocks.map(block => {
    // 满足 `!isMalformedBase64Image(block)` 时，远程桥接会话执行该分支。
    if (!isMalformedBase64Image(block)) return block
    // src保存`block.source as unknown as Record<string, unknown>`，供后续判断或组装使用。
    const src = block.source as unknown as Record<string, unknown>
    // mediaType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const mediaType =
      typeof src.mediaType === 'string' && src.mediaType
        ? src.mediaType
        : detectImageFormatFromBase64(block.source.data)
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return {
      ...block,
      source: {
        type: 'base64' as const,
        media_type: mediaType as Base64ImageSource['media_type'],
        data: block.source.data,
      },
    }
  })
}

// isMalformedBase64Image 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMalformedBase64Image(
  block: ContentBlockParam,
): block is ImageBlockParam & { source: Base64ImageSource } {
  // `block.type` 与 `'image' || block.source?.type !...` 不一致时刷新派生状态，避免使用过期结果。
  if (block.type !== 'image' || block.source?.type !== 'base64') return false
  // 返回 `!(block.source as unknown as Record<string, unknown>).media_type`，作为远程桥接会话这次计算的结果。
  return !(block.source as unknown as Record<string, unknown>).media_type
}
