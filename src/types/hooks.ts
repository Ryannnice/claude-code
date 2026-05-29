// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 整理这一组导入，让hooks后续逻辑可以直接复用这些外部能力。
import {
  type HookEvent,
  HOOK_EVENTS,
  type HookInput,
  type PermissionUpdate,
} from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让hooks后续逻辑可以直接复用这些外部能力。
import type {
  HookJSONOutput,
  AsyncHookJSONOutput,
  SyncHookJSONOutput,
} from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { Message } 来自 src/types/message.js，用于校准hooks的数据契约。
import type { Message } from 'src/types/message.js'
// 类型依赖 { PermissionResult } 来自 src/utils/permissions/PermissionResult.js，用于校准hooks的数据契约。
import type { PermissionResult } from 'src/utils/permissions/PermissionResult.js'
// 复用 permissionBehaviorSchema 工具函数，把通用处理留在 src/utils/permissions/PermissionRule.js 中维护。
import { permissionBehaviorSchema } from 'src/utils/permissions/PermissionRule.js'
// 复用 permissionUpdateSchema 工具函数，把通用处理留在 src/utils/permissions/PermissionUpdateSchema.js 中维护。
import { permissionUpdateSchema } from 'src/utils/permissions/PermissionUpdateSchema.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准hooks的数据契约。
import type { AppState } from '../state/AppState.js'
// 类型依赖 { AttributionState } 来自 ../utils/commitAttribution.js，用于校准hooks的数据契约。
import type { AttributionState } from '../utils/commitAttribution.js'

// isHookEvent 封装hooks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isHookEvent(value: string): value is HookEvent {
  // 返回 `HOOK_EVENTS.includes(value as HookEvent)`，作为hooks这次计算的结果。
  return HOOK_EVENTS.includes(value as HookEvent)
}

// Prompt elicitation protocol types. The `prompt` key acts as discriminator
// (mirroring the {async:true} pattern), with the id as its value.
// promptRequestSchema 请求数据保存`lazySchema`，供hooks后续处理使用。
export const promptRequestSchema = lazySchema(() =>
  z.object({
    prompt: z.string(), // request id
    message: z.string(),
    options: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        description: z.string().optional(),
      }),
    ),
  }),
)

// PromptRequest 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptRequest = z.infer<ReturnType<typeof promptRequestSchema>>

// PromptResponse 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptResponse = {
  prompt_response: string // request id
  selected: string
}

// Sync hook response schema
// syncHookResponseSchema 响应数据保存`lazySchema`，供hooks后续处理使用。
export const syncHookResponseSchema = lazySchema(() =>
  z.object({
    continue: z
      .boolean()
      .describe('Whether Claude should continue after hook (default: true)')
      .optional(),
    suppressOutput: z
      .boolean()
      .describe('Hide stdout from transcript (default: false)')
      .optional(),
    stopReason: z
      .string()
      .describe('Message shown when continue is false')
      .optional(),
    decision: z.enum(['approve', 'block']).optional(),
    reason: z.string().describe('Explanation for the decision').optional(),
    systemMessage: z
      .string()
      .describe('Warning message shown to the user')
      .optional(),
    hookSpecificOutput: z
      .union([
        z.object({
          hookEventName: z.literal('PreToolUse'),
          permissionDecision: permissionBehaviorSchema().optional(),
          permissionDecisionReason: z.string().optional(),
          updatedInput: z.record(z.string(), z.unknown()).optional(),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('UserPromptSubmit'),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('SessionStart'),
          additionalContext: z.string().optional(),
          initialUserMessage: z.string().optional(),
          watchPaths: z
            .array(z.string())
            .describe('Absolute paths to watch for FileChanged hooks')
            .optional(),
        }),
        z.object({
          hookEventName: z.literal('Setup'),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('SubagentStart'),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('PostToolUse'),
          additionalContext: z.string().optional(),
          updatedMCPToolOutput: z
            .unknown()
            .describe('Updates the output for MCP tools')
            .optional(),
        }),
        z.object({
          hookEventName: z.literal('PostToolUseFailure'),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('PermissionDenied'),
          retry: z.boolean().optional(),
        }),
        z.object({
          hookEventName: z.literal('Notification'),
          additionalContext: z.string().optional(),
        }),
        z.object({
          hookEventName: z.literal('PermissionRequest'),
          decision: z.union([
            z.object({
              behavior: z.literal('allow'),
              updatedInput: z.record(z.string(), z.unknown()).optional(),
              updatedPermissions: z.array(permissionUpdateSchema()).optional(),
            }),
            z.object({
              behavior: z.literal('deny'),
              message: z.string().optional(),
              interrupt: z.boolean().optional(),
            }),
          ]),
        }),
        z.object({
          hookEventName: z.literal('Elicitation'),
          action: z.enum(['accept', 'decline', 'cancel']).optional(),
          content: z.record(z.string(), z.unknown()).optional(),
        }),
        z.object({
          hookEventName: z.literal('ElicitationResult'),
          action: z.enum(['accept', 'decline', 'cancel']).optional(),
          content: z.record(z.string(), z.unknown()).optional(),
        }),
        z.object({
          hookEventName: z.literal('CwdChanged'),
          watchPaths: z
            .array(z.string())
            .describe('Absolute paths to watch for FileChanged hooks')
            .optional(),
        }),
        z.object({
          hookEventName: z.literal('FileChanged'),
          watchPaths: z
            .array(z.string())
            .describe('Absolute paths to watch for FileChanged hooks')
            .optional(),
        }),
        z.object({
          hookEventName: z.literal('WorktreeCreate'),
          worktreePath: z.string(),
        }),
      ])
      .optional(),
  }),
)

