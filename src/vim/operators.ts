/**
 * Vim Operator Functions
 *
 * Pure functions for executing vim operators (delete, change, yank, etc.)
 */

// 复用 Cursor 工具函数，把通用处理留在 ../utils/Cursor.js 中维护。
import { Cursor } from '../utils/Cursor.js'
// 复用 firstGrapheme、lastGrapheme 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { firstGrapheme, lastGrapheme } from '../utils/intl.js'
// 复用 countCharInString 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { countCharInString } from '../utils/stringUtils.js'
// 整理这一组导入，让operators后续逻辑可以直接复用这些外部能力。
import {
  isInclusiveMotion,
  isLinewiseMotion,
  resolveMotion,
} from './motions.js'
// 引入 findTextObject，将 ./textObjects.js 中已经封装好的能力接到本文件流程里。
import { findTextObject } from './textObjects.js'
// 整理这一组导入，让operators后续逻辑可以直接复用这些外部能力。
import type {
  FindType,
  Operator,
  RecordedChange,
  TextObjScope,
} from './types.js'

/**
 * Context for operator execution.
 */
// OperatorContext 固化operators里传递的数据形状，帮助调用方按同一结构读写字段。
export type OperatorContext = {
  cursor: Cursor
  text: string
  // 这个回调绑定到 setText: (text: string) => void，负责operators在该局部场景下的响应。
  setText: (text: string) => void
  // 这个回调绑定到 setOffset: (offset: number) => void，负责operators在该局部场景下的响应。
  setOffset: (offset: number) => void
  // 这个回调绑定到 enterInsert: (offset: number) => void，负责operators在该局部场景下的响应。
  enterInsert: (offset: number) => void
  // 这个回调绑定到 getRegister: () => string，负责operators在该局部场景下的响应。
  getRegister: () => string
  // 这个回调绑定到 setRegister: (content: string, linewise: boolean) => void，负责operators在该局部场景下的响应。
  setRegister: (content: string, linewise: boolean) => void
  // 这个回调绑定到 getLastFind: () => { type: FindType; char: string } | null，负责operators在该局部场景下的响应。
  getLastFind: () => { type: FindType; char: string } | null
  // 这个回调绑定到 setLastFind: (type: FindType, char: string) => void，负责operators在该局部场景下的响应。
  setLastFind: (type: FindType, char: string) => void
  // 这个回调绑定到 recordChange: (change: RecordedChange) => void，负责operators在该局部场景下的响应。
  recordChange: (change: RecordedChange) => void
}

/**
 * Execute an operator with a simple motion.
 */
// executeOperatorMotion 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOperatorMotion(
  op: Operator,
  motion: string,
  count: number,
  ctx: OperatorContext,
): void {
  // target读取`resolveMotion`，供operators后续处理使用。
  const target = resolveMotion(motion, ctx.cursor, count)
  // 满足 `target.equals(ctx.cursor)` 时，operators执行该分支。
  if (target.equals(ctx.cursor)) return

  // range读取`getOperatorRange`，供operators后续处理使用。
  const range = getOperatorRange(ctx.cursor, target, motion, op, count)
  // 调用 applyOperator，触发operators此处需要的副作用。
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operator', op, motion, count })
}

/**
 * Execute an operator with a find motion.
 */
// executeOperatorFind 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOperatorFind(
  op: Operator,
  findType: FindType,
  char: string,
  count: number,
  ctx: OperatorContext,
): void {
  // targetOffset筛选`cursor.findCharacter`，供operators后续处理使用。
  const targetOffset = ctx.cursor.findCharacter(char, findType, count)
  // 满足 `targetOffset === null` 时，operators执行该分支。
  if (targetOffset === null) return

  // target保存`Cursor`，供operators后续处理使用。
  const target = new Cursor(ctx.cursor.measuredText, targetOffset)
  // range读取`getOperatorRangeForFind`，供operators后续处理使用。
  const range = getOperatorRangeForFind(ctx.cursor, target, findType)

  // 调用 applyOperator，触发operators此处需要的副作用。
  applyOperator(op, range.from, range.to, ctx)
  // ctx.setLastFind 写入新的状态值，使operators后续读取保持一致。
  ctx.setLastFind(findType, char)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operatorFind', op, find: findType, char, count })
}

