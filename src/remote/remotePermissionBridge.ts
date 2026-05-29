// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { SDKControlPermissionRequest } 来自 ../entrypoints/sdk/controlTypes.js，用于校准remote Permission Bridge的数据契约。
import type { SDKControlPermissionRequest } from '../entrypoints/sdk/controlTypes.js'
// 类型依赖 { Tool } 来自 ../Tool.js，用于校准remote Permission Bridge的数据契约。
import type { Tool } from '../Tool.js'
// 类型依赖 { AssistantMessage } 来自 ../types/message.js，用于校准remote Permission Bridge的数据契约。
import type { AssistantMessage } from '../types/message.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'

/**
 * Create a synthetic AssistantMessage for remote permission requests.
 * The ToolUseConfirm type requires an AssistantMessage, but in remote mode
 * we don't have a real one — the tool use runs on the CCR container.
 */
// createSyntheticAssistantMessage 封装remotePermissionBridge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSyntheticAssistantMessage(
  request: SDKControlPermissionRequest,
  requestId: string,
): AssistantMessage {
  // 返回结构化结果，集中表达remote Permission Bridge已经整理出的状态。
  return {
    type: 'assistant',
    uuid: randomUUID(),
    message: {
      id: `remote-${requestId}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: request.tool_use_id,
          name: request.tool_name,
          input: request.input,
        },
      ],
      model: '',
      stop_reason: null,
      stop_sequence: null,
      container: null,
      context_management: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    } as AssistantMessage['message'],
    requestId: undefined,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a minimal Tool stub for tools that aren't loaded locally.
 * This happens when the remote CCR has tools (e.g., MCP tools) that the
 * local CLI doesn't know about. The stub routes to FallbackPermissionRequest.
 */
// createToolStub 封装remotePermissionBridge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createToolStub(toolName: string): Tool {
  // 返回结构化结果，集中表达remote Permission Bridge已经整理出的状态。
  return {
    name: toolName,
    inputSchema: {} as Tool['inputSchema'],
    // 这个回调绑定到 isEnabled: () => true,，负责remote Permission Bridge在该局部场景下的响应。
    isEnabled: () => true,
    // 这个回调绑定到 userFacingName: () => toolName,，负责remote Permission Bridge在该局部场景下的响应。
    userFacingName: () => toolName,
    // 这个回调绑定到 renderToolUseMessage: (input: Record<string, unknown>) => {，负责remote Permission Bridge在该局部场景下的响应。
    renderToolUseMessage: (input: Record<string, unknown>) => {
      // entries 集合派生`Object.entries`，供remote Permission Bridge后续处理使用。
      const entries = Object.entries(input)
      // entries 集合为空时立即返回或跳过，避免remote Permission Bridge把空集合当成可处理内容。
      if (entries.length === 0) return ''
      // 返回 `entries`，作为remote Permission Bridge这次计算的结果。
      return entries
        .slice(0, 3)
        // 链式调用 map，继续加工上一行在remote Permission Bridge中产生的数据。
        .map(([key, value]) => {
          // valueStr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const valueStr =
            typeof value === 'string' ? value : jsonStringify(value)
          // 返回 ``${key}: ${valueStr}``，作为remote Permission Bridge这次计算的结果。
          return `${key}: ${valueStr}`
        })
        .join(', ')
    },
    // 这个回调绑定到 call: async () => ({ data: '' }),，负责remote Permission Bridge在该局部场景下的响应。
    call: async () => ({ data: '' }),
    // 这个回调绑定到 description: async () => '',，负责remote Permission Bridge在该局部场景下的响应。
    description: async () => '',
    // 这个回调绑定到 prompt: () => '',，负责remote Permission Bridge在该局部场景下的响应。
    prompt: () => '',
    // 这个回调绑定到 isReadOnly: () => false,，负责remote Permission Bridge在该局部场景下的响应。
    isReadOnly: () => false,
    isMcp: false,
    // 这个回调绑定到 needsPermissions: () => true,，负责remote Permission Bridge在该局部场景下的响应。
    needsPermissions: () => true,
  } as unknown as Tool
}
