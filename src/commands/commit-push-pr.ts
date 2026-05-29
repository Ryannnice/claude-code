// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getAttributionTexts,
  getEnhancedPRAttribution,
} from '../utils/attribution.js'
// 复用 getDefaultBranch 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { getDefaultBranch } from '../utils/git.js'
// 复用 executeShellCommandsInPrompt 工具函数，把通用处理留在 ../utils/promptShellExecution.js 中维护。
import { executeShellCommandsInPrompt } from '../utils/promptShellExecution.js'
// 复用 getUndercoverInstructions、isUndercover 工具函数，把通用处理留在 ../utils/undercover.js 中维护。
import { getUndercoverInstructions, isUndercover } from '../utils/undercover.js'

// ALLOWED_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALLOWED_TOOLS = [
  'Bash(git checkout --branch:*)',
  'Bash(git checkout -b:*)',
  'Bash(git add:*)',
  'Bash(git status:*)',
  'Bash(git push:*)',
  'Bash(git commit:*)',
  'Bash(gh pr create:*)',
  'Bash(gh pr edit:*)',
  'Bash(gh pr view:*)',
  'Bash(gh pr merge:*)',
  'ToolSearch',
  'mcp__slack__send_message',
  'mcp__claude_ai_Slack__slack_send_message',
]

// getPromptContent 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPromptContent(
  defaultBranch: string,
  prAttribution?: string,
): string {
  // 斜杠命令 commit push pr先整理这一处局部数据，后续分支可以直接读取。
  const { commit: commitAttribution, pr: defaultPrAttribution } =
    getAttributionTexts()
  // Use provided PR attribution or fall back to default
  // effectivePrAttribution保存`prAttribution ?? defaultPrAttribution`，供后续判断或组装使用。
  const effectivePrAttribution = prAttribution ?? defaultPrAttribution
  // safeUser 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const safeUser = process.env.SAFEUSER || ''
  // username 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const username = process.env.USER || ''

  // prefix固定为 `''`，作为命令处理斜杠命令 commit push pr后续展示或比较的基准。
  let prefix = ''
  // reviewerArg 命名 `' and `--reviewer anthropics/claude-code`'`，让后续代码直接表达这个值的用途。
  let reviewerArg = ' and `--reviewer anthropics/claude-code`'
  // addReviewerArg固定为 `' (and add `--add-reviewer anthropics/claude-code`)'`，作为命令处理斜杠命令 commit push pr后续展示或比较的基准。
  let addReviewerArg = ' (and add `--add-reviewer anthropics/claude-code`)'
  // changelogSection 命名 ```，让后续代码直接表达这个值的用途。
  let changelogSection = `

## Changelog
<!-- CHANGELOG:START -->
[If this PR contains user-facing changes, add a changelog entry here. Otherwise, remove this section.]
<!-- CHANGELOG:END -->`
  // slackStep固定为 ```，作为命令处理斜杠命令 commit push pr后续展示或比较的基准。
  let slackStep = `

5. After creating/updating the PR, check if the user's CLAUDE.md mentions posting to Slack channels. If it does, use ToolSearch to search for "slack send message" tools. If ToolSearch finds a Slack tool, ask the user if they'd like you to post the PR URL to the relevant Slack channel. Only post if the user confirms. If ToolSearch returns no results or errors, skip this step silently—do not mention the failure, do not attempt workarounds, and do not try alternative approaches.`
  // 只有 `process.env.USER_TYPE === 'ant' && isUndercover()` 满足时，命令处理才执行该分支。
  if (process.env.USER_TYPE === 'ant' && isUndercover()) {
    // prefix更新为 `getUndercoverInstructions() + '\n'`，确保斜杠命令后续读取最新状态。
    prefix = getUndercoverInstructions() + '\n'
    // reviewerArg更新为 `''`，确保斜杠命令后续读取最新状态。
    reviewerArg = ''
    // addReviewerArg更新为 `''`，确保斜杠命令后续读取最新状态。
    addReviewerArg = ''
    // changelogSection更新为 `''`，确保斜杠命令后续读取最新状态。
    changelogSection = ''
    // slackStep更新为 `''`，确保斜杠命令后续读取最新状态。
    slackStep = ''
  }

  // 返回 ``${prefix}## Context`，作为命令处理这次计算的结果。
  return `${prefix}## Context

- \`SAFEUSER\`: ${safeUser}
- \`whoami\`: ${username}
- \`git status\`: !\`git status\`
- \`git diff HEAD\`: !\`git diff HEAD\`
- \`git branch --show-current\`: !\`git branch --show-current\`
- \`git diff ${defaultBranch}...HEAD\`: !\`git diff ${defaultBranch}...HEAD\`
- \`gh pr view --json number 2>/dev/null || true\`: !\`gh pr view --json number 2>/dev/null || true\`

## Git Safety Protocol

- NEVER update the git config
- NEVER run destructive/irreversible git commands (like push --force, hard reset, etc) unless the user explicitly requests them
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it
- NEVER run force push to main/master, warn the user if they request it
- Do not commit files that likely contain secrets (.env, credentials.json, etc)
- Never use git commands with the -i flag (like git rebase -i or git add -i) since they require interactive input which is not supported

## Your task

Analyze all changes that will be included in the pull request, making sure to look at all relevant commits (NOT just the latest commit, but ALL commits that will be included in the pull request from the git diff ${defaultBranch}...HEAD output above).

Based on the above changes:
1. Create a new branch if on ${defaultBranch} (use SAFEUSER from context above for the branch name prefix, falling back to whoami if SAFEUSER is empty, e.g., \`username/feature-name\`)
2. Create a single commit with an appropriate message using heredoc syntax${commitAttribution ? `, ending with the attribution text shown in the example below` : ''}:
\`\`\`
git commit -m "$(cat <<'EOF'
Commit message here.${commitAttribution ? `\n\n${commitAttribution}` : ''}
EOF
)"
\`\`\`
3. Push the branch to origin
4. If a PR already exists for this branch (check the gh pr view output above), update the PR title and body using \`gh pr edit\` to reflect the current diff${addReviewerArg}. Otherwise, create a pull request using \`gh pr create\` with heredoc syntax for the body${reviewerArg}.
   - IMPORTANT: Keep PR titles short (under 70 characters). Use the body for details.
\`\`\`
gh pr create --title "Short, descriptive title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Test plan
[Bulleted markdown checklist of TODOs for testing the pull request...]${changelogSection}${effectivePrAttribution ? `\n\n${effectivePrAttribution}` : ''}
EOF
)"
\`\`\`

You have the capability to call multiple tools in a single response. You MUST do all of the above in a single message.${slackStep}

Return the PR URL when you're done, so the user can see it.`
}

