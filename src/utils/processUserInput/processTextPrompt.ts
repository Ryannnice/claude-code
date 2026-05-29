// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources，用于校准共享工具的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 setPromptId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setPromptId } from 'src/bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AttachmentMessage,
  SystemMessage,
  UserMessage,
} from 'src/types/message.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { PermissionMode } 来自 ../../types/permissions.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../../types/permissions.js'
// 引入 createUserMessage，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { createUserMessage } from '../messages.js'
// 引入 logOTelEvent、redactIfDisabled，将 ../telemetry/events.js 中已经封装好的能力接到本文件流程里。
import { logOTelEvent, redactIfDisabled } from '../telemetry/events.js'
// 引入 startInteractionSpan，将 ../telemetry/sessionTracing.js 中已经封装好的能力接到本文件流程里。
import { startInteractionSpan } from '../telemetry/sessionTracing.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  matchesKeepGoingKeyword,
  matchesNegativeKeyword,
} from '../userPromptKeywords.js'

// processTextPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function processTextPrompt(
  input: string | Array<ContentBlockParam>,
  imageContentBlocks: ContentBlockParam[],
  imagePasteIds: number[],
  attachmentMessages: AttachmentMessage[],
  uuid?: string,
  permissionMode?: PermissionMode,
  isMeta?: boolean,
): {
  messages: (UserMessage | AttachmentMessage | SystemMessage)[]
  shouldQuery: boolean
} {
  // promptId保存`randomUUID`，供共享工具后续处理使用。
  const promptId = randomUUID()
  // setPromptId 写入新的状态值，使共享工具后续读取保持一致。
  setPromptId(promptId)

  // userPromptText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const userPromptText =
    typeof input === 'string'
      ? input
      // 这个回调绑定到 : input.find(block => block.type === 'text')?.text || ''，负责共享工具在该局部场景下的响应。
      : input.find(block => block.type === 'text')?.text || ''
  // 调用 startInteractionSpan，触发共享工具此处需要的副作用。
  startInteractionSpan(userPromptText)

  // Emit user_prompt OTEL event for both string (CLI) and array (SDK/VS Code)
  // input shapes. Previously gated on `typeof input === 'string'`, so VS Code
  // sessions never emitted user_prompt (anthropics/claude-code#33301).
  // For array input, use the LAST text block: createUserContent pushes the
  // user's message last (after any <ide_selection>/attachment context blocks),
  // so .findLast gets the actual prompt. userPromptText (first block) is kept
  // unchanged for startInteractionSpan to preserve existing span attributes.
  // otelPromptText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const otelPromptText =
    typeof input === 'string'
      ? input
      // 这个回调绑定到 : input.findLast(block => block.type === 'text')?.text || ''，负责共享工具在该局部场景下的响应。
      : input.findLast(block => block.type === 'text')?.text || ''
  // 满足 `otelPromptText` 时，共享工具执行该分支。
  if (otelPromptText) {
    // 显式忽略 `logOTelEvent('user_prompt', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('user_prompt', {
      prompt_length: String(otelPromptText.length),
      prompt: redactIfDisabled(otelPromptText),
      'prompt.id': promptId,
    })
  }

  // isNegative记录 `matchesNegativeKeyword` 是否成立，共享工具随后按该结果分支。
  const isNegative = matchesNegativeKeyword(userPromptText)
  // isKeepGoing记录 `matchesKeepGoingKeyword` 是否成立，共享工具随后按该结果分支。
  const isKeepGoing = matchesKeepGoingKeyword(userPromptText)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_input_prompt', {
    is_negative: isNegative,
    is_keep_going: isKeepGoing,
  })

  // If we have pasted images, create a message with image content
  // 满足 `imageContentBlocks.length > 0` 时，共享工具执行该分支。
  if (imageContentBlocks.length > 0) {
    // Build content: text first, then images below
    // textContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const textContent =
      typeof input === 'string'
        ? input.trim()
          ? [{ type: 'text' as const, text: input }]
          : []
        : input
    // userMessage 消息数据构建`createUserMessage`，供共享工具后续处理使用。
    const userMessage = createUserMessage({
      content: [...textContent, ...imageContentBlocks],
      uuid: uuid,
      imagePasteIds: imagePasteIds.length > 0 ? imagePasteIds : undefined,
      permissionMode,
      isMeta: isMeta || undefined,
    })

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      messages: [userMessage, ...attachmentMessages],
      shouldQuery: true,
    }
  }

  // userMessage 消息数据构建`createUserMessage`，供共享工具后续处理使用。
  const userMessage = createUserMessage({
    content: input,
    uuid,
    permissionMode,
    isMeta: isMeta || undefined,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: [userMessage, ...attachmentMessages],
    shouldQuery: true,
  }
}
