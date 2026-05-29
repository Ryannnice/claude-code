// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  getClaudeAiBaseUrl,
  getRemoteSessionUrl,
} from '../constants/product.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 复用 formatDuration、truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatDuration, truncateToWidth } from '../utils/format.js'
// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../utils/intl.js'

/** Bridge status state machine states. */
// StatusState 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type StatusState =
  | 'idle'
  | 'attached'
  | 'titled'
  | 'reconnecting'
  | 'failed'

/** How long a tool activity line stays visible after last tool_start (ms). */
// TOOL_DISPLAY_EXPIRY_MS 集合保存`30_000`，供远程桥接会话远程桥接 bridge Status Util后续判断或输出使用。
export const TOOL_DISPLAY_EXPIRY_MS = 30_000

/** Interval for the shimmer animation tick (ms). */
// SHIMMER_INTERVAL_MS 集合 命名 `150`，让后续代码直接表达这个值的用途。
export const SHIMMER_INTERVAL_MS = 150

// timestamp 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function timestamp(): string {
  // now记录时间`Date`，供远程桥接会话后续处理使用。
  const now = new Date()
  // h保存`String`，供远程桥接会话后续处理使用。
  const h = String(now.getHours()).padStart(2, '0')
  // m保存`String`，供远程桥接会话后续处理使用。
  const m = String(now.getMinutes()).padStart(2, '0')
  // s 集合保存`String`，供远程桥接会话后续处理使用。
  const s = String(now.getSeconds()).padStart(2, '0')
  // 返回 ``${h}:${m}:${s}``，作为远程桥接会话这次计算的结果。
  return `${h}:${m}:${s}`
}

// 重新导出这一组成员，让远程桥接会话的公共 API 保持集中入口。
export { formatDuration, truncateToWidth as truncatePrompt }

/** Abbreviate a tool activity summary for the trail display. */
// abbreviateActivity 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function abbreviateActivity(summary: string): string {
  // 返回 `truncateToWidth(summary, 30)`，作为远程桥接会话这次计算的结果。
  return truncateToWidth(summary, 30)
}

/** Build the connect URL shown when the bridge is idle. */
// buildBridgeConnectUrl 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildBridgeConnectUrl(
  environmentId: string,
  ingressUrl?: string,
): string {
  // baseUrl读取`getClaudeAiBaseUrl`，供远程桥接会话后续处理使用。
  const baseUrl = getClaudeAiBaseUrl(undefined, ingressUrl)
  // 返回 ``${baseUrl}/code?bridge=${environmentId}``，作为远程桥接会话这次计算的结果。
  return `${baseUrl}/code?bridge=${environmentId}`
}

/**
 * Build the session URL shown when a session is attached. Delegates to
 * getRemoteSessionUrl for the cse_→session_ prefix translation, then appends
 * the v1-specific ?bridge={environmentId} query.
 */
// buildBridgeSessionUrl 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildBridgeSessionUrl(
  sessionId: string,
  environmentId: string,
  ingressUrl?: string,
): string {
  // 返回 ``${getRemoteSessionUrl(sessionId, ingressUrl)}?bridge=${environmentId}``，作为远程桥接会话这次计算的结果。
  return `${getRemoteSessionUrl(sessionId, ingressUrl)}?bridge=${environmentId}`
}

/** Compute the glimmer index for a reverse-sweep shimmer animation. */
// computeGlimmerIndex 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeGlimmerIndex(
  tick: number,
  messageWidth: number,
): number {
  // cycleLength 数量 命名 `messageWidth + 20`，让后续代码直接表达这个值的用途。
  const cycleLength = messageWidth + 20
  // 返回 `messageWidth + 10 - (tick % cycleLength)`，作为远程桥接会话这次计算的结果。
  return messageWidth + 10 - (tick % cycleLength)
}

/**
 * Split text into three segments by visual column position for shimmer rendering.
 *
 * Uses grapheme segmentation and `stringWidth` so the split is correct for
 * multi-byte characters, emoji, and CJK glyphs.
 *
 * Returns `{ before, shimmer, after }` strings. Both renderers (chalk in
 * bridgeUI.ts and React/Ink in bridge.tsx) apply their own coloring to
 * these segments.
 */
