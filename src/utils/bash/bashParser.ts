/**
 * Pure-TypeScript bash parser producing tree-sitter-bash-compatible ASTs.
 *
 * Downstream code in parser.ts, ast.ts, prefix.ts, ParsedCommand.ts walks this
 * by field name. startIndex/endIndex are UTF-8 BYTE offsets (not JS string
 * indices).
 *
 * Grammar reference: tree-sitter-bash. Validated against a 3449-input golden
 * corpus generated from the WASM parser.
 */

// TsNode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TsNode = {
  type: string
  text: string
  startIndex: number
  endIndex: number
  children: TsNode[]
}

// ParserModule 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParserModule = {
  // 这个回调绑定到 parse: (source: string, timeoutMs?: number) => TsNode | null，负责共享工具在该局部场景下的响应。
  parse: (source: string, timeoutMs?: number) => TsNode | null
}

/**
 * 50ms wall-clock cap — bails out on pathological/adversarial input.
 * Pass `Infinity` via `parse(src, Infinity)` to disable (e.g. correctness
 * tests, where CI jitter would otherwise cause spurious null returns).
 */
// PARSE_TIMEOUT_MS 集合保存`50`，供后续判断或组装使用。
const PARSE_TIMEOUT_MS = 50

/** Node budget cap — bails out before OOM on deeply nested input. */
// MAX_NODES 集合 命名 `50_000`，让后续代码直接表达这个值的用途。
const MAX_NODES = 50_000

// MODULE 集中保存共享工具 bash Parser要一起传递的字段。
const MODULE: ParserModule = { parse: parseSource }

// READY读取`Promise.resolve`，供共享工具后续处理使用。
const READY = Promise.resolve()

/** No-op: pure-TS parser needs no async init. Kept for API compatibility. */
// ensureParserInitialized 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ensureParserInitialized(): Promise<void> {
  // 返回 `READY`，作为共享工具这次计算的结果。
  return READY
}

/** Always succeeds — pure-TS needs no init. */
// getParserModule 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getParserModule(): ParserModule | null {
  // 返回 `MODULE`，作为共享工具这次计算的结果。
  return MODULE
}

// ───────────────────────────── Tokenizer ─────────────────────────────

// TokenType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TokenType =
  | 'WORD'
  | 'NUMBER'
  | 'OP'
  | 'NEWLINE'
  | 'COMMENT'
  | 'DQUOTE'
  | 'SQUOTE'
  | 'ANSI_C'
  | 'DOLLAR'
  | 'DOLLAR_PAREN'
  | 'DOLLAR_BRACE'
  | 'DOLLAR_DPAREN'
  | 'BACKTICK'
  | 'LT_PAREN'
  | 'GT_PAREN'
  | 'EOF'

// Token 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Token = {
  type: TokenType
  value: string
  /** UTF-8 byte offset of first char */
  start: number
  /** UTF-8 byte offset one past last char */
  end: number
}

// SPECIAL_VARS 集合保存`Set`，供共享工具后续处理使用。
const SPECIAL_VARS = new Set(['?', '$', '@', '*', '#', '-', '!', '_'])

// DECL_KEYWORDS 集合保存`Set`，供共享工具后续处理使用。
const DECL_KEYWORDS = new Set([
  'export',
  'declare',
  'typeset',
  'readonly',
  'local',
])

// SHELL_KEYWORDS 集合保存`Set`，供共享工具后续处理使用。
export const SHELL_KEYWORDS = new Set([
  'if',
  'then',
  'elif',
  'else',
  'fi',
  'while',
  'until',
  'for',
  'in',
  'do',
  'done',
  'case',
  'esac',
  'function',
  'select',
])

/**
 * Lexer state. Tracks both JS-string index (for charAt) and UTF-8 byte offset
 * (for TsNode positions). ASCII fast path: byte == char index. Non-ASCII
 * advances byte count per-codepoint.
 */
// Lexer 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Lexer = {
  src: string
  len: number
  /** JS string index */
  i: number
  /** UTF-8 byte offset */
  b: number
  /** Pending heredoc delimiters awaiting body scan at next newline */
  heredocs: HeredocPending[]
  /** Precomputed byte offset for each char index (lazy for non-ASCII) */
  byteTable: Uint32Array | null
}

// HeredocPending 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type HeredocPending = {
  delim: string
  stripTabs: boolean
  quoted: boolean
  /** Filled after body scan */
  bodyStart: number
  bodyEnd: number
  endStart: number
  endEnd: number
}

// makeLexer 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeLexer(src: string): Lexer {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    src,
    len: src.length,
    i: 0,
    b: 0,
    heredocs: [],
    byteTable: null,
  }
}

/** Advance one JS char, updating byte offset for UTF-8. */
// advance 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function advance(L: Lexer): void {
  // c保存`src.charCodeAt`，供共享工具后续处理使用。
  const c = L.src.charCodeAt(L.i)
  // 共享工具 bash Parser在这里处理 `L.i++`，完成这一小步状态转换。
  L.i++
  // 满足 `c < 0x80` 时，共享工具执行该分支。
  if (c < 0x80) {
    // 共享工具 bash Parser在这里处理 `L.b++`，完成这一小步状态转换。
    L.b++
  // 共享工具 bash Parser在这里处理 `} else if (c < 0x800) {`，完成这一小步状态转换。
  } else if (c < 0x800) {
    // 共享工具 bash Parser在这里处理 `L.b += 2`，完成这一小步状态转换。
    L.b += 2
  // 共享工具 bash Parser在这里处理 `} else if (c >= 0xd800 && c <= 0xdbff) {`，完成这一小步状态转换。
  } else if (c >= 0xd800 && c <= 0xdbff) {
    // High surrogate — next char completes the pair, total 4 UTF-8 bytes
    // 共享工具 bash Parser在这里处理 `L.b += 4`，完成这一小步状态转换。
    L.b += 4
    // 共享工具 bash Parser在这里处理 `L.i++`，完成这一小步状态转换。
    L.i++
  } else {
    // 共享工具 bash Parser在这里处理 `L.b += 3`，完成这一小步状态转换。
    L.b += 3
  }
}

// peek 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function peek(L: Lexer, off = 0): string {
  // 返回 `L.i + off < L.len ? L.src[L.i + off]! : ''`，作为共享工具这次计算的结果。
  return L.i + off < L.len ? L.src[L.i + off]! : ''
}

// byteAt 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function byteAt(L: Lexer, charIdx: number): number {
  // Fast path: ASCII-only prefix means char idx == byte idx
  // 满足 `L.byteTable` 时，共享工具执行该分支。
  if (L.byteTable) return L.byteTable[charIdx]!
  // Build table on first non-trivial lookup
  // t保存`Uint32Array`，供共享工具后续处理使用。
  const t = new Uint32Array(L.len + 1)
  // b保存`0`，供共享工具 bash Parser后续判断或输出使用。
  let b = 0
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // while 使用 i < L.len 完成共享工具里的对应操作。
  while (i < L.len) {
    // t[i更新为 `b`，确保共享工具 bash Parser后续读取最新状态。
    t[i] = b
    // c保存`src.charCodeAt`，供共享工具后续处理使用。
    const c = L.src.charCodeAt(i)
    // 满足 `c < 0x80` 时，共享工具执行该分支。
    if (c < 0x80) {
      // 共享工具 bash Parser在这里处理 `b++`，完成这一小步状态转换。
      b++
      // 共享工具 bash Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
    // 共享工具 bash Parser在这里处理 `} else if (c < 0x800) {`，完成这一小步状态转换。
    } else if (c < 0x800) {
      // 共享工具 bash Parser在这里处理 `b += 2`，完成这一小步状态转换。
      b += 2
      // 共享工具 bash Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
    // 共享工具 bash Parser在这里处理 `} else if (c >= 0xd800 && c <= 0xdbff) {`，完成这一小步状态转换。
    } else if (c >= 0xd800 && c <= 0xdbff) {
      // t[i + 1更新为 `b + 2`，确保共享工具 bash Parser后续读取最新状态。
      t[i + 1] = b + 2
      // 共享工具 bash Parser在这里处理 `b += 4`，完成这一小步状态转换。
      b += 4
      // 共享工具 bash Parser在这里处理 `i += 2`，完成这一小步状态转换。
      i += 2
    } else {
      // 共享工具 bash Parser在这里处理 `b += 3`，完成这一小步状态转换。
      b += 3
      // 共享工具 bash Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
    }
  }
  // len更新为 `b`，确保共享工具 bash Parser后续读取最新状态。
  t[L.len] = b
  // byteTable更新为 `t`，确保Bash 解析工具后续读取最新状态。
  L.byteTable = t
  // 返回 `t[charIdx]!`，作为共享工具这次计算的结果。
  return t[charIdx]!
}

// isWordChar 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWordChar(c: string): boolean {
  // Bash word chars: alphanumeric + various punctuation that doesn't start operators
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    (c >= 'a' && c <= 'z') ||
    (c >= 'A' && c <= 'Z') ||
    (c >= '0' && c <= '9') ||
    c === '_' ||
    c === '/' ||
    c === '.' ||
    c === '-' ||
    c === '+' ||
    c === ':' ||
    c === '@' ||
    c === '%' ||
    c === ',' ||
    c === '~' ||
    c === '^' ||
    c === '?' ||
    c === '*' ||
    c === '!' ||
    c === '=' ||
    c === '[' ||
    c === ']'
  )
}

// isWordStart 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWordStart(c: string): boolean {
  // 返回 `isWordChar(c) || c === '\\'`，作为共享工具这次计算的结果。
  return isWordChar(c) || c === '\\'
}

// isIdentStart 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isIdentStart(c: string): boolean {
  // 返回 `(c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'`，作为共享工具这次计算的结果。
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
}

// isIdentChar 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isIdentChar(c: string): boolean {
  // 返回 `isIdentStart(c) || (c >= '0' && c <= '9')`，作为共享工具这次计算的结果。
  return isIdentStart(c) || (c >= '0' && c <= '9')
}

// isDigit 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDigit(c: string): boolean {
  // 返回 `c >= '0' && c <= '9'`，作为共享工具这次计算的结果。
  return c >= '0' && c <= '9'
}

// isHexDigit 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isHexDigit(c: string): boolean {
  // 返回 `isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')`，作为共享工具这次计算的结果。
  return isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
}

// isBaseDigit 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBaseDigit(c: string): boolean {
  // Bash BASE#DIGITS: digits, letters, @ and _ (up to base 64)
  // 返回 `isIdentChar(c) || c === '@'`，作为共享工具这次计算的结果。
  return isIdentChar(c) || c === '@'
}

/**
 * Unquoted heredoc delimiter chars. Bash accepts most non-metacharacters —
 * not just identifiers. Stop at whitespace, redirects, pipe/list operators,
 * and structural tokens. Allows !, -, ., +, etc. (e.g. <<!HEREDOC!).
 */
// isHeredocDelimChar 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isHeredocDelimChar(c: string): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    c !== '' &&
    c !== ' ' &&
    c !== '\t' &&
    c !== '\n' &&
    c !== '<' &&
    c !== '>' &&
    c !== '|' &&
    c !== '&' &&
    c !== ';' &&
    c !== '(' &&
    c !== ')' &&
    c !== "'" &&
    c !== '"' &&
    c !== '`' &&
    c !== '\\'
  )
}

// skipBlanks 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function skipBlanks(L: Lexer): void {
  // while 使用 L.i < L.len 完成共享工具里的对应操作。
  while (L.i < L.len) {
    // c 命名 `L.src[L.i]!`，让后续代码直接表达这个值的用途。
    const c = L.src[L.i]!
    // 当 `c` 匹配 `' ' || c === '\t' || c === ...` 时，共享工具执行对应分支。
    if (c === ' ' || c === '\t' || c === '\r') {
      // \r is whitespace per tree-sitter-bash extras /\s/ — handles CRLF inputs
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
    // 共享工具 bash Parser在这里处理 `} else if (c === '\\') {`，完成这一小步状态转换。
    } else if (c === '\\') {
      // nx保存`L.src[L.i + 1]`，供共享工具 bash Parser后续判断或输出使用。
      const nx = L.src[L.i + 1]
      // 只有 `nx === '\n' || (nx === '\r' && L.src[L.i + 2] === '\n')` 满足时，共享工具才执行该分支。
      if (nx === '\n' || (nx === '\r' && L.src[L.i + 2] === '\n')) {
        // Line continuation — tree-sitter extras: /\\\r?\n/
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
        // 满足 `nx === '\r') advance(L` 时，共享工具执行该分支。
        if (nx === '\r') advance(L)
      // 共享工具 bash Parser在这里处理 `} else if (nx === ' ' || nx === '\t') {`，完成这一小步状态转换。
      } else if (nx === ' ' || nx === '\t') {
        // \<space> or \<tab> — tree-sitter's _whitespace is /\\?[ \t\v]+/
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
      } else {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
}

/**
 * Scan next token. Context-sensitive: `cmd` mode treats [ as operator (test
 * command start), `arg` mode treats [ as word char (glob/subscript).
 */
// nextToken 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function nextToken(L: Lexer, ctx: 'cmd' | 'arg' = 'arg'): Token {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(L)
  // start保存`L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = L.b
  // 满足 `L.i >= L.len` 时，共享工具执行该分支。
  if (L.i >= L.len) return { type: 'EOF', value: '', start, end: start }

  // c 命名 `L.src[L.i]!`，让后续代码直接表达这个值的用途。
  const c = L.src[L.i]!
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(L, 1)
  // c2保存`peek`，供共享工具后续处理使用。
  const c2 = peek(L, 2)

  // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
  if (c === '\n') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'NEWLINE', value: '\n', start, end: L.b }
  }

  // 当 `c` 匹配 `'#'` 时，共享工具执行对应分支。
  if (c === '#') {
    // si 命名 `L.i`，让后续代码直接表达这个值的用途。
    const si = L.i
    // 只要 L.i < L.len && L.src[L.i] !== '\n') advance(L 成立，就持续推进共享工具中的循环处理。
    while (L.i < L.len && L.src[L.i] !== '\n') advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'COMMENT',
      value: L.src.slice(si, L.i),
      start,
      end: L.b,
    }
  }

  // Multi-char operators (longest match first)
  // 当 `c` 匹配 `'&' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === '&' && c1 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '&&', start, end: L.b }
  }
  // 当 `c` 匹配 `'|' && c1 === '|'` 时，共享工具执行对应分支。
  if (c === '|' && c1 === '|') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '||', start, end: L.b }
  }
  // 当 `c` 匹配 `'|' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === '|' && c1 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '|&', start, end: L.b }
  }
  // 当 `c` 匹配 `';' && c1 === ';' && c2 ===...` 时，共享工具执行对应分支。
  if (c === ';' && c1 === ';' && c2 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: ';;&', start, end: L.b }
  }
  // 当 `c` 匹配 `';' && c1 === ';'` 时，共享工具执行对应分支。
  if (c === ';' && c1 === ';') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: ';;', start, end: L.b }
  }
  // 当 `c` 匹配 `';' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === ';' && c1 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: ';&', start, end: L.b }
  }
  // 当 `c` 匹配 `'>' && c1 === '>'` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '>') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '>>', start, end: L.b }
  }
  // 当 `c` 匹配 `'>' && c1 === '&' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '&' && c2 === '-') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '>&-', start, end: L.b }
  }
  // 当 `c` 匹配 `'>' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '>&', start, end: L.b }
  }
  // 当 `c` 匹配 `'>' && c1 === '|'` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '|') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '>|', start, end: L.b }
  }
  // 当 `c` 匹配 `'&' && c1 === '>' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '&' && c1 === '>' && c2 === '>') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '&>>', start, end: L.b }
  }
  // 当 `c` 匹配 `'&' && c1 === '>'` 时，共享工具执行对应分支。
  if (c === '&' && c1 === '>') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '&>', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '<' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '<' && c2 === '<') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '<<<', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '<' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '<' && c2 === '-') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '<<-', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '<'` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '<') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '<<', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '&' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '&' && c2 === '-') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '<&-', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '&') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '<&', start, end: L.b }
  }
  // 当 `c` 匹配 `'<' && c1 === '('` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '(') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'LT_PAREN', value: '<(', start, end: L.b }
  }
  // 当 `c` 匹配 `'>' && c1 === '('` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '(') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'GT_PAREN', value: '>(', start, end: L.b }
  }
  // 当 `c` 匹配 `'(' && c1 === '('` 时，共享工具执行对应分支。
  if (c === '(' && c1 === '(') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '((', start, end: L.b }
  }
  // 当 `c` 匹配 `')' && c1 === ')'` 时，共享工具执行对应分支。
  if (c === ')' && c1 === ')') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: '))', start, end: L.b }
  }

  // 当 `c` 匹配 `'|' || c === '&' || c === '...` 时，共享工具执行对应分支。
  if (c === '|' || c === '&' || c === ';' || c === '>' || c === '<') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: c, start, end: L.b }
  }
  // 当 `c` 匹配 `'(' || c === ')'` 时，共享工具执行对应分支。
  if (c === '(' || c === ')') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'OP', value: c, start, end: L.b }
  }

  // In cmd position, [ [[ { start test/group; in arg position they're word chars
  // 当 `ctx` 匹配 `'cmd'` 时，共享工具执行对应分支。
  if (ctx === 'cmd') {
    // 当 `c` 匹配 `'[' && c1 === '['` 时，共享工具执行对应分支。
    if (c === '[' && c1 === '[') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'OP', value: '[[', start, end: L.b }
    }
    // 当 `c` 匹配 `'['` 时，共享工具执行对应分支。
    if (c === '[') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'OP', value: '[', start, end: L.b }
    }
    // 只有 `c === '{' && (c1 === ' ' || c1 === '\t' || c1 === '\n')` 满足时，共享工具才执行该分支。
    if (c === '{' && (c1 === ' ' || c1 === '\t' || c1 === '\n')) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'OP', value: '{', start, end: L.b }
    }
    // 当 `c` 匹配 `'}'` 时，共享工具执行对应分支。
    if (c === '}') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'OP', value: '}', start, end: L.b }
    }
    // 只有 `c === '!' && (c1 === ' ' || c1 === '\t')` 满足时，共享工具才执行该分支。
    if (c === '!' && (c1 === ' ' || c1 === '\t')) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'OP', value: '!', start, end: L.b }
    }
  }

  // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
  if (c === '"') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'DQUOTE', value: '"', start, end: L.b }
  }
  // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
  if (c === "'") {
    // si 命名 `L.i`，让后续代码直接表达这个值的用途。
    const si = L.i
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 只要 L.i < L.len && L.src[L.i] !== "'") advance(L 成立，就持续推进共享工具中的循环处理。
    while (L.i < L.len && L.src[L.i] !== "'") advance(L)
    // 满足 `L.i < L.len) advance(L` 时，共享工具执行该分支。
    if (L.i < L.len) advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'SQUOTE',
      value: L.src.slice(si, L.i),
      start,
      end: L.b,
    }
  }

  // 满足 `c === '` 时，共享工具执行该分支。
  if (c === '$') {
    // 当 `c1` 匹配 `'(' && c2 === '('` 时，共享工具执行对应分支。
    if (c1 === '(' && c2 === '(') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'DOLLAR_DPAREN', value: '$((', start, end: L.b }
    }
    // 当 `c1` 匹配 `'('` 时，共享工具执行对应分支。
    if (c1 === '(') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'DOLLAR_PAREN', value: '$(', start, end: L.b }
    }
    // 当 `c1` 匹配 `'{'` 时，共享工具执行对应分支。
    if (c1 === '{') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'DOLLAR_BRACE', value: '${', start, end: L.b }
    }
    // 当 `c1` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c1 === "'") {
      // ANSI-C string $'...'
      // si 命名 `L.i`，让后续代码直接表达这个值的用途。
      const si = L.i
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
      // while 使用 L.i < L.len && L.src[L.i] !== "'" 完成共享工具里的对应操作。
      while (L.i < L.len && L.src[L.i] !== "'") {
        // 只有 `L.src[L.i] === '\\' && L.i + 1 < L.len) advance(L` 满足时，共享工具才执行该分支。
        if (L.src[L.i] === '\\' && L.i + 1 < L.len) advance(L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
      }
      // 满足 `L.i < L.len) advance(L` 时，共享工具执行该分支。
      if (L.i < L.len) advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'ANSI_C',
        value: L.src.slice(si, L.i),
        start,
        end: L.b,
      }
    }
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'DOLLAR', value: '$', start, end: L.b }
  }

  // 当 `c` 匹配 `'`'` 时，共享工具执行对应分支。
  if (c === '`') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(L)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'BACKTICK', value: '`', start, end: L.b }
  }

  // File descriptor before redirect: digit+ immediately followed by > or <
  // 满足 `isDigit(c)` 时，共享工具执行该分支。
  if (isDigit(c)) {
    // j保存`L.i`，供后续判断或组装使用。
    let j = L.i
    // 只要 j < L.len && isDigit(L.src[j]!) 成立，就持续推进共享工具中的循环处理。
    while (j < L.len && isDigit(L.src[j]!)) j++
    // after 命名 `j < L.len ? L.src[j]! : ''`，让后续代码直接表达这个值的用途。
    const after = j < L.len ? L.src[j]! : ''
    // 当 `after` 匹配 `'>' || after === '<'` 时，共享工具执行对应分支。
    if (after === '>' || after === '<') {
      // si 命名 `L.i`，让后续代码直接表达这个值的用途。
      const si = L.i
      // 只要 L.i < j) advance(L 成立，就持续推进共享工具中的循环处理。
      while (L.i < j) advance(L)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'WORD',
        value: L.src.slice(si, L.i),
        start,
        end: L.b,
      }
    }
  }

  // Word / number
  // 当 `isWordStart(c) || c` 匹配 `'{' || c === '}'` 时，共享工具执行对应分支。
  if (isWordStart(c) || c === '{' || c === '}') {
    // si 命名 `L.i`，让后续代码直接表达这个值的用途。
    const si = L.i
    // while 使用 L.i < L.len 完成共享工具里的对应操作。
    while (L.i < L.len) {
      // ch保存`L.src[L.i]!`，供共享工具 bash Parser后续判断或输出使用。
      const ch = L.src[L.i]!
      // 当 `ch` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (ch === '\\') {
        // 满足 `L.i + 1 >= L.len` 时，共享工具执行该分支。
        if (L.i + 1 >= L.len) {
          // Trailing `\` at EOF — tree-sitter excludes it from the word and
          // emits a sibling ERROR. Stop here so the word ends before `\`.
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // Escape next char (including \n for line continuation mid-word)
        // 当 `L.src[L.i + 1]` 匹配 `'\n'` 时，共享工具执行对应分支。
        if (L.src[L.i + 1] === '\n') {
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(L)
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(L)
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // `!isWordChar(ch) && ch` 与 `'{' && ch !== '}'` 不一致时刷新派生状态，避免使用过期结果。
      if (!isWordChar(ch) && ch !== '{' && ch !== '}') {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(L)
    }
    // 满足 `L.i > si` 时，共享工具执行该分支。
    if (L.i > si) {
      // v格式化`src.slice`，供共享工具后续处理使用。
      const v = L.src.slice(si, L.i)
      // Number: optional sign then digits only
      // 满足 `/^-?\d+$/.test(v)` 时，共享工具执行该分支。
      if (/^-?\d+$/.test(v)) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'NUMBER', value: v, start, end: L.b }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'WORD', value: v, start, end: L.b }
    }
    // Empty word (lone `\` at EOF) — fall through to single-char consumer
  }

  // Unknown char — consume as single-char word
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(L)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { type: 'WORD', value: c, start, end: L.b }
}

// ───────────────────────────── Parser ─────────────────────────────

// ParseState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParseState = {
  L: Lexer
  src: string
  srcBytes: number
  /** True when byte offsets == char indices (no multi-byte UTF-8) */
  isAscii: boolean
  nodeCount: number
  deadline: number
  aborted: boolean
  /** Depth of backtick nesting — inside `...`, ` terminates words */
  inBacktick: number
  /** When set, parseSimpleCommand stops at this token (for `[` backtrack) */
  stopToken: string | null
}

// parseSource 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSource(source: string, timeoutMs?: number): TsNode | null {
  // L构建`makeLexer`，供共享工具后续处理使用。
  const L = makeLexer(source)
  // srcBytes 集合保存`byteLengthUtf8`，供共享工具后续处理使用。
  const srcBytes = byteLengthUtf8(source)
  // P 集中保存共享工具 bash Parser要一起传递的字段。
  const P: ParseState = {
    L,
    src: source,
    srcBytes,
    isAscii: srcBytes === source.length,
    nodeCount: 0,
    deadline: performance.now() + (timeoutMs ?? PARSE_TIMEOUT_MS),
    aborted: false,
    inBacktick: 0,
    stopToken: null,
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // program解析`parseProgram`，供共享工具后续处理使用。
    const program = parseProgram(P)
    // 满足 `P.aborted` 时，共享工具执行该分支。
    if (P.aborted) return null
    // 返回 `program`，作为共享工具这次计算的结果。
    return program
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// byteLengthUtf8 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function byteLengthUtf8(s: string): number {
  // b保存`0`，供共享工具 bash Parser后续判断或输出使用。
  let b = 0
  // 按索引扫描 `s.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < s.length; i++) {
    // c保存`s.charCodeAt`，供共享工具后续处理使用。
    const c = s.charCodeAt(i)
    // 满足 `c < 0x80` 时，共享工具执行该分支。
    if (c < 0x80) b++
    else if (c < 0x800) b += 2
    else if (c >= 0xd800 && c <= 0xdbff) {
      // 共享工具 bash Parser在这里处理 `b += 4`，完成这一小步状态转换。
      b += 4
      // 共享工具 bash Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
    // 共享工具 bash Parser在这里处理 `} else b += 3`，完成这一小步状态转换。
    } else b += 3
  }
  // 返回 `b`，作为共享工具这次计算的结果。
  return b
}

// checkBudget 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkBudget(P: ParseState): void {
  // 共享工具 bash Parser在这里处理 `P.nodeCount++`，完成这一小步状态转换。
  P.nodeCount++
  // 满足 `P.nodeCount > MAX_NODES` 时，共享工具执行该分支。
  if (P.nodeCount > MAX_NODES) {
    // aborted更新为 `true`，确保Bash 解析工具后续读取最新状态。
    P.aborted = true
    // 抛出 new Error('budget')，阻止共享工具在无效状态下继续运行。
    throw new Error('budget')
  }
  // 只有 `(P.nodeCount & 0x7f) === 0 && performance.now() > P.deadline` 满足时，共享工具才执行该分支。
  if ((P.nodeCount & 0x7f) === 0 && performance.now() > P.deadline) {
    // aborted更新为 `true`，确保Bash 解析工具后续读取最新状态。
    P.aborted = true
    // 抛出 new Error('timeout')，阻止共享工具在无效状态下继续运行。
    throw new Error('timeout')
  }
}

/** Build a node. Slices text from source by byte range via char-index lookup. */
// mk 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mk(
  P: ParseState,
  type: string,
  start: number,
  end: number,
  children: TsNode[],
): TsNode {
  // 调用 checkBudget，触发共享工具此处需要的副作用。
  checkBudget(P)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type,
    text: sliceBytes(P, start, end),
    startIndex: start,
    endIndex: end,
    children,
  }
}

// sliceBytes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sliceBytes(P: ParseState, startByte: number, endByte: number): string {
  // 满足 `P.isAscii) return P.src.slice(startByte, endByte` 时，共享工具执行该分支。
  if (P.isAscii) return P.src.slice(startByte, endByte)
  // Find char indices for byte offsets. Build byte table if needed.
  // L保存`P.L`，供共享工具 bash Parser后续判断或输出使用。
  const L = P.L
  // 满足 `!L.byteTable) byteAt(L, 0` 时，共享工具执行该分支。
  if (!L.byteTable) byteAt(L, 0)
  // t保存`L.byteTable!`，供后续判断或组装使用。
  const t = L.byteTable!
  // Binary search for char index where byte offset matches
  // lo保存`0`，供后续判断或组装使用。
  let lo = 0
  // hi 命名 `P.src.length`，让后续代码直接表达这个值的用途。
  let hi = P.src.length
  // while 使用 lo < hi 完成共享工具里的对应操作。
  while (lo < hi) {
    // m保存`(lo + hi) >>> 1`，供共享工具 bash Parser后续判断或输出使用。
    const m = (lo + hi) >>> 1
    // 满足 `t[m]! < startByte` 时，共享工具执行该分支。
    if (t[m]! < startByte) lo = m + 1
    else hi = m
  }
  // sc 命名 `lo`，让后续代码直接表达这个值的用途。
  const sc = lo
  // lo更新为 `sc`，确保Bash 解析工具后续读取最新状态。
  lo = sc
  // hi更新为 `P.src.length`，确保Bash 解析工具后续读取最新状态。
  hi = P.src.length
  // while 使用 lo < hi 完成共享工具里的对应操作。
  while (lo < hi) {
    // m保存`(lo + hi) >>> 1`，供共享工具 bash Parser后续判断或输出使用。
    const m = (lo + hi) >>> 1
    // 满足 `t[m]! < endByte` 时，共享工具执行该分支。
    if (t[m]! < endByte) lo = m + 1
    else hi = m
  }
  // 返回 `P.src.slice(sc, lo)`，作为共享工具这次计算的结果。
  return P.src.slice(sc, lo)
}

// leaf 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function leaf(P: ParseState, type: string, tok: Token): TsNode {
  // 返回 `mk(P, type, tok.start, tok.end, [])`，作为共享工具这次计算的结果。
  return mk(P, type, tok.start, tok.end, [])
}

