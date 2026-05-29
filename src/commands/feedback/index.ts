// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'

// feedback 集中保存命令处理斜杠命令 index要一起传递的字段。
const feedback = {
  aliases: ['bug'],
  type: 'local-jsx',
  name: 'feedback',
  description: `Submit feedback about Claude Code`,
  argumentHint: '[report]',
  // 这个回调绑定到 isEnabled: () =>，负责命令处理在该局部场景下的响应。
  isEnabled: () =>
    !(
      isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
      isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
      isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY) ||
      isEnvTruthy(process.env.DISABLE_FEEDBACK_COMMAND) ||
      isEnvTruthy(process.env.DISABLE_BUG_COMMAND) ||
      isEssentialTrafficOnly() ||
      process.env.USER_TYPE === 'ant' ||
      !isPolicyAllowed('allow_product_feedback')
    ),
  // 这个回调绑定到 load: () => import('./feedback.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./feedback.js'),
} satisfies Command

export default feedback
