// 类型依赖 { ToolUseBlock } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准共享工具的数据契约。
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 last，将 lodash-es/last.js 中已经封装好的能力接到本文件流程里。
import last from 'lodash-es/last.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSessionId,
  isSessionPersistenceDisabled,
} from 'src/bootstrap/state.js'
// 类型依赖 { SDKMessage } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { SDKMessage } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { CanUseToolFn } 来自 ../hooks/useCanUseTool.js，用于校准共享工具的数据契约。
import type { CanUseToolFn } from '../hooks/useCanUseTool.js'
// 接入 runTools 工具实现，后续工具池会按权限和开关决定是否暴露。
import { runTools } from '../services/tools/toolOrchestration.js'
// 引入 findToolByName、Tool、Tools，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tool, type Tools } from '../Tool.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 类型依赖 { Input as FileReadInput } 来自 ../tools/FileReadTool/FileReadTool.js，用于校准共享工具的数据契约。
import type { Input as FileReadInput } from '../tools/FileReadTool/FileReadTool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  FILE_READ_TOOL_NAME,
  FILE_UNCHANGED_STUB,
} from '../tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 类型依赖 { OrphanedPermission } 来自 ../types/textInputTypes.js，用于校准共享工具的数据契约。
import type { OrphanedPermission } from '../types/textInputTypes.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from './errors.js'
// 引入 getFileModificationTime、stripLineNumberPrefix，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getFileModificationTime, stripLineNumberPrefix } from './file.js'
// 引入 readFileSyncWithMetadata，将 ./fileRead.js 中已经封装好的能力接到本文件流程里。
import { readFileSyncWithMetadata } from './fileRead.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createFileStateCacheWithSizeLimit,
  type FileStateCache,
} from './fileStateCache.js'
// 引入 isNotEmptyMessage、normalizeMessages，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { isNotEmptyMessage, normalizeMessages } from './messages.js'
// 引入 expandPath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from './path.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  inputSchema as permissionToolInputSchema,
  outputSchema as permissionToolOutputSchema,
} from './permissions/PermissionPromptToolResultSchema.js'
// 类型依赖 { ProcessUserInputContext } 来自 ./processUserInput/processUserInput.js，用于校准共享工具的数据契约。
import type { ProcessUserInputContext } from './processUserInput/processUserInput.js'
// 引入 recordTranscript，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { recordTranscript } from './sessionStorage.js'

// PermissionPromptTool 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionPromptTool = Tool<
  ReturnType<typeof permissionToolInputSchema>,
  ReturnType<typeof permissionToolOutputSchema>
>

// Small cache size for ask operations which typically access few files
// during permission prompts or limited tool operations
// ASK_READ_FILE_STATE_CACHE_SIZE 文件数据保存`10`，供后续判断或组装使用。
const ASK_READ_FILE_STATE_CACHE_SIZE = 10

/**
 * Checks if the result should be considered successful based on the last message.
 * Returns true if:
 * - Last message is assistant with text/thinking content
 * - Last message is user with only tool_result blocks
 * - Last message is the user prompt but the API completed with end_turn
 *   (model chose to emit no content blocks)
 */
