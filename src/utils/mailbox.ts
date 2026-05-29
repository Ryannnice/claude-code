// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// MessageSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageSource = 'user' | 'teammate' | 'system' | 'tick' | 'task'

// Message 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Message = {
  id: string
  source: MessageSource
  content: string
  from?: string
  color?: string
  timestamp: string
}

// Waiter 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Waiter = {
  // 这个回调绑定到 fn: (msg: Message) => boolean，负责共享工具在该局部场景下的响应。
  fn: (msg: Message) => boolean
  // 这个回调绑定到 resolve: (msg: Message) => void，负责共享工具在该局部场景下的响应。
  resolve: (msg: Message) => void
}

// Mailbox 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class Mailbox {
  private queue: Message[] = []
  private waiters: Waiter[] = []
  private changed = createSignal()
  private _revision = 0

  // 共享工具 mailbox在这里处理 `get length(): number {`，完成这一小步状态转换。
  get length(): number {
    // 返回 `this.queue.length`，作为共享工具这次计算的结果。
    return this.queue.length
  }

  // 共享工具 mailbox在这里处理 `get revision(): number {`，完成这一小步状态转换。
  get revision(): number {
    // 返回 `this._revision`，作为共享工具这次计算的结果。
    return this._revision
  }

  // send 使用 msg: Message 完成共享工具里的对应操作。
  send(msg: Message): void {
    // 共享工具 mailbox在这里处理 `this._revision++`，完成这一小步状态转换。
    this._revision++
    // idx筛选`waiters.findIndex`，供共享工具后续处理使用。
    const idx = this.waiters.findIndex(w => w.fn(msg))
    // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (idx !== -1) {
      // waiter保存`waiters.splice`，供共享工具后续处理使用。
      const waiter = this.waiters.splice(idx, 1)[0]
      // 满足 `waiter` 时，共享工具执行该分支。
      if (waiter) {
        // waiter.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        waiter.resolve(msg)
        // 调用 this.notify，触发共享工具此处需要的副作用。
        this.notify()
        // 共享工具 mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
    // queue追加新条目，保持收集顺序与输入顺序一致。
    this.queue.push(msg)
    // 调用 this.notify，触发共享工具此处需要的副作用。
    this.notify()
  }

  // 调用 poll，触发共享工具此处需要的副作用。
  poll(fn: (msg: Message) => boolean = () => true): Message | undefined {
    // idx筛选`queue.findIndex`，供共享工具后续处理使用。
    const idx = this.queue.findIndex(fn)
    // 满足 `idx === -1` 时，共享工具执行该分支。
    if (idx === -1) return undefined
    // 返回 `this.queue.splice(idx, 1)[0]`，作为共享工具这次计算的结果。
    return this.queue.splice(idx, 1)[0]
  }

  // 调用 receive，触发共享工具此处需要的副作用。
  receive(fn: (msg: Message) => boolean = () => true): Promise<Message> {
    // idx筛选`queue.findIndex`，供共享工具后续处理使用。
    const idx = this.queue.findIndex(fn)
    // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (idx !== -1) {
      // 消息保存`queue.splice`，供共享工具后续处理使用。
      const msg = this.queue.splice(idx, 1)[0]
      // 满足 `msg` 时，共享工具执行该分支。
      if (msg) {
        // 调用 this.notify，触发共享工具此处需要的副作用。
        this.notify()
        // 返回 `Promise.resolve(msg)`，作为共享工具这次计算的结果。
        return Promise.resolve(msg)
      }
    }
    // 返回 `new Promise<Message>(resolve => {`，作为共享工具这次计算的结果。
    return new Promise<Message>(resolve => {
      // waiters 集合追加新条目，保持收集顺序与输入顺序一致。
      this.waiters.push({ fn, resolve })
    })
  }

  subscribe = this.changed.subscribe

  // 共享工具 mailbox在这里处理 `private notify(): void {`，完成这一小步状态转换。
  private notify(): void {
    // 调用 this.changed.emit，触发共享工具此处需要的副作用。
    this.changed.emit()
  }
}
