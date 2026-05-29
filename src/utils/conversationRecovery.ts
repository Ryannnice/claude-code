// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 引入 addInvokedSkill，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { addInvokedSkill } from '../bootstrap/state.js'
// 引入 asSessionId，将 ../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asSessionId } from '../types/ids.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AttributionSnapshotMessage,
  ContextCollapseCommitEntry,
  ContextCollapseSnapshotEntry,
  LogOption,
  PersistedWorktreeSession,
  SerializedMessage,
} from '../types/logs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  Message,
  NormalizedMessage,
  NormalizedUserMessage,
} from '../types/message.js'
// 引入 PERMISSION_MODES，将 ../types/permissions.js 中已经封装好的能力接到本文件流程里。
import { PERMISSION_MODES } from '../types/permissions.js'
// 引入 suppressNextSkillListing，将 ./attachments.js 中已经封装好的能力接到本文件流程里。
import { suppressNextSkillListing } from './attachments.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  copyFileHistoryForResume,
  type FileHistorySnapshot,
} from './fileHistory.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createAssistantMessage,
  createUserMessage,
  filterOrphanedThinkingOnlyMessages,
  filterUnresolvedToolUses,
  filterWhitespaceOnlyAssistantMessages,
  isToolUseResultMessage,
  NO_RESPONSE_REQUESTED,
  normalizeMessages,
} from './messages.js'
// 引入 copyPlanForResume，将 ./plans.js 中已经封装好的能力接到本文件流程里。
import { copyPlanForResume } from './plans.js'
// 引入 processSessionStartHooks，将 ./sessionStart.js 中已经封装好的能力接到本文件流程里。
import { processSessionStartHooks } from './sessionStart.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  buildConversationChain,
  checkResumeConsistency,
  getLastSessionLog,
  getSessionIdFromLog,
  isLiteLog,
  loadFullLog,
  loadMessageLogs,
  loadTranscriptFile,
  removeExtraFields,
} from './sessionStorage.js'
// 类型依赖 { ContentReplacementRecord } 来自 ./toolResultStorage.js，用于校准共享工具的数据契约。
import type { ContentReplacementRecord } from './toolResultStorage.js'

// Dead code elimination: ant-only tool names are conditionally required so
// their strings don't leak into external builds. Static imports always bundle.
/* eslint-disable @typescript-eslint/no-require-imports */
// BRIEF_TOOL_NAME 先占位，稍后的条件分支会根据实际输入补齐它。
const BRIEF_TOOL_NAME: string | null =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (
        require('../tools/BriefTool/prompt.js') as typeof import('../tools/BriefTool/prompt.js')
      ).BRIEF_TOOL_NAME
    : null
// LEGACY_BRIEF_TOOL_NAME 先占位，稍后的条件分支会根据实际输入补齐它。
const LEGACY_BRIEF_TOOL_NAME: string | null =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (
        require('../tools/BriefTool/prompt.js') as typeof import('../tools/BriefTool/prompt.js')
      ).LEGACY_BRIEF_TOOL_NAME
    : null
// SEND_USER_FILE_TOOL_NAME 文件数据 通过懒加载取得，避免共享工具 conversation Recovery在启动阶段加载暂时用不到的实现。
const SEND_USER_FILE_TOOL_NAME: string | null = feature('KAIROS')
  ? (
      require('../tools/SendUserFileTool/prompt.js') as typeof import('../tools/SendUserFileTool/prompt.js')
    ).SEND_USER_FILE_TOOL_NAME
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Transforms legacy attachment types to current types for backward compatibility
 */
