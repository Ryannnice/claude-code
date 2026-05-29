// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 类型依赖 { SystemPrompt } 来自 ../systemPromptType.js，用于校准共享工具的数据契约。
import type { SystemPrompt } from '../systemPromptType.js'

// Post-sampling hook - not exposed in settings.json config (yet), only used programmatically

// Generic context for REPL hooks (both post-sampling and stop hooks)
// REPLHookContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type REPLHookContext = {
  messages: Message[] // Full message history including assistant responses
  systemPrompt: SystemPrompt
  userContext: { [k: string]: string }
  systemContext: { [k: string]: string }
  toolUseContext: ToolUseContext
  querySource?: QuerySource
}

// PostSamplingHook 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PostSamplingHook = (
  context: REPLHookContext,
) => Promise<void> | void

// Internal registry for post-sampling hooks
// postSamplingHooks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const postSamplingHooks: PostSamplingHook[] = []

/**
 * Register a post-sampling hook that will be called after model sampling completes
 * This is an internal API not exposed through settings
 */
// registerPostSamplingHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerPostSamplingHook(hook: PostSamplingHook): void {
  // postSamplingHooks 集合追加新条目，保持收集顺序与输入顺序一致。
  postSamplingHooks.push(hook)
}

/**
 * Clear all registered post-sampling hooks (for testing)
 */
// clearPostSamplingHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPostSamplingHooks(): void {
  // postSamplingHooks 集合被清空，共享工具从干净状态继续。
  postSamplingHooks.length = 0
}

/**
 * Execute all registered post-sampling hooks
 */
// executePostSamplingHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function executePostSamplingHooks(
  messages: Message[],
  systemPrompt: SystemPrompt,
  userContext: { [k: string]: string },
  systemContext: { [k: string]: string },
  toolUseContext: ToolUseContext,
  querySource?: QuerySource,
): Promise<void> {
  // context 集中保存React hook post Sampling Hooks要一起传递的字段。
  const context: REPLHookContext = {
    messages,
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    querySource,
  }

  // 按顺序遍历 `postSamplingHooks` 中的hook，逐个交给共享工具处理。
  for (const hook of postSamplingHooks) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `hook(context)` 完成，再继续React hook post Sampling Hooks的异步流程。
      await hook(context)
    } catch (error) {
      // Log but don't fail on hook errors
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
    }
  }
}
