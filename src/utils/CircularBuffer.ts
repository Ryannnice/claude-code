/**
 * A fixed-size circular buffer that automatically evicts the oldest items
 * when the buffer is full. Useful for maintaining a rolling window of data.
 */
// CircularBuffer 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class CircularBuffer<T> {
  private buffer: T[]
  private head = 0
  private size = 0

  // 构造函数接收 private capacity: number，把外部输入整理成实例可复用的内部状态。
  constructor(private capacity: number) {
    // 更新实例字段 buffer 为 new Array(capacity)，同步共享工具的内部状态。
    this.buffer = new Array(capacity)
  }

  /**
   * Add an item to the buffer. If the buffer is full,
   * the oldest item will be evicted.
   */
  // add 使用 item: T 完成共享工具里的对应操作。
  add(item: T): void {
    // head更新为 `item`，确保共享工具 Circular Buffer后续读取最新状态。
    this.buffer[this.head] = item
    // 更新实例字段 head 为 (this.head + 1) % this.capacity，同步共享工具的内部状态。
    this.head = (this.head + 1) % this.capacity
    // 满足 `this.size < this.capacity` 时，共享工具执行该分支。
    if (this.size < this.capacity) {
      // 共享工具 Circular Buffer在这里处理 `this.size++`，完成这一小步状态转换。
      this.size++
    }
  }

  /**
   * Add multiple items to the buffer at once.
   */
  // addAll 使用 items: T[] 完成共享工具里的对应操作。
  addAll(items: T[]): void {
    // 按顺序遍历 `items` 中的item，逐个交给共享工具处理。
    for (const item of items) {
      // 调用 this.add，触发共享工具此处需要的副作用。
      this.add(item)
    }
  }

  /**
   * Get the most recent N items from the buffer.
   * Returns fewer items if the buffer contains less than N items.
   */
  // getRecent 根据 count: number 读取或计算共享工具需要的结果。
  getRecent(count: number): T[] {
    // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const result: T[] = []
    // start 命名 `this.size < this.capacity ? 0 : this.head`，让后续代码直接表达这个值的用途。
    const start = this.size < this.capacity ? 0 : this.head
    // available保存`Math.min`，供共享工具后续处理使用。
    const available = Math.min(count, this.size)

    // 按索引扫描 `available`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < available; i++) {
      // index 索引 命名 `(start + this.size - available + i) % this.capacity`，让后续代码直接表达这个值的用途。
      const index = (start + this.size - available + i) % this.capacity
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(this.buffer[index]!)
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  /**
   * Get all items currently in the buffer, in order from oldest to newest.
   */
  // toArray 使用 无 完成共享工具里的对应操作。
  toArray(): T[] {
    // 满足 `this.size === 0` 时，共享工具执行该分支。
    if (this.size === 0) return []

    // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const result: T[] = []
    // start 命名 `this.size < this.capacity ? 0 : this.head`，让后续代码直接表达这个值的用途。
    const start = this.size < this.capacity ? 0 : this.head

    // 按索引扫描 `this.size`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < this.size; i++) {
      // index 索引保存`(start + i) % this.capacity`，供后续判断或组装使用。
      const index = (start + i) % this.capacity
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(this.buffer[index]!)
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  /**
   * Clear all items from the buffer.
   */
  // clear 使用 无 完成共享工具里的对应操作。
  clear(): void {
    // this.buffer被清空，共享工具从干净状态继续。
    this.buffer.length = 0
    // 更新实例字段 head 为 0，同步共享工具的内部状态。
    this.head = 0
    // 更新实例字段 size 为 0，同步共享工具的内部状态。
    this.size = 0
  }

  /**
   * Get the current number of items in the buffer.
   */
  // length 使用 无 完成共享工具里的对应操作。
  length(): number {
    // 返回 `this.size`，作为共享工具这次计算的结果。
    return this.size
  }
}
