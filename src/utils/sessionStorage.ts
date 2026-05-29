// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 类型依赖 { Dirent } 来自 fs，用于校准共享工具的数据契约。
import type { Dirent } from 'fs'
// Sync fs primitives for readFileTailSync — separate from fs/promises
// imports above. Named (not wildcard) per CLAUDE.md style; no collisions
// with the async-suffixed names.
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { closeSync, fstatSync, openSync, readSync } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  appendFile as fsAppendFile,
  open as fsOpen,
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getPlanSlugCache,
  getPromptId,
  getSessionId,
  getSessionProjectDir,
  isSessionPersistenceDisabled,
  switchSession,
} from '../bootstrap/state.js'
// 引入 builtInCommandNames，将 ../commands.js 中已经封装好的能力接到本文件流程里。
import { builtInCommandNames } from '../commands.js'
// 引入 COMMAND_NAME_TAG、TICK_TAG，将 ../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMAND_NAME_TAG, TICK_TAG } from '../constants/xml.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 * as sessionIngress 服务层能力，把外部通信或共享状态交给 ../services/api/sessionIngress.js 处理。
import * as sessionIngress from '../services/api/sessionIngress.js'
// 接入 REPL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { REPL_TOOL_NAME } from '../tools/REPLTool/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AgentId,
  asAgentId,
  asSessionId,
  type SessionId,
} from '../types/ids.js'
// 类型依赖 { AttributionSnapshotMessage } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { AttributionSnapshotMessage } from '../types/logs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ContentReplacementEntry,
  type ContextCollapseCommitEntry,
  type ContextCollapseSnapshotEntry,
  type Entry,
  type FileHistorySnapshotMessage,
  type LogOption,
  type PersistedWorktreeSession,
  type SerializedMessage,
  sortLogs,
  type TranscriptMessage,
} from '../types/logs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  SystemCompactBoundaryMessage,
  SystemMessage,
  UserMessage,
} from '../types/message.js'
// 类型依赖 { QueueOperationMessage } 来自 ../types/messageQueueTypes.js，用于校准共享工具的数据契约。
import type { QueueOperationMessage } from '../types/messageQueueTypes.js'
// 引入 uniq，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { uniq } from './array.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 updateSessionName，将 ./concurrentSessions.js 中已经封装好的能力接到本文件流程里。
import { updateSessionName } from './concurrentSessions.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from './errors.js'
// 类型依赖 { FileHistorySnapshot } 来自 ./fileHistory.js，用于校准共享工具的数据契约。
import type { FileHistorySnapshot } from './fileHistory.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 getWorktreePaths，将 ./getWorktreePaths.js 中已经封装好的能力接到本文件流程里。
import { getWorktreePaths } from './getWorktreePaths.js'
// 引入 getBranch，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { getBranch } from './git.js'
// 引入 gracefulShutdownSync、isShuttingDown，将 ./gracefulShutdown.js 中已经封装好的能力接到本文件流程里。
import { gracefulShutdownSync, isShuttingDown } from './gracefulShutdown.js'
// 引入 parseJSONL，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { parseJSONL } from './json.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 extractTag、isCompactBoundaryMessage，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { extractTag, isCompactBoundaryMessage } from './messages.js'
// 引入 sanitizePath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { sanitizePath } from './path.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  extractJsonStringField,
  extractLastJsonStringField,
  LITE_READ_BUF_SIZE,
  readHeadAndTail,
  readTranscriptForLoad,
  SKIP_PRECOMPACT_THRESHOLD,
} from './sessionStoragePortable.js'
// 引入 getSettings_DEPRECATED，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from './settings/settings.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'
// 类型依赖 { ContentReplacementRecord } 来自 ./toolResultStorage.js，用于校准共享工具的数据契约。
import type { ContentReplacementRecord } from './toolResultStorage.js'
// 引入 validateUuid，将 ./uuid.js 中已经封装好的能力接到本文件流程里。
import { validateUuid } from './uuid.js'

// Cache MACRO.VERSION at module level to work around bun --define bug in async contexts
// See: https://github.com/oven-sh/bun/issues/26168
// VERSION标记共享工具 session Storage是否启用对应路径。
const VERSION = typeof MACRO !== 'undefined' ? MACRO.VERSION : 'unknown'

// Transcript 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Transcript = (
  | UserMessage
  | AssistantMessage
  | AttachmentMessage
  | SystemMessage
)[]

// Use getOriginalCwd() at each call site instead of capturing at module load
// time. getCwd() at import time may run before bootstrap resolves symlinks via
// realpathSync, causing a different sanitized project directory than what
// getOriginalCwd() returns after bootstrap. This split-brain made sessions
// saved under one path invisible when loaded via the other.

/**
 * Pre-compiled regex to skip non-meaningful messages when extracting first prompt.
 * Matches anything starting with a lowercase XML-like tag (IDE context, hook
 * output, task notifications, channel messages, etc.) or a synthetic interrupt
 * marker. Kept in sync with sessionStoragePortable.ts — generic pattern avoids
 * an ever-growing allowlist that falls behind as new notification types ship.
 */
// 50MB — prevents OOM in the tombstone slow path which reads + rewrites the
// entire session file. Session files can grow to multiple GB (inc-3930).
// MAX_TOMBSTONE_REWRITE_BYTES 集合保存`50 * 1024 * 1024`，供后续判断或组装使用。
const MAX_TOMBSTONE_REWRITE_BYTES = 50 * 1024 * 1024

// SKIP_FIRST_PROMPT_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SKIP_FIRST_PROMPT_PATTERN =
  /^(?:\s*<[a-z][\w-]*[\s>]|\[Request interrupted by user[^\]]*\])/

/**
 * Type guard to check if an entry is a transcript message.
 * Transcript messages include user, assistant, attachment, and system messages.
 * IMPORTANT: This is the single source of truth for what constitutes a transcript message.
 * loadTranscriptFile() uses this to determine which messages to load into the chain.
 *
 * Progress messages are NOT transcript messages. They are ephemeral UI state
 * and must not be persisted to the JSONL or participate in the parentUuid
 * chain. Including them caused chain forks that orphaned real conversation
 * messages on resume (see #14373, #23537).
 */
// isTranscriptMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTranscriptMessage(entry: Entry): entry is TranscriptMessage {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    entry.type === 'user' ||
    entry.type === 'assistant' ||
    entry.type === 'attachment' ||
    entry.type === 'system'
  )
}

/**
 * Entries that participate in the parentUuid chain. Used on the write path
 * (insertMessageChain, useLogMessages) to skip progress when assigning
 * parentUuid. Old transcripts with progress already in the chain are handled
 * by the progressBridge rewrite in loadTranscriptFile.
 */
// isChainParticipant 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isChainParticipant(m: Pick<Message, 'type'>): boolean {
  // 返回 `m.type !== 'progress'`，作为共享工具这次计算的结果。
  return m.type !== 'progress'
}

// LegacyProgressEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LegacyProgressEntry = {
  type: 'progress'
  uuid: UUID
  parentUuid: UUID | null
}

/**
 * Progress entries in transcripts written before PR #24099. They are not
 * in the Entry type union anymore but still exist on disk with uuid and
 * parentUuid fields. loadTranscriptFile bridges the chain across them.
 */
// isLegacyProgressEntry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLegacyProgressEntry(entry: unknown): entry is LegacyProgressEntry {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'type' in entry &&
    entry.type === 'progress' &&
    'uuid' in entry &&
    typeof entry.uuid === 'string'
  )
}

/**
 * High-frequency tool progress ticks (1/sec for Sleep, per-chunk for Bash).
 * These are UI-only: not sent to the API, not rendered after the tool
 * completes. Used by REPL.tsx to replace-in-place instead of appending, and
 * by loadTranscriptFile to skip legacy entries from old transcripts.
 */
// EPHEMERAL_PROGRESS_TYPES 集合保存`Set`，供共享工具后续处理使用。
const EPHEMERAL_PROGRESS_TYPES = new Set([
  'bash_progress',
  'powershell_progress',
  'mcp_progress',
  ...(feature('PROACTIVE') || feature('KAIROS')
    ? (['sleep_progress'] as const)
    : []),
])
// isEphemeralToolProgress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEphemeralToolProgress(dataType: unknown): boolean {
  // 返回 `typeof dataType === 'string' && EPHEMERAL_PROGRESS_TYPES.has(dataType)`，作为共享工具这次计算的结果。
  return typeof dataType === 'string' && EPHEMERAL_PROGRESS_TYPES.has(dataType)
}

// getProjectsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectsDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'projects')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'projects')
}

// getTranscriptPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTranscriptPath(): string {
  // projectDir读取`getSessionProjectDir`，供共享工具后续处理使用。
  const projectDir = getSessionProjectDir() ?? getProjectDir(getOriginalCwd())
  // 返回 `join(projectDir, `${getSessionId()}.jsonl`)`，作为共享工具这次计算的结果。
  return join(projectDir, `${getSessionId()}.jsonl`)
}

// getTranscriptPathForSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTranscriptPathForSession(sessionId: string): string {
  // When asking for the CURRENT session's transcript, honor sessionProjectDir
  // the same way getTranscriptPath() does. Without this, hooks get a
  // transcript_path computed from originalCwd while the actual file was
  // written to sessionProjectDir (set by switchActiveSession on resume/branch)
  // — different directories, so the hook sees MISSING (gh-30217). CC-34
  // made sessionId + sessionProjectDir atomic precisely to prevent this
  // kind of drift; this function just wasn't updated to read both.
  //
  // For OTHER session IDs we can only guess via originalCwd — we don't
  // track a sessionId→projectDir map. Callers wanting a specific other
  // session's path should pass fullPath explicitly (most save* functions
  // already accept this).
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 返回 `getTranscriptPath()`，作为共享工具这次计算的结果。
    return getTranscriptPath()
  }
  // projectDir读取`getProjectDir`，供共享工具后续处理使用。
  const projectDir = getProjectDir(getOriginalCwd())
  // 返回 `join(projectDir, `${sessionId}.jsonl`)`，作为共享工具这次计算的结果。
  return join(projectDir, `${sessionId}.jsonl`)
}

// 50 MB — session JSONL can grow to multiple GB (inc-3930). Callers that
// read the raw transcript must bail out above this threshold to avoid OOM.
// MAX_TRANSCRIPT_READ_BYTES 集合保存`50 * 1024 * 1024`，供共享工具 session Storage后续判断或输出使用。
export const MAX_TRANSCRIPT_READ_BYTES = 50 * 1024 * 1024

// In-memory map of agentId → subdirectory for grouping related subagent
// transcripts (e.g. workflow runs write to subagents/workflows/<runId>/).
// Populated before the agent runs; consulted by getAgentTranscriptPath.
// agentTranscriptSubdirs 集合构建`new Map<string, string>()`，供后续判断或组装使用。
const agentTranscriptSubdirs = new Map<string, string>()

// setAgentTranscriptSubdir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAgentTranscriptSubdir(
  agentId: string,
  subdir: string,
): void {
  // agentTranscriptSubdirs.set 写入新的状态值，使共享工具后续读取保持一致。
  agentTranscriptSubdirs.set(agentId, subdir)
}

// clearAgentTranscriptSubdir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAgentTranscriptSubdir(agentId: string): void {
  // 调用 agentTranscriptSubdirs.delete，触发共享工具此处需要的副作用。
  agentTranscriptSubdirs.delete(agentId)
}

// getAgentTranscriptPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentTranscriptPath(agentId: AgentId): string {
  // Same sessionProjectDir consistency as getTranscriptPathForSession —
  // subagent transcripts live under the session dir, so if the session
  // transcript is at sessionProjectDir, subagent transcripts are too.
  // projectDir读取`getSessionProjectDir`，供共享工具后续处理使用。
  const projectDir = getSessionProjectDir() ?? getProjectDir(getOriginalCwd())
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // subdir读取`agentTranscriptSubdirs.get`，供共享工具后续处理使用。
  const subdir = agentTranscriptSubdirs.get(agentId)
  // base保存`subdir`，供后续判断或组装使用。
  const base = subdir
    ? join(projectDir, sessionId, 'subagents', subdir)
    : join(projectDir, sessionId, 'subagents')
  // 返回 `join(base, `agent-${agentId}.jsonl`)`，作为共享工具这次计算的结果。
  return join(base, `agent-${agentId}.jsonl`)
}

// getAgentMetadataPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAgentMetadataPath(agentId: AgentId): string {
  // 返回 `getAgentTranscriptPath(agentId).replace(/\.jsonl$/, '.meta.json')`，作为共享工具这次计算的结果。
  return getAgentTranscriptPath(agentId).replace(/\.jsonl$/, '.meta.json')
}

// AgentMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentMetadata = {
  agentType: string
  /** Worktree path if the agent was spawned with isolation: "worktree" */
  worktreePath?: string
  /** Original task description from the AgentTool input. Persisted so a
   * resumed agent's notification can show the original description instead
   * of a placeholder. Optional — older metadata files lack this field. */
  description?: string
}

/**
 * Persist the agentType used to launch a subagent. Read by resume to
 * route correctly when subagent_type is omitted — without this, resuming
 * a fork silently degrades to general-purpose (4KB system prompt, no
 * inherited history). Sidecar file avoids JSONL schema changes.
 *
 * Also stores the worktreePath when the agent was spawned with worktree
 * isolation, enabling resume to restore the correct cwd.
 */
// writeAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeAgentMetadata(
  agentId: AgentId,
  metadata: AgentMetadata,
): Promise<void> {
  // 路径读取`getAgentMetadataPath`，供共享工具后续处理使用。
  const path = getAgentMetadataPath(agentId)
  // 等待 `mkdir(dirname(path), { recursive: true })` 完成，再继续共享工具 session Storage的异步流程。
  await mkdir(dirname(path), { recursive: true })
  // 等待 `writeFile(path, JSON.stringify(metadata))` 完成，再继续共享工具 session Storage的异步流程。
  await writeFile(path, JSON.stringify(metadata))
}

// readAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readAgentMetadata(
  agentId: AgentId,
): Promise<AgentMetadata | null> {
  // 路径读取`getAgentMetadataPath`，供共享工具后续处理使用。
  const path = getAgentMetadataPath(agentId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本读取`readFile`，供共享工具后续处理使用。
    const raw = await readFile(path, 'utf-8')
    // 返回 `JSON.parse(raw) as AgentMetadata`，作为共享工具这次计算的结果。
    return JSON.parse(raw) as AgentMetadata
  } catch (e) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return null
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

// RemoteAgentMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteAgentMetadata = {
  taskId: string
  remoteTaskType: string
  /** CCR session ID — used to fetch live status from the Sessions API on resume. */
  sessionId: string
  title: string
  command: string
  spawnedAt: number
  toolUseId?: string
  isLongRunning?: boolean
  isUltraplan?: boolean
  isRemoteReview?: boolean
  remoteTaskMetadata?: Record<string, unknown>
}

// getRemoteAgentsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRemoteAgentsDir(): string {
  // Same sessionProjectDir fallback as getAgentTranscriptPath — the project
  // dir (containing the .jsonl), not the session dir, so sessionId is joined.
  // projectDir读取`getSessionProjectDir`，供共享工具后续处理使用。
  const projectDir = getSessionProjectDir() ?? getProjectDir(getOriginalCwd())
  // 返回 `join(projectDir, getSessionId(), 'remote-agents')`，作为共享工具这次计算的结果。
  return join(projectDir, getSessionId(), 'remote-agents')
}

// getRemoteAgentMetadataPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRemoteAgentMetadataPath(taskId: string): string {
  // 返回 `join(getRemoteAgentsDir(), `remote-agent-${taskId}.meta.json`)`，作为共享工具这次计算的结果。
  return join(getRemoteAgentsDir(), `remote-agent-${taskId}.meta.json`)
}

/**
 * Persist metadata for a remote-agent task so it can be restored on session
 * resume. Per-task sidecar file (sibling dir to subagents/) survives
 * hydrateSessionFromRemote's .jsonl wipe; status is always fetched fresh
 * from CCR on restore — only identity is persisted locally.
 */
// writeRemoteAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeRemoteAgentMetadata(
  taskId: string,
  metadata: RemoteAgentMetadata,
): Promise<void> {
  // 路径读取`getRemoteAgentMetadataPath`，供共享工具后续处理使用。
  const path = getRemoteAgentMetadataPath(taskId)
  // 等待 `mkdir(dirname(path), { recursive: true })` 完成，再继续共享工具 session Storage的异步流程。
  await mkdir(dirname(path), { recursive: true })
  // 等待 `writeFile(path, JSON.stringify(metadata))` 完成，再继续共享工具 session Storage的异步流程。
  await writeFile(path, JSON.stringify(metadata))
}

// readRemoteAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readRemoteAgentMetadata(
  taskId: string,
): Promise<RemoteAgentMetadata | null> {
  // 路径读取`getRemoteAgentMetadataPath`，供共享工具后续处理使用。
  const path = getRemoteAgentMetadataPath(taskId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本读取`readFile`，供共享工具后续处理使用。
    const raw = await readFile(path, 'utf-8')
    // 返回 `JSON.parse(raw) as RemoteAgentMetadata`，作为共享工具这次计算的结果。
    return JSON.parse(raw) as RemoteAgentMetadata
  } catch (e) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return null
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

// deleteRemoteAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function deleteRemoteAgentMetadata(taskId: string): Promise<void> {
  // 路径读取`getRemoteAgentMetadataPath`，供共享工具后续处理使用。
  const path = getRemoteAgentMetadataPath(taskId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(path)` 完成，再继续共享工具 session Storage的异步流程。
    await unlink(path)
  } catch (e) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

/**
 * Scan the remote-agents/ directory for all persisted metadata files.
 * Used by restoreRemoteAgentTasks to reconnect to still-running CCR sessions.
 */
// listRemoteAgentMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listRemoteAgentMetadata(): Promise<
  RemoteAgentMetadata[]
> {
  // dir读取`getRemoteAgentsDir`，供共享工具后续处理使用。
  const dir = getRemoteAgentsDir()
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(dir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    entries = await readdir(dir, { withFileTypes: true })
  } catch (e) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return []
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
  // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const results: RemoteAgentMetadata[] = []
  // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
  for (const entry of entries) {
    // 只有 `!entry.isFile() || !entry.name.endsWith('.meta.json')` 满足时，共享工具才执行该分支。
    if (!entry.isFile() || !entry.name.endsWith('.meta.json')) continue
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 原始文本读取`readFile`，供共享工具后续处理使用。
      const raw = await readFile(join(dir, entry.name), 'utf-8')
      // 结果列表追加新条目，保持收集顺序与输入顺序一致。
      results.push(JSON.parse(raw) as RemoteAgentMetadata)
    } catch (e) {
      // Skip unreadable or corrupt files — a partial write from a crashed
      // fire-and-forget persist shouldn't take down the whole restore.
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `listRemoteAgentMetadata: skipping ${entry.name}: ${String(e)}`,
      )
    }
  }
  // 返回 `results`，作为共享工具这次计算的结果。
  return results
}

// sessionIdExists 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sessionIdExists(sessionId: string): boolean {
  // projectDir读取`getProjectDir`，供共享工具后续处理使用。
  const projectDir = getProjectDir(getOriginalCwd())
  // sessionFile 会话数据格式化`join`，供共享工具后续处理使用。
  const sessionFile = join(projectDir, `${sessionId}.jsonl`)
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.statSync，触发共享工具此处需要的副作用。
    fs.statSync(sessionFile)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// exported for testing
// getNodeEnv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNodeEnv(): string {
  // 返回 `process.env.NODE_ENV || 'development'`，作为共享工具这次计算的结果。
  return process.env.NODE_ENV || 'development'
}

// exported for testing
// getUserType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserType(): string {
  // 返回 `process.env.USER_TYPE || 'external'`，作为共享工具这次计算的结果。
  return process.env.USER_TYPE || 'external'
}

// getEntrypoint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEntrypoint(): string | undefined {
  // 返回 `process.env.CLAUDE_CODE_ENTRYPOINT`，作为共享工具这次计算的结果。
  return process.env.CLAUDE_CODE_ENTRYPOINT
}

// isCustomTitleEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCustomTitleEnabled(): boolean {
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// Memoized: called 12+ times per turn via hooks.ts createBaseHookInput
// (PostToolUse path, 5×/turn) + various save* functions. Input is a cwd
// string; homedir/env/regex are all session-invariant so the result is
// stable for a given input. Worktree switches just change the key — no
// cache clear needed.
// getProjectDir保存`memoize`，供共享工具后续处理使用。
export const getProjectDir = memoize((projectDir: string): string => {
  // 返回 `join(getProjectsDir(), sanitizePath(projectDir))`，作为共享工具这次计算的结果。
  return join(getProjectsDir(), sanitizePath(projectDir))
})

// project 命名 `null`，让后续代码直接表达这个值的用途。
let project: Project | null = null
// cleanupRegistered标记共享工具 session Storage是否启用对应路径。
let cleanupRegistered = false

// getProject 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getProject(): Project {
  // project缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!project) {
    // project更新为 `new Project()`，确保共享工具后续读取最新状态。
    project = new Project()

    // Register flush as a cleanup handler (only once)
    // cleanupRegistered缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cleanupRegistered) {
      // 调用 registerCleanup，触发共享工具此处需要的副作用。
      registerCleanup(async () => {
        // Flush queued writes first, then re-append session metadata
        // (customTitle, tag) so they always appear in the last 64KB tail
        // window. readLiteMetadata only reads the tail to extract these
        // fields — if enough messages are appended after a /rename, the
        // custom-title entry gets pushed outside the window and --resume
        // shows the auto-generated firstPrompt instead.
        // 等待 `project?.flush()` 完成，再继续共享工具 session Storage的异步流程。
        await project?.flush()
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 调用 project?.reAppendSessionMetadata()，完成这一处局部操作。
          project?.reAppendSessionMetadata()
        } catch {
          // Best-effort — don't let metadata re-append crash the cleanup
        }
      })
      // cleanupRegistered更新为 `true`，确保共享工具后续读取最新状态。
      cleanupRegistered = true
    }
  }
  // 返回 `project`，作为共享工具这次计算的结果。
  return project
}

/**
 * Reset the Project singleton's flush state for testing.
 * This ensures tests don't interfere with each other via shared counter state.
 */
// resetProjectFlushStateForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetProjectFlushStateForTesting(): void {
  // 调用 project?._resetFlushState()，完成这一处局部操作。
  project?._resetFlushState()
}

/**
 * Reset the entire Project singleton for testing.
 * This ensures tests with different CLAUDE_CONFIG_DIR values
 * don't share stale sessionFile paths.
 */
// resetProjectForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetProjectForTesting(): void {
  // project更新为 `null`，确保共享工具后续读取最新状态。
  project = null
}

// setSessionFileForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionFileForTesting(path: string): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().sessionFile = path
}

// InternalEventWriter 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InternalEventWriter = (
  eventType: string,
  payload: Record<string, unknown>,
  options?: { isCompaction?: boolean; agentId?: string },
) => Promise<void>

/**
 * Register a CCR v2 internal event writer for transcript persistence.
 * When set, transcript messages are written as internal worker events
 * instead of going through v1 Session Ingress.
 */
// setInternalEventWriter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setInternalEventWriter(writer: InternalEventWriter): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().setInternalEventWriter(writer)
}

// InternalEventReader 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InternalEventReader = () => Promise<
  { payload: Record<string, unknown>; agent_id?: string }[] | null
>

/**
 * Register a CCR v2 internal event reader for session resume.
 * When set, hydrateFromCCRv2InternalEvents() can fetch foreground and
 * subagent internal events to reconstruct conversation state on reconnection.
 */
// setInternalEventReader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setInternalEventReader(
  reader: InternalEventReader,
  subagentReader: InternalEventReader,
): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().setInternalEventReader(reader)
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().setInternalSubagentEventReader(subagentReader)
}

/**
 * Set the remote ingress URL on the current Project for testing.
 * This simulates what hydrateRemoteSession does in production.
 */
// setRemoteIngressUrlForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setRemoteIngressUrlForTesting(url: string): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().setRemoteIngressUrl(url)
}

// REMOTE_FLUSH_INTERVAL_MS 集合 命名 `10`，让后续代码直接表达这个值的用途。
const REMOTE_FLUSH_INTERVAL_MS = 10

// Project 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class Project {
  // Minimal cache for current session only (not all sessions)
  currentSessionTag: string | undefined
  currentSessionTitle: string | undefined
  currentSessionAgentName: string | undefined
  currentSessionAgentColor: string | undefined
  currentSessionLastPrompt: string | undefined
  currentSessionAgentSetting: string | undefined
  currentSessionMode: 'coordinator' | 'normal' | undefined
  // Tri-state: undefined = never touched (don't write), null = exited worktree,
  // object = currently in worktree. reAppendSessionMetadata writes null so
  // --resume knows the session exited (vs. crashed while inside).
  currentSessionWorktree: PersistedWorktreeSession | null | undefined
  currentSessionPrNumber: number | undefined
  currentSessionPrUrl: string | undefined
  currentSessionPrRepository: string | undefined

  sessionFile: string | null = null
  // Entries buffered while sessionFile is null. Flushed by materializeSessionFile
  // on the first user/assistant message — prevents metadata-only session files.
  private pendingEntries: Entry[] = []
  private remoteIngressUrl: string | null = null
  private internalEventWriter: InternalEventWriter | null = null
  private internalEventReader: InternalEventReader | null = null
  private internalSubagentEventReader: InternalEventReader | null = null
  private pendingWriteCount: number = 0
  // 这个回调绑定到 private flushResolvers: Array<() => void> = []，负责共享工具在该局部场景下的响应。
  private flushResolvers: Array<() => void> = []
  // Per-file write queues. Each entry carries a resolve callback so
  // callers of enqueueWrite can optionally await their specific write.
  private writeQueues = new Map<
    string,
    // 这个回调绑定到 Array<{ entry: Entry; resolve: () => void }>，负责共享工具在该局部场景下的响应。
    Array<{ entry: Entry; resolve: () => void }>
  >()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private activeDrain: Promise<void> | null = null
  private FLUSH_INTERVAL_MS = 100
  private readonly MAX_CHUNK_BYTES = 100 * 1024 * 1024

  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {}

  /** @internal Reset flush/queue state for testing. */
  // _resetFlushState 使用 无 完成共享工具里的对应操作。
  _resetFlushState(): void {
    // 更新实例字段 pendingWriteCount 为 0，同步共享工具的内部状态。
    this.pendingWriteCount = 0
    // 更新实例字段 flushResolvers 为 []，同步共享工具的内部状态。
    this.flushResolvers = []
    // 满足 `this.flushTimer) clearTimeout(this.flushTimer` 时，共享工具执行该分支。
    if (this.flushTimer) clearTimeout(this.flushTimer)
    // 更新实例字段 flushTimer 为 null，同步共享工具的内部状态。
    this.flushTimer = null
    // 更新实例字段 activeDrain 为 null，同步共享工具的内部状态。
    this.activeDrain = null
    // 更新实例字段 writeQueues 为 new Map()，同步共享工具的内部状态。
    this.writeQueues = new Map()
  }

  // 共享工具 session Storage在这里处理 `private incrementPendingWrites(): void {`，完成这一小步状态转换。
  private incrementPendingWrites(): void {
    // 共享工具 session Storage在这里处理 `this.pendingWriteCount++`，完成这一小步状态转换。
    this.pendingWriteCount++
  }

  // 共享工具 session Storage在这里处理 `private decrementPendingWrites(): void {`，完成这一小步状态转换。
  private decrementPendingWrites(): void {
    // 共享工具 session Storage在这里处理 `this.pendingWriteCount--`，完成这一小步状态转换。
    this.pendingWriteCount--
    // 满足 `this.pendingWriteCount === 0` 时，共享工具执行该分支。
    if (this.pendingWriteCount === 0) {
      // Resolve all waiting flush promises
      // 按顺序遍历 `this.flushResolvers` 中的resolve，逐个交给共享工具处理。
      for (const resolve of this.flushResolvers) {
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve()
      }
      // 更新实例字段 flushResolvers 为 []，同步共享工具的内部状态。
      this.flushResolvers = []
    }
  }

  // 这个回调绑定到 private async trackWrite<T>(fn: () => Promise<T>): Promise<T> {，负责共享工具在该局部场景下的响应。
  private async trackWrite<T>(fn: () => Promise<T>): Promise<T> {
    // 调用 this.incrementPendingWrites，触发共享工具此处需要的副作用。
    this.incrementPendingWrites()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `fn()`，调用方直接接收异步结果。
      return await fn()
    } finally {
      // 调用 this.decrementPendingWrites，触发共享工具此处需要的副作用。
      this.decrementPendingWrites()
    }
  }

  // 共享工具 session Storage在这里处理 `private enqueueWrite(filePath: string, entry: Entry): Promise<void> {`，完成这一小步状态转换。
  private enqueueWrite(filePath: string, entry: Entry): Promise<void> {
    // 返回 `new Promise<void>(resolve => {`，作为共享工具这次计算的结果。
    return new Promise<void>(resolve => {
      // queue读取`writeQueues.get`，供共享工具后续处理使用。
      let queue = this.writeQueues.get(filePath)
      // queue缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!queue) {
        // queue更新为 `[]`，确保共享工具后续读取最新状态。
        queue = []
        // this.writeQueues.set 写入新的状态值，使共享工具后续读取保持一致。
        this.writeQueues.set(filePath, queue)
      }
      // queue追加新条目，保持收集顺序与输入顺序一致。
      queue.push({ entry, resolve })
      // 调用 this.scheduleDrain，触发共享工具此处需要的副作用。
      this.scheduleDrain()
    })
  }

  // 共享工具 session Storage在这里处理 `private scheduleDrain(): void {`，完成这一小步状态转换。
  private scheduleDrain(): void {
    // 满足 `this.flushTimer` 时，共享工具执行该分支。
    if (this.flushTimer) {
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 更新实例字段 flushTimer 为 setTimeout(async () => {，同步共享工具的内部状态。
    this.flushTimer = setTimeout(async () => {
      // 更新实例字段 flushTimer 为 null，同步共享工具的内部状态。
      this.flushTimer = null
      // 更新实例字段 activeDrain 为 this.drainWriteQueue()，同步共享工具的内部状态。
      this.activeDrain = this.drainWriteQueue()
      // 等待 `this.activeDrain` 完成，再继续共享工具 session Storage的异步流程。
      await this.activeDrain
      // 更新实例字段 activeDrain 为 null，同步共享工具的内部状态。
      this.activeDrain = null
      // If more items arrived during drain, schedule again
      // 满足 `this.writeQueues.size > 0` 时，共享工具执行该分支。
      if (this.writeQueues.size > 0) {
        // 调用 this.scheduleDrain，触发共享工具此处需要的副作用。
        this.scheduleDrain()
      }
    }, this.FLUSH_INTERVAL_MS)
  }

  // 共享工具 session Storage在这里处理 `private async appendToFile(filePath: string, data: string): Promise<voi...`，完成这一小步状态转换。
  private async appendToFile(filePath: string, data: string): Promise<void> {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fsAppendFile(filePath, data, { mode: 0o600 })` 完成，再继续共享工具 session Storage的异步流程。
      await fsAppendFile(filePath, data, { mode: 0o600 })
    } catch {
      // Directory may not exist — some NFS-like filesystems return
      // unexpected error codes, so don't discriminate on code.
      // 等待 `mkdir(dirname(filePath), { recursive: true, mode: 0o700 })` 完成，再继续共享工具 session Storage的异步流程。
      await mkdir(dirname(filePath), { recursive: true, mode: 0o700 })
      // 等待 `fsAppendFile(filePath, data, { mode: 0o600 })` 完成，再继续共享工具 session Storage的异步流程。
      await fsAppendFile(filePath, data, { mode: 0o600 })
    }
  }

  // 共享工具 session Storage在这里处理 `private async drainWriteQueue(): Promise<void> {`，完成这一小步状态转换。
  private async drainWriteQueue(): Promise<void> {
    // 循环处理 `const [filePath, queue] of this.writeQueues`，让共享工具逐项把同类条目按顺序走完。
    for (const [filePath, queue] of this.writeQueues) {
      // queue为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (queue.length === 0) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // batch保存`queue.splice`，供共享工具后续处理使用。
      const batch = queue.splice(0)

      // 文本内容固定为 `''`，作为共享工具 session Storage后续展示或比较的基准。
      let content = ''
      // 这个回调绑定到 const resolvers: Array<() => void> = []，负责共享工具在该局部场景下的响应。
      const resolvers: Array<() => void> = []

      // 循环处理 `const { entry, resolve } of batch`，让共享工具逐项把同类条目按顺序走完。
      for (const { entry, resolve } of batch) {
        // line保存`jsonStringify`，供共享工具后续处理使用。
        const line = jsonStringify(entry) + '\n'

        // 满足 `content.length + line.length >= this.MAX_CHUNK_BY` 时，共享工具执行该分支。
        if (content.length + line.length >= this.MAX_CHUNK_BYTES) {
          // Flush chunk and resolve its entries before starting a new one
          // 等待 `this.appendToFile(filePath, content)` 完成，再继续共享工具 session Storage的异步流程。
          await this.appendToFile(filePath, content)
          // 按顺序遍历 `resolvers` 中的r，逐个交给共享工具处理。
          for (const r of resolvers) {
            // 调用 r，触发共享工具此处需要的副作用。
            r()
          }
          // resolvers 集合被清空，共享工具从干净状态继续。
          resolvers.length = 0
          // 文本内容更新为 `''`，确保共享工具后续读取最新状态。
          content = ''
        }

        // 共享工具 session Storage在这里处理 `content += line`，完成这一小步状态转换。
        content += line
        // resolvers 集合追加新条目，保持收集顺序与输入顺序一致。
        resolvers.push(resolve)
      }

      // 满足 `content.length > 0` 时，共享工具执行该分支。
      if (content.length > 0) {
        // 等待 `this.appendToFile(filePath, content)` 完成，再继续共享工具 session Storage的异步流程。
        await this.appendToFile(filePath, content)
        // 按顺序遍历 `resolvers` 中的r，逐个交给共享工具处理。
        for (const r of resolvers) {
          // 调用 r，触发共享工具此处需要的副作用。
          r()
        }
      }
    }

    // Clean up empty queues
    // 循环处理 `const [filePath, queue] of this.writeQueues`，让共享工具逐项把同类条目按顺序走完。
    for (const [filePath, queue] of this.writeQueues) {
      // queue为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (queue.length === 0) {
        // 调用 this.writeQueues.delete，触发共享工具此处需要的副作用。
        this.writeQueues.delete(filePath)
      }
    }
  }

  // resetSessionFile 使用 无 完成共享工具里的对应操作。
  resetSessionFile(): void {
    // 更新实例字段 sessionFile 为 null，同步共享工具的内部状态。
    this.sessionFile = null
    // 更新实例字段 pendingEntries 为 []，同步共享工具的内部状态。
    this.pendingEntries = []
  }

  /**
   * Re-append cached session metadata to the end of the transcript file.
   * This ensures metadata stays within the tail window that readLiteMetadata
   * reads during progressive loading.
   *
   * Called from two contexts with different file-ordering implications:
   * - During compaction (compact.ts, reactiveCompact.ts): writes metadata
   *   just before the boundary marker is emitted - these entries end up
   *   before the boundary and are recovered by scanPreBoundaryMetadata.
   * - On session exit (cleanup handler): writes metadata at EOF after all
   *   boundaries - this is what enables loadTranscriptFile's pre-compact
   *   skip to find metadata without a forward scan.
   *
   * External-writer safety for SDK-mutable fields (custom-title, tag):
   * before re-appending, refresh the cache from the tail scan window. If an
   * external process (SDK renameSession/tagSession) wrote a fresher value,
   * our stale cache absorbs it and the re-append below persists it — not
   * the stale CLI value. If no entry is in the tail (evicted, or never
   * written by the SDK), the cache is the only source of truth and is
   * re-appended as-is.
   *
   * Re-append is unconditional (even when the value is already in the
   * tail): during compaction, a title 40KB from EOF is inside the current
   * tail window but will fall out once the post-compaction session grows.
   * Skipping the re-append would defeat the purpose of this call. Fields
   * the SDK cannot touch (last-prompt, agent-*, mode, pr-link) have no
   * external-writer concern — their caches are authoritative.
   */
  // reAppendSessionMetadata 使用 skipTitleRefresh = false 完成共享工具里的对应操作。
  reAppendSessionMetadata(skipTitleRefresh = false): void {
    // this.sessionFile 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.sessionFile) return
    // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
    const sessionId = getSessionId() as UUID
    // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!sessionId) return

    // One sync tail read to refresh SDK-mutable fields. Same
    // LITE_READ_BUF_SIZE window readLiteMetadata uses. Empty string on
    // failure → extract returns null → cache is the only source of truth.
    // tail读取`readFileTailSync`，供共享工具后续处理使用。
    const tail = readFileTailSync(this.sessionFile)

    // Absorb any fresher SDK-written title/tag into our cache. If the SDK
    // wrote while we had the session open, our cache is stale — the tail
    // value is authoritative. If the tail has nothing (evicted or never
    // written externally), the cache stands.
    //
    // Filter with startsWith to match only top-level JSONL entries (col 0)
    // and not "type":"tag" appearing inside a nested tool_use input that
    // happens to be JSON-serialized into a message.
    // tailLines 集合格式化`tail.split`，供共享工具后续处理使用。
    const tailLines = tail.split('\n')
    // skipTitleRefresh 标题缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!skipTitleRefresh) {
      // titleLine 标题筛选`tailLines.findLast`，供共享工具后续处理使用。
      const titleLine = tailLines.findLast(l =>
        l.startsWith('{"type":"custom-title"'),
      )
      // 满足 `titleLine` 时，共享工具执行该分支。
      if (titleLine) {
        // tailTitle 标题保存`extractLastJsonStringField`，供共享工具后续处理使用。
        const tailTitle = extractLastJsonStringField(titleLine, 'customTitle')
        // `!== undefined` distinguishes no-match from empty-string match.
        // renameSession rejects empty titles, but the CLI is defensive: an
        // external writer with customTitle:"" should clear the cache so the
        // re-append below skips it (instead of resurrecting a stale title).
        // `tailTitle` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (tailTitle !== undefined) {
          // 更新实例字段 currentSessionTitle 为 tailTitle || undefined，同步共享工具的内部状态。
          this.currentSessionTitle = tailTitle || undefined
        }
      }
    }
    // tagLine筛选`tailLines.findLast`，供共享工具后续处理使用。
    const tagLine = tailLines.findLast(l => l.startsWith('{"type":"tag"'))
    // 满足 `tagLine` 时，共享工具执行该分支。
    if (tagLine) {
      // tailTag保存`extractLastJsonStringField`，供共享工具后续处理使用。
      const tailTag = extractLastJsonStringField(tagLine, 'tag')
      // Same: tagSession(id, null) writes `tag:""` to clear.
      // `tailTag` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (tailTag !== undefined) {
        // 更新实例字段 currentSessionTag 为 tailTag || undefined，同步共享工具的内部状态。
        this.currentSessionTag = tailTag || undefined
      }
    }

    // lastPrompt is re-appended so readLiteMetadata can show what the
    // user was most recently doing. Written first so customTitle/tag/etc
    // land closer to EOF (they're the more critical fields for tail reads).
    // 满足 `this.currentSessionLastPrompt` 时，共享工具执行该分支。
    if (this.currentSessionLastPrompt) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'last-prompt',
        lastPrompt: this.currentSessionLastPrompt,
        sessionId,
      })
    }
    // Unconditional: cache was refreshed from tail above; re-append keeps
    // the entry at EOF so compaction-pushed content doesn't evict it.
    // 满足 `this.currentSessionTitle` 时，共享工具执行该分支。
    if (this.currentSessionTitle) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'custom-title',
        customTitle: this.currentSessionTitle,
        sessionId,
      })
    }
    // 满足 `this.currentSessionTag` 时，共享工具执行该分支。
    if (this.currentSessionTag) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'tag',
        tag: this.currentSessionTag,
        sessionId,
      })
    }
    // 满足 `this.currentSessionAgentName` 时，共享工具执行该分支。
    if (this.currentSessionAgentName) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'agent-name',
        agentName: this.currentSessionAgentName,
        sessionId,
      })
    }
    // 满足 `this.currentSessionAgentColor` 时，共享工具执行该分支。
    if (this.currentSessionAgentColor) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'agent-color',
        agentColor: this.currentSessionAgentColor,
        sessionId,
      })
    }
    // 满足 `this.currentSessionAgentSetting` 时，共享工具执行该分支。
    if (this.currentSessionAgentSetting) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'agent-setting',
        agentSetting: this.currentSessionAgentSetting,
        sessionId,
      })
    }
    // 满足 `this.currentSessionMode` 时，共享工具执行该分支。
    if (this.currentSessionMode) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'mode',
        mode: this.currentSessionMode,
        sessionId,
      })
    }
    // `this.currentSessionWorktree` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (this.currentSessionWorktree !== undefined) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'worktree-state',
        worktreeSession: this.currentSessionWorktree,
        sessionId,
      })
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.currentSessionPrNumber !== undefined &&
      this.currentSessionPrUrl &&
      this.currentSessionPrRepository
    ) {
      // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
      appendEntryToFile(this.sessionFile, {
        type: 'pr-link',
        sessionId,
        prNumber: this.currentSessionPrNumber,
        prUrl: this.currentSessionPrUrl,
        prRepository: this.currentSessionPrRepository,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // flush 使用 无 完成共享工具里的对应操作。
  async flush(): Promise<void> {
    // Cancel pending timer
    // 满足 `this.flushTimer` 时，共享工具执行该分支。
    if (this.flushTimer) {
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(this.flushTimer)
      // 更新实例字段 flushTimer 为 null，同步共享工具的内部状态。
      this.flushTimer = null
    }
    // Wait for any in-flight drain to finish
    // 满足 `this.activeDrain` 时，共享工具执行该分支。
    if (this.activeDrain) {
      // 等待 `this.activeDrain` 完成，再继续共享工具 session Storage的异步流程。
      await this.activeDrain
    }
    // Drain anything remaining in the queues
    // 等待 `this.drainWriteQueue()` 完成，再继续共享工具 session Storage的异步流程。
    await this.drainWriteQueue()

    // Wait for non-queue tracked operations (e.g. removeMessageByUuid)
    // 满足 `this.pendingWriteCount === 0` 时，共享工具执行该分支。
    if (this.pendingWriteCount === 0) {
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 返回 `new Promise<void>(resolve => {`，作为共享工具这次计算的结果。
    return new Promise<void>(resolve => {
      // flushResolvers 集合追加新条目，保持收集顺序与输入顺序一致。
      this.flushResolvers.push(resolve)
    })
  }

  /**
   * Remove a message from the transcript by UUID.
   * Used for tombstoning orphaned messages from failed streaming attempts.
   *
   * The target is almost always the most recently appended entry, so we
   * read only the tail, locate the line, and splice it out with a
   * positional write + truncate instead of rewriting the whole file.
   */
  // removeMessageByUuid 使用 targetUuid: UUID 完成共享工具里的对应操作。
  async removeMessageByUuid(targetUuid: UUID): Promise<void> {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // 满足 `this.sessionFile === null` 时，共享工具执行该分支。
      if (this.sessionFile === null) return
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // fileSize 文件数据保存`0`，供共享工具 session Storage后续判断或输出使用。
        let fileSize = 0
        // fh保存`fsOpen`，供共享工具后续处理使用。
        const fh = await fsOpen(this.sessionFile, 'r+')
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 从 `await fh.stat()` 解构 size，减少共享工具 session Storage对同一对象的重复访问。
          const { size } = await fh.stat()
          // fileSize 文件数据更新为 `size`，确保共享工具后续读取最新状态。
          fileSize = size
          // 满足 `size === 0` 时，共享工具执行该分支。
          if (size === 0) return

          // chunkLen保存`Math.min`，供共享工具后续处理使用。
          const chunkLen = Math.min(size, LITE_READ_BUF_SIZE)
          // tailStart 命名 `size - chunkLen`，让后续代码直接表达这个值的用途。
          const tailStart = size - chunkLen
          // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
          const buf = Buffer.allocUnsafe(chunkLen)
          // 从 `await fh.read(buf, 0, chunkLen, tailStart)` 解构 bytesRead，减少共享工具 session Storage对同一对象的重复访问。
          const { bytesRead } = await fh.read(buf, 0, chunkLen, tailStart)
          // tail保存`buf.subarray`，供共享工具后续处理使用。
          const tail = buf.subarray(0, bytesRead)

          // Entries are serialized via JSON.stringify (no key-value
          // whitespace). Search for the full `"uuid":"..."` pattern, not
          // just the bare UUID, so we do not match the same value sitting
          // in `parentUuid` of a child entry. UUIDs are pure ASCII so a
          // byte-level search is correct.
          // needle读取``"uuid":"${targetUuid}"``，作为后续固定文本处理的输入。
          const needle = `"uuid":"${targetUuid}"`
          // matchIdx保存`tail.lastIndexOf`，供共享工具后续处理使用。
          const matchIdx = tail.lastIndexOf(needle)

          // 满足 `matchIdx >= 0` 时，共享工具执行该分支。
          if (matchIdx >= 0) {
            // 0x0a never appears inside a UTF-8 multi-byte sequence, so
            // byte-scanning for line boundaries is safe even if the chunk
            // starts mid-character.
            // prevNl保存`tail.lastIndexOf`，供共享工具后续处理使用。
            const prevNl = tail.lastIndexOf(0x0a, matchIdx)
            // If the preceding newline is outside our chunk and we did not
            // read from the start of the file, the line is longer than the
            // window - fall through to the slow path.
            // 只有 `prevNl >= 0 || tailStart === 0` 满足时，共享工具才执行该分支。
            if (prevNl >= 0 || tailStart === 0) {
              // lineStart标记共享工具 session Storage是否启用对应路径。
              const lineStart = prevNl + 1 // 0 when prevNl === -1
              // nextNl保存`tail.indexOf`，供共享工具后续处理使用。
              const nextNl = tail.indexOf(0x0a, matchIdx + needle.length)
              // lineEnd 命名 `nextNl >= 0 ? nextNl + 1 : bytesRead`，让后续代码直接表达这个值的用途。
              const lineEnd = nextNl >= 0 ? nextNl + 1 : bytesRead

              // absLineStart保存`tailStart + lineStart`，供共享工具 session Storage后续判断或输出使用。
              const absLineStart = tailStart + lineStart
              // afterLen保存`bytesRead - lineEnd`，供共享工具 session Storage后续判断或输出使用。
              const afterLen = bytesRead - lineEnd
              // Truncate first, then re-append the trailing lines. In the
              // common case (target is the last entry) afterLen is 0 and
              // this is a single ftruncate.
              // 等待 `fh.truncate(absLineStart)` 完成，再继续共享工具 session Storage的异步流程。
              await fh.truncate(absLineStart)
              // 满足 `afterLen > 0` 时，共享工具执行该分支。
              if (afterLen > 0) {
                // 等待 `fh.write(tail, lineEnd, afterLen, absLineStart)` 完成，再继续共享工具 session Storage的异步流程。
                await fh.write(tail, lineEnd, afterLen, absLineStart)
              }
              // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
          }
        } finally {
          // 等待 `fh.close()` 完成，再继续共享工具 session Storage的异步流程。
          await fh.close()
        }

        // Slow path: target was not in the last 64KB. Rare - requires many
        // large entries to have landed between the write and the tombstone.
        // 满足 `fileSize > MAX_TOMBSTONE_REWRITE_BYTES` 时，共享工具执行该分支。
        if (fileSize > MAX_TOMBSTONE_REWRITE_BYTES) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Skipping tombstone removal: session file too large (${formatFileSize(fileSize)})`,
            { level: 'warn' },
          )
          // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 文本内容读取`readFile`，供共享工具后续处理使用。
        const content = await readFile(this.sessionFile, { encoding: 'utf-8' })
        // 文本行格式化`content.split`，供共享工具后续处理使用。
        const lines = content.split('\n').filter((line: string) => {
          // 满足 `!line.trim()` 时，共享工具执行该分支。
          if (!line.trim()) return true
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // entry解析`jsonParse`，供共享工具后续处理使用。
            const entry = jsonParse(line)
            // 返回 `entry.uuid !== targetUuid`，作为共享工具这次计算的结果。
            return entry.uuid !== targetUuid
          } catch {
            // 返回 `true // Keep malformed lines`，作为共享工具这次计算的结果。
            return true // Keep malformed lines
          }
        })
        // 等待 `writeFile(this.sessionFile, lines.join('\n'), {` 完成，再继续共享工具 session Storage的异步流程。
        await writeFile(this.sessionFile, lines.join('\n'), {
          encoding: 'utf8',
        })
      } catch {
        // Silently ignore errors - the file might not exist yet
      }
    })
  }

  /**
   * True when test env / cleanupPeriodDays=0 / --no-session-persistence /
   * CLAUDE_CODE_SKIP_PROMPT_HISTORY should suppress all transcript writes.
   * Shared guard for appendEntry and materializeSessionFile so both skip
   * consistently. The env var is set by tmuxSocket.ts so Tungsten-spawned
   * test sessions don't pollute the user's --resume list.
   */
  // 共享工具 session Storage在这里处理 `private shouldSkipPersistence(): boolean {`，完成这一小步状态转换。
  private shouldSkipPersistence(): boolean {
    // allowTestPersistence保存`isEnvTruthy`，供共享工具后续处理使用。
    const allowTestPersistence = isEnvTruthy(
      process.env.TEST_ENABLE_SESSION_PERSISTENCE,
    )
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      (getNodeEnv() === 'test' && !allowTestPersistence) ||
      getSettings_DEPRECATED()?.cleanupPeriodDays === 0 ||
      isSessionPersistenceDisabled() ||
      isEnvTruthy(process.env.CLAUDE_CODE_SKIP_PROMPT_HISTORY)
    )
  }

  /**
   * Create the session file, write cached startup metadata, and flush
   * buffered entries. Called on the first user/assistant message.
   */
  // 共享工具 session Storage在这里处理 `private async materializeSessionFile(): Promise<void> {`，完成这一小步状态转换。
  private async materializeSessionFile(): Promise<void> {
    // Guard here too — reAppendSessionMetadata writes via appendEntryToFile
    // (not appendEntry) so it would bypass the per-entry persistence check
    // and create a metadata-only file despite --no-session-persistence.
    // 满足 `this.shouldSkipPersistence()` 时，共享工具执行该分支。
    if (this.shouldSkipPersistence()) return
    // 调用 this.ensureCurrentSessionFile，触发共享工具此处需要的副作用。
    this.ensureCurrentSessionFile()
    // mode/agentSetting are cache-only pre-materialization; write them now.
    // 调用 this.reAppendSessionMetadata，触发共享工具此处需要的副作用。
    this.reAppendSessionMetadata()
    // 满足 `this.pendingEntries.length > 0` 时，共享工具执行该分支。
    if (this.pendingEntries.length > 0) {
      // buffered 命名 `this.pendingEntries`，让后续代码直接表达这个值的用途。
      const buffered = this.pendingEntries
      // 更新实例字段 pendingEntries 为 []，同步共享工具的内部状态。
      this.pendingEntries = []
      // 按顺序遍历 `buffered` 中的entry，逐个交给共享工具处理。
      for (const entry of buffered) {
        // 等待 `this.appendEntry(entry)` 完成，再继续共享工具 session Storage的异步流程。
        await this.appendEntry(entry)
      }
    }
  }

  // 共享工具 session Storage在这里处理 `async insertMessageChain(`，完成这一小步状态转换。
  async insertMessageChain(
    messages: Transcript,
    isSidechain: boolean = false,
    agentId?: string,
    startingParentUuid?: UUID | null,
    teamInfo?: { teamName?: string; agentName?: string },
  ) {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // parentUuid 命名 `startingParentUuid ?? null`，让后续代码直接表达这个值的用途。
      let parentUuid: UUID | null = startingParentUuid ?? null

      // First user/assistant message materializes the session file.
      // Hook progress/attachment messages alone stay buffered.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        this.sessionFile === null &&
        // 调用 messages.some，触发共享工具此处需要的副作用。
        messages.some(m => m.type === 'user' || m.type === 'assistant')
      ) {
        // 等待 `this.materializeSessionFile()` 完成，再继续共享工具 session Storage的异步流程。
        await this.materializeSessionFile()
      }

      // Get current git branch once for this message chain
      // gitBranch 先占位，稍后的条件分支会根据实际输入补齐它。
      let gitBranch: string | undefined
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // gitBranch更新为 `await getBranch()`，确保共享工具后续读取最新状态。
        gitBranch = await getBranch()
      } catch {
        // Not in a git repo or git command failed
        // gitBranch更新为 `undefined`，确保共享工具后续读取最新状态。
        gitBranch = undefined
      }

      // Get slug if one exists for this session (used for plan files, etc.)
      // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
      const sessionId = getSessionId()
      // slug读取`getPlanSlugCache`，供共享工具后续处理使用。
      const slug = getPlanSlugCache().get(sessionId)

      // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
      for (const message of messages) {
        // isCompactBoundary记录 `isCompactBoundaryMessage` 是否成立，共享工具随后按该结果分支。
        const isCompactBoundary = isCompactBoundaryMessage(message)

        // For tool_result messages, use the assistant message UUID from the message
        // if available (set at creation time), otherwise fall back to sequential parent
        // effectiveParentUuid保存`parentUuid`，供后续判断或组装使用。
        let effectiveParentUuid = parentUuid
        // 共享工具在这里按实际状态进入对应分支。
        if (
          message.type === 'user' &&
          'sourceToolAssistantUUID' in message &&
          message.sourceToolAssistantUUID
        ) {
          // effectiveParentUuid更新为 `message.sourceToolAssistantUUID`，确保共享工具后续读取最新状态。
          effectiveParentUuid = message.sourceToolAssistantUUID
        }

        // transcriptMessage 消息数据 集中保存共享工具 session Storage要一起传递的字段。
        const transcriptMessage: TranscriptMessage = {
          parentUuid: isCompactBoundary ? null : effectiveParentUuid,
          logicalParentUuid: isCompactBoundary ? parentUuid : undefined,
          isSidechain,
          teamName: teamInfo?.teamName,
          agentName: teamInfo?.agentName,
          promptId:
            message.type === 'user' ? (getPromptId() ?? undefined) : undefined,
          agentId,
          ...message,
          // Session-stamp fields MUST come after the spread. On --fork-session
          // and --resume, messages arrive as SerializedMessage (carries source
          // sessionId/cwd/etc. because removeExtraFields only strips parentUuid
          // and isSidechain). If sessionId isn't re-stamped, FRESH.jsonl ends up
          // with messages stamped sessionId=A but content-replacement entries
          // stamped sessionId=FRESH (from insertContentReplacement), and
          // loadFullLog's sessionId-keyed contentReplacements lookup misses →
          // replacement records lost → FROZEN misclassification.
          userType: getUserType(),
          entrypoint: getEntrypoint(),
          cwd: getCwd(),
          sessionId,
          version: VERSION,
          gitBranch,
          slug,
        }
        // 等待 `this.appendEntry(transcriptMessage)` 完成，再继续共享工具 session Storage的异步流程。
        await this.appendEntry(transcriptMessage)
        // 满足 `isChainParticipant(message)` 时，共享工具执行该分支。
        if (isChainParticipant(message)) {
          // parentUuid更新为 `message.uuid`，确保共享工具后续读取最新状态。
          parentUuid = message.uuid
        }
      }

      // Cache this turn's user prompt for reAppendSessionMetadata —
      // the --resume picker shows what the user was last doing.
      // Overwritten every turn by design.
      // isSidechain缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!isSidechain) {
        // 文本读取`getFirstMeaningfulUserMessageTextContent`，供共享工具后续处理使用。
        const text = getFirstMeaningfulUserMessageTextContent(messages)
        // 满足 `text` 时，共享工具执行该分支。
        if (text) {
          // flat格式化`text.replace`，供共享工具后续处理使用。
          const flat = text.replace(/\n/g, ' ').trim()
          // 共享工具 session Storage在这里处理 `this.currentSessionLastPrompt =`，完成这一小步状态转换。
          this.currentSessionLastPrompt =
            flat.length > 200 ? flat.slice(0, 200).trim() + '…' : flat
        }
      }
    })
  }

  // 共享工具 session Storage在这里处理 `async insertFileHistorySnapshot(`，完成这一小步状态转换。
  async insertFileHistorySnapshot(
    messageId: UUID,
    snapshot: FileHistorySnapshot,
    isSnapshotUpdate: boolean,
  ) {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // fileHistoryMessage 消息数据 集中保存共享工具 session Storage要一起传递的字段。
      const fileHistoryMessage: FileHistorySnapshotMessage = {
        type: 'file-history-snapshot',
        messageId,
        snapshot,
        isSnapshotUpdate,
      }
      // 等待 `this.appendEntry(fileHistoryMessage)` 完成，再继续共享工具 session Storage的异步流程。
      await this.appendEntry(fileHistoryMessage)
    })
  }

  // insertQueueOperation 使用 queueOp: QueueOperationMessage 完成共享工具里的对应操作。
  async insertQueueOperation(queueOp: QueueOperationMessage) {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // 等待 `this.appendEntry(queueOp)` 完成，再继续共享工具 session Storage的异步流程。
      await this.appendEntry(queueOp)
    })
  }

  // insertAttributionSnapshot 使用 snapshot: AttributionSnapshotMessage 完成共享工具里的对应操作。
  async insertAttributionSnapshot(snapshot: AttributionSnapshotMessage) {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // 等待 `this.appendEntry(snapshot)` 完成，再继续共享工具 session Storage的异步流程。
      await this.appendEntry(snapshot)
    })
  }

  // 共享工具 session Storage在这里处理 `async insertContentReplacement(`，完成这一小步状态转换。
  async insertContentReplacement(
    replacements: ContentReplacementRecord[],
    agentId?: AgentId,
  ) {
    // 返回 `this.trackWrite(async () => {`，作为共享工具这次计算的结果。
    return this.trackWrite(async () => {
      // entry 集中保存共享工具 session Storage要一起传递的字段。
      const entry: ContentReplacementEntry = {
        type: 'content-replacement',
        sessionId: getSessionId() as UUID,
        agentId,
        replacements,
      }
      // 等待 `this.appendEntry(entry)` 完成，再继续共享工具 session Storage的异步流程。
      await this.appendEntry(entry)
    })
  }

  // 共享工具 session Storage在这里处理 `async appendEntry(entry: Entry, sessionId: UUID = getSessionId() as UUI...`，完成这一小步状态转换。
  async appendEntry(entry: Entry, sessionId: UUID = getSessionId() as UUID) {
    // 满足 `this.shouldSkipPersistence()` 时，共享工具执行该分支。
    if (this.shouldSkipPersistence()) {
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // currentSessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
    const currentSessionId = getSessionId() as UUID
    // isCurrentSession 会话数据标记共享工具 session Storage是否启用对应路径。
    const isCurrentSession = sessionId === currentSessionId

    // sessionFile 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let sessionFile: string
    // 满足 `isCurrentSession` 时，共享工具执行该分支。
    if (isCurrentSession) {
      // Buffer until materializeSessionFile runs (first user/assistant message).
      // 满足 `this.sessionFile === null` 时，共享工具执行该分支。
      if (this.sessionFile === null) {
        // pendingEntries 集合追加新条目，保持收集顺序与输入顺序一致。
        this.pendingEntries.push(entry)
        // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // sessionFile 会话数据更新为 `this.sessionFile`，确保共享工具后续读取最新状态。
      sessionFile = this.sessionFile
    } else {
      // existing读取`this.getExistingSessionFile`，供共享工具后续处理使用。
      const existing = await this.getExistingSessionFile(sessionId)
      // existing缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!existing) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `appendEntry: session file not found for other session ${sessionId}`,
          ),
        )
        // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // sessionFile 会话数据更新为 `existing`，确保共享工具后续读取最新状态。
      sessionFile = existing
    }

    // Only load current session messages if needed
    // 当 `entry.type` 匹配 `'summary'` 时，共享工具执行对应分支。
    if (entry.type === 'summary') {
      // Summaries can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'custom-title') {`，完成这一小步状态转换。
    } else if (entry.type === 'custom-title') {
      // Custom titles can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'ai-title') {`，完成这一小步状态转换。
    } else if (entry.type === 'ai-title') {
      // AI titles can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'last-prompt') {`，完成这一小步状态转换。
    } else if (entry.type === 'last-prompt') {
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'task-summary') {`，完成这一小步状态转换。
    } else if (entry.type === 'task-summary') {
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'tag') {`，完成这一小步状态转换。
    } else if (entry.type === 'tag') {
      // Tags can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-name') {`，完成这一小步状态转换。
    } else if (entry.type === 'agent-name') {
      // Agent names can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-color') {`，完成这一小步状态转换。
    } else if (entry.type === 'agent-color') {
      // Agent colors can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-setting') {`，完成这一小步状态转换。
    } else if (entry.type === 'agent-setting') {
      // Agent settings can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'pr-link') {`，完成这一小步状态转换。
    } else if (entry.type === 'pr-link') {
      // PR links can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'file-history-snapshot') {`，完成这一小步状态转换。
    } else if (entry.type === 'file-history-snapshot') {
      // File history snapshots can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'attribution-snapshot') {`，完成这一小步状态转换。
    } else if (entry.type === 'attribution-snapshot') {
      // Attribution snapshots can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'speculation-accept') {`，完成这一小步状态转换。
    } else if (entry.type === 'speculation-accept') {
      // Speculation accept entries can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'mode') {`，完成这一小步状态转换。
    } else if (entry.type === 'mode') {
      // Mode entries can always be appended
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'worktree-state') {`，完成这一小步状态转换。
    } else if (entry.type === 'worktree-state') {
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'content-replacement') {`，完成这一小步状态转换。
    } else if (entry.type === 'content-replacement') {
      // Content replacement records can always be appended. Subagent records
      // go to the sidechain file (for AgentTool resume); main-thread
      // records go to the session file (for /resume).
      // targetFile 文件数据 命名 `entry.agentId`，让后续代码直接表达这个值的用途。
      const targetFile = entry.agentId
        ? getAgentTranscriptPath(entry.agentId)
        : sessionFile
      // 显式忽略 `this.enqueueWrite(targetFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(targetFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'marble-origami-commit') {`，完成这一小步状态转换。
    } else if (entry.type === 'marble-origami-commit') {
      // Always append. Commit order matters for restore (later commits may
      // reference earlier commits' summary messages), so these must be
      // written in the order received and read back sequentially.
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    // 共享工具 session Storage在这里处理 `} else if (entry.type === 'marble-origami-snapshot') {`，完成这一小步状态转换。
    } else if (entry.type === 'marble-origami-snapshot') {
      // Always append. Last-wins on restore — later entries supersede.
      // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
      void this.enqueueWrite(sessionFile, entry)
    } else {
      // messageSet 消息数据读取`getSessionMessages`，供共享工具后续处理使用。
      const messageSet = await getSessionMessages(sessionId)
      // 当 `entry.type` 匹配 `'queue-operation'` 时，共享工具执行对应分支。
      if (entry.type === 'queue-operation') {
        // Queue operations are always appended to the session file
        // 显式忽略 `this.enqueueWrite(sessionFile, entry)` 的返回值，只保留它触发的副作用。
        void this.enqueueWrite(sessionFile, entry)
      } else {
        // At this point, entry must be a TranscriptMessage (user/assistant/attachment/system)
        // All other entry types have been handled above
        // isAgentSidechain 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isAgentSidechain =
          entry.isSidechain && entry.agentId !== undefined
        // targetFile 文件数据 命名 `isAgentSidechain`，让后续代码直接表达这个值的用途。
        const targetFile = isAgentSidechain
          ? getAgentTranscriptPath(asAgentId(entry.agentId!))
          : sessionFile

        // For message entries, check if UUID already exists in current session.
        // Skip dedup for agent sidechain LOCAL writes — they go to a separate
        // file, and fork-inherited parent messages share UUIDs with the main
        // session transcript. Deduping against the main session's set would
        // drop them, leaving the persisted sidechain transcript incomplete
        // (resume-of-fork loads a 10KB file instead of the full 85KB inherited
        // context).
        //
        // The sidechain bypass applies ONLY to the local file write — remote
        // persistence (session-ingress) uses a single Last-Uuid chain per
        // sessionId, so re-POSTing a UUID it already has 409s and eventually
        // exhausts retries → gracefulShutdownSync(1). See inc-4718.
        // isNewUuid记录 `messageSet.has` 是否成立，共享工具随后按该结果分支。
        const isNewUuid = !messageSet.has(entry.uuid)
        // 只有 `isAgentSidechain || isNewUuid` 满足时，共享工具才执行该分支。
        if (isAgentSidechain || isNewUuid) {
          // Enqueue write — appendToFile handles ENOENT by creating directories
          // 显式忽略 `this.enqueueWrite(targetFile, entry)` 的返回值，只保留它触发的副作用。
          void this.enqueueWrite(targetFile, entry)

          // isAgentSidechain缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!isAgentSidechain) {
            // messageSet is main-file-authoritative. Sidechain entries go to a
            // separate agent file — adding their UUIDs here causes recordTranscript
            // to skip them on the main thread (line ~1270), so the message is never
            // written to the main session file. The next main-thread message then
            // chains its parentUuid to a UUID that only exists in the agent file,
            // and --resume's buildConversationChain terminates at the dangling ref.
            // Same constraint for remote (inc-4718 above): sidechain persisting a
            // UUID the main thread hasn't written yet → 409 when main writes it.
            // 调用 messageSet.add，触发共享工具此处需要的副作用。
            messageSet.add(entry.uuid)

            // 满足 `isTranscriptMessage(entry)` 时，共享工具执行该分支。
            if (isTranscriptMessage(entry)) {
              // 等待 `this.persistToRemote(sessionId, entry)` 完成，再继续共享工具 session Storage的异步流程。
              await this.persistToRemote(sessionId, entry)
            }
          }
        }
      }
    }
  }

  /**
   * Loads the sessionFile variable.
   * Do not need to create session files until they are written to.
   */
  // 共享工具 session Storage在这里处理 `private ensureCurrentSessionFile(): string {`，完成这一小步状态转换。
  private ensureCurrentSessionFile(): string {
    // 满足 `this.sessionFile === null` 时，共享工具执行该分支。
    if (this.sessionFile === null) {
      // 更新实例字段 sessionFile 为 getTranscriptPath()，同步共享工具的内部状态。
      this.sessionFile = getTranscriptPath()
    }

    // 返回 `this.sessionFile`，作为共享工具这次计算的结果。
    return this.sessionFile
  }

  /**
   * Returns the session file path if it exists, null otherwise.
   * Used for writing to sessions other than the current one.
   * Caches positive results so we only stat once per session.
   */
  private existingSessionFiles = new Map<string, string>()
  // 共享工具 session Storage在这里处理 `private async getExistingSessionFile(`，完成这一小步状态转换。
  private async getExistingSessionFile(
    sessionId: UUID,
  ): Promise<string | null> {
    // cached 缓存读取`existingSessionFiles.get`，供共享工具后续处理使用。
    const cached = this.existingSessionFiles.get(sessionId)
    // 满足 `cached` 时，共享工具执行该分支。
    if (cached) return cached

    // targetFile 文件数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
    const targetFile = getTranscriptPathForSession(sessionId)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(targetFile)` 完成，再继续共享工具 session Storage的异步流程。
      await stat(targetFile)
      // this.existingSessionFiles.set 写入新的状态值，使共享工具后续读取保持一致。
      this.existingSessionFiles.set(sessionId, targetFile)
      // 返回 `targetFile`，作为共享工具这次计算的结果。
      return targetFile
    } catch (e) {
      // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
      if (isFsInaccessible(e)) return null
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }
  }

  // 共享工具 session Storage在这里处理 `private async persistToRemote(sessionId: UUID, entry: TranscriptMessage...`，完成这一小步状态转换。
  private async persistToRemote(sessionId: UUID, entry: TranscriptMessage) {
    // 满足 `isShuttingDown()` 时，共享工具执行该分支。
    if (isShuttingDown()) {
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // CCR v2 path: write as internal worker event
    // 满足 `this.internalEventWriter` 时，共享工具执行该分支。
    if (this.internalEventWriter) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `this.internalEventWriter(` 完成，再继续共享工具 session Storage的异步流程。
        await this.internalEventWriter(
          'transcript',
          entry as unknown as Record<string, unknown>,
          {
            ...(isCompactBoundaryMessage(entry) && { isCompaction: true }),
            ...(entry.agentId && { agentId: entry.agentId }),
          },
        )
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_session_persistence_failed', {})
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Failed to write transcript as internal event')
      }
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // v1 Session Ingress path
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !isEnvTruthy(process.env.ENABLE_SESSION_PERSISTENCE) ||
      !this.remoteIngressUrl
    ) {
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // success 集合保存`sessionIngress.appendSessionLog`，供共享工具后续处理使用。
    const success = await sessionIngress.appendSessionLog(
      sessionId,
      entry,
      this.remoteIngressUrl,
    )

    // success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_session_persistence_failed', {})
      // 调用 gracefulShutdownSync，触发共享工具此处需要的副作用。
      gracefulShutdownSync(1, 'other')
    }
  }

  // setRemoteIngressUrl 根据 url: string 更新共享工具的状态。
  setRemoteIngressUrl(url: string): void {
    // 更新实例字段 remoteIngressUrl 为 url，同步共享工具的内部状态。
    this.remoteIngressUrl = url
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Remote persistence enabled with URL: ${url}`)
    // 满足 `url` 时，共享工具执行该分支。
    if (url) {
      // If using CCR, don't delay messages by any more than 10ms.
      // 更新实例字段 FLUSH_INTERVAL_MS 为 REMOTE_FLUSH_INTERVAL_MS，同步共享工具的内部状态。
      this.FLUSH_INTERVAL_MS = REMOTE_FLUSH_INTERVAL_MS
    }
  }

  // setInternalEventWriter 根据 writer: InternalEventWriter 更新共享工具的状态。
  setInternalEventWriter(writer: InternalEventWriter): void {
    // 更新实例字段 internalEventWriter 为 writer，同步共享工具的内部状态。
    this.internalEventWriter = writer
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'CCR v2 internal event writer registered for transcript persistence',
    )
    // Use fast flush interval for CCR v2
    // 更新实例字段 FLUSH_INTERVAL_MS 为 REMOTE_FLUSH_INTERVAL_MS，同步共享工具的内部状态。
    this.FLUSH_INTERVAL_MS = REMOTE_FLUSH_INTERVAL_MS
  }

  // setInternalEventReader 根据 reader: InternalEventReader 更新共享工具的状态。
  setInternalEventReader(reader: InternalEventReader): void {
    // 更新实例字段 internalEventReader 为 reader，同步共享工具的内部状态。
    this.internalEventReader = reader
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'CCR v2 internal event reader registered for session resume',
    )
  }

  // setInternalSubagentEventReader 根据 reader: InternalEventReader 更新共享工具的状态。
  setInternalSubagentEventReader(reader: InternalEventReader): void {
    // 更新实例字段 internalSubagentEventReader 为 reader，同步共享工具的内部状态。
    this.internalSubagentEventReader = reader
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'CCR v2 subagent event reader registered for session resume',
    )
  }

  // getInternalEventReader不依赖额外参数，直接计算共享工具需要的结果。
  getInternalEventReader(): InternalEventReader | null {
    // 返回 `this.internalEventReader`，作为共享工具这次计算的结果。
    return this.internalEventReader
  }

  // getInternalSubagentEventReader不依赖额外参数，直接计算共享工具需要的结果。
  getInternalSubagentEventReader(): InternalEventReader | null {
    // 返回 `this.internalSubagentEventReader`，作为共享工具这次计算的结果。
    return this.internalSubagentEventReader
  }
}

// TeamInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamInfo = {
  teamName?: string
  agentName?: string
}

// Filter out already-recorded messages before passing to insertMessageChain.
// Without this, after compaction messagesToKeep (same UUIDs as pre-compact
// messages) are dedup-skipped by appendEntry but still advance the parentUuid
// cursor in insertMessageChain, causing new messages to chain from pre-compact
// UUIDs instead of the post-compact summary — orphaning the compact boundary.
//
// `startingParentUuidHint`: used by useLogMessages to pass the parent from
// the previous incremental slice, avoiding an O(n) scan to rediscover it.
//
// Skip-tracking: already-recorded messages are tracked as the parent ONLY if
// they form a PREFIX (appear before any new message). This handles both cases:
//  - Growing-array callers (QueryEngine, queryHelpers, LocalMainSessionTask,
//    trajectory): recorded messages are always a prefix → tracked → correct
//    parent chain for new messages.
//  - Compaction (useLogMessages): new CB/summary appear FIRST, then recorded
//    messagesToKeep → not a prefix → not tracked → CB gets parentUuid=null
//    (correct: truncates --continue chain at compact boundary).
// recordTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordTranscript(
  messages: Message[],
  teamInfo?: TeamInfo,
  startingParentUuidHint?: UUID,
  allMessages?: readonly Message[],
): Promise<UUID | null> {
  // cleanedMessages 消息数据保存`cleanMessagesForLogging`，供共享工具后续处理使用。
  const cleanedMessages = cleanMessagesForLogging(messages, allMessages)
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId() as UUID
  // messageSet 消息数据读取`getSessionMessages`，供共享工具后续处理使用。
  const messageSet = await getSessionMessages(sessionId)
  // newMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newMessages: typeof cleanedMessages = []
  // startingParentUuid保存`startingParentUuidHint`，供后续判断或组装使用。
  let startingParentUuid: UUID | undefined = startingParentUuidHint
  // seenNewMessage 消息数据标记共享工具 session Storage是否启用对应路径。
  let seenNewMessage = false
  // 按顺序遍历 `cleanedMessages` 中的m，逐个交给共享工具处理。
  for (const m of cleanedMessages) {
    // 满足 `messageSet.has(m.uuid as UUID)` 时，共享工具执行该分支。
    if (messageSet.has(m.uuid as UUID)) {
      // Only track skipped messages that form a prefix. After compaction,
      // messagesToKeep appear AFTER new CB/summary, so this skips them.
      // 只有 `!seenNewMessage && isChainParticipant(m)` 满足时，共享工具才执行该分支。
      if (!seenNewMessage && isChainParticipant(m)) {
        // startingParentUuid更新为 `m.uuid as UUID`，确保共享工具后续读取最新状态。
        startingParentUuid = m.uuid as UUID
      }
    } else {
      // newMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      newMessages.push(m)
      // seenNewMessage 消息数据更新为 `true`，确保共享工具后续读取最新状态。
      seenNewMessage = true
    }
  }
  // 满足 `newMessages.length > 0` 时，共享工具执行该分支。
  if (newMessages.length > 0) {
    // 等待 `getProject().insertMessageChain(` 完成，再继续共享工具 session Storage的异步流程。
    await getProject().insertMessageChain(
      newMessages,
      false,
      undefined,
      startingParentUuid,
      teamInfo,
    )
  }
  // Return the last ACTUALLY recorded chain-participant's UUID, OR the
  // prefix-tracked UUID if no new chain participants were recorded. This lets
  // callers (useLogMessages) maintain the correct parent chain even when the
  // slice is all-recorded (rewind, /resume scenarios where every message is
  // already in messageSet). Progress is skipped — it's written to the JSONL
  // but nothing chains TO it (see isChainParticipant).
  // lastRecorded筛选`newMessages.findLast`，供共享工具后续处理使用。
  const lastRecorded = newMessages.findLast(isChainParticipant)
  // 返回 `(lastRecorded?.uuid as UUID | undefined) ?? startingParentUuid ?? null`，作为共享工具这次计算的结果。
  return (lastRecorded?.uuid as UUID | undefined) ?? startingParentUuid ?? null
}

// recordSidechainTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordSidechainTranscript(
  messages: Message[],
  agentId?: string,
  startingParentUuid?: UUID | null,
) {
  // 等待 `getProject().insertMessageChain(` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().insertMessageChain(
    cleanMessagesForLogging(messages),
    true,
    agentId,
    startingParentUuid,
  )
}

// recordQueueOperation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordQueueOperation(queueOp: QueueOperationMessage) {
  // 等待 `getProject().insertQueueOperation(queueOp)` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().insertQueueOperation(queueOp)
}

/**
 * Remove a message from the transcript by UUID.
 * Used when a tombstone is received for an orphaned message.
 */
// removeTranscriptMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeTranscriptMessage(targetUuid: UUID): Promise<void> {
  // 等待 `getProject().removeMessageByUuid(targetUuid)` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().removeMessageByUuid(targetUuid)
}

// recordFileHistorySnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordFileHistorySnapshot(
  messageId: UUID,
  snapshot: FileHistorySnapshot,
  isSnapshotUpdate: boolean,
) {
  // 等待 `getProject().insertFileHistorySnapshot(` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().insertFileHistorySnapshot(
    messageId,
    snapshot,
    isSnapshotUpdate,
  )
}

// recordAttributionSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordAttributionSnapshot(
  snapshot: AttributionSnapshotMessage,
) {
  // 等待 `getProject().insertAttributionSnapshot(snapshot)` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().insertAttributionSnapshot(snapshot)
}

// recordContentReplacement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordContentReplacement(
  replacements: ContentReplacementRecord[],
  agentId?: AgentId,
) {
  // 等待 `getProject().insertContentReplacement(replacements, agentId)` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().insertContentReplacement(replacements, agentId)
}

/**
 * Reset the session file pointer after switchSession/regenerateSessionId.
 * The new file is created lazily on the first user/assistant message.
 */
// resetSessionFilePointer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resetSessionFilePointer() {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().resetSessionFile()
}

/**
 * Adopt the existing session file after --continue/--resume (non-fork).
 * Call after switchSession + resetSessionFilePointer + restoreSessionMetadata:
 * getTranscriptPath() now derives the resumed file's path from the switched
 * sessionId, and the cache holds the final metadata (--name title, resumed
 * mode/tag/agent).
 *
 * Setting sessionFile here — instead of waiting for materializeSessionFile
 * on the first user message — lets the exit cleanup handler's
 * reAppendSessionMetadata run (it bails when sessionFile is null). Without
 * this, `-c -n foo` + quit-before-message drops the title on the floor:
 * the in-memory cache is correct but never written. The resumed file
 * already exists on disk (we loaded from it), so this can't create an
 * orphan the way a fresh --name session would.
 *
 * skipTitleRefresh: restoreSessionMetadata populated the cache from the
 * same disk read microseconds ago, so refreshing from the tail here is a
 * no-op — unless --name was used, in which case it would clobber the fresh
 * CLI title with the stale disk value. After this write, disk == cache and
 * later calls (compaction, exit cleanup) absorb SDK writes normally.
 */
// adoptResumedSessionFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function adoptResumedSessionFile(): void {
  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()
  // sessionFile 会话数据更新为 `getTranscriptPath()`，确保共享工具后续读取最新状态。
  project.sessionFile = getTranscriptPath()
  // 调用 project.reAppendSessionMetadata，触发共享工具此处需要的副作用。
  project.reAppendSessionMetadata(true)
}

/**
 * Append a context-collapse commit entry to the transcript. One entry per
 * commit, in commit order. On resume these are collected into an ordered
 * array and handed to restoreFromEntries() which rebuilds the commit log.
 */
// recordContextCollapseCommit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordContextCollapseCommit(commit: {
  collapseId: string
  summaryUuid: string
  summaryContent: string
  summary: string
  firstArchivedUuid: string
  lastArchivedUuid: string
}): Promise<void> {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId() as UUID
  // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sessionId) return
  // 等待 `getProject().appendEntry({` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().appendEntry({
    type: 'marble-origami-commit',
    sessionId,
    ...commit,
  })
}

/**
 * Snapshot the staged queue + spawn state. Written after each ctx-agent
 * spawn resolves (when staged contents may have changed). Last-wins on
 * restore — the loader keeps only the most recent snapshot entry.
 */
// recordContextCollapseSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordContextCollapseSnapshot(snapshot: {
  staged: Array<{
    startUuid: string
    endUuid: string
    summary: string
    risk: number
    stagedAt: number
  }>
  armed: boolean
  lastSpawnTokens: number
}): Promise<void> {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId() as UUID
  // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sessionId) return
  // 等待 `getProject().appendEntry({` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().appendEntry({
    type: 'marble-origami-snapshot',
    sessionId,
    ...snapshot,
  })
}

// flushSessionStorage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function flushSessionStorage(): Promise<void> {
  // 等待 `getProject().flush()` 完成，再继续共享工具 session Storage的异步流程。
  await getProject().flush()
}

// hydrateRemoteSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function hydrateRemoteSession(
  sessionId: string,
  ingressUrl: string,
): Promise<boolean> {
  // 调用 switchSession，触发共享工具此处需要的副作用。
  switchSession(asSessionId(sessionId))

  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // remoteLogs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const remoteLogs =
      (await sessionIngress.getSessionLogs(sessionId, ingressUrl)) || []

    // Ensure the project directory and session file exist
    // projectDir读取`getProjectDir`，供共享工具后续处理使用。
    const projectDir = getProjectDir(getOriginalCwd())
    // 等待 `mkdir(projectDir, { recursive: true, mode: 0o700 })` 完成，再继续共享工具 session Storage的异步流程。
    await mkdir(projectDir, { recursive: true, mode: 0o700 })

    // sessionFile 会话数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
    const sessionFile = getTranscriptPathForSession(sessionId)

    // Replace local logs with remote logs. writeFile truncates, so no
    // unlink is needed; an empty remoteLogs array produces an empty file.
    // 文本内容派生`remoteLogs.map`，供共享工具后续处理使用。
    const content = remoteLogs.map(e => jsonStringify(e) + '\n').join('')
    // 等待 `writeFile(sessionFile, content, { encoding: 'utf8', mode: 0o600 })` 完成，再继续共享工具 session Storage的异步流程。
    await writeFile(sessionFile, content, { encoding: 'utf8', mode: 0o600 })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Hydrated ${remoteLogs.length} entries from remote`)
    // 返回 `remoteLogs.length > 0`，作为共享工具这次计算的结果。
    return remoteLogs.length > 0
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error hydrating session from remote: ${error}`)
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', 'hydrate_remote_session_fail')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } finally {
    // Set remote ingress URL after hydrating the remote session
    // to ensure we've always synced with the remote session
    // prior to enabling persistence
    // project.setRemoteIngressUrl 写入新的状态值，使共享工具后续读取保持一致。
    project.setRemoteIngressUrl(ingressUrl)
  }
}

/**
 * Hydrate session state from CCR v2 internal events.
 * Fetches foreground and subagent events via the registered readers,
 * extracts transcript entries from payloads, and writes them to the
 * local transcript files (main + per-agent).
 * The server handles compaction filtering — it returns events starting
 * from the latest compaction boundary.
 */
// hydrateFromCCRv2InternalEvents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function hydrateFromCCRv2InternalEvents(
  sessionId: string,
): Promise<boolean> {
  // startMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const startMs = Date.now()
  // 调用 switchSession，触发共享工具此处需要的副作用。
  switchSession(asSessionId(sessionId))

  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()
  // reader读取`project.getInternalEventReader`，供共享工具后续处理使用。
  const reader = project.getInternalEventReader()
  // reader缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!reader) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('No internal event reader registered for CCR v2 resume')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Fetch foreground events
    // events 集合读取`reader`，供共享工具后续处理使用。
    const events = await reader()
    // events 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!events) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Failed to read internal events for resume')
      // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
      logForDiagnosticsNoPII('error', 'hydrate_ccr_v2_read_fail')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // projectDir读取`getProjectDir`，供共享工具后续处理使用。
    const projectDir = getProjectDir(getOriginalCwd())
    // 等待 `mkdir(projectDir, { recursive: true, mode: 0o700 })` 完成，再继续共享工具 session Storage的异步流程。
    await mkdir(projectDir, { recursive: true, mode: 0o700 })

    // Write foreground transcript
    // sessionFile 会话数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
    const sessionFile = getTranscriptPathForSession(sessionId)
    // fgContent派生`events.map`，供共享工具后续处理使用。
    const fgContent = events.map(e => jsonStringify(e.payload) + '\n').join('')
    // 等待 `writeFile(sessionFile, fgContent, { encoding: 'utf8', mode: 0o600 })` 完成，再继续共享工具 session Storage的异步流程。
    await writeFile(sessionFile, fgContent, { encoding: 'utf8', mode: 0o600 })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hydrated ${events.length} foreground entries from CCR v2 internal events`,
    )

    // Fetch and write subagent events
    // subagentEventCount 数量保存`0`，供共享工具 session Storage后续判断或输出使用。
    let subagentEventCount = 0
    // subagentReader读取`project.getInternalSubagentEventReader`，供共享工具后续处理使用。
    const subagentReader = project.getInternalSubagentEventReader()
    // 满足 `subagentReader` 时，共享工具执行该分支。
    if (subagentReader) {
      // subagentEvents 集合保存`subagentReader`，供共享工具后续处理使用。
      const subagentEvents = await subagentReader()
      // 只有 `subagentEvents && subagentEvents.length > 0` 满足时，共享工具才执行该分支。
      if (subagentEvents && subagentEvents.length > 0) {
        // subagentEventCount 数量更新为 `subagentEvents.length`，确保共享工具后续读取最新状态。
        subagentEventCount = subagentEvents.length
        // Group by agent_id
        // byAgent构建`new Map<string, Record<string, unknown>[]>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
        const byAgent = new Map<string, Record<string, unknown>[]>()
        // 按顺序遍历 `subagentEvents` 中的e，逐个交给共享工具处理。
        for (const e of subagentEvents) {
          // agentId标记共享工具 session Storage是否启用对应路径。
          const agentId = e.agent_id || ''
          // agentId缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!agentId) continue
          // list 集合读取`byAgent.get`，供共享工具后续处理使用。
          let list = byAgent.get(agentId)
          // list 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!list) {
            // list 集合更新为 `[]`，确保共享工具后续读取最新状态。
            list = []
            // byAgent.set 写入新的状态值，使共享工具后续读取保持一致。
            byAgent.set(agentId, list)
          }
          // list 集合追加新条目，保持收集顺序与输入顺序一致。
          list.push(e.payload)
        }

        // Write each agent's transcript to its own file
        // 循环处理 `const [agentId, entries] of byAgent`，让共享工具逐项把同类条目按顺序走完。
        for (const [agentId, entries] of byAgent) {
          // agentFile 文件数据读取`getAgentTranscriptPath`，供共享工具后续处理使用。
          const agentFile = getAgentTranscriptPath(asAgentId(agentId))
          // 等待 `mkdir(dirname(agentFile), { recursive: true, mode: 0o700 })` 完成，再继续共享工具 session Storage的异步流程。
          await mkdir(dirname(agentFile), { recursive: true, mode: 0o700 })
          // agentContent 命名 `entries`，让后续代码直接表达这个值的用途。
          const agentContent = entries
            // 链式调用 map，继续加工上一行在共享工具中产生的数据。
            .map(p => jsonStringify(p) + '\n')
            .join('')
          // 等待 `writeFile(agentFile, agentContent, {` 完成，再继续共享工具 session Storage的异步流程。
          await writeFile(agentFile, agentContent, {
            encoding: 'utf8',
            mode: 0o600,
          })
        }

        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Hydrated ${subagentEvents.length} subagent entries across ${byAgent.size} agents`,
        )
      }
    }

    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'hydrate_ccr_v2_completed', {
      duration_ms: Date.now() - startMs,
      event_count: events.length,
      subagent_event_count: subagentEventCount,
    })
    // 返回 `events.length > 0`，作为共享工具这次计算的结果。
    return events.length > 0
  } catch (error) {
    // Re-throw epoch mismatch so the worker doesn't race against gracefulShutdown
    // 共享工具在这里按实际状态进入对应分支。
    if (
      error instanceof Error &&
      error.message === 'CCRClient: Epoch mismatch (409)'
    ) {
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error hydrating session from CCR v2: ${error}`)
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', 'hydrate_ccr_v2_fail')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// extractFirstPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractFirstPrompt(transcript: TranscriptMessage[]): string {
  // textContent读取`getFirstMeaningfulUserMessageTextContent`，供共享工具后续处理使用。
  const textContent = getFirstMeaningfulUserMessageTextContent(transcript)
  // 满足 `textContent` 时，共享工具执行该分支。
  if (textContent) {
    // 结果格式化`textContent.replace`，供共享工具后续处理使用。
    let result = textContent.replace(/\n/g, ' ').trim()

    // Store a reasonably long version for display-time truncation
    // The actual truncation will be applied at display time based on terminal width
    // 满足 `result.length > 200` 时，共享工具执行该分支。
    if (result.length > 200) {
      // 结果更新为 `result.slice(0, 200).trim() + '…'`，确保共享工具后续读取最新状态。
      result = result.slice(0, 200).trim() + '…'
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 返回 `'No prompt'`，作为共享工具这次计算的结果。
  return 'No prompt'
}

/**
 * Gets the last user message that was processed (i.e., before any non-user message appears).
 * Used to determine if a session has valid user interaction.
 */
// getFirstMeaningfulUserMessageTextContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFirstMeaningfulUserMessageTextContent<T extends Message>(
  transcript: T[],
): string | undefined {
  // 按顺序遍历 `transcript` 中的消息，逐个交给共享工具处理。
  for (const msg of transcript) {
    // `msg.type` 与 `'user' || msg.isMeta` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'user' || msg.isMeta) continue
    // Skip compact summary messages - they should not be treated as the first prompt
    // 只有 `'isCompactSummary' in msg && msg.isCompactSummary` 满足时，共享工具才执行该分支。
    if ('isCompactSummary' in msg && msg.isCompactSummary) continue

    // 文本内容保存`msg.message?.content`，供后续判断或组装使用。
    const content = msg.message?.content
    // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!content) continue

    // Collect all text values. For array content (common in VS Code where
    // IDE metadata tags come before the user's actual prompt), iterate all
    // text blocks so we don't miss the real prompt hidden behind
    // <ide_selection>/<ide_opened_file> blocks.
    // texts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const texts: string[] = []
    // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof content === 'string') {
      // texts 集合追加新条目，保持收集顺序与输入顺序一致。
      texts.push(content)
    // 共享工具 session Storage在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
    } else if (Array.isArray(content)) {
      // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
      for (const block of content) {
        // 只有 `block.type === 'text' && block.text` 满足时，共享工具才执行该分支。
        if (block.type === 'text' && block.text) {
          // texts 集合追加新条目，保持收集顺序与输入顺序一致。
          texts.push(block.text)
        }
      }
    }

    // 按顺序遍历 `texts` 中的textContent，逐个交给共享工具处理。
    for (const textContent of texts) {
      // textContent缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!textContent) continue

      // commandNameTag 命令数据保存`extractTag`，供共享工具后续处理使用。
      const commandNameTag = extractTag(textContent, COMMAND_NAME_TAG)
      // 满足 `commandNameTag` 时，共享工具执行该分支。
      if (commandNameTag) {
        // commandName 命令数据格式化`commandNameTag.replace`，供共享工具后续处理使用。
        const commandName = commandNameTag.replace(/^\//, '')

        // If it's a built-in command, then it's unlikely to provide
        // meaningful context (e.g. `/model sonnet`)
        // 满足 `builtInCommandNames().has(commandName)` 时，共享工具执行该分支。
        if (builtInCommandNames().has(commandName)) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        } else {
          // Otherwise, for custom commands, then keep it only if it has
          // arguments (e.g. `/review reticulate splines`)
          // commandArgs 命令数据保存`extractTag`，供共享工具后续处理使用。
          const commandArgs = extractTag(textContent, 'command-args')?.trim()
          // commandArgs 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!commandArgs) {
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // Return clean formatted command instead of raw XML
          // 返回 ``${commandNameTag} ${commandArgs}``，作为共享工具这次计算的结果。
          return `${commandNameTag} ${commandArgs}`
        }
      }

      // Format bash input with ! prefix (as user typed it). Checked before
      // the generic XML skip so bash-mode sessions get a meaningful title.
      // bashInput保存`extractTag`，供共享工具后续处理使用。
      const bashInput = extractTag(textContent, 'bash-input')
      // 满足 `bashInput` 时，共享工具执行该分支。
      if (bashInput) {
        // 返回 ``! ${bashInput}``，作为共享工具这次计算的结果。
        return `! ${bashInput}`
      }

      // Skip non-meaningful messages (local command output, hook output,
      // autonomous tick prompts, task notifications, pure IDE metadata tags)
      // 满足 `SKIP_FIRST_PROMPT_PATTERN.test(textContent)` 时，共享工具执行该分支。
      if (SKIP_FIRST_PROMPT_PATTERN.test(textContent)) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 返回 `textContent`，作为共享工具这次计算的结果。
      return textContent
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// removeExtraFields 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeExtraFields(
  transcript: TranscriptMessage[],
): SerializedMessage[] {
  // 返回 `transcript.map(m => {`，作为共享工具这次计算的结果。
  return transcript.map(m => {
    // 从 `m` 解构 isSidechain、parentUuid、其余 serializedMessage，减少共享工具 session Storage对同一对象的重复访问。
    const { isSidechain, parentUuid, ...serializedMessage } = m
    // 返回 `serializedMessage`，作为共享工具这次计算的结果。
    return serializedMessage
  })
}

/**
 * Splice the preserved segment back into the chain after compaction.
 *
 * Preserved messages exist in the JSONL with their ORIGINAL pre-compact
 * parentUuids (recordTranscript dedup-skipped them — can't rewrite).
 * The internal chain (keep[i+1]→keep[i]) is intact; only endpoints need
 * patching: head→anchor, and anchor's other children→tail. Anchor is the
 * last summary for suffix-preserving, boundary itself for prefix-preserving.
 *
 * Only the LAST seg-boundary is relinked — earlier segs were summarized
 * into it. Everything physically before the absolute-last boundary (except
 * preservedUuids) is deleted, which handles all multi-boundary shapes
 * without special-casing.
 *
 * Mutates the Map in place.
 */
// applyPreservedSegmentRelinks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyPreservedSegmentRelinks(
  messages: Map<UUID, TranscriptMessage>,
): void {
  // Seg 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
  type Seg = NonNullable<
    SystemCompactBoundaryMessage['compactMetadata']['preservedSegment']
  >

  // Find the absolute-last boundary and the last seg-boundary (can differ:
  // manual /compact after reactive compact → seg is stale).
  // lastSeg 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastSeg: Seg | undefined
  // lastSegBoundaryIdx保存`-1`，供后续判断或组装使用。
  let lastSegBoundaryIdx = -1
  // absoluteLastBoundaryIdx 命名 `-1`，让后续代码直接表达这个值的用途。
  let absoluteLastBoundaryIdx = -1
  // entryIndex 索引 命名 `new Map<UUID, number>()`，让后续代码直接表达这个值的用途。
  const entryIndex = new Map<UUID, number>()
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // 逐项读取 `messages.values()` 中的entry，按输入顺序推进共享工具。
  for (const entry of messages.values()) {
    // entryIndex.set 写入新的状态值，使共享工具后续读取保持一致。
    entryIndex.set(entry.uuid, i)
    // 满足 `isCompactBoundaryMessage(entry)` 时，共享工具执行该分支。
    if (isCompactBoundaryMessage(entry)) {
      // absoluteLastBoundaryIdx更新为 `i`，确保共享工具后续读取最新状态。
      absoluteLastBoundaryIdx = i
      // seg 命名 `entry.compactMetadata?.preservedSegment`，让后续代码直接表达这个值的用途。
      const seg = entry.compactMetadata?.preservedSegment
      // 满足 `seg` 时，共享工具执行该分支。
      if (seg) {
        // lastSeg更新为 `seg`，确保共享工具后续读取最新状态。
        lastSeg = seg
        // lastSegBoundaryIdx更新为 `i`，确保共享工具后续读取最新状态。
        lastSegBoundaryIdx = i
      }
    }
    // 共享工具 session Storage在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // No seg anywhere → no-op. findUnresolvedToolUse etc. read the full map.
  // lastSeg缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastSeg) return

  // Seg stale (no-seg boundary came after): skip relink, still prune at
  // absolute — otherwise the stale preserved chain becomes a phantom leaf.
  // segIsLive标记共享工具 session Storage是否启用对应路径。
  const segIsLive = lastSegBoundaryIdx === absoluteLastBoundaryIdx

  // Validate tail→head BEFORE mutating so malformed metadata is a true
  // no-op (walk stops at headUuid, doesn't need the relink to run first).
  // preservedUuids 集合构建`new Set<UUID>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const preservedUuids = new Set<UUID>()
  // 满足 `segIsLive` 时，共享工具执行该分支。
  if (segIsLive) {
    // walkSeen构建`new Set<UUID>()`，供后续判断或组装使用。
    const walkSeen = new Set<UUID>()
    // cur读取`messages.get`，供共享工具后续处理使用。
    let cur = messages.get(lastSeg.tailUuid)
    // reachedHead标记共享工具 session Storage是否启用对应路径。
    let reachedHead = false
    // 只要 cur && !walkSeen.has(cur.uuid) 成立，就持续推进共享工具中的循环处理。
    while (cur && !walkSeen.has(cur.uuid)) {
      // 调用 walkSeen.add，触发共享工具此处需要的副作用。
      walkSeen.add(cur.uuid)
      // 调用 preservedUuids.add，触发共享工具此处需要的副作用。
      preservedUuids.add(cur.uuid)
      // 满足 `cur.uuid === lastSeg.headUuid` 时，共享工具执行该分支。
      if (cur.uuid === lastSeg.headUuid) {
        // reachedHead更新为 `true`，确保共享工具后续读取最新状态。
        reachedHead = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // cur更新为 `cur.parentUuid ? messages.get(cur.parentUuid) : undefined`，确保共享工具后续读取最新状态。
      cur = cur.parentUuid ? messages.get(cur.parentUuid) : undefined
    }
    // reachedHead缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!reachedHead) {
      // tail→head walk broke — a UUID in the preserved segment isn't in the
      // transcript. Returning here skips the prune below, so resume loads
      // the full pre-compact history. Known cause: mid-turn-yielded
      // attachment pushed to mutableMessages but never recordTranscript'd
      // (SDK subprocess restarted before next turn's qe:420 flush).
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_relink_walk_broken', {
        tailInTranscript: messages.has(lastSeg.tailUuid),
        headInTranscript: messages.has(lastSeg.headUuid),
        anchorInTranscript: messages.has(lastSeg.anchorUuid),
        walkSteps: walkSeen.size,
        transcriptSize: messages.size,
      })
      // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // 满足 `segIsLive` 时，共享工具执行该分支。
  if (segIsLive) {
    // head读取`messages.get`，供共享工具后续处理使用。
    const head = messages.get(lastSeg.headUuid)
    // 满足 `head` 时，共享工具执行该分支。
    if (head) {
      // messages.set 写入新的状态值，使共享工具后续读取保持一致。
      messages.set(lastSeg.headUuid, {
        ...head,
        parentUuid: lastSeg.anchorUuid,
      })
    }
    // Tail-splice: anchor's other children → tail. No-op if already pointing
    // at tail (the useLogMessages race case).
    // 循环处理 `const [uuid, msg] of messages`，让共享工具逐项把同类条目按顺序走完。
    for (const [uuid, msg] of messages) {
      // 只有 `msg.parentUuid === lastSeg.anchorUuid && uuid !==` 满足时，共享工具才执行该分支。
      if (msg.parentUuid === lastSeg.anchorUuid && uuid !== lastSeg.headUuid) {
        // messages.set 写入新的状态值，使共享工具后续读取保持一致。
        messages.set(uuid, { ...msg, parentUuid: lastSeg.tailUuid })
      }
    }
    // Zero stale usage: on-disk input_tokens reflect pre-compact context
    // (~190K) — stripStaleUsage only patched in-memory copies that were
    // dedup-skipped. Without this, resume → immediate autocompact spiral.
    // 按顺序遍历 `preservedUuids` 中的uuid，逐个交给共享工具处理。
    for (const uuid of preservedUuids) {
      // 消息读取`messages.get`，供共享工具后续处理使用。
      const msg = messages.get(uuid)
      // `msg?.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
      if (msg?.type !== 'assistant') continue
      // messages.set 写入新的状态值，使共享工具后续读取保持一致。
      messages.set(uuid, {
        ...msg,
        message: {
          ...msg.message,
          usage: {
            ...msg.message.usage,
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        },
      })
    }
  }

  // Prune everything physically before the absolute-last boundary that
  // isn't preserved. preservedUuids empty when !segIsLive → full prune.
  // toDelete 从空数组开始收集，后续循环会按处理顺序追加条目。
  const toDelete: UUID[] = []
  // 循环处理 `const [uuid] of messages`，让共享工具逐项把同类条目按顺序走完。
  for (const [uuid] of messages) {
    // idx读取`entryIndex.get`，供共享工具后续处理使用。
    const idx = entryIndex.get(uuid)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      idx !== undefined &&
      idx < absoluteLastBoundaryIdx &&
      !preservedUuids.has(uuid)
    ) {
      // toDelete追加新条目，保持收集顺序与输入顺序一致。
      toDelete.push(uuid)
    }
  }
  // 逐项读取 `toDelete) messages.delete(uuid` 中的uuid，按输入顺序推进共享工具。
  for (const uuid of toDelete) messages.delete(uuid)
}

/**
 * Delete messages that Snip executions removed from the in-memory array,
 * and relink parentUuid across the gaps.
 *
 * Unlike compact_boundary which truncates a prefix, snip removes
 * middle ranges. The JSONL is append-only, so removed messages stay on disk
 * and the surviving messages' parentUuid chains walk through them. Without
 * this filter, buildConversationChain reconstructs the full unsnipped history
 * and resume immediately PTLs (adamr-20260320-165831: 397K displayed → 1.65M
 * actual).
 *
 * Deleting alone is not enough: the surviving message AFTER a removed range
 * has parentUuid pointing INTO the gap. buildConversationChain would hit
 * messages.get(undefined) and stop, orphaning everything before the gap. So
 * after delete we relink: for each survivor with a dangling parentUuid, walk
 * backward through the removed region's own parent links to the first
 * non-removed ancestor.
 *
 * The boundary records removedUuids at execution time so we can replay the
 * exact removal on load. Older boundaries without removedUuids are skipped —
 * resume loads their pre-snip history (the pre-fix behavior).
 *
 * Mutates the Map in place.
 */
// applySnipRemovals 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applySnipRemovals(messages: Map<UUID, TranscriptMessage>): void {
  // Structural check — snipMetadata only exists on the boundary subtype.
  // Avoids the subtype literal which is in excluded-strings.txt
  // (HISTORY_SNIP is ant-only; the literal must not leak into external builds).
  // WithSnipMeta 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
  type WithSnipMeta = { snipMetadata?: { removedUuids?: UUID[] } }
  // toDelete构建`new Set<UUID>()`，供后续判断或组装使用。
  const toDelete = new Set<UUID>()
  // 逐项读取 `messages.values()` 中的entry，按输入顺序推进共享工具。
  for (const entry of messages.values()) {
    // removedUuids 集合保存`(entry as WithSnipMeta).snipMetadata?.removedUuids`，供后续判断或组装使用。
    const removedUuids = (entry as WithSnipMeta).snipMetadata?.removedUuids
    // removedUuids 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!removedUuids) continue
    // 逐项读取 `removedUuids) toDelete.add(uuid` 中的uuid，按输入顺序推进共享工具。
    for (const uuid of removedUuids) toDelete.add(uuid)
  }
  // 满足 `toDelete.size === 0` 时，共享工具执行该分支。
  if (toDelete.size === 0) return

  // Capture each to-delete entry's own parentUuid BEFORE deleting so we can
  // walk backward through contiguous removed ranges. Entries not in the Map
  // (already absent, e.g. from a prior compact_boundary prune) contribute no
  // link; the relink walk will stop at the gap and pick up null (chain-root
  // behavior — same as if compact truncated there, which it did).
  // deletedParent构建`new Map<UUID, UUID | null>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const deletedParent = new Map<UUID, UUID | null>()
  // removedCount 数量保存`0`，供共享工具 session Storage后续判断或输出使用。
  let removedCount = 0
  // 按顺序遍历 `toDelete` 中的uuid，逐个交给共享工具处理。
  for (const uuid of toDelete) {
    // entry读取`messages.get`，供共享工具后续处理使用。
    const entry = messages.get(uuid)
    // entry缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!entry) continue
    // deletedParent.set 写入新的状态值，使共享工具后续读取保持一致。
    deletedParent.set(uuid, entry.parentUuid)
    // 调用 messages.delete，触发共享工具此处需要的副作用。
    messages.delete(uuid)
    // 共享工具 session Storage在这里处理 `removedCount++`，完成这一小步状态转换。
    removedCount++
  }

  // Relink survivors with dangling parentUuid. Walk backward through
  // deletedParent until we hit a UUID not in toDelete (or null). Path
  // compression: after resolving, seed the map with the resolved link so
  // subsequent survivors sharing the same chain segment don't re-walk.
  // resolve封装成回调，供共享工具 session Storage在事件触发或异步步骤中调用。
  const resolve = (start: UUID): UUID | null => {
    // 路径 从空数组开始收集，后续循环会按处理顺序追加条目。
    const path: UUID[] = []
    // cur保存`start`，供后续判断或组装使用。
    let cur: UUID | null | undefined = start
    // 只要 cur && toDelete.has(cur) 成立，就持续推进共享工具中的循环处理。
    while (cur && toDelete.has(cur)) {
      // 路径追加新条目，保持收集顺序与输入顺序一致。
      path.push(cur)
      // cur更新为 `deletedParent.get(cur)`，确保共享工具后续读取最新状态。
      cur = deletedParent.get(cur)
      // 满足 `cur === undefined` 时，共享工具执行该分支。
      if (cur === undefined) {
        // cur更新为 `null`，确保共享工具后续读取最新状态。
        cur = null
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
    // 逐项读取 `path) deletedParent.set(p, cur` 中的p，按输入顺序推进共享工具。
    for (const p of path) deletedParent.set(p, cur)
    // 返回 `cur`，作为共享工具这次计算的结果。
    return cur
  }
  // relinkedCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let relinkedCount = 0
  // 循环处理 `const [uuid, msg] of messages`，让共享工具逐项把同类条目按顺序走完。
  for (const [uuid, msg] of messages) {
    // 只有 `!msg.parentUuid || !toDelete.has(msg.parentUuid)` 满足时，共享工具才执行该分支。
    if (!msg.parentUuid || !toDelete.has(msg.parentUuid)) continue
    // messages.set 写入新的状态值，使共享工具后续读取保持一致。
    messages.set(uuid, { ...msg, parentUuid: resolve(msg.parentUuid) })
    // 共享工具 session Storage在这里处理 `relinkedCount++`，完成这一小步状态转换。
    relinkedCount++
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_snip_resume_filtered', {
    removed_count: removedCount,
    relinked_count: relinkedCount,
  })
}

/**
 * O(n) single-pass: find the message with the latest timestamp matching a predicate.
 * Replaces the `[...values].filter(pred).sort((a,b) => Date(b)-Date(a))[0]` pattern
 * which is O(n log n) + 2n Date allocations.
 */
// findLatestMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findLatestMessage<T extends { timestamp: string }>(
  messages: Iterable<T>,
  // 这个回调绑定到 predicate: (m: T) => boolean,，负责共享工具在该局部场景下的响应。
  predicate: (m: T) => boolean,
): T | undefined {
  // latest 先占位，稍后的条件分支会根据实际输入补齐它。
  let latest: T | undefined
  // maxTime 命名 `-Infinity`，让后续代码直接表达这个值的用途。
  let maxTime = -Infinity
  // 按顺序遍历 `messages` 中的m，逐个交给共享工具处理。
  for (const m of messages) {
    // 满足 `!predicate(m)` 时，共享工具执行该分支。
    if (!predicate(m)) continue
    // t解析`Date.parse`，供共享工具后续处理使用。
    const t = Date.parse(m.timestamp)
    // 满足 `t > maxTime` 时，共享工具执行该分支。
    if (t > maxTime) {
      // maxTime更新为 `t`，确保共享工具后续读取最新状态。
      maxTime = t
      // latest更新为 `m`，确保共享工具后续读取最新状态。
      latest = m
    }
  }
  // 返回 `latest`，作为共享工具这次计算的结果。
  return latest
}

