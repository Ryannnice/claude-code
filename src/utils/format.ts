// Pure display formatters — leaf-safe (no Ink). Width-aware truncation lives in ./truncate.ts.

// 引入 getRelativeTimeFormat、getTimeZone，将 ./intl.js 中已经封装好的能力接到本文件流程里。
import { getRelativeTimeFormat, getTimeZone } from './intl.js'

/**
 * Formats a byte count to a human-readable string (KB, MB, GB).
 * @example formatFileSize(1536) → "1.5KB"
 */
// formatFileSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatFileSize(sizeInBytes: number): string {
  // kb统计`sizeInBytes / 1024`，供后续判断或组装使用。
  const kb = sizeInBytes / 1024
  // 满足 `kb < 1` 时，共享工具执行该分支。
  if (kb < 1) {
    // 返回 ``${sizeInBytes} bytes``，作为共享工具这次计算的结果。
    return `${sizeInBytes} bytes`
  }
  // 满足 `kb < 1024` 时，共享工具执行该分支。
  if (kb < 1024) {
    // 返回 ``${kb.toFixed(1).replace(/\.0$/, '')}KB``，作为共享工具这次计算的结果。
    return `${kb.toFixed(1).replace(/\.0$/, '')}KB`
  }
  // mb保存`kb / 1024`，供后续判断或组装使用。
  const mb = kb / 1024
  // 满足 `mb < 1024` 时，共享工具执行该分支。
  if (mb < 1024) {
    // 返回 ``${mb.toFixed(1).replace(/\.0$/, '')}MB``，作为共享工具这次计算的结果。
    return `${mb.toFixed(1).replace(/\.0$/, '')}MB`
  }
  // gb 命名 `mb / 1024`，让后续代码直接表达这个值的用途。
  const gb = mb / 1024
  // 返回 ``${gb.toFixed(1).replace(/\.0$/, '')}GB``，作为共享工具这次计算的结果。
  return `${gb.toFixed(1).replace(/\.0$/, '')}GB`
}

/**
 * Formats milliseconds as seconds with 1 decimal place (e.g. `1234` → `"1.2s"`).
 * Unlike formatDuration, always keeps the decimal — use for sub-minute timings
 * where the fractional second is meaningful (TTFT, hook durations, etc.).
 */
// formatSecondsShort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatSecondsShort(ms: number): string {
  // 返回 ``${(ms / 1000).toFixed(1)}s``，作为共享工具这次计算的结果。
  return `${(ms / 1000).toFixed(1)}s`
}

