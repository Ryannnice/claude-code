// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 复用 isOutputLineTruncated 工具函数，把通用处理留在 ../../utils/terminal.js 中维护。
import { isOutputLineTruncated } from '../../utils/terminal.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
} from './UI.js'

// Allow any input object since MCP tools define their own schemas
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
export const inputSchema = lazySchema(() => z.object({}).passthrough())
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
export const outputSchema = lazySchema(() =>
  z.string().describe('MCP tool execution result'),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// Re-export MCPProgress from centralized types to break import cycles
// 导出类型定义，让其他模块沿用工具实现 MCPTool的数据契约。
export type { MCPProgress } from '../../types/tools.js'

// MCPTool构建`buildTool`，供工具调用后续处理使用。
export const MCPTool = buildTool({
  isMcp: true,
  // Overridden in mcpClient.ts with the real MCP tool name + args
  // isOpenWorld 用 无 判断工具调用是否满足条件。
  isOpenWorld() {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  // Overridden in mcpClient.ts
  name: 'mcp',
  maxResultSizeChars: 100_000,
  // Overridden in mcpClient.ts
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // Overridden in mcpClient.ts
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `PROMPT`，作为工具调用这次计算的结果。
    return PROMPT
  },
  // 工具实现 MCPTool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 MCPTool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // Overridden in mcpClient.ts
  // call 使用 无 完成工具调用里的对应操作。
  async call() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: '',
    }
  },
  // checkPermissions 使用 无 完成工具调用里的对应操作。
  async checkPermissions(): Promise<PermissionResult> {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'MCPTool requires permission.',
    }
  },
  renderToolUseMessage,
  // Overridden in mcpClient.ts
  // 这个回调绑定到 userFacingName: () => 'mcp',，负责工具调用在该局部场景下的响应。
  userFacingName: () => 'mcp',
  renderToolUseProgressMessage,
  renderToolResultMessage,
  // isResultTruncated 用 output: Output 判断工具调用是否满足条件。
  isResultTruncated(output: Output): boolean {
    // 返回 `isOutputLineTruncated(output)`，作为工具调用这次计算的结果。
    return isOutputLineTruncated(output)
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
