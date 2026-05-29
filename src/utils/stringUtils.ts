/**
 * General string utility functions and classes for safe string accumulation
 */

/**
 * Escapes special regex characters in a string so it can be used as a literal
 * pattern in a RegExp constructor.
 */
// escapeRegExp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function escapeRegExp(str: string): string {
  // 返回 `str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`，作为共享工具这次计算的结果。
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Uppercases the first character of a string, leaving the rest unchanged.
 * Unlike lodash `capitalize`, this does NOT lowercase the remaining characters.
 *
 * @example capitalize('fooBar') → 'FooBar'
 * @example capitalize('hello world') → 'Hello world'
 */
// capitalize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function capitalize(str: string): string {
  // 返回 `str.charAt(0).toUpperCase() + str.slice(1)`，作为共享工具这次计算的结果。
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Returns the singular or plural form of a word based on count.
 * Replaces the inline `word${n === 1 ? '' : 's'}` idiom.
 *
 * @example plural(1, 'file') → 'file'
 * @example plural(3, 'file') → 'files'
 * @example plural(2, 'entry', 'entries') → 'entries'
 */
// plural 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function plural(
  n: number,
  word: string,
  pluralWord = word + 's',
): string {
  // 返回 `n === 1 ? word : pluralWord`，作为共享工具这次计算的结果。
  return n === 1 ? word : pluralWord
}

/**
 * Returns the first line of a string without allocating a split array.
 * Used for shebang detection in diff rendering.
 */
// firstLineOf 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function firstLineOf(s: string): string {
  // nl保存`s.indexOf`，供共享工具后续处理使用。
  const nl = s.indexOf('\n')
  // 返回 `nl === -1 ? s : s.slice(0, nl)`，作为共享工具这次计算的结果。
  return nl === -1 ? s : s.slice(0, nl)
}

/**
 * Counts occurrences of `char` in `str` using indexOf jumps instead of
 * per-character iteration. Structurally typed so Buffer works too
 * (Buffer.indexOf accepts string needles).
 */