// parseProgram 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseProgram(P: ParseState): TsNode {
  // 子节点 从空数组开始收集，后续循环会按处理顺序追加条目。
  const children: TsNode[] = []
  // Skip leading whitespace & newlines — program start is first content byte
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 当 `t.type` 匹配 `'NEWLINE'` 时，共享工具执行对应分支。
    if (t.type === 'NEWLINE') {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 结束这个分支或循环，避免共享工具继续落入后续路径。
    break
  }
  // progStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const progStart = P.L.b
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 当 `t.type` 匹配 `'EOF'` 时，共享工具执行对应分支。
    if (t.type === 'EOF') break
    // 当 `t.type` 匹配 `'NEWLINE'` 时，共享工具执行对应分支。
    if (t.type === 'NEWLINE') continue
    // 当 `t.type` 匹配 `'COMMENT'` 时，共享工具执行对应分支。
    if (t.type === 'COMMENT') {
      // 子节点追加新条目，保持收集顺序与输入顺序一致。
      children.push(leaf(P, 'comment', t))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // stmts 集合解析`parseStatements`，供共享工具后续处理使用。
    const stmts = parseStatements(P, null)
    // 逐项读取 `stmts) children.push(s` 中的s 集合，按输入顺序推进共享工具。
    for (const s of stmts) children.push(s)
    // stmts 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (stmts.length === 0) {
      // Couldn't parse — emit ERROR and skip one token
      // errTok保存`nextToken`，供共享工具后续处理使用。
      const errTok = nextToken(P.L, 'cmd')
      // 当 `errTok.type` 匹配 `'EOF'` 时，共享工具执行对应分支。
      if (errTok.type === 'EOF') break
      // Stray `;;` at program level (e.g., `var=;;` outside case) — tree-sitter
      // silently elides. Keep leading `;` as ERROR (security: paste artifact).
      // 共享工具在这里按实际状态进入对应分支。
      if (
        errTok.type === 'OP' &&
        errTok.value === ';;' &&
        children.length > 0
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 子节点追加新条目，保持收集顺序与输入顺序一致。
      children.push(mk(P, 'ERROR', errTok.start, errTok.end, []))
    }
  }
  // tree-sitter includes trailing whitespace in program extent
  // progEnd 命名 `children.length > 0 ? P.srcBytes : progStart`，让后续代码直接表达这个值的用途。
  const progEnd = children.length > 0 ? P.srcBytes : progStart
  // 返回 `mk(P, 'program', progStart, progEnd, children)`，作为共享工具这次计算的结果。
  return mk(P, 'program', progStart, progEnd, children)
}

/** Packed as (b << 16) | i — avoids heap alloc on every backtrack. */
// LexSave 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LexSave = number
// saveLex 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function saveLex(L: Lexer): LexSave {
  // 返回 `L.b * 0x10000 + L.i`，作为共享工具这次计算的结果。
  return L.b * 0x10000 + L.i
}
// restoreLex 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function restoreLex(L: Lexer, s: LexSave): void {
  // i更新为 `s & 0xffff`，确保Bash 解析工具后续读取最新状态。
  L.i = s & 0xffff
  // b更新为 `s >>> 16`，确保Bash 解析工具后续读取最新状态。
  L.b = s >>> 16
}

/**
 * Parse a sequence of statements separated by ; & newline. Returns a flat list
 * where ; and & are sibling leaves (NOT wrapped in 'list' — only && || get
 * that). Stops at terminator or EOF.
 */
// parseStatements 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseStatements(P: ParseState, terminator: string | null): TsNode[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: TsNode[] = []
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 当 `t.type` 匹配 `'EOF'` 时，共享工具执行对应分支。
    if (t.type === 'EOF') {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 当 `t.type` 匹配 `'NEWLINE'` 时，共享工具执行对应分支。
    if (t.type === 'NEWLINE') {
      // Process pending heredocs
      // 满足 `P.L.heredocs.length > 0` 时，共享工具执行该分支。
      if (P.L.heredocs.length > 0) {
        // 调用 scanHeredocBodies，触发共享工具此处需要的副作用。
        scanHeredocBodies(P)
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `t.type` 匹配 `'COMMENT'` 时，共享工具执行对应分支。
    if (t.type === 'COMMENT') {
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(leaf(P, 'comment', t))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 只有 `terminator && t.type === 'OP' && t.value === term` 满足时，共享工具才执行该分支。
    if (terminator && t.type === 'OP' && t.value === terminator) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      t.type === 'OP' &&
      (t.value === ')' ||
        t.value === '}' ||
        t.value === ';;' ||
        t.value === ';&' ||
        t.value === ';;&' ||
        t.value === '))' ||
        t.value === ']]' ||
        t.value === ']')
    ) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 只有 `t.type === 'BACKTICK' && P.inBacktick > 0` 满足时，共享工具才执行该分支。
    if (t.type === 'BACKTICK' && P.inBacktick > 0) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      t.type === 'WORD' &&
      (t.value === 'then' ||
        t.value === 'elif' ||
        t.value === 'else' ||
        t.value === 'fi' ||
        t.value === 'do' ||
        t.value === 'done' ||
        t.value === 'esac')
    ) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // stmt解析`parseAndOr`，供共享工具后续处理使用。
    const stmt = parseAndOr(P)
    // stmt缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!stmt) break
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(stmt)
    // Look for separator
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // save2保存`saveLex`，供共享工具后续处理使用。
    const save2 = saveLex(P.L)
    // sep保存`nextToken`，供共享工具后续处理使用。
    const sep = nextToken(P.L, 'cmd')
    // 只有 `sep.type === 'OP' && (sep.value === ';' || sep.value === '&')` 满足时，共享工具才执行该分支。
    if (sep.type === 'OP' && (sep.value === ';' || sep.value === '&')) {
      // Check if terminator follows — if so, emit separator but stop
      // save3保存`saveLex`，供共享工具后续处理使用。
      const save3 = saveLex(P.L)
      // after保存`nextToken`，供共享工具后续处理使用。
      const after = nextToken(P.L, 'cmd')
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save3)
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(leaf(P, sep.value, sep))
      // 共享工具在这里按实际状态进入对应分支。
      if (
        after.type === 'EOF' ||
        (after.type === 'OP' &&
          (after.value === ')' ||
            after.value === '}' ||
            after.value === ';;' ||
            after.value === ';&' ||
            after.value === ';;&')) ||
        (after.type === 'WORD' &&
          (after.value === 'then' ||
            after.value === 'elif' ||
            after.value === 'else' ||
            after.value === 'fi' ||
            after.value === 'do' ||
            after.value === 'done' ||
            after.value === 'esac'))
      ) {
        // Trailing separator — don't include it at program level unless
        // there's content after. But at inner levels we keep it.
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    // 共享工具 bash Parser在这里处理 `} else if (sep.type === 'NEWLINE') {`，完成这一小步状态转换。
    } else if (sep.type === 'NEWLINE') {
      // 满足 `P.L.heredocs.length > 0` 时，共享工具执行该分支。
      if (P.L.heredocs.length > 0) {
        // 调用 scanHeredocBodies，触发共享工具此处需要的副作用。
        scanHeredocBodies(P)
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save2)
    }
  }
  // Trim trailing separator if at program level
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Parse pipeline chains joined by && ||. Left-associative nesting.
 * tree-sitter quirk: trailing redirect on the last pipeline wraps the ENTIRE
 * list in a redirected_statement — `a > x && b > y` becomes
 * redirected_statement(list(redirected_statement(a,>x), &&, b), >y).
 */
// parseAndOr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseAndOr(P: ParseState): TsNode | null {
  // left解析`parsePipeline`，供共享工具后续处理使用。
  let left = parsePipeline(P)
  // left缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!left) return null
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 只有 `t.type === 'OP' && (t.value === '&&' || t.value === '||')` 满足时，共享工具才执行该分支。
    if (t.type === 'OP' && (t.value === '&&' || t.value === '||')) {
      // op保存`leaf`，供共享工具后续处理使用。
      const op = leaf(P, t.value, t)
      // 调用 skipNewlines，触发共享工具此处需要的副作用。
      skipNewlines(P)
      // right解析`parsePipeline`，供共享工具后续处理使用。
      const right = parsePipeline(P)
      // right缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!right) {
        // left更新为 `mk(P, 'list', left.startIndex, op.endIndex, [left, op])`，确保Bash 解析工具后续读取最新状态。
        left = mk(P, 'list', left.startIndex, op.endIndex, [left, op])
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // If right is a redirected_statement, hoist its redirects to wrap the list.
      // 只有 `right.type === 'redirected_statement' && right.ch` 满足时，共享工具才执行该分支。
      if (right.type === 'redirected_statement' && right.children.length >= 2) {
        // inner读取 `right.children[0]!` 对应条目，后续围绕该成员继续处理。
        const inner = right.children[0]!
        // redirs 集合格式化`children.slice`，供共享工具后续处理使用。
        const redirs = right.children.slice(1)
        // listNode 集合保存`mk`，供共享工具后续处理使用。
        const listNode = mk(P, 'list', left.startIndex, inner.endIndex, [
          left,
          op,
          inner,
        ])
        // lastR 命名 `redirs[redirs.length - 1]!`，让后续代码直接表达这个值的用途。
        const lastR = redirs[redirs.length - 1]!
        // left更新为 `mk(`，确保Bash 解析工具后续读取最新状态。
        left = mk(
          P,
          'redirected_statement',
          listNode.startIndex,
          lastR.endIndex,
          [listNode, ...redirs],
        )
      } else {
        // left更新为 `mk(P, 'list', left.startIndex, right.endIndex, [left, op,...`，确保Bash 解析工具后续读取最新状态。
        left = mk(P, 'list', left.startIndex, right.endIndex, [left, op, right])
      }
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 返回 `left`，作为共享工具这次计算的结果。
  return left
}

// skipNewlines 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function skipNewlines(P: ParseState): void {
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // `t.type` 与 `'NEWLINE'` 不一致时刷新派生状态，避免使用过期结果。
    if (t.type !== 'NEWLINE') {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
}

/**
 * Parse commands joined by | or |&. Flat children with operator leaves.
 * tree-sitter quirk: `a | b 2>nul | c` hoists the redirect on `b` to wrap
 * the preceding pipeline fragment — pipeline(redirected_statement(
 * pipeline(a,|,b), 2>nul), |, c).
 */
// parsePipeline 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePipeline(P: ParseState): TsNode | null {
  // first解析`parseCommand`，供共享工具后续处理使用。
  let first = parseCommand(P)
  // first缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!first) return null
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts: TsNode[] = [first]
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 只有 `t.type === 'OP' && (t.value === '|' || t.value === '|&')` 满足时，共享工具才执行该分支。
    if (t.type === 'OP' && (t.value === '|' || t.value === '|&')) {
      // op保存`leaf`，供共享工具后续处理使用。
      const op = leaf(P, t.value, t)
      // 调用 skipNewlines，触发共享工具此处需要的副作用。
      skipNewlines(P)
      // next解析`parseCommand`，供共享工具后续处理使用。
      const next = parseCommand(P)
      // next缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!next) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(op)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // Hoist trailing redirect on `next` to wrap current pipeline fragment
      // 共享工具在这里按实际状态进入对应分支。
      if (
        next.type === 'redirected_statement' &&
        next.children.length >= 2 &&
        parts.length >= 1
      ) {
        // inner读取 `next.children[0]!` 对应条目，后续围绕该成员继续处理。
        const inner = next.children[0]!
        // redirs 集合格式化`children.slice`，供共享工具后续处理使用。
        const redirs = next.children.slice(1)
        // Wrap existing parts + op + inner as a pipeline
        // pipeKids 集合 聚合成有序列表，保持后续遍历顺序稳定。
        const pipeKids = [...parts, op, inner]
        // pipeNode保存`mk`，供共享工具后续处理使用。
        const pipeNode = mk(
          P,
          'pipeline',
          pipeKids[0]!.startIndex,
          inner.endIndex,
          pipeKids,
        )
        // lastR 命名 `redirs[redirs.length - 1]!`，让后续代码直接表达这个值的用途。
        const lastR = redirs[redirs.length - 1]!
        // wrapped保存`mk`，供共享工具后续处理使用。
        const wrapped = mk(
          P,
          'redirected_statement',
          pipeNode.startIndex,
          lastR.endIndex,
          [pipeNode, ...redirs],
        )
        // 片段列表被清空，Bash 解析工具从干净状态继续。
        parts.length = 0
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(wrapped)
        // first更新为 `wrapped`，确保Bash 解析工具后续读取最新状态。
        first = wrapped
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(op, next)
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 满足 `parts.length === 1` 时，共享工具执行该分支。
  if (parts.length === 1) return parts[0]!
  // last 命名 `parts[parts.length - 1]!`，让后续代码直接表达这个值的用途。
  const last = parts[parts.length - 1]!
  // 返回 `mk(P, 'pipeline', parts[0]!.startIndex, last.endIndex, parts)`，作为共享工具这次计算的结果。
  return mk(P, 'pipeline', parts[0]!.startIndex, last.endIndex, parts)
}

/** Parse a single command: simple, compound, or control structure. */
// parseCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCommand(P: ParseState): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // t保存`nextToken`，供共享工具后续处理使用。
  const t = nextToken(P.L, 'cmd')

  // 当 `t.type` 匹配 `'EOF'` 时，共享工具执行对应分支。
  if (t.type === 'EOF') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Negation — tree-sitter wraps just the command, redirects go outside.
  // `! cmd > out` → redirected_statement(negated_command(!, cmd), >out)
  // 当 `t.type` 匹配 `'OP' && t.value === '!'` 时，共享工具执行对应分支。
  if (t.type === 'OP' && t.value === '!') {
    // bang保存`leaf`，供共享工具后续处理使用。
    const bang = leaf(P, '!', t)
    // inner解析`parseCommand`，供共享工具后续处理使用。
    const inner = parseCommand(P)
    // inner缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inner) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // If inner is a redirected_statement, hoist redirects outside negation
    // 只有 `inner.type === 'redirected_statement' && inner.ch` 满足时，共享工具才执行该分支。
    if (inner.type === 'redirected_statement' && inner.children.length >= 2) {
      // cmd 命令数据读取 `inner.children[0]!` 对应条目，后续围绕该成员继续处理。
      const cmd = inner.children[0]!
      // redirs 集合格式化`children.slice`，供共享工具后续处理使用。
      const redirs = inner.children.slice(1)
      // neg保存`mk`，供共享工具后续处理使用。
      const neg = mk(P, 'negated_command', bang.startIndex, cmd.endIndex, [
        bang,
        cmd,
      ])
      // lastR 命名 `redirs[redirs.length - 1]!`，让后续代码直接表达这个值的用途。
      const lastR = redirs[redirs.length - 1]!
      // 返回 `mk(P, 'redirected_statement', neg.startIndex, lastR.endIndex, [`，作为共享工具这次计算的结果。
      return mk(P, 'redirected_statement', neg.startIndex, lastR.endIndex, [
        neg,
        ...redirs,
      ])
    }
    // 返回 `mk(P, 'negated_command', bang.startIndex, inner.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'negated_command', bang.startIndex, inner.endIndex, [
      bang,
      inner,
    ])
  }

  // 当 `t.type` 匹配 `'OP' && t.value === '('` 时，共享工具执行对应分支。
  if (t.type === 'OP' && t.value === '(') {
    // open保存`leaf`，供共享工具后续处理使用。
    const open = leaf(P, '(', t)
    // 请求体解析`parseStatements`，供共享工具后续处理使用。
    const body = parseStatements(P, ')')
    // closeTok保存`nextToken`，供共享工具后续处理使用。
    const closeTok = nextToken(P.L, 'cmd')
    // close 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const close =
      closeTok.type === 'OP' && closeTok.value === ')'
        ? leaf(P, ')', closeTok)
        : mk(P, ')', open.endIndex, open.endIndex, [])
    // node保存`mk`，供共享工具后续处理使用。
    const node = mk(P, 'subshell', open.startIndex, close.endIndex, [
      open,
      ...body,
      close,
    ])
    // 返回 `maybeRedirect(P, node)`，作为共享工具这次计算的结果。
    return maybeRedirect(P, node)
  }

  // 当 `t.type` 匹配 `'OP' && t.value === '(('` 时，共享工具执行对应分支。
  if (t.type === 'OP' && t.value === '((') {
    // open保存`leaf`，供共享工具后续处理使用。
    const open = leaf(P, '((', t)
    // exprs 集合解析`parseArithCommaList`，供共享工具后续处理使用。
    const exprs = parseArithCommaList(P, '))', 'var')
    // closeTok保存`nextToken`，供共享工具后续处理使用。
    const closeTok = nextToken(P.L, 'cmd')
    // close 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const close =
      closeTok.value === '))'
        ? leaf(P, '))', closeTok)
        : mk(P, '))', open.endIndex, open.endIndex, [])
    // 返回 `mk(P, 'compound_statement', open.startIndex, close.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'compound_statement', open.startIndex, close.endIndex, [
      open,
      ...exprs,
      close,
    ])
  }

  // 当 `t.type` 匹配 `'OP' && t.value === '{'` 时，共享工具执行对应分支。
  if (t.type === 'OP' && t.value === '{') {
    // open保存`leaf`，供共享工具后续处理使用。
    const open = leaf(P, '{', t)
    // 请求体解析`parseStatements`，供共享工具后续处理使用。
    const body = parseStatements(P, '}')
    // closeTok保存`nextToken`，供共享工具后续处理使用。
    const closeTok = nextToken(P.L, 'cmd')
    // close 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const close =
      closeTok.type === 'OP' && closeTok.value === '}'
        ? leaf(P, '}', closeTok)
        : mk(P, '}', open.endIndex, open.endIndex, [])
    // node保存`mk`，供共享工具后续处理使用。
    const node = mk(P, 'compound_statement', open.startIndex, close.endIndex, [
      open,
      ...body,
      close,
    ])
    // 返回 `maybeRedirect(P, node)`，作为共享工具这次计算的结果。
    return maybeRedirect(P, node)
  }

  // 只有 `t.type === 'OP' && (t.value === '[' || t.value === '[[')` 满足时，共享工具才执行该分支。
  if (t.type === 'OP' && (t.value === '[' || t.value === '[[')) {
    // open保存`leaf`，供共享工具后续处理使用。
    const open = leaf(P, t.value, t)
    // closer标记共享工具 bash Parser是否启用对应路径。
    const closer = t.value === '[' ? ']' : ']]'
    // Grammar: `[` can contain choice(_expression, redirected_statement).
    // Try _expression first; if we don't reach `]`, backtrack and parse as
    // redirected_statement (handles `[ ! cmd -v go &>/dev/null ]`).
    // exprSave保存`saveLex`，供共享工具后续处理使用。
    const exprSave = saveLex(P.L)
    // expr解析`parseTestExpr`，供共享工具后续处理使用。
    let expr = parseTestExpr(P, closer)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `t.value` 匹配 `'[' && peek(P.L) !== ']'` 时，共享工具执行对应分支。
    if (t.value === '[' && peek(P.L) !== ']') {
      // Expression parse didn't reach `]` — try as redirected_statement.
      // Thread `]` stop-token so parseSimpleCommand doesn't eat it as arg.
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, exprSave)
      // prevStop 命名 `P.stopToken`，让后续代码直接表达这个值的用途。
      const prevStop = P.stopToken
      // stopToken更新为 `']'`，确保Bash 解析工具后续读取最新状态。
      P.stopToken = ']'
      // rstmt解析`parseCommand`，供共享工具后续处理使用。
      const rstmt = parseCommand(P)
      // stopToken更新为 `prevStop`，确保Bash 解析工具后续读取最新状态。
      P.stopToken = prevStop
      // 当 `rstmt && rstmt.type` 匹配 `'redirected_statement'` 时，共享工具执行对应分支。
      if (rstmt && rstmt.type === 'redirected_statement') {
        // expr更新为 `rstmt`，确保Bash 解析工具后续读取最新状态。
        expr = rstmt
      } else {
        // Neither worked — restore and keep the expression result
        // 调用 restoreLex，触发共享工具此处需要的副作用。
        restoreLex(P.L, exprSave)
        // expr更新为 `parseTestExpr(P, closer)`，确保Bash 解析工具后续读取最新状态。
        expr = parseTestExpr(P, closer)
      }
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
    }
    // closeTok保存`nextToken`，供共享工具后续处理使用。
    const closeTok = nextToken(P.L, 'arg')
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 满足 `closeTok.value === closer` 时，共享工具执行该分支。
    if (closeTok.value === closer) {
      // close更新为 `leaf(P, closer, closeTok)`，确保Bash 解析工具后续读取最新状态。
      close = leaf(P, closer, closeTok)
    } else {
      // close更新为 `mk(P, closer, open.endIndex, open.endIndex, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, closer, open.endIndex, open.endIndex, [])
    }
    // kids 集合 命名 `expr ? [open, expr, close] : [open, close]`，让后续代码直接表达这个值的用途。
    const kids = expr ? [open, expr, close] : [open, close]
    // 返回 `mk(P, 'test_command', open.startIndex, close.endIndex, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'test_command', open.startIndex, close.endIndex, kids)
  }

  // 当 `t.type` 匹配 `'WORD'` 时，共享工具执行对应分支。
  if (t.type === 'WORD') {
    // 满足 `t.value === 'if') return maybeRedirect(P, parseIf(P, t), true` 时，共享工具执行该分支。
    if (t.value === 'if') return maybeRedirect(P, parseIf(P, t), true)
    // 当 `t.value` 匹配 `'while' || t.value === 'unt...` 时，共享工具执行对应分支。
    if (t.value === 'while' || t.value === 'until')
      // 返回 `maybeRedirect(P, parseWhile(P, t), true)`，作为共享工具这次计算的结果。
      return maybeRedirect(P, parseWhile(P, t), true)
    // 满足 `t.value === 'for') return maybeRedirect(P, parseFor(P, t), true` 时，共享工具执行该分支。
    if (t.value === 'for') return maybeRedirect(P, parseFor(P, t), true)
    // 满足 `t.value === 'select') return maybeRedirect(P, parseFor(P, t), true` 时，共享工具执行该分支。
    if (t.value === 'select') return maybeRedirect(P, parseFor(P, t), true)
    // 满足 `t.value === 'case') return maybeRedirect(P, parseCase(P, t), true` 时，共享工具执行该分支。
    if (t.value === 'case') return maybeRedirect(P, parseCase(P, t), true)
    // 满足 `t.value === 'function') return parseFunction(P, t` 时，共享工具执行该分支。
    if (t.value === 'function') return parseFunction(P, t)
    // 满足 `DECL_KEYWORDS.has(t.value)` 时，共享工具执行该分支。
    if (DECL_KEYWORDS.has(t.value))
      // 返回 `maybeRedirect(P, parseDeclaration(P, t))`，作为共享工具这次计算的结果。
      return maybeRedirect(P, parseDeclaration(P, t))
    // 当 `t.value` 匹配 `'unset' || t.value === 'uns...` 时，共享工具执行对应分支。
    if (t.value === 'unset' || t.value === 'unsetenv') {
      // 返回 `maybeRedirect(P, parseUnset(P, t))`，作为共享工具这次计算的结果。
      return maybeRedirect(P, parseUnset(P, t))
    }
  }

  // 调用 restoreLex，触发共享工具此处需要的副作用。
  restoreLex(P.L, save)
  // 返回 `parseSimpleCommand(P)`，作为共享工具这次计算的结果。
  return parseSimpleCommand(P)
}

/**
 * Parse a simple command: [assignment]* word [arg|redirect]*
 * Returns variable_assignment if only one assignment and no command.
 */
// parseSimpleCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSimpleCommand(P: ParseState): TsNode | null {
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // assignments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const assignments: TsNode[] = []
  // preRedirects 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const preRedirects: TsNode[] = []

  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // a保存`tryParseAssignment`，供共享工具后续处理使用。
    const a = tryParseAssignment(P)
    // 满足 `a` 时，共享工具执行该分支。
    if (a) {
      // assignments 集合追加新条目，保持收集顺序与输入顺序一致。
      assignments.push(a)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // r保存`tryParseRedirect`，供共享工具后续处理使用。
    const r = tryParseRedirect(P)
    // 满足 `r` 时，共享工具执行该分支。
    if (r) {
      // preRedirects 集合追加新条目，保持收集顺序与输入顺序一致。
      preRedirects.push(r)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 结束这个分支或循环，避免共享工具继续落入后续路径。
    break
  }

  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // nameTok保存`nextToken`，供共享工具后续处理使用。
  const nameTok = nextToken(P.L, 'cmd')
  // 共享工具在这里按实际状态进入对应分支。
  if (
    nameTok.type === 'EOF' ||
    nameTok.type === 'NEWLINE' ||
    nameTok.type === 'COMMENT' ||
    (nameTok.type === 'OP' &&
      nameTok.value !== '{' &&
      nameTok.value !== '[' &&
      nameTok.value !== '[[') ||
    (nameTok.type === 'WORD' &&
      SHELL_KEYWORDS.has(nameTok.value) &&
      nameTok.value !== 'in')
  ) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // No command — standalone assignment(s) or redirect
    // 只有 `assignments.length === 1 && preRedirects.length =` 满足时，共享工具才执行该分支。
    if (assignments.length === 1 && preRedirects.length === 0) {
      // 返回 `assignments[0]!`，作为共享工具这次计算的结果。
      return assignments[0]!
    }
    // 只有 `preRedirects.length > 0 && assignments.length ===` 满足时，共享工具才执行该分支。
    if (preRedirects.length > 0 && assignments.length === 0) {
      // Bare redirect → redirected_statement with just file_redirect children
      // last记录 `preRedirects[preRedirects.length - 1]!` 是否成立，下一步按该结果分支。
      const last = preRedirects[preRedirects.length - 1]!
      // 返回 `mk(`，作为共享工具这次计算的结果。
      return mk(
        P,
        'redirected_statement',
        preRedirects[0]!.startIndex,
        last.endIndex,
        preRedirects,
      )
    }
    // 只有 `assignments.length > 1 && preRedirects.length ===` 满足时，共享工具才执行该分支。
    if (assignments.length > 1 && preRedirects.length === 0) {
      // `A=1 B=2` with no command → variable_assignments (plural)
      // last保存 `assignments[assignments.length - 1]!` 的判断结果，供共享工具 bash Parser后续分支直接复用。
      const last = assignments[assignments.length - 1]!
      // 返回 `mk(`，作为共享工具这次计算的结果。
      return mk(
        P,
        'variable_assignments',
        assignments[0]!.startIndex,
        last.endIndex,
        assignments,
      )
    }
    // 只有 `assignments.length > 0 || preRedirects.length > 0` 满足时，共享工具才执行该分支。
    if (assignments.length > 0 || preRedirects.length > 0) {
      // all 聚合成有序列表，保持后续遍历顺序稳定。
      const all = [...assignments, ...preRedirects]
      // last记录 `all[all.length - 1]!` 是否成立，下一步按该结果分支。
      const last = all[all.length - 1]!
      // 返回 `mk(P, 'command', start, last.endIndex, all)`，作为共享工具这次计算的结果。
      return mk(P, 'command', start, last.endIndex, all)
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 调用 restoreLex，触发共享工具此处需要的副作用。
  restoreLex(P.L, save)

  // Check for function definition: name() { ... }
  // fnSave保存`saveLex`，供共享工具后续处理使用。
  const fnSave = saveLex(P.L)
  // nm解析`parseWord`，供共享工具后续处理使用。
  const nm = parseWord(P, 'cmd')
  // 当 `nm && nm.type` 匹配 `'word'` 时，共享工具执行对应分支。
  if (nm && nm.type === 'word') {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `peek(P.L)` 匹配 `'(' && peek(P.L, 1) === ')'` 时，共享工具执行对应分支。
    if (peek(P.L) === '(' && peek(P.L, 1) === ')') {
      // oTok保存`nextToken`，供共享工具后续处理使用。
      const oTok = nextToken(P.L, 'cmd')
      // cTok保存`nextToken`，供共享工具后续处理使用。
      const cTok = nextToken(P.L, 'cmd')
      // oParen保存`leaf`，供共享工具后续处理使用。
      const oParen = leaf(P, '(', oTok)
      // cParen保存`leaf`，供共享工具后续处理使用。
      const cParen = leaf(P, ')', cTok)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 调用 skipNewlines，触发共享工具此处需要的副作用。
      skipNewlines(P)
      // 请求体解析`parseCommand`，供共享工具后续处理使用。
      const body = parseCommand(P)
      // 满足 `body` 时，共享工具执行该分支。
      if (body) {
        // If body is redirected_statement(compound_statement, file_redirect...),
        // hoist redirects to function_definition level per tree-sitter grammar
        // bodyKids 集合 聚合成有序列表，保持后续遍历顺序稳定。
        let bodyKids: TsNode[] = [body]
        // 共享工具在这里按实际状态进入对应分支。
        if (
          body.type === 'redirected_statement' &&
          body.children.length >= 2 &&
          body.children[0]!.type === 'compound_statement'
        ) {
          // bodyKids 集合更新为 `body.children`，确保Bash 解析工具后续读取最新状态。
          bodyKids = body.children
        }
        // last保存 `bodyKids[bodyKids.length - 1]!` 的判断结果，供共享工具 bash Parser后续分支直接复用。
        const last = bodyKids[bodyKids.length - 1]!
        // 返回 `mk(P, 'function_definition', nm.startIndex, last.endIndex, [`，作为共享工具这次计算的结果。
        return mk(P, 'function_definition', nm.startIndex, last.endIndex, [
          nm,
          oParen,
          cParen,
          ...bodyKids,
        ])
      }
    }
  }
  // 调用 restoreLex，触发共享工具此处需要的副作用。
  restoreLex(P.L, fnSave)

  // nameArg解析`parseWord`，供共享工具后续处理使用。
  const nameArg = parseWord(P, 'cmd')
  // nameArg缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!nameArg) {
    // 满足 `assignments.length === 1` 时，共享工具执行该分支。
    if (assignments.length === 1) return assignments[0]!
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // cmdName 命令数据保存`mk`，供共享工具后续处理使用。
  const cmdName = mk(P, 'command_name', nameArg.startIndex, nameArg.endIndex, [
    nameArg,
  ])

  // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const args: TsNode[] = []
  // redirects 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const redirects: TsNode[] = []
  // heredocRedirect 命名 `null`，让后续代码直接表达这个值的用途。
  let heredocRedirect: TsNode | null = null

  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // Post-command redirects are greedy (repeat1 $._literal) — once a redirect
    // appears after command_name, subsequent literals attach to it per grammar's
    // prec.left. `grep 2>/dev/null -q foo` → file_redirect eats `-q foo`.
    // Args parsed BEFORE the first redirect still go to command (cat a b > out).
    // r保存`tryParseRedirect`，供共享工具后续处理使用。
    const r = tryParseRedirect(P, true)
    // 满足 `r` 时，共享工具执行该分支。
    if (r) {
      // 当 `r.type` 匹配 `'heredoc_redirect'` 时，共享工具执行对应分支。
      if (r.type === 'heredoc_redirect') {
        // heredocRedirect更新为 `r`，确保Bash 解析工具后续读取最新状态。
        heredocRedirect = r
      // 共享工具 bash Parser在这里处理 `} else if (r.type === 'herestring_redirect') {`，完成这一小步状态转换。
      } else if (r.type === 'herestring_redirect') {
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push(r)
      } else {
        // redirects 集合追加新条目，保持收集顺序与输入顺序一致。
        redirects.push(r)
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Once a file_redirect has been seen, command args are done — grammar's
    // command rule doesn't allow file_redirect in its post-name choice, so
    // anything after belongs to redirected_statement's file_redirect children.
    // 满足 `redirects.length > 0` 时，共享工具执行该分支。
    if (redirects.length > 0) break
    // `[` test_command backtrack — stop at `]` so outer handler can consume it
    // 当 `P.stopToken` 匹配 `']' && peek(P.L) === ']'` 时，共享工具执行对应分支。
    if (P.stopToken === ']' && peek(P.L) === ']') break
    // save2保存`saveLex`，供共享工具后续处理使用。
    const save2 = saveLex(P.L)
    // pk保存`nextToken`，供共享工具后续处理使用。
    const pk = nextToken(P.L, 'arg')
    // 共享工具在这里按实际状态进入对应分支。
    if (
      pk.type === 'EOF' ||
      pk.type === 'NEWLINE' ||
      pk.type === 'COMMENT' ||
      (pk.type === 'OP' &&
        (pk.value === '|' ||
          pk.value === '|&' ||
          pk.value === '&&' ||
          pk.value === '||' ||
          pk.value === ';' ||
          pk.value === ';;' ||
          pk.value === ';&' ||
          pk.value === ';;&' ||
          pk.value === '&' ||
          pk.value === ')' ||
          pk.value === '}' ||
          pk.value === '))'))
    ) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save2)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save2)
    // 当前参数解析`parseWord`，供共享工具后续处理使用。
    const arg = parseWord(P, 'arg')
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) {
      // Lone `(` in arg position — tree-sitter parses this as subshell arg
      // e.g., `echo =(cmd)` → command has ERROR(=), subshell(cmd) as args
      // 当 `peek(P.L)` 匹配 `'('` 时，共享工具执行对应分支。
      if (peek(P.L) === '(') {
        // oTok保存`nextToken`，供共享工具后续处理使用。
        const oTok = nextToken(P.L, 'cmd')
        // open保存`leaf`，供共享工具后续处理使用。
        const open = leaf(P, '(', oTok)
        // 请求体解析`parseStatements`，供共享工具后续处理使用。
        const body = parseStatements(P, ')')
        // cTok保存`nextToken`，供共享工具后续处理使用。
        const cTok = nextToken(P.L, 'cmd')
        // close 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const close =
          cTok.type === 'OP' && cTok.value === ')'
            ? leaf(P, ')', cTok)
            : mk(P, ')', open.endIndex, open.endIndex, [])
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push(
          mk(P, 'subshell', open.startIndex, close.endIndex, [
            open,
            ...body,
            close,
          ]),
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // Lone `=` in arg position is a parse error in bash — tree-sitter wraps
    // it in ERROR for recovery. Happens in `echo =(cmd)` (zsh process-sub).
    // 当 `arg.type` 匹配 `'word' && arg.text === '='` 时，共享工具执行对应分支。
    if (arg.type === 'word' && arg.text === '=') {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(mk(P, 'ERROR', arg.startIndex, arg.endIndex, [arg]))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Word immediately followed by `(` (no whitespace) is a parse error —
    // bash doesn't allow glob-then-subshell adjacency. tree-sitter wraps the
    // word in ERROR. Catches zsh glob qualifiers like `*.(e:'cmd':)`.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      (arg.type === 'word' || arg.type === 'concatenation') &&
      peek(P.L) === '(' &&
      P.L.b === arg.endIndex
    ) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(mk(P, 'ERROR', arg.startIndex, arg.endIndex, [arg]))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push(arg)
  }

  // preRedirects (e.g., `2>&1 cat`, `<<<str cmd`) go INSIDE the command node
  // before command_name per tree-sitter grammar, not in redirected_statement
  // cmdChildren 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
  const cmdChildren = [...assignments, ...preRedirects, cmdName, ...args]
  // cmdEnd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cmdEnd =
    cmdChildren.length > 0
      ? cmdChildren[cmdChildren.length - 1]!.endIndex
      : cmdName.endIndex
  // cmdStart 命令数据 命名 `cmdChildren[0]!.startIndex`，让后续代码直接表达这个值的用途。
  const cmdStart = cmdChildren[0]!.startIndex
  // cmd 命令数据保存`mk`，供共享工具后续处理使用。
  const cmd = mk(P, 'command', cmdStart, cmdEnd, cmdChildren)

  // 满足 `heredocRedirect` 时，共享工具执行该分支。
  if (heredocRedirect) {
    // Scan heredoc body now
    // 调用 scanHeredocBodies，触发共享工具此处需要的副作用。
    scanHeredocBodies(P)
    // hd保存`heredocs.shift`，供共享工具后续处理使用。
    const hd = P.L.heredocs.shift()
    // 只有 `hd && heredocRedirect.children.length >= 2` 满足时，共享工具才执行该分支。
    if (hd && heredocRedirect.children.length >= 2) {
      // bodyNode保存`mk`，供共享工具后续处理使用。
      const bodyNode = mk(
        P,
        'heredoc_body',
        hd.bodyStart,
        hd.bodyEnd,
        hd.quoted ? [] : parseHeredocBodyContent(P, hd.bodyStart, hd.bodyEnd),
      )
      // endNode保存`mk`，供共享工具后续处理使用。
      const endNode = mk(P, 'heredoc_end', hd.endStart, hd.endEnd, [])
      // 子节点追加新条目，保持收集顺序与输入顺序一致。
      heredocRedirect.children.push(bodyNode, endNode)
      // endIndex 索引更新为 `hd.endEnd`，确保Bash 解析工具后续读取最新状态。
      heredocRedirect.endIndex = hd.endEnd
      // 文本更新为 `sliceBytes(`，确保Bash 解析工具后续读取最新状态。
      heredocRedirect.text = sliceBytes(
        P,
        heredocRedirect.startIndex,
        hd.endEnd,
      )
    }
    // allR 聚合成有序列表，保持后续遍历顺序稳定。
    const allR = [...preRedirects, heredocRedirect, ...redirects]
    // rStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const rStart =
      preRedirects.length > 0
        ? Math.min(cmd.startIndex, preRedirects[0]!.startIndex)
        : cmd.startIndex
    // 返回 `mk(P, 'redirected_statement', rStart, heredocRedirect.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'redirected_statement', rStart, heredocRedirect.endIndex, [
      cmd,
      ...allR,
    ])
  }

  // 满足 `redirects.length > 0` 时，共享工具执行该分支。
  if (redirects.length > 0) {
    // last 命名 `redirects[redirects.length - 1]!`，让后续代码直接表达这个值的用途。
    const last = redirects[redirects.length - 1]!
    // 返回 `mk(P, 'redirected_statement', cmd.startIndex, last.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'redirected_statement', cmd.startIndex, last.endIndex, [
      cmd,
      ...redirects,
    ])
  }

  // 返回 `cmd`，作为共享工具这次计算的结果。
  return cmd
}

// maybeRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeRedirect(
  P: ParseState,
  node: TsNode,
  allowHerestring = false,
): TsNode {
  // redirects 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const redirects: TsNode[] = []
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // r保存`tryParseRedirect`，供共享工具后续处理使用。
    const r = tryParseRedirect(P)
    // r缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!r) break
    // 只有 `r.type === 'herestring_redirect' && !allowHerestr` 满足时，共享工具才执行该分支。
    if (r.type === 'herestring_redirect' && !allowHerestring) {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // redirects 集合追加新条目，保持收集顺序与输入顺序一致。
    redirects.push(r)
  }
  // redirects 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (redirects.length === 0) return node
  // last 命名 `redirects[redirects.length - 1]!`，让后续代码直接表达这个值的用途。
  const last = redirects[redirects.length - 1]!
  // 返回 `mk(P, 'redirected_statement', node.startIndex, last.endIndex, [`，作为共享工具这次计算的结果。
  return mk(P, 'redirected_statement', node.startIndex, last.endIndex, [
    node,
    ...redirects,
  ])
}

// tryParseAssignment 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tryParseAssignment(P: ParseState): TsNode | null {
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // startB保存`P.L.b`，供后续判断或组装使用。
  const startB = P.L.b
  // Must start with identifier
  // 满足 `!isIdentStart(peek(P.L))` 时，共享工具执行该分支。
  if (!isIdentStart(peek(P.L))) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (isIdentChar(peek(P.L))) advance(P.L)
  // nameEnd保存`P.L.b`，供后续判断或组装使用。
  const nameEnd = P.L.b
  // Optional subscript
  // subEnd保存`nameEnd`，供后续判断或组装使用。
  let subEnd = nameEnd
  // 当 `peek(P.L)` 匹配 `'['` 时，共享工具执行对应分支。
  if (peek(P.L) === '[') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // depth保存`1`，供后续判断或组装使用。
    let depth = 1
    // while 使用 P.L.i < P.L.len && depth > 0 完成共享工具里的对应操作。
    while (P.L.i < P.L.len && depth > 0) {
      // c保存`peek`，供共享工具后续处理使用。
      const c = peek(P.L)
      // 当 `c` 匹配 `'['` 时，共享工具执行对应分支。
      if (c === '[') depth++
      else if (c === ']') depth--
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
    }
    // subEnd更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
    subEnd = P.L.b
  }
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // op 先占位，稍后的条件分支会根据实际输入补齐它。
  let op: string
  // 当 `c` 匹配 `'=' && c1 !== '='` 时，共享工具执行对应分支。
  if (c === '=' && c1 !== '=') {
    // op更新为 `'='`，确保Bash 解析工具后续读取最新状态。
    op = '='
  // 共享工具 bash Parser在这里处理 `} else if (c === '+' && c1 === '=') {`，完成这一小步状态转换。
  } else if (c === '+' && c1 === '=') {
    // op更新为 `'+='`，确保Bash 解析工具后续读取最新状态。
    op = '+='
  } else {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // nameNode保存`mk`，供共享工具后续处理使用。
  const nameNode = mk(P, 'variable_name', startB, nameEnd, [])
  // Subscript handling: wrap in subscript node if present
  // lhs 集合 命名 `nameNode`，让后续代码直接表达这个值的用途。
  let lhs: TsNode = nameNode
  // 满足 `subEnd > nameEnd` 时，共享工具执行该分支。
  if (subEnd > nameEnd) {
    // brOpen保存`mk`，供共享工具后续处理使用。
    const brOpen = mk(P, '[', nameEnd, nameEnd + 1, [])
    // idx解析`parseSubscriptIndex`，供共享工具后续处理使用。
    const idx = parseSubscriptIndex(P, nameEnd + 1, subEnd - 1)
    // brClose保存`mk`，供共享工具后续处理使用。
    const brClose = mk(P, ']', subEnd - 1, subEnd, [])
    // lhs 集合更新为 `mk(P, 'subscript', startB, subEnd, [nameNode, brOpen, idx...`，确保Bash 解析工具后续读取最新状态。
    lhs = mk(P, 'subscript', startB, subEnd, [nameNode, brOpen, idx, brClose])
  }
  // opStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const opStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // 满足 `op === '+=') advance(P.L` 时，共享工具执行该分支。
  if (op === '+=') advance(P.L)
  // opEnd保存`P.L.b`，供后续判断或组装使用。
  const opEnd = P.L.b
  // opNode保存`mk`，供共享工具后续处理使用。
  const opNode = mk(P, op, opStart, opEnd, [])
  // val保存`null`，作为后续空值处理的输入。
  let val: TsNode | null = null
  // 当 `peek(P.L)` 匹配 `'('` 时，共享工具执行对应分支。
  if (peek(P.L) === '(') {
    // Array
    // aoTok保存`nextToken`，供共享工具后续处理使用。
    const aoTok = nextToken(P.L, 'cmd')
    // aOpen保存`leaf`，供共享工具后续处理使用。
    const aOpen = leaf(P, '(', aoTok)
    // elems 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const elems: TsNode[] = [aOpen]
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
      if (peek(P.L) === ')') break
      // e解析`parseWord`，供共享工具后续处理使用。
      const e = parseWord(P, 'arg')
      // e缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!e) break
      // elems 集合追加新条目，保持收集顺序与输入顺序一致。
      elems.push(e)
    }
    // acTok保存`nextToken`，供共享工具后续处理使用。
    const acTok = nextToken(P.L, 'cmd')
    // aClose 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const aClose =
      acTok.value === ')'
        ? leaf(P, ')', acTok)
        : mk(P, ')', aOpen.endIndex, aOpen.endIndex, [])
    // elems 集合追加新条目，保持收集顺序与输入顺序一致。
    elems.push(aClose)
    // val更新为 `mk(P, 'array', aOpen.startIndex, aClose.endIndex, elems)`，确保Bash 解析工具后续读取最新状态。
    val = mk(P, 'array', aOpen.startIndex, aClose.endIndex, elems)
  } else {
    // c2保存`peek`，供共享工具后续处理使用。
    const c2 = peek(P.L)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      c2 &&
      c2 !== ' ' &&
      c2 !== '\t' &&
      c2 !== '\n' &&
      c2 !== ';' &&
      c2 !== '&' &&
      c2 !== '|' &&
      c2 !== ')' &&
      c2 !== '}'
    ) {
      // val更新为 `parseWord(P, 'arg')`，确保Bash 解析工具后续读取最新状态。
      val = parseWord(P, 'arg')
    }
  }
  // kids 集合 命名 `val ? [lhs, opNode, val] : [lhs, opNode]`，让后续代码直接表达这个值的用途。
  const kids = val ? [lhs, opNode, val] : [lhs, opNode]
  // end 命名 `val ? val.endIndex : opEnd`，让后续代码直接表达这个值的用途。
  const end = val ? val.endIndex : opEnd
  // 返回 `mk(P, 'variable_assignment', startB, end, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'variable_assignment', startB, end, kids)
}

/**
 * Parse subscript index content. Parsed arithmetically per tree-sitter grammar:
 * `${a[1+2]}` → binary_expression; `${a[++i]}` → unary_expression(word);
 * `${a[(($n+1))]}` → compound_statement(binary_expression). Falls back to
 * simple patterns (@, *) as word.
 */
// parseSubscriptIndexInline 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSubscriptIndexInline(P: ParseState): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // @ or * alone → word (associative array all-keys)
  // 当 `(c` 匹配 `'@' || c === '*') && peek(P...` 时，共享工具执行对应分支。
  if ((c === '@' || c === '*') && peek(P.L, 1) === ']') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 返回 `mk(P, 'word', s, P.L.b, [])`，作为共享工具这次计算的结果。
    return mk(P, 'word', s, P.L.b, [])
  }
  // ((expr)) → compound_statement wrapping the inner arithmetic
  // 当 `c` 匹配 `'(' && peek(P.L, 1) === '('` 时，共享工具执行对应分支。
  if (c === '(' && peek(P.L, 1) === '(') {
    // oStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
    const oStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '((', oStart, P.L.b, [])
    // inner解析`parseArithExpr`，供共享工具后续处理使用。
    const inner = parseArithExpr(P, '))', 'var')
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `')' && peek(P.L, 1) === ')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')' && peek(P.L, 1) === ')') {
      // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const cs = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, '))', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '))', cs, P.L.b, [])
    } else {
      // close更新为 `mk(P, '))', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '))', P.L.b, P.L.b, [])
    }
    // kids 集合 命名 `inner ? [open, inner, close] : [open, close]`，让后续代码直接表达这个值的用途。
    const kids = inner ? [open, inner, close] : [open, close]
    // 返回 `mk(P, 'compound_statement', open.startIndex, close.endIndex, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'compound_statement', open.startIndex, close.endIndex, kids)
  }
  // Arithmetic — but bare identifiers in subscript use 'word' mode per
  // tree-sitter (${words[++counter]} → unary_expression(word)).
  // 返回 `parseArithExpr(P, ']', 'word')`，作为共享工具这次计算的结果。
  return parseArithExpr(P, ']', 'word')
}

/** Legacy byte-range subscript index parser — kept for callers that pre-scan. */
// parseSubscriptIndex 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSubscriptIndex(
  P: ParseState,
  startB: number,
  endB: number,
): TsNode {
  // 文本格式化`sliceBytes`，供共享工具后续处理使用。
  const text = sliceBytes(P, startB, endB)
  // 满足 `/^\d+$/.test(text)) return mk(P, 'number', startB, endB, []` 时，共享工具执行该分支。
  if (/^\d+$/.test(text)) return mk(P, 'number', startB, endB, [])
  // m保存`$`，供共享工具后续处理使用。
  const m = /^\$([a-zA-Z_]\w*)$/.exec(text)
  // 满足 `m` 时，共享工具执行该分支。
  if (m) {
    // dollar保存`mk`，供共享工具后续处理使用。
    const dollar = mk(P, '$', startB, startB + 1, [])
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'variable_name', startB + 1, endB, [])
    // 返回 `mk(P, 'simple_expansion', startB, endB, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', startB, endB, [dollar, vn])
  }
  // 只有 `text.length === 2 && text[0] === '$' && SPECIAL_VARS.has(text[1]!)` 满足时，共享工具才执行该分支。
  if (text.length === 2 && text[0] === '$' && SPECIAL_VARS.has(text[1]!)) {
    // dollar保存`mk`，供共享工具后续处理使用。
    const dollar = mk(P, '$', startB, startB + 1, [])
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'special_variable_name', startB + 1, endB, [])
    // 返回 `mk(P, 'simple_expansion', startB, endB, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', startB, endB, [dollar, vn])
  }
  // 返回 `mk(P, 'word', startB, endB, [])`，作为共享工具这次计算的结果。
  return mk(P, 'word', startB, endB, [])
}

/**
 * Can the current position start a redirect destination literal?
 * Returns false at redirect ops, terminators, or file-descriptor-prefixed ops
 * so file_redirect's repeat1($._literal) stops at the right boundary.
 */
// isRedirectLiteralStart 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRedirectLiteralStart(P: ParseState): boolean {
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // 当 `c` 匹配 `'' || c === '\n'` 时，共享工具执行对应分支。
  if (c === '' || c === '\n') return false
  // Shell terminators and operators
  // 当 `c` 匹配 `'|' || c === '&' || c === '...` 时，共享工具执行对应分支。
  if (c === '|' || c === '&' || c === ';' || c === '(' || c === ')')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  // Redirect operators (< > with any suffix; <( >( handled by caller)
  // 当 `c` 匹配 `'<' || c === '>'` 时，共享工具执行对应分支。
  if (c === '<' || c === '>') {
    // <( >( are process substitutions — those ARE literals
    // 返回 `peek(P.L, 1) === '('`，作为共享工具这次计算的结果。
    return peek(P.L, 1) === '('
  }
  // N< N> file descriptor prefix — starts a new redirect, not a literal
  // 满足 `isDigit(c)` 时，共享工具执行该分支。
  if (isDigit(c)) {
    // j保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
    let j = P.L.i
    // 只要 j < P.L.len && isDigit(P.L.src[j]!) 成立，就持续推进共享工具中的循环处理。
    while (j < P.L.len && isDigit(P.L.src[j]!)) j++
    // after保存`j < P.L.len ? P.L.src[j]! : ''`，供共享工具 bash Parser后续判断或输出使用。
    const after = j < P.L.len ? P.L.src[j]! : ''
    // 当 `after` 匹配 `'>' || after === '<'` 时，共享工具执行对应分支。
    if (after === '>' || after === '<') return false
  }
  // `}` only terminates if we're in a context where it's a closer — but
  // file_redirect sees `}` as word char (e.g., `>$HOME}` is valid path char).
  // Actually `}` at top level terminates compound_statement — need to stop.
  // 当 `c` 匹配 `'}'` 时，共享工具执行对应分支。
  if (c === '}') return false
  // Test command closer — when parseSimpleCommand is called from `[` context,
  // `]` must terminate so parseCommand can return and `[` handler consume it.
  // 当 `P.stopToken` 匹配 `']' && c === ']'` 时，共享工具执行对应分支。
  if (P.stopToken === ']' && c === ']') return false
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Parse a redirect operator + destination(s).
 * @param greedy When true, file_redirect consumes repeat1($._literal) per
 *   grammar's prec.left — `cmd >f a b c` attaches `a b c` to the redirect.
 *   When false (preRedirect context), takes only 1 destination because
 *   command's dynamic precedence beats redirected_statement's prec(-1).
 */
// tryParseRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tryParseRedirect(P: ParseState, greedy = false): TsNode | null {
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // File descriptor prefix?
  // fd 命名 `null`，让后续代码直接表达这个值的用途。
  let fd: TsNode | null = null
  // 满足 `isDigit(peek(P.L))` 时，共享工具执行该分支。
  if (isDigit(peek(P.L))) {
    // startB保存`P.L.b`，供后续判断或组装使用。
    const startB = P.L.b
    // j保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
    let j = P.L.i
    // 只要 j < P.L.len && isDigit(P.L.src[j]!) 成立，就持续推进共享工具中的循环处理。
    while (j < P.L.len && isDigit(P.L.src[j]!)) j++
    // after保存`j < P.L.len ? P.L.src[j]! : ''`，供共享工具 bash Parser后续判断或输出使用。
    const after = j < P.L.len ? P.L.src[j]! : ''
    // 当 `after` 匹配 `'>' || after === '<'` 时，共享工具执行对应分支。
    if (after === '>' || after === '<') {
      // 只要 P.L.i < j) advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < j) advance(P.L)
      // fd更新为 `mk(P, 'file_descriptor', startB, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      fd = mk(P, 'file_descriptor', startB, P.L.b, [])
    }
  }
  // t保存`nextToken`，供共享工具后续处理使用。
  const t = nextToken(P.L, 'arg')
  // `t.type` 与 `'OP'` 不一致时刷新派生状态，避免使用过期结果。
  if (t.type !== 'OP') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // v保存`t.value`，供后续判断或组装使用。
  const v = t.value
  // 当 `v` 匹配 `'<<<'` 时，共享工具执行对应分支。
  if (v === '<<<') {
    // op保存`leaf`，供共享工具后续处理使用。
    const op = leaf(P, '<<<', t)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // target解析`parseWord`，供共享工具后续处理使用。
    const target = parseWord(P, 'arg')
    // end读取`target ? target.endIndex : op.endIndex` 整理出中间结果，供共享工具 bash Parser后续步骤使用。
    const end = target ? target.endIndex : op.endIndex
    // kids 集合读取 `target ? [op, target] : [op]` 对应条目，后续围绕该成员继续处理。
    const kids = target ? [op, target] : [op]
    // 返回 `mk(`，作为共享工具这次计算的结果。
    return mk(
      P,
      'herestring_redirect',
      fd ? fd.startIndex : op.startIndex,
      end,
      fd ? [fd, ...kids] : kids,
    )
  }
  // 当 `v` 匹配 `'<<' || v === '<<-'` 时，共享工具执行对应分支。
  if (v === '<<' || v === '<<-') {
    // op保存`leaf`，供共享工具后续处理使用。
    const op = leaf(P, v, t)
    // Heredoc start — delimiter word (may be quoted)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // dStart保存`P.L.b`，供后续判断或组装使用。
    const dStart = P.L.b
    // quoted标记共享工具 bash Parser是否启用对应路径。
    let quoted = false
    // delim保存`''`，作为后续固定文本处理的输入。
    let delim = ''
    // dc保存`peek`，供共享工具后续处理使用。
    const dc = peek(P.L)
    // 当 `dc` 匹配 `"'" || dc === '"'` 时，共享工具执行对应分支。
    if (dc === "'" || dc === '"') {
      // quoted更新为 `true`，确保Bash 解析工具后续读取最新状态。
      quoted = true
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 P.L.i < P.L.len && peek(P.L) !== dc 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && peek(P.L) !== dc) {
        // 共享工具 bash Parser在这里处理 `delim += peek(P.L)`，完成这一小步状态转换。
        delim += peek(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
      // 满足 `P.L.i < P.L.len) advance(P.L` 时，共享工具执行该分支。
      if (P.L.i < P.L.len) advance(P.L)
    // 共享工具 bash Parser在这里处理 `} else if (dc === '\\') {`，完成这一小步状态转换。
    } else if (dc === '\\') {
      // Backslash-escaped delimiter: \X — exactly one escaped char, body is
      // quoted (literal). Covers <<\EOF <<\' <<\\ etc.
      // quoted更新为 `true`，确保Bash 解析工具后续读取最新状态。
      quoted = true
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // `P.L.i < P.L.len && peek(P.L)` 与 `'\n'` 不一致时刷新派生状态，避免使用过期结果。
      if (P.L.i < P.L.len && peek(P.L) !== '\n') {
        // 共享工具 bash Parser在这里处理 `delim += peek(P.L)`，完成这一小步状态转换。
        delim += peek(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
      // May be followed by more ident chars (e.g. <<\EOF → delim "EOF")
      // 只要 P.L.i < P.L.len && isIdentChar(peek(P.L)) 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && isIdentChar(peek(P.L))) {
        // 共享工具 bash Parser在这里处理 `delim += peek(P.L)`，完成这一小步状态转换。
        delim += peek(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
    } else {
      // Unquoted delimiter: bash accepts most non-metacharacters (not just
      // identifiers). Allow !, -, ., etc. — stop at shell metachars.
      // 只要 P.L.i < P.L.len && isHeredocDelimChar(peek(P.L)) 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && isHeredocDelimChar(peek(P.L))) {
        // 共享工具 bash Parser在这里处理 `delim += peek(P.L)`，完成这一小步状态转换。
        delim += peek(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
    }
    // dEnd保存`P.L.b`，供后续判断或组装使用。
    const dEnd = P.L.b
    // startNode保存`mk`，供共享工具后续处理使用。
    const startNode = mk(P, 'heredoc_start', dStart, dEnd, [])
    // Register pending heredoc — body scanned at next newline
    // heredocs 集合追加新条目，保持收集顺序与输入顺序一致。
    P.L.heredocs.push({
      delim,
      stripTabs: v === '<<-',
      quoted,
      bodyStart: 0,
      bodyEnd: 0,
      endStart: 0,
      endEnd: 0,
    })
    // kids 集合 命名 `fd ? [fd, op, startNode] : [op, startNode]`，让后续代码直接表达这个值的用途。
    const kids = fd ? [fd, op, startNode] : [op, startNode]
    // startIdx保存`fd ? fd.startIndex : op.startIndex`，供后续判断或组装使用。
    const startIdx = fd ? fd.startIndex : op.startIndex
    // SECURITY: tree-sitter nests any pipeline/list/file_redirect appearing
    // between heredoc_start and the newline as a CHILD of heredoc_redirect.
    // `ls <<'EOF' | rm -rf /tmp/evil` must not silently drop the rm. Parse
    // trailing words and file_redirects properly (ast.ts walkHeredocRedirect
    // fails closed on any unrecognized child via tooComplex). Pipeline / list
    // operators (| && || ;) are structurally complex — emit ERROR so the same
    // fail-closed path rejects them.
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // tc保存`peek`，供共享工具后续处理使用。
      const tc = peek(P.L)
      // 只有 `tc === '\n' || tc === '' || P.L.i >= P.L.len` 满足时，共享工具才执行该分支。
      if (tc === '\n' || tc === '' || P.L.i >= P.L.len) break
      // File redirect after delimiter: cat <<EOF > out.txt
      // 只有 `tc === '>' || tc === '<' || isDigit(tc)` 满足时，共享工具才执行该分支。
      if (tc === '>' || tc === '<' || isDigit(tc)) {
        // rSave保存`saveLex`，供共享工具后续处理使用。
        const rSave = saveLex(P.L)
        // r保存`tryParseRedirect`，供共享工具后续处理使用。
        const r = tryParseRedirect(P)
        // 当 `r && r.type` 匹配 `'file_redirect'` 时，共享工具执行对应分支。
        if (r && r.type === 'file_redirect') {
          // kids 集合追加新条目，保持收集顺序与输入顺序一致。
          kids.push(r)
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 调用 restoreLex，触发共享工具此处需要的副作用。
        restoreLex(P.L, rSave)
      }
      // Pipeline after heredoc_start: `one <<EOF | grep two` — tree-sitter
      // nests the pipeline as a child of heredoc_redirect. ast.ts
      // walkHeredocRedirect fails closed on pipeline/command via tooComplex.
      // 当 `tc` 匹配 `'|' && peek(P.L, 1) !== '|'` 时，共享工具执行对应分支。
      if (tc === '|' && peek(P.L, 1) !== '|') {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 skipBlanks，触发共享工具此处需要的副作用。
        skipBlanks(P.L)
        // pipeCmds 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const pipeCmds: TsNode[] = []
        // while 使用 true 完成共享工具里的对应操作。
        while (true) {
          // cmd 命令数据解析`parseCommand`，供共享工具后续处理使用。
          const cmd = parseCommand(P)
          // cmd 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!cmd) break
          // pipeCmds 命令数据追加新条目，保持收集顺序与输入顺序一致。
          pipeCmds.push(cmd)
          // 调用 skipBlanks，触发共享工具此处需要的副作用。
          skipBlanks(P.L)
          // 当 `peek(P.L)` 匹配 `'|' && peek(P.L, 1) !== '|'` 时，共享工具执行对应分支。
          if (peek(P.L) === '|' && peek(P.L, 1) !== '|') {
            // ps 集合保存`P.L.b`，供后续判断或组装使用。
            const ps = P.L.b
            // 调用 advance，触发共享工具此处需要的副作用。
            advance(P.L)
            // pipeCmds 命令数据追加新条目，保持收集顺序与输入顺序一致。
            pipeCmds.push(mk(P, '|', ps, P.L.b, []))
            // 调用 skipBlanks，触发共享工具此处需要的副作用。
            skipBlanks(P.L)
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 满足 `pipeCmds.length > 0` 时，共享工具执行该分支。
        if (pipeCmds.length > 0) {
          // pl记录 `pipeCmds[pipeCmds.length - 1]!` 是否成立，下一步按该结果分支。
          const pl = pipeCmds[pipeCmds.length - 1]!
          // tree-sitter always wraps in pipeline after `|`, even single command
          // kids 集合追加新条目，保持收集顺序与输入顺序一致。
          kids.push(
            mk(P, 'pipeline', pipeCmds[0]!.startIndex, pl.endIndex, pipeCmds),
          )
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // && / || after heredoc_start: `cat <<-EOF || die "..."` — tree-sitter
      // nests just the RHS command (not a list) as a child of heredoc_redirect.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        (tc === '&' && peek(P.L, 1) === '&') ||
        (tc === '|' && peek(P.L, 1) === '|')
      ) {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 skipBlanks，触发共享工具此处需要的副作用。
        skipBlanks(P.L)
        // rhs 集合解析`parseCommand`，供共享工具后续处理使用。
        const rhs = parseCommand(P)
        // 满足 `rhs) kids.push(rhs` 时，共享工具执行该分支。
        if (rhs) kids.push(rhs)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Terminator / unhandled metachar — consume rest of line as ERROR so
      // ast.ts rejects it. Covers ; & ( )
      // 当 `tc` 匹配 `'&' || tc === ';' || tc ===...` 时，共享工具执行对应分支。
      if (tc === '&' || tc === ';' || tc === '(' || tc === ')') {
        // eStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
        const eStart = P.L.b
        // 只要 P.L.i < P.L.len && peek(P.L) !== '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
        while (P.L.i < P.L.len && peek(P.L) !== '\n') advance(P.L)
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(mk(P, 'ERROR', eStart, P.L.b, []))
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // Trailing word argument: newins <<-EOF - org.freedesktop.service
      // w解析`parseWord`，供共享工具后续处理使用。
      const w = parseWord(P, 'arg')
      // 满足 `w` 时，共享工具执行该分支。
      if (w) {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(w)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Unrecognized — consume rest of line as ERROR
      // eStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const eStart = P.L.b
      // 只要 P.L.i < P.L.len && peek(P.L) !== '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && peek(P.L) !== '\n') advance(P.L)
      // 满足 `P.L.b > eStart) kids.push(mk(P, 'ERROR', eStart, P.L.b, [])` 时，共享工具执行该分支。
      if (P.L.b > eStart) kids.push(mk(P, 'ERROR', eStart, P.L.b, []))
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 返回 `mk(P, 'heredoc_redirect', startIdx, P.L.b, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'heredoc_redirect', startIdx, P.L.b, kids)
  }
  // Close-fd variants: `<&-` `>&-` have OPTIONAL destination (0 or 1)
  // 当 `v` 匹配 `'<&-' || v === '>&-'` 时，共享工具执行对应分支。
  if (v === '<&-' || v === '>&-') {
    // op保存`leaf`，供共享工具后续处理使用。
    const op = leaf(P, v, t)
    // kids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const kids: TsNode[] = []
    // 满足 `fd) kids.push(fd` 时，共享工具执行该分支。
    if (fd) kids.push(fd)
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(op)
    // Optional single destination — only consume if next is a literal
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // dSave保存`saveLex`，供共享工具后续处理使用。
    const dSave = saveLex(P.L)
    // dest保存`isRedirectLiteralStart`，供共享工具后续处理使用。
    const dest = isRedirectLiteralStart(P) ? parseWord(P, 'arg') : null
    // 满足 `dest` 时，共享工具执行该分支。
    if (dest) {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(dest)
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, dSave)
    }
    // startIdx保存`fd ? fd.startIndex : op.startIndex`，供后续判断或组装使用。
    const startIdx = fd ? fd.startIndex : op.startIndex
    // end保存`dest ? dest.endIndex : op.endIndex`，供后续判断或组装使用。
    const end = dest ? dest.endIndex : op.endIndex
    // 返回 `mk(P, 'file_redirect', startIdx, end, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'file_redirect', startIdx, end, kids)
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    v === '>' ||
    v === '>>' ||
    v === '>&' ||
    v === '>|' ||
    v === '&>' ||
    v === '&>>' ||
    v === '<' ||
    v === '<&'
  ) {
    // op保存`leaf`，供共享工具后续处理使用。
    const op = leaf(P, v, t)
    // kids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const kids: TsNode[] = []
    // 满足 `fd) kids.push(fd` 时，共享工具执行该分支。
    if (fd) kids.push(fd)
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(op)
    // Grammar: destination is repeat1($._literal) — greedily consume literals
    // until a non-literal (redirect op, terminator, etc). tree-sitter's
    // prec.left makes `cmd >f a b c` attach `a b c` to the file_redirect,
    // NOT to the command. Structural quirk but required for corpus parity.
    // In preRedirect context (greedy=false), take only 1 literal because
    // command's dynamic precedence beats redirected_statement's prec(-1).
    // end保存`op.endIndex`，供后续判断或组装使用。
    let end = op.endIndex
    // taken 命名 `0`，让后续代码直接表达这个值的用途。
    let taken = 0
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 满足 `!isRedirectLiteralStart(P)` 时，共享工具执行该分支。
      if (!isRedirectLiteralStart(P)) break
      // 只有 `!greedy && taken >= 1` 满足时，共享工具才执行该分支。
      if (!greedy && taken >= 1) break
      // tc保存`peek`，供共享工具后续处理使用。
      const tc = peek(P.L)
      // tc1保存`peek`，供共享工具后续处理使用。
      const tc1 = peek(P.L, 1)
      // target初始化为空值，后续分支会在有数据时补齐。
      let target: TsNode | null = null
      // 当 `(tc` 匹配 `'<' || tc === '>') && tc1 =...` 时，共享工具执行对应分支。
      if ((tc === '<' || tc === '>') && tc1 === '(') {
        // target更新为 `parseProcessSub(P)`，确保Bash 解析工具后续读取最新状态。
        target = parseProcessSub(P)
      } else {
        // target更新为 `parseWord(P, 'arg')`，确保Bash 解析工具后续读取最新状态。
        target = parseWord(P, 'arg')
      }
      // target缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!target) break
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(target)
      // end更新为 `target.endIndex`，确保Bash 解析工具后续读取最新状态。
      end = target.endIndex
      // 共享工具 bash Parser在这里处理 `taken++`，完成这一小步状态转换。
      taken++
    }
    // startIdx保存`fd ? fd.startIndex : op.startIndex`，供后续判断或组装使用。
    const startIdx = fd ? fd.startIndex : op.startIndex
    // 返回 `mk(P, 'file_redirect', startIdx, end, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'file_redirect', startIdx, end, kids)
  }
  // 调用 restoreLex，触发共享工具此处需要的副作用。
  restoreLex(P.L, save)
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// parseProcessSub 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseProcessSub(P: ParseState): TsNode | null {
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // `(c` 与 `'<' && c !== '>') || peek(P.L, ...` 不一致时刷新派生状态，避免使用过期结果。
  if ((c !== '<' && c !== '>') || peek(P.L, 1) !== '(') return null
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // open保存`mk`，供共享工具后续处理使用。
  const open = mk(P, c + '(', start, P.L.b, [])
  // 请求体解析`parseStatements`，供共享工具后续处理使用。
  const body = parseStatements(P, ')')
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // close 先占位，稍后的条件分支会根据实际输入补齐它。
  let close: TsNode
  // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
  if (peek(P.L) === ')') {
    // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const cs = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // close更新为 `mk(P, ')', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, ')', cs, P.L.b, [])
  } else {
    // close更新为 `mk(P, ')', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, ')', P.L.b, P.L.b, [])
  }
  // 返回 `mk(P, 'process_substitution', start, close.endIndex, [`，作为共享工具这次计算的结果。
  return mk(P, 'process_substitution', start, close.endIndex, [
    open,
    ...body,
    close,
  ])
}

// scanHeredocBodies 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scanHeredocBodies(P: ParseState): void {
  // Skip to newline if not already there
  // 只要 P.L.i < P.L.len && P.L.src[P.L.i] !== '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (P.L.i < P.L.len && P.L.src[P.L.i] !== '\n') advance(P.L)
  // 满足 `P.L.i < P.L.len) advance(P.L` 时，共享工具执行该分支。
  if (P.L.i < P.L.len) advance(P.L)
  // 按顺序遍历 `P.L.heredocs` 中的hd，逐个交给共享工具处理。
  for (const hd of P.L.heredocs) {
    // bodyStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
    hd.bodyStart = P.L.b
    // delimLen保存 `hd.delim.length` 的判断结果，供共享工具 bash Parser后续分支直接复用。
    const delimLen = hd.delim.length
    // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
    while (P.L.i < P.L.len) {
      // lineStart保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
      const lineStart = P.L.i
      // lineStartB保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const lineStartB = P.L.b
      // Skip leading tabs if <<-
      // checkI 命名 `lineStart`，让后续代码直接表达这个值的用途。
      let checkI = lineStart
      // 满足 `hd.stripTabs` 时，共享工具执行该分支。
      if (hd.stripTabs) {
        // 只要 checkI < P.L.len && P.L.src[checkI] === '\t' 成立，就持续推进共享工具中的循环处理。
        while (checkI < P.L.len && P.L.src[checkI] === '\t') checkI++
      }
      // Check if this line is the delimiter
      // 共享工具在这里按实际状态进入对应分支。
      if (
        P.L.src.startsWith(hd.delim, checkI) &&
        (checkI + delimLen >= P.L.len ||
          P.L.src[checkI + delimLen] === '\n' ||
          P.L.src[checkI + delimLen] === '\r')
      ) {
        // bodyEnd更新为 `lineStartB`，确保Bash 解析工具后续读取最新状态。
        hd.bodyEnd = lineStartB
        // Advance past tabs
        // 只要 P.L.i < checkI) advance(P.L 成立，就持续推进共享工具中的循环处理。
        while (P.L.i < checkI) advance(P.L)
        // endStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        hd.endStart = P.L.b
        // Advance past delimiter
        // 按索引扫描 `delimLen`，需要消费相邻参数时可以精确移动游标。
        for (let k = 0; k < delimLen; k++) advance(P.L)
        // endEnd更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        hd.endEnd = P.L.b
        // Skip trailing newline
        // 只有 `P.L.i < P.L.len && P.L.src[P.L.i] === '\n') advance(P.L` 满足时，共享工具才执行该分支。
        if (P.L.i < P.L.len && P.L.src[P.L.i] === '\n') advance(P.L)
        // 共享工具 bash Parser在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // Consume line
      // 只要 P.L.i < P.L.len && P.L.src[P.L.i] !== '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && P.L.src[P.L.i] !== '\n') advance(P.L)
      // 满足 `P.L.i < P.L.len) advance(P.L` 时，共享工具执行该分支。
      if (P.L.i < P.L.len) advance(P.L)
    }
    // Unterminated
    // bodyEnd更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
    hd.bodyEnd = P.L.b
    // endStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
    hd.endStart = P.L.b
    // endEnd更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
    hd.endEnd = P.L.b
  }
}

// parseHeredocBodyContent 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseHeredocBodyContent(
  P: ParseState,
  start: number,
  end: number,
): TsNode[] {
  // Parse expansions inside an unquoted heredoc body.
  // saved保存`saveLex`，供共享工具后续处理使用。
  const saved = saveLex(P.L)
  // Position lexer at body start
  // 调用 restoreLexToByte，触发共享工具此处需要的副作用。
  restoreLexToByte(P, start)
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: TsNode[] = []
  // contentStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  let contentStart = P.L.b
  // tree-sitter-bash's heredoc_body rule hides the initial text segment
  // (_heredoc_body_beginning) — only content AFTER the first expansion is
  // emitted as heredoc_content. Track whether we've seen an expansion yet.
  // sawExpansion标记共享工具 bash Parser是否启用对应路径。
  let sawExpansion = false
  // while 使用 P.L.b < end 完成共享工具里的对应操作。
  while (P.L.b < end) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // Backslash escapes suppress expansion: \$ \` stay literal in heredoc.
    // 当 `c` 匹配 `'\\'` 时，共享工具执行对应分支。
    if (c === '\\') {
      // nxt保存`peek`，供共享工具后续处理使用。
      const nxt = peek(P.L, 1)
      // 当 `nxt` 匹配 `' || nxt === '`' || nxt ===...` 时，共享工具执行对应分支。
      if (nxt === '$' || nxt === '`' || nxt === '\\') {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `' || c === '`'` 时，共享工具执行对应分支。
    if (c === '$' || c === '`') {
      // preB保存`P.L.b`，供后续判断或组装使用。
      const preB = P.L.b
      // exp解析`parseDollarLike`，供共享工具后续处理使用。
      const exp = parseDollarLike(P)
      // Bare `$` followed by non-name (e.g. `$'` in a regex) returns a lone
      // '$' leaf, not an expansion — treat as literal content, don't split.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        exp &&
        (exp.type === 'simple_expansion' ||
          exp.type === 'expansion' ||
          exp.type === 'command_substitution' ||
          exp.type === 'arithmetic_expansion')
      ) {
        // 只有 `sawExpansion && preB > contentStart` 满足时，共享工具才执行该分支。
        if (sawExpansion && preB > contentStart) {
          // out追加新条目，保持收集顺序与输入顺序一致。
          out.push(mk(P, 'heredoc_content', contentStart, preB, []))
        }
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(exp)
        // contentStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        contentStart = P.L.b
        // sawExpansion更新为 `true`，确保Bash 解析工具后续读取最新状态。
        sawExpansion = true
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // Only emit heredoc_content children if there were expansions — otherwise
  // the heredoc_body is a leaf node (tree-sitter convention).
  // 满足 `sawExpansion` 时，共享工具执行该分支。
  if (sawExpansion) {
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, 'heredoc_content', contentStart, end, []))
  }
  // 调用 restoreLex，触发共享工具此处需要的副作用。
  restoreLex(P.L, saved)
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

// restoreLexToByte 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function restoreLexToByte(P: ParseState, targetByte: number): void {
  // 满足 `!P.L.byteTable) byteAt(P.L, 0` 时，共享工具执行该分支。
  if (!P.L.byteTable) byteAt(P.L, 0)
  // t 命名 `P.L.byteTable!`，让后续代码直接表达这个值的用途。
  const t = P.L.byteTable!
  // lo保存`0`，供后续判断或组装使用。
  let lo = 0
  // hi 命名 `P.src.length`，让后续代码直接表达这个值的用途。
  let hi = P.src.length
  // while 使用 lo < hi 完成共享工具里的对应操作。
  while (lo < hi) {
    // m保存`(lo + hi) >>> 1`，供共享工具 bash Parser后续判断或输出使用。
    const m = (lo + hi) >>> 1
    // 满足 `t[m]! < targetByte` 时，共享工具执行该分支。
    if (t[m]! < targetByte) lo = m + 1
    else hi = m
  }
  // i更新为 `lo`，确保Bash 解析工具后续读取最新状态。
  P.L.i = lo
  // b更新为 `targetByte`，确保Bash 解析工具后续读取最新状态。
  P.L.b = targetByte
}

/**
 * Parse a word-position element: bare word, string, expansion, or concatenation
 * thereof. Returns a single node; if multiple adjacent fragments, wraps in
 * concatenation.
 */
// parseWord 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseWord(P: ParseState, _ctx: 'cmd' | 'arg'): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: TsNode[] = []
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      c === ' ' ||
      c === '\t' ||
      c === '\n' ||
      c === '\r' ||
      c === '' ||
      c === '|' ||
      c === '&' ||
      c === ';' ||
      c === '(' ||
      c === ')'
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // < > are redirect operators unless <( >( (process substitution)
    // 当 `c` 匹配 `'<' || c === '>'` 时，共享工具执行对应分支。
    if (c === '<' || c === '>') {
      // 当 `peek(P.L, 1)` 匹配 `'('` 时，共享工具执行对应分支。
      if (peek(P.L, 1) === '(') {
        // ps 集合解析`parseProcessSub`，供共享工具后续处理使用。
        const ps = parseProcessSub(P)
        // 满足 `ps) parts.push(ps` 时，共享工具执行该分支。
        if (ps) parts.push(ps)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(parseDoubleQuoted(P))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c === "'") {
      // tok保存`nextToken`，供共享工具后续处理使用。
      const tok = nextToken(P.L, 'arg')
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(leaf(P, 'raw_string', tok))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `c === '` 时，共享工具执行该分支。
    if (c === '$') {
      // c1保存`peek`，供共享工具后续处理使用。
      const c1 = peek(P.L, 1)
      // 当 `c1` 匹配 `"'"` 时，共享工具执行对应分支。
      if (c1 === "'") {
        // tok保存`nextToken`，供共享工具后续处理使用。
        const tok = nextToken(P.L, 'arg')
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(leaf(P, 'ansi_c_string', tok))
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c1` 匹配 `'"'` 时，共享工具执行对应分支。
      if (c1 === '"') {
        // Translated string: emit $ leaf + string node
        // dTok 集中保存共享工具 bash Parser要一起传递的字段。
        const dTok: Token = {
          type: 'DOLLAR',
          value: '$',
          start: P.L.b,
          end: P.L.b + 1,
        }
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(leaf(P, '$', dTok))
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(parseDoubleQuoted(P))
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c1` 匹配 `'`'` 时，共享工具执行对应分支。
      if (c1 === '`') {
        // `$` followed by backtick — tree-sitter elides the $ entirely
        // and emits just (command_substitution). Consume $ and let next
        // iteration handle the backtick.
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // exp解析`parseDollarLike`，供共享工具后续处理使用。
      const exp = parseDollarLike(P)
      // 满足 `exp) parts.push(exp` 时，共享工具执行该分支。
      if (exp) parts.push(exp)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'`'` 时，共享工具执行对应分支。
    if (c === '`') {
      // 满足 `P.inBacktick > 0` 时，共享工具执行该分支。
      if (P.inBacktick > 0) break
      // bt解析`parseBacktick`，供共享工具后续处理使用。
      const bt = parseBacktick(P)
      // 满足 `bt) parts.push(bt` 时，共享工具执行该分支。
      if (bt) parts.push(bt)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Brace expression {1..5} or {a,b,c} — only if looks like one
    // 当 `c` 匹配 `'{'` 时，共享工具执行对应分支。
    if (c === '{') {
      // be保存`tryParseBraceExpr`，供共享工具后续处理使用。
      const be = tryParseBraceExpr(P)
      // 满足 `be` 时，共享工具执行该分支。
      if (be) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(be)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // SECURITY: if `{` is immediately followed by a command terminator
      // (; | & newline or EOF), it's a standalone word — don't slurp the
      // rest of the line via tryParseBraceLikeCat. `echo {;touch /tmp/evil`
      // must split on `;` so the security walker sees `touch`.
      // nc保存`peek`，供共享工具后续处理使用。
      const nc = peek(P.L, 1)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        nc === ';' ||
        nc === '|' ||
        nc === '&' ||
        nc === '\n' ||
        nc === '' ||
        nc === ')' ||
        nc === ' ' ||
        nc === '\t'
      ) {
        // bStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
        const bStart = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(mk(P, 'word', bStart, P.L.b, []))
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Otherwise treat { and } as word fragments
      // cat保存`tryParseBraceLikeCat`，供共享工具后续处理使用。
      const cat = tryParseBraceLikeCat(P)
      // 满足 `cat` 时，共享工具执行该分支。
      if (cat) {
        // 逐项读取 `cat) parts.push(p` 中的p，按输入顺序推进共享工具。
        for (const p of cat) parts.push(p)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // Standalone `}` in arg position is a word (e.g., `echo }foo`).
    // parseBareWord breaks on `}` so handle it here.
    // 当 `c` 匹配 `'}'` 时，共享工具执行对应分支。
    if (c === '}') {
      // bStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const bStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, 'word', bStart, P.L.b, []))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // `[` and `]` are single-char word fragments (tree-sitter splits at
    // brackets: `[:lower:]` → `[` `:lower:` `]`, `{o[k]}` → 6 words).
    // 当 `c` 匹配 `'[' || c === ']'` 时，共享工具执行对应分支。
    if (c === '[' || c === ']') {
      // bStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const bStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, 'word', bStart, P.L.b, []))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Bare word fragment
    // frag解析`parseBareWord`，供共享工具后续处理使用。
    const frag = parseBareWord(P)
    // frag缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!frag) break
    // `NN#${...}` or `NN#$(...)` → (number (expansion|command_substitution)).
    // Grammar: number can be seq(/-?(0x)?[0-9]+#/, choice(expansion, cmd_sub)).
    // `10#${cmd}` must NOT be concatenation — it's a single number node with
    // the expansion as child. Detect here: frag ends with `#`, next is $ {/(.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      frag.type === 'word' &&
      /^-?(0x)?[0-9]+#$/.test(frag.text) &&
      peek(P.L) === '$' &&
      (peek(P.L, 1) === '{' || peek(P.L, 1) === '(')
    ) {
      // exp解析`parseDollarLike`，供共享工具后续处理使用。
      const exp = parseDollarLike(P)
      // 满足 `exp` 时，共享工具执行该分支。
      if (exp) {
        // Prefix `NN#` is an anonymous pattern in grammar — only the
        // expansion/cmd_sub is a named child.
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(mk(P, 'number', frag.startIndex, exp.endIndex, [exp]))
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(frag)
  }
  // 片段列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (parts.length === 0) return null
  // 满足 `parts.length === 1` 时，共享工具执行该分支。
  if (parts.length === 1) return parts[0]!
  // Concatenation
  // first 命名 `parts[0]!`，让后续代码直接表达这个值的用途。
  const first = parts[0]!
  // last 命名 `parts[parts.length - 1]!`，让后续代码直接表达这个值的用途。
  const last = parts[parts.length - 1]!
  // 返回 `mk(P, 'concatenation', first.startIndex, last.endIndex, parts)`，作为共享工具这次计算的结果。
  return mk(P, 'concatenation', first.startIndex, last.endIndex, parts)
}

// parseBareWord 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseBareWord(P: ParseState): TsNode | null {
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // startI 命名 `P.L.i`，让后续代码直接表达这个值的用途。
  const startI = P.L.i
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 当 `c` 匹配 `'\\'` 时，共享工具执行对应分支。
    if (c === '\\') {
      // 满足 `P.L.i + 1 >= P.L.len` 时，共享工具执行该分支。
      if (P.L.i + 1 >= P.L.len) {
        // Trailing unpaired `\` at true EOF — tree-sitter emits word WITHOUT
        // the `\` plus a sibling ERROR node. Stop here; caller emits ERROR.
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // nx保存`P.L.src[P.L.i + 1]`，供共享工具 bash Parser后续判断或输出使用。
      const nx = P.L.src[P.L.i + 1]
      // 只有 `nx === '\n' || (nx === '\r' && P.L.src[P.L.i + 2] === '\n')` 满足时，共享工具才执行该分支。
      if (nx === '\n' || (nx === '\r' && P.L.src[P.L.i + 2] === '\n')) {
        // Line continuation BREAKS the word (tree-sitter quirk) — handles \r?\n
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      c === ' ' ||
      c === '\t' ||
      c === '\n' ||
      c === '\r' ||
      c === '' ||
      c === '|' ||
      c === '&' ||
      c === ';' ||
      c === '(' ||
      c === ')' ||
      c === '<' ||
      c === '>' ||
      c === '"' ||
      c === "'" ||
      c === '$' ||
      c === '`' ||
      c === '{' ||
      c === '}' ||
      c === '[' ||
      c === ']'
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 满足 `P.L.b === start` 时，共享工具执行该分支。
  if (P.L.b === start) return null
  // 文本格式化`src.slice`，供共享工具后续处理使用。
  const text = P.src.slice(startI, P.L.i)
  // type保存`test`，供共享工具后续处理使用。
  const type = /^-?\d+$/.test(text) ? 'number' : 'word'
  // 返回 `mk(P, type, start, P.L.b, [])`，作为共享工具这次计算的结果。
  return mk(P, type, start, P.L.b, [])
}

// tryParseBraceExpr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tryParseBraceExpr(P: ParseState): TsNode | null {
  // {N..M} where N, M are numbers or single chars
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // `peek(P.L)` 与 `'{'` 不一致时刷新派生状态，避免使用过期结果。
  if (peek(P.L) !== '{') return null
  // oStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const oStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // oEnd 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const oEnd = P.L.b
  // First part
  // p1Start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const p1Start = P.L.b
  // 只要 isDigit(peek(P.L)) || isIdentStart(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (isDigit(peek(P.L)) || isIdentStart(peek(P.L))) advance(P.L)
  // p1End保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const p1End = P.L.b
  // `p1End === p1Start || peek(P.L)` 与 `'.' || peek(P.L, 1) !== '.'` 不一致时刷新派生状态，避免使用过期结果。
  if (p1End === p1Start || peek(P.L) !== '.' || peek(P.L, 1) !== '.') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // dotStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const dotStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // dotEnd保存`P.L.b`，供后续判断或组装使用。
  const dotEnd = P.L.b
  // p2Start 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const p2Start = P.L.b
  // 只要 isDigit(peek(P.L)) || isIdentStart(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (isDigit(peek(P.L)) || isIdentStart(peek(P.L))) advance(P.L)
  // p2End保存`P.L.b`，供后续判断或组装使用。
  const p2End = P.L.b
  // `p2End === p2Start || peek(P.L)` 与 `'}'` 不一致时刷新派生状态，避免使用过期结果。
  if (p2End === p2Start || peek(P.L) !== '}') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // cStart保存`P.L.b`，供后续判断或组装使用。
  const cStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // cEnd保存`P.L.b`，供后续判断或组装使用。
  const cEnd = P.L.b
  // p1Text格式化`sliceBytes`，供共享工具后续处理使用。
  const p1Text = sliceBytes(P, p1Start, p1End)
  // p2Text格式化`sliceBytes`，供共享工具后续处理使用。
  const p2Text = sliceBytes(P, p2Start, p2End)
  // p1IsNum保存`test`，供共享工具后续处理使用。
  const p1IsNum = /^\d+$/.test(p1Text)
  // p2IsNum保存`test`，供共享工具后续处理使用。
  const p2IsNum = /^\d+$/.test(p2Text)
  // Valid brace expression: both numbers OR both single chars. Mixed = reject.
  // `p1IsNum` 与 `p2IsNum` 不一致时刷新派生状态，避免使用过期结果。
  if (p1IsNum !== p2IsNum) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // `!p1IsNum && (p1Text.length` 与 `1 || p2Text.length !== 1)` 不一致时刷新派生状态，避免使用过期结果。
  if (!p1IsNum && (p1Text.length !== 1 || p2Text.length !== 1)) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // p1Type保存`p1IsNum ? 'number' : 'word'`，供共享工具 bash Parser后续判断或输出使用。
  const p1Type = p1IsNum ? 'number' : 'word'
  // p2Type保存`p2IsNum ? 'number' : 'word'`，供后续判断或组装使用。
  const p2Type = p2IsNum ? 'number' : 'word'
  // 返回 `mk(P, 'brace_expression', oStart, cEnd, [`，作为共享工具这次计算的结果。
  return mk(P, 'brace_expression', oStart, cEnd, [
    mk(P, '{', oStart, oEnd, []),
    mk(P, p1Type, p1Start, p1End, []),
    mk(P, '..', dotStart, dotEnd, []),
    mk(P, p2Type, p2Start, p2End, []),
    mk(P, '}', cStart, cEnd, []),
  ])
}

// tryParseBraceLikeCat 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tryParseBraceLikeCat(P: ParseState): TsNode[] | null {
  // {a,b,c} or {} → split into word fragments like tree-sitter does
  // `peek(P.L)` 与 `'{'` 不一致时刷新派生状态，避免使用过期结果。
  if (peek(P.L) !== '{') return null
  // oStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const oStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // oEnd 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const oEnd = P.L.b
  // inner 聚合成有序列表，保持后续遍历顺序稳定。
  const inner: TsNode[] = [mk(P, 'word', oStart, oEnd, [])]
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // bc保存`peek`，供共享工具后续处理使用。
    const bc = peek(P.L)
    // SECURITY: stop at command terminators so `{foo;rm x` splits correctly.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      bc === '}' ||
      bc === '\n' ||
      bc === ';' ||
      bc === '|' ||
      bc === '&' ||
      bc === ' ' ||
      bc === '\t' ||
      bc === '<' ||
      bc === '>' ||
      bc === '(' ||
      bc === ')'
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // `[` and `]` are single-char words: {o[k]} → { o [ k ] }
    // 当 `bc` 匹配 `'[' || bc === ']'` 时，共享工具执行对应分支。
    if (bc === '[' || bc === ']') {
      // bStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const bStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // inner追加新条目，保持收集顺序与输入顺序一致。
      inner.push(mk(P, 'word', bStart, P.L.b, []))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // midStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
    const midStart = P.L.b
    // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
    while (P.L.i < P.L.len) {
      // mc保存`peek`，供共享工具后续处理使用。
      const mc = peek(P.L)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        mc === '}' ||
        mc === '\n' ||
        mc === ';' ||
        mc === '|' ||
        mc === '&' ||
        mc === ' ' ||
        mc === '\t' ||
        mc === '<' ||
        mc === '>' ||
        mc === '(' ||
        mc === ')' ||
        mc === '[' ||
        mc === ']'
      ) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
    }
    // midEnd保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const midEnd = P.L.b
    // 满足 `midEnd > midStart` 时，共享工具执行该分支。
    if (midEnd > midStart) {
      // midText格式化`sliceBytes`，供共享工具后续处理使用。
      const midText = sliceBytes(P, midStart, midEnd)
      // midType保存`test`，供共享工具后续处理使用。
      const midType = /^-?\d+$/.test(midText) ? 'number' : 'word'
      // inner追加新条目，保持收集顺序与输入顺序一致。
      inner.push(mk(P, midType, midStart, midEnd, []))
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 当 `peek(P.L)` 匹配 `'}'` 时，共享工具执行对应分支。
  if (peek(P.L) === '}') {
    // cStart保存`P.L.b`，供后续判断或组装使用。
    const cStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // inner追加新条目，保持收集顺序与输入顺序一致。
    inner.push(mk(P, 'word', cStart, P.L.b, []))
  }
  // 返回 `inner`，作为共享工具这次计算的结果。
  return inner
}

// parseDoubleQuoted 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseDoubleQuoted(P: ParseState): TsNode {
  // qStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  const qStart = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // qEnd保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const qEnd = P.L.b
  // openQ保存`mk`，供共享工具后续处理使用。
  const openQ = mk(P, '"', qStart, qEnd, [])
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts: TsNode[] = [openQ]
  // contentStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  let contentStart = P.L.b
  // contentStartI保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
  let contentStartI = P.L.i
  // flushContent封装成回调，供共享工具 bash Parser在事件触发或异步步骤中调用。
  const flushContent = (): void => {
    // 满足 `P.L.b > contentStart` 时，共享工具执行该分支。
    if (P.L.b > contentStart) {
      // Tree-sitter's extras rule /\s/ has higher precedence than
      // string_content (prec -1), so whitespace-only segments are elided.
      // `" ${x} "` → (string (expansion)) not (string (string_content)(expansion)(string_content)).
      // Note: this intentionally diverges from preserving all content — cc
      // tests relying on whitespace-only string_content need updating
      // (CCReconcile).
      // txt格式化`src.slice`，供共享工具后续处理使用。
      const txt = P.src.slice(contentStartI, P.L.i)
      // 满足 `!/^[ \t]+$/.test(txt)` 时，共享工具执行该分支。
      if (!/^[ \t]+$/.test(txt)) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(mk(P, 'string_content', contentStart, P.L.b, []))
      }
    }
  }
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') break
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (c === '\n') {
      // Split string_content at newline
      // 调用 flushContent，触发共享工具此处需要的副作用。
      flushContent()
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // contentStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      contentStart = P.L.b
      // contentStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      contentStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `c === '` 时，共享工具执行该分支。
    if (c === '$') {
      // c1保存`peek`，供共享工具后续处理使用。
      const c1 = peek(P.L, 1)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        c1 === '(' ||
        c1 === '{' ||
        isIdentStart(c1) ||
        SPECIAL_VARS.has(c1) ||
        isDigit(c1)
      ) {
        // 调用 flushContent，触发共享工具此处需要的副作用。
        flushContent()
        // exp解析`parseDollarLike`，供共享工具后续处理使用。
        const exp = parseDollarLike(P)
        // 满足 `exp) parts.push(exp` 时，共享工具执行该分支。
        if (exp) parts.push(exp)
        // contentStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        contentStart = P.L.b
        // contentStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
        contentStartI = P.L.i
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Bare $ not at end-of-string: tree-sitter emits it as an anonymous
      // '$' token, which splits string_content. $ immediately before the
      // closing " is absorbed into the preceding string_content.
      // `c1` 与 `'"' && c1 !== ''` 不一致时刷新派生状态，避免使用过期结果。
      if (c1 !== '"' && c1 !== '') {
        // 调用 flushContent，触发共享工具此处需要的副作用。
        flushContent()
        // dS 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
        const dS = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(mk(P, '$', dS, P.L.b, []))
        // contentStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        contentStart = P.L.b
        // contentStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
        contentStartI = P.L.i
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 当 `c` 匹配 `'`'` 时，共享工具执行对应分支。
    if (c === '`') {
      // 调用 flushContent，触发共享工具此处需要的副作用。
      flushContent()
      // bt解析`parseBacktick`，供共享工具后续处理使用。
      const bt = parseBacktick(P)
      // 满足 `bt) parts.push(bt` 时，共享工具执行该分支。
      if (bt) parts.push(bt)
      // contentStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      contentStart = P.L.b
      // contentStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      contentStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 调用 flushContent，触发共享工具此处需要的副作用。
  flushContent()
  // close 先占位，稍后的条件分支会根据实际输入补齐它。
  let close: TsNode
  // 当 `peek(P.L)` 匹配 `'"'` 时，共享工具执行对应分支。
  if (peek(P.L) === '"') {
    // cStart保存`P.L.b`，供后续判断或组装使用。
    const cStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // close更新为 `mk(P, '"', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, '"', cStart, P.L.b, [])
  } else {
    // close更新为 `mk(P, '"', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, '"', P.L.b, P.L.b, [])
  }
  // 片段列表追加新条目，保持收集顺序与输入顺序一致。
  parts.push(close)
  // 返回 `mk(P, 'string', qStart, close.endIndex, parts)`，作为共享工具这次计算的结果。
  return mk(P, 'string', qStart, close.endIndex, parts)
}

// parseDollarLike 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseDollarLike(P: ParseState): TsNode | null {
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // dStart保存`P.L.b`，供后续判断或组装使用。
  const dStart = P.L.b
  // 当 `c1` 匹配 `'(' && peek(P.L, 2) === '('` 时，共享工具执行对应分支。
  if (c1 === '(' && peek(P.L, 2) === '(') {
    // $(( arithmetic ))
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '$((', dStart, P.L.b, [])
    // exprs 集合解析`parseArithCommaList`，供共享工具后续处理使用。
    const exprs = parseArithCommaList(P, '))', 'var')
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `')' && peek(P.L, 1) === ')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')' && peek(P.L, 1) === ')') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, '))', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '))', cStart, P.L.b, [])
    } else {
      // close更新为 `mk(P, '))', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '))', P.L.b, P.L.b, [])
    }
    // 返回 `mk(P, 'arithmetic_expansion', dStart, close.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'arithmetic_expansion', dStart, close.endIndex, [
      open,
      ...exprs,
      close,
    ])
  }
  // 当 `c1` 匹配 `'['` 时，共享工具执行对应分支。
  if (c1 === '[') {
    // $[ arithmetic ] — legacy bash syntax, same as $((...))
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '$[', dStart, P.L.b, [])
    // exprs 集合解析`parseArithCommaList`，供共享工具后续处理使用。
    const exprs = parseArithCommaList(P, ']', 'var')
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `']'` 时，共享工具执行对应分支。
    if (peek(P.L) === ']') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, ']', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ']', cStart, P.L.b, [])
    } else {
      // close更新为 `mk(P, ']', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ']', P.L.b, P.L.b, [])
    }
    // 返回 `mk(P, 'arithmetic_expansion', dStart, close.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'arithmetic_expansion', dStart, close.endIndex, [
      open,
      ...exprs,
      close,
    ])
  }
  // 当 `c1` 匹配 `'('` 时，共享工具执行对应分支。
  if (c1 === '(') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '$(', dStart, P.L.b, [])
    // 请求体解析`parseStatements`，供共享工具后续处理使用。
    let body = parseStatements(P, ')')
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, ')', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', cStart, P.L.b, [])
    } else {
      // close更新为 `mk(P, ')', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', P.L.b, P.L.b, [])
    }
    // $(< file) shorthand: unwrap redirected_statement → bare file_redirect
    // tree-sitter emits (command_substitution (file_redirect (word))) directly
    // 共享工具在这里按实际状态进入对应分支。
    if (
      body.length === 1 &&
      body[0]!.type === 'redirected_statement' &&
      body[0]!.children.length === 1 &&
      body[0]!.children[0]!.type === 'file_redirect'
    ) {
      // 请求体更新为 `body[0]!.children`，确保Bash 解析工具后续读取最新状态。
      body = body[0]!.children
    }
    // 返回 `mk(P, 'command_substitution', dStart, close.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'command_substitution', dStart, close.endIndex, [
      open,
      ...body,
      close,
    ])
  }
  // 当 `c1` 匹配 `'{'` 时，共享工具执行对应分支。
  if (c1 === '{') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '${', dStart, P.L.b, [])
    // inner解析`parseExpansionBody`，供共享工具后续处理使用。
    const inner = parseExpansionBody(P)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `'}'` 时，共享工具执行对应分支。
    if (peek(P.L) === '}') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, '}', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '}', cStart, P.L.b, [])
    } else {
      // close更新为 `mk(P, '}', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, '}', P.L.b, P.L.b, [])
    }
    // 返回 `mk(P, 'expansion', dStart, close.endIndex, [open, ...inner, close])`，作为共享工具这次计算的结果。
    return mk(P, 'expansion', dStart, close.endIndex, [open, ...inner, close])
  }
  // Simple expansion $VAR or $? $$ $@ etc
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // dEnd保存`P.L.b`，供后续判断或组装使用。
  const dEnd = P.L.b
  // dollar保存`mk`，供共享工具后续处理使用。
  const dollar = mk(P, '$', dStart, dEnd, [])
  // nc保存`peek`，供共享工具后续处理使用。
  const nc = peek(P.L)
  // $_ is special_variable_name only when not followed by more ident chars
  // 只有 `nc === '_' && !isIdentChar(peek(P.L, 1))` 满足时，共享工具才执行该分支。
  if (nc === '_' && !isIdentChar(peek(P.L, 1))) {
    // vStart保存`P.L.b`，供后续判断或组装使用。
    const vStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'special_variable_name', vStart, P.L.b, [])
    // 返回 `mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])
  }
  // 满足 `isIdentStart(nc)` 时，共享工具执行该分支。
  if (isIdentStart(nc)) {
    // vStart保存`P.L.b`，供后续判断或组装使用。
    const vStart = P.L.b
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'variable_name', vStart, P.L.b, [])
    // 返回 `mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])
  }
  // 满足 `isDigit(nc)` 时，共享工具执行该分支。
  if (isDigit(nc)) {
    // vStart保存`P.L.b`，供后续判断或组装使用。
    const vStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'variable_name', vStart, P.L.b, [])
    // 返回 `mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])
  }
  // 满足 `SPECIAL_VARS.has(nc)` 时，共享工具执行该分支。
  if (SPECIAL_VARS.has(nc)) {
    // vStart保存`P.L.b`，供后续判断或组装使用。
    const vStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // vn保存`mk`，供共享工具后续处理使用。
    const vn = mk(P, 'special_variable_name', vStart, P.L.b, [])
    // 返回 `mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])`，作为共享工具这次计算的结果。
    return mk(P, 'simple_expansion', dStart, P.L.b, [dollar, vn])
  }
  // Bare $ — just a $ leaf (tree-sitter treats trailing $ as literal)
  // 返回 `dollar`，作为共享工具这次计算的结果。
  return dollar
}

