// Git-related behaviors that depend on user settings.
//
// This lives outside git.ts because git.ts is in the vscode extension's
// dep graph and must stay free of settings.ts, which transitively pulls
// @opentelemetry/api + undici (forbidden in vscode). It's also a cycle:
// settings.ts → git/gitignore.ts → git.ts, so git.ts → settings.ts loops.
//
// If you're tempted to add `import settings` to git.ts — don't. Put it here.

// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'

// shouldIncludeGitInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldIncludeGitInstructions(): boolean {
  // envVal 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envVal = process.env.CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS
  // 满足 `isEnvTruthy(envVal)` 时，共享工具执行该分支。
  if (isEnvTruthy(envVal)) return false
  // 满足 `isEnvDefinedFalsy(envVal)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(envVal)) return true
  // 返回 `getInitialSettings().includeGitInstructions ?? true`，作为共享工具这次计算的结果。
  return getInitialSettings().includeGitInstructions ?? true
}
