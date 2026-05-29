// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  Base64ImageSource,
  ImageBlockParam,
} from '@anthropic-ai/sdk/resources/messages.mjs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  API_IMAGE_MAX_BASE64_SIZE,
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_WIDTH,
  IMAGE_TARGET_RAW_SIZE,
} from '../constants/apiLimits.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getImageProcessor,
  type SharpFunction,
  type SharpInstance,
} from '../tools/FileReadTool/imageProcessor.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from './errors.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// ImageMediaType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

// Error type constants for analytics (numeric to comply with logEvent restrictions)
// ERROR_TYPE_MODULE_LOAD 错误信息保存`1`，供后续判断或组装使用。
const ERROR_TYPE_MODULE_LOAD = 1
// ERROR_TYPE_PROCESSING 错误信息保存`2`，供共享工具 image Resizer后续判断或输出使用。
const ERROR_TYPE_PROCESSING = 2
// ERROR_TYPE_UNKNOWN 错误信息保存`3`，供共享工具 image Resizer后续判断或输出使用。
const ERROR_TYPE_UNKNOWN = 3
// ERROR_TYPE_PIXEL_LIMIT 错误信息 命名 `4`，让后续代码直接表达这个值的用途。
const ERROR_TYPE_PIXEL_LIMIT = 4
// ERROR_TYPE_MEMORY 错误信息保存`5`，供后续判断或组装使用。
const ERROR_TYPE_MEMORY = 5
// ERROR_TYPE_TIMEOUT 错误信息保存`6`，供共享工具 image Resizer后续判断或输出使用。
const ERROR_TYPE_TIMEOUT = 6
// ERROR_TYPE_VIPS 错误信息保存`7`，供后续判断或组装使用。
const ERROR_TYPE_VIPS = 7
// ERROR_TYPE_PERMISSION 权限数据保存`8`，供共享工具 image Resizer后续判断或输出使用。
const ERROR_TYPE_PERMISSION = 8

/**
 * Error thrown when image resizing fails and the image exceeds the API limit.
 */
// ImageResizeError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ImageResizeError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'ImageResizeError'，同步共享工具的内部状态。
    this.name = 'ImageResizeError'
  }
}

/**
 * Classifies image processing errors for analytics.
 *
 * Uses error codes when available (Node.js module errors), falls back to
 * message matching for libraries like sharp that don't expose error codes.
 */
// classifyImageError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function classifyImageError(error: unknown): number {
  // Check for Node.js error codes first (more reliable than string matching)
  // 满足 `error instanceof Error` 时，共享工具执行该分支。
  if (error instanceof Error) {
    // errorWithCode 错误信息保存`error as Error & { code?: string }`，供共享工具 image Resizer后续判断或输出使用。
    const errorWithCode = error as Error & { code?: string }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      errorWithCode.code === 'MODULE_NOT_FOUND' ||
      errorWithCode.code === 'ERR_MODULE_NOT_FOUND' ||
      errorWithCode.code === 'ERR_DLOPEN_FAILED'
    ) {
      // 返回 `ERROR_TYPE_MODULE_LOAD`，作为共享工具这次计算的结果。
      return ERROR_TYPE_MODULE_LOAD
    }
    // 只有 `errorWithCode.code === 'EACCES' || errorWithCode.` 满足时，共享工具才执行该分支。
    if (errorWithCode.code === 'EACCES' || errorWithCode.code === 'EPERM') {
      // 返回 `ERROR_TYPE_PERMISSION`，作为共享工具这次计算的结果。
      return ERROR_TYPE_PERMISSION
    }
    // 当 `errorWithCode.code` 匹配 `'ENOMEM'` 时，共享工具执行对应分支。
    if (errorWithCode.code === 'ENOMEM') {
      // 返回 `ERROR_TYPE_MEMORY`，作为共享工具这次计算的结果。
      return ERROR_TYPE_MEMORY
    }
  }

  // Fall back to message matching for errors without codes
  // Note: sharp doesn't expose error codes, so we must match on messages
  // 消息保存`errorMessage`，供共享工具后续处理使用。
  const message = errorMessage(error)

  // Module loading errors from our native wrapper
  // 满足 `message.includes('Native image processor module not available')` 时，共享工具执行该分支。
  if (message.includes('Native image processor module not available')) {
    // 返回 `ERROR_TYPE_MODULE_LOAD`，作为共享工具这次计算的结果。
    return ERROR_TYPE_MODULE_LOAD
  }

  // Sharp/vips processing errors (format detection, corrupt data, etc.)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    message.includes('unsupported image format') ||
    message.includes('Input buffer') ||
    message.includes('Input file is missing') ||
    message.includes('Input file has corrupt header') ||
    message.includes('corrupt header') ||
    message.includes('corrupt image') ||
    message.includes('premature end') ||
    message.includes('zlib: data error') ||
    message.includes('zero width') ||
    message.includes('zero height')
  ) {
    // 返回 `ERROR_TYPE_PROCESSING`，作为共享工具这次计算的结果。
    return ERROR_TYPE_PROCESSING
  }

  // Pixel/dimension limit errors from sharp/vips
  // 共享工具在这里按实际状态进入对应分支。
  if (
    message.includes('pixel limit') ||
    message.includes('too many pixels') ||
    message.includes('exceeds pixel') ||
    message.includes('image dimensions')
  ) {
    // 返回 `ERROR_TYPE_PIXEL_LIMIT`，作为共享工具这次计算的结果。
    return ERROR_TYPE_PIXEL_LIMIT
  }

  // Memory allocation failures
  // 共享工具在这里按实际状态进入对应分支。
  if (
    message.includes('out of memory') ||
    message.includes('Cannot allocate') ||
    message.includes('memory allocation')
  ) {
    // 返回 `ERROR_TYPE_MEMORY`，作为共享工具这次计算的结果。
    return ERROR_TYPE_MEMORY
  }

  // Timeout errors
  // 只有 `message.includes('timeout') || message.includes('timed out')` 满足时，共享工具才执行该分支。
  if (message.includes('timeout') || message.includes('timed out')) {
    // 返回 `ERROR_TYPE_TIMEOUT`，作为共享工具这次计算的结果。
    return ERROR_TYPE_TIMEOUT
  }

  // Vips-specific errors (VipsJpeg, VipsPng, VipsWebp, etc.)
  // 满足 `message.includes('Vips')` 时，共享工具执行该分支。
  if (message.includes('Vips')) {
    // 返回 `ERROR_TYPE_VIPS`，作为共享工具这次计算的结果。
    return ERROR_TYPE_VIPS
  }

  // 返回 `ERROR_TYPE_UNKNOWN`，作为共享工具这次计算的结果。
  return ERROR_TYPE_UNKNOWN
}

