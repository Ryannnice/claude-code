// 引入 getDirectConnectServerUrl、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getDirectConnectServerUrl, getSessionId } from '../bootstrap/state.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 类型依赖 { LogOption } 来自 ../types/logs.js，用于校准共享工具的数据契约。
import type { LogOption } from '../types/logs.js'
// 引入 getSubscriptionName、isClaudeAISubscriber，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { getSubscriptionName, isClaudeAISubscriber } from './auth.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 getDisplayPath，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getDisplayPath } from './file.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  truncate,
  truncateToWidth,
  truncateToWidthNoEllipsis,
} from './format.js'
// 引入 getStoredChangelogFromMemory、parseChangelog，将 ./releaseNotes.js 中已经封装好的能力接到本文件流程里。
import { getStoredChangelogFromMemory, parseChangelog } from './releaseNotes.js'
// 引入 gt，将 ./semver.js 中已经封装好的能力接到本文件流程里。
import { gt } from './semver.js'
// 引入 loadMessageLogs，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { loadMessageLogs } from './sessionStorage.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'

// Layout constants
// MAX_LEFT_WIDTH保存`50`，供共享工具 logo V2 Utils后续判断或输出使用。
const MAX_LEFT_WIDTH = 50
// MAX_USERNAME_LENGTH 数量保存`20`，供共享工具 logo V2 Utils后续判断或输出使用。
const MAX_USERNAME_LENGTH = 20
// BORDER_PADDING 命名 `4`，让后续代码直接表达这个值的用途。
const BORDER_PADDING = 4
// DIVIDER_WIDTH保存`1`，供共享工具 logo V2 Utils后续判断或输出使用。
const DIVIDER_WIDTH = 1
// CONTENT_PADDING保存`2`，供后续判断或组装使用。
const CONTENT_PADDING = 2

// LayoutMode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutMode = 'horizontal' | 'compact'

// LayoutDimensions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutDimensions = {
  leftWidth: number
  rightWidth: number
  totalWidth: number
}

/**
 * Determines the layout mode based on terminal width
 */
// getLayoutMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLayoutMode(columns: number): LayoutMode {
  // 满足 `columns >= 70` 时，共享工具执行该分支。
  if (columns >= 70) return 'horizontal'
  // 返回 `'compact'`，作为共享工具这次计算的结果。
  return 'compact'
}

/**
 * Calculates layout dimensions for the LogoV2 component
 */
// calculateLayoutDimensions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateLayoutDimensions(
  columns: number,
  layoutMode: LayoutMode,
  optimalLeftWidth: number,
): LayoutDimensions {
  // 当 `layoutMode` 匹配 `'horizontal'` 时，共享工具执行对应分支。
  if (layoutMode === 'horizontal') {
    // leftWidth保存`optimalLeftWidth`，供共享工具 logo V2 Utils后续判断或输出使用。
    const leftWidth = optimalLeftWidth
    // usedSpace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const usedSpace =
      BORDER_PADDING + CONTENT_PADDING + DIVIDER_WIDTH + leftWidth
    // availableForRight保存`columns - usedSpace`，供共享工具 logo V2 Utils后续判断或输出使用。
    const availableForRight = columns - usedSpace

    // rightWidth保存`Math.max`，供共享工具后续处理使用。
    let rightWidth = Math.max(30, availableForRight)
    // totalWidth保存`Math.min`，供共享工具后续处理使用。
    const totalWidth = Math.min(
      leftWidth + rightWidth + DIVIDER_WIDTH + CONTENT_PADDING,
      columns - BORDER_PADDING,
    )

    // Recalculate right width if we had to cap the total
    // 满足 `totalWidth < leftWidth + rightWidth + DIVIDER_WID` 时，共享工具执行该分支。
    if (totalWidth < leftWidth + rightWidth + DIVIDER_WIDTH + CONTENT_PADDING) {
      // rightWidth更新为 `totalWidth - leftWidth - DIVIDER_WIDTH - CONTENT_PADDING`，确保共享工具后续读取最新状态。
      rightWidth = totalWidth - leftWidth - DIVIDER_WIDTH - CONTENT_PADDING
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { leftWidth, rightWidth, totalWidth }
  }

  // Vertical mode
  // totalWidth保存`Math.min`，供共享工具后续处理使用。
  const totalWidth = Math.min(columns - BORDER_PADDING, MAX_LEFT_WIDTH + 20)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    leftWidth: totalWidth,
    rightWidth: totalWidth,
    totalWidth,
  }
}

/**
 * Calculates optimal left panel width based on content
 */
