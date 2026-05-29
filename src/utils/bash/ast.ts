/**
 * AST-based bash command analysis using tree-sitter.
 *
 * This module replaces the shell-quote + hand-rolled char-walker approach in
 * bashSecurity.ts / commands.ts. Instead of detecting parser differentials
 * one-by-one, we parse with tree-sitter-bash and walk the tree with an
 * EXPLICIT allowlist of node types. Any node type not in the allowlist causes
 * the entire command to be classified as 'too-complex', which means it goes
 * through the normal permission prompt flow.
 *
 * The key design property is FAIL-CLOSED: we never interpret structure we
 * don't understand. If tree-sitter produces a node we haven't explicitly
 * allowlisted, we refuse to extract argv and the caller must ask the user.
 *
 * This is NOT a sandbox. It does not prevent dangerous commands from running.
 * It answers exactly one question: "Can we produce a trustworthy argv[] for
 * each simple command in this string?" If yes, downstream code can match
 * argv[0] against permission rules and flag allowlists. If no, ask the user.
 */

// 引入 SHELL_KEYWORDS，将 ./bashParser.js 中已经封装好的能力接到本文件流程里。
import { SHELL_KEYWORDS } from './bashParser.js'
// 类型依赖 { Node } 来自 ./parser.js，用于校准共享工具的数据契约。
import type { Node } from './parser.js'
// 引入 PARSE_ABORTED、parseCommandRaw，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { PARSE_ABORTED, parseCommandRaw } from './parser.js'

// Redirect 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Redirect = {
  op: '>' | '>>' | '<' | '<<' | '>&' | '>|' | '<&' | '&>' | '&>>' | '<<<'
  target: string
  fd?: number
}

// SimpleCommand 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SimpleCommand = {
  /** argv[0] is the command name, rest are arguments with quotes already resolved */
  argv: string[]
  /** Leading VAR=val assignments */
  envVars: { name: string; value: string }[]
  /** Output/input redirects */
  redirects: Redirect[]
  /** Original source span for this command (for UI display) */
  text: string
}

// ParseForSecurityResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParseForSecurityResult =
  | { kind: 'simple'; commands: SimpleCommand[] }
  | { kind: 'too-complex'; reason: string; nodeType?: string }
  | { kind: 'parse-unavailable' }

/**
 * Structural node types that represent composition of commands. We recurse
 * through these to find the leaf `command` nodes. `program` is the root;
 * `list` is `a && b || c`; `pipeline` is `a | b`; `redirected_statement`
 * wraps a command with its redirects. Semicolon-separated commands appear
 * as direct siblings under `program` (no wrapper node).
 */
// STRUCTURAL_TYPES 集合保存`Set`，供共享工具后续处理使用。
const STRUCTURAL_TYPES = new Set([
  'program',
  'list',
  'pipeline',
  'redirected_statement',
])

/**
 * Operator tokens that separate commands. These are leaf nodes that appear
 * between commands in `list`/`pipeline`/`program` and carry no payload.
 */
// SEPARATOR_TYPES 集合保存`Set`，供共享工具后续处理使用。
const SEPARATOR_TYPES = new Set(['&&', '||', '|', ';', '&', '|&', '\n'])

/**
 * Placeholder string used in outer argv when a $() is recursively extracted.
 * The actual $() output is runtime-determined; the inner command(s) are
 * checked against permission rules separately. Using a placeholder keeps
 * the outer argv clean (no multi-line heredoc bodies polluting path
 * extraction or triggering newline checks).
 */
// CMDSUB_PLACEHOLDER 命令数据固定为 `'__CMDSUB_OUTPUT__'`，作为共享工具 ast后续展示或比较的基准。
const CMDSUB_PLACEHOLDER = '__CMDSUB_OUTPUT__'

/**
 * Placeholder for simple_expansion ($VAR) references to variables set earlier
 * in the same command via variable_assignment. Since we tracked the assignment,
 * we know the var exists and its value is either a static string or
 * __CMDSUB_OUTPUT__ (if set via $()). Either way, safe to substitute.
 */
// VAR_PLACEHOLDER固定为 `'__TRACKED_VAR__'`，作为共享工具 ast后续展示或比较的基准。
const VAR_PLACEHOLDER = '__TRACKED_VAR__'

/**
 * All placeholder strings. Used for defense-in-depth: if a varScope value
 * contains ANY placeholder (exact or embedded), the value is NOT a pure
 * literal and cannot be trusted as a bare argument. Covers composites like
 * `VAR="prefix$(cmd)"` → `"prefix__CMDSUB_OUTPUT__"` — the substring check
 * catches these where exact-match Set.has() would miss.
 *
 * Also catches user-typed literals that collide with placeholder strings:
 * `VAR=__TRACKED_VAR__ && rm $VAR` — treated as non-literal (conservative).
 */
// containsAnyPlaceholder 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsAnyPlaceholder(value: string): boolean {
  // 返回 `value.includes(CMDSUB_PLACEHOLDER) || value.includes(VAR_PLACEHOLDER)`，作为共享工具这次计算的结果。
  return value.includes(CMDSUB_PLACEHOLDER) || value.includes(VAR_PLACEHOLDER)
}

/**
 * Unquoted $VAR in bash undergoes word-splitting (on $IFS: space/tab/NL)
 * and pathname expansion (glob matching on * ? [). Our argv stores a
 * single string — but at runtime bash may produce MULTIPLE args, or paths
 * matched by a glob. A value containing these metacharacters cannot be
 * trusted as a bare arg: `VAR="-rf /" && rm $VAR` → bash runs `rm -rf /`
 * (two args) but our argv would have `['rm', '-rf /']` (one arg). Similarly
 * `VAR="/etc/*" && cat $VAR` → bash expands to all /etc files.
 *
 * Inside double-quotes ("$VAR"), neither splitting nor globbing applies —
 * the value IS a single literal argument.
 */
// BARE_VAR_UNSAFE_RE保存`/[ \t\n*?[]/`，供共享工具 ast后续判断或输出使用。
const BARE_VAR_UNSAFE_RE = /[ \t\n*?[]/

// stdbuf flag forms — hoisted from the wrapper-stripping while-loop
// STDBUF_SHORT_SEP_RE读取 `/^-[ioe]$/` 对应条目，后续围绕该成员继续处理。
const STDBUF_SHORT_SEP_RE = /^-[ioe]$/
// STDBUF_SHORT_FUSED_RE 命名 `/^-[ioe]./`，让后续代码直接表达这个值的用途。
const STDBUF_SHORT_FUSED_RE = /^-[ioe]./
// STDBUF_LONG_RE保存`/^--(input|output|error)=/`，供后续判断或组装使用。
const STDBUF_LONG_RE = /^--(input|output|error)=/

/**
 * Known-safe environment variables that bash sets automatically. Their values
 * are controlled by the shell/OS, not arbitrary user input. Referencing these
 * via $VAR is safe — the expansion is deterministic and doesn't introduce
 * injection risk. Covers `$HOME`, `$PWD`, `$USER`, `$PATH`, `$SHELL`, etc.
 * Intentionally small: only vars that are always set by bash/login and whose
 * values are paths/names (not arbitrary content).
 */
// SAFE_ENV_VARS 集合保存`Set`，供共享工具后续处理使用。
const SAFE_ENV_VARS = new Set([
  'HOME', // user's home directory
  'PWD', // current working directory (bash maintains)
  'OLDPWD', // previous directory
  'USER', // current username
  'LOGNAME', // login name
  'SHELL', // user's login shell
  'PATH', // executable search path
  'HOSTNAME', // machine hostname
  'UID', // user id
  'EUID', // effective user id
  'PPID', // parent process id
  'RANDOM', // random number (bash builtin)
  'SECONDS', // seconds since shell start
  'LINENO', // current line number
  'TMPDIR', // temp directory
  // Special bash variables — always set, values are shell-controlled:
  'BASH_VERSION', // bash version string
  'BASHPID', // current bash process id
  'SHLVL', // shell nesting level
  'HISTFILE', // history file path
  'IFS', // field separator (NOTE: only safe INSIDE strings; as bare arg
  //       $IFS is the classic injection primitive and the insideString
  //       gate in resolveSimpleExpansion correctly blocks it)
])

/**
 * Special shell variables ($?, $$, $!, $#, $0-$9). tree-sitter uses
 * `special_variable_name` for these (not `variable_name`). Values are
 * shell-controlled: exit status, PIDs, positional args. Safe to resolve
 * ONLY inside strings (same rationale as SAFE_ENV_VARS — as bare args
 * their value IS the argument and might be a path/flag from $1 etc.).
 *
 * SECURITY: '@' and '*' are NOT in this set. Inside "...", they expand to
 * the positional params — which are EMPTY in a fresh BashTool shell (how we
 * always spawn). Returning VAR_PLACEHOLDER would lie: `git "push$*"` gives
 * argv ['git','push__TRACKED_VAR__'] while bash passes ['git','push']. Deny
 * rule Bash(git push:*) fails on both .text (raw `$*`) AND rebuilt argv
 * (placeholder). With them removed, resolveSimpleExpansion falls through to
 * tooComplex for `$*` / `$@`. `echo "args: $*"` becomes too-complex —
 * acceptable (rare in BashTool usage; `"$@"` even rarer).
 */
// SPECIAL_VAR_NAMES 集合保存`Set`，供共享工具后续处理使用。
const SPECIAL_VAR_NAMES = new Set([
  '?', // exit status of last command
  '$', // current shell PID
  '!', // last background PID
  '#', // number of positional params
  '0', // script name
  '-', // shell option flags
])

/**
 * Node types that mean "this command cannot be statically analyzed." These
 * either execute arbitrary code (substitutions, subshells, control flow) or
 * expand to values we can't determine statically (parameter/arithmetic
 * expansion, brace expressions).
 *
 * This set is not exhaustive — it documents KNOWN dangerous types. The real
 * safety property is the allowlist in walkArgument/walkCommand: any type NOT
 * explicitly handled there also triggers too-complex.
 */
// DANGEROUS_TYPES 集合保存`Set`，供共享工具后续处理使用。
const DANGEROUS_TYPES = new Set([
  'command_substitution',
  'process_substitution',
  'expansion',
  'simple_expansion',
  'brace_expression',
  'subshell',
  'compound_statement',
  'for_statement',
  'while_statement',
  'until_statement',
  'if_statement',
  'case_statement',
  'function_definition',
  'test_command',
  'ansi_c_string',
  'translated_string',
  'herestring_redirect',
  'heredoc_redirect',
])

/**
 * Numeric IDs for analytics (logEvent doesn't accept strings). Index into
 * DANGEROUS_TYPES. Append new entries at the end to keep IDs stable.
 * 0 = unknown/other, -1 = ERROR (parse failure), -2 = pre-check.
 */
// DANGEROUS_TYPE_IDS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const DANGEROUS_TYPE_IDS = [...DANGEROUS_TYPES]
// nodeTypeId 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function nodeTypeId(nodeType: string | undefined): number {
  // nodeType缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!nodeType) return -2
  // 当 `nodeType` 匹配 `'ERROR'` 时，共享工具执行对应分支。
  if (nodeType === 'ERROR') return -1
  // i保存`DANGEROUS_TYPE_IDS.indexOf`，供共享工具后续处理使用。
  const i = DANGEROUS_TYPE_IDS.indexOf(nodeType)
  // 返回 `i >= 0 ? i + 1 : 0`，作为共享工具这次计算的结果。
  return i >= 0 ? i + 1 : 0
}

/**
 * Redirect operator tokens → canonical operator. tree-sitter produces these
 * as child nodes of `file_redirect`.
 */
// REDIRECT_OPS 集合 集中保存共享工具 ast要一起传递的字段。
const REDIRECT_OPS: Record<string, Redirect['op']> = {
  '>': '>',
  '>>': '>>',
  '<': '<',
  '>&': '>&',
  '<&': '<&',
  '>|': '>|',
  '&>': '&>',
  '&>>': '&>>',
  '<<<': '<<<',
}

/**
 * Brace expansion pattern: {a,b} or {a..b}. Must have , or .. inside
 * braces. We deliberately do NOT try to determine whether the opening brace
 * is backslash-escaped: tree-sitter doesn't unescape backslashes, so
 * distinguishing `\{a,b}` (escaped, literal) from `\\{a,b}` (literal
 * backslash + expansion) would require reimplementing bash quote removal.
 * Reject both — the escaped-brace case is rare and trivially rewritten
 * with single quotes.
 */
// BRACE_EXPANSION_RE 命名 `/\{[^{}\s]*(,|\.\.)[^{}\s]*\}/`，让后续代码直接表达这个值的用途。
const BRACE_EXPANSION_RE = /\{[^{}\s]*(,|\.\.)[^{}\s]*\}/

/**
 * Control characters that bash silently drops but confuse static analysis.
 * Includes CR (0x0D): tree-sitter treats CR as a word separator but bash's
 * default IFS does not include CR, so tree-sitter and bash disagree on
 * word boundaries.
 */
// eslint-disable-next-line no-control-regex
// CONTROL_CHAR_RE保存`/[\x00-\x08\x0B-\x1F\x7F]/`，供共享工具 ast后续判断或输出使用。
const CONTROL_CHAR_RE = /[\x00-\x08\x0B-\x1F\x7F]/

/**
 * Unicode whitespace beyond ASCII. These render invisibly (or as regular
 * spaces) in terminals so a user reviewing the command can't see them, but
 * bash treats them as literal word characters. Blocks NBSP, zero-width
 * spaces, line/paragraph separators, BOM.
 */
