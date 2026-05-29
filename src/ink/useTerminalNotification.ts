// 引入 createContext、useCallback、useContext、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { createContext, useCallback, useContext, useMemo } from 'react'
// 引入 isProgressReportingAvailable、Progress，将 ./terminal.js 中已经封装好的能力接到本文件流程里。
import { isProgressReportingAvailable, type Progress } from './terminal.js'
// 引入 BEL，将 ./termio/ansi.js 中已经封装好的能力接到本文件流程里。
import { BEL } from './termio/ansi.js'
// 引入 ITERM2、OSC、osc、PROGRESS、wrapForMultiplexer，将 ./termio/osc.js 中已经封装好的能力接到本文件流程里。
import { ITERM2, OSC, osc, PROGRESS, wrapForMultiplexer } from './termio/osc.js'

// WriteRaw 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WriteRaw = (data: string) => void

// TerminalWriteContext 命名 `createContext<WriteRaw | null>(null)`，让后续代码直接表达这个值的用途。
export const TerminalWriteContext = createContext<WriteRaw | null>(null)

// TerminalWriteProvider 命名 `TerminalWriteContext.Provider`，让后续代码直接表达这个值的用途。
export const TerminalWriteProvider = TerminalWriteContext.Provider

// TerminalNotification 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalNotification = {
  notifyITerm2: (opts: { message: string; title?: string }) => void
  notifyKitty: (opts: { message: string; title: string; id: number }) => void
  // 这个回调绑定到 notifyGhostty: (opts: { message: string; title: string }) => void，负责终端渲染在该局部场景下的响应。
  notifyGhostty: (opts: { message: string; title: string }) => void
  // 这个回调绑定到 notifyBell: () => void，负责终端渲染在该局部场景下的响应。
  notifyBell: () => void
  /**
   * Report progress to the terminal via OSC 9;4 sequences.
   * Supported terminals: ConEmu, Ghostty 1.2.0+, iTerm2 3.6.6+
   * Pass state=null to clear progress.
   */
  // 这个回调绑定到 progress: (state: Progress['state'] | null, percentage?: number) => void，负责终端渲染在该局部场景下的响应。
  progress: (state: Progress['state'] | null, percentage?: number) => void
}

// useTerminalNotification 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTerminalNotification(): TerminalNotification {
  // writeRaw保存`useContext`，供终端渲染后续处理使用。
  const writeRaw = useContext(TerminalWriteContext)
  // writeRaw缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!writeRaw) {
    // 抛出 new Error(，阻止终端渲染在无效状态下继续运行。
    throw new Error(
      'useTerminalNotification must be used within TerminalWriteProvider',
    )
  }

  // notifyITerm2保存`useCallback`，供终端渲染后续处理使用。
  const notifyITerm2 = useCallback(
    ({ message, title }: { message: string; title?: string }) => {
      // displayString保存`title ? `${title}:\n${message}` : message`，供Ink 渲染层 use Terminal Notifica...后续判断或输出使用。
      const displayString = title ? `${title}:\n${message}` : message
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(wrapForMultiplexer(osc(OSC.ITERM2, `\n\n${displayString}`)))
    },
    [writeRaw],
  )

  // notifyKitty保存`useCallback`，供终端渲染后续处理使用。
  const notifyKitty = useCallback(
    ({
      message,
      title,
      id,
    }: {
      message: string
      title: string
      id: number
    }) => {
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(wrapForMultiplexer(osc(OSC.KITTY, `i=${id}:d=0:p=title`, title)))
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(wrapForMultiplexer(osc(OSC.KITTY, `i=${id}:p=body`, message)))
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(wrapForMultiplexer(osc(OSC.KITTY, `i=${id}:d=1:a=focus`, '')))
    },
    [writeRaw],
  )

  // notifyGhostty保存`useCallback`，供终端渲染后续处理使用。
  const notifyGhostty = useCallback(
    ({ message, title }: { message: string; title: string }) => {
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(wrapForMultiplexer(osc(OSC.GHOSTTY, 'notify', title, message)))
    },
    [writeRaw],
  )

  // notifyBell保存`useCallback`，供终端渲染后续处理使用。
  const notifyBell = useCallback(() => {
    // Raw BEL — inside tmux this triggers tmux's bell-action (window flag).
    // Wrapping would make it opaque DCS payload and lose that fallback.
    // 调用 writeRaw，触发终端渲染此处需要的副作用。
    writeRaw(BEL)
  }, [writeRaw])

  // progress 集合保存`useCallback`，供终端渲染后续处理使用。
  const progress = useCallback(
    (state: Progress['state'] | null, percentage?: number) => {
      // 满足 `!isProgressReportingAvailable()` 时，终端渲染执行该分支。
      if (!isProgressReportingAvailable()) {
        // Ink 渲染层 use Terminal Notification在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 状态缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!state) {
        // 调用 writeRaw，触发终端渲染此处需要的副作用。
        writeRaw(
          wrapForMultiplexer(
            osc(OSC.ITERM2, ITERM2.PROGRESS, PROGRESS.CLEAR, ''),
          ),
        )
        // Ink 渲染层 use Terminal Notification在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // pct保存`Math.max`，供终端渲染后续处理使用。
      const pct = Math.max(0, Math.min(100, Math.round(percentage ?? 0)))
      // 按照 state 的取值选择终端渲染的具体处理分支。
      switch (state) {
        case 'completed':
          // 调用 writeRaw，触发终端渲染此处需要的副作用。
          writeRaw(
            wrapForMultiplexer(
              osc(OSC.ITERM2, ITERM2.PROGRESS, PROGRESS.CLEAR, ''),
            ),
          )
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        case 'error':
          // 调用 writeRaw，触发终端渲染此处需要的副作用。
          writeRaw(
            wrapForMultiplexer(
              osc(OSC.ITERM2, ITERM2.PROGRESS, PROGRESS.ERROR, pct),
            ),
          )
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        case 'indeterminate':
          // 调用 writeRaw，触发终端渲染此处需要的副作用。
          writeRaw(
            wrapForMultiplexer(
              osc(OSC.ITERM2, ITERM2.PROGRESS, PROGRESS.INDETERMINATE, ''),
            ),
          )
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        case 'running':
          // 调用 writeRaw，触发终端渲染此处需要的副作用。
          writeRaw(
            wrapForMultiplexer(
              osc(OSC.ITERM2, ITERM2.PROGRESS, PROGRESS.SET, pct),
            ),
          )
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        case null:
          // Handled by the if guard above
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
      }
    },
    [writeRaw],
  )

  // 返回 `useMemo(`，作为终端渲染这次计算的结果。
  return useMemo(
    // 这个回调绑定到 () => ({ notifyITerm2, notifyKitty, notifyGhostty, notifyBell, progress }),，负责终端渲染在该局部场景下的响应。
    () => ({ notifyITerm2, notifyKitty, notifyGhostty, notifyBell, progress }),
    [notifyITerm2, notifyKitty, notifyGhostty, notifyBell, progress],
  )
}
