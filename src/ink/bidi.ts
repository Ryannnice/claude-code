/**
 * Bidirectional text reordering for terminal rendering.
 *
 * Terminals on Windows do not implement the Unicode Bidi Algorithm,
 * so RTL text (Hebrew, Arabic, etc.) appears reversed. This module
 * applies the bidi algorithm to reorder ClusteredChar arrays from
 * logical order to visual order before Ink's LTR cell placement loop.
 *
 * On macOS terminals (Terminal.app, iTerm2) bidi works natively.
 * Windows Terminal (including WSL) does not implement bidi
 * (https://github.com/microsoft/terminal/issues/538).
 *
 * Detection: Windows Terminal sets WT_SESSION; native Windows cmd/conhost
 * also lacks bidi. We enable bidi reordering when running on Windows or
 * inside Windows Terminal (covers WSL).
 */
// 引入 bidiFactory，将 bidi-js 中已经封装好的能力接到本文件流程里。
import bidiFactory from 'bidi-js'

// ClusteredChar 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ClusteredChar = {
  value: string
  width: number
  styleId: number
  hyperlink: string | undefined
}

// bidiInstance 先占位，稍后的条件分支会根据实际输入补齐它。
let bidiInstance: ReturnType<typeof bidiFactory> | undefined
// needsSoftwareBidi 先占位，稍后的条件分支会根据实际输入补齐它。
let needsSoftwareBidi: boolean | undefined

// needsBidi 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function needsBidi(): boolean {
  // 满足 `needsSoftwareBidi === undefined` 时，终端渲染执行该分支。
  if (needsSoftwareBidi === undefined) {
    // Ink 渲染层 bidi在这里处理 `needsSoftwareBidi =`，完成这一小步状态转换。
    needsSoftwareBidi =
      process.platform === 'win32' ||
      typeof process.env['WT_SESSION'] === 'string' || // WSL in Windows Terminal
      process.env['TERM_PROGRAM'] === 'vscode' // VS Code integrated terminal (xterm.js)
  }
  // 返回 `needsSoftwareBidi`，作为终端渲染这次计算的结果。
  return needsSoftwareBidi
}

// getBidi 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBidi() {
  // bidiInstance缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!bidiInstance) {
    // bidiInstance更新为 `bidiFactory()`，确保Ink 渲染层后续读取最新状态。
    bidiInstance = bidiFactory()
  }
  // 返回 `bidiInstance`，作为终端渲染这次计算的结果。
  return bidiInstance
}

/**
 * Reorder an array of ClusteredChars from logical order to visual order
 * using the Unicode Bidi Algorithm. Active on terminals that lack native
 * bidi support (Windows Terminal, conhost, WSL).
 *
 * Returns the same array on bidi-capable terminals (no-op).
 */
