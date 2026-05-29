// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react';
// 引入 setTeleportedSessionInfo，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setTeleportedSessionInfo } from 'src/bootstrap/state.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 类型依赖 { TeleportRemoteResponse } 来自 src/utils/conversationRecovery.js，用于校准React hook 状态流的数据契约。
import type { TeleportRemoteResponse } from 'src/utils/conversationRecovery.js';
// 类型依赖 { CodeSession } 来自 src/utils/teleport/api.js，用于校准React hook 状态流的数据契约。
import type { CodeSession } from 'src/utils/teleport/api.js';
// 复用 errorMessage、TeleportOperationError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage, TeleportOperationError } from '../utils/errors.js';
// 复用 teleportResumeCodeSession 工具函数，把通用处理留在 ../utils/teleport.js 中维护。
import { teleportResumeCodeSession } from '../utils/teleport.js';
// TeleportResumeError 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeleportResumeError = {
  message: string;
  formattedMessage?: string;
  isOperationError: boolean;
};
// TeleportSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeleportSource = 'cliArg' | 'localCommand';
// useTeleportResume 封装useTeleportResume的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTeleportResume(source) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(8);
  // isResuming 由 React state 持有，setIsResuming 会在用户操作或异步结果返回时触发刷新。
  const [isResuming, setIsResuming] = useState(false);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // selectedSession 会话数据 由 React state 持有，setSelectedSession 会在用户操作或异步结果返回时触发刷新。
  const [selectedSession, setSelectedSession] = useState(null);
  // t0 暂存 `async session => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== source) {
    // t0 暂存 `async session => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = async session => {
      // setIsResuming 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsResuming(true);
      // setError 写入新的状态值，使React hook 状态流后续读取保持一致。
      setError(null);
      // setSelectedSession 写入新的状态值，使React hook 状态流后续读取保持一致。
      setSelectedSession(session);
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_teleport_resume_session", {
        source: source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        session_id: session.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // React hook use Teleport Resume在这里处理 ``，完成这一小步状态转换。
      ;
      // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
      try {
        // 结果保存`teleportResumeCodeSession`，供React hook后续处理使用。
        const result = await teleportResumeCodeSession(session.id);
        // setTeleportedSessionInfo 写入新的状态值，使React hook 状态流后续读取保持一致。
        setTeleportedSessionInfo({
          sessionId: session.id
        });
        // setIsResuming 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsResuming(false);
        // 返回 `result`，作为React hook 状态流这次计算的结果。
        return result;
      } catch (t1) {
        // err沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
        const err = t1;
        // teleportError 错误信息 集中保存React hook use Telepo...要一起传递的字段。
        const teleportError = {
          message: err instanceof TeleportOperationError ? err.message : errorMessage(err),
          formattedMessage: err instanceof TeleportOperationError ? err.formattedMessage : undefined,
          isOperationError: err instanceof TeleportOperationError
        };
        // setError 写入新的状态值，使React hook 状态流后续读取保持一致。
        setError(teleportError);
        // setIsResuming 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsResuming(false);
        // 返回 `null`，作为React hook 状态流这次计算的结果。
        return null;
      }
    };
    // $[0] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = source;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // resumeSession 会话数据沿用 `t0` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const resumeSession = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // setError 写入新的状态值，使React hook 状态流后续读取保持一致。
      setError(null);
    };
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // clearError 错误信息保存`t1`，作为后续临时缓存值处理的输入。
  const clearError = t1;
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== error || $[4] !== isResuming || $[5] !== resumeSession || $[6] !== selectedSession) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      resumeSession,
      isResuming,
      error,
      selectedSession,
      clearError
    };
    // $[3] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = error;
    // $[4] 缓存 `isResuming`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = isResuming;
    // $[5] 缓存 `resumeSession`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = resumeSession;
    // $[6] 缓存 `selectedSession`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = selectedSession;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // 返回 `t2`，作为React hook 状态流这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VDYWxsYmFjayIsInVzZVN0YXRlIiwic2V0VGVsZXBvcnRlZFNlc3Npb25JbmZvIiwiQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyIsImxvZ0V2ZW50IiwiVGVsZXBvcnRSZW1vdGVSZXNwb25zZSIsIkNvZGVTZXNzaW9uIiwiZXJyb3JNZXNzYWdlIiwiVGVsZXBvcnRPcGVyYXRpb25FcnJvciIsInRlbGVwb3J0UmVzdW1lQ29kZVNlc3Npb24iLCJUZWxlcG9ydFJlc3VtZUVycm9yIiwibWVzc2FnZSIsImZvcm1hdHRlZE1lc3NhZ2UiLCJpc09wZXJhdGlvbkVycm9yIiwiVGVsZXBvcnRTb3VyY2UiLCJ1c2VUZWxlcG9ydFJlc3VtZSIsInNvdXJjZSIsIiQiLCJfYyIsImlzUmVzdW1pbmciLCJzZXRJc1Jlc3VtaW5nIiwiZXJyb3IiLCJzZXRFcnJvciIsInNlbGVjdGVkU2Vzc2lvbiIsInNldFNlbGVjdGVkU2Vzc2lvbiIsInQwIiwic2Vzc2lvbiIsInNlc3Npb25faWQiLCJpZCIsInJlc3VsdCIsInNlc3Npb25JZCIsInQxIiwiZXJyIiwidGVsZXBvcnRFcnJvciIsInVuZGVmaW5lZCIsInJlc3VtZVNlc3Npb24iLCJTeW1ib2wiLCJmb3IiLCJjbGVhckVycm9yIiwidDIiXSwic291cmNlcyI6WyJ1c2VUZWxlcG9ydFJlc3VtZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBzZXRUZWxlcG9ydGVkU2Vzc2lvbkluZm8gfSBmcm9tICdzcmMvYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB0eXBlIHsgVGVsZXBvcnRSZW1vdGVSZXNwb25zZSB9IGZyb20gJ3NyYy91dGlscy9jb252ZXJzYXRpb25SZWNvdmVyeS5qcydcbmltcG9ydCB0eXBlIHsgQ29kZVNlc3Npb24gfSBmcm9tICdzcmMvdXRpbHMvdGVsZXBvcnQvYXBpLmpzJ1xuaW1wb3J0IHsgZXJyb3JNZXNzYWdlLCBUZWxlcG9ydE9wZXJhdGlvbkVycm9yIH0gZnJvbSAnLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgdGVsZXBvcnRSZXN1bWVDb2RlU2Vzc2lvbiB9IGZyb20gJy4uL3V0aWxzL3RlbGVwb3J0LmpzJ1xuXG5leHBvcnQgdHlwZSBUZWxlcG9ydFJlc3VtZUVycm9yID0ge1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgZm9ybWF0dGVkTWVzc2FnZT86IHN0cmluZ1xuICBpc09wZXJhdGlvbkVycm9yOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFRlbGVwb3J0U291cmNlID0gJ2NsaUFyZycgfCAnbG9jYWxDb21tYW5kJ1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlVGVsZXBvcnRSZXN1bWUoc291cmNlOiBUZWxlcG9ydFNvdXJjZSkge1xuICBjb25zdCBbaXNSZXN1bWluZywgc2V0SXNSZXN1bWluZ10gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxUZWxlcG9ydFJlc3VtZUVycm9yIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3NlbGVjdGVkU2Vzc2lvbiwgc2V0U2VsZWN0ZWRTZXNzaW9uXSA9IHVzZVN0YXRlPENvZGVTZXNzaW9uIHwgbnVsbD4oXG4gICAgbnVsbCxcbiAgKVxuXG4gIGNvbnN0IHJlc3VtZVNlc3Npb24gPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAoc2Vzc2lvbjogQ29kZVNlc3Npb24pOiBQcm9taXNlPFRlbGVwb3J0UmVtb3RlUmVzcG9uc2UgfCBudWxsPiA9PiB7XG4gICAgICBzZXRJc1Jlc3VtaW5nKHRydWUpXG4gICAgICBzZXRFcnJvcihudWxsKVxuICAgICAgc2V0U2VsZWN0ZWRTZXNzaW9uKHNlc3Npb24pXG5cbiAgICAgIC8vIExvZyB0ZWxlcG9ydCBzZXNzaW9uIHNlbGVjdGlvblxuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3RlbGVwb3J0X3Jlc3VtZV9zZXNzaW9uJywge1xuICAgICAgICBzb3VyY2U6XG4gICAgICAgICAgc291cmNlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHNlc3Npb25faWQ6XG4gICAgICAgICAgc2Vzc2lvbi5pZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgfSlcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGVsZXBvcnRSZXN1bWVDb2RlU2Vzc2lvbihzZXNzaW9uLmlkKVxuICAgICAgICAvLyBUcmFjayB0ZWxlcG9ydGVkIHNlc3Npb24gZm9yIHJlbGlhYmlsaXR5IGxvZ2dpbmdcbiAgICAgICAgc2V0VGVsZXBvcnRlZFNlc3Npb25JbmZvKHsgc2Vzc2lvbklkOiBzZXNzaW9uLmlkIH0pXG4gICAgICAgIHNldElzUmVzdW1pbmcoZmFsc2UpXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCB0ZWxlcG9ydEVycm9yOiBUZWxlcG9ydFJlc3VtZUVycm9yID0ge1xuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBlcnIgaW5zdGFuY2VvZiBUZWxlcG9ydE9wZXJhdGlvbkVycm9yXG4gICAgICAgICAgICAgID8gZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgOiBlcnJvck1lc3NhZ2UoZXJyKSxcbiAgICAgICAgICBmb3JtYXR0ZWRNZXNzYWdlOlxuICAgICAgICAgICAgZXJyIGluc3RhbmNlb2YgVGVsZXBvcnRPcGVyYXRpb25FcnJvclxuICAgICAgICAgICAgICA/IGVyci5mb3JtYXR0ZWRNZXNzYWdlXG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGlzT3BlcmF0aW9uRXJyb3I6IGVyciBpbnN0YW5jZW9mIFRlbGVwb3J0T3BlcmF0aW9uRXJyb3IsXG4gICAgICAgIH1cbiAgICAgICAgc2V0RXJyb3IodGVsZXBvcnRFcnJvcilcbiAgICAgICAgc2V0SXNSZXN1bWluZyhmYWxzZSlcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICB9LFxuICAgIFtzb3VyY2VdLFxuICApXG5cbiAgY29uc3QgY2xlYXJFcnJvciA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRFcnJvcihudWxsKVxuICB9LCBbXSlcblxuICByZXR1cm4ge1xuICAgIHJlc3VtZVNlc3Npb24sXG4gICAgaXNSZXN1bWluZyxcbiAgICBlcnJvcixcbiAgICBzZWxlY3RlZFNlc3Npb24sXG4gICAgY2xlYXJFcnJvcixcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsV0FBVyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUM3QyxTQUFTQyx3QkFBd0IsUUFBUSx3QkFBd0I7QUFDakUsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxpQ0FBaUM7QUFDeEMsY0FBY0Msc0JBQXNCLFFBQVEsbUNBQW1DO0FBQy9FLGNBQWNDLFdBQVcsUUFBUSwyQkFBMkI7QUFDNUQsU0FBU0MsWUFBWSxFQUFFQyxzQkFBc0IsUUFBUSxvQkFBb0I7QUFDekUsU0FBU0MseUJBQXlCLFFBQVEsc0JBQXNCO0FBRWhFLE9BQU8sS0FBS0MsbUJBQW1CLEdBQUc7RUFDaENDLE9BQU8sRUFBRSxNQUFNO0VBQ2ZDLGdCQUFnQixDQUFDLEVBQUUsTUFBTTtFQUN6QkMsZ0JBQWdCLEVBQUUsT0FBTztBQUMzQixDQUFDO0FBRUQsT0FBTyxLQUFLQyxjQUFjLEdBQUcsUUFBUSxHQUFHLGNBQWM7QUFFdEQsT0FBTyxT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