// 类型依赖 { z } 来自 zod/v4，用于校准工具调用的数据契约。
import type { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isUnsafeCompoundCommand_DEPRECATED,
  splitCommand_DEPRECATED,
} from '../../utils/bash/commands.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildParsedCommandFromRoot,
  type IParsedCommand,
  ParsedCommand,
} from '../../utils/bash/ParsedCommand.js'
// 复用 Node、PARSE_ABORTED 工具函数，把通用处理留在 ../../utils/bash/parser.js 中维护。
import { type Node, PARSE_ABORTED } from '../../utils/bash/parser.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准工具调用的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js'
// 复用 createPermissionRequestMessage 工具函数，把通用处理留在 ../../utils/permissions/permissions.js 中维护。
import { createPermissionRequestMessage } from '../../utils/permissions/permissions.js'
// 引入 BashTool，将 ./BashTool.js 中已经封装好的能力接到本文件流程里。
import { BashTool } from './BashTool.js'
// 引入 bashCommandIsSafeAsync_DEPRECATED，将 ./bashSecurity.js 中已经封装好的能力接到本文件流程里。
import { bashCommandIsSafeAsync_DEPRECATED } from './bashSecurity.js'

// CommandIdentityCheckers 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandIdentityCheckers = {
  // 这个回调绑定到 isNormalizedCdCommand: (command: string) => boolean，负责工具调用在该局部场景下的响应。
  isNormalizedCdCommand: (command: string) => boolean
  // 这个回调绑定到 isNormalizedGitCommand: (command: string) => boolean，负责工具调用在该局部场景下的响应。
  isNormalizedGitCommand: (command: string) => boolean
}

