// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  Base64ImageSource,
  ContentBlockParam,
  ImageBlockParam,
} from '@anthropic-ai/sdk/resources/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { QuerySource } 来自 src/constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from 'src/constants/querySource.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 getContentText 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { getContentText } from 'src/utils/messages.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findCommand,
  getCommandName,
  isBridgeSafeCommand,
  type LocalJSXCommandContext,
} from '../../commands.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准共享工具的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 类型依赖 { IDESelection } 来自 ../../hooks/useIdeSelection.js，用于校准共享工具的数据契约。
import type { IDESelection } from '../../hooks/useIdeSelection.js'
// 类型依赖 { SetToolJSXFn, ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { SetToolJSXFn, ToolUseContext } from '../../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  ProgressMessage,
  SystemMessage,
  UserMessage,
} from '../../types/message.js'
// 类型依赖 { PermissionMode } 来自 ../../types/permissions.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../../types/permissions.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isValidImagePaste,
  type PromptInputMode,
} from '../../types/textInputTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AgentMentionAttachment,
  createAttachmentMessage,
  getAttachmentMessages,
} from '../attachments.js'
// 类型依赖 { PastedContent } 来自 ../config.js，用于校准共享工具的数据契约。
import type { PastedContent } from '../config.js'
// 类型依赖 { EffortValue } 来自 ../effort.js，用于校准共享工具的数据契约。
import type { EffortValue } from '../effort.js'
// 引入 toArray，将 ../generators.js 中已经封装好的能力接到本文件流程里。
import { toArray } from '../generators.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  executeUserPromptSubmitHooks,
  getUserPromptSubmitHookBlockingMessage,
} from '../hooks.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createImageMetadataText,
  maybeResizeAndDownsampleImageBlock,
} from '../imageResizer.js'
// 引入 storeImages，将 ../imageStore.js 中已经封装好的能力接到本文件流程里。
import { storeImages } from '../imageStore.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createCommandInputMessage,
  createSystemMessage,
  createUserMessage,
} from '../messages.js'
// 引入 queryCheckpoint，将 ../queryProfiler.js 中已经封装好的能力接到本文件流程里。
import { queryCheckpoint } from '../queryProfiler.js'
// 引入 parseSlashCommand，将 ../slashCommandParsing.js 中已经封装好的能力接到本文件流程里。
import { parseSlashCommand } from '../slashCommandParsing.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  hasUltraplanKeyword,
  replaceUltraplanKeyword,
} from '../ultraplan/keyword.js'
// 引入 processTextPrompt，将 ./processTextPrompt.js 中已经封装好的能力接到本文件流程里。
import { processTextPrompt } from './processTextPrompt.js'
// ProcessUserInputContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProcessUserInputContext = ToolUseContext & LocalJSXCommandContext

// ProcessUserInputBaseResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProcessUserInputBaseResult = {
  messages: (
    | UserMessage
    | AssistantMessage
    | AttachmentMessage
    | SystemMessage
    | ProgressMessage
  )[]
  shouldQuery: boolean
  allowedTools?: string[]
  model?: string
  effort?: EffortValue
  // Output text for non-interactive mode (e.g., forked commands)
  // When set, this is used as the result in -p mode instead of empty string
  resultText?: string
  // When set, prefills or submits the next input after command completes
  // Used by /discover to chain into the selected feature's command
  nextInput?: string
  submitNextInput?: boolean
}

// processUserInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processUserInput({
  input,
  preExpansionInput,
  mode,
  setToolJSX,
  context,
  pastedContents,
  ideSelection,
  messages,
  setUserInputOnProcessing,
  uuid,
  isAlreadyProcessing,
  querySource,
  canUseTool,
  skipSlashCommands,
  bridgeOrigin,
  isMeta,
  skipAttachments,
}: {
  input: string | Array<ContentBlockParam>
  /**
   * Input before [Pasted text #N] expansion. Used for ultraplan keyword
   * detection so pasted content containing the word cannot trigger. Falls
   * back to the string `input` when unset.
   */
  preExpansionInput?: string
  mode: PromptInputMode
  setToolJSX: SetToolJSXFn
  context: ProcessUserInputContext
  pastedContents?: Record<number, PastedContent>
  ideSelection?: IDESelection
  messages?: Message[]
  // 这个回调绑定到 setUserInputOnProcessing?: (prompt?: string) => void，负责共享工具在该局部场景下的响应。
  setUserInputOnProcessing?: (prompt?: string) => void
  uuid?: string
  isAlreadyProcessing?: boolean
  querySource?: QuerySource
  canUseTool?: CanUseToolFn
  /**
   * When true, input starting with `/` is treated as plain text.
   * Used for remotely-received messages (bridge/CCR) that should not
   * trigger local slash commands or skills.
   */
  skipSlashCommands?: boolean
  /**
   * When true, slash commands matching isBridgeSafeCommand() execute even
   * though skipSlashCommands is set. See QueuedCommand.bridgeOrigin.
   */
  bridgeOrigin?: boolean
  /**
   * When true, the resulting UserMessage gets `isMeta: true` (user-hidden,
   * model-visible). Propagated from `QueuedCommand.isMeta` for queued
   * system-generated prompts.
   */
  isMeta?: boolean
  skipAttachments?: boolean
}): Promise<ProcessUserInputBaseResult> {
  // inputString标记共享工具 process User Input是否启用对应路径。
  const inputString = typeof input === 'string' ? input : null
  // Immediately show the user input prompt while we are still processing the input.
  // Skip for isMeta (system-generated prompts like scheduled tasks) — those
  // should run invisibly.
  // `mode === 'prompt' && inputString` 与 `null && !isM` 不一致时刷新派生状态，避免使用过期结果。
  if (mode === 'prompt' && inputString !== null && !isMeta) {
    // 调用 setUserInputOnProcessing?.(inputString)，完成这一处局部操作。
    setUserInputOnProcessing?.(inputString)
  }

  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_process_user_input_base_start')

  // appState 状态读取`context.getAppState`，供共享工具后续处理使用。
  const appState = context.getAppState()

  // 结果保存`processUserInputBase`，供共享工具后续处理使用。
  const result = await processUserInputBase(
    input,
    mode,
    setToolJSX,
    context,
    pastedContents,
    ideSelection,
    messages,
    uuid,
    isAlreadyProcessing,
    querySource,
    canUseTool,
    appState.toolPermissionContext.mode,
    skipSlashCommands,
    bridgeOrigin,
    isMeta,
    skipAttachments,
    preExpansionInput,
  )
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_process_user_input_base_end')

  // result.shouldQuery缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!result.shouldQuery) {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // Execute UserPromptSubmit hooks and handle blocking
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_hooks_start')
  // inputMessage 消息数据读取`getContentText`，供共享工具后续处理使用。
  const inputMessage = getContentText(input) || ''

  // 逐项读取 `executeUserPromptSubmitHooks(` 中的hookResult，按输入顺序推进共享工具 process User Input。
  for await (const hookResult of executeUserPromptSubmitHooks(
    inputMessage,
    appState.toolPermissionContext.mode,
    context,
    context.requestPrompt,
  )) {
    // We only care about the result
    // 当 `hookResult.message?.type` 匹配 `'progress'` 时，共享工具执行对应分支。
    if (hookResult.message?.type === 'progress') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Return only a system-level error message, erasing the original user input
    // 满足 `hookResult.blockingError` 时，共享工具执行该分支。
    if (hookResult.blockingError) {
      // blockingMessage 消息数据读取`getUserPromptSubmitHookBlockingMessage`，供共享工具后续处理使用。
      const blockingMessage = getUserPromptSubmitHookBlockingMessage(
        hookResult.blockingError,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        messages: [
          // TODO: Make this an attachment message
          createSystemMessage(
            `${blockingMessage}\n\nOriginal prompt: ${input}`,
            'warning',
          ),
        ],
        shouldQuery: false,
        allowedTools: result.allowedTools,
      }
    }

    // If preventContinuation is set, stop processing but keep the original
    // prompt in context.
    // 满足 `hookResult.preventContinuation` 时，共享工具执行该分支。
    if (hookResult.preventContinuation) {
      // 消息保存`hookResult.stopReason`，供后续判断或组装使用。
      const message = hookResult.stopReason
        ? `Operation stopped by hook: ${hookResult.stopReason}`
        : 'Operation stopped by hook'
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      result.messages.push(
        createUserMessage({
          content: message,
        }),
      )
      // shouldQuery更新为 `false`，确保共享工具后续读取最新状态。
      result.shouldQuery = false
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // Collect additional contexts
    // 共享工具在这里按实际状态进入对应分支。
    if (
      hookResult.additionalContexts &&
      hookResult.additionalContexts.length > 0
    ) {
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      result.messages.push(
        createAttachmentMessage({
          type: 'hook_additional_context',
          content: hookResult.additionalContexts.map(applyTruncation),
          hookName: 'UserPromptSubmit',
          toolUseID: `hook-${randomUUID()}`,
          hookEvent: 'UserPromptSubmit',
        }),
      )
    }

    // TODO: Clean this up
    // 满足 `hookResult.message` 时，共享工具执行该分支。
    if (hookResult.message) {
      // 按照 hookResult.message.attachment.type 的取值选择共享工具的具体处理分支。
      switch (hookResult.message.attachment.type) {
        case 'hook_success':
          // hookResult.message.attachment.content 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!hookResult.message.attachment.content) {
            // Skip if there is no content
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
          // 对话消息追加新条目，保持收集顺序与输入顺序一致。
          result.messages.push({
            ...hookResult.message,
            attachment: {
              ...hookResult.message.attachment,
              content: applyTruncation(hookResult.message.attachment.content),
            },
          })
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        default:
          // 对话消息追加新条目，保持收集顺序与输入顺序一致。
          result.messages.push(hookResult.message)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
      }
    }
  }
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_hooks_end')

  // Happy path: onQuery will clear userInputOnProcessing via startTransition
  // so it resolves in the same frame as deferredMessages (no flicker gap).
  // Error paths are handled by handlePromptSubmit's finally block.
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// MAX_HOOK_OUTPUT_LENGTH 数量保存`10000`，供后续判断或组装使用。
const MAX_HOOK_OUTPUT_LENGTH = 10000

// applyTruncation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyTruncation(content: string): string {
  // 满足 `content.length > MAX_HOOK_OUTPUT_LENGTH` 时，共享工具执行该分支。
  if (content.length > MAX_HOOK_OUTPUT_LENGTH) {
    // 返回 ``${content.substring(0, MAX_HOOK_OUTPUT_LENGTH)}… [output truncated - e...`，作为共享工具这次计算的结果。
    return `${content.substring(0, MAX_HOOK_OUTPUT_LENGTH)}… [output truncated - exceeded ${MAX_HOOK_OUTPUT_LENGTH} characters]`
  }
  // 返回 `content`，作为共享工具这次计算的结果。
  return content
}

// processUserInputBase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processUserInputBase(
  input: string | Array<ContentBlockParam>,
  mode: PromptInputMode,
  setToolJSX: SetToolJSXFn,
  context: ProcessUserInputContext,
  pastedContents?: Record<number, PastedContent>,
  ideSelection?: IDESelection,
  messages?: Message[],
  uuid?: string,
  isAlreadyProcessing?: boolean,
  querySource?: QuerySource,
  canUseTool?: CanUseToolFn,
  permissionMode?: PermissionMode,
  skipSlashCommands?: boolean,
  bridgeOrigin?: boolean,
  isMeta?: boolean,
  skipAttachments?: boolean,
  preExpansionInput?: string,
): Promise<ProcessUserInputBaseResult> {
  // inputString初始化为空值，后续分支会在有数据时补齐。
  let inputString: string | null = null
  // precedingInputBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let precedingInputBlocks: ContentBlockParam[] = []

  // Collect image metadata texts for isMeta message
  // imageMetadataTexts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const imageMetadataTexts: string[] = []

  // Normalized view of `input` with image blocks resized. For string input
  // this is just `input`; for array input it's the processed blocks. We pass
  // this (not raw `input`) to processTextPrompt so resized/normalized image
  // blocks actually reach the API — otherwise the resize work above is
  // discarded for the regular prompt path. Also normalizes bridge inputs
  // where iOS may send `mediaType` instead of `media_type` (mobile-apps#5825).
  // normalizedInput保存`input`，供共享工具 process User Input后续判断或输出使用。
  let normalizedInput: string | ContentBlockParam[] = input

  // 当 `typeof input` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof input === 'string') {
    // inputString更新为 `input`，确保共享工具后续读取最新状态。
    inputString = input
  // 共享工具 process User Input在这里处理 `} else if (input.length > 0) {`，完成这一小步状态转换。
  } else if (input.length > 0) {
    // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
    queryCheckpoint('query_image_processing_start')
    // processedBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const processedBlocks: ContentBlockParam[] = []
    // 按顺序遍历 `input` 中的block，逐个交给共享工具处理。
    for (const block of input) {
      // 当 `block.type` 匹配 `'image'` 时，共享工具执行对应分支。
      if (block.type === 'image') {
        // resized统计`maybeResizeAndDownsampleImageBlock`，供共享工具后续处理使用。
        const resized = await maybeResizeAndDownsampleImageBlock(block)
        // Collect image metadata for isMeta message
        // 满足 `resized.dimensions` 时，共享工具执行该分支。
        if (resized.dimensions) {
          // metadataText构建`createImageMetadataText`，供共享工具后续处理使用。
          const metadataText = createImageMetadataText(resized.dimensions)
          // 满足 `metadataText` 时，共享工具执行该分支。
          if (metadataText) {
            // imageMetadataTexts 集合追加新条目，保持收集顺序与输入顺序一致。
            imageMetadataTexts.push(metadataText)
          }
        }
        // processedBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
        processedBlocks.push(resized.block)
      } else {
        // processedBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
        processedBlocks.push(block)
      }
    }
    // normalizedInput更新为 `processedBlocks`，确保共享工具后续读取最新状态。
    normalizedInput = processedBlocks
    // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
    queryCheckpoint('query_image_processing_end')
    // Extract the input string from the last content block if it is text,
    // and keep track of the preceding content blocks
    // lastBlock保存 `processedBlocks[processedBlocks.length - 1]` 的判断结果，供共享工具 process User Input后续分支直接复用。
    const lastBlock = processedBlocks[processedBlocks.length - 1]
    // 当 `lastBlock?.type` 匹配 `'text'` 时，共享工具执行对应分支。
    if (lastBlock?.type === 'text') {
      // inputString更新为 `lastBlock.text`，确保共享工具后续读取最新状态。
      inputString = lastBlock.text
      // precedingInputBlocks 集合更新为 `processedBlocks.slice(0, -1)`，确保共享工具后续读取最新状态。
      precedingInputBlocks = processedBlocks.slice(0, -1)
    } else {
      // precedingInputBlocks 集合更新为 `processedBlocks`，确保共享工具后续读取最新状态。
      precedingInputBlocks = processedBlocks
    }
  }

  // `inputString === null && mode` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
  if (inputString === null && mode !== 'prompt') {
    // 抛出 new Error(`Mode: ${mode} requires a string input.`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Mode: ${mode} requires a string input.`)
  }

  // Extract and convert image content to content blocks early
  // Keep track of IDs in order for message storage
  // imageContents 集合保存`pastedContents`，供后续判断或组装使用。
  const imageContents = pastedContents
    ? Object.values(pastedContents).filter(isValidImagePaste)
    : []
  // imagePasteIds 集合派生`imageContents.map`，供共享工具后续处理使用。
  const imagePasteIds = imageContents.map(img => img.id)

  // Store images to disk so Claude can reference the path in context
  // (for manipulation with CLI tools, uploading to PRs, etc.)
  // storedImagePaths 路径数据保存`pastedContents`，供后续判断或组装使用。
  const storedImagePaths = pastedContents
    ? await storeImages(pastedContents)
    : new Map<number, string>()

  // Resize pasted images to ensure they fit within API limits (parallel processing)
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_pasted_image_processing_start')
  // imageProcessingResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const imageProcessingResults = await Promise.all(
    // 调用 imageContents.map，触发共享工具此处需要的副作用。
    imageContents.map(async pastedImage => {
      // imageBlock 集中保存共享工具 process User Input要一起传递的字段。
      const imageBlock: ImageBlockParam = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: (pastedImage.mediaType ||
            'image/png') as Base64ImageSource['media_type'],
          data: pastedImage.content,
        },
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_pasted_image_resize_attempt', {
        original_size_bytes: pastedImage.content.length,
      })
      // resized统计`maybeResizeAndDownsampleImageBlock`，供共享工具后续处理使用。
      const resized = await maybeResizeAndDownsampleImageBlock(imageBlock)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        resized,
        originalDimensions: pastedImage.dimensions,
        sourcePath:
          pastedImage.sourcePath ?? storedImagePaths.get(pastedImage.id),
      }
    }),
  )
  // Collect results preserving order
  // imageContentBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const imageContentBlocks: ContentBlockParam[] = []
  // 调用 for，触发共享工具此处需要的副作用。
  for (const {
    resized,
    originalDimensions,
    sourcePath,
  } of imageProcessingResults) {
    // Collect image metadata for isMeta message (prefer resized dimensions)
    // 满足 `resized.dimensions` 时，共享工具执行该分支。
    if (resized.dimensions) {
      // metadataText构建`createImageMetadataText`，供共享工具后续处理使用。
      const metadataText = createImageMetadataText(
        resized.dimensions,
        sourcePath,
      )
      // 满足 `metadataText` 时，共享工具执行该分支。
      if (metadataText) {
        // imageMetadataTexts 集合追加新条目，保持收集顺序与输入顺序一致。
        imageMetadataTexts.push(metadataText)
      }
    // 共享工具 process User Input在这里处理 `} else if (originalDimensions) {`，完成这一小步状态转换。
    } else if (originalDimensions) {
      // Fall back to original dimensions if resize didn't provide them
      // metadataText构建`createImageMetadataText`，供共享工具后续处理使用。
      const metadataText = createImageMetadataText(
        originalDimensions,
        sourcePath,
      )
      // 满足 `metadataText` 时，共享工具执行该分支。
      if (metadataText) {
        // imageMetadataTexts 集合追加新条目，保持收集顺序与输入顺序一致。
        imageMetadataTexts.push(metadataText)
      }
    // 共享工具 process User Input在这里处理 `} else if (sourcePath) {`，完成这一小步状态转换。
    } else if (sourcePath) {
      // If we have a source path but no dimensions, still add source info
      // imageMetadataTexts 集合追加新条目，保持收集顺序与输入顺序一致。
      imageMetadataTexts.push(`[Image source: ${sourcePath}]`)
    }
    // imageContentBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
    imageContentBlocks.push(resized.block)
  }
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_pasted_image_processing_end')

  // Bridge-safe slash command override: mobile/web clients set bridgeOrigin
  // with skipSlashCommands still true (defense-in-depth against exit words and
  // immediate-command fast paths). Resolve the command here — if it passes
  // isBridgeSafeCommand, clear the skip so the gate below opens. If it's a
  // known-but-unsafe command (local-jsx UI or terminal-only), short-circuit
  // with a helpful message rather than letting the model see raw "/config".
  // effectiveSkipSlash 命名 `skipSlashCommands`，让后续代码直接表达这个值的用途。
  let effectiveSkipSlash = skipSlashCommands
  // `bridgeOrigin && inputString` 与 `null && inputString.startsWith(...` 不一致时刷新派生状态，避免使用过期结果。
  if (bridgeOrigin && inputString !== null && inputString.startsWith('/')) {
    // 解析结果解析`parseSlashCommand`，供共享工具后续处理使用。
    const parsed = parseSlashCommand(inputString)
    // cmd 命令数据解析`parsed`，供后续判断或组装使用。
    const cmd = parsed
      ? findCommand(parsed.commandName, context.options.commands)
      : undefined
    // 满足 `cmd` 时，共享工具执行该分支。
    if (cmd) {
      // 满足 `isBridgeSafeCommand(cmd)` 时，共享工具执行该分支。
      if (isBridgeSafeCommand(cmd)) {
        // effectiveSkipSlash更新为 `false`，确保共享工具后续读取最新状态。
        effectiveSkipSlash = false
      } else {
        // 消息读取`getCommandName`，供共享工具后续处理使用。
        const msg = `/${getCommandName(cmd)} isn't available over Remote Control.`
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          messages: [
            createUserMessage({ content: inputString, uuid }),
            createCommandInputMessage(
              `<local-command-stdout>${msg}</local-command-stdout>`,
            ),
          ],
          shouldQuery: false,
          resultText: msg,
        }
      }
    }
    // Unknown /foo or unparseable — fall through to plain text, same as
    // pre-#19134. A mobile user typing "/shrug" shouldn't see "Unknown skill".
  }

  // Ultraplan keyword — route through /ultraplan. Detect on the
  // pre-expansion input so pasted content containing the word cannot
  // trigger a CCR session; replace with "plan" in the expanded input so
  // the CCR prompt receives paste contents and stays grammatical. See
  // keyword.ts for the quote/path exclusions. Interactive prompt mode +
  // non-slash-prefixed only:
  // headless/print mode filters local-jsx commands out of context.options,
  // so routing to /ultraplan there yields "Unknown skill" — and there's no
  // rainbow animation in print mode anyway.
  // Runs before attachment extraction so this path matches the slash-command
  // path below (no await between setUserInputOnProcessing and setAppState —
  // React batches both into one render, no flash).
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('ULTRAPLAN') &&
    mode === 'prompt' &&
    !context.options.isNonInteractiveSession &&
    inputString !== null &&
    !effectiveSkipSlash &&
    !inputString.startsWith('/') &&
    !context.getAppState().ultraplanSessionUrl &&
    !context.getAppState().ultraplanLaunching &&
    hasUltraplanKeyword(preExpansionInput ?? inputString)
  ) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ultraplan_keyword', {})
    // rewritten格式化`replaceUltraplanKeyword`，供共享工具后续处理使用。
    const rewritten = replaceUltraplanKeyword(inputString).trim()
    // 从 `await import('./processSlashCommand.js')` 解构 processSlashCommand，减少共享工具 process User Input对同一对象的重复访问。
    const { processSlashCommand } = await import('./processSlashCommand.js')
    // slashResult保存`processSlashCommand`，供共享工具后续处理使用。
    const slashResult = await processSlashCommand(
      `/ultraplan ${rewritten}`,
      precedingInputBlocks,
      imageContentBlocks,
      [],
      context,
      setToolJSX,
      uuid,
      isAlreadyProcessing,
      canUseTool,
    )
    // 返回 `addImageMetadataMessage(slashResult, imageMetadataTexts)`，作为共享工具这次计算的结果。
    return addImageMetadataMessage(slashResult, imageMetadataTexts)
  }

  // For slash commands, attachments will be extracted within getMessagesForSlashCommand
  // shouldExtractAttachments 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldExtractAttachments =
    !skipAttachments &&
    inputString !== null &&
    (mode !== 'prompt' || effectiveSkipSlash || !inputString.startsWith('/'))

  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_attachment_loading_start')
  // attachmentMessages 消息数据 命名 `shouldExtractAttachments`，让后续代码直接表达这个值的用途。
  const attachmentMessages = shouldExtractAttachments
    ? await toArray(
        getAttachmentMessages(
          inputString,
          context,
          ideSelection ?? null,
          [], // queuedCommands - handled by query.ts for mid-turn attachments
          messages,
          querySource,
        ),
      )
    : []
  // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
  queryCheckpoint('query_attachment_loading_end')

  // Bash commands
  // 当 `inputString !== null && mode` 匹配 `'bash'` 时，共享工具执行对应分支。
  if (inputString !== null && mode === 'bash') {
    // 从 `await import('./processBashCommand.js')` 解构 processBashCommand，减少共享工具 process User Input对同一对象的重复访问。
    const { processBashCommand } = await import('./processBashCommand.js')
    // 返回 `addImageMetadataMessage(`，作为共享工具这次计算的结果。
    return addImageMetadataMessage(
      await processBashCommand(
        inputString,
        precedingInputBlocks,
        attachmentMessages,
        context,
        setToolJSX,
      ),
      imageMetadataTexts,
    )
  }

  // Slash commands
  // Skip for remote bridge messages — input from CCR clients is plain text
  // 共享工具在这里按实际状态进入对应分支。
  if (
    inputString !== null &&
    !effectiveSkipSlash &&
    inputString.startsWith('/')
  ) {
    // 从 `await import('./processSlashCommand.js')` 解构 processSlashCommand，减少共享工具 process User Input对同一对象的重复访问。
    const { processSlashCommand } = await import('./processSlashCommand.js')
    // slashResult保存`processSlashCommand`，供共享工具后续处理使用。
    const slashResult = await processSlashCommand(
      inputString,
      precedingInputBlocks,
      imageContentBlocks,
      attachmentMessages,
      context,
      setToolJSX,
      uuid,
      isAlreadyProcessing,
      canUseTool,
    )
    // 返回 `addImageMetadataMessage(slashResult, imageMetadataTexts)`，作为共享工具这次计算的结果。
    return addImageMetadataMessage(slashResult, imageMetadataTexts)
  }

  // Log agent mention queries for analysis
  // 当 `inputString !== null && mode` 匹配 `'prompt'` 时，共享工具执行对应分支。
  if (inputString !== null && mode === 'prompt') {
    // trimmedInput格式化`inputString.trim`，供共享工具后续处理使用。
    const trimmedInput = inputString.trim()

    // agentMention筛选`attachmentMessages.find`，供共享工具后续处理使用。
    const agentMention = attachmentMessages.find(
      // 这个回调绑定到 (m): m is AttachmentMessage<AgentMentionAttachment> =>，负责共享工具在该局部场景下的响应。
      (m): m is AttachmentMessage<AgentMentionAttachment> =>
        m.attachment.type === 'agent_mention',
    )

    // 满足 `agentMention` 时，共享工具执行该分支。
    if (agentMention) {
      // agentMentionString固定为 ``@agent-${agentMention.attachment.agentType}``，作为共享工具 process User Input后续展示或比较的基准。
      const agentMentionString = `@agent-${agentMention.attachment.agentType}`
      // isSubagentOnly标记共享工具 process User Input是否启用对应路径。
      const isSubagentOnly = trimmedInput === agentMentionString
      // isPrefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isPrefix =
        trimmedInput.startsWith(agentMentionString) && !isSubagentOnly

      // Log whenever users use @agent-<name> syntax
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_subagent_at_mention', {
        is_subagent_only: isSubagentOnly,
        is_prefix: isPrefix,
      })
    }
  }

  // Regular user prompt
  // 返回 `addImageMetadataMessage(`，作为共享工具这次计算的结果。
  return addImageMetadataMessage(
    processTextPrompt(
      normalizedInput,
      imageContentBlocks,
      imagePasteIds,
      attachmentMessages,
      uuid,
      permissionMode,
      isMeta,
    ),
    imageMetadataTexts,
  )
}

// Adds image metadata texts as isMeta message to result
// addImageMetadataMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addImageMetadataMessage(
  result: ProcessUserInputBaseResult,
  imageMetadataTexts: string[],
): ProcessUserInputBaseResult {
  // 满足 `imageMetadataTexts.length > 0` 时，共享工具执行该分支。
  if (imageMetadataTexts.length > 0) {
    // 对话消息追加新条目，保持收集顺序与输入顺序一致。
    result.messages.push(
      createUserMessage({
        // 这个回调绑定到 content: imageMetadataTexts.map(text => ({ type: 'text', text })),，负责共享工具在该局部场景下的响应。
        content: imageMetadataTexts.map(text => ({ type: 'text', text })),
        isMeta: true,
      }),
    )
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}
