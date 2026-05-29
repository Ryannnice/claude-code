// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 getDefaultSonnetModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { getDefaultSonnetModel } from '../utils/model/model.js'
// 复用 sideQuery 工具函数，把通用处理留在 ../utils/sideQuery.js 中维护。
import { sideQuery } from '../utils/sideQuery.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'
// 整理这一组导入，让find Relevant Memories后续逻辑可以直接复用这些外部能力。
import {
  formatMemoryManifest,
  type MemoryHeader,
  scanMemoryFiles,
} from './memoryScan.js'

// RelevantMemory 固化find Relevant Memories里传递的数据形状，帮助调用方按同一结构读写字段。
export type RelevantMemory = {
  path: string
  mtimeMs: number
}

// SELECT_MEMORIES_SYSTEM_PROMPT固定为 ``You are selecting memories that will be useful to Claude...`，作为find Relevant Memories后续展示或比较的基准。
const SELECT_MEMORIES_SYSTEM_PROMPT = `You are selecting memories that will be useful to Claude Code as it processes a user's query. You will be given the user's query and a list of available memory files with their filenames and descriptions.

Return a list of filenames for the memories that will clearly be useful to Claude Code as it processes the user's query (up to 5). Only include memories that you are certain will be helpful based on their name and description.
- If you are unsure if a memory will be useful in processing the user's query, then do not include it in your list. Be selective and discerning.
- If there are no memories in the list that would clearly be useful, feel free to return an empty list.
- If a list of recently-used tools is provided, do not select memories that are usage reference or API documentation for those tools (Claude Code is already exercising them). DO still select memories containing warnings, gotchas, or known issues about those tools — active use is exactly when those matter.
`

/**
 * Find memory files relevant to a query by scanning memory file headers
 * and asking Sonnet to select the most relevant ones.
 *
 * Returns absolute file paths + mtime of the most relevant memories
 * (up to 5). Excludes MEMORY.md (already loaded in system prompt).
 * mtime is threaded through so callers can surface freshness to the
 * main model without a second stat.
 *
 * `alreadySurfaced` filters paths shown in prior turns before the
 * Sonnet call, so the selector spends its 5-slot budget on fresh
 * candidates instead of re-picking files the caller will discard.
 */