// isResultSuccessful 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isResultSuccessful(
  message: Message | undefined,
  stopReason: string | null = null,
): message is Message {
  // 消息缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!message) return false

  // 当 `message.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
  if (message.type === 'assistant') {
    // lastContent保存`last`，供共享工具后续处理使用。
    const lastContent = last(message.message.content)
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      lastContent?.type === 'text' ||
      lastContent?.type === 'thinking' ||
      lastContent?.type === 'redacted_thinking'
    )
  }

  // 当 `message.type` 匹配 `'user'` 时，共享工具执行对应分支。
  if (message.type === 'user') {
    // Check if all content blocks are tool_result type
    // 文本内容保存`message.message.content`，供共享工具 query Helpers后续判断或输出使用。
    const content = message.message.content
    // 共享工具在这里按实际状态进入对应分支。
    if (
      Array.isArray(content) &&
      content.length > 0 &&
      // 调用 content.every，触发共享工具此处需要的副作用。
      content.every(block => 'type' in block && block.type === 'tool_result')
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Carve-out: API completed (message_delta set stop_reason) but yielded
  // no assistant content — last(messages) is still this turn's prompt.
  // claude.ts:2026 recognizes end_turn-with-zero-content-blocks as
  // legitimate and passes through without throwing. Observed on
  // task_notification drain turns: model returns stop_reason=end_turn,
  // outputTokens=4, textContentLength=0 — it saw the subagent result
  // and decided nothing needed saying. Without this, QueryEngine emits
  // error_during_execution with errors[] = the entire process's
  // accumulated logError() buffer. Covers both string-content and
  // text-block-content user prompts, and any other non-passing shape.
  // 返回 `stopReason === 'end_turn'`，作为共享工具这次计算的结果。
  return stopReason === 'end_turn'
}

// Track last sent time for tool progress messages per tool use ID
// Keep only the last 100 entries to prevent unbounded growth
// MAX_TOOL_PROGRESS_TRACKING_ENTRIES 集合保存`100`，供共享工具 query Helpers后续判断或输出使用。
const MAX_TOOL_PROGRESS_TRACKING_ENTRIES = 100
// TOOL_PROGRESS_THROTTLE_MS 集合保存`30000`，供后续判断或组装使用。
const TOOL_PROGRESS_THROTTLE_MS = 30000
// toolProgressLastSentTime构建`new Map<string, number>()` 整理出中间结果，供共享工具 query Helpers后续步骤使用。
const toolProgressLastSentTime = new Map<string, number>()

// 共享工具 query Helpers在这里处理 `export function* normalizeMessage(message: Message): Generator<SDKMessa...`，完成这一小步状态转换。
export function* normalizeMessage(message: Message): Generator<SDKMessage> {
  // 按照 message.type 的取值选择共享工具的具体处理分支。
  switch (message.type) {
    case 'assistant':
      // 逐项读取 `normalizeMessages([message])` 中的_，按输入顺序推进共享工具。
      for (const _ of normalizeMessages([message])) {
        // Skip empty messages (e.g., "(no content)") that shouldn't be output to SDK
        // 满足 `!isNotEmptyMessage(_)` 时，共享工具执行该分支。
        if (!isNotEmptyMessage(_)) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          type: 'assistant',
          message: _.message,
          parent_tool_use_id: null,
          session_id: getSessionId(),
          uuid: _.uuid,
          error: _.error,
        }
      }
      // 共享工具 query Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    case 'progress':
      // 共享工具在这里按实际状态进入对应分支。
      if (
        message.data.type === 'agent_progress' ||
        message.data.type === 'skill_progress'
      ) {
        // 逐项读取 `normalizeMessages([message.data.message])` 中的_，按输入顺序推进共享工具。
        for (const _ of normalizeMessages([message.data.message])) {
          // 按照 _.type 的取值选择共享工具的具体处理分支。
          switch (_.type) {
            case 'assistant':
              // Skip empty messages (e.g., "(no content)") that shouldn't be output to SDK
              // 满足 `!isNotEmptyMessage(_)` 时，共享工具执行该分支。
              if (!isNotEmptyMessage(_)) {
                // 结束这个分支或循环，避免共享工具继续落入后续路径。
                break
              }
              // 生成器产出 `{`，把阶段性结果交给上层消费。
              yield {
                type: 'assistant',
                message: _.message,
                parent_tool_use_id: message.parentToolUseID,
                session_id: getSessionId(),
                uuid: _.uuid,
                error: _.error,
              }
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            case 'user':
              // 生成器产出 `{`，把阶段性结果交给上层消费。
              yield {
                type: 'user',
                message: _.message,
                parent_tool_use_id: message.parentToolUseID,
                session_id: getSessionId(),
                uuid: _.uuid,
                timestamp: _.timestamp,
                isSynthetic: _.isMeta || _.isVisibleInTranscriptOnly,
                tool_use_result: _.mcpMeta
                  ? { content: _.toolUseResult, ..._.mcpMeta }
                  : _.toolUseResult,
              }
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
          }
        }
      // 共享工具 query Helpers在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        message.data.type === 'bash_progress' ||
        message.data.type === 'powershell_progress'
      ) {
        // Filter bash progress to send only one per minute
        // Only emit for Claude Code Remote for now
        // 共享工具在这里按实际状态进入对应分支。
        if (
          !isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
          !process.env.CLAUDE_CODE_CONTAINER_ID
        ) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }

        // Use parentToolUseID as the key since toolUseID changes for each progress message
        // trackingKey保存`message.parentToolUseID`，供共享工具 query Helpers后续判断或输出使用。
        const trackingKey = message.parentToolUseID
        // now记录时间`Date.now`，供共享工具后续处理使用。
        const now = Date.now()
        // lastSent读取`toolProgressLastSentTime.get`，供共享工具后续处理使用。
        const lastSent = toolProgressLastSentTime.get(trackingKey) || 0
        // timeSinceLastSent 命名 `now - lastSent`，让后续代码直接表达这个值的用途。
        const timeSinceLastSent = now - lastSent

        // Send if at least 30 seconds have passed since last update
        // 满足 `timeSinceLastSent >= TOOL_PROGRESS_THROTTLE_MS` 时，共享工具执行该分支。
        if (timeSinceLastSent >= TOOL_PROGRESS_THROTTLE_MS) {
          // Remove oldest entry if we're at capacity (LRU eviction)
          // 共享工具在这里按实际状态进入对应分支。
          if (
            toolProgressLastSentTime.size >= MAX_TOOL_PROGRESS_TRACKING_ENTRIES
          ) {
            // firstKey保存`toolProgressLastSentTime.keys`，供共享工具后续处理使用。
            const firstKey = toolProgressLastSentTime.keys().next().value
            // `firstKey` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (firstKey !== undefined) {
              // 调用 toolProgressLastSentTime.delete，触发共享工具此处需要的副作用。
              toolProgressLastSentTime.delete(firstKey)
            }
          }

          // toolProgressLastSentTime.set 写入新的状态值，使共享工具后续读取保持一致。
          toolProgressLastSentTime.set(trackingKey, now)
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'tool_progress',
            tool_use_id: message.toolUseID,
            tool_name:
              message.data.type === 'bash_progress' ? 'Bash' : 'PowerShell',
            parent_tool_use_id: message.parentToolUseID,
            elapsed_time_seconds: message.data.elapsedTimeSeconds,
            task_id: message.data.taskId,
            session_id: getSessionId(),
            uuid: message.uuid,
          }
        }
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'user':
      // 逐项读取 `normalizeMessages([message])` 中的_，按输入顺序推进共享工具。
      for (const _ of normalizeMessages([message])) {
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          type: 'user',
          message: _.message,
          parent_tool_use_id: null,
          session_id: getSessionId(),
          uuid: _.uuid,
          timestamp: _.timestamp,
          isSynthetic: _.isMeta || _.isVisibleInTranscriptOnly,
          tool_use_result: _.mcpMeta
            ? { content: _.toolUseResult, ..._.mcpMeta }
            : _.toolUseResult,
        }
      }
      // 共享工具 query Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    default:
    // yield nothing
  }
}

