// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 partition，将 lodash-es/partition.js 中已经封装好的能力接到本文件流程里。
import partition from 'lodash-es/partition.js'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 引入 COORDINATOR_MODE_ALLOWED_TOOLS，将 ../constants/tools.js 中已经封装好的能力接到本文件流程里。
import { COORDINATOR_MODE_ALLOWED_TOOLS } from '../constants/tools.js'
// 接入 isMcpTool 服务层能力，把外部通信或共享状态交给 ../services/mcp/utils.js 处理。
import { isMcpTool } from '../services/mcp/utils.js'
// 类型依赖 { Tool, ToolPermissionContext, Tools } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tool, ToolPermissionContext, Tools } from '../Tool.js'

// MCP tool name suffixes for PR activity subscription. These are lightweight
// orchestration actions the coordinator calls directly rather than delegating
// to workers. Matched by suffix since the MCP server name prefix may vary.
// PR_ACTIVITY_TOOL_SUFFIXES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const PR_ACTIVITY_TOOL_SUFFIXES = [
  'subscribe_pr_activity',
  'unsubscribe_pr_activity',
]

// isPrActivitySubscriptionTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPrActivitySubscriptionTool(name: string): boolean {
  // 返回 `PR_ACTIVITY_TOOL_SUFFIXES.some(suffix => name.endsWith(suffix))`，作为共享工具这次计算的结果。
  return PR_ACTIVITY_TOOL_SUFFIXES.some(suffix => name.endsWith(suffix))
}

// Dead code elimination: conditional imports for feature-gated modules
/* eslint-disable @typescript-eslint/no-require-imports */
// coordinatorModeModule保存`feature`，供共享工具后续处理使用。
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? (require('../coordinator/coordinatorMode.js') as typeof import('../coordinator/coordinatorMode.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Filters a tool array to the set allowed in coordinator mode.
 * Shared between the REPL path (mergeAndFilterTools) and the headless
 * path (main.tsx) so both stay in sync.
 *
 * PR activity subscription tools are always allowed since subscription
 * management is orchestration.
 */
// applyCoordinatorToolFilter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyCoordinatorToolFilter(tools: Tools): Tools {
  // 返回 `tools.filter(`，作为共享工具这次计算的结果。
  return tools.filter(
    t =>
      COORDINATOR_MODE_ALLOWED_TOOLS.has(t.name) ||
      isPrActivitySubscriptionTool(t.name),
  )
}

/**
 * Pure function that merges tool pools and applies coordinator mode filtering.
 *
 * Lives in a React-free file so print.ts can import it without pulling
 * react/ink into the SDK module graph. The useMergedTools hook delegates
 * to this function inside useMemo.
 *
 * @param initialTools - Extra tools to include (built-in + startup MCP from props).
 * @param assembled - Tools from assembleToolPool (built-in + MCP, deduped).
 * @param mode - The permission context mode.
 * @returns Merged, deduplicated, and coordinator-filtered tool array.
 */
// mergeAndFilterTools 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergeAndFilterTools(
  initialTools: Tools,
  assembled: Tools,
  mode: ToolPermissionContext['mode'],
): Tools {
  // Merge initialTools on top - they take precedence in deduplication.
  // initialTools may include built-in tools (from getTools() in REPL.tsx) which
  // overlap with assembled tools. uniqBy handles this deduplication.
  // Partition-sort for prompt-cache stability (same as assembleToolPool):
  // built-ins must stay a contiguous prefix for the server's cache policy.
  // 从 `partition(` 按位置拆出 mcp、builtIn，让共享工具 tool Pool分别处理这些返回值。
  const [mcp, builtIn] = partition(
    uniqBy([...initialTools, ...assembled], 'name'),
    isMcpTool,
  )
  // byName保存`name.localeCompare`，供共享工具后续处理使用。
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name)
  // tools 集合保存`builtIn.sort`，供共享工具后续处理使用。
  const tools = [...builtIn.sort(byName), ...mcp.sort(byName)]

  // 只有 `feature('COORDINATOR_MODE') && coordinatorModeModule` 满足时，共享工具才执行该分支。
  if (feature('COORDINATOR_MODE') && coordinatorModeModule) {
    // 满足 `coordinatorModeModule.isCoordinatorMode()` 时，共享工具执行该分支。
    if (coordinatorModeModule.isCoordinatorMode()) {
      // 返回 `applyCoordinatorToolFilter(tools)`，作为共享工具这次计算的结果。
      return applyCoordinatorToolFilter(tools)
    }
  }

  // 返回 `tools`，作为共享工具这次计算的结果。
  return tools
}
