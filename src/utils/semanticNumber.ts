// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { z } from 'zod/v4'

/**
 * Number that also accepts numeric string literals like "30", "-5", "3.14".
 *
 * Tool inputs arrive as model-generated JSON. The model occasionally quotes
 * numbers — `"head_limit":"30"` instead of `"head_limit":30` — and z.number()
 * rejects that with a type error. z.coerce.number() is the wrong fix: it
 * accepts values like "" or null by converting them via JS Number(), masking
 * bugs rather than surfacing them.
 *
 * Only strings that are valid decimal number literals (matching /^-?\d+(\.\d+)?$/)
 * are coerced. Anything else passes through and is rejected by the inner schema.
 *
 * z.preprocess emits {"type":"number"} to the API schema, so the model is
 * still told this is a number — the string tolerance is invisible client-side
 * coercion, not an advertised input shape.
 *
 * .optional()/.default() go INSIDE (on the inner schema), not chained after:
 * chaining them onto ZodPipe widens z.output<> to unknown in Zod v4.
 *
 *   semanticNumber()                              → number
 *   semanticNumber(z.number().optional())         → number | undefined
 *   semanticNumber(z.number().default(0))         → number
 */
// semanticNumber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function semanticNumber<T extends z.ZodType>(
  inner: T = z.number() as unknown as T,
) {
  // 返回 `z.preprocess((v: unknown) => {`，作为共享工具这次计算的结果。
  return z.preprocess((v: unknown) => {
    // 只有 `typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)` 满足时，共享工具才执行该分支。
    if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) {
      // n保存`Number`，供共享工具后续处理使用。
      const n = Number(v)
      // 满足 `Number.isFinite(n)` 时，共享工具执行该分支。
      if (Number.isFinite(n)) return n
    }
    // 返回 `v`，作为共享工具这次计算的结果。
    return v
  }, inner)
}
