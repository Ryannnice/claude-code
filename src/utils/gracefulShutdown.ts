// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { writeSync } from 'fs'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 onExit，将 signal-exit 中已经封装好的能力接到本文件流程里。
import { onExit } from 'signal-exit'
// 类型依赖 { ExitReason } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { ExitReason } from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getIsInteractive,
  getIsScrollDraining,
  getLastMainRequestId,
  getSessionId,
  isSessionPersistenceDisabled,
} from '../bootstrap/state.js'
// 复用 instances 终端界面组件，避免在这里重复拼装显示逻辑。
import instances from '../ink/instances.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  DISABLE_KITTY_KEYBOARD,
  DISABLE_MODIFY_OTHER_KEYS,
} from '../ink/termio/csi.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  DBP,
  DFE,
  DISABLE_MOUSE_TRACKING,
  EXIT_ALT_SCREEN,
  SHOW_CURSOR,
} from '../ink/termio/dec.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CLEAR_ITERM2_PROGRESS,
  CLEAR_TAB_STATUS,
  CLEAR_TERMINAL_TITLE,
  supportsTabStatus,
  wrapForMultiplexer,
} from '../ink/termio/osc.js'
// 接入 shutdownDatadog 服务层能力，把外部通信或共享状态交给 ../services/analytics/datadog.js 处理。
import { shutdownDatadog } from '../services/analytics/datadog.js'
// 接入 shutdown1PEventLogging 服务层能力，把外部通信或共享状态交给 ../services/analytics/firstPartyEventLogger.js 处理。
import { shutdown1PEventLogging } from '../services/analytics/firstPartyEventLogger.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 引入 runCleanupFunctions，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { runCleanupFunctions } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getCurrentSessionTitle、sessionIdExists，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getCurrentSessionTitle, sessionIdExists } from './sessionStorage.js'
// 引入 sleep，将 ./sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from './sleep.js'
// 引入 profileReport，将 ./startupProfiler.js 中已经封装好的能力接到本文件流程里。
import { profileReport } from './startupProfiler.js'

/**
 * Clean up terminal modes synchronously before process exit.
 * This ensures terminal escape sequences (Kitty keyboard, focus reporting, etc.)
 * are properly disabled even if React's componentWillUnmount doesn't run in time.
 * Uses writeSync to ensure writes complete before exit.
 *
 * We unconditionally send all disable sequences because:
 * 1. Terminal detection may not always work correctly (e.g., in tmux, screen)
 * 2. These sequences are no-ops on terminals that don't support them
 * 3. Failing to disable leaves the terminal in a broken state
 */
