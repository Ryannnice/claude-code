/**
 * Converts ANSI-escaped terminal text to SVG format
 * Supports basic ANSI color codes (foreground colors)
 */

// 引入 escapeXml，将 ./xml.js 中已经封装好的能力接到本文件流程里。
import { escapeXml } from './xml.js'

// AnsiColor 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnsiColor = {
  r: number
  g: number
  b: number
}

// Default terminal color palette (similar to most terminals)
// ANSI_COLORS 集合 集中保存共享工具 ansi To Svg要一起传递的字段。
const ANSI_COLORS: Record<number, AnsiColor> = {
  30: { r: 0, g: 0, b: 0 }, // black
  31: { r: 205, g: 49, b: 49 }, // red
  32: { r: 13, g: 188, b: 121 }, // green
  33: { r: 229, g: 229, b: 16 }, // yellow
  34: { r: 36, g: 114, b: 200 }, // blue
  35: { r: 188, g: 63, b: 188 }, // magenta
  36: { r: 17, g: 168, b: 205 }, // cyan
  37: { r: 229, g: 229, b: 229 }, // white
  // Bright colors
  90: { r: 102, g: 102, b: 102 }, // bright black (gray)
  91: { r: 241, g: 76, b: 76 }, // bright red
  92: { r: 35, g: 209, b: 139 }, // bright green
  93: { r: 245, g: 245, b: 67 }, // bright yellow
  94: { r: 59, g: 142, b: 234 }, // bright blue
  95: { r: 214, g: 112, b: 214 }, // bright magenta
  96: { r: 41, g: 184, b: 219 }, // bright cyan
  97: { r: 255, g: 255, b: 255 }, // bright white
}

// DEFAULT_FG 集中保存共享工具 ansi To Svg要一起传递的字段。
export const DEFAULT_FG: AnsiColor = { r: 229, g: 229, b: 229 } // light gray
// DEFAULT_BG 集中保存共享工具 ansi To Svg要一起传递的字段。
export const DEFAULT_BG: AnsiColor = { r: 30, g: 30, b: 30 } // dark gray

// TextSpan 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextSpan = {
  text: string
  color: AnsiColor
  bold: boolean
}

// ParsedLine 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedLine = TextSpan[]

/**
 * Parse ANSI escape sequences from text
 * Supports:
 * - Basic colors (30-37, 90-97)
 * - 256-color mode (38;5;n)
 * - 24-bit true color (38;2;r;g;b)
 */
