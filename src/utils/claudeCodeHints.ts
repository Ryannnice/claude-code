/**
 * Claude Code hints protocol.
 *
 * CLIs and SDKs running under Claude Code can emit a self-closing
 * `<claude-code-hint />` tag to stderr (merged into stdout by the shell
 * tools). The harness scans tool output for these tags, strips them before
 * the output reaches the model, and surfaces an install prompt to the
 * user — no inference, no proactive execution.
 *
 * This file provides both the parser and a small module-level store for
 * the pending hint. The store is a single slot (not a queue) — we surface
 * at most one prompt per session, so there's no reason to accumulate.
 * React subscribes via useSyncExternalStore.
 *
 * See docs/claude-code-hints.md for the vendor-facing spec.
 */

// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// ClaudeCodeHintType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeCodeHintType = 'plugin'

// ClaudeCodeHint 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeCodeHint = {
  /** Spec version declared by the emitter. Unknown versions are dropped. */
  v: number
  /** Hint discriminator. v1 defines only `plugin`. */
  type: ClaudeCodeHintType
  /**
   * Hint payload. For `type: 'plugin'`: a `name@marketplace` slug
   * matching the form accepted by `parsePluginIdentifier`.
   */
  value: string
  /**
   * First token of the shell command that produced this hint. Shown in the
   * install prompt so the user can spot a mismatch between the tool that
   * emitted the hint and the plugin it recommends.
   */
  sourceCommand: string
}

/** Spec versions this harness understands. */
// SUPPORTED_VERSIONS 集合保存`Set`，供共享工具后续处理使用。
const SUPPORTED_VERSIONS = new Set([1])

/** Hint types this harness understands at the supported versions. */
// SUPPORTED_TYPES 集合构建`new Set<string>(['plugin'])` 整理出中间结果，供共享工具 claude Code Hints后续步骤使用。
const SUPPORTED_TYPES = new Set<string>(['plugin'])

/**
 * Outer tag match. Anchored to whole lines (multiline mode) so that a
 * hint marker buried in a larger line — e.g. a log statement quoting the
 * tag — is ignored. Leading and trailing whitespace on the line is
 * tolerated since some SDKs pad stderr.
 */
// HINT_TAG_RE 命名 `/^[ \t]*<claude-code-hint\s+([^>]*?)\s*\/>[ \t]*$/gm`，让后续代码直接表达这个值的用途。
const HINT_TAG_RE = /^[ \t]*<claude-code-hint\s+([^>]*?)\s*\/>[ \t]*$/gm

/**
 * Attribute matcher. Accepts `key="value"` and `key=value` (terminated by
 * whitespace or `/>` closing sequence). Values containing whitespace or `"` must use the quoted
 * form. The quoted form does not support escape sequences; raise the spec
 * version if that becomes necessary.
 */
// ATTR_RE读取 `/(\w+)=(?:"([^"]*)"|([^\s/>]+))/g` 对应条目，后续围绕该成员继续处理。
const ATTR_RE = /(\w+)=(?:"([^"]*)"|([^\s/>]+))/g

/**
 * Scan shell tool output for hint tags, returning the parsed hints and
 * the output with hint lines removed. The stripped output is what the
 * model sees — hints are a harness-only side channel.
 *
 * @param output - Raw command output (stdout with stderr interleaved).
 * @param command - The command that produced the output; its first
 *   whitespace-separated token is recorded as `sourceCommand`.
 */
// extractClaudeCodeHints 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function extractClaudeCodeHints(
  output: string,
  command: string,
): { hints: ClaudeCodeHint[]; stripped: string } {
  // Fast path: no tag open sequence → no work, no allocation.
  // 判断 !output.includes('<claude-code-hint')，将共享工具分流到只适用于该条件的处理路径。
  if (!output.includes('<claude-code-hint')) {
    // 返回 { hints: [], stripped: output }，把共享工具这个分支的结果交还调用方。
    return { hints: [], stripped: output }
  }

  // sourceCommand 命令数据保存`firstCommandToken`，供共享工具后续处理使用。
  const sourceCommand = firstCommandToken(command)
  // hints 集合从空数组开始收集，后续按处理顺序追加条目。
  const hints: ClaudeCodeHint[] = []

  // stripped格式化`output.replace`，供共享工具后续处理使用。
  const stripped = output.replace(HINT_TAG_RE, rawLine => {
    // attrs 集合解析`parseAttrs`，供共享工具后续处理使用。
    const attrs = parseAttrs(rawLine)
    // v保存`Number`，供共享工具后续处理使用。
    const v = Number(attrs.v)
    // type保存`attrs.type`，供共享工具 claude Code Hints后续步骤使用。
    const type = attrs.type
    // 取值保存`attrs.value`，供共享工具 claude Code Hints后续步骤使用。
    const value = attrs.value

    // 判断 !SUPPORTED_VERSIONS.has(v)，将共享工具分流到只适用于该条件的处理路径。
    if (!SUPPORTED_VERSIONS.has(v)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[claudeCodeHints] dropped hint with unsupported v=${attrs.v}`,
      )
      // 返回 ''，把共享工具这个分支的结果交还调用方。
      return ''
    }
    // 判断 !type || !SUPPORTED_TYPES.has(type)，将共享工具分流到只适用于该条件的处理路径。
    if (!type || !SUPPORTED_TYPES.has(type)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[claudeCodeHints] dropped hint with unsupported type=${type}`,
      )
      // 返回 ''，把共享工具这个分支的结果交还调用方。
      return ''
    }
    // 取值缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!value) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[claudeCodeHints] dropped hint with empty value')
      // 返回 ''，把共享工具这个分支的结果交还调用方。
      return ''
    }

    // hints 集合追加新条目，保持收集顺序与输入顺序一致。
    hints.push({ v, type: type as ClaudeCodeHintType, value, sourceCommand })
    // 返回 ''，把共享工具这个分支的结果交还调用方。
    return ''
  })

  // Dropping a matched line leaves a blank line (the surrounding newlines
  // remain). Collapse runs of blank lines introduced by the replace so the
  // model-visible output doesn't grow vertical whitespace.
  // collapsed 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const collapsed =
    hints.length > 0 || stripped !== output
      ? stripped.replace(/\n{3,}/g, '\n\n')
      : stripped

  // 返回 { hints, stripped: collapsed }，把共享工具这个分支的结果交还调用方。
  return { hints, stripped: collapsed }
}

