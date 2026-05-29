/**
 * Vim State Transition Table
 *
 * This is the scannable source of truth for state transitions.
 * To understand what happens in any state, look up that state's transition function.
 */

// 引入 resolveMotion，将 ./motions.js 中已经封装好的能力接到本文件流程里。
import { resolveMotion } from './motions.js'
// 整理这一组导入，让transitions后续逻辑可以直接复用这些外部能力。
import {
  executeIndent,
  executeJoin,
  executeLineOp,
  executeOpenLine,
  executeOperatorFind,
  executeOperatorG,
  executeOperatorGg,
  executeOperatorMotion,
  executeOperatorTextObj,
  executePaste,
  executeReplace,
  executeToggleCase,
  executeX,
  type OperatorContext,
} from './operators.js'
// 整理这一组导入，让transitions后续逻辑可以直接复用这些外部能力。
import {
  type CommandState,
  FIND_KEYS,
  type FindType,
  isOperatorKey,
  isTextObjScopeKey,
  MAX_VIM_COUNT,
  OPERATORS,
  type Operator,
  SIMPLE_MOTIONS,
  TEXT_OBJ_SCOPES,
  TEXT_OBJ_TYPES,
  type TextObjScope,
} from './types.js'

/**
 * Context passed to transition functions.
 */
// TransitionContext 固化transitions里传递的数据形状，帮助调用方按同一结构读写字段。
export type TransitionContext = OperatorContext & {
  onUndo?: () => void
  onDotRepeat?: () => void
}

/**
 * Result of a transition.
 */
// TransitionResult 固化transitions里传递的数据形状，帮助调用方按同一结构读写字段。
export type TransitionResult = {
  next?: CommandState
  execute?: () => void
}

/**
 * Main transition function. Dispatches based on current state type.
 */
// transition 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function transition(
  state: CommandState,
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 按照 state.type 的取值选择transitions的具体处理分支。
  switch (state.type) {
    case 'idle':
      // 返回 `fromIdle(input, ctx)`，作为transitions这次计算的结果。
      return fromIdle(input, ctx)
    case 'count':
      // 返回 `fromCount(state, input, ctx)`，作为transitions这次计算的结果。
      return fromCount(state, input, ctx)
    case 'operator':
      // 返回 `fromOperator(state, input, ctx)`，作为transitions这次计算的结果。
      return fromOperator(state, input, ctx)
    case 'operatorCount':
      // 返回 `fromOperatorCount(state, input, ctx)`，作为transitions这次计算的结果。
      return fromOperatorCount(state, input, ctx)
    case 'operatorFind':
      // 返回 `fromOperatorFind(state, input, ctx)`，作为transitions这次计算的结果。
      return fromOperatorFind(state, input, ctx)
    case 'operatorTextObj':
      // 返回 `fromOperatorTextObj(state, input, ctx)`，作为transitions这次计算的结果。
      return fromOperatorTextObj(state, input, ctx)
    case 'find':
      // 返回 `fromFind(state, input, ctx)`，作为transitions这次计算的结果。
      return fromFind(state, input, ctx)
    case 'g':
      // 返回 `fromG(state, input, ctx)`，作为transitions这次计算的结果。
      return fromG(state, input, ctx)
    case 'operatorG':
      // 返回 `fromOperatorG(state, input, ctx)`，作为transitions这次计算的结果。
      return fromOperatorG(state, input, ctx)
    case 'replace':
      // 返回 `fromReplace(state, input, ctx)`，作为transitions这次计算的结果。
      return fromReplace(state, input, ctx)
    case 'indent':
      // 返回 `fromIndent(state, input, ctx)`，作为transitions这次计算的结果。
      return fromIndent(state, input, ctx)
  }
}

// ============================================================================
// Shared Input Handling
// ============================================================================

/**
 * Handle input that's valid in both idle and count states.
 * Returns null if input is not recognized.
 */
