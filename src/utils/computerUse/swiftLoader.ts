// 类型依赖 { ComputerUseAPI } 来自 @ant/computer-use-swift，用于校准共享工具的数据契约。
import type { ComputerUseAPI } from '@ant/computer-use-swift'

// cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let cached: ComputerUseAPI | undefined

/**
 * Package's js/index.js reads COMPUTER_USE_SWIFT_NODE_PATH (baked by
 * build-with-plugins.ts on darwin targets, unset otherwise — falls through to
 * the node_modules prebuilds/ path). We cache the loaded native module.
 *
 * The four @MainActor methods (captureExcluding, captureRegion,
 * apps.listInstalled, resolvePrepareCapture) dispatch to DispatchQueue.main
 * and will hang under libuv unless CFRunLoop is pumped — call sites wrap
 * these in drainRunLoop().
 */
// requireComputerUseSwift 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function requireComputerUseSwift(): ComputerUseAPI {
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 抛出 new Error('@ant/computer-use-swift is macOS-only')，阻止共享工具在无效状态下继续运行。
    throw new Error('@ant/computer-use-swift is macOS-only')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // 返回 `(cached ??= require('@ant/computer-use-swift') as ComputerUseAPI)`，作为共享工具这次计算的结果。
  return (cached ??= require('@ant/computer-use-swift') as ComputerUseAPI)
}

// 导出类型定义，让其他模块沿用共享工具 swift Loader的数据契约。
export type { ComputerUseAPI }
