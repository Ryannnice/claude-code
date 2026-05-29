/**
 * Tree-sitter AST analysis utilities for bash command security validation.
 *
 * These functions extract security-relevant information from tree-sitter
 * parse trees, providing more accurate analysis than regex/shell-quote
 * parsing. Each function takes a root node and command string, and returns
 * structured data that can be used by security validators.
 *
 * The native NAPI parser returns plain JS objects — no cleanup needed.
 */

// TreeSitterNode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TreeSitterNode = {
  type: string
  text: string
  startIndex: number
  endIndex: number
  children: TreeSitterNode[]
  childCount: number
}

// QuoteContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type QuoteContext = {
  /** Command text with single-quoted content removed (double-quoted content preserved) */
  withDoubleQuotes: string
  /** Command text with all quoted content removed */
  fullyUnquoted: string
  /** Like fullyUnquoted but preserves quote characters (', ") */
  unquotedKeepQuoteChars: string
}

// CompoundStructure 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompoundStructure = {
  /** Whether the command has compound operators (&&, ||, ;) at the top level */
  hasCompoundOperators: boolean
  /** Whether the command has pipelines */
  hasPipeline: boolean
  /** Whether the command has subshells */
  hasSubshell: boolean
  /** Whether the command has command groups ({...}) */
  hasCommandGroup: boolean
  /** Top-level compound operator types found */
  operators: string[]
  /** Individual command segments split by compound operators */
  segments: string[]
}

// DangerousPatterns 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DangerousPatterns = {
  /** Has $() or backtick command substitution (outside quotes that would make it safe) */
  hasCommandSubstitution: boolean
  /** Has <() or >() process substitution */
  hasProcessSubstitution: boolean
  /** Has ${...} parameter expansion */
  hasParameterExpansion: boolean
  /** Has heredoc */
  hasHeredoc: boolean
  /** Has comment */
  hasComment: boolean
}

// TreeSitterAnalysis 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TreeSitterAnalysis = {
  quoteContext: QuoteContext
  compoundStructure: CompoundStructure
  /** Whether actual operator nodes (;, &&, ||) exist — if false, \; is just a word argument */
  hasActualOperatorNodes: boolean
  dangerousPatterns: DangerousPatterns
}

// QuoteSpans 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type QuoteSpans = {
  raw: Array<[number, number]> // raw_string (single-quoted)
  ansiC: Array<[number, number]> // ansi_c_string ($'...')
  double: Array<[number, number]> // string (double-quoted)
  heredoc: Array<[number, number]> // quoted heredoc_redirect
}

/**
 * Single-pass collection of all quote-related spans.
 * Previously this was 5 separate tree walks (one per type-set plus
 * allQuoteTypes plus heredoc); fusing cuts tree-traversal ~5x.
 *
 * Replicates the per-type walk semantics: each original walk stopped at
 * its own type. So the raw_string walk would recurse THROUGH a string
 * node (not its type) to reach nested raw_string inside $(...), but the
 * string walk would stop at the outer string. We track `inDouble` to
 * collect the *outermost* string span per path, while still descending
 * into $()/${} bodies to pick up inner raw_string/ansi_c_string.
 *
 * raw_string / ansi_c_string / quoted-heredoc bodies are literal text
 * in bash (no expansion), so no nested quote nodes exist — return early.
 */
