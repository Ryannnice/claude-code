// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../utils/fsOperations.js'
// 引入 getAutoMemPath、isAutoMemoryEnabled，将 ./paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemPath, isAutoMemoryEnabled } from './paths.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供memdir后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('./teamMemPaths.js') as typeof import('./teamMemPaths.js'))
  : null

// 引入 getKairosActive、getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getKairosActive, getOriginalCwd } from '../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让memdir后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
// 接入 isReplModeEnabled 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isReplModeEnabled } from '../tools/REPLTool/constants.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 ../utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from '../utils/embeddedTools.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatFileSize } from '../utils/format.js'
// 复用 getProjectDir 工具函数，把通用处理留在 ../utils/sessionStorage.js 中维护。
import { getProjectDir } from '../utils/sessionStorage.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js'
// 整理这一组导入，让memdir后续逻辑可以直接复用这些外部能力。
import {
  MEMORY_FRONTMATTER_EXAMPLE,
  TRUSTING_RECALL_SECTION,
  TYPES_SECTION_INDIVIDUAL,
  WHAT_NOT_TO_SAVE_SECTION,
  WHEN_TO_ACCESS_SECTION,
} from './memoryTypes.js'

// ENTRYPOINT_NAME 命名 `'MEMORY.md'`，让后续代码直接表达这个值的用途。
export const ENTRYPOINT_NAME = 'MEMORY.md'
// MAX_ENTRYPOINT_LINES 集合 命名 `200`，让后续代码直接表达这个值的用途。
export const MAX_ENTRYPOINT_LINES = 200
// ~125 chars/line at 200 lines. At p97 today; catches long-line indexes that
// slip past the line cap (p100 observed: 197KB under 200 lines).
// MAX_ENTRYPOINT_BYTES 集合保存`25_000`，供后续判断或组装使用。
export const MAX_ENTRYPOINT_BYTES = 25_000
// AUTO_MEM_DISPLAY_NAME保存`'auto memory'`，作为后续固定文本处理的输入。
const AUTO_MEM_DISPLAY_NAME = 'auto memory'

// EntrypointTruncation 固化memdir里传递的数据形状，帮助调用方按同一结构读写字段。
export type EntrypointTruncation = {
  content: string
  lineCount: number
  byteCount: number
  wasLineTruncated: boolean
  wasByteTruncated: boolean
}

/**
 * Truncate MEMORY.md content to the line AND byte caps, appending a warning
 * that names which cap fired. Line-truncates first (natural boundary), then
 * byte-truncates at the last newline before the cap so we don't cut mid-line.
 *
 * Shared by buildMemoryPrompt and claudemd getMemoryFiles (previously
 * duplicated the line-only logic).
 */
