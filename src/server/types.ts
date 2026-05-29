// 类型依赖 { ChildProcess } 来自 child_process，用于校准types的数据契约。
import type { ChildProcess } from 'child_process'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'

// connectResponseSchema 响应数据保存`lazySchema`，供types后续处理使用。
export const connectResponseSchema = lazySchema(() =>
  z.object({
    session_id: z.string(),
    ws_url: z.string(),
    work_dir: z.string().optional(),
  }),
)

// ServerConfig 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type ServerConfig = {
  port: number
  host: string
  authToken: string
  unix?: string
  /** Idle timeout for detached sessions (ms). 0 = never expire. */
  idleTimeoutMs?: number
  /** Maximum number of concurrent sessions. */
  maxSessions?: number
  /** Default workspace directory for sessions that don't specify cwd. */
  workspace?: string
}

// SessionState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionState =
  | 'starting'
  | 'running'
  | 'detached'
  | 'stopping'
  | 'stopped'

// SessionInfo 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionInfo = {
  id: string
  status: SessionState
  createdAt: number
  workDir: string
  process: ChildProcess | null
  sessionKey?: string
}

/**
 * Stable session key → session metadata. Persisted to ~/.claude/server-sessions.json
 * so sessions can be resumed across server restarts.
 */
// SessionIndexEntry 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionIndexEntry = {
  /** Server-assigned session ID (matches the subprocess's claude session). */
  sessionId: string
  /** The claude transcript session ID for --resume. Same as sessionId for direct sessions. */
  transcriptSessionId: string
  cwd: string
  permissionMode?: string
  createdAt: number
  lastActiveAt: number
}

// SessionIndex 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionIndex = Record<string, SessionIndexEntry>
