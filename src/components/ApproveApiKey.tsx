// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveGlobalConfig } from '../utils/config.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  customApiKeyTruncated: string;
  onDone(approved: boolean): void;
};
// ApproveApiKey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ApproveApiKey(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    customApiKeyTruncated,
    onDone
  } = t0;
  // t1 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== customApiKeyTruncated || $[1] !== onDone) {
    // t1 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function onChange(value) {
      // 终端 UI 组件 Approve Api Key在这里处理 `bb2: switch (value) {`，完成这一小步状态转换。
      bb2: switch (value) {
        case "yes":
          {
            // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
            saveGlobalConfig(current_0 => ({
              ...current_0,
              customApiKeyResponses: {
                ...current_0.customApiKeyResponses,
                approved: [...(current_0.customApiKeyResponses?.approved ?? []), customApiKeyTruncated]
              }
            }));
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone(true);
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb2;
          }
        case "no":
          {
            // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
            saveGlobalConfig(current => ({
              ...current,
              customApiKeyResponses: {
                ...current.customApiKeyResponses,
                rejected: [...(current.customApiKeyResponses?.rejected ?? []), customApiKeyTruncated]
              }
            }));
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone(false);
          }
      }
    };
    // $[0] 缓存 `customApiKeyTruncated`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = customApiKeyTruncated;
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // onChange保存`t1`，作为后续临时缓存值处理的输入。
  const onChange = t1;
  // t2 暂存 `() => onChange("no")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onChange) {
    // t2 暂存 `() => onChange("no")` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => onChange("no");
    // $[3] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onChange;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text bold={true}>ANTHROPIC_API_KEY</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text bold={true}>ANTHROPIC_API_KEY</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true}>ANTHROPIC_API_KEY</Text>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Text>{t3}<Text>: sk-ant-...{customApiKeyTruncated}</Text...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== customApiKeyTruncated) {
    // t4 暂存 `<Text>{t3}<Text>: sk-ant-...{customApiKeyTruncated}</Text...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>{t3}<Text>: sk-ant-...{customApiKeyTruncated}</Text></Text>;
    // $[6] 缓存 `customApiKeyTruncated`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = customApiKeyTruncated;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Text>Do you want to use this API key?</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text>Do you want to use this API key?</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Do you want to use this API key?</Text>;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      label: "Yes",
      value: "yes"
    };
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `[t6, {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `[t6, {` 生成的渲染片段，后续返回路径直接复用。
    t7 = [t6, {
      label: <Text>No (<Text bold={true}>recommended</Text>)</Text>,
      value: "no"
    }];
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<Select defaultValue="no" defaultFocusValue="no" options=...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onChange) {
    // t8 暂存 `<Select defaultValue="no" defaultFocusValue="no" options=...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Select defaultValue="no" defaultFocusValue="no" options={t7} onChange={value_0 => onChange(value_0 as 'yes' | 'no')} onCancel={() => onChange("no")} />;
    // $[11] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onChange;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // t9 暂存 `<Dialog title="Detected a custom API key in your environm...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t2 || $[14] !== t4 || $[15] !== t8) {
    // t9 暂存 `<Dialog title="Detected a custom API key in your environm...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Dialog title="Detected a custom API key in your environment" color="warning" onCancel={t2}>{t4}{t5}{t8}</Dialog>;
    // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t2;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[16];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJzYXZlR2xvYmFsQ29uZmlnIiwiU2VsZWN0IiwiRGlhbG9nIiwiUHJvcHMiLCJjdXN0b21BcGlLZXlUcnVuY2F0ZWQiLCJvbkRvbmUiLCJhcHByb3ZlZCIsIkFwcHJvdmVBcGlLZXkiLCJ0MCIsIiQiLCJfYyIsInQxIiwib25DaGFuZ2UiLCJ2YWx1ZSIsImJiMiIsImN1cnJlbnRfMCIsImN1cnJlbnQiLCJjdXN0b21BcGlLZXlSZXNwb25zZXMiLCJyZWplY3RlZCIsInQyIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJ0NCIsInQ1IiwidDYiLCJsYWJlbCIsInQ3IiwidDgiLCJ2YWx1ZV8wIiwidDkiXSwic291cmNlcyI6WyJBcHByb3ZlQXBpS2V5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY3VzdG9tQXBpS2V5VHJ1bmNhdGVkOiBzdHJpbmdcbiAgb25Eb25lKGFwcHJvdmVkOiBib29sZWFuKTogdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXBwcm92ZUFwaUtleSh7XG4gIGN1c3RvbUFwaUtleVRydW5jYXRlZCxcbiAgb25Eb25lLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZTogJ3llcycgfCAnbm8nKSB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSAneWVzJzoge1xuICAgICAgICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgICAgICAuLi5jdXJyZW50LFxuICAgICAgICAgIGN1c3RvbUFwaUtleVJlc3BvbnNlczoge1xuICAgICAgICAgICAgLi4uY3VycmVudC5jdXN0b21BcGlLZXlSZXNwb25zZXMsXG4gICAgICAgICAgICBhcHByb3ZlZDogW1xuICAgICAgICAgICAgICAuLi4oY3VycmVudC5jdXN0b21BcGlLZXlSZXNwb25zZXM/LmFwcHJvdmVkID8/IFtdKSxcbiAgICAgICAgICAgICAgY3VzdG9tQXBpS2V5VHJ1bmNhdGVkLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSlcbiAgICAgICAgb25Eb25lKHRydWUpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlICdubyc6IHtcbiAgICAgICAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+ICh7XG4gICAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgICBjdXN0b21BcGlLZXlSZXNwb25zZXM6IHtcbiAgICAgICAgICAgIC4uLmN1cnJlbnQuY3VzdG9tQXBpS2V5UmVzcG9uc2VzLFxuICAgICAgICAgICAgcmVqZWN0ZWQ6IFtcbiAgICAgICAgICAgICAgLi4uKGN1cnJlbnQuY3VzdG9tQXBpS2V5UmVzcG9uc2VzPy5yZWplY3RlZCA/PyBbXSksXG4gICAgICAgICAgICAgIGN1c3RvbUFwaUtleVRydW5jYXRlZCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSkpXG4gICAgICAgIG9uRG9uZShmYWxzZSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPVwiRGV0ZWN0ZWQgYSBjdXN0b20gQVBJIGtleSBpbiB5b3VyIGVudmlyb25tZW50XCJcbiAgICAgIGNvbG9yPVwid2FybmluZ1wiXG4gICAgICBvbkNhbmNlbD17KCkgPT4gb25DaGFuZ2UoJ25vJyl9XG4gICAgPlxuICAgICAgPFRleHQ+XG4gICAgICAgIDxUZXh0IGJvbGQ+QU5USFJPUElDX0FQSV9LRVk8L1RleHQ+XG4gICAgICAgIDxUZXh0Pjogc2stYW50LS4uLntjdXN0b21BcGlLZXlUcnVuY2F0ZWR9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgICAgPFRleHQ+RG8geW91IHdhbnQgdG8gdXNlIHRoaXMgQVBJIGtleT88L1RleHQ+XG4gICAgICA8U2VsZWN0XG4gICAgICAgIGRlZmF1bHRWYWx1ZT1cIm5vXCJcbiAgICAgICAgZGVmYXVsdEZvY3VzVmFsdWU9XCJub1wiXG4gICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICB7IGxhYmVsOiAnWWVzJywgdmFsdWU6ICd5ZXMnIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IChcbiAgICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgICAgTm8gKDxUZXh0IGJvbGQ+cmVjb21tZW5kZWQ8L1RleHQ+KVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgdmFsdWU6ICdubycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXX1cbiAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IG9uQ2hhbmdlKHZhbHVlIGFzICd5ZXMnIHwgJ25vJyl9XG4gICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkNoYW5nZSgnbm8nKX1cbiAgICAgIC8+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksUUFBUSxXQUFXO0FBQ2hDLFNBQVNDLGdCQUFnQixRQUFRLG9CQUFvQjtBQUNyRCxTQUFTQyxNQUFNLFFBQVEseUJBQXlCO0FBQ2hELFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFFbEQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLHFCQUFxQixFQUFFLE1BQU07RUFDN0JDLE1BQU0sQ0FBQ0MsUUFBUSxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUk7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RUFBQSxJQUFBa0IsRUFBQTtFQUFBLElBQUFsQixDQUFBLFNBQUFZLE1BQUEsQ0FBQUMsR0FBQTtJQUR2QkssRUFBQSxJQUNQRixFQUE4QixFQUM5QjtNQUFBQyxLQUFBLEVBRUksQ0FBQyxJQUFJLENBQUMsSUFDQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUMsV0FBVyxFQUFyQixJQUFJLENBQXdCLENBQ25DLEVBRkMsSUFBSSxDQUVFO01BQUFiLEtBQUEsRUFFRjtJQUNULENBQUMsQ0FDRjtJQUFBSixDQUFBLE9BQUFrQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBbEIsQ0FBQTtFQUFBO0VBQUEsSUFBQW1CLEVBQUE7RUFBQSxJQUFBbkIsQ0FBQSxTQUFBRyxRQUFBO0lBYkhnQixFQUFBLElBQUMsTUFBTSxDQUNRLFlBQUksQ0FBSixJQUFJLENBQ0MsaUJBQUksQ0FBSixJQUFJLENBQ2IsT0FVUixDQVZRLENBQUFELEVBVVQsQ0FBQyxDQUNTLFFBQXdDLENBQXhDLENBQUFFLE9BQUEsSUFBU2pCLFFBQVEsQ0FBQ0MsT0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLEVBQUMsQ0FDeEMsUUFBb0IsQ0FBcEIsT0FBTUQsUUFBUSxDQUFDLElBQUksRUFBQyxHQUM5QjtJQUFBSCxDQUFBLE9BQUFHLFFBQUE7SUFBQUgsQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQUFBLElBQUFxQixFQUFBO0VBQUEsSUFBQXJCLENBQUEsU0FBQVUsRUFBQSxJQUFBVixDQUFBLFNBQUFjLEVBQUEsSUFBQWQsQ0FBQSxTQUFBbUIsRUFBQTtJQTFCSkUsRUFBQSxJQUFDLE1BQU0sQ0FDQyxLQUErQyxDQUEvQywrQ0FBK0MsQ0FDL0MsS0FBUyxDQUFULFNBQVMsQ0FDTCxRQUFvQixDQUFwQixDQUFBWCxFQUFtQixDQUFDLENBRTlCLENBQUFJLEVBR00sQ0FDTixDQUFBQyxFQUE0QyxDQUM1QyxDQUFBSSxFQWdCQyxDQUNILEVBM0JDLE1BQU0sQ0EyQkU7SUFBQW5CLENBQUEsT0FBQVUsRUFBQTtJQUFBVixDQUFBLE9BQUFjLEVBQUE7SUFBQWQsQ0FBQSxPQUFBbUIsRUFBQTtJQUFBbkIsQ0FBQSxPQUFBcUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXJCLENBQUE7RUFBQTtFQUFBLE9BM0JUcUIsRUEyQlM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==