// truncateEntrypointContent 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateEntrypointContent(raw: string): EntrypointTruncation {
  // trimmed格式化`raw.trim`，供memdir后续处理使用。
  const trimmed = raw.trim()
  // contentLines 集合格式化`trimmed.split`，供memdir后续处理使用。
  const contentLines = trimmed.split('\n')
  // lineCount 数量记录 `contentLines.length` 是否成立，下一步按该结果分支。
  const lineCount = contentLines.length
  // byteCount 数量记录 `trimmed.length` 是否成立，下一步按该结果分支。
  const byteCount = trimmed.length

  // wasLineTruncated保存`lineCount > MAX_ENTRYPOINT_LINES`，供memdir后续判断或输出使用。
  const wasLineTruncated = lineCount > MAX_ENTRYPOINT_LINES
  // Check original byte count — long lines are the failure mode the byte cap
  // targets, so post-line-truncation size would understate the warning.
  // wasByteTruncated保存`byteCount > MAX_ENTRYPOINT_BYTES`，供后续判断或组装使用。
  const wasByteTruncated = byteCount > MAX_ENTRYPOINT_BYTES

  // 组合条件 `!wasLineTruncated && !wasByteTruncated` 成立时，memdir才启用这条专门路径。
  if (!wasLineTruncated && !wasByteTruncated) {
    // 返回结构化结果，集中表达memdir已经整理出的状态。
    return {
      content: trimmed,
      lineCount,
      byteCount,
      wasLineTruncated,
      wasByteTruncated,
    }
  }

  // truncated保存`wasLineTruncated`，供memdir后续判断或输出使用。
  let truncated = wasLineTruncated
    ? contentLines.slice(0, MAX_ENTRYPOINT_LINES).join('\n')
    : trimmed

  // 满足 `truncated.length > MAX_ENTRYPOINT_BYTES` 时，memdir执行该分支。
  if (truncated.length > MAX_ENTRYPOINT_BYTES) {
    // cutAt保存`truncated.lastIndexOf`，供memdir后续处理使用。
    const cutAt = truncated.lastIndexOf('\n', MAX_ENTRYPOINT_BYTES)
    // truncated更新为 `truncated.slice(0, cutAt > 0 ? cutAt : MAX_ENTRYPOINT_BYT...`，确保memdir后续读取最新状态。
    truncated = truncated.slice(0, cutAt > 0 ? cutAt : MAX_ENTRYPOINT_BYTES)
  }

  // reason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const reason =
    wasByteTruncated && !wasLineTruncated
      ? `${formatFileSize(byteCount)} (limit: ${formatFileSize(MAX_ENTRYPOINT_BYTES)}) — index entries are too long`
      : wasLineTruncated && !wasByteTruncated
        ? `${lineCount} lines (limit: ${MAX_ENTRYPOINT_LINES})`
        : `${lineCount} lines and ${formatFileSize(byteCount)}`

  // 返回结构化结果，集中表达memdir已经整理出的状态。
  return {
    content:
      truncated +
      `\n\n> WARNING: ${ENTRYPOINT_NAME} is ${reason}. Only part of it was loaded. Keep index entries to one line under ~200 chars; move detail into topic files.`,
    lineCount,
    byteCount,
    wasLineTruncated,
    wasByteTruncated,
  }
}

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPrompts 集合保存`feature`，供memdir后续处理使用。
const teamMemPrompts = feature('TEAMMEM')
  ? (require('./teamMemPrompts.js') as typeof import('./teamMemPrompts.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Shared guidance text appended to each memory directory prompt line.
 * Shipped because Claude was burning turns on `ls`/`mkdir -p` before writing.
 * Harness guarantees the directory exists via ensureMemoryDirExists().
 */
// DIR_EXISTS_GUIDANCE 先占位，稍后的条件分支会根据实际输入补齐它。
export const DIR_EXISTS_GUIDANCE =
  'This directory already exists — write to it directly with the Write tool (do not run mkdir or check for its existence).'
// DIRS_EXIST_GUIDANCE 先占位，稍后的条件分支会根据实际输入补齐它。
export const DIRS_EXIST_GUIDANCE =
  'Both directories already exist — write to them directly with the Write tool (do not run mkdir or check for their existence).'

/**
 * Ensure a memory directory exists. Idempotent — called from loadMemoryPrompt
 * (once per session via systemPromptSection cache) so the model can always
 * write without checking existence first. FsOperations.mkdir is recursive
 * by default and already swallows EEXIST, so the full parent chain
 * (~/.claude/projects/<slug>/memory/) is created in one call with no
 * try/catch needed for the happy path.
 */
// ensureMemoryDirExists 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureMemoryDirExists(memoryDir: string): Promise<void> {
  // fs 集合读取`getFsImplementation`，供memdir后续处理使用。
  const fs = getFsImplementation()
  // 保护这一段可能失败的memdir操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.mkdir(memoryDir)` 完成，再继续memdir的异步流程。
    await fs.mkdir(memoryDir)
  } catch (e) {
    // fs.mkdir already handles EEXIST internally. Anything reaching here is
    // a real problem (EACCES/EPERM/EROFS) — log so --debug shows why. Prompt
    // building continues either way; the model's Write will surface the
    // real perm error (and FileWriteTool does its own mkdir of the parent).
    // code 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const code =
      e instanceof Error && 'code' in e && typeof e.code === 'string'
        ? e.code
        : undefined
    // 记录memdir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `ensureMemoryDirExists failed for ${memoryDir}: ${code ?? String(e)}`,
      { level: 'debug' },
    )
  }
}

