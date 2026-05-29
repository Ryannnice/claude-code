// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 hasAnthropicApiKeyAuth 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { hasAnthropicApiKeyAuth } from '../../utils/auth.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// 这个回调绑定到 export default () =>，负责命令处理在该局部场景下的响应。
export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasAnthropicApiKeyAuth()
      ? 'Switch Anthropic accounts'
      : 'Sign in with your Anthropic account',
    // 这个回调绑定到 isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),，负责命令处理在该局部场景下的响应。
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    // 这个回调绑定到 load: () => import('./login.js'),，负责命令处理在该局部场景下的响应。
    load: () => import('./login.js'),
  }) satisfies Command
