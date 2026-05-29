// 类型依赖 { Cursor } 来自 ./cursor.js，用于校准终端渲染的数据契约。
import type { Cursor } from './cursor.js'
// 类型依赖 { Size } 来自 ./layout/geometry.js，用于校准终端渲染的数据契约。
import type { Size } from './layout/geometry.js'
// 类型依赖 { ScrollHint } 来自 ./render-node-to-output.js，用于校准终端渲染的数据契约。
import type { ScrollHint } from './render-node-to-output.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type CharPool,
  createScreen,
  type HyperlinkPool,
  type Screen,
  type StylePool,
} from './screen.js'

// Frame 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Frame = {
  readonly screen: Screen
  readonly viewport: Size
  readonly cursor: Cursor
  /** DECSTBM scroll optimization hint (alt-screen only, null otherwise). */
  readonly scrollHint?: ScrollHint | null
  /** A ScrollBox has remaining pendingScrollDelta — schedule another frame. */
  readonly scrollDrainPending?: boolean
}

// emptyFrame 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emptyFrame(
  rows: number,
  columns: number,
  stylePool: StylePool,
  charPool: CharPool,
  hyperlinkPool: HyperlinkPool,
): Frame {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    screen: createScreen(0, 0, stylePool, charPool, hyperlinkPool),
    viewport: { width: columns, height: rows },
    cursor: { x: 0, y: 0, visible: true },
  }
}

// FlickerReason 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FlickerReason = 'resize' | 'offscreen' | 'clear'

// FrameEvent 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FrameEvent = {
  durationMs: number
  /** Phase breakdown in ms + patch count. Populated when the ink instance
   *  has frame-timing instrumentation enabled (via onFrame wiring). */
  phases?: {
    /** createRenderer output: DOM → yoga layout → screen buffer */
    renderer: number
    /** LogUpdate.render(): screen diff → Patch[] (the hot path this PR optimizes) */
    diff: number
    /** optimize(): patch merge/dedupe */
    optimize: number
    /** writeDiffToTerminal(): serialize patches → ANSI → stdout */
    write: number
    /** Pre-optimize patch count (proxy for how much changed this frame) */
    patches: number
    /** yoga calculateLayout() time (runs in resetAfterCommit, before onRender) */
    yoga: number
    /** React reconcile time: scrollMutated → resetAfterCommit. 0 if no commit. */
    commit: number
    /** layoutNode() calls this frame (recursive, includes cache-hit returns) */
    yogaVisited: number
    /** measureFunc (text wrap/width) calls — the expensive part */
    yogaMeasured: number
    /** early returns via _hasL single-slot cache */
    yogaCacheHits: number
    /** total yoga Node instances alive (create - free). Growth = leak. */
    yogaLive: number
  }
  flickers: Array<{
    desiredHeight: number
    availableHeight: number
    reason: FlickerReason
  }>
}

// Patch 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Patch =
  | { type: 'stdout'; content: string }
  | { type: 'clear'; count: number }
  | {
      type: 'clearTerminal'
      reason: FlickerReason
      // Populated by log-update when a scrollback diff triggers the reset.
      // ink.tsx uses triggerY with findOwnerChainAtRow to attribute the
      // flicker to its source React component.
      debug?: { triggerY: number; prevLine: string; nextLine: string }
    }
  | { type: 'cursorHide' }
  | { type: 'cursorShow' }
  | { type: 'cursorMove'; x: number; y: number }
  | { type: 'cursorTo'; col: number }
  | { type: 'carriageReturn' }
  | { type: 'hyperlink'; uri: string }
  // Pre-serialized style transition string from StylePool.transition() —
  // cached by (fromId, toId), zero allocations after warmup.
  | { type: 'styleStr'; str: string }

// Diff 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Diff = Patch[]

/**
 * Determines whether the screen should be cleared based on the current and previous frame.
 * Returns the reason for clearing, or undefined if no clear is needed.
 *
 * Screen clearing is triggered when:
 * 1. Terminal has been resized (viewport dimensions changed) → 'resize'
 * 2. Current frame screen height exceeds available terminal rows → 'offscreen'
 * 3. Previous frame screen height exceeded available terminal rows → 'offscreen'
 */
// shouldClearScreen 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldClearScreen(
  prevFrame: Frame,
  frame: Frame,
): FlickerReason | undefined {
  // didResize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const didResize =
    frame.viewport.height !== prevFrame.viewport.height ||
    frame.viewport.width !== prevFrame.viewport.width
  // 满足 `didResize` 时，终端渲染执行该分支。
  if (didResize) {
    // 返回 `'resize'`，作为终端渲染这次计算的结果。
    return 'resize'
  }

  // currentFrameOverflows 集合保存`frame.screen.height >= frame.viewport.height`，供后续判断或组装使用。
  const currentFrameOverflows = frame.screen.height >= frame.viewport.height
  // previousFrameOverflowed 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const previousFrameOverflowed =
    prevFrame.screen.height >= prevFrame.viewport.height
  // 只有 `currentFrameOverflows || previousFrameOverflowed` 满足时，终端渲染才执行该分支。
  if (currentFrameOverflows || previousFrameOverflowed) {
    // 返回 `'offscreen'`，作为终端渲染这次计算的结果。
    return 'offscreen'
  }

  // 返回 `undefined`，作为终端渲染这次计算的结果。
  return undefined
}
