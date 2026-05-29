// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 类型依赖 { DailyActivity } 来自 ./stats.js，用于校准共享工具的数据契约。
import type { DailyActivity } from './stats.js'
// 引入 toDateString，将 ./statsCache.js 中已经封装好的能力接到本文件流程里。
import { toDateString } from './statsCache.js'

// HeatmapOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HeatmapOptions = {
  terminalWidth?: number // Terminal width in characters
  showMonthLabels?: boolean
}

// Percentiles 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Percentiles = {
  p25: number
  p50: number
  p75: number
}

/**
 * Pre-calculates percentiles from activity data for use in intensity calculations
 */
// calculatePercentiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function calculatePercentiles(
  dailyActivity: DailyActivity[],
): Percentiles | null {
  // counts 数量保存`dailyActivity`，供共享工具 heatmap后续判断或输出使用。
  const counts = dailyActivity
    .map(a => a.messageCount)
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(c => c > 0)
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a - b)

  // counts 数量为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (counts.length === 0) return null

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    p25: counts[Math.floor(counts.length * 0.25)]!,
    p50: counts[Math.floor(counts.length * 0.5)]!,
    p75: counts[Math.floor(counts.length * 0.75)]!,
  }
}

/**
 * Generates a GitHub-style activity heatmap for the terminal
 */
