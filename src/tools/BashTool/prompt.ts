// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 prependBullets，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { prependBullets } from '../../constants/prompts.js'
// 复用 getAttributionTexts 工具函数，把通用处理留在 ../../utils/attribution.js 中维护。
import { getAttributionTexts } from '../../utils/attribution.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 ../../utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from '../../utils/embeddedTools.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 shouldIncludeGitInstructions 工具函数，把通用处理留在 ../../utils/gitSettings.js 中维护。
import { shouldIncludeGitInstructions } from '../../utils/gitSettings.js'
// 复用 getClaudeTempDir 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { getClaudeTempDir } from '../../utils/permissions/filesystem.js'
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getDefaultBashTimeoutMs,
  getMaxBashTimeoutMs,
} from '../../utils/timeouts.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getUndercoverInstructions,
  isUndercover,
} from '../../utils/undercover.js'
// 引入 AGENT_TOOL_NAME，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
// 引入 FILE_EDIT_TOOL_NAME，将 ../FileEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { FILE_EDIT_TOOL_NAME } from '../FileEditTool/constants.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'
// 引入 FILE_WRITE_TOOL_NAME，将 ../FileWriteTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME } from '../FileWriteTool/prompt.js'
// 引入 GLOB_TOOL_NAME，将 ../GlobTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GLOB_TOOL_NAME } from '../GlobTool/prompt.js'
// 引入 GREP_TOOL_NAME，将 ../GrepTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GREP_TOOL_NAME } from '../GrepTool/prompt.js'
// 引入 TodoWriteTool，将 ../TodoWriteTool/TodoWriteTool.js 中已经封装好的能力接到本文件流程里。
import { TodoWriteTool } from '../TodoWriteTool/TodoWriteTool.js'
// 引入 BASH_TOOL_NAME，将 ./toolName.js 中已经封装好的能力接到本文件流程里。
import { BASH_TOOL_NAME } from './toolName.js'

// getDefaultTimeoutMs 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultTimeoutMs(): number {
  // 返回 `getDefaultBashTimeoutMs()`，作为工具调用这次计算的结果。
  return getDefaultBashTimeoutMs()
}

// getMaxTimeoutMs 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxTimeoutMs(): number {
  // 返回 `getMaxBashTimeoutMs()`，作为工具调用这次计算的结果。
  return getMaxBashTimeoutMs()
}

// getBackgroundUsageNote 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBackgroundUsageNote(): string | null {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
  // 返回 `"You can use the `run_in_background` parameter to run the command in th...`，作为工具调用这次计算的结果。
  return "You can use the `run_in_background` parameter to run the command in the background. Only use this if you don't need the result immediately and are OK being notified when the command completes later. You do not need to check the output right away - you'll be notified when it finishes. You do not need to use '&' at the end of the command when using this parameter."
}