// formatDuration 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDuration(
  ms: number,
  options?: { hideTrailingZeros?: boolean; mostSignificantOnly?: boolean },
): string {
  // 满足 `ms < 60000` 时，共享工具执行该分支。
  if (ms < 60000) {
    // Special case for 0
    // 满足 `ms === 0` 时，共享工具执行该分支。
    if (ms === 0) {
      // 返回 `'0s'`，作为共享工具这次计算的结果。
      return '0s'
    }
    // For durations < 1s, show 1 decimal place (e.g., 0.5s)
    // 满足 `ms < 1` 时，共享工具执行该分支。
    if (ms < 1) {
      // s 集合保存`toFixed`，供共享工具后续处理使用。
      const s = (ms / 1000).toFixed(1)
      // 返回 ``${s}s``，作为共享工具这次计算的结果。
      return `${s}s`
    }
    // s 集合保存`Math.floor`，供共享工具后续处理使用。
    const s = Math.floor(ms / 1000).toString()
    // 返回 ``${s}s``，作为共享工具这次计算的结果。
    return `${s}s`
  }

  // days 集合保存`Math.floor`，供共享工具后续处理使用。
  let days = Math.floor(ms / 86400000)
  // hours 集合保存`Math.floor`，供共享工具后续处理使用。
  let hours = Math.floor((ms % 86400000) / 3600000)
  // minutes 集合保存`Math.floor`，供共享工具后续处理使用。
  let minutes = Math.floor((ms % 3600000) / 60000)
  // seconds 集合保存`Math.round`，供共享工具后续处理使用。
  let seconds = Math.round((ms % 60000) / 1000)

  // Handle rounding carry-over (e.g., 59.5s rounds to 60s)
  // 满足 `seconds === 60` 时，共享工具执行该分支。
  if (seconds === 60) {
    // seconds 集合更新为 `0`，确保共享工具后续读取最新状态。
    seconds = 0
    // 共享工具 format在这里处理 `minutes++`，完成这一小步状态转换。
    minutes++
  }
  // 满足 `minutes === 60` 时，共享工具执行该分支。
  if (minutes === 60) {
    // minutes 集合更新为 `0`，确保共享工具后续读取最新状态。
    minutes = 0
    // 共享工具 format在这里处理 `hours++`，完成这一小步状态转换。
    hours++
  }
  // 满足 `hours === 24` 时，共享工具执行该分支。
  if (hours === 24) {
    // hours 集合更新为 `0`，确保共享工具后续读取最新状态。
    hours = 0
    // 共享工具 format在这里处理 `days++`，完成这一小步状态转换。
    days++
  }

  // hide 命名 `options?.hideTrailingZeros`，让后续代码直接表达这个值的用途。
  const hide = options?.hideTrailingZeros

  // 满足 `options?.mostSignificantOnly` 时，共享工具执行该分支。
  if (options?.mostSignificantOnly) {
    // 满足 `days > 0` 时，共享工具执行该分支。
    if (days > 0) return `${days}d`
    // 满足 `hours > 0` 时，共享工具执行该分支。
    if (hours > 0) return `${hours}h`
    // 满足 `minutes > 0` 时，共享工具执行该分支。
    if (minutes > 0) return `${minutes}m`
    // 返回 ``${seconds}s``，作为共享工具这次计算的结果。
    return `${seconds}s`
  }

  // 满足 `days > 0` 时，共享工具执行该分支。
  if (days > 0) {
    // 只有 `hide && hours === 0 && minutes === 0` 满足时，共享工具才执行该分支。
    if (hide && hours === 0 && minutes === 0) return `${days}d`
    // 只有 `hide && minutes === 0` 满足时，共享工具才执行该分支。
    if (hide && minutes === 0) return `${days}d ${hours}h`
    // 返回 ``${days}d ${hours}h ${minutes}m``，作为共享工具这次计算的结果。
    return `${days}d ${hours}h ${minutes}m`
  }
  // 满足 `hours > 0` 时，共享工具执行该分支。
  if (hours > 0) {
    // 只有 `hide && minutes === 0 && seconds === 0` 满足时，共享工具才执行该分支。
    if (hide && minutes === 0 && seconds === 0) return `${hours}h`
    // 只有 `hide && seconds === 0` 满足时，共享工具才执行该分支。
    if (hide && seconds === 0) return `${hours}h ${minutes}m`
    // 返回 ``${hours}h ${minutes}m ${seconds}s``，作为共享工具这次计算的结果。
    return `${hours}h ${minutes}m ${seconds}s`
  }
  // 满足 `minutes > 0` 时，共享工具执行该分支。
  if (minutes > 0) {
    // 只有 `hide && seconds === 0` 满足时，共享工具才执行该分支。
    if (hide && seconds === 0) return `${minutes}m`
    // 返回 ``${minutes}m ${seconds}s``，作为共享工具这次计算的结果。
    return `${minutes}m ${seconds}s`
  }
  // 返回 ``${seconds}s``，作为共享工具这次计算的结果。
  return `${seconds}s`
}

// `new Intl.NumberFormat` is expensive, so cache formatters for reuse
// numberFormatterForConsistentDecimals 集合初始化为空值，后续分支会在有数据时补齐。
let numberFormatterForConsistentDecimals: Intl.NumberFormat | null = null
// numberFormatterForInconsistentDecimals 集合初始化为空值，后续分支会在有数据时补齐。
let numberFormatterForInconsistentDecimals: Intl.NumberFormat | null = null
// getNumberFormatter保存`(`，供共享工具 format后续判断或输出使用。
const getNumberFormatter = (
  useConsistentDecimals: boolean,
): Intl.NumberFormat => {
  // 满足 `useConsistentDecimals` 时，共享工具执行该分支。
  if (useConsistentDecimals) {
    // numberFormatterForConsistentDecimals 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!numberFormatterForConsistentDecimals) {
      // numberFormatterForConsistentDecimals 集合更新为 `new Intl.NumberFormat('en-US', {`，确保共享工具后续读取最新状态。
      numberFormatterForConsistentDecimals = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })
    }
    // 返回 `numberFormatterForConsistentDecimals`，作为共享工具这次计算的结果。
    return numberFormatterForConsistentDecimals
  } else {
    // numberFormatterForInconsistentDecimals 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!numberFormatterForInconsistentDecimals) {
      // numberFormatterForInconsistentDecimals 集合更新为 `new Intl.NumberFormat('en-US', {`，确保共享工具后续读取最新状态。
      numberFormatterForInconsistentDecimals = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
      })
    }
    // 返回 `numberFormatterForInconsistentDecimals`，作为共享工具这次计算的结果。
    return numberFormatterForInconsistentDecimals
  }
}

