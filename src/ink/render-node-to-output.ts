// 引入 indentString，将 indent-string 中已经封装好的能力接到本文件流程里。
import indentString from 'indent-string'
// 引入 applyTextStyles，将 ./colorize.js 中已经封装好的能力接到本文件流程里。
import { applyTextStyles } from './colorize.js'
// 类型依赖 { DOMElement } 来自 ./dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from './dom.js'
// 引入 getMaxWidth，将 ./get-max-width.js 中已经封装好的能力接到本文件流程里。
import getMaxWidth from './get-max-width.js'
// 类型依赖 { Rectangle } 来自 ./layout/geometry.js，用于校准终端渲染的数据契约。
import type { Rectangle } from './layout/geometry.js'
// 引入 LayoutDisplay、LayoutEdge、LayoutNode，将 ./layout/node.js 中已经封装好的能力接到本文件流程里。
import { LayoutDisplay, LayoutEdge, type LayoutNode } from './layout/node.js'
// 引入 nodeCache、pendingClears，将 ./node-cache.js 中已经封装好的能力接到本文件流程里。
import { nodeCache, pendingClears } from './node-cache.js'
// 类型依赖 Output 来自 ./output.js，用于校准终端渲染的数据契约。
import type Output from './output.js'
// 引入 renderBorder，将 ./render-border.js 中已经封装好的能力接到本文件流程里。
import renderBorder from './render-border.js'
// 类型依赖 { Screen } 来自 ./screen.js，用于校准终端渲染的数据契约。
import type { Screen } from './screen.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type StyledSegment,
  squashTextNodesToSegments,
} from './squash-text-nodes.js'
// 类型依赖 { Color } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Color } from './styles.js'
// 引入 isXtermJs，将 ./terminal.js 中已经封装好的能力接到本文件流程里。
import { isXtermJs } from './terminal.js'
// 引入 widestLine，将 ./widest-line.js 中已经封装好的能力接到本文件流程里。
import { widestLine } from './widest-line.js'
// 引入 wrapText，将 ./wrap-text.js 中已经封装好的能力接到本文件流程里。
import wrapText from './wrap-text.js'

// Matches detectXtermJsWheel() in ScrollKeybindingHandler.tsx — the curve
// and drain must agree on terminal detection. TERM_PROGRAM check is the sync
// fallback; isXtermJs() is the authoritative XTVERSION-probe result.
// isXtermJsHost 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isXtermJsHost(): boolean {
  // 返回 `process.env.TERM_PROGRAM === 'vscode' || isXtermJs()`，作为终端渲染这次计算的结果。
  return process.env.TERM_PROGRAM === 'vscode' || isXtermJs()
}

// Per-frame scratch: set when any node's yoga position/size differs from
// its cached value, or a child was removed. Read by ink.tsx to decide
// whether the full-damage sledgehammer (PR #20120) is needed this frame.
// Applies on both alt-screen and main-screen. Steady-state frames
// (spinner tick, clock tick, text append into a fixed-height box) don't
// shift layout → narrow damage bounds → O(changed cells) diff instead of
// O(rows×cols).
// layoutShifted标记Ink 渲染层 render node to output是否启用对应路径。
let layoutShifted = false

// resetLayoutShifted 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetLayoutShifted(): void {
  // layoutShifted更新为 `false`，确保Ink 渲染层后续读取最新状态。
  layoutShifted = false
}

// didLayoutShift 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function didLayoutShift(): boolean {
  // 返回 `layoutShifted`，作为终端渲染这次计算的结果。
  return layoutShifted
}

// DECSTBM scroll optimization hint. When a ScrollBox's scrollTop changes
// between frames (and nothing else moved), log-update.ts can emit a
// hardware scroll (DECSTBM + SU/SD) instead of rewriting the whole
// viewport. top/bottom are 0-indexed inclusive screen rows; delta > 0 =
// content moved up (scrollTop increased, CSI n S).
// ScrollHint 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScrollHint = { top: number; bottom: number; delta: number }
// scrollHint 命名 `null`，让后续代码直接表达这个值的用途。
let scrollHint: ScrollHint | null = null

// Rects of position:absolute nodes from the PREVIOUS frame, used by
// ScrollBox's blit+shift third-pass repair (see usage site). Recorded at
// three paths — full-render nodeCache.set, node-level blit early-return,
// blitEscapingAbsoluteDescendants — so clean-overlay consecutive scrolls
// still have the rect.
// absoluteRectsPrev 从空数组开始收集，后续循环会按处理顺序追加条目。
let absoluteRectsPrev: Rectangle[] = []
// absoluteRectsCur 从空数组开始收集，后续循环会按处理顺序追加条目。
let absoluteRectsCur: Rectangle[] = []

// resetScrollHint 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetScrollHint(): void {
  // scrollHint更新为 `null`，确保Ink 渲染层后续读取最新状态。
  scrollHint = null
  // absoluteRectsPrev更新为 `absoluteRectsCur`，确保Ink 渲染层后续读取最新状态。
  absoluteRectsPrev = absoluteRectsCur
  // absoluteRectsCur更新为 `[]`，确保Ink 渲染层后续读取最新状态。
  absoluteRectsCur = []
}

// getScrollHint 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScrollHint(): ScrollHint | null {
  // 返回 `scrollHint`，作为终端渲染这次计算的结果。
  return scrollHint
}

// The ScrollBox DOM node (if any) with pendingScrollDelta left after this
// frame's drain. renderer.ts calls markDirty(it) post-render so the NEXT
// frame's root blit check fails and we descend to continue draining.
// Without this, after the scrollbox's dirty flag is cleared (line ~721),
// the next frame blits root and never reaches the scrollbox — drain stalls.
// scrollDrainNode保存`null`，作为后续空值处理的输入。
let scrollDrainNode: DOMElement | null = null

// resetScrollDrainNode 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetScrollDrainNode(): void {
  // scrollDrainNode更新为 `null`，确保Ink 渲染层后续读取最新状态。
  scrollDrainNode = null
}

// getScrollDrainNode 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScrollDrainNode(): DOMElement | null {
  // 返回 `scrollDrainNode`，作为终端渲染这次计算的结果。
  return scrollDrainNode
}

// At-bottom follow scroll event this frame. When streaming content
// triggers scrollTop = maxScroll, the ScrollBox records the delta +
// viewport bounds here. ink.tsx consumes it post-render to translate any active
// text selection by -delta so the highlight stays anchored to the TEXT
// (native terminal behavior — the selection walks up the screen as content
// scrolls, eventually clipping at the top). The frontFrame screen buffer
// still holds the old content at that point — captureScrolledRows reads
// from it before the front/back swap to preserve the text for copy.
// FollowScroll 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FollowScroll = {
  delta: number
  viewportTop: number
  viewportBottom: number
}
// followScroll 命名 `null`，让后续代码直接表达这个值的用途。
let followScroll: FollowScroll | null = null

// consumeFollowScroll 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumeFollowScroll(): FollowScroll | null {
  // f保存`followScroll`，供Ink 渲染层 render node to output后续判断或输出使用。
  const f = followScroll
  // followScroll更新为 `null`，确保Ink 渲染层后续读取最新状态。
  followScroll = null
  // 返回 `f`，作为终端渲染这次计算的结果。
  return f
}

// ── Native terminal drain (iTerm2/Ghostty/etc. — proportional events) ──
// Minimum rows applied per frame. Above this, drain is proportional (~3/4
// of remaining) so big bursts catch up in log₄ frames while the tail
// decelerates smoothly. Hard cap is innerHeight-1 so DECSTBM hint fires.
// SCROLL_MIN_PER_FRAME 命名 `4`，让后续代码直接表达这个值的用途。
const SCROLL_MIN_PER_FRAME = 4

// ── xterm.js (VS Code) smooth drain ──
// Low pending (≤5) drains ALL in one frame — slow wheel clicks should be
// instant (click → visible jump → done), not micro-stutter 1-row frames.
// Higher pending drains at a small fixed step so fast-scroll animation
// stays smooth (no big jumps). Pending >MAX snaps excess.
// SCROLL_INSTANT_THRESHOLD 命名 `5 // ≤ this: drain all at once`，让后续代码直接表达这个值的用途。
const SCROLL_INSTANT_THRESHOLD = 5 // ≤ this: drain all at once
// SCROLL_HIGH_PENDING保存`12 // threshold for HIGH step`，供Ink 渲染层 render node to output后续判断或输出使用。
const SCROLL_HIGH_PENDING = 12 // threshold for HIGH step
// SCROLL_STEP_MED保存`pending`，供终端渲染后续处理使用。
const SCROLL_STEP_MED = 2 // pending (INSTANT, HIGH): catch-up
// SCROLL_STEP_HIGH 命名 `3 // pending ≥ HIGH: fast flick`，让后续代码直接表达这个值的用途。
const SCROLL_STEP_HIGH = 3 // pending ≥ HIGH: fast flick
// SCROLL_MAX_PENDING保存`30 // snap excess beyond this`，供后续判断或组装使用。
const SCROLL_MAX_PENDING = 30 // snap excess beyond this

// xterm.js adaptive drain. Returns rows applied; mutates pendingScrollDelta.
// drainAdaptive 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function drainAdaptive(
  node: DOMElement,
  pending: number,
  innerHeight: number,
): number {
  // sign 命名 `pending > 0 ? 1 : -1`，让后续代码直接表达这个值的用途。
  const sign = pending > 0 ? 1 : -1
  // abs 集合保存`Math.abs`，供终端渲染后续处理使用。
  let abs = Math.abs(pending)
  // applied保存`0`，供Ink 渲染层 render node to output后续判断或输出使用。
  let applied = 0
  // Snap excess beyond animation window so big flicks don't coast.
  // 满足 `abs > SCROLL_MAX_PENDING` 时，终端渲染执行该分支。
  if (abs > SCROLL_MAX_PENDING) {
    // Ink 渲染层 render node to output在这里处理 `applied += sign * (abs - SCROLL_MAX_PENDING)`，完成这一小步状态转换。
    applied += sign * (abs - SCROLL_MAX_PENDING)
    // abs 集合更新为 `SCROLL_MAX_PENDING`，确保Ink 渲染层后续读取最新状态。
    abs = SCROLL_MAX_PENDING
  }
  // ≤5: drain all (slow click = instant). Above: small fixed step.
  // step 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const step =
    abs <= SCROLL_INSTANT_THRESHOLD
      ? abs
      : abs < SCROLL_HIGH_PENDING
        ? SCROLL_STEP_MED
        : SCROLL_STEP_HIGH
  // Ink 渲染层 render node to output在这里处理 `applied += sign * step`，完成这一小步状态转换。
  applied += sign * step
  // rem 命名 `abs - step`，让后续代码直接表达这个值的用途。
  const rem = abs - step
  // Cap total at innerHeight-1 so DECSTBM blit+shift fast path fires
  // (matches drainProportional). Excess stays in pendingScrollDelta.
  // cap保存`Math.max`，供终端渲染后续处理使用。
  const cap = Math.max(1, innerHeight - 1)
  // totalAbs 集合保存`Math.abs`，供终端渲染后续处理使用。
  const totalAbs = Math.abs(applied)
  // 满足 `totalAbs > cap` 时，终端渲染执行该分支。
  if (totalAbs > cap) {
    // excess 集合保存`totalAbs - cap`，供Ink 渲染层 render node to output后续判断或输出使用。
    const excess = totalAbs - cap
    // pendingScrollDelta更新为 `sign * (rem + excess)`，确保Ink 渲染层后续读取最新状态。
    node.pendingScrollDelta = sign * (rem + excess)
    // 返回 `sign * cap`，作为终端渲染这次计算的结果。
    return sign * cap
  }
  // pendingScrollDelta更新为 `rem > 0 ? sign * rem : undefined`，确保Ink 渲染层后续读取最新状态。
  node.pendingScrollDelta = rem > 0 ? sign * rem : undefined
  // 返回 `applied`，作为终端渲染这次计算的结果。
  return applied
}

