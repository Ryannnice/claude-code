// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 releasePump、retainPump，将 ./drainRunLoop.js 中已经封装好的能力接到本文件流程里。
import { releasePump, retainPump } from './drainRunLoop.js'
// 引入 requireComputerUseSwift，将 ./swiftLoader.js 中已经封装好的能力接到本文件流程里。
import { requireComputerUseSwift } from './swiftLoader.js'

/**
 * Global Escape → abort. Mirrors Cowork's `escAbort.ts` but without Electron:
 * CGEventTap via `@ant/computer-use-swift`. While registered, Escape is
 * consumed system-wide (PI defense — a prompt-injected action can't dismiss
 * a dialog with Escape).
 *
 * Lifecycle: register on fresh lock acquire (`wrapper.tsx` `acquireCuLock`),
 * unregister on lock release (`cleanup.ts`). The tap's CFRunLoopSource sits
 * in .defaultMode on CFRunLoopGetMain(), so we hold a drainRunLoop pump
 * retain for the registration's lifetime — same refcounted setInterval as
 * the `@MainActor` methods.
 *
 * `notifyExpectedEscape()` punches a hole for model-synthesized Escapes: the
 * executor's `key("escape")` calls it before posting the CGEvent. Swift
 * schedules a 100ms decay so a CGEvent that never reaches the tap callback
 * doesn't eat the next user ESC.
 */

// registered标记共享工具 esc Hotkey是否启用对应路径。
let registered = false

// registerEscHotkey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerEscHotkey(onEscape: () => void): boolean {
  // 满足 `registered` 时，共享工具执行该分支。
  if (registered) return true
  // cu保存`requireComputerUseSwift`，供共享工具后续处理使用。
  const cu = requireComputerUseSwift()
  // 满足 `!cu.hotkey.registerEscape(onEscape)` 时，共享工具执行该分支。
  if (!cu.hotkey.registerEscape(onEscape)) {
    // CGEvent.tapCreate failed — typically missing Accessibility permission.
    // CU still works, just without ESC abort. Mirrors Cowork's escAbort.ts:81.
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[cu-esc] registerEscape returned false', { level: 'warn' })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 调用 retainPump，触发共享工具此处需要的副作用。
  retainPump()
  // registered更新为 `true`，确保共享工具后续读取最新状态。
  registered = true
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[cu-esc] registered')
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// unregisterEscHotkey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterEscHotkey(): void {
  // registered缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!registered) return
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 requireComputerUseSwift，触发共享工具此处需要的副作用。
    requireComputerUseSwift().hotkey.unregister()
  } finally {
    // 调用 releasePump，触发共享工具此处需要的副作用。
    releasePump()
    // registered更新为 `false`，确保共享工具后续读取最新状态。
    registered = false
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[cu-esc] unregistered')
  }
}

// notifyExpectedEscape 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyExpectedEscape(): void {
  // registered缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!registered) return
  // 调用 requireComputerUseSwift，触发共享工具此处需要的副作用。
  requireComputerUseSwift().hotkey.notifyExpectedEscape()
}