// generateHeatmap 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateHeatmap(
  dailyActivity: DailyActivity[],
  options: HeatmapOptions = {},
): string {
  // 从 `options` 解构 terminalWidth = 80、showMonthLabels = true，减少共享工具 heatmap对同一对象的重复访问。
  const { terminalWidth = 80, showMonthLabels = true } = options

  // Day labels take 4 characters ("Mon "), calculate weeks that fit
  // Cap at 52 weeks (1 year) to match GitHub style
  // dayLabelWidth 命名 `4`，让后续代码直接表达这个值的用途。
  const dayLabelWidth = 4
  // availableWidth保存`terminalWidth - dayLabelWidth`，供共享工具 heatmap后续判断或输出使用。
  const availableWidth = terminalWidth - dayLabelWidth
  // width保存`Math.min`，供共享工具后续处理使用。
  const width = Math.min(52, Math.max(10, availableWidth))

  // Build activity map by date
  // activityMap构建`new Map<string, DailyActivity>()` 整理出中间结果，供共享工具 heatmap后续步骤使用。
  const activityMap = new Map<string, DailyActivity>()
  // 按顺序遍历 `dailyActivity` 中的activity，逐个交给共享工具处理。
  for (const activity of dailyActivity) {
    // activityMap.set 写入新的状态值，使共享工具后续读取保持一致。
    activityMap.set(activity.date, activity)
  }

  // Pre-calculate percentiles once for all intensity lookups
  // percentiles 集合保存`calculatePercentiles`，供共享工具后续处理使用。
  const percentiles = calculatePercentiles(dailyActivity)

  // Calculate date range - end at today, go back N weeks
  // today记录时间`Date`，供共享工具后续处理使用。
  const today = new Date()
  // today.setHours 写入新的状态值，使共享工具后续读取保持一致。
  today.setHours(0, 0, 0, 0)

  // Find the Sunday of the current week (start of the week containing today)
  // currentWeekStart记录时间`Date`，供共享工具后续处理使用。
  const currentWeekStart = new Date(today)
  // currentWeekStart.setDate 写入新的状态值，使共享工具后续读取保持一致。
  currentWeekStart.setDate(today.getDate() - today.getDay())

  // Go back (width - 1) weeks from the current week start
  // startDate记录时间`Date`，供共享工具后续处理使用。
  const startDate = new Date(currentWeekStart)
  // startDate.setDate 写入新的状态值，使共享工具后续读取保持一致。
  startDate.setDate(startDate.getDate() - (width - 1) * 7)

  // Generate grid (7 rows for days of week, width columns for weeks)
  // Also track which week each month starts for labels
  // 这个回调绑定到 const grid: string[][] = Array.from({ length: 7 }, () =>，负责共享工具在该局部场景下的响应。
  const grid: string[][] = Array.from({ length: 7 }, () =>
    Array(width).fill(''),
  )
  // monthStarts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const monthStarts: { month: number; week: number }[] = []
  // lastMonth保存`-1`，供共享工具 heatmap后续判断或输出使用。
  let lastMonth = -1

  // currentDate记录时间`Date`，供共享工具后续处理使用。
  const currentDate = new Date(startDate)
  // 按索引扫描 `width`，需要消费相邻参数时可以精确移动游标。
  for (let week = 0; week < width; week++) {
    // 按索引扫描 `7`，需要消费相邻参数时可以精确移动游标。
    for (let day = 0; day < 7; day++) {
      // Don't show future dates
      // 满足 `currentDate > today` 时，共享工具执行该分支。
      if (currentDate > today) {
        // 共享工具 heatmap在这里处理 `grid[day]![week] = ' '`，完成这一小步状态转换。
        grid[day]![week] = ' '
        // currentDate.setDate 写入新的状态值，使共享工具后续读取保持一致。
        currentDate.setDate(currentDate.getDate() + 1)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // dateStr记录时间`toDateString`，供共享工具后续处理使用。
      const dateStr = toDateString(currentDate)
      // activity读取`activityMap.get`，供共享工具后续处理使用。
      const activity = activityMap.get(dateStr)

      // Track month changes (on day 0 = Sunday of each week)
      // 满足 `day === 0` 时，共享工具执行该分支。
      if (day === 0) {
        // month读取`currentDate.getMonth`，供共享工具后续处理使用。
        const month = currentDate.getMonth()
        // `month` 与 `lastMonth` 不一致时刷新派生状态，避免使用过期结果。
        if (month !== lastMonth) {
          // monthStarts 集合追加新条目，保持收集顺序与输入顺序一致。
          monthStarts.push({ month, week })
          // lastMonth更新为 `month`，确保共享工具后续读取最新状态。
          lastMonth = month
        }
      }

      // Determine intensity level based on message count
      // intensity读取`getIntensity`，供共享工具后续处理使用。
      const intensity = getIntensity(activity?.messageCount || 0, percentiles)
      // 共享工具 heatmap在这里处理 `grid[day]![week] = getHeatmapChar(intensity)`，完成这一小步状态转换。
      grid[day]![week] = getHeatmapChar(intensity)

      // currentDate.setDate 写入新的状态值，使共享工具后续读取保持一致。
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  // Build output
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []

  // Month labels - evenly spaced across the grid
  // 满足 `showMonthLabels` 时，共享工具执行该分支。
  if (showMonthLabels) {
    // monthNames 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    // Build label line with fixed-width month labels
    // uniqueMonths 集合派生`monthStarts.map`，供共享工具后续处理使用。
    const uniqueMonths = monthStarts.map(m => m.month)
    // labelWidth保存`Math.floor`，供共享工具后续处理使用。
    const labelWidth = Math.floor(width / Math.max(uniqueMonths.length, 1))
    // monthLabels 集合保存`uniqueMonths`，供后续判断或组装使用。
    const monthLabels = uniqueMonths
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(month => monthNames[month]!.padEnd(labelWidth))
      .join('')

    // 4 spaces for day label column prefix
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push('    ' + monthLabels)
  }

  // Day labels
  // dayLabels 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Grid
  // 按索引扫描 `7`，需要消费相邻参数时可以精确移动游标。
  for (let day = 0; day < 7; day++) {
    // Only show labels for Mon, Wed, Fri
    // label筛选`includes`，供共享工具后续处理使用。
    const label = [1, 3, 5].includes(day) ? dayLabels[day]!.padEnd(3) : '   '
    // row格式化`join`，供共享工具后续处理使用。
    const row = label + ' ' + grid[day]!.join('')
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(row)
  }

  // Legend
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(
    '    Less ' +
      [
        claudeOrange('░'),
        claudeOrange('▒'),
        claudeOrange('▓'),
        claudeOrange('█'),
      ].join(' ') +
      ' More',
  )

  // 返回 `lines.join('\n')`，作为共享工具这次计算的结果。
  return lines.join('\n')
}

// getIntensity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getIntensity(
  messageCount: number,
  percentiles: Percentiles | null,
): number {
  // 只有 `messageCount === 0 || !percentiles` 满足时，共享工具才执行该分支。
  if (messageCount === 0 || !percentiles) return 0

  // 满足 `messageCount >= percentiles.p75` 时，共享工具执行该分支。
  if (messageCount >= percentiles.p75) return 4
  // 满足 `messageCount >= percentiles.p50` 时，共享工具执行该分支。
  if (messageCount >= percentiles.p50) return 3
  // 满足 `messageCount >= percentiles.p25` 时，共享工具执行该分支。
  if (messageCount >= percentiles.p25) return 2
  // 返回 `1`，作为共享工具这次计算的结果。
  return 1
}

// Claude orange color (hex #da7756)
// claudeOrange保存`chalk.hex`，供共享工具后续处理使用。
const claudeOrange = chalk.hex('#da7756')

// getHeatmapChar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHeatmapChar(intensity: number): string {
  // 按照 intensity 的取值选择共享工具的具体处理分支。
  switch (intensity) {
    case 0:
      // 返回 `chalk.gray('·')`，作为共享工具这次计算的结果。
      return chalk.gray('·')
    case 1:
      // 返回 `claudeOrange('░')`，作为共享工具这次计算的结果。
      return claudeOrange('░')
    case 2:
      // 返回 `claudeOrange('▒')`，作为共享工具这次计算的结果。
      return claudeOrange('▒')
    case 3:
      // 返回 `claudeOrange('▓')`，作为共享工具这次计算的结果。
      return claudeOrange('▓')
    case 4:
      // 返回 `claudeOrange('█')`，作为共享工具这次计算的结果。
      return claudeOrange('█')
    default:
      // 返回 `chalk.gray('·')`，作为共享工具这次计算的结果。
      return chalk.gray('·')
  }
}
