/**
 * Converts Zod v4 schemas to JSON Schema using native toJSONSchema.
 */

// 引入 toJSONSchema、ZodTypeAny，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { toJSONSchema, type ZodTypeAny } from 'zod/v4'

// JsonSchema7Type 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type JsonSchema7Type = Record<string, unknown>

// toolToAPISchema() runs this for every tool on every API request (~60-250
// times/turn). Tool schemas are wrapped with lazySchema() which guarantees the
// same ZodTypeAny reference per session, so we can cache by identity.
// cache 缓存构建`new WeakMap<ZodTypeAny, JsonSchema7Type>()` 整理出中间结果，供共享工具 zod To Json Schema后续步骤使用。
const cache = new WeakMap<ZodTypeAny, JsonSchema7Type>()

/**
 * Converts a Zod v4 schema to JSON Schema format.
 */
// zodToJsonSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema7Type {
  // hit读取`cache.get`，供共享工具后续处理使用。
  const hit = cache.get(schema)
  // 满足 `hit` 时，共享工具执行该分支。
  if (hit) return hit
  // 结果保存`toJSONSchema`，供共享工具后续处理使用。
  const result = toJSONSchema(schema) as JsonSchema7Type
  // cache.set 写入新的状态值，使共享工具后续读取保持一致。
  cache.set(schema, result)
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
