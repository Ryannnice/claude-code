// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 withResolvers，将 ../withResolvers.js 中已经封装好的能力接到本文件流程里。
import { withResolvers } from '../withResolvers.js'
// 引入 requireComputerUseSwift，将 ./swiftLoader.js 中已经封装好的能力接到本文件流程里。
import { requireComputerUseSwift } from './swiftLoader.js'

/**
 * Shared CFRunLoop pump. Swift's four `@MainActor` async methods
 * (captureExcluding, captureRegion, apps.listInstalled, resolvePrepareCapture)
 * and `@ant/computer-use-input`'s key()/keys() all dispatch to
 * DispatchQueue.main. Under libuv (Node/bun) that queue never drains — the
 * promises hang. Electron drains it via CFRunLoop so Cowork doesn't need this.
 *
 * One refcounted setInterval calls `_drainMainRunLoop` (RunLoop.main.run)
 * every 1ms while any main-queue-dependent call is pending. Multiple
 * concurrent drainRunLoop() calls share the single pump via retain/release.
 */

// pump 先占位，稍后的条件分支会根据实际输入补齐它。
let pump: ReturnType<typeof setInterval> | undefined
// pending保存`0`，供共享工具 drain Run Loop后续判断或输出使用。
let pending = 0

// drainTick 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function drainTick(cu: ReturnType<typeof requireComputerUseSwift>): void {
  // 调用 cu._drainMainRunLoop，触发共享工具此处需要的副作用。
  cu._drainMainRunLoop()
}

// retain 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function retain(): void {
  // 共享工具 drain Run Loop在这里处理 `pending++`，完成这一小步状态转换。
  pending++
  // 满足 `pump === undefined` 时，共享工具执行该分支。
  if (pump === undefined) {
    // pump更新为 `setInterval(drainTick, 1, requireComputerUseSwift())`，确保共享工具后续读取最新状态。
    pump = setInterval(drainTick, 1, requireComputerUseSwift())
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[drainRunLoop] pump started', { level: 'verbose' })
  }
}

// release 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function release(): void {
  // 共享工具 drain Run Loop在这里处理 `pending--`，完成这一小步状态转换。
  pending--
  // `pending <= 0 && pump` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (pending <= 0 && pump !== undefined) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(pump)
    // pump更新为 `undefined`，确保共享工具后续读取最新状态。
    pump = undefined
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[drainRunLoop] pump stopped', { level: 'verbose' })
    // pending更新为 `0`，确保共享工具后续读取最新状态。
    pending = 0
  }
}

// TIMEOUT_MS 集合保存`30_000`，供后续判断或组装使用。
const TIMEOUT_MS = 30_000

// timeoutReject 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function timeoutReject(reject: (e: Error) => void): void {
  // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
  reject(new Error(`computer-use native call exceeded ${TIMEOUT_MS}ms`))
}

/**
 * Hold a pump reference for the lifetime of a long-lived registration
 * (e.g. the CGEventTap Escape handler). Unlike `drainRunLoop(fn)` this has
 * no timeout — the caller is responsible for calling `releasePump()`. Same
 * refcount as drainRunLoop calls, so nesting is safe.
 */
// retainPump保存`retain`，供后续判断或组装使用。
export const retainPump = retain
// releasePump 命名 `release`，让后续代码直接表达这个值的用途。
export const releasePump = release

/**
 * Await `fn()` with the shared drain pump running. Safe to nest — multiple
 * concurrent drainRunLoop() calls share one setInterval.
 */
// drainRunLoop 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function drainRunLoop<T>(fn: () => Promise<T>): Promise<T> {
  // 调用 retain，触发共享工具此处需要的副作用。
  retain()
  // timer 先占位，稍后的条件分支会根据实际输入补齐它。
  let timer: ReturnType<typeof setTimeout> | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // If the timeout wins the race, fn()'s promise is orphaned — a late
    // rejection from the native layer would become an unhandledRejection.
    // Attaching a no-op catch swallows it; the timeout error is what surfaces.
    // fn() sits inside try so a synchronous throw (e.g. NAPI argument
    // validation) still reaches release() — otherwise the pump leaks.
    // work保存`fn`，供共享工具后续处理使用。
    const work = fn()
    // 调用 work.catch，触发共享工具此处需要的副作用。
    work.catch(() => {})
    // timeout保存`withResolvers<never>()`，供后续判断或组装使用。
    const timeout = withResolvers<never>()
    // timer更新为 `setTimeout(timeoutReject, TIMEOUT_MS, timeout.reject)`，确保共享工具后续读取最新状态。
    timer = setTimeout(timeoutReject, TIMEOUT_MS, timeout.reject)
    // 等待并返回 `Promise.race([work, timeout.promise])`，调用方直接接收异步结果。
    return await Promise.race([work, timeout.promise])
  } finally {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(timer)
    // 调用 release，触发共享工具此处需要的副作用。
    release()
  }
}
