/**
 * Query the terminal and await responses without timeouts.
 *
 * Terminal queries (DECRQM, DA1, OSC 11, etc.) share the stdin stream
 * with keyboard input. Response sequences are syntactically
 * distinguishable from key events, so the input parser recognizes them
 * and dispatches them here.
 *
 * To avoid timeouts, each query batch is terminated by a DA1 sentinel
 * (CSI c) — every terminal since VT100 responds to DA1, and terminals
 * answer queries in order. So: if your query's response arrives before
 * DA1's, the terminal supports it; if DA1 arrives first, it doesn't.
 *
 * Usage:
 *   const [sync, grapheme] = await Promise.all([
 *     querier.send(decrqm(2026)),
 *     querier.send(decrqm(2027)),
 *     querier.flush(),
 *   ])
 *   // sync and grapheme are DECRPM responses or undefined if unsupported
 */

// 类型依赖 { TerminalResponse } 来自 ./parse-keypress.js，用于校准终端渲染的数据契约。
import type { TerminalResponse } from './parse-keypress.js'
// 引入 csi，将 ./termio/csi.js 中已经封装好的能力接到本文件流程里。
import { csi } from './termio/csi.js'
// 引入 osc，将 ./termio/osc.js 中已经封装好的能力接到本文件流程里。
import { osc } from './termio/osc.js'

/** A terminal query: an outbound request sequence paired with a matcher
 *  that recognizes the expected inbound response. Built by `decrqm()`,
 *  `oscColor()`, `kittyKeyboard()`, etc. */
// TerminalQuery 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalQuery<T extends TerminalResponse = TerminalResponse> = {
  /** Escape sequence to write to stdout */
  request: string
  /** Recognizes the expected response in the inbound stream */
  // 这个回调绑定到 match: (r: TerminalResponse) => r is T，负责终端渲染在该局部场景下的响应。
  match: (r: TerminalResponse) => r is T
}

// DecrpmResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DecrpmResponse = Extract<TerminalResponse, { type: 'decrpm' }>
// Da1Response 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Da1Response = Extract<TerminalResponse, { type: 'da1' }>
// Da2Response 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Da2Response = Extract<TerminalResponse, { type: 'da2' }>
// KittyResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type KittyResponse = Extract<TerminalResponse, { type: 'kittyKeyboard' }>
// CursorPosResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type CursorPosResponse = Extract<TerminalResponse, { type: 'cursorPosition' }>
// OscResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type OscResponse = Extract<TerminalResponse, { type: 'osc' }>
// XtversionResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type XtversionResponse = Extract<TerminalResponse, { type: 'xtversion' }>

// -- Query builders --

/** DECRQM: request DEC private mode status (CSI ? mode $ p).
 *  Terminal replies with DECRPM (CSI ? mode ; status $ y) or ignores. */
// decrqm 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decrqm(mode: number): TerminalQuery<DecrpmResponse> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi(`?${mode}$p`),
    match: (r): r is DecrpmResponse => r.type === 'decrpm' && r.mode === mode,
  }
}

/** Primary Device Attributes query (CSI c). Every terminal answers this —
 *  used internally by flush() as a universal sentinel. Call directly if
 *  you want the DA1 params. */
// da1 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function da1(): TerminalQuery<Da1Response> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi('c'),
    match: (r): r is Da1Response => r.type === 'da1',
  }
}

/** Secondary Device Attributes query (CSI > c). Returns terminal version. */
// da2 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function da2(): TerminalQuery<Da2Response> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi('>c'),
    match: (r): r is Da2Response => r.type === 'da2',
  }
}

/** Query current Kitty keyboard protocol flags (CSI ? u).
 *  Terminal replies with CSI ? flags u or ignores. */
// kittyKeyboard 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function kittyKeyboard(): TerminalQuery<KittyResponse> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi('?u'),
    match: (r): r is KittyResponse => r.type === 'kittyKeyboard',
  }
}

/** DECXCPR: request cursor position with DEC-private marker (CSI ? 6 n).
 *  Terminal replies with CSI ? row ; col R. The `?` marker is critical —
 *  the plain DSR form (CSI 6 n → CSI row;col R) is ambiguous with
 *  modified F3 keys (Shift+F3 = CSI 1;2 R, etc.). */
// cursorPosition 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cursorPosition(): TerminalQuery<CursorPosResponse> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi('?6n'),
    match: (r): r is CursorPosResponse => r.type === 'cursorPosition',
  }
}

/** OSC dynamic color query (e.g. OSC 11 for bg color, OSC 10 for fg).
 *  The `?` data slot asks the terminal to reply with the current value. */
// oscColor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function oscColor(code: number): TerminalQuery<OscResponse> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: osc(code, '?'),
    match: (r): r is OscResponse => r.type === 'osc' && r.code === code,
  }
}

/** XTVERSION: request terminal name/version (CSI > 0 q).
 *  Terminal replies with DCS > | name ST (e.g. "xterm.js(5.5.0)") or ignores.
 *  This survives SSH — the query goes through the pty, not the environment,
 *  so it identifies the *client* terminal even when TERM_PROGRAM isn't
 *  forwarded. Used to detect xterm.js for wheel-scroll compensation. */
// xtversion 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function xtversion(): TerminalQuery<XtversionResponse> {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    request: csi('>0q'),
    match: (r): r is XtversionResponse => r.type === 'xtversion',
  }
}

// -- Querier --

