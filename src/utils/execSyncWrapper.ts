// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ExecSyncOptions,
  type ExecSyncOptionsWithBufferEncoding,
  type ExecSyncOptionsWithStringEncoding,
  execSync as nodeExecSync,
} from 'child_process'
// 引入 slowLogging，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { slowLogging } from './slowOperations.js'

/**
 * @deprecated Use async alternatives when possible. Sync exec calls block the event loop.
 *
 * Wrapped execSync with slow operation logging.
 * Use this instead of child_process execSync directly to detect performance issues.
 *
 * @example
 * import { execSync_DEPRECATED } from './execSyncWrapper.js'
 * const result = execSync_DEPRECATED('git status', { encoding: 'utf8' })
 */
// execSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSync_DEPRECATED(command: string): Buffer
// execSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSync_DEPRECATED(
  command: string,
  options: ExecSyncOptionsWithStringEncoding,
): string
// execSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSync_DEPRECATED(
  command: string,
  options: ExecSyncOptionsWithBufferEncoding,
): Buffer
// execSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSync_DEPRECATED(
  command: string,
  options?: ExecSyncOptions,
): Buffer | string
// execSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSync_DEPRECATED(
  command: string,
  options?: ExecSyncOptions,
): Buffer | string {
  // 共享工具 exec Sync Wrapper在这里处理 `using _ = slowLogging`execSync: ${command.slice(0, 100)}``，完成这一小步状态转换。
  using _ = slowLogging`execSync: ${command.slice(0, 100)}`
  // 返回 `nodeExecSync(command, options)`，作为共享工具这次计算的结果。
  return nodeExecSync(command, options)
}