// migrateLegacyAttachmentTypes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function migrateLegacyAttachmentTypes(message: Message): Message {
  // `message.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'attachment') {
    // 返回 `message`，作为共享工具这次计算的结果。
    return message
  }

  // attachment保存`message.attachment as {`，供后续判断或组装使用。
  const attachment = message.attachment as {
    type: string
    [key: string]: unknown
  } // Handle legacy types not in current type system

  // Transform legacy attachment types
  // 当 `attachment.type` 匹配 `'new_file'` 时，共享工具执行对应分支。
  if (attachment.type === 'new_file') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...message,
      attachment: {
        ...attachment,
        type: 'file',
        displayPath: relative(getCwd(), attachment.filename as string),
      },
    } as SerializedMessage // Cast entire message since we know the structure is correct
  }

  // 当 `attachment.type` 匹配 `'new_directory'` 时，共享工具执行对应分支。
  if (attachment.type === 'new_directory') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...message,
      attachment: {
        ...attachment,
        type: 'directory',
        displayPath: relative(getCwd(), attachment.path as string),
      },
    } as SerializedMessage // Cast entire message since we know the structure is correct
  }

  // Backfill displayPath for attachments from old sessions
  // 满足 `!('displayPath' in attachment)` 时，共享工具执行该分支。
  if (!('displayPath' in attachment)) {
    // path 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const path =
      'filename' in attachment
        ? (attachment.filename as string)
        : 'path' in attachment
          ? (attachment.path as string)
          : 'skillDir' in attachment
            ? (attachment.skillDir as string)
            : undefined
    // 满足 `path` 时，共享工具执行该分支。
    if (path) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        ...message,
        attachment: {
          ...attachment,
          displayPath: relative(getCwd(), path),
        },
      } as Message
    }
  }

  // 返回 `message`，作为共享工具这次计算的结果。
  return message
}

// TeleportRemoteResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeleportRemoteResponse = {
  log: Message[]
  branch?: string
}

// TurnInterruptionState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TurnInterruptionState =
  | { kind: 'none' }
  | { kind: 'interrupted_prompt'; message: NormalizedUserMessage }

// DeserializeResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeserializeResult = {
  messages: Message[]
  turnInterruptionState: TurnInterruptionState
}

/**
 * Deserializes messages from a log file into the format expected by the REPL.
 * Filters unresolved tool uses, orphaned thinking messages, and appends a
 * synthetic assistant sentinel when the last message is from the user.
 * @internal Exported for testing - use loadConversationForResume instead
 */
// deserializeMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deserializeMessages(serializedMessages: Message[]): Message[] {
  // 返回 `deserializeMessagesWithInterruptDetection(serializedMessages).messages`，作为共享工具这次计算的结果。
  return deserializeMessagesWithInterruptDetection(serializedMessages).messages
}

/**
 * Like deserializeMessages, but also detects whether the session was
 * interrupted mid-turn. Used by the SDK resume path to auto-continue
 * interrupted turns after a gateway-triggered restart.
 * @internal Exported for testing
 */
