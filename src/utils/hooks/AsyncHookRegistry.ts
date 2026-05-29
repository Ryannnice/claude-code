// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AsyncHookJSONOutput,
  HookEvent,
  SyncHookJSONOutput,
} from 'src/entrypoints/agentSdkTypes.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { ShellCommand } 来自 ../ShellCommand.js，用于校准共享工具的数据契约。
import type { ShellCommand } from '../ShellCommand.js'
// 引入 invalidateSessionEnvCache，将 ../sessionEnvironment.js 中已经封装好的能力接到本文件流程里。
import { invalidateSessionEnvCache } from '../sessionEnvironment.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 emitHookResponse、startHookProgressInterval，将 ./hookEvents.js 中已经封装好的能力接到本文件流程里。
import { emitHookResponse, startHookProgressInterval } from './hookEvents.js'

// PendingAsyncHook 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PendingAsyncHook = {
  processId: string
  hookId: string
  hookName: string
  hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
  toolName?: string
  pluginId?: string
  startTime: number
  timeout: number
  command: string
  responseAttachmentSent: boolean
  shellCommand?: ShellCommand
  // 这个回调绑定到 stopProgressInterval: () => void，负责共享工具在该局部场景下的响应。
  stopProgressInterval: () => void
}

// Global registry state
// pendingHooks 集合构建`new Map<string, PendingAsyncHook>()` 整理出中间结果，供共享工具React hook Async Hook Registry后续步骤使用。
const pendingHooks = new Map<string, PendingAsyncHook>()

// registerPendingAsyncHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerPendingAsyncHook({
  processId,
  hookId,
  asyncResponse,
  hookName,
  hookEvent,
  command,
  shellCommand,
  toolName,
  pluginId,
}: {
  processId: string
  hookId: string
  asyncResponse: AsyncHookJSONOutput
  hookName: string
  hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
  command: string
  shellCommand: ShellCommand
  toolName?: string
  pluginId?: string
}): void {
  // timeout标记共享工具React hook Async Hook Registry是否启用对应路径。
  const timeout = asyncResponse.asyncTimeout || 15000 // Default 15s
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Hooks: Registering async hook ${processId} (${hookName}) with timeout ${timeout}ms`,
  )
  // stopProgressInterval保存`startHookProgressInterval`，供共享工具后续处理使用。
  const stopProgressInterval = startHookProgressInterval({
    hookId,
    hookName,
    hookEvent,
    // 这个回调绑定到 getOutput: async () => {，负责共享工具在该局部场景下的响应。
    getOutput: async () => {
      // taskOutput读取`pendingHooks.get`，供共享工具后续处理使用。
      const taskOutput = pendingHooks.get(processId)?.shellCommand?.taskOutput
      // taskOutput缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!taskOutput) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { stdout: '', stderr: '', output: '' }
      }
      // stdout读取`taskOutput.getStdout`，供共享工具后续处理使用。
      const stdout = await taskOutput.getStdout()
      // stderr读取`taskOutput.getStderr`，供共享工具后续处理使用。
      const stderr = taskOutput.getStderr()
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { stdout, stderr, output: stdout + stderr }
    },
  })
  // pendingHooks.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingHooks.set(processId, {
    processId,
    hookId,
    hookName,
    hookEvent,
    toolName,
    pluginId,
    command,
    startTime: Date.now(),
    timeout,
    responseAttachmentSent: false,
    shellCommand,
    stopProgressInterval,
  })
}

// getPendingAsyncHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingAsyncHooks(): PendingAsyncHook[] {
  // 返回 `Array.from(pendingHooks.values()).filter(`，作为共享工具这次计算的结果。
  return Array.from(pendingHooks.values()).filter(
    hook => !hook.responseAttachmentSent,
  )
}

// finalizeHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function finalizeHook(
  hook: PendingAsyncHook,
  exitCode: number,
  outcome: 'success' | 'error' | 'cancelled',
): Promise<void> {
  // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
  hook.stopProgressInterval()
  // taskOutput保存`hook.shellCommand?.taskOutput`，供共享工具React hook Async Hook Registry后续判断或输出使用。
  const taskOutput = hook.shellCommand?.taskOutput
  // stdout读取`taskOutput.getStdout`，供共享工具后续处理使用。
  const stdout = taskOutput ? await taskOutput.getStdout() : ''
  // stderr读取`getStderr`，供共享工具后续处理使用。
  const stderr = taskOutput?.getStderr() ?? ''
  // 调用 hook.shellCommand?.cleanup()，完成这一处局部操作。
  hook.shellCommand?.cleanup()
  // 调用 emitHookResponse，触发共享工具此处需要的副作用。
  emitHookResponse({
    hookId: hook.hookId,
    hookName: hook.hookName,
    hookEvent: hook.hookEvent,
    output: stdout + stderr,
    stdout,
    stderr,
    exitCode,
    outcome,
  })
}

// checkForAsyncHookResponses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkForAsyncHookResponses(): Promise<
  Array<{
    processId: string
    response: SyncHookJSONOutput
    hookName: string
    hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
    toolName?: string
    pluginId?: string
    stdout: string
    stderr: string
    exitCode?: number
  }>
> {
  // responses 响应数据 先占位，稍后的条件分支会根据实际输入补齐它。
  const responses: {
    processId: string
    response: SyncHookJSONOutput
    hookName: string
    hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
    toolName?: string
    pluginId?: string
    stdout: string
    stderr: string
    exitCode?: number
  }[] = []

  // pendingCount 数量 命名 `pendingHooks.size`，让后续代码直接表达这个值的用途。
  const pendingCount = pendingHooks.size
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Hooks: Found ${pendingCount} total hooks in registry`)

  // Snapshot hooks before processing — we'll mutate the map after.
  // hooks 集合保存`Array.from`，供共享工具后续处理使用。
  const hooks = Array.from(pendingHooks.values())

  // settled保存`Promise.allSettled`，供共享工具后续处理使用。
  const settled = await Promise.allSettled(
    // 调用 hooks.map，触发共享工具此处需要的副作用。
    hooks.map(async hook => {
      // stdout读取`taskOutput.getStdout`，供共享工具后续处理使用。
      const stdout = (await hook.shellCommand?.taskOutput.getStdout()) ?? ''
      // stderr读取`taskOutput.getStderr`，供共享工具后续处理使用。
      const stderr = hook.shellCommand?.taskOutput.getStderr() ?? ''
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: Checking hook ${hook.processId} (${hook.hookName}) - attachmentSent: ${hook.responseAttachmentSent}, stdout length: ${stdout.length}`,
      )

      // hook.shellCommand 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!hook.shellCommand) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Hook ${hook.processId} has no shell command, removing from registry`,
        )
        // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
        hook.stopProgressInterval()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'remove' as const, processId: hook.processId }
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Hook shell status ${hook.shellCommand.status}`)

      // 当 `hook.shellCommand.status` 匹配 `'killed'` 时，共享工具执行对应分支。
      if (hook.shellCommand.status === 'killed') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Hook ${hook.processId} is ${hook.shellCommand.status}, removing from registry`,
        )
        // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
        hook.stopProgressInterval()
        // 调用 hook.shellCommand.cleanup，触发共享工具此处需要的副作用。
        hook.shellCommand.cleanup()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'remove' as const, processId: hook.processId }
      }

      // `hook.shellCommand.status` 与 `'completed'` 不一致时刷新派生状态，避免使用过期结果。
      if (hook.shellCommand.status !== 'completed') {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'skip' as const }
      }

      // 只有 `hook.responseAttachmentSent || !stdout.trim()` 满足时，共享工具才执行该分支。
      if (hook.responseAttachmentSent || !stdout.trim()) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Skipping hook ${hook.processId} - already delivered/sent or no stdout`,
        )
        // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
        hook.stopProgressInterval()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'remove' as const, processId: hook.processId }
      }

      // 文本行格式化`stdout.split`，供共享工具后续处理使用。
      const lines = stdout.split('\n')
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: Processing ${lines.length} lines of stdout for ${hook.processId}`,
      )

      // execResult 等待 `hook.shellCommand.result`，确保继续执行前已有结果。
      const execResult = await hook.shellCommand.result
      // exitCode保存`execResult.code`，供共享工具React hook Async Hook Registry后续判断或输出使用。
      const exitCode = execResult.code

      // 接口响应 从空对象开始收集键值，后续按名称补齐内容。
      let response: SyncHookJSONOutput = {}
      // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
      for (const line of lines) {
        // 满足 `line.trim().startsWith('{')` 时，共享工具执行该分支。
        if (line.trim().startsWith('{')) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks: Found JSON line: ${line.trim().substring(0, 100)}...`,
          )
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 解析结果解析`jsonParse`，供共享工具后续处理使用。
            const parsed = jsonParse(line.trim())
            // 满足 `!('async' in parsed)` 时，共享工具执行该分支。
            if (!('async' in parsed)) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Hooks: Found sync response from ${hook.processId}: ${jsonStringify(parsed)}`,
              )
              // 接口响应更新为 `parsed`，确保共享工具后续读取最新状态。
              response = parsed
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            }
          } catch {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Hooks: Failed to parse JSON from ${hook.processId}: ${line.trim()}`,
            )
          }
        }
      }

      // responseAttachmentSent 响应数据更新为 `true`，确保共享工具后续读取最新状态。
      hook.responseAttachmentSent = true
      // 等待 `finalizeHook(hook, exitCode, exitCode === 0 ? 'success' : 'error')` 完成，再继续React hook Async Hook Registry的异步流程。
      await finalizeHook(hook, exitCode, exitCode === 0 ? 'success' : 'error')

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'response' as const,
        processId: hook.processId,
        isSessionStart: hook.hookEvent === 'SessionStart',
        payload: {
          processId: hook.processId,
          response,
          hookName: hook.hookName,
          hookEvent: hook.hookEvent,
          toolName: hook.toolName,
          pluginId: hook.pluginId,
          stdout,
          stderr,
          exitCode,
        },
      }
    }),
  )

  // allSettled — isolate failures so one throwing callback doesn't orphan
  // already-applied side effects (responseAttachmentSent, finalizeHook) from others.
  // sessionStartCompleted 会话数据标记共享工具React hook Async Hook Registry是否启用对应路径。
  let sessionStartCompleted = false
  // 按顺序遍历 `settled` 中的s 集合，逐个交给共享工具处理。
  for (const s of settled) {
    // `s.status` 与 `'fulfilled'` 不一致时刷新派生状态，避免使用过期结果。
    if (s.status !== 'fulfilled') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: checkForAsyncHookResponses callback rejected: ${s.reason}`,
        { level: 'error' },
      )
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // r保存`s.value`，供后续判断或组装使用。
    const r = s.value
    // 当 `r.type` 匹配 `'remove'` 时，共享工具执行对应分支。
    if (r.type === 'remove') {
      // 调用 pendingHooks.delete，触发共享工具此处需要的副作用。
      pendingHooks.delete(r.processId)
    // React hook Async Hook Registry在这里处理 `} else if (r.type === 'response') {`，完成这一小步状态转换。
    } else if (r.type === 'response') {
      // responses 响应数据追加新条目，保持收集顺序与输入顺序一致。
      responses.push(r.payload)
      // 调用 pendingHooks.delete，触发共享工具此处需要的副作用。
      pendingHooks.delete(r.processId)
      // 满足 `r.isSessionStart` 时，共享工具执行该分支。
      if (r.isSessionStart) sessionStartCompleted = true
    }
  }

  // 满足 `sessionStartCompleted` 时，共享工具执行该分支。
  if (sessionStartCompleted) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Invalidating session env cache after SessionStart hook completed`,
    )
    // 调用 invalidateSessionEnvCache，触发共享工具此处需要的副作用。
    invalidateSessionEnvCache()
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Hooks: checkForNewResponses returning ${responses.length} responses`,
  )
  // 返回 `responses`，作为共享工具这次计算的结果。
  return responses
}

// removeDeliveredAsyncHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeDeliveredAsyncHooks(processIds: string[]): void {
  // 按顺序遍历 `processIds` 中的processId，逐个交给共享工具处理。
  for (const processId of processIds) {
    // hook读取`pendingHooks.get`，供共享工具后续处理使用。
    const hook = pendingHooks.get(processId)
    // 只有 `hook && hook.responseAttachmentSent` 满足时，共享工具才执行该分支。
    if (hook && hook.responseAttachmentSent) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Removing delivered hook ${processId}`)
      // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
      hook.stopProgressInterval()
      // 调用 pendingHooks.delete，触发共享工具此处需要的副作用。
      pendingHooks.delete(processId)
    }
  }
}

// finalizePendingAsyncHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function finalizePendingAsyncHooks(): Promise<void> {
  // hooks 集合保存`Array.from`，供共享工具后续处理使用。
  const hooks = Array.from(pendingHooks.values())
  // 等待 `Promise.all(` 完成，再继续React hook Async Hook Registry的异步流程。
  await Promise.all(
    hooks.map(async hook => {
      // 当 `hook.shellCommand?.status` 匹配 `'completed'` 时，共享工具执行对应分支。
      if (hook.shellCommand?.status === 'completed') {
        // 结果 等待 `hook.shellCommand.result`，确保继续执行前已有结果。
        const result = await hook.shellCommand.result
        // 等待 `finalizeHook(` 完成，再继续React hook Async Hook Registry的异步流程。
        await finalizeHook(
          hook,
          result.code,
          result.code === 0 ? 'success' : 'error',
        )
      } else {
        // 只有 `hook.shellCommand && hook.shellCommand.status !==` 满足时，共享工具才执行该分支。
        if (hook.shellCommand && hook.shellCommand.status !== 'killed') {
          // 调用 hook.shellCommand.kill，触发共享工具此处需要的副作用。
          hook.shellCommand.kill()
        }
        // 等待 `finalizeHook(hook, 1, 'cancelled')` 完成，再继续React hook Async Hook Registry的异步流程。
        await finalizeHook(hook, 1, 'cancelled')
      }
    }),
  )
  // 调用 pendingHooks.clear，触发共享工具此处需要的副作用。
  pendingHooks.clear()
}

// Test utility function to clear all hooks
// clearAllAsyncHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllAsyncHooks(): void {
  // 逐项读取 `pendingHooks.values()` 中的hook，按输入顺序推进共享工具。
  for (const hook of pendingHooks.values()) {
    // 调用 hook.stopProgressInterval，触发共享工具此处需要的副作用。
    hook.stopProgressInterval()
  }
  // 调用 pendingHooks.clear，触发共享工具此处需要的副作用。
  pendingHooks.clear()
}