// Native proportional drain. step = max(MIN, floor(abs*3/4)), capped at
// innerHeight-1 so DECSTBM + blit+shift fast path fire.
// drainProportional 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function drainProportional(
  node: DOMElement,
  pending: number,
  innerHeight: number,
): number {
  // abs 集合保存`Math.abs`，供终端渲染后续处理使用。
  const abs = Math.abs(pending)
  // cap保存`Math.max`，供终端渲染后续处理使用。
  const cap = Math.max(1, innerHeight - 1)
  // step保存`Math.min`，供终端渲染后续处理使用。
  const step = Math.min(cap, Math.max(SCROLL_MIN_PER_FRAME, (abs * 3) >> 2))
  // 满足 `abs <= step` 时，终端渲染执行该分支。
  if (abs <= step) {
    // pendingScrollDelta更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
    node.pendingScrollDelta = undefined
    // 返回 `pending`，作为终端渲染这次计算的结果。
    return pending
  }
  // applied 命名 `pending > 0 ? step : -step`，让后续代码直接表达这个值的用途。
  const applied = pending > 0 ? step : -step
  // pendingScrollDelta更新为 `pending - applied`，确保Ink 渲染层后续读取最新状态。
  node.pendingScrollDelta = pending - applied
  // 返回 `applied`，作为终端渲染这次计算的结果。
  return applied
}

// OSC 8 hyperlink escape sequences. Empty params (;;) — ansi-tokenize only
// recognizes this exact prefix. The id= param (for grouping wrapped lines)
// is added at terminal-output time in termio/osc.ts link().
// OSC 命名 `'\u001B]'`，让后续代码直接表达这个值的用途。
const OSC = '\u001B]'
// BEL 命名 `'\u0007'`，让后续代码直接表达这个值的用途。
const BEL = '\u0007'

// wrapWithOsc8Link 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wrapWithOsc8Link(text: string, url: string): string {
  // 返回 ``${OSC}8;;${url}${BEL}${text}${OSC}8;;${BEL}``，作为终端渲染这次计算的结果。
  return `${OSC}8;;${url}${BEL}${text}${OSC}8;;${BEL}`
}

/**
 * Build a mapping from each character position in the plain text to its segment index.
 * Returns an array where charToSegment[i] is the segment index for character i.
 */
// buildCharToSegmentMap 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildCharToSegmentMap(segments: StyledSegment[]): number[] {
  // map 从空数组开始收集，后续循环会按处理顺序追加条目。
  const map: number[] = []
  // 按索引扫描 `segments.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < segments.length; i++) {
    // len记录 `segments[i]!.text.length` 是否成立，下一步按该结果分支。
    const len = segments[i]!.text.length
    // 按索引扫描 `len`，需要消费相邻参数时可以精确移动游标。
    for (let j = 0; j < len; j++) {
      // map追加新条目，保持收集顺序与输入顺序一致。
      map.push(i)
    }
  }
  // 返回 `map`，作为终端渲染这次计算的结果。
  return map
}

/**
 * Apply styles to wrapped text by mapping each character back to its original segment.
 * This preserves per-segment styles even when text wraps across lines.
 *
 * @param trimEnabled - Whether whitespace trimming is enabled (wrap-trim mode).
 *   When true, we skip whitespace in the original that was trimmed from the output.
 *   When false (wrap mode), all whitespace is preserved so no skipping is needed.
 */
// applyStylesToWrappedText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyStylesToWrappedText(
  wrappedPlain: string,
  segments: StyledSegment[],
  charToSegment: number[],
  originalPlain: string,
  trimEnabled: boolean = false,
): string {
  // 文本行格式化`wrappedPlain.split`，供终端渲染后续处理使用。
  const lines = wrappedPlain.split('\n')
  // resultLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const resultLines: string[] = []

  // charIndex 索引保存`0`，供后续判断或组装使用。
  let charIndex = 0
  // 按索引扫描 `lines.length`，需要消费相邻参数时可以精确移动游标。
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    // line保存`lines[lineIdx]!`，供Ink 渲染层 render node to output后续判断或输出使用。
    const line = lines[lineIdx]!

    // In trim mode, skip leading whitespace that was trimmed from this line.
    // Only skip if the original has whitespace but the output line doesn't start
    // with whitespace (meaning it was trimmed). If both have whitespace, the
    // whitespace was preserved and we shouldn't skip.
    // 只有 `trimEnabled && line.length > 0` 满足时，终端渲染才执行该分支。
    if (trimEnabled && line.length > 0) {
      // lineStartsWithWhitespace保存`test`，供终端渲染后续处理使用。
      const lineStartsWithWhitespace = /\s/.test(line[0]!)
      // originalHasWhitespace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const originalHasWhitespace =
        charIndex < originalPlain.length && /\s/.test(originalPlain[charIndex]!)

      // Only skip if original has whitespace but line doesn't
      // 只有 `originalHasWhitespace && !lineStartsWithWhitespace` 满足时，终端渲染才执行该分支。
      if (originalHasWhitespace && !lineStartsWithWhitespace) {
        // 调用 while，触发终端渲染此处需要的副作用。
        while (
          charIndex < originalPlain.length &&
          /\s/.test(originalPlain[charIndex]!)
        ) {
          // Ink 渲染层 render node to output在这里处理 `charIndex++`，完成这一小步状态转换。
          charIndex++
        }
      }
    }

    // styledLine 命名 `''`，让后续代码直接表达这个值的用途。
    let styledLine = ''
    // runStart保存`0`，供Ink 渲染层 render node to output后续判断或输出使用。
    let runStart = 0
    // runSegmentIndex 索引读取 `charToSegment[charIndex] ?? 0` 对应条目，后续围绕该成员继续处理。
    let runSegmentIndex = charToSegment[charIndex] ?? 0

    // 按索引扫描 `line.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < line.length; i++) {
      // currentSegmentIndex 索引保存`charToSegment[charIndex] ?? runSegmentIndex`，供Ink 渲染层 render node to output后续判断或输出使用。
      const currentSegmentIndex = charToSegment[charIndex] ?? runSegmentIndex

      // `currentSegmentIndex` 与 `runSegmentIndex` 不一致时刷新派生状态，避免使用过期结果。
      if (currentSegmentIndex !== runSegmentIndex) {
        // Flush the current run
        // runText格式化`line.slice`，供终端渲染后续处理使用。
        const runText = line.slice(runStart, i)
        // segment读取 `segments[runSegmentIndex]` 对应条目，后续围绕该成员继续处理。
        const segment = segments[runSegmentIndex]
        // 满足 `segment` 时，终端渲染执行该分支。
        if (segment) {
          // styled保存`applyTextStyles`，供终端渲染后续处理使用。
          let styled = applyTextStyles(runText, segment.styles)
          // 满足 `segment.hyperlink` 时，终端渲染执行该分支。
          if (segment.hyperlink) {
            // styled更新为 `wrapWithOsc8Link(styled, segment.hyperlink)`，确保Ink 渲染层后续读取最新状态。
            styled = wrapWithOsc8Link(styled, segment.hyperlink)
          }
          // Ink 渲染层 render node to output在这里处理 `styledLine += styled`，完成这一小步状态转换。
          styledLine += styled
        } else {
          // Ink 渲染层 render node to output在这里处理 `styledLine += runText`，完成这一小步状态转换。
          styledLine += runText
        }
        // runStart更新为 `i`，确保Ink 渲染层后续读取最新状态。
        runStart = i
        // runSegmentIndex 索引更新为 `currentSegmentIndex`，确保Ink 渲染层后续读取最新状态。
        runSegmentIndex = currentSegmentIndex
      }

      // Ink 渲染层 render node to output在这里处理 `charIndex++`，完成这一小步状态转换。
      charIndex++
    }

    // Flush the final run
    // runText格式化`line.slice`，供终端渲染后续处理使用。
    const runText = line.slice(runStart)
    // segment读取 `segments[runSegmentIndex]` 对应条目，后续围绕该成员继续处理。
    const segment = segments[runSegmentIndex]
    // 满足 `segment` 时，终端渲染执行该分支。
    if (segment) {
      // styled保存`applyTextStyles`，供终端渲染后续处理使用。
      let styled = applyTextStyles(runText, segment.styles)
      // 满足 `segment.hyperlink` 时，终端渲染执行该分支。
      if (segment.hyperlink) {
        // styled更新为 `wrapWithOsc8Link(styled, segment.hyperlink)`，确保Ink 渲染层后续读取最新状态。
        styled = wrapWithOsc8Link(styled, segment.hyperlink)
      }
      // Ink 渲染层 render node to output在这里处理 `styledLine += styled`，完成这一小步状态转换。
      styledLine += styled
    } else {
      // Ink 渲染层 render node to output在这里处理 `styledLine += runText`，完成这一小步状态转换。
      styledLine += runText
    }

    // resultLines 集合追加新条目，保持收集顺序与输入顺序一致。
    resultLines.push(styledLine)

    // Skip newline character in original that corresponds to this line break.
    // This is needed when the original text contains actual newlines (not just
    // wrapping-inserted newlines). Without this, charIndex gets out of sync
    // because the newline is in originalPlain/charToSegment but not in the
    // split lines.
    // 只有 `charIndex < originalPlain.length && originalPlain` 满足时，终端渲染才执行该分支。
    if (charIndex < originalPlain.length && originalPlain[charIndex] === '\n') {
      // Ink 渲染层 render node to output在这里处理 `charIndex++`，完成这一小步状态转换。
      charIndex++
    }

    // In trim mode, skip whitespace that was replaced by newline when wrapping.
    // We skip whitespace in the original until we reach a character that matches
    // the first character of the next line. This handles cases like:
    // - "AB   \tD" wrapped to "AB\n\tD" - skip spaces until we hit the tab
    // In non-trim mode, whitespace is preserved so no skipping is needed.
    // 只有 `trimEnabled && lineIdx < lines.length - 1` 满足时，终端渲染才执行该分支。
    if (trimEnabled && lineIdx < lines.length - 1) {
      // nextLine读取 `lines[lineIdx + 1]!` 对应条目，后续围绕该成员继续处理。
      const nextLine = lines[lineIdx + 1]!
      // nextLineFirstChar记录 `nextLine.length > 0 ? nextLine[0] : null` 是否成立，下一步按该结果分支。
      const nextLineFirstChar = nextLine.length > 0 ? nextLine[0] : null

      // Skip whitespace until we hit a char that matches the next line's first char
      // 调用 while，触发终端渲染此处需要的副作用。
      while (
        charIndex < originalPlain.length &&
        /\s/.test(originalPlain[charIndex]!)
      ) {
        // Stop if we found the character that starts the next line
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          nextLineFirstChar !== null &&
          originalPlain[charIndex] === nextLineFirstChar
        ) {
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        }
        // Ink 渲染层 render node to output在这里处理 `charIndex++`，完成这一小步状态转换。
        charIndex++
      }
    }
  }

  // 返回 `resultLines.join('\n')`，作为终端渲染这次计算的结果。
  return resultLines.join('\n')
}

/**
 * Wrap text and record which output lines are soft-wrap continuations
 * (i.e. the `\n` before them was inserted by word-wrap, not in the
 * source). wrapAnsi already processes each input line independently, so
 * wrapping per-input-line here gives identical output to a single
 * whole-string wrap while letting us mark per-piece provenance.
 * Truncate modes never add newlines (cli-truncate is whole-string) so
 * they fall through with softWrap undefined — no tracking, no behavior
 * change from the pre-softWrap path.
 */
// wrapWithSoftWrap 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wrapWithSoftWrap(
  plainText: string,
  maxWidth: number,
  textWrap: Parameters<typeof wrapText>[2],
): { wrapped: string; softWrap: boolean[] | undefined } {
  // `textWrap` 与 `'wrap' && textWrap !== 'wrap-tr...` 不一致时刷新派生状态，避免使用过期结果。
  if (textWrap !== 'wrap' && textWrap !== 'wrap-trim') {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      wrapped: wrapText(plainText, maxWidth, textWrap),
      softWrap: undefined,
    }
  }
  // origLines 集合格式化`plainText.split`，供终端渲染后续处理使用。
  const origLines = plainText.split('\n')
  // outLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const outLines: string[] = []
  // softWrap 从空数组开始收集，后续循环会按处理顺序追加条目。
  const softWrap: boolean[] = []
  // 按顺序遍历 `origLines` 中的orig，逐个交给终端渲染处理。
  for (const orig of origLines) {
    // pieces 集合保存`wrapText`，供终端渲染后续处理使用。
    const pieces = wrapText(orig, maxWidth, textWrap).split('\n')
    // 按索引扫描 `pieces.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < pieces.length; i++) {
      // outLines 集合追加新条目，保持收集顺序与输入顺序一致。
      outLines.push(pieces[i]!)
      // softWrap追加新条目，保持收集顺序与输入顺序一致。
      softWrap.push(i > 0)
    }
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { wrapped: outLines.join('\n'), softWrap }
}

