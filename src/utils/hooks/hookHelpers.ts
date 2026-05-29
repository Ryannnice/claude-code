// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { Tool } from '../../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  SYNTHETIC_OUTPUT_TOOL_NAME,
  SyntheticOutputTool,
} from '../../tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 引入 substituteArguments，将 ../argumentSubstitution.js 中已经封装好的能力接到本文件流程里。
import { substituteArguments } from '../argumentSubstitution.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 类型依赖 { SetAppState } 来自 ../messageQueueManager.js，用于校准共享工具的数据契约。
import type { SetAppState } from '../messageQueueManager.js'
// 引入 hasSuccessfulToolCall，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { hasSuccessfulToolCall } from '../messages.js'
// 引入 addFunctionHook，将 ./sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { addFunctionHook } from './sessionHooks.js'

/**
 * Schema for hook responses (shared by prompt and agent hooks)
 */
// hookResponseSchema 响应数据保存`lazySchema`，供共享工具后续处理使用。
export const hookResponseSchema = lazySchema(() =>
  z.object({
    ok: z.boolean().describe('Whether the condition was met'),
    reason: z
      .string()
      .describe('Reason, if the condition was not met')
      .optional(),
  }),
)

/**
 * Add hook input JSON to prompt, either replacing $ARGUMENTS placeholder or appending.
 * Also supports indexed arguments like $ARGUMENTS[0], $ARGUMENTS[1], or shorthand $0, $1, etc.
 */
// addArgumentsToPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addArgumentsToPrompt(
  prompt: string,
  jsonInput: string,
): string {
  // 返回 `substituteArguments(prompt, jsonInput)`，作为共享工具这次计算的结果。
  return substituteArguments(prompt, jsonInput)
}

/**
 * Create a StructuredOutput tool configured for hook responses.
 * Reusable by agent hooks and background verification.
 */
// createStructuredOutputTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createStructuredOutputTool(): Tool {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...SyntheticOutputTool,
    inputSchema: hookResponseSchema(),
    inputJSONSchema: {
      type: 'object',
      properties: {
        ok: {
          type: 'boolean',
          description: 'Whether the condition was met',
        },
        reason: {
          type: 'string',
          description: 'Reason, if the condition was not met',
        },
      },
      required: ['ok'],
      additionalProperties: false,
    },
    // prompt 使用 无 完成共享工具里的对应操作。
    async prompt(): Promise<string> {
      // 返回 ``Use this tool to return your verification result. You MUST call this t...`，作为共享工具这次计算的结果。
      return `Use this tool to return your verification result. You MUST call this tool exactly once at the end of your response.`
    },
  }
}

/**
 * Register a function hook that enforces structured output via SyntheticOutputTool.
 * Used by ask.tsx, execAgentHook.ts, and background verification.
 */
// registerStructuredOutputEnforcement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerStructuredOutputEnforcement(
  setAppState: SetAppState,
  sessionId: string,
): void {
  // 调用 addFunctionHook，触发共享工具此处需要的副作用。
  addFunctionHook(
    setAppState,
    sessionId,
    'Stop',
    '', // No matcher - applies to all stops
    // 对话消息更新为 `> hasSuccessfulToolCall(messages, SYNTHETIC_OUTPUT_TOOL_N...`，确保共享工具后续读取最新状态。
    messages => hasSuccessfulToolCall(messages, SYNTHETIC_OUTPUT_TOOL_NAME),
    `You MUST call the ${SYNTHETIC_OUTPUT_TOOL_NAME} tool to complete this request. Call this tool now.`,
    { timeout: 5000 },
  )
}
