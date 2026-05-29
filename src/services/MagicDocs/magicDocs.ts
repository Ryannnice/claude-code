/**
 * Magic Docs automatically maintains markdown documentation files marked with special headers.
 * When a file with "# MAGIC DOC: [title]" is read, it runs periodically in the background
 * using a forked subagent to update the document with new learnings from the conversation.
 *
 * See docs/magic-docs.md for more information.
 */

// 类型依赖 { Tool, ToolUseContext } 来自 ../../Tool.js，用于校准服务层 magic Docs的数据契约。
import type { Tool, ToolUseContext } from '../../Tool.js'
// 类型依赖 { BuiltInAgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准服务层 magic Docs的数据契约。
import type { BuiltInAgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 接入 runAgent 工具实现，后续工具池会按权限和开关决定是否暴露。
import { runAgent } from '../../tools/AgentTool/runAgent.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 整理这一组导入，让服务层 magic Docs后续逻辑可以直接复用这些外部能力。
import {
  FileReadTool,
  type Output as FileReadToolOutput,
  registerFileReadListener,
} from '../../tools/FileReadTool/FileReadTool.js'
// 复用 isFsInaccessible 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isFsInaccessible } from '../../utils/errors.js'
// 复用 cloneFileStateCache 工具函数，把通用处理留在 ../../utils/fileStateCache.js 中维护。
import { cloneFileStateCache } from '../../utils/fileStateCache.js'
// 整理这一组导入，让服务层 magic Docs后续逻辑可以直接复用这些外部能力。
import {
  type REPLHookContext,
  registerPostSamplingHook,
} from '../../utils/hooks/postSamplingHooks.js'
// 整理这一组导入，让服务层 magic Docs后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  hasToolCallsInLastAssistantTurn,
} from '../../utils/messages.js'
// 复用 sequential 工具函数，把通用处理留在 ../../utils/sequential.js 中维护。
import { sequential } from '../../utils/sequential.js'
// 引入 buildMagicDocsUpdatePrompt，将 ./prompts.js 中已经封装好的能力接到本文件流程里。
import { buildMagicDocsUpdatePrompt } from './prompts.js'

// Magic Doc header pattern: # MAGIC DOC: [title]
// Matches at the start of the file (first line)
// MAGIC_DOC_HEADER_PATTERN保存`/^#\s*MAGIC\s+DOC:\s*(.+)$/im`，供后续判断或组装使用。
const MAGIC_DOC_HEADER_PATTERN = /^#\s*MAGIC\s+DOC:\s*(.+)$/im
// Pattern to match italics on the line immediately after the header
// ITALICS_PATTERN 命名 `/^[_*](.+?)[_*]\s*$/m`，让后续代码直接表达这个值的用途。
const ITALICS_PATTERN = /^[_*](.+?)[_*]\s*$/m

// Track magic docs
// MagicDocInfo 固化服务层 magic Docs里传递的数据形状，帮助调用方按同一结构读写字段。
type MagicDocInfo = {
  path: string
}

// trackedMagicDocs 集合构建`new Map<string, MagicDocInfo>()` 整理出中间结果，供服务层 magic Docs后续步骤使用。
const trackedMagicDocs = new Map<string, MagicDocInfo>()

// clearTrackedMagicDocs 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearTrackedMagicDocs(): void {
  // 调用 trackedMagicDocs.clear，触发服务层 magic Docs此处需要的副作用。
  trackedMagicDocs.clear()
}

/**
 * Detect if a file content contains a Magic Doc header
 * Returns an object with title and optional instructions, or null if not a magic doc
 */
// detectMagicDocHeader 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectMagicDocHeader(
  content: string,
): { title: string; instructions?: string } | null {
  // match匹配`content.match`，供服务层 magic Docs后续处理使用。
  const match = content.match(MAGIC_DOC_HEADER_PATTERN)
  // 组合条件 `!match || !match[1]` 成立时，服务层 magic Docs才启用这条专门路径。
  if (!match || !match[1]) {
    // 返回 `null`，作为服务层 magic Docs这次计算的结果。
    return null
  }

  // title 标题格式化`trim`，供服务层 magic Docs后续处理使用。
  const title = match[1].trim()

  // Look for italics on the next line after the header (allow one optional blank line)
  // headerEndIndex 索引记录 `match.index! + match[0].length` 是否成立，下一步按该结果分支。
  const headerEndIndex = match.index! + match[0].length
  // afterHeader格式化`content.slice`，供服务层 magic Docs后续处理使用。
  const afterHeader = content.slice(headerEndIndex)
  // Match: newline, optional blank line, then content line
  // nextLineMatch匹配`afterHeader.match`，供服务层 magic Docs后续处理使用。
  const nextLineMatch = afterHeader.match(/^\s*\n(?:\s*\n)?(.+?)(?:\n|$)/)

  // 组合条件 `nextLineMatch && nextLineMatch[1]` 成立时，服务层 magic Docs才启用这条专门路径。
  if (nextLineMatch && nextLineMatch[1]) {
    // nextLine读取 `nextLineMatch[1]` 对应条目，后续围绕该成员继续处理。
    const nextLine = nextLineMatch[1]
    // italicsMatch匹配`nextLine.match`，供服务层 magic Docs后续处理使用。
    const italicsMatch = nextLine.match(ITALICS_PATTERN)
    // 组合条件 `italicsMatch && italicsMatch[1]` 成立时，服务层 magic Docs才启用这条专门路径。
    if (italicsMatch && italicsMatch[1]) {
      // instructions 集合格式化`trim`，供服务层 magic Docs后续处理使用。
      const instructions = italicsMatch[1].trim()
      // 返回结构化结果，集中表达服务层 magic Docs已经整理出的状态。
      return {
        title,
        instructions,
      }
    }
  }

  // 返回结构化结果，集中表达服务层 magic Docs已经整理出的状态。
  return { title }
}