/**
 * Computes a simple numeric hash of a string for analytics grouping.
 * Uses djb2 algorithm, returning a 32-bit unsigned integer.
 */
// hashString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashString(str: string): number {
  // hash保存`5381`，供共享工具 image Resizer后续判断或输出使用。
  let hash = 5381
  // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length; i++) {
    // hash更新为 `((hash << 5) + hash + str.charCodeAt(i)) | 0`，确保共享工具后续读取最新状态。
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  // 返回 `hash >>> 0`，作为共享工具这次计算的结果。
  return hash >>> 0
}

// ImageDimensions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ImageDimensions = {
  originalWidth?: number
  originalHeight?: number
  displayWidth?: number
  displayHeight?: number
}

// ResizeResult 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ResizeResult {
  buffer: Buffer
  mediaType: string
  dimensions?: ImageDimensions
}

// ImageCompressionContext 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ImageCompressionContext {
  imageBuffer: Buffer
  metadata: { width?: number; height?: number; format?: string }
  format: string
  maxBytes: number
  originalSize: number
}

// CompressedImageResult 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface CompressedImageResult {
  base64: string
  mediaType: Base64ImageSource['media_type']
  originalSize: number
}

/**
 * Extracted from FileReadTool's readImage function
 * Resizes image buffer to meet size and dimension constraints
 */
