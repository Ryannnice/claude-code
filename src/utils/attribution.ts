// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 引入 getClientType，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getClientType } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getRemoteSessionUrl,
  isRemoteSessionLocal,
  PRODUCT_URL,
} from '../constants/product.js'
// 引入 TERMINAL_OUTPUT_TAGS，将 ../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TERMINAL_OUTPUT_TAGS } from '../constants/xml.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../tools/FileWriteTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from '../tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../tools/GrepTool/prompt.js'
// 类型依赖 { Entry } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { Entry } from '../types/logs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AttributionData,
  calculateCommitAttribution,
  isInternalModelRepo,
  isInternalModelRepoCached,
  sanitizeModelName,
} from './commitAttribution.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 parseJSONL，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { parseJSONL } from './json.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCanonicalName,
  getMainLoopModel,
  getPublicModelDisplayName,
  getPublicModelName,
} from './model/model.js'
// 引入 isMemoryFileAccess，将 ./sessionFileAccessHooks.js 中已经封装好的能力接到本文件流程里。
import { isMemoryFileAccess } from './sessionFileAccessHooks.js'
// 引入 getTranscriptPath，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getTranscriptPath } from './sessionStorage.js'
// 引入 readTranscriptForLoad，将 ./sessionStoragePortable.js 中已经封装好的能力接到本文件流程里。
import { readTranscriptForLoad } from './sessionStoragePortable.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'
// 引入 isUndercover，将 ./undercover.js 中已经封装好的能力接到本文件流程里。
import { isUndercover } from './undercover.js'

// AttributionTexts 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AttributionTexts = {
  commit: string
  pr: string
}

/**
 * Returns attribution text for commits and PRs based on user settings.
 * Handles:
 * - Dynamic model name via getPublicModelName()
 * - Custom attribution settings (settings.attribution.commit/pr)
 * - Backward compatibility with deprecated includeCoAuthoredBy setting
 * - Remote mode: returns session URL for attribution
 */
// getAttributionTexts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAttributionTexts(): AttributionTexts {
  // 只有 `process.env.USER_TYPE === 'ant' && isUndercover()` 满足时，共享工具才执行该分支。
  if (process.env.USER_TYPE === 'ant' && isUndercover()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { commit: '', pr: '' }
  }

  // 当 `getClientType()` 匹配 `'remote'` 时，共享工具执行对应分支。
  if (getClientType() === 'remote') {
    // remoteSessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
    // 满足 `remoteSessionId` 时，共享工具执行该分支。
    if (remoteSessionId) {
      // ingressUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const ingressUrl = process.env.SESSION_INGRESS_URL
      // Skip for local dev - URLs won't persist
      // 满足 `!isRemoteSessionLocal(remoteSessionId, ingressUrl)` 时，共享工具执行该分支。
      if (!isRemoteSessionLocal(remoteSessionId, ingressUrl)) {
        // sessionUrl 会话数据读取`getRemoteSessionUrl`，供共享工具后续处理使用。
        const sessionUrl = getRemoteSessionUrl(remoteSessionId, ingressUrl)
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { commit: sessionUrl, pr: sessionUrl }
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { commit: '', pr: '' }
  }

  // @[MODEL LAUNCH]: Update the hardcoded fallback model name below (guards against codename leaks).
  // For internal repos, use the real model name. For external repos,
  // fall back to "Claude Opus 4.6" for unrecognized models to avoid leaking codenames.
  // 模型名称读取`getMainLoopModel`，供共享工具后续处理使用。
  const model = getMainLoopModel()
  // isKnownPublicModel记录 `getPublicModelDisplayName` 是否成立，共享工具随后按该结果分支。
  const isKnownPublicModel = getPublicModelDisplayName(model) !== null
  // modelName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const modelName =
    isInternalModelRepoCached() || isKnownPublicModel
      ? getPublicModelName(model)
      : 'Claude Opus 4.6'
  // defaultAttribution读取 ``🤖 Generated with [Claude Code](${PRODUCT_URL})`` 对应条目，后续围绕该成员继续处理。
  const defaultAttribution = `🤖 Generated with [Claude Code](${PRODUCT_URL})`
  // defaultCommit保存``Co-Authored-By: ${modelName} <noreply@anthropic.com>``，作为后续固定文本处理的输入。
  const defaultCommit = `Co-Authored-By: ${modelName} <noreply@anthropic.com>`

  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()

  // New attribution setting takes precedence over deprecated includeCoAuthoredBy
  // 满足 `settings.attribution` 时，共享工具执行该分支。
  if (settings.attribution) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      commit: settings.attribution.commit ?? defaultCommit,
      pr: settings.attribution.pr ?? defaultAttribution,
    }
  }

  // Backward compatibility: deprecated includeCoAuthoredBy setting
  // 满足 `settings.includeCoAuthoredBy === false` 时，共享工具执行该分支。
  if (settings.includeCoAuthoredBy === false) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { commit: '', pr: '' }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { commit: defaultCommit, pr: defaultAttribution }
}