// countCharInString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countCharInString(
  str: { indexOf(search: string, start?: number): number },
  char: string,
  start = 0,
): number {
  // count 数量保存`0`，供后续判断或组装使用。
  let count = 0
  // i保存`str.indexOf`，供共享工具后续处理使用。
  let i = str.indexOf(char, start)
  // while 使用 i !== -1 完成共享工具里的对应操作。
  while (i !== -1) {
    // 共享工具 string Utils在这里处理 `count++`，完成这一小步状态转换。
    count++
    // i更新为 `str.indexOf(char, i + 1)`，确保共享工具后续读取最新状态。
    i = str.indexOf(char, i + 1)
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

/**
 * Normalize full-width (zenkaku) digits to half-width digits.
 * Useful for accepting input from Japanese/CJK IMEs.
 */
// normalizeFullWidthDigits 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeFullWidthDigits(input: string): string {
  // 返回 `input.replace(/[０-９]/g, ch =>`，作为共享工具这次计算的结果。
  return input.replace(/[０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  )
}

/**
 * Normalize full-width (zenkaku) space to half-width space.
 * Useful for accepting input from Japanese/CJK IMEs (U+3000 → U+0020).
 */
// normalizeFullWidthSpace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeFullWidthSpace(input: string): string {
  // 返回 `input.replace(/\u3000/g, ' ')`，作为共享工具这次计算的结果。
  return input.replace(/\u3000/g, ' ')
}

// Keep in-memory accumulation modest to avoid blowing up RSS.
// Overflow beyond this limit is spilled to disk by ShellCommand.
// MAX_STRING_LENGTH 数量保存`2 ** 25`，供共享工具 string Utils后续判断或输出使用。
const MAX_STRING_LENGTH = 2 ** 25

/**
 * Safely joins an array of strings with a delimiter, truncating if the result exceeds maxSize.
 *
 * @param lines Array of strings to join
 * @param delimiter Delimiter to use between strings (default: ',')
 * @param maxSize Maximum size of the resulting string
 * @returns The joined string, truncated if necessary
 */
// safeJoinLines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function safeJoinLines(
  lines: string[],
  delimiter: string = ',',
  maxSize: number = MAX_STRING_LENGTH,
): string {
  // truncationMarker固定为 `'...[truncated]'`，作为共享工具 string Utils后续展示或比较的基准。
  const truncationMarker = '...[truncated]'
  // 结果保存`''`，作为后续固定文本处理的输入。
  let result = ''

  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // delimiterToAdd 命名 `result ? delimiter : ''`，让后续代码直接表达这个值的用途。
    const delimiterToAdd = result ? delimiter : ''
    // fullAddition保存`delimiterToAdd + line`，供共享工具 string Utils后续判断或输出使用。
    const fullAddition = delimiterToAdd + line

    // 满足 `result.length + fullAddition.length <= maxSize` 时，共享工具执行该分支。
    if (result.length + fullAddition.length <= maxSize) {
      // The full line fits
      // 共享工具 string Utils在这里处理 `result += fullAddition`，完成这一小步状态转换。
      result += fullAddition
    } else {
      // Need to truncate
      // remainingSpace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const remainingSpace =
        maxSize -
        result.length -
        delimiterToAdd.length -
        truncationMarker.length

      // 满足 `remainingSpace > 0` 时，共享工具执行该分支。
      if (remainingSpace > 0) {
        // Add delimiter and as much of the line as will fit
        // 共享工具 string Utils在这里处理 `result +=`，完成这一小步状态转换。
        result +=
          delimiterToAdd + line.slice(0, remainingSpace) + truncationMarker
      } else {
        // No room for any of this line, just add truncation marker
        // 共享工具 string Utils在这里处理 `result += truncationMarker`，完成这一小步状态转换。
        result += truncationMarker
      }
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * A string accumulator that safely handles large outputs by truncating from the end
 * when a size limit is exceeded. This prevents RangeError crashes while preserving
 * the beginning of the output.
 */
// EndTruncatingAccumulator 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class EndTruncatingAccumulator {
  private content: string = ''
  private isTruncated = false
  private totalBytesReceived = 0

  /**
   * Creates a new EndTruncatingAccumulator
   * @param maxSize Maximum size in characters before truncation occurs
   */
  // 构造函数接收 private readonly maxSize: number = MAX_STRING_LEN…，把外部输入整理成实例可复用的内部状态。
  constructor(private readonly maxSize: number = MAX_STRING_LENGTH) {}

  /**
   * Appends data to the accumulator. If the total size exceeds maxSize,
   * the end is truncated to maintain the size limit.
   * @param data The string data to append
   */
  // append 使用 data: string | Buffer 完成共享工具里的对应操作。
  append(data: string | Buffer): void {
    // str格式化`data.toString`，供共享工具后续处理使用。
    const str = typeof data === 'string' ? data : data.toString()
    // 共享工具 string Utils在这里处理 `this.totalBytesReceived += str.length`，完成这一小步状态转换。
    this.totalBytesReceived += str.length

    // If already at capacity and truncated, don't modify content
    // 只有 `this.isTruncated && this.content.length >= this.m` 满足时，共享工具才执行该分支。
    if (this.isTruncated && this.content.length >= this.maxSize) {
      // 共享工具 string Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check if adding the string would exceed the limit
    // 满足 `this.content.length + str.length > this.maxSize` 时，共享工具执行该分支。
    if (this.content.length + str.length > this.maxSize) {
      // Only append what we can fit
      // remainingSpace 命名 `this.maxSize - this.content.length`，让后续代码直接表达这个值的用途。
      const remainingSpace = this.maxSize - this.content.length
      // 满足 `remainingSpace > 0` 时，共享工具执行该分支。
      if (remainingSpace > 0) {
        // 共享工具 string Utils在这里处理 `this.content += str.slice(0, remainingSpace)`，完成这一小步状态转换。
        this.content += str.slice(0, remainingSpace)
      }
      // 更新实例字段 isTruncated 为 true，同步共享工具的内部状态。
      this.isTruncated = true
    } else {
      // 共享工具 string Utils在这里处理 `this.content += str`，完成这一小步状态转换。
      this.content += str
    }
  }

  /**
   * Returns the accumulated string, with truncation marker if truncated
   */
  // toString 使用 无 完成共享工具里的对应操作。
  toString(): string {
    // this.isTruncated缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.isTruncated) {
      // 返回 `this.content`，作为共享工具这次计算的结果。
      return this.content
    }

    // truncatedBytes 集合 命名 `this.totalBytesReceived - this.maxSize`，让后续代码直接表达这个值的用途。
    const truncatedBytes = this.totalBytesReceived - this.maxSize
    // truncatedKB保存`Math.round`，供共享工具后续处理使用。
    const truncatedKB = Math.round(truncatedBytes / 1024)
    // 返回 `this.content + `\n... [output truncated - ${truncatedKB}KB removed]``，作为共享工具这次计算的结果。
    return this.content + `\n... [output truncated - ${truncatedKB}KB removed]`
  }

  /**
   * Clears all accumulated data
   */
  // clear 使用 无 完成共享工具里的对应操作。
  clear(): void {
    // 更新实例字段 content 为 ''，同步共享工具的内部状态。
    this.content = ''
    // 更新实例字段 isTruncated 为 false，同步共享工具的内部状态。
    this.isTruncated = false
    // 更新实例字段 totalBytesReceived 为 0，同步共享工具的内部状态。
    this.totalBytesReceived = 0
  }

  /**
   * Returns the current size of accumulated data
   */
  // 共享工具 string Utils在这里处理 `get length(): number {`，完成这一小步状态转换。
  get length(): number {
    // 返回 `this.content.length`，作为共享工具这次计算的结果。
    return this.content.length
  }

  /**
   * Returns whether truncation has occurred
   */
  // 共享工具 string Utils在这里处理 `get truncated(): boolean {`，完成这一小步状态转换。
  get truncated(): boolean {
    // 返回 `this.isTruncated`，作为共享工具这次计算的结果。
    return this.isTruncated
  }

  /**
   * Returns total bytes received (before truncation)
   */
  // 共享工具 string Utils在这里处理 `get totalBytes(): number {`，完成这一小步状态转换。
  get totalBytes(): number {
    // 返回 `this.totalBytesReceived`，作为共享工具这次计算的结果。
    return this.totalBytesReceived
  }
}

/**
 * Truncates text to a maximum number of lines, adding an ellipsis if truncated.
 *
 * @param text The text to truncate
 * @param maxLines Maximum number of lines to keep
 * @returns The truncated text with ellipsis if truncated
 */
// truncateToLines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateToLines(text: string, maxLines: number): string {
  // 文本行格式化`text.split`，供共享工具后续处理使用。
  const lines = text.split('\n')
  // 满足 `lines.length <= maxLines` 时，共享工具执行该分支。
  if (lines.length <= maxLines) {
    // 返回 `text`，作为共享工具这次计算的结果。
    return text
  }
  // 返回 `lines.slice(0, maxLines).join('\n') + '…'`，作为共享工具这次计算的结果。
  return lines.slice(0, maxLines).join('\n') + '…'
}
