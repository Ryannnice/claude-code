// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 接入 queryModelWithoutStreaming 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryModelWithoutStreaming } from '../../services/api/claude.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 引入 createAttachmentMessage，将 ../attachments.js 中已经封装好的能力接到本文件流程里。
import { createAttachmentMessage } from '../attachments.js'
// 引入 createCombinedAbortSignal，将 ../combinedAbortSignal.js 中已经封装好的能力接到本文件流程里。
import { createCombinedAbortSignal } from '../combinedAbortSignal.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 类型依赖 { HookResult } 来自 ../hooks.js，用于校准共享工具的数据契约。
import type { HookResult } from '../hooks.js'
// 引入 safeParseJSON，将 ../json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from '../json.js'
// 引入 createUserMessage、extractTextContent，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { createUserMessage, extractTextContent } from '../messages.js'
// 引入 getSmallFastModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { getSmallFastModel } from '../model/model.js'
// 类型依赖 { PromptHook } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { PromptHook } from '../settings/types.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'
// 引入 addArgumentsToPrompt、hookResponseSchema，将 ./hookHelpers.js 中已经封装好的能力接到本文件流程里。
import { addArgumentsToPrompt, hookResponseSchema } from './hookHelpers.js'

/**
 * Execute a prompt-based hook using an LLM
 */
// execPromptHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function execPromptHook(
  hook: PromptHook,
  hookName: string,
  hookEvent: HookEvent,
  jsonInput: string,
  signal: AbortSignal,
  toolUseContext: ToolUseContext,
  messages?: Message[],
  toolUseID?: string,
): Promise<HookResult> {
  // Use provided toolUseID or generate a new one
  // effectiveToolUseID保存`randomUUID`，供共享工具后续处理使用。
  const effectiveToolUseID = toolUseID || `hook-${randomUUID()}`
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Replace $ARGUMENTS with the JSON input
    // processedPrompt保存`addArgumentsToPrompt`，供共享工具后续处理使用。
    const processedPrompt = addArgumentsToPrompt(hook.prompt, jsonInput)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Processing prompt hook with prompt: ${processedPrompt}`,
    )

    // Create user message directly - no need for processUserInput which would
    // trigger UserPromptSubmit hooks and cause infinite recursion
    // userMessage 消息数据构建`createUserMessage`，供共享工具后续处理使用。
    const userMessage = createUserMessage({ content: processedPrompt })

    // Prepend conversation history if provided
    // messagesToQuery 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const messagesToQuery =
      messages && messages.length > 0
        ? [...messages, userMessage]
        : [userMessage]

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Querying model with ${messagesToQuery.length} messages`,
    )

    // Query the model with Haiku
    // hookTimeoutMs 集合保存`hook.timeout ? hook.timeout * 1000 : 30000`，供后续判断或组装使用。
    const hookTimeoutMs = hook.timeout ? hook.timeout * 1000 : 30000

    // Combined signal: aborts if either the hook signal or timeout triggers
    // React hook exec Prompt Hook先整理这一处局部数据，后续分支可以直接读取。
    const { signal: combinedSignal, cleanup: cleanupSignal } =
      createCombinedAbortSignal(signal, { timeoutMs: hookTimeoutMs })

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`queryModelWithoutStreaming`，供共享工具后续处理使用。
      const response = await queryModelWithoutStreaming({
        messages: messagesToQuery,
        systemPrompt: asSystemPrompt([
          `You are evaluating a hook in Claude Code.

Your response must be a JSON object matching one of the following schemas:
1. If the condition is met, return: {"ok": true}
2. If the condition is not met, return: {"ok": false, "reason": "Reason for why it is not met"}`,
        ]),
        thinkingConfig: { type: 'disabled' as const },
        tools: toolUseContext.options.tools,
        signal: combinedSignal,
        options: {
          // getToolPermissionContext不依赖额外参数，直接计算共享工具需要的结果。
          async getToolPermissionContext() {
            // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
            const appState = toolUseContext.getAppState()
            // 返回 `appState.toolPermissionContext`，作为共享工具这次计算的结果。
            return appState.toolPermissionContext
          },
          model: hook.model ?? getSmallFastModel(),
          toolChoice: undefined,
          isNonInteractiveSession: true,
          hasAppendSystemPrompt: false,
          agents: [],
          querySource: 'hook_prompt',
          mcpTools: [],
          agentId: toolUseContext.agentId,
          outputFormat: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                ok: { type: 'boolean' },
                reason: { type: 'string' },
              },
              required: ['ok'],
              additionalProperties: false,
            },
          },
        },
      })

      // 调用 cleanupSignal，触发共享工具此处需要的副作用。
      cleanupSignal()

      // Extract text content from response
      // 文本内容保存`extractTextContent`，供共享工具后续处理使用。
      const content = extractTextContent(response.message.content)

      // Update response length for spinner display
      // toolUseContext.setResponseLength 写入新的状态值，使共享工具后续读取保持一致。
      toolUseContext.setResponseLength(length => length + content.length)

      // fullResponse 响应数据格式化`content.trim`，供共享工具后续处理使用。
      const fullResponse = content.trim()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Model response: ${fullResponse}`)

      // json保存`safeParseJSON`，供共享工具后续处理使用。
      const json = safeParseJSON(fullResponse)
      // json缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!json) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: error parsing response as JSON: ${fullResponse}`,
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'non_blocking_error',
          message: createAttachmentMessage({
            type: 'hook_non_blocking_error',
            hookName,
            toolUseID: effectiveToolUseID,
            hookEvent,
            stderr: 'JSON validation failed',
            stdout: fullResponse,
            exitCode: 1,
          }),
        }
      }

      // 解析结果保存`hookResponseSchema`，供共享工具后续处理使用。
      const parsed = hookResponseSchema().safeParse(json)
      // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!parsed.success) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: model response does not conform to expected schema: ${parsed.error.message}`,
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'non_blocking_error',
          message: createAttachmentMessage({
            type: 'hook_non_blocking_error',
            hookName,
            toolUseID: effectiveToolUseID,
            hookEvent,
            stderr: `Schema validation failed: ${parsed.error.message}`,
            stdout: fullResponse,
            exitCode: 1,
          }),
        }
      }

      // Failed to meet condition
      // parsed.data.ok缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!parsed.data.ok) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Prompt hook condition was not met: ${parsed.data.reason}`,
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'blocking',
          blockingError: {
            blockingError: `Prompt hook condition was not met: ${parsed.data.reason}`,
            command: hook.prompt,
          },
          preventContinuation: true,
          stopReason: parsed.data.reason,
        }
      }

      // Condition was met
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Prompt hook condition was met`)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        hook,
        outcome: 'success',
        message: createAttachmentMessage({
          type: 'hook_success',
          hookName,
          toolUseID: effectiveToolUseID,
          hookEvent,
          content: '',
        }),
      }
    } catch (error) {
      // 调用 cleanupSignal，触发共享工具此处需要的副作用。
      cleanupSignal()

      // 满足 `combinedSignal.aborted` 时，共享工具执行该分支。
      if (combinedSignal.aborted) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'cancelled',
        }
      }
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供共享工具后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Hooks: Prompt hook error: ${errorMsg}`)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      hook,
      outcome: 'non_blocking_error',
      message: createAttachmentMessage({
        type: 'hook_non_blocking_error',
        hookName,
        toolUseID: effectiveToolUseID,
        hookEvent,
        stderr: `Error executing prompt hook: ${errorMsg}`,
        stdout: '',
        exitCode: 1,
      }),
    }
  }
}