/** Sentinel request sequence (DA1). Kept internal; flush() writes it. */
// SENTINEL保存`csi`，供终端渲染后续处理使用。
const SENTINEL = csi('c')

// Pending 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Pending =
  | {
      kind: 'query'
      // 这个回调绑定到 match: (r: TerminalResponse) => boolean，负责终端渲染在该局部场景下的响应。
      match: (r: TerminalResponse) => boolean
      // 这个回调绑定到 resolve: (r: TerminalResponse | undefined) => void，负责终端渲染在该局部场景下的响应。
      resolve: (r: TerminalResponse | undefined) => void
    }
  | { kind: 'sentinel'; resolve: () => void }

// TerminalQuerier 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class TerminalQuerier {
  /**
   * Interleaved queue of queries and sentinels in send order. Terminals
   * respond in order, so each flush() barrier only drains queries queued
   * before it — concurrent batches from independent callers stay isolated.
   */
  private queue: Pending[] = []

  // 构造函数接收 private stdout: NodeJS.WriteStream，把外部输入整理成实例可复用的内部状态。
  constructor(private stdout: NodeJS.WriteStream) {}

  /**
   * Send a query and wait for its response.
   *
   * Resolves with the response when `query.match` matches an incoming
   * TerminalResponse, or with `undefined` when a flush() sentinel arrives
   * before any matching response (meaning the terminal ignored the query).
   *
   * Never rejects; never times out on its own. If you never call flush()
   * and the terminal doesn't respond, the promise remains pending.
   */
  // Ink 渲染层 terminal querier在这里处理 `send<T extends TerminalResponse>(`，完成这一小步状态转换。
  send<T extends TerminalResponse>(
    query: TerminalQuery<T>,
  ): Promise<T | undefined> {
    // 返回 `new Promise(resolve => {`，作为终端渲染这次计算的结果。
    return new Promise(resolve => {
      // queue追加新条目，保持收集顺序与输入顺序一致。
      this.queue.push({
        kind: 'query',
        match: query.match,
        // 这个回调绑定到 resolve: r => resolve(r as T | undefined),，负责终端渲染在该局部场景下的响应。
        resolve: r => resolve(r as T | undefined),
      })
      // 调用 this.stdout.write，触发终端渲染此处需要的副作用。
      this.stdout.write(query.request)
    })
  }

  /**
   * Send the DA1 sentinel. Resolves when DA1's response arrives.
   *
   * As a side effect, all queries still pending when DA1 arrives are
   * resolved with `undefined` (terminal didn't respond → doesn't support
   * the query). This is the barrier that makes send() timeout-free.
   *
   * Safe to call with no pending queries — still waits for a round-trip.
   */
  // flush 使用 无 完成终端渲染里的对应操作。
  flush(): Promise<void> {
    // 返回 `new Promise(resolve => {`，作为终端渲染这次计算的结果。
    return new Promise(resolve => {
      // queue追加新条目，保持收集顺序与输入顺序一致。
      this.queue.push({ kind: 'sentinel', resolve })
      // 调用 this.stdout.write，触发终端渲染此处需要的副作用。
      this.stdout.write(SENTINEL)
    })
  }

  /**
   * Dispatch a response parsed from stdin. Called by App.tsx's
   * processKeysInBatch for every `kind: 'response'` item.
   *
   * Matching strategy:
   * - First, try to match a pending query (FIFO, first match wins).
   *   This lets callers send(da1()) explicitly if they want the DA1
   *   params — a separate DA1 write means the terminal sends TWO DA1
   *   responses. The first matches the explicit query; the second
   *   (unmatched) fires the sentinel.
   * - Otherwise, if this is a DA1, fire the FIRST pending sentinel:
   *   resolve any queries queued before that sentinel with undefined
   *   (the terminal answered DA1 without answering them → unsupported)
   *   and signal its flush() completion. Only draining up to the first
   *   sentinel keeps later batches intact when multiple callers have
   *   concurrent queries in flight.
   * - Unsolicited responses (no match, no sentinel) are silently dropped.
   */
  // onResponse 使用 r: TerminalResponse 完成终端渲染里的对应操作。
  onResponse(r: TerminalResponse): void {
    // idx筛选`queue.findIndex`，供终端渲染后续处理使用。
    const idx = this.queue.findIndex(p => p.kind === 'query' && p.match(r))
    // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (idx !== -1) {
      // 从 `this.queue.splice(idx, 1)` 按位置拆出 q，让Ink 渲染层 terminal querier分别处理这些返回值。
      const [q] = this.queue.splice(idx, 1)
      // 满足 `q?.kind === 'query') q.resolve(r` 时，终端渲染执行该分支。
      if (q?.kind === 'query') q.resolve(r)
      // Ink 渲染层 terminal querier在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 当 `r.type` 匹配 `'da1'` 时，终端渲染执行对应分支。
    if (r.type === 'da1') {
      // s 集合筛选`queue.findIndex`，供终端渲染后续处理使用。
      const s = this.queue.findIndex(p => p.kind === 'sentinel')
      // 满足 `s === -1` 时，终端渲染执行该分支。
      if (s === -1) return
      // 逐项读取 `this.queue.splice(0, s + 1)` 中的p，按输入顺序推进终端渲染。
      for (const p of this.queue.splice(0, s + 1)) {
        // 满足 `p.kind === 'query') p.resolve(undefined` 时，终端渲染执行该分支。
        if (p.kind === 'query') p.resolve(undefined)
        else p.resolve()
      }
    }
  }
}
