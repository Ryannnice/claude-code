// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID, type UUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, writeFile } from 'fs/promises'
// 引入 getOriginalCwd、getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandContext } from '../../commands.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import type {
  ContentReplacementEntry,
  Entry,
  LogOption,
  SerializedMessage,
  TranscriptMessage,
} from '../../types/logs.js'
// 复用 parseJSONL 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { parseJSONL } from '../../utils/json.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getProjectDir,
  getTranscriptPath,
  getTranscriptPathForSession,
  isTranscriptMessage,
  saveCustomTitle,
  searchSessionsByCustomTitle,
} from '../../utils/sessionStorage.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 escapeRegExp 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { escapeRegExp } from '../../utils/stringUtils.js'

// TranscriptEntry 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type TranscriptEntry = TranscriptMessage & {
  forkedFrom?: {
    sessionId: string
    messageUuid: UUID
  }
}

/**
 * Derive a single-line title base from the first user message.
 * Collapses whitespace — multiline first messages (pasted stacks, code)
 * otherwise flow into the saved title and break the resume hint.
 */
// deriveFirstPrompt 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deriveFirstPrompt(
  firstUserMessage: Extract<SerializedMessage, { type: 'user' }> | undefined,
): string {
  // 文本内容保存`firstUserMessage?.message?.content`，供后续判断或组装使用。
  const content = firstUserMessage?.message?.content
  // 文本内容缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!content) return 'Branched conversation'
  // raw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const raw =
    typeof content === 'string'
      ? content
      : content.find(
          // 这个回调绑定到 (block): block is { type: 'text'; text: string } =>，负责命令处理在该局部场景下的响应。
          (block): block is { type: 'text'; text: string } =>
            block.type === 'text',
        )?.text
  // 原始文本缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!raw) return 'Branched conversation'
  // 返回 `(`，作为命令处理这次计算的结果。
  return (
    raw.replace(/\s+/g, ' ').trim().slice(0, 100) || 'Branched conversation'
  )
}

/**
 * Creates a fork of the current conversation by copying from the transcript file.
 * Preserves all original metadata (timestamps, gitBranch, etc.) while updating
 * sessionId and adding forkedFrom traceability.
 */