// parseAttrs 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
function parseAttrs(tagBody: string): Record<string, string> {
  // attrs 集合从空对象开始收集键值，后续按名称补齐内容。
  const attrs: Record<string, string> = {}
  // 遍历 const m of tagBody.matchAll(ATTR_RE)，按顺序处理共享工具中的批量条目。
  for (const m of tagBody.matchAll(ATTR_RE)) {
    // 共享工具 claude Code Hints处理 `attrs[m[1]!] = m[2] ?? m[3] ?? ''`，完成这一小步状态转换。
    attrs[m[1]!] = m[2] ?? m[3] ?? ''
  }
  // 返回 attrs，把共享工具这个分支的结果交还调用方。
  return attrs
}

// firstCommandToken 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
function firstCommandToken(command: string): string {
  // trimmed格式化`command.trim`，供共享工具后续处理使用。
  const trimmed = command.trim()
  // spaceIdx格式化`trimmed.search`，供共享工具后续处理使用。
  const spaceIdx = trimmed.search(/\s/)
  // 返回 spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)，把共享工具这个分支的结果交还调用方。
  return spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
}

// ============================================================================
// Pending-hint store (useSyncExternalStore interface)
//
// Single-slot: write wins if the slot is already full (a CLI that emits on
// every invocation would otherwise pile up). The dialog is shown at most
// once per session; after that, setPendingHint becomes a no-op.
//
// Callers should gate before writing (installed? already shown? cap hit?) —
// see maybeRecordPluginHint in hintRecommendation.ts for the plugin-type
// gate. This module stays plugin-agnostic so future hint types can reuse
// the same store.
// ============================================================================

// pendingHint保存`null`，供共享工具 claude Code Hints后续步骤使用。
let pendingHint: ClaudeCodeHint | null = null
// shownThisSession记录当前扫描状态，共享工具 claude Code Hints随后按该状态分支。
let shownThisSession = false
// pendingHintChanged构建`createSignal`，供共享工具后续处理使用。
const pendingHintChanged = createSignal()
// notify保存`pendingHintChanged.emit`，供共享工具 claude Code Hints后续步骤使用。
const notify = pendingHintChanged.emit

/** Raw store write. Callers should gate first (see module comment). */
// setPendingHint 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function setPendingHint(hint: ClaudeCodeHint): void {
  // 判断 shownThisSession，将共享工具分流到只适用于该条件的处理路径。
  if (shownThisSession) return
  // pendingHint更新为 `hint`，确保共享工具后续读取最新状态。
  pendingHint = hint
  // notify执行共享工具在此处需要的副作用或外部交互。
  notify()
}

/** Clear the slot without flipping the session flag — for rejected hints. */
// clearPendingHint 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function clearPendingHint(): void {
  // `pendingHint` 与 `null` 不一致时刷新派生状态。
  if (pendingHint !== null) {
    // pendingHint更新为 `null`，确保共享工具后续读取最新状态。
    pendingHint = null
    // notify执行共享工具在此处需要的副作用或外部交互。
    notify()
  }
}

/** Flip the once-per-session flag. Call only when a dialog is actually shown. */
// markShownThisSession 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function markShownThisSession(): void {
  // shownThisSession更新为 `true`，确保共享工具后续读取最新状态。
  shownThisSession = true
}

// subscribeToPendingHint保存`pendingHintChanged.subscribe`，供共享工具 claude Code Hints后续步骤使用。
export const subscribeToPendingHint = pendingHintChanged.subscribe

// getPendingHintSnapshot 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function getPendingHintSnapshot(): ClaudeCodeHint | null {
  // 返回 pendingHint，把共享工具这个分支的结果交还调用方。
  return pendingHint
}

// hasShownHintThisSession 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function hasShownHintThisSession(): boolean {
  // 返回 shownThisSession，把共享工具这个分支的结果交还调用方。
  return shownThisSession
}

/** Test-only reset. */
// _resetClaudeCodeHintStore 承担共享工具中的独立步骤，串起共享工具 claude Code Hints需要的输入整理、状态更新和结果输出。
export function _resetClaudeCodeHintStore(): void {
  // pendingHint更新为 `null`，确保共享工具后续读取最新状态。
  pendingHint = null
  // shownThisSession更新为 `false`，确保共享工具后续读取最新状态。
  shownThisSession = false
}

// _test集中保存共享工具 claude Code Hints要一起传递的字段。
export const _test = {
  parseAttrs,
  firstCommandToken,
}
