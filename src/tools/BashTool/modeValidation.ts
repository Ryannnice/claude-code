// 类型依赖 { z } 来自 zod/v4，用于校准工具调用的数据契约。
import type { z } from 'zod/v4'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 复用 splitCommand_DEPRECATED 工具函数，把通用处理留在 ../../utils/bash/commands.js 中维护。
import { splitCommand_DEPRECATED } from '../../utils/bash/commands.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 类型依赖 { BashTool } 来自 ./BashTool.js，用于校准工具调用的数据契约。
import type { BashTool } from './BashTool.js'

// ACCEPT_EDITS_ALLOWED_COMMANDS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const ACCEPT_EDITS_ALLOWED_COMMANDS = [
  'mkdir',
  'touch',
  'rm',
  'rmdir',
  'mv',
  'cp',
  'sed',
] as const

// FilesystemCommand 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type FilesystemCommand = (typeof ACCEPT_EDITS_ALLOWED_COMMANDS)[number]

// isFilesystemCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isFilesystemCommand(command: string): command is FilesystemCommand {
  // 返回 `ACCEPT_EDITS_ALLOWED_COMMANDS.includes(command as FilesystemCommand)`，作为工具调用这次计算的结果。
  return ACCEPT_EDITS_ALLOWED_COMMANDS.includes(command as FilesystemCommand)
}

// validateCommandForMode 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateCommandForMode(
  cmd: string,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult {
  // trimmedCmd 命令数据格式化`cmd.trim`，供工具调用后续处理使用。
  const trimmedCmd = cmd.trim()
  // 从 `trimmedCmd.split(/\s+/)` 按位置拆出 baseCmd，让Bash 工具 mode Validation分别处理这些返回值。
  const [baseCmd] = trimmedCmd.split(/\s+/)

  // 基础命令缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!baseCmd) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'Base command not found',
    }
  }

  // In Accept Edits mode, auto-allow filesystem operations
  // 工具调用在这里按实际状态进入对应分支。
  if (
    toolPermissionContext.mode === 'acceptEdits' &&
    isFilesystemCommand(baseCmd)
  ) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: { command: cmd },
      decisionReason: {
        type: 'mode',
        mode: 'acceptEdits',
      },
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: `No mode-specific handling for '${baseCmd}' in ${toolPermissionContext.mode} mode`,
  }
}

/**
 * Checks if commands should be handled differently based on the current permission mode
 *
 * This is the main entry point for mode-based permission logic.
 * Currently handles Accept Edits mode for filesystem commands,
 * but designed to be extended for other modes.
 *
 * @param input - The bash command input
 * @param toolPermissionContext - Context containing mode and permissions
 * @returns
 * - 'allow' if the current mode permits auto-approval
 * - 'ask' if the command needs approval in current mode
 * - 'passthrough' if no mode-specific handling applies
 */
// checkPermissionMode 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkPermissionMode(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult {
  // Skip if in bypass mode (handled elsewhere)
  // 当 `toolPermissionContext.mode` 匹配 `'bypassPermissions'` 时，工具调用执行对应分支。
  if (toolPermissionContext.mode === 'bypassPermissions') {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'Bypass mode is handled in main permission flow',
    }
  }

  // Skip if in dontAsk mode (handled in main permission flow)
  // 当 `toolPermissionContext.mode` 匹配 `'dontAsk'` 时，工具调用执行对应分支。
  if (toolPermissionContext.mode === 'dontAsk') {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'DontAsk mode is handled in main permission flow',
    }
  }

  // commands 命令数据格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
  const commands = splitCommand_DEPRECATED(input.command)

  // Check each subcommand
  // 按顺序遍历 `commands` 中的cmd 命令数据，逐个交给工具调用处理。
  for (const cmd of commands) {
    // 结果读取`validateCommandForMode`，供工具调用后续处理使用。
    const result = validateCommandForMode(cmd, toolPermissionContext)

    // If any command triggers mode-specific behavior, return that result
    // `result.behavior` 与 `'passthrough'` 不一致时刷新派生状态，避免使用过期结果。
    if (result.behavior !== 'passthrough') {
      // 返回 `result`，作为工具调用这次计算的结果。
      return result
    }
  }

  // No mode-specific handling needed
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'No mode-specific validation required',
  }
}

// getAutoAllowedCommands 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoAllowedCommands(
  mode: ToolPermissionContext['mode'],
): readonly string[] {
  // 返回 `mode === 'acceptEdits' ? ACCEPT_EDITS_ALLOWED_COMMANDS : []`，作为工具调用这次计算的结果。
  return mode === 'acceptEdits' ? ACCEPT_EDITS_ALLOWED_COMMANDS : []
}
