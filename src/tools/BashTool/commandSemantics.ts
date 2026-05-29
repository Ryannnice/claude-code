/**
 * Command semantics configuration for interpreting exit codes in different contexts.
 *
 * Many commands use exit codes to convey information other than just success/failure.
 * For example, grep returns 1 when no matches are found, which is not an error condition.
 */

// 复用 splitCommand_DEPRECATED 工具函数，把通用处理留在 ../../utils/bash/commands.js 中维护。
import { splitCommand_DEPRECATED } from '../../utils/bash/commands.js'

// CommandSemantic 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandSemantic = (
  exitCode: number,
  stdout: string,
  stderr: string,
) => {
  isError: boolean
  message?: string
}

/**
 * Default semantic: treat only 0 as success, everything else as error
 */
// 这个回调绑定到 const DEFAULT_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
const DEFAULT_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({
  isError: exitCode !== 0,
  message:
    exitCode !== 0 ? `Command failed with exit code ${exitCode}` : undefined,
})

/**
 * Command-specific semantics
 */
// COMMAND_SEMANTICS 命令数据 用 Map 保存键值关系，方便Bash 工具 command Semantics按 key 查找和复用。
const COMMAND_SEMANTICS: Map<string, CommandSemantic> = new Map([
  // grep: 0=matches found, 1=no matches, 2+=error
  [
    'grep',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message: exitCode === 1 ? 'No matches found' : undefined,
    }),
  ],

  // ripgrep has same semantics as grep
  [
    'rg',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message: exitCode === 1 ? 'No matches found' : undefined,
    }),
  ],

  // find: 0=success, 1=partial success (some dirs inaccessible), 2+=error
  [
    'find',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message:
        exitCode === 1 ? 'Some directories were inaccessible' : undefined,
    }),
  ],

  // diff: 0=no differences, 1=differences found, 2+=error
  [
    'diff',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message: exitCode === 1 ? 'Files differ' : undefined,
    }),
  ],

  // test/[: 0=condition true, 1=condition false, 2+=error
  [
    'test',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message: exitCode === 1 ? 'Condition is false' : undefined,
    }),
  ],

  // [ is an alias for test
  [
    '[',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 2,
      message: exitCode === 1 ? 'Condition is false' : undefined,
    }),
  ],

  // wc, head, tail, cat, etc.: these typically only fail on real errors
  // so we use default semantics
])

/**
 * Get the semantic interpretation for a command
 */
// getCommandSemantic 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandSemantic(command: string): CommandSemantic {
  // Extract the base command (first word, handling pipes)
  // baseCommand 命令数据保存`heuristicallyExtractBaseCommand`，供工具调用后续处理使用。
  const baseCommand = heuristicallyExtractBaseCommand(command)
  // semantic读取`COMMAND_SEMANTICS.get`，供工具调用后续处理使用。
  const semantic = COMMAND_SEMANTICS.get(baseCommand)
  // 返回 `semantic !== undefined ? semantic : DEFAULT_SEMANTIC`，作为工具调用这次计算的结果。
  return semantic !== undefined ? semantic : DEFAULT_SEMANTIC
}

/**
 * Extract just the command name (first word) from a single command string.
 */
// extractBaseCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractBaseCommand(command: string): string {
  // 返回 `command.trim().split(/\s+/)[0] || ''`，作为工具调用这次计算的结果。
  return command.trim().split(/\s+/)[0] || ''
}

/**
 * Extract the primary command from a complex command line;
 * May get it super wrong - don't depend on this for security
 */
// heuristicallyExtractBaseCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function heuristicallyExtractBaseCommand(command: string): string {
  // segments 集合格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
  const segments = splitCommand_DEPRECATED(command)

  // Take the last command as that's what determines the exit code
  // lastCommand 命令数据标记Bash 工具 command Semantics是否启用对应路径。
  const lastCommand = segments[segments.length - 1] || command

  // 返回 `extractBaseCommand(lastCommand)`，作为工具调用这次计算的结果。
  return extractBaseCommand(lastCommand)
}

/**
 * Interpret command result based on semantic rules
 */
// interpretCommandResult 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function interpretCommandResult(
  command: string,
  exitCode: number,
  stdout: string,
  stderr: string,
): {
  isError: boolean
  message?: string
} {
  // semantic读取`getCommandSemantic`，供工具调用后续处理使用。
  const semantic = getCommandSemantic(command)
  // 结果保存`semantic`，供工具调用后续处理使用。
  const result = semantic(exitCode, stdout, stderr)

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    isError: result.isError,
    message: result.message,
  }
}
