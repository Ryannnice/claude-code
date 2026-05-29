// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect } from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 类型依赖 { TeleportRemoteResponse } 来自 src/utils/conversationRecovery.js，用于校准终端渲染的数据契约。
import type { TeleportRemoteResponse } from 'src/utils/conversationRecovery.js';
// 类型依赖 { CodeSession } 来自 src/utils/teleport/api.js，用于校准终端渲染的数据契约。
import type { CodeSession } from 'src/utils/teleport/api.js';
// 引入 TeleportSource、useTeleportResume，将 ../hooks/useTeleportResume.js 中已经封装好的能力接到本文件流程里。
import { type TeleportSource, useTeleportResume } from '../hooks/useTeleportResume.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 ResumeTask，将 ./ResumeTask.js 中已经封装好的能力接到本文件流程里。
import { ResumeTask } from './ResumeTask.js';
// 引入 Spinner，将 ./Spinner.js 中已经封装好的能力接到本文件流程里。
import { Spinner } from './Spinner.js';
// TeleportResumeWrapperProps 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface TeleportResumeWrapperProps {
  // 这个回调绑定到 onComplete: (result: TeleportRemoteResponse) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (result: TeleportRemoteResponse) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  onError?: (error: string, formattedMessage?: string) => void;
  isEmbedded?: boolean;
  source: TeleportSource;
}

/**
 * Wrapper component that manages the full teleport resume flow,
 * including session selection, loading state, and error handling
 */
