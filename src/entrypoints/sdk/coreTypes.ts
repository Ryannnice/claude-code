// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// SDK Core Types - Common serializable types used by both SDK consumers and SDK builders.
//
// Types are generated from Zod schemas in coreSchemas.ts.
// To modify types:
// 1. Edit Zod schemas in coreSchemas.ts
// 2. Run: bun scripts/generate-sdk-types.ts
//
// Schemas are available in coreSchemas.ts for runtime validation but are not
// part of the public API.

// Re-export sandbox types for SDK consumers
// 导出类型定义，让其他模块沿用core Types的数据契约。
export type {
  SandboxFilesystemConfig,
  SandboxIgnoreViolations,
  SandboxNetworkConfig,
  SandboxSettings,
} from '../sandboxTypes.js'
// Re-export all generated types
// core Types在这里处理 `export * from './coreTypes.generated.js'`，完成这一小步状态转换。
export * from './coreTypes.generated.js'

// Re-export utility types that can't be expressed as Zod schemas
// 导出类型定义，让其他模块沿用core Types的数据契约。
export type { NonNullableUsage } from './sdkUtilityTypes.js'

// Const arrays for runtime usage
// HOOK_EVENTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'Stop',
  'StopFailure',
  'SubagentStart',
  'SubagentStop',
  'PreCompact',
  'PostCompact',
  'PermissionRequest',
  'PermissionDenied',
  'Setup',
  'TeammateIdle',
  'TaskCreated',
  'TaskCompleted',
  'Elicitation',
  'ElicitationResult',
  'ConfigChange',
  'WorktreeCreate',
  'WorktreeRemove',
  'InstructionsLoaded',
  'CwdChanged',
  'FileChanged',
] as const

// EXIT_REASONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const EXIT_REASONS = [
  'clear',
  'resume',
  'logout',
  'prompt_input_exit',
  'other',
  'bypass_permissions_disabled',
] as const