/**
 * Log memory directory file/subdir counts asynchronously.
 * Fire-and-forget — doesn't block prompt building.
 */
// logMemoryDirCounts 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logMemoryDirCounts(
  memoryDir: string,
  baseMetadata: Record<
    string,
    | number
    | boolean
    | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  >,
): void {
  // fs 集合读取`getFsImplementation`，供memdir后续处理使用。
  const fs = getFsImplementation()
  // 显式忽略 `fs.readdir(memoryDir).then(` 的返回值，只保留它触发的副作用。
  void fs.readdir(memoryDir).then(
    // dirents 集合更新为 `> {`，确保memdir后续读取最新状态。
    dirents => {
      // fileCount 文件数据保存`0`，供memdir后续判断或输出使用。
      let fileCount = 0
      // subdirCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let subdirCount = 0
      // 按顺序遍历 `dirents` 中的d，逐个交给memdir处理。
      for (const d of dirents) {
        // 满足 `d.isFile()` 时，memdir执行该分支。
        if (d.isFile()) {
          // memdir在这里处理 `fileCount++`，完成这一小步状态转换。
          fileCount++
        // memdir在这里处理 `} else if (d.isDirectory()) {`，完成这一小步状态转换。
        } else if (d.isDirectory()) {
          // memdir在这里处理 `subdirCount++`，完成这一小步状态转换。
          subdirCount++
        }
      }
      // 记录memdir运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_memdir_loaded', {
        ...baseMetadata,
        total_file_count: fileCount,
        total_subdir_count: subdirCount,
      })
    },
    // 这个回调绑定到 () => {，负责memdir在该局部场景下的响应。
    () => {
      // Directory unreadable — log without counts
      // 记录memdir运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_memdir_loaded', baseMetadata)
    },
  )
}

/**
 * Build the typed-memory behavioral instructions (without MEMORY.md content).
 * Constrains memories to a closed four-type taxonomy (user / feedback / project /
 * reference) — content that is derivable from the current project state (code
 * patterns, architecture, git history) is explicitly excluded.
 *
 * Individual-only variant: no `## Memory scope` section, no <scope> tags
 * in type blocks, and team/private qualifiers stripped from examples.
 *
 * Used by both buildMemoryPrompt (agent memory, includes content) and
 * loadMemoryPrompt (system prompt, content injected via user context instead).
 */