// TeleportResumeWrapper 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeleportResumeWrapper(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete,
    onCancel,
    onError,
    isEmbedded: t1,
    source
  } = t0;
  // isEmbedded标记终端 UI Teleport Resume Wrap...是否启用对应路径。
  const isEmbedded = t1 === undefined ? false : t1;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    resumeSession,
    isResuming,
    error,
    selectedSession
  } = useTeleportResume(source);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[source]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== source) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_teleport_started", {
        source: source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
    };
    // t3 暂存 `[source]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [source];
    // $[0] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = source;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `async session => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== error || $[4] !== onComplete || $[5] !== onError || $[6] !== resumeSession) {
    // t4 暂存 `async session => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = async session => {
      // 结果保存`resumeSession`，供终端渲染后续处理使用。
      const result = await resumeSession(session);
      // 满足 `result` 时，终端渲染执行该分支。
      if (result) {
        // 调用 onComplete，触发终端渲染此处需要的副作用。
        onComplete(result);
      } else {
        // 满足 `error` 时，终端渲染执行该分支。
        if (error) {
          // 满足 `onError` 时，终端渲染执行该分支。
          if (onError) {
            // 调用 onError，触发终端渲染此处需要的副作用。
            onError(error.message, error.formattedMessage);
          }
        }
      }
    };
    // $[3] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = error;
    // $[4] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onComplete;
    // $[5] 缓存 `onError`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onError;
    // $[6] 缓存 `resumeSession`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = resumeSession;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // handleSelect 命名 `t4`，让后续代码直接表达这个值的用途。
  const handleSelect = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== onCancel) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_teleport_cancelled", {});
      // 调用 onCancel，触发终端渲染此处需要的副作用。
      onCancel();
    };
    // $[8] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onCancel;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // handleCancel 命名 `t5`，让后续代码直接表达这个值的用途。
  const handleCancel = t5;
  // t6标记终端 UI Teleport Resume Wrap...是否启用对应路径。
  const t6 = !!error && !onError;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t6) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Global",
      isActive: t6
    };
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("app:interrupt", handleCancel, t7);
  // 只有 `isResuming && selectedSession` 满足时，终端渲染才执行该分支。
  if (isResuming && selectedSession) {
    // t8 暂存 `<Box flexDirection="row"><Spinner /><Text bold={true}>Res...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `<Box flexDirection="row"><Spinner /><Text bold={true}>Res...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Box flexDirection="row"><Spinner /><Text bold={true}>Resuming session…</Text></Box>;
      // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[12];
    }
    // t9 暂存 `<Box flexDirection="column" padding={1}>{t8}<Text dimColo...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== selectedSession.title) {
      // t9 暂存 `<Box flexDirection="column" padding={1}>{t8}<Text dimColo...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Box flexDirection="column" padding={1}>{t8}<Text dimColor={true}>Loading "{selectedSession.title}"…</Text></Box>;
      // $[13] 缓存 `selectedSession.title`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = selectedSession.title;
      // $[14] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[14];
    }
    // 返回 `t9`，作为终端渲染这次计算的结果。
    return t9;
  }
  // 只有 `error && !onError` 满足时，终端渲染才执行该分支。
  if (error && !onError) {
    // t8 暂存 `<Text bold={true} color="error">Failed to resume session<...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `<Text bold={true} color="error">Failed to resume session<...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text bold={true} color="error">Failed to resume session</Text>;
      // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[15];
    }
    // t9 暂存 `<Text dimColor={true}>{error.message}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== error.message) {
      // t9 暂存 `<Text dimColor={true}>{error.message}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text dimColor={true}>{error.message}</Text>;
      // $[16] 缓存 `error.message`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = error.message;
      // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[17];
    }
    // t10 暂存 `<Box marginTop={1}><Text dimColor={true}>Press <Text bold...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Box marginTop={1}><Text dimColor={true}>Press <Text bold...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Box marginTop={1}><Text dimColor={true}>Press <Text bold={true}>Esc</Text> to cancel</Text></Box>;
      // $[18] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[18];
    }
    // t11 暂存 `<Box flexDirection="column" padding={1}>{t8}{t9}{t10}</Bo...` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== t9) {
      // t11 暂存 `<Box flexDirection="column" padding={1}>{t8}{t9}{t10}</Bo...` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Box flexDirection="column" padding={1}>{t8}{t9}{t10}</Box>;
      // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t9;
      // $[20] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[20];
    }
    // 返回 `t11`，作为终端渲染这次计算的结果。
    return t11;
  }
  // t8 暂存 `<ResumeTask onSelect={handleSelect} onCancel={handleCance...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== handleCancel || $[22] !== handleSelect || $[23] !== isEmbedded) {
    // t8 暂存 `<ResumeTask onSelect={handleSelect} onCancel={handleCance...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <ResumeTask onSelect={handleSelect} onCancel={handleCancel} isEmbedded={isEmbedded} />;
    // $[21] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = handleCancel;
    // $[22] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = handleSelect;
    // $[23] 缓存 `isEmbedded`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = isEmbedded;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[24];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsIlRlbGVwb3J0UmVtb3RlUmVzcG9uc2UiLCJDb2RlU2Vzc2lvbiIsIlRlbGVwb3J0U291cmNlIiwidXNlVGVsZXBvcnRSZXN1bWUiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsIlJlc3VtZVRhc2siLCJTcGlubmVyIiwiVGVsZXBvcnRSZXN1bWVXcmFwcGVyUHJvcHMiLCJvbkNvbXBsZXRlIiwicmVzdWx0Iiwib25DYW5jZWwiLCJvbkVycm9yIiwiZXJyb3IiLCJmb3JtYXR0ZWRNZXNzYWdlIiwiaXNFbWJlZGRlZCIsInNvdXJjZSIsIlRlbGVwb3J0UmVzdW1lV3JhcHBlciIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJyZXN1bWVTZXNzaW9uIiwiaXNSZXN1bWluZyIsInNlbGVjdGVkU2Vzc2lvbiIsInQyIiwidDMiLCJ0NCIsInNlc3Npb24iLCJtZXNzYWdlIiwiaGFuZGxlU2VsZWN0IiwidDUiLCJoYW5kbGVDYW5jZWwiLCJ0NiIsInQ3IiwiY29udGV4dCIsImlzQWN0aXZlIiwidDgiLCJTeW1ib2wiLCJmb3IiLCJ0OSIsInRpdGxlIiwidDEwIiwidDExIl0sInNvdXJjZXMiOlsiVGVsZXBvcnRSZXN1bWVXcmFwcGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICB0eXBlIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gIGxvZ0V2ZW50LFxufSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHR5cGUgeyBUZWxlcG9ydFJlbW90ZVJlc3BvbnNlIH0gZnJvbSAnc3JjL3V0aWxzL2NvbnZlcnNhdGlvblJlY292ZXJ5LmpzJ1xuaW1wb3J0IHR5cGUgeyBDb2RlU2Vzc2lvbiB9IGZyb20gJ3NyYy91dGlscy90ZWxlcG9ydC9hcGkuanMnXG5pbXBvcnQge1xuICB0eXBlIFRlbGVwb3J0U291cmNlLFxuICB1c2VUZWxlcG9ydFJlc3VtZSxcbn0gZnJvbSAnLi4vaG9va3MvdXNlVGVsZXBvcnRSZXN1bWUuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IFJlc3VtZVRhc2sgfSBmcm9tICcuL1Jlc3VtZVRhc2suanMnXG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi9TcGlubmVyLmpzJ1xuXG5pbnRlcmZhY2UgVGVsZXBvcnRSZXN1bWVXcmFwcGVyUHJvcHMge1xuICBvbkNvbXBsZXRlOiAocmVzdWx0OiBUZWxlcG9ydFJlbW90ZVJlc3BvbnNlKSA9PiB2b2lkXG4gIG9uQ2FuY2VsOiAoKSA9PiB2b2lkXG4gIG9uRXJyb3I/OiAoZXJyb3I6IHN0cmluZywgZm9ybWF0dGVkTWVzc2FnZT86IHN0cmluZykgPT4gdm9pZFxuICBpc0VtYmVkZGVkPzogYm9vbGVhblxuICBzb3VyY2U6IFRlbGVwb3J0U291cmNlXG59XG5cbi8qKlxuICogV3JhcHBlciBjb21wb25lbnQgdGhhdCBtYW5hZ2VzIHRoZSBmdWxsIHRlbGVwb3J0IHJlc3VtZSBmbG93LFxuICogaW5jbHVkaW5nIHNlc3Npb24gc2VsZWN0aW9uLCBsb2FkaW5nIHN0YXRlLCBhbmQgZXJyb3IgaGFuZGxpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFRlbGVwb3J0UmVzdW1lV3JhcHBlcih7XG4gIG9uQ29tcGxldGUsXG4gIG9uQ2FuY2VsLFxuICBvbkVycm9yLFxuICBpc0VtYmVkZGVkID0gZmFsc2UsXG4gIHNvdXJjZSxcbn06IFRlbGVwb3J0UmVzdW1lV3JhcHBlclByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyByZXN1bWVTZXNzaW9uLCBpc1Jlc3VtaW5nLCBlcnJvciwgc2VsZWN0ZWRTZXNzaW9uIH0gPVxuICAgIHVzZVRlbGVwb3J0UmVzdW1lKHNvdXJjZSlcblxuICAvLyBMb2cgd2hlbiB0ZWxlcG9ydCBmbG93IHN0YXJ0cyAoZm9yIGZ1bm5lbCB0cmFja2luZylcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsb2dFdmVudCgndGVuZ3VfdGVsZXBvcnRfc3RhcnRlZCcsIHtcbiAgICAgIHNvdXJjZTpcbiAgICAgICAgc291cmNlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgfSlcbiAgfSwgW3NvdXJjZV0pXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gYXN5bmMgKHNlc3Npb246IENvZGVTZXNzaW9uKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdW1lU2Vzc2lvbihzZXNzaW9uKVxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIG9uQ29tcGxldGUocmVzdWx0KVxuICAgIH0gZWxzZSBpZiAoZXJyb3IpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3MgYW4gZXJyb3IgaGFuZGxlciBwcm92aWRlZCwgdXNlIGl0XG4gICAgICBpZiAob25FcnJvcikge1xuICAgICAgICBvbkVycm9yKGVycm9yLm1lc3NhZ2UsIGVycm9yLmZvcm1hdHRlZE1lc3NhZ2UpXG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2UgdGhlIGVycm9yIHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBVSVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNhbmNlbCA9ICgpID0+IHtcbiAgICBsb2dFdmVudCgndGVuZ3VfdGVsZXBvcnRfY2FuY2VsbGVkJywge30pXG4gICAgb25DYW5jZWwoKVxuICB9XG5cbiAgLy8gQWxsb3cgRXNjIHRvIGRpc21pc3MgdGhlIGVycm9yIHN0YXRlXG4gIHVzZUtleWJpbmRpbmcoJ2FwcDppbnRlcnJ1cHQnLCBoYW5kbGVDYW5jZWwsIHtcbiAgICBjb250ZXh0OiAnR2xvYmFsJyxcbiAgICBpc0FjdGl2ZTogISFlcnJvciAmJiAhb25FcnJvcixcbiAgfSlcblxuICAvLyBTaG93IGxvYWRpbmcgc3Bpbm5lciB3aGVuIHJlc3VtaW5nXG4gIGlmIChpc1Jlc3VtaW5nICYmIHNlbGVjdGVkU2Vzc2lvbikge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nPXsxfT5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICA8VGV4dCBib2xkPlJlc3VtaW5nIHNlc3Npb27igKY8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5Mb2FkaW5nICZxdW90O3tzZWxlY3RlZFNlc3Npb24udGl0bGV9JnF1b3Q74oCmPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgLy8gU2hvdyBlcnJvciBpZiB0aGVyZSB3YXMgYSBwcm9ibGVtIHJlc3VtaW5nXG4gIGlmIChlcnJvciAmJiAhb25FcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nPXsxfT5cbiAgICAgICAgPFRleHQgYm9sZCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgRmFpbGVkIHRvIHJlc3VtZSBzZXNzaW9uXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+e2Vycm9yLm1lc3NhZ2V9PC9UZXh0PlxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBQcmVzcyA8VGV4dCBib2xkPkVzYzwvVGV4dD4gdG8gY2FuY2VsXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFJlc3VtZVRhc2tcbiAgICAgIG9uU2VsZWN0PXtoYW5kbGVTZWxlY3R9XG4gICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsfVxuICAgICAgaXNFbWJlZGRlZD17aXNFbWJlZGRlZH1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLFNBQVMsUUFBUSxPQUFPO0FBQ3hDLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsaUNBQWlDO0FBQ3hDLGNBQWNDLHNCQUFzQixRQUFRLG1DQUFtQztBQUMvRSxjQUFjQyxXQUFXLFFBQVEsMkJBQTJCO0FBQzVELFNBQ0UsS0FBS0MsY0FBYyxFQUNuQkMsaUJBQWlCLFFBQ1osK0JBQStCO0FBQ3RDLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsYUFBYSxRQUFRLGlDQUFpQztBQUMvRCxTQUFTQyxVQUFVLFFBQVEsaUJBQWlCO0FBQzVDLFNBQVNDLE9BQU8sUUFBUSxjQUFjO0FBRXRDLFVBQVVDLDBCQUEwQixDQUFDO0VBQ25DQyxVQUFVLEVBQUUsQ0FBQ0MsTUFBTSxFQUFFWCxzQkFBc0IsRUFBRSxHQUFHLElBQUk7RUFDcERZLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNwQkMsT0FBTyxDQUFDLEVBQUUsQ0FBQ0MsS0FBSyxFQUFFLE1BQU0sRUFBRUMsZ0JBQXlCLENBQVIsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQzVEQyxVQUFVLENBQUMsRUFBRSxPQUFPO0VBQ3BCQyxNQUFNLEVBQUVmLGNBQWM7QUFDeEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFnQixzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBWCxVQUFBO0lBQUFFLFFBQUE7SUFBQUMsT0FBQTtJQUFBRyxVQUFBLEVBQUFNLEVB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