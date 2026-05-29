/**
 * SGR (Select Graphic Rendition) Parser
 *
 * Parses SGR parameters and applies them to a TextStyle.
 * Handles both semicolon (;) and colon (:) separated parameters.
 */

// 类型依赖 { NamedColor, TextStyle, UnderlineStyle } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { NamedColor, TextStyle, UnderlineStyle } from './types.js'
// 引入 defaultStyle，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { defaultStyle } from './types.js'

// NAMED_COLORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const NAMED_COLORS: NamedColor[] = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
]

// UNDERLINE_STYLES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const UNDERLINE_STYLES: UnderlineStyle[] = [
  'none',
  'single',
  'double',
  'curly',
  'dotted',
  'dashed',
]

// Param 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Param = { value: number | null; subparams: number[]; colon: boolean }

// parseParams 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseParams(str: string): Param[] {
  // 满足 `str === ''` 时，终端渲染执行该分支。
  if (str === '') return [{ value: 0, subparams: [], colon: false }]

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: Param[] = []
  // current 集中保存Ink 渲染层 sgr要一起传递的字段。
  let current: Param = { value: null, subparams: [], colon: false }
  // num 命名 `''`，让后续代码直接表达这个值的用途。
  let num = ''
  // inSub标记Ink 渲染层 sgr是否启用对应路径。
  let inSub = false

  // 按索引扫描 `= str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i <= str.length; i++) {
    // c 命名 `str[i]`，让后续代码直接表达这个值的用途。
    const c = str[i]
    // 只有 `c === ';' || c === undefined` 满足时，终端渲染才执行该分支。
    if (c === ';' || c === undefined) {
      // n解析`parseInt`，供终端渲染后续处理使用。
      const n = num === '' ? null : parseInt(num, 10)
      // 满足 `inSub` 时，终端渲染执行该分支。
      if (inSub) {
        // `n` 与 `null) current.subparams.push(n` 不一致时刷新派生状态，避免使用过期结果。
        if (n !== null) current.subparams.push(n)
      } else {
        // 取值更新为 `n`，确保Ink 渲染层后续读取最新状态。
        current.value = n
      }
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(current)
      // current更新为 `{ value: null, subparams: [], colon: false }`，确保Ink 渲染层后续读取最新状态。
      current = { value: null, subparams: [], colon: false }
      // num更新为 `''`，确保Ink 渲染层后续读取最新状态。
      num = ''
      // inSub更新为 `false`，确保Ink 渲染层后续读取最新状态。
      inSub = false
    // Ink 渲染层 sgr在这里处理 `} else if (c === ':') {`，完成这一小步状态转换。
    } else if (c === ':') {
      // n解析`parseInt`，供终端渲染后续处理使用。
      const n = num === '' ? null : parseInt(num, 10)
      // inSub缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!inSub) {
        // 取值更新为 `n`，确保Ink 渲染层后续读取最新状态。
        current.value = n
        // colon更新为 `true`，确保Ink 渲染层后续读取最新状态。
        current.colon = true
        // inSub更新为 `true`，确保Ink 渲染层后续读取最新状态。
        inSub = true
      } else {
        // `n` 与 `null) current.subparams.push(n` 不一致时刷新派生状态，避免使用过期结果。
        if (n !== null) current.subparams.push(n)
      }
      // num更新为 `''`，确保Ink 渲染层后续读取最新状态。
      num = ''
    // Ink 渲染层 sgr在这里处理 `} else if (c >= '0' && c <= '9') {`，完成这一小步状态转换。
    } else if (c >= '0' && c <= '9') {
      // Ink 渲染层 sgr在这里处理 `num += c`，完成这一小步状态转换。
      num += c
    }
  }
  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