// UNICODE_WHITESPACE_RE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const UNICODE_WHITESPACE_RE =
  /[\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/

/**
 * Backslash immediately before whitespace. bash treats `\ ` as a literal
 * space inside the current word, but tree-sitter returns the raw text with
 * the backslash still present. argv[0] from tree-sitter is `cat\ test`
 * while bash runs `cat test` (with a literal space). Rather than
 * reimplement bash's unescaping rules, we reject these — they're rare in
 * practice and trivial to rewrite with quotes.
 *
 * Also matches `\` before newline (line continuation) when adjacent to a
 * non-whitespace char. `tr\<NL>aceroute` — bash joins to `traceroute`, but
 * tree-sitter splits into two words (differential). When `\<NL>` is preceded
 * by whitespace (e.g. `foo && \<NL>bar`), there's no word to join — both
 * parsers agree, so we allow it.
 */
// BACKSLASH_WHITESPACE_RE读取 `/\\[ \t]|[^ \t\n\\]\\\n/` 对应条目，后续围绕该成员继续处理。
const BACKSLASH_WHITESPACE_RE = /\\[ \t]|[^ \t\n\\]\\\n/

/**
 * Zsh dynamic named directory expansion: ~[name]. In zsh this invokes the
 * zsh_directory_name hook, which can run arbitrary code. bash treats it as
 * a literal tilde followed by a glob character class. Since BashTool runs
 * via the user's default shell (often zsh), reject conservatively.
 */
// ZSH_TILDE_BRACKET_RE保存`/~\[/`，供共享工具 ast后续判断或输出使用。
const ZSH_TILDE_BRACKET_RE = /~\[/

/**
 * Zsh EQUALS expansion: word-initial `=cmd` expands to the absolute path of
 * `cmd` (equivalent to `$(which cmd)`). `=curl evil.com` runs as
 * `/usr/bin/curl evil.com`. tree-sitter parses `=curl` as a literal word, so
 * a `Bash(curl:*)` deny rule matching on base command name won't see `curl`.
 * Only matches word-initial `=` followed by a command-name char — `VAR=val`
 * and `--flag=val` have `=` mid-word and are not expanded by zsh.
 */
// ZSH_EQUALS_EXPANSION_RE保存`/(?:^|[\s;&|])=[a-zA-Z_]/`，供共享工具 ast后续判断或输出使用。
const ZSH_EQUALS_EXPANSION_RE = /(?:^|[\s;&|])=[a-zA-Z_]/

/**
 * Brace character combined with quote characters. Constructions like
 * `{a'}',b}` use quoted braces inside brace expansion context to obfuscate
 * the expansion from regex-based detection. In bash, `{a'}',b}` expands to
 * `a} b` (the quoted `}` becomes literal inside the first alternative).
 * These are hard to analyze correctly and have no legitimate use in
 * commands we'd want to auto-allow.
 *
 * This check runs on a version of the command with `{` masked out of
 * single-quoted and double-quoted spans, so JSON payloads like
 * `curl -d '{"k":"v"}'` don't trigger a false positive. Brace expansion
 * cannot occur inside quotes, so a `{` there can never start an obfuscation
 * pattern. The quote characters themselves stay visible so `{a'}',b}` and
 * `{@'{'0},...}` still match via the outer unquoted `{`.
 */
// BRACE_WITH_QUOTE_RE保存`/\{[^}]*['"]/`，供共享工具 ast后续判断或输出使用。
const BRACE_WITH_QUOTE_RE = /\{[^}]*['"]/

/**
 * Mask `{` characters that appear inside single- or double-quoted contexts.
 * Uses a single-pass bash-aware quote-state scanner instead of a regex.
 *
 * A naive regex (`/'[^']*'/g`) mis-detects spans when a `'` appears inside
 * a double-quoted string: for `echo "it's" {a'}',b}`, it matches from the
 * `'` in `it's` across to the `'` in `{a'}`, masking the unquoted `{` and
 * producing a false negative. The scanner tracks actual bash quote state:
 * `'` toggles single-quote only in unquoted context; `"` toggles
 * double-quote only outside single quotes; `\` escapes the next char in
 * unquoted context and escapes `"` / `\\` inside double quotes.
 *
 * Brace expansion is impossible in both quote contexts, so masking `{` in
 * either is safe. Secondary defense: BRACE_EXPANSION_RE in walkArgument.
 */
// maskBracesInQuotedContexts 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function maskBracesInQuotedContexts(cmd: string): string {
  // Fast path: no `{` → nothing to mask. Skips the char-by-char scan for
  // the >90% of commands with no braces (`ls -la`, `git status`, etc).
  // 判断 !cmd.includes('{')，将共享工具分流到只适用于该条件的处理路径。
  if (!cmd.includes('{')) return cmd
  // out从空数组开始收集，后续按处理顺序追加条目。
  const out: string[] = []
  // inSingle记录当前扫描状态，共享工具 ast随后按该状态分支。
  let inSingle = false
  // inDouble记录当前扫描状态，共享工具 ast随后按该状态分支。
  let inDouble = false
  // i保存`0`，供共享工具 ast后续步骤使用。
  let i = 0
  // while 使用 i < cmd.length 完成共享工具里的对应操作。
  while (i < cmd.length) {
    // c保存`cmd[i]!`，供共享工具 ast后续步骤使用。
    const c = cmd[i]!
    // 满足 `inSingle` 时，共享工具执行该分支。
    if (inSingle) {
      // Bash single quotes: no escapes, `'` always terminates.
      // 判断 c === "'"，将共享工具分流到只适用于该条件的处理路径。
      if (c === "'") inSingle = false
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(c === '{' ? ' ' : c)
      // 共享工具 ast处理 `i++`，完成这一小步状态转换。
      i++
    // `inDouble` 成立时，共享工具 ast切换到这个 else-if 分支。
    } else if (inDouble) {
      // Bash double quotes: `\` escapes `"` and `\` (also `$`, backtick,
      // newline — but those don't affect quote state so we let them pass).
      // 判断 c === '\\' && (cmd[i + 1] === '"' || cmd[i + 1] === '\\')，将共享工具分流到只适用于该条件的处理路径。
      if (c === '\\' && (cmd[i + 1] === '"' || cmd[i + 1] === '\\')) {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(c, cmd[i + 1]!)
        // 共享工具 ast处理 `i += 2`，完成这一小步状态转换。
        i += 2
      } else {
        // 判断 c === '"'，将共享工具分流到只适用于该条件的处理路径。
        if (c === '"') inDouble = false
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(c === '{' ? ' ' : c)
        // 共享工具 ast处理 `i++`，完成这一小步状态转换。
        i++
      }
    } else {
      // Unquoted: `\` escapes any next char.
      // 组合条件 `c === '\\' && i + 1 < cmd.length` 成立时，共享工具才启用这条专门路径。
      if (c === '\\' && i + 1 < cmd.length) {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(c, cmd[i + 1]!)
        // 共享工具 ast处理 `i += 2`，完成这一小步状态转换。
        i += 2
      } else {
        // 判断 c === "'"，将共享工具分流到只适用于该条件的处理路径。
        if (c === "'") inSingle = true
        else if (c === '"') inDouble = true
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(c)
        // 共享工具 ast处理 `i++`，完成这一小步状态转换。
        i++
      }
    }
  }
  // 返回 out.join('')，把共享工具这个分支的结果交还调用方。
  return out.join('')
}

// DOLLAR保存`String.fromCharCode`，供共享工具后续处理使用。
const DOLLAR = String.fromCharCode(0x24)

/**
 * Parse a bash command string and extract a flat list of simple commands.
 * Returns 'too-complex' if the command uses any shell feature we can't
 * statically analyze. Returns 'parse-unavailable' if tree-sitter WASM isn't
 * loaded — caller should fall back to conservative behavior.
 */
// parseForSecurity 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
export async function parseForSecurity(
  cmd: string,
): Promise<ParseForSecurityResult> {
  // parseCommandRaw('') returns null (falsy check), so short-circuit here.
  // Don't use .trim() — it strips Unicode whitespace (\u00a0 etc.) which the
  // pre-checks in parseForSecurityFromAst need to see and reject.
  // 判断 cmd === ''，将共享工具分流到只适用于该条件的处理路径。
  if (cmd === '') return { kind: 'simple', commands: [] }
  // root解析`parseCommandRaw`，供共享工具后续处理使用。
  const root = await parseCommandRaw(cmd)
  // 返回 root === null，把共享工具这个分支的结果交还调用方。
  return root === null
    ? { kind: 'parse-unavailable' }
    : parseForSecurityFromAst(cmd, root)
}

/**
 * Same as parseForSecurity but takes a pre-parsed AST root so callers that
 * need the tree for other purposes can parse once and share. Pre-checks
 * still run on `cmd` — they catch tree-sitter/bash differentials that a
 * successful parse doesn't.
 */
// parseForSecurityFromAst 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
export function parseForSecurityFromAst(
  cmd: string,
  root: Node | typeof PARSE_ABORTED,
): ParseForSecurityResult {
  // Pre-checks: characters that cause tree-sitter and bash to disagree on
  // word boundaries. These run before tree-sitter because they're the known
  // tree-sitter/bash differentials. Everything after this point trusts
  // tree-sitter's tokenization.
  // 判断 CONTROL_CHAR_RE.test(cmd)，将共享工具分流到只适用于该条件的处理路径。
  if (CONTROL_CHAR_RE.test(cmd)) {
    // 返回 { kind: 'too-complex', reason: 'Contains control characters' }，把共享工具这个分支的结果交还调用方。
    return { kind: 'too-complex', reason: 'Contains control characters' }
  }
  // 判断 UNICODE_WHITESPACE_RE.test(cmd)，将共享工具分流到只适用于该条件的处理路径。
  if (UNICODE_WHITESPACE_RE.test(cmd)) {
    // 返回 { kind: 'too-complex', reason: 'Contains Unicode whitespace' }，把共享工具这个分支的结果交还调用方。
    return { kind: 'too-complex', reason: 'Contains Unicode whitespace' }
  }
  // 判断 BACKSLASH_WHITESPACE_RE.test(cmd)，将共享工具分流到只适用于该条件的处理路径。
  if (BACKSLASH_WHITESPACE_RE.test(cmd)) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Contains backslash-escaped whitespace',
    }
  }
  // 判断 ZSH_TILDE_BRACKET_RE.test(cmd)，将共享工具分流到只适用于该条件的处理路径。
  if (ZSH_TILDE_BRACKET_RE.test(cmd)) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Contains zsh ~[ dynamic directory syntax',
    }
  }
  // 判断 ZSH_EQUALS_EXPANSION_RE.test(cmd)，将共享工具分流到只适用于该条件的处理路径。
  if (ZSH_EQUALS_EXPANSION_RE.test(cmd)) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Contains zsh =cmd equals expansion',
    }
  }
  // 判断 BRACE_WITH_QUOTE_RE.test(maskBracesInQuotedContexts(cmd))，将共享工具分流到只适用于该条件的处理路径。
  if (BRACE_WITH_QUOTE_RE.test(maskBracesInQuotedContexts(cmd))) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Contains brace with quote character (expansion obfuscation)',
    }
  }

  // trimmed格式化`cmd.trim`，供共享工具后续处理使用。
  const trimmed = cmd.trim()
  // 满足 `trimmed === ''` 时，共享工具执行该分支。
  if (trimmed === '') {
    // 返回 { kind: 'simple', commands: [] }，把共享工具这个分支的结果交还调用方。
    return { kind: 'simple', commands: [] }
  }

  // 满足 `root === PARSE_ABORTED` 时，共享工具执行该分支。
  if (root === PARSE_ABORTED) {
    // SECURITY: module loaded but parse aborted (timeout / node budget /
    // panic). Adversarially triggerable — `(( a[0][0]... ))` with ~2800
    // subscripts hits PARSE_TIMEOUT_MICROS under the 10K length limit.
    // Previously indistinguishable from module-not-loaded → routed to
    // legacy (parse-unavailable), which lacks EVAL_LIKE_BUILTINS — `trap`,
    // `enable`, `hash` leaked with Bash(*). Fail closed: too-complex → ask.
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason:
        'Parser aborted (timeout or resource limit) — possible adversarial input',
      nodeType: 'PARSE_ABORT',
    }
  }

  // 返回 walkProgram(root)，把共享工具这个分支的结果交还调用方。
  return walkProgram(root)
}

// walkProgram 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function walkProgram(root: Node): ParseForSecurityResult {
  // ERROR-node check folded into collectCommands — any unhandled node type
  // (including ERROR) falls through to tooComplex() in the default branch.
  // Avoids a separate full-tree walk for error detection.
  // commands 命令数据从空数组开始收集，后续按处理顺序追加条目。
  const commands: SimpleCommand[] = []
  // Track variables assigned earlier in the same command. When a
  // simple_expansion ($VAR) references a tracked var, we can substitute
  // a placeholder instead of returning too-complex. Enables patterns like
  // `NOW=$(date) && jq --arg now "$NOW" ...` — $NOW is known to be the
  // $(date) output (already extracted as inner command).
  // varScope构建`new Map<string, string>()`，供共享工具 ast后续步骤使用。
  const varScope = new Map<string, string>()
  // err保存`collectCommands`，供共享工具后续处理使用。
  const err = collectCommands(root, commands, varScope)
  // 判断 err，将共享工具分流到只适用于该条件的处理路径。
  if (err) return err
  // 返回 { kind: 'simple', commands }，把共享工具这个分支的结果交还调用方。
  return { kind: 'simple', commands }
}

/**
 * Recursively collect leaf `command` nodes from a structural wrapper node.
 * Returns an error result on any disallowed node type, or null on success.
 */
