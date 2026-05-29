// WriteFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WriteFn = (content: string) => void

// BufferedWriter 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BufferedWriter = {
  // 这个回调绑定到 write: (content: string) => void，负责共享工具在该局部场景下的响应。
  write: (content: string) => void
  // 这个回调绑定到 flush: () => void，负责共享工具在该局部场景下的响应。
  flush: () => void
  // 这个回调绑定到 dispose: () => void，负责共享工具在该局部场景下的响应。
  dispose: () => void
}

// createBufferedWriter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createBufferedWriter({
  writeFn,
  flushIntervalMs = 1000,
  maxBufferSize = 100,
  maxBufferBytes = Infinity,
  immediateMode = false,
}: {
  writeFn: WriteFn
  flushIntervalMs?: number
  maxBufferSize?: number
  maxBufferBytes?: number
  immediateMode?: boolean
}): BufferedWriter {
  // buffer 从空数组开始收集，后续循环会按处理顺序追加条目。
  let buffer: string[] = []
  // bufferBytes 集合保存`0`，供共享工具 buffered Writer后续判断或输出使用。
  let bufferBytes = 0
  // flushTimer 命名 `null`，让后续代码直接表达这个值的用途。
  let flushTimer: NodeJS.Timeout | null = null
  // Batch detached by overflow that hasn't been written yet. Tracked so
  // flush()/dispose() can drain it synchronously if the process exits
  // before the setImmediate fires.
  // pendingOverflow 命名 `null`，让后续代码直接表达这个值的用途。
  let pendingOverflow: string[] | null = null

  // clearTimer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function clearTimer(): void {
    // 满足 `flushTimer` 时，共享工具执行该分支。
    if (flushTimer) {
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(flushTimer)
      // flushTimer更新为 `null`，确保共享工具后续读取最新状态。
      flushTimer = null
    }
  }

  // flush 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function flush(): void {
    // 满足 `pendingOverflow` 时，共享工具执行该分支。
    if (pendingOverflow) {
      // 调用 writeFn，触发共享工具此处需要的副作用。
      writeFn(pendingOverflow.join(''))
      // pendingOverflow更新为 `null`，确保共享工具后续读取最新状态。
      pendingOverflow = null
    }
    // buffer为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (buffer.length === 0) return
    // 调用 writeFn，触发共享工具此处需要的副作用。
    writeFn(buffer.join(''))
    // buffer更新为 `[]`，确保共享工具后续读取最新状态。
    buffer = []
    // bufferBytes 集合更新为 `0`，确保共享工具后续读取最新状态。
    bufferBytes = 0
    // 调用 clearTimer，触发共享工具此处需要的副作用。
    clearTimer()
  }

  // scheduleFlush 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function scheduleFlush(): void {
    // flushTimer缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!flushTimer) {
      // flushTimer更新为 `setTimeout(flush, flushIntervalMs)`，确保共享工具后续读取最新状态。
      flushTimer = setTimeout(flush, flushIntervalMs)
    }
  }

  // Detach the buffer synchronously so the caller never waits on writeFn.
  // writeFn may block (e.g. errorLogSink.ts appendFileSync) — if overflow fires
  // mid-render or mid-keystroke, deferring the write keeps the current tick
  // short. Timer-based flushes already run outside user code paths so they
  // stay synchronous.
  // flushDeferred 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function flushDeferred(): void {
    // 满足 `pendingOverflow` 时，共享工具执行该分支。
    if (pendingOverflow) {
      // A previous overflow write is still queued. Coalesce into it to
      // preserve ordering — writes land in a single setImmediate-ordered batch.
      // pendingOverflow追加新条目，保持收集顺序与输入顺序一致。
      pendingOverflow.push(...buffer)
      // buffer更新为 `[]`，确保共享工具后续读取最新状态。
      buffer = []
      // bufferBytes 集合更新为 `0`，确保共享工具后续读取最新状态。
      bufferBytes = 0
      // 调用 clearTimer，触发共享工具此处需要的副作用。
      clearTimer()
      // 共享工具 buffered Writer在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // detached保存`buffer`，供后续判断或组装使用。
    const detached = buffer
    // buffer更新为 `[]`，确保共享工具后续读取最新状态。
    buffer = []
    // bufferBytes 集合更新为 `0`，确保共享工具后续读取最新状态。
    bufferBytes = 0
    // 调用 clearTimer，触发共享工具此处需要的副作用。
    clearTimer()
    // pendingOverflow更新为 `detached`，确保共享工具后续读取最新状态。
    pendingOverflow = detached
    // setImmediate 写入新的状态值，使共享工具后续读取保持一致。
    setImmediate(() => {
      // toWrite保存`pendingOverflow`，供共享工具 buffered Writer后续判断或输出使用。
      const toWrite = pendingOverflow
      // pendingOverflow更新为 `null`，确保共享工具后续读取最新状态。
      pendingOverflow = null
      // 满足 `toWrite) writeFn(toWrite.join('')` 时，共享工具执行该分支。
      if (toWrite) writeFn(toWrite.join(''))
    })
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // write 使用 content: string 完成共享工具里的对应操作。
    write(content: string): void {
      // 满足 `immediateMode` 时，共享工具执行该分支。
      if (immediateMode) {
        // 调用 writeFn，触发共享工具此处需要的副作用。
        writeFn(content)
        // 共享工具 buffered Writer在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // buffer追加新条目，保持收集顺序与输入顺序一致。
      buffer.push(content)
      // 共享工具 buffered Writer在这里处理 `bufferBytes += content.length`，完成这一小步状态转换。
      bufferBytes += content.length
      // 调用 scheduleFlush，触发共享工具此处需要的副作用。
      scheduleFlush()
      // 只有 `buffer.length >= maxBufferSize || bufferBytes >=` 满足时，共享工具才执行该分支。
      if (buffer.length >= maxBufferSize || bufferBytes >= maxBufferBytes) {
        // 调用 flushDeferred，触发共享工具此处需要的副作用。
        flushDeferred()
      }
    },
    flush,
    // dispose 使用 无 完成共享工具里的对应操作。
    dispose(): void {
      // 调用 flush，触发共享工具此处需要的副作用。
      flush()
    },
  }
}