// deserializeMessagesWithInterruptDetection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deserializeMessagesWithInterruptDetection(
  serializedMessages: Message[],
): DeserializeResult {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Transform legacy attachment types before processing
    // migratedMessages 消息数据派生`serializedMessages.map`，供共享工具后续处理使用。
    const migratedMessages = serializedMessages.map(
      migrateLegacyAttachmentTypes,
    )

    // Strip invalid permissionMode values from deserialized user messages.
    // The field is unvalidated JSON from disk and may contain modes from a different build.
    // validModes 集合 命名 `new Set<string>(PERMISSION_MODES)`，让后续代码直接表达这个值的用途。
    const validModes = new Set<string>(PERMISSION_MODES)
    // 按顺序遍历 `migratedMessages` 中的消息，逐个交给共享工具处理。
    for (const msg of migratedMessages) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        msg.type === 'user' &&
        msg.permissionMode !== undefined &&
        !validModes.has(msg.permissionMode)
      ) {
        // permissionMode 权限数据更新为 `undefined`，确保共享工具后续读取最新状态。
        msg.permissionMode = undefined
      }
    }

    // Filter out unresolved tool uses and any synthetic messages that follow them
    // filteredToolUses 集合筛选`filterUnresolvedToolUses`，供共享工具后续处理使用。
    const filteredToolUses = filterUnresolvedToolUses(
      migratedMessages,
    ) as NormalizedMessage[]

    // Filter out orphaned thinking-only assistant messages that can cause API errors
    // during resume. These occur when streaming yields separate messages per content
    // block and interleaved user messages prevent proper merging by message.id.
    // filteredThinking筛选`filterOrphanedThinkingOnlyMessages`，供共享工具后续处理使用。
    const filteredThinking = filterOrphanedThinkingOnlyMessages(
      filteredToolUses,
    ) as NormalizedMessage[]

    // Filter out assistant messages with only whitespace text content.
    // This can happen when model outputs "\n\n" before thinking, user cancels mid-stream.
    // filteredMessages 消息数据筛选`filterWhitespaceOnlyAssistantMessages`，供共享工具后续处理使用。
    const filteredMessages = filterWhitespaceOnlyAssistantMessages(
      filteredThinking,
    ) as NormalizedMessage[]

    // internalState 状态读取`detectTurnInterruption`，供共享工具后续处理使用。
    const internalState = detectTurnInterruption(filteredMessages)

    // Transform mid-turn interruptions into interrupted_prompt by appending
    // a synthetic continuation message. This unifies both interruption kinds
    // so the consumer only needs to handle interrupted_prompt.
    // turnInterruptionState 状态 先占位，稍后的条件分支会根据实际输入补齐它。
    let turnInterruptionState: TurnInterruptionState
    // 当 `internalState.kind` 匹配 `'interrupted_turn'` 时，共享工具执行对应分支。
    if (internalState.kind === 'interrupted_turn') {
      // 从 `normalizeMessages([` 按位置拆出 continuationMessage，让共享工具 conversation Recovery分别处理这些返回值。
      const [continuationMessage] = normalizeMessages([
        createUserMessage({
          content: 'Continue from where you left off.',
          isMeta: true,
        }),
      ])
      // filteredMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      filteredMessages.push(continuationMessage!)
      // turnInterruptionState 状态更新为 `{`，确保共享工具后续读取最新状态。
      turnInterruptionState = {
        kind: 'interrupted_prompt',
        message: continuationMessage!,
      }
    } else {
      // turnInterruptionState 状态更新为 `internalState`，确保共享工具后续读取最新状态。
      turnInterruptionState = internalState
    }

    // Append a synthetic assistant sentinel after the last user message so
    // the conversation is API-valid if no resume action is taken. Skip past
    // trailing system/progress messages and insert right after the user
    // message so removeInterruptedMessage's splice(idx, 2) removes the
    // correct pair.
    // lastRelevantIdx筛选`filteredMessages.findLastIndex`，供共享工具后续处理使用。
    const lastRelevantIdx = filteredMessages.findLastIndex(
      // m更新为 `> m.type !== 'system' && m.type !== 'progress'`，确保共享工具后续读取最新状态。
      m => m.type !== 'system' && m.type !== 'progress',
    )
    // 共享工具在这里按实际状态进入对应分支。
    if (
      lastRelevantIdx !== -1 &&
      filteredMessages[lastRelevantIdx]!.type === 'user'
    ) {
      // 调用 filteredMessages.splice，触发共享工具此处需要的副作用。
      filteredMessages.splice(
        lastRelevantIdx + 1,
        0,
        createAssistantMessage({
          content: NO_RESPONSE_REQUESTED,
        }) as NormalizedMessage,
      )
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { messages: filteredMessages, turnInterruptionState }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

/**
 * Internal 3-way result from detection, before transforming interrupted_turn
 * into interrupted_prompt with a synthetic continuation message.
 */
// InternalInterruptionState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InternalInterruptionState =
  | TurnInterruptionState
  | { kind: 'interrupted_turn' }

/**
 * Determines whether the conversation was interrupted mid-turn based on the
 * last message after filtering. An assistant as last message (after filtering
 * unresolved tool_uses) is treated as a completed turn because stop_reason is
 * always null on persisted messages in the streaming path.
 *
 * System and progress messages are skipped when finding the last turn-relevant
 * message — they are bookkeeping artifacts that should not mask a genuine
 * interruption. Attachments are kept as part of the turn.
 */
// detectTurnInterruption 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectTurnInterruption(
  messages: NormalizedMessage[],
): InternalInterruptionState {
  // 对话消息为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'none' }
  }

  // Find the last turn-relevant message, skipping system/progress and
  // synthetic API error assistants. Error assistants are already filtered
  // before API send (normalizeMessagesForAPI) — skipping them here lets
  // auto-resume fire after retry exhaustion instead of reading the error as
  // a completed turn.
  // lastMessageIdx 消息数据筛选`messages.findLastIndex`，供共享工具后续处理使用。
  const lastMessageIdx = messages.findLastIndex(
    // m更新为 `>`，确保共享工具后续读取最新状态。
    m =>
      m.type !== 'system' &&
      m.type !== 'progress' &&
      !(m.type === 'assistant' && m.isApiErrorMessage),
  )
  // lastMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lastMessage =
    lastMessageIdx !== -1 ? messages[lastMessageIdx] : undefined

  // lastMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastMessage) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'none' }
  }

  // 当 `lastMessage.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (lastMessage.type === 'assistant') {
    // In the streaming path, stop_reason is always null on persisted messages
    // because messages are recorded at content_block_stop time, before
    // message_delta delivers the stop_reason. After filterUnresolvedToolUses
    // has removed assistant messages with unmatched tool_uses, an assistant as
    // the last message means the turn most likely completed normally.
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'none' }
  }

  // 当 `lastMessage.type` 匹配 `'user'` 时，共享工具执行对应分支。
  if (lastMessage.type === 'user') {
    // 只有 `lastMessage.isMeta || lastMessage.isCompactSummary` 满足时，共享工具才执行该分支。
    if (lastMessage.isMeta || lastMessage.isCompactSummary) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { kind: 'none' }
    }
    // 满足 `isToolUseResultMessage(lastMessage)` 时，共享工具执行该分支。
    if (isToolUseResultMessage(lastMessage)) {
      // Brief mode (#20467) drops the trailing assistant text block, so a
      // completed brief-mode turn legitimately ends on SendUserMessage's
      // tool_result. Without this check, resume misclassifies every
      // brief-mode session as interrupted mid-turn and injects a phantom
      // "Continue from where you left off." before the user's real next
      // prompt. Look back one step for the originating tool_use.
      // 满足 `isTerminalToolResult(lastMessage, messages, lastMessageIdx)` 时，共享工具执行该分支。
      if (isTerminalToolResult(lastMessage, messages, lastMessageIdx)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { kind: 'none' }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { kind: 'interrupted_turn' }
    }
    // Plain text user prompt — CC hadn't started responding
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'interrupted_prompt', message: lastMessage }
  }

  // 当 `lastMessage.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
  if (lastMessage.type === 'attachment') {
    // Attachments are part of the user turn — the user provided context but
    // the assistant never responded.
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'interrupted_turn' }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { kind: 'none' }
}