// collectCommands 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function collectCommands(
  node: Node,
  commands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult | null {
  // `node.type` 命中特定值 `'command'` 时，进入共享工具对应处理。
  if (node.type === 'command') {
    // Pass `commands` as the innerCommands accumulator — any $() extracted
    // during walkCommand gets appended alongside the outer command.
    // 结果保存`walkCommand`，供共享工具后续处理使用。
    const result = walkCommand(node, [], commands, varScope)
    // 判断 result.kind !== 'simple'，将共享工具分流到只适用于该条件的处理路径。
    if (result.kind !== 'simple') return result
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push(...result.commands)
    // 返回 null，把共享工具这个分支的结果交还调用方。
    return null
  }

  // `node.type` 命中特定值 `'redirected_statement'` 时，进入共享工具对应处理。
  if (node.type === 'redirected_statement') {
    // 返回 walkRedirectedStatement(node, commands, varScope)，把共享工具这个分支的结果交还调用方。
    return walkRedirectedStatement(node, commands, varScope)
  }

  // `node.type` 命中特定值 `'comment'` 时，进入共享工具对应处理。
  if (node.type === 'comment') {
    // 返回 null，把共享工具这个分支的结果交还调用方。
    return null
  }

  // 判断 STRUCTURAL_TYPES.has(node.type)，将共享工具分流到只适用于该条件的处理路径。
  if (STRUCTURAL_TYPES.has(node.type)) {
    // SECURITY: `||`, `|`, `|&`, `&` must NOT carry varScope linearly. In bash:
    //   `||` RHS runs conditionally → vars set there MAY not be set
    //   `|`/`|&` stages run in subshells → vars set there are NEVER visible after
    //   `&` LHS runs in a background subshell → same as above
    // Flag-omission attack: `true || FLAG=--dry-run && cmd $FLAG` — bash skips
    // the `||` RHS (FLAG unset → $FLAG empty), runs `cmd` WITHOUT --dry-run.
    // With linear scope, our argv has ['cmd','--dry-run'] → looks SAFE → bypass.
    //
    // Fix: snapshot incoming scope at entry. After these separators, reset to
    // the snapshot — vars set in clauses between separators don't leak. `scope`
    // for clauses BETWEEN `&&`/`;` chains shares state (common `VAR=x && cmd
    // $VAR`). `scope` crosses `||`/`|`/`&` as the pre-structure snapshot only.
    //
    // `&&` and `;` DO carry scope: `VAR=x && cmd $VAR` is sequential, VAR is set.
    //
    // NOTE: `scope` and `varScope` diverge after the first `||`/`|`/`&`. The
    // caller's varScope is only mutated for the `&&`/`;` prefix — this is
    // conservative (vars set in `A && B | C && D` leak A+B into caller, not
    // C+D) but safe.
    //
    // Efficiency: snapshot is only needed if we hit `||`/`|`/`|&`/`&`. For
    // the dominant case (`ls`, `git status` — no such separators), skip the
    // Map alloc via a cheap pre-scan. For `pipeline`, node.type already tells
    // us stages are subshells — copy once at entry, no snapshot needed (each
    // reset uses the entry copy pattern via varScope, which is untouched).
    // isPipeline标记共享工具 ast是否启用对应路径。
    const isPipeline = node.type === 'pipeline'
    // needsSnapshot标记共享工具 ast是否启用对应路径。
    let needsSnapshot = false
    // isPipeline缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!isPipeline) {
      // 按顺序遍历 `node.children` 中的c，逐个交给共享工具处理。
      for (const c of node.children) {
        // 只有 `c && (c.type === '||' || c.type === '&')` 满足时，共享工具才执行该分支。
        if (c && (c.type === '||' || c.type === '&')) {
          // needsSnapshot更新为 `true`，确保Bash 解析工具后续读取最新状态。
          needsSnapshot = true
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }
    }
    // snapshot保存`Map`，供共享工具后续处理使用。
    const snapshot = needsSnapshot ? new Map(varScope) : null
    // For `pipeline`, ALL stages run in subshells — start with a copy so
    // nothing mutates caller's scope. For `list`/`program`, the `&&`/`;`
    // chain mutates caller's scope (sequential); fork only on `||`/`&`.
    // scope保存`Map`，供共享工具后续处理使用。
    let scope = isPipeline ? new Map(varScope) : varScope
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 满足 `SEPARATOR_TYPES.has(child.type)` 时，共享工具执行该分支。
      if (SEPARATOR_TYPES.has(child.type)) {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          child.type === '||' ||
          child.type === '|' ||
          child.type === '|&' ||
          child.type === '&'
        ) {
          // For pipeline: varScope is untouched (we started with a copy).
          // For list/program: snapshot is non-null (pre-scan set it).
          // `|`/`|&` only appear under `pipeline` nodes; `||`/`&` under list.
          // scope更新为 `new Map(snapshot ?? varScope)`，确保Bash 解析工具后续读取最新状态。
          scope = new Map(snapshot ?? varScope)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // err保存`collectCommands`，供共享工具后续处理使用。
      const err = collectCommands(child, commands, scope)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'negated_command'` 时，共享工具执行对应分支。
  if (node.type === 'negated_command') {
    // `! cmd` inverts exit code only — doesn't execute code or affect
    // argv. Recurse into the wrapped command. Common in CI: `! grep err`,
    // `! test -f lock`, `! git diff --quiet`.
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 当 `child.type` 匹配 `'!'` 时，共享工具执行对应分支。
      if (child.type === '!') continue
      // 返回 `collectCommands(child, commands, varScope)`，作为共享工具这次计算的结果。
      return collectCommands(child, commands, varScope)
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'declaration_command'` 时，共享工具执行对应分支。
  if (node.type === 'declaration_command') {
    // `export`/`local`/`readonly`/`declare`/`typeset`. tree-sitter emits
    // these as declaration_command, not command, so they previously fell
    // through to tooComplex. Values are validated via walkVariableAssignment:
    // `$()` in the value is recursively extracted (inner command pushed to
    // commands[], outer argv gets CMDSUB_PLACEHOLDER); other disallowed
    // expansions still reject via walkArgument. argv[0] is the builtin name so
    // `Bash(export:*)` rules match.
    // 命令行参数 从空数组开始收集，后续循环会按处理顺序追加条目。
    const argv: string[] = []
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 按照 child.type 的取值选择共享工具的具体处理分支。
      switch (child.type) {
        case 'export':
        case 'local':
        case 'readonly':
        case 'declare':
        case 'typeset':
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(child.text)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'word':
        case 'number':
        case 'raw_string':
        case 'string':
        case 'concatenation': {
          // Flags (`declare -r`), quoted names (`export "FOO=bar"`), numbers
          // (`declare -i 42`). Mirrors walkCommand's argv handling — before
          // this, `export "FOO=bar"` hit tooComplex on the `string` child.
          // walkArgument validates each (expansions still reject).
          // 当前参数保存`walkArgument`，供共享工具后续处理使用。
          const arg = walkArgument(child, commands, varScope)
          // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
          if (typeof arg !== 'string') return arg
          // SECURITY: declare/typeset/local flags that change assignment
          // semantics break our static model. -n (nameref): `declare -n X=Y`
          // then `$X` dereferences to $Y's VALUE — varScope stores 'Y'
          // (target NAME), argv[0] shows 'Y' while bash runs whatever $Y
          // holds. -i (integer): `declare -i X='a[$(cmd)]'` arithmetically
          // evaluates the RHS at assignment time, running $(cmd) even from
          // a single-quoted raw_string (same primitive walkArithmetic
          // guards in $((…))). -a/-A (array): subscript arithmetic on
          // assignment. -r/-x/-g/-p/-f/-F are inert. Check the resolved
          // arg (not child.text) so `\-n` and quoted `-n` are caught.
          // Scope to declare/typeset/local only: `export -n` means "remove
          // export attribute" (not nameref), and export/readonly don't
          // accept -i; readonly -a/-A rejects subscripted args as invalid
          // identifiers so subscript-arith doesn't fire.
          // 共享工具在这里按实际状态进入对应分支。
          if (
            (argv[0] === 'declare' ||
              argv[0] === 'typeset' ||
              argv[0] === 'local') &&
            /^-[a-zA-Z]*[niaA]/.test(arg)
          ) {
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
            return {
              kind: 'too-complex',
              reason: `declare flag ${arg} changes assignment semantics (nameref/integer/array)`,
              nodeType: 'declaration_command',
            }
          }
          // SECURITY: bare positional assignment with a subscript also
          // evaluates — no -a/-i flag needed. `declare 'x[$(id)]=val'`
          // implicitly creates an array element, arithmetically evaluating
          // the subscript and running $(id). tree-sitter delivers the
          // single-quoted form as a raw_string leaf so walkArgument sees
          // only the literal text. Scoped to declare/typeset/local:
          // export/readonly reject `[` in identifiers before eval.
          // 共享工具在这里按实际状态进入对应分支。
          if (
            (argv[0] === 'declare' ||
              argv[0] === 'typeset' ||
              argv[0] === 'local') &&
            arg[0] !== '-' &&
            /^[^=]*\[/.test(arg)
          ) {
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
            return {
              kind: 'too-complex',
              reason: `declare positional '${arg}' contains array subscript — bash evaluates $(cmd) in subscripts`,
              nodeType: 'declaration_command',
            }
          }
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(arg)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'variable_assignment': {
          // ev保存`walkVariableAssignment`，供共享工具后续处理使用。
          const ev = walkVariableAssignment(child, commands, varScope)
          // 满足 `'kind' in ev` 时，共享工具执行该分支。
          if ('kind' in ev) return ev
          // export/declare assignments populate the scope so later $VAR refs resolve.
          // 调用 applyVarToScope，触发共享工具此处需要的副作用。
          applyVarToScope(varScope, ev)
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(`${ev.name}=${ev.value}`)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'variable_name':
          // `export FOO` — bare name, no assignment.
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(child.text)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        default:
          // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
          return tooComplex(child)
      }
    }
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push({ argv, envVars: [], redirects: [], text: node.text })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'variable_assignment'` 时，共享工具执行对应分支。
  if (node.type === 'variable_assignment') {
    // Bare `VAR=value` at statement level (not a command env prefix).
    // Sets a shell variable — no code execution, no filesystem I/O.
    // The value is validated via walkVariableAssignment → walkArgument,
    // so `VAR=$(evil)` still recursively extracts/rejects based on the
    // inner command. Does NOT push to commands — a bare assignment needs
    // no permission rule (it's inert). Common pattern: `VAR=x && cmd`
    // where cmd references $VAR. ~35% of too-complex in top-5k ant cmds.
    // ev保存`walkVariableAssignment`，供共享工具后续处理使用。
    const ev = walkVariableAssignment(node, commands, varScope)
    // 满足 `'kind' in ev` 时，共享工具执行该分支。
    if ('kind' in ev) return ev
    // Populate scope so later `$VAR` references resolve.
    // 调用 applyVarToScope，触发共享工具此处需要的副作用。
    applyVarToScope(varScope, ev)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'for_statement'` 时，共享工具执行对应分支。
  if (node.type === 'for_statement') {
    // `for VAR in WORD...; do BODY; done` — iterate BODY once per word.
    // Body commands extracted once; every iteration runs the same commands.
    //
    // SECURITY: Loop var is ALWAYS treated as unknown-value (VAR_PLACEHOLDER).
    // Even "static" iteration words can be:
    //  - Absolute paths: `for i in /etc/passwd; do rm $i; done` — body argv
    //    would have placeholder, path validation never sees /etc/passwd.
    //  - Globs: `for i in /etc/*; do rm $i; done` — `/etc/*` is a static word
    //    at parse time but bash expands it at runtime.
    //  - Flags: `for i in -rf /; do rm $i; done` — flag smuggling.
    //
    // VAR_PLACEHOLDER means bare `$i` in body → too-complex. Only
    // string-embedding (`echo "item: $i"`) stays simple. This reverts some
    // of the too-complex→simple rescues in the original PR — each one was a
    // potential path-validation bypass.
    // loopVar初始化为空值，后续分支会在有数据时补齐。
    let loopVar: string | null = null
    // doGroup 命名 `null`，让后续代码直接表达这个值的用途。
    let doGroup: Node | null = null
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 当 `child.type` 匹配 `'variable_name'` 时，共享工具执行对应分支。
      if (child.type === 'variable_name') {
        // loopVar更新为 `child.text`，确保Bash 解析工具后续读取最新状态。
        loopVar = child.text
      // 共享工具 ast在这里处理 `} else if (child.type === 'do_group') {`，完成这一小步状态转换。
      } else if (child.type === 'do_group') {
        // doGroup更新为 `child`，确保Bash 解析工具后续读取最新状态。
        doGroup = child
      // 共享工具 ast在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        child.type === 'for' ||
        child.type === 'in' ||
        child.type === 'select' ||
        child.type === ';'
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue // structural tokens
      // 共享工具 ast在这里处理 `} else if (child.type === 'command_substitution') {`，完成这一小步状态转换。
      } else if (child.type === 'command_substitution') {
        // `for i in $(seq 1 3)` — inner cmd IS extracted and rule-checked.
        // err保存`collectCommandSubstitution`，供共享工具后续处理使用。
        const err = collectCommandSubstitution(child, commands, varScope)
        // 满足 `err` 时，共享工具执行该分支。
        if (err) return err
      } else {
        // Iteration values — validated via walkArgument. Value discarded:
        // body argv gets VAR_PLACEHOLDER regardless of the iteration words,
        // and bare `$i` in body → too-complex (see SECURITY comment above).
        // We still validate to reject e.g. `for i in $(cmd); do ...; done`
        // where the iteration word itself is a disallowed expansion.
        // 当前参数保存`walkArgument`，供共享工具后续处理使用。
        const arg = walkArgument(child, commands, varScope)
        // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof arg !== 'string') return arg
      }
    }
    // 只有 `loopVar === null || doGroup === null) return tooComplex(node` 满足时，共享工具才执行该分支。
    if (loopVar === null || doGroup === null) return tooComplex(node)
    // SECURITY: `for PS4 in '$(id)'; do set -x; :; done` sets PS4 directly
    // via varScope.set below — walkVariableAssignment's PS4/IFS checks never
    // fire. Trace-time RCE (PS4) or word-split bypass (IFS). No legit use.
    // 当 `loopVar` 匹配 `'PS4' || loopVar === 'IFS'` 时，共享工具执行对应分支。
    if (loopVar === 'PS4' || loopVar === 'IFS') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        kind: 'too-complex',
        reason: `${loopVar} as loop variable bypasses assignment validation`,
        nodeType: 'for_statement',
      }
    }
    // SECURITY: Body uses a scope COPY — vars assigned inside the loop
    // body don't leak to commands after `done`. The loop var itself is
    // set in the REAL scope (bash semantics: $i still set after loop)
    // and copied into the body scope. ALWAYS VAR_PLACEHOLDER — see above.
    // varScope.set 写入新的状态值，使共享工具后续读取保持一致。
    varScope.set(loopVar, VAR_PLACEHOLDER)
    // bodyScope保存`Map`，供共享工具后续处理使用。
    const bodyScope = new Map(varScope)
    // 按顺序遍历 `doGroup.children` 中的c，逐个交给共享工具处理。
    for (const c of doGroup.children) {
      // c缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!c) continue
      // 当 `c.type` 匹配 `'do' || c.type === 'done' |...` 时，共享工具执行对应分支。
      if (c.type === 'do' || c.type === 'done' || c.type === ';') continue
      // err保存`collectCommands`，供共享工具后续处理使用。
      const err = collectCommands(c, commands, bodyScope)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 只有 `node.type === 'if_statement' || node.type === 'wh` 满足时，共享工具才执行该分支。
  if (node.type === 'if_statement' || node.type === 'while_statement') {
    // `if COND; then BODY; [elif...; else...;] fi`
    // `while COND; do BODY; done`
    // Extract condition command(s) + all branch/body commands. All get
    // checked against permission rules. `while read VAR` tracks VAR so
    // body can reference $VAR.
    //
    // SECURITY: Branch bodies use scope COPIES — vars assigned inside a
    // conditional branch (which may not execute) must not leak to commands
    // after fi/done. `if false; then T=safe; fi && rm $T` must reject $T.
    // Condition commands use the REAL varScope (they always run for the
    // check, so assignments there are unconditional — e.g., `while read V`
    // tracking must persist to the body copy).
    //
    // tree-sitter if_statement children: if, COND..., then, THEN-BODY...,
    // [elif_clause...], [else_clause], fi. We distinguish condition from
    // then-body by tracking whether we've seen the `then` token.
    // seenThen标记共享工具 ast是否启用对应路径。
    let seenThen = false
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 共享工具在这里按实际状态进入对应分支。
      if (
        child.type === 'if' ||
        child.type === 'fi' ||
        child.type === 'else' ||
        child.type === 'elif' ||
        child.type === 'while' ||
        child.type === 'until' ||
        child.type === ';'
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `child.type` 匹配 `'then'` 时，共享工具执行对应分支。
      if (child.type === 'then') {
        // seenThen更新为 `true`，确保Bash 解析工具后续读取最新状态。
        seenThen = true
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `child.type` 匹配 `'do_group'` 时，共享工具执行对应分支。
      if (child.type === 'do_group') {
        // while body: recurse with scope COPY (body assignments don't leak
        // past done). The COPY contains any `read VAR` tracking from the
        // condition (already in real varScope at this point).
        // bodyScope保存`Map`，供共享工具后续处理使用。
        const bodyScope = new Map(varScope)
        // 按顺序遍历 `child.children` 中的c，逐个交给共享工具处理。
        for (const c of child.children) {
          // c缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!c) continue
          // 当 `c.type` 匹配 `'do' || c.type === 'done' |...` 时，共享工具执行对应分支。
          if (c.type === 'do' || c.type === 'done' || c.type === ';') continue
          // err保存`collectCommands`，供共享工具后续处理使用。
          const err = collectCommands(c, commands, bodyScope)
          // 满足 `err` 时，共享工具执行该分支。
          if (err) return err
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 只有 `child.type === 'elif_clause' || child.type === 'e` 满足时，共享工具才执行该分支。
      if (child.type === 'elif_clause' || child.type === 'else_clause') {
        // elif_clause: elif, cond, ;, then, body... / else_clause: else, body...
        // Scope COPY — elif/else branch assignments don't leak past fi.
        // branchScope保存`Map`，供共享工具后续处理使用。
        const branchScope = new Map(varScope)
        // 按顺序遍历 `child.children` 中的c，逐个交给共享工具处理。
        for (const c of child.children) {
          // c缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!c) continue
          // 共享工具在这里按实际状态进入对应分支。
          if (
            c.type === 'elif' ||
            c.type === 'else' ||
            c.type === 'then' ||
            c.type === ';'
          ) {
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // err保存`collectCommands`，供共享工具后续处理使用。
          const err = collectCommands(c, commands, branchScope)
          // 满足 `err` 时，共享工具执行该分支。
          if (err) return err
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Condition (seenThen=false) or then-body (seenThen=true).
      // Condition uses REAL varScope (always runs). Then-body uses a COPY.
      // Special-case `while read VAR`: after condition `read VAR` is
      // collected, track VAR in the REAL scope so the body COPY inherits it.
      // targetScope保存`Map`，供共享工具后续处理使用。
      const targetScope = seenThen ? new Map(varScope) : varScope
      // before保存 `commands.length` 的判断结果，供共享工具 ast后续分支直接复用。
      const before = commands.length
      // err保存`collectCommands`，供共享工具后续处理使用。
      const err = collectCommands(child, commands, targetScope)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
      // If condition included `read VAR...`, track vars in REAL scope.
      // read var value is UNKNOWN (stdin input) → use VAR_PLACEHOLDER
      // (unknown-value sentinel, string-only).
      // seenThen缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!seenThen) {
        // 循环处理 `let i = before; i < commands.length; i++`，让共享工具逐项把同类条目按顺序走完。
        for (let i = before; i < commands.length; i++) {
          // c保存`commands[i]`，供共享工具 ast后续判断或输出使用。
          const c = commands[i]
          // 当 `c?.argv[0]` 匹配 `'read'` 时，共享工具执行对应分支。
          if (c?.argv[0] === 'read') {
            // 逐项读取 `c.argv.slice(1)` 中的a，按输入顺序推进共享工具。
            for (const a of c.argv.slice(1)) {
              // Skip flags (-r, -d, etc.); track bare identifier args as var names.
              // 只有 `!a.startsWith('-') && /^[A-Za-z_][A-Za-z0-9_]*$/.test(a)` 满足时，共享工具才执行该分支。
              if (!a.startsWith('-') && /^[A-Za-z_][A-Za-z0-9_]*$/.test(a)) {
                // SECURITY: commands[] is a flat accumulator. `true || read
                // VAR` in the condition: the list handler correctly uses a
                // scope COPY for the ||-RHS (may not run), but `read VAR`
                // IS still pushed to commands[] — we can't tell it was
                // scope-isolated from here. Same for `echo | read VAR`
                // (pipeline, subshell in bash) and `(read VAR)` (subshell).
                // Overwriting a tracked literal with VAR_PLACEHOLDER hides
                // path traversal: `VAR=../../etc/passwd && if true || read
                // VAR; then cat "/tmp/$VAR"; fi` — parser would see
                // /tmp/__TRACKED_VAR__, bash reads /etc/passwd. Fail closed
                // when a tracked literal would be overwritten. Safe case
                // (no prior value or already a placeholder) → proceed.
                // existing读取`varScope.get`，供共享工具后续处理使用。
                const existing = varScope.get(a)
                // 共享工具在这里按实际状态进入对应分支。
                if (
                  existing !== undefined &&
                  !containsAnyPlaceholder(existing)
                ) {
                  // 返回结构化结果，集中表达共享工具已经整理出的状态。
                  return {
                    kind: 'too-complex',
                    reason: `'read ${a}' in condition may not execute (||/pipeline/subshell); cannot prove it overwrites tracked literal '${existing}'`,
                    nodeType: 'if_statement',
                  }
                }
                // varScope.set 写入新的状态值，使共享工具后续读取保持一致。
                varScope.set(a, VAR_PLACEHOLDER)
              }
            }
          }
        }
      }
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'subshell'` 时，共享工具执行对应分支。
  if (node.type === 'subshell') {
    // `(cmd1; cmd2)` — run commands in a subshell. Inner commands ARE
    // executed, so extract them for permission checking. Subshell has
    // isolated scope: vars set inside don't leak out. Use a COPY of
    // varScope (outer vars visible, inner changes discarded).
    // innerScope保存`Map`，供共享工具后续处理使用。
    const innerScope = new Map(varScope)
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 当 `child.type` 匹配 `'(' || child.type === ')'` 时，共享工具执行对应分支。
      if (child.type === '(' || child.type === ')') continue
      // err保存`collectCommands`，供共享工具后续处理使用。
      const err = collectCommands(child, commands, innerScope)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'test_command'` 时，共享工具执行对应分支。
  if (node.type === 'test_command') {
    // `[[ EXPR ]]` or `[ EXPR ]` — conditional test. Evaluates to true/false
    // based on file tests (-f, -d), string comparisons (==, !=), etc.
    // No code execution (no command_substitution inside — that would be a
    // child and we'd recurse into it via walkArgument and reject it).
    // Push as a synthetic command with argv[0]='[[' so permission rules
    // can match — `Bash([[ :*)` would be unusual but legal.
    // Walk arguments to validate (no cmdsub/expansion inside operands).
    // 命令行参数 聚合成有序列表，保持后续遍历顺序稳定。
    const argv: string[] = ['[[']
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 当 `child.type` 匹配 `'[[' || child.type === ']]'` 时，共享工具执行对应分支。
      if (child.type === '[[' || child.type === ']]') continue
      // 当 `child.type` 匹配 `'[' || child.type === ']'` 时，共享工具执行对应分支。
      if (child.type === '[' || child.type === ']') continue
      // Recurse into test expression structure: unary_expression,
      // binary_expression, parenthesized_expression, negated_expression.
      // The leaves are test_operator (-f, -d, ==) and operand words.
      // err保存`walkTestExpr`，供共享工具后续处理使用。
      const err = walkTestExpr(child, argv, commands, varScope)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
    }
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push({ argv, envVars: [], redirects: [], text: node.text })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 当 `node.type` 匹配 `'unset_command'` 时，共享工具执行对应分支。
  if (node.type === 'unset_command') {
    // `unset FOO BAR`, `unset -f func`. Safe: only removes shell
    // variables/functions from the current shell — no code execution, no
    // filesystem I/O. tree-sitter emits a dedicated node type so it
    // previously fell through to tooComplex. Children: `unset` keyword,
    // `variable_name` for each name, `word` for flags like `-f`/`-v`.
    // 命令行参数 从空数组开始收集，后续循环会按处理顺序追加条目。
    const argv: string[] = []
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // 按照 child.type 的取值选择共享工具的具体处理分支。
      switch (child.type) {
        case 'unset':
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(child.text)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'variable_name':
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(child.text)
          // SECURITY: unset removes the var from bash's scope. Remove from
          // varScope so subsequent `$VAR` references correctly reject.
          // `VAR=safe && unset VAR && rm $VAR` must NOT resolve $VAR.
          // 调用 varScope.delete，触发共享工具此处需要的副作用。
          varScope.delete(child.text)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'word': {
          // 当前参数保存`walkArgument`，供共享工具后续处理使用。
          const arg = walkArgument(child, commands, varScope)
          // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
          if (typeof arg !== 'string') return arg
          // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
          argv.push(arg)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        default:
          // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
          return tooComplex(child)
      }
    }
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push({ argv, envVars: [], redirects: [], text: node.text })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 `tooComplex(node)`，作为共享工具这次计算的结果。
  return tooComplex(node)
}

/**
 * Recursively walk a test_command expression tree (unary/binary/negated/
 * parenthesized expressions). Leaves are test_operator tokens and operands
 * (word/string/number/etc). Operands are validated via walkArgument.
 */
// walkTestExpr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkTestExpr(
  node: Node,
  argv: string[],
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult | null {
  // 按照 node.type 的取值选择共享工具的具体处理分支。
  switch (node.type) {
    case 'unary_expression':
    case 'binary_expression':
    case 'negated_expression':
    case 'parenthesized_expression': {
      // 按顺序遍历 `node.children` 中的c，逐个交给共享工具处理。
      for (const c of node.children) {
        // c缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!c) continue
        // err保存`walkTestExpr`，供共享工具后续处理使用。
        const err = walkTestExpr(c, argv, innerCommands, varScope)
        // 满足 `err` 时，共享工具执行该分支。
        if (err) return err
      }
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    case 'test_operator':
    case '!':
    case '(':
    case ')':
    case '&&':
    case '||':
    case '==':
    case '=':
    case '!=':
    case '<':
    case '>':
    case '=~':
      // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
      argv.push(node.text)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    case 'regex':
    case 'extglob_pattern':
      // RHS of =~ or ==/!= in [[ ]]. Pattern text only — no code execution.
      // Parser emits these as leaf nodes with no children (any $(...) or ${...}
      // inside the pattern is a sibling, not a child, and is walked separately).
      // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
      argv.push(node.text)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    default: {
      // Operand — word, string, number, etc. Validate via walkArgument.
      // 当前参数保存`walkArgument`，供共享工具后续处理使用。
      const arg = walkArgument(node, innerCommands, varScope)
      // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof arg !== 'string') return arg
      // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
      argv.push(arg)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }
}

/**
 * A `redirected_statement` wraps a command (or pipeline) plus one or more
 * `file_redirect`/`heredoc_redirect` nodes. Extract redirects, walk the
 * inner command, attach redirects to the LAST command (the one whose output
 * is being redirected).
 */
// walkRedirectedStatement 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkRedirectedStatement(
  node: Node,
  commands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult | null {
  // redirects 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const redirects: Redirect[] = []
  // innerCommand 命令数据保存`null`，作为后续空值处理的输入。
  let innerCommand: Node | null = null

  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // 当 `child.type` 匹配 `'file_redirect'` 时，共享工具执行对应分支。
    if (child.type === 'file_redirect') {
      // Thread `commands` so $() in redirect targets (e.g., `> $(mktemp)`)
      // extracts the inner command for permission checking.
      // r保存`walkFileRedirect`，供共享工具后续处理使用。
      const r = walkFileRedirect(child, commands, varScope)
      // 满足 `'kind' in r` 时，共享工具执行该分支。
      if ('kind' in r) return r
      // redirects 集合追加新条目，保持收集顺序与输入顺序一致。
      redirects.push(r)
    // 共享工具 ast在这里处理 `} else if (child.type === 'heredoc_redirect') {`，完成这一小步状态转换。
    } else if (child.type === 'heredoc_redirect') {
      // r保存`walkHeredocRedirect`，供共享工具后续处理使用。
      const r = walkHeredocRedirect(child)
      // 满足 `r` 时，共享工具执行该分支。
      if (r) return r
    // 共享工具 ast在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      child.type === 'command' ||
      child.type === 'pipeline' ||
      child.type === 'list' ||
      child.type === 'negated_command' ||
      child.type === 'declaration_command' ||
      child.type === 'unset_command'
    ) {
      // innerCommand 命令数据更新为 `child`，确保Bash 解析工具后续读取最新状态。
      innerCommand = child
    } else {
      // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
      return tooComplex(child)
    }
  }

  // innerCommand 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!innerCommand) {
    // `> file` alone is valid bash (truncates file). Represent as a command
    // with empty argv so downstream sees the write.
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push({ argv: [], envVars: [], redirects, text: node.text })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // before保存 `commands.length` 的判断结果，供共享工具 ast后续分支直接复用。
  const before = commands.length
  // err保存`collectCommands`，供共享工具后续处理使用。
  const err = collectCommands(innerCommand, commands, varScope)
  // 满足 `err` 时，共享工具执行该分支。
  if (err) return err
  // 只有 `commands.length > before && redirects.length > 0` 满足时，共享工具才执行该分支。
  if (commands.length > before && redirects.length > 0) {
    // last保存 `commands[commands.length - 1]` 的判断结果，供共享工具 ast后续分支直接复用。
    const last = commands[commands.length - 1]
    // 满足 `last) last.redirects.push(...redirects` 时，共享工具执行该分支。
    if (last) last.redirects.push(...redirects)
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Extract operator + target from a `file_redirect` node. The target must be
 * a static word or string.
 */
// walkFileRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkFileRedirect(
  node: Node,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): Redirect | ParseForSecurityResult {
  // op 命名 `null`，让后续代码直接表达这个值的用途。
  let op: Redirect['op'] | null = null
  // target初始化为空值，后续分支会在有数据时补齐。
  let target: string | null = null
  // fd 先占位，稍后的条件分支会根据实际输入补齐它。
  let fd: number | undefined

  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // 当 `child.type` 匹配 `'file_descriptor'` 时，共享工具执行对应分支。
    if (child.type === 'file_descriptor') {
      // fd更新为 `Number(child.text)`，确保Bash 解析工具后续读取最新状态。
      fd = Number(child.text)
    // 共享工具 ast在这里处理 `} else if (child.type in REDIRECT_OPS) {`，完成这一小步状态转换。
    } else if (child.type in REDIRECT_OPS) {
      // op更新为 `REDIRECT_OPS[child.type] ?? null`，确保Bash 解析工具后续读取最新状态。
      op = REDIRECT_OPS[child.type] ?? null
    // 共享工具 ast在这里处理 `} else if (child.type === 'word' || child.type === 'number') {`，完成这一小步状态转换。
    } else if (child.type === 'word' || child.type === 'number') {
      // SECURITY: `number` nodes can contain expansion children via the
      // `NN#<expansion>` arithmetic-base grammar quirk — same issue as
      // walkArgument's number case. `> 10#$(cmd)` runs cmd at runtime.
      // Plain word/number nodes have zero children.
      // 满足 `child.children.length > 0) return tooComplex(child` 时，共享工具执行该分支。
      if (child.children.length > 0) return tooComplex(child)
      // Symmetry with walkArgument (~608): `echo foo > {a,b}` is an
      // ambiguous redirect in bash. tree-sitter actually emits a
      // `concatenation` node for brace targets (caught by the default
      // branch below), but check `word` text too for defense-in-depth.
      // 满足 `BRACE_EXPANSION_RE.test(child.text)) return tooComplex(child` 时，共享工具执行该分支。
      if (BRACE_EXPANSION_RE.test(child.text)) return tooComplex(child)
      // Unescape backslash sequences — same as walkArgument. Bash quote
      // removal turns `\X` → `X`. Without this, `cat < /proc/self/\environ`
      // stores target `/proc/self/\environ` which evades PROC_ENVIRON_RE,
      // but bash reads /proc/self/environ.
      // target更新为 `child.text.replace(/\\(.)/g, '$1')`，确保Bash 解析工具后续读取最新状态。
      target = child.text.replace(/\\(.)/g, '$1')
    // 共享工具 ast在这里处理 `} else if (child.type === 'raw_string') {`，完成这一小步状态转换。
    } else if (child.type === 'raw_string') {
      // target更新为 `stripRawString(child.text)`，确保Bash 解析工具后续读取最新状态。
      target = stripRawString(child.text)
    // 共享工具 ast在这里处理 `} else if (child.type === 'string') {`，完成这一小步状态转换。
    } else if (child.type === 'string') {
      // s 集合保存`walkString`，供共享工具后续处理使用。
      const s = walkString(child, innerCommands, varScope)
      // `typeof s` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof s !== 'string') return s
      // target更新为 `s`，确保Bash 解析工具后续读取最新状态。
      target = s
    // 共享工具 ast在这里处理 `} else if (child.type === 'concatenation') {`，完成这一小步状态转换。
    } else if (child.type === 'concatenation') {
      // `echo > "foo"bar` — tree-sitter produces a concatenation of string +
      // word children. walkArgument already validates concatenation (rejects
      // expansions, checks brace syntax) and returns the joined text.
      // s 集合保存`walkArgument`，供共享工具后续处理使用。
      const s = walkArgument(child, innerCommands, varScope)
      // `typeof s` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof s !== 'string') return s
      // target更新为 `s`，确保Bash 解析工具后续读取最新状态。
      target = s
    } else {
      // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
      return tooComplex(child)
    }
  }

  // 只有 `!op || target === null` 满足时，共享工具才执行该分支。
  if (!op || target === null) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      kind: 'too-complex',
      reason: 'Unrecognized redirect shape',
      nodeType: node.type,
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { op, target, fd }
}

/**
 * Heredoc redirect. Only quoted-delimiter heredocs (<<'EOF') are safe —
 * their bodies are literal text. Unquoted-delimiter heredocs (<<EOF)
 * undergo full parameter/command/arithmetic expansion in the body.
 *
 * SECURITY: tree-sitter-bash has a grammar gap — backticks (`...`) inside
 * an unquoted heredoc body are NOT parsed as command_substitution nodes
 * (body.children is empty, backticks are in body.text). But bash DOES
 * execute them. We cannot safely relax the quoted-delimiter requirement
 * by checking body children for expansion nodes — we'd miss backtick
 * substitution. Keep rejecting all unquoted heredocs. Users should use
 * <<'EOF' to get a literal body, which the model already prefers.
 */
// walkHeredocRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkHeredocRedirect(node: Node): ParseForSecurityResult | null {
  // startText初始化为空值，后续分支会在有数据时补齐。
  let startText: string | null = null
  // 请求体 命名 `null`，让后续代码直接表达这个值的用途。
  let body: Node | null = null

  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // 当 `child.type` 匹配 `'heredoc_start'` 时，共享工具执行对应分支。
    if (child.type === 'heredoc_start') startText = child.text
    else if (child.type === 'heredoc_body') body = child
    else if (
      child.type === '<<' ||
      child.type === '<<-' ||
      child.type === 'heredoc_end' ||
      child.type === 'file_descriptor'
    ) {
      // expected structural tokens — safe to skip. file_descriptor
      // covers fd-prefixed heredocs (`cat 3<<'EOF'`) — walkFileRedirect
      // already treats it as a benign structural token.
    } else {
      // SECURITY: tree-sitter places pipeline / command / file_redirect /
      // && / etc. as children of heredoc_redirect when they follow the
      // delimiter on the same line (e.g. `ls <<'EOF' | rm x`). Previously
      // these were silently skipped, hiding the piped command from
      // permission checks. Fail closed like every other walker.
      // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
      return tooComplex(child)
    }
  }

  // isQuoted 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isQuoted =
    startText !== null &&
    ((startText.startsWith("'") && startText.endsWith("'")) ||
      (startText.startsWith('"') && startText.endsWith('"')) ||
      startText.startsWith('\\'))

  // isQuoted缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isQuoted) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      kind: 'too-complex',
      reason: 'Heredoc with unquoted delimiter undergoes shell expansion',
      nodeType: 'heredoc_redirect',
    }
  }

  // 满足 `body` 时，共享工具执行该分支。
  if (body) {
    // 按顺序遍历 `body.children` 中的child，逐个交给共享工具处理。
    for (const child of body.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue
      // `child.type` 与 `'heredoc_content'` 不一致时刷新派生状态，避免使用过期结果。
      if (child.type !== 'heredoc_content') {
        // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
        return tooComplex(child)
      }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Here-string redirect (`<<< content`). The content becomes stdin — not
 * argv, not a path. Safe when content is a literal word, raw_string, or
 * string with no expansions. Reject when content contains $()/${}/$VAR —
 * those execute arbitrary code or inject runtime values.
 *
 * Reuses walkArgument for content validation: it already rejects
 * command_substitution, expansion, and (for strings) simple_expansion
 * unless the var is tracked/safe. The result string is discarded — we only
 * care that it's statically resolvable.
 *
 * NOTE: `VAR=$(cmd) && cat <<< "$VAR"` would be safe in principle (inner
 * cmd is extracted separately, herestring content is stdin) but is
 * currently rejected conservatively — walkString's solo-placeholder guard
 * fires because it has no awareness of herestring vs argv context.
 */
// walkHerestringRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkHerestringRedirect(
  node: Node,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult | null {
  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // 当 `child.type` 匹配 `'<<<'` 时，共享工具执行对应分支。
    if (child.type === '<<<') continue
    // Content node: reuse walkArgument. It returns a string on success
    // (which we discard — content is stdin, irrelevant to permissions) or
    // a too-complex result on failure (expansion found, unresolvable var).
    // 文本内容保存`walkArgument`，供共享工具后续处理使用。
    const content = walkArgument(child, innerCommands, varScope)
    // `typeof content` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof content !== 'string') return content
    // Herestring content is discarded (not in argv/envVars/redirects) but
    // remains in .text via raw node.text. Scan it here so checkSemantics's
    // NEWLINE_HASH invariant (bashPermissions.ts relies on it) still holds.
    // 满足 `NEWLINE_HASH_RE.test(content)) return tooComplex(child` 时，共享工具执行该分支。
    if (NEWLINE_HASH_RE.test(content)) return tooComplex(child)
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Walk a `command` node and extract argv. Children appear in order:
 * [variable_assignment...] command_name [argument...] [file_redirect...]
 * Any child type not explicitly handled triggers too-complex.
 */
// walkCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkCommand(
  node: Node,
  extraRedirects: Redirect[],
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult {
  // 命令行参数 从空数组开始收集，后续循环会按处理顺序追加条目。
  const argv: string[] = []
  // envVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const envVars: { name: string; value: string }[] = []
  // redirects 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const redirects: Redirect[] = [...extraRedirects]

  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue

    // 按照 child.type 的取值选择共享工具的具体处理分支。
    switch (child.type) {
      case 'variable_assignment': {
        // ev保存`walkVariableAssignment`，供共享工具后续处理使用。
        const ev = walkVariableAssignment(child, innerCommands, varScope)
        // 满足 `'kind' in ev` 时，共享工具执行该分支。
        if ('kind' in ev) return ev
        // SECURITY: Env-prefix assignments (`VAR=x cmd`) are command-local in
        // bash — VAR is only visible to `cmd` as an env var, NOT to
        // subsequent commands. Do NOT add to global varScope — that would
        // let `VAR=safe cmd1 && rm $VAR` resolve $VAR when bash has unset it.
        // envVars 集合追加新条目，保持收集顺序与输入顺序一致。
        envVars.push({ name: ev.name, value: ev.value })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'command_name': {
        // 当前参数保存`walkArgument`，供共享工具后续处理使用。
        const arg = walkArgument(
          child.children[0] ?? child,
          innerCommands,
          varScope,
        )
        // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof arg !== 'string') return arg
        // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
        argv.push(arg)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'word':
      case 'number':
      case 'raw_string':
      case 'string':
      case 'concatenation':
      case 'arithmetic_expansion': {
        // 当前参数保存`walkArgument`，供共享工具后续处理使用。
        const arg = walkArgument(child, innerCommands, varScope)
        // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof arg !== 'string') return arg
        // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
        argv.push(arg)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // NOTE: command_substitution as a BARE argument (not inside a string)
      // is intentionally NOT handled here — the $() output IS the argument,
      // and for path-sensitive commands (cd, rm, chmod) the placeholder would
      // hide the real path from downstream checks. `cd $(echo /etc)` must
      // stay too-complex so the path-check can't be bypassed. $() inside
      // strings ("Timer: $(date)") is handled in walkString where the output
      // is embedded in a longer string (safer).
      case 'simple_expansion': {
        // Bare `$VAR` as an argument. Tracked static vars return the ACTUAL
        // value (e.g. VAR=/etc → '/etc'). Values with IFS/glob chars or
        // placeholders reject. See resolveSimpleExpansion.
        // v读取`resolveSimpleExpansion`，供共享工具后续处理使用。
        const v = resolveSimpleExpansion(child, varScope, false)
        // `typeof v` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof v !== 'string') return v
        // 命令行参数追加新条目，保持收集顺序与输入顺序一致。
        argv.push(v)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'file_redirect': {
        // r保存`walkFileRedirect`，供共享工具后续处理使用。
        const r = walkFileRedirect(child, innerCommands, varScope)
        // 满足 `'kind' in r` 时，共享工具执行该分支。
        if ('kind' in r) return r
        // redirects 集合追加新条目，保持收集顺序与输入顺序一致。
        redirects.push(r)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      case 'herestring_redirect': {
        // `cmd <<< "content"` — content is stdin, not argv. Validate it's
        // literal (no expansion); discard the content string.
        // err保存`walkHerestringRedirect`，供共享工具后续处理使用。
        const err = walkHerestringRedirect(child, innerCommands, varScope)
        // 满足 `err` 时，共享工具执行该分支。
        if (err) return err
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      default:
        // 返回 `tooComplex(child)`，作为共享工具这次计算的结果。
        return tooComplex(child)
    }
  }

  // .text is the raw source span. Downstream (bashToolCheckPermission →
  // splitCommand_DEPRECATED) re-tokenizes it via shell-quote. Normally .text
  // is used unchanged — but if we resolved a $VAR into argv, .text diverges
  // (has raw `$VAR`) and downstream RULE MATCHING would miss deny rules.
  //
  // SECURITY: `SUB=push && git $SUB --force` with `Bash(git push:*)` deny:
  //   argv = ['git', 'push', '--force']  ← correct, path validation sees 'push'
  //   .text = 'git $SUB --force'         ← deny rule 'git push:*' doesn't match
  //
  // Detection: any `$<identifier>` in node.text means a simple_expansion was
  // resolved (or we'd have returned too-complex). This catches $VAR at any
  // position — command_name, word, string interior, concatenation part.
  // `$(...)` doesn't match (paren, not identifier start). `'$VAR'` in single
  // quotes: tree-sitter's .text includes the quotes, so a naive check would
  // FP on `echo '$VAR'`. But single-quoted $ is LITERAL in bash — argv has
  // the literal `$VAR` string, so rebuilding from argv produces `'$VAR'`
  // anyway (shell-escape wraps it). Same net .text. No rule-matching error.
  //
  // Rebuild .text from argv. Shell-escape each arg: single-quote wrap with
  // `'\''` for embedded single quotes. Empty string, metacharacters, and
  // placeholders all get quoted. Downstream shell-quote re-parse is correct.
  //
  // NOTE: This does NOT include redirects/envVars in the rebuilt .text —
  // walkFileRedirect rejects simple_expansion, and envVars aren't used for
  // rule matching. If either changes, this rebuild must include them.
  //
  // SECURITY: also rebuild when node.text contains a newline. Line
  // continuations `<space>\<LF>` are invisible to argv (tree-sitter collapses
  // them) but preserved in node.text. `timeout 5 \<LF>curl evil.com` → argv
  // is correct, but raw .text → stripSafeWrappers matches `timeout 5 ` (the
  // space before \), leaving `\<LF>curl evil.com` — Bash(curl:*) deny doesn't
  // prefix-match. Rebuilt .text joins argv with ' ' → no newlines →
  // stripSafeWrappers works. Also covers heredoc-body leakage.
  // text 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const text =
    /\$[A-Za-z_]/.test(node.text) || node.text.includes('\n')
      ? argv
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(a =>
            a === '' || /["'\\ \t\n$`;|&<>(){}*?[\]~#]/.test(a)
              ? `'${a.replace(/'/g, "'\\''")}'`
              : a,
          )
          .join(' ')
      : node.text
  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    kind: 'simple',
    commands: [{ argv, envVars, redirects, text }],
  }
}

/**
 * Recurse into a command_substitution node's inner command(s). If the inner
 * command(s) parse cleanly (simple), add them to the innerCommands
 * accumulator and return null (success). If the inner command is itself
 * too-complex (e.g., nested arith expansion, process sub), return the error.
 * This enables recursive permission checking: `echo $(git rev-parse HEAD)`
 * extracts BOTH `echo $(git rev-parse HEAD)` (outer) AND `git rev-parse HEAD`
 * (inner) — permission rules must match BOTH for the whole command to allow.
 */
// collectCommandSubstitution 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function collectCommandSubstitution(
  csNode: Node,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): ParseForSecurityResult | null {
  // Vars set BEFORE the $() are visible inside (bash subshell semantics),
  // but vars set INSIDE don't leak out. Pass a COPY of the outer scope so
  // inner assignments don't mutate the outer map.
  // innerScope保存`Map`，供共享工具后续处理使用。
  const innerScope = new Map(varScope)
  // command_substitution children: `$(` or `` ` ``, inner statement(s), `)`
  // 按顺序遍历 `csNode.children` 中的child，逐个交给共享工具处理。
  for (const child of csNode.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // 当 `child.type` 匹配 `'$(' || child.type === '`' ...` 时，共享工具执行对应分支。
    if (child.type === '$(' || child.type === '`' || child.type === ')') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // err保存`collectCommands`，供共享工具后续处理使用。
    const err = collectCommands(child, innerCommands, innerScope)
    // 满足 `err` 时，共享工具执行该分支。
    if (err) return err
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Convert an argument node to its literal string value. Quotes are resolved.
 * This function implements the argument-position allowlist.
 */
// walkArgument 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkArgument(
  node: Node | null,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): string | ParseForSecurityResult {
  // node缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!node) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'too-complex', reason: 'Null argument node' }
  }

  // 按照 node.type 的取值选择共享工具的具体处理分支。
  switch (node.type) {
    case 'word': {
      // Unescape backslash sequences. In unquoted context, bash's quote
      // removal turns `\X` → `X` for any character X. tree-sitter preserves
      // the raw text. Required for checkSemantics: `\eval` must match
      // EVAL_LIKE_BUILTINS, `\zmodload` must match ZSH_DANGEROUS_BUILTINS.
      // Also makes argv accurate: `find -exec {} \;` → argv has `;` not
      // `\;`. (Deny-rule matching on .text already worked via downstream
      // splitCommand_DEPRECATED unescaping — see walkCommand comment.) `\<whitespace>`
      // is already rejected by BACKSLASH_WHITESPACE_RE.
      // 满足 `BRACE_EXPANSION_RE.test(node.text)` 时，共享工具执行该分支。
      if (BRACE_EXPANSION_RE.test(node.text)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          kind: 'too-complex',
          reason: 'Word contains brace expansion syntax',
          nodeType: 'word',
        }
      }
      // 返回 `node.text.replace(/\\(.)/g, '$1')`，作为共享工具这次计算的结果。
      return node.text.replace(/\\(.)/g, '$1')
    }

    case 'number':
      // SECURITY: tree-sitter-bash parses `NN#<expansion>` (arithmetic base
      // syntax) as a `number` node with the expansion as a CHILD. `10#$(cmd)`
      // is a number node whose .text is the full literal but whose child is a
      // command_substitution — bash runs the substitution. .text on a node
      // with children would smuggle the expansion past permission checks.
      // Plain numbers (`10`, `16#ff`) have zero children.
      // 满足 `node.children.length > 0` 时，共享工具执行该分支。
      if (node.children.length > 0) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          kind: 'too-complex',
          reason: 'Number node contains expansion (NN# arithmetic base syntax)',
          nodeType: node.children[0]?.type,
        }
      }
      // 返回 `node.text`，作为共享工具这次计算的结果。
      return node.text

    case 'raw_string':
      // 返回 `stripRawString(node.text)`，作为共享工具这次计算的结果。
      return stripRawString(node.text)

    case 'string':
      // 返回 `walkString(node, innerCommands, varScope)`，作为共享工具这次计算的结果。
      return walkString(node, innerCommands, varScope)

    case 'concatenation': {
      // 满足 `BRACE_EXPANSION_RE.test(node.text)` 时，共享工具执行该分支。
      if (BRACE_EXPANSION_RE.test(node.text)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          kind: 'too-complex',
          reason: 'Brace expansion',
          nodeType: 'concatenation',
        }
      }
      // 结果 命名 `''`，让后续代码直接表达这个值的用途。
      let result = ''
      // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
      for (const child of node.children) {
        // child缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!child) continue
        // part保存`walkArgument`，供共享工具后续处理使用。
        const part = walkArgument(child, innerCommands, varScope)
        // `typeof part` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof part !== 'string') return part
        // 共享工具 ast在这里处理 `result += part`，完成这一小步状态转换。
        result += part
      }
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    case 'arithmetic_expansion': {
      // err保存`walkArithmetic`，供共享工具后续处理使用。
      const err = walkArithmetic(node)
      // 满足 `err` 时，共享工具执行该分支。
      if (err) return err
      // 返回 `node.text`，作为共享工具这次计算的结果。
      return node.text
    }

    case 'simple_expansion': {
      // `$VAR` inside a concatenation (e.g., `prefix$VAR`). Same rules
      // as the bare case in walkCommand: must be tracked or SAFE_ENV_VARS.
      // inside-concatenation counts as bare arg (the whole concat IS the arg)
      // 返回 `resolveSimpleExpansion(node, varScope, false)`，作为共享工具这次计算的结果。
      return resolveSimpleExpansion(node, varScope, false)
    }

    // NOTE: command_substitution at arg position (bare or inside concatenation)
    // is intentionally NOT handled — the output is/becomes-part-of a positional
    // argument which might be a path or flag. `rm $(foo)` or `rm $(foo)bar`
    // would hide the real path behind the placeholder. Only $() inside a
    // `string` node (walkString) is extracted, since the output is embedded
    // in a longer string rather than BEING the argument.

    default:
      // 返回 `tooComplex(node)`，作为共享工具这次计算的结果。
      return tooComplex(node)
  }
}

/**
 * Extract literal content from a double-quoted string node. A `string` node's
 * children are `"` delimiters, `string_content` literals, and possibly
 * expansion nodes.
 *
 * tree-sitter quirk: literal newlines inside double quotes are NOT included
 * in `string_content` node text. bash preserves them. For `"a\nb"`,
 * tree-sitter produces two `string_content` children (`"a"`, `"b"`) with the
 * newline in neither. For `"\n#"`, it produces ONE child (`"#"`) with the
 * leading newline eaten. Concatenating children therefore loses newlines.
 *
 * Fix: track child `startIndex` and insert one `\n` per index gap. The gap
 * between children IS the dropped newline(s). This makes the argv value
 * match what bash actually sees.
 */
// walkString 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function walkString(
  node: Node,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): string | ParseForSecurityResult {
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // cursor 命名 `-1`，让后续代码直接表达这个值的用途。
  let cursor = -1
  // SECURITY: Track whether the string contains a runtime-unknown
  // placeholder ($() output or unknown-value tracked var) vs any literal
  // content. A string that is ONLY a placeholder (`"$(cmd)"`, `"$VAR"`
  // where VAR holds an unknown sentinel) produces an argv element that IS
  // the placeholder — which downstream path validation resolves as a
  // relative filename within cwd, bypassing the check. `cd "$(echo /etc)"`
  // would pass validation but runtime-cd into /etc. We reject
  // solo-placeholder strings; placeholders mixed with literal content
  // (`"prefix: $(cmd)"`) are safe — runtime value can't equal a bare path.
  // sawDynamicPlaceholder标记共享工具 ast是否启用对应路径。
  let sawDynamicPlaceholder = false
  // sawLiteralContent标记共享工具 ast是否启用对应路径。
  let sawLiteralContent = false
  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // child缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!child) continue
    // Index gap between this child and the previous one = dropped newline(s).
    // Ignore the gap before the first non-delimiter child (cursor === -1).
    // Skip gap-fill for `"` delimiters: a gap before the closing `"` is the
    // tree-sitter whitespace-only-string quirk (space/tab, not newline) — let
    // the Fix C check below catch it as too-complex instead of mis-filling
    // with `\n` and diverging from bash.
    // `cursor` 与 `-1 && child.startIndex > cursor...` 不一致时刷新派生状态，避免使用过期结果。
    if (cursor !== -1 && child.startIndex > cursor && child.type !== '"') {
      // 共享工具 ast在这里处理 `result += '\n'.repeat(child.startIndex - cursor)`，完成这一小步状态转换。
      result += '\n'.repeat(child.startIndex - cursor)
      // sawLiteralContent更新为 `true`，确保Bash 解析工具后续读取最新状态。
      sawLiteralContent = true
    }
    // cursor更新为 `child.endIndex`，确保Bash 解析工具后续读取最新状态。
    cursor = child.endIndex
    // 按照 child.type 的取值选择共享工具的具体处理分支。
    switch (child.type) {
      case '"':
        // Reset cursor after opening quote so the gap between `"` and the
        // first content child is captured.
        // cursor更新为 `child.endIndex`，确保Bash 解析工具后续读取最新状态。
        cursor = child.endIndex
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'string_content':
        // Bash double-quote escape rules (NOT the generic /\\(.)/g used for
        // unquoted words in walkArgument): inside "...", a backslash only
        // escapes $ ` " \ — other sequences like \n stay literal. So
        // `"fix \"bug\""` → `fix "bug"`, but `"a\nb"` → `a\nb` (backslash
        // kept). tree-sitter preserves the raw escapes in .text; we resolve
        // them here so argv matches what bash actually passes.
        // 共享工具 ast在这里处理 `result += child.text.replace(/\\([$`"\\])/g, '$1')`，完成这一小步状态转换。
        result += child.text.replace(/\\([$`"\\])/g, '$1')
        sawLiteralContent = true
        break
      case DOLLAR:
        // A bare dollar sign before closing quote or a non-name char is
        // literal in bash. tree-sitter emits it as a standalone node.
        result += DOLLAR
        sawLiteralContent = true
        break
      case 'command_substitution': {
        // Carve-out: `$(cat <<'EOF' ... EOF)` is safe. The quoted-delimiter
        // heredoc body is literal (no expansion), and `cat` just prints it.
        // The substitution result is therefore a known static string. This
        // pattern is the idiomatic way to pass multi-line content to tools
        // like `gh pr create --body`. We replace the substitution with a
        // placeholder argv value — the actual content doesn't matter for
        // permission checking, only that it IS static.
        const heredocBody = extractSafeCatHeredoc(child)
        if (heredocBody === 'DANGEROUS') return tooComplex(child)
        if (heredocBody !== null) {
          // SECURITY: the body IS the substitution result. Previously we
          // dropped it → `rm "$(cat <<'EOF'\n/etc/passwd\nEOF)"` produced
          // argv ['rm',''] while bash runs `rm /etc/passwd`. validatePath('')
          // resolves to cwd → allowed. Every path-constrained command
          // bypassed via this. Now: append the body (trailing LF trimmed —
          // bash $() strips trailing newlines).
          //
          // Tradeoff: bodies with internal newlines are multi-line text
          // (markdown, scripts) which cannot be valid paths — safe to drop
          // to avoid NEWLINE_HASH_RE false positives on `## Summary`. A
          // single-line body (like `/etc/passwd`) MUST go into argv so
          // downstream path validation sees the real target.
          const trimmed = heredocBody.replace(/\n+$/, '')
          if (trimmed.includes('\n')) {
            sawLiteralContent = true
            break
          }
          result += trimmed
          sawLiteralContent = true
          break
        }
        // General $() inside "...": recurse into inner command(s). If they
        // parse cleanly, they become additional subcommands that the
        // permission system must match rules against. The outer argv gets
        // the original $() text as placeholder (runtime-determined value).
        // `echo "SHA: $(git rev-parse HEAD)"` → extracts BOTH
        // `echo "SHA: $(...)"` AND `git rev-parse HEAD` — both must match
        // permission rules. ~27% of too-complex in top-5k ant cmds.
        const err = collectCommandSubstitution(child, innerCommands, varScope)
        if (err) return err
        result += CMDSUB_PLACEHOLDER
        sawDynamicPlaceholder = true
        break
      }
      case 'simple_expansion': {
        // `$VAR` inside "...". Tracked/safe vars resolve; untracked reject.
        const v = resolveSimpleExpansion(child, varScope, true)
        if (typeof v !== 'string') return v
        // VAR_PLACEHOLDER = runtime-unknown (loop var, read var, $() output,
        // SAFE_ENV_VARS, special vars). Any other string = actual literal
        // value from a tracked static var (e.g. VAR=/tmp → v='/tmp').
        if (v === VAR_PLACEHOLDER) sawDynamicPlaceholder = true
        else sawLiteralContent = true
        result += v
        break
      }
      case 'arithmetic_expansion': {
        const err = walkArithmetic(child)
        if (err) return err
        result += child.text
        // Validated to be literal-numeric — static content.
        sawLiteralContent = true
        break
      }
      default:
        // expansion (${...}) inside "..."
        return tooComplex(child)
    }
  }
  // SECURITY: Reject solo-placeholder strings. `"$(cmd)"` or `"$VAR"` (where
  // VAR holds an unknown value) would produce an argv element that IS the
  // placeholder — which bypasses downstream path validation (validatePath
  // resolves placeholders as relative filenames within cwd). Only allow
  // placeholders embedded alongside literal content (`"prefix: $(cmd)"`).
  if (sawDynamicPlaceholder && !sawLiteralContent) {
    return tooComplex(node)
  }
  // SECURITY: tree-sitter-bash quirk — a double-quoted string containing
  // ONLY whitespace (` "`, `" "`, `"\t"`) produces NO string_content child;
  // the whitespace is attributed to the closing `"` node's text. Our loop
  // only adds to `result` from string_content/expansion children, so we'd
  // return "" when bash sees " ". Detect: we saw no content children
  // (both flags false — neither literal nor placeholder added) but the
  // source span is longer than bare `""`. Genuine `""` has text.length==2.
  // `"$V"` with V="" doesn't hit this — the simple_expansion child sets
  // sawLiteralContent via the `else` branch even when v is empty.
  // 组合条件 `!sawLiteralContent && !sawDynamicPlaceholder && n` 成立时，共享工具才启用这条专门路径。
  if (!sawLiteralContent && !sawDynamicPlaceholder && node.text.length > 2) {
    // 返回 tooComplex(node)，把共享工具这个分支的结果交还调用方。
    return tooComplex(node)
  }
  // 返回 result，把共享工具这个分支的结果交还调用方。
  return result
}

/**
 * Safe leaf nodes inside arithmetic expansion: integer literals (decimal,
 * hex, octal, bash base#digits) and operator/paren tokens. Anything else at
 * leaf position (notably variable_name that isn't a numeric literal) rejects.
 */
// ARITH_LEAF_RE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const ARITH_LEAF_RE =
  /^(?:[0-9]+|0[xX][0-9a-fA-F]+|[0-9]+#[0-9a-zA-Z]+|[-+*/%^&|~!<>=?:(),]+|<<|>>|\*\*|&&|\|\||[<>=!]=|\$\(\(|\)\))$/

/**
 * Recursively validate an arithmetic_expansion node. Allows only literal
 * numeric expressions — no variables, no substitutions. Returns null if
 * safe, or a too-complex result if not.
 *
 * Variables are rejected because bash arithmetic recursively evaluates
 * variable values: if x='a[$(cmd)]' then $((x)) executes cmd. See
 * https://www.vidarholen.net/contents/blog/?p=716 (arithmetic injection).
 *
 * When safe, the caller puts the full `$((…))` span into argv as a literal
 * string. bash will expand it to an integer at runtime; the static string
 * won't match any sensitive path/deny patterns.
 */
// walkArithmetic 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function walkArithmetic(node: Node): ParseForSecurityResult | null {
  // 遍历 const child of node.children，让共享工具逐项完成同一类处理。
  for (const child of node.children) {
    // 判断 !child，将共享工具分流到只适用于该条件的处理路径。
    if (!child) continue
    // child.children为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (child.children.length === 0) {
      // 判断 !ARITH_LEAF_RE.test(child.text)，将共享工具分流到只适用于该条件的处理路径。
      if (!ARITH_LEAF_RE.test(child.text)) {
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          kind: 'too-complex',
          reason: `Arithmetic expansion references variable or non-literal: ${child.text}`,
          nodeType: 'arithmetic_expansion',
        }
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 按照 child.type 的取值选择共享工具的具体处理分支。
    switch (child.type) {
      case 'binary_expression':
      case 'unary_expression':
      case 'ternary_expression':
      case 'parenthesized_expression': {
        // err保存`walkArithmetic`，供共享工具后续处理使用。
        const err = walkArithmetic(child)
        // 判断 err，将共享工具分流到只适用于该条件的处理路径。
        if (err) return err
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      default:
        // 返回 tooComplex(child)，把共享工具这个分支的结果交还调用方。
        return tooComplex(child)
    }
  }
  // 返回 null，把共享工具这个分支的结果交还调用方。
  return null
}

/**
 * Check if a command_substitution node is exactly `$(cat <<'DELIM'...DELIM)`
 * and return the heredoc body if so. Any deviation (extra args to cat,
 * unquoted delimiter, additional commands) returns null.
 *
 * tree-sitter structure:
 *   command_substitution
 *     $(
 *     redirected_statement
 *       command → command_name → word "cat"    (exactly one child)
 *       heredoc_redirect
 *         <<
 *         heredoc_start 'DELIM'                (quoted)
 *         heredoc_body                         (pure heredoc_content)
 *         heredoc_end
 *     )
 */
// extractSafeCatHeredoc 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function extractSafeCatHeredoc(subNode: Node): string | 'DANGEROUS' | null {
  // Expect exactly: $( + one redirected_statement + )
  // stmt保存`null`，供共享工具 ast后续步骤使用。
  let stmt: Node | null = null
  // 遍历 const child of subNode.children，让共享工具逐项完成同一类处理。
  for (const child of subNode.children) {
    // 判断 !child，将共享工具分流到只适用于该条件的处理路径。
    if (!child) continue
    // 判断 child.type === '$(' || child.type === ')'，将共享工具分流到只适用于该条件的处理路径。
    if (child.type === '$(' || child.type === ')') continue
    // 组合条件 `child.type === 'redirected_statement' && stmt ===` 成立时，共享工具才启用这条专门路径。
    if (child.type === 'redirected_statement' && stmt === null) {
      // stmt更新为 `child`，确保Bash 解析后续读取最新状态。
      stmt = child
    } else {
      // 返回 null，把共享工具这个分支的结果交还调用方。
      return null
    }
  }
  // 判断 !stmt，将共享工具分流到只适用于该条件的处理路径。
  if (!stmt) return null

  // redirected_statement must be: command(cat) + heredoc_redirect (quoted)
  // sawCat记录当前扫描状态，共享工具 ast随后按该状态分支。
  let sawCat = false
  // body保存`null`，供共享工具 ast后续步骤使用。
  let body: string | null = null
  // 遍历 const child of stmt.children，让共享工具逐项完成同一类处理。
  for (const child of stmt.children) {
    // 判断 !child，将共享工具分流到只适用于该条件的处理路径。
    if (!child) continue
    // `child.type` 命中特定值 `'command'` 时，进入共享工具对应处理。
    if (child.type === 'command') {
      // Must be bare `cat` — no args, no env vars
      // cmdChildren 命令数据筛选`children.filter`，供共享工具后续处理使用。
      const cmdChildren = child.children.filter(c => c)
      // 判断 cmdChildren.length !== 1，将共享工具分流到只适用于该条件的处理路径。
      if (cmdChildren.length !== 1) return null
      // nameNode保存`cmdChildren[0]`，供共享工具 ast后续步骤使用。
      const nameNode = cmdChildren[0]
      // `nameNode?.type` 与 `'command_name' || nameNode.tex` 不一致时刷新派生状态。
      if (nameNode?.type !== 'command_name' || nameNode.text !== 'cat') {
        // 返回 null，把共享工具这个分支的结果交还调用方。
        return null
      }
      // sawCat更新为 `true`，确保Bash 解析后续读取最新状态。
      sawCat = true
    // `child.type === 'heredoc_redirect'` 成立时，共享工具 ast切换到这个 else-if 分支。
    } else if (child.type === 'heredoc_redirect') {
      // Reuse the existing validator: quoted delimiter, body is pure text.
      // walkHeredocRedirect returns null on success, non-null on rejection.
      // 判断 walkHeredocRedirect(child) !== null，将共享工具分流到只适用于该条件的处理路径。
      if (walkHeredocRedirect(child) !== null) return null
      // 遍历 const hc of child.children，让共享工具逐项完成同一类处理。
      for (const hc of child.children) {
        // 判断 hc?.type === 'heredoc_body'，将共享工具分流到只适用于该条件的处理路径。
        if (hc?.type === 'heredoc_body') body = hc.text
      }
    } else {
      // 返回 null，把共享工具这个分支的结果交还调用方。
      return null
    }
  }

  // 判断 !sawCat || body === null，将共享工具分流到只适用于该条件的处理路径。
  if (!sawCat || body === null) return null
  // SECURITY: the heredoc body becomes the outer command's argv value via
  // substitution, so a body like `/proc/self/environ` is semantically
  // `cat /proc/self/environ`. checkSemantics never sees the body (we drop it
  // at the walkString call site to avoid newline+# FPs). Returning `null`
  // here would fall through to collectCommandSubstitution in walkString,
  // which would extract the inner `cat` via walkHeredocRedirect (body text
  // not inspected there) — effectively bypassing this check. Return a
  // distinct sentinel so the caller can reject instead of falling through.
  // 判断 PROC_ENVIRON_RE.test(body)，将共享工具分流到只适用于该条件的处理路径。
  if (PROC_ENVIRON_RE.test(body)) return 'DANGEROUS'
  // Same for jq system(): checkSemantics checks argv but never sees the
  // heredoc body. Check unconditionally (we don't know the outer command).
  // 判断 /\bsystem\s*\(/.test(body)，将共享工具分流到只适用于该条件的处理路径。
  if (/\bsystem\s*\(/.test(body)) return 'DANGEROUS'
  // 返回 body，把共享工具这个分支的结果交还调用方。
  return body
}

// walkVariableAssignment 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function walkVariableAssignment(
  node: Node,
  innerCommands: SimpleCommand[],
  varScope: Map<string, string>,
): { name: string; value: string; isAppend: boolean } | ParseForSecurityResult {
  // name保存`null`，供共享工具 ast后续步骤使用。
  let name: string | null = null
  // 取值保存`''`，供共享工具 ast后续步骤使用。
  let value = ''
  // isAppend记录当前扫描状态，共享工具 ast随后按该状态分支。
  let isAppend = false

  // 遍历 const child of node.children，让共享工具逐项完成同一类处理。
  for (const child of node.children) {
    // 判断 !child，将共享工具分流到只适用于该条件的处理路径。
    if (!child) continue
    // `child.type` 命中特定值 `'variable_name'` 时，进入共享工具对应处理。
    if (child.type === 'variable_name') {
      // name更新为 `child.text`，确保Bash 解析后续读取最新状态。
      name = child.text
    // `child.type === '=' || child.type === '+='` 成立时，共享工具 ast切换到这个 else-if 分支。
    } else if (child.type === '=' || child.type === '+=') {
      // `PATH+=":/new"` — tree-sitter emits `+=` as a distinct operator
      // node. Without this case it falls through to walkArgument below
      // → tooComplex on unknown type `+=`.
      // isAppend更新为 `child.type === '+='`，确保Bash 解析后续读取最新状态。
      isAppend = child.type === '+='
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    // `child.type === 'command_substitution'` 成立时，共享工具 ast切换到这个 else-if 分支。
    } else if (child.type === 'command_substitution') {
      // $() as the variable's value. The output becomes a STRING stored in
      // the variable — it's NOT a positional argument (no path/flag concern).
      // `VAR=$(date)` runs `date`, stores output. `VAR=$(rm -rf /)` runs
      // `rm` — the inner command IS checked against permission rules, so
      // `rm` must match a rule. The variable just holds whatever `rm` prints.
      // err保存`collectCommandSubstitution`，供共享工具后续处理使用。
      const err = collectCommandSubstitution(child, innerCommands, varScope)
      // 判断 err，将共享工具分流到只适用于该条件的处理路径。
      if (err) return err
      // 取值更新为 `CMDSUB_PLACEHOLDER`，确保Bash 解析后续读取最新状态。
      value = CMDSUB_PLACEHOLDER
    // `child.type === 'simple_expansion'` 成立时，共享工具 ast切换到这个 else-if 分支。
    } else if (child.type === 'simple_expansion') {
      // `VAR=$OTHER` — assignment RHS does NOT word-split or glob-expand
      // in bash (unlike command arguments). So `A="a b"; B=$A` sets B to
      // the literal "a b". Resolve as if inside a string (insideString=true)
      // so BARE_VAR_UNSAFE_RE doesn't over-reject. The resulting value may
      // contain spaces/globs — if B is later used as a bare arg, THAT use
      // will correctly reject via BARE_VAR_UNSAFE_RE.
      // v读取`resolveSimpleExpansion`，供共享工具后续处理使用。
      const v = resolveSimpleExpansion(child, varScope, true)
      // 判断 typeof v !== 'string'，将共享工具分流到只适用于该条件的处理路径。
      if (typeof v !== 'string') return v
      // If v is VAR_PLACEHOLDER (OTHER holds unknown), store it — combined
      // with containsAnyPlaceholder in the caller to treat as unknown.
      // 取值更新为 `v`，确保Bash 解析后续读取最新状态。
      value = v
    } else {
      // v保存`walkArgument`，供共享工具后续处理使用。
      const v = walkArgument(child, innerCommands, varScope)
      // 判断 typeof v !== 'string'，将共享工具分流到只适用于该条件的处理路径。
      if (typeof v !== 'string') return v
      // 取值更新为 `v`，确保Bash 解析后续读取最新状态。
      value = v
    }
  }

  // 满足 `name === null` 时，共享工具执行该分支。
  if (name === null) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Variable assignment without name',
      nodeType: 'variable_assignment',
    }
  }
  // SECURITY: tree-sitter-bash accepts invalid var names (e.g. `1VAR=value`)
  // as variable_assignment. Bash only recognizes [A-Za-z_][A-Za-z0-9_]* —
  // anything else is run as a COMMAND. `1VAR=value` → bash tries to execute
  // `1VAR=value` from PATH. We must not treat it as an inert assignment.
  // 判断 !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)，将共享工具分流到只适用于该条件的处理路径。
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: `Invalid variable name (bash treats as command): ${name}`,
      nodeType: 'variable_assignment',
    }
  }
  // SECURITY: Setting IFS changes word-splitting behavior for subsequent
  // unquoted $VAR expansions. `IFS=: && VAR=a:b && rm $VAR` → bash splits
  // on `:` → `rm a b`. Our BARE_VAR_UNSAFE_RE only checks default IFS
  // chars (space/tab/NL) — we can't model custom IFS. Reject.
  // `name` 命中特定值 `'IFS'` 时，进入共享工具对应处理。
  if (name === 'IFS') {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'IFS assignment changes word-splitting — cannot model statically',
      nodeType: 'variable_assignment',
    }
  }
  // SECURITY: PS4 is expanded via promptvars (default on) on every command
  // traced after `set -x`. A raw_string value containing $(cmd) or `cmd`
  // executes at trace time: `PS4='$(id)' && set -x && :` runs id, but our
  // argv is only [["set","-x"],[":"]] — the payload is invisible to
  // permission checks. PS0-3 and PROMPT_COMMAND are not expanded in
  // non-interactive shells (BashTool).
  //
  // ALLOWLIST, not blocklist. 5 rounds of bypass patches taught us that a
  // value-dependent blocklist is structurally fragile:
  //   - `+=` effective-value computation diverges from bash in multiple
  //     scope-model gaps: `||` reset, env-prefix chain (PS4='' && PS4='$'
  //     PS4+='(id)' cmd reads stale parent value), subshell.
  //   - bash's decode_prompt_string runs BEFORE promptvars, so `\044(id)`
  //     (octal for `$`) becomes `$(id)` at trace time — any literal-char
  //     check must model prompt-escape decoding exactly.
  //   - assignment paths exist outside walkVariableAssignment (for_statement
  //     sets loopVar directly, see that handler's PS4 check).
  //
  // Policy: (1) reject += outright — no scope-tracking dependency; user can
  // combine into one PS4=... (2) reject placeholders — runtime unknowable.
  // (3) allowlist remaining value: ${identifier} refs (value-read only, safe)
  // plus [A-Za-z0-9 _+:.\/=[\]-]. No bare `$` (blocks split primitive), no
  // `\` (blocks octal \044/\140), no backtick, no parens. Covers all known
  // encoding vectors and future ones — anything off the allowlist fails.
  // Legit `PS4='+${BASH_SOURCE}:${LINENO}: '` still passes.
  // `name` 命中特定值 `'PS4'` 时，进入共享工具对应处理。
  if (name === 'PS4') {
    // 满足 `isAppend` 时，共享工具执行该分支。
    if (isAppend) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        kind: 'too-complex',
        reason:
          'PS4 += cannot be statically verified — combine into a single PS4= assignment',
        nodeType: 'variable_assignment',
      }
    }
    // 判断 containsAnyPlaceholder(value)，将共享工具分流到只适用于该条件的处理路径。
    if (containsAnyPlaceholder(value)) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        kind: 'too-complex',
        reason: 'PS4 value derived from cmdsub/variable — runtime unknowable',
        nodeType: 'variable_assignment',
      }
    }
    // 共享工具在这里进入条件判断，后续代码按实际状态分流。
    if (
      !/^[A-Za-z0-9 _+:./=[\]-]*$/.test(
        value.replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, ''),
      )
    ) {
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        kind: 'too-complex',
        reason:
          'PS4 value outside safe charset — only ${VAR} refs and [A-Za-z0-9 _+:.=/[]-] allowed',
        nodeType: 'variable_assignment',
      }
    }
  }
  // SECURITY: Tilde expansion in assignment RHS. `VAR=~/x` (unquoted) →
  // bash expands `~` at ASSIGNMENT time → VAR='/home/user/x'. We see the
  // literal `~/x`. Later `cd $VAR` → our argv `['cd','~/x']`, bash runs
  // `cd /home/user/x`. Tilde expansion also happens after `=` and `:` in
  // assignment values (e.g. PATH=~/bin:~/sbin). We can't model it — reject
  // any value containing `~` that isn't already quoted-literal (where bash
  // doesn't expand). Conservative: any `~` in value → reject.
  // 判断 value.includes('~')，将共享工具分流到只适用于该条件的处理路径。
  if (value.includes('~')) {
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      kind: 'too-complex',
      reason: 'Tilde in assignment value — bash may expand at assignment time',
      nodeType: 'variable_assignment',
    }
  }
  // 返回 { name, value, isAppend }，把共享工具这个分支的结果交还调用方。
  return { name, value, isAppend }
}

/**
 * Resolve a `simple_expansion` ($VAR) node. Returns VAR_PLACEHOLDER if
 * resolvable, too-complex otherwise.
 *
 * @param insideString true when $VAR is inside a `string` node ("...$VAR...")
 *   rather than a bare/concatenation argument. SAFE_ENV_VARS and unknown-value
 *   tracked vars are only allowed inside strings — as bare args their runtime
 *   value IS the argument and we don't know it statically.
 *   `cd $HOME/../x` would hide the real path behind the placeholder;
 *   `echo "Home: $HOME"` just embeds text in a string. Tracked vars holding
 *   STATIC strings (VAR=literal) are allowed in both positions since their
 *   value IS known.
 */
// resolveSimpleExpansion 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function resolveSimpleExpansion(
  node: Node,
  varScope: Map<string, string>,
  insideString: boolean,
): string | ParseForSecurityResult {
  // varName保存`null`，供共享工具 ast后续步骤使用。
  let varName: string | null = null
  // isSpecial记录当前扫描状态，共享工具 ast随后按该状态分支。
  let isSpecial = false
  // 遍历 const c of node.children，让共享工具逐项完成同一类处理。
  for (const c of node.children) {
    // `c?.type` 命中特定值 `'variable_name'` 时，进入共享工具对应处理。
    if (c?.type === 'variable_name') {
      // varName更新为 `c.text`，确保Bash 解析后续读取最新状态。
      varName = c.text
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // `c?.type` 命中特定值 `'special_variable_name'` 时，进入共享工具对应处理。
    if (c?.type === 'special_variable_name') {
      // varName更新为 `c.text`，确保Bash 解析后续读取最新状态。
      varName = c.text
      // isSpecial更新为 `true`，确保Bash 解析后续读取最新状态。
      isSpecial = true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 判断 varName === null) return tooComplex(node，将共享工具分流到只适用于该条件的处理路径。
  if (varName === null) return tooComplex(node)
  // Tracked vars: check stored value. Literal strings (VAR=/tmp) are
  // returned DIRECTLY so downstream path validation sees the real path.
  // Non-literal values (containing any placeholder — loop vars, $() output,
  // read vars, composites like `VAR="prefix$(cmd)"`) are ONLY safe inside
  // strings; as bare args they'd hide the runtime path/flag from validation.
  //
  // SECURITY: Returning the actual trackedValue (not a placeholder) is the
  // critical fix. `VAR=/etc && rm $VAR` → argv ['rm', '/etc'] → validatePath
  // correctly rejects. Previously returned a placeholder → validatePath saw
  // '__LOOP_STATIC__', resolved as cwd-relative → PASSED → bypass.
  // trackedValue读取`varScope.get`，供共享工具后续处理使用。
  const trackedValue = varScope.get(varName)
  // `trackedValue` 与 `undefined` 不一致时刷新派生状态。
  if (trackedValue !== undefined) {
    // 判断 containsAnyPlaceholder(trackedValue)，将共享工具分流到只适用于该条件的处理路径。
    if (containsAnyPlaceholder(trackedValue)) {
      // Non-literal: bare → reject, inside string → VAR_PLACEHOLDER
      // (walkString's solo-placeholder gate rejects `"$VAR"` alone).
      // 判断 !insideString) return tooComplex(node，将共享工具分流到只适用于该条件的处理路径。
      if (!insideString) return tooComplex(node)
      // 返回 VAR_PLACEHOLDER，把共享工具这个分支的结果交还调用方。
      return VAR_PLACEHOLDER
    }
    // Pure literal (e.g. '/tmp', 'foo') — return it directly. Downstream
    // path validation / checkSemantics operate on the REAL value.
    //
    // SECURITY: For BARE args (not inside a string), bash word-splits on
    // $IFS and glob-expands the result. `VAR="-rf /" && rm $VAR` → bash
    // runs `rm -rf /` (two args); `VAR="/etc/*" && cat $VAR` → expands to
    // all files. Reject values containing IFS/glob chars unless in "...".
    //
    // SECURITY: Empty value as bare arg. Bash word-splitting on "" produces
    // ZERO fields — the expansion disappears. `V="" && $V eval x` → bash
    // runs `eval x` (our argv would be ["","eval","x"] with name="" —
    // every EVAL_LIKE/ZSH/keyword check misses). `V="" && ls $V /etc` →
    // bash runs `ls /etc`, our argv has a phantom "" shifting positions.
    // Inside "...": `"$V"` → bash produces one empty-string arg → our ""
    // is correct, keep allowing.
    // insideString缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!insideString) {
      // 判断 trackedValue === '') return tooComplex(node，将共享工具分流到只适用于该条件的处理路径。
      if (trackedValue === '') return tooComplex(node)
      // 判断 BARE_VAR_UNSAFE_RE.test(trackedValue)) return tooComplex(node，将共享工具分流到只适用于该条件的处理路径。
      if (BARE_VAR_UNSAFE_RE.test(trackedValue)) return tooComplex(node)
    }
    // 返回 trackedValue，把共享工具这个分支的结果交还调用方。
    return trackedValue
  }
  // SAFE_ENV_VARS + special vars ($?, $$, $@, $1, etc.): value unknown
  // (shell-controlled). Only safe when embedded in a string, NOT as a
  // bare argument to a path-sensitive command.
  // 满足 `insideString` 时，共享工具执行该分支。
  if (insideString) {
    // 判断 SAFE_ENV_VARS.has(varName)，将共享工具分流到只适用于该条件的处理路径。
    if (SAFE_ENV_VARS.has(varName)) return VAR_PLACEHOLDER
    // 共享工具在这里进入条件判断，后续代码按实际状态分流。
    if (
      isSpecial &&
      (SPECIAL_VAR_NAMES.has(varName) || /^[0-9]+$/.test(varName))
    ) {
      // 返回 VAR_PLACEHOLDER，把共享工具这个分支的结果交还调用方。
      return VAR_PLACEHOLDER
    }
  }
  // 返回 tooComplex(node)，把共享工具这个分支的结果交还调用方。
  return tooComplex(node)
}

/**
 * Apply a variable assignment to the scope, handling `+=` append semantics.
 * SECURITY: If EITHER side (existing value or appended value) contains a
 * placeholder, the result is non-literal — store VAR_PLACEHOLDER so later
 * $VAR correctly rejects as bare arg.
 * `VAR=/etc && VAR+=$(cmd)` must not leave VAR looking static.
 */
// applyVarToScope 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function applyVarToScope(
  varScope: Map<string, string>,
  ev: { name: string; value: string; isAppend: boolean },
): void {
  // existing读取`varScope.get`，供共享工具后续处理使用。
  const existing = varScope.get(ev.name) ?? ''
  // combined保存`ev.isAppend ? existing + ev.value : ev.value`，供共享工具 ast后续步骤使用。
  const combined = ev.isAppend ? existing + ev.value : ev.value
  // varScope.set写入新的状态值，使共享工具后续读取保持一致。
  varScope.set(
    ev.name,
    containsAnyPlaceholder(combined) ? VAR_PLACEHOLDER : combined,
  )
}

// stripRawString 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function stripRawString(text: string): string {
  // 返回 text.slice(1, -1)，把共享工具这个分支的结果交还调用方。
  return text.slice(1, -1)
}

