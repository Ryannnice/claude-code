// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 引入 findToolByName、Tools，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tools } from '../Tool.js'
// 接入 extractBashCommentLabel 工具实现，后续工具池会按权限和开关决定是否暴露。
import { extractBashCommentLabel } from '../tools/BashTool/commentLabel.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
// 接入 REPL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { REPL_TOOL_NAME } from '../tools/REPLTool/constants.js'
// 接入 getReplPrimitiveTools 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getReplPrimitiveTools } from '../tools/REPLTool/primitiveTools.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type BranchAction,
  type CommitKind,
  detectGitOperation,
  type PrAction,
} from '../tools/shared/gitOperationTracking.js'
// 接入 TOOL_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TOOL_SEARCH_TOOL_NAME } from '../tools/ToolSearchTool/prompt.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  CollapsedReadSearchGroup,
  CollapsibleMessage,
  RenderableMessage,
  StopHookInfo,
  SystemStopHookSummaryMessage,
} from '../types/message.js'
// 引入 getDisplayPath，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getDisplayPath } from './file.js'
// 引入 isFullscreenEnvEnabled，将 ./fullscreen.js 中已经封装好的能力接到本文件流程里。
import { isFullscreenEnvEnabled } from './fullscreen.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isAutoManagedMemoryFile,
  isAutoManagedMemoryPattern,
  isMemoryDirectory,
  isShellCommandTargetingMemory,
} from './memoryFileDetection.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemOps 集合保存`feature`，供共享工具后续处理使用。
const teamMemOps = feature('TEAMMEM')
  ? (require('./teamMemoryOps.js') as typeof import('./teamMemoryOps.js'))
  : null
// SNIP_TOOL_NAME保存`feature`，供共享工具后续处理使用。
const SNIP_TOOL_NAME = feature('HISTORY_SNIP')
  ? (
      require('../tools/SnipTool/prompt.js') as typeof import('../tools/SnipTool/prompt.js')
    ).SNIP_TOOL_NAME
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Result of checking if a tool use is a search or read operation.
 */
// SearchOrReadResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SearchOrReadResult = {
  isCollapsible: boolean
  isSearch: boolean
  isRead: boolean
  isList: boolean
  isREPL: boolean
  /** True if this is a Write/Edit targeting a memory file */
  isMemoryWrite: boolean
  /**
   * True for meta-operations that should be absorbed into a collapse group
   * without incrementing any count (Snip, ToolSearch). They remain visible
   * in verbose mode via the groupMessages iteration.
   */
  isAbsorbedSilently: boolean
  /** MCP server name when this is an MCP tool */
  mcpServerName?: string
  /** Bash command that is NOT a search/read (under fullscreen mode) */
  isBash?: boolean
}

/**
 * Extract the primary file/directory path from a tool_use input.
 * Handles both `file_path` (Read/Write/Edit) and `path` (Grep/Glob).
 */
// getFilePathFromToolInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFilePathFromToolInput(toolInput: unknown): string | undefined {
  // 用户输入 命名 `toolInput as`，让后续代码直接表达这个值的用途。
  const input = toolInput as
    | { file_path?: string; path?: string; pattern?: string; glob?: string }
    | undefined
  // 返回 `input?.file_path ?? input?.path`，作为共享工具这次计算的结果。
  return input?.file_path ?? input?.path
}

/**
 * Check if a search tool use targets memory files by examining its path, pattern, and glob.
 */
// isMemorySearch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMemorySearch(toolInput: unknown): boolean {
  // 用户输入 命名 `toolInput as`，让后续代码直接表达这个值的用途。
  const input = toolInput as
    | { path?: string; pattern?: string; glob?: string; command?: string }
    | undefined
  // 用户输入缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!input) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Check if the search path targets a memory file or directory (Grep/Glob tools)
  // 满足 `input.path` 时，共享工具执行该分支。
  if (input.path) {
    // 只有 `isAutoManagedMemoryFile(input.path) || isMemoryDirectory(input.path)` 满足时，共享工具才执行该分支。
    if (isAutoManagedMemoryFile(input.path) || isMemoryDirectory(input.path)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // Check glob patterns that indicate memory file access
  // 只有 `input.glob && isAutoManagedMemoryPattern(input.glob)` 满足时，共享工具才执行该分支。
  if (input.glob && isAutoManagedMemoryPattern(input.glob)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // For shell commands (bash grep/rg, PowerShell Select-String, etc.),
  // check if the command targets memory paths
  // 只有 `input.command && isShellCommandTargetingMemory(input.command)` 满足时，共享工具才执行该分支。
  if (input.command && isShellCommandTargetingMemory(input.command)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a Write or Edit tool use targets a memory file and should be collapsed.
 */
// isMemoryWriteOrEdit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMemoryWriteOrEdit(toolName: string, toolInput: unknown): boolean {
  // `toolName` 与 `FILE_WRITE_TOOL_NAME && toolNam...` 不一致时刷新派生状态，避免使用过期结果。
  if (toolName !== FILE_WRITE_TOOL_NAME && toolName !== FILE_EDIT_TOOL_NAME) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 文件路径读取`getFilePathFromToolInput`，供共享工具后续处理使用。
  const filePath = getFilePathFromToolInput(toolInput)
  // 返回 `filePath !== undefined && isAutoManagedMemoryFile(filePath)`，作为共享工具这次计算的结果。
  return filePath !== undefined && isAutoManagedMemoryFile(filePath)
}

// ~5 lines × ~60 cols. Generous static cap — the renderer lets Ink wrap.
// MAX_HINT_CHARS 集合保存`300`，供共享工具 collapse Read Search后续判断或输出使用。
const MAX_HINT_CHARS = 300

/**
 * Format a bash command for the ⎿ hint. Drops blank lines, collapses runs of
 * inline whitespace, then caps total length. Newlines are preserved so the
 * renderer can indent continuation lines under ⎿.
 */
// commandAsHint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function commandAsHint(command: string): string {
  // cleaned 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cleaned =
    '$ ' +
    command
      .split('\n')
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(l => l.replace(/\s+/g, ' ').trim())
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(l => l !== '')
      .join('\n')
  // 返回 `cleaned.length > MAX_HINT_CHARS`，作为共享工具这次计算的结果。
  return cleaned.length > MAX_HINT_CHARS
    ? cleaned.slice(0, MAX_HINT_CHARS - 1) + '…'
    : cleaned
}

/**
 * Checks if a tool is a search/read operation using the tool's isSearchOrReadCommand method.
 * Also treats Write/Edit of memory files as collapsible.
 * Returns detailed information about whether it's a search or read operation.
 */
// getToolSearchOrReadInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolSearchOrReadInfo(
  toolName: string,
  toolInput: unknown,
  tools: Tools,
): SearchOrReadResult {
  // REPL is absorbed silently — its inner tool calls are emitted as virtual
  // messages (isVirtual: true) via newMessages and flow through this function
  // as regular Read/Grep/Bash messages. The REPL wrapper itself contributes
  // no counts and doesn't break the group, so consecutive REPL calls merge.
  // 满足 `toolName === REPL_TOOL_NAME` 时，共享工具执行该分支。
  if (toolName === REPL_TOOL_NAME) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCollapsible: true,
      isSearch: false,
      isRead: false,
      isList: false,
      isREPL: true,
      isMemoryWrite: false,
      isAbsorbedSilently: true,
    }
  }

  // Memory file writes/edits are collapsible
  // 满足 `isMemoryWriteOrEdit(toolName, toolInput)` 时，共享工具执行该分支。
  if (isMemoryWriteOrEdit(toolName, toolInput)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCollapsible: true,
      isSearch: false,
      isRead: false,
      isList: false,
      isREPL: false,
      isMemoryWrite: true,
      isAbsorbedSilently: false,
    }
  }

  // Meta-operations absorbed silently: Snip (context cleanup) and ToolSearch
  // (lazy tool schema loading). Neither should break a collapse group or
  // contribute to its count, but both stay visible in verbose mode.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (feature('HISTORY_SNIP') && toolName === SNIP_TOOL_NAME) ||
    (isFullscreenEnvEnabled() && toolName === TOOL_SEARCH_TOOL_NAME)
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCollapsible: true,
      isSearch: false,
      isRead: false,
      isList: false,
      isREPL: false,
      isMemoryWrite: false,
      isAbsorbedSilently: true,
    }
  }

  // Fallback to REPL primitives: in REPL mode, Bash/Read/Grep/etc. are
  // stripped from the execution tools list, but REPL emits them as virtual
  // messages. Without the fallback they'd return isCollapsible: false and
  // vanish from the summary line.
  // tool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const tool =
    findToolByName(tools, toolName) ??
    findToolByName(getReplPrimitiveTools(), toolName)
  // 满足 `!tool?.isSearchOrReadCommand` 时，共享工具执行该分支。
  if (!tool?.isSearchOrReadCommand) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isCollapsible: false,
      isSearch: false,
      isRead: false,
      isList: false,
      isREPL: false,
      isMemoryWrite: false,
      isAbsorbedSilently: false,
    }
  }
  // The tool's isSearchOrReadCommand method handles its own input validation via safeParse,
  // so passing the raw input is safe. The type assertion is necessary because Tool[] uses
  // the default generic which expects { [x: string]: any }, but we receive unknown at runtime.
  // 结果保存`tool.isSearchOrReadCommand`，供共享工具后续处理使用。
  const result = tool.isSearchOrReadCommand(
    toolInput as { [x: string]: unknown },
  )
  // isList 集合标记共享工具 collapse Read Search是否启用对应路径。
  const isList = result.isList ?? false
  // isCollapsible标记共享工具 collapse Read Search是否启用对应路径。
  const isCollapsible = result.isSearch || result.isRead || isList
  // Under fullscreen mode, non-search/read Bash commands are also collapsible
  // as their own category — "Ran N bash commands" instead of breaking the group.
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    isCollapsible:
      isCollapsible ||
      (isFullscreenEnvEnabled() ? toolName === BASH_TOOL_NAME : false),
    isSearch: result.isSearch,
    isRead: result.isRead,
    isList,
    isREPL: false,
    isMemoryWrite: false,
    isAbsorbedSilently: false,
    ...(tool.isMcp && { mcpServerName: tool.mcpInfo?.serverName }),
    isBash: isFullscreenEnvEnabled()
      ? !isCollapsible && toolName === BASH_TOOL_NAME
      : undefined,
  }
}