// segmentedCommandPermissionResult 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function segmentedCommandPermissionResult(
  input: z.infer<typeof BashTool.inputSchema>,
  segments: string[],
  // Bash 工具 bash Command Helpers在这里处理 `bashToolHasPermissionFn: (`，完成这一小步状态转换。
  bashToolHasPermissionFn: (
    input: z.infer<typeof BashTool.inputSchema>,
  ) => Promise<PermissionResult>,
  checkers: CommandIdentityCheckers,
): Promise<PermissionResult> {
  // Check for multiple cd commands across all segments
  // cdCommands 命令数据筛选`segments.filter`，供工具调用后续处理使用。
  const cdCommands = segments.filter(segment => {
    // trimmed格式化`segment.trim`，供工具调用后续处理使用。
    const trimmed = segment.trim()
    // 返回 `checkers.isNormalizedCdCommand(trimmed)`，作为工具调用这次计算的结果。
    return checkers.isNormalizedCdCommand(trimmed)
  })
  // 满足 `cdCommands.length > 1` 时，工具调用执行该分支。
  if (cdCommands.length > 1) {
    // 决策原因 集中保存Bash 工具 bash Command Helpers要一起传递的字段。
    const decisionReason = {
      type: 'other' as const,
      reason:
        'Multiple directory changes in one command require approval for clarity',
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      decisionReason,
      message: createPermissionRequestMessage(BashTool.name, decisionReason),
    }
  }

  // SECURITY: Check for cd+git across pipe segments to prevent bare repo fsmonitor bypass.
  // When cd and git are in different pipe segments (e.g., "cd sub && echo | git status"),
  // each segment is checked independently and neither triggers the cd+git check in
  // bashPermissions.ts. We must detect this cross-segment pattern here.
  // Each pipe segment can itself be a compound command (e.g., "cd sub && echo"),
  // so we split each segment into subcommands before checking.
  {
    // hasCd标记Bash 工具 bash Command Helpers是否启用对应路径。
    let hasCd = false
    // hasGit标记Bash 工具 bash Command Helpers是否启用对应路径。
    let hasGit = false
    // 按顺序遍历 `segments` 中的segment，逐个交给工具调用处理。
    for (const segment of segments) {
      // subcommands 命令数据格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
      const subcommands = splitCommand_DEPRECATED(segment)
      // 按顺序遍历 `subcommands` 中的sub，逐个交给工具调用处理。
      for (const sub of subcommands) {
        // trimmed格式化`sub.trim`，供工具调用后续处理使用。
        const trimmed = sub.trim()
        // 满足 `checkers.isNormalizedCdCommand(trimmed)` 时，工具调用执行该分支。
        if (checkers.isNormalizedCdCommand(trimmed)) {
          // hasCd更新为 `true`，确保Bash 工具后续读取最新状态。
          hasCd = true
        }
        // 满足 `checkers.isNormalizedGitCommand(trimmed)` 时，工具调用执行该分支。
        if (checkers.isNormalizedGitCommand(trimmed)) {
          // hasGit更新为 `true`，确保Bash 工具后续读取最新状态。
          hasGit = true
        }
      }
    }
    // 只有 `hasCd && hasGit` 满足时，工具调用才执行该分支。
    if (hasCd && hasGit) {
      // 决策原因 集中保存Bash 工具 bash Command Helpers要一起传递的字段。
      const decisionReason = {
        type: 'other' as const,
        reason:
          'Compound commands with cd and git require approval to prevent bare repository attacks',
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        decisionReason,
        message: createPermissionRequestMessage(BashTool.name, decisionReason),
      }
    }
  }

  // segmentResults 集合构建`new Map<string, PermissionResult>()`，供后续判断或组装使用。
  const segmentResults = new Map<string, PermissionResult>()

  // Check each segment through the full permission system
  // 按顺序遍历 `segments` 中的segment，逐个交给工具调用处理。
  for (const segment of segments) {
    // trimmedSegment格式化`segment.trim`，供工具调用后续处理使用。
    const trimmedSegment = segment.trim()
    // trimmedSegment缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!trimmedSegment) continue // Skip empty segments

    // segmentResult保存`bashToolHasPermissionFn`，供工具调用后续处理使用。
    const segmentResult = await bashToolHasPermissionFn({
      ...input,
      command: trimmedSegment,
    })
    // segmentResults.set 写入新的状态值，使工具调用后续读取保持一致。
    segmentResults.set(trimmedSegment, segmentResult)
  }

  // Check if any segment is denied (after evaluating all)
  // deniedSegment保存`Array.from`，供工具调用后续处理使用。
  const deniedSegment = Array.from(segmentResults.entries()).find(
    // 这个回调绑定到 ([, result]) => result.behavior === 'deny',，负责工具调用在该局部场景下的响应。
    ([, result]) => result.behavior === 'deny',
  )

  // 满足 `deniedSegment` 时，工具调用执行该分支。
  if (deniedSegment) {
    // 从 `deniedSegment` 按位置拆出 segmentCommand、segmentResult，让Bash 工具 bash Command Helpers分别处理这些返回值。
    const [segmentCommand, segmentResult] = deniedSegment
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'deny',
      message:
        segmentResult.behavior === 'deny'
          ? segmentResult.message
          : `Permission denied for: ${segmentCommand}`,
      decisionReason: {
        type: 'subcommandResults',
        reasons: segmentResults,
      },
    }
  }

  // allAllowed保存`Array.from`，供工具调用后续处理使用。
  const allAllowed = Array.from(segmentResults.values()).every(
    // 结果更新为 `> result.behavior === 'allow'`，确保Bash 工具后续读取最新状态。
    result => result.behavior === 'allow',
  )

  // 满足 `allAllowed` 时，工具调用执行该分支。
  if (allAllowed) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'subcommandResults',
        reasons: segmentResults,
      },
    }
  }

  // Collect suggestions from segments that need approval
  // suggestions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const suggestions: PermissionUpdate[] = []
  // 循环处理 `const [, result] of segmentResults`，让工具调用逐项把同类条目按顺序走完。
  for (const [, result] of segmentResults) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      result.behavior !== 'allow' &&
      'suggestions' in result &&
      result.suggestions
    ) {
      // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
      suggestions.push(...result.suggestions)
    }
  }

  // 决策原因 集中保存Bash 工具 bash Command Helpers要一起传递的字段。
  const decisionReason = {
    type: 'subcommandResults' as const,
    reasons: segmentResults,
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'ask',
    message: createPermissionRequestMessage(BashTool.name, decisionReason),
    decisionReason,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  }
}

/**
 * Builds a command segment, stripping output redirections to avoid
 * treating filenames as commands in permission checking.
 * Uses ParsedCommand to preserve original quoting.
 */
// buildSegmentWithoutRedirections 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildSegmentWithoutRedirections(
  segmentCommand: string,
): Promise<string> {
  // Fast path: skip parsing if no redirection operators present
  // 满足 `!segmentCommand.includes('>')` 时，工具调用执行该分支。
  if (!segmentCommand.includes('>')) {
    // 返回 `segmentCommand`，作为工具调用这次计算的结果。
    return segmentCommand
  }

  // Use ParsedCommand to strip redirections while preserving quotes
  // 解析结果解析`ParsedCommand.parse`，供工具调用后续处理使用。
  const parsed = await ParsedCommand.parse(segmentCommand)
  // 返回 `parsed?.withoutOutputRedirections() ?? segmentCommand`，作为工具调用这次计算的结果。
  return parsed?.withoutOutputRedirections() ?? segmentCommand
}

