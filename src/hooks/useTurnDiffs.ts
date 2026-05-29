// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准React hook 状态流的数据契约。
import type { StructuredPatchHunk } from 'diff'
// 引入 useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo, useRef } from 'react'
// 类型依赖 { FileEditOutput } 来自 ../tools/FileEditTool/types.js，用于校准React hook 状态流的数据契约。
import type { FileEditOutput } from '../tools/FileEditTool/types.js'
// 类型依赖 { Output as FileWriteOutput } 来自 ../tools/FileWriteTool/FileWriteTool.js，用于校准React hook 状态流的数据契约。
import type { Output as FileWriteOutput } from '../tools/FileWriteTool/FileWriteTool.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'

// TurnFileDiff 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type TurnFileDiff = {
  filePath: string
  hunks: StructuredPatchHunk[]
  isNewFile: boolean
  linesAdded: number
  linesRemoved: number
}

// TurnDiff 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type TurnDiff = {
  turnIndex: number
  userPromptPreview: string
  timestamp: string
  files: Map<string, TurnFileDiff>
  stats: {
    filesChanged: number
    linesAdded: number
    linesRemoved: number
  }
}

// FileEditResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type FileEditResult = FileEditOutput | FileWriteOutput

// TurnDiffCache 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type TurnDiffCache = {
  completedTurns: TurnDiff[]
  currentTurn: TurnDiff | null
  lastProcessedIndex: number
  lastTurnIndex: number
}

// isFileEditResult 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isFileEditResult(result: unknown): result is FileEditResult {
  // `!result || typeof result` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!result || typeof result !== 'object') return false
  // r 命名 `result as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const r = result as Record<string, unknown>
  // FileEditTool: has structuredPatch with content
  // FileWriteTool (update): has structuredPatch with content
  // FileWriteTool (create): has type='create' and content (structuredPatch is empty)
  // hasFilePath 路径数据标记React hook use Turn D...是否启用对应路径。
  const hasFilePath = typeof r.filePath === 'string'
  // hasStructuredPatch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasStructuredPatch =
    Array.isArray(r.structuredPatch) && r.structuredPatch.length > 0
  // isNewFile 文件数据标记React hook use Turn D...是否启用对应路径。
  const isNewFile = r.type === 'create' && typeof r.content === 'string'
  // 返回 `hasFilePath && (hasStructuredPatch || isNewFile)`，作为React hook 状态流这次计算的结果。
  return hasFilePath && (hasStructuredPatch || isNewFile)
}

// isFileWriteOutput 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isFileWriteOutput(result: FileEditResult): result is FileWriteOutput {
  // 返回 `(`，作为React hook 状态流这次计算的结果。
  return (
    'type' in result && (result.type === 'create' || result.type === 'update')
  )
}

// countHunkLines 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countHunkLines(hunks: StructuredPatchHunk[]): {
  added: number
  removed: number
} {
  // added保存`0`，供React hook use Turn D...后续判断或输出使用。
  let added = 0
  // removed 命名 `0`，让后续代码直接表达这个值的用途。
  let removed = 0
  // 按顺序遍历 `hunks` 中的hunk，逐个交给React hook处理。
  for (const hunk of hunks) {
    // 按顺序遍历 `hunk.lines` 中的line，逐个交给React hook处理。
    for (const line of hunk.lines) {
      // 满足 `line.startsWith('+')` 时，React hook执行该分支。
      if (line.startsWith('+')) added++
      else if (line.startsWith('-')) removed++
    }
  }
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return { added, removed }
}

// getUserPromptPreview 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUserPromptPreview(message: Message): string {
  // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'user') return ''
  // 文本内容保存`message.message.content`，供后续判断或组装使用。
  const content = message.message.content
  // 文本内容标记React hook use Turn D...是否启用对应路径。
  const text = typeof content === 'string' ? content : ''
  // Truncate to ~30 chars
  // 满足 `text.length <= 30` 时，React hook执行该分支。
  if (text.length <= 30) return text
  // 返回 `text.slice(0, 29) + '…'`，作为React hook 状态流这次计算的结果。
  return text.slice(0, 29) + '…'
}

