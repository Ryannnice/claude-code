// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Returns a memoized factory function that constructs the value on first call.
 * Used to defer Zod schema construction from module init time to first access.
 */
export function lazySchema<T>(factory: () => T): () => T {
  // cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
  let cached: T | undefined
  // 返回 `() => (cached ??= factory())`，作为共享工具这次计算的结果。
  return () => (cached ??= factory())
}
