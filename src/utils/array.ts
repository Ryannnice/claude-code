// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export function intersperse<A>(as: A[], separator: (index: number) => A): A[] {
  // 返回 `as.flatMap((a, i) => (i ? [separator(i), a] : [a]))`，作为共享工具这次计算的结果。
  return as.flatMap((a, i) => (i ? [separator(i), a] : [a]))
}

export function count<T>(arr: readonly T[], pred: (x: T) => unknown): number {
  // n保存`0`，供共享工具 array后续判断或输出使用。
  let n = 0
  // 逐项读取 `arr) n += +!!pred(x` 中的x，按输入顺序推进共享工具。
  for (const x of arr) n += +!!pred(x)
  // 返回 `n`，作为共享工具这次计算的结果。
  return n
}

// uniq 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function uniq<T>(xs: Iterable<T>): T[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...new Set(xs)]
}
