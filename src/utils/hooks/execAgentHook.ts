// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 引入 query，将 ../../query.js 中已经封装好的能力接到本文件流程里。
import { query } from '../../query.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/metadata.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/metadata.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 Tool、toolMatchesName，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { type Tool, toolMatchesName } from '../../Tool.js'
// 接入 SYNTHETIC_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SYNTHETIC_OUTPUT_TOOL_NAME } from '../../tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 引入 ALL_AGENT_DISALLOWED_TOOLS，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { ALL_AGENT_DISALLOWED_TOOLS } from '../../tools.js'
// 引入 asAgentId，将 ../../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asAgentId } from '../../types/ids.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 引入 createAbortController，将 ../abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from '../abortController.js'
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
// 引入 createUserMessage、handleMessageFromStream，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { createUserMessage, handleMessageFromStream } from '../messages.js'
// 引入 getSmallFastModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { getSmallFastModel } from '../model/model.js'
// 引入 hasPermissionsToUseTool，将 ../permissions/permissions.js 中已经封装好的能力接到本文件流程里。
import { hasPermissionsToUseTool } from '../permissions/permissions.js'
// 引入 getAgentTranscriptPath、getTranscriptPath，将 ../sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getAgentTranscriptPath, getTranscriptPath } from '../sessionStorage.js'
// 类型依赖 { AgentHook } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { AgentHook } from '../settings/types.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  addArgumentsToPrompt,
  createStructuredOutputTool,
  hookResponseSchema,
  registerStructuredOutputEnforcement,
} from './hookHelpers.js'
// 引入 clearSessionHooks，将 ./sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { clearSessionHooks } from './sessionHooks.js'

/**
 * Execute an agent-based hook using a multi-turn LLM query
 */
// execAgentHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function execAgentHook(
  hook: AgentHook,
  hookName: string,
  hookEvent: HookEvent,
  jsonInput: string,
  signal: AbortSignal,
  toolUseContext: ToolUseContext,
  toolUseID: string | undefined,
  // Kept for signature stability with the other exec*Hook functions.
  // Was used by hook.prompt(messages) before the .transform() was removed
  // (CC-79) — the only consumer of that was ExitPlanModeV2Tool's
  // programmatic construction, since refactored into VerifyPlanExecutionTool.
  _messages: Message[],
  agentName?: string,
): Promise<HookResult> {
  // effectiveToolUseID保存`randomUUID`，供共享工具后续处理使用。
  const effectiveToolUseID = toolUseID || `hook-${randomUUID()}`

  // Get transcript path from context
  // transcriptPath 路径数据 命名 `toolUseContext.agentId`，让后续代码直接表达这个值的用途。
  const transcriptPath = toolUseContext.agentId
    ? getAgentTranscriptPath(toolUseContext.agentId)
    : getTranscriptPath()
  // hookStartTime记录时间`Date.now`，供共享工具后续处理使用。
  const hookStartTime = Date.now()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Replace $ARGUMENTS with the JSON input
    // processedPrompt保存`addArgumentsToPrompt`，供共享工具后续处理使用。
    const processedPrompt = addArgumentsToPrompt(hook.prompt, jsonInput)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Processing agent hook with prompt: ${processedPrompt}`,
    )

    // Create user message directly - no need for processUserInput which would
    // trigger UserPromptSubmit hooks and cause infinite recursion
    // userMessage 消息数据构建`createUserMessage`，供共享工具后续处理使用。
    const userMessage = createUserMessage({ content: processedPrompt })
    // agentMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const agentMessages = [userMessage]

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Starting agent query with ${agentMessages.length} messages`,
    )

    // Setup timeout and combine with parent signal
    // hookTimeoutMs 集合保存`hook.timeout ? hook.timeout * 1000 : 60000`，供后续判断或组装使用。
    const hookTimeoutMs = hook.timeout ? hook.timeout * 1000 : 60000
    // hookAbortController构建`createAbortController`，供共享工具后续处理使用。
    const hookAbortController = createAbortController()

    // Combine parent signal with timeout, and have it abort our controller
    // React hook exec Agent Hook先整理这一处局部数据，后续分支可以直接读取。
    const { signal: parentTimeoutSignal, cleanup: cleanupCombinedSignal } =
      createCombinedAbortSignal(signal, { timeoutMs: hookTimeoutMs })
    // onParentTimeout保存`hookAbortController.abort`，供共享工具后续处理使用。
    const onParentTimeout = () => hookAbortController.abort()
    // 调用 parentTimeoutSignal.addEventListener，触发共享工具此处需要的副作用。
    parentTimeoutSignal.addEventListener('abort', onParentTimeout)

    // Combined signal is just our controller's signal now
    // combinedSignal 命名 `hookAbortController.signal`，让后续代码直接表达这个值的用途。
    const combinedSignal = hookAbortController.signal

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Create StructuredOutput tool with our schema
      // structuredOutputTool构建`createStructuredOutputTool`，供共享工具后续处理使用。
      const structuredOutputTool = createStructuredOutputTool()

      // Filter out any existing StructuredOutput tool to avoid duplicates with different schemas
      // (e.g., when parent context has a StructuredOutput tool from --json-schema flag)
      // filteredTools 集合筛选`tools.filter`，供共享工具后续处理使用。
      const filteredTools = toolUseContext.options.tools.filter(
        // 工具更新为 `> !toolMatchesName(tool, SYNTHETIC_OUTPUT_TOOL_NAME)`，确保共享工具后续读取最新状态。
        tool => !toolMatchesName(tool, SYNTHETIC_OUTPUT_TOOL_NAME),
      )

      // Use all available tools plus our structured output tool
      // Filter out disallowed agent tools to prevent stop hook agents from spawning subagents
      // or entering plan mode, and filter out duplicate StructuredOutput tools
      // tools 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const tools: Tool[] = [
        ...filteredTools.filter(
          // 工具更新为 `> !ALL_AGENT_DISALLOWED_TOOLS.has(tool.name)`，确保共享工具后续读取最新状态。
          tool => !ALL_AGENT_DISALLOWED_TOOLS.has(tool.name),
        ),
        structuredOutputTool,
      ]

      // 系统提示词保存`asSystemPrompt`，供共享工具后续处理使用。
      const systemPrompt = asSystemPrompt([
        `You are verifying a stop condition in Claude Code. Your task is to verify that the agent completed the given plan. The conversation transcript is available at: ${transcriptPath}\nYou can read this file to analyze the conversation history if needed.

Use the available tools to inspect the codebase and verify the condition.
Use as few steps as possible - be efficient and direct.

When done, return your result using the ${SYNTHETIC_OUTPUT_TOOL_NAME} tool with:
- ok: true if the condition is met
- ok: false with reason if the condition is not met`,
      ])

      // 模型名称读取`getSmallFastModel`，供共享工具后续处理使用。
      const model = hook.model ?? getSmallFastModel()
      // MAX_AGENT_TURNS 集合保存`50`，供共享工具React hook exec Agent Hook后续判断或输出使用。
      const MAX_AGENT_TURNS = 50

      // Create unique agentId for this hook agent
      // hookAgentId保存`asAgentId`，供共享工具后续处理使用。
      const hookAgentId = asAgentId(`hook-agent-${randomUUID()}`)

      // Create a modified toolUseContext for the agent
      // agentToolUseContext 集中保存React hook exec Agent Hook要一起传递的字段。
      const agentToolUseContext: ToolUseContext = {
        ...toolUseContext,
        agentId: hookAgentId,
        abortController: hookAbortController,
        options: {
          ...toolUseContext.options,
          tools,
          mainLoopModel: model,
          isNonInteractiveSession: true,
          thinkingConfig: { type: 'disabled' as const },
        },
        // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责共享工具在该局部场景下的响应。
        setInProgressToolUseIDs: () => {},
        // getAppState不依赖额外参数，直接计算共享工具需要的结果。
        getAppState() {
          // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
          const appState = toolUseContext.getAppState()
          // Add session rule to allow reading transcript file
          // existingSessionRules 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const existingSessionRules =
            appState.toolPermissionContext.alwaysAllowRules.session ?? []
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            ...appState,
            toolPermissionContext: {
              ...appState.toolPermissionContext,
              mode: 'dontAsk' as const,
              alwaysAllowRules: {
                ...appState.toolPermissionContext.alwaysAllowRules,
                session: [...existingSessionRules, `Read(/${transcriptPath})`],
              },
            },
          }
        },
      }

      // Register a session-level stop hook to enforce structured output
      // 调用 registerStructuredOutputEnforcement，触发共享工具此处需要的副作用。
      registerStructuredOutputEnforcement(
        toolUseContext.setAppState,
        hookAgentId,
      )

      // structuredOutputResult 命名 `null`，让后续代码直接表达这个值的用途。
      let structuredOutputResult: { ok: boolean; reason?: string } | null = null
      // turnCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let turnCount = 0
      // hitMaxTurns 集合标记共享工具React hook exec Agent Hook是否启用对应路径。
      let hitMaxTurns = false

      // Use query() for multi-turn execution
      // 逐项读取 `query({` 中的消息，按输入顺序推进React hook exec Agent Hook。
      for await (const message of query({
        messages: agentMessages,
        systemPrompt,
        userContext: {},
        systemContext: {},
        canUseTool: hasPermissionsToUseTool,
        toolUseContext: agentToolUseContext,
        querySource: 'hook_agent',
      })) {
        // Process stream events to update response length in the spinner
        // 调用 handleMessageFromStream，触发共享工具此处需要的副作用。
        handleMessageFromStream(
          message,
          // 这个回调绑定到 () => {}, // onMessage - we handle messages below，负责共享工具在该局部场景下的响应。
          () => {}, // onMessage - we handle messages below
          // 新内容更新为 `>`，确保共享工具后续读取最新状态。
          newContent =>
            toolUseContext.setResponseLength(
              // length 数量更新为 `> length + newContent.length`，确保共享工具后续读取最新状态。
              length => length + newContent.length,
            ),
          // 这个回调绑定到 toolUseContext.setStreamMode ?? (() => {}),，负责共享工具在该局部场景下的响应。
          toolUseContext.setStreamMode ?? (() => {}),
          // 这个回调绑定到 () => {}, // onStreamingToolUses - not needed for hooks，负责共享工具在该局部场景下的响应。
          () => {}, // onStreamingToolUses - not needed for hooks
        )

        // Skip streaming events for further processing
        // 共享工具在这里按实际状态进入对应分支。
        if (
          message.type === 'stream_event' ||
          message.type === 'stream_request_start'
        ) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }

        // Count assistant turns
        // 当 `message.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
        if (message.type === 'assistant') {
          // React hook exec Agent Hook在这里处理 `turnCount++`，完成这一小步状态转换。
          turnCount++

          // Check if we've hit the turn limit
          // 满足 `turnCount >= MAX_AGENT_TURNS` 时，共享工具执行该分支。
          if (turnCount >= MAX_AGENT_TURNS) {
            // hitMaxTurns 集合更新为 `true`，确保共享工具后续读取最新状态。
            hitMaxTurns = true
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Hooks: Agent turn ${turnCount} hit max turns, aborting`,
            )
            // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
            hookAbortController.abort()
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }

        // Check for structured output in attachments
        // 共享工具在这里按实际状态进入对应分支。
        if (
          message.type === 'attachment' &&
          message.attachment.type === 'structured_output'
        ) {
          // 解析结果保存`hookResponseSchema`，供共享工具后续处理使用。
          const parsed = hookResponseSchema().safeParse(message.attachment.data)
          // 满足 `parsed.success` 时，共享工具执行该分支。
          if (parsed.success) {
            // structuredOutputResult更新为 `parsed.data`，确保共享工具后续读取最新状态。
            structuredOutputResult = parsed.data
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Hooks: Got structured output: ${jsonStringify(structuredOutputResult)}`,
            )
            // Got structured output, abort and exit
            // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
            hookAbortController.abort()
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
      }

      // 调用 parentTimeoutSignal.removeEventListener，触发共享工具此处需要的副作用。
      parentTimeoutSignal.removeEventListener('abort', onParentTimeout)
      // 调用 cleanupCombinedSignal，触发共享工具此处需要的副作用。
      cleanupCombinedSignal()

      // Clean up the session hook we registered for this agent
      // 调用 clearSessionHooks，触发共享工具此处需要的副作用。
      clearSessionHooks(toolUseContext.setAppState, hookAgentId)

      // Check if we got a result
      // structuredOutputResult缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!structuredOutputResult) {
        // If we hit max turns, just log and return cancelled (no UI message)
        // 满足 `hitMaxTurns` 时，共享工具执行该分支。
        if (hitMaxTurns) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks: Agent hook did not complete within ${MAX_AGENT_TURNS} turns`,
          )
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_agent_stop_hook_max_turns', {
            durationMs: Date.now() - hookStartTime,
            turnCount,
            agentName:
              agentName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            hook,
            outcome: 'cancelled',
          }
        }

        // For other cases (e.g., agent finished without calling structured output tool),
        // just log and return cancelled (don't show error to user)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Hooks: Agent hook did not return structured output`)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_agent_stop_hook_error', {
          durationMs: Date.now() - hookStartTime,
          turnCount,
          errorType: 1, // 1 = no structured output
          agentName:
            agentName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'cancelled',
        }
      }

      // Return result based on structured output
      // structuredOutputResult.ok缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!structuredOutputResult.ok) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hooks: Agent hook condition was not met: ${structuredOutputResult.reason}`,
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          hook,
          outcome: 'blocking',
          blockingError: {
            blockingError: `Agent hook condition was not met: ${structuredOutputResult.reason}`,
            command: hook.prompt,
          },
        }
      }

      // Condition was met
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Hooks: Agent hook condition was met`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_agent_stop_hook_success', {
        durationMs: Date.now() - hookStartTime,
        turnCount,
        agentName:
          agentName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
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
      // 调用 parentTimeoutSignal.removeEventListener，触发共享工具此处需要的副作用。
      parentTimeoutSignal.removeEventListener('abort', onParentTimeout)
      // 调用 cleanupCombinedSignal，触发共享工具此处需要的副作用。
      cleanupCombinedSignal()

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
    logForDebugging(`Hooks: Agent hook error: ${errorMsg}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_agent_stop_hook_error', {
      durationMs: Date.now() - hookStartTime,
      errorType: 2, // 2 = general error
      agentName:
        agentName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      hook,
      outcome: 'non_blocking_error',
      message: createAttachmentMessage({
        type: 'hook_non_blocking_error',
        hookName,
        toolUseID: effectiveToolUseID,
        hookEvent,
        stderr: `Error executing agent hook: ${errorMsg}`,
        stdout: '',
        exitCode: 1,
      }),
    }
  }
}