// calculateOptimalLeftWidth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateOptimalLeftWidth(
  welcomeMessage: string,
  truncatedCwd: string,
  modelLine: string,
): number {
  // contentWidth保存`Math.max`，供共享工具后续处理使用。
  const contentWidth = Math.max(
    stringWidth(welcomeMessage),
    stringWidth(truncatedCwd),
    stringWidth(modelLine),
    20, // Minimum for clawd art
  )
  // 返回 `Math.min(contentWidth + 4, MAX_LEFT_WIDTH) // +4 for padding`，作为共享工具这次计算的结果。
  return Math.min(contentWidth + 4, MAX_LEFT_WIDTH) // +4 for padding
}

/**
 * Formats the welcome message based on username
 */
// formatWelcomeMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatWelcomeMessage(username: string | null): string {
  // 只有 `!username || username.length > MAX_USERNAME_LENGTH` 满足时，共享工具才执行该分支。
  if (!username || username.length > MAX_USERNAME_LENGTH) {
    // 返回 `'Welcome back!'`，作为共享工具这次计算的结果。
    return 'Welcome back!'
  }
  // 返回 ``Welcome back ${username}!``，作为共享工具这次计算的结果。
  return `Welcome back ${username}!`
}

/**
 * Truncates a path in the middle if it's too long.
 * Width-aware: uses stringWidth() for correct CJK/emoji measurement.
 */
// truncatePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncatePath(path: string, maxLength: number): string {
  // 满足 `stringWidth(path) <= maxLength` 时，共享工具执行该分支。
  if (stringWidth(path) <= maxLength) return path

  // separator固定为 `'/'`，作为共享工具 logo V2 Utils后续展示或比较的基准。
  const separator = '/'
  // ellipsis 集合 命名 `'…'`，让后续代码直接表达这个值的用途。
  const ellipsis = '…'
  // ellipsisWidth保存`1 // '…' is always 1 column`，供共享工具 logo V2 Utils后续判断或输出使用。
  const ellipsisWidth = 1 // '…' is always 1 column
  // separatorWidth保存`1`，供共享工具 logo V2 Utils后续判断或输出使用。
  const separatorWidth = 1

  // 片段列表格式化`path.split`，供共享工具后续处理使用。
  const parts = path.split(separator)
  // first标记共享工具 logo V2 Utils是否启用对应路径。
  const first = parts[0] || ''
  // last标记共享工具 logo V2 Utils是否启用对应路径。
  const last = parts[parts.length - 1] || ''
  // firstWidth保存`stringWidth`，供共享工具后续处理使用。
  const firstWidth = stringWidth(first)
  // lastWidth保存`stringWidth`，供共享工具后续处理使用。
  const lastWidth = stringWidth(last)

  // Only one part, so show as much of it as we can
  // 满足 `parts.length === 1` 时，共享工具执行该分支。
  if (parts.length === 1) {
    // 返回 `truncateToWidth(path, maxLength)`，作为共享工具这次计算的结果。
    return truncateToWidth(path, maxLength)
  }

  // We don't have enough space to show the last part, so truncate it
  // But since firstPart is empty (unix) we don't want the extra ellipsis
  // 只有 `first === '' && ellipsisWidth + separatorWidth +` 满足时，共享工具才执行该分支。
  if (first === '' && ellipsisWidth + separatorWidth + lastWidth >= maxLength) {
    // 返回 ``${separator}${truncateToWidth(last, Math.max(1, maxLength - separatorW...`，作为共享工具这次计算的结果。
    return `${separator}${truncateToWidth(last, Math.max(1, maxLength - separatorWidth))}`
  }

  // We have a first part so let's show the ellipsis and truncate last part
  // 共享工具在这里按实际状态进入对应分支。
  if (
    first !== '' &&
    ellipsisWidth * 2 + separatorWidth + lastWidth >= maxLength
  ) {
    // 返回 ``${ellipsis}${separator}${truncateToWidth(last, Math.max(1, maxLength -...`，作为共享工具这次计算的结果。
    return `${ellipsis}${separator}${truncateToWidth(last, Math.max(1, maxLength - ellipsisWidth - separatorWidth))}`
  }

  // Truncate first and leave last
  // 满足 `parts.length === 2` 时，共享工具执行该分支。
  if (parts.length === 2) {
    // availableForFirst 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const availableForFirst =
      maxLength - ellipsisWidth - separatorWidth - lastWidth
    // 返回 ``${truncateToWidthNoEllipsis(first, availableForFirst)}${ellipsis}${sep...`，作为共享工具这次计算的结果。
    return `${truncateToWidthNoEllipsis(first, availableForFirst)}${ellipsis}${separator}${last}`
  }

  // Now we start removing middle parts

  // available 先占位，稍后的条件分支会根据实际输入补齐它。
  let available =
    maxLength - firstWidth - lastWidth - ellipsisWidth - 2 * separatorWidth

  // Just the first and last are too long, so truncate first
  // 满足 `available <= 0` 时，共享工具执行该分支。
  if (available <= 0) {
    // availableForFirst保存`Math.max`，供共享工具后续处理使用。
    const availableForFirst = Math.max(
      0,
      maxLength - lastWidth - ellipsisWidth - 2 * separatorWidth,
    )
    // truncatedFirst保存`truncateToWidthNoEllipsis`，供共享工具后续处理使用。
    const truncatedFirst = truncateToWidthNoEllipsis(first, availableForFirst)
    // 返回 ``${truncatedFirst}${separator}${ellipsis}${separator}${last}``，作为共享工具这次计算的结果。
    return `${truncatedFirst}${separator}${ellipsis}${separator}${last}`
  }

  // Try to keep as many middle parts as possible
  // middleParts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const middleParts = []
  // 循环处理 `let i = parts.length - 2; i > 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = parts.length - 2; i > 0; i--) {
    // part 命名 `parts[i]`，让后续代码直接表达这个值的用途。
    const part = parts[i]
    // 只有 `part && stringWidth(part) + separatorWidth <= available` 满足时，共享工具才执行该分支。
    if (part && stringWidth(part) + separatorWidth <= available) {
      // 调用 middleParts.unshift，触发共享工具此处需要的副作用。
      middleParts.unshift(part)
      // 共享工具 logo V2 Utils在这里处理 `available -= stringWidth(part) + separatorWidth`，完成这一小步状态转换。
      available -= stringWidth(part) + separatorWidth
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // middleParts 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (middleParts.length === 0) {
    // 返回 ``${first}${separator}${ellipsis}${separator}${last}``，作为共享工具这次计算的结果。
    return `${first}${separator}${ellipsis}${separator}${last}`
  }

  // 返回 ``${first}${separator}${ellipsis}${separator}${middleParts.join(separato...`，作为共享工具这次计算的结果。
  return `${first}${separator}${ellipsis}${separator}${middleParts.join(separator)}${separator}${last}`
}