// handleNormalInput 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleNormalInput(
  input: string,
  count: number,
  ctx: TransitionContext,
): TransitionResult | null {
  // 满足 `isOperatorKey(input)` 时，transitions执行该分支。
  if (isOperatorKey(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'operator', op: OPERATORS[input], count } }
  }

  // 满足 `SIMPLE_MOTIONS.has(input)` 时，transitions执行该分支。
  if (SIMPLE_MOTIONS.has(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
      execute: () => {
        // target读取`resolveMotion`，供transitions后续处理使用。
        const target = resolveMotion(input, ctx.cursor, count)
        // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
        ctx.setOffset(target.offset)
      },
    }
  }

  // 满足 `FIND_KEYS.has(input)` 时，transitions执行该分支。
  if (FIND_KEYS.has(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'find', find: input as FindType, count } }
  }

  // 当 `input` 匹配 `'g'` 时，transitions执行对应分支。
  if (input === 'g') return { next: { type: 'g', count } }
  // 当 `input` 匹配 `'r'` 时，transitions执行对应分支。
  if (input === 'r') return { next: { type: 'replace', count } }
  // 当 `input` 匹配 `'>' || input === '<'` 时，transitions执行对应分支。
  if (input === '>' || input === '<') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'indent', dir: input, count } }
  }
  // 当 `input` 匹配 `'~'` 时，transitions执行对应分支。
  if (input === '~') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeToggleCase(count, ctx) }
  }
  // 当 `input` 匹配 `'x'` 时，transitions执行对应分支。
  if (input === 'x') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeX(count, ctx) }
  }
  // 当 `input` 匹配 `'J'` 时，transitions执行对应分支。
  if (input === 'J') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeJoin(count, ctx) }
  }
  // 当 `input` 匹配 `'p' || input === 'P'` 时，transitions执行对应分支。
  if (input === 'p' || input === 'P') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executePaste(input === 'p', count, ctx) }
  }
  // 当 `input` 匹配 `'D'` 时，transitions执行对应分支。
  if (input === 'D') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOperatorMotion('delete', '$', 1, ctx) }
  }
  // 当 `input` 匹配 `'C'` 时，transitions执行对应分支。
  if (input === 'C') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOperatorMotion('change', '$', 1, ctx) }
  }
  // 当 `input` 匹配 `'Y'` 时，transitions执行对应分支。
  if (input === 'Y') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeLineOp('yank', count, ctx) }
  }
  // 当 `input` 匹配 `'G'` 时，transitions执行对应分支。
  if (input === 'G') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
      execute: () => {
        // count=1 means no count given, go to last line
        // otherwise go to line N
        // 满足 `count === 1` 时，transitions执行该分支。
        if (count === 1) {
          // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
          ctx.setOffset(ctx.cursor.startOfLastLine().offset)
        } else {
          // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
          ctx.setOffset(ctx.cursor.goToLine(count).offset)
        }
      },
    }
  }
  // 当 `input` 匹配 `'.'` 时，transitions执行对应分支。
  if (input === '.') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => ctx.onDotRepeat?.() }
  }
  // 当 `input` 匹配 `';' || input === ','` 时，transitions执行对应分支。
  if (input === ';' || input === ',') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeRepeatFind(input === ',', count, ctx) }
  }
  // 当 `input` 匹配 `'u'` 时，transitions执行对应分支。
  if (input === 'u') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => ctx.onUndo?.() }
  }
  // 当 `input` 匹配 `'i'` 时，transitions执行对应分支。
  if (input === 'i') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => ctx.enterInsert(ctx.cursor.offset) }
  }
  // 当 `input` 匹配 `'I'` 时，transitions执行对应分支。
  if (input === 'I') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () =>，负责transitions在该局部场景下的响应。
      execute: () =>
        ctx.enterInsert(ctx.cursor.firstNonBlankInLogicalLine().offset),
    }
  }
  // 当 `input` 匹配 `'a'` 时，transitions执行对应分支。
  if (input === 'a') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
      execute: () => {
        // newOffset保存`cursor.isAtEnd`，供transitions后续处理使用。
        const newOffset = ctx.cursor.isAtEnd()
          ? ctx.cursor.offset
          : ctx.cursor.right().offset
        // 调用 ctx.enterInsert，触发transitions此处需要的副作用。
        ctx.enterInsert(newOffset)
      },
    }
  }
  // 当 `input` 匹配 `'A'` 时，transitions执行对应分支。
  if (input === 'A') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => ctx.enterInsert(ctx.cursor.endOfLogicalLine().offset),，负责transitions在该局部场景下的响应。
      execute: () => ctx.enterInsert(ctx.cursor.endOfLogicalLine().offset),
    }
  }
  // 当 `input` 匹配 `'o'` 时，transitions执行对应分支。
  if (input === 'o') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOpenLine('below', ctx) }
  }
  // 当 `input` 匹配 `'O'` 时，transitions执行对应分支。
  if (input === 'O') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOpenLine('above', ctx) }
  }

  // 返回 `null`，作为transitions这次计算的结果。
  return null
}

