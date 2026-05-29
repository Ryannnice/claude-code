// 类型依赖 { QuerySource } 来自 src/constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from 'src/constants/querySource.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_OUTPUT_STYLE_NAME,
  OUTPUT_STYLE_CONFIG,
} from '../constants/outputStyles.js'
// 引入 getSettings_DEPRECATED，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from './settings/settings.js'

/**
 * Determines the prompt category for agent usage.
 * Used for analytics to track different agent patterns.
 *
 * @param agentType - The type/name of the agent
 * @param isBuiltInAgent - Whether this is a built-in agent or custom
 * @returns The agent prompt category string
 */
// getQuerySourceForAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getQuerySourceForAgent(
  agentType: string | undefined,
  isBuiltInAgent: boolean,
): QuerySource {
  // 满足 `isBuiltInAgent` 时，共享工具执行该分支。
  if (isBuiltInAgent) {
    // TODO: avoid this cast
    // 返回 `agentType`，作为共享工具这次计算的结果。
    return agentType
      ? (`agent:builtin:${agentType}` as QuerySource)
      : 'agent:default'
  } else {
    // 返回 `'agent:custom'`，作为共享工具这次计算的结果。
    return 'agent:custom'
  }
}

/**
 * Determines the prompt category based on output style settings.
 * Used for analytics to track different output style usage.
 *
 * @returns The prompt category string or undefined for default
 */
// getQuerySourceForREPL 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getQuerySourceForREPL(): QuerySource {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // style保存`settings?.outputStyle ?? DEFAULT_OUTPUT_STYLE_NAME`，供共享工具 prompt Category后续判断或输出使用。
  const style = settings?.outputStyle ?? DEFAULT_OUTPUT_STYLE_NAME

  // 满足 `style === DEFAULT_OUTPUT_STYLE_NAME` 时，共享工具执行该分支。
  if (style === DEFAULT_OUTPUT_STYLE_NAME) {
    // 返回 `'repl_main_thread'`，作为共享工具这次计算的结果。
    return 'repl_main_thread'
  }

  // All styles in OUTPUT_STYLE_CONFIG are built-in
  // isBuiltIn标记共享工具 prompt Category是否启用对应路径。
  const isBuiltIn = style in OUTPUT_STYLE_CONFIG
  // 返回 `isBuiltIn`，作为共享工具这次计算的结果。
  return isBuiltIn
    ? (`repl_main_thread:outputStyle:${style}` as QuerySource)
    : 'repl_main_thread:outputStyle:custom'
}
