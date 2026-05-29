// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react'
// 整理这一组导入，让服务层 claude Ai Limits Hook后续逻辑可以直接复用这些外部能力。
import {
  type ClaudeAILimits,
  currentLimits,
  statusListeners,
} from './claudeAiLimits.js'

// useClaudeAiLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useClaudeAiLimits(): ClaudeAILimits {
  // limits 集合 由 React state 持有，setLimits 会在用户操作或异步结果返回时触发刷新。
  const [limits, setLimits] = useState<ClaudeAILimits>({ ...currentLimits })

  // 调用 useEffect，触发服务层 claude Ai Limits Hook此处需要的副作用。
  useEffect(() => {
    // listener 集合封装成回调，供服务层 claude Ai Limits Hook在事件触发或异步步骤中调用。
    const listener = (newLimits: ClaudeAILimits) => {
      // setLimits 写入新的状态值，使服务层 claude Ai Limits Hook后续读取保持一致。
      setLimits({ ...newLimits })
    }
    // 调用 statusListeners.add，触发服务层 claude Ai Limits Hook此处需要的副作用。
    statusListeners.add(listener)

    // 返回 `() => {`，作为服务层 claude Ai Limits Hook这次计算的结果。
    return () => {
      // 调用 statusListeners.delete，触发服务层 claude Ai Limits Hook此处需要的副作用。
      statusListeners.delete(listener)
    }
  }, [])

  // 返回 `limits`，作为服务层 claude Ai Limits Hook这次计算的结果。
  return limits
}