/**
 * Register a file as a Magic Doc when it's read
 * Only registers once per file path - the hook always reads latest content
 */
// registerMagicDoc 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerMagicDoc(filePath: string): void {
  // Only register if not already tracked
  // 满足 `!trackedMagicDocs.has(filePath)` 时，服务层 magic Docs执行该分支。
  if (!trackedMagicDocs.has(filePath)) {
    // trackedMagicDocs.set 写入新的状态值，使服务层 magic Docs后续读取保持一致。
    trackedMagicDocs.set(filePath, {
      path: filePath,
    })
  }
}

/**
 * Create Magic Docs agent definition
 */
// getMagicDocsAgent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMagicDocsAgent(): BuiltInAgentDefinition {
  // 返回结构化结果，集中表达服务层 magic Docs已经整理出的状态。
  return {
    agentType: 'magic-docs',
    whenToUse: 'Update Magic Docs',
    tools: [FILE_EDIT_TOOL_NAME], // Only allow Edit
    model: 'sonnet',
    source: 'built-in',
    baseDir: 'built-in',
    // 这个回调绑定到 getSystemPrompt: () => '', // Will use override systemPrompt，负责服务层 magic Docs在该局部场景下的响应。
    getSystemPrompt: () => '', // Will use override systemPrompt
  }
}

/**
 * Update a single Magic Doc
 */