// Simple cache for preloaded activity
// cachedActivity 缓存 从空数组开始收集，后续循环会按处理顺序追加条目。
let cachedActivity: LogOption[] = []
// cachePromise 异步任务保存`null`，作为后续空值处理的输入。
let cachePromise: Promise<LogOption[]> | null = null

/**
 * Preloads recent conversations for display in Logo v2
 */
// getRecentActivity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getRecentActivity(): Promise<LogOption[]> {
  // Return existing promise if already loading
  // 满足 `cachePromise` 时，共享工具执行该分支。
  if (cachePromise) {
    // 返回 `cachePromise`，作为共享工具这次计算的结果。
    return cachePromise
  }

  // currentSessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const currentSessionId = getSessionId()
  // cachePromise 异步任务更新为 `loadMessageLogs(10)`，确保共享工具后续读取最新状态。
  cachePromise = loadMessageLogs(10)
    // 链式调用 then，继续加工上一行在共享工具中产生的数据。
    .then(logs => {
      // cachedActivity 缓存更新为 `logs`，确保共享工具后续读取最新状态。
      cachedActivity = logs
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(log => {
          // 满足 `log.isSidechain` 时，共享工具执行该分支。
          if (log.isSidechain) return false
          // 满足 `log.sessionId === currentSessionId` 时，共享工具执行该分支。
          if (log.sessionId === currentSessionId) return false
          // 满足 `log.summary?.includes('I apologize')` 时，共享工具执行该分支。
          if (log.summary?.includes('I apologize')) return false

          // Filter out sessions where both summary and firstPrompt are "No prompt" or missing
          // hasSummary标记共享工具 logo V2 Utils是否启用对应路径。
          const hasSummary = log.summary && log.summary !== 'No prompt'
          // hasFirstPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const hasFirstPrompt =
            log.firstPrompt && log.firstPrompt !== 'No prompt'
          // 返回 `hasSummary || hasFirstPrompt`，作为共享工具这次计算的结果。
          return hasSummary || hasFirstPrompt
        })
        .slice(0, 3)
      // 返回 `cachedActivity`，作为共享工具这次计算的结果。
      return cachedActivity
    })
    // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
    .catch(() => {
      // cachedActivity 缓存更新为 `[]`，确保共享工具后续读取最新状态。
      cachedActivity = []
      // 返回 `cachedActivity`，作为共享工具这次计算的结果。
      return cachedActivity
    })

  // 返回 `cachePromise`，作为共享工具这次计算的结果。
  return cachePromise
}

/**
 * Gets cached activity synchronously
 */
// getRecentActivitySync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRecentActivitySync(): LogOption[] {
  // 返回 `cachedActivity`，作为共享工具这次计算的结果。
  return cachedActivity
}

/**
 * Formats release notes for display, with smart truncation
 */