/**
 * Builds a conversation chain from a leaf message to root
 * @param messages Map of all messages
 * @param leafMessage The leaf message to start from
 * @returns Array of messages from root to leaf
 */
// buildConversationChain 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildConversationChain(
  messages: Map<UUID, TranscriptMessage>,
  leafMessage: TranscriptMessage,
): TranscriptMessage[] {
  // transcript 从空数组开始收集，后续循环会按处理顺序追加条目。
  const transcript: TranscriptMessage[] = []
  // seen 命名 `new Set<UUID>()`，让后续代码直接表达这个值的用途。
  const seen = new Set<UUID>()
  // currentMsg保存`leafMessage`，供共享工具 session Storage后续判断或输出使用。
  let currentMsg: TranscriptMessage | undefined = leafMessage
  // while 使用 currentMsg 完成共享工具里的对应操作。
  while (currentMsg) {
    // 满足 `seen.has(currentMsg.uuid)` 时，共享工具执行该分支。
    if (seen.has(currentMsg.uuid)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Cycle detected in parentUuid chain at message ${currentMsg.uuid}. Returning partial transcript.`,
        ),
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_chain_parent_cycle', {})
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 调用 seen.add，触发共享工具此处需要的副作用。
    seen.add(currentMsg.uuid)
    // transcript追加新条目，保持收集顺序与输入顺序一致。
    transcript.push(currentMsg)
    // currentMsg更新为 `currentMsg.parentUuid`，确保共享工具后续读取最新状态。
    currentMsg = currentMsg.parentUuid
      ? messages.get(currentMsg.parentUuid)
      : undefined
  }
  // 调用 transcript.reverse，触发共享工具此处需要的副作用。
  transcript.reverse()
  // 返回 `recoverOrphanedParallelToolResults(messages, transcript, seen)`，作为共享工具这次计算的结果。
  return recoverOrphanedParallelToolResults(messages, transcript, seen)
}

/**
 * Post-pass for buildConversationChain: recover sibling assistant blocks and
 * tool_results that the single-parent walk orphaned.
 *
 * Streaming (claude.ts:~2024) emits one AssistantMessage per content_block_stop
 * — N parallel tool_uses → N messages, distinct uuid, same message.id. Each
 * tool_result's sourceToolAssistantUUID points to its own one-block assistant,
 * so insertMessageChain's override (line ~894) writes each TR's parentUuid to a
 * DIFFERENT assistant. The topology is a DAG; the walk above is a linked-list
 * traversal and keeps only one branch.
 *
 * Two loss modes observed in production (both fixed here):
 *   1. Sibling assistant orphaned: walk goes prev→asstA→TR_A→next, drops asstB
 *      (same message.id, chained off asstA) and TR_B.
 *   2. Progress-fork (legacy, pre-#23537): each tool_use asst had a progress
 *      child (continued the write chain) AND a TR child. Walk followed
 *      progress; TRs were dropped. No longer written (progress removed from
 *      transcript persistence), but old transcripts still have this shape.
 *
 * Read-side fix: the write topology is already on disk for old transcripts;
 * this recovery pass handles them.
 */
// recoverOrphanedParallelToolResults 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function recoverOrphanedParallelToolResults(
  messages: Map<UUID, TranscriptMessage>,
  chain: TranscriptMessage[],
  seen: Set<UUID>,
): TranscriptMessage[] {
  // ChainAssistant 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
  type ChainAssistant = Extract<TranscriptMessage, { type: 'assistant' }>
  // chainAssistants 集合筛选`chain.filter`，供共享工具后续处理使用。
  const chainAssistants = chain.filter(
    (m): m is ChainAssistant => m.type === 'assistant',
  )
  // chainAssistants 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (chainAssistants.length === 0) return chain

  // Anchor = last on-chain member of each sibling group. chainAssistants is
  // already in chain order, so later iterations overwrite → last wins.
  // anchorByMsgId 命名 `new Map<string, ChainAssistant>()`，让后续代码直接表达这个值的用途。
  const anchorByMsgId = new Map<string, ChainAssistant>()
  // 按顺序遍历 `chainAssistants` 中的a，逐个交给共享工具处理。
  for (const a of chainAssistants) {
    // 满足 `a.message.id) anchorByMsgId.set(a.message.id, a` 时，共享工具执行该分支。
    if (a.message.id) anchorByMsgId.set(a.message.id, a)
  }

  // O(n) precompute: sibling groups and TR index.
  // TRs indexed by parentUuid — insertMessageChain:~894 already wrote that
  // as the srcUUID, and --fork-session strips srcUUID but keeps parentUuid.
  // siblingsByMsgId构建`new Map<string, TranscriptMessage[]>()`，供后续判断或组装使用。
  const siblingsByMsgId = new Map<string, TranscriptMessage[]>()
  // toolResultsByAsst 命名 `new Map<UUID, TranscriptMessage[]>()`，让后续代码直接表达这个值的用途。
  const toolResultsByAsst = new Map<UUID, TranscriptMessage[]>()
  // 逐项读取 `messages.values()` 中的m，按输入顺序推进共享工具。
  for (const m of messages.values()) {
    // 只有 `m.type === 'assistant' && m.message.id` 满足时，共享工具才执行该分支。
    if (m.type === 'assistant' && m.message.id) {
      // group读取`siblingsByMsgId.get`，供共享工具后续处理使用。
      const group = siblingsByMsgId.get(m.message.id)
      // 满足 `group) group.push(m` 时，共享工具执行该分支。
      if (group) group.push(m)
      else siblingsByMsgId.set(m.message.id, [m])
    // 共享工具 session Storage在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      m.type === 'user' &&
      m.parentUuid &&
      Array.isArray(m.message.content) &&
      // 调用 m.message.content.some，触发共享工具此处需要的副作用。
      m.message.content.some(b => b.type === 'tool_result')
    ) {
      // group读取`toolResultsByAsst.get`，供共享工具后续处理使用。
      const group = toolResultsByAsst.get(m.parentUuid)
      // 满足 `group) group.push(m` 时，共享工具执行该分支。
      if (group) group.push(m)
      else toolResultsByAsst.set(m.parentUuid, [m])
    }
  }

  // For each message.id group touching the chain: collect off-chain siblings,
  // then off-chain TRs for ALL members. Splice right after the last on-chain
  // member so the group stays contiguous for normalizeMessagesForAPI's merge
  // and every TR lands after its tool_use.
  // processedGroups 集合构建`new Set<string>()`，供后续判断或组装使用。
  const processedGroups = new Set<string>()
  // inserts 集合 命名 `new Map<UUID, TranscriptMessage[]>()`，让后续代码直接表达这个值的用途。
  const inserts = new Map<UUID, TranscriptMessage[]>()
  // recoveredCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let recoveredCount = 0
  // 按顺序遍历 `chainAssistants` 中的asst，逐个交给共享工具处理。
  for (const asst of chainAssistants) {
    // msgId保存`asst.message.id`，供共享工具 session Storage后续判断或输出使用。
    const msgId = asst.message.id
    // 只有 `!msgId || processedGroups.has(msgId)` 满足时，共享工具才执行该分支。
    if (!msgId || processedGroups.has(msgId)) continue
    // 调用 processedGroups.add，触发共享工具此处需要的副作用。
    processedGroups.add(msgId)

    // group读取`siblingsByMsgId.get`，供共享工具后续处理使用。
    const group = siblingsByMsgId.get(msgId) ?? [asst]
    // orphanedSiblings 集合筛选`group.filter`，供共享工具后续处理使用。
    const orphanedSiblings = group.filter(s => !seen.has(s.uuid))
    // orphanedTRs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const orphanedTRs: TranscriptMessage[] = []
    // 按顺序遍历 `group` 中的member，逐个交给共享工具处理。
    for (const member of group) {
      // trs 集合读取`toolResultsByAsst.get`，供共享工具后续处理使用。
      const trs = toolResultsByAsst.get(member.uuid)
      // trs 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!trs) continue
      // 按顺序遍历 `trs` 中的tr，逐个交给共享工具处理。
      for (const tr of trs) {
        // 满足 `!seen.has(tr.uuid)) orphanedTRs.push(tr` 时，共享工具执行该分支。
        if (!seen.has(tr.uuid)) orphanedTRs.push(tr)
      }
    }
    // orphanedSiblings.length === 0 &... 数量为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (orphanedSiblings.length === 0 && orphanedTRs.length === 0) continue

    // Timestamp sort keeps content-block / completion order; stable-sort
    // preserves JSONL write order on ties.
    // 调用 orphanedSiblings.sort，触发共享工具此处需要的副作用。
    orphanedSiblings.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    // 调用 orphanedTRs.sort，触发共享工具此处需要的副作用。
    orphanedTRs.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // anchor读取`anchorByMsgId.get`，供共享工具后续处理使用。
    const anchor = anchorByMsgId.get(msgId)!
    // recovered 聚合成有序列表，保持后续遍历顺序稳定。
    const recovered = [...orphanedSiblings, ...orphanedTRs]
    // 逐项读取 `recovered) seen.add(r.uuid` 中的r，按输入顺序推进共享工具。
    for (const r of recovered) seen.add(r.uuid)
    // 共享工具 session Storage在这里处理 `recoveredCount += recovered.length`，完成这一小步状态转换。
    recoveredCount += recovered.length
    // inserts.set 写入新的状态值，使共享工具后续读取保持一致。
    inserts.set(anchor.uuid, recovered)
  }

  // 满足 `recoveredCount === 0` 时，共享工具执行该分支。
  if (recoveredCount === 0) return chain
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_chain_parallel_tr_recovered', {
    recovered_count: recoveredCount,
  })

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: TranscriptMessage[] = []
  // 按顺序遍历 `chain` 中的m，逐个交给共享工具处理。
  for (const m of chain) {
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(m)
    // toInsert读取`inserts.get`，供共享工具后续处理使用。
    const toInsert = inserts.get(m.uuid)
    // 满足 `toInsert) result.push(...toInsert` 时，共享工具执行该分支。
    if (toInsert) result.push(...toInsert)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Find the latest turn_duration checkpoint in the reconstructed chain and
 * compare its recorded messageCount against the chain's position at that
 * point. Emits tengu_resume_consistency_delta for BigQuery monitoring of
 * write→load round-trip drift — the class of bugs where snip/compact/
 * parallel-TR operations mutate in-memory but the parentUuid walk on disk
 * reconstructs a different set (adamr-20260320-165831: 397K displayed →
 * 1.65M actual on resume).
 *
 * delta > 0: resume loaded MORE than in-session (the usual failure mode)
 * delta < 0: resume loaded FEWER (chain truncation — #22453 class)
 * delta = 0: round-trip consistent
 *
 * Called from loadConversationForResume — fires once per resume, not on
 * /share or log-listing chain rebuilds.
 */
// checkResumeConsistency 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkResumeConsistency(chain: Message[]): void {
  // 循环处理 `let i = chain.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = chain.length - 1; i >= 0; i--) {
    // m 命名 `chain[i]!`，让后续代码直接表达这个值的用途。
    const m = chain[i]!
    // `m.type` 与 `'system' || m.subtype !== 'turn...` 不一致时刷新派生状态，避免使用过期结果。
    if (m.type !== 'system' || m.subtype !== 'turn_duration') continue
    // expected保存`m.messageCount`，供共享工具 session Storage后续判断或输出使用。
    const expected = m.messageCount
    // 满足 `expected === undefined` 时，共享工具执行该分支。
    if (expected === undefined) return
    // `i` is the 0-based index of the checkpoint in the reconstructed chain.
    // The checkpoint was appended AFTER messageCount messages, so its own
    // position should be messageCount (i.e., i === expected).
    // actual 命名 `i`，让后续代码直接表达这个值的用途。
    const actual = i
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_resume_consistency_delta', {
      expected,
      actual,
      delta: actual - expected,
      chain_length: chain.length,
      checkpoint_age_entries: chain.length - 1 - i,
    })
    // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
}

/**
 * Builds a filie history snapshot chain from the conversation
 */
// buildFileHistorySnapshotChain 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildFileHistorySnapshotChain(
  fileHistorySnapshots: Map<UUID, FileHistorySnapshotMessage>,
  conversation: TranscriptMessage[],
): FileHistorySnapshot[] {
  // snapshots 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const snapshots: FileHistorySnapshot[] = []
  // messageId → last index in snapshots[] for O(1) update lookup
  // indexByMessageId 消息数据构建`new Map<string, number>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const indexByMessageId = new Map<string, number>()
  // 按顺序遍历 `conversation` 中的消息，逐个交给共享工具处理。
  for (const message of conversation) {
    // snapshotMessage 消息数据读取`fileHistorySnapshots.get`，供共享工具后续处理使用。
    const snapshotMessage = fileHistorySnapshots.get(message.uuid)
    // snapshotMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!snapshotMessage) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 从 `snapshotMessage` 解构 snapshot、isSnapshotUpdate，减少共享工具 session Storage对同一对象的重复访问。
    const { snapshot, isSnapshotUpdate } = snapshotMessage
    // existingIndex 索引保存`isSnapshotUpdate`，供后续判断或组装使用。
    const existingIndex = isSnapshotUpdate
      ? indexByMessageId.get(snapshot.messageId)
      : undefined
    // 满足 `existingIndex === undefined` 时，共享工具执行该分支。
    if (existingIndex === undefined) {
      // indexByMessageId.set 写入新的状态值，使共享工具后续读取保持一致。
      indexByMessageId.set(snapshot.messageId, snapshots.length)
      // snapshots 集合追加新条目，保持收集顺序与输入顺序一致。
      snapshots.push(snapshot)
    } else {
      // snapshots[existingIndex 索引更新为 `snapshot`，确保共享工具 session Storage后续读取最新状态。
      snapshots[existingIndex] = snapshot
    }
  }
  // 返回 `snapshots`，作为共享工具这次计算的结果。
  return snapshots
}

/**
 * Builds an attribution snapshot chain from the conversation.
 * Unlike file history snapshots, attribution snapshots are returned in full
 * because they use generated UUIDs (not message UUIDs) and represent
 * cumulative state that should be restored on session resume.
 */
// buildAttributionSnapshotChain 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildAttributionSnapshotChain(
  attributionSnapshots: Map<UUID, AttributionSnapshotMessage>,
  _conversation: TranscriptMessage[],
): AttributionSnapshotMessage[] {
  // Return all attribution snapshots - they will be merged during restore
  // 返回 `Array.from(attributionSnapshots.values())`，作为共享工具这次计算的结果。
  return Array.from(attributionSnapshots.values())
}

/**
 * Loads a transcript from a JSON or JSONL file and converts it to LogOption format
 * @param filePath Path to the transcript file (.json or .jsonl)
 * @returns LogOption containing the transcript messages
 * @throws Error if file doesn't exist or contains invalid data
 */
// loadTranscriptFromFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadTranscriptFromFile(
  filePath: string,
): Promise<LogOption> {
  // 满足 `filePath.endsWith('.jsonl')` 时，共享工具执行该分支。
  if (filePath.endsWith('.jsonl')) {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      messages,
      summaries,
      customTitles,
      tags,
      fileHistorySnapshots,
      attributionSnapshots,
      contextCollapseCommits,
      contextCollapseSnapshot,
      leafUuids,
      contentReplacements,
      worktreeStates,
    } = await loadTranscriptFile(filePath)

    // 满足 `messages.size === 0` 时，共享工具执行该分支。
    if (messages.size === 0) {
      // 抛出 new Error('No messages found in JSONL file')，阻止共享工具在无效状态下继续运行。
      throw new Error('No messages found in JSONL file')
    }

    // Find the most recent leaf message using pre-computed leaf UUIDs
    // leafMessage 消息数据筛选`findLatestMessage`，供共享工具后续处理使用。
    const leafMessage = findLatestMessage(messages.values(), msg =>
      leafUuids.has(msg.uuid),
    )

    // leafMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!leafMessage) {
      // 抛出 new Error('No valid conversation chain found in JSONL file')，阻止共享工具在无效状态下继续运行。
      throw new Error('No valid conversation chain found in JSONL file')
    }

    // Build the conversation chain backwards from leaf to root
    // transcript构建`buildConversationChain`，供共享工具后续处理使用。
    const transcript = buildConversationChain(messages, leafMessage)

    // summary读取`summaries.get`，供共享工具后续处理使用。
    const summary = summaries.get(leafMessage.uuid)
    // customTitle 标题读取`customTitles.get`，供共享工具后续处理使用。
    const customTitle = customTitles.get(leafMessage.sessionId as UUID)
    // tag读取`tags.get`，供共享工具后续处理使用。
    const tag = tags.get(leafMessage.sessionId as UUID)
    // sessionId 会话数据保存`leafMessage.sessionId as UUID`，供共享工具 session Storage后续判断或输出使用。
    const sessionId = leafMessage.sessionId as UUID
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...convertToLogOption(
        transcript,
        0,
        summary,
        customTitle,
        buildFileHistorySnapshotChain(fileHistorySnapshots, transcript),
        tag,
        filePath,
        buildAttributionSnapshotChain(attributionSnapshots, transcript),
        undefined,
        contentReplacements.get(sessionId) ?? [],
      ),
      contextCollapseCommits: contextCollapseCommits.filter(
        // e更新为 `> e.sessionId === sessionId`，确保共享工具后续读取最新状态。
        e => e.sessionId === sessionId,
      ),
      contextCollapseSnapshot:
        contextCollapseSnapshot?.sessionId === sessionId
          ? contextCollapseSnapshot
          : undefined,
      worktreeSession: worktreeStates.has(sessionId)
        ? worktreeStates.get(sessionId)
        : undefined,
    }
  }

  // json log files
  // 文本内容读取`readFile`，供共享工具后续处理使用。
  const content = await readFile(filePath, { encoding: 'utf-8' })
  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(content)`，确保共享工具后续读取最新状态。
    parsed = jsonParse(content)
  } catch (error) {
    // 抛出 new Error(`Invalid JSON in transcript file: ${error}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid JSON in transcript file: ${error}`)
  }

  // 对话消息 先占位，稍后的条件分支会根据实际输入补齐它。
  let messages: TranscriptMessage[]

  // 满足 `Array.isArray(parsed)` 时，共享工具执行该分支。
  if (Array.isArray(parsed)) {
    // 对话消息更新为 `parsed`，确保共享工具后续读取最新状态。
    messages = parsed
  // 共享工具 session Storage在这里处理 `} else if (parsed && typeof parsed === 'object' && 'messages' in parsed...`，完成这一小步状态转换。
  } else if (parsed && typeof parsed === 'object' && 'messages' in parsed) {
    // 满足 `!Array.isArray(parsed.messages)` 时，共享工具执行该分支。
    if (!Array.isArray(parsed.messages)) {
      // 抛出 new Error('Transcript messages must be an array')，阻止共享工具在无效状态下继续运行。
      throw new Error('Transcript messages must be an array')
    }
    // 对话消息更新为 `parsed.messages`，确保共享工具后续读取最新状态。
    messages = parsed.messages
  } else {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'Transcript must be an array of messages or an object with a messages array',
    )
  }

  // 返回 `convertToLogOption(`，作为共享工具这次计算的结果。
  return convertToLogOption(
    messages,
    0,
    undefined,
    undefined,
    undefined,
    undefined,
    filePath,
  )
}

/**
 * Checks if a user message has visible content (text or image, not just tool_result).
 * Tool results are displayed as part of collapsed groups, not as standalone messages.
 * Also excludes meta messages which are not shown to the user.
 */
// hasVisibleUserContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasVisibleUserContent(message: TranscriptMessage): boolean {
  // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'user') return false

  // Meta messages are not shown to the user
  // 满足 `message.isMeta` 时，共享工具执行该分支。
  if (message.isMeta) return false

  // 文本内容保存`message.message?.content`，供共享工具 session Storage后续判断或输出使用。
  const content = message.message?.content
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return false

  // String content is always visible
  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') {
    // 返回 `content.trim().length > 0`，作为共享工具这次计算的结果。
    return content.trim().length > 0
  }

  // Array content: check for text or image blocks (not tool_result)
  // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
  if (Array.isArray(content)) {
    // 返回 `content.some(`，作为共享工具这次计算的结果。
    return content.some(
      // block更新为 `>`，确保共享工具后续读取最新状态。
      block =>
        block.type === 'text' ||
        block.type === 'image' ||
        block.type === 'document',
    )
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if an assistant message has visible text content (not just tool_use blocks).
 * Tool uses are displayed as grouped/collapsed UI elements, not as standalone messages.
 */
// hasVisibleAssistantContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasVisibleAssistantContent(message: TranscriptMessage): boolean {
  // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'assistant') return false

  // 文本内容保存`message.message?.content`，供共享工具 session Storage后续判断或输出使用。
  const content = message.message?.content
  // 只有 `!content || !Array.isArray(content)` 满足时，共享工具才执行该分支。
  if (!content || !Array.isArray(content)) return false

  // Check for text block (not just tool_use/thinking blocks)
  // 返回 `content.some(`，作为共享工具这次计算的结果。
  return content.some(
    // block更新为 `>`，确保共享工具后续读取最新状态。
    block =>
      block.type === 'text' &&
      typeof block.text === 'string' &&
      block.text.trim().length > 0,
  )
}

/**
 * Counts visible messages that would appear as conversation turns in the UI.
 * Excludes:
 * - System, attachment, and progress messages
 * - User messages with isMeta flag (hidden from user)
 * - User messages that only contain tool_result blocks (displayed as collapsed groups)
 * - Assistant messages that only contain tool_use blocks (displayed as collapsed groups)
 */
// countVisibleMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countVisibleMessages(transcript: TranscriptMessage[]): number {
  // count 数量保存`0`，供共享工具 session Storage后续判断或输出使用。
  let count = 0
  // 按顺序遍历 `transcript` 中的消息，逐个交给共享工具处理。
  for (const message of transcript) {
    // 按照 message.type 的取值选择共享工具的具体处理分支。
    switch (message.type) {
      case 'user':
        // Count user messages with visible content (text, image, not just tool_result or meta)
        // 满足 `hasVisibleUserContent(message)` 时，共享工具执行该分支。
        if (hasVisibleUserContent(message)) {
          // 共享工具 session Storage在这里处理 `count++`，完成这一小步状态转换。
          count++
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'assistant':
        // Count assistant messages with text content (not just tool_use)
        // 满足 `hasVisibleAssistantContent(message)` 时，共享工具执行该分支。
        if (hasVisibleAssistantContent(message)) {
          // 共享工具 session Storage在这里处理 `count++`，完成这一小步状态转换。
          count++
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'attachment':
      case 'system':
      case 'progress':
        // These message types are not counted as visible conversation turns
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

// convertToLogOption 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertToLogOption(
  transcript: TranscriptMessage[],
  value: number = 0,
  summary?: string,
  customTitle?: string,
  fileHistorySnapshots?: FileHistorySnapshot[],
  tag?: string,
  fullPath?: string,
  attributionSnapshots?: AttributionSnapshotMessage[],
  agentSetting?: string,
  contentReplacements?: ContentReplacementRecord[],
): LogOption {
  // lastMessage 消息数据保存`transcript.at`，供共享工具后续处理使用。
  const lastMessage = transcript.at(-1)!
  // firstMessage 消息数据保存`transcript[0]!`，供共享工具 session Storage后续判断或输出使用。
  const firstMessage = transcript[0]!

  // Get the first user message for the prompt
  // firstPrompt保存`extractFirstPrompt`，供共享工具后续处理使用。
  const firstPrompt = extractFirstPrompt(transcript)

  // Create timestamps from message timestamps
  // created记录时间`Date`，供共享工具后续处理使用。
  const created = new Date(firstMessage.timestamp)
  // modified记录时间`Date`，供共享工具后续处理使用。
  const modified = new Date(lastMessage.timestamp)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    date: lastMessage.timestamp,
    messages: removeExtraFields(transcript),
    fullPath,
    value,
    created,
    modified,
    firstPrompt,
    messageCount: countVisibleMessages(transcript),
    isSidechain: firstMessage.isSidechain,
    teamName: firstMessage.teamName,
    agentName: firstMessage.agentName,
    agentSetting,
    leafUuid: lastMessage.uuid,
    summary,
    customTitle,
    tag,
    fileHistorySnapshots: fileHistorySnapshots,
    attributionSnapshots: attributionSnapshots,
    contentReplacements,
    gitBranch: lastMessage.gitBranch,
    projectPath: firstMessage.cwd,
  }
}

// trackSessionBranchingAnalytics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function trackSessionBranchingAnalytics(
  logs: LogOption[],
): Promise<void> {
  // sessionIdCounts 会话数据构建`new Map<string, number>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const sessionIdCounts = new Map<string, number>()
  // maxCount 数量保存`0`，供共享工具 session Storage后续判断或输出使用。
  let maxCount = 0
  // 按顺序遍历 `logs` 中的log，逐个交给共享工具处理。
  for (const log of logs) {
    // sessionId 会话数据读取`getSessionIdFromLog`，供共享工具后续处理使用。
    const sessionId = getSessionIdFromLog(log)
    // 满足 `sessionId` 时，共享工具执行该分支。
    if (sessionId) {
      // newCount 数量读取`sessionIdCounts.get`，供共享工具后续处理使用。
      const newCount = (sessionIdCounts.get(sessionId) || 0) + 1
      // sessionIdCounts.set 写入新的状态值，使共享工具后续读取保持一致。
      sessionIdCounts.set(sessionId, newCount)
      // maxCount 数量更新为 `Math.max(newCount, maxCount)`，确保共享工具后续读取最新状态。
      maxCount = Math.max(newCount, maxCount)
    }
  }

  // Early exit if no duplicates detected
  // 满足 `maxCount <= 1` 时，共享工具执行该分支。
  if (maxCount <= 1) {
    // 共享工具 session Storage在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Count sessions with branches and calculate stats using functional approach
  // branchCounts 数量保存`Array.from`，供共享工具后续处理使用。
  const branchCounts = Array.from(sessionIdCounts.values()).filter(c => c > 1)
  // sessionsWithBranches 会话数据 命名 `branchCounts.length`，让后续代码直接表达这个值的用途。
  const sessionsWithBranches = branchCounts.length
  // totalBranches 集合派生`branchCounts.reduce`，供共享工具后续处理使用。
  const totalBranches = branchCounts.reduce((sum, count) => sum + count, 0)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_forked_branches_fetched', {
    total_sessions: sessionIdCounts.size,
    sessions_with_branches: sessionsWithBranches,
    max_branches_per_session: Math.max(...branchCounts),
    avg_branches_per_session: Math.round(totalBranches / sessionsWithBranches),
    total_transcript_count: logs.length,
  })
}

// fetchLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchLogs(limit?: number): Promise<LogOption[]> {
  // projectDir读取`getProjectDir`，供共享工具后续处理使用。
  const projectDir = getProjectDir(getOriginalCwd())
  // logs 集合读取`getSessionFilesLite`，供共享工具后续处理使用。
  const logs = await getSessionFilesLite(projectDir, limit, getOriginalCwd())

  // 等待 `trackSessionBranchingAnalytics(logs)` 完成，再继续共享工具 session Storage的异步流程。
  await trackSessionBranchingAnalytics(logs)

  // 返回 `logs`，作为共享工具这次计算的结果。
  return logs
}

/**
 * Append an entry to a session file. Creates the parent dir if missing.
 */
/* eslint-disable custom-rules/no-sync-fs -- sync callers (exit cleanup, materialize) */
// appendEntryToFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function appendEntryToFile(
  fullPath: string,
  entry: Record<string, unknown>,
): void {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // line保存`jsonStringify`，供共享工具后续处理使用。
  const line = jsonStringify(entry) + '\n'
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
    fs.appendFileSync(fullPath, line, { mode: 0o600 })
  } catch {
    // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
    fs.mkdirSync(dirname(fullPath), { mode: 0o700 })
    // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
    fs.appendFileSync(fullPath, line, { mode: 0o600 })
  }
}

/**
 * Sync tail read for reAppendSessionMetadata's external-writer check.
 * fstat on the already-open fd (no extra path lookup); reads the same
 * LITE_READ_BUF_SIZE window that readLiteMetadata scans. Returns empty
 * string on any error so callers fall through to unconditional behavior.
 */
// readFileTailSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readFileTailSync(fullPath: string): string {
  // fd 先占位，稍后的条件分支会根据实际输入补齐它。
  let fd: number | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fd更新为 `openSync(fullPath, 'r')`，确保共享工具后续读取最新状态。
    fd = openSync(fullPath, 'r')
    // st保存`fstatSync`，供共享工具后续处理使用。
    const st = fstatSync(fd)
    // tailOffset保存`Math.max`，供共享工具后续处理使用。
    const tailOffset = Math.max(0, st.size - LITE_READ_BUF_SIZE)
    // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
    const buf = Buffer.allocUnsafe(
      Math.min(LITE_READ_BUF_SIZE, st.size - tailOffset),
    )
    // bytesRead读取`readSync`，供共享工具后续处理使用。
    const bytesRead = readSync(fd, buf, 0, buf.length, tailOffset)
    // 返回 `buf.toString('utf8', 0, bytesRead)`，作为共享工具这次计算的结果。
    return buf.toString('utf8', 0, bytesRead)
  } catch {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  } finally {
    // `fd` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (fd !== undefined) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 closeSync，触发共享工具此处需要的副作用。
        closeSync(fd)
      } catch {
        // closeSync can throw; swallow to preserve return '' contract
      }
    }
  }
}
/* eslint-enable custom-rules/no-sync-fs */

// saveCustomTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveCustomTitle(
  sessionId: UUID,
  customTitle: string,
  fullPath?: string,
  source: 'user' | 'auto' = 'user',
) {
  // Fall back to computed path if fullPath is not provided
  // resolvedPath 路径数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
  const resolvedPath = fullPath ?? getTranscriptPathForSession(sessionId)
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(resolvedPath, {
    type: 'custom-title',
    customTitle,
    sessionId,
  })
  // Cache for current session only (for immediate visibility)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 调用 getProject，触发共享工具此处需要的副作用。
    getProject().currentSessionTitle = customTitle
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_renamed', {
    source:
      source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

/**
 * Persist an AI-generated title to the JSONL as a distinct `ai-title` entry.
 *
 * Writing a separate entry type (vs. reusing `custom-title`) is load-bearing:
 * - Read preference: readers prefer `customTitle` field over `aiTitle`, so
 *   a user rename always wins regardless of append order.
 * - Resume safety: `loadTranscriptFile` only populates the `customTitles`
 *   Map from `custom-title` entries, so `restoreSessionMetadata` never
 *   caches an AI title and `reAppendSessionMetadata` never re-appends one
 *   at EOF — avoiding the clobber-on-resume bug where a stale AI title
 *   overwrites a mid-session user rename.
 * - CAS semantics: VS Code's `onlyIfNoCustomTitle` check scans for the
 *   `customTitle` field only, so AI can overwrite its own previous AI
 *   title but never a user title.
 * - Metrics: `tengu_session_renamed` is not fired for AI titles.
 *
 * Because the entry is never re-appended, it scrolls out of the 64KB tail
 * window once enough messages accumulate. Readers (`readLiteMetadata`,
 * `listSessionsImpl`, VS Code `fetchSessions`) fall back to scanning the
 * head buffer for `aiTitle` in that case. Both head and tail reads are
 * bounded (64KB each via `extractLastJsonStringField`), never a full scan.
 *
 * Callers with a stale-write guard (e.g., VS Code client) should prefer
 * passing `persist: false` to the SDK control request and persisting
 * through their own rename path after the guard passes, to avoid a race
 * where the AI title lands after a mid-flight user rename.
 */
// saveAiGeneratedTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveAiGeneratedTitle(sessionId: UUID, aiTitle: string): void {
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(getTranscriptPathForSession(sessionId), {
    type: 'ai-title',
    aiTitle,
    sessionId,
  })
}

/**
 * Append a periodic task summary for `claude ps`. Unlike ai-title this is
 * not re-appended by reAppendSessionMetadata — it's a rolling snapshot of
 * what the agent is doing *now*, so staleness is fine; ps reads the most
 * recent one from the tail.
 */
// saveTaskSummary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveTaskSummary(sessionId: UUID, summary: string): void {
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(getTranscriptPathForSession(sessionId), {
    type: 'task-summary',
    summary,
    sessionId,
    timestamp: new Date().toISOString(),
  })
}

// saveTag 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveTag(sessionId: UUID, tag: string, fullPath?: string) {
  // Fall back to computed path if fullPath is not provided
  // resolvedPath 路径数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
  const resolvedPath = fullPath ?? getTranscriptPathForSession(sessionId)
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(resolvedPath, { type: 'tag', tag, sessionId })
  // Cache for current session only (for immediate visibility)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 调用 getProject，触发共享工具此处需要的副作用。
    getProject().currentSessionTag = tag
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_tagged', {})
}

/**
 * Link a session to a GitHub pull request.
 * This stores the PR number, URL, and repository for tracking and navigation.
 */
// linkSessionToPR 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function linkSessionToPR(
  sessionId: UUID,
  prNumber: number,
  prUrl: string,
  prRepository: string,
  fullPath?: string,
): Promise<void> {
  // resolvedPath 路径数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
  const resolvedPath = fullPath ?? getTranscriptPathForSession(sessionId)
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(resolvedPath, {
    type: 'pr-link',
    sessionId,
    prNumber,
    prUrl,
    prRepository,
    timestamp: new Date().toISOString(),
  })
  // Cache for current session so reAppendSessionMetadata can re-write after compaction
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // project读取`getProject`，供共享工具后续处理使用。
    const project = getProject()
    // currentSessionPrNumber 会话数据更新为 `prNumber`，确保共享工具后续读取最新状态。
    project.currentSessionPrNumber = prNumber
    // currentSessionPrUrl 会话数据更新为 `prUrl`，确保共享工具后续读取最新状态。
    project.currentSessionPrUrl = prUrl
    // currentSessionPrRepository 会话数据更新为 `prRepository`，确保共享工具后续读取最新状态。
    project.currentSessionPrRepository = prRepository
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_linked_to_pr', { prNumber })
}

// getCurrentSessionTag 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentSessionTag(sessionId: UUID): string | undefined {
  // Only returns tag for current session (the only one we cache)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 返回 `getProject().currentSessionTag`，作为共享工具这次计算的结果。
    return getProject().currentSessionTag
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// getCurrentSessionTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentSessionTitle(
  sessionId: SessionId,
): string | undefined {
  // Only returns title for current session (the only one we cache)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 返回 `getProject().currentSessionTitle`，作为共享工具这次计算的结果。
    return getProject().currentSessionTitle
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// getCurrentSessionAgentColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentSessionAgentColor(): string | undefined {
  // 返回 `getProject().currentSessionAgentColor`，作为共享工具这次计算的结果。
  return getProject().currentSessionAgentColor
}

/**
 * Restore session metadata into in-memory cache on resume.
 * Populates the cache so metadata is available for display (e.g. the
 * agent banner) and re-appended on session exit via reAppendSessionMetadata.
 */
// restoreSessionMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreSessionMetadata(meta: {
  customTitle?: string
  tag?: string
  agentName?: string
  agentColor?: string
  agentSetting?: string
  mode?: 'coordinator' | 'normal'
  worktreeSession?: PersistedWorktreeSession | null
  prNumber?: number
  prUrl?: string
  prRepository?: string
}): void {
  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()
  // ??= so --name (cacheSessionTitle) wins over the resumed
  // session's title. REPL.tsx clears before calling, so /resume is unaffected.
  // 满足 `meta.customTitle` 时，共享工具执行该分支。
  if (meta.customTitle) project.currentSessionTitle ??= meta.customTitle
  // `meta.tag` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (meta.tag !== undefined) project.currentSessionTag = meta.tag || undefined
  // 满足 `meta.agentName` 时，共享工具执行该分支。
  if (meta.agentName) project.currentSessionAgentName = meta.agentName
  // 满足 `meta.agentColor` 时，共享工具执行该分支。
  if (meta.agentColor) project.currentSessionAgentColor = meta.agentColor
  // 满足 `meta.agentSetting` 时，共享工具执行该分支。
  if (meta.agentSetting) project.currentSessionAgentSetting = meta.agentSetting
  // 满足 `meta.mode` 时，共享工具执行该分支。
  if (meta.mode) project.currentSessionMode = meta.mode
  // `meta.worktreeSession` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (meta.worktreeSession !== undefined)
    // currentSessionWorktree 会话数据更新为 `meta.worktreeSession`，确保共享工具后续读取最新状态。
    project.currentSessionWorktree = meta.worktreeSession
  // `meta.prNumber` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (meta.prNumber !== undefined)
    // currentSessionPrNumber 会话数据更新为 `meta.prNumber`，确保共享工具后续读取最新状态。
    project.currentSessionPrNumber = meta.prNumber
  // 满足 `meta.prUrl` 时，共享工具执行该分支。
  if (meta.prUrl) project.currentSessionPrUrl = meta.prUrl
  // 满足 `meta.prRepository` 时，共享工具执行该分支。
  if (meta.prRepository) project.currentSessionPrRepository = meta.prRepository
}

/**
 * Clear all cached session metadata (title, tag, agent name/color).
 * Called when /clear creates a new session so stale metadata
 * from the previous session does not leak into the new one.
 */
// clearSessionMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionMetadata(): void {
  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()
  // currentSessionTitle 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionTitle = undefined
  // currentSessionTag 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionTag = undefined
  // currentSessionAgentName 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionAgentName = undefined
  // currentSessionAgentColor 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionAgentColor = undefined
  // currentSessionLastPrompt 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionLastPrompt = undefined
  // currentSessionAgentSetting 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionAgentSetting = undefined
  // currentSessionMode 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionMode = undefined
  // currentSessionWorktree 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionWorktree = undefined
  // currentSessionPrNumber 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionPrNumber = undefined
  // currentSessionPrUrl 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionPrUrl = undefined
  // currentSessionPrRepository 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  project.currentSessionPrRepository = undefined
}

/**
 * Re-append cached session metadata (custom title, tag) to the end of the
 * transcript file. Call this after compaction so the metadata stays within
 * the 16KB tail window that readLiteMetadata reads during progressive loading.
 * Without this, enough post-compaction messages can push the metadata entry
 * out of the window, causing `--resume` to show the auto-generated firstPrompt
 * instead of the user-set session name.
 */
// reAppendSessionMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function reAppendSessionMetadata(): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().reAppendSessionMetadata()
}

// saveAgentName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveAgentName(
  sessionId: UUID,
  agentName: string,
  fullPath?: string,
  source: 'user' | 'auto' = 'user',
) {
  // resolvedPath 路径数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
  const resolvedPath = fullPath ?? getTranscriptPathForSession(sessionId)
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(resolvedPath, { type: 'agent-name', agentName, sessionId })
  // Cache for current session only (for immediate visibility)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 调用 getProject，触发共享工具此处需要的副作用。
    getProject().currentSessionAgentName = agentName
    // 显式忽略 `updateSessionName(agentName)` 的返回值，只保留它触发的副作用。
    void updateSessionName(agentName)
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_agent_name_set', {
    source:
      source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

// saveAgentColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveAgentColor(
  sessionId: UUID,
  agentColor: string,
  fullPath?: string,
) {
  // resolvedPath 路径数据读取`getTranscriptPathForSession`，供共享工具后续处理使用。
  const resolvedPath = fullPath ?? getTranscriptPathForSession(sessionId)
  // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
  appendEntryToFile(resolvedPath, {
    type: 'agent-color',
    agentColor,
    sessionId,
  })
  // Cache for current session only (for immediate visibility)
  // 满足 `sessionId === getSessionId()` 时，共享工具执行该分支。
  if (sessionId === getSessionId()) {
    // 调用 getProject，触发共享工具此处需要的副作用。
    getProject().currentSessionAgentColor = agentColor
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_agent_color_set', {})
}

/**
 * Cache the session agent setting. Written to disk by materializeSessionFile
 * on the first user message, and re-stamped by reAppendSessionMetadata on exit.
 * Cache-only here to avoid creating metadata-only session files at startup.
 */
// saveAgentSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveAgentSetting(agentSetting: string): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().currentSessionAgentSetting = agentSetting
}

/**
 * Cache a session title set at startup (--name). Written to disk by
 * materializeSessionFile on the first user message. Cache-only here so no
 * orphan metadata-only file is created before the session ID is finalized.
 */
// cacheSessionTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cacheSessionTitle(customTitle: string): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().currentSessionTitle = customTitle
}

/**
 * Cache the session mode. Written to disk by materializeSessionFile on the
 * first user message, and re-stamped by reAppendSessionMetadata on exit.
 * Cache-only here to avoid creating metadata-only session files at startup.
 */
// saveMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveMode(mode: 'coordinator' | 'normal'): void {
  // 调用 getProject，触发共享工具此处需要的副作用。
  getProject().currentSessionMode = mode
}

/**
 * Record the session's worktree state for --resume. Written to disk by
 * materializeSessionFile on the first user message and re-stamped by
 * reAppendSessionMetadata on exit. Pass null when exiting a worktree
 * so --resume knows not to cd back into it.
 */
// saveWorktreeState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveWorktreeState(
  worktreeSession: PersistedWorktreeSession | null,
): void {
  // Strip ephemeral fields (creationDurationMs, usedSparsePaths) that callers
  // may pass via full WorktreeSession objects — TypeScript structural typing
  // allows this, but we don't want them serialized to the transcript.
  // stripped保存`worktreeSession`，供后续判断或组装使用。
  const stripped: PersistedWorktreeSession | null = worktreeSession
    ? {
        originalCwd: worktreeSession.originalCwd,
        worktreePath: worktreeSession.worktreePath,
        worktreeName: worktreeSession.worktreeName,
        worktreeBranch: worktreeSession.worktreeBranch,
        originalBranch: worktreeSession.originalBranch,
        originalHeadCommit: worktreeSession.originalHeadCommit,
        sessionId: worktreeSession.sessionId,
        tmuxSessionName: worktreeSession.tmuxSessionName,
        hookBased: worktreeSession.hookBased,
      }
    : null
  // project读取`getProject`，供共享工具后续处理使用。
  const project = getProject()
  // currentSessionWorktree 会话数据更新为 `stripped`，确保共享工具后续读取最新状态。
  project.currentSessionWorktree = stripped
  // Write eagerly when the file already exists (mid-session enter/exit).
  // For --worktree startup, sessionFile is null — materializeSessionFile
  // will write it on the first message via reAppendSessionMetadata.
  // 满足 `project.sessionFile` 时，共享工具执行该分支。
  if (project.sessionFile) {
    // 调用 appendEntryToFile，触发共享工具此处需要的副作用。
    appendEntryToFile(project.sessionFile, {
      type: 'worktree-state',
      worktreeSession: stripped,
      sessionId: getSessionId(),
    })
  }
}

/**
 * Extracts the session ID from a log.
 * For lite logs, uses the sessionId field directly.
 * For full logs, extracts from the first message.
 */
// getSessionIdFromLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionIdFromLog(log: LogOption): UUID | undefined {
  // For lite logs, use the direct sessionId field
  // 满足 `log.sessionId` 时，共享工具执行该分支。
  if (log.sessionId) {
    // 返回 `log.sessionId as UUID`，作为共享工具这次计算的结果。
    return log.sessionId as UUID
  }
  // Fall back to extracting from first message (full logs)
  // 返回 `log.messages[0]?.sessionId as UUID | undefined`，作为共享工具这次计算的结果。
  return log.messages[0]?.sessionId as UUID | undefined
}

/**
 * Checks if a log is a lite log that needs full loading.
 * Lite logs have messages: [] and sessionId set.
 */
// isLiteLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLiteLog(log: LogOption): boolean {
  // 返回 `log.messages.length === 0 && log.sessionId !== undefined`，作为共享工具这次计算的结果。
  return log.messages.length === 0 && log.sessionId !== undefined
}

/**
 * Loads full messages for a lite log by reading its JSONL file.
 * Returns a new LogOption with populated messages array.
 * If the log is already full or loading fails, returns the original log.
 */
// loadFullLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadFullLog(log: LogOption): Promise<LogOption> {
  // If already full, return as-is
  // 满足 `!isLiteLog(log)` 时，共享工具执行该分支。
  if (!isLiteLog(log)) {
    // 返回 `log`，作为共享工具这次计算的结果。
    return log
  }

  // Use the fullPath from the index entry directly
  // sessionFile 会话数据保存`log.fullPath`，供共享工具 session Storage后续判断或输出使用。
  const sessionFile = log.fullPath
  // sessionFile 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sessionFile) {
    // 返回 `log`，作为共享工具这次计算的结果。
    return log
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      messages,
      summaries,
      customTitles,
      tags,
      agentNames,
      agentColors,
      agentSettings,
      prNumbers,
      prUrls,
      prRepositories,
      modes,
      worktreeStates,
      fileHistorySnapshots,
      attributionSnapshots,
      contentReplacements,
      contextCollapseCommits,
      contextCollapseSnapshot,
      leafUuids,
    } = await loadTranscriptFile(sessionFile)

    // 满足 `messages.size === 0` 时，共享工具执行该分支。
    if (messages.size === 0) {
      // 返回 `log`，作为共享工具这次计算的结果。
      return log
    }

    // Find the most recent user/assistant leaf message from the transcript
    // mostRecentLeaf筛选`findLatestMessage`，供共享工具后续处理使用。
    const mostRecentLeaf = findLatestMessage(
      messages.values(),
      // 消息更新为 `>`，确保共享工具后续读取最新状态。
      msg =>
        leafUuids.has(msg.uuid) &&
        (msg.type === 'user' || msg.type === 'assistant'),
    )
    // mostRecentLeaf缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!mostRecentLeaf) {
      // 返回 `log`，作为共享工具这次计算的结果。
      return log
    }

    // Build the conversation chain from this leaf
    // transcript构建`buildConversationChain`，供共享工具后续处理使用。
    const transcript = buildConversationChain(messages, mostRecentLeaf)
    // Leaf's sessionId — forked sessions copy chain[0] from the source, but
    // metadata entries (custom-title etc.) are keyed by the current session.
    // sessionId 会话数据 命名 `mostRecentLeaf.sessionId as UUID | undefined`，让后续代码直接表达这个值的用途。
    const sessionId = mostRecentLeaf.sessionId as UUID | undefined
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...log,
      messages: removeExtraFields(transcript),
      firstPrompt: extractFirstPrompt(transcript),
      messageCount: countVisibleMessages(transcript),
      summary: mostRecentLeaf
        ? summaries.get(mostRecentLeaf.uuid)
        : log.summary,
      customTitle: sessionId ? customTitles.get(sessionId) : log.customTitle,
      tag: sessionId ? tags.get(sessionId) : log.tag,
      agentName: sessionId ? agentNames.get(sessionId) : log.agentName,
      agentColor: sessionId ? agentColors.get(sessionId) : log.agentColor,
      agentSetting: sessionId ? agentSettings.get(sessionId) : log.agentSetting,
      mode: sessionId ? (modes.get(sessionId) as LogOption['mode']) : log.mode,
      worktreeSession:
        sessionId && worktreeStates.has(sessionId)
          ? worktreeStates.get(sessionId)
          : log.worktreeSession,
      prNumber: sessionId ? prNumbers.get(sessionId) : log.prNumber,
      prUrl: sessionId ? prUrls.get(sessionId) : log.prUrl,
      prRepository: sessionId
        ? prRepositories.get(sessionId)
        : log.prRepository,
      gitBranch: mostRecentLeaf?.gitBranch ?? log.gitBranch,
      isSidechain: transcript[0]?.isSidechain ?? log.isSidechain,
      teamName: transcript[0]?.teamName ?? log.teamName,
      leafUuid: mostRecentLeaf?.uuid ?? log.leafUuid,
      fileHistorySnapshots: buildFileHistorySnapshotChain(
        fileHistorySnapshots,
        transcript,
      ),
      attributionSnapshots: buildAttributionSnapshotChain(
        attributionSnapshots,
        transcript,
      ),
      contentReplacements: sessionId
        ? (contentReplacements.get(sessionId) ?? [])
        : log.contentReplacements,
      // Filter to the resumed session's entries. loadTranscriptFile reads
      // the file sequentially so the array is already in commit order;
      // filter preserves that.
      contextCollapseCommits: sessionId
        // 这个回调绑定到 ? contextCollapseCommits.filter(e => e.sessionId === sessionId)，负责共享工具在该局部场景下的响应。
        ? contextCollapseCommits.filter(e => e.sessionId === sessionId)
        : undefined,
      contextCollapseSnapshot:
        sessionId && contextCollapseSnapshot?.sessionId === sessionId
          ? contextCollapseSnapshot
          : undefined,
    }
  } catch {
    // If loading fails, return the original log
    // 返回 `log`，作为共享工具这次计算的结果。
    return log
  }
}

/**
 * Searches for sessions by custom title match.
 * Returns matches sorted by recency (newest first).
 * Uses case-insensitive matching for better UX.
 * Deduplicates by sessionId (keeps most recent per session).
 * Searches across same-repo worktrees by default.
 */
// searchSessionsByCustomTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function searchSessionsByCustomTitle(
  query: string,
  options?: { limit?: number; exact?: boolean },
): Promise<LogOption[]> {
  // 从 `options || {}` 解构 limit、exact，减少共享工具 session Storage对同一对象的重复访问。
  const { limit, exact } = options || {}
  // Use worktree-aware loading to search across same-repo sessions
  // worktreePaths 路径数据读取`getWorktreePaths`，供共享工具后续处理使用。
  const worktreePaths = await getWorktreePaths(getOriginalCwd())
  // allStatLogs 集合读取`getStatOnlyLogsForWorktrees`，供共享工具后续处理使用。
  const allStatLogs = await getStatOnlyLogsForWorktrees(worktreePaths)
  // Enrich all logs to access customTitle metadata
  // 从 `await enrichLogs(allStatLogs, 0, allStatLogs.length)` 解构 logs，减少共享工具 session Storage对同一对象的重复访问。
  const { logs } = await enrichLogs(allStatLogs, 0, allStatLogs.length)
  // normalizedQuery保存`query.toLowerCase`，供共享工具后续处理使用。
  const normalizedQuery = query.toLowerCase().trim()

  // matchingLogs 集合筛选`logs.filter`，供共享工具后续处理使用。
  const matchingLogs = logs.filter(log => {
    // title 标题保存`toLowerCase`，供共享工具后续处理使用。
    const title = log.customTitle?.toLowerCase().trim()
    // title 标题缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!title) return false
    // 返回 `exact ? title === normalizedQuery : title.includes(normalizedQuery)`，作为共享工具这次计算的结果。
    return exact ? title === normalizedQuery : title.includes(normalizedQuery)
  })

  // Deduplicate by sessionId - multiple logs can have the same sessionId
  // if they're different branches of the same conversation. Keep most recent.
  // sessionIdToLog 会话数据构建`new Map<UUID, LogOption>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const sessionIdToLog = new Map<UUID, LogOption>()
  // 按顺序遍历 `matchingLogs` 中的log，逐个交给共享工具处理。
  for (const log of matchingLogs) {
    // sessionId 会话数据读取`getSessionIdFromLog`，供共享工具后续处理使用。
    const sessionId = getSessionIdFromLog(log)
    // 满足 `sessionId` 时，共享工具执行该分支。
    if (sessionId) {
      // existing读取`sessionIdToLog.get`，供共享工具后续处理使用。
      const existing = sessionIdToLog.get(sessionId)
      // 只有 `!existing || log.modified > existing.modified` 满足时，共享工具才执行该分支。
      if (!existing || log.modified > existing.modified) {
        // sessionIdToLog.set 写入新的状态值，使共享工具后续读取保持一致。
        sessionIdToLog.set(sessionId, log)
      }
    }
  }
  // deduplicated保存`Array.from`，供共享工具后续处理使用。
  const deduplicated = Array.from(sessionIdToLog.values())

  // Sort by recency
  // 调用 deduplicated.sort，触发共享工具此处需要的副作用。
  deduplicated.sort((a, b) => b.modified.getTime() - a.modified.getTime())

  // Apply limit if specified
  // 满足 `limit` 时，共享工具执行该分支。
  if (limit) {
    // 返回 `deduplicated.slice(0, limit)`，作为共享工具这次计算的结果。
    return deduplicated.slice(0, limit)
  }

  // 返回 `deduplicated`，作为共享工具这次计算的结果。
  return deduplicated
}

/**
 * Metadata entry types that can appear before a compact boundary but must
 * still be loaded (they're session-scoped, not message-scoped).
 * Kept as raw JSON string markers for cheap line filtering during streaming.
 */
// METADATA_TYPE_MARKERS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const METADATA_TYPE_MARKERS = [
  '"type":"summary"',
  '"type":"custom-title"',
  '"type":"tag"',
  '"type":"agent-name"',
  '"type":"agent-color"',
  '"type":"agent-setting"',
  '"type":"mode"',
  '"type":"worktree-state"',
  '"type":"pr-link"',
]
// METADATA_MARKER_BUFS 集合派生`METADATA_TYPE_MARKERS.map`，供共享工具后续处理使用。
const METADATA_MARKER_BUFS = METADATA_TYPE_MARKERS.map(m => Buffer.from(m))
// Longest marker is 22 bytes; +1 for leading `{` = 23.
// METADATA_PREFIX_BOUND保存`25`，供后续判断或组装使用。
const METADATA_PREFIX_BOUND = 25

// null = carry spans whole chunk. Skips concat when carry provably isn't
// a metadata line (markers sit at byte 1 after `{`).
// resolveMetadataBuf 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveMetadataBuf(
  carry: Buffer | null,
  chunkBuf: Buffer,
): Buffer | null {
  // carry === null || carry为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (carry === null || carry.length === 0) return chunkBuf
  // 满足 `carry.length < METADATA_PREFIX_BOUND` 时，共享工具执行该分支。
  if (carry.length < METADATA_PREFIX_BOUND) {
    // 返回 `Buffer.concat([carry, chunkBuf])`，作为共享工具这次计算的结果。
    return Buffer.concat([carry, chunkBuf])
  }
  // 满足 `carry[0] === 0x7b /* { */` 时，共享工具执行该分支。
  if (carry[0] === 0x7b /* { */) {
    // 按顺序遍历 `METADATA_MARKER_BUFS` 中的m，逐个交给共享工具处理。
    for (const m of METADATA_MARKER_BUFS) {
      // 满足 `carry.compare(m, 0, m.length, 1, 1 + m.length) === 0` 时，共享工具执行该分支。
      if (carry.compare(m, 0, m.length, 1, 1 + m.length) === 0) {
        // 返回 `Buffer.concat([carry, chunkBuf])`，作为共享工具这次计算的结果。
        return Buffer.concat([carry, chunkBuf])
      }
    }
  }
  // firstNl保存`chunkBuf.indexOf`，供共享工具后续处理使用。
  const firstNl = chunkBuf.indexOf(0x0a)
  // 返回 `firstNl === -1 ? null : chunkBuf.subarray(firstNl + 1)`，作为共享工具这次计算的结果。
  return firstNl === -1 ? null : chunkBuf.subarray(firstNl + 1)
}

/**
 * Lightweight forward scan of [0, endOffset) collecting only metadata-entry lines.
 * Uses raw Buffer chunks and byte-level marker matching — no readline, no per-line
 * string conversion for the ~99% of lines that are message content.
 *
 * Fast path: if a chunk contains zero markers (the common case — metadata entries
 * are <50 per session), the entire chunk is skipped without line splitting.
 */
// scanPreBoundaryMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function scanPreBoundaryMetadata(
  filePath: string,
  endOffset: number,
): Promise<string[]> {
  // 从 `await import('fs')` 解构 createReadStream，减少共享工具 session Storage对同一对象的重复访问。
  const { createReadStream } = await import('fs')
  // NEWLINE保存`0x0a`，供共享工具 session Storage后续判断或输出使用。
  const NEWLINE = 0x0a

  // stream构建`createReadStream`，供共享工具后续处理使用。
  const stream = createReadStream(filePath, { end: endOffset - 1 })
  // metadataLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const metadataLines: string[] = []
  // carry保存`null`，作为后续空值处理的输入。
  let carry: Buffer | null = null

  // 逐项读取 `stream` 中的chunk，按输入顺序推进共享工具。
  for await (const chunk of stream) {
    // chunkBuf保存`chunk as Buffer`，供后续判断或组装使用。
    const chunkBuf = chunk as Buffer
    // buf读取`resolveMetadataBuf`，供共享工具后续处理使用。
    const buf = resolveMetadataBuf(carry, chunkBuf)
    // 满足 `buf === null` 时，共享工具执行该分支。
    if (buf === null) {
      // carry更新为 `null`，确保共享工具后续读取最新状态。
      carry = null
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Fast path: most chunks contain zero metadata markers. Skip line splitting.
    // hasAnyMarker标记共享工具 session Storage是否启用对应路径。
    let hasAnyMarker = false
    // 按顺序遍历 `METADATA_MARKER_BUFS` 中的m，逐个交给共享工具处理。
    for (const m of METADATA_MARKER_BUFS) {
      // 满足 `buf.includes(m)` 时，共享工具执行该分支。
      if (buf.includes(m)) {
        // hasAnyMarker更新为 `true`，确保共享工具后续读取最新状态。
        hasAnyMarker = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }

    // 满足 `hasAnyMarker` 时，共享工具执行该分支。
    if (hasAnyMarker) {
      // lineStart保存`0`，供共享工具 session Storage后续判断或输出使用。
      let lineStart = 0
      // nl保存`buf.indexOf`，供共享工具后续处理使用。
      let nl = buf.indexOf(NEWLINE)
      // while 使用 nl !== -1 完成共享工具里的对应操作。
      while (nl !== -1) {
        // Bounded marker check: only look within this line's byte range
        // 按顺序遍历 `METADATA_MARKER_BUFS` 中的m，逐个交给共享工具处理。
        for (const m of METADATA_MARKER_BUFS) {
          // mIdx保存`buf.indexOf`，供共享工具后续处理使用。
          const mIdx = buf.indexOf(m, lineStart)
          // `mIdx` 与 `-1 && mIdx < nl` 不一致时刷新派生状态，避免使用过期结果。
          if (mIdx !== -1 && mIdx < nl) {
            // metadataLines 集合追加新条目，保持收集顺序与输入顺序一致。
            metadataLines.push(buf.toString('utf-8', lineStart, nl))
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
        // lineStart更新为 `nl + 1`，确保共享工具后续读取最新状态。
        lineStart = nl + 1
        // nl更新为 `buf.indexOf(NEWLINE, lineStart)`，确保共享工具后续读取最新状态。
        nl = buf.indexOf(NEWLINE, lineStart)
      }
      // carry更新为 `buf.subarray(lineStart)`，确保共享工具后续读取最新状态。
      carry = buf.subarray(lineStart)
    } else {
      // No markers in this chunk — just preserve the incomplete trailing line
      // lastNl保存`buf.lastIndexOf`，供共享工具后续处理使用。
      const lastNl = buf.lastIndexOf(NEWLINE)
      // carry更新为 `lastNl >= 0 ? buf.subarray(lastNl + 1) : buf`，确保共享工具后续读取最新状态。
      carry = lastNl >= 0 ? buf.subarray(lastNl + 1) : buf
    }

    // Guard against quadratic carry growth for pathological huge lines
    // (e.g., a 10 MB tool-output line with no newline). Real metadata entries
    // are <1 KB, so if carry exceeds this we're mid-message-content — drop it.
    // 满足 `carry.length > 64 * 1024` 时，共享工具执行该分支。
    if (carry.length > 64 * 1024) carry = null
  }

  // Final incomplete line (no trailing newline at endOffset)
  // `carry` 与 `null && carry.length > 0` 不一致时刷新派生状态，避免使用过期结果。
  if (carry !== null && carry.length > 0) {
    // 按顺序遍历 `METADATA_MARKER_BUFS` 中的m，逐个交给共享工具处理。
    for (const m of METADATA_MARKER_BUFS) {
      // 满足 `carry.includes(m)` 时，共享工具执行该分支。
      if (carry.includes(m)) {
        // metadataLines 集合追加新条目，保持收集顺序与输入顺序一致。
        metadataLines.push(carry.toString('utf-8'))
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  }

  // 返回 `metadataLines`，作为共享工具这次计算的结果。
  return metadataLines
}

/**
 * Byte-level pre-filter that excises dead fork branches before parseJSONL.
 *
 * Every rewind/ctrl-z leaves an orphaned chain branch in the append-only
 * JSONL forever. buildConversationChain walks parentUuid from the latest leaf
 * and discards everything else, but by then parseJSONL has already paid to
 * JSON.parse all of it. Measured on fork-heavy sessions:
 *
 *   41 MB, 99% dead: parseJSONL 56.0 ms -> 3.9 ms (-93%)
 *   151 MB, 92% dead: 47.3 ms -> 9.4 ms (-80%)
 *
 * Sessions with few dead branches (5-7%) see a small win from the overhead of
 * the index pass roughly canceling the parse savings, so this is gated on
 * buffer size (same threshold as SKIP_PRECOMPACT_THRESHOLD).
 *
 * Relies on two invariants verified across 25k+ message lines in local
 * sessions (0 violations):
 *
 *   1. Transcript messages always serialize with parentUuid as the first key.
 *      JSON.stringify emits keys in insertion order and recordTranscript's
 *      object literal puts parentUuid first. So `{"parentUuid":` is a stable
 *      line prefix that distinguishes transcript messages from metadata.
 *
 *   2. Top-level uuid detection is handled by a suffix check + depth check
 *      (see inline comment in the scan loop). toolUseResult/mcpMeta serialize
 *      AFTER uuid with arbitrary server-controlled objects, and agent_progress
 *      entries serialize a nested Message in data BEFORE uuid — both can
 *      produce nested `"uuid":"<36>","timestamp":"` bytes, so suffix alone
 *      is insufficient. When multiple suffix matches exist, a brace-depth
 *      scan disambiguates.
 *
 * The append-only write discipline guarantees parents appear at earlier file
 * offsets than children, so walking backward from EOF always finds them.
 */

/**
 * Disambiguate multiple `"uuid":"<36>","timestamp":"` matches in one line by
 * finding the one at JSON nesting depth 1. String-aware brace counter:
 * `{`/`}` inside string values don't count; `\"` and `\\` inside strings are
 * handled. Candidates is sorted ascending (the scan loop produces them in
 * byte order). Returns the first depth-1 candidate, or the last candidate if
 * none are at depth 1 (shouldn't happen for well-formed JSONL — depth-1 is
 * where the top-level object's fields live).
 *
 * Only called when ≥2 suffix matches exist (agent_progress with a nested
 * Message, or mcpMeta with a coincidentally-suffixed object). Cost is
 * O(max(candidates) - lineStart) — one forward byte pass, stopping at the
 * first depth-1 hit.
 */
// pickDepthOneUuidCandidate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pickDepthOneUuidCandidate(
  buf: Buffer,
  lineStart: number,
  candidates: number[],
): number {
  // QUOTE保存`0x22`，供后续判断或组装使用。
  const QUOTE = 0x22
  // BACKSLASH保存`0x5c`，供后续判断或组装使用。
  const BACKSLASH = 0x5c
  // OPEN_BRACE 命名 `0x7b`，让后续代码直接表达这个值的用途。
  const OPEN_BRACE = 0x7b
  // CLOSE_BRACE保存`0x7d`，供共享工具 session Storage后续判断或输出使用。
  const CLOSE_BRACE = 0x7d
  // depth 命名 `0`，让后续代码直接表达这个值的用途。
  let depth = 0
  // inString标记共享工具 session Storage是否启用对应路径。
  let inString = false
  // escapeNext标记共享工具 session Storage是否启用对应路径。
  let escapeNext = false
  // ci保存`0`，供后续判断或组装使用。
  let ci = 0
  // 循环处理 `let i = lineStart; ci < candidates.length; i++`，让共享工具逐项把同类条目按顺序走完。
  for (let i = lineStart; ci < candidates.length; i++) {
    // 满足 `i === candidates[ci]` 时，共享工具执行该分支。
    if (i === candidates[ci]) {
      // 只有 `depth === 1 && !inString` 满足时，共享工具才执行该分支。
      if (depth === 1 && !inString) return candidates[ci]!
      // 共享工具 session Storage在这里处理 `ci++`，完成这一小步状态转换。
      ci++
    }
    // b读取 `buf[i]!` 对应条目，后续围绕该成员继续处理。
    const b = buf[i]!
    // 满足 `escapeNext` 时，共享工具执行该分支。
    if (escapeNext) {
      // escapeNext更新为 `false`，确保共享工具后续读取最新状态。
      escapeNext = false
    // 共享工具 session Storage在这里处理 `} else if (inString) {`，完成这一小步状态转换。
    } else if (inString) {
      // 满足 `b === BACKSLASH` 时，共享工具执行该分支。
      if (b === BACKSLASH) escapeNext = true
      else if (b === QUOTE) inString = false
    // 共享工具 session Storage在这里处理 `} else if (b === QUOTE) inString = true`，完成这一小步状态转换。
    } else if (b === QUOTE) inString = true
    else if (b === OPEN_BRACE) depth++
    else if (b === CLOSE_BRACE) depth--
  }
  // 返回 `candidates.at(-1)!`，作为共享工具这次计算的结果。
  return candidates.at(-1)!
}

// walkChainBeforeParse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkChainBeforeParse(buf: Buffer): Buffer {
  // NEWLINE保存`0x0a`，供共享工具 session Storage后续判断或输出使用。
  const NEWLINE = 0x0a
  // OPEN_BRACE 命名 `0x7b`，让后续代码直接表达这个值的用途。
  const OPEN_BRACE = 0x7b
  // QUOTE保存`0x22`，供后续判断或组装使用。
  const QUOTE = 0x22
  // PARENT_PREFIX保存`Buffer.from`，供共享工具后续处理使用。
  const PARENT_PREFIX = Buffer.from('{"parentUuid":')
  // UUID_KEY保存`Buffer.from`，供共享工具后续处理使用。
  const UUID_KEY = Buffer.from('"uuid":"')
  // SIDECHAIN_TRUE保存`Buffer.from`，供共享工具后续处理使用。
  const SIDECHAIN_TRUE = Buffer.from('"isSidechain":true')
  // UUID_LEN 命名 `36`，让后续代码直接表达这个值的用途。
  const UUID_LEN = 36
  // TS_SUFFIX保存`Buffer.from`，供共享工具后续处理使用。
  const TS_SUFFIX = Buffer.from('","timestamp":"')
  // TS_SUFFIX_LEN保存 `TS_SUFFIX.length` 的判断结果，供共享工具 session Storage后续分支直接复用。
  const TS_SUFFIX_LEN = TS_SUFFIX.length
  // PREFIX_LEN 命名 `PARENT_PREFIX.length`，让后续代码直接表达这个值的用途。
  const PREFIX_LEN = PARENT_PREFIX.length
  // KEY_LEN记录 `UUID_KEY.length` 是否成立，下一步按该结果分支。
  const KEY_LEN = UUID_KEY.length

  // Stride-3 flat index of transcript messages: [lineStart, lineEnd, parentStart].
  // parentStart is the byte offset of the parent uuid's first char, or -1 for null.
  // Metadata lines (summary, mode, file-history-snapshot, etc.) go in metaRanges
  // unfiltered - they lack the parentUuid prefix and downstream needs all of them.
  // msgIdx 从空数组开始收集，后续循环会按处理顺序追加条目。
  const msgIdx: number[] = []
  // metaRanges 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const metaRanges: number[] = []
  // uuidToSlot 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
  const uuidToSlot = new Map<string, number>()

  // pos 集合保存`0`，供共享工具 session Storage后续判断或输出使用。
  let pos = 0
  // len保存 `buf.length` 的判断结果，供共享工具 session Storage后续分支直接复用。
  const len = buf.length
  // while 使用 pos < len 完成共享工具里的对应操作。
  while (pos < len) {
    // nl保存`buf.indexOf`，供共享工具后续处理使用。
    const nl = buf.indexOf(NEWLINE, pos)
    // lineEnd标记共享工具 session Storage是否启用对应路径。
    const lineEnd = nl === -1 ? len : nl + 1
    // 共享工具在这里按实际状态进入对应分支。
    if (
      lineEnd - pos > PREFIX_LEN &&
      buf[pos] === OPEN_BRACE &&
      buf.compare(PARENT_PREFIX, 0, PREFIX_LEN, pos, pos + PREFIX_LEN) === 0
    ) {
      // `{"parentUuid":null,` or `{"parentUuid":"<36 chars>",`
      // parentStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const parentStart =
        buf[pos + PREFIX_LEN] === QUOTE ? pos + PREFIX_LEN + 1 : -1
      // The top-level uuid is immediately followed by `","timestamp":"` in
      // user/assistant/attachment entries (the create* helpers put them
      // adjacent; both always defined). But the suffix is NOT unique:
      //   - agent_progress entries carry a nested Message in data.message,
      //     serialized BEFORE top-level uuid — that inner Message has its
      //     own uuid,timestamp adjacent, so its bytes also satisfy the
      //     suffix check.
      //   - mcpMeta/toolUseResult come AFTER top-level uuid and hold
      //     server-controlled Record<string,unknown> — a server returning
      //     {uuid:"<36>",timestamp:"..."} would also match.
      // Collect all suffix matches; a single one is unambiguous (common
      // case), multiple need a brace-depth check to pick the one at
      // JSON nesting depth 1. Entries with NO suffix match (some progress
      // variants put timestamp BEFORE uuid → `"uuid":"<36>"}` at EOL)
      // have only one `"uuid":"` and the first-match fallback is sound.
      // firstAny保存`-1`，供后续判断或组装使用。
      let firstAny = -1
      // suffix0保存`-1`，供后续判断或组装使用。
      let suffix0 = -1
      // suffixN 先占位，稍后的条件分支会根据实际输入补齐它。
      let suffixN: number[] | undefined
      // from 命名 `pos`，让后续代码直接表达这个值的用途。
      let from = pos
      // 循环处理 ``，让共享工具逐项把同类条目按顺序走完。
      for (;;) {
        // next保存`buf.indexOf`，供共享工具后续处理使用。
        const next = buf.indexOf(UUID_KEY, from)
        // 只有 `next < 0 || next >= lineEnd` 满足时，共享工具才执行该分支。
        if (next < 0 || next >= lineEnd) break
        // 满足 `firstAny < 0` 时，共享工具执行该分支。
        if (firstAny < 0) firstAny = next
        // after保存`next + KEY_LEN + UUID_LEN`，供后续判断或组装使用。
        const after = next + KEY_LEN + UUID_LEN
        // 共享工具在这里按实际状态进入对应分支。
        if (
          after + TS_SUFFIX_LEN <= lineEnd &&
          buf.compare(
            TS_SUFFIX,
            0,
            TS_SUFFIX_LEN,
            after,
            after + TS_SUFFIX_LEN,
          ) === 0
        ) {
          // 满足 `suffix0 < 0` 时，共享工具执行该分支。
          if (suffix0 < 0) suffix0 = next
          else (suffixN ??= [suffix0]).push(next)
        }
        // from更新为 `next + KEY_LEN`，确保共享工具后续读取最新状态。
        from = next + KEY_LEN
      }
      // uk 命名 `suffixN`，让后续代码直接表达这个值的用途。
      const uk = suffixN
        ? pickDepthOneUuidCandidate(buf, pos, suffixN)
        : suffix0 >= 0
          ? suffix0
          : firstAny
      // 满足 `uk >= 0` 时，共享工具执行该分支。
      if (uk >= 0) {
        // uuidStart保存`uk + KEY_LEN`，供共享工具 session Storage后续判断或输出使用。
        const uuidStart = uk + KEY_LEN
        // UUIDs are pure ASCII so latin1 avoids UTF-8 decode overhead.
        // uuid格式化`buf.toString`，供共享工具后续处理使用。
        const uuid = buf.toString('latin1', uuidStart, uuidStart + UUID_LEN)
        // uuidToSlot.set 写入新的状态值，使共享工具后续读取保持一致。
        uuidToSlot.set(uuid, msgIdx.length)
        // msgIdx追加新条目，保持收集顺序与输入顺序一致。
        msgIdx.push(pos, lineEnd, parentStart)
      } else {
        // metaRanges 集合追加新条目，保持收集顺序与输入顺序一致。
        metaRanges.push(pos, lineEnd)
      }
    } else {
      // metaRanges 集合追加新条目，保持收集顺序与输入顺序一致。
      metaRanges.push(pos, lineEnd)
    }
    // pos 集合更新为 `lineEnd`，确保共享工具后续读取最新状态。
    pos = lineEnd
  }

  // Leaf = last non-sidechain entry. isSidechain is the 2nd or 3rd key
  // (after parentUuid, maybe logicalParentUuid) so indexOf from lineStart
  // finds it within a few dozen bytes when present; when absent it spills
  // into the next line, caught by the bounds check.
  // leafSlot 命名 `-1`，让后续代码直接表达这个值的用途。
  let leafSlot = -1
  // 循环处理 `let i = msgIdx.length - 3; i >= 0; i -= 3`，让共享工具逐项把同类条目按顺序走完。
  for (let i = msgIdx.length - 3; i >= 0; i -= 3) {
    // sc保存`buf.indexOf`，供共享工具后续处理使用。
    const sc = buf.indexOf(SIDECHAIN_TRUE, msgIdx[i]!)
    // 只有 `sc === -1 || sc >= msgIdx[i + 1]!` 满足时，共享工具才执行该分支。
    if (sc === -1 || sc >= msgIdx[i + 1]!) {
      // leafSlot更新为 `i`，确保共享工具后续读取最新状态。
      leafSlot = i
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 满足 `leafSlot < 0` 时，共享工具执行该分支。
  if (leafSlot < 0) return buf

  // Walk parentUuid to root. Collect kept-message line starts and sum their
  // byte lengths so we can decide whether the concat is worth it. A dangling
  // parent (uuid not in file) is the normal termination for forked sessions
  // and post-boundary chains -- same semantics as buildConversationChain.
  // Correctness against index poisoning rests on the timestamp suffix check
  // above: a nested `"uuid":"` match without the suffix never becomes uk.
  // seen 命名 `new Set<number>()`，让后续代码直接表达这个值的用途。
  const seen = new Set<number>()
  // chain构建`new Set<number>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const chain = new Set<number>()
  // chainBytes 集合保存`0`，供后续判断或组装使用。
  let chainBytes = 0
  // slot保存`leafSlot`，供共享工具 session Storage后续判断或输出使用。
  let slot: number | undefined = leafSlot
  // while 使用 slot !== undefined 完成共享工具里的对应操作。
  while (slot !== undefined) {
    // 满足 `seen.has(slot)` 时，共享工具执行该分支。
    if (seen.has(slot)) break
    // 调用 seen.add，触发共享工具此处需要的副作用。
    seen.add(slot)
    // 调用 chain.add，触发共享工具此处需要的副作用。
    chain.add(msgIdx[slot]!)
    // 共享工具 session Storage在这里处理 `chainBytes += msgIdx[slot + 1]! - msgIdx[slot]!`，完成这一小步状态转换。
    chainBytes += msgIdx[slot + 1]! - msgIdx[slot]!
    // parentStart读取 `msgIdx[slot + 2]!` 对应条目，后续围绕该成员继续处理。
    const parentStart = msgIdx[slot + 2]!
    // 满足 `parentStart < 0` 时，共享工具执行该分支。
    if (parentStart < 0) break
    // parent格式化`buf.toString`，供共享工具后续处理使用。
    const parent = buf.toString('latin1', parentStart, parentStart + UUID_LEN)
    // slot更新为 `uuidToSlot.get(parent)`，确保共享工具后续读取最新状态。
    slot = uuidToSlot.get(parent)
  }

  // parseJSONL cost scales with bytes, not entry count. A session can have
  // thousands of dead entries by count but only single-digit-% of bytes if
  // the dead branches are short turns and the live chain holds the fat
  // assistant responses (measured: 107 MB session, 69% dead entries, 30%
  // dead bytes - index+concat overhead exceeded parse savings). Gate on
  // bytes: only stitch if we would drop at least half the buffer. Metadata
  // is tiny so len - chainBytes approximates dead bytes closely enough.
  // Near break-even the concat memcpy (copying chainBytes into a fresh
  // allocation) dominates, so a conservative 50% gate stays safely on the
  // winning side.
  // 满足 `len - chainBytes < len >> 1` 时，共享工具执行该分支。
  if (len - chainBytes < len >> 1) return buf

  // Merge chain entries with metadata in original file order. Both msgIdx and
  // metaRanges are already sorted by offset; interleave them into subarray
  // views and concat once.
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: Buffer[] = []
  // m保存`0`，供后续判断或组装使用。
  let m = 0
  // 循环处理 `let i = 0; i < msgIdx.length; i += 3`，让共享工具逐项把同类条目按顺序走完。
  for (let i = 0; i < msgIdx.length; i += 3) {
    // start读取 `msgIdx[i]!` 对应条目，后续围绕该成员继续处理。
    const start = msgIdx[i]!
    // while 使用 m < metaRanges.length && metaRanges[m]! < start 完成共享工具里的对应操作。
    while (m < metaRanges.length && metaRanges[m]! < start) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(buf.subarray(metaRanges[m]!, metaRanges[m + 1]!))
      // 共享工具 session Storage在这里处理 `m += 2`，完成这一小步状态转换。
      m += 2
    }
    // 满足 `chain.has(start)` 时，共享工具执行该分支。
    if (chain.has(start)) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(buf.subarray(start, msgIdx[i + 1]!))
    }
  }
  // while 使用 m < metaRanges.length 完成共享工具里的对应操作。
  while (m < metaRanges.length) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(buf.subarray(metaRanges[m]!, metaRanges[m + 1]!))
    // 共享工具 session Storage在这里处理 `m += 2`，完成这一小步状态转换。
    m += 2
  }
  // 返回 `Buffer.concat(parts)`，作为共享工具这次计算的结果。
  return Buffer.concat(parts)
}

/**
 * Loads all messages, summaries, and file history snapshots from a transcript file.
 * Returns the messages, summaries, custom titles, tags, file history snapshots, and attribution snapshots.
 */
// loadTranscriptFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadTranscriptFile(
  filePath: string,
  opts?: { keepAllLeaves?: boolean },
): Promise<{
  messages: Map<UUID, TranscriptMessage>
  summaries: Map<UUID, string>
  customTitles: Map<UUID, string>
  tags: Map<UUID, string>
  agentNames: Map<UUID, string>
  agentColors: Map<UUID, string>
  agentSettings: Map<UUID, string>
  prNumbers: Map<UUID, number>
  prUrls: Map<UUID, string>
  prRepositories: Map<UUID, string>
  modes: Map<UUID, string>
  worktreeStates: Map<UUID, PersistedWorktreeSession | null>
  fileHistorySnapshots: Map<UUID, FileHistorySnapshotMessage>
  attributionSnapshots: Map<UUID, AttributionSnapshotMessage>
  contentReplacements: Map<UUID, ContentReplacementRecord[]>
  agentContentReplacements: Map<AgentId, ContentReplacementRecord[]>
  contextCollapseCommits: ContextCollapseCommitEntry[]
  contextCollapseSnapshot: ContextCollapseSnapshotEntry | undefined
  leafUuids: Set<UUID>
}> {
  // 对话消息构建`new Map<UUID, TranscriptMessage>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const messages = new Map<UUID, TranscriptMessage>()
  // summaries 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const summaries = new Map<UUID, string>()
  // customTitles 标题 命名 `new Map<UUID, string>()`，让后续代码直接表达这个值的用途。
  const customTitles = new Map<UUID, string>()
  // tags 集合 命名 `new Map<UUID, string>()`，让后续代码直接表达这个值的用途。
  const tags = new Map<UUID, string>()
  // agentNames 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const agentNames = new Map<UUID, string>()
  // agentColors 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const agentColors = new Map<UUID, string>()
  // agentSettings 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const agentSettings = new Map<UUID, string>()
  // prNumbers 集合构建`new Map<UUID, number>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const prNumbers = new Map<UUID, number>()
  // prUrls 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const prUrls = new Map<UUID, string>()
  // prRepositories 集合 命名 `new Map<UUID, string>()`，让后续代码直接表达这个值的用途。
  const prRepositories = new Map<UUID, string>()
  // modes 集合构建`new Map<UUID, string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const modes = new Map<UUID, string>()
  // worktreeStates 状态 命名 `new Map<UUID, PersistedWorktreeSession | null>()`，让后续代码直接表达这个值的用途。
  const worktreeStates = new Map<UUID, PersistedWorktreeSession | null>()
  // fileHistorySnapshots 文件数据 命名 `new Map<UUID, FileHistorySnapshotMessage>()`，让后续代码直接表达这个值的用途。
  const fileHistorySnapshots = new Map<UUID, FileHistorySnapshotMessage>()
  // attributionSnapshots 集合构建`new Map<UUID, AttributionSnapshotMessage>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const attributionSnapshots = new Map<UUID, AttributionSnapshotMessage>()
  // contentReplacements 集合构建`new Map<UUID, ContentReplacementRecord[]>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const contentReplacements = new Map<UUID, ContentReplacementRecord[]>()
  // agentContentReplacements 集合 命名 `new Map<`，让后续代码直接表达这个值的用途。
  const agentContentReplacements = new Map<
    AgentId,
    ContentReplacementRecord[]
  >()
  // Array, not Map — commit order matters (nested collapses).
  // contextCollapseCommits 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const contextCollapseCommits: ContextCollapseCommitEntry[] = []
  // Last-wins — later entries supersede.
  // contextCollapseSnapshot 先占位，稍后的条件分支会根据实际输入补齐它。
  let contextCollapseSnapshot: ContextCollapseSnapshotEntry | undefined

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // For large transcripts, avoid materializing megabytes of stale content.
    // Single forward chunked read: attribution-snapshot lines are skipped at
    // the fd level (never buffered), compact boundaries truncate the
    // accumulator in-stream. Peak allocation is the OUTPUT size, not the
    // file size — a 151 MB session that is 84% stale attr-snaps allocates
    // ~32 MB instead of 159+64 MB. This matters because mimalloc does not
    // return those pages to the OS even after JS-level GC frees the backing
    // buffers (measured: arrayBuffers=0 after Bun.gc(true) but RSS stuck at
    // ~316 MB on the old scan+strip path vs ~155 MB here).
    //
    // Pre-boundary metadata (agent-setting, mode, pr-link, etc.) is recovered
    // via a cheap byte-level forward scan of [0, boundary).
    // buf初始化为空值，后续分支会在有数据时补齐。
    let buf: Buffer | null = null
    // metadataLines 集合 命名 `null`，让后续代码直接表达这个值的用途。
    let metadataLines: string[] | null = null
    // hasPreservedSegment标记共享工具 session Storage是否启用对应路径。
    let hasPreservedSegment = false
    // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP)` 时，共享工具执行该分支。
    if (!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP)) {
      // 从 `await stat(filePath)` 解构 size，减少共享工具 session Storage对同一对象的重复访问。
      const { size } = await stat(filePath)
      // 满足 `size > SKIP_PRECOMPACT_THRESHOLD` 时，共享工具执行该分支。
      if (size > SKIP_PRECOMPACT_THRESHOLD) {
        // scan读取`readTranscriptForLoad`，供共享工具后续处理使用。
        const scan = await readTranscriptForLoad(filePath, size)
        // buf更新为 `scan.postBoundaryBuf`，确保共享工具后续读取最新状态。
        buf = scan.postBoundaryBuf
        // hasPreservedSegment更新为 `scan.hasPreservedSegment`，确保共享工具后续读取最新状态。
        hasPreservedSegment = scan.hasPreservedSegment
        // >0 means we truncated pre-boundary bytes and must recover
        // session-scoped metadata from that range. A preservedSegment
        // boundary does not truncate (preserved messages are physically
        // pre-boundary), so offset stays 0 unless an EARLIER non-preserved
        // boundary already truncated — in which case the preserved messages
        // for the later boundary are post-that-earlier-boundary and were
        // kept, and we still want the metadata scan.
        // 满足 `scan.boundaryStartOffset > 0` 时，共享工具执行该分支。
        if (scan.boundaryStartOffset > 0) {
          // metadataLines 集合更新为 `await scanPreBoundaryMetadata(`，确保共享工具后续读取最新状态。
          metadataLines = await scanPreBoundaryMetadata(
            filePath,
            scan.boundaryStartOffset,
          )
        }
      }
    }
    // 共享工具 session Storage在这里处理 `buf ??= await readFile(filePath)`，完成这一小步状态转换。
    buf ??= await readFile(filePath)
    // For large buffers (which here means readTranscriptForLoad output with
    // attr-snaps already stripped at the fd level — the <5MB readFile path
    // falls through the size gate below), the dominant cost is parsing dead
    // fork branches that buildConversationChain would discard anyway. Skip
    // when the caller needs all
    // leaves (loadAllLogsFromSessionFile for /insights picks the branch with
    // most user messages, not the latest), when the boundary has a
    // preservedSegment (those messages keep their pre-compact parentUuid on
    // disk -- applyPreservedSegmentRelinks splices them in-memory AFTER
    // parse, so a pre-parse chain walk would drop them as orphans), and when
    // CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP is set (that kill switch means
    // "load everything, skip nothing"; this is another skip-before-parse
    // optimization and the scan it depends on for hasPreservedSegment did
    // not run).
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !opts?.keepAllLeaves &&
      !hasPreservedSegment &&
      !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP) &&
      buf.length > SKIP_PRECOMPACT_THRESHOLD
    ) {
      // buf更新为 `walkChainBeforeParse(buf)`，确保共享工具后续读取最新状态。
      buf = walkChainBeforeParse(buf)
    }

    // First pass: process metadata-only lines collected during the boundary scan.
    // These populate the session-scoped maps (agentSettings, modes, prNumbers,
    // etc.) for entries written before the compact boundary. Any overlap with
    // the post-boundary buffer is harmless — later values overwrite earlier ones.
    // 只有 `metadataLines && metadataLines.length > 0` 满足时，共享工具才执行该分支。
    if (metadataLines && metadataLines.length > 0) {
      // metaEntries 集合解析`parseJSONL<Entry>(`，供后续判断或组装使用。
      const metaEntries = parseJSONL<Entry>(
        Buffer.from(metadataLines.join('\n')),
      )
      // 按顺序遍历 `metaEntries` 中的entry，逐个交给共享工具处理。
      for (const entry of metaEntries) {
        // 只有 `entry.type === 'summary' && entry.leafUuid` 满足时，共享工具才执行该分支。
        if (entry.type === 'summary' && entry.leafUuid) {
          // summaries.set 写入新的状态值，使共享工具后续读取保持一致。
          summaries.set(entry.leafUuid, entry.summary)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'custom-title' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'custom-title' && entry.sessionId) {
          // customTitles.set 写入新的状态值，使共享工具后续读取保持一致。
          customTitles.set(entry.sessionId, entry.customTitle)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'tag' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'tag' && entry.sessionId) {
          // tags.set 写入新的状态值，使共享工具后续读取保持一致。
          tags.set(entry.sessionId, entry.tag)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-name' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'agent-name' && entry.sessionId) {
          // agentNames.set 写入新的状态值，使共享工具后续读取保持一致。
          agentNames.set(entry.sessionId, entry.agentName)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-color' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'agent-color' && entry.sessionId) {
          // agentColors.set 写入新的状态值，使共享工具后续读取保持一致。
          agentColors.set(entry.sessionId, entry.agentColor)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-setting' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'agent-setting' && entry.sessionId) {
          // agentSettings.set 写入新的状态值，使共享工具后续读取保持一致。
          agentSettings.set(entry.sessionId, entry.agentSetting)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'mode' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'mode' && entry.sessionId) {
          // modes.set 写入新的状态值，使共享工具后续读取保持一致。
          modes.set(entry.sessionId, entry.mode)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'worktree-state' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'worktree-state' && entry.sessionId) {
          // worktreeStates.set 写入新的状态值，使共享工具后续读取保持一致。
          worktreeStates.set(entry.sessionId, entry.worktreeSession)
        // 共享工具 session Storage在这里处理 `} else if (entry.type === 'pr-link' && entry.sessionId) {`，完成这一小步状态转换。
        } else if (entry.type === 'pr-link' && entry.sessionId) {
          // prNumbers.set 写入新的状态值，使共享工具后续读取保持一致。
          prNumbers.set(entry.sessionId, entry.prNumber)
          // prUrls.set 写入新的状态值，使共享工具后续读取保持一致。
          prUrls.set(entry.sessionId, entry.prUrl)
          // prRepositories.set 写入新的状态值，使共享工具后续读取保持一致。
          prRepositories.set(entry.sessionId, entry.prRepository)
        }
      }
    }

    // entries 集合 命名 `parseJSONL<Entry>(buf)`，让后续代码直接表达这个值的用途。
    const entries = parseJSONL<Entry>(buf)

    // Bridge map for legacy progress entries: progress_uuid → progress_parent_uuid.
    // PR #24099 removed progress from isTranscriptMessage, so old transcripts with
    // progress in the parentUuid chain would truncate at buildConversationChain
    // when messages.get(progressUuid) returns undefined. Since transcripts are
    // append-only (parents before children), we record each progress→parent link
    // as we see it, chain-resolving through consecutive progress entries, then
    // rewrite any subsequent message whose parentUuid lands in the bridge.
    // progressBridge 命名 `new Map<UUID, UUID | null>()`，让后续代码直接表达这个值的用途。
    const progressBridge = new Map<UUID, UUID | null>()

    // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
    for (const entry of entries) {
      // Legacy progress check runs before the Entry-typed else-if chain —
      // progress is not in the Entry union, so checking it after TypeScript
      // has narrowed `entry` intersects to `never`.
      // 满足 `isLegacyProgressEntry(entry)` 时，共享工具执行该分支。
      if (isLegacyProgressEntry(entry)) {
        // Chain-resolve through consecutive progress entries so a later
        // message pointing at the tail of a progress run bridges to the
        // nearest non-progress ancestor in one lookup.
        // parent保存`entry.parentUuid`，供后续判断或组装使用。
        const parent = entry.parentUuid
        // progressBridge.set 写入新的状态值，使共享工具后续读取保持一致。
        progressBridge.set(
          entry.uuid,
          parent && progressBridge.has(parent)
            ? (progressBridge.get(parent) ?? null)
            : parent,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 满足 `isTranscriptMessage(entry)` 时，共享工具执行该分支。
      if (isTranscriptMessage(entry)) {
        // 只有 `entry.parentUuid && progressBridge.has(entry.parentUuid)` 满足时，共享工具才执行该分支。
        if (entry.parentUuid && progressBridge.has(entry.parentUuid)) {
          // parentUuid更新为 `progressBridge.get(entry.parentUuid) ?? null`，确保共享工具后续读取最新状态。
          entry.parentUuid = progressBridge.get(entry.parentUuid) ?? null
        }
        // messages.set 写入新的状态值，使共享工具后续读取保持一致。
        messages.set(entry.uuid, entry)
        // Compact boundary: prior marble-origami-commit entries reference
        // messages that won't be in the post-boundary chain. The >5MB
        // backward-scan path discards them naturally by never reading the
        // pre-boundary bytes; the <5MB path reads everything, so discard
        // here. Without this, getStats().collapsedSpans in /context
        // overcounts (projectView silently skips the stale commits but
        // they're still in the log).
        // 满足 `isCompactBoundaryMessage(entry)` 时，共享工具执行该分支。
        if (isCompactBoundaryMessage(entry)) {
          // contextCollapseCommits 集合被清空，共享工具从干净状态继续。
          contextCollapseCommits.length = 0
          // contextCollapseSnapshot更新为 `undefined`，确保共享工具后续读取最新状态。
          contextCollapseSnapshot = undefined
        }
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'summary' && entry.leafUuid) {`，完成这一小步状态转换。
      } else if (entry.type === 'summary' && entry.leafUuid) {
        // summaries.set 写入新的状态值，使共享工具后续读取保持一致。
        summaries.set(entry.leafUuid, entry.summary)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'custom-title' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'custom-title' && entry.sessionId) {
        // customTitles.set 写入新的状态值，使共享工具后续读取保持一致。
        customTitles.set(entry.sessionId, entry.customTitle)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'tag' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'tag' && entry.sessionId) {
        // tags.set 写入新的状态值，使共享工具后续读取保持一致。
        tags.set(entry.sessionId, entry.tag)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-name' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'agent-name' && entry.sessionId) {
        // agentNames.set 写入新的状态值，使共享工具后续读取保持一致。
        agentNames.set(entry.sessionId, entry.agentName)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-color' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'agent-color' && entry.sessionId) {
        // agentColors.set 写入新的状态值，使共享工具后续读取保持一致。
        agentColors.set(entry.sessionId, entry.agentColor)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'agent-setting' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'agent-setting' && entry.sessionId) {
        // agentSettings.set 写入新的状态值，使共享工具后续读取保持一致。
        agentSettings.set(entry.sessionId, entry.agentSetting)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'mode' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'mode' && entry.sessionId) {
        // modes.set 写入新的状态值，使共享工具后续读取保持一致。
        modes.set(entry.sessionId, entry.mode)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'worktree-state' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'worktree-state' && entry.sessionId) {
        // worktreeStates.set 写入新的状态值，使共享工具后续读取保持一致。
        worktreeStates.set(entry.sessionId, entry.worktreeSession)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'pr-link' && entry.sessionId) {`，完成这一小步状态转换。
      } else if (entry.type === 'pr-link' && entry.sessionId) {
        // prNumbers.set 写入新的状态值，使共享工具后续读取保持一致。
        prNumbers.set(entry.sessionId, entry.prNumber)
        // prUrls.set 写入新的状态值，使共享工具后续读取保持一致。
        prUrls.set(entry.sessionId, entry.prUrl)
        // prRepositories.set 写入新的状态值，使共享工具后续读取保持一致。
        prRepositories.set(entry.sessionId, entry.prRepository)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'file-history-snapshot') {`，完成这一小步状态转换。
      } else if (entry.type === 'file-history-snapshot') {
        // fileHistorySnapshots.set 写入新的状态值，使共享工具后续读取保持一致。
        fileHistorySnapshots.set(entry.messageId, entry)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'attribution-snapshot') {`，完成这一小步状态转换。
      } else if (entry.type === 'attribution-snapshot') {
        // attributionSnapshots.set 写入新的状态值，使共享工具后续读取保持一致。
        attributionSnapshots.set(entry.messageId, entry)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'content-replacement') {`，完成这一小步状态转换。
      } else if (entry.type === 'content-replacement') {
        // Subagent decisions key by agentId (sidechain resume); main-thread
        // decisions key by sessionId (/resume).
        // 满足 `entry.agentId` 时，共享工具执行该分支。
        if (entry.agentId) {
          // existing读取`agentContentReplacements.get`，供共享工具后续处理使用。
          const existing = agentContentReplacements.get(entry.agentId) ?? []
          // agentContentReplacements.set 写入新的状态值，使共享工具后续读取保持一致。
          agentContentReplacements.set(entry.agentId, existing)
          // existing追加新条目，保持收集顺序与输入顺序一致。
          existing.push(...entry.replacements)
        } else {
          // existing读取`contentReplacements.get`，供共享工具后续处理使用。
          const existing = contentReplacements.get(entry.sessionId) ?? []
          // contentReplacements.set 写入新的状态值，使共享工具后续读取保持一致。
          contentReplacements.set(entry.sessionId, existing)
          // existing追加新条目，保持收集顺序与输入顺序一致。
          existing.push(...entry.replacements)
        }
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'marble-origami-commit') {`，完成这一小步状态转换。
      } else if (entry.type === 'marble-origami-commit') {
        // contextCollapseCommits 集合追加新条目，保持收集顺序与输入顺序一致。
        contextCollapseCommits.push(entry)
      // 共享工具 session Storage在这里处理 `} else if (entry.type === 'marble-origami-snapshot') {`，完成这一小步状态转换。
      } else if (entry.type === 'marble-origami-snapshot') {
        // contextCollapseSnapshot更新为 `entry`，确保共享工具后续读取最新状态。
        contextCollapseSnapshot = entry
      }
    }
  } catch {
    // File doesn't exist or can't be read
  }

  // 调用 applyPreservedSegmentRelinks，触发共享工具此处需要的副作用。
  applyPreservedSegmentRelinks(messages)
  // 调用 applySnipRemovals，触发共享工具此处需要的副作用。
  applySnipRemovals(messages)

  // Compute leaf UUIDs once at load time
  // Only user/assistant messages should be considered as leaves for anchoring resume.
  // Other message types (system, attachment) are metadata or auxiliary and shouldn't
  // anchor a conversation chain.
  //
  // We use standard parent relationship for main chain detection, but also need to
  // handle cases where the last message is a system/metadata message.
  // For each conversation chain (identified by following parent links), the leaf
  // is the most recent user/assistant message.
  // allMessages 消息数据保存`messages.values`，供共享工具后续处理使用。
  const allMessages = [...messages.values()]

  // Standard leaf computation using parent relationships
  // parentUuids 集合保存`Set`，供共享工具后续处理使用。
  const parentUuids = new Set(
    allMessages
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(msg => msg.parentUuid)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((uuid): uuid is UUID => uuid !== null),
  )

  // Find all terminal messages (messages with no children)
  // terminalMessages 消息数据筛选`allMessages.filter`，供共享工具后续处理使用。
  const terminalMessages = allMessages.filter(msg => !parentUuids.has(msg.uuid))

  // leafUuids 集合构建`new Set<UUID>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const leafUuids = new Set<UUID>()
  // hasCycle标记共享工具 session Storage是否启用对应路径。
  let hasCycle = false

  // 满足 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_pebble_leaf_prune', false)` 时，共享工具执行该分支。
  if (getFeatureValue_CACHED_MAY_BE_STALE('tengu_pebble_leaf_prune', false)) {
    // Build a set of UUIDs that have user/assistant children
    // (these are mid-conversation nodes, not dead ends)
    // hasUserAssistantChild标记共享工具 session Storage是否启用对应路径。
    const hasUserAssistantChild = new Set<UUID>()
    // 按顺序遍历 `allMessages` 中的消息，逐个交给共享工具处理。
    for (const msg of allMessages) {
      // 只有 `msg.parentUuid && (msg.type === 'user' || msg.type === 'assistant')` 满足时，共享工具才执行该分支。
      if (msg.parentUuid && (msg.type === 'user' || msg.type === 'assistant')) {
        // 调用 hasUserAssistantChild.add，触发共享工具此处需要的副作用。
        hasUserAssistantChild.add(msg.parentUuid)
      }
    }

    // For each terminal message, walk back to find the nearest user/assistant ancestor.
    // Skip ancestors that already have user/assistant children - those are mid-conversation
    // nodes where the conversation continued (e.g., an assistant tool_use message whose
    // progress child is terminal, but whose tool_result child continues the conversation).
    // 按顺序遍历 `terminalMessages` 中的terminal，逐个交给共享工具处理。
    for (const terminal of terminalMessages) {
      // seen 命名 `new Set<UUID>()`，让后续代码直接表达这个值的用途。
      const seen = new Set<UUID>()
      // current 命名 `terminal`，让后续代码直接表达这个值的用途。
      let current: TranscriptMessage | undefined = terminal
      // while 使用 current 完成共享工具里的对应操作。
      while (current) {
        // 满足 `seen.has(current.uuid)` 时，共享工具执行该分支。
        if (seen.has(current.uuid)) {
          // hasCycle更新为 `true`，确保共享工具后续读取最新状态。
          hasCycle = true
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 调用 seen.add，触发共享工具此处需要的副作用。
        seen.add(current.uuid)
        // 只有 `current.type === 'user' || current.type === 'assi` 满足时，共享工具才执行该分支。
        if (current.type === 'user' || current.type === 'assistant') {
          // 满足 `!hasUserAssistantChild.has(current.uuid)` 时，共享工具执行该分支。
          if (!hasUserAssistantChild.has(current.uuid)) {
            // 调用 leafUuids.add，触发共享工具此处需要的副作用。
            leafUuids.add(current.uuid)
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // current更新为 `current.parentUuid`，确保共享工具后续读取最新状态。
        current = current.parentUuid
          ? messages.get(current.parentUuid)
          : undefined
      }
    }
  } else {
    // Original leaf computation: walk back from terminal messages to find
    // the nearest user/assistant ancestor unconditionally
    // 按顺序遍历 `terminalMessages` 中的terminal，逐个交给共享工具处理。
    for (const terminal of terminalMessages) {
      // seen 命名 `new Set<UUID>()`，让后续代码直接表达这个值的用途。
      const seen = new Set<UUID>()
      // current 命名 `terminal`，让后续代码直接表达这个值的用途。
      let current: TranscriptMessage | undefined = terminal
      // while 使用 current 完成共享工具里的对应操作。
      while (current) {
        // 满足 `seen.has(current.uuid)` 时，共享工具执行该分支。
        if (seen.has(current.uuid)) {
          // hasCycle更新为 `true`，确保共享工具后续读取最新状态。
          hasCycle = true
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 调用 seen.add，触发共享工具此处需要的副作用。
        seen.add(current.uuid)
        // 只有 `current.type === 'user' || current.type === 'assi` 满足时，共享工具才执行该分支。
        if (current.type === 'user' || current.type === 'assistant') {
          // 调用 leafUuids.add，触发共享工具此处需要的副作用。
          leafUuids.add(current.uuid)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // current更新为 `current.parentUuid`，确保共享工具后续读取最新状态。
        current = current.parentUuid
          ? messages.get(current.parentUuid)
          : undefined
      }
    }
  }

  // 满足 `hasCycle` 时，共享工具执行该分支。
  if (hasCycle) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_transcript_parent_cycle', {})
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages,
    summaries,
    customTitles,
    tags,
    agentNames,
    agentColors,
    agentSettings,
    prNumbers,
    prUrls,
    prRepositories,
    modes,
    worktreeStates,
    fileHistorySnapshots,
    attributionSnapshots,
    contentReplacements,
    agentContentReplacements,
    contextCollapseCommits,
    contextCollapseSnapshot,
    leafUuids,
  }
}

/**
 * Loads all messages, summaries, file history snapshots, and attribution snapshots from a specific session file.
 */
// loadSessionFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadSessionFile(sessionId: UUID): Promise<{
  messages: Map<UUID, TranscriptMessage>
  summaries: Map<UUID, string>
  customTitles: Map<UUID, string>
  tags: Map<UUID, string>
  agentSettings: Map<UUID, string>
  worktreeStates: Map<UUID, PersistedWorktreeSession | null>
  fileHistorySnapshots: Map<UUID, FileHistorySnapshotMessage>
  attributionSnapshots: Map<UUID, AttributionSnapshotMessage>
  contentReplacements: Map<UUID, ContentReplacementRecord[]>
  contextCollapseCommits: ContextCollapseCommitEntry[]
  contextCollapseSnapshot: ContextCollapseSnapshotEntry | undefined
}> {
  // sessionFile 会话数据格式化`join`，供共享工具后续处理使用。
  const sessionFile = join(
    getSessionProjectDir() ?? getProjectDir(getOriginalCwd()),
    `${sessionId}.jsonl`,
  )
  // 返回 `loadTranscriptFile(sessionFile)`，作为共享工具这次计算的结果。
  return loadTranscriptFile(sessionFile)
}

/**
 * Gets message UUIDs for a specific session without loading all sessions.
 * Memoized to avoid re-reading the same session file multiple times.
 */
// getSessionMessages 会话数据保存`memoize`，供共享工具后续处理使用。
const getSessionMessages = memoize(
  async (sessionId: UUID): Promise<Set<UUID>> => {
    // 从 `await loadSessionFile(sessionId)` 解构 messages，减少共享工具 session Storage对同一对象的重复访问。
    const { messages } = await loadSessionFile(sessionId)
    // 返回 `new Set(messages.keys())`，作为共享工具这次计算的结果。
    return new Set(messages.keys())
  },
  // 这个回调绑定到 (sessionId: UUID) => sessionId,，负责共享工具在该局部场景下的响应。
  (sessionId: UUID) => sessionId,
)

/**
 * Clear the memoized session messages cache.
 * Call after compaction when old message UUIDs are no longer valid.
 */
// clearSessionMessagesCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionMessagesCache(): void {
  // 调用 getSessionMessages.cache.clear?.()，完成这一处局部操作。
  getSessionMessages.cache.clear?.()
}

/**
 * Check if a message UUID exists in the session storage
 */
// doesMessageExistInSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function doesMessageExistInSession(
  sessionId: UUID,
  messageUuid: UUID,
): Promise<boolean> {
  // messageSet 消息数据读取`getSessionMessages`，供共享工具后续处理使用。
  const messageSet = await getSessionMessages(sessionId)
  // 返回 `messageSet.has(messageUuid)`，作为共享工具这次计算的结果。
  return messageSet.has(messageUuid)
}

// getLastSessionLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLastSessionLog(
  sessionId: UUID,
): Promise<LogOption | null> {
  // Single read: load all session data at once instead of reading the file twice
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages,
    summaries,
    customTitles,
    tags,
    agentSettings,
    worktreeStates,
    fileHistorySnapshots,
    attributionSnapshots,
    contentReplacements,
    contextCollapseCommits,
    contextCollapseSnapshot,
  } = await loadSessionFile(sessionId)
  // 满足 `messages.size === 0` 时，共享工具执行该分支。
  if (messages.size === 0) return null
  // Prime getSessionMessages cache so recordTranscript (called after REPL
  // mount on --resume) skips a second full file load. -170~227ms on large sessions.
  // Guard: only prime if cache is empty. Mid-session callers (e.g. IssueFeedback)
  // may call getLastSessionLog on the current session — overwriting a live cache
  // with a stale disk snapshot would lose unflushed UUIDs and break dedup.
  // 满足 `!getSessionMessages.cache.has(sessionId)` 时，共享工具执行该分支。
  if (!getSessionMessages.cache.has(sessionId)) {
    // getSessionMessages.cache.set 写入新的状态值，使共享工具后续读取保持一致。
    getSessionMessages.cache.set(
      sessionId,
      Promise.resolve(new Set(messages.keys())),
    )
  }

  // Find the most recent non-sidechain message
  // lastMessage 消息数据筛选`findLatestMessage`，供共享工具后续处理使用。
  const lastMessage = findLatestMessage(messages.values(), m => !m.isSidechain)
  // lastMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastMessage) return null

  // Build the transcript chain from the last message
  // transcript构建`buildConversationChain`，供共享工具后续处理使用。
  const transcript = buildConversationChain(messages, lastMessage)

  // summary读取`summaries.get`，供共享工具后续处理使用。
  const summary = summaries.get(lastMessage.uuid)
  // customTitle 标题读取`customTitles.get`，供共享工具后续处理使用。
  const customTitle = customTitles.get(lastMessage.sessionId as UUID)
  // tag读取`tags.get`，供共享工具后续处理使用。
  const tag = tags.get(lastMessage.sessionId as UUID)
  // agentSetting读取`agentSettings.get`，供共享工具后续处理使用。
  const agentSetting = agentSettings.get(sessionId)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...convertToLogOption(
      transcript,
      0,
      summary,
      customTitle,
      buildFileHistorySnapshotChain(fileHistorySnapshots, transcript),
      tag,
      getTranscriptPathForSession(sessionId),
      buildAttributionSnapshotChain(attributionSnapshots, transcript),
      agentSetting,
      contentReplacements.get(sessionId) ?? [],
    ),
    worktreeSession: worktreeStates.get(sessionId),
    contextCollapseCommits: contextCollapseCommits.filter(
      // e更新为 `> e.sessionId === sessionId`，确保共享工具后续读取最新状态。
      e => e.sessionId === sessionId,
    ),
    contextCollapseSnapshot:
      contextCollapseSnapshot?.sessionId === sessionId
        ? contextCollapseSnapshot
        : undefined,
  }
}

