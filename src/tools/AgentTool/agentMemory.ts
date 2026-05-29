// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, normalize, sep } from 'path'
// 引入 getProjectRoot，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot } from '../../bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildMemoryPrompt,
  ensureMemoryDirExists,
} from '../../memdir/memdir.js'
// 引入 getMemoryBaseDir，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getMemoryBaseDir } from '../../memdir/paths.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 findCanonicalGitRoot 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { findCanonicalGitRoot } from '../../utils/git.js'
// 复用 sanitizePath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { sanitizePath } from '../../utils/path.js'

// Persistent agent memory scope: 'user' (~/.claude/agent-memory/), 'project' (.claude/agent-memory/), or 'local' (.claude/agent-memory-local/)
// AgentMemoryScope 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentMemoryScope = 'user' | 'project' | 'local'

/**
 * Sanitize an agent type name for use as a directory name.
 * Replaces colons (invalid on Windows, used in plugin-namespaced agent
 * types like "my-plugin:my-agent") with dashes.
 */
// sanitizeAgentTypeForPath 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeAgentTypeForPath(agentType: string): string {
  // 返回 `agentType.replace(/:/g, '-')`，作为工具调用这次计算的结果。
  return agentType.replace(/:/g, '-')
}

/**
 * Returns the local agent memory directory, which is project-specific and not checked into VCS.
 * When CLAUDE_CODE_REMOTE_MEMORY_DIR is set, persists to the mount with project namespacing.
 * Otherwise, uses <cwd>/.claude/agent-memory-local/<agentType>/.
 */
// getLocalAgentMemoryDir 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLocalAgentMemoryDir(dirName: string): string {
  // 满足 `process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR` 时，工具调用执行该分支。
  if (process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR) {
    // 返回 `(`，作为工具调用这次计算的结果。
    return (
      join(
        process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR,
        'projects',
        sanitizePath(
          findCanonicalGitRoot(getProjectRoot()) ?? getProjectRoot(),
        ),
        'agent-memory-local',
        dirName,
      ) + sep
    )
  }
  // 返回 `join(getCwd(), '.claude', 'agent-memory-local', dirName) + sep`，作为工具调用这次计算的结果。
  return join(getCwd(), '.claude', 'agent-memory-local', dirName) + sep
}

/**
 * Returns the agent memory directory for a given agent type and scope.
 * - 'user' scope: <memoryBase>/agent-memory/<agentType>/
 * - 'project' scope: <cwd>/.claude/agent-memory/<agentType>/
 * - 'local' scope: see getLocalAgentMemoryDir()
 */
// getAgentMemoryDir 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentMemoryDir(
  agentType: string,
  scope: AgentMemoryScope,
): string {
  // dirName保存`sanitizeAgentTypeForPath`，供工具调用后续处理使用。
  const dirName = sanitizeAgentTypeForPath(agentType)
  // 按照 scope 的取值选择工具调用的具体处理分支。
  switch (scope) {
    case 'project':
      // 返回 `join(getCwd(), '.claude', 'agent-memory', dirName) + sep`，作为工具调用这次计算的结果。
      return join(getCwd(), '.claude', 'agent-memory', dirName) + sep
    case 'local':
      // 返回 `getLocalAgentMemoryDir(dirName)`，作为工具调用这次计算的结果。
      return getLocalAgentMemoryDir(dirName)
    case 'user':
      // 返回 `join(getMemoryBaseDir(), 'agent-memory', dirName) + sep`，作为工具调用这次计算的结果。
      return join(getMemoryBaseDir(), 'agent-memory', dirName) + sep
  }
}

