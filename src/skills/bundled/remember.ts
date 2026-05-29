// 引入 isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// registerRememberSkill 封装remember的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerRememberSkill(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // remember在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // SKILL_PROMPT 命名 ``# Memory Review`，让后续代码直接表达这个值的用途。
  const SKILL_PROMPT = `# Memory Review

## Goal
Review the user's memory landscape and produce a clear report of proposed changes, grouped by action type. Do NOT apply changes — present proposals for user approval.

## Steps

### 1. Gather all memory layers
Read CLAUDE.md and CLAUDE.local.md from the project root (if they exist). Your auto-memory content is already in your system prompt — review it there. Note which team memory sections exist, if any.

**Success criteria**: You have the contents of all memory layers and can compare them.

### 2. Classify each auto-memory entry
For each substantive entry in auto-memory, determine the best destination:

| Destination | What belongs there | Examples |
|---|---|---|
| **CLAUDE.md** | Project conventions and instructions for Claude that all contributors should follow | "use bun not npm", "API routes use kebab-case", "test command is bun test", "prefer functional style" |
| **CLAUDE.local.md** | Personal instructions for Claude specific to this user, not applicable to other contributors | "I prefer concise responses", "always explain trade-offs", "don't auto-commit", "run tests before committing" |
| **Team memory** | Org-wide knowledge that applies across repositories (only if team memory is configured) | "deploy PRs go through #deploy-queue", "staging is at staging.internal", "platform team owns infra" |
| **Stay in auto-memory** | Working notes, temporary context, or entries that don't clearly fit elsewhere | Session-specific observations, uncertain patterns |

**Important distinctions:**
- CLAUDE.md and CLAUDE.local.md contain instructions for Claude, not user preferences for external tools (editor theme, IDE keybindings, etc. don't belong in either)
- Workflow practices (PR conventions, merge strategies, branch naming) are ambiguous — ask the user whether they're personal or team-wide
- When unsure, ask rather than guess

**Success criteria**: Each entry has a proposed destination or is flagged as ambiguous.

### 3. Identify cleanup opportunities
Scan across all layers for:
- **Duplicates**: Auto-memory entries already captured in CLAUDE.md or CLAUDE.local.md → propose removing from auto-memory
- **Outdated**: CLAUDE.md or CLAUDE.local.md entries contradicted by newer auto-memory entries → propose updating the older layer
- **Conflicts**: Contradictions between any two layers → propose resolution, noting which is more recent

**Success criteria**: All cross-layer issues identified.

### 4. Present the report
Output a structured report grouped by action type:
1. **Promotions** — entries to move, with destination and rationale
2. **Cleanup** — duplicates, outdated entries, conflicts to resolve
3. **Ambiguous** — entries where you need the user's input on destination
4. **No action needed** — brief note on entries that should stay put

If auto-memory is empty, say so and offer to review CLAUDE.md for cleanup.

**Success criteria**: User can review and approve/reject each proposal individually.

## Rules
- Present ALL proposals before making any changes
- Do NOT modify files without explicit user approval
- Do NOT create new files unless the target doesn't exist yet
- Ask about ambiguous entries — don't guess
`

  // 调用 registerBundledSkill，触发remember此处需要的副作用。
  registerBundledSkill({
    name: 'remember',
    description:
      'Review auto-memory entries and propose promotions to CLAUDE.md, CLAUDE.local.md, or shared memory. Also detects outdated, conflicting, and duplicate entries across memory layers.',
    whenToUse:
      'Use when the user wants to review, organize, or promote their auto-memory entries. Also useful for cleaning up outdated or conflicting entries across CLAUDE.md, CLAUDE.local.md, and auto-memory.',
    userInvocable: true,
    // 这个回调绑定到 isEnabled: () => isAutoMemoryEnabled(),，负责remember在该局部场景下的响应。
    isEnabled: () => isAutoMemoryEnabled(),
    // getPromptForCommand 根据 args 读取或计算remember需要的结果。
    async getPromptForCommand(args) {
      // 提示词 命名 `SKILL_PROMPT`，让后续代码直接表达这个值的用途。
      let prompt = SKILL_PROMPT

      // 满足 `args` 时，remember执行该分支。
      if (args) {
        // remember在这里处理 `prompt += `\n## Additional context from user\n\n${args}``，完成这一小步状态转换。
        prompt += `\n## Additional context from user\n\n${args}`
      }

      // 返回列表结果，保留remember已经排好的条目顺序。
      return [{ type: 'text', text: prompt }]
    },
  })
}
