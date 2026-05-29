// Minimal cron expression parsing and next-run calculation.
//
// Supports the standard 5-field cron subset:
//   minute hour day-of-month month day-of-week
//
// Field syntax: wildcard, N, step (star-slash-N), range (N-M), list (N,M,...).
// No L, W, ?, or name aliases. All times are interpreted in the process's
// local timezone — "0 9 * * *" means 9am wherever the CLI is running.

// CronFields 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronFields = {
  minute: number[]
  hour: number[]
  dayOfMonth: number[]
  month: number[]
  dayOfWeek: number[]
}

// FieldRange 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FieldRange = { min: number; max: number }

// FIELD_RANGES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const FIELD_RANGES: FieldRange[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // dayOfMonth
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 }, // dayOfWeek (0=Sunday; 7 accepted as Sunday alias)
]

// Parse a single cron field into a sorted array of matching values.
// Supports: wildcard, N, star-slash-N (step), N-M (range), and comma-lists.
// Returns null if invalid.
// expandField 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function expandField(field: string, range: FieldRange): number[] | null {
  // 从 `range` 解构 min、max，减少共享工具 cron对同一对象的重复访问。
  const { min, max } = range
  // out构建`new Set<number>()`，供后续判断或组装使用。
  const out = new Set<number>()

  // 逐项读取 `field.split(',')` 中的part，按输入顺序推进共享工具。
  for (const part of field.split(',')) {
    // wildcard or star-slash-N
    // stepMatch匹配`part.match`，供共享工具后续处理使用。
    const stepMatch = part.match(/^\*(?:\/(\d+))?$/)
    // 满足 `stepMatch` 时，共享工具执行该分支。
    if (stepMatch) {
      // step解析`parseInt`，供共享工具后续处理使用。
      const step = stepMatch[1] ? parseInt(stepMatch[1], 10) : 1
      // 满足 `step < 1` 时，共享工具执行该分支。
      if (step < 1) return null
      // 循环处理 `let i = min; i <= max; i += step) out.add(i`，让共享工具把同类条目按顺序走完。
      for (let i = min; i <= max; i += step) out.add(i)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // N-M or N-M/S
    // rangeMatch匹配`part.match`，供共享工具后续处理使用。
    const rangeMatch = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/)
    // 满足 `rangeMatch` 时，共享工具执行该分支。
    if (rangeMatch) {
      // lo解析`parseInt`，供共享工具后续处理使用。
      const lo = parseInt(rangeMatch[1]!, 10)
      // hi解析`parseInt`，供共享工具后续处理使用。
      const hi = parseInt(rangeMatch[2]!, 10)
      // step解析`parseInt`，供共享工具后续处理使用。
      const step = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : 1
      // dayOfWeek: accept 7 as Sunday alias in ranges (e.g. 5-7 = Fri,Sat,Sun → [5,6,0])
      // isDow标记共享工具 cron是否启用对应路径。
      const isDow = min === 0 && max === 6
      // effMax 命名 `isDow ? 7 : max`，让后续代码直接表达这个值的用途。
      const effMax = isDow ? 7 : max
      // 只有 `lo > hi || step < 1 || lo < min || hi > effMax` 满足时，共享工具才执行该分支。
      if (lo > hi || step < 1 || lo < min || hi > effMax) return null
      // 循环处理 `let i = lo; i <= hi; i += step`，让共享工具逐项把同类条目按顺序走完。
      for (let i = lo; i <= hi; i += step) {
        // 调用 out.add，触发共享工具此处需要的副作用。
        out.add(isDow && i === 7 ? 0 : i)
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // plain N
    // singleMatch匹配`part.match`，供共享工具后续处理使用。
    const singleMatch = part.match(/^\d+$/)
    // 满足 `singleMatch` 时，共享工具执行该分支。
    if (singleMatch) {
      // n解析`parseInt`，供共享工具后续处理使用。
      let n = parseInt(part, 10)
      // dayOfWeek: accept 7 as Sunday alias → 0
      // 只有 `min === 0 && max === 6 && n === 7` 满足时，共享工具才执行该分支。
      if (min === 0 && max === 6 && n === 7) n = 0
      // 只有 `n < min || n > max` 满足时，共享工具才执行该分支。
      if (n < min || n > max) return null
      // 调用 out.add，触发共享工具此处需要的副作用。
      out.add(n)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 满足 `out.size === 0` 时，共享工具执行该分支。
  if (out.size === 0) return null
  // 返回 `Array.from(out).sort((a, b) => a - b)`，作为共享工具这次计算的结果。
  return Array.from(out).sort((a, b) => a - b)
}

/**
 * Parse a 5-field cron expression into expanded number arrays.
 * Returns null if invalid or unsupported syntax.
 */
// parseCronExpression 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseCronExpression(expr: string): CronFields | null {
  // 片段列表格式化`expr.trim`，供共享工具后续处理使用。
  const parts = expr.trim().split(/\s+/)
  // `parts.length` 与 `5` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 5) return null

  // expanded 从空数组开始收集，后续循环会按处理顺序追加条目。
  const expanded: number[][] = []
  // 按索引扫描 `5`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 5; i++) {
    // 结果保存`expandField`，供共享工具后续处理使用。
    const result = expandField(parts[i]!, FIELD_RANGES[i]!)
    // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result) return null
    // expanded追加新条目，保持收集顺序与输入顺序一致。
    expanded.push(result)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    minute: expanded[0]!,
    hour: expanded[1]!,
    dayOfMonth: expanded[2]!,
    month: expanded[3]!,
    dayOfWeek: expanded[4]!,
  }
}

/**
 * Compute the next Date strictly after `from` that matches the cron fields,
 * using the process's local timezone. Walks forward minute-by-minute. Bounded
 * at 366 days; returns null if no match (impossible for valid cron, but
 * satisfies the type).
 *
 * Standard cron semantics: when both dayOfMonth and dayOfWeek are constrained
 * (neither is the full range), a date matches if EITHER matches.
 *
 * DST: fixed-hour crons targeting a spring-forward gap (e.g. `30 2 * * *`
 * in a US timezone) skip the transition day — the gap hour never appears
 * in local time, so the hour-set check fails and the loop moves on.
 * Wildcard-hour crons (`30 * * * *`) fire at the first valid minute after
 * the gap. Fall-back repeats fire once (the step-forward logic jumps past
 * the second occurrence). This matches vixie-cron behavior.
 */
// computeNextCronRun 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeNextCronRun(
  fields: CronFields,
  from: Date,
): Date | null {
  // minuteSet保存`Set`，供共享工具后续处理使用。
  const minuteSet = new Set(fields.minute)
  // hourSet保存`Set`，供共享工具后续处理使用。
  const hourSet = new Set(fields.hour)
  // domSet保存`Set`，供共享工具后续处理使用。
  const domSet = new Set(fields.dayOfMonth)
  // monthSet保存`Set`，供共享工具后续处理使用。
  const monthSet = new Set(fields.month)
  // dowSet保存`Set`，供共享工具后续处理使用。
  const dowSet = new Set(fields.dayOfWeek)

  // Is the field wildcarded (full range)?
  // domWild标记共享工具 cron是否启用对应路径。
  const domWild = fields.dayOfMonth.length === 31
  // dowWild标记共享工具 cron是否启用对应路径。
  const dowWild = fields.dayOfWeek.length === 7

  // Round up to the next whole minute (strictly after `from`)
  // t记录时间`Date`，供共享工具后续处理使用。
  const t = new Date(from.getTime())
  // t.setSeconds 写入新的状态值，使共享工具后续读取保持一致。
  t.setSeconds(0, 0)
  // t.setMinutes 写入新的状态值，使共享工具后续读取保持一致。
  t.setMinutes(t.getMinutes() + 1)

  // maxIter保存`366 * 24 * 60`，供共享工具 cron后续判断或输出使用。
  const maxIter = 366 * 24 * 60
  // 按索引扫描 `maxIter`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < maxIter; i++) {
    // month读取`t.getMonth`，供共享工具后续处理使用。
    const month = t.getMonth() + 1
    // 满足 `!monthSet.has(month)` 时，共享工具执行该分支。
    if (!monthSet.has(month)) {
      // Jump to start of next month
      // t.setMonth 写入新的状态值，使共享工具后续读取保持一致。
      t.setMonth(t.getMonth() + 1, 1)
      // t.setHours 写入新的状态值，使共享工具后续读取保持一致。
      t.setHours(0, 0, 0, 0)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // dom读取`t.getDate`，供共享工具后续处理使用。
    const dom = t.getDate()
    // dow读取`t.getDay`，供共享工具后续处理使用。
    const dow = t.getDay()
    // When both dom/dow are constrained, either match is sufficient (OR semantics)
    // dayMatches 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const dayMatches =
      domWild && dowWild
        ? true
        : domWild
          ? dowSet.has(dow)
          : dowWild
            ? domSet.has(dom)
            : domSet.has(dom) || dowSet.has(dow)

    // dayMatches 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!dayMatches) {
      // Jump to start of next day
      // t.setDate 写入新的状态值，使共享工具后续读取保持一致。
      t.setDate(t.getDate() + 1)
      // t.setHours 写入新的状态值，使共享工具后续读取保持一致。
      t.setHours(0, 0, 0, 0)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 满足 `!hourSet.has(t.getHours())` 时，共享工具执行该分支。
    if (!hourSet.has(t.getHours())) {
      // t.setHours 写入新的状态值，使共享工具后续读取保持一致。
      t.setHours(t.getHours() + 1, 0, 0, 0)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 满足 `!minuteSet.has(t.getMinutes())` 时，共享工具执行该分支。
    if (!minuteSet.has(t.getMinutes())) {
      // t.setMinutes 写入新的状态值，使共享工具后续读取保持一致。
      t.setMinutes(t.getMinutes() + 1)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 返回 `t`，作为共享工具这次计算的结果。
    return t
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// --- cronToHuman ------------------------------------------------------------
// Intentionally narrow: covers common patterns; falls through to the raw cron
// string for anything else. The `utc` option exists for CCR remote triggers
// (agents-platform.tsx), which run on servers and always use UTC cron strings
// — that path translates UTC→local for display and needs midnight-crossing
// logic for the weekday case. Local scheduled tasks (the default) need neither.

// DAY_NAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// formatLocalTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatLocalTime(minute: number, hour: number): string {
  // January 1 — no DST gap anywhere. Using `new Date()` (today) would roll
  // 2am→3am on the one spring-forward day per year.
  // d记录时间`Date`，供共享工具后续处理使用。
  const d = new Date(2000, 0, 1, hour, minute)
  // 返回 `d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })`，作为共享工具这次计算的结果。
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// formatUtcTimeAsLocal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatUtcTimeAsLocal(minute: number, hour: number): string {
  // Create a date in UTC and format in user's local timezone
  // d记录时间`Date`，供共享工具后续处理使用。
  const d = new Date()
  // d.setUTCHours 写入新的状态值，使共享工具后续读取保持一致。
  d.setUTCHours(hour, minute, 0, 0)
  // 返回 `d.toLocaleTimeString('en-US', {`，作为共享工具这次计算的结果。
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// cronToHuman 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cronToHuman(cron: string, opts?: { utc?: boolean }): string {
  // utc保存`opts?.utc ?? false`，供共享工具 cron后续判断或输出使用。
  const utc = opts?.utc ?? false
  // 片段列表格式化`cron.trim`，供共享工具后续处理使用。
  const parts = cron.trim().split(/\s+/)
  // `parts.length` 与 `5` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 5) return cron

  // 从 `parts as [` 按位置拆出 minute、hour、dayOfMonth、month，让共享工具 cron分别处理这些返回值。
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [
    string,
    string,
    string,
    string,
    string,
  ]

  // Every N minutes: step/N * * * *
  // everyMinMatch匹配`minute.match`，供共享工具后续处理使用。
  const everyMinMatch = minute.match(/^\*\/(\d+)$/)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    everyMinMatch &&
    hour === '*' &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    // n解析`parseInt`，供共享工具后续处理使用。
    const n = parseInt(everyMinMatch[1]!, 10)
    // 返回 `n === 1 ? 'Every minute' : `Every ${n} minutes``，作为共享工具这次计算的结果。
    return n === 1 ? 'Every minute' : `Every ${n} minutes`
  }

  // Every hour: 0 * * * *
  // 共享工具在这里按实际状态进入对应分支。
  if (
    minute.match(/^\d+$/) &&
    hour === '*' &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    // m解析`parseInt`，供共享工具后续处理使用。
    const m = parseInt(minute, 10)
    // 满足 `m === 0` 时，共享工具执行该分支。
    if (m === 0) return 'Every hour'
    // 返回 ``Every hour at :${m.toString().padStart(2, '0')}``，作为共享工具这次计算的结果。
    return `Every hour at :${m.toString().padStart(2, '0')}`
  }

  // Every N hours: 0 step/N * * *
  // everyHourMatch匹配`hour.match`，供共享工具后续处理使用。
  const everyHourMatch = hour.match(/^\*\/(\d+)$/)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    minute.match(/^\d+$/) &&
    everyHourMatch &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    // n解析`parseInt`，供共享工具后续处理使用。
    const n = parseInt(everyHourMatch[1]!, 10)
    // m解析`parseInt`，供共享工具后续处理使用。
    const m = parseInt(minute, 10)
    // suffix格式化`m.toString`，供共享工具后续处理使用。
    const suffix = m === 0 ? '' : ` at :${m.toString().padStart(2, '0')}`
    // 返回 `n === 1 ? `Every hour${suffix}` : `Every ${n} hours${suffix}``，作为共享工具这次计算的结果。
    return n === 1 ? `Every hour${suffix}` : `Every ${n} hours${suffix}`
  }

  // --- Remaining cases reference hour+minute: branch on utc ----------------

  // 只有 `!minute.match(/^\d+$/) || !hour.match(/^\d+$/)` 满足时，共享工具才执行该分支。
  if (!minute.match(/^\d+$/) || !hour.match(/^\d+$/)) return cron
  // m解析`parseInt`，供共享工具后续处理使用。
  const m = parseInt(minute, 10)
  // h解析`parseInt`，供共享工具后续处理使用。
  const h = parseInt(hour, 10)
  // fmtTime格式化`utc ? formatUtcTimeAsLocal : formatLocalTime`，供后续判断或组装使用。
  const fmtTime = utc ? formatUtcTimeAsLocal : formatLocalTime

  // Daily at specific time: M H * * *
  // 只有 `dayOfMonth === '*' && month === '*' && dayOfWeek` 满足时，共享工具才执行该分支。
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    // 返回 ``Every day at ${fmtTime(m, h)}``，作为共享工具这次计算的结果。
    return `Every day at ${fmtTime(m, h)}`
  }

  // Specific day of week: M H * * D
  // 只有 `dayOfMonth === '*' && month === '*' && dayOfWeek.match(/^\d$/)` 满足时，共享工具才执行该分支。
  if (dayOfMonth === '*' && month === '*' && dayOfWeek.match(/^\d$/)) {
    // dayIndex 索引解析`parseInt`，供共享工具后续处理使用。
    const dayIndex = parseInt(dayOfWeek, 10) % 7 // normalize 7 (Sunday alias) -> 0
    // dayName 先占位，稍后的条件分支会根据实际输入补齐它。
    let dayName: string | undefined
    // 满足 `utc` 时，共享工具执行该分支。
    if (utc) {
      // UTC day+time may land on a different local day (midnight crossing).
      // Compute the actual local weekday by constructing the UTC instant.
      // ref 引用记录时间`Date`，供共享工具后续处理使用。
      const ref = new Date()
      // daysToAdd读取`ref.getUTCDay`，供共享工具后续处理使用。
      const daysToAdd = (dayIndex - ref.getUTCDay() + 7) % 7
      // ref.setUTCDate 写入新的状态值，使共享工具后续读取保持一致。
      ref.setUTCDate(ref.getUTCDate() + daysToAdd)
      // ref.setUTCHours 写入新的状态值，使共享工具后续读取保持一致。
      ref.setUTCHours(h, m, 0, 0)
      // dayName更新为 `DAY_NAMES[ref.getDay()]`，确保共享工具后续读取最新状态。
      dayName = DAY_NAMES[ref.getDay()]
    } else {
      // dayName更新为 `DAY_NAMES[dayIndex]`，确保共享工具后续读取最新状态。
      dayName = DAY_NAMES[dayIndex]
    }
    // 满足 `dayName) return `Every ${dayName} at ${fmtTime(m, h` 时，共享工具执行该分支。
    if (dayName) return `Every ${dayName} at ${fmtTime(m, h)}`
  }

  // Weekdays: M H * * 1-5
  // 只有 `dayOfMonth === '*' && month === '*' && dayOfWeek` 满足时，共享工具才执行该分支。
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '1-5') {
    // 返回 ``Weekdays at ${fmtTime(m, h)}``，作为共享工具这次计算的结果。
    return `Weekdays at ${fmtTime(m, h)}`
  }

  // 返回 `cron`，作为共享工具这次计算的结果。
  return cron
}