/**
 * Check if a tool_use content block is a search/read operation.
 * Returns { isSearch, isRead, isREPL } if it's a collapsible search/read, null otherwise.
 */
// getSearchOrReadFromContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSearchOrReadFromContent(
  content: { type: string; name?: string; input?: unknown } | undefined,
  tools: Tools,
): {
  isSearch: boolean
  isRead: boolean
  isList: boolean
  isREPL: boolean
  isMemoryWrite: boolean
  isAbsorbedSilently: boolean
  mcpServerName?: string
  isBash?: boolean
} | null {
  // 只有 `content?.type === 'tool_use' && content.name` 满足时，共享工具才执行该分支。
  if (content?.type === 'tool_use' && content.name) {
    // info读取`getToolSearchOrReadInfo`，供共享工具后续处理使用。
    const info = getToolSearchOrReadInfo(content.name, content.input, tools)
    // 只有 `info.isCollapsible || info.isREPL` 满足时，共享工具才执行该分支。
    if (info.isCollapsible || info.isREPL) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        isSearch: info.isSearch,
        isRead: info.isRead,
        isList: info.isList,
        isREPL: info.isREPL,
        isMemoryWrite: info.isMemoryWrite,
        isAbsorbedSilently: info.isAbsorbedSilently,
        mcpServerName: info.mcpServerName,
        isBash: info.isBash,
      }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a tool is a search/read operation (for backwards compatibility).
 */
// isToolSearchOrRead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolSearchOrRead(
  toolName: string,
  toolInput: unknown,
  tools: Tools,
): boolean {
  // 返回 `getToolSearchOrReadInfo(toolName, toolInput, tools).isCollapsible`，作为共享工具这次计算的结果。
  return getToolSearchOrReadInfo(toolName, toolInput, tools).isCollapsible
}

/**
 * Get the tool name, input, and search/read info from a message if it's a collapsible tool use.
 * Returns null if the message is not a collapsible tool use.
 */
// getCollapsibleToolInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCollapsibleToolInfo(
  msg: RenderableMessage,
  tools: Tools,
): {
  name: string
  input: unknown
  isSearch: boolean
  isRead: boolean
  isList: boolean
  isREPL: boolean
  isMemoryWrite: boolean
  isAbsorbedSilently: boolean
  mcpServerName?: string
  isBash?: boolean
} | null {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // info读取`getSearchOrReadFromContent`，供共享工具后续处理使用。
    const info = getSearchOrReadFromContent(content, tools)
    // 当 `info && content?.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
    if (info && content?.type === 'tool_use') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: content.name, input: content.input, ...info }
    }
  }
  // 当 `msg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (msg.type === 'grouped_tool_use') {
    // For grouped tool uses, check the first message's input
    // firstContent读取 `msg.messages[0]?.message.content[0]` 对应条目，后续围绕该成员继续处理。
    const firstContent = msg.messages[0]?.message.content[0]
    // info读取`getSearchOrReadFromContent`，供共享工具后续处理使用。
    const info = getSearchOrReadFromContent(
      firstContent
        ? { type: 'tool_use', name: msg.toolName, input: firstContent.input }
        : undefined,
      tools,
    )
    // 当 `info && firstContent?.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
    if (info && firstContent?.type === 'tool_use') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { name: msg.toolName, input: firstContent.input, ...info }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Check if a message is assistant text that should break a group.
 */
// isTextBreaker 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTextBreaker(msg: RenderableMessage): boolean {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // 只有 `content?.type === 'text' && content.text.trim().length > 0` 满足时，共享工具才执行该分支。
    if (content?.type === 'text' && content.text.trim().length > 0) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a message is a non-collapsible tool use that should break a group.
 * This includes tool uses like Edit, Write, etc.
 */