/**
 * Handle operator input (motion, find, text object scope).
 * Returns null if input is not recognized.
 */
// handleOperatorInput 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleOperatorInput(
  op: Operator,
  count: number,
  input: string,
  ctx: TransitionContext,
): TransitionResult | null {
  // 满足 `isTextObjScopeKey(input)` 时，transitions执行该分支。
  if (isTextObjScopeKey(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      next: {
        type: 'operatorTextObj',
        op,
        count,
        scope: TEXT_OBJ_SCOPES[input],
      },
    }
  }

  // 满足 `FIND_KEYS.has(input)` 时，transitions执行该分支。
  if (FIND_KEYS.has(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      next: { type: 'operatorFind', op, count, find: input as FindType },
    }
  }

  // 满足 `SIMPLE_MOTIONS.has(input)` 时，transitions执行该分支。
  if (SIMPLE_MOTIONS.has(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOperatorMotion(op, input, count, ctx) }
  }

  // 当 `input` 匹配 `'G'` 时，transitions执行对应分支。
  if (input === 'G') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOperatorG(op, count, ctx) }
  }

  // 当 `input` 匹配 `'g'` 时，transitions执行对应分支。
  if (input === 'g') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'operatorG', op, count } }
  }

  // 返回 `null`，作为transitions这次计算的结果。
  return null
}

// ============================================================================
// Transition Functions - One per state type
// ============================================================================

// fromIdle 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromIdle(input: string, ctx: TransitionContext): TransitionResult {
  // 0 is line-start motion, not a count prefix
  // 满足 `/[1-9]/.test(input)` 时，transitions执行该分支。
  if (/[1-9]/.test(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'count', digits: input } }
  }
  // 当 `input` 匹配 `'0'` 时，transitions执行对应分支。
  if (input === '0') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => ctx.setOffset(ctx.cursor.startOfLogicalLine().offset),，负责transitions在该局部场景下的响应。
      execute: () => ctx.setOffset(ctx.cursor.startOfLogicalLine().offset),
    }
  }

  // 结果保存`handleNormalInput`，供transitions后续处理使用。
  const result = handleNormalInput(input, 1, ctx)
  // 满足 `result` 时，transitions执行该分支。
  if (result) return result

  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return {}
}

