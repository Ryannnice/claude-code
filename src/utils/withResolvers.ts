// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Polyfill for Promise.withResolvers() (ES2024, Node 22+).
 * package.json declares "engines": { "node": ">=18.0.0" } so we can't use the native one.
 */
export function withResolvers<T>(): PromiseWithResolvers<T> {
  // 这个回调绑定到 let resolve!: (value: T | PromiseLike<T>) => void，负责共享工具在该局部场景下的响应。
  let resolve!: (value: T | PromiseLike<T>) => void
  // 这个回调绑定到 let reject!: (reason?: unknown) => void，负责共享工具在该局部场景下的响应。
  let reject!: (reason?: unknown) => void
  // promise 异步任务封装成回调，供共享工具 with Resolvers在事件触发或异步步骤中调用。
  const promise = new Promise<T>((res, rej) => {
    // resolve更新为 `res`，确保共享工具后续读取最新状态。
    resolve = res
    // reject更新为 `rej`，确保共享工具后续读取最新状态。
    reject = rej
  })
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { promise, resolve, reject }
}
