// 引入 DIAMOND_FILLED、DIAMOND_OPEN，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../constants/figures.js'
// 复用 count 工具函数，把通用处理留在 ../utils/array.js 中维护。
import { count } from '../utils/array.js'
// 类型依赖 { BackgroundTaskState } 来自 ./types.js，用于校准pill Label的数据契约。
import type { BackgroundTaskState } from './types.js'

/**
 * Produces the compact footer-pill label for a set of background tasks.
 * Used by both the footer pill and the turn-duration transcript line so the
 * two surfaces agree on terminology.
 */
// getPillLabel 封装pillLabel的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPillLabel(tasks: BackgroundTaskState[]): string {
  // n保存 `tasks.length` 的判断结果，供pill Label后续分支直接复用。
  const n = tasks.length
  // allSameType筛选`tasks.every`，供pill Label后续处理使用。
  const allSameType = tasks.every(t => t.type === tasks[0]!.type)

  // 满足 `allSameType` 时，pill Label执行该分支。
  if (allSameType) {
    // 按照 tasks[0]!.type 的取值选择pill Label的具体处理分支。
    switch (tasks[0]!.type) {
      case 'local_bash': {
        // monitors 集合统计`count`，供pill Label后续处理使用。
        const monitors = count(
          tasks,
          // t更新为 `> t.type === 'local_bash' && t.kind === 'monitor'`，确保pillLabel后续读取最新状态。
          t => t.type === 'local_bash' && t.kind === 'monitor',
        )
        // shells 集合 命名 `n - monitors`，让后续代码直接表达这个值的用途。
        const shells = n - monitors
        // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
        const parts: string[] = []
        // 满足 `shells > 0` 时，pill Label执行该分支。
        if (shells > 0)
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(shells === 1 ? '1 shell' : `${shells} shells`)
        // 满足 `monitors > 0` 时，pill Label执行该分支。
        if (monitors > 0)
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(monitors === 1 ? '1 monitor' : `${monitors} monitors`)
        // 返回 `parts.join(', ')`，作为pill Label这次计算的结果。
        return parts.join(', ')
      }
      case 'in_process_teammate': {
        // teamCount 数量保存`Set`，供pill Label后续处理使用。
        const teamCount = new Set(
          // 调用 tasks.map，触发pill Label此处需要的副作用。
          tasks.map(t =>
            t.type === 'in_process_teammate' ? t.identity.teamName : '',
          ),
        ).size
        // 返回 `teamCount === 1 ? '1 team' : `${teamCount} teams``，作为pill Label这次计算的结果。
        return teamCount === 1 ? '1 team' : `${teamCount} teams`
      }
      case 'local_agent':
        // 返回 `n === 1 ? '1 local agent' : `${n} local agents``，作为pill Label这次计算的结果。
        return n === 1 ? '1 local agent' : `${n} local agents`
      case 'remote_agent': {
        // first 命名 `tasks[0]!`，让后续代码直接表达这个值的用途。
        const first = tasks[0]!
        // Per design mockup: ◇ open diamond while running/needs-input,
        // ◆ filled once ExitPlanMode is awaiting approval.
        // 组合条件 `n === 1 && first.type === 'remote_agent' && first` 成立时，pill Label才启用这条专门路径。
        if (n === 1 && first.type === 'remote_agent' && first.isUltraplan) {
          // 按照 first.ultraplanPhase 的取值选择pill Label的具体处理分支。
          switch (first.ultraplanPhase) {
            case 'plan_ready':
              // 返回 ``${DIAMOND_FILLED} ultraplan ready``，作为pill Label这次计算的结果。
              return `${DIAMOND_FILLED} ultraplan ready`
            case 'needs_input':
              // 返回 ``${DIAMOND_OPEN} ultraplan needs your input``，作为pill Label这次计算的结果。
              return `${DIAMOND_OPEN} ultraplan needs your input`
            default:
              // 返回 ``${DIAMOND_OPEN} ultraplan``，作为pill Label这次计算的结果。
              return `${DIAMOND_OPEN} ultraplan`
          }
        }
        // 返回 `n === 1`，作为pill Label这次计算的结果。
        return n === 1
          ? `${DIAMOND_OPEN} 1 cloud session`
          : `${DIAMOND_OPEN} ${n} cloud sessions`
      }
      case 'local_workflow':
        // 返回 `n === 1 ? '1 background workflow' : `${n} background workflows``，作为pill Label这次计算的结果。
        return n === 1 ? '1 background workflow' : `${n} background workflows`
      case 'monitor_mcp':
        // 返回 `n === 1 ? '1 monitor' : `${n} monitors``，作为pill Label这次计算的结果。
        return n === 1 ? '1 monitor' : `${n} monitors`
      case 'dream':
        // 返回 `'dreaming'`，作为pill Label这次计算的结果。
        return 'dreaming'
    }
  }

  // 返回 ``${n} background ${n === 1 ? 'task' : 'tasks'}``，作为pill Label这次计算的结果。
  return `${n} background ${n === 1 ? 'task' : 'tasks'}`
}

/**
 * True when the pill should show the dimmed " · ↓ to view" call-to-action.
 * Per the state diagram: only the two attention states (needs_input,
 * plan_ready) surface the CTA; plain running shows just the diamond + label.
 */
// pillNeedsCta 封装pillLabel的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pillNeedsCta(tasks: BackgroundTaskState[]): boolean {
  // `tasks.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (tasks.length !== 1) return false
  // t保存`tasks[0]!`，供pill Label后续判断或输出使用。
  const t = tasks[0]!
  // 返回 `(`，作为pill Label这次计算的结果。
  return (
    t.type === 'remote_agent' &&
    t.isUltraplan === true &&
    t.ultraplanPhase !== undefined
  )
}