// getCommitAndPRInstructions 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommitAndPRInstructions(): string {
  // Defense-in-depth: undercover instructions must survive even if the user
  // has disabled git instructions entirely. Attribution stripping and model-ID
  // hiding are mechanical and work regardless, but the explicit "don't blow
  // your cover" instructions are the last line of defense against the model
  // volunteering an internal codename in a commit message.
  // undercoverSection 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const undercoverSection =
    process.env.USER_TYPE === 'ant' && isUndercover()
      ? getUndercoverInstructions() + '\n'
      : ''

  // 满足 `!shouldIncludeGitInstructions()` 时，工具调用执行该分支。
  if (!shouldIncludeGitInstructions()) return undercoverSection

  // For ant users, use the short version pointing to skills
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // skillsSection保存`isEnvTruthy`，供工具调用后续处理使用。
    const skillsSection = !isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)
      ? `For git commits and pull requests, use the \`/commit\` and \`/commit-push-pr\` skills:
- \`/commit\` - Create a git commit with staged changes
- \`/commit-push-pr\` - Commit, push, and create a pull request

These skills handle git safety protocols, proper commit message formatting, and PR creation.

Before creating a pull request, run \`/simplify\` to review your changes, then test end-to-end (e.g. via \`/tmux\` for interactive features).

`
      : ''
    // 返回 ``${undercoverSection}# Git operations`，作为工具调用这次计算的结果。
    return `${undercoverSection}# Git operations

${skillsSection}IMPORTANT: NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it.

Use the gh command via the Bash tool for other GitHub-related tasks including working with issues, checks, and releases. If given a Github URL use the gh command to get the information needed.

# Other common operations
- View comments on a Github PR: gh api repos/foo/bar/pulls/123/comments`
  }

  // For external users, include full inline instructions
  // 从 `getAttributionTexts()` 解构 commit、pr，减少Bash 工具 prompt对同一对象的重复访问。
  const { commit: commitAttribution, pr: prAttribution } = getAttributionTexts()

  // 返回 ``# Committing changes with git`，作为工具调用这次计算的结果。
  return `# Committing changes with git

Only create commits when requested by the user. If unclear, ask first. When the user asks you to create a new git commit, follow these steps carefully:

You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. The numbered steps below indicate which commands should be batched in parallel.

Git Safety Protocol:
- NEVER update the git config
- NEVER run destructive git commands (push --force, reset --hard, checkout ., restore ., clean -f, branch -D) unless the user explicitly requests these actions. Taking unauthorized destructive actions is unhelpful and can result in lost work, so it's best to ONLY run these commands when given direct instructions 
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it
- NEVER run force push to main/master, warn the user if they request it
- CRITICAL: Always create NEW commits rather than amending, unless the user explicitly requests a git amend. When a pre-commit hook fails, the commit did NOT happen — so --amend would modify the PREVIOUS commit, which may result in destroying work or losing previous changes. Instead, after hook failure, fix the issue, re-stage, and create a NEW commit
- When staging files, prefer adding specific files by name rather than using "git add -A" or "git add .", which can accidentally include sensitive files (.env, credentials) or large binaries
- NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive

1. Run the following bash commands in parallel, each using the ${BASH_TOOL_NAME} tool:
  - Run a git status command to see all untracked files. IMPORTANT: Never use the -uall flag as it can cause memory issues on large repos.
  - Run a git diff command to see both staged and unstaged changes that will be committed.
  - Run a git log command to see recent commit messages, so that you can follow this repository's commit message style.
2. Analyze all staged changes (both previously staged and newly added) and draft a commit message:
  - Summarize the nature of the changes (eg. new feature, enhancement to an existing feature, bug fix, refactoring, test, docs, etc.). Ensure the message accurately reflects the changes and their purpose (i.e. "add" means a wholly new feature, "update" means an enhancement to an existing feature, "fix" means a bug fix, etc.).
  - Do not commit files that likely contain secrets (.env, credentials.json, etc). Warn the user if they specifically request to commit those files
  - Draft a concise (1-2 sentences) commit message that focuses on the "why" rather than the "what"
  - Ensure it accurately reflects the changes and their purpose
3. Run the following commands in parallel:
   - Add relevant untracked files to the staging area.
   - Create the commit with a message${commitAttribution ? ` ending with:\n   ${commitAttribution}` : '.'}
   - Run git status after the commit completes to verify success.
   Note: git status depends on the commit completing, so run it sequentially after the commit.
4. If the commit fails due to pre-commit hook: fix the issue and create a NEW commit

Important notes:
- NEVER run additional commands to read or explore code, besides git bash commands
- NEVER use the ${TodoWriteTool.name} or ${AGENT_TOOL_NAME} tools
- DO NOT push to the remote repository unless the user explicitly asks you to do so
- IMPORTANT: Never use git commands with the -i flag (like git rebase -i or git add -i) since they require interactive input which is not supported.
- IMPORTANT: Do not use --no-edit with git rebase commands, as the --no-edit flag is not a valid option for git rebase.
- If there are no changes to commit (i.e., no untracked files and no modifications), do not create an empty commit
- In order to ensure good formatting, ALWAYS pass the commit message via a HEREDOC, a la this example:
<example>
git commit -m "$(cat <<'EOF'
   Commit message here.${commitAttribution ? `\n\n   ${commitAttribution}` : ''}
   EOF
   )"
</example>

# Creating pull requests
Use the gh command via the Bash tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a Github URL use the gh command to get the information needed.

IMPORTANT: When the user asks you to create a pull request, follow these steps carefully:

1. Run the following bash commands in parallel using the ${BASH_TOOL_NAME} tool, in order to understand the current state of the branch since it diverged from the main branch:
   - Run a git status command to see all untracked files (never use -uall flag)
   - Run a git diff command to see both staged and unstaged changes that will be committed
   - Check if the current branch tracks a remote branch and is up to date with the remote, so you know if you need to push to the remote
   - Run a git log command and \`git diff [base-branch]...HEAD\` to understand the full commit history for the current branch (from the time it diverged from the base branch)
2. Analyze all changes that will be included in the pull request, making sure to look at all relevant commits (NOT just the latest commit, but ALL commits that will be included in the pull request!!!), and draft a pull request title and summary:
   - Keep the PR title short (under 70 characters)
   - Use the description/body for details, not the title
3. Run the following commands in parallel:
   - Create new branch if needed
   - Push to remote with -u flag if needed
   - Create PR using gh pr create with the format below. Use a HEREDOC to pass the body to ensure correct formatting.
<example>
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Test plan
[Bulleted markdown checklist of TODOs for testing the pull request...]${prAttribution ? `\n\n${prAttribution}` : ''}
EOF
)"
</example>

Important:
- DO NOT use the ${TodoWriteTool.name} or ${AGENT_TOOL_NAME} tools
- Return the PR URL when you're done, so the user can see it

# Other common operations
- View comments on a Github PR: gh api repos/foo/bar/pulls/123/comments`
}

