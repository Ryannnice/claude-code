/**
 * https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.groupby
 */
// objectGroupBy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function objectGroupBy<T, K extends PropertyKey>(
  items: Iterable<T>,
  // 这个回调绑定到 keySelector: (item: T, index: number) => K,，负责共享工具在该局部场景下的响应。
  keySelector: (item: T, index: number) => K,
): Partial<Record<K, T[]>> {
  // 结果构建`Object.create`，供共享工具后续处理使用。
  const result = Object.create(null) as Partial<Record<K, T[]>>
  // index 索引保存`0`，供共享工具 object Group By后续判断或输出使用。
  let index = 0
  // 按顺序遍历 `items` 中的item，逐个交给共享工具处理。
  for (const item of items) {
    // 按键保存`keySelector`，供共享工具后续处理使用。
    const key = keySelector(item, index++)
    // 满足 `result[key] === undefined` 时，共享工具执行该分支。
    if (result[key] === undefined) {
      // result[key更新为 `[]`，确保共享工具 object Group By后续读取最新状态。
      result[key] = []
    }
    // 共享工具 object Group By在这里处理 `result[key].push(item)`，完成这一小步状态转换。
    result[key].push(item)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
