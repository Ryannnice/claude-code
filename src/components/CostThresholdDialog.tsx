// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../ink.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
};
// CostThresholdDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CostThresholdDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // t1 暂存 `<Box flexDirection="column"><Text>Learn more about how to...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box flexDirection="column"><Text>Learn more about how to...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box flexDirection="column"><Text>Learn more about how to monitor your spending:</Text><Link url="https://code.claude.com/docs/en/costs" /></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t2 = [{
      value: "ok",
      label: "Got it, thanks!"
    }];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `<Select options={t2} onChange={onDone} />` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onDone) {
    // t3 暂存 `<Select options={t2} onChange={onDone} />` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Select options={t2} onChange={onDone} />;
    // $[2] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onDone;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `<Dialog title="You've spent $5 on the Anthropic API this ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== onDone || $[5] !== t3) {
    // t4 暂存 `<Dialog title="You've spent $5 on the Anthropic API this ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Dialog title="You've spent $5 on the Anthropic API this session." onCancel={onDone}>{t1}{t3}</Dialog>;
    // $[4] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onDone;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIkxpbmsiLCJUZXh0IiwiU2VsZWN0IiwiRGlhbG9nIiwiUHJvcHMiLCJvbkRvbmUiLCJDb3N0VGhyZXNob2xkRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsInQyIiwidmFsdWUiLCJsYWJlbCIsInQzIiwidDQiXSwic291cmNlcyI6WyJDb3N0VGhyZXNob2xkRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIExpbmssIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uRG9uZTogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gQ29zdFRocmVzaG9sZERpYWxvZyh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJZb3UndmUgc3BlbnQgJDUgb24gdGhlIEFudGhyb3BpYyBBUEkgdGhpcyBzZXNzaW9uLlwiXG4gICAgICBvbkNhbmNlbD17b25Eb25lfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5MZWFybiBtb3JlIGFib3V0IGhvdyB0byBtb25pdG9yIHlvdXIgc3BlbmRpbmc6PC9UZXh0PlxuICAgICAgICA8TGluayB1cmw9XCJodHRwczovL2NvZGUuY2xhdWRlLmNvbS9kb2NzL2VuL2Nvc3RzXCIgLz5cbiAgICAgIDwvQm94PlxuICAgICAgPFNlbGVjdFxuICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6ICdvaycsXG4gICAgICAgICAgICBsYWJlbDogJ0dvdCBpdCwgdGhhbmtzIScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXX1cbiAgICAgICAgb25DaGFuZ2U9e29uRG9uZX1cbiAgICAgIC8+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUMzQyxTQUFTQyxNQUFNLFFBQVEseUJBQXlCO0FBQ2hELFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFFbEQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE1BQU0sRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUNwQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxvQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE2QjtJQUFBSjtFQUFBLElBQUFFLEVBQWlCO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBTS9DRixFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUMsSUFBSSxDQUFDLDhDQUE4QyxFQUFuRCxJQUFJLENBQ0wsQ0FBQyxJQUFJLENBQUssR0FBdUMsQ0FBdkMsdUNBQXVDLEdBQ25ELEVBSEMsR0FBRyxDQUdFO0lBQUFGLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFMLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBRUtDLEVBQUEsSUFDUDtNQUFBQyxLQUFBLEVBQ1MsSUFBSTtNQUFBQyxLQUFBLEVBQ0o7SUFDVCxDQUFDLENBQ0Y7SUFBQVAsQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxJQUFBUSxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBSCxNQUFBO0lBTkhXLEVBQUEsSUFBQyxNQUFNLENBQ0ksT0FLUixDQUxRLENBQUFILEVBS1QsQ0FBQyxDQUNTUixRQUFNLENBQU5BLE9BQUssQ0FBQyxHQUNoQjtJQUFBRyxDQUFBLE1BQUFILE1BQUE7SUFBQUcsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBSCxNQUFBLElBQUFHLENBQUEsUUFBQVEsRUFBQTtJQWhCSkMsRUFBQSxJQUFDLE1BQU0sQ0FDQyxLQUFvRCxDQUFwRCxvREFBb0QsQ0FDaERaLFFBQU0sQ0FBTkEsT0FBSyxDQUFDLENBRWhCLENBQUFLLEVBR0ssQ0FDTCxDQUFBTSxFQVFDLENBQ0gsRUFqQkMsTUFBTSxDQWlCRTtJQUFBUixDQUFBLE1BQUFILE1BQUE7SUFBQUcsQ0FBQSxNQUFBUSxFQUFBO0lBQUFSLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsT0FqQlRTLEVBaUJTO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=