// collectQuoteSpans 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectQuoteSpans(
  node: TreeSitterNode,
  out: QuoteSpans,
  inDouble: boolean,
): void {
  // 按照 node.type 的取值选择共享工具的具体处理分支。
  switch (node.type) {
    case 'raw_string':
      // 原始文本追加新条目，保持收集顺序与输入顺序一致。
      out.raw.push([node.startIndex, node.endIndex])
      // 返回 `// literal body, no nested quotes possible`，作为共享工具这次计算的结果。
      return // literal body, no nested quotes possible
    case 'ansi_c_string':
      // ansiC追加新条目，保持收集顺序与输入顺序一致。
      out.ansiC.push([node.startIndex, node.endIndex])
      // 返回 `// literal body`，作为共享工具这次计算的结果。
      return // literal body
    case 'string':
      // Only collect the outermost string (matches old per-type walk
      // which stops at first match). Recurse regardless — a nested
      // $(cmd 'x') inside "..." has a real inner raw_string.
      // 满足 `!inDouble) out.double.push([node.startIndex, node.endIndex]` 时，共享工具执行该分支。
      if (!inDouble) out.double.push([node.startIndex, node.endIndex])
      // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
      for (const child of node.children) {
        // 满足 `child) collectQuoteSpans(child, out, true` 时，共享工具执行该分支。
        if (child) collectQuoteSpans(child, out, true)
      }
      // 共享工具 tree Sitter Analysis在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    case 'heredoc_redirect': {
      // Quoted heredocs (<<'EOF', <<"EOF", <<\EOF): literal body.
      // Unquoted (<<EOF) expands $()/${} — the body can contain
      // $(cmd 'x') whose inner '...' IS a real raw_string node.
      // Detection: heredoc_start text starts with '/"/\\
      // Matches sync path's extractHeredocs({ quotedOnly: true }).
      // isQuoted标记共享工具 tree Sitter Analysis是否启用对应路径。
      let isQuoted = false
      // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
      for (const child of node.children) {
        // 当 `child && child.type` 匹配 `'heredoc_start'` 时，共享工具执行对应分支。
        if (child && child.type === 'heredoc_start') {
          // first保存`child.text[0]`，供共享工具 tree Sitter Analysis后续判断或输出使用。
          const first = child.text[0]
          // isQuoted更新为 `first === "'" || first === '"' || first === '\\'`，确保Bash 解析工具后续读取最新状态。
          isQuoted = first === "'" || first === '"' || first === '\\'
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }
      // 满足 `isQuoted` 时，共享工具执行该分支。
      if (isQuoted) {
        // heredoc追加新条目，保持收集顺序与输入顺序一致。
        out.heredoc.push([node.startIndex, node.endIndex])
        // 返回 `// literal body, no nested quote nodes`，作为共享工具这次计算的结果。
        return // literal body, no nested quote nodes
      }
      // Unquoted: recurse into heredoc_body → command_substitution →
      // inner quote nodes. The original per-type walks did NOT stop at
      // heredoc_redirect (not in their type sets), so they recursed here.
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // 满足 `child) collectQuoteSpans(child, out, inDouble` 时，共享工具执行该分支。
    if (child) collectQuoteSpans(child, out, inDouble)
  }
}

/**
 * Builds a Set of all character positions covered by the given spans.
 */
// buildPositionSet 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPositionSet(spans: Array<[number, number]>): Set<number> {
  // set构建`new Set<number>()` 整理出中间结果，供共享工具 tree Sitter Analysis后续步骤使用。
  const set = new Set<number>()
  // 循环处理 `const [start, end] of spans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of spans) {
    // 循环处理 `let i = start; i < end; i++`，让共享工具逐项把同类条目按顺序走完。
    for (let i = start; i < end; i++) {
      // 调用 set.add，触发共享工具此处需要的副作用。
      set.add(i)
    }
  }
  // 返回 `set`，作为共享工具这次计算的结果。
  return set
}

/**
 * Drops spans that are fully contained within another span, keeping only the
 * outermost. Nested quotes (e.g., `"$(echo 'hi')"`) yield overlapping spans
 * — the inner raw_string is found by recursing into the outer string node.
 * Processing overlapping spans corrupts indices since removing/replacing the
 * outer span shifts the inner span's start/end into stale positions.
 */
// dropContainedSpans 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dropContainedSpans<T extends readonly [number, number, ...unknown[]]>(
  spans: T[],
): T[] {
  // 返回 `spans.filter(`，作为共享工具这次计算的结果。
  return spans.filter(
    (s, i) =>
      !spans.some(
        // 这个回调绑定到 (other, j) =>，负责共享工具在该局部场景下的响应。
        (other, j) =>
          j !== i &&
          other[0] <= s[0] &&
          other[1] >= s[1] &&
          (other[0] < s[0] || other[1] > s[1]),
      ),
  )
}

/**
 * Removes spans from a string, returning the string with those character
 * ranges removed.
 */