/**
 * Execute an operator with a text object.
 */
// executeOperatorTextObj 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOperatorTextObj(
  op: Operator,
  scope: TextObjScope,
  objType: string,
  count: number,
  ctx: OperatorContext,
): void {
  // range筛选`findTextObject`，供operators后续处理使用。
  const range = findTextObject(
    ctx.text,
    ctx.cursor.offset,
    objType,
    scope === 'inner',
  )
  // range缺失时提前走兜底路径，避免operators继续依赖无效输入。
  if (!range) return

  // 调用 applyOperator，触发operators此处需要的副作用。
  applyOperator(op, range.start, range.end, ctx)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operatorTextObj', op, objType, scope, count })
}

/**
 * Execute a line operation (dd, cc, yy).
 */
// executeLineOp 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeLineOp(
  op: Operator,
  count: number,
  ctx: OperatorContext,
): void {
  // 文本 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  const text = ctx.text
  // 文本行格式化`text.split`，供operators后续处理使用。
  const lines = text.split('\n')
  // Calculate logical line by counting newlines before cursor offset
  // (cursor.getPosition() returns wrapped line which is wrong for this)
  // currentLine统计`countCharInString`，供operators后续处理使用。
  const currentLine = countCharInString(text.slice(0, ctx.cursor.offset), '\n')
  // linesToAffect保存`Math.min`，供operators后续处理使用。
  const linesToAffect = Math.min(count, lines.length - currentLine)
  // lineStart保存`cursor.startOfLogicalLine`，供operators后续处理使用。
  const lineStart = ctx.cursor.startOfLogicalLine().offset
  // lineEnd保存`lineStart`，供operators后续判断或输出使用。
  let lineEnd = lineStart
  // 按索引扫描 `linesToAffect`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < linesToAffect; i++) {
    // nextNewline保存`text.indexOf`，供operators后续处理使用。
    const nextNewline = text.indexOf('\n', lineEnd)
    // lineEnd更新为 `nextNewline === -1 ? text.length : nextNewline + 1`，确保operators后续读取最新状态。
    lineEnd = nextNewline === -1 ? text.length : nextNewline + 1
  }

  // 文本内容格式化`text.slice`，供operators后续处理使用。
  let content = text.slice(lineStart, lineEnd)
  // Ensure linewise content ends with newline for paste detection
  // 满足 `!content.endsWith('\n')` 时，operators执行该分支。
  if (!content.endsWith('\n')) {
    // 文本内容更新为 `content + '\n'`，确保operators后续读取最新状态。
    content = content + '\n'
  }
  // ctx.setRegister 写入新的状态值，使operators后续读取保持一致。
  ctx.setRegister(content, true)

  // 当 `op` 匹配 `'yank'` 时，operators执行对应分支。
  if (op === 'yank') {
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(lineStart)
  // operators在这里处理 `} else if (op === 'delete') {`，完成这一小步状态转换。
  } else if (op === 'delete') {
    // deleteStart 命名 `lineStart`，让后续代码直接表达这个值的用途。
    let deleteStart = lineStart
    // deleteEnd保存`lineEnd`，供后续判断或组装使用。
    const deleteEnd = lineEnd

    // If deleting to end of file and there's a preceding newline, include it
    // This ensures deleting the last line doesn't leave a trailing newline
    // operators在这里进入条件判断，后续代码按实际状态分流。
    if (
      deleteEnd === text.length &&
      deleteStart > 0 &&
      text[deleteStart - 1] === '\n'
    ) {
      // operators在这里处理 `deleteStart -= 1`，完成这一小步状态转换。
      deleteStart -= 1
    }

    // newText格式化`text.slice`，供operators后续处理使用。
    const newText = text.slice(0, deleteStart) + text.slice(deleteEnd)
    // ctx.setText 写入新的状态值，使operators后续读取保持一致。
    ctx.setText(newText || '')
    // maxOff保存`Math.max`，供operators后续处理使用。
    const maxOff = Math.max(
      0,
      newText.length - (lastGrapheme(newText).length || 1),
    )
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(Math.min(deleteStart, maxOff))
  // operators在这里处理 `} else if (op === 'change') {`，完成这一小步状态转换。
  } else if (op === 'change') {
    // For single line, just clear it
    // 满足 `lines.length === 1` 时，operators执行该分支。
    if (lines.length === 1) {
      // ctx.setText 写入新的状态值，使operators后续读取保持一致。
      ctx.setText('')
      // 调用 ctx.enterInsert，触发operators此处需要的副作用。
      ctx.enterInsert(0)
    } else {
      // Delete all affected lines, replace with single empty line, enter insert
      // beforeLines 集合格式化`lines.slice`，供operators后续处理使用。
      const beforeLines = lines.slice(0, currentLine)
      // afterLines 集合格式化`lines.slice`，供operators后续处理使用。
      const afterLines = lines.slice(currentLine + linesToAffect)
      // newText格式化`join`，供operators后续处理使用。
      const newText = [...beforeLines, '', ...afterLines].join('\n')
      // ctx.setText 写入新的状态值，使operators后续读取保持一致。
      ctx.setText(newText)
      // 调用 ctx.enterInsert，触发operators此处需要的副作用。
      ctx.enterInsert(lineStart)
    }
  }

  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operator', op, motion: op[0]!, count })
}

