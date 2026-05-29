// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// ChannelDowngradeChoice 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelDowngradeChoice = 'downgrade' | 'stay' | 'cancel';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  currentVersion: string;
  // 这个回调绑定到 onChoice: (choice: ChannelDowngradeChoice) => void;，负责终端渲染在该局部场景下的响应。
  onChoice: (choice: ChannelDowngradeChoice) => void;
};

/**
 * Dialog shown when switching from latest to stable channel.
 * Allows user to choose whether to downgrade or stay on current version.
 */
// ChannelDowngradeDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ChannelDowngradeDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentVersion,
    onChoice
  } = t0;
  // t1 暂存 `function handleSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onChoice) {
    // t1 暂存 `function handleSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function handleSelect(value) {
      // 调用 onChoice，触发终端渲染此处需要的副作用。
      onChoice(value);
    };
    // $[0] 缓存 `onChoice`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onChoice;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // handleSelect保存`t1`，作为后续临时缓存值处理的输入。
  const handleSelect = t1;
  // t2 暂存 `function handleCancel() {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onChoice) {
    // t2 暂存 `function handleCancel() {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function handleCancel() {
      // 调用 onChoice，触发终端渲染此处需要的副作用。
      onChoice("cancel");
    };
    // $[2] 缓存 `onChoice`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onChoice;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // handleCancel保存`t2`，作为后续临时缓存值处理的输入。
  const handleCancel = t2;
  // t3 暂存 `<Text>The stable channel may have an older version than w...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== currentVersion) {
    // t3 暂存 `<Text>The stable channel may have an older version than w...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>The stable channel may have an older version than what you're currently running ({currentVersion}).</Text>;
    // $[4] 缓存 `currentVersion`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = currentVersion;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4暂存 `<Text dimColor={true}>How would you like to handle this?<...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // 判断 $[6] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t4暂存 `<Text dimColor={true}>How would you like to handle this?<...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text dimColor={true}>How would you like to handle this?</Text>;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // 判断 $[7] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      label: "Allow possible downgrade to stable version",
      value: "downgrade" as ChannelDowngradeChoice
    };
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // 临时值 t6保存`version`，供终端渲染后续处理使用。
  const t6 = `Stay on current version (${currentVersion}) until stable catches up`;
  // t7暂存 `[t5, {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t6) {
    // t7暂存 `[t5, {` 生成的渲染片段，后续返回路径直接复用。
    t7 = [t5, {
      label: t6,
      value: "stay" as ChannelDowngradeChoice
    }];
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // t8暂存 `<Select options={t7} onChange={handleSelect} />` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== handleSelect || $[11] !== t7) {
    // t8暂存 `<Select options={t7} onChange={handleSelect} />` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Select options={t7} onChange={handleSelect} />;
    // $[10] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleSelect;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // t9暂存 `<Dialog title="Switch to Stable Channel" onCancel={handle...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== handleCancel || $[14] !== t3 || $[15] !== t8) {
    // t9暂存 `<Dialog title="Switch to Stable Channel" onCancel={handle...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Dialog title="Switch to Stable Channel" onCancel={handleCancel} color="permission" hideBorder={true} hideInputGuide={true}>{t3}{t4}{t8}</Dialog>;
    // $[13] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = handleCancel;
    // $[14] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t3;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
  } else {
    // t9从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[16];
  }
  // 返回 t9，把终端渲染这个分支的结果交还调用方。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJTZWxlY3QiLCJEaWFsb2ciLCJDaGFubmVsRG93bmdyYWRlQ2hvaWNlIiwiUHJvcHMiLCJjdXJyZW50VmVyc2lvbiIsIm9uQ2hvaWNlIiwiY2hvaWNlIiwiQ2hhbm5lbERvd25ncmFkZURpYWxvZyIsInQwIiwiJCIsIl9jIiwidDEiLCJoYW5kbGVTZWxlY3QiLCJ2YWx1ZSIsInQyIiwiaGFuZGxlQ2FuY2VsIiwidDMiLCJ0NCIsIlN5bWJvbCIsImZvciIsInQ1IiwibGFiZWwiLCJ0NiIsInQ3IiwidDgiLCJ0OSJdLCJzb3VyY2VzIjpbIkNoYW5uZWxEb3duZ3JhZGVEaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5cbmV4cG9ydCB0eXBlIENoYW5uZWxEb3duZ3JhZGVDaG9pY2UgPSAnZG93bmdyYWRlJyB8ICdzdGF5JyB8ICdjYW5jZWwnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmdcbiAgb25DaG9pY2U6IChjaG9pY2U6IENoYW5uZWxEb3duZ3JhZGVDaG9pY2UpID0+IHZvaWRcbn1cblxuLyoqXG4gKiBEaWFsb2cgc2hvd24gd2hlbiBzd2l0Y2hpbmcgZnJvbSBsYXRlc3QgdG8gc3RhYmxlIGNoYW5uZWwuXG4gKiBBbGxvd3MgdXNlciB0byBjaG9vc2Ugd2hldGhlciB0byBkb3duZ3JhZGUgb3Igc3RheSBvbiBjdXJyZW50IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBDaGFubmVsRG93bmdyYWRlRGlhbG9nKHtcbiAgY3VycmVudFZlcnNpb24sXG4gIG9uQ2hvaWNlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBmdW5jdGlvbiBoYW5kbGVTZWxlY3QodmFsdWU6IENoYW5uZWxEb3duZ3JhZGVDaG9pY2UpOiB2b2lkIHtcbiAgICBvbkNob2ljZSh2YWx1ZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNhbmNlbCgpOiB2b2lkIHtcbiAgICBvbkNob2ljZSgnY2FuY2VsJylcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJTd2l0Y2ggdG8gU3RhYmxlIENoYW5uZWxcIlxuICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgIGNvbG9yPVwicGVybWlzc2lvblwiXG4gICAgICBoaWRlQm9yZGVyXG4gICAgICBoaWRlSW5wdXRHdWlkZVxuICAgID5cbiAgICAgIDxUZXh0PlxuICAgICAgICBUaGUgc3RhYmxlIGNoYW5uZWwgbWF5IGhhdmUgYW4gb2xkZXIgdmVyc2lvbiB0aGFuIHdoYXQgeW91JmFwb3M7cmVcbiAgICAgICAgY3VycmVudGx5IHJ1bm5pbmcgKHtjdXJyZW50VmVyc2lvbn0pLlxuICAgICAgPC9UZXh0PlxuICAgICAgPFRleHQgZGltQ29sb3I+SG93IHdvdWxkIHlvdSBsaWtlIHRvIGhhbmRsZSB0aGlzPzwvVGV4dD5cbiAgICAgIDxTZWxlY3RcbiAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQWxsb3cgcG9zc2libGUgZG93bmdyYWRlIHRvIHN0YWJsZSB2ZXJzaW9uJyxcbiAgICAgICAgICAgIHZhbHVlOiAnZG93bmdyYWRlJyBhcyBDaGFubmVsRG93bmdyYWRlQ2hvaWNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IGBTdGF5IG9uIGN1cnJlbnQgdmVyc2lvbiAoJHtjdXJyZW50VmVyc2lvbn0pIHVudGlsIHN0YWJsZSBjYXRjaGVzIHVwYCxcbiAgICAgICAgICAgIHZhbHVlOiAnc3RheScgYXMgQ2hhbm5lbERvd25ncmFkZUNob2ljZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdfVxuICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0fVxuICAgICAgLz5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFDaEMsU0FBU0MsTUFBTSxRQUFRLHlCQUF5QjtBQUNoRCxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBRWxELE9BQU8sS0FBS0Msc0JBQXNCLEdBQUcsV0FBVyxHQUFHLE1BQU0sR0FBRyxRQUFRO0FBRXBFLEtBQUtDLEtBQUssR0FBRztFQUNYQyxjQUFjLEVBQUUsTUFBTTtFQUN0QkMsUUFBUSxFQUFFLENBQUNDLE1BQU0sRUFBRUosc0JBQXNCLEVBQUUsR0FBRyxJQUFJO0FBQ3BELENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFLLHVCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdDO0lBQUFOLGNBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUcvQjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFKLFFBQUE7SUFDTk0sRUFBQSxZQUFBQyxhQUFBQyxLQUFBO01BQ0VSLFFBQVEsQ0FBQ1EsS0FBSyxDQUFDO0lBQUEsQ0FDaEI7SUFBQUosQ0FBQSxNQUFBSixRQUFBO0lBQUFJLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBRkQsTUFBQUcsWUFBQSxHQUFBRCxFQUVDO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFMLENBQUEsUUFBQUosUUFBQTtJQUVEUyxFQUFBLFlBQUFDLGFBQUE7TUFDRVYsUUFBUSxDQUFDLFFBQVEsQ0FBQztJQUFBLENBQ25CO0lBQUFJLENBQUEsTUFBQUosUUFBQTtJQUFBSSxDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUZELE1BQUFNLFlBQUEsR0FBQUQsRUFFQztFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBUCxDQUFBLFFBQUFMLGNBQUE7SUFVR1ksRUFBQSxJQUFDLElBQUksQ0FBQyxpRkFFZ0JaLGVBQWEsQ0FBRSxFQUNyQyxFQUhDLElBQUksQ0FHRTtJQUFBSyxDQUFBLE1BQUFMLGNBQUE7SUFBQUssQ0FBQSxNQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxJQUFBUSxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBUyxNQUFBLENBQUFDLEdBQUE7SUFDUEYsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsa0NBQWtDLEVBQWhELElBQUksQ0FBbUQ7SUFBQVIsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBUyxNQUFBLENBQUFDLEdBQUE7SUFHcERDLEVBQUE7TUFBQUMsS0FBQSxFQUNTLDRDQUE0QztNQUFBUixLQUFBLEVBQzVDLFdBQVcsSUFBSVg7SUFDeEIsQ0FBQztJQUFBTyxDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFYLENBQUE7RUFBQTtFQUVRLE1BQUFhLEVBQUEsK0JBQTRCbEIsY0FBYywyQkFBMkI7RUFBQSxJQUFBbUIsRUFBQTtFQUFBLElBQUFkLENBQUEsUUFBQWEsRUFBQTtJQU52RUMsRUFBQSxJQUNQSCxFQUdDLEVBQ0Q7TUFBQUMsS0FBQSxFQUNTQyxFQUFxRTtNQUFBVCxLQUFBLEVBQ3JFLE1BQU0sSUFBSVg7SUFDbkIsQ0FBQyxDQUNGO0lBQUFPLENBQUEsTUFBQWEsRUFBQTtJQUFBYixDQUFBLE1BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUFBLElBQUFlLEVBQUE7RUFBQSxJQUFBZixDQUFBLFNBQUFHLFlBQUEsSUFBQUgsQ0FBQSxTQUFBYyxFQUFBO0lBVkhDLEVBQUEsSUFBQyxNQUFNLENBQ0ksT0FTUixDQVRRLENBQUFELEVBU1QsQ0FBQyxDQUNTWCxRQUFZLENBQVpBLGFBQVcsQ0FBQyxHQUN0QjtJQUFBSCxDQUFBLE9BQUFHLFlBQUE7SUFBQUgsQ0FBQSxPQUFBYyxFQUFBO0lBQUFkLENBQUEsT0FBQWUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWYsQ0FBQTtFQUFBO0VBQUEsSUFBQWdCLEVBQUE7RUFBQSxJQUFBaEIsQ0FBQSxTQUFBTSxZQUFBLElBQUFOLENBQUEsU0FBQU8sRUFBQSxJQUFBUCxDQUFBLFNBQUFlLEVBQUE7SUF4QkpDLEVBQUEsSUFBQyxNQUFNLENBQ0MsS0FBMEIsQ0FBMUIsMEJBQTBCLENBQ3RCVixRQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNoQixLQUFZLENBQVosWUFBWSxDQUNsQixVQUFVLENBQVYsS0FBUyxDQUFDLENBQ1YsY0FBYyxDQUFkLEtBQWEsQ0FBQyxDQUVkLENBQUFDLEVBR00sQ0FDTixDQUFBQyxFQUF1RCxDQUN2RCxDQUFBTyxFQVlDLENBQ0gsRUF6QkMsTUFBTSxDQXlCRTtJQUFBZixDQUFBLE9BQUFNLFlBQUE7SUFBQU4sQ0FBQSxPQUFBTyxFQUFBO0lBQUFQLENBQUEsT0FBQWUsRUFBQTtJQUFBZixDQUFBLE9BQUFnQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBaEIsQ0FBQTtFQUFBO0VBQUEsT0F6QlRnQixFQXlCUztBQUFBIiwiaWdub3JlTGlzdCI6W119