// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 接入 queryModelWithoutStreaming 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryModelWithoutStreaming } from '../../services/api/claude.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 复用 createAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createAbortController } from '../../utils/abortController.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 extractTextContent，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { extractTextContent } from '../messages.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'
// 类型依赖 { REPLHookContext } 来自 ./postSamplingHooks.js，用于校准共享工具的数据契约。
import type { REPLHookContext } from './postSamplingHooks.js'

// ApiQueryHookContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ApiQueryHookContext = REPLHookContext & {
  queryMessageCount?: number
}

export type ApiQueryHookConfig<TResult> = {
  name: QuerySource
  // 这个回调绑定到 shouldRun: (context: ApiQueryHookContext) => Promise<boolean>，负责共享工具在该局部场景下的响应。
  shouldRun: (context: ApiQueryHookContext) => Promise<boolean>

  // Build the complete message list to send to the API
  // 这个回调绑定到 buildMessages: (context: ApiQueryHookContext) => Message[]，负责共享工具在该局部场景下的响应。
  buildMessages: (context: ApiQueryHookContext) => Message[]

  // Optional: override system prompt (defaults to context.systemPrompt)
  systemPrompt?: string

  // Optional: whether to use tools from context (defaults to true)
  // Set to false to pass empty tools array
  useTools?: boolean

  // 这个回调绑定到 parseResponse: (content: string, context: ApiQueryHookContext) => TResult，负责共享工具在该局部场景下的响应。
  parseResponse: (content: string, context: ApiQueryHookContext) => TResult
  // React hook api Query Hook Helper在这里处理 `logResult: (`，完成这一小步状态转换。
  logResult: (
    result: ApiQueryResult<TResult>,
    context: ApiQueryHookContext,
  ) => void
  // Must be a function to ensure lazy loading (config is accessed before allowed)
  // Receives context so callers can inherit the main loop model if desired.
  // 这个回调绑定到 getModel: (context: ApiQueryHookContext) => string，负责共享工具在该局部场景下的响应。
  getModel: (context: ApiQueryHookContext) => string
}

export type ApiQueryResult<TResult> =
  | {
      type: 'success'
      queryName: string
      result: TResult
      messageId: string
      model: string
      uuid: string
    }
  | {
      type: 'error'
      queryName: string
      error: Error
      uuid: string
    }

// createApiQueryHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createApiQueryHook<TResult>(
  config: ApiQueryHookConfig<TResult>,
) {
  // 返回 `async (context: ApiQueryHookContext): Promise<void> => {`，作为共享工具这次计算的结果。
  return async (context: ApiQueryHookContext): Promise<void> => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // shouldRun记录 `config.shouldRun` 是否成立，共享工具随后按该结果分支。
      const shouldRun = await config.shouldRun(context)
      // shouldRun缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!shouldRun) {
        // React hook api Query Hook Helper在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // uuid保存`randomUUID`，供共享工具后续处理使用。
      const uuid = randomUUID()

      // Build messages using the config's buildMessages function
      // 对话消息构建`config.buildMessages`，供共享工具后续处理使用。
      const messages = config.buildMessages(context)
      // queryMessageCount 消息数据更新为 `messages.length`，确保共享工具后续读取最新状态。
      context.queryMessageCount = messages.length

      // Use config's system prompt if provided, otherwise use context's
      // 系统提示词 命名 `config.systemPrompt`，让后续代码直接表达这个值的用途。
      const systemPrompt = config.systemPrompt
        ? asSystemPrompt([config.systemPrompt])
        : context.systemPrompt

      // Use config's tools preference (defaults to true = use context tools)
      // useTools 集合 命名 `config.useTools ?? true`，让后续代码直接表达这个值的用途。
      const useTools = config.useTools ?? true
      // tools 集合读取 hook 状态，供共享工具React hook api Query Hook Hel...本轮渲染使用。
      const tools = useTools ? context.toolUseContext.options.tools : []

      // Get model (lazy loaded)
      // 模型名称读取`config.getModel`，供共享工具后续处理使用。
      const model = config.getModel(context)

      // Make API call
      // 接口响应保存`queryModelWithoutStreaming`，供共享工具后续处理使用。
      const response = await queryModelWithoutStreaming({
        messages,
        systemPrompt,
        thinkingConfig: { type: 'disabled' as const },
        tools,
        signal: createAbortController().signal,
        options: {
          // 这个回调绑定到 getToolPermissionContext: async () => {，负责共享工具在该局部场景下的响应。
          getToolPermissionContext: async () => {
            // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
            const appState = context.toolUseContext.getAppState()
            // 返回 `appState.toolPermissionContext`，作为共享工具这次计算的结果。
            return appState.toolPermissionContext
          },
          model,
          toolChoice: undefined,
          isNonInteractiveSession:
            context.toolUseContext.options.isNonInteractiveSession,
          hasAppendSystemPrompt:
            !!context.toolUseContext.options.appendSystemPrompt,
          temperatureOverride: 0,
          agents: context.toolUseContext.options.agentDefinitions.activeAgents,
          querySource: config.name,
          mcpTools: [],
          agentId: context.toolUseContext.agentId,
        },
      })

      // Parse response
      // 文本内容保存`extractTextContent`，供共享工具后续处理使用。
      const content = extractTextContent(response.message.content).trim()

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果解析`config.parseResponse`，供共享工具后续处理使用。
        const result = config.parseResponse(content, context)
        // 调用 config.logResult，触发共享工具此处需要的副作用。
        config.logResult(
          {
            type: 'success',
            queryName: config.name,
            result,
            messageId: response.message.id,
            model,
            uuid,
          },
          context,
        )
      } catch (error) {
        // 调用 config.logResult，触发共享工具此处需要的副作用。
        config.logResult(
          {
            type: 'error',
            queryName: config.name,
            error: error as Error,
            uuid,
          },
          context,
        )
      }
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
    }
  }
}