// computeShimmerSegments 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeShimmerSegments(
  text: string,
  glimmerIndex: number,
): { before: string; shimmer: string; after: string } {
  // messageWidth 消息数据保存`stringWidth`，供远程桥接会话后续处理使用。
  const messageWidth = stringWidth(text)
  // shimmerStart 命名 `glimmerIndex - 1`，让后续代码直接表达这个值的用途。
  const shimmerStart = glimmerIndex - 1
  // shimmerEnd保存`glimmerIndex + 1`，供后续判断或组装使用。
  const shimmerEnd = glimmerIndex + 1

  // When shimmer is offscreen, return all text as "before"
  // 组合条件 `shimmerStart >= messageWidth || shimmerEnd < 0` 成立时，远程桥接会话才启用这条专门路径。
  if (shimmerStart >= messageWidth || shimmerEnd < 0) {
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return { before: text, shimmer: '', after: '' }
  }

  // Split into at most 3 segments by visual column position
  // clampedStart保存`Math.max`，供远程桥接会话后续处理使用。
  const clampedStart = Math.max(0, shimmerStart)
  // colPos 集合保存`0`，供远程桥接会话远程桥接 bridge Status Util后续判断或输出使用。
  let colPos = 0
  // before保存`''`，作为后续固定文本处理的输入。
  let before = ''
  // shimmer 命名 `''`，让后续代码直接表达这个值的用途。
  let shimmer = ''
  // after 命名 `''`，让后续代码直接表达这个值的用途。
  let after = ''
  // 循环处理 `const { segment } of getGraphemeSegmenter().segment(text)`，让远程桥接会话把同类条目按顺序走完。
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    // segWidth保存`stringWidth`，供远程桥接会话后续处理使用。
    const segWidth = stringWidth(segment)
    // 满足 `colPos + segWidth <= clampedStart` 时，远程桥接会话执行该分支。
    if (colPos + segWidth <= clampedStart) {
      // 远程桥接 bridge Status Util在这里处理 `before += segment`，完成这一小步状态转换。
      before += segment
    // 远程桥接 bridge Status Util在这里处理 `} else if (colPos > shimmerEnd) {`，完成这一小步状态转换。
    } else if (colPos > shimmerEnd) {
      // 远程桥接 bridge Status Util在这里处理 `after += segment`，完成这一小步状态转换。
      after += segment
    } else {
      // 远程桥接 bridge Status Util在这里处理 `shimmer += segment`，完成这一小步状态转换。
      shimmer += segment
    }
    // 远程桥接 bridge Status Util在这里处理 `colPos += segWidth`，完成这一小步状态转换。
    colPos += segWidth
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return { before, shimmer, after }
}

/** Computed bridge status label and color from connection state. */
// BridgeStatusInfo 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgeStatusInfo = {
  label:
    | 'Remote Control failed'
    | 'Remote Control reconnecting'
    | 'Remote Control active'
    | 'Remote Control connecting\u2026'
  color: 'error' | 'warning' | 'success'
}

/** Derive a status label and color from the bridge connection state. */
// getBridgeStatus 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeStatus({
  error,
  connected,
  sessionActive,
  reconnecting,
}: {
  error: string | undefined
  connected: boolean
  sessionActive: boolean
  reconnecting: boolean
}): BridgeStatusInfo {
  // 满足 `error` 时，远程桥接会话执行该分支。
  if (error) return { label: 'Remote Control failed', color: 'error' }
  // 满足 `reconnecting` 时，远程桥接会话执行该分支。
  if (reconnecting)
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return { label: 'Remote Control reconnecting', color: 'warning' }
  // 组合条件 `sessionActive || connected` 成立时，远程桥接会话才启用这条专门路径。
  if (sessionActive || connected)
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return { label: 'Remote Control active', color: 'success' }
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return { label: 'Remote Control connecting\u2026', color: 'warning' }
}

/** Footer text shown when bridge is idle (Ready state). */
// buildIdleFooterText 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildIdleFooterText(url: string): string {
  // 返回 ``Code everywhere with the Claude app or ${url}``，作为远程桥接会话这次计算的结果。
  return `Code everywhere with the Claude app or ${url}`
}

/** Footer text shown when a session is active (Connected state). */
// buildActiveFooterText 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildActiveFooterText(url: string): string {
  // 返回 ``Continue coding in the Claude app or ${url}``，作为远程桥接会话这次计算的结果。
  return `Continue coding in the Claude app or ${url}`
}

/** Footer text shown when the bridge has failed. */
// FAILED_FOOTER_TEXT保存`'Something went wrong, please try again'`，作为后续固定文本处理的输入。
export const FAILED_FOOTER_TEXT = 'Something went wrong, please try again'

/**
 * Wrap text in an OSC 8 terminal hyperlink. Zero visual width for layout purposes.
 * strip-ansi (used by stringWidth) correctly strips these sequences, so
 * countVisualLines in bridgeUI.ts remains accurate.
 */
// wrapWithOsc8Link 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapWithOsc8Link(text: string, url: string): string {
  // 返回 ``\x1b]8;;${url}\x07${text}\x1b]8;;\x07``，作为远程桥接会话这次计算的结果。
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
}