// fromCount 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromCount(
  state: { type: 'count'; digits: string },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 满足 `/[0-9]/.test(input)` 时，transitions执行该分支。
  if (/[0-9]/.test(input)) {
    // newDigits 集合 命名 `state.digits + input`，让后续代码直接表达这个值的用途。
    const newDigits = state.digits + input
    // count 数量保存`Math.min`，供transitions后续处理使用。
    const count = Math.min(parseInt(newDigits, 10), MAX_VIM_COUNT)
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { type: 'count', digits: String(count) } }
  }

  // count 数量解析`parseInt`，供transitions后续处理使用。
  const count = parseInt(state.digits, 10)
  // 结果保存`handleNormalInput`，供transitions后续处理使用。
  const result = handleNormalInput(input, count, ctx)
  // 满足 `result` 时，transitions执行该分支。
  if (result) return result

  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromOperator 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromOperator(
  state: { type: 'operator'; op: Operator; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // dd, cc, yy = line operation
  // 满足 `input === state.op[0]` 时，transitions执行该分支。
  if (input === state.op[0]) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeLineOp(state.op, state.count, ctx) }
  }

  // 满足 `/[0-9]/.test(input)` 时，transitions执行该分支。
  if (/[0-9]/.test(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      next: {
        type: 'operatorCount',
        op: state.op,
        count: state.count,
        digits: input,
      },
    }
  }

  // 结果保存`handleOperatorInput`，供transitions后续处理使用。
  const result = handleOperatorInput(state.op, state.count, input, ctx)
  // 满足 `result` 时，transitions执行该分支。
  if (result) return result

  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromOperatorCount 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromOperatorCount(
  state: {
    type: 'operatorCount'
    op: Operator
    count: number
    digits: string
  },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 满足 `/[0-9]/.test(input)` 时，transitions执行该分支。
  if (/[0-9]/.test(input)) {
    // newDigits 集合 命名 `state.digits + input`，让后续代码直接表达这个值的用途。
    const newDigits = state.digits + input
    // parsedDigits 集合保存`Math.min`，供transitions后续处理使用。
    const parsedDigits = Math.min(parseInt(newDigits, 10), MAX_VIM_COUNT)
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { next: { ...state, digits: String(parsedDigits) } }
  }

  // motionCount 数量解析`parseInt`，供transitions后续处理使用。
  const motionCount = parseInt(state.digits, 10)
  // effectiveCount 数量统计`state.count * motionCount` 整理出中间结果，供transitions后续步骤使用。
  const effectiveCount = state.count * motionCount
  // 结果保存`handleOperatorInput`，供transitions后续处理使用。
  const result = handleOperatorInput(state.op, effectiveCount, input, ctx)
  // 满足 `result` 时，transitions执行该分支。
  if (result) return result

  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromOperatorFind 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromOperatorFind(
  state: {
    type: 'operatorFind'
    op: Operator
    count: number
    find: FindType
  },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return {
    // 这个回调绑定到 execute: () =>，负责transitions在该局部场景下的响应。
    execute: () =>
      executeOperatorFind(state.op, state.find, input, state.count, ctx),
  }
}

// fromOperatorTextObj 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromOperatorTextObj(
  state: {
    type: 'operatorTextObj'
    op: Operator
    count: number
    scope: TextObjScope
  },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 满足 `TEXT_OBJ_TYPES.has(input)` 时，transitions执行该分支。
  if (TEXT_OBJ_TYPES.has(input)) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () =>，负责transitions在该局部场景下的响应。
      execute: () =>
        executeOperatorTextObj(state.op, state.scope, input, state.count, ctx),
    }
  }
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromFind 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromFind(
  state: { type: 'find'; find: FindType; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return {
    // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
    execute: () => {
      // 结果筛选`cursor.findCharacter`，供transitions后续处理使用。
      const result = ctx.cursor.findCharacter(input, state.find, state.count)
      // `result` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (result !== null) {
        // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
        ctx.setOffset(result)
        // ctx.setLastFind 写入新的状态值，使transitions后续读取保持一致。
        ctx.setLastFind(state.find, input)
      }
    },
  }
}

