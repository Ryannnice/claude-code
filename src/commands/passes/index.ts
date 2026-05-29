// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  checkCachedPassesEligibility,
  getCachedReferrerReward,
} from '../../services/api/referral.js'

export default {
  type: 'local-jsx',
  name: 'passes',
  // 斜杠命令 index在这里处理 `get description() {`，完成这一小步状态转换。
  get description() {
    // reward读取`getCachedReferrerReward`，供命令处理后续处理使用。
    const reward = getCachedReferrerReward()
    // 满足 `reward` 时，命令处理执行该分支。
    if (reward) {
      // 返回 `'Share a free week of Claude Code with friends and earn extra usage'`，作为命令处理这次计算的结果。
      return 'Share a free week of Claude Code with friends and earn extra usage'
    }
    // 返回 `'Share a free week of Claude Code with friends'`，作为命令处理这次计算的结果。
    return 'Share a free week of Claude Code with friends'
  },
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 从 `checkCachedPassesEligibility()` 解构 eligible、hasCache，减少斜杠命令 index对同一对象的重复访问。
    const { eligible, hasCache } = checkCachedPassesEligibility()
    // 返回 `!eligible || !hasCache`，作为命令处理这次计算的结果。
    return !eligible || !hasCache
  },
  // 这个回调绑定到 load: () => import('./passes.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./passes.js'),
} satisfies Command