// If parent container is `<Box>`, text nodes will be treated as separate nodes in
// the tree and will have their own coordinates in the layout.
// To ensure text nodes are aligned correctly, take X and Y of the first text node
// and use it as offset for the rest of the nodes
// Only first node is taken into account, because other text nodes can't have margin or padding,
// so their coordinates will be relative to the first node anyway
// applyPaddingToText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyPaddingToText(
  node: DOMElement,
  text: string,
  softWrap?: boolean[],
): string {
  // yogaNode保存`node.childNodes[0]?.yogaNode`，供Ink 渲染层 render node to output后续判断或输出使用。
  const yogaNode = node.childNodes[0]?.yogaNode

  // 满足 `yogaNode` 时，终端渲染执行该分支。
  if (yogaNode) {
    // offsetX读取`yogaNode.getComputedLeft`，供终端渲染后续处理使用。
    const offsetX = yogaNode.getComputedLeft()
    // offsetY读取`yogaNode.getComputedTop`，供终端渲染后续处理使用。
    const offsetY = yogaNode.getComputedTop()
    // 文本更新为 `'\n'.repeat(offsetY) + indentString(text, offsetX)`，确保Ink 渲染层后续读取最新状态。
    text = '\n'.repeat(offsetY) + indentString(text, offsetX)
    // 只有 `softWrap && offsetY > 0` 满足时，终端渲染才执行该分支。
    if (softWrap && offsetY > 0) {
      // Prepend `false` for each padding line so indices stay aligned
      // with text.split('\n'). Mutate in place — caller owns the array.
      // 调用 softWrap.unshift，触发终端渲染此处需要的副作用。
      softWrap.unshift(...Array<boolean>(offsetY).fill(false))
    }
  }

  // 返回 `text`，作为终端渲染这次计算的结果。
  return text
}

