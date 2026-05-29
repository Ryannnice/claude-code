/**
 * PowerShell static command prefix extraction.
 *
 * Mirrors bash's getCommandPrefixStatic / getCompoundCommandPrefixesStatic
 * (src/utils/bash/prefix.ts) but uses the PowerShell AST parser instead of
 * tree-sitter. The AST gives us cmd.name and cmd.args already split; for
 * external commands we feed those into the same fig-spec walker bash uses
 * (src/utils/shell/specPrefix.ts) — git/npm/kubectl CLIs are shell-agnostic.
 *
 * Feeds the "Yes, and don't ask again for: ___" editable input in the
 * permission dialog — static extractor provides a best-guess prefix, user
 * edits it down if needed.
 */

// 引入 getCommandSpec，将 ../bash/registry.js 中已经封装好的能力接到本文件流程里。
import { getCommandSpec } from '../bash/registry.js'
// 引入 buildPrefix、DEPTH_RULES，将 ../shell/specPrefix.js 中已经封装好的能力接到本文件流程里。
import { buildPrefix, DEPTH_RULES } from '../shell/specPrefix.js'
// 引入 countCharInString，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { countCharInString } from '../stringUtils.js'
// 引入 NEVER_SUGGEST，将 ./dangerousCmdlets.js 中已经封装好的能力接到本文件流程里。
import { NEVER_SUGGEST } from './dangerousCmdlets.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAllCommands,
  type ParsedCommandElement,
  parsePowerShellCommand,
} from './parser.js'

/**
 * Extract a static prefix from a single parsed command element.
 * Returns null for commands we won't suggest (shells, eval cmdlets, path-like
 * invocations) or can't extract a meaningful prefix from.
 */
