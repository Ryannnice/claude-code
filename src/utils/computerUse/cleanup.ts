// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../Tool.js'

// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 withResolvers，将 ../withResolvers.js 中已经封装好的能力接到本文件流程里。
import { withResolvers } from '../withResolvers.js'
// 引入 isLockHeldLocally、releaseComputerUseLock，将 ./computerUseLock.js 中已经封装好的能力接到本文件流程里。
import { isLockHeldLocally, releaseComputerUseLock } from './computerUseLock.js'
// 引入 unregisterEscHotkey，将 ./escHotkey.js 中已经封装好的能力接到本文件流程里。
import { unregisterEscHotkey } from './escHotkey.js'

// cu.apps.unhide is NOT one of the four @MainActor methods wrapped by
// drainRunLoop's 30s backstop. On abort paths (where the user hit Ctrl+C
// because something was slow) a hang here would wedge the abort. Generous
// timeout — unhide should be ~instant; if it takes 5s something is wrong
// and proceeding is better than waiting. The Swift call continues in the
// background regardless; we just stop blocking on it.
// UNHIDE_TIMEOUT_MS 集合保存`5000`，供后续判断或组装使用。
const UNHIDE_TIMEOUT_MS = 5000

/**
 * Turn-end cleanup for the chicago MCP surface: auto-unhide apps that
 * `prepareForAction` hid, then release the file-based lock.
 *
 * Called from three sites: natural turn end (`stopHooks.ts`), abort during
 * streaming (`query.ts` aborted_streaming), abort during tool execution
 * (`query.ts` aborted_tools). All three reach this via dynamic import gated
 * on `feature('CHICAGO_MCP')`. `executor.js` (which pulls both native
 * modules) is dynamic-imported below so non-CU turns don't load native
 * modules just to no-op.
 *
 * No-ops cheaply on non-CU turns: both gate checks are zero-syscall.
 */
// cleanupComputerUseAfterTurn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupComputerUseAfterTurn(
  ctx: Pick<
    ToolUseContext,
    'getAppState' | 'setAppState' | 'sendOSNotification'
  >,
): Promise<void> {
  // appState 状态读取`ctx.getAppState`，供共享工具后续处理使用。
  const appState = ctx.getAppState()

  // hidden保存`appState.computerUseMcpState?.hiddenDuringTurn`，供后续判断或组装使用。
  const hidden = appState.computerUseMcpState?.hiddenDuringTurn
  // 只有 `hidden && hidden.size > 0` 满足时，共享工具才执行该分支。
  if (hidden && hidden.size > 0) {
    // 从 `await import('./executor.js')` 解构 unhideComputerUseApps，减少共享工具 cleanup对同一对象的重复访问。
    const { unhideComputerUseApps } = await import('./executor.js')
    // unhide保存`unhideComputerUseApps`，供共享工具后续处理使用。
    const unhide = unhideComputerUseApps([...hidden]).catch(err =>
      logForDebugging(
        `[Computer Use MCP] auto-unhide failed: ${errorMessage(err)}`,
      ),
    )
    // timeout保存`withResolvers<void>()`，供后续判断或组装使用。
    const timeout = withResolvers<void>()
    // timer保存`setTimeout`，供共享工具后续处理使用。
    const timer = setTimeout(timeout.resolve, UNHIDE_TIMEOUT_MS)
    // 这个回调绑定到 await Promise.race([unhide, timeout.promise]).finally(() =>，负责共享工具在该局部场景下的响应。
    await Promise.race([unhide, timeout.promise]).finally(() =>
      clearTimeout(timer),
    )
    // ctx.setAppState 写入新的状态值，使共享工具后续读取保持一致。
    ctx.setAppState(prev =>
      prev.computerUseMcpState?.hiddenDuringTurn === undefined
        ? prev
        : {
            ...prev,
            computerUseMcpState: {
              ...prev.computerUseMcpState,
              hiddenDuringTurn: undefined,
            },
          },
    )
  }

  // Zero-syscall pre-check so non-CU turns don't touch disk. Release is still
  // idempotent (returns false if already released or owned by another session).
  // 满足 `!isLockHeldLocally()` 时，共享工具执行该分支。
  if (!isLockHeldLocally()) return

  // Unregister before lock release so the pump-retain drops as soon as the
  // CU session ends. Idempotent — no-ops if registration failed at acquire.
  // Swallow throws so a NAPI unregister error never prevents lock release —
  // a held lock blocks the next CU session with "in use by another session".
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 unregisterEscHotkey，触发共享工具此处需要的副作用。
    unregisterEscHotkey()
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Computer Use MCP] unregisterEscHotkey failed: ${errorMessage(err)}`,
    )
  }

  // 满足 `await releaseComputerUseLock()` 时，共享工具执行该分支。
  if (await releaseComputerUseLock()) {
    // 调用 ctx.sendOSNotification?.({，完成这一处局部操作。
    ctx.sendOSNotification?.({
      message: 'Claude is done using your computer',
      notificationType: 'computer_use_exit',
    })
  }
}
