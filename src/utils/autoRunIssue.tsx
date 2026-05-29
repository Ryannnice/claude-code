// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react';
// 复用 KeyboardShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardShortcutHint } from '../components/design-system/KeyboardShortcutHint.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// Props 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onRun: () => void;，负责共享工具在该局部场景下的响应。
  onRun: () => void;
  // 这个回调绑定到 onCancel: () => void;，负责共享工具在该局部场景下的响应。
  onCancel: () => void;
  reason: string;
};

/**
 * Component that shows a notification about running /issue command
 * with the ability to cancel via ESC key
 */
// AutoRunIssueNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AutoRunIssueNotification(t0) {
  // $保存`_c`，供共享工具后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onRun,
    onCancel,
    reason
  } = t0;
  // hasRunRef 引用记录 `useRef` 是否成立，共享工具随后按该结果分支。
  const hasRunRef = useRef(false);
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      context: "Confirmation"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发共享工具此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[onRun]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onRun) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // hasRunRef.current缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!hasRunRef.current) {
        // current更新为 `true`，确保共享工具后续读取最新状态。
        hasRunRef.current = true;
        // 调用 onRun，触发共享工具此处需要的副作用。
        onRun();
      }
    };
    // t3 暂存 `[onRun]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [onRun];
    // $[1] 缓存 `onRun`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onRun;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useEffect，触发共享工具此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `<Box><Text bold={true}>Running feedback capture...</Text>...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box><Text bold={true}>Running feedback capture...</Text>...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box><Text bold={true}>Running feedback capture...</Text></Box>;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Box><Text dimColor={true}>Press <KeyboardShortcutHint sh...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box><Text dimColor={true}>Press <KeyboardShortcutHint sh...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box><Text dimColor={true}>Press <KeyboardShortcutHint shortcut="Esc" action="cancel" /> anytime</Text></Box>;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}<Box><T...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== reason) {
    // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}<Box><T...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginTop={1}>{t4}{t5}<Box><Text dimColor={true}>Reason: {reason}</Text></Box></Box>;
    // $[6] 缓存 `reason`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = reason;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // 返回 `t6`，作为共享工具这次计算的结果。
  return t6;
}
// AutoRunIssueReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoRunIssueReason = 'feedback_survey_bad' | 'feedback_survey_good';

/**
 * Determines if /issue should auto-run for Ant users
 */
// shouldAutoRunIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAutoRunIssue(reason: AutoRunIssueReason): boolean {
  // Only for Ant users
  // `"external"` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if ("external" !== 'ant') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 按照 reason 的取值选择共享工具的具体处理分支。
  switch (reason) {
    case 'feedback_survey_bad':
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    case 'feedback_survey_good':
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
  }
}

/**
 * Returns the appropriate command to auto-run based on the reason
 * ANT-ONLY: good-claude command only exists in ant builds
 */
// getAutoRunCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoRunCommand(reason: AutoRunIssueReason): string {
  // Only ant builds have the /good-claude command
  // 只有 `"external" === 'ant' && reason === 'feedback_surv` 满足时，共享工具才执行该分支。
  if ("external" === 'ant' && reason === 'feedback_survey_good') {
    // 返回 `'/good-claude'`，作为共享工具这次计算的结果。
    return '/good-claude';
  }
  // 返回 `'/issue'`，作为共享工具这次计算的结果。
  return '/issue';
}

/**
 * Gets a human-readable description of why /issue is being auto-run
 */
