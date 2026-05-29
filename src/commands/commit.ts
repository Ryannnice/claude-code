// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 复用 getAttributionTexts 工具函数，把通用处理留在 ../utils/attribution.js 中维护。
import { getAttributionTexts } from '../utils/attribution.js'
// 复用 executeShellCommandsInPrompt 工具函数，把通用处理留在 ../utils/promptShellExecution.js 中维护。
import { executeShellCommandsInPrompt } from '../utils/promptShellExecution.js'
// 复用 getUndercoverInstructions、isUndercover 工具函数，把通用处理留在 ../utils/undercover.js 中维护。
import { getUndercoverInstructions, isUndercover } from '../utils/undercover.js'

// ALLOWED_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALLOWED_TOOLS = [
  'Bash(git add:*)',
  'Bash(git status:*)',
  'Bash(git commit:*)',
]

// getPromptContent 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPromptContent(): string {
  // 从 `getAttributionTexts()` 解构 commit，减少斜杠命令 commit对同一对象的重复访问。
  const { commit: commitAttribution } = getAttributionTexts()

  // prefix 命名 `''`，让后续代码直接表达这个值的用途。
  let prefix = ''
  // 只有 `process.env.USER_TYPE === 'ant' && isUndercover()` 满足时，命令处理才执行该分支。
  if (process.env.USER_TYPE === 'ant' && isUndercover()) {
    // prefix更新为 `getUndercoverInstructions() + '\n'`，确保斜杠命令后续读取最新状态。
    prefix = getUndercoverInstructions() + '\n'
  }

  // 返回 ``${prefix}## Context`，作为命令处理这次计算的结果。
  return `${prefix}## Context

- Current git status: !\`git status\`
- Current git diff (staged and unstaged changes): !\`git diff HEAD\`
- Current branch: !\`git branch --show-current\`
- Recent commits: !\`git log --oneline -10\`

## Git Safety Protocol

- NEVER update the git config
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it
- CRITICAL: ALWAYS create NEW commits. NEVER use git commit --amend, unless the user explicitly requests it
- Do not commit files that likely contain secrets (.env, credentials.json, etc). Warn the user if they specifically request to commit those files
- If there are no changes to commit (i.e., no untracked files and no modifications), do not create an empty commit
- Never use git commands with the -i flag (like git rebase -i or git add -i) since they require interactive input which is not supported

## Your task

Based on the above changes, create a single git commit:

1. Analyze all staged changes and draft a commit message:
   - Look at the recent commits above to follow this repository's commit message style
   - Summarize the nature of the changes (new feature, enhancement, bug fix, refactoring, test, docs, etc.)
   - Ensure the message accurately reflects the changes and their purpose (i.e. "add" means a wholly new feature, "update" means an enhancement to an existing feature, "fix" means a bug fix, etc.)
   - Draft a concise (1-2 sentences) commit message that focuses on the "why" rather than the "what"

2. Stage relevant files and create the commit using HEREDOC syntax:
\`\`\`
git commit -m "$(cat <<'EOF'
Commit message here.${commitAttribution ? `\n\n${commitAttribution}` : ''}
EOF
)"
\`\`\`

You have the capability to call multiple tools in a single response. Stage and create the commit using a single message. Do not use any other tools or do anything else. Do not send any other text or messages besides these tool calls.`
}

// 命令 集中保存命令处理斜杠命令 commit要一起传递的字段。
const command = {
  type: 'prompt',
  name: 'commit',
  description: 'Create a git commit',
  allowedTools: ALLOWED_TOOLS,
  contentLength: 0, // Dynamic content
  progressMessage: 'creating commit',
  source: 'builtin',
  // getPromptForCommand 根据 _args, context 读取或计算命令处理需要的结果。
  async getPromptForCommand(_args, context) {
    // promptContent读取`getPromptContent`，供命令处理后续处理使用。
    const promptContent = getPromptContent()
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
      '/commit',
    )

    // 返回列表结果，保留命令处理已经排好的条目顺序。
    return [{ type: 'text', text: finalContent }]
  },
} satisfies Command

export default command