// isNonCollapsibleToolUse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isNonCollapsibleToolUse(
  msg: RenderableMessage,
  tools: Tools,
): boolean {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // 共享工具在这里按实际状态进入对应分支。
    if (
      content?.type === 'tool_use' &&
      !isToolSearchOrRead(content.name, content.input, tools)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 当 `msg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (msg.type === 'grouped_tool_use') {
    // firstContent读取 `msg.messages[0]?.message.content[0]` 对应条目，后续围绕该成员继续处理。
    const firstContent = msg.messages[0]?.message.content[0]
    // 共享工具在这里按实际状态进入对应分支。
    if (
      firstContent?.type === 'tool_use' &&
      !isToolSearchOrRead(msg.toolName, firstContent.input, tools)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isPreToolHookSummary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPreToolHookSummary(
  msg: RenderableMessage,
): msg is SystemStopHookSummaryMessage {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    msg.type === 'system' &&
    msg.subtype === 'stop_hook_summary' &&
    msg.hookLabel === 'PreToolUse'
  )
}

/**
 * Check if a message should be skipped (not break the group, just passed through).
 * This includes thinking blocks, redacted thinking, attachments, etc.
 */
// shouldSkipMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldSkipMessage(msg: RenderableMessage): boolean {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // Skip thinking blocks and other non-text, non-tool content
    // 只有 `content?.type === 'thinking' || content?.type ===` 满足时，共享工具才执行该分支。
    if (content?.type === 'thinking' || content?.type === 'redacted_thinking') {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // Skip attachment messages
  // 当 `msg.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
  if (msg.type === 'attachment') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Skip system messages
  // 当 `msg.type` 匹配 `'system'` 时，共享工具执行对应分支。
  if (msg.type === 'system') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Type predicate: Check if a message is a collapsible tool use.
 */
// isCollapsibleToolUse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCollapsibleToolUse(
  msg: RenderableMessage,
  tools: Tools,
): msg is CollapsibleMessage {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      content?.type === 'tool_use' &&
      isToolSearchOrRead(content.name, content.input, tools)
    )
  }
  // 当 `msg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (msg.type === 'grouped_tool_use') {
    // firstContent读取 `msg.messages[0]?.message.content[0]` 对应条目，后续围绕该成员继续处理。
    const firstContent = msg.messages[0]?.message.content[0]
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      firstContent?.type === 'tool_use' &&
      isToolSearchOrRead(msg.toolName, firstContent.input, tools)
    )
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Type predicate: Check if a message is a tool result for collapsible tools.
 * Returns true if ALL tool results in the message are for tracked collapsible tools.
 */
// isCollapsibleToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCollapsibleToolResult(
  msg: RenderableMessage,
  collapsibleToolUseIds: Set<string>,
): msg is CollapsibleMessage {
  // 当 `msg.type` 匹配 `'user'` 时，共享工具执行对应分支。
  if (msg.type === 'user') {
    // toolResults 集合筛选`content.filter`，供共享工具后续处理使用。
    const toolResults = msg.message.content.filter(
      // 这个回调绑定到 (c): c is { type: 'tool_result'; tool_use_id: string } =>，负责共享工具在该局部场景下的响应。
      (c): c is { type: 'tool_result'; tool_use_id: string } =>
        c.type === 'tool_result',
    )
    // Only return true if there are tool results AND all of them are for collapsible tools
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      toolResults.length > 0 &&
      // 调用 toolResults.every，触发共享工具此处需要的副作用。
      toolResults.every(r => collapsibleToolUseIds.has(r.tool_use_id))
    )
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get all tool use IDs from a single message (handles grouped tool uses).
 */
// getToolUseIdsFromMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolUseIdsFromMessage(msg: RenderableMessage): string[] {
  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // 当 `content?.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
    if (content?.type === 'tool_use') {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [content.id]
    }
  }
  // 当 `msg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (msg.type === 'grouped_tool_use') {
    // 返回 `msg.messages`，作为共享工具这次计算的结果。
    return msg.messages
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(m => {
        // 文本内容读取 `m.message.content[0]` 对应条目，后续围绕该成员继续处理。
        const content = m.message.content[0]
        // 返回 `content.type === 'tool_use' ? content.id : ''`，作为共享工具这次计算的结果。
        return content.type === 'tool_use' ? content.id : ''
      })
      .filter(Boolean)
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get all tool use IDs from a collapsed read/search group.
 */
// getToolUseIdsFromCollapsedGroup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseIdsFromCollapsedGroup(
  message: CollapsedReadSearchGroup,
): string[] {
  // ids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const ids: string[] = []
  // 按顺序遍历 `message.messages` 中的消息，逐个交给共享工具处理。
  for (const msg of message.messages) {
    // ids 集合追加新条目，保持收集顺序与输入顺序一致。
    ids.push(...getToolUseIdsFromMessage(msg))
  }
  // 返回 `ids`，作为共享工具这次计算的结果。
  return ids
}

/**
 * Check if any tool in a collapsed group is in progress.
 */
// hasAnyToolInProgress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAnyToolInProgress(
  message: CollapsedReadSearchGroup,
  inProgressToolUseIDs: Set<string>,
): boolean {
  // 返回 `getToolUseIdsFromCollapsedGroup(message).some(id =>`，作为共享工具这次计算的结果。
  return getToolUseIdsFromCollapsedGroup(message).some(id =>
    inProgressToolUseIDs.has(id),
  )
}

/**
 * Get the underlying NormalizedMessage for display (timestamp/model).
 * Handles nested GroupedToolUseMessage within collapsed groups.
 * Returns a NormalizedAssistantMessage or NormalizedUserMessage (never GroupedToolUseMessage).
 */
// getDisplayMessageFromCollapsed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDisplayMessageFromCollapsed(
  message: CollapsedReadSearchGroup,
): Exclude<CollapsibleMessage, { type: 'grouped_tool_use' }> {
  // firstMsg保存`message.displayMessage`，供共享工具 collapse Read Search后续判断或输出使用。
  const firstMsg = message.displayMessage
  // 当 `firstMsg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (firstMsg.type === 'grouped_tool_use') {
    // 返回 `firstMsg.displayMessage`，作为共享工具这次计算的结果。
    return firstMsg.displayMessage
  }
  // 返回 `firstMsg`，作为共享工具这次计算的结果。
  return firstMsg
}

/**
 * Count the number of tool uses in a message (handles grouped tool uses).
 */
// countToolUses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countToolUses(msg: RenderableMessage): number {
  // 当 `msg.type` 匹配 `'grouped_tool_use'` 时，共享工具执行对应分支。
  if (msg.type === 'grouped_tool_use') {
    // 返回 `msg.messages.length`，作为共享工具这次计算的结果。
    return msg.messages.length
  }
  // 返回 `1`，作为共享工具这次计算的结果。
  return 1
}

/**
 * Extract file paths from read tool inputs in a message.
 * Returns an array of file paths (may have duplicates if same file is read multiple times in one grouped message).
 */
// getFilePathsFromReadMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFilePathsFromReadMessage(msg: RenderableMessage): string[] {
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: string[] = []

  // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (msg.type === 'assistant') {
    // 文本内容保存`msg.message.content[0]`，供共享工具 collapse Read Search后续判断或输出使用。
    const content = msg.message.content[0]
    // 当 `content?.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
    if (content?.type === 'tool_use') {
      // 用户输入保存`content.input as { file_path?: string } | undefined`，供共享工具 collapse Read Search后续判断或输出使用。
      const input = content.input as { file_path?: string } | undefined
      // 满足 `input?.file_path` 时，共享工具执行该分支。
      if (input?.file_path) {
        // 路径列表追加新条目，保持收集顺序与输入顺序一致。
        paths.push(input.file_path)
      }
    }
  // 共享工具 collapse Read Search在这里处理 `} else if (msg.type === 'grouped_tool_use') {`，完成这一小步状态转换。
  } else if (msg.type === 'grouped_tool_use') {
    // 按顺序遍历 `msg.messages` 中的m，逐个交给共享工具处理。
    for (const m of msg.messages) {
      // 文本内容读取 `m.message.content[0]` 对应条目，后续围绕该成员继续处理。
      const content = m.message.content[0]
      // 当 `content?.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
      if (content?.type === 'tool_use') {
        // 用户输入保存`content.input as { file_path?: string } | undefined`，供共享工具 collapse Read Search后续判断或输出使用。
        const input = content.input as { file_path?: string } | undefined
        // 满足 `input?.file_path` 时，共享工具执行该分支。
        if (input?.file_path) {
          // 路径列表追加新条目，保持收集顺序与输入顺序一致。
          paths.push(input.file_path)
        }
      }
    }
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

/**
 * Scan a bash tool result for commit SHAs and PR URLs and push them into the
 * group accumulator. Called only for results whose tool_use_id was recorded
 * in bashCommands (non-search/read bash).
 */
// scanBashResultForGitOps 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scanBashResultForGitOps(
  msg: CollapsibleMessage,
  group: GroupAccumulator,
): void {
  // `msg.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (msg.type !== 'user') return
  // out 命名 `msg.toolUseResult as`，让后续代码直接表达这个值的用途。
  const out = msg.toolUseResult as
    | { stdout?: string; stderr?: string }
    | undefined
  // 只有 `!out?.stdout && !out?.stderr` 满足时，共享工具才执行该分支。
  if (!out?.stdout && !out?.stderr) return
  // git push writes the ref update to stderr — scan both streams.
  // combined保存`(out.stdout ?? '') + '\n' + (out.stderr ?? '')`，供后续判断或组装使用。
  const combined = (out.stdout ?? '') + '\n' + (out.stderr ?? '')
  // 按顺序遍历 `msg.message.content` 中的c，逐个交给共享工具处理。
  for (const c of msg.message.content) {
    // `c.type` 与 `'tool_result'` 不一致时刷新派生状态，避免使用过期结果。
    if (c.type !== 'tool_result') continue
    // 命令读取`get`，供共享工具后续处理使用。
    const command = group.bashCommands?.get(c.tool_use_id)
    // 命令缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!command) continue
    // 从 `detectGitOperation(command, combined)` 解构 commit、push、branch、pr，减少共享工具 collapse Read Search对同一对象的重复访问。
    const { commit, push, branch, pr } = detectGitOperation(command, combined)
    // 满足 `commit) group.commits?.push(commit` 时，共享工具执行该分支。
    if (commit) group.commits?.push(commit)
    // 满足 `push) group.pushes?.push(push` 时，共享工具执行该分支。
    if (push) group.pushes?.push(push)
    // 满足 `branch) group.branches?.push(branch` 时，共享工具执行该分支。
    if (branch) group.branches?.push(branch)
    // 满足 `pr) group.prs?.push(pr` 时，共享工具执行该分支。
    if (pr) group.prs?.push(pr)
    // 只有 `commit || push || branch || pr` 满足时，共享工具才执行该分支。
    if (commit || push || branch || pr) {
      // gitOpBashCount 数量更新为 `(group.gitOpBashCount ?? 0) + 1`，确保共享工具后续读取最新状态。
      group.gitOpBashCount = (group.gitOpBashCount ?? 0) + 1
    }
  }
}

// GroupAccumulator 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type GroupAccumulator = {
  messages: CollapsibleMessage[]
  searchCount: number
  readFilePaths: Set<string>
  // Count of read operations that don't have file paths (e.g., Bash cat commands)
  readOperationCount: number
  // Count of directory-listing operations (ls, tree, du)
  listCount: number
  toolUseIds: Set<string>
  // Memory file operation counts (tracked separately from regular counts)
  memorySearchCount: number
  memoryReadFilePaths: Set<string>
  memoryWriteCount: number
  // Team memory file operation counts (tracked separately)
  teamMemorySearchCount?: number
  teamMemoryReadFilePaths?: Set<string>
  teamMemoryWriteCount?: number
  // Non-memory search patterns for display beneath the collapsed summary
  nonMemSearchArgs: string[]
  /** Most recently added non-memory operation, pre-formatted for display */
  latestDisplayHint: string | undefined
  // MCP tool calls (tracked separately so display says "Queried slack" not "Read N files")
  mcpCallCount?: number
  mcpServerNames?: Set<string>
  // Bash commands that aren't search/read (tracked separately for "Ran N bash commands")
  bashCount?: number
  // Bash tool_use_id → command string, so tool results can be scanned for
  // commit SHAs / PR URLs (surfaced as "committed abc123, created PR #42")
  bashCommands?: Map<string, string>
  commits?: { sha: string; kind: CommitKind }[]
  pushes?: { branch: string }[]
  branches?: { ref: string; action: BranchAction }[]
  prs?: { number: number; url?: string; action: PrAction }[]
  gitOpBashCount?: number
  // PreToolUse hook timing absorbed from hook summary messages
  hookTotalMs: number
  hookCount: number
  hookInfos: StopHookInfo[]
  // relevant_memories attachments absorbed into this group (auto-injected
  // memories, not explicit Read calls). Paths mirrored into readFilePaths +
  // memoryReadFilePaths so the inline "recalled N memories" text is accurate.
  relevantMemories?: { path: string; content: string; mtimeMs: number }[]
}

// createEmptyGroup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createEmptyGroup(): GroupAccumulator {
  // group 集中保存共享工具 collapse Read Search要一起传递的字段。
  const group: GroupAccumulator = {
    messages: [],
    searchCount: 0,
    readFilePaths: new Set(),
    readOperationCount: 0,
    listCount: 0,
    toolUseIds: new Set(),
    memorySearchCount: 0,
    memoryReadFilePaths: new Set(),
    memoryWriteCount: 0,
    nonMemSearchArgs: [],
    latestDisplayHint: undefined,
    hookTotalMs: 0,
    hookCount: 0,
    hookInfos: [],
  }
  // 满足 `feature('TEAMMEM')` 时，共享工具执行该分支。
  if (feature('TEAMMEM')) {
    // teamMemorySearchCount 数量更新为 `0`，确保共享工具后续读取最新状态。
    group.teamMemorySearchCount = 0
    // teamMemoryReadFilePaths 路径数据更新为 `new Set()`，确保共享工具后续读取最新状态。
    group.teamMemoryReadFilePaths = new Set()
    // teamMemoryWriteCount 数量更新为 `0`，确保共享工具后续读取最新状态。
    group.teamMemoryWriteCount = 0
  }
  // mcpCallCount 数量更新为 `0`，确保共享工具后续读取最新状态。
  group.mcpCallCount = 0
  // mcpServerNames 集合更新为 `new Set()`，确保共享工具后续读取最新状态。
  group.mcpServerNames = new Set()
  // 满足 `isFullscreenEnvEnabled()` 时，共享工具执行该分支。
  if (isFullscreenEnvEnabled()) {
    // bashCount 数量更新为 `0`，确保共享工具后续读取最新状态。
    group.bashCount = 0
    // bashCommands 命令数据更新为 `new Map()`，确保共享工具后续读取最新状态。
    group.bashCommands = new Map()
    // commits 集合更新为 `[]`，确保共享工具后续读取最新状态。
    group.commits = []
    // pushes 集合更新为 `[]`，确保共享工具后续读取最新状态。
    group.pushes = []
    // branches 集合更新为 `[]`，确保共享工具后续读取最新状态。
    group.branches = []
    // prs 集合更新为 `[]`，确保共享工具后续读取最新状态。
    group.prs = []
    // gitOpBashCount 数量更新为 `0`，确保共享工具后续读取最新状态。
    group.gitOpBashCount = 0
  }
  // 返回 `group`，作为共享工具这次计算的结果。
  return group
}

