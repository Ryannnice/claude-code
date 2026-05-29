// 类型依赖 { LocalCommandResult } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../types/command.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<LocalCommandResult> {
  // URL 命名 `'https://www.stickermule.com/claudecode'`，让后续代码直接表达这个值的用途。
  const url = 'https://www.stickermule.com/claudecode'
  // success 集合保存`openBrowser`，供命令处理后续处理使用。
  const success = await openBrowser(url)

  // 满足 `success` 时，命令处理执行该分支。
  if (success) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text', value: 'Opening sticker page in browser…' }
  } else {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `Failed to open browser. Visit: ${url}`,
    }
  }
}