// parseExpansionBody 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseExpansionBody(P: ParseState): TsNode[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: TsNode[] = []
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // Bizarre cases: ${#!} ${!#} ${!##} ${!# } ${!## } all emit empty (expansion)
  // — both # and ! become anonymous nodes when only combined with each other
  // and optional trailing space before }. Note ${!##/} does NOT match (has
  // content after), so it parses normally as (special_variable_name)(regex).
  {
    // c0保存`peek`，供共享工具后续处理使用。
    const c0 = peek(P.L)
    // c1保存`peek`，供共享工具后续处理使用。
    const c1 = peek(P.L, 1)
    // 当 `c0` 匹配 `'#' && c1 === '!' && peek(P...` 时，共享工具执行对应分支。
    if (c0 === '#' && c1 === '!' && peek(P.L, 2) === '}') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 返回 `out`，作为共享工具这次计算的结果。
      return out
    }
    // 当 `c0` 匹配 `'!' && c1 === '#'` 时，共享工具执行对应分支。
    if (c0 === '!' && c1 === '#') {
      // ${!#} ${!##} with optional trailing space then }
      // j保存`2`，供后续判断或组装使用。
      let j = 2
      // 当 `peek(P.L, j)` 匹配 `'#'` 时，共享工具执行对应分支。
      if (peek(P.L, j) === '#') j++
      // 当 `peek(P.L, j)` 匹配 `' '` 时，共享工具执行对应分支。
      if (peek(P.L, j) === ' ') j++
      // 当 `peek(P.L, j)` 匹配 `'}'` 时，共享工具执行对应分支。
      if (peek(P.L, j) === '}') {
        // 只要 j-- > 0) advance(P.L 成立，就持续推进共享工具中的循环处理。
        while (j-- > 0) advance(P.L)
        // 返回 `out`，作为共享工具这次计算的结果。
        return out
      }
    }
  }
  // Optional # prefix for length
  // 当 `peek(P.L)` 匹配 `'#'` 时，共享工具执行对应分支。
  if (peek(P.L) === '#') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, '#', s, P.L.b, []))
  }
  // Optional ! prefix for indirect expansion: ${!varname} ${!prefix*} ${!prefix@}
  // Only when followed by an identifier — ${!} alone is special var $!
  // Also = ~ prefixes (zsh-style ${=var} ${~var})
  // pc保存`peek`，供共享工具后续处理使用。
  const pc = peek(P.L)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (pc === '!' || pc === '=' || pc === '~') &&
    (isIdentStart(peek(P.L, 1)) || isDigit(peek(P.L, 1)))
  ) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, pc, s, P.L.b, []))
  }
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // Variable name
  // 满足 `isIdentStart(peek(P.L))` 时，共享工具执行该分支。
  if (isIdentStart(peek(P.L))) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, 'variable_name', s, P.L.b, []))
  // 共享工具 bash Parser在这里处理 `} else if (isDigit(peek(P.L))) {`，完成这一小步状态转换。
  } else if (isDigit(peek(P.L))) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 只要 isDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isDigit(peek(P.L))) advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, 'variable_name', s, P.L.b, []))
  // 共享工具 bash Parser在这里处理 `} else if (SPECIAL_VARS.has(peek(P.L))) {`，完成这一小步状态转换。
  } else if (SPECIAL_VARS.has(peek(P.L))) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, 'special_variable_name', s, P.L.b, []))
  }
  // Optional subscript [idx] — parsed arithmetically
  // 当 `peek(P.L)` 匹配 `'['` 时，共享工具执行对应分支。
  if (peek(P.L) === '[') {
    // varNode 命名 `out[out.length - 1]`，让后续代码直接表达这个值的用途。
    const varNode = out[out.length - 1]
    // brOpen保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const brOpen = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // brOpenNode保存`mk`，供共享工具后续处理使用。
    const brOpenNode = mk(P, '[', brOpen, P.L.b, [])
    // idx解析`parseSubscriptIndexInline`，供共享工具后续处理使用。
    const idx = parseSubscriptIndexInline(P)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // brClose保存`P.L.b`，供后续判断或组装使用。
    const brClose = P.L.b
    // 满足 `peek(P.L) === ']') advance(P.L` 时，共享工具执行该分支。
    if (peek(P.L) === ']') advance(P.L)
    // brCloseNode保存`mk`，供共享工具后续处理使用。
    const brCloseNode = mk(P, ']', brClose, P.L.b, [])
    // 满足 `varNode` 时，共享工具执行该分支。
    if (varNode) {
      // kids 集合保存`idx`，供后续判断或组装使用。
      const kids = idx
        ? [varNode, brOpenNode, idx, brCloseNode]
        : [varNode, brOpenNode, brCloseNode]
      // length - 1 数量更新为 `mk(P, 'subscript', varNode.startIndex, P.L.b, kids)`，确保共享工具 bash Parser后续读取最新状态。
      out[out.length - 1] = mk(P, 'subscript', varNode.startIndex, P.L.b, kids)
    }
  }
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // Trailing * or @ for indirect expansion (${!prefix*} ${!prefix@}) or
  // @operator for parameter transformation (${var@U} ${var@Q}) — anonymous
  // tc保存`peek`，供共享工具后续处理使用。
  const tc = peek(P.L)
  // 当 `(tc` 匹配 `'*' || tc === '@') && peek(...` 时，共享工具执行对应分支。
  if ((tc === '*' || tc === '@') && peek(P.L, 1) === '}') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, tc, s, P.L.b, []))
    // 返回 `out`，作为共享工具这次计算的结果。
    return out
  }
  // 只有 `tc === '@' && isIdentStart(peek(P.L, 1))` 满足时，共享工具才执行该分支。
  if (tc === '@' && isIdentStart(peek(P.L, 1))) {
    // ${var@U} transformation — @ is anonymous, consume op char(s)
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, '@', s, P.L.b, []))
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // 返回 `out`，作为共享工具这次计算的结果。
    return out
  }
  // Operator :- := :? :+ - = ? + # ## % %% / // ^ ^^ , ,, etc.
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // Bare `:` substring operator ${var:off:len} — offset and length parsed
  // arithmetically. Must come BEFORE the generic operator handling so `(` after
  // `:` goes to parenthesized_expression not the array path. `:-` `:=` `:?`
  // `:+` (no space) remain default-value operators; `: -1` (with space before
  // -1) is substring with negative offset.
  // 当 `c` 匹配 `':'` 时，共享工具执行对应分支。
  if (c === ':') {
    // c1保存`peek`，供共享工具后续处理使用。
    const c1 = peek(P.L, 1)
    // `:\n` or `:}` — empty substring expansion, emits nothing (variable_name only)
    // 当 `c1` 匹配 `'\n' || c1 === '}'` 时，共享工具执行对应分支。
    if (c1 === '\n' || c1 === '}') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 peek(P.L) === '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (peek(P.L) === '\n') advance(P.L)
      // 返回 `out`，作为共享工具这次计算的结果。
      return out
    }
    // `c1` 与 `'-' && c1 !== '=' && c1 !== '?'...` 不一致时刷新派生状态，避免使用过期结果。
    if (c1 !== '-' && c1 !== '=' && c1 !== '?' && c1 !== '+') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // Offset — arithmetic. `-N` at top level is a single number node per
      // tree-sitter; inside parens it's unary_expression(number).
      // offC保存`peek`，供共享工具后续处理使用。
      const offC = peek(P.L)
      // off 先占位，稍后的条件分支会根据实际输入补齐它。
      let off: TsNode | null
      // 只有 `offC === '-' && isDigit(peek(P.L, 1))` 满足时，共享工具才执行该分支。
      if (offC === '-' && isDigit(peek(P.L, 1))) {
        // ns 集合保存`P.L.b`，供后续判断或组装使用。
        const ns = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 只要 isDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
        while (isDigit(peek(P.L))) advance(P.L)
        // off更新为 `mk(P, 'number', ns, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
        off = mk(P, 'number', ns, P.L.b, [])
      } else {
        // off更新为 `parseArithExpr(P, ':}', 'var')`，确保Bash 解析工具后续读取最新状态。
        off = parseArithExpr(P, ':}', 'var')
      }
      // 满足 `off) out.push(off` 时，共享工具执行该分支。
      if (off) out.push(off)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 当 `peek(P.L)` 匹配 `':'` 时，共享工具执行对应分支。
      if (peek(P.L) === ':') {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 skipBlanks，触发共享工具此处需要的副作用。
        skipBlanks(P.L)
        // lenC保存`peek`，供共享工具后续处理使用。
        const lenC = peek(P.L)
        // len 先占位，稍后的条件分支会根据实际输入补齐它。
        let len: TsNode | null
        // 只有 `lenC === '-' && isDigit(peek(P.L, 1))` 满足时，共享工具才执行该分支。
        if (lenC === '-' && isDigit(peek(P.L, 1))) {
          // ns 集合保存`P.L.b`，供后续判断或组装使用。
          const ns = P.L.b
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // 只要 isDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
          while (isDigit(peek(P.L))) advance(P.L)
          // len更新为 `mk(P, 'number', ns, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
          len = mk(P, 'number', ns, P.L.b, [])
        } else {
          // len更新为 `parseArithExpr(P, '}', 'var')`，确保Bash 解析工具后续读取最新状态。
          len = parseArithExpr(P, '}', 'var')
        }
        // 满足 `len) out.push(len` 时，共享工具执行该分支。
        if (len) out.push(len)
      }
      // 返回 `out`，作为共享工具这次计算的结果。
      return out
    }
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    c === ':' ||
    c === '#' ||
    c === '%' ||
    c === '/' ||
    c === '^' ||
    c === ',' ||
    c === '-' ||
    c === '=' ||
    c === '?' ||
    c === '+'
  ) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // c1保存`peek`，供共享工具后续处理使用。
    const c1 = peek(P.L, 1)
    // op 命名 `c`，让后续代码直接表达这个值的用途。
    let op = c
    // 只有 `c === ':' && (c1 === '-' || c1 === '=' || c1 === '?' || c1 === '+')` 满足时，共享工具才执行该分支。
    if (c === ':' && (c1 === '-' || c1 === '=' || c1 === '?' || c1 === '+')) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // op更新为 `c + c1`，确保Bash 解析工具后续读取最新状态。
      op = c + c1
    // 共享工具 bash Parser在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      (c === '#' || c === '%' || c === '/' || c === '^' || c === ',') &&
      c1 === c
    ) {
      // Doubled operators: ## %% // ^^ ,,
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // op更新为 `c + c`，确保Bash 解析工具后续读取最新状态。
      op = c + c
    } else {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
    }
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push(mk(P, op, s, P.L.b, []))
    // Rest is the default/replacement — parse as word or regex until }
    // Pattern-matching operators (# ## % %% / // ^ ^^ , ,,) emit regex;
    // value-substitution operators (:- := :? :+ - = ? + :) emit word.
    // `/` and `//` split at next `/` into (regex)+(word) for pat/repl.
    // isPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isPattern =
      op === '#' ||
      op === '##' ||
      op === '%' ||
      op === '%%' ||
      op === '/' ||
      op === '//' ||
      op === '^' ||
      op === '^^' ||
      op === ',' ||
      op === ',,'
    // 当 `op` 匹配 `'/' || op === '//'` 时，共享工具执行对应分支。
    if (op === '/' || op === '//') {
      // Optional /# or /% anchor prefix — anonymous node
      // ac保存`peek`，供共享工具后续处理使用。
      const ac = peek(P.L)
      // 当 `ac` 匹配 `'#' || ac === '%'` 时，共享工具执行对应分支。
      if (ac === '#' || ac === '%') {
        // aStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
        const aStart = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(mk(P, ac, aStart, P.L.b, []))
      }
      // Pattern: per grammar _expansion_regex_replacement, pattern is
      // choice(regex, string, cmd_sub, seq(string, regex)). If it STARTS
      // with ", emit (string) and any trailing chars become (regex).
      // `${v//"${old}"/}` → (string(expansion)); `${v//"${c}"\//}` →
      // (string)(regex).
      // 当 `peek(P.L)` 匹配 `'"'` 时，共享工具执行对应分支。
      if (peek(P.L) === '"') {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(parseDoubleQuoted(P))
        // tail解析`parseExpansionRest`，供共享工具后续处理使用。
        const tail = parseExpansionRest(P, 'regex', true)
        // 满足 `tail) out.push(tail` 时，共享工具执行该分支。
        if (tail) out.push(tail)
      } else {
        // regex解析`parseExpansionRest`，供共享工具后续处理使用。
        const regex = parseExpansionRest(P, 'regex', true)
        // 满足 `regex) out.push(regex` 时，共享工具执行该分支。
        if (regex) out.push(regex)
      }
      // 当 `peek(P.L)` 匹配 `'/'` 时，共享工具执行对应分支。
      if (peek(P.L) === '/') {
        // sepStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
        const sepStart = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(mk(P, '/', sepStart, P.L.b, []))
        // Replacement: per grammar, choice includes `seq(cmd_sub, word)`
        // which emits TWO siblings (not concatenation). Also `(` at start
        // of replacement is a regular word char, NOT array — unlike `:-`
        // default-value context. `${v/(/(Gentoo ${x}, }` replacement
        // `(Gentoo ${x}, ` is (concatenation (word)(expansion)(word)).
        // repl解析`parseExpansionRest`，供共享工具后续处理使用。
        const repl = parseExpansionRest(P, 'replword', false)
        // 满足 `repl` 时，共享工具执行该分支。
        if (repl) {
          // seq(cmd_sub, word) special case → siblings. Detected when
          // replacement is a concatenation of exactly 2 parts with first
          // being command_substitution.
          // 共享工具在这里按实际状态进入对应分支。
          if (
            repl.type === 'concatenation' &&
            repl.children.length === 2 &&
            repl.children[0]!.type === 'command_substitution'
          ) {
            // out追加新条目，保持收集顺序与输入顺序一致。
            out.push(repl.children[0]!)
            // out追加新条目，保持收集顺序与输入顺序一致。
            out.push(repl.children[1]!)
          } else {
            // out追加新条目，保持收集顺序与输入顺序一致。
            out.push(repl)
          }
        }
      }
    // 共享工具 bash Parser在这里处理 `} else if (op === '#' || op === '##' || op === '%' || op === '%%') {`，完成这一小步状态转换。
    } else if (op === '#' || op === '##' || op === '%' || op === '%%') {
      // Pattern-removal: per grammar _expansion_regex, pattern is
      // repeat(choice(regex, string, raw_string, ')')). Each quote/string
      // is a SIBLING, not absorbed into one regex. `${f%'str'*}` →
      // (raw_string)(regex); `${f/'str'*}` (slash) stays single regex.
      // 逐项读取 `parseExpansionRegexSegmented(P)) out.push(p` 中的p，按输入顺序推进共享工具。
      for (const p of parseExpansionRegexSegmented(P)) out.push(p)
    } else {
      // rest解析`parseExpansionRest`，供共享工具后续处理使用。
      const rest = parseExpansionRest(P, isPattern ? 'regex' : 'word', false)
      // 满足 `rest) out.push(rest` 时，共享工具执行该分支。
      if (rest) out.push(rest)
    }
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

