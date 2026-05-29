/**
 * Shared capacity-wake primitive for bridge poll loops.
 *
 * Both replBridge.ts and bridgeMain.ts need to sleep while "at capacity"
 * but wake early when either (a) the outer loop signal aborts (shutdown),
 * or (b) capacity frees up (session done / transport lost). This module
 * encapsulates the mutable wake-controller + two-signal merger that both
 * poll loops previously duplicated byte-for-byte.
 */

// CapacitySignal 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type CapacitySignal = { signal: AbortSignal; cleanup: () => void }

// CapacityWake 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type CapacityWake = {
  /**
   * Create a signal that aborts when either the outer loop signal or the
   * capacity-wake controller fires. Returns the merged signal and a cleanup
   * function that removes listeners when the sleep resolves normally
   * (without abort).
   */
  // signal 使用 无 完成远程桥接会话里的对应操作。
  signal(): CapacitySignal
  /**
   * Abort the current at-capacity sleep and arm a fresh controller so the
   * poll loop immediately re-checks for new work.
   */
  // wake 使用 无 完成远程桥接会话里的对应操作。
  wake(): void
}

// createCapacityWake 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCapacityWake(outerSignal: AbortSignal): CapacityWake {
  // wakeController保存`AbortController`，供远程桥接会话后续处理使用。
  let wakeController = new AbortController()

  // wake 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function wake(): void {
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    wakeController.abort()
    // wakeController更新为 `new AbortController()`，确保Bridge 通信后续读取最新状态。
    wakeController = new AbortController()
  }

  // signal 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function signal(): CapacitySignal {
    // merged保存`AbortController`，供远程桥接会话后续处理使用。
    const merged = new AbortController()
    // abort保存`merged.abort`，供远程桥接会话后续处理使用。
    const abort = (): void => merged.abort()
    // 组合条件 `outerSignal.aborted || wakeController.signal.abor` 成立时，远程桥接会话才启用这条专门路径。
    if (outerSignal.aborted || wakeController.signal.aborted) {
      // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
      merged.abort()
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { signal: merged.signal, cleanup: () => {} }
    }
    // 调用 outerSignal.addEventListener，触发远程桥接会话此处需要的副作用。
    outerSignal.addEventListener('abort', abort, { once: true })
    // capSig保存`wakeController.signal`，供后续判断或组装使用。
    const capSig = wakeController.signal
    // 调用 capSig.addEventListener，触发远程桥接会话此处需要的副作用。
    capSig.addEventListener('abort', abort, { once: true })
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return {
      signal: merged.signal,
      // 这个回调绑定到 cleanup: () => {，负责远程桥接会话在该局部场景下的响应。
      cleanup: () => {
        // 调用 outerSignal.removeEventListener，触发远程桥接会话此处需要的副作用。
        outerSignal.removeEventListener('abort', abort)
        // 调用 capSig.removeEventListener，触发远程桥接会话此处需要的副作用。
        capSig.removeEventListener('abort', abort)
      },
    }
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return { signal, wake }
}