// tooComplex 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
function tooComplex(node: Node): ParseForSecurityResult {
  // reason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const reason =
    node.type === 'ERROR'
      ? 'Parse error'
      : DANGEROUS_TYPES.has(node.type)
        ? `Contains ${node.type}`
        : `Unhandled node type: ${node.type}`
  // 返回 { kind: 'too-complex', reason, nodeType: node.type }，把共享工具这个分支的结果交还调用方。
  return { kind: 'too-complex', reason, nodeType: node.type }
}

// ────────────────────────────────────────────────────────────────────────────
// Post-argv semantic checks
//
// Everything above answers "can we tokenize?". Everything below answers
// "is the resulting argv dangerous in ways that don't involve parsing?".
// These are checks on argv[0] or argv content that the old bashSecurity.ts
// validators performed but which have nothing to do with parser
// differentials. They're here (not in bashSecurity.ts) because they operate
// on SimpleCommand and need to run for every extracted command.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Zsh module builtins. These are not binaries on PATH — they're zsh
 * internals loaded via zmodload. Since BashTool runs via the user's default
 * shell (often zsh), and these parse as plain `command` nodes with no
 * distinguishing syntax, we can only catch them by name.
 */
// ZSH_DANGEROUS_BUILTINS 集合保存`Set`，供共享工具后续处理使用。
const ZSH_DANGEROUS_BUILTINS = new Set([
  'zmodload',
  'emulate',
  'sysopen',
  'sysread',
  'syswrite',
  'sysseek',
  'zpty',
  'ztcp',
  'zsocket',
  'zf_rm',
  'zf_mv',
  'zf_ln',
  'zf_chmod',
  'zf_chown',
  'zf_mkdir',
  'zf_rmdir',
  'zf_chgrp',
])