// createFork 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createFork(customTitle?: string): Promise<{
  sessionId: UUID
  title: string | undefined
  forkPath: string
  serializedMessages: SerializedMessage[]
  contentReplacementRecords: ContentReplacementEntry['replacements']
}> {
  // forkSessionId 会话数据保存`randomUUID`，供命令处理后续处理使用。
  const forkSessionId = randomUUID() as UUID
  // originalSessionId 会话数据读取`getSessionId`，供命令处理后续处理使用。
  const originalSessionId = getSessionId()
  // projectDir读取`getProjectDir`，供命令处理后续处理使用。
  const projectDir = getProjectDir(getOriginalCwd())
  // forkSessionPath 会话数据读取`getTranscriptPathForSession`，供命令处理后续处理使用。
  const forkSessionPath = getTranscriptPathForSession(forkSessionId)
  // currentTranscriptPath 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
  const currentTranscriptPath = getTranscriptPath()

  // Ensure project directory exists
  // 等待 `mkdir(projectDir, { recursive: true, mode: 0o700 })` 完成，再继续斜杠命令 branch的异步流程。
  await mkdir(projectDir, { recursive: true, mode: 0o700 })

  // Read current transcript file
  // transcriptContent 先占位，稍后的条件分支会根据实际输入补齐它。
  let transcriptContent: Buffer
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // transcriptContent更新为 `await readFile(currentTranscriptPath)`，确保斜杠命令后续读取最新状态。
    transcriptContent = await readFile(currentTranscriptPath)
  } catch {
    // 抛出 new Error('No conversation to branch')，阻止命令处理在无效状态下继续运行。
    throw new Error('No conversation to branch')
  }

  // transcriptContent为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (transcriptContent.length === 0) {
    // 抛出 new Error('No conversation to branch')，阻止命令处理在无效状态下继续运行。
    throw new Error('No conversation to branch')
  }

  // Parse all transcript entries (messages + metadata entries like content-replacement)
  // entries 集合解析`parseJSONL<Entry>(transcriptContent)` 整理出中间结果，供命令处理斜杠命令 branch后续步骤使用。
  const entries = parseJSONL<Entry>(transcriptContent)

  // Filter to only main conversation messages (exclude sidechains and non-message entries)
  // mainConversationEntries 集合筛选`entries.filter`，供命令处理后续处理使用。
  const mainConversationEntries = entries.filter(
    // 这个回调绑定到 (entry): entry is TranscriptMessage =>，负责命令处理在该局部场景下的响应。
    (entry): entry is TranscriptMessage =>
      isTranscriptMessage(entry) && !entry.isSidechain,
  )

  // Content-replacement entries for the original session. These record which
  // tool_result blocks were replaced with previews by the per-message budget.
  // Without them in the fork JSONL, `claude -r {forkId}` reconstructs state
  // with an empty replacements Map → previously-replaced results are classified
  // as FROZEN and sent as full content (prompt cache miss + permanent overage).
  // sessionId must be rewritten since loadTranscriptFile keys lookup by the
  // session's messages' sessionId.
  // contentReplacementRecords 集合 命名 `entries`，让后续代码直接表达这个值的用途。
  const contentReplacementRecords = entries
    .filter(
      // 这个回调绑定到 (entry): entry is ContentReplacementEntry =>，负责命令处理在该局部场景下的响应。
      (entry): entry is ContentReplacementEntry =>
        entry.type === 'content-replacement' &&
        entry.sessionId === originalSessionId,
    )
    // 链式调用 flatMap，继续加工上一行在命令处理中产生的数据。
    .flatMap(entry => entry.replacements)

  // mainConversationEntries 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (mainConversationEntries.length === 0) {
    // 抛出 new Error('No messages to branch')，阻止命令处理在无效状态下继续运行。
    throw new Error('No messages to branch')
  }

  // Build forked entries with new sessionId and preserved metadata
  // parentUuid初始化为空值，后续分支会在有数据时补齐。
  let parentUuid: UUID | null = null
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // serializedMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const serializedMessages: SerializedMessage[] = []

  // 按顺序遍历 `mainConversationEntries` 中的entry，逐个交给命令处理处理。
  for (const entry of mainConversationEntries) {
    // Create forked transcript entry preserving all original metadata
    // forkedEntry 集中保存斜杠命令 branch要一起传递的字段。
    const forkedEntry: TranscriptEntry = {
      ...entry,
      sessionId: forkSessionId,
      parentUuid,
      isSidechain: false,
      forkedFrom: {
        sessionId: originalSessionId,
        messageUuid: entry.uuid,
      },
    }

    // Build serialized message for LogOption
    // serialized 集中保存斜杠命令 branch要一起传递的字段。
    const serialized: SerializedMessage = {
      ...entry,
      sessionId: forkSessionId,
    }

    // serializedMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    serializedMessages.push(serialized)
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(jsonStringify(forkedEntry))
    // `entry.type` 与 `'progress'` 不一致时刷新派生状态，避免使用过期结果。
    if (entry.type !== 'progress') {
      // parentUuid更新为 `entry.uuid`，确保斜杠命令后续读取最新状态。
      parentUuid = entry.uuid
    }
  }

  // Append content-replacement entry (if any) with the fork's sessionId.
  // Written as a SINGLE entry (same shape as insertContentReplacement) so
  // loadTranscriptFile's content-replacement branch picks it up.
  // 满足 `contentReplacementRecords.length > 0` 时，命令处理执行该分支。
  if (contentReplacementRecords.length > 0) {
    // forkedReplacementEntry 集中保存斜杠命令 branch要一起传递的字段。
    const forkedReplacementEntry: ContentReplacementEntry = {
      type: 'content-replacement',
      sessionId: forkSessionId,
      replacements: contentReplacementRecords,
    }
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(jsonStringify(forkedReplacementEntry))
  }

  // Write the fork session file
  // 等待 `writeFile(forkSessionPath, lines.join('\n') + '\n', {` 完成，再继续斜杠命令 branch的异步流程。
  await writeFile(forkSessionPath, lines.join('\n') + '\n', {
    encoding: 'utf8',
    mode: 0o600,
  })

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    sessionId: forkSessionId,
    title: customTitle,
    forkPath: forkSessionPath,
    serializedMessages,
    contentReplacementRecords,
  }
}

/**
 * Generates a unique fork name by checking for collisions with existing session names.
 * If "baseName (Branch)" already exists, tries "baseName (Branch 2)", "baseName (Branch 3)", etc.
 */