/**
 * Is this tool_result the output of a tool that legitimately terminates a
 * turn? SendUserMessage is the canonical case: in brief mode, calling it is
 * the turn's final act — there is no follow-up assistant text (#20467
 * removed it). A transcript ending here means the turn COMPLETED, not that
 * it was killed mid-tool.
 *
 * Walks back to find the assistant tool_use that this result belongs to and
 * checks its name. The matching tool_use is typically the immediately
 * preceding relevant message (filterUnresolvedToolUses has already dropped
 * unpaired ones), but we walk just in case system/progress noise is
 * interleaved.
 */
// isTerminalToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTerminalToolResult(
  result: NormalizedUserMessage,
  messages: NormalizedMessage[],
  resultIdx: number,
): boolean {
  // 文本内容保存`result.message.content`，供共享工具 conversation Recovery后续判断或输出使用。
  const content = result.message.content
  // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
  if (!Array.isArray(content)) return false
  // block读取 `content[0]` 对应条目，后续围绕该成员继续处理。
  const block = content[0]
  // `block?.type` 与 `'tool_result'` 不一致时刷新派生状态，避免使用过期结果。
  if (block?.type !== 'tool_result') return false
  // toolUseId 命名 `block.tool_use_id`，让后续代码直接表达这个值的用途。
  const toolUseId = block.tool_use_id

  // 循环处理 `let i = resultIdx - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = resultIdx - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // `msg.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'assistant') continue
    // 按顺序遍历 `msg.message.content` 中的b，逐个交给共享工具处理。
    for (const b of msg.message.content) {
      // 只有 `b.type === 'tool_use' && b.id === toolUseId` 满足时，共享工具才执行该分支。
      if (b.type === 'tool_use' && b.id === toolUseId) {
        // 返回 `(`，作为共享工具这次计算的结果。
        return (
          b.name === BRIEF_TOOL_NAME ||
          b.name === LEGACY_BRIEF_TOOL_NAME ||
          b.name === SEND_USER_FILE_TOOL_NAME
        )
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Restores skill state from invoked_skills attachments in messages.
 * This ensures that skills are preserved across resume after compaction.
 * Without this, if another compaction happens after resume, the skills would be lost
 * because STATE.invokedSkills would be empty.
 * @internal Exported for testing - use loadConversationForResume instead
 */
// restoreSkillStateFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreSkillStateFromMessages(messages: Message[]): void {
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // `message.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'attachment') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `message.attachment.type` 匹配 `'invoked_skills'` 时，共享工具执行对应分支。
    if (message.attachment.type === 'invoked_skills') {
      // 按顺序遍历 `message.attachment.skills` 中的skill，逐个交给共享工具处理。
      for (const skill of message.attachment.skills) {
        // 只有 `skill.name && skill.path && skill.content` 满足时，共享工具才执行该分支。
        if (skill.name && skill.path && skill.content) {
          // Resume only happens for the main session, so agentId is null
          // 调用 addInvokedSkill，触发共享工具此处需要的副作用。
          addInvokedSkill(skill.name, skill.path, skill.content, null)
        }
      }
    }
    // A prior process already injected the skills-available reminder — it's
    // in the transcript the model is about to see. sentSkillNames is
    // process-local, so without this every resume re-announces the same
    // ~600 tokens. Fire-once latch; consumed on the first attachment pass.
    // 当 `message.attachment.type` 匹配 `'skill_listing'` 时，共享工具执行对应分支。
    if (message.attachment.type === 'skill_listing') {
      // 调用 suppressNextSkillListing，触发共享工具此处需要的副作用。
      suppressNextSkillListing()
    }
  }
}

/**
 * Chain-walk a transcript jsonl by path.  Same sequence loadFullLog
 * runs internally — loadTranscriptFile → find newest non-sidechain
 * leaf → buildConversationChain → removeExtraFields — just starting
 * from an arbitrary path instead of the sid-derived one.
 *
 * leafUuids is populated by loadTranscriptFile as "uuids that no
 * other message's parentUuid points at" — the chain tips.  There can
 * be several (sidechains, orphans); newest non-sidechain is the main
 * conversation's end.
 */
// loadMessagesFromJsonlPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadMessagesFromJsonlPath(path: string): Promise<{
  messages: SerializedMessage[]
  sessionId: UUID | undefined
}> {
  // 从 `await loadTranscriptFile(path)` 解构 messages、leafUuids，减少共享工具 conversation Recovery对同一对象的重复访问。
  const { messages: byUuid, leafUuids } = await loadTranscriptFile(path)
  // tip初始化为空值，后续分支会在有数据时补齐。
  let tip: (typeof byUuid extends Map<UUID, infer T> ? T : never) | null = null
  // tipTs 集合保存`0`，供后续判断或组装使用。
  let tipTs = 0
  // 逐项读取 `byUuid.values()` 中的m，按输入顺序推进共享工具。
  for (const m of byUuid.values()) {
    // 只有 `m.isSidechain || !leafUuids.has(m.uuid)` 满足时，共享工具才执行该分支。
    if (m.isSidechain || !leafUuids.has(m.uuid)) continue
    // ts 集合记录时间`Date`，供共享工具后续处理使用。
    const ts = new Date(m.timestamp).getTime()
    // 满足 `ts > tipTs` 时，共享工具执行该分支。
    if (ts > tipTs) {
      // tipTs 集合更新为 `ts`，确保共享工具后续读取最新状态。
      tipTs = ts
      // tip更新为 `m`，确保共享工具后续读取最新状态。
      tip = m
    }
  }
  // tip缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!tip) return { messages: [], sessionId: undefined }
  // chain构建`buildConversationChain`，供共享工具后续处理使用。
  const chain = buildConversationChain(byUuid, tip)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: removeExtraFields(chain),
    // Leaf's sessionId — forked sessions copy chain[0] from the source
    // transcript, so the root retains the source session's ID. Matches
    // loadFullLog's mostRecentLeaf.sessionId.
    sessionId: tip.sessionId as UUID | undefined,
  }
}

