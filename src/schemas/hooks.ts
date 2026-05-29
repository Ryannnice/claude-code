/**
 * Hook Zod schemas extracted to break import cycles.
 *
 * This file contains hook-related schema definitions that were originally
 * in src/utils/settings/types.ts. By extracting them here, we break the
 * circular dependency between settings/types.ts and plugins/schemas.ts.
 *
 * Both files now import from this shared location instead of each other.
 */

// 引入 HOOK_EVENTS、HookEvent，将 src/entrypoints/agentSdkTypes.js 中已经封装好的能力接到本文件流程里。
import { HOOK_EVENTS, type HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 复用 SHELL_TYPES 工具函数，把通用处理留在 ../utils/shell/shellProvider.js 中维护。
import { SHELL_TYPES } from '../utils/shell/shellProvider.js'

// Shared schema for the `if` condition field.
// Uses permission rule syntax (e.g., "Bash(git *)", "Read(*.ts)") to filter hooks
// before spawning. Evaluated against the hook input's tool_name and tool_input.
// IfConditionSchema保存`lazySchema`，供hooks后续处理使用。
const IfConditionSchema = lazySchema(() =>
  z
    .string()
    .optional()
    .describe(
      'Permission rule syntax to filter when this hook runs (e.g., "Bash(git *)"). ' +
        'Only runs if the tool call matches the pattern. Avoids spawning hooks for non-matching commands.',
    ),
)

// Internal factory for individual hook schemas (shared between exported
// discriminated union members and the HookCommandSchema factory)
// buildHookSchemas 封装hooks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildHookSchemas() {
  // BashCommandHookSchema 命令数据保存`z.object`，供hooks后续处理使用。
  const BashCommandHookSchema = z.object({
    type: z.literal('command').describe('Shell command hook type'),
    command: z.string().describe('Shell command to execute'),
    if: IfConditionSchema(),
    shell: z
      .enum(SHELL_TYPES)
      .optional()
      .describe(
        "Shell interpreter. 'bash' uses your $SHELL (bash/zsh/sh); 'powershell' uses pwsh. Defaults to bash.",
      ),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific command'),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
    async: z
      .boolean()
      .optional()
      .describe('If true, hook runs in background without blocking'),
    asyncRewake: z
      .boolean()
      .optional()
      .describe(
        'If true, hook runs in background and wakes the model on exit code 2 (blocking error). Implies async.',
      ),
  })

  // PromptHookSchema保存`z.object`，供hooks后续处理使用。
  const PromptHookSchema = z.object({
    type: z.literal('prompt').describe('LLM prompt hook type'),
    prompt: z
      .string()
      .describe(
        'Prompt to evaluate with LLM. Use $ARGUMENTS placeholder for hook input JSON.',
      ),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific prompt evaluation'),
    // @[MODEL LAUNCH]: Update the example model ID in the .describe() strings below (prompt + agent hooks).
    model: z
      .string()
      .optional()
      .describe(
        'Model to use for this prompt hook (e.g., "claude-sonnet-4-6"). If not specified, uses the default small fast model.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  // HttpHookSchema保存`z.object`，供hooks后续处理使用。
  const HttpHookSchema = z.object({
    type: z.literal('http').describe('HTTP hook type'),
    url: z.string().url().describe('URL to POST the hook input JSON to'),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific request'),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        'Additional headers to include in the request. Values may reference environment variables using $VAR_NAME or ${VAR_NAME} syntax (e.g., "Authorization": "Bearer $MY_TOKEN"). Only variables listed in allowedEnvVars will be interpolated.',
      ),
    allowedEnvVars: z
      .array(z.string())
      .optional()
      .describe(
        'Explicit list of environment variable names that may be interpolated in header values. Only variables listed here will be resolved; all other $VAR references are left as empty strings. Required for env var interpolation to work.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  // AgentHookSchema保存`z.object`，供hooks后续处理使用。
  const AgentHookSchema = z.object({
    type: z.literal('agent').describe('Agentic verifier hook type'),
    // DO NOT add .transform() here. This schema is used by parseSettingsFile,
    // and updateSettingsForSource round-trips the parsed result through
    // JSON.stringify — a transformed function value is silently dropped,
    // deleting the user's prompt from settings.json (gh-24920, CC-79). The
    // transform (from #10594) wrapped the string in `(_msgs) => prompt`
    // for a programmatic-construction use case in ExitPlanModeV2Tool that
    // has since been refactored into VerifyPlanExecutionTool, which no
    // longer constructs AgentHook objects at all.
    prompt: z
      .string()
      .describe(
        'Prompt describing what to verify (e.g. "Verify that unit tests ran and passed."). Use $ARGUMENTS placeholder for hook input JSON.',
      ),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for agent execution (default 60)'),
    model: z
      .string()
      .optional()
      .describe(
        'Model to use for this agent hook (e.g., "claude-sonnet-4-6"). If not specified, uses Haiku.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  // 返回结构化结果，集中表达hooks已经整理出的状态。
  return {
    BashCommandHookSchema,
    PromptHookSchema,
    HttpHookSchema,
    AgentHookSchema,
  }
}

/**
 * Schema for hook command (excludes function hooks - they can't be persisted)
 */
// HookCommandSchema 命令数据保存`lazySchema`，供hooks后续处理使用。
export const HookCommandSchema = lazySchema(() => {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    BashCommandHookSchema,
    PromptHookSchema,
    AgentHookSchema,
    HttpHookSchema,
  } = buildHookSchemas()
  // 返回 `z.discriminatedUnion('type', [`，作为hooks这次计算的结果。
  return z.discriminatedUnion('type', [
    BashCommandHookSchema,
    PromptHookSchema,
    AgentHookSchema,
    HttpHookSchema,
  ])
})

/**
 * Schema for matcher configuration with multiple hooks
 */
// HookMatcherSchema保存`lazySchema`，供hooks后续处理使用。
export const HookMatcherSchema = lazySchema(() =>
  z.object({
    matcher: z
      .string()
      .optional()
      .describe('String pattern to match (e.g. tool names like "Write")'), // String (e.g. Write) to match values related to the hook event, e.g. tool names
    hooks: z
      .array(HookCommandSchema())
      .describe('List of hooks to execute when the matcher matches'),
  }),
)

/**
 * Schema for hooks configuration
 * The key is the hook event. The value is an array of matcher configurations.
 * Uses partialRecord since not all hook events need to be defined.
 */
// HooksSchema保存`lazySchema`，供hooks后续处理使用。
export const HooksSchema = lazySchema(() =>
  z.partialRecord(z.enum(HOOK_EVENTS), z.array(HookMatcherSchema())),
)

// Inferred types from schemas
// HookCommand 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookCommand = z.infer<ReturnType<typeof HookCommandSchema>>
// BashCommandHook 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type BashCommandHook = Extract<HookCommand, { type: 'command' }>
// PromptHook 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptHook = Extract<HookCommand, { type: 'prompt' }>
// AgentHook 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentHook = Extract<HookCommand, { type: 'agent' }>
// HttpHook 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HttpHook = Extract<HookCommand, { type: 'http' }>
// HookMatcher 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookMatcher = z.infer<ReturnType<typeof HookMatcherSchema>>
// HooksSettings 固化hooks里传递的数据形状，帮助调用方按同一结构读写字段。
export type HooksSettings = Partial<Record<HookEvent, HookMatcher[]>>
