// 引入 detectFileEncoding，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { detectFileEncoding } from './file.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

// CachedFileData 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedFileData = {
  content: string
  encoding: BufferEncoding
  mtime: number
}

/**
 * A simple in-memory cache for file contents with automatic invalidation based on modification time.
 * This eliminates redundant file reads in FileEditTool operations.
 */
// FileReadCache 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class FileReadCache {
  private cache = new Map<string, CachedFileData>()
  private readonly maxCacheSize = 1000

  /**
   * Reads a file with caching. Returns both content and encoding.
   * Cache key includes file path and modification time for automatic invalidation.
   */
  // readFile 使用 filePath: string 完成共享工具里的对应操作。
  readFile(filePath: string): { content: string; encoding: BufferEncoding } {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()

    // Get file stats for cache invalidation
    // stats 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let stats
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合更新为 `fs.statSync(filePath)`，确保共享工具后续读取最新状态。
      stats = fs.statSync(filePath)
    } catch (error) {
      // File was deleted, remove from cache and re-throw
      // 调用 this.cache.delete，触发共享工具此处需要的副作用。
      this.cache.delete(filePath)
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }

    // cacheKey 缓存 命名 `filePath`，让后续代码直接表达这个值的用途。
    const cacheKey = filePath
    // cachedData 缓存读取`cache.get`，供共享工具后续处理使用。
    const cachedData = this.cache.get(cacheKey)

    // Check if we have valid cached data
    // 只有 `cachedData && cachedData.mtime === stats.mtimeMs` 满足时，共享工具才执行该分支。
    if (cachedData && cachedData.mtime === stats.mtimeMs) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        content: cachedData.content,
        encoding: cachedData.encoding,
      }
    }

    // Cache miss or stale data - read the file
    // encoding读取`detectFileEncoding`，供共享工具后续处理使用。
    const encoding = detectFileEncoding(filePath)
    // 文本内容 命名 `fs`，让后续代码直接表达这个值的用途。
    const content = fs
      .readFileSync(filePath, { encoding })
      .replaceAll('\r\n', '\n')

    // Update cache
    // this.cache.set 写入新的状态值，使共享工具后续读取保持一致。
    this.cache.set(cacheKey, {
      content,
      encoding,
      mtime: stats.mtimeMs,
    })

    // Evict oldest entries if cache is too large
    // 满足 `this.cache.size > this.maxCacheSize` 时，共享工具执行该分支。
    if (this.cache.size > this.maxCacheSize) {
      // firstKey保存`cache.keys`，供共享工具后续处理使用。
      const firstKey = this.cache.keys().next().value
      // 满足 `firstKey` 时，共享工具执行该分支。
      if (firstKey) {
        // 调用 this.cache.delete，触发共享工具此处需要的副作用。
        this.cache.delete(firstKey)
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content, encoding }
  }

  /**
   * Clears the entire cache. Useful for testing or memory management.
   */
  // clear 使用 无 完成共享工具里的对应操作。
  clear(): void {
    // 调用 this.cache.clear，触发共享工具此处需要的副作用。
    this.cache.clear()
  }

  /**
   * Removes a specific file from the cache.
   */
  // invalidate 使用 filePath: string 完成共享工具里的对应操作。
  invalidate(filePath: string): void {
    // 调用 this.cache.delete，触发共享工具此处需要的副作用。
    this.cache.delete(filePath)
  }

  /**
   * Gets cache statistics for debugging/monitoring.
   */
  // getStats不依赖额外参数，直接计算共享工具需要的结果。
  getStats(): { size: number; entries: string[] } {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}

// Export a singleton instance
// fileReadCache 文件数据保存`FileReadCache`，供共享工具后续处理使用。
export const fileReadCache = new FileReadCache()
