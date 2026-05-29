/**
 * Tracks commands recently denied by the auto mode classifier.
 * Populated from useCanUseTool.ts, read from RecentDenialsTab.tsx in /permissions.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'

// AutoModeDenial 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoModeDenial = {
  toolName: string
  /** Human-readable description of the denied command (e.g. bash command string) */
  display: string
  reason: string
  timestamp: number
}

// DENIALS 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
let DENIALS: readonly AutoModeDenial[] = []
// MAX_DENIALS 集合保存`20`，供后续判断或组装使用。
const MAX_DENIALS = 20

// recordAutoModeDenial 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordAutoModeDenial(denial: AutoModeDenial): void {
  // 满足 `!feature('TRANSCRIPT_CLASSIFIER')` 时，共享工具执行该分支。
  if (!feature('TRANSCRIPT_CLASSIFIER')) return
  // DENIALS 集合更新为 `[denial, ...DENIALS.slice(0, MAX_DENIALS - 1)]`，确保共享工具后续读取最新状态。
  DENIALS = [denial, ...DENIALS.slice(0, MAX_DENIALS - 1)]
}

// getAutoModeDenials 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeDenials(): readonly AutoModeDenial[] {
  // 返回 `DENIALS`，作为共享工具这次计算的结果。
  return DENIALS
}
