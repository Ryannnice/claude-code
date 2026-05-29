// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 DOMElement、markDirty，将 ./dom.js 中已经封装好的能力接到本文件流程里。
import { type DOMElement, markDirty } from './dom.js'
// 类型依赖 { Frame } 来自 ./frame.js，用于校准终端渲染的数据契约。
import type { Frame } from './frame.js'
// 引入 consumeAbsoluteRemovedFlag，将 ./node-cache.js 中已经封装好的能力接到本文件流程里。
import { consumeAbsoluteRemovedFlag } from './node-cache.js'
// 引入 Output，将 ./output.js 中已经封装好的能力接到本文件流程里。
import Output from './output.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import renderNodeToOutput, {
  getScrollDrainNode,
  getScrollHint,
  resetLayoutShifted,
  resetScrollDrainNode,
  resetScrollHint,
} from './render-node-to-output.js'
// 引入 createScreen、StylePool，将 ./screen.js 中已经封装好的能力接到本文件流程里。
import { createScreen, type StylePool } from './screen.js'

// RenderOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type RenderOptions = {
  frontFrame: Frame
  backFrame: Frame
  isTTY: boolean
  terminalWidth: number
  terminalRows: number
  altScreen: boolean
  // True when the previous frame's screen buffer was mutated post-render
  // (selection overlay), reset to blank (alt-screen enter/resize/SIGCONT),
  // or reset to 0×0 (forceRedraw). Blitting from such a prevScreen would
  // copy stale inverted cells, blanks, or nothing. When false, blit is safe.
  prevFrameContaminated: boolean
}

// Renderer 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Renderer = (options: RenderOptions) => Frame

