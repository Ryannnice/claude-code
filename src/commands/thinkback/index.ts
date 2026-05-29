// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 接入 checkStatsigFeatureGate_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'

// thinkback 集中保存命令处理斜杠命令 index要一起传递的字段。
const thinkback = {
  type: 'local-jsx',
  name: 'think-back',
  description: 'Your 2025 Claude Code Year in Review',
  // 这个回调绑定到 isEnabled: () =>，负责命令处理在该局部场景下的响应。
  isEnabled: () =>
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_thinkback'),
  // 这个回调绑定到 load: () => import('./thinkback.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./thinkback.js'),
} satisfies Command

export default thinkback