/* eslint-disable custom-rules/no-sync-fs -- must be sync to flush before process.exit */
// cleanupTerminalModes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cleanupTerminalModes(): void {
  // process.stdout.isTTY缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.stdout.isTTY) {
    // 共享工具 graceful Shutdown在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Disable mouse tracking FIRST, before the React unmount tree-walk.
    // The terminal needs a round-trip to process this and stop sending
    // events; doing it now (not after unmount) gives that time while
    // we're busy unmounting. Otherwise events arrive during cooked-mode
    // cleanup and either echo to the screen or leak to the shell.
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, DISABLE_MOUSE_TRACKING)
    // Exit alt screen FIRST so printResumeHint() (and all sequences below)
    // land on the main buffer.
    //
    // Unmount Ink directly rather than writing EXIT_ALT_SCREEN ourselves.
    // Ink registered its unmount with signal-exit, so it will otherwise run
    // AGAIN inside forceExit() → process.exit(). Two problems with letting
    // that happen:
    //   1. If we write 1049l here and unmount writes it again later, the
    //      second one triggers another DECRC — the cursor jumps back over
    //      the resume hint and the shell prompt lands on the wrong line.
    //   2. unmount()'s onRender() must run with altScreenActive=true (alt-
    //      screen cursor math) AND on the alt buffer. Exiting alt-screen
    //      here first makes onRender() scribble a REPL frame onto main.
    // Calling unmount() now does the final render on the alt buffer,
    // unsubscribes from signal-exit, and writes 1049l exactly once.
    // inst读取`instances.get`，供共享工具后续处理使用。
    const inst = instances.get(process.stdout)
    // 满足 `inst?.isAltScreenActive` 时，共享工具执行该分支。
    if (inst?.isAltScreenActive) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 inst.unmount，触发共享工具此处需要的副作用。
        inst.unmount()
      } catch {
        // Reconciler/render threw — fall back to manual alt-screen exit
        // so printResumeHint still hits the main buffer.
        // 调用 writeSync，触发共享工具此处需要的副作用。
        writeSync(1, EXIT_ALT_SCREEN)
      }
    }
    // Catches events that arrived during the unmount tree-walk.
    // detachForShutdown() below also drains.
    // 调用 inst?.drainStdin()，完成这一处局部操作。
    inst?.drainStdin()
    // Mark the Ink instance unmounted so signal-exit's deferred ink.unmount()
    // early-returns instead of sending redundant EXIT_ALT_SCREEN sequences
    // (from its writeSync cleanup block + AlternateScreen's unmount cleanup).
    // Those redundant sequences land AFTER printResumeHint() and clobber the
    // resume hint on tmux (and possibly other terminals) by restoring the
    // saved cursor position. Safe to skip full unmount: this function already
    // sends all the terminal-reset sequences, and the process is exiting.
    // 调用 inst?.detachForShutdown()，完成这一处局部操作。
    inst?.detachForShutdown()
    // Disable extended key reporting — always send both since terminals
    // silently ignore whichever they don't implement
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, DISABLE_MODIFY_OTHER_KEYS)
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, DISABLE_KITTY_KEYBOARD)
    // Disable focus events (DECSET 1004)
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, DFE)
    // Disable bracketed paste mode
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, DBP)
    // Show cursor
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, SHOW_CURSOR)
    // Clear iTerm2 progress bar - prevents lingering progress indicator
    // that can cause bell sounds when returning to the terminal tab
    // 调用 writeSync，触发共享工具此处需要的副作用。
    writeSync(1, CLEAR_ITERM2_PROGRESS)
    // Clear tab status (OSC 21337) so a stale dot doesn't linger
    // 满足 `supportsTabStatus()) writeSync(1, wrapForMultiplexer(CLEAR_TAB_STATUS)` 时，共享工具执行该分支。
    if (supportsTabStatus()) writeSync(1, wrapForMultiplexer(CLEAR_TAB_STATUS))
    // Clear terminal title so the tab doesn't show stale session info.
    // Respect CLAUDE_CODE_DISABLE_TERMINAL_TITLE — if the user opted out of
    // title changes, don't clear their existing title on exit either.
    // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE)` 时，共享工具执行该分支。
    if (!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE)) {
      // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
      if (process.platform === 'win32') {
        // title 标题更新为 `''`，确保共享工具后续读取最新状态。
        process.title = ''
      } else {
        // 调用 writeSync，触发共享工具此处需要的副作用。
        writeSync(1, CLEAR_TERMINAL_TITLE)
      }
    }
  } catch {
    // Terminal may already be gone (e.g., SIGHUP after terminal close).
    // Ignore write errors since we're exiting anyway.
  }
}

// resumeHintPrinted标记共享工具 graceful Shutdown是否启用对应路径。
let resumeHintPrinted = false

/**
 * Print a hint about how to resume the session.
 * Only shown for interactive sessions with persistence enabled.
 */
