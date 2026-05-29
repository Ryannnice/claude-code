// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isOverageProvisioningAllowed 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isOverageProvisioningAllowed } from '../../utils/auth.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// isExtraUsageAllowed 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isExtraUsageAllowed(): boolean {
  // 满足 `isEnvTruthy(process.env.DISABLE_EXTRA_USAGE_COMMAND)` 时，命令处理执行该分支。
  if (isEnvTruthy(process.env.DISABLE_EXTRA_USAGE_COMMAND)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `isOverageProvisioningAllowed()`，作为命令处理这次计算的结果。
  return isOverageProvisioningAllowed()
}

// extraUsage 集中保存命令处理斜杠命令 index要一起传递的字段。
export const extraUsage = {
  type: 'local-jsx',
  name: 'extra-usage',
  description: 'Configure extra usage to keep working when limits are hit',
  // 这个回调绑定到 isEnabled: () => isExtraUsageAllowed() && !getIsNonInteractiveSession(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isExtraUsageAllowed() && !getIsNonInteractiveSession(),
  // 这个回调绑定到 load: () => import('./extra-usage.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./extra-usage.js'),
} satisfies Command

// extraUsageNonInteractive 集中保存命令处理斜杠命令 index要一起传递的字段。
export const extraUsageNonInteractive = {
  type: 'local',
  name: 'extra-usage',
  supportsNonInteractive: true,
  description: 'Configure extra usage to keep working when limits are hit',
  // 这个回调绑定到 isEnabled: () => isExtraUsageAllowed() && getIsNonInteractiveSession(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isExtraUsageAllowed() && getIsNonInteractiveSession(),
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!getIsNonInteractiveSession()`，作为命令处理这次计算的结果。
    return !getIsNonInteractiveSession()
  },
  // 这个回调绑定到 load: () => import('./extra-usage-noninteractive.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./extra-usage-noninteractive.js'),
} satisfies Command