/**
 * Check if a message content string is terminal output rather than a user prompt.
 * Terminal output includes bash input/output tags and caveat messages about local commands.
 */
// isTerminalOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTerminalOutput(content: string): boolean {
  // 按顺序遍历 `TERMINAL_OUTPUT_TAGS` 中的tag，逐个交给共享工具处理。
  for (const tag of TERMINAL_OUTPUT_TAGS) {
    // 满足 `content.includes(`<${tag}>`)` 时，共享工具执行该分支。
    if (content.includes(`<${tag}>`)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Count user messages with visible text content in a list of non-sidechain messages.
 * Excludes tool_result blocks, terminal output, and empty messages.
 *
 * Callers should pass messages already filtered to exclude sidechain messages.
 */
// countUserPromptsInMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countUserPromptsInMessages(
  messages: ReadonlyArray<{ type: string; message?: { content?: unknown } }>,
): number {
  // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let count = 0

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 文本内容 命名 `message.message?.content`，让后续代码直接表达这个值的用途。
    const content = message.message?.content
    // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!content) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // hasUserText标记共享工具 attribution是否启用对应路径。
    let hasUserText = false

    // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof content === 'string') {
      // 满足 `isTerminalOutput(content)` 时，共享工具执行该分支。
      if (isTerminalOutput(content)) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // hasUserText更新为 `content.trim().length > 0`，确保共享工具后续读取最新状态。
      hasUserText = content.trim().length > 0
    // 共享工具 attribution在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
    } else if (Array.isArray(content)) {
      // hasUserText更新为 `content.some(block => {`，确保共享工具后续读取最新状态。
      hasUserText = content.some(block => {
        // `!block || typeof block` 与 `'object' || !('type' in block)` 不一致时刷新派生状态，避免使用过期结果。
        if (!block || typeof block !== 'object' || !('type' in block)) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // 返回 `(`，作为共享工具这次计算的结果。
        return (
          (block.type === 'text' &&
            typeof block.text === 'string' &&
            !isTerminalOutput(block.text)) ||
          block.type === 'image' ||
          block.type === 'document'
        )
      })
    }

    // 满足 `hasUserText` 时，共享工具执行该分支。
    if (hasUserText) {
      // 共享工具 attribution在这里处理 `count++`，完成这一小步状态转换。
      count++
    }
  }

  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

/**
 * Count non-sidechain user messages in transcript entries.
 * Used to calculate the number of "steers" (user prompts - 1).
 *
 * Counts user messages that contain actual user-typed text,
 * excluding tool_result blocks, sidechain messages, and terminal output.
 */