// getAutoRunIssueReasonText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoRunIssueReasonText(reason: AutoRunIssueReason): string {
  // 按照 reason 的取值选择共享工具的具体处理分支。
  switch (reason) {
    case 'feedback_survey_bad':
      // 返回 `'You responded "Bad" to the feedback survey'`，作为共享工具这次计算的结果。
      return 'You responded "Bad" to the feedback survey';
    case 'feedback_survey_good':
      // 返回 `'You responded "Good" to the feedback survey'`，作为共享工具这次计算的结果。
      return 'You responded "Good" to the feedback survey';
    default:
      // 返回 `'Unknown reason'`，作为共享工具这次计算的结果。
      return 'Unknown reason';
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJQcm9wcyIsIm9uUnVuIiwib25DYW5jZWwiLCJyZWFzb24iLCJBdXRvUnVuSXNzdWVOb3RpZmljYXRpb24iLCJ0MCIsIiQiLCJfYyIsImhhc1J1blJlZiIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQyIiwidDMiLCJjdXJyZW50IiwidDQiLCJ0NSIsInQ2IiwiQXV0b1J1bklzc3VlUmVhc29uIiwic2hvdWxkQXV0b1J1bklzc3VlIiwiZ2V0QXV0b1J1bkNvbW1hbmQiLCJnZXRBdXRvUnVuSXNzdWVSZWFzb25UZXh0Il0sInNvdXJjZXMiOlsiYXV0b1J1bklzc3VlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvblJ1bjogKCkgPT4gdm9pZFxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxuICByZWFzb246IHN0cmluZ1xufVxuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IHNob3dzIGEgbm90aWZpY2F0aW9uIGFib3V0IHJ1bm5pbmcgL2lzc3VlIGNvbW1hbmRcbiAqIHdpdGggdGhlIGFiaWxpdHkgdG8gY2FuY2VsIHZpYSBFU0Mga2V5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBBdXRvUnVuSXNzdWVOb3RpZmljYXRpb24oe1xuICBvblJ1bixcbiAgb25DYW5jZWwsXG4gIHJlYXNvbixcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaGFzUnVuUmVmID0gdXNlUmVmKGZhbHNlKVxuXG4gIC8vIEhhbmRsZSBFU0Mga2V5IHRvIGNhbmNlbFxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgb25DYW5jZWwsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICAvLyBSdW4gL2lzc3VlIGltbWVkaWF0ZWx5IG9uIG1vdW50XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFoYXNSdW5SZWYuY3VycmVudCkge1xuICAgICAgaGFzUnVuUmVmLmN1cnJlbnQgPSB0cnVlXG4gICAgICBvblJ1bigpXG4gICAgfVxuICB9LCBbb25SdW5dKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGJvbGQ+UnVubmluZyBmZWVkYmFjayBjYXB0dXJlLi4uPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBQcmVzcyA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFc2NcIiBhY3Rpb249XCJjYW5jZWxcIiAvPiBhbnl0aW1lXG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+UmVhc29uOiB7cmVhc29ufTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCB0eXBlIEF1dG9SdW5Jc3N1ZVJlYXNvbiA9ICdmZWVkYmFja19zdXJ2ZXlfYmFkJyB8ICdmZWVkYmFja19zdXJ2ZXlfZ29vZCdcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIC9pc3N1ZSBzaG91bGQgYXV0by1ydW4gZm9yIEFudCB1c2Vyc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkQXV0b1J1bklzc3VlKHJlYXNvbjogQXV0b1J1bklzc3VlUmVhc29uKTogYm9vbGVhbiB7XG4gIC8vIE9ubHkgZm9yIEFudCB1c2Vyc1xuICBpZiAoXCJleHRlcm5hbFwiICE9PSAnYW50Jykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgc3dpdGNoIChyZWFzb24pIHtcbiAgICBjYXNlICdmZWVkYmFja19zdXJ2ZXlfYmFkJzpcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIGNhc2UgJ2ZlZWRiYWNrX3N1cnZleV9nb29kJzpcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGNvbW1hbmQgdG8gYXV0by1ydW4gYmFzZWQgb24gdGhlIHJlYXNvblxuICogQU5ULU9OTFk6IGdvb2QtY2xhdWRlIGNvbW1hbmQgb25seSBleGlzdHMgaW4gYW50IGJ1aWxkc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXV0b1J1bkNvbW1hbmQocmVhc29uOiBBdXRvUnVuSXNzdWVSZWFzb24pOiBzdHJpbmcge1xuICAvLyBPbmx5IGFudCBidWlsZHMgaGF2ZSB0aGUgL2dvb2QtY2xhdWRlIGNvbW1hbmRcbiAgaWYgKFwiZXh0ZXJuYWxcIiA9PT0gJ2FudCcgJiYgcmVhc29uID09PSAnZmVlZGJhY2tfc3VydmV5X2dvb2QnKSB7XG4gICAgcmV0dXJuICcvZ29vZC1jbGF1ZGUnXG4gIH1cbiAgcmV0dXJuICcvaXNzdWUnXG59XG5cbi8qKlxuICogR2V0cyBhIGh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9uIG9mIHdoeSAvaXNzdWUgaXMgYmVpbmcgYXV0by1ydW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEF1dG9SdW5Jc3N1ZVJlYXNvblRleHQocmVhc29uOiBBdXRvUnVuSXNzdWVSZWFzb24pOiBzdHJpbmcge1xuICBzd2l0Y2ggKHJlYXNvbikge1xuICAgIGNhc2UgJ2ZlZWRiYWNrX3N1cnZleV9iYWQnOlxuICAgICAgcmV0dXJuICdZb3UgcmVzcG9uZGVkIFwiQmFkXCIgdG8gdGhlIGZlZWRiYWNrIHN1cnZleSdcbiAgICBjYXNlICdmZWVkYmFja19zdXJ2ZXlfZ29vZCc6XG4gICAgICByZXR1cm4gJ1lvdSByZXNwb25kZWQgXCJHb29kXCIgdG8gdGhlIGZlZWRiYWNrIHN1cnZleSdcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdVbmtub3duIHJlYXNvbidcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxTQUFTLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQ3pDLFNBQVNDLG9CQUFvQixRQUFRLHFEQUFxRDtBQUMxRixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLGFBQWEsUUFBUSxpQ0FBaUM7QUFFL0QsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNqQkMsUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJO0VBQ3BCQyxNQUFNLEVBQUUsTUFBTTtBQUNoQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyx5QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFrQztJQUFBTixLQUFBO0lBQUFDLFFBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUlqQztFQUNOLE1BQUFHLFNBQUEsR0FBa0JiLE1BQU0sQ0FBQyxLQUFLLENBQUM7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBSSxNQUFBLENBQUFDLEdBQUE7SUFHT0YsRUFBQTtNQUFBRyxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUFOLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQWpFUCxhQUFhLENBQUMsWUFBWSxFQUFFRyxRQUFRLEVBQUVPLEVBQTJCLENBQUM7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQUwsS0FBQTtJQUd4RFksRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSSxDQUFDTCxTQUFTLENBQUFPLE9BQVE7UUFDcEJQLFNBQVMsQ0FBQU8sT0FBQSxHQUFXLElBQUg7UUFDakJkLEtBQUssQ0FBQyxDQUFDO01BQUE7SUFDUixDQUNGO0lBQUVhLEVBQUEsSUFBQ2IsS0FBSyxDQUFDO0lBQUFLLENBQUEsTUFBQUwsS0FBQTtJQUFBSyxDQUFBLE1BQUFPLEVBQUE7SUFBQVAsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBUCxDQUFBO0lBQUFRLEVBQUEsR0FBQVIsQ0FBQTtFQUFBO0VBTFZaLFNBQVMsQ0FBQ21CLEVBS1QsRUFBRUMsRUFBTyxDQUFDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQUksTUFBQSxDQUFBQyxHQUFBO0lBSVBLLEVBQUEsSUFBQyxHQUFHLENBQ0YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFDLDJCQUEyQixFQUFyQyxJQUFJLENBQ1AsRUFGQyxHQUFHLENBRUU7SUFBQVYsQ0FBQSxNQUFBVSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVixDQUFBO0VBQUE7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBSSxNQUFBLENBQUFDLEdBQUE7SUFDTk0sRUFBQSxJQUFDLEdBQUcsQ0FDRixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsTUFDUCxDQUFDLG9CQUFvQixDQUFVLFFBQUssQ0FBTCxLQUFLLENBQVEsTUFBUSxDQUFSLFFBQVEsR0FBRyxRQUMvRCxFQUZDLElBQUksQ0FHUCxFQUpDLEdBQUcsQ0FJRTtJQUFBWCxDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFYLENBQUE7RUFBQTtFQUFBLElBQUFZLEVBQUE7RUFBQSxJQUFBWixDQUFBLFFBQUFILE1BQUE7SUFSUmUsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFZLFNBQUMsQ0FBRCxHQUFDLENBQ3RDLENBQUFGLEVBRUssQ0FDTCxDQUFBQyxFQUlLLENBQ0wsQ0FBQyxHQUFHLENBQ0YsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLFFBQVNkLE9BQUssQ0FBRSxFQUE5QixJQUFJLENBQ1AsRUFGQyxHQUFHLENBR04sRUFaQyxHQUFHLENBWUU7SUFBQUcsQ0FBQSxNQUFBSCxNQUFBO0lBQUFHLENBQUEsTUFBQVksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVosQ0FBQTtFQUFBO0VBQUEsT0FaTlksRUFZTTtBQUFBO0FBSVYsT0FBTyxLQUFLQyxrQkFBa0IsR0FBRyxxQkFBcUIsR0FBRyxzQkFBc0I7O0FBRS9FO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBU0Msa0JBQWtCQSxDQUFDakIsTUFBTSxFQUFFZ0Isa0JBQWtCLENBQUMsRUFBRSxPQUFPLENBQUM7RUFDdEU7RUFDQSxJQUFJLFVBQVUsS0FBSyxLQUFLLEVBQUU7SUFDeEIsT0FBTyxLQUFLO0VBQ2Q7RUFFQSxRQUFRaEIsTUFBTTtJQUNaLEtBQUsscUJBQXFCO01BQ3hCLE9BQU8sS0FBSztJQUNkLEtBQUssc0JBQXNCO01BQ3pCLE9BQU8sS0FBSztJQUNkO01BQ0UsT0FBTyxLQUFLO0VBQ2hCO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQVNrQixpQkFBaUJBLENBQUNsQixNQUFNLEVBQUVnQixrQkFBa0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUNwRTtFQUNBLElBQUksVUFBVSxLQUFLLEtBQUssSUFBSWhCLE1BQU0sS0FBSyxzQkFBc0IsRUFBRTtJQUM3RCxPQUFPLGNBQWM7RUFDdkI7RUFDQSxPQUFPLFFBQVE7QUFDakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFTbUIseUJBQXlCQSxDQUFDbkIsTUFBTSxFQUFFZ0Isa0JBQWtCLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDNUUsUUFBUWhCLE1BQU07SUFDWixLQUFLLHFCQUFxQjtNQUN4QixPQUFPLDRDQUE0QztJQUNyRCxLQUFLLHNCQUFzQjtNQUN6QixPQUFPLDZDQUE2QztJQUN0RDtNQUNFLE9BQU8sZ0JBQWdCO0VBQzNCO0FBQ0YiLCJpZ25vcmVMaXN0IjpbXX0=