// printResumeHint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function printResumeHint(): void {
  // Only print once (failsafe timer may call this again after normal shutdown)
  // 满足 `resumeHintPrinted` 时，共享工具执行该分支。
  if (resumeHintPrinted) {
    // 共享工具 graceful Shutdown在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Only show with TTY, interactive sessions, and persistence
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.stdout.isTTY &&
    getIsInteractive() &&
    !isSessionPersistenceDisabled()
  ) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
      const sessionId = getSessionId()
      // Don't show resume hint if no session file exists (e.g., subcommands like `claude update`)
      // 满足 `!sessionIdExists(sessionId)` 时，共享工具执行该分支。
      if (!sessionIdExists(sessionId)) {
        // 共享工具 graceful Shutdown在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // customTitle 标题读取`getCurrentSessionTitle`，供共享工具后续处理使用。
      const customTitle = getCurrentSessionTitle(sessionId)

      // Use custom title if available, otherwise fall back to session ID
      // resumeArg 先占位，稍后的条件分支会根据实际输入补齐它。
      let resumeArg: string
      // 满足 `customTitle` 时，共享工具执行该分支。
      if (customTitle) {
        // Wrap in double quotes, escape backslashes first then quotes
        // escaped格式化`customTitle.replace`，供共享工具后续处理使用。
        const escaped = customTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        // resumeArg更新为 ``"${escaped}"``，确保共享工具后续读取最新状态。
        resumeArg = `"${escaped}"`
      } else {
        // resumeArg更新为 `sessionId`，确保共享工具后续读取最新状态。
        resumeArg = sessionId
      }

      // writeSync执行共享工具在此处需要的副作用或外部交互。
      writeSync(
        1,
        chalk.dim(
          `\nResume this session with:\nclaude --resume ${resumeArg}\n`,
        ),
      )
      // resumeHintPrinted更新为 `true`，确保共享工具后续读取最新状态。
      resumeHintPrinted = true
    } catch {
      // Ignore write errors
    }
  }
}
/* eslint-enable custom-rules/no-sync-fs */

/**
 * Force process exit, handling the case where the terminal is gone.
 * When the terminal/PTY is closed (e.g., SIGHUP), process.exit() can throw
 * EIO errors because Bun tries to flush stdout to a dead file descriptor.
 * In that case, fall back to SIGKILL which always works.
 */
// forceExit 承担共享工具中的独立步骤，串起共享工具 graceful Shutdown需要的输入整理、状态更新和结果输出。
function forceExit(exitCode: number): never {
  // Clear failsafe timer since we're exiting now
  // `failsafeTimer` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (failsafeTimer !== undefined) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(failsafeTimer)
    // failsafeTimer更新为 `undefined`，确保共享工具后续读取最新状态。
    failsafeTimer = undefined
  }
  // Drain stdin LAST, right before exit. cleanupTerminalModes() sent
  // DISABLE_MOUSE_TRACKING early, but the terminal round-trip plus any
  // events already in flight means bytes can arrive during the seconds
  // of async cleanup between then and now. Draining here catches them.
  // Use the Ink class method (not the standalone drainStdin()) so we
  // drain the instance's stdin — when process.stdin is piped,
  // getStdinOverride() opens /dev/tty as the real input stream and the
  // class method knows about it; the standalone function defaults to
  // process.stdin which would early-return on isTTY=false.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 instances.get，触发共享工具此处需要的副作用。
    instances.get(process.stdout)?.drainStdin()
  } catch {
    // Terminal may be gone (SIGHUP). Ignore — we are about to exit.
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.exit，触发共享工具此处需要的副作用。
    process.exit(exitCode)
  } catch (e) {
    // process.exit() threw. In tests, it's mocked to throw - re-throw so test sees it.
    // In production, it's likely EIO from dead terminal - use SIGKILL.
    // 当 `(process.env.NODE_ENV as string)` 匹配 `'test'` 时，共享工具执行对应分支。
    if ((process.env.NODE_ENV as string) === 'test') {
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }
    // Fall back to SIGKILL which doesn't try to flush anything.
    // 调用 process.kill，触发共享工具此处需要的副作用。
    process.kill(process.pid, 'SIGKILL')
  }
  // In tests, process.exit may be mocked to return instead of exiting.
  // In production, we should never reach here.
  // `(process.env.NODE_ENV as string)` 与 `'test'` 不一致时刷新派生状态，避免使用过期结果。
  if ((process.env.NODE_ENV as string) !== 'test') {
    // 抛出 new Error('unreachable')，阻止共享工具在无效状态下继续运行。
    throw new Error('unreachable')
  }
  // TypeScript trick: cast to never since we know this only happens in tests
  // where the mock returns instead of exiting
  // 返回 `undefined as never`，作为共享工具这次计算的结果。
  return undefined as never
}