/**
 * Shell builtins that evaluate their arguments as code or otherwise escape
 * the argv abstraction. A command like `eval "rm -rf /"` has argv
 * ['eval', 'rm -rf /'] which looks inert to flag validation but executes
 * the string. Treat these the same as command substitution.
 */
// EVAL_LIKE_BUILTINS 集合保存`Set`，供共享工具后续处理使用。
const EVAL_LIKE_BUILTINS = new Set([
  'eval',
  'source',
  '.',
  'exec',
  'command',
  'builtin',
  'fc',
  // `coproc rm -rf /` spawns rm as a coprocess. tree-sitter parses it as
  // a plain command with argv[0]='coproc', so permission rules and path
  // validation would check 'coproc' not 'rm'.
  'coproc',
  // Zsh precommand modifiers: `noglob cmd args` runs cmd with globbing off.
  // They parse as ordinary commands (noglob is argv[0], the real command is
  // argv[1]) so permission matching against argv[0] would see 'noglob', not
  // the wrapped command.
  'noglob',
  'nocorrect',
  // `trap 'cmd' SIGNAL` — cmd runs as shell code on signal/exit. EXIT fires
  // at end of every BashTool invocation, so this is guaranteed execution.
  'trap',
  // `enable -f /path/lib.so name` — dlopen arbitrary .so as a builtin.
  // Native code execution.
  'enable',
  // `mapfile -C callback -c N` / `readarray -C callback` — callback runs as
  // shell code every N input lines.
  'mapfile',
  'readarray',
  // `hash -p /path cmd` — poisons bash's command-lookup cache. Subsequent
  // `cmd` in the same command resolves to /path instead of PATH lookup.
  'hash',
  // `bind -x '"key":cmd'` / `complete -C cmd` — interactive-only callbacks
  // but still code-string arguments. Low impact in non-interactive BashTool
  // shells, blocked for consistency. `compgen -C cmd` is NOT interactive-only:
  // it immediately executes the -C argument to generate completions.
  'bind',
  'complete',
  'compgen',
  // `alias name='cmd'` — aliases not expanded in non-interactive bash by
  // default, but `shopt -s expand_aliases` enables them. Also blocked as
  // defense-in-depth (alias followed by name use in same command).
  'alias',
  // `let EXPR` arithmetically evaluates EXPR — identical to $(( EXPR )).
  // Array subscripts in the expression expand $(cmd) at eval time even when
  // the argument arrived single-quoted: `let 'x=a[$(id)]'` executes id.
  // tree-sitter sees the raw_string as an opaque leaf. Same primitive
  // walkArithmetic guards, but `let` is a plain command node.
  'let',
])