/**
 * Execute delete character (x command).
 */
// executeX 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeX(count: number, ctx: OperatorContext): void {
  // from 命名 `ctx.cursor.offset`，让后续代码直接表达这个值的用途。
  const from = ctx.cursor.offset

  // 满足 `from >= ctx.text.length` 时，operators执行该分支。
  if (from >= ctx.text.length) return

  // Advance by graphemes, not code units
  // endCursor保存`ctx.cursor`，供后续判断或组装使用。
  let endCursor = ctx.cursor
  // 按索引扫描 `count && !endCursor.isAtEnd()`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < count && !endCursor.isAtEnd(); i++) {
    // endCursor更新为 `endCursor.right()`，确保operators后续读取最新状态。
    endCursor = endCursor.right()
  }
  // to 命名 `endCursor.offset`，让后续代码直接表达这个值的用途。
  const to = endCursor.offset

  // deleted格式化`text.slice`，供operators后续处理使用。
  const deleted = ctx.text.slice(from, to)
  // newText格式化`text.slice`，供operators后续处理使用。
  const newText = ctx.text.slice(0, from) + ctx.text.slice(to)

  // ctx.setRegister 写入新的状态值，使operators后续读取保持一致。
  ctx.setRegister(deleted, false)
  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // maxOff保存`Math.max`，供operators后续处理使用。
  const maxOff = Math.max(
    0,
    newText.length - (lastGrapheme(newText).length || 1),
  )
  // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
  ctx.setOffset(Math.min(from, maxOff))
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'x', count })
}

/**
 * Execute replace character (r command).
 */
// executeReplace 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeReplace(
  char: string,
  count: number,
  ctx: OperatorContext,
): void {
  // offset保存`ctx.cursor.offset`，供后续判断或组装使用。
  let offset = ctx.cursor.offset
  // newText 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  let newText = ctx.text

  // 循环处理 `let i = 0; i < count && offset < newText.length`，让operators逐项把同类条目按顺序走完。
  for (let i = 0; i < count && offset < newText.length; i++) {
    // graphemeLen保存`firstGrapheme`，供operators后续处理使用。
    const graphemeLen = firstGrapheme(newText.slice(offset)).length || 1
    // operators在这里处理 `newText =`，完成这一小步状态转换。
    newText =
      newText.slice(0, offset) + char + newText.slice(offset + graphemeLen)
    // operators在这里处理 `offset += char.length`，完成这一小步状态转换。
    offset += char.length
  }

  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
  ctx.setOffset(Math.max(0, offset - char.length))
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'replace', char, count })
}

