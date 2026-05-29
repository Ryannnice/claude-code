// 类型依赖 { BetaContentBlock } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaContentBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID, type UUID } from 'crypto'
// 引入 getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from 'src/bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  LOCAL_COMMAND_STDERR_TAG,
  LOCAL_COMMAND_STDOUT_TAG,
} from 'src/constants/xml.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  SDKAssistantMessage,
  SDKCompactBoundaryMessage,
  SDKMessage,
  SDKRateLimitInfo,
} from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { ClaudeAILimits } 来自 src/services/claudeAiLimits.js，用于校准共享工具的数据契约。
import type { ClaudeAILimits } from 'src/services/claudeAiLimits.js'
// 接入 EXIT_PLAN_MODE_V2_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from 'src/tools/ExitPlanModeTool/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  CompactMetadata,
  Message,
} from 'src/types/message.js'
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准共享工具的数据契约。
import type { DeepImmutable } from 'src/types/utils.js'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 引入 createAssistantMessage，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { createAssistantMessage } from '../messages.js'
// 引入 getPlan，将 ../plans.js 中已经封装好的能力接到本文件流程里。
import { getPlan } from '../plans.js'

// toInternalMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toInternalMessages(
  messages: readonly DeepImmutable<SDKMessage>[],
): Message[] {
  // 返回 `messages.flatMap(message => {`，作为共享工具这次计算的结果。
  return messages.flatMap(message => {
    // 按照 message.type 的取值选择共享工具的具体处理分支。
    switch (message.type) {
      case 'assistant':
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [
          {
            type: 'assistant',
            message: message.message,
            uuid: message.uuid,
            requestId: undefined,
            timestamp: new Date().toISOString(),
          } as Message,
        ]
      case 'user':
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [
          {
            type: 'user',
            message: message.message,
            uuid: message.uuid ?? randomUUID(),
            timestamp: message.timestamp ?? new Date().toISOString(),
            isMeta: message.isSynthetic,
          } as Message,
        ]
      case 'system':
        // Handle compact boundary messages
        // 当 `message.subtype` 匹配 `'compact_boundary'` 时，共享工具执行对应分支。
        if (message.subtype === 'compact_boundary') {
          // compactMsg 命名 `message`，让后续代码直接表达这个值的用途。
          const compactMsg = message
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [
            {
              type: 'system',
              content: 'Conversation compacted',
              level: 'info',
              subtype: 'compact_boundary',
              compactMetadata: fromSDKCompactMetadata(
                compactMsg.compact_metadata,
              ),
              uuid: message.uuid,
              timestamp: new Date().toISOString(),
            },
          ]
        }
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      default:
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
    }
  })
}

// SDKCompactMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SDKCompactMetadata = SDKCompactBoundaryMessage['compact_metadata']

// toSDKCompactMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toSDKCompactMetadata(
  meta: CompactMetadata,
): SDKCompactMetadata {
  // seg保存`meta.preservedSegment`，供后续判断或组装使用。
  const seg = meta.preservedSegment
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    trigger: meta.trigger,
    pre_tokens: meta.preTokens,
    ...(seg && {
      preserved_segment: {
        head_uuid: seg.headUuid,
        anchor_uuid: seg.anchorUuid,
        tail_uuid: seg.tailUuid,
      },
    }),
  }
}

/**
 * Shared SDK→internal compact_metadata converter.
 */
// fromSDKCompactMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fromSDKCompactMetadata(
  meta: SDKCompactMetadata,
): CompactMetadata {
  // seg保存`meta.preserved_segment`，供后续判断或组装使用。
  const seg = meta.preserved_segment
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    trigger: meta.trigger,
    preTokens: meta.pre_tokens,
    ...(seg && {
      preservedSegment: {
        headUuid: seg.head_uuid,
        anchorUuid: seg.anchor_uuid,
        tailUuid: seg.tail_uuid,
      },
    }),
  }
}

// toSDKMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toSDKMessages(messages: Message[]): SDKMessage[] {
  // 返回 `messages.flatMap((message): SDKMessage[] => {`，作为共享工具这次计算的结果。
  return messages.flatMap((message): SDKMessage[] => {
    // 按照 message.type 的取值选择共享工具的具体处理分支。
    switch (message.type) {
      case 'assistant':
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [
          {
            type: 'assistant',
            message: normalizeAssistantMessageForSDK(message),
            session_id: getSessionId(),
            parent_tool_use_id: null,
            uuid: message.uuid,
            error: message.error,
          },
        ]
      case 'user':
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [
          {
            type: 'user',
            message: message.message,
            session_id: getSessionId(),
            parent_tool_use_id: null,
            uuid: message.uuid,
            timestamp: message.timestamp,
            isSynthetic: message.isMeta || message.isVisibleInTranscriptOnly,
            // Structured tool output (not the string content sent to the
            // model — the full Output object). Rides the protobuf catchall
            // so web viewers can read things like BriefTool's file_uuid
            // without it polluting model context.
            ...(message.toolUseResult !== undefined
              ? { tool_use_result: message.toolUseResult }
              : {}),
          },
        ]
      case 'system':
        // 只有 `message.subtype === 'compact_boundary' && message` 满足时，共享工具才执行该分支。
        if (message.subtype === 'compact_boundary' && message.compactMetadata) {
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [
            {
              type: 'system',
              subtype: 'compact_boundary' as const,
              session_id: getSessionId(),
              uuid: message.uuid,
              compact_metadata: toSDKCompactMetadata(message.compactMetadata),
            },
          ]
        }
        // Only convert local_command messages that contain actual command
        // output (stdout/stderr). The same subtype is also used for command
        // input metadata (e.g. <command-name>...</command-name>) which must
        // not leak to the RC web UI.
        // 共享工具在这里按实际状态进入对应分支。
        if (
          message.subtype === 'local_command' &&
          (message.content.includes(`<${LOCAL_COMMAND_STDOUT_TAG}>`) ||
            message.content.includes(`<${LOCAL_COMMAND_STDERR_TAG}>`))
        ) {
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [
            localCommandOutputToSDKAssistantMessage(
              message.content,
              message.uuid,
            ),
          ]
        }
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      default:
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
    }
  })
}

