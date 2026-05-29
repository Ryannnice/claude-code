// 引入 LRUCache，将 lru-cache 中已经封装好的能力接到本文件流程里。
import { LRUCache } from 'lru-cache'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// CacheEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CacheEntry<T> = {
  value: T
  timestamp: number
  refreshing: boolean
}

// MemoizedFunction 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MemoizedFunction<Args extends unknown[], Result> = {
  (...args: Args): Result
  cache: {
    // 这个回调绑定到 clear: () => void，负责共享工具在该局部场景下的响应。
    clear: () => void
  }
}

type LRUMemoizedFunction<Args extends unknown[], Result> = {
  // 共享工具 memoize在这里处理 `(...args: Args): Result`，完成这一小步状态转换。
  (...args: Args): Result
  cache: {
    // 这个回调绑定到 clear: () => void，负责共享工具在该局部场景下的响应。
    clear: () => void
    // 这个回调绑定到 size: () => number，负责共享工具在该局部场景下的响应。
    size: () => number
    // 这个回调绑定到 delete: (key: string) => boolean，负责共享工具在该局部场景下的响应。
    delete: (key: string) => boolean
    // 这个回调绑定到 get: (key: string) => Result | undefined，负责共享工具在该局部场景下的响应。
    get: (key: string) => Result | undefined
    // 这个回调绑定到 has: (key: string) => boolean，负责共享工具在该局部场景下的响应。
    has: (key: string) => boolean
  }
}

/**
 * Creates a memoized function that returns cached values while refreshing in parallel.
 * This implements a write-through cache pattern:
 * - If cache is fresh, return immediately
 * - If cache is stale, return the stale value but refresh it in the background
 * - If no cache exists, block and compute the value
 *
 * @param f The function to memoize
 * @param cacheLifetimeMs The lifetime of cached values in milliseconds
 * @returns A memoized version of the function
 */
// memoizeWithTTL 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoizeWithTTL<Args extends unknown[], Result>(
  // 这个回调绑定到 f: (...args: Args) => Result,，负责共享工具在该局部场景下的响应。
  f: (...args: Args) => Result,
  cacheLifetimeMs: number = 5 * 60 * 1000, // Default 5 minutes
): MemoizedFunction<Args, Result> {
  // cache 缓存构建`new Map<string, CacheEntry<Result>>()`，供后续判断或组装使用。
  const cache = new Map<string, CacheEntry<Result>>()

  // memoized封装成回调，供共享工具 memoize在事件触发或异步步骤中调用。
  const memoized = (...args: Args): Result => {
    // 按键保存`jsonStringify`，供共享工具后续处理使用。
    const key = jsonStringify(args)
    // cached 缓存读取`cache.get`，供共享工具后续处理使用。
    const cached = cache.get(key)
    // now记录时间`Date.now`，供共享工具后续处理使用。
    const now = Date.now()

    // Populate cache
    // cached 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cached) {
      // 取值保存`f`，供共享工具后续处理使用。
      const value = f(...args)
      // cache.set 写入新的状态值，使共享工具后续读取保持一致。
      cache.set(key, {
        value,
        timestamp: now,
        refreshing: false,
      })
      // 返回 `value`，作为共享工具这次计算的结果。
      return value
    }

    // If we have a stale cache entry and it's not already refreshing
    // 共享工具在这里按实际状态进入对应分支。
    if (
      cached &&
      now - cached.timestamp > cacheLifetimeMs &&
      !cached.refreshing
    ) {
      // Mark as refreshing to prevent multiple parallel refreshes
      // refreshing更新为 `true`，确保共享工具后续读取最新状态。
      cached.refreshing = true

      // Schedule async refresh (non-blocking). Both .then and .catch are
      // identity-guarded: a concurrent cache.clear() + cold-miss stores a
      // newer entry while this microtask is queued. .then overwriting with
      // the stale refresh's result is worse than .catch deleting (persists
      // wrong data for full TTL vs. self-correcting on next call).
      // Promise.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      Promise.resolve()
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(() => {
          // newValue保存`f`，供共享工具后续处理使用。
          const newValue = f(...args)
          // 满足 `cache.get(key) === cached` 时，共享工具执行该分支。
          if (cache.get(key) === cached) {
            // cache.set 写入新的状态值，使共享工具后续读取保持一致。
            cache.set(key, {
              value: newValue,
              timestamp: Date.now(),
              refreshing: false,
            })
          }
        })
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(e => {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(e)
          // 满足 `cache.get(key) === cached` 时，共享工具执行该分支。
          if (cache.get(key) === cached) {
            // 调用 cache.delete，触发共享工具此处需要的副作用。
            cache.delete(key)
          }
        })

      // Return the stale value immediately
      // 返回 `cached.value`，作为共享工具这次计算的结果。
      return cached.value
    }

    // 返回 `cache.get(key)!.value`，作为共享工具这次计算的结果。
    return cache.get(key)!.value
  }

  // Add cache clear method
  // cache 缓存更新为 `{`，确保共享工具后续读取最新状态。
  memoized.cache = {
    // 这个回调绑定到 clear: () => cache.clear(),，负责共享工具在该局部场景下的响应。
    clear: () => cache.clear(),
  }

  // 返回 `memoized`，作为共享工具这次计算的结果。
  return memoized
}

