// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js'

export default {
  type: 'local-jsx',
  name: 'remote-env',
  description: 'Configure the default remote environment for teleport sessions',
  // 这个回调绑定到 isEnabled: () =>，负责命令处理在该局部场景下的响应。
  isEnabled: () =>
    isClaudeAISubscriber() && isPolicyAllowed('allow_remote_sessions'),
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!isClaudeAISubscriber() || !isPolicyAllowed('allow_remote_sessions')`，作为命令处理这次计算的结果。
    return !isClaudeAISubscriber() || !isPolicyAllowed('allow_remote_sessions')
  },
  // 这个回调绑定到 load: () => import('./remote-env.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./remote-env.js'),
} satisfies Command
