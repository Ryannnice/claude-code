// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 类型依赖 { SettingsJson } 来自 ../../utils/settings/types.js，用于校准服务层 types的数据契约。
import type { SettingsJson } from '../../utils/settings/types.js'

/**
 * Schema for the remotely managed settings response.
 * Note: Uses permissive z.record() instead of SettingsSchema to avoid circular dependency.
 * Full validation is performed in index.ts after parsing using SettingsSchema.safeParse().
 */
// RemoteManagedSettingsResponseSchema 响应数据保存`lazySchema`，供服务层 types后续处理使用。
export const RemoteManagedSettingsResponseSchema = lazySchema(() =>
  z.object({
    uuid: z.string(), // Settings UUID
    checksum: z.string(),
    settings: z.record(z.string(), z.unknown()) as z.ZodType<SettingsJson>,
  }),
)

// RemoteManagedSettingsResponse 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteManagedSettingsResponse = z.infer<
  ReturnType<typeof RemoteManagedSettingsResponseSchema>
>

/**
 * Result of fetching remotely managed settings
 */
// RemoteManagedSettingsFetchResult 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteManagedSettingsFetchResult = {
  success: boolean
  settings?: SettingsJson | null // null means 304 Not Modified (cache is valid)
  checksum?: string
  error?: string
  skipRetry?: boolean // If true, don't retry on failure (e.g., auth errors)
}
