// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

/**
 * Whether this build has bfs/ugrep embedded in the bun binary (ant-native only).
 *
 * When true:
 * - `find` and `grep` in Claude's Bash shell are shadowed by shell functions
 *   that invoke the bun binary with argv0='bfs' / argv0='ugrep' (same trick
 *   as embedded ripgrep)
 * - The dedicated Glob/Grep tools are removed from the tool registry
 * - Prompt guidance steering Claude away from find/grep is omitted
 *
 * Set as a build-time define in scripts/build-with-plugins.ts for ant-native builds.
 */
// hasEmbeddedSearchTools 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasEmbeddedSearchTools(): boolean {
  // 满足 `!isEnvTruthy(process.env.EMBEDDED_SEARCH_TOOLS)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.EMBEDDED_SEARCH_TOOLS)) return false
  // e 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const e = process.env.CLAUDE_CODE_ENTRYPOINT
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    e !== 'sdk-ts' && e !== 'sdk-py' && e !== 'sdk-cli' && e !== 'local-agent'
  )
}

/**
 * Path to the bun binary that contains the embedded search tools.
 * Only meaningful when hasEmbeddedSearchTools() is true.
 */
// embeddedSearchToolsBinaryPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function embeddedSearchToolsBinaryPath(): string {
  // 返回 `process.execPath`，作为共享工具这次计算的结果。
  return process.execPath
}