// createCollapsedGroup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createCollapsedGroup(
  group: GroupAccumulator,
): CollapsedReadSearchGroup {
  // firstMsg读取 `group.messages[0]!` 对应条目，后续围绕该成员继续处理。
  const firstMsg = group.messages[0]!
  // When file-path-based reads exist, use unique file count (Set.size) only.
  // Adding bash operation count on top would double-count — e.g. Read(README.md)
  // followed by Bash(wc -l README.md) should still show as 1 file, not 2.
  // Fall back to operation count only when there are no file-path reads (bash-only).
  // totalReadCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const totalReadCount =
    group.readFilePaths.size > 0
      ? group.readFilePaths.size
      : group.readOperationCount
  // memoryReadFilePaths ⊆ readFilePaths (both populated from Read tool calls),
  // so this count is safe to subtract from totalReadCount at readCount below.
  // Absorbed relevant_memories attachments are NOT in readFilePaths — added
  // separately after the subtraction so readCount stays correct.
  // toolMemoryReadCount 数量统计`group.memoryReadFilePaths.size` 整理出中间结果，供共享工具 collapse Read Search后续步骤使用。
  const toolMemoryReadCount = group.memoryReadFilePaths.size
  // memoryReadCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const memoryReadCount =
    toolMemoryReadCount + (group.relevantMemories?.length ?? 0)
  // Non-memory read file paths: exclude memory and team memory paths
  // teamMemReadPaths 路径数据保存`feature`，供共享工具后续处理使用。
  const teamMemReadPaths = feature('TEAMMEM')
    ? group.teamMemoryReadFilePaths
    : undefined
  // nonMemReadFilePaths 路径数据筛选`filter`，供共享工具后续处理使用。
  const nonMemReadFilePaths = [...group.readFilePaths].filter(
    // p更新为 `>`，确保共享工具后续读取最新状态。
    p =>
      !group.memoryReadFilePaths.has(p) && !(teamMemReadPaths?.has(p) ?? false),
  )
  // teamMemSearchCount 数量保存`feature`，供共享工具后续处理使用。
  const teamMemSearchCount = feature('TEAMMEM')
    ? (group.teamMemorySearchCount ?? 0)
    : 0
  // teamMemReadCount 数量保存`feature`，供共享工具后续处理使用。
  const teamMemReadCount = feature('TEAMMEM')
    ? (group.teamMemoryReadFilePaths?.size ?? 0)
    : 0
  // teamMemWriteCount 数量保存`feature`，供共享工具后续处理使用。
  const teamMemWriteCount = feature('TEAMMEM')
    ? (group.teamMemoryWriteCount ?? 0)
    : 0
  // 结果 集中保存共享工具 collapse Read Search要一起传递的字段。
  const result: CollapsedReadSearchGroup = {
    type: 'collapsed_read_search',
    // Subtract memory + team memory counts so regular counts only reflect non-memory operations
    searchCount: Math.max(
      0,
      group.searchCount - group.memorySearchCount - teamMemSearchCount,
    ),
    readCount: Math.max(
      0,
      totalReadCount - toolMemoryReadCount - teamMemReadCount,
    ),
    listCount: group.listCount,
    // REPL operations are intentionally not collapsed (see isCollapsible: false at line 32),
    // so replCount in collapsed groups is always 0. The replCount field is kept for
    // sub-agent progress display in AgentTool/UI.tsx which has a separate code path.
    replCount: 0,
    memorySearchCount: group.memorySearchCount,
    memoryReadCount,
    memoryWriteCount: group.memoryWriteCount,
    readFilePaths: nonMemReadFilePaths,
    searchArgs: group.nonMemSearchArgs,
    latestDisplayHint: group.latestDisplayHint,
    messages: group.messages,
    displayMessage: firstMsg,
    uuid: `collapsed-${firstMsg.uuid}` as UUID,
    timestamp: firstMsg.timestamp,
  }
  // 满足 `feature('TEAMMEM')` 时，共享工具执行该分支。
  if (feature('TEAMMEM')) {
    // teamMemorySearchCount 数量更新为 `teamMemSearchCount`，确保共享工具后续读取最新状态。
    result.teamMemorySearchCount = teamMemSearchCount
    // teamMemoryReadCount 数量更新为 `teamMemReadCount`，确保共享工具后续读取最新状态。
    result.teamMemoryReadCount = teamMemReadCount
    // teamMemoryWriteCount 数量更新为 `teamMemWriteCount`，确保共享工具后续读取最新状态。
    result.teamMemoryWriteCount = teamMemWriteCount
  }
  // 满足 `(group.mcpCallCount ?? 0) > 0` 时，共享工具执行该分支。
  if ((group.mcpCallCount ?? 0) > 0) {
    // mcpCallCount 数量更新为 `group.mcpCallCount`，确保共享工具后续读取最新状态。
    result.mcpCallCount = group.mcpCallCount
    // mcpServerNames 集合更新为 `[...(group.mcpServerNames ?? [])]`，确保共享工具后续读取最新状态。
    result.mcpServerNames = [...(group.mcpServerNames ?? [])]
  }
  // 满足 `isFullscreenEnvEnabled()` 时，共享工具执行该分支。
  if (isFullscreenEnvEnabled()) {
    // 满足 `(group.bashCount ?? 0) > 0` 时，共享工具执行该分支。
    if ((group.bashCount ?? 0) > 0) {
      // bashCount 数量更新为 `group.bashCount`，确保共享工具后续读取最新状态。
      result.bashCount = group.bashCount
      // gitOpBashCount 数量更新为 `group.gitOpBashCount`，确保共享工具后续读取最新状态。
      result.gitOpBashCount = group.gitOpBashCount
    }
    // 满足 `(group.commits?.length ?? 0) > 0` 时，共享工具执行该分支。
    if ((group.commits?.length ?? 0) > 0) result.commits = group.commits
    // 满足 `(group.pushes?.length ?? 0) > 0` 时，共享工具执行该分支。
    if ((group.pushes?.length ?? 0) > 0) result.pushes = group.pushes
    // 满足 `(group.branches?.length ?? 0) > 0` 时，共享工具执行该分支。
    if ((group.branches?.length ?? 0) > 0) result.branches = group.branches
    // 满足 `(group.prs?.length ?? 0) > 0` 时，共享工具执行该分支。
    if ((group.prs?.length ?? 0) > 0) result.prs = group.prs
  }
  // 满足 `group.hookCount > 0` 时，共享工具执行该分支。
  if (group.hookCount > 0) {
    // hookTotalMs 集合更新为 `group.hookTotalMs`，确保共享工具后续读取最新状态。
    result.hookTotalMs = group.hookTotalMs
    // hookCount 数量更新为 `group.hookCount`，确保共享工具后续读取最新状态。
    result.hookCount = group.hookCount
    // hookInfos 集合更新为 `group.hookInfos`，确保共享工具后续读取最新状态。
    result.hookInfos = group.hookInfos
  }
  // 只有 `group.relevantMemories && group.relevantMemories.` 满足时，共享工具才执行该分支。
  if (group.relevantMemories && group.relevantMemories.length > 0) {
    // relevantMemories 集合更新为 `group.relevantMemories`，确保共享工具后续读取最新状态。
    result.relevantMemories = group.relevantMemories
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Collapse consecutive Read/Search operations into summary groups.
 *
 * Rules:
 * - Groups consecutive search/read tool uses (Grep, Glob, Read, and Bash search/read commands)
 * - Includes their corresponding tool results in the group
 * - Breaks groups when assistant text appears
 */
// collapseReadSearchGroups 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collapseReadSearchGroups(
  messages: RenderableMessage[],
  tools: Tools,
): RenderableMessage[] {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: RenderableMessage[] = []
  // currentGroup构建`createEmptyGroup`，供共享工具后续处理使用。
  let currentGroup = createEmptyGroup()
  // deferredSkippable 从空数组开始收集，后续循环会按处理顺序追加条目。
  let deferredSkippable: RenderableMessage[] = []

  // flushGroup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function flushGroup(): void {
    // currentGroup.messages 消息数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (currentGroup.messages.length === 0) {
      // 共享工具 collapse Read Search在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(createCollapsedGroup(currentGroup))
    // 按顺序遍历 `deferredSkippable` 中的deferred，逐个交给共享工具处理。
    for (const deferred of deferredSkippable) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(deferred)
    }
    // deferredSkippable更新为 `[]`，确保共享工具后续读取最新状态。
    deferredSkippable = []
    // currentGroup更新为 `createEmptyGroup()`，确保共享工具后续读取最新状态。
    currentGroup = createEmptyGroup()
  }

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // 满足 `isCollapsibleToolUse(msg, tools)` 时，共享工具执行该分支。
    if (isCollapsibleToolUse(msg, tools)) {
      // This is a collapsible tool use - type predicate narrows to CollapsibleMessage
      // toolInfo读取`getCollapsibleToolInfo`，供共享工具后续处理使用。
      const toolInfo = getCollapsibleToolInfo(msg, tools)!

      // 满足 `toolInfo.isMemoryWrite` 时，共享工具执行该分支。
      if (toolInfo.isMemoryWrite) {
        // Memory file write/edit — check if it's team memory
        // 计数统计`countToolUses`，供共享工具后续处理使用。
        const count = countToolUses(msg)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          feature('TEAMMEM') &&
          teamMemOps?.isTeamMemoryWriteOrEdit(toolInfo.name, toolInfo.input)
        ) {
          // 共享工具 collapse Read Search在这里处理 `currentGroup.teamMemoryWriteCount =`，完成这一小步状态转换。
          currentGroup.teamMemoryWriteCount =
            (currentGroup.teamMemoryWriteCount ?? 0) + count
        } else {
          // 共享工具 collapse Read Search在这里处理 `currentGroup.memoryWriteCount += count`，完成这一小步状态转换。
          currentGroup.memoryWriteCount += count
        }
      // 共享工具 collapse Read Search在这里处理 `} else if (toolInfo.isAbsorbedSilently) {`，完成这一小步状态转换。
      } else if (toolInfo.isAbsorbedSilently) {
        // Snip/ToolSearch absorbed silently — no count, no summary text.
        // Hidden from the default view but still shown in verbose mode
        // (Ctrl+O) via the groupMessages iteration in CollapsedReadSearchContent.
      // 共享工具 collapse Read Search在这里处理 `} else if (toolInfo.mcpServerName) {`，完成这一小步状态转换。
      } else if (toolInfo.mcpServerName) {
        // MCP search/read — counted separately so the summary says
        // "Queried slack N times" instead of "Read N files".
        // 计数统计`countToolUses`，供共享工具后续处理使用。
        const count = countToolUses(msg)
        // mcpCallCount 数量更新为 `(currentGroup.mcpCallCount ?? 0) + count`，确保共享工具后续读取最新状态。
        currentGroup.mcpCallCount = (currentGroup.mcpCallCount ?? 0) + count
        // 调用 currentGroup.mcpServerNames?.add(toolInfo.mcpServerName)，完成这一处局部操作。
        currentGroup.mcpServerNames?.add(toolInfo.mcpServerName)
        // 用户输入保存`toolInfo.input as { query?: string } | undefined`，供后续判断或组装使用。
        const input = toolInfo.input as { query?: string } | undefined
        // 满足 `input?.query` 时，共享工具执行该分支。
        if (input?.query) {
          // latestDisplayHint更新为 ``"${input.query}"``，确保共享工具后续读取最新状态。
          currentGroup.latestDisplayHint = `"${input.query}"`
        }
      // 共享工具 collapse Read Search在这里处理 `} else if (isFullscreenEnvEnabled() && toolInfo.isBash) {`，完成这一小步状态转换。
      } else if (isFullscreenEnvEnabled() && toolInfo.isBash) {
        // Non-search/read Bash command — counted separately so the summary
        // says "Ran N bash commands" instead of breaking the group.
        // 计数统计`countToolUses`，供共享工具后续处理使用。
        const count = countToolUses(msg)
        // bashCount 数量更新为 `(currentGroup.bashCount ?? 0) + count`，确保共享工具后续读取最新状态。
        currentGroup.bashCount = (currentGroup.bashCount ?? 0) + count
        // 用户输入 命名 `toolInfo.input as { command?: string } | undefined`，让后续代码直接表达这个值的用途。
        const input = toolInfo.input as { command?: string } | undefined
        // 满足 `input?.command` 时，共享工具执行该分支。
        if (input?.command) {
          // Prefer the stripped `# comment` if present (it's what Claude wrote
          // for the human — same trigger as the comment-as-label tool-use render).
          // 共享工具 collapse Read Search在这里处理 `currentGroup.latestDisplayHint =`，完成这一小步状态转换。
          currentGroup.latestDisplayHint =
            extractBashCommentLabel(input.command) ??
            commandAsHint(input.command)
          // Remember tool_use_id → command so the result (arriving next) can
          // be scanned for commit SHA / PR URL.
          // 逐项读取 `getToolUseIdsFromMessage(msg)` 中的标识符，按输入顺序推进共享工具。
          for (const id of getToolUseIdsFromMessage(msg)) {
            // 调用 currentGroup.bashCommands?.set(id, input.command)，完成这一处局部操作。
            currentGroup.bashCommands?.set(id, input.command)
          }
        }
      // 共享工具 collapse Read Search在这里处理 `} else if (toolInfo.isList) {`，完成这一小步状态转换。
      } else if (toolInfo.isList) {
        // Directory-listing bash commands (ls, tree, du) — counted separately
        // so the summary says "Listed N directories" instead of "Read N files".
        // 共享工具 collapse Read Search在这里处理 `currentGroup.listCount += countToolUses(msg)`，完成这一小步状态转换。
        currentGroup.listCount += countToolUses(msg)
        // 用户输入 命名 `toolInfo.input as { command?: string } | undefined`，让后续代码直接表达这个值的用途。
        const input = toolInfo.input as { command?: string } | undefined
        // 满足 `input?.command` 时，共享工具执行该分支。
        if (input?.command) {
          // latestDisplayHint更新为 `commandAsHint(input.command)`，确保共享工具后续读取最新状态。
          currentGroup.latestDisplayHint = commandAsHint(input.command)
        }
      // 共享工具 collapse Read Search在这里处理 `} else if (toolInfo.isSearch) {`，完成这一小步状态转换。
      } else if (toolInfo.isSearch) {
        // Use the isSearch flag from the tool to properly categorize bash search commands
        // 计数统计`countToolUses`，供共享工具后续处理使用。
        const count = countToolUses(msg)
        // 共享工具 collapse Read Search在这里处理 `currentGroup.searchCount += count`，完成这一小步状态转换。
        currentGroup.searchCount += count
        // Check if the search targets memory files (via path or glob pattern)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          feature('TEAMMEM') &&
          teamMemOps?.isTeamMemorySearch(toolInfo.input)
        ) {
          // 共享工具 collapse Read Search在这里处理 `currentGroup.teamMemorySearchCount =`，完成这一小步状态转换。
          currentGroup.teamMemorySearchCount =
            (currentGroup.teamMemorySearchCount ?? 0) + count
        // 共享工具 collapse Read Search在这里处理 `} else if (isMemorySearch(toolInfo.input)) {`，完成这一小步状态转换。
        } else if (isMemorySearch(toolInfo.input)) {
          // 共享工具 collapse Read Search在这里处理 `currentGroup.memorySearchCount += count`，完成这一小步状态转换。
          currentGroup.memorySearchCount += count
        } else {
          // Regular (non-memory) search — collect pattern for display
          // 用户输入保存`toolInfo.input as { pattern?: string } | undefined`，供共享工具 collapse Read Search后续判断或输出使用。
          const input = toolInfo.input as { pattern?: string } | undefined
          // 满足 `input?.pattern` 时，共享工具执行该分支。
          if (input?.pattern) {
            // nonMemSearchArgs 集合追加新条目，保持收集顺序与输入顺序一致。
            currentGroup.nonMemSearchArgs.push(input.pattern)
            // latestDisplayHint更新为 ``"${input.pattern}"``，确保共享工具后续读取最新状态。
            currentGroup.latestDisplayHint = `"${input.pattern}"`
          }
        }
      } else {
        // For reads, track unique file paths instead of counting operations
        // filePaths 路径数据读取`getFilePathsFromReadMessage`，供共享工具后续处理使用。
        const filePaths = getFilePathsFromReadMessage(msg)
        // 按顺序遍历 `filePaths` 中的文件路径，逐个交给共享工具处理。
        for (const filePath of filePaths) {
          // 调用 currentGroup.readFilePaths.add，触发共享工具此处需要的副作用。
          currentGroup.readFilePaths.add(filePath)
          // 只有 `feature('TEAMMEM') && teamMemOps?.isTeamMemFile(filePath)` 满足时，共享工具才执行该分支。
          if (feature('TEAMMEM') && teamMemOps?.isTeamMemFile(filePath)) {
            // 调用 currentGroup.teamMemoryReadFilePaths?.add(filePath)，完成这一处局部操作。
            currentGroup.teamMemoryReadFilePaths?.add(filePath)
          // 共享工具 collapse Read Search在这里处理 `} else if (isAutoManagedMemoryFile(filePath)) {`，完成这一小步状态转换。
          } else if (isAutoManagedMemoryFile(filePath)) {
            // 调用 currentGroup.memoryReadFilePaths.add，触发共享工具此处需要的副作用。
            currentGroup.memoryReadFilePaths.add(filePath)
          } else {
            // Non-memory file read — update display hint
            // latestDisplayHint更新为 `getDisplayPath(filePath)`，确保共享工具后续读取最新状态。
            currentGroup.latestDisplayHint = getDisplayPath(filePath)
          }
        }
        // If no file paths found (e.g., Bash read commands like ls, cat), count the operations
        // filePaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
        if (filePaths.length === 0) {
          // 共享工具 collapse Read Search在这里处理 `currentGroup.readOperationCount += countToolUses(msg)`，完成这一小步状态转换。
          currentGroup.readOperationCount += countToolUses(msg)
          // Use the Bash command as the display hint (truncated for readability)
          // 用户输入 命名 `toolInfo.input as { command?: string } | undefined`，让后续代码直接表达这个值的用途。
          const input = toolInfo.input as { command?: string } | undefined
          // 满足 `input?.command` 时，共享工具执行该分支。
          if (input?.command) {
            // latestDisplayHint更新为 `commandAsHint(input.command)`，确保共享工具后续读取最新状态。
            currentGroup.latestDisplayHint = commandAsHint(input.command)
          }
        }
      }

      // Track tool use IDs for matching results
      // 逐项读取 `getToolUseIdsFromMessage(msg)` 中的标识符，按输入顺序推进共享工具。
      for (const id of getToolUseIdsFromMessage(msg)) {
        // 调用 currentGroup.toolUseIds.add，触发共享工具此处需要的副作用。
        currentGroup.toolUseIds.add(id)
      }

      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      currentGroup.messages.push(msg)
    // 共享工具 collapse Read Search在这里处理 `} else if (isCollapsibleToolResult(msg, currentGroup.toolUseIds)) {`，完成这一小步状态转换。
    } else if (isCollapsibleToolResult(msg, currentGroup.toolUseIds)) {
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      currentGroup.messages.push(msg)
      // Scan bash results for commit SHAs / PR URLs to surface in the summary
      // 只有 `isFullscreenEnvEnabled() && currentGroup.bashCommands?.size` 满足时，共享工具才执行该分支。
      if (isFullscreenEnvEnabled() && currentGroup.bashCommands?.size) {
        // 调用 scanBashResultForGitOps，触发共享工具此处需要的副作用。
        scanBashResultForGitOps(msg, currentGroup)
      }
    // 共享工具 collapse Read Search在这里处理 `} else if (currentGroup.messages.length > 0 && isPreToolHookSummary(msg...`，完成这一小步状态转换。
    } else if (currentGroup.messages.length > 0 && isPreToolHookSummary(msg)) {
      // Absorb PreToolUse hook summaries into the group instead of deferring
      // 共享工具 collapse Read Search在这里处理 `currentGroup.hookCount += msg.hookCount`，完成这一小步状态转换。
      currentGroup.hookCount += msg.hookCount
      // 共享工具 collapse Read Search在这里处理 `currentGroup.hookTotalMs +=`，完成这一小步状态转换。
      currentGroup.hookTotalMs +=
        msg.totalDurationMs ??
        // 调用 msg.hookInfos.reduce，触发共享工具此处需要的副作用。
        msg.hookInfos.reduce((sum, h) => sum + (h.durationMs ?? 0), 0)
      // hookInfos 集合追加新条目，保持收集顺序与输入顺序一致。
      currentGroup.hookInfos.push(...msg.hookInfos)
    // 共享工具 collapse Read Search在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      currentGroup.messages.length > 0 &&
      msg.type === 'attachment' &&
      msg.attachment.type === 'relevant_memories'
    ) {
      // Absorb auto-injected memory attachments so "recalled N memories"
      // renders inline with "ran N bash commands" instead of as a separate
      // ⏺ block. Do NOT add paths to readFilePaths/memoryReadFilePaths —
      // that would poison the readOperationCount fallback (bash-only reads
      // have no paths; adding memory paths makes readFilePaths.size > 0 and
      // suppresses the fallback). createCollapsedGroup adds .length to
      // memoryReadCount after the readCount subtraction instead.
      // 共享工具 collapse Read Search在这里处理 `currentGroup.relevantMemories ??= []`，完成这一小步状态转换。
      currentGroup.relevantMemories ??= []
      // relevantMemories 集合追加新条目，保持收集顺序与输入顺序一致。
      currentGroup.relevantMemories.push(...msg.attachment.memories)
    // 共享工具 collapse Read Search在这里处理 `} else if (shouldSkipMessage(msg)) {`，完成这一小步状态转换。
    } else if (shouldSkipMessage(msg)) {
      // Don't flush the group for skippable messages (thinking, attachments, system)
      // If a group is in progress, defer these messages to output after the collapsed group
      // This preserves the visual ordering where the collapsed badge appears at the position
      // of the first tool use, not displaced by intervening skippable messages.
      // Exception: nested_memory attachments are pushed through even during a group so
      // ⎿ Loaded lines cluster tightly instead of being split by the badge's marginTop.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        currentGroup.messages.length > 0 &&
        !(msg.type === 'attachment' && msg.attachment.type === 'nested_memory')
      ) {
        // deferredSkippable追加新条目，保持收集顺序与输入顺序一致。
        deferredSkippable.push(msg)
      } else {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(msg)
      }
    // 共享工具 collapse Read Search在这里处理 `} else if (isTextBreaker(msg)) {`，完成这一小步状态转换。
    } else if (isTextBreaker(msg)) {
      // Assistant text breaks the group
      // 调用 flushGroup，触发共享工具此处需要的副作用。
      flushGroup()
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
    // 共享工具 collapse Read Search在这里处理 `} else if (isNonCollapsibleToolUse(msg, tools)) {`，完成这一小步状态转换。
    } else if (isNonCollapsibleToolUse(msg, tools)) {
      // Non-collapsible tool use breaks the group
      // 调用 flushGroup，触发共享工具此处需要的副作用。
      flushGroup()
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
    } else {
      // User messages with non-collapsible tool results break the group
      // 调用 flushGroup，触发共享工具此处需要的副作用。
      flushGroup()
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(msg)
    }
  }

  // 调用 flushGroup，触发共享工具此处需要的副作用。
  flushGroup()
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Generate a summary text for search/read/REPL counts.
 * @param searchCount Number of search operations
 * @param readCount Number of read operations
 * @param isActive Whether the group is still in progress (use present tense) or completed (use past tense)
 * @param replCount Number of REPL executions (optional)
 * @param memoryCounts Optional memory file operation counts
 * @returns Summary text like "Searching for 3 patterns, reading 2 files, REPL'd 5 times…"
 */
