// 引入 createContext，将 react 中已经封装好的能力接到本文件流程里。
import { createContext } from 'react'
// 引入 EventEmitter，将 ../events/emitter.js 中已经封装好的能力接到本文件流程里。
import { EventEmitter } from '../events/emitter.js'
// 类型依赖 { TerminalQuerier } 来自 ../terminal-querier.js，用于校准终端渲染的数据契约。
import type { TerminalQuerier } from '../terminal-querier.js'

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  /**
   * Stdin stream passed to `render()` in `options.stdin` or `process.stdin` by default. Useful if your app needs to handle user input.
   */
  readonly stdin: NodeJS.ReadStream

  /**
   * Ink exposes this function via own `<StdinContext>` to be able to handle Ctrl+C, that's why you should use Ink's `setRawMode` instead of `process.stdin.setRawMode`.
   * If the `stdin` stream passed to Ink does not support setRawMode, this function does nothing.
   */
  // 这个回调绑定到 readonly setRawMode: (value: boolean) => void，负责终端渲染在该局部场景下的响应。
  readonly setRawMode: (value: boolean) => void

  /**
   * A boolean flag determining if the current `stdin` supports `setRawMode`. A component using `setRawMode` might want to use `isRawModeSupported` to nicely fall back in environments where raw mode is not supported.
   */
  readonly isRawModeSupported: boolean

  readonly internal_exitOnCtrlC: boolean

  readonly internal_eventEmitter: EventEmitter

  /** Query the terminal and await responses (DECRQM, OSC 11, etc.).
   *  Null only in the never-reached default context value. */
  readonly internal_querier: TerminalQuerier | null
}

/**
 * `StdinContext` is a React context, which exposes input stream.
 */

// StdinContext构建`createContext<Props>({` 整理出中间结果，供终端 UI Stdin Context后续步骤使用。
const StdinContext = createContext<Props>({
  stdin: process.stdin,

  internal_eventEmitter: new EventEmitter(),
  // setRawMode 根据 无 更新终端渲染的状态。
  setRawMode() {},
  isRawModeSupported: false,

  internal_exitOnCtrlC: true,
  internal_querier: null,
})

// eslint-disable-next-line custom-rules/no-top-level-side-effects
// displayName更新为 `'InternalStdinContext'`，确保终端 UI后续读取最新状态。
StdinContext.displayName = 'InternalStdinContext'

export default StdinContext