// computeTurnStats 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeTurnStats(turn: TurnDiff): void {
  // totalAdded 命名 `0`，让后续代码直接表达这个值的用途。
  let totalAdded = 0
  // totalRemoved 命名 `0`，让后续代码直接表达这个值的用途。
  let totalRemoved = 0
  // 逐项读取 `turn.files.values()` 中的file 文件数据，按输入顺序推进React hook 状态流。
  for (const file of turn.files.values()) {
    // React hook use Turn Diffs在这里处理 `totalAdded += file.linesAdded`，完成这一小步状态转换。
    totalAdded += file.linesAdded
    // React hook use Turn Diffs在这里处理 `totalRemoved += file.linesRemoved`，完成这一小步状态转换。
    totalRemoved += file.linesRemoved
  }
  // stats 集合更新为 `{`，确保useTurnDiffs后续读取最新状态。
  turn.stats = {
    filesChanged: turn.files.size,
    linesAdded: totalAdded,
    linesRemoved: totalRemoved,
  }
}

/**
 * Extract turn-based diffs from messages.
 * A turn is defined as a user prompt followed by assistant responses and tool results.
 * Each turn with file edits is included in the result.
 *
 * Uses incremental accumulation - only processes new messages since last render.
 */
// useTurnDiffs 封装useTurnDiffs的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTurnDiffs(messages: Message[]): TurnDiff[] {
  // cache 缓存读取 hook 状态，供React hook use Turn D...本轮渲染使用。
  const cache = useRef<TurnDiffCache>({
    completedTurns: [],
    currentTurn: null,
    lastProcessedIndex: 0,
    lastTurnIndex: 0,
  })

  // 返回 `useMemo(() => {`，作为React hook 状态流这次计算的结果。
  return useMemo(() => {
    // c 命名 `cache.current`，让后续代码直接表达这个值的用途。
    const c = cache.current

    // Reset if messages shrunk (user rewound conversation)
    // 满足 `messages.length < c.lastProcessedIndex` 时，React hook执行该分支。
    if (messages.length < c.lastProcessedIndex) {
      // completedTurns 集合更新为 `[]`，确保useTurnDiffs后续读取最新状态。
      c.completedTurns = []
      // currentTurn更新为 `null`，确保useTurnDiffs后续读取最新状态。
      c.currentTurn = null
      // lastProcessedIndex 索引更新为 `0`，确保useTurnDiffs后续读取最新状态。
      c.lastProcessedIndex = 0
      // lastTurnIndex 索引更新为 `0`，确保useTurnDiffs后续读取最新状态。
      c.lastTurnIndex = 0
    }

    // Process only new messages
    // 循环处理 `let i = c.lastProcessedIndex; i < messages.length`，让React hook 状态流逐项把同类条目按顺序走完。
    for (let i = c.lastProcessedIndex; i < messages.length; i++) {
      // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
      const message = messages[i]
      // `!message || message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (!message || message.type !== 'user') continue

      // Check if this is a user prompt (not a tool result)
      // isToolResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isToolResult =
        message.toolUseResult ||
        (Array.isArray(message.message.content) &&
          message.message.content[0]?.type === 'tool_result')

      // 组合条件 `!isToolResult && !message.isMeta` 成立时，React hook 状态流才启用这条专门路径。
      if (!isToolResult && !message.isMeta) {
        // Start a new turn on user prompt
        // 组合条件 `c.currentTurn && c.currentTurn.files.size > 0` 成立时，React hook 状态流才启用这条专门路径。
        if (c.currentTurn && c.currentTurn.files.size > 0) {
          // 调用 computeTurnStats，触发React hook此处需要的副作用。
          computeTurnStats(c.currentTurn)
          // completedTurns 集合追加新条目，保持收集顺序与输入顺序一致。
          c.completedTurns.push(c.currentTurn)
        }

        // React hook use Turn Diffs在这里处理 `c.lastTurnIndex++`，完成这一小步状态转换。
        c.lastTurnIndex++
        // currentTurn更新为 `{`，确保useTurnDiffs后续读取最新状态。
        c.currentTurn = {
          turnIndex: c.lastTurnIndex,
          userPromptPreview: getUserPromptPreview(message),
          timestamp: message.timestamp,
          files: new Map(),
          stats: { filesChanged: 0, linesAdded: 0, linesRemoved: 0 },
        }
      // React hook use Turn Diffs在这里处理 `} else if (c.currentTurn && message.toolUseResult) {`，完成这一小步状态转换。
      } else if (c.currentTurn && message.toolUseResult) {
        // Collect file edits from tool results
        // 结果 命名 `message.toolUseResult`，让后续代码直接表达这个值的用途。
        const result = message.toolUseResult
        // 满足 `isFileEditResult(result)` 时，React hook执行该分支。
        if (isFileEditResult(result)) {
          // 从 `result` 解构 filePath、structuredPatch，减少React hook use Turn Diffs对同一对象的重复访问。
          const { filePath, structuredPatch } = result
          // isNewFile 文件数据标记React hook use Turn D...是否启用对应路径。
          const isNewFile = 'type' in result && result.type === 'create'

          // Get or create file entry
          // fileEntry 文件数据读取`files.get`，供React hook后续处理使用。
          let fileEntry = c.currentTurn.files.get(filePath)
          // fileEntry 文件数据缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
          if (!fileEntry) {
            // fileEntry 文件数据更新为 `{`，确保useTurnDiffs后续读取最新状态。
            fileEntry = {
              filePath,
              hunks: [],
              isNewFile,
              linesAdded: 0,
              linesRemoved: 0,
            }
            // c.currentTurn.files.set 写入新的状态值，使React hook 状态流后续读取保持一致。
            c.currentTurn.files.set(filePath, fileEntry)
          }

          // For new files, generate synthetic hunk from content
          // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
          if (
            isNewFile &&
            structuredPatch.length === 0 &&
            isFileWriteOutput(result)
          ) {
            // 文本内容 命名 `result.content`，让后续代码直接表达这个值的用途。
            const content = result.content
            // 文本行格式化`content.split`，供React hook后续处理使用。
            const lines = content.split('\n')
            // syntheticHunk 集中保存React hook use Turn Diffs要一起传递的字段。
            const syntheticHunk: StructuredPatchHunk = {
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: lines.length,
              // 这个回调绑定到 lines: lines.map(l => '+' + l),，负责React hook 状态流在该局部场景下的响应。
              lines: lines.map(l => '+' + l),
            }
            // hunks 集合追加新条目，保持收集顺序与输入顺序一致。
            fileEntry.hunks.push(syntheticHunk)
            // React hook use Turn Diffs在这里处理 `fileEntry.linesAdded += lines.length`，完成这一小步状态转换。
            fileEntry.linesAdded += lines.length
          } else {
            // Append hunks (same file may be edited multiple times in a turn)
            // hunks 集合追加新条目，保持收集顺序与输入顺序一致。
            fileEntry.hunks.push(...structuredPatch)

            // Update line counts
            // 从 `countHunkLines(structuredPatch)` 解构 added、removed，减少React hook use Turn Diffs对同一对象的重复访问。
            const { added, removed } = countHunkLines(structuredPatch)
            // React hook use Turn Diffs在这里处理 `fileEntry.linesAdded += added`，完成这一小步状态转换。
            fileEntry.linesAdded += added
            // React hook use Turn Diffs在这里处理 `fileEntry.linesRemoved += removed`，完成这一小步状态转换。
            fileEntry.linesRemoved += removed
          }

          // If file was created and then edited, it's still a new file
          // 满足 `isNewFile` 时，React hook执行该分支。
          if (isNewFile) {
            // isNewFile 文件数据更新为 `true`，确保useTurnDiffs后续读取最新状态。
            fileEntry.isNewFile = true
          }
        }
      }
    }

    // lastProcessedIndex 索引更新为 `messages.length`，确保useTurnDiffs后续读取最新状态。
    c.lastProcessedIndex = messages.length

    // Build result: completed turns + current turn if it has files
    // 结果 聚合成有序列表，保持后续遍历顺序稳定。
    const result = [...c.completedTurns]
    // 组合条件 `c.currentTurn && c.currentTurn.files.size > 0` 成立时，React hook 状态流才启用这条专门路径。
    if (c.currentTurn && c.currentTurn.files.size > 0) {
      // Compute stats for current turn before including
      // 调用 computeTurnStats，触发React hook此处需要的副作用。
      computeTurnStats(c.currentTurn)
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(c.currentTurn)
    }

    // Return in reverse order (most recent first)
    // 返回 `result.reverse()`，作为React hook 状态流这次计算的结果。
    return result.reverse()
  }, [messages])
}
