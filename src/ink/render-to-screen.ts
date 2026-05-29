// 引入 noop，将 lodash-es/noop.js 中已经封装好的能力接到本文件流程里。
import noop from 'lodash-es/noop.js'
// 类型依赖 { ReactElement } 来自 react，用于校准终端渲染的数据契约。
import type { ReactElement } from 'react'
// 引入 LegacyRoot，将 react-reconciler/constants.js 中已经封装好的能力接到本文件流程里。
import { LegacyRoot } from 'react-reconciler/constants.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 引入 createNode、DOMElement，将 ./dom.js 中已经封装好的能力接到本文件流程里。
import { createNode, type DOMElement } from './dom.js'
// 引入 FocusManager，将 ./focus.js 中已经封装好的能力接到本文件流程里。
import { FocusManager } from './focus.js'
// 引入 Output，将 ./output.js 中已经封装好的能力接到本文件流程里。
import Output from './output.js'
// 引入 reconciler，将 ./reconciler.js 中已经封装好的能力接到本文件流程里。
import reconciler from './reconciler.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import renderNodeToOutput, {
  resetLayoutShifted,
} from './render-node-to-output.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CellWidth,
  CharPool,
  cellAtIndex,
  createScreen,
  HyperlinkPool,
  type Screen,
  StylePool,
  setCellStyleId,
} from './screen.js'

/** Position of a match within a rendered message, relative to the message's
 *  own bounding box (row 0 = message top). Stable across scroll — to
 *  highlight on the real screen, add the message's screen-row offset. */
// MatchPosition 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type MatchPosition = {
  row: number
  col: number
  /** Number of CELLS the match spans (= query.length for ASCII, more
   *  for wide chars in the query). */
  len: number
}

// Shared across calls. Pools accumulate style/char interns — reusing them
// means later calls hit cache more. Root/container reuse saves the
// createContainer cost (~1ms). LegacyRoot: all work sync, no scheduling —
// ConcurrentRoot's scheduler backlog leaks across roots via flushSyncWork.
// root 先占位，稍后的条件分支会根据实际输入补齐它。
let root: DOMElement | undefined
// container 先占位，稍后的条件分支会根据实际输入补齐它。
let container: ReturnType<typeof reconciler.createContainer> | undefined
// stylePool 先占位，稍后的条件分支会根据实际输入补齐它。
let stylePool: StylePool | undefined
// charPool 先占位，稍后的条件分支会根据实际输入补齐它。
let charPool: CharPool | undefined
// hyperlinkPool 先占位，稍后的条件分支会根据实际输入补齐它。
let hyperlinkPool: HyperlinkPool | undefined
// output 先占位，稍后的条件分支会根据实际输入补齐它。
let output: Output | undefined

// timing 集中保存Ink 渲染层 render to screen要一起传递的字段。
const timing = { reconcile: 0, yoga: 0, paint: 0, scan: 0, calls: 0 }
// LOG_EVERY 命名 `20`，让后续代码直接表达这个值的用途。
const LOG_EVERY = 20

/** Render a React element (wrapped in all contexts the component needs —
 *  caller's job) to an isolated Screen buffer at the given width. Returns
 *  the Screen + natural height (from yoga). Used for search: render ONE
 *  message, scan its Screen for the query, get exact (row, col) positions.
 *
 *  ~1-3ms per call (yoga alloc + calculateLayout + paint). The
 *  flushSyncWork cross-root leak measured ~0.0003ms/call growth — fine
 *  for on-demand single-message rendering, pathological for render-all-
 *  8k-upfront. Cache per (msg, query, width) upstream.
 *
 *  Unmounts between calls. Root/container/pools persist for reuse. */
// renderToScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToScreen(
  el: ReactElement,
  width: number,
): { screen: Screen; height: number } {
  // root缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!root) {
    // root更新为 `createNode('ink-root')`，确保Ink 渲染层后续读取最新状态。
    root = createNode('ink-root')
    // focusManager更新为 `new FocusManager(() => false)`，确保Ink 渲染层后续读取最新状态。
    root.focusManager = new FocusManager(() => false)
    // stylePool更新为 `new StylePool()`，确保Ink 渲染层后续读取最新状态。
    stylePool = new StylePool()
    // charPool更新为 `new CharPool()`，确保Ink 渲染层后续读取最新状态。
    charPool = new CharPool()
    // hyperlinkPool更新为 `new HyperlinkPool()`，确保Ink 渲染层后续读取最新状态。
    hyperlinkPool = new HyperlinkPool()
    // @ts-expect-error react-reconciler 0.33 takes 10 args; @types says 11
    // container更新为 `reconciler.createContainer(`，确保Ink 渲染层后续读取最新状态。
    container = reconciler.createContainer(
      root,
      LegacyRoot,
      null,
      false,
      null,
      'search-render',
      noop,
      noop,
      noop,
      noop,
    )
  }

  // 临时值 t0记录时间`performance.now`，供终端渲染后续处理使用。
  const t0 = performance.now()
  // @ts-expect-error updateContainerSync exists but not in @types
  // 调用 reconciler.updateContainerSync，触发终端渲染此处需要的副作用。
  reconciler.updateContainerSync(el, container, null, noop)
  // @ts-expect-error flushSyncWork exists but not in @types
  // 调用 reconciler.flushSyncWork，触发终端渲染此处需要的副作用。
  reconciler.flushSyncWork()
  // 临时值 t1记录时间`performance.now`，供终端渲染后续处理使用。
  const t1 = performance.now()

  // Yoga layout. Root might not have a yogaNode if the tree is empty.
  // 调用 root.yogaNode?.setWidth(width)，完成这一处局部操作。
  root.yogaNode?.setWidth(width)
  // 调用 root.yogaNode?.calculateLayout(width)，完成这一处局部操作。
  root.yogaNode?.calculateLayout(width)
  // height保存`Math.ceil`，供终端渲染后续处理使用。
  const height = Math.ceil(root.yogaNode?.getComputedHeight() ?? 0)
  // 临时值 t2记录时间`performance.now`，供终端渲染后续处理使用。
  const t2 = performance.now()

  // Paint to a fresh Screen. Width = given, height = yoga's natural.
  // No alt-screen, no prevScreen (every call is fresh).
  // screen构建`createScreen`，供终端渲染后续处理使用。
  const screen = createScreen(
    width,
    Math.max(1, height), // avoid 0-height Screen (createScreen may choke)
    stylePool!,
    charPool!,
    hyperlinkPool!,
  )
  // output缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!output) {
    // output更新为 `new Output({ width, height, stylePool: stylePool!, screen...`，确保Ink 渲染层后续读取最新状态。
    output = new Output({ width, height, stylePool: stylePool!, screen })
  } else {
    // 调用 output.reset，触发终端渲染此处需要的副作用。
    output.reset(width, height, screen)
  }
  // 调用 resetLayoutShifted，触发终端渲染此处需要的副作用。
  resetLayoutShifted()
  // 调用 renderNodeToOutput，触发终端渲染此处需要的副作用。
  renderNodeToOutput(root, output, { prevScreen: undefined })
  // renderNodeToOutput queues writes into Output; .get() flushes the
  // queue into the Screen's cell arrays. Without this the screen is
  // blank (constructor-zero).
  // rendered读取`output.get`，供终端渲染后续处理使用。
  const rendered = output.get()
  // 临时值 t3记录时间`performance.now`，供终端渲染后续处理使用。
  const t3 = performance.now()

  // Unmount so next call gets a fresh tree. Leaves root/container/pools.
  // @ts-expect-error updateContainerSync exists but not in @types
  // 调用 reconciler.updateContainerSync，触发终端渲染此处需要的副作用。
  reconciler.updateContainerSync(null, container, null, noop)
  // @ts-expect-error flushSyncWork exists but not in @types
  // 调用 reconciler.flushSyncWork，触发终端渲染此处需要的副作用。
  reconciler.flushSyncWork()

  // Ink 渲染层 render to screen在这里处理 `timing.reconcile += t1 - t0`，完成这一小步状态转换。
  timing.reconcile += t1 - t0
  // Ink 渲染层 render to screen在这里处理 `timing.yoga += t2 - t1`，完成这一小步状态转换。
  timing.yoga += t2 - t1
  // Ink 渲染层 render to screen在这里处理 `timing.paint += t3 - t2`，完成这一小步状态转换。
  timing.paint += t3 - t2
  // 满足 `++timing.calls % LOG_EVERY === 0` 时，终端渲染执行该分支。
  if (++timing.calls % LOG_EVERY === 0) {
    // total保存`timing.reconcile + timing.yoga + timing.paint + timing.sc...`，供后续判断或组装使用。
    const total = timing.reconcile + timing.yoga + timing.paint + timing.scan
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `renderToScreen: ${timing.calls} calls · ` +
        `reconcile=${timing.reconcile.toFixed(1)}ms yoga=${timing.yoga.toFixed(1)}ms ` +
        `paint=${timing.paint.toFixed(1)}ms scan=${timing.scan.toFixed(1)}ms · ` +
        `total=${total.toFixed(1)}ms · avg ${(total / timing.calls).toFixed(2)}ms/call`,
    )
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { screen: rendered, height }
}