// After nodes are laid out, render each to output object, which later gets rendered to terminal
// renderNodeToOutput 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderNodeToOutput(
  node: DOMElement,
  output: Output,
  {
    offsetX = 0,
    offsetY = 0,
    prevScreen,
    skipSelfBlit = false,
    inheritedBackgroundColor,
  }: {
    offsetX?: number
    offsetY?: number
    prevScreen: Screen | undefined
    // Force this node to descend instead of blitting its own rect, while
    // still passing prevScreen to children. Used for non-opaque absolute
    // overlays over a dirty clipped region: the overlay's full rect has
    // transparent gaps (stale underlying content in prevScreen), but its
    // opaque descendants' narrower rects are safe to blit.
    skipSelfBlit?: boolean
    inheritedBackgroundColor?: Color
  },
): void {
  // 从 `node` 解构 yogaNode，减少Ink 渲染层 render node to output对同一对象的重复访问。
  const { yogaNode } = node

  // 满足 `yogaNode` 时，终端渲染执行该分支。
  if (yogaNode) {
    // 满足 `yogaNode.getDisplay() === LayoutDisplay.None` 时，终端渲染执行该分支。
    if (yogaNode.getDisplay() === LayoutDisplay.None) {
      // Clear old position if node was visible before becoming hidden
      // 满足 `node.dirty` 时，终端渲染执行该分支。
      if (node.dirty) {
        // cached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
        const cached = nodeCache.get(node)
        // 满足 `cached` 时，终端渲染执行该分支。
        if (cached) {
          // 调用 output.clear，触发终端渲染此处需要的副作用。
          output.clear({
            x: Math.floor(cached.x),
            y: Math.floor(cached.y),
            width: Math.floor(cached.width),
            height: Math.floor(cached.height),
          })
          // Drop descendants' cache too — hideInstance's markDirty walks UP
          // only, so descendants' .dirty stays false. Their nodeCache entries
          // survive with pre-hide rects. On unhide, if position didn't shift,
          // the blit check at line ~432 passes and copies EMPTY cells from
          // prevScreen (cleared here) → content vanishes.
          // 调用 dropSubtreeCache，触发终端渲染此处需要的副作用。
          dropSubtreeCache(node)
          // layoutShifted更新为 `true`，确保Ink 渲染层后续读取最新状态。
          layoutShifted = true
        }
      }
      // Ink 渲染层 render node to output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Left and top positions in Yoga are relative to their parent node
    // x读取`yogaNode.getComputedLeft`，供终端渲染后续处理使用。
    const x = offsetX + yogaNode.getComputedLeft()
    // yogaTop读取`yogaNode.getComputedTop`，供终端渲染后续处理使用。
    const yogaTop = yogaNode.getComputedTop()
    // y保存`offsetY + yogaTop`，供后续判断或组装使用。
    let y = offsetY + yogaTop
    // width读取`yogaNode.getComputedWidth`，供终端渲染后续处理使用。
    const width = yogaNode.getComputedWidth()
    // height读取`yogaNode.getComputedHeight`，供终端渲染后续处理使用。
    const height = yogaNode.getComputedHeight()

    // Absolute-positioned overlays (e.g. autocomplete menus with bottom='100%')
    // can compute negative screen y when they extend above the viewport. Without
    // clamping, setCellAt drops cells at y<0, clipping the TOP of the content
    // (best matches in an autocomplete). By clamping to 0, we shift the element
    // down so the top rows are visible and the bottom overflows below — the
    // opaque prop ensures it paints over whatever is underneath.
    // 当 `y < 0 && node.style.position` 匹配 `'absolute'` 时，终端渲染执行对应分支。
    if (y < 0 && node.style.position === 'absolute') {
      // y更新为 `0`，确保Ink 渲染层后续读取最新状态。
      y = 0
    }

    // Check if we can skip this subtree (clean node with unchanged layout).
    // Blit cells from previous screen instead of re-rendering.
    // cached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
    const cached = nodeCache.get(node)
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      !node.dirty &&
      !skipSelfBlit &&
      node.pendingScrollDelta === undefined &&
      cached &&
      cached.x === x &&
      cached.y === y &&
      cached.width === width &&
      cached.height === height &&
      prevScreen
    ) {
      // fx保存`Math.floor`，供终端渲染后续处理使用。
      const fx = Math.floor(x)
      // fy保存`Math.floor`，供终端渲染后续处理使用。
      const fy = Math.floor(y)
      // fw保存`Math.floor`，供终端渲染后续处理使用。
      const fw = Math.floor(width)
      // fh保存`Math.floor`，供终端渲染后续处理使用。
      const fh = Math.floor(height)
      // 调用 output.blit，触发终端渲染此处需要的副作用。
      output.blit(prevScreen, fx, fy, fw, fh)
      // 当 `node.style.position` 匹配 `'absolute'` 时，终端渲染执行对应分支。
      if (node.style.position === 'absolute') {
        // absoluteRectsCur追加新条目，保持收集顺序与输入顺序一致。
        absoluteRectsCur.push(cached)
      }
      // Absolute descendants can paint outside this node's layout bounds
      // (e.g. a slash menu with position='absolute' bottom='100%' floats
      // above). If a dirty clipped sibling re-rendered and overwrote those
      // cells, the blit above only restored this node's own rect — the
      // absolute descendants' cells are lost. Re-blit them from prevScreen
      // so the overlays survive.
      // 调用 blitEscapingAbsoluteDescendants，触发终端渲染此处需要的副作用。
      blitEscapingAbsoluteDescendants(node, output, prevScreen, fx, fy, fw, fh)
      // Ink 渲染层 render node to output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Clear stale content from the old position when re-rendering.
    // Dirty: content changed. Moved: position/size changed (e.g., sibling
    // above changed height), old cells still on the terminal.
    // positionChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const positionChanged =
      cached !== undefined &&
      (cached.x !== x ||
        cached.y !== y ||
        cached.width !== width ||
        cached.height !== height)
    // 满足 `positionChanged` 时，终端渲染执行该分支。
    if (positionChanged) {
      // layoutShifted更新为 `true`，确保Ink 渲染层后续读取最新状态。
      layoutShifted = true
    }
    // 只有 `cached && (node.dirty || positionChanged)` 满足时，终端渲染才执行该分支。
    if (cached && (node.dirty || positionChanged)) {
      // 调用 output.clear，触发终端渲染此处需要的副作用。
      output.clear(
        {
          x: Math.floor(cached.x),
          y: Math.floor(cached.y),
          width: Math.floor(cached.width),
          height: Math.floor(cached.height),
        },
        node.style.position === 'absolute',
      )
    }

    // Read before deleting — hasRemovedChild disables prevScreen blitting
    // for siblings to prevent stale overflow content from being restored.
    // clears 集合读取`pendingClears.get`，供终端渲染后续处理使用。
    const clears = pendingClears.get(node)
    // hasRemovedChild标记Ink 渲染层 render node to output是否启用对应路径。
    const hasRemovedChild = clears !== undefined
    // 满足 `hasRemovedChild` 时，终端渲染执行该分支。
    if (hasRemovedChild) {
      // layoutShifted更新为 `true`，确保Ink 渲染层后续读取最新状态。
      layoutShifted = true
      // 按顺序遍历 `clears` 中的rect，逐个交给终端渲染处理。
      for (const rect of clears) {
        // 调用 output.clear，触发终端渲染此处需要的副作用。
        output.clear({
          x: Math.floor(rect.x),
          y: Math.floor(rect.y),
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        })
      }
      // 调用 pendingClears.delete，触发终端渲染此处需要的副作用。
      pendingClears.delete(node)
    }

    // Yoga squeezed this node to zero height (overflow in a height-constrained
    // parent) AND a sibling lands at the same y. Skip rendering — both would
    // write to the same row; if the sibling's content is shorter, this node's
    // tail chars ghost (e.g. "false" + "true" = "truee"). The clear above
    // already handled the visible→squeezed transition.
    //
    // The sibling-overlap check is load-bearing: Yoga's pixel-grid rounding
    // can give a box h=0 while still leaving a row for it (next sibling at
    // y+1, not y). HelpV2's third shortcuts column hits this — skipping
    // unconditionally drops "ctrl + z to suspend" from /help output.
    // 只有 `height === 0 && siblingSharesY(node, yogaNode)` 满足时，终端渲染才执行该分支。
    if (height === 0 && siblingSharesY(node, yogaNode)) {
      // nodeCache.set 写入新的状态值，使终端渲染后续读取保持一致。
      nodeCache.set(node, { x, y, width, height, top: yogaTop })
      // dirty更新为 `false`，确保Ink 渲染层后续读取最新状态。
      node.dirty = false
      // Ink 渲染层 render node to output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 当 `node.nodeName` 匹配 `'ink-raw-ansi'` 时，终端渲染执行对应分支。
    if (node.nodeName === 'ink-raw-ansi') {
      // Pre-rendered ANSI content. The producer already wrapped to width and
      // emitted terminal-ready escape codes. Skip squash, measure, wrap, and
      // style re-application — output.write() parses ANSI directly into cells.
      // 文本内容读取 `node.attributes['rawText'] as string` 对应条目，后续围绕该成员继续处理。
      const text = node.attributes['rawText'] as string
      // 满足 `text` 时，终端渲染执行该分支。
      if (text) {
        // 调用 output.write，触发终端渲染此处需要的副作用。
        output.write(x, y, text)
      }
    // Ink 渲染层 render node to output在这里处理 `} else if (node.nodeName === 'ink-text') {`，完成这一小步状态转换。
    } else if (node.nodeName === 'ink-text') {
      // segments 集合保存`squashTextNodesToSegments`，供终端渲染后续处理使用。
      const segments = squashTextNodesToSegments(
        node,
        inheritedBackgroundColor
          ? { backgroundColor: inheritedBackgroundColor }
          : undefined,
      )

      // First, get plain text to check if wrapping is needed
      // plainText派生`segments.map`，供终端渲染后续处理使用。
      const plainText = segments.map(s => s.text).join('')

      // 满足 `plainText.length > 0` 时，终端渲染执行该分支。
      if (plainText.length > 0) {
        // Upstream Ink uses getMaxWidth(yogaNode) unclamped here. That
        // width comes from Yoga's AtMost pass and can exceed the actual
        // screen space (see getMaxWidth docstring). Yoga's height for this
        // node already reflects the constrained Exactly pass, so clamping
        // the wrap width here keeps line count consistent with layout.
        // Without this, characters past the screen edge are dropped by
        // setCellAt's bounds check.
        // maxWidth保存`Math.min`，供终端渲染后续处理使用。
        const maxWidth = Math.min(getMaxWidth(yogaNode), output.width - x)
        // textWrap 命名 `node.style.textWrap ?? 'wrap'`，让后续代码直接表达这个值的用途。
        const textWrap = node.style.textWrap ?? 'wrap'

        // Check if wrapping is needed
        // needsWrapping记录 `widestLine` 是否成立，终端渲染随后按该结果分支。
        const needsWrapping = widestLine(plainText) > maxWidth

        // 文本 先占位，稍后的条件分支会根据实际输入补齐它。
        let text: string
        // softWrap 先占位，稍后的条件分支会根据实际输入补齐它。
        let softWrap: boolean[] | undefined
        // 只有 `needsWrapping && segments.length === 1` 满足时，终端渲染才执行该分支。
        if (needsWrapping && segments.length === 1) {
          // Single segment: wrap plain text first, then apply styles to each line
          // segment 命名 `segments[0]!`，让后续代码直接表达这个值的用途。
          const segment = segments[0]!
          // w保存`wrapWithSoftWrap`，供终端渲染后续处理使用。
          const w = wrapWithSoftWrap(plainText, maxWidth, textWrap)
          // softWrap更新为 `w.softWrap`，确保Ink 渲染层后续读取最新状态。
          softWrap = w.softWrap
          // 文本更新为 `w.wrapped`，确保Ink 渲染层后续读取最新状态。
          text = w.wrapped
            .split('\n')
            // 链式调用 map，继续加工上一行在终端渲染中产生的数据。
            .map(line => {
              // styled保存`applyTextStyles`，供终端渲染后续处理使用。
              let styled = applyTextStyles(line, segment.styles)
              // Apply OSC 8 hyperlink per-line so each line is independently
              // clickable. output.ts splits on newlines and tokenizes each
              // line separately, so a single wrapper around the whole block
              // would only apply the hyperlink to the first line.
              // 满足 `segment.hyperlink` 时，终端渲染执行该分支。
              if (segment.hyperlink) {
                // styled更新为 `wrapWithOsc8Link(styled, segment.hyperlink)`，确保Ink 渲染层后续读取最新状态。
                styled = wrapWithOsc8Link(styled, segment.hyperlink)
              }
              // 返回 `styled`，作为终端渲染这次计算的结果。
              return styled
            })
            .join('\n')
        // Ink 渲染层 render node to output在这里处理 `} else if (needsWrapping) {`，完成这一小步状态转换。
        } else if (needsWrapping) {
          // Multiple segments with wrapping: wrap plain text first, then re-apply
          // each segment's styles based on character positions. This preserves
          // per-segment styles even when text wraps across lines.
          // w保存`wrapWithSoftWrap`，供终端渲染后续处理使用。
          const w = wrapWithSoftWrap(plainText, maxWidth, textWrap)
          // softWrap更新为 `w.softWrap`，确保Ink 渲染层后续读取最新状态。
          softWrap = w.softWrap
          // charToSegment构建`buildCharToSegmentMap`，供终端渲染后续处理使用。
          const charToSegment = buildCharToSegmentMap(segments)
          // 文本更新为 `applyStylesToWrappedText(`，确保Ink 渲染层后续读取最新状态。
          text = applyStylesToWrappedText(
            w.wrapped,
            segments,
            charToSegment,
            plainText,
            textWrap === 'wrap-trim',
          )
          // Hyperlinks are handled per-run in applyStylesToWrappedText via
          // wrapWithOsc8Link, similar to how styles are applied per-run.
        } else {
          // No wrapping needed: apply styles directly
          // 文本更新为 `segments`，确保Ink 渲染层后续读取最新状态。
          text = segments
            // 链式调用 map，继续加工上一行在终端渲染中产生的数据。
            .map(segment => {
              // styledText保存`applyTextStyles`，供终端渲染后续处理使用。
              let styledText = applyTextStyles(segment.text, segment.styles)
              // 满足 `segment.hyperlink` 时，终端渲染执行该分支。
              if (segment.hyperlink) {
                // styledText更新为 `wrapWithOsc8Link(styledText, segment.hyperlink)`，确保Ink 渲染层后续读取最新状态。
                styledText = wrapWithOsc8Link(styledText, segment.hyperlink)
              }
              // 返回 `styledText`，作为终端渲染这次计算的结果。
              return styledText
            })
            .join('')
        }

        // 文本更新为 `applyPaddingToText(node, text, softWrap)`，确保Ink 渲染层后续读取最新状态。
        text = applyPaddingToText(node, text, softWrap)

        // 调用 output.write，触发终端渲染此处需要的副作用。
        output.write(x, y, text, softWrap)
      }
    // Ink 渲染层 render node to output在这里处理 `} else if (node.nodeName === 'ink-box') {`，完成这一小步状态转换。
    } else if (node.nodeName === 'ink-box') {
      // boxBackgroundColor 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const boxBackgroundColor =
        node.style.backgroundColor ?? inheritedBackgroundColor

      // Mark this box's region as non-selectable (fullscreen text
      // selection). noSelect ops are applied AFTER blits/writes in
      // output.get(), so this wins regardless of what's rendered into
      // the region — including blits from prevScreen when the box is
      // clean (the op is emitted on both the dirty-render path here
      // AND on the blit fast-path at line ~235 since blitRegion copies
      // the noSelect bitmap alongside cells).
      //
      // 'from-left-edge' extends the exclusion from col 0 so any
      // upstream indentation (tool prefix, tree lines) is covered too
      // — a multi-row drag over a diff gutter shouldn't pick up the
      // `  ⎿  ` prefix on row 0 or the blank cells under it on row 1+.
      // 满足 `node.style.noSelect` 时，终端渲染执行该分支。
      if (node.style.noSelect) {
        // boxX保存`Math.floor`，供终端渲染后续处理使用。
        const boxX = Math.floor(x)
        // fromEdge标记Ink 渲染层 render node to output是否启用对应路径。
        const fromEdge = node.style.noSelect === 'from-left-edge'
        // 调用 output.noSelect，触发终端渲染此处需要的副作用。
        output.noSelect({
          x: fromEdge ? 0 : boxX,
          y: Math.floor(y),
          width: fromEdge ? boxX + Math.floor(width) : Math.floor(width),
          height: Math.floor(height),
        })
      }

      // overflowX保存`node.style.overflowX ?? node.style.overflow`，供后续判断或组装使用。
      const overflowX = node.style.overflowX ?? node.style.overflow
      // overflowY 命名 `node.style.overflowY ?? node.style.overflow`，让后续代码直接表达这个值的用途。
      const overflowY = node.style.overflowY ?? node.style.overflow
      // clipHorizontally标记Ink 渲染层 render node to output是否启用对应路径。
      const clipHorizontally = overflowX === 'hidden' || overflowX === 'scroll'
      // clipVertically标记Ink 渲染层 render node to output是否启用对应路径。
      const clipVertically = overflowY === 'hidden' || overflowY === 'scroll'
      // isScrollY标记Ink 渲染层 render node to output是否启用对应路径。
      const isScrollY = overflowY === 'scroll'

      // needsClip标记Ink 渲染层 render node to output是否启用对应路径。
      const needsClip = clipHorizontally || clipVertically
      // y1 先占位，稍后的条件分支会根据实际输入补齐它。
      let y1: number | undefined
      // y2 先占位，稍后的条件分支会根据实际输入补齐它。
      let y2: number | undefined
      // 满足 `needsClip` 时，终端渲染执行该分支。
      if (needsClip) {
        // x1保存`clipHorizontally`，供后续判断或组装使用。
        const x1 = clipHorizontally
          ? x + yogaNode.getComputedBorder(LayoutEdge.Left)
          : undefined

        // x2保存`clipHorizontally`，供Ink 渲染层 render node to output后续判断或输出使用。
        const x2 = clipHorizontally
          ? x +
            yogaNode.getComputedWidth() -
            yogaNode.getComputedBorder(LayoutEdge.Right)
          : undefined

        // y1更新为 `clipVertically`，确保Ink 渲染层后续读取最新状态。
        y1 = clipVertically
          ? y + yogaNode.getComputedBorder(LayoutEdge.Top)
          : undefined

        // y2更新为 `clipVertically`，确保Ink 渲染层后续读取最新状态。
        y2 = clipVertically
          ? y +
            yogaNode.getComputedHeight() -
            yogaNode.getComputedBorder(LayoutEdge.Bottom)
          : undefined

        // 调用 output.clip，触发终端渲染此处需要的副作用。
        output.clip({ x1, x2, y1, y2 })
      }

      // 满足 `isScrollY` 时，终端渲染执行该分支。
      if (isScrollY) {
        // Scroll containers follow the ScrollBox component structure:
        // a single content-wrapper child with flexShrink:0 (doesn't shrink
        // to fit), whose children are the scrollable items. scrollHeight
        // comes from the wrapper's intrinsic Yoga height. The wrapper is
        // rendered with its Y translated by -scrollTop; its children are
        // culled against the visible window.
        // padTop读取`yogaNode.getComputedPadding`，供终端渲染后续处理使用。
        const padTop = yogaNode.getComputedPadding(LayoutEdge.Top)
        // innerHeight保存`Math.max`，供终端渲染后续处理使用。
        const innerHeight = Math.max(
          0,
          (y2 ?? y + height) -
            (y1 ?? y) -
            padTop -
            yogaNode.getComputedPadding(LayoutEdge.Bottom),
        )

        // 文本内容筛选`childNodes.find`，供终端渲染后续处理使用。
        const content = node.childNodes.find(c => (c as DOMElement).yogaNode) as
          | DOMElement
          | undefined
        // contentYoga保存`content?.yogaNode`，供Ink 渲染层 render node to output后续判断或输出使用。
        const contentYoga = content?.yogaNode
        // scrollHeight is the intrinsic height of the content wrapper.
        // Do NOT add getComputedTop() — that's the wrapper's offset
        // within the viewport (equal to the scroll container's
        // paddingTop), and innerHeight already subtracts padding, so
        // including it double-counts padding and inflates maxScroll.
        // scrollHeight读取`getComputedHeight`，供终端渲染后续处理使用。
        const scrollHeight = contentYoga?.getComputedHeight() ?? 0
        // Capture previous scroll bounds BEFORE overwriting — the at-bottom
        // follow check compares against last frame's max.
        // prevScrollHeight保存`node.scrollHeight ?? scrollHeight`，供Ink 渲染层 render node to output后续判断或输出使用。
        const prevScrollHeight = node.scrollHeight ?? scrollHeight
        // prevInnerHeight 命名 `node.scrollViewportHeight ?? innerHeight`，让后续代码直接表达这个值的用途。
        const prevInnerHeight = node.scrollViewportHeight ?? innerHeight
        // scrollHeight更新为 `scrollHeight`，确保Ink 渲染层后续读取最新状态。
        node.scrollHeight = scrollHeight
        // scrollViewportHeight更新为 `innerHeight`，确保Ink 渲染层后续读取最新状态。
        node.scrollViewportHeight = innerHeight
        // Absolute screen-buffer row where the scrollable area (inside
        // padding) begins. Exposed via ScrollBoxHandle.getViewportTop() so
        // drag-to-scroll can detect when the drag leaves the scroll viewport.
        // scrollViewportTop更新为 `(y1 ?? y) + padTop`，确保Ink 渲染层后续读取最新状态。
        node.scrollViewportTop = (y1 ?? y) + padTop

        // maxScroll保存`Math.max`，供终端渲染后续处理使用。
        const maxScroll = Math.max(0, scrollHeight - innerHeight)
        // scrollAnchor: scroll so the anchored element's top is at the
        // viewport top (plus offset). Yoga is FRESH — same calculateLayout
        // pass that just produced scrollHeight. Deterministic alternative
        // to scrollTo(N) which bakes a number that's stale by the throttled
        // render; the element ref defers the read to now. One-shot snap.
        // A prior eased-seek version (proportional drain over ~5 frames)
        // moved scrollTop without firing React's notify → parent's quantized
        // store snapshot never updated → StickyTracker got stale range props
        // → firstVisible wrong. Also: SCROLL_MIN_PER_FRAME=4 with snap-at-1
        // ping-ponged forever at delta=2. Smooth needs drain-end notify
        // plumbing; shipping instant first. stickyScroll overrides.
        // 满足 `node.scrollAnchor` 时，终端渲染执行该分支。
        if (node.scrollAnchor) {
          // anchorTop读取`getComputedTop`，供终端渲染后续处理使用。
          const anchorTop = node.scrollAnchor.el.yogaNode?.getComputedTop()
          // 满足 `anchorTop != null` 时，终端渲染执行该分支。
          if (anchorTop != null) {
            // scrollTop更新为 `anchorTop + node.scrollAnchor.offset`，确保Ink 渲染层后续读取最新状态。
            node.scrollTop = anchorTop + node.scrollAnchor.offset
            // pendingScrollDelta更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
            node.pendingScrollDelta = undefined
          }
          // scrollAnchor更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
          node.scrollAnchor = undefined
        }
        // At-bottom follow. Positional: if scrollTop was at (or past) the
        // previous max, pin to the new max. Scroll away → stop following;
        // scroll back (or scrollToBottom/sticky attr) → resume. The sticky
        // flag is OR'd in for cold start (scrollTop=0 before first layout)
        // and scrollToBottom-from-far-away (flag set before scrollTop moves)
        // — the imperative field takes precedence over the attribute so
        // scrollTo/scrollBy can break stickiness. pendingDelta<0 guard:
        // don't cancel an in-flight scroll-up when content races in.
        // Capture scrollTop before follow so ink.tsx can translate any
        // active text selection by the same delta (native terminal behavior:
        // view keeps scrolling, highlight walks up with the text).
        // scrollTopBeforeFollow保存`node.scrollTop ?? 0`，供Ink 渲染层 render node to output后续判断或输出使用。
        const scrollTopBeforeFollow = node.scrollTop ?? 0
        // sticky 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const sticky =
          node.stickyScroll ?? Boolean(node.attributes['stickyScroll'])
        // prevMaxScroll保存`Math.max`，供终端渲染后续处理使用。
        const prevMaxScroll = Math.max(0, prevScrollHeight - prevInnerHeight)
        // Positional check only valid when content grew — virtualization can
        // transiently SHRINK scrollHeight (tail unmount + stale heightCache
        // spacer) making scrollTop >= prevMaxScroll true by artifact, not
        // because the user was at bottom.
        // grew保存`scrollHeight >= prevScrollHeight`，供后续判断或组装使用。
        const grew = scrollHeight >= prevScrollHeight
        // atBottom 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const atBottom =
          sticky || (grew && scrollTopBeforeFollow >= prevMaxScroll)
        // 只有 `atBottom && (node.pendingScrollDelta ?? 0) >= 0` 满足时，终端渲染才执行该分支。
        if (atBottom && (node.pendingScrollDelta ?? 0) >= 0) {
          // scrollTop更新为 `maxScroll`，确保Ink 渲染层后续读取最新状态。
          node.scrollTop = maxScroll
          // pendingScrollDelta更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
          node.pendingScrollDelta = undefined
          // Sync flag so useVirtualScroll's isSticky() agrees with positional
          // state — sticky-broken-but-at-bottom (wheel tremor, click-select
          // at max) otherwise leaves useVirtualScroll's clamp holding the
          // viewport short of new streaming content. scrollTo/scrollBy set
          // false; this restores true, same as scrollToBottom() would.
          // Only restore when (a) positionally at bottom and (b) the flag
          // was explicitly broken (===false) by scrollTo/scrollBy. When
          // undefined (never set by user action) leave it alone — setting it
          // would make the sticky flag sticky-by-default and lock out
          // direct scrollTop writes (e.g. the alt-screen-perf test).
          // 终端渲染在这里按实际状态进入对应分支。
          if (
            node.stickyScroll === false &&
            scrollTopBeforeFollow >= prevMaxScroll
          ) {
            // stickyScroll更新为 `true`，确保Ink 渲染层后续读取最新状态。
            node.stickyScroll = true
          }
        }
        // followDelta 命名 `(node.scrollTop ?? 0) - scrollTopBeforeFollow`，让后续代码直接表达这个值的用途。
        const followDelta = (node.scrollTop ?? 0) - scrollTopBeforeFollow
        // 满足 `followDelta > 0` 时，终端渲染执行该分支。
        if (followDelta > 0) {
          // vpTop保存`node.scrollViewportTop ?? 0`，供后续判断或组装使用。
          const vpTop = node.scrollViewportTop ?? 0
          // followScroll更新为 `{`，确保Ink 渲染层后续读取最新状态。
          followScroll = {
            delta: followDelta,
            viewportTop: vpTop,
            viewportBottom: vpTop + innerHeight - 1,
          }
        }
        // Drain pendingScrollDelta. Native terminals (proportional burst
        // events) use proportional drain; xterm.js (VS Code, sparse events +
        // app-side accel curve) uses adaptive small-step drain. isXtermJs()
        // depends on the async XTVERSION probe, but by the time this runs
        // (pendingScrollDelta is only set by wheel events, >>50ms after
        // startup) the probe has resolved — same timing guarantee the
        // wheel-accel curve relies on.
        // cur保存`node.scrollTop ?? 0`，供Ink 渲染层 render node to output后续判断或输出使用。
        let cur = node.scrollTop ?? 0
        // pending保存`node.pendingScrollDelta`，供Ink 渲染层 render node to output后续判断或输出使用。
        const pending = node.pendingScrollDelta
        // cMin保存`node.scrollClampMin`，供后续判断或组装使用。
        const cMin = node.scrollClampMin
        // cMax 命名 `node.scrollClampMax`，让后续代码直接表达这个值的用途。
        const cMax = node.scrollClampMax
        // haveClamp标记Ink 渲染层 render node to output是否启用对应路径。
        const haveClamp = cMin !== undefined && cMax !== undefined
        // `pending` 与 `undefined && pending !== 0` 不一致时刷新派生状态，避免使用过期结果。
        if (pending !== undefined && pending !== 0) {
          // Drain continues even past the clamp — the render-clamp below
          // holds the VISUAL at the mounted edge regardless. Hard-stopping
          // here caused stop-start jutter: drain hits edge → pause → React
          // commits → clamp widens → drain resumes → edge again. Letting
          // scrollTop advance smoothly while the clamp lags gives continuous
          // visual scroll at React's commit rate (the clamp catches up each
          // commit). But THROTTLE the drain when already past the clamp so
          // scrollTop doesn't race 5000 rows ahead of the mounted range
          // (slide-cap would then take 200 commits to catch up = long
          // perceived stall at the edge). Past-clamp drain caps at ~4 rows/
          // frame, roughly matching React's slide rate so the gap stays
          // bounded and catch-up is quick once input stops.
          // pastClamp 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const pastClamp =
            haveClamp &&
            ((pending < 0 && cur < cMin) || (pending > 0 && cur > cMax))
          // eff保存`Math.min`，供终端渲染后续处理使用。
          const eff = pastClamp ? Math.min(4, innerHeight >> 3) : innerHeight
          // Ink 渲染层 render node to output在这里处理 `cur += isXtermJsHost()`，完成这一小步状态转换。
          cur += isXtermJsHost()
            ? drainAdaptive(node, pending, eff)
            : drainProportional(node, pending, eff)
        // Ink 渲染层 render node to output在这里处理 `} else if (pending === 0) {`，完成这一小步状态转换。
        } else if (pending === 0) {
          // Opposite scrollBy calls cancelled to zero — clear so we don't
          // schedule an infinite loop of no-op drain frames.
          // pendingScrollDelta更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
          node.pendingScrollDelta = undefined
        }
        // scrollTop保存`Math.max`，供终端渲染后续处理使用。
        let scrollTop = Math.max(0, Math.min(cur, maxScroll))
        // Virtual-scroll clamp: if scrollTop raced past the currently-mounted
        // range (burst PageUp before React re-renders), render at the EDGE of
        // the mounted children instead of blank spacer. Do NOT write back to
        // node.scrollTop — the clamped value is for this paint only; the real
        // scrollTop stays so React's next commit sees the target and mounts
        // the right range. Not scheduling scrollDrainNode here keeps the
        // clamp passive — React's commit → resetAfterCommit → onRender will
        // paint again with fresh bounds.
        // clamped保存`haveClamp`，供Ink 渲染层 render node to output后续判断或输出使用。
        const clamped = haveClamp
          ? Math.max(cMin, Math.min(scrollTop, cMax))
          : scrollTop
        // scrollTop更新为 `scrollTop`，确保Ink 渲染层后续读取最新状态。
        node.scrollTop = scrollTop
        // Clamp hitting top/bottom consumes any remainder. Set drainPending
        // only after clamp so a wasted no-op frame isn't scheduled.
        // `scrollTop` 与 `cur` 不一致时刷新派生状态，避免使用过期结果。
        if (scrollTop !== cur) node.pendingScrollDelta = undefined
        // `node.pendingScrollDelta` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (node.pendingScrollDelta !== undefined) scrollDrainNode = node
        // scrollTop更新为 `clamped`，确保Ink 渲染层后续读取最新状态。
        scrollTop = clamped

        // 只有 `content && contentYoga` 满足时，终端渲染才执行该分支。
        if (content && contentYoga) {
          // Compute content wrapper's absolute render position with scroll
          // offset applied, then render its children with culling.
          // contentX读取`contentYoga.getComputedLeft`，供终端渲染后续处理使用。
          const contentX = x + contentYoga.getComputedLeft()
          // contentY读取`contentYoga.getComputedTop`，供终端渲染后续处理使用。
          const contentY = y + contentYoga.getComputedTop() - scrollTop
          // layoutShifted detection gap: when scrollTop moves by >= viewport
          // height (batched PageUps, fast wheel), every visible child gets
          // culled (cache dropped) and every newly-visible child has no
          // cache — so the children's positionChanged check can't fire.
          // The content wrapper's cached y (which encodes -scrollTop) is
          // the only node that survives to witness the scroll.
          // contentCached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
          const contentCached = nodeCache.get(content)
          // hint初始化为空值，后续分支会在有数据时补齐。
          let hint: ScrollHint | null = null
          // `contentCached && contentCached.y` 与 `contentY` 不一致时刷新派生状态，避免使用过期结果。
          if (contentCached && contentCached.y !== contentY) {
            // delta = newScrollTop - oldScrollTop (positive = scrolled down).
            // Capture a DECSTBM hint if the container itself didn't move
            // and the shift fits within the viewport — otherwise the full
            // rewrite is needed anyway, and layoutShifted stays the fallback.
            // delta保存`contentCached.y - contentY`，供后续判断或组装使用。
            const delta = contentCached.y - contentY
            // regionTop保存`Math.floor`，供终端渲染后续处理使用。
            const regionTop = Math.floor(y + contentYoga.getComputedTop())
            // regionBottom保存`regionTop + innerHeight - 1`，供后续判断或组装使用。
            const regionBottom = regionTop + innerHeight - 1
            // 终端渲染在这里按实际状态进入对应分支。
            if (
              cached?.y === y &&
              cached.height === height &&
              innerHeight > 0 &&
              Math.abs(delta) < innerHeight
            ) {
              // hint更新为 `{ top: regionTop, bottom: regionBottom, delta }`，确保Ink 渲染层后续读取最新状态。
              hint = { top: regionTop, bottom: regionBottom, delta }
              // scrollHint更新为 `hint`，确保Ink 渲染层后续读取最新状态。
              scrollHint = hint
            } else {
              // layoutShifted更新为 `true`，确保Ink 渲染层后续读取最新状态。
              layoutShifted = true
            }
          }
          // Fast path: scroll (hint captured) with usable prevScreen.
          // Blit prevScreen's scroll region into next.screen, shift in-place
          // by delta (mirrors DECSTBM), then render ONLY the edge rows. The
          // nested clip keeps child writes out of stable rows — a tall child
          // that spans edge+stable still renders but stable cells are
          // clipped, preserving the blit. Avoids re-rendering every visible
          // child (expensive for long syntax-highlighted transcripts).
          //
          // When content.dirty (e.g. streaming text at the bottom of the
          // scroll), we still use the fast path — the dirty child is almost
          // always in the edge rows (the bottom, where new content appears).
          // After edge rendering, any dirty children in stable rows are
          // re-rendered in a second pass to avoid showing stale blitted
          // content.
          //
          // Guard: the fast path only handles pure scroll or bottom-append.
          // Child removal/insertion changes the content height in a way that
          // doesn't match the scroll delta — fall back to the full path so
          // removed children don't leave stale cells and shifted siblings
          // render at their new positions.
          // scrollHeight读取`contentYoga.getComputedHeight`，供终端渲染后续处理使用。
          const scrollHeight = contentYoga.getComputedHeight()
          // prevHeight 命名 `contentCached?.height ?? scrollHeight`，让后续代码直接表达这个值的用途。
          const prevHeight = contentCached?.height ?? scrollHeight
          // heightDelta保存`scrollHeight - prevHeight`，供后续判断或组装使用。
          const heightDelta = scrollHeight - prevHeight
          // safeForFastPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const safeForFastPath =
            !hint ||
            heightDelta === 0 ||
            (hint.delta > 0 && heightDelta === hint.delta)
          // scrollHint is set above when hint is captured. If safeForFastPath
          // is false the full path renders a next.screen that doesn't match
          // the DECSTBM shift — emitting DECSTBM leaves stale rows (seen as
          // content bleeding through during scroll-up + streaming). Clear it.
          // safeForFastPath 路径数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
          if (!safeForFastPath) scrollHint = null
          // 只有 `hint && prevScreen && safeForFastPath` 满足时，终端渲染才执行该分支。
          if (hint && prevScreen && safeForFastPath) {
            // 从 `hint` 解构 top、bottom、delta，减少Ink 渲染层 render node to output对同一对象的重复访问。
            const { top, bottom, delta } = hint
            // w保存`Math.floor`，供终端渲染后续处理使用。
            const w = Math.floor(width)
            // 调用 output.blit，触发终端渲染此处需要的副作用。
            output.blit(prevScreen, Math.floor(x), top, w, bottom - top + 1)
            // 调用 output.shift，触发终端渲染此处需要的副作用。
            output.shift(top, bottom, delta)
            // Edge rows: new content entering the viewport.
            // edgeTop 命名 `delta > 0 ? bottom - delta + 1 : top`，让后续代码直接表达这个值的用途。
            const edgeTop = delta > 0 ? bottom - delta + 1 : top
            // edgeBottom保存`delta > 0 ? bottom : top - delta - 1`，供Ink 渲染层 render node to output后续判断或输出使用。
            const edgeBottom = delta > 0 ? bottom : top - delta - 1
            // 调用 output.clear，触发终端渲染此处需要的副作用。
            output.clear({
              x: Math.floor(x),
              y: edgeTop,
              width: w,
              height: edgeBottom - edgeTop + 1,
            })
            // 调用 output.clip，触发终端渲染此处需要的副作用。
            output.clip({
              x1: undefined,
              x2: undefined,
              y1: edgeTop,
              y2: edgeBottom + 1,
            })
            // Snapshot dirty children before the first pass — the first
            // pass clears dirty flags, and edge-spanning children would be
            // missed by the second pass without this snapshot.
            // dirtyChildren保存`content.dirty`，供Ink 渲染层 render node to output后续判断或输出使用。
            const dirtyChildren = content.dirty
              // 这个回调绑定到 ? new Set(content.childNodes.filter(c => (c as DOMElement).dirty))，负责终端渲染在该局部场景下的响应。
              ? new Set(content.childNodes.filter(c => (c as DOMElement).dirty))
              : null
            // 调用 renderScrolledChildren，触发终端渲染此处需要的副作用。
            renderScrolledChildren(
              content,
              output,
              contentX,
              contentY,
              hasRemovedChild,
              undefined,
              // Cull to edge in child-local coords (inverse of contentY offset).
              edgeTop - contentY,
              edgeBottom + 1 - contentY,
              boxBackgroundColor,
              true,
            )
            // 调用 output.unclip，触发终端渲染此处需要的副作用。
            output.unclip()

            // Second pass: re-render children in stable rows whose screen
            // position doesn't match where the shift put their old pixels.
            // Covers TWO cases:
            //   1. Dirty children — their content changed, blitted pixels are
            //      stale regardless of position.
            //   2. Clean children BELOW a middle-growth point — when a dirty
            //      sibling above them grows, their yogaTop increases but
            //      scrollTop increases by the same amount (sticky), so their
            //      screenY is CONSTANT. The shift moved their old pixels to
            //      screenY-delta (wrong); they should stay at screenY. Without
            //      this, the spinner/tmux-monitor ghost at shifted positions
            //      during streaming (e.g. triple spinner, pill duplication).
            //   For bottom-append (the common case), all clean children are
            //   ABOVE the growth point; their screenY decreased by delta and
            //   the shift put them at the right place — skipped here, fast
            //   path preserved.
            // 满足 `dirtyChildren` 时，终端渲染执行该分支。
            if (dirtyChildren) {
              // edgeTopLocal保存`edgeTop - contentY`，供后续判断或组装使用。
              const edgeTopLocal = edgeTop - contentY
              // edgeBottomLocal 命名 `edgeBottom + 1 - contentY`，让后续代码直接表达这个值的用途。
              const edgeBottomLocal = edgeBottom + 1 - contentY
              // spaces 集合保存`repeat`，供终端渲染后续处理使用。
              const spaces = ' '.repeat(w)
              // Track cumulative height change of children iterated so far.
              // A clean child's yogaTop is unchanged iff this is zero (no
              // sibling above it grew/shrank/mounted). When zero, the skip
              // check cached.y−delta === screenY reduces to delta === delta
              // (tautology) → skip without yoga reads. Restores O(dirty)
              // that #24536 traded away: for bottom-append the dirty child
              // is last (all clean children skip); for virtual-scroll range
              // shift the topSpacer shrink + new-item heights self-balance
              // to zero before reaching the clean block. Middle-growth
              // leaves shift non-zero → clean children after the growth
              // point fall through to yoga + the fine-grained check below,
              // preserving the ghost-box fix.
              // cumHeightShift保存`0`，供Ink 渲染层 render node to output后续判断或输出使用。
              let cumHeightShift = 0
              // 按顺序遍历 `content.childNodes` 中的childNode，逐个交给终端渲染处理。
              for (const childNode of content.childNodes) {
                // childElem 命名 `childNode as DOMElement`，让后续代码直接表达这个值的用途。
                const childElem = childNode as DOMElement
                // isDirty记录 `dirtyChildren.has` 是否成立，终端渲染随后按该结果分支。
                const isDirty = dirtyChildren.has(childNode)
                // 只有 `!isDirty && cumHeightShift === 0` 满足时，终端渲染才执行该分支。
                if (!isDirty && cumHeightShift === 0) {
                  // 满足 `nodeCache.has(childElem)` 时，终端渲染执行该分支。
                  if (nodeCache.has(childElem)) continue
                  // Uncached = culled last frame, now re-entering. blit
                  // never painted it → fall through to yoga + render.
                  // Height unchanged (clean), so cumHeightShift stays 0.
                }
                // cy保存`childElem.yogaNode`，供后续判断或组装使用。
                const cy = childElem.yogaNode
                // cy缺失时直接走兜底路径，避免终端渲染使用无效输入。
                if (!cy) continue
                // childTop读取`cy.getComputedTop`，供终端渲染后续处理使用。
                const childTop = cy.getComputedTop()
                // childH读取`cy.getComputedHeight`，供终端渲染后续处理使用。
                const childH = cy.getComputedHeight()
                // childBottom保存`childTop + childH`，供Ink 渲染层 render node to output后续判断或输出使用。
                const childBottom = childTop + childH
                // 满足 `isDirty` 时，终端渲染执行该分支。
                if (isDirty) {
                  // prev读取`nodeCache.get`，供终端渲染后续处理使用。
                  const prev = nodeCache.get(childElem)
                  // Ink 渲染层 render node to output在这里处理 `cumHeightShift += childH - (prev ? prev.height : 0)`，完成这一小步状态转换。
                  cumHeightShift += childH - (prev ? prev.height : 0)
                }
                // Skip culled children (outside viewport)
                // 终端渲染在这里按实际状态进入对应分支。
                if (
                  childBottom <= scrollTop ||
                  childTop >= scrollTop + innerHeight
                )
                  // 跳过当前项，继续处理终端渲染中的下一轮循环。
                  continue
                // Skip children entirely within edge rows (already rendered)
                // 只有 `childTop >= edgeTopLocal && childBottom <= edgeBottomLocal` 满足时，终端渲染才执行该分支。
                if (childTop >= edgeTopLocal && childBottom <= edgeBottomLocal)
                  // 跳过当前项，继续处理终端渲染中的下一轮循环。
                  continue
                // screenY保存`Math.floor`，供终端渲染后续处理使用。
                const screenY = Math.floor(contentY + childTop)
                // Clean children reaching here have cumHeightShift ≠ 0 OR
                // no cache. Re-check precisely: cached.y − delta is where
                // the shift left old pixels; if it equals new screenY the
                // blit is correct (shift re-balanced at this child, or
                // yogaTop happens to net out). No cache → blit never
                // painted it → render.
                // isDirty缺失时直接走兜底路径，避免终端渲染使用无效输入。
                if (!isDirty) {
                  // childCached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
                  const childCached = nodeCache.get(childElem)
                  // 终端渲染在这里按实际状态进入对应分支。
                  if (
                    childCached &&
                    Math.floor(childCached.y) - delta === screenY
                  ) {
                    // 跳过当前项，继续处理终端渲染中的下一轮循环。
                    continue
                  }
                }
                // Wipe this child's region with spaces to overwrite stale
                // blitted content — output.clear() only expands damage and
                // cannot zero cells that the blit already wrote.
                // screenBottom保存`Math.min`，供终端渲染后续处理使用。
                const screenBottom = Math.min(
                  Math.floor(contentY + childBottom),
                  Math.floor((y1 ?? y) + padTop + innerHeight),
                )
                // 满足 `screenY < screenBottom` 时，终端渲染执行该分支。
                if (screenY < screenBottom) {
                  // fill保存`Array`，供终端渲染后续处理使用。
                  const fill = Array(screenBottom - screenY)
                    .fill(spaces)
                    .join('\n')
                  // 调用 output.write，触发终端渲染此处需要的副作用。
                  output.write(Math.floor(x), screenY, fill)
                  // 调用 output.clip，触发终端渲染此处需要的副作用。
                  output.clip({
                    x1: undefined,
                    x2: undefined,
                    y1: screenY,
                    y2: screenBottom,
                  })
                  // 调用 renderNodeToOutput，触发终端渲染此处需要的副作用。
                  renderNodeToOutput(childElem, output, {
                    offsetX: contentX,
                    offsetY: contentY,
                    prevScreen: undefined,
                    inheritedBackgroundColor: boxBackgroundColor,
                  })
                  // 调用 output.unclip，触发终端渲染此处需要的副作用。
                  output.unclip()
                }
              }
            }

            // Third pass: repair rows where shifted copies of absolute
            // overlays landed. The blit copied prevScreen cells INCLUDING
            // overlay pixels (overlays render AFTER this ScrollBox so they
            // painted into prevScreen's scroll region). After shift, those
            // pixels sit at (rect.y - delta) — neither edge render nor the
            // overlay's own re-render covers them. Wipe and re-render
            // ScrollBox content so the diff writes correct cells.
            // spaces 集合保存`repeat`，供终端渲染后续处理使用。
            const spaces = absoluteRectsPrev.length ? ' '.repeat(w) : ''
            // 按顺序遍历 `absoluteRectsPrev` 中的r，逐个交给终端渲染处理。
            for (const r of absoluteRectsPrev) {
              // 只有 `r.y >= bottom + 1 || r.y + r.height <= top` 满足时，终端渲染才执行该分支。
              if (r.y >= bottom + 1 || r.y + r.height <= top) continue
              // shiftedTop保存`Math.max`，供终端渲染后续处理使用。
              const shiftedTop = Math.max(top, Math.floor(r.y) - delta)
              // shiftedBottom保存`Math.min`，供终端渲染后续处理使用。
              const shiftedBottom = Math.min(
                bottom + 1,
                Math.floor(r.y + r.height) - delta,
              )
              // Skip if entirely within edge rows (already rendered).
              // 只有 `shiftedTop >= edgeTop && shiftedBottom <= edgeBottom + 1` 满足时，终端渲染才执行该分支。
              if (shiftedTop >= edgeTop && shiftedBottom <= edgeBottom + 1)
                // 跳过当前项，继续处理终端渲染中的下一轮循环。
                continue
              // 满足 `shiftedTop >= shiftedBottom` 时，终端渲染执行该分支。
              if (shiftedTop >= shiftedBottom) continue
              // fill保存`Array`，供终端渲染后续处理使用。
              const fill = Array(shiftedBottom - shiftedTop)
                .fill(spaces)
                .join('\n')
              // 调用 output.write，触发终端渲染此处需要的副作用。
              output.write(Math.floor(x), shiftedTop, fill)
              // 调用 output.clip，触发终端渲染此处需要的副作用。
              output.clip({
                x1: undefined,
                x2: undefined,
                y1: shiftedTop,
                y2: shiftedBottom,
              })
              // 调用 renderScrolledChildren，触发终端渲染此处需要的副作用。
              renderScrolledChildren(
                content,
                output,
                contentX,
                contentY,
                hasRemovedChild,
                undefined,
                shiftedTop - contentY,
                shiftedBottom - contentY,
                boxBackgroundColor,
                true,
              )
              // 调用 output.unclip，触发终端渲染此处需要的副作用。
              output.unclip()
            }
          } else {
            // Full path. Two sub-cases:
            //
            // Scrolled without a usable hint (big jump, container moved):
            // child positions in prevScreen are stale. Clear the viewport
            // and disable blit so children don't restore shifted content.
            //
            // No scroll (spinner tick, content edit): child positions in
            // prevScreen are still valid. Skip the viewport clear and pass
            // prevScreen so unchanged children blit. Dirty children already
            // self-clear via their own cached-rect clear. Without this, a
            // spinner inside ScrollBox forces a full-content rewrite every
            // frame — on wide terminals over tmux (no BSU/ESU) the
            // bandwidth crosses the chunk boundary and the frame tears.
            // scrolled标记Ink 渲染层 render node to output是否启用对应路径。
            const scrolled = contentCached && contentCached.y !== contentY
            // `scrolled && y1` 与 `undefined && y2 !== undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (scrolled && y1 !== undefined && y2 !== undefined) {
              // 调用 output.clear，触发终端渲染此处需要的副作用。
              output.clear({
                x: Math.floor(x),
                y: Math.floor(y1),
                width: Math.floor(width),
                height: Math.floor(y2 - y1),
              })
            }
            // positionChanged (ScrollBox height shrunk — pill mount) means a
            // child spanning the old bottom edge would blit its full cached
            // rect past the new clip. output.ts clips blits now, but also
            // disable prevScreen here so the partial-row child re-renders at
            // correct bounds instead of blitting a clipped (truncated) old
            // rect.
            // 调用 renderScrolledChildren，触发终端渲染此处需要的副作用。
            renderScrolledChildren(
              content,
              output,
              contentX,
              contentY,
              hasRemovedChild,
              scrolled || positionChanged ? undefined : prevScreen,
              scrollTop,
              scrollTop + innerHeight,
              boxBackgroundColor,
            )
          }
          // nodeCache.set 写入新的状态值，使终端渲染后续读取保持一致。
          nodeCache.set(content, {
            x: contentX,
            y: contentY,
            width: contentYoga.getComputedWidth(),
            height: contentYoga.getComputedHeight(),
          })
          // dirty更新为 `false`，确保Ink 渲染层后续读取最新状态。
          content.dirty = false
        }
      } else {
        // Fill interior with background color before rendering children.
        // This covers padding areas and empty space; child text inherits
        // the color via inheritedBackgroundColor so written cells also
        // get the background.
        // Disable prevScreen for children: the fill overwrites the entire
        // interior each render, so child blits from prevScreen would restore
        // stale cells (wrong bg if it changed) on top of the fresh fill.
        // ownBackgroundColor保存`node.style.backgroundColor`，供Ink 渲染层 render node to output后续判断或输出使用。
        const ownBackgroundColor = node.style.backgroundColor
        // 只有 `ownBackgroundColor || node.style.opaque` 满足时，终端渲染才执行该分支。
        if (ownBackgroundColor || node.style.opaque) {
          // borderLeft读取`yogaNode.getComputedBorder`，供终端渲染后续处理使用。
          const borderLeft = yogaNode.getComputedBorder(LayoutEdge.Left)
          // borderRight读取`yogaNode.getComputedBorder`，供终端渲染后续处理使用。
          const borderRight = yogaNode.getComputedBorder(LayoutEdge.Right)
          // borderTop读取`yogaNode.getComputedBorder`，供终端渲染后续处理使用。
          const borderTop = yogaNode.getComputedBorder(LayoutEdge.Top)
          // borderBottom读取`yogaNode.getComputedBorder`，供终端渲染后续处理使用。
          const borderBottom = yogaNode.getComputedBorder(LayoutEdge.Bottom)
          // innerWidth保存`Math.floor`，供终端渲染后续处理使用。
          const innerWidth = Math.floor(width) - borderLeft - borderRight
          // innerHeight保存`Math.floor`，供终端渲染后续处理使用。
          const innerHeight = Math.floor(height) - borderTop - borderBottom
          // 只有 `innerWidth > 0 && innerHeight > 0` 满足时，终端渲染才执行该分支。
          if (innerWidth > 0 && innerHeight > 0) {
            // spaces 集合保存`repeat`，供终端渲染后续处理使用。
            const spaces = ' '.repeat(innerWidth)
            // fillLine保存`ownBackgroundColor`，供Ink 渲染层 render node to output后续判断或输出使用。
            const fillLine = ownBackgroundColor
              ? applyTextStyles(spaces, { backgroundColor: ownBackgroundColor })
              : spaces
            // fill保存`Array`，供终端渲染后续处理使用。
            const fill = Array(innerHeight).fill(fillLine).join('\n')
            // 调用 output.write，触发终端渲染此处需要的副作用。
            output.write(x + borderLeft, y + borderTop, fill)
          }
        }

        // 调用 renderChildren，触发终端渲染此处需要的副作用。
        renderChildren(
          node,
          output,
          x,
          y,
          hasRemovedChild,
          // backgroundColor and opaque both disable child blit: the fill
          // overwrites the entire interior each render, so any child whose
          // layout position shifted would blit stale cells from prevScreen
          // on top of the fresh fill. Previously opaque kept blit enabled
          // on the assumption that plain-space fill + unchanged children =
          // valid composite, but children CAN reposition (ScrollBox remeasure
          // on re-render → /permissions body blanked on Down arrow, #25436).
          ownBackgroundColor || node.style.opaque ? undefined : prevScreen,
          boxBackgroundColor,
        )
      }

      // 满足 `needsClip` 时，终端渲染执行该分支。
      if (needsClip) {
        // 调用 output.unclip，触发终端渲染此处需要的副作用。
        output.unclip()
      }

      // Render border AFTER children to ensure it's not overwritten by child
      // clearing operations. When a child shrinks, it clears its old area,
      // which may overlap with where the parent's border now is.
      // 调用 renderBorder，触发终端渲染此处需要的副作用。
      renderBorder(x, y, node, output)
    // Ink 渲染层 render node to output在这里处理 `} else if (node.nodeName === 'ink-root') {`，完成这一小步状态转换。
    } else if (node.nodeName === 'ink-root') {
      // 调用 renderChildren，触发终端渲染此处需要的副作用。
      renderChildren(
        node,
        output,
        x,
        y,
        hasRemovedChild,
        prevScreen,
        inheritedBackgroundColor,
      )
    }

    // Cache layout bounds for dirty tracking
    // rect 集中保存Ink 渲染层 render node to output要一起传递的字段。
    const rect = { x, y, width, height, top: yogaTop }
    // nodeCache.set 写入新的状态值，使终端渲染后续读取保持一致。
    nodeCache.set(node, rect)
    // 当 `node.style.position` 匹配 `'absolute'` 时，终端渲染执行对应分支。
    if (node.style.position === 'absolute') {
      // absoluteRectsCur追加新条目，保持收集顺序与输入顺序一致。
      absoluteRectsCur.push(rect)
    }
    // dirty更新为 `false`，确保Ink 渲染层后续读取最新状态。
    node.dirty = false
  }
}

// Overflow contamination: content overflows right/down, so clean siblings
// AFTER a dirty/removed sibling can contain stale overflow in prevScreen.
// Disable blit for siblings after a dirty child — but still pass prevScreen
// TO the dirty child itself so its clean descendants can blit. The dirty
// child's own blit check already fails (node.dirty=true at line 216), so
// passing prevScreen only benefits its subtree.
// For removed children we don't know their original position, so
// conservatively disable blit for all.
//
// Clipped children (overflow hidden/scroll on both axes) cannot overflow
// onto later siblings — their content is confined to their layout bounds.
// Skip the contamination guard for them so later siblings can still blit.
// Without this, a spinner inside a ScrollBox dirties the wrapper on every
// tick and the bottom prompt section never blits → 100% writes every frame.
//
// Exception: absolute-positioned clipped children may have layout bounds
// that overlap arbitrary siblings, so the clipping does not help.
//
// Overlap contamination (seenDirtyClipped): a later ABSOLUTE sibling whose
// rect sits inside a dirty clipped child's bounds would blit stale cells
// from prevScreen — the clipped child just rewrote those cells this frame.
// The clipsBothAxes skip only protects against OVERFLOW (clipped child
// painting outside its bounds), not overlap (absolute sibling painting
// inside them). For non-opaque absolute siblings, skipSelfBlit forces
// descent (the full-width rect has transparent gaps → stale blit) while
// still passing prevScreen so opaque descendants can blit their narrower
// rects (NewMessagesPill's inner Text with backgroundColor). Opaque
// absolute siblings fill their entire rect — direct blit is safe.
// renderChildren 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderChildren(
  node: DOMElement,
  output: Output,
  offsetX: number,
  offsetY: number,
  hasRemovedChild: boolean,
  prevScreen: Screen | undefined,
  inheritedBackgroundColor: Color | undefined,
): void {
  // seenDirtyChild标记Ink 渲染层 render node to output是否启用对应路径。
  let seenDirtyChild = false
  // seenDirtyClipped标记Ink 渲染层 render node to output是否启用对应路径。
  let seenDirtyClipped = false
  // 按顺序遍历 `node.childNodes` 中的childNode，逐个交给终端渲染处理。
  for (const childNode of node.childNodes) {
    // childElem 命名 `childNode as DOMElement`，让后续代码直接表达这个值的用途。
    const childElem = childNode as DOMElement
    // Capture dirty before rendering — renderNodeToOutput clears the flag
    // wasDirty保存`childElem.dirty`，供后续判断或组装使用。
    const wasDirty = childElem.dirty
    // isAbsolute标记Ink 渲染层 render node to output是否启用对应路径。
    const isAbsolute = childElem.style.position === 'absolute'
    // 调用 renderNodeToOutput，触发终端渲染此处需要的副作用。
    renderNodeToOutput(childElem, output, {
      offsetX,
      offsetY,
      prevScreen: hasRemovedChild || seenDirtyChild ? undefined : prevScreen,
      // Short-circuits on seenDirtyClipped (false in the common case) so
      // the opaque/bg reads don't happen per-child per-frame.
      skipSelfBlit:
        seenDirtyClipped &&
        isAbsolute &&
        !childElem.style.opaque &&
        childElem.style.backgroundColor === undefined,
      inheritedBackgroundColor,
    })
    // 只有 `wasDirty && !seenDirtyChild` 满足时，终端渲染才执行该分支。
    if (wasDirty && !seenDirtyChild) {
      // 只有 `!clipsBothAxes(childElem) || isAbsolute` 满足时，终端渲染才执行该分支。
      if (!clipsBothAxes(childElem) || isAbsolute) {
        // seenDirtyChild更新为 `true`，确保Ink 渲染层后续读取最新状态。
        seenDirtyChild = true
      } else {
        // seenDirtyClipped更新为 `true`，确保Ink 渲染层后续读取最新状态。
        seenDirtyClipped = true
      }
    }
  }
}