// 共享工具 query Helpers在这里处理 `export async function* handleOrphanedPermission(`，完成这一小步状态转换。
export async function* handleOrphanedPermission(
  orphanedPermission: OrphanedPermission,
  tools: Tools,
  mutableMessages: Message[],
  processUserInputContext: ProcessUserInputContext,
): AsyncGenerator<SDKMessage, void, unknown> {
  // persistSession 会话数据保存`isSessionPersistenceDisabled`，供共享工具后续处理使用。
  const persistSession = !isSessionPersistenceDisabled()
  // 从 `orphanedPermission` 解构 permissionResult、assistantMessage，减少共享工具 query Helpers对同一对象的重复访问。
  const { permissionResult, assistantMessage } = orphanedPermission
  // 从 `permissionResult` 解构 toolUseID，减少共享工具 query Helpers对同一对象的重复访问。
  const { toolUseID } = permissionResult

  // toolUseID缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!toolUseID) {
    // 共享工具 query Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 文本内容保存`assistantMessage.message.content`，供后续判断或组装使用。
  const content = assistantMessage.message.content
  // toolUseBlock 先占位，稍后的条件分支会根据实际输入补齐它。
  let toolUseBlock: ToolUseBlock | undefined
  // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
  if (Array.isArray(content)) {
    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // 只有 `block.type === 'tool_use' && block.id === toolUse` 满足时，共享工具才执行该分支。
      if (block.type === 'tool_use' && block.id === toolUseID) {
        // toolUseBlock更新为 `block as ToolUseBlock`，确保共享工具后续读取最新状态。
        toolUseBlock = block as ToolUseBlock
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  }

  // toolUseBlock缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!toolUseBlock) {
    // 共享工具 query Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // toolName 命名 `toolUseBlock.name`，让后续代码直接表达这个值的用途。
  const toolName = toolUseBlock.name
  // toolInput保存`toolUseBlock.input`，供共享工具 query Helpers后续判断或输出使用。
  const toolInput = toolUseBlock.input

  // toolDefinition筛选`findToolByName`，供共享工具后续处理使用。
  const toolDefinition = findToolByName(tools, toolName)
  // toolDefinition缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!toolDefinition) {
    // 共享工具 query Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Create ToolUseBlock with the updated input if permission was allowed
  // finalInput保存`toolInput`，供后续判断或组装使用。
  let finalInput = toolInput
  // 当 `permissionResult.behavior` 匹配 `'allow'` 时，共享工具执行对应分支。
  if (permissionResult.behavior === 'allow') {
    // `permissionResult.updatedInput` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (permissionResult.updatedInput !== undefined) {
      // finalInput更新为 `permissionResult.updatedInput`，确保共享工具后续读取最新状态。
      finalInput = permissionResult.updatedInput
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Orphaned permission for ${toolName}: updatedInput is undefined, falling back to original tool input`,
        { level: 'warn' },
      )
    }
  }
  // finalToolUseBlock 集中保存共享工具 query Helpers要一起传递的字段。
  const finalToolUseBlock: ToolUseBlock = {
    ...toolUseBlock,
    input: finalInput,
  }

  // 这个回调绑定到 const canUseTool: CanUseToolFn = async () => ({，负责共享工具在该局部场景下的响应。
  const canUseTool: CanUseToolFn = async () => ({
    ...permissionResult,
    decisionReason: {
      type: 'mode',
      mode: 'default' as const,
    },
  })

  // Add the assistant message with tool_use to messages BEFORE executing
  // so the conversation history is complete (tool_use -> tool_result).
  //
  // On CCR resume, mutableMessages is seeded from the transcript and may already
  // contain this tool_use. Pushing again would make normalizeMessagesForAPI merge
  // same-ID assistants (concatenating content) and produce a duplicate tool_use
  // ID, which the API rejects with "tool_use ids must be unique".
  //
  // Check for the specific tool_use_id rather than message.id: streaming yields
  // each content block as a separate AssistantMessage sharing one message.id, so
  // a [text, tool_use] response lands as two entries. filterUnresolvedToolUses may
  // strip the tool_use entry but keep the text one; an id-based check would then
  // wrongly skip the push while runTools below still executes, orphaning the result.
  // alreadyPresent筛选`mutableMessages.some`，供共享工具后续处理使用。
  const alreadyPresent = mutableMessages.some(
    // m更新为 `>`，确保共享工具后续读取最新状态。
    m =>
      m.type === 'assistant' &&
      Array.isArray(m.message.content) &&
      m.message.content.some(
        // b更新为 `> b.type === 'tool_use' && 'id' in b && b.id === toolUseID`，确保共享工具后续读取最新状态。
        b => b.type === 'tool_use' && 'id' in b && b.id === toolUseID,
      ),
  )
  // alreadyPresent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!alreadyPresent) {
    // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    mutableMessages.push(assistantMessage)
    // 满足 `persistSession` 时，共享工具执行该分支。
    if (persistSession) {
      // 等待 `recordTranscript(mutableMessages)` 完成，再继续共享工具 query Helpers的异步流程。
      await recordTranscript(mutableMessages)
    }
  }

  // sdkAssistantMessage 消息数据 集中保存共享工具 query Helpers要一起传递的字段。
  const sdkAssistantMessage: SDKMessage = {
    ...assistantMessage,
    session_id: getSessionId(),
    parent_tool_use_id: null,
  } as SDKMessage
  // 生成器产出 `sdkAssistantMessage`，把阶段性结果交给上层消费。
  yield sdkAssistantMessage

  // Execute the tool - errors are handled internally by runToolUse
  // 逐项读取 `runTools(` 中的update，按输入顺序推进共享工具 query Helpers。
  for await (const update of runTools(
    [finalToolUseBlock],
    [assistantMessage],
    canUseTool,
    processUserInputContext,
  )) {
    // 满足 `update.message` 时，共享工具执行该分支。
    if (update.message) {
      // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      mutableMessages.push(update.message)
      // 满足 `persistSession` 时，共享工具执行该分支。
      if (persistSession) {
        // 等待 `recordTranscript(mutableMessages)` 完成，再继续共享工具 query Helpers的异步流程。
        await recordTranscript(mutableMessages)
      }

      // sdkMessage 消息数据 集中保存共享工具 query Helpers要一起传递的字段。
      const sdkMessage: SDKMessage = {
        ...update.message,
        session_id: getSessionId(),
        parent_tool_use_id: null,
      } as SDKMessage

      // 生成器产出 `sdkMessage`，把阶段性结果交给上层消费。
      yield sdkMessage
    }
  }
}

// Create a function to extract read files from messages
// extractReadFilesFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractReadFilesFromMessages(
  messages: Message[],
  cwd: string,
  maxSize: number = ASK_READ_FILE_STATE_CACHE_SIZE,
): FileStateCache {
  // cache 缓存构建`createFileStateCacheWithSizeLimit`，供共享工具后续处理使用。
  const cache = createFileStateCacheWithSizeLimit(maxSize)

  // First pass: find all FileReadTool/FileWriteTool/FileEditTool uses in assistant messages
  // fileReadToolUseIds 文件数据构建`new Map<string, string>() // toolUseId -> filePath`，供后续判断或组装使用。
  const fileReadToolUseIds = new Map<string, string>() // toolUseId -> filePath
  // fileWriteToolUseIds 文件数据构建`new Map<`，供后续判断或组装使用。
  const fileWriteToolUseIds = new Map<
    string,
    { filePath: string; content: string }
  >() // toolUseId -> { filePath, content }
  // fileEditToolUseIds 文件数据构建`new Map<string, string>() // toolUseId -> filePath`，供后续判断或组装使用。
  const fileEditToolUseIds = new Map<string, string>() // toolUseId -> filePath

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      message.type === 'assistant' &&
      Array.isArray(message.message.content)
    ) {
      // 按顺序遍历 `message.message.content` 中的文本内容，逐个交给共享工具处理。
      for (const content of message.message.content) {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          content.type === 'tool_use' &&
          content.name === FILE_READ_TOOL_NAME
        ) {
          // Extract file_path from the tool use input
          // 用户输入 命名 `content.input as FileReadInput | undefined`，让后续代码直接表达这个值的用途。
          const input = content.input as FileReadInput | undefined
          // Ranged reads are not added to the cache.
          // 共享工具在这里按实际状态进入对应分支。
          if (
            input?.file_path &&
            input?.offset === undefined &&
            input?.limit === undefined
          ) {
            // Normalize to absolute path for consistent cache lookups
            // absolutePath 路径数据保存`expandPath`，供共享工具后续处理使用。
            const absolutePath = expandPath(input.file_path, cwd)
            // fileReadToolUseIds.set 写入新的状态值，使共享工具后续读取保持一致。
            fileReadToolUseIds.set(content.id, absolutePath)
          }
        // 共享工具 query Helpers在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          content.type === 'tool_use' &&
          content.name === FILE_WRITE_TOOL_NAME
        ) {
          // Extract file_path and content from the Write tool use input
          // 用户输入保存`content.input as`，供后续判断或组装使用。
          const input = content.input as
            | { file_path?: string; content?: string }
            | undefined
          // 只有 `input?.file_path && input?.content` 满足时，共享工具才执行该分支。
          if (input?.file_path && input?.content) {
            // Normalize to absolute path for consistent cache lookups
            // absolutePath 路径数据保存`expandPath`，供共享工具后续处理使用。
            const absolutePath = expandPath(input.file_path, cwd)
            // fileWriteToolUseIds.set 写入新的状态值，使共享工具后续读取保持一致。
            fileWriteToolUseIds.set(content.id, {
              filePath: absolutePath,
              content: input.content,
            })
          }
        // 共享工具 query Helpers在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          content.type === 'tool_use' &&
          content.name === FILE_EDIT_TOOL_NAME
        ) {
          // Edit's input has old_string/new_string, not the resulting content.
          // Track the path so the second pass can read current disk state.
          // 用户输入保存`content.input as { file_path?: string } | undefined`，供共享工具 query Helpers后续判断或输出使用。
          const input = content.input as { file_path?: string } | undefined
          // 满足 `input?.file_path` 时，共享工具执行该分支。
          if (input?.file_path) {
            // absolutePath 路径数据保存`expandPath`，供共享工具后续处理使用。
            const absolutePath = expandPath(input.file_path, cwd)
            // fileEditToolUseIds.set 写入新的状态值，使共享工具后续读取保持一致。
            fileEditToolUseIds.set(content.id, absolutePath)
          }
        }
      }
    }
  }

  // Second pass: find corresponding tool results and extract content
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 只有 `message.type === 'user' && Array.isArray(message.message.content)` 满足时，共享工具才执行该分支。
    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // 按顺序遍历 `message.message.content` 中的文本内容，逐个交给共享工具处理。
      for (const content of message.message.content) {
        // 只有 `content.type === 'tool_result' && content.tool_us` 满足时，共享工具才执行该分支。
        if (content.type === 'tool_result' && content.tool_use_id) {
          // Handle Read tool results
          // readFilePath 路径数据读取`fileReadToolUseIds.get`，供共享工具后续处理使用。
          const readFilePath = fileReadToolUseIds.get(content.tool_use_id)
          // 共享工具在这里按实际状态进入对应分支。
          if (
            readFilePath &&
            typeof content.content === 'string' &&
            // Dedup stubs contain no file content — the earlier real Read
            // already cached it. Chronological last-wins would otherwise
            // overwrite the real entry with stub text.
            !content.content.startsWith(FILE_UNCHANGED_STUB)
          ) {
            // Remove system-reminder blocks from the content
            // processedContent格式化`content.replace`，供共享工具后续处理使用。
            const processedContent = content.content.replace(
              /<system-reminder>[\s\S]*?<\/system-reminder>/g,
              '',
            )

            // Extract the actual file content from the tool result
            // Tool results for text files contain line numbers, we need to strip those
            // fileContent 文件数据保存`processedContent`，供共享工具 query Helpers后续判断或输出使用。
            const fileContent = processedContent
              .split('\n')
              .map(stripLineNumberPrefix)
              .join('\n')
              .trim()

            // Cache the file content with the message timestamp
            // 满足 `message.timestamp` 时，共享工具执行该分支。
            if (message.timestamp) {
              // timestamp记录时间`Date`，供共享工具后续处理使用。
              const timestamp = new Date(message.timestamp).getTime()
              // cache.set 写入新的状态值，使共享工具后续读取保持一致。
              cache.set(readFilePath, {
                content: fileContent,
                timestamp,
                offset: undefined,
                limit: undefined,
              })
            }
          }

          // Handle Write tool results - use content from the tool input
          // writeToolData读取`fileWriteToolUseIds.get`，供共享工具后续处理使用。
          const writeToolData = fileWriteToolUseIds.get(content.tool_use_id)
          // 只有 `writeToolData && message.timestamp` 满足时，共享工具才执行该分支。
          if (writeToolData && message.timestamp) {
            // timestamp记录时间`Date`，供共享工具后续处理使用。
            const timestamp = new Date(message.timestamp).getTime()
            // cache.set 写入新的状态值，使共享工具后续读取保持一致。
            cache.set(writeToolData.filePath, {
              content: writeToolData.content,
              timestamp,
              offset: undefined,
              limit: undefined,
            })
          }

          // Handle Edit tool results — post-edit content isn't in the
          // tool_use input (only old_string/new_string) nor fully in the
          // result (only a snippet). Read from disk now, using actual mtime
          // so getChangedFiles's mtime check passes on the next turn.
          //
          // Callers seed the cache once at process start (print.ts --resume,
          // Cowork cold-restart per turn), so disk content at extraction time
          // IS the post-edit state. No dedup: processing every Edit preserves
          // last-wins semantics when Read/Write interleave (Edit→Read→Edit).
          // editFilePath 路径数据读取`fileEditToolUseIds.get`，供共享工具后续处理使用。
          const editFilePath = fileEditToolUseIds.get(content.tool_use_id)
          // `editFilePath && content.is_error` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
          if (editFilePath && content.is_error !== true) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 共享工具 query Helpers先整理这一处局部数据，后续分支可以直接读取。
              const { content: diskContent } =
                readFileSyncWithMetadata(editFilePath)
              // cache.set 写入新的状态值，使共享工具后续读取保持一致。
              cache.set(editFilePath, {
                content: diskContent,
                timestamp: getFileModificationTime(editFilePath),
                offset: undefined,
                limit: undefined,
              })
            } catch (e: unknown) {
              // 满足 `!isFsInaccessible(e)` 时，共享工具执行该分支。
              if (!isFsInaccessible(e)) {
                // 抛出 e，阻止共享工具在无效状态下继续运行。
                throw e
              }
              // File deleted or inaccessible since the Edit — skip
            }
          }
        }
      }
    }
  }

  // 返回 `cache`，作为共享工具这次计算的结果。
  return cache
}

