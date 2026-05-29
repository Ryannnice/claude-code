// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'

/**
 * Schema for the policy limits API response
 * Only blocked policies are included. If a policy key is absent, it's allowed.
 */
// PolicyLimitsResponseSchema 响应数据保存`lazySchema`，供服务层 types后续处理使用。
export const PolicyLimitsResponseSchema = lazySchema(() =>
  z.object({
    restrictions: z.record(z.string(), z.object({ allowed: z.boolean() })),
  }),
)

// PolicyLimitsResponse 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type PolicyLimitsResponse = z.infer<
  ReturnType<typeof PolicyLimitsResponseSchema>
>

/**
 * Result of fetching policy limits
 */
// PolicyLimitsFetchResult 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type PolicyLimitsFetchResult = {
  success: boolean
  restrictions?: PolicyLimitsResponse['restrictions'] | null // null means 304 Not Modified (cache is valid)
  etag?: string
  error?: string
  skipRetry?: boolean // If true, don't retry on failure (e.g., auth errors)
}