// clipsBothAxes 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function clipsBothAxes(node: DOMElement): boolean {
  // ox 命名 `node.style.overflowX ?? node.style.overflow`，让后续代码直接表达这个值的用途。
  const ox = node.style.overflowX ?? node.style.overflow
  // oy保存`node.style.overflowY ?? node.style.overflow`，供Ink 渲染层 render node to output后续判断或输出使用。
  const oy = node.style.overflowY ?? node.style.overflow
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    (ox === 'hidden' || ox === 'scroll') && (oy === 'hidden' || oy === 'scroll')
  )
}

// When Yoga squeezes a box to h=0, the ghost only happens if a sibling
// lands at the same computed top — then both write to that row and the
// shorter content leaves the longer's tail visible. Yoga's pixel-grid
// rounding can give h=0 while still advancing the next sibling's top
// (HelpV2's third shortcuts column), so h=0 alone isn't sufficient.
// siblingSharesY 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function siblingSharesY(node: DOMElement, yogaNode: LayoutNode): boolean {
  // parent 命名 `node.parentNode`，让后续代码直接表达这个值的用途。
  const parent = node.parentNode
  // parent缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!parent) return false
  // myTop读取`yogaNode.getComputedTop`，供终端渲染后续处理使用。
  const myTop = yogaNode.getComputedTop()
  // siblings 集合保存`parent.childNodes`，供后续判断或组装使用。
  const siblings = parent.childNodes
  // idx保存`siblings.indexOf`，供终端渲染后续处理使用。
  const idx = siblings.indexOf(node)
  // 循环处理 `let i = idx + 1; i < siblings.length; i++`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = idx + 1; i < siblings.length; i++) {
    // sib 命名 `(siblings[i] as DOMElement).yogaNode`，让后续代码直接表达这个值的用途。
    const sib = (siblings[i] as DOMElement).yogaNode
    // sib缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!sib) continue
    // 返回 `sib.getComputedTop() === myTop`，作为终端渲染这次计算的结果。
    return sib.getComputedTop() === myTop
  }
  // No next sibling with a yoga node — check previous. A run of h=0 boxes
  // at the tail would all share y with each other.
  // 循环处理 `let i = idx - 1; i >= 0; i--`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = idx - 1; i >= 0; i--) {
    // sib 命名 `(siblings[i] as DOMElement).yogaNode`，让后续代码直接表达这个值的用途。
    const sib = (siblings[i] as DOMElement).yogaNode
    // sib缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!sib) continue
    // 返回 `sib.getComputedTop() === myTop`，作为终端渲染这次计算的结果。
    return sib.getComputedTop() === myTop
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// When a node blits, its absolute-positioned descendants that paint outside
// the node's layout bounds are NOT covered by the blit (which only copies
// the node's own rect). If a dirty sibling re-rendered and overwrote those
// cells, we must re-blit them from prevScreen so the overlays survive.
// Example: PromptInputFooter's slash menu uses position='absolute' bottom='100%'
// to float above the prompt; a spinner tick in the ScrollBox above re-renders
// and overwrites those cells. Without this, the menu vanishes on the next frame.
// blitEscapingAbsoluteDescendants 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function blitEscapingAbsoluteDescendants(
  node: DOMElement,
  output: Output,
  prevScreen: Screen,
  px: number,
  py: number,
  pw: number,
  ph: number,
): void {
  // pr保存`px + pw`，供Ink 渲染层 render node to output后续判断或输出使用。
  const pr = px + pw
  // pb保存`py + ph`，供后续判断或组装使用。
  const pb = py + ph
  // 按顺序遍历 `node.childNodes` 中的child，逐个交给终端渲染处理。
  for (const child of node.childNodes) {
    // 当 `child.nodeName` 匹配 `'#text'` 时，终端渲染执行对应分支。
    if (child.nodeName === '#text') continue
    // elem 命名 `child as DOMElement`，让后续代码直接表达这个值的用途。
    const elem = child as DOMElement
    // 当 `elem.style.position` 匹配 `'absolute'` 时，终端渲染执行对应分支。
    if (elem.style.position === 'absolute') {
      // cached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
      const cached = nodeCache.get(elem)
      // 满足 `cached` 时，终端渲染执行该分支。
      if (cached) {
        // absoluteRectsCur追加新条目，保持收集顺序与输入顺序一致。
        absoluteRectsCur.push(cached)
        // cx保存`Math.floor`，供终端渲染后续处理使用。
        const cx = Math.floor(cached.x)
        // cy保存`Math.floor`，供终端渲染后续处理使用。
        const cy = Math.floor(cached.y)
        // cw保存`Math.floor`，供终端渲染后续处理使用。
        const cw = Math.floor(cached.width)
        // ch保存`Math.floor`，供终端渲染后续处理使用。
        const ch = Math.floor(cached.height)
        // Only blit rects that extend outside the parent's layout bounds —
        // cells within the parent rect are already covered by the parent blit.
        // 只有 `cx < px || cy < py || cx + cw > pr || cy + ch > pb` 满足时，终端渲染才执行该分支。
        if (cx < px || cy < py || cx + cw > pr || cy + ch > pb) {
          // 调用 output.blit，触发终端渲染此处需要的副作用。
          output.blit(prevScreen, cx, cy, cw, ch)
        }
      }
    }
    // Recurse — absolute descendants can be nested arbitrarily deep
    // 调用 blitEscapingAbsoluteDescendants，触发终端渲染此处需要的副作用。
    blitEscapingAbsoluteDescendants(elem, output, prevScreen, px, py, pw, ph)
  }
}

