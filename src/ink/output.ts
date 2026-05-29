// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnsiCode,
  type StyledChar,
  styledCharsFromTokens,
  tokenize,
} from '@alcalzone/ansi-tokenize'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../utils/intl.js'
// 复用 sliceAnsi 工具函数，把通用处理留在 ../utils/sliceAnsi.js 中维护。
import sliceAnsi from '../utils/sliceAnsi.js'
// 引入 reorderBidi，将 ./bidi.js 中已经封装好的能力接到本文件流程里。
import { reorderBidi } from './bidi.js'
// 引入 Rectangle、unionRect，将 ./layout/geometry.js 中已经封装好的能力接到本文件流程里。
import { type Rectangle, unionRect } from './layout/geometry.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  blitRegion,
  CellWidth,
  extractHyperlinkFromStyles,
  filterOutHyperlinkStyles,
  markNoSelectRegion,
  OSC8_PREFIX,
  resetScreen,
  type Screen,
  type StylePool,
  setCellAt,
  shiftRows,
} from './screen.js'
// 引入 stringWidth，将 ./stringWidth.js 中已经封装好的能力接到本文件流程里。
import { stringWidth } from './stringWidth.js'
// 引入 widestLine，将 ./widest-line.js 中已经封装好的能力接到本文件流程里。
import { widestLine } from './widest-line.js'

/**
 * A grapheme cluster with precomputed terminal width, styleId, and hyperlink.
 * Built once per unique line (cached via charCache), so the per-char hot loop
 * is just property reads + setCellAt — no stringWidth, no style interning,
 * no hyperlink extraction per frame.
 *
 * styleId is safe to cache: StylePool is session-lived (never reset).
 * hyperlink is stored as a string (not interned ID) since hyperlinkPool
 * resets every 5 min; setCellAt interns it per-frame (cheap Map.get).
 */
// ClusteredChar 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ClusteredChar = {
  value: string
  width: number
  styleId: number
  hyperlink: string | undefined
}

/**
 * Collects write/blit/clear/clip operations from the render tree, then
 * applies them to a Screen buffer in `get()`. The Screen is what gets
 * diffed against the previous frame to produce terminal updates.
 */

// Options 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Options = {
  width: number
  height: number
  stylePool: StylePool
  /**
   * Screen to render into. Will be reset before use.
   * For double-buffering, pass a reusable screen. Otherwise create a new one.
   */
  screen: Screen
}

// Operation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Operation =
  | WriteOperation
  | ClipOperation
  | UnclipOperation
  | BlitOperation
  | ClearOperation
  | NoSelectOperation
  | ShiftOperation

// WriteOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WriteOperation = {
  type: 'write'
  x: number
  y: number
  text: string
  /**
   * Per-line soft-wrap flags, parallel to text.split('\n'). softWrap[i]=true
   * means line i is a continuation of line i-1 (the `\n` before it was
   * inserted by word-wrap, not in the source). Index 0 is always false.
   * Undefined means the producer didn't track wrapping (e.g. fills,
   * raw-ansi) — the screen's per-row bitmap is left untouched.
   */
  softWrap?: boolean[]
}

// ClipOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ClipOperation = {
  type: 'clip'
  clip: Clip
}

// Clip 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Clip = {
  x1: number | undefined
  x2: number | undefined
  y1: number | undefined
  y2: number | undefined
}

/**
 * Intersect two clips. `undefined` on an axis means unbounded; the other
 * clip's bound wins. If both are bounded, take the tighter constraint
 * (max of mins, min of maxes). If the resulting region is empty
 * (x1 >= x2 or y1 >= y2), writes clipped by it will be dropped.
 */
// intersectClip 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function intersectClip(parent: Clip | undefined, child: Clip): Clip {
  // parent缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!parent) return child
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    x1: maxDefined(parent.x1, child.x1),
    x2: minDefined(parent.x2, child.x2),
    y1: maxDefined(parent.y1, child.y1),
    y2: minDefined(parent.y2, child.y2),
  }
}

// maxDefined 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maxDefined(
  a: number | undefined,
  b: number | undefined,
): number | undefined {
  // 满足 `a === undefined` 时，终端渲染执行该分支。
  if (a === undefined) return b
  // 满足 `b === undefined` 时，终端渲染执行该分支。
  if (b === undefined) return a
  // 返回 `Math.max(a, b)`，作为终端渲染这次计算的结果。
  return Math.max(a, b)
}

// minDefined 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function minDefined(
  a: number | undefined,
  b: number | undefined,
): number | undefined {
  // 满足 `a === undefined` 时，终端渲染执行该分支。
  if (a === undefined) return b
  // 满足 `b === undefined` 时，终端渲染执行该分支。
  if (b === undefined) return a
  // 返回 `Math.min(a, b)`，作为终端渲染这次计算的结果。
  return Math.min(a, b)
}

// UnclipOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type UnclipOperation = {
  type: 'unclip'
}

// BlitOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type BlitOperation = {
  type: 'blit'
  src: Screen
  x: number
  y: number
  width: number
  height: number
}

// ShiftOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ShiftOperation = {
  type: 'shift'
  top: number
  bottom: number
  n: number
}

// ClearOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ClearOperation = {
  type: 'clear'
  region: Rectangle
  /**
   * Set when the clear is for an absolute-positioned node's old bounds.
   * Absolute nodes overlay normal-flow siblings, so their stale paint is
   * what an earlier sibling's clean-subtree blit wrongly restores from
   * prevScreen. Normal-flow siblings' clears don't have this problem —
   * their old position can't have been painted on top of a sibling.
   */
  fromAbsolute?: boolean
}

// NoSelectOperation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type NoSelectOperation = {
  type: 'noSelect'
  region: Rectangle
}

// Ink 渲染层 output在这里处理 `export default class Output {`，完成这一小步状态转换。
export default class Output {
  width: number
  height: number
  private readonly stylePool: StylePool
  private screen: Screen

  private readonly operations: Operation[] = []

  private charCache: Map<string, ClusteredChar[]> = new Map()

  // 构造函数接收 options: Options，把外部输入整理成实例可复用的内部状态。
  constructor(options: Options) {
    // 从 `options` 解构 width、height、stylePool、screen，减少Ink 渲染层 output对同一对象的重复访问。
    const { width, height, stylePool, screen } = options

    // 更新实例字段 width 为 width，同步终端渲染的内部状态。
    this.width = width
    // 更新实例字段 height 为 height，同步终端渲染的内部状态。
    this.height = height
    // 更新实例字段 stylePool 为 stylePool，同步终端渲染的内部状态。
    this.stylePool = stylePool
    // 更新实例字段 screen 为 screen，同步终端渲染的内部状态。
    this.screen = screen

    // 调用 resetScreen，触发终端渲染此处需要的副作用。
    resetScreen(screen, width, height)
  }

  /**
   * Reuse this Output for a new frame. Zeroes the screen buffer, clears
   * the operation list (backing storage is retained), and caps charCache
   * growth. Preserving charCache across frames is the main win — most
   * lines don't change between renders, so tokenize + grapheme clustering
   * becomes a cache hit.
   */
  // reset 使用 width: number, height: number, screen: Screen 完成终端渲染里的对应操作。
  reset(width: number, height: number, screen: Screen): void {
    // 更新实例字段 width 为 width，同步终端渲染的内部状态。
    this.width = width
    // 更新实例字段 height 为 height，同步终端渲染的内部状态。
    this.height = height
    // 更新实例字段 screen 为 screen，同步终端渲染的内部状态。
    this.screen = screen
    // this.operations 集合被清空，Ink 渲染层从干净状态继续。
    this.operations.length = 0
    // 调用 resetScreen，触发终端渲染此处需要的副作用。
    resetScreen(screen, width, height)
    // 满足 `this.charCache.size > 16384) this.charCache.clear(` 时，终端渲染执行该分支。
    if (this.charCache.size > 16384) this.charCache.clear()
  }

  /**
   * Copy cells from a source screen region (blit = block image transfer).
   */
  // blit 使用 src: Screen, x: number, y: number, width: number,… 完成终端渲染里的对应操作。
  blit(src: Screen, x: number, y: number, width: number, height: number): void {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({ type: 'blit', src, x, y, width, height })
  }

  /**
   * Shift full-width rows within [top, bottom] by n. n > 0 = up. Mirrors
   * what DECSTBM + SU/SD does to the terminal. Paired with blit() to reuse
   * prevScreen content during pure scroll, avoiding full child re-render.
   */
  // shift 使用 top: number, bottom: number, n: number 完成终端渲染里的对应操作。
  shift(top: number, bottom: number, n: number): void {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({ type: 'shift', top, bottom, n })
  }

  /**
   * Clear a region by writing empty cells. Used when a node shrinks to
   * ensure stale content from the previous frame is removed.
   */
  // clear 使用 region: Rectangle, fromAbsolute?: boolean 完成终端渲染里的对应操作。
  clear(region: Rectangle, fromAbsolute?: boolean): void {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({ type: 'clear', region, fromAbsolute })
  }

  /**
   * Mark a region as non-selectable (excluded from fullscreen text
   * selection copy + highlight). Used by <NoSelect> to fence off
   * gutters (line numbers, diff sigils). Applied AFTER blit/write so
   * the mark wins regardless of what's blitted into the region.
   */
  // noSelect 使用 region: Rectangle 完成终端渲染里的对应操作。
  noSelect(region: Rectangle): void {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({ type: 'noSelect', region })
  }