/** Scan a Screen buffer for all occurrences of query. Returns positions
 *  relative to the buffer (row 0 = buffer top). Same cell-skip logic as
 *  applySearchHighlight (SpacerTail/SpacerHead/noSelect) so positions
 *  match what the overlay highlight would find. Case-insensitive.
 *
 *  For the side-render use: this Screen is the FULL message (natural
 *  height, not viewport-clipped). Positions are stable — to highlight
 *  on the real screen, add the message's screen offset (lo). */
// scanPositions 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function scanPositions(screen: Screen, query: string): MatchPosition[] {
  // lq保存`query.toLowerCase`，供终端渲染后续处理使用。
  const lq = query.toLowerCase()
  // lq缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!lq) return []
  // qlen保存 `lq.length` 的判断结果，供Ink 渲染层 render to screen后续分支直接复用。
  const qlen = lq.length
  // w 命名 `screen.width`，让后续代码直接表达这个值的用途。
  const w = screen.width
  // h保存`screen.height`，供Ink 渲染层 render to screen后续判断或输出使用。
  const h = screen.height
  // noSelect 命名 `screen.noSelect`，让后续代码直接表达这个值的用途。
  const noSelect = screen.noSelect
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: MatchPosition[] = []

  // 临时值 t0记录时间`performance.now`，供终端渲染后续处理使用。
  const t0 = performance.now()
  // 按索引扫描 `h`，需要消费相邻参数时可以精确移动游标。
  for (let row = 0; row < h; row++) {
    // rowOff保存`row * w`，供后续判断或组装使用。
    const rowOff = row * w
    // Same text-build as applySearchHighlight. Keep in sync — or extract
    // to a shared helper (TODO once both are stable). codeUnitToCell
    // maps indexOf positions (code units in the LOWERCASED text) to cell
    // indices in colOf — surrogate pairs (emoji) and multi-unit lowercase
    // (Turkish İ → i + U+0307) make text.length > colOf.length.
    // 文本 命名 `''`，让后续代码直接表达这个值的用途。
    let text = ''
    // colOf 从空数组开始收集，后续循环会按处理顺序追加条目。
    const colOf: number[] = []
    // codeUnitToCell 从空数组开始收集，后续循环会按处理顺序追加条目。
    const codeUnitToCell: number[] = []
    // 按索引扫描 `w`，需要消费相邻参数时可以精确移动游标。
    for (let col = 0; col < w; col++) {
      // idx保存`rowOff + col`，供Ink 渲染层 render to screen后续判断或输出使用。
      const idx = rowOff + col
      // cell保存`cellAtIndex`，供终端渲染后续处理使用。
      const cell = cellAtIndex(screen, idx)
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        cell.width === CellWidth.SpacerTail ||
        cell.width === CellWidth.SpacerHead ||
        noSelect[idx] === 1
      ) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
      // lc保存`char.toLowerCase`，供终端渲染后续处理使用。
      const lc = cell.char.toLowerCase()
      // cellIdx 命名 `colOf.length`，让后续代码直接表达这个值的用途。
      const cellIdx = colOf.length
      // 按索引扫描 `lc.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < lc.length; i++) {
        // codeUnitToCell追加新条目，保持收集顺序与输入顺序一致。
        codeUnitToCell.push(cellIdx)
      }
      // Ink 渲染层 render to screen在这里处理 `text += lc`，完成这一小步状态转换。
      text += lc
      // colOf追加新条目，保持收集顺序与输入顺序一致。
      colOf.push(col)
    }
    // Non-overlapping — same advance as applySearchHighlight.
    // pos 集合保存`text.indexOf`，供终端渲染后续处理使用。
    let pos = text.indexOf(lq)
    // while 使用 pos >= 0 完成终端渲染里的对应操作。
    while (pos >= 0) {
      // startCi保存`codeUnitToCell[pos]!`，供Ink 渲染层 render to screen后续判断或输出使用。
      const startCi = codeUnitToCell[pos]!
      // endCi保存`codeUnitToCell[pos + qlen - 1]!`，供Ink 渲染层 render to screen后续判断或输出使用。
      const endCi = codeUnitToCell[pos + qlen - 1]!
      // col读取 `colOf[startCi]!` 对应条目，后续围绕该成员继续处理。
      const col = colOf[startCi]!
      // endCol 命名 `colOf[endCi]! + 1`，让后续代码直接表达这个值的用途。
      const endCol = colOf[endCi]! + 1
      // positions 集合追加新条目，保持收集顺序与输入顺序一致。
      positions.push({ row, col, len: endCol - col })
      // pos 集合更新为 `text.indexOf(lq, pos + qlen)`，确保Ink 渲染层后续读取最新状态。
      pos = text.indexOf(lq, pos + qlen)
    }
  }
  // Ink 渲染层 render to screen在这里处理 `timing.scan += performance.now() - t0`，完成这一小步状态转换。
  timing.scan += performance.now() - t0

  // 返回 `positions`，作为终端渲染这次计算的结果。
  return positions
}