// maybeResizeAndDownsampleImageBuffer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeResizeAndDownsampleImageBuffer(
  imageBuffer: Buffer,
  originalSize: number,
  ext: string,
): Promise<ResizeResult> {
  // imageBuffer为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (imageBuffer.length === 0) {
    // Empty buffer would fall through the catch block below (sharp throws
    // "Unable to determine image format"), and the fallback's size check
    // `0 ≤ 5MB` would pass it through, yielding an empty base64 string
    // that the API rejects with `image cannot be empty`.
    // 抛出 new ImageResizeError('Image file is empty (0 bytes)')，阻止共享工具在无效状态下继续运行。
    throw new ImageResizeError('Image file is empty (0 bytes)')
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // sharp读取`getImageProcessor`，供共享工具后续处理使用。
    const sharp = await getImageProcessor()
    // image保存`sharp`，供共享工具后续处理使用。
    const image = sharp(imageBuffer)
    // metadata保存`image.metadata`，供共享工具后续处理使用。
    const metadata = await image.metadata()

    // mediaType格式化`metadata.format ?? ext`，供后续判断或组装使用。
    const mediaType = metadata.format ?? ext
    // Normalize "jpg" to "jpeg" for media type compatibility
    // normalizedMediaType标记共享工具 image Resizer是否启用对应路径。
    const normalizedMediaType = mediaType === 'jpg' ? 'jpeg' : mediaType

    // If dimensions aren't available from metadata
    // 只有 `!metadata.width || !metadata.height` 满足时，共享工具才执行该分支。
    if (!metadata.width || !metadata.height) {
      // 满足 `originalSize > IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
      if (originalSize > IMAGE_TARGET_RAW_SIZE) {
        // Create fresh sharp instance for compression
        // compressedBuffer保存`sharp`，供共享工具后续处理使用。
        const compressedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 80 })
          .toBuffer()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { buffer: compressedBuffer, mediaType: 'jpeg' }
      }
      // Return without dimensions if we can't determine them
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { buffer: imageBuffer, mediaType: normalizedMediaType }
    }

    // Store original dimensions (guaranteed to be defined here)
    // originalWidth保存`metadata.width`，供共享工具 image Resizer后续判断或输出使用。
    const originalWidth = metadata.width
    // originalHeight保存`metadata.height`，供共享工具 image Resizer后续判断或输出使用。
    const originalHeight = metadata.height

    // Calculate dimensions while maintaining aspect ratio
    // width保存`originalWidth`，供共享工具 image Resizer后续判断或输出使用。
    let width = originalWidth
    // height保存`originalHeight`，供后续判断或组装使用。
    let height = originalHeight

    // Check if the original file just works
    // 共享工具在这里按实际状态进入对应分支。
    if (
      originalSize <= IMAGE_TARGET_RAW_SIZE &&
      width <= IMAGE_MAX_WIDTH &&
      height <= IMAGE_MAX_HEIGHT
    ) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        buffer: imageBuffer,
        mediaType: normalizedMediaType,
        dimensions: {
          originalWidth,
          originalHeight,
          displayWidth: width,
          displayHeight: height,
        },
      }
    }

    // needsDimensionResize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const needsDimensionResize =
      width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT
    // isPng标记共享工具 image Resizer是否启用对应路径。
    const isPng = normalizedMediaType === 'png'

    // If dimensions are within limits but file is too large, try compression first
    // This preserves full resolution when possible
    // 只有 `!needsDimensionResize && originalSize > IMAGE_TAR` 满足时，共享工具才执行该分支。
    if (!needsDimensionResize && originalSize > IMAGE_TARGET_RAW_SIZE) {
      // For PNGs, try PNG compression first to preserve transparency
      // 满足 `isPng` 时，共享工具执行该分支。
      if (isPng) {
        // Create fresh sharp instance for each compression attempt
        // pngCompressed保存`sharp`，供共享工具后续处理使用。
        const pngCompressed = await sharp(imageBuffer)
          .png({ compressionLevel: 9, palette: true })
          .toBuffer()
        // 满足 `pngCompressed.length <= IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
        if (pngCompressed.length <= IMAGE_TARGET_RAW_SIZE) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            buffer: pngCompressed,
            mediaType: 'png',
            dimensions: {
              originalWidth,
              originalHeight,
              displayWidth: width,
              displayHeight: height,
            },
          }
        }
      }
      // Try JPEG compression (lossy but much smaller)
      // 按顺序遍历 `[80, 60, 40, 20]` 中的quality，逐个交给共享工具处理。
      for (const quality of [80, 60, 40, 20]) {
        // Create fresh sharp instance for each attempt
        // compressedBuffer保存`sharp`，供共享工具后续处理使用。
        const compressedBuffer = await sharp(imageBuffer)
          .jpeg({ quality })
          .toBuffer()
        // 满足 `compressedBuffer.length <= IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
        if (compressedBuffer.length <= IMAGE_TARGET_RAW_SIZE) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            buffer: compressedBuffer,
            mediaType: 'jpeg',
            dimensions: {
              originalWidth,
              originalHeight,
              displayWidth: width,
              displayHeight: height,
            },
          }
        }
      }
      // Quality reduction alone wasn't enough, fall through to resize
    }

    // Constrain dimensions if needed
    // 满足 `width > IMAGE_MAX_WIDTH` 时，共享工具执行该分支。
    if (width > IMAGE_MAX_WIDTH) {
      // height更新为 `Math.round((height * IMAGE_MAX_WIDTH) / width)`，确保共享工具后续读取最新状态。
      height = Math.round((height * IMAGE_MAX_WIDTH) / width)
      // width更新为 `IMAGE_MAX_WIDTH`，确保共享工具后续读取最新状态。
      width = IMAGE_MAX_WIDTH
    }

    // 满足 `height > IMAGE_MAX_HEIGHT` 时，共享工具执行该分支。
    if (height > IMAGE_MAX_HEIGHT) {
      // width更新为 `Math.round((width * IMAGE_MAX_HEIGHT) / height)`，确保共享工具后续读取最新状态。
      width = Math.round((width * IMAGE_MAX_HEIGHT) / height)
      // height更新为 `IMAGE_MAX_HEIGHT`，确保共享工具后续读取最新状态。
      height = IMAGE_MAX_HEIGHT
    }

    // IMPORTANT: Always create fresh sharp(imageBuffer) instances for each operation.
    // The native image-processor-napi module doesn't properly apply format conversions
    // when reusing a sharp instance after calling toBuffer(). This caused a bug where
    // all compression attempts (PNG, JPEG at various qualities) returned identical sizes.
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Resizing to ${width}x${height}`)
    // resizedImageBuffer保存`sharp`，供共享工具后续处理使用。
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer()

    // If still too large after resize, try compression
    // 满足 `resizedImageBuffer.length > IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
    if (resizedImageBuffer.length > IMAGE_TARGET_RAW_SIZE) {
      // For PNGs, try PNG compression first to preserve transparency
      // 满足 `isPng` 时，共享工具执行该分支。
      if (isPng) {
        // pngCompressed保存`sharp`，供共享工具后续处理使用。
        const pngCompressed = await sharp(imageBuffer)
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png({ compressionLevel: 9, palette: true })
          .toBuffer()
        // 满足 `pngCompressed.length <= IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
        if (pngCompressed.length <= IMAGE_TARGET_RAW_SIZE) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            buffer: pngCompressed,
            mediaType: 'png',
            dimensions: {
              originalWidth,
              originalHeight,
              displayWidth: width,
              displayHeight: height,
            },
          }
        }
      }

      // Try JPEG with progressively lower quality
      // 按顺序遍历 `[80, 60, 40, 20]` 中的quality，逐个交给共享工具处理。
      for (const quality of [80, 60, 40, 20]) {
        // compressedBuffer保存`sharp`，供共享工具后续处理使用。
        const compressedBuffer = await sharp(imageBuffer)
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality })
          .toBuffer()
        // 满足 `compressedBuffer.length <= IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
        if (compressedBuffer.length <= IMAGE_TARGET_RAW_SIZE) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            buffer: compressedBuffer,
            mediaType: 'jpeg',
            dimensions: {
              originalWidth,
              originalHeight,
              displayWidth: width,
              displayHeight: height,
            },
          }
        }
      }
      // If still too large, resize smaller and compress aggressively
      // smallerWidth保存`Math.min`，供共享工具后续处理使用。
      const smallerWidth = Math.min(width, 1000)
      // smallerHeight保存`Math.round`，供共享工具后续处理使用。
      const smallerHeight = Math.round(
        (height * smallerWidth) / Math.max(width, 1),
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Still too large, compressing with JPEG')
      // compressedBuffer保存`sharp`，供共享工具后续处理使用。
      const compressedBuffer = await sharp(imageBuffer)
        .resize(smallerWidth, smallerHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 20 })
        .toBuffer()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`JPEG compressed buffer size: ${compressedBuffer.length}`)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        buffer: compressedBuffer,
        mediaType: 'jpeg',
        dimensions: {
          originalWidth,
          originalHeight,
          displayWidth: smallerWidth,
          displayHeight: smallerHeight,
        },
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      buffer: resizedImageBuffer,
      mediaType: normalizedMediaType,
      dimensions: {
        originalWidth,
        originalHeight,
        displayWidth: width,
        displayHeight: height,
      },
    }
  } catch (error) {
    // Log the error and emit analytics event
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // errorType 错误信息保存`classifyImageError`，供共享工具后续处理使用。
    const errorType = classifyImageError(error)
    // errorMsg 错误信息保存`errorMessage`，供共享工具后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_image_resize_failed', {
      original_size_bytes: originalSize,
      error_type: errorType,
      error_message_hash: hashString(errorMsg),
    })

    // Detect actual format from magic bytes instead of trusting extension
    // detected读取`detectImageFormatFromBuffer`，供共享工具后续处理使用。
    const detected = detectImageFormatFromBuffer(imageBuffer)
    // normalizedExt格式化`detected.slice`，供共享工具后续处理使用。
    const normalizedExt = detected.slice(6) // Remove 'image/' prefix

    // Calculate the base64 size (API limit is on base64-encoded length)
    // base64Size保存`Math.ceil`，供共享工具后续处理使用。
    const base64Size = Math.ceil((originalSize * 4) / 3)

    // Size-under-5MB does not imply dimensions-under-cap. Don't return the
    // raw buffer if the PNG header says it's oversized — fall through to
    // ImageResizeError instead. PNG sig is 8 bytes, IHDR dims at 16-24.
    // overDim 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const overDim =
      imageBuffer.length >= 24 &&
      imageBuffer[0] === 0x89 &&
      imageBuffer[1] === 0x50 &&
      imageBuffer[2] === 0x4e &&
      imageBuffer[3] === 0x47 &&
      (imageBuffer.readUInt32BE(16) > IMAGE_MAX_WIDTH ||
        imageBuffer.readUInt32BE(20) > IMAGE_MAX_HEIGHT)

    // If original image's base64 encoding is within API limit, allow it through uncompressed
    // 只有 `base64Size <= API_IMAGE_MAX_BASE64_SIZE && !overD` 满足时，共享工具才执行该分支。
    if (base64Size <= API_IMAGE_MAX_BASE64_SIZE && !overDim) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_image_resize_fallback', {
        original_size_bytes: originalSize,
        base64_size_bytes: base64Size,
        error_type: errorType,
      })
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { buffer: imageBuffer, mediaType: normalizedExt }
    }

    // Image is too large and we failed to compress it - fail with user-friendly error
    // 抛出 new ImageResizeError(，阻止共享工具在无效状态下继续运行。
    throw new ImageResizeError(
      overDim
        ? `Unable to resize image — dimensions exceed the ${IMAGE_MAX_WIDTH}x${IMAGE_MAX_HEIGHT}px limit and image processing failed. ` +
            `Please resize the image to reduce its pixel dimensions.`
        : `Unable to resize image (${formatFileSize(originalSize)} raw, ${formatFileSize(base64Size)} base64). ` +
            `The image exceeds the 5MB API limit and compression failed. ` +
            `Please resize the image manually or use a smaller image.`,
    )
  }
}

