// 引入 isTeamMemFile，将 ../memdir/teamMemPaths.js 中已经封装好的能力接到本文件流程里。
import { isTeamMemFile } from '../memdir/teamMemPaths.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { isTeamMemFile }

/**
 * Check if a search tool use targets team memory files by examining its path.
 */
// isTeamMemorySearch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemorySearch(toolInput: unknown): boolean {
  // 用户输入保存`toolInput as`，供后续判断或组装使用。
  const input = toolInput as
    | { path?: string; pattern?: string; glob?: string }
    | undefined
  // 用户输入缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!input) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 只有 `input.path && isTeamMemFile(input.path)` 满足时，共享工具才执行该分支。
  if (input.path && isTeamMemFile(input.path)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a Write or Edit tool use targets a team memory file.
 */
// isTeamMemoryWriteOrEdit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemoryWriteOrEdit(
  toolName: string,
  toolInput: unknown,
): boolean {
  // `toolName` 与 `FILE_WRITE_TOOL_NAME && toolNam...` 不一致时刷新派生状态，避免使用过期结果。
  if (toolName !== FILE_WRITE_TOOL_NAME && toolName !== FILE_EDIT_TOOL_NAME) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 用户输入保存`toolInput as { file_path?: string; path?: string } | unde...`，供共享工具 team Memory Ops后续判断或输出使用。
  const input = toolInput as { file_path?: string; path?: string } | undefined
  // 文件路径保存`input?.file_path ?? input?.path`，供共享工具 team Memory Ops后续判断或输出使用。
  const filePath = input?.file_path ?? input?.path
  // 返回 `filePath !== undefined && isTeamMemFile(filePath)`，作为共享工具这次计算的结果。
  return filePath !== undefined && isTeamMemFile(filePath)
}

/**
 * Append team memory summary parts to the parts array.
 * Encapsulates all team memory verb/string logic for getSearchReadSummaryText.
 */
// appendTeamMemorySummaryParts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function appendTeamMemorySummaryParts(
  memoryCounts: {
    teamMemoryReadCount?: number
    teamMemorySearchCount?: number
    teamMemoryWriteCount?: number
  },
  isActive: boolean,
  parts: string[],
): void {
  // teamReadCount 数量保存`memoryCounts.teamMemoryReadCount ?? 0`，供共享工具 team Memory Ops后续判断或输出使用。
  const teamReadCount = memoryCounts.teamMemoryReadCount ?? 0
  // teamSearchCount 数量保存`memoryCounts.teamMemorySearchCount ?? 0`，供共享工具 team Memory Ops后续判断或输出使用。
  const teamSearchCount = memoryCounts.teamMemorySearchCount ?? 0
  // teamWriteCount 数量保存`memoryCounts.teamMemoryWriteCount ?? 0`，供共享工具 team Memory Ops后续判断或输出使用。
  const teamWriteCount = memoryCounts.teamMemoryWriteCount ?? 0
  // 满足 `teamReadCount > 0` 时，共享工具执行该分支。
  if (teamReadCount > 0) {
    // verb保存`isActive`，供后续判断或组装使用。
    const verb = isActive
      ? parts.length === 0
        ? 'Recalling'
        : 'recalling'
      : parts.length === 0
        ? 'Recalled'
        : 'recalled'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `${verb} ${teamReadCount} team ${teamReadCount === 1 ? 'memory' : 'memories'}`,
    )
  }
  // 满足 `teamSearchCount > 0` 时，共享工具执行该分支。
  if (teamSearchCount > 0) {
    // verb保存`isActive`，供后续判断或组装使用。
    const verb = isActive
      ? parts.length === 0
        ? 'Searching'
        : 'searching'
      : parts.length === 0
        ? 'Searched'
        : 'searched'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${verb} team memories`)
  }
  // 满足 `teamWriteCount > 0` 时，共享工具执行该分支。
  if (teamWriteCount > 0) {
    // verb保存`isActive`，供后续判断或组装使用。
    const verb = isActive
      ? parts.length === 0
        ? 'Writing'
        : 'writing'
      : parts.length === 0
        ? 'Wrote'
        : 'wrote'
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `${verb} ${teamWriteCount} team ${teamWriteCount === 1 ? 'memory' : 'memories'}`,
    )
  }
}
