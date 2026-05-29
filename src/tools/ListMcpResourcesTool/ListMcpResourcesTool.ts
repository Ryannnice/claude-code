// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  ensureConnectedClient,
  fetchResourcesForClient,
} from '../../services/mcp/client.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPError } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 isOutputLineTruncated 工具函数，把通用处理留在 ../../utils/terminal.js 中维护。
import { isOutputLineTruncated } from '../../utils/terminal.js'
// 引入 DESCRIPTION、LIST_MCP_RESOURCES_TOOL_NAME、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, LIST_MCP_RESOURCES_TOOL_NAME, PROMPT } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.object({
    server: z
      .string()
      .optional()
      .describe('Optional server name to filter resources by'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.array(
    z.object({
      uri: z.string().describe('Resource URI'),
      name: z.string().describe('Resource name'),
      mimeType: z.string().optional().describe('MIME type of the resource'),
      description: z.string().optional().describe('Resource description'),
      server: z.string().describe('Server that provides this resource'),
    }),
  ),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// ListMcpResourcesTool 集合构建`buildTool`，供工具调用后续处理使用。
export const ListMcpResourcesTool = buildTool({
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.server ?? ''`，作为工具调用这次计算的结果。
    return input.server ?? ''
  },
  shouldDefer: true,
  name: LIST_MCP_RESOURCES_TOOL_NAME,
  searchHint: 'list resources from connected MCP servers',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `PROMPT`，作为工具调用这次计算的结果。
    return PROMPT
  },
  // 工具实现 List Mcp Resources Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 List Mcp Resources Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // call 使用 input, { options: { mcpClients } } 完成工具调用里的对应操作。
  async call(input, { options: { mcpClients } }) {
    // 从 `input` 解构 server，减少工具实现 List Mcp Resources Tool对同一对象的重复访问。
    const { server: targetServer } = input

    // clientsToProcess 集合 命名 `targetServer`，让后续代码直接表达这个值的用途。
    const clientsToProcess = targetServer
      ? mcpClients.filter(client => client.name === targetServer)
      : mcpClients

    // targetServer && clientsToProcess 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (targetServer && clientsToProcess.length === 0) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        // 这个回调绑定到 `Server "${targetServer}" not found. Available servers: ${mcpClients.map(c => c.name…，负责工具调用在该局部场景下的响应。
        `Server "${targetServer}" not found. Available servers: ${mcpClients.map(c => c.name).join(', ')}`,
      )
    }

    // fetchResourcesForClient is LRU-cached (by server name) and already
    // warm from startup prefetch. Cache is invalidated on onclose and on
    // resources/list_changed notifications, so results are never stale.
    // ensureConnectedClient is a no-op when healthy (memoize hit), but after
    // onclose it returns a fresh connection so the re-fetch succeeds.
    // 结果列表保存`Promise.all`，供工具调用后续处理使用。
    const results = await Promise.all(
      // 调用 clientsToProcess.map，触发工具调用此处需要的副作用。
      clientsToProcess.map(async client => {
        // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
        if (client.type !== 'connected') return []
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // fresh保存`ensureConnectedClient`，供工具调用后续处理使用。
          const fresh = await ensureConnectedClient(client)
          // 等待并返回 `fetchResourcesForClient(fresh)`，调用方直接接收异步结果。
          return await fetchResourcesForClient(fresh)
        } catch (error) {
          // One server's reconnect failure shouldn't sink the whole result.
          // 调用 logMCPError，触发工具调用此处需要的副作用。
          logMCPError(client.name, errorMessage(error))
          // 返回列表结果，保留工具调用已经排好的条目顺序。
          return []
        }
      }),
    )

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: results.flat(),
    }
  },
  renderToolUseMessage,
  // 这个回调绑定到 userFacingName: () => 'listMcpResources',，负责工具调用在该局部场景下的响应。
  userFacingName: () => 'listMcpResources',
  renderToolResultMessage,
  // isResultTruncated 用 output: Output 判断工具调用是否满足条件。
  isResultTruncated(output: Output): boolean {
    // 返回 `isOutputLineTruncated(jsonStringify(output))`，作为工具调用这次计算的结果。
    return isOutputLineTruncated(jsonStringify(output))
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // !content || content为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (!content || content.length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content:
          'No resources found. MCP servers may still provide tools even if they have no resources.',
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: jsonStringify(content),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
