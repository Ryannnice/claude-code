// 类型依赖 { Tool, ToolUseContext } 来自 src/Tool.js，用于校准权限判定的数据契约。
import type { Tool, ToolUseContext } from 'src/Tool.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import z from 'zod/v4'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecision,
  PermissionDecisionReason,
} from './PermissionResult.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  applyPermissionUpdates,
  persistPermissionUpdates,
} from './PermissionUpdate.js'
// 引入 permissionUpdateSchema，将 ./PermissionUpdateSchema.js 中已经封装好的能力接到本文件流程里。
import { permissionUpdateSchema } from './PermissionUpdateSchema.js'

// inputSchema保存`lazySchema`，供权限判定后续处理使用。
export const inputSchema = lazySchema(() =>
  z.object({
    tool_name: z
      .string()
      .describe('The name of the tool requesting permission'),
    input: z.record(z.string(), z.unknown()).describe('The input for the tool'),
    tool_use_id: z
      .string()
      .optional()
      .describe('The unique tool use request ID'),
  }),
)

// Input 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<ReturnType<typeof inputSchema>>

// Zod schema for permission results
// This schema is used to validate the MCP permission prompt tool
// so we maintain it as a subset of the real PermissionDecision type

// Matches PermissionDecisionClassificationSchema in entrypoints/sdk/coreSchemas.ts.
// Malformed values fall through to undefined (same pattern as updatedPermissions
// below) so a bad string from the SDK host doesn't reject the whole decision.
// decisionClassificationField保存`lazySchema`，供权限判定后续处理使用。
const decisionClassificationField = lazySchema(() =>
  z
    .enum(['user_temporary', 'user_permanent', 'user_reject'])
    .optional()
    .catch(undefined),
)

// PermissionAllowResultSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
const PermissionAllowResultSchema = lazySchema(() =>
  z.object({
    behavior: z.literal('allow'),
    updatedInput: z.record(z.string(), z.unknown()),
    // SDK hosts may send malformed entries; fall back to undefined rather
    // than rejecting the entire allow decision (anthropics/claude-code#29440)
    updatedPermissions: z
      .array(permissionUpdateSchema())
      .optional()
      // 链式调用 catch，继续加工上一行在权限判定中产生的数据。
      .catch(ctx => {
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Malformed updatedPermissions from SDK host ignored: ${ctx.error.issues[0]?.message ?? 'unknown'}`,
          { level: 'warn' },
        )
        // 返回 `undefined`，作为权限判定这次计算的结果。
        return undefined
      }),
    toolUseID: z.string().optional(),
    decisionClassification: decisionClassificationField(),
  }),
)

// PermissionDenyResultSchema 权限数据保存`lazySchema`，供权限判定后续处理使用。
const PermissionDenyResultSchema = lazySchema(() =>
  z.object({
    behavior: z.literal('deny'),
    message: z.string(),
    interrupt: z.boolean().optional(),
    toolUseID: z.string().optional(),
    decisionClassification: decisionClassificationField(),
  }),
)

// outputSchema保存`lazySchema`，供权限判定后续处理使用。
export const outputSchema = lazySchema(() =>
  z.union([PermissionAllowResultSchema(), PermissionDenyResultSchema()]),
)

// Output 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<ReturnType<typeof outputSchema>>

/**
 * Normalizes the result of a permission prompt tool to a PermissionDecision.
 */
// permissionPromptToolResultToPermissionDecision 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionPromptToolResultToPermissionDecision(
  result: Output,
  tool: Tool,
  input: { [key: string]: unknown },
  toolUseContext: ToolUseContext,
): PermissionDecision {
  // 决策原因 集中保存权限工具 Permission Prompt Tool Result ...要一起传递的字段。
  const decisionReason: PermissionDecisionReason = {
    type: 'permissionPromptTool',
    permissionPromptToolName: tool.name,
    toolResult: result,
  }
  // 当 `result.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
  if (result.behavior === 'allow') {
    // updatedPermissions 权限数据 命名 `result.updatedPermissions`，让后续代码直接表达这个值的用途。
    const updatedPermissions = result.updatedPermissions
    // 满足 `updatedPermissions` 时，权限判定执行该分支。
    if (updatedPermissions) {
      // toolUseContext.setAppState 写入新的状态值，使权限判定后续读取保持一致。
      toolUseContext.setAppState(prev => ({
        ...prev,
        toolPermissionContext: applyPermissionUpdates(
          prev.toolPermissionContext,
          updatedPermissions,
        ),
      }))
      // 调用 persistPermissionUpdates，触发权限判定此处需要的副作用。
      persistPermissionUpdates(updatedPermissions)
    }
    // Mobile clients responding from a push notification don't have the
    // original tool input, so they send `{}` to satisfy the schema. Treat an
    // empty object as "use original" so the tool doesn't run with no args.
    // updatedInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const updatedInput =
      Object.keys(result.updatedInput).length > 0 ? result.updatedInput : input
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      ...result,
      updatedInput,
      decisionReason,
    }
  // 权限工具 Permission Prompt Tool Result ...在这里处理 `} else if (result.behavior === 'deny' && result.interrupt) {`，完成这一小步状态转换。
  } else if (result.behavior === 'deny' && result.interrupt) {
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `SDK permission prompt deny+interrupt: tool=${tool.name} message=${result.message}`,
    )
    // 触发取消信号，通知权限判定中仍在等待的异步任务尽快停止。
    toolUseContext.abortController.abort()
  }
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...result,
    decisionReason,
  }
}
