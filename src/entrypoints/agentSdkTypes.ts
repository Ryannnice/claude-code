/**
 * Main entrypoint for Claude Code Agent SDK types.
 *
 * This file re-exports the public SDK API from:
 * - sdk/coreTypes.ts - Common serializable types (messages, configs)
 * - sdk/runtimeTypes.ts - Non-serializable types (callbacks, interfaces)
 *
 * SDK builders who need control protocol types should import from
 * sdk/controlTypes.ts directly.
 */

// 整理这一组导入，让agent Sdk Types后续逻辑可以直接复用这些外部能力。
import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js'

// Control protocol types for SDK builders (bridge subpath consumers)
/** @alpha */
// 导出类型定义，让其他模块沿用agent Sdk Types的数据契约。
export type {
  SDKControlRequest,
  SDKControlResponse,
} from './sdk/controlTypes.js'
// Re-export core types (common serializable types)
// agent Sdk Types在这里处理 `export * from './sdk/coreTypes.js'`，完成这一小步状态转换。
export * from './sdk/coreTypes.js'
// Re-export runtime types (callbacks, interfaces with methods)
// agent Sdk Types在这里处理 `export * from './sdk/runtimeTypes.js'`，完成这一小步状态转换。
export * from './sdk/runtimeTypes.js'

// Re-export settings types (generated from settings JSON schema)
// 导出类型定义，让其他模块沿用agent Sdk Types的数据契约。
export type { Settings } from './sdk/settingsTypes.generated.js'
// Re-export tool types (all marked @internal until SDK API stabilizes)
// agent Sdk Types在这里处理 `export * from './sdk/toolTypes.js'`，完成这一小步状态转换。
export * from './sdk/toolTypes.js'

// ============================================================================
// Functions
// ============================================================================

// 整理这一组导入，让agent Sdk Types后续逻辑可以直接复用这些外部能力。
import type {
  SDKMessage,
  SDKResultMessage,
  SDKSessionInfo,
  SDKUserMessage,
} from './sdk/coreTypes.js'
// Import types needed for function signatures
// 整理这一组导入，让agent Sdk Types后续逻辑可以直接复用这些外部能力。
import type {
  AnyZodRawShape,
  ForkSessionOptions,
  ForkSessionResult,
  GetSessionInfoOptions,
  GetSessionMessagesOptions,
  InferShape,
  InternalOptions,
  InternalQuery,
  ListSessionsOptions,
  McpSdkServerConfigWithInstance,
  Options,
  Query,
  SDKSession,
  SDKSessionOptions,
  SdkMcpToolDefinition,
  SessionMessage,
  SessionMutationOptions,
} from './sdk/runtimeTypes.js'

// 导出类型定义，让其他模块沿用agent Sdk Types的数据契约。
export type {
  ListSessionsOptions,
  GetSessionInfoOptions,
  SessionMutationOptions,
  ForkSessionOptions,
  ForkSessionResult,
  SDKSessionInfo,
}

// tool 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tool<Schema extends AnyZodRawShape>(
  _name: string,
  _description: string,
  _inputSchema: Schema,
  // agent Sdk Types在这里处理 `_handler: (`，完成这一小步状态转换。
  _handler: (
    args: InferShape<Schema>,
    extra: unknown,
  ) => Promise<CallToolResult>,
  _extras?: {
    annotations?: ToolAnnotations
    searchHint?: string
    alwaysLoad?: boolean
  },
): SdkMcpToolDefinition<Schema> {
  // 抛出 new Error('not implemented')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('not implemented')
}

// CreateSdkMcpServerOptions 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
type CreateSdkMcpServerOptions = {
  name: string
  version?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: Array<SdkMcpToolDefinition<any>>
}

/**
 * Creates an MCP server instance that can be used with the SDK transport.
 * This allows SDK users to define custom tools that run in the same process.
 *
 * If your SDK MCP calls will run longer than 60s, override CLAUDE_CODE_STREAM_CLOSE_TIMEOUT
 */
// createSdkMcpServer 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSdkMcpServer(
  _options: CreateSdkMcpServerOptions,
): McpSdkServerConfigWithInstance {
  // 抛出 new Error('not implemented')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('not implemented')
}