// getUniqueForkName 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getUniqueForkName(baseName: string): Promise<string> {
  // candidateName保存``${baseName} (Branch)``，作为后续固定文本处理的输入。
  const candidateName = `${baseName} (Branch)`

  // Check if this exact name already exists
  // existingWithExactName保存`searchSessionsByCustomTitle`，供命令处理后续处理使用。
  const existingWithExactName = await searchSessionsByCustomTitle(
    candidateName,
    { exact: true },
  )

  // existingWithExactName为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (existingWithExactName.length === 0) {
    // 返回 `candidateName`，作为命令处理这次计算的结果。
    return candidateName
  }

  // Name collision - find a unique numbered suffix
  // Search for all sessions that start with the base pattern
  // existingForks 集合保存`searchSessionsByCustomTitle`，供命令处理后续处理使用。
  const existingForks = await searchSessionsByCustomTitle(`${baseName} (Branch`)

  // Extract existing fork numbers to find the next available
  // usedNumbers 集合构建`new Set<number>([1]) // Consider " (Branch)" as number 1` 整理出中间结果，供命令处理斜杠命令 branch后续步骤使用。
  const usedNumbers = new Set<number>([1]) // Consider " (Branch)" as number 1
  // forkNumberPattern匹配`RegExp`，供命令处理后续处理使用。
  const forkNumberPattern = new RegExp(
    `^${escapeRegExp(baseName)} \\(Branch(?: (\\d+))?\\)$`,
  )

  // 按顺序遍历 `existingForks` 中的session 会话数据，逐个交给命令处理处理。
  for (const session of existingForks) {
    // match保存`match`，供命令处理后续处理使用。
    const match = session.customTitle?.match(forkNumberPattern)
    // 满足 `match` 时，命令处理执行该分支。
    if (match) {
      // 满足 `match[1]` 时，命令处理执行该分支。
      if (match[1]) {
        // 调用 usedNumbers.add，触发命令处理此处需要的副作用。
        usedNumbers.add(parseInt(match[1], 10))
      } else {
        // 调用 usedNumbers.add，触发命令处理此处需要的副作用。
        usedNumbers.add(1) // " (Branch)" without number is treated as 1
      }
    }
  }

  // Find the next available number
  // nextNumber保存`2`，供后续判断或组装使用。
  let nextNumber = 2
  // 只要 usedNumbers.has(nextNumber) 成立，就持续推进命令处理中的循环处理。
  while (usedNumbers.has(nextNumber)) {
    // 斜杠命令 branch在这里处理 `nextNumber++`，完成这一小步状态转换。
    nextNumber++
  }

  // 返回 ``${baseName} (Branch ${nextNumber})``，作为命令处理这次计算的结果。
  return `${baseName} (Branch ${nextNumber})`
}

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  onDone: LocalJSXCommandOnDone,
  context: LocalJSXCommandContext,
  args: string,
): Promise<React.ReactNode> {
  // customTitle 标题格式化`trim`，供命令处理后续处理使用。
  const customTitle = args?.trim() || undefined

  // originalSessionId 会话数据读取`getSessionId`，供命令处理后续处理使用。
  const originalSessionId = getSessionId()

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      sessionId,
      title,
      forkPath,
      serializedMessages,
      contentReplacementRecords,
    } = await createFork(customTitle)

    // Build LogOption for resume
    // now记录时间`Date`，供命令处理后续处理使用。
    const now = new Date()
    // firstPrompt保存`deriveFirstPrompt`，供命令处理后续处理使用。
    const firstPrompt = deriveFirstPrompt(
      // 调用 serializedMessages.find，触发命令处理此处需要的副作用。
      serializedMessages.find(m => m.type === 'user'),
    )

    // Save custom title - use provided title or firstPrompt as default
    // This ensures /status and /resume show the same session name
    // Always add " (Branch)" suffix to make it clear this is a branched session
    // Handle collisions by adding a number suffix (e.g., " (Branch 2)", " (Branch 3)")
    // baseName 命名 `title ?? firstPrompt`，让后续代码直接表达这个值的用途。
    const baseName = title ?? firstPrompt
    // effectiveTitle 标题读取`getUniqueForkName`，供命令处理后续处理使用。
    const effectiveTitle = await getUniqueForkName(baseName)
    // 等待 `saveCustomTitle(sessionId, effectiveTitle, forkPath)` 完成，再继续斜杠命令 branch的异步流程。
    await saveCustomTitle(sessionId, effectiveTitle, forkPath)

    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_conversation_forked', {
      message_count: serializedMessages.length,
      has_custom_title: !!title,
    })

    // forkLog 集中保存斜杠命令 branch要一起传递的字段。
    const forkLog: LogOption = {
      date: now.toISOString().split('T')[0]!,
      messages: serializedMessages,
      fullPath: forkPath,
      value: now.getTime(),
      created: now,
      modified: now,
      firstPrompt,
      messageCount: serializedMessages.length,
      isSidechain: false,
      sessionId,
      customTitle: effectiveTitle,
      contentReplacements: contentReplacementRecords,
    }

    // Resume into the fork
    // titleInfo 标题保存`title ? ` "${title}"` : ''`，供命令处理斜杠命令 branch后续判断或输出使用。
    const titleInfo = title ? ` "${title}"` : ''
    // resumeHint保存``\nTo resume the original: claude -r ${originalSessionId}``，作为后续固定文本处理的输入。
    const resumeHint = `\nTo resume the original: claude -r ${originalSessionId}`
    // successMessage 消息数据保存``Branched conversation${titleInfo}. You are now in the br...`，作为后续固定文本处理的输入。
    const successMessage = `Branched conversation${titleInfo}. You are now in the branch.${resumeHint}`

    // 满足 `context.resume` 时，命令处理执行该分支。
    if (context.resume) {
      // 等待 `context.resume(sessionId, forkLog, 'fork')` 完成，再继续斜杠命令 branch的异步流程。
      await context.resume(sessionId, forkLog, 'fork')
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(successMessage, { display: 'system' })
    } else {
      // Fallback if resume not available
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(
        `Branched conversation${titleInfo}. Resume with: /resume ${sessionId}`,
      )
    }

    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  } catch (error) {
    // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`Failed to branch conversation: ${message}`)
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
}
