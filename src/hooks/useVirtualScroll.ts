// 类型依赖 { RefObject } 来自 react，用于校准React hook 状态流的数据契约。
import type { RefObject } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
// 类型依赖 { ScrollBoxHandle } 来自 ../ink/components/ScrollBox.js，用于校准React hook 状态流的数据契约。
import type { ScrollBoxHandle } from '../ink/components/ScrollBox.js'
// 类型依赖 { DOMElement } 来自 ../ink/dom.js，用于校准React hook 状态流的数据契约。
import type { DOMElement } from '../ink/dom.js'

/**
 * Estimated height (rows) for items not yet measured. Intentionally LOW:
 * overestimating causes blank space (we stop mounting too early and the
 * viewport bottom shows empty spacer), while underestimating just mounts
 * a few extra items into overscan. The asymmetry means we'd rather err low.
 */
// DEFAULT_ESTIMATE保存`3`，供React hook use Virtua...后续判断或输出使用。
const DEFAULT_ESTIMATE = 3
/**
 * Extra rows rendered above and below the viewport. Generous because real
 * heights can be 10x the estimate for long tool results.
 */
// OVERSCAN_ROWS 集合 命名 `80`，让后续代码直接表达这个值的用途。
const OVERSCAN_ROWS = 80
/** Items rendered before the ScrollBox has laid out (viewportHeight=0). */
// COLD_START_COUNT 数量保存`30`，供React hook use Virtua...后续判断或输出使用。
const COLD_START_COUNT = 30
/**
 * scrollTop quantization for the useSyncExternalStore snapshot. Without
 * this, every wheel tick (3-5 per notch) triggers a full React commit +
 * Yoga calculateLayout() + Ink diff cycle — the CPU spike. Visual scroll
 * stays smooth regardless: ScrollBox.forceRender fires on every scrollBy
 * and Ink reads the REAL scrollTop from the DOM node, independent of what
 * React thinks. React only needs to re-render when the mounted range must
 * shift; half of OVERSCAN_ROWS is the tightest safe bin (guarantees ≥40
 * rows of overscan remain before the new range is needed).
 */
// SCROLL_QUANTUM 命名 `OVERSCAN_ROWS >> 1`，让后续代码直接表达这个值的用途。
const SCROLL_QUANTUM = OVERSCAN_ROWS >> 1
/**
 * Worst-case height assumed for unmeasured items when computing coverage.
 * A MessageRow can be as small as 1 row (single-line tool call). Using 1
 * here guarantees the mounted span physically reaches the viewport bottom
 * regardless of how small items actually are — at the cost of over-mounting
 * when items are larger (which is fine, overscan absorbs it).
 */
// PESSIMISTIC_HEIGHT保存`1`，供后续判断或组装使用。
const PESSIMISTIC_HEIGHT = 1
/** Cap on mounted items to bound fiber allocation even in degenerate cases. */
// MAX_MOUNTED_ITEMS 集合保存`300`，供后续判断或组装使用。
const MAX_MOUNTED_ITEMS = 300
/**
 * Max NEW items to mount in a single commit. Scrolling into a fresh range
 * with PESSIMISTIC_HEIGHT=1 would mount 194 items at once (OVERSCAN_ROWS*2+
 * viewportH = 194); each fresh MessageRow render costs ~1.5ms (marked lexer
 * + formatToken + ~11 createInstance) = ~290ms sync block. Sliding the range
 * toward the target over multiple commits keeps per-commit mount cost
 * bounded. The render-time clamp (scrollClampMin/Max) holds the viewport at
 * the edge of mounted content so there's no blank during catch-up.
 */
// SLIDE_STEP保存`25`，供后续判断或组装使用。
const SLIDE_STEP = 25

// NOOP_UNSUB封装成回调，供React hook use Virtua...在事件触发或异步步骤中调用。
const NOOP_UNSUB = () => {}

// VirtualScrollResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type VirtualScrollResult = {
  /** [startIndex, endIndex) half-open slice of items to render. */
  range: readonly [number, number]
  /** Height (rows) of spacer before the first rendered item. */
  topSpacer: number
  /** Height (rows) of spacer after the last rendered item. */
  bottomSpacer: number
  /**
   * Callback ref factory. Attach `measureRef(itemKey)` to each rendered
   * item's root Box; after Yoga layout, the computed height is cached.
   */
  // 这个回调绑定到 measureRef: (key: string) => (el: DOMElement | null) => void，负责React hook 状态流在该局部场景下的响应。
  measureRef: (key: string) => (el: DOMElement | null) => void
  /**
   * Attach to the topSpacer Box. Its Yoga computedTop IS listOrigin
   * (first child of the virtualized region, so its top = cumulative
   * height of everything rendered before the list in the ScrollBox).
   * Drift-free: no subtraction of offsets, no dependence on item
   * heights that change between renders (tmux resize).
   */
  spacerRef: RefObject<DOMElement | null>
  /**
   * Cumulative y-offset of each item in list-wrapper coords (NOT scrollbox
   * coords — logo/siblings before this list shift the origin).
   * offsets[i] = rows above item i; offsets[n] = totalHeight.
   * Recomputed every render — don't memo on identity.
   */
  offsets: ArrayLike<number>
  /**
   * Read Yoga computedTop for item at index. Returns -1 if the item isn't
   * mounted or hasn't been laid out. Item Boxes are direct Yoga children
   * of the ScrollBox content wrapper (fragments collapse in the Ink DOM),
   * so this is content-wrapper-relative — same coordinate space as
   * scrollTop. Yoga layout is scroll-independent (translation happens
   * later in renderNodeToOutput), so positions stay valid across scrolls
   * without waiting for Ink to re-render. StickyTracker walks the mount
   * range with this to find the viewport boundary at per-scroll-tick
   * granularity (finer than the 40-row quantum this hook re-renders at).
   */
  // 这个回调绑定到 getItemTop: (index: number) => number，负责React hook 状态流在该局部场景下的响应。
  getItemTop: (index: number) => number
  /**
   * Get the mounted DOMElement for item at index, or null. For
   * ScrollBox.scrollToElement — anchoring by element ref defers the
   * Yoga-position read to render time (deterministic; no throttle race).
   */
  // 这个回调绑定到 getItemElement: (index: number) => DOMElement | null，负责React hook 状态流在该局部场景下的响应。
  getItemElement: (index: number) => DOMElement | null
  /** Measured Yoga height. undefined = not yet measured; 0 = rendered nothing. */
  // 这个回调绑定到 getItemHeight: (index: number) => number | undefined，负责React hook 状态流在该局部场景下的响应。
  getItemHeight: (index: number) => number | undefined
  /**
   * Scroll so item `i` is in the mounted range. Sets scrollTop =
   * offsets[i] + listOrigin. The range logic finds start from
   * scrollTop vs offsets[] — BOTH use the same offsets value, so they
   * agree by construction regardless of whether offsets[i] is the
   * "true" position. Item i mounts; its screen position may be off by
   * a few-dozen rows (overscan-worth of estimate drift), but it's in
   * the DOM. Follow with getItemTop(i) for the precise position.
   */
  // 这个回调绑定到 scrollToIndex: (i: number) => void，负责React hook 状态流在该局部场景下的响应。
  scrollToIndex: (i: number) => void
}

