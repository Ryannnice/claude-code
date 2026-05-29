// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createHistoryAuthCtx,
  fetchLatestEvents,
  fetchOlderEvents,
  type HistoryAuthCtx,
  type HistoryPage,
} from '../assistant/sessionHistory.js'
// 类型依赖 { ScrollBoxHandle } 来自 ../ink/components/ScrollBox.js，用于校准React hook 状态流的数据契约。
import type { ScrollBoxHandle } from '../ink/components/ScrollBox.js'
// 类型依赖 { RemoteSessionConfig } 来自 ../remote/RemoteSessionManager.js，用于校准React hook 状态流的数据契约。
import type { RemoteSessionConfig } from '../remote/RemoteSessionManager.js'
// 引入 convertSDKMessage，将 ../remote/sdkMessageAdapter.js 中已经封装好的能力接到本文件流程里。
import { convertSDKMessage } from '../remote/sdkMessageAdapter.js'
// 类型依赖 { Message, SystemInformationalMessage } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message, SystemInformationalMessage } from '../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /** Gated on viewerOnly — non-viewer sessions have no remote history to page. */
  config: RemoteSessionConfig | undefined
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  scrollRef: RefObject<ScrollBoxHandle | null>
  /** Called after prepend from the layout effect with message count + height
   *  delta. Lets useUnseenDivider shift dividerIndex + dividerYRef. */
  // 这个回调绑定到 onPrepend?: (indexDelta: number, heightDelta: number) => void，负责React hook 状态流在该局部场景下的响应。
  onPrepend?: (indexDelta: number, heightDelta: number) => void
}

// Result 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Result = {
  /** Trigger for ScrollKeybindingHandler's onScroll composition. */
  // 这个回调绑定到 maybeLoadOlder: (handle: ScrollBoxHandle) => void，负责React hook 状态流在该局部场景下的响应。
  maybeLoadOlder: (handle: ScrollBoxHandle) => void
}

/** Fire loadOlder when scrolled within this many rows of the top. */
// PREFETCH_THRESHOLD_ROWS 集合 命名 `40`，让后续代码直接表达这个值的用途。
const PREFETCH_THRESHOLD_ROWS = 40

/** Max chained page loads to fill the viewport on mount. Bounds the loop if
 *  events convert to zero visible messages (everything filtered). */
// MAX_FILL_PAGES 集合保存`10`，供React hook use Assist...后续判断或输出使用。
const MAX_FILL_PAGES = 10

// SENTINEL_LOADING 命名 `'loading older messages…'`，让后续代码直接表达这个值的用途。
const SENTINEL_LOADING = 'loading older messages…'
// SENTINEL_LOADING_FAILED 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SENTINEL_LOADING_FAILED =
  'failed to load older messages — scroll up to retry'
// SENTINEL_START保存`'start of session'`，作为后续固定文本处理的输入。
const SENTINEL_START = 'start of session'

/** Convert a HistoryPage to REPL Message[] using the same opts as viewer mode. */
// pageToMessages 封装useAssistantHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pageToMessages(page: HistoryPage): Message[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: Message[] = []
  // 按顺序遍历 `page.events` 中的ev，逐个交给React hook处理。
  for (const ev of page.events) {
    // c保存`convertSDKMessage`，供React hook后续处理使用。
    const c = convertSDKMessage(ev, {
      convertUserTextMessages: true,
      convertToolResults: true,
    })
    // 满足 `c.type === 'message') out.push(c.message` 时，React hook执行该分支。
    if (c.type === 'message') out.push(c.message)
  }
  // 返回 `out`，作为React hook 状态流这次计算的结果。
  return out
}

/**
 * Lazy-load `claude assistant` history on scroll-up.
 *
 * On mount: fetch newest page via anchor_to_latest, prepend to messages.
 * On scroll-up near top: fetch next-older page via before_id, prepend with
 * scroll anchoring (viewport stays put).
 *
 * No-op unless config.viewerOnly. REPL only calls this hook inside a
 * feature('KAIROS') gate, so build-time elimination is handled there.
 */
