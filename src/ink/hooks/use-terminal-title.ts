// 引入 useContext、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useEffect } from 'react'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 引入 OSC、osc，将 ../termio/osc.js 中已经封装好的能力接到本文件流程里。
import { OSC, osc } from '../termio/osc.js'
// 引入 TerminalWriteContext，将 ../useTerminalNotification.js 中已经封装好的能力接到本文件流程里。
import { TerminalWriteContext } from '../useTerminalNotification.js'

/**
 * Declaratively set the terminal tab/window title.
 *
 * Pass a string to set the title. ANSI escape sequences are stripped
 * automatically so callers don't need to know about terminal encoding.
 * Pass `null` to opt out — the hook becomes a no-op and leaves the
 * terminal title untouched.
 *
 * On Windows, uses `process.title` (classic conhost doesn't support OSC).
 * Elsewhere, writes OSC 0 (set title+icon) via Ink's stdout.
 */
// useTerminalTitle 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTerminalTitle(title: string | null): void {
  // writeRaw保存`useContext`，供终端渲染后续处理使用。
  const writeRaw = useContext(TerminalWriteContext)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 只有 `title === null || !writeRaw` 满足时，终端渲染才执行该分支。
    if (title === null || !writeRaw) return

    // clean保存`stripAnsi`，供终端渲染后续处理使用。
    const clean = stripAnsi(title)

    // 当 `process.platform` 匹配 `'win32'` 时，终端渲染执行对应分支。
    if (process.platform === 'win32') {
      // title 标题更新为 `clean`，确保Ink 渲染层后续读取最新状态。
      process.title = clean
    } else {
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(osc(OSC.SET_TITLE_AND_ICON, clean))
    }
  }, [title, writeRaw])
}