/**
 * Set up global signal handlers for graceful shutdown
 */
// setupGracefulShutdown保存`memoize`，供共享工具后续处理使用。
export const setupGracefulShutdown = memoize(() => {
  // Work around a Bun bug where process.removeListener(sig, fn) resets the
  // kernel sigaction for that signal even when other JS listeners remain —
  // the signal then falls back to its default action (terminate) and our
  // process.on('SIGTERM') handler never runs.
  //
  // Trigger: any short-lived signal-exit v4 subscriber (e.g. execa per child
  // process, or an Ink instance that unmounts). When its unsubscribe runs and
  // it was the last v4 subscriber, v4.unload() calls removeListener on every
  // signal in its list (SIGTERM, SIGINT, SIGHUP, …), tripping the Bun bug and
  // nuking our handlers at the kernel level.
  //
  // Fix: pin signal-exit v4 loaded by registering a no-op onExit callback that
  // is never unsubscribed. This keeps v4's internal emitter count > 0 so
  // unload() never runs and removeListener is never called. Harmless under
  // Node.js — the pin also ensures signal-exit's process.exit hook stays
  // active for Ink cleanup.
  // 调用 onExit，触发共享工具此处需要的副作用。
  onExit(() => {})

  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('SIGINT', () => {
    // In print mode, print.ts registers its own SIGINT handler that aborts
    // the in-flight query and calls gracefulShutdown(0); skip here to
    // avoid racing with it. Only check print mode — other non-interactive
    // sessions (--sdk-url, --init-only, non-TTY) don't register their own
    // SIGINT handler and need gracefulShutdown to run.
    // 只有 `process.argv.includes('-p') || process.argv.includes('--print')` 满足时，共享工具才执行该分支。
    if (process.argv.includes('-p') || process.argv.includes('--print')) {
      // 共享工具 graceful Shutdown在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'shutdown_signal', { signal: 'SIGINT' })
    // 显式忽略 `gracefulShutdown(0)` 的返回值，只保留它触发的副作用。
    void gracefulShutdown(0)
  })
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('SIGTERM', () => {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'shutdown_signal', { signal: 'SIGTERM' })
    // 显式忽略 `gracefulShutdown(143) // Exit code 143 (128 + 15) for SIGTERM` 的返回值，只保留它触发的副作用。
    void gracefulShutdown(143) // Exit code 143 (128 + 15) for SIGTERM
  })
  // `process.platform` 与 `'win32'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'win32') {
    // 调用 process.on，触发共享工具此处需要的副作用。
    process.on('SIGHUP', () => {
      // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
      logForDiagnosticsNoPII('info', 'shutdown_signal', { signal: 'SIGHUP' })
      // 显式忽略 `gracefulShutdown(129) // Exit code 129 (128 + 1) for SIGHUP` 的返回值，只保留它触发的副作用。
      void gracefulShutdown(129) // Exit code 129 (128 + 1) for SIGHUP
    })

    // Detect orphaned process when terminal closes without delivering SIGHUP.
    // macOS revokes TTY file descriptors instead of signaling, leaving the
    // process alive but unable to read/write. Periodically check stdin validity.
    // 满足 `process.stdin.isTTY` 时，共享工具执行该分支。
    if (process.stdin.isTTY) {
      // orphanCheckInterval更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
      orphanCheckInterval = setInterval(() => {
        // Skip during scroll drain — even a cheap check consumes an event
        // loop tick that scroll frames need. 30s interval → missing one is fine.
        // 满足 `getIsScrollDraining()` 时，共享工具执行该分支。
        if (getIsScrollDraining()) return
        // process.stdout.writable becomes false when the TTY is revoked
        // 只有 `!process.stdout.writable || !process.stdin.readab` 满足时，共享工具才执行该分支。
        if (!process.stdout.writable || !process.stdin.readable) {
          // 调用 clearInterval，触发共享工具此处需要的副作用。
          clearInterval(orphanCheckInterval)
          // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
          logForDiagnosticsNoPII('info', 'shutdown_signal', {
            signal: 'orphan_detected',
          })
          // 显式忽略 `gracefulShutdown(129)` 的返回值，只保留它触发的副作用。
          void gracefulShutdown(129)
        }
      }, 30_000) // Check every 30 seconds
      // 调用 orphanCheckInterval.unref，触发共享工具此处需要的副作用。
      orphanCheckInterval.unref() // Don't keep process alive just for this check
    }
  }

  // Log uncaught exceptions for container observability and analytics
  // Error names (e.g., "TypeError") are not sensitive - safe to log
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('uncaughtException', error => {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', 'uncaught_exception', {
      error_name: error.name,
      error_message: error.message.slice(0, 2000),
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_uncaught_exception', {
      error_name:
        error.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  })

  // Log unhandled promise rejections for container observability and analytics
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('unhandledRejection', reason => {
    // errorName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorName =
      reason instanceof Error
        ? reason.name
        : typeof reason === 'string'
          ? 'string'
          : 'unknown'
    // errorInfo 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorInfo =
      reason instanceof Error
        ? {
            error_name: reason.name,
            error_message: reason.message.slice(0, 2000),
            error_stack: reason.stack?.slice(0, 4000),
          }
        : { error_message: String(reason).slice(0, 2000) }
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', 'unhandled_rejection', errorInfo)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_unhandled_rejection', {
      error_name:
        errorName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  })
})

// gracefulShutdownSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function gracefulShutdownSync(
  exitCode = 0,
  reason: ExitReason = 'other',
  options?: {
    getAppState?: () => AppState
    // 这个回调绑定到 setAppState?: (f: (prev: AppState) => AppState) => void，负责共享工具在该局部场景下的响应。
    setAppState?: (f: (prev: AppState) => AppState) => void
  },
): void {
  // Set the exit code that will be used when process naturally exits. Note that we do it
  // here inside the sync version too so that it is possible to determine if
  // gracefulShutdownSync was called by checking process.exitCode.
  // 设置进程退出码为 `exitCode`，让外层 shell 感知共享工具运行失败。
  process.exitCode = exitCode

  // pendingShutdown更新为 `gracefulShutdown(exitCode, reason, options)`，确保共享工具后续读取最新状态。
  pendingShutdown = gracefulShutdown(exitCode, reason, options)
    // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
    .catch(error => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Graceful shutdown failed: ${error}`, { level: 'error' })
      // 调用 cleanupTerminalModes，触发共享工具此处需要的副作用。
      cleanupTerminalModes()
      // 调用 printResumeHint，触发共享工具此处需要的副作用。
      printResumeHint()
      // 调用 forceExit，触发共享工具此处需要的副作用。
      forceExit(exitCode)
    })
    // Prevent unhandled rejection: forceExit re-throws in test mode,
    // which would escape the .catch() handler above as a new rejection.
    // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
    .catch(() => {})
}

// shutdownInProgress 集合标记共享工具 graceful Shutdown是否启用对应路径。
let shutdownInProgress = false
// failsafeTimer 先占位，稍后的条件分支会根据实际输入补齐它。
let failsafeTimer: ReturnType<typeof setTimeout> | undefined
// orphanCheckInterval 先占位，稍后的条件分支会根据实际输入补齐它。
let orphanCheckInterval: ReturnType<typeof setInterval> | undefined
// pendingShutdown 先占位，稍后的条件分支会根据实际输入补齐它。
let pendingShutdown: Promise<void> | undefined

/** Check if graceful shutdown is in progress */
// isShuttingDown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isShuttingDown(): boolean {
  // 返回 `shutdownInProgress`，作为共享工具这次计算的结果。
  return shutdownInProgress
}

/** Reset shutdown state - only for use in tests */
// resetShutdownState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetShutdownState(): void {
  // shutdownInProgress 集合更新为 `false`，确保共享工具后续读取最新状态。
  shutdownInProgress = false
  // resumeHintPrinted更新为 `false`，确保共享工具后续读取最新状态。
  resumeHintPrinted = false
  // `failsafeTimer` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (failsafeTimer !== undefined) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(failsafeTimer)
    // failsafeTimer更新为 `undefined`，确保共享工具后续读取最新状态。
    failsafeTimer = undefined
  }
  // pendingShutdown更新为 `undefined`，确保共享工具后续读取最新状态。
  pendingShutdown = undefined
}

/**
 * Returns the in-flight shutdown promise, if any. Only for use in tests
 * to await completion before restoring mocks.
 */
// getPendingShutdownForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingShutdownForTesting(): Promise<void> | undefined {
  // 返回 `pendingShutdown`，作为共享工具这次计算的结果。
  return pendingShutdown
}

// Graceful shutdown function that drains the event loop
// gracefulShutdown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function gracefulShutdown(
  exitCode = 0,
  reason: ExitReason = 'other',
  options?: {
    getAppState?: () => AppState
    // 这个回调绑定到 setAppState?: (f: (prev: AppState) => AppState) => void，负责共享工具在该局部场景下的响应。
    setAppState?: (f: (prev: AppState) => AppState) => void
    /** Printed to stderr after alt-screen exit, before forceExit. */
    finalMessage?: string
  },
): Promise<void> {
  // 满足 `shutdownInProgress` 时，共享工具执行该分支。
  if (shutdownInProgress) {
    // 共享工具 graceful Shutdown在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // shutdownInProgress 集合更新为 `true`，确保共享工具后续读取最新状态。
  shutdownInProgress = true

  // Resolve the SessionEnd hook budget before arming the failsafe so the
  // failsafe can scale with it. Without this, a user-configured 10s hook
  // budget is silently truncated by the 5s failsafe (gh-32712 follow-up).
  // 从 `await import(` 解构 executeSessionEndHooks、getSessionEndHookTimeoutMs，减少共享工具 graceful Shutdown对同一对象的重复访问。
  const { executeSessionEndHooks, getSessionEndHookTimeoutMs } = await import(
    './hooks.js'
  )
  // sessionEndTimeoutMs 会话数据读取`getSessionEndHookTimeoutMs`，供共享工具后续处理使用。
  const sessionEndTimeoutMs = getSessionEndHookTimeoutMs()

  // Failsafe: guarantee process exits even if cleanup hangs (e.g., MCP connections).
  // Runs cleanupTerminalModes first so a hung cleanup doesn't leave the terminal dirty.
  // Budget = max(5s, hook budget + 3.5s headroom for cleanup + analytics flush).
  // failsafeTimer更新为 `setTimeout(`，确保共享工具后续读取最新状态。
  failsafeTimer = setTimeout(
    // code更新为 `> {`，确保共享工具后续读取最新状态。
    code => {
      // 调用 cleanupTerminalModes，触发共享工具此处需要的副作用。
      cleanupTerminalModes()
      // 调用 printResumeHint，触发共享工具此处需要的副作用。
      printResumeHint()
      // 调用 forceExit，触发共享工具此处需要的副作用。
      forceExit(code)
    },
    Math.max(5000, sessionEndTimeoutMs + 3500),
    exitCode,
  )
  // 调用 failsafeTimer.unref，触发共享工具此处需要的副作用。
  failsafeTimer.unref()

  // Set the exit code that will be used when process naturally exits
  // 设置进程退出码为 `exitCode`，让外层 shell 感知共享工具运行失败。
  process.exitCode = exitCode

  // Exit alt screen and print resume hint FIRST, before any async operations.
  // This ensures the hint is visible even if the process is killed during
  // cleanup (e.g., SIGKILL during macOS reboot). Without this, the resume
  // hint would only appear after cleanup functions, hooks, and analytics
  // flush — which can take several seconds.
  // 调用 cleanupTerminalModes，触发共享工具此处需要的副作用。
  cleanupTerminalModes()
  // 调用 printResumeHint，触发共享工具此处需要的副作用。
  printResumeHint()

  // Flush session data first — this is the most critical cleanup. If the
  // terminal is dead (SIGHUP, SSH disconnect), hooks and analytics may hang
  // on I/O to a dead TTY or unreachable network, eating into the
  // failsafe budget. Session persistence must complete before anything else.
  // cleanupTimeoutId 先占位，稍后的条件分支会根据实际输入补齐它。
  let cleanupTimeoutId: ReturnType<typeof setTimeout> | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // cleanupPromise 异步任务保存 `async` 启动的异步任务，稍后再决定等待还是后台完成。
    const cleanupPromise = (async () => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `runCleanupFunctions()` 完成，再继续共享工具 graceful Shutdown的异步流程。
        await runCleanupFunctions()
      } catch {
        // Silently ignore cleanup errors
      }
    })()

    // 等待 `Promise.race([` 完成，再继续共享工具 graceful Shutdown的异步流程。
    await Promise.race([
      cleanupPromise,
      // 这个回调绑定到 new Promise((_, reject) => {，负责共享工具在该局部场景下的响应。
      new Promise((_, reject) => {
        // cleanupTimeoutId更新为 `setTimeout(`，确保共享工具后续读取最新状态。
        cleanupTimeoutId = setTimeout(
          // rej更新为 `> rej(new CleanupTimeoutError())`，确保共享工具后续读取最新状态。
          rej => rej(new CleanupTimeoutError()),
          2000,
          reject,
        )
      }),
    ])
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(cleanupTimeoutId)
  } catch {
    // Silently handle timeout and other errors
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(cleanupTimeoutId)
  }

  // Execute SessionEnd hooks. Bound both the per-hook default timeout and the
  // overall execution via a single budget (CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS,
  // default 1.5s). hook.timeout in settings is respected up to this cap.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `executeSessionEndHooks(reason, {` 完成，再继续共享工具 graceful Shutdown的异步流程。
    await executeSessionEndHooks(reason, {
      ...options,
      signal: AbortSignal.timeout(sessionEndTimeoutMs),
      timeoutMs: sessionEndTimeoutMs,
    })
  } catch {
    // Ignore SessionEnd hook exceptions (including AbortError on timeout)
  }

  // Log startup perf before analytics shutdown flushes/cancels timers
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 profileReport，触发共享工具此处需要的副作用。
    profileReport()
  } catch {
    // Ignore profiling errors during shutdown
  }

  // Signal to inference that this session's cache can be evicted.
  // Fires before analytics flush so the event makes it to the pipeline.
  // lastRequestId 请求数据读取`getLastMainRequestId`，供共享工具后续处理使用。
  const lastRequestId = getLastMainRequestId()
  // 满足 `lastRequestId` 时，共享工具执行该分支。
  if (lastRequestId) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_cache_eviction_hint', {
      scope:
        'session_end' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_request_id:
        lastRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // Flush analytics — capped at 500ms. Previously unbounded: the 1P exporter
  // awaits all pending axios POSTs (10s each), eating the full failsafe budget.
  // Lost analytics on slow networks are acceptable; a hanging exit is not.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `Promise.race([` 完成，再继续共享工具 graceful Shutdown的异步流程。
    await Promise.race([
      Promise.all([shutdown1PEventLogging(), shutdownDatadog()]),
      sleep(500),
    ])
  } catch {
    // Ignore analytics shutdown errors
  }

  // 满足 `options?.finalMessage` 时，共享工具执行该分支。
  if (options?.finalMessage) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line custom-rules/no-sync-fs -- must flush before forceExit
      // 调用 writeSync，触发共享工具此处需要的副作用。
      writeSync(2, options.finalMessage + '\n')
    } catch {
      // stderr may be closed (e.g., SSH disconnect). Ignore write errors.
    }
  }

  // 调用 forceExit，触发共享工具此处需要的副作用。
  forceExit(exitCode)
}

// CleanupTimeoutError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class CleanupTimeoutError extends Error {
  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 调用 super，触发共享工具此处需要的副作用。
    super('Cleanup timeout')
  }
}