// extractPrefixFromElement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function extractPrefixFromElement(
  cmd: ParsedCommandElement,
): Promise<string | null> {
  // nameType === 'application' means the raw name had path chars (./x, x\y,
  // x.exe) — PowerShell will run a file, not a named cmdlet. Don't suggest.
  // Same reasoning as the permission engine's nameType gate (PR #20096).
  // 当 `cmd.nameType` 匹配 `'application'` 时，共享工具执行对应分支。
  if (cmd.nameType === 'application') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 名称保存`cmd.name`，供后续判断或组装使用。
  const name = cmd.name
  // 名称缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!name) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 满足 `NEVER_SUGGEST.has(name.toLowerCase())` 时，共享工具执行该分支。
  if (NEVER_SUGGEST.has(name.toLowerCase())) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Cmdlets (Verb-Noun): the name alone is the right prefix granularity.
  // Get-Process -Name pwsh → Get-Process. There's no subcommand concept.
  // 当 `cmd.nameType` 匹配 `'cmdlet'` 时，共享工具执行对应分支。
  if (cmd.nameType === 'cmdlet') {
    // 返回 `name`，作为共享工具这次计算的结果。
    return name
  }

  // External command. Guard the argv before feeding it to buildPrefix.
  //
  // elementTypes[0] (command name) must be a literal. `& $cmd status` has
  // elementTypes[0]='Variable', name='$cmd' — classifies as 'unknown' (no path
  // chars), passes NEVER_SUGGEST, getCommandSpec('$cmd')=null → returns bare
  // '$cmd' → dead rule. Cheap to gate here.
  //
  // elementTypes[1..] (args) must all be StringConstant or Parameter. Anything
  // dynamic (Variable/SubExpression/ScriptBlock/ExpandableString) would embed
  // `$foo`/`$(...)` in the prefix → dead rule.
  // `cmd.elementTypes?.[0]` 与 `'StringConstant'` 不一致时刷新派生状态，避免使用过期结果。
  if (cmd.elementTypes?.[0] !== 'StringConstant') {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < cmd.args.length; i++) {
    // t 命名 `cmd.elementTypes[i + 1]`，让后续代码直接表达这个值的用途。
    const t = cmd.elementTypes[i + 1]
    // `t` 与 `'StringConstant' && t !== 'Para...` 不一致时刷新派生状态，避免使用过期结果。
    if (t !== 'StringConstant' && t !== 'Parameter') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }

  // Consult the fig spec — same oracle bash uses. If git's spec says -C takes
  // a value, buildPrefix skips -C /repo and finds `status` as a subcommand.
  // Lowercase for lookup: fig specs are filesystem paths (git.js), case-
  // sensitive on Linux. PowerShell is case-insensitive (Git === git) so `Git`
  // must resolve to the git spec. macOS hides this bug (case-insensitive fs).
  // Call buildPrefix unconditionally — calculateDepth consults DEPTH_RULES
  // before its own `if (!spec) return 2` fallback, so gcloud/aws/kubectl/az
  // get depth-aware prefixes even without a loaded spec. The old
  // `if (!spec) return name` short-circuit produced bare `gcloud:*` which
  // auto-allows every gcloud subcommand.
  // nameLower保存`name.toLowerCase`，供共享工具后续处理使用。
  const nameLower = name.toLowerCase()
  // spec读取`getCommandSpec`，供共享工具后续处理使用。
  const spec = await getCommandSpec(nameLower)
  // prefix构建`buildPrefix`，供共享工具后续处理使用。
  const prefix = await buildPrefix(name, cmd.args, spec)

  // Post-buildPrefix word integrity: buildPrefix space-joins consumed args
  // into the prefix string. parser.ts:685 stores .value (quote-stripped) for
  // single-quoted literals: git 'push origin' → args=['push origin']. If
  // that arg is consumed, buildPrefix emits 'git push origin' — silently
  // promoting 1 argv element to 3 prefix words. Rule PowerShell(git push
  // origin:*) then matches `git push origin --force` (3-element argv) — not
  // what the user approved.
  //
  // The old set-membership check (`!cmd.args.includes(word)`) was defeated
  // by decoy args: `git 'push origin' push origin` → args=['push origin',
  // 'push', 'origin'], prefix='git push origin'. Each word ∈ args (decoys at
  // indices 1,2 satisfy .includes()) → passed. Now POSITIONAL: walk args in
  // order; each prefix word must exactly match the next non-flag arg. A
  // positional that doesn't match means buildPrefix split it. Flags and
  // their values are skipped (buildPrefix skips them too) so
  // `git -C '/my repo' status` and `git commit -m 'fix typo'` still pass.
  // Backslash (C:\repo) rejected: dead over-specific rule.
  // argIdx 命名 `0`，让后续代码直接表达这个值的用途。
  let argIdx = 0
  // 逐项读取 `prefix.split(' ').slice(1)` 中的word，按输入顺序推进共享工具。
  for (const word of prefix.split(' ').slice(1)) {
    // 满足 `word.includes('\\')` 时，共享工具执行该分支。
    if (word.includes('\\')) return null
    // while 使用 argIdx < cmd.args.length 完成共享工具里的对应操作。
    while (argIdx < cmd.args.length) {
      // a读取 `cmd.args[argIdx]!` 对应条目，后续围绕该成员继续处理。
      const a = cmd.args[argIdx]!
      // 满足 `a === word` 时，共享工具执行该分支。
      if (a === word) break
      // 满足 `a.startsWith('-')` 时，共享工具执行该分支。
      if (a.startsWith('-')) {
        // 共享工具 static Prefix在这里处理 `argIdx++`，完成这一小步状态转换。
        argIdx++
        // Only skip the flag's value if the spec says this flag takes a
        // value argument. Without spec info, treat as a switch (no value)
        // — fail-safe avoids over-skipping positional args. (bug #16)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          spec?.options &&
          argIdx < cmd.args.length &&
          cmd.args[argIdx] !== word &&
          !cmd.args[argIdx]!.startsWith('-')
        ) {
          // flagLower保存`a.toLowerCase`，供共享工具后续处理使用。
          const flagLower = a.toLowerCase()
          // opt筛选`options.find`，供共享工具后续处理使用。
          const opt = spec.options.find(o =>
            Array.isArray(o.name)
              ? o.name.includes(flagLower)
              : o.name === flagLower,
          )
          // 满足 `opt?.args` 时，共享工具执行该分支。
          if (opt?.args) {
            // 共享工具 static Prefix在这里处理 `argIdx++`，完成这一小步状态转换。
            argIdx++
          }
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Positional arg that isn't the expected word → arg was split.
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 满足 `argIdx >= cmd.args.length` 时，共享工具执行该分支。
    if (argIdx >= cmd.args.length) return null
    // 共享工具 static Prefix在这里处理 `argIdx++`，完成这一小步状态转换。
    argIdx++
  }

  // Bare-root guard: buildPrefix returns 'git' for `git` with no subcommand
  // found (empty args, or only global flags). That's too broad — would
  // auto-allow `git push --force` forever. Bash's extractor doesn't gate this
  // (bash/prefix.ts:363, separate fix). Reject single-word results for
  // commands whose spec declares subcommands OR that have DEPTH_RULES entries
  // (gcloud, aws, kubectl, etc.) which implies subcommand structure even
  // without a loaded spec. (bug #17)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !prefix.includes(' ') &&
    (spec?.subcommands?.length || DEPTH_RULES[nameLower])
  ) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `prefix`，作为共享工具这次计算的结果。
  return prefix
}

/**
 * Extract a prefix suggestion for a PowerShell command.
 *
 * Parses the command, takes the first CommandAst, returns a prefix suitable
 * for the permission dialog's "don't ask again for: ___" editable input.
 * Returns null when no safe prefix can be extracted (parse failure, shell
 * invocation, path-like name, bare subcommand-aware command).
 */
// getCommandPrefixStatic 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCommandPrefixStatic(
  command: string,
): Promise<{ commandPrefix: string | null } | null> {
  // 解析结果解析`parsePowerShellCommand`，供共享工具后续处理使用。
  const parsed = await parsePowerShellCommand(command)
  // parsed.valid缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parsed.valid) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Find the first actual command (CommandAst). getAllCommands iterates
  // both statement.commands and statement.nestedCommands (for &&/||/if/for).
  // Skip synthetic CommandExpressionAst entries (expression pipeline sources,
  // non-PipelineAst statement placeholders).
  // firstCommand 命令数据读取`getAllCommands`，供共享工具后续处理使用。
  const firstCommand = getAllCommands(parsed).find(
    // cmd 命令数据更新为 `> cmd.elementType === 'CommandAst'`，确保共享工具后续读取最新状态。
    cmd => cmd.elementType === 'CommandAst',
  )
  // firstCommand 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!firstCommand) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { commandPrefix: null }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { commandPrefix: await extractPrefixFromElement(firstCommand) }
}

