// Stream 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class Stream<T> implements AsyncIterator<T> {
  private readonly queue: T[] = []
  private readResolve?: (value: IteratorResult<T>) => void
  private readReject?: (error: unknown) => void
  private isDone: boolean = false
  private hasError: unknown | undefined
  private started = false

  // 构造函数接收 private readonly returned?: (，把外部输入转成实例内部状态。
  constructor(private readonly returned?: () => void) {}

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    // 满足 `this.started` 时，共享工具执行该分支。
    if (this.started) {
      // 抛出 new Error('Stream can only be iterated once')，阻止共享工具在无效状态下继续运行。
      throw new Error('Stream can only be iterated once')
    }
    // 更新实例字段 started 为 true，同步共享工具的内部状态。
    this.started = true
    // 返回 `this`，作为共享工具这次计算的结果。
    return this
  }

  // next 使用 无 完成共享工具里的对应操作。
  next(): Promise<IteratorResult<T, unknown>> {
    // 满足 `this.queue.length > 0` 时，共享工具执行该分支。
    if (this.queue.length > 0) {
      // 返回 `Promise.resolve({`，作为共享工具这次计算的结果。
      return Promise.resolve({
        done: false,
        value: this.queue.shift()!,
      })
    }
    // 满足 `this.isDone` 时，共享工具执行该分支。
    if (this.isDone) {
      // 返回 `Promise.resolve({ done: true, value: undefined })`，作为共享工具这次计算的结果。
      return Promise.resolve({ done: true, value: undefined })
    }
    // 满足 `this.hasError` 时，共享工具执行该分支。
    if (this.hasError) {
      // 返回 `Promise.reject(this.hasError)`，作为共享工具这次计算的结果。
      return Promise.reject(this.hasError)
    }
    // 返回 `new Promise<IteratorResult<T>>((resolve, reject) => {`，作为共享工具这次计算的结果。
    return new Promise<IteratorResult<T>>((resolve, reject) => {
      // 更新实例字段 readResolve 为 resolve，同步共享工具的内部状态。
      this.readResolve = resolve
      // 更新实例字段 readReject 为 reject，同步共享工具的内部状态。
      this.readReject = reject
    })
  }

  // enqueue 使用 value: T 完成共享工具里的对应操作。
  enqueue(value: T): void {
    // 满足 `this.readResolve` 时，共享工具执行该分支。
    if (this.readResolve) {
      // resolve 命名 `this.readResolve`，让后续代码直接表达这个值的用途。
      const resolve = this.readResolve
      // 更新实例字段 readResolve 为 undefined，同步共享工具的内部状态。
      this.readResolve = undefined
      // 更新实例字段 readReject 为 undefined，同步共享工具的内部状态。
      this.readReject = undefined
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve({ done: false, value })
    } else {
      // queue追加新条目，保持收集顺序与输入顺序一致。
      this.queue.push(value)
    }
  }

  // done 使用 无 完成共享工具里的对应操作。
  done() {
    // 更新实例字段 isDone 为 true，同步共享工具的内部状态。
    this.isDone = true
    // 满足 `this.readResolve` 时，共享工具执行该分支。
    if (this.readResolve) {
      // resolve 命名 `this.readResolve`，让后续代码直接表达这个值的用途。
      const resolve = this.readResolve
      // 更新实例字段 readResolve 为 undefined，同步共享工具的内部状态。
      this.readResolve = undefined
      // 更新实例字段 readReject 为 undefined，同步共享工具的内部状态。
      this.readReject = undefined
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve({ done: true, value: undefined })
    }
  }

  // error 使用 error: unknown 完成共享工具里的对应操作。
  error(error: unknown) {
    // 更新实例字段 hasError 为 error，同步共享工具的内部状态。
    this.hasError = error
    // 满足 `this.readReject` 时，共享工具执行该分支。
    if (this.readReject) {
      // reject读取`this.readReject`，供后续判断或组装使用。
      const reject = this.readReject
      // 更新实例字段 readResolve 为 undefined，同步共享工具的内部状态。
      this.readResolve = undefined
      // 更新实例字段 readReject 为 undefined，同步共享工具的内部状态。
      this.readReject = undefined
      // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      reject(error)
    }
  }

  // return 使用 无 完成共享工具里的对应操作。
  return(): Promise<IteratorResult<T, unknown>> {
    // 更新实例字段 isDone 为 true，同步共享工具的内部状态。
    this.isDone = true
    // 满足 `this.returned` 时，共享工具执行该分支。
    if (this.returned) {
      // 调用 this.returned，触发共享工具此处需要的副作用。
      this.returned()
    }
    // 返回 `Promise.resolve({ done: true, value: undefined })`，作为共享工具这次计算的结果。
    return Promise.resolve({ done: true, value: undefined })
  }
}