/** Write CURRENT (yellow+bold+underline) at positions[currentIdx] +
 *  rowOffset. OTHER positions are NOT styled here — the scan-highlight
 *  (applySearchHighlight with null hint) does inverse for all visible
 *  matches, including these. Two-layer: scan = 'you could go here',
 *  position = 'you ARE here'. Writing inverse again here would be a
 *  no-op (withInverse idempotent) but wasted work.
 *
 *  Positions are message-relative (row 0 = message top). rowOffset =
 *  message's current screen-top (lo). Clips outside [0, height). */
// applyPositionedHighlight 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyPositionedHighlight(
  screen: Screen,
  stylePool: StylePool,
  positions: MatchPosition[],
  rowOffset: number,
  currentIdx: number,
): boolean {
  // 只有 `currentIdx < 0 || currentIdx >= positions.length` 满足时，终端渲染才执行该分支。
  if (currentIdx < 0 || currentIdx >= positions.length) return false
  // p保存`positions[currentIdx]!`，供Ink 渲染层 render to screen后续判断或输出使用。
  const p = positions[currentIdx]!
  // row保存`p.row + rowOffset`，供Ink 渲染层 render to screen后续判断或输出使用。
  const row = p.row + rowOffset
  // 只有 `row < 0 || row >= screen.height` 满足时，终端渲染才执行该分支。
  if (row < 0 || row >= screen.height) return false
  // transform保存`stylePool.withCurrentMatch`，供终端渲染后续处理使用。
  const transform = (id: number) => stylePool.withCurrentMatch(id)
  // rowOff保存`row * screen.width`，供Ink 渲染层 render to screen后续判断或输出使用。
  const rowOff = row * screen.width
  // 循环处理 `let col = p.col; col < p.col + p.len; col++`，让终端渲染逐项把同类条目按顺序走完。
  for (let col = p.col; col < p.col + p.len; col++) {
    // 只有 `col < 0 || col >= screen.width` 满足时，终端渲染才执行该分支。
    if (col < 0 || col >= screen.width) continue
    // cell保存`cellAtIndex`，供终端渲染后续处理使用。
    const cell = cellAtIndex(screen, rowOff + col)
    // setCellStyleId 写入新的状态值，使终端渲染后续读取保持一致。
    setCellStyleId(screen, col, row, transform(cell.styleId))
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
