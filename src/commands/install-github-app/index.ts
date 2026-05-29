// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// installGitHubApp 集中保存命令处理斜杠命令 index要一起传递的字段。
const installGitHubApp = {
  type: 'local-jsx',
  name: 'install-github-app',
  description: 'Set up Claude GitHub Actions for a repository',
  availability: ['claude-ai', 'console'],
  // 这个回调绑定到 isEnabled: () => !isEnvTruthy(process.env.DISABLE_INSTALL_GITHUB_APP_COMMAND),，负责命令处理在该局部场景下的响应。
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_INSTALL_GITHUB_APP_COMMAND),
  // 这个回调绑定到 load: () => import('./install-github-app.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./install-github-app.js'),
} satisfies Command

export default installGitHubApp