/**
 * Wrapper that resolves an IParsedCommand (from a pre-parsed AST root if
 * available, else via ParsedCommand.parse) and delegates to
 * bashToolCheckCommandOperatorPermissions.
 */
// checkCommandOperatorPermissions 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkCommandOperatorPermissions(
  input: z.infer<typeof BashTool.inputSchema>,
  // Bash 工具 bash Command Helpers在这里处理 `bashToolHasPermissionFn: (`，完成这一小步状态转换。
  bashToolHasPermissionFn: (
    input: z.infer<typeof BashTool.inputSchema>,
  ) => Promise<PermissionResult>,
  checkers: CommandIdentityCheckers,
  astRoot: Node | null | typeof PARSE_ABORTED,
): Promise<PermissionResult> {
  // parsed 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const parsed =
    astRoot && astRoot !== PARSE_ABORTED
      ? buildParsedCommandFromRoot(input.command, astRoot)
      : await ParsedCommand.parse(input.command)
  // 解析结果缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parsed) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'Failed to parse command' }
  }
  // 返回 `bashToolCheckCommandOperatorPermissions(`，作为工具调用这次计算的结果。
  return bashToolCheckCommandOperatorPermissions(
    input,
    bashToolHasPermissionFn,
    checkers,
    parsed,
  )
}

/**
 * Checks if the command has special operators that require behavior beyond
 * simple subcommand checking.
 */
// bashToolCheckCommandOperatorPermissions 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function bashToolCheckCommandOperatorPermissions(
  input: z.infer<typeof BashTool.inputSchema>,
  // Bash 工具 bash Command Helpers在这里处理 `bashToolHasPermissionFn: (`，完成这一小步状态转换。
  bashToolHasPermissionFn: (
    input: z.infer<typeof BashTool.inputSchema>,
  ) => Promise<PermissionResult>,
  checkers: CommandIdentityCheckers,
  parsed: IParsedCommand,
): Promise<PermissionResult> {
  // 1. Check for unsafe compound commands (subshells, command groups).
  // tsAnalysis 集合解析`parsed.getTreeSitterAnalysis`，供工具调用后续处理使用。
  const tsAnalysis = parsed.getTreeSitterAnalysis()
  // isUnsafeCompound标记Bash 工具 bash Command Helpers是否启用对应路径。
  const isUnsafeCompound = tsAnalysis
    ? tsAnalysis.compoundStructure.hasSubshell ||
      tsAnalysis.compoundStructure.hasCommandGroup
    : isUnsafeCompoundCommand_DEPRECATED(input.command)
  // 满足 `isUnsafeCompound` 时，工具调用执行该分支。
  if (isUnsafeCompound) {
    // This command contains an operator like `>` that we don't support as a subcommand separator
    // Check if bashCommandIsSafe_DEPRECATED has a more specific message
    // safetyResult保存`bashCommandIsSafeAsync_DEPRECATED`，供工具调用后续处理使用。
    const safetyResult = await bashCommandIsSafeAsync_DEPRECATED(input.command)

    // 决策原因 集中保存Bash 工具 bash Command Helpers要一起传递的字段。
    const decisionReason = {
      type: 'other' as const,
      reason:
        safetyResult.behavior === 'ask' && safetyResult.message
          ? safetyResult.message
          : 'This command uses shell operators that require approval for safety',
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: createPermissionRequestMessage(BashTool.name, decisionReason),
      decisionReason,
      // This is an unsafe compound command, so we don't want to suggest rules since we wont be able to allow it
    }
  }

  // 2. Check for piped commands using ParsedCommand (preserves quotes)
  // pipeSegments 集合解析`parsed.getPipeSegments`，供工具调用后续处理使用。
  const pipeSegments = parsed.getPipeSegments()

  // If no pipes (single segment), let normal flow handle it
  // 满足 `pipeSegments.length <= 1` 时，工具调用执行该分支。
  if (pipeSegments.length <= 1) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'No pipes found in command',
    }
  }

  // Strip output redirections from each segment while preserving quotes
  // segments 集合保存`Promise.all`，供工具调用后续处理使用。
  const segments = await Promise.all(
    // 调用 pipeSegments.map，触发工具调用此处需要的副作用。
    pipeSegments.map(segment => buildSegmentWithoutRedirections(segment)),
  )

  // Handle as segmented command
  // 返回 `segmentedCommandPermissionResult(`，作为工具调用这次计算的结果。
  return segmentedCommandPermissionResult(
    input,
    segments,
    bashToolHasPermissionFn,
    checkers,
  )
}