/**
 * Execute toggle case (~ command).
 */
// executeToggleCase 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeToggleCase(count: number, ctx: OperatorContext): void {
  // startOffset保存`ctx.cursor.offset`，供后续判断或组装使用。
  const startOffset = ctx.cursor.offset

  // 满足 `startOffset >= ctx.text.length` 时，operators执行该分支。
  if (startOffset >= ctx.text.length) return

  // newText 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  let newText = ctx.text
  // offset保存`startOffset`，供operators后续判断或输出使用。
  let offset = startOffset
  // toggled保存`0`，供operators后续判断或输出使用。
  let toggled = 0

  // while 使用 offset < newText.length && toggled < count 完成operators里的对应操作。
  while (offset < newText.length && toggled < count) {
    // grapheme保存`firstGrapheme`，供operators后续处理使用。
    const grapheme = firstGrapheme(newText.slice(offset))
    // graphemeLen保存 `grapheme.length` 的判断结果，供operators后续分支直接复用。
    const graphemeLen = grapheme.length

    // toggledGrapheme 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const toggledGrapheme =
      grapheme === grapheme.toUpperCase()
        ? grapheme.toLowerCase()
        : grapheme.toUpperCase()

    // operators在这里处理 `newText =`，完成这一小步状态转换。
    newText =
      newText.slice(0, offset) +
      toggledGrapheme +
      newText.slice(offset + graphemeLen)
    // operators在这里处理 `offset += toggledGrapheme.length`，完成这一小步状态转换。
    offset += toggledGrapheme.length
    // operators在这里处理 `toggled++`，完成这一小步状态转换。
    toggled++
  }

  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // Cursor moves to position after the last toggled character
  // At end of line, cursor can be at the "end" position
  // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
  ctx.setOffset(offset)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'toggleCase', count })
}

/**
 * Execute join lines (J command).
 */
// executeJoin 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeJoin(count: number, ctx: OperatorContext): void {
  // 文本 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  const text = ctx.text
  // 文本行格式化`text.split`，供operators后续处理使用。
  const lines = text.split('\n')
  // 从 `ctx.cursor.getPosition()` 解构 line，减少operators对同一对象的重复访问。
  const { line: currentLine } = ctx.cursor.getPosition()

  // 满足 `currentLine >= lines.length - 1` 时，operators执行该分支。
  if (currentLine >= lines.length - 1) return

  // linesToJoin保存`Math.min`，供operators后续处理使用。
  const linesToJoin = Math.min(count, lines.length - currentLine - 1)
  // joinedLine保存`lines[currentLine]!`，供operators后续判断或输出使用。
  let joinedLine = lines[currentLine]!
  // cursorPos 集合记录 `joinedLine.length` 是否成立，下一步按该结果分支。
  const cursorPos = joinedLine.length

  // 循环处理 `let i = 1; i <= linesToJoin; i++`，让operators逐项把同类条目按顺序走完。
  for (let i = 1; i <= linesToJoin; i++) {
    // nextLine格式化`trimStart`，供operators后续处理使用。
    const nextLine = (lines[currentLine + i] ?? '').trimStart()
    // 满足 `nextLine.length > 0` 时，operators执行该分支。
    if (nextLine.length > 0) {
      // 组合条件 `!joinedLine.endsWith(' ') && joinedLine.length > 0` 成立时，operators才启用这条专门路径。
      if (!joinedLine.endsWith(' ') && joinedLine.length > 0) {
        // operators在这里处理 `joinedLine += ' '`，完成这一小步状态转换。
        joinedLine += ' '
      }
      // operators在这里处理 `joinedLine += nextLine`，完成这一小步状态转换。
      joinedLine += nextLine
    }
  }

  // newLines 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const newLines = [
    ...lines.slice(0, currentLine),
    joinedLine,
    ...lines.slice(currentLine + linesToJoin + 1),
  ]

  // newText格式化`newLines.join`，供operators后续处理使用。
  const newText = newLines.join('\n')
  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
  ctx.setOffset(getLineStartOffset(newLines, currentLine) + cursorPos)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'join', count })
}

