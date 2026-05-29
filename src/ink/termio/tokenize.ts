/**
 * Input Tokenizer - Escape sequence boundary detection
 *
 * Splits terminal input into tokens: text chunks and raw escape sequences.
 * Unlike the Parser which interprets sequences semantically, this just
 * identifies boundaries for use by keyboard input parsing.
 */

// 引入 C0、ESC_TYPE、isEscFinal，将 ./ansi.js 中已经封装好的能力接到本文件流程里。
import { C0, ESC_TYPE, isEscFinal } from './ansi.js'
// 引入 isCSIFinal、isCSIIntermediate、isCSIParam，将 ./csi.js 中已经封装好的能力接到本文件流程里。
import { isCSIFinal, isCSIIntermediate, isCSIParam } from './csi.js'

// Token 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Token =
  | { type: 'text'; value: string }
  | { type: 'sequence'; value: string }

// State 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type State =
  | 'ground'
  | 'escape'
  | 'escapeIntermediate'
  | 'csi'
  | 'ss3'
  | 'osc'
  | 'dcs'
  | 'apc'

// Tokenizer 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Tokenizer = {
  /** Feed input and get resulting tokens */
  feed(input: string): Token[]
  /** Flush any buffered incomplete sequences */
  flush(): Token[]
  /** Reset tokenizer state */
  // reset 使用 无 完成终端渲染里的对应操作。
  reset(): void
  /** Get any buffered incomplete sequence */
  // buffer 使用 无 完成终端渲染里的对应操作。
  buffer(): string
}

// TokenizerOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TokenizerOptions = {
  /**
   * Treat `CSI M` as an X10 mouse event prefix and consume 3 payload bytes.
   * Only enable for stdin input — `\x1b[M` is also CSI DL (Delete Lines) in
   * output streams, and enabling this there swallows display text. Default false.
   */
  x10Mouse?: boolean
}

/**
 * Create a streaming tokenizer for terminal input.
 *
 * Usage:
 * ```typescript
 * const tokenizer = createTokenizer()
 * const tokens1 = tokenizer.feed('hello\x1b[')
 * const tokens2 = tokenizer.feed('A')  // completes the escape sequence
 * const remaining = tokenizer.flush()  // force output incomplete sequences
 * ```
 */
// createTokenizer 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createTokenizer(options?: TokenizerOptions): Tokenizer {
  // currentState 状态 命名 `'ground'`，让后续代码直接表达这个值的用途。
  let currentState: State = 'ground'
  // currentBuffer 命名 `''`，让后续代码直接表达这个值的用途。
  let currentBuffer = ''
  // x10Mouse保存`options?.x10Mouse ?? false`，供后续判断或组装使用。
  const x10Mouse = options?.x10Mouse ?? false

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    // feed 使用 input: string 完成终端渲染里的对应操作。
    feed(input: string): Token[] {
      // 结果保存`tokenize`，供终端渲染后续处理使用。
      const result = tokenize(
        input,
        currentState,
        currentBuffer,
        false,
        x10Mouse,
      )
      // currentState 状态更新为 `result.state.state`，确保Ink 渲染层后续读取最新状态。
      currentState = result.state.state
      // currentBuffer更新为 `result.state.buffer`，确保Ink 渲染层后续读取最新状态。
      currentBuffer = result.state.buffer
      // 返回 `result.tokens`，作为终端渲染这次计算的结果。
      return result.tokens
    },

    // flush 使用 无 完成终端渲染里的对应操作。
    flush(): Token[] {
      // 结果保存`tokenize`，供终端渲染后续处理使用。
      const result = tokenize('', currentState, currentBuffer, true, x10Mouse)
      // currentState 状态更新为 `result.state.state`，确保Ink 渲染层后续读取最新状态。
      currentState = result.state.state
      // currentBuffer更新为 `result.state.buffer`，确保Ink 渲染层后续读取最新状态。
      currentBuffer = result.state.buffer
      // 返回 `result.tokens`，作为终端渲染这次计算的结果。
      return result.tokens
    },

    // reset 使用 无 完成终端渲染里的对应操作。
    reset(): void {
      // currentState 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
      currentState = 'ground'
      // currentBuffer更新为 `''`，确保Ink 渲染层后续读取最新状态。
      currentBuffer = ''
    },

    // buffer 使用 无 完成终端渲染里的对应操作。
    buffer(): string {
      // 返回 `currentBuffer`，作为终端渲染这次计算的结果。
      return currentBuffer
    },
  }
}

