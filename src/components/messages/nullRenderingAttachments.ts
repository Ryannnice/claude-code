// 类型依赖 { Attachment } 来自 src/utils/attachments.js，用于校准终端渲染的数据契约。
import type { Attachment } from 'src/utils/attachments.js'
// 类型依赖 { Message, NormalizedMessage } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message, NormalizedMessage } from '../../types/message.js'

/**
 * Attachment types that AttachmentMessage renders as `null` unconditionally
 * (no visible output regardless of runtime state). Messages.tsx filters these
 * out BEFORE the render cap / message count so invisible entries don't consume
 * the 200-message render budget (CC-724).
 *
 * Sync is enforced by TypeScript: AttachmentMessage's switch `default:` branch
 * asserts `attachment.type satisfies NullRenderingAttachmentType`. Adding a new
 * Attachment type without either a case or an entry here will fail typecheck.
 */
// NULL_RENDERING_TYPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const NULL_RENDERING_TYPES = [
  'hook_success',
  'hook_additional_context',
  'hook_cancelled',
  'command_permissions',
  'agent_mention',
  'budget_usd',
  'critical_system_reminder',
  'edited_image_file',
  'edited_text_file',
  'opened_file_in_ide',
  'output_style',
  'plan_mode',
  'plan_mode_exit',
  'plan_mode_reentry',
  'structured_output',
  'team_context',
  'todo_reminder',
  'context_efficiency',
  'deferred_tools_delta',
  'mcp_instructions_delta',
  'companion_intro',
  'token_usage',
  'ultrathink_effort',
  'max_turns_reached',
  'task_reminder',
  'auto_mode',
  'auto_mode_exit',
  'output_token_usage',
  'pen_mode_enter',
  'pen_mode_exit',
  'verify_plan_reminder',
  'current_session_memory',
  'compaction_reminder',
  'date_change',
] as const satisfies readonly Attachment['type'][]

// NullRenderingAttachmentType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type NullRenderingAttachmentType = (typeof NULL_RENDERING_TYPES)[number]

// NULL_RENDERING_ATTACHMENT_TYPES 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const NULL_RENDERING_ATTACHMENT_TYPES: ReadonlySet<Attachment['type']> =
  new Set(NULL_RENDERING_TYPES)

/**
 * True when this message is an attachment that AttachmentMessage renders as
 * null with no visible output. Messages.tsx filters these out before counting
 * and before applying the 200-message render cap, so invisible hook
 * attachments (hook_success, hook_additional_context, hook_cancelled) don't
 * inflate the "N messages" count or eat into the render budget (CC-724).
 */
// isNullRenderingAttachment 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isNullRenderingAttachment(
  msg: Message | NormalizedMessage,
): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    msg.type === 'attachment' &&
    NULL_RENDERING_ATTACHMENT_TYPES.has(msg.attachment.type)
  )
}