/**
 * Execute paste (p/P command).
 */
// executePaste 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executePaste(
  after: boolean,
  count: number,
  ctx: OperatorContext,
): void {
  // register读取`ctx.getRegister`，供operators后续处理使用。
  const register = ctx.getRegister()
  // register缺失时提前走兜底路径，避免operators继续依赖无效输入。
  if (!register) return

  // isLinewise记录 `register.endsWith` 是否成立，operators随后按该结果分支。
  const isLinewise = register.endsWith('\n')
  // 文本内容格式化`register.slice`，供operators后续处理使用。
  const content = isLinewise ? register.slice(0, -1) : register

  // 满足 `isLinewise` 时，operators执行该分支。
  if (isLinewise) {
    // 文本 命名 `ctx.text`，让后续代码直接表达这个值的用途。
    const text = ctx.text
    // 文本行格式化`text.split`，供operators后续处理使用。
    const lines = text.split('\n')
    // 从 `ctx.cursor.getPosition()` 解构 line，减少operators对同一对象的重复访问。
    const { line: currentLine } = ctx.cursor.getPosition()

    // insertLine保存`after ? currentLine + 1 : currentLine`，供后续判断或组装使用。
    const insertLine = after ? currentLine + 1 : currentLine
    // contentLines 集合格式化`content.split`，供operators后续处理使用。
    const contentLines = content.split('\n')
    // repeatedLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const repeatedLines: string[] = []
    // 按索引扫描 `count`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < count; i++) {
      // repeatedLines 集合追加新条目，保持收集顺序与输入顺序一致。
      repeatedLines.push(...contentLines)
    }

    // newLines 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const newLines = [
      ...lines.slice(0, insertLine),
      ...repeatedLines,
      ...lines.slice(insertLine),
    ]

    // newText格式化`newLines.join`，供operators后续处理使用。
    const newText = newLines.join('\n')
    // ctx.setText 写入新的状态值，使operators后续读取保持一致。
    ctx.setText(newText)
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(getLineStartOffset(newLines, insertLine))
  } else {
    // textToInsert保存`content.repeat`，供operators后续处理使用。
    const textToInsert = content.repeat(count)
    // insertPoint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const insertPoint =
      after && ctx.cursor.offset < ctx.text.length
        ? ctx.cursor.measuredText.nextOffset(ctx.cursor.offset)
        : ctx.cursor.offset

    // newText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const newText =
      ctx.text.slice(0, insertPoint) +
      textToInsert +
      ctx.text.slice(insertPoint)
    // lastGr保存`lastGrapheme`，供operators后续处理使用。
    const lastGr = lastGrapheme(textToInsert)
    // newOffset标记operators是否启用对应路径。
    const newOffset = insertPoint + textToInsert.length - (lastGr.length || 1)

    // ctx.setText 写入新的状态值，使operators后续读取保持一致。
    ctx.setText(newText)
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(Math.max(insertPoint, newOffset))
  }
}

/**
 * Execute indent (>> command).
 */
