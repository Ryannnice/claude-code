// 引入 LRUCache，将 lru-cache 中已经封装好的能力接到本文件流程里。
import { LRUCache } from 'lru-cache'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { normalize } from 'path'

// FileState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileState = {
  content: string
  timestamp: number
  offset: number | undefined
  limit: number | undefined
  // True when this entry was populated by auto-injection (e.g. CLAUDE.md) and
  // the injected content did not match disk (stripped HTML comments, stripped
  // frontmatter, truncated MEMORY.md). The model has only seen a partial view;
  // Edit/Write must require an explicit Read first. `content` here holds the
  // RAW disk bytes (for getChangedFiles diffing), not what the model saw.
  isPartialView?: boolean
}

// Default max entries for read file state caches
// READ_FILE_STATE_CACHE_SIZE 文件数据 命名 `100`，让后续代码直接表达这个值的用途。
export const READ_FILE_STATE_CACHE_SIZE = 100

// Default size limit for file state caches (25MB)
// This prevents unbounded memory growth from large file contents
// DEFAULT_MAX_CACHE_SIZE_BYTES 缓存保存`25 * 1024 * 1024`，供共享工具 file State Cache后续判断或输出使用。
const DEFAULT_MAX_CACHE_SIZE_BYTES = 25 * 1024 * 1024

/**
 * A file state cache that normalizes all path keys before access.
 * This ensures consistent cache hits regardless of whether callers pass
 * relative vs absolute paths with redundant segments (e.g. /foo/../bar)
 * or mixed path separators on Windows (/ vs \).
 */
// FileStateCache 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class FileStateCache {
  private cache: LRUCache<string, FileState>

  // 构造函数接收 maxEntries: number, maxSizeBytes: number，把外部输入整理成实例可复用的内部状态。
  constructor(maxEntries: number, maxSizeBytes: number) {
    // 更新实例字段 cache 为 new LRUCache<string, FileState>({，同步共享工具的内部状态。
    this.cache = new LRUCache<string, FileState>({
      max: maxEntries,
      maxSize: maxSizeBytes,
      // 这个回调绑定到 sizeCalculation: value => Math.max(1, Buffer.byteLength(value.content)),，负责共享工具在该局部场景下的响应。
      sizeCalculation: value => Math.max(1, Buffer.byteLength(value.content)),
    })
  }

  // get 根据 key: string 读取或计算共享工具需要的结果。
  get(key: string): FileState | undefined {
    // 返回 `this.cache.get(normalize(key))`，作为共享工具这次计算的结果。
    return this.cache.get(normalize(key))
  }

  // set 根据 key: string, value: FileState 更新共享工具的状态。
  set(key: string, value: FileState): this {
    // this.cache.set 写入新的状态值，使共享工具后续读取保持一致。
    this.cache.set(normalize(key), value)
    // 返回 `this`，作为共享工具这次计算的结果。
    return this
  }

  // has 用 key: string 判断共享工具是否满足条件。
  has(key: string): boolean {
    // 返回 `this.cache.has(normalize(key))`，作为共享工具这次计算的结果。
    return this.cache.has(normalize(key))
  }

  // delete 使用 key: string 完成共享工具里的对应操作。
  delete(key: string): boolean {
    // 返回 `this.cache.delete(normalize(key))`，作为共享工具这次计算的结果。
    return this.cache.delete(normalize(key))
  }

  // clear 使用 无 完成共享工具里的对应操作。
  clear(): void {
    // 调用 this.cache.clear，触发共享工具此处需要的副作用。
    this.cache.clear()
  }

  // 共享工具 file State Cache在这里处理 `get size(): number {`，完成这一小步状态转换。
  get size(): number {
    // 返回 `this.cache.size`，作为共享工具这次计算的结果。
    return this.cache.size
  }

  // 共享工具 file State Cache在这里处理 `get max(): number {`，完成这一小步状态转换。
  get max(): number {
    // 返回 `this.cache.max`，作为共享工具这次计算的结果。
    return this.cache.max
  }

  // 共享工具 file State Cache在这里处理 `get maxSize(): number {`，完成这一小步状态转换。
  get maxSize(): number {
    // 返回 `this.cache.maxSize`，作为共享工具这次计算的结果。
    return this.cache.maxSize
  }

  // 共享工具 file State Cache在这里处理 `get calculatedSize(): number {`，完成这一小步状态转换。
  get calculatedSize(): number {
    // 返回 `this.cache.calculatedSize`，作为共享工具这次计算的结果。
    return this.cache.calculatedSize
  }

  // keys 使用 无 完成共享工具里的对应操作。
  keys(): Generator<string> {
    // 返回 `this.cache.keys()`，作为共享工具这次计算的结果。
    return this.cache.keys()
  }

  // entries 使用 无 完成共享工具里的对应操作。
  entries(): Generator<[string, FileState]> {
    // 返回 `this.cache.entries()`，作为共享工具这次计算的结果。
    return this.cache.entries()
  }

  // dump 使用 无 完成共享工具里的对应操作。
  dump(): ReturnType<LRUCache<string, FileState>['dump']> {
    // 返回 `this.cache.dump()`，作为共享工具这次计算的结果。
    return this.cache.dump()
  }

  // load 使用 entries: ReturnType<LRUCache<string, FileState>['… 完成共享工具里的对应操作。
  load(entries: ReturnType<LRUCache<string, FileState>['dump']>): void {
    // 调用 this.cache.load，触发共享工具此处需要的副作用。
    this.cache.load(entries)
  }
}

