// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ComputerUseHostAdapter,
  Logger,
} from '@ant/computer-use-mcp/types'
// 引入 format，将 util 中已经封装好的能力接到本文件流程里。
import { format } from 'util'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 COMPUTER_USE_MCP_SERVER_NAME，将 ./common.js 中已经封装好的能力接到本文件流程里。
import { COMPUTER_USE_MCP_SERVER_NAME } from './common.js'
// 引入 createCliExecutor，将 ./executor.js 中已经封装好的能力接到本文件流程里。
import { createCliExecutor } from './executor.js'
// 引入 getChicagoEnabled、getChicagoSubGates，将 ./gates.js 中已经封装好的能力接到本文件流程里。
import { getChicagoEnabled, getChicagoSubGates } from './gates.js'
// 引入 requireComputerUseSwift，将 ./swiftLoader.js 中已经封装好的能力接到本文件流程里。
import { requireComputerUseSwift } from './swiftLoader.js'

// DebugLogger 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class DebugLogger implements Logger {
  // silly 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  silly(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'debug' })
  }
  // debug 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  debug(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'debug' })
  }
  // info 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  info(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'info' })
  }
  // warn 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  warn(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'warn' })
  }
  // error 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  error(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'error' })
  }
}

// cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let cached: ComputerUseHostAdapter | undefined

/**
 * Process-lifetime singleton. Built once on first CU tool call; native modules
 * (both `@ant/computer-use-input` and `@ant/computer-use-swift`) are loaded
 * here via the executor factory, which throws on load failure — there is no
 * degraded mode.
 */
// getComputerUseHostAdapter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getComputerUseHostAdapter(): ComputerUseHostAdapter {
  // 满足 `cached` 时，共享工具执行该分支。
  if (cached) return cached
  // cached 缓存更新为 `{`，确保共享工具后续读取最新状态。
  cached = {
    serverName: COMPUTER_USE_MCP_SERVER_NAME,
    logger: new DebugLogger(),
    executor: createCliExecutor({
      // 这个回调绑定到 getMouseAnimationEnabled: () => getChicagoSubGates().mouseAnimation,，负责共享工具在该局部场景下的响应。
      getMouseAnimationEnabled: () => getChicagoSubGates().mouseAnimation,
      // 这个回调绑定到 getHideBeforeActionEnabled: () => getChicagoSubGates().hideBeforeAction,，负责共享工具在该局部场景下的响应。
      getHideBeforeActionEnabled: () => getChicagoSubGates().hideBeforeAction,
    }),
    // 这个回调绑定到 ensureOsPermissions: async () => {，负责共享工具在该局部场景下的响应。
    ensureOsPermissions: async () => {
      // cu保存`requireComputerUseSwift`，供共享工具后续处理使用。
      const cu = requireComputerUseSwift()
      // accessibility读取`tcc.checkAccessibility`，供共享工具后续处理使用。
      const accessibility = cu.tcc.checkAccessibility()
      // screenRecording读取`tcc.checkScreenRecording`，供共享工具后续处理使用。
      const screenRecording = cu.tcc.checkScreenRecording()
      // 返回 `accessibility && screenRecording`，作为共享工具这次计算的结果。
      return accessibility && screenRecording
        ? { granted: true }
        : { granted: false, accessibility, screenRecording }
    },
    // 这个回调绑定到 isDisabled: () => !getChicagoEnabled(),，负责共享工具在该局部场景下的响应。
    isDisabled: () => !getChicagoEnabled(),
    getSubGates: getChicagoSubGates,
    // cleanup.ts always unhides at turn end — no user preference to disable it.
    // 这个回调绑定到 getAutoUnhideEnabled: () => true,，负责共享工具在该局部场景下的响应。
    getAutoUnhideEnabled: () => true,

    // Pixel-validation JPEG decode+crop. MUST be synchronous (the package
    // does `patch1.equals(patch2)` directly on the return value). Cowork uses
    // Electron's `nativeImage` (sync); our `image-processor-napi` is
    // sharp-compatible and async-only. Returning null → validation skipped,
    // click proceeds — the designed fallback per `PixelCompareResult.skipped`.
    // The sub-gate defaults to false anyway.
    // 这个回调绑定到 cropRawPatch: () => null,，负责共享工具在该局部场景下的响应。
    cropRawPatch: () => null,
  }
  // 返回 `cached`，作为共享工具这次计算的结果。
  return cached
}
