// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, extname, isAbsolute, join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_WIDTH,
  IMAGE_TARGET_RAW_SIZE,
} from '../constants/apiLimits.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 getImageProcessor 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getImageProcessor } from '../tools/FileReadTool/imageProcessor.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  detectImageFormatFromBase64,
  type ImageDimensions,
  maybeResizeAndDownsampleImageBuffer,
} from './imageResizer.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// Native NSPasteboard reader. GrowthBook gate tengu_collage_kaleidoscope is
// a kill switch (default on). Falls through to osascript when off.
// The gate string is inlined at each callsite INSIDE the feature() condition
// — module-scope helpers are NOT tree-shaken (see docs/feature-gating.md).

// SupportedPlatform 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SupportedPlatform = 'darwin' | 'linux' | 'win32'

// Threshold in characters for when to consider text a "large paste"
// PASTE_THRESHOLD保存`800`，供共享工具 image Paste后续判断或输出使用。
export const PASTE_THRESHOLD = 800
// getClipboardCommands 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getClipboardCommands() {
  // platform 命名 `process.platform as SupportedPlatform`，让后续代码直接表达这个值的用途。
  const platform = process.platform as SupportedPlatform

  // Platform-specific temporary file paths
  // Use CLAUDE_CODE_TMPDIR if set, otherwise fall back to platform defaults
  // baseTmpDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseTmpDir =
    process.env.CLAUDE_CODE_TMPDIR ||
    (platform === 'win32' ? process.env.TEMP || 'C:\\Temp' : '/tmp')
  // screenshotFilename 文件数据固定为 `'claude_cli_latest_screenshot.png'`，作为共享工具 image Paste后续展示或比较的基准。
  const screenshotFilename = 'claude_cli_latest_screenshot.png'
  // tempPaths 路径数据 集中保存共享工具 image Paste要一起传递的字段。
  const tempPaths: Record<SupportedPlatform, string> = {
    darwin: join(baseTmpDir, screenshotFilename),
    linux: join(baseTmpDir, screenshotFilename),
    win32: join(baseTmpDir, screenshotFilename),
  }

  // screenshotPath 路径数据标记共享工具 image Paste是否启用对应路径。
  const screenshotPath = tempPaths[platform] || tempPaths.linux

  // Platform-specific clipboard commands
  // commands 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  const commands: Record<
    SupportedPlatform,
    {
      checkImage: string
      saveImage: string
      getPath: string
      deleteFile: string
    }
  > = {
    darwin: {
      checkImage: `osascript -e 'the clipboard as «class PNGf»'`,
      saveImage: `osascript -e 'set png_data to (the clipboard as «class PNGf»)' -e 'set fp to open for access POSIX file "${screenshotPath}" with write permission' -e 'write png_data to fp' -e 'close access fp'`,
      getPath: `osascript -e 'get POSIX path of (the clipboard as «class furl»)'`,
      deleteFile: `rm -f "${screenshotPath}"`,
    },
    linux: {
      checkImage:
        'xclip -selection clipboard -t TARGETS -o 2>/dev/null | grep -E "image/(png|jpeg|jpg|gif|webp|bmp)" || wl-paste -l 2>/dev/null | grep -E "image/(png|jpeg|jpg|gif|webp|bmp)"',
      saveImage: `xclip -selection clipboard -t image/png -o > "${screenshotPath}" 2>/dev/null || wl-paste --type image/png > "${screenshotPath}" 2>/dev/null || xclip -selection clipboard -t image/bmp -o > "${screenshotPath}" 2>/dev/null || wl-paste --type image/bmp > "${screenshotPath}"`,
      getPath:
        'xclip -selection clipboard -t text/plain -o 2>/dev/null || wl-paste 2>/dev/null',
      deleteFile: `rm -f "${screenshotPath}"`,
    },
    win32: {
      checkImage:
        'powershell -NoProfile -Command "(Get-Clipboard -Format Image) -ne $null"',
      saveImage: `powershell -NoProfile -Command "$img = Get-Clipboard -Format Image; if ($img) { $img.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png) }"`,
      getPath: 'powershell -NoProfile -Command "Get-Clipboard"',
      deleteFile: `del /f "${screenshotPath}"`,
    },
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    commands: commands[platform] || commands.linux,
    screenshotPath,
  }
}

