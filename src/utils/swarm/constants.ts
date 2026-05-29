// TEAM_LEAD_NAME固定为 `'team-lead'`，作为共享工具 constants后续展示或比较的基准。
export const TEAM_LEAD_NAME = 'team-lead'
// SWARM_SESSION_NAME 会话数据 命名 `'claude-swarm'`，让后续代码直接表达这个值的用途。
export const SWARM_SESSION_NAME = 'claude-swarm'
// SWARM_VIEW_WINDOW_NAME保存`'swarm-view'`，作为后续固定文本处理的输入。
export const SWARM_VIEW_WINDOW_NAME = 'swarm-view'
// TMUX_COMMAND 命令数据 命名 `'tmux'`，让后续代码直接表达这个值的用途。
export const TMUX_COMMAND = 'tmux'
// HIDDEN_SESSION_NAME 会话数据 命名 `'claude-hidden'`，让后续代码直接表达这个值的用途。
export const HIDDEN_SESSION_NAME = 'claude-hidden'

/**
 * Gets the socket name for external swarm sessions (when user is not in tmux).
 * Uses a separate socket to isolate swarm operations from user's tmux sessions.
 * Includes PID to ensure multiple Claude instances don't conflict.
 */
// getSwarmSocketName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSwarmSocketName(): string {
  // 返回 ``claude-swarm-${process.pid}``，作为共享工具这次计算的结果。
  return `claude-swarm-${process.pid}`
}

/**
 * Environment variable to override the command used to spawn teammate instances.
 * If not set, defaults to process.execPath (the current Claude binary).
 * This allows customization for different environments or testing.
 */
// TEAMMATE_COMMAND_ENV_VAR 命令数据 命名 `'CLAUDE_CODE_TEAMMATE_COMMAND'`，让后续代码直接表达这个值的用途。
export const TEAMMATE_COMMAND_ENV_VAR = 'CLAUDE_CODE_TEAMMATE_COMMAND'

/**
 * Environment variable set on spawned teammates to indicate their assigned color.
 * Used for colored output and pane identification.
 */
// TEAMMATE_COLOR_ENV_VAR保存`'CLAUDE_CODE_AGENT_COLOR'`，作为后续固定文本处理的输入。
export const TEAMMATE_COLOR_ENV_VAR = 'CLAUDE_CODE_AGENT_COLOR'

/**
 * Environment variable set on spawned teammates to require plan mode before implementation.
 * When set to 'true', teammates must enter plan mode and get approval before writing code.
 */
// PLAN_MODE_REQUIRED_ENV_VAR保存`'CLAUDE_CODE_PLAN_MODE_REQUIRED'`，作为后续固定文本处理的输入。
export const PLAN_MODE_REQUIRED_ENV_VAR = 'CLAUDE_CODE_PLAN_MODE_REQUIRED'