// ImageBlockWithDimensions 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ImageBlockWithDimensions {
  block: ImageBlockParam
  dimensions?: ImageDimensions
}

/**
 * Resizes an image content block if needed
 * Takes an image ImageBlockParam and returns a resized version if necessary
 * Also returns dimension information for coordinate mapping
 */
// maybeResizeAndDownsampleImageBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeResizeAndDownsampleImageBlock(
  imageBlock: ImageBlockParam,
): Promise<ImageBlockWithDimensions> {
  // Only process base64 images
  // `imageBlock.source.type` 与 `'base64'` 不一致时刷新派生状态，避免使用过期结果。
  if (imageBlock.source.type !== 'base64') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { block: imageBlock }
  }

  // Decode base64 to buffer
  // imageBuffer保存`Buffer.from`，供共享工具后续处理使用。
  const imageBuffer = Buffer.from(imageBlock.source.data, 'base64')
  // originalSize记录 `imageBuffer.length` 是否成立，下一步按该结果分支。
  const originalSize = imageBuffer.length

  // Extract extension from media type
  // mediaType保存`imageBlock.source.media_type`，供共享工具 image Resizer后续判断或输出使用。
  const mediaType = imageBlock.source.media_type
  // ext格式化`split`，供共享工具后续处理使用。
  const ext = mediaType?.split('/')[1] || 'png'

  // Resize if needed
  // resized统计`maybeResizeAndDownsampleImageBuffer`，供共享工具后续处理使用。
  const resized = await maybeResizeAndDownsampleImageBuffer(
    imageBuffer,
    originalSize,
    ext,
  )

  // Return resized image block with dimension info
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    block: {
      type: 'image',
      source: {
        type: 'base64',
        media_type:
          `image/${resized.mediaType}` as Base64ImageSource['media_type'],
        data: resized.buffer.toString('base64'),
      },
    },
    dimensions: resized.dimensions,
  }
}