// parseExpansionRest 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseExpansionRest(
  P: ParseState,
  nodeType: string,
  stopAtSlash: boolean,
): TsNode | null {
  // Don't skipBlanks — `${var:- }` space IS the word. Stop at } or newline
  // (`${var:\n}` emits no word). stopAtSlash=true stops at `/` for pat/repl
  // split in ${var/pat/repl}. nodeType 'replword' is word-mode for the
  // replacement in `/` `//` — same as 'word' but `(` is NOT array.
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // Value-substitution RHS starting with `(` parses as array: ${var:-(x)} →
  // (expansion (variable_name) (array (word))). Only for 'word' context (not
  // pattern-matching operators which emit regex, and not 'replword' where `(`
  // is a regular char per grammar `_expansion_regex_replacement`).
  // 当 `nodeType` 匹配 `'word' && peek(P.L) === '('` 时，共享工具执行对应分支。
  if (nodeType === 'word' && peek(P.L) === '(') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '(', start, P.L.b, [])
    // elems 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const elems: TsNode[] = [open]
    // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
    while (P.L.i < P.L.len) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // c保存`peek`，供共享工具后续处理使用。
      const c = peek(P.L)
      // 当 `c` 匹配 `')' || c === '}' || c === '...` 时，共享工具执行对应分支。
      if (c === ')' || c === '}' || c === '\n' || c === '') break
      // wStart保存`P.L.b`，供后续判断或组装使用。
      const wStart = P.L.b
      // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
      while (P.L.i < P.L.len) {
        // wc保存`peek`，供共享工具后续处理使用。
        const wc = peek(P.L)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          wc === ')' ||
          wc === '}' ||
          wc === ' ' ||
          wc === '\t' ||
          wc === '\n' ||
          wc === ''
        ) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
      // 满足 `P.L.b > wStart) elems.push(mk(P, 'word', wStart, P.L.b, [])` 时，共享工具执行该分支。
      if (P.L.b > wStart) elems.push(mk(P, 'word', wStart, P.L.b, []))
      else break
    }
    // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // elems 集合追加新条目，保持收集顺序与输入顺序一致。
      elems.push(mk(P, ')', cStart, P.L.b, []))
    }
    // 只要 peek(P.L) === '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (peek(P.L) === '\n') advance(P.L)
    // 返回 `mk(P, 'array', start, P.L.b, elems)`，作为共享工具这次计算的结果。
    return mk(P, 'array', start, P.L.b, elems)
  }
  // REGEX mode: flat single-span scan. Quotes are opaque (skipped past so
  // `/` inside them doesn't break stopAtSlash), but NOT emitted as separate
  // nodes — the entire range becomes one regex node.
  // 当 `nodeType` 匹配 `'regex'` 时，共享工具执行对应分支。
  if (nodeType === 'regex') {
    // braceDepth 命名 `0`，让后续代码直接表达这个值的用途。
    let braceDepth = 0
    // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
    while (P.L.i < P.L.len) {
      // c保存`peek`，供共享工具后续处理使用。
      const c = peek(P.L)
      // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
      if (c === '\n') break
      // 满足 `braceDepth === 0` 时，共享工具执行该分支。
      if (braceDepth === 0) {
        // 当 `c` 匹配 `'}'` 时，共享工具执行对应分支。
        if (c === '}') break
        // 当 `stopAtSlash && c` 匹配 `'/'` 时，共享工具执行对应分支。
        if (stopAtSlash && c === '/') break
      }
      // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
      if (c === '\\' && P.L.i + 1 < P.L.len) {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c` 匹配 `'"' || c === "'"` 时，共享工具执行对应分支。
      if (c === '"' || c === "'") {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 只要 P.L.i < P.L.len && peek(P.L) !== c 成立，就持续推进共享工具中的循环处理。
        while (P.L.i < P.L.len && peek(P.L) !== c) {
          // 只有 `peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L` 满足时，共享工具才执行该分支。
          if (peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L)
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
        }
        // 满足 `peek(P.L) === c) advance(P.L` 时，共享工具执行该分支。
        if (peek(P.L) === c) advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Skip past nested ${...} $(...) $[...] so their } / don't terminate us
      // 满足 `c === '` 时，共享工具执行该分支。
      if (c === '$') {
        // c1保存`peek`，供共享工具后续处理使用。
        const c1 = peek(P.L, 1)
        // 当 `c1` 匹配 `'{'` 时，共享工具执行对应分支。
        if (c1 === '{') {
          // d保存`0`，供后续判断或组装使用。
          let d = 0
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // 共享工具 bash Parser在这里处理 `d++`，完成这一小步状态转换。
          d++
          // while 使用 P.L.i < P.L.len && d > 0 完成共享工具里的对应操作。
          while (P.L.i < P.L.len && d > 0) {
            // nc保存`peek`，供共享工具后续处理使用。
            const nc = peek(P.L)
            // 当 `nc` 匹配 `'{'` 时，共享工具执行对应分支。
            if (nc === '{') d++
            else if (nc === '}') d--
            // 调用 advance，触发共享工具此处需要的副作用。
            advance(P.L)
          }
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // 当 `c1` 匹配 `'('` 时，共享工具执行对应分支。
        if (c1 === '(') {
          // d保存`0`，供后续判断或组装使用。
          let d = 0
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // 共享工具 bash Parser在这里处理 `d++`，完成这一小步状态转换。
          d++
          // while 使用 P.L.i < P.L.len && d > 0 完成共享工具里的对应操作。
          while (P.L.i < P.L.len && d > 0) {
            // nc保存`peek`，供共享工具后续处理使用。
            const nc = peek(P.L)
            // 当 `nc` 匹配 `'('` 时，共享工具执行对应分支。
            if (nc === '(') d++
            else if (nc === ')') d--
            // 调用 advance，触发共享工具此处需要的副作用。
            advance(P.L)
          }
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
      }
      // 当 `c` 匹配 `'{'` 时，共享工具执行对应分支。
      if (c === '{') braceDepth++
      else if (c === '}' && braceDepth > 0) braceDepth--
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
    }
    // end 命名 `P.L.b`，让后续代码直接表达这个值的用途。
    const end = P.L.b
    // 只要 peek(P.L) === '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (peek(P.L) === '\n') advance(P.L)
    // 满足 `end === start` 时，共享工具执行该分支。
    if (end === start) return null
    // 返回 `mk(P, 'regex', start, end, [])`，作为共享工具这次计算的结果。
    return mk(P, 'regex', start, end, [])
  }
  // WORD mode: segmenting parser — recognize nested ${...}, $(...), $'...',
  // "...", '...', $ident, <(...)/>(...); bare chars accumulate into word
  // segments. Multiple parts → wrapped in concatenation.
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: TsNode[] = []
  // segStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  let segStart = P.L.b
  // braceDepth 命名 `0`，让后续代码直接表达这个值的用途。
  let braceDepth = 0
  // flushSeg封装成回调，供共享工具 bash Parser在事件触发或异步步骤中调用。
  const flushSeg = (): void => {
    // 满足 `P.L.b > segStart` 时，共享工具执行该分支。
    if (P.L.b > segStart) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, 'word', segStart, P.L.b, []))
    }
  }
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (c === '\n') break
    // 满足 `braceDepth === 0` 时，共享工具执行该分支。
    if (braceDepth === 0) {
      // 当 `c` 匹配 `'}'` 时，共享工具执行对应分支。
      if (c === '}') break
      // 当 `stopAtSlash && c` 匹配 `'/'` 时，共享工具执行对应分支。
      if (stopAtSlash && c === '/') break
    }
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // c1保存`peek`，供共享工具后续处理使用。
    const c1 = peek(P.L, 1)
    // 满足 `c === '` 时，共享工具执行该分支。
    if (c === '$') {
      // 当 `c1` 匹配 `'{' || c1 === '(' || c1 ===...` 时，共享工具执行对应分支。
      if (c1 === '{' || c1 === '(' || c1 === '[') {
        // 调用 flushSeg，触发共享工具此处需要的副作用。
        flushSeg()
        // exp解析`parseDollarLike`，供共享工具后续处理使用。
        const exp = parseDollarLike(P)
        // 满足 `exp) parts.push(exp` 时，共享工具执行该分支。
        if (exp) parts.push(exp)
        // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        segStart = P.L.b
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c1` 匹配 `"'"` 时，共享工具执行对应分支。
      if (c1 === "'") {
        // $'...' ANSI-C string
        // 调用 flushSeg，触发共享工具此处需要的副作用。
        flushSeg()
        // aStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
        const aStart = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 只要 P.L.i < P.L.len && peek(P.L) !== "'" 成立，就持续推进共享工具中的循环处理。
        while (P.L.i < P.L.len && peek(P.L) !== "'") {
          // 只有 `peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L` 满足时，共享工具才执行该分支。
          if (peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L)
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
        }
        // 满足 `peek(P.L) === "'") advance(P.L` 时，共享工具执行该分支。
        if (peek(P.L) === "'") advance(P.L)
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(mk(P, 'ansi_c_string', aStart, P.L.b, []))
        // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        segStart = P.L.b
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 只有 `isIdentStart(c1) || isDigit(c1) || SPECIAL_VARS.has(c1)` 满足时，共享工具才执行该分支。
      if (isIdentStart(c1) || isDigit(c1) || SPECIAL_VARS.has(c1)) {
        // 调用 flushSeg，触发共享工具此处需要的副作用。
        flushSeg()
        // exp解析`parseDollarLike`，供共享工具后续处理使用。
        const exp = parseDollarLike(P)
        // 满足 `exp) parts.push(exp` 时，共享工具执行该分支。
        if (exp) parts.push(exp)
        // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        segStart = P.L.b
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(parseDoubleQuoted(P))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c === "'") {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // rStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const rStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 P.L.i < P.L.len && peek(P.L) !== "'") advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && peek(P.L) !== "'") advance(P.L)
      // 满足 `peek(P.L) === "'") advance(P.L` 时，共享工具执行该分支。
      if (peek(P.L) === "'") advance(P.L)
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, 'raw_string', rStart, P.L.b, []))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `(c` 匹配 `'<' || c === '>') && c1 ===...` 时，共享工具执行对应分支。
    if ((c === '<' || c === '>') && c1 === '(') {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // ps 集合解析`parseProcessSub`，供共享工具后续处理使用。
      const ps = parseProcessSub(P)
      // 满足 `ps) parts.push(ps` 时，共享工具执行该分支。
      if (ps) parts.push(ps)
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'`'` 时，共享工具执行对应分支。
    if (c === '`') {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // bt解析`parseBacktick`，供共享工具后续处理使用。
      const bt = parseBacktick(P)
      // 满足 `bt) parts.push(bt` 时，共享工具执行该分支。
      if (bt) parts.push(bt)
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Brace tracking so nested {a,b} brace-expansion chars don't prematurely
    // terminate (rare, but the `?` in `${cond}? (` should be treated as word).
    // 当 `c` 匹配 `'{'` 时，共享工具执行对应分支。
    if (c === '{') braceDepth++
    else if (c === '}' && braceDepth > 0) braceDepth--
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 调用 flushSeg，触发共享工具此处需要的副作用。
  flushSeg()
  // Consume trailing newlines before } so caller sees }
  // 只要 peek(P.L) === '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (peek(P.L) === '\n') advance(P.L)
  // Tree-sitter skips leading whitespace (extras) in expansion RHS when
  // there's content after: `${2+ ${2}}` → just (expansion). But `${v:- }`
  // (space-only RHS) keeps the space as (word). So drop leading whitespace-
  // only word segment if it's NOT the only part.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    parts.length > 1 &&
    parts[0]!.type === 'word' &&
    /^[ \t]+$/.test(parts[0]!.text)
  ) {
    // 调用 parts.shift，触发共享工具此处需要的副作用。
    parts.shift()
  }
  // 片段列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (parts.length === 0) return null
  // 满足 `parts.length === 1` 时，共享工具执行该分支。
  if (parts.length === 1) return parts[0]!
  // Multiple parts: wrap in concatenation (word mode keeps concat wrapping;
  // regex mode also concats per tree-sitter for mixed quote+glob patterns).
  // last 命名 `parts[parts.length - 1]!`，让后续代码直接表达这个值的用途。
  const last = parts[parts.length - 1]!
  // 返回 `mk(P, 'concatenation', parts[0]!.startIndex, last.endIndex, parts)`，作为共享工具这次计算的结果。
  return mk(P, 'concatenation', parts[0]!.startIndex, last.endIndex, parts)
}

// Pattern for # ## % %% operators — per grammar _expansion_regex:
// repeat(choice(regex, string, raw_string, ')', /\s+/→regex)). Each quote
// becomes a SIBLING node, not absorbed. `${f%'str'*}` → (raw_string)(regex).
// parseExpansionRegexSegmented 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseExpansionRegexSegmented(P: ParseState): TsNode[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: TsNode[] = []
  // segStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  let segStart = P.L.b
  // flushRegex封装成回调，供共享工具 bash Parser在事件触发或异步步骤中调用。
  const flushRegex = (): void => {
    // 满足 `P.L.b > segStart) out.push(mk(P, 'regex', segStart, P.L.b, [])` 时，共享工具执行该分支。
    if (P.L.b > segStart) out.push(mk(P, 'regex', segStart, P.L.b, []))
  }
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 当 `c` 匹配 `'}' || c === '\n'` 时，共享工具执行对应分支。
    if (c === '}' || c === '\n') break
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') {
      // 调用 flushRegex，触发共享工具此处需要的副作用。
      flushRegex()
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(parseDoubleQuoted(P))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c === "'") {
      // 调用 flushRegex，触发共享工具此处需要的副作用。
      flushRegex()
      // rStart保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const rStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 P.L.i < P.L.len && peek(P.L) !== "'") advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && peek(P.L) !== "'") advance(P.L)
      // 满足 `peek(P.L) === "'") advance(P.L` 时，共享工具执行该分支。
      if (peek(P.L) === "'") advance(P.L)
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(mk(P, 'raw_string', rStart, P.L.b, []))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Nested ${...} $(...) — opaque scan so their } doesn't terminate us
    // 满足 `c === '` 时，共享工具执行该分支。
    if (c === '$') {
      // c1保存`peek`，供共享工具后续处理使用。
      const c1 = peek(P.L, 1)
      // 当 `c1` 匹配 `'{'` 时，共享工具执行对应分支。
      if (c1 === '{') {
        // d保存`1`，供后续判断或组装使用。
        let d = 1
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // while 使用 P.L.i < P.L.len && d > 0 完成共享工具里的对应操作。
        while (P.L.i < P.L.len && d > 0) {
          // nc保存`peek`，供共享工具后续处理使用。
          const nc = peek(P.L)
          // 当 `nc` 匹配 `'{'` 时，共享工具执行对应分支。
          if (nc === '{') d++
          else if (nc === '}') d--
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c1` 匹配 `'('` 时，共享工具执行对应分支。
      if (c1 === '(') {
        // d保存`1`，供后续判断或组装使用。
        let d = 1
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // while 使用 P.L.i < P.L.len && d > 0 完成共享工具里的对应操作。
        while (P.L.i < P.L.len && d > 0) {
          // nc保存`peek`，供共享工具后续处理使用。
          const nc = peek(P.L)
          // 当 `nc` 匹配 `'('` 时，共享工具执行对应分支。
          if (nc === '(') d++
          else if (nc === ')') d--
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 调用 flushRegex，触发共享工具此处需要的副作用。
  flushRegex()
  // 只要 peek(P.L) === '\n') advance(P.L 成立，就持续推进共享工具中的循环处理。
  while (peek(P.L) === '\n') advance(P.L)
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

// parseBacktick 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseBacktick(P: ParseState): TsNode | null {
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // 调用 advance，触发共享工具此处需要的副作用。
  advance(P.L)
  // open保存`mk`，供共享工具后续处理使用。
  const open = mk(P, '`', start, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `P.inBacktick++`，完成这一小步状态转换。
  P.inBacktick++
  // Parse statements inline — stop at closing backtick
  // 请求体 从空数组开始收集，后续循环会按处理顺序追加条目。
  const body: TsNode[] = []
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `peek(P.L)` 匹配 `'`' || peek(P.L) === ''` 时，共享工具执行对应分支。
    if (peek(P.L) === '`' || peek(P.L) === '') break
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 当 `t.type` 匹配 `'EOF' || t.type === 'BACKTI...` 时，共享工具执行对应分支。
    if (t.type === 'EOF' || t.type === 'BACKTICK') {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 当 `t.type` 匹配 `'NEWLINE'` 时，共享工具执行对应分支。
    if (t.type === 'NEWLINE') continue
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // stmt解析`parseAndOr`，供共享工具后续处理使用。
    const stmt = parseAndOr(P)
    // stmt缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!stmt) break
    // 请求体追加新条目，保持收集顺序与输入顺序一致。
    body.push(stmt)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `peek(P.L)` 匹配 `'`'` 时，共享工具执行对应分支。
    if (peek(P.L) === '`') break
    // save2保存`saveLex`，供共享工具后续处理使用。
    const save2 = saveLex(P.L)
    // sep保存`nextToken`，供共享工具后续处理使用。
    const sep = nextToken(P.L, 'cmd')
    // 只有 `sep.type === 'OP' && (sep.value === ';' || sep.value === '&')` 满足时，共享工具才执行该分支。
    if (sep.type === 'OP' && (sep.value === ';' || sep.value === '&')) {
      // 请求体追加新条目，保持收集顺序与输入顺序一致。
      body.push(leaf(P, sep.value, sep))
    // 共享工具 bash Parser在这里处理 `} else if (sep.type !== 'NEWLINE') {`，完成这一小步状态转换。
    } else if (sep.type !== 'NEWLINE') {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save2)
    }
  }
  // 共享工具 bash Parser在这里处理 `P.inBacktick--`，完成这一小步状态转换。
  P.inBacktick--
  // close 先占位，稍后的条件分支会根据实际输入补齐它。
  let close: TsNode
  // 当 `peek(P.L)` 匹配 `'`'` 时，共享工具执行对应分支。
  if (peek(P.L) === '`') {
    // cStart保存`P.L.b`，供后续判断或组装使用。
    const cStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // close更新为 `mk(P, '`', cStart, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, '`', cStart, P.L.b, [])
  } else {
    // close更新为 `mk(P, '`', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    close = mk(P, '`', P.L.b, P.L.b, [])
  }
  // Empty backticks (whitespace/newline only) are elided entirely by
  // tree-sitter — used as a line-continuation hack: "foo"`<newline>`"bar"
  // → (concatenation (string) (string)) with no command_substitution.
  // 请求体为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (body.length === 0) return null
  // 返回 `mk(P, 'command_substitution', start, close.endIndex, [`，作为共享工具这次计算的结果。
  return mk(P, 'command_substitution', start, close.endIndex, [
    open,
    ...body,
    close,
  ])
}

// parseIf 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseIf(P: ParseState, ifTok: Token): TsNode {
  // ifKw保存`leaf`，供共享工具后续处理使用。
  const ifKw = leaf(P, 'if', ifTok)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [ifKw]
  // cond解析`parseStatements`，供共享工具后续处理使用。
  const cond = parseStatements(P, null)
  // kids 集合追加新条目，保持收集顺序与输入顺序一致。
  kids.push(...cond)
  // 调用 consumeKeyword，触发共享工具此处需要的副作用。
  consumeKeyword(P, 'then', kids)
  // 请求体解析`parseStatements`，供共享工具后续处理使用。
  const body = parseStatements(P, null)
  // kids 集合追加新条目，保持收集顺序与输入顺序一致。
  kids.push(...body)
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'cmd')
    // 当 `t.type` 匹配 `'WORD' && t.value === 'elif'` 时，共享工具执行对应分支。
    if (t.type === 'WORD' && t.value === 'elif') {
      // eKw保存`leaf`，供共享工具后续处理使用。
      const eKw = leaf(P, 'elif', t)
      // eCond解析`parseStatements`，供共享工具后续处理使用。
      const eCond = parseStatements(P, null)
      // eKids 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const eKids: TsNode[] = [eKw, ...eCond]
      // 调用 consumeKeyword，触发共享工具此处需要的副作用。
      consumeKeyword(P, 'then', eKids)
      // eBody解析`parseStatements`，供共享工具后续处理使用。
      const eBody = parseStatements(P, null)
      // eKids 集合追加新条目，保持收集顺序与输入顺序一致。
      eKids.push(...eBody)
      // last 命名 `eKids[eKids.length - 1]!`，让后续代码直接表达这个值的用途。
      const last = eKids[eKids.length - 1]!
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(mk(P, 'elif_clause', eKw.startIndex, last.endIndex, eKids))
    // 共享工具 bash Parser在这里处理 `} else if (t.type === 'WORD' && t.value === 'else') {`，完成这一小步状态转换。
    } else if (t.type === 'WORD' && t.value === 'else') {
      // elKw保存`leaf`，供共享工具后续处理使用。
      const elKw = leaf(P, 'else', t)
      // elBody解析`parseStatements`，供共享工具后续处理使用。
      const elBody = parseStatements(P, null)
      // last 命名 `elBody.length > 0 ? elBody[elBody.length - 1]! : elKw`，让后续代码直接表达这个值的用途。
      const last = elBody.length > 0 ? elBody[elBody.length - 1]! : elKw
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(
        mk(P, 'else_clause', elKw.startIndex, last.endIndex, [elKw, ...elBody]),
      )
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 调用 consumeKeyword，触发共享工具此处需要的副作用。
  consumeKeyword(P, 'fi', kids)
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'if_statement', ifKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'if_statement', ifKw.startIndex, last.endIndex, kids)
}

// parseWhile 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseWhile(P: ParseState, kwTok: Token): TsNode {
  // kw保存`leaf`，供共享工具后续处理使用。
  const kw = leaf(P, kwTok.value, kwTok)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [kw]
  // cond解析`parseStatements`，供共享工具后续处理使用。
  const cond = parseStatements(P, null)
  // kids 集合追加新条目，保持收集顺序与输入顺序一致。
  kids.push(...cond)
  // dg解析`parseDoGroup`，供共享工具后续处理使用。
  const dg = parseDoGroup(P)
  // 满足 `dg) kids.push(dg` 时，共享工具执行该分支。
  if (dg) kids.push(dg)
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'while_statement', kw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'while_statement', kw.startIndex, last.endIndex, kids)
}

// parseFor 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseFor(P: ParseState, forTok: Token): TsNode {
  // forKw保存`leaf`，供共享工具后续处理使用。
  const forKw = leaf(P, forTok.value, forTok)
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // C-style for (( ; ; )) — only for `for`, not `select`
  // 当 `forTok.value` 匹配 `'for' && peek(P.L) === '(' ...` 时，共享工具执行对应分支。
  if (forTok.value === 'for' && peek(P.L) === '(' && peek(P.L, 1) === '(') {
    // oStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
    const oStart = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '((', oStart, P.L.b, [])
    // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const kids: TsNode[] = [forKw, open]
    // init; cond; update — all three use 'assign' mode so `c = expr` emits
    // variable_assignment, while bare idents (c in `c<=5`) → word. Each
    // clause may be a comma-separated list.
    // 按索引扫描 `3`，需要消费相邻参数时可以精确移动游标。
    for (let k = 0; k < 3; k++) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // es 集合解析`parseArithCommaList`，供共享工具后续处理使用。
      const es = parseArithCommaList(P, k < 2 ? ';' : '))', 'assign')
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(...es)
      // 满足 `k < 2` 时，共享工具执行该分支。
      if (k < 2) {
        // 当 `peek(P.L)` 匹配 `';'` 时，共享工具执行对应分支。
        if (peek(P.L) === ';') {
          // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
          const s = P.L.b
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // kids 集合追加新条目，保持收集顺序与输入顺序一致。
          kids.push(mk(P, ';', s, P.L.b, []))
        }
      }
    }
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `peek(P.L)` 匹配 `')' && peek(P.L, 1) === ')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')' && peek(P.L, 1) === ')') {
      // cStart保存`P.L.b`，供后续判断或组装使用。
      const cStart = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(mk(P, '))', cStart, P.L.b, []))
    }
    // Optional ; or newline
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // sep保存`nextToken`，供共享工具后续处理使用。
    const sep = nextToken(P.L, 'cmd')
    // 当 `sep.type` 匹配 `'OP' && sep.value === ';'` 时，共享工具执行对应分支。
    if (sep.type === 'OP' && sep.value === ';') {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(leaf(P, ';', sep))
    // 共享工具 bash Parser在这里处理 `} else if (sep.type !== 'NEWLINE') {`，完成这一小步状态转换。
    } else if (sep.type !== 'NEWLINE') {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
    }
    // dg解析`parseDoGroup`，供共享工具后续处理使用。
    const dg = parseDoGroup(P)
    // 满足 `dg` 时，共享工具执行该分支。
    if (dg) {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(dg)
    } else {
      // C-style for can also use `{ ... }` body instead of `do ... done`
      // 调用 skipNewlines，触发共享工具此处需要的副作用。
      skipNewlines(P)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // 当 `peek(P.L)` 匹配 `'{'` 时，共享工具执行对应分支。
      if (peek(P.L) === '{') {
        // bOpen保存`P.L.b`，供后续判断或组装使用。
        const bOpen = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // brace保存`mk`，供共享工具后续处理使用。
        const brace = mk(P, '{', bOpen, P.L.b, [])
        // 请求体解析`parseStatements`，供共享工具后续处理使用。
        const body = parseStatements(P, '}')
        // bClose 先占位，稍后的条件分支会根据实际输入补齐它。
        let bClose: TsNode
        // 当 `peek(P.L)` 匹配 `'}'` 时，共享工具执行对应分支。
        if (peek(P.L) === '}') {
          // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
          const cs = P.L.b
          // 调用 advance，触发共享工具此处需要的副作用。
          advance(P.L)
          // bClose更新为 `mk(P, '}', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
          bClose = mk(P, '}', cs, P.L.b, [])
        } else {
          // bClose更新为 `mk(P, '}', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
          bClose = mk(P, '}', P.L.b, P.L.b, [])
        }
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(
          mk(P, 'compound_statement', brace.startIndex, bClose.endIndex, [
            brace,
            ...body,
            bClose,
          ]),
        )
      }
    }
    // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
    const last = kids[kids.length - 1]!
    // 返回 `mk(P, 'c_style_for_statement', forKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'c_style_for_statement', forKw.startIndex, last.endIndex, kids)
  }
  // Regular for VAR in words; do ... done
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [forKw]
  // varTok保存`nextToken`，供共享工具后续处理使用。
  const varTok = nextToken(P.L, 'arg')
  // kids 集合追加新条目，保持收集顺序与输入顺序一致。
  kids.push(mk(P, 'variable_name', varTok.start, varTok.end, []))
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // inTok保存`nextToken`，供共享工具后续处理使用。
  const inTok = nextToken(P.L, 'arg')
  // 当 `inTok.type` 匹配 `'WORD' && inTok.value === '...` 时，共享工具执行对应分支。
  if (inTok.type === 'WORD' && inTok.value === 'in') {
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, 'in', inTok))
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // c保存`peek`，供共享工具后续处理使用。
      const c = peek(P.L)
      // 当 `c` 匹配 `';' || c === '\n' || c === ...` 时，共享工具执行对应分支。
      if (c === ';' || c === '\n' || c === '') break
      // w解析`parseWord`，供共享工具后续处理使用。
      const w = parseWord(P, 'arg')
      // w缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!w) break
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(w)
    }
  } else {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
  }
  // Separator
  // save2保存`saveLex`，供共享工具后续处理使用。
  const save2 = saveLex(P.L)
  // sep保存`nextToken`，供共享工具后续处理使用。
  const sep = nextToken(P.L, 'cmd')
  // 当 `sep.type` 匹配 `'OP' && sep.value === ';'` 时，共享工具执行对应分支。
  if (sep.type === 'OP' && sep.value === ';') {
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, ';', sep))
  // 共享工具 bash Parser在这里处理 `} else if (sep.type !== 'NEWLINE') {`，完成这一小步状态转换。
  } else if (sep.type !== 'NEWLINE') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save2)
  }
  // dg解析`parseDoGroup`，供共享工具后续处理使用。
  const dg = parseDoGroup(P)
  // 满足 `dg) kids.push(dg` 时，共享工具执行该分支。
  if (dg) kids.push(dg)
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'for_statement', forKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'for_statement', forKw.startIndex, last.endIndex, kids)
}

// parseDoGroup 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseDoGroup(P: ParseState): TsNode | null {
  // 调用 skipNewlines，触发共享工具此处需要的副作用。
  skipNewlines(P)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // doTok保存`nextToken`，供共享工具后续处理使用。
  const doTok = nextToken(P.L, 'cmd')
  // `doTok.type` 与 `'WORD' || doTok.value !== 'do'` 不一致时刷新派生状态，避免使用过期结果。
  if (doTok.type !== 'WORD' || doTok.value !== 'do') {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // doKw保存`leaf`，供共享工具后续处理使用。
  const doKw = leaf(P, 'do', doTok)
  // 请求体解析`parseStatements`，供共享工具后续处理使用。
  const body = parseStatements(P, null)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [doKw, ...body]
  // 调用 consumeKeyword，触发共享工具此处需要的副作用。
  consumeKeyword(P, 'done', kids)
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'do_group', doKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'do_group', doKw.startIndex, last.endIndex, kids)
}

// parseCase 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCase(P: ParseState, caseTok: Token): TsNode {
  // caseKw保存`leaf`，供共享工具后续处理使用。
  const caseKw = leaf(P, 'case', caseTok)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [caseKw]
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // word解析`parseWord`，供共享工具后续处理使用。
  const word = parseWord(P, 'arg')
  // 满足 `word) kids.push(word` 时，共享工具执行该分支。
  if (word) kids.push(word)
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 调用 consumeKeyword，触发共享工具此处需要的副作用。
  consumeKeyword(P, 'in', kids)
  // 调用 skipNewlines，触发共享工具此处需要的副作用。
  skipNewlines(P)
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 调用 skipNewlines，触发共享工具此处需要的副作用。
    skipNewlines(P)
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // t保存`nextToken`，供共享工具后续处理使用。
    const t = nextToken(P.L, 'arg')
    // 当 `t.type` 匹配 `'WORD' && t.value === 'esac'` 时，共享工具执行对应分支。
    if (t.type === 'WORD' && t.value === 'esac') {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(leaf(P, 'esac', t))
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 当 `t.type` 匹配 `'EOF'` 时，共享工具执行对应分支。
    if (t.type === 'EOF') break
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // item解析`parseCaseItem`，供共享工具后续处理使用。
    const item = parseCaseItem(P)
    // item缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!item) break
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(item)
  }
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'case_statement', caseKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'case_statement', caseKw.startIndex, last.endIndex, kids)
}