/**
 * Creates a memoized async function that returns cached values while refreshing in parallel.
 * This implements a write-through cache pattern for async functions:
 * - If cache is fresh, return immediately
 * - If cache is stale, return the stale value but refresh it in the background
 * - If no cache exists, block and compute the value
 *
 * @param f The async function to memoize
 * @param cacheLifetimeMs The lifetime of cached values in milliseconds
 * @returns A memoized version of the async function
 */
// memoizeWithTTLAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoizeWithTTLAsync<Args extends unknown[], Result>(
  // 这个回调绑定到 f: (...args: Args) => Promise<Result>,，负责共享工具在该局部场景下的响应。
  f: (...args: Args) => Promise<Result>,
  cacheLifetimeMs: number = 5 * 60 * 1000, // Default 5 minutes
): ((...args: Args) => Promise<Result>) & { cache: { clear: () => void } } {
  // cache 缓存构建`new Map<string, CacheEntry<Result>>()`，供后续判断或组装使用。
  const cache = new Map<string, CacheEntry<Result>>()
  // In-flight cold-miss dedup. The old memoizeWithTTL (sync) accidentally
  // provided this: it stored the Promise synchronously before the first
  // await, so concurrent callers shared one f() invocation. This async
  // variant awaits before cache.set, so concurrent cold-miss callers would
  // each invoke f() independently without this map. For
  // refreshAndGetAwsCredentials that means N concurrent `aws sso login`
  // spawns. Same pattern as pending401Handlers in auth.ts:1171.
  // inFlight构建`new Map<string, Promise<Result>>()` 整理出中间结果，供共享工具 memoize后续步骤使用。
  const inFlight = new Map<string, Promise<Result>>()

  // memoized保存`async`，供共享工具后续处理使用。
  const memoized = async (...args: Args): Promise<Result> => {
    // 按键保存`jsonStringify`，供共享工具后续处理使用。
    const key = jsonStringify(args)
    // cached 缓存读取`cache.get`，供共享工具后续处理使用。
    const cached = cache.get(key)
    // now记录时间`Date.now`，供共享工具后续处理使用。
    const now = Date.now()

    // Populate cache - if this throws, nothing gets cached
    // cached 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cached) {
      // pending读取`inFlight.get`，供共享工具后续处理使用。
      const pending = inFlight.get(key)
      // 满足 `pending` 时，共享工具执行该分支。
      if (pending) return pending
      // promise 异步任务保存`f`，供共享工具后续处理使用。
      const promise = f(...args)
      // inFlight.set 写入新的状态值，使共享工具后续读取保持一致。
      inFlight.set(key, promise)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果 等待 `promise`，确保继续执行前已有结果。
        const result = await promise
        // Identity-guard: cache.clear() during the await should discard this
        // result (clear intent is to invalidate). If we're still in-flight,
        // store it. clear() wipes inFlight too, so this check catches that.
        // 满足 `inFlight.get(key) === promise` 时，共享工具执行该分支。
        if (inFlight.get(key) === promise) {
          // cache.set 写入新的状态值，使共享工具后续读取保持一致。
          cache.set(key, {
            value: result,
            timestamp: now,
            refreshing: false,
          })
        }
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      } finally {
        // 满足 `inFlight.get(key) === promise` 时，共享工具执行该分支。
        if (inFlight.get(key) === promise) {
          // 调用 inFlight.delete，触发共享工具此处需要的副作用。
          inFlight.delete(key)
        }
      }
    }

    // If we have a stale cache entry and it's not already refreshing
    // 共享工具在这里按实际状态进入对应分支。
    if (
      cached &&
      now - cached.timestamp > cacheLifetimeMs &&
      !cached.refreshing
    ) {
      // Mark as refreshing to prevent multiple parallel refreshes
      // refreshing更新为 `true`，确保共享工具后续读取最新状态。
      cached.refreshing = true

      // Schedule async refresh (non-blocking). Both .then and .catch are
      // identity-guarded against a concurrent cache.clear() + cold-miss
      // storing a newer entry while this refresh is in flight. .then
      // overwriting with the stale refresh's result is worse than .catch
      // deleting - wrong data persists for full TTL (e.g. credentials from
      // the old awsAuthRefresh command after a settings change).
      // staleEntry 命名 `cached`，让后续代码直接表达这个值的用途。
      const staleEntry = cached
      // 调用 f，触发共享工具此处需要的副作用。
      f(...args)
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(newValue => {
          // 满足 `cache.get(key) === staleEntry` 时，共享工具执行该分支。
          if (cache.get(key) === staleEntry) {
            // cache.set 写入新的状态值，使共享工具后续读取保持一致。
            cache.set(key, {
              value: newValue,
              timestamp: Date.now(),
              refreshing: false,
            })
          }
        })
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(e => {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(e)
          // 满足 `cache.get(key) === staleEntry` 时，共享工具执行该分支。
          if (cache.get(key) === staleEntry) {
            // 调用 cache.delete，触发共享工具此处需要的副作用。
            cache.delete(key)
          }
        })

      // Return the stale value immediately
      // 返回 `cached.value`，作为共享工具这次计算的结果。
      return cached.value
    }

    // 返回 `cache.get(key)!.value`，作为共享工具这次计算的结果。
    return cache.get(key)!.value
  }

  // Add cache clear method. Also clear inFlight: clear() during a cold-miss
  // await should not let the stale in-flight promise be returned to the next
  // caller (defeats the purpose of clear). The try/finally above
  // identity-guards inFlight.delete so the stale promise doesn't delete a
  // fresh one if clear+cold-miss happens before the finally fires.
  // cache 缓存更新为 `{`，确保共享工具后续读取最新状态。
  memoized.cache = {
    // 这个回调绑定到 clear: () => {，负责共享工具在该局部场景下的响应。
    clear: () => {
      // 调用 cache.clear，触发共享工具此处需要的副作用。
      cache.clear()
      // 调用 inFlight.clear，触发共享工具此处需要的副作用。
      inFlight.clear()
    },
  }

  // 返回 `memoized as ((...args: Args) => Promise<Result>) & {`，作为共享工具这次计算的结果。
  return memoized as ((...args: Args) => Promise<Result>) & {
    // 这个回调绑定到 cache: { clear: () => void }，负责共享工具在该局部场景下的响应。
    cache: { clear: () => void }
  }
}