// removeSpans 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeSpans(command: string, spans: Array<[number, number]>): string {
  // spans 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (spans.length === 0) return command

  // Drop inner spans that are fully contained in an outer one, then sort by
  // start index descending so we can splice without offset shifts.
  // sorted保存`dropContainedSpans`，供共享工具后续处理使用。
  const sorted = dropContainedSpans(spans).sort((a, b) => b[0] - a[0])
  // 结果保存`command`，供后续判断或组装使用。
  let result = command
  // 循环处理 `const [start, end] of sorted`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of sorted) {
    // 结果更新为 `result.slice(0, start) + result.slice(end)`，确保Bash 解析工具后续读取最新状态。
    result = result.slice(0, start) + result.slice(end)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Replaces spans with just the quote delimiters (preserving ' and " characters).
 */
// replaceSpansKeepQuotes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function replaceSpansKeepQuotes(
  command: string,
  spans: Array<[number, number, string, string]>,
): string {
  // spans 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (spans.length === 0) return command

  // sorted保存`dropContainedSpans`，供共享工具后续处理使用。
  const sorted = dropContainedSpans(spans).sort((a, b) => b[0] - a[0])
  // 结果保存`command`，供后续判断或组装使用。
  let result = command
  // 循环处理 `const [start, end, open, close] of sorted`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end, open, close] of sorted) {
    // Replace content but keep the quote delimiters
    // 结果更新为 `result.slice(0, start) + open + close + result.slice(end)`，确保Bash 解析工具后续读取最新状态。
    result = result.slice(0, start) + open + close + result.slice(end)
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Extract quote context from the tree-sitter AST.
 * Replaces the manual character-by-character extractQuotedContent() function.
 *
 * Tree-sitter node types:
 * - raw_string: single-quoted ('...')
 * - string: double-quoted ("...")
 * - ansi_c_string: ANSI-C quoting ($'...') — span includes the leading $
 * - heredoc_redirect: QUOTED heredocs only (<<'EOF', <<"EOF", <<\EOF) —
 *   the full redirect span (<<, delimiters, body, newlines) is stripped
 *   since the body is literal text in bash (no expansion). UNQUOTED
 *   heredocs (<<EOF) are left in place since bash expands $(...)/${...}
 *   inside them, and validators need to see those patterns. Matches the
 *   sync path's extractHeredocs({ quotedOnly: true }).
 */
// extractQuoteContext 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractQuoteContext(
  rootNode: unknown,
  command: string,
): QuoteContext {
  // Single walk collects all quote span types at once.
  // spans 集合 集中保存共享工具 tree Sitter Analysis要一起传递的字段。
  const spans: QuoteSpans = { raw: [], ansiC: [], double: [], heredoc: [] }
  // 调用 collectQuoteSpans，触发共享工具此处需要的副作用。
  collectQuoteSpans(rootNode as TreeSitterNode, spans, false)
  // singleQuoteSpans 集合保存`spans.raw`，供后续判断或组装使用。
  const singleQuoteSpans = spans.raw
  // ansiCSpans 集合保存`spans.ansiC`，供共享工具 tree Sitter Analysis后续判断或输出使用。
  const ansiCSpans = spans.ansiC
  // doubleQuoteSpans 集合保存`spans.double`，供后续判断或组装使用。
  const doubleQuoteSpans = spans.double
  // quotedHeredocSpans 集合保存`spans.heredoc`，供共享工具 tree Sitter Analysis后续判断或输出使用。
  const quotedHeredocSpans = spans.heredoc
  // allQuoteSpans 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allQuoteSpans = [
    ...singleQuoteSpans,
    ...ansiCSpans,
    ...doubleQuoteSpans,
    ...quotedHeredocSpans,
  ]

  // Build a set of positions that should be excluded for each output variant.
  // For withDoubleQuotes: remove single-quoted spans entirely, plus the
  // opening/closing `"` delimiters of double-quoted spans (but keep the
  // content between them). This matches the regex extractQuotedContent()
  // semantics where `"` toggles quote state but content is still emitted.
  // singleQuoteSet构建`buildPositionSet`，供共享工具后续处理使用。
  const singleQuoteSet = buildPositionSet([
    ...singleQuoteSpans,
    ...ansiCSpans,
    ...quotedHeredocSpans,
  ])
  // doubleQuoteDelimSet构建`new Set<number>()`，供后续判断或组装使用。
  const doubleQuoteDelimSet = new Set<number>()
  // 循环处理 `const [start, end] of doubleQuoteSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of doubleQuoteSpans) {
    // 调用 doubleQuoteDelimSet.add，触发共享工具此处需要的副作用。
    doubleQuoteDelimSet.add(start) // opening "
    // 调用 doubleQuoteDelimSet.add，触发共享工具此处需要的副作用。
    doubleQuoteDelimSet.add(end - 1) // closing "
  }
  // withDoubleQuotes 集合固定为 `''`，作为共享工具 tree Sitter Analysis后续展示或比较的基准。
  let withDoubleQuotes = ''
  // 按索引扫描 `command.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < command.length; i++) {
    // 满足 `singleQuoteSet.has(i)` 时，共享工具执行该分支。
    if (singleQuoteSet.has(i)) continue
    // 满足 `doubleQuoteDelimSet.has(i)` 时，共享工具执行该分支。
    if (doubleQuoteDelimSet.has(i)) continue
    // 共享工具 tree Sitter Analysis在这里处理 `withDoubleQuotes += command[i]`，完成这一小步状态转换。
    withDoubleQuotes += command[i]
  }

  // fullyUnquoted: remove all quoted content
  // fullyUnquoted保存`removeSpans`，供共享工具后续处理使用。
  const fullyUnquoted = removeSpans(command, allQuoteSpans)

  // unquotedKeepQuoteChars: remove content but keep delimiter chars
  // spansWithQuoteChars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const spansWithQuoteChars: Array<[number, number, string, string]> = []
  // 循环处理 `const [start, end] of singleQuoteSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of singleQuoteSpans) {
    // spansWithQuoteChars 集合追加新条目，保持收集顺序与输入顺序一致。
    spansWithQuoteChars.push([start, end, "'", "'"])
  }
  // 循环处理 `const [start, end] of ansiCSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of ansiCSpans) {
    // ansi_c_string spans include the leading $; preserve it so this
    // matches the regex path, which treats $ as unquoted preceding '.
    // spansWithQuoteChars 集合追加新条目，保持收集顺序与输入顺序一致。
    spansWithQuoteChars.push([start, end, "$'", "'"])
  }
  // 循环处理 `const [start, end] of doubleQuoteSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of doubleQuoteSpans) {
    // spansWithQuoteChars 集合追加新条目，保持收集顺序与输入顺序一致。
    spansWithQuoteChars.push([start, end, '"', '"'])
  }
  // 循环处理 `const [start, end] of quotedHeredocSpans`，让共享工具逐项把同类条目按顺序走完。
  for (const [start, end] of quotedHeredocSpans) {
    // Heredoc redirect spans have no inline quote delimiters — strip entirely.
    // spansWithQuoteChars 集合追加新条目，保持收集顺序与输入顺序一致。
    spansWithQuoteChars.push([start, end, '', ''])
  }
  // unquotedKeepQuoteChars 集合格式化`replaceSpansKeepQuotes`，供共享工具后续处理使用。
  const unquotedKeepQuoteChars = replaceSpansKeepQuotes(
    command,
    spansWithQuoteChars,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { withDoubleQuotes, fullyUnquoted, unquotedKeepQuoteChars }
}

