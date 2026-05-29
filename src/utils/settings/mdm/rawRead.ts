/**
 * Minimal module for firing MDM subprocess reads without blocking the event loop.
 * Has minimal imports — only child_process, fs, and mdmConstants (which only imports os).
 *
 * Two usage patterns:
 * 1. Startup: startMdmRawRead() fires at main.tsx module evaluation, results consumed later via getMdmRawReadPromise()
 * 2. Poll/fallback: fireRawRead() creates a fresh read on demand (used by changeDetector and SDK entrypoint)
 *
 * Raw stdout is consumed by mdmSettings.ts via consumeRawReadResult().
 */

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFile } from 'child_process'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { existsSync } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getMacOSPlistPaths,
  MDM_SUBPROCESS_TIMEOUT_MS,
  PLUTIL_ARGS_PREFIX,
  PLUTIL_PATH,
  WINDOWS_REGISTRY_KEY_PATH_HKCU,
  WINDOWS_REGISTRY_KEY_PATH_HKLM,
  WINDOWS_REGISTRY_VALUE_NAME,
} from './constants.js'

// RawReadResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RawReadResult = {
  plistStdouts: Array<{ stdout: string; label: string }> | null
  hklmStdout: string | null
  hkcuStdout: string | null
}

// rawReadPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let rawReadPromise: Promise<RawReadResult> | null = null

// execFilePromise 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function execFilePromise(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; code: number | null }> {
  // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
  return new Promise(resolve => {
    // 调用 execFile，触发共享工具此处需要的副作用。
    execFile(
      cmd,
      args,
      { encoding: 'utf-8', timeout: MDM_SUBPROCESS_TIMEOUT_MS },
      // 这个回调绑定到 (err, stdout) => {，负责共享工具在该局部场景下的响应。
      (err, stdout) => {
        // biome-ignore lint/nursery/noFloatingPromises: resolve() is not a floating promise
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve({ stdout: stdout ?? '', code: err ? 1 : 0 })
      },
    )
  })
}

/**
 * Fire fresh subprocess reads for MDM settings and return raw stdout.
 * On macOS: spawns plutil for each plist path in parallel, picks first winner.
 * On Windows: spawns reg query for HKLM and HKCU in parallel.
 * On Linux: returns empty (no MDM equivalent).
 */
// fireRawRead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fireRawRead(): Promise<RawReadResult> {
  // return 使用 async ( 完成共享工具里的对应操作。
  return (async (): Promise<RawReadResult> => {
    // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
    if (process.platform === 'darwin') {
      // plistPaths 路径数据读取`getMacOSPlistPaths`，供共享工具后续处理使用。
      const plistPaths = getMacOSPlistPaths()

      // allResults 集合保存`Promise.all`，供共享工具后续处理使用。
      const allResults = await Promise.all(
        // 调用 plistPaths.map，触发共享工具此处需要的副作用。
        plistPaths.map(async ({ path, label }) => {
          // Fast-path: skip the plutil subprocess if the plist file does not
          // exist. Spawning plutil takes ~5ms even for an immediate ENOENT,
          // and non-MDM machines never have these files.
          // Uses synchronous existsSync to preserve the spawn-during-imports
          // invariant: execFilePromise must be the first await so plutil
          // spawns before the event loop polls (see main.tsx:3-4).
          // 满足 `!existsSync(path)` 时，共享工具执行该分支。
          if (!existsSync(path)) {
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
            return { stdout: '', label, ok: false }
          }
          // 从 `await execFilePromise(PLUTIL_PATH, [` 解构 stdout、code，减少共享工具 raw Read对同一对象的重复访问。
          const { stdout, code } = await execFilePromise(PLUTIL_PATH, [
            ...PLUTIL_ARGS_PREFIX,
            path,
          ])
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { stdout, label, ok: code === 0 && !!stdout }
        }),
      )

      // First source wins (array is in priority order)
      // winner筛选`allResults.find`，供共享工具后续处理使用。
      const winner = allResults.find(r => r.ok)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        plistStdouts: winner
          ? [{ stdout: winner.stdout, label: winner.label }]
          : [],
        hklmStdout: null,
        hkcuStdout: null,
      }
    }

    // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (process.platform === 'win32') {
      // 并行获取 hklm、hkcu，缩短共享工具 raw Read等待多个独立异步任务的时间。
      const [hklm, hkcu] = await Promise.all([
        execFilePromise('reg', [
          'query',
          WINDOWS_REGISTRY_KEY_PATH_HKLM,
          '/v',
          WINDOWS_REGISTRY_VALUE_NAME,
        ]),
        execFilePromise('reg', [
          'query',
          WINDOWS_REGISTRY_KEY_PATH_HKCU,
          '/v',
          WINDOWS_REGISTRY_VALUE_NAME,
        ]),
      ])
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        plistStdouts: null,
        hklmStdout: hklm.code === 0 ? hklm.stdout : null,
        hkcuStdout: hkcu.code === 0 ? hkcu.stdout : null,
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { plistStdouts: null, hklmStdout: null, hkcuStdout: null }
  })()
}

/**
 * Fire raw subprocess reads once for startup. Called at main.tsx module evaluation.
 * Results are consumed via getMdmRawReadPromise().
 */
// startMdmRawRead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startMdmRawRead(): void {
  // 满足 `rawReadPromise` 时，共享工具执行该分支。
  if (rawReadPromise) return
  // rawReadPromise 异步任务更新为 `fireRawRead()`，确保共享工具后续读取最新状态。
  rawReadPromise = fireRawRead()
}

/**
 * Get the startup promise. Returns null if startMdmRawRead() wasn't called.
 */
// getMdmRawReadPromise 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMdmRawReadPromise(): Promise<RawReadResult> | null {
  // 返回 `rawReadPromise`，作为共享工具这次计算的结果。
  return rawReadPromise
}
