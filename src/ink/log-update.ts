// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnsiCode,
  ansiCodesToString,
  diffAnsiCodes,
} from '@alcalzone/ansi-tokenize'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 类型依赖 { Diff, FlickerReason, Frame } 来自 ./frame.js，用于校准终端渲染的数据契约。
import type { Diff, FlickerReason, Frame } from './frame.js'
// 类型依赖 { Point } 来自 ./layout/geometry.js，用于校准终端渲染的数据契约。
import type { Point } from './layout/geometry.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type Cell,
  CellWidth,
  cellAt,
  charInCellAt,
  diffEach,
  type Hyperlink,
  isEmptyCellAt,
  type Screen,
  type StylePool,
  shiftRows,
  visibleCellAtIndex,
} from './screen.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CURSOR_HOME,
  scrollDown as csiScrollDown,
  scrollUp as csiScrollUp,
  RESET_SCROLL_REGION,
  setScrollRegion,
} from './termio/csi.js'
// 引入 LINK_END、link as oscLink，将 ./termio/osc.js 中已经封装好的能力接到本文件流程里。
import { LINK_END, link as oscLink } from './termio/osc.js'

// State 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type State = {
  previousOutput: string
}

// Options 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Options = {
  isTTY: boolean
  stylePool: StylePool
}

// CARRIAGE_RETURN 集中保存Ink 渲染层 log update要一起传递的字段。
const CARRIAGE_RETURN = { type: 'carriageReturn' } as const
// NEWLINE 集中保存Ink 渲染层 log update要一起传递的字段。
const NEWLINE = { type: 'stdout', content: '\n' } as const