// buildMemoryLines 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMemoryLines(
  displayName: string,
  memoryDir: string,
  extraGuidelines?: string[],
  skipIndex = false,
): string[] {
  // howToSave保存`skipIndex`，供memdir后续判断或输出使用。
  const howToSave = skipIndex
    ? [
        '## How to save memories',
        '',
        'Write each memory to its own file (e.g., `user_role.md`, `feedback_testing.md`) using this frontmatter format:',
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        '- Keep the name, description, and type fields in memory files up-to-date with the content',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]
    : [
        '## How to save memories',
        '',
        'Saving a memory is a two-step process:',
        '',
        '**Step 1** — write the memory to its own file (e.g., `user_role.md`, `feedback_testing.md`) using this frontmatter format:',
        '',
        ...MEMORY_FRONTMATTER_EXAMPLE,
        '',
        `**Step 2** — add a pointer to that file in \`${ENTRYPOINT_NAME}\`. \`${ENTRYPOINT_NAME}\` is an index, not a memory — each entry should be one line, under ~150 characters: \`- [Title](file.md) — one-line hook\`. It has no frontmatter. Never write memory content directly into \`${ENTRYPOINT_NAME}\`.`,
        '',
        `- \`${ENTRYPOINT_NAME}\` is always loaded into your conversation context — lines after ${MAX_ENTRYPOINT_LINES} will be truncated, so keep the index concise`,
        '- Keep the name, description, and type fields in memory files up-to-date with the content',
        '- Organize memory semantically by topic, not chronologically',
        '- Update or remove memories that turn out to be wrong or outdated',
        '- Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one.',
      ]

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines: string[] = [
    `# ${displayName}`,
    '',
    `You have a persistent, file-based memory system at \`${memoryDir}\`. ${DIR_EXISTS_GUIDANCE}`,
    '',
    "You should build up this memory system over time so that future conversations can have a complete picture of who the user is, how they'd like to collaborate with you, what behaviors to avoid or repeat, and the context behind the work the user gives you.",
    '',
    'If the user explicitly asks you to remember something, save it immediately as whichever type fits best. If they ask you to forget something, find and remove the relevant entry.',
    '',
    ...TYPES_SECTION_INDIVIDUAL,
    ...WHAT_NOT_TO_SAVE_SECTION,
    '',
    ...howToSave,
    '',
    ...WHEN_TO_ACCESS_SECTION,
    '',
    ...TRUSTING_RECALL_SECTION,
    '',
    '## Memory and other forms of persistence',
    'Memory is one of several persistence mechanisms available to you as you assist the user in a given conversation. The distinction is often that memory can be recalled in future conversations and should not be used for persisting information that is only useful within the scope of the current conversation.',
    '- When to use or update a plan instead of memory: If you are about to start a non-trivial implementation task and would like to reach alignment with the user on your approach you should use a Plan rather than saving this information to memory. Similarly, if you already have a plan within the conversation and you have changed your approach persist that change by updating the plan rather than saving a memory.',
    '- When to use or update tasks instead of memory: When you need to break your work in current conversation into discrete steps or keep track of your progress use tasks instead of saving to memory. Tasks are great for persisting information about the work that needs to be done in the current conversation, but memory should be reserved for information that will be useful in future conversations.',
    '',
    ...(extraGuidelines ?? []),
    '',
  ]

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(...buildSearchingPastContextSection(memoryDir))

  // 返回 `lines`，作为memdir这次计算的结果。
  return lines
}

/**
 * Build the typed-memory prompt with MEMORY.md content included.
 * Used by agent memory (which has no getClaudeMds() equivalent).
 */
