// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.js，用于校准命令处理的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { LocalJSXCommandCall, LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall, LocalJSXCommandOnDone } from '../../types/command.js';
// 引入 checkOverageGate、confirmOverage、launchRemoteReview，将 ./reviewRemote.js 中已经封装好的能力接到本文件流程里。
import { checkOverageGate, confirmOverage, launchRemoteReview } from './reviewRemote.js';
// 引入 UltrareviewOverageDialog，将 ./UltrareviewOverageDialog.js 中已经封装好的能力接到本文件流程里。
import { UltrareviewOverageDialog } from './UltrareviewOverageDialog.js';
// contentBlocksToString 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function contentBlocksToString(blocks: ContentBlockParam[]): string {
  // 返回 `blocks.map(b => b.type === 'text' ? b.text : '').filter(Boolean).join('...`，作为命令处理这次计算的结果。
  return blocks.map(b => b.type === 'text' ? b.text : '').filter(Boolean).join('\n');
}
// launchAndDone 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function launchAndDone(args: string, context: Parameters<LocalJSXCommandCall>[1], onDone: LocalJSXCommandOnDone, billingNote: string, signal?: AbortSignal): Promise<void> {
  // 结果保存`launchRemoteReview`，供命令处理后续处理使用。
  const result = await launchRemoteReview(args, context, billingNote);
  // User hit Escape during the ~5s launch — the dialog already showed
  // "cancelled" and unmounted, so skip onDone (would write to a dead
  // transcript slot) and let the caller skip confirmOverage.
  // 满足 `signal?.aborted` 时，命令处理执行该分支。
  if (signal?.aborted) return;
  // 满足 `result` 时，命令处理执行该分支。
  if (result) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(contentBlocksToString(result), {
      shouldQuery: true
    });
  } else {
    // Precondition failures now return specific ContentBlockParam[] above.
    // null only reaches here on teleport failure (PR mode) or non-github
    // repo — both are CCR/repo connectivity issues.
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Ultrareview failed to launch the remote session. Check that this is a GitHub repo and try again.', {
      display: 'system'
    });
  }
}
// 这个回调绑定到 export const call: LocalJSXCommandCall = async (onDone, context, args) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async (onDone, context, args) => {
  // gate读取`checkOverageGate`，供命令处理后续处理使用。
  const gate = await checkOverageGate();
  // 当 `gate.kind` 匹配 `'not-enabled'` 时，命令处理执行对应分支。
  if (gate.kind === 'not-enabled') {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Free ultrareviews used. Enable Extra Usage at https://claude.ai/settings/billing to continue.', {
      display: 'system'
    });
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 当 `gate.kind` 匹配 `'low-balance'` 时，命令处理执行对应分支。
  if (gate.kind === 'low-balance') {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`Balance too low to launch ultrareview ($${gate.available.toFixed(2)} available, $10 minimum). Top up at https://claude.ai/settings/billing`, {
      display: 'system'
    });
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 当 `gate.kind` 匹配 `'needs-confirm'` 时，命令处理执行对应分支。
  if (gate.kind === 'needs-confirm') {
    // 返回 `<UltrareviewOverageDialog onProceed={async signal => {`，作为命令处理这次计算的结果。
    return <UltrareviewOverageDialog onProceed={async signal => {
      // 等待 `launchAndDone(args, context, onDone, ' This review bills as Extra Usage...` 完成，再继续斜杠命令 ultrareview Command的异步流程。
      await launchAndDone(args, context, onDone, ' This review bills as Extra Usage.', signal);
      // Only persist the confirmation flag after a non-aborted launch —
      // otherwise Escape-during-launch would leave the flag set and
      // skip this dialog on the next attempt.
      // 满足 `!signal.aborted) confirmOverage(` 时，命令处理执行该分支。
      if (!signal.aborted) confirmOverage();
    // 这个回调绑定到 }} onCancel={() => onDone('Ultrareview cancelled.', {，负责命令处理在该局部场景下的响应。
    }} onCancel={() => onDone('Ultrareview cancelled.', {
      display: 'system'
    })} />;
  }

  // gate.kind === 'proceed'
  // 等待 `launchAndDone(args, context, onDone, gate.billingNote)` 完成，再继续斜杠命令 ultrareview Command的异步流程。
  await launchAndDone(args, context, onDone, gate.billingNote);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDb250ZW50QmxvY2tQYXJhbSIsIlJlYWN0IiwiTG9jYWxKU1hDb21tYW5kQ2FsbCIsIkxvY2FsSlNYQ29tbWFuZE9uRG9uZSIsImNoZWNrT3ZlcmFnZUdhdGUiLCJjb25maXJtT3ZlcmFnZSIsImxhdW5jaFJlbW90ZVJldmlldyIsIlVsdHJhcmV2aWV3T3ZlcmFnZURpYWxvZyIsImNvbnRlbnRCbG9ja3NUb1N0cmluZyIsImJsb2NrcyIsIm1hcCIsImIiLCJ0eXBlIiwidGV4dCIsImZpbHRlciIsIkJvb2xlYW4iLCJqb2luIiwibGF1bmNoQW5kRG9uZSIsImFyZ3MiLCJjb250ZXh0IiwiUGFyYW1ldGVycyIsIm9uRG9uZSIsImJpbGxpbmdOb3RlIiwic2lnbmFsIiwiQWJvcnRTaWduYWwiLCJQcm9taXNlIiwicmVzdWx0IiwiYWJvcnRlZCIsInNob3VsZFF1ZXJ5IiwiZGlzcGxheSIsImNhbGwiLCJnYXRlIiwia2luZCIsImF2YWlsYWJsZSIsInRvRml4ZWQiXSwic291cmNlcyI6WyJ1bHRyYXJldmlld0NvbW1hbmQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29udGVudEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvbWVzc2FnZXMuanMnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7XG4gIExvY2FsSlNYQ29tbWFuZENhbGwsXG4gIExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbn0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcbmltcG9ydCB7XG4gIGNoZWNrT3ZlcmFnZUdhdGUsXG4gIGNvbmZpcm1PdmVyYWdlLFxuICBsYXVuY2hSZW1vdGVSZXZpZXcsXG59IGZyb20gJy4vcmV2aWV3UmVtb3RlLmpzJ1xuaW1wb3J0IHsgVWx0cmFyZXZpZXdPdmVyYWdlRGlhbG9nIH0gZnJvbSAnLi9VbHRyYXJldmlld092ZXJhZ2VEaWFsb2cuanMnXG5cbmZ1bmN0aW9uIGNvbnRlbnRCbG9ja3NUb1N0cmluZyhibG9ja3M6IENvbnRlbnRCbG9ja1BhcmFtW10pOiBzdHJpbmcge1xuICByZXR1cm4gYmxvY2tzXG4gICAgLm1hcChiID0+IChiLnR5cGUgPT09ICd0ZXh0JyA/IGIudGV4dCA6ICcnKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oJ1xcbicpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaEFuZERvbmUoXG4gIGFyZ3M6IHN0cmluZyxcbiAgY29udGV4dDogUGFyYW1ldGVyczxMb2NhbEpTWENvbW1hbmRDYWxsPlsxXSxcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4gIGJpbGxpbmdOb3RlOiBzdHJpbmcsXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxhdW5jaFJlbW90ZVJldmlldyhhcmdzLCBjb250ZXh0LCBiaWxsaW5nTm90ZSlcbiAgLy8gVXNlciBoaXQgRXNjYXBlIGR1cmluZyB0aGUgfjVzIGxhdW5jaCDigJQgdGhlIGRpYWxvZyBhbHJlYWR5IHNob3dlZFxuICAvLyBcImNhbmNlbGxlZFwiIGFuZCB1bm1vdW50ZWQsIHNvIHNraXAgb25Eb25lICh3b3VsZCB3cml0ZSB0byBhIGRlYWRcbiAgLy8gdHJhbnNjcmlwdCBzbG90KSBhbmQgbGV0IHRoZSBjYWxsZXIgc2tpcCBjb25maXJtT3ZlcmFnZS5cbiAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgcmV0dXJuXG4gIGlmIChyZXN1bHQpIHtcbiAgICBvbkRvbmUoY29udGVudEJsb2Nrc1RvU3RyaW5nKHJlc3VsdCksIHsgc2hvdWxkUXVlcnk6IHRydWUgfSlcbiAgfSBlbHNlIHtcbiAgICAvLyBQcmVjb25kaXRpb24gZmFpbHVyZXMgbm93IHJldHVybiBzcGVjaWZpYyBDb250ZW50QmxvY2tQYXJhbVtdIGFib3ZlLlxuICAgIC8vIG51bGwgb25seSByZWFjaGVzIGhlcmUgb24gdGVsZXBvcnQgZmFpbHVyZSAoUFIgbW9kZSkgb3Igbm9uLWdpdGh1YlxuICAgIC8vIHJlcG8g4oCUIGJvdGggYXJlIENDUi9yZXBvIGNvbm5lY3Rpdml0eSBpc3N1ZXMuXG4gICAgb25Eb25lKFxuICAgICAgJ1VsdHJhcmV2aWV3IGZhaWxlZCB0byBsYXVuY2ggdGhlIHJlbW90ZSBzZXNzaW9uLiBDaGVjayB0aGF0IHRoaXMgaXMgYSBHaXRIdWIgcmVwbyBhbmQgdHJ5IGFnYWluLicsXG4gICAgICB7IGRpc3BsYXk6ICdzeXN0ZW0nIH0sXG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjYWxsOiBMb2NhbEpTWENvbW1hbmRDYWxsID0gYXN5bmMgKG9uRG9uZSwgY29udGV4dCwgYXJncykgPT4ge1xuICBjb25zdCBnYXRlID0gYXdhaXQgY2hlY2tPdmVyYWdlR2F0ZSgpXG5cbiAgaWYgKGdhdGUua2luZCA9PT0gJ25vdC1lbmFibGVkJykge1xuICAgIG9uRG9uZShcbiAgICAgICdGcmVlIHVsdHJhcmV2aWV3cyB1c2VkLiBFbmFibGUgRXh0cmEgVXNhZ2UgYXQgaHR0cHM6Ly9jbGF1ZGUuYWkvc2V0dGluZ3MvYmlsbGluZyB0byBjb250aW51ZS4nLFxuICAgICAgeyBkaXNwbGF5OiAnc3lzdGVtJyB9LFxuICAgIClcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKGdhdGUua2luZCA9PT0gJ2xvdy1iYWxhbmNlJykge1xuICAgIG9uRG9uZShcbiAgICAgIGBCYWxhbmNlIHRvbyBsb3cgdG8gbGF1bmNoIHVsdHJhcmV2aWV3ICgkJHtnYXRlLmF2YWlsYWJsZS50b0ZpeGVkKDIpfSBhdmFpbGFibGUsICQxMCBtaW5pbXVtKS4gVG9wIHVwIGF0IGh0dHBzOi8vY2xhdWRlLmFpL3NldHRpbmdzL2JpbGxpbmdgLFxuICAgICAgeyBkaXNwbGF5OiAnc3lzdGVtJyB9LFxuICAgIClcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKGdhdGUua2luZCA9PT0gJ25lZWRzLWNvbmZpcm0nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxVbHRyYXJldmlld092ZXJhZ2VEaWFsb2dcbiAgICAgICAgb25Qcm9jZWVkPXthc3luYyBzaWduYWwgPT4ge1xuICAgICAgICAgIGF3YWl0IGxhdW5jaEFuZERvbmUoXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgIG9uRG9uZSxcbiAgICAgICAgICAgICcgVGhpcyByZXZpZXcgYmlsbHMgYXMgRXh0cmEgVXNhZ2UuJyxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICApXG4gICAgICAgICAgLy8gT25seSBwZXJzaXN0IHRoZSBjb25maXJtYXRpb24gZmxhZyBhZnRlciBhIG5vbi1hYm9ydGVkIGxhdW5jaCDigJRcbiAgICAgICAgICAvLyBvdGhlcndpc2UgRXNjYXBlLWR1cmluZy1sYXVuY2ggd291bGQgbGVhdmUgdGhlIGZsYWcgc2V0IGFuZFxuICAgICAgICAgIC8vIHNraXAgdGhpcyBkaWFsb2cgb24gdGhlIG5leHQgYXR0ZW1wdC5cbiAgICAgICAgICBpZiAoIXNpZ25hbC5hYm9ydGVkKSBjb25maXJtT3ZlcmFnZSgpXG4gICAgICAgIH19XG4gICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkRvbmUoJ1VsdHJhcmV2aWV3IGNhbmNlbGxlZC4nLCB7IGRpc3BsYXk6ICdzeXN0ZW0nIH0pfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICAvLyBnYXRlLmtpbmQgPT09ICdwcm9jZWVkJ1xuICBhd2FpdCBsYXVuY2hBbmREb25lKGFyZ3MsIGNvbnRleHQsIG9uRG9uZSwgZ2F0ZS5iaWxsaW5nTm90ZSlcbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsY0FBY0EsaUJBQWlCLFFBQVEseUNBQXlDO0FBQ2hGLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLGNBQ0VDLG1CQUFtQixFQUNuQkMscUJBQXFCLFFBQ2hCLHdCQUF3QjtBQUMvQixTQUNFQyxnQkFBZ0IsRUFDaEJDLGNBQWMsRUFDZEMsa0JB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