// Zod schema for hook JSON output validation
// hookJSONOutputSchema保存`lazySchema`，供hooks后续处理使用。
export const hookJSONOutputSchema = lazySchema(() => {
  // Async hook response schema
  // asyncHookResponseSchema 响应数据保存`z.object`，供hooks后续处理使用。
  const asyncHookResponseSchema = z.object({
    async: z.literal(true),
    asyncTimeout: z.number().optional(),
  })
  // 返回 `z.union([asyncHookResponseSchema, syncHookResponseSchema()])`，作为hooks这次计算的结果。
  return z.union([asyncHookResponseSchema, syncHookResponseSchema()])
})

// Infer the TypeScript type from the schema
// SchemaHookJSONOutput 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
type SchemaHookJSONOutput = z.infer<ReturnType<typeof hookJSONOutputSchema>>

// Type guard function to check if response is sync
// isSyncHookJSONOutput 封装hooks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSyncHookJSONOutput(
  json: HookJSONOutput,
): json is SyncHookJSONOutput {
  // 返回 `!('async' in json && json.async === true)`，作为hooks这次计算的结果。
  return !('async' in json && json.async === true)
}

// Type guard function to check if response is async
// isAsyncHookJSONOutput 封装hooks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAsyncHookJSONOutput(
  json: HookJSONOutput,
): json is AsyncHookJSONOutput {
  // 返回 `'async' in json && json.async === true`，作为hooks这次计算的结果。
  return 'async' in json && json.async === true
}

// Compile-time assertion that SDK and Zod types match
// 类型依赖 { IsEqual } 来自 type-fest，用于校准hooks的数据契约。
import type { IsEqual } from 'type-fest'
// Assert 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
type Assert<T extends true> = T
// _assertSDKTypesMatch 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
type _assertSDKTypesMatch = Assert<
  IsEqual<SchemaHookJSONOutput, HookJSONOutput>
>

/** Context passed to callback hooks for state access */
// HookCallbackContext 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookCallbackContext = {
  // 这个回调绑定到 getAppState: () => AppState，负责hooks在该局部场景下的响应。
  getAppState: () => AppState
  // hooks在这里处理 `updateAttributionState: (`，完成这一小步状态转换。
  updateAttributionState: (
    // 这个回调绑定到 updater: (prev: AttributionState) => AttributionState,，负责hooks在该局部场景下的响应。
    updater: (prev: AttributionState) => AttributionState,
  ) => void
}

/** Hook that is a callback. */
// HookCallback 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookCallback = {
  type: 'callback'
  // hooks在这里处理 `callback: (`，完成这一小步状态转换。
  callback: (
    input: HookInput,
    toolUseID: string | null,
    abort: AbortSignal | undefined,
    /** Hook index for SessionStart hooks to compute CLAUDE_ENV_FILE path */
    hookIndex?: number,
    /** Optional context for accessing app state */
    context?: HookCallbackContext,
  ) => Promise<HookJSONOutput>
  /** Timeout in seconds for this hook */
  timeout?: number
  /** Internal hooks (e.g. session file access analytics) are excluded from tengu_run_hook metrics */
  internal?: boolean
}

// HookCallbackMatcher 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookCallbackMatcher = {
  matcher?: string
  hooks: HookCallback[]
  pluginName?: string
}

// HookProgress 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookProgress = {
  type: 'hook_progress'
  hookEvent: HookEvent
  hookName: string
  command: string
  promptText?: string
  statusMessage?: string
}

// HookBlockingError 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookBlockingError = {
  blockingError: string
  command: string
}

// PermissionRequestResult 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRequestResult =
  | {
      behavior: 'allow'
      updatedInput?: Record<string, unknown>
      updatedPermissions?: PermissionUpdate[]
    }
  | {
      behavior: 'deny'
      message?: string
      interrupt?: boolean
    }

// HookResult 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookResult = {
  message?: Message
  systemMessage?: Message
  blockingError?: HookBlockingError
  outcome: 'success' | 'blocking' | 'non_blocking_error' | 'cancelled'
  preventContinuation?: boolean
  stopReason?: string
  permissionBehavior?: 'ask' | 'deny' | 'allow' | 'passthrough'
  hookPermissionDecisionReason?: string
  additionalContext?: string
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  retry?: boolean
}

// AggregatedHookResult 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type AggregatedHookResult = {
  message?: Message
  blockingErrors?: HookBlockingError[]
  preventContinuation?: boolean
  stopReason?: string
  hookPermissionDecisionReason?: string
  permissionBehavior?: PermissionResult['behavior']
  additionalContexts?: string[]
  initialUserMessage?: string
  updatedInput?: Record<string, unknown>
  updatedMCPToolOutput?: unknown
  permissionRequestResult?: PermissionRequestResult
  retry?: boolean
}
