// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'

// IdeStatus 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type IdeStatus = 'connected' | 'disconnected' | 'pending' | null

// IdeConnectionResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeConnectionResult = {
  status: IdeStatus
  ideName: string | null
}

// useIdeConnectionStatus 封装useIdeConnectionStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIdeConnectionStatus(
  mcpClients?: MCPServerConnection[],
): IdeConnectionResult {
  // 返回 `useMemo(() => {`，作为React hook 状态流这次计算的结果。
  return useMemo(() => {
    // ideClient筛选`find`，供React hook后续处理使用。
    const ideClient = mcpClients?.find(client => client.name === 'ide')
    // ideClient缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!ideClient) {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { status: null, ideName: null }
    }
    // Extract IDE name from config if available
    // 配置保存`ideClient.config`，供后续判断或组装使用。
    const config = ideClient.config
    // ideName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const ideName =
      config.type === 'sse-ide' || config.type === 'ws-ide'
        ? config.ideName
        : null
    // 当 `ideClient.type` 匹配 `'connected'` 时，React hook执行对应分支。
    if (ideClient.type === 'connected') {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { status: 'connected', ideName }
    }
    // 当 `ideClient.type` 匹配 `'pending'` 时，React hook执行对应分支。
    if (ideClient.type === 'pending') {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { status: 'pending', ideName }
    }
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return { status: 'disconnected', ideName }
  }, [mcpClients])
}
