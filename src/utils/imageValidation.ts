// 引入 API_IMAGE_MAX_BASE64_SIZE，将 ../constants/apiLimits.js 中已经封装好的能力接到本文件流程里。
import { API_IMAGE_MAX_BASE64_SIZE } from '../constants/apiLimits.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'

/**
 * Information about an oversized image.
 */
// OversizedImage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OversizedImage = {
  index: number
  size: number
}

/**
 * Error thrown when one or more images exceed the API size limit.
 */
// ImageSizeError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ImageSizeError extends Error {
  // 构造函数接收 oversizedImages: OversizedImage[], maxSize: number，把外部输入整理成实例可复用的内部状态。
  constructor(oversizedImages: OversizedImage[], maxSize: number) {
    // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
    let message: string
    // firstImage统计`oversizedImages[0]` 整理出中间结果，供共享工具 image Validation后续步骤使用。
    const firstImage = oversizedImages[0]
    // 只有 `oversizedImages.length === 1 && firstImage` 满足时，共享工具才执行该分支。
    if (oversizedImages.length === 1 && firstImage) {
      // 共享工具 image Validation在这里处理 `message =`，完成这一小步状态转换。
      message =
        `Image base64 size (${formatFileSize(firstImage.size)}) exceeds API limit (${formatFileSize(maxSize)}). ` +
        `Please resize the image before sending.`
    } else {
      // 共享工具 image Validation在这里处理 `message =`，完成这一小步状态转换。
      message =
        `${oversizedImages.length} images exceed the API limit (${formatFileSize(maxSize)}): ` +
        oversizedImages
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(img => `Image ${img.index}: ${formatFileSize(img.size)}`)
          .join(', ') +
        `. Please resize these images before sending.`
    }
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'ImageSizeError'，同步共享工具的内部状态。
    this.name = 'ImageSizeError'
  }
}

/**
 * Type guard to check if a block is a base64 image block
 */
// isBase64ImageBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBase64ImageBlock(
  block: unknown,
): block is { type: 'image'; source: { type: 'base64'; data: string } } {
  // `typeof block` 与 `'object' || block === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof block !== 'object' || block === null) return false
  // b 命名 `block as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const b = block as Record<string, unknown>
  // `b.type` 与 `'image'` 不一致时刷新派生状态，避免使用过期结果。
  if (b.type !== 'image') return false
  // `typeof b.source` 与 `'object' || b.source === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof b.source !== 'object' || b.source === null) return false
  // source保存`b.source as Record<string, unknown>`，供共享工具 image Validation后续判断或输出使用。
  const source = b.source as Record<string, unknown>
  // 返回 `source.type === 'base64' && typeof source.data === 'string'`，作为共享工具这次计算的结果。
  return source.type === 'base64' && typeof source.data === 'string'
}

/**
 * Validates that all images in messages are within the API size limit.
 * This is a safety net at the API boundary to catch any oversized images
 * that may have slipped through upstream processing.
 *
 * Note: The API's 5MB limit applies to the base64-encoded string length,
 * not the decoded raw bytes.
 *
 * Works with both UserMessage/AssistantMessage types (which have { type, message })
 * and raw MessageParam types (which have { role, content }).
 *
 * @param messages - Array of messages to validate
 * @throws ImageSizeError if any image exceeds the API limit
 */
// validateImagesForAPI 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateImagesForAPI(messages: unknown[]): void {
  // oversizedImages 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const oversizedImages: OversizedImage[] = []
  // imageIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
  let imageIndex = 0

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // `typeof msg` 与 `'object' || msg === null` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof msg !== 'object' || msg === null) continue

    // m保存`msg as Record<string, unknown>`，供后续判断或组装使用。
    const m = msg as Record<string, unknown>

    // Handle wrapped message format { type: 'user', message: { role, content } }
    // Only check user messages
    // `m.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (m.type !== 'user') continue

    // innerMessage 消息数据保存`m.message as Record<string, unknown> | undefined`，供后续判断或组装使用。
    const innerMessage = m.message as Record<string, unknown> | undefined
    // innerMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!innerMessage) continue

    // 文本内容保存`innerMessage.content`，供共享工具 image Validation后续判断或输出使用。
    const content = innerMessage.content
    // 只有 `typeof content === 'string' || !Array.isArray(content)` 满足时，共享工具才执行该分支。
    if (typeof content === 'string' || !Array.isArray(content)) continue

    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // 满足 `isBase64ImageBlock(block)` 时，共享工具执行该分支。
      if (isBase64ImageBlock(block)) {
        // 共享工具 image Validation在这里处理 `imageIndex++`，完成这一小步状态转换。
        imageIndex++
        // Check the base64-encoded string length directly (not decoded bytes)
        // The API limit applies to the base64 payload size
        // base64Size保存 `block.source.data.length` 的判断结果，供共享工具 image Validation后续分支直接复用。
        const base64Size = block.source.data.length
        // 满足 `base64Size > API_IMAGE_MAX_BASE64_SIZE` 时，共享工具执行该分支。
        if (base64Size > API_IMAGE_MAX_BASE64_SIZE) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_image_api_validation_failed', {
            base64_size_bytes: base64Size,
            max_bytes: API_IMAGE_MAX_BASE64_SIZE,
          })
          // oversizedImages 集合追加新条目，保持收集顺序与输入顺序一致。
          oversizedImages.push({ index: imageIndex, size: base64Size })
        }
      }
    }
  }

  // 满足 `oversizedImages.length > 0` 时，共享工具执行该分支。
  if (oversizedImages.length > 0) {
    // 抛出 new ImageSizeError(oversizedImages, API_IMAGE_MAX_BASE64_SIZE)，阻止共享工具在无效状态下继续运行。
    throw new ImageSizeError(oversizedImages, API_IMAGE_MAX_BASE64_SIZE)
  }
}
