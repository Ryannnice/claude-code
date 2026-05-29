// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, open } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 类型依赖 { PastedContent } 来自 ./config.js，用于校准共享工具的数据契约。
import type { PastedContent } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

// IMAGE_STORE_DIR 命名 `'image-cache'`，让后续代码直接表达这个值的用途。
const IMAGE_STORE_DIR = 'image-cache'
// MAX_STORED_IMAGE_PATHS 路径数据保存`200`，供共享工具 image Store后续判断或输出使用。
const MAX_STORED_IMAGE_PATHS = 200

// In-memory cache of stored image paths
// storedImagePaths 路径数据构建`new Map<number, string>()`，供后续判断或组装使用。
const storedImagePaths = new Map<number, string>()

/**
 * Get the image store directory for the current session.
 */
// getImageStoreDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getImageStoreDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), IMAGE_STORE_DIR, getSessionId())`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), IMAGE_STORE_DIR, getSessionId())
}

/**
 * Ensure the image store directory exists.
 */
// ensureImageStoreDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensureImageStoreDir(): Promise<void> {
  // dir读取`getImageStoreDir`，供共享工具后续处理使用。
  const dir = getImageStoreDir()
  // 等待 `mkdir(dir, { recursive: true })` 完成，再继续共享工具 image Store的异步流程。
  await mkdir(dir, { recursive: true })
}

/**
 * Get the file path for an image by ID.
 */
// getImagePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getImagePath(imageId: number, mediaType: string): string {
  // extension格式化`mediaType.split`，供共享工具后续处理使用。
  const extension = mediaType.split('/')[1] || 'png'
  // 返回 `join(getImageStoreDir(), `${imageId}.${extension}`)`，作为共享工具这次计算的结果。
  return join(getImageStoreDir(), `${imageId}.${extension}`)
}

/**
 * Cache the image path immediately (fast, no file I/O).
 */
// cacheImagePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cacheImagePath(content: PastedContent): string | null {
  // `content.type` 与 `'image'` 不一致时刷新派生状态，避免使用过期结果。
  if (content.type !== 'image') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // imagePath 路径数据读取`getImagePath`，供共享工具后续处理使用。
  const imagePath = getImagePath(content.id, content.mediaType || 'image/png')
  // 调用 evictOldestIfAtCap，触发共享工具此处需要的副作用。
  evictOldestIfAtCap()
  // storedImagePaths.set 写入新的状态值，使共享工具后续读取保持一致。
  storedImagePaths.set(content.id, imagePath)
  // 返回 `imagePath`，作为共享工具这次计算的结果。
  return imagePath
}

/**
 * Store an image from pastedContents to disk.
 */