// SandboxManager merges config from multiple sources (settings layers, defaults,
// CLI flags) without deduping, so paths like ~/.cache appear 3× in allowOnly.
// Dedup here before inlining into the prompt — affects only what the model sees,
// not sandbox enforcement. Saves ~150-200 tokens/request when sandbox is enabled.
// dedup 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dedup<T>(arr: T[] | undefined): T[] | undefined {
  // !arr || arr为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!arr || arr.length === 0) return arr
  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [...new Set(arr)]
}

// getSimpleSandboxSection 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSimpleSandboxSection(): string {
  // 满足 `!SandboxManager.isSandboxingEnabled()` 时，工具调用执行该分支。
  if (!SandboxManager.isSandboxingEnabled()) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // fsReadConfig 配置读取`SandboxManager.getFsReadConfig`，供工具调用后续处理使用。
  const fsReadConfig = SandboxManager.getFsReadConfig()
  // fsWriteConfig 配置读取`SandboxManager.getFsWriteConfig`，供工具调用后续处理使用。
  const fsWriteConfig = SandboxManager.getFsWriteConfig()
  // networkRestrictionConfig 配置读取`SandboxManager.getNetworkRestrictionConfig`，供工具调用后续处理使用。
  const networkRestrictionConfig = SandboxManager.getNetworkRestrictionConfig()
  // allowUnixSockets 集合读取`SandboxManager.getAllowUnixSockets`，供工具调用后续处理使用。
  const allowUnixSockets = SandboxManager.getAllowUnixSockets()
  // ignoreViolations 集合读取`SandboxManager.getIgnoreViolations`，供工具调用后续处理使用。
  const ignoreViolations = SandboxManager.getIgnoreViolations()
  // allowUnsandboxedCommands 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const allowUnsandboxedCommands =
    SandboxManager.areUnsandboxedCommandsAllowed()

  // Replace the per-UID temp dir literal (e.g. /private/tmp/claude-1001/) with
  // "$TMPDIR" so the prompt is identical across users — avoids busting the
  // cross-user global prompt cache. The sandbox already sets $TMPDIR at runtime.
  // claudeTempDir读取`getClaudeTempDir`，供工具调用后续处理使用。
  const claudeTempDir = getClaudeTempDir()
  // normalizeAllowOnly封装成回调，供Bash 工具 prompt在事件触发或异步步骤中调用。
  const normalizeAllowOnly = (paths: string[]): string[] =>
    // 这个回调绑定到 [...new Set(paths)].map(p => (p === claudeTempDir ? '$TMPDIR' : p))，负责工具调用在该局部场景下的响应。
    [...new Set(paths)].map(p => (p === claudeTempDir ? '$TMPDIR' : p))

  // filesystemConfig 文件数据 集中保存Bash 工具 prompt要一起传递的字段。
  const filesystemConfig = {
    read: {
      denyOnly: dedup(fsReadConfig.denyOnly),
      ...(fsReadConfig.allowWithinDeny && {
        allowWithinDeny: dedup(fsReadConfig.allowWithinDeny),
      }),
    },
    write: {
      allowOnly: normalizeAllowOnly(fsWriteConfig.allowOnly),
      denyWithinAllow: dedup(fsWriteConfig.denyWithinAllow),
    },
  }

  // networkConfig 配置 集中保存Bash 工具 prompt要一起传递的字段。
  const networkConfig = {
    ...(networkRestrictionConfig?.allowedHosts && {
      allowedHosts: dedup(networkRestrictionConfig.allowedHosts),
    }),
    ...(networkRestrictionConfig?.deniedHosts && {
      deniedHosts: dedup(networkRestrictionConfig.deniedHosts),
    }),
    ...(allowUnixSockets && { allowUnixSockets: dedup(allowUnixSockets) }),
  }

  // restrictionsLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const restrictionsLines = []
  // 满足 `Object.keys(filesystemConfig).length > 0` 时，工具调用执行该分支。
  if (Object.keys(filesystemConfig).length > 0) {
    // restrictionsLines 集合追加新条目，保持收集顺序与输入顺序一致。
    restrictionsLines.push(`Filesystem: ${jsonStringify(filesystemConfig)}`)
  }
  // 满足 `Object.keys(networkConfig).length > 0` 时，工具调用执行该分支。
  if (Object.keys(networkConfig).length > 0) {
    // restrictionsLines 集合追加新条目，保持收集顺序与输入顺序一致。
    restrictionsLines.push(`Network: ${jsonStringify(networkConfig)}`)
  }
  // 满足 `ignoreViolations` 时，工具调用执行该分支。
  if (ignoreViolations) {
    // restrictionsLines 集合追加新条目，保持收集顺序与输入顺序一致。
    restrictionsLines.push(
      `Ignored violations: ${jsonStringify(ignoreViolations)}`,
    )
  }

  // sandboxOverrideItems 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const sandboxOverrideItems: Array<string | string[]> =
    allowUnsandboxedCommands
      ? [
          'You should always default to running commands within the sandbox. Do NOT attempt to set `dangerouslyDisableSandbox: true` unless:',
          [
            'The user *explicitly* asks you to bypass sandbox',
            'A specific command just failed and you see evidence of sandbox restrictions causing the failure. Note that commands can fail for many reasons unrelated to the sandbox (missing files, wrong arguments, network issues, etc.).',
          ],
          'Evidence of sandbox-caused failures includes:',
          [
            '"Operation not permitted" errors for file/network operations',
            'Access denied to specific paths outside allowed directories',
            'Network connection failures to non-whitelisted hosts',
            'Unix socket connection errors',
          ],
          'When you see evidence of sandbox-caused failure:',
          [
            "Immediately retry with `dangerouslyDisableSandbox: true` (don't ask, just do it)",
            'Briefly explain what sandbox restriction likely caused the failure. Be sure to mention that the user can use the `/sandbox` command to manage restrictions.',
            'This will prompt the user for permission',
          ],
          'Treat each command you execute with `dangerouslyDisableSandbox: true` individually. Even if you have recently run a command with this setting, you should default to running future commands within the sandbox.',
          'Do not suggest adding sensitive paths like ~/.bashrc, ~/.zshrc, ~/.ssh/*, or credential files to the sandbox allowlist.',
        ]
      : [
          'All commands MUST run in sandbox mode - the `dangerouslyDisableSandbox` parameter is disabled by policy.',
          'Commands cannot run outside the sandbox under any circumstances.',
          'If a command fails due to sandbox restrictions, work with the user to adjust sandbox settings instead.',
        ]

  // items 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const items: Array<string | string[]> = [
    ...sandboxOverrideItems,
    'For temporary files, always use the `$TMPDIR` environment variable. TMPDIR is automatically set to the correct sandbox-writable directory in sandbox mode. Do NOT use `/tmp` directly - use `$TMPDIR` instead.',
  ]

  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [
    '',
    '## Command sandbox',
    'By default, your command will be run in a sandbox. This sandbox controls which directories and network hosts commands may access or modify without an explicit override.',
    '',
    'The sandbox has the following restrictions:',
    restrictionsLines.join('\n'),
    '',
    ...prependBullets(items),
  ].join('\n')
}

