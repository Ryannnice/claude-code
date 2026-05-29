// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getSubscriptionType } from '../../utils/auth.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// upgrade 集中保存命令处理斜杠命令 index要一起传递的字段。
const upgrade = {
  type: 'local-jsx',
  name: 'upgrade',
  description: 'Upgrade to Max for higher rate limits and more Opus',
  availability: ['claude-ai'],
  // 这个回调绑定到 isEnabled: () =>，负责命令处理在该局部场景下的响应。
  isEnabled: () =>
    !isEnvTruthy(process.env.DISABLE_UPGRADE_COMMAND) &&
    getSubscriptionType() !== 'enterprise',
  // 这个回调绑定到 load: () => import('./upgrade.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./upgrade.js'),
} satisfies Command

export default upgrade
