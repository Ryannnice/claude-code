/**
 * Lightweight parser for .git/config files.
 *
 * Verified against git's config.c:
 *   - Section names: case-insensitive, alphanumeric + hyphen
 *   - Subsection names (quoted): case-sensitive, backslash escapes (\\ and \")
 *   - Key names: case-insensitive, alphanumeric + hyphen
 *   - Values: optional quoting, inline comments (# or ;), backslash escapes
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'

/**
 * Parse a single value from .git/config.
 * Finds the first matching key under the given section/subsection.
 */
// parseGitConfigValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseGitConfigValue(
  gitDir: string,
  section: string,
  subsection: string | null,
  key: string,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 配置读取`readFile`，供共享工具后续处理使用。
    const config = await readFile(join(gitDir, 'config'), 'utf-8')
    // 返回 `parseConfigString(config, section, subsection, key)`，作为共享工具这次计算的结果。
    return parseConfigString(config, section, subsection, key)
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Parse a config value from an in-memory config string.
 * Exported for testing.
 */
// parseConfigString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseConfigString(
  config: string,
  section: string,
  subsection: string | null,
  key: string,
): string | null {
  // 文本行格式化`config.split`，供共享工具后续处理使用。
  const lines = config.split('\n')
  // sectionLower保存`section.toLowerCase`，供共享工具后续处理使用。
  const sectionLower = section.toLowerCase()
  // keyLower保存`key.toLowerCase`，供共享工具后续处理使用。
  const keyLower = key.toLowerCase()

  // inSection标记共享工具 git Config Parser是否启用对应路径。
  let inSection = false
  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // trimmed格式化`line.trim`，供共享工具后续处理使用。
    const trimmed = line.trim()

    // Skip empty lines and comment-only lines
    // 只有 `trimmed.length === 0 || trimmed[0] === '#' || tri` 满足时，共享工具才执行该分支。
    if (trimmed.length === 0 || trimmed[0] === '#' || trimmed[0] === ';') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Section header
    // 当 `trimmed[0]` 匹配 `'['` 时，共享工具执行对应分支。
    if (trimmed[0] === '[') {
      // inSection更新为 `matchesSectionHeader(trimmed, sectionLower, subsection)`，确保共享工具后续读取最新状态。
      inSection = matchesSectionHeader(trimmed, sectionLower, subsection)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // inSection缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inSection) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Key-value line: find the key name
    // 解析结果解析`parseKeyValue`，供共享工具后续处理使用。
    const parsed = parseKeyValue(trimmed)
    // 只有 `parsed && parsed.key.toLowerCase() === keyLower` 满足时，共享工具才执行该分支。
    if (parsed && parsed.key.toLowerCase() === keyLower) {
      // 返回 `parsed.value`，作为共享工具这次计算的结果。
      return parsed.value
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Parse a key = value line. Returns null if the line doesn't contain a valid key.
 */
// parseKeyValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseKeyValue(line: string): { key: string; value: string } | null {
  // Read key: alphanumeric + hyphen, starting with alpha
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // 只要 i < line.length && isKeyChar(line[i]!) 成立，就持续推进共享工具中的循环处理。
  while (i < line.length && isKeyChar(line[i]!)) {
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // 满足 `i === 0` 时，共享工具执行该分支。
  if (i === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 按键格式化`line.slice`，供共享工具后续处理使用。
  const key = line.slice(0, i)

  // Skip whitespace
  // 只要 i < line.length && (line[i] === ' ' || line[i] === '\t') 成立，就持续推进共享工具中的循环处理。
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Must have '='
  // `i >= line.length || line[i]` 与 `'='` 不一致时刷新派生状态，避免使用过期结果。
  if (i >= line.length || line[i] !== '=') {
    // Boolean key with no value — not relevant for our use cases
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 共享工具 git Config Parser在这里处理 `i++ // skip '='`，完成这一小步状态转换。
  i++ // skip '='

  // Skip whitespace after '='
  // 只要 i < line.length && (line[i] === ' ' || line[i] === '\t') 成立，就持续推进共享工具中的循环处理。
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // 取值解析`parseValue`，供共享工具后续处理使用。
  const value = parseValue(line, i)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { key, value }
}

/**
 * Parse a config value starting at position i.
 * Handles quoted strings, escape sequences, and inline comments.
 */
// parseValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseValue(line: string, start: number): string {
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // inQuote标记共享工具 git Config Parser是否启用对应路径。
  let inQuote = false
  // i 命名 `start`，让后续代码直接表达这个值的用途。
  let i = start

  // while 使用 i < line.length 完成共享工具里的对应操作。
  while (i < line.length) {
    // ch保存`line[i]!`，供共享工具 git Config Parser后续判断或输出使用。
    const ch = line[i]!

    // Inline comments outside quotes end the value
    // 只有 `!inQuote && (ch === '#' || ch === ';')` 满足时，共享工具才执行该分支。
    if (!inQuote && (ch === '#' || ch === ';')) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // 当 `ch` 匹配 `'"'` 时，共享工具执行对应分支。
    if (ch === '"') {
      // inQuote更新为 `!inQuote`，确保共享工具后续读取最新状态。
      inQuote = !inQuote
      // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 只有 `ch === '\\' && i + 1 < line.length` 满足时，共享工具才执行该分支。
    if (ch === '\\' && i + 1 < line.length) {
      // next 命名 `line[i + 1]!`，让后续代码直接表达这个值的用途。
      const next = line[i + 1]!
      // 满足 `inQuote` 时，共享工具执行该分支。
      if (inQuote) {
        // Inside quotes: recognize escape sequences
        // 按照 next 的取值选择共享工具的具体处理分支。
        switch (next) {
          case 'n':
            // 共享工具 git Config Parser在这里处理 `result += '\n'`，完成这一小步状态转换。
            result += '\n'
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          case 't':
            // 共享工具 git Config Parser在这里处理 `result += '\t'`，完成这一小步状态转换。
            result += '\t'
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          case 'b':
            // 共享工具 git Config Parser在这里处理 `result += '\b'`，完成这一小步状态转换。
            result += '\b'
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          case '"':
            // 共享工具 git Config Parser在这里处理 `result += '"'`，完成这一小步状态转换。
            result += '"'
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          case '\\':
            // 共享工具 git Config Parser在这里处理 `result += '\\'`，完成这一小步状态转换。
            result += '\\'
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          default:
            // Git silently drops the backslash for unknown escapes
            // 共享工具 git Config Parser在这里处理 `result += next`，完成这一小步状态转换。
            result += next
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
        }
        // 共享工具 git Config Parser在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Outside quotes: backslash at end of line = continuation (we don't
      // handle multi-line since we split on \n, but handle \\ and others)
      // 当 `next` 匹配 `'\\'` 时，共享工具执行对应分支。
      if (next === '\\') {
        // 共享工具 git Config Parser在这里处理 `result += '\\'`，完成这一小步状态转换。
        result += '\\'
        // 共享工具 git Config Parser在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Fallthrough — treat backslash literally outside quotes
    }

    // 共享工具 git Config Parser在这里处理 `result += ch`，完成这一小步状态转换。
    result += ch
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Trim trailing whitespace from unquoted portions.
  // Git trims trailing whitespace that isn't inside quotes, but since we
  // process char-by-char and quotes toggle, the simplest correct approach
  // for single-line values is to trim the result when not ending in a quote.
  // inQuote缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!inQuote) {
    // 结果更新为 `trimTrailingWhitespace(result)`，确保共享工具后续读取最新状态。
    result = trimTrailingWhitespace(result)
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// trimTrailingWhitespace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function trimTrailingWhitespace(s: string): string {
  // end保存 `s.length` 的判断结果，供共享工具 git Config Parser后续分支直接复用。
  let end = s.length
  // 只要 end > 0 && (s[end - 1] === ' ' || s[end - 1] === '\t') 成立，就持续推进共享工具中的循环处理。
  while (end > 0 && (s[end - 1] === ' ' || s[end - 1] === '\t')) {
    // 共享工具 git Config Parser在这里处理 `end--`，完成这一小步状态转换。
    end--
  }
  // 返回 `s.slice(0, end)`，作为共享工具这次计算的结果。
  return s.slice(0, end)
}

/**
 * Check if a config line like `[remote "origin"]` matches the given section/subsection.
 * Section matching is case-insensitive; subsection matching is case-sensitive.
 */
// matchesSectionHeader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function matchesSectionHeader(
  line: string,
  sectionLower: string,
  subsection: string | null,
): boolean {
  // line starts with '['
  // i 命名 `1`，让后续代码直接表达这个值的用途。
  let i = 1

  // Read section name
  // 调用 while，触发共享工具此处需要的副作用。
  while (
    i < line.length &&
    line[i] !== ']' &&
    line[i] !== ' ' &&
    line[i] !== '\t' &&
    line[i] !== '"'
  ) {
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // foundSection格式化`line.slice`，供共享工具后续处理使用。
  const foundSection = line.slice(1, i).toLowerCase()

  // `foundSection` 与 `sectionLower` 不一致时刷新派生状态，避免使用过期结果。
  if (foundSection !== sectionLower) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `subsection === null` 时，共享工具执行该分支。
  if (subsection === null) {
    // Simple section: must end with ']'
    // 返回 `i < line.length && line[i] === ']'`，作为共享工具这次计算的结果。
    return i < line.length && line[i] === ']'
  }

  // Skip whitespace before subsection quote
  // 只要 i < line.length && (line[i] === ' ' || line[i] === '\t') 成立，就持续推进共享工具中的循环处理。
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Must have opening quote
  // `i >= line.length || line[i]` 与 `'"'` 不一致时刷新派生状态，避免使用过期结果。
  if (i >= line.length || line[i] !== '"') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 共享工具 git Config Parser在这里处理 `i++ // skip opening quote`，完成这一小步状态转换。
  i++ // skip opening quote

  // Read subsection — case-sensitive, handle \\ and \" escapes
  // foundSubsection固定为 `''`，作为共享工具 git Config Parser后续展示或比较的基准。
  let foundSubsection = ''
  // while 使用 i < line.length && line[i] !== '"' 完成共享工具里的对应操作。
  while (i < line.length && line[i] !== '"') {
    // 只有 `line[i] === '\\' && i + 1 < line.length` 满足时，共享工具才执行该分支。
    if (line[i] === '\\' && i + 1 < line.length) {
      // next 命名 `line[i + 1]!`，让后续代码直接表达这个值的用途。
      const next = line[i + 1]!
      // 当 `next` 匹配 `'\\' || next === '"'` 时，共享工具执行对应分支。
      if (next === '\\' || next === '"') {
        // 共享工具 git Config Parser在这里处理 `foundSubsection += next`，完成这一小步状态转换。
        foundSubsection += next
        // 共享工具 git Config Parser在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // Git drops the backslash for other escapes in subsections
      // 共享工具 git Config Parser在这里处理 `foundSubsection += next`，完成这一小步状态转换。
      foundSubsection += next
      // 共享工具 git Config Parser在这里处理 `i += 2`，完成这一小步状态转换。
      i += 2
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 共享工具 git Config Parser在这里处理 `foundSubsection += line[i]`，完成这一小步状态转换。
    foundSubsection += line[i]
    // 共享工具 git Config Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Must have closing quote followed by ']'
  // `i >= line.length || line[i]` 与 `'"'` 不一致时刷新派生状态，避免使用过期结果。
  if (i >= line.length || line[i] !== '"') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 共享工具 git Config Parser在这里处理 `i++ // skip closing quote`，完成这一小步状态转换。
  i++ // skip closing quote

  // `i >= line.length || line[i]` 与 `']'` 不一致时刷新派生状态，避免使用过期结果。
  if (i >= line.length || line[i] !== ']') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `foundSubsection === subsection`，作为共享工具这次计算的结果。
  return foundSubsection === subsection
}

// isKeyChar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKeyChar(ch: string): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    (ch >= 'a' && ch <= 'z') ||
    (ch >= 'A' && ch <= 'Z') ||
    (ch >= '0' && ch <= '9') ||
    ch === '-'
  )
}