/**
 * Creates a memoized function with LRU (Least Recently Used) eviction policy.
 * This prevents unbounded memory growth by evicting the least recently used entries
 * when the cache reaches its maximum size.
 *
 * Note: Cache size for memoized message processing functions
 * Chosen to prevent unbounded memory growth (was 300MB+ with lodash memoize)
 * while maintaining good cache hit rates for typical conversations.
 *
 * @param f The function to memoize
 * @returns A memoized version of the function with cache management methods
 */
// memoizeWithLRU 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoizeWithLRU<
  Args extends unknown[],
  Result extends NonNullable<unknown>,
>(
  // 这个回调绑定到 f: (...args: Args) => Result,，负责共享工具在该局部场景下的响应。
  f: (...args: Args) => Result,
  // 这个回调绑定到 cacheFn: (...args: Args) => string,，负责共享工具在该局部场景下的响应。
  cacheFn: (...args: Args) => string,
  maxCacheSize: number = 100,
): LRUMemoizedFunction<Args, Result> {
  // cache 缓存 命名 `new LRUCache<string, Result>({`，让后续代码直接表达这个值的用途。
  const cache = new LRUCache<string, Result>({
    max: maxCacheSize,
  })

  // memoized封装成回调，供共享工具 memoize在事件触发或异步步骤中调用。
  const memoized = (...args: Args): Result => {
    // 按键保存`cacheFn`，供共享工具后续处理使用。
    const key = cacheFn(...args)
    // cached 缓存读取`cache.get`，供共享工具后续处理使用。
    const cached = cache.get(key)
    // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (cached !== undefined) {
      // 返回 `cached`，作为共享工具这次计算的结果。
      return cached
    }

    // 结果保存`f`，供共享工具后续处理使用。
    const result = f(...args)
    // cache.set 写入新的状态值，使共享工具后续读取保持一致。
    cache.set(key, result)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // Add cache management methods
  // cache 缓存更新为 `{`，确保共享工具后续读取最新状态。
  memoized.cache = {
    // 这个回调绑定到 clear: () => cache.clear(),，负责共享工具在该局部场景下的响应。
    clear: () => cache.clear(),
    // 这个回调绑定到 size: () => cache.size,，负责共享工具在该局部场景下的响应。
    size: () => cache.size,
    // 这个回调绑定到 delete: (key: string) => cache.delete(key),，负责共享工具在该局部场景下的响应。
    delete: (key: string) => cache.delete(key),
    // peek() avoids updating recency — we only want to observe, not promote
    // 这个回调绑定到 get: (key: string) => cache.peek(key),，负责共享工具在该局部场景下的响应。
    get: (key: string) => cache.peek(key),
    // 这个回调绑定到 has: (key: string) => cache.has(key),，负责共享工具在该局部场景下的响应。
    has: (key: string) => cache.has(key),
  }

  // 返回 `memoized`，作为共享工具这次计算的结果。
  return memoized
}