// executeIndent 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeIndent(
  dir: '>' | '<',
  count: number,
  ctx: OperatorContext,
): void {
  // 文本 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  const text = ctx.text
  // 文本行格式化`text.split`，供operators后续处理使用。
  const lines = text.split('\n')
  // 从 `ctx.cursor.getPosition()` 解构 line，减少operators对同一对象的重复访问。
  const { line: currentLine } = ctx.cursor.getPosition()
  // linesToAffect保存`Math.min`，供operators后续处理使用。
  const linesToAffect = Math.min(count, lines.length - currentLine)
  // indent 命名 `' ' // Two spaces`，让后续代码直接表达这个值的用途。
  const indent = '  ' // Two spaces

  // 按索引扫描 `linesToAffect`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < linesToAffect; i++) {
    // lineIdx保存`currentLine + i`，供operators后续判断或输出使用。
    const lineIdx = currentLine + i
    // line保存`lines[lineIdx] ?? ''`，供operators后续判断或输出使用。
    const line = lines[lineIdx] ?? ''

    // 当 `dir` 匹配 `'>'` 时，operators执行对应分支。
    if (dir === '>') {
      // lines[lineIdx更新为 `indent + line`，确保operators后续读取最新状态。
      lines[lineIdx] = indent + line
    // operators在这里处理 `} else if (line.startsWith(indent)) {`，完成这一小步状态转换。
    } else if (line.startsWith(indent)) {
      // lines[lineIdx更新为 `line.slice(indent.length)`，确保operators后续读取最新状态。
      lines[lineIdx] = line.slice(indent.length)
    // operators在这里处理 `} else if (line.startsWith('\t')) {`，完成这一小步状态转换。
    } else if (line.startsWith('\t')) {
      // lines[lineIdx更新为 `line.slice(1)`，确保operators后续读取最新状态。
      lines[lineIdx] = line.slice(1)
    } else {
      // Remove as much leading whitespace as possible up to indent length
      // removed保存`0`，供后续判断或组装使用。
      let removed = 0
      // idx保存`0`，供operators后续判断或输出使用。
      let idx = 0
      // 调用 while，触发operators此处需要的副作用。
      while (
        idx < line.length &&
        removed < indent.length &&
        /\s/.test(line[idx]!)
      ) {
        // operators在这里处理 `removed++`，完成这一小步状态转换。
        removed++
        // operators在这里处理 `idx++`，完成这一小步状态转换。
        idx++
      }
      // lines[lineIdx更新为 `line.slice(idx)`，确保operators后续读取最新状态。
      lines[lineIdx] = line.slice(idx)
    }
  }

  // newText格式化`lines.join`，供operators后续处理使用。
  const newText = lines.join('\n')
  // currentLineText读取 `lines[currentLine] ?? ''` 对应条目，后续围绕该成员继续处理。
  const currentLineText = lines[currentLine] ?? ''
  // firstNonBlank匹配`currentLineText.match`，供operators后续处理使用。
  const firstNonBlank = (currentLineText.match(/^\s*/)?.[0] ?? '').length

  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
  ctx.setOffset(getLineStartOffset(lines, currentLine) + firstNonBlank)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'indent', dir, count })
}

/**
 * Execute open line (o/O command).
 */
// executeOpenLine 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOpenLine(
  direction: 'above' | 'below',
  ctx: OperatorContext,
): void {
  // 文本 命名 `ctx.text`，让后续代码直接表达这个值的用途。
  const text = ctx.text
  // 文本行格式化`text.split`，供operators后续处理使用。
  const lines = text.split('\n')
  // 从 `ctx.cursor.getPosition()` 解构 line，减少operators对同一对象的重复访问。
  const { line: currentLine } = ctx.cursor.getPosition()

  // insertLine标记operators是否启用对应路径。
  const insertLine = direction === 'below' ? currentLine + 1 : currentLine
  // newLines 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const newLines = [
    ...lines.slice(0, insertLine),
    '',
    ...lines.slice(insertLine),
  ]

  // newText格式化`newLines.join`，供operators后续处理使用。
  const newText = newLines.join('\n')
  // ctx.setText 写入新的状态值，使operators后续读取保持一致。
  ctx.setText(newText)
  // 调用 ctx.enterInsert，触发operators此处需要的副作用。
  ctx.enterInsert(getLineStartOffset(newLines, insertLine))
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'openLine', direction })
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Calculate the offset of a line's start position.
 */
// getLineStartOffset 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLineStartOffset(lines: string[], lineIndex: number): number {
  // 返回 `lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0)`，作为operators这次计算的结果。
  return lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0)
}

