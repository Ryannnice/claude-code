// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { z } from 'zod/v4'

/**
 * Boolean that also accepts the string literals "true"/"false".
 *
 * Tool inputs arrive as model-generated JSON. The model occasionally quotes
 * booleans — `"replace_all":"false"` instead of `"replace_all":false` — and
 * z.boolean() rejects that with a type error. z.coerce.boolean() is the wrong
 * fix: it uses JS truthiness, so "false" → true.
 *
 * z.preprocess emits {"type":"boolean"} to the API schema, so the model is
 * still told this is a boolean — the string tolerance is invisible client-side
 * coercion, not an advertised input shape.
 *
 * .optional()/.default() go INSIDE (on the inner schema), not chained after:
 * chaining them onto ZodPipe widens z.output<> to unknown in Zod v4.
 *
 *   semanticBoolean()                              → boolean
 *   semanticBoolean(z.boolean().optional())        → boolean | undefined
 *   semanticBoolean(z.boolean().default(false))    → boolean
 */
// semanticBoolean 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function semanticBoolean<T extends z.ZodType>(
  inner: T = z.boolean() as unknown as T,
) {
  // 返回 `z.preprocess(`，作为共享工具这次计算的结果。
  return z.preprocess(
    (v: unknown) => (v === 'true' ? true : v === 'false' ? false : v),
    inner,
  )
}
