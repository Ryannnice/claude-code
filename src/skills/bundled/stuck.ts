// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// Prompt text contains `ps` commands as instructions for Claude to run,
// not commands this file executes.
// eslint-disable-next-line custom-rules/no-direct-ps-commands
// STUCK_PROMPT固定为 ``# /stuck — diagnose frozen/slow Claude Code sessions`，作为stuck后续展示或比较的基准。
const STUCK_PROMPT = `# /stuck — diagnose frozen/slow Claude Code sessions

The user thinks another Claude Code session on this machine is frozen, stuck, or very slow. Investigate and post a report to #claude-code-feedback.

## What to look for

Scan for other Claude Code processes (excluding the current one — PID is in \`process.pid\` but for shell commands just exclude the PID you see running this prompt). Process names are typically \`claude\` (installed) or \`cli\` (native dev build).

Signs of a stuck session:
- **High CPU (≥90%) sustained** — likely an infinite loop. Sample twice, 1-2s apart, to confirm it's not a transient spike.
- **Process state \`D\` (uninterruptible sleep)** — often an I/O hang. The \`state\` column in \`ps\` output; first character matters (ignore modifiers like \`+\`, \`s\`, \`<\`).
- **Process state \`T\` (stopped)** — user probably hit Ctrl+Z by accident.
- **Process state \`Z\` (zombie)** — parent isn't reaping.
- **Very high RSS (≥4GB)** — possible memory leak making the session sluggish.
- **Stuck child process** — a hung \`git\`, \`node\`, or shell subprocess can freeze the parent. Check \`pgrep -lP <pid>\` for each session.

## Investigation steps

1. **List all Claude Code processes** (macOS/Linux):
   \`\`\`
   ps -axo pid=,pcpu=,rss=,etime=,state=,comm=,command= | grep -E '(claude|cli)' | grep -v grep
   \`\`\`
   Filter to rows where \`comm\` is \`claude\` or (\`cli\` AND the command path contains "claude").

2. **For anything suspicious**, gather more context:
   - Child processes: \`pgrep -lP <pid>\`
   - If high CPU: sample again after 1-2s to confirm it's sustained
   - If a child looks hung (e.g., a git command), note its full command line with \`ps -p <child_pid> -o command=\`
   - Check the session's debug log if you can infer the session ID: \`~/.claude/debug/<session-id>.txt\` (the last few hundred lines often show what it was doing before hanging)

3. **Consider a stack dump** for a truly frozen process (advanced, optional):
   - macOS: \`sample <pid> 3\` gives a 3-second native stack sample
   - This is big — only grab it if the process is clearly hung and you want to know *why*

## Report

**Only post to Slack if you actually found something stuck.** If every session looks healthy, tell the user that directly — do not post an all-clear to the channel.

If you did find a stuck/slow session, post to **#claude-code-feedback** (channel ID: \`C07VBSHV7EV\`) using the Slack MCP tool. Use ToolSearch to find \`slack_send_message\` if it's not already loaded.

**Use a two-message structure** to keep the channel scannable:

1. **Top-level message** — one short line: hostname, Claude Code version, and a terse symptom (e.g. "session PID 12345 pegged at 100% CPU for 10min" or "git subprocess hung in D state"). No code blocks, no details.
2. **Thread reply** — the full diagnostic dump. Pass the top-level message's \`ts\` as \`thread_ts\`. Include:
   - PID, CPU%, RSS, state, uptime, command line, child processes
   - Your diagnosis of what's likely wrong
   - Relevant debug log tail or \`sample\` output if you captured it

If Slack MCP isn't available, format the report as a message the user can copy-paste into #claude-code-feedback (and let them know to thread the details themselves).

## Notes
- Don't kill or signal any processes — this is diagnostic only.
- If the user gave an argument (e.g., a specific PID or symptom), focus there first.
`

// registerStuckSkill 封装stuck的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerStuckSkill(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // stuck在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 registerBundledSkill，触发stuck此处需要的副作用。
  registerBundledSkill({
    name: 'stuck',
    description:
      '[ANT-ONLY] Investigate frozen/stuck/slow Claude Code sessions on this machine and post a diagnostic report to #claude-code-feedback.',
    userInvocable: true,
    // getPromptForCommand 根据 args 读取或计算stuck需要的结果。
    async getPromptForCommand(args) {
      // 提示词保存`STUCK_PROMPT`，供stuck后续判断或输出使用。
      let prompt = STUCK_PROMPT
      // 满足 `args` 时，stuck执行该分支。
      if (args) {
        // stuck在这里处理 `prompt += `\n## User-provided context\n\n${args}\n``，完成这一小步状态转换。
        prompt += `\n## User-provided context\n\n${args}\n`
      }
      // 返回列表结果，保留stuck已经排好的条目顺序。
      return [{ type: 'text', text: prompt }]
    },
  })
}