/**
 * Compresses an image buffer to fit within a maximum byte size.
 *
 * Uses a multi-strategy fallback approach because simple compression often fails for
 * large screenshots, high-resolution photos, or images with complex gradients. Each
 * strategy is progressively more aggressive to handle edge cases where earlier
 * strategies produce files still exceeding the size limit.
 *
 * Strategy (from FileReadTool):
 * 1. Try to preserve original format (PNG, JPEG, WebP) with progressive resizing
 * 2. For PNG: Use palette optimization and color reduction if needed
 * 3. Last resort: Convert to JPEG with aggressive compression
 *
 * This ensures images fit within context windows while maintaining format when possible.
 */
// compressImageBuffer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function compressImageBuffer(
  imageBuffer: Buffer,
  maxBytes: number = IMAGE_TARGET_RAW_SIZE,
  originalMediaType?: string,
): Promise<CompressedImageResult> {
  // Extract format from originalMediaType if provided (e.g., "image/png" -> "png")
  // fallbackFormat格式化`split`，供共享工具后续处理使用。
  const fallbackFormat = originalMediaType?.split('/')[1] || 'jpeg'
  // normalizedFallback标记共享工具 image Resizer是否启用对应路径。
  const normalizedFallback = fallbackFormat === 'jpg' ? 'jpeg' : fallbackFormat

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // sharp读取`getImageProcessor`，供共享工具后续处理使用。
    const sharp = await getImageProcessor()
    // metadata保存`sharp`，供共享工具后续处理使用。
    const metadata = await sharp(imageBuffer).metadata()
    // format标记共享工具 image Resizer是否启用对应路径。
    const format = metadata.format || normalizedFallback
    // originalSize记录 `imageBuffer.length` 是否成立，下一步按该结果分支。
    const originalSize = imageBuffer.length

    // context 集中保存共享工具 image Resizer要一起传递的字段。
    const context: ImageCompressionContext = {
      imageBuffer,
      metadata,
      format,
      maxBytes,
      originalSize,
    }

    // If image is already within size limit, return as-is without processing
    // 满足 `originalSize <= maxBytes` 时，共享工具执行该分支。
    if (originalSize <= maxBytes) {
      // 返回 `createCompressedImageResult(imageBuffer, format, originalSize)`，作为共享工具这次计算的结果。
      return createCompressedImageResult(imageBuffer, format, originalSize)
    }

    // Try progressive resizing with format preservation
    // resizedResult保存`tryProgressiveResizing`，供共享工具后续处理使用。
    const resizedResult = await tryProgressiveResizing(context, sharp)
    // 满足 `resizedResult` 时，共享工具执行该分支。
    if (resizedResult) {
      // 返回 `resizedResult`，作为共享工具这次计算的结果。
      return resizedResult
    }

    // For PNG, try palette optimization
    // 当 `format` 匹配 `'png'` 时，共享工具执行对应分支。
    if (format === 'png') {
      // palettizedResult保存`tryPalettePNG`，供共享工具后续处理使用。
      const palettizedResult = await tryPalettePNG(context, sharp)
      // 满足 `palettizedResult` 时，共享工具执行该分支。
      if (palettizedResult) {
        // 返回 `palettizedResult`，作为共享工具这次计算的结果。
        return palettizedResult
      }
    }

    // Try JPEG conversion with moderate compression
    // jpegResult保存`tryJPEGConversion`，供共享工具后续处理使用。
    const jpegResult = await tryJPEGConversion(context, 50, sharp)
    // 满足 `jpegResult` 时，共享工具执行该分支。
    if (jpegResult) {
      // 返回 `jpegResult`，作为共享工具这次计算的结果。
      return jpegResult
    }

    // Last resort: ultra-compressed JPEG
    // 等待并返回 `createUltraCompressedJPEG(context, sharp)`，调用方直接接收异步结果。
    return await createUltraCompressedJPEG(context, sharp)
  } catch (error) {
    // Log the error and emit analytics event
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // errorType 错误信息保存`classifyImageError`，供共享工具后续处理使用。
    const errorType = classifyImageError(error)
    // errorMsg 错误信息保存`errorMessage`，供共享工具后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_image_compress_failed', {
      original_size_bytes: imageBuffer.length,
      max_bytes: maxBytes,
      error_type: errorType,
      error_message_hash: hashString(errorMsg),
    })

    // If original image is within the requested limit, allow it through
    // 满足 `imageBuffer.length <= maxBytes` 时，共享工具执行该分支。
    if (imageBuffer.length <= maxBytes) {
      // Detect actual format from magic bytes instead of trusting the provided media type
      // detected读取`detectImageFormatFromBuffer`，供共享工具后续处理使用。
      const detected = detectImageFormatFromBuffer(imageBuffer)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        base64: imageBuffer.toString('base64'),
        mediaType: detected,
        originalSize: imageBuffer.length,
      }
    }

    // Image is too large and compression failed - throw error
    // 抛出 new ImageResizeError(，阻止共享工具在无效状态下继续运行。
    throw new ImageResizeError(
      `Unable to compress image (${formatFileSize(imageBuffer.length)}) to fit within ${formatFileSize(maxBytes)}. ` +
        `Please use a smaller image.`,
    )
  }
}

