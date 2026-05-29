// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ThinkingBlock, ThinkingBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ThinkingBlock, ThinkingBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 CtrlOToExpand，将 ../CtrlOToExpand.js 中已经封装好的能力接到本文件流程里。
import { CtrlOToExpand } from '../CtrlOToExpand.js';
// 引入 Markdown，将 ../Markdown.js 中已经封装好的能力接到本文件流程里。
import { Markdown } from '../Markdown.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // Accept either full ThinkingBlock/ThinkingBlockParam or a minimal shape with just type and thinking
  param: ThinkingBlock | ThinkingBlockParam | {
    type: 'thinking';
    thinking: string;
  };
  addMargin: boolean;
  isTranscriptMode: boolean;
  verbose: boolean;
  /** When true, hide this thinking block entirely (used for past thinking in transcript mode) */
  hideInTranscript?: boolean;
};
// AssistantThinkingMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AssistantThinkingMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    param: t1,
    addMargin: t2,
    isTranscriptMode,
    verbose,
    hideInTranscript: t3
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    thinking
  } = t1;
  // addMargin标记终端 UI Assistant Thinking M...是否启用对应路径。
  const addMargin = t2 === undefined ? false : t2;
  // hideInTranscript标记终端 UI Assistant Thinking M...是否启用对应路径。
  const hideInTranscript = t3 === undefined ? false : t3;
  // thinking缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!thinking) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `hideInTranscript` 时，终端渲染执行该分支。
  if (hideInTranscript) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // shouldShowFullThinking标记终端 UI Assistant Thinking M...是否启用对应路径。
  const shouldShowFullThinking = isTranscriptMode || verbose;
  // shouldShowFullThinking缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!shouldShowFullThinking) {
    // t4保存`addMargin ? 1 : 0`，供终端 UI Assistant Thinking M...后续判断或输出使用。
    const t4 = addMargin ? 1 : 0;
    // t5 暂存 `<Text dimColor={true} italic={true}>{"\u2234 Thinking"} <...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text dimColor={true} italic={true}>{"\u2234 Thinking"} <...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={true} italic={true}>{"\u2234 Thinking"} <CtrlOToExpand /></Text>;
      // $[0] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[0];
    }
    // t6 暂存 `<Box marginTop={t4}>{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== t4) {
      // t6 暂存 `<Box marginTop={t4}>{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box marginTop={t4}>{t5}</Box>;
      // $[1] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t4;
      // $[2] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[2];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // t4保存`addMargin ? 1 : 0`，供终端 UI Assistant Thinking M...后续判断或输出使用。
  const t4 = addMargin ? 1 : 0;
  // t5 暂存 `<Text dimColor={true} italic={true}>{"\u2234 Thinking"}…<...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text dimColor={true} italic={true}>{"\u2234 Thinking"}…<...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true} italic={true}>{"\u2234 Thinking"}…</Text>;
    // $[3] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[3];
  }
  // t6 暂存 `<Box paddingLeft={2}><Markdown dimColor={true}>{thinking}...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== thinking) {
    // t6 暂存 `<Box paddingLeft={2}><Markdown dimColor={true}>{thinking}...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box paddingLeft={2}><Markdown dimColor={true}>{thinking}</Markdown></Box>;
    // $[4] 缓存 `thinking`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = thinking;
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
  }
  // t7 暂存 `<Box flexDirection="column" gap={1} marginTop={t4} width=...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t4 || $[7] !== t6) {
    // t7 暂存 `<Box flexDirection="column" gap={1} marginTop={t4} width=...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column" gap={1} marginTop={t4} width="100%">{t5}{t6}</Box>;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaGlua2luZ0Jsb2NrIiwiVGhpbmtpbmdCbG9ja1BhcmFtIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiQ3RybE9Ub0V4cGFuZCIsIk1hcmtkb3duIiwiUHJvcHMiLCJwYXJhbSIsInR5cGUiLCJ0aGlua2luZyIsImFkZE1hcmdpbiIsImlzVHJhbnNjcmlwdE1vZGUiLCJ2ZXJib3NlIiwiaGlkZUluVHJhbnNjcmlwdCIsIkFzc2lzdGFudFRoaW5raW5nTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwidW5kZWZpbmVkIiwic2hvdWxkU2hvd0Z1bGxUaGlua2luZyIsInQ0IiwidDUiLCJTeW1ib2wiLCJmb3IiLCJsYWJlbCIsInQ2IiwidDciXSwic291cmNlcyI6WyJBc3Npc3RhbnRUaGlua2luZ01lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgVGhpbmtpbmdCbG9jayxcbiAgVGhpbmtpbmdCbG9ja1BhcmFtLFxufSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvaW5kZXgubWpzJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgQ3RybE9Ub0V4cGFuZCB9IGZyb20gJy4uL0N0cmxPVG9FeHBhbmQuanMnXG5pbXBvcnQgeyBNYXJrZG93biB9IGZyb20gJy4uL01hcmtkb3duLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICAvLyBBY2NlcHQgZWl0aGVyIGZ1bGwgVGhpbmtpbmdCbG9jay9UaGlua2luZ0Jsb2NrUGFyYW0gb3IgYSBtaW5pbWFsIHNoYXBlIHdpdGgganVzdCB0eXBlIGFuZCB0aGlua2luZ1xuICBwYXJhbTpcbiAgICB8IFRoaW5raW5nQmxvY2tcbiAgICB8IFRoaW5raW5nQmxvY2tQYXJhbVxuICAgIHwgeyB0eXBlOiAndGhpbmtpbmcnOyB0aGlua2luZzogc3RyaW5nIH1cbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIGlzVHJhbnNjcmlwdE1vZGU6IGJvb2xlYW5cbiAgdmVyYm9zZTogYm9vbGVhblxuICAvKiogV2hlbiB0cnVlLCBoaWRlIHRoaXMgdGhpbmtpbmcgYmxvY2sgZW50aXJlbHkgKHVzZWQgZm9yIHBhc3QgdGhpbmtpbmcgaW4gdHJhbnNjcmlwdCBtb2RlKSAqL1xuICBoaWRlSW5UcmFuc2NyaXB0PzogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXNzaXN0YW50VGhpbmtpbmdNZXNzYWdlKHtcbiAgcGFyYW06IHsgdGhpbmtpbmcgfSxcbiAgYWRkTWFyZ2luID0gZmFsc2UsXG4gIGlzVHJhbnNjcmlwdE1vZGUsXG4gIHZlcmJvc2UsXG4gIGhpZGVJblRyYW5zY3JpcHQgPSBmYWxzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCF0aGlua2luZykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoaGlkZUluVHJhbnNjcmlwdCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCBzaG91bGRTaG93RnVsbFRoaW5raW5nID0gaXNUcmFuc2NyaXB0TW9kZSB8fCB2ZXJib3NlXG4gIGNvbnN0IGxhYmVsID0gJ+KItCBUaGlua2luZydcblxuICBpZiAoIXNob3VsZFNob3dGdWxsVGhpbmtpbmcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBtYXJnaW5Ub3A9e2FkZE1hcmdpbiA/IDEgOiAwfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgIHtsYWJlbH0gPEN0cmxPVG9FeHBhbmQgLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIGdhcD17MX1cbiAgICAgIG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9XG4gICAgICB3aWR0aD1cIjEwMCVcIlxuICAgID5cbiAgICAgIDxUZXh0IGRpbUNvbG9yIGl0YWxpYz5cbiAgICAgICAge2xhYmVsfeKAplxuICAgICAgPC9UZXh0PlxuICAgICAgPEJveCBwYWRkaW5nTGVmdD17Mn0+XG4gICAgICAgIDxNYXJrZG93biBkaW1Db2xvcj57dGhpbmtpbmd9PC9NYXJrZG93bj5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUNFQSxhQUFhLEVBQ2JDLGtCQUFrQixRQUNiLHVDQUF1QztBQUM5QyxPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxxQkFBcUI7QUFDbkQsU0FBU0MsUUFBUSxRQUFRLGdCQUFnQjtBQUV6QyxLQUFLQyxLQUFLLEdBQUc7RUFDWDtFQUNBQyxLQUFLLEVBQ0RSLGFBQWEsR0FDYkMsa0JBQWtCLEdBQ2xCO0lBQUVRLElBQUksRUFBRSxVQUFVO0lBQUVDLFFBQVEsRUFBRSxNQUFNO0VBQUMsQ0FBQztFQUMxQ0MsU0FBUyxFQUFFLE9BQU87RUFDbEJDLGdCQUFnQixFQUFFLE9BQU87RUFDekJDLE9BQU8sRUFBRSxPQUFPO0VBQ2hCO0VBQ0FDLGdCQUFnQixDQUFDLEVBQUUsT0FBTztBQUM1QixDQUFDO0FBRUQsT0FBTyxTQUFBQyx5QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFrQztJQUFBVixLQUFBLEVBQUFXLEVBQUE7SUFBQVIsU0FBQSxFQUFBUyxFQUFBO0lBQUFSLGdCQUFBO0lBQUFDLE9BQUE7SUFBQUMsZ0JBQUEsRUFBQU87RUFBQSxJQUFBTCxFQU1qQztFQUxDO0lBQUFOO0VBQUEsSUFBQVMsRUFBWTtFQUNuQixNQUFBUixTQUFBLEdBQUFTLEVBQWlCLEtBQWpCRSxTQUFpQixHQUFqQixLQUFpQixHQUFqQkYsRUFBaUI7RUFHakIsTUFBQU4sZ0JBQUEsR0FBQU8sRUFBd0IsS0FBeEJDLFNB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