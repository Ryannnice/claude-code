// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 接入 checkStatsigFeatureGate_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'

// Hidden command that just plays the animation
// Called by the thinkback skill after generation is complete
// thinkbackPlay 集中保存命令处理斜杠命令 index要一起传递的字段。
const thinkbackPlay = {
  type: 'local',
  name: 'thinkback-play',
  description: 'Play the thinkback animation',
  // 这个回调绑定到 isEnabled: () =>，负责命令处理在该局部场景下的响应。
  isEnabled: () =>
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_thinkback'),
  isHidden: true,
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => import('./thinkback-play.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./thinkback-play.js'),
} satisfies Command

export default thinkbackPlay
