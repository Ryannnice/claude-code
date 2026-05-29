/**
 * Early Input Capture
 *
 * This module captures terminal input that is typed before the REPL is fully
 * initialized. Users often type `claude` and immediately start typing their
 * prompt, but those early keystrokes would otherwise be lost during startup.
 *
 * Usage:
 * 1. Call startCapturingEarlyInput() as early as possible in cli.tsx
 * 2. When REPL is ready, call consumeEarlyInput() to get any buffered text
 * 3. stopCapturingEarlyInput() is called automatically when input is consumed
 */

// 引入 lastGrapheme，将 ./intl.js 中已经封装好的能力接到本文件流程里。
import { lastGrapheme } from './intl.js'

// Buffer for early input characters
// earlyInputBuffer固定为 `''`，作为共享工具 early Input后续展示或比较的基准。
let earlyInputBuffer = ''
// Flag to track if we're currently capturing
// isCapturing标记共享工具 early Input是否启用对应路径。
let isCapturing = false
// Reference to the readable handler so we can remove it later
// 这个回调绑定到 let readableHandler: (() => void) | null = null，负责共享工具在该局部场景下的响应。
let readableHandler: (() => void) | null = null

/**
 * Start capturing stdin data early, before the REPL is initialized.
 * Should be called as early as possible in the startup sequence.
 *
 * Only captures if stdin is a TTY (interactive terminal).
 */
// startCapturingEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startCapturingEarlyInput(): void {
  // Only capture in interactive mode: stdin must be a TTY, and we must not
  // be in print mode. Raw mode disables ISIG (terminal Ctrl+C → SIGINT),
  // which would make -p uninterruptible.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !process.stdin.isTTY ||
    isCapturing ||
    process.argv.includes('-p') ||
    process.argv.includes('--print')
  ) {
    // 共享工具 early Input在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // isCapturing更新为 `true`，确保共享工具后续读取最新状态。
  isCapturing = true
  // earlyInputBuffer更新为 `''`，确保共享工具后续读取最新状态。
  earlyInputBuffer = ''

  // Set stdin to raw mode and use 'readable' event like Ink does
  // This ensures compatibility with how the REPL will handle stdin later
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // process.stdin.setEncoding 写入新的状态值，使共享工具后续读取保持一致。
    process.stdin.setEncoding('utf8')
    // process.stdin.setRawMode 写入新的状态值，使共享工具后续读取保持一致。
    process.stdin.setRawMode(true)
    // 调用 process.stdin.ref，触发共享工具此处需要的副作用。
    process.stdin.ref()

    // readableHandler更新为 `() => {`，确保共享工具后续读取最新状态。
    readableHandler = () => {
      // chunk读取`stdin.read`，供共享工具后续处理使用。
      let chunk = process.stdin.read()
      // while 使用 chunk !== null 完成共享工具里的对应操作。
      while (chunk !== null) {
        // 当 `typeof chunk` 匹配 `'string'` 时，共享工具执行对应分支。
        if (typeof chunk === 'string') {
          // 调用 processChunk，触发共享工具此处需要的副作用。
          processChunk(chunk)
        }
        // chunk更新为 `process.stdin.read()`，确保共享工具后续读取最新状态。
        chunk = process.stdin.read()
      }
    }

    // 调用 process.stdin.on，触发共享工具此处需要的副作用。
    process.stdin.on('readable', readableHandler)
  } catch {
    // If we can't set raw mode, just silently continue without early capture
    // isCapturing更新为 `false`，确保共享工具后续读取最新状态。
    isCapturing = false
  }
}

/**
 * Process a chunk of input data
 */