// useAssistantHistory 封装useAssistantHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAssistantHistory({
  config,
  setMessages,
  scrollRef,
  onPrepend,
}: Props): Result {
  // enabled标记React hook use Assist...是否启用对应路径。
  const enabled = config?.viewerOnly === true

  // Cursor state: ref-only (no re-render on cursor change). `null` = no
  // older pages. `undefined` = initial page not fetched yet.
  // cursorRef 引用保存 hook 状态，让React hook use Assist...跨渲染复用同一个容器。
  const cursorRef = useRef<string | null | undefined>(undefined)
  // ctxRef 引用保存 hook 状态，让React hook use Assist...跨渲染复用同一个容器。
  const ctxRef = useRef<HistoryAuthCtx | null>(null)
  // inflightRef 引用保存`useRef`，供React hook后续处理使用。
  const inflightRef = useRef(false)

  // Scroll-anchor: snapshot height + prepended count before setMessages;
  // compensate in useLayoutEffect after React commits. getFreshScrollHeight
  // reads Yoga directly so the value is correct post-commit.
  // anchorRef 引用保存 hook 状态，让React hook use Assist...跨渲染复用同一个容器。
  const anchorRef = useRef<{ beforeHeight: number; count: number } | null>(null)

  // Fill-viewport chaining: after the initial page commits, if content doesn't
  // fill the viewport yet, load another page. Self-chains via the layout effect
  // until filled or the budget runs out. Budget set once on initial load; user
  // scroll-ups don't need it (maybeLoadOlder re-fires on next wheel event).
  // fillBudgetRef 引用保存`useRef`，供React hook后续处理使用。
  const fillBudgetRef = useRef(0)

  // Stable sentinel UUID — reused across swaps so virtual-scroll treats it
  // as one item (text-only mutation, not remove+insert).
  // sentinelUuidRef 引用保存`useRef`，供React hook后续处理使用。
  const sentinelUuidRef = useRef(randomUUID())

  // mkSentinel 封装useAssistantHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function mkSentinel(text: string): SystemInformationalMessage {
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      type: 'system',
      subtype: 'informational',
      content: text,
      isMeta: false,
      timestamp: new Date().toISOString(),
      uuid: sentinelUuidRef.current,
      level: 'info',
    }
  }

  /** Prepend a page at the front, with scroll-anchor snapshot for non-initial.
   *  Replaces the sentinel (always at index 0 when present) in-place. */
  // prepend保存`useCallback`，供React hook后续处理使用。
  const prepend = useCallback(
    (page: HistoryPage, isInitial: boolean) => {
      // msgs 集合保存`pageToMessages`，供React hook后续处理使用。
      const msgs = pageToMessages(page)
      // current更新为 `page.hasMore ? page.firstId : null`，确保useAssistantHistory后续读取最新状态。
      cursorRef.current = page.hasMore ? page.firstId : null

      // isInitial缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!isInitial) {
        // s 集合保存`scrollRef.current`，供后续判断或组装使用。
        const s = scrollRef.current
        // current更新为 `s`，确保useAssistantHistory后续读取最新状态。
        anchorRef.current = s
          ? { beforeHeight: s.getFreshScrollHeight(), count: msgs.length }
          : null
      }

      // sentinel保存`mkSentinel`，供React hook后续处理使用。
      const sentinel = page.hasMore ? null : mkSentinel(SENTINEL_START)
      // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMessages(prev => {
        // Drop existing sentinel (index 0, known stable UUID — O(1)).
        // base 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const base =
          prev[0]?.uuid === sentinelUuidRef.current ? prev.slice(1) : prev
        // 返回 `sentinel ? [sentinel, ...msgs, ...base] : [...msgs, ...base]`，作为React hook 状态流这次计算的结果。
        return sentinel ? [sentinel, ...msgs, ...base] : [...msgs, ...base]
      })

      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[useAssistantHistory] ${isInitial ? 'initial' : 'older'} page: ${msgs.length} msgs (raw ${page.events.length}), hasMore=${page.hasMore}`,
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollRef is a stable ref; mkSentinel reads refs only
    [setMessages],
  )

  // Initial fetch on mount — best-effort.
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!enabled || !config` 成立时，React hook 状态流才启用这条专门路径。
    if (!enabled || !config) return
    // cancelled标记React hook use Assist...是否启用对应路径。
    let cancelled = false
    // 调用 void，触发React hook此处需要的副作用。
    void (async () => {
      // ctx构建`createHistoryAuthCtx`，供React hook后续处理使用。
      const ctx = await createHistoryAuthCtx(config.sessionId).catch(() => null)
      // 组合条件 `!ctx || cancelled` 成立时，React hook 状态流才启用这条专门路径。
      if (!ctx || cancelled) return
      // current更新为 `ctx`，确保useAssistantHistory后续读取最新状态。
      ctxRef.current = ctx
      // page读取`fetchLatestEvents`，供React hook后续处理使用。
      const page = await fetchLatestEvents(ctx)
      // 组合条件 `cancelled || !page` 成立时，React hook 状态流才启用这条专门路径。
      if (cancelled || !page) return
      // current更新为 `MAX_FILL_PAGES`，确保useAssistantHistory后续读取最新状态。
      fillBudgetRef.current = MAX_FILL_PAGES
      // 调用 prepend，触发React hook此处需要的副作用。
      prepend(page, true)
    })()
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保useAssistantHistory后续读取最新状态。
      cancelled = true
    }
    // config identity is stable (created once in main.tsx, never recreated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // loadOlder保存`useCallback`，供React hook后续处理使用。
  const loadOlder = useCallback(async () => {
    // 组合条件 `!enabled || inflightRef.current` 成立时，React hook 状态流才启用这条专门路径。
    if (!enabled || inflightRef.current) return
    // cursor保存`cursorRef.current`，供React hook use Assist...后续判断或输出使用。
    const cursor = cursorRef.current
    // ctx 命名 `ctxRef.current`，让后续代码直接表达这个值的用途。
    const ctx = ctxRef.current
    // 组合条件 `!cursor || !ctx` 成立时，React hook 状态流才启用这条专门路径。
    if (!cursor || !ctx) return // null=exhausted, undefined=initial pending
    // current更新为 `true`，确保useAssistantHistory后续读取最新状态。
    inflightRef.current = true
    // Swap sentinel to "loading…" — O(1) slice since sentinel is at index 0.
    // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
    setMessages(prev => {
      // base 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const base =
        prev[0]?.uuid === sentinelUuidRef.current ? prev.slice(1) : prev
      // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
      return [mkSentinel(SENTINEL_LOADING), ...base]
    })
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // page读取`fetchOlderEvents`，供React hook后续处理使用。
      const page = await fetchOlderEvents(ctx, cursor)
      // page缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!page) {
        // Fetch failed — revert sentinel back to "start" placeholder so the user
        // can retry on next scroll-up. Cursor is preserved (not nulled out).
        // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
        setMessages(prev => {
          // base 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const base =
            prev[0]?.uuid === sentinelUuidRef.current ? prev.slice(1) : prev
          // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
          return [mkSentinel(SENTINEL_LOADING_FAILED), ...base]
        })
        // React hook use Assistant History在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 prepend，触发React hook此处需要的副作用。
      prepend(page, false)
    } finally {
      // current更新为 `false`，确保useAssistantHistory后续读取最新状态。
      inflightRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mkSentinel reads refs only
  }, [enabled, prepend, setMessages])

  // Scroll-anchor compensation — after React commits the prepended items,
  // shift scrollTop by the height delta so the viewport stays put. Also
  // fire onPrepend here (not in prepend()) so dividerIndex + baseline ref
  // are shifted with the ACTUAL height delta, not an estimate.
  // No deps: runs every render; cheap no-op when anchorRef is null.
  // 调用 useLayoutEffect，触发React hook此处需要的副作用。
  useLayoutEffect(() => {
    // anchor保存`anchorRef.current`，供React hook use Assist...后续判断或输出使用。
    const anchor = anchorRef.current
    // 满足 `anchor === null` 时，React hook执行该分支。
    if (anchor === null) return
    // current更新为 `null`，确保useAssistantHistory后续读取最新状态。
    anchorRef.current = null
    // s 集合保存`scrollRef.current`，供后续判断或组装使用。
    const s = scrollRef.current
    // 组合条件 `!s || s.isSticky()` 成立时，React hook 状态流才启用这条专门路径。
    if (!s || s.isSticky()) return // sticky = pinned bottom; prepend is invisible
    // delta读取`s.getFreshScrollHeight`，供React hook后续处理使用。
    const delta = s.getFreshScrollHeight() - anchor.beforeHeight
    // 满足 `delta > 0) s.scrollBy(delta` 时，React hook执行该分支。
    if (delta > 0) s.scrollBy(delta)
    // 调用 onPrepend?.(anchor.count, delta)，完成这一处局部操作。
    onPrepend?.(anchor.count, delta)
  })

  // Fill-viewport chain: after paint, if content doesn't exceed the viewport,
  // load another page. Runs as useEffect (not layout effect) so Ink has
  // painted and scrollViewportHeight is populated. Self-chains via next
  // render's effect; budget caps the chain.
  //
  // The ScrollBox content wrapper has flexGrow:1 flexShrink:0 — it's clamped
  // to ≥ viewport. So `content < viewport` is never true; `<=` detects "no
  // overflow yet" correctly. Stops once there's at least something to scroll.
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      fillBudgetRef.current <= 0 ||
      !cursorRef.current ||
      inflightRef.current
    ) {
      // React hook use Assistant History在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // s 集合保存`scrollRef.current`，供后续判断或组装使用。
    const s = scrollRef.current
    // s 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!s) return
    // contentH读取`s.getFreshScrollHeight`，供React hook后续处理使用。
    const contentH = s.getFreshScrollHeight()
    // viewH读取`s.getViewportHeight`，供React hook后续处理使用。
    const viewH = s.getViewportHeight()
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[useAssistantHistory] fill-check: content=${contentH} viewport=${viewH} budget=${fillBudgetRef.current}`,
    )
    // 满足 `contentH <= viewH` 时，React hook执行该分支。
    if (contentH <= viewH) {
      // React hook use Assistant History在这里处理 `fillBudgetRef.current--`，完成这一小步状态转换。
      fillBudgetRef.current--
      // 显式忽略 `loadOlder()` 的返回值，只保留它触发的副作用。
      void loadOlder()
    } else {
      // current更新为 `0`，确保useAssistantHistory后续读取最新状态。
      fillBudgetRef.current = 0
    }
  })

  // Trigger wrapper for onScroll composition in REPL.
  // maybeLoadOlder保存`useCallback`，供React hook后续处理使用。
  const maybeLoadOlder = useCallback(
    (handle: ScrollBoxHandle) => {
      // 满足 `handle.getScrollTop() < PREFETCH_THRESHOLD_ROWS) void loadOlder(` 时，React hook执行该分支。
      if (handle.getScrollTop() < PREFETCH_THRESHOLD_ROWS) void loadOlder()
    },
    [loadOlder],
  )

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return { maybeLoadOlder }
}
