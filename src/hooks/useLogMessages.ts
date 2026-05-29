// 类型依赖 { UUID } 来自 crypto，用于校准React hook 状态流的数据契约。
import type { UUID } from 'crypto'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../utils/agentSwarmsEnabled.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  cleanMessagesForLogging,
  isChainParticipant,
  recordTranscript,
} from '../utils/sessionStorage.js'

/**
 * Hook that logs messages to the transcript
 * conversation ID that only changes when a new conversation is started.
 *
 * @param messages The current conversation messages
 * @param ignore When true, messages will not be recorded to the transcript
 */
// useLogMessages 封装useLogMessages的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useLogMessages(messages: Message[], ignore: boolean = false) {
  // teamContext保存`useAppState`，供React hook后续处理使用。
  const teamContext = useAppState(s => s.teamContext)

  // messages is append-only between compactions, so track where we left off
  // and only pass the new tail to recordTranscript. Avoids O(n) filter+scan
  // on every setMessages (~20x/turn, so n=3000 was ~120k wasted iterations).
  // lastRecordedLengthRef 引用保存`useRef`，供React hook后续处理使用。
  const lastRecordedLengthRef = useRef(0)
  // lastParentUuidRef 引用保存 hook 状态，让React hook use Log Me...跨渲染复用同一个容器。
  const lastParentUuidRef = useRef<UUID | undefined>(undefined)
  // First-uuid change = compaction or /clear rebuilt the array; length alone
  // can't detect this since post-compact [CB,summary,...keep,new] may be longer.
  // firstMessageUuidRef 引用保存 hook 状态，让React hook use Log Me...跨渲染复用同一个容器。
  const firstMessageUuidRef = useRef<UUID | undefined>(undefined)
  // Guard against stale async .then() overwriting a fresher sync update when
  // an incremental render fires before the compaction .then() resolves.
  // callSeqRef 引用保存`useRef`，供React hook后续处理使用。
  const callSeqRef = useRef(0)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `ignore` 时，React hook执行该分支。
    if (ignore) return

    // currentFirstUuid 命名 `messages[0]?.uuid as UUID | undefined`，让后续代码直接表达这个值的用途。
    const currentFirstUuid = messages[0]?.uuid as UUID | undefined
    // prevLength 数量保存`lastRecordedLengthRef.current`，供React hook use Log Me...后续判断或输出使用。
    const prevLength = lastRecordedLengthRef.current

    // First-render: firstMessageUuidRef is undefined. Compaction: first uuid changes.
    // Both are !isIncremental, but first-render sync-walk is safe (no messagesToKeep).
    // wasFirstRender标记React hook use Log Me...是否启用对应路径。
    const wasFirstRender = firstMessageUuidRef.current === undefined
    // isIncremental 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isIncremental =
      currentFirstUuid !== undefined &&
      !wasFirstRender &&
      currentFirstUuid === firstMessageUuidRef.current &&
      prevLength <= messages.length
    // Same-head shrink: tombstone filter, rewind, snip, partial-compact.
    // Distinguished from compaction (first uuid changes) because the tail
    // is either an existing on-disk message or a fresh message that this
    // same effect's recordTranscript(fullArray) will write — see sync-walk
    // guard below.
    // isSameHeadShrink 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isSameHeadShrink =
      currentFirstUuid !== undefined &&
      !wasFirstRender &&
      currentFirstUuid === firstMessageUuidRef.current &&
      prevLength > messages.length

    // startIndex 索引保存`isIncremental ? prevLength : 0`，供后续判断或组装使用。
    const startIndex = isIncremental ? prevLength : 0
    // 满足 `startIndex === messages.length` 时，React hook执行该分支。
    if (startIndex === messages.length) return

    // Full array on first call + after compaction: recordTranscript's own
    // O(n) dedup loop handles messagesToKeep interleaving correctly there.
    // slice格式化`messages.slice`，供React hook后续处理使用。
    const slice = startIndex === 0 ? messages : messages.slice(startIndex)
    // parentHint 命名 `isIncremental ? lastParentUuidRef.current : undefined`，让后续代码直接表达这个值的用途。
    const parentHint = isIncremental ? lastParentUuidRef.current : undefined

    // Fire and forget - we don't want to block the UI.
    // seq保存`++callSeqRef.current`，供后续判断或组装使用。
    const seq = ++callSeqRef.current
    // 显式忽略 `recordTranscript(` 的返回值，只保留它触发的副作用。
    void recordTranscript(
      slice,
      isAgentSwarmsEnabled()
        ? {
            teamName: teamContext?.teamName,
            agentName: teamContext?.selfAgentName,
          }
        : {},
      parentHint,
      messages,
    // 这个回调绑定到 ).then(lastRecordedUuid => {，负责React hook 状态流在该局部场景下的响应。
    ).then(lastRecordedUuid => {
      // For compaction/full array case (!isIncremental): use the async return
      // value. After compaction, messagesToKeep in the array are skipped
      // (already in transcript), so the sync loop would find a wrong UUID.
      // Skip if a newer effect already ran (stale closure would overwrite the
      // fresher sync update from the subsequent incremental render).
      // `seq` 与 `callSeqRef.current` 不一致时刷新派生状态，避免使用过期结果。
      if (seq !== callSeqRef.current) return
      // 组合条件 `lastRecordedUuid && !isIncremental` 成立时，React hook 状态流才启用这条专门路径。
      if (lastRecordedUuid && !isIncremental) {
        // current更新为 `lastRecordedUuid`，确保useLogMessages后续读取最新状态。
        lastParentUuidRef.current = lastRecordedUuid
      }
    })

    // Sync-walk safe for: incremental (pure new-tail slice), first-render
    // (no messagesToKeep interleaving), and same-head shrink. Shrink is the
    // subtle one: the picked uuid is either already on disk (tombstone/rewind
    // — survivors were written before) or is being written by THIS effect's
    // recordTranscript(fullArray) call (snip boundary / partial-compact tail
    // — enqueueWrite ordering guarantees it lands before any later write that
    // chains to it). Without this, the ref stays stale at a tombstoned uuid:
    // the async .then() correction is raced out by the next effect's seq bump
    // on large sessions where recordTranscript(fullArray) is slow. Only the
    // compaction case (first uuid changed) remains unsafe — tail may be
    // messagesToKeep whose last-actually-recorded uuid differs.
    // 组合条件 `isIncremental || wasFirstRender || isSameHeadShri` 成立时，React hook 状态流才启用这条专门路径。
    if (isIncremental || wasFirstRender || isSameHeadShrink) {
      // Match EXACTLY what recordTranscript persists: cleanMessagesForLogging
      // applies both the isLoggableMessage filter and (for external users) the
      // REPL-strip + isVirtual-promote transform. Using the raw predicate here
      // would pick a UUID that the transform drops, leaving the parent hint
      // pointing at a message that never reached disk. Pass full messages as
      // replId context — REPL tool_use and its tool_result land in separate
      // render cycles, so the slice alone can't pair them.
      // last保存`cleanMessagesForLogging`，供React hook后续处理使用。
      const last = cleanMessagesForLogging(slice, messages).findLast(
        isChainParticipant,
      )
      // 满足 `last` 时，React hook执行该分支。
      if (last) lastParentUuidRef.current = last.uuid as UUID
    }

    // current更新为 `messages.length`，确保useLogMessages后续读取最新状态。
    lastRecordedLengthRef.current = messages.length
    // current更新为 `currentFirstUuid`，确保useLogMessages后续读取最新状态。
    firstMessageUuidRef.current = currentFirstUuid
  }, [messages, ignore, teamContext?.teamName, teamContext?.selfAgentName])
}