// ImageWithDimensions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ImageWithDimensions = {
  base64: string
  mediaType: string
  dimensions?: ImageDimensions
}

/**
 * Check if clipboard contains an image without retrieving it.
 */
// hasImageInClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function hasImageInClipboard(): Promise<boolean> {
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('NATIVE_CLIPBOARD_IMAGE') &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_collage_kaleidoscope', true)
  ) {
    // Native NSPasteboard check (~0.03ms warm). Fall through to osascript
    // when the module/export is missing. Catch a throw too: it would surface
    // as an unhandled rejection in useClipboardImageHint's setTimeout.
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await import('image-processor-napi')` 解构 getNativeModule，减少共享工具 image Paste对同一对象的重复访问。
      const { getNativeModule } = await import('image-processor-napi')
      // hasImage记录 `getNativeModule` 是否成立，共享工具随后按该结果分支。
      const hasImage = getNativeModule()?.hasClipboardImage
      // 满足 `hasImage` 时，共享工具执行该分支。
      if (hasImage) {
        // 返回 `hasImage()`，作为共享工具这次计算的结果。
        return hasImage()
      }
    } catch (e) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e as Error)
    }
  }
  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd('osascript', [
    '-e',
    'the clipboard as «class PNGf»',
  ])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

// getImageFromClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getImageFromClipboard(): Promise<ImageWithDimensions | null> {
  // Fast path: native NSPasteboard reader (macOS only). Reads PNG bytes
  // directly in-process and downsamples via CoreGraphics if over the
  // dimension cap. ~5ms cold, sub-ms warm — vs. ~1.5s for the osascript
  // path below. Throws if the native module is unavailable, in which case
  // the catch block falls through to osascript. A `null` return from the
  // native call is authoritative (clipboard has no image).
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('NATIVE_CLIPBOARD_IMAGE') &&
    process.platform === 'darwin' &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_collage_kaleidoscope', true)
  ) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await import('image-processor-napi')` 解构 getNativeModule，减少共享工具 image Paste对同一对象的重复访问。
      const { getNativeModule } = await import('image-processor-napi')
      // readClipboard读取`getNativeModule`，供共享工具后续处理使用。
      const readClipboard = getNativeModule()?.readClipboardImage
      // readClipboard缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!readClipboard) {
        // 抛出 new Error('native clipboard reader unavailable')，阻止共享工具在无效状态下继续运行。
        throw new Error('native clipboard reader unavailable')
      }
      // native读取`readClipboard`，供共享工具后续处理使用。
      const native = readClipboard(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT)
      // native缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!native) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
      // The native path caps dimensions but not file size. A complex
      // 2000×2000 PNG can still exceed the 3.75MB raw / 5MB base64 API
      // limit — for that edge case, run through the same size-cap that
      // the osascript path uses (degrades to JPEG if needed). Cheap if
      // already under: just a sharp metadata read.
      // buffer保存`native.png`，供后续判断或组装使用。
      const buffer: Buffer = native.png
      // 满足 `buffer.length > IMAGE_TARGET_RAW_SIZE` 时，共享工具执行该分支。
      if (buffer.length > IMAGE_TARGET_RAW_SIZE) {
        // resized统计`maybeResizeAndDownsampleImageBuffer`，供共享工具后续处理使用。
        const resized = await maybeResizeAndDownsampleImageBuffer(
          buffer,
          buffer.length,
          'png',
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          base64: resized.buffer.toString('base64'),
          mediaType: `image/${resized.mediaType}`,
          // resized.dimensions sees the already-downsampled buffer; native knows the true originals.
          dimensions: {
            originalWidth: native.originalWidth,
            originalHeight: native.originalHeight,
            displayWidth: resized.dimensions?.displayWidth ?? native.width,
            displayHeight: resized.dimensions?.displayHeight ?? native.height,
          },
        }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        base64: buffer.toString('base64'),
        mediaType: 'image/png',
        dimensions: {
          originalWidth: native.originalWidth,
          originalHeight: native.originalHeight,
          displayWidth: native.width,
          displayHeight: native.height,
        },
      }
    } catch (e) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e as Error)
      // Fall through to osascript fallback.
    }
  }

  // 从 `getClipboardCommands()` 解构 commands、screenshotPath，减少共享工具 image Paste对同一对象的重复访问。
  const { commands, screenshotPath } = getClipboardCommands()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check if clipboard has image
    // checkResult保存`execa`，供共享工具后续处理使用。
    const checkResult = await execa(commands.checkImage, {
      shell: true,
      reject: false,
    })
    // `checkResult.exitCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (checkResult.exitCode !== 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Save the image
    // saveResult保存`execa`，供共享工具后续处理使用。
    const saveResult = await execa(commands.saveImage, {
      shell: true,
      reject: false,
    })
    // `saveResult.exitCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (saveResult.exitCode !== 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Read the image and convert to base64
    // imageBuffer读取`getFsImplementation`，供共享工具后续处理使用。
    let imageBuffer = getFsImplementation().readFileBytesSync(screenshotPath)

    // BMP is not supported by the API — convert to PNG via Sharp.
    // This handles WSL2 where Windows copies images as BMP by default.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      imageBuffer.length >= 2 &&
      imageBuffer[0] === 0x42 &&
      imageBuffer[1] === 0x4d
    ) {
      // sharp读取`getImageProcessor`，供共享工具后续处理使用。
      const sharp = await getImageProcessor()
      // imageBuffer更新为 `await sharp(imageBuffer).png().toBuffer()`，确保共享工具后续读取最新状态。
      imageBuffer = await sharp(imageBuffer).png().toBuffer()
    }

    // Resize if needed to stay under 5MB API limit
    // resized统计`maybeResizeAndDownsampleImageBuffer`，供共享工具后续处理使用。
    const resized = await maybeResizeAndDownsampleImageBuffer(
      imageBuffer,
      imageBuffer.length,
      'png',
    )
    // base64Image格式化`buffer.toString`，供共享工具后续处理使用。
    const base64Image = resized.buffer.toString('base64')

    // Detect format from magic bytes
    // mediaType读取`detectImageFormatFromBase64`，供共享工具后续处理使用。
    const mediaType = detectImageFormatFromBase64(base64Image)

    // Cleanup (fire-and-forget, don't await)
    // 显式忽略 `execa(commands.deleteFile, { shell: true, reject: false })` 的返回值，只保留它触发的副作用。
    void execa(commands.deleteFile, { shell: true, reject: false })

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      base64: base64Image,
      mediaType,
      dimensions: resized.dimensions,
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// getImagePathFromClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getImagePathFromClipboard(): Promise<string | null> {
  // 从 `getClipboardCommands()` 解构 commands，减少共享工具 image Paste对同一对象的重复访问。
  const { commands } = getClipboardCommands()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Try to get text from clipboard
    // 结果保存`execa`，供共享工具后续处理使用。
    const result = await execa(commands.getPath, {
      shell: true,
      reject: false,
    })
    // `result.exitCode` 与 `0 || !result.stdout` 不一致时刷新派生状态，避免使用过期结果。
    if (result.exitCode !== 0 || !result.stdout) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `result.stdout.trim()`，作为共享工具这次计算的结果。
    return result.stdout.trim()
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Regex pattern to match supported image file extensions. Kept in sync with
 * MIME_BY_EXT in BriefTool/upload.ts — attachments.ts uses this to set isImage
 * on the wire, and remote viewers fetch /preview iff isImage is true. An ext
 * here but not in MIME_BY_EXT (e.g. bmp) uploads as octet-stream and has no
 * /preview variant → broken thumbnail.
 */
