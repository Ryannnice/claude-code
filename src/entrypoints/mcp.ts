// 引入 Server，将 @modelcontextprotocol/sdk/server/index.js 中已经封装好的能力接到本文件流程里。
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
// 引入 StdioServerTransport，将 @modelcontextprotocol/sdk/server/stdio.js 中已经封装好的能力接到本文件流程里。
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
// 整理这一组导入，让mcp后续逻辑可以直接复用这些外部能力。
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type ListToolsResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 getDefaultAppState，将 src/state/AppStateStore.js 中已经封装好的能力接到本文件流程里。
import { getDefaultAppState } from 'src/state/AppStateStore.js'
// 注册 review 命令实现，后续会把它纳入斜杠命令集合。
import review from '../commands/review.js'
// 类型依赖 { Command } 来自 ../commands.js，用于校准mcp的数据契约。
import type { Command } from '../commands.js'
// 整理这一组导入，让mcp后续逻辑可以直接复用这些外部能力。
import {
  findToolByName,
  getEmptyToolPermissionContext,
  type ToolUseContext,
} from '../Tool.js'
// 引入 getTools，将 ../tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from '../tools.js'
// 复用 createAbortController 工具函数，把通用处理留在 ../utils/abortController.js 中维护。
import { createAbortController } from '../utils/abortController.js'
// 复用 createFileStateCacheWithSizeLimit 工具函数，把通用处理留在 ../utils/fileStateCache.js 中维护。
import { createFileStateCacheWithSizeLimit } from '../utils/fileStateCache.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 createAssistantMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createAssistantMessage } from '../utils/messages.js'
// 复用 getMainLoopModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { getMainLoopModel } from '../utils/model/model.js'
// 复用 hasPermissionsToUseTool 工具函数，把通用处理留在 ../utils/permissions/permissions.js 中维护。
import { hasPermissionsToUseTool } from '../utils/permissions/permissions.js'
// 复用 setCwd 工具函数，把通用处理留在 ../utils/Shell.js 中维护。
import { setCwd } from '../utils/Shell.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 复用 getErrorParts 工具函数，把通用处理留在 ../utils/toolErrors.js 中维护。
import { getErrorParts } from '../utils/toolErrors.js'
// 复用 zodToJsonSchema 工具函数，把通用处理留在 ../utils/zodToJsonSchema.js 中维护。
import { zodToJsonSchema } from '../utils/zodToJsonSchema.js'

// ToolInput 固化mcp里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolInput = Tool['inputSchema']
// ToolOutput 固化mcp里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolOutput = Tool['outputSchema']

// MCP_COMMANDS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const MCP_COMMANDS: Command[] = [review]