// buildMemoryPrompt 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMemoryPrompt(params: {
  displayName: string
  memoryDir: string
  extraGuidelines?: string[]
}): string {
  // 从 `params` 解构 displayName、memoryDir、extraGuidelines，减少memdir对同一对象的重复访问。
  const { displayName, memoryDir, extraGuidelines } = params
  // fs 集合读取`getFsImplementation`，供memdir后续处理使用。
  const fs = getFsImplementation()
  // entrypoint保存`memoryDir + ENTRYPOINT_NAME`，供后续判断或组装使用。
  const entrypoint = memoryDir + ENTRYPOINT_NAME

  // Directory creation is the caller's responsibility (loadMemoryPrompt /
  // loadAgentMemoryPrompt). Builders only read, they don't mkdir.

  // Read existing memory entrypoint (sync: prompt building is synchronous)
  // entrypointContent 命名 `''`，让后续代码直接表达这个值的用途。
  let entrypointContent = ''
  // 保护这一段可能失败的memdir操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs
    // entrypointContent更新为 `fs.readFileSync(entrypoint, { encoding: 'utf-8' })`，确保memdir后续读取最新状态。
    entrypointContent = fs.readFileSync(entrypoint, { encoding: 'utf-8' })
  } catch {
    // No memory file yet
  }

  // 文本行构建`buildMemoryLines`，供memdir后续处理使用。
  const lines = buildMemoryLines(displayName, memoryDir, extraGuidelines)

  // 满足 `entrypointContent.trim()` 时，memdir执行该分支。
  if (entrypointContent.trim()) {
    // t保存`truncateEntrypointContent`，供memdir后续处理使用。
    const t = truncateEntrypointContent(entrypointContent)
    // memoryType标记memdir是否启用对应路径。
    const memoryType = displayName === AUTO_MEM_DISPLAY_NAME ? 'auto' : 'agent'
    // 调用 logMemoryDirCounts，触发memdir此处需要的副作用。
    logMemoryDirCounts(memoryDir, {
      content_length: t.byteCount,
      line_count: t.lineCount,
      was_truncated: t.wasLineTruncated,
      was_byte_truncated: t.wasByteTruncated,
      memory_type:
        memoryType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`## ${ENTRYPOINT_NAME}`, '', t.content)
  } else {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `## ${ENTRYPOINT_NAME}`,
      '',
      `Your ${ENTRYPOINT_NAME} is currently empty. When you save new memories, they will appear here.`,
    )
  }

  // 返回 `lines.join('\n')`，作为memdir这次计算的结果。
  return lines.join('\n')
}

/**
 * Assistant-mode daily-log prompt. Gated behind feature('KAIROS').
 *
 * Assistant sessions are effectively perpetual, so the agent writes memories
 * append-only to a date-named log file rather than maintaining MEMORY.md as
 * a live index. A separate nightly /dream skill distills logs into topic
 * files + MEMORY.md. MEMORY.md is still loaded into context (via claudemd.ts)
 * as the distilled index — this prompt only changes where NEW memories go.
 */
// buildAssistantDailyLogPrompt 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildAssistantDailyLogPrompt(skipIndex = false): string {
  // memoryDir读取`getAutoMemPath`，供memdir后续处理使用。
  const memoryDir = getAutoMemPath()
  // Describe the path as a pattern rather than inlining today's literal path:
  // this prompt is cached by systemPromptSection('memory', ...) and NOT
  // invalidated on date change. The model derives the current date from the
  // date_change attachment (appended at the tail on midnight rollover) rather
  // than the user-context message — the latter is intentionally left stale to
  // preserve the prompt cache prefix across midnight.
  // logPathPattern 路径数据格式化`join`，供memdir后续处理使用。
  const logPathPattern = join(memoryDir, 'logs', 'YYYY', 'MM', 'YYYY-MM-DD.md')

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines: string[] = [
    '# auto memory',
    '',
    `You have a persistent, file-based memory system found at: \`${memoryDir}\``,
    '',
    "This session is long-lived. As you work, record anything worth remembering by **appending** to today's daily log file:",
    '',
    `\`${logPathPattern}\``,
    '',
    "Substitute today's date (from `currentDate` in your context) for `YYYY-MM-DD`. When the date rolls over mid-session, start appending to the new day's file.",
    '',
    'Write each entry as a short timestamped bullet. Create the file (and parent directories) on first write if it does not exist. Do not rewrite or reorganize the log — it is append-only. A separate nightly process distills these logs into `MEMORY.md` and topic files.',
    '',
    '## What to log',
    '- User corrections and preferences ("use bun, not npm"; "stop summarizing diffs")',
    '- Facts about the user, their role, or their goals',
    '- Project context that is not derivable from the code (deadlines, incidents, decisions and their rationale)',
    '- Pointers to external systems (dashboards, Linear projects, Slack channels)',
    '- Anything the user explicitly asks you to remember',
    '',
    ...WHAT_NOT_TO_SAVE_SECTION,
    '',
    ...(skipIndex
      ? []
      : [
          `## ${ENTRYPOINT_NAME}`,
          `\`${ENTRYPOINT_NAME}\` is the distilled index (maintained nightly from your logs) and is loaded into your context automatically. Read it for orientation, but do not edit it directly — record new information in today's log instead.`,
          '',
        ]),
    ...buildSearchingPastContextSection(memoryDir),
  ]

  // 返回 `lines.join('\n')`，作为memdir这次计算的结果。
  return lines.join('\n')
}

