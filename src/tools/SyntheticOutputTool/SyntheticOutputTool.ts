// 引入 Ajv，将 ajv 中已经封装好的能力接到本文件流程里。
import { Ajv } from 'ajv'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { Tool, ToolInputJSONSchema } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool, ToolInputJSONSchema } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../utils/errors.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

// Allow any input object since the schema is provided dynamically
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.object({}).passthrough())
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.string().describe('Structured output tool result'),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// SYNTHETIC_OUTPUT_TOOL_NAME固定为 `'StructuredOutput'`，作为工具实现 Synthetic Output Tool后续展示或比较的基准。
export const SYNTHETIC_OUTPUT_TOOL_NAME = 'StructuredOutput'

// isSyntheticOutputToolEnabled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSyntheticOutputToolEnabled(opts: {
  isNonInteractiveSession: boolean
}): boolean {
  // 返回 `opts.isNonInteractiveSession`，作为工具调用这次计算的结果。
  return opts.isNonInteractiveSession
}

// SyntheticOutputTool构建`buildTool`，供工具调用后续处理使用。
export const SyntheticOutputTool = buildTool({
  isMcp: false,
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // This tool is only created when conditions are met (see main.tsx where
    // isSyntheticOutputToolEnabled() gates tool creation). Once created, always enabled.
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
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
  // isOpenWorld 用 无 判断工具调用是否满足条件。
  isOpenWorld() {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  name: SYNTHETIC_OUTPUT_TOOL_NAME,
  searchHint: 'return the final response as structured JSON',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description(): Promise<string> {
    // 返回 `'Return structured output in the requested format'`，作为工具调用这次计算的结果。
    return 'Return structured output in the requested format'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt(): Promise<string> {
    // 返回 ``Use this tool to return your final response in the requested structure...`，作为工具调用这次计算的结果。
    return `Use this tool to return your final response in the requested structured format. You MUST call this tool exactly once at the end of your response to provide the structured output.`
  },
  // 工具实现 Synthetic Output Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Synthetic Output Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // call 使用 input 完成工具调用里的对应操作。
  async call(input) {
    // The tool just validates and returns the input as the structured output
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: 'Structured output provided successfully',
      structured_output: input,
    }
  },
  // checkPermissions 使用 input 完成工具调用里的对应操作。
  async checkPermissions(input): Promise<PermissionResult> {
    // Always allow this tool - it's just returning data
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: input,
    }
  },
  // Minimal UI implementations - this tool is for non-interactive SDK/CLI use
  // renderToolUseMessage 使用 input: Record<string, unknown> 完成工具调用里的对应操作。
  renderToolUseMessage(input: Record<string, unknown>) {
    // keys 集合派生`Object.keys`，供工具调用后续处理使用。
    const keys = Object.keys(input)
    // keys 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (keys.length === 0) return null
    // 满足 `keys.length <= 3` 时，工具调用执行该分支。
    if (keys.length <= 3) {
      // 返回 `keys.map(k => `${k}: ${jsonStringify(input[k])}`).join(', ')`，作为工具调用这次计算的结果。
      return keys.map(k => `${k}: ${jsonStringify(input[k])}`).join(', ')
    }
    // 返回 ``${keys.length} fields: ${keys.slice(0, 3).join(', ')}…``，作为工具调用这次计算的结果。
    return `${keys.length} fields: ${keys.slice(0, 3).join(', ')}…`
  },
  // renderToolUseRejectedMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseRejectedMessage() {
    // 返回 `'Structured output rejected'`，作为工具调用这次计算的结果。
    return 'Structured output rejected'
  },
  // renderToolUseErrorMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseErrorMessage() {
    // 返回 `'Structured output error'`，作为工具调用这次计算的结果。
    return 'Structured output error'
  },
  // renderToolUseProgressMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseProgressMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // renderToolResultMessage 使用 output: string 完成工具调用里的对应操作。
  renderToolResultMessage(output: string) {
    // 返回 `output`，作为工具调用这次计算的结果。
    return output
  },
  // mapToolResultToToolResultBlockParam 使用 content: string, toolUseID: string 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content: string, toolUseID: string) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)

// CreateResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type CreateResult = { tool: Tool<InputSchema> } | { error: string }

// Workflow scripts call agent({schema: BUGS_SCHEMA}) 30-80 times per run with
// the same schema object reference. Without caching, each call does
// new Ajv() + validateSchema() + compile() (~1.4ms of JIT codegen). Identity
// cache brings 80-call workflows from ~110ms to ~4ms Ajv overhead.
// toolCache 缓存构建`new WeakMap<object, CreateResult>()` 整理出中间结果，供工具实现 Synthetic Output Tool后续步骤使用。
const toolCache = new WeakMap<object, CreateResult>()

/**
 * Create a SyntheticOutputTool configured with the given JSON schema.
 * Returns {tool} on success or {error} with Ajv's diagnostic message
 * (e.g. "data/properties/bugs should be object") on invalid schema.
 */
// createSyntheticOutputTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSyntheticOutputTool(
  jsonSchema: Record<string, unknown>,
): CreateResult {
  // cached 缓存读取`toolCache.get`，供工具调用后续处理使用。
  const cached = toolCache.get(jsonSchema)
  // 满足 `cached` 时，工具调用执行该分支。
  if (cached) return cached

  // 结果构建`buildSyntheticOutputTool`，供工具调用后续处理使用。
  const result = buildSyntheticOutputTool(jsonSchema)
  // toolCache.set 写入新的状态值，使工具调用后续读取保持一致。
  toolCache.set(jsonSchema, result)
  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}

// buildSyntheticOutputTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildSyntheticOutputTool(
  jsonSchema: Record<string, unknown>,
): CreateResult {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // ajv保存`Ajv`，供工具调用后续处理使用。
    const ajv = new Ajv({ allErrors: true })
    // isValidSchema记录 `ajv.validateSchema` 是否成立，工具调用随后按该结果分支。
    const isValidSchema = ajv.validateSchema(jsonSchema)
    // isValidSchema缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!isValidSchema) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { error: ajv.errorsText(ajv.errors) }
    }
    // validateSchema保存`ajv.compile`，供工具调用后续处理使用。
    const validateSchema = ajv.compile(jsonSchema)

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool: {
        ...SyntheticOutputTool,
        inputJSONSchema: jsonSchema as ToolInputJSONSchema,
        // call 使用 input 完成工具调用里的对应操作。
        async call(input) {
          // isValid记录 `validateSchema` 是否成立，工具调用随后按该结果分支。
          const isValid = validateSchema(input)
          // isValid缺失时直接走兜底路径，避免工具调用使用无效输入。
          if (!isValid) {
            // 错误列表读取`validateSchema.errors`，供后续判断或组装使用。
            const errors = validateSchema.errors
              ?.map(e => `${e.instancePath || 'root'}: ${e.message}`)
              .join(', ')
            // 抛出 new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止工具调用在无效状态下继续运行。
            throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
              `Output does not match required schema: ${errors}`,
              `StructuredOutput schema mismatch: ${(errors ?? '').slice(0, 150)}`,
            )
          }
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: 'Structured output provided successfully',
            structured_output: input,
          }
        },
      },
    }
  } catch (e) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