  // write 使用 x: number, y: number, text: string, softWrap?: bo… 完成终端渲染里的对应操作。
  write(x: number, y: number, text: string, softWrap?: boolean[]): void {
    // 文本缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!text) {
      // Ink 渲染层 output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({
      type: 'write',
      x,
      y,
      text,
      softWrap,
    })
  }

  // clip 使用 clip: Clip 完成终端渲染里的对应操作。
  clip(clip: Clip) {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({
      type: 'clip',
      clip,
    })
  }

  // unclip 使用 无 完成终端渲染里的对应操作。
  unclip() {
    // operations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.operations.push({
      type: 'unclip',
    })
  }

  // get不依赖额外参数，直接计算终端渲染需要的结果。
  get(): Screen {
    // screen 命名 `this.screen`，让后续代码直接表达这个值的用途。
    const screen = this.screen
    // screenWidth保存`this.width`，供后续判断或组装使用。
    const screenWidth = this.width
    // screenHeight保存`this.height`，供Ink 渲染层 output后续判断或输出使用。
    const screenHeight = this.height

    // Track blit vs write cell counts for debugging
    // blitCells 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let blitCells = 0
    // writeCells 集合保存`0`，供Ink 渲染层 output后续判断或输出使用。
    let writeCells = 0

    // Pass 1: expand damage to cover clear regions. The buffer is freshly
    // zeroed by resetScreen, so this pass only marks damage so diff()
    // checks these regions against the previous frame.
    //
    // Also collect clears from absolute-positioned nodes. An absolute
    // node overlays normal-flow siblings; when it shrinks, its clear is
    // pushed AFTER those siblings' clean-subtree blits (DOM order). The
    // blit copies the absolute node's own stale paint from prevScreen,
    // and since clear is damage-only, the ghost survives diff. Normal-
    // flow clears don't need this — a normal-flow node's old position
    // can't have been painted on top of a sibling's current position.
    // absoluteClears 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const absoluteClears: Rectangle[] = []
    // 按顺序遍历 `this.operations` 中的operation，逐个交给终端渲染处理。
    for (const operation of this.operations) {
      // `operation.type` 与 `'clear'` 不一致时刷新派生状态，避免使用过期结果。
      if (operation.type !== 'clear') continue
      // 从 `operation.region` 解构 x、y、width、height，减少Ink 渲染层 output对同一对象的重复访问。
      const { x, y, width, height } = operation.region
      // startX保存`Math.max`，供终端渲染后续处理使用。
      const startX = Math.max(0, x)
      // startY保存`Math.max`，供终端渲染后续处理使用。
      const startY = Math.max(0, y)
      // maxX保存`Math.min`，供终端渲染后续处理使用。
      const maxX = Math.min(x + width, screenWidth)
      // maxY保存`Math.min`，供终端渲染后续处理使用。
      const maxY = Math.min(y + height, screenHeight)
      // 只有 `startX >= maxX || startY >= maxY` 满足时，终端渲染才执行该分支。
      if (startX >= maxX || startY >= maxY) continue
      // rect 集中保存Ink 渲染层 output要一起传递的字段。
      const rect = {
        x: startX,
        y: startY,
        width: maxX - startX,
        height: maxY - startY,
      }
      // damage更新为 `screen.damage ? unionRect(screen.damage, rect) : rect`，确保Ink 渲染层后续读取最新状态。
      screen.damage = screen.damage ? unionRect(screen.damage, rect) : rect
      // 满足 `operation.fromAbsolute) absoluteClears.push(rect` 时，终端渲染执行该分支。
      if (operation.fromAbsolute) absoluteClears.push(rect)
    }

    // clips 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const clips: Clip[] = []

    // 按顺序遍历 `this.operations` 中的operation，逐个交给终端渲染处理。
    for (const operation of this.operations) {
      // 按照 operation.type 的取值选择终端渲染的具体处理分支。
      switch (operation.type) {
        case 'clear':
          // handled in pass 1
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue

        case 'clip':
          // Intersect with the parent clip (if any) so nested
          // overflow:hidden boxes can't write outside their ancestor's
          // clip region. Without this, a message with overflow:hidden at
          // the bottom of a scrollbox pushes its OWN clip (based on its
          // layout bounds, already translated by -scrollTop) which can
          // extend below the scrollbox viewport — writes escape into
          // the sibling bottom section's rows.
          // clips 集合追加新条目，保持收集顺序与输入顺序一致。
          clips.push(intersectClip(clips.at(-1), operation.clip))
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue

        case 'unclip':
          // 调用 clips.pop，触发终端渲染此处需要的副作用。
          clips.pop()
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue

        case 'blit': {
          // Bulk-copy cells from source screen region using TypedArray.set().
          // Tracking damage ensures diff() checks blitted cells for stale content
          // when a parent blits an area that previously contained child content.
          // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
          const {
            src,
            x: regionX,
            y: regionY,
            width: regionWidth,
            height: regionHeight,
          } = operation
          // Intersect with active clip — a child's clean-blit passes its full
          // cached rect, but the parent ScrollBox may have shrunk (pill mount).
          // Without this, the blit writes past the ScrollBox's new bottom edge
          // into the pill's row.
          // clip保存`clips.at`，供终端渲染后续处理使用。
          const clip = clips.at(-1)
          // startX保存`Math.max`，供终端渲染后续处理使用。
          const startX = Math.max(regionX, clip?.x1 ?? 0)
          // startY保存`Math.max`，供终端渲染后续处理使用。
          const startY = Math.max(regionY, clip?.y1 ?? 0)
          // maxY保存`Math.min`，供终端渲染后续处理使用。
          const maxY = Math.min(
            regionY + regionHeight,
            screenHeight,
            src.height,
            clip?.y2 ?? Infinity,
          )
          // maxX保存`Math.min`，供终端渲染后续处理使用。
          const maxX = Math.min(
            regionX + regionWidth,
            screenWidth,
            src.width,
            clip?.x2 ?? Infinity,
          )
          // 只有 `startX >= maxX || startY >= maxY` 满足时，终端渲染才执行该分支。
          if (startX >= maxX || startY >= maxY) continue
          // Skip rows covered by an absolute-positioned node's clear.
          // Absolute nodes overlay normal-flow siblings, so prevScreen in
          // that region holds the absolute node's stale paint — blitting
          // it back would ghost. See absoluteClears collection above.
          // absoluteClears 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
          if (absoluteClears.length === 0) {
            // 调用 blitRegion，触发终端渲染此处需要的副作用。
            blitRegion(screen, src, startX, startY, maxX, maxY)
            // Ink 渲染层 output在这里处理 `blitCells += (maxY - startY) * (maxX - startX)`，完成这一小步状态转换。
            blitCells += (maxY - startY) * (maxX - startX)
            // 跳过当前项，继续处理终端渲染中的下一轮循环。
            continue
          }
          // rowStart保存`startY`，供Ink 渲染层 output后续判断或输出使用。
          let rowStart = startY
          // 循环处理 `let row = startY; row <= maxY; row++`，让终端渲染逐项把同类条目按顺序走完。
          for (let row = startY; row <= maxY; row++) {
            // excluded 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const excluded =
              row < maxY &&
              absoluteClears.some(
                // r更新为 `>`，确保Ink 渲染层后续读取最新状态。
                r =>
                  row >= r.y &&
                  row < r.y + r.height &&
                  startX >= r.x &&
                  maxX <= r.x + r.width,
              )
            // 只有 `excluded || row === maxY` 满足时，终端渲染才执行该分支。
            if (excluded || row === maxY) {
              // 满足 `row > rowStart` 时，终端渲染执行该分支。
              if (row > rowStart) {
                // 调用 blitRegion，触发终端渲染此处需要的副作用。
                blitRegion(screen, src, startX, rowStart, maxX, row)
                // Ink 渲染层 output在这里处理 `blitCells += (row - rowStart) * (maxX - startX)`，完成这一小步状态转换。
                blitCells += (row - rowStart) * (maxX - startX)
              }
              // rowStart更新为 `row + 1`，确保Ink 渲染层后续读取最新状态。
              rowStart = row + 1
            }
          }
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }

        case 'shift': {
          // 调用 shiftRows，触发终端渲染此处需要的副作用。
          shiftRows(screen, operation.top, operation.bottom, operation.n)
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }

        case 'write': {
          // 从 `operation` 解构 text、softWrap，减少Ink 渲染层 output对同一对象的重复访问。
          const { text, softWrap } = operation
          // 从 `operation` 解构 x、y，减少Ink 渲染层 output对同一对象的重复访问。
          let { x, y } = operation
          // 文本行格式化`text.split`，供终端渲染后续处理使用。
          let lines = text.split('\n')
          // swFrom 命名 `0`，让后续代码直接表达这个值的用途。
          let swFrom = 0
          // prevContentEnd保存`0`，供Ink 渲染层 output后续判断或输出使用。
          let prevContentEnd = 0

          // clip保存`clips.at`，供终端渲染后续处理使用。
          const clip = clips.at(-1)

          // 满足 `clip` 时，终端渲染执行该分支。
          if (clip) {
            // clipHorizontally 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const clipHorizontally =
              typeof clip?.x1 === 'number' && typeof clip?.x2 === 'number'

            // clipVertically 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const clipVertically =
              typeof clip?.y1 === 'number' && typeof clip?.y2 === 'number'

            // If text is positioned outside of clipping area altogether,
            // skip to the next operation to avoid unnecessary calculations
            // 满足 `clipHorizontally` 时，终端渲染执行该分支。
            if (clipHorizontally) {
              // width保存`widestLine`，供终端渲染后续处理使用。
              const width = widestLine(text)

              // 只有 `x + width <= clip.x1! || x >= clip.x2!` 满足时，终端渲染才执行该分支。
              if (x + width <= clip.x1! || x >= clip.x2!) {
                // 跳过当前项，继续处理终端渲染中的下一轮循环。
                continue
              }
            }

            // 满足 `clipVertically` 时，终端渲染执行该分支。
            if (clipVertically) {
              // height保存 `lines.length` 的判断结果，供Ink 渲染层 output后续分支直接复用。
              const height = lines.length

              // 只有 `y + height <= clip.y1! || y >= clip.y2!` 满足时，终端渲染才执行该分支。
              if (y + height <= clip.y1! || y >= clip.y2!) {
                // 跳过当前项，继续处理终端渲染中的下一轮循环。
                continue
              }
            }

            // 满足 `clipHorizontally` 时，终端渲染执行该分支。
            if (clipHorizontally) {
              // 文本行更新为 `lines.map(line => {`，确保Ink 渲染层后续读取最新状态。
              lines = lines.map(line => {
                // from保存`x < clip.x1! ? clip.x1! - x : 0`，供Ink 渲染层 output后续判断或输出使用。
                const from = x < clip.x1! ? clip.x1! - x : 0
                // width保存`stringWidth`，供终端渲染后续处理使用。
                const width = stringWidth(line)
                // to保存`x + width > clip.x2! ? clip.x2! - x : width`，供后续判断或组装使用。
                const to = x + width > clip.x2! ? clip.x2! - x : width
                // sliced格式化`sliceAnsi`，供终端渲染后续处理使用。
                let sliced = sliceAnsi(line, from, to)
                // Wide chars (CJK, emoji) occupy 2 cells. When `to` lands
                // on the first cell of a wide char, sliceAnsi includes the
                // entire glyph and the result overflows clip.x2 by one cell,
                // writing a SpacerTail into the adjacent sibling. Re-slice
                // one cell earlier; wide chars are exactly 2 cells, so a
                // single retry always fits.
                // 满足 `stringWidth(sliced) > to - from` 时，终端渲染执行该分支。
                if (stringWidth(sliced) > to - from) {
                  // sliced更新为 `sliceAnsi(line, from, to - 1)`，确保Ink 渲染层后续读取最新状态。
                  sliced = sliceAnsi(line, from, to - 1)
                }
                // 返回 `sliced`，作为终端渲染这次计算的结果。
                return sliced
              })

              // 满足 `x < clip.x1!` 时，终端渲染执行该分支。
              if (x < clip.x1!) {
                // x更新为 `clip.x1!`，确保Ink 渲染层后续读取最新状态。
                x = clip.x1!
              }
            }

            // 满足 `clipVertically` 时，终端渲染执行该分支。
            if (clipVertically) {
              // from保存`y < clip.y1! ? clip.y1! - y : 0`，供Ink 渲染层 output后续判断或输出使用。
              const from = y < clip.y1! ? clip.y1! - y : 0
              // height保存 `lines.length` 的判断结果，供Ink 渲染层 output后续分支直接复用。
              const height = lines.length
              // to保存`y + height > clip.y2! ? clip.y2! - y : height`，供Ink 渲染层 output后续判断或输出使用。
              const to = y + height > clip.y2! ? clip.y2! - y : height

              // If the first visible line is a soft-wrap continuation, we
              // need the clipped previous line's content end so
              // screen.softWrap[lineY] correctly records the join point
              // even though that line's cells were never written.
              // 只有 `softWrap && from > 0 && softWrap[from] === true` 满足时，终端渲染才执行该分支。
              if (softWrap && from > 0 && softWrap[from] === true) {
                // prevContentEnd更新为 `x + stringWidth(lines[from - 1]!)`，确保Ink 渲染层后续读取最新状态。
                prevContentEnd = x + stringWidth(lines[from - 1]!)
              }

              // 文本行更新为 `lines.slice(from, to)`，确保Ink 渲染层后续读取最新状态。
              lines = lines.slice(from, to)
              // swFrom更新为 `from`，确保Ink 渲染层后续读取最新状态。
              swFrom = from

              // 满足 `y < clip.y1!` 时，终端渲染执行该分支。
              if (y < clip.y1!) {
                // y更新为 `clip.y1!`，确保Ink 渲染层后续读取最新状态。
                y = clip.y1!
              }
            }
          }

          // swBits 集合保存`screen.softWrap`，供后续判断或组装使用。
          const swBits = screen.softWrap
          // offsetY 命名 `0`，让后续代码直接表达这个值的用途。
          let offsetY = 0

          // 按顺序遍历 `lines` 中的line，逐个交给终端渲染处理。
          for (const line of lines) {
            // lineY保存`y + offsetY`，供Ink 渲染层 output后续判断或输出使用。
            const lineY = y + offsetY
            // Line can be outside screen if `text` is taller than screen height
            // 满足 `lineY >= screenHeight` 时，终端渲染执行该分支。
            if (lineY >= screenHeight) {
              // 结束这个分支或循环，避免终端渲染继续落入后续路径。
              break
            }
            // contentEnd保存`writeLineToScreen`，供终端渲染后续处理使用。
            const contentEnd = writeLineToScreen(
              screen,
              line,
              x,
              lineY,
              screenWidth,
              this.stylePool,
              this.charCache,
            )
            // Ink 渲染层 output在这里处理 `writeCells += contentEnd - x`，完成这一小步状态转换。
            writeCells += contentEnd - x
            // See Screen.softWrap docstring for the encoding. contentEnd
            // from writeLineToScreen is tab-expansion-aware, unlike
            // x+stringWidth(line) which treats tabs as width 0.
            // 满足 `softWrap` 时，终端渲染执行该分支。
            if (softWrap) {
              // isSW标记Ink 渲染层 output是否启用对应路径。
              const isSW = softWrap[swFrom + offsetY] === true
              // swBits[lineY更新为 `isSW ? prevContentEnd : 0`，确保Ink 渲染层 output后续读取最新状态。
              swBits[lineY] = isSW ? prevContentEnd : 0
              // prevContentEnd更新为 `contentEnd`，确保Ink 渲染层后续读取最新状态。
              prevContentEnd = contentEnd
            }
            // Ink 渲染层 output在这里处理 `offsetY++`，完成这一小步状态转换。
            offsetY++
          }
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }
      }
    }

    // noSelect ops go LAST so they win over blits (which copy noSelect
    // from prevScreen) and writes (which don't touch noSelect). This way
    // a <NoSelect> box correctly fences its region even when the parent
    // blits, and moving a <NoSelect> between frames correctly clears the
    // old region (resetScreen already zeroed the bitmap).
    // 按顺序遍历 `this.operations` 中的operation，逐个交给终端渲染处理。
    for (const operation of this.operations) {
      // 当 `operation.type` 匹配 `'noSelect'` 时，终端渲染执行对应分支。
      if (operation.type === 'noSelect') {
        // 从 `operation.region` 解构 x、y、width、height，减少Ink 渲染层 output对同一对象的重复访问。
        const { x, y, width, height } = operation.region
        // 调用 markNoSelectRegion，触发终端渲染此处需要的副作用。
        markNoSelectRegion(screen, x, y, width, height)
      }
    }

    // Log blit/write ratio for debugging - high write count suggests blitting isn't working
    // totalCells 集合保存`blitCells + writeCells`，供Ink 渲染层 output后续判断或输出使用。
    const totalCells = blitCells + writeCells
    // 只有 `totalCells > 1000 && writeCells > blitCells` 满足时，终端渲染才执行该分支。
    if (totalCells > 1000 && writeCells > blitCells) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `High write ratio: blit=${blitCells}, write=${writeCells} (${((writeCells / totalCells) * 100).toFixed(1)}% writes), screen=${screenHeight}x${screenWidth}`,
      )
    }

    // 返回 `screen`，作为终端渲染这次计算的结果。
    return screen
  }
}