// reorderBidi 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function reorderBidi(characters: ClusteredChar[]): ClusteredChar[] {
  // !needsBidi() || characters 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (!needsBidi() || characters.length === 0) {
    // 返回 `characters`，作为终端渲染这次计算的结果。
    return characters
  }

  // Build a plain string from the clustered chars to run through bidi
  // plainText派生`characters.map`，供终端渲染后续处理使用。
  const plainText = characters.map(c => c.value).join('')

  // Check if there are any RTL characters — skip bidi if pure LTR
  // 满足 `!hasRTLCharacters(plainText)` 时，终端渲染执行该分支。
  if (!hasRTLCharacters(plainText)) {
    // 返回 `characters`，作为终端渲染这次计算的结果。
    return characters
  }

  // bidi读取`getBidi`，供终端渲染后续处理使用。
  const bidi = getBidi()
  // 从 `bidi.getEmbeddingLevels(plainText, 'auto')` 解构 levels，减少Ink 渲染层 bidi对同一对象的重复访问。
  const { levels } = bidi.getEmbeddingLevels(plainText, 'auto')

  // Map bidi levels back to ClusteredChar indices.
  // Each ClusteredChar may be multiple code units in the joined string.
  // charLevels 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const charLevels: number[] = []
  // offset保存`0`，供Ink 渲染层 bidi后续判断或输出使用。
  let offset = 0
  // 按索引扫描 `characters.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < characters.length; i++) {
    // charLevels 集合追加新条目，保持收集顺序与输入顺序一致。
    charLevels.push(levels[offset]!)
    // Ink 渲染层 bidi在这里处理 `offset += characters[i]!.value.length`，完成这一小步状态转换。
    offset += characters[i]!.value.length
  }

  // Get reorder segments from bidi-js, but we need to work at the
  // ClusteredChar level, not the string level. We'll implement the
  // standard bidi reordering: find the max level, then for each level
  // from max down to 1, reverse all contiguous runs >= that level.
  // reordered 聚合成有序列表，保持后续遍历顺序稳定。
  const reordered = [...characters]
  // maxLevel保存`Math.max`，供终端渲染后续处理使用。
  const maxLevel = Math.max(...charLevels)

  // 循环处理 `let level = maxLevel; level >= 1; level--`，让终端渲染逐项把同类条目按顺序走完。
  for (let level = maxLevel; level >= 1; level--) {
    // i保存`0`，供Ink 渲染层 bidi后续判断或输出使用。
    let i = 0
    // while 使用 i < reordered.length 完成终端渲染里的对应操作。
    while (i < reordered.length) {
      // 满足 `charLevels[i]! >= level` 时，终端渲染执行该分支。
      if (charLevels[i]! >= level) {
        // Find the end of this run
        // j保存`i + 1`，供Ink 渲染层 bidi后续判断或输出使用。
        let j = i + 1
        // while 使用 j < reordered.length && charLevels[j]! >= level 完成终端渲染里的对应操作。
        while (j < reordered.length && charLevels[j]! >= level) {
          // Ink 渲染层 bidi在这里处理 `j++`，完成这一小步状态转换。
          j++
        }
        // Reverse the run in both arrays
        // 调用 reverseRange，触发终端渲染此处需要的副作用。
        reverseRange(reordered, i, j - 1)
        // 调用 reverseRangeNumbers，触发终端渲染此处需要的副作用。
        reverseRangeNumbers(charLevels, i, j - 1)
        // i更新为 `j`，确保Ink 渲染层后续读取最新状态。
        i = j
      } else {
        // Ink 渲染层 bidi在这里处理 `i++`，完成这一小步状态转换。
        i++
      }
    }
  }

  // 返回 `reordered`，作为终端渲染这次计算的结果。
  return reordered
}

// reverseRange 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reverseRange<T>(arr: T[], start: number, end: number): void {
  // while 使用 start < end 完成终端渲染里的对应操作。
  while (start < end) {
    // temp保存`arr[start]!`，供Ink 渲染层 bidi后续判断或输出使用。
    const temp = arr[start]!
    // arr[start更新为 `arr[end]!`，确保Ink 渲染层 bidi后续读取最新状态。
    arr[start] = arr[end]!
    // arr[end更新为 `temp`，确保Ink 渲染层 bidi后续读取最新状态。
    arr[end] = temp
    // Ink 渲染层 bidi在这里处理 `start++`，完成这一小步状态转换。
    start++
    // Ink 渲染层 bidi在这里处理 `end--`，完成这一小步状态转换。
    end--
  }
}

// reverseRangeNumbers 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reverseRangeNumbers(arr: number[], start: number, end: number): void {
  // while 使用 start < end 完成终端渲染里的对应操作。
  while (start < end) {
    // temp保存`arr[start]!`，供Ink 渲染层 bidi后续判断或输出使用。
    const temp = arr[start]!
    // arr[start更新为 `arr[end]!`，确保Ink 渲染层 bidi后续读取最新状态。
    arr[start] = arr[end]!
    // arr[end更新为 `temp`，确保Ink 渲染层 bidi后续读取最新状态。
    arr[end] = temp
    // Ink 渲染层 bidi在这里处理 `start++`，完成这一小步状态转换。
    start++
    // Ink 渲染层 bidi在这里处理 `end--`，完成这一小步状态转换。
    end--
  }
}

/**
 * Quick check for RTL characters (Hebrew, Arabic, and related scripts).
 * Avoids running the full bidi algorithm on pure-LTR text.
 */
// hasRTLCharacters 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasRTLCharacters(text: string): boolean {
  // Hebrew: U+0590-U+05FF, U+FB1D-U+FB4F
  // Arabic: U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFF
  // Thaana: U+0780-U+07BF
  // Syriac: U+0700-U+074F
  // 返回 `/[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB...`，作为终端渲染这次计算的结果。
  return /[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0780-\u07BF\u0700-\u074F]/u.test(
    text,
  )
}