// Ink 渲染层 renderer在这里处理 `export default function createRenderer(`，完成这一小步状态转换。
export default function createRenderer(
  node: DOMElement,
  stylePool: StylePool,
): Renderer {
  // Reuse Output across frames so charCache (tokenize + grapheme clustering)
  // persists — most lines don't change between renders.
  // output 先占位，稍后的条件分支会根据实际输入补齐它。
  let output: Output | undefined
  // 返回 `options => {`，作为终端渲染这次计算的结果。
  return options => {
    // Ink 渲染层 renderer先整理这一处局部数据，后续分支可以直接读取。
    const { frontFrame, backFrame, isTTY, terminalWidth, terminalRows } =
      options
    // prevScreen保存`frontFrame.screen`，供Ink 渲染层 renderer后续判断或输出使用。
    const prevScreen = frontFrame.screen
    // backScreen 命名 `backFrame.screen`，让后续代码直接表达这个值的用途。
    const backScreen = backFrame.screen
    // Read pools from the back buffer's screen — pools may be replaced
    // between frames (generational reset), so we can't capture them in the closure
    // charPool保存`backScreen.charPool`，供后续判断或组装使用。
    const charPool = backScreen.charPool
    // hyperlinkPool保存`backScreen.hyperlinkPool`，供后续判断或组装使用。
    const hyperlinkPool = backScreen.hyperlinkPool

    // Return empty frame if yoga node doesn't exist or layout hasn't been computed yet.
    // getComputedHeight() returns NaN before calculateLayout() is called.
    // Also check for invalid dimensions (negative, Infinity) that would cause RangeError
    // when creating arrays.
    // computedHeight读取`getComputedHeight`，供终端渲染后续处理使用。
    const computedHeight = node.yogaNode?.getComputedHeight()
    // computedWidth读取`getComputedWidth`，供终端渲染后续处理使用。
    const computedWidth = node.yogaNode?.getComputedWidth()
    // hasInvalidHeight 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasInvalidHeight =
      computedHeight === undefined ||
      !Number.isFinite(computedHeight) ||
      computedHeight < 0
    // hasInvalidWidth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasInvalidWidth =
      computedWidth === undefined ||
      !Number.isFinite(computedWidth) ||
      computedWidth < 0

    // 只有 `!node.yogaNode || hasInvalidHeight || hasInvalidW` 满足时，终端渲染才执行该分支。
    if (!node.yogaNode || hasInvalidHeight || hasInvalidWidth) {
      // Log to help diagnose root cause (visible with --debug flag)
      // 只有 `node.yogaNode && (hasInvalidHeight || hasInvalidWidth)` 满足时，终端渲染才执行该分支。
      if (node.yogaNode && (hasInvalidHeight || hasInvalidWidth)) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Invalid yoga dimensions: width=${computedWidth}, height=${computedHeight}, ` +
            `childNodes=${node.childNodes.length}, terminalWidth=${terminalWidth}, terminalRows=${terminalRows}`,
        )
      }
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        screen: createScreen(
          terminalWidth,
          0,
          stylePool,
          charPool,
          hyperlinkPool,
        ),
        viewport: { width: terminalWidth, height: terminalRows },
        cursor: { x: 0, y: 0, visible: true },
      }
    }

    // width保存`Math.floor`，供终端渲染后续处理使用。
    const width = Math.floor(node.yogaNode.getComputedWidth())
    // yogaHeight保存`Math.floor`，供终端渲染后续处理使用。
    const yogaHeight = Math.floor(node.yogaNode.getComputedHeight())
    // Alt-screen: the screen buffer IS the alt buffer — always exactly
    // terminalRows tall. <AlternateScreen> wraps children in <Box
    // height={rows} flexShrink={0}>, so yogaHeight should equal
    // terminalRows. But if something renders as a SIBLING of that Box
    // (bug: MessageSelector was outside <FullscreenLayout>), yogaHeight
    // exceeds rows and every assumption below (viewport +1 hack, cursor.y
    // clamp, log-update's heightDelta===0 fast path) breaks, desyncing
    // virtual/physical cursors. Clamping here enforces the invariant:
    // overflow writes land at y >= screen.height and setCellAt drops
    // them. The sibling is invisible (obvious, easy to find) instead of
    // corrupting the whole terminal.
    // height 命名 `options.altScreen ? terminalRows : yogaHeight`，让后续代码直接表达这个值的用途。
    const height = options.altScreen ? terminalRows : yogaHeight
    // 只有 `options.altScreen && yogaHeight > terminalRows` 满足时，终端渲染才执行该分支。
    if (options.altScreen && yogaHeight > terminalRows) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `alt-screen: yoga height ${yogaHeight} > terminalRows ${terminalRows} — ` +
          `something is rendering outside <AlternateScreen>. Overflow clipped.`,
        { level: 'warn' },
      )
    }
    // screen 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const screen =
      backScreen ??
      createScreen(width, height, stylePool, charPool, hyperlinkPool)
    // 满足 `output` 时，终端渲染执行该分支。
    if (output) {
      // 调用 output.reset，触发终端渲染此处需要的副作用。
      output.reset(width, height, screen)
    } else {
      // output更新为 `new Output({ width, height, stylePool, screen })`，确保Ink 渲染层后续读取最新状态。
      output = new Output({ width, height, stylePool, screen })
    }

    // 调用 resetLayoutShifted，触发终端渲染此处需要的副作用。
    resetLayoutShifted()
    // 调用 resetScrollHint，触发终端渲染此处需要的副作用。
    resetScrollHint()
    // 调用 resetScrollDrainNode，触发终端渲染此处需要的副作用。
    resetScrollDrainNode()

    // prevFrameContaminated: selection overlay mutated the returned screen
    // buffer post-render (in ink.tsx), resetFramesForAltScreen() replaced it
    // with blanks, or forceRedraw() reset it to 0×0. Blit on the NEXT frame
    // would copy stale inverted cells / blanks / nothing. When clean, blit
    // restores the O(unchanged) fast path for steady-state frames (spinner
    // tick, text stream).
    // Removing an absolute-positioned node poisons prevScreen: it may
    // have painted over non-siblings (e.g. an overlay over a ScrollBox
    // earlier in tree order), so their blits would restore the removed
    // node's pixels. hasRemovedChild only shields direct siblings.
    // Normal-flow removals don't paint cross-subtree and are fine.
    // absoluteRemoved保存`consumeAbsoluteRemovedFlag`，供终端渲染后续处理使用。
    const absoluteRemoved = consumeAbsoluteRemovedFlag()
    // 调用 renderNodeToOutput，触发终端渲染此处需要的副作用。
    renderNodeToOutput(node, output, {
      prevScreen:
        absoluteRemoved || options.prevFrameContaminated
          ? undefined
          : prevScreen,
    })

    // renderedScreen读取`output.get`，供终端渲染后续处理使用。
    const renderedScreen = output.get()

    // Drain continuation: render cleared scrollbox.dirty, so next frame's
    // root blit would skip the subtree. markDirty walks ancestors so the
    // next frame descends. Done AFTER render so the clear-dirty at the end
    // of renderNodeToOutput doesn't overwrite this.
    // drainNode读取`getScrollDrainNode`，供终端渲染后续处理使用。
    const drainNode = getScrollDrainNode()
    // 满足 `drainNode) markDirty(drainNode` 时，终端渲染执行该分支。
    if (drainNode) markDirty(drainNode)

    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      scrollHint: options.altScreen ? getScrollHint() : null,
      scrollDrainPending: drainNode !== null,
      screen: renderedScreen,
      viewport: {
        width: terminalWidth,
        // Alt screen: fake viewport.height = rows + 1 so that
        // shouldClearScreen()'s `screen.height >= viewport.height` check
        // (which treats exactly-filling content as "overflows" for
        // scrollback purposes) never fires. Alt-screen content is always
        // exactly `rows` tall (via <Box height={rows}>) but never
        // scrolls — the cursor.y clamp below keeps the cursor-restore
        // from emitting an LF. With the standard diff path, every frame
        // is incremental; no fullResetSequence_CAUSES_FLICKER.
        height: options.altScreen ? terminalRows + 1 : terminalRows,
      },
      cursor: {
        x: 0,
        // In the alt screen, keep the cursor inside the viewport. When
        // screen.height === terminalRows exactly (content fills the alt
        // screen), cursor.y = screen.height would trigger log-update's
        // cursor-restore LF at the last row, scrolling one row off the top
        // of the alt buffer and desyncing the diff's cursor model. The
        // cursor is hidden so its position only matters for diff coords.
        y: options.altScreen
          ? Math.max(0, Math.min(screen.height, terminalRows) - 1)
          : screen.height,
        // Hide cursor when there's dynamic output to render (only in TTY mode)
        visible: !isTTY || screen.height === 0,
      },
    }
  }
}