// stylesEqual 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stylesEqual(a: AnsiCode[], b: AnsiCode[]): boolean {
  // 满足 `a === b` 时，终端渲染执行该分支。
  if (a === b) return true // Reference equality fast path
  // len记录 `a.length` 是否成立，下一步按该结果分支。
  const len = a.length
  // `len` 与 `b.length` 不一致时刷新派生状态，避免使用过期结果。
  if (len !== b.length) return false
  // 满足 `len === 0` 时，终端渲染执行该分支。
  if (len === 0) return true // Both empty
  // 按索引扫描 `len`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < len; i++) {
    // `a[i]!.code` 与 `b[i]!.code` 不一致时刷新派生状态，避免使用过期结果。
    if (a[i]!.code !== b[i]!.code) return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Convert a string with ANSI codes into styled characters with proper grapheme
 * clustering. Fixes ansi-tokenize splitting grapheme clusters (like family
 * emojis) into individual code points.
 *
 * Also precomputes styleId + hyperlink per style run (not per char) — an
 * 80-char line with 3 style runs does 3 intern calls instead of 80.
 */
// styledCharsWithGraphemeClustering 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function styledCharsWithGraphemeClustering(
  chars: StyledChar[],
  stylePool: StylePool,
): ClusteredChar[] {
  // charCount 数量记录 `chars.length` 是否成立，下一步按该结果分支。
  const charCount = chars.length
  // 满足 `charCount === 0` 时，终端渲染执行该分支。
  if (charCount === 0) return []

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: ClusteredChar[] = []
  // bufferChars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const bufferChars: string[] = []
  // bufferStyles 集合 命名 `chars[0]!.styles`，让后续代码直接表达这个值的用途。
  let bufferStyles: AnsiCode[] = chars[0]!.styles

  // 按索引扫描 `charCount`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < charCount; i++) {
    // char读取 `chars[i]!` 对应条目，后续围绕该成员继续处理。
    const char = chars[i]!
    // styles 集合保存`char.styles`，供Ink 渲染层 output后续判断或输出使用。
    const styles = char.styles

    // Different styles means we need to flush and start new buffer
    // 只有 `bufferChars.length > 0 && !stylesEqual(styles, bufferStyles)` 满足时，终端渲染才执行该分支。
    if (bufferChars.length > 0 && !stylesEqual(styles, bufferStyles)) {
      // 调用 flushBuffer，触发终端渲染此处需要的副作用。
      flushBuffer(bufferChars.join(''), bufferStyles, stylePool, result)
      // bufferChars 集合被清空，Ink 渲染层从干净状态继续。
      bufferChars.length = 0
    }

    // bufferChars 集合追加新条目，保持收集顺序与输入顺序一致。
    bufferChars.push(char.value)
    // bufferStyles 集合更新为 `styles`，确保Ink 渲染层后续读取最新状态。
    bufferStyles = styles
  }

  // Final flush
  // 满足 `bufferChars.length > 0` 时，终端渲染执行该分支。
  if (bufferChars.length > 0) {
    // 调用 flushBuffer，触发终端渲染此处需要的副作用。
    flushBuffer(bufferChars.join(''), bufferStyles, stylePool, result)
  }

  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