// getSimplePrompt 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSimplePrompt(): string {
  // Ant-native builds alias find/grep to embedded bfs/ugrep in Claude's shell,
  // so we don't steer away from them (and Glob/Grep tools are removed).
  // embedded保存`hasEmbeddedSearchTools`，供工具调用后续处理使用。
  const embedded = hasEmbeddedSearchTools()

  // toolPreferenceItems 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const toolPreferenceItems = [
    ...(embedded
      ? []
      : [
          `File search: Use ${GLOB_TOOL_NAME} (NOT find or ls)`,
          `Content search: Use ${GREP_TOOL_NAME} (NOT grep or rg)`,
        ]),
    `Read files: Use ${FILE_READ_TOOL_NAME} (NOT cat/head/tail)`,
    `Edit files: Use ${FILE_EDIT_TOOL_NAME} (NOT sed/awk)`,
    `Write files: Use ${FILE_WRITE_TOOL_NAME} (NOT echo >/cat <<EOF)`,
    'Communication: Output text directly (NOT echo/printf)',
  ]

  // avoidCommands 命令数据保存`embedded`，供Bash 工具 prompt后续判断或输出使用。
  const avoidCommands = embedded
    ? '`cat`, `head`, `tail`, `sed`, `awk`, or `echo`'
    : '`find`, `grep`, `cat`, `head`, `tail`, `sed`, `awk`, or `echo`'

  // multipleCommandsSubitems 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
  const multipleCommandsSubitems = [
    `If the commands are independent and can run in parallel, make multiple ${BASH_TOOL_NAME} tool calls in a single message. Example: if you need to run "git status" and "git diff", send a single message with two ${BASH_TOOL_NAME} tool calls in parallel.`,
    `If the commands depend on each other and must run sequentially, use a single ${BASH_TOOL_NAME} call with '&&' to chain them together.`,
    "Use ';' only when you need to run commands sequentially but don't care if earlier commands fail.",
    'DO NOT use newlines to separate commands (newlines are ok in quoted strings).',
  ]

  // gitSubitems 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const gitSubitems = [
    'Prefer to create a new commit rather than amending an existing commit.',
    'Before running destructive operations (e.g., git reset --hard, git push --force, git checkout --), consider whether there is a safer alternative that achieves the same goal. Only use destructive operations when they are truly the best approach.',
    'Never skip hooks (--no-verify) or bypass signing (--no-gpg-sign, -c commit.gpgsign=false) unless the user has explicitly asked for it. If a hook fails, investigate and fix the underlying issue.',
  ]

  // sleepSubitems 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const sleepSubitems = [
    'Do not sleep between commands that can run immediately — just run them.',
    ...(feature('MONITOR_TOOL')
      ? [
          'Use the Monitor tool to stream events from a background process (each stdout line is a notification). For one-shot "wait until done," use Bash with run_in_background instead.',
        ]
      : []),
    'If your command is long running and you would like to be notified when it finishes — use `run_in_background`. No sleep needed.',
    'Do not retry failing commands in a sleep loop — diagnose the root cause.',
    'If waiting for a background task you started with `run_in_background`, you will be notified when it completes — do not poll.',
    ...(feature('MONITOR_TOOL')
      ? [
          '`sleep N` as the first command with N ≥ 2 is blocked. If you need a delay (rate limiting, deliberate pacing), keep it under 2 seconds.',
        ]
      : [
          'If you must poll an external process, use a check command (e.g. `gh run view`) rather than sleeping first.',
          'If you must sleep, keep the duration short (1-5 seconds) to avoid blocking the user.',
        ]),
  ]
  // backgroundNote读取`getBackgroundUsageNote`，供工具调用后续处理使用。
  const backgroundNote = getBackgroundUsageNote()

  // instructionItems 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const instructionItems: Array<string | string[]> = [
    'If your command will create new directories or files, first use this tool to run `ls` to verify the parent directory exists and is the correct location.',
    'Always quote file paths that contain spaces with double quotes in your command (e.g., cd "path with spaces/file.txt")',
    'Try to maintain your current working directory throughout the session by using absolute paths and avoiding usage of `cd`. You may use `cd` if the User explicitly requests it.',
    `You may specify an optional timeout in milliseconds (up to ${getMaxTimeoutMs()}ms / ${getMaxTimeoutMs() / 60000} minutes). By default, your command will timeout after ${getDefaultTimeoutMs()}ms (${getDefaultTimeoutMs() / 60000} minutes).`,
    ...(backgroundNote !== null ? [backgroundNote] : []),
    'When issuing multiple commands:',
    multipleCommandsSubitems,
    'For git commands:',
    gitSubitems,
    'Avoid unnecessary `sleep` commands:',
    sleepSubitems,
    ...(embedded
      ? [
          // bfs (which backs `find`) uses Oniguruma for -regex, which picks the
          // FIRST matching alternative (leftmost-first), unlike GNU find's
          // POSIX leftmost-longest. This silently drops matches when a shorter
          // alternative is a prefix of a longer one.
          "When using `find -regex` with alternation, put the longest alternative first. Example: use `'.*\\.\\(tsx\\|ts\\)'` not `'.*\\.\\(ts\\|tsx\\)'` — the second form silently skips `.tsx` files.",
        ]
      : []),
  ]

  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [
    'Executes a given bash command and returns its output.',
    '',
    "The working directory persists between commands, but shell state does not. The shell environment is initialized from the user's profile (bash or zsh).",
    '',
    `IMPORTANT: Avoid using this tool to run ${avoidCommands} commands, unless explicitly instructed or after you have verified that a dedicated tool cannot accomplish your task. Instead, use the appropriate dedicated tool as this will provide a much better experience for the user:`,
    '',
    ...prependBullets(toolPreferenceItems),
    `While the ${BASH_TOOL_NAME} tool can do similar things, it’s better to use the built-in tools as they provide a better user experience and make it easier to review tool calls and give permission.`,
    '',
    '# Instructions',
    ...prependBullets(instructionItems),
    getSimpleSandboxSection(),
    ...(getCommitAndPRInstructions() ? ['', getCommitAndPRInstructions()] : []),
  ].join('\n')
}