// getSearchReadSummaryText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSearchReadSummaryText(
  searchCount: number,
  readCount: number,
  isActive: boolean,
  replCount: number = 0,
  memoryCounts?: {
    memorySearchCount: number
    memoryReadCount: number
    memoryWriteCount: number
    teamMemorySearchCount?: number
    teamMemoryReadCount?: number
    teamMemoryWriteCount?: number
  },
  listCount: number = 0,
): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // Memory operations first
  // 满足 `memoryCounts` 时，共享工具执行该分支。
  if (memoryCounts) {
    // 共享工具 collapse Read Search先整理这一处局部数据，后续分支可以直接读取。
    const { memorySearchCount, memoryReadCount, memoryWriteCount } =
      memoryCounts
    // 满足 `memoryReadCount > 0` 时，共享工具执行该分支。
    if (memoryReadCount > 0) {
      // verb保存`isActive`，供共享工具 collapse Read Search后续判断或输出使用。
      const verb = isActive
        ? parts.length === 0
          ? 'Recalling'
          : 'recalling'
        : parts.length === 0
          ? 'Recalled'
          : 'recalled'
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(
        `${verb} ${memoryReadCount} ${memoryReadCount === 1 ? 'memory' : 'memories'}`,
      )
    }
    // 满足 `memorySearchCount > 0` 时，共享工具执行该分支。
    if (memorySearchCount > 0) {
      // verb保存`isActive`，供共享工具 collapse Read Search后续判断或输出使用。
      const verb = isActive
        ? parts.length === 0
          ? 'Searching'
          : 'searching'
        : parts.length === 0
          ? 'Searched'
          : 'searched'
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`${verb} memories`)
    }
    // 满足 `memoryWriteCount > 0` 时，共享工具执行该分支。
    if (memoryWriteCount > 0) {
      // verb保存`isActive`，供共享工具 collapse Read Search后续判断或输出使用。
      const verb = isActive
        ? parts.length === 0
          ? 'Writing'
          : 'writing'
        : parts.length === 0
          ? 'Wrote'
          : 'wrote'
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(
        `${verb} ${memoryWriteCount} ${memoryWriteCount === 1 ? 'memory' : 'memories'}`,
      )
    }
    // Team memory operations
    // 只有 `feature('TEAMMEM') && teamMemOps` 满足时，共享工具才执行该分支。
    if (feature('TEAMMEM') && teamMemOps) {
      // 调用 teamMemOps.appendTeamMemorySummaryParts，触发共享工具此处需要的副作用。
      teamMemOps.appendTeamMemorySummaryParts(memoryCounts, isActive, parts)
    }
  }

  // 满足 `searchCount > 0` 时，共享工具执行该分支。
  if (searchCount > 0) {
    // searchVerb 命名 `isActive`，让后续代码直接表达这个值的用途。
    const searchVerb = isActive
      ? parts.length === 0
        ? 'Searching for'
        : 'searching for'
      : parts.length === 0
        ? 'Searched for'
        : 'searched for'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `${searchVerb} ${searchCount} ${searchCount === 1 ? 'pattern' : 'patterns'}`,
    )
  }

  // 满足 `readCount > 0` 时，共享工具执行该分支。
  if (readCount > 0) {
    // readVerb保存`isActive`，供后续判断或组装使用。
    const readVerb = isActive
      ? parts.length === 0
        ? 'Reading'
        : 'reading'
      : parts.length === 0
        ? 'Read'
        : 'read'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${readVerb} ${readCount} ${readCount === 1 ? 'file' : 'files'}`)
  }

  // 满足 `listCount > 0` 时，共享工具执行该分支。
  if (listCount > 0) {
    // listVerb 集合 命名 `isActive`，让后续代码直接表达这个值的用途。
    const listVerb = isActive
      ? parts.length === 0
        ? 'Listing'
        : 'listing'
      : parts.length === 0
        ? 'Listed'
        : 'listed'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `${listVerb} ${listCount} ${listCount === 1 ? 'directory' : 'directories'}`,
    )
  }

  // 满足 `replCount > 0` 时，共享工具执行该分支。
  if (replCount > 0) {
    // replVerb 命名 `isActive ? "REPL'ing" : "REPL'd"`，让后续代码直接表达这个值的用途。
    const replVerb = isActive ? "REPL'ing" : "REPL'd"
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${replVerb} ${replCount} ${replCount === 1 ? 'time' : 'times'}`)
  }

  // 文本格式化`parts.join`，供共享工具后续处理使用。
  const text = parts.join(', ')
  // 返回 `isActive ? `${text}…` : text`，作为共享工具这次计算的结果。
  return isActive ? `${text}…` : text
}