// flushBuffer 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flushBuffer(
  buffer: string,
  styles: AnsiCode[],
  stylePool: StylePool,
  out: ClusteredChar[],
): void {
  // Compute styleId + hyperlink ONCE for the whole style run.
  // Every grapheme in this buffer shares the same styles.
  //
  // Extract and track hyperlinks separately, filter from styles.
  // Always check for OSC 8 codes to filter, not just when a URL is
  // extracted. The tokenizer treats OSC 8 close codes (empty URL) as
  // active styles, so they must be filtered even when no hyperlink
  // URL is present.
  // hyperlink保存`extractHyperlinkFromStyles`，供终端渲染后续处理使用。
  const hyperlink = extractHyperlinkFromStyles(styles) ?? undefined
  // hasOsc8Styles 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasOsc8Styles =
    hyperlink !== undefined ||
    styles.some(
      // s 集合更新为 `>`，确保Ink 渲染层后续读取最新状态。
      s =>
        s.code.length >= OSC8_PREFIX.length && s.code.startsWith(OSC8_PREFIX),
    )
  // filteredStyles 集合保存`hasOsc8Styles`，供Ink 渲染层 output后续判断或输出使用。
  const filteredStyles = hasOsc8Styles
    ? filterOutHyperlinkStyles(styles)
    : styles
  // styleId保存`stylePool.intern`，供终端渲染后续处理使用。
  const styleId = stylePool.intern(filteredStyles)

  // 循环处理 `const { segment: grapheme } of getGraphemeSegmenter().segment(buffer)`，让终端渲染把同类条目按顺序走完。
  for (const { segment: grapheme } of getGraphemeSegmenter().segment(buffer)) {
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push({
      value: grapheme,
      width: stringWidth(grapheme),
      styleId,
      hyperlink,
    })
  }
}