// parseAnsi 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAnsi(text: string): ParsedLine[] {
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: ParsedLine[] = []
  // rawLines 集合格式化`text.split`，供共享工具后续处理使用。
  const rawLines = text.split('\n')

  // 按顺序遍历 `rawLines` 中的line，逐个交给共享工具处理。
  for (const line of rawLines) {
    // spans 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const spans: TextSpan[] = []
    // currentColor保存`DEFAULT_FG`，供共享工具 ansi To Svg后续判断或输出使用。
    let currentColor = DEFAULT_FG
    // bold标记共享工具 ansi To Svg是否启用对应路径。
    let bold = false
    // i 命名 `0`，让后续代码直接表达这个值的用途。
    let i = 0

    // while 使用 i < line.length 完成共享工具里的对应操作。
    while (i < line.length) {
      // Check for ANSI escape sequence
      // 当 `line[i]` 匹配 `'\x1b' && line[i + 1] === '...` 时，共享工具执行对应分支。
      if (line[i] === '\x1b' && line[i + 1] === '[') {
        // Find the end of the escape sequence
        // j保存`i + 2`，供后续判断或组装使用。
        let j = i + 2
        // 只要 j < line.length && !/[A-Za-z]/.test(line[j]!) 成立，就持续推进共享工具中的循环处理。
        while (j < line.length && !/[A-Za-z]/.test(line[j]!)) {
          // 共享工具 ansi To Svg在这里处理 `j++`，完成这一小步状态转换。
          j++
        }

        // 当 `line[j]` 匹配 `'m'` 时，共享工具执行对应分支。
        if (line[j] === 'm') {
          // Color/style code
          // codes 集合保存`line`，供后续判断或组装使用。
          const codes = line
            .slice(i + 2, j)
            .split(';')
            .map(Number)

          // k保存`0`，供共享工具 ansi To Svg后续判断或输出使用。
          let k = 0
          // while 使用 k < codes.length 完成共享工具里的对应操作。
          while (k < codes.length) {
            // code读取 `codes[k]!` 对应条目，后续围绕该成员继续处理。
            const code = codes[k]!
            // 满足 `code === 0` 时，共享工具执行该分支。
            if (code === 0) {
              // Reset
              // currentColor更新为 `DEFAULT_FG`，确保共享工具后续读取最新状态。
              currentColor = DEFAULT_FG
              // bold更新为 `false`，确保共享工具后续读取最新状态。
              bold = false
            // 共享工具 ansi To Svg在这里处理 `} else if (code === 1) {`，完成这一小步状态转换。
            } else if (code === 1) {
              // bold更新为 `true`，确保共享工具后续读取最新状态。
              bold = true
            // 共享工具 ansi To Svg在这里处理 `} else if (code >= 30 && code <= 37) {`，完成这一小步状态转换。
            } else if (code >= 30 && code <= 37) {
              // currentColor更新为 `ANSI_COLORS[code] || DEFAULT_FG`，确保共享工具后续读取最新状态。
              currentColor = ANSI_COLORS[code] || DEFAULT_FG
            // 共享工具 ansi To Svg在这里处理 `} else if (code >= 90 && code <= 97) {`，完成这一小步状态转换。
            } else if (code >= 90 && code <= 97) {
              // currentColor更新为 `ANSI_COLORS[code] || DEFAULT_FG`，确保共享工具后续读取最新状态。
              currentColor = ANSI_COLORS[code] || DEFAULT_FG
            // 共享工具 ansi To Svg在这里处理 `} else if (code === 39) {`，完成这一小步状态转换。
            } else if (code === 39) {
              // currentColor更新为 `DEFAULT_FG`，确保共享工具后续读取最新状态。
              currentColor = DEFAULT_FG
            // 共享工具 ansi To Svg在这里处理 `} else if (code === 38) {`，完成这一小步状态转换。
            } else if (code === 38) {
              // Extended color - check next code
              // `codes[k + 1] === 5 && codes[k + 2]` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
              if (codes[k + 1] === 5 && codes[k + 2] !== undefined) {
                // 256-color mode: 38;5;n
                // colorIndex 索引读取 `codes[k + 2]!` 对应条目，后续围绕该成员继续处理。
                const colorIndex = codes[k + 2]!
                // currentColor更新为 `get256Color(colorIndex)`，确保共享工具后续读取最新状态。
                currentColor = get256Color(colorIndex)
                // 共享工具 ansi To Svg在这里处理 `k += 2`，完成这一小步状态转换。
                k += 2
              // 共享工具 ansi To Svg在这里处理 `} else if (`，完成这一小步状态转换。
              } else if (
                codes[k + 1] === 2 &&
                codes[k + 2] !== undefined &&
                codes[k + 3] !== undefined &&
                codes[k + 4] !== undefined
              ) {
                // 24-bit true color: 38;2;r;g;b
                // currentColor更新为 `{`，确保共享工具后续读取最新状态。
                currentColor = {
                  r: codes[k + 2]!,
                  g: codes[k + 3]!,
                  b: codes[k + 4]!,
                }
                // 共享工具 ansi To Svg在这里处理 `k += 4`，完成这一小步状态转换。
                k += 4
              }
            }
            // 共享工具 ansi To Svg在这里处理 `k++`，完成这一小步状态转换。
            k++
          }
        }

        // i更新为 `j + 1`，确保共享工具后续读取最新状态。
        i = j + 1
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Regular character - find extent of same-styled text
      // textStart 命名 `i`，让后续代码直接表达这个值的用途。
      const textStart = i
      // while 使用 i < line.length && line[i] !== '\x1b' 完成共享工具里的对应操作。
      while (i < line.length && line[i] !== '\x1b') {
        // 共享工具 ansi To Svg在这里处理 `i++`，完成这一小步状态转换。
        i++
      }

      // spanText格式化`line.slice`，供共享工具后续处理使用。
      const spanText = line.slice(textStart, i)
      // 满足 `spanText` 时，共享工具执行该分支。
      if (spanText) {
        // spans 集合追加新条目，保持收集顺序与输入顺序一致。
        spans.push({ text: spanText, color: currentColor, bold })
      }
    }

    // Add empty span if line is empty (to preserve line)
    // spans 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (spans.length === 0) {
      // spans 集合追加新条目，保持收集顺序与输入顺序一致。
      spans.push({ text: '', color: DEFAULT_FG, bold: false })
    }

    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(spans)
  }

  // 返回 `lines`，作为共享工具这次计算的结果。
  return lines
}

