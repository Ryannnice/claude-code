// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from './errors.js'

// PASTE_STORE_DIR保存`'paste-cache'`，作为后续固定文本处理的输入。
const PASTE_STORE_DIR = 'paste-cache'

/**
 * Get the paste store directory (persistent across sessions).
 */
// getPasteStoreDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPasteStoreDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), PASTE_STORE_DIR)`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), PASTE_STORE_DIR)
}

/**
 * Generate a hash for paste content to use as filename.
 * Exported so callers can get the hash synchronously before async storage.
 */
// hashPastedText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashPastedText(content: string): string {
  // 返回 `createHash('sha256').update(content).digest('hex').slice(0, 16)`，作为共享工具这次计算的结果。
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Get the file path for a paste by its content hash.
 */
// getPastePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPastePath(hash: string): string {
  // 返回 `join(getPasteStoreDir(), `${hash}.txt`)`，作为共享工具这次计算的结果。
  return join(getPasteStoreDir(), `${hash}.txt`)
}

/**
 * Store pasted text content to disk.
 * The hash should be pre-computed with hashPastedText() so the caller
 * can use it immediately without waiting for the async disk write.
 */
// storePastedText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function storePastedText(
  hash: string,
  content: string,
): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dir读取`getPasteStoreDir`，供共享工具后续处理使用。
    const dir = getPasteStoreDir()
    // 等待 `mkdir(dir, { recursive: true })` 完成，再继续共享工具 paste Store的异步流程。
    await mkdir(dir, { recursive: true })

    // pastePath 路径数据读取`getPastePath`，供共享工具后续处理使用。
    const pastePath = getPastePath(hash)

    // Content-addressable: same hash = same content, so overwriting is safe
    // 等待 `writeFile(pastePath, content, { encoding: 'utf8', mode: 0o600 })` 完成，再继续共享工具 paste Store的异步流程。
    await writeFile(pastePath, content, { encoding: 'utf8', mode: 0o600 })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Stored paste ${hash} to ${pastePath}`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to store paste: ${error}`)
  }
}

/**
 * Retrieve pasted text content by its hash.
 * Returns null if not found or on error.
 */
// retrievePastedText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function retrievePastedText(hash: string): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // pastePath 路径数据读取`getPastePath`，供共享工具后续处理使用。
    const pastePath = getPastePath(hash)
    // 等待并返回 `readFile(pastePath, { encoding: 'utf8' })`，调用方直接接收异步结果。
    return await readFile(pastePath, { encoding: 'utf8' })
  } catch (error) {
    // ENOENT is expected when paste doesn't exist
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to retrieve paste ${hash}: ${error}`)
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Clean up old paste files that are no longer referenced.
 * This is a simple time-based cleanup - removes files older than cutoffDate.
 */
// cleanupOldPastes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldPastes(cutoffDate: Date): Promise<void> {
  // pasteDir读取`getPasteStoreDir`，供共享工具后续处理使用。
  const pasteDir = getPasteStoreDir()

  // files 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let files
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(pasteDir)`，确保共享工具后续读取最新状态。
    files = await readdir(pasteDir)
  } catch {
    // Directory doesn't exist or can't be read - nothing to clean up
    // 共享工具 paste Store在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // cutoffTime读取`cutoffDate.getTime`，供共享工具后续处理使用。
  const cutoffTime = cutoffDate.getTime()
  // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of files) {
    // 满足 `!file.endsWith('.txt')` 时，共享工具执行该分支。
    if (!file.endsWith('.txt')) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 文件路径格式化`join`，供共享工具后续处理使用。
    const filePath = join(pasteDir, file)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供共享工具后续处理使用。
      const stats = await stat(filePath)
      // 满足 `stats.mtimeMs < cutoffTime` 时，共享工具执行该分支。
      if (stats.mtimeMs < cutoffTime) {
        // 等待 `unlink(filePath)` 完成，再继续共享工具 paste Store的异步流程。
        await unlink(filePath)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Cleaned up old paste: ${filePath}`)
      }
    } catch {
      // Ignore errors for individual files
    }
  }
}