// LogUpdate 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class LogUpdate {
  private state: State

  // 构造函数接收 private readonly options: Options，把外部输入整理成实例可复用的内部状态。
  constructor(private readonly options: Options) {
    // 更新实例字段 state 为 {，同步终端渲染的内部状态。
    this.state = {
      previousOutput: '',
    }
  }

  // renderPreviousOutput_DEPRECATED 使用 prevFrame: Frame 完成终端渲染里的对应操作。
  renderPreviousOutput_DEPRECATED(prevFrame: Frame): Diff {
    // this.options.isTTY缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.options.isTTY) {
      // Non-TTY output is no longer supported (string output was removed)
      // 返回列表结果，保留终端渲染已经排好的条目顺序。
      return [NEWLINE]
    }
    // 返回 `this.getRenderOpsForDone(prevFrame)`，作为终端渲染这次计算的结果。
    return this.getRenderOpsForDone(prevFrame)
  }

  // Called when process resumes from suspension (SIGCONT) to prevent clobbering terminal content
  // reset 使用 无 完成终端渲染里的对应操作。
  reset(): void {
    // previousOutput更新为 `''`，确保Ink 渲染层后续读取最新状态。
    this.state.previousOutput = ''
  }

  // Ink 渲染层 log update在这里处理 `private renderFullFrame(frame: Frame): Diff {`，完成这一小步状态转换。
  private renderFullFrame(frame: Frame): Diff {
    // 从 `frame` 解构 screen，减少Ink 渲染层 log update对同一对象的重复访问。
    const { screen } = frame
    // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
    const lines: string[] = []
    // currentStyles 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    let currentStyles: AnsiCode[] = []
    // currentHyperlink 命名 `undefined`，让后续代码直接表达这个值的用途。
    let currentHyperlink: Hyperlink = undefined
    // 按索引扫描 `screen.height`，需要消费相邻参数时可以精确移动游标。
    for (let y = 0; y < screen.height; y++) {
      // line固定为 `''`，作为Ink 渲染层 log update后续展示或比较的基准。
      let line = ''
      // 按索引扫描 `screen.width`，需要消费相邻参数时可以精确移动游标。
      for (let x = 0; x < screen.width; x++) {
        // cell保存`cellAt`，供终端渲染后续处理使用。
        const cell = cellAt(screen, x, y)
        // `cell && cell.width` 与 `CellWidth.SpacerTail` 不一致时刷新派生状态，避免使用过期结果。
        if (cell && cell.width !== CellWidth.SpacerTail) {
          // Handle hyperlink transitions
          // `cell.hyperlink` 与 `currentHyperlink` 不一致时刷新派生状态，避免使用过期结果。
          if (cell.hyperlink !== currentHyperlink) {
            // `currentHyperlink` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (currentHyperlink !== undefined) {
              // Ink 渲染层 log update在这里处理 `line += LINK_END`，完成这一小步状态转换。
              line += LINK_END
            }
            // `cell.hyperlink` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (cell.hyperlink !== undefined) {
              // Ink 渲染层 log update在这里处理 `line += oscLink(cell.hyperlink)`，完成这一小步状态转换。
              line += oscLink(cell.hyperlink)
            }
            // currentHyperlink更新为 `cell.hyperlink`，确保Ink 渲染层后续读取最新状态。
            currentHyperlink = cell.hyperlink
          }
          // cellStyles 集合读取`stylePool.get`，供终端渲染后续处理使用。
          const cellStyles = this.options.stylePool.get(cell.styleId)
          // styleDiff保存`diffAnsiCodes`，供终端渲染后续处理使用。
          const styleDiff = diffAnsiCodes(currentStyles, cellStyles)
          // 满足 `styleDiff.length > 0` 时，终端渲染执行该分支。
          if (styleDiff.length > 0) {
            // Ink 渲染层 log update在这里处理 `line += ansiCodesToString(styleDiff)`，完成这一小步状态转换。
            line += ansiCodesToString(styleDiff)
            // currentStyles 集合更新为 `cellStyles`，确保Ink 渲染层后续读取最新状态。
            currentStyles = cellStyles
          }
          // Ink 渲染层 log update在这里处理 `line += cell.char`，完成这一小步状态转换。
          line += cell.char
        }
      }
      // Close any open hyperlink before resetting styles
      // `currentHyperlink` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (currentHyperlink !== undefined) {
        // Ink 渲染层 log update在这里处理 `line += LINK_END`，完成这一小步状态转换。
        line += LINK_END
        // currentHyperlink更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
        currentHyperlink = undefined
      }
      // Reset styles at end of line so trimEnd doesn't leave dangling codes
      // resetCodes 集合保存`diffAnsiCodes`，供终端渲染后续处理使用。
      const resetCodes = diffAnsiCodes(currentStyles, [])
      // 满足 `resetCodes.length > 0` 时，终端渲染执行该分支。
      if (resetCodes.length > 0) {
        // Ink 渲染层 log update在这里处理 `line += ansiCodesToString(resetCodes)`，完成这一小步状态转换。
        line += ansiCodesToString(resetCodes)
        // currentStyles 集合更新为 `[]`，确保Ink 渲染层后续读取最新状态。
        currentStyles = []
      }
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(line.trimEnd())
    }

    // 文本行为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (lines.length === 0) {
      // 返回列表结果，保留终端渲染已经排好的条目顺序。
      return []
    }
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return [{ type: 'stdout', content: lines.join('\n') }]
  }

  // Ink 渲染层 log update在这里处理 `private getRenderOpsForDone(prev: Frame): Diff {`，完成这一小步状态转换。
  private getRenderOpsForDone(prev: Frame): Diff {
    // previousOutput更新为 `''`，确保Ink 渲染层后续读取最新状态。
    this.state.previousOutput = ''

    // prev.cursor.visible缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!prev.cursor.visible) {
      // 返回列表结果，保留终端渲染已经排好的条目顺序。
      return [{ type: 'cursorShow' }]
    }
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return []
  }

  // 调用 render，触发终端渲染此处需要的副作用。
  render(
    prev: Frame,
    next: Frame,
    altScreen = false,
    decstbmSafe = true,
  ): Diff {
    // this.options.isTTY缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!this.options.isTTY) {
      // 返回 `this.renderFullFrame(next)`，作为终端渲染这次计算的结果。
      return this.renderFullFrame(next)
    }

    // startTime记录时间`performance.now`，供终端渲染后续处理使用。
    const startTime = performance.now()
    // stylePool保存`this.options.stylePool`，供后续判断或组装使用。
    const stylePool = this.options.stylePool

    // Since we assume the cursor is at the bottom on the screen, we only need
    // to clear when the viewport gets shorter (i.e. the cursor position drifts)
    // or when it gets thinner (and text wraps). We _could_ figure out how to
    // not reset here but that would involve predicting the current layout
    // _after_ the viewport change which means calcuating text wrapping.
    // Resizing is a rare enough event that it's not practically a big issue.
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      next.viewport.height < prev.viewport.height ||
      (prev.viewport.width !== 0 && next.viewport.width !== prev.viewport.width)
    ) {
      // 返回 `fullResetSequence_CAUSES_FLICKER(next, 'resize', stylePool)`，作为终端渲染这次计算的结果。
      return fullResetSequence_CAUSES_FLICKER(next, 'resize', stylePool)
    }

    // DECSTBM scroll optimization: when a ScrollBox's scrollTop changed,
    // shift content with a hardware scroll (CSI top;bot r + CSI n S/T)
    // instead of rewriting the whole scroll region. The shiftRows on
    // prev.screen simulates the shift so the diff loop below naturally
    // finds only the rows that scrolled IN as diffs. prev.screen is
    // about to become backFrame (reused next render) so mutation is safe.
    // CURSOR_HOME after RESET_SCROLL_REGION is defensive — DECSTBM reset
    // homes cursor per spec but terminal implementations vary.
    //
    // decstbmSafe: caller passes false when the DECSTBM→diff sequence
    // can't be made atomic (no DEC 2026 / BSU/ESU). Without atomicity the
    // outer terminal renders the intermediate state — region scrolled,
    // edge rows not yet painted — a visible vertical jump on every frame
    // where scrollTop moves. Falling through to the diff loop writes all
    // shifted rows: more bytes, no intermediate state. next.screen from
    // render-node-to-output's blit+shift is correct either way.
    // scrollPatch 从空数组开始收集，后续循环会按处理顺序追加条目。
    let scrollPatch: Diff = []
    // 只有 `altScreen && next.scrollHint && decstbmSafe` 满足时，终端渲染才执行该分支。
    if (altScreen && next.scrollHint && decstbmSafe) {
      // 从 `next.scrollHint` 解构 top、bottom、delta，减少Ink 渲染层 log update对同一对象的重复访问。
      const { top, bottom, delta } = next.scrollHint
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        top >= 0 &&
        bottom < prev.screen.height &&
        bottom < next.screen.height
      ) {
        // 调用 shiftRows，触发终端渲染此处需要的副作用。
        shiftRows(prev.screen, top, bottom, delta)
        // scrollPatch更新为 `[`，确保Ink 渲染层后续读取最新状态。
        scrollPatch = [
          {
            type: 'stdout',
            content:
              setScrollRegion(top + 1, bottom + 1) +
              (delta > 0 ? csiScrollUp(delta) : csiScrollDown(-delta)) +
              RESET_SCROLL_REGION +
              CURSOR_HOME,
          },
        ]
      }
    }

    // We have to use purely relative operations to manipulate the cursor since
    // we don't know its starting point.
    //
    // When content height >= viewport height AND cursor is at the bottom,
    // the cursor restore at the end of the previous frame caused terminal scroll.
    // viewportY tells us how many rows are in scrollback from content overflow.
    // Additionally, the cursor-restore scroll pushes 1 more row into scrollback.
    // We need fullReset if any changes are to rows that are now in scrollback.
    //
    // This early full-reset check only applies in "steady state" (not growing).
    // For growing, the viewportY calculation below (with cursorRestoreScroll)
    // catches unreachable scrollback rows in the diff loop instead.
    // cursorAtBottom保存`prev.cursor.y >= prev.screen.height`，供后续判断或组装使用。
    const cursorAtBottom = prev.cursor.y >= prev.screen.height
    // isGrowing标记Ink 渲染层 log update是否启用对应路径。
    const isGrowing = next.screen.height > prev.screen.height
    // When content fills the viewport exactly (height == viewport) and the
    // cursor is at the bottom, the cursor-restore LF at the end of the
    // previous frame scrolled 1 row into scrollback. Use >= to catch this.
    // prevHadScrollback 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const prevHadScrollback =
      cursorAtBottom && prev.screen.height >= prev.viewport.height
    // isShrinking标记Ink 渲染层 log update是否启用对应路径。
    const isShrinking = next.screen.height < prev.screen.height
    // nextFitsViewport 命名 `next.screen.height <= prev.viewport.height`，让后续代码直接表达这个值的用途。
    const nextFitsViewport = next.screen.height <= prev.viewport.height

    // When shrinking from above-viewport to at-or-below-viewport, content that
    // was in scrollback should now be visible. Terminal clear operations can't
    // bring scrollback content into view, so we need a full reset.
    // Use <= (not <) because even when next height equals viewport height, the
    // scrollback depth from the previous render differs from a fresh render.
    // 只有 `prevHadScrollback && nextFitsViewport && isShrink` 满足时，终端渲染才执行该分支。
    if (prevHadScrollback && nextFitsViewport && isShrinking) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Full reset (shrink->below): prevHeight=${prev.screen.height}, nextHeight=${next.screen.height}, viewport=${prev.viewport.height}`,
      )
      // 返回 `fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool)`，作为终端渲染这次计算的结果。
      return fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool)
    }

    // 终端渲染在这里按实际状态进入对应分支。
    if (
      prev.screen.height >= prev.viewport.height &&
      prev.screen.height > 0 &&
      cursorAtBottom &&
      !isGrowing
    ) {
      // viewportY = rows in scrollback from content overflow
      // +1 for the row pushed by cursor-restore scroll
      // viewportY 命名 `prev.screen.height - prev.viewport.height`，让后续代码直接表达这个值的用途。
      const viewportY = prev.screen.height - prev.viewport.height
      // scrollbackRows 集合保存`viewportY + 1`，供后续判断或组装使用。
      const scrollbackRows = viewportY + 1

      // scrollbackChangeY 命名 `-1`，让后续代码直接表达这个值的用途。
      let scrollbackChangeY = -1
      // 调用 diffEach，触发终端渲染此处需要的副作用。
      diffEach(prev.screen, next.screen, (_x, y) => {
        // 满足 `y < scrollbackRows` 时，终端渲染执行该分支。
        if (y < scrollbackRows) {
          // scrollbackChangeY更新为 `y`，确保Ink 渲染层后续读取最新状态。
          scrollbackChangeY = y
          // 返回 `true // early exit`，作为终端渲染这次计算的结果。
          return true // early exit
        }
      })
      // 满足 `scrollbackChangeY >= 0` 时，终端渲染执行该分支。
      if (scrollbackChangeY >= 0) {
        // prevLine读取`readLine`，供终端渲染后续处理使用。
        const prevLine = readLine(prev.screen, scrollbackChangeY)
        // nextLine读取`readLine`，供终端渲染后续处理使用。
        const nextLine = readLine(next.screen, scrollbackChangeY)
        // 返回 `fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool, {`，作为终端渲染这次计算的结果。
        return fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool, {
          triggerY: scrollbackChangeY,
          prevLine,
          nextLine,
        })
      }
    }

    // screen保存`VirtualScreen`，供终端渲染后续处理使用。
    const screen = new VirtualScreen(prev.cursor, next.viewport.width)

    // Treat empty screen as height 1 to avoid spurious adjustments on first render
    // heightDelta 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const heightDelta =
      Math.max(next.screen.height, 1) - Math.max(prev.screen.height, 1)
    // shrinking保存`heightDelta < 0`，供Ink 渲染层 log update后续判断或输出使用。
    const shrinking = heightDelta < 0
    // growing保存`heightDelta > 0`，供Ink 渲染层 log update后续判断或输出使用。
    const growing = heightDelta > 0

    // Handle shrinking: clear lines from the bottom
    // 满足 `shrinking` 时，终端渲染执行该分支。
    if (shrinking) {
      // linesToClear保存`prev.screen.height - next.screen.height`，供后续判断或组装使用。
      const linesToClear = prev.screen.height - next.screen.height

      // eraseLines only works within the viewport - it can't clear scrollback.
      // If we need to clear more lines than fit in the viewport, some are in
      // scrollback, so we need a full reset.
      // 满足 `linesToClear > prev.viewport.height` 时，终端渲染执行该分支。
      if (linesToClear > prev.viewport.height) {
        // 返回 `fullResetSequence_CAUSES_FLICKER(`，作为终端渲染这次计算的结果。
        return fullResetSequence_CAUSES_FLICKER(
          next,
          'offscreen',
          this.options.stylePool,
        )
      }

      // clear(N) moves cursor UP by N-1 lines and to column 0
      // This puts us at line prev.screen.height - N = next.screen.height
      // But we want to be at next.screen.height - 1 (bottom of new screen)
      // 调用 screen.txn，触发终端渲染此处需要的副作用。
      screen.txn(prev => [
        [
          { type: 'clear', count: linesToClear },
          { type: 'cursorMove', x: 0, y: -1 },
        ],
        { dx: -prev.x, dy: -linesToClear },
      ])
    }

    // viewportY = number of rows in scrollback (not visible on terminal).
    // For shrinking: use max(prev, next) because terminal clears don't scroll.
    // For growing: use prev state because new rows haven't scrolled old ones yet.
    // When prevHadScrollback, add 1 for the cursor-restore LF that scrolled
    // an additional row out of view at the end of the previous frame. Without
    // this, the diff loop treats that row as reachable — but the cursor clamps
    // at viewport top, causing writes to land 1 row off and garbling the output.
    // cursorRestoreScroll保存`prevHadScrollback ? 1 : 0`，供后续判断或组装使用。
    const cursorRestoreScroll = prevHadScrollback ? 1 : 0
    // viewportY保存`growing`，供Ink 渲染层 log update后续判断或输出使用。
    const viewportY = growing
      ? Math.max(
          0,
          prev.screen.height - prev.viewport.height + cursorRestoreScroll,
        )
      : Math.max(prev.screen.height, next.screen.height) -
        next.viewport.height +
        cursorRestoreScroll

    // currentStyleId保存`stylePool.none`，供Ink 渲染层 log update后续判断或输出使用。
    let currentStyleId = stylePool.none
    // currentHyperlink 命名 `undefined`，让后续代码直接表达这个值的用途。
    let currentHyperlink: Hyperlink = undefined

    // First pass: render changes to existing rows (rows < prev.screen.height)
    // needsFullReset标记Ink 渲染层 log update是否启用对应路径。
    let needsFullReset = false
    // resetTriggerY保存`-1`，供后续判断或组装使用。
    let resetTriggerY = -1
    // 调用 diffEach，触发终端渲染此处需要的副作用。
    diffEach(prev.screen, next.screen, (x, y, removed, added) => {
      // Skip new rows - we'll render them directly after
      // 只有 `growing && y >= prev.screen.height` 满足时，终端渲染才执行该分支。
      if (growing && y >= prev.screen.height) {
        // Ink 渲染层 log update在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Skip spacers during rendering because the terminal will automatically
      // advance 2 columns when we write the wide character itself.
      // SpacerTail: Second cell of a wide character
      // SpacerHead: Marks line-end position where wide char wraps to next line
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        added &&
        (added.width === CellWidth.SpacerTail ||
          added.width === CellWidth.SpacerHead)
      ) {
        // Ink 渲染层 log update在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 终端渲染在这里按实际状态进入对应分支。
      if (
        removed &&
        (removed.width === CellWidth.SpacerTail ||
          removed.width === CellWidth.SpacerHead) &&
        !added
      ) {
        // Ink 渲染层 log update在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Skip empty cells that don't need to overwrite existing content.
      // This prevents writing trailing spaces that would cause unnecessary
      // line wrapping at the edge of the screen.
      // Uses isEmptyCellAt to check if both packed words are zero (empty cell).
      // 只有 `added && isEmptyCellAt(next.screen, x, y) && !removed` 满足时，终端渲染才执行该分支。
      if (added && isEmptyCellAt(next.screen, x, y) && !removed) {
        // Ink 渲染层 log update在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // If the cell outside the viewport range has changed, we need to reset
      // because we can't move the cursor there to draw.
      // 满足 `y < viewportY` 时，终端渲染执行该分支。
      if (y < viewportY) {
        // needsFullReset更新为 `true`，确保Ink 渲染层后续读取最新状态。
        needsFullReset = true
        // resetTriggerY更新为 `y`，确保Ink 渲染层后续读取最新状态。
        resetTriggerY = y
        // 返回 `true // early exit`，作为终端渲染这次计算的结果。
        return true // early exit
      }

      // 调用 moveCursorTo，触发终端渲染此处需要的副作用。
      moveCursorTo(screen, x, y)

      // 满足 `added` 时，终端渲染执行该分支。
      if (added) {
        // targetHyperlink保存`added.hyperlink`，供Ink 渲染层 log update后续判断或输出使用。
        const targetHyperlink = added.hyperlink
        // currentHyperlink更新为 `transitionHyperlink(`，确保Ink 渲染层后续读取最新状态。
        currentHyperlink = transitionHyperlink(
          screen.diff,
          currentHyperlink,
          targetHyperlink,
        )
        // styleStr保存`stylePool.transition`，供终端渲染后续处理使用。
        const styleStr = stylePool.transition(currentStyleId, added.styleId)
        // 满足 `writeCellWithStyleStr(screen, added, styleStr)` 时，终端渲染执行该分支。
        if (writeCellWithStyleStr(screen, added, styleStr)) {
          // currentStyleId更新为 `added.styleId`，确保Ink 渲染层后续读取最新状态。
          currentStyleId = added.styleId
        }
      // Ink 渲染层 log update在这里处理 `} else if (removed) {`，完成这一小步状态转换。
      } else if (removed) {
        // Cell was removed - clear it with a space
        // (This handles shrinking content)
        // Reset any active styles/hyperlinks first to avoid leaking into cleared cells
        // styleIdToReset 命名 `currentStyleId`，让后续代码直接表达这个值的用途。
        const styleIdToReset = currentStyleId
        // hyperlinkToReset保存`currentHyperlink`，供Ink 渲染层 log update后续判断或输出使用。
        const hyperlinkToReset = currentHyperlink
        // currentStyleId更新为 `stylePool.none`，确保Ink 渲染层后续读取最新状态。
        currentStyleId = stylePool.none
        // currentHyperlink更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
        currentHyperlink = undefined

        // 调用 screen.txn，触发终端渲染此处需要的副作用。
        screen.txn(() => {
          // patches 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
          const patches: Diff = []
          // 调用 transitionStyle，触发终端渲染此处需要的副作用。
          transitionStyle(patches, stylePool, styleIdToReset, stylePool.none)
          // 调用 transitionHyperlink，触发终端渲染此处需要的副作用。
          transitionHyperlink(patches, hyperlinkToReset, undefined)
          // patches 集合追加新条目，保持收集顺序与输入顺序一致。
          patches.push({ type: 'stdout', content: ' ' })
          // 返回列表结果，保留终端渲染已经排好的条目顺序。
          return [patches, { dx: 1, dy: 0 }]
        })
      }
    })
    // 满足 `needsFullReset` 时，终端渲染执行该分支。
    if (needsFullReset) {
      // 返回 `fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool, {`，作为终端渲染这次计算的结果。
      return fullResetSequence_CAUSES_FLICKER(next, 'offscreen', stylePool, {
        triggerY: resetTriggerY,
        prevLine: readLine(prev.screen, resetTriggerY),
        nextLine: readLine(next.screen, resetTriggerY),
      })
    }

    // Reset styles before rendering new rows (they'll set their own styles)
    // currentStyleId更新为 `transitionStyle(`，确保Ink 渲染层后续读取最新状态。
    currentStyleId = transitionStyle(
      screen.diff,
      stylePool,
      currentStyleId,
      stylePool.none,
    )
    // currentHyperlink更新为 `transitionHyperlink(`，确保Ink 渲染层后续读取最新状态。
    currentHyperlink = transitionHyperlink(
      screen.diff,
      currentHyperlink,
      undefined,
    )

    // Handle growth: render new rows directly (they naturally scroll the terminal)
    // 满足 `growing` 时，终端渲染执行该分支。
    if (growing) {
      // 调用 renderFrameSlice，触发终端渲染此处需要的副作用。
      renderFrameSlice(
        screen,
        next,
        prev.screen.height,
        next.screen.height,
        stylePool,
      )
    }

    // Restore cursor. Skipped in alt-screen: the cursor is hidden, its
    // position only matters as the starting point for the NEXT frame's
    // relative moves, and in alt-screen the next frame always begins with
    // CSI H (see ink.tsx onRender) which resets to (0,0) regardless. This
    // saves a CR + cursorMove round-trip (~6-10 bytes) every frame.
    //
    // Main screen: if cursor needs to be past the last line of content
    // (typical: cursor.y = screen.height), emit \n to create that line
    // since cursor movement can't create new lines.
    // 满足 `altScreen` 时，终端渲染执行该分支。
    if (altScreen) {
      // no-op; next frame's CSI H anchors cursor
    // Ink 渲染层 log update在这里处理 `} else if (next.cursor.y >= next.screen.height) {`，完成这一小步状态转换。
    } else if (next.cursor.y >= next.screen.height) {
      // Move to column 0 of current line, then emit newlines to reach target row
      // 调用 screen.txn，触发终端渲染此处需要的副作用。
      screen.txn(prev => {
        // rowsToCreate保存`next.cursor.y - prev.y`，供Ink 渲染层 log update后续判断或输出使用。
        const rowsToCreate = next.cursor.y - prev.y
        // 满足 `rowsToCreate > 0` 时，终端渲染执行该分支。
        if (rowsToCreate > 0) {
          // Use CR to resolve pending wrap (if any) without advancing
          // to the next line, then LF to create each new row.
          // patches 集合读取 `new Array<Diff[number]>(1 + rowsToCreate)` 对应条目，后续围绕该成员继续处理。
          const patches: Diff = new Array<Diff[number]>(1 + rowsToCreate)
          // patches[0更新为 `CARRIAGE_RETURN`，确保Ink 渲染层 log update后续读取最新状态。
          patches[0] = CARRIAGE_RETURN
          // 按索引扫描 `rowsToCreate`，需要消费相邻参数时可以精确移动游标。
          for (let i = 0; i < rowsToCreate; i++) {
            // patches[1 + i更新为 `NEWLINE`，确保Ink 渲染层 log update后续读取最新状态。
            patches[1 + i] = NEWLINE
          }
          // 返回列表结果，保留终端渲染已经排好的条目顺序。
          return [patches, { dx: -prev.x, dy: rowsToCreate }]
        }
        // At or past target row - need to move cursor to correct position
        // dy保存`next.cursor.y - prev.y`，供后续判断或组装使用。
        const dy = next.cursor.y - prev.y
        // `dy` 与 `0 || prev.x !== next.cursor.x` 不一致时刷新派生状态，避免使用过期结果。
        if (dy !== 0 || prev.x !== next.cursor.x) {
          // Use CR to clear pending wrap (if any), then cursor move
          // patches 集合 聚合成有序列表，保持后续遍历顺序稳定。
          const patches: Diff = [CARRIAGE_RETURN]
          // patches 集合追加新条目，保持收集顺序与输入顺序一致。
          patches.push({ type: 'cursorMove', x: next.cursor.x, y: dy })
          // 返回列表结果，保留终端渲染已经排好的条目顺序。
          return [patches, { dx: next.cursor.x - prev.x, dy }]
        }
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [[], { dx: 0, dy: 0 }]
      })
    } else {
      // 调用 moveCursorTo，触发终端渲染此处需要的副作用。
      moveCursorTo(screen, next.cursor.x, next.cursor.y)
    }

    // elapsed记录时间`performance.now`，供终端渲染后续处理使用。
    const elapsed = performance.now() - startTime
    // 满足 `elapsed > 50` 时，终端渲染执行该分支。
    if (elapsed > 50) {
      // damage 命名 `next.screen.damage`，让后续代码直接表达这个值的用途。
      const damage = next.screen.damage
      // damageInfo保存`damage`，供Ink 渲染层 log update后续判断或输出使用。
      const damageInfo = damage
        ? `${damage.width}x${damage.height} at (${damage.x},${damage.y})`
        : 'none'
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Slow render: ${elapsed.toFixed(1)}ms, screen: ${next.screen.height}x${next.screen.width}, damage: ${damageInfo}, changes: ${screen.diff.length}`,
      )
    }

    // 返回 `scrollPatch.length > 0`，作为终端渲染这次计算的结果。
    return scrollPatch.length > 0
      ? [...scrollPatch, ...screen.diff]
      : screen.diff
  }
}

// transitionHyperlink 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function transitionHyperlink(
  diff: Diff,
  current: Hyperlink,
  target: Hyperlink,
): Hyperlink {
  // `current` 与 `target` 不一致时刷新派生状态，避免使用过期结果。
  if (current !== target) {
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'hyperlink', uri: target ?? '' })
    // 返回 `target`，作为终端渲染这次计算的结果。
    return target
  }
  // 返回 `current`，作为终端渲染这次计算的结果。
  return current
}

// transitionStyle 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function transitionStyle(
  diff: Diff,
  stylePool: StylePool,
  currentId: number,
  targetId: number,
): number {
  // str保存`stylePool.transition`，供终端渲染后续处理使用。
  const str = stylePool.transition(currentId, targetId)
  // 满足 `str.length > 0` 时，终端渲染执行该分支。
  if (str.length > 0) {
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'styleStr', str })
  }
  // 返回 `targetId`，作为终端渲染这次计算的结果。
  return targetId
}

// readLine 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readLine(screen: Screen, y: number): string {
  // line固定为 `''`，作为Ink 渲染层 log update后续展示或比较的基准。
  let line = ''
  // 按索引扫描 `screen.width`，需要消费相邻参数时可以精确移动游标。
  for (let x = 0; x < screen.width; x++) {
    // Ink 渲染层 log update在这里处理 `line += charInCellAt(screen, x, y) ?? ' '`，完成这一小步状态转换。
    line += charInCellAt(screen, x, y) ?? ' '
  }
  // 返回 `line.trimEnd()`，作为终端渲染这次计算的结果。
  return line.trimEnd()
}

// fullResetSequence_CAUSES_FLICKER 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fullResetSequence_CAUSES_FLICKER(
  frame: Frame,
  reason: FlickerReason,
  stylePool: StylePool,
  debug?: { triggerY: number; prevLine: string; nextLine: string },
): Diff {
  // After clearTerminal, cursor is at (0, 0)
  // screen保存`VirtualScreen`，供终端渲染后续处理使用。
  const screen = new VirtualScreen({ x: 0, y: 0 }, frame.viewport.width)
  // 调用 renderFrame，触发终端渲染此处需要的副作用。
  renderFrame(screen, frame, stylePool)
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [{ type: 'clearTerminal', reason, debug }, ...screen.diff]
}

// renderFrame 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderFrame(
  screen: VirtualScreen,
  frame: Frame,
  stylePool: StylePool,
): void {
  // 调用 renderFrameSlice，触发终端渲染此处需要的副作用。
  renderFrameSlice(screen, frame, 0, frame.screen.height, stylePool)
}

/**
 * Render a slice of rows from the frame's screen.
 * Each row is rendered followed by a newline. Cursor ends at (0, endY).
 */
// renderFrameSlice 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderFrameSlice(
  screen: VirtualScreen,
  frame: Frame,
  startY: number,
  endY: number,
  stylePool: StylePool,
): VirtualScreen {
  // currentStyleId保存`stylePool.none`，供Ink 渲染层 log update后续判断或输出使用。
  let currentStyleId = stylePool.none
  // currentHyperlink 命名 `undefined`，让后续代码直接表达这个值的用途。
  let currentHyperlink: Hyperlink = undefined
  // Track the styleId of the last rendered cell on this line (-1 if none).
  // Passed to visibleCellAtIndex to enable fg-only space optimization.
  // lastRenderedStyleId保存`-1`，供后续判断或组装使用。
  let lastRenderedStyleId = -1

  // 从 `frame.screen` 解构 width、cells、charPool、hyperlinkPool，减少Ink 渲染层 log update对同一对象的重复访问。
  const { width: screenWidth, cells, charPool, hyperlinkPool } = frame.screen

  // index 索引保存`startY * screenWidth`，供Ink 渲染层 log update后续判断或输出使用。
  let index = startY * screenWidth
  // 循环处理 `let y = startY; y < endY; y += 1`，让终端渲染逐项把同类条目按顺序走完。
  for (let y = startY; y < endY; y += 1) {
    // Advance cursor to this row using LF (not CSI CUD / cursor-down).
    // CSI CUD stops at the viewport bottom margin and cannot scroll,
    // but LF scrolls the viewport to create new lines. Without this,
    // when the cursor is at the viewport bottom, moveCursorTo's
    // cursor-down silently fails, creating a permanent off-by-one
    // between the virtual cursor and the real terminal cursor.
    // 满足 `screen.cursor.y < y` 时，终端渲染执行该分支。
    if (screen.cursor.y < y) {
      // rowsToAdvance保存`y - screen.cursor.y`，供后续判断或组装使用。
      const rowsToAdvance = y - screen.cursor.y
      // 调用 screen.txn，触发终端渲染此处需要的副作用。
      screen.txn(prev => {
        // patches 集合 命名 `new Array<Diff[number]>(1 + rowsToAdvance)`，让后续代码直接表达这个值的用途。
        const patches: Diff = new Array<Diff[number]>(1 + rowsToAdvance)
        // patches[0更新为 `CARRIAGE_RETURN`，确保Ink 渲染层 log update后续读取最新状态。
        patches[0] = CARRIAGE_RETURN
        // 按索引扫描 `rowsToAdvance`，需要消费相邻参数时可以精确移动游标。
        for (let i = 0; i < rowsToAdvance; i++) {
          // patches[1 + i更新为 `NEWLINE`，确保Ink 渲染层 log update后续读取最新状态。
          patches[1 + i] = NEWLINE
        }
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [patches, { dx: -prev.x, dy: rowsToAdvance }]
      })
    }
    // Reset at start of each line — no cell rendered yet
    // lastRenderedStyleId更新为 `-1`，确保Ink 渲染层后续读取最新状态。
    lastRenderedStyleId = -1

    // 循环处理 `let x = 0; x < screenWidth; x += 1, index += 1`，让终端渲染逐项把同类条目按顺序走完。
    for (let x = 0; x < screenWidth; x += 1, index += 1) {
      // Skip spacers, unstyled empty cells, and fg-only styled spaces that
      // match the last rendered style (since cursor-forward produces identical
      // visual result). visibleCellAtIndex handles the optimization internally
      // to avoid allocating Cell objects for skipped cells.
      // cell保存`visibleCellAtIndex`，供终端渲染后续处理使用。
      const cell = visibleCellAtIndex(
        cells,
        charPool,
        hyperlinkPool,
        index,
        lastRenderedStyleId,
      )
      // cell缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!cell) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }

      // 调用 moveCursorTo，触发终端渲染此处需要的副作用。
      moveCursorTo(screen, x, y)

      // Handle hyperlink
      // targetHyperlink保存`cell.hyperlink`，供后续判断或组装使用。
      const targetHyperlink = cell.hyperlink
      // currentHyperlink更新为 `transitionHyperlink(`，确保Ink 渲染层后续读取最新状态。
      currentHyperlink = transitionHyperlink(
        screen.diff,
        currentHyperlink,
        targetHyperlink,
      )

      // Style transition — cached string, zero allocations after warmup
      // styleStr保存`stylePool.transition`，供终端渲染后续处理使用。
      const styleStr = stylePool.transition(currentStyleId, cell.styleId)
      // 满足 `writeCellWithStyleStr(screen, cell, styleStr)` 时，终端渲染执行该分支。
      if (writeCellWithStyleStr(screen, cell, styleStr)) {
        // currentStyleId更新为 `cell.styleId`，确保Ink 渲染层后续读取最新状态。
        currentStyleId = cell.styleId
        // lastRenderedStyleId更新为 `cell.styleId`，确保Ink 渲染层后续读取最新状态。
        lastRenderedStyleId = cell.styleId
      }
    }
    // Reset styles/hyperlinks before newline so background color doesn't
    // bleed into the next line when the terminal scrolls. The old code
    // reset implicitly by writing trailing unstyled spaces; now that we
    // skip empty cells, we must reset explicitly.
    // currentStyleId更新为 `transitionStyle(`，确保Ink 渲染层后续读取最新状态。
    currentStyleId = transitionStyle(
      screen.diff,
      stylePool,
      currentStyleId,
      stylePool.none,
    )
    // currentHyperlink更新为 `transitionHyperlink(`，确保Ink 渲染层后续读取最新状态。
    currentHyperlink = transitionHyperlink(
      screen.diff,
      currentHyperlink,
      undefined,
    )
    // CR+LF at end of row — \r resets to column 0, \n moves to next line.
    // Without \r, the terminal cursor stays at whatever column content ended
    // (since we skip trailing spaces, this can be mid-row).
    // 调用 screen.txn，触发终端渲染此处需要的副作用。
    screen.txn(prev => [[CARRIAGE_RETURN, NEWLINE], { dx: -prev.x, dy: 1 }])
  }

  // Reset any open style/hyperlink at end of slice
  // 调用 transitionStyle，触发终端渲染此处需要的副作用。
  transitionStyle(screen.diff, stylePool, currentStyleId, stylePool.none)
  // 调用 transitionHyperlink，触发终端渲染此处需要的副作用。
  transitionHyperlink(screen.diff, currentHyperlink, undefined)

  // 返回 `screen`，作为终端渲染这次计算的结果。
  return screen
}

// Delta 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Delta = { dx: number; dy: number }

/**
 * Write a cell with a pre-serialized style transition string (from
 * StylePool.transition). Inlines the txn logic to avoid closure/tuple/delta
 * allocations on every cell.
 *
 * Returns true if the cell was written, false if skipped (wide char at
 * viewport edge). Callers MUST gate currentStyleId updates on this — when
 * skipped, styleStr is never pushed and the terminal's style state is
 * unchanged. Updating the virtual tracker anyway desyncs it from the
 * terminal, and the next transition is computed from phantom state.
 */
// writeCellWithStyleStr 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeCellWithStyleStr(
  screen: VirtualScreen,
  cell: Cell,
  styleStr: string,
): boolean {
  // cellWidth标记Ink 渲染层 log update是否启用对应路径。
  const cellWidth = cell.width === CellWidth.Wide ? 2 : 1
  // px保存`screen.cursor.x`，供后续判断或组装使用。
  const px = screen.cursor.x
  // vw保存`screen.viewportWidth`，供Ink 渲染层 log update后续判断或输出使用。
  const vw = screen.viewportWidth

  // Don't write wide chars that would cross the viewport edge.
  // Single-codepoint chars (CJK) at vw-2 are safe; multi-codepoint
  // graphemes (flags, ZWJ emoji) need stricter threshold.
  // 只有 `cellWidth === 2 && px < vw` 满足时，终端渲染才执行该分支。
  if (cellWidth === 2 && px < vw) {
    // threshold记录 `cell.char.length > 2 ? vw : vw + 1` 是否成立，下一步按该结果分支。
    const threshold = cell.char.length > 2 ? vw : vw + 1
    // 满足 `px + 2 >= threshold` 时，终端渲染执行该分支。
    if (px + 2 >= threshold) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // diff保存`screen.diff`，供Ink 渲染层 log update后续判断或输出使用。
  const diff = screen.diff
  // 满足 `styleStr.length > 0` 时，终端渲染执行该分支。
  if (styleStr.length > 0) {
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'styleStr', str: styleStr })
  }

  // needsCompensation记录 `needsWidthCompensation` 是否成立，终端渲染随后按该结果分支。
  const needsCompensation = cellWidth === 2 && needsWidthCompensation(cell.char)

  // On terminals with old wcwidth tables, a compensated emoji only advances
  // the cursor 1 column, so the CHA below skips column x+1 without painting
  // it. Write a styled space there first — on correct terminals the emoji
  // glyph (width 2) overwrites it harmlessly; on old terminals it fills the
  // gap with the emoji's background. Also clears any stale content at x+1.
  // CHA is 1-based, so column px+1 (0-based) is CHA target px+2.
  // 只有 `needsCompensation && px + 1 < vw` 满足时，终端渲染才执行该分支。
  if (needsCompensation && px + 1 < vw) {
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'cursorTo', col: px + 2 })
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'stdout', content: ' ' })
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'cursorTo', col: px + 1 })
  }

  // diff追加新条目，保持收集顺序与输入顺序一致。
  diff.push({ type: 'stdout', content: cell.char })

  // Force terminal cursor to correct column after the emoji.
  // 满足 `needsCompensation` 时，终端渲染执行该分支。
  if (needsCompensation) {
    // diff追加新条目，保持收集顺序与输入顺序一致。
    diff.push({ type: 'cursorTo', col: px + cellWidth + 1 })
  }

  // Update cursor — mutate in place to avoid Point allocation
  // 满足 `px >= vw` 时，终端渲染执行该分支。
  if (px >= vw) {
    // x更新为 `cellWidth`，确保Ink 渲染层后续读取最新状态。
    screen.cursor.x = cellWidth
    // Ink 渲染层 log update在这里处理 `screen.cursor.y++`，完成这一小步状态转换。
    screen.cursor.y++
  } else {
    // x更新为 `px + cellWidth`，确保Ink 渲染层后续读取最新状态。
    screen.cursor.x = px + cellWidth
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// moveCursorTo 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function moveCursorTo(screen: VirtualScreen, targetX: number, targetY: number) {
  // 调用 screen.txn，触发终端渲染此处需要的副作用。
  screen.txn(prev => {
    // dx 命名 `targetX - prev.x`，让后续代码直接表达这个值的用途。
    const dx = targetX - prev.x
    // dy读取`targetY - prev.y` 整理出中间结果，供Ink 渲染层 log update后续步骤使用。
    const dy = targetY - prev.y
    // inPendingWrap 命名 `prev.x >= screen.viewportWidth`，让后续代码直接表达这个值的用途。
    const inPendingWrap = prev.x >= screen.viewportWidth

    // If we're in pending wrap state (cursor.x >= width), use CR
    // to reset to column 0 on the current line without advancing
    // to the next line, then issue the cursor movement.
    // 满足 `inPendingWrap` 时，终端渲染执行该分支。
    if (inPendingWrap) {
      // 返回列表结果，保留终端渲染已经排好的条目顺序。
      return [
        [CARRIAGE_RETURN, { type: 'cursorMove', x: targetX, y: dy }],
        { dx, dy },
      ]
    }

    // When moving to a different line, use carriage return (\r) to reset to
    // column 0 first, then cursor move.
    // `dy` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (dy !== 0) {
      // 返回列表结果，保留终端渲染已经排好的条目顺序。
      return [
        [CARRIAGE_RETURN, { type: 'cursorMove', x: targetX, y: dy }],
        { dx, dy },
      ]
    }

    // Standard same-line cursor move
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return [[{ type: 'cursorMove', x: dx, y: dy }], { dx, dy }]
  })
}

/**
 * Identify emoji where the terminal's wcwidth may disagree with Unicode.
 * On terminals with correct tables, the CHA we emit is a harmless no-op.
 *
 * Two categories:
 * 1. Newer emoji (Unicode 12.0+) missing from terminal wcwidth tables.
 * 2. Text-by-default emoji + VS16 (U+FE0F): the base codepoint is width 1
 *    in wcwidth, but VS16 triggers emoji presentation making it width 2.
 *    Examples: ⚔️ (U+2694), ☠️ (U+2620), ❤️ (U+2764).
 */
// needsWidthCompensation 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function needsWidthCompensation(char: string): boolean {
  // cp保存`char.codePointAt`，供终端渲染后续处理使用。
  const cp = char.codePointAt(0)
  // 满足 `cp === undefined` 时，终端渲染执行该分支。
  if (cp === undefined) return false
  // U+1FA70-U+1FAFF: Symbols and Pictographs Extended-A (Unicode 12.0-15.0)
  // U+1FB00-U+1FBFF: Symbols for Legacy Computing (Unicode 13.0)
  // 只有 `(cp >= 0x1fa70 && cp <= 0x1faff) || (cp >= 0x1fb00 && cp <= 0x1fbff)` 满足时，终端渲染才执行该分支。
  if ((cp >= 0x1fa70 && cp <= 0x1faff) || (cp >= 0x1fb00 && cp <= 0x1fbff)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Text-by-default emoji with VS16: scan for U+FE0F in multi-codepoint
  // graphemes. Single BMP chars (length 1) and surrogate pairs without VS16
  // skip this check. VS16 (0xFE0F) can't collide with surrogates (0xD800-0xDFFF).
  // 满足 `char.length >= 2` 时，终端渲染执行该分支。
  if (char.length >= 2) {
    // 按索引扫描 `char.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < char.length; i++) {
      // 满足 `char.charCodeAt(i) === 0xfe0f` 时，终端渲染执行该分支。
      if (char.charCodeAt(i) === 0xfe0f) return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// VirtualScreen 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
class VirtualScreen {
  // Public for direct mutation by writeCellWithStyleStr (avoids txn overhead).
  // File-private class — not exposed outside log-update.ts.
  cursor: Point
  diff: Diff = []

  // 构造函数初始化实例状态，确保终端渲染后续方法读取到完整配置。
  constructor(
    origin: Point,
    readonly viewportWidth: number,
  ) {
    // 更新实例字段 cursor 为 { ...origin }，同步终端渲染的内部状态。
    this.cursor = { ...origin }
  }

  // 调用 txn，触发终端渲染此处需要的副作用。
  txn(fn: (prev: Point) => [patches: Diff, next: Delta]): void {
    // 从 `fn(this.cursor)` 按位置拆出 patches、next，让Ink 渲染层 log update分别处理这些返回值。
    const [patches, next] = fn(this.cursor)
    // 按顺序遍历 `patches` 中的patch，逐个交给终端渲染处理。
    for (const patch of patches) {
      // diff追加新条目，保持收集顺序与输入顺序一致。
      this.diff.push(patch)
    }
    // Ink 渲染层 log update在这里处理 `this.cursor.x += next.dx`，完成这一小步状态转换。
    this.cursor.x += next.dx
    // Ink 渲染层 log update在这里处理 `this.cursor.y += next.dy`，完成这一小步状态转换。
    this.cursor.y += next.dy
  }
}
