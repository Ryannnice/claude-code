// NO_VALUE保存`Symbol`，供共享工具后续处理使用。
const NO_VALUE = Symbol('NO_VALUE')

// lastX 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function lastX<A>(as: AsyncGenerator<A>): Promise<A> {
  // lastValue保存`NO_VALUE`，供后续判断或组装使用。
  let lastValue: A | typeof NO_VALUE = NO_VALUE
  // 逐项读取 `as` 中的a，按输入顺序推进共享工具。
  for await (const a of as) {
    // lastValue更新为 `a`，确保共享工具后续读取最新状态。
    lastValue = a
  }
  // 满足 `lastValue === NO_VALUE` 时，共享工具执行该分支。
  if (lastValue === NO_VALUE) {
    // 抛出 new Error('No items in generator')，阻止共享工具在无效状态下继续运行。
    throw new Error('No items in generator')
  }
  // 返回 `lastValue`，作为共享工具这次计算的结果。
  return lastValue
}

// returnValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function returnValue<A>(
  as: AsyncGenerator<unknown, A>,
): Promise<A> {
  // e 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let e
  // 先执行一次循环体，再按尾部条件决定是否继续共享工具处理。
  do {
    // e更新为 `await as.next()`，确保共享工具后续读取最新状态。
    e = await as.next()
  } while (!e.done)
  // 返回 `e.value`，作为共享工具这次计算的结果。
  return e.value
}

// QueuedGenerator 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type QueuedGenerator<A> = {
  done: boolean | void
  value: A | void
  generator: AsyncGenerator<A, void>
  promise: Promise<QueuedGenerator<A>>
}

// Run all generators concurrently up to a concurrency cap, yielding values as they come in
// 共享工具 generators在这里处理 `export async function* all<A>(`，完成这一小步状态转换。
export async function* all<A>(
  generators: AsyncGenerator<A, void>[],
  concurrencyCap = Infinity,
): AsyncGenerator<A, void> {
  // next封装成回调，供共享工具 generators在事件触发或异步步骤中调用。
  const next = (generator: AsyncGenerator<A, void>) => {
    // promise 异步任务 命名 `generator`，让后续代码直接表达这个值的用途。
    const promise: Promise<QueuedGenerator<A>> = generator
      .next()
      .then(({ done, value }) => ({
        done,
        value,
        generator,
        promise,
      }))
    // 返回 `promise`，作为共享工具这次计算的结果。
    return promise
  }
  // waiting 聚合成有序列表，保持后续遍历顺序稳定。
  const waiting = [...generators]
  // promises 集合 命名 `new Set<Promise<QueuedGenerator<A>>>()`，让后续代码直接表达这个值的用途。
  const promises = new Set<Promise<QueuedGenerator<A>>>()

  // Start initial batch up to concurrency cap
  // while 使用 promises.size < concurrencyCap && waiting.length … 完成共享工具里的对应操作。
  while (promises.size < concurrencyCap && waiting.length > 0) {
    // gen保存`waiting.shift`，供共享工具后续处理使用。
    const gen = waiting.shift()!
    // 调用 promises.add，触发共享工具此处需要的副作用。
    promises.add(next(gen))
  }

  // while 使用 promises.size > 0 完成共享工具里的对应操作。
  while (promises.size > 0) {
    // 从 `await Promise.race(promises)` 解构 done、value、generator、promise，减少共享工具 generators对同一对象的重复访问。
    const { done, value, generator, promise } = await Promise.race(promises)
    // 调用 promises.delete，触发共享工具此处需要的副作用。
    promises.delete(promise)

    // done缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!done) {
      // 调用 promises.add，触发共享工具此处需要的副作用。
      promises.add(next(generator))
      // TODO: Clean this up
      // `value` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (value !== undefined) {
        // 生成器产出 `value`，把阶段性结果交给上层消费。
        yield value
      }
    // 共享工具 generators在这里处理 `} else if (waiting.length > 0) {`，完成这一小步状态转换。
    } else if (waiting.length > 0) {
      // Start a new generator when one finishes
      // nextGen保存`waiting.shift`，供共享工具后续处理使用。
      const nextGen = waiting.shift()!
      // 调用 promises.add，触发共享工具此处需要的副作用。
      promises.add(next(nextGen))
    }
  }
}

// toArray 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function toArray<A>(
  generator: AsyncGenerator<A, void>,
): Promise<A[]> {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: A[] = []
  // 逐项读取 `generator` 中的a，按输入顺序推进共享工具。
  for await (const a of generator) {
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(a)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// 共享工具 generators在这里处理 `export async function* fromArray<T>(values: T[]): AsyncGenerator<T, voi...`，完成这一小步状态转换。
export async function* fromArray<T>(values: T[]): AsyncGenerator<T, void> {
  // 按顺序遍历 `values` 中的取值，逐个交给共享工具处理。
  for (const value of values) {
    // 生成器产出 `value`，把阶段性结果交给上层消费。
    yield value
  }
}