// parseCaseItem 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCaseItem(P: ParseState): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // kids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const kids: TsNode[] = []
  // Optional leading '(' before pattern — bash allows (pattern) syntax
  // 当 `peek(P.L)` 匹配 `'('` 时，共享工具执行对应分支。
  if (peek(P.L) === '(') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(mk(P, '(', s, P.L.b, []))
  }
  // Pattern(s)
  // isFirstAlt标记共享工具 bash Parser是否启用对应路径。
  let isFirstAlt = true
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 当 `c` 匹配 `')' || c === ''` 时，共享工具执行对应分支。
    if (c === ')' || c === '') break
    // pats 集合解析`parseCasePattern`，供共享工具后续处理使用。
    const pats = parseCasePattern(P)
    // pats 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (pats.length === 0) break
    // tree-sitter quirk: first alternative with quotes is inlined as flat
    // siblings; subsequent alternatives are wrapped in (concatenation) with
    // `word` instead of `extglob_pattern` for bare segments.
    // 只有 `!isFirstAlt && pats.length > 1` 满足时，共享工具才执行该分支。
    if (!isFirstAlt && pats.length > 1) {
      // rewritten派生`pats.map`，供共享工具后续处理使用。
      const rewritten = pats.map(p =>
        p.type === 'extglob_pattern'
          ? mk(P, 'word', p.startIndex, p.endIndex, [])
          : p,
      )
      // first 命名 `rewritten[0]!`，让后续代码直接表达这个值的用途。
      const first = rewritten[0]!
      // last记录 `rewritten[rewritten.length - 1]!` 是否成立，下一步按该结果分支。
      const last = rewritten[rewritten.length - 1]!
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(
        mk(P, 'concatenation', first.startIndex, last.endIndex, rewritten),
      )
    } else {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(...pats)
    }
    // isFirstAlt更新为 `false`，确保Bash 解析工具后续读取最新状态。
    isFirstAlt = false
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // \<newline> line continuation between alternatives
    // 当 `peek(P.L)` 匹配 `'\\' && peek(P.L, 1) === '\...` 时，共享工具执行对应分支。
    if (peek(P.L) === '\\' && peek(P.L, 1) === '\n') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
    }
    // 当 `peek(P.L)` 匹配 `'|'` 时，共享工具执行对应分支。
    if (peek(P.L) === '|') {
      // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const s = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(mk(P, '|', s, P.L.b, []))
      // \<newline> after | is also a line continuation
      // 当 `peek(P.L)` 匹配 `'\\' && peek(P.L, 1) === '\...` 时，共享工具执行对应分支。
      if (peek(P.L) === '\\' && peek(P.L, 1) === '\n') {
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
  if (peek(P.L) === ')') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(mk(P, ')', s, P.L.b, []))
  }
  // 请求体解析`parseStatements`，供共享工具后续处理使用。
  const body = parseStatements(P, null)
  // kids 集合追加新条目，保持收集顺序与输入顺序一致。
  kids.push(...body)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // term保存`nextToken`，供共享工具后续处理使用。
  const term = nextToken(P.L, 'cmd')
  // 共享工具在这里按实际状态进入对应分支。
  if (
    term.type === 'OP' &&
    (term.value === ';;' || term.value === ';&' || term.value === ';;&')
  ) {
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, term.value, term))
  } else {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
  }
  // kids 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (kids.length === 0) return null
  // tree-sitter quirk: case_item with EMPTY body and a single pattern matching
  // extglob-operator-char-prefix (no actual glob metachars) downgrades to word.
  // `-o) owner=$2 ;;` (has body) → extglob_pattern; `-g) ;;` (empty) → word.
  // 请求体为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (body.length === 0) {
    // 按索引扫描 `kids.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < kids.length; i++) {
      // k保存`kids[i]!`，供共享工具 bash Parser后续判断或输出使用。
      const k = kids[i]!
      // `k.type` 与 `'extglob_pattern'` 不一致时刷新派生状态，避免使用过期结果。
      if (k.type !== 'extglob_pattern') continue
      // 文本格式化`sliceBytes`，供共享工具后续处理使用。
      const text = sliceBytes(P, k.startIndex, k.endIndex)
      // 只有 `/^[-+?*@!][a-zA-Z]/.test(text) && !/[*?(]/.test(text)` 满足时，共享工具才执行该分支。
      if (/^[-+?*@!][a-zA-Z]/.test(text) && !/[*?(]/.test(text)) {
        // kids[i更新为 `mk(P, 'word', k.startIndex, k.endIndex, [])`，确保共享工具 bash Parser后续读取最新状态。
        kids[i] = mk(P, 'word', k.startIndex, k.endIndex, [])
      }
    }
  }
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'case_item', start, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'case_item', start, last.endIndex, kids)
}

// parseCasePattern 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCasePattern(P: ParseState): TsNode[] {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // startI 命名 `P.L.i`，让后续代码直接表达这个值的用途。
  const startI = P.L.i
  // parenDepth 命名 `0`，让后续代码直接表达这个值的用途。
  let parenDepth = 0
  // hasDollar标记共享工具 bash Parser是否启用对应路径。
  let hasDollar = false
  // hasBracketOutsideParen标记共享工具 bash Parser是否启用对应路径。
  let hasBracketOutsideParen = false
  // hasQuote标记共享工具 bash Parser是否启用对应路径。
  let hasQuote = false
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // Escaped char — consume both (handles `bar\ baz` as single pattern)
      // \<newline> is a line continuation; eat it but stay in pattern.
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'"' || c === "'"` 时，共享工具执行对应分支。
    if (c === '"' || c === "'") {
      // hasQuote更新为 `true`，确保Bash 解析工具后续读取最新状态。
      hasQuote = true
      // Skip past the quoted segment so its content (spaces, |, etc.) doesn't
      // break the peek-ahead scan.
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 P.L.i < P.L.len && peek(P.L) !== c 成立，就持续推进共享工具中的循环处理。
      while (P.L.i < P.L.len && peek(P.L) !== c) {
        // 只有 `peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L` 满足时，共享工具才执行该分支。
        if (peek(P.L) === '\\' && P.L.i + 1 < P.L.len) advance(P.L)
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
      }
      // 满足 `peek(P.L) === c) advance(P.L` 时，共享工具执行该分支。
      if (peek(P.L) === c) advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Paren counting: any ( inside pattern opens a scope; don't break at ) or |
    // until balanced. Handles extglob *(a|b) and nested shapes *([0-9])([0-9]).
    // 当 `c` 匹配 `'('` 时，共享工具执行对应分支。
    if (c === '(') {
      // 共享工具 bash Parser在这里处理 `parenDepth++`，完成这一小步状态转换。
      parenDepth++
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `parenDepth > 0` 时，共享工具执行该分支。
    if (parenDepth > 0) {
      // 当 `c` 匹配 `')'` 时，共享工具执行对应分支。
      if (c === ')') {
        // 共享工具 bash Parser在这里处理 `parenDepth--`，完成这一小步状态转换。
        parenDepth--
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
      if (c === '\n') break
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `')' || c === '|' || c === '...` 时，共享工具执行对应分支。
    if (c === ')' || c === '|' || c === ' ' || c === '\t' || c === '\n') break
    // 当 `c` 匹配 `'$'` 时，共享工具执行对应分支。
    if (c === '$') hasDollar = true
    // 当 `c` 匹配 `'['` 时，共享工具执行对应分支。
    if (c === '[') hasBracketOutsideParen = true
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 满足 `P.L.b === start` 时，共享工具执行该分支。
  if (P.L.b === start) return []
  // 文本格式化`src.slice`，供共享工具后续处理使用。
  const text = P.src.slice(startI, P.L.i)
  // hasExtglobParen记录 `test` 是否成立，共享工具随后按该结果分支。
  const hasExtglobParen = /[*?+@!]\(/.test(text)
  // Quoted segments in pattern: tree-sitter splits at quote boundaries into
  // multiple sibling nodes. `*"foo"*` → (extglob_pattern)(string)(extglob_pattern).
  // Re-scan with a segmenting pass.
  // 只有 `hasQuote && !hasExtglobParen` 满足时，共享工具才执行该分支。
  if (hasQuote && !hasExtglobParen) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // 返回 `parseCasePatternSegmented(P)`，作为共享工具这次计算的结果。
    return parseCasePatternSegmented(P)
  }
  // tree-sitter splits patterns with [ or $ into concatenation via word parsing
  // UNLESS pattern has extglob parens (those override and emit extglob_pattern).
  // `*.[1357]` → concat(word word number word); `${PN}.pot` → concat(expansion word);
  // but `*([0-9])` → extglob_pattern (has extglob paren).
  // 只有 `!hasExtglobParen && (hasDollar || hasBracketOutsideParen)` 满足时，共享工具才执行该分支。
  if (!hasExtglobParen && (hasDollar || hasBracketOutsideParen)) {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
    // w解析`parseWord`，供共享工具后续处理使用。
    const w = parseWord(P, 'arg')
    // 返回 `w ? [w] : []`，作为共享工具这次计算的结果。
    return w ? [w] : []
  }
  // Patterns starting with extglob operator chars (+ - ? * @ !) followed by
  // identifier chars are extglob_pattern per tree-sitter, even without parens
  // or glob metachars. `-o)` → extglob_pattern; plain `foo)` → word.
  // type 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const type =
    hasExtglobParen || /[*?]/.test(text) || /^[-+?*@!][a-zA-Z]/.test(text)
      ? 'extglob_pattern'
      : 'word'
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [mk(P, type, start, P.L.b, [])]
}

// Segmented scan for case patterns containing quotes: `*"foo"*` →
// [extglob_pattern, string, extglob_pattern]. Bare segments → extglob_pattern
// if they have */?, else word. Stops at ) | space tab newline outside quotes.
// parseCasePatternSegmented 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseCasePatternSegmented(P: ParseState): TsNode[] {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: TsNode[] = []
  // segStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  let segStart = P.L.b
  // segStartI 命名 `P.L.i`，让后续代码直接表达这个值的用途。
  let segStartI = P.L.i
  // flushSeg封装成回调，供共享工具 bash Parser在事件触发或异步步骤中调用。
  const flushSeg = (): void => {
    // 满足 `P.L.i > segStartI` 时，共享工具执行该分支。
    if (P.L.i > segStartI) {
      // t格式化`src.slice`，供共享工具后续处理使用。
      const t = P.src.slice(segStartI, P.L.i)
      // type保存`test`，供共享工具后续处理使用。
      const type = /[*?]/.test(t) ? 'extglob_pattern' : 'word'
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, type, segStart, P.L.b, []))
    }
  }
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(parseDoubleQuoted(P))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // segStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      segStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c === "'") {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // tok保存`nextToken`，供共享工具后续处理使用。
      const tok = nextToken(P.L, 'arg')
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(leaf(P, 'raw_string', tok))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // segStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      segStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `')' || c === '|' || c === '...` 时，共享工具执行对应分支。
    if (c === ')' || c === '|' || c === ' ' || c === '\t' || c === '\n') break
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 调用 flushSeg，触发共享工具此处需要的副作用。
  flushSeg()
  // 返回 `parts`，作为共享工具这次计算的结果。
  return parts
}

// parseFunction 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseFunction(P: ParseState, fnTok: Token): TsNode {
  // fnKw保存`leaf`，供共享工具后续处理使用。
  const fnKw = leaf(P, 'function', fnTok)
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // nameTok保存`nextToken`，供共享工具后续处理使用。
  const nameTok = nextToken(P.L, 'arg')
  // 名称保存`mk`，供共享工具后续处理使用。
  const name = mk(P, 'word', nameTok.start, nameTok.end, [])
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [fnKw, name]
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 当 `peek(P.L)` 匹配 `'(' && peek(P.L, 1) === ')'` 时，共享工具执行对应分支。
  if (peek(P.L) === '(' && peek(P.L, 1) === ')') {
    // o保存`nextToken`，供共享工具后续处理使用。
    const o = nextToken(P.L, 'cmd')
    // c保存`nextToken`，供共享工具后续处理使用。
    const c = nextToken(P.L, 'cmd')
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, '(', o))
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, ')', c))
  }
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 调用 skipNewlines，触发共享工具此处需要的副作用。
  skipNewlines(P)
  // 请求体解析`parseCommand`，供共享工具后续处理使用。
  const body = parseCommand(P)
  // 满足 `body` 时，共享工具执行该分支。
  if (body) {
    // Hoist redirects from redirected_statement(compound_statement, ...) to
    // function_definition level per tree-sitter grammar
    // 共享工具在这里按实际状态进入对应分支。
    if (
      body.type === 'redirected_statement' &&
      body.children.length >= 2 &&
      body.children[0]!.type === 'compound_statement'
    ) {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(...body.children)
    } else {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(body)
    }
  }
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'function_definition', fnKw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'function_definition', fnKw.startIndex, last.endIndex, kids)
}

// parseDeclaration 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseDeclaration(P: ParseState, kwTok: Token): TsNode {
  // kw保存`leaf`，供共享工具后续处理使用。
  const kw = leaf(P, kwTok.value, kwTok)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [kw]
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      c === '' ||
      c === '\n' ||
      c === ';' ||
      c === '&' ||
      c === '|' ||
      c === ')' ||
      c === '<' ||
      c === '>'
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // a保存`tryParseAssignment`，供共享工具后续处理使用。
    const a = tryParseAssignment(P)
    // 满足 `a` 时，共享工具执行该分支。
    if (a) {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(a)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Quoted string or concatenation: `export "FOO=bar"`, `export 'X'`
    // 当 `c` 匹配 `'"' || c === "'" || c === '` 时，共享工具执行对应分支。
    if (c === '"' || c === "'" || c === '$') {
      // w解析`parseWord`，供共享工具后续处理使用。
      const w = parseWord(P, 'arg')
      // 满足 `w` 时，共享工具执行该分支。
      if (w) {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(w)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // Flag like -a or bare variable name
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // tok保存`nextToken`，供共享工具后续处理使用。
    const tok = nextToken(P.L, 'arg')
    // 当 `tok.type` 匹配 `'WORD' || tok.type === 'NUM...` 时，共享工具执行对应分支。
    if (tok.type === 'WORD' || tok.type === 'NUMBER') {
      // 满足 `tok.value.startsWith('-')` 时，共享工具执行该分支。
      if (tok.value.startsWith('-')) {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(leaf(P, 'word', tok))
      // 共享工具 bash Parser在这里处理 `} else if (isIdentStart(tok.value[0] ?? '')) {`，完成这一小步状态转换。
      } else if (isIdentStart(tok.value[0] ?? '')) {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(mk(P, 'variable_name', tok.start, tok.end, []))
      } else {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(leaf(P, 'word', tok))
      }
    } else {
      // 调用 restoreLex，触发共享工具此处需要的副作用。
      restoreLex(P.L, save)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'declaration_command', kw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'declaration_command', kw.startIndex, last.endIndex, kids)
}

// parseUnset 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseUnset(P: ParseState, kwTok: Token): TsNode {
  // kw保存`leaf`，供共享工具后续处理使用。
  const kw = leaf(P, 'unset', kwTok)
  // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const kids: TsNode[] = [kw]
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      c === '' ||
      c === '\n' ||
      c === ';' ||
      c === '&' ||
      c === '|' ||
      c === ')' ||
      c === '<' ||
      c === '>'
    ) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // SECURITY: use parseWord (not raw nextToken) so quoted strings like
    // `unset 'a[$(id)]'` emit a raw_string child that ast.ts can reject.
    // Previously `break` silently dropped non-WORD args — hiding the
    // arithmetic-subscript code-exec vector from the security walker.
    // 当前参数解析`parseWord`，供共享工具后续处理使用。
    const arg = parseWord(P, 'arg')
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) break
    // 当 `arg.type` 匹配 `'word'` 时，共享工具执行对应分支。
    if (arg.type === 'word') {
      // 满足 `arg.text.startsWith('-')` 时，共享工具执行该分支。
      if (arg.text.startsWith('-')) {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(arg)
      } else {
        // kids 集合追加新条目，保持收集顺序与输入顺序一致。
        kids.push(mk(P, 'variable_name', arg.startIndex, arg.endIndex, []))
      }
    } else {
      // kids 集合追加新条目，保持收集顺序与输入顺序一致。
      kids.push(arg)
    }
  }
  // last记录 `kids[kids.length - 1]!` 是否成立，下一步按该结果分支。
  const last = kids[kids.length - 1]!
  // 返回 `mk(P, 'unset_command', kw.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
  return mk(P, 'unset_command', kw.startIndex, last.endIndex, kids)
}

// consumeKeyword 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function consumeKeyword(P: ParseState, name: string, kids: TsNode[]): void {
  // 调用 skipNewlines，触发共享工具此处需要的副作用。
  skipNewlines(P)
  // save保存`saveLex`，供共享工具后续处理使用。
  const save = saveLex(P.L)
  // t保存`nextToken`，供共享工具后续处理使用。
  const t = nextToken(P.L, 'cmd')
  // 只有 `t.type === 'WORD' && t.value === name` 满足时，共享工具才执行该分支。
  if (t.type === 'WORD' && t.value === name) {
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(leaf(P, name, t))
  } else {
    // 调用 restoreLex，触发共享工具此处需要的副作用。
    restoreLex(P.L, save)
  }
}

// ───────────────────── Test & Arithmetic Expressions ─────────────────────

// parseTestExpr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestExpr(P: ParseState, closer: string): TsNode | null {
  // 返回 `parseTestOr(P, closer)`，作为共享工具这次计算的结果。
  return parseTestOr(P, closer)
}

// parseTestOr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestOr(P: ParseState, closer: string): TsNode | null {
  // left解析`parseTestAnd`，供共享工具后续处理使用。
  let left = parseTestAnd(P, closer)
  // left缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!left) return null
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // save保存`saveLex`，供共享工具后续处理使用。
    const save = saveLex(P.L)
    // 当 `peek(P.L)` 匹配 `'|' && peek(P.L, 1) === '|'` 时，共享工具执行对应分支。
    if (peek(P.L) === '|' && peek(P.L, 1) === '|') {
      // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const s = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // op保存`mk`，供共享工具后续处理使用。
      const op = mk(P, '||', s, P.L.b, [])
      // right解析`parseTestAnd`，供共享工具后续处理使用。
      const right = parseTestAnd(P, closer)
      // right缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!right) {
        // 调用 restoreLex，触发共享工具此处需要的副作用。
        restoreLex(P.L, save)
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // left更新为 `mk(P, 'binary_expression', left.startIndex, right.endInde...`，确保Bash 解析工具后续读取最新状态。
      left = mk(P, 'binary_expression', left.startIndex, right.endIndex, [
        left,
        op,
        right,
      ])
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 返回 `left`，作为共享工具这次计算的结果。
  return left
}

// parseTestAnd 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestAnd(P: ParseState, closer: string): TsNode | null {
  // left解析`parseTestUnary`，供共享工具后续处理使用。
  let left = parseTestUnary(P, closer)
  // left缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!left) return null
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当 `peek(P.L)` 匹配 `'&' && peek(P.L, 1) === '&'` 时，共享工具执行对应分支。
    if (peek(P.L) === '&' && peek(P.L, 1) === '&') {
      // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const s = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // op保存`mk`，供共享工具后续处理使用。
      const op = mk(P, '&&', s, P.L.b, [])
      // right解析`parseTestUnary`，供共享工具后续处理使用。
      const right = parseTestUnary(P, closer)
      // right缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!right) break
      // left更新为 `mk(P, 'binary_expression', left.startIndex, right.endInde...`，确保Bash 解析工具后续读取最新状态。
      left = mk(P, 'binary_expression', left.startIndex, right.endIndex, [
        left,
        op,
        right,
      ])
    } else {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 返回 `left`，作为共享工具这次计算的结果。
  return left
}

// parseTestUnary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestUnary(P: ParseState, closer: string): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // 当 `c` 匹配 `'('` 时，共享工具执行对应分支。
  if (c === '(') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '(', s, P.L.b, [])
    // inner解析`parseTestOr`，供共享工具后续处理使用。
    const inner = parseTestOr(P, closer)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')') {
      // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const cs = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, ')', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', cs, P.L.b, [])
    } else {
      // close更新为 `mk(P, ')', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', P.L.b, P.L.b, [])
    }
    // kids 集合 命名 `inner ? [open, inner, close] : [open, close]`，让后续代码直接表达这个值的用途。
    const kids = inner ? [open, inner, close] : [open, close]
    // 返回 `mk(`，作为共享工具这次计算的结果。
    return mk(
      P,
      'parenthesized_expression',
      open.startIndex,
      close.endIndex,
      kids,
    )
  }
  // 返回 `parseTestBinary(P, closer)`，作为共享工具这次计算的结果。
  return parseTestBinary(P, closer)
}

/**
 * Parse `!`-negated or test-operator (`-f`) or parenthesized primary — but NOT
 * a binary comparison. Used as LHS of binary_expression so `! x =~ y` binds
 * `!` to `x` only, not the whole `x =~ y`.
 */
// parseTestNegatablePrimary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestNegatablePrimary(
  P: ParseState,
  closer: string,
): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // 当 `c` 匹配 `'!'` 时，共享工具执行对应分支。
  if (c === '!') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // bang保存`mk`，供共享工具后续处理使用。
    const bang = mk(P, '!', s, P.L.b, [])
    // inner解析`parseTestNegatablePrimary`，供共享工具后续处理使用。
    const inner = parseTestNegatablePrimary(P, closer)
    // inner缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inner) return bang
    // 返回 `mk(P, 'unary_expression', bang.startIndex, inner.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'unary_expression', bang.startIndex, inner.endIndex, [
      bang,
      inner,
    ])
  }
  // 只有 `c === '-' && isIdentStart(peek(P.L, 1))` 满足时，共享工具才执行该分支。
  if (c === '-' && isIdentStart(peek(P.L, 1))) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // op保存`mk`，供共享工具后续处理使用。
    const op = mk(P, 'test_operator', s, P.L.b, [])
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 当前参数解析`parseTestPrimary`，供共享工具后续处理使用。
    const arg = parseTestPrimary(P, closer)
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) return op
    // 返回 `mk(P, 'unary_expression', op.startIndex, arg.endIndex, [op, arg])`，作为共享工具这次计算的结果。
    return mk(P, 'unary_expression', op.startIndex, arg.endIndex, [op, arg])
  }
  // 返回 `parseTestPrimary(P, closer)`，作为共享工具这次计算的结果。
  return parseTestPrimary(P, closer)
}

// parseTestBinary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestBinary(P: ParseState, closer: string): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // `!` in test context binds tighter than =~/==.
  // `[[ ! "x" =~ y ]]` → (binary_expression (unary_expression (string)) (regex))
  // `[[ ! -f x ]]` → (unary_expression ! (unary_expression (test_operator) (word)))
  // left解析`parseTestNegatablePrimary`，供共享工具后续处理使用。
  const left = parseTestNegatablePrimary(P, closer)
  // left缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!left) return null
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // Binary comparison: == != =~ -eq -lt etc.
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // op初始化为空值，后续分支会在有数据时补齐。
  let op: TsNode | null = null
  // os 集合保存`P.L.b`，供后续判断或组装使用。
  const os = P.L.b
  // 当 `c` 匹配 `'=' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '=' && c1 === '=') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '==', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '==', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '!' && c1 === '=') {`，完成这一小步状态转换。
  } else if (c === '!' && c1 === '=') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '!=', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '!=', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '=' && c1 === '~') {`，完成这一小步状态转换。
  } else if (c === '=' && c1 === '~') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '=~', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '=~', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '=' && c1 !== '=') {`，完成这一小步状态转换。
  } else if (c === '=' && c1 !== '=') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '=', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '=', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '<' && c1 !== '<') {`，完成这一小步状态转换。
  } else if (c === '<' && c1 !== '<') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '<', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '<', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '>' && c1 !== '>') {`，完成这一小步状态转换。
  } else if (c === '>' && c1 !== '>') {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op更新为 `mk(P, '>', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, '>', os, P.L.b, [])
  // 共享工具 bash Parser在这里处理 `} else if (c === '-' && isIdentStart(c1)) {`，完成这一小步状态转换。
  } else if (c === '-' && isIdentStart(c1)) {
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // op更新为 `mk(P, 'test_operator', os, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
    op = mk(P, 'test_operator', os, P.L.b, [])
  }
  // op缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!op) return left
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // In [[ ]], RHS of ==/!=/=/=~ gets special pattern parsing: paren counting
  // so @(a|b|c) doesn't break on |, and segments become extglob_pattern/regex.
  // 当 `closer` 匹配 `']]'` 时，共享工具执行对应分支。
  if (closer === ']]') {
    // opText保存`op.type`，供共享工具 bash Parser后续判断或输出使用。
    const opText = op.type
    // 当 `opText` 匹配 `'=~'` 时，共享工具执行对应分支。
    if (opText === '=~') {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // If the ENTIRE RHS is a quoted string, emit string/raw_string not
      // regex: `[[ "$x" =~ "$y" ]]` → (binary_expression (string) (string)).
      // If there's content after the quote (`' boop '(.*)$`), the whole RHS
      // stays a single (regex). Peek past the quote to check.
      // rc保存`peek`，供共享工具后续处理使用。
      const rc = peek(P.L)
      // rhs 集合保存`null`，作为后续空值处理的输入。
      let rhs: TsNode | null = null
      // 当 `rc` 匹配 `'"' || rc === "'"` 时，共享工具执行对应分支。
      if (rc === '"' || rc === "'") {
        // save保存`saveLex`，供共享工具后续处理使用。
        const save = saveLex(P.L)
        // quoted 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const quoted =
          rc === '"'
            ? parseDoubleQuoted(P)
            : leaf(P, 'raw_string', nextToken(P.L, 'arg'))
        // Check if RHS ends here: only whitespace then ]] or &&/|| or newline
        // j保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
        let j = P.L.i
        // 只要 j < P.L.len && (P.src[j] === ' ' || P.src[j] === '\t') 成立，就持续推进共享工具中的循环处理。
        while (j < P.L.len && (P.src[j] === ' ' || P.src[j] === '\t')) j++
        // nc读取 `P.src[j] ?? ''` 对应条目，后续围绕该成员继续处理。
        const nc = P.src[j] ?? ''
        // nc1 命名 `P.src[j + 1] ?? ''`，让后续代码直接表达这个值的用途。
        const nc1 = P.src[j + 1] ?? ''
        // 共享工具在这里按实际状态进入对应分支。
        if (
          (nc === ']' && nc1 === ']') ||
          (nc === '&' && nc1 === '&') ||
          (nc === '|' && nc1 === '|') ||
          nc === '\n' ||
          nc === ''
        ) {
          // rhs 集合更新为 `quoted`，确保Bash 解析工具后续读取最新状态。
          rhs = quoted
        } else {
          // 调用 restoreLex，触发共享工具此处需要的副作用。
          restoreLex(P.L, save)
        }
      }
      // 满足 `!rhs) rhs = parseTestRegexRhs(P` 时，共享工具执行该分支。
      if (!rhs) rhs = parseTestRegexRhs(P)
      // rhs 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!rhs) return left
      // 返回 `mk(P, 'binary_expression', left.startIndex, rhs.endIndex, [`，作为共享工具这次计算的结果。
      return mk(P, 'binary_expression', left.startIndex, rhs.endIndex, [
        left,
        op,
        rhs,
      ])
    }
    // Single `=` emits (regex) per tree-sitter; `==` and `!=` emit extglob_pattern
    // 当 `opText` 匹配 `'='` 时，共享工具执行对应分支。
    if (opText === '=') {
      // rhs 集合匹配`parseTestRegexRhs`，供共享工具后续处理使用。
      const rhs = parseTestRegexRhs(P)
      // rhs 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!rhs) return left
      // 返回 `mk(P, 'binary_expression', left.startIndex, rhs.endIndex, [`，作为共享工具这次计算的结果。
      return mk(P, 'binary_expression', left.startIndex, rhs.endIndex, [
        left,
        op,
        rhs,
      ])
    }
    // 当 `opText` 匹配 `'==' || opText === '!='` 时，共享工具执行对应分支。
    if (opText === '==' || opText === '!=') {
      // 片段列表解析`parseTestExtglobRhs`，供共享工具后续处理使用。
      const parts = parseTestExtglobRhs(P)
      // 片段列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (parts.length === 0) return left
      // last 命名 `parts[parts.length - 1]!`，让后续代码直接表达这个值的用途。
      const last = parts[parts.length - 1]!
      // 返回 `mk(P, 'binary_expression', left.startIndex, last.endIndex, [`，作为共享工具这次计算的结果。
      return mk(P, 'binary_expression', left.startIndex, last.endIndex, [
        left,
        op,
        ...parts,
      ])
    }
  }
  // right解析`parseTestPrimary`，供共享工具后续处理使用。
  const right = parseTestPrimary(P, closer)
  // right缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!right) return left
  // 返回 `mk(P, 'binary_expression', left.startIndex, right.endIndex, [`，作为共享工具这次计算的结果。
  return mk(P, 'binary_expression', left.startIndex, right.endIndex, [
    left,
    op,
    right,
  ])
}

