// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getKairosActive、getUserMsgOptIn，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getKairosActive, getUserMsgOptIn } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'
// 引入 resolveAttachments、validateAttachmentPaths，将 ./attachments.js 中已经封装好的能力接到本文件流程里。
import { resolveAttachments, validateAttachmentPaths } from './attachments.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  BRIEF_TOOL_NAME,
  BRIEF_TOOL_PROMPT,
  DESCRIPTION,
  LEGACY_BRIEF_TOOL_NAME,
} from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    message: z
      .string()
      .describe('The message for the user. Supports markdown formatting.'),
    attachments: z
      .array(z.string())
      .optional()
      .describe(
        'Optional file paths (absolute or relative to cwd) to attach. Use for photos, screenshots, diffs, logs, or any file the user should see alongside your message.',
      ),
    status: z
      .enum(['normal', 'proactive'])
      .describe(
        "Use 'proactive' when you're surfacing something the user hasn't asked for and needs to see now — task completion while they're away, a blocker you hit, an unsolicited status update. Use 'normal' when replying to something the user just said.",
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// attachments MUST remain optional — resumed sessions replay pre-attachment
// outputs verbatim and a required field would crash the UI renderer on resume.
// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    message: z.string().describe('The message'),
    attachments: z
      .array(
        z.object({
          path: z.string(),
          size: z.number(),
          isImage: z.boolean(),
          file_uuid: z.string().optional(),
        }),
      )
      .optional()
      .describe('Resolved attachment metadata'),
    sentAt: z
      .string()
      .optional()
      .describe(
        'ISO timestamp captured at tool execution on the emitting process. Optional — resumed sessions replay pre-sentAt outputs verbatim.',
      ),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// KAIROS_BRIEF_REFRESH_MS 集合保存`5 * 60 * 1000`，供工具实现 Brief Tool后续判断或输出使用。
const KAIROS_BRIEF_REFRESH_MS = 5 * 60 * 1000

/**
 * Entitlement check — is the user ALLOWED to use Brief? Combines build-time
 * flags with runtime GB gate + assistant-mode passthrough. No opt-in check
 * here — this decides whether opt-in should be HONORED, not whether the user
 * has opted in.
 *
 * Build-time OR-gated on KAIROS || KAIROS_BRIEF (same pattern as
 * PROACTIVE || KAIROS): assistant mode depends on Brief, so KAIROS alone
 * must bundle it. KAIROS_BRIEF lets Brief ship independently.
 *
 * Use this to decide whether `--brief` / `defaultView: 'chat'` / `--tools`
 * listing should be honored. Use `isBriefEnabled()` to decide whether the
 * tool is actually active in the current session.
 *
 * CLAUDE_CODE_BRIEF env var force-grants entitlement for dev/testing —
 * bypasses the GB gate so you can test without being enrolled. Still
 * requires an opt-in action to activate (--brief, defaultView, etc.), but
 * the env var alone also sets userMsgOptIn via maybeActivateBrief().
 */
// isBriefEntitled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBriefEntitled(): boolean {
  // Positive ternary — see docs/feature-gating.md. Negative early-return
  // would not eliminate the GB gate string from external builds.
  // 返回 `feature('KAIROS') || feature('KAIROS_BRIEF')`，作为工具调用这次计算的结果。
  return feature('KAIROS') || feature('KAIROS_BRIEF')
    ? getKairosActive() ||
        isEnvTruthy(process.env.CLAUDE_CODE_BRIEF) ||
        getFeatureValue_CACHED_WITH_REFRESH(
          'tengu_kairos_brief',
          false,
          KAIROS_BRIEF_REFRESH_MS,
        )
    : false
}

