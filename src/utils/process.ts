// handleEPIPE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleEPIPE(
  stream: NodeJS.WriteStream,
): (err: NodeJS.ErrnoException) => void {
  // 返回 `(err: NodeJS.ErrnoException) => {`，作为共享工具这次计算的结果。
  return (err: NodeJS.ErrnoException) => {
    // 当 `err.code` 匹配 `'EPIPE'` 时，共享工具执行对应分支。
    if (err.code === 'EPIPE') {
      // 调用 stream.destroy，触发共享工具此处需要的副作用。
      stream.destroy()
    }
  }
}

// Prevents memory leak when pipe is broken (e.g., `claude -p | head -1`)
// registerProcessOutputErrorHandlers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerProcessOutputErrorHandlers(): void {
  // 调用 process.stdout.on，触发共享工具此处需要的副作用。
  process.stdout.on('error', handleEPIPE(process.stdout))
  // 调用 process.stderr.on，触发共享工具此处需要的副作用。
  process.stderr.on('error', handleEPIPE(process.stderr))
}

// writeOut 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeOut(stream: NodeJS.WriteStream, data: string): void {
  // 满足 `stream.destroyed` 时，共享工具执行该分支。
  if (stream.destroyed) {
    // 共享工具 process在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Note: we don't handle backpressure (write() returning false).
  //
  // We should consider handling the callback to ensure we wait for data to flush.
  // 调用 stream.write，触发共享工具此处需要的副作用。
  stream.write(data /* callback to handle here */)
}

// writeToStdout 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeToStdout(data: string): void {
  // 调用 writeOut，触发共享工具此处需要的副作用。
  writeOut(process.stdout, data)
}

// writeToStderr 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeToStderr(data: string): void {
  // 调用 writeOut，触发共享工具此处需要的副作用。
  writeOut(process.stderr, data)
}

// Write error to stderr and exit with code 1. Consolidates the
// console.error + process.exit(1) pattern used in entrypoint fast-paths.
// exitWithError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function exitWithError(message: string): never {
  // biome-ignore lint/suspicious/noConsole:: intentional console output
  // 调用 console.error，触发共享工具此处需要的副作用。
  console.error(message)
  // eslint-disable-next-line custom-rules/no-process-exit
  // 调用 process.exit，触发共享工具此处需要的副作用。
  process.exit(1)
}

// Wait for a stdin-like stream to close, but give up after ms if no data ever
// arrives. First data chunk cancels the timeout — after that, wait for end
// unconditionally (caller's accumulator needs all chunks, not just the first).
// Returns true on timeout, false on end. Used by -p mode to distinguish a
// real pipe producer from an inherited-but-idle parent stdin.
// peekForStdinData 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function peekForStdinData(
  stream: NodeJS.EventEmitter,
  ms: number,
): Promise<boolean> {
  // 返回 `new Promise<boolean>(resolve => {`，作为共享工具这次计算的结果。
  return new Promise<boolean>(resolve => {
    // done封装成回调，供共享工具 process在事件触发或异步步骤中调用。
    const done = (timedOut: boolean) => {
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(peek)
      // 调用 stream.off，触发共享工具此处需要的副作用。
      stream.off('end', onEnd)
      // 调用 stream.off，触发共享工具此处需要的副作用。
      stream.off('data', onFirstData)
      // 显式忽略 `resolve(timedOut)` 的返回值，只保留它触发的副作用。
      void resolve(timedOut)
    }
    // onEnd保存`done`，供共享工具后续处理使用。
    const onEnd = () => done(false)
    // onFirstData保存`clearTimeout`，供共享工具后续处理使用。
    const onFirstData = () => clearTimeout(peek)
    // eslint-disable-next-line no-restricted-syntax -- not a sleep: races timeout against stream end/data events
    // peek保存`setTimeout`，供共享工具后续处理使用。
    const peek = setTimeout(done, ms, true)
    // 调用 stream.once，触发共享工具此处需要的副作用。
    stream.once('end', onEnd)
    // 调用 stream.once，触发共享工具此处需要的副作用。
    stream.once('data', onFirstData)
  })
}
