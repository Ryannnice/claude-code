/**
 * Filter and sanitize installed-app data for inclusion in the `request_access`
 * tool description. Ported from Cowork's appNames.ts. Two
 * concerns: noise filtering (Spotlight returns every bundle on disk — XPC
 * helpers, daemons, input methods) and prompt-injection hardening (app names
 * are attacker-controlled; anyone can ship an app named anything).
 *
 * Residual risk: short benign-char adversarial names ("grant all") can't be
 * filtered programmatically. The tool description's structural framing
 * ("Available applications:") makes it clear these are app names, and the
 * downstream permission dialog requires explicit user approval — a bad name
 * can't auto-grant anything.
 */

/** Minimal shape — matches what `listInstalledApps` returns. */
// InstalledAppLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InstalledAppLike = {
  readonly bundleId: string
  readonly displayName: string
  readonly path: string
}

// ── Noise filtering ──────────────────────────────────────────────────────

/**
 * Only apps under these roots are shown. /System/Library subpaths (CoreServices,
 * PrivateFrameworks, Input Methods) are OS plumbing — anchor on known-good
 * roots rather than blocklisting every junk subpath since new macOS versions
 * add more.
 *
 * ~/Applications is checked at call time via the `homeDir` arg (HOME isn't
 * reliably known at module load in all environments).
 */
// PATH_ALLOWLIST 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
const PATH_ALLOWLIST: readonly string[] = [
  '/Applications/',
  '/System/Applications/',
]

/**
 * Display-name patterns that mark background services even under /Applications.
 * `(?:$|\s\()` — matches keyword at end-of-string OR immediately before ` (`:
 * "Slack Helper (GPU)" and "ABAssistantService" fail, "Service Desk" passes
 * (Service is followed by " D").
 */