/**
 * Extract prefixes for all subcommands in a compound PowerShell command.
 *
 * For `Get-Process; git status && npm test`, returns per-subcommand prefixes.
 * Subcommands for which `excludeSubcommand` returns true (e.g. already
 * read-only/auto-allowed) are skipped — no point suggesting a rule for them.
 * Prefixes sharing a root are collapsed via word-aligned LCP:
 * `npm run test && npm run lint` → `npm run`.
 *
 * The filter receives the ParsedCommandElement (not cmd.text) because
 * PowerShell's read-only check (isAllowlistedCommand) needs the element's
 * structured fields (nameType, args). Passing text would require reparsing,
 * which spawns pwsh.exe per subcommand — expensive and wasteful since we
 * already have the parsed elements here. Bash's equivalent passes text
 * because BashTool.isReadOnly works from regex/patterns, not parsed AST.
 */
// getCompoundCommandPrefixesStatic 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCompoundCommandPrefixesStatic(
  command: string,
  excludeSubcommand?: (element: ParsedCommandElement) => boolean,
): Promise<string[]> {
  // 解析结果解析`parsePowerShellCommand`，供共享工具后续处理使用。
  const parsed = await parsePowerShellCommand(command)
  // parsed.valid缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parsed.valid) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // commands 命令数据读取`getAllCommands`，供共享工具后续处理使用。
  const commands = getAllCommands(parsed).filter(
    // cmd 命令数据更新为 `> cmd.elementType === 'CommandAst'`，确保共享工具后续读取最新状态。
    cmd => cmd.elementType === 'CommandAst',
  )

  // Single command — no compound collapse needed.
  // 满足 `commands.length <= 1` 时，共享工具执行该分支。
  if (commands.length <= 1) {
    // prefix读取 `commands[0]` 对应条目，后续围绕该成员继续处理。
    const prefix = commands[0]
      ? await extractPrefixFromElement(commands[0])
      : null
    // 返回 `prefix ? [prefix] : []`，作为共享工具这次计算的结果。
    return prefix ? [prefix] : []
  }

  // prefixes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const prefixes: string[] = []
  // 按顺序遍历 `commands` 中的cmd 命令数据，逐个交给共享工具处理。
  for (const cmd of commands) {
    // 满足 `excludeSubcommand?.(cmd)` 时，共享工具执行该分支。
    if (excludeSubcommand?.(cmd)) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // prefix保存`extractPrefixFromElement`，供共享工具后续处理使用。
    const prefix = await extractPrefixFromElement(cmd)
    // 满足 `prefix` 时，共享工具执行该分支。
    if (prefix) {
      // prefixes 集合追加新条目，保持收集顺序与输入顺序一致。
      prefixes.push(prefix)
    }
  }

  // prefixes 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (prefixes.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Group by root command (first word) and collapse each group via
  // word-aligned longest common prefix. `npm run test` + `npm run lint`
  // → `npm run`. But NEVER collapse down to a bare subcommand-aware root:
  // `git add` + `git commit` would LCP to `git`, which extractPrefixFromElement
  // explicitly refuses as too broad (line ~119). Collapsing through that gate
  // would suggest PowerShell(git:*) → auto-allows git push --force forever.
  // When LCP yields a bare subcommand-aware root, drop the group entirely
  // rather than suggest either the too-broad root or N un-collapsed rules.
  //
  // Bash's getCompoundCommandPrefixesStatic has this same collapse without
  // the guard (src/utils/bash/prefix.ts:360-365) — that's a separate fix.
  //
  // Grouping and word-comparison are case-insensitive (PowerShell is
  // case-insensitive: Git === git, Get-Process === get-process). The Map key
  // is lowercased; the emitted prefix keeps the first-seen casing.
  // groups 集合 命名 `new Map<string, string[]>()`，让后续代码直接表达这个值的用途。
  const groups = new Map<string, string[]>()
  // 按顺序遍历 `prefixes` 中的prefix，逐个交给共享工具处理。
  for (const prefix of prefixes) {
    // root格式化`prefix.split`，供共享工具后续处理使用。
    const root = prefix.split(' ')[0]!
    // 按键保存`root.toLowerCase`，供共享工具后续处理使用。
    const key = root.toLowerCase()
    // group读取`groups.get`，供共享工具后续处理使用。
    const group = groups.get(key)
    // 满足 `group` 时，共享工具执行该分支。
    if (group) {
      // group追加新条目，保持收集顺序与输入顺序一致。
      group.push(prefix)
    } else {
      // groups.set 写入新的状态值，使共享工具后续读取保持一致。
      groups.set(key, [prefix])
    }
  }

  // collapsed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const collapsed: string[] = []
  // 循环处理 `const [rootLower, group] of groups`，让共享工具逐项把同类条目按顺序走完。
  for (const [rootLower, group] of groups) {
    // lcp保存`wordAlignedLCP`，供共享工具后续处理使用。
    const lcp = wordAlignedLCP(group)
    // lcpWordCount 数量统计`countCharInString`，供共享工具后续处理使用。
    const lcpWordCount = lcp === '' ? 0 : countCharInString(lcp, ' ') + 1
    // 满足 `lcpWordCount <= 1` 时，共享工具执行该分支。
    if (lcpWordCount <= 1) {
      // LCP collapsed to a single word. If that root's fig spec declares
      // subcommands, this is the same too-broad case extractPrefixFromElement
      // rejects (bare `git` → allows `git push --force`). Drop the group.
      // getCommandSpec is LRU-memoized; one lookup per distinct root.
      // rootSpec读取`getCommandSpec`，供共享工具后续处理使用。
      const rootSpec = await getCommandSpec(rootLower)
      // 只有 `rootSpec?.subcommands?.length || DEPTH_RULES[root` 满足时，共享工具才执行该分支。
      if (rootSpec?.subcommands?.length || DEPTH_RULES[rootLower]) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // collapsed追加新条目，保持收集顺序与输入顺序一致。
    collapsed.push(lcp)
  }
  // 返回 `collapsed`，作为共享工具这次计算的结果。
  return collapsed
}

/**
 * Word-aligned longest common prefix. Doesn't chop mid-word.
 * Case-insensitive comparison (PowerShell: Git === git), emits first
 * string's casing.
 * ["npm run test", "npm run lint"] → "npm run"
 * ["Git status", "git log"] → "Git" (first-seen casing)
 * ["Get-Process"] → "Get-Process"
 */
// wordAlignedLCP 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wordAlignedLCP(strings: string[]): string {
  // strings 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (strings.length === 0) return ''
  // 满足 `strings.length === 1` 时，共享工具执行该分支。
  if (strings.length === 1) return strings[0]!

  // firstWords 集合格式化`split`，供共享工具后续处理使用。
  const firstWords = strings[0]!.split(' ')
  // commonWordCount 数量 命名 `firstWords.length`，让后续代码直接表达这个值的用途。
  let commonWordCount = firstWords.length

  // 循环处理 `let i = 1; i < strings.length; i++`，让共享工具逐项把同类条目按顺序走完。
  for (let i = 1; i < strings.length; i++) {
    // words 集合格式化`split`，供共享工具后续处理使用。
    const words = strings[i]!.split(' ')
    // matchCount 数量保存`0`，供后续判断或组装使用。
    let matchCount = 0
    // 调用 while，触发共享工具此处需要的副作用。
    while (
      matchCount < commonWordCount &&
      matchCount < words.length &&
      words[matchCount]!.toLowerCase() === firstWords[matchCount]!.toLowerCase()
    ) {
      // 共享工具 static Prefix在这里处理 `matchCount++`，完成这一小步状态转换。
      matchCount++
    }
    // commonWordCount 数量更新为 `matchCount`，确保共享工具后续读取最新状态。
    commonWordCount = matchCount
    // 满足 `commonWordCount === 0` 时，共享工具执行该分支。
    if (commonWordCount === 0) break
  }

  // 返回 `firstWords.slice(0, commonWordCount).join(' ')`，作为共享工具这次计算的结果。
  return firstWords.slice(0, commonWordCount).join(' ')
}
