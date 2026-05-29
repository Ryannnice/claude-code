// 引入 checkOpus1mAccess、checkSonnet1mAccess，将 ./check1mAccess.js 中已经封装好的能力接到本文件流程里。
import { checkOpus1mAccess, checkSonnet1mAccess } from './check1mAccess.js'
// 引入 getUserSpecifiedModelSetting，将 ./model.js 中已经封装好的能力接到本文件流程里。
import { getUserSpecifiedModelSetting } from './model.js'

// @[MODEL LAUNCH]: Add a branch for the new model if it supports a 1M context upgrade path.
/**
 * Get available model upgrade for more context
 * Returns null if no upgrade available or user already has max context
 */
// getAvailableUpgrade 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAvailableUpgrade(): {
  alias: string
  name: string
  multiplier: number
} | null {
  // currentModelSetting读取`getUserSpecifiedModelSetting`，供共享工具后续处理使用。
  const currentModelSetting = getUserSpecifiedModelSetting()
  // 只有 `currentModelSetting === 'opus' && checkOpus1mAccess()` 满足时，共享工具才执行该分支。
  if (currentModelSetting === 'opus' && checkOpus1mAccess()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      alias: 'opus[1m]',
      name: 'Opus 1M',
      multiplier: 5,
    }
  // 模型工具 context Window Upgrade Check在这里处理 `} else if (currentModelSetting === 'sonnet' && checkSonnet1mAccess()) {`，完成这一小步状态转换。
  } else if (currentModelSetting === 'sonnet' && checkSonnet1mAccess()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      alias: 'sonnet[1m]',
      name: 'Sonnet 1M',
      multiplier: 5,
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Get upgrade message for different contexts
 */
// getUpgradeMessage 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUpgradeMessage(context: 'warning' | 'tip'): string | null {
  // upgrade读取`getAvailableUpgrade`，供共享工具后续处理使用。
  const upgrade = getAvailableUpgrade()
  // upgrade缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!upgrade) return null

  // 按照 context 的取值选择共享工具的具体处理分支。
  switch (context) {
    case 'warning':
      // 返回 ``/model ${upgrade.alias}``，作为共享工具这次计算的结果。
      return `/model ${upgrade.alias}`
    case 'tip':
      // 返回 ``Tip: You have access to ${upgrade.name} with ${upgrade.multiplier}x mo...`，作为共享工具这次计算的结果。
      return `Tip: You have access to ${upgrade.name} with ${upgrade.multiplier}x more context`
    default:
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
  }
}