// findRelevantMemories 封装findRelevantMemories的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findRelevantMemories(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
  recentTools: readonly string[] = [],
  alreadySurfaced: ReadonlySet<string> = new Set(),
): Promise<RelevantMemory[]> {
  // memories 集合保存`scanMemoryFiles`，供find Relevant Memories后续处理使用。
  const memories = (await scanMemoryFiles(memoryDir, signal)).filter(
    // m更新为 `> !alreadySurfaced.has(m.filePath)`，确保findRelevantMemories后续读取最新状态。
    m => !alreadySurfaced.has(m.filePath),
  )
  // memories 集合为空时立即返回或跳过，避免find Relevant Memories把空集合当成可处理内容。
  if (memories.length === 0) {
    // 返回列表结果，保留find Relevant Memories已经排好的条目顺序。
    return []
  }

  // selectedFilenames 文件数据保存`selectRelevantMemories`，供find Relevant Memories后续处理使用。
  const selectedFilenames = await selectRelevantMemories(
    query,
    memories,
    signal,
    recentTools,
  )
  // byFilename 文件数据保存`Map`，供find Relevant Memories后续处理使用。
  const byFilename = new Map(memories.map(m => [m.filename, m]))
  // selected保存`selectedFilenames`，供find Relevant Memories后续判断或输出使用。
  const selected = selectedFilenames
    // 链式调用 map，继续加工上一行在find Relevant Memories中产生的数据。
    .map(filename => byFilename.get(filename))
    // 链式调用 filter，继续加工上一行在find Relevant Memories中产生的数据。
    .filter((m): m is MemoryHeader => m !== undefined)

  // Fires even on empty selection: selection-rate needs the denominator,
  // and -1 ages distinguish "ran, picked nothing" from "never ran".
  // 满足 `feature('MEMORY_SHAPE_TELEMETRY')` 时，find Relevant Memories执行该分支。
  if (feature('MEMORY_SHAPE_TELEMETRY')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // find Relevant Memories先整理这一处局部数据，后续分支可以直接读取。
    const { logMemoryRecallShape } =
      require('./memoryShapeTelemetry.js') as typeof import('./memoryShapeTelemetry.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 调用 logMemoryRecallShape，触发find Relevant Memories此处需要的副作用。
    logMemoryRecallShape(memories, selected)
  }

  // 返回 `selected.map(m => ({ path: m.filePath, mtimeMs: m.mtimeMs }))`，作为find Relevant Memories这次计算的结果。
  return selected.map(m => ({ path: m.filePath, mtimeMs: m.mtimeMs }))
}

// selectRelevantMemories 封装findRelevantMemories的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function selectRelevantMemories(
  query: string,
  memories: MemoryHeader[],
  signal: AbortSignal,
  recentTools: readonly string[],
): Promise<string[]> {
  // validFilenames 文件数据保存`Set`，供find Relevant Memories后续处理使用。
  const validFilenames = new Set(memories.map(m => m.filename))

  // manifest格式化`formatMemoryManifest`，供find Relevant Memories后续处理使用。
  const manifest = formatMemoryManifest(memories)

  // When Claude Code is actively using a tool (e.g. mcp__X__spawn),
  // surfacing that tool's reference docs is noise — the conversation
  // already contains working usage.  The selector otherwise matches
  // on keyword overlap ("spawn" in query + "spawn" in a memory
  // description → false positive).
  // toolsSection 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const toolsSection =
    recentTools.length > 0
      ? `\n\nRecently used tools: ${recentTools.join(', ')}`
      : ''

  // 保护这一段可能失败的find Relevant Memories操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`sideQuery`，供find Relevant Memories后续处理使用。
    const result = await sideQuery({
      model: getDefaultSonnetModel(),
      system: SELECT_MEMORIES_SYSTEM_PROMPT,
      skipSystemPromptPrefix: true,
      messages: [
        {
          role: 'user',
          content: `Query: ${query}\n\nAvailable memories:\n${manifest}${toolsSection}`,
        },
      ],
      max_tokens: 256,
      output_format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            selected_memories: { type: 'array', items: { type: 'string' } },
          },
          required: ['selected_memories'],
          additionalProperties: false,
        },
      },
      signal,
      querySource: 'memdir_relevance',
    })

    // textBlock筛选`content.find`，供find Relevant Memories后续处理使用。
    const textBlock = result.content.find(block => block.type === 'text')
    // `!textBlock || textBlock.type` 与 `'text'` 不一致时刷新派生状态，避免使用过期结果。
    if (!textBlock || textBlock.type !== 'text') {
      // 返回列表结果，保留find Relevant Memories已经排好的条目顺序。
      return []
    }

    // 解析结果解析`jsonParse(textBlock.text)`，供后续判断或组装使用。
    const parsed: { selected_memories: string[] } = jsonParse(textBlock.text)
    // 返回 `parsed.selected_memories.filter(f => validFilenames.has(f))`，作为find Relevant Memories这次计算的结果。
    return parsed.selected_memories.filter(f => validFilenames.has(f))
  } catch (e) {
    // 满足 `signal.aborted` 时，find Relevant Memories执行该分支。
    if (signal.aborted) {
      // 返回列表结果，保留find Relevant Memories已经排好的条目顺序。
      return []
    }
    // 记录find Relevant Memories运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[memdir] selectRelevantMemories failed: ${errorMessage(e)}`,
      { level: 'warn' },
    )
    // 返回列表结果，保留find Relevant Memories已经排好的条目顺序。
    return []
  }
}
