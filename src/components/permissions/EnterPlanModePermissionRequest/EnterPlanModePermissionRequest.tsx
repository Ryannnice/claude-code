// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 handlePlanModeTransition，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { handlePlanModeTransition } from '../../../bootstrap/state.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../../services/analytics/index.js';
// 引入 useAppState，将 ../../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../../state/AppState.js';
// 复用 isPlanModeInterviewPhaseEnabled 工具函数，把通用处理留在 ../../../utils/planModeV2.js 中维护。
import { isPlanModeInterviewPhaseEnabled } from '../../../utils/planModeV2.js';
// 引入 Select，将 ../../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../CustomSelect/index.js';
// 引入 PermissionDialog，将 ../PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../PermissionDialog.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// EnterPlanModePermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function EnterPlanModePermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    onDone,
    onReject,
    workerBadge
  } = t0;
  // toolPermissionContextMode 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContextMode = useAppState(_temp);
  // t1 暂存 `function handleResponse(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== onReject || $[2] !== toolPermissionContextMode || $[3] !== toolUseConfirm) {
    // t1 暂存 `function handleResponse(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function handleResponse(value) {
      // 当 `value` 匹配 `"yes"` 时，终端渲染执行对应分支。
      if (value === "yes") {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_plan_enter", {
          interviewPhaseEnabled: isPlanModeInterviewPhaseEnabled(),
          entryMethod: "tool" as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
        });
        // 调用 handlePlanModeTransition，触发终端渲染此处需要的副作用。
        handlePlanModeTransition(toolPermissionContextMode, "plan");
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
        // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
        toolUseConfirm.onAllow({}, [{
          type: "setMode",
          mode: "plan",
          destination: "session"
        }]);
      } else {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
        // 调用 onReject，触发终端渲染此处需要的副作用。
        onReject();
        // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
        toolUseConfirm.onReject();
      }
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onReject;
    // $[2] 缓存 `toolPermissionContextMode`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = toolPermissionContextMode;
    // $[3] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = toolUseConfirm;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // handleResponse 响应数据 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleResponse = t1;
  // t2 暂存 `<Text>Claude wants to enter plan mode to explore and desi...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text>Claude wants to enter plan mode to explore and desi...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>Claude wants to enter plan mode to explore and design an implementation approach.</Text>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `<Box marginTop={1} flexDirection="column"><Text dimColor=...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box marginTop={1} flexDirection="column"><Text dimColor=...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginTop={1} flexDirection="column"><Text dimColor={true}>In plan mode, Claude will:</Text><Text dimColor={true}> · Explore the codebase thoroughly</Text><Text dimColor={true}> · Identify existing patterns</Text><Text dimColor={true}> · Design an implementation strategy</Text><Text dimColor={true}> · Present a plan for your approval</Text></Box>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box marginTop={1}><Text dimColor={true}>No code changes ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box marginTop={1}><Text dimColor={true}>No code changes ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginTop={1}><Text dimColor={true}>No code changes will be made until you approve the plan.</Text></Box>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      label: "Yes, enter plan mode",
      value: "yes" as const
    };
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `[t5, {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `[t5, {` 生成的渲染片段，后续返回路径直接复用。
    t6 = [t5, {
      label: "No, start implementing now",
      value: "no" as const
    }];
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `() => handleResponse("no")` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== handleResponse) {
    // t7 暂存 `() => handleResponse("no")` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => handleResponse("no");
    // $[10] 缓存 `handleResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleResponse;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // t8 暂存 `<Box flexDirection="column" marginTop={1} paddingX={1}>{t...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== handleResponse || $[13] !== t7) {
    // t8 暂存 `<Box flexDirection="column" marginTop={1} paddingX={1}>{t...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" marginTop={1} paddingX={1}>{t2}{t3}{t4}<Box marginTop={1}><Select options={t6} onChange={handleResponse} onCancel={t7} /></Box></Box>;
    // $[12] 缓存 `handleResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = handleResponse;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t9 暂存 `<PermissionDialog color="planMode" title="Enter plan mode...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== t8 || $[16] !== workerBadge) {
    // t9 暂存 `<PermissionDialog color="planMode" title="Enter plan mode...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <PermissionDialog color="planMode" title="Enter plan mode?" workerBadge={workerBadge}>{t8}</PermissionDialog>;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
    // $[16] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = workerBadge;
    // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[17];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.toolPermissionContext.mode`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext.mode;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImhhbmRsZVBsYW5Nb2RlVHJhbnNpdGlvbiIsIkJveCIsIlRleHQiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJ1c2VBcHBTdGF0ZSIsImlzUGxhbk1vZGVJbnRlcnZpZXdQaGFzZUVuYWJsZWQiLCJTZWxlY3QiLCJQZXJtaXNzaW9uRGlhbG9nIiwiUGVybWlzc2lvblJlcXVlc3RQcm9wcyIsIkVudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdCIsInQwIiwiJCIsIl9jIiwidG9vbFVzZUNvbmZpcm0iLCJvbkRvbmUiLCJvblJlamVjdCIsIndvcmtlckJhZGdlIiwidG9vbFBlcm1pc3Npb25Db250ZXh0TW9kZSIsIl90ZW1wIiwidDEiLCJoYW5kbGVSZXNwb25zZSIsInZhbHVlIiwiaW50ZXJ2aWV3UGhhc2VFbmFibGVkIiwiZW50cnlNZXRob2QiLCJvbkFsbG93IiwidHlwZSIsIm1vZGUiLCJkZXN0aW5hdGlvbiIsInQyIiwiU3ltYm9sIiwiZm9yIiwidDMiLCJ0NCIsInQ1IiwibGFiZWwiLCJjb25zdCIsInQ2IiwidDciLCJ0OCIsInQ5IiwicyIsInRvb2xQZXJtaXNzaW9uQ29udGV4dCJdLCJzb3VyY2VzIjpbIkVudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgaGFuZGxlUGxhbk1vZGVUcmFuc2l0aW9uIH0gZnJvbSAnLi4vLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGlzUGxhbk1vZGVJbnRlcnZpZXdQaGFzZUVuYWJsZWQgfSBmcm9tICcuLi8uLi8uLi91dGlscy9wbGFuTW9kZVYyLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4uL1Blcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgfSBmcm9tICcuLi9QZXJtaXNzaW9uUmVxdWVzdC5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIEVudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdCh7XG4gIHRvb2xVc2VDb25maXJtLFxuICBvbkRvbmUsXG4gIG9uUmVqZWN0LFxuICB3b3JrZXJCYWRnZSxcbn06IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0b29sUGVybWlzc2lvbkNvbnRleHRNb2RlID0gdXNlQXBwU3RhdGUoXG4gICAgcyA9PiBzLnRvb2xQZXJtaXNzaW9uQ29udGV4dC5tb2RlLFxuICApXG5cbiAgZnVuY3Rpb24gaGFuZGxlUmVzcG9uc2UodmFsdWU6ICd5ZXMnIHwgJ25vJyk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSA9PT0gJ3llcycpIHtcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9wbGFuX2VudGVyJywge1xuICAgICAgICBpbnRlcnZpZXdQaGFzZUVuYWJsZWQ6IGlzUGxhbk1vZGVJbnRlcnZpZXdQaGFzZUVuYWJsZWQoKSxcbiAgICAgICAgZW50cnlNZXRob2Q6XG4gICAgICAgICAgJ3Rvb2wnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB9KVxuICAgICAgaGFuZGxlUGxhbk1vZGVUcmFuc2l0aW9uKHRvb2xQZXJtaXNzaW9uQ29udGV4dE1vZGUsICdwbGFuJylcbiAgICAgIG9uRG9uZSgpXG4gICAgICB0b29sVXNlQ29uZmlybS5vbkFsbG93KHt9LCBbXG4gICAgICAgIHsgdHlwZTogJ3NldE1vZGUnLCBtb2RlOiAncGxhbicsIGRlc3RpbmF0aW9uOiAnc2Vzc2lvbicgfSxcbiAgICAgIF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIG9uRG9uZSgpXG4gICAgICBvblJlamVjdCgpXG4gICAgICB0b29sVXNlQ29uZmlybS5vblJlamVjdCgpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZ1xuICAgICAgY29sb3I9XCJwbGFuTW9kZVwiXG4gICAgICB0aXRsZT1cIkVudGVyIHBsYW4gbW9kZT9cIlxuICAgICAgd29ya2VyQmFkZ2U9e3dvcmtlckJhZGdlfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0gcGFkZGluZ1g9ezF9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBDbGF1ZGUgd2FudHMgdG8gZW50ZXIgcGxhbiBtb2RlIHRvIGV4cGxvcmUgYW5kIGRlc2lnbiBhblxuICAgICAgICAgIGltcGxlbWVudGF0aW9uIGFwcHJvYWNoLlxuICAgICAgICA8L1RleHQ+XG5cbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5JbiBwbGFuIG1vZGUsIENsYXVkZSB3aWxsOjwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgRXhwbG9yZSB0aGUgY29kZWJhc2UgdGhvcm91Z2hseTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgSWRlbnRpZnkgZXhpc3RpbmcgcGF0dGVybnM8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+IMK3IERlc2lnbiBhbiBpbXBsZW1lbnRhdGlvbiBzdHJhdGVneTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgUHJlc2VudCBhIHBsYW4gZm9yIHlvdXIgYXBwcm92YWw8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIE5vIGNvZGUgY2hhbmdlcyB3aWxsIGJlIG1hZGUgdW50aWwgeW91IGFwcHJvdmUgdGhlIHBsYW4uXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cblxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgICAgICB7IGxhYmVsOiAnWWVzLCBlbnRlciBwbGFuIG1vZGUnLCB2YWx1ZTogJ3llcycgYXMgY29uc3QgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ05vLCBzdGFydCBpbXBsZW1lbnRpbmcgbm93JywgdmFsdWU6ICdubycgYXMgY29uc3QgfSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlUmVzcG9uc2V9XG4gICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gaGFuZGxlUmVzcG9uc2UoJ25vJyl9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L1Blcm1pc3Npb25EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLHdCQUF3QixRQUFRLDZCQUE2QjtBQUN0RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxzQ0FBc0M7QUFDN0MsU0FBU0MsV0FBVyxRQUFR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