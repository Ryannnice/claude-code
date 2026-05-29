// 引入 useEffect、useLayoutEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useLayoutEffect } from 'react'
// 引入 useEventCallback，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useEventCallback } from 'usehooks-ts'
// 类型依赖 { InputEvent, Key } 来自 ../events/input-event.js，用于校准终端渲染的数据契约。
import type { InputEvent, Key } from '../events/input-event.js'
// 引入 useStdin，将 ./use-stdin.js 中已经封装好的能力接到本文件流程里。
import useStdin from './use-stdin.js'

// Handler 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Handler = (input: string, key: Key, event: InputEvent) => void

// Options 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Options = {
  /**
   * Enable or disable capturing of user input.
   * Useful when there are multiple useInput hooks used at once to avoid handling the same input several times.
   *
   * @default true
   */
  isActive?: boolean
}

/**
 * This hook is used for handling user input.
 * It's a more convenient alternative to using `StdinContext` and listening to `data` events.
 * The callback you pass to `useInput` is called for each character when user enters any input.
 * However, if user pastes text and it's more than one character, the callback will be called only once and the whole string will be passed as `input`.
 *
 * ```
 * import {useInput} from 'ink';
 *
 * const UserInput = () => {
 *   useInput((input, key) => {
 *     if (input === 'q') {
 *       // Exit program
 *     }
 *
 *     if (key.leftArrow) {
 *       // Left arrow key pressed
 *     }
 *   });
 *
 *   return …
 * };
 * ```
 */
// useInput封装成回调，供Ink 渲染层 use input在事件触发或异步步骤中调用。
const useInput = (inputHandler: Handler, options: Options = {}) => {
  // 从 `useStdin()` 解构 setRawMode、internal_exitOnCtrlC、internal_eventEmitter，减少Ink 渲染层 use input对同一对象的重复访问。
  const { setRawMode, internal_exitOnCtrlC, internal_eventEmitter } = useStdin()

  // useLayoutEffect (not useEffect) so that raw mode is enabled synchronously
  // during React's commit phase, before render() returns. With useEffect, raw
  // mode setup is deferred to the next event loop tick via React's scheduler,
  // leaving the terminal in cooked mode — keystrokes echo and the cursor is
  // visible until the effect fires.
  // 调用 useLayoutEffect，触发终端渲染此处需要的副作用。
  useLayoutEffect(() => {
    // 满足 `options.isActive === false` 时，终端渲染执行该分支。
    if (options.isActive === false) {
      // Ink 渲染层 use input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // setRawMode 写入新的状态值，使终端渲染后续读取保持一致。
    setRawMode(true)

    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // setRawMode 写入新的状态值，使终端渲染后续读取保持一致。
      setRawMode(false)
    }
  }, [options.isActive, setRawMode])

  // Register the listener once on mount so its slot in the EventEmitter's
  // listener array is stable. If isActive were in the effect's deps, the
  // listener would re-append on false→true, moving it behind listeners
  // that registered while it was inactive — breaking
  // stopImmediatePropagation() ordering. useEventCallback keeps the
  // reference stable while reading latest isActive/inputHandler from
  // closure (it syncs via useLayoutEffect, so it's compiler-safe).
  // handleData保存`useEventCallback`，供终端渲染后续处理使用。
  const handleData = useEventCallback((event: InputEvent) => {
    // 满足 `options.isActive === false` 时，终端渲染执行该分支。
    if (options.isActive === false) {
      // Ink 渲染层 use input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 从 `event` 解构 input、key，减少Ink 渲染层 use input对同一对象的重复访问。
    const { input, key } = event

    // If app is not supposed to exit on Ctrl+C, then let input listener handle it
    // Note: discreteUpdates is called at the App level when emitting events,
    // so all listeners are already within a high-priority update context.
    // 只有 `!(input === 'c' && key.ctrl) || !internal_exitOnCtrlC` 满足时，终端渲染才执行该分支。
    if (!(input === 'c' && key.ctrl) || !internal_exitOnCtrlC) {
      // 调用 inputHandler，触发终端渲染此处需要的副作用。
      inputHandler(input, key, event)
    }
  })

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 调用 internal_eventEmitter?.on('input', handleData)，完成这一处局部操作。
    internal_eventEmitter?.on('input', handleData)

    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // 调用 internal_eventEmitter?.removeListener('input', handleData)，完成这一处局部操作。
      internal_eventEmitter?.removeListener('input', handleData)
    }
  }, [internal_eventEmitter, handleData])
}

export default useInput
