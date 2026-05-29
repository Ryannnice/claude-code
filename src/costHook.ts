// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 引入 formatTotalCost、saveCurrentSessionCosts，将 ./cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { formatTotalCost, saveCurrentSessionCosts } from './cost-tracker.js'
// 复用 hasConsoleBillingAccess 工具函数，把通用处理留在 ./utils/billing.js 中维护。
import { hasConsoleBillingAccess } from './utils/billing.js'
// 类型依赖 { FpsMetrics } 来自 ./utils/fpsTracker.js，用于校准cost Hook的数据契约。
import type { FpsMetrics } from './utils/fpsTracker.js'

// useCostSummary 封装costHook的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCostSummary(
  getFpsMetrics?: () => FpsMetrics | undefined,
): void {
  // 调用 useEffect，触发cost Hook此处需要的副作用。
  useEffect(() => {
    // f封装成回调，供cost Hook在事件触发或异步步骤中调用。
    const f = () => {
      // 满足 `hasConsoleBillingAccess()` 时，cost Hook执行该分支。
      if (hasConsoleBillingAccess()) {
        // 向标准输出写入cost Hook要展示给用户的文本。
        process.stdout.write('\n' + formatTotalCost() + '\n')
      }

      // 调用 saveCurrentSessionCosts，触发cost Hook此处需要的副作用。
      saveCurrentSessionCosts(getFpsMetrics?.())
    }
    // 调用 process.on，触发cost Hook此处需要的副作用。
    process.on('exit', f)
    // 返回 `() => {`，作为cost Hook这次计算的结果。
    return () => {
      // 调用 process.off，触发cost Hook此处需要的副作用。
      process.off('exit', f)
    }
  }, [])
}