/**
 * Compresses an image buffer to fit within a token limit.
 * Converts tokens to bytes using the formula: maxBytes = (maxTokens / 0.125) * 0.75
 */
// compressImageBufferWithTokenLimit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function compressImageBufferWithTokenLimit(
  imageBuffer: Buffer,
  maxTokens: number,
  originalMediaType?: string,
): Promise<CompressedImageResult> {
  // Convert token limit to byte limit
  // base64 uses about 4/3 the original size, so we reverse this
  // maxBase64Chars 集合保存`Math.floor`，供共享工具后续处理使用。
  const maxBase64Chars = Math.floor(maxTokens / 0.125)
  // maxBytes 集合保存`Math.floor`，供共享工具后续处理使用。
  const maxBytes = Math.floor(maxBase64Chars * 0.75)

  // 返回 `compressImageBuffer(imageBuffer, maxBytes, originalMediaType)`，作为共享工具这次计算的结果。
  return compressImageBuffer(imageBuffer, maxBytes, originalMediaType)
}

/**
 * Compresses an image block to fit within a maximum byte size.
 * Wrapper around compressImageBuffer for ImageBlockParam.
 */
// compressImageBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function compressImageBlock(
  imageBlock: ImageBlockParam,
  maxBytes: number = IMAGE_TARGET_RAW_SIZE,
): Promise<ImageBlockParam> {
  // Only process base64 images
  // `imageBlock.source.type` 与 `'base64'` 不一致时刷新派生状态，避免使用过期结果。
  if (imageBlock.source.type !== 'base64') {
    // 返回 `imageBlock`，作为共享工具这次计算的结果。
    return imageBlock
  }

  // Decode base64 to buffer
  // imageBuffer保存`Buffer.from`，供共享工具后续处理使用。
  const imageBuffer = Buffer.from(imageBlock.source.data, 'base64')

  // Check if already within size limit
  // 满足 `imageBuffer.length <= maxBytes` 时，共享工具执行该分支。
  if (imageBuffer.length <= maxBytes) {
    // 返回 `imageBlock`，作为共享工具这次计算的结果。
    return imageBlock
  }

  // Compress the image
  // compressed保存`compressImageBuffer`，供共享工具后续处理使用。
  const compressed = await compressImageBuffer(imageBuffer, maxBytes)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: compressed.mediaType,
      data: compressed.base64,
    },
  }
}