/**
 * Loads the list of message logs
 * @param limit Optional limit on number of session files to load
 * @returns List of message logs sorted by date
 */
// loadMessageLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadMessageLogs(limit?: number): Promise<LogOption[]> {
  // sessionLogs 会话数据读取`fetchLogs`，供共享工具后续处理使用。
  const sessionLogs = await fetchLogs(limit)
  // fetchLogs returns lite (stat-only) logs — enrich them to get metadata.
  // enrichLogs already filters out sidechains, empty sessions, etc.
  // 从 `await enrichLogs(` 解构 logs，减少共享工具 session Storage对同一对象的重复访问。
  const { logs: enriched } = await enrichLogs(
    sessionLogs,
    0,
    sessionLogs.length,
  )

  // enrichLogs returns fresh unshared objects — mutate in place to avoid
  // re-spreading every 30-field LogOption just to renumber the index.
  // sorted保存`sortLogs`，供共享工具后续处理使用。
  const sorted = sortLogs(enriched)
  // 调用 sorted.forEach，触发共享工具此处需要的副作用。
  sorted.forEach((log, i) => {
    // 取值更新为 `i`，确保共享工具后续读取最新状态。
    log.value = i
  })
  // 返回 `sorted`，作为共享工具这次计算的结果。
  return sorted
}

/**
 * Loads message logs from all project directories.
 * @param limit Optional limit on number of session files to load per project (used when no index exists)
 * @returns List of message logs sorted by date
 */
// loadAllProjectsMessageLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadAllProjectsMessageLogs(
  limit?: number,
  options?: { skipIndex?: boolean; initialEnrichCount?: number },
): Promise<LogOption[]> {
  // 满足 `options?.skipIndex` 时，共享工具执行该分支。
  if (options?.skipIndex) {
    // Load all sessions with full message data (e.g. for /insights analysis)
    // 返回 `loadAllProjectsMessageLogsFull(limit)`，作为共享工具这次计算的结果。
    return loadAllProjectsMessageLogsFull(limit)
  }
  // 结果读取`loadAllProjectsMessageLogsProgressive`，供共享工具后续处理使用。
  const result = await loadAllProjectsMessageLogsProgressive(
    limit,
    options?.initialEnrichCount ?? INITIAL_ENRICH_COUNT,
  )
  // 返回 `result.logs`，作为共享工具这次计算的结果。
  return result.logs
}

// loadAllProjectsMessageLogsFull 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadAllProjectsMessageLogsFull(
  limit?: number,
): Promise<LogOption[]> {
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()

  // dirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let dirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    dirents = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // projectDirs 集合保存`dirents`，供后续判断或组装使用。
  const projectDirs = dirents
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(dirent => dirent.isDirectory())
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(dirent => join(projectsDir, dirent.name))

  // logsPerProject保存`Promise.all`，供共享工具后续处理使用。
  const logsPerProject = await Promise.all(
    // 调用 projectDirs.map，触发共享工具此处需要的副作用。
    projectDirs.map(projectDir => getLogsWithoutIndex(projectDir, limit)),
  )
  // allLogs 集合保存`logsPerProject.flat`，供共享工具后续处理使用。
  const allLogs = logsPerProject.flat()

  // Deduplicate — same session+leaf can appear in multiple project dirs.
  // This path creates one LogOption per leaf, so use sessionId+leafUuid key.
  // deduped构建`new Map<string, LogOption>()`，供后续判断或组装使用。
  const deduped = new Map<string, LogOption>()
  // 按顺序遍历 `allLogs` 中的log，逐个交给共享工具处理。
  for (const log of allLogs) {
    // key 命名 ``${log.sessionId ?? ''}:${log.leafUuid ?? ''}``，让后续代码直接表达这个值的用途。
    const key = `${log.sessionId ?? ''}:${log.leafUuid ?? ''}`
    // existing读取`deduped.get`，供共享工具后续处理使用。
    const existing = deduped.get(key)
    // 只有 `!existing || log.modified.getTime() > existing.modified.getTime()` 满足时，共享工具才执行该分支。
    if (!existing || log.modified.getTime() > existing.modified.getTime()) {
      // deduped.set 写入新的状态值，使共享工具后续读取保持一致。
      deduped.set(key, log)
    }
  }

  // deduped values are fresh from getLogsWithoutIndex — safe to mutate
  // sorted保存`sortLogs`，供共享工具后续处理使用。
  const sorted = sortLogs([...deduped.values()])
  // 调用 sorted.forEach，触发共享工具此处需要的副作用。
  sorted.forEach((log, i) => {
    // 取值更新为 `i`，确保共享工具后续读取最新状态。
    log.value = i
  })
  // 返回 `sorted`，作为共享工具这次计算的结果。
  return sorted
}

// loadAllProjectsMessageLogsProgressive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadAllProjectsMessageLogsProgressive(
  limit?: number,
  initialEnrichCount: number = INITIAL_ENRICH_COUNT,
): Promise<SessionLogResult> {
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()

  // dirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let dirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    dirents = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { logs: [], allStatLogs: [], nextIndex: 0 }
  }

  // projectDirs 集合保存`dirents`，供后续判断或组装使用。
  const projectDirs = dirents
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(dirent => dirent.isDirectory())
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(dirent => join(projectsDir, dirent.name))

  // rawLogs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rawLogs: LogOption[] = []
  // 按顺序遍历 `projectDirs` 中的projectDir，逐个交给共享工具处理。
  for (const projectDir of projectDirs) {
    // rawLogs 集合追加新条目，保持收集顺序与输入顺序一致。
    rawLogs.push(...(await getSessionFilesLite(projectDir, limit)))
  }
  // Deduplicate — same session can appear in multiple project dirs
  // sorted保存`deduplicateLogsBySessionId`，供共享工具后续处理使用。
  const sorted = deduplicateLogsBySessionId(rawLogs)

  // 从 `await enrichLogs(sorted, 0, initialEnrichCount)` 解构 logs、nextIndex，减少共享工具 session Storage对同一对象的重复访问。
  const { logs, nextIndex } = await enrichLogs(sorted, 0, initialEnrichCount)

  // enrichLogs returns fresh unshared objects — safe to mutate in place
  // 调用 logs.forEach，触发共享工具此处需要的副作用。
  logs.forEach((log, i) => {
    // 取值更新为 `i`，确保共享工具后续读取最新状态。
    log.value = i
  })
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { logs, allStatLogs: sorted, nextIndex }
}

/**
 * Loads message logs from all worktrees of the same git repository.
 * Falls back to loadMessageLogs if no worktrees provided.
 *
 * Uses pure filesystem metadata for fast loading.
 *
 * @param worktreePaths Array of worktree paths (from getWorktreePaths)
 * @param limit Optional limit on number of session files to load per project
 * @returns List of message logs sorted by date
 */
/**
 * Result of loading session logs with progressive enrichment support.
 */
// SessionLogResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionLogResult = {
  /** Enriched logs ready for display */
  logs: LogOption[]
  /** Full stat-only list for progressive loading (call enrichLogs to get more) */
  allStatLogs: LogOption[]
  /** Index into allStatLogs where progressive loading should continue from */
  nextIndex: number
}

// loadSameRepoMessageLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadSameRepoMessageLogs(
  worktreePaths: string[],
  limit?: number,
  initialEnrichCount: number = INITIAL_ENRICH_COUNT,
): Promise<LogOption[]> {
  // 结果读取`loadSameRepoMessageLogsProgressive`，供共享工具后续处理使用。
  const result = await loadSameRepoMessageLogsProgressive(
    worktreePaths,
    limit,
    initialEnrichCount,
  )
  // 返回 `result.logs`，作为共享工具这次计算的结果。
  return result.logs
}

// loadSameRepoMessageLogsProgressive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadSameRepoMessageLogsProgressive(
  worktreePaths: string[],
  limit?: number,
  initialEnrichCount: number = INITIAL_ENRICH_COUNT,
): Promise<SessionLogResult> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `/resume: loading sessions for cwd=${getOriginalCwd()}, worktrees=[${worktreePaths.join(', ')}]`,
  )
  // allStatLogs 集合读取`getStatOnlyLogsForWorktrees`，供共享工具后续处理使用。
  const allStatLogs = await getStatOnlyLogsForWorktrees(worktreePaths, limit)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`/resume: found ${allStatLogs.length} session files on disk`)

  // 从 `await enrichLogs(` 解构 logs、nextIndex，减少共享工具 session Storage对同一对象的重复访问。
  const { logs, nextIndex } = await enrichLogs(
    allStatLogs,
    0,
    initialEnrichCount,
  )

  // enrichLogs returns fresh unshared objects — safe to mutate in place
  // 调用 logs.forEach，触发共享工具此处需要的副作用。
  logs.forEach((log, i) => {
    // 取值更新为 `i`，确保共享工具后续读取最新状态。
    log.value = i
  })
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { logs, allStatLogs, nextIndex }
}

/**
 * Gets stat-only logs for worktree paths (no file reads).
 */
// getStatOnlyLogsForWorktrees 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getStatOnlyLogsForWorktrees(
  worktreePaths: string[],
  limit?: number,
): Promise<LogOption[]> {
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()

  // 满足 `worktreePaths.length <= 1` 时，共享工具执行该分支。
  if (worktreePaths.length <= 1) {
    // cwd读取`getOriginalCwd`，供共享工具后续处理使用。
    const cwd = getOriginalCwd()
    // projectDir读取`getProjectDir`，供共享工具后续处理使用。
    const projectDir = getProjectDir(cwd)
    // 返回 `getSessionFilesLite(projectDir, undefined, cwd)`，作为共享工具这次计算的结果。
    return getSessionFilesLite(projectDir, undefined, cwd)
  }

  // On Windows, drive letter case can differ between git worktree list
  // output (e.g. C:/Users/...) and how paths were stored in project
  // directories (e.g. c:/Users/...). Use case-insensitive comparison.
  // caseInsensitive标记共享工具 session Storage是否启用对应路径。
  const caseInsensitive = process.platform === 'win32'

  // Sort worktree paths by sanitized prefix length (longest first) so
  // more specific matches take priority over shorter ones. Without this,
  // a short prefix like -code-myrepo could match -code-myrepo-worktree1
  // before the longer, more specific prefix gets a chance.
  // indexed 索引派生`worktreePaths.map`，供共享工具后续处理使用。
  const indexed = worktreePaths.map(wt => {
    // sanitized保存`sanitizePath`，供共享工具后续处理使用。
    const sanitized = sanitizePath(wt)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      path: wt,
      prefix: caseInsensitive ? sanitized.toLowerCase() : sanitized,
    }
  })
  // 调用 indexed.sort，触发共享工具此处需要的副作用。
  indexed.sort((a, b) => b.prefix.length - a.prefix.length)

  // allLogs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allLogs: LogOption[] = []
  // seenDirs 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const seenDirs = new Set<string>()

  // allDirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let allDirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // allDirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    allDirents = await readdir(projectsDir, { withFileTypes: true })
  } catch (e) {
    // Fall back to current project
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to read projects dir ${projectsDir}, falling back to current project: ${e}`,
    )
    // projectDir读取`getProjectDir`，供共享工具后续处理使用。
    const projectDir = getProjectDir(getOriginalCwd())
    // 返回 `getSessionFilesLite(projectDir, limit, getOriginalCwd())`，作为共享工具这次计算的结果。
    return getSessionFilesLite(projectDir, limit, getOriginalCwd())
  }

  // 按顺序遍历 `allDirents` 中的dirent，逐个交给共享工具处理。
  for (const dirent of allDirents) {
    // 满足 `!dirent.isDirectory()` 时，共享工具执行该分支。
    if (!dirent.isDirectory()) continue
    // dirName保存`name.toLowerCase`，供共享工具后续处理使用。
    const dirName = caseInsensitive ? dirent.name.toLowerCase() : dirent.name
    // 满足 `seenDirs.has(dirName)` 时，共享工具执行该分支。
    if (seenDirs.has(dirName)) continue

    // 循环处理 `const { path: wtPath, prefix } of indexed`，让共享工具逐项把同类条目按顺序走完。
    for (const { path: wtPath, prefix } of indexed) {
      // 只有 `dirName === prefix || dirName.startsWith(prefix + '-')` 满足时，共享工具才执行该分支。
      if (dirName === prefix || dirName.startsWith(prefix + '-')) {
        // 调用 seenDirs.add，触发共享工具此处需要的副作用。
        seenDirs.add(dirName)
        // allLogs 集合追加新条目，保持收集顺序与输入顺序一致。
        allLogs.push(
          ...(await getSessionFilesLite(
            join(projectsDir, dirent.name),
            undefined,
            wtPath,
          )),
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  }

  // Deduplicate by sessionId — the same session can appear in multiple
  // worktree project dirs. Keep the entry with the newest modified time.
  // 返回 `deduplicateLogsBySessionId(allLogs)`，作为共享工具这次计算的结果。
  return deduplicateLogsBySessionId(allLogs)
}

/**
 * Retrieves the transcript for a specific agent by agentId.
 * Directly loads the agent-specific transcript file.
 * @param agentId The agent ID to search for
 * @returns The conversation chain and budget replacement records for the agent,
 *          or null if not found
 */
// getAgentTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAgentTranscript(agentId: AgentId): Promise<{
  messages: Message[]
  contentReplacements: ContentReplacementRecord[]
} | null> {
  // agentFile 文件数据读取`getAgentTranscriptPath`，供共享工具后续处理使用。
  const agentFile = getAgentTranscriptPath(agentId)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 共享工具 session Storage先整理这一处局部数据，后续分支可以直接读取。
    const { messages, agentContentReplacements } =
      await loadTranscriptFile(agentFile)

    // Find messages with matching agentId
    // agentMessages 消息数据保存`Array.from`，供共享工具后续处理使用。
    const agentMessages = Array.from(messages.values()).filter(
      // 消息更新为 `> msg.agentId === agentId && msg.isSidechain`，确保共享工具后续读取最新状态。
      msg => msg.agentId === agentId && msg.isSidechain,
    )

    // agentMessages 消息数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (agentMessages.length === 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Find the most recent leaf message with this agentId
    // parentUuids 集合保存`Set`，供共享工具后续处理使用。
    const parentUuids = new Set(agentMessages.map(msg => msg.parentUuid))
    // leafMessage 消息数据筛选`findLatestMessage`，供共享工具后续处理使用。
    const leafMessage = findLatestMessage(
      agentMessages,
      // 消息更新为 `> !parentUuids.has(msg.uuid)`，确保共享工具后续读取最新状态。
      msg => !parentUuids.has(msg.uuid),
    )

    // leafMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!leafMessage) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Build the conversation chain
    // transcript构建`buildConversationChain`，供共享工具后续处理使用。
    const transcript = buildConversationChain(messages, leafMessage)

    // Filter to only include messages with this agentId
    // agentTranscript筛选`transcript.filter`，供共享工具后续处理使用。
    const agentTranscript = transcript.filter(msg => msg.agentId === agentId)

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      // Convert TranscriptMessage[] to Message[]
      messages: agentTranscript.map(
        // 这个回调绑定到 ({ isSidechain, parentUuid, ...msg }) => msg,，负责共享工具在该局部场景下的响应。
        ({ isSidechain, parentUuid, ...msg }) => msg,
      ),
      contentReplacements: agentContentReplacements.get(agentId) ?? [],
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Extract agent IDs from progress messages in the conversation.
 * Agent/skill progress messages have type 'progress' with data.type
 * 'agent_progress' or 'skill_progress' and data.agentId.
 * This captures sync agents that emit progress messages during execution.
 */
// extractAgentIdsFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractAgentIdsFromMessages(messages: Message[]): string[] {
  // agentIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agentIds: string[] = []

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      message.type === 'progress' &&
      message.data &&
      typeof message.data === 'object' &&
      'type' in message.data &&
      (message.data.type === 'agent_progress' ||
        message.data.type === 'skill_progress') &&
      'agentId' in message.data &&
      typeof message.data.agentId === 'string'
    ) {
      // agentIds 集合追加新条目，保持收集顺序与输入顺序一致。
      agentIds.push(message.data.agentId)
    }
  }

  // 返回 `uniq(agentIds)`，作为共享工具这次计算的结果。
  return uniq(agentIds)
}

/**
 * Extract teammate transcripts directly from AppState tasks.
 * In-process teammates store their messages in task.messages,
 * which is more reliable than loading from disk since each teammate turn
 * uses a random agentId for transcript storage.
 */
// extractTeammateTranscriptsFromTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractTeammateTranscriptsFromTasks(tasks: {
  [taskId: string]: {
    type: string
    identity?: { agentId: string }
    messages?: Message[]
  }
}): { [agentId: string]: Message[] } {
  // transcripts 集合 从空对象开始收集键值，后续按名称补齐内容。
  const transcripts: { [agentId: string]: Message[] } = {}

  // 逐项读取 `Object.values(tasks)` 中的task，按输入顺序推进共享工具。
  for (const task of Object.values(tasks)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      task.type === 'in_process_teammate' &&
      task.identity?.agentId &&
      task.messages &&
      task.messages.length > 0
    ) {
      // agentId更新为 `task.messages`，确保共享工具 session Storage后续读取最新状态。
      transcripts[task.identity.agentId] = task.messages
    }
  }

  // 返回 `transcripts`，作为共享工具这次计算的结果。
  return transcripts
}

/**
 * Load subagent transcripts for the given agent IDs
 */
// loadSubagentTranscripts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadSubagentTranscripts(
  agentIds: string[],
): Promise<{ [agentId: string]: Message[] }> {
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    agentIds.map(async agentId => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果读取`getAgentTranscript`，供共享工具后续处理使用。
        const result = await getAgentTranscript(asAgentId(agentId))
        // 只有 `result && result.messages.length > 0` 满足时，共享工具才执行该分支。
        if (result && result.messages.length > 0) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { agentId, transcript: result.messages }
        }
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      } catch {
        // Skip if transcript can't be loaded
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // transcripts 集合 从空对象开始收集键值，后续按名称补齐内容。
  const transcripts: { [agentId: string]: Message[] } = {}
  // 按顺序遍历 `results` 中的结果，逐个交给共享工具处理。
  for (const result of results) {
    // 满足 `result` 时，共享工具执行该分支。
    if (result) {
      // agentId更新为 `result.transcript`，确保共享工具 session Storage后续读取最新状态。
      transcripts[result.agentId] = result.transcript
    }
  }
  // 返回 `transcripts`，作为共享工具这次计算的结果。
  return transcripts
}

// Globs the session's subagents dir directly — unlike AppState.tasks, this survives task eviction.
// loadAllSubagentTranscriptsFromDisk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadAllSubagentTranscriptsFromDisk(): Promise<{
  [agentId: string]: Message[]
}> {
  // subagentsDir格式化`join`，供共享工具后续处理使用。
  const subagentsDir = join(
    getSessionProjectDir() ?? getProjectDir(getOriginalCwd()),
    getSessionId(),
    'subagents',
  )
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(subagentsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    entries = await readdir(subagentsDir, { withFileTypes: true })
  } catch {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }
  // Filename format is the inverse of getAgentTranscriptPath() — keep in sync.
  // agentIds 集合保存`entries`，供后续判断或组装使用。
  const agentIds = entries
    .filter(
      // d更新为 `>`，确保共享工具后续读取最新状态。
      d =>
        d.isFile() && d.name.startsWith('agent-') && d.name.endsWith('.jsonl'),
    )
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(d => d.name.slice('agent-'.length, -'.jsonl'.length))
  // 返回 `loadSubagentTranscripts(agentIds)`，作为共享工具这次计算的结果。
  return loadSubagentTranscripts(agentIds)
}

// Exported so useLogMessages can sync-compute the last loggable uuid
// without awaiting recordTranscript's return value (race-free hint tracking).
// isLoggableMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLoggableMessage(m: Message): boolean {
  // 当 `m.type` 匹配 `'progress'` 时，共享工具执行对应分支。
  if (m.type === 'progress') return false
  // IMPORTANT: We deliberately filter out most attachments for non-ants because
  // they have sensitive info for training that we don't want exposed to the public.
  // When enabled, we allow hook_additional_context through since it contains
  // user-configured hook output that is useful for session context on resume.
  // 当 `m.type` 匹配 `'attachment' && getUserType...` 时，共享工具执行对应分支。
  if (m.type === 'attachment' && getUserType() !== 'ant') {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      m.attachment.type === 'hook_additional_context' &&
      isEnvTruthy(process.env.CLAUDE_CODE_SAVE_HOOK_ADDITIONAL_CONTEXT)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// collectReplIds 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectReplIds(messages: readonly Message[]): Set<string> {
  // ids 集合构建`new Set<string>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const ids = new Set<string>()
  // 按顺序遍历 `messages` 中的m，逐个交给共享工具处理。
  for (const m of messages) {
    // 只有 `m.type === 'assistant' && Array.isArray(m.message.content)` 满足时，共享工具才执行该分支。
    if (m.type === 'assistant' && Array.isArray(m.message.content)) {
      // 按顺序遍历 `m.message.content` 中的b，逐个交给共享工具处理。
      for (const b of m.message.content) {
        // 只有 `b.type === 'tool_use' && b.name === REPL_TOOL_NAME` 满足时，共享工具才执行该分支。
        if (b.type === 'tool_use' && b.name === REPL_TOOL_NAME) {
          // 调用 ids.add，触发共享工具此处需要的副作用。
          ids.add(b.id)
        }
      }
    }
  }
  // 返回 `ids`，作为共享工具这次计算的结果。
  return ids
}

/**
 * For external users, make REPL invisible in the persisted transcript: strip
 * REPL tool_use/tool_result pairs and promote isVirtual messages to real. On
 * --resume the model then sees a coherent native-tool-call history (assistant
 * called Bash, got result, called Read, got result) without the REPL wrapper.
 * Ant transcripts keep the wrapper so /share training data sees REPL usage.
 *
 * replIds is pre-collected from the FULL session array, not the slice being
 * transformed — recordTranscript receives incremental slices where the REPL
 * tool_use (earlier render) and its tool_result (later render, after async
 * execution) land in separate calls. A fresh per-call Set would miss the id
 * and leave an orphaned tool_result on disk.
 */
// transformMessagesForExternalTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function transformMessagesForExternalTranscript(
  messages: Transcript,
  replIds: Set<string>,
): Transcript {
  // 返回 `messages.flatMap(m => {`，作为共享工具这次计算的结果。
  return messages.flatMap(m => {
    // 只有 `m.type === 'assistant' && Array.isArray(m.message.content)` 满足时，共享工具才执行该分支。
    if (m.type === 'assistant' && Array.isArray(m.message.content)) {
      // 文本内容保存`m.message.content`，供后续判断或组装使用。
      const content = m.message.content
      // hasRepl记录 `content.some` 是否成立，共享工具随后按该结果分支。
      const hasRepl = content.some(
        // b更新为 `> b.type === 'tool_use' && b.name === REPL_TOOL_NAME`，确保共享工具后续读取最新状态。
        b => b.type === 'tool_use' && b.name === REPL_TOOL_NAME,
      )
      // filtered保存`hasRepl`，供共享工具 session Storage后续判断或输出使用。
      const filtered = hasRepl
        ? content.filter(
            // b更新为 `> !(b.type === 'tool_use' && b.name === REPL_TOOL_NAME)`，确保共享工具后续读取最新状态。
            b => !(b.type === 'tool_use' && b.name === REPL_TOOL_NAME),
          )
        : content
      // filtered为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (filtered.length === 0) return []
      // 满足 `m.isVirtual` 时，共享工具执行该分支。
      if (m.isVirtual) {
        // 从 `m` 解构 isVirtual、其余 rest，减少共享工具 session Storage对同一对象的重复访问。
        const { isVirtual: _omit, ...rest } = m
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [{ ...rest, message: { ...m.message, content: filtered } }]
      }
      // `filtered` 与 `content` 不一致时刷新派生状态，避免使用过期结果。
      if (filtered !== content) {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [{ ...m, message: { ...m.message, content: filtered } }]
      }
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [m]
    }
    // 只有 `m.type === 'user' && Array.isArray(m.message.content)` 满足时，共享工具才执行该分支。
    if (m.type === 'user' && Array.isArray(m.message.content)) {
      // 文本内容保存`m.message.content`，供后续判断或组装使用。
      const content = m.message.content
      // hasRepl记录 `content.some` 是否成立，共享工具随后按该结果分支。
      const hasRepl = content.some(
        // b更新为 `> b.type === 'tool_result' && replIds.has(b.tool_use_id)`，确保共享工具后续读取最新状态。
        b => b.type === 'tool_result' && replIds.has(b.tool_use_id),
      )
      // filtered保存`hasRepl`，供共享工具 session Storage后续判断或输出使用。
      const filtered = hasRepl
        ? content.filter(
            // b更新为 `> !(b.type === 'tool_result' && replIds.has(b.tool_use_id...`，确保共享工具后续读取最新状态。
            b => !(b.type === 'tool_result' && replIds.has(b.tool_use_id)),
          )
        : content
      // filtered为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (filtered.length === 0) return []
      // 满足 `m.isVirtual` 时，共享工具执行该分支。
      if (m.isVirtual) {
        // 从 `m` 解构 isVirtual、其余 rest，减少共享工具 session Storage对同一对象的重复访问。
        const { isVirtual: _omit, ...rest } = m
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [{ ...rest, message: { ...m.message, content: filtered } }]
      }
      // `filtered` 与 `content` 不一致时刷新派生状态，避免使用过期结果。
      if (filtered !== content) {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [{ ...m, message: { ...m.message, content: filtered } }]
      }
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [m]
    }
    // string-content user, system, attachment
    // 只有 `'isVirtual' in m && m.isVirtual` 满足时，共享工具才执行该分支。
    if ('isVirtual' in m && m.isVirtual) {
      // 从 `m` 解构 isVirtual、其余 rest，减少共享工具 session Storage对同一对象的重复访问。
      const { isVirtual: _omit, ...rest } = m
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [rest]
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [m]
  }) as Transcript
}

// cleanMessagesForLogging 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cleanMessagesForLogging(
  messages: Message[],
  allMessages: readonly Message[] = messages,
): Transcript {
  // filtered筛选`messages.filter`，供共享工具后续处理使用。
  const filtered = messages.filter(isLoggableMessage) as Transcript
  // 返回 `getUserType() !== 'ant'`，作为共享工具这次计算的结果。
  return getUserType() !== 'ant'
    ? transformMessagesForExternalTranscript(
        filtered,
        collectReplIds(allMessages),
      )
    : filtered
}

