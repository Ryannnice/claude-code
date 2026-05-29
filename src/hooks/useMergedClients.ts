// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'

// mergeClients 封装useMergedClients的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergeClients(
  initialClients: MCPServerConnection[] | undefined,
  mcpClients: readonly MCPServerConnection[] | undefined,
): MCPServerConnection[] {
  // 组合条件 `initialClients && mcpClients && mcpClients.length` 成立时，React hook 状态流才启用这条专门路径。
  if (initialClients && mcpClients && mcpClients.length > 0) {
    // 返回 `uniqBy([...initialClients, ...mcpClients], 'name')`，作为React hook 状态流这次计算的结果。
    return uniqBy([...initialClients, ...mcpClients], 'name')
  }
  // 返回 `initialClients || []`，作为React hook 状态流这次计算的结果。
  return initialClients || []
}

// useMergedClients 封装useMergedClients的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMergedClients(
  initialClients: MCPServerConnection[] | undefined,
  mcpClients: MCPServerConnection[] | undefined,
): MCPServerConnection[] {
  // 返回 `useMemo(`，作为React hook 状态流这次计算的结果。
  return useMemo(
    // 这个回调绑定到 () => mergeClients(initialClients, mcpClients),，负责React hook 状态流在该局部场景下的响应。
    () => mergeClients(initialClients, mcpClients),
    [initialClients, mcpClients],
  )
}