// parseExtendedColor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseExtendedColor(
  params: Param[],
  idx: number,
): { r: number; g: number; b: number } | { index: number } | null {
  // p读取 `params[idx]` 对应条目，后续围绕该成员继续处理。
  const p = params[idx]
  // p缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!p) return null

  // 只有 `p.colon && p.subparams.length >= 1` 满足时，终端渲染才执行该分支。
  if (p.colon && p.subparams.length >= 1) {
    // 只有 `p.subparams[0] === 5 && p.subparams.length >= 2` 满足时，终端渲染才执行该分支。
    if (p.subparams[0] === 5 && p.subparams.length >= 2) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { index: p.subparams[1]! }
    }
    // 只有 `p.subparams[0] === 2 && p.subparams.length >= 4` 满足时，终端渲染才执行该分支。
    if (p.subparams[0] === 2 && p.subparams.length >= 4) {
      // off 命名 `p.subparams.length >= 5 ? 1 : 0`，让后续代码直接表达这个值的用途。
      const off = p.subparams.length >= 5 ? 1 : 0
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        r: p.subparams[1 + off]!,
        g: p.subparams[2 + off]!,
        b: p.subparams[3 + off]!,
      }
    }
  }

  // next保存`params[idx + 1]`，供Ink 渲染层 sgr后续判断或输出使用。
  const next = params[idx + 1]
  // next缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!next) return null
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    next.value === 5 &&
    params[idx + 2]?.value !== null &&
    params[idx + 2]?.value !== undefined
  ) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { index: params[idx + 2]!.value! }
  }
  // 满足 `next.value === 2` 时，终端渲染执行该分支。
  if (next.value === 2) {
    // r保存`params[idx + 2]?.value`，供Ink 渲染层 sgr后续判断或输出使用。
    const r = params[idx + 2]?.value
    // g读取 `params[idx + 3]?.value` 对应条目，后续围绕该成员继续处理。
    const g = params[idx + 3]?.value
    // b 命名 `params[idx + 4]?.value`，让后续代码直接表达这个值的用途。
    const b = params[idx + 4]?.value
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      r !== null &&
      r !== undefined &&
      g !== null &&
      g !== undefined &&
      b !== null &&
      b !== undefined
    ) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { r, g, b }
    }
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// applySGR 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySGR(paramStr: string, style: TextStyle): TextStyle {
  // params 集合解析`parseParams`，供终端渲染后续处理使用。
  const params = parseParams(paramStr)
  // s 集合 集中保存Ink 渲染层 sgr要一起传递的字段。
  let s = { ...style }
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0

  // while 使用 i < params.length 完成终端渲染里的对应操作。
  while (i < params.length) {
    // p保存`params[i]!`，供Ink 渲染层 sgr后续判断或输出使用。
    const p = params[i]!
    // code保存`p.value ?? 0`，供Ink 渲染层 sgr后续判断或输出使用。
    const code = p.value ?? 0

    // 满足 `code === 0` 时，终端渲染执行该分支。
    if (code === 0) {
      // s 集合更新为 `defaultStyle()`，确保Ink 渲染层后续读取最新状态。
      s = defaultStyle()
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 1` 时，终端渲染执行该分支。
    if (code === 1) {
      // bold更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.bold = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 2` 时，终端渲染执行该分支。
    if (code === 2) {
      // dim更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.dim = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 3` 时，终端渲染执行该分支。
    if (code === 3) {
      // italic更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.italic = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 4` 时，终端渲染执行该分支。
    if (code === 4) {
      // underline更新为 `p.colon`，确保Ink 渲染层后续读取最新状态。
      s.underline = p.colon
        ? (UNDERLINE_STYLES[p.subparams[0]!] ?? 'single')
        : 'single'
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 只有 `code === 5 || code === 6` 满足时，终端渲染才执行该分支。
    if (code === 5 || code === 6) {
      // blink更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.blink = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 7` 时，终端渲染执行该分支。
    if (code === 7) {
      // inverse更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.inverse = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 8` 时，终端渲染执行该分支。
    if (code === 8) {
      // hidden更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.hidden = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 9` 时，终端渲染执行该分支。
    if (code === 9) {
      // strikethrough更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.strikethrough = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 21` 时，终端渲染执行该分支。
    if (code === 21) {
      // underline更新为 `'double'`，确保Ink 渲染层后续读取最新状态。
      s.underline = 'double'
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 22` 时，终端渲染执行该分支。
    if (code === 22) {
      // bold更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.bold = false
      // dim更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.dim = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 23` 时，终端渲染执行该分支。
    if (code === 23) {
      // italic更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.italic = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 24` 时，终端渲染执行该分支。
    if (code === 24) {
      // underline更新为 `'none'`，确保Ink 渲染层后续读取最新状态。
      s.underline = 'none'
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 25` 时，终端渲染执行该分支。
    if (code === 25) {
      // blink更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.blink = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 27` 时，终端渲染执行该分支。
    if (code === 27) {
      // inverse更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.inverse = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 28` 时，终端渲染执行该分支。
    if (code === 28) {
      // hidden更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.hidden = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 29` 时，终端渲染执行该分支。
    if (code === 29) {
      // strikethrough更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.strikethrough = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 53` 时，终端渲染执行该分支。
    if (code === 53) {
      // overline更新为 `true`，确保Ink 渲染层后续读取最新状态。
      s.overline = true
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 55` 时，终端渲染执行该分支。
    if (code === 55) {
      // overline更新为 `false`，确保Ink 渲染层后续读取最新状态。
      s.overline = false
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // 只有 `code >= 30 && code <= 37` 满足时，终端渲染才执行该分支。
    if (code >= 30 && code <= 37) {
      // fg更新为 `{ type: 'named', name: NAMED_COLORS[code - 30]! }`，确保Ink 渲染层后续读取最新状态。
      s.fg = { type: 'named', name: NAMED_COLORS[code - 30]! }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 39` 时，终端渲染执行该分支。
    if (code === 39) {
      // fg更新为 `{ type: 'default' }`，确保Ink 渲染层后续读取最新状态。
      s.fg = { type: 'default' }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 只有 `code >= 40 && code <= 47` 满足时，终端渲染才执行该分支。
    if (code >= 40 && code <= 47) {
      // bg更新为 `{ type: 'named', name: NAMED_COLORS[code - 40]! }`，确保Ink 渲染层后续读取最新状态。
      s.bg = { type: 'named', name: NAMED_COLORS[code - 40]! }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 满足 `code === 49` 时，终端渲染执行该分支。
    if (code === 49) {
      // bg更新为 `{ type: 'default' }`，确保Ink 渲染层后续读取最新状态。
      s.bg = { type: 'default' }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 只有 `code >= 90 && code <= 97` 满足时，终端渲染才执行该分支。
    if (code >= 90 && code <= 97) {
      // fg更新为 `{ type: 'named', name: NAMED_COLORS[code - 90 + 8]! }`，确保Ink 渲染层后续读取最新状态。
      s.fg = { type: 'named', name: NAMED_COLORS[code - 90 + 8]! }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }
    // 只有 `code >= 100 && code <= 107` 满足时，终端渲染才执行该分支。
    if (code >= 100 && code <= 107) {
      // bg更新为 `{ type: 'named', name: NAMED_COLORS[code - 100 + 8]! }`，确保Ink 渲染层后续读取最新状态。
      s.bg = { type: 'named', name: NAMED_COLORS[code - 100 + 8]! }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // 满足 `code === 38` 时，终端渲染执行该分支。
    if (code === 38) {
      // c解析`parseExtendedColor`，供终端渲染后续处理使用。
      const c = parseExtendedColor(params, i)
      // 满足 `c` 时，终端渲染执行该分支。
      if (c) {
        // Ink 渲染层 sgr在这里处理 `s.fg =`，完成这一小步状态转换。
        s.fg =
          'index' in c
            ? { type: 'indexed', index: c.index }
            : { type: 'rgb', ...c }
        // Ink 渲染层 sgr在这里处理 `i += p.colon ? 1 : 'index' in c ? 3 : 5`，完成这一小步状态转换。
        i += p.colon ? 1 : 'index' in c ? 3 : 5
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
    }
    // 满足 `code === 48` 时，终端渲染执行该分支。
    if (code === 48) {
      // c解析`parseExtendedColor`，供终端渲染后续处理使用。
      const c = parseExtendedColor(params, i)
      // 满足 `c` 时，终端渲染执行该分支。
      if (c) {
        // Ink 渲染层 sgr在这里处理 `s.bg =`，完成这一小步状态转换。
        s.bg =
          'index' in c
            ? { type: 'indexed', index: c.index }
            : { type: 'rgb', ...c }
        // Ink 渲染层 sgr在这里处理 `i += p.colon ? 1 : 'index' in c ? 3 : 5`，完成这一小步状态转换。
        i += p.colon ? 1 : 'index' in c ? 3 : 5
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
    }
    // 满足 `code === 58` 时，终端渲染执行该分支。
    if (code === 58) {
      // c解析`parseExtendedColor`，供终端渲染后续处理使用。
      const c = parseExtendedColor(params, i)
      // 满足 `c` 时，终端渲染执行该分支。
      if (c) {
        // Ink 渲染层 sgr在这里处理 `s.underlineColor =`，完成这一小步状态转换。
        s.underlineColor =
          'index' in c
            ? { type: 'indexed', index: c.index }
            : { type: 'rgb', ...c }
        // Ink 渲染层 sgr在这里处理 `i += p.colon ? 1 : 'index' in c ? 3 : 5`，完成这一小步状态转换。
        i += p.colon ? 1 : 'index' in c ? 3 : 5
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
    }
    // 满足 `code === 59` 时，终端渲染执行该分支。
    if (code === 59) {
      // underlineColor更新为 `{ type: 'default' }`，确保Ink 渲染层后续读取最新状态。
      s.underlineColor = { type: 'default' }
      // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // Ink 渲染层 sgr在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // 返回 `s`，作为终端渲染这次计算的结果。
  return s
}
