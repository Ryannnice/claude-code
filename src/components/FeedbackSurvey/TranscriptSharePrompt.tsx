// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 BLACK_CIRCLE，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../../constants/figures.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useDebouncedDigitInput，将 ./useDebouncedDigitInput.js 中已经封装好的能力接到本文件流程里。
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js';
// TranscriptShareResponse 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TranscriptShareResponse = 'yes' | 'no' | 'dont_ask_again';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onSelect: (option: TranscriptShareResponse) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (option: TranscriptShareResponse) => void;
  inputValue: string;
  // 这个回调绑定到 setInputValue: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void;
};
// RESPONSE_INPUTS 响应数据 聚合成有序列表，保持后续遍历顺序稳定。
const RESPONSE_INPUTS = ['1', '2', '3'] as const;
// ResponseInput 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ResponseInput = (typeof RESPONSE_INPUTS)[number];
// inputToResponse 响应数据 集中保存终端 UI 组件 Transcript Share Prompt要一起传递的字段。
const inputToResponse: Record<ResponseInput, TranscriptShareResponse> = {
  '1': 'yes',
  '2': 'no',
  '3': 'dont_ask_again'
} as const;
// isValidResponseInput 响应数据记录 `includes` 是否成立，终端渲染随后按该结果分支。
const isValidResponseInput = (input: string): input is ResponseInput => (RESPONSE_INPUTS as readonly string[]).includes(input);
// TranscriptSharePrompt 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TranscriptSharePrompt(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onSelect,
    inputValue,
    setInputValue
  } = t0;
  // t1 暂存 `digit => onSelect(inputToResponse[digit])` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onSelect) {
    // t1 暂存 `digit => onSelect(inputToResponse[digit])` 生成的渲染片段，后续返回路径直接复用。
    t1 = digit => onSelect(inputToResponse[digit]);
    // $[0] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onSelect;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== inputValue || $[3] !== setInputValue || $[4] !== t1) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      inputValue,
      setInputValue,
      isValidDigit: isValidResponseInput,
      onDigit: t1
    };
    // $[2] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = inputValue;
    // $[3] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setInputValue;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 调用 useDebouncedDigitInput，触发终端渲染此处需要的副作用。
  useDebouncedDigitInput(t2);
  // t3 暂存 `<Box><Text color="ansi:cyan">{BLACK_CIRCLE} </Text><Text ...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box><Text color="ansi:cyan">{BLACK_CIRCLE} </Text><Text ...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box><Text color="ansi:cyan">{BLACK_CIRCLE} </Text><Text bold={true}>Can Anthropic look at your session transcript to help us improve Claude Code?</Text></Box>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box marginLeft={2}><Text dimColor={true}>Learn more: htt...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box marginLeft={2}><Text dimColor={true}>Learn more: htt...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginLeft={2}><Text dimColor={true}>Learn more: https://code.claude.com/docs/en/data-usage#session-quality-surveys</Text></Box>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Box width={10}><Text><Text color="ansi:cyan">1</Text>: Y...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box width={10}><Text><Text color="ansi:cyan">1</Text>: Y...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box width={10}><Text><Text color="ansi:cyan">1</Text>: Yes</Text></Box>;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Box width={10}><Text><Text color="ansi:cyan">2</Text>: N...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Box width={10}><Text><Text color="ansi:cyan">2</Text>: N...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box width={10}><Text><Text color="ansi:cyan">2</Text>: No</Text></Box>;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<Box flexDirection="column" marginTop={1}>{t3}{t4}<Box ma...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Box flexDirection="column" marginTop={1}>{t3}{t4}<Box ma...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column" marginTop={1}>{t3}{t4}<Box marginLeft={2}>{t5}{t6}<Box><Text><Text color="ansi:cyan">3</Text>: Don't ask again</Text></Box></Box></Box>;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // 返回 t7，把终端渲染这个分支的结果交还调用方。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJMQUNLX0NJUkNMRSIsIkJveCIsIlRleHQiLCJ1c2VEZWJvdW5jZWREaWdpdElucHV0IiwiVHJhbnNjcmlwdFNoYXJlUmVzcG9uc2UiLCJQcm9wcyIsIm9uU2VsZWN0Iiwib3B0aW9uIiwiaW5wdXRWYWx1ZSIsInNldElucHV0VmFsdWUiLCJ2YWx1ZSIsIlJFU1BPTlNFX0lOUFVUUyIsImNvbnN0IiwiUmVzcG9uc2VJbnB1dCIsImlucHV0VG9SZXNwb25zZSIsIlJlY29yZCIsImlzVmFsaWRSZXNwb25zZUlucHV0IiwiaW5wdXQiLCJpbmNsdWRlcyIsIlRyYW5zY3JpcHRTaGFyZVByb21wdCIsInQwIiwiJCIsIl9jIiwidDEiLCJkaWdpdCIsInQyIiwiaXNWYWxpZERpZ2l0Iiwib25EaWdpdCIsInQzIiwiU3ltYm9sIiwiZm9yIiwidDQiLCJ0NSIsInQ2IiwidDciXSwic291cmNlcyI6WyJUcmFuc2NyaXB0U2hhcmVQcm9tcHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJMQUNLX0NJUkNMRSB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlRGVib3VuY2VkRGlnaXRJbnB1dCB9IGZyb20gJy4vdXNlRGVib3VuY2VkRGlnaXRJbnB1dC5qcydcblxuZXhwb3J0IHR5cGUgVHJhbnNjcmlwdFNoYXJlUmVzcG9uc2UgPSAneWVzJyB8ICdubycgfCAnZG9udF9hc2tfYWdhaW4nXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uU2VsZWN0OiAob3B0aW9uOiBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSkgPT4gdm9pZFxuICBpbnB1dFZhbHVlOiBzdHJpbmdcbiAgc2V0SW5wdXRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbn1cblxuY29uc3QgUkVTUE9OU0VfSU5QVVRTID0gWycxJywgJzInLCAnMyddIGFzIGNvbnN0XG50eXBlIFJlc3BvbnNlSW5wdXQgPSAodHlwZW9mIFJFU1BPTlNFX0lOUFVUUylbbnVtYmVyXVxuXG5jb25zdCBpbnB1dFRvUmVzcG9uc2U6IFJlY29yZDxSZXNwb25zZUlucHV0LCBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZT4gPSB7XG4gICcxJzogJ3llcycsXG4gICcyJzogJ25vJyxcbiAgJzMnOiAnZG9udF9hc2tfYWdhaW4nLFxufSBhcyBjb25zdFxuXG5jb25zdCBpc1ZhbGlkUmVzcG9uc2VJbnB1dCA9IChpbnB1dDogc3RyaW5nKTogaW5wdXQgaXMgUmVzcG9uc2VJbnB1dCA9PlxuICAoUkVTUE9OU0VfSU5QVVRTIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhpbnB1dClcblxuZXhwb3J0IGZ1bmN0aW9uIFRyYW5zY3JpcHRTaGFyZVByb21wdCh7XG4gIG9uU2VsZWN0LFxuICBpbnB1dFZhbHVlLFxuICBzZXRJbnB1dFZhbHVlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICB1c2VEZWJvdW5jZWREaWdpdElucHV0KHtcbiAgICBpbnB1dFZhbHVlLFxuICAgIHNldElucHV0VmFsdWUsXG4gICAgaXNWYWxpZERpZ2l0OiBpc1ZhbGlkUmVzcG9uc2VJbnB1dCxcbiAgICBvbkRpZ2l0OiBkaWdpdCA9PiBvblNlbGVjdChpbnB1dFRvUmVzcG9uc2VbZGlnaXRdKSxcbiAgfSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImFuc2k6Y3lhblwiPntCTEFDS19DSVJDTEV9IDwvVGV4dD5cbiAgICAgICAgPFRleHQgYm9sZD5cbiAgICAgICAgICBDYW4gQW50aHJvcGljIGxvb2sgYXQgeW91ciBzZXNzaW9uIHRyYW5zY3JpcHQgdG8gaGVscCB1cyBpbXByb3ZlXG4gICAgICAgICAgQ2xhdWRlIENvZGU/XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8Qm94IG1hcmdpbkxlZnQ9ezJ9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBMZWFybiBtb3JlOlxuICAgICAgICAgIGh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vZGF0YS11c2FnZSNzZXNzaW9uLXF1YWxpdHktc3VydmV5c1xuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveCBtYXJnaW5MZWZ0PXsyfT5cbiAgICAgICAgPEJveCB3aWR0aD17MTB9PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJhbnNpOmN5YW5cIj4xPC9UZXh0PjogWWVzXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveCB3aWR0aD17MTB9PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJhbnNpOmN5YW5cIj4yPC9UZXh0PjogTm9cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJhbnNpOmN5YW5cIj4zPC9UZXh0PjogRG9uJmFwb3M7dCBhc2sgYWdhaW5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLFlBQVksUUFBUSw0QkFBNEI7QUFDekQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxzQkFBc0IsUUFBUSw2QkFBNkI7QUFFcEUsT0FBTyxLQUFLQyx1QkFBdUIsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLGdCQUFnQjtBQUVyRSxLQUFLQyxLQUFL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