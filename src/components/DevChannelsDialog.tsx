// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback } from 'react';
// 类型依赖 { ChannelEntry } 来自 ../bootstrap/state.js，用于校准终端渲染的数据契约。
import type { ChannelEntry } from '../bootstrap/state.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 gracefulShutdownSync 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdownSync } from '../utils/gracefulShutdown.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  channels: ChannelEntry[];
  onAccept(): void;
};
// DevChannelsDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DevChannelsDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    channels,
    onAccept
  } = t0;
  // t1 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onAccept) {
    // t1 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function onChange(value) {
      // 终端 UI 组件 Dev Channels Dialog在这里处理 `bb2: switch (value) {`，完成这一小步状态转换。
      bb2: switch (value) {
        case "accept":
          {
            // 调用 onAccept，触发终端渲染此处需要的副作用。
            onAccept();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb2;
          }
        case "exit":
          {
            // 调用 gracefulShutdownSync，触发终端渲染此处需要的副作用。
            gracefulShutdownSync(1);
          }
      }
    };
    // $[0] 缓存 `onAccept`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onAccept;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // onChange沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onChange = t1;
  // handleEscape保存`_temp`，供终端 UI Dev Channels Dialog后续判断或输出使用。
  const handleEscape = _temp;
  // t2 暂存 `<Text>--dangerously-load-development-channels is for loca...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `<Text>Please use --channels to run a list of approved cha...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text>--dangerously-load-development-channels is for loca...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>--dangerously-load-development-channels is for local channel development only. Do not use this option to run channels you have downloaded off the internet.</Text>;
    // t3 暂存 `<Text>Please use --channels to run a list of approved cha...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Please use --channels to run a list of approved channels.</Text>;
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
  // t4 暂存 `channels.map(_temp2).join(", ")` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== channels) {
    // t4 暂存 `channels.map(_temp2).join(", ")` 生成的渲染片段，后续返回路径直接复用。
    t4 = channels.map(_temp2).join(", ");
    // $[4] 缓存 `channels`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = channels;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}<Text dimColo...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t4) {
    // t5 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}<Text dimColo...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" gap={1}>{t2}{t3}<Text dimColor={true}>Channels:{" "}{t4}</Text></Box>;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t6 = [{
      label: "I am using this for local development",
      value: "accept"
    }, {
      label: "Exit",
      value: "exit"
    }];
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `<Select options={t6} onChange={value_0 => onChange(value_...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== onChange) {
    // t7 暂存 `<Select options={t6} onChange={value_0 => onChange(value_...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Select options={t6} onChange={value_0 => onChange(value_0 as 'accept' | 'exit')} />;
    // $[9] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onChange;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<Dialog title="WARNING: Loading development channels" col...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t5 || $[12] !== t7) {
    // t8 暂存 `<Dialog title="WARNING: Loading development channels" col...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Dialog title="WARNING: Loading development channels" color="error" onCancel={handleEscape}>{t5}{t7}</Dialog>;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回 `c.kind === "plugin" ? `plugin:${c.name}@${c.marketplace}` : `server:${c...`，作为终端渲染这次计算的结果。
  return c.kind === "plugin" ? `plugin:${c.name}@${c.marketplace}` : `server:${c.name}`;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 调用 gracefulShutdownSync，触发终端渲染此处需要的副作用。
  gracefulShutdownSync(0);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwiQ2hhbm5lbEVudHJ5IiwiQm94IiwiVGV4dCIsImdyYWNlZnVsU2h1dGRvd25TeW5jIiwiU2VsZWN0IiwiRGlhbG9nIiwiUHJvcHMiLCJjaGFubmVscyIsIm9uQWNjZXB0IiwiRGV2Q2hhbm5lbHNEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsInQxIiwib25DaGFuZ2UiLCJ2YWx1ZSIsImJiMiIsImhhbmRsZUVzY2FwZSIsIl90ZW1wIiwidDIiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0IiwibWFwIiwiX3RlbXAyIiwiam9pbiIsInQ1IiwidDYiLCJsYWJlbCIsInQ3IiwidmFsdWVfMCIsInQ4IiwiYyIsImtpbmQiLCJuYW1lIiwibWFya2V0cGxhY2UiXSwic291cmNlcyI6WyJEZXZDaGFubmVsc0RpYWxvZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IENoYW5uZWxFbnRyeSB9IGZyb20gJy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGdyYWNlZnVsU2h1dGRvd25TeW5jIH0gZnJvbSAnLi4vdXRpbHMvZ3JhY2VmdWxTaHV0ZG93bi5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY2hhbm5lbHM6IENoYW5uZWxFbnRyeVtdXG4gIG9uQWNjZXB0KCk6IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIERldkNoYW5uZWxzRGlhbG9nKHtcbiAgY2hhbm5lbHMsXG4gIG9uQWNjZXB0LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZTogJ2FjY2VwdCcgfCAnZXhpdCcpIHtcbiAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICBjYXNlICdhY2NlcHQnOlxuICAgICAgICBvbkFjY2VwdCgpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdleGl0JzpcbiAgICAgICAgZ3JhY2VmdWxTaHV0ZG93blN5bmMoMSlcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBjb25zdCBoYW5kbGVFc2NhcGUgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZ3JhY2VmdWxTaHV0ZG93blN5bmMoMClcbiAgfSwgW10pXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIldBUk5JTkc6IExvYWRpbmcgZGV2ZWxvcG1lbnQgY2hhbm5lbHNcIlxuICAgICAgY29sb3I9XCJlcnJvclwiXG4gICAgICBvbkNhbmNlbD17aGFuZGxlRXNjYXBlfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIC0tZGFuZ2Vyb3VzbHktbG9hZC1kZXZlbG9wbWVudC1jaGFubmVscyBpcyBmb3IgbG9jYWwgY2hhbm5lbFxuICAgICAgICAgIGRldmVsb3BtZW50IG9ubHkuIERvIG5vdCB1c2UgdGhpcyBvcHRpb24gdG8gcnVuIGNoYW5uZWxzIHlvdSBoYXZlXG4gICAgICAgICAgZG93bmxvYWRlZCBvZmYgdGhlIGludGVybmV0LlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlBsZWFzZSB1c2UgLS1jaGFubmVscyB0byBydW4gYSBsaXN0IG9mIGFwcHJvdmVkIGNoYW5uZWxzLjwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgQ2hhbm5lbHM6eycgJ31cbiAgICAgICAgICB7Y2hhbm5lbHNcbiAgICAgICAgICAgIC5tYXAoYyA9PlxuICAgICAgICAgICAgICBjLmtpbmQgPT09ICdwbHVnaW4nXG4gICAgICAgICAgICAgICAgPyBgcGx1Z2luOiR7Yy5uYW1lfUAke2MubWFya2V0cGxhY2V9YFxuICAgICAgICAgICAgICAgIDogYHNlcnZlcjoke2MubmFtZX1gLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmpvaW4oJywgJyl9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICB7IGxhYmVsOiAnSSBhbSB1c2luZyB0aGlzIGZvciBsb2NhbCBkZXZlbG9wbWVudCcsIHZhbHVlOiAnYWNjZXB0JyB9LFxuICAgICAgICAgIHsgbGFiZWw6ICdFeGl0JywgdmFsdWU6ICdleGl0JyB9LFxuICAgICAgICBdfVxuICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4gb25DaGFuZ2UodmFsdWUgYXMgJ2FjY2VwdCcgfCAnZXhpdCcpfVxuICAgICAgLz5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxXQUFXLFFBQVEsT0FBTztBQUMxQyxjQUFjQyxZQUFZLFFBQVEsdUJBQXVCO0FBQ3pELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0Msb0JBQW9CLFFBQVEsOEJBQThCO0FBQ25FLFNBQVNDLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUVsRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFUCxZQUFZLEVBQUU7RUFDeEJRLFFBQVEsRUFBRSxFQUFFLElBQUk7QUFDbEIsQ0FBQztBQUVELE9BQU8sU0FBQUMsa0JBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMkI7SUFBQUwsUUFBQTtJQUFBQztFQUFBLElBQUFFLEVBRzFCO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUgsUUFBQTtJQUNOSyxFQUFBLFlBQUFDLFNBQUFDLEtBQUE7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