// getOperatorRange 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOperatorRange(
  cursor: Cursor,
  target: Cursor,
  motion: string,
  op: Operator,
  count: number,
): { from: number; to: number; linewise: boolean } {
  // from保存`Math.min`，供operators后续处理使用。
  let from = Math.min(cursor.offset, target.offset)
  // to保存`Math.max`，供operators后续处理使用。
  let to = Math.max(cursor.offset, target.offset)
  // linewise标记operators是否启用对应路径。
  let linewise = false

  // Special case: cw/cW changes to end of word, not start of next word
  // 组合条件 `op === 'change' && (motion === 'w' || motion === 'W')` 成立时，operators才启用这条专门路径。
  if (op === 'change' && (motion === 'w' || motion === 'W')) {
    // For cw with count, move forward (count-1) words, then find end of that word
    // wordCursor保存`cursor`，供后续判断或组装使用。
    let wordCursor = cursor
    // 按索引扫描 `count - 1`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < count - 1; i++) {
      // operators在这里处理 `wordCursor =`，完成这一小步状态转换。
      wordCursor =
        motion === 'w' ? wordCursor.nextVimWord() : wordCursor.nextWORD()
    }
    // wordEnd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const wordEnd =
      motion === 'w' ? wordCursor.endOfVimWord() : wordCursor.endOfWORD()
    // to更新为 `cursor.measuredText.nextOffset(wordEnd.offset)`，确保operators后续读取最新状态。
    to = cursor.measuredText.nextOffset(wordEnd.offset)
  // operators在这里处理 `} else if (isLinewiseMotion(motion)) {`，完成这一小步状态转换。
  } else if (isLinewiseMotion(motion)) {
    // Linewise motions extend to include entire lines
    // linewise更新为 `true`，确保operators后续读取最新状态。
    linewise = true
    // 文本 命名 `cursor.text`，让后续代码直接表达这个值的用途。
    const text = cursor.text
    // nextNewline保存`text.indexOf`，供operators后续处理使用。
    const nextNewline = text.indexOf('\n', to)
    // 满足 `nextNewline === -1` 时，operators执行该分支。
    if (nextNewline === -1) {
      // Deleting to end of file - include the preceding newline if exists
      // to更新为 `text.length`，确保operators后续读取最新状态。
      to = text.length
      // 当 `from > 0 && text[from - 1]` 匹配 `'\n'` 时，operators执行对应分支。
      if (from > 0 && text[from - 1] === '\n') {
        // operators在这里处理 `from -= 1`，完成这一小步状态转换。
        from -= 1
      }
    } else {
      // to更新为 `nextNewline + 1`，确保operators后续读取最新状态。
      to = nextNewline + 1
    }
  // operators在这里处理 `} else if (isInclusiveMotion(motion) && cursor.offset <= target.offset)...`，完成这一小步状态转换。
  } else if (isInclusiveMotion(motion) && cursor.offset <= target.offset) {
    // to更新为 `cursor.measuredText.nextOffset(to)`，确保operators后续读取最新状态。
    to = cursor.measuredText.nextOffset(to)
  }

  // Word motions can land inside an [Image #N] chip; extend the range to
  // cover the whole chip so dw/cw/yw never leave a partial placeholder.
  // from更新为 `cursor.snapOutOfImageRef(from, 'start')`，确保operators后续读取最新状态。
  from = cursor.snapOutOfImageRef(from, 'start')
  // to更新为 `cursor.snapOutOfImageRef(to, 'end')`，确保operators后续读取最新状态。
  to = cursor.snapOutOfImageRef(to, 'end')

  // 返回结构化结果，集中表达operators已经整理出的状态。
  return { from, to, linewise }
}

/**
 * Get the range for a find-based operator.
 * Note: _findType is unused because Cursor.findCharacter already adjusts
 * the offset for t/T motions. All find types are treated as inclusive here.
 */
