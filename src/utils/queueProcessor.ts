// 类型依赖 { QueuedCommand } 来自 ../types/textInputTypes.js，用于校准共享工具的数据契约。
import type { QueuedCommand } from '../types/textInputTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  dequeue,
  dequeueAllMatching,
  hasCommandsInQueue,
  peek,
} from './messageQueueManager.js'

// ProcessQueueParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ProcessQueueParams = {
  // 这个回调绑定到 executeInput: (commands: QueuedCommand[]) => Promise<void>，负责共享工具在该局部场景下的响应。
  executeInput: (commands: QueuedCommand[]) => Promise<void>
}

// ProcessQueueResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ProcessQueueResult = {
  processed: boolean
}

/**
 * Check if a queued command is a slash command (value starts with '/').
 */
// isSlashCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSlashCommand(cmd: QueuedCommand): boolean {
  // 当 `typeof cmd.value` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof cmd.value === 'string') {
    // 返回 `cmd.value.trim().startsWith('/')`，作为共享工具这次计算的结果。
    return cmd.value.trim().startsWith('/')
  }
  // For ContentBlockParam[], check the first text block
  // 按顺序遍历 `cmd.value` 中的block，逐个交给共享工具处理。
  for (const block of cmd.value) {
    // 当 `block.type` 匹配 `'text'` 时，共享工具执行对应分支。
    if (block.type === 'text') {
      // 返回 `block.text.trim().startsWith('/')`，作为共享工具这次计算的结果。
      return block.text.trim().startsWith('/')
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Processes commands from the queue.
 *
 * Slash commands (starting with '/') and bash-mode commands are processed
 * one at a time so each goes through the executeInput path individually.
 * Bash commands need individual processing to preserve per-command error
 * isolation, exit codes, and progress UI. Other non-slash commands are
 * batched: all items **with the same mode** as the highest-priority item
 * are drained at once and passed as a single array to executeInput — each
 * becomes its own user message with its own UUID. Different modes
 * (e.g. prompt vs task-notification) are never mixed because they are
 * treated differently downstream.
 *
 * The caller is responsible for ensuring no query is currently running
 * and for calling this function again after each command completes
 * until the queue is empty.
 *
 * @returns result with processed status
 */
// processQueueIfReady 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function processQueueIfReady({
  executeInput,
}: ProcessQueueParams): ProcessQueueResult {
  // This processor runs on the REPL main thread between turns. Skip anything
  // addressed to a subagent — an unfiltered peek() returning a subagent
  // notification would set targetMode, dequeueAllMatching would find nothing
  // matching that mode with agentId===undefined, and we'd return processed:
  // false with the queue unchanged → the React effect never re-fires and any
  // queued user prompt stalls permanently.
  // isMainThread封装成回调，供共享工具 queue Processor在事件触发或异步步骤中调用。
  const isMainThread = (cmd: QueuedCommand) => cmd.agentId === undefined

  // next保存`peek`，供共享工具后续处理使用。
  const next = peek(isMainThread)
  // next缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!next) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { processed: false }
  }

  // Slash commands and bash-mode commands are processed individually.
  // Bash commands need per-command error isolation, exit codes, and progress UI.
  // 当 `isSlashCommand(next) || next.mode` 匹配 `'bash'` 时，共享工具执行对应分支。
  if (isSlashCommand(next) || next.mode === 'bash') {
    // cmd 命令数据保存`dequeue`，供共享工具后续处理使用。
    const cmd = dequeue(isMainThread)!
    // 显式忽略 `executeInput([cmd])` 的返回值，只保留它触发的副作用。
    void executeInput([cmd])
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { processed: true }
  }

  // Drain all non-slash-command items with the same mode at once.
  // targetMode 命名 `next.mode`，让后续代码直接表达这个值的用途。
  const targetMode = next.mode
  // commands 命令数据保存`dequeueAllMatching`，供共享工具后续处理使用。
  const commands = dequeueAllMatching(
    // cmd 命令数据更新为 `> isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode =...`，确保共享工具后续读取最新状态。
    cmd => isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode === targetMode,
  )
  // commands 命令数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (commands.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { processed: false }
  }

  // 显式忽略 `executeInput(commands)` 的返回值，只保留它触发的副作用。
  void executeInput(commands)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { processed: true }
}

/**
 * Checks if the queue has pending commands.
 * Use this to determine if queue processing should be triggered.
 */
// hasQueuedCommands 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasQueuedCommands(): boolean {
  // 返回 `hasCommandsInQueue()`，作为共享工具这次计算的结果。
  return hasCommandsInQueue()
}