// countUserPromptsFromEntries 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUserPromptsFromEntries(entries: ReadonlyArray<Entry>): number {
  // nonSidechain筛选`entries.filter`，供共享工具后续处理使用。
  const nonSidechain = entries.filter(
    entry =>
      entry.type === 'user' && !('isSidechain' in entry && entry.isSidechain),
  )
  // 返回 `countUserPromptsInMessages(nonSidechain)`，作为共享工具这次计算的结果。
  return countUserPromptsInMessages(nonSidechain)
}

/**
 * Get full attribution data from the provided AppState's attribution state.
 * Uses ALL tracked files from the attribution state (not just staged files)
 * because for PR attribution, files may not be staged yet.
 * Returns null if no attribution data is available.
 */
// getPRAttributionData 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getPRAttributionData(
  appState: AppState,
): Promise<AttributionData | null> {
  // attribution保存`appState.attribution`，供后续判断或组装使用。
  const attribution = appState.attribution

  // attribution缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!attribution) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Handle both Map and plain object (in case of serialization)
  // fileStates 文件数据 命名 `attribution.fileStates`，让后续代码直接表达这个值的用途。
  const fileStates = attribution.fileStates
  // isMap标记共享工具 attribution是否启用对应路径。
  const isMap = fileStates instanceof Map
  // trackedFiles 文件数据保存`isMap`，供共享工具 attribution后续判断或输出使用。
  const trackedFiles = isMap
    ? Array.from(fileStates.keys())
    : Object.keys(fileStates)

  // trackedFiles 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (trackedFiles.length === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `calculateCommitAttribution([attribution], trackedFiles)`，调用方直接接收异步结果。
    return await calculateCommitAttribution([attribution], trackedFiles)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// MEMORY_ACCESS_TOOL_NAMES 集合保存`Set`，供共享工具后续处理使用。
const MEMORY_ACCESS_TOOL_NAMES = new Set([
  FILE_READ_TOOL_NAME,
  GREP_TOOL_NAME,
  GLOB_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
])

/**
 * Count memory file accesses in transcript entries.
 * Uses the same detection conditions as the PostToolUse session file access hooks.
 */
// countMemoryFileAccessFromEntries 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countMemoryFileAccessFromEntries(
  entries: ReadonlyArray<Entry>,
): number {
  // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let count = 0
  // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
  for (const entry of entries) {
    // `entry.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (entry.type !== 'assistant') continue
    // 文本内容保存`entry.message?.content`，供共享工具 attribution后续判断或输出使用。
    const content = entry.message?.content
    // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
    if (!Array.isArray(content)) continue
    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        block.type !== 'tool_use' ||
        !MEMORY_ACCESS_TOOL_NAMES.has(block.name)
      )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      // 满足 `isMemoryFileAccess(block.name, block.input)` 时，共享工具执行该分支。
      if (isMemoryFileAccess(block.name, block.input)) count++
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

/**
 * Read session transcript entries and compute prompt count and memory access
 * count. Pre-compact entries are skipped — the N-shot count and memory-access
 * count should reflect only the current conversation arc, not accumulated
 * prompts from before a compaction boundary.
 */
// getTranscriptStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getTranscriptStats(): Promise<{
  promptCount: number
  memoryAccessCount: number
}> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文件路径读取`getTranscriptPath`，供共享工具后续处理使用。
    const filePath = getTranscriptPath()
    // fileSize 文件数据保存`stat`，供共享工具后续处理使用。
    const fileSize = (await stat(filePath)).size
    // Fused reader: attr-snap lines (84% of a long session by bytes) are
    // skipped at the fd level so peak scales with output, not file size. The
    // one surviving attr-snap at EOF is a no-op for the count functions
    // (neither checks type === 'attribution-snapshot'). When the last
    // boundary has preservedSegment the reader returns full (no truncate);
    // the findLastIndex below still slices to post-boundary.
    // scan读取`readTranscriptForLoad`，供共享工具后续处理使用。
    const scan = await readTranscriptForLoad(filePath, fileSize)
    // buf 命名 `scan.postBoundaryBuf`，让后续代码直接表达这个值的用途。
    const buf = scan.postBoundaryBuf
    // entries 集合解析`parseJSONL<Entry>(buf)`，供后续判断或组装使用。
    const entries = parseJSONL<Entry>(buf)
    // lastBoundaryIdx筛选`entries.findLastIndex`，供共享工具后续处理使用。
    const lastBoundaryIdx = entries.findLastIndex(
      // e更新为 `>`，确保共享工具后续读取最新状态。
      e =>
        e.type === 'system' &&
        'subtype' in e &&
        e.subtype === 'compact_boundary',
    )
    // postBoundary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const postBoundary =
      lastBoundaryIdx >= 0 ? entries.slice(lastBoundaryIdx + 1) : entries
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      promptCount: countUserPromptsFromEntries(postBoundary),
      memoryAccessCount: countMemoryFileAccessFromEntries(postBoundary),
    }
  } catch {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { promptCount: 0, memoryAccessCount: 0 }
  }
}

