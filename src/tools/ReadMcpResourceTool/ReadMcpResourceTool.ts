// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type ReadResourceResult,
  ReadResourceResultSchema,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 ensureConnectedClient 服务层能力，把外部通信或共享状态交给 ../../services/mcp/client.js 处理。
import { ensureConnectedClient } from '../../services/mcp/client.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getBinaryBlobSavedMessage,
  persistBinaryContent,
} from '../../utils/mcpOutputStorage.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 isOutputLineTruncated 工具函数，把通用处理留在 ../../utils/terminal.js 中维护。
import { isOutputLineTruncated } from '../../utils/terminal.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseMessage,
  userFacingName,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
export const inputSchema = lazySchema(() =>
  z.object({
    server: z.string().describe('The MCP server name'),
    uri: z.string().describe('The resource URI to read'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() =>
  z.object({
    contents: z.array(
      z.object({
        uri: z.string().describe('Resource URI'),
        mimeType: z.string().optional().describe('MIME type of the content'),
        text: z.string().optional().describe('Text content of the resource'),
        blobSavedTo: z
          .string()
          .optional()
          .describe('Path where binary blob content was saved'),
      }),
    ),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// ReadMcpResourceTool构建`buildTool`，供工具调用后续处理使用。
export const ReadMcpResourceTool = buildTool({
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
    // 返回 ``${input.server} ${input.uri}``，作为工具调用这次计算的结果。
    return `${input.server} ${input.uri}`
  },
  shouldDefer: true,
  name: 'ReadMcpResourceTool',
  searchHint: 'read a specific MCP resource by URI',
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
  // 工具实现 Read Mcp Resource Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Read Mcp Resource Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // call 使用 input, { options: { mcpClients } } 完成工具调用里的对应操作。
  async call(input, { options: { mcpClients } }) {
    // 从 `input` 解构 server、uri，减少工具实现 Read Mcp Resource Tool对同一对象的重复访问。
    const { server: serverName, uri } = input

    // API 客户端筛选`mcpClients.find`，供工具调用后续处理使用。
    const client = mcpClients.find(client => client.name === serverName)

    // API 客户端缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!client) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        // 这个回调绑定到 `Server "${serverName}" not found. Available servers: ${mcpClients.map(c => c.name).…，负责工具调用在该局部场景下的响应。
        `Server "${serverName}" not found. Available servers: ${mcpClients.map(c => c.name).join(', ')}`,
      )
    }

    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') {
      // 抛出 new Error(`Server "${serverName}" is not connected`)，阻止工具调用在无效状态下继续运行。
      throw new Error(`Server "${serverName}" is not connected`)
    }

    // 满足 `!client.capabilities?.resources` 时，工具调用执行该分支。
    if (!client.capabilities?.resources) {
      // 抛出 new Error(`Server "${serverName}" does not support resources`)，阻止工具调用在无效状态下继续运行。
      throw new Error(`Server "${serverName}" does not support resources`)
    }

    // connectedClient保存`ensureConnectedClient`，供工具调用后续处理使用。
    const connectedClient = await ensureConnectedClient(client)
    // 结果保存`client.request`，供工具调用后续处理使用。
    const result = (await connectedClient.client.request(
      {
        method: 'resources/read',
        params: { uri },
      },
      ReadResourceResultSchema,
    )) as ReadResourceResult

    // Intercept any blob fields: decode, write raw bytes to disk with a
    // mime-derived extension, and replace with a path. Otherwise the base64
    // would be stringified straight into the context.
    // contents 集合保存`Promise.all`，供工具调用后续处理使用。
    const contents = await Promise.all(
      // 调用 result.contents.map，触发工具调用此处需要的副作用。
      result.contents.map(async (c, i) => {
        // 满足 `'text' in c` 时，工具调用执行该分支。
        if ('text' in c) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return { uri: c.uri, mimeType: c.mimeType, text: c.text }
        }
        // `!('blob' in c) || typeof c.blob` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (!('blob' in c) || typeof c.blob !== 'string') {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return { uri: c.uri, mimeType: c.mimeType }
        }
        // persistId记录时间`Date.now`，供工具调用后续处理使用。
        const persistId = `mcp-resource-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`
        // persisted保存`persistBinaryContent`，供工具调用后续处理使用。
        const persisted = await persistBinaryContent(
          Buffer.from(c.blob, 'base64'),
          c.mimeType,
          persistId,
        )
        // 满足 `'error' in persisted` 时，工具调用执行该分支。
        if ('error' in persisted) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            uri: c.uri,
            mimeType: c.mimeType,
            text: `Binary content could not be saved to disk: ${persisted.error}`,
          }
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          uri: c.uri,
          mimeType: c.mimeType,
          blobSavedTo: persisted.filepath,
          text: getBinaryBlobSavedMessage(
            persisted.filepath,
            c.mimeType,
            persisted.size,
            `[Resource from ${serverName} at ${c.uri}] `,
          ),
        }
      }),
    )

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: { contents },
    }
  },
  renderToolUseMessage,
  userFacingName,
  renderToolResultMessage,
  // isResultTruncated 用 output: Output 判断工具调用是否满足条件。
  isResultTruncated(output: Output): boolean {
    // 返回 `isOutputLineTruncated(jsonStringify(output))`，作为工具调用这次计算的结果。
    return isOutputLineTruncated(jsonStringify(output))
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: jsonStringify(content),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