// AbortError 聚合agent Sdk Types相关状态与操作，把同一职责的行为收束到类实例中。
export class AbortError extends Error {}

/** @internal */
// query 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function query(_params: {
  prompt: string | AsyncIterable<SDKUserMessage>
  options?: InternalOptions
}): InternalQuery
// query 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function query(_params: {
  prompt: string | AsyncIterable<SDKUserMessage>
  options?: Options
}): Query
// query 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function query(): Query {
  // 抛出 new Error('query is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('query is not implemented in the SDK')
}

/**
 * V2 API - UNSTABLE
 * Create a persistent session for multi-turn conversations.
 * @alpha
 */
// unstable_v2_createSession 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unstable_v2_createSession(
  _options: SDKSessionOptions,
): SDKSession {
  // 抛出 new Error('unstable_v2_createSession is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('unstable_v2_createSession is not implemented in the SDK')
}

/**
 * V2 API - UNSTABLE
 * Resume an existing session by ID.
 * @alpha
 */
// unstable_v2_resumeSession 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unstable_v2_resumeSession(
  _sessionId: string,
  _options: SDKSessionOptions,
): SDKSession {
  // 抛出 new Error('unstable_v2_resumeSession is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('unstable_v2_resumeSession is not implemented in the SDK')
}

// @[MODEL LAUNCH]: Update the example model ID in this docstring.
/**
 * V2 API - UNSTABLE
 * One-shot convenience function for single prompts.
 * @alpha
 *
 * @example
 * ```typescript
 * const result = await unstable_v2_prompt("What files are here?", {
 *   model: 'claude-sonnet-4-6'
 * })
 * ```
 */
// unstable_v2_prompt 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function unstable_v2_prompt(
  _message: string,
  _options: SDKSessionOptions,
): Promise<SDKResultMessage> {
  // 抛出 new Error('unstable_v2_prompt is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('unstable_v2_prompt is not implemented in the SDK')
}

/**
 * Reads a session's conversation messages from its JSONL transcript file.
 *
 * Parses the transcript, builds the conversation chain via parentUuid links,
 * and returns user/assistant messages in chronological order. Set
 * `includeSystemMessages: true` in options to also include system messages.
 *
 * @param sessionId - UUID of the session to read
 * @param options - Optional dir, limit, offset, and includeSystemMessages
 * @returns Array of messages, or empty array if session not found
 */
// getSessionMessages 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionMessages(
  _sessionId: string,
  _options?: GetSessionMessagesOptions,
): Promise<SessionMessage[]> {
  // 抛出 new Error('getSessionMessages is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('getSessionMessages is not implemented in the SDK')
}

/**
 * List sessions with metadata.
 *
 * When `dir` is provided, returns sessions for that project directory
 * and its git worktrees. When omitted, returns sessions across all
 * projects.
 *
 * Use `limit` and `offset` for pagination.
 *
 * @example
 * ```typescript
 * // List sessions for a specific project
 * const sessions = await listSessions({ dir: '/path/to/project' })
 *
 * // Paginate
 * const page1 = await listSessions({ limit: 50 })
 * const page2 = await listSessions({ limit: 50, offset: 50 })
 * ```
 */
// listSessions 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listSessions(
  _options?: ListSessionsOptions,
): Promise<SDKSessionInfo[]> {
  // 抛出 new Error('listSessions is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('listSessions is not implemented in the SDK')
}

/**
 * Reads metadata for a single session by ID. Unlike `listSessions`, this only
 * reads the single session file rather than every session in the project.
 * Returns undefined if the session file is not found, is a sidechain session,
 * or has no extractable summary.
 *
 * @param sessionId - UUID of the session
 * @param options - `{ dir?: string }` project path; omit to search all project directories
 */
// getSessionInfo 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionInfo(
  _sessionId: string,
  _options?: GetSessionInfoOptions,
): Promise<SDKSessionInfo | undefined> {
  // 抛出 new Error('getSessionInfo is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('getSessionInfo is not implemented in the SDK')
}

/**
 * Rename a session. Appends a custom-title entry to the session's JSONL file.
 * @param sessionId - UUID of the session
 * @param title - New title
 * @param options - `{ dir?: string }` project path; omit to search all projects
 */