// formatNumber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatNumber(number: number): string {
  // Only use minimumFractionDigits for numbers that will be shown in compact notation
  // shouldUseConsistentDecimals 集合标记共享工具 format是否启用对应路径。
  const shouldUseConsistentDecimals = number >= 1000

  // 返回 `getNumberFormatter(shouldUseConsistentDecimals)`，作为共享工具这次计算的结果。
  return getNumberFormatter(shouldUseConsistentDecimals)
    .format(number) // eg. "1321" => "1.3K", "900" => "900"
    .toLowerCase() // eg. "1.3K" => "1.3k", "1.0K" => "1.0k"
}

// formatTokens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTokens(count: number): string {
  // 返回 `formatNumber(count).replace('.0', '')`，作为共享工具这次计算的结果。
  return formatNumber(count).replace('.0', '')
}

// RelativeTimeStyle 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RelativeTimeStyle = 'long' | 'short' | 'narrow'

// RelativeTimeOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RelativeTimeOptions = {
  style?: RelativeTimeStyle
  numeric?: 'always' | 'auto'
}

// formatRelativeTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatRelativeTime(
  date: Date,
  options: RelativeTimeOptions & { now?: Date } = {},
): string {
  // 从 `options` 解构 style = 'narrow'、numeric = 'always'、now = new Date()，减少共享工具 format对同一对象的重复访问。
  const { style = 'narrow', numeric = 'always', now = new Date() } = options
  // diffInMs 集合读取`date.getTime`，供共享工具后续处理使用。
  const diffInMs = date.getTime() - now.getTime()
  // Use Math.trunc to truncate towards zero for both positive and negative values
  // diffInSeconds 集合保存`Math.trunc`，供共享工具后续处理使用。
  const diffInSeconds = Math.trunc(diffInMs / 1000)

  // Define time intervals with custom short units
  // intervals 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const intervals = [
    { unit: 'year', seconds: 31536000, shortUnit: 'y' },
    { unit: 'month', seconds: 2592000, shortUnit: 'mo' },
    { unit: 'week', seconds: 604800, shortUnit: 'w' },
    { unit: 'day', seconds: 86400, shortUnit: 'd' },
    { unit: 'hour', seconds: 3600, shortUnit: 'h' },
    { unit: 'minute', seconds: 60, shortUnit: 'm' },
    { unit: 'second', seconds: 1, shortUnit: 's' },
  ] as const

  // Find the appropriate unit
  // 循环处理 `const { unit, seconds: intervalSeconds, shortUnit`，让共享工具逐项把同类条目按顺序走完。
  for (const { unit, seconds: intervalSeconds, shortUnit } of intervals) {
    // 满足 `Math.abs(diffInSeconds) >= intervalSeconds` 时，共享工具执行该分支。
    if (Math.abs(diffInSeconds) >= intervalSeconds) {
      // 取值保存`Math.trunc`，供共享工具后续处理使用。
      const value = Math.trunc(diffInSeconds / intervalSeconds)
      // For short style, use custom format
      // 当 `style` 匹配 `'narrow'` 时，共享工具执行对应分支。
      if (style === 'narrow') {
        // 返回 `diffInSeconds < 0`，作为共享工具这次计算的结果。
        return diffInSeconds < 0
          ? `${Math.abs(value)}${shortUnit} ago`
          : `in ${value}${shortUnit}`
      }
      // For days and longer, use long style regardless of the style parameter
      // 返回 `getRelativeTimeFormat('long', numeric).format(value, unit)`，作为共享工具这次计算的结果。
      return getRelativeTimeFormat('long', numeric).format(value, unit)
    }
  }

  // For values less than 1 second
  // 当 `style` 匹配 `'narrow'` 时，共享工具执行对应分支。
  if (style === 'narrow') {
    // 返回 `diffInSeconds <= 0 ? '0s ago' : 'in 0s'`，作为共享工具这次计算的结果。
    return diffInSeconds <= 0 ? '0s ago' : 'in 0s'
  }
  // 返回 `getRelativeTimeFormat(style, numeric).format(0, 'second')`，作为共享工具这次计算的结果。
  return getRelativeTimeFormat(style, numeric).format(0, 'second')
}

// formatRelativeTimeAgo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatRelativeTimeAgo(
  date: Date,
  options: RelativeTimeOptions & { now?: Date } = {},
): string {
  // 从 `options` 解构 now = new Date()、其余 restOptions，减少共享工具 format对同一对象的重复访问。
  const { now = new Date(), ...restOptions } = options
  // 满足 `date > now` 时，共享工具执行该分支。
  if (date > now) {
    // For future dates, just return the relative time without "ago"
    // 返回 `formatRelativeTime(date, { ...restOptions, now })`，作为共享工具这次计算的结果。
    return formatRelativeTime(date, { ...restOptions, now })
  }

  // For past dates, force numeric: 'always' to ensure we get "X units ago"
  // 返回 `formatRelativeTime(date, { ...restOptions, numeric: 'always', now })`，作为共享工具这次计算的结果。
  return formatRelativeTime(date, { ...restOptions, numeric: 'always', now })
}

