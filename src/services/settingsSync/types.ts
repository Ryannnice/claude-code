/**
 * Settings Sync Types
 *
 * Zod schemas and types for the user settings sync API.
 * Based on the backend API contract from anthropic/anthropic#218817.
 */

// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'

/**
 * Content portion of user sync data - flat key-value storage.
 * Keys are opaque strings (typically file paths).
 * Values are UTF-8 string content (JSON, Markdown, etc).
 */
// UserSyncContentSchema保存`lazySchema`，供服务层 types后续处理使用。
export const UserSyncContentSchema = lazySchema(() =>
  z.object({
    entries: z.record(z.string(), z.string()),
  }),
)

/**
 * Full response from GET /api/claude_code/user_settings
 */
// UserSyncDataSchema保存`lazySchema`，供服务层 types后续处理使用。
export const UserSyncDataSchema = lazySchema(() =>
  z.object({
    userId: z.string(),
    version: z.number(),
    lastModified: z.string(), // ISO 8601 timestamp
    checksum: z.string(), // MD5 hash
    content: UserSyncContentSchema(),
  }),
)

// UserSyncData 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type UserSyncData = z.infer<ReturnType<typeof UserSyncDataSchema>>

/**
 * Result from fetching user settings
 */
// SettingsSyncFetchResult 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SettingsSyncFetchResult = {
  success: boolean
  data?: UserSyncData
  isEmpty?: boolean // true if 404 (no data exists)
  error?: string
  skipRetry?: boolean
}

/**
 * Result from uploading user settings
 */
// SettingsSyncUploadResult 固化服务层 types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SettingsSyncUploadResult = {
  success: boolean
  checksum?: string
  lastModified?: string
  error?: string
}

/**
 * Keys used for sync entries
 */
// SYNC_KEYS 集合 集中保存服务层 types要一起传递的字段。
export const SYNC_KEYS = {
  USER_SETTINGS: '~/.claude/settings.json',
  USER_MEMORY: '~/.claude/CLAUDE.md',
  // 这个回调绑定到 projectSettings: (projectId: string) =>，负责服务层 types在该局部场景下的响应。
  projectSettings: (projectId: string) =>
    `projects/${projectId}/.claude/settings.local.json`,
  // 这个回调绑定到 projectMemory: (projectId: string) => `projects/${projectId}/CLAUDE.local.md`,，负责服务层 types在该局部场景下的响应。
  projectMemory: (projectId: string) => `projects/${projectId}/CLAUDE.local.md`,
} as const