// Helper functions for compression pipeline

// createCompressedImageResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createCompressedImageResult(
  buffer: Buffer,
  mediaType: string,
  originalSize: number,
): CompressedImageResult {
  // normalizedMediaType标记共享工具 image Resizer是否启用对应路径。
  const normalizedMediaType = mediaType === 'jpg' ? 'jpeg' : mediaType
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    base64: buffer.toString('base64'),
    mediaType:
      `image/${normalizedMediaType}` as Base64ImageSource['media_type'],
    originalSize,
  }
}

// tryProgressiveResizing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryProgressiveResizing(
  context: ImageCompressionContext,
  sharp: SharpFunction,
): Promise<CompressedImageResult | null> {
  // scalingFactors 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const scalingFactors = [1.0, 0.75, 0.5, 0.25]

  // 按顺序遍历 `scalingFactors` 中的scalingFactor，逐个交给共享工具处理。
  for (const scalingFactor of scalingFactors) {
    // newWidth保存`Math.round`，供共享工具后续处理使用。
    const newWidth = Math.round(
      (context.metadata.width || 2000) * scalingFactor,
    )
    // newHeight保存`Math.round`，供共享工具后续处理使用。
    const newHeight = Math.round(
      (context.metadata.height || 2000) * scalingFactor,
    )

    // resizedImage保存`sharp`，供共享工具后续处理使用。
    let resizedImage = sharp(context.imageBuffer).resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    // Apply format-specific optimizations
    // resizedImage更新为 `applyFormatOptimizations(resizedImage, context.format)`，确保共享工具后续读取最新状态。
    resizedImage = applyFormatOptimizations(resizedImage, context.format)

    // resizedBuffer统计`resizedImage.toBuffer`，供共享工具后续处理使用。
    const resizedBuffer = await resizedImage.toBuffer()

    // 满足 `resizedBuffer.length <= context.maxBytes` 时，共享工具执行该分支。
    if (resizedBuffer.length <= context.maxBytes) {
      // 返回 `createCompressedImageResult(`，作为共享工具这次计算的结果。
      return createCompressedImageResult(
        resizedBuffer,
        context.format,
        context.originalSize,
      )
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// applyFormatOptimizations 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyFormatOptimizations(
  image: SharpInstance,
  format: string,
): SharpInstance {
  // 按照 format 的取值选择共享工具的具体处理分支。
  switch (format) {
    case 'png':
      // 返回 `image.png({`，作为共享工具这次计算的结果。
      return image.png({
        compressionLevel: 9,
        palette: true,
      })
    case 'jpeg':
    case 'jpg':
      // 返回 `image.jpeg({ quality: 80 })`，作为共享工具这次计算的结果。
      return image.jpeg({ quality: 80 })
    case 'webp':
      // 返回 `image.webp({ quality: 80 })`，作为共享工具这次计算的结果。
      return image.webp({ quality: 80 })
    default:
      // 返回 `image`，作为共享工具这次计算的结果。
      return image
  }
}

// tryPalettePNG 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryPalettePNG(
  context: ImageCompressionContext,
  sharp: SharpFunction,
): Promise<CompressedImageResult | null> {
  // palettePng保存`sharp`，供共享工具后续处理使用。
  const palettePng = await sharp(context.imageBuffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      palette: true,
      colors: 64, // Reduce colors to 64 for better compression
    })
    .toBuffer()

  // 满足 `palettePng.length <= context.maxBytes` 时，共享工具执行该分支。
  if (palettePng.length <= context.maxBytes) {
    // 返回 `createCompressedImageResult(palettePng, 'png', context.originalSize)`，作为共享工具这次计算的结果。
    return createCompressedImageResult(palettePng, 'png', context.originalSize)
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// tryJPEGConversion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryJPEGConversion(
  context: ImageCompressionContext,
  quality: number,
  sharp: SharpFunction,
): Promise<CompressedImageResult | null> {
  // jpegBuffer保存`sharp`，供共享工具后续处理使用。
  const jpegBuffer = await sharp(context.imageBuffer)
    .resize(600, 600, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer()

  // 满足 `jpegBuffer.length <= context.maxBytes` 时，共享工具执行该分支。
  if (jpegBuffer.length <= context.maxBytes) {
    // 返回 `createCompressedImageResult(jpegBuffer, 'jpeg', context.originalSize)`，作为共享工具这次计算的结果。
    return createCompressedImageResult(jpegBuffer, 'jpeg', context.originalSize)
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// createUltraCompressedJPEG 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createUltraCompressedJPEG(
  context: ImageCompressionContext,
  sharp: SharpFunction,
): Promise<CompressedImageResult> {
  // ultraCompressedBuffer保存`sharp`，供共享工具后续处理使用。
  const ultraCompressedBuffer = await sharp(context.imageBuffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 20 })
    .toBuffer()

  // 返回 `createCompressedImageResult(`，作为共享工具这次计算的结果。
  return createCompressedImageResult(
    ultraCompressedBuffer,
    'jpeg',
    context.originalSize,
  )
}

/**
 * Detect image format from a buffer using magic bytes
 * @param buffer Buffer containing image data
 * @returns Media type string (e.g., 'image/png', 'image/jpeg') or 'image/png' as default
 */
// detectImageFormatFromBuffer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectImageFormatFromBuffer(buffer: Buffer): ImageMediaType {
  // 满足 `buffer.length < 4` 时，共享工具执行该分支。
  if (buffer.length < 4) return 'image/png' // default

  // Check PNG signature
  // 共享工具在这里按实际状态进入对应分支。
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    // 返回 `'image/png'`，作为共享工具这次计算的结果。
    return 'image/png'
  }

  // Check JPEG signature (FFD8FF)
  // 只有 `buffer[0] === 0xff && buffer[1] === 0xd8 && buffe` 满足时，共享工具才执行该分支。
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    // 返回 `'image/jpeg'`，作为共享工具这次计算的结果。
    return 'image/jpeg'
  }

  // Check GIF signature (GIF87a or GIF89a)
  // 只有 `buffer[0] === 0x47 && buffer[1] === 0x49 && buffe` 满足时，共享工具才执行该分支。
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    // 返回 `'image/gif'`，作为共享工具这次计算的结果。
    return 'image/gif'
  }

  // Check WebP signature (RIFF....WEBP)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      // 返回 `'image/webp'`，作为共享工具这次计算的结果。
      return 'image/webp'
    }
  }

  // Default to PNG if unknown
  // 返回 `'image/png'`，作为共享工具这次计算的结果。
  return 'image/png'
}