/**
 * Unified activation gate for the Brief tool. Governs model-facing behavior
 * as a unit: tool availability, system prompt section (getBriefSection),
 * tool-deferral bypass (isDeferredTool), and todo-nag suppression.
 *
 * Activation requires explicit opt-in (userMsgOptIn) set by one of:
 *   - `--brief` CLI flag (maybeActivateBrief in main.tsx)
 *   - `defaultView: 'chat'` in settings (main.tsx init)
 *   - `/brief` slash command (brief.ts)
 *   - `/config` defaultView picker (Config.tsx)
 *   - SendUserMessage in `--tools` / SDK `tools` option (main.tsx)
 *   - CLAUDE_CODE_BRIEF env var (maybeActivateBrief — dev/testing bypass)
 * Assistant mode (kairosActive) bypasses opt-in since its system prompt
 * hard-codes "you MUST use SendUserMessage" (systemPrompt.md:14).
 *
 * The GB gate is re-checked here as a kill-switch AND — flipping
 * tengu_kairos_brief off mid-session disables the tool on the next 5-min
 * refresh even for opted-in sessions. No opt-in → always false regardless
 * of GB (this is the fix for "brief defaults on for enrolled ants").
 *
 * Called from Tool.isEnabled() (lazy, post-init), never at module scope.
 * getKairosActive() and getUserMsgOptIn() are set in main.tsx before any
 * caller reaches here.
 */
// isBriefEnabled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBriefEnabled(): boolean {
  // Top-level feature() guard is load-bearing for DCE: Bun can constant-fold
  // the ternary to `false` in external builds and then dead-code the BriefTool
  // object. Composing isBriefEntitled() alone (which has its own guard) is
  // semantically equivalent but defeats constant-folding across the boundary.
  // 返回 `feature('KAIROS') || feature('KAIROS_BRIEF')`，作为工具调用这次计算的结果。
  return feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (getKairosActive() || getUserMsgOptIn()) && isBriefEntitled()
    : false
}

// BriefTool构建`buildTool`，供工具调用后续处理使用。
export const BriefTool = buildTool({
  name: BRIEF_TOOL_NAME,
  aliases: [LEGACY_BRIEF_TOOL_NAME],
  searchHint:
    'send a message to the user — your primary visible output channel',
  maxResultSizeChars: 100_000,
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  // 工具实现 Brief Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Brief Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isBriefEnabled()`，作为工具调用这次计算的结果。
    return isBriefEnabled()
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.message`，作为工具调用这次计算的结果。
    return input.message
  },
  // validateInput 使用 { attachments }, _context 完成工具调用里的对应操作。
  async validateInput({ attachments }, _context): Promise<ValidationResult> {
    // !attachments || attachments 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (!attachments || attachments.length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }
    // 返回 `validateAttachmentPaths(attachments)`，作为工具调用这次计算的结果。
    return validateAttachmentPaths(attachments)
  },
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `BRIEF_TOOL_PROMPT`，作为工具调用这次计算的结果。
    return BRIEF_TOOL_PROMPT
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // n 命名 `output.attachments?.length ?? 0`，让后续代码直接表达这个值的用途。
    const n = output.attachments?.length ?? 0
    // suffix保存`plural`，供工具调用后续处理使用。
    const suffix = n === 0 ? '' : ` (${n} ${plural(n, 'attachment')} included)`
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Message delivered to user.${suffix}`,
    }
  },
  renderToolUseMessage,
  renderToolResultMessage,
  // call 使用 { message, attachments, status }, context 完成工具调用里的对应操作。
  async call({ message, attachments, status }, context) {
    // sentAt记录时间`Date`，供工具调用后续处理使用。
    const sentAt = new Date().toISOString()
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_brief_send', {
      proactive: status === 'proactive',
      attachment_count: attachments?.length ?? 0,
    })
    // !attachments || attachments 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (!attachments || attachments.length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { data: { message, sentAt } }
    }
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // resolved读取`resolveAttachments`，供工具调用后续处理使用。
    const resolved = await resolveAttachments(attachments, {
      replBridgeEnabled: appState.replBridgeEnabled,
      signal: context.abortController.signal,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: { message, attachments: resolved, sentAt },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
