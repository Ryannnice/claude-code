// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const AGENT_TOOL_NAME = 'Agent'
// Legacy wire name for backward compat (permission rules, hooks, resumed sessions)
// LEGACY_AGENT_TOOL_NAME保存`'Task'`，作为后续固定文本处理的输入。
export const LEGACY_AGENT_TOOL_NAME = 'Task'
// VERIFICATION_AGENT_TYPE保存`'verification'`，作为后续固定文本处理的输入。
export const VERIFICATION_AGENT_TYPE = 'verification'

// Built-in agents that run once and return a report — the parent never
// SendMessages back to continue them. Skip the agentId/SendMessage/usage
// trailer for these to save tokens (~135 chars × 34M Explore runs/week).
// ONE_SHOT_BUILTIN_AGENT_TYPES 集合 用 Set 去重，后续只需判断成员是否存在。
export const ONE_SHOT_BUILTIN_AGENT_TYPES: ReadonlySet<string> = new Set([
  'Explore',
  'Plan',
])