/**
 * Converts local command output (e.g. /voice, /cost) to a well-formed
 * SDKAssistantMessage so downstream consumers (mobile apps, session-ingress
 * v1alpha→v1beta converter) can parse it without schema changes.
 *
 * Emitted as assistant instead of the dedicated SDKLocalCommandOutputMessage
 * because the system/local_command_output subtype is unknown to:
 *   - mobile-apps Android SdkMessageTypes.kt (no local_command_output handler)
 *   - api-go session-ingress convertSystemEvent (only init/compact_boundary)
 * See: https://anthropic.sentry.io/issues/7266299248/ (Android)
 *
 * Strips ANSI (e.g. chalk.dim() in /cost) then unwraps the XML wrapper tags.
 */
// localCommandOutputToSDKAssistantMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function localCommandOutputToSDKAssistantMessage(
  rawContent: string,
  uuid: UUID,
): SDKAssistantMessage {
  // cleanContent保存`stripAnsi`，供共享工具后续处理使用。
  const cleanContent = stripAnsi(rawContent)
    .replace(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/, '$1')
    .replace(/<local-command-stderr>([\s\S]*?)<\/local-command-stderr>/, '$1')
    .trim()
  // createAssistantMessage builds a complete APIAssistantMessage with id, type,
  // model: SYNTHETIC_MODEL, role, stop_reason, usage — all fields required by
  // downstream deserializers like Android's SdkAssistantMessage.
  // synthetic构建`createAssistantMessage`，供共享工具后续处理使用。
  const synthetic = createAssistantMessage({ content: cleanContent })
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'assistant',
    message: synthetic.message,
    parent_tool_use_id: null,
    session_id: getSessionId(),
    uuid,
  }
}

/**
 * Maps internal ClaudeAILimits to the SDK-facing SDKRateLimitInfo type,
 * stripping internal-only fields like unifiedRateLimitFallbackAvailable.
 */
// toSDKRateLimitInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toSDKRateLimitInfo(
  limits: ClaudeAILimits | undefined,
): SDKRateLimitInfo | undefined {
  // limits 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!limits) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    status: limits.status,
    ...(limits.resetsAt !== undefined && { resetsAt: limits.resetsAt }),
    ...(limits.rateLimitType !== undefined && {
      rateLimitType: limits.rateLimitType,
    }),
    ...(limits.utilization !== undefined && {
      utilization: limits.utilization,
    }),
    ...(limits.overageStatus !== undefined && {
      overageStatus: limits.overageStatus,
    }),
    ...(limits.overageResetsAt !== undefined && {
      overageResetsAt: limits.overageResetsAt,
    }),
    ...(limits.overageDisabledReason !== undefined && {
      overageDisabledReason: limits.overageDisabledReason,
    }),
    ...(limits.isUsingOverage !== undefined && {
      isUsingOverage: limits.isUsingOverage,
    }),
    ...(limits.surpassedThreshold !== undefined && {
      surpassedThreshold: limits.surpassedThreshold,
    }),
  }
}

/**
 * Normalizes tool inputs in assistant message content for SDK consumption.
 * Specifically injects plan content into ExitPlanModeV2 tool inputs since
 * the V2 tool reads plan from file instead of input, but SDK users expect
 * tool_input.plan to exist.
 */
// normalizeAssistantMessageForSDK 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeAssistantMessageForSDK(
  message: AssistantMessage,
): AssistantMessage['message'] {
  // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
  const content = message.message.content
  // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
  if (!Array.isArray(content)) {
    // 返回 `message.message`，作为共享工具这次计算的结果。
    return message.message
  }

  // normalizedContent派生`content.map`，供共享工具后续处理使用。
  const normalizedContent = content.map((block): BetaContentBlock => {
    // `block.type` 与 `'tool_use'` 不一致时刷新派生状态，避免使用过期结果。
    if (block.type !== 'tool_use') {
      // 返回 `block`，作为共享工具这次计算的结果。
      return block
    }

    // 满足 `block.name === EXIT_PLAN_MODE_V2_TOOL_NAME` 时，共享工具执行该分支。
    if (block.name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
      // plan读取`getPlan`，供共享工具后续处理使用。
      const plan = getPlan()
      // 满足 `plan` 时，共享工具执行该分支。
      if (plan) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          ...block,
          input: { ...(block.input as Record<string, unknown>), plan },
        }
      }
    }

    // 返回 `block`，作为共享工具这次计算的结果。
    return block
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...message.message,
    content: normalizedContent,
  }
}