/**
 * Extract the top-level CLI tools used in BashTool calls from message history.
 * Returns a deduplicated set of command names (e.g. 'vercel', 'aws', 'git').
 */
// extractBashToolsFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractBashToolsFromMessages(messages: Message[]): Set<string> {
  // tools 集合构建`new Set<string>()`，供后续判断或组装使用。
  const tools = new Set<string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      message.type === 'assistant' &&
      Array.isArray(message.message.content)
    ) {
      // 按顺序遍历 `message.message.content` 中的文本内容，逐个交给共享工具处理。
      for (const content of message.message.content) {
        // 只有 `content.type === 'tool_use' && content.name === B` 满足时，共享工具才执行该分支。
        if (content.type === 'tool_use' && content.name === BASH_TOOL_NAME) {
          // 从 `content` 解构 input，减少共享工具 query Helpers对同一对象的重复访问。
          const { input } = content
          // 共享工具在这里按实际状态进入对应分支。
          if (
            typeof input !== 'object' ||
            input === null ||
            !('command' in input)
          )
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          // cmd 命令数据保存`extractCliName`，供共享工具后续处理使用。
          const cmd = extractCliName(
            typeof input.command === 'string' ? input.command : undefined,
          )
          // 满足 `cmd` 时，共享工具执行该分支。
          if (cmd) {
            // 调用 tools.add，触发共享工具此处需要的副作用。
            tools.add(cmd)
          }
        }
      }
    }
  }
  // 返回 `tools`，作为共享工具这次计算的结果。
  return tools
}

// STRIPPED_COMMANDS 命令数据保存`Set`，供共享工具后续处理使用。
const STRIPPED_COMMANDS = new Set(['sudo'])

/**
 * Extract the actual CLI name from a bash command string, skipping
 * env var assignments (e.g. `FOO=bar vercel` → `vercel`) and prefixes
 * in STRIPPED_COMMANDS.
 */
// extractCliName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractCliName(command: string | undefined): string | undefined {
  // 命令缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!command) return undefined
  // token 列表格式化`command.trim`，供共享工具后续处理使用。
  const tokens = command.trim().split(/\s+/)
  // 按顺序遍历 `tokens` 中的token，逐个交给共享工具处理。
  for (const token of tokens) {
    // 满足 `/^[A-Za-z_]\w*=/.test(token)` 时，共享工具执行该分支。
    if (/^[A-Za-z_]\w*=/.test(token)) continue
    // 满足 `STRIPPED_COMMANDS.has(token)` 时，共享工具执行该分支。
    if (STRIPPED_COMMANDS.has(token)) continue
    // 返回 `token`，作为共享工具这次计算的结果。
    return token
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}