// getOperatorRangeForFind 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOperatorRangeForFind(
  cursor: Cursor,
  target: Cursor,
  _findType: FindType,
): { from: number; to: number } {
  // from保存`Math.min`，供operators后续处理使用。
  const from = Math.min(cursor.offset, target.offset)
  // maxOffset保存`Math.max`，供operators后续处理使用。
  const maxOffset = Math.max(cursor.offset, target.offset)
  // to保存`measuredText.nextOffset`，供operators后续处理使用。
  const to = cursor.measuredText.nextOffset(maxOffset)
  // 返回结构化结果，集中表达operators已经整理出的状态。
  return { from, to }
}

// applyOperator 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyOperator(
  op: Operator,
  from: number,
  to: number,
  ctx: OperatorContext,
  linewise: boolean = false,
): void {
  // 文本内容格式化`text.slice`，供operators后续处理使用。
  let content = ctx.text.slice(from, to)
  // Ensure linewise content ends with newline for paste detection
  // 组合条件 `linewise && !content.endsWith('\n')` 成立时，operators才启用这条专门路径。
  if (linewise && !content.endsWith('\n')) {
    // 文本内容更新为 `content + '\n'`，确保operators后续读取最新状态。
    content = content + '\n'
  }
  // ctx.setRegister 写入新的状态值，使operators后续读取保持一致。
  ctx.setRegister(content, linewise)

  // 当 `op` 匹配 `'yank'` 时，operators执行对应分支。
  if (op === 'yank') {
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(from)
  // operators在这里处理 `} else if (op === 'delete') {`，完成这一小步状态转换。
  } else if (op === 'delete') {
    // newText格式化`text.slice`，供operators后续处理使用。
    const newText = ctx.text.slice(0, from) + ctx.text.slice(to)
    // ctx.setText 写入新的状态值，使operators后续读取保持一致。
    ctx.setText(newText)
    // maxOff保存`Math.max`，供operators后续处理使用。
    const maxOff = Math.max(
      0,
      newText.length - (lastGrapheme(newText).length || 1),
    )
    // ctx.setOffset 写入新的状态值，使operators后续读取保持一致。
    ctx.setOffset(Math.min(from, maxOff))
  // operators在这里处理 `} else if (op === 'change') {`，完成这一小步状态转换。
  } else if (op === 'change') {
    // newText格式化`text.slice`，供operators后续处理使用。
    const newText = ctx.text.slice(0, from) + ctx.text.slice(to)
    // ctx.setText 写入新的状态值，使operators后续读取保持一致。
    ctx.setText(newText)
    // 调用 ctx.enterInsert，触发operators此处需要的副作用。
    ctx.enterInsert(from)
  }
}

// executeOperatorG 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOperatorG(
  op: Operator,
  count: number,
  ctx: OperatorContext,
): void {
  // count=1 means no count given, target = end of file
  // otherwise target = line N
  // target 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const target =
    count === 1 ? ctx.cursor.startOfLastLine() : ctx.cursor.goToLine(count)

  // 满足 `target.equals(ctx.cursor)` 时，operators执行该分支。
  if (target.equals(ctx.cursor)) return

  // range读取`getOperatorRange`，供operators后续处理使用。
  const range = getOperatorRange(ctx.cursor, target, 'G', op, count)
  // 调用 applyOperator，触发operators此处需要的副作用。
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operator', op, motion: 'G', count })
}

// executeOperatorGg 封装operators的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeOperatorGg(
  op: Operator,
  count: number,
  ctx: OperatorContext,
): void {
  // count=1 means no count given, target = first line
  // otherwise target = line N
  // target 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const target =
    count === 1 ? ctx.cursor.startOfFirstLine() : ctx.cursor.goToLine(count)

  // 满足 `target.equals(ctx.cursor)` 时，operators执行该分支。
  if (target.equals(ctx.cursor)) return

  // range读取`getOperatorRange`，供operators后续处理使用。
  const range = getOperatorRange(ctx.cursor, target, 'gg', op, count)
  // 调用 applyOperator，触发operators此处需要的副作用。
  applyOperator(op, range.from, range.to, ctx, range.linewise)
  // 调用 ctx.recordChange，触发operators此处需要的副作用。
  ctx.recordChange({ type: 'operator', op, motion: 'gg', count })
}
