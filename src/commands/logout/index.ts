// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

export default {
  type: 'local-jsx',
  name: 'logout',
  description: 'Sign out from your Anthropic account',
  // 这个回调绑定到 isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGOUT_COMMAND),，负责命令处理在该局部场景下的响应。
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGOUT_COMMAND),
  // 这个回调绑定到 load: () => import('./logout.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./logout.js'),
} satisfies Command
