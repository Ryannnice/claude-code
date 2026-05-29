// 引入 createMovedToPluginCommand，将 ../createMovedToPluginCommand.js 中已经封装好的能力接到本文件流程里。
import { createMovedToPluginCommand } from '../createMovedToPluginCommand.js'

export default createMovedToPluginCommand({
  name: 'pr-comments',
  description: 'Get comments from a GitHub pull request',
  progressMessage: 'fetching PR comments',
  pluginName: 'pr-comments',
  pluginCommand: 'pr-comments',
  // getPromptWhileMarketplaceIsPrivate 根据 args 读取或计算命令处理需要的结果。
  async getPromptWhileMarketplaceIsPrivate(args) {
    // 返回列表结果，保留命令处理已经排好的条目顺序。
    return [
      {
        type: 'text',
        text: `You are an AI assistant integrated into a git-based version control system. Your task is to fetch and display comments from a GitHub pull request.

Follow these steps:

1. Use \`gh pr view --json number,headRepository\` to get the PR number and repository info
2. Use \`gh api /repos/{owner}/{repo}/issues/{number}/comments\` to get PR-level comments
3. Use \`gh api /repos/{owner}/{repo}/pulls/{number}/comments\` to get review comments. Pay particular attention to the following fields: \`body\`, \`diff_hunk\`, \`path\`, \`line\`, etc. If the comment references some code, consider fetching it using eg \`gh api /repos/{owner}/{repo}/contents/{path}?ref={branch} | jq .content -r | base64 -d\`
4. Parse and format all comments in a readable way
5. Return ONLY the formatted comments, with no additional text

Format the comments as:

## Comments

[For each comment thread:]
- @author file.ts#line:
  \`\`\`diff
  [diff_hunk from the API response]
  \`\`\`
  > quoted comment text

  [any replies indented]

If there are no comments, return "No comments found."

Remember:
1. Only show the actual comments, no explanatory text
2. Include both PR-level and code review comments
3. Preserve the threading/nesting of comment replies
4. Show the file and line number context for code review comments
5. Use jq to parse the JSON responses from the GitHub API

${args ? 'Additional user input: ' + args : ''}
`,
      },
    ]
  },
})