/**
 * Detect image format from base64 data using magic bytes
 * @param base64Data Base64 encoded image data
 * @returns Media type string (e.g., 'image/png', 'image/jpeg') or 'image/png' as default
 */
// detectImageFormatFromBase64 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectImageFormatFromBase64(
  base64Data: string,
): ImageMediaType {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // buffer保存`Buffer.from`，供共享工具后续处理使用。
    const buffer = Buffer.from(base64Data, 'base64')
    // 返回 `detectImageFormatFromBuffer(buffer)`，作为共享工具这次计算的结果。
    return detectImageFormatFromBuffer(buffer)
  } catch {
    // Default to PNG on any error
    // 返回 `'image/png'`，作为共享工具这次计算的结果。
    return 'image/png'
  }
}

/**
 * Creates a text description of image metadata including dimensions and source path.
 * Returns null if no useful metadata is available.
 */
// createImageMetadataText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createImageMetadataText(
  dims: ImageDimensions,
  sourcePath?: string,
): string | null {
  // 从 `dims` 解构 originalWidth、originalHeight、displayWidth、displayHeight，减少共享工具 image Resizer对同一对象的重复访问。
  const { originalWidth, originalHeight, displayWidth, displayHeight } = dims
  // Skip if dimensions are not available or invalid
  // Note: checks for undefined/null and zero to prevent division by zero
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !originalWidth ||
    !originalHeight ||
    !displayWidth ||
    !displayHeight ||
    displayWidth <= 0 ||
    displayHeight <= 0
  ) {
    // If we have a source path but no valid dimensions, still return source info
    // 满足 `sourcePath` 时，共享工具执行该分支。
    if (sourcePath) {
      // 返回 ``[Image source: ${sourcePath}]``，作为共享工具这次计算的结果。
      return `[Image source: ${sourcePath}]`
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // Check if image was resized
  // wasResized 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wasResized =
    originalWidth !== displayWidth || originalHeight !== displayHeight

  // Only include metadata if there's useful info (resized or has source path)
  // 只有 `!wasResized && !sourcePath` 满足时，共享工具才执行该分支。
  if (!wasResized && !sourcePath) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Build metadata parts
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // 满足 `sourcePath` 时，共享工具执行该分支。
  if (sourcePath) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`source: ${sourcePath}`)
  }

  // 满足 `wasResized` 时，共享工具执行该分支。
  if (wasResized) {
    // scaleFactor保存`originalWidth / displayWidth`，供共享工具 image Resizer后续判断或输出使用。
    const scaleFactor = originalWidth / displayWidth
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `original ${originalWidth}x${originalHeight}, displayed at ${displayWidth}x${displayHeight}. Multiply coordinates by ${scaleFactor.toFixed(2)} to map to original image.`,
    )
  }

  // 返回 ``[Image: ${parts.join(', ')}]``，作为共享工具这次计算的结果。
  return `[Image: ${parts.join(', ')}]`
}
