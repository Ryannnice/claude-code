// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Note: this code is hot, so is optimized for speed.
 */
export function difference<A>(a: Set<A>, b: Set<A>): Set<A> {
  // 结果构建`new Set<A>()` 整理出中间结果，供共享工具 set后续步骤使用。
  const result = new Set<A>()
  // 按顺序遍历 `a` 中的item，逐个交给共享工具处理。
  for (const item of a) {
    // 满足 `!b.has(item)` 时，共享工具执行该分支。
    if (!b.has(item)) {
      // 调用 result.add，触发共享工具此处需要的副作用。
      result.add(item)
    }
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Note: this code is hot, so is optimized for speed.
 */
// intersects 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function intersects<A>(a: Set<A>, b: Set<A>): boolean {
  // 只有 `a.size === 0 || b.size === 0` 满足时，共享工具才执行该分支。
  if (a.size === 0 || b.size === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 按顺序遍历 `a` 中的item，逐个交给共享工具处理。
  for (const item of a) {
    // 满足 `b.has(item)` 时，共享工具执行该分支。
    if (b.has(item)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Note: this code is hot, so is optimized for speed.
 */
// every 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function every<A>(a: ReadonlySet<A>, b: ReadonlySet<A>): boolean {
  // 按顺序遍历 `a` 中的item，逐个交给共享工具处理。
  for (const item of a) {
    // 满足 `!b.has(item)` 时，共享工具执行该分支。
    if (!b.has(item)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Note: this code is hot, so is optimized for speed.
 */
// union 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function union<A>(a: Set<A>, b: Set<A>): Set<A> {
  // 结果构建`new Set<A>()` 整理出中间结果，供共享工具 set后续步骤使用。
  const result = new Set<A>()
  // 按顺序遍历 `a` 中的item，逐个交给共享工具处理。
  for (const item of a) {
    // 调用 result.add，触发共享工具此处需要的副作用。
    result.add(item)
  }
  // 按顺序遍历 `b` 中的item，逐个交给共享工具处理。
  for (const item of b) {
    // 调用 result.add，触发共享工具此处需要的副作用。
    result.add(item)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