/**
 * Extract compound command structure from the AST.
 * Replaces isUnsafeCompoundCommand() and splitCommand() for tree-sitter path.
 */
// extractCompoundStructure 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractCompoundStructure(
  rootNode: unknown,
  command: string,
): CompoundStructure {
  // n保存`rootNode as TreeSitterNode`，供共享工具 tree Sitter Analysis后续判断或输出使用。
  const n = rootNode as TreeSitterNode
  // operators 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const operators: string[] = []
  // segments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const segments: string[] = []
  // hasSubshell标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasSubshell = false
  // hasCommandGroup 命令数据标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasCommandGroup = false
  // hasPipeline标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasPipeline = false

  // Walk top-level children of the program node
  // walkTopLevel 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function walkTopLevel(node: TreeSitterNode): void {
    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // child缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!child) continue

      // 当 `child.type` 匹配 `'list'` 时，共享工具执行对应分支。
      if (child.type === 'list') {
        // list nodes contain && and || operators
        // 按顺序遍历 `child.children` 中的listChild 集合，逐个交给共享工具处理。
        for (const listChild of child.children) {
          // listChild 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!listChild) continue
          // 当 `listChild.type` 匹配 `'&&' || listChild.type === ...` 时，共享工具执行对应分支。
          if (listChild.type === '&&' || listChild.type === '||') {
            // operators 集合追加新条目，保持收集顺序与输入顺序一致。
            operators.push(listChild.type)
          // 共享工具 tree Sitter Analysis在这里处理 `} else if (`，完成这一小步状态转换。
          } else if (
            listChild.type === 'list' ||
            listChild.type === 'redirected_statement'
          ) {
            // Nested list, or redirected_statement wrapping a list/pipeline —
            // recurse so inner operators/pipelines are detected. For
            // `cmd1 && cmd2 2>/dev/null && cmd3`, the redirected_statement
            // wraps `list(cmd1 && cmd2)` — the inner `&&` would be missed
            // without recursion.
            // 调用 walkTopLevel，触发共享工具此处需要的副作用。
            walkTopLevel({ ...node, children: [listChild] } as TreeSitterNode)
          // 共享工具 tree Sitter Analysis在这里处理 `} else if (listChild.type === 'pipeline') {`，完成这一小步状态转换。
          } else if (listChild.type === 'pipeline') {
            // hasPipeline更新为 `true`，确保Bash 解析工具后续读取最新状态。
            hasPipeline = true
            // segments 集合追加新条目，保持收集顺序与输入顺序一致。
            segments.push(listChild.text)
          // 共享工具 tree Sitter Analysis在这里处理 `} else if (listChild.type === 'subshell') {`，完成这一小步状态转换。
          } else if (listChild.type === 'subshell') {
            // hasSubshell更新为 `true`，确保Bash 解析工具后续读取最新状态。
            hasSubshell = true
            // segments 集合追加新条目，保持收集顺序与输入顺序一致。
            segments.push(listChild.text)
          // 共享工具 tree Sitter Analysis在这里处理 `} else if (listChild.type === 'compound_statement') {`，完成这一小步状态转换。
          } else if (listChild.type === 'compound_statement') {
            // hasCommandGroup 命令数据更新为 `true`，确保Bash 解析工具后续读取最新状态。
            hasCommandGroup = true
            // segments 集合追加新条目，保持收集顺序与输入顺序一致。
            segments.push(listChild.text)
          } else {
            // segments 集合追加新条目，保持收集顺序与输入顺序一致。
            segments.push(listChild.text)
          }
        }
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === ';') {`，完成这一小步状态转换。
      } else if (child.type === ';') {
        // operators 集合追加新条目，保持收集顺序与输入顺序一致。
        operators.push(';')
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === 'pipeline') {`，完成这一小步状态转换。
      } else if (child.type === 'pipeline') {
        // hasPipeline更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasPipeline = true
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === 'subshell') {`，完成这一小步状态转换。
      } else if (child.type === 'subshell') {
        // hasSubshell更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasSubshell = true
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === 'compound_statement') {`，完成这一小步状态转换。
      } else if (child.type === 'compound_statement') {
        // hasCommandGroup 命令数据更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasCommandGroup = true
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        child.type === 'command' ||
        child.type === 'declaration_command' ||
        child.type === 'variable_assignment'
      ) {
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === 'redirected_statement') {`，完成这一小步状态转换。
      } else if (child.type === 'redirected_statement') {
        // `cd ~/src && find path 2>/dev/null` — tree-sitter wraps the ENTIRE
        // compound in a redirected_statement: program → redirected_statement →
        // (list → cmd1, &&, cmd2) + file_redirect. Same for `cmd1 | cmd2 > out`
        // (wraps pipeline) and `(cmd) > out` (wraps subshell). Recurse to
        // detect the inner structure; skip file_redirect children (redirects
        // don't affect compound/pipeline classification).
        // foundInner标记共享工具 tree Sitter Analysis是否启用对应路径。
        let foundInner = false
        // 按顺序遍历 `child.children` 中的inner，逐个交给共享工具处理。
        for (const inner of child.children) {
          // 当 `!inner || inner.type` 匹配 `'file_redirect'` 时，共享工具执行对应分支。
          if (!inner || inner.type === 'file_redirect') continue
          // foundInner更新为 `true`，确保Bash 解析工具后续读取最新状态。
          foundInner = true
          // 调用 walkTopLevel，触发共享工具此处需要的副作用。
          walkTopLevel({ ...child, children: [inner] } as TreeSitterNode)
        }
        // foundInner缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!foundInner) {
          // Standalone redirect with no body (shouldn't happen, but fail-safe)
          // segments 集合追加新条目，保持收集顺序与输入顺序一致。
          segments.push(child.text)
        }
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (child.type === 'negated_command') {`，完成这一小步状态转换。
      } else if (child.type === 'negated_command') {
        // `! cmd` — recurse into the inner command so its structure is
        // classified (pipeline/subshell/etc.), but also record the full
        // negated text as a segment so segments.length stays meaningful.
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
        // 调用 walkTopLevel，触发共享工具此处需要的副作用。
        walkTopLevel(child)
      // 共享工具 tree Sitter Analysis在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        child.type === 'if_statement' ||
        child.type === 'while_statement' ||
        child.type === 'for_statement' ||
        child.type === 'case_statement' ||
        child.type === 'function_definition'
      ) {
        // Control-flow constructs: the construct itself is one segment,
        // but recurse so inner pipelines/subshells/operators are detected.
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(child.text)
        // 调用 walkTopLevel，触发共享工具此处需要的副作用。
        walkTopLevel(child)
      }
    }
  }

  // 调用 walkTopLevel，触发共享工具此处需要的副作用。
  walkTopLevel(n)

  // If no segments found, the whole command is one segment
  // segments 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (segments.length === 0) {
    // segments 集合追加新条目，保持收集顺序与输入顺序一致。
    segments.push(command)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    hasCompoundOperators: operators.length > 0,
    hasPipeline,
    hasSubshell,
    hasCommandGroup,
    operators,
    segments,
  }
}