/**
 * Summarize a list of recent tool activities into a compact description.
 * Rolls up trailing consecutive search/read operations using pre-computed
 * isSearch/isRead classifications from recording time. Falls back to the
 * last activity's description for non-collapsible tool uses.
 */
// summarizeRecentActivities 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function summarizeRecentActivities(
  activities: readonly {
    activityDescription?: string
    isSearch?: boolean
    isRead?: boolean
  }[],
): string | undefined {
  // activities 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (activities.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // Count trailing search/read activities from the end of the list
  // searchCount 数量保存`0`，供共享工具 collapse Read Search后续判断或输出使用。
  let searchCount = 0
  // readCount 数量保存`0`，供共享工具 collapse Read Search后续判断或输出使用。
  let readCount = 0
  // 循环处理 `let i = activities.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = activities.length - 1; i >= 0; i--) {
    // activity保存`activities[i]!`，供共享工具 collapse Read Search后续判断或输出使用。
    const activity = activities[i]!
    // 满足 `activity.isSearch` 时，共享工具执行该分支。
    if (activity.isSearch) {
      // 共享工具 collapse Read Search在这里处理 `searchCount++`，完成这一小步状态转换。
      searchCount++
    // 共享工具 collapse Read Search在这里处理 `} else if (activity.isRead) {`，完成这一小步状态转换。
    } else if (activity.isRead) {
      // 共享工具 collapse Read Search在这里处理 `readCount++`，完成这一小步状态转换。
      readCount++
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // collapsibleCount 数量 命名 `searchCount + readCount`，让后续代码直接表达这个值的用途。
  const collapsibleCount = searchCount + readCount
  // 满足 `collapsibleCount >= 2` 时，共享工具执行该分支。
  if (collapsibleCount >= 2) {
    // 返回 `getSearchReadSummaryText(searchCount, readCount, true)`，作为共享工具这次计算的结果。
    return getSearchReadSummaryText(searchCount, readCount, true)
  }
  // Fall back to most recent activity with a description (some tools like
  // SendMessage don't implement getActivityDescription, so search backward)
  // 循环处理 `let i = activities.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = activities.length - 1; i >= 0; i--) {
    // 满足 `activities[i]?.activityDescription` 时，共享工具执行该分支。
    if (activities[i]?.activityDescription) {
      // 返回 `activities[i]!.activityDescription`，作为共享工具这次计算的结果。
      return activities[i]!.activityDescription
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}
