// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 grouping的数据契约。
import type { Message } from '../../types/message.js'

/**
 * Groups messages at API-round boundaries: one group per API round-trip.
 * A boundary fires when a NEW assistant response begins (different
 * message.id from the prior assistant). For well-formed conversations
 * this is an API-safe split point — the API contract requires every
 * tool_use to be resolved before the next assistant turn, so pairing
 * validity falls out of the assistant-id boundary. For malformed inputs
 * (dangling tool_use after resume/truncation) the fork's
 * ensureToolResultPairing repairs the split at API time.
 *
 * Replaces the prior human-turn grouping (boundaries only at real user
 * prompts) with finer-grained API-round grouping, allowing reactive
 * compact to operate on single-prompt agentic sessions (SDK/CCR/eval
 * callers) where the entire workload is one human turn.
 *
 * Extracted to its own file to break the compact.ts ↔ compactMessages.ts
 * cycle (CC-1180) — the cycle shifted module-init order enough to surface
 * a latent ws CJS/ESM resolution race in CI shard-2.
 */
// groupMessagesByApiRound 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function groupMessagesByApiRound(messages: Message[]): Message[][] {
  // groups 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const groups: Message[][] = []
  // current 从空数组开始收集，后续循环会按处理顺序追加条目。
  let current: Message[] = []
  // message.id of the most recently seen assistant. This is the sole
  // boundary gate: streaming chunks from the same API response share an
  // id, so boundaries only fire at the start of a genuinely new round.
  // normalizeMessages yields one AssistantMessage per content block, and
  // StreamingToolExecutor interleaves tool_results between chunks live
  // (yield order, not concat order — see query.ts:613). The id check
  // correctly keeps `[tu_A(id=X), result_A, tu_B(id=X)]` in one group.
  // lastAssistantId 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastAssistantId: string | undefined

  // In a well-formed conversation the API contract guarantees every
  // tool_use is resolved before the next assistant turn, so lastAssistantId
  // alone is a sufficient boundary gate. Tracking unresolved tool_use IDs
  // would only do work when the conversation is malformed (dangling tool_use
  // after resume-from-partial-batch or max_tokens truncation) — and in that
  // case it pins the gate shut forever, merging all subsequent rounds into
  // one group. We let those boundaries fire; the summarizer fork's own
  // ensureToolResultPairing at claude.ts:1136 repairs the dangling tu at
  // API time.
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 grouping处理。
  for (const msg of messages) {
    // 服务层 grouping在这里进入条件判断，后续代码按实际状态分流。
    if (
      msg.type === 'assistant' &&
      msg.message.id !== lastAssistantId &&
      current.length > 0
    ) {
      // groups 集合追加新条目，保持收集顺序与输入顺序一致。
      groups.push(current)
      // current更新为 `[msg]`，确保服务层后续读取最新状态。
      current = [msg]
    } else {
      // current追加新条目，保持收集顺序与输入顺序一致。
      current.push(msg)
    }
    // 当 `msg.type` 匹配 `'assistant'` 时，服务层 grouping执行对应分支。
    if (msg.type === 'assistant') {
      // lastAssistantId更新为 `msg.message.id`，确保服务层后续读取最新状态。
      lastAssistantId = msg.message.id
    }
  }

  // 满足 `current.length > 0` 时，服务层 grouping执行该分支。
  if (current.length > 0) {
    // groups 集合追加新条目，保持收集顺序与输入顺序一致。
    groups.push(current)
  }
  // 返回 `groups`，作为服务层 grouping这次计算的结果。
  return groups
}
