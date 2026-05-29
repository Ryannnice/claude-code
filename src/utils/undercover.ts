/**
 * Undercover mode — safety utilities for contributing to public/open-source repos.
 *
 * When active, Claude Code adds safety instructions to commit/PR prompts and
 * strips all attribution to avoid leaking internal model codenames, project
 * names, or other Anthropic-internal information. The model is not told what
 * model it is.
 *
 * Activation:
 *   - CLAUDE_CODE_UNDERCOVER=1 — force ON (even in internal repos)
 *   - Otherwise AUTO: active UNLESS the repo remote matches the internal
 *     allowlist (INTERNAL_MODEL_REPOS in commitAttribution.ts). Safe default
 *     is ON — Claude may push to public remotes from a CWD that isn't itself
 *     a git checkout (e.g. /tmp crash repro).
 *   - There is NO force-OFF. This guards against model codename leaks — if
 *     we're not confident we're in an internal repo, we stay undercover.
 *
 * All code paths are gated on process.env.USER_TYPE === 'ant'. Since USER_TYPE is
 * a build-time --define, the bundler constant-folds these checks and dead-code-
 * eliminates the ant-only branches from external builds. In external builds every
 * function in this file reduces to a trivial return.
 */

// 引入 getRepoClassCached，将 ./commitAttribution.js 中已经封装好的能力接到本文件流程里。
import { getRepoClassCached } from './commitAttribution.js'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

// isUndercover 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isUndercover(): boolean {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)) return true
    // Auto: active unless we've positively confirmed we're in an allowlisted
    // internal repo. 'external', 'none', and null (check not yet run) all
    // resolve to ON. The check is primed in setup.ts; only 'internal' → OFF.
    // 返回 `getRepoClassCached() !== 'internal'`，作为共享工具这次计算的结果。
    return getRepoClassCached() !== 'internal'
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getUndercoverInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUndercoverInstructions(): string {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 ``## UNDERCOVER MODE — CRITICAL`，作为共享工具这次计算的结果。
    return `## UNDERCOVER MODE — CRITICAL

You are operating UNDERCOVER in a PUBLIC/OPEN-SOURCE repository. Your commit
messages, PR titles, and PR bodies MUST NOT contain ANY Anthropic-internal
information. Do not blow your cover.

NEVER include in commit messages or PR descriptions:
- Internal model codenames (animal names like Capybara, Tengu, etc.)
- Unreleased model version numbers (e.g., opus-4-7, sonnet-4-8)
- Internal repo or project names (e.g., claude-cli-internal, anthropics/…)
- Internal tooling, Slack channels, or short links (e.g., go/cc, #claude-code-…)
- The phrase "Claude Code" or any mention that you are an AI
- Any hint of what model or version you are
- Co-Authored-By lines or any other attribution

Write commit messages as a human developer would — describe only what the code
change does.

GOOD:
- "Fix race condition in file watcher initialization"
- "Add support for custom key bindings"
- "Refactor parser for better error messages"

BAD (never write these):
- "Fix bug found while testing with Claude Capybara"
- "1-shotted by claude-opus-4-6"
- "Generated with Claude Code"
- "Co-Authored-By: Claude Opus 4.6 <…>"
`
  }
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Check whether to show the one-time explainer dialog for auto-undercover.
 * True when: undercover is active via auto-detection (not forced via env),
 * and the user hasn't seen the notice before. Pure — the component marks the
 * flag on mount.
 */
// shouldShowUndercoverAutoNotice 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowUndercoverAutoNotice(): boolean {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // If forced via env, user already knows; don't nag.
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)) return false
    // 满足 `!isUndercover()` 时，共享工具执行该分支。
    if (!isUndercover()) return false
    // 满足 `getGlobalConfig().hasSeenUndercoverAutoNotice` 时，共享工具执行该分支。
    if (getGlobalConfig().hasSeenUndercoverAutoNotice) return false
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