/**
 * React-level virtualization for items inside a ScrollBox.
 *
 * The ScrollBox already does Ink-output-level viewport culling
 * (render-node-to-output.ts:617 skips children outside the visible window),
 * but all React fibers + Yoga nodes are still allocated. At ~250 KB RSS per
 * MessageRow, a 1000-message session costs ~250 MB of grow-only memory
 * (Ink screen buffer, WASM linear memory, JSC page retention all grow-only).
 *
 * This hook mounts only items in viewport + overscan. Spacer boxes hold the
 * scroll height constant for the rest at O(1) fiber cost each.
 *
 * Height estimation: fixed DEFAULT_ESTIMATE for unmeasured items, replaced
 * by real Yoga heights after first layout. No scroll anchoring — overscan
 * absorbs estimate errors. If drift is noticeable in practice, anchoring
 * (scrollBy(delta) when topSpacer changes) is a straightforward followup.
 *
 * stickyScroll caveat: render-node-to-output.ts:450 sets scrollTop=maxScroll
 * during Ink's render phase, which does NOT fire ScrollBox.subscribe. The
 * at-bottom check below handles this — when pinned to the bottom, we render
 * the last N items regardless of what scrollTop claims.
 */
// useVirtualScroll 封装useVirtualScroll的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useVirtualScroll(
  scrollRef: RefObject<ScrollBoxHandle | null>,
  itemKeys: readonly string[],
  /**
   * Terminal column count. On change, cached heights are stale (text
   * rewraps) — SCALED by oldCols/newCols rather than cleared. Clearing
   * made the pessimistic coverage back-walk mount ~190 items (every
   * uncached item → PESSIMISTIC_HEIGHT=1 → walk 190 to reach
   * viewport+2×overscan). Each fresh mount runs marked.lexer + syntax
   * highlighting ≈ 3ms; ~600ms React reconcile on first resize with a
   * long conversation. Scaling keeps heightCache populated → back-walk
   * uses real-ish heights → mount range stays tight. Scaled estimates
   * are overwritten by real Yoga heights on next useLayoutEffect.
   *
   * Scaled heights are close enough that the black-screen-on-widen bug
   * (inflated pre-resize offsets overshoot post-resize scrollTop → end
   * loop stops short of tail) doesn't trigger: ratio<1 on widen scales
   * heights DOWN, keeping offsets roughly aligned with post-resize Yoga.
   */
  columns: number,
): VirtualScrollResult {
  // heightCache 缓存保存`useRef`，供React hook后续处理使用。
  const heightCache = useRef(new Map<string, number>())
  // Bump whenever heightCache mutates so offsets rebuild on next read. Ref
  // (not state) — checked during render phase, zero extra commits.
  // offsetVersionRef 引用保存`useRef`，供React hook后续处理使用。
  const offsetVersionRef = useRef(0)
  // scrollTop at last commit, for detecting fast-scroll mode (slide cap gate).
  // lastScrollTopRef 引用保存`useRef`，供React hook后续处理使用。
  const lastScrollTopRef = useRef(0)
  // offsetsRef 引用保存 hook 状态，让React hook use Virtua...跨渲染复用同一个容器。
  const offsetsRef = useRef<{ arr: Float64Array; version: number; n: number }>({
    arr: new Float64Array(0),
    version: -1,
    n: -1,
  })
  // itemRefs 集合保存`useRef`，供React hook后续处理使用。
  const itemRefs = useRef(new Map<string, DOMElement>())
  // refCache 缓存保存`useRef`，供React hook后续处理使用。
  const refCache = useRef(new Map<string, (el: DOMElement | null) => void>())
  // Inline ref-compare: must run before offsets is computed below. The
  // skip-flag guards useLayoutEffect from re-populating heightCache with
  // PRE-resize Yoga heights (useLayoutEffect reads Yoga from the frame
  // BEFORE this render's calculateLayout — the one that had the old width).
  // Next render's useLayoutEffect reads post-resize Yoga → correct.
  // prevColumns 集合保存`useRef`，供React hook后续处理使用。
  const prevColumns = useRef(columns)
  // skipMeasurementRef 引用保存`useRef`，供React hook后续处理使用。
  const skipMeasurementRef = useRef(false)
  // Freeze the mount range for the resize-settling cycle. Already-mounted
  // items have warm useMemo (marked.lexer, highlighting); recomputing range
  // from scaled/pessimistic estimates causes mount/unmount churn (~3ms per
  // fresh mount = ~150ms visible as a second flash). The pre-resize range is
  // as good as any — items visible at old width are what the user wants at
  // new width. Frozen for 2 renders: render #1 has skipMeasurement (Yoga
  // still pre-resize), render #2's useLayoutEffect reads post-resize Yoga
  // into heightCache. Render #3 has accurate heights → normal recompute.
  // prevRangeRef 引用保存 hook 状态，让React hook use Virtua...跨渲染复用同一个容器。
  const prevRangeRef = useRef<readonly [number, number] | null>(null)
  // freezeRendersRef 引用保存`useRef`，供React hook后续处理使用。
  const freezeRendersRef = useRef(0)
  // `prevColumns.current` 与 `columns` 不一致时刷新派生状态，避免使用过期结果。
  if (prevColumns.current !== columns) {
    // ratio保存`prevColumns.current / columns`，供React hook use Virtua...后续判断或输出使用。
    const ratio = prevColumns.current / columns
    // current更新为 `columns`，确保useVirtualScroll后续读取最新状态。
    prevColumns.current = columns
    // 循环处理 `const [k, h] of heightCache.current`，让React hook 状态流逐项把同类条目按顺序走完。
    for (const [k, h] of heightCache.current) {
      // heightCache.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
      heightCache.current.set(k, Math.max(1, Math.round(h * ratio)))
    }
    // React hook use Virtual Scroll在这里处理 `offsetVersionRef.current++`，完成这一小步状态转换。
    offsetVersionRef.current++
    // current更新为 `true`，确保useVirtualScroll后续读取最新状态。
    skipMeasurementRef.current = true
    // current更新为 `2`，确保useVirtualScroll后续读取最新状态。
    freezeRendersRef.current = 2
  }
  // frozenRange 命名 `freezeRendersRef.current > 0 ? prevRangeRef.current : null`，让后续代码直接表达这个值的用途。
  const frozenRange = freezeRendersRef.current > 0 ? prevRangeRef.current : null
  // List origin in content-wrapper coords. scrollTop is content-wrapper-
  // relative, but offsets[] are list-local (0 = first virtualized item).
  // Siblings that render BEFORE this list inside the ScrollBox — Logo,
  // StatusNotices, truncation divider in Messages.tsx — shift item Yoga
  // positions by their cumulative height. Without subtracting this, the
  // non-sticky branch's effLo/effHi are inflated and start advances past
  // items that are actually in view (blank viewport on click/scroll when
  // sticky breaks while scrollTop is near max). Read from the topSpacer's
  // Yoga computedTop — it's the first child of the virtualized region, so
  // its top IS listOrigin. No subtraction of offsets → no drift when item
  // heights change between renders (tmux resize: columns change → re-wrap
  // → heights shrink → the old item-sample subtraction went negative →
  // effLo inflated → black screen). One-frame lag like heightCache.
  // listOriginRef 引用保存`useRef`，供React hook后续处理使用。
  const listOriginRef = useRef(0)
  // spacerRef 引用保存 hook 状态，让React hook use Virtua...跨渲染复用同一个容器。
  const spacerRef = useRef<DOMElement | null>(null)

  // useSyncExternalStore ties re-renders to imperative scroll. Snapshot is
  // scrollTop QUANTIZED to SCROLL_QUANTUM bins — Object.is sees no change
  // for small scrolls (most wheel ticks), so React skips the commit + Yoga
  // + Ink cycle entirely until the accumulated delta crosses a bin.
  // Sticky is folded into the snapshot (sign bit) so sticky→broken also
  // triggers: scrollToBottom sets sticky=true without moving scrollTop
  // (Ink moves it later), and the first scrollBy after may land in the
  // same bin. NaN sentinel = ref not attached.
  // subscribe保存`useCallback`，供React hook后续处理使用。
  const subscribe = useCallback(
    (listener: () => void) =>
      scrollRef.current?.subscribe(listener) ?? NOOP_UNSUB,
    [scrollRef],
  )
  // 调用 useSyncExternalStore，触发React hook此处需要的副作用。
  useSyncExternalStore(subscribe, () => {
    // s 集合保存`scrollRef.current`，供后续判断或组装使用。
    const s = scrollRef.current
    // s 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!s) return NaN
    // Snapshot uses the TARGET (scrollTop + pendingDelta), not committed
    // scrollTop. scrollBy only mutates pendingDelta (renderer drains it
    // across frames); committed scrollTop lags. Using target means
    // notify() on scrollBy actually changes the snapshot → React remounts
    // children for the destination before Ink's drain frames need them.
    // target读取`s.getScrollTop`，供React hook后续处理使用。
    const target = s.getScrollTop() + s.getPendingDelta()
    // bin保存`Math.floor`，供React hook后续处理使用。
    const bin = Math.floor(target / SCROLL_QUANTUM)
    // 返回 `s.isSticky() ? ~bin : bin`，作为React hook 状态流这次计算的结果。
    return s.isSticky() ? ~bin : bin
  })
  // Read the REAL committed scrollTop (not quantized) for range math —
  // quantization is only the re-render gate, not the position.
  // scrollTop读取`getScrollTop`，供React hook后续处理使用。
  const scrollTop = scrollRef.current?.getScrollTop() ?? -1
  // Range must span BOTH committed scrollTop (where Ink is rendering NOW)
  // and target (where pending will drain to). During drain, intermediate
  // frames render at scrollTops between the two — if we only mount for
  // the target, those frames find no children (blank rows).
  // pendingDelta读取`getPendingDelta`，供React hook后续处理使用。
  const pendingDelta = scrollRef.current?.getPendingDelta() ?? 0
  // viewportH读取`getViewportHeight`，供React hook后续处理使用。
  const viewportH = scrollRef.current?.getViewportHeight() ?? 0
  // True means the ScrollBox is pinned to the bottom. This is the ONLY
  // stable "at bottom" signal: scrollTop/scrollHeight both reflect the
  // PREVIOUS render's layout, which depends on what WE rendered (topSpacer +
  // items), creating a feedback loop (range → layout → atBottom → range).
  // stickyScroll is set by user action (scrollToBottom/scrollBy), the initial
  // attribute, AND by render-node-to-output when its positional follow fires
  // (scrollTop>=prevMax → pin to new max → set flag). The renderer write is
  // feedback-safe: it only flips false→true, only when already at the
  // positional bottom, and the flag being true here just means "tail-walk,
  // clear clamp" — the same behavior as if we'd read scrollTop==maxScroll
  // directly, minus the instability. Default true: before the ref attaches,
  // assume bottom (sticky will pin us there on first Ink render).
  // isSticky记录 `isSticky` 是否成立，React hook随后按该结果分支。
  const isSticky = scrollRef.current?.isSticky() ?? true

  // GC stale cache entries (compaction, /clear, screenToggleId bump). Only
  // runs when itemKeys identity changes — scrolling doesn't touch keys.
  // itemRefs self-cleans via ref(null) on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
  // 调用 useMemo，触发React hook此处需要的副作用。
  useMemo(() => {
    // live保存`Set`，供React hook后续处理使用。
    const live = new Set(itemKeys)
    // dirty标记React hook use Virtua...是否启用对应路径。
    let dirty = false
    // 逐项读取 `heightCache.current.keys()` 中的k，按输入顺序推进React hook 状态流。
    for (const k of heightCache.current.keys()) {
      // 满足 `!live.has(k)` 时，React hook执行该分支。
      if (!live.has(k)) {
        // 调用 heightCache.current.delete，触发React hook此处需要的副作用。
        heightCache.current.delete(k)
        // dirty更新为 `true`，确保useVirtualScroll后续读取最新状态。
        dirty = true
      }
    }
    // 逐项读取 `refCache.current.keys()` 中的k，按输入顺序推进React hook 状态流。
    for (const k of refCache.current.keys()) {
      // 满足 `!live.has(k)) refCache.current.delete(k` 时，React hook执行该分支。
      if (!live.has(k)) refCache.current.delete(k)
    }
    // 满足 `dirty` 时，React hook执行该分支。
    if (dirty) offsetVersionRef.current++
  }, [itemKeys])

  // Offsets cached across renders, invalidated by offsetVersion ref bump.
  // The previous approach allocated new Array(n+1) + ran n Map.get per
  // render; for n≈27k at key-repeat scroll rate (~11 commits/sec) that's
  // ~300k lookups/sec on a freshly-allocated array → GC churn + ~2ms/render.
  // Version bumped by heightCache writers (measureRef, resize-scale, GC).
  // No setState — the rebuild is read-side-lazy via ref version check during
  // render (same commit, zero extra schedule). The flicker that forced
  // inline-recompute came from setState-driven invalidation.
  // n保存 `itemKeys.length` 的判断结果，供React hook use Virtua...后续分支直接复用。
  const n = itemKeys.length
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    offsetsRef.current.version !== offsetVersionRef.current ||
    offsetsRef.current.n !== n
  ) {
    // arr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const arr =
      offsetsRef.current.arr.length >= n + 1
        ? offsetsRef.current.arr
        : new Float64Array(n + 1)
    // arr[0更新为 `0`，确保React hook use Virtual Scroll后续读取最新状态。
    arr[0] = 0
    // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < n; i++) {
      // React hook use Virtual Scroll在这里处理 `arr[i + 1] =`，完成这一小步状态转换。
      arr[i + 1] =
        arr[i]! + (heightCache.current.get(itemKeys[i]!) ?? DEFAULT_ESTIMATE)
    }
    // current更新为 `{ arr, version: offsetVersionRef.current, n }`，确保useVirtualScroll后续读取最新状态。
    offsetsRef.current = { arr, version: offsetVersionRef.current, n }
  }
  // offsets 集合保存`offsetsRef.current.arr`，供React hook use Virtua...后续判断或输出使用。
  const offsets = offsetsRef.current.arr
  // totalHeight 命名 `offsets[n]!`，让后续代码直接表达这个值的用途。
  const totalHeight = offsets[n]!

  // start 先占位，稍后的条件分支会根据实际输入补齐它。
  let start: number
  // end 先占位，稍后的条件分支会根据实际输入补齐它。
  let end: number

  // 满足 `frozenRange` 时，React hook执行该分支。
  if (frozenRange) {
    // Column just changed. Keep the pre-resize range to avoid mount churn.
    // Clamp to n in case messages were removed (/clear, compaction).
    // React hook use Virtual Scroll在这里处理 `;[start, end] = frozenRange`，完成这一小步状态转换。
    ;[start, end] = frozenRange
    // start更新为 `Math.min(start, n)`，确保useVirtualScroll后续读取最新状态。
    start = Math.min(start, n)
    // end更新为 `Math.min(end, n)`，确保useVirtualScroll后续读取最新状态。
    end = Math.min(end, n)
  // React hook use Virtual Scroll在这里处理 `} else if (viewportH === 0 || scrollTop < 0) {`，完成这一小步状态转换。
  } else if (viewportH === 0 || scrollTop < 0) {
    // Cold start: ScrollBox hasn't laid out yet. Render the tail — sticky
    // scroll pins to the bottom on first Ink render, so these are the items
    // the user actually sees. Any scroll-up after that goes through
    // scrollBy → subscribe fires → we re-render with real values.
    // start更新为 `Math.max(0, n - COLD_START_COUNT)`，确保useVirtualScroll后续读取最新状态。
    start = Math.max(0, n - COLD_START_COUNT)
    // end更新为 `n`，确保useVirtualScroll后续读取最新状态。
    end = n
  } else {
    // 满足 `isSticky` 时，React hook执行该分支。
    if (isSticky) {
      // Sticky-scroll fallback. render-node-to-output may have moved scrollTop
      // without notifying us, so trust "at bottom" over the stale snapshot.
      // Walk back from the tail until we've covered viewport + overscan.
      // budget保存`viewportH + OVERSCAN_ROWS`，供React hook use Virtua...后续判断或输出使用。
      const budget = viewportH + OVERSCAN_ROWS
      // start更新为 `n`，确保useVirtualScroll后续读取最新状态。
      start = n
      // while 使用 start > 0 && totalHeight - offsets[start - 1]! < … 完成React hook 状态流里的对应操作。
      while (start > 0 && totalHeight - offsets[start - 1]! < budget) {
        // React hook use Virtual Scroll在这里处理 `start--`，完成这一小步状态转换。
        start--
      }
      // end更新为 `n`，确保useVirtualScroll后续读取最新状态。
      end = n
    } else {
      // User has scrolled up. Compute start from offsets (estimate-based:
      // may undershoot which is fine — we just start mounting a bit early).
      // Then extend end by CUMULATIVE BEST-KNOWN HEIGHT, not estimated
      // offsets. The invariant is:
      //   topSpacer + sum(real_heights[start..end]) >= scrollTop + viewportH + overscan
      // Since topSpacer = offsets[start] ≤ scrollTop - overscan, we need:
      //   sum(real_heights) >= viewportH + 2*overscan
      // For unmeasured items, assume PESSIMISTIC_HEIGHT=1 — the smallest a
      // MessageRow can be. This over-mounts when items are large, but NEVER
      // leaves the viewport showing empty spacer during fast scroll through
      // unmeasured territory. Once heights are cached (next render),
      // coverage is computed with real values and the range tightens.
      // Advance start past item K only if K is safe to fold into topSpacer
      // without a visible jump. Two cases are safe:
      //   (a) K is NOT currently mounted (itemRefs has no entry). Its
      //       contribution to offsets has ALWAYS been the estimate — the
      //       spacer already matches what was there. No layout change.
      //   (b) K is mounted AND its height is cached. offsets[start+1] uses
      //       the real height, so topSpacer = offsets[start+1] exactly
      //       equals the Yoga span K occupied. Seamless unmount.
      // The unsafe case — K is mounted but uncached — is the one-render
      // window between mount and useLayoutEffect measurement. Keeping K
      // mounted that one extra render lets the measurement land.
      // Mount range spans [committed, target] so every drain frame is
      // covered. Clamp at 0: aggressive wheel-up can push pendingDelta
      // far past zero (MX Master free-spin), but scrollTop never goes
      // negative. Without the clamp, effLo drags start to 0 while effHi
      // stays at the current (high) scrollTop — span exceeds what
      // MAX_MOUNTED_ITEMS can cover and early drain frames see blank.
      // listOrigin translates scrollTop (content-wrapper coords) into
      // list-local coords before comparing against offsets[]. Without
      // this, pre-list siblings (Logo+notices in Messages.tsx) inflate
      // scrollTop by their height and start over-advances — eats overscan
      // first, then visible rows once the inflation exceeds OVERSCAN_ROWS.
      // listOrigin 集合 命名 `listOriginRef.current`，让后续代码直接表达这个值的用途。
      const listOrigin = listOriginRef.current
      // Cap the [committed..target] span. When input outpaces render,
      // pendingDelta grows unbounded → effLo..effHi covers hundreds of
      // unmounted rows → one commit mounts 194 fresh MessageRows → 3s+
      // sync block → more input queues → bigger delta next time. Death
      // spiral. Capping the span bounds fresh mounts per commit; the
      // clamp (setClampBounds) shows edge-of-mounted during catch-up so
      // there's no blank screen — scroll reaches target over a few
      // frames instead of freezing once for seconds.
      // MAX_SPAN_ROWS 集合保存`viewportH * 3`，供React hook use Virtua...后续判断或输出使用。
      const MAX_SPAN_ROWS = viewportH * 3
      // rawLo保存`Math.min`，供React hook后续处理使用。
      const rawLo = Math.min(scrollTop, scrollTop + pendingDelta)
      // rawHi保存`Math.max`，供React hook后续处理使用。
      const rawHi = Math.max(scrollTop, scrollTop + pendingDelta)
      // span保存`rawHi - rawLo`，供后续判断或组装使用。
      const span = rawHi - rawLo
      // clampedLo 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const clampedLo =
        span > MAX_SPAN_ROWS
          ? pendingDelta < 0
            ? rawHi - MAX_SPAN_ROWS // scrolling up: keep near target (low end)
            : rawLo // scrolling down: keep near committed
          : rawLo
      // clampedHi保存`Math.min`，供React hook后续处理使用。
      const clampedHi = clampedLo + Math.min(span, MAX_SPAN_ROWS)
      // effLo保存`Math.max`，供React hook后续处理使用。
      const effLo = Math.max(0, clampedLo - listOrigin)
      // effHi保存`clampedHi - listOrigin`，供React hook use Virtua...后续判断或输出使用。
      const effHi = clampedHi - listOrigin
      // lo保存`effLo - OVERSCAN_ROWS`，供后续判断或组装使用。
      const lo = effLo - OVERSCAN_ROWS
      // Binary search for start — offsets is monotone-increasing. The
      // linear while(start++) scan iterated ~27k times per render for the
      // 27k-msg session (scrolling from bottom, start≈27200). O(log n).
      {
        // l 命名 `0`，让后续代码直接表达这个值的用途。
        let l = 0
        // r保存`n`，供React hook use Virtua...后续判断或输出使用。
        let r = n
        // while 使用 l < r 完成React hook 状态流里的对应操作。
        while (l < r) {
          // m保存`(l + r) >> 1`，供后续判断或组装使用。
          const m = (l + r) >> 1
          // 满足 `offsets[m + 1]! <= lo` 时，React hook执行该分支。
          if (offsets[m + 1]! <= lo) l = m + 1
          else r = m
        }
        // start更新为 `l`，确保useVirtualScroll后续读取最新状态。
        start = l
      }
      // Guard: don't advance past mounted-but-unmeasured items. During the
      // one-render window between mount and useLayoutEffect measurement,
      // unmounting such items would use DEFAULT_ESTIMATE in topSpacer,
      // which doesn't match their (unknown) real span → flicker. Mounted
      // items are in [prevStart, prevEnd); scan that, not all n.
      {
        // p 命名 `prevRangeRef.current`，让后续代码直接表达这个值的用途。
        const p = prevRangeRef.current
        // 组合条件 `p && p[0] < start` 成立时，React hook 状态流才启用这条专门路径。
        if (p && p[0] < start) {
          // 循环处理 `let i = p[0]; i < Math.min(start, p[1]); i++`，让React hook 状态流把同类条目按顺序走完。
          for (let i = p[0]; i < Math.min(start, p[1]); i++) {
            // k读取 `itemKeys[i]!` 对应条目，后续围绕该成员继续处理。
            const k = itemKeys[i]!
            // 组合条件 `itemRefs.current.has(k) && !heightCache.current.has(k)` 成立时，React hook 状态流才启用这条专门路径。
            if (itemRefs.current.has(k) && !heightCache.current.has(k)) {
              // start更新为 `i`，确保useVirtualScroll后续读取最新状态。
              start = i
              // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
              break
            }
          }
        }
      }

      // needed 命名 `viewportH + 2 * OVERSCAN_ROWS`，让后续代码直接表达这个值的用途。
      const needed = viewportH + 2 * OVERSCAN_ROWS
      // maxEnd保存`Math.min`，供React hook后续处理使用。
      const maxEnd = Math.min(n, start + MAX_MOUNTED_ITEMS)
      // coverage保存`0`，供React hook use Virtua...后续判断或输出使用。
      let coverage = 0
      // end更新为 `start`，确保useVirtualScroll后续读取最新状态。
      end = start
      // 调用 while，触发React hook此处需要的副作用。
      while (
        end < maxEnd &&
        (coverage < needed || offsets[end]! < effHi + viewportH + OVERSCAN_ROWS)
      ) {
        // React hook use Virtual Scroll在这里处理 `coverage +=`，完成这一小步状态转换。
        coverage +=
          heightCache.current.get(itemKeys[end]!) ?? PESSIMISTIC_HEIGHT
        // React hook use Virtual Scroll在这里处理 `end++`，完成这一小步状态转换。
        end++
      }
    }
    // Same coverage guarantee for the atBottom path (it walked start back
    // by estimated offsets, which can undershoot if items are small).
    // needed 命名 `viewportH + 2 * OVERSCAN_ROWS`，让后续代码直接表达这个值的用途。
    const needed = viewportH + 2 * OVERSCAN_ROWS
    // minStart保存`Math.max`，供React hook后续处理使用。
    const minStart = Math.max(0, end - MAX_MOUNTED_ITEMS)
    // coverage保存`0`，供React hook use Virtua...后续判断或输出使用。
    let coverage = 0
    // 循环处理 `let i = start; i < end; i++`，让React hook 状态流逐项把同类条目按顺序走完。
    for (let i = start; i < end; i++) {
      // React hook use Virtual Scroll在这里处理 `coverage += heightCache.current.get(itemKeys[i]!) ?? PESSIMISTIC_HEIGHT`，完成这一小步状态转换。
      coverage += heightCache.current.get(itemKeys[i]!) ?? PESSIMISTIC_HEIGHT
    }
    // while 使用 start > minStart && coverage < needed 完成React hook 状态流里的对应操作。
    while (start > minStart && coverage < needed) {
      // React hook use Virtual Scroll在这里处理 `start--`，完成这一小步状态转换。
      start--
      // React hook use Virtual Scroll在这里处理 `coverage +=`，完成这一小步状态转换。
      coverage +=
        heightCache.current.get(itemKeys[start]!) ?? PESSIMISTIC_HEIGHT
    }
    // Slide cap: limit how many NEW items mount this commit. Scrolling into
    // a fresh range would otherwise mount 194 items at PESSIMISTIC_HEIGHT=1
    // coverage — ~290ms React render block. Gates on scroll VELOCITY
    // (|scrollTop delta since last commit| > 2×viewportH — key-repeat PageUp
    // moves ~viewportH/2 per press, 3+ presses batched = fast mode). Covers
    // both scrollBy (pendingDelta) and scrollTo (direct write). Normal
    // single-PageUp or sticky-break jumps skip this. The clamp
    // (setClampBounds) holds the viewport at the mounted edge during
    // catch-up. Only caps range GROWTH; shrinking is unbounded.
    // prev保存`prevRangeRef.current`，供React hook use Virtua...后续判断或输出使用。
    const prev = prevRangeRef.current
    // scrollVelocity 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const scrollVelocity =
      Math.abs(scrollTop - lastScrollTopRef.current) + Math.abs(pendingDelta)
    // 组合条件 `prev && scrollVelocity > viewportH * 2` 成立时，React hook 状态流才启用这条专门路径。
    if (prev && scrollVelocity > viewportH * 2) {
      // 从 `prev` 按位置拆出 pS、pE，让React hook use Virtual Scroll分别处理这些返回值。
      const [pS, pE] = prev
      // 满足 `start < pS - SLIDE_STEP` 时，React hook执行该分支。
      if (start < pS - SLIDE_STEP) start = pS - SLIDE_STEP
      // 满足 `end > pE + SLIDE_STEP` 时，React hook执行该分支。
      if (end > pE + SLIDE_STEP) end = pE + SLIDE_STEP
      // A large forward jump can push start past the capped end (start
      // advances via binary search while end is capped at pE + SLIDE_STEP).
      // Mount SLIDE_STEP items from the new start so the viewport isn't
      // blank during catch-up.
      // 满足 `start > end) end = Math.min(start + SLIDE_STEP, n` 时，React hook执行该分支。
      if (start > end) end = Math.min(start + SLIDE_STEP, n)
    }
    // current更新为 `scrollTop`，确保useVirtualScroll后续读取最新状态。
    lastScrollTopRef.current = scrollTop
  }

  // Decrement freeze AFTER range is computed. Don't update prevRangeRef
  // during freeze so both frozen renders reuse the ORIGINAL pre-resize
  // range (not the clamped-to-n version if messages changed mid-freeze).
  // 满足 `freezeRendersRef.current > 0` 时，React hook执行该分支。
  if (freezeRendersRef.current > 0) {
    // React hook use Virtual Scroll在这里处理 `freezeRendersRef.current--`，完成这一小步状态转换。
    freezeRendersRef.current--
  } else {
    // current更新为 `[start, end]`，确保useVirtualScroll后续读取最新状态。
    prevRangeRef.current = [start, end]
  }
  // useDeferredValue lets React render with the OLD range first (cheap —
  // all memo hits) then transition to the NEW range (expensive — fresh
  // mounts with marked.lexer + formatToken). The urgent render keeps Ink
  // painting at input rate; fresh mounts happen in a non-blocking
  // background render. This is React's native time-slicing: the 62ms
  // fresh-mount block becomes interruptible. The clamp (setClampBounds)
  // already handles viewport pinning so there's no visual artifact from
  // the deferred range lagging briefly behind scrollTop.
  //
  // Only defer range GROWTH (start moving earlier / end moving later adds
  // fresh mounts). Shrinking is cheap (unmount = remove fiber, no parse)
  // and the deferred value lagging shrink causes stale overscan to stay
  // mounted one extra tick — harmless but fails tests checking exact
  // range after measurement-driven tightening.
  // dStart保存`useDeferredValue`，供React hook后续处理使用。
  const dStart = useDeferredValue(start)
  // dEnd保存`useDeferredValue`，供React hook后续处理使用。
  const dEnd = useDeferredValue(end)
  // effStart保存`start < dStart ? dStart : start`，供后续判断或组装使用。
  let effStart = start < dStart ? dStart : start
  // effEnd保存`end > dEnd ? dEnd : end`，供后续判断或组装使用。
  let effEnd = end > dEnd ? dEnd : end
  // A large jump can make effStart > effEnd (start jumps forward while dEnd
  // still holds the old range's end). Skip deferral to avoid an inverted
  // range. Also skip when sticky — scrollToBottom needs the tail mounted
  // NOW so scrollTop=maxScroll lands on content, not bottomSpacer. The
  // deferred dEnd (still at old range) would render an incomplete tail,
  // maxScroll stays at the old content height, and "jump to bottom" stops
  // short. Sticky snap is a single frame, not continuous scroll — the
  // time-slicing benefit doesn't apply.
  // 组合条件 `effStart > effEnd || isSticky` 成立时，React hook 状态流才启用这条专门路径。
  if (effStart > effEnd || isSticky) {
    // effStart更新为 `start`，确保useVirtualScroll后续读取最新状态。
    effStart = start
    // effEnd更新为 `end`，确保useVirtualScroll后续读取最新状态。
    effEnd = end
  }
  // Scrolling DOWN (pendingDelta > 0): bypass effEnd deferral so the tail
  // mounts immediately. Without this, the clamp (based on effEnd) holds
  // scrollTop short of the real bottom — user scrolls down, hits clampMax,
  // stops, React catches up effEnd, clampMax widens, but the user already
  // released. Feels stuck-before-bottom. effStart stays deferred so
  // scroll-UP keeps time-slicing (older messages parse on mount — the
  // expensive direction).
  // 满足 `pendingDelta > 0` 时，React hook执行该分支。
  if (pendingDelta > 0) {
    // effEnd更新为 `end`，确保useVirtualScroll后续读取最新状态。
    effEnd = end
  }
  // Final O(viewport) enforcement. The intermediate caps (maxEnd=start+
  // MAX_MOUNTED_ITEMS, slide cap, deferred-intersection) bound [start,end]
  // but the deferred+bypass combinations above can let [effStart,effEnd]
  // slip: e.g. during sustained PageUp when concurrent mode interleaves
  // dStart updates with effEnd=end bypasses across commits, the effective
  // window can drift wider than either immediate or deferred alone. On a
  // 10K-line resumed session this showed as +270MB RSS during PageUp spam
  // (yoga Node constructor + createWorkInProgress fiber alloc proportional
  // to scroll distance). Trim the far edge — by viewport position — to keep
  // fiber count O(viewport) regardless of deferred-value scheduling.
  // 满足 `effEnd - effStart > MAX_MOUNTED_ITEMS` 时，React hook执行该分支。
  if (effEnd - effStart > MAX_MOUNTED_ITEMS) {
    // Trim side is decided by viewport POSITION, not pendingDelta direction.
    // pendingDelta drains to 0 between frames while dStart/dEnd lag under
    // concurrent scheduling; a direction-based trim then flips from "trim
    // tail" to "trim head" mid-settle, bumping effStart → effTopSpacer →
    // clampMin → setClampBounds yanks scrollTop down → scrollback vanishes.
    // Position-based: keep whichever end the viewport is closer to.
    // mid保存`(offsets[effStart]! + offsets[effEnd]!) / 2`，供React hook use Virtua...后续判断或输出使用。
    const mid = (offsets[effStart]! + offsets[effEnd]!) / 2
    // 满足 `scrollTop - listOriginRef.current < mid` 时，React hook执行该分支。
    if (scrollTop - listOriginRef.current < mid) {
      // effEnd更新为 `effStart + MAX_MOUNTED_ITEMS`，确保useVirtualScroll后续读取最新状态。
      effEnd = effStart + MAX_MOUNTED_ITEMS
    } else {
      // effStart更新为 `effEnd - MAX_MOUNTED_ITEMS`，确保useVirtualScroll后续读取最新状态。
      effStart = effEnd - MAX_MOUNTED_ITEMS
    }
  }

  // Write render-time clamp bounds in a layout effect (not during render —
  // mutating DOM during React render violates purity). render-node-to-output
  // clamps scrollTop to this span so burst scrollTo calls that race past
  // React's async re-render show the EDGE of mounted content (the last/first
  // visible message) instead of blank spacer.
  //
  // Clamp MUST use the EFFECTIVE (deferred) range, not the immediate one.
  // During fast scroll, immediate [start,end] may already cover the new
  // scrollTop position, but the children still render at the deferred
  // (older) range. If clamp uses immediate bounds, the drain-gate in
  // render-node-to-output sees scrollTop within clamp → drains past the
  // deferred children's span → viewport lands in spacer → white flash.
  // Using effStart/effEnd keeps clamp synced with what's actually mounted.
  //
  // Skip clamp when sticky — render-node-to-output pins scrollTop=maxScroll
  // authoritatively. Clamping during cold-start/load causes flicker: first
  // render uses estimate-based offsets, clamp set, sticky-follow moves
  // scrollTop, measurement fires, offsets rebuild with real heights, second
  // render's clamp differs → scrollTop clamp-adjusts → content shifts.
  // listOrigin 集合 命名 `listOriginRef.current`，让后续代码直接表达这个值的用途。
  const listOrigin = listOriginRef.current
  // effTopSpacer读取 `offsets[effStart]!` 对应条目，后续围绕该成员继续处理。
  const effTopSpacer = offsets[effStart]!
  // At effStart=0 there's no unmounted content above — the clamp must allow
  // scrolling past listOrigin to see pre-list content (logo, header) that
  // sits in the ScrollBox but outside VirtualMessageList. Only clamp when
  // the topSpacer is nonzero (there ARE unmounted items above).
  // clampMin标记React hook use Virtua...是否启用对应路径。
  const clampMin = effStart === 0 ? 0 : effTopSpacer + listOrigin
  // At effEnd=n there's no bottomSpacer — nothing to avoid racing past. Using
  // offsets[n] here would bake in heightCache (one render behind Yoga), and
  // when the tail item is STREAMING its cached height lags its real height by
  // however much arrived since last measure. Sticky-break then clamps
  // scrollTop below the real max, pushing the streaming text off-viewport
  // (the "scrolled up, response disappeared" bug). Infinity = unbounded:
  // render-node-to-output's own Math.min(cur, maxScroll) governs instead.
  // clampMax 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const clampMax =
    effEnd === n
      ? Infinity
      : Math.max(effTopSpacer, offsets[effEnd]! - viewportH) + listOrigin
  // 调用 useLayoutEffect，触发React hook此处需要的副作用。
  useLayoutEffect(() => {
    // 满足 `isSticky` 时，React hook执行该分支。
    if (isSticky) {
      // 调用 scrollRef.current?.setClampBounds(undefined, undefined)，完成这一处局部操作。
      scrollRef.current?.setClampBounds(undefined, undefined)
    } else {
      // 调用 scrollRef.current?.setClampBounds(clampMin, clampMax)，完成这一处局部操作。
      scrollRef.current?.setClampBounds(clampMin, clampMax)
    }
  })

  // Measure heights from the PREVIOUS Ink render. Runs every commit (no
  // deps) because Yoga recomputes layout without React knowing. yogaNode
  // heights for items mounted ≥1 frame ago are valid; brand-new items
  // haven't been laid out yet (that happens in resetAfterCommit → onRender,
  // after this effect).
  //
  // Distinguishing "h=0: Yoga hasn't run" (transient, skip) from "h=0:
  // MessageRow rendered null" (permanent, cache it): getComputedWidth() > 0
  // proves Yoga HAS laid out this node (width comes from the container,
  // always non-zero for a Box in a column). If width is set and height is
  // 0, the item is genuinely empty — cache 0 so the start-advance gate
  // doesn't block on it forever. Without this, a null-rendering message
  // at the start boundary freezes the range (seen as blank viewport when
  // scrolling down after scrolling up).
  //
  // NO setState. A setState here would schedule a second commit with
  // shifted offsets, and since Ink writes stdout on every commit
  // (reconciler.resetAfterCommit → onRender), that's two writes with
  // different spacer heights → visible flicker. Heights propagate to
  // offsets on the next natural render. One-frame lag, absorbed by overscan.
  // 调用 useLayoutEffect，触发React hook此处需要的副作用。
  useLayoutEffect(() => {
    // spacerYoga保存`spacerRef.current?.yogaNode`，供后续判断或组装使用。
    const spacerYoga = spacerRef.current?.yogaNode
    // 组合条件 `spacerYoga && spacerYoga.getComputedWidth() > 0` 成立时，React hook 状态流才启用这条专门路径。
    if (spacerYoga && spacerYoga.getComputedWidth() > 0) {
      // current更新为 `spacerYoga.getComputedTop()`，确保useVirtualScroll后续读取最新状态。
      listOriginRef.current = spacerYoga.getComputedTop()
    }
    // 满足 `skipMeasurementRef.current` 时，React hook执行该分支。
    if (skipMeasurementRef.current) {
      // current更新为 `false`，确保useVirtualScroll后续读取最新状态。
      skipMeasurementRef.current = false
      // React hook use Virtual Scroll在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // anyChanged标记React hook use Virtua...是否启用对应路径。
    let anyChanged = false
    // 循环处理 `const [key, el] of itemRefs.current`，让React hook 状态流逐项把同类条目按顺序走完。
    for (const [key, el] of itemRefs.current) {
      // yoga保存`el.yogaNode`，供后续判断或组装使用。
      const yoga = el.yogaNode
      // yoga缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!yoga) continue
      // h读取`yoga.getComputedHeight`，供React hook后续处理使用。
      const h = yoga.getComputedHeight()
      // prev读取`current.get`，供React hook后续处理使用。
      const prev = heightCache.current.get(key)
      // 满足 `h > 0` 时，React hook执行该分支。
      if (h > 0) {
        // `prev` 与 `h` 不一致时刷新派生状态，避免使用过期结果。
        if (prev !== h) {
          // heightCache.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
          heightCache.current.set(key, h)
          // anyChanged更新为 `true`，确保useVirtualScroll后续读取最新状态。
          anyChanged = true
        }
      // React hook use Virtual Scroll在这里处理 `} else if (yoga.getComputedWidth() > 0 && prev !== 0) {`，完成这一小步状态转换。
      } else if (yoga.getComputedWidth() > 0 && prev !== 0) {
        // heightCache.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
        heightCache.current.set(key, 0)
        // anyChanged更新为 `true`，确保useVirtualScroll后续读取最新状态。
        anyChanged = true
      }
    }
    // 满足 `anyChanged` 时，React hook执行该分支。
    if (anyChanged) offsetVersionRef.current++
  })

  // Stable per-key callback refs. React's ref-swap dance (old(null) then
  // new(el)) is a no-op when the callback is identity-stable, avoiding
  // itemRefs churn on every render. GC'd alongside heightCache above.
  // The ref(null) path also captures height at unmount — the yogaNode is
  // still valid then (reconciler calls ref(null) before removeChild →
  // freeRecursive), so we get the final measurement before WASM release.
  // measureRef 引用保存`useCallback`，供React hook后续处理使用。
  const measureRef = useCallback((key: string) => {
    // fn读取`current.get`，供React hook后续处理使用。
    let fn = refCache.current.get(key)
    // fn缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!fn) {
      // fn更新为 `(el: DOMElement | null) => {`，确保useVirtualScroll后续读取最新状态。
      fn = (el: DOMElement | null) => {
        // 满足 `el` 时，React hook执行该分支。
        if (el) {
          // itemRefs.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
          itemRefs.current.set(key, el)
        } else {
          // yoga读取`current.get`，供React hook后续处理使用。
          const yoga = itemRefs.current.get(key)?.yogaNode
          // 组合条件 `yoga && !skipMeasurementRef.current` 成立时，React hook 状态流才启用这条专门路径。
          if (yoga && !skipMeasurementRef.current) {
            // h读取`yoga.getComputedHeight`，供React hook后续处理使用。
            const h = yoga.getComputedHeight()
            // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
            if (
              (h > 0 || yoga.getComputedWidth() > 0) &&
              heightCache.current.get(key) !== h
            ) {
              // heightCache.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
              heightCache.current.set(key, h)
              // React hook use Virtual Scroll在这里处理 `offsetVersionRef.current++`，完成这一小步状态转换。
              offsetVersionRef.current++
            }
          }
          // 调用 itemRefs.current.delete，触发React hook此处需要的副作用。
          itemRefs.current.delete(key)
        }
      }
      // refCache.current.set 写入新的状态值，使React hook 状态流后续读取保持一致。
      refCache.current.set(key, fn)
    }
    // 返回 `fn`，作为React hook 状态流这次计算的结果。
    return fn
  }, [])

  // getItemTop保存`useCallback`，供React hook后续处理使用。
  const getItemTop = useCallback(
    (index: number) => {
      // yoga读取`current.get`，供React hook后续处理使用。
      const yoga = itemRefs.current.get(itemKeys[index]!)?.yogaNode
      // 组合条件 `!yoga || yoga.getComputedWidth() === 0` 成立时，React hook 状态流才启用这条专门路径。
      if (!yoga || yoga.getComputedWidth() === 0) return -1
      // 返回 `yoga.getComputedTop()`，作为React hook 状态流这次计算的结果。
      return yoga.getComputedTop()
    },
    [itemKeys],
  )

  // getItemElement保存`useCallback`，供React hook后续处理使用。
  const getItemElement = useCallback(
    (index: number) => itemRefs.current.get(itemKeys[index]!) ?? null,
    [itemKeys],
  )
  // getItemHeight保存`useCallback`，供React hook后续处理使用。
  const getItemHeight = useCallback(
    (index: number) => heightCache.current.get(itemKeys[index]!),
    [itemKeys],
  )
  // scrollToIndex 索引保存`useCallback`，供React hook后续处理使用。
  const scrollToIndex = useCallback(
    (i: number) => {
      // offsetsRef.current holds latest cached offsets (event handlers run
      // between renders; a render-time closure would be stale).
      // o保存`offsetsRef.current`，供React hook use Virtua...后续判断或输出使用。
      const o = offsetsRef.current
      // 组合条件 `i < 0 || i >= o.n` 成立时，React hook 状态流才启用这条专门路径。
      if (i < 0 || i >= o.n) return
      // 调用 scrollRef.current?.scrollTo(o.arr[i]! + listOriginRef.current)，完成这一处局部操作。
      scrollRef.current?.scrollTo(o.arr[i]! + listOriginRef.current)
    },
    [scrollRef],
  )

  // effBottomSpacer读取 `totalHeight - offsets[effEnd]!` 对应条目，后续围绕该成员继续处理。
  const effBottomSpacer = totalHeight - offsets[effEnd]!

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    range: [effStart, effEnd],
    topSpacer: effTopSpacer,
    bottomSpacer: effBottomSpacer,
    measureRef,
    spacerRef,
    offsets,
    getItemTop,
    getItemElement,
    getItemHeight,
    scrollToIndex,
  }
}