/**
 * Get color from 256-color palette
 */
// get256Color 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function get256Color(index: number): AnsiColor {
  // Standard colors (0-15)
  // 满足 `index < 16` 时，共享工具执行该分支。
  if (index < 16) {
    // standardColors 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const standardColors: AnsiColor[] = [
      { r: 0, g: 0, b: 0 }, // 0 black
      { r: 128, g: 0, b: 0 }, // 1 red
      { r: 0, g: 128, b: 0 }, // 2 green
      { r: 128, g: 128, b: 0 }, // 3 yellow
      { r: 0, g: 0, b: 128 }, // 4 blue
      { r: 128, g: 0, b: 128 }, // 5 magenta
      { r: 0, g: 128, b: 128 }, // 6 cyan
      { r: 192, g: 192, b: 192 }, // 7 white
      { r: 128, g: 128, b: 128 }, // 8 bright black
      { r: 255, g: 0, b: 0 }, // 9 bright red
      { r: 0, g: 255, b: 0 }, // 10 bright green
      { r: 255, g: 255, b: 0 }, // 11 bright yellow
      { r: 0, g: 0, b: 255 }, // 12 bright blue
      { r: 255, g: 0, b: 255 }, // 13 bright magenta
      { r: 0, g: 255, b: 255 }, // 14 bright cyan
      { r: 255, g: 255, b: 255 }, // 15 bright white
    ]
    // 返回 `standardColors[index] || DEFAULT_FG`，作为共享工具这次计算的结果。
    return standardColors[index] || DEFAULT_FG
  }

  // 216 color cube (16-231)
  // 满足 `index < 232` 时，共享工具执行该分支。
  if (index < 232) {
    // i保存`index - 16`，供共享工具 ansi To Svg后续判断或输出使用。
    const i = index - 16
    // r保存`Math.floor`，供共享工具后续处理使用。
    const r = Math.floor(i / 36)
    // g保存`Math.floor`，供共享工具后续处理使用。
    const g = Math.floor((i % 36) / 6)
    // b 命名 `i % 6`，让后续代码直接表达这个值的用途。
    const b = i % 6
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      r: r === 0 ? 0 : 55 + r * 40,
      g: g === 0 ? 0 : 55 + g * 40,
      b: b === 0 ? 0 : 55 + b * 40,
    }
  }

  // Grayscale (232-255)
  // gray保存`(index - 232) * 10 + 8`，供共享工具 ansi To Svg后续判断或输出使用。
  const gray = (index - 232) * 10 + 8
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { r: gray, g: gray, b: gray }
}

// AnsiToSvgOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnsiToSvgOptions = {
  fontFamily?: string
  fontSize?: number
  lineHeight?: number
  paddingX?: number
  paddingY?: number
  backgroundColor?: string
  borderRadius?: number
}

/**
 * Convert ANSI text to SVG
 * Uses <tspan> elements within a single <text> per line so the renderer
 * handles character spacing natively (no manual charWidth calculation)
 */