// renameSession 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function renameSession(
  _sessionId: string,
  _title: string,
  _options?: SessionMutationOptions,
): Promise<void> {
  // 抛出 new Error('renameSession is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('renameSession is not implemented in the SDK')
}

/**
 * Tag a session. Pass null to clear the tag.
 * @param sessionId - UUID of the session
 * @param tag - Tag string, or null to clear
 * @param options - `{ dir?: string }` project path; omit to search all projects
 */
// tagSession 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tagSession(
  _sessionId: string,
  _tag: string | null,
  _options?: SessionMutationOptions,
): Promise<void> {
  // 抛出 new Error('tagSession is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('tagSession is not implemented in the SDK')
}

/**
 * Fork a session into a new branch with fresh UUIDs.
 *
 * Copies transcript messages from the source session into a new session file,
 * remapping every message UUID and preserving the parentUuid chain. Supports
 * `upToMessageId` for branching from a specific point in the conversation.
 *
 * Forked sessions start without undo history (file-history snapshots are not
 * copied).
 *
 * @param sessionId - UUID of the source session
 * @param options - `{ dir?, upToMessageId?, title? }`
 * @returns `{ sessionId }` — UUID of the new forked session
 */
// forkSession 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function forkSession(
  _sessionId: string,
  _options?: ForkSessionOptions,
): Promise<ForkSessionResult> {
  // 抛出 new Error('forkSession is not implemented in the SDK')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('forkSession is not implemented in the SDK')
}

// ============================================================================
// Assistant daemon primitives (internal)
// ============================================================================

/**
 * A scheduled task from `<dir>/.claude/scheduled_tasks.json`.
 * @internal
 */
// CronTask 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronTask = {
  id: string
  cron: string
  prompt: string
  createdAt: number
  recurring?: boolean
}

/**
 * Cron scheduler tuning knobs (jitter + expiry). Sourced at runtime from the
 * `tengu_kairos_cron_config` GrowthBook config in CLI sessions; daemon hosts
 * pass this through `watchScheduledTasks({ getJitterConfig })` to get the
 * same tuning.
 * @internal
 */
// CronJitterConfig 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronJitterConfig = {
  recurringFrac: number
  recurringCapMs: number
  oneShotMaxMs: number
  oneShotFloorMs: number
  oneShotMinuteMod: number
  recurringMaxAgeMs: number
}

/**
 * Event yielded by `watchScheduledTasks()`.
 * @internal
 */
// ScheduledTaskEvent 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScheduledTaskEvent =
  | { type: 'fire'; task: CronTask }
  | { type: 'missed'; tasks: CronTask[] }

/**
 * Handle returned by `watchScheduledTasks()`.
 * @internal
 */
// ScheduledTasksHandle 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScheduledTasksHandle = {
  /** Async stream of fire/missed events. Drain with `for await`. */
  events(): AsyncGenerator<ScheduledTaskEvent>
  /**
   * Epoch ms of the soonest scheduled fire across all loaded tasks, or null
   * if nothing is scheduled. Useful for deciding whether to tear down an
   * idle agent subprocess or keep it warm for an imminent fire.
   */
  // getNextFireTime不依赖额外参数，直接计算agent Sdk Types需要的结果。
  getNextFireTime(): number | null
}

/**
 * Watch `<dir>/.claude/scheduled_tasks.json` and yield events as tasks fire.
 *
 * Acquires the per-directory scheduler lock (PID-based liveness) so a REPL
 * session in the same dir won't double-fire. Releases the lock and closes
 * the file watcher when the signal aborts.
 *
 * - `fire` — a task whose cron schedule was met. One-shot tasks are already
 *   deleted from the file when this yields; recurring tasks are rescheduled
 *   (or deleted if aged out).
 * - `missed` — one-shot tasks whose window passed while the daemon was down.
 *   Yielded once on initial load; a background delete removes them from the
 *   file shortly after.
 *
 * Intended for daemon architectures that own the scheduler externally and
 * spawn the agent via `query()`; the agent subprocess (`-p` mode) does not
 * run its own scheduler.
 *
 * @internal
 */
