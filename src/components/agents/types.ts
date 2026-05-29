// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js'
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准终端渲染的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'

// AGENT_PATHS 路径数据集中保存终端 UI types要一起传递的字段。
export const AGENT_PATHS = {
  FOLDER_NAME: '.claude',
  AGENTS_DIR: 'agents',
} as const

// Base types for common patterns
// WithPreviousMode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WithPreviousMode = { previousMode: ModeState }
// WithAgent 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WithAgent = { agent: AgentDefinition }

// Simplified state type using intersection types
// ModeState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModeState =
  | { mode: 'main-menu' }
  | { mode: 'list-agents'; source: SettingSource | 'all' | 'built-in' }
  | ({ mode: 'agent-menu' } & WithAgent & WithPreviousMode)
  | ({ mode: 'view-agent' } & WithAgent & WithPreviousMode)
  | { mode: 'create-agent' }
  | ({ mode: 'edit-agent' } & WithAgent & WithPreviousMode)
  | ({ mode: 'delete-confirm' } & WithAgent & WithPreviousMode)

// AgentValidationResult 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentValidationResult = {
  isValid: boolean
  warnings: string[]
  errors: string[]
}
