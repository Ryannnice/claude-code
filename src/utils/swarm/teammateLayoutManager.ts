// 类型依赖 { AgentColorName } 来自 ../../tools/AgentTool/agentColorManager.js，用于校准共享工具的数据契约。
import type { AgentColorName } from '../../tools/AgentTool/agentColorManager.js'
// 接入 AGENT_COLORS 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_COLORS } from '../../tools/AgentTool/agentColorManager.js'
// 引入 detectAndGetBackend，将 ./backends/registry.js 中已经封装好的能力接到本文件流程里。
import { detectAndGetBackend } from './backends/registry.js'
// 类型依赖 { PaneBackend } 来自 ./backends/types.js，用于校准共享工具的数据契约。
import type { PaneBackend } from './backends/types.js'

// Track color assignments for teammates (persisted per session)
// teammateColorAssignments 集合构建`new Map<string, AgentColorName>()`，供后续判断或组装使用。
const teammateColorAssignments = new Map<string, AgentColorName>()
// colorIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
let colorIndex = 0

/**
 * Gets the appropriate backend for the current environment.
 * detectAndGetBackend() caches internally — no need for a second cache here.
 */
// getBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getBackend(): Promise<PaneBackend> {
  // 返回 `(await detectAndGetBackend()).backend`，作为共享工具这次计算的结果。
  return (await detectAndGetBackend()).backend
}

/**
 * Assigns a unique color to a teammate from the available palette.
 * Colors are assigned in round-robin order.
 */
// assignTeammateColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function assignTeammateColor(teammateId: string): AgentColorName {
  // existing读取`teammateColorAssignments.get`，供共享工具后续处理使用。
  const existing = teammateColorAssignments.get(teammateId)
  // 满足 `existing` 时，共享工具执行该分支。
  if (existing) {
    // 返回 `existing`，作为共享工具这次计算的结果。
    return existing
  }

  // color保存 `AGENT_COLORS[colorIndex % AGENT_COLORS.length]!` 的判断结果，供共享工具 teammate Layout Manager后续分支直接复用。
  const color = AGENT_COLORS[colorIndex % AGENT_COLORS.length]!
  // teammateColorAssignments.set 写入新的状态值，使共享工具后续读取保持一致。
  teammateColorAssignments.set(teammateId, color)
  // 共享工具 teammate Layout Manager在这里处理 `colorIndex++`，完成这一小步状态转换。
  colorIndex++

  // 返回 `color`，作为共享工具这次计算的结果。
  return color
}

/**
 * Gets the assigned color for a teammate, if any.
 */
// getTeammateColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateColor(
  teammateId: string,
): AgentColorName | undefined {
  // 返回 `teammateColorAssignments.get(teammateId)`，作为共享工具这次计算的结果。
  return teammateColorAssignments.get(teammateId)
}

/**
 * Clears all teammate color assignments.
 * Called during team cleanup to reset state for potential new teams.
 */
// clearTeammateColors 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearTeammateColors(): void {
  // 调用 teammateColorAssignments.clear，触发共享工具此处需要的副作用。
  teammateColorAssignments.clear()
  // colorIndex 索引更新为 `0`，确保共享工具后续读取最新状态。
  colorIndex = 0
}

/**
 * Checks if we're currently running inside a tmux session.
 * Uses the detection module directly for this check.
 */
// isInsideTmux 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isInsideTmux(): Promise<boolean> {
  // 从 `await import('./backends/detection.js')` 解构 isInsideTmux，减少共享工具 teammate Layout Manager对同一对象的重复访问。
  const { isInsideTmux: checkTmux } = await import('./backends/detection.js')
  // 返回 `checkTmux()`，作为共享工具这次计算的结果。
  return checkTmux()
}

/**
 * Creates a new teammate pane in the swarm view.
 * Automatically selects the appropriate backend (tmux or iTerm2) based on environment.
 *
 * When running INSIDE tmux:
 * - Uses TmuxBackend to split the current window
 * - Leader stays on left (30%), teammates on right (70%)
 *
 * When running in iTerm2 (not in tmux) with it2 CLI:
 * - Uses ITermBackend for native iTerm2 split panes
 *
 * When running OUTSIDE tmux/iTerm2:
 * - Falls back to TmuxBackend with external claude-swarm session
 */
// createTeammatePaneInSwarmView 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createTeammatePaneInSwarmView(
  teammateName: string,
  teammateColor: AgentColorName,
): Promise<{ paneId: string; isFirstTeammate: boolean }> {
  // backend读取`getBackend`，供共享工具后续处理使用。
  const backend = await getBackend()
  // 返回 `backend.createTeammatePaneInSwarmView(teammateName, teammateColor)`，作为共享工具这次计算的结果。
  return backend.createTeammatePaneInSwarmView(teammateName, teammateColor)
}

/**
 * Enables pane border status for a window (shows pane titles).
 * Delegates to the detected backend.
 */
// enablePaneBorderStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enablePaneBorderStatus(
  windowTarget?: string,
  useSwarmSocket = false,
): Promise<void> {
  // backend读取`getBackend`，供共享工具后续处理使用。
  const backend = await getBackend()
  // 返回 `backend.enablePaneBorderStatus(windowTarget, useSwarmSocket)`，作为共享工具这次计算的结果。
  return backend.enablePaneBorderStatus(windowTarget, useSwarmSocket)
}

/**
 * Sends a command to a specific pane.
 * Delegates to the detected backend.
 */
// sendCommandToPane 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendCommandToPane(
  paneId: string,
  command: string,
  useSwarmSocket = false,
): Promise<void> {
  // backend读取`getBackend`，供共享工具后续处理使用。
  const backend = await getBackend()
  // 返回 `backend.sendCommandToPane(paneId, command, useSwarmSocket)`，作为共享工具这次计算的结果。
  return backend.sendCommandToPane(paneId, command, useSwarmSocket)
}