// ansiToSvg 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ansiToSvg(
  ansiText: string,
  options: AnsiToSvgOptions = {},
): string {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    fontFamily = 'Menlo, Monaco, monospace',
    fontSize = 14,
    lineHeight = 22,
    paddingX = 24,
    paddingY = 24,
    backgroundColor = `rgb(${DEFAULT_BG.r}, ${DEFAULT_BG.g}, ${DEFAULT_BG.b})`,
    borderRadius = 8,
  } = options

  // 文本行解析`parseAnsi`，供共享工具后续处理使用。
  const lines = parseAnsi(ansiText)

  // Trim trailing empty lines
  // 调用 while，触发共享工具此处需要的副作用。
  while (
    lines.length > 0 &&
    // 这个回调绑定到 lines[lines.length - 1]!.every(span => span.text.trim() === '')，负责共享工具在该局部场景下的响应。
    lines[lines.length - 1]!.every(span => span.text.trim() === '')
  ) {
    // 调用 lines.pop，触发共享工具此处需要的副作用。
    lines.pop()
  }

  // Estimate width based on max line length (for SVG dimensions only)
  // For monospace fonts, character width is roughly 0.6 * fontSize
  // charWidthEstimate 命名 `fontSize * 0.6`，让后续代码直接表达这个值的用途。
  const charWidthEstimate = fontSize * 0.6
  // maxLineLength 数量保存`Math.max`，供共享工具后续处理使用。
  const maxLineLength = Math.max(
    // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
    ...lines.map(spans => spans.reduce((acc, s) => acc + s.text.length, 0)),
  )
  // width保存`Math.ceil`，供共享工具后续处理使用。
  const width = Math.ceil(maxLineLength * charWidthEstimate + paddingX * 2)
  // height记录 `lines.length * lineHeight + paddingY * 2` 是否成立，下一步按该结果分支。
  const height = lines.length * lineHeight + paddingY * 2

  // Build SVG - use tspan elements so renderer handles character positioning
  // svg保存``<svg xmlns="http://www.w3.org/2000/svg" width="${width}"...`，作为后续固定文本处理的输入。
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
  // 共享工具 ansi To Svg在这里处理 `svg += ` <rect width="100%" height="100%" fill="${backgroundColor}" rx=...`，完成这一小步状态转换。
  svg += `  <rect width="100%" height="100%" fill="${backgroundColor}" rx="${borderRadius}" ry="${borderRadius}"/>\n`
  // 共享工具 ansi To Svg在这里处理 `svg += ` <style>\n``，完成这一小步状态转换。
  svg += `  <style>\n`
  // 共享工具 ansi To Svg在这里处理 `svg += ` text { font-family: ${fontFamily}; font-size: ${fontSize}px; w...`，完成这一小步状态转换。
  svg += `    text { font-family: ${fontFamily}; font-size: ${fontSize}px; white-space: pre; }\n`
  // 共享工具 ansi To Svg在这里处理 `svg += ` .b { font-weight: bold; }\n``，完成这一小步状态转换。
  svg += `    .b { font-weight: bold; }\n`
  // 共享工具 ansi To Svg在这里处理 `svg += ` </style>\n``，完成这一小步状态转换。
  svg += `  </style>\n`

  // 循环处理 `let lineIndex = 0; lineIndex < lines.length; line`，让共享工具逐项把同类条目按顺序走完。
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    // spans 集合保存`lines[lineIndex]!`，供共享工具 ansi To Svg后续判断或输出使用。
    const spans = lines[lineIndex]!
    // y 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const y =
      paddingY + (lineIndex + 1) * lineHeight - (lineHeight - fontSize) / 2

    // Build a single <text> element with <tspan> children for each colored segment
    // xml:space="preserve" prevents SVG from collapsing whitespace
    // 共享工具 ansi To Svg在这里处理 `svg += ` <text x="${paddingX}" y="${y}" xml:space="preserve">``，完成这一小步状态转换。
    svg += `  <text x="${paddingX}" y="${y}" xml:space="preserve">`

    // 按顺序遍历 `spans` 中的span，逐个交给共享工具处理。
    for (const span of spans) {
      // span.text缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!span.text) continue

      // colorStr保存`rgb`，供共享工具后续处理使用。
      const colorStr = `rgb(${span.color.r}, ${span.color.g}, ${span.color.b})`
      // boldClass 集合保存`span.bold ? ' class="b"' : ''`，供后续判断或组装使用。
      const boldClass = span.bold ? ' class="b"' : ''

      // 共享工具 ansi To Svg在这里处理 `svg += `<tspan fill="${colorStr}"${boldClass}>${escapeXml(span.text)}</...`，完成这一小步状态转换。
      svg += `<tspan fill="${colorStr}"${boldClass}>${escapeXml(span.text)}</tspan>`
    }

    // 共享工具 ansi To Svg在这里处理 `svg += `</text>\n``，完成这一小步状态转换。
    svg += `</text>\n`
  }

  // 共享工具 ansi To Svg在这里处理 `svg += `</svg>``，完成这一小步状态转换。
  svg += `</svg>`

  // 返回 `svg`，作为共享工具这次计算的结果。
  return svg
}