/**
 * Check whether the AST contains actual operator nodes (;, &&, ||).
 *
 * This is the key function for eliminating the `find -exec \;` false positive.
 * Tree-sitter parses `\;` as part of a `word` node (an argument to find),
 * NOT as a `;` operator. So if no actual `;` operator nodes exist in the AST,
 * there are no compound operators and hasBackslashEscapedOperator() can be skipped.
 */
// hasActualOperatorNodes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasActualOperatorNodes(rootNode: unknown): boolean {
  // n保存`rootNode as TreeSitterNode`，供共享工具 tree Sitter Analysis后续判断或输出使用。
  const n = rootNode as TreeSitterNode

  // walk 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function walk(node: TreeSitterNode): boolean {
    // Check for operator types that indicate compound commands
    // 只有 `node.type === ';' || node.type === '&&' || node.t` 满足时，共享工具才执行该分支。
    if (node.type === ';' || node.type === '&&' || node.type === '||') {
      // Verify this is a child of a list or program, not inside a command
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 当 `node.type` 匹配 `'list'` 时，共享工具执行对应分支。
    if (node.type === 'list') {
      // A list node means there are compound operators
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // 只有 `child && walk(child)` 满足时，共享工具才执行该分支。
      if (child && walk(child)) return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `walk(n)`，作为共享工具这次计算的结果。
  return walk(n)
}

/**
 * Extract dangerous pattern information from the AST.
 */
// extractDangerousPatterns 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractDangerousPatterns(rootNode: unknown): DangerousPatterns {
  // n保存`rootNode as TreeSitterNode`，供共享工具 tree Sitter Analysis后续判断或输出使用。
  const n = rootNode as TreeSitterNode
  // hasCommandSubstitution 命令数据标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasCommandSubstitution = false
  // hasProcessSubstitution标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasProcessSubstitution = false
  // hasParameterExpansion标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasParameterExpansion = false
  // hasHeredoc标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasHeredoc = false
  // hasComment标记共享工具 tree Sitter Analysis是否启用对应路径。
  let hasComment = false

  // walk 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function walk(node: TreeSitterNode): void {
    // 按照 node.type 的取值选择共享工具的具体处理分支。
    switch (node.type) {
      case 'command_substitution':
        // hasCommandSubstitution 命令数据更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasCommandSubstitution = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'process_substitution':
        // hasProcessSubstitution更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasProcessSubstitution = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'expansion':
        // hasParameterExpansion更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasParameterExpansion = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'heredoc_redirect':
        // hasHeredoc更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasHeredoc = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'comment':
        // hasComment更新为 `true`，确保Bash 解析工具后续读取最新状态。
        hasComment = true
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }

    // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
    for (const child of node.children) {
      // 满足 `child) walk(child` 时，共享工具执行该分支。
      if (child) walk(child)
    }
  }

  // 调用 walk，触发共享工具此处需要的副作用。
  walk(n)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    hasCommandSubstitution,
    hasProcessSubstitution,
    hasParameterExpansion,
    hasHeredoc,
    hasComment,
  }
}

/**
 * Perform complete tree-sitter analysis of a command.
 * Extracts all security-relevant data from the AST in one pass.
 * This data must be extracted before tree.delete() is called.
 */
// analyzeCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function analyzeCommand(
  rootNode: unknown,
  command: string,
): TreeSitterAnalysis {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    quoteContext: extractQuoteContext(rootNode, command),
    compoundStructure: extractCompoundStructure(rootNode, command),
    hasActualOperatorNodes: hasActualOperatorNodes(rootNode),
    dangerousPatterns: extractDangerousPatterns(rootNode),
  }
}