// RHS of =~ in [[ ]] — scan as single (regex) node with paren/bracket counting
// so | ( ) inside the regex don't break parsing. Stop at ]] or ws+&&/||.
// parseTestRegexRhs 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestRegexRhs(P: ParseState): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // start保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
  const start = P.L.b
  // parenDepth 命名 `0`，让后续代码直接表达这个值的用途。
  let parenDepth = 0
  // bracketDepth 命名 `0`，让后续代码直接表达这个值的用途。
  let bracketDepth = 0
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (c === '\n') break
    // 只有 `parenDepth === 0 && bracketDepth === 0` 满足时，共享工具才执行该分支。
    if (parenDepth === 0 && bracketDepth === 0) {
      // 当 `c` 匹配 `']' && peek(P.L, 1) === ']'` 时，共享工具执行对应分支。
      if (c === ']' && peek(P.L, 1) === ']') break
      // 当 `c` 匹配 `' ' || c === '\t'` 时，共享工具执行对应分支。
      if (c === ' ' || c === '\t') {
        // Peek past blanks for ]] or &&/||
        // j保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
        let j = P.L.i
        // 只要 j < P.L.len && (P.L.src[j] === ' ' || P.L.src[j] === '\t') 成立，就持续推进共享工具中的循环处理。
        while (j < P.L.len && (P.L.src[j] === ' ' || P.L.src[j] === '\t')) j++
        // nc 命名 `P.L.src[j] ?? ''`，让后续代码直接表达这个值的用途。
        const nc = P.L.src[j] ?? ''
        // nc1 命名 `P.L.src[j + 1] ?? ''`，让后续代码直接表达这个值的用途。
        const nc1 = P.L.src[j + 1] ?? ''
        // 共享工具在这里按实际状态进入对应分支。
        if (
          (nc === ']' && nc1 === ']') ||
          (nc === '&' && nc1 === '&') ||
          (nc === '|' && nc1 === '|')
        ) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 当 `c` 匹配 `'('` 时，共享工具执行对应分支。
    if (c === '(') parenDepth++
    else if (c === ')' && parenDepth > 0) parenDepth--
    else if (c === '[') bracketDepth++
    else if (c === ']' && bracketDepth > 0) bracketDepth--
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 满足 `P.L.b === start` 时，共享工具执行该分支。
  if (P.L.b === start) return null
  // 返回 `mk(P, 'regex', start, P.L.b, [])`，作为共享工具这次计算的结果。
  return mk(P, 'regex', start, P.L.b, [])
}

// RHS of ==/!=/= in [[ ]] — returns array of parts. Bare text → extglob_pattern
// (with paren counting for @(a|b)); $(...)/${}/quoted → proper node types.
// Multiple parts become flat children of binary_expression per tree-sitter.
// parseTestExtglobRhs 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestExtglobRhs(P: ParseState): TsNode[] {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: TsNode[] = []
  // segStart 命名 `P.L.b`，让后续代码直接表达这个值的用途。
  let segStart = P.L.b
  // segStartI 命名 `P.L.i`，让后续代码直接表达这个值的用途。
  let segStartI = P.L.i
  // parenDepth 命名 `0`，让后续代码直接表达这个值的用途。
  let parenDepth = 0
  // flushSeg封装成回调，供共享工具 bash Parser在事件触发或异步步骤中调用。
  const flushSeg = () => {
    // 满足 `P.L.i > segStartI` 时，共享工具执行该分支。
    if (P.L.i > segStartI) {
      // 文本格式化`src.slice`，供共享工具后续处理使用。
      const text = P.src.slice(segStartI, P.L.i)
      // Pure number stays number; everything else is extglob_pattern
      // type保存`test`，供共享工具后续处理使用。
      const type = /^\d+$/.test(text) ? 'number' : 'extglob_pattern'
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(mk(P, type, segStart, P.L.b, []))
    }
  }
  // while 使用 P.L.i < P.L.len 完成共享工具里的对应操作。
  while (P.L.i < P.L.len) {
    // c保存`peek`，供共享工具后续处理使用。
    const c = peek(P.L)
    // 只有 `c === '\\' && P.L.i + 1 < P.L.len` 满足时，共享工具才执行该分支。
    if (c === '\\' && P.L.i + 1 < P.L.len) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (c === '\n') break
    // 满足 `parenDepth === 0` 时，共享工具执行该分支。
    if (parenDepth === 0) {
      // 当 `c` 匹配 `']' && peek(P.L, 1) === ']'` 时，共享工具执行对应分支。
      if (c === ']' && peek(P.L, 1) === ']') break
      // 当 `c` 匹配 `' ' || c === '\t'` 时，共享工具执行对应分支。
      if (c === ' ' || c === '\t') {
        // j保存`P.L.i`，供共享工具 bash Parser后续判断或输出使用。
        let j = P.L.i
        // 只要 j < P.L.len && (P.L.src[j] === ' ' || P.L.src[j] === '\t') 成立，就持续推进共享工具中的循环处理。
        while (j < P.L.len && (P.L.src[j] === ' ' || P.L.src[j] === '\t')) j++
        // nc 命名 `P.L.src[j] ?? ''`，让后续代码直接表达这个值的用途。
        const nc = P.L.src[j] ?? ''
        // nc1 命名 `P.L.src[j + 1] ?? ''`，让后续代码直接表达这个值的用途。
        const nc1 = P.L.src[j + 1] ?? ''
        // 共享工具在这里按实际状态进入对应分支。
        if (
          (nc === ']' && nc1 === ']') ||
          (nc === '&' && nc1 === '&') ||
          (nc === '|' && nc1 === '|')
        ) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // $ " ' must be parsed even inside @( ) extglob parens — parseDollarLike
    // consumes matching ) so parenDepth stays consistent.
    // 满足 `c === '` 时，共享工具执行该分支。
    if (c === '$') {
      // c1保存`peek`，供共享工具后续处理使用。
      const c1 = peek(P.L, 1)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        c1 === '(' ||
        c1 === '{' ||
        isIdentStart(c1) ||
        SPECIAL_VARS.has(c1)
      ) {
        // 调用 flushSeg，触发共享工具此处需要的副作用。
        flushSeg()
        // exp解析`parseDollarLike`，供共享工具后续处理使用。
        const exp = parseDollarLike(P)
        // 满足 `exp) parts.push(exp` 时，共享工具执行该分支。
        if (exp) parts.push(exp)
        // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
        segStart = P.L.b
        // segStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
        segStartI = P.L.i
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }
    // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
    if (c === '"') {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(parseDoubleQuoted(P))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // segStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      segStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `"'"` 时，共享工具执行对应分支。
    if (c === "'") {
      // 调用 flushSeg，触发共享工具此处需要的副作用。
      flushSeg()
      // tok保存`nextToken`，供共享工具后续处理使用。
      const tok = nextToken(P.L, 'arg')
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(leaf(P, 'raw_string', tok))
      // segStart更新为 `P.L.b`，确保Bash 解析工具后续读取最新状态。
      segStart = P.L.b
      // segStartI更新为 `P.L.i`，确保Bash 解析工具后续读取最新状态。
      segStartI = P.L.i
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 当 `c` 匹配 `'('` 时，共享工具执行对应分支。
    if (c === '(') parenDepth++
    else if (c === ')' && parenDepth > 0) parenDepth--
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
  }
  // 调用 flushSeg，触发共享工具此处需要的副作用。
  flushSeg()
  // 返回 `parts`，作为共享工具这次计算的结果。
  return parts
}

// parseTestPrimary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTestPrimary(P: ParseState, closer: string): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // Stop at closer
  // 当 `closer` 匹配 `']' && peek(P.L) === ']'` 时，共享工具执行对应分支。
  if (closer === ']' && peek(P.L) === ']') return null
  // 当 `closer` 匹配 `']]' && peek(P.L) === ']' &...` 时，共享工具执行对应分支。
  if (closer === ']]' && peek(P.L) === ']' && peek(P.L, 1) === ']') return null
  // 返回 `parseWord(P, 'arg')`，作为共享工具这次计算的结果。
  return parseWord(P, 'arg')
}

/**
 * Arithmetic context modes:
 * - 'var': bare identifiers → variable_name (default, used in $((..)), ((..)))
 * - 'word': bare identifiers → word (c-style for head condition/update clauses)
 * - 'assign': identifiers with = → variable_assignment (c-style for init clause)
 */
// ArithMode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ArithMode = 'var' | 'word' | 'assign'

/** Operator precedence table (higher = tighter binding). */
// ARITH_PREC 集中保存共享工具 bash Parser要一起传递的字段。
const ARITH_PREC: Record<string, number> = {
  '=': 2,
  '+=': 2,
  '-=': 2,
  '*=': 2,
  '/=': 2,
  '%=': 2,
  '<<=': 2,
  '>>=': 2,
  '&=': 2,
  '^=': 2,
  '|=': 2,
  '||': 4,
  '&&': 5,
  '|': 6,
  '^': 7,
  '&': 8,
  '==': 9,
  '!=': 9,
  '<': 10,
  '>': 10,
  '<=': 10,
  '>=': 10,
  '<<': 11,
  '>>': 11,
  '+': 12,
  '-': 12,
  '*': 13,
  '/': 13,
  '%': 13,
  '**': 14,
}

/** Right-associative operators (assignment and exponent). */
// ARITH_RIGHT_ASSOC保存`Set`，供共享工具后续处理使用。
const ARITH_RIGHT_ASSOC = new Set([
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '<<=',
  '>>=',
  '&=',
  '^=',
  '|=',
  '**',
])

// parseArithExpr 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithExpr(
  P: ParseState,
  stop: string,
  mode: ArithMode = 'var',
): TsNode | null {
  // 返回 `parseArithTernary(P, stop, mode)`，作为共享工具这次计算的结果。
  return parseArithTernary(P, stop, mode)
}

/** Top-level: comma-separated list. arithmetic_expansion emits multiple children. */
// parseArithCommaList 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithCommaList(
  P: ParseState,
  stop: string,
  mode: ArithMode = 'var',
): TsNode[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: TsNode[] = []
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // e解析`parseArithTernary`，供共享工具后续处理使用。
    const e = parseArithTernary(P, stop, mode)
    // 满足 `e) out.push(e` 时，共享工具执行该分支。
    if (e) out.push(e)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 只有 `peek(P.L) === ',' && !isArithStop(P, stop)` 满足时，共享工具才执行该分支。
    if (peek(P.L) === ',' && !isArithStop(P, stop)) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 结束这个分支或循环，避免共享工具继续落入后续路径。
    break
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

// parseArithTernary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithTernary(
  P: ParseState,
  stop: string,
  mode: ArithMode,
): TsNode | null {
  // cond解析`parseArithBinary`，供共享工具后续处理使用。
  const cond = parseArithBinary(P, stop, 0, mode)
  // cond缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cond) return null
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 当 `peek(P.L)` 匹配 `'?'` 时，共享工具执行对应分支。
  if (peek(P.L) === '?') {
    // qs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const qs = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // q保存`mk`，供共享工具后续处理使用。
    const q = mk(P, '?', qs, P.L.b, [])
    // t解析`parseArithBinary`，供共享工具后续处理使用。
    const t = parseArithBinary(P, ':', 0, mode)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // colon 先占位，稍后的条件分支会根据实际输入补齐它。
    let colon: TsNode
    // 当 `peek(P.L)` 匹配 `':'` 时，共享工具执行对应分支。
    if (peek(P.L) === ':') {
      // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const cs = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // colon更新为 `mk(P, ':', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      colon = mk(P, ':', cs, P.L.b, [])
    } else {
      // colon更新为 `mk(P, ':', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      colon = mk(P, ':', P.L.b, P.L.b, [])
    }
    // f解析`parseArithTernary`，供共享工具后续处理使用。
    const f = parseArithTernary(P, stop, mode)
    // last 命名 `f ?? colon`，让后续代码直接表达这个值的用途。
    const last = f ?? colon
    // kids 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const kids: TsNode[] = [cond, q]
    // 满足 `t) kids.push(t` 时，共享工具执行该分支。
    if (t) kids.push(t)
    // kids 集合追加新条目，保持收集顺序与输入顺序一致。
    kids.push(colon)
    // 满足 `f) kids.push(f` 时，共享工具执行该分支。
    if (f) kids.push(f)
    // 返回 `mk(P, 'ternary_expression', cond.startIndex, last.endIndex, kids)`，作为共享工具这次计算的结果。
    return mk(P, 'ternary_expression', cond.startIndex, last.endIndex, kids)
  }
  // 返回 `cond`，作为共享工具这次计算的结果。
  return cond
}

/** Scan next arithmetic binary operator; returns [text, length] or null. */
// scanArithOp 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scanArithOp(P: ParseState): [string, number] | null {
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // c2保存`peek`，供共享工具后续处理使用。
  const c2 = peek(P.L, 2)
  // 3-char: <<= >>=
  // 当 `c` 匹配 `'<' && c1 === '<' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '<' && c2 === '=') return ['<<=', 3]
  // 当 `c` 匹配 `'>' && c1 === '>' && c2 ===...` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '>' && c2 === '=') return ['>>=', 3]
  // 2-char
  // 当 `c` 匹配 `'*' && c1 === '*'` 时，共享工具执行对应分支。
  if (c === '*' && c1 === '*') return ['**', 2]
  // 当 `c` 匹配 `'<' && c1 === '<'` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '<') return ['<<', 2]
  // 当 `c` 匹配 `'>' && c1 === '>'` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '>') return ['>>', 2]
  // 当 `c` 匹配 `'=' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '=' && c1 === '=') return ['==', 2]
  // 当 `c` 匹配 `'!' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '!' && c1 === '=') return ['!=', 2]
  // 当 `c` 匹配 `'<' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '<' && c1 === '=') return ['<=', 2]
  // 当 `c` 匹配 `'>' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '>' && c1 === '=') return ['>=', 2]
  // 当 `c` 匹配 `'&' && c1 === '&'` 时，共享工具执行对应分支。
  if (c === '&' && c1 === '&') return ['&&', 2]
  // 当 `c` 匹配 `'|' && c1 === '|'` 时，共享工具执行对应分支。
  if (c === '|' && c1 === '|') return ['||', 2]
  // 当 `c` 匹配 `'+' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '+' && c1 === '=') return ['+=', 2]
  // 当 `c` 匹配 `'-' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '-' && c1 === '=') return ['-=', 2]
  // 当 `c` 匹配 `'*' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '*' && c1 === '=') return ['*=', 2]
  // 当 `c` 匹配 `'/' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '/' && c1 === '=') return ['/=', 2]
  // 当 `c` 匹配 `'%' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '%' && c1 === '=') return ['%=', 2]
  // 当 `c` 匹配 `'&' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '&' && c1 === '=') return ['&=', 2]
  // 当 `c` 匹配 `'^' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '^' && c1 === '=') return ['^=', 2]
  // 当 `c` 匹配 `'|' && c1 === '='` 时，共享工具执行对应分支。
  if (c === '|' && c1 === '=') return ['|=', 2]
  // 1-char — but NOT ++ -- (those are pre/postfix)
  // 当 `c` 匹配 `'+' && c1 !== '+'` 时，共享工具执行对应分支。
  if (c === '+' && c1 !== '+') return ['+', 1]
  // 当 `c` 匹配 `'-' && c1 !== '-'` 时，共享工具执行对应分支。
  if (c === '-' && c1 !== '-') return ['-', 1]
  // 当 `c` 匹配 `'*'` 时，共享工具执行对应分支。
  if (c === '*') return ['*', 1]
  // 当 `c` 匹配 `'/'` 时，共享工具执行对应分支。
  if (c === '/') return ['/', 1]
  // 当 `c` 匹配 `'%'` 时，共享工具执行对应分支。
  if (c === '%') return ['%', 1]
  // 当 `c` 匹配 `'<'` 时，共享工具执行对应分支。
  if (c === '<') return ['<', 1]
  // 当 `c` 匹配 `'>'` 时，共享工具执行对应分支。
  if (c === '>') return ['>', 1]
  // 当 `c` 匹配 `'&'` 时，共享工具执行对应分支。
  if (c === '&') return ['&', 1]
  // 当 `c` 匹配 `'|'` 时，共享工具执行对应分支。
  if (c === '|') return ['|', 1]
  // 当 `c` 匹配 `'^'` 时，共享工具执行对应分支。
  if (c === '^') return ['^', 1]
  // 当 `c` 匹配 `'='` 时，共享工具执行对应分支。
  if (c === '=') return ['=', 1]
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/** Precedence-climbing binary expression parser. */
// parseArithBinary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithBinary(
  P: ParseState,
  stop: string,
  minPrec: number,
  mode: ArithMode,
): TsNode | null {
  // left解析`parseArithUnary`，供共享工具后续处理使用。
  let left = parseArithUnary(P, stop, mode)
  // left缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!left) return null
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // 满足 `isArithStop(P, stop)` 时，共享工具执行该分支。
    if (isArithStop(P, stop)) break
    // 当 `peek(P.L)` 匹配 `','` 时，共享工具执行对应分支。
    if (peek(P.L) === ',') break
    // opInfo保存`scanArithOp`，供共享工具后续处理使用。
    const opInfo = scanArithOp(P)
    // opInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!opInfo) break
    // 从 `opInfo` 按位置拆出 opText、opLen，让共享工具 bash Parser分别处理这些返回值。
    const [opText, opLen] = opInfo
    // prec 命名 `ARITH_PREC[opText]`，让后续代码直接表达这个值的用途。
    const prec = ARITH_PREC[opText]
    // 只有 `prec === undefined || prec < minPrec` 满足时，共享工具才执行该分支。
    if (prec === undefined || prec < minPrec) break
    // os 集合保存`P.L.b`，供后续判断或组装使用。
    const os = P.L.b
    // 按索引扫描 `opLen`，需要消费相邻参数时可以精确移动游标。
    for (let k = 0; k < opLen; k++) advance(P.L)
    // op保存`mk`，供共享工具后续处理使用。
    const op = mk(P, opText, os, P.L.b, [])
    // nextMin保存`ARITH_RIGHT_ASSOC.has`，供共享工具后续处理使用。
    const nextMin = ARITH_RIGHT_ASSOC.has(opText) ? prec : prec + 1
    // right解析`parseArithBinary`，供共享工具后续处理使用。
    const right = parseArithBinary(P, stop, nextMin, mode)
    // right缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!right) break
    // left更新为 `mk(P, 'binary_expression', left.startIndex, right.endInde...`，确保Bash 解析工具后续读取最新状态。
    left = mk(P, 'binary_expression', left.startIndex, right.endIndex, [
      left,
      op,
      right,
    ])
  }
  // 返回 `left`，作为共享工具这次计算的结果。
  return left
}

// parseArithUnary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithUnary(
  P: ParseState,
  stop: string,
  mode: ArithMode,
): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 满足 `isArithStop(P, stop)` 时，共享工具执行该分支。
  if (isArithStop(P, stop)) return null
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // Prefix ++ --
  // 只有 `(c === '+' && c1 === '+') || (c === '-' && c1 === '-')` 满足时，共享工具才执行该分支。
  if ((c === '+' && c1 === '+') || (c === '-' && c1 === '-')) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op保存`mk`，供共享工具后续处理使用。
    const op = mk(P, c + c1, s, P.L.b, [])
    // inner解析`parseArithUnary`，供共享工具后续处理使用。
    const inner = parseArithUnary(P, stop, mode)
    // inner缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inner) return op
    // 返回 `mk(P, 'unary_expression', op.startIndex, inner.endIndex, [op, inner])`，作为共享工具这次计算的结果。
    return mk(P, 'unary_expression', op.startIndex, inner.endIndex, [op, inner])
  }
  // 当 `c` 匹配 `'-' || c === '+' || c === '...` 时，共享工具执行对应分支。
  if (c === '-' || c === '+' || c === '!' || c === '~') {
    // In 'word'/'assign' mode (c-style for head), `-N` is a single number
    // literal per tree-sitter, not unary_expression. 'var' mode uses unary.
    // `mode` 与 `'var' && c === '-' && isDigit(c...` 不一致时刷新派生状态，避免使用过期结果。
    if (mode !== 'var' && c === '-' && isDigit(c1)) {
      // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const s = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 isDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (isDigit(peek(P.L))) advance(P.L)
      // 返回 `mk(P, 'number', s, P.L.b, [])`，作为共享工具这次计算的结果。
      return mk(P, 'number', s, P.L.b, [])
    }
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op保存`mk`，供共享工具后续处理使用。
    const op = mk(P, c, s, P.L.b, [])
    // inner解析`parseArithUnary`，供共享工具后续处理使用。
    const inner = parseArithUnary(P, stop, mode)
    // inner缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inner) return op
    // 返回 `mk(P, 'unary_expression', op.startIndex, inner.endIndex, [op, inner])`，作为共享工具这次计算的结果。
    return mk(P, 'unary_expression', op.startIndex, inner.endIndex, [op, inner])
  }
  // 返回 `parseArithPostfix(P, stop, mode)`，作为共享工具这次计算的结果。
  return parseArithPostfix(P, stop, mode)
}

// parseArithPostfix 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithPostfix(
  P: ParseState,
  stop: string,
  mode: ArithMode,
): TsNode | null {
  // prim解析`parseArithPrimary`，供共享工具后续处理使用。
  const prim = parseArithPrimary(P, stop, mode)
  // prim缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!prim) return null
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // c1保存`peek`，供共享工具后续处理使用。
  const c1 = peek(P.L, 1)
  // 只有 `(c === '+' && c1 === '+') || (c === '-' && c1 === '-')` 满足时，共享工具才执行该分支。
  if ((c === '+' && c1 === '+') || (c === '-' && c1 === '-')) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // op保存`mk`，供共享工具后续处理使用。
    const op = mk(P, c + c1, s, P.L.b, [])
    // 返回 `mk(P, 'postfix_expression', prim.startIndex, op.endIndex, [prim, op])`，作为共享工具这次计算的结果。
    return mk(P, 'postfix_expression', prim.startIndex, op.endIndex, [prim, op])
  }
  // 返回 `prim`，作为共享工具这次计算的结果。
  return prim
}

// parseArithPrimary 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArithPrimary(
  P: ParseState,
  stop: string,
  mode: ArithMode,
): TsNode | null {
  // 调用 skipBlanks，触发共享工具此处需要的副作用。
  skipBlanks(P.L)
  // 满足 `isArithStop(P, stop)` 时，共享工具执行该分支。
  if (isArithStop(P, stop)) return null
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // 当 `c` 匹配 `'('` 时，共享工具执行对应分支。
  if (c === '(') {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 调用 advance，触发共享工具此处需要的副作用。
    advance(P.L)
    // open保存`mk`，供共享工具后续处理使用。
    const open = mk(P, '(', s, P.L.b, [])
    // Parenthesized expression may contain comma-separated exprs
    // inners 集合解析`parseArithCommaList`，供共享工具后续处理使用。
    const inners = parseArithCommaList(P, ')', mode)
    // 调用 skipBlanks，触发共享工具此处需要的副作用。
    skipBlanks(P.L)
    // close 先占位，稍后的条件分支会根据实际输入补齐它。
    let close: TsNode
    // 当 `peek(P.L)` 匹配 `')'` 时，共享工具执行对应分支。
    if (peek(P.L) === ')') {
      // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
      const cs = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // close更新为 `mk(P, ')', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', cs, P.L.b, [])
    } else {
      // close更新为 `mk(P, ')', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
      close = mk(P, ')', P.L.b, P.L.b, [])
    }
    // 返回 `mk(P, 'parenthesized_expression', open.startIndex, close.endIndex, [`，作为共享工具这次计算的结果。
    return mk(P, 'parenthesized_expression', open.startIndex, close.endIndex, [
      open,
      ...inners,
      close,
    ])
  }
  // 当 `c` 匹配 `'"'` 时，共享工具执行对应分支。
  if (c === '"') {
    // 返回 `parseDoubleQuoted(P)`，作为共享工具这次计算的结果。
    return parseDoubleQuoted(P)
  }
  // 满足 `c === '` 时，共享工具执行该分支。
  if (c === '$') {
    // 返回 `parseDollarLike(P)`，作为共享工具这次计算的结果。
    return parseDollarLike(P)
  }
  // 满足 `isDigit(c)` 时，共享工具执行该分支。
  if (isDigit(c)) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 只要 isDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isDigit(peek(P.L))) advance(P.L)
    // Hex: 0x1f
    // 共享工具在这里按实际状态进入对应分支。
    if (
      P.L.b - s === 1 &&
      c === '0' &&
      (peek(P.L) === 'x' || peek(P.L) === 'X')
    ) {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 isHexDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (isHexDigit(peek(P.L))) advance(P.L)
    }
    // Base notation: BASE#DIGITS e.g. 2#1010, 16#ff
    else if (peek(P.L) === '#') {
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // 只要 isBaseDigit(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
      while (isBaseDigit(peek(P.L))) advance(P.L)
    }
    // 返回 `mk(P, 'number', s, P.L.b, [])`，作为共享工具这次计算的结果。
    return mk(P, 'number', s, P.L.b, [])
  }
  // 满足 `isIdentStart(c)` 时，共享工具执行该分支。
  if (isIdentStart(c)) {
    // s 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
    const s = P.L.b
    // 只要 isIdentChar(peek(P.L))) advance(P.L 成立，就持续推进共享工具中的循环处理。
    while (isIdentChar(peek(P.L))) advance(P.L)
    // nc保存`peek`，供共享工具后续处理使用。
    const nc = peek(P.L)
    // Assignment in 'assign' mode (c-style for init): emit variable_assignment
    // so chained `a = b = c = 1` nests correctly. Other modes treat `=` as a
    // binary_expression operator via the precedence table.
    // 当 `mode` 匹配 `'assign'` 时，共享工具执行对应分支。
    if (mode === 'assign') {
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // ac保存`peek`，供共享工具后续处理使用。
      const ac = peek(P.L)
      // ac1保存`peek`，供共享工具后续处理使用。
      const ac1 = peek(P.L, 1)
      // 当 `ac` 匹配 `'=' && ac1 !== '='` 时，共享工具执行对应分支。
      if (ac === '=' && ac1 !== '=') {
        // vn保存`mk`，供共享工具后续处理使用。
        const vn = mk(P, 'variable_name', s, P.L.b, [])
        // es 集合 命名 `P.L.b`，让后续代码直接表达这个值的用途。
        const es = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // eq保存`mk`，供共享工具后续处理使用。
        const eq = mk(P, '=', es, P.L.b, [])
        // RHS may itself be another assignment (chained)
        // val解析`parseArithTernary`，供共享工具后续处理使用。
        const val = parseArithTernary(P, stop, mode)
        // end保存`val ? val.endIndex : eq.endIndex`，供后续判断或组装使用。
        const end = val ? val.endIndex : eq.endIndex
        // kids 集合读取 `val ? [vn, eq, val] : [vn, eq]` 对应条目，后续围绕该成员继续处理。
        const kids = val ? [vn, eq, val] : [vn, eq]
        // 返回 `mk(P, 'variable_assignment', s, end, kids)`，作为共享工具这次计算的结果。
        return mk(P, 'variable_assignment', s, end, kids)
      }
    }
    // Subscript
    // 当 `nc` 匹配 `'['` 时，共享工具执行对应分支。
    if (nc === '[') {
      // vn保存`mk`，供共享工具后续处理使用。
      const vn = mk(P, 'variable_name', s, P.L.b, [])
      // brS 集合保存`P.L.b`，供后续判断或组装使用。
      const brS = P.L.b
      // 调用 advance，触发共享工具此处需要的副作用。
      advance(P.L)
      // brOpen保存`mk`，供共享工具后续处理使用。
      const brOpen = mk(P, '[', brS, P.L.b, [])
      // idx解析`parseArithTernary`，供共享工具后续处理使用。
      const idx = parseArithTernary(P, ']', 'var') ?? parseDollarLike(P)
      // 调用 skipBlanks，触发共享工具此处需要的副作用。
      skipBlanks(P.L)
      // brClose 先占位，稍后的条件分支会根据实际输入补齐它。
      let brClose: TsNode
      // 当 `peek(P.L)` 匹配 `']'` 时，共享工具执行对应分支。
      if (peek(P.L) === ']') {
        // cs 集合保存`P.L.b`，供共享工具 bash Parser后续判断或输出使用。
        const cs = P.L.b
        // 调用 advance，触发共享工具此处需要的副作用。
        advance(P.L)
        // brClose更新为 `mk(P, ']', cs, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
        brClose = mk(P, ']', cs, P.L.b, [])
      } else {
        // brClose更新为 `mk(P, ']', P.L.b, P.L.b, [])`，确保Bash 解析工具后续读取最新状态。
        brClose = mk(P, ']', P.L.b, P.L.b, [])
      }
      // kids 集合保存`idx ? [vn, brOpen, idx, brClose] : [vn, brOpen, brClose]`，供共享工具 bash Parser后续判断或输出使用。
      const kids = idx ? [vn, brOpen, idx, brClose] : [vn, brOpen, brClose]
      // 返回 `mk(P, 'subscript', s, brClose.endIndex, kids)`，作为共享工具这次计算的结果。
      return mk(P, 'subscript', s, brClose.endIndex, kids)
    }
    // Bare identifier: variable_name in 'var' mode, word in 'word'/'assign' mode.
    // 'assign' mode falls through to word when no `=` follows (c-style for
    // cond/update clauses: `c<=5` → binary_expression(word, number)).
    // identType标记共享工具 bash Parser是否启用对应路径。
    const identType = mode === 'var' ? 'variable_name' : 'word'
    // 返回 `mk(P, identType, s, P.L.b, [])`，作为共享工具这次计算的结果。
    return mk(P, identType, s, P.L.b, [])
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// isArithStop 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isArithStop(P: ParseState, stop: string): boolean {
  // c保存`peek`，供共享工具后续处理使用。
  const c = peek(P.L)
  // 当 `stop` 匹配 `'))') return c === ')' && p...` 时，共享工具执行对应分支。
  if (stop === '))') return c === ')' && peek(P.L, 1) === ')'
  // 当 `stop` 匹配 `')') return c === '` 时，共享工具执行对应分支。
  if (stop === ')') return c === ')'
  // 当 `stop` 匹配 `';'` 时，共享工具执行对应分支。
  if (stop === ';') return c === ';'
  // 当 `stop` 匹配 `':'` 时，共享工具执行对应分支。
  if (stop === ':') return c === ':'
  // 当 `stop` 匹配 `']'` 时，共享工具执行对应分支。
  if (stop === ']') return c === ']'
  // 当 `stop` 匹配 `'}'` 时，共享工具执行对应分支。
  if (stop === '}') return c === '}'
  // 当 `stop` 匹配 `':}'` 时，共享工具执行对应分支。
  if (stop === ':}') return c === ':' || c === '}'
  // 返回 `c === '' || c === '\n'`，作为共享工具这次计算的结果。
  return c === '' || c === '\n'
}
