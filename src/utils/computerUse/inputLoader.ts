// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ComputerUseInput,
  ComputerUseInputAPI,
} from '@ant/computer-use-input'

// cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let cached: ComputerUseInputAPI | undefined

/**
 * Package's js/index.js reads COMPUTER_USE_INPUT_NODE_PATH (baked by
 * build-with-plugins.ts on darwin targets, unset otherwise — falls through to
 * the node_modules prebuilds/ path).
 *
 * The package exports a discriminated union on `isSupported` — narrowed here
 * once so callers get the bare `ComputerUseInputAPI` without re-checking.
 *
 * key()/keys() dispatch enigo work onto DispatchQueue.main via
 * dispatch2::run_on_main, then block a tokio worker on a channel. Under
 * Electron (CFRunLoop drains the main queue) this works; under libuv
 * (Node/bun) the main queue never drains and the promise hangs. The executor
 * calls these inside drainRunLoop().
 */
// requireComputerUseInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function requireComputerUseInput(): ComputerUseInputAPI {
  // 满足 `cached` 时，共享工具执行该分支。
  if (cached) return cached
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // 用户输入保存`require`，供共享工具后续处理使用。
  const input = require('@ant/computer-use-input') as ComputerUseInput
  // input.isSupported缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!input.isSupported) {
    // 抛出 new Error('@ant/computer-use-input is not supported on this platform')，阻止共享工具在无效状态下继续运行。
    throw new Error('@ant/computer-use-input is not supported on this platform')
  }
  // 返回 `(cached = input)`，作为共享工具这次计算的结果。
  return (cached = input)
}