/**
 * Gets a log by its index
 * @param index Index in the sorted list of logs (0-based)
 * @returns Log data or null if not found
 */
// getLogByIndex 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLogByIndex(index: number): Promise<LogOption | null> {
  // logs 集合读取`loadMessageLogs`，供共享工具后续处理使用。
  const logs = await loadMessageLogs()
  // 返回 `logs[index] || null`，作为共享工具这次计算的结果。
  return logs[index] || null
}

/**
 * Looks up unresolved tool uses in the transcript by tool_use_id.
 * Returns the assistant message containing the tool_use, or null if not found
 * or the tool call already has a tool_result.
 */
// findUnresolvedToolUse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findUnresolvedToolUse(
  toolUseId: string,
): Promise<AssistantMessage | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // transcriptPath 路径数据读取`getTranscriptPath`，供共享工具后续处理使用。
    const transcriptPath = getTranscriptPath()
    // 从 `await loadTranscriptFile(transcriptPath)` 解构 messages，减少共享工具 session Storage对同一对象的重复访问。
    const { messages } = await loadTranscriptFile(transcriptPath)

    // toolUseMessage 消息数据初始化为空值，后续分支会在有数据时补齐。
    let toolUseMessage = null

    // Find the tool use but make sure there's not also a result
    // 逐项读取 `messages.values()` 中的消息，按输入顺序推进共享工具。
    for (const message of messages.values()) {
      // 当 `message.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
      if (message.type === 'assistant') {
        // 文本内容保存`message.message.content`，供后续判断或组装使用。
        const content = message.message.content
        // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
        if (Array.isArray(content)) {
          // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
          for (const block of content) {
            // 只有 `block.type === 'tool_use' && block.id === toolUse` 满足时，共享工具才执行该分支。
            if (block.type === 'tool_use' && block.id === toolUseId) {
              // toolUseMessage 消息数据更新为 `message`，确保共享工具后续读取最新状态。
              toolUseMessage = message
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            }
          }
        }
      // 共享工具 session Storage在这里处理 `} else if (message.type === 'user') {`，完成这一小步状态转换。
      } else if (message.type === 'user') {
        // 文本内容保存`message.message.content`，供后续判断或组装使用。
        const content = message.message.content
        // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
        if (Array.isArray(content)) {
          // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
          for (const block of content) {
            // 共享工具在这里按实际状态进入对应分支。
            if (
              block.type === 'tool_result' &&
              block.tool_use_id === toolUseId
            ) {
              // Found tool result, bail out
              // 返回 `null`，作为共享工具这次计算的结果。
              return null
            }
          }
        }
      }
    }

    // 返回 `toolUseMessage`，作为共享工具这次计算的结果。
    return toolUseMessage
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Gets all session JSONL files in a project directory with their stats.
 * Returns a map of sessionId → {path, mtime, ctime, size}.
 * Stats are batched via Promise.all to avoid serial syscalls in the hot loop.
 */
// getSessionFilesWithMtime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionFilesWithMtime(
  projectDir: string,
): Promise<
  Map<string, { path: string; mtime: number; ctime: number; size: number }>
> {
  // sessionFilesMap 会话数据构建`new Map<`，供后续判断或组装使用。
  const sessionFilesMap = new Map<
    string,
    { path: string; mtime: number; ctime: number; size: number }
  >()

  // dirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let dirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    dirents = await readdir(projectDir, { withFileTypes: true })
  } catch {
    // Directory doesn't exist - return empty map
    // 返回 `sessionFilesMap`，作为共享工具这次计算的结果。
    return sessionFilesMap
  }

  // candidates 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const candidates: Array<{ sessionId: string; filePath: string }> = []
  // 按顺序遍历 `dirents` 中的dirent，逐个交给共享工具处理。
  for (const dirent of dirents) {
    // 只有 `!dirent.isFile() || !dirent.name.endsWith('.jsonl')` 满足时，共享工具才执行该分支。
    if (!dirent.isFile() || !dirent.name.endsWith('.jsonl')) continue
    // sessionId 会话数据读取`validateUuid`，供共享工具后续处理使用。
    const sessionId = validateUuid(basename(dirent.name, '.jsonl'))
    // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!sessionId) continue
    // candidates 集合追加新条目，保持收集顺序与输入顺序一致。
    candidates.push({ sessionId, filePath: join(projectDir, dirent.name) })
  }

  // 等待 `Promise.all(` 完成，再继续共享工具 session Storage的异步流程。
  await Promise.all(
    // 调用 candidates.map，触发共享工具此处需要的副作用。
    candidates.map(async ({ sessionId, filePath }) => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // st保存`stat`，供共享工具后续处理使用。
        const st = await stat(filePath)
        // sessionFilesMap.set 写入新的状态值，使共享工具后续读取保持一致。
        sessionFilesMap.set(sessionId, {
          path: filePath,
          mtime: st.mtime.getTime(),
          ctime: st.birthtime.getTime(),
          size: st.size,
        })
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to stat session file: ${filePath}`)
      }
    }),
  )

  // 返回 `sessionFilesMap`，作为共享工具这次计算的结果。
  return sessionFilesMap
}

/**
 * Number of sessions to enrich on the initial load of the resume picker.
 * Each enrichment reads up to 128 KB per file (head + tail), so 50 sessions
 * means ~6.4 MB of I/O — fast on any modern filesystem while giving users
 * a much better initial view than the previous default of 10.
 */
// INITIAL_ENRICH_COUNT 数量保存`50`，供共享工具 session Storage后续判断或输出使用。
const INITIAL_ENRICH_COUNT = 50

// LiteMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LiteMetadata = {
  firstPrompt: string
  gitBranch?: string
  isSidechain: boolean
  projectPath?: string
  teamName?: string
  customTitle?: string
  summary?: string
  tag?: string
  agentSetting?: string
  prNumber?: number
  prUrl?: string
  prRepository?: string
}

/**
 * Loads all logs from a single session file with full message data.
 * Builds a LogOption for each leaf message in the file.
 */
// loadAllLogsFromSessionFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadAllLogsFromSessionFile(
  sessionFile: string,
  projectPathOverride?: string,
): Promise<LogOption[]> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages,
    summaries,
    customTitles,
    tags,
    agentNames,
    agentColors,
    agentSettings,
    prNumbers,
    prUrls,
    prRepositories,
    modes,
    fileHistorySnapshots,
    attributionSnapshots,
    contentReplacements,
    leafUuids,
  } = await loadTranscriptFile(sessionFile, { keepAllLeaves: true })

  // 满足 `messages.size === 0` 时，共享工具执行该分支。
  if (messages.size === 0) return []

  // leafMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const leafMessages: TranscriptMessage[] = []
  // Build parentUuid → children index once (O(n)), so trailing-message lookup is O(1) per leaf
  // childrenByParent构建`new Map<UUID, TranscriptMessage[]>()` 整理出中间结果，供共享工具 session Storage后续步骤使用。
  const childrenByParent = new Map<UUID, TranscriptMessage[]>()
  // 逐项读取 `messages.values()` 中的消息，按输入顺序推进共享工具。
  for (const msg of messages.values()) {
    // 满足 `leafUuids.has(msg.uuid)` 时，共享工具执行该分支。
    if (leafUuids.has(msg.uuid)) {
      // leafMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      leafMessages.push(msg)
    // 共享工具 session Storage在这里处理 `} else if (msg.parentUuid) {`，完成这一小步状态转换。
    } else if (msg.parentUuid) {
      // siblings 集合读取`childrenByParent.get`，供共享工具后续处理使用。
      const siblings = childrenByParent.get(msg.parentUuid)
      // 满足 `siblings` 时，共享工具执行该分支。
      if (siblings) {
        // siblings 集合追加新条目，保持收集顺序与输入顺序一致。
        siblings.push(msg)
      } else {
        // childrenByParent.set 写入新的状态值，使共享工具后续读取保持一致。
        childrenByParent.set(msg.parentUuid, [msg])
      }
    }
  }

  // logs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const logs: LogOption[] = []

  // 按顺序遍历 `leafMessages` 中的leafMessage 消息数据，逐个交给共享工具处理。
  for (const leafMessage of leafMessages) {
    // chain构建`buildConversationChain`，供共享工具后续处理使用。
    const chain = buildConversationChain(messages, leafMessage)
    // chain为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (chain.length === 0) continue

    // Append trailing messages that are children of the leaf
    // trailingMessages 消息数据读取`childrenByParent.get`，供共享工具后续处理使用。
    const trailingMessages = childrenByParent.get(leafMessage.uuid)
    // 满足 `trailingMessages` 时，共享工具执行该分支。
    if (trailingMessages) {
      // ISO-8601 UTC timestamps are lexically sortable
      // 调用 trailingMessages.sort，触发共享工具此处需要的副作用。
      trailingMessages.sort((a, b) =>
        a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
      )
      // chain追加新条目，保持收集顺序与输入顺序一致。
      chain.push(...trailingMessages)
    }

    // firstMessage 消息数据读取 `chain[0]!` 对应条目，后续围绕该成员继续处理。
    const firstMessage = chain[0]!
    // sessionId 会话数据保存`leafMessage.sessionId as UUID`，供共享工具 session Storage后续判断或输出使用。
    const sessionId = leafMessage.sessionId as UUID

    // logs 集合追加新条目，保持收集顺序与输入顺序一致。
    logs.push({
      date: leafMessage.timestamp,
      messages: removeExtraFields(chain),
      fullPath: sessionFile,
      value: 0,
      created: new Date(firstMessage.timestamp),
      modified: new Date(leafMessage.timestamp),
      firstPrompt: extractFirstPrompt(chain),
      messageCount: countVisibleMessages(chain),
      isSidechain: firstMessage.isSidechain ?? false,
      sessionId,
      leafUuid: leafMessage.uuid,
      summary: summaries.get(leafMessage.uuid),
      customTitle: customTitles.get(sessionId),
      tag: tags.get(sessionId),
      agentName: agentNames.get(sessionId),
      agentColor: agentColors.get(sessionId),
      agentSetting: agentSettings.get(sessionId),
      mode: modes.get(sessionId) as LogOption['mode'],
      prNumber: prNumbers.get(sessionId),
      prUrl: prUrls.get(sessionId),
      prRepository: prRepositories.get(sessionId),
      gitBranch: leafMessage.gitBranch,
      projectPath: projectPathOverride ?? firstMessage.cwd,
      fileHistorySnapshots: buildFileHistorySnapshotChain(
        fileHistorySnapshots,
        chain,
      ),
      attributionSnapshots: buildAttributionSnapshotChain(
        attributionSnapshots,
        chain,
      ),
      contentReplacements: contentReplacements.get(sessionId) ?? [],
    })
  }

  // 返回 `logs`，作为共享工具这次计算的结果。
  return logs
}

/**
 * Gets logs by loading all session files fully, bypassing the session index.
 * Use this when you need full message data (e.g., for /insights analysis).

 */
// getLogsWithoutIndex 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getLogsWithoutIndex(
  projectDir: string,
  limit?: number,
): Promise<LogOption[]> {
  // sessionFilesMap 会话数据读取`getSessionFilesWithMtime`，供共享工具后续处理使用。
  const sessionFilesMap = await getSessionFilesWithMtime(projectDir)
  // 满足 `sessionFilesMap.size === 0` 时，共享工具执行该分支。
  if (sessionFilesMap.size === 0) return []

  // If limit specified, only load N most recent files by mtime
  // filesToProcess 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let filesToProcess: Array<{ path: string; mtime: number }>
  // 只有 `limit && sessionFilesMap.size > limit` 满足时，共享工具才执行该分支。
  if (limit && sessionFilesMap.size > limit) {
    // filesToProcess 文件数据更新为 `[...sessionFilesMap.values()]`，确保共享工具后续读取最新状态。
    filesToProcess = [...sessionFilesMap.values()]
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit)
  } else {
    // filesToProcess 文件数据更新为 `[...sessionFilesMap.values()]`，确保共享工具后续读取最新状态。
    filesToProcess = [...sessionFilesMap.values()]
  }

  // logs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const logs: LogOption[] = []
  // 按顺序遍历 `filesToProcess` 中的fileInfo 文件数据，逐个交给共享工具处理。
  for (const fileInfo of filesToProcess) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fileLogOptions 文件数据读取`loadAllLogsFromSessionFile`，供共享工具后续处理使用。
      const fileLogOptions = await loadAllLogsFromSessionFile(fileInfo.path)
      // logs 集合追加新条目，保持收集顺序与输入顺序一致。
      logs.push(...fileLogOptions)
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to load session file: ${fileInfo.path}`)
    }
  }

  // 返回 `logs`，作为共享工具这次计算的结果。
  return logs
}

/**
 * Reads the first and last ~64KB of a JSONL file and extracts lite metadata.
 *
 * Head (first 64KB): isSidechain, projectPath, teamName, firstPrompt.
 * Tail (last 64KB): customTitle, tag, PR link, latest gitBranch.
 *
 * Accepts a shared buffer to avoid per-file allocation overhead.
 */
// readLiteMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readLiteMetadata(
  filePath: string,
  fileSize: number,
  buf: Buffer,
): Promise<LiteMetadata> {
  // 从 `await readHeadAndTail(filePath, fileSize, buf)` 解构 head、tail，减少共享工具 session Storage对同一对象的重复访问。
  const { head, tail } = await readHeadAndTail(filePath, fileSize, buf)
  // head缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!head) return { firstPrompt: '', isSidechain: false }

  // Extract stable metadata from the first line via string search.
  // Works even when the first line is truncated (>64KB message).
  // isSidechain 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isSidechain =
    head.includes('"isSidechain":true') || head.includes('"isSidechain": true')
  // projectPath 路径数据保存`extractJsonStringField`，供共享工具后续处理使用。
  const projectPath = extractJsonStringField(head, 'cwd')
  // teamName保存`extractJsonStringField`，供共享工具后续处理使用。
  const teamName = extractJsonStringField(head, 'teamName')
  // agentSetting保存`extractJsonStringField`，供共享工具后续处理使用。
  const agentSetting = extractJsonStringField(head, 'agentSetting')

  // Prefer the last-prompt tail entry — captured by extractFirstPrompt at
  // write time (filtered, authoritative) and shows what the user was most
  // recently doing. Head scan is the fallback for sessions written before
  // last-prompt entries existed. Raw string scrapes of head are last resort
  // and catch array-format content blocks (VS Code <ide_selection> metadata).
  // firstPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const firstPrompt =
    extractLastJsonStringField(tail, 'lastPrompt') ||
    extractFirstPromptFromChunk(head) ||
    extractJsonStringFieldPrefix(head, 'content', 200) ||
    extractJsonStringFieldPrefix(head, 'text', 200) ||
    ''

  // Extract tail metadata via string search (last occurrence wins).
  // User titles (customTitle field, from custom-title entries) win over
  // AI titles (aiTitle field, from ai-title entries). The distinct field
  // names mean extractLastJsonStringField naturally disambiguates.
  // customTitle 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const customTitle =
    extractLastJsonStringField(tail, 'customTitle') ??
    extractLastJsonStringField(head, 'customTitle') ??
    extractLastJsonStringField(tail, 'aiTitle') ??
    extractLastJsonStringField(head, 'aiTitle')
  // summary保存`extractLastJsonStringField`，供共享工具后续处理使用。
  const summary = extractLastJsonStringField(tail, 'summary')
  // tag保存`extractLastJsonStringField`，供共享工具后续处理使用。
  const tag = extractLastJsonStringField(tail, 'tag')
  // gitBranch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const gitBranch =
    extractLastJsonStringField(tail, 'gitBranch') ??
    extractJsonStringField(head, 'gitBranch')

  // PR link fields — prNumber is a number not a string, so try both
  // prUrl保存`extractLastJsonStringField`，供共享工具后续处理使用。
  const prUrl = extractLastJsonStringField(tail, 'prUrl')
  // prRepository保存`extractLastJsonStringField`，供共享工具后续处理使用。
  const prRepository = extractLastJsonStringField(tail, 'prRepository')
  // prNumber 先占位，稍后的条件分支会根据实际输入补齐它。
  let prNumber: number | undefined
  // prNumStr保存`extractLastJsonStringField`，供共享工具后续处理使用。
  const prNumStr = extractLastJsonStringField(tail, 'prNumber')
  // 满足 `prNumStr` 时，共享工具执行该分支。
  if (prNumStr) {
    // prNumber更新为 `parseInt(prNumStr, 10) || undefined`，确保共享工具后续读取最新状态。
    prNumber = parseInt(prNumStr, 10) || undefined
  }
  // prNumber缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!prNumber) {
    // prNumMatch保存`tail.lastIndexOf`，供共享工具后续处理使用。
    const prNumMatch = tail.lastIndexOf('"prNumber":')
    // 满足 `prNumMatch >= 0` 时，共享工具执行该分支。
    if (prNumMatch >= 0) {
      // afterColon格式化`tail.slice`，供共享工具后续处理使用。
      const afterColon = tail.slice(prNumMatch + 11, prNumMatch + 25)
      // num解析`parseInt`，供共享工具后续处理使用。
      const num = parseInt(afterColon.trim(), 10)
      // 满足 `num > 0` 时，共享工具执行该分支。
      if (num > 0) prNumber = num
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    firstPrompt,
    gitBranch,
    isSidechain,
    projectPath,
    teamName,
    customTitle,
    summary,
    tag,
    agentSetting,
    prNumber,
    prUrl,
    prRepository,
  }
}

/**
 * Scans a chunk of text for the first meaningful user prompt.
 */
// extractFirstPromptFromChunk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractFirstPromptFromChunk(chunk: string): string {
  // start保存`0`，供后续判断或组装使用。
  let start = 0
  // hasTickMessages 消息数据标记共享工具 session Storage是否启用对应路径。
  let hasTickMessages = false
  // firstCommandFallback 命令数据 命名 `''`，让后续代码直接表达这个值的用途。
  let firstCommandFallback = ''
  // while 使用 start < chunk.length 完成共享工具里的对应操作。
  while (start < chunk.length) {
    // newlineIdx保存`chunk.indexOf`，供共享工具后续处理使用。
    const newlineIdx = chunk.indexOf('\n', start)
    // line 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const line =
      newlineIdx >= 0 ? chunk.slice(start, newlineIdx) : chunk.slice(start)
    // start更新为 `newlineIdx >= 0 ? newlineIdx + 1 : chunk.length`，确保共享工具后续读取最新状态。
    start = newlineIdx >= 0 ? newlineIdx + 1 : chunk.length

    // 只有 `!line.includes('"type":"user"') && !line.includes('"type": "user"')` 满足时，共享工具才执行该分支。
    if (!line.includes('"type":"user"') && !line.includes('"type": "user"')) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `line.includes('"tool_result"')` 时，共享工具执行该分支。
    if (line.includes('"tool_result"')) continue
    // 只有 `line.includes('"isMeta":true') || line.includes('"isMeta": true')` 满足时，共享工具才执行该分支。
    if (line.includes('"isMeta":true') || line.includes('"isMeta": true'))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entry解析`jsonParse`，供共享工具后续处理使用。
      const entry = jsonParse(line) as Record<string, unknown>
      // `entry.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (entry.type !== 'user') continue

      // 消息保存`entry.message as Record<string, unknown> | undefined`，供共享工具 session Storage后续判断或输出使用。
      const message = entry.message as Record<string, unknown> | undefined
      // 消息缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!message) continue

      // 文本内容保存`message.content`，供后续判断或组装使用。
      const content = message.content
      // Collect all text values from the message content. For array content
      // (common in VS Code where IDE metadata tags come before the user's
      // actual prompt), iterate all text blocks so we don't miss the real
      // prompt hidden behind <ide_selection>/<ide_opened_file> blocks.
      // texts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const texts: string[] = []
      // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof content === 'string') {
        // texts 集合追加新条目，保持收集顺序与输入顺序一致。
        texts.push(content)
      // 共享工具 session Storage在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
        for (const block of content) {
          // b保存`block as Record<string, unknown>`，供后续判断或组装使用。
          const b = block as Record<string, unknown>
          // 当 `b.type` 匹配 `'text' && typeof b.text ===...` 时，共享工具执行对应分支。
          if (b.type === 'text' && typeof b.text === 'string') {
            // texts 集合追加新条目，保持收集顺序与输入顺序一致。
            texts.push(b.text as string)
          }
        }
      }

      // 按顺序遍历 `texts` 中的文本，逐个交给共享工具处理。
      for (const text of texts) {
        // 文本缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!text) continue

        // 结果格式化`text.replace`，供共享工具后续处理使用。
        let result = text.replace(/\n/g, ' ').trim()

        // Skip command messages (slash commands) but remember the first one
        // as a fallback title. Matches skip logic in
        // getFirstMeaningfulUserMessageTextContent, but instead of discarding
        // command messages entirely, we format them cleanly (e.g. "/clear")
        // so the session still appears in the resume picker.
        // commandNameTag 命令数据保存`extractTag`，供共享工具后续处理使用。
        const commandNameTag = extractTag(result, COMMAND_NAME_TAG)
        // 满足 `commandNameTag` 时，共享工具执行该分支。
        if (commandNameTag) {
          // 名称格式化`commandNameTag.replace`，供共享工具后续处理使用。
          const name = commandNameTag.replace(/^\//, '')
          // commandArgs 命令数据保存`extractTag`，供共享工具后续处理使用。
          const commandArgs = extractTag(result, 'command-args')?.trim() || ''
          // 只有 `builtInCommandNames().has(name) || !commandArgs` 满足时，共享工具才执行该分支。
          if (builtInCommandNames().has(name) || !commandArgs) {
            // firstCommandFallback 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
            if (!firstCommandFallback) {
              // firstCommandFallback 命令数据更新为 `commandNameTag`，确保共享工具后续读取最新状态。
              firstCommandFallback = commandNameTag
            }
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // Custom command with meaningful args — use clean display
          // 返回 `commandArgs`，作为共享工具这次计算的结果。
          return commandArgs
            ? `${commandNameTag} ${commandArgs}`
            : commandNameTag
        }

        // Format bash input with ! prefix before the generic XML skip
        // bashInput保存`extractTag`，供共享工具后续处理使用。
        const bashInput = extractTag(result, 'bash-input')
        // 满足 `bashInput` 时，共享工具执行该分支。
        if (bashInput) return `! ${bashInput}`

        // 满足 `SKIP_FIRST_PROMPT_PATTERN.test(result)` 时，共享工具执行该分支。
        if (SKIP_FIRST_PROMPT_PATTERN.test(result)) {
          // 共享工具在这里按实际状态进入对应分支。
          if (
            (feature('PROACTIVE') || feature('KAIROS')) &&
            result.startsWith(`<${TICK_TAG}>`)
          )
            // hasTickMessages 消息数据更新为 `true`，确保共享工具后续读取最新状态。
            hasTickMessages = true
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 满足 `result.length > 200` 时，共享工具执行该分支。
        if (result.length > 200) {
          // 结果更新为 `result.slice(0, 200).trim() + '…'`，确保共享工具后续读取最新状态。
          result = result.slice(0, 200).trim() + '…'
        }
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      }
    } catch {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
  }
  // Session started with a slash command but had no subsequent real message —
  // use the clean command name so the session still appears in the resume picker
  // 满足 `firstCommandFallback` 时，共享工具执行该分支。
  if (firstCommandFallback) return firstCommandFallback
  // Proactive sessions have only tick messages — give them a synthetic prompt
  // so they're not filtered out by enrichLogs
  // 只有 `(feature('PROACTIVE') || feature('KAIROS')) && hasTickMessages` 满足时，共享工具才执行该分支。
  if ((feature('PROACTIVE') || feature('KAIROS')) && hasTickMessages)
    // 返回 `'Proactive session'`，作为共享工具这次计算的结果。
    return 'Proactive session'
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Like extractJsonStringField but returns the first `maxLen` characters of the
 * value even when the closing quote is missing (truncated buffer). Newline
 * escapes are replaced with spaces and the result is trimmed.
 */
// extractJsonStringFieldPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractJsonStringFieldPrefix(
  text: string,
  key: string,
  maxLen: number,
): string {
  // patterns 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const patterns = [`"${key}":"`, `"${key}": "`]
  // 按顺序遍历 `patterns` 中的pattern，逐个交给共享工具处理。
  for (const pattern of patterns) {
    // idx保存`text.indexOf`，供共享工具后续处理使用。
    const idx = text.indexOf(pattern)
    // 满足 `idx < 0` 时，共享工具执行该分支。
    if (idx < 0) continue

    // valueStart 命名 `idx + pattern.length`，让后续代码直接表达这个值的用途。
    const valueStart = idx + pattern.length
    // Grab up to maxLen characters from the value, stopping at closing quote
    // i 命名 `valueStart`，让后续代码直接表达这个值的用途。
    let i = valueStart
    // collected保存`0`，供共享工具 session Storage后续判断或输出使用。
    let collected = 0
    // while 使用 i < text.length && collected < maxLen 完成共享工具里的对应操作。
    while (i < text.length && collected < maxLen) {
      // 当 `text[i]` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (text[i] === '\\') {
        // 共享工具 session Storage在这里处理 `i += 2 // skip escaped char`，完成这一小步状态转换。
        i += 2 // skip escaped char
        // 共享工具 session Storage在这里处理 `collected++`，完成这一小步状态转换。
        collected++
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `text[i]` 匹配 `'"'` 时，共享工具执行对应分支。
      if (text[i] === '"') break
      // 共享工具 session Storage在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 共享工具 session Storage在这里处理 `collected++`，完成这一小步状态转换。
      collected++
    }
    // 原始文本格式化`text.slice`，供共享工具后续处理使用。
    const raw = text.slice(valueStart, i)
    // 返回 `raw.replace(/\\n/g, ' ').replace(/\\t/g, ' ').trim()`，作为共享工具这次计算的结果。
    return raw.replace(/\\n/g, ' ').replace(/\\t/g, ' ').trim()
  }
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Deduplicates logs by sessionId, keeping the entry with the newest
 * modified time. Returns sorted logs with sequential value indices.
 */
// deduplicateLogsBySessionId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function deduplicateLogsBySessionId(logs: LogOption[]): LogOption[] {
  // deduped构建`new Map<string, LogOption>()`，供后续判断或组装使用。
  const deduped = new Map<string, LogOption>()
  // 按顺序遍历 `logs` 中的log，逐个交给共享工具处理。
  for (const log of logs) {
    // log.sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!log.sessionId) continue
    // existing读取`deduped.get`，供共享工具后续处理使用。
    const existing = deduped.get(log.sessionId)
    // 只有 `!existing || log.modified.getTime() > existing.modified.getTime()` 满足时，共享工具才执行该分支。
    if (!existing || log.modified.getTime() > existing.modified.getTime()) {
      // deduped.set 写入新的状态值，使共享工具后续读取保持一致。
      deduped.set(log.sessionId, log)
    }
  }
  // 返回 `sortLogs([...deduped.values()]).map((log, i) => ({`，作为共享工具这次计算的结果。
  return sortLogs([...deduped.values()]).map((log, i) => ({
    ...log,
    value: i,
  }))
}

/**
 * Returns lite LogOption[] from pure filesystem metadata (stat only).
 * No file reads — instant. Call `enrichLogs` to enrich
 * visible sessions with firstPrompt, gitBranch, customTitle, etc.
 */
// getSessionFilesLite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionFilesLite(
  projectDir: string,
  limit?: number,
  projectPath?: string,
): Promise<LogOption[]> {
  // sessionFilesMap 会话数据读取`getSessionFilesWithMtime`，供共享工具后续处理使用。
  const sessionFilesMap = await getSessionFilesWithMtime(projectDir)

  // Sort by mtime descending and apply limit
  // entries 集合保存`sessionFilesMap.entries`，供共享工具后续处理使用。
  let entries = [...sessionFilesMap.entries()].sort(
    // 这个回调绑定到 (a, b) => b[1].mtime - a[1].mtime,，负责共享工具在该局部场景下的响应。
    (a, b) => b[1].mtime - a[1].mtime,
  )
  // 只有 `limit && entries.length > limit` 满足时，共享工具才执行该分支。
  if (limit && entries.length > limit) {
    // entries 集合更新为 `entries.slice(0, limit)`，确保共享工具后续读取最新状态。
    entries = entries.slice(0, limit)
  }

  // logs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const logs: LogOption[] = []

  // 循环处理 `const [sessionId, fileInfo] of entries`，让共享工具逐项把同类条目按顺序走完。
  for (const [sessionId, fileInfo] of entries) {
    // logs 集合追加新条目，保持收集顺序与输入顺序一致。
    logs.push({
      date: new Date(fileInfo.mtime).toISOString(),
      messages: [],
      isLite: true,
      fullPath: fileInfo.path,
      value: 0,
      created: new Date(fileInfo.ctime),
      modified: new Date(fileInfo.mtime),
      firstPrompt: '',
      messageCount: 0,
      fileSize: fileInfo.size,
      isSidechain: false,
      sessionId,
      projectPath,
    })
  }

  // logs are freshly pushed above — safe to mutate in place
  // sorted保存`sortLogs`，供共享工具后续处理使用。
  const sorted = sortLogs(logs)
  // 调用 sorted.forEach，触发共享工具此处需要的副作用。
  sorted.forEach((log, i) => {
    // 取值更新为 `i`，确保共享工具后续读取最新状态。
    log.value = i
  })
  // 返回 `sorted`，作为共享工具这次计算的结果。
  return sorted
}

/**
 * Enriches a lite log with metadata from its JSONL file.
 * Returns the enriched log, or null if the log has no meaningful content
 * (no firstPrompt, no customTitle — e.g., metadata-only session files).
 */
// enrichLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function enrichLog(
  log: LogOption,
  readBuf: Buffer,
): Promise<LogOption | null> {
  // 只有 `!log.isLite || !log.fullPath` 满足时，共享工具才执行该分支。
  if (!log.isLite || !log.fullPath) return log

  // meta读取`readLiteMetadata`，供共享工具后续处理使用。
  const meta = await readLiteMetadata(log.fullPath, log.fileSize ?? 0, readBuf)

  // enriched 集中保存共享工具 session Storage要一起传递的字段。
  const enriched: LogOption = {
    ...log,
    isLite: false,
    firstPrompt: meta.firstPrompt,
    gitBranch: meta.gitBranch,
    isSidechain: meta.isSidechain,
    teamName: meta.teamName,
    customTitle: meta.customTitle,
    summary: meta.summary,
    tag: meta.tag,
    agentSetting: meta.agentSetting,
    prNumber: meta.prNumber,
    prUrl: meta.prUrl,
    prRepository: meta.prRepository,
    projectPath: meta.projectPath ?? log.projectPath,
  }

  // Provide a fallback title for sessions where we couldn't extract the first
  // prompt (e.g., large first messages that exceed the 16KB read buffer).
  // Previously these sessions were silently dropped, making them inaccessible
  // via /resume after crashes or large-context sessions.
  // 只有 `!enriched.firstPrompt && !enriched.customTitle` 满足时，共享工具才执行该分支。
  if (!enriched.firstPrompt && !enriched.customTitle) {
    // firstPrompt更新为 `'(session)'`，确保共享工具后续读取最新状态。
    enriched.firstPrompt = '(session)'
  }
  // Filter: skip sidechains and agent sessions
  // 满足 `enriched.isSidechain` 时，共享工具执行该分支。
  if (enriched.isSidechain) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Session ${log.sessionId} filtered from /resume: isSidechain=true`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 满足 `enriched.teamName` 时，共享工具执行该分支。
  if (enriched.teamName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Session ${log.sessionId} filtered from /resume: teamName=${enriched.teamName}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 `enriched`，作为共享工具这次计算的结果。
  return enriched
}

/**
 * Enriches enough lite logs from `allLogs` (starting at `startIndex`) to
 * produce `count` valid results. Returns the valid enriched logs and the
 * index where scanning stopped (for progressive loading to continue from).
 */
// enrichLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enrichLogs(
  allLogs: LogOption[],
  startIndex: number,
  count: number,
): Promise<{ logs: LogOption[]; nextIndex: number }> {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: LogOption[] = []
  // readBuf保存`Buffer.alloc`，供共享工具后续处理使用。
  const readBuf = Buffer.alloc(LITE_READ_BUF_SIZE)
  // i保存`startIndex`，供后续判断或组装使用。
  let i = startIndex

  // while 使用 i < allLogs.length && result.length < count 完成共享工具里的对应操作。
  while (i < allLogs.length && result.length < count) {
    // log 命名 `allLogs[i]!`，让后续代码直接表达这个值的用途。
    const log = allLogs[i]!
    // 共享工具 session Storage在这里处理 `i++`，完成这一小步状态转换。
    i++

    // enriched保存`enrichLog`，供共享工具后续处理使用。
    const enriched = await enrichLog(log, readBuf)
    // 满足 `enriched` 时，共享工具执行该分支。
    if (enriched) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(enriched)
    }
  }

  // scanned保存`i - startIndex`，供共享工具 session Storage后续判断或输出使用。
  const scanned = i - startIndex
  // filtered记录 `scanned - result.length` 是否成立，下一步按该结果分支。
  const filtered = scanned - result.length
  // 满足 `filtered > 0` 时，共享工具执行该分支。
  if (filtered > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `/resume: enriched ${scanned} sessions, ${filtered} filtered out, ${result.length} visible (${allLogs.length - i} remaining on disk)`,
    )
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { logs: result, nextIndex: i }
}