// IMAGE_EXTENSION_REGEX保存`/\.(png|jpe?g|gif|webp)$/i`，供共享工具 image Paste后续判断或输出使用。
export const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp)$/i

/**
 * Remove outer single or double quotes from a string
 * @param text Text to clean
 * @returns Text without outer quotes
 */
// removeOuterQuotes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeOuterQuotes(text: string): string {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    // 返回 `text.slice(1, -1)`，作为共享工具这次计算的结果。
    return text.slice(1, -1)
  }
  // 返回 `text`，作为共享工具这次计算的结果。
  return text
}

/**
 * Remove shell escape backslashes from a path (for macOS/Linux/WSL)
 * On Windows systems, this function returns the path unchanged
 * @param path Path that might contain shell-escaped characters
 * @returns Path with escape backslashes removed (on macOS/Linux/WSL only)
 */
// stripBackslashEscapes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripBackslashEscapes(path: string): string {
  // platform 命名 `process.platform as SupportedPlatform`，让后续代码直接表达这个值的用途。
  const platform = process.platform as SupportedPlatform

  // On Windows, don't remove backslashes as they're part of the path
  // 当 `platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (platform === 'win32') {
    // 返回 `path`，作为共享工具这次计算的结果。
    return path
  }

  // On macOS/Linux/WSL, handle shell-escaped paths
  // Double-backslashes (\\) represent actual backslashes in the filename
  // Single backslashes followed by special chars are shell escapes

  // First, temporarily replace double backslashes with a placeholder
  // Use random salt to prevent injection attacks where path contains literal placeholder
  // salt保存`randomBytes`，供共享工具后续处理使用。
  const salt = randomBytes(8).toString('hex')
  // placeholder保存``__DOUBLE_BACKSLASH_${salt}__``，作为后续固定文本处理的输入。
  const placeholder = `__DOUBLE_BACKSLASH_${salt}__`
  // withPlaceholder格式化`path.replace`，供共享工具后续处理使用。
  const withPlaceholder = path.replace(/\\\\/g, placeholder)

  // Remove single backslashes that are shell escapes
  // This handles cases like "name\ \(15\).png" -> "name (15).png"
  // withoutEscapes 集合格式化`withPlaceholder.replace`，供共享工具后续处理使用。
  const withoutEscapes = withPlaceholder.replace(/\\(.)/g, '$1')

  // Replace placeholders back to single backslashes
  // 返回 `withoutEscapes.replace(new RegExp(placeholder, 'g'), '\\')`，作为共享工具这次计算的结果。
  return withoutEscapes.replace(new RegExp(placeholder, 'g'), '\\')
}