/**
 * Build the "Searching past context" section if the feature gate is enabled.
 */
// buildSearchingPastContextSection 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSearchingPastContextSection(autoMemDir: string): string[] {
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_coral_fern', false)` 时，memdir执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_coral_fern', false)) {
    // 返回列表结果，保留memdir已经排好的条目顺序。
    return []
  }
  // projectDir读取`getProjectDir`，供memdir后续处理使用。
  const projectDir = getProjectDir(getOriginalCwd())
  // Ant-native builds alias grep to embedded ugrep and remove the dedicated
  // Grep tool, so give the model a real shell invocation there.
  // In REPL mode, both Grep and Bash are hidden from direct use — the model
  // calls them from inside REPL scripts, so the grep shell form is what it
  // will write in the script anyway.
  // embedded保存`hasEmbeddedSearchTools`，供memdir后续处理使用。
  const embedded = hasEmbeddedSearchTools() || isReplModeEnabled()
  // memSearch保存`embedded`，供后续判断或组装使用。
  const memSearch = embedded
    ? `grep -rn "<search term>" ${autoMemDir} --include="*.md"`
    : `${GREP_TOOL_NAME} with pattern="<search term>" path="${autoMemDir}" glob="*.md"`
  // transcriptSearch保存`embedded`，供后续判断或组装使用。
  const transcriptSearch = embedded
    ? `grep -rn "<search term>" ${projectDir}/ --include="*.jsonl"`
    : `${GREP_TOOL_NAME} with pattern="<search term>" path="${projectDir}/" glob="*.jsonl"`
  // 返回列表结果，保留memdir已经排好的条目顺序。
  return [
    '## Searching past context',
    '',
    'When looking for past context:',
    '1. Search topic files in your memory directory:',
    '```',
    memSearch,
    '```',
    '2. Session transcript logs (last resort — large files, slow):',
    '```',
    transcriptSearch,
    '```',
    'Use narrow search terms (error messages, file paths, function names) rather than broad keywords.',
    '',
  ]
}

/**
 * Load the unified memory prompt for inclusion in the system prompt.
 * Dispatches based on which memory systems are enabled:
 *   - auto + team: combined prompt (both directories)
 *   - auto only: memory lines (single directory)
 * Team memory requires auto memory (enforced by isTeamMemoryEnabled), so
 * there is no team-only branch.
 *
 * Returns null when auto memory is disabled.
 */