// fromG 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromG(
  state: { type: 'g'; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 当 `input` 匹配 `'j' || input === 'k'` 时，transitions执行对应分支。
  if (input === 'j' || input === 'k') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
      execute: () => {
        // target读取`resolveMotion`，供transitions后续处理使用。
        const target = resolveMotion(`g${input}`, ctx.cursor, state.count)
        // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
        ctx.setOffset(target.offset)
      },
    }
  }
  // 当 `input` 匹配 `'g'` 时，transitions执行对应分支。
  if (input === 'g') {
    // If count provided (e.g., 5gg), go to that line. Otherwise go to first line.
    // 满足 `state.count > 1` 时，transitions执行该分支。
    if (state.count > 1) {
      // 返回结构化结果，集中表达transitions已经整理出的状态。
      return {
        // 这个回调绑定到 execute: () => {，负责transitions在该局部场景下的响应。
        execute: () => {
          // 文本行格式化`text.split`，供transitions后续处理使用。
          const lines = ctx.text.split('\n')
          // targetLine保存`Math.min`，供transitions后续处理使用。
          const targetLine = Math.min(state.count - 1, lines.length - 1)
          // offset保存`0`，供transitions后续判断或输出使用。
          let offset = 0
          // 按索引扫描 `targetLine`，需要消费相邻参数时可以精确移动游标。
          for (let i = 0; i < targetLine; i++) {
            // transitions在这里处理 `offset += (lines[i]?.length ?? 0) + 1 // +1 for newline`，完成这一小步状态转换。
            offset += (lines[i]?.length ?? 0) + 1 // +1 for newline
          }
          // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
          ctx.setOffset(offset)
        },
      }
    }
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () => ctx.setOffset(ctx.cursor.startOfFirstLine().offset),，负责transitions在该局部场景下的响应。
      execute: () => ctx.setOffset(ctx.cursor.startOfFirstLine().offset),
    }
  }
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromOperatorG 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromOperatorG(
  state: { type: 'operatorG'; op: Operator; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 当 `input` 匹配 `'j' || input === 'k'` 时，transitions执行对应分支。
  if (input === 'j' || input === 'k') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return {
      // 这个回调绑定到 execute: () =>，负责transitions在该局部场景下的响应。
      execute: () =>
        executeOperatorMotion(state.op, `g${input}`, state.count, ctx),
    }
  }
  // 当 `input` 匹配 `'g'` 时，transitions执行对应分支。
  if (input === 'g') {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeOperatorGg(state.op, state.count, ctx) }
  }
  // Any other input cancels the operator
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// fromReplace 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromReplace(
  state: { type: 'replace'; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // Backspace/Delete arrive as empty input in literal-char states. In vim,
  // r<BS> cancels the replace; without this guard, executeReplace("") would
  // delete the character under the cursor instead.
  // 满足 `input === ''` 时，transitions执行该分支。
  if (input === '') return { next: { type: 'idle' } }
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { execute: () => executeReplace(input, state.count, ctx) }
}

// fromIndent 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fromIndent(
  state: { type: 'indent'; dir: '>' | '<'; count: number },
  input: string,
  ctx: TransitionContext,
): TransitionResult {
  // 满足 `input === state.dir` 时，transitions执行该分支。
  if (input === state.dir) {
    // 返回结构化结果，集中表达transitions已经整理出的状态。
    return { execute: () => executeIndent(state.dir, state.count, ctx) }
  }
  // 返回结构化结果，集中表达transitions已经整理出的状态。
  return { next: { type: 'idle' } }
}

// ============================================================================
// Helper functions for special commands
// ============================================================================

// executeRepeatFind 封装transitions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function executeRepeatFind(
  reverse: boolean,
  count: number,
  ctx: TransitionContext,
): void {
  // lastFind读取`ctx.getLastFind`，供transitions后续处理使用。
  const lastFind = ctx.getLastFind()
  // lastFind缺失时提前走兜底路径，避免transitions继续依赖无效输入。
  if (!lastFind) return

  // Determine the effective find type based on reverse
  // findType保存`lastFind.type`，供transitions后续判断或输出使用。
  let findType = lastFind.type
  // 满足 `reverse` 时，transitions执行该分支。
  if (reverse) {
    // Flip the direction
    // flipMap 集中保存transitions要一起传递的字段。
    const flipMap: Record<FindType, FindType> = {
      f: 'F',
      F: 'f',
      t: 'T',
      T: 't',
    }
    // findType更新为 `flipMap[findType]`，确保transitions后续读取最新状态。
    findType = flipMap[findType]
  }

  // 结果筛选`cursor.findCharacter`，供transitions后续处理使用。
  const result = ctx.cursor.findCharacter(lastFind.char, findType, count)
  // `result` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (result !== null) {
    // ctx.setOffset 写入新的状态值，使transitions后续读取保持一致。
    ctx.setOffset(result)
  }
}