// Check if file is within an agent memory directory (any scope).
// isAgentMemoryPath 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAgentMemoryPath(absolutePath: string): boolean {
  // SECURITY: Normalize to prevent path traversal bypasses via .. segments
  // normalizedPath 路径数据保存`normalize`，供工具调用后续处理使用。
  const normalizedPath = normalize(absolutePath)
  // memoryBase读取`getMemoryBaseDir`，供工具调用后续处理使用。
  const memoryBase = getMemoryBaseDir()

  // User scope: check memory base (may be custom dir or config home)
  // 满足 `normalizedPath.startsWith(join(memoryBase, 'agent-memory') + sep)` 时，工具调用执行该分支。
  if (normalizedPath.startsWith(join(memoryBase, 'agent-memory') + sep)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Project scope: always cwd-based (not redirected)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    normalizedPath.startsWith(join(getCwd(), '.claude', 'agent-memory') + sep)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Local scope: persisted to mount when CLAUDE_CODE_REMOTE_MEMORY_DIR is set, otherwise cwd-based
  // 满足 `process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR` 时，工具调用执行该分支。
  if (process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      normalizedPath.includes(sep + 'agent-memory-local' + sep) &&
      normalizedPath.startsWith(
        join(process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR, 'projects') + sep,
      )
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  // Agent 工具 agent Memory在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    normalizedPath.startsWith(
      join(getCwd(), '.claude', 'agent-memory-local') + sep,
    )
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Returns the agent memory file path for a given agent type and scope.
 */
// getAgentMemoryEntrypoint 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentMemoryEntrypoint(
  agentType: string,
  scope: AgentMemoryScope,
): string {
  // 返回 `join(getAgentMemoryDir(agentType, scope), 'MEMORY.md')`，作为工具调用这次计算的结果。
  return join(getAgentMemoryDir(agentType, scope), 'MEMORY.md')
}

// getMemoryScopeDisplay 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMemoryScopeDisplay(
  memory: AgentMemoryScope | undefined,
): string {
  // 按照 memory 的取值选择工具调用的具体处理分支。
  switch (memory) {
    case 'user':
      // 返回 ``User (${join(getMemoryBaseDir(), 'agent-memory')}/)``，作为工具调用这次计算的结果。
      return `User (${join(getMemoryBaseDir(), 'agent-memory')}/)`
    case 'project':
      // 返回 `'Project (.claude/agent-memory/)'`，作为工具调用这次计算的结果。
      return 'Project (.claude/agent-memory/)'
    case 'local':
      // 返回 ``Local (${getLocalAgentMemoryDir('...')})``，作为工具调用这次计算的结果。
      return `Local (${getLocalAgentMemoryDir('...')})`
    default:
      // 返回 `'None'`，作为工具调用这次计算的结果。
      return 'None'
  }
}

/**
 * Load persistent memory for an agent with memory enabled.
 * Creates the memory directory if needed and returns a prompt with memory contents.
 *
 * @param agentType The agent's type name (used as directory name)
 * @param scope 'user' for ~/.claude/agent-memory/ or 'project' for .claude/agent-memory/
 */
// loadAgentMemoryPrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadAgentMemoryPrompt(
  agentType: string,
  scope: AgentMemoryScope,
): string {
  // scopeNote 先占位，稍后的条件分支会根据实际输入补齐它。
  let scopeNote: string
  // 按照 scope 的取值选择工具调用的具体处理分支。
  switch (scope) {
    case 'user':
      // Agent 工具 agent Memory在这里处理 `scopeNote =`，完成这一小步状态转换。
      scopeNote =
        '- Since this memory is user-scope, keep learnings general since they apply across all projects'
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    case 'project':
      // Agent 工具 agent Memory在这里处理 `scopeNote =`，完成这一小步状态转换。
      scopeNote =
        '- Since this memory is project-scope and shared with your team via version control, tailor your memories to this project'
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    case 'local':
      // Agent 工具 agent Memory在这里处理 `scopeNote =`，完成这一小步状态转换。
      scopeNote =
        '- Since this memory is local-scope (not checked into version control), tailor your memories to this project and machine'
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
  }

  // memoryDir读取`getAgentMemoryDir`，供工具调用后续处理使用。
  const memoryDir = getAgentMemoryDir(agentType, scope)

  // Fire-and-forget: this runs at agent-spawn time inside a sync
  // getSystemPrompt() callback (called from React render in AgentDetail.tsx,
  // so it cannot be async). The spawned agent won't try to Write until after
  // a full API round-trip, by which time mkdir will have completed. Even if
  // it hasn't, FileWriteTool does its own mkdir of the parent directory.
  // 显式忽略 `ensureMemoryDirExists(memoryDir)` 的返回值，只保留它触发的副作用。
  void ensureMemoryDirExists(memoryDir)

  // coworkExtraGuidelines 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const coworkExtraGuidelines =
    process.env.CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES
  // 返回 `buildMemoryPrompt({`，作为工具调用这次计算的结果。
  return buildMemoryPrompt({
    displayName: 'Persistent Agent Memory',
    memoryDir,
    extraGuidelines:
      coworkExtraGuidelines && coworkExtraGuidelines.trim().length > 0
        ? [scopeNote, coworkExtraGuidelines]
        : [scopeNote],
  })
}
