// 引入 EventEmitter as NodeEventEmitter，将 events 中已经封装好的能力接到本文件流程里。
import { EventEmitter as NodeEventEmitter } from 'events'
// 引入 Event，将 ./event.js 中已经封装好的能力接到本文件流程里。
import { Event } from './event.js'

// Similar to node's builtin EventEmitter, but is also aware of our `Event`
// class, and so `emit` respects `stopImmediatePropagation()`.
// EventEmitter 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class EventEmitter extends NodeEventEmitter {
  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 调用 super，触发终端渲染此处需要的副作用。
    super()
    // Disable the default maxListeners warning. In React, many components
    // can legitimately listen to the same event (e.g., useInput hooks).
    // The default limit of 10 causes spurious warnings.
    // this.setMaxListeners 写入新的状态值，使终端渲染后续读取保持一致。
    this.setMaxListeners(0)
  }

  // Ink 渲染层 emitter在这里处理 `override emit(type: string | symbol, ...args: unknown[]): boolean {`，完成这一小步状态转换。
  override emit(type: string | symbol, ...args: unknown[]): boolean {
    // Delegate to node for `error`, since it's not treated like a normal event
    // 当 `type` 匹配 `'error'` 时，终端渲染执行对应分支。
    if (type === 'error') {
      // 返回 `super.emit(type, ...args)`，作为终端渲染这次计算的结果。
      return super.emit(type, ...args)
    }

    // listeners 集合保存`this.rawListeners`，供终端渲染后续处理使用。
    const listeners = this.rawListeners(type)

    // listeners 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (listeners.length === 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // ccEvent保存`args[0] instanceof Event ? args[0] : null`，供Ink 渲染层 emitter后续判断或输出使用。
    const ccEvent = args[0] instanceof Event ? args[0] : null

    // 按顺序遍历 `listeners` 中的listener 集合，逐个交给终端渲染处理。
    for (const listener of listeners) {
      // 调用 listener.apply，触发终端渲染此处需要的副作用。
      listener.apply(this, args)

      // 满足 `ccEvent?.didStopImmediatePropagation()` 时，终端渲染执行该分支。
      if (ccEvent?.didStopImmediatePropagation()) {
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      }
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
}