/**
 * Builtins that re-parse a NAME operand internally and arithmetically
 * evaluate `arr[EXPR]` subscripts — including $(cmd) in the subscript —
 * even when the argv element arrived from a single-quoted raw_string.
 * `test -v 'a[$(id)]'` → tree-sitter sees an opaque leaf, bash runs id.
 * Maps: builtin name → set of flags whose next argument is a NAME.
 */
// SUBSCRIPT_EVAL_FLAGS 集合集中保存共享工具 ast要一起传递的字段。
const SUBSCRIPT_EVAL_FLAGS: Record<string, Set<string>> = {
  test: new Set(['-v', '-R']),
  '[': new Set(['-v', '-R']),
  '[[': new Set(['-v', '-R']),
  printf: new Set(['-v']),
  read: new Set(['-a']),
  unset: new Set(['-v']),
  // bash 5.1+: `wait -p VAR [id...]` stores the waited PID into VAR. When VAR
  // is `arr[EXPR]`, bash arithmetically evaluates the subscript — running
  // $(cmd) even from a single-quoted raw_string. Verified bash 5.3.9:
  // `: & wait -p 'a[$(id)]' %1` executes id.
  wait: new Set(['-p']),
}

/**
 * `[[ ARG1 OP ARG2 ]]` where OP is an arithmetic comparison. bash manual:
 * "When used with [[, Arg1 and Arg2 are evaluated as arithmetic
 * expressions." Arithmetic evaluation recursively expands array subscripts,
 * so `[[ 'a[$(id)]' -eq 0 ]]` executes `id` even though tree-sitter sees
 * the operand as an opaque raw_string leaf. Unlike -v/-R (unary, NAME after
 * flag), these are binary — the subscript can appear on EITHER side, so
 * SUBSCRIPT_EVAL_FLAGS's "next arg" logic is insufficient.
 * `[` / `test` are not vulnerable (bash errors with "integer expression
 * expected"), but the test_command handler normalizes argv[0]='[[' for
 * both forms, so they get this check too — mild over-blocking, safe side.
 */
