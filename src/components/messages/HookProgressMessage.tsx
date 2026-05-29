// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准终端渲染的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js';
// 类型依赖 { buildMessageLookups } 来自 src/utils/messages.js，用于校准终端渲染的数据契约。
import type { buildMessageLookups } from 'src/utils/messages.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  hookEvent: HookEvent;
  lookups: ReturnType<typeof buildMessageLookups>;
  toolUseID: string;
  verbose: boolean;
  isTranscriptMode?: boolean;
};
// HookProgressMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function HookProgressMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(22);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hookEvent,
    lookups,
    toolUseID,
    isTranscriptMode
  } = t0;
  // t1 暂存 `lookups.inProgressHookCounts.get(toolUseID)?.get(hookEven...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== hookEvent || $[1] !== lookups.inProgressHookCounts || $[2] !== toolUseID) {
    // t1 暂存 `lookups.inProgressHookCounts.get(toolUseID)?.get(hookEven...` 生成的渲染片段，后续返回路径直接复用。
    t1 = lookups.inProgressHookCounts.get(toolUseID)?.get(hookEvent) ?? 0;
    // $[0] 缓存 `hookEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = hookEvent;
    // $[1] 缓存 `lookups.inProgressHookCounts`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = lookups.inProgressHookCounts;
    // $[2] 缓存 `toolUseID`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = toolUseID;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // inProgressHookCount 数量沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const inProgressHookCount = t1;
  // resolvedHookCount 数量读取`resolvedHookCounts.get`，供终端渲染后续处理使用。
  const resolvedHookCount = lookups.resolvedHookCounts.get(toolUseID)?.get(hookEvent) ?? 0;
  // 满足 `inProgressHookCount === 0` 时，终端渲染执行该分支。
  if (inProgressHookCount === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `hookEvent === "PreToolUse" || hookEvent === "Post` 满足时，终端渲染才执行该分支。
  if (hookEvent === "PreToolUse" || hookEvent === "PostToolUse") {
    // 满足 `isTranscriptMode` 时，终端渲染执行该分支。
    if (isTranscriptMode) {
      // t2 暂存 `<Text dimColor={true}>{inProgressHookCount} </Text>` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[4] !== inProgressHookCount) {
        // t2 暂存 `<Text dimColor={true}>{inProgressHookCount} </Text>` 生成的渲染片段，后续返回路径直接复用。
        t2 = <Text dimColor={true}>{inProgressHookCount} </Text>;
        // $[4] 缓存 `inProgressHookCount`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = inProgressHookCount;
        // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[5] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[5];
      }
      // t3 暂存 `<Text dimColor={true} bold={true}>{hookEvent}</Text>` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[6] !== hookEvent) {
        // t3 暂存 `<Text dimColor={true} bold={true}>{hookEvent}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t3 = <Text dimColor={true} bold={true}>{hookEvent}</Text>;
        // $[6] 缓存 `hookEvent`，下次依赖未变时 React 编译产物可直接复用。
        $[6] = hookEvent;
        // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[7] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[7];
      }
      // t4标记终端 UI Hook Progress Message是否启用对应路径。
      const t4 = inProgressHookCount === 1 ? " hook" : " hooks";
      // t5 暂存 `<Text dimColor={true}>{t4} ran</Text>` 的派生结果，便于缓存命中时直接复用。
      let t5;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[8] !== t4) {
        // t5 暂存 `<Text dimColor={true}>{t4} ran</Text>` 生成的渲染片段，后续返回路径直接复用。
        t5 = <Text dimColor={true}>{t4} ran</Text>;
        // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
        $[8] = t4;
        // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[9];
      }
      // t6 暂存 `<MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</B...` 的派生结果，便于缓存命中时直接复用。
      let t6;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[10] !== t2 || $[11] !== t3 || $[12] !== t5) {
        // t6 暂存 `<MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</B...` 生成的渲染片段，后续返回路径直接复用。
        t6 = <MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</Box></MessageResponse>;
        // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = t2;
        // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[11] = t3;
        // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[12] = t5;
        // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
        $[13] = t6;
      } else {
        // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
        t6 = $[13];
      }
      // 返回 `t6`，作为终端渲染这次计算的结果。
      return t6;
    }
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `resolvedHookCount === inProgressHookCount` 时，终端渲染执行该分支。
  if (resolvedHookCount === inProgressHookCount) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t2 暂存 `<Text dimColor={true}>Running </Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text dimColor={true}>Running </Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>Running </Text>;
    // $[14] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[14];
  }
  // t3 暂存 `<Text dimColor={true} bold={true}>{hookEvent}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== hookEvent) {
    // t3 暂存 `<Text dimColor={true} bold={true}>{hookEvent}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true} bold={true}>{hookEvent}</Text>;
    // $[15] 缓存 `hookEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = hookEvent;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[16];
  }
  // t4标记终端 UI Hook Progress Message是否启用对应路径。
  const t4 = inProgressHookCount === 1 ? " hook\u2026" : " hooks\u2026";
  // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t4) {
    // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true}>{t4}</Text>;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[18];
  }
  // t6 暂存 `<MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</B...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t3 || $[20] !== t5) {
    // t6 暂存 `<MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</B...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <MessageResponse><Box flexDirection="row">{t2}{t3}{t5}</Box></MessageResponse>;
    // $[19] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t3;
    // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t5;
    // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[21];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkhvb2tFdmVudCIsImJ1aWxkTWVzc2FnZUxvb2t1cHMiLCJCb3giLCJUZXh0IiwiTWVzc2FnZVJlc3BvbnNlIiwiUHJvcHMiLCJob29rRXZlbnQiLCJsb29rdXBzIiwiUmV0dXJuVHlwZSIsInRvb2xVc2VJRCIsInZlcmJvc2UiLCJpc1RyYW5zY3JpcHRNb2RlIiwiSG9va1Byb2dyZXNzTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJpblByb2dyZXNzSG9va0NvdW50cyIsImdldCIsImluUHJvZ3Jlc3NIb29rQ291bnQiLCJyZXNvbHZlZEhvb2tDb3VudCIsInJlc29sdmVkSG9va0NvdW50cyIsInQyIiwidDMiLCJ0NCIsInQ1IiwidDYiLCJTeW1ib2wiLCJmb3IiXSwic291cmNlcyI6WyJIb29rUHJvZ3Jlc3NNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgSG9va0V2ZW50IH0gZnJvbSAnc3JjL2VudHJ5cG9pbnRzL2FnZW50U2RrVHlwZXMuanMnXG5pbXBvcnQgdHlwZSB7IGJ1aWxkTWVzc2FnZUxvb2t1cHMgfSBmcm9tICdzcmMvdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGhvb2tFdmVudDogSG9va0V2ZW50XG4gIGxvb2t1cHM6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkTWVzc2FnZUxvb2t1cHM+XG4gIHRvb2xVc2VJRDogc3RyaW5nXG4gIHZlcmJvc2U6IGJvb2xlYW5cbiAgaXNUcmFuc2NyaXB0TW9kZT86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEhvb2tQcm9ncmVzc01lc3NhZ2Uoe1xuICBob29rRXZlbnQsXG4gIGxvb2t1cHMsXG4gIHRvb2xVc2VJRCxcbiAgaXNUcmFuc2NyaXB0TW9kZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaW5Qcm9ncmVzc0hvb2tDb3VudCA9XG4gICAgbG9va3Vwcy5pblByb2dyZXNzSG9va0NvdW50cy5nZXQodG9vbFVzZUlEKT8uZ2V0KGhvb2tFdmVudCkgPz8gMFxuICBjb25zdCByZXNvbHZlZEhvb2tDb3VudCA9XG4gICAgbG9va3Vwcy5yZXNvbHZlZEhvb2tDb3VudHMuZ2V0KHRvb2xVc2VJRCk/LmdldChob29rRXZlbnQpID8/IDBcbiAgaWYgKGluUHJvZ3Jlc3NIb29rQ291bnQgPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKGhvb2tFdmVudCA9PT0gJ1ByZVRvb2xVc2UnIHx8IGhvb2tFdmVudCA9PT0gJ1Bvc3RUb29sVXNlJykge1xuICAgIC8vIEluIHRyYW5zY3JpcHQgbW9kZSwgc2hvdyBhIHN0YXRpYyBzdW1tYXJ5IHNpbmNlIG1lc3NhZ2VzIG5ldmVyIHJlLXJlbmRlclxuICAgIC8vIChzbyBhIHRyYW5zaWVudCBcIlJ1bm5pbmcuLi5cIiB3b3VsZCBnZXQgc3R1Y2spLlxuICAgIGlmIChpc1RyYW5zY3JpcHRNb2RlKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2luUHJvZ3Jlc3NIb29rQ291bnR9IDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIGJvbGQ+XG4gICAgICAgICAgICAgIHtob29rRXZlbnR9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAge2luUHJvZ3Jlc3NIb29rQ291bnQgPT09IDEgPyAnIGhvb2snIDogJyBob29rcyd9IHJhblxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9XG4gICAgLy8gT3V0c2lkZSB0cmFuc2NyaXB0IG1vZGUsIGhpZGUg4oCUIGNvbXBsZXRpb24gaW5mbyBpcyBzaG93biB2aWFcbiAgICAvLyBhc3luY19ob29rX3Jlc3BvbnNlIGF0dGFjaG1lbnRzIGluc3RlYWQuXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmIChyZXNvbHZlZEhvb2tDb3VudCA9PT0gaW5Qcm9ncmVzc0hvb2tDb3VudCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+UnVubmluZyA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yIGJvbGQ+XG4gICAgICAgICAge2hvb2tFdmVudH1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57aW5Qcm9ncmVzc0hvb2tDb3VudCA9PT0gMSA/ICcgaG9va+KApicgOiAnIGhvb2tz4oCmJ308L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUFjQyxTQUFTLFFBQVEsa0NBQWtDO0FBQ2pFLGNBQWNDLG1CQUFtQixRQUFRLHVCQUF1QjtBQUNoRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7QUFFdkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFNBQVMsRUFBRU4sU0FBUztFQUNwQk8sT0FBTyxFQUFFQyxVQUFVLENBQUMsT0FBT1AsbUJBQW1CLENBQUM7RUFDL0NRLFNBQVMsRUFBRSxNQUFNO0VBQ2pCQyxPQUFPLEVB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QTtNQUFBO01BQUEsT0FWbEJZLEVBVWtCO0lBQUE7SUFFckIsT0FHTSxJQUFJO0VBQUE7RUFHYixJQUFJTixpQkFBaUIsS0FBS0QsbUJBQW1CO0lBQUEsT0FDcEMsSUFBSTtFQUFBO0VBQ1osSUFBQUcsRUFBQTtFQUFBLElBQUFSLENBQUEsU0FBQWEsTUFBQSxDQUFBQyxHQUFBO0lBS0tOLEVBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLFFBQVEsRUFBdEIsSUFBSSxDQUF5QjtJQUFBUixDQUFBLE9BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLElBQUFTLEVBQUE7RUFBQSxJQUFBVCxDQUFBLFNBQUFSLFNBQUE7SUFDOUJpQixFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQ2hCakIsVUFBUSxDQUNYLEVBRkMsSUFBSSxDQUVFO0lBQUFRLENBQUEsT0FBQVIsU0FBQTtJQUFBUSxDQUFBLE9BQUFTLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFULENBQUE7RUFBQTtFQUNTLE1BQUFVLEVBQUEsR0FBQUwsbUJBQW1CLEtBQUssQ0FBd0IsR0FBaEQsYUFBZ0QsR0FBaEQsY0FBZ0Q7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxTQUFBVSxFQUFBO0lBQWhFQyxFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBRSxDQUFBRCxFQUErQyxDQUFFLEVBQWhFLElBQUksQ0FBbUU7SUFBQVYsQ0FBQSxPQUFBVSxFQUFBO0lBQUFWLENBQUEsT0FBQVcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVgsQ0FBQTtFQUFBO0VBQUEsSUFBQVksRUFBQTtFQUFBLElBQUFaLENBQUEsU0FBQVMsRUFBQSxJQUFBVCxDQUFBLFNBQUFXLEVBQUE7SUFONUVDLEVBQUEsSUFBQyxlQUFlLENBQ2QsQ0FBQyxHQUFHLENBQWUsYUFBSyxDQUFMLEtBQUssQ0FDdEIsQ0FBQUosRUFBNkIsQ0FDN0IsQ0FBQUMsRUFFTSxDQUNOLENBQUFFLEVBQXVFLENBQ3pFLEVBTkMsR0FBRyxDQU9OLEVBUkMsZUFBZSxDQVFFO0lBQUFYLENBQUEsT0FBQVMsRUFBQTtJQUFBVCxDQUFBLE9BQUFXLEVBQUE7SUFBQVgsQ0FBQSxPQUFBWSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWixDQUFBO0VBQUE7RUFBQSxPQVJsQlksRUFRa0I7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==