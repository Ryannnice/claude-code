// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// installSlackApp 集中保存命令处理斜杠命令 index要一起传递的字段。
const installSlackApp = {
  type: 'local',
  name: 'install-slack-app',
  description: 'Install the Claude Slack app',
  availability: ['claude-ai'],
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => import('./install-slack-app.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./install-slack-app.js'),
} satisfies Command

export default installSlackApp