// 命令 集中保存命令处理斜杠命令 commit push pr要一起传递的字段。
const command = {
  type: 'prompt',
  name: 'commit-push-pr',
  description: 'Commit, push, and open a PR',
  allowedTools: ALLOWED_TOOLS,
  // 斜杠命令 commit push pr在这里处理 `get contentLength() {`，完成这一小步状态转换。
  get contentLength() {
    // Use 'main' as estimate for content length calculation
    // 返回 `getPromptContent('main').length`，作为命令处理这次计算的结果。
    return getPromptContent('main').length
  },
  progressMessage: 'creating commit and PR',
  source: 'builtin',
  // getPromptForCommand 根据 args, context 读取或计算命令处理需要的结果。
  async getPromptForCommand(args, context) {
    // Get default branch and enhanced PR attribution
    // 并行获取 defaultBranch、prAttribution，缩短斜杠命令 commit push pr等待多个独立异步任务的时间。
    const [defaultBranch, prAttribution] = await Promise.all([
      getDefaultBranch(),
      getEnhancedPRAttribution(context.getAppState),
    ])
    // promptContent读取`getPromptContent`，供命令处理后续处理使用。
    let promptContent = getPromptContent(defaultBranch, prAttribution)

    // Append user instructions if args provided
    // trimmedArgs 集合格式化`trim`，供命令处理后续处理使用。
    const trimmedArgs = args?.trim()
    // 满足 `trimmedArgs` 时，命令处理执行该分支。
    if (trimmedArgs) {
      // 斜杠命令 commit push pr在这里处理 `promptContent += `\n\n## Additional instructions from user\n\n${trimmed...`，完成这一小步状态转换。
      promptContent += `\n\n## Additional instructions from user\n\n${trimmedArgs}`
    }

    // finalContent保存`executeShellCommandsInPrompt`，供命令处理后续处理使用。
    const finalContent = await executeShellCommandsInPrompt(
      promptContent,
      {
        ...context,
        // getAppState不依赖额外参数，直接计算命令处理需要的结果。
        getAppState() {
          // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
          const appState = context.getAppState()
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return {
            ...appState,
            toolPermissionContext: {
              ...appState.toolPermissionContext,
              alwaysAllowRules: {
                ...appState.toolPermissionContext.alwaysAllowRules,
                command: ALLOWED_TOOLS,
              },
            },
          }
        },
      },
      '/commit-push-pr',
    )

    // 返回列表结果，保留命令处理已经排好的条目顺序。
    return [{ type: 'text', text: finalContent }]
  },
} satisfies Command

export default command
