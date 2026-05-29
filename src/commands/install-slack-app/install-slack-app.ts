// 类型依赖 { LocalCommandResult } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../commands.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { saveGlobalConfig } from '../../utils/config.js'

// SLACK_APP_URL 命名 `'https://slack.com/marketplace/A08SF47R6P4-claude'`，让后续代码直接表达这个值的用途。
const SLACK_APP_URL = 'https://slack.com/marketplace/A08SF47R6P4-claude'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<LocalCommandResult> {
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_install_slack_app_clicked', {})

  // Track that user has clicked to install
  // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    slackAppInstallCount: (current.slackAppInstallCount ?? 0) + 1,
  }))

  // success 集合保存`openBrowser`，供命令处理后续处理使用。
  const success = await openBrowser(SLACK_APP_URL)

  // 满足 `success` 时，命令处理执行该分支。
  if (success) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: 'Opening Slack app installation page in browser…',
    }
  } else {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `Couldn't open browser. Visit: ${SLACK_APP_URL}`,
    }
  }
}