// formatReleaseNoteForDisplay 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatReleaseNoteForDisplay(
  note: string,
  maxWidth: number,
): string {
  // Simply truncate at the max width, same as Recent Activity descriptions
  // 返回 `truncate(note, maxWidth)`，作为共享工具这次计算的结果。
  return truncate(note, maxWidth)
}

/**
 * Gets the common logo display data used by both LogoV2 and CondensedLogo
 */
// getLogoDisplayData 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLogoDisplayData(): {
  version: string
  cwd: string
  billingType: string
  agentName: string | undefined
} {
  // version 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const version = process.env.DEMO_VERSION ?? MACRO.VERSION
  // serverUrl读取`getDirectConnectServerUrl`，供共享工具后续处理使用。
  const serverUrl = getDirectConnectServerUrl()
  // displayPath 路径数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const displayPath = process.env.DEMO_VERSION
    ? '/code/claude'
    : getDisplayPath(getCwd())
  // cwd保存`serverUrl`，供后续判断或组装使用。
  const cwd = serverUrl
    ? `${displayPath} in ${serverUrl.replace(/^https?:\/\//, '')}`
    : displayPath
  // billingType保存`isClaudeAISubscriber`，供共享工具后续处理使用。
  const billingType = isClaudeAISubscriber()
    ? getSubscriptionName()
    : 'API Usage Billing'
  // agentName读取`getInitialSettings`，供共享工具后续处理使用。
  const agentName = getInitialSettings().agent

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    version,
    cwd,
    billingType,
    agentName,
  }
}

/**
 * Determines how to display model and billing information based on available width
 */
// formatModelAndBilling 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatModelAndBilling(
  modelName: string,
  billingType: string,
  availableWidth: number,
): {
  shouldSplit: boolean
  truncatedModel: string
  truncatedBilling: string
} {
  // separator保存`' · '`，作为后续固定文本处理的输入。
  const separator = ' · '
  // combinedWidth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const combinedWidth =
    stringWidth(modelName) + separator.length + stringWidth(billingType)
  // shouldSplit标记共享工具 logo V2 Utils是否启用对应路径。
  const shouldSplit = combinedWidth > availableWidth

  // 满足 `shouldSplit` 时，共享工具执行该分支。
  if (shouldSplit) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      shouldSplit: true,
      truncatedModel: truncate(modelName, availableWidth),
      truncatedBilling: truncate(billingType, availableWidth),
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    shouldSplit: false,
    truncatedModel: truncate(
      modelName,
      Math.max(
        availableWidth - stringWidth(billingType) - separator.length,
        10,
      ),
    ),
    truncatedBilling: billingType,
  }
}

/**
 * Gets recent release notes for Logo v2 display
 * For ants, uses commits bundled at build time
 * For external users, uses public changelog
 */
// getRecentReleaseNotesSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRecentReleaseNotesSync(maxItems: number): string[] {
  // For ants, use bundled changelog
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // changelog保存`MACRO.VERSION_CHANGELOG`，供共享工具 logo V2 Utils后续判断或输出使用。
    const changelog = MACRO.VERSION_CHANGELOG
    // 满足 `changelog` 时，共享工具执行该分支。
    if (changelog) {
      // commits 集合格式化`changelog.trim`，供共享工具后续处理使用。
      const commits = changelog.trim().split('\n').filter(Boolean)
      // 返回 `commits.slice(0, maxItems)`，作为共享工具这次计算的结果。
      return commits.slice(0, maxItems)
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // changelog读取`getStoredChangelogFromMemory`，供共享工具后续处理使用。
  const changelog = getStoredChangelogFromMemory()
  // changelog缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!changelog) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // parsed 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let parsed
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `parseChangelog(changelog)`，确保共享工具后续读取最新状态。
    parsed = parseChangelog(changelog)
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Get notes from recent versions
  // allNotes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allNotes: string[] = []
  // versions 集合派生`Object.keys`，供共享工具后续处理使用。
  const versions = Object.keys(parsed)
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => (gt(a, b) ? -1 : 1))
    .slice(0, 3) // Look at top 3 recent versions

  // 按顺序遍历 `versions` 中的version，逐个交给共享工具处理。
  for (const version of versions) {
    // notes 集合解析`parsed[version]` 整理出中间结果，供共享工具 logo V2 Utils后续步骤使用。
    const notes = parsed[version]
    // 满足 `notes` 时，共享工具执行该分支。
    if (notes) {
      // allNotes 集合追加新条目，保持收集顺序与输入顺序一致。
      allNotes.push(...notes)
    }
  }

  // Return raw notes without filtering or premature truncation
  // 返回 `allNotes.slice(0, maxItems)`，作为共享工具这次计算的结果。
  return allNotes.slice(0, maxItems)
}
