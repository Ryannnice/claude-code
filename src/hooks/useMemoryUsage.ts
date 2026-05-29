// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react'
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts'

// MemoryUsageStatus 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryUsageStatus = 'normal' | 'high' | 'critical'

// MemoryUsageInfo 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryUsageInfo = {
  heapUsed: number
  status: MemoryUsageStatus
}

// HIGH_MEMORY_THRESHOLD保存`1.5 * 1024 * 1024 * 1024 // 1.5GB in bytes`，供React hook use Memory...后续判断或输出使用。
const HIGH_MEMORY_THRESHOLD = 1.5 * 1024 * 1024 * 1024 // 1.5GB in bytes
// CRITICAL_MEMORY_THRESHOLD保存`2.5 * 1024 * 1024 * 1024 // 2.5GB in bytes`，供React hook use Memory...后续判断或输出使用。
const CRITICAL_MEMORY_THRESHOLD = 2.5 * 1024 * 1024 * 1024 // 2.5GB in bytes

/**
 * Hook to monitor Node.js process memory usage.
 * Polls every 10 seconds; returns null while status is 'normal'.
 */
// useMemoryUsage 封装useMemoryUsage的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMemoryUsage(): MemoryUsageInfo | null {
  // memoryUsage 由 React state 持有，setMemoryUsage 会在用户操作或异步结果返回时触发刷新。
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsageInfo | null>(null)

  // 调用 useInterval，触发React hook此处需要的副作用。
  useInterval(() => {
    // heapUsed保存`process.memoryUsage`，供React hook后续处理使用。
    const heapUsed = process.memoryUsage().heapUsed
    // status 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const status: MemoryUsageStatus =
      heapUsed >= CRITICAL_MEMORY_THRESHOLD
        ? 'critical'
        : heapUsed >= HIGH_MEMORY_THRESHOLD
          ? 'high'
          : 'normal'
    // setMemoryUsage 写入新的状态值，使React hook 状态流后续读取保持一致。
    setMemoryUsage(prev => {
      // Bail when status is 'normal' — nothing is shown, so heapUsed is
      // irrelevant and we avoid re-rendering the whole Notifications subtree
      // every 10 seconds for the 99%+ of users who never reach 1.5GB.
      // 当 `status` 匹配 `'normal'` 时，React hook执行对应分支。
      if (status === 'normal') return prev === null ? prev : null
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { heapUsed, status }
    })
  }, 10_000)

  // 返回 `memoryUsage`，作为React hook 状态流这次计算的结果。
  return memoryUsage
}