// storeImage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function storeImage(
  content: PastedContent,
): Promise<string | null> {
  // `content.type` 与 `'image'` 不一致时刷新派生状态，避免使用过期结果。
  if (content.type !== 'image') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `ensureImageStoreDir()` 完成，再继续共享工具 image Store的异步流程。
    await ensureImageStoreDir()
    // imagePath 路径数据读取`getImagePath`，供共享工具后续处理使用。
    const imagePath = getImagePath(content.id, content.mediaType || 'image/png')
    // fh保存`open`，供共享工具后续处理使用。
    const fh = await open(imagePath, 'w', 0o600)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fh.writeFile(content.content, { encoding: 'base64' })` 完成，再继续共享工具 image Store的异步流程。
      await fh.writeFile(content.content, { encoding: 'base64' })
      // 等待 `fh.datasync()` 完成，再继续共享工具 image Store的异步流程。
      await fh.datasync()
    } finally {
      // 等待 `fh.close()` 完成，再继续共享工具 image Store的异步流程。
      await fh.close()
    }
    // 调用 evictOldestIfAtCap，触发共享工具此处需要的副作用。
    evictOldestIfAtCap()
    // storedImagePaths.set 写入新的状态值，使共享工具后续读取保持一致。
    storedImagePaths.set(content.id, imagePath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Stored image ${content.id} to ${imagePath}`)
    // 返回 `imagePath`，作为共享工具这次计算的结果。
    return imagePath
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to store image: ${error}`)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Store all images from pastedContents to disk.
 */
// storeImages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function storeImages(
  pastedContents: Record<number, PastedContent>,
): Promise<Map<number, string>> {
  // pathMap 路径数据构建`new Map<number, string>()`，供后续判断或组装使用。
  const pathMap = new Map<number, string>()

  // 循环处理 `const [id, content] of Object.entries(pastedContents)`，让共享工具把同类条目按顺序走完。
  for (const [id, content] of Object.entries(pastedContents)) {
    // 当 `content.type` 匹配 `'image'` 时，共享工具执行对应分支。
    if (content.type === 'image') {
      // 路径保存`storeImage`，供共享工具后续处理使用。
      const path = await storeImage(content)
      // 满足 `path` 时，共享工具执行该分支。
      if (path) {
        // pathMap.set 写入新的状态值，使共享工具后续读取保持一致。
        pathMap.set(Number(id), path)
      }
    }
  }

  // 返回 `pathMap`，作为共享工具这次计算的结果。
  return pathMap
}

/**
 * Get the file path for a stored image by ID.
 */
// getStoredImagePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStoredImagePath(imageId: number): string | null {
  // 返回 `storedImagePaths.get(imageId) ?? null`，作为共享工具这次计算的结果。
  return storedImagePaths.get(imageId) ?? null
}

/**
 * Clear the in-memory cache of stored image paths.
 */
// clearStoredImagePaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearStoredImagePaths(): void {
  // 调用 storedImagePaths.clear，触发共享工具此处需要的副作用。
  storedImagePaths.clear()
}

// evictOldestIfAtCap 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function evictOldestIfAtCap(): void {
  // while 使用 storedImagePaths.size >= MAX_STORED_IMAGE_PATHS 完成共享工具里的对应操作。
  while (storedImagePaths.size >= MAX_STORED_IMAGE_PATHS) {
    // oldest保存`storedImagePaths.keys`，供共享工具后续处理使用。
    const oldest = storedImagePaths.keys().next().value
    // `oldest` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (oldest !== undefined) {
      // 调用 storedImagePaths.delete，触发共享工具此处需要的副作用。
      storedImagePaths.delete(oldest)
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
}

/**
 * Clean up old image cache directories from previous sessions.
 */
// cleanupOldImageCaches 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldImageCaches(): Promise<void> {
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()
  // baseDir格式化`join`，供共享工具后续处理使用。
  const baseDir = join(getClaudeConfigHomeDir(), IMAGE_STORE_DIR)
  // currentSessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const currentSessionId = getSessionId()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // sessionDirs 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let sessionDirs
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // sessionDirs 会话数据更新为 `await fsImpl.readdir(baseDir)`，确保共享工具后续读取最新状态。
      sessionDirs = await fsImpl.readdir(baseDir)
    } catch {
      // 共享工具 image Store在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 按顺序遍历 `sessionDirs` 中的sessionDir 会话数据，逐个交给共享工具处理。
    for (const sessionDir of sessionDirs) {
      // 满足 `sessionDir.name === currentSessionId` 时，共享工具执行该分支。
      if (sessionDir.name === currentSessionId) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // sessionPath 会话数据格式化`join`，供共享工具后续处理使用。
      const sessionPath = join(baseDir, sessionDir.name)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `fsImpl.rm(sessionPath, { recursive: true, force: true })` 完成，再继续共享工具 image Store的异步流程。
        await fsImpl.rm(sessionPath, { recursive: true, force: true })
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Cleaned up old image cache: ${sessionPath}`)
      } catch {
        // Ignore errors for individual directories
      }
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // remaining读取`fsImpl.readdir`，供共享工具后续处理使用。
      const remaining = await fsImpl.readdir(baseDir)
      // remaining为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (remaining.length === 0) {
        // 等待 `fsImpl.rmdir(baseDir)` 完成，再继续共享工具 image Store的异步流程。
        await fsImpl.rmdir(baseDir)
      }
    } catch {
      // Ignore
    }
  } catch {
    // Ignore errors reading base directory
  }
}
