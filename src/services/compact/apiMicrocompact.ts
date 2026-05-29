// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
// 接入 NOTEBOOK_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NOTEBOOK_EDIT_TOOL_NAME } from 'src/tools/NotebookEditTool/constants.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from 'src/tools/WebFetchTool/prompt.js'
// 接入 WEB_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
// 复用 SHELL_TOOL_NAMES 工具函数，把通用处理留在 src/utils/shell/shellToolUtils.js 中维护。
import { SHELL_TOOL_NAMES } from 'src/utils/shell/shellToolUtils.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// docs: https://docs.google.com/document/d/1oCT4evvWTh3P6z-kcfNQwWTCxAhkoFndSaNS9Gm40uw/edit?tab=t.0

// Default values for context management strategies
// Match client-side microcompact token values
// DEFAULT_MAX_INPUT_TOKENS 集合保存`180_000 // Typical warning threshold`，供后续判断或组装使用。
const DEFAULT_MAX_INPUT_TOKENS = 180_000 // Typical warning threshold
// DEFAULT_TARGET_INPUT_TOKENS 集合保存`40_000 // Keep last 40k tokens like client-side`，供服务层 api Microcompact后续判断或输出使用。
const DEFAULT_TARGET_INPUT_TOKENS = 40_000 // Keep last 40k tokens like client-side

// TOOLS_CLEARABLE_RESULTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TOOLS_CLEARABLE_RESULTS = [
  ...SHELL_TOOL_NAMES,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  FILE_READ_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
]

// TOOLS_CLEARABLE_USES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TOOLS_CLEARABLE_USES = [
  FILE_EDIT_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
  NOTEBOOK_EDIT_TOOL_NAME,
]

// Context management strategy types matching API documentation
// ContextEditStrategy 固化服务层 api Microcompact里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContextEditStrategy =
  | {
      type: 'clear_tool_uses_20250919'
      trigger?: {
        type: 'input_tokens'
        value: number
      }
      keep?: {
        type: 'tool_uses'
        value: number
      }
      clear_tool_inputs?: boolean | string[]
      exclude_tools?: string[]
      clear_at_least?: {
        type: 'input_tokens'
        value: number
      }
    }
  | {
      type: 'clear_thinking_20251015'
      keep: { type: 'thinking_turns'; value: number } | 'all'
    }

// Context management configuration wrapper
// ContextManagementConfig 固化服务层 api Microcompact里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContextManagementConfig = {
  edits: ContextEditStrategy[]
}

// API-based microcompact implementation that uses native context management
// getAPIContextManagement 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAPIContextManagement(options?: {
  hasThinking?: boolean
  isRedactThinkingActive?: boolean
  clearAllThinking?: boolean
}): ContextManagementConfig | undefined {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hasThinking = false,
    isRedactThinkingActive = false,
    clearAllThinking = false,
  } = options ?? {}

  // strategies 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const strategies: ContextEditStrategy[] = []

  // Preserve thinking blocks in previous assistant turns. Skip when
  // redact-thinking is active — redacted blocks have no model-visible content.
  // When clearAllThinking is set (>1h idle = cache miss), keep only the last
  // thinking turn — the API schema requires value >= 1, and omitting the edit
  // falls back to the model-policy default (often "all"), which wouldn't clear.
  // 组合条件 `hasThinking && !isRedactThinkingActive` 成立时，服务层 api Microcompact才启用这条专门路径。
  if (hasThinking && !isRedactThinkingActive) {
    // strategies 集合追加新条目，保持收集顺序与输入顺序一致。
    strategies.push({
      type: 'clear_thinking_20251015',
      keep: clearAllThinking ? { type: 'thinking_turns', value: 1 } : 'all',
    })
  }

  // Tool clearing strategies are ant-only
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `strategies.length > 0 ? { edits: strategies } : undefined`，作为服务层 api Microcompact这次计算的结果。
    return strategies.length > 0 ? { edits: strategies } : undefined
  }

  // useClearToolResults 集合保存`isEnvTruthy`，供服务层 api Microcompact后续处理使用。
  const useClearToolResults = isEnvTruthy(
    process.env.USE_API_CLEAR_TOOL_RESULTS,
  )
  // useClearToolUses 集合保存`isEnvTruthy`，供服务层 api Microcompact后续处理使用。
  const useClearToolUses = isEnvTruthy(process.env.USE_API_CLEAR_TOOL_USES)

  // If no tool clearing strategy is enabled, return early
  // 组合条件 `!useClearToolResults && !useClearToolUses` 成立时，服务层 api Microcompact才启用这条专门路径。
  if (!useClearToolResults && !useClearToolUses) {
    // 返回 `strategies.length > 0 ? { edits: strategies } : undefined`，作为服务层 api Microcompact这次计算的结果。
    return strategies.length > 0 ? { edits: strategies } : undefined
  }

  // 满足 `useClearToolResults` 时，服务层 api Microcompact执行该分支。
  if (useClearToolResults) {
    // triggerThreshold 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const triggerThreshold = process.env.API_MAX_INPUT_TOKENS
      ? parseInt(process.env.API_MAX_INPUT_TOKENS)
      : DEFAULT_MAX_INPUT_TOKENS
    // keepTarget 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const keepTarget = process.env.API_TARGET_INPUT_TOKENS
      ? parseInt(process.env.API_TARGET_INPUT_TOKENS)
      : DEFAULT_TARGET_INPUT_TOKENS

    // strategy 集中保存服务层 api Microcompact要一起传递的字段。
    const strategy: ContextEditStrategy = {
      type: 'clear_tool_uses_20250919',
      trigger: {
        type: 'input_tokens',
        value: triggerThreshold,
      },
      clear_at_least: {
        type: 'input_tokens',
        value: triggerThreshold - keepTarget,
      },
      clear_tool_inputs: TOOLS_CLEARABLE_RESULTS,
    }

    // strategies 集合追加新条目，保持收集顺序与输入顺序一致。
    strategies.push(strategy)
  }

  // 满足 `useClearToolUses` 时，服务层 api Microcompact执行该分支。
  if (useClearToolUses) {
    // triggerThreshold 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const triggerThreshold = process.env.API_MAX_INPUT_TOKENS
      ? parseInt(process.env.API_MAX_INPUT_TOKENS)
      : DEFAULT_MAX_INPUT_TOKENS
    // keepTarget 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const keepTarget = process.env.API_TARGET_INPUT_TOKENS
      ? parseInt(process.env.API_TARGET_INPUT_TOKENS)
      : DEFAULT_TARGET_INPUT_TOKENS

    // strategy 集中保存服务层 api Microcompact要一起传递的字段。
    const strategy: ContextEditStrategy = {
      type: 'clear_tool_uses_20250919',
      trigger: {
        type: 'input_tokens',
        value: triggerThreshold,
      },
      clear_at_least: {
        type: 'input_tokens',
        value: triggerThreshold - keepTarget,
      },
      exclude_tools: TOOLS_CLEARABLE_USES,
    }

    // strategies 集合追加新条目，保持收集顺序与输入顺序一致。
    strategies.push(strategy)
  }

  // 返回 `strategies.length > 0 ? { edits: strategies } : undefined`，作为服务层 api Microcompact这次计算的结果。
  return strategies.length > 0 ? { edits: strategies } : undefined
}