// Render children of a scroll container with viewport culling.
// scrollTopY..scrollBottomY are the visible window in CHILD-LOCAL Yoga coords
// (i.e. what getComputedTop() returns). Children entirely outside this window
// are skipped; their nodeCache entry is deleted so if they re-enter the
// viewport later they don't emit a stale clear for a position now occupied
// by a sibling.
// renderScrolledChildren 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderScrolledChildren(
  node: DOMElement,
  output: Output,
  offsetX: number,
  offsetY: number,
  hasRemovedChild: boolean,
  prevScreen: Screen | undefined,
  scrollTopY: number,
  scrollBottomY: number,
  inheritedBackgroundColor: Color | undefined,
  // When true (DECSTBM fast path), culled children keep their cache —
  // the blit+shift put stable rows in next.screen so stale cache is
  // never read. Avoids walking O(total_children * subtree_depth) per frame.
  preserveCulledCache = false,
): void {
  // seenDirtyChild标记Ink 渲染层 render node to output是否启用对应路径。
  let seenDirtyChild = false
  // Track cumulative height shift of dirty children iterated so far. When
  // zero, a clean child's yogaTop is unchanged (no sibling above it grew),
  // so cached.top is fresh and the cull check skips yoga. Bottom-append
  // has the dirty child last → all prior clean children hit cache →
  // O(dirty) not O(mounted). Middle-growth leaves shift non-zero after
  // the dirty child → subsequent children yoga-read (needed for correct
  // culling since their yogaTop shifted).
  // cumHeightShift保存`0`，供Ink 渲染层 render node to output后续判断或输出使用。
  let cumHeightShift = 0
  // 按顺序遍历 `node.childNodes` 中的childNode，逐个交给终端渲染处理。
  for (const childNode of node.childNodes) {
    // childElem 命名 `childNode as DOMElement`，让后续代码直接表达这个值的用途。
    const childElem = childNode as DOMElement
    // cy保存`childElem.yogaNode`，供后续判断或组装使用。
    const cy = childElem.yogaNode
    // 满足 `cy` 时，终端渲染执行该分支。
    if (cy) {
      // cached 缓存读取`nodeCache.get`，供终端渲染后续处理使用。
      const cached = nodeCache.get(childElem)
      // top 先占位，稍后的条件分支会根据实际输入补齐它。
      let top: number
      // height 先占位，稍后的条件分支会根据实际输入补齐它。
      let height: number
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        cached?.top !== undefined &&
        !childElem.dirty &&
        cumHeightShift === 0
      ) {
        // top更新为 `cached.top`，确保Ink 渲染层后续读取最新状态。
        top = cached.top
        // height更新为 `cached.height`，确保Ink 渲染层后续读取最新状态。
        height = cached.height
      } else {
        // top更新为 `cy.getComputedTop()`，确保Ink 渲染层后续读取最新状态。
        top = cy.getComputedTop()
        // height更新为 `cy.getComputedHeight()`，确保Ink 渲染层后续读取最新状态。
        height = cy.getComputedHeight()
        // 满足 `childElem.dirty` 时，终端渲染执行该分支。
        if (childElem.dirty) {
          // Ink 渲染层 render node to output在这里处理 `cumHeightShift += height - (cached ? cached.height : 0)`，完成这一小步状态转换。
          cumHeightShift += height - (cached ? cached.height : 0)
        }
        // Refresh cached top so next frame's cumShift===0 path stays
        // correct. For culled children with preserveCulledCache=true this
        // is the ONLY refresh point — without it, a middle-growth frame
        // leaves stale tops that misfire next frame.
        // 满足 `cached` 时，终端渲染执行该分支。
        if (cached) cached.top = top
      }
      // bottom保存`top + height`，供后续判断或组装使用。
      const bottom = top + height
      // 只有 `bottom <= scrollTopY || top >= scrollBottomY` 满足时，终端渲染才执行该分支。
      if (bottom <= scrollTopY || top >= scrollBottomY) {
        // Culled — outside visible window. Drop stale cache entries from
        // the subtree so when this child re-enters it doesn't fire clears
        // at positions now occupied by siblings. The viewport-clear on
        // scroll-change handles the visible-area repaint.
        // 满足 `!preserveCulledCache) dropSubtreeCache(childElem` 时，终端渲染执行该分支。
        if (!preserveCulledCache) dropSubtreeCache(childElem)
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
    }
    // wasDirty保存`childElem.dirty`，供后续判断或组装使用。
    const wasDirty = childElem.dirty
    // 调用 renderNodeToOutput，触发终端渲染此处需要的副作用。
    renderNodeToOutput(childElem, output, {
      offsetX,
      offsetY,
      prevScreen: hasRemovedChild || seenDirtyChild ? undefined : prevScreen,
      inheritedBackgroundColor,
    })
    // 满足 `wasDirty` 时，终端渲染执行该分支。
    if (wasDirty) {
      // seenDirtyChild更新为 `true`，确保Ink 渲染层后续读取最新状态。
      seenDirtyChild = true
    }
  }
}

// dropSubtreeCache 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dropSubtreeCache(node: DOMElement): void {
  // 调用 nodeCache.delete，触发终端渲染此处需要的副作用。
  nodeCache.delete(node)
  // 按顺序遍历 `node.childNodes` 中的child，逐个交给终端渲染处理。
  for (const child of node.childNodes) {
    // `child.nodeName` 与 `'#text'` 不一致时刷新派生状态，避免使用过期结果。
    if (child.nodeName !== '#text') {
      // 调用 dropSubtreeCache，触发终端渲染此处需要的副作用。
      dropSubtreeCache(child as DOMElement)
    }
  }
}

// Exported for testing
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { buildCharToSegmentMap, applyStylesToWrappedText }

export default renderNodeToOutput