// InternalState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type InternalState = {
  state: State
  buffer: string
}

// tokenize 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tokenize(
  input: string,
  initialState: State,
  initialBuffer: string,
  flush: boolean,
  x10Mouse: boolean,
): { tokens: Token[]; state: InternalState } {
  // token 列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const tokens: Token[] = []
  // 结果 集中保存Ink 渲染层 tokenize要一起传递的字段。
  const result: InternalState = {
    state: initialState,
    buffer: '',
  }

  // data 命名 `initialBuffer + input`，让后续代码直接表达这个值的用途。
  const data = initialBuffer + input
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // textStart保存`0`，供Ink 渲染层 tokenize后续判断或输出使用。
  let textStart = 0
  // seqStart保存`0`，供Ink 渲染层 tokenize后续判断或输出使用。
  let seqStart = 0

  // flushText封装成回调，供Ink 渲染层 tokenize在事件触发或异步步骤中调用。
  const flushText = (): void => {
    // 满足 `i > textStart` 时，终端渲染执行该分支。
    if (i > textStart) {
      // 文本格式化`data.slice`，供终端渲染后续处理使用。
      const text = data.slice(textStart, i)
      // 满足 `text` 时，终端渲染执行该分支。
      if (text) {
        // token 列表追加新条目，保持收集顺序与输入顺序一致。
        tokens.push({ type: 'text', value: text })
      }
    }
    // textStart更新为 `i`，确保Ink 渲染层后续读取最新状态。
    textStart = i
  }

  // emitSequence封装成回调，供Ink 渲染层 tokenize在事件触发或异步步骤中调用。
  const emitSequence = (seq: string): void => {
    // 满足 `seq` 时，终端渲染执行该分支。
    if (seq) {
      // token 列表追加新条目，保持收集顺序与输入顺序一致。
      tokens.push({ type: 'sequence', value: seq })
    }
    // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
    result.state = 'ground'
    // textStart更新为 `i`，确保Ink 渲染层后续读取最新状态。
    textStart = i
  }

  // while 使用 i < data.length 完成终端渲染里的对应操作。
  while (i < data.length) {
    // code保存`data.charCodeAt`，供终端渲染后续处理使用。
    const code = data.charCodeAt(i)

    // 按照 result.state 的取值选择终端渲染的具体处理分支。
    switch (result.state) {
      case 'ground':
        // 满足 `code === C0.ESC` 时，终端渲染执行该分支。
        if (code === C0.ESC) {
          // 调用 flushText，触发终端渲染此处需要的副作用。
          flushText()
          // seqStart更新为 `i`，确保Ink 渲染层后续读取最新状态。
          seqStart = i
          // 状态更新为 `'escape'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'escape'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        } else {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'escape':
        // 满足 `code === ESC_TYPE.CSI` 时，终端渲染执行该分支。
        if (code === ESC_TYPE.CSI) {
          // 状态更新为 `'csi'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'csi'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (code === ESC_TYPE.OSC) {`，完成这一小步状态转换。
        } else if (code === ESC_TYPE.OSC) {
          // 状态更新为 `'osc'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'osc'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (code === ESC_TYPE.DCS) {`，完成这一小步状态转换。
        } else if (code === ESC_TYPE.DCS) {
          // 状态更新为 `'dcs'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'dcs'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (code === ESC_TYPE.APC) {`，完成这一小步状态转换。
        } else if (code === ESC_TYPE.APC) {
          // 状态更新为 `'apc'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'apc'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (code === 0x4f) {`，完成这一小步状态转换。
        } else if (code === 0x4f) {
          // 'O' - SS3
          // 状态更新为 `'ss3'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'ss3'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (isCSIIntermediate(code)) {`，完成这一小步状态转换。
        } else if (isCSIIntermediate(code)) {
          // Intermediate byte (e.g., ESC ( for charset) - continue buffering
          // 状态更新为 `'escapeIntermediate'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'escapeIntermediate'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (isEscFinal(code)) {`，完成这一小步状态转换。
        } else if (isEscFinal(code)) {
          // Two-character escape sequence
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        // Ink 渲染层 tokenize在这里处理 `} else if (code === C0.ESC) {`，完成这一小步状态转换。
        } else if (code === C0.ESC) {
          // Double escape - emit first, start new
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
          // seqStart更新为 `i`，确保Ink 渲染层后续读取最新状态。
          seqStart = i
          // 状态更新为 `'escape'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'escape'
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        } else {
          // Invalid - treat ESC as text
          // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'ground'
          // textStart更新为 `seqStart`，确保Ink 渲染层后续读取最新状态。
          textStart = seqStart
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'escapeIntermediate':
        // After intermediate byte(s), wait for final byte
        // 满足 `isCSIIntermediate(code)` 时，终端渲染执行该分支。
        if (isCSIIntermediate(code)) {
          // More intermediate bytes
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        // Ink 渲染层 tokenize在这里处理 `} else if (isEscFinal(code)) {`，完成这一小步状态转换。
        } else if (isEscFinal(code)) {
          // Final byte - complete the sequence
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        } else {
          // Invalid - treat as text
          // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'ground'
          // textStart更新为 `seqStart`，确保Ink 渲染层后续读取最新状态。
          textStart = seqStart
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'csi':
        // X10 mouse: CSI M + 3 raw payload bytes (Cb+32, Cx+32, Cy+32).
        // M immediately after [ (offset 2) means no params — SGR mouse
        // (CSI < … M) has a `<` param byte first and reaches M at offset > 2.
        // Terminals that ignore DECSET 1006 but honor 1000/1002 emit this
        // legacy encoding; without this branch the 3 payload bytes leak
        // through as text (`` `rK `` / `arK` garbage in the prompt).
        //
        // Gated on x10Mouse — `\x1b[M` is also CSI DL (Delete Lines) and
        // blindly consuming 3 chars corrupts output rendering (Parser/Ansi)
        // and fragments bracketed-paste PASTE_END. Only stdin enables this.
        // The ≥0x20 check on each payload slot is belt-and-suspenders: X10
        // guarantees Cb≥32, Cx≥33, Cy≥33, so a control byte (ESC=0x1B) in
        // any slot means this is CSI DL adjacent to another sequence, not a
        // mouse event. Checking all three slots prevents PASTE_END's ESC
        // from being consumed when paste content ends in `\x1b[M`+0-2 chars.
        //
        // Known limitation: this counts JS string chars, but X10 is byte-
        // oriented and stdin uses utf8 encoding (App.tsx). At col 162-191 ×
        // row 96-159 the two coord bytes (0xC2-0xDF, 0x80-0xBF) form a valid
        // UTF-8 2-byte sequence and collapse to one char — the length check
        // fails and the event buffers until the next keypress absorbs it.
        // Fixing this requires latin1 stdin; X10's 223-coord cap is exactly
        // why SGR was invented, and no-SGR terminals at 162+ cols are rare.
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          x10Mouse &&
          code === 0x4d /* M */ &&
          i - seqStart === 2 &&
          (i + 1 >= data.length || data.charCodeAt(i + 1) >= 0x20) &&
          (i + 2 >= data.length || data.charCodeAt(i + 2) >= 0x20) &&
          (i + 3 >= data.length || data.charCodeAt(i + 3) >= 0x20)
        ) {
          // 满足 `i + 4 <= data.length` 时，终端渲染执行该分支。
          if (i + 4 <= data.length) {
            // Ink 渲染层 tokenize在这里处理 `i += 4`，完成这一小步状态转换。
            i += 4
            // 调用 emitSequence，触发终端渲染此处需要的副作用。
            emitSequence(data.slice(seqStart, i))
          } else {
            // Incomplete — exit loop; end-of-input buffers from seqStart.
            // Re-entry re-tokenizes from ground via the invalid-CSI fallthrough.
            // i更新为 `data.length`，确保Ink 渲染层后续读取最新状态。
            i = data.length
          }
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        }
        // 满足 `isCSIFinal(code)` 时，终端渲染执行该分支。
        if (isCSIFinal(code)) {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        // Ink 渲染层 tokenize在这里处理 `} else if (isCSIParam(code) || isCSIIntermediate(code)) {`，完成这一小步状态转换。
        } else if (isCSIParam(code) || isCSIIntermediate(code)) {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        } else {
          // Invalid CSI - abort, treat as text
          // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'ground'
          // textStart更新为 `seqStart`，确保Ink 渲染层后续读取最新状态。
          textStart = seqStart
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'ss3':
        // SS3 sequences: ESC O followed by a single final byte
        // 只有 `code >= 0x40 && code <= 0x7e` 满足时，终端渲染才执行该分支。
        if (code >= 0x40 && code <= 0x7e) {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        } else {
          // Invalid - treat as text
          // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
          result.state = 'ground'
          // textStart更新为 `seqStart`，确保Ink 渲染层后续读取最新状态。
          textStart = seqStart
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'osc':
        // 满足 `code === C0.BEL` 时，终端渲染执行该分支。
        if (code === C0.BEL) {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        // Ink 渲染层 tokenize在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          code === C0.ESC &&
          i + 1 < data.length &&
          data.charCodeAt(i + 1) === ESC_TYPE.ST
        ) {
          // Ink 渲染层 tokenize在这里处理 `i += 2`，完成这一小步状态转换。
          i += 2
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        } else {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break

      case 'dcs':
      case 'apc':
        // 满足 `code === C0.BEL` 时，终端渲染执行该分支。
        if (code === C0.BEL) {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        // Ink 渲染层 tokenize在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          code === C0.ESC &&
          i + 1 < data.length &&
          data.charCodeAt(i + 1) === ESC_TYPE.ST
        ) {
          // Ink 渲染层 tokenize在这里处理 `i += 2`，完成这一小步状态转换。
          i += 2
          // 调用 emitSequence，触发终端渲染此处需要的副作用。
          emitSequence(data.slice(seqStart, i))
        } else {
          // Ink 渲染层 tokenize在这里处理 `i++`，完成这一小步状态转换。
          i++
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
    }
  }

  // Handle end of input
  // 当 `result.state` 匹配 `'ground'` 时，终端渲染执行对应分支。
  if (result.state === 'ground') {
    // 调用 flushText，触发终端渲染此处需要的副作用。
    flushText()
  // Ink 渲染层 tokenize在这里处理 `} else if (flush) {`，完成这一小步状态转换。
  } else if (flush) {
    // Force output incomplete sequence
    // remaining格式化`data.slice`，供终端渲染后续处理使用。
    const remaining = data.slice(seqStart)
    // 满足 `remaining) tokens.push({ type: 'sequence', value: remaining }` 时，终端渲染执行该分支。
    if (remaining) tokens.push({ type: 'sequence', value: remaining })
    // 状态更新为 `'ground'`，确保Ink 渲染层后续读取最新状态。
    result.state = 'ground'
  } else {
    // Buffer incomplete sequence for next call
    // buffer更新为 `data.slice(seqStart)`，确保Ink 渲染层后续读取最新状态。
    result.buffer = data.slice(seqStart)
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { tokens, state: result }
}