// watchScheduledTasks 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function watchScheduledTasks(_opts: {
  dir: string
  signal: AbortSignal
  getJitterConfig?: () => CronJitterConfig
}): ScheduledTasksHandle {
  // 抛出 new Error('not implemented')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('not implemented')
}

/**
 * Format missed one-shot tasks into a prompt that asks the model to confirm
 * with the user (via AskUserQuestion) before executing.
 * @internal
 */
// buildMissedTaskNotification 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMissedTaskNotification(_missed: CronTask[]): string {
  // 抛出 new Error('not implemented')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('not implemented')
}

/**
 * A user message typed on claude.ai, extracted from the bridge WS.
 * @internal
 */
// InboundPrompt 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type InboundPrompt = {
  content: string | unknown[]
  uuid?: string
}

/**
 * Options for connectRemoteControl.
 * @internal
 */
// ConnectRemoteControlOptions 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConnectRemoteControlOptions = {
  dir: string
  name?: string
  workerType?: string
  branch?: string
  gitRepoUrl?: string | null
  // 这个回调绑定到 getAccessToken: () => string | undefined，负责agent Sdk Types在该局部场景下的响应。
  getAccessToken: () => string | undefined
  baseUrl: string
  orgUUID: string
  model: string
}

/**
 * Handle returned by connectRemoteControl. Write query() yields in,
 * read inbound prompts out. See src/assistant/daemonBridge.ts for full
 * field documentation.
 * @internal
 */
// RemoteControlHandle 固化agent Sdk Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteControlHandle = {
  sessionUrl: string
  environmentId: string
  bridgeSessionId: string
  write(msg: SDKMessage): void
  // sendResult 使用 无 完成agent Sdk Types里的对应操作。
  sendResult(): void
  // sendControlRequest 使用 req: unknown 完成agent Sdk Types里的对应操作。
  sendControlRequest(req: unknown): void
  // sendControlResponse 使用 res: unknown 完成agent Sdk Types里的对应操作。
  sendControlResponse(res: unknown): void
  // sendControlCancelRequest 使用 requestId: string 完成agent Sdk Types里的对应操作。
  sendControlCancelRequest(requestId: string): void
  // inboundPrompts 使用 无 完成agent Sdk Types里的对应操作。
  inboundPrompts(): AsyncGenerator<InboundPrompt>
  // controlRequests 使用 无 完成agent Sdk Types里的对应操作。
  controlRequests(): AsyncGenerator<unknown>
  // permissionResponses 使用 无 完成agent Sdk Types里的对应操作。
  permissionResponses(): AsyncGenerator<unknown>
  // 调用 onStateChange，触发agent Sdk Types此处需要的副作用。
  onStateChange(
    // agent Sdk Types在这里处理 `cb: (`，完成这一小步状态转换。
    cb: (
      state: 'ready' | 'connected' | 'reconnecting' | 'failed',
      detail?: string,
    ) => void,
  ): void
  // teardown 使用 无 完成agent Sdk Types里的对应操作。
  teardown(): Promise<void>
}

/**
 * Hold a claude.ai remote-control bridge connection from a daemon process.
 *
 * The daemon owns the WebSocket in the PARENT process — if the agent
 * subprocess (spawned via `query()`) crashes, the daemon respawns it while
 * claude.ai keeps the same session. Contrast with `query.enableRemoteControl`
 * which puts the WS in the CHILD process (dies with the agent).
 *
 * Pipe `query()` yields through `write()` + `sendResult()`. Read
 * `inboundPrompts()` (user typed on claude.ai) into `query()`'s input
 * stream. Handle `controlRequests()` locally (interrupt → abort, set_model
 * → reconfigure).
 *
 * Skips the `tengu_ccr_bridge` gate and policy-limits check — @internal
 * caller is pre-entitled. OAuth is still required (env var or keychain).
 *
 * Returns null on no-OAuth or registration failure.
 *
 * @internal
 */
// connectRemoteControl 封装agentSdkTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function connectRemoteControl(
  _opts: ConnectRemoteControlOptions,
): Promise<RemoteControlHandle | null> {
  // 抛出 new Error('not implemented')，阻止agent Sdk Types在无效状态下继续运行。
  throw new Error('not implemented')
}
