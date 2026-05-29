// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 类型依赖 { Tools, ToolPermissionContext } 来自 ../Tool.js，用于校准React hook 状态流的数据契约。
import type { Tools, ToolPermissionContext } from '../Tool.js'
// 引入 assembleToolPool，将 ../tools.js 中已经封装好的能力接到本文件流程里。
import { assembleToolPool } from '../tools.js'
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js'
// 复用 mergeAndFilterTools 工具函数，把通用处理留在 ../utils/toolPool.js 中维护。
import { mergeAndFilterTools } from '../utils/toolPool.js'

/**
 * React hook that assembles the full tool pool for the REPL.
 *
 * Uses assembleToolPool() (the shared pure function used by both REPL and runAgent)
 * to combine built-in tools with MCP tools, applying deny rules and deduplication.
 * Any extra initialTools are merged on top.
 *
 * @param initialTools - Extra tools to include (built-in + startup MCP from props).
 *   These are merged with the assembled pool and take precedence in deduplication.
 * @param mcpTools - MCP tools discovered dynamically (from mcp state)
 * @param toolPermissionContext - Permission context for filtering
 */
// useMergedTools 封装useMergedTools的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMergedTools(
  initialTools: Tools,
  mcpTools: Tools,
  toolPermissionContext: ToolPermissionContext,
): Tools {
  // replBridgeEnabled标记React hook use Merged...是否启用对应路径。
  let replBridgeEnabled = false
  // replBridgeOutboundOnly标记React hook use Merged...是否启用对应路径。
  let replBridgeOutboundOnly = false
  // 返回 `useMemo(() => {`，作为React hook 状态流这次计算的结果。
  return useMemo(() => {
    // assembleToolPool is the shared function that both REPL and runAgent use.
    // It handles: getTools() + MCP deny-rule filtering + dedup + MCP CLI exclusion.
    // assembled保存`assembleToolPool`，供React hook后续处理使用。
    const assembled = assembleToolPool(toolPermissionContext, mcpTools)

    // 返回 `mergeAndFilterTools(`，作为React hook 状态流这次计算的结果。
    return mergeAndFilterTools(
      initialTools,
      assembled,
      toolPermissionContext.mode,
    )
  }, [
    initialTools,
    mcpTools,
    toolPermissionContext,
    replBridgeEnabled,
    replBridgeOutboundOnly,
  ])
}
