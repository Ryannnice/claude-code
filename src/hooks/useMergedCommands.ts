// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 类型依赖 { Command } 来自 ../commands.js，用于校准React hook 状态流的数据契约。
import type { Command } from '../commands.js'

// useMergedCommands 封装useMergedCommands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMergedCommands(
  initialCommands: Command[],
  mcpCommands: Command[],
): Command[] {
  // 返回 `useMemo(() => {`，作为React hook 状态流这次计算的结果。
  return useMemo(() => {
    // 满足 `mcpCommands.length > 0` 时，React hook执行该分支。
    if (mcpCommands.length > 0) {
      // 返回 `uniqBy([...initialCommands, ...mcpCommands], 'name')`，作为React hook 状态流这次计算的结果。
      return uniqBy([...initialCommands, ...mcpCommands], 'name')
    }
    // 返回 `initialCommands`，作为React hook 状态流这次计算的结果。
    return initialCommands
  }, [initialCommands, mcpCommands])
}