/**
 * Formats log metadata for display (time, size or message count, branch, tag, PR)
 */
// formatLogMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatLogMetadata(log: {
  modified: Date
  messageCount: number
  fileSize?: number
  gitBranch?: string
  tag?: string
  agentSetting?: string
  prNumber?: number
  prRepository?: string
}): string {
  // sizeOrCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sizeOrCount =
    log.fileSize !== undefined
      ? formatFileSize(log.fileSize)
      : `${log.messageCount} messages`
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [
    formatRelativeTimeAgo(log.modified, { style: 'short' }),
    ...(log.gitBranch ? [log.gitBranch] : []),
    sizeOrCount,
  ]
  // 满足 `log.tag` 时，共享工具执行该分支。
  if (log.tag) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`#${log.tag}`)
  }
  // 满足 `log.agentSetting` 时，共享工具执行该分支。
  if (log.agentSetting) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`@${log.agentSetting}`)
  }
  // 满足 `log.prNumber` 时，共享工具执行该分支。
  if (log.prNumber) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      log.prRepository
        ? `${log.prRepository}#${log.prNumber}`
        : `#${log.prNumber}`,
    )
  }
  // 返回 `parts.join(' · ')`，作为共享工具这次计算的结果。
  return parts.join(' · ')
}

// formatResetTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatResetTime(
  timestampInSeconds: number | undefined,
  showTimezone: boolean = false,
  showTime: boolean = true,
): string | undefined {
  // timestampInSeconds 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!timestampInSeconds) return undefined

  // date记录时间`Date`，供共享工具后续处理使用。
  const date = new Date(timestampInSeconds * 1000)
  // now记录时间`Date`，供共享工具后续处理使用。
  const now = new Date()
  // minutes 集合读取`date.getMinutes`，供共享工具后续处理使用。
  const minutes = date.getMinutes()

  // Calculate hours until reset
  // hoursUntilReset读取`date.getTime`，供共享工具后续处理使用。
  const hoursUntilReset = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

  // If reset is more than 24 hours away, show the date as well
  // 满足 `hoursUntilReset > 24` 时，共享工具执行该分支。
  if (hoursUntilReset > 24) {
    // Show date and time for resets more than a day away
    // dateOptions 集合 集中保存共享工具 format要一起传递的字段。
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: showTime ? 'numeric' : undefined,
      minute: !showTime || minutes === 0 ? undefined : '2-digit',
      hour12: showTime ? true : undefined,
    }

    // Add year if it's not the current year
    // `date.getFullYear()` 与 `now.getFullYear()` 不一致时刷新派生状态，避免使用过期结果。
    if (date.getFullYear() !== now.getFullYear()) {
      // year更新为 `'numeric'`，确保共享工具后续读取最新状态。
      dateOptions.year = 'numeric'
    }

    // dateString保存`date.toLocaleString`，供共享工具后续处理使用。
    const dateString = date.toLocaleString('en-US', dateOptions)

    // Remove the space before AM/PM and make it lowercase
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      // 调用 dateString.replace，触发共享工具此处需要的副作用。
      dateString.replace(/ ([AP]M)/i, (_match, ampm) => ampm.toLowerCase()) +
      (showTimezone ? ` (${getTimeZone()})` : '')
    )
  }

  // For resets within 24 hours, show just the time (existing behavior)
  // timeString保存`date.toLocaleTimeString`，供共享工具后续处理使用。
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true,
  })

  // Remove the space before AM/PM and make it lowercase, then add timezone
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    // 调用 timeString.replace，触发共享工具此处需要的副作用。
    timeString.replace(/ ([AP]M)/i, (_match, ampm) => ampm.toLowerCase()) +
    (showTimezone ? ` (${getTimeZone()})` : '')
  )
}

// formatResetText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatResetText(
  resetsAt: string,
  showTimezone: boolean = false,
  showTime: boolean = true,
): string {
  // dt记录时间`Date`，供共享工具后续处理使用。
  const dt = new Date(resetsAt)
  // 返回 ``${formatResetTime(Math.floor(dt.getTime() / 1000), showTimezone, showT...`，作为共享工具这次计算的结果。
  return `${formatResetTime(Math.floor(dt.getTime() / 1000), showTimezone, showTime)}`
}

// Back-compat: truncate helpers moved to ./truncate.ts (needs ink/stringWidth)
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export {
  truncate,
  truncatePathMiddle,
  truncateStartToWidth,
  truncateToWidth,
  truncateToWidthNoEllipsis,
  wrapText,
} from './truncate.js'
