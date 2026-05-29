// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.js，用于校准命令处理的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js'
// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 引入 isUltrareviewEnabled，将 ./review/ultrareviewEnabled.js 中已经封装好的能力接到本文件流程里。
import { isUltrareviewEnabled } from './review/ultrareviewEnabled.js'

// Legal wants the explicit surface name plus a docs link visible before the
// user triggers, so the description carries "Claude Code on the web" + URL.
// CCR_TERMS_URL保存`'https://code.claude.com/docs/en/claude-code-on-the-web'`，作为后续固定文本处理的输入。
const CCR_TERMS_URL = 'https://code.claude.com/docs/en/claude-code-on-the-web'

// LOCAL_REVIEW_PROMPT封装成回调，供命令处理斜杠命令 review在事件触发或异步步骤中调用。
const LOCAL_REVIEW_PROMPT = (args: string) => `
      You are an expert code reviewer. Follow these steps:

      1. If no PR number is provided in the args, run \`gh pr list\` to show open PRs
      2. If a PR number is provided, run \`gh pr view <number>\` to get PR details
      3. Run \`gh pr diff <number>\` to get the diff
      4. Analyze the changes and provide a thorough code review that includes:
         - Overview of what the PR does
         - Analysis of code quality and style
         - Specific suggestions for improvements
         - Any potential issues or risks

      Keep your review concise but thorough. Focus on:
      - Code correctness
      - Following project conventions
      - Performance implications
      - Test coverage
      - Security considerations

      Format your review with clear sections and bullet points.

      PR number: ${args}
    `

// review 集中保存斜杠命令 review要一起传递的字段。
const review: Command = {
  type: 'prompt',
  name: 'review',
  description: 'Review a pull request',
  progressMessage: 'reviewing pull request',
  contentLength: 0,
  source: 'builtin',
  // getPromptForCommand 根据 args 读取或计算命令处理需要的结果。
  async getPromptForCommand(args): Promise<ContentBlockParam[]> {
    // 返回列表结果，保留命令处理已经排好的条目顺序。
    return [{ type: 'text', text: LOCAL_REVIEW_PROMPT(args) }]
  },
}

// /ultrareview is the ONLY entry point to the remote bughunter path —
// /review stays purely local. local-jsx type renders the overage permission
// dialog when free reviews are exhausted.
// ultrareview 集中保存斜杠命令 review要一起传递的字段。
const ultrareview: Command = {
  type: 'local-jsx',
  name: 'ultrareview',
  description: `~10–20 min · Finds and verifies bugs in your branch. Runs in Claude Code on the web. See ${CCR_TERMS_URL}`,
  // 这个回调绑定到 isEnabled: () => isUltrareviewEnabled(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isUltrareviewEnabled(),
  // 这个回调绑定到 load: () => import('./review/ultrareviewCommand.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./review/ultrareviewCommand.js'),
}

export default review
// 重新导出这一组成员，让命令处理的公共 API 保持集中入口。
export { ultrareview }