/**
 * Check if a given text represents an image file path
 * @param text Text to check
 * @returns Boolean indicating if text is an image path
 */
// isImageFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isImageFilePath(text: string): boolean {
  // cleaned保存`removeOuterQuotes`，供共享工具后续处理使用。
  const cleaned = removeOuterQuotes(text.trim())
  // unescaped保存`stripBackslashEscapes`，供共享工具后续处理使用。
  const unescaped = stripBackslashEscapes(cleaned)
  // 返回 `IMAGE_EXTENSION_REGEX.test(unescaped)`，作为共享工具这次计算的结果。
  return IMAGE_EXTENSION_REGEX.test(unescaped)
}

/**
 * Clean and normalize a text string that might be an image file path
 * @param text Text to process
 * @returns Cleaned text with quotes removed, whitespace trimmed, and shell escapes removed, or null if not an image path
 */
// asImageFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function asImageFilePath(text: string): string | null {
  // cleaned保存`removeOuterQuotes`，供共享工具后续处理使用。
  const cleaned = removeOuterQuotes(text.trim())
  // unescaped保存`stripBackslashEscapes`，供共享工具后续处理使用。
  const unescaped = stripBackslashEscapes(cleaned)

  // 满足 `IMAGE_EXTENSION_REGEX.test(unescaped)` 时，共享工具执行该分支。
  if (IMAGE_EXTENSION_REGEX.test(unescaped)) {
    // 返回 `unescaped`，作为共享工具这次计算的结果。
    return unescaped
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Try to find and read an image file, falling back to clipboard search
 * @param text Pasted text that might be an image filename or path
 * @returns Object containing the image path and base64 data, or null if not found
 */
// tryReadImageFromPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryReadImageFromPath(
  text: string,
): Promise<(ImageWithDimensions & { path: string }) | null> {
  // Strip terminal added spaces or quotes to dragged in paths
  // cleanedPath 路径数据保存`asImageFilePath`，供共享工具后续处理使用。
  const cleanedPath = asImageFilePath(text)

  // cleanedPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cleanedPath) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // imagePath 路径数据保存`cleanedPath`，供后续判断或组装使用。
  const imagePath = cleanedPath
  // imageBuffer 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let imageBuffer

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `isAbsolute(imagePath)` 时，共享工具执行该分支。
    if (isAbsolute(imagePath)) {
      // imageBuffer更新为 `getFsImplementation().readFileBytesSync(imagePath)`，确保共享工具后续读取最新状态。
      imageBuffer = getFsImplementation().readFileBytesSync(imagePath)
    } else {
      // VSCode Terminal just grabs the text content which is the filename
      // instead of getting the full path of the file pasted with cmd-v. So
      // we check if it matches the filename of the image in the clipboard.
      // clipboardPath 路径数据读取`getImagePathFromClipboard`，供共享工具后续处理使用。
      const clipboardPath = await getImagePathFromClipboard()
      // 只有 `clipboardPath && imagePath === basename(clipboardPath)` 满足时，共享工具才执行该分支。
      if (clipboardPath && imagePath === basename(clipboardPath)) {
        // imageBuffer更新为 `getFsImplementation().readFileBytesSync(clipboardPath)`，确保共享工具后续读取最新状态。
        imageBuffer = getFsImplementation().readFileBytesSync(clipboardPath)
      }
    }
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // imageBuffer缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!imageBuffer) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // imageBuffer为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (imageBuffer.length === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Image file is empty: ${imagePath}`, { level: 'warn' })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // BMP is not supported by the API — convert to PNG via Sharp.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    imageBuffer.length >= 2 &&
    imageBuffer[0] === 0x42 &&
    imageBuffer[1] === 0x4d
  ) {
    // sharp读取`getImageProcessor`，供共享工具后续处理使用。
    const sharp = await getImageProcessor()
    // imageBuffer更新为 `await sharp(imageBuffer).png().toBuffer()`，确保共享工具后续读取最新状态。
    imageBuffer = await sharp(imageBuffer).png().toBuffer()
  }

  // Resize if needed to stay under 5MB API limit
  // Extract extension from path for format hint
  // ext保存`extname`，供共享工具后续处理使用。
  const ext = extname(imagePath).slice(1).toLowerCase() || 'png'
  // resized统计`maybeResizeAndDownsampleImageBuffer`，供共享工具后续处理使用。
  const resized = await maybeResizeAndDownsampleImageBuffer(
    imageBuffer,
    imageBuffer.length,
    ext,
  )
  // base64Image格式化`buffer.toString`，供共享工具后续处理使用。
  const base64Image = resized.buffer.toString('base64')

  // Detect format from the actual file contents using magic bytes
  // mediaType读取`detectImageFormatFromBase64`，供共享工具后续处理使用。
  const mediaType = detectImageFormatFromBase64(base64Image)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    path: imagePath,
    base64: base64Image,
    mediaType,
    dimensions: resized.dimensions,
  }
}