// loadMemoryPrompt 封装memdir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadMemoryPrompt(): Promise<string | null> {
  // autoEnabled保存`isAutoMemoryEnabled`，供memdir后续处理使用。
  const autoEnabled = isAutoMemoryEnabled()

  // skipIndex 索引读取`getFeatureValue_CACHED_MAY_BE_STALE`，供memdir后续处理使用。
  const skipIndex = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_moth_copse',
    false,
  )

  // KAIROS daily-log mode takes precedence over TEAMMEM: the append-only
  // log paradigm does not compose with team sync (which expects a shared
  // MEMORY.md that both sides read + write). Gating on `autoEnabled` here
  // means the !autoEnabled case falls through to the tengu_memdir_disabled
  // telemetry block below, matching the non-KAIROS path.
  // 组合条件 `feature('KAIROS') && autoEnabled && getKairosActive()` 成立时，memdir才启用这条专门路径。
  if (feature('KAIROS') && autoEnabled && getKairosActive()) {
    // 调用 logMemoryDirCounts，触发memdir此处需要的副作用。
    logMemoryDirCounts(getAutoMemPath(), {
      memory_type:
        'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 `buildAssistantDailyLogPrompt(skipIndex)`，作为memdir这次计算的结果。
    return buildAssistantDailyLogPrompt(skipIndex)
  }

  // Cowork injects memory-policy text via env var; thread into all builders.
  // coworkExtraGuidelines 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const coworkExtraGuidelines =
    process.env.CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES
  // extraGuidelines 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const extraGuidelines =
    coworkExtraGuidelines && coworkExtraGuidelines.trim().length > 0
      ? [coworkExtraGuidelines]
      : undefined

  // 满足 `feature('TEAMMEM')` 时，memdir执行该分支。
  if (feature('TEAMMEM')) {
    // 满足 `teamMemPaths!.isTeamMemoryEnabled()` 时，memdir执行该分支。
    if (teamMemPaths!.isTeamMemoryEnabled()) {
      // autoDir读取`getAutoMemPath`，供memdir后续处理使用。
      const autoDir = getAutoMemPath()
      // teamDir读取`getTeamMemPath`，供memdir后续处理使用。
      const teamDir = teamMemPaths!.getTeamMemPath()
      // Harness guarantees these directories exist so the model can write
      // without checking. The prompt text reflects this ("already exists").
      // Only creating teamDir is sufficient: getTeamMemPath() is defined as
      // join(getAutoMemPath(), 'team'), so recursive mkdir of the team dir
      // creates the auto dir as a side effect. If the team dir ever moves
      // out from under the auto dir, add a second ensureMemoryDirExists call
      // for autoDir here.
      // 等待 `ensureMemoryDirExists(teamDir)` 完成，再继续memdir的异步流程。
      await ensureMemoryDirExists(teamDir)
      // 调用 logMemoryDirCounts，触发memdir此处需要的副作用。
      logMemoryDirCounts(autoDir, {
        memory_type:
          'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 调用 logMemoryDirCounts，触发memdir此处需要的副作用。
      logMemoryDirCounts(teamDir, {
        memory_type:
          'team' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 返回 `teamMemPrompts!.buildCombinedMemoryPrompt(`，作为memdir这次计算的结果。
      return teamMemPrompts!.buildCombinedMemoryPrompt(
        extraGuidelines,
        skipIndex,
      )
    }
  }

  // 满足 `autoEnabled` 时，memdir执行该分支。
  if (autoEnabled) {
    // autoDir读取`getAutoMemPath`，供memdir后续处理使用。
    const autoDir = getAutoMemPath()
    // Harness guarantees the directory exists so the model can write without
    // checking. The prompt text reflects this ("already exists").
    // 等待 `ensureMemoryDirExists(autoDir)` 完成，再继续memdir的异步流程。
    await ensureMemoryDirExists(autoDir)
    // 调用 logMemoryDirCounts，触发memdir此处需要的副作用。
    logMemoryDirCounts(autoDir, {
      memory_type:
        'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 `buildMemoryLines(`，作为memdir这次计算的结果。
    return buildMemoryLines(
      'auto memory',
      autoDir,
      extraGuidelines,
      skipIndex,
    ).join('\n')
  }

  // 记录memdir运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_memdir_disabled', {
    disabled_by_env_var: isEnvTruthy(
      process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY,
    ),
    disabled_by_setting:
      !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY) &&
      getInitialSettings().autoMemoryEnabled === false,
  })
  // Gate on the GB flag directly, not isTeamMemoryEnabled() — that function
  // checks isAutoMemoryEnabled() first, which is definitionally false in this
  // branch. We want "was this user in the team-memory cohort at all."
  // 满足 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_herring_clock', false)` 时，memdir执行该分支。
  if (getFeatureValue_CACHED_MAY_BE_STALE('tengu_herring_clock', false)) {
    // 记录memdir运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_team_memdir_disabled', {})
  }
  // 返回 `null`，作为memdir这次计算的结果。
  return null
}