/**
 * Get enhanced PR attribution text with Claude contribution stats.
 *
 * Format: "🤖 Generated with Claude Code (93% 3-shotted by claude-opus-4-5)"
 *
 * Rules:
 * - Shows Claude contribution percentage from commit attribution
 * - Shows N-shotted where N is the prompt count (1-shotted, 2-shotted, etc.)
 * - Shows short model name (e.g., claude-opus-4-5)
 * - Returns default attribution if stats can't be computed
 *
 * @param getAppState Function to get the current AppState (from command context)
 */
// getEnhancedPRAttribution 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getEnhancedPRAttribution(
  // 这个回调绑定到 getAppState: () => AppState,，负责共享工具在该局部场景下的响应。
  getAppState: () => AppState,
): Promise<string> {
  // 只有 `process.env.USER_TYPE === 'ant' && isUndercover()` 满足时，共享工具才执行该分支。
  if (process.env.USER_TYPE === 'ant' && isUndercover()) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 当 `getClientType()` 匹配 `'remote'` 时，共享工具执行对应分支。
  if (getClientType() === 'remote') {
    // remoteSessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
    // 满足 `remoteSessionId` 时，共享工具执行该分支。
    if (remoteSessionId) {
      // ingressUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const ingressUrl = process.env.SESSION_INGRESS_URL
      // Skip for local dev - URLs won't persist
      // 满足 `!isRemoteSessionLocal(remoteSessionId, ingressUrl)` 时，共享工具执行该分支。
      if (!isRemoteSessionLocal(remoteSessionId, ingressUrl)) {
        // 返回 `getRemoteSessionUrl(remoteSessionId, ingressUrl)`，作为共享工具这次计算的结果。
        return getRemoteSessionUrl(remoteSessionId, ingressUrl)
      }
    }
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()

  // If user has custom PR attribution, use that
  // 满足 `settings.attribution?.pr` 时，共享工具执行该分支。
  if (settings.attribution?.pr) {
    // 返回 `settings.attribution.pr`，作为共享工具这次计算的结果。
    return settings.attribution.pr
  }

  // Backward compatibility: deprecated includeCoAuthoredBy setting
  // 满足 `settings.includeCoAuthoredBy === false` 时，共享工具执行该分支。
  if (settings.includeCoAuthoredBy === false) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // defaultAttribution读取 ``🤖 Generated with [Claude Code](${PRODUCT_URL})`` 对应条目，后续围绕该成员继续处理。
  const defaultAttribution = `🤖 Generated with [Claude Code](${PRODUCT_URL})`

  // Get AppState first
  // appState 状态读取`getAppState`，供共享工具后续处理使用。
  const appState = getAppState()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `PR Attribution: appState.attribution exists: ${!!appState.attribution}`,
  )
  // 满足 `appState.attribution` 时，共享工具执行该分支。
  if (appState.attribution) {
    // fileStates 文件数据保存`appState.attribution.fileStates`，供后续判断或组装使用。
    const fileStates = appState.attribution.fileStates
    // isMap标记共享工具 attribution是否启用对应路径。
    const isMap = fileStates instanceof Map
    // fileCount 文件数据派生`Object.keys`，供共享工具后续处理使用。
    const fileCount = isMap ? fileStates.size : Object.keys(fileStates).length
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`PR Attribution: fileStates count: ${fileCount}`)
  }

  // Get attribution stats (transcript is read once for both prompt count and memory access)
  // 共享工具 attribution先整理这一处局部数据，后续分支可以直接读取。
  const [attributionData, { promptCount, memoryAccessCount }, isInternal] =
    await Promise.all([
      getPRAttributionData(appState),
      getTranscriptStats(),
      isInternalModelRepo(),
    ])

  // claudePercent保存`attributionData?.summary.claudePercent ?? 0`，供共享工具 attribution后续判断或输出使用。
  const claudePercent = attributionData?.summary.claudePercent ?? 0

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `PR Attribution: claudePercent: ${claudePercent}, promptCount: ${promptCount}, memoryAccessCount: ${memoryAccessCount}`,
  )

  // Get short model name, sanitized for non-internal repos
  // rawModelName读取`getCanonicalName`，供共享工具后续处理使用。
  const rawModelName = getCanonicalName(getMainLoopModel())
  // shortModelName保存`isInternal`，供后续判断或组装使用。
  const shortModelName = isInternal
    ? rawModelName
    : sanitizeModelName(rawModelName)

  // If no attribution data, return default
  // 只有 `claudePercent === 0 && promptCount === 0 && memor` 满足时，共享工具才执行该分支。
  if (claudePercent === 0 && promptCount === 0 && memoryAccessCount === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('PR Attribution: returning default (no data)')
    // 返回 `defaultAttribution`，作为共享工具这次计算的结果。
    return defaultAttribution
  }

  // Build the enhanced attribution: "🤖 Generated with Claude Code (93% 3-shotted by claude-opus-4-5, 2 memories recalled)"
  // memSuffix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const memSuffix =
    memoryAccessCount > 0
      ? `, ${memoryAccessCount} ${memoryAccessCount === 1 ? 'memory' : 'memories'} recalled`
      : ''
  // summary读取 ``🤖 Generated with [Claude Code](${PRODUCT_URL}) (${claud...` 对应条目，后续围绕该成员继续处理。
  const summary = `🤖 Generated with [Claude Code](${PRODUCT_URL}) (${claudePercent}% ${promptCount}-shotted by ${shortModelName}${memSuffix})`

  // Append trailer lines for squash-merge survival. Only for allowlisted repos
  // (INTERNAL_MODEL_REPOS) and only in builds with COMMIT_ATTRIBUTION enabled —
  // attributionTrailer.ts contains excluded strings, so reach it via dynamic
  // import behind feature(). When the repo is configured with
  // squash_merge_commit_message=PR_BODY (cli, apps), the PR body becomes the
  // squash commit body verbatim — trailer lines at the end become proper git
  // trailers on the squash commit.
  // 只有 `feature('COMMIT_ATTRIBUTION') && isInternal && attributionData` 满足时，共享工具才执行该分支。
  if (feature('COMMIT_ATTRIBUTION') && isInternal && attributionData) {
    // 从 `await import('./attributionTrailer.js')` 解构 buildPRTrailers，减少共享工具 attribution对同一对象的重复访问。
    const { buildPRTrailers } = await import('./attributionTrailer.js')
    // trailers 集合构建`buildPRTrailers`，供共享工具后续处理使用。
    const trailers = buildPRTrailers(attributionData, appState.attribution)
    // 结果格式化`trailers.join`，供共享工具后续处理使用。
    const result = `${summary}\n\n${trailers.join('\n')}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`PR Attribution: returning with trailers: ${result}`)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`PR Attribution: returning summary: ${summary}`)
  // 返回 `summary`，作为共享工具这次计算的结果。
  return summary
}