// updateMagicDoc 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updateMagicDoc(
  docInfo: MagicDocInfo,
  context: REPLHookContext,
): Promise<void> {
  // 服务层 magic Docs先整理这一处局部数据，后续分支可以直接读取。
  const { messages, systemPrompt, userContext, systemContext, toolUseContext } =
    context

  // Clone the FileStateCache to isolate Magic Docs operations. Delete this
  // doc's entry so FileReadTool's dedup doesn't return a file_unchanged
  // stub — we need the actual content to re-detect the header.
  // clonedReadFileState 文件数据保存`cloneFileStateCache`，供服务层 magic Docs后续处理使用。
  const clonedReadFileState = cloneFileStateCache(toolUseContext.readFileState)
  // 调用 clonedReadFileState.delete，触发服务层 magic Docs此处需要的副作用。
  clonedReadFileState.delete(docInfo.path)
  // clonedToolUseContext 集中保存服务层 magic Docs要一起传递的字段。
  const clonedToolUseContext: ToolUseContext = {
    ...toolUseContext,
    readFileState: clonedReadFileState,
  }

  // Read the document; if deleted or unreadable, remove from tracking
  // currentDoc保存`''`，作为后续固定文本处理的输入。
  let currentDoc = ''
  // 保护这一段可能失败的服务层 magic Docs操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`FileReadTool.call`，供服务层 magic Docs后续处理使用。
    const result = await FileReadTool.call(
      { file_path: docInfo.path },
      clonedToolUseContext,
    )
    // output保存`result.data as FileReadToolOutput`，供服务层 magic Docs后续判断或输出使用。
    const output = result.data as FileReadToolOutput
    // 当 `output.type` 匹配 `'text'` 时，服务层 magic Docs执行对应分支。
    if (output.type === 'text') {
      // currentDoc更新为 `output.file.content`，确保服务层后续读取最新状态。
      currentDoc = output.file.content
    }
  } catch (e: unknown) {
    // FileReadTool wraps ENOENT in a plain Error("File does not exist...") with
    // no .code, so check the message in addition to isFsInaccessible (EACCES/EPERM).
    // 服务层 magic Docs在这里进入条件判断，后续代码按实际状态分流。
    if (
      isFsInaccessible(e) ||
      (e instanceof Error && e.message.startsWith('File does not exist'))
    ) {
      // 调用 trackedMagicDocs.delete，触发服务层 magic Docs此处需要的副作用。
      trackedMagicDocs.delete(docInfo.path)
      // 服务层 magic Docs在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 抛出 e，阻止服务层 magic Docs在无效状态下继续运行。
    throw e
  }

  // Re-detect title and instructions from latest file content
  // detected读取`detectMagicDocHeader`，供服务层 magic Docs后续处理使用。
  const detected = detectMagicDocHeader(currentDoc)
  // detected缺失时提前走兜底路径，避免服务层 magic Docs继续依赖无效输入。
  if (!detected) {
    // File no longer has magic doc header, remove from tracking
    // 调用 trackedMagicDocs.delete，触发服务层 magic Docs此处需要的副作用。
    trackedMagicDocs.delete(docInfo.path)
    // 服务层 magic Docs在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Build update prompt with latest title and instructions
  // userPrompt构建`buildMagicDocsUpdatePrompt`，供服务层 magic Docs后续处理使用。
  const userPrompt = await buildMagicDocsUpdatePrompt(
    currentDoc,
    docInfo.path,
    detected.title,
    detected.instructions,
  )

  // Create a custom canUseTool that only allows Edit for magic doc files
  // canUseTool记录 `async` 是否成立，服务层 magic Docs随后按该结果分支。
  const canUseTool = async (tool: Tool, input: unknown) => {
    // 服务层 magic Docs在这里进入条件判断，后续代码按实际状态分流。
    if (
      tool.name === FILE_EDIT_TOOL_NAME &&
      typeof input === 'object' &&
      input !== null &&
      'file_path' in input
    ) {
      // 文件路径 命名 `input.file_path`，让后续代码直接表达这个值的用途。
      const filePath = input.file_path
      // 组合条件 `typeof filePath === 'string' && filePath === docI` 成立时，服务层 magic Docs才启用这条专门路径。
      if (typeof filePath === 'string' && filePath === docInfo.path) {
        // 返回结构化结果，集中表达服务层 magic Docs已经整理出的状态。
        return { behavior: 'allow' as const, updatedInput: input }
      }
    }
    // 返回结构化结果，集中表达服务层 magic Docs已经整理出的状态。
    return {
      behavior: 'deny' as const,
      message: `only ${FILE_EDIT_TOOL_NAME} is allowed for ${docInfo.path}`,
      decisionReason: {
        type: 'other' as const,
        reason: `only ${FILE_EDIT_TOOL_NAME} is allowed`,
      },
    }
  }

  // Run Magic Docs update using runAgent with forked context
  // 逐项读取 `runAgent({` 中的_message 消息数据，按输入顺序推进服务层 magic Docs。
  for await (const _message of runAgent({
    agentDefinition: getMagicDocsAgent(),
    promptMessages: [createUserMessage({ content: userPrompt })],
    toolUseContext: clonedToolUseContext,
    canUseTool,
    isAsync: true,
    forkContextMessages: messages,
    querySource: 'magic_docs',
    override: {
      systemPrompt,
      userContext,
      systemContext,
    },
    availableTools: clonedToolUseContext.options.tools,
  })) {
    // Just consume - let it run to completion
  }
}

/**
 * Magic Docs post-sampling hook that updates all tracked Magic Docs
 */
// updateMagicDocs 集合保存`sequential`，供服务层 magic Docs后续处理使用。
const updateMagicDocs = sequential(async function (
  context: REPLHookContext,
): Promise<void> {
  // 从 `context` 解构 messages、querySource，减少服务层 magic Docs对同一对象的重复访问。
  const { messages, querySource } = context

  // `querySource` 与 `'repl_main_thread'` 不一致时刷新派生状态，避免使用过期结果。
  if (querySource !== 'repl_main_thread') {
    // 服务层 magic Docs在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Only update when conversation is idle (no tool calls in last turn)
  // hasToolCalls 集合记录 `hasToolCallsInLastAssistantTurn` 是否成立，服务层 magic Docs随后按该结果分支。
  const hasToolCalls = hasToolCallsInLastAssistantTurn(messages)
  // 满足 `hasToolCalls` 时，服务层 magic Docs执行该分支。
  if (hasToolCalls) {
    // 服务层 magic Docs在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // docCount 数量 命名 `trackedMagicDocs.size`，让后续代码直接表达这个值的用途。
  const docCount = trackedMagicDocs.size
  // 满足 `docCount === 0` 时，服务层 magic Docs执行该分支。
  if (docCount === 0) {
    // 服务层 magic Docs在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 逐项读取 `Array.from(trackedMagicDocs.values())` 中的docInfo，按输入顺序推进服务层 magic Docs。
  for (const docInfo of Array.from(trackedMagicDocs.values())) {
    // 等待 `updateMagicDoc(docInfo, context)` 完成，再继续服务层 magic Docs的异步流程。
    await updateMagicDoc(docInfo, context)
  }
})

// initMagicDocs 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initMagicDocs(): Promise<void> {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 magic Docs执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Register listener to detect magic docs when files are read
    // 调用 registerFileReadListener，触发服务层 magic Docs此处需要的副作用。
    registerFileReadListener((filePath: string, content: string) => {
      // 结果读取`detectMagicDocHeader`，供服务层 magic Docs后续处理使用。
      const result = detectMagicDocHeader(content)
      // 满足 `result` 时，服务层 magic Docs执行该分支。
      if (result) {
        // 调用 registerMagicDoc，触发服务层 magic Docs此处需要的副作用。
        registerMagicDoc(filePath)
      }
    })

    // 调用 registerPostSamplingHook，触发服务层 magic Docs此处需要的副作用。
    registerPostSamplingHook(updateMagicDocs)
  }
}