/**
 * Factory function to create a size-limited FileStateCache.
 * Uses LRUCache's built-in size-based eviction to prevent memory bloat.
 * Note: Images are not cached (see FileReadTool) so size limit is mainly
 * for large text files, notebooks, and other editable content.
 */
// createFileStateCacheWithSizeLimit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createFileStateCacheWithSizeLimit(
  maxEntries: number,
  maxSizeBytes: number = DEFAULT_MAX_CACHE_SIZE_BYTES,
): FileStateCache {
  // 返回 `new FileStateCache(maxEntries, maxSizeBytes)`，作为共享工具这次计算的结果。
  return new FileStateCache(maxEntries, maxSizeBytes)
}

// Helper function to convert cache to object (used by compact.ts)
// cacheToObject 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cacheToObject(
  cache: FileStateCache,
): Record<string, FileState> {
  // 返回 `Object.fromEntries(cache.entries())`，作为共享工具这次计算的结果。
  return Object.fromEntries(cache.entries())
}

// Helper function to get all keys from cache (used by several components)
// cacheKeys 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cacheKeys(cache: FileStateCache): string[] {
  // 返回 `Array.from(cache.keys())`，作为共享工具这次计算的结果。
  return Array.from(cache.keys())
}

// Helper function to clone a FileStateCache
// Preserves size limit configuration from the source cache
// cloneFileStateCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cloneFileStateCache(cache: FileStateCache): FileStateCache {
  // cloned构建`createFileStateCacheWithSizeLimit`，供共享工具后续处理使用。
  const cloned = createFileStateCacheWithSizeLimit(cache.max, cache.maxSize)
  // 调用 cloned.load，触发共享工具此处需要的副作用。
  cloned.load(cache.dump())
  // 返回 `cloned`，作为共享工具这次计算的结果。
  return cloned
}

// Merge two file state caches, with more recent entries (by timestamp) overriding older ones
// mergeFileStateCaches 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergeFileStateCaches(
  first: FileStateCache,
  second: FileStateCache,
): FileStateCache {
  // merged保存`cloneFileStateCache`，供共享工具后续处理使用。
  const merged = cloneFileStateCache(first)
  // 循环处理 `const [filePath, fileState] of second.entries()`，让共享工具把同类条目按顺序走完。
  for (const [filePath, fileState] of second.entries()) {
    // existing读取`merged.get`，供共享工具后续处理使用。
    const existing = merged.get(filePath)
    // Only override if the new entry is more recent
    // 只有 `!existing || fileState.timestamp > existing.times` 满足时，共享工具才执行该分支。
    if (!existing || fileState.timestamp > existing.timestamp) {
      // merged.set 写入新的状态值，使共享工具后续读取保持一致。
      merged.set(filePath, fileState)
    }
  }
  // 返回 `merged`，作为共享工具这次计算的结果。
  return merged
}