// processChunk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processChunk(str: string): void {
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // while 使用 i < str.length 完成共享工具里的对应操作。
  while (i < str.length) {
    // char保存`str[i]!`，供共享工具 early Input后续判断或输出使用。
    const char = str[i]!
    // code保存`char.charCodeAt`，供共享工具后续处理使用。
    const code = char.charCodeAt(0)

    // Ctrl+C (code 3) - stop capturing and exit immediately.
    // We use process.exit here instead of gracefulShutdown because at this
    // early stage of startup, the shutdown machinery isn't initialized yet.
    // 满足 `code === 3` 时，共享工具执行该分支。
    if (code === 3) {
      // 调用 stopCapturingEarlyInput，触发共享工具此处需要的副作用。
      stopCapturingEarlyInput()
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发共享工具此处需要的副作用。
      process.exit(130) // Standard exit code for Ctrl+C
      // 共享工具 early Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Ctrl+D (code 4) - EOF, stop capturing
    // 满足 `code === 4` 时，共享工具执行该分支。
    if (code === 4) {
      // 调用 stopCapturingEarlyInput，触发共享工具此处需要的副作用。
      stopCapturingEarlyInput()
      // 共享工具 early Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Backspace (code 127 or 8) - remove last grapheme cluster
    // 只有 `code === 127 || code === 8` 满足时，共享工具才执行该分支。
    if (code === 127 || code === 8) {
      // 满足 `earlyInputBuffer.length > 0` 时，共享工具执行该分支。
      if (earlyInputBuffer.length > 0) {
        // last保存`lastGrapheme`，供共享工具后续处理使用。
        const last = lastGrapheme(earlyInputBuffer)
        // earlyInputBuffer更新为 `earlyInputBuffer.slice(0, -(last.length || 1))`，确保共享工具后续读取最新状态。
        earlyInputBuffer = earlyInputBuffer.slice(0, -(last.length || 1))
      }
      // 共享工具 early Input在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Skip escape sequences (arrow keys, function keys, focus events, etc.)
    // All escape sequences start with ESC (0x1B) and end with a byte in 0x40-0x7E
    // 满足 `code === 27` 时，共享工具执行该分支。
    if (code === 27) {
      // 共享工具 early Input在这里处理 `i++ // Skip the ESC character`，完成这一小步状态转换。
      i++ // Skip the ESC character
      // Skip until the terminating byte (@ to ~) or end of string
      // 调用 while，触发共享工具此处需要的副作用。
      while (
        i < str.length &&
        !(str.charCodeAt(i) >= 64 && str.charCodeAt(i) <= 126)
      ) {
        // 共享工具 early Input在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
      // 满足 `i < str.length` 时，共享工具执行该分支。
      if (i < str.length) i++ // Skip the terminating byte
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Skip other control characters (except tab and newline)
    // `code < 32 && code` 与 `9 && code !== 10 && code !=` 不一致时刷新派生状态，避免使用过期结果。
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      // 共享工具 early Input在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Convert carriage return to newline
    // 满足 `code === 13` 时，共享工具执行该分支。
    if (code === 13) {
      // 共享工具 early Input在这里处理 `earlyInputBuffer += '\n'`，完成这一小步状态转换。
      earlyInputBuffer += '\n'
      // 共享工具 early Input在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Add printable characters and allowed control chars to buffer
    // 共享工具 early Input在这里处理 `earlyInputBuffer += char`，完成这一小步状态转换。
    earlyInputBuffer += char
    // 共享工具 early Input在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
}

/**
 * Stop capturing early input.
 * Called automatically when input is consumed, or can be called manually.
 */
// stopCapturingEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopCapturingEarlyInput(): void {
  // isCapturing缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isCapturing) {
    // 共享工具 early Input在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // isCapturing更新为 `false`，确保共享工具后续读取最新状态。
  isCapturing = false

  // 满足 `readableHandler` 时，共享工具执行该分支。
  if (readableHandler) {
    // 调用 process.stdin.removeListener，触发共享工具此处需要的副作用。
    process.stdin.removeListener('readable', readableHandler)
    // readableHandler更新为 `null`，确保共享工具后续读取最新状态。
    readableHandler = null
  }

  // Don't reset stdin state - the REPL's Ink App will manage stdin state.
  // If we call setRawMode(false) here, it can interfere with the REPL's
  // own stdin setup which happens around the same time.
}

/**
 * Consume any early input that was captured.
 * Returns the captured input and clears the buffer.
 * Automatically stops capturing when called.
 */
// consumeEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumeEarlyInput(): string {
  // 调用 stopCapturingEarlyInput，触发共享工具此处需要的副作用。
  stopCapturingEarlyInput()
  // 用户输入格式化`earlyInputBuffer.trim`，供共享工具后续处理使用。
  const input = earlyInputBuffer.trim()
  // earlyInputBuffer更新为 `''`，确保共享工具后续读取最新状态。
  earlyInputBuffer = ''
  // 返回 `input`，作为共享工具这次计算的结果。
  return input
}

/**
 * Check if there is any early input available without consuming it.
 */
// hasEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasEarlyInput(): boolean {
  // 返回 `earlyInputBuffer.trim().length > 0`，作为共享工具这次计算的结果。
  return earlyInputBuffer.trim().length > 0
}

/**
 * Seed the early input buffer with text that will appear pre-filled
 * in the prompt input when the REPL renders. Does not auto-submit.
 */
// seedEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function seedEarlyInput(text: string): void {
  // earlyInputBuffer更新为 `text`，确保共享工具后续读取最新状态。
  earlyInputBuffer = text
}

/**
 * Check if early input capture is currently active.
 */
// isCapturingEarlyInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCapturingEarlyInput(): boolean {
  // 返回 `isCapturing`，作为共享工具这次计算的结果。
  return isCapturing
}