// TEST_ARITH_CMP_OPS 集合保存`Set`，供共享工具后续处理使用。
const TEST_ARITH_CMP_OPS = new Set(['-eq', '-ne', '-lt', '-le', '-gt', '-ge'])

/**
 * Builtins where EVERY non-flag positional argument is a NAME that bash
 * re-parses and arithmetically evaluates subscripts on — no flag required.
 * `read 'a[$(id)]'` executes id: each positional is a variable name to
 * assign into, and `arr[EXPR]` is valid syntax there. `unset NAME...` is
 * the same (though tree-sitter's unset_command handler currently rejects
 * raw_string children before reaching here — this is defense-in-depth).
 * NOT printf (positional args are FORMAT/data), NOT test/[ (operands are
 * values, only -v/-R take a NAME). declare/typeset/local handled in
 * declaration_command since they never reach here as plain commands.
 */
// BARE_SUBSCRIPT_NAME_BUILTINS 集合保存`Set`，供共享工具后续处理使用。
const BARE_SUBSCRIPT_NAME_BUILTINS = new Set(['read', 'unset'])

/**
 * `read` flags whose NEXT argument is data (prompt/delimiter/count/fd),
 * not a NAME. `read -p '[foo] ' var` must not trip on the `[` in the
 * prompt string. `-a` is intentionally absent — its operand IS a NAME.
 */
// READ_DATA_FLAGS 集合保存`Set`，供共享工具后续处理使用。
const READ_DATA_FLAGS = new Set(['-p', '-d', '-n', '-N', '-t', '-u', '-i'])

// SHELL_KEYWORDS imported from bashParser.ts — shell reserved words can never
// be legitimate argv[0]; if they appear, the parser mis-parsed a compound
// command. Reject to avoid nonsense argv reaching downstream.

// Use `.*` not `[^/]*` — Linux resolves `..` in procfs, so
// `/proc/self/../self/environ` works and must be caught.
// PROC_ENVIRON_RE保存`/\/proc\/.*\/environ/`，供共享工具 ast后续步骤使用。
const PROC_ENVIRON_RE = /\/proc\/.*\/environ/

/**
 * Newline followed by `#` in an argv element, env var value, or redirect target.
 * Downstream stripSafeWrappers re-tokenizes .text line-by-line and treats `#`
 * after a newline as a comment, hiding arguments that follow.
 */
// NEWLINE_HASH_RE保存`/\n[ \t]*#/`，供共享工具 ast后续步骤使用。
const NEWLINE_HASH_RE = /\n[ \t]*#/

// SemanticCheckResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SemanticCheckResult = { ok: true } | { ok: false; reason: string }

/**
 * Post-argv semantic checks. Run after parseForSecurity returns 'simple' to
 * catch commands that tokenize fine but are dangerous by name or argument
 * content. Returns the first failure or {ok: true}.
 */
