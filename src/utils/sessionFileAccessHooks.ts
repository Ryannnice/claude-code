/**
 * Session file access analytics hooks.
 * Tracks access to session memory and transcript files via Read, Grep, Glob tools.
 * Also tracks memdir file access via Read, Grep, Glob, Edit, and Write tools.
 */
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 registerHookCallbacks，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { registerHookCallbacks } from '../bootstrap/state.js'
// 类型依赖 { HookInput, HookJSONOutput } 来自 ../entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { HookInput, HookJSONOutput } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 接入 inputSchema as editInputSchema 工具实现，后续工具池会按权限和开关决定是否暴露。
import { inputSchema as editInputSchema } from '../tools/FileEditTool/types.js'
// 接入 FileReadTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileReadTool } from '../tools/FileReadTool/FileReadTool.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../tools/FileReadTool/prompt.js'
// 接入 FileWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileWriteTool } from '../tools/FileWriteTool/FileWriteTool.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
// 接入 GlobTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GlobTool } from '../tools/GlobTool/GlobTool.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from '../tools/GlobTool/prompt.js'
// 接入 GrepTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GrepTool } from '../tools/GrepTool/GrepTool.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
// 类型依赖 { HookCallback } 来自 ../types/hooks.js，用于校准共享工具的数据契约。
import type { HookCallback } from '../types/hooks.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  detectSessionFileType,
  detectSessionPatternType,
  isAutoMemFile,
  memoryScopeForPath,
} from './memoryFileDetection.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供共享工具后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('../memdir/teamMemPaths.js') as typeof import('../memdir/teamMemPaths.js'))
  : null
// teamMemWatcher保存`feature`，供共享工具后续处理使用。
const teamMemWatcher = feature('TEAMMEM')
  ? (require('../services/teamMemorySync/watcher.js') as typeof import('../services/teamMemorySync/watcher.js'))
  : null
// memoryShapeTelemetry保存`feature`，供共享工具后续处理使用。
const memoryShapeTelemetry = feature('MEMORY_SHAPE_TELEMETRY')
  ? (require('../memdir/memoryShapeTelemetry.js') as typeof import('../memdir/memoryShapeTelemetry.js'))
  : null

/* eslint-enable @typescript-eslint/no-require-imports */
// 引入 getSubagentLogName，将 ./agentContext.js 中已经封装好的能力接到本文件流程里。
import { getSubagentLogName } from './agentContext.js'

/**
 * Extract the file path from a tool input for memdir detection.
 * Covers Read (file_path), Edit (file_path), and Write (file_path).
 */
// getFilePathFromInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFilePathFromInput(
  toolName: string,
  toolInput: unknown,
): string | null {
  // 按照 toolName 的取值选择共享工具的具体处理分支。
  switch (toolName) {
    case FILE_READ_TOOL_NAME: {
      // 解析结果保存`inputSchema.safeParse`，供共享工具后续处理使用。
      const parsed = FileReadTool.inputSchema.safeParse(toolInput)
      // 返回 `parsed.success ? parsed.data.file_path : null`，作为共享工具这次计算的结果。
      return parsed.success ? parsed.data.file_path : null
    }
    case FILE_EDIT_TOOL_NAME: {
      // 解析结果保存`editInputSchema`，供共享工具后续处理使用。
      const parsed = editInputSchema().safeParse(toolInput)
      // 返回 `parsed.success ? parsed.data.file_path : null`，作为共享工具这次计算的结果。
      return parsed.success ? parsed.data.file_path : null
    }
    case FILE_WRITE_TOOL_NAME: {
      // 解析结果保存`inputSchema.safeParse`，供共享工具后续处理使用。
      const parsed = FileWriteTool.inputSchema.safeParse(toolInput)
      // 返回 `parsed.success ? parsed.data.file_path : null`，作为共享工具这次计算的结果。
      return parsed.success ? parsed.data.file_path : null
    }
    default:
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}

/**
 * Extract file type from tool input.
 * Returns the detected session file type or null.
 */
// getSessionFileTypeFromInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSessionFileTypeFromInput(
  toolName: string,
  toolInput: unknown,
): 'session_memory' | 'session_transcript' | null {
  // 按照 toolName 的取值选择共享工具的具体处理分支。
  switch (toolName) {
    case FILE_READ_TOOL_NAME: {
      // 解析结果保存`inputSchema.safeParse`，供共享工具后续处理使用。
      const parsed = FileReadTool.inputSchema.safeParse(toolInput)
      // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!parsed.success) return null
      // 返回 `detectSessionFileType(parsed.data.file_path)`，作为共享工具这次计算的结果。
      return detectSessionFileType(parsed.data.file_path)
    }
    case GREP_TOOL_NAME: {
      // 解析结果保存`inputSchema.safeParse`，供共享工具后续处理使用。
      const parsed = GrepTool.inputSchema.safeParse(toolInput)
      // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!parsed.success) return null
      // Check path if provided
      // 满足 `parsed.data.path` 时，共享工具执行该分支。
      if (parsed.data.path) {
        // pathType 路径数据读取`detectSessionFileType`，供共享工具后续处理使用。
        const pathType = detectSessionFileType(parsed.data.path)
        // 满足 `pathType` 时，共享工具执行该分支。
        if (pathType) return pathType
      }
      // Check glob pattern
      // 满足 `parsed.data.glob` 时，共享工具执行该分支。
      if (parsed.data.glob) {
        // globType读取`detectSessionPatternType`，供共享工具后续处理使用。
        const globType = detectSessionPatternType(parsed.data.glob)
        // 满足 `globType` 时，共享工具执行该分支。
        if (globType) return globType
      }
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    case GLOB_TOOL_NAME: {
      // 解析结果保存`inputSchema.safeParse`，供共享工具后续处理使用。
      const parsed = GlobTool.inputSchema.safeParse(toolInput)
      // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!parsed.success) return null
      // Check path if provided
      // 满足 `parsed.data.path` 时，共享工具执行该分支。
      if (parsed.data.path) {
        // pathType 路径数据读取`detectSessionFileType`，供共享工具后续处理使用。
        const pathType = detectSessionFileType(parsed.data.path)
        // 满足 `pathType` 时，共享工具执行该分支。
        if (pathType) return pathType
      }
      // Check pattern
      // patternType读取`detectSessionPatternType`，供共享工具后续处理使用。
      const patternType = detectSessionPatternType(parsed.data.pattern)
      // 满足 `patternType` 时，共享工具执行该分支。
      if (patternType) return patternType
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    default:
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}

/**
 * Check if a tool use constitutes a memory file access.
 * Detects session memory (via Read/Grep/Glob) and memdir access (via Read/Edit/Write).
 * Uses the same conditions as the PostToolUse session file access hooks.
 */
// isMemoryFileAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMemoryFileAccess(
  toolName: string,
  toolInput: unknown,
): boolean {
  // 当 `getSessionFileTypeFromInput(toolName, toolI...` 匹配 `'session_memory'` 时，共享工具执行对应分支。
  if (getSessionFileTypeFromInput(toolName, toolInput) === 'session_memory') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 文件路径读取`getFilePathFromInput`，供共享工具后续处理使用。
  const filePath = getFilePathFromInput(toolName, toolInput)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    filePath &&
    (isAutoMemFile(filePath) ||
      (feature('TEAMMEM') && teamMemPaths!.isTeamMemFile(filePath)))
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * PostToolUse callback to log session file access events.
 */
// handleSessionFileAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleSessionFileAccess(
  input: HookInput,
  _toolUseID: string | null,
  _signal: AbortSignal | undefined,
): Promise<HookJSONOutput> {
  // `input.hook_event_name` 与 `'PostToolUse'` 不一致时刷新派生状态，避免使用过期结果。
  if (input.hook_event_name !== 'PostToolUse') return {}

  // fileType 文件数据读取`getSessionFileTypeFromInput`，供共享工具后续处理使用。
  const fileType = getSessionFileTypeFromInput(
    input.tool_name,
    input.tool_input,
  )

  // subagentName读取`getSubagentLogName`，供共享工具后续处理使用。
  const subagentName = getSubagentLogName()
  // subagentProps 集合保存`subagentName ? { subagent_name: subagentName } : {}`，供共享工具 session File Access Hooks后续判断或输出使用。
  const subagentProps = subagentName ? { subagent_name: subagentName } : {}

  // 当 `fileType` 匹配 `'session_memory'` 时，共享工具执行对应分支。
  if (fileType === 'session_memory') {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_memory_accessed', { ...subagentProps })
  // 共享工具 session File Access Hooks在这里处理 `} else if (fileType === 'session_transcript') {`，完成这一小步状态转换。
  } else if (fileType === 'session_transcript') {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_transcript_accessed', { ...subagentProps })
  }

  // Memdir access tracking
  // 文件路径读取`getFilePathFromInput`，供共享工具后续处理使用。
  const filePath = getFilePathFromInput(input.tool_name, input.tool_input)
  // 只有 `filePath && isAutoMemFile(filePath)` 满足时，共享工具才执行该分支。
  if (filePath && isAutoMemFile(filePath)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_memdir_accessed', {
      tool: input.tool_name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...subagentProps,
    })

    // 按照 input.tool_name 的取值选择共享工具的具体处理分支。
    switch (input.tool_name) {
      case FILE_READ_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_memdir_file_read', { ...subagentProps })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case FILE_EDIT_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_memdir_file_edit', { ...subagentProps })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case FILE_WRITE_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_memdir_file_write', { ...subagentProps })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }

  // Team memory access tracking
  // 只有 `feature('TEAMMEM') && filePath && teamMemPaths!.isTeamMemFile(filePath)` 满足时，共享工具才执行该分支。
  if (feature('TEAMMEM') && filePath && teamMemPaths!.isTeamMemFile(filePath)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_team_mem_accessed', {
      tool: input.tool_name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...subagentProps,
    })

    // 按照 input.tool_name 的取值选择共享工具的具体处理分支。
    switch (input.tool_name) {
      case FILE_READ_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_team_mem_file_read', { ...subagentProps })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case FILE_EDIT_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_team_mem_file_edit', { ...subagentProps })
        // 调用 teamMemWatcher?.notifyTeamMemoryWrite()，完成这一处局部操作。
        teamMemWatcher?.notifyTeamMemoryWrite()
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case FILE_WRITE_TOOL_NAME:
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_team_mem_file_write', { ...subagentProps })
        // 调用 teamMemWatcher?.notifyTeamMemoryWrite()，完成这一处局部操作。
        teamMemWatcher?.notifyTeamMemoryWrite()
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }

  // 只有 `feature('MEMORY_SHAPE_TELEMETRY') && filePath` 满足时，共享工具才执行该分支。
  if (feature('MEMORY_SHAPE_TELEMETRY') && filePath) {
    // scope保存`memoryScopeForPath`，供共享工具后续处理使用。
    const scope = memoryScopeForPath(filePath)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      scope !== null &&
      (input.tool_name === FILE_EDIT_TOOL_NAME ||
        input.tool_name === FILE_WRITE_TOOL_NAME)
    ) {
      // 共享工具 session File Access Hooks在这里处理 `memoryShapeTelemetry!.logMemoryWriteShape(`，完成这一小步状态转换。
      memoryShapeTelemetry!.logMemoryWriteShape(
        input.tool_name,
        input.tool_input,
        filePath,
        scope,
      )
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {}
}

/**
 * Register session file access tracking hooks.
 * Called during CLI initialization.
 */
// registerSessionFileAccessHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerSessionFileAccessHooks(): void {
  // hook 集中保存共享工具 session File Access Hooks要一起传递的字段。
  const hook: HookCallback = {
    type: 'callback',
    callback: handleSessionFileAccess,
    timeout: 1, // Very short timeout - just logging
    internal: true,
  }

  // 调用 registerHookCallbacks，触发共享工具此处需要的副作用。
  registerHookCallbacks({
    PostToolUse: [
      { matcher: FILE_READ_TOOL_NAME, hooks: [hook] },
      { matcher: GREP_TOOL_NAME, hooks: [hook] },
      { matcher: GLOB_TOOL_NAME, hooks: [hook] },
      { matcher: FILE_EDIT_TOOL_NAME, hooks: [hook] },
      { matcher: FILE_WRITE_TOOL_NAME, hooks: [hook] },
    ],
  })
}