// startMCPServer 封装mcp的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startMCPServer(
  cwd: string,
  debug: boolean,
  verbose: boolean,
): Promise<void> {
  // Use size-limited LRU cache for readFileState to prevent unbounded memory growth
  // 100 files and 25MB limit should be sufficient for MCP server operations
  // READ_FILE_STATE_CACHE_SIZE 文件数据保存`100`，供mcp后续判断或输出使用。
  const READ_FILE_STATE_CACHE_SIZE = 100
  // readFileStateCache 文件数据构建`createFileStateCacheWithSizeLimit`，供mcp后续处理使用。
  const readFileStateCache = createFileStateCacheWithSizeLimit(
    READ_FILE_STATE_CACHE_SIZE,
  )
  // setCwd 写入新的状态值，使mcp后续读取保持一致。
  setCwd(cwd)
  // server保存`Server`，供mcp后续处理使用。
  const server = new Server(
    {
      name: 'claude/tengu',
      version: MACRO.VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  // server.setRequestHandler 写入新的状态值，使mcp后续读取保持一致。
  server.setRequestHandler(
    ListToolsRequestSchema,
    // 这个异步回调接收 无，串起mcp的等待、调用和返回。
    async (): Promise<ListToolsResult> => {
      // TODO: Also re-expose any MCP tools
      // toolPermissionContext 权限数据读取`getEmptyToolPermissionContext`，供mcp后续处理使用。
      const toolPermissionContext = getEmptyToolPermissionContext()
      // tools 集合读取`getTools`，供mcp后续处理使用。
      const tools = getTools(toolPermissionContext)
      // 返回结构化结果，集中表达mcp已经整理出的状态。
      return {
        tools: await Promise.all(
          // 调用 tools.map，触发mcp此处需要的副作用。
          tools.map(async tool => {
            // outputSchema 先占位，稍后的条件分支会根据实际输入补齐它。
            let outputSchema: ToolOutput | undefined
            // 满足 `tool.outputSchema` 时，mcp执行该分支。
            if (tool.outputSchema) {
              // convertedSchema保存`zodToJsonSchema`，供mcp后续处理使用。
              const convertedSchema = zodToJsonSchema(tool.outputSchema)
              // MCP SDK requires outputSchema to have type: "object" at root level
              // Skip schemas with anyOf/oneOf at root (from z.union, z.discriminatedUnion, etc.)
              // See: https://github.com/anthropics/claude-code/issues/8014
              // mcp在这里进入条件判断，后续代码按实际状态分流。
              if (
                typeof convertedSchema === 'object' &&
                convertedSchema !== null &&
                'type' in convertedSchema &&
                convertedSchema.type === 'object'
              ) {
                // outputSchema更新为 `convertedSchema as ToolOutput`，确保mcp后续读取最新状态。
                outputSchema = convertedSchema as ToolOutput
              }
            }
            // 返回结构化结果，集中表达mcp已经整理出的状态。
            return {
              ...tool,
              description: await tool.prompt({
                // 这个回调绑定到 getToolPermissionContext: async () => toolPermissionContext,，负责mcp在该局部场景下的响应。
                getToolPermissionContext: async () => toolPermissionContext,
                tools,
                agents: [],
              }),
              inputSchema: zodToJsonSchema(tool.inputSchema) as ToolInput,
              outputSchema,
            }
          }),
        ),
      }
    },
  )

  // server.setRequestHandler 写入新的状态值，使mcp后续读取保持一致。
  server.setRequestHandler(
    CallToolRequestSchema,
    // 这个异步回调接收 { params: { name, arguments: args } }，串起mcp的等待、调用和返回。
    async ({ params: { name, arguments: args } }): Promise<CallToolResult> => {
      // toolPermissionContext 权限数据读取`getEmptyToolPermissionContext`，供mcp后续处理使用。
      const toolPermissionContext = getEmptyToolPermissionContext()
      // TODO: Also re-expose any MCP tools
      // tools 集合读取`getTools`，供mcp后续处理使用。
      const tools = getTools(toolPermissionContext)
      // 工具筛选`findToolByName`，供mcp后续处理使用。
      const tool = findToolByName(tools, name)
      // 工具缺失时提前走兜底路径，避免mcp继续依赖无效输入。
      if (!tool) {
        // 抛出 new Error(`Tool ${name} not found`)，阻止mcp在无效状态下继续运行。
        throw new Error(`Tool ${name} not found`)
      }

      // Assume MCP servers do not read messages separately from the tool
      // call arguments.
      // toolUseContext 集中保存mcp要一起传递的字段。
      const toolUseContext: ToolUseContext = {
        abortController: createAbortController(),
        options: {
          commands: MCP_COMMANDS,
          tools,
          mainLoopModel: getMainLoopModel(),
          thinkingConfig: { type: 'disabled' },
          mcpClients: [],
          mcpResources: {},
          isNonInteractiveSession: true,
          debug,
          verbose,
          agentDefinitions: { activeAgents: [], allAgents: [] },
        },
        // 这个回调绑定到 getAppState: () => getDefaultAppState(),，负责mcp在该局部场景下的响应。
        getAppState: () => getDefaultAppState(),
        // 这个回调绑定到 setAppState: () => {},，负责mcp在该局部场景下的响应。
        setAppState: () => {},
        messages: [],
        readFileState: readFileStateCache,
        // 这个回调绑定到 setInProgressToolUseIDs: () => {},，负责mcp在该局部场景下的响应。
        setInProgressToolUseIDs: () => {},
        // 这个回调绑定到 setResponseLength: () => {},，负责mcp在该局部场景下的响应。
        setResponseLength: () => {},
        // 这个回调绑定到 updateFileHistoryState: () => {},，负责mcp在该局部场景下的响应。
        updateFileHistoryState: () => {},
        // 这个回调绑定到 updateAttributionState: () => {},，负责mcp在该局部场景下的响应。
        updateAttributionState: () => {},
      }

      // TODO: validate input types with zod
      // 保护这一段可能失败的mcp操作，确保异常能进入相邻错误处理。
      try {
        // 满足 `!tool.isEnabled()` 时，mcp执行该分支。
        if (!tool.isEnabled()) {
          // 抛出 new Error(`Tool ${name} is not enabled`)，阻止mcp在无效状态下继续运行。
          throw new Error(`Tool ${name} is not enabled`)
        }
        // validationResult 等待 `tool.validateInput?.(`，确保继续执行前已有结果。
        const validationResult = await tool.validateInput?.(
          (args as never) ?? {},
          toolUseContext,
        )
        // 组合条件 `validationResult && !validationResult.result` 成立时，mcp才启用这条专门路径。
        if (validationResult && !validationResult.result) {
          // 抛出 new Error(，阻止mcp在无效状态下继续运行。
          throw new Error(
            `Tool ${name} input is invalid: ${validationResult.message}`,
          )
        }
        // finalResult保存`tool.call`，供mcp后续处理使用。
        const finalResult = await tool.call(
          (args ?? {}) as never,
          toolUseContext,
          hasPermissionsToUseTool,
          createAssistantMessage({
            content: [],
          }),
        )

        // 返回结构化结果，集中表达mcp已经整理出的状态。
        return {
          content: [
            {
              type: 'text' as const,
              text:
                typeof finalResult === 'string'
                  ? finalResult
                  : jsonStringify(finalResult.data),
            },
          ],
        }
      } catch (error) {
        // 记录mcp运行诊断，方便排查异常路径或性能问题。
        logError(error)

        // parts 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const parts =
          error instanceof Error ? getErrorParts(error) : [String(error)]
        // errorText 错误信息筛选`parts.filter`，供mcp后续处理使用。
        const errorText = parts.filter(Boolean).join('\n').trim() || 'Error'

        // 返回结构化结果，集中表达mcp已经整理出的状态。
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: errorText,
            },
          ],
        }
      }
    },
  )

  // runServer 封装mcp的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function runServer() {
    // transport保存`StdioServerTransport`，供mcp后续处理使用。
    const transport = new StdioServerTransport()
    // 等待 `server.connect(transport)` 完成，再继续mcp的异步流程。
    await server.connect(transport)
  }

  // 等待并返回 `runServer()`，调用方直接接收异步结果。
  return await runServer()
}