/**
 * Loads a conversation for resume from various sources.
 * This is the centralized function for loading and deserializing conversations.
 *
 * @param source - The source to load from:
 *   - undefined: load most recent conversation
 *   - string: session ID to load
 *   - LogOption: already loaded conversation
 * @param sourceJsonlFile - Alternate: path to a transcript jsonl.
 *   Used when --resume receives a .jsonl path (cli/print.ts routes
 *   on suffix), typically for cross-directory resume where the
 *   transcript lives outside the current project dir.
 * @returns Object containing the deserialized messages and the original log, or null if not found
 */
// loadConversationForResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadConversationForResume(
  source: string | LogOption | undefined,
  sourceJsonlFile: string | undefined,
): Promise<{
  messages: Message[]
  turnInterruptionState: TurnInterruptionState
  fileHistorySnapshots?: FileHistorySnapshot[]
  attributionSnapshots?: AttributionSnapshotMessage[]
  contentReplacements?: ContentReplacementRecord[]
  contextCollapseCommits?: ContextCollapseCommitEntry[]
  contextCollapseSnapshot?: ContextCollapseSnapshotEntry
  sessionId: UUID | undefined
  // Session metadata for restoring agent context
  agentName?: string
  agentColor?: string
  agentSetting?: string
  customTitle?: string
  tag?: string
  mode?: 'coordinator' | 'normal'
  worktreeSession?: PersistedWorktreeSession | null
  prNumber?: number
  prUrl?: string
  prRepository?: string
  // Full path to the session file (for cross-directory resume)
  fullPath?: string
} | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // log初始化为空值，后续分支会在有数据时补齐。
    let log: LogOption | null = null
    // 对话消息初始化为空值，后续分支会在有数据时补齐。
    let messages: Message[] | null = null
    // sessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let sessionId: UUID | undefined

    // 满足 `source === undefined` 时，共享工具执行该分支。
    if (source === undefined) {
      // --continue: most recent session, skipping live --bg/daemon sessions
      // that are actively writing their own transcript.
      // logsPromise 异步任务保存 `loadMessageLogs` 启动的异步任务，稍后再决定等待还是后台完成。
      const logsPromise = loadMessageLogs()
      // skip构建`new Set<string>()`，供后续判断或组装使用。
      let skip = new Set<string>()
      // 满足 `feature('BG_SESSIONS')` 时，共享工具执行该分支。
      if (feature('BG_SESSIONS')) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 从 `await import('./udsClient.js')` 解构 listAllLiveSessions，减少共享工具 conversation Recovery对同一对象的重复访问。
          const { listAllLiveSessions } = await import('./udsClient.js')
          // live保存`listAllLiveSessions`，供共享工具后续处理使用。
          const live = await listAllLiveSessions()
          // skip更新为 `new Set(`，确保共享工具后续读取最新状态。
          skip = new Set(
            // 调用 live.flatMap，触发共享工具此处需要的副作用。
            live.flatMap(s =>
              s.kind && s.kind !== 'interactive' && s.sessionId
                ? [s.sessionId]
                : [],
            ),
          )
        } catch {
          // UDS unavailable — treat all sessions as continuable
        }
      }
      // logs 集合 等待 `logsPromise`，确保继续执行前已有结果。
      const logs = await logsPromise
      // 共享工具 conversation Recovery在这里处理 `log =`，完成这一小步状态转换。
      log =
        // 调用 logs.find，触发共享工具此处需要的副作用。
        logs.find(l => {
          // 标识符读取`getSessionIdFromLog`，供共享工具后续处理使用。
          const id = getSessionIdFromLog(l)
          // 返回 `!id || !skip.has(id)`，作为共享工具这次计算的结果。
          return !id || !skip.has(id)
        }) ?? null
    // 共享工具 conversation Recovery在这里处理 `} else if (sourceJsonlFile) {`，完成这一小步状态转换。
    } else if (sourceJsonlFile) {
      // --resume with a .jsonl path (cli/print.ts routes on suffix).
      // Same chain walk as the sid branch below — only the starting
      // path differs.
      // loaded读取`loadMessagesFromJsonlPath`，供共享工具后续处理使用。
      const loaded = await loadMessagesFromJsonlPath(sourceJsonlFile)
      // 对话消息更新为 `loaded.messages`，确保共享工具后续读取最新状态。
      messages = loaded.messages
      // sessionId 会话数据更新为 `loaded.sessionId`，确保共享工具后续读取最新状态。
      sessionId = loaded.sessionId
    // 共享工具 conversation Recovery在这里处理 `} else if (typeof source === 'string') {`，完成这一小步状态转换。
    } else if (typeof source === 'string') {
      // Load specific session by ID
      // log更新为 `await getLastSessionLog(source as UUID)`，确保共享工具后续读取最新状态。
      log = await getLastSessionLog(source as UUID)
      // sessionId 会话数据更新为 `source as UUID`，确保共享工具后续读取最新状态。
      sessionId = source as UUID
    } else {
      // Already have a LogOption
      // log更新为 `source`，确保共享工具后续读取最新状态。
      log = source
    }

    // 只有 `!log && !messages` 满足时，共享工具才执行该分支。
    if (!log && !messages) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 满足 `log` 时，共享工具执行该分支。
    if (log) {
      // Load full messages for lite logs
      // 满足 `isLiteLog(log)` 时，共享工具执行该分支。
      if (isLiteLog(log)) {
        // log更新为 `await loadFullLog(log)`，确保共享工具后续读取最新状态。
        log = await loadFullLog(log)
      }

      // Determine sessionId first so we can pass it to copy functions
      // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!sessionId) {
        // sessionId 会话数据更新为 `getSessionIdFromLog(log) as UUID`，确保共享工具后续读取最新状态。
        sessionId = getSessionIdFromLog(log) as UUID
      }
      // Pass the original session ID to ensure the plan slug is associated with
      // the session we're resuming, not the temporary session ID before resume
      // 满足 `sessionId` 时，共享工具执行该分支。
      if (sessionId) {
        // 等待 `copyPlanForResume(log, asSessionId(sessionId))` 完成，再继续共享工具 conversation Recovery的异步流程。
        await copyPlanForResume(log, asSessionId(sessionId))
      }

      // Copy file history for resume
      // 显式忽略 `copyFileHistoryForResume(log)` 的返回值，只保留它触发的副作用。
      void copyFileHistoryForResume(log)

      // 对话消息更新为 `log.messages`，确保共享工具后续读取最新状态。
      messages = log.messages
      // 调用 checkResumeConsistency，触发共享工具此处需要的副作用。
      checkResumeConsistency(messages)
    }

    // Restore skill state from invoked_skills attachments before deserialization.
    // This ensures skills survive multiple compaction cycles after resume.
    // 调用 restoreSkillStateFromMessages，触发共享工具此处需要的副作用。
    restoreSkillStateFromMessages(messages!)

    // Deserialize messages to handle unresolved tool uses and ensure proper format
    // deserialized保存`deserializeMessagesWithInterruptDetection`，供共享工具后续处理使用。
    const deserialized = deserializeMessagesWithInterruptDetection(messages!)
    // 对话消息更新为 `deserialized.messages`，确保共享工具后续读取最新状态。
    messages = deserialized.messages

    // Process session start hooks for resume
    // hookMessages 消息数据保存`processSessionStartHooks`，供共享工具后续处理使用。
    const hookMessages = await processSessionStartHooks('resume', { sessionId })

    // Append hook messages to the conversation
    // 对话消息追加新条目，保持收集顺序与输入顺序一致。
    messages.push(...hookMessages)

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      messages,
      turnInterruptionState: deserialized.turnInterruptionState,
      fileHistorySnapshots: log?.fileHistorySnapshots,
      attributionSnapshots: log?.attributionSnapshots,
      contentReplacements: log?.contentReplacements,
      contextCollapseCommits: log?.contextCollapseCommits,
      contextCollapseSnapshot: log?.contextCollapseSnapshot,
      sessionId,
      // Include session metadata for restoring agent context on resume
      agentName: log?.agentName,
      agentColor: log?.agentColor,
      agentSetting: log?.agentSetting,
      customTitle: log?.customTitle,
      tag: log?.tag,
      mode: log?.mode,
      worktreeSession: log?.worktreeSession,
      prNumber: log?.prNumber,
      prUrl: log?.prUrl,
      prRepository: log?.prRepository,
      // Include full path for cross-directory resume
      fullPath: log?.fullPath,
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}
