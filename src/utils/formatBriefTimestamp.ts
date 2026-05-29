/**
 * Format an ISO timestamp for the brief/chat message label line.
 *
 * Display scales with age (like a messaging app):
 *   - same day:      "1:30 PM" or "13:30" (locale-dependent)
 *   - within 6 days: "Sunday, 4:15 PM" (locale-dependent)
 *   - older:         "Sunday, Feb 20, 4:30 PM" (locale-dependent)
 *
 * Respects POSIX locale env vars (LC_ALL > LC_TIME > LANG) for time format
 * (12h/24h), weekday names, month names, and overall structure.
 * Bun/V8's `toLocaleString(undefined)` ignores these on macOS, so we
 * convert them to BCP 47 tags ourselves.
 *
 * `now` is injectable for tests.
 */
// formatBriefTimestamp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatBriefTimestamp(
  isoString: string,
  now: Date = new Date(),
): string {
  // d记录时间`Date`，供共享工具后续处理使用。
  const d = new Date(isoString)
  // 满足 `Number.isNaN(d.getTime())` 时，共享工具执行该分支。
  if (Number.isNaN(d.getTime())) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // locale读取`getLocale`，供共享工具后续处理使用。
  const locale = getLocale()
  // dayDiff保存`startOfDay`，供共享工具后续处理使用。
  const dayDiff = startOfDay(now) - startOfDay(d)
  // daysAgo保存`Math.round`，供共享工具后续处理使用。
  const daysAgo = Math.round(dayDiff / 86_400_000)

  // 满足 `daysAgo === 0` 时，共享工具执行该分支。
  if (daysAgo === 0) {
    // 返回 `d.toLocaleTimeString(locale, {`，作为共享工具这次计算的结果。
    return d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // 只有 `daysAgo > 0 && daysAgo < 7` 满足时，共享工具才执行该分支。
  if (daysAgo > 0 && daysAgo < 7) {
    // 返回 `d.toLocaleString(locale, {`，作为共享工具这次计算的结果。
    return d.toLocaleString(locale, {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // 返回 `d.toLocaleString(locale, {`，作为共享工具这次计算的结果。
  return d.toLocaleString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Derive a BCP 47 locale tag from POSIX env vars.
 * LC_ALL > LC_TIME > LANG, falls back to undefined (system default).
 * Converts POSIX format (en_GB.UTF-8) to BCP 47 (en-GB).
 */
// getLocale 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLocale(): string | undefined {
  // raw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const raw =
    process.env.LC_ALL || process.env.LC_TIME || process.env.LANG || ''
  // 当 `!raw || raw` 匹配 `'C' || raw === 'POSIX'` 时，共享工具执行对应分支。
  if (!raw || raw === 'C' || raw === 'POSIX') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // Strip codeset (.UTF-8) and modifier (@euro), replace _ with -
  // base格式化`raw.split`，供共享工具后续处理使用。
  const base = raw.split('.')[0]!.split('@')[0]!
  // base缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!base) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // tag格式化`base.replaceAll`，供共享工具后续处理使用。
  const tag = base.replaceAll('_', '-')
  // Validate by trying to construct an Intl locale — invalid tags throw
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 共享工具 format Brief Timestamp在这里处理 `new Intl.DateTimeFormat(tag)`，完成这一小步状态转换。
    new Intl.DateTimeFormat(tag)
    // 返回 `tag`，作为共享工具这次计算的结果。
    return tag
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

// startOfDay 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startOfDay(d: Date): number {
  // 返回 `new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()`，作为共享工具这次计算的结果。
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
