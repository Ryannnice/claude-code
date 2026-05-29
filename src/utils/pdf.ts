// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  PDF_MAX_EXTRACT_SIZE,
  PDF_TARGET_RAW_SIZE,
} from '../constants/apiLimits.js'
// 引入 errorMessage，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from './errors.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 getToolResultsDir，将 ./toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { getToolResultsDir } from './toolResultStorage.js'

// PDFError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PDFError = {
  reason:
    | 'empty'
    | 'too_large'
    | 'password_protected'
    | 'corrupted'
    | 'unknown'
    | 'unavailable'
  message: string
}

// PDFResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PDFResult<T> =
  | { success: true; data: T }
  | { success: false; error: PDFError }

/**
 * Read a PDF file and return it as base64-encoded data.
 * @param filePath Path to the PDF file
 * @returns Result containing PDF data or a structured error
 */
// readPDF 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readPDF(filePath: string): Promise<
  PDFResult<{
    type: 'pdf'
    file: {
      filePath: string
      base64: string
      originalSize: number
    }
  }>
> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // stats 集合保存`fs.stat`，供共享工具后续处理使用。
    const stats = await fs.stat(filePath)
    // originalSize统计`stats.size`，供后续判断或组装使用。
    const originalSize = stats.size

    // Check if file is empty
    // 满足 `originalSize === 0` 时，共享工具执行该分支。
    if (originalSize === 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: { reason: 'empty', message: `PDF file is empty: ${filePath}` },
      }
    }

    // Check if PDF exceeds maximum size
    // The API has a 32MB total request limit. After base64 encoding (~33% larger),
    // a PDF must be under ~20MB raw to leave room for conversation context.
    // 满足 `originalSize > PDF_TARGET_RAW_SIZE` 时，共享工具执行该分支。
    if (originalSize > PDF_TARGET_RAW_SIZE) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: {
          reason: 'too_large',
          message: `PDF file exceeds maximum allowed size of ${formatFileSize(PDF_TARGET_RAW_SIZE)}.`,
        },
      }
    }

    // fileBuffer 文件数据读取`readFile`，供共享工具后续处理使用。
    const fileBuffer = await readFile(filePath)

    // Validate PDF magic bytes — reject files that aren't actually PDFs
    // (e.g., HTML files renamed to .pdf) before they enter conversation context.
    // Once an invalid PDF document block is in the message history, every subsequent
    // API call fails with 400 "The PDF specified was not valid" and the session
    // becomes unrecoverable without /clear.
    // header保存`fileBuffer.subarray`，供共享工具后续处理使用。
    const header = fileBuffer.subarray(0, 5).toString('ascii')
    // 满足 `!header.startsWith('%PDF-')` 时，共享工具执行该分支。
    if (!header.startsWith('%PDF-')) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: {
          reason: 'corrupted',
          message: `File is not a valid PDF (missing %PDF- header): ${filePath}`,
        },
      }
    }

    // base64格式化`fileBuffer.toString`，供共享工具后续处理使用。
    const base64 = fileBuffer.toString('base64')

    // Note: We cannot check page count here without parsing the PDF
    // The API will enforce the 100-page limit and return an error if exceeded

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: true,
      data: {
        type: 'pdf',
        file: {
          filePath,
          base64,
          originalSize,
        },
      },
    }
  } catch (e: unknown) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: {
        reason: 'unknown',
        message: errorMessage(e),
      },
    }
  }
}

/**
 * Get the number of pages in a PDF file using `pdfinfo` (from poppler-utils).
 * Returns `null` if pdfinfo is not available or if the page count cannot be determined.
 */
// getPDFPageCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPDFPageCount(
  filePath: string,
): Promise<number | null> {
  // 从 `await execFileNoThrow('pdfinfo', [filePath], {` 解构 code、stdout，减少共享工具 pdf对同一对象的重复访问。
  const { code, stdout } = await execFileNoThrow('pdfinfo', [filePath], {
    timeout: 10_000,
    useCwd: false,
  })
  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // match保存`m.exec`，供共享工具后续处理使用。
  const match = /^Pages:\s+(\d+)/m.exec(stdout)
  // match缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!match) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 计数解析`parseInt`，供共享工具后续处理使用。
  const count = parseInt(match[1]!, 10)
  // 返回 `isNaN(count) ? null : count`，作为共享工具这次计算的结果。
  return isNaN(count) ? null : count
}

// PDFExtractPagesResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PDFExtractPagesResult = {
  type: 'parts'
  file: {
    filePath: string
    originalSize: number
    count: number
    outputDir: string
  }
}

// pdftoppmAvailable 先占位，稍后的条件分支会根据实际输入补齐它。
let pdftoppmAvailable: boolean | undefined

/**
 * Reset the pdftoppm availability cache. Used by tests only.
 */
// resetPdftoppmCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetPdftoppmCache(): void {
  // pdftoppmAvailable更新为 `undefined`，确保共享工具后续读取最新状态。
  pdftoppmAvailable = undefined
}

/**
 * Check whether the `pdftoppm` binary (from poppler-utils) is available.
 * The result is cached for the lifetime of the process.
 */
// isPdftoppmAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isPdftoppmAvailable(): Promise<boolean> {
  // `pdftoppmAvailable` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (pdftoppmAvailable !== undefined) return pdftoppmAvailable
  // 从 `await execFileNoThrow('pdftoppm', ['-v'], {` 解构 code、stderr，减少共享工具 pdf对同一对象的重复访问。
  const { code, stderr } = await execFileNoThrow('pdftoppm', ['-v'], {
    timeout: 5000,
    useCwd: false,
  })
  // pdftoppm prints version info to stderr and exits 0 (or sometimes 99 on older versions)
  // pdftoppmAvailable更新为 `code === 0 || stderr.length > 0`，确保共享工具后续读取最新状态。
  pdftoppmAvailable = code === 0 || stderr.length > 0
  // 返回 `pdftoppmAvailable`，作为共享工具这次计算的结果。
  return pdftoppmAvailable
}

/**
 * Extract PDF pages as JPEG images using pdftoppm.
 * Produces page-01.jpg, page-02.jpg, etc. in an output directory.
 * This enables reading large PDFs and works with all API providers.
 *
 * @param filePath Path to the PDF file
 * @param options Optional page range (1-indexed, inclusive)
 */
// extractPDFPages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function extractPDFPages(
  filePath: string,
  options?: { firstPage?: number; lastPage?: number },
): Promise<PDFResult<PDFExtractPagesResult>> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // stats 集合保存`fs.stat`，供共享工具后续处理使用。
    const stats = await fs.stat(filePath)
    // originalSize统计`stats.size`，供后续判断或组装使用。
    const originalSize = stats.size

    // 满足 `originalSize === 0` 时，共享工具执行该分支。
    if (originalSize === 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: { reason: 'empty', message: `PDF file is empty: ${filePath}` },
      }
    }

    // 满足 `originalSize > PDF_MAX_EXTRACT_SIZE` 时，共享工具执行该分支。
    if (originalSize > PDF_MAX_EXTRACT_SIZE) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: {
          reason: 'too_large',
          message: `PDF file exceeds maximum allowed size for text extraction (${formatFileSize(PDF_MAX_EXTRACT_SIZE)}).`,
        },
      }
    }

    // available保存`isPdftoppmAvailable`，供共享工具后续处理使用。
    const available = await isPdftoppmAvailable()
    // available缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!available) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: {
          reason: 'unavailable',
          message:
            'pdftoppm is not installed. Install poppler-utils (e.g. `brew install poppler` or `apt-get install poppler-utils`) to enable PDF page rendering.',
        },
      }
    }

    // uuid保存`randomUUID`，供共享工具后续处理使用。
    const uuid = randomUUID()
    // outputDir格式化`join`，供共享工具后续处理使用。
    const outputDir = join(getToolResultsDir(), `pdf-${uuid}`)
    // 等待 `mkdir(outputDir, { recursive: true })` 完成，再继续共享工具 pdf的异步流程。
    await mkdir(outputDir, { recursive: true })

    // pdftoppm produces files like <prefix>-01.jpg, <prefix>-02.jpg, etc.
    // prefix格式化`join`，供共享工具后续处理使用。
    const prefix = join(outputDir, 'page')
    // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
    const args = ['-jpeg', '-r', '100']
    // 满足 `options?.firstPage` 时，共享工具执行该分支。
    if (options?.firstPage) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-f', String(options.firstPage))
    }
    // `options?.lastPage && options.lastPage` 与 `Infinity` 不一致时刷新派生状态，避免使用过期结果。
    if (options?.lastPage && options.lastPage !== Infinity) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-l', String(options.lastPage))
    }
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push(filePath, prefix)
    // 从 `await execFileNoThrow('pdftoppm', args, {` 解构 code、stderr，减少共享工具 pdf对同一对象的重复访问。
    const { code, stderr } = await execFileNoThrow('pdftoppm', args, {
      timeout: 120_000,
      useCwd: false,
    })

    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 满足 `/password/i.test(stderr)` 时，共享工具执行该分支。
      if (/password/i.test(stderr)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: false,
          error: {
            reason: 'password_protected',
            message:
              'PDF is password-protected. Please provide an unprotected version.',
          },
        }
      }
      // 满足 `/damaged|corrupt|invalid/i.test(stderr)` 时，共享工具执行该分支。
      if (/damaged|corrupt|invalid/i.test(stderr)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: false,
          error: {
            reason: 'corrupted',
            message: 'PDF file is corrupted or invalid.',
          },
        }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: { reason: 'unknown', message: `pdftoppm failed: ${stderr}` },
      }
    }

    // Read generated image files and sort naturally
    // entries 集合读取`readdir`，供共享工具后续处理使用。
    const entries = await readdir(outputDir)
    // imageFiles 文件数据筛选`entries.filter`，供共享工具后续处理使用。
    const imageFiles = entries.filter(f => f.endsWith('.jpg')).sort()
    // pageCount 数量记录 `imageFiles.length` 是否成立，下一步按该结果分支。
    const pageCount = imageFiles.length

    // 满足 `pageCount === 0` 时，共享工具执行该分支。
    if (pageCount === 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: {
          reason: 'corrupted',
          message: 'pdftoppm produced no output pages. The PDF may be invalid.',
        },
      }
    }

    // count 数量 命名 `imageFiles.length`，让后续代码直接表达这个值的用途。
    const count = imageFiles.length

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: true,
      data: {
        type: 'parts',
        file: {
          filePath,
          originalSize,
          outputDir,
          count,
        },
      },
    }
  } catch (e: unknown) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: {
        reason: 'unknown',
        message: errorMessage(e),
      },
    }
  }
}