/**
 * Write a single line's characters into the screen buffer.
 * Extracted from Output.get() so JSC can optimize this tight,
 * monomorphic loop independently — better register allocation,
 * setCellAt inlining, and type feedback than when buried inside
 * a 300-line dispatch function.
 *
 * Returns the end column (x + visual width, including tab expansion) so
 * the caller can record it in screen.softWrap without re-walking the
 * line via stringWidth(). Caller computes the debug cell-count as end-x.
 */
// writeLineToScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeLineToScreen(
  screen: Screen,
  line: string,
  x: number,
  y: number,
  screenWidth: number,
  stylePool: StylePool,
  charCache: Map<string, ClusteredChar[]>,
): number {
  // characters 集合读取`charCache.get`，供终端渲染后续处理使用。
  let characters = charCache.get(line)
  // characters 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!characters) {
    // characters 集合更新为 `reorderBidi(`，确保Ink 渲染层后续读取最新状态。
    characters = reorderBidi(
      styledCharsWithGraphemeClustering(
        styledCharsFromTokens(tokenize(line)),
        stylePool,
      ),
    )
    // charCache.set 写入新的状态值，使终端渲染后续读取保持一致。
    charCache.set(line, characters)
  }

  // offsetX保存`x`，供后续判断或组装使用。
  let offsetX = x

  // 循环处理 `let charIdx = 0; charIdx < characters.length; cha`，让终端渲染逐项把同类条目按顺序走完。
  for (let charIdx = 0; charIdx < characters.length; charIdx++) {
    // character读取 `characters[charIdx]!` 对应条目，后续围绕该成员继续处理。
    const character = characters[charIdx]!
    // codePoint保存`value.codePointAt`，供终端渲染后续处理使用。
    const codePoint = character.value.codePointAt(0)

    // Handle C0 control characters (0x00-0x1F) that cause cursor movement
    // mismatches. stringWidth treats these as width 0, but terminals may
    // move the cursor differently.
    // `codePoint` 与 `undefined && codePoint <= 0x1f` 不一致时刷新派生状态，避免使用过期结果。
    if (codePoint !== undefined && codePoint <= 0x1f) {
      // Tab (0x09): expand to spaces to reach next tab stop
      // 满足 `codePoint === 0x09` 时，终端渲染执行该分支。
      if (codePoint === 0x09) {
        // tabWidth 命名 `8`，让后续代码直接表达这个值的用途。
        const tabWidth = 8
        // spacesToNextStop 命名 `tabWidth - (offsetX % tabWidth)`，让后续代码直接表达这个值的用途。
        const spacesToNextStop = tabWidth - (offsetX % tabWidth)
        // 循环处理 `let i = 0; i < spacesToNextStop && offsetX < scre`，让终端渲染逐项把同类条目按顺序走完。
        for (let i = 0; i < spacesToNextStop && offsetX < screenWidth; i++) {
          // setCellAt 写入新的状态值，使终端渲染后续读取保持一致。
          setCellAt(screen, offsetX, y, {
            char: ' ',
            styleId: stylePool.none,
            width: CellWidth.Narrow,
            hyperlink: undefined,
          })
          // Ink 渲染层 output在这里处理 `offsetX++`，完成这一小步状态转换。
          offsetX++
        }
      }
      // ESC (0x1B): skip incomplete escape sequences that ansi-tokenize
      // didn't recognize. ansi-tokenize only parses SGR sequences (ESC[...m)
      // and OSC 8 hyperlinks (ESC]8;;url BEL). Other sequences like cursor
      // movement, screen clearing, or terminal title become individual char
      // tokens that we need to skip here.
      else if (codePoint === 0x1b) {
        // nextChar保存`characters[charIdx + 1]?.value`，供Ink 渲染层 output后续判断或输出使用。
        const nextChar = characters[charIdx + 1]?.value
        // nextCode保存`codePointAt`，供终端渲染后续处理使用。
        const nextCode = nextChar?.codePointAt(0)
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          nextChar === '(' ||
          nextChar === ')' ||
          nextChar === '*' ||
          nextChar === '+'
        ) {
          // Charset selection: ESC ( X, ESC ) X, etc.
          // Skip the intermediate char and the charset designator
          // Ink 渲染层 output在这里处理 `charIdx += 2`，完成这一小步状态转换。
          charIdx += 2
        // Ink 渲染层 output在这里处理 `} else if (nextChar === '[') {`，完成这一小步状态转换。
        } else if (nextChar === '[') {
          // CSI sequence: ESC [ ... final-byte
          // Final byte is in range 0x40-0x7E (@, A-Z, [\]^_`, a-z, {|}~)
          // Examples: ESC[2J (clear), ESC[?25l (cursor hide), ESC[H (home)
          // Ink 渲染层 output在这里处理 `charIdx++ // skip the [`，完成这一小步状态转换。
          charIdx++ // skip the [
          // while 使用 charIdx < characters.length - 1 完成终端渲染里的对应操作。
          while (charIdx < characters.length - 1) {
            // Ink 渲染层 output在这里处理 `charIdx++`，完成这一小步状态转换。
            charIdx++
            // c保存`value.codePointAt`，供终端渲染后续处理使用。
            const c = characters[charIdx]?.value.codePointAt(0)
            // Final byte terminates the sequence
            // `c` 与 `undefined && c >= 0x40 && c <= ...` 不一致时刷新派生状态，避免使用过期结果。
            if (c !== undefined && c >= 0x40 && c <= 0x7e) {
              // 结束这个分支或循环，避免终端渲染继续落入后续路径。
              break
            }
          }
        // Ink 渲染层 output在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          nextChar === ']' ||
          nextChar === 'P' ||
          nextChar === '_' ||
          nextChar === '^' ||
          nextChar === 'X'
        ) {
          // String-based sequences terminated by BEL (0x07) or ST (ESC \):
          // - OSC: ESC ] ... (Operating System Command)
          // - DCS: ESC P ... (Device Control String)
          // - APC: ESC _ ... (Application Program Command)
          // - PM:  ESC ^ ... (Privacy Message)
          // - SOS: ESC X ... (Start of String)
          // Ink 渲染层 output在这里处理 `charIdx++ // skip the introducer char`，完成这一小步状态转换。
          charIdx++ // skip the introducer char
          // while 使用 charIdx < characters.length - 1 完成终端渲染里的对应操作。
          while (charIdx < characters.length - 1) {
            // Ink 渲染层 output在这里处理 `charIdx++`，完成这一小步状态转换。
            charIdx++
            // c 命名 `characters[charIdx]?.value`，让后续代码直接表达这个值的用途。
            const c = characters[charIdx]?.value
            // BEL (0x07) terminates the sequence
            // 当 `c` 匹配 `'\x07'` 时，终端渲染执行对应分支。
            if (c === '\x07') {
              // 结束这个分支或循环，避免终端渲染继续落入后续路径。
              break
            }
            // ST (String Terminator) is ESC \
            // When we see ESC, check if next char is backslash
            // 当 `c` 匹配 `'\x1b'` 时，终端渲染执行对应分支。
            if (c === '\x1b') {
              // nextC 命名 `characters[charIdx + 1]?.value`，让后续代码直接表达这个值的用途。
              const nextC = characters[charIdx + 1]?.value
              // 当 `nextC` 匹配 `'\\'` 时，终端渲染执行对应分支。
              if (nextC === '\\') {
                // Ink 渲染层 output在这里处理 `charIdx++ // skip the backslash too`，完成这一小步状态转换。
                charIdx++ // skip the backslash too
                // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                break
              }
            }
          }
        // Ink 渲染层 output在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          nextCode !== undefined &&
          nextCode >= 0x30 &&
          nextCode <= 0x7e
        ) {
          // Single-character escape sequences: ESC followed by 0x30-0x7E
          // (excluding the multi-char introducers already handled above)
          // - Fp range (0x30-0x3F): ESC 7 (save cursor), ESC 8 (restore)
          // - Fe range (0x40-0x5F): ESC D (index), ESC M (reverse index)
          // - Fs range (0x60-0x7E): ESC c (reset)
          // Ink 渲染层 output在这里处理 `charIdx++ // skip the command char`，完成这一小步状态转换。
          charIdx++ // skip the command char
        }
      }
      // Carriage return (0x0D): would move cursor to column 0, skip it
      // Backspace (0x08): would move cursor left, skip it
      // Bell (0x07), vertical tab (0x0B), form feed (0x0C): skip
      // All other control chars (0x00-0x06, 0x0E-0x1F): skip
      // Note: newline (0x0A) is already handled by line splitting
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // Zero-width characters (combining marks, ZWNJ, ZWS, etc.)
    // don't occupy terminal cells — storing them as Narrow cells
    // desyncs the virtual cursor from the real terminal cursor.
    // Width was computed once during clustering (cached via charCache).
    // charWidth保存`character.width`，供Ink 渲染层 output后续判断或输出使用。
    const charWidth = character.width
    // 满足 `charWidth === 0` 时，终端渲染执行该分支。
    if (charWidth === 0) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // isWideCharacter标记Ink 渲染层 output是否启用对应路径。
    const isWideCharacter = charWidth >= 2

    // Wide char at last column can't fit — terminal would wrap it to
    // the next line, desyncing our cursor model. Place a SpacerHead
    // to mark the blank column, matching terminal behavior.
    // 只有 `isWideCharacter && offsetX + 2 > screenWidth` 满足时，终端渲染才执行该分支。
    if (isWideCharacter && offsetX + 2 > screenWidth) {
      // setCellAt 写入新的状态值，使终端渲染后续读取保持一致。
      setCellAt(screen, offsetX, y, {
        char: ' ',
        styleId: stylePool.none,
        width: CellWidth.SpacerHead,
        hyperlink: undefined,
      })
      // Ink 渲染层 output在这里处理 `offsetX++`，完成这一小步状态转换。
      offsetX++
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue
    }

    // styleId + hyperlink were precomputed during clustering (once per
    // style run, cached via charCache). Hot loop is now just property
    // reads — no intern, no extract, no filter per frame.
    // setCellAt 写入新的状态值，使终端渲染后续读取保持一致。
    setCellAt(screen, offsetX, y, {
      char: character.value,
      styleId: character.styleId,
      width: isWideCharacter ? CellWidth.Wide : CellWidth.Narrow,
      hyperlink: character.hyperlink,
    })
    // Ink 渲染层 output在这里处理 `offsetX += isWideCharacter ? 2 : 1`，完成这一小步状态转换。
    offsetX += isWideCharacter ? 2 : 1
  }

  // 返回 `offsetX`，作为终端渲染这次计算的结果。
  return offsetX
}
