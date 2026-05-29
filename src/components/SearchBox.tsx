// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  query: string;
  placeholder?: string;
  isFocused: boolean;
  isTerminalFocused: boolean;
  prefix?: string;
  width?: number | string;
  cursorOffset?: number;
  borderless?: boolean;
};
// SearchBox 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SearchBox(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    query,
    placeholder: t1,
    isFocused,
    isTerminalFocused,
    prefix: t2,
    width,
    cursorOffset,
    borderless: t3
  } = t0;
  // placeholder标记终端 UI Search Box是否启用对应路径。
  const placeholder = t1 === undefined ? "Search\u2026" : t1;
  // prefix标记终端 UI Search Box是否启用对应路径。
  const prefix = t2 === undefined ? "\u2315" : t2;
  // borderless 集合标记终端 UI Search Box是否启用对应路径。
  const borderless = t3 === undefined ? false : t3;
  // offset保存 `cursorOffset ?? query.length` 的判断结果，供终端 UI Search Box后续分支直接复用。
  const offset = cursorOffset ?? query.length;
  // 临时值 t4 命名 `borderless ? undefined : "round"`，让后续代码直接表达这个值的用途。
  const t4 = borderless ? undefined : "round";
  // t5保存`isFocused ? "suggestion" : undefined`，供后续判断或组装使用。
  const t5 = isFocused ? "suggestion" : undefined;
  // t6标记终端 UI Search Box是否启用对应路径。
  const t6 = !isFocused;
  // t7保存`borderless ? 0 : 1`，供终端 UI Search Box后续判断或输出使用。
  const t7 = borderless ? 0 : 1;
  // t8标记终端 UI Search Box是否启用对应路径。
  const t8 = !isFocused;
  // t9 暂存 `isFocused ? <>{query ? isTerminalFocused ? <><Text>{query...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== isFocused || $[1] !== isTerminalFocused || $[2] !== offset || $[3] !== placeholder || $[4] !== query) {
    // t9 暂存 `isFocused ? <>{query ? isTerminalFocused ? <><Text>{query...` 生成的渲染片段，后续返回路径直接复用。
    t9 = isFocused ? <>{query ? isTerminalFocused ? <><Text>{query.slice(0, offset)}</Text><Text inverse={true}>{offset < query.length ? query[offset] : " "}</Text>{offset < query.length && <Text>{query.slice(offset + 1)}</Text>}</> : <Text>{query}</Text> : isTerminalFocused ? <><Text inverse={true}>{placeholder.charAt(0)}</Text><Text dimColor={true}>{placeholder.slice(1)}</Text></> : <Text dimColor={true}>{placeholder}</Text>}</> : query ? <Text>{query}</Text> : <Text>{placeholder}</Text>;
    // $[0] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = isFocused;
    // $[1] 缓存 `isTerminalFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isTerminalFocused;
    // $[2] 缓存 `offset`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = offset;
    // $[3] 缓存 `placeholder`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = placeholder;
    // $[4] 缓存 `query`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = query;
    // $[5] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[5];
  }
  // t10 暂存 `<Text dimColor={t8}>{prefix}{" "}{t9}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== prefix || $[7] !== t8 || $[8] !== t9) {
    // t10 暂存 `<Text dimColor={t8}>{prefix}{" "}{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={t8}>{prefix}{" "}{t9}</Text>;
    // $[6] 缓存 `prefix`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = prefix;
    // $[7] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t8;
    // $[8] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t9;
    // $[9] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[9];
  }
  // t11 暂存 `<Box flexShrink={0} borderStyle={t4} borderColor={t5} bor...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t10 || $[11] !== t4 || $[12] !== t5 || $[13] !== t6 || $[14] !== t7 || $[15] !== width) {
    // t11 暂存 `<Box flexShrink={0} borderStyle={t4} borderColor={t5} bor...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexShrink={0} borderStyle={t4} borderColor={t5} borderDimColor={t6} paddingX={t7} width={width}>{t10}</Box>;
    // $[10] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t10;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
    // $[15] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = width;
    // $[16] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[16];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJQcm9wcyIsInF1ZXJ5IiwicGxhY2Vob2xkZXIiLCJpc0ZvY3VzZWQiLCJpc1Rlcm1pbmFsRm9jdXNlZCIsInByZWZpeCIsIndpZHRoIiwiY3Vyc29yT2Zmc2V0IiwiYm9yZGVybGVzcyIsIlNlYXJjaEJveCIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwidW5kZWZpbmVkIiwib2Zmc2V0IiwibGVuZ3RoIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5Iiwic2xpY2UiLCJjaGFyQXQiLCJ0MTAiLCJ0MTEiXSwic291cmNlcyI6WyJTZWFyY2hCb3gudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgcXVlcnk6IHN0cmluZ1xuICBwbGFjZWhvbGRlcj86IHN0cmluZ1xuICBpc0ZvY3VzZWQ6IGJvb2xlYW5cbiAgaXNUZXJtaW5hbEZvY3VzZWQ6IGJvb2xlYW5cbiAgcHJlZml4Pzogc3RyaW5nXG4gIHdpZHRoPzogbnVtYmVyIHwgc3RyaW5nXG4gIGN1cnNvck9mZnNldD86IG51bWJlclxuICBib3JkZXJsZXNzPzogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gU2VhcmNoQm94KHtcbiAgcXVlcnksXG4gIHBsYWNlaG9sZGVyID0gJ1NlYXJjaOKApicsXG4gIGlzRm9jdXNlZCxcbiAgaXNUZXJtaW5hbEZvY3VzZWQsXG4gIHByZWZpeCA9ICfijJUnLFxuICB3aWR0aCxcbiAgY3Vyc29yT2Zmc2V0LFxuICBib3JkZXJsZXNzID0gZmFsc2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IG9mZnNldCA9IGN1cnNvck9mZnNldCA/PyBxdWVyeS5sZW5ndGhcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhTaHJpbms9ezB9XG4gICAgICBib3JkZXJTdHlsZT17Ym9yZGVybGVzcyA/IHVuZGVmaW5lZCA6ICdyb3VuZCd9XG4gICAgICBib3JkZXJDb2xvcj17aXNGb2N1c2VkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfVxuICAgICAgYm9yZGVyRGltQ29sb3I9eyFpc0ZvY3VzZWR9XG4gICAgICBwYWRkaW5nWD17Ym9yZGVybGVzcyA/IDAgOiAxfVxuICAgICAgd2lkdGg9e3dpZHRofVxuICAgID5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNGb2N1c2VkfT5cbiAgICAgICAge3ByZWZpeH17JyAnfVxuICAgICAgICB7aXNGb2N1c2VkID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICB7cXVlcnkgPyAoXG4gICAgICAgICAgICAgIGlzVGVybWluYWxGb2N1c2VkID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8VGV4dD57cXVlcnkuc2xpY2UoMCwgb2Zmc2V0KX08L1RleHQ+XG4gICAgICAgICAgICAgICAgICA8VGV4dCBpbnZlcnNlPlxuICAgICAgICAgICAgICAgICAgICB7b2Zmc2V0IDwgcXVlcnkubGVuZ3RoID8gcXVlcnlbb2Zmc2V0XSA6ICcgJ31cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgIHtvZmZzZXQgPCBxdWVyeS5sZW5ndGggJiYgKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dD57cXVlcnkuc2xpY2Uob2Zmc2V0ICsgMSl9PC9UZXh0PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8VGV4dD57cXVlcnl9PC9UZXh0PlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApIDogaXNUZXJtaW5hbEZvY3VzZWQgPyAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPFRleHQgaW52ZXJzZT57cGxhY2Vob2xkZXIuY2hhckF0KDApfTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57cGxhY2Vob2xkZXIuc2xpY2UoMSl9PC9UZXh0PlxuICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntwbGFjZWhvbGRlcn08L1RleHQ+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogcXVlcnkgPyAoXG4gICAgICAgICAgPFRleHQ+e3F1ZXJ5fTwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8VGV4dD57cGxhY2Vob2xkZXJ9PC9UZXh0PlxuICAgICAgICApfVxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBRXJDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxLQUFLLEVBQUUsTUFBTTtFQUNiQyxXQUFXLENBQUMsRUFBRSxNQUFNO0VBQ3BCQyxTQUFTLEVBQUUsT0FBTztFQUNsQkMsaUJBQWlCLEVBQUUsT0FBTztFQUMxQkMsTUFBTSxDQUFDLEVBQUUsTUFBTTtFQUNmQyxLQUFLLENBQUMsRUFBRSxNQUFNLEdBQUcsTUFBTTtFQUN2QkMsWUFBWSxDQUFDLEVBQUUsTUFBTTtFQUNyQkMsVUFBVSxDQUFDLEVBQUUsT0FBTztBQUN0QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxVQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQW1CO0lBQUFYLEtBQUE7SUFBQUMsV0FBQSxFQUFBVyxFQUFBO0lBQUFWLFNBQUE7SUFBQUMsaUJBQUE7SUFBQUMsTUFBQSxFQUFBUyxFQUFBO0lBQUFSLEtBQUE7SUFBQUMsWUFBQTtJQUFBQyxVQUFBLEVBQUFPO0VBQUEsSUFBQUwsRUFTbEI7RUFQTixNQUFBUixXQUFBLEdBQUFXLEVB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