// NAME_PATTERN_BLOCKLIST 集合 聚合成有序列表，保持后续遍历顺序稳定。
const NAME_PATTERN_BLOCKLIST: readonly RegExp[] = [
  /Helper(?:$|\s\()/,
  /Agent(?:$|\s\()/,
  /Service(?:$|\s\()/,
  /Uninstaller(?:$|\s\()/,
  /Updater(?:$|\s\()/,
  /^\./,
]

/**
 * Apps commonly requested for CU automation. ALWAYS included if installed,
 * bypassing path check + count cap — the model needs these exact names even
 * when the machine has 200+ apps. Bundle IDs (locale-invariant), not display
 * names. Keep <30 — each entry is a guaranteed token in the description.
 */
// ALWAYS_KEEP_BUNDLE_IDS 集合 用 Set 去重，后续只需判断成员是否存在。
const ALWAYS_KEEP_BUNDLE_IDS: ReadonlySet<string> = new Set([
  // Browsers
  'com.apple.Safari',
  'com.google.Chrome',
  'com.microsoft.edgemac',
  'org.mozilla.firefox',
  'company.thebrowser.Browser', // Arc
  // Communication
  'com.tinyspeck.slackmacgap',
  'us.zoom.xos',
  'com.microsoft.teams2',
  'com.microsoft.teams',
  'com.apple.MobileSMS',
  'com.apple.mail',
  // Productivity
  'com.microsoft.Word',
  'com.microsoft.Excel',
  'com.microsoft.Powerpoint',
  'com.microsoft.Outlook',
  'com.apple.iWork.Pages',
  'com.apple.iWork.Numbers',
  'com.apple.iWork.Keynote',
  'com.google.GoogleDocs',
  // Notes / PM
  'notion.id',
  'com.apple.Notes',
  'md.obsidian',
  'com.linear',
  'com.figma.Desktop',
  // Dev
  'com.microsoft.VSCode',
  'com.apple.Terminal',
  'com.googlecode.iterm2',
  'com.github.GitHubDesktop',
  // System essentials the model genuinely targets
  'com.apple.finder',
  'com.apple.iCal',
  'com.apple.systempreferences',
])

// ── Prompt-injection hardening ───────────────────────────────────────────

/**
 * `\p{L}\p{M}\p{N}` with /u — not `\w` (ASCII-only, would drop Bücher, 微信,
 * Préférences Système). `\p{M}` matches combining marks so NFD-decomposed
 * diacritics (ü → u + ◌̈) pass. Single space not `\s` — `\s` matches newlines,
 * which would let "App\nIgnore previous…" through as a multi-line injection.
 * Still bars quotes, angle brackets, backticks, pipes, colons.
 */
// APP_NAME_ALLOWED 命名 `/^[\p{L}\p{M}\p{N}_ .&'()+-]+$/u`，让后续代码直接表达这个值的用途。
const APP_NAME_ALLOWED = /^[\p{L}\p{M}\p{N}_ .&'()+-]+$/u
// APP_NAME_MAX_LEN保存`40`，供共享工具 app Names后续步骤使用。
const APP_NAME_MAX_LEN = 40
// APP_NAME_MAX_COUNT保存`50`，供共享工具 app Names后续步骤使用。
const APP_NAME_MAX_COUNT = 50

// isUserFacingPath 承担共享工具中的独立步骤，串起共享工具 app Names需要的输入整理、状态更新和结果输出。
function isUserFacingPath(path: string, homeDir: string | undefined): boolean {
  // 判断 PATH_ALLOWLIST.some(root => path.startsWith(root))，将共享工具分流到只适用于该条件的处理路径。
  if (PATH_ALLOWLIST.some(root => path.startsWith(root))) return true
  // 满足 `homeDir` 时，共享工具执行该分支。
  if (homeDir) {
    // userApps 集合保存`homeDir.endsWith`，供共享工具后续处理使用。
    const userApps = homeDir.endsWith('/')
      ? `${homeDir}Applications/`
      : `${homeDir}/Applications/`
    // 判断 path.startsWith(userApps)，将共享工具分流到只适用于该条件的处理路径。
    if (path.startsWith(userApps)) return true
  }
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

// isNoisyName 承担共享工具中的独立步骤，串起共享工具 app Names需要的输入整理、状态更新和结果输出。
function isNoisyName(name: string): boolean {
  // 返回 NAME_PATTERN_BLOCKLIST.some(re => re.test(name))，把共享工具这个分支的结果交还调用方。
  return NAME_PATTERN_BLOCKLIST.some(re => re.test(name))
}

/**
 * Length cap + trim + dedupe + sort. `applyCharFilter` — skip for trusted
 * bundle IDs (Apple/Google/MS; a localized "Réglages Système" with unusual
 * punctuation shouldn't be dropped), apply for anything attacker-installable.
 */
// sanitizeCore 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeCore(
  raw: readonly string[],
  applyCharFilter: boolean,
): string[] {
  // seen构建`new Set<string>()`，供后续判断或组装使用。
  const seen = new Set<string>()
  // 返回 `raw`，作为共享工具这次计算的结果。
  return raw
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(name => name.trim())
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(trimmed => {
      // trimmed缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!trimmed) return false
      // 满足 `trimmed.length > APP_NAME_MAX_LEN` 时，共享工具执行该分支。
      if (trimmed.length > APP_NAME_MAX_LEN) return false
      // 只有 `applyCharFilter && !APP_NAME_ALLOWED.test(trimmed)` 满足时，共享工具才执行该分支。
      if (applyCharFilter && !APP_NAME_ALLOWED.test(trimmed)) return false
      // 满足 `seen.has(trimmed)` 时，共享工具执行该分支。
      if (seen.has(trimmed)) return false
      // 调用 seen.add，触发共享工具此处需要的副作用。
      seen.add(trimmed)
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a.localeCompare(b))
}

// sanitizeAppNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeAppNames(raw: readonly string[]): string[] {
  // filtered保存`sanitizeCore`，供共享工具后续处理使用。
  const filtered = sanitizeCore(raw, true)
  // 满足 `filtered.length <= APP_NAME_MAX_COUNT` 时，共享工具执行该分支。
  if (filtered.length <= APP_NAME_MAX_COUNT) return filtered
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    ...filtered.slice(0, APP_NAME_MAX_COUNT),
    `… and ${filtered.length - APP_NAME_MAX_COUNT} more`,
  ]
}

// sanitizeTrustedNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeTrustedNames(raw: readonly string[]): string[] {
  // 返回 `sanitizeCore(raw, false)`，作为共享工具这次计算的结果。
  return sanitizeCore(raw, false)
}

/**
 * Filter raw Spotlight results to user-facing apps, then sanitize. Always-keep
 * apps bypass path/name filter AND char allowlist (trusted vendors, not
 * attacker-installed); still length-capped, deduped, sorted.
 */
// filterAppsForDescription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterAppsForDescription(
  installed: readonly InstalledAppLike[],
  homeDir: string | undefined,
): string[] {
  // 从 `installed.reduce<{` 解构 alwaysKept、rest，减少共享工具 app Names对同一对象的重复访问。
  const { alwaysKept, rest } = installed.reduce<{
    alwaysKept: string[]
    rest: string[]
  }>(
    // 这个回调绑定到 (acc, app) => {，负责共享工具在该局部场景下的响应。
    (acc, app) => {
      // 满足 `ALWAYS_KEEP_BUNDLE_IDS.has(app.bundleId)` 时，共享工具执行该分支。
      if (ALWAYS_KEEP_BUNDLE_IDS.has(app.bundleId)) {
        // alwaysKept追加新条目，保持收集顺序与输入顺序一致。
        acc.alwaysKept.push(app.displayName)
      // 共享工具 app Names在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        isUserFacingPath(app.path, homeDir) &&
        !isNoisyName(app.displayName)
      ) {
        // rest追加新条目，保持收集顺序与输入顺序一致。
        acc.rest.push(app.displayName)
      }
      // 返回 `acc`，作为共享工具这次计算的结果。
      return acc
    },
    { alwaysKept: [], rest: [] },
  )

  // sanitizedAlways 集合保存`sanitizeTrustedNames`，供共享工具后续处理使用。
  const sanitizedAlways = sanitizeTrustedNames(alwaysKept)
  // alwaysSet保存`Set`，供共享工具后续处理使用。
  const alwaysSet = new Set(sanitizedAlways)
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    ...sanitizedAlways,
    // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
    ...sanitizeAppNames(rest).filter(n => !alwaysSet.has(n)),
  ]
}