// checkSemantics 承担共享工具中的独立步骤，串起共享工具 ast需要的输入整理、状态更新和结果输出。
export function checkSemantics(commands: SimpleCommand[]): SemanticCheckResult {
  // 遍历 const cmd of commands，让共享工具逐项完成同一类处理。
  for (const cmd of commands) {
    // Strip safe wrapper commands (nohup, time, timeout N, nice -n N) so
    // `nohup eval "..."` and `timeout 5 jq 'system(...)'` are checked
    // against the wrapped command, not the wrapper. Inlined here to avoid
    // circular import with bashPermissions.ts.
    // a保存`cmd.argv`，供共享工具 ast后续步骤使用。
    let a = cmd.argv
    // 遍历 ;;，让共享工具逐项完成同一类处理。
    for (;;) {
      // `a[0]` 命中特定值 `'time' || a[0] === 'nohup'` 时，进入共享工具对应处理。
      if (a[0] === 'time' || a[0] === 'nohup') {
        // a更新为 `a.slice(1)`，确保Bash 解析后续读取最新状态。
        a = a.slice(1)
      // `a[0] === 'timeout'` 成立时，共享工具 ast切换到这个 else-if 分支。
      } else if (a[0] === 'timeout') {
        // `timeout 5`, `timeout 5s`, `timeout 5.5`, plus optional GNU flags
        // preceding the duration. Long: --foreground, --kill-after=N,
        // --signal=SIG, --preserve-status. Short: -k DUR, -s SIG, -v (also
        // fused: -k5, -sTERM).
        // SECURITY (SAST Mar 2026): the previous loop only skipped `--long`
        // flags, so `timeout -k 5 10 eval ...` broke out with name='timeout'
        // and the wrapped eval was never checked. Now handle known short
        // flags AND fail closed on any unrecognized flag — an unknown flag
        // means we can't locate the wrapped command, so we must not silently
        // fall through to name='timeout'.
        // i保存`1`，供共享工具 ast后续步骤使用。
        let i = 1
        // while 使用 i < a.length 完成共享工具里的对应操作。
        while (i < a.length) {
          // arg保存`a[i]!`，供共享工具 ast后续步骤使用。
          const arg = a[i]!
          // 共享工具在这里进入条件判断，后续代码按实际状态分流。
          if (
            arg === '--foreground' ||
            arg === '--preserve-status' ||
            arg === '--verbose'
          ) {
            // 共享工具 ast处理 `i++ // known no-value long flags`，完成这一小步状态转换。
            i++ // known no-value long flags
          // `/^--(?:kill-after|signal)=[A-Za-z0-9_.+-]+$/.test(arg)` 成立时，共享工具 ast切换到这个 else-if 分支。
          } else if (/^--(?:kill-after|signal)=[A-Za-z0-9_.+-]+$/.test(arg)) {
            // 共享工具 ast处理 `i++ // --kill-after=5, --signal=TERM (value fused with =)`，完成这一小步状态转换。
            i++ // --kill-after=5, --signal=TERM (value fused with =)
          // 共享工具 ast处理 `} else if (`，完成这一小步状态转换。
          } else if (
            (arg === '--kill-after' || arg === '--signal') &&
            a[i + 1] &&
            /^[A-Za-z0-9_.+-]+$/.test(a[i + 1]!)
          ) {
            // 共享工具 ast处理 `i += 2 // --kill-after 5, --signal TERM (space-separated)`，完成这一小步状态转换。
            i += 2 // --kill-after 5, --signal TERM (space-separated)
          // `arg.startsWith('--')` 成立时，共享工具 ast切换到这个 else-if 分支。
          } else if (arg.startsWith('--')) {
            // Unknown long flag, OR --kill-after/--signal with non-allowlisted
            // value (e.g. placeholder from $() substitution). Fail closed.
            // 返回 {，把共享工具这个分支的结果交还调用方。
            return {
              ok: false,
              reason: `timeout with ${arg} flag cannot be statically analyzed`,
            }
          // `arg === '-v'` 成立时，共享工具 ast切换到这个 else-if 分支。
          } else if (arg === '-v') {
            // 共享工具 ast处理 `i++ // --verbose, no argument`，完成这一小步状态转换。
            i++ // --verbose, no argument
          // 共享工具 ast处理 `} else if (`，完成这一小步状态转换。
          } else if (
            (arg === '-k' || arg === '-s') &&
            a[i + 1] &&
            /^[A-Za-z0-9_.+-]+$/.test(a[i + 1]!)
          ) {
            // 共享工具 ast处理 `i += 2 // -k DURATION / -s SIGNAL — separate value`，完成这一小步状态转换。
            i += 2 // -k DURATION / -s SIGNAL — separate value
          // `/^-[ks][A-Za-z0-9_.+-]+$/.test(arg)` 成立时，共享工具 ast切换到这个 else-if 分支。
          } else if (/^-[ks][A-Za-z0-9_.+-]+$/.test(arg)) {
            // 共享工具 ast处理 `i++ // fused: -k5, -sTERM`，完成这一小步状态转换。
            i++ // fused: -k5, -sTERM
          // `arg.startsWith('-')` 成立时，共享工具 ast切换到这个 else-if 分支。
          } else if (arg.startsWith('-')) {
            // Unknown flag OR -k/-s with non-allowlisted value — can't locate
            // wrapped cmd. Reject, don't fall through to name='timeout'.
            // 返回 {，把共享工具这个分支的结果交还调用方。
            return {
              ok: false,
              reason: `timeout with ${arg} flag cannot be statically analyzed`,
            }
          } else {
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break // non-flag — should be the duration
          }
        }
        // 判断 a[i] && /^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)，将共享工具分流到只适用于该条件的处理路径。
        if (a[i] && /^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)) {
          // a更新为 `a.slice(i + 1)`，确保Bash 解析后续读取最新状态。
          a = a.slice(i + 1)
        // `a[i]` 成立时，共享工具 ast切换到这个 else-if 分支。
        } else if (a[i]) {
          // SECURITY (PR #21503 round 3): a[i] exists but doesn't match our
          // duration regex. GNU timeout parses via xstrtod() (libc strtod) and
          // accepts `.5`, `+5`, `5e-1`, `inf`, `infinity`, hex floats — none
          // of which match `/^\d+(\.\d+)?[smhd]?$/`. Empirically verified:
          // `timeout .5 echo ok` works. Previously this branch `break`ed
          // (fail-OPEN) so `timeout .5 eval "id"` with `Bash(timeout:*)` left
          // name='timeout' and eval was never checked. Now fail CLOSED —
          // consistent with the unknown-FLAG handling above (lines ~1895,1912).
          // 返回 {，把共享工具这个分支的结果交还调用方。
          return {
            ok: false,
            reason: `timeout duration '${a[i]}' cannot be statically analyzed`,
          }
        } else {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break // no more args — `timeout` alone, inert
        }
      // `a[0] === 'nice'` 成立时，共享工具 ast切换到这个 else-if 分支。
      } else if (a[0] === 'nice') {
        // `nice cmd`, `nice -n N cmd`, `nice -N cmd` (legacy). All run cmd
        // at a lower priority. argv[0] check must see the wrapped cmd.
        // 判断 a[1] === '-n' && a[2] && /^-?\d+$/.test(a[2])，将共享工具分流到只适用于该条件的处理路径。
        if (a[1] === '-n' && a[2] && /^-?\d+$/.test(a[2])) {
          // a更新为 `a.slice(3)`，确保Bash 解析后续读取最新状态。
          a = a.slice(3)
        // `a[1] && /^-\d+$/.test(a[1])` 成立时，共享工具 ast切换到这个 else-if 分支。
        } else if (a[1] && /^-\d+$/.test(a[1])) {
          // a更新为 `a.slice(2) // `nice -10 cmd``，确保Bash 解析后续读取最新状态。
          a = a.slice(2) // `nice -10 cmd`
        // `a[1] && /[$(`]/.test(a[1])` 成立时，共享工具 ast切换到这个 else-if 分支。
        } else if (a[1] && /[$(`]/.test(a[1])) {
          // SECURITY: walkArgument returns node.text for arithmetic_expansion,
          // so `nice $((0-5)) jq ...` has a[1]='$((0-5))'. Bash expands it to
          // '-5' (legacy nice syntax) and execs jq; we'd slice(1) here and
          // set name='$((0-5))' which skips the jq system() check entirely.
          // Fail closed — mirrors the timeout-duration fail-closed above.
          return {
            ok: false,
            reason: `nice argument '${a[1]}' contains expansion — cannot statically determine wrapped command`,
          }
        } else {
          a = a.slice(1) // bare `nice cmd`
        }
      } else if (a[0] === 'env') {
        // `env [VAR=val...] [-i] [-0] [-v] [-u NAME...] cmd args` runs cmd.
        // argv[0] check must see cmd, not env. Skip known-safe forms only.
        // SECURITY: -S splits a string into argv (mini-shell) — must reject.
        // -C/-P change cwd/PATH — wrapped cmd runs elsewhere, reject.
        // Any OTHER flag → reject (fail-closed, not fail-open to name='env').
        let i = 1
        while (i < a.length) {
          const arg = a[i]!
          if (arg.includes('=') && !arg.startsWith('-')) {
            i++ // VAR=val assignment
          } else if (arg === '-i' || arg === '-0' || arg === '-v') {
            i++ // flags with no argument
          } else if (arg === '-u' && a[i + 1]) {
            i += 2 // -u NAME unsets; takes one arg
          } else if (arg.startsWith('-')) {
            // -S (argv splitter), -C (altwd), -P (altpath), --anything,
            // or unknown flag. Can't model — reject the whole command.
            return {
              ok: false,
              reason: `env with ${arg} flag cannot be statically analyzed`,
            }
          } else {
            break // the wrapped command
          }
        }
        if (i < a.length) {
          a = a.slice(i)
        } else {
          break // `env` alone (no wrapped cmd) — inert, name='env'
        }
      } else if (a[0] === 'stdbuf') {
        // `stdbuf -o0 cmd` (fused), `stdbuf -o 0 cmd` (space-separated),
        // multiple flags (`stdbuf -o0 -eL cmd`), long forms (`--output=0`).
        // SECURITY: previous handling only stripped ONE flag and fell through
        // to slice(2) for anything unrecognized, so `stdbuf --output 0 eval`
        // → ['0','eval',...] → name='0' hid eval. Now iterate all known flag
        // forms and fail closed on any unknown flag.
        let i = 1
        while (i < a.length) {
          const arg = a[i]!
          if (STDBUF_SHORT_SEP_RE.test(arg) && a[i + 1]) {
            i += 2 // -o MODE (space-separated)
          } else if (STDBUF_SHORT_FUSED_RE.test(arg)) {
            i++ // -o0 (fused)
          } else if (STDBUF_LONG_RE.test(arg)) {
            i++ // --output=MODE (fused long)
          } else if (arg.startsWith('-')) {
            // --output MODE (space-separated long) or unknown flag. GNU
            // stdbuf long options use `=` syntax, but getopt_long also
            // accepts space-separated — we can't enumerate safely, reject.
            return {
              ok: false,
              reason: `stdbuf with ${arg} flag cannot be statically analyzed`,
            }
          } else {
            break // the wrapped command
          }
        }
        if (i > 1 && i < a.length) {
          a = a.slice(i)
        } else {
          break // `stdbuf` with no flags or no wrapped cmd — inert
        }
      } else {
        break
      }
    }
    const name = a[0]
    if (name === undefined) continue

    // SECURITY: Empty command name. Quoted empty (`"" cmd`) is harmless —
    // bash tries to exec "" and fails with "command not found". But an
    // UNQUOTED empty expansion at command position (`V="" && $V cmd`) is a
    // bypass: bash drops the empty field and runs `cmd` as argv[0], while
    // our name="" skips every builtin check below. resolveSimpleExpansion
    // rejects the $V case; this catches any other path to empty argv[0]
    // (concatenation of empties, walkString whitespace-quirk, future bugs).
    if (name === '') {
      return {
        ok: false,
        reason: 'Empty command name — argv[0] may not reflect what bash runs',
      }
    }

    // Defense-in-depth: argv[0] should never be a placeholder after the
    // var-tracking fix (static vars return real value, unknown vars reject).
    // But if a bug upstream ever lets one through, catch it here — a
    // placeholder-as-command-name means runtime-determined command → unsafe.
    if (name.includes(CMDSUB_PLACEHOLDER) || name.includes(VAR_PLACEHOLDER)) {
      return {
        ok: false,
        reason: 'Command name is runtime-determined (placeholder argv[0])',
      }
    }

    // argv[0] starts with an operator/flag: this is a fragment, not a
    // command. Likely a line-continuation leak or a mistake.
    if (name.startsWith('-') || name.startsWith('|') || name.startsWith('&')) {
      return {
        ok: false,
        reason: 'Command appears to be an incomplete fragment',
      }
    }

    // SECURITY: builtins that re-parse a NAME operand internally. bash
    // arithmetically evaluates `arr[EXPR]` in NAME position, running $(cmd)
    // in the subscript even when the argv element arrived from a
    // single-quoted raw_string (opaque leaf to tree-sitter). Two forms:
    // separate (`printf -v NAME`) and fused (`printf -vNAME`, getopt-style).
    // `printf '[%s]' x` stays safe — `[` in format string, not after `-v`.
    const dangerFlags = SUBSCRIPT_EVAL_FLAGS[name]
    if (dangerFlags !== undefined) {
      for (let i = 1; i < a.length; i++) {
        const arg = a[i]!
        // Separate form: `-v` then NAME in next arg.
        if (dangerFlags.has(arg) && a[i + 1]?.includes('[')) {
          return {
            ok: false,
            reason: `'${name} ${arg}' operand contains array subscript — bash evaluates $(cmd) in subscripts`,
          }
        }
        // Combined short flags: `-ra` is bash shorthand for `-r -a`.
        // Check if any danger flag character appears in a combined flag
        // string. The danger flag's NAME operand is the next argument.
        if (
          arg.length > 2 &&
          arg[0] === '-' &&
          arg[1] !== '-' &&
          !arg.includes('[')
        ) {
          for (const flag of dangerFlags) {
            if (flag.length === 2 && arg.includes(flag[1]!)) {
              if (a[i + 1]?.includes('[')) {
                return {
                  ok: false,
                  reason: `'${name} ${flag}' (combined in '${arg}') operand contains array subscript — bash evaluates $(cmd) in subscripts`,
                }
              }
            }
          }
        }
        // Fused form: `-vNAME` in one arg. Only short-option flags fuse
        // (getopt), so check -v/-a/-R. `[[` uses test_operator nodes only.
        for (const flag of dangerFlags) {
          if (
            flag.length === 2 &&
            arg.startsWith(flag) &&
            arg.length > 2 &&
            arg.includes('[')
          ) {
            return {
              ok: false,
              reason: `'${name} ${flag}' (fused) operand contains array subscript — bash evaluates $(cmd) in subscripts`,
            }
          }
        }
      }
    }

    // SECURITY: `[[ ARG OP ARG ]]` arithmetic comparison. bash evaluates
    // BOTH operands as arithmetic expressions, recursively expanding
    // `arr[$(cmd)]` subscripts even from single-quoted raw_string. Check
    // the operand adjacent to each arith-cmp operator on BOTH sides —
    // SUBSCRIPT_EVAL_FLAGS's "flag then next-arg" pattern can't express
    // "either side of a binary op". String comparisons (==/!=/=~) do NOT
    // trigger arithmetic eval — `[[ 'a[x]' == y ]]` is a literal string cmp.
    if (name === '[[') {
      // i starts at 2: a[0]='[[' (contains '['), a[1] is the first real
      // operand. A binary op can't appear before index 2.
      for (let i = 2; i < a.length; i++) {
        if (!TEST_ARITH_CMP_OPS.has(a[i]!)) continue
        if (a[i - 1]?.includes('[') || a[i + 1]?.includes('[')) {
          return {
            ok: false,
            reason: `'[[ ... ${a[i]} ... ]]' operand contains array subscript — bash arithmetically evaluates $(cmd) in subscripts`,
          }
        }
      }
    }

    // SECURITY: `read`/`unset` treat EVERY bare positional as a NAME —
    // no flag needed. `read 'a[$(id)]' <<< data` executes id even though
    // argv[1] arrived from a single-quoted raw_string and no -a flag is
    // present. Same primitive as SUBSCRIPT_EVAL_FLAGS but the trigger is
    // positional, not flag-gated. Skip operands of read's data-taking
    // flags (-p PROMPT etc.) to avoid blocking `read -p '[foo] ' var`.
    if (BARE_SUBSCRIPT_NAME_BUILTINS.has(name)) {
      let skipNext = false
      for (let i = 1; i < a.length; i++) {
        const arg = a[i]!
        if (skipNext) {
          skipNext = false
          continue
        }
        if (arg[0] === '-') {
          if (name === 'read') {
            if (READ_DATA_FLAGS.has(arg)) {
              skipNext = true
            } else if (arg.length > 2 && arg[1] !== '-') {
              // Combined short flag like `-rp`. Getopt-style: first
              // data-flag char consumes rest-of-arg as its operand
              // (`-p[foo]` → prompt=`[foo]`), or next-arg if last
              // (`-rp '[foo]'` → prompt=`[foo]`). So skipNext iff a
              // data-flag char appears at the END after only no-arg
              // flags like `-r`/`-s`.
              for (let j = 1; j < arg.length; j++) {
                if (READ_DATA_FLAGS.has('-' + arg[j])) {
                  if (j === arg.length - 1) skipNext = true
                  break
                }
              }
            }
          }
          continue
        }
        if (arg.includes('[')) {
          return {
            ok: false,
            reason: `'${name}' positional NAME '${arg}' contains array subscript — bash evaluates $(cmd) in subscripts`,
          }
        }
      }
    }

    // SECURITY: Shell reserved keywords as argv[0] indicate a tree-sitter
    // mis-parse. `! for i in a; do :; done` parses as `command "for i in a"`
    // + `command "do :"` + `command "done"` — tree-sitter fails to recognize
    // `for` after `!` as a compound command start. Reject: keywords can never
    // be legitimate command names, and argv like ['do','false'] is nonsense.
    if (SHELL_KEYWORDS.has(name)) {
      return {
        ok: false,
        reason: `Shell keyword '${name}' as command name — tree-sitter mis-parse`,
      }
    }

    // Check argv (not .text) to catch both single-quote (`'\n#'`) and
    // double-quote (`"\n#"`) variants. Env vars and redirects are also
    // part of the .text span so the same downstream bug applies.
    // Heredoc bodies are excluded from argv so markdown `##` headers
    // don't trigger this.
    // TODO: remove once downstream path validation operates on argv.
    for (const arg of cmd.argv) {
      if (arg.includes('\n') && NEWLINE_HASH_RE.test(arg)) {
        return {
          ok: false,
          reason:
            'Newline followed by # inside a quoted argument can hide arguments from path validation',
        }
      }
    }
    for (const ev of cmd.envVars) {
      if (ev.value.includes('\n') && NEWLINE_HASH_RE.test(ev.value)) {
        return {
          ok: false,
          reason:
            'Newline followed by # inside an env var value can hide arguments from path validation',
        }
      }
    }
    for (const r of cmd.redirects) {
      if (r.target.includes('\n') && NEWLINE_HASH_RE.test(r.target)) {
        return {
          ok: false,
          reason:
            'Newline followed by # inside a redirect target can hide arguments from path validation',
        }
      }
    }

    // jq's system() built-in executes arbitrary shell commands, and flags
    // like --from-file can read arbitrary files into jq variables. On the
    // legacy path these are caught by validateJqCommand in bashSecurity.ts,
    // but that validator is gated behind `astSubcommands === null` and
    // never runs when the AST parse succeeds. Mirror the checks here so
    // the AST path has the same defence.
    if (name === 'jq') {
      for (const arg of a) {
        if (/\bsystem\s*\(/.test(arg)) {
          return {
            ok: false,
            reason:
              'jq command contains system() function which executes arbitrary commands',
          }
        }
      }
      if (
        a.some(arg =>
          /^(?:-[fL](?:$|[^A-Za-z])|--(?:from-file|rawfile|slurpfile|library-path)(?:$|=))/.test(
            arg,
          ),
        )
      ) {
        return {
          ok: false,
          reason:
            'jq command contains dangerous flags that could execute code or read arbitrary files',
        }
      }
    }

    if (ZSH_DANGEROUS_BUILTINS.has(name)) {
      return {
        ok: false,
        reason: `Zsh builtin '${name}' can bypass security checks`,
      }
    }

    if (EVAL_LIKE_BUILTINS.has(name)) {
      // `command -v foo` / `command -V foo` are POSIX existence checks that
      // only print paths — they never execute argv[1]. Bare `command foo`
      // does bypass function/alias lookup (the concern), so keep blocking it.
      if (name === 'command' && (a[1] === '-v' || a[1] === '-V')) {
        // fall through to remaining checks
      } else if (
        name === 'fc' &&
        !a.slice(1).some(arg => /^-[^-]*[es]/.test(arg))
      ) {
        // `fc -l`, `fc -ln` list history — safe. `fc -e ed` invokes an
        // editor then executes. `fc -s [pat=rep]` RE-EXECUTES the last
        // matching command (optionally with substitution) — as dangerous
        // as eval. Block any short-opt containing `e` or `s`.
        // to avoid introducing FPs for `fc -l` (list history).
      } else if (
        name === 'compgen' &&
        !a.slice(1).some(arg => /^-[^-]*[CFW]/.test(arg))
      ) {
        // `compgen -c/-f/-v` only list completions — safe. `compgen -C cmd`
        // immediately executes cmd; `-F func` calls a shell function; `-W list`
        // word-expands its argument (including $(cmd) even from single-quoted
        // raw_string). Block any short-opt containing C/F/W (case-sensitive:
        // -c/-f are safe).
      } else {
        return {
          ok: false,
          reason: `'${name}' evaluates arguments as shell code`,
        }
      }
    }

    // /proc/*/environ exposes env vars (including secrets) of other processes.
    // Check argv and redirect targets — `cat /proc/self/environ` and
    // `cat < /proc/self/environ` both read it.
    for (const arg of cmd.argv) {
      if (arg.includes('/proc/') && PROC_ENVIRON_RE.test(arg)) {
        return {
          ok: false,
          reason: 'Accesses /proc/*/environ which may expose secrets',
        }
      }
    }
    for (const r of cmd.redirects) {
      if (r.target.includes('/proc/') && PROC_ENVIRON_RE.test(r.target)) {
        return {
          ok: false,
          reason: 'Accesses /proc/*/environ which may expose secrets',
        }
      }
    }
  }
  return { ok: true }
}
